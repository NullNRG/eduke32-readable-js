"""Compile/link and execute the original browser allocation startup/error chain.

This is an engine subsystem proof, never a game boot or gameplay attestation.
Run after the complete current-profile semantic ownership contract is refreshed.
"""
import argparse,asyncio,functools,hashlib,http.server,json,os,subprocess,sys,tempfile,threading
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'factory-output/browser-classic/source-tree/eduke32-master'
COMMANDS=ROOT/'factory-output/browser-classic/compile_commands.json'
OUT=ROOT/'factory-output/source-first/oct29-browser-allocation-chain'
REPORT=ROOT/'reports/oct29-browser-allocation-chain-parity.json'
CACHE=ROOT/'work/ast/f3f73c89e7558265637b0512990774fe2bdcc6ec733701b88b4869ed0334ea68'
NAMES=['engineCreateAllocator','engineDestroyAllocator','xmalloc','xcalloc','xrealloc','xfree',
       'xaligned_alloc','xaligned_calloc','xaligned_free','xstrdup','handle_memerr','set_memerr_handler',
       '_xmalloc','_xcalloc','_xrealloc','_xfree','_xaligned_alloc','_xaligned_calloc','_xaligned_free','_xstrdup']
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def run(arguments,cwd=ROOT,expected=0):
    result=subprocess.run(list(map(str,arguments)),cwd=cwd,capture_output=True,text=True,timeout=900)
    if result.returncode!=expected:raise RuntimeError(' '.join(map(str,arguments[:4]))+'\n'+result.stdout[-3000:]+'\n'+result.stderr[-6000:])
    return result
