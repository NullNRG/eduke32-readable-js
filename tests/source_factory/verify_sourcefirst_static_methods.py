"""Static method calls and function addresses retain their Clang class owner."""
import functools,http.server,json,os,subprocess,sys,tempfile,threading
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def run(args,cwd):
    p=subprocess.run(args,cwd=cwd,capture_output=True,text=True,timeout=120)
    assert p.returncode==0,(args,p.stdout[-2000:],p.stderr[-3000:])
    return p.stdout
with tempfile.TemporaryDirectory(prefix='static-methods-',dir=ROOT/'work') as tmp:
    root=Path(tmp)
    (root/'types.h').write_text('''
struct First { int value=11; static int same(int x){return x*3+7;} static First none(){First v;v.value=0;return v;} };
struct Third { static int same(int x){return x*5-2;} };
struct Second { static int same(int x){return Third::same(x);} };
struct Missing { static int same(int); };
struct Overloaded {static int same(int x){return x;} static int same(double x){return (int)x+1;}};
''')
    (root/'unit.cpp').write_text('''#include "types.h"
struct Local {static int same(int n){return n-9;}};
First initial=First::none();
int exercise(int n){int (*f)(int)=&First::same;return f(n)+Second::same(n)+Local::same(n)+initial.value;}
int unavailable(int n){return Missing::same(n);}
int ambiguous(int n){return Overloaded::same(n);}
''')
    (root/'main.cpp').write_text('#include "types.h"\n#include <cstdio>\nint exercise(int); int Missing::same(int n){return n;} int main(){for(int n=0;n<256;n++)printf("%d\\n",exercise(n));}')
    native=root/('native.exe' if os.name=='nt' else 'native')
    run(['clang++','unit.cpp','main.cpp','-o',str(native)],root)
    expected=run([str(native)],root).splitlines()
    out=root/'out'
    run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(root),'--source','unit.cpp','--out-dir',str(out),'--header-dependency-closure'],ROOT)
    rows={r['name']:r for r in json.loads((out/'unit.cpp.manifest.json').read_text())['definitions']}
    for name in ('initial','exercise'):assert rows[name]['status']=='source-first',rows[name]
    for name in ('unavailable','ambiguous'):assert rows[name]['status']=='blocked',rows[name]
    assert {'First','Second'}<=set(rows['exercise']['source_references']),rows['exercise']
    evaluate='async url=>{const m=await import(url);return Array.from({length:256},(_,i)=>String(m.exercise(i)));}'
    (root/'run.mjs').write_text('console.log((await ('+evaluate+')('+json.dumps((out/'unit.cpp.mjs').as_uri())+')).join("\\n"));')
    assert run(['node',str(root/'run.mjs')],ROOT).splitlines()==expected
    (root/'fixture.html').write_text('<!doctype html><title>Static class methods</title>')
    class Handler(http.server.SimpleHTTPRequestHandler):
        extensions_map={**http.server.SimpleHTTPRequestHandler.extensions_map,'.mjs':'text/javascript'}
        def log_message(self,*args):pass
    server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(ROOT)))
    thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
    try:
        from playwright.sync_api import sync_playwright
        with sync_playwright() as p:
            browser=p.chromium.launch(executable_path=os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'),headless=True)
            page=browser.new_page();page.goto(f'http://127.0.0.1:{server.server_port}/'+(root/'fixture.html').relative_to(ROOT).as_posix())
            assert page.evaluate(evaluate,'/'+(out/'unit.cpp.mjs').relative_to(ROOT).as_posix())==expected
            version=browser.version;browser.close()
    finally:server.shutdown();server.server_close();thread.join()
    report={'passed':True,'native_node_values':256,'native_chromium_values':256,'browser_version':version,
        'checks':['Same method name in distinct classes','Static method function address','Header factory returning original record','Transitive static class dependency','Local class static method','Unimplemented and overloaded methods remain blocked'],'gameplay_verified':False}
    (ROOT/'reports/oct21-static-methods.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2))
