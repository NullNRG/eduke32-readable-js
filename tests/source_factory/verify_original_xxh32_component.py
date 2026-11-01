"""Execute the canonical original streaming xxHash functions against native C++."""
import functools,hashlib,json,os,random,subprocess,sys,tempfile,threading
from pathlib import Path
from http.server import HTTPServer,SimpleHTTPRequestHandler
ROOT=Path(__file__).resolve().parents[2]
def run(args):
 p=subprocess.run([str(x) for x in args],cwd=ROOT,capture_output=True,text=True,timeout=120)
 assert p.returncode==0,(args,p.stderr[-2500:],p.stdout[-1000:]);return p.stdout
def main():
 profile=json.loads((ROOT/'tools/browser_classic_profile.json').read_text());module=ROOT/profile['boot_module_root']/'source/build/src/xxhash.c.mjs'
 header=ROOT/profile['prepared_source_root']/'source/build/include/xxhash.h'
 assert module.is_file(),'Recover original XXH32 create/reset/update/digest/free before verification'
 randomizer=random.Random(320031);cases=[]
 for length in [0,1,3,15,16,17,31,32,33,63,64,65,127,255,256,1000,4096]:
  for seed_index in range(16):
   cases.append({'bytes':[randomizer.randrange(256) for _ in range(length)],'seed':randomizer.getrandbits(32),'chunk':seed_index*3+1})
 declarations=[];calls=[]
 for index,case in enumerate(cases):
  declarations.append('const unsigned char data'+str(index)+'[]={'+(','.join(map(str,case['bytes'])) or '0')+'};')
  calls.append('{auto *s=XXH32_createState();if(!s||XXH32_reset(s,'+str(case['seed'])+'U))return 11;for(size_t i=0;i<'+str(len(case['bytes']))+';i+='+str(case['chunk'])+')if(XXH32_update(s,data'+str(index)+'+i,std::min<size_t>('+str(case['chunk'])+','+str(len(case['bytes']))+'-i)))return 12;printf("%u\\n",XXH32_digest(s));if(XXH32_freeState(s))return 13;}')
 cpp='#include <cstdio>\n#include <algorithm>\n#define XXH_STATIC_LINKING_ONLY\n#define XXH_IMPLEMENTATION\n#include '+json.dumps(header.as_posix())+'\n'+ '\n'.join(declarations)+'\nint main(){'+'\n'.join(calls)+'}'
 algorithm='''async ({base,cases,root})=>{
 const {NativeRuntime}=await import(new URL('runtime/index.mjs',base));
 const r=new NativeRuntime({memoryBytes:4<<20});r.bindSourceMemory();
 const release=(await import(new URL(root+'/browser-abi/libc_provider.mjs',base))).bindBrowserC(r);
 try{const m=await import(new URL(root+'/source/build/src/xxhash.c.mjs',base));const hashes=[];
 for(const c of cases){const state=m.XXH32_createState();if(!state)throw Error('Original state allocation failed');
 try{if(m.XXH32_reset(state,c.seed)!==0)throw Error('Original reset failed');const bytes=Uint8Array.from(c.bytes);
 for(let i=0;i<bytes.length;i+=c.chunk){const data=bytes.subarray(i,Math.min(bytes.length,i+c.chunk));
 if(m.XXH32_update(state,data,BigInt(data.length))!==0)throw Error('Original update failed');}
 hashes.push(String(m.XXH32_digest(state)>>>0));}finally{if(m.XXH32_freeState(state)!==0)throw Error('Original free failed');}}
 return hashes;}finally{release();r.close();}}
'''
 with tempfile.TemporaryDirectory(prefix='original-xxh32-',dir=ROOT/'work') as temporary:
  d=Path(temporary);(d/'oracle.cpp').write_text(cpp)
  run(['clang++','-std=c++14','-funsigned-char',d/'oracle.cpp','-o',d/'oracle.exe']);expected=run([d/'oracle.exe']).splitlines()
  args={'base':ROOT.as_uri()+'/','cases':cases,'root':profile['boot_module_root']}
  (d/'run.mjs').write_text('const run='+algorithm+';console.log(JSON.stringify(await run('+json.dumps(args)+')));')
  assert json.loads(run(['node',d/'run.mjs']))==expected
  class Quiet(SimpleHTTPRequestHandler):
   extensions_map={**SimpleHTTPRequestHandler.extensions_map,'.mjs':'text/javascript'}
   def log_message(self,*args):pass
   def setup(self):
    super().setup();self.connection.settimeout(2)
   def do_GET(self):
    if self.path=='/__xxh32_probe__.html':
     body=b'<!doctype html><title>Original streaming checksum verification</title>'
     self.send_response(200);self.send_header('Content-Type','text/html');self.send_header('Content-Length',str(len(body)));self.end_headers();self.wfile.write(body)
    else:super().do_GET()
  class QueuedHTTPServer(HTTPServer):request_queue_size=128
  server=QueuedHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)));thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
  from playwright.sync_api import sync_playwright
  try:
   with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'),headless=True,args=['--disable-gpu','--renderer-process-limit=1'])
    try:
     page=browser.new_page();failures=[]
     page.on('requestfailed',lambda request:failures.append({'url':request.url,'failure':request.failure}))
     page.goto(f'http://127.0.0.1:{server.server_port}/__xxh32_probe__.html')
     args['base']=f'http://127.0.0.1:{server.server_port}/'
     try:assert page.evaluate(algorithm,args)==expected
     except Exception:
      print('BROWSER_REQUEST_FAILURES '+json.dumps(failures),flush=True);raise
     version=browser.version
    finally:browser.close()
  finally:server.shutdown();server.server_close();thread.join()
 report={'format':'original-xxh32-component-parity/1','passed':True,'native_node_chromium_cases':len(cases),'browser_version':version,
         'header_sha256':hashlib.sha256(header.read_bytes()).hexdigest(),'module_sha256':hashlib.sha256(module.read_bytes()).hexdigest(),
         'original_state_allocation_reset_stream_update_digest_free_executed':True,'original_gameplay_verified':False}
 (ROOT/'reports/oct31-original-xxh32-parity.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
if __name__=='__main__':
 sys.path.insert(0,str(ROOT/'tools'))
 from recover_browser_component import component_lock
 with component_lock():main()
