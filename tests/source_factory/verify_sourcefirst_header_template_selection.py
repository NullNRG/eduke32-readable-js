"""Native parity for implicit header instances without an explicit inline token."""
import copy
import json
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'tools'))
from source_ast_to_js import parse_json_stream
from source_template_bindings import rebind, contexts


def run(args, cwd=ROOT):
    result = subprocess.run(list(map(str, args)), cwd=cwd, text=True,
                            capture_output=True, timeout=120)
    assert result.returncode == 0, (args, result.stdout[-2000:], result.stderr[-2000:])
    return result.stdout


with tempfile.TemporaryDirectory(prefix='source-header-selection-') as directory:
    root = Path(directory)
    (root / 'original.hpp').write_text('''#pragma once
template<unsigned Salt> int mix(int value) { return value * Salt; }
template<typename T> void seed(T *list, unsigned char *bitmap, T *count, int first) {
    bitmap[first >> 3] |= 1u << (first & 7);
    list[0] = first;
    *count = 1;
}
template<typename T> void add(T *list, unsigned char *bitmap, T *count, int next) {
    if (!(bitmap[next >> 3] & (1u << (next & 7)))) {
        bitmap[next >> 3] |= 1u << (next & 7);
        list[(*count)++] = next;
    }
}
''')
    (root / 'unit.cpp').write_text('''#include "original.hpp"
extern "C" int exercise(int input) {
    short list[32] = {}; unsigned char bitmap[4] = {}; short count = 0;
    seed(list, bitmap, &count, input & 31);
    for (int i = 0; i < 12; ++i) add(list, bitmap, &count, (input + i * 3) & 31);
    int sum = 0; for (int i = 0; i < count; ++i) sum += list[i];
    return sum + count + mix<3>(input) + mix<7>(input);
}
''')
    (root / 'main.cpp').write_text('''#include <cstdio>
extern "C" int exercise(int);
int main() { for (int n = 0; n < 512; ++n) printf("%d\\n", exercise(n)); }
''')
    run(['clang++', root / 'unit.cpp', root / 'main.cpp', '-o', root / 'native'])
    expected = run([root / 'native']).splitlines()
    for name, flags in [('full', []), ('filtered', ['--filter', 'exercise', '--exact-filter', '--dependency-closure'])]:
        output = root / name
        run([sys.executable, ROOT / 'tools/source_ast_to_js.py', '--root', root,
             '--source', 'unit.cpp', '--out-dir', output, '--header-dependency-closure', *flags])
        module = output / 'unit.cpp.mjs'
        manifest = json.loads(module.with_suffix('.manifest.json').read_text())
        assert manifest['blocked'] == 0, manifest
        instances = [row for row in manifest['definitions'] if row.get('source_name') in ('mix', 'seed', 'add')]
        assert len(instances) == 4 and all(row.get('odr_inline') for row in instances), instances
        runner = root / (name + '.mjs')
        runner.write_text('import {exercise} from ' + json.dumps(module.as_uri())
                          + ';for(let n=0;n<512;n++)console.log(exercise(n));')
        assert run(['node', runner]).splitlines() == expected

    # Selection evidence from another body/source site must never silently
    # reconnect a same-type call, and conflicting original selections reject.
    complete = parse_json_stream(run(['clang++', '-Xclang', '-ast-dump=json',
                                     '-fsyntax-only', root / 'unit.cpp']))
    filtered = parse_json_stream(run(['clang++', '-Xclang', '-ast-dump=json', '-Xclang',
                                     '-ast-dump-filter=exercise', '-fsyntax-only', root / 'unit.cpp']))
    assert rebind(filtered, contexts(complete)) >= 4
    changed = copy.deepcopy(filtered)
    owner = changed[0]
    owner['loc']['offset'] += 1
    assert rebind(changed, contexts(complete)) == 0
    ambiguous = copy.deepcopy(complete)
    def walk(node):
        yield node
        for child in node.get('inner', []):
            yield from walk(child)
    mixes = [node for top in ambiguous for node in walk(top) if node.get('kind') == 'DeclRefExpr'
             and node.get('referencedDecl', {}).get('name') == 'mix']
    mixes[0]['referencedDecl']['id'] = mixes[1]['referencedDecl']['id']
    fresh = parse_json_stream(run(['clang++', '-Xclang', '-ast-dump=json', '-Xclang',
                                  '-ast-dump-filter=exercise', '-fsyntax-only', root / 'unit.cpp']))
    assert rebind(fresh, [*contexts(complete), *contexts(ambiguous)]) == 3
print('PASS: 1024 native/full/filtered header-template cases, original search storage, distinct NTTP calls, conflicting/source-site selections rejected')
