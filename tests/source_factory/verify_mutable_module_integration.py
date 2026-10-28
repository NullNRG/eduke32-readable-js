#!/usr/bin/env python3
"""Verify integrated original TU exports and a SINGLE shared mutable game state.

This is source-module linkage proof, NOT a claim of game boot or gameplay.
"""
import json, pathlib, subprocess
from playwright.sync_api import sync_playwright
from urllib.parse import unquote,urlparse
ROOT=pathlib.Path(__file__).resolve().parents[2]
TARGET=ROOT/'factory-output/source-first/browser-target'
modules=['build/src/sdlayer.cpp.mjs','duke3d/src/cheats.cpp.mjs','duke3d/src/common.cpp.mjs']
for rel in modules:
    path=TARGET/'source'/rel
    subprocess.run(['node','--check',str(path)],check=True,capture_output=True,text=True,timeout=15)
    # No historical shard is imported, which would duplicate C++ static state.
    assert 'SOURCEFACTORY_INTEGRATED_TU' in path.read_text()
    assert '_source_legacy_' not in path.read_text()
issues=[]
def respond(route):
    url_path=unquote(urlparse(route.request.url).path)
    if url_path=='/':
        route.fulfill(status=200,content_type='text/html',body='<html>Integrated original source TU</html>');return
    p=(TARGET/url_path.lstrip('/')).resolve()
    if not p.is_relative_to(TARGET.resolve()) or not p.is_file():
        issues.append('missing dependency '+url_path)
        route.fulfill(status=404,body='unresolved');return
    route.fulfill(status=200,content_type='text/javascript; charset=utf-8',body=p.read_bytes())
with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    try:
        page=browser.new_page()
        page.on('pageerror',lambda exc:issues.append(str(exc)))
        page.route('https://sourcefactory.invalid/**',respond)
        page.goto('about:blank')
        result=page.evaluate('''async () => {
          const host='https://sourcefactory.invalid/source/';
          const [base,cheats,common]=await Promise.all([
            import(host+'build/src/sdlayer.cpp.mjs'),
            import(host+'duke3d/src/cheats.cpp.mjs'),
            import(host+'duke3d/src/common.cpp.mjs')]);
          if (typeof base.initsystem!=='function'||typeof base.videoEndDrawing!=='function')throw Error('Missing old/new SDL functions');
          if (typeof common.G_ExtPreInit!=='function'||typeof common.G_DefaultConFile!=='function')throw Error('Missing old/new VFS functions');
          if (typeof cheats.G_SetupCheats!=='function'||!cheats.CheatStrings||Object.keys(cheats).length<790)throw Error('Missing old/new cheat definitions');
          const commonCell=common.__cxx_global_cell_c0e288040dbf9a805036c27d();
          const originalFlag=commonCell.value;
          const array=cheats.CheatStrings, oldValue=Array.from(array[0]);
          try{
            commonCell.value=8;
            cheats.G_SetupCheats();
            if(String.fromCharCode(...array[0]).split('\\0')[0]!=='2god')throw Error('Original G_SetupCheats changed a duplicate global');
          }finally{commonCell.value=originalFlag;array[0].set(oldValue)}
          return {sdlExports:Object.keys(base).length,cheatExports:Object.keys(cheats).length,commonExports:Object.keys(common).length,
                  sharedCheatString:'2god',hasOriginalSDL:true,hasOriginalVFS:true};
        }''')
        assert not issues,issues
        assert result['sdlExports']>=97 and result['cheatExports']>=791 and result['commonExports']>=50,result
    finally:
        browser.close()
report={'format':'eduke32-original-integrated-tu-parity/1','status':'PASS','browser':'Chromium',
        'integratedModules':modules,'result':result,'pageErrors':issues,'originalGameplayVerified':False}
out=ROOT/'reports/browser-target/original-integrated-tu-chromium.json';out.parent.mkdir(parents=True,exist_ok=True)
out.write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
