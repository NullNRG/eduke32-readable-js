import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {NativeRuntime} from '../../runtime/index.mjs';
import {sourceAddressSpace} from '../../tools/source_address_runtime.mjs';
import {sourceSizedBytes} from '../../runtime/source_bytes.mjs';

test('standard map aliases retain identity and reject expired or raw byte access',async()=>{
  const runtime=new NativeRuntime();runtime.bindSourceMemory();
  const source=await readFile(new URL('../../tools/source_unordered_map_runtime.mjs',import.meta.url),'utf8');
  const {cStdUnordered:u}=await import('data:text/javascript;base64,'+Buffer.from(source+'\nexport {cStdUnordered};').toString('base64'));
  try{
    const object=u.create({key:32,value:16}),reference=u.slot(object,7);reference.value=65539;
    assert.equal(reference.value,3);
    for(let n=0;n<2000;n++)u.emplace(object,n,n+11);
    assert.equal(u.slot(object,7),reference);
    assert.equal(reference.value,3);
    const address=u.address(object),bits=sourceAddressSpace.encode(address);
    assert.equal(sourceAddressSpace.decode(bits),address);
    assert.equal(sourceAddressSpace.encode(u.address(object)),bits);
    assert.throws(()=>sourceSizedBytes(address,1,runtime.heap),/storage|heap|allocation/i);
    const old=u.find(object,7);assert.equal(u.iteratorPair(old).second,3);
    u.clear(object);
    assert.throws(()=>reference.value,/lifetime/);
    assert.throws(()=>u.iteratorPair(old),/lifetime/);
    assert.equal(u.deref(address),object);
    assert.equal(u.size(object),0);
    u.destroy(object);assert.throws(()=>address.value,/destroyed/);
    assert.throws(()=>u.create({key:64,value:16}),/key type/);
    const a=u.create({key:32,value:16});u.emplace(a,0xffffffffffffffffn,0xffffffffffffffffn);
    assert.equal(u.slot(a,0xffffffff).value,65535);
    const stable=u.slot(a,0xffffffff);u.assign(a,a);assert.equal(stable.value,65535);
    u.destroy(a);
    const outer=u.create({key:16,value:{key:32,value:16}}),inner=u.slot(outer,4).value;
    const innerAddress=u.address(inner);u.slot(inner,1).value=19;
    const copy=u.copy(outer);u.slot(u.slot(copy,4).value,1).value=23;
    assert.equal(u.slot(inner,1).value,19);
    u.clear(outer);assert.throws(()=>innerAddress.value,/lifetime/);u.destroy(outer);u.destroy(copy);
    const global=u.global(u.create({key:16,value:16})),globalAddress=u.address(global);
    runtime.close();assert.throws(()=>globalAddress.value,/destroyed/);
  }finally{runtime.close();}
});
