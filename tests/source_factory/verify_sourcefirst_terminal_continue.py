"""Native/browser parity of sibling-branch cleanup jumps to the same loop."""
import base64,json,os,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
SOURCE=r'''
int sibling_cleanup(int n){
 int sum=0,remaining=8,values[8]={0};
 for(int i=7;i>=0;--i){
  int const projected=(i*17+n)%51;
  if(projected>13){
   int const clipped=projected*3;
   if(clipped>90)goto discard;
   values[i]=clipped;
  }else if((i+n)%3==0){
discard:
   {--remaining;values[i]=-100-i;sum+=remaining;continue;}
  }
  sum+=values[i]+i;
 }
 for(int i=0;i<8;i++)sum+=values[i]*(i+1);
 return sum;
}
int while_cleanup(int n){
 int i=0,sum=0;
 while(i<11){
  ++i;
  if((n+i)%5==0){int temporary=i*2;if(temporary>4)goto skip;}
  else if(i%3==0){skip:{sum-=i;continue;}}
  sum+=i*n;
 }
 return sum;
}
int shadowed=17;
int reject_shadow(int n){int sum=0;for(int i=0;i<3;i++){
 if(n){int shadowed=i+1;if(shadowed)goto finish;}
 else {finish:{sum+=shadowed;continue;}}
 }return sum;}
int reject_other_loop(int n){int sum=0;for(int i=0;i<3;i++){
 if(n){for(int j=0;j<3;j++){if(j==n)goto finish;}}
 else {finish:{sum+=i;continue;}}
 }return sum;}
int destroyed=0;
struct Watch {~Watch(){++destroyed;}};
int reject_cleanup_order(int n){int sum=0;for(int i=0;i<3;i++){
 if(n){Watch value;goto finish;}
 else {finish:{sum+=destroyed;continue;}}
 }return sum;}
'''
def run(command,cwd):
 result=subprocess.run(list(map(str,command)),cwd=cwd,capture_output=True,text=True,timeout=180)
 assert result.returncode==0,(command,result.stdout[-2000:],result.stderr[-3500:])
 return result.stdout.strip()
with tempfile.TemporaryDirectory(prefix='source-continue-suffix-') as temporary:
 root=Path(temporary);(root/'unit.cpp').write_text(SOURCE)
 (root/'main.cpp').write_text('#include <cstdio>\n#include "unit.cpp"\nint main(){for(int n=0;n<512;n++)printf("%d,%d\\n",sibling_cleanup(n),while_cleanup(n));}')
 run(['clang++','-std=c++14','main.cpp','-o',root/'native.exe'],root)
 expected=run([root/'native.exe'],root).splitlines()
 modules=[]
 for mode in ('full','filtered'):
  command=[sys.executable,ROOT/'tools/source_ast_to_js.py','--root',root,'--source','unit.cpp','--out-dir',root/mode]
  if mode=='filtered':command+=['--filter','sibling_cleanup,while_cleanup','--exact-filter']
  run(command,root);module=root/mode/'unit.cpp.mjs';modules.append(module)
  rows={row['source_name']:row for row in json.loads(module.with_suffix('.manifest.json').read_text())['definitions']}
  for name in ('sibling_cleanup','while_cleanup'):
   assert rows[name]['status']=='source-first',rows[name]
   assert rows[name]['control_flow']['strategy']=='source-same-loop-terminal-continue-suffixes',rows[name]
  if mode=='full':
   for name in ('reject_shadow','reject_other_loop','reject_cleanup_order'):
    assert rows[name]['status']=='blocked',rows[name]
  run(['node','--check',module],root)
  evaluator='async url=>{const m=await import(url);return Array.from({length:512},(_,n)=>[m.sibling_cleanup(n),m.while_cleanup(n)].join(","));}'
  (root/'run.mjs').write_text('console.log((await ('+evaluator+')('+json.dumps(module.as_uri())+')).join("\\n"));')
  assert run(['node',root/'run.mjs'],root).splitlines()==expected
 browser_checked=bool(os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'))
 if browser_checked:
  from playwright.sync_api import sync_playwright
  with sync_playwright() as p:
   browser=p.chromium.launch(executable_path=os.environ['EDUKE_CHROMIUM_EXECUTABLE'],headless=True)
   page=browser.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   for module in modules:
    assert page.evaluate(evaluator,'data:text/javascript;base64,'+base64.b64encode(module.read_bytes()).decode())==expected
   assert not errors,errors
   browser.close()
print('PASS: 1,024 native/full/filtered Node results'+(' and Chromium comparisons' if browser_checked else '; Chromium not configured')+'; sibling and while cleanup suffixes, original continue ownership and post-loop state; shadowed references, changed loop owner and nontrivial destruction ordering stay blocked')
