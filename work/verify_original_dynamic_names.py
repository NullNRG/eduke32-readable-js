"""Compare original dynamic-name storage and mapping against native C++.

The native oracle links the complete original dynamic-name and hash sources,
original allocation/logging code, and exact weapon/spawn array declarations.
This verifies the original subsystem initializer, not whole-game startup.
"""
import functools,hashlib,http.server,json,os,sqlite3,subprocess,tempfile,threading
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
PROFILE=json.loads((ROOT/'tools/browser_classic_profile.json').read_text())
SOURCE=ROOT/PROFILE['prepared_source_root'];MODULES=ROOT/PROFILE['boot_module_root']
UNIT='source/duke3d/src/dnames.cpp'
STEPS=[['MIRROR',6001,0],['APLAYER',6002,0],['ALIEN_SWITCH1',6003,1],['RPGSPRITE',6123,0],['MIRROR',-1,0],['__not_an_original_name',17,0]]

def run(arguments,**kwargs):
    result=subprocess.run(list(map(str,arguments)),cwd=ROOT,capture_output=True,text=True,timeout=180,**kwargs)
    assert result.returncode==0,(arguments,result.stdout[-1200:],result.stderr[-3500:])
    return result.stdout

JS=r'''async({base,names,steps})=>{
 const {NativeRuntime}=await import(base+'/runtime/index.mjs');
 const {sourceCString,sourceByteView}=await import(base+'/runtime/source_bytes.mjs');
 const runtime=new NativeRuntime({memoryBytes:16<<20});runtime.bindSourceMemory();
 const root=base+'/MODULES';
 const release=(await import(root+'/browser-abi/libc_provider.mjs')).bindBrowserC(runtime);
 try{
  const engine=await import(root+'/source/build/src/baselayer.cpp.mjs');engine.engineSetupAllocator();
  const allocation=await import(root+'/source/build/src/compat.cpp.mjs');
  const original=await import(root+'/source/duke3d/src/dnames.cpp.mjs');
  const globals=await import(root+'/source/duke3d/src/global.cpp.mjs');
  const player=await import(root+'/source/duke3d/src/player.cpp.mjs');
  const hash=await import(root+'/source/build/src/hash.cpp.mjs');
  const read=p=>{
   if(p?.__cReference===true)return Number(p.value);
   const bytes=sourceByteView(p);if(!bytes||bytes.length<2)throw Error('Dynamic value lacks original int16 storage');
   return new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength).getInt16(0,true);
  };
  const tables=[original.g_dynTileList,original.g_dynSoundList],rows=[];
  for(const name of names)rows.push(['V',name,Number(original[name])]);
  tables.forEach((table,index)=>{
   const bytes=table[Symbol.for('source-first.clang-byte-record-array/1')];
   if(!(bytes instanceof Uint8Array)||bytes.length!==table.length*24)throw Error('Original dynitem ABI differs');
   table.forEach(item=>rows.push(['T'+index,sourceCString(item.str,runtime.heap),read(item.dynvalptr),item.staticval]));
  });
  original.inithashnames();
  const addresses=globalThis[Symbol.for('source-lp64-addresses/2')];
  for(const [name,value,which] of steps){
   const text=addresses.decode(runtime.heap.writeCString(name));
   original.G_ProcessDynamicNameMapping(text,tables[which],value);
   // A direct module read must observe the write through the original table
   // pointer, rather than a detached copy of a C++ global.
   rows.push(['R',name,Number(original.MIRROR),Number(original.APLAYER),Number(original.ALIEN_SWITCH1),Number(original.RPGSPRITE)]);
  }
  const arrays=tag=>{
   rows.push([tag,'blimp',...globals.g_blimpSpawnItems]);
   rows.push([tag,'weapons',...player.WeaponPickupSprites]);
  };
  arrays('B');original.G_InitDynamicNames();arrays('A');
  tables.forEach((table,index)=>table.forEach(item=>rows.push(['I'+index,sourceCString(item.str,runtime.heap),
    Number(hash.inthash_find(index?original.h_dsound:original.h_dynamictilemap,BigInt(read(item.dynvalptr))))])));
  original.freehashnames();hash.inthash_free(original.h_dsound);hash.inthash_free(original.h_dynamictilemap);
  allocation.engineDestroyAllocator();return rows;
 }finally{release();runtime.close();}
}'''.replace('MODULES',MODULES.relative_to(ROOT).as_posix())

