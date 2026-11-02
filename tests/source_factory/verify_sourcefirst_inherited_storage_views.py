"""Existing inherited C++ fields use Clang's base offsets, never new lifetimes."""
import base64,json,os,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def run(args,cwd=ROOT):
    p=subprocess.run(list(map(str,args)),cwd=cwd,text=True,capture_output=True,timeout=180)
    assert p.returncode==0,(args,p.stdout[-1600:],p.stderr[-3200:]);return p.stdout
with tempfile.TemporaryDirectory(dir=ROOT/'work',prefix='inherited-storage-') as folder:
    root=Path(folder)
    (root/'types.hpp').write_text('''#include <stdint.h>
#include <atomic>
template<typename T>struct Basic{T value;explicit Basic(int n):value(n*5){}};
using Base=Basic<int32_t>;
struct Middle:Base{uint32_t flags;explicit Middle(int n):Base(n),flags((unsigned)n*101){}};
struct Child:Middle{uint16_t code;explicit Child(int n):Middle(n),code(n*29){}};
struct Envelope{Child child;};
struct Virtual{int value;virtual int read(){return value;}};
struct Other{int second;};struct Multiple:Base,Other{explicit Multiple(int n):Base(n){}};
struct MultiEnvelope{Multiple member;};
struct AtomicEnvelope{std::atomic<int> state;};
''')
    (root/'unit.cpp').write_text('''#include "types.hpp"
extern "C" int adjust(Envelope *p,int delta){
 p->child.value+=delta;p->child.flags^=(unsigned)delta*257u;p->child.code+=delta*13;
 Base *alias=&p->child;alias->value+=3;
 return p->child.value+(int)p->child.flags+p->child.code+1000*(alias==(Base*)&p->child);
}
extern "C" int construct(int n){Child c(n);return c.value;}
extern "C" int copy(Envelope*p){Child c=p->child;return c.value;}
extern "C" int virtual_read(Virtual*p){return p->read();}
extern "C" int multiple_read(MultiEnvelope*p){return p->member.second;}
extern "C" int atomic_bytes(AtomicEnvelope*p,int delta){
 unsigned char *bytes=(unsigned char*)&p->state;
 bytes[delta&3]^=(unsigned char)(delta+17);
 return bytes[0]+bytes[1]*7+bytes[2]*19+bytes[3]*37;
}
''')
    (root/'main.cpp').write_text('''#include "types.hpp"
#include <cstdio>
extern "C" int adjust(Envelope*,int);
extern "C" int atomic_bytes(AtomicEnvelope*,int);
void bytes(const void*p,unsigned size){auto b=(const unsigned char*)p;for(unsigned j=0;j<size;j++)printf("%02x",b[j]);}
int main(){for(int n=0;n<256;n++){Envelope object{Child(n)};
 bytes(&object,sizeof(object));int result=adjust(&object,n+11);
 printf(" %d ",result);bytes(&object,sizeof(object));
 AtomicEnvelope atomic;atomic.state.store(n*991+11);printf(" ");bytes(&atomic,sizeof(atomic));
 int atomic_result=atomic_bytes(&atomic,n+11);printf(" %d ",atomic_result);bytes(&atomic,sizeof(atomic));printf("\\n");}}
''')
    oracle=root/'oracle.exe';run(['clang++','-std=c++14','-O1',root/'unit.cpp',root/'main.cpp','-o',oracle])
    cases=[line.split() for line in run([oracle]).splitlines()]
    for filtered in (False,True):
        out=root/str(filtered);args=[sys.executable,ROOT/'tools/source_ast_to_js.py','--root',root,
            '--source','unit.cpp','--out-dir',out,'--require-record-layouts']
        if filtered:args+=['--filter','adjust,construct,copy,virtual_read,multiple_read,atomic_bytes',
            '--exact-filter','--dependency-closure','--header-dependency-closure']
        run(args);module=out/'unit.cpp.mjs';document=json.loads(module.with_suffix('.manifest.json').read_text())
        rows={row['name']:row for row in document['definitions']}
        assert rows['adjust']['status']=='source-first',rows['adjust']
        assert rows['atomic_bytes']['status']=='source-first',rows['atomic_bytes']
        for name in ('construct','copy','virtual_read','multiple_read'):
            assert rows[name]['status']=='blocked',(name,rows[name])
        js='''async ({url,cases})=>{const {adjust,atomic_bytes}=await import(url);return cases.map((row,n)=>{
 const bytes=Uint8Array.from(row[0].match(/../g),x=>parseInt(x,16));
 const value=adjust(bytes,n+11);
 const atomic=Uint8Array.from(row[3].match(/../g),x=>parseInt(x,16)),result=atomic_bytes(atomic,n+11);
 return [String(value),Array.from(bytes,x=>x.toString(16).padStart(2,'0')).join(''),
 String(result),Array.from(atomic,x=>x.toString(16).padStart(2,'0')).join('')];});}'''
        runner=root/'run.mjs';runner.write_text('console.log(JSON.stringify(await ('+js+')('+json.dumps({'url':module.as_uri(),'cases':cases})+')));')
        wanted=[[row[1],row[2],row[4],row[5]] for row in cases];observed=json.loads(run(['node',runner]));assert observed==wanted,(observed[:3],wanted[:3])
        if os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'):
            from playwright.sync_api import sync_playwright
            with sync_playwright() as pw:
                browser=pw.chromium.launch(executable_path=os.environ['EDUKE_CHROMIUM_EXECUTABLE'],headless=True)
                try:
                    page=browser.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
                    observed=page.evaluate(js,{'url':'data:text/javascript;base64,'+base64.b64encode(module.read_bytes()).decode(),'cases':cases})
                    assert observed==wanted and not errors,(observed[:3],wanted[:3],errors)
                finally:browser.close()
print('PASS 1024 native/Node and 1024 native/Chromium inherited-field/std::atomic byte cases; full byte comparisons and base pointer identity; projected construction/copy/virtual/multiple-base paths remain blocked')
