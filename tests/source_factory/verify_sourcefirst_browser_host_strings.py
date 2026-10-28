"""Native formatted-output parity and real Chromium runtime construction."""
import functools, hashlib, http.server, json, os, subprocess, sys, tempfile, threading
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
SOURCE=r'''
#include <stdio.h>
#include <stdarg.h>
int source_vformat(char *out,unsigned size,const char *format,...){
 va_list args,copy;va_start(args,format);va_copy(copy,args);
 int result=vsnprintf(out,size,format,copy);va_end(copy);
 int second=vsnprintf(nullptr,0,format,args);va_end(args);
 return result==second?result:-999;
}
int format_case(int n){
 char out[96];for(int i=0;i<96;i++)out[i]=42;
 int count=-1;signed char count8=-1;short count16=-1;long long count64=-1;
 int result=source_vformat(out,1+n%64,"[%+07d:%.*s:%lld]%n%hhn%hn%lln",n-128,n%7,"EDuke32",9007199254740993LL+n,&count,&count8,&count16,&count64);
 unsigned hash=0;for(int i=0;i<96;i++)hash=(hash*31+(unsigned char)out[i])%100003;
 return result*257+count*13+(int)hash+count8+count16+(int)count64;
}
'''
def run(args,cwd):
    proc=subprocess.run(args,cwd=cwd,text=True,capture_output=True,timeout=120)
    assert proc.returncode==0,(args,proc.stdout[-1500:],proc.stderr[-2500:])
    return proc.stdout.strip()

