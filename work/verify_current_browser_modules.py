import functools,hashlib,http.server,json,os,threading
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
target=root/'factory-output/source-first/browser-target'
modules=sorted(target.glob('source/**/*.mjs'))
class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map={**http.server.SimpleHTTPRequestHandler.extensions_map,'.mjs':'text/javascript'}
    def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(root)))
thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
errors=[]
try:
    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path=os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'),headless=True)
        page=browser.new_page();page.on('pageerror',lambda err:errors.append(str(err)))
        page.goto('http://127.0.0.1:'+str(server.server_port)+'/')
        rows=page.evaluate('''async paths=>{
            const results=[];
            for(const path of paths)try{const mod=await import(path);results.push({path,passed:true,exports:Object.keys(mod).length});}
            catch(error){results.push({path,passed:false,error:String(error),stack:error.stack});}
            return results;
        }''',['/'+m.relative_to(root).as_posix() for m in modules])
        for m,row in zip(modules,rows):row['sha256']=hashlib.sha256(m.read_bytes()).hexdigest()
        header=page.evaluate('''async()=>{
            const s=await import('/factory-output/source-first/browser-target/source/build/include/clockticks.hpp.mjs');
            const C=s.ClockTicks(),ctor='__cxx_construct_bab234845792158a';
            return {present:typeof C==='function',constructorFactories:Object.getOwnPropertyNames(C).filter(n=>n.startsWith('__cxx_construct_')).length};
        }''')
        report={'format':'original-source-browser-module-evaluation/1','browser_version':browser.version,
            'attempted':len(rows),'passed':sum(r['passed'] for r in rows),'failed':sum(not r['passed'] for r in rows),
            'header_provider':header,'page_exceptions':errors,'modules':rows,
            'original_app_main_executed':False,'original_gameplay_verified':False}
        browser.close()
    (root/'reports/oct15-current-browser-modules.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps({k:v for k,v in report.items() if k!='modules'},indent=2))
    assert not report['failed'] and not errors,[(r['path'],r.get('error')) for r in rows if not r['passed']]
finally:server.shutdown();server.server_close();thread.join()
