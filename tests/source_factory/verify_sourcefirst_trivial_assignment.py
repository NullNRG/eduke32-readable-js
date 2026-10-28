#!/usr/bin/env python3
"""Native differential tests for Clang-proven implicit POD assignment semantics."""
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[2]
TOOLS = Path(os.environ.get('EDUKE_TEST_COMPILER_DIR', ROOT/'tools'))
sys.path.insert(0,str(TOOLS))
from source_trivial_assignment import recover_trivial_assignment_methods


def run(args, cwd):
    result = subprocess.run(args,cwd=cwd,capture_output=True,text=True,timeout=100)
    assert result.returncode == 0, (args,result.stdout[-1500:],result.stderr[-3000:])
    return result.stdout


with tempfile.TemporaryDirectory(prefix='source-trivial-assignment-') as temp:
    root = Path(temp)
    (root/'unit.cpp').write_text('''
struct Child { int values[2]; };
struct Pod { Child child; unsigned values[3]; int tag; };
union Word { unsigned value; unsigned char bytes[4]; };
int copy_case(int x) {
  Pod a{}, b={{{x,x+1}}, {(unsigned)(x+3),5,7}, x+2};
  unsigned *alias=a.values;
  int *nested_alias=a.child.values;
  a=b;
  b.values[0]=999;
  b.child.values[1]=123;
  return (int)alias[0]+nested_alias[1]+a.tag;
}
int chain_case(int x) {
  Pod a{},b{},c{};
  c.tag=x;
  (a=b=c).tag+=3;
  return a.tag*100+b.tag*10+c.tag;
}
int move_case(int x) {
  Pod a{};
  unsigned *alias=a.values;
  a=Pod{{{x,-x}}, {11,13,17}, x+2};
  return a.child.values[0]+a.child.values[1]+(int)alias[2]+a.tag;
}
int self_case(int x) {
  Pod a={{{x,x+1}}, {19,23,29},x};
  unsigned *alias=a.values;
  a=a;
  return a.tag+(int)alias[1]+a.child.values[1];
}
unsigned union_case(int x) {
  Word a={0},b={(unsigned)x*1664525u+1013904223u};
  unsigned char *alias=a.bytes;
  a=b;
  b.value=0;
  a=a;
  return (unsigned)alias[0]+a.bytes[1]*3u+a.bytes[2]*5u+a.bytes[3]*7u;
}
struct PointerPod { int *value; };
int borrowed_pointer_assignment(int x) { int source=x; PointerPod a{},b{}; b.value=&source; a=b; *a.value+=7; return source+*b.value; }
struct Custom {
  int value;
  Custom& operator=(const Custom &other) { value=other.value+9; return *this; }
};
int rejected_custom_assignment(int x) { Custom a{},b{}; b.value=x; a=b; return a.value; }
struct Lifetime { int value; ~Lifetime() {} };
int rejected_lifetime_assignment(int x) { Lifetime a{},b{}; a=b; return x; }
''', encoding='utf-8')
    (root/'main.cpp').write_text('''#include <cstdio>
int copy_case(int);int chain_case(int);int move_case(int);int self_case(int);unsigned union_case(int);
int rejected_custom_assignment(int);
int borrowed_pointer_assignment(int);
int main(){for(int x=-96;x<96;x++)printf("%d,%d,%d,%d,%u,%d,%d\\n",copy_case(x),chain_case(x),move_case(x),self_case(x),union_case(x),rejected_custom_assignment(x),borrowed_pointer_assignment(x));}
''',encoding='utf-8')
    run(['clang++','-std=c++14','unit.cpp','main.cpp','-o','native.exe'],root)
    expected=run([str(root/'native.exe')],root).splitlines()
    run([sys.executable,str(TOOLS/'source_ast_to_js.py'),'--root',str(root),
         '--source','unit.cpp','--out-dir',str(root/'out')],root)
    module=root/'out/unit.cpp.mjs'
    manifest=json.loads(module.with_suffix('.manifest.json').read_text())
    rows={row['source_name']:row for row in manifest['definitions']}
    for name in ('copy_case','chain_case','move_case','self_case','union_case','rejected_custom_assignment','borrowed_pointer_assignment'):
        assert rows[name]['status']=='source-first',(name,rows[name])
        assert not rows[name].get('external_imports'),rows[name]
    for name in ('rejected_lifetime_assignment',):
        assert rows[name]['status']=='blocked',(name,rows[name])
    run(['node','--check',str(module)],root)
    (root/'driver.mjs').write_text('import {copy_case,chain_case,move_case,self_case,union_case,rejected_custom_assignment,borrowed_pointer_assignment} from '+json.dumps(module.as_uri())+';\n'
        +'for(let x=-96;x<96;x++)console.log(`${copy_case(x)},${chain_case(x)},${move_case(x)},${self_case(x)},${union_case(x)},${rejected_custom_assignment(x)},${borrowed_pointer_assignment(x)}`);\n',encoding='utf-8')
    observed=run(['node',str(root/'driver.mjs')],root).splitlines()
    assert observed==expected,next(((i,a,b) for i,(a,b) in enumerate(zip(expected,observed)) if a!=b),None)

    # Declaration IDs and Clang's selected assignment traits are mandatory.
    method={'kind':'CXXMethodDecl','id':'assignment','name':'operator=','isImplicit':True,
            'explicitlyDefaulted':'default','type':{'qualType':'P &(const P &)'},
            'inner':[{'kind':'ParmVarDecl','type':{'qualType':'const P &'}}]}
    record={'kind':'CXXRecordDecl','id':'record','completeDefinition':True,
            'definitionData':{'isStandardLayout':True,'isAggregate':True,'isTriviallyCopyable':True,
                              'dtor':{'trivial':True},'copyAssign':{'trivial':True}},'inner':[method]}
    assert 'assignment' in recover_trivial_assignment_methods([record])
    method['isImplicit']=False
    assert not recover_trivial_assignment_methods([record])
    method['isImplicit']=True
    record['definitionData']['copyAssign']['trivial']=False
    assert not recover_trivial_assignment_methods([record])
    record['definitionData']['copyAssign']['trivial']=True
    method['explicitlyDeleted']=True
    assert not recover_trivial_assignment_methods([record])

print('PASS: 1344 native comparisons for implicit copy/move, record/array/borrowed-pointer aliases, chained result, self-assignment, unions and original custom operator; nontrivial lifetime operators stay blocked')
