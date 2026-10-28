"""Verify retained borrowed range pointers against the original console record."""
import hashlib,json,os,shutil,subprocess,sys,tempfile
import functools,http.server,threading
from pathlib import Path
from contextlib import nullcontext
ROOT=Path(__file__).resolve().parents[2]
INCLUDE=ROOT/'factory-output/source-tree/eduke32-master/source/build/include'
def run(args):
    p=subprocess.run(args,cwd=ROOT,text=True,capture_output=True,timeout=180)
    assert p.returncode==0,(args,p.stdout[-2000:],p.stderr[-4000:])
    return p.stdout

with tempfile.TemporaryDirectory(prefix='eduke-borrowed-cvars-') as scratch:
    work=Path(scratch)
    (work/'favicon.ico').write_bytes(b'')
    header=(INCLUDE/'osd.h').read_text()
    end=header.index('} osdcvardata_t;')+len('} osdcvardata_t;')
    start=header.rfind('typedef struct',0,end)
    original=header[start:end]
    (work/'original-osdcvardata.h').write_text(original+'\n')
    shutil.copyfile(ROOT/'tests/source_factory/source_first_borrowed_range_fixture.cpp',work/'unit.cpp')
    (work/'main.cpp').write_text('#include <cstdio>\nextern "C" int borrowed_cvars(int);\nint main(){for(int i=-256;i<256;i++)printf("%d\\n",borrowed_cvars(i));}\n')
    native=work/('native.exe' if os.name=='nt' else 'native')
    run(['clang++','-std=c++14',str(work/'unit.cpp'),str(work/'main.cpp'),'-o',str(native)])
    expected=run([str(native)]).splitlines()
    out=work/'out'
    run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(work),'--source','unit.cpp','--out-dir',str(out),'--header-dependency-closure'])
    module=out/'unit.cpp.mjs'
    manifest=json.loads(module.with_suffix('.manifest.json').read_text())
    failures=[(r['name'],r.get('reason')) for r in manifest['definitions'] if r['status']!='source-first']
    assert not failures,failures
    driver=work/'run.mjs'
    driver.write_text('import {borrowed_cvars} from '+json.dumps(module.as_uri())+';for(let i=-256;i<256;i++)console.log(borrowed_cvars(i));')
    actual=run(['node',str(driver)]).splitlines()
    assert actual==expected,(actual[:5],expected[:5])
    filtered=work/'filtered'
    run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(work),'--source','unit.cpp','--out-dir',str(filtered),'--filter','borrowed_cvars','--dependency-closure','--header-dependency-closure'])
    filtered_module=filtered/'unit.cpp.mjs'
    filtered_manifest=json.loads(filtered_module.with_suffix('.manifest.json').read_text())
    blocked=[(r['name'],r.get('reason')) for r in filtered_manifest['definitions'] if r['status']!='source-first']
    assert not blocked,blocked
    (work/'filtered.mjs').write_text('import {borrowed_cvars} from '+json.dumps(filtered_module.as_uri())+';for(let i=-256;i<256;i++)console.log(borrowed_cvars(i));')
    assert run(['node',str(work/'filtered.mjs')]).splitlines()==expected
    report={'passed':True,'native_js_cases':512,'filtered_ast_native_cases':512,'original_record_sha256':hashlib.sha256(original.encode()).hexdigest(),'checks':['borrowed original osdcvardata_t addresses','retained pointers after range loop','original anonymous pointer union','callback writes into original global storage','record-array pointer equality'],'gameplay_verified':False}
    executable=os.environ.get('EDUKE_CHROMIUM_EXECUTABLE')
    if executable:
        from playwright.sync_api import sync_playwright
        class QuietHandler(http.server.SimpleHTTPRequestHandler):
            extensions_map={**http.server.SimpleHTTPRequestHandler.extensions_map,'.mjs':'text/javascript','.js':'text/javascript'}
            def log_message(self,*args):pass
        server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(QuietHandler,directory=str(work)))
        thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
        errors=[]
        try:
            with sync_playwright() as playwright:
                browser=playwright.chromium.launch(executable_path=executable,headless=True)
                page=browser.new_page()
                page.on('pageerror',lambda error:errors.append(str(error)))
                page.goto('http://127.0.0.1:'+str(server.server_port)+'/')
                observed=page.evaluate('''async()=>{
                    const s=await import('/out/unit.cpp.mjs');
                    return Array.from({length:512},(_,i)=>String(s.borrowed_cvars(i-256)));
                }''')
                report['browser']={'passed':observed==expected and not errors,'version':browser.version,
                    'executable':executable,'native_js_cases':512,'exceptions':errors}
                browser.close()
                assert observed==expected and not errors,(errors,observed[:3],expected[:3])
        finally:server.shutdown();server.server_close();thread.join()
    report['compiler_sha256']=hashlib.sha256((ROOT/'tools/source_ast_to_js.py').read_bytes()).hexdigest()
    (ROOT/'reports/borrowed-range-parity.json').write_text(json.dumps(report,indent=2)+'\n')
print('PASS: 512 native/Node/Chromium borrowed original console-variable record cases')
