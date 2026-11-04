"""Execute original archive/file routines; compare native, Node and Chromium.

This is a resource-I/O milestone, not engine startup or gameplay verification.
The platform mounts only the raw GRP; original initgroupfile builds its index.
"""
import functools,hashlib,http.server,json,os,subprocess,sys,tempfile,threading
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];__import__('sys').path.insert(0,str(ROOT/'tools'))
from source_runtime_helpers import runtime_fingerprints
PROFILE=json.loads((ROOT/'tools/browser_classic_profile.json').read_text())
SOURCE=ROOT/PROFILE['prepared_source_root'];MODULES=ROOT/PROFILE['boot_module_root']
def run(args,timeout=180,**kwargs):
    p=subprocess.run(list(map(str,args)),cwd=ROOT,capture_output=True,text=True,timeout=timeout,**kwargs)
    assert p.returncode==0,(args,p.returncode,p.stdout[-1800:],p.stderr[-5000:]);return p.stdout
def native(root,driver_source=None,arguments=None,extra_sources=()):
    cpp=root/'vfs-oracle.cpp';exe=root/'vfs-oracle.exe'
    cpp.write_text(driver_source or '''#include <cstdio>
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
    flags+=['-I'+str(SOURCE/p) for p in ('source/build/include','source/duke3d/src','source/mact/include','source/audiolib/include','source/glad/include','platform/Windows/include','platform/Windows/include/SDL2')]
    sources=[SOURCE/'source/build/src'/name for name in ('vfs.cpp','compat.cpp','kplib.cpp','smmalloc_generic.cpp','pragmas.cpp','klzw.cpp','lz4.c','loguru.cpp')]
    run(['clang++',*flags,cpp,*sources,*[SOURCE/p for p in extra_sources],'-o',exe])
    return run([exe,*(arguments if arguments is not None else ['input-data/DUKE3D.GRP'])]).splitlines()
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
def directories():
    driver=r'''#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <cstdarg>
#include "compat.h"
#include "osd.h"
// Native test host log sink; original directory/filesystem behavior is intact.
int OSD_Printf(const char*f,...){va_list a;va_start(a,f);int r=vfprintf(stderr,f,a);va_end(a);return r;}
int main(int argc,char**argv){if(argc!=2)return 2;engineCreateAllocator();
for(int n=0;n<32;n++){BDIR*dir=Bopendir(argv[1]);if(!dir)return 3;
while(Bdirent*e=Breaddir(dir)){if(!strcmp(e->name,".")||!strcmp(e->name,".."))continue;
 int isdir=!!(e->mode&0x4000);printf("%d %lld %d %d %s\n",n,isdir?0LL:(long long)e->size,isdir,e->namlen,e->name);}
if(Bclosedir(dir))return 4;}engineDestroyAllocator();}
'''
    js=r'''async base=>{
 const {NativeRuntime}=await import(base+'/runtime/index.mjs');
 const {sourceCString}=await import(base+'/runtime/source_bytes.mjs');
 const runtime=new NativeRuntime({memoryBytes:16<<20});runtime.bindSourceMemory();
 const root=base+'/MODULES';const release=(await import(root+'/browser-abi/libc_provider.mjs')).bindBrowserC(runtime);
 try{
  (await import(root+'/source/build/src/baselayer.cpp.mjs')).engineSetupAllocator();
  const c=await import(root+'/source/build/src/compat.cpp.mjs');
  runtime.fs.mountBytes('fixture/sample.grp',new Uint8Array(3));
  runtime.fs.mountBytes('fixture/sub/child.txt',new Uint8Array(5));
  const encode=s=>Uint8Array.from([...new TextEncoder().encode(s),0]);
  if(runtime.library.symbols.mkdir(encode('fixture/empty'),0o755)!==0)throw Error('Fixture directory creation failed');
  const rows=[],baseline=runtime.heap.allocations.size;
  for(let n=0;n<32;n++){
   const dir=c.Bopendir(encode('fixture'));if(!dir)throw Error('Original Bopendir failed');
   while(true){let record=c.Breaddir(dir);if(!record)break;
    if(record.__cReference)record=record.value;
    if(record.__cRecordPointer)record=globalThis[Symbol.for('source-first.record-pointer-views/1')].deref(record);
    const name=sourceCString(record.name,runtime.heap);if(name==='.'||name==='..')continue;
    const isdir=+(!!(record.mode&0x4000));rows.push([n,isdir?0:record.size,isdir,record.namlen,name].join(' '));
   }
   if(c.Bclosedir(dir)!==0)throw Error('Original Bclosedir failed');
  }
  if(c.Bopendir(encode('missing'))!==null||runtime.heap.allocations.size!==baseline)throw Error('Original directory failure path leaked allocations');
  c.engineDestroyAllocator();return rows.sort();
 }finally{release();runtime.close();}
}'''.replace('MODULES',MODULES.relative_to(ROOT).as_posix())
    with tempfile.TemporaryDirectory(dir=ROOT/'work',prefix='original-directories-') as folder:
        folder=Path(folder);fixture=folder/'fixture';(fixture/'sub').mkdir(parents=True);(fixture/'empty').mkdir()
        (fixture/'sample.grp').write_bytes(bytes(3));(fixture/'sub/child.txt').write_bytes(bytes(5))
        expected=sorted(native(folder,driver,[fixture]))
        runner=folder/'run.mjs';runner.write_text('console.log(JSON.stringify(await ('+js+')('+json.dumps(ROOT.as_uri())+')));')
        actual=json.loads(run(['node',runner]));assert actual==expected,(actual[:4],expected[:4])
        server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)))
        threading.Thread(target=server.serve_forever,daemon=True).start();errors=[]
        try:
            from playwright.sync_api import sync_playwright
            with sync_playwright() as pw:
                browser=pw.chromium.launch(executable_path=os.environ['EDUKE_CHROMIUM_EXECUTABLE'],headless=True)
                try:
                    page=browser.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
                    origin='http://127.0.0.1:'+str(server.server_port);page.goto(origin+'/__original_vfs_probe__')
                    actual=page.evaluate(js,origin);assert actual==expected and not errors,(actual[:4],errors)
                    version=browser.version
                finally:browser.close()
        finally:server.shutdown();server.server_close()
    report={'passed':True,'original_directory_functions_executed':['Bopendir','Breaddir','Bclosedir'],
        'native_node_chromium_rows':len(expected),'directory_sessions':32,'missing_directory_and_allocation_lifetimes_verified':True,
        'native_platform_metadata_normalization':'Directory sizes and timestamps excluded; compare entry names, lengths, file sizes and directory flags.',
        'browser_version':version,'page_errors':errors,'gameplay_verified':False,
        'artifacts':{p.relative_to(ROOT).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in MODULES.rglob('*.mjs')},
        'runtime_artifacts':runtime_fingerprints(ROOT)}
    (ROOT/'reports/nov03-original-directory-parity.json').write_bytes((json.dumps(report,indent=2)+'\n').encode())
    print(json.dumps({k:v for k,v in report.items() if k not in ('artifacts','runtime_artifacts')},indent=2))

if __name__=='__main__':directories() if '--directories' in sys.argv else main()
