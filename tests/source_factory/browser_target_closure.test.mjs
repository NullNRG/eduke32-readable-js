import test from 'node:test';
import assert from 'node:assert/strict';
import { NativeRuntime } from '../../runtime/index.mjs';
import { bindBrowserC, getcwd, mkdir, chdir, strcat } from '../../factory-output/source-first/browser-target/browser-abi/libc_provider.mjs';
import { bindBrowserSDL, SDL_GetAudioDriver } from '../../factory-output/source-first/browser-target/browser-abi/sdl_provider.mjs';
import { SDLDrv_PCM_CheckDriverName } from '../../factory-output/source-first/browser-target/source/audiolib/src/driver_sdl.cpp.mjs';
const str = (v) => new TextEncoder().encode(v+'\0');
const read = a => new TextDecoder().decode(a.subarray(0,a.indexOf(0)));
test('browser-native C platform calls accept Clang-original byte-array strings',()=>{
  const rt=new NativeRuntime();
  assert.throws(()=>getcwd(new Uint8Array(64),64),/not bound/);
  const release=bindBrowserC(rt);
  try{
    let out=new Uint8Array(64);
    assert.equal(read(getcwd(out,64)),'/');
    assert.equal(mkdir(str('/save'),0o700),0);
    assert.equal(chdir(str('/save')),0);
    assert.equal(read(getcwd(out,64)),'/save');
    assert.equal(chdir(str('/not-found')),-1);
    const dest=new Uint8Array(12);dest.set(str('Duke'));
    assert.equal(strcat(dest,str('3D')),dest);assert.equal(read(dest),'Duke3D');
    assert.throws(()=>strcat(new Uint8Array([65,0]),str('B')),/exceeds/);
    assert.throws(()=>mkdir(new Uint8Array([97,98]),0o700),/terminating NUL/);
    assert.throws(()=>getcwd(new Uint8Array(2),3),/outside Clang array/);
  } finally {release();rt.close();}
  assert.throws(()=>chdir(str('/')),/not bound/);
});
test('original EDuke32 audio-driver source uses host SDL provider with correct string ABI',()=>{
  const rt=new NativeRuntime();
  const detach=bindBrowserSDL(rt);
  try {
    // Node need not expose an AudioContext; this still verifies source execution.
    assert.equal(SDLDrv_PCM_CheckDriverName(str('webaudio')),0);
    assert.equal(SDL_GetAudioDriver(0),0);
  } finally {detach();rt.close();}
  assert.throws(()=>SDL_GetAudioDriver(0),/not bound/);
});
