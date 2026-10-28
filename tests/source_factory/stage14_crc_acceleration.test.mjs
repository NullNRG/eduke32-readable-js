import test from 'node:test';
import assert from 'node:assert/strict';
import { LLVMContext } from '../../runtime/llvm_context.mjs';
import { boot } from '../../factory-output/whole-program/linked.mjs';
import { readFileSync } from 'node:fs';

const referenceCRC=(bytes,seed=0)=>{
  let x=(~seed)>>>0;
  for(const b of bytes){x^=b;for(let i=0;i<8;i++)x=(x>>>1)^(x&1?0xedb88320:0);}
  return (~x)|0;
};

test('slicing-by-eight algorithm is detected from LLVM structure, not name',()=>{
 const report=JSON.parse(readFileSync(new URL('../../factory-output/whole-program/symbol-link-report.json',import.meta.url)));
 assert.deepEqual(report.checksum_optimizations,[{function:'Bcrc32',table:'crc32table',algorithm:'crc32-slicing-by-eight'}]);
});

test('the selected original compiled checksum verifies and accelerates, retaining chained CRC semantics',()=>{
 const report=JSON.parse(readFileSync(new URL('../../factory-output/whole-program/symbol-link-report.json',import.meta.url)));
 const libraries=Object.fromEntries(report.unresolved_symbols.map(name=>[name,()=>{throw Error('unresolved: '+name)}]));
 const ctx=boot({libraries});
 const record=ctx.checksumOptimizations.find(x=>x.name==='Bcrc32');
 assert.ok(record);
 ctx.call('initcrc32table',[]);
 const data=Uint8Array.from({length:4096},(_,i)=>(i*37^(i>>3))&255);
 const ptr=ctx.heap.malloc(data.byteLength);ctx.heap.u8.set(data,ptr);
 let total=0;
 for(const size of [0,1,3,7,8,9,15,16,17,31,32,63,64,65,128,511,1024,4096]){
  for(const seed of [0,0x12345678,-1,0x7fffffff]){
   const actual=ctx.call('Bcrc32',[ptr,size,seed]);
   assert.equal(actual,referenceCRC(data.subarray(0,size),seed),`CRC size=${size} seed=${seed}`);
  }
 }
 for(let i=0;i<data.byteLength;i+=64)total=ctx.call('Bcrc32',[ptr,Math.min(64,data.byteLength-i),total]);
 assert.equal(record.verified,true);
 assert.equal(record.disabled,false);
 // A separate group of 64-byte chunks with successive offsets.
 let cumulative=0;
 for(let i=0;i<data.length;i+=64)cumulative=ctx.call('Bcrc32',[ptr+i,64,cumulative]);
 assert.equal(cumulative,referenceCRC(data));
});

test('failed optimizer parity explicitly falls back to the original function',()=>{
 const ctx=new LLVMContext();
 ctx.defineGlobal('anyChecksumTable',{kind:'zeroed',size:8192});
 ctx.register('checksumCandidate',(_ptr,_len,seed)=>123+(seed|0));
 const record=ctx.specializeSlicingCRC32('checksumCandidate','anyChecksumTable');
 const ptr=ctx.heap.malloc(100);
 assert.equal(ctx.call('checksumCandidate',[ptr,64,4]),127);
 assert.equal(record.verified,false);
 assert.equal(record.disabled,true);
 assert.equal(ctx.call('checksumCandidate',[ptr,64,17]),140);
});

test('LLVM block budget is configurable and validates inputs',()=>{
 assert.equal(new LLVMContext().instructionBudget,50_000_000);
 assert.equal(new LLVMContext({instructionBudget:125}).instructionBudget,125);
 assert.equal(new LLVMContext({instructionBudget:Infinity}).instructionBudget,Infinity);
 assert.throws(()=>new LLVMContext({instructionBudget:0}),RangeError);
 assert.throws(()=>new LLVMContext({blockProgress:17}),TypeError);
});
