import test from 'node:test';
import assert from 'node:assert/strict';
import {LLVMContext} from '../../runtime/llvm_context.mjs';

test('LLVM function/global aliases share addresses and resolve when defined later', () => {
  const c = new LLVMContext();
  c.defineGlobal('alias2',{kind:'alias',target:'alias1'});
  c.defineGlobal('alias1',{kind:'alias',target:'actual'});
  c.register('actual',x=>x+3);
  c.defineGlobal('storageAlias',{kind:'alias',target:'storage'});
  c.defineGlobal('storage',{kind:'bytes',size:2,value:[4,5]});
  c.finishGlobals();
  assert.equal(c.call('alias2',[12]),15);
  assert.equal(c.ptr('alias2'),c.ptr('actual'));
  assert.equal(c.ptr('storageAlias'),c.ptr('storage'));
  assert.equal(c.heap.read(c.ptr('storageAlias')+1,'u8'),5);
  assert.equal(c.validate(['alias2','storageAlias']),true);
});

test('LLVM alias cycles and absent targets are not allowed to link', () => {
  const cyc=new LLVMContext();
  cyc.defineGlobal('a',{kind:'alias',target:'b'});
  cyc.defineGlobal('b',{kind:'alias',target:'a'});
  assert.throws(()=>cyc.finishGlobals(),/Cyclic/);
  const missing=new LLVMContext();
  missing.defineGlobal('a',{kind:'alias',target:'absent'});
  assert.throws(()=>missing.finishGlobals(),/Unresolved/);
});
