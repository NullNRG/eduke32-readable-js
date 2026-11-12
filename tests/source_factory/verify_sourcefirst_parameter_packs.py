"""Expanded native pack parameters keep distinct values and reference aliases."""
import base64,json,os,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tools'))
from source_parameter_bindings import unique_parameters
SOURCE=r'''
int roll(){return 0;}
template<class T,class...Rest>int roll(T first,Rest...args){return first*13+roll(args...);}
int mutate(){return 0;}
template<class...Rest>int mutate(int &first,Rest&...args){first+=3;int value=first;return value+mutate(args...);}
int pointers(){return 0;}
template<class...Rest>int pointers(int *first,Rest...args){*first+=7;int value=*first;return value+pointers(args...);}
int value(int n){return roll(n,n+1,n+7,n^3);}
int refs(int n){int a=n,b=n+4,c=n-3;return mutate(a,b,a,c)*17+a*3+b*5+c;}
int pointer_values(int n){int a=n,b=n+4,c=n-3;return pointers(&a,&b,&a,&c)*17+a*3+b*5+c;}
int unnamed(int,int arg0){return arg0*3;}
int names(int n){return unnamed(n,n+5);}
'''
def run(command,cwd):
 r=subprocess.run(list(map(str,command)),cwd=cwd,capture_output=True,text=True,timeout=180)
 assert r.returncode==0,(command,r.stdout[-1200:],r.stderr[-2000:])
 return r.stdout.strip()
bad={'kind':'FunctionDecl','inner':[{'kind':'ParmVarDecl','id':'same','name':'args'},{'kind':'ParmVarDecl','id':'same','name':'args'}]}
try:unique_parameters(bad,str);raise AssertionError('ambiguous declaration IDs accepted')
except ValueError:pass
with tempfile.TemporaryDirectory(prefix='source-parameter-packs-') as directory:
 root=Path(directory);(root/'unit.cpp').write_text(SOURCE)
 (root/'main.cpp').write_text('#include <cstdio>\n#include "unit.cpp"\nint main(){for(int n=-256;n<768;n++)printf("%d %d %d %d\\n",value(n),refs(n),pointer_values(n),names(n));}')
 run(['clang++','-std=c++14',root/'main.cpp','-o',root/'native.exe'],root)
 expected=run([root/'native.exe'],root).splitlines();modules=[]
 evaluator='''async ({url})=>{const m=await import(url),rows=[];for(let n=-256;n<768;n++)rows.push([m.value(n),m.refs(n),m.pointer_values(n),m.names(n)].join(' '));return rows;}'''
 for mode in ('full','filtered'):
  command=[sys.executable,ROOT/'tools/source_ast_to_js.py','--root',root,'--source','unit.cpp','--out-dir',root/mode]
  if mode=='filtered':command+=['--filter','value,refs,pointer_values,names','--exact-filter','--dependency-closure','--header-dependency-closure']
  run(command,ROOT);module=root/mode/'unit.cpp.mjs';doc=json.loads(module.with_suffix('.manifest.json').read_text())
  assert doc['blocked']==0,[(r['name'],r.get('reason')) for r in doc['definitions'] if r['status']=='blocked']
  assert any(r.get('source_parameter_bindings') for r in doc['definitions'])
  (root/'run.mjs').write_text('console.log((await ('+evaluator+')('+json.dumps({'url':module.as_uri()})+')).join("\\n"));')
  assert run(['node',root/'run.mjs'],ROOT).splitlines()==expected;modules.append(module)
 browser_checked=bool(os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'))
 if browser_checked:
  from playwright.sync_api import sync_playwright
  with sync_playwright() as p:
   browser=p.chromium.launch(executable_path=os.environ['EDUKE_CHROMIUM_EXECUTABLE'],headless=True);page=browser.new_page()
   for module in modules:assert page.evaluate(evaluator,{'url':'data:text/javascript;base64,'+base64.b64encode(module.read_bytes()).decode()})==expected
   browser.close()
print('PASS: 4,096 native/full/filtered Node'+('/Chromium' if browser_checked else '')+' results; expanded parameter values, references, pointer aliases and unnamed collisions; ambiguous declaration identities rejected')
