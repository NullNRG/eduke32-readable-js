"""Compare the entire linked original fixed-point arithmetic path with native C++."""
import hashlib,json,random,subprocess,tempfile
from pathlib import Path
from verify_original_demo_snapshot_heap import ROOT,run_browser_probe
if __name__=='__main__':
 profile=json.loads((ROOT/'tools/browser_classic_profile.json').read_text());source=ROOT/profile['prepared_source_root']
 names=['fix16_add','fix16_sub','fix16_mul','fix16_div','fix16_sadd','fix16_ssub','fix16_smul','fix16_sdiv']
 rng=random.Random(191126);pairs=[[rng.randrange(-2147483647,2147483648),rng.randrange(-2147483647,2147483648)] for _ in range(512)]
 pairs += [[a,b] for a,b in [(0,0),(0,1),(1,0),(65536,65536),(-65536,98304),(2147483647,1),(-2147483647,-1),(65535,32768),(32768,-65536),(-1,1),(1,-1),(-32768,65536)]]
 with tempfile.TemporaryDirectory(prefix='original-fix16-math-') as folder:
  folder=Path(folder);cpp=folder/'oracle.cpp';exe=folder/'oracle.exe'
  calls=','.join(name+'(v[0],v[1])' for name in names)
  cpp.write_text('#include <cstdio>\n#include "fix16.h"\nint main(){int pairs[][2]='+json.dumps(pairs).replace('[','{').replace(']','}')+';for(auto&v:pairs)printf("'+','.join(['%d']*len(names))+'\\n",'+calls+');}\n')
  result=subprocess.run(['clang++','-std=c++14','-funsigned-char','-DNOASM','-I'+str(source/'source/build/include'),str(source/'source/build/src/fix16.cpp'),str(cpp),'-o',str(exe)],capture_output=True,text=True)
  assert result.returncode==0,result.stderr
  expected=[[int(n) for n in line.split(',')] for line in subprocess.check_output([str(exe)],text=True).splitlines()]
 probe=r"""async base=>{const {NativeRuntime}=await import('/runtime/index.mjs');const r=new NativeRuntime({renderer:'canvas2d',memoryBytes:16<<20});r.bindSourceMemory();const release=(await import(base+'/browser-abi/libc_provider.mjs')).bindBrowserC(r);try{const layer=await import(base+'/source/build/src/baselayer.cpp.mjs');layer.engineSetupAllocator();const math=await import(base+'/source/build/src/fix16.cpp.mjs');return {results:PAIRS.map(pair=>NAMES.map(name=>math[name](...pair))),gameplay_verified:false};}finally{release();r.close();}}""".replace('PAIRS',json.dumps(pairs)).replace('NAMES',json.dumps(names))
 actual=run_browser_probe(probe)
 assert actual['results']==expected,next(((i,a,b) for i,(a,b) in enumerate(zip(actual['results'],expected)) if a!=b),None)
 report={'original_fix16_arithmetic_verified':True,'original_functions':names,'input_pairs':len(pairs),'native_chromium_values':len(pairs)*len(names),'native_translation_unit_sha256':hashlib.sha256((source/'source/build/src/fix16.cpp').read_bytes()).hexdigest(),'input_sha256':hashlib.sha256(json.dumps(pairs).encode()).hexdigest(),'results_sha256':hashlib.sha256(json.dumps(expected).encode()).hexdigest(),'gameplay_verified':False}
 (ROOT/'reports/nov19-original-fix16-arithmetic.json').write_text(json.dumps(report,indent=2)+'\n')
 print('PASS original fixed-point source:',report['native_chromium_values'],'native/Chromium values across all eight arithmetic/saturation functions')
