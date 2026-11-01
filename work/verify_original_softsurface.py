"""Compare the actual original software surface in native, Node and Chromium.

This tests indexed-pixel conversion and scaling, not world rendering/gameplay.
The oracle links original source files; only its fatal allocation reporter is
a test service. No engine implementation is replaced or shipped by this test.
"""
import base64,functools,hashlib,http.server,json,os,struct,subprocess,tempfile,threading
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
PROFILE=json.loads((ROOT/'tools/browser_classic_profile.json').read_text())
SOURCE=ROOT/PROFILE['prepared_source_root'];MODULES=ROOT/PROFILE['boot_module_root']
CASES=[[64,8,1,32],[80,11,2,32],[128,13,1,16],[320,200,2,16]]
JS=r'''async ({base,cases})=>{
 const {NativeRuntime}=await import(base+'/runtime/index.mjs');
 const runtime=new NativeRuntime({memoryBytes:16<<20});runtime.bindSourceMemory();
 const root=base+'/MODULE_ROOT';
 const releaseC=(await import(root+'/browser-abi/libc_provider.mjs')).bindBrowserC(runtime);
 const releaseSDL=(await import(root+'/browser-abi/sdl_provider.mjs')).bindBrowserSDL(runtime);
 try{
  const engine=await import(root+'/source/build/src/baselayer.cpp.mjs');engine.engineSetupAllocator();
  const pragmas=await import(root+'/source/build/src/pragmas.cpp.mjs');pragmas.initdivtables();
  const surface=await import(root+'/source/build/src/softsurface.cpp.mjs');
  const rows=[];let index=0;
  for(const [w,h,scale,bpp] of cases){
   const input=surface.softsurface_getBufferResolution(),output=surface.softsurface_getDestinationBufferResolution();
   input.x=w;input.y=h;output.x=w*scale;output.y=h*scale;
   if(!surface.softsurface_initialize(input,output))throw Error('Original surface rejected initialization');
   const got=surface.softsurface_getBufferResolution(),dest=surface.softsurface_getDestinationBufferResolution();
   if(got.x!==w||got.y!==h||dest.x!==w*scale||dest.y!==h*scale)throw Error('Surface fragments do not share original resolution storage');
   const p=surface.softsurface_getBuffer();
   if(!p||!p.buffer)throw Error('Original getter does not share initialized source framebuffer');
   const pixels=new Uint8Array(p.buffer,p.offset,w*h);
   for(let i=0;i<pixels.length;i++)pixels[i]=(i*17+(i/w|0)*3+index*29)&255;
   const palette=new Uint8Array(1024);
   for(let i=0;i<256;i++){palette[i*4]=(i*3+index)&255;palette[i*4+1]=(i*5+11)&255;palette[i*4+2]=(i*7+23)&255;palette[i*4+3]=255;}
   const masks=bpp===16?[0xf800,0x7e0,0x1f]:[0xff0000,0xff00,0xff];
   surface.softsurface_setPalette(palette,...masks);
   const bytes=new Uint8Array(w*h*scale*scale*(bpp/8));bytes.fill(0xcd);
   surface.softsurface_blitBuffer(bytes,bpp);
   let encoded='';for(let i=0;i<bytes.length;i+=16384)encoded+=String.fromCharCode(...bytes.subarray(i,i+16384));
   rows.push(typeof btoa==='function'?btoa(encoded):Buffer.from(bytes).toString('base64'));
   index++;
  }
  surface.softsurface_destroy();
  if(surface.softsurface_getBuffer()!==null||surface.softsurface_getBufferResolution().x!==0)throw Error('Original destructor left source state allocated');
  return rows;
 }finally{releaseSDL();releaseC();runtime.close();}
}'''.replace('MODULE_ROOT',MODULES.relative_to(ROOT).as_posix())

def run(args,**kwargs):
    result=subprocess.run(list(map(str,args)),cwd=ROOT,capture_output=True,timeout=180,**kwargs)
    assert result.returncode==0,(args,result.stdout[-1500:],result.stderr[-3500:])
    return result.stdout

