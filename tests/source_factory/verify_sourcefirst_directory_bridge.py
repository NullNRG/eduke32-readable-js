"""POSIX directory handles/entries retain their real host-heap pointer ABI."""
import functools,http.server,json,os,subprocess,sys,tempfile,threading
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tools'))
from browser_target_closure import runtime_module
JS=r'''async({base,provider})=>{
 const {NativeRuntime}=await import(base+'/runtime/index.mjs');
 const {sourceByteView,sourceHeapAddress}=await import(base+'/runtime/source_bytes.mjs');
 const runtime=new NativeRuntime({memoryBytes:2<<20});runtime.bindSourceMemory();
 const c=await import(provider),release=c.bindBrowserC(runtime);
 try{
  runtime.fs.mountBytes('data/one.bin',new Uint8Array(3));
  runtime.fs.mountBytes('data/sub/two.bin',new Uint8Array(5));
  const encode=s=>Uint8Array.from([...new TextEncoder().encode(s),0]);
  const baseline=runtime.heap.allocations.size,handle=c.opendir(encode('data'));
  if(!(handle instanceof Uint8Array)||handle.buffer!==runtime.heap.buffer)throw Error('Directory handle is detached');
  const ptr=sourceHeapAddress(handle,runtime.heap);
  const addresses=globalThis[Symbol.for('source-lp64-addresses/2')];
  const field=new DataView(new ArrayBuffer(8));field.setBigUint64(0,addresses.encode(handle),true);
  const original=addresses.decode(field.getBigUint64(0,true));
  runtime.heap.ensure(8<<20);
  const names=[];let returned=0;
  while(true){
   const result=c.readdir(original);if(result===null)break;
   const bytes=sourceByteView(result);if(bytes.buffer!==runtime.heap.buffer||bytes.byteLength<280)throw Error('Directory entry is detached');
   if(sourceHeapAddress(result,runtime.heap)!==ptr)throw Error('Original readdir storage identity changed');
   const end=bytes.indexOf(0,19);if(end<19)throw Error('Directory entry name is not terminated');
   names.push([new TextDecoder().decode(bytes.slice(19,end)),bytes[18]]);returned++;
  }
  if(c.readdir(original)!==null||c.closedir(original)!==0||runtime.heap.allocations.has(ptr))throw Error('Directory EOF/close lifetime differs');
  if(c.opendir(encode('missing'))!==null)throw Error('Missing directory succeeded');
  let rejected=false;try{c.readdir(new Uint8Array(280));}catch(e){if(!(e instanceof TypeError))throw e;rejected=true;}
  if(!rejected||runtime.heap.allocations.size!==baseline)throw Error('Foreign pointer admitted or directory allocation leaked');
  return {names:names.sort((a,b)=>a[0].localeCompare(b[0])),returned,foreign_pointer_rejected:rejected};
 }finally{release();runtime.close();}
}'''
with tempfile.TemporaryDirectory(dir=ROOT/'work',prefix='directory-bridge-') as folder:
    root=Path(folder)
    rel=lambda p:os.path.relpath(p,root).replace('\\','/')
    provider=root/'provider.mjs'
    provider.write_bytes(runtime_module(['opendir','readdir','closedir'],rel(ROOT/'runtime/source_bytes.mjs')).encode())
    original=ROOT/'factory-output/source-first/browser-classic/browser-modules/browser-abi/loguru_provider.mjs'
    (root/'loguru_provider.mjs').write_text('export {bindLoguruHeap} from '+json.dumps(rel(original))+';')
    runner=root/'run.mjs';args={'base':ROOT.as_uri(),'provider':provider.as_uri()}
    runner.write_text('console.log(JSON.stringify(await ('+JS+')('+json.dumps(args)+')));')
    task=subprocess.run(['node',str(runner)],cwd=ROOT,capture_output=True,text=True,timeout=60)
    assert task.returncode==0,(task.stdout,task.stderr)
    expected={'names':[['.',4],['..',4],['one.bin',8],['sub',4]],'returned':4,'foreign_pointer_rejected':True}
    assert json.loads(task.stdout)==expected,task.stdout
    if os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'):
        class Quiet(http.server.SimpleHTTPRequestHandler):
            extensions_map={**http.server.SimpleHTTPRequestHandler.extensions_map,'.mjs':'text/javascript'}
            def log_message(self,*args):pass
        server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)))
        threading.Thread(target=server.serve_forever,daemon=True).start()
        try:
            from playwright.sync_api import sync_playwright
            with sync_playwright() as pw:
                browser=pw.chromium.launch(executable_path=os.environ['EDUKE_CHROMIUM_EXECUTABLE'],headless=True)
                try:
                    page=browser.new_page();origin='http://127.0.0.1:'+str(server.server_port);page.goto(origin+'/')
                    args={'base':origin,'provider':origin+'/'+provider.relative_to(ROOT).as_posix()}
                    assert page.evaluate(JS,args)==expected
                finally:browser.close()
        finally:server.shutdown();server.server_close()
print('PASS Node/Chromium: directory handles and dirent records alias original heap through LP64 pointer fields and growth; EOF, close, missing/foreign handles and allocation lifetime verified')
