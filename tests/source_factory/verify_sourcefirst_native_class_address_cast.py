"""Borrow an existing native scalar class through its original integer address."""
import base64,json,os,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def run(args):
 p=subprocess.run(list(map(str,args)),cwd=ROOT,capture_output=True,text=True,timeout=180)
 assert p.returncode==0,(args,p.stdout[-1500:],p.stderr[-2200:])
 return p.stdout
with tempfile.TemporaryDirectory(prefix='native-class-cast-',dir=ROOT/'work') as folder:
 root=Path(folder)
 (root/'cell.hpp').write_text('#include <stdint.h>\nextern int constructors;struct Cell {int value;explicit Cell(int n):value(n){constructors++;}Cell&operator+=(int n){value+=n*3;return *this;}};struct PointerOwner {int* p;explicit PointerOwner(int*x):p(x){}PointerOwner&operator+=(int n){*p+=n;return *this;}};\n')
 (root/'unit.cpp').write_text('#include "cell.hpp"\nint constructors;extern "C" int borrow(uintptr_t address,int n){Cell*p=(Cell*)address;*p+=n;return p->value;}extern "C" int calls(){return constructors;}int reject(uintptr_t address,int n){PointerOwner*p=(PointerOwner*)address;*p+=n;return *p->p;}\n')
 (root/'main.cpp').write_text('#include <cstdio>\n#include "cell.hpp"\nextern "C" int borrow(uintptr_t,int),calls();int main(){for(int n=-128;n<128;n++){Cell p(n*13);constructors=0;int a=borrow((uintptr_t)&p,n+3);printf("%d,%d,%d\\n",a,p.value,calls());}}\n')
 exe=root/'native.exe';run(['clang++','-std=c++14',root/'unit.cpp',root/'main.cpp','-o',exe]);expected=run([exe]).splitlines()
 for filtered in (False,True):
  out=root/str(filtered);args=[sys.executable,ROOT/'tools/source_ast_to_js.py','--root',root,'--source','unit.cpp','--out-dir',out,'--require-record-layouts','--header-dependency-closure','--dependency-closure']
  if filtered:args+=['--filter','borrow,calls,reject','--exact-filter']
  run(args);module=out/'unit.cpp.mjs';doc=json.loads(module.with_suffix('.manifest.json').read_text());rows={r['name']:r for r in doc['definitions']};assert rows['borrow']['status']=='source-first',rows;assert rows['reject']['status']=='blocked',rows
  expression='async url=>{const m=await import(url),space=globalThis[Symbol.for("source-lp64-addresses/2")],out=[];for(let n=-128;n<128;n++){const bytes=new Int32Array([n*13,1234567,7654321]),address=space.encode(bytes),a=m.borrow(address,n+3);if(bytes[1]!==1234567||bytes[2]!==7654321)throw Error("native bounds changed");out.push([a,bytes[0],m.calls()].join(","));let rejected=false;try{m.borrow(address+BigInt(bytes.byteLength),1);}catch(e){rejected=e instanceof RangeError;}if(!rejected)throw Error("one-past class dereference accepted");}return out;}'
  runner=root/'run.mjs';runner.write_text('console.log(JSON.stringify(await ('+expression+')('+json.dumps(module.as_uri())+')));');assert json.loads(run(['node',runner]))==expected
  if os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'):
   from playwright.sync_api import sync_playwright
   with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path=os.environ['EDUKE_CHROMIUM_EXECUTABLE'],headless=True)
    try:
     page=browser.new_page();actual=page.evaluate(expression,'data:text/javascript;base64,'+base64.b64encode(module.read_bytes()).decode());assert actual==expected,(actual[:4],expected[:4])
    finally:browser.close()
print('PASS 1536 native/full/filtered Node and Chromium values: original methods mutate borrowed native bytes, constructors do not run, canaries and bounds hold; unproven pointer-owning views rejected')