def native(folder):
    cpp=folder/'surface-oracle.cpp';exe=folder/'surface-oracle.exe'
    cpp.write_text('''#include <cstdio>
#include <cstdlib>
#include <fcntl.h>
#include <io.h>
#include <vector>
#include "softsurface.h"
#include "pragmas.h"
sm::GenericAllocator::TInstance g_sm_heap;
EDUKE32_NORETURN void handle_memerr(int32_t){std::abort();}
int main(){
 _setmode(_fileno(stdout),_O_BINARY);engineCreateAllocator();initdivtables();
 const int cases[][4]={'''+','.join('{'+','.join(map(str,c))+'}' for c in CASES)+'''};
 for(unsigned index=0;index<sizeof(cases)/sizeof(cases[0]);index++){
  int w=cases[index][0],h=cases[index][1],scale=cases[index][2],bpp=cases[index][3];
  if(!softsurface_initialize({w,h},{w*scale,h*scale}))return 2;
  auto pixels=softsurface_getBuffer();for(int i=0;i<w*h;i++)pixels[i]=(i*17+(i/w)*3+index*29)&255;
  unsigned char palette[1024];for(int i=0;i<256;i++){
   palette[i*4]=(i*3+index)&255;palette[i*4+1]=(i*5+11)&255;palette[i*4+2]=(i*7+23)&255;palette[i*4+3]=255;
  }
  if(bpp==16)softsurface_setPalette(palette,0xf800,0x7e0,0x1f);else softsurface_setPalette(palette,0xff0000,0xff00,0xff);
  uint32_t length=w*h*scale*scale*(bpp/8);std::vector<uint32_t> output((length+3)/4,0xcdcdcdcd);
  softsurface_blitBuffer(output.data(),bpp);fwrite(&length,4,1,stdout);fwrite(output.data(),1,length,stdout);
 }
 softsurface_destroy();engineDestroyAllocator();return 0;
}''')
    flags=['-funsigned-char','-std=gnu++14','-O2','-include','cstdlib','-DNOASM','-DNDEBUG','-DSDL_TARGET=2','-DRENDERTYPESDL=1','-DNETCODE_DISABLE','-DEDUKE32_BROWSER=1']
    flags+=['-I'+str(SOURCE/p) for p in ('source/build/include','source/audiolib/include','source/glad/include','platform/Windows/include','platform/Windows/include/SDL2')]
    sources=[SOURCE/'source/build/src'/name for name in ('softsurface.cpp','pragmas.cpp','smmalloc_generic.cpp')]
    run(['clang++',*flags,cpp,*sources,'-o',exe])
    output=run([exe]);rows=[];offset=0
    for _ in CASES:
        length=struct.unpack_from('<I',output,offset)[0];offset+=4
        data=output[offset:offset+length];assert len(data)==length;offset+=length;rows.append(data)
    assert offset==len(output)
    return rows

class Quiet(http.server.SimpleHTTPRequestHandler):
    extensions_map={**http.server.SimpleHTTPRequestHandler.extensions_map,'.mjs':'text/javascript'}
    def log_message(self,*args):pass
    def do_GET(self):
        if self.path=='/__original_surface_probe__':
            body=b'<!doctype html><title>Original indexed surface parity diagnostic</title><link rel="icon" href="data:,">'
            self.send_response(200);self.send_header('Content-Length',str(len(body)));self.end_headers();self.wfile.write(body)
        else:super().do_GET()

def compare(encoded,expected,label):
    assert len(encoded)==len(expected)
    for case,(got,want) in enumerate(zip(encoded,expected)):
        raw=base64.b64decode(got)
        if raw!=want:
            first=next((i for i,(a,b) in enumerate(zip(raw,want)) if a!=b),None)
            raise AssertionError((label,CASES[case],len(raw),len(want),first,raw[first:first+12] if first is not None else None,want[first:first+12] if first is not None else None))

def main():
    with tempfile.TemporaryDirectory(prefix='original-softsurface-',dir=ROOT/'work') as directory:
        folder=Path(directory);expected=native(folder)
        driver=folder/'check.mjs';driver.write_text('const run='+JS+';console.log(JSON.stringify(await run('+json.dumps({'base':ROOT.as_uri(),'cases':CASES})+')));')
        node=json.loads(run(['node',driver],text=True));compare(node,expected,'Node')
        class Server(http.server.HTTPServer):request_queue_size=128
        server=Server(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)))
        threading.Thread(target=server.serve_forever,daemon=True).start()
        errors=[];console=[]
        try:
            from playwright.sync_api import sync_playwright
            with sync_playwright() as pw:
                browser=pw.chromium.launch(executable_path=os.environ['EDUKE_CHROMIUM_EXECUTABLE'],headless=True)
                page=browser.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
                page.on('console',lambda message:console.append({'type':message.type,'text':message.text}))
                base='http://127.0.0.1:'+str(server.server_port);page.goto(base+'/__original_surface_probe__')
                actual=page.evaluate(JS,{'base':base,'cases':CASES});compare(actual,expected,'Chromium')
                assert not errors,errors;version=browser.version;browser.close()
        finally:server.shutdown();server.server_close()
        report={'format':'original-software-surface-native-parity/1','passed':True,'cases':CASES,
            'native_node_browser_compared_bytes':sum(map(len,expected))*2,'browser_version':version,
            'outputs_sha256':[hashlib.sha256(row).hexdigest() for row in expected],
            'console':console,'page_errors':errors,'original_functions':['softsurface_initialize','softsurface_getBuffer',
            'softsurface_setPalette','softsurface_getBufferResolution','softsurface_getDestinationBufferResolution',
            'softsurface_blitBuffer','softsurface_destroy'],
            'artifacts':{p.relative_to(ROOT).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in MODULES.rglob('*.mjs')},
            'original_world_rendering_verified':False,'gameplay_verified':False}
        (ROOT/'reports/nov01-original-softsurface-parity.json').write_text(json.dumps(report,indent=2)+'\n')
        print(json.dumps({k:v for k,v in report.items() if k!='artifacts'},indent=2))

if __name__=='__main__':
    import sys
    sys.path.insert(0,str(ROOT/'tools'))
    from recover_browser_component import component_lock
    with component_lock():main()
