"""Original videoSetGamma native/browser comparison with real browser SDL ramps."""
import functools,hashlib,http.server,json,os,re,subprocess,tempfile,threading
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];TARGET='factory-output/source-first/oct20-engine-preinit-browser'
source=(ROOT/'factory-output/source-tree/eduke32-master/source/build/src/sdlayer.cpp').read_text()
body=re.search(r'^int32_t videoSetGamma\(void\)\s*\{.*?^\}',source,re.M|re.S)[0]
header=(ROOT/'factory-output/source-tree/eduke32-master/source/build/include/baselayer.h').read_text()
constants='\n'.join(re.findall(r'^#define (?:MIN|MAX)_(?:GAMMA|CONTRAST)\s+[^\n]+',header,re.M))
cases=[[1,c] for c in [0.5,0.75,1,1.25,1.5]]+[[0.75,1],[1.25,1]]
with tempfile.TemporaryDirectory(prefix='original-gamma-oracle-') as directory:
    folder=Path(directory);native=folder/'oracle.cpp';exe=folder/('oracle.exe' if os.name=='nt' else 'oracle')
    native.write_text('#include <algorithm>\n#include <cmath>\n#include <cstdint>\n#include <cstdio>\nusing std::min;using std::max;\n#define SDL_MAJOR_VERSION 2\n#define DLOG_F(...) ((void)0)\n'+constants+'\nchar novideo=0;float g_videoGamma=1,g_videoContrast=1,lastvidgcb[2]={};int gammabrightness=0;void *sdl_window=(void*)1;uint16_t captured[768];\nint SDL_SetWindowGammaRamp(void*,const uint16_t*r,const uint16_t*g,const uint16_t*b){for(int i=0;i<256;i++){captured[i]=r[i];captured[i+256]=g[i];captured[i+512]=b[i];}return 0;}\n'+body+'\nint main(){float cases[][2]={'+','.join('{'+','.join(str(v)+'f' if '.' in str(v) else str(v)+'.0f' for v in pair)+'}' for pair in cases)+'};for(auto &pair:cases){g_videoGamma=pair[0];g_videoContrast=pair[1];lastvidgcb[0]=lastvidgcb[1]=-1;int r=videoSetGamma();printf("%d %d",r,gammabrightness);for(auto v:captured)printf(" %u",(unsigned)v);puts("");}}')
    subprocess.run(['clang++','-std=c++14','-O2','-ffp-contract=off',str(native),'-o',str(exe)],check=True,capture_output=True)
    expected=[[int(v) for v in line.split()] for line in subprocess.run([str(exe)],check=True,capture_output=True,text=True).stdout.splitlines()]
class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map={**http.server.SimpleHTTPRequestHandler.extensions_map,'.mjs':'text/javascript'}
    def log_message(self,*args):pass
    def do_GET(self):
        if self.path=='/':
            body=b'<!doctype html><title>Original gamma verification</title><link rel="icon" href="data:,"><canvas id="screen" width="320" height="200"></canvas>'
            self.send_response(200);self.send_header('Content-Type','text/html');self.end_headers();self.wfile.write(body)
        else:super().do_GET()
class Server(http.server.ThreadingHTTPServer):request_queue_size=128
server=Server(('127.0.0.1',0),functools.partial(Handler,directory=str(ROOT)));thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
report={'gameplay_verified':False,'page_errors':[],'native_original_function_sha256':hashlib.sha256(body.encode()).hexdigest()}
try:
    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path=os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'),headless=True);page=browser.new_page()
        page.on('pageerror',lambda e:report['page_errors'].append(str(e)));page.goto(f'http://127.0.0.1:{server.server_port}/')
        report['result']=page.evaluate('''async ({target,cases,expected})=>{try{
            const [{NativeRuntime},s,o,e,p]=await Promise.all([import('/runtime/index.mjs'),import('/'+target+'/browser-abi/sdl_provider.mjs'),import('/'+target+'/source/build/src/sdlayer.cpp.mjs'),import('/'+target+'/source/build/src/engine.cpp.mjs'),import('/'+target+'/source/build/src/palette.cpp.mjs')]);
            const runtime=new NativeRuntime({canvas:document.querySelector('canvas'),renderer:'canvas2d'}),unbind=s.bindBrowserSDL(runtime);
            try{
                s.SDL_Init(32);const win=s.SDL_CreateWindow(new TextEncoder().encode('gamma\\0'),0,0,320,200,0);
                const windowCell=o.__cxx_private_cell_1807b37dcb1d3a7c8be4b656();windowCell.value=win;
                let maximumDelta=0,exactSamples=0;
                for(let index=0;index<cases.length;index++){
                    const [gamma,contrast]=cases[index];e.__cxx_global_cell_92f6ec0c3a993b574f308abb().value=gamma;e.__cxx_global_cell_eb7ec64efb5dec6e758a65c7().value=contrast;
                    o.__cxx_private_cell_b7667aed095ebace4c73b0ae().value.fill(-1);
                    const code=o.videoSetGamma(),output=new Uint16Array(768);s.SDL_GetWindowGammaRamp(win,output.subarray(0,256),output.subarray(256,512),output.subarray(512));
                    if(code!==expected[index][0]||p.gammabrightness!==expected[index][1])throw Error('Original gamma state mismatch');
                    output.forEach((v,i)=>{const d=Math.abs(v-expected[index][i+2]);maximumDelta=Math.max(maximumDelta,d);if(d===0)exactSamples++;if(d>1)throw Error('Native/browser gamma differs by more than one Uint16 level');});
                    if(o.videoSetGamma()!==0)throw Error('Original gamma cache path failed');
                }
                windowCell.value=null;o.__cxx_private_cell_b7667aed095ebace4c73b0ae().value.fill(-1);
                if(o.videoSetGamma()!==-2147483648||p.gammabrightness!==0)throw Error('Missing-window gamma result mismatch');
                o.__cxx_global_cell_468c46341ac515257fedfe76().value=1;
                if(o.videoSetGamma()!==0)throw Error('Original novideo gamma result mismatch');
                s.SDL_DestroyWindow(win);return {original_calls:cases.length*2+2,native_samples:cases.length*768,exact_samples:exactSamples,maximum_uint16_delta:maximumDelta,allowed_libm_uint16_delta:1,real_browser_sdl_window:true,source_buffer_ramp_transfer:true};
            }finally{unbind();runtime.close();}
        }catch(error){return {error:{name:error.name,message:error.message,stack:error.stack}};}}''',{'target':TARGET,'cases':cases,'expected':expected})
        report['browser_version']=browser.version;browser.close()
    report['passed']=not report['page_errors'] and report['result'].get('native_samples')==len(cases)*768
    report['original_owner_sha256']=hashlib.sha256((ROOT/TARGET/'source/build/src/sdlayer.cpp.mjs').read_bytes()).hexdigest()
    report['runtime_sdl_sha256']=hashlib.sha256((ROOT/'runtime/sdl_browser.mjs').read_bytes()).hexdigest()
    (ROOT/'reports/oct27-original-gamma-browser.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2));assert report['passed']
finally:server.shutdown();server.server_close();thread.join()
