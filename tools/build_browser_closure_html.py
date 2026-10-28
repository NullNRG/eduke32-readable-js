#!/usr/bin/env python3
"""Offline HTML proving actual source-translated engine helpers against web services.

Diagnostic only, never an app_main or substitute gameplay renderer.
"""
import base64,json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]

def graph(paths):
  memo={}
  def inline(path,stack=()):
    path=path.resolve()
    if not path.is_relative_to(ROOT):raise ValueError('Import outside project')
    if path in stack:raise ValueError('Cyclic import: '+str(path))
    if path in memo:return memo[path]
    source=path.read_text(encoding='utf-8')
    pattern=r'(?<=from )([\'"])(\.{1,2}/[^\'"]+)\1'
    source=re.sub(pattern,lambda m:json.dumps(inline((path.parent/m.group(2)),stack+(path,))),source)
    memo[path]='data:text/javascript;base64,'+base64.b64encode(source.encode()).decode('ascii')
    return memo[path]
  return {name:inline(ROOT/path) for name,path in paths.items()}

def main():
  paths={'runtime':'runtime/index.mjs',
         'sdl':'factory-output/source-first/browser-target/browser-abi/sdl_provider.mjs',
         'libc':'factory-output/source-first/browser-target/browser-abi/libc_provider.mjs',
         'hints':'factory-output/source-first/browser-target/source/build/src/sdlayer.cpp.mjs',
         'audio':'factory-output/source-first/browser-target/source/audiolib/src/driver_sdl.cpp.mjs',
         'startup':'factory-output/source-first/browser-target/source/duke3d/src/common.cpp.mjs',
         'compat':'factory-output/source-first/browser-target/source/build/src/compat.cpp.mjs'}
  modules=graph(paths)
  out=ROOT/'dist/browser-platform-check.html';out.parent.mkdir(exist_ok=True)
  html='''<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>EDuke32 original-source platform bridge</title><style>
  body{background:#151922;color:#ebedf5;font:15px/1.5 system-ui, sans-serif;max-width:920px;margin:auto;padding:24px}button{background:#5588d9;color:#fff;border:0;padding:10px 16px;border-radius:6px;cursor:pointer}canvas{border:1px solid #677187;max-width:100%;image-rendering:pixelated}pre{white-space:pre-wrap;background:#242a37;padding:16px;border-radius:6px}strong{color:#86d9a2}p{max-width:70ch}</style></head><body>
  <h1>EDuke32 · Original-source browser platform check</h1>
  <p><strong>Diagnostic only. Not a booted or playable game.</strong> Runs original transpiled EDuke32 startup path G_ExtPreInit, SDL helpers, and audio driver lookup through implemented browser services. Checks virtual filesystem search-path registration and software-framebuffer presentation.</p>
  <button id="run">Run source/browser checks</button><p id="state" role="status">Ready</p><canvas id="screen" width="320" height="200"></canvas><pre id="log"></pre>
  <script type="module">
  const urls=MODULE_URLS;
  document.querySelector('#run').addEventListener('click',async()=>{
    const state=document.querySelector('#state'),log=document.querySelector('#log');
    state.textContent='Running original-source tests…';
    try{
      const [{NativeRuntime,bindSourceFreeAllocator},sdl,libc,hints,audio,startup,compat]=await Promise.all([import(urls.runtime),import(urls.sdl),import(urls.libc),import(urls.hints),import(urls.audio),import(urls.startup),import(urls.compat)]);
      const canvas=document.querySelector('#screen');
      const rt=new NativeRuntime({canvas,renderer:'canvas2d'});
      const detachSDL=sdl.bindBrowserSDL(rt),detachC=libc.bindBrowserC(rt);
      try {
        const flags=sdl.SDL_InitSubSystem(1|32|16384);
        if(flags!==0)throw Error('Browser SDL init returned '+flags);
        hints.sdlayer_sethints();
        const originalPlatformStatus=hints.initsystem();
        if(originalPlatformStatus!==0)throw Error('Original initsystem() failed: '+originalPlatformStatus);
        if(rt.engineHost.state.timerHz!==120)throw Error('Original engine timer rate incorrect');
        const originalPlatform={function:'initsystem',status:'executed',timerHz:rt.engineHost.state.timerHz,
          cpuBackend:rt.engineHost.state.cpuBackend,displayCount:sdl.SDL_GetNumVideoDisplays(),
          windowTitle:document.title};
        const key=rt.heap.writeCString('SDL_MOUSE_FOCUS_CLICKTHROUGH');
        const hint=rt.heap.readCString(rt.sdl.symbols.SDL_GetHint(key));
        if(hint!=='0')throw Error('Original SDL hint mismatch');
        const driver=audio.SDLDrv_PCM_CheckDriverName(new TextEncoder().encode('webaudio\\0'));
        const windowPtr=sdl.SDL_CreateWindow(rt.heap.writeCString('EDuke32 source-check'),0,0,320,200,4);
        if(!windowPtr)throw Error('Canvas window not created');
        const sf=sdl.SDL_GetWindowSurface(windowPtr),px=Number(rt.heap.read(sf+32,'u64'));
        rt.heap.u8.set([200,70,32,255],px);
        if(sdl.SDL_UpdateWindowSurface(windowPtr)!==0)throw Error('Framebuffer transfer failed');
        const displayed=[...rt.renderer.ctx.getImageData(0,0,1,1).data];
        if(displayed.join(',')!=='200,70,32,255')throw Error('Framebuffer readback mismatch');
        const cwd=new Uint8Array(80);
        libc.getcwd(cwd,80);
        const base=new TextDecoder().decode(cwd.subarray(0,cwd.indexOf(0)));
        const detachOriginalAllocator=bindSourceFreeAllocator(compat.__cxx_global_cell_11016d3c7177543e564ab46c,libc.free);
        let bootStage;
        try {
          startup.G_ExtPreInit(0,[]);
          libc.getcwd(cwd,80);
          bootStage={function:'G_ExtPreInit',status:'executed',
            virtualDirectory:new TextDecoder().decode(cwd.subarray(0,cwd.indexOf(0))),
            searchPaths:rt.fs.searchPaths.map(x=>x.prefix)};
          if(bootStage.virtualDirectory!=='/home/browser/.config/eduke32')throw Error('Original startup did not select user directory');
        }finally{detachOriginalAllocator();}
        const outcome={original_source:['G_ExtPreInit','initsystem','sdlayer_sethints','SDLDrv_PCM_CheckDriverName'],originalPlatform,bootStage,sourceSDLHint:hint,audioDriverMatch:driver,initialVFSDirectory:base,frameReadback:displayed,webgl2:(()=>{try {const c=document.createElement('canvas');return !!c.getContext('webgl2');}catch{return false;}})(),gameBooted:false};
        log.textContent=JSON.stringify(outcome,null,2);
        state.textContent='PASS: Original G_ExtPreInit and initsystem ran (game startup not linked)';
      }finally{detachC();detachSDL();rt.close();}
    }catch(error){state.textContent='FAILED: '+error.message;log.textContent=String(error.stack||error);}
  });
  </script></body></html>'''.replace('MODULE_URLS',json.dumps(modules))
  out.write_text(html,encoding='utf-8')
  print(json.dumps({'file':str(out.relative_to(ROOT)),'bytes':out.stat().st_size,'module_graph_count':len(modules),'gameplay_verified':False}))
if __name__=='__main__':main()
