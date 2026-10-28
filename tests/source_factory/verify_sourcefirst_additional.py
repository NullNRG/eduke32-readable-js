#!/usr/bin/env python3
"""Test real original EDuke32 pitch and native C++ pointer-reference parity."""
import json,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
SRC=ROOT/'factory-output/source-tree/eduke32-master'
T=ROOT/'tests/source_factory'
OUT=ROOT/'factory-output/source-first'

def run(args):
 p=subprocess.run(args,cwd=ROOT,capture_output=True,text=True,timeout=90)
 if p.returncode:raise RuntimeError(f'{args!r}: {p.stderr[-2000:]} {p.stdout[-200:]}')
 return p.stdout

def emit(root,filename,filters):
 data=json.loads(run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(root),
   '--source',filename,'--filter',filters,'--out-dir',str(OUT)]))
 if not data['file']:raise RuntimeError('No generated JavaScript '+filename)
 run(['node','--check',data['file']])
 return data

pitch=emit(SRC,'source/audiolib/src/pitch.cpp','PITCH_,PitchTable')
ref=emit(T,'source_first_reference_fixture.cpp','increaseThroughPtr,updateLocal,changeArray')
assert pitch['emitted']==3 and pitch['blocked']==0
assert ref['emitted']==3 and ref['blocked']==0
with tempfile.TemporaryDirectory() as temporary:
 td=Path(temporary)
 native_pitch=td/'native_pitch'
 run(['clang++','-std=gnu++14','-O1','-fno-strict-aliasing','-funsigned-char',
 '-I'+str(SRC/'source/audiolib/src'),'-I'+str(SRC/'source/build/include'),
 '-I'+str(SRC/'source/mact/include'),str(SRC/'source/audiolib/src/pitch.cpp'),
 str(T/'source_first_pitch_native.cpp'),'-o',str(native_pitch)])
 pitch_data=td/'pitch.csv';pitch_data.write_text(run([str(native_pitch)]))
 native_ref=td/'native_ref'
 run(['clang++','-std=gnu++14','-O1',str(T/'source_first_reference_fixture.cpp'),
      str(T/'source_first_reference_native.cpp'),'-o',str(native_ref)])
 ref_data=td/'ref.csv';ref_data.write_text(run([str(native_ref)]))
 js=f'''import fs from 'node:fs';
import * as pitch from {json.dumps((OUT/'source/audiolib/src/pitch.cpp.mjs').as_uri())};
import * as ref from {json.dumps((OUT/'source_first_reference_fixture.cpp.mjs').as_uri())};
let checks=0,pitchChecks=0,refChecks=0;
for(const row of fs.readFileSync({json.dumps(str(pitch_data))},'utf8').trim().split('\\n')){{
 const [x,expected]=row.split(',').map(Number);
 const actual=pitch.PITCH_GetScale(x);
 if(actual!==expected)throw Error('pitch parity '+x+': native '+expected+' JS '+actual);
 checks++;pitchChecks++;
}}
for(const row of fs.readFileSync({json.dumps(str(ref_data))},'utf8').trim().split('\\n')){{
 const [x,old,next,updated,changed]=row.split(',').map(Number);
 const p={{value:x}};
 if(ref.increaseThroughPtr(p)!==old||p.value!==next||ref.updateLocal(x)!==updated)throw Error('scalar pointer '+row);
 const a=[x,x+1,x+2,x+3],pos=(x+1000)%4;
 if(ref.changeArray(a,pos)!==changed||a[pos]!==changed)throw Error('array pointer '+row);
 checks+=4;refChecks+=4;
}}
console.log(JSON.stringify({{checks,pitch_checks:pitchChecks,reference_checks:refChecks}}));
'''
 entry=td/'verify.mjs';entry.write_text(js)
 data=json.loads(run(['node',str(entry)]))
summary={'native_parity':data,'original_pitch_emitted':pitch['emitted'],
         'reference_definitions_emitted':ref['emitted'],'source_first':True,'playable':False}
(OUT/'additional-verification.json').write_text(json.dumps(summary,indent=2))
print(json.dumps(summary,indent=2))
