#!/usr/bin/env python3
"""Differential C++/JS verified pointer-backed source class range loops."""
import json,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
SOURCE='tests/source_factory/source_first_pointer_span_fixture.cpp'
def run(cmd):
    p=subprocess.run(cmd,cwd=ROOT,capture_output=True,text=True,timeout=120)
    assert p.returncode==0,(cmd,p.stdout[-1200:],p.stderr[-2500:]);return p.stdout
with tempfile.TemporaryDirectory(prefix='span_parity_') as directory:
    temp=Path(directory)
    run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(ROOT),
         '--source',SOURCE,'--filter','span_','--out-dir',str(temp)])
    module=temp/(SOURCE+'.mjs')
    manifest=json.loads(module.with_suffix('.manifest.json').read_text())
    definitions={d['source_name']:d for d in manifest['definitions']}
    assert definitions['span_numbers']['status']=='source-first',definitions['span_numbers']
    assert definitions['span_pointers']['status']=='source-first',definitions['span_pointers']
    assert definitions['span_invalid']['status']=='blocked',definitions['span_invalid']
    assert manifest['output'] and 'NumberSpan' in manifest.get('span_closure',{}).get('proven',[])
    run(['node','--check',str(module)])
    (temp/'main.cpp').write_text('''#include <cstdio>
#include "''' + str(ROOT/SOURCE) + '''"
int main(){for(int n=-255;n<257;++n){
 int a[3]={n,n+1,n-2}; int x=n*2,y=n-3,z=n+9;int *p[3]={&x,&y,&z};
 NumberSpan ns={a,3}; PointerSpan ps={p,3};
 printf("%d,%d\\n",span_numbers(ns,n),span_pointers(ps,n));
}}
''')
    run(['clang++','-std=c++14',str(temp/'main.cpp'),'-o',str(temp/'native')])
    native=run([str(temp/'native')]).splitlines()
    (temp/'runner.mjs').write_text('import {span_numbers,span_pointers} from '+json.dumps(module.as_uri())+';\n'
      'for(let n=-255;n<257;++n){const a=new Int32Array([n,n+1,n-2]);'
      'const p=[new Int32Array([n*2]),new Int32Array([n-3]),new Int32Array([n+9])];'
      'console.log(span_numbers({data_:a,length_:3},n)+","+span_pointers({data_:p,length_:3},n));}\n')
    js=run(['node',str(temp/'runner.mjs')]).splitlines()
    assert js==native,next(((i,x,y) for i,(x,y) in enumerate(zip(native,js)) if x!=y),None)
    # Zero-sized null array is legal. Overrunning or wrong stride never is.
    (temp/'safety.mjs').write_text('import {span_numbers,span_pointers} from '+json.dumps(module.as_uri())+';\n'
      'if(span_numbers({data_:null,length_:0},7)!==7)throw Error("empty");\n'
      'for(const obj of [{data_:[1],length_:2},{data_:[],length_:-1},'
      '{data_:{__cPointer:true,array:true,buffer:[1],offset:0,lower:0,upper:8,stride:8},length_:1},'
      '{data_:new Uint8Array([1,2]),length_:1}]){' 
      'let rejected=false;try{span_numbers(obj,0)}catch(e){rejected=true}if(!rejected)throw Error("bounds");}\n')
    run(['node',str(temp/'safety.mjs')])
    print('PASS: 1,024 native/JS pointer-span comparisons; Clang filtered class closure; invalid layouts, stride and bounds rejected')