RUN_JS=r'''
function checkOriginalChain(m,g){
 const addresses=globalThis[Symbol.for('source-lp64-addresses/2')];
 const bytes=p=>new Uint8Array(p.buffer,p.offset,p.upper-p.offset);
 m.engineCreateAllocator();
 const rows=[];
 for(let i=0;i<128;i++){
  const n=(i*29)%2049,a=1<<(i%9);let p=m.xcalloc(BigInt(n),1n);
  let zero=0;for(let j=0;j<n;j++)zero+=bytes(p)[j];
  for(let j=0;j<n;j++)bytes(p)[j]=(j*7+i)&255;
  p=m.xrealloc(p,BigInt(n+63));let sum=0;for(let j=0;j<n;j++)sum+=bytes(p)[j];
  const usable=g.GetUsableSpace(null,p);m.xfree(p);
  const aligned=m.xaligned_alloc(BigInt(a),BigInt(n+1));
  const offset=addresses.encode(aligned)%BigInt(Math.max(a,16));m.xaligned_free(aligned);
  const clear=m.xaligned_calloc(BigInt(a),BigInt(n+1),2n);
  let cleared=0;for(let j=0;j<(n+1)*2;j++)cleared+=bytes(clear)[j];m.xaligned_free(clear);
  const plain=m.xmalloc(BigInt(n));m.xfree(plain);
  rows.push(`${n},${zero},${sum},${usable},${offset},${cleared}`);
 }
 const text=new Uint8Array([68,117,107,101,32,78,117,107,101,109,32,51,68,0]);
 const copy=m.xstrdup(text);rows.push(Array.from(bytes(copy).subarray(0,text.length)).join(','));m.xfree(copy);
 let c=m._xcalloc(37n,3n);let csum=0;for(let i=0;i<111;i++)csum+=bytes(c)[i];
 c=m._xrealloc(c,219n);rows.push(`${csum},${g.GetUsableSpace(null,c)}`);m._xfree(c);
 c=m._xmalloc(37n);m._xfree(c);c=m._xaligned_alloc(128n,49n);m._xaligned_free(c);
 c=m._xaligned_calloc(256n,31n,2n);m._xaligned_free(c);c=m._xstrdup(text);m._xfree(c);
 m.xfree(null);m.xaligned_free(null);m._xfree(null);
 const callback=[];m.set_memerr_handler((count,line)=>callback.push(`oom:${count}:${line}`));
 const p=m.xmalloc(68n);bytes(p).fill(213,0,68);
 let failure=null;try{m.xrealloc(p,1n<<62n);}catch(error){failure={name:error.name,status:error.status};}
 if(failure?.name!=='CProcessExit'||failure.status!==1||callback.join('\n')!=='oom:0:0')
   throw Error('Original memory failure path did not call its handler and terminate: '+JSON.stringify({failure,callback}));
 let preserved=0;for(let i=0;i<68;i++)preserved+=bytes(p)[i];
 if(preserved!==68*213)throw Error('Failed realloc corrupted original storage');
 m.xfree(p);m.set_memerr_handler(null);m.engineDestroyAllocator();
 if(globalThis[Symbol.for('source-first.native-C-heap/2')].allocations.size!==0)throw Error('Original wrappers leaked allocations');
 return {rows,failure,callback,preserved};
}
'''
def native(directory):
    compat=(SOURCE/'source/build/src/compat.cpp').read_text()
    declaration=compat[compat.index('static void (*g_MemErrHandler)'):]
    declaration=declaration[:declaration.index(';')+1]
    start=compat.index('EDUKE32_NORETURN void handle_memerr(')
    end=compat.index('\n#endif',compat.index('sm_allocator g_sm_heap;',start))+len('\n#endif')
    # Copy exact original bodies/global declaration into an isolated oracle.
    # No test implementation replaces any source allocation/error function.
    fragment=compat[start:end]
    cpp=directory/'oracle.cpp';exe=directory/'oracle.exe'
    cpp.write_text('#include <cstdio>\n#include <cstdlib>\n#include <cstddef>\n#include '+json.dumps((SOURCE/'source/build/src/smmalloc_generic.cpp').as_posix())+'\n'
        +declaration+'\n'+fragment+r'''
static void report_memory_error(int32_t count,int32_t line,const char*,const char*){printf("oom:%d:%d\n",count,line);}
int main(int argc,char**){
 engineCreateAllocator();
 if(argc>1){set_memerr_handler(report_memory_error);void*p=xmalloc(68);xrealloc(p,size_t(1)<<62);return 9;}
 for(unsigned i=0;i<128;i++){
  size_t n=(i*29)%2049,a=size_t(1)<<(i%9);void*p=xcalloc(n,1);
  unsigned zero=0;for(size_t j=0;j<n;j++)zero+=static_cast<unsigned char*>(p)[j];
  for(size_t j=0;j<n;j++)static_cast<unsigned char*>(p)[j]=(j*7+i)&255;
  p=xrealloc(p,n+63);unsigned sum=0;for(size_t j=0;j<n;j++)sum+=static_cast<unsigned char*>(p)[j];
  size_t usable=sm::GenericAllocator::GetUsableSpace(nullptr,p);xfree(p);
  void*aligned=xaligned_alloc(a,n+1);size_t offset=reinterpret_cast<size_t>(aligned)%std::max(a,size_t(16));xaligned_free(aligned);
  void*clear=xaligned_calloc(a,n+1,2);unsigned cleared=0;
  for(size_t j=0;j<(n+1)*2;j++)cleared+=static_cast<unsigned char*>(clear)[j];xaligned_free(clear);
  void*plain=xmalloc(n);xfree(plain);
  printf("%zu,%u,%u,%zu,%zu,%u\n",n,zero,sum,usable,offset,cleared);
 }
 const char*text="Duke Nukem 3D";char*copy=xstrdup(text);
 for(size_t i=0;i<14;i++)printf("%s%u",i?",":"",static_cast<unsigned char>(copy[i]));puts("");xfree(copy);
 void*c=_xcalloc(37,3);unsigned csum=0;for(size_t i=0;i<111;i++)csum+=static_cast<unsigned char*>(c)[i];
 c=_xrealloc(c,219);printf("%u,%zu\n",csum,sm::GenericAllocator::GetUsableSpace(nullptr,c));_xfree(c);
 c=_xmalloc(37);_xfree(c);c=_xaligned_alloc(128,49);_xaligned_free(c);
 c=_xaligned_calloc(256,31,2);_xaligned_free(c);c=_xstrdup(text);_xfree(c);
 xfree(nullptr);xaligned_free(nullptr);_xfree(nullptr);engineDestroyAllocator();
}
''')
    # The C bridge bodies are source definitions immediately preceding the
    # extracted error handler, not alternate fixture implementations.
    wrappers=compat[compat.index('char *_xstrdup('):compat.index('\n#ifdef __cplusplus\n}',compat.index('char *_xstrdup('))]
    cpp.write_text(cpp.read_text().replace(declaration+'\n',declaration+'\nextern "C" {\n'+wrappers+'\n}\n',1))
    flags=['-funsigned-char','-std=gnu++14','-DNOASM','-DNDEBUG','-DSDL_TARGET=2','-DRENDERTYPESDL=1','-DNETCODE_DISABLE','-DEDUKE32_BROWSER=1']
    flags+=['-I'+str(SOURCE/p) for p in ('source/build/include','source/audiolib/include','platform/Windows/include','platform/Windows/include/SDL2')]
    run(['clang++',*flags,cpp,'-o',exe])
    rows=run([exe],directory).stdout.strip().splitlines()
    failure=run([exe,'oom'],directory,1).stdout.strip().splitlines()
    assert failure==['oom:0:0'],failure
    return rows,{'returncode':1,'stdout':failure,'source_fragment_sha256':hashlib.sha256((declaration+'\n'+fragment+'\n'+wrappers).encode()).hexdigest()}
