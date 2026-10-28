import test from 'node:test';
import assert from 'node:assert/strict';
import {NativeRuntime,bindSourceFreeAllocator} from '../../runtime/index.mjs';
import {bindBrowserC,addsearchpath_user,listsearchpath,free} from '../../factory-output/source-first/browser-target/browser-abi/libc_provider.mjs';
import {__cxx_global_cell_11016d3c7177543e564ab46c as allocator} from '../../factory-output/source-first/browser-target/source/build/src/compat.cpp.mjs';
import {G_ExtPreInit,G_CleanupSearchPaths,__cxx_global_cell_c0e288040dbf9a805036c27d as gameType} from '../../factory-output/source-first/browser-target/source/duke3d/src/common.cpp.mjs';
const bytes=s=>new TextEncoder().encode(s+'\0');
const paths=rt=>rt.fs.searchPaths.map(x=>x.prefix).sort();
test('original G_CleanupSearchPaths removes unwanted Build VFS paths, preserving requested game variant',()=>{
 const rt=new NativeRuntime(),release=bindBrowserC(rt),releaseAllocator=bindSourceFreeAllocator(allocator,free);
 try{
  G_ExtPreInit(0,[]);
  for (const [name,mask] of [['nam',2],['ww2gi',4],['fury',8],['remove',1]]){
    rt.fs.mountBytes('/'+name+'/keep.dat',new Uint8Array([mask]));
    assert.equal(addsearchpath_user(bytes('/'+name),mask),0);
  }
  assert.equal(paths(rt).length,5);
  gameType().value=1;G_CleanupSearchPaths();
  assert.deepEqual(paths(rt),['home/browser/.config/eduke32']);
  for (const [name,mask] of [['nam',2],['ww2gi',4],['fury',8],['remove',1]])
    assert.equal(addsearchpath_user(bytes('/'+name),mask),0);
  gameType().value=2;G_CleanupSearchPaths();
  assert.deepEqual(paths(rt),['home/browser/.config/eduke32','nam']);
  assert.equal(rt.fs.readFile('keep.dat')[0],2);
 }finally{releaseAllocator();release();rt.close();}
});
