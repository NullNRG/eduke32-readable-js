#!/usr/bin/env python3
"""Run source-generated startup functions with the real browser ABI in Chromium.
This is not an original app_main/gameplay test.
"""
import asyncio,json,shutil
from pathlib import Path
from urllib.parse import urlsplit,unquote
ROOT=Path(__file__).resolve().parents[2]
TARGET=ROOT/'factory-output/source-first/browser-target'
SNAPSHOT=ROOT/'factory-output/source-first/force-recovered'
BASE='https://source-factory.invalid'
import re,base64
IMPORT=re.compile(r"\b(?:from\s*|import\s*)[\'\"]([^\'\"]+)[\'\"]")
def modules_as_data():
    root=[ROOT/'runtime/index.mjs',TARGET/'browser-abi/libc_provider.mjs',
          TARGET/'source/build/src/compat.cpp.mjs',TARGET/'source/duke3d/src/common.cpp.mjs',
          TARGET/'source/duke3d/src/cheats.cpp.mjs',
          TARGET/'source/duke3d/src/game.cpp.mjs']
    urls={}
    def bundle(path):
        path=path.resolve()
        if path in urls:return urls[path]
        source=path.read_text()
        replacements={}
        for rel in IMPORT.findall(source):
            if not rel.startswith('.'):continue
            child=(path.parent/rel).resolve()
            if not child.exists() and child.is_relative_to(TARGET):
                child=SNAPSHOT/child.relative_to(TARGET)
            if not child.is_file():raise FileNotFoundError(child)
            replacements[rel]=bundle(child)
        for rel,url in replacements.items():
            source=source.replace("from '"+rel+"'", "from '"+url+"'")
            source=source.replace('from "'+rel+'"', 'from "'+url+'"')
            source=source.replace("import '"+rel+"'", "import '"+url+"'")
        data='data:text/javascript;base64,'+base64.b64encode(source.encode()).decode()
        urls[path]=data
        return data
    result=[bundle(p) for p in root]
    return result,len(urls)
async def main():
 from playwright.async_api import async_playwright
 errors=[]
 payload,nmodules=modules_as_data()
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox'])
  try:
   page=await browser.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
   await page.set_content('<!doctype html><title>Original source browser startup</title>')
   test=r"""async(u)=>{
      const [{NativeRuntime,bindSourceFreeAllocator},lib,compat,source,cheats,game]=await Promise.all(u.map(s=>import(s)));
      const runtime=new NativeRuntime(),unbind=lib.bindBrowserC(runtime);
      const free=bindSourceFreeAllocator(compat.__cxx_global_cell_11016d3c7177543e564ab46c,lib.free);
      const b=x=>new TextEncoder().encode(x+'\0');
      try{
       source.G_ExtPreInit(0,[]);
       for(const [name,tag] of [['nam',2],['fury',8],['remove',1]]){
         runtime.fs.mountBytes('/'+name+'/data.dat',new Uint8Array([tag]));
         if(lib.addsearchpath_user(b('/'+name),tag)!==0)throw Error('mount '+name);
       }
       if(runtime.fs.searchPaths.length!==4)throw Error('pre-cleanup extent');
       source.__cxx_global_cell_c0e288040dbf9a805036c27d().value=2;
       source.G_CleanupSearchPaths();
       const paths=runtime.fs.searchPaths.map(x=>x.prefix).sort();
       if(JSON.stringify(paths)!==JSON.stringify(['home/browser/.config/eduke32','nam'])) throw Error('wrong filtered paths '+paths);
       if(runtime.fs.readFile('data.dat')[0]!==2)throw Error('wrong gametype search path');
       const before=new TextDecoder().decode(cheats.CheatStrings[0]).split('\0')[0];
       if(before!=='cornholio')throw Error('wrong original cheats '+before);
       source.__cxx_global_cell_c0e288040dbf9a805036c27d().value=8;
       cheats.G_SetupCheats();
       const adapted=new TextDecoder().decode(cheats.CheatStrings[0]).split('\0')[0];
       if(adapted!=='2god')throw Error('WW2GI original cheat setup '+adapted);
       // The source-generated variant selectors must inspect real VFS
       // contents; no game script or resource is fabricated here.
       if(new TextDecoder().decode(source.G_DefaultConFile()).split('\0')[0]!=='GAME.CON')
         throw Error('wrong unmounted source CON fallback');
       runtime.fs.mountBytes('EDUKE.CON',Uint8Array.of(12));
       source.__cxx_global_cell_c0e288040dbf9a805036c27d().value=1;
       if(lib.testkopen(b('eduke.con'),0)!==1 ||
          new TextDecoder().decode(source.G_ConFile()).split('\0')[0]!=='EDUKE.CON')
         throw Error('original CON selector did not find mounted game CON');
       if(new TextDecoder().decode(source.G_DefFile()).split('\0')[0]!=='duke3d.def')
         throw Error('original DEF fallback selection incorrect');
       game.G_UpdateAppTitle(new TextEncoder().encode('E1L1\0'));
       if(!runtime.engineHost.state.title?.includes('E1L1'))throw Error('original title not sent to browser window: '+runtime.engineHost.state.title);
       // A synthetic marker exercises filesystem lookup only, not gameplay assets.
       runtime.fs.mountBytes('/DUKE3D.GRP',new Uint8Array([68,85,75,69]));
       lib.G_AddSearchPaths();
       if(!runtime.fs.searchPaths.some(x=>x.prefix===''))throw Error('app-root was not registered');
       if(runtime.fs.readFile('DUKE3D.GRP')[0]!==68)throw Error('packaged asset lookup failed');
       return {stage:'G_ExtPreInit + G_CleanupSearchPaths + G_SetupCheats + G_UpdateAppTitle',paths,cheatVariant:adapted,passed:true};
      }finally{free();unbind();runtime.close();}
   }"""
   result=await page.evaluate(test,payload)
   assert result['passed'] and not errors,(result,errors)
   report={'format':'original-source-startup-batch-chromium/1','browser':'Chromium',
           'stage':result['stage'],'verified_resource_search_paths':result['paths'],
           'source_cheat_variant':result['cheatVariant'],
           'original_title_function_executed':True,
           'packaged_asset_vfs_lookup_passed':True,
           'embedded_source_modules':nmodules,'page_exceptions':errors,
           'original_gameplay_verified':False,'result':'PASS'}
   outfile=ROOT/'reports/browser-target/startup-batch-chromium.json';outfile.write_text(json.dumps(report,indent=2)+'\n')
   print(json.dumps(report,indent=2))
  finally:await browser.close()
if __name__=='__main__':asyncio.run(main())
