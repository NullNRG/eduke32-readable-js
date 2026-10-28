"""Browser integration: source ESM imports and original compiled CRC32."""
import pathlib,sys
from playwright.sync_api import sync_playwright
path=pathlib.Path(sys.argv[1]) if len(sys.argv)>1 else pathlib.Path(__file__).resolve().parents[2]/'factory-output/source-compiler-runtime.html'
with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader'])
    page=browser.new_page()
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.set_content(path.read_text(),wait_until='domcontentloaded',timeout=20000)
    page.wait_for_function("document.querySelector('#status').textContent.includes('CRC32=')",timeout=10000)
    status=page.locator('#status').inner_text()
    print(status)
    assert 'CRC32=cbf43926' in status
    assert '11 original C++ functions linked' in status
    assert not errors,errors
    browser.close()
