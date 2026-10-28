#!/usr/bin/env python3
"""Native C++ against JS: bounded libc builtins, integer builtins, declaration-only statements."""
from pathlib import Path
import tempfile, subprocess, sys, json
ROOT=Path(__file__).resolve().parents[2]

def run(cmd,cwd,timeout=80):
    p=subprocess.run(cmd,cwd=cwd,capture_output=True,text=True,timeout=timeout)
    assert p.returncode==0, (cmd,p.stdout[-1200:],p.stderr[-2000:])
    return p.stdout

with tempfile.TemporaryDirectory(prefix='eduke-bulk-mem-') as tmp:
    d=Path(tmp)
    (d/'source.cpp').write_text((ROOT/'tests/source_factory/source_first_bulk_memory_fixture.cpp').read_text())
    (d/'driver.cpp').write_text(r'''#include <cstdio>
#include <stdint.h>
extern "C" int native_copy(uint8_t*,const uint8_t*,unsigned);
extern "C" int native_move(uint8_t*,const uint8_t*,unsigned);
extern "C" int native_fill(uint8_t*,int,unsigned);
extern "C" int native_compare(const uint8_t*,const uint8_t*,unsigned);
extern "C" int native_bits(unsigned);
extern "C" int native_bits64(uint64_t);
extern "C" int native_typedef_decls(int);
int main(){for(int i=0;i<256;i++){
 uint8_t a[16], b[16];for(int j=0;j<16;j++){a[j]=(i*13+j*7)&255;b[j]=(i+j*13)&255;}
 int cmp=native_compare(a,b,16);native_copy(a,b,16);
 native_move(b+3,b,10);native_fill(a+4,i,6);
 unsigned v=(unsigned)i*0x45d9f3bu;
 unsigned long long wide=0x8000000000000000ull+(unsigned)i;
 unsigned checksum=0;for(int j=0;j<16;j++)checksum+=a[j]+b[j]*3;
 printf("%u,%d,%d,%d,%d\n",checksum,cmp<0?-1:cmp>0?1:0,native_bits(v),native_bits64(wide),native_typedef_decls(i));
}}
''')
    run(['clang++','-std=c++17','source.cpp','driver.cpp','-o','native'],d)
    expected=run([str(d/'native')],d).splitlines()
    dest=d/'output'
    run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(d),'--source','source.cpp','--out-dir',str(dest)],d)
    module=dest/'source.cpp.mjs'
    manifest=json.loads(module.with_suffix('.manifest.json').read_text())
    bad=[(x['name'],x.get('reason')) for x in manifest['definitions'] if x['status']!='source-first']
    assert not bad, bad
    assert 'cByteMemory.' in module.read_text()
    run(['node','--check',str(module)],d)
    (d/'run.mjs').write_text(r'''import {native_copy,native_move,native_fill,native_compare,native_bits,native_bits64,native_typedef_decls} from './output/source.cpp.mjs';
for(let i=0;i<256;i++){
 const a=Uint8Array.from({length:16},(_,j)=>(i*13+j*7)&255);
 const b=Uint8Array.from({length:16},(_,j)=>(i+j*13)&255);
 const cmp=native_compare(a,b,16);
 native_copy(a,b,16);
 const ptr={__cPointer:true,array:false,buffer:b.buffer,lower:b.byteOffset,upper:b.byteOffset+b.byteLength,offset:b.byteOffset+3};
 native_move(ptr,b,10);
 const ptra={__cPointer:true,array:false,buffer:a.buffer,lower:a.byteOffset,upper:a.byteOffset+a.byteLength,offset:a.byteOffset+4};
 native_fill(ptra,i,6);
 let checksum=0;for(let j=0;j<16;j++)checksum+=a[j]+b[j]*3;
 const v=Math.imul(i,0x45d9f3b)>>>0;
 const wide=0x8000000000000000n+BigInt(i);
 console.log(`${checksum},${Math.sign(cmp)},${native_bits(v)},${native_bits64(wide)},${native_typedef_decls(i)}`);
}
''')
    actual=run(['node','run.mjs'],d).splitlines()
    assert actual==expected,next(((i,a,b) for i,(a,b) in enumerate(zip(actual,expected)) if a!=b),('different lengths',len(actual),len(expected)))
    (d/'reject.mjs').write_text(r'''import {native_copy,native_move,native_fill} from './output/source.cpp.mjs';
const assert=(fun,why)=>{try{fun();throw new Error('accepted invalid '+why)}catch(e){if(e.message.startsWith('accepted invalid'))throw e;}};
const b=new Uint8Array(9);
assert(()=>native_copy(b.subarray(1),b,6),'overlap memcpy');
assert(()=>native_copy(b,b,10),'out of bounds');
assert(()=>native_move([1,2,3],b,2),'numeric array alias');
assert(()=>native_fill(b,17,-1),'negative count');
console.log('PASS rejects unsafe byte operations');
''')
    assert 'PASS rejects' in run(['node','reject.mjs'],d)
    print('PASS 256 native C++/JS rows × 5 outputs = 1,280 comparisons; memory safety rejections')
