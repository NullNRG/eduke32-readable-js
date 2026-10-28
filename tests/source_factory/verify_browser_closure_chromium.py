#!/usr/bin/env python3
"""Actual Chromium proof for source-translated EDuke32 plus native web platform."""
import asyncio,base64,json,re,shutil
from datetime import datetime,timezone
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[2]
REPORT=ROOT/'reports/browser-target/chromium-closure.json'

def inline_graph(paths):
    memo={}
    def encode(path,stack=()):
        path=path.resolve()
        if path in memo:return memo[path]
        if path in stack:raise RuntimeError('Cyclic import')
        if not path.is_relative_to(ROOT):raise RuntimeError('Unexpected outside import')
        js=path.read_text()
        def replace(m):
            target=(path.parent/m.group(2)).resolve()
            return json.dumps(encode(target,stack+(path,)))
        js=re.sub(r'(?<=from )([\'"])(\.{1,2}/[^\'"]+)\1',replace,js)
        memo[path]='data:text/javascript;base64,'+base64.b64encode(js.encode()).decode()
        return memo[path]
    return {key:encode(ROOT/file) for key,file in paths.items()}

async def run():
    modules=inline_graph({'runtime':'runtime/index.mjs',
       'sdl':'factory-output/source-first/browser-target/browser-abi/sdl_provider.mjs',
       'libc':'factory-output/source-first/browser-target/browser-abi/libc_provider.mjs',
       'audio':'factory-output/source-first/browser-target/source/audiolib/src/driver_sdl.cpp.mjs',
       'hints':'factory-output/source-first/browser-target/source/build/src/sdlayer.cpp.mjs',
       'startup':'factory-output/source-first/browser-target/source/duke3d/src/common.cpp.mjs',
       'compat':'factory-output/source-first/browser-target/source/build/src/compat.cpp.mjs'})
    errors=[]
    async with async_playwright() as pw:
        browser=await pw.chromium.launch(executable_path=shutil.which('chromium'),headless=True,
            args=['--no-sandbox','--disable-gpu-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader'])
        try:
            page=await browser.new_page(viewport={'width':800,'height':550})
            page.on('pageerror',lambda error:errors.append(str(error)))
            await page.set_content('<html><body><canvas id="output"></canvas></body></html>')
            result=await page.evaluate('''async modules=>{
              const [{NativeRuntime,bindSourceFreeAllocator},sdl,libc,audio,hints,startup,compat]=await Promise.all([
                import(modules.runtime),import(modules.sdl),import(modules.libc),
                import(modules.audio),import(modules.hints),import(modules.startup),import(modules.compat)]);
              const rt=new NativeRuntime({canvas:document.querySelector('canvas'),renderer:'canvas2d'});
              const sd=sdl.bindBrowserSDL(rt),lc=libc.bindBrowserC(rt);
              const bytes=v=>new TextEncoder().encode(v+'\\0');
              const read=a=>new TextDecoder().decode(a.subarray(0,a.indexOf(0)));
              try {
                const init=sdl.SDL_InitSubSystem(1|32|16384);
                hints.sdlayer_sethints();
                const originalPlatformInit=hints.initsystem();
                const originalTimerHz=rt.engineHost.state.timerHz;
                const hint=rt.heap.readCString(rt.sdl.symbols.SDL_GetHint(rt.heap.writeCString('SDL_MOUSE_FOCUS_CLICKTHROUGH')));
                const driver=rt.sdl.symbols.SDL_GetAudioDriver(0);
                const deviceName=driver?rt.heap.readCString(driver):null;
                const found=audio.SDLDrv_PCM_CheckDriverName(bytes('webaudio'));
                const unknown=audio.SDLDrv_PCM_CheckDriverName(bytes('unknown-device'));
                const cwd=new Uint8Array(128);
                const homePtr=libc.Bgethomedir(),appPtr=libc.Bgetappdir();
                const home=read(homePtr),appdir=read(appPtr);
                libc.free(homePtr);libc.free(appPtr);
                const homeConfigured=libc.buildvfs_exists(bytes('/home/browser/.config'));
                const homeIsDir=libc.buildvfs_isdir(bytes('/home/browser/.config'));
                const missingDir=libc.buildvfs_exists(bytes('/not-present'));
                const before=read(libc.getcwd(cwd,128));
                const made=libc.mkdir(bytes('/browser-save'),448);
                const change=libc.chdir(bytes('/browser-save'));
                const after=read(libc.getcwd(cwd,128));
                // Exercise original C framebuffer presentation through native WebGL2,
                // keeping Build engine rasterization itself outside this test.
                const gpuCanvas=document.createElement('canvas');document.body.append(gpuCanvas);
                let gpu=null;
                try {
                  const gpuRuntime=new NativeRuntime({canvas:gpuCanvas,renderer:'webgl2'});
                  try {
                    const api=gpuRuntime.sdl.symbols;
                    const gi=api.SDL_InitSubSystem(1|32);
                    const gw=api.SDL_CreateWindow(gpuRuntime.heap.writeCString('Build framebuffer'),0,0,2,2,4);
                    const gs=api.SDL_GetWindowSurface(gw);
                    const pixels=Number(gpuRuntime.heap.read(gs+32,'u64'));
                    // Four distinct RGBA pixels in top-down row order.
                    gpuRuntime.heap.u8.set([255,0,0,255, 0,255,0,255, 0,0,255,255, 255,255,255,255],pixels);
                    const presented=api.SDL_UpdateWindowSurface(gw);
                    const gl=gpuRuntime.renderer.gl;
                    const readback=new Uint8Array(16);
                    gl.readPixels(0,0,2,2,gl.RGBA,gl.UNSIGNED_BYTE,readback);
                    gpu={backend:gpuRuntime.renderer.backend,init:gi,presented,readback:[...readback]};
                  } finally {gpuRuntime.close();}
                } catch (e) {gpu={error:String(e)};}
                const win=sdl.SDL_CreateWindow(rt.heap.writeCString('Original EDuke32 source browser'),0,0,320,200,4);
                const surface=rt.sdl.symbols.SDL_GetWindowSurface(win);
                const px=Number(rt.heap.read(surface+32,'u64'));
                rt.heap.u8.set([12,34,56,255],px);
                const framePresented=rt.sdl.symbols.SDL_UpdateWindowSurface(win);
                const presentedPixel=[...rt.renderer.ctx.getImageData(0,0,1,1).data];
                const detachAllocator=bindSourceFreeAllocator(compat.__cxx_global_cell_11016d3c7177543e564ab46c,libc.free);
                let originalStartup=null;
                try {
                  // Original Clang-lowered G_ExtPreInit, not a recreated startup stub.
                  startup.G_ExtPreInit(0,[]);
                  const startupCwd=new Uint8Array(128);
                  originalStartup={cwd:read(libc.getcwd(startupCwd,128)),
                    rootDir:read(startup.g_rootDir),
                    searchPaths:rt.fs.searchPaths.map(x=>x.prefix)};
                }finally{detachAllocator();}

                return {init,originalPlatformInit,originalTimerHz,hint,deviceName,found,unknown,before,made,change,after,windowCreated:win>0,
                  framePresented,presentedPixel,originalStartup,home,appdir,homeConfigured,homeIsDir,missingDir,
                  canvas:[rt.sdl.symbols.SDL_GetWindowSurface(win)>0,rt.renderer.backend],gpu,
                  sourceNames:['source/build/src/sdlayer.cpp::sdlayer_sethints','source/audiolib/src/driver_sdl.cpp::SDLDrv_PCM_CheckDriverName']};
              }finally{lc();sd();rt.close();}
            }''',modules)
            assert result['init']==0 and result['originalPlatformInit']==0 and result['originalTimerHz']==120,result
            assert result['hint']=='0',result
            assert result['deviceName']=='webaudio',result
            assert result['found']==1 and result['unknown']==0,result
            assert result['before']=='/' and result['after']=='/browser-save',result
            assert result['home']=='/home/browser' and result['appdir']=='/',result
            assert result['homeConfigured']==1 and result['homeIsDir']==1 and result['missingDir']==0,result
            assert result['made']==0 and result['change']==0,result
            assert result['originalStartup']['cwd']=='/home/browser/.config/eduke32',result
            assert result['originalStartup']['searchPaths'][0]=='home/browser/.config/eduke32',result
            assert result['windowCreated'],result
            assert result['framePresented']==0 and result['presentedPixel']==[12,34,56,255],result
            assert result['gpu'].get('backend')=='webgl2' or result['gpu'].get('error')=='Error: WebGL2 unavailable',result
            assert not errors,errors
            html=(ROOT/'dist/browser-platform-check.html').read_text()
            await page.set_content(html,wait_until='load')
            await page.locator('#run').click()
            await page.wait_for_function("document.querySelector('#state').textContent.startsWith('PASS:')",timeout=15000)
            message=await page.locator('#state').inner_text()
            assert 'game startup not linked' in message,message
            assert not errors,errors
            return {'format':'eduke32-browser-host-closure/1','time_utc':datetime.now(timezone.utc).isoformat(),
               'browser':'Chromium','status':'PASS_ORIGINAL_SOURCE_WEB_HOST_CLOSURE',
               'standalone_html_test':'PASS_ORIGINAL_SOURCE_BROWSER_CHECK',
               'source_linked_gameplay_booted':False,'checks':result,'page_errors':errors}
        finally:await browser.close()

if __name__=='__main__':
    result=asyncio.run(run());REPORT.parent.mkdir(parents=True,exist_ok=True)
    REPORT.write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2))
