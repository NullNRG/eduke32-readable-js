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
#include <cstring>
#include <cstdint>
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
static int initialization_order=0;
static int observe_initialization(){return ++initialization_order;}
Node initialized_once={&second,observe_initialization()};
static int observed_after=initialization_order;
extern "C" int initialization_check(){return observed_after*10+initialization_order+initialized_once.value;}
Node ring[2]={{&ring[1],11},{&ring[0],13}};
Node grid[2][2]={{{&grid[1][1],17},{&ring[0],19}},{{&grid[0][0],23},{&grid[0][1],29}}};
struct PointerGroup {Node *links[2];};
static PointerGroup group={{&first,&ring[1]}};
static_assert(sizeof(Node)==16,"native fixture ABI");
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
  static Entry local_entry={&count,twice,"L"};
  *entries[n&1].setting+=n;
  *local_entry.setting+=n&1;
  *aliases[n%3]^=n;
  first.next->value+=n&3;
  second.next->value^=n&7;
  *forward.array+=n&1;
  *forward.field+=n&1;
  ring[n&1].next->value+=n&3;
  grid[(n>>1)&1][n&1].next->value^=n&7;
  group.links[1]->value+=n&1;
  return count+values[0]+values[1]+values[2]+values[3]
    +(*entries[n&1].callback)(n)+entries[n&1].label[0]
    +first.value+second.value+forward_values[1]+ring[0].value+ring[1].value
    +grid[0][0].value+grid[0][1].value+grid[1][0].value+grid[1][1].value;
}
extern "C" int identities(){
 uintptr_t bytes=0;std::memcpy(&bytes,&ring[0],sizeof(void*));
 return (entries[0].setting==&count)+2*(aliases[1]==&values[1])
   +4*(first.next==&second)+8*(second.next==&first)
   +16*(forward.array==forward_values+1)+32*(forward.field==&second.value)
   +64*(entries[0].callback==&twice)+128*(ring[0].next==&ring[1])
   +256*(grid[0][0].next==&grid[1][1])+512*(grid[1][1].next==&grid[0][1])
   +1024*(bytes==(uintptr_t)&ring[1])+2048*(group.links[0]==&first);
}
''')
    (directory/'driver.cpp').write_text(r'''#include <cstdio>
extern "C" int exercise(int),identities(),initialization_check();
int main(){printf("%d,%d\n",identities(),initialization_check());for(int i=0;i<512;i++)printf("%d,%d\n",exercise(i%37),identities());}
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
    local_record = next(line for line in module.read_text().splitlines()
                        if line.startswith('let __static_exercise_local_entry = '))
    assert 'cStaticInitializerValues(' in local_record and 'cStaticReference(' in local_record
    manifest=json.loads(module.with_suffix('.manifest.json').read_text())
    definitions={row['source_name']:row for row in manifest['definitions']}
    for name in ('entries','aliases','first','second','forward','exercise','identities'):
        assert definitions[name]['status']=='source-first',(name,definitions[name])
    for name in ('forbidden_missing','forbidden_numeric','forbidden_dynamic'):
        assert definitions[name]['status']=='blocked',(name,definitions[name])
    run(['node','--check',str(module)],directory)
    (directory/'runner.mjs').write_text('import {exercise,identities,initialization_check} from '+json.dumps(module.as_uri())+';\n'
        +'console.log(`${identities()},${initialization_check()}`);for(let i=0;i<512;i++)console.log(`${exercise(i%37)},${identities()}`);\n')
    observed=run(['node','runner.mjs'],directory).splitlines()
    assert observed==expected,next(((i,a,b) for i,(a,b) in enumerate(zip(observed,expected)) if a!=b),None)
    print('PASS 1026 native C++/JS values: static byte-backed records/ND arrays, forward/cyclic addresses, raw pointer copies, pointer members and scalar initialization order; unowned extern remains blocked')
