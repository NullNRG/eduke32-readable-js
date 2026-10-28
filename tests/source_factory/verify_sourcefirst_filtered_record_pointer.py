"""Filtered typedef member access uses the actual source pointer ABI."""
import functools,json,os,subprocess,sys,tempfile,threading
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def run(args):
    result=subprocess.run(args,cwd=ROOT,capture_output=True,text=True,timeout=120)
    assert result.returncode==0,(args,result.stdout,result.stderr)
    return result.stdout
with tempfile.TemporaryDirectory(prefix='source-filtered-record-pointer-') as directory:
    temp=Path(directory);source=temp/'source';source.mkdir();owner=temp/'owner';fragment=temp/'fragment'
    (source/'types.h').write_text('typedef struct {int value; int *alias;} Record; extern Record records[2]; extern Record *cursor;\n')
    (source/'owner.cpp').write_text('#include "types.h"\nRecord records[2]={{10,0},{20,0}}; Record *cursor=records;\nextern "C" void choose(int i){cursor=records+i;}\nextern "C" int read_owner(int i){return records[i].value;}\n')
    (source/'consumer.cpp').write_text('#include "types.h"\nextern "C" int step(int x){cursor->value+=x; cursor->value++; return cursor->value;}\n')
    compiler=[sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(source)]
    run(compiler+['--source','owner.cpp','--out-dir',str(owner),'--require-record-layouts'])
    om=json.loads((owner/'owner.cpp.manifest.json').read_text())
    assert om['blocked']==0,om
    symbols=temp/'symbols.json';symbols.write_text(json.dumps({'cursor':'owner.cpp'}))
    run(compiler+['--source','consumer.cpp','--filter','step','--out-dir',str(fragment),
        '--project-symbols',str(symbols),'--import-root',str(owner)])
    fm=json.loads((fragment/'consumer.cpp.manifest.json').read_text())
    assert fm['blocked']==0 and fm['emitted']==1,fm
    assert not fm['record_layout_extraction']['explicitly_required']
    code=(fragment/'consumer.cpp.mjs').read_text()
    assert 'cRecordObject(' in code
    driver=temp/'driver.cpp';driver.write_text('#include <cstdio>\nextern "C" void choose(int); extern "C" int read_owner(int);extern "C" int step(int);\nint main(){for(int i=0;i<256;i++){choose(i%2);int v=step(i-128);printf("%d %d\\n",v,read_owner(i%2));}}\n')
    exe=temp/('oracle.exe' if os.name=='nt' else 'oracle')
    run(['clang++','-std=c++14',str(source/'owner.cpp'),str(source/'consumer.cpp'),str(driver),'-o',str(exe)])
    expected=[[int(v) for v in line.split()] for line in run([str(exe)]).splitlines()]
    runner=temp/'runner.mjs';runner.write_text('import {choose,read_owner} from "./owner/owner.cpp.mjs";import {step} from "./fragment/consumer.cpp.mjs";\nexport const actual=Array.from({length:256},(_,i)=>{choose(i%2);const v=step(i-128);return [v,read_owner(i%2)];});\nif(typeof window==="undefined")console.log(JSON.stringify(actual));else window.actual=actual;\n')
    actual=json.loads(run(['node',str(runner)]));assert actual==expected,(actual[:3],expected[:3])
    report={'passed':True,'native_node_cases':256,'original_shared_storage_verified':True,
        'filtered_typedef_pointer_reads_and_writes':True,'gameplay_verified':False}
    if os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'):
        from playwright.sync_api import sync_playwright
        class Quiet(SimpleHTTPRequestHandler):
            extensions_map={**SimpleHTTPRequestHandler.extensions_map,'.mjs':'text/javascript'}
            def log_message(self,*args):pass
        class Server(ThreadingHTTPServer):request_queue_size=128
        (temp/'index.html').write_text('<script type="module" src="runner.mjs"></script>')
        server=Server(('127.0.0.1',0),functools.partial(Quiet,directory=str(temp)))
        thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
        try:
            with sync_playwright() as p:
                browser=p.chromium.launch(executable_path=os.environ['EDUKE_CHROMIUM_EXECUTABLE'],headless=True)
                page=browser.new_page();errors=[];page.on('pageerror',lambda error:errors.append(str(error)))
                page.goto(f'http://127.0.0.1:{server.server_port}/');page.wait_for_function('Array.isArray(window.actual)')
                assert page.evaluate('window.actual')==expected and not errors,errors
                report.update(chromium_cases=256,browser_version=browser.version);browser.close()
        finally:server.shutdown();server.server_close();thread.join()
    (ROOT/'reports/oct26-filtered-record-pointer-parity.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2))
