import test from 'node:test';import assert from 'node:assert/strict';
import {LLVMContext} from '../../runtime/llvm_context.mjs';

test('hot-path LLVM scalar loads and stores preserve exact 8/16/32/64/ptr semantics',()=>{
 const c=new LLVMContext({}),p=c.heap.malloc(32);
 for(const [type,val] of [['i1',1],['i8',-17],['i16',-300],['i32',-1234567],['i64',-123456789012345n],['ptr',123456],['float',1.5],['double',-1.25]]){
  c.store(p,type,val);assert.equal(c.load(p,type),val,`${type} mismatch`);
 }
 c.store(p,'i40',-123456789n);assert.equal(c.load(p,'i40'),-123456789n);
 c.store(p,'i128',-12345678901234567890n);assert.equal(c.load(p,'i128'),-12345678901234567890n);
 assert.throws(()=>c.load(p+32,'i32'),RangeError);
});
