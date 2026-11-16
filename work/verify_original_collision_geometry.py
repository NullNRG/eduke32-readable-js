"""Execute original collision routines on the actual E1L1 MAP in Node/Chromium.

This is a raw geometry component check, not player initialization or gameplay.
The native oracle verifies the original hitdata_t layout; collision results are
compared between JS runtimes, not falsely described as native game-state parity.
"""
import functools,hashlib,http.server,json,os,subprocess,sys,tempfile,threading
from pathlib import Path
import verify_original_game_lookups as loader
from verify_original_animation_init import SOURCE,run
ROOT=loader.ROOT;MODULES=loader.MODULES
PREFIX=loader.JS.split('  const common=')[0]
BODY=r'''
  (await import(prefix+'/source/build/src/osd.cpp.mjs')).OSD_Init();engine.enginePostInit();
  const position=new Int32Array(3),angle=new Int16Array(1),sector=new Int16Array(1);
  if(engine.engineLoadBoard(new TextEncoder().encode('E1L1.MAP\0'),0,position,angle,sector)!==0)throw Error('Original E1L1 load failed');
  const clip=await import(prefix+'/source/build/src/clip.cpp.mjs');
  const initial=Array.from(position),initialSector=sector[0],rays=[];
  if(!engine.cansee(...initial,initialSector,...initial,initialSector))throw Error('Original cansee rejects identical map position');
  for(const [vx,vy] of [[16384,0],[-16384,0],[0,16384],[0,-16384],[16384,16384],[-16384,16384],[16384,-16384],[-16384,-16384]]){
   const guarded=new Uint8Array(layout.size+16);guarded.fill(0xa5);const hit=guarded.subarray(8,8+layout.size);
   const result=clip.hitscan(position,sector[0],vx,vy,0,hit,1),v=new DataView(hit.buffer,hit.byteOffset,hit.byteLength);
   if(guarded.subarray(0,8).some(b=>b!==0xa5)||guarded.subarray(8+layout.size).some(b=>b!==0xa5))throw Error('Original hitscan wrote beyond native hitdata_t');
   const row={vx,vy,result,x:v.getInt32(layout.x,true),y:v.getInt32(layout.y,true),z:v.getInt32(layout.z,true),sprite:v.getInt16(layout.sprite,true),wall:v.getInt16(layout.wall,true),sector:v.getInt16(layout.sect,true)};
   if(row.result!==0||row.wall<0||row.wall>=engine.numwalls||row.sector<0||row.sector>=engine.numsectors||row.z!==initial[2])throw Error('Original cardinal/diagonal wall ray invalid: '+JSON.stringify(row));
   rays.push(row);
  }
  const stationary=clip.clipmove(position,sector,0,0,128,1024,1024,1);
  if(stationary!==0||position.some((n,i)=>n!==initial[i])||sector[0]!==initialSector)throw Error('Original zero-displacement clipmove changed map position');
  const moves=[];
  for(const [dx,dy] of [[128,0],[0,128],[-128,0],[0,-128]]){
   position.set(initial);sector[0]=initialSector;
   const result=clip.clipmove(position,sector,dx*16384,dy*16384,128,1024,1024,1);
   if(sector[0]<0||sector[0]>=engine.numsectors||!engine.inside(position[0],position[1],sector[0]))throw Error('Original clipmove left valid sector geometry');
   moves.push({dx,dy,result,position:Array.from(position),sector:sector[0]});
  }
  position.set(initial);sector[0]=initialSector;
  const pushed=clip.pushmove(position,sector,128,1024,1024,1,1);
  if(pushed<0||sector[0]<0||!engine.inside(position[0],position[1],sector[0]))throw Error('Original pushmove failed at map spawn');
  (await import(prefix+'/source/build/src/compat.cpp.mjs')).engineDestroyAllocator();
  return {passed:true,initial,initial_sector:initialSector,rays,moves,pushmove:{result:pushed,position:Array.from(position),sector:sector[0]},native_layout:layout,app_main_executed:false,gameplay_verified:false};
 }finally{releaseSDL();releaseC();runtime.close();}
}'''

def main():
 with tempfile.TemporaryDirectory(dir=ROOT/'work',prefix='original-collision-') as directory:
  folder=Path(directory)
  (folder/'layout.cpp').write_text('#include <cstdio>\n#include <cstddef>\n#include "build.h"\nint main(){printf("%zu %zu %zu %zu %zu %zu %zu\\n",sizeof(hitdata_t),offsetof(hitdata_t,x),offsetof(hitdata_t,y),offsetof(hitdata_t,z),offsetof(hitdata_t,sprite),offsetof(hitdata_t,wall),offsetof(hitdata_t,sect));}')
  flags=['-std=gnu++14','-funsigned-char','-O2','-include','cstdlib','-DNOASM','-DNDEBUG','-DSDL_TARGET=2','-DRENDERTYPESDL=1','-DNETCODE_DISABLE','-DEDUKE32_BROWSER=1']
  flags+=['-I'+str(SOURCE/p) for p in ('source/build/include','source/duke3d/src','source/audiolib/include','source/mact/include','source/glad/include','platform/Windows/include','platform/Windows/include/SDL2')]
  exe=folder/'layout.exe';run(['clang++',*flags,folder/'layout.cpp','-o',exe]);values=list(map(int,run([exe]).split()));layout=dict(zip(('size','x','y','z','sprite','wall','sect'),values));assert len(layout)==7
  js=(PREFIX+BODY).replace('async(base)=>','async({base,layout})=>')
  runner=folder/'run.mjs';runner.write_text('console.log(JSON.stringify(await ('+js+')('+json.dumps({'base':ROOT.as_uri(),'layout':layout})+')));')
  task=subprocess.run(['node',str(runner)],cwd=ROOT,capture_output=True,text=True,timeout=180)
  (ROOT/'reports/nov16-original-collision-node.log').write_text(task.stdout+'\nSTDERR\n'+task.stderr)
  assert task.returncode==0,(task.stdout[-1000:],task.stderr[-2500:]);node=json.loads(task.stdout.strip().splitlines()[-1])
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
     page=browser.new_page();page.on('pageerror',lambda e:errors.append(str(e)));origin='http://127.0.0.1:'+str(server.server_port);page.goto(origin+'/');actual=page.evaluate(js,{'base':origin,'layout':layout});assert actual==node and not errors,(actual,node,errors);version=browser.version
    finally:browser.close()
  finally:server.shutdown();server.server_close()
 report={**node,'oracle':'Native original hitdata_t layout; actual MAP geometry sanity and Node/Chromium equality. Not native collision/gameplay parity.','browser_version':version,'page_errors':errors,'artifacts':{p.relative_to(ROOT).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in MODULES.rglob('*.mjs')},'runtime_artifacts':loader.runtime_fingerprints(ROOT)}
 (ROOT/'reports/nov16-original-collision-geometry.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({k:v for k,v in report.items() if k not in ('artifacts','runtime_artifacts')},indent=2))
if __name__=='__main__':main()
