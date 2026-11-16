"""Verify original game lookup/palette loading against supplied GRP bytes."""
import functools,hashlib,http.server,json,os,subprocess,sys,threading
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'tools'))
from source_runtime_helpers import runtime_fingerprints
PROFILE=json.loads((ROOT/'tools/browser_classic_profile.json').read_text());MODULES=ROOT/PROFILE['boot_module_root']
JS=r'''async(base)=>{
 const {NativeRuntime}=await import(base+'/runtime/index.mjs');
 const {sourceSizedBytes}=await import(base+'/runtime/source_bytes.mjs');
 const runtime=new NativeRuntime({canvas:typeof document==='undefined'?undefined:document.querySelector('canvas'),renderer:'canvas2d',memoryBytes:128<<20});runtime.bindSourceMemory();
 const prefix=base+'/MODULES',releaseC=(await import(prefix+'/browser-abi/libc_provider.mjs')).bindBrowserC(runtime),releaseSDL=(await import(prefix+'/browser-abi/sdl_provider.mjs')).bindBrowserSDL(runtime);
 try{
  (await import(prefix+'/source/build/src/baselayer.cpp.mjs')).engineSetupAllocator();
  const engine=await import(prefix+'/source/build/src/engine.cpp.mjs');if(engine.enginePreInit()!==0)throw Error('Original enginePreInit failed');
  const archive=base.startsWith('file:')?new Uint8Array(await (await import('node:fs/promises')).readFile(new URL(base+'/input-data/DUKE3D.GRP'))):new Uint8Array(await (await fetch(base+'/input-data/DUKE3D.GRP')).arrayBuffer());
  const header=new DataView(archive.buffer,archive.byteOffset,archive.byteLength),count=header.getUint32(12,true);let offset=16+count*16,lookup=null;
  for(let i=0;i<count;i++){const at=16+i*16,name=new TextDecoder().decode(archive.subarray(at,at+12)).replace(/\0.*$/,'').toUpperCase(),size=header.getUint32(at+12,true);if(name==='LOOKUP.DAT')lookup=archive.subarray(offset,offset+size);offset+=size;}
  if(!lookup||offset!==archive.length)throw Error('Original LOOKUP.DAT archive span unavailable');
  runtime.fs.mountBytes('DUKE3D.GRP',archive);
  const vfs=await import(prefix+'/source/build/src/vfs.cpp.mjs');if(vfs.initgroupfile(new TextEncoder().encode('DUKE3D.GRP\0'))!==0)throw Error('Original GRP indexing failed');
  if(engine.engineInit()!==0)throw Error('Original engineInit failed');
  const common=await import(prefix+'/source/duke3d/src/common.cpp.mjs'),palette=await import(prefix+'/source/build/src/palette.cpp.mjs');
  common.G_LoadLookups();
  const start=1+lookup[0]*257,rows=[];let compared=0;
  if(start+5*768!==lookup.length)throw Error('Unexpected native lookup resource layout');
  const shades=Number(engine.numshades),baseShadeBytes=sourceSizedBytes(engine.palookup[0],shades*256,runtime.heap);let remapCompared=0;
  for(let entry=0;entry<lookup[0];entry++){
   const at=1+entry*257,index=lookup[at],remap=lookup.subarray(at+1,at+257),actual=sourceSizedBytes(engine.palookup[index],shades*256,runtime.heap);
   for(let shade=0;shade<shades;shade++)for(let color=0;color<256;color++){
    if(actual[shade*256+color]!==baseShadeBytes[shade*256+remap[color]])throw Error('Original shade remap differs at '+index+':'+shade+':'+color);
    remapCompared++;
   }
  }
  for(let j=1;j<=5;j++){
   const basepal=(j===3||j===4)?7-j:j,expected=lookup.subarray(start+(j-1)*768,start+j*768),actual=sourceSizedBytes(palette.basepaltable[basepal],768,runtime.heap);
   for(let i=0;i<768;i++){if(actual[i]!==((expected[i]<<2)&255))throw Error('Original palette differs at '+basepal+':'+i);compared++;}
   rows.push({base_palette:basepal,resource_offset:start+(j-1)*768,bytes:768});
  }
  (await import(prefix+'/source/build/src/compat.cpp.mjs')).engineDestroyAllocator();return {passed:true,original_G_LoadLookups_executed:true,lookup_bytes:lookup.length,original_lookup_remaps:lookup[0],compared_base_palette_bytes:compared,compared_shade_remap_bytes:remapCompared,rows,app_main_executed:false,gameplay_verified:false};
 }finally{releaseSDL();releaseC();runtime.close();}
}'''.replace('MODULES',MODULES.relative_to(ROOT).as_posix())
def main():
 import tempfile
 with tempfile.TemporaryDirectory(dir=ROOT/'work',prefix='original-lookup-') as directory:
  runner=Path(directory)/'run.mjs';runner.write_text('console.log(JSON.stringify(await ('+JS+')('+json.dumps(ROOT.as_uri())+')));')
  task=subprocess.run(['node',str(runner)],cwd=ROOT,capture_output=True,text=True,timeout=180);assert task.returncode==0,(task.stdout[-1000:],task.stderr[-2500:]);(ROOT/'reports/nov13-original-game-lookups-node.log').write_text(task.stdout+'\nSTDERR\n'+task.stderr);node=json.loads(task.stdout.strip().splitlines()[-1])
  class Quiet(http.server.SimpleHTTPRequestHandler):
   extensions_map={**http.server.SimpleHTTPRequestHandler.extensions_map,'.mjs':'text/javascript'}
   def log_message(self,*args):pass
   def do_GET(self):
    if self.path=='/':
     data=b'<canvas width="640" height="480"></canvas>';self.send_response(200);self.send_header('Content-Type','text/html');self.send_header('Content-Length',str(len(data)));self.end_headers();self.wfile.write(data)
    else:super().do_GET()
  class Server(http.server.ThreadingHTTPServer):request_queue_size=128
  server=Server(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)));threading.Thread(target=server.serve_forever,daemon=True).start();errors=[]
  try:
   from playwright.sync_api import sync_playwright
   with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=os.environ['EDUKE_CHROMIUM_EXECUTABLE'],headless=True)
    try:
     page=browser.new_page();page.on('pageerror',lambda e:errors.append(str(e)));origin='http://127.0.0.1:'+str(server.server_port);page.goto(origin+'/');actual=page.evaluate(JS,origin);assert actual==node and not errors,(actual,node,errors);version=browser.version
    finally:browser.close()
  finally:server.shutdown();server.server_close()
 report={**node,'oracle':'Original LOOKUP.DAT bytes and native on-disk palette ordering/scaling; not a full native game comparison','browser_version':version,'page_errors':errors,'artifacts':{p.relative_to(ROOT).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in MODULES.rglob('*.mjs')},'runtime_artifacts':runtime_fingerprints(ROOT)}
 (ROOT/'reports/nov13-original-game-lookups.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({k:v for k,v in report.items() if k not in ('artifacts','runtime_artifacts')},indent=2))
if __name__=='__main__':main()
