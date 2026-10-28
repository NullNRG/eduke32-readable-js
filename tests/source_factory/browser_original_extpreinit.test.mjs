import test from 'node:test';
import assert from 'node:assert/strict';
import { NativeRuntime, bindSourceFreeAllocator } from '../../runtime/index.mjs';
import { bindBrowserC, free, addsearchpath_user, removesearchpaths_withuser, listsearchpath } from '../../factory-output/source-first/browser-target/browser-abi/libc_provider.mjs';
import { __cxx_global_cell_11016d3c7177543e564ab46c as smAllocatorCell } from '../../factory-output/source-first/browser-target/source/build/src/compat.cpp.mjs';
import { G_ExtPreInit, g_rootDir } from '../../factory-output/source-first/browser-target/source/duke3d/src/common.cpp.mjs';
const enc=new TextEncoder();
const bytes=str=>enc.encode(str+'\0');
const str=a=>new TextDecoder().decode(a.subarray(0,a.indexOf(0)));
test('original source-translated G_ExtPreInit initializes VFS paths and searches mounted files',()=>{
  const rt=new NativeRuntime();
  const release=bindBrowserC(rt); const releaseAllocator=bindSourceFreeAllocator(smAllocatorCell,free);
  try {
    rt.fs.mountBytes('other/only.dat',new Uint8Array([11,22,33]));
    G_ExtPreInit(0,[]);
    assert.equal(str(g_rootDir),'//','native code appends slash to the original root path');
    assert.deepEqual(rt.fs.searchPaths.map(r=>r.prefix),['home/browser/.config/eduke32']);
    assert.equal(rt.library.symbols.chdir(rt.heap.writeCString('/')),0);
    assert.equal(addsearchpath_user(bytes('/other'),2),0);
    assert.deepEqual(Array.from(rt.fs.readFile('only.dat')),[11,22,33]);
    assert.equal(rt.heap.readCString(listsearchpath(1)),'/other/');
    assert.equal(rt.heap.readCString(listsearchpath(0)),'/home/browser/.config/eduke32/');
    removesearchpaths_withuser(2);
    assert.throws(()=>rt.fs.readFile('only.dat'),/ENOENT/);
    assert.equal(rt.heap.readCString(listsearchpath(1)),'/home/browser/.config/eduke32/');
    assert.equal(addsearchpath_user(bytes('/not-existing'),3),-2);
    rt.fs.mountBytes('only-file',new Uint8Array([12]));
    assert.equal(addsearchpath_user(bytes('/only-file'),4),-1);
  }finally{releaseAllocator();release();rt.close()}
});
