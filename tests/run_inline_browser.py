import sys,time
from pathlib import Path
from playwright.sync_api import sync_playwright
path=Path(sys.argv[1]) if len(sys.argv)>1 else Path(__file__).resolve().parents[1]/'dist/duke-only.html'
print('html size',path.stat().st_size,flush=True)
html=path.read_text()
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-webgl','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader','--disable-web-security','--disable-features=BlockInsecurePrivateNetworkRequests'])
 page=b.new_page(viewport={'width':1024,'height':768})
 errors=[];page.on('pageerror',lambda e: (errors.append(str(e)),print('pageerror',str(e),flush=True)));page.on('console',lambda m:print('console',m.type,m.text[:300],flush=True) if m.type=='error' else None)
 print('starting set_content',flush=True)
 page.set_content(html,wait_until='domcontentloaded',timeout=60000)
 print('loaded',flush=True)
 try:
  page.wait_for_function('globalThis.EDukeCompiledSourceRuntime?.linker?.exports?.has("Bcrc32")===true',timeout=10000)
  print('source bridge:',page.evaluate('EDukeCompiledSourceRuntime.manifest()'),flush=True)
 except Exception as err: print('original-source module bridge unavailable:',str(err),flush=True)
 try:
  page.wait_for_function('document.querySelector("#playBtn").disabled===false',timeout=40000)
  print('ready:',page.locator('#loader').inner_text(),flush=True)
  print('options',page.locator('#levelSelect option').count(),flush=True)
  page.locator('#playBtn').click(timeout=20000)
  page.wait_for_timeout(1000)
  print('running?',page.evaluate('running'),'meshes',page.evaluate('renderer?.staticMeshes?.length'),'player',page.evaluate('player && [player.x,player.y,player.sector]'),flush=True)
  page.screenshot(path=str(path.parent/'browser-check.png'))
  a=page.evaluate('player&&[player.x,player.y]');page.keyboard.down('w');page.wait_for_timeout(800);page.keyboard.up('w');c=page.evaluate('player&&[player.x,player.y]');print('moved:',a,'=>',c)
 except Exception as e:print('test failure',repr(e),'loader:',page.locator('#loader').inner_text(),flush=True)
 print('errors',errors,flush=True)
 b.close()
