"""Authored copy/move constructors retain source side effects and object identity."""
import base64,json,os,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def run(args):
 p=subprocess.run(list(map(str,args)),cwd=ROOT,capture_output=True,text=True,timeout=180)
 assert p.returncode==0,(args,p.stdout[-1500:],p.stderr[-2500:])
 return p.stdout
with tempfile.TemporaryDirectory(prefix='authored-copy-',dir=ROOT/'work') as folder:
 root=Path(folder)
 (root/'types.hpp').write_text('extern int copies,moves;struct Count {int value;explicit Count(int n):value(n){} Count(const Count&n):value(n.value+11){copies++;} Count(Count&&n):value(n.value+17){n.value=-71;moves++;}};\n')
 (root/'unit.cpp').write_text('#include "types.hpp"\nint copies,moves;extern "C" int exercise(int n){copies=0;moves=0;Count a(n),b(a);Count c(static_cast<Count&&>(b));Count d(c);return a.value+c.value*17+d.value*31+b.value*57+copies*100003+moves*300007;}\n')
 (root/'main.cpp').write_text('#include <cstdio>\nextern "C" int exercise(int);int main(){for(int n=-128;n<128;n++)printf("%d\\n",exercise(n));}\n')
 exe=root/'native.exe';run(['clang++','-std=c++14',root/'unit.cpp',root/'main.cpp','-o',exe]);expected=[int(x) for x in run([exe]).splitlines()]
 for filtered in (False,True):
  out=root/str(filtered);args=[sys.executable,ROOT/'tools/source_ast_to_js.py','--root',root,'--source','unit.cpp','--out-dir',out,'--header-dependency-closure','--dependency-closure','--require-record-layouts']
  if filtered:args+=['--filter','exercise','--exact-filter']
  run(args);module=out/'unit.cpp.mjs';doc=json.loads(module.with_suffix('.manifest.json').read_text());assert doc['blocked']==0,doc['definitions']
  expression='async url=>{const m=await import(url);return Array.from({length:256},(_,n)=>m.exercise(n-128));}'
  runner=root/'run.mjs';runner.write_text('console.log(JSON.stringify(await ('+expression+')('+json.dumps(module.as_uri())+')));')
  assert json.loads(run(['node',runner]))==expected
  if os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'):
   from playwright.sync_api import sync_playwright
   with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path=os.environ['EDUKE_CHROMIUM_EXECUTABLE'],headless=True)
    try:
     page=browser.new_page();actual=page.evaluate(expression,'data:text/javascript;base64,'+base64.b64encode(module.read_bytes()).decode());assert actual==expected,(actual[:4],expected[:4])
    finally:browser.close()
print('PASS 512 native/full/filtered Node and Chromium results: selected authored copy/move bodies, repeated copy side effects, moved-from mutation and independent objects')
