"""Addresses of projected record-array elements retain real subarray bytes."""
import base64,json,os,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def run(args):
    task=subprocess.run(list(map(str,args)),cwd=ROOT,text=True,capture_output=True,timeout=180)
    assert task.returncode==0,(args,task.stdout[-1500:],task.stderr[-3500:]);return task.stdout
with tempfile.TemporaryDirectory(prefix='record-array-addresses-',dir=ROOT/'work') as folder:
    root=Path(folder)
    (root/'types.hpp').write_text('''struct Link;
struct LinkBase{Link*next=nullptr;};
struct Link:LinkBase{int value;};
struct Packet{unsigned prefix;Link nodes[3];unsigned suffix;};
''')
    (root/'unit.cpp').write_text('''#include "types.hpp"
extern "C" int exercise(Packet*p,int n){Link*first=p->nodes;Link*chosen=p->nodes+n%3;
 chosen->value+=n*11;chosen->next=first;
 p->prefix+=(unsigned)n*19u;p->suffix^=(unsigned)n*71u;
 int result=chosen->next->value+chosen->value+(int)p->prefix+(int)p->suffix;
 result+=(chosen==&p->nodes[n%3]?1000:0)+(chosen->next==p->nodes?2000:0);
 chosen->next=nullptr;return result;}
''')
    (root/'main.cpp').write_text('''#include "types.hpp"
#include <cstdio>
extern "C" int exercise(Packet*,int);
void bytes(const Packet&p){auto b=(const unsigned char*)&p;for(unsigned i=0;i<sizeof(p);i++)printf("%02x",b[i]);}
int main(){for(int n=0;n<256;n++){Packet p{};p.prefix=n*101+17;p.suffix=n*37+31;
 for(int i=0;i<3;i++)p.nodes[i].value=n*13+i*7;
 bytes(p);int result=exercise(&p,n);printf(" %d ",result);bytes(p);printf("\\n");}}
''')
    oracle=root/'oracle.exe';run(['clang++','-std=c++14','-O1',root/'unit.cpp',root/'main.cpp','-o',oracle])
    cases=[line.split() for line in run([oracle]).splitlines()]
    out=root/'out';run([sys.executable,ROOT/'tools/source_ast_to_js.py','--root',root,'--source','unit.cpp',
        '--out-dir',out,'--filter','exercise','--exact-filter','--dependency-closure','--require-record-layouts'])
    module=out/'unit.cpp.mjs';doc=json.loads(module.with_suffix('.manifest.json').read_text())
    row=next(r for r in doc['definitions'] if r['name']=='exercise');assert row['status']=='source-first',row
    js='''async({url,cases})=>{const {exercise}=await import(url);return cases.map((row,n)=>{
 const bytes=Uint8Array.from(row[0].match(/../g),x=>parseInt(x,16));const result=exercise(bytes,n);
 return [String(result),Array.from(bytes,x=>x.toString(16).padStart(2,'0')).join('')];});}'''
    wanted=[row[1:] for row in cases];runner=root/'run.mjs'
    runner.write_text('console.log(JSON.stringify(await ('+js+')('+json.dumps({'url':module.as_uri(),'cases':cases})+')));')
    observed=json.loads(run(['node',runner]));assert observed==wanted,(observed[:3],wanted[:3])
    if os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'):
        from playwright.sync_api import sync_playwright
        with sync_playwright() as pw:
            browser=pw.chromium.launch(executable_path=os.environ['EDUKE_CHROMIUM_EXECUTABLE'],headless=True)
            try:
                page=browser.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
                observed=page.evaluate(js,{'url':'data:text/javascript;base64,'+base64.b64encode(module.read_bytes()).decode(),'cases':cases})
                assert observed==wanted and not errors,(observed[:3],wanted[:3],errors)
            finally:browser.close()
print('PASS 256 native/Node and 256 native/Chromium record-array address cases: original nonzero subarray offsets, element/base pointer identity, inherited pointer fields and full native byte comparisons')
