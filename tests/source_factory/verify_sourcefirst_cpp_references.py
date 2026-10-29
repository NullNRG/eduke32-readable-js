"""Native/Chromium parity for borrowed references and original std::lock_guard."""
import base64, hashlib, json, os, subprocess, sys, tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'tools'))
from source_first_global_link import storage_import_error
from source_cpp_references import function_type_parts

SOURCE=r'''
#include <mutex>
int total;
void add(int &value,int amount){value+=amount;}
void redirect(int *&ptr,int *target){ptr=target;}
int read(const int &value){return value;}
int &select(int &a,int &b,int choose){return choose?a:b;}
struct Slot {int n;};
struct Guard {int &depth;Guard(int &value):depth(value){++depth;}~Guard(){--depth;}int get(){return depth;}};
int guard_case(int n){int depth=n;{Guard g(depth);if(n&1)return depth*3+g.get();}return depth*5;}
int reference_return(int n){int a=n,b=n+9;select(a,b,n&1)+=5;int &r=select(a,b,n&1);++r;return a*7+b*11+1000*(&r==((n&1)?&a:&b));}
int reference_case(int n){
 int a=n,b=n+7;int &alias=a;add(alias,3);int *ptr=&a;redirect(ptr,&b);add(*ptr,5);
 Slot slot={n};add(slot.n,9);int values[3]={n,n+1,n+2};int index=0;add(values[index++],4);
 const int &r=n+11;return a*3+b*5+slot.n*7+values[0]*11+index*13+read(n+17)+r;
}
int indirect_case(int n){int x;void (*callback)(int&,int)=add;x=n;callback(x,11);int &alias=x;return x+1000*(&alias==&x);}
int loop_reference_case(int n){int result=0;for(int x=n;x<n+3;x++){int &r=x;add(r,1);result+=r*7+1000*(&r==&x);}return result;}
struct CounterMutex {int depth;CounterMutex(int n):depth(n){}void lock(){++depth;}void unlock(){--depth;}};
int standard_guard_case(int n){CounterMutex mutex(n);{std::lock_guard<CounterMutex> lock(mutex);if(n&1)return mutex.depth*3;}return mutex.depth*5;}
struct RefMethod {void change(int &value){add(value,7);}int &get(int &value){return value;}};
int method_case(int n){RefMethod method;int x=n;method.change(x);method.get(x)+=11;return x;}
int global_reference_case(int n){total=n;add(total,13);int &alias=total;return total+1000*(&alias==&total);}
int reference_goto_case(int n){int x=n,round=0;int &alias=x;again:add(alias,3);if(++round<3)goto again;{int x=n+13;int &alias=x;add(alias,5);n+=x;}return x*7+n+1000*(&alias==&x);}
int reference_goto_reentry(int n){int result=0,step=0;again:{int x=n+step;int &alias=x;add(alias,5);result+=alias;}if(++step<3)goto again;return result;}
'''
FUNCTIONS=('reference_case','reference_return','guard_case','indirect_case','loop_reference_case','standard_guard_case','method_case','global_reference_case','reference_goto_case','reference_goto_reentry')
def run(args,cwd):
 p=subprocess.run(args,cwd=cwd,capture_output=True,text=True,timeout=180)
 assert p.returncode==0,(args,p.stdout[-1000:],p.stderr[-4000:]);return p.stdout.strip()

