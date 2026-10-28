#!/usr/bin/env python3
"""Reproducible source-AST generated JS/native C++ parity and readable-class tests."""
from pathlib import Path
import json, subprocess, sys, tempfile
ROOT=Path(__file__).resolve().parents[2]
SRC=ROOT/'factory-output/source-tree/eduke32-master'
TEST=ROOT/'tests/source_factory'

def run(args,cwd=ROOT):
    p=subprocess.run(args,cwd=cwd,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
    if p.returncode:raise RuntimeError('Command failed: '+str(args)+'\n'+p.stderr[-4000:]+'\n'+p.stdout[-800:])
    return p.stdout

def main():
    compiler=ROOT/'tools/source_ast_to_js.py'
    def emit(root,file,filter):
        return json.loads(run([sys.executable,str(compiler),'--root',str(root),'--source',file,'--filter',filter,'--out-dir',str(ROOT/'factory-output/source-first')]))
    fixed=emit(SRC,'source/build/src/fix16.cpp','fix16_,FIX16_')
    fixture=emit(TEST,'source_first_ast_fixture.cpp','Counter,positive,countUntil')
    for record in (fixed,fixture):run(['node','--check',record['file']])
    cpp=str(SRC/'source/build/src/fix16.cpp')
    with tempfile.TemporaryDirectory() as td:
        executable=Path(td)/'native_fix16'
        run(['clang++','-std=gnu++14','-O1','-fno-strict-aliasing','-funsigned-char',
             '-I'+str(SRC/'source/build/include'),'-I'+str(SRC/'source/mact/include'),
             cpp,str(TEST/'source_first_fix16_native.cpp'),'-o',str(executable)])
        native=run([str(executable)]).strip().splitlines()
        script='''import * as f from process.argv[1];\n'''
        # Node accepts an absolute file:// URI in dynamic import.
        data=Path(td)/'native.json';data.write_text(json.dumps(native))
        js=f'''import fs from 'node:fs';
import * as fix from {json.dumps((ROOT/'factory-output/source-first/source/build/src/fix16.cpp.mjs').resolve().as_uri())};
import * as fixture from {json.dumps((ROOT/'factory-output/source-first/source_first_ast_fixture.cpp.mjs').resolve().as_uri())};
const lines = JSON.parse(fs.readFileSync({json.dumps(str(data))}, 'utf8'));
const operations=['fix16_add','fix16_sub','fix16_sadd','fix16_ssub','fix16_mul','fix16_smul','fix16_lerp32'];
let checks=0;
for (const line of lines) {{
 const [a,b,...expected] = line.split(',').map(Number);
 for (let i=0;i<operations.length;i++) {{
   const name=operations[i], value=name==='fix16_lerp32'?fix[name](a,b,1):fix[name](a,b);
   if (value!==expected[i]) throw Error(name+' parity mismatch ('+a+','+b+'): '+value+' vs '+expected[i]);
   checks++;
 }}
}}
const counter=new fixture.Counter(4);
if(counter.add(3)!==7 || counter.scale(5)!==17)throw Error('C++ class method parity failed');
checks+=2;
for(let n=-100;n<100;n++){{
 if(fixture.positive(n)!==Math.max(0,n))throw Error('if/return parity '+n);
 if(n>=0&&fixture.countUntil(n)!==n*(n-1)/2)throw Error('for parity '+n);
 checks++;
}}
console.log(JSON.stringify({{native_parity_checks:lines.length*operations.length,fixture_checks:202,total_checks:checks}}));
'''
        js_file=Path(td)/'run.mjs';js_file.write_text(js)
        result=json.loads(run(['node',str(js_file)]))
    summary={'status':'passed','exact_original_source':'source/build/src/fix16.cpp',
             'source_first_artifacts':[fixed,fixture], 'native_clang':'clang++', 'checks':result,
             'llvm_backend_used':False,'whole_game_transpiled':False}
    out=ROOT/'factory-output/source-first/verification.json';out.write_text(json.dumps(summary,indent=2))
    print(json.dumps(summary,indent=2));return 0
if __name__=='__main__':sys.exit(main())
