"""Opaque-pointer scalar access uses the original bytes without class factories."""
import json
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def run(args, cwd):
    result = subprocess.run(list(map(str, args)), cwd=cwd, capture_output=True,
                            text=True, timeout=180)
    assert result.returncode == 0, (result.stdout[-1600:], result.stderr[-2500:])
    return result.stdout


with tempfile.TemporaryDirectory(prefix='source-cast-field-', dir=ROOT / 'work') as folder:
    root = Path(folder)
    (root / 'types.hpp').write_text('''
template<class T> struct Vec {
    T x, y;
    const Vec<T> operator+(const Vec<T>& rhs) const { return {x+rhs.x,y+rhs.y}; }
};
struct Sprite { Vec<int> position; int player; int neighbor; };
''')
    (root / 'unit.cpp').write_text('''#include "types.hpp"
extern "C" int player(const void* sprite){return ((const Sprite*)sprite)->player;}
extern "C" int advance(void* sprite,int delta){return ((Sprite*)sprite)->player+=delta;}
extern "C" int sample(int n){
    Vec<int> a{n,11}, b{9,5};
    Sprite local{a+b,n,12345};
    return advance(&local,n*3)+player(&local)+local.position.x+local.neighbor;
}
''')
    (root / 'main.cpp').write_text('''#include <cstdio>
extern "C" int sample(int n);
int main(){for(int n=-256;n<256;n++)printf("%d\\n",sample(n));}
''')
    executable = root / 'native.exe'
    run(['clang++', root / 'unit.cpp', root / 'main.cpp', '-o', executable], root)
    expected = run([executable], root)
    out = root / 'out'
    run([sys.executable, ROOT / 'tools/source_ast_to_js.py', '--source', 'unit.cpp',
         '--root', root, '--out-dir', out, '--header-dependency-closure',
         '--require-record-layouts'], ROOT)
    module = out / 'unit.cpp.mjs'
    manifest = json.loads(module.with_suffix('.manifest.json').read_text())
    assert not manifest['blocked'], manifest['definitions']
    rows = {row['name']: row for row in manifest['definitions']}
    factories = {row['name'] for row in rows.values() if row.get('header_record_factory')}
    assert factories, 'The aggregate must instantiate a real vector prototype'
    for name in ('player', 'advance'):
        row = rows[name]
        dependencies = {*row.get('source_references', []), *row.get('external_imports', [])}
        assert not dependencies & factories, (name, dependencies, factories)
    script = root / 'run.mjs'
    script.write_text('import {sample} from ' + json.dumps(module.as_uri()) +
                      ';for(let n=-256;n<256;n++)console.log(sample(n));')
    assert run(['node', script], ROOT) == expected
print('PASS 512 native/JS scalar field reads and writes through opaque record pointers')
