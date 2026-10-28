#!/usr/bin/env python3
"""Demand-driven Clang recovery of TU-private header tables and constants."""
import json
import subprocess
import sys
import tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'tools'))
from source_ast_to_js import parse_json_stream,produce
with tempfile.TemporaryDirectory(prefix='eduke_header_constant_') as td:
    root=Path(td)
    (root/'tables.hpp').write_text('''static constexpr unsigned char masks[8]={1,2,4,8,16,32,64,128};
static constexpr int bias=13;
static inline int checked(int x){return int(masks[x&7])+bias;}
''')
    (root/'main.cpp').write_text('''#include "tables.hpp"
int work(int x){return checked(x)+masks[(x+5)&7]+bias;}
''')
    (root/'verify.cpp').write_text('''#include <cstdio>
int work(int);
int main(){for(int i=-160;i<160;i++)printf("%d\\n",work(i));}
''')
    p=subprocess.run(['clang++','-std=gnu++17','-Xclang','-ast-dump=json','-fsyntax-only','main.cpp'],cwd=root,text=True,capture_output=True,check=True)
    ast=parse_json_stream(p.stdout)
    before,baseline=produce(ast,root/'main.cpp','main.cpp',source_root=root)
    assert next(r for r in baseline if r['name']=='work')['status']=='blocked'
    code,manifest=produce(ast,root/'main.cpp','main.cpp',source_root=root,header_dependency_closure=True)
    names={r['source_name']:r for r in manifest}
    assert all(names[k]['status']=='source-first' for k in ('work','checked','bias','masks')),manifest
    assert all(names[k]['linkage']=='internal' for k in ('checked','bias','masks')),manifest
    assert all('__header_' in names[k]['name'] for k in ('checked','bias','masks')),manifest
    # Exercise the production publisher so all selected narrowing helpers are
    # included, rather than manually reconstructing a partial module prelude.
    emitted=root/'emitted'
    subprocess.run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),
                    '--root',str(root),'--source','main.cpp','--out-dir',str(emitted),
                    '--header-dependency-closure'],cwd=ROOT,check=True,capture_output=True,text=True)
    generated='import {work} from '+json.dumps((emitted/'main.cpp.mjs').as_uri())+';\nfor(let i=-160;i<160;i++)console.log(work(i));\n'
    (root/'run.mjs').write_text(generated)
    c=subprocess.run(['node','--check',str(root/'run.mjs')],capture_output=True,text=True)
    assert c.returncode==0,c.stderr
    c=subprocess.run(['clang++','-std=gnu++17','main.cpp','verify.cpp','-o','native'],cwd=root,text=True,capture_output=True)
    assert c.returncode==0,c.stderr
    orig=subprocess.run([str(root/'native')],cwd=root,text=True,capture_output=True,check=True).stdout
    actual=subprocess.run(['node',str(root/'run.mjs')],cwd=root,text=True,capture_output=True)
    assert actual.returncode==0,actual.stderr
    assert orig==actual.stdout,(orig[:100],actual.stdout[:200])
print('PASS: recursive static header tables and constexpr data, 320 native C++ vs JS outputs')
