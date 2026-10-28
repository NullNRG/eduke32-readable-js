#!/usr/bin/env python3
"""Original EDuke32 clockticks.hpp native-versus-generated JS boot dependency.

Uses the ACTUAL original header and Clang source AST, not a hand-rewritten
clock implementation. This does not claim that the game can start.
"""
import hashlib, json, subprocess, sys, tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
SOURCE=ROOT/'factory-output/source-tree/eduke32-master'
GAME='source/duke3d/src/game.cpp'
def run(argv, cwd=ROOT, timeout=120):
    p=subprocess.run(argv,cwd=cwd,capture_output=True,text=True,timeout=timeout)
    assert p.returncode==0,(argv,p.stdout[-900:],p.stderr[-1800:]);return p.stdout
with tempfile.TemporaryDirectory(prefix='eduke_original_clockticks_') as tmp:
    tmp=Path(tmp)
    output=tmp/'output'
    run([sys.executable,'tools/source_ast_to_js.py','--root',str(SOURCE),
         '--source',GAME,'--filter','app_main','--enum-closure','--dependency-closure',
         '--out-dir',str(output)])
    module=output/(GAME+'.mjs')
    manifest=json.loads(module.with_suffix('.manifest.json').read_text())
    originals={r['name']:r for r in manifest['definitions'] if r['status']=='source-first'}
    assert 'ClockTicks' in originals,manifest['definitions']
    operations=[d for d in originals.values() if d['source_name']=='operator-' and
                d['original_type']=='ClockTicks (ClockTicks, const ClockTicks &)']
    assert len(operations)==1,manifest['definitions']
    assert manifest['enum_closure']['proven_values'].get('controltype_keyboardandmouse')==1
    app=next(d for d in manifest['definitions'] if d['source_name']=='app_main')
    assert app['status']=='blocked' and app['reason'].startswith('unlinked identifiers:'),app
    run(['node','--check',str(module)])
    cpp=tmp/'native.cpp'
    cpp.write_text('''#include "compat.h"
#include "clockticks.hpp"
#include <cstdio>
int main(){for(int a=-25;a<=25;a++)for(int b=-8;b<=8;b++){
    ClockTicks x(a,(a+26)*37),y(b,(b+8)*17);
    ClockTicks z=x-y;
    std::printf("%lld,%lld,%d\\n",(long long)z.toScale16(),(long long)z.getFraction(),(int32_t)z);
}}
''')
    executable=tmp/'native'
    includes=[str(SOURCE/part) for part in ('source/build/include','source/mact/include',
               'source/audiolib/include','source/glad/include','source/voidwrap/include',
               'source/imgui/include','source/mimalloc/include')]
    run(['clang++','-std=gnu++14','-funsigned-char','-DNOASM',
         *[flag for i in includes for flag in ('-I',i)],str(cpp),'-o',str(executable)])
    expected=run([str(executable)]).splitlines()
    assert len(expected)==867,len(expected)
    ctor='__cxx_construct_'+hashlib.sha256(b'void (const int32_t, const uint32_t)').hexdigest()[:16]
    conv='__cxx_conversion_'+hashlib.sha256(b'operator int\x00int32_t () const').hexdigest()[:16]
    op=operations[0]['name']
    driver=tmp/'driver.mjs'
    driver.write_text('import {ClockTicks,'+op+'} from '+json.dumps(module.as_uri())+';\n'
      +'const Clock = '+('ClockTicks()' if originals['ClockTicks'].get('header_record_factory') else 'ClockTicks')+';\n'
      +'for(let a=-25;a<=25;a++)for(let b=-8;b<=8;b++){\n'
      +'const x=Clock.'+ctor+'(a,(a+26)*37),y=Clock.'+ctor+'(b,(b+8)*17);\n'
      +'const z='+op+'(x,y);\n'
      +'console.log(`${z.toScale16()},${z.getFraction()},${z.'+conv+'()}`);\n}\n')
    observed=run(['node',str(driver)]).splitlines()
    assert observed==expected,[(i,a,b) for i,(a,b) in enumerate(zip(expected,observed)) if a!=b][:15]
print('PASS: 867 native original EDuke32 ClockTicks vs generated JavaScript cases; original app_main syntax lowered, unresolved engine dependencies remain blocked')
