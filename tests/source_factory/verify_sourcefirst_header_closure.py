#!/usr/bin/env python3
"""Native parity of recursive static-inline header dependency recovery."""
import json
from pathlib import Path
import subprocess
import sys
import tempfile
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'tools'))
from source_ast_to_js import parse_json_stream, produce

with tempfile.TemporaryDirectory() as temp:
    path=Path(temp)
    (path/'helpers.hpp').write_text('''static inline int twice(int x) { return x * 2; }
static inline int more(int x) { return twice(x) + 3; }
''')
    (path/'main.cpp').write_text('''#include "helpers.hpp"
int entry(int x) { return more(x) + twice(x); }
''')
    (path/'reference.cpp').write_text('''#include <cstdio>
#include "helpers.hpp"
int entry(int x);
int main() { for(int i=-64;i<64;++i) printf("%d\\n", entry(i)); }
''')
    cmd=['clang++','-std=gnu++14','-Xclang','-ast-dump=json','-fsyntax-only','main.cpp']
    result=subprocess.run(cmd,cwd=path,text=True,capture_output=True,check=True)
    ast=parse_json_stream(result.stdout)
    before,old=produce(ast,path/'main.cpp','main.cpp',source_root=path)
    assert next(r for r in old if r['name']=='entry')['status']=='blocked',old
    source,rows=produce(ast,path/'main.cpp','main.cpp',source_root=path,header_dependency_closure=True)
    assert all(r['status']=='source-first' for r in rows),rows
    helper_names={r['source_name']:r['name'] for r in rows if r['source_name'] in ('twice','more')}
    assert set(helper_names)=={'twice','more'},rows
    assert all('__header_' in n for n in helper_names.values()),rows
    # Internal linkage names must remain distinct across translation units.
    _,other=produce(ast,path/'main.cpp','another.cpp',source_root=path,header_dependency_closure=True)
    assert all(r['name']!=helper_names.get(r['source_name']) for r in other if r['source_name'] in helper_names)
    js='const i32 = x => x|0;\n'+'\n'.join(source)+'\nfor(let i=-64;i<64;i++)console.log(entry(i));\n'
    (path/'out.mjs').write_text(js)
    check=subprocess.run(['node','--check','out.mjs'],cwd=path,text=True,capture_output=True)
    assert check.returncode==0,check.stderr
    cc=subprocess.run(['clang++','-std=gnu++14','main.cpp','reference.cpp','-o','native'],cwd=path,text=True,capture_output=True)
    assert cc.returncode==0,cc.stderr
    native=subprocess.run([str(path/'native')],cwd=path,text=True,capture_output=True,check=True)
    scripted=subprocess.run(['node','out.mjs'],cwd=path,text=True,capture_output=True)
    assert scripted.returncode==0,scripted.stderr
    assert native.stdout==scripted.stdout,(native.stdout[:300],scripted.stdout[:300])
    print('PASS: 128 native C++/JS comparisons, recursive verified header body closure and isolated TU names')
print('PASS: standalone static header helpers recovered without guessing their code')
