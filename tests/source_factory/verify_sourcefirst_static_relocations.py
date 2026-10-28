#!/usr/bin/env python3
"""Native differential proof for original-source static pointer relocations.

Global addresses must preserve alias identity, mutation and forward/cyclic
initialization. Export counts and independently allocated copies cannot pass.
"""
from pathlib import Path
import json, os, subprocess, sys, tempfile
ROOT=Path(__file__).resolve().parents[2]

def run(command,cwd,timeout=90):
    result=subprocess.run(command,cwd=cwd,capture_output=True,text=True,timeout=timeout)
    assert result.returncode==0,(command,result.stdout[-1500:],result.stderr[-3500:])
    return result.stdout

with tempfile.TemporaryDirectory(prefix='eduke-static-address-') as temporary:
    directory=Path(temporary)
    (directory/'unit.cpp').write_text(r'''
static int count=7;
static int values[4]={11,13,17,19};
static int twice(int x){return x*2;}
struct Entry { int *setting; int (*callback)(int); const char *label; };
static Entry entries[2]={{&count,twice,"A"},{values+2,&twice,"B"}};
static int *aliases[3]={&count,&values[1],values+3};
struct Node { Node *next; int value; };
extern Node second;
Node first={&second,3};
Node second={&first,5};
extern int forward_values[3];
struct Forward {int *array; int *field;};
static Forward forward={forward_values+1,&second.value};
int forward_values[3]={23,29,31};
extern int unprovided;
struct Missing {int *pointer;};
static Missing forbidden_missing={&unprovided};
static Missing forbidden_numeric={(int *)123};
static int *choose_address(){return &count;}
static Missing forbidden_dynamic={choose_address()};
extern "C" int exercise(int n){
  *entries[n&1].setting+=n;
  *aliases[n%3]^=n;
  first.next->value+=n&3;
  second.next->value^=n&7;
  *forward.array+=n&1;
  *forward.field+=n&1;
  return count+values[0]+values[1]+values[2]+values[3]
    +(*entries[n&1].callback)(n)+entries[n&1].label[0]
    +first.value+second.value+forward_values[1];
}
extern "C" int identities(){
 return (entries[0].setting==&count)+2*(aliases[1]==&values[1])
   +4*(first.next==&second)+8*(second.next==&first)
   +16*(forward.array==forward_values+1)+32*(forward.field==&second.value)
   +64*(entries[0].callback==&twice);
}
''')
    (directory/'driver.cpp').write_text(r'''#include <cstdio>
extern "C" int exercise(int),identities();
int main(){for(int i=0;i<512;i++)printf("%d,%d\n",exercise(i%37),identities());}
''')
    # Unprovided is deliberately not called by the native oracle, but the
    # original static relocation still needs a link owner in a native binary.
    (directory/'unprovided.cpp').write_text('int unprovided=999;\n')
    executable=directory/('native.exe' if os.name=='nt' else 'native')
    run(['clang++','-std=c++14','unit.cpp','driver.cpp','unprovided.cpp','-o',str(executable)],directory)
    expected=run([str(executable)],directory).splitlines()
    run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(directory),
         '--source','unit.cpp','--out-dir',str(directory/'out')],directory)
    module=directory/'out/unit.cpp.mjs'
    manifest=json.loads(module.with_suffix('.manifest.json').read_text())
    definitions={row['source_name']:row for row in manifest['definitions']}
    for name in ('entries','aliases','first','second','forward','exercise','identities'):
        assert definitions[name]['status']=='source-first',(name,definitions[name])
    for name in ('forbidden_missing','forbidden_numeric','forbidden_dynamic'):
        assert definitions[name]['status']=='blocked',(name,definitions[name])
    run(['node','--check',str(module)],directory)
    (directory/'runner.mjs').write_text('import {exercise,identities} from '+json.dumps(module.as_uri())+';\n'
        +'for(let i=0;i<512;i++)console.log(`${exercise(i%37)},${identities()}`);\n')
    observed=run(['node','runner.mjs'],directory).splitlines()
    assert observed==expected,next(((i,a,b) for i,(a,b) in enumerate(zip(observed,expected)) if a!=b),None)
    print('PASS 1024 native C++/JS values: static scalar/field/array/function addresses, alias mutation, forward and cyclic source relocations; unowned extern remains blocked')
