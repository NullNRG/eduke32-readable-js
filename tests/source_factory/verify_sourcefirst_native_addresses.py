"""Native parity for LP64 pointer bits, C allocation, aliases and cross-unit free."""
import json,os,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
HEADER='''#pragma once
typedef __SIZE_TYPE__ size_t;
extern "C" {void* malloc(size_t);void* calloc(size_t,size_t);void* realloc(void*,size_t);void free(void*);
void* memcpy(void*,const void*,size_t);void* memmove(void*,const void*,size_t);}
struct Header {void *original;size_t size;};
void *make(size_t,size_t);void release(void*);size_t usable(void*);int check_bits(void*);
int touch(void*,size_t);int resized(size_t);int pointer_slots(int);int growth_case();
int*make_cpp(int);void drop_cpp(int*);
int allocation_address_range();
'''
PROVIDER='''#include "memory.hpp"
void *make(size_t n,size_t alignment){
 char *p=(char*)malloc(n+alignment-1+sizeof(Header));if(!p)return nullptr;
 size_t addr=(size_t)p+sizeof(Header);addr=(addr+alignment-1)&~(alignment-1);
 char *aligned=(char*)addr;Header *h=(Header*)(aligned-sizeof(Header));h->original=p;h->size=n;return aligned;
}
void release(void*p){Header *h=(Header*)((char*)p-sizeof(Header));free(h->original);}
size_t usable(void*p){return ((Header*)((char*)p-sizeof(Header)))->size;}
int check_bits(void*p){Header *h=(Header*)((char*)p-sizeof(Header));unsigned long long bits=0;
 memcpy(&bits,&h->original,8);return bits==(unsigned long long)h->original;}
int resized(size_t n){unsigned char*p=(unsigned char*)calloc(n,1);if(!p)return -1;
 for(size_t i=0;i<n;i++)p[i]=(unsigned char)(i*13+9);
 unsigned char*q=(unsigned char*)realloc(p,n+64);if(!q){free(p);return -2;}
 int sum=0;for(size_t i=0;i<n;i++)sum+=q[i];free(q);return sum;}
int pointer_slots(int n){int x=n,y=n+7;int **p=(int**)calloc(3,sizeof(int*));
 p[0]=&x;p[1]=&y;p[2]=p[0];int total=*p[0]+*p[1]+*p[2];free(p);return total;}
int growth_case(){unsigned char*p=(unsigned char*)malloc(16);p[0]=173;
 unsigned char*q=(unsigned char*)calloc(1,2097152);int result=p[0]+q[2097151];free(q);free(p);free(0);return result;}
int*make_cpp(int n){return new int[n]{};}
void drop_cpp(int*p){delete[]p;}
int allocation_address_range(){void*p=malloc(16);int valid=(unsigned long long)p>16384;free(p);return valid;}
'''
CALLER='''#include "memory.hpp"
int touch(void*p,size_t n){unsigned char*bytes=(unsigned char*)p;
 for(size_t i=0;i<n;i++)bytes[i]=(unsigned char)(i*17+n);
 unsigned long long start=(unsigned long long)bytes;
 unsigned char*alias=(unsigned char*)(start+n/2);int sum=0;
 for(size_t i=n/2;i<n;i++)sum+=alias[i-n/2];return sum;}
int api_memory(int seed){size_t n=(seed*37)%4096+1;size_t a=(size_t)1<<(3+seed%7);
 void*p=make(n,a);if(!p)return -1;
 int result=touch(p,n)+int(usable(p))*3+check_bits(p)*101;
 result+=int((unsigned long long)p%a)*31;release(p);
 return result+resized(n)+pointer_slots(seed)+(seed==0?growth_case()+allocation_address_range():0);}
'''
def run(args,cwd):
    r=subprocess.run(args,cwd=cwd,capture_output=True,text=True,timeout=150)
    assert r.returncode==0,(args,r.stdout[-2000:],r.stderr[-5000:]);return r.stdout.strip()
