from pathlib import Path
import hashlib,json,subprocess,os
root=Path(__file__).resolve().parents[1]
source=root/'factory-output/source-tree/eduke32-master'
out=root/'factory-output/source-first/oct15-header-providers'
module=out/'source/build/include/clockticks.hpp.mjs'
manifest=json.loads(module.with_suffix('.manifest.json').read_text())
assert manifest['blocked']==0 and manifest['imports']==[]
work=root/'work/clock-header-provider-parity';work.mkdir(exist_ok=True)
def run(args):
 p=subprocess.run(args,cwd=root,capture_output=True,text=True,timeout=120)
 assert p.returncode==0,(args,p.stdout[-1000:],p.stderr[-3000:])
 return p.stdout.splitlines()
(work/'main.cpp').write_text('''#include "compat.h"
#include "clockticks.hpp"
#include <cstdio>
int main(){for(int a=-25;a<=25;a++)for(int b=-8;b<=8;b++){
ClockTicks x(a,(a+26)*37),y(b,(b+8)*17);ClockTicks z=x-y;
printf("%lld,%lld,%d\\n",(long long)z.toScale16(),(long long)z.getFraction(),(int)z);}}
''')
exe=work/('native.exe' if os.name=='nt' else 'native')
includes=['-I'+str(source/part) for part in ('source/build/include','source/mact/include','source/audiolib/include','source/glad/include','source/voidwrap/include','source/imgui/include','source/mimalloc/include')]
run(['clang++','-std=gnu++14','-funsigned-char','-DNOASM',*includes,str(work/'main.cpp'),'-o',str(exe)])
expected=run([str(exe)])
ctor='__cxx_construct_'+hashlib.sha256(b'void (const int32_t, const uint32_t)').hexdigest()[:16]
conv='__cxx_conversion_'+hashlib.sha256(b'operator int\x00int32_t () const').hexdigest()[:16]
operator=next(row['name'] for row in manifest['definitions'] if row['source_name']=='operator-' and row['original_type']=='ClockTicks (ClockTicks, const ClockTicks &)')
(work/'run.mjs').write_text('import {ClockTicks,'+operator+'} from '+json.dumps(module.as_uri())+';\n'
 +'const Clock = '+('ClockTicks()' if next(r for r in manifest['definitions'] if r['name']=='ClockTicks').get('header_record_factory') else 'ClockTicks')+';\n'
 +'for(let a=-25;a<=25;a++)for(let b=-8;b<=8;b++){\n'
 +'const x=Clock.'+ctor+'(a,(a+26)*37),y=Clock.'+ctor+'(b,(b+8)*17);\n'
 +'const z='+operator+'(x,y);console.log(`${z.toScale16()},${z.getFraction()},${z.'+conv+'()}`);}\n')
actual=run(['node',str(work/'run.mjs')]);assert len(actual)==867 and actual==expected
report={'passed':True,'cases':867,'native_js_values':2601,'source':'source/build/include/clockticks.hpp','original_header_sha256':hashlib.sha256((source/'source/build/include/clockticks.hpp').read_bytes()).hexdigest(),'generated_module_sha256':hashlib.sha256(module.read_bytes()).hexdigest(),'manifest_sha256':hashlib.sha256(module.with_suffix('.manifest.json').read_bytes()).hexdigest(),'zero_missing_source_definitions':True,'zero_imports':True,'gameplay_verified':False}
(root/'reports/oct15-clock-header-provider-parity.json').write_text(json.dumps(report,indent=2)+'\n')
print('PASS: original standalone ClockTicks header provider; 867 cases / 2601 native-JS values; no missing definitions or imports')
