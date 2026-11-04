"""A trivial C++ struct tag and same-named variable keep distinct identities."""
import base64,json,os,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def run(args):
    p=subprocess.run(list(map(str,args)),cwd=ROOT,capture_output=True,text=True,timeout=120)
    assert p.returncode==0,(args,p.stdout[-1500:],p.stderr[-2500:]);return p.stdout
with tempfile.TemporaryDirectory(dir=ROOT/'work',prefix='tag-value-') as folder:
    root=Path(folder)
    (root/'unit.cpp').write_text('''struct cache {cache* next;int value;};
static struct cache *cache=nullptr;
static struct cache nodes[4]{};
extern "C" int step(int n){struct cache* old=cache;cache=&nodes[n%4];
 cache->next=old;cache->value=n*13;int total=cache->value;
 if(cache->next)total+=cache->next->value;return total;}
namespace one{int conflicting=1;}namespace two{int conflicting=2;}
''')
    (root/'main.cpp').write_text('#include <cstdio>\nextern "C" int step(int);int main(){for(int n=0;n<256;n++)printf("%d\\n",step(n));}')
    exe=root/'oracle.exe';run(['clang++','-std=c++14',root/'unit.cpp',root/'main.cpp','-o',exe])
    expected=[int(v) for v in run([exe]).splitlines()];out=root/'out'
    run([sys.executable,ROOT/'tools/source_ast_to_js.py','--root',root,'--source','unit.cpp','--out-dir',out,'--require-record-layouts'])
    module=out/'unit.cpp.mjs';doc=json.loads(module.with_suffix('.manifest.json').read_text())
    rows=doc['definitions'];assert next(r for r in rows if r['name']=='step')['status']=='source-first',rows
    assert next(r for r in rows if r['name']=='cache')['kind']=='VarDecl',rows
    assert all(r['status']=='blocked' for r in rows if r.get('source_name')=='conflicting'),rows
    js='async url=>{const m=await import(url);return Array.from({length:256},(_,n)=>m.step(n));}'
    runner=root/'run.mjs';runner.write_text('console.log(JSON.stringify(await ('+js+')('+json.dumps(module.as_uri())+')));')
    assert json.loads(run(['node',runner]))==expected
    if os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'):
        from playwright.sync_api import sync_playwright
        with sync_playwright() as pw:
            browser=pw.chromium.launch(executable_path=os.environ['EDUKE_CHROMIUM_EXECUTABLE'],headless=True)
            try:
                page=browser.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
                actual=page.evaluate(js,'data:text/javascript;base64,'+base64.b64encode(module.read_bytes()).decode())
                assert actual==expected and not errors,(actual[:4],errors)
            finally:browser.close()
print('PASS 256 native/Node/Chromium states: same-named struct tag and global pointer; recursive fields retain aliases; competing value declarations remain blocked')
