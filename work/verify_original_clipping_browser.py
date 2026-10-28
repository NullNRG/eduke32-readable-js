"""Verify original clip-map reset against its actual source-owned storage.

This subsystem test explicitly binds the existing Free-only browser allocator
adapter. It does not attest the original sm::Allocator or full engine startup.
"""
import functools,hashlib,http.server,json,os,threading
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
TARGET='factory-output/source-first/oct20-engine-preinit-browser'
SOURCE='source/build/src/clip.cpp'
manifest=json.loads((ROOT/TARGET/(SOURCE+'.manifest.json')).read_text())
private={r['name']:r['private_storage']['binding'] for r in manifest['definitions'] if r.get('private_storage')}
class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map={**http.server.SimpleHTTPRequestHandler.extensions_map,'.mjs':'text/javascript'}
    def log_message(self,*args):pass
    def do_GET(self):
        if self.path=='/':
            body=b'<!doctype html><title>Original clipping initializer verification</title><link rel="icon" href="data:,">'
            self.send_response(200);self.send_header('Content-Type','text/html');self.send_header('Content-Length',str(len(body)));self.end_headers();self.wfile.write(body)
        else:super().do_GET()
class Server(http.server.ThreadingHTTPServer):
    request_queue_size=128
server=Server(('127.0.0.1',0),functools.partial(Handler,directory=str(ROOT)))
thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
report={'gameplay_verified':False,'original_allocator_verified':False,
    'allocator_boundary':'Existing Free-only browser adapter using actual runtime heap free; original allocator initialization remains blocked.',
    'page_errors':[],'console':[]}
try:
    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path=os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'),headless=True)
        page=browser.new_page();page.on('pageerror',lambda error:report['page_errors'].append(str(error)))
        page.on('console',lambda message:report['console'].append({'type':message.type,'text':message.text}))
        page.goto(f'http://127.0.0.1:{server.server_port}/')
        report['result']=page.evaluate('''async ({target,privateBindings})=>{try{
          const [{NativeRuntime,bindSourceFreeAllocator},lib,original,compat,engine]=await Promise.all([
            import('/runtime/index.mjs'),import('/'+target+'/browser-abi/libc_provider.mjs'),
            import('/'+target+'/source/build/src/clip.cpp.mjs'),
            import('/'+target+'/source/build/src/compat.cpp.mjs'),
            import('/'+target+'/source/build/src/engine.cpp.mjs')]);
          const runtime=new NativeRuntime(),unbind=lib.bindBrowserC(runtime);
          const released=[],releaseAllocator=bindSourceFreeAllocator(compat.__cxx_global_cell_11016d3c7177543e564ab46c,
            pointer=>{released.push(pointer);return lib.free(pointer);});
          try{
            const cell=name=>original[privateBindings[name]]();
            const pointers=['sectq','sectoidx','tempictoidx','loadsector','loadwall','loadwallinv','loadsprite'];
            const table=cell('pictoidx').value,record=cell('clipmapinfo').value;
            const recordStorage=record[Symbol.for('source-first.original-byte-record-storage/1')];
            let rounds=0,tableValuesChecked=0;
            for(let round=0;round<16;round++){
              const allocations=pointers.map((name,i)=>{const ptr=lib.malloc((round+1)*16+i);cell(name).value=ptr;return ptr;});
              cell('numclipmaps').value=round+9;cell('numclipsects').value=round+21;
              table.fill(round+17);record.numsectors=13;record.numwalls=19;
              record.sector=runtime.heap.borrow(allocations[3],1);
              record.wall=runtime.heap.borrow(allocations[4],1);
              engine.__cxx_global_cell_0d84c36af55f8d659082f1bb().value=123;
              engine.__cxx_global_cell_9fbed4c78bef6ce8bf955682().value=456;
              const before=released.length;original.engineInitClipMaps();
              if(released.length!==before+7||allocations.some((ptr,i)=>released[before+i]!==ptr))throw Error('original free order/identity mismatch');
              if(allocations.some(ptr=>runtime.heap.allocations.has(ptr)))throw Error('original free did not release storage');
              if(pointers.some(name=>cell(name).value!==null))throw Error('original pointer not cleared');
              if(cell('numclipmaps').value||cell('numclipsects').value||engine.numsectors||engine.numwalls)throw Error('original count not reset');
              if(table.length!==30720||table.some(value=>value!==-1))throw Error('original tile map bytes incorrect');
              if(record.numsectors||record.numwalls||record.sector!==null||record.wall!==null)throw Error('original clip record not cleared');
              if(cell('pictoidx').value!==table||cell('clipmapinfo').value!==record)throw Error('original aggregate identity replaced');
              tableValuesChecked+=table.length;rounds++;
            }
            const before=released.length;original.engineInitClipMaps();
            if(released.slice(before).length!==7||released.slice(before).some(pointer=>pointer!==null))throw Error('null free path mismatch');
            return {rounds,tableValuesChecked,releasedAllocations:16*7,nullFreeCalls:7,
              preservedTableIdentity:cell('pictoidx').value===table,preservedRecordIdentity:cell('clipmapinfo').value===record,
              byteBackedRecord:Boolean(recordStorage)};
          }finally{releaseAllocator();unbind();runtime.close();}
        }catch(error){return {error:{name:error.name,message:error.message,stack:error.stack}};}}
        ''',{'target':TARGET,'privateBindings':private})
        report['browser_version']=browser.version;browser.close()
    r=report['result']
    report['passed']=(not report['page_errors'] and not any(row['type']=='error' for row in report['console'])
        and r.get('rounds')==16 and r.get('tableValuesChecked')==491520 and r.get('releasedAllocations')==112
        and r.get('preservedTableIdentity') and r.get('preservedRecordIdentity') and r.get('byteBackedRecord'))
    report['original_module_sha256']=hashlib.sha256((ROOT/TARGET/(SOURCE+'.mjs')).read_bytes()).hexdigest()
    report['source_fragment']=next(row for row in manifest['module_fragments'] if 'engineInitClipMaps' in row['exports'])
    (ROOT/'reports/oct23-original-clipping-browser.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2));assert report['passed']
finally:server.shutdown();server.server_close();thread.join()