with tempfile.TemporaryDirectory(prefix='host-strings-',dir=ROOT/'work') as directory:
    root=Path(directory);(root/'unit.cpp').write_text(SOURCE)
    (root/'main.cpp').write_text('#include <cstdio>\n#include "unit.cpp"\nint main(){\n#ifdef _WIN32\n_set_printf_count_output(1);\n#endif\nfor(int i=0;i<256;i++)printf("%d\\n",format_case(i));}')
    native=root/'native.exe';run(['clang++','-std=c++14','main.cpp','-o',str(native)],root)
    expected=run([str(native)],root).splitlines()
    out=root/'out';out.mkdir()
    (root/'symbols.json').write_text(json.dumps({'vsnprintf':'host'}))
    run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(root),'--source','unit.cpp',
         '--project-symbols',str(root/'symbols.json'),'--out-dir',str(out)],ROOT)
    manifest=json.loads((out/'unit.cpp.manifest.json').read_text())
    assert manifest['blocked']==0,manifest['definitions']
    host=out/'host.mjs'
    relative=lambda name:os.path.relpath(ROOT/name,host.parent).replace('\\','/')
    host.write_text('import {ABIHeap} from '+json.dumps(relative('runtime/abi.mjs'))+';\n'
        +'import {createCPrintf} from '+json.dumps(relative('runtime/c_printf.mjs'))+';\n'
        +'export const vsnprintf=createCPrintf(new ABIHeap()).vsnprintf;\n')
    js='async url=>{const m=await import(url);return Array.from({length:256},(_,i)=>String(m.format_case(i)));}'
    (root/'run.mjs').write_text('console.log((await ('+js+')('+json.dumps((out/'unit.cpp.mjs').as_uri())+')).join("\\n"));')
    actual=run(['node',str(root/'run.mjs')],ROOT).splitlines()
    assert actual==expected,[(i,a,b) for i,(a,b) in enumerate(zip(actual,expected)) if a!=b][:8]
    class Handler(http.server.SimpleHTTPRequestHandler):
        extensions_map={**http.server.SimpleHTTPRequestHandler.extensions_map,'.mjs':'text/javascript'}
        def log_message(self,*args):pass
    class FixtureServer(http.server.ThreadingHTTPServer):
        request_queue_size=128
    server=FixtureServer(('127.0.0.1',0),functools.partial(Handler,directory=str(ROOT)))
    thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
    try:
        from playwright.sync_api import sync_playwright
        with sync_playwright() as p:
            browser=p.chromium.launch(executable_path=os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'),headless=True)
            page=browser.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
            dialogs=[]
            def accept_dialog(dialog):dialogs.append(dialog.message);dialog.accept()
            page.on('dialog',accept_dialog)
            # A runtime fixture must not execute the independent root launcher's
            # polling script or replace its DOM while requests are in flight.
            (root/'fixture.html').write_text('<!doctype html><title>Runtime parity fixture</title><body></body>')
            page.goto('http://127.0.0.1:'+str(server.server_port)+'/'+(root/'fixture.html').relative_to(ROOT).as_posix())
            assert page.evaluate(js,'/'+(out/'unit.cpp.mjs').relative_to(ROOT).as_posix())==expected
            checks=page.evaluate(r'''async()=>{
              const {NativeRuntime}=await import('/runtime/index.mjs');
              const {sourceByteView}=await import('/runtime/source_bytes.mjs');
              const {loguru_log}=await import('/runtime/browser_loguru.mjs');
              document.body.innerHTML='<canvas id="c" width="320" height="200"></canvas>';
              const runtime=new NativeRuntime({canvas:document.getElementById('c'),renderer:'canvas2d',memoryBytes:8192});
              try{
                const heap=runtime.heap,fn=runtime.library.symbols;
                const pointer=heap.writeCString('EDuke32 café'),alias=heap.borrow(pointer,14),original=heap.buffer;
                heap.malloc(65536);
                if(heap.buffer!==original||heap.readCString(pointer)!=='EDuke32 café')throw Error('Heap C string lost during growth');
                fn.wm_setapptitle(alias);
                if(document.title!=='EDuke32 café')throw Error('Borrowed title decode failed');
                const titlePointer={__cPointer:true,array:false,buffer:alias.buffer,lower:alias.byteOffset,offset:alias.byteOffset,upper:alias.byteOffset+alias.byteLength};
                if(runtime.sdl.symbols.SDL_ShowSimpleMessageBox(64,titlePointer,alias,null)!==0)throw Error('Borrowed SDL text failed');
                const name=heap.writeCString('TEST.DAT');runtime.fs.mountBytes('test.dat',Uint8Array.of(11));
                if(fn.testkopen(heap.borrow(name,9),0)!==1)throw Error('Borrowed filename lookup failed');
                loguru_log(0,alias,1,heap.borrow(heap.writeCString('literal'),8));
                const grpPtr=heap.calloc(1,33),grp=heap.borrow(grpPtr,33);
                grp.set(new TextEncoder().encode('KenSilverman'));new DataView(grp.buffer,grp.byteOffset,33).setUint32(12,1,true);
                grp.set(new TextEncoder().encode('T.DAT'),16);new DataView(grp.buffer,grp.byteOffset,33).setUint32(28,1,true);grp[32]=19;
                if(runtime.fs.mountGRP(grp)[0].name!=='t.dat'||runtime.fs.readFile('t.dat')[0]!==19)throw Error('Borrowed GRP mount failed');
                const bytes=new Uint8Array(12),ptr={__cPointer:true,array:false,buffer:bytes.buffer,lower:2,offset:4,upper:10};
                sourceByteView(ptr)[0]=77;if(bytes[4]!==77)throw Error('Borrowed pointer write detached');
                const bad=f=>{let rejected=false;try{f();}catch(e){rejected=e instanceof TypeError||e instanceof RangeError;}if(!rejected)throw Error('Missing boundary check');};
                bad(()=>sourceByteView({...ptr,offset:1}));bad(()=>sourceByteView({...ptr,upper:13}));
                bad(()=>sourceByteView({...ptr,array:true,buffer:[1,2,3]}));
                const fmt=new TextEncoder().encode('%s\0');
                bad(()=>fn.vsnprintf(bytes,12,fmt,{__cVaList:true,values:[],index:0,ended:true}));
                bad(()=>fn.vsnprintf(bytes,12,fmt,{__cVaList:true,values:[],index:0,ended:false}));
                bad(()=>fn.snprintf(bytes,13,new TextEncoder().encode('x\0')));
                bad(()=>fn.snprintf(bytes,12,fmt,Uint8Array.of(65,66)));
                if(fn.snprintf(bytes,12,new TextEncoder().encode('%.2s\0'),Uint8Array.of(65,66))!==2)throw Error('Precision bounded string failed');
                return {runtime_constructed:true,heap_aliases_preserved:true,borrowed_grp_mounted:true,bounds_rejected:true};
              }finally{runtime.close();}
            }''')
            assert not errors,errors
            assert dialogs==['EDuke32 café\nEDuke32 café'],dialogs
            version=browser.version;browser.close()
    finally:server.shutdown();server.server_close();thread.join()
    report={'format':'source-browser-host-strings/1','passed':True,'native_node_values':256,'native_chromium_values':256,
        'browser_version':version,'checks':checks,'gameplay_verified':False,
        'runtime_sha256':{str(path.relative_to(ROOT)):hashlib.sha256(path.read_bytes()).hexdigest() for path in (ROOT/'runtime').glob('*.mjs')}}
    (ROOT/'reports/oct20-browser-host-strings-parity.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps({k:v for k,v in report.items() if k!='runtime_sha256'},indent=2))
