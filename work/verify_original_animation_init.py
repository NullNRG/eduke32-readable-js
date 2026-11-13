"""Compare actual original Anim_Init records with native C++, Node and Chromium."""
import functools,hashlib,http.server,json,os,re,sqlite3,subprocess,sys,tempfile,threading
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'tools'))
from source_runtime_helpers import runtime_fingerprints
PROFILE=json.loads((ROOT/'tools/browser_classic_profile.json').read_text())
SOURCE=ROOT/PROFILE['prepared_source_root'];MODULES=ROOT/PROFILE['boot_module_root']
def run(args):
 result=subprocess.run(list(map(str,args)),cwd=ROOT,capture_output=True,text=True,timeout=180)
 assert result.returncode==0,(args,result.stdout[-1200:],result.stderr[-3500:])
 return result.stdout
NAMES=['logo.anm','3dr.anm','vol4e1.anm','vol4e2.anm','vol4e3.anm','vol41a.anm','vol42a.anm','vol43a.anm','duketeam.anm','radlogo.anm','cineov2.anm','cineov3.anm']
JS=r'''async({base,layout,names})=>{
 const {NativeRuntime}=await import(base+'/runtime/index.mjs');
 const {sourceSizedBytes}=await import(base+'/runtime/source_bytes.mjs');
 const runtime=new NativeRuntime({memoryBytes:16<<20});runtime.bindSourceMemory();
 const prefix=base+'/MODULES',release=(await import(prefix+'/browser-abi/libc_provider.mjs')).bindBrowserC(runtime);
 try{
  (await import(prefix+'/source/build/src/baselayer.cpp.mjs')).engineSetupAllocator();
  const anim=await import(prefix+'/source/duke3d/src/anim.cpp.mjs');
  const hash=await import(prefix+'/source/build/src/hash.cpp.mjs');
  anim.Anim_Init();
  const rows=[];
  for(const name of names){
   const pointer=hash.hash_findcase(anim.h_dukeanim,new TextEncoder().encode(name+'\0'));
   if(pointer===-1||pointer===-1n)throw Error('Original animation missing: '+name);
   const bytes=sourceSizedBytes(pointer,layout.size,runtime.heap),v=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
   const count=v.getUint16(layout.numsounds,true),sounds=Number(v.getBigUint64(layout.sounds,true));
   const row=[name,v.getUint8(layout.delay),count,v.getUint8(layout.flags),v.getUint8(layout.lock),Number(v.getFloat64(0,true)),Number(v.getFloat64(8,true)),Number(v.getBigUint64(layout.buf,true)===0n)];
   if(count){const raw=sourceSizedBytes(sounds,count*layout.cue_size,runtime.heap),c=new DataView(raw.buffer,raw.byteOffset,raw.byteLength);
    for(let i=0;i<count;i++)row.push(c.getUint16(i*layout.cue_size+layout.frame,true),c.getInt16(i*layout.cue_size+layout.sound,true));}
   rows.push(row);
  }
  (await import(prefix+'/source/build/src/compat.cpp.mjs')).engineDestroyAllocator();return rows;
 }finally{release();runtime.close();}
}'''.replace('MODULES',MODULES.relative_to(ROOT).as_posix())
def main():
 with tempfile.TemporaryDirectory(dir=ROOT/'work',prefix='original-animation-') as folder:
  folder=Path(folder);selected=[];declarations=[]
  connection=sqlite3.connect((ROOT/PROFILE['build_root']/'reports/semantic-index.sqlite').resolve().as_uri()+'?mode=ro',uri=True)
  try:
   for name in ('h_dukeanim','StopAllSounds','Anim_Create','Anim_Init'):
    records=[json.loads(row) for row, in connection.execute('select record from declarations where name=? and definition=1',(name,))]
    records=[r for r in records if r['file']=='source/duke3d/src/anim.cpp'];assert len(records)==1,(name,len(records))
    record=records[0];data=(SOURCE/record['file']).read_bytes();begin,end=record['definition_extent'];extent=data[begin:end]+(b';' if data[end:end+1]==b';' else b'')
    declarations.append(extent);selected.append({'name':name,'usr':record['usr'],'file':record['file'],'extent':[begin,end],'sha256':hashlib.sha256(extent).hexdigest()})
   # Native fixture links the exact original sound globals referenced by this
   # function, rather than unrelated dynamic-tile remapping/gameplay routines.
   for name in sorted(set(re.findall(rb'\b[A-Z][A-Z0-9_]*\b',declarations[-1]))):
    records=[json.loads(row) for row, in connection.execute('select record from declarations where name=? and definition=1',(name.decode(),))]
    records=[r for r in records if r['file']=='source/duke3d/src/dnames.cpp' and r['kind']=='VAR_DECL']
    if not records:continue
    assert len(records)==1,(name,len(records));record=records[0];data=(SOURCE/record['file']).read_bytes();begin,end=record['definition_extent'];extent=data[begin:end]+(b';' if data[end:end+1]==b';' else b'')
    declarations.append(extent);selected.append({'name':name.decode(),'usr':record['usr'],'file':record['file'],'extent':[begin,end],'sha256':hashlib.sha256(extent).hexdigest()})
  finally:connection.close()
  (folder/'original-animation.cpp').write_bytes(b'\n'.join(declarations)+b'\n')
  compat=(SOURCE/'source/build/src/compat.cpp').read_text();start=compat.index('static void (*g_MemErrHandler)');end=compat.index('\n#endif',compat.index('sm_allocator g_sm_heap;',start))+len('\n#endif')
  (folder/'allocation.cpp').write_text('#include "compat.h"\n'+compat[start:end]+'\n')
  baselayer=(SOURCE/'source/build/src/baselayer.cpp').read_text();start=baselayer.index('int initprintf(const char *f, ...)');end=baselayer.index('static int osdfunc_bucketlist',start)
  platform=(SOURCE/'source/build/src/sdlayer.cpp').read_text();begin=platform.index('#if !defined STARTUP_SETUP_WINDOW');finish=platform.index('\n#endif',begin)+len('\n#endif')
  (folder/'printing.cpp').write_text('#include "baselayer.h"\n'+baselayer[start:end]+platform[begin:finish])
  oracle=r'''#include <cstdio>
#include <cstddef>
#include "anim.h"
#include "dnames.h"
#include "original-animation.cpp"
int main(){
 printf("%zu %zu %zu %zu %zu %zu %zu %zu %zu %zu\n",sizeof(dukeanim_t),offsetof(dukeanim_t,sounds),offsetof(dukeanim_t,numsounds),offsetof(dukeanim_t,framedelay),offsetof(dukeanim_t,frameflags),offsetof(dukeanim_t,animlock),offsetof(dukeanim_t,animbuf),sizeof(animsound_t),offsetof(animsound_t,frame),offsetof(animsound_t,sound));
 engineCreateAllocator();Anim_Init();const char* names[]={NAMES};
 for(auto name:names){auto p=(dukeanim_t*)hash_findcase(&h_dukeanim,name);if(!p||p==(void*)-1)return 3;
 printf("%s %u %u %u %u %.0f %.0f %d",name,p->framedelay,p->numsounds,p->frameflags,p->animlock,p->frameaspect1,p->frameaspect2,p->animbuf==nullptr);
 for(int i=0;i<p->numsounds;i++)printf(" %u %d",p->sounds[i].frame,p->sounds[i].sound);puts("");}
 engineDestroyAllocator();}
'''.replace('NAMES',','.join(json.dumps(n) for n in NAMES))
  (folder/'oracle.cpp').write_text(oracle)
  flags=['-std=gnu++14','-funsigned-char','-O2','-flto','-include','cstdlib','-DNOASM','-DNDEBUG','-DSDL_TARGET=2','-DRENDERTYPESDL=1','-DNETCODE_DISABLE','-DEDUKE32_BROWSER=1']
  flags+=['-I'+str(SOURCE/p) for p in ('source/build/include','source/duke3d/src','source/audiolib/include','source/mact/include','source/glad/include','platform/Windows/include','platform/Windows/include/SDL2')]
  units=['source/build/src/smmalloc_generic.cpp','source/build/src/loguru.cpp','source/build/src/hash.cpp']
  exe=folder/'oracle.exe';run(['clang++',*flags,folder/'oracle.cpp',folder/'allocation.cpp',folder/'printing.cpp',*[SOURCE/p for p in units],'-ldbghelp','-o',exe])
  lines=run([exe]).splitlines();layout=dict(zip(('size','sounds','numsounds','delay','flags','lock','buf','cue_size','frame','sound'),map(int,lines[0].split())))
  expected=[[parts[0],*map(int,parts[1:])] for line in lines[1:] if (parts:=line.split())]
  assert len(expected)==12
  args={'base':ROOT.as_uri(),'layout':layout,'names':NAMES};runner=folder/'run.mjs';runner.write_text('console.log(JSON.stringify(await ('+JS+')('+json.dumps(args)+')));')
  actual=json.loads(run(['node',runner]));assert actual==expected,(actual,expected)
  class Quiet(http.server.SimpleHTTPRequestHandler):
   extensions_map={**http.server.SimpleHTTPRequestHandler.extensions_map,'.mjs':'text/javascript'}
   def log_message(self,*args):pass
  class Server(http.server.ThreadingHTTPServer):request_queue_size=128
  server=Server(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)));threading.Thread(target=server.serve_forever,daemon=True).start();errors=[]
  try:
   from playwright.sync_api import sync_playwright
   with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=os.environ['EDUKE_CHROMIUM_EXECUTABLE'],headless=True)
    try:
     page=browser.new_page();page.on('pageerror',lambda e:errors.append(str(e)));origin='http://127.0.0.1:'+str(server.server_port);page.goto(origin+'/')
     actual=page.evaluate(JS,{**args,'base':origin});assert actual==expected and not errors,(actual,errors);version=browser.version
    finally:browser.close()
  finally:server.shutdown();server.server_close()
 report={'passed':True,'original_Anim_Init_executed':True,'animation_records':expected,'sound_cues':sum(r[2] for r in expected),'native_layout':layout,'native_exact_source_definitions':selected,'native_whole_source_units':units,'page_errors':errors,'browser_version':version,'app_main_executed':False,'gameplay_verified':False,'artifacts':{p.relative_to(ROOT).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in MODULES.rglob('*.mjs')},'runtime_artifacts':runtime_fingerprints(ROOT)}
 (ROOT/'reports/nov13-original-animation-init.json').write_text(json.dumps(report,indent=2)+'\n')
 print(json.dumps({k:v for k,v in report.items() if k not in ('artifacts','runtime_artifacts')},indent=2))
if __name__=='__main__':main()
