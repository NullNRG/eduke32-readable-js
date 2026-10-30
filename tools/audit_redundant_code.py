#!/usr/bin/env python3
"""Read-only duplicate-code and shared-helper audit for EDuke32 readable JS.

Python functions: AST matching. JS functions: best-effort lexical matching.
Generic blocks: cross-file token windows. Results are review candidates,
not permission to rewrite code or proof of equivalent behavior.
"""
from __future__ import annotations
import argparse
import ast
from collections import defaultdict
import copy
from difflib import SequenceMatcher
import hashlib
import io
import json
from pathlib import Path
import re
import sys
import tokenize

SUFFIXES = {'.py', '.js', '.mjs', '.cjs', '.jsx', '.ts', '.tsx', '.ps1', '.sh', '.cs', '.c', '.cc', '.cpp', '.h', '.hpp', '.cmd'}
DEFAULT_ROOTS = ('tools', 'runtime', 'tests')
EXCLUDE = {'.git', 'node_modules', 'dist', '.venv', '__pycache__', 'factory-output', 'work', 'reports', 'input-source', 'build'}
LEX = re.compile(r'//[^\n]*|/\*[\s\S]*?\*/|#[^\n]*|(?:"(?:\\.|[^"\\])*"|\'(?:\\.|[^\'\\])*\'|\x60(?:\\.|[^\x60\\])*\x60)|[A-Za-z_$][\w$]*|\d+(?:\.\d+)?|==={0,1}|!==?|=>|\?\.|\S')
FUNC_JS = re.compile(r'\b(?:async\s+)?function\s+(?P<fn>[A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{|\b(?:const|let|var)\s+(?P<arrow>[A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>\s*\{', re.M)
FAMILIES = {
    'json-io': (r'json\.(?:loads|dumps|load|dump)\(|JSON\.(?:parse|stringify)\(', 'Consider a schema-aware JSON read/write utility; preserve encoding, atomicity and error policies.'),
    'file-hashing': (r'\b(?:sha256|sha1|blake2b)\s*\(|createHash\s*\(', 'Consider a byte/stream hashing helper with explicit fingerprint contracts.'),
    'subprocess-execution': (r'\bsubprocess\.(?:run|Popen|check_output)\s*\(|\bspawnSync\s*\(', 'Consider a common command runner preserving cwd, timeouts, stdout, stderr and return codes.'),
    'cli-argument-handling': (r'\bargparse\.ArgumentParser\s*\(|process\.argv\b', 'Consider reusable CLI argument groups while keeping entry points separate.'),
    'report-persistence': (r'\b(?:write_text|write_bytes|replace|os\.replace)\s*\(|\bwriteFileSync\s*\(', 'Consider shared atomic report persistence without changing durability guarantees.'),
    'export-symbol-discovery': (r'\b(?:EXPORT|EXPORTED|exported_symbols|export_names|exports)\b', 'Review ESM export detection for a typed, provenance-preserving symbol index.'),
    'source-root-resolution': (r'Path\(__file__\)\.resolve\(\)\.parents\[1\]', 'Consider a central workspace root resolver without introducing circular imports.'),
}

def digest(s):
    return hashlib.sha256(s.encode('utf-8')).hexdigest()

def read_files(root, include_generated, all_dirs, max_bytes):
    sources, skipped = {}, []
    dirs = [root] if all_dirs else [root / x for x in DEFAULT_ROOTS]
    dirs += [root / name for name in ('launch-project.ps1', 'launch-project.cmd')]
    for base in dirs:
        paths = base.rglob('*') if base.is_dir() else [base]
        for path in paths:
            if not path.is_file() or path.suffix.lower() not in SUFFIXES:
                continue
            rel = path.relative_to(root).as_posix()
            excluded = EXCLUDE - ({'factory-output', 'work', 'reports', 'build'} if include_generated else set())
            if any(x in excluded for x in path.relative_to(root).parts):
                continue
            if path.stat().st_size > max_bytes:
                skipped.append({'file': rel, 'reason': 'max-bytes'})
                continue
            try:
                sources[rel] = path.read_text(encoding='utf-8')
            except (UnicodeError, OSError):
                skipped.append({'file': rel, 'reason': 'unreadable'})
    return dict(sorted(sources.items())), skipped

