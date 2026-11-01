"""Verify original clip-map initialization mutates its actual owning storage."""
import functools,hashlib,http.server,json,os,sys,threading
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'tools'))
from recover_browser_component import OUT,component_lock
from source_fragment_storage import audit
class Quiet(http.server.SimpleHTTPRequestHandler):
    extensions_map={**http.server.SimpleHTTPRequestHandler.extensions_map,'.mjs':'text/javascript'}
    def log_message(self,*args):pass
    def do_GET(self):
        if self.path=='/__original_clip_probe__':
            body=b'<!doctype html><title>Original clip storage diagnostic</title><link rel="icon" href="data:,">'
            self.send_response(200);self.send_header('Content-Length',str(len(body)));self.end_headers();self.wfile.write(body)
        else:super().do_GET()
def main():
    assert not any(row['source']=='source/build/src/clip.cpp' for row in audit(OUT))
    class Server(http.server.HTTPServer):request_queue_size=128
    server=Server(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)))
    threading.Thread(target=server.serve_forever,daemon=True).start()
    errors=[]
    try:
        from playwright.sync_api import sync_playwright
        with sync_playwright() as pw:
            browser=pw.chromium.launch(executable_path=os.environ['EDUKE_CHROMIUM_EXECUTABLE'],headless=True)
            page=browser.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
            page.goto('http://127.0.0.1:'+str(server.server_port)+'/__original_clip_probe__')
            result=page.evaluate('''async base=>{
              const {NativeRuntime}=await import('/runtime/index.mjs');
              const {sourceByteView}=await import('/runtime/source_bytes.mjs');
              const runtime=new NativeRuntime({memoryBytes:16<<20});runtime.bindSourceMemory();
              const releaseC=(await import(base+'/browser-abi/libc_provider.mjs')).bindBrowserC(runtime);
              try{
                (await import(base+'/source/build/src/baselayer.cpp.mjs')).engineSetupAllocator();
                const clip=await import(base+'/source/build/src/clip.cpp.mjs');
                const pic=sourceByteView(clip.pictoidx),info=sourceByteView(clip.clipmapinfo);
                if(!pic?.length||!info?.length)throw Error('Original clipping owners have no native storage');
                // Differential state fixtures are not game initialization.
                pic.fill(37);info.fill(83);
                clip.engineInitClipMaps();
                if(!pic.every(v=>v===255)||!info.every(v=>v===0))throw Error('Original clipping fragment writes detached state');
                if(clip.numclipmaps!==0||clip.numclipsects!==0)throw Error('Original clipping counts were not reset');
                for(const name of ['sectq','sectoidx','tempictoidx','loadsector','loadwall','loadwallinv','loadsprite'])
                  if(clip[name]!==null)throw Error('Original clipping pointer was not cleared: '+name);
                return {original_function:'engineInitClipMaps',actual_owner_bytes_verified:pic.length+info.length,
                  detached_global_copies:false,gameplay_verified:false};
              }finally{releaseC();runtime.close();}
            }''','/'+OUT.relative_to(ROOT).as_posix())
            assert not errors,errors
            version=browser.version;browser.close()
    finally:server.shutdown();server.server_close()
    report={'format':'original-clip-storage-browser-proof/1','passed':True,**result,
        'browser_version':version,'page_errors':errors,
        'artifacts':{p.relative_to(ROOT).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in OUT.rglob('*.mjs')},
        'original_engine_startup_verified':False}
    (ROOT/'reports/nov01-original-clip-storage.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps({k:v for k,v in report.items() if k!='artifacts'},indent=2))
if __name__=='__main__':
    with component_lock():main()
