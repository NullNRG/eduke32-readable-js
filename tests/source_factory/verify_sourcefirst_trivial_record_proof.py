"""Original implicit trivial assignment across different JS prototypes, versus native."""
import copy,json,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def run(args,cwd=ROOT):
 p=subprocess.run(list(map(str,args)),cwd=cwd,capture_output=True,text=True,timeout=180)
 assert p.returncode==0,(p.stdout[-1800:],p.stderr[-2400:]);return p.stdout
with tempfile.TemporaryDirectory() as directory:
 root=Path(directory);source=root/'source';source.mkdir();out=root/'out'
 (source/'types.hpp').write_text('#pragma once\ntemplate<class T>struct Vec{T x,y;int sum()const{return x+y;}};typedef Vec<int> Value;\n')
 (source/'provider.cpp').write_text('#include "types.hpp"\nValue make(int n){return {n,n*3};}int marker(){Value v{1,2};return v.sum();}\n')
 (source/'consumer.cpp').write_text('#include "types.hpp"\nstatic Value sink;int take(Value v){sink=v;int *alias=&sink.x;sink=sink;return *alias*31+sink.y;}\n')
 (source/'main.cpp').write_text('#include <cstdio>\n#include "types.hpp"\nValue make(int);int take(Value);int main(){for(int n=-256;n<256;n++)printf("%d\\n",take(make(n)));}\n')
 exe=root/'native.exe';run(['clang++','-std=c++14',source/'provider.cpp',source/'consumer.cpp',source/'main.cpp','-o',exe]);expected=run([exe]).splitlines()
 base=[sys.executable,ROOT/'tools/source_ast_to_js.py','--root',source,'--out-dir',out,'--header-dependency-closure','--require-record-layouts']
 run([*base,'--source','provider.cpp'])
 provider=json.loads((out/'provider.cpp.manifest.json').read_text());assert provider['blocked']==0,provider
 index=root/'index.json';index.write_text(json.dumps({'make':'provider.cpp','marker':'provider.cpp'}))
 stage=root/'consumer'
 run([*base,'--source','consumer.cpp','--out-dir',stage,'--project-symbols',index,'--import-root',out])
 consumer=json.loads((stage/'consumer.cpp.manifest.json').read_text());assert consumer['blocked']==0,consumer
 row=next(r for r in consumer['definitions'] if r['name']=='take');proofs=row['trivial_record_assignment_proofs'];assert len(proofs)==2
 proof=proofs[0];assert proof['record_name']==proof['source_record'] and proof['clang_method_id']
 script=root/'check.mjs';script.write_text('import {make} from '+json.dumps((out/'provider.cpp.mjs').as_uri())+';import {take} from '+json.dumps((stage/'consumer.cpp.mjs').as_uri())+';for(let n=-256;n<256;n++)console.log(take(make(n)));')
 assert run(['node',script]).splitlines()==expected
 # Exercise the emitted helper with source-backed bytes, retaining the strict
 # generic copy path and rejecting physical layout or proof changes.
 helper=stage/'helper.mjs';helper.write_text((stage/'consumer.cpp.mjs').read_text()+'\nexport {cInitByteRecord,cAssignAggregate};\n')
 (root/'negative.mjs').write_text("""import assert from 'node:assert/strict';import {cInitByteRecord,cAssignAggregate} from HELPER;
const schema={align:4,arrayAlign:1,fields:{x:{native:'Int32Array',offset:0,size:4},y:{native:'Int32Array',offset:4,size:4}},overlaps:false,size:8,union:false};
const target=cInitByteRecord(schema,{x:1,y:2}),source=cInitByteRecord({...schema,prototype:'V'},{x:7,y:9},null,{V:()=>({})});
const prototype=Object.getPrototypeOf(target),p=PROOF;
assert.throws(()=>cAssignAggregate(target,source,{byteRecord:schema}),/exact original/);
assert.equal(cAssignAggregate(target,source,{byteRecord:schema},p),target);assert.equal(target.x,7);assert.equal(target.y,9);assert.equal(Object.getPrototypeOf(target),prototype);
assert.throws(()=>cAssignAggregate(target,source,{byteRecord:schema},{...p,source_record:'Other'}),/proof/);
const wrong=cInitByteRecord({...schema,fields:{x:{native:'Int16Array',offset:0,size:2},y:{native:'Int32Array',offset:4,size:4}}},{x:5,y:8});
assert.throws(()=>cAssignAggregate(target,wrong,{byteRecord:schema},p),/native layout/);assert.equal(target.x,7);assert.equal(target.y,9);
""".replace('HELPER',json.dumps(helper.as_uri())).replace('PROOF',json.dumps(proof)))
 run(['node',root/'negative.mjs'])
 (source/'custom.cpp').write_text('struct Custom{int x,y;Custom&operator=(const Custom&o){x=o.x+1000;y=o.y;return *this;}};int custom(){Custom a{1,2},b{3,4};a=b;return a.x*31+a.y;}\n')
 run([*base,'--source','custom.cpp'])
 custom=json.loads((out/'custom.cpp.manifest.json').read_text());assert not any(r.get('trivial_record_assignment_proofs') for r in custom['definitions']),custom
print('PASS 512 native/JS cross-TU trivial assignments and self-assignment; preserve aliases/prototypes and reject mismatched layouts, missing proofs and custom assignment')
