"""Use the actual GRP file selector and two fresh engine sessions in Chromium."""
import functools,hashlib,json,os,threading
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,HTTPServer
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
class Quiet(SimpleHTTPRequestHandler):
 extensions_map={**SimpleHTTPRequestHandler.extensions_map,'.mjs':'text/javascript'}
 def log_message(self,*args):pass
class Server(HTTPServer):request_queue_size=128
server=Server(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start()
requests=[];errors=[];results=[]
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path=os.environ['EDUKE_CHROMIUM_EXECUTABLE'],headless=True)
  page=browser.new_page(viewport={'width':1120,'height':1000});page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('request',lambda r:requests.append({'method':r.method,'url':r.url}))
  page.goto(f'http://127.0.0.1:{server.server_port}/engine-player.html')
  page.locator('#grp').set_input_files(ROOT/'input-data/DUKE3D.GRP')
  page.wait_for_function("!document.querySelector('#start').disabled")
  names=page.locator('#map option').evaluate_all('(options)=>options.map(o=>o.value)')
  assert 'E1L1.MAP' in names and 'E1L2.MAP' in names
  for map_name in ['E1L1.MAP','E1L2.MAP']:
   page.locator('#map').select_option(map_name)
   page.evaluate('window.__ENGINE_LEVEL_RESULT__=null')
   page.locator('#start').click()
   page.wait_for_function('window.__ENGINE_LEVEL_RESULT__!==null',timeout=180000)
   result=page.evaluate('window.__ENGINE_LEVEL_RESULT__')
   assert result['component_passed'],result.get('error')
   state=result['engine_initialization'];assert state['original_mask_renderer']['executed']
   assert state['original_repeat_presentation']['changed_pixels']==0
   result['engine_initialization'].pop('rooms_only_capture_png',None)
   results.append({'map':map_name,'passed':True,'state':state,'trace':result['trace']})
   print('PASS original launcher',map_name,flush=True)
   page.screenshot(path=str(ROOT/'reports/evidence'/('nov12-grp-launcher-'+map_name.lower().replace('.map','')+'.png')),full_page=True)
  assert not errors,errors
  assert all(r['method']=='GET' and r['url'].startswith(f'http://127.0.0.1:{server.server_port}/') and '/input-data/' not in r['url'] for r in requests)
  browser.close()
finally:server.shutdown();server.server_close()
report={'format':'original-engine-grp-launcher/1','passed':True,'selected_maps':names,'runs':results,'browser_errors':errors,
 'archive_uploaded':False,'remote_network_requests':False,'gameplay_verified':False,
 'launcher_sha256':hashlib.sha256((ROOT/'engine-player.html').read_bytes()).hexdigest(),
 'runner_sha256':hashlib.sha256((ROOT/'engine-level-runner.mjs').read_bytes()).hexdigest()}
(ROOT/'reports/nov12-grp-launcher.json').write_text(json.dumps(report,indent=2)+'\n')
print('PASS: local file selection, two fresh original engine sessions, no asset upload or remote requests; not gameplay')