def lex(source, suffix):
    if suffix == '.py':
        try:
            out = []
            for t in tokenize.generate_tokens(io.StringIO(source).readline):
                if t.type in (tokenize.NAME, tokenize.STRING, tokenize.NUMBER, tokenize.OP):
                    out.append((t.string, t.start[0], t.type))
            return out
        except (tokenize.TokenError, IndentationError):
            pass
    out = []
    for m in LEX.finditer(source):
        val = m.group()
        if val.startswith(('//', '/*', '#')):
            continue
        kind = 'name' if re.fullmatch(r'[A-Za-z_$][\w$]*', val) else 'number' if val[0].isdigit() else 'str' if val.startswith(('"', "'", chr(96))) else 'op'
        out.append((val, source.count('\n', 0, m.start()) + 1, kind))
    return out

def shape(tokens):
    out = []
    reserved = {'def', 'return', 'if', 'else', 'for', 'while', 'try', 'except', 'finally', 'async', 'await', 'class', 'new', 'throw', 'function', 'const', 'let', 'var', 'yield'}
    for val, _line, kind in tokens:
        if kind in (tokenize.NAME, 'name'):
            out.append(val if val in reserved else 'ID')
        elif kind in (tokenize.NUMBER, tokenize.STRING, 'number', 'str'):
            out.append('LITERAL')
        else:
            out.append(val)
    return out

def python_functions(path, source, errors):
    try:
        tree = ast.parse(source, filename=path)
    except SyntaxError as e:
        errors.append({'file': path, 'reason': 'python-parse', 'line': e.lineno})
        return []
    out = []
    def visit(node, parents):
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            title = '.'.join([*parents, node.name])
            fragment = '\n'.join(source.splitlines()[node.lineno - 1:node.end_lineno])
            copied = copy.deepcopy(node)
            copied.name = '_function'
            exact = ast.dump(copied, include_attributes=False)
            tokens = lex(fragment, '.py')
            out.append({'file': path, 'line': node.lineno, 'end': node.end_lineno, 'name': title, 'engine': 'python-ast', 'exact': digest(exact), 'tokens': shape(tokens), 'length': len(tokens)})
            parents = [*parents, node.name]
        elif isinstance(node, ast.ClassDef):
            parents = [*parents, node.name]
        for child in ast.iter_child_nodes(node):
            visit(child, parents)
    visit(tree, [])
    return out

def balanced_end(source, brace):
    depth, i, state = 0, brace, ''
    while i < len(source):
        c = source[i]
        n = source[i + 1] if i + 1 < len(source) else ''
        if state == 'line':
            if c == '\n': state = ''
        elif state == 'block':
            if c == '*' and n == '/': state = ''; i += 1
        elif state:
            if c == '\\': i += 1
            elif c == state: state = ''
        elif c == '/' and n == '/': state = 'line'; i += 1
        elif c == '/' and n == '*': state = 'block'; i += 1
        elif c in ('"', "'", chr(96)): state = c
        elif c == '{': depth += 1
        elif c == '}':
            depth -= 1
            if depth == 0: return i + 1
        i += 1
    return None

def js_functions(path, source):
    out = []
    for m in FUNC_JS.finditer(source):
        end = balanced_end(source, m.end() - 1)
        if end is None: continue
        fragment = source[m.start():end]
        tokens = lex(fragment, Path(path).suffix.lower())
        out.append({'file': path, 'line': source.count('\n', 0, m.start()) + 1,
                    'end': source.count('\n', 0, end) + 1, 'name': m.group('fn') or m.group('arrow'),
                    'engine': 'js-heuristic', 'exact': digest(' '.join(t[0] for t in tokens)),
                    'tokens': shape(tokens), 'length': len(tokens)})
    return out

