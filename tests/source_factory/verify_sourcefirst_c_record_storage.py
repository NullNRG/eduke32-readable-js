"""Native C/Node/Chromium parity for byte-backed C records and linked pointers."""
import functools,json,os,subprocess,sys,tempfile,threading
from pathlib import Path
from http.server import HTTPServer,SimpleHTTPRequestHandler
ROOT=Path(__file__).resolve().parents[2]

def run(args,cwd=ROOT):
    result=subprocess.run(args,cwd=cwd,capture_output=True,text=True,timeout=120)
    assert result.returncode==0,(args,result.stdout[-2000:],result.stderr[-2000:])
    return result.stdout

with tempfile.TemporaryDirectory(prefix='source-c-record-storage-') as directory:
    root=Path(directory)
    (root/'types.h').write_text('''
typedef struct {int x; unsigned short tag; signed char delta; unsigned char mask;} Value;
typedef struct Node {Value value; struct Node *next; unsigned flags;} Node;
int mutate(Node *,int); int total(const Node *); int global_round(int);
''')
    (root/'unit.c').write_text('''#include "types.h"
static Node original[2];
int mutate(Node *p,int v){
 p->value.x+=v; p->value.tag+=(unsigned short)(v*5);
 p->value.delta=(signed char)(p->value.delta+v);
 p->flags^=(unsigned)v*2654435761u;
 return p->next ? p->next->value.x+p->value.delta : p->value.x;
}
int total(const Node *p){int sum=0;for(int n=0;p && n<2;n++,p=p->next)sum+=p->value.x;return sum;}
int global_round(int v){original[0].next=&original[1];original[1].value.x+=v;
 return mutate(&original[0],v)+total(original);}
''')
    (root/'main.c').write_text('''#include <stdio.h>
#include <stddef.h>
#include "types.h"
int main(void){
 printf("%zu,%zu,%zu,%zu,%zu,%zu\\n",sizeof(Node),offsetof(Node,next),offsetof(Node,flags),offsetof(Value,tag),offsetof(Value,delta),offsetof(Value,mask));
 for(int i=0;i<256;i++){
  Node b={{i*3-80,0,0,0},0,0},a={{i*7-19,(unsigned short)(i*257),(signed char)(i-100),(unsigned char)i},&b,(unsigned)i*9};
  int v=(i*47)%2001-1000;int result=mutate(&a,v);int sum=total(&a);int global=global_round(v);
  printf("%d,%d,%d,%u,%u,%d\\n",result,sum,global,a.flags,(unsigned)a.value.tag,(int)a.value.delta);
 }
}''')
    oracle=root/('oracle.exe' if os.name=='nt' else 'oracle')
    run(['clang','-std=c11',str(root/'unit.c'),str(root/'main.c'),'-o',str(oracle)])
    lines=run([str(oracle)]).splitlines();layout=list(map(int,lines.pop(0).split(',')))
    assert layout==[24,8,16,4,6,7],layout
    expected=[list(map(int,line.split(','))) for line in lines]
    modules=[]
    for label,flags in [('full',[]),('filtered',['--filter','mutate,total,global_round','--exact-filter','--dependency-closure'])]:
        out=root/label
        run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(root),
             '--source','unit.c','--out-dir',str(out),*flags])
        module=out/'unit.c.mjs';manifest=json.loads(module.with_suffix('.manifest.json').read_text())
        assert manifest['blocked']==0,manifest['definitions']
        assert manifest['record_layout_extraction']['records']>0
        modules.append(module)
    # A runtime C heap supplies the *actual* LP64 addresses. No JS object stand-in
    # bypasses record layout, and pointer fields are original shared heap bytes.
    body='''function execute(runtime,m){
 const h=runtime.heap,s=runtime.library.symbols,out=[];
 for(let i=0;i<256;i++){
  const p=s.calloc(2,24),b=p+24,d=new DataView(h.buffer);
  h.write(p,'i32',i*7-19);h.write(p+4,'u16',i*257);h.write(p+6,'i8',i-100);h.write(p+7,'u8',i);
  d.setBigUint64(p+8,BigInt(b),true);h.write(p+16,'u32',i*9);h.write(b,'i32',i*3-80);
  const v=(i*47)%2001-1000,result=m.mutate(p,v),sum=m.total(p),global=m.global_round(v);
  out.push([result,sum,global,h.read(p+16,'u32'),h.read(p+4,'u16'),h.read(p+6,'i8')]);s.free(p);
 }return out;}
'''
    (root/'run.mjs').write_text('import {NativeRuntime} from '+json.dumps((ROOT/'runtime/index.mjs').as_uri())+';\n'
        +body+'\nconst runtime=new NativeRuntime();runtime.bindSourceMemory();const result=[];try{'+''.join('result.push(execute(runtime,await import('+json.dumps(p.as_uri())+')));' for p in modules)
        +'console.log(JSON.stringify(result));}finally{runtime.close();}')
    node=json.loads(run(['node',str(root/'run.mjs')]))
    assert node==[expected,expected],next(((i,a,b) for i,(a,b) in enumerate(zip(node[0],expected)) if a!=b),None)
    from playwright.sync_api import sync_playwright
    class Quiet(SimpleHTTPRequestHandler):
        extensions_map={**SimpleHTTPRequestHandler.extensions_map,'.mjs':'text/javascript'}
        def log_message(self,*args):pass
        def setup(self):super().setup();self.connection.settimeout(2)
        def do_GET(self):
            if self.path=='/':
                data=b'<!doctype html><title>C record storage parity</title>'
                self.send_response(200);self.send_header('Content-Length',str(len(data)));self.end_headers();self.wfile.write(data)
            else:super().do_GET()
    class Server(HTTPServer):request_queue_size=128
    server=Server(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)))
    thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
    try:
        with sync_playwright() as pw:
            browser=pw.chromium.launch(executable_path=os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'),headless=True)
            try:
                page=browser.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
                page.goto(f'http://127.0.0.1:{server.server_port}/')
                result=page.evaluate('async codes=>{const {NativeRuntime}=await import("/runtime/index.mjs");'+body+'''
                  const runtime=new NativeRuntime();runtime.bindSourceMemory();const result=[];try{for(const code of codes){const url=URL.createObjectURL(new Blob([code],{type:'text/javascript'}));
                  try{result.push(execute(runtime,await import(url)));}finally{URL.revokeObjectURL(url);}}return result;}finally{runtime.close();}}''',
                  [p.read_text() for p in modules])
                assert not errors and result==[expected,expected],errors
            finally:browser.close()
    finally:server.shutdown();server.server_close();thread.join()
print('PASS: 512 native/Node/Chromium C-record cases; full/filtered AST, actual numeric heap addresses, nested fields, shared pointer chains, original static arrays')
