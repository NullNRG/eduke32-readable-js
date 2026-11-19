"""Compare the linked original integer-to-16.16 conversion in Chromium and C++."""
import hashlib,json,subprocess,tempfile
from pathlib import Path
from verify_original_demo_snapshot_heap import ROOT,run_browser_probe
if __name__=='__main__':
 profile=json.loads((ROOT/'tools/browser_classic_profile.json').read_text());source=ROOT/profile['prepared_source_root']
 module=ROOT/profile['boot_module_root']/'source/duke3d/src/gameexec.cpp.mjs'
 doc=json.loads(module.with_suffix('.manifest.json').read_text());rows=[r for r in doc['definitions'] if r.get('source_name')=='fix16_from_int' and r.get('status')=='source-first']
 assert len(rows)==1,rows
 row=rows[0];assert row['original_header_function']['source_header']=='source/build/include/fix16.h',row
 inputs=list(range(-32768,32768,127))+[0,32767]
 with tempfile.TemporaryDirectory(prefix='original-fix16-') as folder:
  folder=Path(folder);cpp=folder/'oracle.cpp';exe=folder/'oracle.exe'
  cpp.write_text('#include <cstdio>\n#include "fix16.h"\nint main(){int inputs[]={'+','.join(map(str,inputs))+'};for(int n:inputs)printf("%d\\n",fix16_from_int(n));}\n')
  compiled=subprocess.run(['clang++','-std=c++14','-funsigned-char','-DNOASM','-I'+str(source/'source/build/include'),str(cpp),'-o',str(exe)],capture_output=True,text=True)
  assert compiled.returncode==0,compiled.stderr
  expected=[int(line) for line in subprocess.check_output([str(exe)],text=True).splitlines()]
 probe=r"""async base=>{const {NativeRuntime}=await import('/runtime/index.mjs');const r=new NativeRuntime({renderer:'canvas2d',memoryBytes:16<<20});r.bindSourceMemory();const release=(await import(base+'/browser-abi/libc_provider.mjs')).bindBrowserC(r);try{const layer=await import(base+'/source/build/src/baselayer.cpp.mjs');layer.engineSetupAllocator();const game=await import(base+'/source/duke3d/src/gameexec.cpp.mjs');return {results:INPUTS.map(n=>game[BINDING](n)),fix16_one:game.fix16_one,gameplay_verified:false};}finally{release();r.close();}}""".replace('INPUTS',json.dumps(inputs)).replace('BINDING',json.dumps(row['name']))
 actual=run_browser_probe(probe);assert actual['results']==expected,(actual['results'][:5],expected[:5]);assert actual['fix16_one']==65536,actual
 report={'original_fix16_from_int_verified':True,'native_chromium_cases':len(inputs),'binding':row['name'],'original_header_sha256':hashlib.sha256((source/'source/build/include/fix16.h').read_bytes()).hexdigest(),'owner_module_sha256':hashlib.sha256(module.read_bytes()).hexdigest(),**actual}
 (ROOT/'reports/nov19-original-fix16-integer-conversion.json').write_text(json.dumps(report,indent=2)+'\n')
 print('PASS original fix16_from_int matches native C++ in',len(inputs),'Chromium cases')
