import test from 'node:test';
import assert from 'node:assert/strict';
import {NativeRuntime} from '../../runtime/index.mjs';
import {bindBrowserC,G_AddSearchPaths} from '../../factory-output/source-first/browser-target/browser-abi/libc_provider.mjs';
test('Duke desktop discovery is replaced by real browser packaged-asset search path',()=>{
  const rt=new NativeRuntime({applicationDirectory:'/gamefiles'});
  const release=bindBrowserC(rt);
  try{
    rt.fs.mountBytes('/gamefiles/DUKE3D.GRP',new Uint8Array([68,85,75,69]));
    assert.equal(rt.fs.searchPaths.length,0);
    G_AddSearchPaths();
    assert.deepEqual(rt.fs.searchPaths.map(x=>x.prefix),['gamefiles']);
    assert.deepEqual(Array.from(rt.fs.readFile('DUKE3D.GRP')),[68,85,75,69]);
    G_AddSearchPaths();
    assert.equal(rt.fs.searchPaths.length,1,'repeated startup must not duplicate asset paths');
  }finally{release();rt.close()}
  assert.throws(()=>G_AddSearchPaths(),/not bound/);
});
