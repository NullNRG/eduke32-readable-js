'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const engine=vm.runInNewContext(fs.readFileSync(process.env.EDUKE_COMPILED_JS || (__dirname+'/../web/compiled_engine_crc32.js'),'utf8')+'\nEDukeSourceIR;');
const MIN=-2147483648,MAX=2147483647;
const inputs=[MIN,MIN+1,-196608,-65536,-1,0,1,65536,196608,MAX-1,MAX];
for(let i=0;i<3000;i++)inputs.push((Math.imul(i*1669,3971)+i*i*17)|0);
let checked=0;
for(let i=0;i<inputs.length;i++){
 const a=inputs[i],b=inputs[(i*17+1)%inputs.length];
 for(const [suffix,big] of [['add',BigInt(a)+BigInt(b)],['sub',BigInt(a)-BigInt(b)]]){
  const exact=big<BigInt(MIN)||big>BigInt(MAX)?MIN:Number(big);
  assert.strictEqual(engine['fix16_'+suffix](a,b)|0,exact,`${suffix} a=${a} b=${b}`);
  const sat=exact===MIN?(a>=0?MAX:MIN):exact;
  assert.strictEqual(engine['fix16_s'+suffix](a,b)|0,sat,`s${suffix} a=${a} b=${b}`);
  checked+=2;
 }
}
console.log('EDuke32 fix16.cpp LLVM->JS exact parity PASS',checked,'assertions');
