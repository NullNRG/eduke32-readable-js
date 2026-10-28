import test from 'node:test';
import assert from 'node:assert/strict';
import { NativeRuntime } from '../../runtime/index.mjs';
import * as bridge from '../../factory-output/source-first/browser-target/browser-abi/sdl_provider.mjs';

test('browser ABI rejects use before an actual NativeRuntime is bound', () => {
  assert.throws(() => bridge.SDL_GetPerformanceFrequency(), /not bound/);
});

test('host exports are actual original SDL-call contracts, not success stubs', () => {
  const rt = new NativeRuntime();
  const detach = bridge.bindBrowserSDL(rt);
  try {
    assert.equal(bridge.SDL_InitSubSystem(1), 0); // SDL_INIT_TIMER
    assert.equal(bridge.SDL_GetPerformanceFrequency(), 1000000000n);
    assert.equal(typeof bridge.SDL_GetPerformanceCounter(), 'bigint');
    assert.equal(bridge.SDL_WasInit(1) & 1, 1);
    assert.equal(bridge.SDL_InitSubSystem(0x20), -1); // No canvas => VIDEO unsupported.
    assert.match(new TextDecoder().decode(bridge.SDL_GetError()), /unavailable/i);
    assert.match(rt.heap.readCString(rt.sdl.symbols.SDL_GetError()), /unavailable/i);
    assert.equal(bridge.SDL_GetNumVideoDisplays(), -1);
    assert.equal(rt.sdl.symbols.SDL_GetNumVideoDisplays(), -1);
  } finally { detach(); rt.close(); }
  assert.throws(() => bridge.SDL_GetPerformanceFrequency(), /not bound/);
});

test('SDL ABI prevents cross-runtime binding without explicit teardown', () => {
  const one = new NativeRuntime(), two = new NativeRuntime();
  const detach = bridge.bindBrowserSDL(one);
  try {
    assert.throws(() => bridge.bindBrowserSDL(two), /already bound/);
    assert.equal(bridge.SDL_InitSubSystem(1), 0);
  } finally { detach(); one.close(); two.close(); }
});

test('SDL adapter exports match the proven generated symbol index', async () => {
  const { readFile } = await import('node:fs/promises');
  const url = new URL('../../factory-output/source-first/browser-target/browser-sdl-symbol-owners.json', import.meta.url);
  const map = JSON.parse(await readFile(url, 'utf8'));
  assert.equal(Object.keys(map).length, bridge.BROWSER_SDL_SYMBOLS.length);
  for (const name of bridge.BROWSER_SDL_SYMBOLS) {
    assert.equal(map[name], 'browser-abi/sdl_provider');
    assert.equal(typeof bridge[name], 'function');
  }
});
