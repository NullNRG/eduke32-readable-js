"""Backward branches retry exact original tails without a generated program counter."""
import base64,json,os,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
SOURCE=r'''
int calls,stamp,tests;
int mark(int n){++calls;stamp=stamp*5+n%7+3;return n*17+calls;}
int guard(int value){++tests;return value;}
void solve(int n,int* ceilingOut,int* floorOut){
 int didCeiling=0;int didFloor=0;int sector=0;int next=0;
 if(n&1){sector=-1;next=n&3;while(next>0){--next;++sector;}
  if(sector>=0){ceiling:*ceilingOut=mark(sector);didCeiling=1;}}
 if(n&2){sector=-1;next=(n>>2)&3;while(next>0){--next;++sector;}
  if(sector>=0){floor:*floorOut=mark(sector);didFloor=1;}}
 sector=n;
 if(guard(!didCeiling))goto ceiling;else if(guard(!didFloor))goto floor;
}
void nested_else(int n,int*out){
 int done=0;int value=n;
 if(n&1){*out=mark(1);}else{if(n&2){*out=mark(2);}else{target:*out=mark(value);done=1;}stamp+=3;}
 value+=7;
 if(!done)goto target;
}
int exercise(int n){int ceiling=0,floor=0;calls=stamp=tests=0;solve(n,&ceiling,&floor);return ceiling*3+floor*7+calls*13+tests*19+stamp*23;}
int alternate(int n){int out=0;calls=stamp=tests=0;nested_else(n,&out);return out*7+calls*13+stamp*23;}
void reject_loop(int n,int*out){int done=0;while(n>0){target:*out=n;break;}if(!done){done=1;goto target;}}
'''
def run(args,cwd=ROOT):
 r=subprocess.run(list(map(str,args)),cwd=cwd,capture_output=True,text=True,timeout=180)
 assert r.returncode==0,(args,r.stdout[-1000:],r.stderr[-2000:]);return r.stdout.strip()
with tempfile.TemporaryDirectory(prefix='source-backward-tails-') as directory:
 root=Path(directory);(root/'unit.cpp').write_text(SOURCE)
 (root/'main.cpp').write_text('#include <cstdio>\n#include "unit.cpp"\nint main(){for(int n=-256;n<768;n++)printf("%d %d\\n",exercise(n),alternate(n));}')
 run(['clang++','-std=c++14',root/'main.cpp','-o',root/'native.exe'])
 expected=run([root/'native.exe']).splitlines();modules=[]
 evaluator='''async({url})=>{const m=await import(url),rows=[];for(let n=-256;n<768;n++)rows.push(m.exercise(n)+' '+m.alternate(n));return rows;}'''
 for mode in ('full','filtered'):
  args=[sys.executable,ROOT/'tools/source_ast_to_js.py','--root',root,'--source','unit.cpp','--out-dir',root/mode]
  if mode=='filtered':args+=['--filter','exercise,alternate,reject_loop','--exact-filter','--dependency-closure','--header-dependency-closure']
  run(args);module=root/mode/'unit.cpp.mjs';doc=json.loads(module.with_suffix('.manifest.json').read_text())
  rows={r['name']:r for r in doc['definitions']}
  for name in ('exercise','alternate','solve','nested_else'):assert rows[name]['status']=='source-first',rows[name]
  for name in ('solve','nested_else'):assert rows[name]['control_flow']['strategy']=='source-postlude-backward-tail-retries',rows[name]
  assert rows['reject_loop']['status']=='blocked',rows['reject_loop']
  text=module.read_text();assert '__source_resume' not in text and 'switch (' not in text
  (root/'run.mjs').write_text('console.log((await ('+evaluator+')('+json.dumps({'url':module.as_uri()})+')).join("\\n"));')
  actual=run(['node',root/'run.mjs']).splitlines();assert actual==expected,next(((i,a,b) for i,(a,b) in enumerate(zip(actual,expected)) if a!=b),('length',len(actual),len(expected)))
  modules.append(module)
 if os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'):
  from playwright.sync_api import sync_playwright
  with sync_playwright() as p:
   browser=p.chromium.launch(executable_path=os.environ['EDUKE_CHROMIUM_EXECUTABLE'],headless=True);page=browser.new_page()
   for module in modules:assert page.evaluate(evaluator,{'url':'data:text/javascript;base64,'+base64.b64encode(module.read_bytes()).decode()})==expected
   browser.close()
print('PASS: 4096 native/full/filtered Node and optional Chromium results; backward conditional tails, exact repeated callbacks/conditions, nested else targets and original postludes; loop entry rejected, no program counter')
