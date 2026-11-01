"""Native-constructed nontrivial objects retain their original field bytes.

The tested JS operation mutates existing fields only; construction, copying,
and dispatch through a missing nontrivial prototype must remain blocked.
"""
import base64,json,os,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]

def run(args,cwd):
    p=subprocess.run(list(map(str,args)),cwd=cwd,capture_output=True,text=True,timeout=180)
    assert p.returncode==0,(args,p.stdout[-1500:],p.stderr[-3000:])
    return p.stdout

with tempfile.TemporaryDirectory(prefix='source-nontrivial-view-',dir=ROOT/'work') as temporary:
    root=Path(temporary)
    (root/'state.hpp').write_text('''
struct Counter {
 int value;
 Counter():value(19){}
 Counter(const Counter& other):value(other.value+1){}
 ~Counter(){value=-1;}
 int get()const{return value;}
};
struct Node {};
template<typename T> struct Pending {T*head;int stamp;Pending():head(nullptr),stamp(41){};};
struct Outer {Counter counter;unsigned flags;short samples[3];Pending<Node> pending;};
''')
    (root/'unit.cpp').write_text('''#include "state.hpp"
extern "C" int modify(Outer*p,int n){
 p->counter.value+=n;p->flags^=(unsigned)(n*37);
 p->samples[n%3]=(short)(p->samples[n%3]+n*11);
 p->pending.stamp+=n*3;
 return p->counter.value+(int)p->flags+p->samples[0]+p->samples[1]+p->samples[2]+p->pending.stamp;
}
extern "C" int copy_value(Outer*p){Outer x=*p;return x.counter.value;}
extern "C" int make_local(){Outer x;return x.counter.value;}
extern "C" int method(Outer*p){return p->counter.get();}
''')
    (root/'native.cpp').write_text('''#include "state.hpp"
#include <cstdio>
#include <cstring>
extern "C" int modify(Outer*,int);
void bytes(const Outer&x){const unsigned char*p=(const unsigned char*)&x;
 for(unsigned i=0;i<sizeof(x);i++)printf("%02x",p[i]);}
int main(){for(int n=0;n<256;n++){
 Outer x;x.counter.value=n*3-17;x.flags=n*71;x.samples[0]=2;x.samples[1]=-7;x.samples[2]=29;
 bytes(x);int result=modify(&x,n);printf(",%d,",result);bytes(x);printf("\\n");}}
''')
    exe=root/'oracle.exe'
    run(['clang++','-std=c++14',root/'unit.cpp',root/'native.cpp','-o',exe],root)
    expected=[line.split(',') for line in run([exe],root).splitlines()]
    for filtered in (False,True):
        out=root/('filtered' if filtered else 'full')
        args=[sys.executable,ROOT/'tools/source_ast_to_js.py','--root',root,'--source','unit.cpp',
              '--out-dir',out,'--require-record-layouts']
        if filtered:args+=['--filter','modify,copy_value,make_local,method','--exact-filter',
                           '--dependency-closure','--header-dependency-closure','--header-inlines']
        run(args,root)
        module=out/'unit.cpp.mjs';report=json.loads(module.with_suffix('.manifest.json').read_text())
        rows={row['source_name']:row for row in report['definitions']}
        assert rows['modify']['status']=='source-first',rows['modify']
        for name in ('copy_value','make_local','method'):
            assert rows[name]['status']=='blocked',(name,rows[name])
        driver=root/'run.mjs'
        driver.write_text('import {modify} from '+json.dumps(module.as_uri())+';\n'+
            'const cases='+json.dumps(expected)+';\n'+'''
for(let n=0;n<cases.length;n++){
 const bytes=Uint8Array.from(Buffer.from(cases[n][0],'hex'));
 const result=modify(bytes,n);console.log(result+','+Buffer.from(bytes).toString('hex'));
}
''')
        actual=run(['node',driver],root).splitlines()
        wanted=[','.join(row[1:]) for row in expected]
        assert actual==wanted,next(((i,a,b) for i,(a,b) in enumerate(zip(actual,wanted)) if a!=b),None)
    # Exercise the private runtime guards as well as the compiler's guards.
    guards=root/'guards.mjs'
    guards.write_text(module.read_text()+'''
export {cInitByteRecord,cCopyAggregate,cRecordPointer,cRecordPointerViews,cByteRecordArray};
''')
    driver.write_text('import * as r from '+json.dumps(guards.as_uri())+''';
const schema={size:4,align:4,projection:true,fields:{value:{offset:0,native:'Int32Array',size:4}}};
const bytes=new Uint8Array([19,0,0,0]);const object=r.cInitByteRecord(schema,{},bytes);
let rejected=0;function reject(f){try{f();}catch(e){if(e instanceof TypeError){rejected++;return;}throw e;}throw Error('Illegal nontrivial operation accepted');}
reject(()=>r.cInitByteRecord(schema));
reject(()=>r.cInitByteRecord(schema,{value:5},bytes));
reject(()=>r.cInitByteRecord(schema,()=>({}),bytes));
reject(()=>r.cRecordPointer({value:19},schema));
reject(()=>r.cCopyAggregate(object,{byteRecord:schema}));
reject(()=>r.cByteRecordArray(schema,1));
const pointer=r.cRecordPointer(bytes,schema);
reject(()=>{r.cRecordPointerViews.element(pointer,0).value=object;});
const array=r.cByteRecordArray(schema,1,{},[],bytes);
reject(()=>{array[0]=object;});
object.value=73;if(new DataView(bytes.buffer).getInt32(0,true)!==73)throw Error('Detached original fields');
console.log(rejected);
''')
    assert run(['node',driver],root).strip()=='8'
    from playwright.sync_api import sync_playwright
    with sync_playwright() as pw:
        browser=pw.chromium.launch(executable_path=os.environ['EDUKE_CHROMIUM_EXECUTABLE'],headless=True)
        try:
            page=browser.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
            actual=page.evaluate('''async ({source,cases})=>{
 const url=URL.createObjectURL(new Blob([atob(source)],{type:'text/javascript'}));
 try{const {modify}=await import(url);return cases.map((row,n)=>{
 const bytes=Uint8Array.from(row[0].match(/../g),x=>parseInt(x,16));const result=modify(bytes,n);
 return result+','+Array.from(bytes,x=>x.toString(16).padStart(2,'0')).join('');});}
 finally{URL.revokeObjectURL(url);}
}''',{'source':base64.b64encode(module.read_bytes()).decode(),'cases':expected})
            assert actual==wanted and not errors,(actual[:3],wanted[:3],errors)
        finally:browser.close()
print('PASS 512 native/JS plus 256 native/Chromium nontrivial field mutations with complete byte comparisons; 8 runtime lifetime/copy guards; constructor/copy/missing-prototype paths remain blocked')
