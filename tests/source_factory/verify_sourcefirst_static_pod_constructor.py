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
struct __attribute__((packed)) MethodState {
 unsigned magic; unsigned char shift;
 unsigned apply(unsigned n) const {return (magic+n)^((unsigned)shift<<24);}
 unsigned advance(unsigned n) {magic+=n;shift=(unsigned char)(shift+1);return apply(n);}
};
unsigned method_table(unsigned n){
 static const MethodState table[]={{171u,3},{999u,7},{12345u,11}};
 unsigned sum=0;for(auto const & entry:table)sum+=entry.apply(n);
 static MethodState live[]={{13u,17},{19u,23}};
 for(auto & entry:live)sum^=entry.advance(n);
 return sum;
}
struct Authored {int x;Authored():x(37){}};
int reject_authored(){static Authored object;return object.x;}
struct Nontrivial {unsigned x;~Nontrivial(){x=0;}unsigned get()const{return x;}};
unsigned reject_destructor(){static const Nontrivial table[]={{7u},{11u}};return table[0].get();}
'''
def run(command,cwd):
 r=subprocess.run(list(map(str,command)),cwd=cwd,capture_output=True,text=True,timeout=180)
 assert r.returncode==0,(command,r.stdout[-1400:],r.stderr[-2000:])
 return r.stdout.strip()
with tempfile.TemporaryDirectory(prefix='source-static-pod-') as directory:
 root=Path(directory);(root/'unit.cpp').write_text(SOURCE)
 (root/'main.cpp').write_text('#include <cstdio>\n#include "unit.cpp"\nint main(){for(unsigned n=0;n<1024;n++)printf("%u %u %u\\n",tick(n),other(n),method_table(n));}')
 run(['clang++','-std=c++14',root/'main.cpp','-o',root/'native.exe'],root)
 expected=run([root/'native.exe'],root).splitlines();modules=[]
 evaluator='''async ({url})=>{const m=await import(url),result=[];for(let n=0;n<1024;n++)result.push(m.tick(n)+' '+m.other(n)+' '+m.method_table(n));return result;}'''
 for mode in ('full','filtered'):
  command=[sys.executable,ROOT/'tools/source_ast_to_js.py','--root',root,'--source','unit.cpp','--out-dir',root/mode,'--require-record-layouts']
  if mode=='filtered':command+=['--filter','tick,other,method_table,reject_authored,reject_destructor','--exact-filter','--dependency-closure','--header-dependency-closure']
  run(command,ROOT);module=root/mode/'unit.cpp.mjs'
  rows={r['source_name']:r for r in json.loads(module.with_suffix('.manifest.json').read_text())['definitions']}
  for name in ('tick','other'):assert rows[name]['status']=='source-first' and rows[name].get('storage_constructor_count')==1,rows[name]
  assert rows['method_table']['status']=='source-first',rows['method_table']
  assert rows['reject_authored']['status']=='blocked',rows['reject_authored']
  assert rows['reject_destructor']['status']=='blocked',rows['reject_destructor']
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
print('PASS: 2,048 native/full/filtered Node'+('/Chromium' if browser_checked else '')+' rows; zero initialization, repeated calls, packed record assignment, static method tables, mutation through range aliases; authored constructors and nontrivial destructors rejected')
