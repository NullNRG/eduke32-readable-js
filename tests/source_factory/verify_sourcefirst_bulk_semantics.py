#!/usr/bin/env python3
"""Native parity for grouped C++ reference identities + inline ODR ownership."""
import json
from pathlib import Path
import subprocess
import sys
import tempfile
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'tools'))
from source_ast_to_js import parse_json_stream, produce
from source_first_global_link import ownership
ROOT=Path(__file__).resolve().parents[2]

def capture(args,cwd):
    p=subprocess.run(args,cwd=cwd,capture_output=True,text=True,timeout=60)
    assert p.returncode==0,(args,p.stderr[-2200:],p.stdout[-300:])
    return p.stdout

with tempfile.TemporaryDirectory() as tmp:
    root=Path(tmp)
    (root/'helpers.hpp').write_text('''#pragma once
inline int scale(int x) { return x*3+7; }
inline int shifted(int x) { return scale(x)+11; }
static inline int hidden(int x) { return x-5; }
''')
    (root/'a.cpp').write_text('''#include "helpers.hpp"
int entryA(int x) { return shifted(x)+hidden(x); }
''')
    (root/'b.cpp').write_text('''#include "helpers.hpp"
int entryB(int x) { return shifted(x)-scale(x); }
''')
    (root/'native.cpp').write_text('''#include <cstdio>
int entryA(int); int entryB(int);
int main(){for(int i=-100;i<100;++i)printf("%d %d\\n",entryA(i),entryB(i));}
''')
    native_exe=root/'native'
    capture(['clang++','-std=c++14','a.cpp','b.cpp','native.cpp','-o',str(native_exe)],root)
    native=capture([str(native_exe)],root)
    manifests={}
    for name,func in [('a','entryA'),('b','entryB')]:
        src=name+'.cpp'
        ast=parse_json_stream(capture(['clang++','-std=c++14','-Xclang','-ast-dump=json',
                       '-fsyntax-only',src],root))
        code,rows=produce(ast,root/src,src,source_root=root,header_dependency_closure=True)
        assert all(r['status']=='source-first' for r in rows),rows
        assert len([r for r in rows if r['source_name'] in ('shifted','scale')])==2,rows
        assert all(r.get('odr_inline') for r in rows if r['source_name'] in ('shifted','scale')),rows
        assert all('__header_' in r['name'] for r in rows if r['source_name']=='hidden'),rows
        manifests[src]={'manifest':{'definitions':rows},'module':None}
        (root/(name+'.mjs')).write_text('const i32=x=>x|0;\n'+'\n'.join(code)+f'\nfor(let i=-100;i<100;i++)console.log({func}(i));\n')
        capture(['node','--check',name+'.mjs'],root)
    owners,ambiguous=ownership(manifests)
    assert not ambiguous,ambiguous
    assert len([key for key in owners if key in ('scale','shifted')])==2,owners
    # A different implementation under a purported shared ODR name must
    # remain ambiguous. The canonicalizer may never silently pick a winner.
    import copy
    conflicting=copy.deepcopy(manifests)
    row=next(r for r in conflicting['b.cpp']['manifest']['definitions'] if r['name']=='shifted')
    row['odr_inline']['semantic_sha256']='f'*64
    _,bad=ownership(conflicting)
    assert 'shifted' in bad,bad
    a=capture(['node','a.mjs'],root).splitlines()
    b=capture(['node','b.mjs'],root).splitlines()
    expected=[' '.join((a[i],b[i])) for i in range(200)]
    assert expected==native.splitlines(),(expected[:5],native.splitlines()[:5])
    print('PASS: 400 original C++/JS results across inline-header functions and canonical ODR owners')

with tempfile.TemporaryDirectory() as tmp:
    root=Path(tmp)
    (root/'main.cpp').write_text('''extern int shared;
int witness(int a) {
    if(a < 0) { int shared = a*2; a += shared; }
    return shared+a;
}
''')
    (root/'native.cpp').write_text('''#include <cstdio>
int witness(int);
int main(){for(int i=-128;i<128;i++)printf("%d\\n",witness(i));}
''')
    (root/'external.cpp').write_text('int shared=77;\n')
    capture(['clang++','-std=c++14','main.cpp','external.cpp','native.cpp','-o','native'],root)
    expected=capture([str(root/'native')],root)
    ast=parse_json_stream(capture(['clang++','-std=c++14','-Xclang','-ast-dump=json',
                                   '-fsyntax-only','main.cpp'],root))
    code,rows=produce(ast,root/'main.cpp','main.cpp',source_root=root)
    witness=next(r for r in rows if r['name']=='witness')
    assert witness['status']=='blocked' and 'shared' in witness.get('unresolved_references',[]),witness
    code,rows=produce(ast,root/'main.cpp','main.cpp',source_root=root,project_symbols={'shared':'external.cpp'})
    witness=next(r for r in rows if r['name']=='witness')
    assert witness['status']=='source-first' and 'shared' in witness['external_imports'],witness
    # Assemble through the production owner/storage ABI rather than manually
    # inventing a JS global beside produce() output.
    plan=root/'plan.json';out=root/'compiled'
    plan.write_text(json.dumps({'root':str(root),'units':[{'source':'main.cpp'},{'source':'external.cpp'}]}))
    build=json.loads(capture([sys.executable,str(ROOT/'tools/source_first_project.py'),
        '--plan',str(plan),'--out-dir',str(out),'--strict'],ROOT))
    assert not build['invalid_imports'] and build['source_definitions_blocked']==0,build
    (root/'out.mjs').write_text('import {witness} from '+json.dumps((out/'main.cpp.mjs').as_uri())+
        ';\nfor(let i=-128;i<128;i++)console.log(witness(i));\n')
    actual=capture(['node','out.mjs'],root)
    assert expected==actual,(expected[:120],actual[:120])
    print('PASS: 256 native C++/JS global-shadow reference results and strict linker diagnostics')

