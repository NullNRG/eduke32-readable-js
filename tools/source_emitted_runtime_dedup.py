#!/usr/bin/env python3
"""Share canonical source-first ABI helpers across transpiled EDuke32 ES modules.

This is an exact-byte, fail-closed generated-code linking pass. It NEVER
merges source-derived functions, globals, record storage, or source identities.
Run after compiler/linker output is finalized, or on a copied output tree.
"""
from __future__ import annotations

import argparse
from collections import Counter
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys

REPO = Path(__file__).resolve().parents[1]
MARKER = '// Source-first C/C++ -> JavaScript (original identifiers/structured statements).'
SHARED_DIR = '_source_shared'
EXPORT = re.compile(r'^(?:const|let|class|function)\s+([a-zA-Z_$][\w$]*)\b', re.M)

# Order is the EXACT injection order in source_ast_to_js.py. Never reorder
# evaluated initializers: the native-address ABI precedes C heap registration.
# Dependencies are lexical references in the canonical source, NOT guessed
# replacements for any original C/C++ functions.
HELPERS = (
    ('address', ('tools/source_address_runtime.mjs',), ()),
    ('c_heap', ('runtime/abi.mjs', 'tools/source_c_heap_runtime.mjs'),
     (('address', ('cSourceAddresses',)),)),
    ('lifetime', ('tools/source_cpp_lifetime_runtime.mjs',), ()),
    ('cpp_heap', ('tools/source_cpp_heap_runtime.mjs',), ()),
    ('pointer', ('tools/source_pointer_runtime.mjs',), ()),
    ('span', ('tools/source_pointer_span_runtime.mjs',), ()),
    ('aggregate', ('tools/source_aggregate_runtime.mjs',),
     (('address', ('cSourceAddresses',)), ('pointer', ('cPointer',)))),
    ('assignment', ('tools/source_aggregate_assignment_runtime.mjs',),
     (('aggregate', ('cCopyAggregate',)),)),
    ('variadic', ('tools/source_variadic_runtime.mjs',), ()),
    ('memory', ('tools/source_byte_memory_runtime.mjs',), ()),
    ('process', ('tools/source_process_runtime.mjs',), ()),
)

def hash_bytes(data):
    return hashlib.sha256(data.encode('utf-8')).hexdigest()

def canonical_source(paths, repo):
    if paths[0] == 'runtime/abi.mjs':
        source = (repo / paths[0]).read_text(encoding='utf-8')
        if source.count('export class ABIHeap') != 1:
            raise ValueError('Source ABIHeap export contract changed')
        source = source.replace('export class ABIHeap', 'class ABIHeap', 1)
        source += '\n' + (repo / paths[1]).read_text(encoding='utf-8') + '\n'
        return source
    if len(paths) != 1:
        raise ValueError('Unexpected canonical source layout')
    return (repo / paths[0]).read_text(encoding='utf-8') + '\n'

def catalogue(repo):
    result = {}
    for name, paths, deps in HELPERS:
        content = canonical_source(paths, repo)
        names = sorted(set(EXPORT.findall(content)))
        if not names:
            raise ValueError(f'No top-level bindings in {name}')
        result[name] = {'content': content, 'exports': names, 'deps': deps,
                        'sha256': hash_bytes(content), 'source': list(paths)}
    for name, info in result.items():
        for dependency, exports in info['deps']:
            if dependency not in result or not set(exports).issubset(result[dependency]['exports']):
                raise ValueError(f'Broken shared helper dependency: {name} -> {dependency}')
    return result

def safe_specifier(path, directory):
    relative = os.path.relpath(path, directory).replace(os.sep, '/')
    if not relative.startswith('.'):
        relative = './' + relative
    return json.dumps(relative)

def library_file(name, entry, root):
    return root / SHARED_DIR / f'{name}-{entry["sha256"][:20]}.mjs'

def library_contents(name, entry, catalog, root):
    imports = []
    for dep, names in entry['deps']:
        path = library_file(dep, catalog[dep], root)
        imports.append(f'import {{ {", ".join(names)} }} from {safe_specifier(path, library_file(name,entry,root).parent)};')
    sources = ', '.join(entry['source'])
    return (f'// Canonical EDuke32 source-first ABI support: {sources}\n'
            f'// Full SHA-256 of original helper text: {entry["sha256"]}\n'
            + ('\n'.join(imports) + '\n' if imports else '')
            + entry['content'] + '\n'
            + 'export { ' + ', '.join(entry['exports']) + ' };\n')

