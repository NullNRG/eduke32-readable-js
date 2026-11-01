"""Native byte/string/sort parity across numeric and bounded source pointers."""
import functools,json,os,subprocess,sys,tempfile,threading
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
ROOT=Path(__file__).resolve().parents[2]
def run(args):
 r=subprocess.run(list(map(str,args)),cwd=ROOT,capture_output=True,text=True,timeout=120);assert r.returncode==0,(r.stdout[-1000:],r.stderr[-2500:]);return r.stdout
cpp=r'''#include <cstdio>
#include <cstring>
#include <cstdlib>
int cmp(const void*a,const void*b){return *(const int*)a-*(const int*)b;}
int main(){for(int seed=0;seed<128;seed++){
 unsigned char a[12]={},b[48];for(int i=0;i<10;i++)a[i]=1+(seed+i*17)%255;
 memset(b,165,sizeof(b));strcpy((char*)b,(char*)a);memmove(b+3,b,11);memset(b+20,seed,5);
 strncpy((char*)b+28,(char*)a,14);strncat((char*)b,(char*)a,3);
 for(auto v:b)printf("%02x",v);printf("|%llu|",(unsigned long long)strlen((char*)b));
 int d=strcmp((char*)a,(char*)b);printf("%d|",(d>0)-(d<0));
 int values[8];for(int i=0;i<8;i++)values[i]=(seed*13+i*37)%101-50;
 qsort(values,8,sizeof(int),cmp);for(int i=0;i<8;i++)printf("%s%d",i?",":"",values[i]);puts("");}}
'''
js='''async root=>{
 const {NativeRuntime}=await import(root+'/runtime/index.mjs');
 const {sourceByteView,sourceByteOffset}=await import(root+'/runtime/source_bytes.mjs');
 const rt=new NativeRuntime(),h=rt.heap,c=rt.library.symbols,rows=[];
 const at=(p,n)=>typeof p==='number'?p+n:sourceByteOffset(p,n);
 const data=(p,n)=>sourceByteView(p)?.subarray(0,n)??h.u8.subarray(p,p+n);
 try{for(let seed=0;seed<128;seed++)for(let mode=0;mode<3;mode++){
  const input=new Uint8Array(12);for(let i=0;i<10;i++)input[i]=1+(seed+i*17)%255;
  const ap=h.malloc(12);h.u8.set(input,ap);
  const dp=h.malloc(48),external=new Uint8Array(56).fill(165);
  const a=mode===0?ap:input,b=mode===1?dp:sourceByteOffset(external,8);
  c.memset(b,165,48);c.strcpy(b,a);c.memmove(at(b,3),b,11);c.memset(at(b,20),seed,5);
  c.strncpy(at(b,28),a,14);c.strncat(b,a,3);
  const bytes=data(b,48),prefix=[...bytes].map(n=>n.toString(16).padStart(2,'0')).join('');
  const raw=new Uint8Array(48).fill(0xa5),ints=new DataView(raw.buffer);
  for(let i=0;i<8;i++)ints.setInt32(8+i*4,(seed*13+i*37)%101-50,true);
  const address=sourceByteOffset(raw,8),read=p=>{const v=sourceByteView(p);return new DataView(v.buffer,v.byteOffset,4).getInt32(0,true);};
  c.qsort(address,8,4,(x,y)=>read(x)-read(y));
  if([...raw.subarray(0,8),...raw.subarray(40)].some(n=>n!==0xa5))throw Error('qsort escaped original allocation bounds');
  rows.push(prefix+'|'+c.strlen(b)+'|'+Math.sign(c.strcmp(a,b))+'|'+Array.from({length:8},(_,i)=>ints.getInt32(8+i*4,true)).join(','));
  h.free(ap);h.free(dp);
 }
 let rejected=false;try{c.memcpy(new Uint8Array(1),new Uint8Array(2),2);}catch(e){rejected=e instanceof RangeError;}if(!rejected)throw Error('unbounded write accepted');
 return rows;}finally{rt.close();}
}'''
with tempfile.TemporaryDirectory(prefix='browser-byte-memory-',dir=ROOT/'work') as directory:
 p=Path(directory);(p/'oracle.cpp').write_text(cpp);exe=p/'oracle.exe';run(['clang++','-std=c++14',p/'oracle.cpp','-o',exe]);native=run([exe]).splitlines();expected=[row for row in native for _ in range(3)]
 script=p/'check.mjs';script.write_text('console.log(JSON.stringify(await ('+js+')('+json.dumps(ROOT.as_uri())+')));')
 assert json.loads(run(['node',script]))==expected
 class Quiet(SimpleHTTPRequestHandler):
  extensions_map={**SimpleHTTPRequestHandler.extensions_map,'.mjs':'text/javascript'}
  def log_message(self,*args):pass
 server=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)));threading.Thread(target=server.serve_forever,daemon=True).start()
 from playwright.sync_api import sync_playwright
 try:
  with sync_playwright() as pw:
   browser=pw.chromium.launch(executable_path=os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'),headless=True);page=browser.new_page()
   page.goto(f'http://127.0.0.1:{server.server_port}/runtime/')
   actual=page.evaluate(js,'');assert actual==expected;version=browser.version;browser.close()
 finally:server.shutdown();server.server_close()
 report={'passed':True,'native_node_cases':len(expected),'native_chromium_cases':len(expected),'original_storage_aliases_and_bounds_verified':True,'browser_version':version,'gameplay_verified':False}
 (ROOT/'reports/oct30-browser-memory-parity.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
