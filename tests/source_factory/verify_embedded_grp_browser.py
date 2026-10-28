#!/usr/bin/env python3
"""Verify the exact packed retail GRP embedded in standalone app-main HTML in Chromium."""
import asyncio, base64, hashlib, json, shutil, gzip, re
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[2]
async def main():
    text=(ROOT/'dist/app-main.html').read_text()
    match=re.search(r'<script type="application/x-duke-grp-gzip" id="embedded-duke-grp">(.*?)</script>',text,re.S)
    assert match,'GRP payload missing'
    encoded=match.group(1)
    source=(ROOT/'input-data/DUKE3D.GRP').read_bytes();expected=hashlib.sha256(source).hexdigest()
    assert gzip.decompress(base64.b64decode(encoded))==source,'Offline payload differs from original source'
    browser_exe=shutil.which('chromium')
    async with async_playwright() as p:
        browser=await p.chromium.launch(headless=True,executable_path=browser_exe,args=['--no-sandbox','--disable-gpu-sandbox'])
        try:
            page=await browser.new_page()
            await page.set_content('<!doctype html><title>GRP packed embedded test</title><script id="data" type="text/plain">'+encoded+'</script>')
            actual=await page.evaluate('''async () => {
              const encoded=document.querySelector('#data').textContent;
              const raw=atob(encoded), packed=new Uint8Array(raw.length);
              for(let i=0;i<raw.length;i++)packed[i]=raw.charCodeAt(i);
              const bytes=new Uint8Array(await new Response(new Blob([packed]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer());
              return {bytes:bytes.length,header:new TextDecoder().decode(bytes.subarray(0,12))};
            }''')
            assert actual=={'bytes':len(source),'header':'KenSilverman'},actual
            out=ROOT/'reports/app-main-browser/embedded-grp-chromium.json';out.parent.mkdir(parents=True,exist_ok=True)
            out.write_text(json.dumps({'status':'PASS_ORIGINAL_GRP_EMBEDDED_IN_CHROMIUM','full_app_main_html_rendered':False,'original_grp_python_sha256':expected,**actual},indent=2)+'\n')
            print(json.dumps(actual,indent=2))
        finally:await browser.close()
if __name__=='__main__':asyncio.run(main())
