import test from 'node:test';
import assert from 'node:assert/strict';
import { NativeRuntime } from '../../runtime/index.mjs';
import { bindBrowserC, Bgethomedir, Bgetappdir, buildvfs_exists, buildvfs_isdir, mkdir, chdir, getcwd, free } from '../../factory-output/source-first/browser-target/browser-abi/libc_provider.mjs';
const enc=new TextEncoder();
const text=x=>enc.encode(x+'\0');
const read=x=>new TextDecoder().decode(x.subarray(0,x.indexOf(0)));
test('Build browser home paths use actual VFS and owned C pointers, without host disk',()=>{
  const rt=new NativeRuntime();
  assert.throws(()=>Bgethomedir(),/not bound/);
  const release=bindBrowserC(rt);
  try {
    const a=Bgethomedir(),b=Bgethomedir(),app=Bgetappdir();
    assert.notEqual(a,b,'each call must return separately owned malloc');
    assert.equal(read(a),'/home/browser');
    assert.equal(read(b),'/home/browser');
    assert.equal(read(app),'/');
    free(a);assert.equal(read(b),'/home/browser');
    free(b);free(app);
    assert.equal(buildvfs_exists(text('/home/browser/.config')),1);
    assert.equal(buildvfs_isdir(text('/home/browser/.config')),1);
    assert.equal(buildvfs_exists(text('/not-found')),0);
    assert.equal(buildvfs_isdir(text('/not-found')),0);
    assert.throws(()=>buildvfs_exists(new Uint8Array([65,66])),/NUL-terminated/);
    assert.equal(chdir(text('/home/browser/.config')),0,'original startup config parent must exist');
    assert.equal(mkdir(text('/home/browser/.config/eduke32'),0o700),0);
    assert.equal(chdir(text('/home/browser/.config/eduke32')),0);
    const cwd=new Uint8Array(90);assert.equal(read(getcwd(cwd,cwd.length)),'/home/browser/.config/eduke32');
  }finally{release();rt.close();}
  assert.throws(()=>Bgethomedir(),/not bound/);
});
test('Browser VFS home path is configurable, and invalid path is rejected',()=>{
  const rt=new NativeRuntime({homeDirectory:'/profiles/slot-1',applicationDirectory:'/assets'});
  const release=bindBrowserC(rt);
  try{
    let p=Bgethomedir();assert.equal(read(p),'/profiles/slot-1');free(p);
    p=Bgetappdir();assert.equal(read(p),'/assets');free(p);
    assert.equal(chdir(text('/profiles/slot-1/.config')),0);
    assert.equal(chdir(text('/assets')),0);
  }finally{release();rt.close()}
  for(const path of ['/../secret','relative/path','/tmp/../bad','/bad\\part','/nul\0bad']){
    assert.throws(()=>new NativeRuntime({homeDirectory:path}),/canonical VFS path/);
  }
});
