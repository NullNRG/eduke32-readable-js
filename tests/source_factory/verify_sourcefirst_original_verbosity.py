"""Original engine verbosity body and its real pointer table, native versus JS."""
import atexit,base64,functools,hashlib,http.server,json,os,subprocess,sys,tempfile,threading
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
SOURCE=ROOT/'factory-output/source-tree/eduke32-master'
def run(command):
    p=subprocess.run(command,cwd=ROOT,text=True,capture_output=True,timeout=120)
    assert p.returncode==0,(command,p.stdout[-1500:],p.stderr[-2500:]);return p.stdout.strip()
original=(SOURCE/'source/build/src/baselayer.cpp').read_text()
begin=original.index('const char*(*gameVerbosityCallback)');end=original.index('bool g_useLogCallback',begin)
body=original[begin:end]
scratch=tempfile.TemporaryDirectory(prefix='eduke-original-verbosity-module-');atexit.register(scratch.cleanup)
out=Path(scratch.name)/'compiled'
run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(SOURCE),'--source','source/build/src/baselayer.cpp',
    '--filter','engineVerbosityCallback,gameVerbosityCallback,engineSetLogVerbosityCallback','--header-inlines',
    '--header-dependency-closure','--dependency-closure','--enum-closure','--out-dir',str(out),'--ast-cache-dir',str(ROOT/'work/ast-cache-boot-probes')])
module=out/'source/build/src/baselayer.cpp.mjs'
manifest=json.loads(module.with_suffix('.manifest.json').read_text())
for name in ('engineVerbosityCallback','gameVerbosityCallback','engineSetLogVerbosityCallback'):
    row=next(r for r in manifest['definitions'] if r['name']==name);assert row['status']=='source-first',row
with tempfile.TemporaryDirectory(prefix='eduke-original-verbosity-') as temp:
    root=Path(temp)
    cpp=root/'native.cpp'
    cpp.write_text('#include "compat.h"\n#include "log.h"\n#include <cstdio>\n'+body+
        '\nconst char *override_name(int v){return v==3?"OVR":nullptr;}\n'
        'int main(){for(int n=0;n<512;n++){int v=n%256-64;engineSetLogVerbosityCallback(nullptr);const char*a=engineVerbosityCallback(v);engineSetLogVerbosityCallback(override_name);const char*b=engineVerbosityCallback(v);printf("%s,%s\\n",a?a:"NULL",b?b:"NULL");}}\n')
    includes=[SOURCE/'source/build/include',SOURCE/'platform/Windows/include',SOURCE/'platform/Windows/include/SDL2']
    exe=root/'native.exe';run(['clang++','-std=gnu++14','-DNOASM','-funsigned-char',*[flag for p in includes for flag in ('-I',str(p))],str(cpp),'-o',str(exe)])
    expected=run([str(exe)]).splitlines()
    js='''async url=>{const m=await import(url),decode=p=>p===null?'NULL':new TextDecoder().decode(p.subarray(0,p.indexOf(0)));const rows=[];for(let n=0;n<512;n++){let v=n%256-64;m.engineSetLogVerbosityCallback(null);let a=decode(m.engineVerbosityCallback(v));m.engineSetLogVerbosityCallback(x=>x===3?new TextEncoder().encode('OVR\\0'):null);let b=decode(m.engineVerbosityCallback(v));rows.push(a+','+b);}return rows;}'''
    driver=root/'run.mjs';driver.write_text('const rows=await ('+js+')('+json.dumps(module.as_uri())+');for(const row of rows)console.log(row);')
    actual=run(['node',str(driver)]).splitlines();assert actual==expected,next((r for r in zip(expected,actual) if r[0]!=r[1]),None)
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path=os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'),headless=True)
        page=browser.new_page()
        browser_actual=page.evaluate(js,'data:text/javascript;base64,'+base64.b64encode(module.read_bytes()).decode())
        assert browser_actual==expected
        class Handler(http.server.SimpleHTTPRequestHandler):
            extensions_map={**http.server.SimpleHTTPRequestHandler.extensions_map,'.mjs':'text/javascript'}
            def log_message(self,*args):pass
        server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(out)))
        thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
        try:
            base='http://127.0.0.1:'+str(server.server_port)
            page.goto(base+'/')
            http_browser=page.evaluate(js,base+'/'+module.relative_to(out).as_posix())
            assert http_browser==expected
        finally:server.shutdown();server.server_close();thread.join()
        version=browser.version;browser.close()
report={'format':'original-engine-verbosity-native-browser-parity/1','native_node_cases':512,
    'native_chromium_cases':512,'http_native_chromium_cases':512,
    'shared_original_callback_storage':True,'original_body_sha256':hashlib.sha256(body.encode()).hexdigest(),
    'module_sha256':hashlib.sha256(module.read_bytes()).hexdigest(),'browser_version':version,
    'source':'source/build/src/baselayer.cpp','functions':['engineVerbosityCallback','engineSetLogVerbosityCallback'],
    'passed':True,'gameplay_verified':False}
(ROOT/'reports/oct15-original-verbosity-parity.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
