"""Original branch tails/postludes and uninitialized trivial target locals."""
import base64,json,os,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
SOURCE=r'''
void draw(int mode,int n,int *out) {
 int common=n+3;
 if(mode==0) {
  int scale=n*2;
  if(n&1)goto fallback;
  *out=scale;
 } else if(mode==1) {
  int start,end;
 fallback:
  if(n<0){*out=-111;return;}
  start=n%5;end=start+4;
  int sum=0;
  for(int i=start;i<end;i++){if(i==7)break;sum+=i+common;}
  *out=sum;
 } else {
  *out=0;
  for(int i=0;i<5;i++) {
   if(i==(n&3))goto next;
   *out+=i*n;
 next:
   *out+=3;
  }
 }
 *out+=common*7;
}
int exercise(int n) {int a=0,b=0,c=0;draw(0,n,&a);draw(1,n,&b);draw(2,n,&c);return a*17+b*3+c;}
int global=29;
void reject_shadow(int n,int*out){if(n){int global=4;goto done;}else {done:*out=global;}*out+=3;}
struct Guard{~Guard(){global++;}};
void reject_lifetime(int n,int*out){if(n){Guard g;goto done;}else {done:*out=global;}*out+=3;}
void reject_loop(int n,int*out){int i=0;if(n){goto done;}else {while(i<3){done:*out+=i++;}}}
'''
def run(command,cwd):
 r=subprocess.run(list(map(str,command)),cwd=cwd,capture_output=True,text=True,timeout=180)
 assert r.returncode==0,(command,r.stdout[-1500:],r.stderr[-2000:])
 return r.stdout.strip()
with tempfile.TemporaryDirectory(prefix='source-sibling-tail-') as directory:
 root=Path(directory);(root/'unit.cpp').write_text(SOURCE)
 (root/'main.cpp').write_text('#include <cstdio>\n#include "unit.cpp"\nint main(){for(int n=-256;n<768;n++)printf("%d\\n",exercise(n));}')
 run(['clang++','-std=c++14',root/'main.cpp','-o',root/'native.exe'],root)
 expected=run([root/'native.exe'],root).splitlines();modules=[]
 evaluator='''async ({url})=>{const m=await import(url),result=[];for(let n=-256;n<768;n++)result.push(String(m.exercise(n)));return result;}'''
 for mode in ('full','filtered'):
  command=[sys.executable,ROOT/'tools/source_ast_to_js.py','--root',root,'--source','unit.cpp','--out-dir',root/mode]
  if mode=='filtered':command+=['--filter','exercise,reject_shadow,reject_lifetime,reject_loop','--exact-filter','--dependency-closure','--header-dependency-closure']
  run(command,ROOT);module=root/mode/'unit.cpp.mjs'
  rows={r['source_name']:r for r in json.loads(module.with_suffix('.manifest.json').read_text())['definitions']}
  for name in ('exercise','draw'):assert rows[name]['status']=='source-first',rows[name]
  for name in ('reject_shadow','reject_lifetime','reject_loop'):assert rows[name]['status']=='blocked',rows[name]
  (root/'run.mjs').write_text('console.log((await ('+evaluator+')('+json.dumps({'url':module.as_uri()})+')).join("\\n"));')
  actual=run(['node',root/'run.mjs'],ROOT).splitlines()
  assert actual==expected,next(((i,a,b) for i,(a,b) in enumerate(zip(actual,expected)) if a!=b),('length',len(actual),len(expected)))
  modules.append(module)
 browser_checked=bool(os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'))
 if browser_checked:
  from playwright.sync_api import sync_playwright
  with sync_playwright() as p:
   browser=p.chromium.launch(executable_path=os.environ['EDUKE_CHROMIUM_EXECUTABLE'],headless=True);page=browser.new_page()
   for module in modules:
    assert page.evaluate(evaluator,{'url':'data:text/javascript;base64,'+base64.b64encode(module.read_bytes()).decode()})==expected
   browser.close()
print('PASS: 1,024 native/full/filtered Node'+('/Chromium' if browser_checked else '')+' checks covering sibling branches, original common postlude, early return, target locals and independent loop jumps; shadow capture, nontrivial lifetime and entering a loop rejected')
