"""Reference-only local closures retain native aliases and selected call bodies."""
import base64,json,os,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
SOURCE=r'''
struct Point { int x,y; };
int mutate(int n) { int total=n; auto f=[&](int x){total+=x;return total;};
 int a=f(2); total+=3; return a*3+f(n); }
int address(int n) { int value=n; int *p=&value;
 auto f=[&](int x){int *q=&value;*q+=x;return *p;};return f(7)+value; }
int refparam(int &value) { auto f=[&](int x){value+=x;return value;};return f(4); }
int refs(int n) { int v=n;int r=refparam(v);return r*2+v; }
int record(int n) { const Point p={n,3};const Point q={4,n+1};
 auto f=[&](const Point &a){return a.x*p.y+a.y*q.x;};return f(p)+f(q); }
int pair(int n) { int v=n;auto a=[&](int x){v+=x;return v;};
 auto b=[&](int x){return v-x;};int first=a(3);return first+b(2); }
int loop(int n) { int sum=0;for(int i=0;i<5;i++) {int v=n+i;
 auto f=[&](int x){v+=x;sum+=v;};f(i);v++;f(2);}return sum; }
int jump_with_closure(int n) { int sum=n;
 auto f=[&](int steps){for(int i=0;i<steps;i++){
  if(i==1)continue;sum+=i;if(sum==13)break;}return sum;};
 if(n&1)goto ready;
 {int value=f(3);sum+=value;}
 ready: {int value=f(5);return sum+value;}
}
int sink(int (*p)(int));
int byvalue(int n){auto f=[=](int x){return n+x;};return f(1);}
int copy(int n){auto f=[&](int x){return n+x;};auto g=f;return g(1);}
int object_address(int n){auto f=[&](int x){return n+x;};return (&f)==nullptr;}
int goto_value_capture(int n){auto f=[=](){return n;};if(n)goto ready; n++;ready:return f();}
auto escape(int &n){auto f=[&](int x){return n+x;};return f;}
'''
NAMES=['mutate','address','refs','record','pair','loop','jump_with_closure']
REJECT=['byvalue','copy','object_address','escape','goto_value_capture']
def run(command,cwd):
 r=subprocess.run(list(map(str,command)),cwd=cwd,capture_output=True,text=True,timeout=180)
 assert r.returncode==0,(command,r.stdout[-1500:],r.stderr[-2500:])
 return r.stdout.strip()
with tempfile.TemporaryDirectory(prefix='source-local-lambda-') as directory:
 root=Path(directory);(root/'unit.cpp').write_text(SOURCE)
 (root/'main.cpp').write_text('#include <cstdio>\n#include "unit.cpp"\nint main(){for(int n=-256;n<256;n++)printf("'+' '.join('%d' for _ in NAMES)+'\\n",'+','.join(name+'(n)' for name in NAMES)+');}')
 run(['clang++','-std=c++14',root/'main.cpp','-o',root/'native.exe'],root)
 expected=run([root/'native.exe'],root).splitlines();modules=[]
 evaluator='''async ({url,names})=>{const m=await import(url),result=[];for(let n=-256;n<256;n++)result.push(names.map(name=>m[name](n)).join(' '));return result;}'''
 for mode in ('full','filtered'):
  command=[sys.executable,ROOT/'tools/source_ast_to_js.py','--root',root,'--source','unit.cpp','--out-dir',root/mode]
  if mode=='filtered':command+=['--filter',','.join(NAMES+REJECT),'--exact-filter','--dependency-closure','--header-dependency-closure']
  run(command,ROOT);module=root/mode/'unit.cpp.mjs'
  rows={r['source_name']:r for r in json.loads(module.with_suffix('.manifest.json').read_text())['definitions']}
  for name in NAMES+['refparam']:
   assert rows[name]['status']=='source-first',rows[name]
   if name!='refs':assert rows[name].get('source_local_lambdas'),rows[name]
  for name in REJECT:assert rows[name]['status']=='blocked',rows[name]
  assert rows['jump_with_closure']['control_flow']['detected']['separate_reference_closures']==1
  argument={'url':module.as_uri(),'names':NAMES}
  (root/'run.mjs').write_text('console.log((await ('+evaluator+')('+json.dumps(argument)+')).join("\\n"));')
  actual=run(['node',root/'run.mjs'],ROOT).splitlines()
  assert actual==expected,next(((i,a,b) for i,(a,b) in enumerate(zip(actual,expected)) if a!=b),
                              (len(actual),len(expected)))
  modules.append(module)
 browser_checked=bool(os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'))
 if browser_checked:
  from playwright.sync_api import sync_playwright
  with sync_playwright() as p:
   browser=p.chromium.launch(executable_path=os.environ['EDUKE_CHROMIUM_EXECUTABLE'],headless=True);page=browser.new_page()
   for module in modules:
    assert page.evaluate(evaluator,{'url':'data:text/javascript;base64,'+base64.b64encode(module.read_bytes()).decode(),'names':NAMES})==expected
   browser.close()
print(f'PASS: {512*len(NAMES):,} native/full/filtered Node'+('/Chromium' if browser_checked else '')+' closure results; scalar mutation, address aliases, reference parameters, const record references, multiple closures, goto and loop lifetime; value captures/copies/addresses/escape rejected')
