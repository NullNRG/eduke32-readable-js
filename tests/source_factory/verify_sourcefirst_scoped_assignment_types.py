"""Assignments use Clang lvalue types after a differently typed shadow exits."""
import base64,json,os,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
SOURCE=r'''
int narrow_counter(int n){
 int i=0,sum=0;
 {for(long long i=0;i<3;i++)sum+=(int)i;}
 for(i=1;i<9;i++)sum+=i*n;
 return sum;
}
long long wide_counter(int n){
 long long i=0;
 {for(int i=0;i<3;i++)n+=i;}
 i=0x100000000LL+n;i+=0x100000000LL;
 return i;
}
int pointer_stride(int n){
 int values[8]={1,2,3,4,5,6,7,8};int *p=values;
 {long long values[2]={0,1};long long *p=values;p++;*p+=n;}
 p+=n%4;*p+=17;
 int result=0;for(int i=0;i<8;i++)result+=values[i]*(i+1);
 return result;
}
int float_storage(int n){
 float value=(float)n;
 {long long value=7;value+=n;}
 value=(float)n*.25f;value+=.125f;
 return (int)(value*1024.f);
}
int short_storage(int n){
 unsigned short value=65530;
 {int value=n;value+=100;}
 value+=n+15;return value;
}
'''
def run(command,cwd):
 result=subprocess.run(list(map(str,command)),cwd=cwd,capture_output=True,text=True,timeout=180)
 assert result.returncode==0,(result.stdout[-1800:],result.stderr[-2800:])
 return result.stdout.strip()
with tempfile.TemporaryDirectory(prefix='source-scoped-types-') as directory:
 root=Path(directory);(root/'unit.cpp').write_text(SOURCE)
 (root/'main.cpp').write_text('#include <cstdio>\n#include "unit.cpp"\nint main(){for(int n=0;n<512;n++)printf("%d,%lld,%d,%d,%d\\n",narrow_counter(n),wide_counter(n),pointer_stride(n),float_storage(n),short_storage(n));}')
 run(['clang++','-std=c++14',root/'main.cpp','-o',root/'native.exe'],root)
 expected=run([root/'native.exe'],root).splitlines();modules=[]
 for mode in ('full','filtered'):
  command=[sys.executable,ROOT/'tools/source_ast_to_js.py','--root',root,'--source','unit.cpp','--out-dir',root/mode]
  if mode=='filtered':command+=['--filter','narrow_counter,wide_counter,pointer_stride,float_storage,short_storage','--exact-filter']
  run(command,ROOT);module=root/mode/'unit.cpp.mjs';modules.append(module)
  doc=json.loads(module.with_suffix('.manifest.json').read_text());assert doc['blocked']==0,doc
  evaluator='''async url=>{const m=await import(url);return Array.from({length:512},(_,n)=>[m.narrow_counter(n),m.wide_counter(n),m.pointer_stride(n),m.float_storage(n),m.short_storage(n)].join(','));}'''
  (root/'run.mjs').write_text('console.log((await ('+evaluator+')('+json.dumps(module.as_uri())+')).join("\\n"));')
  assert run(['node',root/'run.mjs'],ROOT).splitlines()==expected
 browser_checked=bool(os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'))
 if browser_checked:
  from playwright.sync_api import sync_playwright
  with sync_playwright() as p:
   browser=p.chromium.launch(executable_path=os.environ['EDUKE_CHROMIUM_EXECUTABLE'],headless=True);page=browser.new_page()
   for module in modules:
    assert page.evaluate(evaluator,'data:text/javascript;base64,'+base64.b64encode(module.read_bytes()).decode())==expected
   browser.close()
print('PASS: 2,560 native/full/filtered Node results'+(' and Chromium comparisons' if browser_checked else '; Chromium not configured')+'; narrow/wide loop shadows, original pointer stride and alias writes, float32 and uint16 compound-assignment storage')
