"""Cross-unit overload imports retain Clang namespace/type and reference identity."""
import base64,copy,json,os,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tools'))
from source_first_global_link import storage_import_error
HEADER='namespace Alpha {int choose(int);int choose(double);int& alias(int&,char);int& alias(int&,short);}\nnamespace Beta {int choose(int);}\n'
PROVIDER='#include "api.h"\nnamespace Alpha {int choose(int n){return n*3+7;}int choose(double n){return (int)(n*7.0)-9;}int& alias(int& n,char){n+=11;return n;}int& alias(int& n,short){n-=5;return n;}}\n'
CALLER='#include "api.h"\nint exercise(int n){int x=n;int a=Alpha::choose(n),b=Alpha::choose(double(n)+0.5);int&ref=Alpha::alias(x,char(0));ref+=3;return a+b+x*13;}\nint reject_namespace(int n){return Beta::choose(n);}\n'
def run(args,cwd=ROOT):
 r=subprocess.run(list(map(str,args)),cwd=cwd,capture_output=True,text=True,timeout=180)
 assert r.returncode==0,(args,r.stdout[-1000:],r.stderr[-2000:]);return r.stdout.strip()
with tempfile.TemporaryDirectory(prefix='source-external-overloads-') as directory:
 root=Path(directory);(root/'api.h').write_text(HEADER);(root/'provider.cpp').write_text(PROVIDER);(root/'caller.cpp').write_text(CALLER)
 (root/'main.cpp').write_text('#include <cstdio>\nint exercise(int);namespace Beta {int choose(int n){return n+999;}}int main(){for(int n=-512;n<512;n++)printf("%d\\n",exercise(n));}')
 run(['clang++','-std=c++14',root/'provider.cpp',root/'caller.cpp',root/'main.cpp','-o',root/'native.exe'])
 expected=run([root/'native.exe']).splitlines();out=root/'out'
 base=[sys.executable,ROOT/'tools/source_ast_to_js.py','--root',root,'--require-record-layouts','--header-dependency-closure']
 run([*base,'--source','provider.cpp','--out-dir',out]);provider=out/'provider.cpp.mjs';pd=json.loads(provider.with_suffix('.manifest.json').read_text())
 names={row['name']:'provider.cpp' for row in pd['definitions'] if row['status']=='source-first' and row['kind']=='FunctionDecl'}
 index=root/'symbols.json';index.write_text(json.dumps(names));modules=[]
 evaluator='''async({url})=>{const m=await import(url),rows=[];for(let n=-512;n<512;n++)rows.push(String(m.exercise(n)));return rows;}'''
 for mode in ('full','filtered'):
  args=[*base,'--source','caller.cpp','--out-dir',root/mode,'--project-symbols',index,'--import-root',out]
  if mode=='filtered':args+=['--filter','exercise,reject_namespace','--exact-filter','--dependency-closure']
  run(args);module=root/mode/'caller.cpp.mjs';doc=json.loads(module.with_suffix('.manifest.json').read_text());rows={row['source_name']:row for row in doc['definitions']}
  assert rows['exercise']['status']=='source-first',rows['exercise']
  assert rows['reject_namespace']['status']=='blocked',rows['reject_namespace']
  imports=[item for item in doc['imports'] if item.get('cpp_function_identity')];assert len(imports)==3,doc['imports']
  assert any(item.get('reference_contract') for item in imports),imports
  units={'provider.cpp':{'manifest':pd,'module':provider}}
  for item in imports:
   assert storage_import_error(item,units) is None,item
   changed=copy.deepcopy(item);changed['cpp_function_identity']['mangled_name']+='wrong'
   assert storage_import_error(changed,units),'wrong native identity accepted'
  (root/'run.mjs').write_text('console.log((await ('+evaluator+')('+json.dumps({'url':module.as_uri()})+')).join("\\n"));')
  assert run(['node',root/'run.mjs']).splitlines()==expected;modules.append(module)
 if os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'):
  import functools,http.server,threading
  from playwright.sync_api import sync_playwright
  class Quiet(http.server.SimpleHTTPRequestHandler):
   extensions_map={**http.server.SimpleHTTPRequestHandler.extensions_map,'.mjs':'text/javascript'}
   def log_message(self,*args):pass
  server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(root)));threading.Thread(target=server.serve_forever,daemon=True).start()
  try:
   with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=os.environ['EDUKE_CHROMIUM_EXECUTABLE'],headless=True);page=browser.new_page();origin='http://127.0.0.1:'+str(server.server_port);page.goto(origin+'/')
    for module in modules:assert page.evaluate(evaluator,{'url':origin+'/'+module.relative_to(root).as_posix()})==expected
    browser.close()
  finally:server.shutdown();server.server_close()
print('PASS: 2048 native/full/filtered Node and optional Chromium overload results; exact native namespaces/signatures, scalar reference mutation, dual ABI audits and wrong-identity rejection')
