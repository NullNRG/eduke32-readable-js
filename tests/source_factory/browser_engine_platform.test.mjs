import test from 'node:test';
import assert from 'node:assert/strict';
import {NativeRuntime,ABIHeap,createEngineBrowserPlatform} from '../../runtime/index.mjs';

test('original engine platform boundary uses implemented browser SDL version, timer and title',()=>{
  const rt=new NativeRuntime();
  try {
    const f=rt.engineHost.symbols;
    assert.equal(f.sdlayer_checkversion(),0);
    f.sysReadCPUID();
    assert.equal(rt.engineHost.state.cpuBackend,'native-js');
    assert.equal(f.timerInit(120),0);
    assert.equal(rt.engineHost.state.timerHz,120);
    assert.ok(rt.engineHost.state.origin>0n);
    assert.throws(()=>f.timerInit(0),RangeError);
    assert.throws(()=>f.timerInit(1.5),RangeError);
    assert.throws(()=>f.wm_setapptitle(Uint8Array.from([65,66])),/NUL/);
    f.wm_setapptitle(Uint8Array.from([66,117,105,108,100,0]));
    assert.equal(rt.engineHost.state.title,'Build');
  } finally{rt.close();}
});

test('outdated SDL adapter and regressing host clock cannot silently succeed',()=>{
  const heap=new ABIHeap();
  const calls=[];
  let current=100;
  const sdl={
    SDL_GetVersion:p=>heap.u8.set([2,0,4],p),
    SDL_InitSubSystem:flag=>{calls.push(flag);return 0;},
    SDL_GetPerformanceCounter:()=>100000000n,
  };
  const instance=createEngineBrowserPlatform({heap,sdl,clock:()=>current});
  assert.equal(instance.symbols.sdlayer_checkversion(),-1);
  assert.equal(instance.symbols.timerInit(120),0);
  assert.deepEqual(calls,[1]);
  current=99;
  assert.throws(()=>instance.symbols.timerInit(120),/regressed/);
});

test('browser startup service refuses missing original ABI dependencies',()=>{
  assert.throws(()=>createEngineBrowserPlatform({}),TypeError);
});
