"""Run original no-extra-arguments game initialization against native C++."""
import functools,hashlib,http.server,json,os,re,sqlite3,subprocess,tempfile,threading
from pathlib import Path
from verify_original_animation_init import ROOT,SOURCE,MODULES,PROFILE,run,runtime_fingerprints
FIELDS=['m_respawn_items','m_respawn_monsters','m_respawn_inventory','warp_on','m_ffire','m_player_skill','player_skill']
JS=r'''async({base,player_storage,fields})=>{
 const {NativeRuntime}=await import(base+'/runtime/index.mjs');
 const runtime=new NativeRuntime({memoryBytes:32<<20});runtime.bindSourceMemory();
 const prefix=base+'/MODULES',release=(await import(prefix+'/browser-abi/libc_provider.mjs')).bindBrowserC(runtime);
 try{
  (await import(prefix+'/source/build/src/baselayer.cpp.mjs')).engineSetupAllocator();
  const cmd=await import(prefix+'/source/duke3d/src/cmdline.cpp.mjs');
  cmd.G_CheckCommandLine(1,null);
  const state=await import(prefix+'/source/duke3d/src/global.cpp.mjs');
  const rows=[fields.map(name=>Number(state.ud[name])),[...state[player_storage][1].wchoice]];
  (await import(prefix+'/source/build/src/compat.cpp.mjs')).engineDestroyAllocator();return rows;
 }finally{release();runtime.close();}
}'''.replace('MODULES',MODULES.relative_to(ROOT).as_posix())
def main():
 with tempfile.TemporaryDirectory(dir=ROOT/'work',prefix='original-command-line-') as folder:
  folder=Path(folder);selected=[];declarations=[]
  connection=sqlite3.connect((ROOT/PROFILE['build_root']/'reports/semantic-index.sqlite').resolve().as_uri()+'?mode=ro',uri=True)
  try:
   for name,file in [('g_player_s','source/duke3d/src/global.h'),('g_player','source/duke3d/src/global.h'),('g_clipMapFiles','source/build/src/common.cpp')]:
    records=[json.loads(r) for r, in connection.execute('select record from declarations where name=? and definition=1',(name,))];records=[r for r in records if r['file']==file];assert len(records)==1,(name,len(records))
    record=records[0];data=(SOURCE/file).read_bytes();begin,end=record['definition_extent'];extent=data[begin:end]+(b';' if data[end:end+1]==b';' else b'')
    declarations.append(extent);selected.append({'name':name,'usr':record['usr'],'file':file,'extent':[begin,end],'sha256':hashlib.sha256(extent).hexdigest()})
  finally:connection.close()
  global_file='source/duke3d/src/global.cpp';data=(SOURCE/global_file).read_bytes();matches=list(re.finditer(rb'(?m)^user_defs ud;',data));assert len(matches)==1
  match=matches[0];declarations.append(match[0]);selected.append({'name':'ud','file':global_file,'extent':[match.start(),match.end()],'sha256':hashlib.sha256(match[0]).hexdigest(),'selection':'unique exact original file-scope declaration; current source compiler manifest proves its record storage'})
  (folder/'original-storage.cpp').write_bytes(b'\n'.join(declarations)+b'\n')
  source_file='source/duke3d/src/cmdline.cpp';original=(SOURCE/source_file).read_text();marker='void G_CheckCommandLine(int32_t argc, char const * const * argv)';assert original.count(marker)==1
  # Specialize the fixture input rather than link unrelated argument branches.
  # The complete original function BODY remains byte-for-byte unchanged.
  # All shipped JS still contains the unspecialized original function.
  body=original[original.index('{',original.index(marker)):]
  assert re.search(r'\bargc\b',body)
  helper_begin=original.index('static void G_AddDemo(');helper_end=original.index(marker)
  includes='\n'.join(re.findall(r'^#include .+$',original,re.M))
  (folder/'original-command-line.cpp').write_text(includes+'\n'+original[helper_begin:helper_end]
      +'\ntemplate<int32_t argc> static void source_G_CheckCommandLine(char const *const *argv)\n'+body)
  compat=(SOURCE/'source/build/src/compat.cpp').read_text();start=compat.index('static void (*g_MemErrHandler)');end=compat.index('\n#endif',compat.index('sm_allocator g_sm_heap;',start))+len('\n#endif')
  (folder/'allocation.cpp').write_text('#include "compat.h"\n'+compat[start:end]+'\n')
  baselayer=(SOURCE/'source/build/src/baselayer.cpp').read_text();start=baselayer.index('int initprintf(const char *f, ...)');end=baselayer.index('static int osdfunc_bucketlist',start)
  platform=(SOURCE/'source/build/src/sdlayer.cpp').read_text();begin=platform.index('#if !defined STARTUP_SETUP_WINDOW');finish=platform.index('\n#endif',begin)+len('\n#endif')
  (folder/'printing.cpp').write_text('#include "baselayer.h"\n'+baselayer[start:end]+platform[begin:finish])
  oracle='''#include <cstdio>
#include "duke3d.h"
#include "original-storage.cpp"
#include "original-command-line.cpp"
int main(){engineCreateAllocator();char const*argv[]={"eduke32",nullptr};source_G_CheckCommandLine<1>(argv);
printf("FORMAT\\n",FIELDS);
for(auto value:g_player[0].wchoice)printf("%d ",value);puts("");engineDestroyAllocator();}
'''.replace('FORMAT',' '.join('%d' for _ in FIELDS)).replace('FIELDS',','.join('ud.'+f for f in FIELDS))
  (folder/'oracle.cpp').write_text(oracle)
  flags=['-std=gnu++14','-funsigned-char','-O2','-flto','-ffunction-sections','-fdata-sections','-include','cstdlib','-DNOASM','-DNDEBUG','-DSDL_TARGET=2','-DRENDERTYPESDL=1','-DNETCODE_DISABLE','-DEDUKE32_BROWSER=1','-DHAVE_CLIPSHAPE_FEATURE']
  flags+=['-I'+str(SOURCE/p) for p in ('source/build/include','source/duke3d/src','source/audiolib/include','source/mact/include','source/glad/include','platform/Windows/include','platform/Windows/include/SDL2')]
  units=['source/build/src/smmalloc_generic.cpp','source/build/src/loguru.cpp'];exe=folder/'oracle.exe'
  run(['clang++',*flags,folder/'oracle.cpp',folder/'allocation.cpp',folder/'printing.cpp',*[SOURCE/p for p in units],'-Wl,--gc-sections','-ldbghelp','-o',exe])
  expected=[list(map(int,line.split())) for line in run([exe]).splitlines()];assert len(expected)==2,expected
  d=json.loads((MODULES/'source/duke3d/src/global.cpp.manifest.json').read_text());storage=next(r['name'] for r in d['definitions'] if r.get('source_name')=='g_player_s')
  args={'base':ROOT.as_uri(),'player_storage':storage,'fields':FIELDS};runner=folder/'run.mjs';runner.write_text('console.log(JSON.stringify(await ('+JS+')('+json.dumps(args)+')));')
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
 report={'passed':True,'original_G_CheckCommandLine_executed':True,'arguments':{'argc':1,'extra_arguments':[]},'field_names':FIELDS,'native_node_chromium_rows':expected,'native_source_file':source_file,'native_source_sha256':hashlib.sha256((SOURCE/source_file).read_bytes()).hexdigest(),'native_original_body_sha256':hashlib.sha256(body.encode()).hexdigest(),'native_fixture_scope':'argc=1 input specialized as a template constant; original function body unchanged; no substitute game functions linked. JS executes the complete unspecialized function. Other argument branches are not native-parity verified here.','native_exact_storage_definitions':selected,'browser_version':version,'page_errors':errors,'app_main_executed':False,'menu_rendered':False,'gameplay_verified':False,'artifacts':{p.relative_to(ROOT).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in MODULES.rglob('*.mjs')},'runtime_artifacts':runtime_fingerprints(ROOT)}
 (ROOT/'reports/nov13-original-command-line-init.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({k:v for k,v in report.items() if k not in ('artifacts','runtime_artifacts')},indent=2))
if __name__=='__main__':main()
