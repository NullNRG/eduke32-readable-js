"""Native original GenericAllocator snapshots and emitted GetUsableSpace parity."""
import hashlib,json,os,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
original=ROOT/'factory-output/browser-classic/source-tree/eduke32-master'
module=ROOT/'factory-output/source-first/oct29-browser-generic-allocator/source/build/src/smmalloc_generic.cpp.mjs'
manifest=json.loads(module.with_suffix('.manifest.json').read_text())
methods={r['source_name']:r for r in manifest['definitions'] if r.get('original_static_member')}
assert methods['Alloc']['status']=='blocked' and 'address-space' in methods['Alloc']['reason']
assert methods['GetUsableSpace']['status']=='source-first'
def run(args,cwd):
 r=subprocess.run(args,cwd=cwd,capture_output=True,text=True,timeout=120)
 if r.returncode:raise RuntimeError(r.stdout[-1500:]+'\n'+r.stderr[-5000:])
 return r.stdout.strip()
with tempfile.TemporaryDirectory(prefix='original-generic-allocator-') as temporary:
 directory=Path(temporary)
 driver=directory/'oracle.cpp'
 driver.write_text('#include <cstdio>\n#include <cstddef>\n#include <cstdlib>\n#include '+json.dumps((original/'source/build/src/smmalloc_generic.cpp').as_posix())+r'''
int main(){auto instance=sm::GenericAllocator::Create();
 for(unsigned i=0;i<256;i++){
  size_t n=(i*37)%4097,alignment=size_t(1)<<(3+i%5);
  void*p=sm::GenericAllocator::Alloc(instance,n,alignment);
  if(!p)return 2;
  auto*h=reinterpret_cast<Header*>(reinterpret_cast<char*>(p)-sizeof(Header));
  printf("%zu,%zu,",sizeof(Header),sm::GenericAllocator::GetUsableSpace(instance,p));
  for(size_t b=0;b<sizeof(Header);b++)printf("%02x",reinterpret_cast<unsigned char*>(h)[b]);
  puts("");sm::GenericAllocator::Free(instance,p);
 }
 sm::GenericAllocator::Destroy(instance);
}
''')
 executable=directory/'oracle.exe'
 flags=['-funsigned-char','-std=gnu++14','-DNOASM','-DNDEBUG','-DSDL_TARGET=2','-DRENDERTYPESDL=1','-DNETCODE_DISABLE']
 flags+=['-I'+str(original/p) for p in ('source/build/include','source/audiolib/include','platform/Windows/include','platform/Windows/include/SDL2')]
 run(['clang++',*flags,str(driver),'-o',str(executable)],ROOT)
 lines=run([str(executable)],directory).splitlines()
 snapshots=[{'bytes':int(s),'expected':int(n),'hex':h} for s,n,h in (line.split(',') for line in lines)]
 get=methods['GetUsableSpace']['name'];invalid=methods['Invalid']['name'];create=methods['Create']['name'];valid=methods['IsValid']['name'];destroy=methods['Destroy']['name']
 runner=directory/'run.mjs'
 runner.write_text('import * as m from '+json.dumps(module.as_uri())+';\nconst samples='+json.dumps(snapshots)+';\n'
  +f'if(m.{invalid}()!==null||m.{create}()!==null||m.{valid}(null)!==true)throw Error("Original allocator service mismatch");m.{destroy}(null);\n'
  +'for(const sample of samples){const bytes=Uint8Array.from(sample.hex.match(/../g),x=>parseInt(x,16));const pointer={__cPointer:true,buffer:bytes.buffer,lower:0,upper:bytes.length,offset:bytes.length,array:false};'
  +f'const value=m.{get}(null,pointer);if(value!==BigInt(sample.expected))throw Error("Original header lookup mismatch");}}\n'
  +'console.log("PASS native snapshots");\n')
 result=run(['node',str(runner)],directory)
 report={'format':'original-generic-allocator-header-native-parity/1','passed':True,'native_snapshots':len(snapshots),
  'source_file':'source/build/src/smmalloc_generic.cpp','source_sha256':hashlib.sha256((original/'source/build/src/smmalloc_generic.cpp').read_bytes()).hexdigest(),
  'module_sha256':hashlib.sha256(module.read_bytes()).hexdigest(),'native_original_alloc_free_executed':True,
  'javascript_original_header_lookup_compared':True,'javascript_original_full_allocation_verified':False,
  'address_conversion_still_blocked':True,'gameplay_verified':False}
 (ROOT/'reports/oct29-original-generic-allocator-parity.json').write_text(json.dumps(report,indent=2)+'\n')
 print(result);print(json.dumps(report,indent=2))
