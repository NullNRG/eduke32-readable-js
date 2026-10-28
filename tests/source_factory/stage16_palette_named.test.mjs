import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {LLVMContext} from '../../runtime/llvm_context.mjs';

function reference(bytes,source,table,map,row){
  for(let i=0;i<256;i++)bytes[table+row+i]=bytes[source+row+bytes[map+i]];
}
function fixture(seed,alias=false){
  const ctx=new LLVMContext();
  const memory=ctx.heap;
  const shadeCount=12,bytesPerShade=256;
  const source=memory.malloc(shadeCount*bytesPerShade);
  const target=alias?source:memory.malloc(shadeCount*bytesPerShade);
  const mapping=memory.malloc(256);
  const sSlot=memory.malloc(8),dSlot=memory.malloc(8);
  memory.write(sSlot,'u64',BigInt(source));memory.write(dSlot,'u64',BigInt(target));
  let state=seed>>>0;
  const rand=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state&255;};
  for(let i=0;i<shadeCount*256;i++)memory.u8[source+i]=rand();
  if(!alias)for(let i=0;i<shadeCount*256;i++)memory.u8[target+i]=rand();
  for(let i=0;i<256;i++)memory.u8[mapping+i]=rand();
  const before=memory.u8.slice();const expected=before.slice();
  for(let row=0;row<shadeCount*256;row+=256){
    reference(expected,source,target,mapping,row);
    assert.equal(ctx.tryRemap256(sSlot,dSlot,mapping,BigInt(row)),true);
  }
  assert.deepEqual(memory.u8.slice(target,target+shadeCount*256),expected.slice(target,target+shadeCount*256));
}
test('source-layout generated modules preserve C/C++ names and original ownership',()=>{
  const manifest=JSON.parse(readFileSync(new URL('../../factory-output/whole-program/source-map.json',import.meta.url)));
  for(const key of ['source/duke3d/src/game.cpp','source/duke3d/src/menus.cpp','source/duke3d/src/gameexec.cpp','source/build/src/engine.cpp']){
    const row=manifest[key];assert.ok(row,`Missing original unit ${key}`);
    assert.ok(row.module.endsWith(key+'.mjs'),`Wrong name ${row.module}`);
    assert.ok(existsSync(new URL('../../factory-output/whole-program/'+row.module,import.meta.url)));
  }
  assert.ok(manifest['source/duke3d/src/game.cpp'].functions.includes('main') || manifest['source/duke3d/src/game.cpp'].functions.length>0);
});
test('structural remap optimizer is installed in original LLVM-lowered palette path',()=>{
  const report=JSON.parse(readFileSync(new URL('../../factory-output/whole-program/symbol-link-report.json',import.meta.url)));
  assert.ok(report.byte_remap_optimizations.some(x=>x.algorithm==='byte-remap-256'));
  const manifest=JSON.parse(readFileSync(new URL('../../factory-output/whole-program/source-map.json',import.meta.url)));
  const pal=Object.values(manifest).find(x=>x.functions.includes('paletteLoadLookupTable'));
  assert.ok(pal);
  const code=readFileSync(new URL('../../factory-output/whole-program/'+pal.module,import.meta.url),'utf8');
  assert.match(code,/ctx\.tryRemap256\(/);
});
test('palette shade remap is byte-exact across 12 rows and 32 seeded inputs',()=>{
  for(let i=0;i<32;i++)fixture(13+i*1741);
});
test('palette remap retains native sequential aliasing when source and target overlap',()=>{
  for(let i=0;i<10;i++)fixture(13+i*1543,true);
});
test('palette remap refuses invalid offsets and pointers without modifying bytes',()=>{
  const ctx=new LLVMContext();const source=ctx.heap.malloc(256),slot=ctx.heap.malloc(8);
  ctx.heap.write(slot,'u64',BigInt(source));
  const before=ctx.heap.u8.slice(source,source+256);
  assert.equal(ctx.tryRemap256(slot,slot,source,-1n),false);
  assert.equal(ctx.tryRemap256(slot,slot,source,9007199254740992n),false);
  assert.equal(ctx.tryRemap256(0,0,0,0n),false);
  assert.deepEqual(ctx.heap.u8.slice(source,source+256),before);
});

test('nonidentical source/destination shade offsets preserve the LLVM masked-row semantics',()=>{
  const ctx=new LLVMContext(),h=ctx.heap;
  const src=h.malloc(1024),dst=h.malloc(1024),map=h.malloc(256),s=h.malloc(8),d=h.malloc(8);
  h.write(s,'u64',BigInt(src));h.write(d,'u64',BigInt(dst));
  for(let i=0;i<1024;i++)h.u8[src+i]=(i*37+(i>>3))&255;
  for(let i=0;i<256;i++)h.u8[map+i]=(i*29)&255;
  const expected=new Uint8Array(256);
  for(let i=0;i<256;i++)expected[i]=h.u8[src+256+h.u8[map+i]];
  assert.equal(ctx.tryRemap256(s,d,map,256n,768n),true);
  assert.deepEqual(h.u8.slice(dst+768,dst+1024),expected);
});
