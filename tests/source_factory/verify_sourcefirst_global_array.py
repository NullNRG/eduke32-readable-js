#!/usr/bin/env python3
"""Native C++ parity for zero/initialized typed-array C globals."""
from pathlib import Path
import json,subprocess,sys,tempfile
ROOT=Path(__file__).resolve().parents[2]
TEST=ROOT/'tests/source_factory'
OUT=ROOT/'factory-output/source-first'
def run(args):
 p=subprocess.run(args,cwd=ROOT,capture_output=True,text=True,timeout=90)
 if p.returncode:raise RuntimeError(' '.join(args)+'\n'+p.stderr[-1500:]+'\n'+p.stdout[-500:])
 return p.stdout
report=json.loads(run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),
 '--root',str(TEST),'--source','source_first_global_array_fixture.cpp',
 '--filter','history,grid,lookupSum,updateGrid','--out-dir',str(OUT)]))
assert report['emitted']==4 and report['blocked']==0
with tempfile.TemporaryDirectory() as d:
 d=Path(d);native=d/'native';run(['clang++','-std=gnu++14','-O1',str(TEST/'source_first_global_array_fixture.cpp'),str(TEST/'source_first_global_array_native.cpp'),'-o',str(native)])
 data=d/'native.csv';data.write_text(run([str(native)]))
 src=f'''import fs from 'node:fs';import * as m from {json.dumps((OUT/'source_first_global_array_fixture.cpp.mjs').as_uri())};
let pass=0;for(const line of fs.readFileSync({json.dumps(str(data))},'utf8').trim().split('\\n')){{
const [i,row,col,v]=line.split(',').map(Number);
if(i%7===0)m.updateGrid(row,col,Math.imul(i,1234567)>>>0);
if((m.lookupSum(i%6)>>>0)!==v)throw Error('global C array mismatch '+line);
pass++;
}}console.log(JSON.stringify({{native_global_array_checks:pass}}));'''
 script=d/'test.mjs';script.write_text(src)
 result=json.loads(run(['node',str(script)]))
(OUT/'global-array-verification.json').write_text(json.dumps(result,indent=2))
print(json.dumps(result,indent=2))
