"""Exercise the original initialized frame clock and limiter in Chromium."""
import json

from verify_original_demo_snapshot_heap import ROOT, run_browser_probe


PROBE = r'''async base => {
  const {NativeRuntime} = await import('/runtime/index.mjs');
  const runtime = new NativeRuntime({renderer:'canvas2d', memoryBytes:16<<20});
  runtime.bindSourceMemory();
  const detachC = (await import(base+'/browser-abi/libc_provider.mjs')).bindBrowserC(runtime);
  const detachSDL = (await import(base+'/browser-abi/sdl_provider.mjs')).bindBrowserSDL(runtime);
  try {
    const layer = await import(base+'/source/build/src/baselayer.cpp.mjs');
    const engine = await import(base+'/source/build/src/engine.cpp.mjs');
    const platform = await import(base+'/source/build/src/sdlayer.cpp.mjs');
    const timer = await import(base+'/source/build/src/timer.cpp.mjs');
    layer.engineSetupAllocator();
    if (engine.enginePreInit()!==0) throw Error('Original enginePreInit failed');
    if (platform.initsystem()!==0 || timer.timerGetClockRate()!==120)
      throw Error('Original platform startup did not initialize the source clock');
    const frameRate = layer.__cxx_global_cell_9856254f6c33ff5182a27f76();
    const frameDelay = layer.__cxx_global_cell_5669eb8f22367bb78b701754();
    frameRate.value=60;
    const rate=timer.timerGetNanoTickRate();
    if (rate<=0n || layer.engineFPSLimit(false)!==0 || frameDelay.value!==rate/60n)
      throw Error('First original frame limit check failed');
    const start=timer.timerGetNanoTicks();
    for (let i=0; i<10 && timer.timerGetNanoTicks()-start<frameDelay.value; i++)
      await new Promise(resolve=>setTimeout(resolve,20));
    if (timer.timerGetNanoTicks()-start<frameDelay.value || layer.engineFPSLimit(false)!==1)
      throw Error('Original frame limiter failed to release the next frame');
    frameRate.value=-2;
    if (layer.engineFPSLimit(false)!==1) throw Error('Original uncapped frame mode failed');
    return {original_platform_startup_verified:true, original_timer_init_verified:true, original_frame_limiter_verified:true,
            engine_clock_hz:timer.timerGetClockRate(), tested_frame_rate:60, tick_rate:String(rate),
            frame_delay:String(frameDelay.value)};
  } finally {
    detachSDL();
    detachC();
    runtime.close();
  }
}'''

if __name__ == '__main__':
    result = run_browser_probe(PROBE)
    (ROOT / 'reports/nov18-original-browser-frame-clock.json').write_text(
        json.dumps(result, indent=2) + '\n', encoding='utf-8')
    print('PASS original timer initialization and frame limiter in Chromium')
