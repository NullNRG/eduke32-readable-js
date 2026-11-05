"""Compact private continuation of active work; no discarded source or fresh start."""
import argparse,gzip,json,re,sys
from datetime import datetime
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'tools'))
import project_workspace as package_tool

def selected(root,public=False):
    if public:raise ValueError('This private continuation includes the supplied GRP; use the public source workflow for publication')
    root=Path(root).resolve();chosen=set()
    def add(path):
        if not path.is_file() or path.is_symlink():return
        if not path.resolve().is_relative_to(root):raise ValueError('Continuation input escapes canonical project')
        rel=path.relative_to(root)
        if any(part in package_tool.EXCLUDED_PARTS for part in rel.parts):return
        if path.suffix.lower() in package_tool.BINARY_SUFFIXES or path.name.endswith(('.partial','.tmp','-wal','-shm')):return
        chosen.add(path)
    def tree(relative):
        for path in (root/relative).rglob('*'):add(path)
    for relative in ('tools','runtime','tests','licenses','input-source','factory-output/source-tree','factory-output/browser-classic'):
        tree(relative)
    for name in ('.gitignore','.gitattributes','README.md','README_SOURCE_FACTORY.md','CURRENT_PORT_STATUS.md',
                 'CONTINUE_HERE.md','LLM_CONTINUATION_PROMPT.md','HANDOFF_SNAPSHOT.json','BUILD_PORTABILITY.md','BROWSER_SERVICES.md',
                 'package.json','package-lock.json','dev-requirements.txt','eslint.config.mjs','index.html',
                 'launch-project.cmd','launch-project.ps1','engine-startup.html','ENGINEERING_CHECKPOINT.md'):
        add(root/name)
    add(root/'input-data/DUKE3D.GRP');add(root/'factory-output/compile_commands.json')
    add(root/'reports/history/original-source-manifests-20261014.zip')
    profile=json.loads((root/'tools/browser_classic_profile.json').read_text())
    state=json.loads((root/'reports/project-current-status.json').read_text())
    semantic_payload=root/'reports/semantic-browser-checkpoint/index.jsonl.gz'
    metadata=json.loads(semantic_payload.with_suffix('.json').read_text())
    with gzip.open(semantic_payload,'rt',encoding='utf-8') as stream:header=json.loads(next(stream))
    if not (metadata.get('semantic_fingerprint')==header.get('semantic_fingerprint')==(state.get('semantic_index',{}).get('fingerprint') or state.get('semantic_fingerprint'))):
        raise ValueError('Semantic export and current snapshot differ; refresh the export/status before packaging')
    roots={profile['build_root'],profile['migration_input'],*state.get('continuation_artifact_roots',[])}
    for relative in roots:
        folder=package_tool.safe_path(root,relative)
        for path in folder.rglob('*'):
            if any(part in ('boot-probes','byte-debug','owner-history','owner-rebuilds','owner-function-rebuilds','storage-rebuilds') for part in path.relative_to(folder).parts):continue
            if path.suffix in ('.mjs','.json','.csv','.md','.wasm','.symbols') and path.is_file() and path.stat().st_size<80_000_000:add(path)
    # Retain the actual manifests referenced by the current frontier reports,
    # without copying every superseded recovery stage or raw AST database.
    for frontier in (root/profile['build_root']/'reports').glob('frontier-*.json'):
        doc=json.loads(frontier.read_text())
        if not doc.get('manifest'):continue
        manifest=package_tool.safe_path(root,doc['manifest']);add(manifest)
        add(manifest.with_name(manifest.name.removesuffix('.manifest.json')+'.mjs'))
    # Retain any actual source imports outside these roots, not every obsolete
    # build epoch. Every imported module stays under the canonical project.
    # Owner recompilation leaves immutable historical fragments on disk.
    # Retain only fragments referenced by actual current facades/providers.
    legacy={p for p in chosen if p.name.startswith('_source_legacy_') and p.suffix=='.mjs'}
    chosen.difference_update(legacy)
    pending=[p for p in chosen if p.suffix=='.mjs' and
        (p.is_relative_to(root/'runtime') or p.is_relative_to(root/'factory-output/source-first'))];seen=set()
    pattern=re.compile(r'(?m)^\s*(?:import|export)\b[^;\n]*?\bfrom\s*[\'\"](\.{1,2}/[^\'\"]+)[\'\"]')
    while pending:
        module=pending.pop()
        if module in seen:continue
        seen.add(module)
        for relative in pattern.findall(module.read_text(encoding='utf-8')):
            target=(module.parent/relative).resolve()
            if not target.is_relative_to(root):raise ValueError('Source import escapes continuation: '+str(module))
            if not target.is_file():raise ValueError('Missing saved source import in '+str(module.relative_to(root))+': '+str(target))
            if target not in chosen:add(target);add(target.with_suffix('.manifest.json'));pending.append(target)
    for path in (root/'work').iterdir():
        if path.suffix in ('.py','.ps1','.mjs','.cjs','.sh','.md') and not path.name.endswith('_draft.py'):add(path)
        elif path.suffix=='.json' and path.stat().st_size<1_000_000 and 'ast' not in path.name.lower():add(path)
    for path in (root/'reports').rglob('*'):
        if not path.is_file():continue
        relative=path.relative_to(root/'reports')
        if (relative.parts[0]=='semantic-browser-checkpoint' or path.name.startswith(('oct29-','oct30-','oct31-','nov01-','nov02-','nov03-','nov04-','nov05-','project-current-status'))
                or relative.parts[0] in ('native-oracle','semantic-continuation','evidence')):
            if path.suffix in ('.json','.gz','.log','.md','.png'):add(path)
    add(root/'reports/historical-latest/dependency-graph.json')
    add(root/'reports/port-acceptance.json')
    add(root/profile['engine_execution_report'])
    for name in ('oct25-original-libdivide-parity.json','oct27-original-xxhash-parity.json'):
        add(root/'reports'/name)
    return sorted(chosen)

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--out',type=Path,default=ROOT/('handoffs/EDuke32_JS_Continuation_'+datetime.now().strftime('%Y-%m-%d_%H%M%S')+'.zip'))
    parser.add_argument('--list-only',action='store_true')
    args=parser.parse_args()
    if args.list_only:
        files=selected(ROOT);print(json.dumps({'files':len(files),'uncompressed_bytes':sum(p.stat().st_size for p in files),
            'selected_source_roots':json.loads((ROOT/'reports/project-current-status.json').read_text()).get('continuation_artifact_roots',[]),
            'gameplay_verified':False},indent=2))
    else:
        package_tool.package_files=selected
        # The archive and incremental compiler share one component lock. This
        # prevents a fragment/owner replacement from splitting a saved graph.
        from source_ast_stream import _cache_lock
        profile=json.loads((ROOT/'tools/browser_classic_profile.json').read_text())
        with _cache_lock(ROOT/profile['build_root']/'component-build-lock'):
            print(json.dumps(package_tool.package(ROOT,args.out.resolve()),indent=2))
