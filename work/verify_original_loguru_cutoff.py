"""Original Loguru cutoff/storage parity; this is not engine boot evidence."""
import functools,hashlib,http.server,json,os,subprocess,tempfile,threading
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'factory-output/browser-classic/source-tree/eduke32-master'
MODULE=ROOT/'factory-output/source-first/oct29-browser-hash-providers/source/build/src/loguru.cpp.mjs'
def run(args):
    proc=subprocess.run(list(map(str,args)),cwd=ROOT,text=True,capture_output=True,timeout=120)
    if proc.returncode:raise RuntimeError(proc.stdout+'\n'+proc.stderr)
    return proc.stdout
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
manifest=json.loads(MODULE.with_suffix('.manifest.json').read_text())
definitions={r['name']:r for r in manifest['definitions']}
assert not manifest['blocked'] and not manifest['imports']
stderr_cell=definitions['g_stderr_verbosity']['global_storage']['binding']
max_cell=definitions['s_max_out_verbosity']['private_storage']['binding']
source=(SOURCE/'source/build/src/loguru.cpp').read_text()
fragments=[]
for name in ('g_stderr_verbosity','s_max_out_verbosity'):
    row=next(line for line in source.splitlines() if 'Verbosity' in line and name in line and '=' in line)
    fragments.append(row)
start=source.index('\tVerbosity current_verbosity_cutoff()');end=source.index('\n\t}',start)+3
fragments.append(source[start:end])
body='\n'.join(fragments)
js='''async url=>{const m=await import(url);const values=[];
const stderr=m[STDERR](),maximum=m[MAXIMUM]();
values.push(m.current_verbosity_cutoff());
for(let i=0;i<512;i++){stderr.value=(i*17)%41-20;maximum.value=(i*29)%51-25;
values.push(m.current_verbosity_cutoff());}return values;}'''.replace('STDERR',json.dumps(stderr_cell)).replace('MAXIMUM',json.dumps(max_cell))
with tempfile.TemporaryDirectory(prefix='eduke-original-loguru-cutoff-') as temporary:
    folder=Path(temporary);cpp=folder/'oracle.cpp';exe=folder/'oracle.exe'
    cpp.write_text('#include "loguru.hpp"\n#include <cstdio>\nnamespace loguru {\n'+body+'\n}\n'
      +'int main(){using namespace loguru;printf("%d\\n",current_verbosity_cutoff());'
      +'for(int i=0;i<512;i++){g_stderr_verbosity=(i*17)%41-20;s_max_out_verbosity=(i*29)%51-25;'
      +'printf("%d\\n",current_verbosity_cutoff());}}\n')
    run(['clang++','-std=gnu++14','-I'+str(SOURCE/'source/build/include'),cpp,'-o',exe])
    expected=list(map(int,run([exe]).splitlines()))
    driver=folder/'run.mjs';driver.write_text('console.log(JSON.stringify(await ('+js+')('+json.dumps(MODULE.as_uri())+')));')
    actual=json.loads(run(['node',driver]));assert actual==expected
    class Handler(http.server.SimpleHTTPRequestHandler):
        extensions_map={**http.server.SimpleHTTPRequestHandler.extensions_map,'.mjs':'text/javascript'}
        def log_message(self,*args):pass
        def do_GET(self):
            if self.path=='/__cutoff_probe__':
                self.send_response(200);self.send_header('Content-Type','text/html');self.end_headers();self.wfile.write(b'<!doctype html><title>Original logging subsystem probe</title>')
            else:super().do_GET()
    server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(ROOT)))
    thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
    from playwright.sync_api import sync_playwright
    try:
        with sync_playwright() as p:
            browser=p.chromium.launch(executable_path=os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'),headless=True)
            page=browser.new_page();errors=[];page.on('pageerror',lambda error:errors.append(str(error)))
            origin='http://127.0.0.1:'+str(server.server_port);page.goto(origin+'/__cutoff_probe__')
            result=page.evaluate(js,origin+'/'+MODULE.relative_to(ROOT).as_posix())
            assert result==expected and not errors,(result[:8],errors)
            version=browser.version;browser.close()
    finally:server.shutdown();server.server_close();thread.join()
report={'format':'original-loguru-cutoff-native-js-parity/1','passed':True,
 'native_node_chromium_cases':len(expected),'browser_version':version,'page_errors':errors,
 'original_function':'loguru::current_verbosity_cutoff','source_globals':['g_stderr_verbosity','s_max_out_verbosity'],
 'original_source_sha256':sha(SOURCE/'source/build/src/loguru.cpp'),'original_fragment_sha256':hashlib.sha256(body.encode()).hexdigest(),
 'module_sha256':sha(MODULE),'manifest_sha256':sha(MODULE.with_suffix('.manifest.json')),
 'gameplay_verified':False,'original_console_initialization_verified':False}
(ROOT/'reports/oct29-original-loguru-cutoff-parity.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
