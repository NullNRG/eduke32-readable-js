#!/usr/bin/env python3
"""Native parity for exact-size POD union byte copies without overlapping-field proxies."""
import json,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]; SRC='tests/source_factory/source_first_union_copy_fixture.cpp'
def run(args):
    p=subprocess.run(args,cwd=ROOT,capture_output=True,text=True,timeout=90)
    assert p.returncode==0,(args,p.stdout[-2000:],p.stderr[-2000:]);return p.stdout
with tempfile.TemporaryDirectory() as d:
    out=Path(d)
    run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(ROOT),'--source',SRC,'--out-dir',str(out)])
    mod=out/(SRC+'.mjs');data=json.loads(mod.with_suffix('.manifest.json').read_text())
    defs={x['name']:x for x in data['definitions']}
    assert defs['roundtrip_union']['status']=='source-first',defs['roundtrip_union']
    assert defs['pointer_union_must_block']['status']=='blocked',defs['pointer_union_must_block']
    code=mod.read_text();assert '"bytes": 16' in code,code[-2500:]
    run(['node','--check',str(mod)])
    (out/'js.mjs').write_text('import {roundtrip_union} from '+json.dumps(mod.as_uri())+';\n'
        'for(let i=0;i<256;i++){const b=Uint8Array.from({length:16},(_,j)=>(i*13+j*19)&255);console.log([...roundtrip_union(b)].join(","));}\n'
        'try {roundtrip_union(new Uint8Array(15));throw new Error("bounds not enforced");}catch(e){if(!(e instanceof TypeError))throw e;}\n')
    observed=run(['node',str(out/'js.mjs')]).splitlines()
    (out/'main.cpp').write_text('''#include <cstdio>
#include <cstdint>
struct View16 { union { uint8_t bytes[16]; uint16_t half[8]; uint32_t words[4]; } storage; };
extern "C" View16 roundtrip_union(View16);
int main() {for(int i=0;i<256;i++){View16 b{};for(int j=0;j<16;j++)b.storage.bytes[j]=(i*13+j*19)&255;
View16 v=roundtrip_union(b);for(int j=0;j<16;j++)printf("%s%u",j?",":"",(unsigned)v.storage.bytes[j]);puts("");}}
''')
    run(['clang++','-std=c++14',str(ROOT/SRC),str(out/'main.cpp'),'-o',str(out/'native')])
    expected=run([str(out/'native')]).splitlines()
    assert expected==observed,next(((i,a,b) for i,(a,b) in enumerate(zip(expected,observed)) if a!=b),None)
    print('PASS: 256 original native C++/JS overlapping-union byte copies, incorrect sizes and pointer unions rejected')
