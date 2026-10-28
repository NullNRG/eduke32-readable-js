"""C++ array-member pointer references preserve source slot mutation."""
import base64,json,os,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def run(args):
 p=subprocess.run(args,cwd=ROOT,text=True,capture_output=True,timeout=120)
 assert p.returncode==0,(p.stdout[-1400:],p.stderr[-1800:]);return p.stdout
with tempfile.TemporaryDirectory(prefix='source-pointer-range-') as tmp:
 root=Path(tmp)
 (root/'unit.cpp').write_text('''struct History { const char *items[4]; };\nint first(const char *p){ return p ? *p : 0; }\nextern "C" int check(){History h{};h.items[0]="a";h.items[2]="z";int n=0;for(auto &item:h.items){n+=first(item);item=nullptr;}for(auto &item:h.items){if(item)return -1;}return n;}\nint escapes(const char *&p){p=nullptr;return 0;}\nextern "C" int reject(){History h{};for(auto &item:h.items)escapes(item);return 0;}\n''')
 (root/'main.cpp').write_text('#include <cstdio>\nextern "C" int check();int main(){printf("%d\\n",check());}')
 run(['clang++','-std=c++14',str(root/'unit.cpp'),str(root/'main.cpp'),'-o',str(root/'native.exe')])
 expected=run([str(root/'native.exe')]).strip()
 run([sys.executable,'tools/source_ast_to_js.py','--root',str(root),'--source','unit.cpp','--out-dir',str(root/'out')])
 module=root/'out/unit.cpp.mjs';doc=json.loads(module.with_suffix('.manifest.json').read_text());rows={r['name']:r for r in doc['definitions']}
 assert rows['check']['status']=='source-first',rows['check']
 assert rows['reject']['status']=='blocked' and 'reference escapes' in rows['reject']['reason'],rows['reject']
 (root/'check.mjs').write_text('import {check} from '+json.dumps(module.as_uri())+';console.log(check());')
 assert run(['node',str(root/'check.mjs')]).strip()==expected
 if os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'):
  from playwright.sync_api import sync_playwright
  with sync_playwright() as pw:
   browser=pw.chromium.launch(executable_path=os.environ['EDUKE_CHROMIUM_EXECUTABLE'],headless=True)
   page=browser.new_page();errors=[];page.on('pageerror',lambda error:errors.append(str(error)))
   result=page.evaluate('async url=>(await import(url)).check()', 'data:text/javascript;base64,'+base64.b64encode(module.read_bytes()).decode())
   assert str(result)==expected and not errors,(result,errors);browser.close()
 print('PASS: original pointer-array references preserve slot writes, by-value calls, and reject escaping references.')
