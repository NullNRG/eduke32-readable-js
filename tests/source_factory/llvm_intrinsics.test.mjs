import test from 'node:test';
import assert from 'node:assert/strict';
import {LLVMContext} from '../../runtime/llvm_context.mjs';
import {ABIHeap} from '../../runtime/abi.mjs';

test('LLVM abs signed overflow/poison and u32 unsigned max', () => {
  const c = new LLVMContext();
  assert.equal(c.call('llvm.abs.i32',[-22,1]),22);
  assert.equal(c.call('llvm.abs.i32',[-2147483648,0]),-2147483648);
  assert.throws(()=>c.call('llvm.abs.i32',[-2147483648,1]),/poison/);
  assert.equal(c.call('llvm.abs.i64',[-75n,1]),75n);
  assert.equal(c.call('llvm.abs.i64',[-(1n<<63n),0]),-(1n<<63n));
  assert.throws(()=>c.call('llvm.abs.i64',[-(1n<<63n),1]),/poison/);
  assert.equal(c.call('llvm.umax.i32',[-1,22]),4294967295);
  assert.equal(c.call('llvm.umax.i32',[5,22]),22);
  assert.equal(c.call('llvm.assume',[true]),undefined);
  assert.throws(()=>c.call('llvm.assume',[false]),/assumption/);
});

test('C strings, case folding and errno are backed by ABI memory', () => {
  const heap = new ABIHeap();
  const c = new LLVMContext({heap});
  const source = heap.writeCString('abc');
  const dest = heap.malloc(32);
  const upper = heap.writeCString('ABC');
  assert.equal(c.call('strcpy',[dest,source]),dest);
  assert.equal(heap.readCString(dest),'abc');
  assert.equal(c.call('strcat',[dest,source]),dest);
  assert.equal(heap.readCString(dest),'abcabc');
  assert.equal(c.call('strcasecmp',[source,upper]),0);
  assert.notEqual(c.call('bcmp',[source,upper,3]),0);
  assert.equal(c.call('__errno_location',[]),c.call('__errno_location',[]));
  assert.throws(()=>c.call('abort',[]),/abort/);
});
