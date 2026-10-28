'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync(process.env.EDUKE_COMPILED_JS || (__dirname+'/../web/compiled_engine_crc32.js'),'utf8');
const js=vm.runInNewContext(source+'\nEDukeSourceIR;',{});
// Standard reference CRC32, independently implemented rather than derived from generated code.
function reference(a,seed=0){let c=(~seed)>>>0;for(const b of a){c^=b;for(let j=0;j<8;j++)c=(c>>>1)^((c&1)?0xEDB88320:0);}return (~c)>>>0;}
let count=0;
for(let n of [0,1,2,3,4,5,6,7,8,9,15,16,17,31,32,33,63,64,1024,32767,65536]){
 let bytes=new Uint8Array(n);for(let i=0;i<n;i++)bytes[i]=(i*19+i*i*7+103)&255;
 for(let seed of [0,0xdeadbeef,0xffffffff]){
 let actual=js.crc32(bytes,seed);let expected=reference(bytes,seed);assert.strictEqual(actual,expected,`length ${n}, seed ${seed}`);count++;
 }
}
console.log('Clang LLVM IR -> JavaScript CRC32 PASS',count,'tests; functions:',js.functions.join(','));
