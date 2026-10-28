"""Execute the actual compiled wm_msgbox against the existing browser adapters."""
import argparse, functools, hashlib, http.server, json, os, threading
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
TARGET='factory-output/source-first/oct20-engine-preinit-browser'
parser=argparse.ArgumentParser();parser.add_argument('--fragment',action='store_true');args=parser.parse_args()
MODULE='factory-output/source-first/oct20-platform-fragments/source/build/src/sdlayer.cpp.mjs' if args.fragment else TARGET+'/source/build/src/sdlayer.cpp.mjs'
class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map={**http.server.SimpleHTTPRequestHandler.extensions_map,'.mjs':'text/javascript'}
    def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(ROOT)))
thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
report={'format':'original-wm-msgbox-browser/1','gameplay_verified':False,'dialogs':[],'page_errors':[]}
try:
    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path=os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'),headless=True)
        page=browser.new_page()
        page.on('pageerror',lambda error:report['page_errors'].append(str(error)))
        def dialog(item):
            report['dialogs'].append({'type':item.type,'message':item.message});item.accept()
        page.on('dialog',dialog)
        page.goto('http://127.0.0.1:'+str(server.server_port)+'/')
        report['heap_string_probe']=page.evaluate('''async()=>{
          const {ABIHeap}=await import('/runtime/abi.mjs');const heap=new ABIHeap();const ptr=heap.writeCString('/home');
          try{return {decoded:heap.readCString(ptr),resizable:heap.buffer.resizable};}
          catch(error){return {error:String(error),resizable:heap.buffer.resizable};}
        }''')
        report['result']=page.evaluate('''async ({target,module})=>{try{
          document.body.innerHTML='<canvas id="screen" width="320" height="200"></canvas>';
          const [{NativeRuntime},c,s,original]=await Promise.all([
            import('/runtime/index.mjs'),import('/'+target+'/browser-abi/libc_provider.mjs'),
            import('/'+target+'/browser-abi/sdl_provider.mjs'),import('/'+module)]);
          let runtime;try{runtime=new NativeRuntime({canvas:document.getElementById('screen'),renderer:'canvas2d'});}
          catch(error){return {error:{name:error.name,message:error.message,stack:error.stack}};}
          const unbindC=c.bindBrowserC(runtime),unbindSDL=s.bindBrowserSDL(runtime);
          const text=value=>new TextEncoder().encode(value+'\\0');
          try{return {returned:original.wm_msgbox(text('EDuke32 original dialog'),text('Value=%d\\t%s'),37,text('source'))};}
          catch(error){return {error:{name:error.name,message:error.message,stack:error.stack}};}
          finally{unbindSDL();unbindC();runtime.close();}
        }catch(error){return {error:{name:error.name,message:error.message,stack:error.stack}};}
        }''',{'target':TARGET,'module':MODULE})
        report['browser_version']=browser.version;browser.close()
    module=ROOT/MODULE
    report['module_sha256']=hashlib.sha256(module.read_bytes()).hexdigest()
    report['passed']=report['result']=={'returned':0} and report['dialogs']==[{'type':'alert','message':'EDuke32 original dialog\nValue=37 source'}] and not report['page_errors']
    (ROOT/('reports/oct20-original-messagebox-fragment-browser.json' if args.fragment else 'reports/oct20-original-messagebox-browser.json')).write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2))
    raise SystemExit(0 if report['passed'] else 2)
finally:
    server.shutdown();server.server_close();thread.join()
