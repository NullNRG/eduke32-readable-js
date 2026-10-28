#!/usr/bin/env python3
"""Run original source/Build initsystem in actual Chromium, not a stub."""
import asyncio,json,shutil
from pathlib import Path
from playwright.async_api import async_playwright
from verify_browser_closure_chromium import inline_graph
ROOT=Path(__file__).resolve().parents[2]
REPORT=ROOT/'reports/browser-target/chromium-original-initsystem.json'

async def run():
    modules=inline_graph({
        'runtime':'runtime/index.mjs',
        'sdl':'factory-output/source-first/browser-target/browser-abi/sdl_provider.mjs',
        'libc':'factory-output/source-first/browser-target/browser-abi/libc_provider.mjs',
        'original':'factory-output/source-first/browser-target/source/build/src/sdlayer.cpp.mjs',
        'baselayer':'factory-output/source-first/browser-target/source/build/src/baselayer.cpp.mjs',
    })
    errors=[]
    async with async_playwright() as pw:
        browser=await pw.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox'])
        try:
            page=await browser.new_page()
            page.on('pageerror',lambda error:errors.append(str(error)))
            await page.set_content('<!doctype html><html><head><title>source test</title></head><body><canvas id="screen" width="320" height="200"></canvas></body></html>')
            result=await page.evaluate('''async urls=>{
               const [{NativeRuntime},sdl,libc,src,base]=await Promise.all([
                 import(urls.runtime),import(urls.sdl),import(urls.libc),import(urls.original),import(urls.baselayer)]);
               const canvas=document.querySelector('#screen');
               const rt=new NativeRuntime({canvas,renderer:'canvas2d'});
               const unbindSDL=sdl.bindBrowserSDL(rt),unbindC=libc.bindBrowserC(rt);
               try {
                 src.sdlayer_sethints();
                 const status=src.initsystem();
                 const initialized=sdl.SDL_WasInit(0);
                 const displayCount=base.__cxx_global_cell_9fad9f5c6a95d4e89a1de80a().value;
                 const clock=rt.engineHost.state;
                 return {status,initialized,displayCount,cpuBackend:clock.cpuBackend,
                     timerHz:clock.timerHz,origin:clock.origin.toString(),
                     windowTitle:document.title,canvasLabel:canvas.getAttribute('aria-label'),
                     frameplace:src.frameplace,lockcount:src.lockcount,
                     sourceName:'source/build/src/sdlayer.cpp::initsystem',
                     originalAppMainExecuted:false};
               } finally {unbindC();unbindSDL();rt.close();}
            }''',modules)
            assert result['status']==0,result
            assert result['initialized']&0x20,result  # SDL_INIT_VIDEO
            assert result['initialized']&0x1,result # SDL_INIT_TIMER
            assert result['displayCount']==1,result
            assert result['timerHz']==120,result
            assert result['cpuBackend']=='native-js',result
            assert int(result['origin'])>0,result
            assert result['windowTitle']==result['canvasLabel'] and result['windowTitle'],result
            assert result['frameplace']==0 and result['lockcount']==0,result
            assert not errors,errors
            return {'format':'eduke32-original-source-initsystem/1','browser':'Chromium',
              'status':'PASS_ORIGINAL_ENGINE_PLATFORM_INIT',
              'original_gameplay_verified':False,'actual_source_function_executed':True,
              'results':result,'browser_page_errors':errors}
        finally:await browser.close()

if __name__=='__main__':
  r=asyncio.run(run());REPORT.parent.mkdir(parents=True,exist_ok=True);REPORT.write_text(json.dumps(r,indent=2)+'\n');print(json.dumps(r,indent=2))
