"""Native differential probe for original CircularQueue, using current services."""
import functools,hashlib,http.server,json,os,subprocess,sys,tempfile,threading
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];PROFILE=json.loads((ROOT/'tools/browser_classic_profile.json').read_text())
SOURCE=ROOT/PROFILE['prepared_source_root'];MODULES=ROOT/PROFILE['boot_module_root']
def run(args):
    p=subprocess.run(list(map(str,args)),cwd=ROOT,text=True,capture_output=True,timeout=180)
    assert p.returncode==0,(p.stdout[-1600:],p.stderr[-3000:]);return p.stdout
with tempfile.TemporaryDirectory(prefix='original-queue-',dir=ROOT/'work') as temporary:
    root=Path(temporary);cpp=root/'queue.cpp'
    cpp.write_text('''#include "lru.h"
extern "C" int exercise(int n){CircularQueue<char*,16,RF_INIT> q;char bytes[32];
 for(int j=0;j<31;j++){bytes[j]=(n+j)&127;char*value=bytes+j;q.pushBack(value);}
 const auto &c=q;int value=*c.front()+*c.back()+c.size()+*q[3];q.front()=bytes+1;
 q.popFront();value+=*q.front()+q.capacity()+q.backIndex()+q.frontIndex();q.clear();return value+q.size();}
''')
    flags=['-std=gnu++14','-funsigned-char','-DNOASM','-DNDEBUG','-DEDUKE32_BROWSER=1']
    flags+=['-I'+str(SOURCE/p) for p in ('source/build/include','source/audiolib/include','source/glad/include','platform/Windows/include','platform/Windows/include/SDL2')]
    main=root/'main.cpp';main.write_text('#include <cstdio>\nextern "C" int exercise(int);\nint main(){for(int n=-128;n<128;n++)printf("%d\\n",exercise(n));}')
    exe=root/'oracle.exe';run(['clang++','-O2',*flags,cpp,main,'-o',exe]);expected=run([exe]).splitlines()
    out=root/'out';source=cpp.relative_to(ROOT).as_posix()
    commands=root/'commands.json';commands.write_text(json.dumps([{'directory':str(ROOT),'file':source,
        'arguments':['clang++',*flags,'-c',source,'-o','unused.o']}]))
    print(run([sys.executable,ROOT/'tools/source_ast_to_js.py','--root',ROOT,'--source',source,'--out-dir',out,
        '--compile-commands',commands,
        '--filter','exercise','--exact-filter','--dependency-closure','--header-dependency-closure','--header-inlines',
        '--project-symbols',MODULES/'browser-combined-symbol-owners.json','--import-root',MODULES]))
    module=out/(source+'.mjs');manifest=json.loads(module.with_suffix('.manifest.json').read_text())
    print(json.dumps({'definitions':[(r['name'],r['status'],r.get('reason')) for r in manifest['definitions']],
        'destructors':manifest['template_destructor_closure']},indent=2))
    assert next(r for r in manifest['definitions'] if r['name']=='exercise')['status']=='source-first'
    driver=root/'check.mjs';driver.write_text('''import {NativeRuntime} from '''+json.dumps((ROOT/'runtime/index.mjs').as_uri())+''';
const r=new NativeRuntime();r.bindSourceMemory();const base='''+json.dumps(MODULES.as_uri())+''';
const release=(await import(base+'/browser-abi/libc_provider.mjs')).bindBrowserC(r);
(await import(base+'/source/build/src/baselayer.cpp.mjs')).engineSetupAllocator();
const m=await import('''+json.dumps(module.as_uri())+''');try{for(let n=-128;n<128;n++)console.log(m.exercise(n));}finally{release();r.close();}''')
    actual=run(['node',driver]).splitlines();assert actual==expected,next(((i,a,b)for i,(a,b)in enumerate(zip(actual,expected))if a!=b),None)
    class Quiet(http.server.SimpleHTTPRequestHandler):
        extensions_map={**http.server.SimpleHTTPRequestHandler.extensions_map,'.mjs':'text/javascript'}
        def log_message(self,*args):pass
    class Server(http.server.HTTPServer):request_queue_size=128
    server=Server(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)))
    threading.Thread(target=server.serve_forever,daemon=True).start()
    html=root/'probe.html';html.write_text('<!doctype html><title>Original source queue parity diagnostic</title><link rel="icon" href="data:,">')
    try:
        from playwright.sync_api import sync_playwright
        with sync_playwright() as pw:
            browser=pw.chromium.launch(executable_path=os.environ['EDUKE_CHROMIUM_EXECUTABLE'],headless=True)
            page=browser.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
            base='http://127.0.0.1:'+str(server.server_port)
            page.goto(base+'/'+html.relative_to(ROOT).as_posix())
            got=page.evaluate('''async ({code,origin,base})=>{
              const rows=[],previous=console.log;
              const url=URL.createObjectURL(new Blob([code.replaceAll(origin,base)],{type:'text/javascript'}));
              console.log=(...values)=>rows.push(values.join(' '));
              try{await import(url);return rows;}finally{console.log=previous;URL.revokeObjectURL(url);}
            }''',{'code':driver.read_text(),'origin':ROOT.as_uri(),'base':base})
            assert got==expected and not errors,(got[:5],expected[:5],errors)
            version=browser.version;browser.close()
    finally:server.shutdown();server.server_close()
    report={'format':'original-circular-queue-native-parity/1','passed':True,
        'native_node_chromium_cases':256,'browser_version':version,'page_errors':errors,
        'header':'source/build/include/lru.h','header_sha256':hashlib.sha256((SOURCE/'source/build/include/lru.h').read_bytes()).hexdigest(),
        'fixture_sha256':hashlib.sha256(cpp.read_bytes()).hexdigest(),
        'compiler_frontend_sha256':hashlib.sha256((ROOT/'tools/source_ast_to_js.py').read_bytes()).hexdigest(),
        'console_initialization_verified':False,'gameplay_verified':False}
    (ROOT/'reports/nov01-original-queue-parity.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2))
