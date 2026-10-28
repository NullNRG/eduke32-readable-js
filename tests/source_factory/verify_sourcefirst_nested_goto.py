"""Native and browser parity for lexical jumps in original loop scopes.

In particular, inserted backward loops must not capture a source break or
continue. This tests execution and alias/initializer side effects, not merely
that a formerly blocked AST node is accepted.
"""
import base64, hashlib, json, os, subprocess, sys, tempfile
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
SOURCE=r'''
int nested_forward(int n){
 int sum=0;
 for(int i=0;i<8;i++){
  int value=i+n;
  if(value%3==0)goto append;
  for(int j=0;j<4;j++){
   if(j==n%4)goto append;
   if(j==2)continue;
   value+=j;
  }
  value*=2;
 append:sum+=value;
  if(sum>110)break;
 }
 return sum;
}
int nested_backward(int n){
 int sum=0;
 for(int i=0;i<7;i++){
  int pass=0;
 again:++pass;sum+=3+i;
  if(i==n%7)continue;
  if(pass==3)break;
  if(pass<2+n%3)goto again;
  sum+=17;
 }
 return sum;
}
int nested_switch(int n){
 int sum=0;
 for(int i=0;i<6;i++){
  switch((n+i)%3){
   case 0:{int step=0;
    retry:sum+=i+1;++step;
    if(step==1 && i%2)continue;
    if(step==2)break;
    goto retry;
   }
   case 1:sum+=7;break;
   default:sum+=11;break;
  }
  sum+=19;
 }
 return sum;
}
int nested_do_while(int n){
 int sum=0,i=0;
 do{
  ++i;int step=0;
 retry:++step;sum+=i;
  if(i==2)continue;
  if(i==n%5+1)break;
  if(step<2)goto retry;
  sum+=5;
 }while(i<7);
 while(i<12){
  ++i;
  if(i==n%4+8)goto end;
  sum+=3;
 end:sum+=i;
 }
 return sum;
}
int nested_alias(int n){
 int sum=0;
 for(int i=0;i<5;i++){
  int x=n+i,step=0;int &r=x;int *p=&x;
 retry:r+=3;++step;
  if(step<3 && i!=2)goto retry;
  sum+=*p+100*(&r==p);
  {int x=i;int &r=x;r+=2;if(i%2)goto tail;sum+=r;}
 tail:sum+=7;
 }
 return sum;
}
int nested_range(int n){
 int values[4]={1,2,3,4},sum=0;
 for(int &value:values){
  int step=0;
 retry:++step;value+=2;
  if(value%3==n%3)continue;
  if(step<2)goto retry;
  sum+=value;
 }
 return sum+values[0]*3+values[1]*5+values[2]*7+values[3]*11;
}
int nested_reentry(int n){
 int sum=0,round=0;
 restart:++round;
 for(int i=0;i<4;i++){
  if(round==1 && i==n%4)goto restart;
  if(i%2)goto append;
  sum+=3;
 append:sum+=7;
 }
 return sum+round*100;
}
int nested_addressed_for(int n){
 int sum=0;
 for(int i=0;i<6;i++){
  int &r=i;
  if(i==n%6)goto next;
  sum+=r;
 next:if(i==2)continue;sum+=i*3;
 }
 return sum;
}
// Legal C++ side entry is intentionally rejected until a separate proof can
// preserve the skipped loop initializer/condition and lexical declarations.
int unproven_side_entry(int n){
 int i=0;if(n)goto inside;
 while(i<3){inside:++i;}
 return i;
}
'''
FUNCTIONS=('nested_forward','nested_backward','nested_switch','nested_do_while',
           'nested_alias','nested_range','nested_reentry','nested_addressed_for')

def run(args,cwd):
 p=subprocess.run(args,cwd=cwd,capture_output=True,text=True,timeout=180)
 assert p.returncode==0,(args,p.stdout[-2000:],p.stderr[-4000:])
 return p.stdout.strip()

with tempfile.TemporaryDirectory(prefix='eduke-nested-goto-') as directory:
 root=Path(directory);(root/'unit.cpp').write_text(SOURCE)
 (root/'main.cpp').write_text('#include <cstdio>\n#include "unit.cpp"\nint main(){for(int n=0;n<512;n++)printf("'
  +','.join('%d' for _ in FUNCTIONS)+'\\n",'+','.join(f+'(n)' for f in FUNCTIONS)+');}')
 native=root/'native.exe';run(['clang++','-std=c++14','main.cpp','-o',str(native)],root)
 expected=run([str(native)],root).splitlines()
 run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(root),
      '--source','unit.cpp','--out-dir',str(root/'out')],root)
 module=root/'out/unit.cpp.mjs';manifest=json.loads(module.with_suffix('.manifest.json').read_text())
 rows={r['source_name']:r for r in manifest['definitions']}
 for name in FUNCTIONS:
  assert rows[name]['status']=='source-first',rows[name]
  assert rows[name]['control_flow']['detected']['nested_lexical_jumps']>0,rows[name]
 assert rows['unproven_side_entry']['status']=='blocked',rows['unproven_side_entry']
 assert 'different lexical scope' in rows['unproven_side_entry']['reason'],rows['unproven_side_entry']
 run(['node','--check',str(module)],root)
 js='async url=>{const m=await import(url),result=[];for(let n=0;n<512;n++)result.push(['+','.join('m.'+f+'(n)' for f in FUNCTIONS)+'].join(","));return result;}'
 (root/'run.mjs').write_text('console.log((await ('+js+')('+json.dumps(module.as_uri())+')).join("\\n"));')
 actual=run(['node',str(root/'run.mjs')],root).splitlines()
 assert actual==expected,next(((i,a,b) for i,(a,b) in enumerate(zip(actual,expected)) if a!=b),('length',len(actual),len(expected)))
 from playwright.sync_api import sync_playwright
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path=os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'),headless=True)
  page=browser.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  observed=page.evaluate(js,'data:text/javascript;base64,'+base64.b64encode(module.read_bytes()).decode())
  assert observed==expected and not errors,(errors,observed[:2],expected[:2])
  version=browser.version;browser.close()
 report={'format':'source-lexical-nested-goto-parity/1','passed':True,
  'native_node_cases':512,'native_chromium_cases':512,'compared_values':512*len(FUNCTIONS),
  'functions':list(FUNCTIONS),'browser_version':version,
  'compiler_sha256':hashlib.sha256((ROOT/'tools/source_ast_to_js.py').read_bytes()).hexdigest(),
  'flow_sha256':hashlib.sha256((ROOT/'tools/source_control_flow.py').read_bytes()).hexdigest(),
  'checks':['forward and backward lexical jumps','original break/continue ownership across inserted loops',
   'switch exits and continue to enclosing loop','do/while and range-loop iteration',
   'borrowed/shadowed locals and single for-init storage','nested-to-outer restart',
   'unproven side entry rejected'],'gameplay_verified':False}
 (ROOT/'reports/oct19-nested-goto-parity.json').write_text(json.dumps(report,indent=2)+'\n')
 print(json.dumps(report,indent=2))