def atomic_write(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(path.name + f'.{os.getpid()}.partial')
    try:
        temporary.write_text(value, encoding='utf-8')
        os.replace(temporary, path)
    finally:
        temporary.unlink(missing_ok=True)

def transform(source, file, root, catalog):
    """Rewrite only exact canonical emission blocks, never arbitrary lookalikes."""
    if not source.startswith(MARKER) or '/_source_shared/' in file.as_posix():
        return None
    matched = []
    ranges = []
    for name, _, _ in HELPERS:
        snippet = catalog[name]['content']
        start = source.find(snippet)
        if start < 0:
            continue
        # Disallow source-specific output/body collisions or repeated source
        # snippets; every canonical helper is injected at most once.
        if source.find(snippet, start + 1) >= 0:
            raise ValueError(f'{file}: multiple canonical {name} helper sections')
        matched.append(name)
        ranges.append((start, start + len(snippet), name))
    if not matched:
        return None
    # Do not introduce unsupported references to an absent canonical runtime.
    chosen = set(matched)
    for name in matched:
        for dep, _ in catalog[name]['deps']:
            if dep not in chosen:
                raise ValueError(f'{file}: {name} missing required embedded {dep}')
    ranges.sort()
    for current, following in zip(ranges, ranges[1:]):
        if current[1] > following[0]:
            raise ValueError(f'{file}: overlapping canonical helper sections')
    # The emitter's address -> heap -> pointer -> aggregate order is a
    # semantic requirement. Reject drift instead of silently moving effects.
    declared = [name for _, _, name in ranges]
    expected = [name for name, _, _ in HELPERS if name in chosen]
    if declared != expected:
        raise ValueError(f'{file}: unexpected shared-helper initialization order')
    remaining = source
    for start, stop, _ in reversed(ranges):
        remaining = remaining[:start] + remaining[stop:]
    imports = []
    for name in expected:
        entry = catalog[name]
        shared = library_file(name, entry, root)
        imports.append(f'import {{ {", ".join(entry["exports"])} }} from {safe_specifier(shared, file.parent)};')
    # Keep source provenance header at the top, then imports, then source code.
    marker_end = remaining.index('\n') + 1
    new = remaining[:marker_end] + ''.join(line + '\n' for line in imports) + remaining[marker_end:]
    if new == source or not new.startswith(MARKER):
        raise ValueError(f'{file}: invalid shared-helper rewrite')
    return new, matched

def optimize(root, *, apply=False, verify=False, repo=REPO):
    root = root.resolve()
    if not root.is_dir():
        raise FileNotFoundError(root)
    catalog = catalogue(repo)
    files = sorted(path for path in root.rglob('*.mjs')
                   if SHARED_DIR not in path.relative_to(root).parts)
    changes = []
    used = set()
    original_bytes = rewritten_bytes = 0
    for path in files:
        original = path.read_text(encoding='utf-8')
        # Module imports were generated from source-root-relative paths, so a
        # staged copy must preserve the entire ES module directory structure.
        candidate = transform(original, path, root, catalog)
        if candidate is None:
            continue
        converted, names = candidate
        used.update(names)
        original_bytes += len(original.encode('utf-8'))
        rewritten_bytes += len(converted.encode('utf-8'))
        changes.append((path, converted, names))
    required = set(used)
    for name in list(used):
        required.update(dep for dep, _ in catalog[name]['deps'])
    support = [(library_file(name, catalog[name], root),
                library_contents(name, catalog[name], catalog, root))
               for name, _, _ in HELPERS if name in required]
    if verify:
        # Node only validates syntax; runtime/native parity requires separate
        # fixture tests. Do not execute arbitrary original game module bodies.
        for file, content in support + [(p, s) for p, s, _ in changes]:
            check = subprocess.run(['node', '--check', '--input-type=module'],
                                   input=content, text=True, capture_output=True, timeout=30)
            if check.returncode:
                raise RuntimeError(f'{file} JS syntax invalid:\n{check.stderr[-1500:]}')
    if apply:
        for path, content in support:
            if not path.exists() or path.read_text(encoding='utf-8') != content:
                atomic_write(path, content)
        for path, content, _ in changes:
            atomic_write(path, content)
    total_shared = sum(len(c.encode('utf-8')) for _, c in support)
    report = {
        'format': 'source-first-emitted-helper-sharing/1',
        'mode': 'applied' if apply else 'dry-run',
        'source_root': str(root), 'files_examined': len(files),
        'modules_rewritten': len(changes), 'canonical_helper_kinds': len(used),
        'helper_occurrences_removed': sum(len(names) for _, _, names in changes),
        'embedded_bytes_before': original_bytes,
        'embedded_bytes_after': rewritten_bytes,
        'shared_library_bytes': total_shared,
        'estimated_net_bytes_saved': original_bytes - rewritten_bytes - total_shared,
        'canonical_implementations': [
            {'name': name, 'sha256': catalog[name]['sha256'],
             'exports': catalog[name]['exports'],
             'generated': library_file(name, catalog[name], root).relative_to(root).as_posix()}
            for name, _, _ in HELPERS if name in required],
        'modules': [
            {'path': path.relative_to(root).as_posix(), 'helpers_shared': names,
             'before_bytes': len(path.read_bytes()) if not apply else None,
             'after_bytes': len(content.encode('utf-8'))}
            for path, content, names in changes],
        'limitations': [
            'Only exact canonical helper injections are moved; original C/C++ emitted functions are untouched',
            'Legacy generated helper variants must be regenerated by the current source compiler',
            'Shared-runtime files must be published/copied alongside rewritten modules',
            'Run original semantic/native/browser parity and linker import checks before release'
        ],
    }
    return report

def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--root', type=Path, required=True, help='completed transpiler/linker output tree')
    ap.add_argument('--apply', action='store_true', help='rewrite exact helpers in place; dry run otherwise')
    ap.add_argument('--verify-node', action='store_true', help='verify rewritten ES module syntax with Node')
    ap.add_argument('--report', type=Path, help='optional JSON report destination')
    args = ap.parse_args(argv)
    result = optimize(args.root, apply=args.apply, verify=args.verify_node)
    if args.report:
        args.report.parent.mkdir(parents=True, exist_ok=True)
        args.report.write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({k:v for k,v in result.items() if k not in ('modules','canonical_implementations','limitations')}, indent=2))
    return 0

if __name__ == '__main__':
    sys.exit(main())
