"""Trivial C++ static default construction retains zeroed, persistent ABI bytes."""
import base64,json,os,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
SOURCE=r'''
struct __attribute__((packed)) State {unsigned magic;unsigned char shift;};
unsigned tick(unsigned n){static State state;State *alias=&state;
 unsigned before=state.magic+state.shift;
 if(n%3==1){State next={n*171u,(unsigned char)(n&31)};state=next;}
 alias->magic+=n*17u;alias->shift=(unsigned char)(alias->shift+1);
 return before^state.magic^((unsigned)state.shift<<24);}
unsigned other(unsigned n){static State state;state.magic+=n+3;return state.magic+state.shift;}
struct Authored {int x;Authored():x(37){}};
int reject_authored(){static Authored object;return object.x;}
'''
def run(command,cwd):
 r=subprocess.run(list(map(str,command)),cwd=cwd,capture_output=True,text=True,timeout=180)
 assert r.returncode==0,(command,r.stdout[-1400:],r.stderr[-2000:])
 return r.stdout.strip()
with tempfile.TemporaryDirectory(prefix='source-static-pod-') as directory:
 root=Path(directory);(root/'unit.cpp').write_text(SOURCE)
 (root/'main.cpp').write_text('#include <cstdio>\n#include "unit.cpp"\nint main(){for(unsigned n=0;n<1024;n++)printf("%u %u\\n",tick(n),other(n));}')
 run(['clang++','-std=c++14',root/'main.cpp','-o',root/'native.exe'],root)
 expected=run([root/'native.exe'],root).splitlines();modules=[]
 evaluator='''async ({url})=>{const m=await import(url),result=[];for(let n=0;n<1024;n++)result.push(m.tick(n)+' '+m.other(n));return result;}'''
 for mode in ('full','filtered'):
  command=[sys.executable,ROOT/'tools/source_ast_to_js.py','--root',root,'--source','unit.cpp','--out-dir',root/mode,'--require-record-layouts']
  if mode=='filtered':command+=['--filter','tick,other,reject_authored','--exact-filter','--dependency-closure','--header-dependency-closure']
  run(command,ROOT);module=root/mode/'unit.cpp.mjs'
  rows={r['source_name']:r for r in json.loads(module.with_suffix('.manifest.json').read_text())['definitions']}
  for name in ('tick','other'):assert rows[name]['status']=='source-first' and rows[name].get('storage_constructor_count')==1,rows[name]
  assert rows['reject_authored']['status']=='blocked',rows['reject_authored']
  (root/'run.mjs').write_text('console.log((await ('+evaluator+')('+json.dumps({'url':module.as_uri()})+')).join("\\n"));')
  assert run(['node',root/'run.mjs'],ROOT).splitlines()==expected
  modules.append(module)
 browser_checked=bool(os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'))
 if browser_checked:
  from playwright.sync_api import sync_playwright
  with sync_playwright() as p:
   browser=p.chromium.launch(executable_path=os.environ['EDUKE_CHROMIUM_EXECUTABLE'],headless=True);page=browser.new_page()
   for module in modules:
    assert page.evaluate(evaluator,{'url':'data:text/javascript;base64,'+base64.b64encode(module.read_bytes()).decode()})==expected
   browser.close()
print('PASS: 2,048 native/full/filtered Node'+('/Chromium' if browser_checked else '')+' values; zero initialization, repeated calls, packed record assignment and address aliases; independent static objects; authored constructors rejected')
