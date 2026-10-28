"""Native/Chromium comparison of actual original palette storage after upgrade.
This verifies byte layout and shared fields, not palette initialization or frames.
"""
import functools,hashlib,http.server,json,os,re,subprocess,tempfile,threading
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];TARGET='factory-output/source-first/oct20-engine-preinit-browser'
header=ROOT/'factory-output/source-tree/eduke32-master/source/build/include/palette.h'
declaration=re.search(r'typedef struct\s*\{\s*char r, g, b, f;\s*\}\s*palette_t;',header.read_text())[0]
with tempfile.TemporaryDirectory(prefix='original-palette-layout-') as directory:
    folder=Path(directory);native=folder/'oracle.cpp';exe=folder/('oracle.exe' if os.name=='nt' else 'oracle')
    native.write_text('#include <cstdio>\n'+declaration+'\nint main(){palette_t p[256]={};for(int round=0;round<4;round++)for(int i=0;i<256;i++){p[i].r=i+round*71;p[i].g=i*3+round;p[i].b=255-i+round;p[i].f=round;((unsigned char*)p)[i*sizeof(palette_t)+1]^=0x5a;printf("%u %u %u %u\\n",(unsigned)p[i].r,(unsigned)p[i].g,(unsigned)p[i].b,(unsigned)p[i].f);}}')
    subprocess.run(['clang++','-std=c++14','-funsigned-char',str(native),'-o',str(exe)],check=True,capture_output=True)
    expected=[[int(v) for v in line.split()] for line in subprocess.run([str(exe)],check=True,text=True,capture_output=True).stdout.splitlines()]
class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map={**http.server.SimpleHTTPRequestHandler.extensions_map,'.mjs':'text/javascript'}
    def log_message(self,*args):pass
    def do_GET(self):
        if self.path=='/':
            body=b'<!doctype html><title>Original palette layout verification</title><link rel="icon" href="data:,">'
            self.send_response(200);self.send_header('Content-Type','text/html');self.end_headers();self.wfile.write(body)
        else:super().do_GET()
class Server(http.server.ThreadingHTTPServer):request_queue_size=128
server=Server(('127.0.0.1',0),functools.partial(Handler,directory=str(ROOT)))
thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
report={'gameplay_verified':False,'palette_setup_verified':False,'page_errors':[],'original_type_declaration_sha256':hashlib.sha256(declaration.encode()).hexdigest()}
try:
    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path=os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'),headless=True)
        page=browser.new_page();page.on('pageerror',lambda error:report['page_errors'].append(str(error)))
        page.goto(f'http://127.0.0.1:{server.server_port}/')
        result=page.evaluate('''async ({target,expected})=>{try{
            const m=await import('/'+target+'/source/build/src/palette.cpp.mjs');
            const symbol=Symbol.for('source-first.clang-byte-record-array/1');let cases=0;
            for(const array of [m.curpalette,m.curpalettefaded]){
                const bytes=array[symbol];
                if(array.length!==256||!(bytes instanceof Uint8Array)||bytes.length!==1024||bytes.some(v=>v!==0))throw Error('Original zero array layout mismatch');
                const identity=array[0];
                for(let round=0;round<4;round++)for(let i=0;i<256;i++){
                    array[i].r=i+round*71;array[i].g=i*3+round;array[i].b=255-i+round;array[i].f=round;
                    bytes[i*4+1]^=0x5a;
                    const fields=[array[i].r,array[i].g,array[i].b,array[i].f];
                    if(JSON.stringify(fields)!==JSON.stringify(expected[round*256+i])||JSON.stringify([...bytes.subarray(i*4,i*4+4)])!==JSON.stringify(fields))throw Error('Original palette alias/layout mismatch');
                    cases++;
                }
                if(identity!==array[0])throw Error('Original palette element identity changed');bytes.fill(0);
            }
            const fade=m.palfadergb,storage=fade[Symbol.for('source-first.original-byte-record-storage/1')];
            if(!storage||storage.bytes.length!==4||storage.bytes.some(v=>v))throw Error('Original fade zero record mismatch');
            fade.r=17;storage.bytes[2]=99;
            if(storage.bytes[0]!==17||fade.b!==99||m.__cxx_global_cell_226fe25bac1ac7d5f7db4e7a().value!==fade)throw Error('Original fade cell identity mismatch');
            storage.bytes.fill(0);return {native_chromium_record_cases:cases,contiguous_original_arrays:true,byte_aliasing:true,original_fade_cell_identity:true};
        }catch(error){return {error:{name:error.name,message:error.message,stack:error.stack}};}}''',{'target':TARGET,'expected':expected})
        report.update(result=result,browser_version=browser.version);browser.close()
    report['passed']=not report['page_errors'] and result.get('native_chromium_record_cases')==2048
    report['original_owner_sha256']=hashlib.sha256((ROOT/TARGET/'source/build/src/palette.cpp.mjs').read_bytes()).hexdigest()
    (ROOT/'reports/oct27-original-palette-storage-browser.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2));assert report['passed']
finally:server.shutdown();server.server_close();thread.join()
