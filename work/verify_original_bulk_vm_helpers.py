"""Native original math/random/allocation helpers versus the active JS owner."""
import hashlib,json,subprocess,tempfile
from pathlib import Path
from verify_original_demo_snapshot_heap import ROOT,run_browser_probe
from original_probe_evidence import current_inputs,unchanged_inputs

if __name__=='__main__':
 profile=json.loads((ROOT/'tools/browser_classic_profile.json').read_text());source=ROOT/profile['prepared_source_root']
 pragmas=(source/'source/build/src/pragmas.cpp').read_text()
 initialization=pragmas[pragmas.index('libdivide::libdivide_s64_t divtable64'):pragmas.index('#if defined(__GNUC__)')]
 original_allocator=(source/'source/build/src/smmalloc_generic.cpp').as_posix()
 native='#include <cstdio>\n#include <cstdlib>\n#include "compat.h"\n#include "pragmas.h"\n#include "random.h"\n#include '+json.dumps(original_allocator)+'\n'
 native+='sm::GenericAllocator::TInstance g_sm_heap;int32_t randomseed=1;uint32_t wrandomseed=1;void handle_memerr(int32_t){std::abort();}\n'+initialization
 native+=r'''
int main(){engineCreateAllocator();initdivtables();
 for(int n=0;n<512;n++){int a=n*937,b=n+17,s=n&7;int k=krand();
  printf("M,%d,%d,%d,%d,%d,%d,%d,%d,%d\n",divscale(a,b,s),scale(a,b,91),mulscale(a,b,s),mulscale15(a,b),mulscale16(a,b),klabs(n-256),ksgn(n-256),k,randomseed);}
 for(int i=0;i<128;i++){size_t n=(i*37)%4097+1,size=i%23+1,alignment=size_t(1)<<(i%9);
  void*p=xmalloc(n),*q=xcalloc(3,size),*r=xaligned_alloc(alignment,n+7);unsigned zero=0,sum=0;
  for(size_t j=0;j<3*size;j++)zero+=reinterpret_cast<unsigned char*>(q)[j];
  for(size_t j=0;j<n;j++){reinterpret_cast<unsigned char*>(p)[j]=(j*13+i)&255;sum+=reinterpret_cast<unsigned char*>(p)[j];}
  printf("C,%zu,%u,%u,%zu\n",reinterpret_cast<size_t>(p)%16,zero,sum,reinterpret_cast<size_t>(r)%std::max(alignment,size_t(16)));
  xaligned_free(p);xaligned_free(q);xaligned_free(r);
 }engineDestroyAllocator();}
'''
 with tempfile.TemporaryDirectory(prefix='native-vm-helpers-') as folder:
  folder=Path(folder);cpp=folder/'oracle.cpp';exe=folder/'oracle.exe';cpp.write_text(native)
  flags=['-std=c++14','-funsigned-char','-DNOASM','-DNDEBUG','-DEDUKE32_BROWSER=1']
  flags+=['-I'+str(source/p) for p in ('source/build/include','platform/Windows/include','platform/Windows/include/SDL2')]
  result=subprocess.run(['clang++',*flags,str(cpp),'-o',str(exe)],capture_output=True,text=True);assert result.returncode==0,result.stderr
  expected=subprocess.check_output([str(exe)],text=True).splitlines()
 manifest=json.loads((ROOT/profile['boot_module_root']/'source/duke3d/src/gameexec.cpp.manifest.json').read_text())
 row=next(r for r in manifest['definitions'] if r['name']=='krand');binding=next(p['binding'] for p in row['external_storage_imports'] if p['name']=='randomseed')
 probe=r'''async base=>{
 const {NativeRuntime}=await import('/runtime/index.mjs');
 const r=new NativeRuntime({canvas:document.querySelector('canvas'),renderer:'canvas2d',memoryBytes:16<<20});r.bindSourceMemory();
 const release=(await import(base+'/browser-abi/libc_provider.mjs')).bindBrowserC(r),sdl=(await import(base+'/browser-abi/sdl_provider.mjs')).bindBrowserSDL(r);
 try{
  const layer=await import(base+'/source/build/src/baselayer.cpp.mjs'),engine=await import(base+'/source/build/src/engine.cpp.mjs'),g=await import(base+'/source/duke3d/src/gameexec.cpp.mjs');
  layer.engineSetupAllocator();if(engine.enginePreInit()!==0)throw Error('Original engine preinit failed');
  const seed=engine[SEED](),address=globalThis[Symbol.for('source-lp64-addresses/2')];seed.value=1;
  const rows=[];for(let n=0;n<512;n++){const a=n*937,b=n+17,s=n&7,k=g.krand();rows.push(['M',g.divscale(a,b,s),g.scale(a,b,91),g.mulscale(a,b,s),g.mulscale15(a,b),g.mulscale16(a,b),g.klabs(n-256),g.ksgn(n-256),k,seed.value].join(','));}
  const baseline=r.heap.allocations.size;
  for(let i=0;i<128;i++){const n=(i*37)%4097+1,size=i%23+1,alignment=1<<(i%9),p=g.xmalloc(BigInt(n)),q=g.xcalloc(3n,BigInt(size)),z=g.xaligned_alloc(BigInt(alignment),BigInt(n+7));
   if(p==null||q==null||z==null)throw Error('Original successful allocation fixture failed');
   const raw=value=>Number(address.encode(value));let zero=0,sum=0;
   for(const v of new Uint8Array(r.heap.buffer,raw(q),3*size))zero+=v;
   const bytes=new Uint8Array(r.heap.buffer,raw(p),n);for(let j=0;j<n;j++){bytes[j]=(j*13+i)&255;sum+=bytes[j];}
   rows.push(['C',raw(p)%16,zero,sum,raw(z)%Math.max(alignment,16)].join(','));g.xaligned_free(p);g.xaligned_free(q);g.xaligned_free(z);
   if(r.heap.allocations.size!==baseline)throw Error('Original wrappers leaked allocation storage');
  }
  return {rows,allocation_roundtrips:128,original_engine_preinit_executed:true};
 }finally{sdl();release();r.close();}
}'''.replace('SEED',json.dumps(binding))
 inputs=current_inputs();actual=run_browser_probe(probe)
 assert actual['rows']==expected,next(((i,a,b) for i,(a,b) in enumerate(zip(actual['rows'],expected)) if a!=b),None)
 report={'verified':True,'functions':['divscale','scale','mulscale','mulscale15','mulscale16','klabs','ksgn','krand','xmalloc','xcalloc','xaligned_alloc','xaligned_free'],
  'native_chromium_values':512*9+128*4,'native_math_random_steps':512,'native_allocation_roundtrips':128,'browser_allocation_leaks':0,
  'original_divider_and_engine_initialization':True,'native_oracle_sha256':hashlib.sha256(native.encode()).hexdigest(),
  'oracle_failure_scope':'Defined nonzero division and successful allocations only; unexpected native allocation failure aborts the harness, not a comparison of original error handling',
  'results_sha256':hashlib.sha256(json.dumps(expected).encode()).hexdigest(),'gameplay_verified':False}
 report.update(unchanged_inputs(inputs));report['chromium_version']=actual['chromium_version']
 (ROOT/'reports/nov23-original-bulk-vm-helpers.json').write_text(json.dumps(report,indent=2)+'\n')
 print('PASS',report['native_chromium_values'],'native/Chromium values across original math/random and allocation wrappers')
