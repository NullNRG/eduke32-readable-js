from pathlib import Path
from playwright.sync_api import sync_playwright
URL=Path(__file__).resolve().parents[1]/'dist/duke-only.html'
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--disable-web-security'])
 page=browser.new_page(viewport={'width':1280,'height':720},device_scale_factor=1)
 errors=[];page.on('pageerror',lambda e: errors.append(str(e)));page.on('console',lambda x: print('console',x.type,x.text[:250]) if x.type=='error' else None)
 page.goto('http://127.0.0.1:8793/dist/duke-only.html',wait_until='domcontentloaded',timeout=60000)
 page.wait_for_function("document.querySelector('#playBtn').disabled===false",timeout=60000)
 print('select:',page.locator('#levelSelect').locator('option').count(),page.locator('#loader').inner_text())
 page.locator('#playBtn').click(timeout=10000)
 page.wait_for_timeout(1500)
 print('visible hud',page.locator('#hud').is_visible(),'running',page.evaluate('running'),'sector',page.evaluate('player?.sector'),'batch',page.evaluate('renderer?.staticMeshes?.length'))
 page.screenshot(path='/mnt/data/eduke_js_work/port/dist/screenshot.png')
 page.keyboard.down('w');page.wait_for_timeout(650);page.keyboard.up('w');print('position',page.evaluate('[player.x,player.y,player.eye]'))
 print('errors:',errors)
 browser.close()
