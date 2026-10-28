import base64,hashlib,json,os,subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];build=ROOT/'factory-output/source-first/oct16-array-members-recovery';r=json.loads((build/'recovery-report.json').read_text());batch=next(b for b in r['batch_results'] if 'source/duke3d/src/global.cpp' in b['sources']);module=(build/batch['manifest']).parent/'source/duke3d/src/global.cpp.mjs'
js='''async url=>{const m=await import(url);const pointer=m.g_player;if(pointer.__cPointer!==true||!pointer.array||pointer.offset%pointer.stride)throw new Error('Original player pointer identity differs');const players=pointer.buffer.slice(pointer.offset/pointer.stride);if(!Array.isArray(players)||players.length!==16)throw new Error('Original player storage extent differs');if(players.some(p=>p.ps!==null))throw new Error('Original static player pointer slots are not zero');return {evaluated:true,exports:Object.keys(m).length,original_player_slots:players.length,original_player_pointers_zero:true,gameplayVerified:false};}'''
command='console.log(JSON.stringify(await ('+js+')('+json.dumps(module.as_uri())+')));'
p=subprocess.run(['node','--input-type=module','-e',command],cwd=ROOT,capture_output=True,text=True,timeout=90);assert p.returncode==0,p.stderr;node=json.loads(p.stdout)
with sync_playwright() as playwright:
 browser=playwright.chromium.launch(executable_path=os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'),headless=True);page=browser.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 observed=page.evaluate(js,'data:text/javascript;base64,'+base64.b64encode(module.read_bytes()).decode());assert observed==node and not errors,(observed,node,errors);version=browser.version;browser.close()
report={'format':'original-global-cpp-module-evaluation/1','module':str(module.relative_to(ROOT)),'module_sha256':hashlib.sha256(module.read_bytes()).hexdigest(),'compiler_fingerprint':batch['compiler_fingerprint'],'node':node,'chromium':observed,'browser_version':version,'exceptions':errors,'passed':True,'gameplay_verified':False}
(ROOT/'reports/oct16-original-global-module-evaluation.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
