"""Filtered templates keep different pointer-reference contracts and array aliases."""
import json
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def run(args):
    result = subprocess.run(list(map(str, args)), cwd=ROOT, text=True,
                            capture_output=True, timeout=120)
    assert result.returncode == 0, (args, result.stdout[-1500:], result.stderr[-2500:])
    return result.stdout


with tempfile.TemporaryDirectory(prefix='source-template-reference-') as directory:
    root = Path(directory)
    (root / 'unit.cpp').write_text('''
template<typename T> static void capture(T (&original)[4], T *&pointer) {
    pointer = original;
    pointer[1] += 3;
}
extern "C" int exercise(int input) {
    int values[4] = {input, 2, 3, 4};
    unsigned char bytes[4] = {1, 250, 3, 4};
    int *a = nullptr; unsigned char *b = nullptr;
    capture(values, a); capture(bytes, b);
    *a += 5; *b += 7;
    return values[0] + values[1] + bytes[0] + bytes[1] + (a == values) + (b == bytes);
}
''')
    (root / 'main.cpp').write_text('''#include <cstdio>
extern "C" int exercise(int);
int main(){for(int n=-256;n<256;n++)printf("%d\\n",exercise(n));}
''')
    run(['clang++', root / 'unit.cpp', root / 'main.cpp', '-o', root / 'native'])
    expected = run([root / 'native']).splitlines()
    for name, flags in [('full', []), ('filtered', ['--filter', 'exercise', '--exact-filter', '--dependency-closure'])]:
        output = root / name
        run([sys.executable, ROOT / 'tools/source_ast_to_js.py', '--root', root,
             '--source', 'unit.cpp', '--out-dir', output, *flags])
        module = output / 'unit.cpp.mjs'
        manifest = json.loads(module.with_suffix('.manifest.json').read_text())
        assert manifest['blocked'] == 0, manifest
        instances = [row for row in manifest['definitions'] if row.get('source_name') == 'capture']
        assert len(instances) == 2 and len({row['name'] for row in instances}) == 2, instances
        assert len({json.dumps(row.get('cpp_reference_contract'), sort_keys=True) for row in instances}) == 2
        runner = root / (name + '.mjs')
        runner.write_text('import {exercise} from ' + json.dumps(module.as_uri())
                          + ';for(let n=-256;n<256;n++)console.log(exercise(n));')
        assert run(['node', runner]).splitlines() == expected
print('PASS: 1024 native/full/filtered template reference cases, distinct pointer-reference ABIs, original array mutations and pointer identity')
