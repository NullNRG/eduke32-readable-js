import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {LLVMContext} from '../../runtime/llvm_context.mjs';

const reference=(arr,target,start)=>{
 for(let i=start;i>=2;i--)if(arr[i]>target){if(i===2)return 1;}else return i;
 return 1;
};

test('LLVM lowering detects source-neutral descending table lookups in multiple functions',()=>{
 const r=JSON.parse(readFileSync(new URL('../../factory-output/whole-program/symbol-link-report.json',import.meta.url)));
 const rows=r.descending_optimizations;
 assert.ok(rows.length>=10);
 assert.ok(rows.some(x=>x.function==='artLoadFiles'));
 assert.ok(rows.every(x=>x.algorithm==='descending-i32-table-threshold'));
 assert.ok(rows.every(x=>x.table===rows[0].table));
});

test('bounded i32 scan agrees with reference and observes live C memory',()=>{
 const ctx=new LLVMContext();const ptr=ctx.heap.malloc(32*4);const arr=new Int32Array(ctx.heap.buffer,ptr,32);
 for(let i=0;i<32;i++)arr[i]=1<<Math.min(i,30);
 for(let start=2;start<=15;start++){
  for(const target of [-1,0,1,2,3,4,7,8,31,32,50,1000,32768,0x7fffffff]){
   assert.equal(ctx.tryDescendingI32Threshold(ptr,target,start),reference(arr,target,start),`start=${start} target=${target}`);
  }
 }
 arr[10]=45;assert.equal(ctx.tryDescendingI32Threshold(ptr,46,10),10);
 arr[10]=1000;assert.equal(ctx.tryDescendingI32Threshold(ptr,46,10),reference(arr,46,10));
 assert.equal(ctx.tryDescendingI32Threshold(ptr+1,16,15),null);
 assert.equal(ctx.tryDescendingI32Threshold(ptr,16,2048),null);
 assert.equal(ctx.tryDescendingI32Threshold(-1,16,15),null);
});
