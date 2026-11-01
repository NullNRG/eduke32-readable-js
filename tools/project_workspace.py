"""Conservative project cleanup and portable continuation archives.

Generated caches may be removed; original inputs and emitted source epochs stay.
Archives are checkpoints of work, never assertions that the game is playable.
"""
from __future__ import annotations
import argparse, hashlib, json, os, zipfile
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CLEANABLE = {
    'work/ast-cache-engine-pools': 'Rebuildable historical Clang AST cache',
    'work/ast-cache-boot-probes': 'Rebuildable historical Clang AST cache',
    'work/original-aggregate-storage-cache': 'Rebuildable historical Clang AST cache',
    'work/ast-cache-clock': 'Rebuildable historical Clang AST cache',
    'work/semantic-index-original-mixed-resource.zip': 'Superseded mixed-resource semantic index; current index retained',
    'reports/semantic-probe.sqlite': 'Early semantic probe; current complete unit index retained',
}
EXCLUDED_PARTS = {'__pycache__', 'node_modules', 'clang-ast-cache', '.git', 'probes'}
BINARY_SUFFIXES = {'.pyc', '.exe', '.dll', '.o', '.obj', '.lib', '.a', '.so', '.dylib', '.pdb', '.bc', '.ll', '.sqlite'}

def sha(path):
    h = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024*1024), b''): h.update(block)
    return h.hexdigest()

