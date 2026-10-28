#!/usr/bin/env python3
"""Real Chromium ES-module linkage smoke test, never a game-play claim."""
from pathlib import Path
from urllib.parse import unquote,urlparse
import json
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2]
TARGET=ROOT/'factory-output/source-first/browser-target'
BASE='https://sourcefactory.invalid'
issues=[]

def serve(route):
    path=unquote(urlparse(route.request.url).path)
    if path=='/':
        route.fulfill(status=200,content_type='text/html',body='<html><body>Source module link verification</body></html>')
        return
    target=(TARGET/path.lstrip('/')).resolve()
    if not target.is_relative_to(TARGET.resolve()) or not target.is_file():
        issues.append('Missing resource '+path)
        route.fulfill(status=404,body='No verified source module')
        return
    route.fulfill(status=200,content_type='text/javascript; charset=utf-8',headers={'Access-Control-Allow-Origin':'*'},body=target.read_bytes())

with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    try:
        page=browser.new_page()
        page.on('pageerror',lambda error:issues.append(str(error)))
        page.route('https://sourcefactory.invalid/**',serve)
        page.goto('about:blank')
        result=page.evaluate('''async () => {
            const paths=['https://sourcefactory.invalid/source/duke3d/src/game.cpp.mjs',
                         'https://sourcefactory.invalid/source/build/src/pragmas.cpp.mjs',
                         'https://sourcefactory.invalid/source/audiolib/src/driver_sdl.cpp.mjs'];
            const loaded=[];
            for (const path of paths) {
                const mod=await import(path);
                loaded.push({path,exports:Object.keys(mod).length,
                    hasGametype:typeof mod.G_CheckGametype==='function'});
            }
            return loaded;
        }''')
        assert result[0]['exports']>=870 and result[0]['hasGametype'],result
        assert result[1]['exports']>=29 and result[2]['exports']>=29,result
        assert not issues,issues
    finally:browser.close()
report={'format':'sourcefirst-integrated-chromium/1','status':'PASS',
        'moduleImportResults':result,'browserPageErrors':issues,
        'originalAppMainLinked':False,'originalGameplayVerified':False}
out=ROOT/'reports/browser-target/integrated-source-chromium.json';out.parent.mkdir(parents=True,exist_ok=True)
out.write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
