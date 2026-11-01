"""Native parity for original scalar/pointer atomic expressions and aliases."""
import asyncio,base64,json,os,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def run(args):
 p=subprocess.run([str(x) for x in args],cwd=ROOT,capture_output=True,text=True,timeout=90)
 assert p.returncode==0,(args,p.stderr[-2200:],p.stdout[-800:]);return p.stdout
source='''extern "C" int integer_probe(int x){
 int value=x; int old=__atomic_fetch_add(&value,3,5);int expected=value;
 int pass=__atomic_compare_exchange_n(&value,&expected,11,true,4,2);
 expected=-1;int fail=__atomic_compare_exchange_n(&value,&expected,9,false,5,2);
 int after=__atomic_load_n(&value,2);__atomic_store_n(&value,x,3);
 int exchange=__atomic_exchange_n(&value,7,5);
 return old+pass*1000+fail*100+expected*10+after+exchange+value;
}
extern "C" unsigned int unsigned_probe(unsigned int x){
 __atomic_add_fetch(&x,4294967295U,5);__atomic_xor_fetch(&x,0xa5a5a5a5U,0);
 __atomic_fetch_and(&x,0xffffff0fU,5);__atomic_or_fetch(&x,16U,5);
 return __atomic_nand_fetch(&x,0xfffffff0U,5);
}
extern "C" long long wide_probe(long long x){return __atomic_add_fetch(&x,123LL,5);}
extern "C" int byte_probe(int x){signed char c=(signed char)x;unsigned short s=(unsigned short)(x+60000);
 int a=__atomic_add_fetch(&c,(signed char)17,0);int b=__atomic_sub_fetch(&s,(unsigned short)19,5);return a+b;}
extern "C" int pointer_probe(int x){
 int a=x,b=x+4;int *head=&a,*expected=&a;
 int first=__atomic_compare_exchange_n(&head,&expected,&b,true,4,2);
 expected=&a;int second=__atomic_compare_exchange_n(&head,&expected,&a,false,5,0);
 int *old=__atomic_exchange_n(&head,&a,5);return first*1000+second*100+*old+*expected+*__atomic_load_n(&head,2);
}
extern "C" int load_probe(int *p,int order){return __atomic_load_n(p,order);}
'''
jsrun='''const rows=[];for(let x=-128;x<128;x++)rows.push([m.integer_probe(x),m.unsigned_probe(x>>>0),m.byte_probe(x),m.pointer_probe(x)].join(','));
for(const x of [0n,1n,-1n,9223372036854775800n,-9223372036854775807n,9007199254740993n])rows.push(String(m.wide_probe(x)));
const shared=typeof SharedArrayBuffer==='function'?new Int32Array(new SharedArrayBuffer(4)):null;
if(shared){let rejected=false;try{m.load_probe(shared,0);}catch(e){rejected=e instanceof TypeError;}if(!rejected)throw Error('shared atomic backend was not rejected');}
let invalid=false;try{m.load_probe(new Int32Array([3]),3);}catch(e){invalid=e instanceof RangeError;}if(!invalid)throw Error('invalid load order accepted');
let alignment=false;try{m.load_probe(new Uint8Array(new ArrayBuffer(8),1),0);}catch(e){alignment=e instanceof RangeError;}if(!alignment)throw Error('unaligned atomic accepted');
'''
async def browser(module,expected):
 from playwright.async_api import async_playwright
 async with async_playwright() as p:
  b=await p.chromium.launch(executable_path=os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'),headless=True)
  try:
   page=await b.new_page();await page.set_content('<title>Original source atomic parity</title>')
   actual=await page.evaluate('async encoded=>{const m=await import("data:text/javascript;base64,"+encoded);'+jsrun+'return rows;}',base64.b64encode(module.read_bytes()).decode())
   assert actual==expected
  finally:await b.close()
with tempfile.TemporaryDirectory(prefix='source-atomic-parity-',dir=ROOT/'work') as temporary:
 d=Path(temporary);(d/'unit.cpp').write_text(source)
 run([sys.executable,ROOT/'tools/source_ast_to_js.py','--root',d,'--source','unit.cpp','--out-dir',d/'out'])
 module=d/'out/unit.cpp.mjs';manifest=json.loads(module.with_suffix('.manifest.json').read_text())
 assert manifest['blocked']==0,manifest
 assert manifest['source_atomic_model']=='single-isolate-private-storage/1'
 (d/'run.mjs').write_text('import * as m from '+json.dumps(module.as_uri())+';'+jsrun+'console.log(rows.join("\\n"));')
 observed=run(['node',d/'run.mjs']).splitlines()
 (d/'oracle.cpp').write_text('''#include <cstdio>
#include <initializer_list>
extern "C" int integer_probe(int),byte_probe(int),pointer_probe(int);extern "C" unsigned int unsigned_probe(unsigned int);extern "C" long long wide_probe(long long);
int main(){for(int x=-128;x<128;x++)printf("%d,%u,%d,%d\\n",integer_probe(x),unsigned_probe((unsigned int)x),byte_probe(x),pointer_probe(x));
for(long long x: {0LL,1LL,-1LL,9223372036854775800LL,-9223372036854775807LL,9007199254740993LL})printf("%lld\\n",wide_probe(x));}
''')
 run(['clang++',d/'unit.cpp',d/'oracle.cpp','-o',d/'oracle.exe'])
 expected=run([d/'oracle.exe']).splitlines();assert observed==expected,(observed[:4],expected[:4])
 asyncio.run(browser(module,expected))
print('PASS: 1030 native/Node/Chromium values; real atomic lvalues, expected-pointer updates, integer wrapping, widths and pointer identity; shared storage/orders/alignment gated')