assert function_type_parts('void (*)(int &, void (*)(int, int), const Pair<int, long> &)')[1]==['int &','void (*)(int, int)','const Pair<int, long> &']
with tempfile.TemporaryDirectory(prefix='eduke-cpp-references-') as directory:
 root=Path(directory);out=root/'out';(root/'unit.cpp').write_text(SOURCE)
 (root/'main.cpp').write_text('#include <cstdio>\n#include "unit.cpp"\nint main(){for(int n=-256;n<256;n++)printf("'+','.join('%d' for _ in FUNCTIONS)+'\\n",'+','.join(f+'(n)' for f in FUNCTIONS)+');}')
 native=root/'native.exe';run(['clang++','-std=c++14','main.cpp','-o',str(native)],root)
 expected=run([str(native)],root).splitlines()
 run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(root),'--source','unit.cpp','--out-dir',str(out)],root)
 module=out/'unit.cpp.mjs';manifest=json.loads(module.with_suffix('.manifest.json').read_text())
 rows={r['source_name']:r for r in manifest['definitions']}
 for name in FUNCTIONS:assert rows[name]['status']=='source-first',rows[name]
 guards=[r for r in manifest['definitions'] if r['source_name']=='lock_guard<CounterMutex>']
 assert len(guards)==1 and guards[0]['status']=='source-first',guards
 js='async url=>{const m=await import(url),result=[];for(let n=-256;n<256;n++)result.push(['+','.join('m.'+f+'(n)' for f in FUNCTIONS)+'].join(","));return result;}'
 (root/'run.mjs').write_text('console.log((await ('+js+')('+json.dumps(module.as_uri())+')).join("\\n"));')
 observed=run(['node',str(root/'run.mjs')],root).splitlines()
 assert observed==expected,next(((i,a,b)for i,(a,b)in enumerate(zip(observed,expected))if a!=b),('length',len(observed),len(expected)))
 from playwright.sync_api import sync_playwright
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path=os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'),headless=True)
  page=browser.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  actual=page.evaluate(js,'data:text/javascript;base64,'+base64.b64encode(module.read_bytes()).decode())
  assert actual==expected and not errors,(errors,actual[:2],expected[:2]);version=browser.version;browser.close()
 # Exact ABI contracts must survive source-module linking. Historical providers
 # that copied primitive references must be rejected, even if exports exist.
 (root/'provider.cpp').write_text('void cross_add(int &value,int n){value+=n;}')
 (root/'caller.cpp').write_text('void cross_add(int&,int);int cross_case(int n){int x=n;cross_add(x,17);return x;}')
 owners=root/'owners.json';owners.write_text(json.dumps({'cross_add':'provider.cpp'}))
 for source in ('provider.cpp','caller.cpp'):
  run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(root),'--source',source,'--out-dir',str(out)]+(['--project-symbols',str(owners)] if source=='caller.cpp' else []),root)
 provider=json.loads((out/'provider.cpp.manifest.json').read_text());caller=json.loads((out/'caller.cpp.manifest.json').read_text())
 dependency=next(d for d in caller['imports'] if d['name']=='cross_add')
 units={'provider.cpp':{'manifest':provider,'module':out/'provider.cpp.mjs'}}
 assert storage_import_error(dependency,units) is None
 assert 'reference-call consumer' in storage_import_error({'name':'cross_add','from':'provider.cpp','native_pointer_abi':provider['native_pointer_abi']},units)
 (root/'cross.mjs').write_text('import {cross_case} from '+json.dumps((out/'caller.cpp.mjs').as_uri())+';for(let n=0;n<512;n++)if(cross_case(n)!==n+17)throw Error("cross TU reference mismatch");')
 run(['node',str(root/'cross.mjs')],root)
 next(d for d in provider['definitions'] if d['name']=='cross_add').pop('cpp_reference_contract')
 assert 'reference-call provider' in storage_import_error(dependency,units)
 report={'format':'source-cpp-borrowed-reference-parity/1','passed':True,'native_node_cases':512,'native_chromium_cases':512,
  'compared_values':512*len(FUNCTIONS),'cross_translation_unit_cases':512,'original_std_lock_guard_body_translated':True,
  'checks':['mutable scalar and pointer references','const scalar temporary lifetime','returned reference lvalues',
   'stable local, global and array element addresses','single evaluation of side-effecting arguments','borrowed reference member RAII',
   'original standard-library lock_guard constructor/destructor','indirect and member reference calls','loop declaration aliases',
   'cross-unit ABI attestation and rejection of historical incompatible providers','Clang-validated goto scopes, shadowed reference aliases and repeated declarations'],
  'browser_version':version,'compiler_sha256':hashlib.sha256((ROOT/'tools/source_ast_to_js.py').read_bytes()).hexdigest(),'gameplay_verified':False}
 (ROOT/'reports/oct16-cpp-references-parity.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