def locations(xs, limit=8):
    return [{'file': x['file'], 'line': x.get('line', 1), 'name': x.get('name', '')} for x in xs[:limit]]

def identical_functions(funcs, key, min_tokens):
    groups = defaultdict(list)
    for f in funcs:
        if f['length'] >= min_tokens:
            value = f['exact'] if key == 'exact' else digest(' '.join(f['tokens']))
            groups[value].append(f)
    result = []
    for rows in groups.values():
        if len({r['file'] for r in rows}) < 2: continue
        result.append({'locations': locations(rows), 'occurrences': len(rows),
                       'tokens': min(r['length'] for r in rows), 'engines': sorted({r['engine'] for r in rows})})
    return sorted(result, key=lambda x: (-x['tokens'] * (x['occurrences'] - 1), x['locations'][0]['file']))

def near_functions(funcs, min_tokens, cutoff=0.84):
    eligible = [f for f in funcs if f['length'] >= max(24, min_tokens)]
    buckets = defaultdict(list)
    shingles = []
    for i, f in enumerate(eligible):
        seq = f['tokens']
        keys = {digest(' '.join(seq[j:j+6]))[:12] for j in range(len(seq)-5)}
        shingles.append(keys)
        for key in sorted(keys)[:12]: buckets[key].append(i)
    candidates = set()
    for ids in buckets.values():
        if len(ids) > 36: continue
        for ix, a in enumerate(ids):
            for b in ids[ix+1:]:
                if eligible[a]['file'] != eligible[b]['file']:
                    candidates.add((min(a, b), max(a, b)))
    found = []
    for a, b in sorted(candidates):
        x, y = eligible[a], eligible[b]
        if x['exact'] == y['exact'] or max(x['length'], y['length']) > 2.2 * min(x['length'], y['length']): continue
        shared = len(shingles[a] & shingles[b]) / max(1, len(shingles[a] | shingles[b]))
        if shared < 0.55: continue
        similarity = SequenceMatcher(None, x['tokens'], y['tokens'], autojunk=False).ratio()
        if similarity >= cutoff:
            found.append({'similarity': round(similarity, 3), 'shingle_jaccard': round(shared, 3),
                          'locations': locations([x, y]), 'tokens': min(x['length'], y['length']),
                          'confidence': 'review-required'})
    return sorted(found, key=lambda x: (-x['similarity'] * x['tokens'], x['locations'][0]['file']))

def clone_windows(sources, min_tokens, stride=10):
    windows = defaultdict(list)
    width = max(35, min_tokens)
    for file, content in sources.items():
        raw = lex(content, Path(file).suffix.lower())
        if len(raw) < width: continue
        layout = shape(raw)
        raw_values = [x[0] for x in raw]
        for pos in range(0, len(raw) - width + 1, stride):
            seq = layout[pos:pos+width]
            if len(set(seq)) < 9: continue
            start, end = raw[pos][1], raw[pos+width-1][1]
            if end - start < 3: continue
            for mode, values in (('literal', raw_values), ('layout', layout)):
                key = (mode, digest('\x1f'.join(values[pos:pos+width])))
                windows[key].append({'file': file, 'line': start, 'end': end})
    found = []
    for (mode, _key), entries in windows.items():
        if len({x['file'] for x in entries}) < 2: continue
        chosen = []
        for loc in sorted(entries, key=lambda e: (e['file'], e['line'])):
            if not chosen or chosen[-1]['file'] != loc['file'] or loc['line'] > chosen[-1]['end']:
                chosen.append(loc)
        if len({x['file'] for x in chosen}) < 2: continue
        found.append({'mode': mode, 'tokens': width, 'occurrences': len(chosen), 'locations': chosen[:6],
                      'confidence': 'strong-syntactic' if mode == 'literal' else 'review-required'})
    return sorted(found, key=lambda r: (-r['occurrences'], r['mode'], r['locations'][0]['file']))

