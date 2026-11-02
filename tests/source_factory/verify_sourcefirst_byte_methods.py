"""Original instance methods mutate existing native bytes, with no new lifetime."""
import base64,json,os,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def run(args):
    p=subprocess.run(list(map(str,args)),cwd=ROOT,text=True,capture_output=True,timeout=180)
    assert p.returncode==0,(args,p.stdout[-2000:],p.stderr[-4000:]);return p.stdout
with tempfile.TemporaryDirectory(dir=ROOT/'work',prefix='byte-method-') as folder:
    root=Path(folder)
    (root/'types.hpp').write_text('''#include <atomic>
struct Counter{int value;explicit Counter(int n):value(n*7){}
 int add(int n){value+=n*3;return value;}
 int read()const{return value;}
 int twice(int n){return add(n)+add(n+1);}
 int borrow(int &n){n+=value;return add(n);}
 int defaulted(int n=17){return add(n);}
};
struct Holder{Counter counter;std::atomic<int> flag;std::atomic<Counter*> head;};
''')
    (root/'unit.cpp').write_text('''#include "types.hpp"
constexpr bool evaluation_query(){return __builtin_is_constant_evaluated();}
extern "C" int runtime_query(){return evaluation_query()?71:29;}
extern "C" int constant_query(){constexpr bool value=evaluation_query();return value;}
constexpr bool global_query=evaluation_query();
extern "C" int modify(Holder*p,int n){int local=n;
 int result=p->counter.twice(n)+p->counter.borrow(local)+p->counter.defaulted();
 result+=p->counter.add(p->counter.read());
 result+=p->counter.read()+local;
 p->flag.store(n+11,std::memory_order_relaxed);
 Counter*expected=nullptr;
 bool first=p->head.compare_exchange_weak(expected,&p->counter,std::memory_order_release,std::memory_order_relaxed);
 expected=nullptr;
 bool second=p->head.compare_exchange_weak(expected,nullptr,std::memory_order_release,std::memory_order_relaxed);
 Counter*saved=p->head.load(std::memory_order_relaxed);
 p->head.store(nullptr,std::memory_order_relaxed);
 result+=(first?1000:0)+(second?0:2000)+(expected==saved?3000:0)+(saved==&p->counter?4000:0);
 return result+p->flag.load(std::memory_order_relaxed)+runtime_query();
}
extern "C" int missing_lifetime(int n){Holder x{Counter(n),{0},{nullptr}};return x.counter.read();}
''')
    (root/'main.cpp').write_text('''#include "types.hpp"
#include <cstdio>
#include <cstring>
extern "C" int modify(Holder*,int);
void bytes(const void*p,unsigned size){auto b=(const unsigned char*)p;for(unsigned j=0;j<size;j++)printf("%02x",b[j]);}
int main(){for(int n=0;n<256;n++){Holder object{Counter(n),{0},{nullptr}};
 bytes(&object,sizeof(object));int result=modify(&object,n+5);
 printf(" %d ",result);bytes(&object,sizeof(object));printf("\\n");}}
''')
    oracle=root/'oracle.exe';run(['clang++','-std=c++14','-O1',root/'unit.cpp',root/'main.cpp','-o',oracle])
    cases=[line.split() for line in run([oracle]).splitlines()]
    for filtered in (False,True):
        out=root/str(filtered);args=[sys.executable,ROOT/'tools/source_ast_to_js.py','--root',root,
            '--source','unit.cpp','--out-dir',out,'--require-record-layouts','--header-dependency-closure']
        if filtered:args+=['--filter','modify,missing_lifetime,constant_query,global_query','--exact-filter','--dependency-closure']
        run(args);module=out/'unit.cpp.mjs';doc=json.loads(module.with_suffix('.manifest.json').read_text())
        rows={r['name']:r for r in doc['definitions']}
        assert rows['modify']['status']=='source-first',[{k:r.get(k) for k in ('name','status','reason')} for r in doc['definitions']]
        assert rows['missing_lifetime']['status']=='blocked',rows['missing_lifetime']
        for name in ('constant_query','global_query'):
            assert rows[name]['status']=='blocked' and 'constant initializer' in rows[name]['reason'],rows[name]
        methods=[r for r in doc['definitions'] if r.get('original_byte_method')]
        assert len(methods)>=7,methods
        assert all(r['linkage']=='internal' and r['original_byte_method']['mangled_name'] for r in methods)
        js='''async({url,cases})=>{const {modify}=await import(url);return cases.map((row,n)=>{
 const bytes=Uint8Array.from(row[0].match(/../g),x=>parseInt(x,16)),result=modify(bytes,n+5);
 return [String(result),Array.from(bytes,x=>x.toString(16).padStart(2,'0')).join('')];});}'''
        runner=root/'run.mjs';runner.write_text('console.log(JSON.stringify(await ('+js+')('+json.dumps({'url':module.as_uri(),'cases':cases})+')));')
        wanted=[row[1:] for row in cases];observed=json.loads(run(['node',runner]));assert observed==wanted,(observed[:3],wanted[:3])
        if os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'):
            from playwright.sync_api import sync_playwright
            with sync_playwright() as pw:
                browser=pw.chromium.launch(executable_path=os.environ['EDUKE_CHROMIUM_EXECUTABLE'],headless=True)
                try:
                    page=browser.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
                    observed=page.evaluate(js,{'url':'data:text/javascript;base64,'+base64.b64encode(module.read_bytes()).decode(),'cases':cases})
                    assert observed==wanted and not errors,(observed[:3],wanted[:3],errors)
                finally:browser.close()
print('PASS 512 native/Node and 512 native/Chromium original byte-method cases: nested calls, const reads, reference mutation, default arguments, actual std::atomic load/store/compare-exchange and pointer identity; construction remains blocked')
