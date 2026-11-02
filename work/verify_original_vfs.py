"""Execute original archive/file routines; compare native, Node and Chromium.

This is a resource-I/O milestone, not engine startup or gameplay verification.
The platform mounts only the raw GRP; original initgroupfile builds its index.
"""
import functools,hashlib,http.server,json,os,subprocess,tempfile,threading
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
PROFILE=json.loads((ROOT/'tools/browser_classic_profile.json').read_text())
SOURCE=ROOT/PROFILE['prepared_source_root'];MODULES=ROOT/PROFILE['boot_module_root']
def run(args,**kwargs):
    p=subprocess.run(list(map(str,args)),cwd=ROOT,capture_output=True,text=True,timeout=180,**kwargs)
    assert p.returncode==0,(args,p.returncode,p.stdout[-1800:],p.stderr[-5000:]);return p.stdout
def native(root):
    cpp=root/'vfs-oracle.cpp';exe=root/'vfs-oracle.exe'
    cpp.write_text('''#include <cstdio>
#include <cstdlib>
#include <cstdarg>
#include "baselayer.h"
#include "vfs.h"
#include "osd.h"
// Test host logging service; no original file or archive behavior replaced.
int OSD_Printf(const char *format,...){va_list ap;va_start(ap,format);int result=vfprintf(stderr,format,ap);va_end(ap);return result;}
void sample(int handle,int offset,int length){unsigned char data[128];
 if(klseek(handle,offset,0)!=offset||kread(handle,data,length)!=length||ktell(handle)!=offset+length)std::abort();
 for(int i=0;i<length;i++)printf("%02x",data[i]);printf("\\n");}
int main(int argc,char **argv){if(argc!=2)return 2;setvbuf(stdout,nullptr,_IONBF,0);engineCreateAllocator();initdivtables();
 int h=kopen4load(argv[1],0);if(h<0)return 3;int length=kfilelength(h);printf("%d\\n",length);
 const int offsets[]={0,12,16,4096,length-128};for(int offset:offsets)sample(h,offset,128);kclose(h);
 int group=initgroupfile(argv[1]);printf("%d\\n",group);if(group!=0)return 4;
 const char *names[]={"E1L1.MAP","PALETTE.DAT","GAME.CON","TILES000.ART"};
 for(const char *name:names)for(int search=0;search<=1;search++){h=kopen4load(name,search);if(h<0)return 5;
 int n=kfilelength(h);printf("%s:%d:%d\\n",name,n,search);sample(h,0,128);sample(h,4096,128);sample(h,n-128,128);kclose(h);}
}
''')
    flags=['-funsigned-char','-std=gnu++14','-O2','-include','cstdlib','-DNOASM','-DNDEBUG',
        '-DSDL_TARGET=2','-DRENDERTYPESDL=1','-DNETCODE_DISABLE','-DEDUKE32_BROWSER=1',
        '-ffunction-sections','-fdata-sections','-Wl,--gc-sections']
    flags+=['-I'+str(SOURCE/p) for p in ('source/build/include','source/audiolib/include','source/glad/include','platform/Windows/include','platform/Windows/include/SDL2')]
    sources=[SOURCE/'source/build/src'/name for name in ('vfs.cpp','compat.cpp','kplib.cpp','smmalloc_generic.cpp','pragmas.cpp','klzw.cpp','lz4.c','loguru.cpp')]
    run(['clang++',*flags,cpp,*sources,'-o',exe])
    return run([exe,'input-data/DUKE3D.GRP']).splitlines()
class Quiet(http.server.SimpleHTTPRequestHandler):
    extensions_map={**http.server.SimpleHTTPRequestHandler.extensions_map,'.mjs':'text/javascript'}
    def log_message(self,*args):pass
    def do_GET(self):
        if self.path=='/__original_vfs_probe__':
            body=b'<!doctype html><title>Original archive I/O diagnostic</title><link rel="icon" href="data:,">'
            self.send_response(200);self.send_header('Content-Length',str(len(body)));self.end_headers();self.wfile.write(body)
        else:super().do_GET()
def main():
    with tempfile.TemporaryDirectory(dir=ROOT/'work',prefix='original-vfs-') as name:
        expected=native(Path(name))
    node=json.loads(run(['node','work/run_original_vfs.mjs']))
    assert node['oracle_lines']==expected,(node['oracle_lines'][:8],expected[:8])
    class Server(http.server.HTTPServer):request_queue_size=128
    server=Server(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)))
    threading.Thread(target=server.serve_forever,daemon=True).start();errors=[]
    try:
        from playwright.sync_api import sync_playwright
        with sync_playwright() as pw:
            browser=pw.chromium.launch(executable_path=os.environ['EDUKE_CHROMIUM_EXECUTABLE'],headless=True)
            page=browser.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
            page.goto('http://127.0.0.1:'+str(server.server_port)+'/__original_vfs_probe__')
            result=page.evaluate('''async ()=>{
              const {probeOriginalVFS}=await import('/work/probe_original_vfs.mjs');
              return probeOriginalVFS({base:new URL('/',location.href),traceHost:true});
            }''')
            assert result['oracle_lines']==expected and not errors,(result,errors)
            version=browser.version;browser.close()
    finally:server.shutdown();server.server_close()
    # Publish verification metadata, not samples of privately supplied assets.
    summary={key:value for key,value in result.items() if key!='oracle_lines'}
    summary['native_oracle_output_sha256']=hashlib.sha256(('\n'.join(expected)+'\n').encode()).hexdigest()
    report={'format':'original-vfs-native-browser-parity/1','passed':True,'native_node_chromium_match':True,
        'browser_version':version,'page_errors':errors,'result':summary,
        'artifacts':{p.relative_to(ROOT).as_posix():hashlib.sha256(p.read_bytes()).hexdigest()
            for folder in (MODULES,ROOT/'runtime') for p in folder.rglob('*.mjs')},
        'original_engine_startup_verified':False,'gameplay_verified':False}
    (ROOT/'reports/nov01-original-vfs-parity.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps({k:v for k,v in report.items() if k!='artifacts'},indent=2))
if __name__=='__main__':main()
