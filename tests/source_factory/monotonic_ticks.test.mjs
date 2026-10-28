import test from 'node:test';
import assert from 'node:assert/strict';
import {LLVMContext} from '../../runtime/llvm_context.mjs';
const reconstruct=([lo,hi]) => (BigInt(hi>>>0)<<32n) | BigInt(lo>>>0);
test('x86 rdtsc translation uses a monotonic nanosecond host counter with exact register pair ABI',()=>{
  const ctx=new LLVMContext();
  const earliest=BigInt(Math.floor(globalThis.performance.now()*1e6));
  const lohi=ctx.monotonicTickPair();
  const newest=BigInt(Math.floor(globalThis.performance.now()*1e6));
  assert.equal(lohi.length,2);
  for(const v of lohi)assert.equal(v|0,v);
  const first=reconstruct(lohi);
  assert.ok(first>=earliest && first<=newest);
  let previous=first;
  for(let i=0;i<256;i++){
    const val=reconstruct(ctx.monotonicTickPair());
    assert.ok(val>=previous);
    previous=val;
  }
});
