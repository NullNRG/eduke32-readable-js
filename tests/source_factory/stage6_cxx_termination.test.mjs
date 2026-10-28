import test from 'node:test';
import assert from 'node:assert/strict';
import {LLVMContext} from '../../runtime/llvm_context.mjs';

test('C++ __cxa_atexit uses valid DSO storage and reverse-order function pointer callbacks',()=>{
 const c=new LLVMContext(),h=c.heap,actual=[];
 assert.equal(h.read(c.ptr('__dso_handle'),'u64'),BigInt(c.ptr('__dso_handle')));
 c.register('dtor',p=>actual.push(h.read(p,'i32')));
 const fn=c.ptr('dtor'),dso=c.ptr('__dso_handle');
 const one=h.malloc(4),two=h.malloc(4);
 h.write(one,'i32',5);h.write(two,'i32',7);
 assert.equal(c.libraries.__cxa_atexit(fn,one,dso),0);
 assert.equal(c.libraries.__cxa_atexit(fn,two,dso),0);
 c.runDestructors(dso);assert.deepEqual(actual,[7,5]);
 c.runDestructors();assert.deepEqual(actual,[7,5]);
 assert.throws(()=>c.libraries.__cxa_atexit(77777,one,dso),/Unresolved/);
});
