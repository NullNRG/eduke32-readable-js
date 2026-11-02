"""Execute the current original-source startup component; never a game gate."""
import argparse,functools,hashlib,json,os,threading
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,HTTPServer
ROOT=Path(__file__).resolve().parents[1]
def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--report',type=Path,default=ROOT/'reports/oct30-original-browser-component.json');p.add_argument('--console-only',action='store_true',help='Execute original console/logging/dispatch diagnostics, not the engine acceptance gate');a=p.parse_args()
 profile=json.loads((ROOT/'tools/browser_classic_profile.json').read_text());modules=ROOT/profile['boot_module_root']
 sources=['source/build/src/pragmas.cpp','source/build/src/engine.cpp','source/build/src/sdlayer.cpp']
 if not (modules/'browser-combined-symbol-owners.json').is_file():
  raise FileNotFoundError('Build the canonical browser providers before executing the component')
 class Quiet(SimpleHTTPRequestHandler):
  extensions_map={**SimpleHTTPRequestHandler.extensions_map,'.mjs':'text/javascript'}
  def log_message(self,*args):pass
  def setup(self):
   super().setup();self.connection.settimeout(2)
  def do_GET(self):
   if self.path=='/__original_component_probe__.html':
    body=b'<!doctype html><title>Original startup component diagnostic</title><canvas id="canvas" width="640" height="480"></canvas>'
    self.send_response(200);self.send_header('Content-Type','text/html');self.send_header('Content-Length',str(len(body)));self.end_headers();self.wfile.write(body)
   else:super().do_GET()
 # Windows reserves a large stack for each HTTP thread. Parallel module
 # fetches exhausted the constrained host's commit limit before executing JS.
 # Local source files are small; one serving thread avoids that amplification.
 class QueuedHTTPServer(HTTPServer):request_queue_size=128
 server=QueuedHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)));threading.Thread(target=server.serve_forever,daemon=True).start()
 from playwright.sync_api import sync_playwright
 console=[];errors=[]
 try:
  with sync_playwright() as pw:
   browser=pw.chromium.launch(executable_path=os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'),headless=True)
   def record_console(event):
    console.append({'type':event.type,'text':event.text})
    if event.text.startswith('SOURCE_TRACE '):print(event.text,flush=True)
   page=browser.new_page();page.on('console',record_console);page.on('pageerror',lambda error:errors.append(str(error)))
   page.goto(f'http://127.0.0.1:{server.server_port}/__original_component_probe__.html')
   result=page.evaluate(r'''async ({base,consoleOnly})=>{
    const trace=[];let runtime=null,releaseC=null,releaseSDL=null;
    const enter=async(name,fn)=>{trace.push({name,transition:'enter'});console.info('SOURCE_TRACE '+JSON.stringify(trace.at(-1)));const value=await fn();const scalar=value===undefined?null:(value===null||['number','string','boolean'].includes(typeof value))?value:typeof value;trace.push({name,transition:'return',value:scalar});console.info('SOURCE_TRACE '+JSON.stringify(trace.at(-1)));return value;};
    try{
      const {NativeRuntime}=await import('/runtime/index.mjs');
      runtime=new NativeRuntime({canvas:document.querySelector('canvas'),renderer:'canvas2d',memoryBytes:16<<20});
      runtime.bindSourceMemory();
      releaseC=(await import(base+'/browser-abi/libc_provider.mjs')).bindBrowserC(runtime);
      releaseSDL=(await import(base+'/browser-abi/sdl_provider.mjs')).bindBrowserSDL(runtime);
      const engine=await enter('import original engine',()=>import(base+'/source/build/src/engine.cpp.mjs'));
      const baseLayer=await enter('import original base layer',()=>import(base+'/source/build/src/baselayer.cpp.mjs'));
      await enter('engineSetupAllocator',()=>baseLayer.engineSetupAllocator());
      if(consoleOnly){
        const osd=await enter('import original console',()=>import(base+'/source/build/src/osd.cpp.mjs'));
        const {sourceCString,sourceByteView}=await import('/runtime/source_bytes.mjs');
        const addresses=globalThis[Symbol.for('source-lp64-addresses/2')];
        const text=value=>addresses.decode(runtime.heap.writeCString(value));
        await enter('OSD_Init',()=>osd.OSD_Init());
        await enter('OSD_Puts',()=>osd.OSD_Puts(text('Original console log-node execution\n')));
        await enter('OSD_WritePendingLines',()=>osd.OSD_WritePendingLines());
        await enter('OSD_Dispatch echo',()=>osd.OSD_Dispatch(text('echo original-command-dispatch')));
        let callbacks=0;
        // Register a new diagnostic command through the original public ABI.
        // No original game implementation or existing callback is replaced.
        const inspect=parameters=>{
          if(parameters.numparms!==2)throw Error('Original command argument count differs');
          const bytes=sourceByteView(parameters.parms),view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
          const words=[0,1].map(i=>sourceCString(addresses.decode(view.getBigUint64(i*8,true)),runtime.heap));
          if(words.join(' ')!=='one two')throw Error('Original command tokenization differs: '+words);
          callbacks++;return 0;
        };
        await enter('OSD_RegisterFunction diagnostic',()=>osd.OSD_RegisterFunction(text('__sourcefactory_probe'),text('Diagnostic ABI verification'),inspect));
        await enter('OSD_Dispatch diagnostic',()=>osd.OSD_Dispatch(text('__sourcefactory_probe one two')));
        if(callbacks!==1)throw Error('Original registered command callback did not execute');
        await enter('OSD_Dispatch alias definition',()=>osd.OSD_Dispatch(text('alias __sourcefactory_alias "__sourcefactory_probe one two"')));
        await enter('OSD_Dispatch alias',()=>osd.OSD_Dispatch(text('__sourcefactory_alias')));
        if(callbacks!==2)throw Error('Original alias command did not execute');
        await enter('OSD_WritePendingLines after commands',()=>osd.OSD_WritePendingLines());
        return {component_passed:true,original_console_initialization_verified:true,original_console_command_callbacks:callbacks,
          original_console_alias_verified:true,original_engine_startup_verified:false,trace,gameplay_verified:false};
      }
      const pragmas=await enter('import original division initializer',()=>import(base+'/source/build/src/pragmas.cpp.mjs'));
      await enter('initdivtables',()=>pragmas.initdivtables());
      const divide=await import(base+'/browser-abi/libdivide_provider.mjs');let records=0;
      for(const [name,stride] of [['divtable32',5],['divtable64',9],['bfdivtable32',5],['bfdivtable64',9]]){
        const table=pragmas[name],bytes=table[Symbol.for('source-first.clang-byte-record-array/1')];
        if(!(bytes instanceof Uint8Array)||bytes.byteLength!==16384*stride)throw Error('Original divider array lacks contiguous native bytes: '+name);
        for(const index of [0,1,16383]){
          const record=table[index][Symbol.for('source-first.original-byte-record-storage/1')];
          if(!record||record.bytes.buffer!==bytes.buffer||record.bytes.byteOffset!==bytes.byteOffset+index*stride)
            throw Error('Divider record is detached from original table storage: '+name+'['+index+']');
        }
      }
      for(let i=1;i<16384;i++)for(const [table,generator,big] of [
        ['divtable32','libdivide_s32_gen',false],['divtable64','libdivide_s64_gen',true],
        ['bfdivtable32','libdivide_s32_branchfree_gen',false],['bfdivtable64','libdivide_s64_branchfree_gen',true]]){
        const want=divide[generator](big?BigInt(i):i),got=pragmas[table][i];
        if(got.magic!==want.magic||got.more!==want.more)throw Error('Original divider table differs: '+table+'['+i+']');records++;
      }
      trace.push({name:'original divider storage verified',records,contiguous_native_bytes:true});
      const platform=await enter('import original platform startup',()=>import(base+'/source/build/src/sdlayer.cpp.mjs'));
      if(typeof platform.initsystem==='function')await enter('initsystem',()=>platform.initsystem());
      else trace.push({name:'initsystem',transition:'blocked',reason:'original function has not linked'});
      if(typeof platform.videoGetModes==='function'){
        await enter('videoGetModes',()=>platform.videoGetModes(0));
        if(!(engine.validmodecnt>0))throw Error('Original video mode enumeration returned no usable modes');
        trace.push({name:'original video modes',count:engine.validmodecnt});
      }else trace.push({name:'videoGetModes',transition:'blocked',reason:'original function has not linked'});
      if(typeof engine.enginePreInit==='function')await enter('enginePreInit',()=>engine.enginePreInit());
      else trace.push({name:'enginePreInit',transition:'blocked',reason:'original function has not linked'});
      const startup=trace.some(row=>row.name==='enginePreInit'&&row.transition==='return'&&row.value===0);
      return {component_passed:true,original_engine_startup_verified:startup,trace,gameplay_verified:false};
    }catch(error){return {component_passed:false,trace,error:String(error),stack:error.stack,gameplay_verified:false};}
    finally{releaseSDL?.();releaseC?.();runtime?.close();}
   }''',{'base':'/'+modules.relative_to(ROOT).as_posix(),'consoleOnly':a.console_only})
   version=browser.version;browser.close()
 finally:server.shutdown();server.server_close()
 result.update({'format':'original-browser-console-component/1' if a.console_only else 'original-browser-engine-component/1','browser_version':version,'console':console,'page_errors':errors,
  'module_root':modules.relative_to(ROOT).as_posix(),'artifacts':{p.relative_to(ROOT).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in modules.rglob('*.mjs')},
  'runtime_artifacts':{p.relative_to(ROOT).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in [*sorted((ROOT/'runtime').rglob('*.mjs')),ROOT/'tools/source_address_runtime.mjs']},
  'menu_verified':False,'level_verified':False,'standalone_player_verified':False})
 a.report.parent.mkdir(parents=True,exist_ok=True);a.report.write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({k:v for k,v in result.items() if k!='artifacts'},indent=2))
 return 0 if (result.get('original_console_initialization_verified') if a.console_only else result.get('original_engine_startup_verified')) else 1
if __name__=='__main__':
 from recover_browser_component import component_lock
 with component_lock():raise SystemExit(main())
