"""Native/Chromium parity of the original portable LZ4 decoder; optional canonical owner."""
import ast,hashlib,json,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];profile=json.loads((ROOT/'tools/browser_classic_profile.json').read_text());source=ROOT/profile['prepared_source_root']
canonical='--canonical' in sys.argv
if canonical:
 sys.argv.remove('--canonical')
 assert profile.get('source_defines',{}).get('source/build/src/lz4.c')==['LZ4_FAST_DEC_LOOP=0']
stage=ROOT/'work/original-lz4-decode-native';stage.mkdir(exist_ok=True)
driver=stage/'driver.cpp'
driver.write_text('''#include "lz4.h"
#include <cstdio>
#include <cstdint>
#include <vector>
int main(){const int special[]={0,1,2,3,4,8,12,13,15,16,31,32,255,256,1024,4096};
 for(int n=0;n<128;n++){
 int length=n<16?special[n]:(n*131)%4097;
 unsigned char bytes[4097];uint32_t random=(uint32_t)n+1;
 for(int i=0;i<4097;i++){random^=random<<13;random^=random>>17;random^=random<<5;bytes[i]=n%3==0?0:n%3==1?(unsigned char)(i%17):(unsigned char)random;}
 std::vector<char> packed(LZ4_compressBound(length));
 int compressed=LZ4_compress_default((const char*)bytes,packed.data(),length,(int)packed.size());
 int capacity=n%7==6?length/2:length;
 std::vector<unsigned char> out(capacity+16,0xcc);
 int result=LZ4_decompress_safe(packed.data(),(char*)out.data(),compressed,capacity);
 printf("%d %d %d %d ",length,compressed,capacity,result);
 for(int i=0;i<compressed;i++)printf("%02x",(unsigned char)packed[i]);printf(" ");
 for(unsigned char c:out)printf("%02x",c);printf("\\n");}}
''')
command=['clang++','-std=gnu++14','-funsigned-char','-DLZ4_FAST_DEC_LOOP=0','-I'+str(source/'source/build/include'),'-x','c++',str(source/'source/build/src/lz4.c'),str(driver),'-o',str(stage/'oracle.exe')]
build=subprocess.run(command,cwd=ROOT,capture_output=True,text=True,timeout=120);(stage/'build.log').write_text(build.stdout+'\n'+build.stderr)
if build.returncode:raise SystemExit(build.stderr[-4000:])
result=subprocess.run([stage/'oracle.exe'],capture_output=True,text=True,check=True,timeout=60)
expected=[]
for line in result.stdout.splitlines():
 fields=line.split();expected.append([*[int(v) for v in fields[:4]],fields[4],fields[5]])
assert len(expected)==128
probe=ROOT/'work/verify_original_engine_init.py';tree=ast.parse(probe.read_text())
blocks=[n for n in ast.walk(tree) if isinstance(n,ast.Constant) and isinstance(n.value,str) and 'engineInitialization={original_engineInit_executed:true' in n.value];assert len(blocks)==1
blocks[0].value+='\nconst decodeCases='+json.dumps(expected)+';\n'+r'''
      const decoder=await import('/factory-output/source-first/browser-classic/lz4-portable-diagnostic/source/build/src/lz4.c.mjs');
      for(let n=0;n<decodeCases.length;n++) {
        const [length,compressed,capacity,expectedSize,input,expectedBytes]=decodeCases[n];
        const bytes=Uint8Array.from(input.match(/../g),value=>parseInt(value,16)),output=new Uint8Array(capacity+16).fill(0xcc);
        const size=await enter('original portable LZ4 case '+n,()=>decoder.LZ4_decompress_safe(bytes,output,compressed,capacity));
        const actual=Array.from(output,value=>value.toString(16).padStart(2,'0')).join('');
        if(size!==expectedSize||actual!==expectedBytes)throw Error('Original portable decoder differs at '+n+': '+size+' vs '+expectedSize);
        engineInitialization.original_portable_lz4_decode_cases_verified=n+1;
      }
      engineInitialization.original_portable_lz4_decode_cases=decodeCases.length;
'''
if canonical:
 blocks[0].value=blocks[0].value.replace("'/factory-output/source-first/browser-classic/lz4-portable-diagnostic/source/build/src/lz4.c.mjs'", "base+'/source/build/src/lz4.c.mjs'")
if '--report' not in sys.argv:sys.argv+=['--report','reports/nov12-canonical-lz4-native-parity.json' if canonical else 'reports/nov11-portable-lz4-native-parity.json']
report=ROOT/sys.argv[sys.argv.index('--report')+1]
try:exec(compile(ast.fix_missing_locations(tree),str(probe),'exec'),{'__file__':str(probe),'__name__':'__main__'})
finally:
 if report.is_file():
  doc=json.loads(report.read_text());doc['portable_decoder_reference']={'source_sha256':hashlib.sha256((source/'source/build/src/lz4.c').read_bytes()).hexdigest(),'native_driver_sha256':hashlib.sha256(driver.read_bytes()).hexdigest(),'LZ4_FAST_DEC_LOOP':0,'canonical_profile_changed':canonical,'canonical_owner_tested':canonical,'original_gameplay_verified':False};report.write_text(json.dumps(doc,indent=2)+'\n')
