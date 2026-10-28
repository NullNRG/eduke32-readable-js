"""Clang array_filler references must link to original owned storage/callbacks."""
import functools, http.server, json, os, subprocess, sys, tempfile, threading
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def run(args,cwd):
    p=subprocess.run(args,cwd=cwd,capture_output=True,text=True,timeout=120)
    assert p.returncode==0,(args,p.stdout[-1800:],p.stderr[-2400:])
    return p.stdout
with tempfile.TemporaryDirectory(prefix='partial-array-',dir=ROOT/'work') as temp:
    root=Path(temp);out=root/'out';out.mkdir()
    (root/'provider.cpp').write_text('unsigned char palette[8]={3,5,7,11,13,17,19,23}; int counter=31; int twice(int n){return 2*n;} int exercise(int); int forward(int n){return exercise(n);}')
    (root/'unit.cpp').write_text('''
extern unsigned char palette[8]; extern int counter; int twice(int);
unsigned char *table[4]={palette}; int (*callbacks[3])(int)={twice}; int *scalars[5]={&counter};
extern int missing; int *unowned[4]={&missing};
int exercise(int n){unsigned char *copy[4]; __builtin_memcpy(copy,table,sizeof(table)); copy[0][n%8]+=n; *scalars[0]+=n%7;
 return callbacks[0](table[0][n%8])+*scalars[0]+(copy[3]==nullptr)*1000+(callbacks[2]==nullptr)*2000+(scalars[4]==nullptr)*4000;}
''')
    (root/'main.cpp').write_text('#include <cstdio>\nint exercise(int); int missing; int main(){for(int n=0;n<256;n++)printf("%d\\n",exercise(n));}')
    native=root/'native.exe';run(['clang++','provider.cpp','unit.cpp','main.cpp','-o',str(native)],root)
    expected=run([str(native)],root).splitlines()
    compiler=[sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(root)]
    run([*compiler,'--source','unit.cpp','--out-dir',str(root/'unlinked')],ROOT)
    absent=json.loads((root/'unlinked/unit.cpp.manifest.json').read_text())
    rows={r['name']:r for r in absent['definitions']}
    for name,dependency in [('table','palette'),('callbacks','twice'),('scalars','counter'),('unowned','missing')]:
        assert rows[name]['status']=='blocked' and dependency in rows[name]['source_references'],rows[name]
    run([*compiler,'--source','provider.cpp','--out-dir',str(out)],ROOT)
    symbols=root/'symbols.json';symbols.write_text(json.dumps({n:'provider.cpp' for n in ('palette','counter','twice')}))
    run([*compiler,'--source','unit.cpp','--out-dir',str(out),'--project-symbols',str(symbols)],ROOT)
    linked=json.loads((out/'unit.cpp.manifest.json').read_text());rows={r['name']:r for r in linked['definitions']}
    assert rows['unowned']['status']=='blocked'
    for name in ('table','callbacks','scalars','exercise'):assert rows[name]['status']=='source-first',rows[name]
    assert {r['name'] for r in linked['imports']}=={'palette','counter','twice'},linked['imports']
    symbols.write_text(json.dumps({'exercise':'unit.cpp'}))
    run([*compiler,'--source','provider.cpp','--out-dir',str(out),'--project-symbols',str(symbols)],ROOT)
    # Import the provider first: its dependency evaluates the table before the
    # provider's byte storage exists. Real static relocations defer that read.
    exercise='async url=>{const m=await import(url);return Array.from({length:256},(_,i)=>String(m.forward(i)));}'
    (root/'run.mjs').write_text('console.log((await ('+exercise+')('+json.dumps((out/'provider.cpp.mjs').as_uri())+')).join("\\n"));')
    assert run(['node',str(root/'run.mjs')],ROOT).splitlines()==expected
    (root/'fixture.html').write_text('<!doctype html><title>Partial arrays</title>')
    class Handler(http.server.SimpleHTTPRequestHandler):
        extensions_map={**http.server.SimpleHTTPRequestHandler.extensions_map,'.mjs':'text/javascript'}
        def log_message(self,*args):pass
    class Server(http.server.ThreadingHTTPServer):request_queue_size=128
    server=Server(('127.0.0.1',0),functools.partial(Handler,directory=str(ROOT)));thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
    try:
        from playwright.sync_api import sync_playwright
        with sync_playwright() as p:
            browser=p.chromium.launch(executable_path=os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'),headless=True)
            page=browser.new_page();page.goto(f'http://127.0.0.1:{server.server_port}/'+(root/'fixture.html').relative_to(ROOT).as_posix())
            assert page.evaluate(exercise,'/'+(out/'provider.cpp.mjs').relative_to(ROOT).as_posix())==expected
            version=browser.version;browser.close()
    finally:server.shutdown();server.server_close();thread.join()
    report={'passed':True,'native_node_values':256,'native_chromium_values':256,'browser_version':version,
        'checks':['Partial byte-pointer arrays preserve original storage','Partial scalar-pointer arrays preserve shared mutation','Partial callback arrays link original functions','Uninitialized entries remain null','Missing original providers remain blocked','Cyclic modules resolve static pointer storage after initialization'], 'gameplay_verified':False}
    (ROOT/'reports/oct20-partial-array-dependencies.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2))
