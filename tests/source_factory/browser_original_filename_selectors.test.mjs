import test from 'node:test';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {NativeRuntime} from '../../runtime/index.mjs';
import {bindBrowserC,testkopen} from '../../factory-output/source-first/browser-target/browser-abi/libc_provider.mjs';
import {G_DefaultConFile,G_ConFile,G_DefaultDefFile,G_DefFile,
        __cxx_global_cell_c0e288040dbf9a805036c27d as gameType} from '../../factory-output/source-first/browser-target/source/duke3d/src/common.cpp.mjs';

const bytes = x => new TextEncoder().encode(x+'\0');
const name = x => {assert.ok(x instanceof Uint8Array); return new TextDecoder().decode(x.subarray(0,x.indexOf(0)));};

test('browser testkopen searches mounted source assets, overlays, and registered VFS paths', () => {
  const rt=new NativeRuntime();const unbind=bindBrowserC(rt);
  try {
    assert.equal(testkopen(bytes('EDUKE.CON'),0),0);
    rt.fs.mountBytes('EDUKE.CON',Uint8Array.of(65));
    assert.equal(testkopen(bytes('eduke.con'),0),1);
    rt.fs.mountBytes('/addons/NAM.CON',Uint8Array.of(78));
    assert.equal(testkopen(bytes('NAM.CON'),0),0);
    rt.fs.addSearchPath('/addons',3);
    assert.equal(testkopen(bytes('nam.con'),0),1);
    assert.equal(testkopen(bytes('nam.con'),1),1);
    assert.equal(testkopen(bytes('not-present.con'),0),0);
    assert.throws(()=>testkopen(new Uint8Array([69,68,85,75,69]),0),/Unterminated/);
    assert.throws(()=>testkopen(bytes('../escape'),0),/traversal/i);
  } finally {unbind();rt.close();}
});

test('original C++ G_DefaultConFile / G_ConFile and DEF selectors follow real VFS availability',()=>{
  const rt=new NativeRuntime();const unbind=bindBrowserC(rt);
  const cell=gameType(),original=cell.value;
  try {
    cell.value=1; // Duke
    assert.equal(name(G_DefaultConFile()),'GAME.CON');
    rt.fs.mountBytes('EDUKE.CON',Uint8Array.of(0));
    assert.equal(name(G_DefaultConFile()),'EDUKE.CON');
    assert.equal(name(G_ConFile()),'EDUKE.CON');
    assert.equal(name(G_DefaultDefFile()),'duke3d.def');
    assert.equal(name(G_DefFile()),'duke3d.def');
    cell.value=2; // NAM
    assert.equal(name(G_DefaultConFile()),'GAME.CON');
    rt.fs.mountBytes('NAPALM.CON',Uint8Array.of(0));
    assert.equal(name(G_DefaultConFile()),'NAPALM.CON');
    rt.fs.mountBytes('napalm.def',Uint8Array.of(0));
    assert.equal(name(G_DefaultDefFile()),'napalm.def');
    cell.value=4; // Napalm
    assert.equal(name(G_DefaultConFile()),'NAPALM.CON');
    cell.value=8; // WW2GI
    assert.equal(name(G_DefaultConFile()),'GAME.CON');
    rt.fs.mountBytes('WW2GI.CON',Uint8Array.of(0));
    assert.equal(name(G_DefaultConFile()),'WW2GI.CON');
  } finally{cell.value=original;unbind();rt.close();}
});


test('original CON selection locates genuine Duke GRP files, not a fabricated game resource',()=>{
  const rt=new NativeRuntime();const unbind=bindBrowserC(rt);
  const cell=gameType(),saved=cell.value;
  try {
    const grp=readFileSync(new URL('../../input-data/DUKE3D.GRP',import.meta.url));
    const directory=rt.fs.mountGRP(grp);
    assert.ok(directory.length>=400);
    assert.equal(rt.fs.size('E1L1.MAP'),104562);
    assert.ok(rt.fs.size('GAME.CON')>150000);
    cell.value=1;
    assert.equal(testkopen(bytes('GAME.CON'),0),1);
    assert.equal(name(G_DefaultConFile()),'GAME.CON');
  } finally {cell.value=saved;unbind();rt.close();}
});
