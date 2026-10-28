"""Execute installed original hash lookups against a native source oracle.

This creates lookup fixtures directly; original hash allocation/initialization
and the game console are not claimed to be working.
"""
import functools,hashlib,http.server,json,os,subprocess,tempfile,threading
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'factory-output/source-tree/eduke32-master/source/build/src/hash.cpp'
TARGET='factory-output/source-first/oct20-engine-preinit-browser'
original=SOURCE.read_text()
def extract(signature):
    start=original.index(signature);brace=original.index('{',start);depth=1;end=brace+1
    while depth:
        depth+=(original[end]=='{')-(original[end]=='}');end+=1
    return original[start:end]
bodies='\n'.join(extract('intptr_t '+name+'(') for name in ('hash_find','hash_findcase'))
integer_body=extract('intptr_t inthash_find(')
with tempfile.TemporaryDirectory(prefix='original-hash-oracle-') as directory:
    folder=Path(directory)
    code='''#include <cstdio>
#include <cstdint>
#include <cstring>
#include <cctype>
#define FORCE_INLINE inline
#define Btolower tolower
#define Bstrcmp strcmp
#define Bstrcasecmp '''+('_stricmp' if os.name=='nt' else 'strcasecmp')+'''
#include "hash.h"
'''+bodies+'''
int main(){hashtable_t table={};hashitem_t *buckets[11]={};hashitem_t entries[48]={};char names[48][32];
 table.prime.v=11;table.prime.d=libdivide::libdivide_u32_gen(11);table.items=buckets;
 printf("table %u %u %u\\n",table.prime.v,table.prime.d.magic,table.prime.d.more);
 for(int i=0;i<48;i++){
  snprintf(names[i],sizeof(names[i]),"Word%03d",i);auto bucket=hash_getbucket(&table,names[i]);
  entries[i].string=names[i];entries[i].key=9007199254740993LL+i;
  entries[i].next=buckets[bucket];buckets[bucket]=&entries[i];
  printf("item %u %lld %s\\n",bucket,(long long)entries[i].key,names[i]);
 }
 for(int i=0;i<256;i++){
  char query[32];snprintf(query,sizeof(query),i%3==0?"WORD%03d":"Word%03d",i%61);
  printf("query %s %lld %lld\\n",query,(long long)hash_find(&table,query),(long long)hash_findcase(&table,query));
 }}
'''
    (folder/'oracle.cpp').write_text(code)
    exe=folder/('oracle.exe' if os.name=='nt' else 'oracle')
    command=['clang++','-std=c++14','-O2','-funsigned-char','-I',str(SOURCE.parent.parent/'include'),str(folder/'oracle.cpp'),'-o',str(exe)]
    result=subprocess.run(command,capture_output=True,text=True,timeout=60)
    assert result.returncode==0,result.stderr
    result=subprocess.run([str(exe)],capture_output=True,text=True,timeout=30,check=True)
    rows=[line.split() for line in result.stdout.splitlines()]
    integer_code=code[:code.index(bodies)]+integer_body+'''
int main(){inthashtable_t table={};inthashitem_t slots[59]={};
 table.prime.v=11;table.prime.d=libdivide::libdivide_u32_gen(11);table.items=slots;
 printf("table %u %u %u\\n",table.prime.v,table.prime.d.magic,table.prime.d.more);
 for(int i=0;i<48;i++){
   intptr_t key=(i%2 ? -1 : 1)*(9007199254740993LL+i*101);
   auto bucket=inthash_getbucket(&table,key);auto item=slots+bucket;
   if(item->collision){while(item->collision!=item)item=item->collision;item->collision=slots+11+i;item=item->collision;}
   item->key=key;item->value=key+777;item->collision=item;
 }
 for(int i=0;i<59;i++)printf("item %lld %lld %lld\\n",(long long)slots[i].key,(long long)slots[i].value,
   slots[i].collision ? (long long)(slots[i].collision-slots) : -1LL);
 for(int i=0;i<256;i++){
   int n=i%61;intptr_t key=(n%2 ? -1 : 1)*(9007199254740993LL+n*101);
   printf("query %lld %lld\\n",(long long)key,(long long)inthash_find(&table,key));
 }
}
'''
    (folder/'oracle.cpp').write_text(integer_code)
    result=subprocess.run(command,capture_output=True,text=True,timeout=60)
    assert result.returncode==0,result.stderr
    integer_rows=[line.split() for line in subprocess.run([str(exe)],capture_output=True,text=True,timeout=30,check=True).stdout.splitlines()]
