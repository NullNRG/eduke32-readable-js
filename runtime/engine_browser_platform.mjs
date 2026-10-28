import { sourceByteView } from './source_bytes.mjs';
/** Browser replacements for EDuke32's *platform-only* startup boundary.
 * The Build renderer, console variables, simulation, and gameplay are not
 * supplied or simulated here. The service table is exported only once bound
 * to a real NativeRuntime with a real monotonic clock and SDL adapter.
 */
export function createEngineBrowserPlatform({ heap, sdl, canvas = null, clock = () => globalThis.performance?.now?.() } = {}) {
  if (!heap?.malloc || !sdl?.SDL_GetVersion || !sdl?.SDL_InitSubSystem || !sdl?.SDL_GetPerformanceCounter)
    throw new TypeError('Native browser SDL and C memory are required');
  const state={ timerHz:0, origin:0n, lastClockMs:null, cpuBackend:null, title:null };
  const monotonic = () => {
    const value=clock();
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0)
      throw new RangeError('Browser monotonic clock unavailable');
    if (state.lastClockMs !== null && value < state.lastClockMs)
      throw new Error('Browser monotonic clock regressed');
    state.lastClockMs=value;
    return value;
  };
  const sdlayer_checkversion=() => {
    const ptr=heap.malloc(3);
    try {
      sdl.SDL_GetVersion(ptr);
      const [major,minor,patch]=heap.u8.subarray(ptr,ptr+3);
      // Original source/build/include/sdl_inc.h requires SDL >= 2.0.5.
      return major>2 || (major===2 && (minor>0 || (minor===0 && patch>=5))) ? 0 : -1;
    } finally { heap.free(ptr); }
  };
  const sysReadCPUID=() => {
    // JavaScript has no x86 CPUID instruction, and the browser runtime does
    // not use x86 SIMD dispatch. Record the *actual* selected JS backend;
    // do not forge native CPUID vendor/features or claim they were detected.
    if (typeof Uint8Array!=='function' || typeof BigInt!=='function')
      throw new Error('Required native JavaScript numeric operations missing');
    state.cpuBackend='native-js';
  };
  const timerInit=ticksPerSecond => {
    if (!Number.isSafeInteger(ticksPerSecond) || ticksPerSecond<=0 || ticksPerSecond>1000000)
      throw new RangeError('Original timer rate must be a positive integer');
    monotonic();
    // SDL_INIT_TIMER is an actual implemented browser SDL subsystem (0x1).
    if (sdl.SDL_InitSubSystem(0x1)!==0) return -1;
    const counter=sdl.SDL_GetPerformanceCounter();
    if (typeof counter!=='bigint' || counter<0n)throw new Error('SDL timer did not provide monotonic nanoseconds');
    state.timerHz=ticksPerSecond;
    state.origin=counter;
    return 0;
  };
  const decodeCString=arg => {
    arg=sourceByteView(arg)??arg;
    if (arg instanceof Uint8Array){
      const end=arg.indexOf(0);
      if(end<0)throw new TypeError('Original app title C string lacks NUL');
      return new TextDecoder().decode(arg.slice(0,end));
    }
    if(Number.isSafeInteger(arg)&&arg>0)return heap.readCString(arg);
    throw new TypeError('Invalid original app-title C pointer');
  };
  const wm_setapptitle = arg => {
    const title=decodeCString(arg);
    state.title=title;
    if (canvas && typeof canvas.setAttribute==='function')canvas.setAttribute('aria-label',title);
    const doc=canvas?.ownerDocument;
    if (doc && typeof doc.title==='string')doc.title=title;
  };
  return Object.freeze({ symbols:Object.freeze({ sdlayer_checkversion,sysReadCPUID,timerInit,wm_setapptitle }),state });
}
