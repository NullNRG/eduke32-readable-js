#!/usr/bin/env python3
"""Chromium acceptance for offline original app_main link audit (never gameplay)."""
import asyncio, json, shutil
from datetime import datetime,timezone
from pathlib import Path
from playwright.async_api import async_playwright

ROOT=Path(__file__).resolve().parents[2]
REPORT=ROOT/'reports/app-main-browser/chromium.json'
async def main():
    errors=[]
    executable=shutil.which('chromium')
    if not executable:raise RuntimeError('Chromium unavailable')
    # Deterministically build a light-weight copy for CDP transport tests.
    # The full offline GRP payload is tested separately in Chromium.
    import sys
    sys.path.insert(0,str(ROOT/'tools'))
    from build_app_main_browser import create
    create((ROOT/'factory-output/source-first/force-recovered').resolve(),
           (ROOT/'dist/app-main-test.html').resolve(),
           (ROOT/'input-data/DUKE3D.GRP').resolve(),include_assets=False)
    async with async_playwright() as p:
        browser=await p.chromium.launch(headless=True,executable_path=executable,args=['--no-sandbox','--disable-gpu-sandbox'])
        try:
            page=await browser.new_page(viewport={'width':1150,'height':850})
            page.on('pageerror',lambda e:errors.append(str(e)))
            await page.set_content((ROOT/'dist/app-main-test.html').read_text(),wait_until='domcontentloaded',timeout=120000)
            audit=await page.evaluate('''() => ({status:__edukeEntry.audit.status, emitted:__edukeEntry.audit.entry_js_export_verified,
              unresolved:__edukeEntry.audit.unresolved.length,moduleCount:__edukeForce.result.boot.moduleCount})''')
            assert audit=={'status':'entry_blocked','emitted':False,'unresolved':149,'moduleCount':151},audit
            await page.locator('#entry-try').click()
            assert 'STOP: original app_main not in compiled JS' in await page.locator('#entry-console').inner_text()
            await page.locator('#grp').set_input_files(str(ROOT/'input-data/DUKE3D.GRP'))
            await page.wait_for_function('window.__edukeForce.result.grp !== null',timeout=30000)
            grp=await page.evaluate('__edukeForce.result.grp')
            assert grp['hasE1L1'] and grp['entries']==456,grp
            await page.locator('#force').click()
            await page.wait_for_function('''() => __edukeForce.result.results.length===151 && !document.querySelector('#force').disabled''',timeout=120000)
            result=await page.evaluate('''() => ({loaded:__edukeForce.result.results.filter(x=>x.status==='loaded').length,
                failed:__edukeForce.result.results.filter(x=>x.status==='failed').length,
                gameModule:__edukeForce.result.results.find(x=>x.module.endsWith('duke3d/src/game.cpp.mjs'))?.status})''')
            if result['loaded']!=151 or result['failed']!=0 or result['gameModule']!='loaded':
                raise AssertionError(result)
            await page.locator('#entry-audit').click()
            rowcount=await page.locator('#entry-rows tr').count()
            assert rowcount==149,rowcount
            assert not errors,errors
            await page.screenshot(path=str(ROOT/'reports/app-main-browser/chromium.png'),full_page=False)
            evidence={'format':'eduke32-app-main-browser-chromium/1','time':datetime.now(timezone.utc).isoformat(),
              'browser':'Chromium','page':'dist/app-main-test.html','app_main_status':audit,'grp':grp,
              'source_modules':result,'dependency_rows':rowcount,
              'browser_page_errors':errors,'gameplay_verified':False,
              'status':'PASS_ENTRY_LINK_DIAGNOSTIC_ONLY'}
            REPORT.parent.mkdir(parents=True,exist_ok=True)
            REPORT.write_text(json.dumps(evidence,indent=2)+'\n')
            print(json.dumps(evidence,indent=2))
        finally:await browser.close()
if __name__=='__main__':asyncio.run(main())
