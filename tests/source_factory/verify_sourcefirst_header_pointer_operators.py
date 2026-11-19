"""An original header operator mutates an existing object without constructing it."""
import base64,json,os,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def run(args):
 p=subprocess.run(list(map(str,args)),cwd=ROOT,capture_output=True,text=True,timeout=180)
 assert p.returncode==0,(args,p.stdout[-1200:],p.stderr[-2000:])
 return p.stdout
with tempfile.TemporaryDirectory(prefix='header-object-operator-',dir=ROOT/'work') as folder:
 root=Path(folder)
 (root/'fixed.hpp').write_text("struct Fixed { int value; explicit Fixed(int n):value(n){} Fixed& operator+=(int n){value+=n*3;return *this;} Fixed& operator-=(int n){value-=n*2;return *this;} };\nstruct Unsafe {int* value;explicit Unsafe(int*p):value(p){} Unsafe& operator+=(int n){*value+=n;return *this;}};\n")
 (root/'unit.cpp').write_text('#include "fixed.hpp"\nextern "C" int modify(Fixed* p,int n){*p+=n;*p-=n-1;return p->value;}\nint reject_unsafe(Unsafe*p,int n){*p+=n;return *p->value;}\n')
 (root/'main.cpp').write_text('#include <cstdio>\n#include "fixed.hpp"\nextern "C" int modify(Fixed*,int);int main(){for(int n=-256;n<256;n++){Fixed p(n*11);Fixed*alias=&p;int a=modify(&p,n),b=alias->value,c=modify(alias,1-n);printf("%d,%d,%d,%d\\n",a,b,c,p.value);}}\n')
 exe=root/'native.exe';run(['clang++','-std=c++14',root/'unit.cpp',root/'main.cpp','-o',exe]);expected=run([exe]).splitlines()
 for filtered in (False,True):
  out=root/str(filtered);command=[sys.executable,ROOT/'tools/source_ast_to_js.py','--root',root,'--source','unit.cpp','--out-dir',out,'--header-dependency-closure','--dependency-closure','--require-record-layouts']
  if filtered:command+=['--filter','modify,reject_unsafe','--exact-filter']
  run(command);module=out/'unit.cpp.mjs';doc=json.loads(module.with_suffix('.manifest.json').read_text());rows={r['name']:r for r in doc['definitions']}
  assert rows['modify']['status']=='source-first' and rows['Fixed']['status']=='source-first',rows
  assert rows['reject_unsafe']['status']=='blocked',rows
  assert rows['Fixed']['odr_inline']['source_header']=='fixed.hpp',rows['Fixed']
  expression='async url=>{const m=await import(url),C=m.Fixed(),out=[];for(let n=-256;n<256;n++){const p=new C(n*11),alias=p;const a=m.modify(p,n),b=alias.value,c=m.modify(alias,1-n);out.push([a,b,c,p.value].join(","));}return out;}'
  runner=root/'run.mjs';runner.write_text('console.log(JSON.stringify(await ('+expression+')('+json.dumps(module.as_uri())+')));')
  assert json.loads(run(['node',runner]))==expected
  if os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'):
   from playwright.sync_api import sync_playwright
   with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path=os.environ['EDUKE_CHROMIUM_EXECUTABLE'],headless=True)
    try:
     page=browser.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
     actual=page.evaluate(expression,'data:text/javascript;base64,'+base64.b64encode(module.read_bytes()).decode())
     assert actual==expected and not errors,(actual[:3],expected[:3],errors)
    finally:browser.close()
print('PASS 4096 native/full/filtered Node and Chromium values: original header operators mutate one existing object, preserve aliases, and reject unproven pointer-owning class factories')