def main():
    manifest=json.loads((MODULES/(UNIT+'.manifest.json')).read_text())
    names=sorted(row['source_name'] for row in manifest['definitions'] if row.get('status')=='source-first'
        and row.get('kind')=='VarDecl' and row.get('original_type') in ('int16_t','short')
        and (row.get('physical_source') or UNIT)==UNIT)
    assert len(names)==767,len(names)
    source=(SOURCE/UNIT).read_bytes();prefix=source
    database=ROOT/PROFILE['build_root']/'reports/semantic-index.sqlite'
    connection=sqlite3.connect(database.resolve().as_uri()+'?mode=ro',uri=True);declarations=[]
    try:
        for name in ('g_blimpSpawnItems','WeaponPickupSprites'):
            choices=[json.loads(raw) for raw, in connection.execute('select record from declarations where name=? and definition=1',(name,))]
            assert len(choices)==1 and choices[0]['kind']=='VAR_DECL',choices
            record=choices[0];data=(SOURCE/record['file']).read_bytes();begin,end=record['definition_extent']
            assert data[end:end+1]==b';' and name.encode() in data[begin:end]
            declarations.append(data[begin:end+1])
    finally:connection.close()
    with tempfile.TemporaryDirectory(dir=ROOT/'work',prefix='original-dynamic-names-') as directory:
        folder=Path(directory);original=folder/'original-prefix.cpp';original.write_bytes(prefix+b'\n'+b'\n'.join(declarations)+b'\n')
        compat=(SOURCE/'source/build/src/compat.cpp').read_text()
        start=compat.index('static void (*g_MemErrHandler)')
        end=compat.index('\n#endif',compat.index('sm_allocator g_sm_heap;',start))+len('\n#endif')
        allocation=folder/'original-allocation.cpp'
        allocation.write_text('#include "compat.h"\n'+compat[start:end]+'\n')
        base_source=(SOURCE/'source/build/src/baselayer.cpp').read_text()
        start=base_source.index('int initprintf(const char *f, ...)')
        end=base_source.index('static int osdfunc_bucketlist',start)
        platform_source=(SOURCE/'source/build/src/sdlayer.cpp').read_text()
        begin=platform_source.index('#if !defined STARTUP_SETUP_WINDOW')
        finish=platform_source.index('\n#endif',begin)+len('\n#endif')
        logging=folder/'original-initialization-printing.cpp'
        logging.write_text('#include "baselayer.h"\n'+base_source[start:end]+'\n'+platform_source[begin:finish]+'\n')
        oracle=folder/'oracle.cpp'
        oracle.write_text('''#include <cstdio>
#include <cstdlib>
#include "compat.h"
#include "dnames.h"
#include "original-prefix.cpp"
int main(){engineCreateAllocator();static_assert(sizeof(dynitem)==24,"original LP64 table ABI");
'''+''.join('printf("V '+name+' %d\\n",(int)'+name+');\n' for name in names)+'''
 for(auto const& item:g_dynTileList)printf("T0 %s %d %d\\n",item.str,(int)*item.dynvalptr,(int)item.staticval);
 for(auto const& item:g_dynSoundList)printf("T1 %s %d %d\\n",item.str,(int)*item.dynvalptr,(int)item.staticval);
 inithashnames();
'''+''.join('G_ProcessDynamicNameMapping("'+name+'",'+('g_dynSoundList' if which else 'g_dynTileList')+','+str(value)+');\nprintf("R '+name+' %d %d %d %d\\n",(int)MIRROR,(int)APLAYER,(int)ALIEN_SWITCH1,(int)RPGSPRITE);\n' for name,value,which in STEPS)+'''
 auto arrays=[](const char*tag){printf("%s blimp",tag);for(auto v:g_blimpSpawnItems)printf(" %d",(int)v);printf("\\n");
 printf("%s weapons",tag);for(auto v:WeaponPickupSprites)printf(" %d",(int)v);printf("\\n");};
 arrays("B");G_InitDynamicNames();arrays("A");
 for(auto const& item:g_dynTileList)printf("I0 %s %lld\\n",item.str,(long long)inthash_find(&h_dynamictilemap,*item.dynvalptr));
 for(auto const& item:g_dynSoundList)printf("I1 %s %lld\\n",item.str,(long long)inthash_find(&h_dsound,*item.dynvalptr));
 freehashnames();inthash_free(&h_dsound);inthash_free(&h_dynamictilemap);engineDestroyAllocator();}
''')
        # Both original string and integer hash implementations are exercised.
        hash_source=(SOURCE/'source/build/src/hash.cpp').read_bytes()
        string_hash=folder/'original-string-hash.cpp'
        string_hash.write_bytes(hash_source)
        flags=['-std=gnu++14','-funsigned-char','-O2','-flto','-include','cstdlib','-DNOASM','-DNDEBUG',
            '-DSDL_TARGET=2','-DRENDERTYPESDL=1','-DNETCODE_DISABLE','-DEDUKE32_BROWSER=1']
        flags+=['-I'+str(SOURCE/part) for part in ('source/build/include','source/duke3d/src','source/audiolib/include',
            'source/mact/include','source/glad/include','platform/Windows/include','platform/Windows/include/SDL2')]
        executable=folder/'oracle.exe'
        run(['clang++',*flags,oracle,string_hash,allocation,logging,SOURCE/'source/build/src/smmalloc_generic.cpp',
            SOURCE/'source/build/src/loguru.cpp','-ldbghelp','-o',executable])
        expected=[]
        for line in run([executable]).splitlines():
            parts=line.split();expected.append(parts[:2]+[int(value) for value in parts[2:]])
        arguments={'base':ROOT.as_uri(),'names':names,'steps':STEPS}
        runner=folder/'run.mjs';runner.write_text('console.log(JSON.stringify(await ('+JS+')('+json.dumps(arguments)+')));')
        actual=json.loads(run(['node',runner]));assert actual==expected,next(((a,b) for a,b in zip(actual,expected) if a!=b),('length',len(actual),len(expected)))
        class Quiet(http.server.SimpleHTTPRequestHandler):
            extensions_map={**http.server.SimpleHTTPRequestHandler.extensions_map,'.mjs':'text/javascript'}
            def log_message(self,*args):pass
        class Server(http.server.HTTPServer):request_queue_size=128
        server=Server(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)));threading.Thread(target=server.serve_forever,daemon=True).start()
        errors=[]
        try:
            from playwright.sync_api import sync_playwright
            with sync_playwright() as pw:
                browser=pw.chromium.launch(executable_path=os.environ['EDUKE_CHROMIUM_EXECUTABLE'],headless=True)
                try:
                    page=browser.new_page();page.on('pageerror',lambda error:errors.append(str(error)))
                    origin='http://127.0.0.1:'+str(server.server_port);page.goto(origin+'/')
                    arguments['base']=origin;actual=page.evaluate(JS,arguments)
                    assert actual==expected and not errors,(actual[-5:],expected[-5:],errors)
                    version=browser.version
                finally:browser.close()
        finally:server.shutdown();server.server_close()
    report={'passed':True,'original_numeric_globals':len(names),'original_tile_records':625,'original_sound_records':142,
        'native_node_chromium_rows':len(expected),'native_node_chromium_match':True,
        'original_hash_initialization_and_mapping_executed':True,'pointer_writes_reach_original_global_exports':True,
        'original_G_InitDynamicNames_executed':True,'original_integer_mapping_lookups_verified':767,
        'original_spawn_and_weapon_arrays_verified_before_and_after':True,
        'invalid_mapping_inputs_match_native':True,'source_sha256':hashlib.sha256(source).hexdigest(),
        'exact_original_prefix_bytes':len(prefix),'prefix_sha256':hashlib.sha256(prefix).hexdigest(),
        'string_hash_source_sha256':hashlib.sha256(hash_source).hexdigest(),
        'browser_version':version,'page_errors':errors,'gameplay_verified':False}
    report['artifacts']={path.relative_to(ROOT).as_posix():hashlib.sha256(path.read_bytes()).hexdigest()
        for path in sorted(MODULES.rglob('*.mjs'))}
    report['runtime_artifacts']={path.relative_to(ROOT).as_posix():hashlib.sha256(path.read_bytes()).hexdigest()
        for path in [*sorted((ROOT/'runtime').rglob('*.mjs')),ROOT/'tools/source_address_runtime.mjs']}
    (ROOT/'reports/nov03-original-dynamic-initialization.json').write_bytes((json.dumps(report,indent=2)+'\n').encode())
    print(json.dumps({key:value for key,value in report.items() if key not in ('artifacts','runtime_artifacts')},indent=2))

if __name__=='__main__':main()
