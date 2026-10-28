import test from 'node:test';
import assert from 'node:assert/strict';
import { LLVMContext } from '../../runtime/llvm_context.mjs';
import { fusedMultiplyAdd } from '../../runtime/ieee_fma.mjs';
test('exact fused arithmetic preserves signed zero, cancellation, and rounding',()=>{
  const c=new LLVMContext();
  assert.equal(c.call('llvm.fmuladd.f32',[1,2,3]),5);
  assert.equal(c.call('llvm.fmuladd.f64',[1,2,3]),5);
  assert.ok(Object.is(fusedMultiplyAdd(-0,1,-0,32),-0));
  assert.ok(Object.is(fusedMultiplyAdd(-0,1,+0,64),0));
  assert.ok(Number.isNaN(fusedMultiplyAdd(Infinity,0,1,32)));
  assert.ok(Number.isNaN(fusedMultiplyAdd(Infinity,2,-Infinity,64)));
  const x=Math.fround(1+2**-23);
  const y=Math.fround(1-2**-23);
  assert.equal(fusedMultiplyAdd(x,y,-1,32),-(2**-46));
});
test('bitwise runtime intrinsics implement width and zero requirements',()=>{
  const c=new LLVMContext();
  assert.equal(c.call('llvm.fshl.i32',[0x12345678,0xabcdef01,0]),0x12345678);
  assert.equal(c.call('llvm.fshl.i32',[0x12345678,0xabcdef01,8])>>>0,0x345678ab);
  assert.equal(c.call('llvm.fshl.i32',[0x12345678,0xabcdef01,40])>>>0,0x345678ab);
  assert.equal(c.call('llvm.ctpop.i64',[-1n]),64n);
  assert.equal(c.call('llvm.ctlz.i64',[1n,1]),63n);
  assert.equal(c.call('llvm.cttz.i64',[8n,1]),3n);
  assert.throws(()=>c.call('llvm.ctlz.i32',[0,1]),/undefined for zero/);
});
test('vector memory and SSA semantics reject poison and preserve float32',()=>{
  const c=new LLVMContext(); const ptr=c.heap.malloc(16);
  const first=[Math.fround(1/3),-7];
  c.vectorStore(ptr,first,2,'float');
  const loaded=c.vectorLoad(ptr,2,'float');
  assert.deepEqual(loaded,first);
  const second=c.vectorInsert(loaded,9,1,2,'float');
  assert.deepEqual(loaded,first);assert.deepEqual(second,[first[0],9]);
  assert.equal(c.vectorExtract(second,1,2,'float'),9);
  assert.throws(()=>c.vectorExtract([undefined,4],0,2,'float'),/poison/);
  assert.throws(()=>c.vectorStore(ptr,[undefined,4],2,'float'),/poison/);
  assert.throws(()=>c.vectorExtract([1,2],2,2,'float'),/out of range/);
});
