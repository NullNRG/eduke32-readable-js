import test from 'node:test';import assert from 'node:assert/strict';
import {inspectGRP} from '../../grp-launcher.mjs';
function archive(names=['PALETTE.DAT','TABLES.DAT','TILES000.ART','E1L1.MAP','E1L2.MAP']){
 const bytes=new Uint8Array(16+names.length*17),v=new DataView(bytes.buffer),text=new TextEncoder();
 bytes.set(text.encode('KenSilverman'));v.setUint32(12,names.length,true);
 names.forEach((name,i)=>{bytes.set(text.encode(name),16+i*16);v.setUint32(28+i*16,1,true);});return bytes.buffer;
}
test('GRP selection lists real directory maps and validates every asset extent',()=>{
 assert.deepEqual(inspectGRP(archive()),{count:5,maps:['E1L1.MAP','E1L2.MAP']});
 assert.throws(()=>inspectGRP(archive().slice(0,-1)),/entry/);
 const bad=archive();new DataView(bad).setUint32(12,0xffffffff,true);assert.throws(()=>inspectGRP(bad),/directory/);
 assert.throws(()=>inspectGRP(new ArrayBuffer(16)),/GRP archive/);
 assert.throws(()=>inspectGRP(archive(['E1L1.MAP'])),/base Duke GRP/);
 assert.throws(()=>inspectGRP(archive(['PALETTE.DAT','TABLES.DAT','TILES000.ART'])),/no MAP/);
 assert.throws(()=>inspectGRP(archive(['PALETTE.DAT','TABLES.DAT','TILES000.ART','E1L1.MAP','E1L1.MAP'])),/Duplicate/);
});