with tempfile.TemporaryDirectory(prefix='source-native-addresses-') as tmp:
    root=Path(tmp)
    for name,data in [('memory.hpp',HEADER),('provider.cpp',PROVIDER),('caller.cpp',CALLER)]:
        (root/name).write_text(data)
    (root/'driver.cpp').write_text('#include <cstdio>\nint api_memory(int);int main(){for(int i=0;i<256;i++)printf("%d\\n",api_memory(i));}\n')
    exe=root/('oracle.exe' if os.name=='nt' else 'oracle')
    run(['clang++','-std=c++14','provider.cpp','caller.cpp','driver.cpp','-o',str(exe)],root)
    expected=run([str(exe)],root).splitlines()
    out=root/'out'
    def emit(name,index=None):
        cmd=[sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(root),'--source',name,'--out-dir',str(out)]
        if index:cmd+=['--project-symbols',str(index)]
        run(cmd,ROOT)
        return json.loads((out/(name+'.manifest.json')).read_text())
    provider=emit('provider.cpp')
    bad=[r for r in provider['definitions'] if r['status']=='blocked' and r['kind']=='FunctionDecl']
    assert not bad,bad
    index=root/'symbols.json'
    index.write_text(json.dumps({r['name']:'provider.cpp' for r in provider['definitions'] if r['status']=='source-first'}))
    caller=emit('caller.cpp',index)
    bad=[r for r in caller['definitions'] if r['status']=='blocked' and r['kind']=='FunctionDecl']
    assert not bad,bad
    runner=root/'run.mjs'
    runner.write_text('import {NativeRuntime} from '+json.dumps((ROOT/'runtime/index.mjs').as_uri())+';\n'
                     +'const runtime=new NativeRuntime(),heap=runtime.bindSourceMemory();const old=heap.malloc(64);heap.free(old);\n'
                     +'const {api_memory}=await import('+json.dumps((out/'caller.cpp.mjs').as_uri())+');\n'
                     'for(let i=0;i<256;i++)console.log(api_memory(i));\n')
    assert run(['node',str(runner)],root).splitlines()==expected
    # Unknown addresses, invalid frees and live aliases after free must fail.
    assertions=root/'reject.mjs'
    assertions.write_text('import * as m from '+json.dumps((out/'provider.cpp.mjs').as_uri())+';\n'
        'const a=globalThis[Symbol.for("source-lp64-addresses/2")];let caught=0;\n'
        'for(const f of [()=>a.decode(0x123456789n),()=>{const p=m.make(16n,16n);m.release(p);m.usable(p);},'
        '()=>{const p=m.make(32n,16n);m.release(p);m.release(p);}]){try{f();}catch(e){caught++;}}\n'
        'if(caught!==3)throw Error("Invalid C addresses accepted");\n')
    run(['node',str(assertions)],root)
    # C++ delete must release the registry's strong buffer references too.
    # Forced GC checks real allocation retention, independently of its counters.
    garbage=root/'release.mjs'
    garbage.write_text('import * as m from '+json.dumps((out/'provider.cpp.mjs').as_uri())+';\n'
        +'const a=globalThis[Symbol.for("source-lp64-addresses/2")],refs=[];\n'
        +'for(let i=0;i<64;i++){const p=m.make_cpp(262144);a.encode(p);refs.push(new WeakRef(p.buffer));m.drop_cpp(p);}\n'
        +'for(let i=0;i<10;i++){await new Promise(r=>setTimeout(r,0));global.gc();}\n'
        +'if(refs.filter(ref=>ref.deref()!==undefined).length>1)throw Error("Deleted C++ byte buffers remain retained by pointer addresses");\n')
    run(['node','--expose-gc',str(garbage)],root)
    sys.path.insert(0,str(ROOT/'tools'))
    from source_first_global_link import storage_import_error
    dep={'name':'make','from':'provider.cpp','native_pointer_abi':caller['native_pointer_abi']}
    assert storage_import_error(dep,{'provider.cpp':{'manifest':provider}}) is None
    legacy={**provider};legacy.pop('native_pointer_abi')
    assert 'native-pointer ABI' in storage_import_error(dep,{'provider.cpp':{'manifest':legacy}})
    filtered=root/'filtered'
    run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(root),'--source','provider.cpp',
         '--filter','resized,pointer_slots,growth_case','--out-dir',str(filtered)],ROOT)
    filtered_manifest=json.loads((filtered/'provider.cpp.manifest.json').read_text())
    for name in ('resized','pointer_slots','growth_case'):
        row=next(r for r in filtered_manifest['definitions'] if r['name']==name)
        assert row['status']=='source-first',row
    assert set(filtered_manifest['c_allocator_declarations']['proven'])=={'malloc','calloc','realloc','free'}
    filtered_runner=root/'filtered.mjs'
    filtered_runner.write_text('import * as m from '+json.dumps((filtered/'provider.cpp.mjs').as_uri())+';\n'
        +'for(let n=0;n<256;n++){let sum=0;for(let i=0;i<n;i++)sum+=(i*13+9)&255;'
        +'if(m.resized(BigInt(n))!==sum||m.pointer_slots(n)!==3*n+7)throw Error("Filtered C allocation differs");}\n'
        +'if(m.growth_case()!==173)throw Error("Source aliases detached during heap growth");\n')
    run(['node',str(filtered_runner)],root)
    # A same-signature C++ namespace function has no canonical C linkage.
    (root/'custom.cpp').write_text('namespace custom {void*malloc(__SIZE_TYPE__);}\nvoid* custom_alloc(){return custom::malloc(16);}\n')
    custom=emit('custom.cpp')
    row=next(r for r in custom['definitions'] if r['name']=='custom_alloc')
    assert row['status']=='blocked' and 'malloc' in row['reason'],row
    run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(root),'--source','custom.cpp',
         '--filter','custom_alloc','--out-dir',str(filtered)],ROOT)
    custom=json.loads((filtered/'custom.cpp.manifest.json').read_text())
    assert 'malloc' in custom['c_allocator_declarations']['rejected'],custom
print('PASS 256 native/Node cases: aligned original-style allocation, pointer bits, aliases, realloc, cross-unit free, calloc pointer slots and invalid-address/ABI rejection')
