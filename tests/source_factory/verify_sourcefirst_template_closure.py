#!/usr/bin/env python3
"""Native parity, Clang-instantiated inline templates, ODR and type-safe ownership."""
from pathlib import Path
import subprocess,sys,tempfile
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'tools'))
from source_ast_to_js import parse_json_stream,produce
from source_first_global_link import ownership

def run(argv,root):
    p=subprocess.run(argv,cwd=root,text=True,capture_output=True,timeout=60)
    assert p.returncode==0,(argv,p.stderr[-1500:]);return p.stdout

with tempfile.TemporaryDirectory() as temp:
    root=Path(temp)
    (root/'common.hpp').write_text('''#pragma once
template<class T> inline T pick(T a,T b) { return a>b?a:b; }
''')
    (root/'a.cpp').write_text('''#include "common.hpp"
int entryA(int x) { return pick(x,4); }
''')
    (root/'b.cpp').write_text('''#include "common.hpp"
int entryB(int x) {return pick(x,4) + (int)pick((unsigned)x,7u);}
''')
    (root/'driver.cpp').write_text('''#include <cstdio>
int entryA(int);int entryB(int);
int main(){for(int i=0;i<200;i++) printf("%d %d\\n",entryA(i),entryB(i));}
''')
    run(['clang++','-std=c++14','a.cpp','b.cpp','driver.cpp','-o','native'],root)
    native=run([str(root/'native')],root).splitlines()
    manifests={};lines=[]
    for filename,func in [('a.cpp','entryA'),('b.cpp','entryB')]:
        ast=parse_json_stream(run(['clang++','-std=c++14','-Xclang','-ast-dump=json','-fsyntax-only',filename],root))
        source,rows=produce(ast,root/filename,filename,source_root=root,header_dependency_closure=True)
        assert all(r['status']=='source-first' for r in rows),rows
        specialization=[r for r in rows if r.get('source_name')=='pick']
        assert len(specialization)==(1 if filename=='a.cpp' else 2),specialization
        assert all(r['name'].startswith('pick__template_') for r in specialization),specialization
        assert all(r.get('odr_inline') for r in specialization),specialization
        manifests[filename]={'manifest':{'definitions':rows},'module':None}
        (root/(filename+'.mjs')).write_text('const i32=x=>Number(x)|0;const u32=x=>Number(x)>>>0;\n'+'\n'.join(source)+f'\nfor(let i=0;i<200;i++)console.log({func}(i));\n')
        run(['node','--check',filename+'.mjs'],root)
        lines.append(run(['node',filename+'.mjs'],root).splitlines())
    owners,ambiguous=ownership(manifests)
    assert not ambiguous,ambiguous
    picks={name:owner for name,owner in owners.items() if name.startswith('pick__template_')}
    assert len(picks)==2,picks
    expected=[f'{lines[0][i]} {lines[1][i]}' for i in range(200)]
    assert expected==native,(expected[:5],native[:5])
    print('PASS: 400 native C++/JS instantiated-template results, stable qualified symbols across TUs, ODR merged')
