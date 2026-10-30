import { ABIHeap } from './abi.mjs';
import { createBuildBrowserPlatform, bindSourceFreeAllocator } from './build_browser_platform.mjs';
import { bindSourceCHeap } from './source_memory.mjs';
import { createDukeBrowserPaths } from './duke_browser_paths.mjs';
import { createEngineBrowserPlatform } from './engine_browser_platform.mjs';
import { VirtualFS } from './filesystem.mjs';
import { BrowserPlatform } from './platform.mjs';
import { createRenderer } from './renderers.mjs';
import { createSDLBrowser } from './sdl_browser.mjs';
import { createStdlib } from './stdlib.mjs';
import { SymbolLinker } from './linker.mjs';
/** Native JavaScript browser runtime supporting original-source lowering.
 * No claim that EDuke32's renderer/gameplay is already linked.
 */
export class NativeRuntime {
  constructor({ canvas = null, THREE = null, renderer = 'auto', memoryBytes = 1 << 20, callIndirect = null, homeDirectory = '/home/browser', applicationDirectory = '/', nativeServices = null } = {}) {
    this.heap = new ABIHeap(memoryBytes);
    this.fs = new VirtualFS();
    const stdlib = createStdlib({ heap: this.heap, fs: this.fs, callIndirect });
    // Source-authored Build/EDuke32 platform contract, backed by the same VFS.
    const browserDirs = createBuildBrowserPlatform({ heap: this.heap, symbols: stdlib.symbols, fs: this.fs,
      homeDirectory, applicationDirectory });
    this.platform = new BrowserPlatform(canvas);
    this.renderer = canvas ? createRenderer(canvas, { preferred: renderer, THREE }) : null;
    // The compiled original SDL ABI resolves to web-native browser services,
    // not an SDL2 WASM binary or fake symbol stubs.
    this.sdl = createSDLBrowser({ heap: this.heap, canvas, callIndirect,
      framePresenter: this.renderer?.backend === 'webgl2' ? this.renderer : null });
    this.nativeServices=nativeServices;
    if(nativeServices){
      if(nativeServices.backend!=='sdl2-wasm32'||typeof nativeServices.bindSDL!=='function')
        throw new TypeError('Verified SDL2 native service instance required');
      this.sdl=Object.freeze({...this.sdl,symbols:nativeServices.bindSDL(this.heap,this.sdl.symbols)});
    }
    this.engineHost = createEngineBrowserPlatform({heap:this.heap,sdl:this.sdl.symbols,canvas});
    this.dukePaths = createDukeBrowserPaths({fs:this.fs,addsearchpath_user:browserDirs.addsearchpath_user,applicationDirectory});
    this.library = { ...stdlib, symbols: Object.freeze({ ...stdlib.symbols, ...browserDirs, ...this.engineHost.symbols, ...this.dukePaths }) };
    this.linker = new SymbolLinker();
    this.linker.register('libc', this.library.symbols);
    this.linker.register('SDL2-browser', this.sdl.symbols);
  }
  registerCompiledModule(name, symbols, unresolvedExternals = []) {
    this.linker.require(unresolvedExternals);
    this.linker.register(name, symbols);
  }
  bindSourceMemory() { return bindSourceCHeap(this.heap); }
  start() { this.platform.attach(); }
  close() { this.sdl.symbols.SDL_Quit(); this.nativeServices?.close(); this.platform.destroy(); this.renderer?.destroy(); }
  manifest() { return { backend: this.renderer?.backend || null, nativeServices:this.nativeServices?.backend??null, exports: this.linker.manifest() }; }
}
export { createDukeBrowserPaths, createBuildBrowserPlatform, createEngineBrowserPlatform, bindSourceFreeAllocator, bindSourceCHeap, ABIHeap, VirtualFS, BrowserPlatform, createRenderer, createSDLBrowser, createStdlib, SymbolLinker };
