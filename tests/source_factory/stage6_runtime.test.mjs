import test from 'node:test';
import assert from 'node:assert/strict';
import {LLVMContext} from '../../runtime/llvm_context.mjs';
import {createStdlib} from '../../runtime/stdlib.mjs';

test('qsort calls original function pointers with addresses of in-heap records',()=>{
  const ctx=new LLVMContext(),h=ctx.heap,s=ctx.libraries;
  const base=h.malloc(8*12),source=[8,2,5,-7,5,0,32767,-14,44,1,3,-1];
  source.forEach((v,i)=>{h.write(base+i*8,'i32',v);h.write(base+i*8+4,'i32',i);});
  let count=0;
  ctx.register('cmpC',(a,b)=>{count++;return h.read(a,'i32')-h.read(b,'i32');});
  const comparator=ctx.ptr('cmpC');
  s.qsort(base,BigInt(source.length),8n,BigInt(comparator));
  const sorted=source.map((_,i)=>h.read(base+i*8,'i32'));
  assert.deepEqual(sorted,source.slice().sort((a,b)=>a-b));
  assert.ok(count>0);
  assert.deepEqual(source.map((_,i)=>h.read(base+i*8+4,'i32')).sort((a,b)=>a-b),source.map((_,i)=>i));
  assert.throws(()=>s.qsort(base,4n,Number.MAX_SAFE_INTEGER,comparator),RangeError);
  assert.throws(()=>s.qsort(base,4n,8n,123456),/Unlinked|pointer/);
});

test('POSIX x86-64 timespec, timeval, and time_t are written as 64-bit fields',()=>{
  const ctx=new LLVMContext({clock:()=>1250.125});const h=ctx.heap;
  const s=createStdlib({heap:h,clock:()=>1250.125,wallClock:()=>1760000000123}).symbols;
  const loc=h.malloc(16),tv=h.malloc(16),secs=h.malloc(8);
  assert.equal(s.clock_gettime(1,loc),0);
  assert.equal(h.read(loc,'i64'),1n);assert.equal(h.read(loc+8,'i64'),250125000n);
  assert.equal(s.clock_gettime(0,loc),0);
  assert.equal(h.read(loc,'i64'),1760000000n);assert.equal(h.read(loc+8,'i64'),123000000n);
  assert.equal(s.gettimeofday(tv,0),0);
  assert.equal(h.read(tv,'i64'),1760000000n);assert.equal(h.read(tv+8,'i64'),123000n);
  assert.equal(s.time(secs),1760000000n);assert.equal(h.read(secs,'i64'),1760000000n);
  const errno=s.__errno_location();
  assert.equal(s.clock_gettime(4,loc),0);assert.equal(h.read(loc,'i64'),1n);assert.equal(h.read(loc+8,'i64'),250125000n);
  assert.equal(s.gettimeofday(tv,1),-1);assert.equal(h.read(errno,'i32'),95);
  assert.equal(s.clock_gettime(99,loc),-1);assert.equal(h.read(errno,'i32'),22);
});

test('single-thread pthread mutex synchronization and once have correct memory lifecycles',()=>{
  const ctx=new LLVMContext(),h=ctx.heap,s=ctx.libraries;
  const mtx=h.calloc(1,40);
  assert.equal(s.pthread_mutex_lock(mtx),0); // static initializer
  assert.equal(s.pthread_mutex_trylock(mtx),16);
  assert.equal(s.pthread_mutex_lock(mtx),35); // never falsely block a single-thread event loop
  assert.equal(s.pthread_mutex_destroy(mtx),16);
  assert.equal(s.pthread_mutex_unlock(mtx),0);
  assert.equal(s.pthread_mutex_unlock(mtx),1);
  assert.equal(s.pthread_mutex_destroy(mtx),0);
  assert.equal(s.pthread_mutex_lock(mtx),22);
  assert.equal(s.pthread_mutex_init(mtx,0),0);
  assert.equal(s.pthread_mutex_trylock(mtx),0);
  assert.equal(s.pthread_mutex_unlock(mtx),0);
  const once=h.calloc(1,4);let count=0;
  ctx.register('initOnce',()=>{count++;});
  const fn=ctx.ptr('initOnce');
  assert.equal(s.pthread_once(once,fn),0);
  assert.equal(s.pthread_once(once,fn),0);
  assert.equal(count,1);assert.equal(h.read(once,'i32'),2);
  const failOnce=h.calloc(1,4);
  ctx.register('failOnce',()=>{throw Error('initializer failed');});
  assert.throws(()=>s.pthread_once(failOnce,ctx.ptr('failOnce')),/initializer failed/);
  assert.equal(h.read(failOnce,'i32'),0);
  const unimplemented=createStdlib({heap:h,threadModel:()=> 'multi'}).symbols;
  assert.equal(unimplemented.pthread_mutex_lock(mtx),95);
});