fixture={'prime':[int(v) for v in rows[0][1:]],
    'items':[{'bucket':int(row[1]),'key':row[2],'word':row[3]} for row in rows if row[0]=='item'],
    'queries':[row[1:] for row in rows if row[0]=='query']}
fixture['integer']={'prime':[int(v) for v in integer_rows[0][1:]],
    'items':[row[1:] for row in integer_rows if row[0]=='item'],
    'queries':[row[1:] for row in integer_rows if row[0]=='query']}
class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map={**http.server.SimpleHTTPRequestHandler.extensions_map,'.mjs':'text/javascript'}
    def log_message(self,*args):pass
class Server(http.server.ThreadingHTTPServer):request_queue_size=128
server=Server(('127.0.0.1',0),functools.partial(Handler,directory=str(ROOT)))
thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
report={'original_gameplay_verified':False,'original_hash_allocation_verified':False,
    'fixture_storage':'Generated anonymous-field slots; lookup parity only, no native allocation/layout attestation',
    'page_errors':[]}
try:
    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path=os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'),headless=True)
        page=browser.new_page();page.on('pageerror',lambda error:report['page_errors'].append(str(error)))
        page.goto(f'http://127.0.0.1:{server.server_port}/')
        report['result']=page.evaluate('''async ({target,fixture})=>{try{
          const [{NativeRuntime},c,hash]=await Promise.all([import('/runtime/index.mjs'),
            import('/'+target+'/browser-abi/libc_provider.mjs'),import('/'+target+'/source/build/src/hash.cpp.mjs')]);
          const runtime=new NativeRuntime(),unbind=c.bindBrowserC(runtime);
          try{
            const text=s=>new TextEncoder().encode(s+'\\0');
            const [v,magic,more]=fixture.prime,table={__cxx_anonymous_0:{prime:{v,d:{magic,more}}},items:Array(v).fill(null)};
            for(const item of fixture.items)table.items[item.bucket]={string:text(item.word),key:BigInt(item.key),next:table.items[item.bucket]};
            for(const [word,exact,folded] of fixture.queries){
              const input=text(word),a=String(hash.hash_find(table,input)),b=String(hash.hash_findcase(table,input));
              if(a!==exact||b!==folded)throw Error('Original lookup mismatch: '+JSON.stringify({word,a,b,exact,folded}));
            }
            const records=fixture.integer.items.map(([key,value])=>({key:BigInt(key),value:BigInt(value),collision:null}));
            const pointer=index=>({__cPointer:true,buffer:records,lower:0,upper:records.length*24,offset:index*24,array:true,stride:24});
            fixture.integer.items.forEach((item,index)=>{records[index].collision=Number(item[2])<0?null:pointer(Number(item[2]));});
            const [iv,imagic,imore]=fixture.integer.prime;
            const itable={items:records,__cxx_anonymous_1:{prime:{v:iv,d:{magic:imagic,more:imore}}}};
            for(const [key,expected] of fixture.integer.queries){
              const actual=String(hash.inthash_find(itable,BigInt(key)));
              if(actual!==expected)throw Error('Original integer lookup mismatch: '+JSON.stringify({key,actual,expected}));
            }
            return {lookup_calls:fixture.queries.length*2,integer_lookup_calls:fixture.integer.queries.length,
              collision_chains:true,large_integer_keys:true,negative_integer_keys:true,scalar_byte_hash:true};
          }finally{unbind();runtime.close();}
        }catch(error){return {error:{name:error.name,message:error.message,stack:error.stack}};}}
        ''',{'target':TARGET,'fixture':fixture})
        report['browser_version']=browser.version;browser.close()
    report['passed']=not report['page_errors'] and report['result'].get('lookup_calls')==512 and report['result'].get('integer_lookup_calls')==256
    report['original_source_sha256']=hashlib.sha256(SOURCE.read_bytes()).hexdigest()
    report['native_original_bodies_sha256']=hashlib.sha256(bodies.encode()).hexdigest()
    report['native_original_integer_body_sha256']=hashlib.sha256(integer_body.encode()).hexdigest()
    report['original_module_sha256']=hashlib.sha256((ROOT/TARGET/'source/build/src/hash.cpp.mjs').read_bytes()).hexdigest()
    (ROOT/'reports/oct26-original-hash-browser.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2));assert report['passed']
finally:server.shutdown();server.server_close();thread.join()
