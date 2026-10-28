import test from 'node:test';
import assert from 'node:assert/strict';
import { LLVMContext } from '../../runtime/llvm_context.mjs';

// The current runtime intentionally supports only a single JS event loop.
test('LLVM single-threaded i32 atomics preserve old values and wrap', () => {
  const ctx = new LLVMContext();
  const p = ctx.heap.malloc(8);
  ctx.atomicStore(p,'i32',0xffffffff,'release',4);
  assert.equal(ctx.atomicLoad(p,'i32','acquire',4), -1);
  assert.equal(ctx.atomicRMW(p,'i32','add',3,'seq_cst',4), -1);
  assert.equal(ctx.atomicLoad(p,'i32','monotonic',4), 2);
  assert.deepEqual(ctx.atomicCmpXchg(p,'i32',2,25,'seq_cst','seq_cst',4),[2,1]);
  assert.deepEqual(ctx.atomicCmpXchg(p,'i32',2,99,'seq_cst','seq_cst',4),[25,0]);
  assert.equal(ctx.atomicLoad(p,'i32','seq_cst',4), 25);
});
test('i64 atomics remain exact across 2^53 and signed wrap', () => {
  const ctx = new LLVMContext();
  const p=ctx.heap.malloc(8);
  ctx.atomicStore(p,'i64',-1,'seq_cst',8);
  assert.equal(ctx.atomicRMW(p,'i64','add',2n,'monotonic',8),-1n);
  assert.equal(ctx.atomicLoad(p,'i64','acquire',8),1n);
  assert.deepEqual(ctx.atomicCmpXchg(p,'i64',1n,-9223372036854775808n,'seq_cst','monotonic',8),[1n,1]);
  assert.equal(ctx.atomicLoad(p,'i64','acquire',8),-9223372036854775808n);
});
test('unsupported memory orders or unaligned atomic accesses fail loudly', () => {
  const ctx=new LLVMContext();const p=ctx.heap.malloc(8);
  assert.throws(()=>ctx.atomicLoad(p,'i32','release',4),/Invalid LLVM atomic ordering/);
  assert.throws(()=>ctx.atomicStore(p,'i32',1,'acquire',4),/Invalid LLVM atomic ordering/);
  assert.throws(()=>ctx.atomicLoad(p+1,'i32','seq_cst',4),/Unaligned/);
  assert.deepEqual(ctx.atomicCmpXchg(p,'i32',0,1,'release','acquire',4),[0,1]);
  assert.throws(()=>ctx.atomicCmpXchg(p,'i32',1,2,'acquire','release',4),/Invalid cmpxchg failure ordering/);
  ctx.threadModel='concurrent';
  assert.throws(()=>ctx.atomicRMW(p,'i32','add',1,'seq_cst',4),/shared-memory backend/);
});
test('LLVM integer intrinsics preserve bit patterns', () => {
  const ctx=new LLVMContext();
  assert.equal(ctx.call('llvm.bswap.i16',[0x1234]),0x3412);
  assert.equal(ctx.call('llvm.bswap.i32',[0x12345678]),0x78563412);
  assert.equal(BigInt.asUintN(64,ctx.call('llvm.bswap.i64',[0x1234567890abcdefn])),0xefcdab9078563412n);
  assert.equal(ctx.call('llvm.smin.i64',[-9223372036854775808n,77n]),-9223372036854775808n);
  assert.equal(ctx.call('llvm.smax.i64',[-2n,77n]),77n);
});
