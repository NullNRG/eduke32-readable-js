from playwright.sync_api import sync_playwright
import json,time,sys
path=sys.argv[1] if len(sys.argv)>1 else '/mnt/data/EDuke32_Stage11_index.html'
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--js-flags=--max-old-space-size=2048'])
 page=browser.new_page(viewport={'width':1050,'height':850})
 errors=[]
 page.on('pageerror',lambda err: errors.append(str(err)))
 try:
  page.goto('file://'+path,wait_until='domcontentloaded',timeout=30000)
  page.wait_for_timeout(700)
  print('BEFORE:',page.locator('#status').inner_text(timeout=10000))
  print('IMPORTS_LENGTH:',page.locator('script[type="importmap"]').evaluate('(el)=>el.textContent.length'))
  page.locator('#start').click(timeout=20000)
  page.wait_for_timeout(2500)
  print('AFTER:',page.locator('#status').inner_text(timeout=10000))
  print('LOG_END:',page.locator('#runtime-output').inner_text(timeout=10000)[-3500:])
  print('ERRORS:',errors[:8]);page.screenshot(path='/mnt/data/EDuke32_Stage11_Browser.png',timeout=10000)
 except Exception as e:
  print('BROWSER_FAILURE',type(e).__name__,str(e)[:1500]);print('ERRORS:',errors[:8]);sys.exit(2)
 finally:browser.close()
