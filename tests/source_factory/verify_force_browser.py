#!/usr/bin/env python3
"""Real Chromium force-exec test of compiled original-source modules and real GRP.

This is NOT Duke gameplay acceptance. A missing original app_main must visibly fail.
"""
import asyncio, json, shutil, sys
from datetime import datetime, timezone
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[2]
HTML=ROOT/'dist/force-test.html'
DATA=ROOT/'input-data/DUKE3D.GRP'
REPORT=ROOT/'reports/force-browser/chromium.json'
async def main():
    chromium=shutil.which('chromium')
    if not chromium:raise RuntimeError('Chromium missing')
    if not HTML.is_file():raise RuntimeError('Run python tools/build_force_browser.py first')
    errors=[]
    async with async_playwright() as pw:
        browser=await pw.chromium.launch(executable_path=chromium,headless=True,args=['--no-sandbox','--disable-gpu-sandbox'])
        try:
            page=await browser.new_page(viewport={'width':1100,'height':850},accept_downloads=True)
            page.on('pageerror',lambda e:errors.append(str(e)))
            await page.set_content(HTML.read_text(),wait_until='domcontentloaded',timeout=90000)
            initial=await page.evaluate('''() => ({count:__edukeForce.result.boot.moduleCount, entry:__edukeForce.result.boot.entryEmitted})''')
            assert initial['count']==151,initial
            await page.locator('#boot').click()
            await page.wait_for_function('window.__edukeForce.result.errors.some(e => e.phase === "app_main")')
            assert not initial['entry'],'Unexpected original startup availability requires revisiting test assertions'
            await page.locator('#grp').set_input_files(str(DATA))
            await page.wait_for_function('window.__edukeForce.result.grp !== null',timeout=20000)
            grp=await page.evaluate('__edukeForce.result.grp')
            assert grp['entries']>100,grp
            assert grp['hasE1L1'] is True,grp
            await page.locator('#force').click()
            await page.wait_for_function('!document.querySelector("#force").disabled && window.__edukeForce.result.results.length===151',timeout=120000)
            source=await page.evaluate('''() => ({loaded:__edukeForce.result.results.filter(x=>x.status==='loaded').length,
                failed:__edukeForce.result.results.filter(x=>x.status==='failed').length,
                game:__edukeForce.result.results.find(x=>x.module.endsWith('duke3d/src/game.cpp.mjs')),
                failedModules:__edukeForce.result.results.filter(x=>x.status==='failed')})''')
            assert source['loaded']+source['failed']==151,source
            assert source['loaded']>0,source
            assert source['game'] is not None,source
            await page.screenshot(path=str(ROOT/'reports/force-browser/chromium.png'),full_page=False)
            data={'format':'eduke32-force-browser-chromium/1','date':datetime.now(timezone.utc).isoformat(),
                'browser':'Chromium','file_html_verified':str(HTML.relative_to(ROOT)),
                'source_modules_attempted':151,**source,'grp':grp,
                'original_app_main_absent':not initial['entry'],
                'original_gameplay_verified':False,
                'browser_exceptions':errors,
                'status':'PASS_SOURCE_DIAGNOSTIC_ONLY'}
            REPORT.parent.mkdir(parents=True,exist_ok=True)
            REPORT.write_text(json.dumps(data,indent=2)+'\n')
            print(json.dumps(data,indent=2))
            assert not errors,errors
        finally:await browser.close()
if __name__=='__main__':asyncio.run(main())