class QuietHandler(http.server.SimpleHTTPRequestHandler):
    extensions_map={**http.server.SimpleHTTPRequestHandler.extensions_map,'.mjs':'text/javascript'}
    def log_message(self,*args):pass
    def do_GET(self):
        if self.path=='/__source_allocator_probe__':
            data=b'<!doctype html><title>Original source allocator parity fixture</title><link rel="icon" href="data:,">'
            self.send_response(200);self.send_header('Content-Type','text/html');self.send_header('Content-Length',str(len(data)))
            self.end_headers();self.wfile.write(data);return
        super().do_GET()
async def browser(names,generic_names,expected):
    from playwright.async_api import async_playwright
    server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(QuietHandler,directory=str(ROOT)))
    thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
    base='http://127.0.0.1:'+str(server.server_port)
    async with async_playwright() as playwright:
        instance=await playwright.chromium.launch(executable_path=os.environ['EDUKE_CHROMIUM_EXECUTABLE'],headless=True)
        try:
            page=await instance.new_page();errors=[];console=[]
            page.on('pageerror',lambda error:errors.append(str(error)))
            page.on('console',lambda message:console.append({'type':message.type,'text':message.text}))
            await page.goto(base+'/__source_allocator_probe__',wait_until='load')
            cdp=await page.context.new_cdp_session(page)
            await cdp.send('Profiler.enable');await cdp.send('Profiler.startPreciseCoverage',{'callCount':True,'detailed':True})
            actual=await page.evaluate('''async ({base,names,genericNames,root,body})=>{
              const original=await import(base+'/'+root+'/source/build/src/compat.cpp.mjs');
              const generic=await import(base+'/'+root+'/source/build/src/smmalloc_generic.cpp.mjs');
              const m=Object.fromEntries(Object.entries(names).map(([a,b])=>[a,original[b]]));
              const g=Object.fromEntries(Object.entries(genericNames).map(([a,b])=>[a,generic[b]]));
              return Function('m','g',body+';return checkOriginalChain(m,g);')(m,g);
            }''',{'base':base,'names':names,'genericNames':generic_names,'root':OUT.relative_to(ROOT).as_posix(),'body':RUN_JS})
            assert actual['rows']==expected,(actual['rows'][:4],expected[:4]);assert not errors,errors
            coverage=await cdp.send('Profiler.takePreciseCoverage');await cdp.send('Profiler.stopPreciseCoverage')
            functions=[{'module':row['url'].removeprefix(base+'/'),'name':fn['functionName'],'calls':fn['ranges'][0]['count']}
                for row in coverage['result'] if row['url'].startswith(base+'/'+OUT.relative_to(ROOT).as_posix())
                for fn in row['functions'] if fn['ranges'] and fn['ranges'][0]['count']>0]
            executed={r['name'] for r in functions}
            assert all(symbol in executed for symbol in names.values()),set(names.values())-executed
            return {'passed':True,'browser_version':instance.version,'page_errors':errors,'console':console,
                    'actual':actual,'executed_source_functions':functions}
        finally:
            await instance.close();server.shutdown();server.server_close();thread.join()