def save(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_suffix(path.suffix+'.partial')
    temp.write_text(json.dumps(value, indent=2)+'\n', encoding='utf-8')
    temp.replace(path)

def safe_path(root, relative):
    root = root.resolve(); path = root / relative
    linked=lambda p:p.is_symlink() or getattr(p,'is_junction',lambda:False)()
    if linked(path) or any(linked(p) for p in path.parents if p != root and root in p.parents):
        raise ValueError('Refusing linked workspace path: '+relative)
    resolved = path.resolve()
    if resolved == root or not resolved.is_relative_to(root): raise ValueError('Path escapes project')
    return resolved

def cleanup_plan(root=ROOT):
    rows = []
    for relative, reason in CLEANABLE.items():
        path = safe_path(root, relative)
        files = sorted(path.rglob('*')) if path.is_dir() else [path]
        files = [p for p in files if p.is_file()]
        for p in files:
            if p.is_symlink() or not p.resolve().is_relative_to(root.resolve()): raise ValueError('Linked cleanup candidate')
        if files: rows.append({'path': relative, 'reason': reason, 'bytes': sum(p.stat().st_size for p in files), 'files': len(files)})
    return {'format': 'sourcefactory-cleanup-plan/1', 'candidates': rows, 'bytes': sum(r['bytes'] for r in rows),
        'retained': ['Original source and GRPs', 'Current semantic index', 'Current compiler caches', 'Emitted modules and checkpoints', 'Installed toolchains'],
        'rebuild': 'Original capture/diagnostic scripts regenerate their optional AST caches; tools/source_semantic_index.py regenerates semantic data.'}

def cleanup(root=ROOT):
    # Only this fixed allowlist can be deleted, never paths supplied by HTTP.
    import shutil
    plan = cleanup_plan(root)
    save(root/'reports/project-cleanup-plan.json', plan)
    removed = []
    for row in plan['candidates']:
        path = safe_path(root, row['path'])
        if path.is_dir(): shutil.rmtree(path)
        else: path.unlink()
        removed.append(row)
    report = {**plan, 'removed': removed, 'removed_bytes': sum(r['bytes'] for r in removed), 'completed_utc': datetime.now(timezone.utc).isoformat()}
    save(root/'reports/project-cleanup.json', report)
    return report

def package_files(root=ROOT, public=False):
    chosen = set()
    def add(path):
        rel = path.relative_to(root)
        if not path.is_file() or path.is_symlink() or any(x in EXCLUDED_PARTS for x in rel.parts): return
        if path.suffix.lower() in BINARY_SUFFIXES or path.name.endswith(('.partial', '.tmp', '-wal', '-shm')): return
        if not path.resolve().is_relative_to(root.resolve()): raise ValueError('Linked package input')
        chosen.add(path)
    for name in ('tools', 'runtime', 'tests', 'licenses', 'input-source', 'factory-output/source-tree'):
        for path in (root/name).rglob('*'): add(path)
    for path in root.iterdir():
        if path.suffix.lower() in ('.md', '.json', '.html', '.mjs', '.txt', '.cmd', '.ps1'): add(path)
    if not public: add(root/'input-data/DUKE3D.GRP')
    add(root/'factory-output/compile_commands.json')
    # The declaration comparison's immutable baseline is a build input, even
    # though redundant historical report copies are otherwise excluded.
    add(root/'reports/historical-latest/dependency-graph.json')
    add(root/'reports/history/original-source-manifests-20261014.zip')
    # Current source-wide evidence is required even when larger than the
    # optional diagnostic size cap below.
    for name in ('all-blockers.json', 'all-blockers.csv', 'root-causes.json',
                 'dependency-graph.json', 'boot-blockers.json'):
        add(root/'reports'/name)
    # Preserve every existing source epoch needed by incremental composition;
    # exclude raw ASTs, toolchains, experiments and copied project trees.
    for path in (root/'factory-output/source-first').rglob('*'):
        if path.suffix in ('.mjs', '.json') and path.stat().st_size < 40_000_000: add(path)
    for path in (root/'work').iterdir():
        if path.suffix in ('.py', '.ps1', '.json', '.mjs', '.cjs', '.md', '.sh'): add(path)
    for path in (root/'reports').rglob('*'):
        rel = path.relative_to(root/'reports')
        if rel.parts[0] in ('history', 'historical', 'historical-latest', 'project-jobs'): continue
        if path.suffix in ('.json', '.csv', '.md', '.png', '.log', '.gz') and path.is_file() and path.stat().st_size < 40_000_000: add(path)
    # Include a true game if produced; keep the original-entry diagnostic labelled.
    # The diagnostic HTML embeds the supplied GRP. Public archives exclude
    # all dist pages until a separately verified asset-free player exists.
    if not public:
        for name in ('index.html', 'original-entry-attempt.html'): add(root/'dist'/name)
    if public:
        chosen={p for p in chosen if p.suffix.lower()!='.grp'}
        # Generated diagnostics may contain a base64-embedded full GRP even
        # when named as source or a report. Fail closed instead of silently
        # publishing a candidate with the archive's identifying base64 header.
        marker=b'S2VuU2lsdmVybWFu'
        for path in chosen:
            if path.stat().st_size < 1_000_000 or path.suffix.lower() == '.zip': continue
            with path.open('rb') as stream:
                tail=b''
                for block in iter(lambda:stream.read(1024*1024),b''):
                    data=tail+block
                    if marker in data:raise ValueError('Possible embedded GRP data in public package: '+str(path.relative_to(root)))
                    tail=data[-(len(marker)-1):]
    return sorted(chosen)

def package(root=ROOT, output=None, public=False):
    label='EDuke32_Public_Source_' if public else 'EDuke32_Continuation_'
    output = output or root/'handoffs'/(label+datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')+'.zip')
    output = output.resolve(); output.parent.mkdir(parents=True, exist_ok=True)
    files = package_files(root, public=public)
    if output in files: raise ValueError('Output would replace an input')
    manifest = []
    temp = output.with_suffix('.zip.partial')
    try:
        with zipfile.ZipFile(temp, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
            for path in files:
                relative = path.relative_to(root).as_posix()
                before = path.stat(); digest = sha(path)
                archive.write(path, 'EDuke32_SourceFactory/'+relative)
                after = path.stat()
                if (before.st_size,before.st_mtime_ns) != (after.st_size,after.st_mtime_ns): raise RuntimeError('Input changed during handoff: '+relative)
                manifest.append({'path': relative, 'bytes': after.st_size, 'sha256': digest})
            state = {'format': 'sourcefactory-continuation-package/1', 'mode': 'public-source' if public else 'continuation', 'created_utc': datetime.now(timezone.utc).isoformat(),
                'gameplay_verified': False, 'game_file_present': (root/'dist/index.html').is_file(),
                'read_first': ['CONTINUE_HERE.md', 'CURRENT_PORT_STATUS.md', 'reports/project-current-status.json'],
                'resume': 'npm run serve:project', 'compile': 'npm run compile:game',
                'excluded': ['Downloaded toolchains and dependencies (see BUILD_PORTABILITY.md)', 'Raw AST caches', 'Large semantic SQLite database (compact declarations retained)', 'Historical report copies', 'Copied experimental projects'] + (['GRP assets and generated dist pages'] if public else []),
                'files': manifest}
            archive.writestr('EDuke32_SourceFactory/CONTINUATION_MANIFEST.json', json.dumps(state,indent=2)+'\n')
        # Verify every archived payload against its source hash, not just ZIP CRC.
        with zipfile.ZipFile(temp) as archive:
            for row in manifest:
                h=hashlib.sha256()
                with archive.open('EDuke32_SourceFactory/'+row['path']) as stream:
                    for block in iter(lambda:stream.read(1024*1024),b''): h.update(block)
                if h.hexdigest()!=row['sha256']: raise RuntimeError('Archive integrity failure: '+row['path'])
        temp.replace(output)
    except Exception:
        temp.unlink(missing_ok=True); raise
    result={'path': str(output), 'bytes': output.stat().st_size, 'sha256': sha(output), 'files': len(manifest), 'payload_hashes_verified': True, 'gameplay_verified': False}
    save(root/('reports/project-public-source.json' if public else 'reports/project-handoff.json'),result)
    return result

def main():
    parser=argparse.ArgumentParser(); parser.add_argument('action',choices=('plan','clean','package')); parser.add_argument('--out',type=Path); parser.add_argument('--public',action='store_true',help='Exclude GRP data and generated dist pages from a public source archive')
    args=parser.parse_args()
    result=cleanup_plan() if args.action=='plan' else cleanup() if args.action=='clean' else package(output=args.out,public=args.public)
    print(json.dumps(result,indent=2))
if __name__=='__main__': main()