with tempfile.TemporaryDirectory() as tmp:
    root=Path(tmp)
    (root/'scope.cpp').write_text('''struct Slot { int value; };
struct Slot* Slot;
int scoped(int x) { int Slot=x+1; return Slot; }
int unresolved_global() { return Slot->value; }
int independent() { return 9; }
''')
    (root/'native.cpp').write_text('''#include <cstdio>
int scoped(int); int independent();
int main(){for(int i=-32;i<32;i++)printf("%d %d\\n",scoped(i),independent());}
''')
    capture(['clang++','-std=c++14','scope.cpp','native.cpp','-o','native'],root)
    expected=capture([str(root/'native')],root)
    ast=parse_json_stream(capture(['clang++','-std=c++14','-Xclang','-ast-dump=json',
        '-fsyntax-only','scope.cpp'],root))
    code,rows=produce(ast,root/'scope.cpp','scope.cpp',source_root=root)
    local=next(r for r in rows if r['name']=='scoped')
    uncertain=next(r for r in rows if r['name']=='unresolved_global')
    independent=next(r for r in rows if r['name']=='independent')
    assert local['status']==independent['status']=='source-first',(local,independent)
    assert uncertain['status']=='blocked' and 'ambiguous' in uncertain['reason'],uncertain
    (root/'out.mjs').write_text('const i32=x=>Number(x)|0;\n'+'\n'.join(code)+
        '\nfor(let i=-32;i<32;i++)console.log(scoped(i),independent());\n')
    assert capture(['node','out.mjs'],root)==expected
    print('PASS: 128 native C++/JS scoped-name results; ambiguous global blocks only its definition')

with tempfile.TemporaryDirectory() as tmp:
    root=Path(tmp)
    (root/'state.hpp').write_text('inline int stateful(int x) { static int count = 0; count += x; return count; }\n')
    (root/'main.cpp').write_text('#include "state.hpp"\nint entry(int x) { return stateful(x); }\n')
    ast=parse_json_stream(capture(['clang++','-std=c++14','-Xclang','-ast-dump=json','-fsyntax-only','main.cpp'],root))
    _,rows=produce(ast,root/'main.cpp','main.cpp',source_root=root,header_dependency_closure=True)
    entry=next(r for r in rows if r['name']=='entry')
    assert entry['status']=='blocked' and 'stateful' in entry.get('unresolved_references',[]),entry
    assert not any(r.get('source_name')=='stateful' and r['status']=='source-first' for r in rows)
    print('PASS: static-local inline state and conflicting header ODR are rejected')

with tempfile.TemporaryDirectory() as tmp:
    root=Path(tmp)
    (root/'main.cpp').write_text('''int bounded(int in,int min,int max) {
  if (in < min) return min;
  if (in > max) return max;
  return in;
}
''')
    (root/'ref.cpp').write_text('''#include <cstdio>
int bounded(int,int,int);
int main() {for(int i=-64;i<64;i++)printf("%d\\n",bounded(i,-12,23));}
''')
    capture(['clang++','-std=c++14','main.cpp','ref.cpp','-o','native'],root)
    expected=capture([str(root/'native')],root)
    ast=parse_json_stream(capture(['clang++','-std=c++14','-Xclang','-ast-dump=json','-fsyntax-only','main.cpp'],root))
    code,rows=produce(ast,root/'main.cpp','main.cpp',source_root=root)
    assert all(r['status']=='source-first' for r in rows),rows
    (root/'out.mjs').write_text('const i32=x=>Number(x)|0;\n'+'\n'.join(code)+
        '\nfor(let i=-64;i<64;i++)console.log(bounded(i,-12,23));\n')
    actual=capture(['node','out.mjs'],root)
    assert expected==actual,(expected[:300],actual[:300])
    print('PASS: 128 native C++/JS reserved-keyword parameter comparisons')
