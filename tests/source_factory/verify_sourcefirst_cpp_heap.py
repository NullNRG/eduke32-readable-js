"""Native differential tests for original-source C++ new/delete lowering."""
import hashlib,json,os,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def run(args,cwd):
    result=subprocess.run(args,cwd=cwd,text=True,capture_output=True,timeout=120)
    assert result.returncode==0,(args,result.stdout,result.stderr)
    return result.stdout.strip()
with tempfile.TemporaryDirectory(prefix='eduke-source-heap-') as temp:
    root=Path(temp);out=root/'out'
    source=r'''
unsigned events;int alive;int ctorCount;int dtorCount;
struct Ticket;Ticket *last;
struct Ticket {
 int value;
 Ticket(int x):value(x){last=this;alive++;ctorCount++;events=events*33u+(unsigned)x;}
 ~Ticket() noexcept {alive--;dtorCount++;events=events*33u+(unsigned)(value+17);}
 int get()const{return value;}
};
int *make_scalar(int x){return new int(x);}
unsigned long long *make_wide(unsigned long long x){return new unsigned long long(x);}
void drop_wide(unsigned long long *p){delete p;}
int heap_case(int x){
 events=0;alive=ctorCount=dtorCount=0;
 auto *p=new Ticket(x);auto *q=new Ticket(x+1);
 int identity=last==q&&p!=q;
 p->value+=3;int value=p->get()+q->get();
 delete p;delete q;
 return value+identity+alive+ctorCount+dtorCount;
}
int scalar_case(int x){
 int *p=new int(x),*q=new int{};
 *q=*p+7;int value=*p+*q;delete p;delete q;return value;
}
int array_case(int x){
 unsigned n=(unsigned)x%23u;int *p=new int[n]{};
 int value=0;for(unsigned i=0;i<n;i++){value+=p[i];p[i]=(int)i+x;}
 for(unsigned i=0;i<n;i++)value+=p[i];delete []p;return value;
}
double float_case(int x){double *p=new double((double)x/8.0);double value=*p;delete p;return value;}
void drop_null(){delete (int*)nullptr;delete [](double*)nullptr;delete (Ticket*)nullptr;}
struct Box {int value;};
Box *rejected_class_array(int n){return new Box[n]{};}
int *rejected_array_values(int n){return new int[n]{1,2};}
'''
    (root/'unit.cpp').write_text(source)
    (root/'deallocate.cpp').write_text('void drop_scalar(int *p){delete p;}\n')
    (root/'main.cpp').write_text(r'''#include <cstdio>
#include "unit.cpp"
extern void drop_scalar(int*);
int main(){for(int x=0;x<512;x++){int a=heap_case(x);unsigned e=events;int b=scalar_case(x),c=array_case(x);double f=float_case(x);drop_null();auto*p=make_scalar(x+9);int v=*p;drop_scalar(p);auto*w=make_wide(0xfedcba9876543210ull+(unsigned)x);auto t=*w;drop_wide(w);printf("%d,%u,%d,%d,%.3f,%d,%llu\n",a,e,b,c,f,v,t);}}
''')
    executable=root/'native.exe'
    run(['clang++','-std=c++14','-funsigned-char','main.cpp','deallocate.cpp','-o',str(executable)],root)
    expected=run([str(executable)],root).splitlines()
    for filename in ('unit.cpp','deallocate.cpp'):
        run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(root),'--source',filename,'--out-dir',str(out)],root)
    manifest=json.loads((out/'unit.cpp.manifest.json').read_text());rows={r['name']:r for r in manifest['definitions']}
    for name in ('heap_case','scalar_case','array_case','float_case','drop_null','make_scalar','make_wide','drop_wide'):
        assert rows[name]['status']=='source-first',(name,rows[name])
    assert rows['rejected_class_array']['status']=='blocked',rows['rejected_class_array']
    assert rows['rejected_array_values']['status']=='blocked',rows['rejected_array_values']
    (root/'run.mjs').write_text('import * as m from '+json.dumps((out/'unit.cpp.mjs').as_uri())+';\n'
        +'import {drop_scalar} from '+json.dumps((out/'deallocate.cpp.mjs').as_uri())+';\n'
        +'for(let x=0;x<512;x++){let a=m.heap_case(x),e=m.events,b=m.scalar_case(x),c=m.array_case(x),f=m.float_case(x);m.drop_null();let p=m.make_scalar(x+9),v=p[0];drop_scalar(p);let w=m.make_wide(0xfedcba9876543210n+BigInt(x)),t=w[0];m.drop_wide(w);console.log(`${a},${e},${b},${c},${f.toFixed(3)},${v},${t}`);}\n'
        +'let p=m.make_scalar(3);drop_scalar(p);let caught=false;try{drop_scalar(p)}catch(e){caught=/live original allocation/.test(e.message)}if(!caught)throw Error("Double delete not detected");\n')
    observed=run(['node',str(root/'run.mjs')],root).splitlines()
    assert observed==expected,next(((i,a,b) for i,(a,b) in enumerate(zip(expected,observed)) if a!=b),('length',len(expected),len(observed)))
    # Exact selected custom operators must not become standard heap operations.
    (root/'custom.cpp').write_text('struct C { static void* operator new(__SIZE_TYPE__); int x; }; C *bad(){return new C;}\n')
    run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(root),'--source','custom.cpp','--out-dir',str(out)],root)
    custom=json.loads((out/'custom.cpp.manifest.json').read_text())
    row=next(r for r in custom['definitions'] if r['name']=='bad')
    assert row['status']=='blocked' and 'original provider' in row['reason'],row
    report={'format':'original-source-cpp-heap-native-parity/1','cases':512,'compared_values':512*7,
        'cross_module_delete':True,'original_constructor_destructor_events':True,'this_identity':True,
        'scalar_zero_init':True,'zero_length_and_dynamic_arrays':True,'wide_integer_values':True,
        'null_delete':True,'double_delete_rejected':True,'custom_allocator_rejected':True,
        'class_array_allocation_still_blocked':True,'gameplay_verified':False,
        'compiler_sha256':hashlib.sha256((ROOT/'tools/source_ast_to_js.py').read_bytes()).hexdigest()}
    (ROOT/'reports/oct15-cpp-heap-parity.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2))
