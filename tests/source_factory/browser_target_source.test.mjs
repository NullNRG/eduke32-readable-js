import test from 'node:test';
import assert from 'node:assert/strict';
import { NativeRuntime } from '../../runtime/index.mjs';
import { bindBrowserSDL } from '../../factory-output/source-first/browser-target/browser-abi/sdl_provider.mjs';
import { sdlayer_sethints } from '../../factory-output/source-first/browser-target/source/build/src/sdlayer.cpp.mjs';

test('actual source-translated EDuke32 sdlayer_sethints runs with native browser SDL', () => {
  const runtime = new NativeRuntime();
  const detach = bindBrowserSDL(runtime);
  try {
    assert.equal(sdlayer_sethints(), undefined);
    const key=runtime.heap.writeCString('SDL_MOUSE_FOCUS_CLICKTHROUGH');
    const alias=runtime.heap.writeCString('SDL_AUDIO_RESAMPLING_MODE');
    // Both original C source literals compile to Uint8Array; heap pointer access
    // still works and both resolve through the SAME real adapter state.
    assert.equal(typeof runtime.sdl.symbols.SDL_GetHint(key), 'number');
    assert.equal(runtime.heap.readCString(runtime.sdl.symbols.SDL_GetHint(key)), '0');
    assert.equal(runtime.heap.readCString(runtime.sdl.symbols.SDL_GetHint(alias)), '3');
    assert.throws(() => runtime.sdl.symbols.SDL_SetHint(Uint8Array.from([65]),Uint8Array.from([0])), /terminating NUL/);
  } finally { detach(); runtime.close(); }
});
