"""Execute installed original console mutation code with explicit test storage.

Does not initialize the real console, allocate its buffers, or attest gameplay.
No original function imports are replaced; the fixture supplies registered
variable data that full OSD_Init/OSD_RegisterCvar cannot yet construct.
"""
import functools,hashlib,http.server,json,os,threading
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
TARGET='factory-output/source-first/oct20-engine-preinit-browser'
class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map={**http.server.SimpleHTTPRequestHandler.extensions_map,'.mjs':'text/javascript'}
    def log_message(self,*args):pass
    def do_GET(self):
        if self.path=='/fixture.html':
            payload=b'<!doctype html><title>Original console function verification</title>'
            self.send_response(200);self.send_header('Content-Type','text/html')
            self.send_header('Content-Length',str(len(payload)));self.end_headers();self.wfile.write(payload)
        elif self.path=='/favicon.ico':self.send_response(204);self.end_headers()
        else:super().do_GET()
class Server(http.server.ThreadingHTTPServer):request_queue_size=128
server=Server(('127.0.0.1',0),functools.partial(Handler,directory=str(ROOT)))
thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
report={'original_gameplay_verified':False,'original_console_initialization_verified':False,
        'native_original_console_comparison':False,'fixture_storage':'Explicit source pointer/reference ABI and test-populated hash table',
        'page_errors':[],'console':[]}
try:
    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path=os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'),headless=True)
        page=browser.new_page();page.on('pageerror',lambda e:report['page_errors'].append(str(e)))
        page.on('console',lambda m:report['console'].append({'type':m.type,'text':m.text}))
        page.goto(f'http://127.0.0.1:{server.server_port}/fixture.html')
        report['result']=page.evaluate('''async target=>{try{
          const [{NativeRuntime},c,osd]=await Promise.all([import('/runtime/index.mjs'),
            import('/'+target+'/browser-abi/libc_provider.mjs'),import('/'+target+'/source/build/src/osd.cpp.mjs')]);
          const runtime=new NativeRuntime(),unbind=c.bindBrowserC(runtime);
          const cell=osd.__cxx_global_cell_5a97be12fac9e104b96ea90d(),old=cell.value;
          const address=osd.__cxx_private_cell_a920b40f756adfb47f87522c();
          const table=address.value,previous={v:table.__cxx_anonymous_0.prime.v,
            magic:table.__cxx_anonymous_0.prime.d.magic,more:table.__cxx_anonymous_0.prime.d.more,items:table.items};
          try{
            const text=s=>new TextEncoder().encode(s+'\\0'),name=text('fixture');
            table.__cxx_anonymous_0.prime.v=1;table.__cxx_anonymous_0.prime.d.magic=0;table.__cxx_anonymous_0.prime.d.more=0;
            table.items=[{string:name,key:0n,next:null}];
            // Saved OSD_ParsingScript uses the original record-reference ABI.
            const state={cvars:[],execdepth:1};cell.value={__cReference:true,value:state};
            let checks=0;
            for(let i=0;i<64;i++)for(const type of [1,2,4,8,16,32]){
              const input=type===16?'original-'+i:String(i-20+0.25);
              const storage=type===1?new Float32Array(1):type===32?new Float64Array(1):
                type===4?new Uint32Array(1):type===16?new Uint8Array(8):new Int32Array(1);
              const field=type===1?'f':type===32?'d':type===4?'u32':type===16?'string':'i32';
              const data={name,desc:text('fixture description'),flags:type,min:type===4?0:-10,max:type===16?8:20,
                __cxx_anonymous_2:{[field]:storage}};
              state.cvars=[{pData:data}];
              const code=osd.osdcmd_cvar_set({name,numparms:1,parms:[text(input)]});
              const value=type===16?new TextDecoder().decode(storage.subarray(0,7)):storage[0];
              const expected=type===16?input.slice(0,7):type===4?(i<19?20:Math.min(Math.trunc(i-20+0.25),20)):
                type===1||type===32?Math.max(-10,Math.min(i-20+0.25,20)):
                type===8?Number(Math.max(-10,Math.min(Math.trunc(i-20+0.25),20))!==0):
                Math.max(-10,Math.min(Math.trunc(i-20+0.25),20));
              if(code!==0||value!==expected||data.flags!==(type|8192)||type===16&&storage[7]!==0)
                throw Error('Original cvar mutation mismatch: '+JSON.stringify({i,type,value,expected,flags:data.flags,code}));
              checks++;
            }
            const storage=new Int32Array([17]);
            state.cvars=[{pData:{name,desc:text('read only'),flags:2|64,min:0,max:20,__cxx_anonymous_2:{i32:storage}}}];
            if(osd.osdcmd_cvar_set({name,numparms:1,parms:[text('1')]})!==0||storage[0]!==17||state.cvars[0].pData.flags!==66)
              throw Error('Original read-only console variable changed');
            if(address!==osd.__cxx_private_cell_a920b40f756adfb47f87522c())throw Error('Original table address changed');
            return {mutation_cases:checks,read_only_case:true,original_hash_lookup_executed:true,
              original_scalar_and_string_mutation_executed:true,shared_table_identity:true};
          }finally{
            cell.value=old;table.__cxx_anonymous_0.prime.v=previous.v;
            table.__cxx_anonymous_0.prime.d.magic=previous.magic;table.__cxx_anonymous_0.prime.d.more=previous.more;
            table.items=previous.items;unbind();runtime.close();
          }
        }catch(error){return {error:{name:error.name,message:error.message,stack:error.stack}};}}''',TARGET)
        report['browser_version']=browser.version;browser.close()
    report['passed']=not report['page_errors'] and report['result'].get('mutation_cases')==384
    report['original_owner_sha256']=hashlib.sha256((ROOT/TARGET/'source/build/src/osd.cpp.mjs').read_bytes()).hexdigest()
    (ROOT/'reports/oct26-original-console-browser.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2));assert report['passed']
finally:server.shutdown();server.server_close();thread.join()
