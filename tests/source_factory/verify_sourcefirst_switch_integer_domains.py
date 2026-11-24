"""Original promoted case domains agree with native switches and nested exits."""
import base64,json,os,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
SOURCE=r'''
extern "C" int sized(unsigned v){switch(v&(sizeof(char)|sizeof(short)|sizeof(int)|8)){
case sizeof(char):return 11;case sizeof(char)|8:return 12;
case sizeof(short):return 21;case sizeof(short)|8:return 22;
case sizeof(int):return 41;case sizeof(int)|8:return 42;default:return -1;}}
extern "C" int nested(unsigned v){int n=0;switch(v&(sizeof(char)|sizeof(short)|8)){
case sizeof(char):switch(v>>4){case sizeof(short):n=200;break;case 3:n=300;break;default:n=400;}break;
case sizeof(short):n=20;break;case sizeof(short)|8:n=21;break;default:n=-1;}return n;}
extern "C" int wide(unsigned v){switch((unsigned long long)v){case 0:return 3;case 1:return 4;case sizeof(int):return 5;default:return 6;}}
extern "C" int signed_case(int v){switch(v){case (int)0xffffffffu:return 7;case sizeof(short):return 8;default:return -2;}}
'''
def run(args):
 p=subprocess.run(list(map(str,args)),cwd=ROOT,capture_output=True,text=True,timeout=180)
 assert p.returncode==0,(args,p.stdout[-900:],p.stderr[-2200:]);return p.stdout
browser_values=0
with tempfile.TemporaryDirectory(prefix='switch-domains-',dir=ROOT/'work') as folder:
 root=Path(folder);(root/'unit.cpp').write_text(SOURCE)
 (root/'main.cpp').write_text('#include <cstdio>\nextern "C" int sized(unsigned),nested(unsigned),wide(unsigned),signed_case(int);int main(){for(int i=-256;i<256;i++)printf("%d,%d,%d,%d\\n",sized(i),nested(i),wide(i),signed_case(i));}\n')
 exe=root/'native.exe';run(['clang++','-std=c++14',root/'unit.cpp',root/'main.cpp','-o',exe]);expected=run([exe]).splitlines()
 for filtered in (False,True):
  out=root/str(filtered);args=[sys.executable,ROOT/'tools/source_ast_to_js.py','--root',root,'--source','unit.cpp','--out-dir',out]
  if filtered:args+=['--filter','sized,nested,wide,signed_case','--exact-filter']
  run(args);module=out/'unit.cpp.mjs';doc=json.loads(module.with_suffix('.manifest.json').read_text());assert doc['blocked']==0,doc['definitions']
  expression='async url=>{const m=await import(url),rows=[];for(let i=-256;i<256;i++)rows.push([m.sized(i),m.nested(i),m.wide(i),m.signed_case(i)].join(","));return rows;}'
  runner=root/'run.mjs';runner.write_text('console.log(JSON.stringify(await ('+expression+')('+json.dumps(module.as_uri())+')));');assert json.loads(run(['node',runner]))==expected
  if os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'):
   from playwright.sync_api import sync_playwright
   with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=os.environ['EDUKE_CHROMIUM_EXECUTABLE'],headless=True)
    try:
     assert browser.new_page().evaluate(expression,'data:text/javascript;base64,'+base64.b64encode(module.read_bytes()).decode())==expected
     browser_values+=2048
    finally:browser.close()
print(f'PASS 4096 native/full/filtered Node values, {browser_values} Chromium values: sizeof and wide case domains, narrowing and nested-switch exits')
