"""Compare original LZ4 compression bytes and capacity canaries in Chromium."""
import ast
import hashlib
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
profile = json.loads((ROOT / 'tools/browser_classic_profile.json').read_text())
source = ROOT / profile['prepared_source_root']
stage = ROOT / 'work/original-lz4-native'
stage.mkdir(exist_ok=True)
driver = stage / 'driver.cpp'
driver.write_text('''#include "lz4.h"
#include <cstdio>
#include <cstdint>
#include <vector>
int main(){
 const int special[]={0,1,2,3,4,8,12,13,15,16,31,32,255,256,1024,4096};
 for(int input=0;input<128;input++){
  int length=input<16?special[input]:(input*131)%4097;
  int bound=LZ4_compressBound(length),capacity=input%5==4?bound/3:bound;
  if(capacity<1)capacity=1;
  unsigned char bytes[4097];uint32_t random=(uint32_t)input+1;
  for(int i=0;i<4097;i++){random^=random<<13;random^=random>>17;random^=random<<5;
    bytes[i]=input%3==0?0:input%3==1?(unsigned char)(i%17):(unsigned char)random;}
  std::vector<unsigned char> destination(capacity+16,0xcc);
  int size=LZ4_compress_default((const char*)bytes,(char*)destination.data(),length,capacity);
  printf("%d %d %d %d ",length,bound,capacity,size);
  for(unsigned char value:destination)printf("%02x",(unsigned)value);
  printf("\\n");
 }
}
''')
native = stage / 'oracle.exe'
command = ['clang++', '-std=gnu++14', '-funsigned-char', '-I' + str(source / 'source/build/include'),
           '-x', 'c++', str(source / 'source/build/src/lz4.c'), str(driver), '-o', str(native)]
build = subprocess.run(command, cwd=ROOT, capture_output=True, text=True, timeout=120)
(stage / 'build.log').write_text(build.stdout + '\n' + build.stderr)
if build.returncode:
    raise SystemExit(build.stderr[-4000:])
result = subprocess.run([str(native)], capture_output=True, text=True, check=True, timeout=60)
expected = []
for line in result.stdout.splitlines():
    fields = line.split()
    expected.append([*[int(value) for value in fields[:4]], fields[4]])
assert len(expected) == 128
probe = ROOT / 'work/verify_original_engine_init.py'
tree = ast.parse(probe.read_text())
scripts = [node for node in ast.walk(tree) if isinstance(node, ast.Constant)
           and isinstance(node.value, str) and 'engineInitialization={original_engineInit_executed:true' in node.value]
assert len(scripts) == 1
scripts[0].value += '\nconst nativeCompressionCases=' + json.dumps(expected) + ';\n' + r'''
      const compressor=await import(base+'/source/build/src/lz4.c.mjs');
      let failedCapacityCases=0;
      for(let input=0;input<nativeCompressionCases.length;input++) {
        const [length,bound,capacity,expectedSize,expectedBytes]=nativeCompressionCases[input];
        const bytes=new Uint8Array(4097);let random=(input+1)>>>0;
        for(let i=0;i<bytes.length;i++) {
          random^=random<<13;random^=random>>>17;random^=random<<5;random>>>=0;
          bytes[i]=input%3===0?0:input%3===1?i%17:random&255;
        }
        const destination=new Uint8Array(capacity+16).fill(0xcc);
        if(compressor.LZ4_compressBound(length)!==bound)throw Error('Original LZ4 bound differs at '+input);
        const size=compressor.LZ4_compress_default(bytes,destination,length,capacity);
        const actual=Array.from(destination,value=>value.toString(16).padStart(2,'0')).join('');
        if(size!==expectedSize||actual!==expectedBytes)throw Error('Original LZ4 compressed bytes/canaries differ at '+input+': '+size+' vs '+expectedSize);
        if(size===0)failedCapacityCases++;
        engineInitialization.original_lz4_compression_native_cases_verified=input+1;
      }
      engineInitialization.original_lz4_compression_native_cases=nativeCompressionCases.length;
      engineInitialization.original_lz4_insufficient_capacity_cases=failedCapacityCases;
'''
if '--report' not in sys.argv:
    sys.argv += ['--report', 'reports/nov10-original-lz4-compression-parity.json']
report = ROOT / sys.argv[sys.argv.index('--report') + 1]
try:
    exec(compile(ast.fix_missing_locations(tree), str(probe), 'exec'),
         {'__file__': str(probe), '__name__': '__main__'})
finally:
    if report.is_file():
        document = json.loads(report.read_text())
        original = source / 'source/build/src/lz4.c'
        document['original_compression_native_reference'] = {
            'source': original.relative_to(ROOT).as_posix(),
            'source_sha256': hashlib.sha256(original.read_bytes()).hexdigest(),
            'driver_sha256': hashlib.sha256(driver.read_bytes()).hexdigest(),
            'cases': len(expected), 'all_destination_bytes_and_canaries_compared':
                document.get('engine_initialization', {}).get('original_lz4_compression_native_cases_verified') == len(expected),
            'gameplay_verified': False}
        report.write_text(json.dumps(document, indent=2) + '\n')
