"""Run original GrowArray boot containers, allocation and append code vs native."""
import functools,hashlib,http.server,json,os,sqlite3,subprocess,tempfile,threading
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];__import__('sys').path.insert(0,str(ROOT/'tools'))
from source_runtime_helpers import runtime_fingerprints
PROFILE=json.loads((ROOT/'tools/browser_classic_profile.json').read_text())
SOURCE=ROOT/PROFILE['prepared_source_root'];MODULES=ROOT/PROFILE['boot_module_root']

def run(args):
    p=subprocess.run(list(map(str,args)),cwd=ROOT,capture_output=True,text=True,timeout=180)
    assert p.returncode==0,(args,p.stdout[-1200:],p.stderr[-3500:])
    return p.stdout

JS=r'''async base=>{
 const {NativeRuntime}=await import(base+'/runtime/index.mjs');
 const {sourceByteView,sourceCString}=await import(base+'/runtime/source_bytes.mjs');
 const runtime=new NativeRuntime({memoryBytes:16<<20});runtime.bindSourceMemory();
 const prefix=base+'/MODULES';
 const release=(await import(prefix+'/browser-abi/libc_provider.mjs')).bindBrowserC(runtime);
 try {
  (await import(prefix+'/source/build/src/baselayer.cpp.mjs')).engineSetupAllocator();
  const allocation=await import(prefix+'/source/build/src/compat.cpp.mjs');
  const build=await import(prefix+'/source/build/src/common.cpp.mjs');
  const duke=await import(prefix+'/source/duke3d/src/common.cpp.mjs');
  const groups=[build.g_defModules,build.g_clipMapFiles,duke.g_scriptModules];
  const calls=[build.G_AddDefModule,build.G_AddClipMap,duke.G_AddConModule];
  const addresses=globalThis[Symbol.for('source-lp64-addresses/2')];
  const rows=[],encode=s=>new TextEncoder().encode(s+'\0');
  groups.forEach((g,i)=>rows.push(['B',i,Number(g.size_),Number(g.capacity_),+(g.data_===null)]));
  for(let n=0;n<64;n++)for(let i=0;i<groups.length;i++){
   const name='original_'+i+'_'+n+'.'+['def','map','con'][i];calls[i](encode(name));
   const g=groups[i],bytes=sourceByteView(g.data_);
   if(!bytes||bytes.byteLength<Number(g.capacity_)*8)throw Error('Original pointer array lost its ABI span');
   const data=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
   const first=addresses.decode(data.getBigUint64(0,true));
   const last=addresses.decode(data.getBigUint64(n*8,true));
   rows.push(['A',i,Number(g.size_),Number(g.capacity_),sourceCString(first,runtime.heap),sourceCString(last,runtime.heap)]);
  }
  allocation.engineDestroyAllocator();return rows;
 }finally{release();runtime.close();}
}'''.replace('MODULES',MODULES.relative_to(ROOT).as_posix())

