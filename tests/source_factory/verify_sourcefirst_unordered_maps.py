"""Native/Node/Chromium parity for the opaque standard-map service boundary."""
import functools,http.server,json,os,subprocess,sys,tempfile,threading
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
SOURCE=r'''#include <unordered_map>
#include <cstdint>
using Small=std::unordered_map<unsigned int,unsigned short>;
static std::unordered_map<unsigned short,Small> fonts;
struct Box {void*opaque;};
Box obtain(unsigned short k){auto&m=fonts[k];return Box{&m};}
void put(Box p,unsigned k,unsigned short v){auto&m=*(Small*)p.opaque;m.emplace(k,v);}
unsigned short lookup(Box p,unsigned k){auto&m=*(Small*)p.opaque;auto i=m.find(k);if(i==m.end())return 0;return i->second;}
unsigned exercise(unsigned n){
 fonts.clear();auto p=obtain(n);put(p,n,n+17);put(p,n,n+999);
 unsigned result=lookup(p,n)*3+lookup(p,n+1);
 if((uintptr_t)p.opaque!=(uintptr_t)obtain(n).opaque)return 777777;
 Small local;local[n]=n*13+5;unsigned short&ref=local[n];auto saved=&ref;
 for(unsigned i=1;i<=24;i++)local.emplace(n+i,n+i*11);
 *saved+=3;Small copied(local);copied[n]+=7;Small assigned;assigned=copied;assigned.erase(n+1);
 auto first=local.find(n),second=first;
 result+=local[n]*5+copied[n]*7+assigned[n]*11;
 result+=unsigned(first==second)*13+unsigned(first!=local.end())*17;
 auto wide=0xffffffffffffffffull-(unsigned long long)n;local.emplace(wide,wide);
 result+=local[(unsigned)wide]*19;
 result+=assigned.size()*23;
 return result;
}
struct CustomHash{unsigned operator()(unsigned)const{return 0;}};
unsigned reject_custom_hash(unsigned n){std::unordered_map<unsigned,unsigned,CustomHash>m;m[n]=123;return m[n];}
'''
def run(args,cwd=ROOT):
 task=subprocess.run(list(map(str,args)),cwd=cwd,capture_output=True,text=True,timeout=240)
 assert task.returncode==0,(args,task.stdout[-1200:],task.stderr[-3000:]);return task.stdout.strip()
with tempfile.TemporaryDirectory(prefix='source-unordered-maps-') as directory:
 root=Path(directory);(root/'input.cpp').write_text(SOURCE)
 (root/'main.cpp').write_text('#include <cstdio>\nunsigned exercise(unsigned);int main(){for(unsigned n=0;n<1024;n++)printf("%u\\n",exercise(n));}')
 exe=root/'oracle.exe';run(['clang++','-std=c++14','-O2',root/'input.cpp',root/'main.cpp','-o',exe]);expected=run([exe]).splitlines();modules=[]
 evaluator='''async({url})=>{const m=await import(url),rows=[];for(let n=0;n<1024;n++)rows.push(String(m.exercise(n)));return rows;}'''
 for mode in ('full','filtered'):
  args=[sys.executable,ROOT/'tools/source_ast_to_js.py','--root',root,'--source','input.cpp','--out-dir',root/mode,'--require-record-layouts','--header-dependency-closure']
  if mode=='filtered':args+=['--filter','exercise,reject_custom_hash','--exact-filter','--dependency-closure']
  run(args);module=root/mode/'input.cpp.mjs';doc=json.loads((root/mode/'input.cpp.manifest.json').read_text());rows={r['name']:r for r in doc['definitions']}
  assert rows['exercise']['status']=='source-first',rows['exercise']
  assert rows['reject_custom_hash']['status']=='blocked',rows['reject_custom_hash']
  assert rows['exercise'].get('standard_library_adapters'),rows['exercise']
  assert rows['fonts']['private_storage']['abi']=='source-private-cell/1'
  (root/'run.mjs').write_text('console.log((await ('+evaluator+')('+json.dumps({'url':module.as_uri()})+')).join("\\n"));')
  actual=run(['node',root/'run.mjs']).splitlines();assert actual==expected,(mode,actual[:4],expected[:4]);modules.append(module)
 if os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'):
  from playwright.sync_api import sync_playwright
  class Quiet(http.server.SimpleHTTPRequestHandler):
   extensions_map={**http.server.SimpleHTTPRequestHandler.extensions_map,'.mjs':'text/javascript'}
   def log_message(self,*args):pass
  server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(root)));threading.Thread(target=server.serve_forever,daemon=True).start()
  try:
   with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=os.environ['EDUKE_CHROMIUM_EXECUTABLE'],headless=True)
    try:
     for module in modules:
      page=browser.new_page();origin='http://127.0.0.1:'+str(server.server_port);page.goto(origin+'/');assert page.evaluate(evaluator,{'url':origin+'/'+module.relative_to(root).as_posix()})==expected;page.close()
    finally:browser.close()
  finally:server.shutdown();server.server_close()
 (root/'fake.h').write_text('namespace std {template<class K,class V>struct unordered_map {V operator[](K){return V(113);}};}')
 (root/'fake.cpp').write_text('#include "fake.h"\nstatic std::unordered_map<unsigned,unsigned short> fake;unsigned exercise_fake(unsigned n){return fake[n];}')
 run([sys.executable,ROOT/'tools/source_ast_to_js.py','--root',root,'--source','fake.cpp','--out-dir',root/'fake-out','--require-record-layouts','--header-dependency-closure'])
 fake=json.loads((root/'fake-out/fake.cpp.manifest.json').read_text())
 assert not any(row.get('standard_library_adapters') for row in fake['definitions']),'application class admitted as target standard library'
 (root/'override.cpp').write_text('#include <unordered_map>\n#include <cstdlib>\nvoid*operator new(__SIZE_TYPE__ n){return std::malloc(n);}\nvoid operator delete(void*p)noexcept{std::free(p);}\nunsigned reject_override(unsigned n){std::unordered_map<unsigned,unsigned>m;m[n]=123;return m[n];}')
 for mode in ('full','filtered'):
  args=[sys.executable,ROOT/'tools/source_ast_to_js.py','--root',root,'--source','override.cpp','--out-dir',root/('override-'+mode),'--require-record-layouts','--header-dependency-closure']
  if mode=='filtered':args+=['--filter','reject_override','--exact-filter','--dependency-closure']
  run(args);doc=json.loads((root/('override-'+mode)/'override.cpp.manifest.json').read_text());row=next(r for r in doc['definitions'] if r['name']=='reject_override')
  assert row['status']=='blocked' and not row.get('standard_library_adapters'),row
 (root/'empty-symbols.json').write_text('{}')
 run([sys.executable,ROOT/'tools/source_ast_to_js.py','--root',root,'--source','input.cpp','--out-dir',root/'unverified-project','--project-symbols',root/'empty-symbols.json','--require-record-layouts','--header-dependency-closure'])
 unverified=json.loads((root/'unverified-project/input.cpp.manifest.json').read_text())
 assert not any(row.get('standard_library_adapters') for row in unverified['definitions']),'project without allocator absence proof admitted'
print('PASS: 2048 native/full/filtered Node and optional Chromium results: nested maps, opaque pointer round trips, insertion/reference stability, copies, assignment, iterators, erase, size and uint64 narrowing; custom hash remains blocked')
