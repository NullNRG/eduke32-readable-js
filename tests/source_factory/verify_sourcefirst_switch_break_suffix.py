"""Source case-entry jumps preserve pointer targets and the original switch exit."""
import base64,json,os,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
SOURCE=r"""
extern "C" int pointer_case(int mode,int n){
 int a=n,b=n+13,c=n-17;int*var=&a;
 switch(mode&7){
 case 0:var=&b;goto apply;
 case 1:var=&c;
 default:apply:*var=*var*3+7;*var^=n;break;
 case 2:a+=11;break;
 case 3:var=&b;goto apply;
 }
 return a*17+b*19+c*23;
}
extern "C" int pointer_loop(int n){
 int a=n,b=n+11,sum=0;int*p=&a;
 for(int i=0;i<9;i++){
  p=&a;
  switch((n+i)&3){
  case 0:p=&b;goto update;
  case 1:p=&b;
  default:update:*p+=i+3;if(n&1)*p-=2;break;
  case 2:a-=3;break;
  }
  sum+=a*3+b;
 }
 return sum+a+b;
}
int reject_nested(int n){int a=0;switch(n&1){case 0:switch(n&2){case 0:goto target;default:break;}break;default:target:a+=3;break;}return a;}
int reject_loop(int n){int a=0;switch(n&1){case 0:while(n<3){goto target;}break;default:target:a+=3;break;}return a;}
int reject_outside(int n){int a=0;if(n)goto target;switch(n&1){default:target:a+=3;break;}return a;}
int reject_entered(int n){int a=0;switch(n&1){case 0:goto target;default:{int v;target:v=9;a+=v;break;}}return a;}
"""
def run(args):
 p=subprocess.run(list(map(str,args)),cwd=ROOT,text=True,capture_output=True,timeout=180)
 assert p.returncode==0,(args,p.stdout[-1500:],p.stderr[-2600:]);return p.stdout
with tempfile.TemporaryDirectory(prefix='switch-break-source-',dir=ROOT/'work') as folder:
 root=Path(folder);(root/'unit.cpp').write_text(SOURCE)
 (root/'main.cpp').write_text('#include <cstdio>\nextern "C" int pointer_case(int,int),pointer_loop(int);int main(){for(int n=-128;n<128;n++){for(int mode=0;mode<8;mode++)printf("%d,",pointer_case(mode,n));printf("%d\\n",pointer_loop(n));}}\n')
 exe=root/'native.exe';run(['clang++','-std=c++14',root/'unit.cpp',root/'main.cpp','-o',exe]);expected=run([exe]).splitlines()
 for filtered in (False,True):
  out=root/str(filtered);args=[sys.executable,ROOT/'tools/source_ast_to_js.py','--root',root,'--source','unit.cpp','--out-dir',out,'--dependency-closure','--header-dependency-closure','--require-record-layouts']
  if filtered:args+=['--filter','pointer_case,pointer_loop,reject_nested,reject_loop,reject_outside,reject_entered','--exact-filter']
  run(args);module=out/'unit.cpp.mjs';d=json.loads(module.with_suffix('.manifest.json').read_text());rows={r['name']:r for r in d['definitions']}
  for name in ('pointer_case','pointer_loop'):
   assert rows[name]['status']=='source-first',rows[name]
   assert rows[name]['control_flow']['detected']['same_switch_terminal_break_jumps']>0,rows[name]
  for name in ('reject_nested','reject_loop','reject_outside','reject_entered'):assert rows[name]['status']=='blocked',rows[name]
  expression='async url=>{const m=await import(url),out=[];for(let n=-128;n<128;n++)out.push([...Array.from({length:8},(_,mode)=>m.pointer_case(mode,n)),m.pointer_loop(n)].join(","));return out;}'
  runner=root/'run.mjs';runner.write_text('console.log(JSON.stringify(await ('+expression+')('+json.dumps(module.as_uri())+')));');assert json.loads(run(['node',runner]))==expected
  if os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'):
   from playwright.sync_api import sync_playwright
   with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path=os.environ['EDUKE_CHROMIUM_EXECUTABLE'],headless=True)
    try:
     page=browser.new_page();actual=page.evaluate(expression,'data:text/javascript;base64,'+base64.b64encode(module.read_bytes()).decode());assert actual==expected,(actual[:2],expected[:2])
    finally:browser.close()
print('PASS 4608 native/full/filtered Node and Chromium values: case-entry suffixes preserve pointer mutation, fallthrough and enclosing loop order; nested-loop/switch, outside-entry and entered-local transfers rejected')
