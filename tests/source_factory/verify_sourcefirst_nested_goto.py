"""Native and browser parity for lexical jumps in original loop scopes.

In particular, inserted backward loops must not capture a source break or
continue. This tests execution and alias/initializer side effects, not merely
that a formerly blocked AST node is accepted.
"""
import base64, hashlib, json, os, subprocess, sys, tempfile
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
SOURCE=r'''
#include <stdlib.h>
int nested_fatal(int n){
 int status=15;
 if(n==1){
 fatal:status+=n;exit(status);
 }
 if(n==2)goto fatal;
 return 97;
}
int reject_fallthrough_side_entry(int n){
 int result=0;
 if(n)goto inside;
 if(n==0){inside:result+=8;}
 return result;
}
int forward_if_label(int n){
 int result=0;
 if(n&1)goto inside;
 if(++result && n%3==0)
 inside:result+=8;
 return result;
}
int case_suffixes(int n){
 int acc=0;
 for(int i=0;i<12;++i){
  switch((n+i)%6){
  case 0: acc+=11;goto also;
  case 1: {
   if((n+i)%7==0){
   append:acc+=17+i;continue;
   }
   acc+=3;continue;
  }
  case 2:
  also: {
   int prior=acc;
   acc+=13;
   if(prior%2)goto append;
   continue;
  }
  case 3:goto append;
  case 4:{
   int step=0;
   retry:acc+=2;++step;
   if(step<2)goto retry;
   continue;
  }
  default:acc+=29;continue;
  }
 }
 return acc;
}
int flat_case_suffix(int n){
 int acc=0;
 for(int i=0;i<12;i++){
  switch((n+i)%3){
  case 0:if(n%5==0)goto fault;acc+=3;continue;
  case 1:if(n%7==0)goto fault;acc+=5;continue;
  default:
  fault:do{acc+=11+i;acc^=n;}while(0);continue;
  }
 }
 return acc;
}
int flat_dispatch_exit(int n){
 int acc=0;
 if(n==511)goto outer_done;
 for(int i=0;i<12;i++){
  switch((n+i)%3){
  case 0:if(n%5==0)goto fault;acc+=3;break;
  case 1:if(n%7==0)goto fault;acc+=5;break;
  default:acc+=7;break;
  fault:acc+=11+i;acc^=n;continue;
  }
  acc+=13;
 }
 outer_done:return acc;
}
int local_record(int n){
 struct Value{int x;Value(const Value&other):x(other.x){}};
 int result=n;
 if(n&1)goto done;
 result+=4;
 done:return result;
}
int local_copy(int n){
 struct CopyFields{int x;};
 CopyFields first{n};CopyFields second=first;
 if(n&1)goto done;
 second.x+=4;
 done:return second.x;
}
int local_anonymous(int n){
 struct{int x;}value;
 value.x=n;if(n&1)goto done;
 value.x+=4;
 done:return value.x;
}
int anonymous_nontrivial(int n){
 struct Life{~Life(){}};
 struct{Life field;}value;
 if(n)goto done;
 done:return n;
}
int reject_wrong_continue_owner(int n){
 int sum=0;
 for(int i=0;i<2;i++){
  for(int j=0;j<2;j++)if(n)goto outer;
  if(!n){
   outer:++sum;continue;
  }
 }
 return sum;
}
int reject_recursive_suffix(int n){
 for(int i=0;i<2;++i){
  if(n){first:if(n>2)goto second;continue;}
  if(n){second:if(n>2)goto first;continue;}
 }
 return n;
}
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
           'nested_alias','nested_range','nested_reentry','nested_addressed_for','case_suffixes','forward_if_label','flat_case_suffix','flat_dispatch_exit','local_record','local_copy','local_anonymous')

def run(args,cwd):
 p=subprocess.run(args,cwd=cwd,capture_output=True,text=True,timeout=180)
 assert p.returncode==0,(args,p.stdout[-2000:],p.stderr[-4000:])
 return p.stdout.strip()

with tempfile.TemporaryDirectory(prefix='eduke-nested-goto-') as directory:
 root=Path(directory);(root/'unit.cpp').write_text(SOURCE)
 (root/'main.cpp').write_text('#include <cstdio>\n#include "unit.cpp"\nint main(int argc,char**argv){if(argc>1)return nested_fatal(atoi(argv[1]));for(int n=0;n<512;n++)printf("'
  +','.join('%d' for _ in FUNCTIONS)+'\\n",'+','.join(f+'(n)' for f in FUNCTIONS)+');}')
 native=root/'native.exe';run(['clang++','-std=c++14','main.cpp','-o',str(native)],root)
 expected=run([str(native)],root).splitlines()
 run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(root),
      '--source','unit.cpp','--out-dir',str(root/'out'),'--require-record-layouts'],root)
 module=root/'out/unit.cpp.mjs';manifest=json.loads(module.with_suffix('.manifest.json').read_text())
 rows={r['source_name']:r for r in manifest['definitions']}
 for name in FUNCTIONS:
  assert rows[name]['status']=='source-first',rows[name]
  detection='forward_unbraced_if_label' if name=='forward_if_label' else 'nested_lexical_jumps'
  if name in ('flat_case_suffix','flat_dispatch_exit'):detection='same_loop_terminal_jumps'
  if name in ('local_record','local_copy','local_anonymous'):detection='forward_goto'
  assert rows[name]['control_flow']['detected'].get(detection,0)>0,rows[name]
 assert rows['unproven_side_entry']['status']=='blocked',rows['unproven_side_entry']
 assert 'different lexical scope' in rows['unproven_side_entry']['reason'],rows['unproven_side_entry']
 assert rows['reject_fallthrough_side_entry']['status']=='blocked',rows['reject_fallthrough_side_entry']
 assert rows['anonymous_nontrivial']['status']=='blocked' and 'lifetime' in rows['anonymous_nontrivial']['reason'],rows['anonymous_nontrivial']
 assert rows['case_suffixes']['control_flow']['detected']['same_loop_terminal_jumps']==3
 assert 'loop ownership' in rows['reject_wrong_continue_owner']['reason'],rows['reject_wrong_continue_owner']
 assert 'recursive copied source suffix' in rows['reject_recursive_suffix']['reason'],rows['reject_recursive_suffix']
 assert rows['nested_fatal']['status']=='source-first',rows['nested_fatal']
 assert rows['nested_fatal']['control_flow']['detected']['nested_terminal_jumps']==1
 expected_fatal=[subprocess.run([str(native),str(n)],cwd=root,timeout=10).returncode for n in range(3)]
 assert expected_fatal==[97,16,17],expected_fatal
 fatal_js='''async url=>{const m=await import(url);return [0,1,2].map(n=>{
  try{return m.nested_fatal(n);}catch(e){if(e.name!=="CProcessExit")throw e;return e.status;}
 });}'''
 (root/'fatal.mjs').write_text('console.log(JSON.stringify(await ('+fatal_js+')('+json.dumps(module.as_uri())+')));')
 assert json.loads(run(['node',str(root/'fatal.mjs')],root))==expected_fatal
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
  assert page.evaluate(fatal_js,'data:text/javascript;base64,'+base64.b64encode(module.read_bytes()).decode())==expected_fatal
  version=browser.version;browser.close()
 report={'format':'source-lexical-nested-goto-parity/1','passed':True,
  'native_node_cases':512,'native_chromium_cases':512,'compared_values':512*len(FUNCTIONS),
  'functions':list(FUNCTIONS),'browser_version':version,
  'compiler_sha256':hashlib.sha256((ROOT/'tools/source_ast_to_js.py').read_bytes()).hexdigest(),
  'flow_sha256':hashlib.sha256((ROOT/'tools/source_control_flow.py').read_bytes()).hexdigest(),
  'checks':['forward and backward lexical jumps','original break/continue ownership across inserted loops',
   'switch exits and continue to enclosing loop','do/while and range-loop iteration',
   'borrowed/shadowed locals and single for-init storage','nested-to-outer restart',
   'direct Clang noreturn side entry preserves exit status',
   'switch-arm terminal suffixes preserve loop ownership and ordered continuation',
   'unproven, cross-loop and cyclic copied side entries rejected'],'gameplay_verified':False}
 (ROOT/'reports/oct19-nested-goto-parity.json').write_text(json.dumps(report,indent=2)+'\n')
 print(json.dumps(report,indent=2))