def helper_families(sources):
    result = []
    for key, (pattern, advice) in FAMILIES.items():
        matcher = re.compile(pattern)
        matches = []
        for path, source in sources.items():
            found = list(matcher.finditer(source))
            if found:
                matches.append({'file': path, 'count': len(found), 'line': source.count('\n', 0, found[0].start()) + 1})
        if len(matches) > 1:
            result.append({'family': key, 'files': len(matches), 'occurrences': sum(x['count'] for x in matches),
                           'samples': sorted(matches, key=lambda x: -x['count'])[:10],
                           'recommendation': advice, 'confidence': 'pattern-only; semantic review required'})
    return sorted(result, key=lambda x: (-x['files'], -x['occurrences']))

def audit(root, include_generated=False, all_dirs=False, min_tokens=45, max_bytes=2_000_000, limit=80):
    sources, skipped = read_files(root, include_generated, all_dirs, max_bytes)
    files = defaultdict(list)
    funcs, errors = [], []
    for path, source in sources.items():
        files[digest(source)].append({'file': path, 'bytes': len(source.encode('utf-8'))})
        suffix = Path(path).suffix.lower()
        if suffix == '.py': funcs.extend(python_functions(path, source, errors))
        elif suffix in {'.js', '.mjs', '.cjs', '.jsx', '.ts', '.tsx'}: funcs.extend(js_functions(path, source))
    exact_files = [{'files': entries, 'bytes_each': entries[0]['bytes']} for entries in files.values() if len(entries) > 1]
    exact_files.sort(key=lambda x: -x['bytes_each'] * (len(x['files']) - 1))
    report = {
        'meta': {'root': str(root), 'files_scanned': len(sources),
                 'bytes_scanned': sum(len(s.encode('utf-8')) for s in sources.values()),
                 'functions_inspected': len(funcs), 'scope': 'all' if all_dirs else ','.join(DEFAULT_ROOTS),
                 'include_generated': include_generated, 'min_tokens': min_tokens,
                 'warning': 'AST-backed Python matches; JS boundaries are heuristic; all changes require testing.'},
        'exact_files': exact_files[:limit],
        'exact_functions': identical_functions(funcs, 'exact', min_tokens)[:limit],
        'same_layout_functions': identical_functions(funcs, 'layout', min_tokens)[:limit],
        'near_duplicate_functions': near_functions(funcs, min_tokens)[:limit],
        'repeated_code_blocks': clone_windows(sources, min_tokens)[:limit],
        'shared_helper_opportunities': helper_families(sources),
        'parse_errors': errors, 'skipped_files': skipped[:100],
    }
    report['counts'] = {k: len(v) for k, v in report.items() if isinstance(v, list)}
    return report

def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument('--out', type=Path, default=Path('reports/redundant-code-audit.json'))
    parser.add_argument('--include-generated', action='store_true')
    parser.add_argument('--all', action='store_true')
    parser.add_argument('--min-tokens', type=int, default=45)
    parser.add_argument('--max-file-bytes', type=int, default=2_000_000)
    parser.add_argument('--limit', type=int, default=80)
    args = parser.parse_args(argv)
    if args.min_tokens < 12 or args.limit < 1: parser.error('min-tokens >=12 and limit >=1 required')
    root = args.root.resolve()
    result = audit(root, args.include_generated, args.all, args.min_tokens, args.max_file_bytes, args.limit)
    dest = args.out if args.out.is_absolute() else root / args.out
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')
    print(f'Scanned {result["meta"]["files_scanned"]} files / {result["meta"]["functions_inspected"]} functions')
    for key, count in result['counts'].items(): print(f'  {key}: {count}')
    for entry in result['shared_helper_opportunities'][:8]:
        print(f'  helper {entry["family"]}: {entry["files"]} files, {entry["occurrences"]} occurrences')
    print(f'Report: {dest}')
    return 0

if __name__ == '__main__':
    sys.exit(main())
