"""Verify type-derived extents do not read globals during JS module evaluation."""
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


with tempfile.TemporaryDirectory(prefix='native-array-extent-') as folder:
    root = Path(folder)
    unit = root / 'extent.cpp'
    unit.write_text('''
template<class T, unsigned long Count>
constexpr unsigned long extent(const T (&)[Count]) { return Count; }
template<class T, unsigned long Count>
constexpr unsigned long shifted(const T (&)[Count]) { return Count+1; }
extern int remote[7];
extern int (&choose())[7];
int local[3];
extern "C" const unsigned long sizes[] = {extent(remote), extent(local)};
extern "C" const unsigned long dynamic_sizes[] = {extent(choose()), shifted(remote)};
''', encoding='utf-8')
    main = root / 'main.cpp'
    main.write_text('''#include <cstdio>
int remote[7];
int (&choose())[7] { return remote; }
extern "C" const unsigned long sizes[];
int main(){for(int i=0;i<2;i++)std::printf("%lu\\n",sizes[i]);}
''', encoding='utf-8')
    native = root / 'oracle.exe'
    run(['clang++', '-std=c++14', unit, main, '-o', native])
    expected = run([native])
    out = root / 'out'
    run([sys.executable, ROOT / 'tools/source_ast_to_js.py', '--source', unit.name,
         '--root', root, '--out-dir', out, '--filter', 'sizes,dynamic_sizes', '--exact-filter'])
    module = out / (unit.name + '.mjs')
    manifest = json.loads(module.with_suffix('.manifest.json').read_text(encoding='utf-8'))
    assert manifest['original_offset_constants']['by_kind']['array_extents'] == 2, manifest
    rows = {row['name']: row for row in manifest['definitions']}
    assert rows['sizes']['status'] == 'source-first' and not rows['sizes']['source_references']
    assert rows['dynamic_sizes']['status'] == 'blocked', rows['dynamic_sizes']
    runner = root / 'run.mjs'
    runner.write_text('import {sizes} from ' + json.dumps(module.as_uri()) +
                      ';for(const size of sizes)console.log(String(size));', encoding='utf-8')
    assert run(['node', runner]) == expected
print('PASS native array extents without startup value reads, runtime argument and computed return retained')
