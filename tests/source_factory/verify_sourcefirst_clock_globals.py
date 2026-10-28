"""Native parity of the actual engine TU's source-generated clock globals."""
from pathlib import Path
import hashlib,json,os,subprocess,sys,tempfile
ROOT=Path(__file__).resolve().parents[2]
SOURCE=ROOT/'factory-output/source-tree/eduke32-master'
def run(args):
    p=subprocess.run(args,cwd=ROOT,capture_output=True,text=True,timeout=120)
    assert p.returncode==0,(p.stdout[-1000:],p.stderr[-2500:])
    return p.stdout.splitlines()
with tempfile.TemporaryDirectory(prefix='eduke-original-clock-globals-') as scratch:
    work=Path(scratch)
    output=work/'out'
    run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(SOURCE),'--source','source/build/src/engine.cpp','--filter','totalclock','--header-dependency-closure','--out-dir',str(output)])
    MODULE=output/'source/build/src/engine.cpp.mjs'
    header=SOURCE/'source/build/include/build.h'
    original=next(line for line in header.read_text().splitlines() if line.strip()=='EXTERN ClockTicks totalclock, totalclocklock;')
    (work/'main.cpp').write_text('#include "compat.h"\n#include "clockticks.hpp"\n#include <cstdio>\n#define EXTERN\n'+original+'''
    int main(){printf("%lld,%lld\\n",(long long)totalclock.toScale16(),(long long)totalclocklock.toScale16());
    for(int i=-256;i<256;i++){totalclock.setFromScale16((int64_t)i*101);
    totalclocklock.setFromScale16(totalclock.toScale16()+7);
    printf("%lld,%lld\\n",(long long)totalclock.toScale16(),(long long)totalclocklock.toScale16());}}
    ''')
    exe=work/('native.exe' if os.name=='nt' else 'native')
    run(['clang++','-std=gnu++14','-funsigned-char','-DNOASM','-I'+str(SOURCE/'source/build/include'),str(work/'main.cpp'),'-o',str(exe)])
    expected=run([str(exe)])
    (work/'run.mjs').write_text('import {totalclock,totalclocklock} from '+json.dumps(MODULE.as_uri())+''';
    console.log(`${totalclock.toScale16()},${totalclocklock.toScale16()}`);
    for(let i=-256;i<256;i++){totalclock.setFromScale16(BigInt(i)*101n);
    totalclocklock.setFromScale16(totalclock.toScale16()+7n);
    console.log(`${totalclock.toScale16()},${totalclocklock.toScale16()}`);}
    ''')
    actual=run(['node',str(work/'run.mjs')]);assert actual==expected,(actual[:3],expected[:3])
    result={'passed':True,'native_js_values':1026,'original_declaration':original,
        'original_header_sha256':hashlib.sha256(header.read_bytes()).hexdigest(),
        'source_translation_unit':'source/build/src/engine.cpp',
        'module_sha256':hashlib.sha256(MODULE.read_bytes()).hexdigest(),
        'compiler_sha256':hashlib.sha256((ROOT/'tools/source_ast_to_js.py').read_bytes()).hexdigest(),
        'checks':['original source clock global dynamic initialization','independent original clock storage',
                  'source-authored header methods'],'gameplay_verified':False}
    (ROOT/'reports/oct15-original-clock-globals-parity.json').write_text(json.dumps(result,indent=2)+'\n')
    print('PASS: 1026 native/JavaScript values through actual engine-TU clock global constructors and methods')