def main():
    with tempfile.TemporaryDirectory(dir=ROOT/'work',prefix='original-boot-containers-') as folder:
        folder=Path(folder)
        compat=(SOURCE/'source/build/src/compat.cpp').read_text()
        start=compat.index('static void (*g_MemErrHandler)')
        end=compat.index('\n#endif',compat.index('sm_allocator g_sm_heap;',start))+len('\n#endif')
        allocation=folder/'allocation.cpp';allocation.write_text('#include "compat.h"\n'+compat[start:end]+'\n')
        baselayer=(SOURCE/'source/build/src/baselayer.cpp').read_text()
        start=baselayer.index('int initprintf(const char *f, ...)');end=baselayer.index('static int osdfunc_bucketlist',start)
        platform=(SOURCE/'source/build/src/sdlayer.cpp').read_text()
        begin=platform.index('#if !defined STARTUP_SETUP_WINDOW');finish=platform.index('\n#endif',begin)+len('\n#endif')
        logging=folder/'printing.cpp';logging.write_text('#include "baselayer.h"\n'+baselayer[start:end]+platform[begin:finish])
        oracle=folder/'oracle.cpp'
        database=ROOT/PROFILE['build_root']/'reports/semantic-index.sqlite'
        connection=sqlite3.connect(database.resolve().as_uri()+'?mode=ro',uri=True)
        declarations=[];selected=[]
        try:
            for name in ('g_defModules','g_clipMapFiles','g_scriptModules','G_AddDefModule','G_AddClipMap','G_AddConModule'):
                records=[json.loads(r) for r, in connection.execute(
                    'select record from declarations where name=? and definition=1',(name,))]
                assert len(records)==1 and records[0]['kind'] in ('VAR_DECL','FUNCTION_DECL'),records
                record=records[0];data=(SOURCE/record['file']).read_bytes();begin,end=record['definition_extent']
                extent=data[begin:end]+(b';' if data[end:end+1]==b';' else b'')
                declarations.append(extent)
                selected.append({'name':name,'usr':record['usr'],'source':record['file'],
                    'extent':[begin,end],'sha256':hashlib.sha256(extent).hexdigest()})
        finally:connection.close()
        (folder/'original-containers.cpp').write_bytes(b'\n'.join(declarations)+b'\n')
        oracle.write_text('''#include <cstdio>
#include "compat.h"
#include "collections.h"
#include "original-containers.cpp"
extern GrowArray<char *> g_defModules,g_clipMapFiles,g_scriptModules;
void G_AddDefModule(char const*);void G_AddClipMap(char const*);void G_AddConModule(char const*);
struct Probe:GrowArray<char*> {static size_t capacity(GrowArray<char*>& g){return g.*(&Probe::capacity_);}};
int main(){engineCreateAllocator();
 GrowArray<char*>* groups[]={&g_defModules,&g_clipMapFiles,&g_scriptModules};
 void(*calls[])(char const*)={G_AddDefModule,G_AddClipMap,G_AddConModule};
 for(int i=0;i<3;i++)printf("B %d %zu %zu %d\\n",i,groups[i]->size(),Probe::capacity(*groups[i]),groups[i]->begin()==nullptr);
 for(int n=0;n<64;n++)for(int i=0;i<3;i++){
  char name[64];snprintf(name,sizeof(name),"original_%d_%d.%s",i,n,i==0?"def":i==1?"map":"con");
  calls[i](name);auto& g=*groups[i];
  printf("A %d %zu %zu %s %s\\n",i,g.size(),Probe::capacity(g),g[0],g[n]);
 }
 engineDestroyAllocator();}
''')
        flags=['-std=gnu++14','-funsigned-char','-O2','-flto','-include','cstdlib','-DNOASM','-DNDEBUG',
               '-DSDL_TARGET=2','-DRENDERTYPESDL=1','-DNETCODE_DISABLE','-DEDUKE32_BROWSER=1']
        flags+=['-I'+str(SOURCE/p) for p in ('source/build/include','source/duke3d/src','source/audiolib/include',
            'source/mact/include','source/glad/include','platform/Windows/include','platform/Windows/include/SDL2')]
        executable=folder/'oracle.exe'
        units=['source/build/src/smmalloc_generic.cpp','source/build/src/loguru.cpp']
        run(['clang++',*flags,oracle,allocation,logging,*[SOURCE/p for p in units],'-ldbghelp','-o',executable])
        expected=[]
        for line in run([executable]).splitlines():
            parts=line.split();expected.append([parts[0],*[int(v) for v in parts[1:4]],
                *([int(parts[4])] if parts[0]=='B' else parts[4:])])
        runner=folder/'run.mjs';runner.write_text('console.log(JSON.stringify(await ('+JS+')('+json.dumps(ROOT.as_uri())+')));')
        actual=json.loads(run(['node',runner]));assert actual==expected,(actual[:5],expected[:5])
        class Quiet(http.server.SimpleHTTPRequestHandler):
            extensions_map={**http.server.SimpleHTTPRequestHandler.extensions_map,'.mjs':'text/javascript'}
            def log_message(self,*args):pass
        server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)))
        threading.Thread(target=server.serve_forever,daemon=True).start();errors=[]
        try:
            from playwright.sync_api import sync_playwright
            with sync_playwright() as pw:
                browser=pw.chromium.launch(executable_path=os.environ['EDUKE_CHROMIUM_EXECUTABLE'],headless=True)
                try:
                    page=browser.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
                    origin='http://127.0.0.1:'+str(server.server_port);page.goto(origin+'/')
                    actual=page.evaluate(JS,origin);assert actual==expected and not errors,(actual[:5],errors)
                    version=browser.version
                finally:browser.close()
        finally:server.shutdown();server.server_close()
    report={'passed':True,'original_containers':['g_defModules','g_clipMapFiles','g_scriptModules'],
        'original_append_calls':192,'native_node_chromium_rows':len(expected),
        'original_container_constructor_and_append_executed':True,'original_reallocation_preserved_pointer_slots':True,
        'native_whole_source_units':units,'native_exact_source_definitions':selected,
        'native_complete_original_template_header':'source/build/include/collections.h',
        'browser_version':version,'page_errors':errors,'gameplay_verified':False,
        'artifacts':{p.relative_to(ROOT).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in MODULES.rglob('*.mjs')},
        'runtime_artifacts':runtime_fingerprints(ROOT)}
    (ROOT/'reports/nov03-original-boot-containers.json').write_bytes((json.dumps(report,indent=2)+'\n').encode())
    print(json.dumps({k:v for k,v in report.items() if k not in ('artifacts','runtime_artifacts')},indent=2))

if __name__=='__main__':main()
