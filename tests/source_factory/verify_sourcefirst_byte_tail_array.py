"""GNU char[1] pointer decay borrows only its original complete heap tail."""
import functools,http.server,json,os,subprocess,sys,tempfile,threading
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def run(args):
    p=subprocess.run(list(map(str,args)),cwd=ROOT,capture_output=True,text=True,timeout=120)
    assert p.returncode==0,(args,p.stdout[-1500:],p.stderr[-2500:]);return p.stdout
with tempfile.TemporaryDirectory(dir=ROOT/'work',prefix='byte-tail-') as folder:
    root=Path(folder)
    (root/'unit.cpp').write_text('''#include <cstdlib>
#include <cstring>
struct Tail{unsigned marker;char name[1];};
struct Fixed{char name[1];unsigned marker;};
extern "C" unsigned check(int n){int extra=n%64;int prefix=n<128?0:16;
 unsigned char*allocation=(unsigned char*)malloc(sizeof(Tail)+extra+prefix);Tail*p=(Tail*)(allocation+prefix);
 memset(p,0,sizeof(Tail)+extra);p->marker=0xdeadbeefU;char*data=p->name;
 for(int i=0;i<=extra;i++)data[i]=(char)('a'+i%26);data[extra]=0;
 unsigned result=sizeof(p->name);for(int i=0;i<extra;i++)result=result*31+(unsigned char)data[i];
 if(p->marker!=0xdeadbeefU)result=0;free(allocation);return result;}
extern "C" void reject(){Fixed*p=(Fixed*)malloc(sizeof(Fixed)+64);char*data=p->name;data[12]=9;free(p);}
''')
    (root/'main.cpp').write_text('#include <cstdio>\nextern "C" unsigned check(int);int main(){for(int n=0;n<256;n++)printf("%u\\n",check(n));}')
    exe=root/'oracle.exe';run(['clang++','-std=gnu++14',root/'unit.cpp',root/'main.cpp','-o',exe])
    expected=[int(v) for v in run([exe]).splitlines()]
    compiler=[sys.executable,ROOT/'tools/source_ast_to_js.py','--root',root,'--source','unit.cpp','--require-record-layouts']
    out=root/'out';run([*compiler,'--out-dir',out]);module=out/'unit.cpp.mjs'
    doc=json.loads(module.with_suffix('.manifest.json').read_text());rows={r['name']:r for r in doc['definitions']}
    assert rows['check']['status']=='source-first' and rows['reject']['status']=='source-first',rows
    assert 'oneByteTailArray' in module.read_text() and 'cArrayDecay(' in module.read_text()
    js='''async url=>{const m=await import(url);const rows=Array.from({length:256},(_,n)=>m.check(n));
      let rejected=false;try{m.reject();}catch(e){if(!(e instanceof RangeError))throw e;rejected=true;}
      if(!rejected)throw Error('Non-tail member acquired extended bounds');return rows;}'''
    runner=root/'run.mjs';runner.write_text('console.log(JSON.stringify(await ('+js+')('+json.dumps(module.as_uri())+')));')
    assert json.loads(run(['node',runner]))==expected
    strict=root/'strict';run([*compiler,'--out-dir',strict,'--extra=-fstrict-flex-arrays=3'])
    assert '"oneByteTailArray"' not in (strict/'unit.cpp.mjs').read_text()
    runner.write_text('const m=await import('+json.dumps((strict/'unit.cpp.mjs').as_uri())+');let rejected=false;try{m.check(30)}catch(e){if(!(e instanceof RangeError))throw e;rejected=true;}if(!rejected)throw Error("Strict array acquired GNU tail bounds");')
    run(['node',runner])
    if os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'):
        class Quiet(http.server.SimpleHTTPRequestHandler):
            extensions_map={**http.server.SimpleHTTPRequestHandler.extensions_map,'.mjs':'text/javascript'}
            def log_message(self,*args):pass
        server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)))
        threading.Thread(target=server.serve_forever,daemon=True).start()
        try:
            from playwright.sync_api import sync_playwright
            with sync_playwright() as pw:
                browser=pw.chromium.launch(executable_path=os.environ['EDUKE_CHROMIUM_EXECUTABLE'],headless=True)
                try:
                    page=browser.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
                    origin='http://127.0.0.1:'+str(server.server_port);page.goto(origin+'/')
                    actual=page.evaluate(js,origin+'/'+module.relative_to(ROOT).as_posix())
                    assert actual==expected and not errors,(actual[:4],errors)
                finally:browser.close()
        finally:server.shutdown();server.server_close()
print('PASS 256 native/Node/Chromium tail states: sizeof remains one, marker bytes preserved, native heap aliases retained; non-tail fields and strict-flex-arrays=3 stay bounded')
