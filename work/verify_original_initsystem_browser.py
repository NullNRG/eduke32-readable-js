"""Run original compiled SDL startup; attest actual owner state and host effects."""
import functools,hashlib,http.server,json,os,threading
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
TARGET='factory-output/source-first/oct20-engine-preinit-browser'
SOURCE='source/build/src/sdlayer.cpp'
manifest=json.loads((ROOT/TARGET/(SOURCE+'.manifest.json')).read_text())
private=next(row['private_storage']['binding'] for row in manifest['definitions'] if row['name']=='m_initprintf')
class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map={**http.server.SimpleHTTPRequestHandler.extensions_map,'.mjs':'text/javascript'}
    def log_message(self,*args):pass
    def do_GET(self):
        if self.path=='/':
            body=b'<!doctype html><title>Original startup verification</title><link rel="icon" href="data:,">'
            self.send_response(200);self.send_header('Content-Type','text/html');self.send_header('Content-Length',str(len(body)));self.end_headers();self.wfile.write(body)
        else:super().do_GET()
class Server(http.server.ThreadingHTTPServer):
    request_queue_size=128
server=Server(('127.0.0.1',0),functools.partial(Handler,directory=str(ROOT)))
thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
report={'gameplay_verified':False,'page_errors':[],'console':[]}
try:
    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path=os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'),headless=True)
        page=browser.new_page();page.on('pageerror',lambda error:report['page_errors'].append(str(error)))
        page.on('console',lambda message:report['console'].append({'type':message.type,'text':message.text}))
        page.goto(f'http://127.0.0.1:{server.server_port}/')
        report['result']=page.evaluate('''async ({target,privateBinding})=>{try{
          document.body.innerHTML='<canvas id="screen" width="320" height="200"></canvas>';
          const [{NativeRuntime},c,s,original,base,compat]=await Promise.all([
            import('/runtime/index.mjs'),import('/'+target+'/browser-abi/libc_provider.mjs'),
            import('/'+target+'/browser-abi/sdl_provider.mjs'),import('/'+target+'/source/build/src/sdlayer.cpp.mjs'),
            import('/'+target+'/source/build/src/baselayer.cpp.mjs'),
            import('/'+target+'/source/build/src/compat.cpp.mjs')]);
          const runtime=new NativeRuntime({canvas:document.getElementById('screen'),renderer:'canvas2d'});
          const unbindC=c.bindBrowserC(runtime),unbindSDL=s.bindBrowserSDL(runtime);
          try{
            const address=original[privateBinding]();address.value=37;
            const before=original.m_initprintf;
            const returned=original.initsystem();
            const first={returned,before,mutex:original.m_initprintf,sameAddress:address===original[privateBinding](),
              videoInitialized:runtime.sdl.symbols.SDL_WasInit(32)===32,
              timerInitialized:runtime.sdl.symbols.SDL_WasInit(1)===1,
              cpuBackend:runtime.engineHost.state.cpuBackend,timerHz:runtime.engineHost.state.timerHz,
              title:document.title,platformTitle:runtime.engineHost.state.title,
              frameplace:String(original.frameplace),lockcount:original.lockcount,displays:base.g_numdisplays};
            first.secondReturned=original.initsystem();
            const decode=pointer=>{
              if(pointer===null||pointer===0)return null;
              const bytes=ArrayBuffer.isView(pointer)?pointer:new Uint8Array(pointer.buffer,pointer.offset,pointer.upper-pointer.offset);
              const end=bytes.indexOf(0);if(end<0)throw Error('unterminated original source string');
              return new TextDecoder().decode(bytes.subarray(0,end));
            };
            first.displayName=decode(original.videoGetDisplayName(0));
            first.invalidDisplayName=decode(original.videoGetDisplayName(9));
            const bytes=new TextEncoder().encode(' ,alpha,,beta,gamma, \\0');
            const delimiters=new TextEncoder().encode(' ,\\0'),next={__cReference:true,value:null};
            const tokens=[];let token=compat.Bstrtoken(bytes,delimiters,next,1);
            for(let i=0;token!==null&&i<8;i++){
              tokens.push(decode(token));token=compat.Bstrtoken(null,delimiters,next,1);
            }
            if(JSON.stringify(tokens)!==JSON.stringify(['alpha','beta','gamma'])||next.value!==null)
              throw Error('original tokenizer state mismatch');
            first.originalTokens=tokens;
            return first;
          }finally{unbindSDL();unbindC();runtime.close();}
        }catch(error){return {error:{name:error.name,message:error.message,stack:error.stack}};}}
        ''',{'target':TARGET,'privateBinding':private})
        report['browser_version']=browser.version;browser.close()
    r=report['result']
    report['passed']=(not report['page_errors'] and not any(row['type']=='error' for row in report['console']) and r.get('returned')==0 and r.get('secondReturned')==0
        and r.get('before')==37 and r.get('mutex')==0 and r.get('sameAddress')
        and r.get('videoInitialized') and r.get('timerInitialized') and r.get('timerHz')==120
        and r.get('cpuBackend')=='native-js' and r.get('frameplace')=='0' and r.get('lockcount')==0
        and r.get('displays',0)>0 and bool(r.get('title')) and r.get('title')==r.get('platformTitle')
        and r.get('displayName')=='Canvas Display' and r.get('invalidDisplayName') is None
        and r.get('originalTokens')==['alpha','beta','gamma'])
    report['original_module_sha256']=hashlib.sha256((ROOT/TARGET/(SOURCE+'.mjs')).read_bytes()).hexdigest()
    report['compat_module_sha256']=hashlib.sha256((ROOT/TARGET/'source/build/src/compat.cpp.mjs').read_bytes()).hexdigest()
    report['source_fragment']=next(row for row in manifest['module_fragments'] if 'initsystem' in row['exports'])
    (ROOT/'reports/oct23-original-initsystem-browser.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2));assert report['passed']
finally:server.shutdown();server.server_close();thread.join()
