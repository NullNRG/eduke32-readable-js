"""Import original player globals and verify their actual Clang-sized storage."""
import functools,hashlib,http.server,json,os,sqlite3,subprocess,sys,threading
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
profile=json.loads((ROOT/'tools/browser_classic_profile.json').read_text())
base=ROOT/profile['boot_module_root'];source=ROOT/profile['prepared_source_root']
database=ROOT/profile['build_root']/'reports/semantic-index.sqlite'
connection=sqlite3.connect(database.resolve().as_uri()+'?mode=ro',uri=True)
try:
    assert connection.execute('SELECT status FROM units WHERE source=?',('source/duke3d/src/global.cpp',)).fetchone()==('parsed',)
    candidates=[json.loads(raw) for raw, in connection.execute(
        "SELECT record FROM declarations WHERE file='source/duke3d/src/player.h' AND name='playerdata_t' AND definition=1")]
    record=next(row for row in candidates if row['kind']=='STRUCT_DECL')
finally:connection.close()
js=r'''async ({url,size,alignment})=>{
 const game=await import(url);
 const owners=Object.entries(game).filter(([name])=>/^g_player_s__header_global_/.test(name));
 if(owners.length!==1)throw Error('Original player array owner is not unique');
 const rows=owners[0][1],bytes=rows[Symbol.for('source-first.clang-byte-record-array/1')];
 const pointer=game.g_player?.resolve?.()||game.g_player;
 if(rows.length!==17||bytes?.byteLength!==size*17||alignment!==1)
   throw Error('Original player storage differs from independent Clang layout');
 if(pointer.buffer!==bytes.buffer||pointer.offset!==bytes.byteOffset+size||
    pointer.lower!==bytes.byteOffset||pointer.upper!==bytes.byteOffset+bytes.byteLength)
   throw Error('Original player pointer lost its sentinel or native allocation identity');
 for(let i=0;i<rows.length;i++){
   const view=rows[i][Symbol.for('source-first.original-byte-record-storage/1')];
   if(view?.bytes.buffer!==bytes.buffer||view.bytes.byteOffset!==bytes.byteOffset+i*size)
     throw Error('Original player element has detached storage');
 }
 if(!bytes.every(value=>value===0))throw Error('Original static zero initialization failed');
 return {original_player_storage_verified:true,original_entries:rows.length,
   clang_record_bytes:size,original_owner_bytes:bytes.length,sentinel_preserved:true,
   same_allocation:true,original_static_zero_initialization:true,gameplay_verified:false};
}'''
arguments={'url':(base/'source/duke3d/src/global.cpp.mjs').as_uri(),
           'size':record['size_bytes'],'alignment':record['align_bytes']}
runner='console.log(JSON.stringify(await ('+js+')('+json.dumps(arguments)+')));'
node=subprocess.run(['node','--input-type=module','-e',runner],cwd=ROOT,capture_output=True,text=True,timeout=90)
assert node.returncode==0,node.stderr[-3000:]
expected=json.loads(node.stdout)
class Quiet(http.server.SimpleHTTPRequestHandler):
    extensions_map={**http.server.SimpleHTTPRequestHandler.extensions_map,'.mjs':'text/javascript'}
    def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)))
thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
errors=[]
try:
    from playwright.sync_api import sync_playwright
    with sync_playwright() as pw:
        browser=pw.chromium.launch(executable_path=os.environ['EDUKE_CHROMIUM_EXECUTABLE'],headless=True)
        try:
            page=browser.new_page();page.on('pageerror',lambda error:errors.append(str(error)))
            origin='http://127.0.0.1:'+str(server.server_port)
            page.goto(origin+'/');arguments['url']=origin+'/'+(base/'source/duke3d/src/global.cpp.mjs').relative_to(ROOT).as_posix()
            observed=page.evaluate(js,arguments);assert observed==expected and not errors,(observed,errors)
            version=browser.version
        finally:browser.close()
finally:server.shutdown();server.server_close();thread.join()
report={'format':'original-player-static-storage-proof/1','passed':True,**expected,
    'node_and_chromium_passed':True,'browser_version':version,'page_errors':errors,
    'independent_clang_declaration':{key:record[key] for key in ('usr','file','line','size_bytes','align_bytes')},
    'original_header_sha256':hashlib.sha256((source/record['file']).read_bytes()).hexdigest(),
    'artifacts':{p.relative_to(ROOT).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in base.rglob('*.mjs')},
    'original_engine_startup_verified':False}
(ROOT/'reports/nov02-original-player-storage.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({k:v for k,v in report.items() if k!='artifacts'},indent=2))
