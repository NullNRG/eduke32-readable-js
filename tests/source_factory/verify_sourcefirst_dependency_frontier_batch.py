"""Human-readable diagnostic previews must not truncate dependency recovery."""
import functools,http.server,json,os,subprocess,sys,tempfile,threading
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def run(arguments):
    p=subprocess.run(list(map(str,arguments)),cwd=ROOT,capture_output=True,text=True,timeout=150)
    assert p.returncode==0,(arguments,p.stdout[-1200:],p.stderr[-2500:]);return p.stdout
with tempfile.TemporaryDirectory(prefix='complete-dependency-frontier-',dir=ROOT/'work') as temporary:
    root=Path(temporary);external=[f'a_external_{n:02d}' for n in range(16)]
    (root/'unit.cpp').write_text('\n'.join('extern "C" int '+name+'(int);' for name in external)+'''
static int zz_late_leaf(int n){return n*7-37;}
static int z_late(int n){return zz_late_leaf(n)+n*2;}
extern "C" int entry(int n){return '''+'+'.join(name+'(n)' for name in external)+'''+z_late(n);}
''')
    compiler=[sys.executable,ROOT/'tools/source_ast_to_js.py','--root',root,'--source','unit.cpp',
        '--filter','entry','--exact-filter','--dependency-closure']
    partial=root/'partial';run([*compiler,'--out-dir',partial]);doc=json.loads((partial/'unit.cpp.manifest.json').read_text())
    rows={row['name']:row for row in doc['definitions']};entry=rows['entry']
    assert entry['status']=='blocked' and set(entry['unresolved_references'])==set(external),entry
    assert all(rows[name]['status']=='source-first' for name in ('z_late','zz_late_leaf')),doc
    assert {'z_late','zz_late_leaf'}<=set(doc['dependency_closure']['additional_ast_filters'])
    assert not doc['dependency_closure']['budget_exhausted'] and not doc['dependency_closure']['unqueried_references']
    bounded=root/'bounded';run([*compiler,'--out-dir',bounded,'--dependency-query-limit','4'])
    budget=json.loads((bounded/'unit.cpp.manifest.json').read_text())['dependency_closure']
    assert budget['budget_exhausted'] and 'z_late' in budget['unqueried_references'],budget
    (root/'providers.cpp').write_text('\n'.join('extern "C" int '+name+'(int n){return n*'+str(i+1)+' ^ '+str(0x1337*(i+1))+';}' for i,name in enumerate(external)))
    providers=root/'providers';run([sys.executable,ROOT/'tools/source_ast_to_js.py','--root',root,
        '--source','providers.cpp','--out-dir',providers])
    symbols=root/'symbols.json';symbols.write_text(json.dumps({name:'providers.cpp' for name in external}))
    out=root/'linked';run([*compiler,'--out-dir',out,'--project-symbols',symbols,'--import-root',providers])
    linked=json.loads((out/'unit.cpp.manifest.json').read_text());assert linked['blocked']==0,linked['definitions']
    (root/'main.cpp').write_text('#include <cstdio>\nextern "C" int entry(int);int main(){for(int n=-128;n<128;n++)printf("%d\\n",entry(n));}\n')
    oracle=root/'oracle.exe';run(['clang++','-std=c++14',root/'unit.cpp',root/'providers.cpp',root/'main.cpp','-o',oracle])
    expected=list(map(int,run([oracle]).splitlines()))
    js='async url=>{const {entry}=await import(url);return Array.from({length:256},(_,n)=>entry(n-128));}'
    runner=root/'runner.mjs';runner.write_text('console.log(JSON.stringify(await ('+js+')('+json.dumps((out/'unit.cpp.mjs').as_uri())+')));')
    assert json.loads(run(['node',runner]))==expected
    if os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'):
        class Quiet(http.server.SimpleHTTPRequestHandler):
            extensions_map={**http.server.SimpleHTTPRequestHandler.extensions_map,'.mjs':'text/javascript'}
            def log_message(self,*args):pass
        (root/'index.html').write_text('<!doctype html><link rel="icon" href="data:,">')
        server=http.server.HTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(root)))
        thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
        try:
            from playwright.sync_api import sync_playwright
            with sync_playwright() as pw:
                browser=pw.chromium.launch(executable_path=os.environ['EDUKE_CHROMIUM_EXECUTABLE'],headless=True)
                try:
                    page=browser.new_page();errors=[];page.on('pageerror',lambda error:errors.append(str(error)))
                    origin='http://127.0.0.1:'+str(server.server_port);page.goto(origin+'/')
                    assert page.evaluate(js,origin+'/linked/unit.cpp.mjs')==expected and not errors,errors
                finally:browser.close()
        finally:server.shutdown();server.server_close();thread.join()
print('PASS 256 native/Node/Chromium whole-call results: external prototypes cannot hide later local definitions, complete structured frontiers and honest query budgets')
