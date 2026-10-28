"""Compiled C record aliases survive independent browser C heap growth."""
import base64,hashlib,json,os,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
SOURCE=r'''
struct HeapRecord {int value;unsigned short flags;int samples[4];};
int mutate_heap_record(void *raw,int n){HeapRecord *p=(HeapRecord*)raw;p->value+=n;p->flags^=(unsigned short)(n*7);p->samples[2]+=n*3;return p->value+(int)p->flags+p->samples[2];}
int read_heap_record(void *raw){HeapRecord *p=(HeapRecord*)raw;return p->value+(int)p->flags+p->samples[2];}
int heap_record_size(){return sizeof(HeapRecord);}
'''
def run(args,cwd):
 p=subprocess.run(args,cwd=cwd,capture_output=True,text=True,timeout=120)
 assert p.returncode==0,(args,p.stdout[-1500:],p.stderr[-3000:]);return p.stdout.strip()
with tempfile.TemporaryDirectory(prefix='source-host-heap-alias-') as directory:
 root=Path(directory);(root/'unit.cpp').write_text(SOURCE)
 (root/'main.cpp').write_text('#include <cstdio>\n#include <cstdlib>\n#include <cstring>\n#include "unit.cpp"\nint main(){for(int n=-256;n<256;n++){auto*p=(HeapRecord*)calloc(1,sizeof(HeapRecord));int a=mutate_heap_record(p,n);void*q=malloc(65536);memset(q,3,65536);int b=mutate_heap_record(p,n+5);int c=read_heap_record(p);printf("%d,%d,%d\\n",a,b,c);free(q);free(p);}}')
 native=root/'native.exe';run(['clang++','-std=c++14','main.cpp','-o',str(native)],root);expected=run([str(native)],root).splitlines()
 out=root/'out';run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(root),'--source','unit.cpp','--out-dir',str(out)],root)
 module=out/'unit.cpp.mjs';manifest=json.loads(module.with_suffix('.manifest.json').read_text());assert manifest['blocked']==0,manifest['definitions']
 abi=ROOT/'runtime/abi.mjs'
 js=r'''async ({source,abi})=>{
 const m=await import(source),{ABIHeap}=await import(abi),rows=[];
 for(let n=-256;n<256;n++){
  const heap=new ABIHeap(64,1<<20),ptr=heap.calloc(1,m.heap_record_size());
  const alias=heap.borrow(ptr,m.heap_record_size()),original=heap.buffer;
  const a=m.mutate_heap_record(alias,n);
  heap.malloc(65536);
  if(heap.buffer!==original||alias.buffer!==heap.buffer)throw Error('Original source alias lost its buffer identity');
  const b=m.mutate_heap_record(alias,n+5),c=m.read_heap_record(heap.borrow(ptr,m.heap_record_size()));
  if(heap.read(ptr,'i32')!==2*n+5)throw Error('Source write did not reach host heap');
  heap.write(ptr,'i32',n);
  if(m.read_heap_record(alias)!==c-(2*n+5)+n)throw Error('Host write did not reach source alias');
  rows.push([a,b,c].join(','));heap.free(ptr);
  let rejected=false;try{heap.borrow(ptr,m.heap_record_size());}catch(e){rejected=e instanceof RangeError;}
  if(!rejected)throw Error('Freed allocation was lent as live source storage');
 }
 return rows;
}'''
 arguments={'source':module.as_uri(),'abi':abi.as_uri()}
 (root/'run.mjs').write_text('console.log((await ('+js+')('+json.dumps(arguments)+')).join("\\n"));')
 actual=run(['node',str(root/'run.mjs')],root).splitlines();assert actual==expected,(actual[:3],expected[:3])
 from playwright.sync_api import sync_playwright
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path=os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'),headless=True);page=browser.new_page()
  arguments={name:'data:text/javascript;base64,'+base64.b64encode(path.read_bytes()).decode()for name,path in [('source',module),('abi',abi)]}
  actual=page.evaluate(js,arguments);assert actual==expected,(actual[:3],expected[:3]);version=browser.version;browser.close()
 report={'format':'source-host-heap-alias-parity/1','passed':True,'native_node_cases':512,'native_chromium_cases':512,'compared_values':1536,
  'checks':['same underlying buffer after growth','source and host writes share bytes','Clang record and array-field views remain valid',
   'native C parity across independent allocations','new borrowing of freed storage rejected'],
  'host_memory_bridge_complete':False,'original_allocator_closure_verified':False,'gameplay_verified':False,'browser_version':version,
  'runtime_sha256':hashlib.sha256(abi.read_bytes()).hexdigest()}
 (ROOT/'reports/oct19-host-heap-alias-parity.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
