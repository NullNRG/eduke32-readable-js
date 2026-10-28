import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { LLVMContext } from '../../runtime/llvm_context.mjs';

const ref=(codes,flags,key)=>{
  for(let i=0;i<codes.length;i++)if(codes[i]===key&&flags[i]!==0)return i;
  for(let i=0;i<codes.length;i++)if(codes[i]===key)return i;
  return -1;
};

test('the source-neutral two-pass search detector matches original LLVM shape',()=>{
  const report=JSON.parse(readFileSync(new URL('../../factory-output/whole-program/symbol-link-report.json',import.meta.url)));
  assert.equal(report.linear_search_optimizations.length,1);
  const record=report.linear_search_optimizations[0];
  assert.equal(record.algorithm,'two-pass-i32-byte-linear-search');
  assert.deepEqual(record.symbols,['g_labelCnt','labelcode','labeltype']);
  const manifest=JSON.parse(readFileSync(new URL('../../factory-output/whole-program/source-map.json',import.meta.url)));
  const js=readFileSync(new URL('../../factory-output/whole-program/'+manifest['source/duke3d/src/gamedef.cpp'].module,import.meta.url),'utf8');
  assert.match(js,/ctx\.tryTwoPassI32ByteSearch\(/);
});

test('fast search preserves two-pass priority and first-index behavior',()=>{
  const ctx=new LLVMContext();
  const count=17000;
  const ptr=ctx.heap.malloc(count*4),flagsPtr=ctx.heap.malloc(count);
  const codes=new Uint32Array(ctx.heap.buffer,ptr,count);
  const flags=ctx.heap.u8;
  const expectedCodes=new Uint32Array(count), expectedFlags=new Uint8Array(count);
  for(let j=0;j<count;j++){
    const code=((j*1597)^(j>>3))%1013;
    const flag=(j%7===0?0:j%3===0?2:1);
    expectedCodes[j]=code;expectedFlags[j]=flag;codes[j]=code;flags[flagsPtr+j]=flag;
  }
  // Include duplicates, first occurrence with zero flag, and a later enabled occurrence.
  expectedCodes[0]=42;expectedFlags[0]=0;codes[0]=42;flags[flagsPtr]=0;
  expectedCodes[5]=42;expectedFlags[5]=3;codes[5]=42;flags[flagsPtr+5]=3;
  assert.equal(ctx.tryTwoPassI32ByteSearch(ptr,flagsPtr,count,42n),5);
  for(const key of [0,1,42,84,1012,1013,4294967295,530,914]){
    assert.equal(ctx.tryTwoPassI32ByteSearch(ptr,flagsPtr,count,BigInt(key)),ref(expectedCodes,expectedFlags,key),`key=${key}`);
  }
  for(let k=0;k<180;k++){
    const key=(k*257)%1100;
    assert.equal(ctx.tryTwoPassI32ByteSearch(ptr,flagsPtr,count,BigInt(key)),ref(expectedCodes,expectedFlags,key));
  }
  // A mutated source array must be read again, not served from a stale map.
  codes[5]=99;expectedCodes[5]=99;
  assert.equal(ctx.tryTwoPassI32ByteSearch(ptr,flagsPtr,count,42n),ref(expectedCodes,expectedFlags,42));
  assert.equal(ctx.tryTwoPassI32ByteSearch(ptr,flagsPtr,count,99n),ref(expectedCodes,expectedFlags,99));
});

test('unsafe inputs preserve the original LLVM fallback path',()=>{
  const ctx=new LLVMContext();
  assert.equal(ctx.tryTwoPassI32ByteSearch(0,0,0,0n),null);
  assert.equal(ctx.tryTwoPassI32ByteSearch(1,8,12,1n),null);
  assert.equal(ctx.tryTwoPassI32ByteSearch(8,16,12,-1n),null);
  assert.equal(ctx.tryTwoPassI32ByteSearch(8,16,12,4294967296n),null);
  assert.equal(ctx.tryTwoPassI32ByteSearch(8,16,12,1),null);
  assert.equal(ctx.tryTwoPassI32ByteSearch(8,16,1048577,1n),null);
});
