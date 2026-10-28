#!/usr/bin/env python3
"""Aggregate value-initialization retains original source-defined operator methods."""
import json
from pathlib import Path
import subprocess
import sys
import tempfile

ROOT=Path(__file__).resolve().parents[2]

def run(args,root):
    result=subprocess.run(args,cwd=root,capture_output=True,text=True,timeout=70)
    assert result.returncode==0,(args,result.stdout[-1000:],result.stderr[-2500:])
    return result.stdout

with tempfile.TemporaryDirectory(prefix='aggregate-methods-') as temp:
    root=Path(temp)
    (root/'unit.cpp').write_text('''
struct C { int value; C& operator=(const C& other) { value=other.value+9; return *this; } };
struct Outer { C child; int untouched; };
C blocked_global{};
C blocked_global_array[2];
int direct(int x) { C a{},b{x}; a=b; return a.value+b.value; }
int nested(int x) { Outer a{},b{}; b.child.value=x; a.child=b.child; return a.child.value+b.child.value+a.untouched; }
int globals(int x) { C other{x}; blocked_global=other; blocked_global_array[1]=other; return blocked_global.value+blocked_global_array[1].value; }
int blocked_static(int x) { static C value{}; C other{x}; value=other; return value.value; }
''',encoding='utf-8')
    (root/'main.cpp').write_text('''#include <cstdio>
int direct(int);int nested(int);int globals(int);
int main(){for(int x=-128;x<128;x++)printf("%d,%d,%d\\n",direct(x),nested(x),globals(x));}
''',encoding='utf-8')
    run(['clang++','-std=c++14','unit.cpp','main.cpp','-o','native.exe'],root)
    expected=run([str(root/'native.exe')],root).splitlines()
    run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(root),'--source','unit.cpp','--out-dir',str(root/'out')],root)
    module=root/'out/unit.cpp.mjs'
    rows={row['source_name']:row for row in json.loads(module.with_suffix('.manifest.json').read_text())['definitions']}
    for name in ('direct','nested','globals'):
        assert rows[name]['status']=='source-first',rows[name]
        assert 'C' in rows[name]['source_references'],rows[name]
    for name in ('blocked_global','blocked_global_array'):
        assert rows[name]['status']=='source-first',rows[name]
    for name in ('blocked_static',):
        assert rows[name]['status']=='blocked',rows[name]
        assert 'aggregate methods require original' in rows[name]['reason'],rows[name]
    assert 'Object.create(C.prototype)' in module.read_text()
    (root/'run.mjs').write_text('import {direct,nested,globals} from '+json.dumps(module.as_uri())+';\n'
        +'for(let x=-128;x<128;x++)console.log(`${direct(x)},${nested(x)},${globals(x)}`);\n',encoding='utf-8')
    run(['node','--check',str(module)],root)
    observed=run(['node',str(root/'run.mjs')],root).splitlines()
    assert observed==expected,next(((i,a,b) for i,(a,b) in enumerate(zip(expected,observed)) if a!=b),None)
print('PASS: 768 native aggregate-method comparisons; direct/nested and proven-order file globals preserve original prototype; function-static lifetime remains fail-closed')
