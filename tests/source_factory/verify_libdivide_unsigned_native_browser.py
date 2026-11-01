"""Bundled libdivide unsigned generator records versus native and Chromium."""
import functools,hashlib,json,os,subprocess,sys,tempfile,threading
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
ROOT=Path(__file__).resolve().parents[2]
header=ROOT/'factory-output/source-tree/eduke32-master/source/build/include/libdivide.h'
divisors=sorted(set(range(1,16385))|{(1<<n)+k for n in range(1,32) for k in (-1,0,1)}|{4294967295,4294967294,2147483647,2147483649})
cpp='#include <cstdio>\n#include <cstdint>\n#include "libdivide.h"\nint main(){uint32_t ds[]={'+','.join(str(n)+'u' for n in divisors)+'''};
for(auto d:ds){auto a=libdivide::libdivide_u32_gen(d);printf("%u %u %u",d,a.magic,a.more);
if(d!=1){auto b=libdivide::libdivide_u32_branchfree_gen(d);printf(" %u %u",b.magic,b.more);}
for(unsigned i=0;i<sizeof(a);i++)printf(" %u",((unsigned char*)&a)[i]);
if(d!=1){auto b=libdivide::libdivide_u32_branchfree_gen(d);for(unsigned i=0;i<sizeof(b);i++)printf(" %u",((unsigned char*)&b)[i]);}puts("");}}
'''
def run(args):
 p=subprocess.run(list(map(str,args)),capture_output=True,text=True,timeout=120,cwd=ROOT);assert p.returncode==0,(p.stdout,p.stderr);return p.stdout
with tempfile.TemporaryDirectory(prefix='unsigned-divide-',dir=ROOT/'work') as directory:
 p=Path(directory);src=p/'oracle.cpp';src.write_text(cpp);exe=p/'oracle.exe'
 run(['clang++','-std=c++14','-O2','-I',header.parent,src,'-o',exe]);expected=[[int(n) for n in row.split()] for row in run([exe]).splitlines()]
 js='''const l=await import(PATH);const ds=DIVISORS;
const rows=ds.map(d=>{const a=l.libdivide_u32_gen(d);let r=[d,a.magic,a.more];
if(d!==1){const b=l.libdivide_u32_branchfree_gen(d);r.push(b.magic,b.more);}
const storage=value=>value[Symbol.for('source-first.original-byte-record-storage/1')];
if(storage(a).bytes.length!==5)throw Error('Wrong original packed divider size');
r.push(...storage(a).bytes);if(d!==1)r.push(...storage(l.libdivide_u32_branchfree_gen(d)).bytes);return r;});
for(const d of [0,-1,4294967296,1.5]){let rejected=false;try{l.libdivide_u32_gen(d);}catch(e){rejected=e instanceof RangeError;}if(!rejected)throw Error('invalid divisor accepted');}
let rejected=false;try{l.libdivide_u32_branchfree_gen(1);}catch(e){rejected=e instanceof RangeError;}if(!rejected)throw Error('branchfree one accepted');
'''.replace('DIVISORS',json.dumps(divisors))
 script=p/'check.mjs';script.write_text(js.replace('PATH',json.dumps((ROOT/'runtime/libdivide_abi.mjs').as_uri()))+'console.log(JSON.stringify(rows));')
 actual=json.loads(run(['node',script]));assert actual==expected,next(((a,b) for a,b in zip(actual,expected) if a!=b),'length')
 class Quiet(SimpleHTTPRequestHandler):
  extensions_map={**SimpleHTTPRequestHandler.extensions_map,'.mjs':'text/javascript'}
  def log_message(self,*args):pass
 server=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)));thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
 from playwright.sync_api import sync_playwright
 try:
  with sync_playwright() as pw:
   browser=pw.chromium.launch(executable_path=os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'),headless=True)
   page=browser.new_page();page.goto(f'http://127.0.0.1:{server.server_port}/')
   got=page.evaluate('async()=>{'+js.replace('PATH',json.dumps('/runtime/libdivide_abi.mjs'))+'return rows;}');assert got==expected
   version=browser.version;browser.close()
 finally:server.shutdown();server.server_close()
 report={'passed':True,'native_node_records':len(expected)*2-1,'native_chromium_records':len(expected)*2-1,
         'header_sha256':hashlib.sha256(header.read_bytes()).hexdigest(),'module_sha256':hashlib.sha256((ROOT/'runtime/libdivide_abi.mjs').read_bytes()).hexdigest(),
         'browser_version':version,'native_packed_bytes_verified':True,'gameplay_verified':False}
 (ROOT/'reports/oct30-unsigned-libdivide-parity.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
