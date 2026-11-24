"""Filtered functions use the exact const and non-const conversion bodies."""
import json
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def run(args):
    result = subprocess.run(list(map(str, args)), cwd=ROOT, capture_output=True,
                            text=True, timeout=180)
    assert result.returncode == 0, (result.stdout[-1000:], result.stderr[-2000:])
    return result.stdout.splitlines()


with tempfile.TemporaryDirectory(prefix='source-filtered-conversion-') as folder:
    root = Path(folder)
    (root / 'ticks.hpp').write_text('''
struct Ticks {
    int value;
    operator int() const { return value+4; }
    operator int() { return value+37; }
};
''', encoding='utf-8')
    unit = root / 'unit.cpp'
    unit.write_text('''#include "ticks.hpp"
extern "C" int convert(int n) {
    const Ticks immutable{n};
    Ticks editable{n*3};
    return int(immutable)*17 + int(editable);
}
''', encoding='utf-8')
    main = root / 'main.cpp'
    main.write_text('''#include <cstdio>
extern "C" int convert(int);
int main(){for(int i=-256;i<256;++i)std::printf("%d\\n",convert(i));}
''', encoding='utf-8')
    native = root / 'oracle.exe'
    run(['clang++', '-std=c++14', unit, main, '-o', native])
    expected = run([native])
    out = root / 'out'
    run([sys.executable, ROOT / 'tools/source_ast_to_js.py', '--source', unit.name, '--root', root,
         '--out-dir', out, '--exact-filter', '--filter', 'convert,Ticks',
         '--header-dependency-closure', '--dependency-closure', '--require-record-layouts'])
    module = out / (unit.name + '.mjs')
    manifest = json.loads(module.with_suffix('.manifest.json').read_text(encoding='utf-8'))
    row = next(row for row in manifest['definitions'] if row['name'] == 'convert')
    assert row['status'] == 'source-first', row
    runner = root / 'run.mjs'
    runner.write_text('import {convert} from ' + json.dumps(module.as_uri()) +
                      ';for(let i=-256;i<256;++i)console.log(convert(i));', encoding='utf-8')
    assert run(['node', runner]) == expected
print('PASS 512 native/JS cases for filtered original const and non-const conversions')