def main():
    global COMMANDS
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--skip-build',action='store_true')
    parser.add_argument('--commands',type=Path,default=COMMANDS)
    args=parser.parse_args();COMMANDS=args.commands.resolve()
    OUT.mkdir(parents=True,exist_ok=True)
    plan={'root':str(SOURCE),'compile_commands':str(COMMANDS),'units':[
        {'source':'source/build/src/smmalloc_generic.cpp','header_dependency_closure':True},
        {'source':'source/build/src/compat.cpp','filter':','.join(NAMES+['g_sm_heap','g_MemErrHandler']),
         'header_inlines':True,'header_dependency_closure':True,'dependency_closure':True}]}
    plan_path=ROOT/'work/browser-allocation-chain-plan.json';plan_path.write_text(json.dumps(plan,indent=2)+'\n')
    if not args.skip_build:
        print(run([sys.executable,'tools/source_first_project.py','--plan',plan_path,'--out-dir',OUT,
                   '--compile-commands',COMMANDS,'--ast-cache-dir',CACHE,'--ast-cache-shards',1]).stdout,flush=True)
    summary=json.loads((OUT/'project-build.json').read_text());assert not summary['invalid_imports'],summary['invalid_imports']
    compat_path=OUT/'source/build/src/compat.cpp.manifest.json';generic_path=OUT/'source/build/src/smmalloc_generic.cpp.manifest.json'
    compat_module=OUT/'source/build/src/compat.cpp.mjs';generic_module=OUT/'source/build/src/smmalloc_generic.cpp.mjs'
    compat=json.loads(compat_path.read_text());generic=json.loads(generic_path.read_text())
    names={}
    for name in NAMES:
        rows=[r for r in compat['definitions'] if r.get('source_name',r['name'])==name]
        assert len(rows)==1 and rows[0]['status']=='source-first',(name,rows)
        names[name]=rows[0]['name']
    generic_names={r['source_name']:r['name'] for r in generic['definitions'] if r.get('original_static_member') and r['status']=='source-first'}
    assert len(generic_names)==8,generic_names
    with tempfile.TemporaryDirectory(prefix='eduke-browser-allocator-chain-') as temporary:
        directory=Path(temporary);expected,native_failure=native(directory)
        js=directory/'run.mjs'
        js.write_text('import * as original from '+json.dumps(compat_module.as_uri())+';\n'
            +'import * as generic from '+json.dumps(generic_module.as_uri())+';\n'
            +'const names='+json.dumps(names)+',genericNames='+json.dumps(generic_names)+';\n'
            +'const m=Object.fromEntries(Object.entries(names).map(([a,b])=>[a,original[b]]));\n'
            +'const g=Object.fromEntries(Object.entries(genericNames).map(([a,b])=>[a,generic[b]]));\n'
            +RUN_JS+'\nconsole.log(JSON.stringify(checkOriginalChain(m,g)));\n')
        node=json.loads(run(['node',js],directory).stdout);assert node['rows']==expected,(node['rows'][:4],expected[:4])
        chromium=asyncio.run(browser(names,generic_names,expected))
    report={'format':'original-browser-allocation-chain-parity/1','passed':True,'native_node_chromium_cases':len(expected),
        'commands_sha256':sha(COMMANDS),'source_allocator_backend':'original-sm-GenericAllocator',
        'component_selected_units':len(json.loads(COMMANDS.read_text())),
        'whole_browser_profile_verified':False,
        'source_adaptations':json.loads((ROOT/'reports/browser-classic-preparation.json').read_text())['source_adaptations'],
        'modules':{p.relative_to(ROOT).as_posix():sha(p) for p in (compat_path,generic_path,compat_module,generic_module)},
        'original_functions':names,'native_failure':native_failure,'node':node,'chromium':chromium,
        'engine_allocator_startup_verified':True,'engine_preinit_verified':False,'gameplay_verified':False}
    REPORT.write_text(json.dumps(report,indent=2)+'\n')
    print('PASS original engine allocator startup/wrappers/failure path against native C++ and Chromium; no enginePreInit/gameplay claim')
if __name__=='__main__':main()
