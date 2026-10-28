#!/usr/bin/env python3
"""Run original C++-source-translated SDL startup helper against real Chromium native services."""
import asyncio
import json
from pathlib import Path
from datetime import datetime, timezone
from playwright.async_api import async_playwright
import shutil

ROOT = Path(__file__).resolve().parents[2]
REPORT = ROOT/'reports/browser-target/chromium-original-sdl.json'

async def check():
    errors=[]
    import base64, re
    cache={}
    def inline_module(file, stack=()):
        file=file.resolve()
        if file in cache:return cache[file]
        if file in stack:raise RuntimeError('cyclic module dependency: '+str(file))
        source=file.read_text(encoding='utf-8')
        pat=re.compile(r'(?<=from )([\"\'])(\.{1,2}/[^\"\']+)\1')
        def ref(match):
            target=(file.parent/match.group(2)).resolve()
            if not target.is_relative_to(ROOT):raise RuntimeError('import outside source tree')
            return json.dumps(inline_module(target, stack+(file,)))
        source=pat.sub(ref,source)
        cache[file]='data:text/javascript;base64,'+base64.b64encode(source.encode()).decode()
        return cache[file]
    urls={
      'runtime':inline_module(ROOT/'runtime/index.mjs'),
      'bridge':inline_module(ROOT/'factory-output/source-first/browser-target/browser-abi/sdl_provider.mjs'),
      'original':inline_module(ROOT/'factory-output/source-first/browser-target/source/build/src/sdlayer.cpp.mjs'),
    }
    async with async_playwright() as pw:
            browser=await pw.chromium.launch(executable_path=shutil.which('chromium'),headless=True,
                                             args=['--no-sandbox','--disable-gpu-sandbox','--use-gl=angle','--use-angle=swiftshader'])
            try:
                page=await browser.new_page(viewport={'width':800,'height':600})
                page.on('pageerror',lambda err:errors.append(str(err)))
                await page.set_content('<html><body></body></html>')
                outcome=await page.evaluate('''async (urls) => {
                  const {NativeRuntime} = await import(urls.runtime);
                  const abi = await import(urls.bridge);
                  const original = await import(urls.original);
                  const canvas=document.createElement('canvas');document.body.append(canvas);
                  const rt=new NativeRuntime({canvas,renderer:'canvas'});
                  const release=abi.bindBrowserSDL(rt);
                  try {
                    const init=abi.SDL_InitSubSystem(1|32|16384);
                    original.sdlayer_sethints();
                    const key=rt.heap.writeCString('SDL_MOUSE_FOCUS_CLICKTHROUGH');
                    const valuePtr=rt.sdl.symbols.SDL_GetHint(key);
                    const value=rt.heap.readCString(valuePtr);
                    const win=abi.SDL_CreateWindow(rt.heap.writeCString('Duke browser target test'),0,0,320,200,4);
                    const display=abi.SDL_GetNumVideoDisplays();
                    const timer=abi.SDL_GetPerformanceFrequency();
                    const result={init,originalSourceInvoked:true,value,winIsValid:win>0,
                      width:canvas.width,height:canvas.height,display,
                      timerHz:String(timer),sourceName:'source/build/src/sdlayer.cpp::sdlayer_sethints'};
                    abi.SDL_DestroyWindow(win);
                    return result;
                  } finally {release();rt.close();}
                }''',urls)
                assert outcome['init']==0,outcome
                assert outcome['value']=='0',outcome
                assert outcome['winIsValid'],outcome
                assert outcome['width']==320 and outcome['height']==200,outcome
                assert outcome['display']==1,outcome
                assert outcome['timerHz']=='1000000000',outcome
                assert not errors,errors
                return {'format':'eduke32-browser-target-original-source/1','time_utc':datetime.now(timezone.utc).isoformat(),
                        'browser':'Chromium','status':'PASS_ORIGINAL_SDL_SOURCE_BRIDGE',
                        'original_gameplay_verified':False,'app_main_linked':False,
                        'checks':outcome,'page_errors':errors}
            finally: await browser.close()

if __name__=='__main__':
    result=asyncio.run(check())
    REPORT.parent.mkdir(parents=True,exist_ok=True)
    REPORT.write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(result,indent=2))
