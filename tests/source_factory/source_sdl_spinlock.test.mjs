import test from 'node:test';
import assert from 'node:assert/strict';
import {NativeRuntime} from '../../runtime/index.mjs';

test('source SDL spinlocks mutate the actual reference or aligned ABI storage',()=>{
  const runtime=new NativeRuntime(),heap=runtime.heap,s=runtime.sdl.symbols;
  let word=0;
  const reference={__cReference:true,get value(){return word;},set value(next){word=next;}};
  const address=heap.malloc(8),view=heap.u8.subarray(address,address+4);
  const shared=new Int32Array(new SharedArrayBuffer(4));
  try {
    for(const [pointer,read] of [[reference,()=>word],[address,()=>heap.read(address,'i32')],
      [view,()=>heap.read(address,'i32')],[new Uint8Array(shared.buffer),()=>Atomics.load(shared,0)]]){
      assert.equal(read(),0);
      assert.equal(s.SDL_AtomicTryLock(pointer),1);assert.equal(read(),1);
      assert.equal(s.SDL_AtomicTryLock(pointer),0);assert.equal(read(),1);
      assert.throws(()=>s.SDL_AtomicLock(pointer),/contention/);assert.equal(read(),1);
      s.SDL_AtomicUnlock(pointer);assert.equal(read(),0);
      s.SDL_AtomicLock(pointer);assert.equal(read(),1);
      s.SDL_AtomicUnlock(pointer);assert.equal(read(),0);
    }
    assert.throws(()=>s.SDL_AtomicTryLock(view.subarray(1)),/storage|aligned/);
    assert.throws(()=>s.SDL_AtomicTryLock(address+1),/aligned/);
  } finally {heap.free(address);runtime.close();}
});
