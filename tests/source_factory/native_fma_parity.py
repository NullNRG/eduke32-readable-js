#!/usr/bin/env python3
"""Validate binary32 and binary64 LLVM fmuladd implementations against libc fmaf/fma."""
from pathlib import Path
import tempfile,subprocess,json,random,sys
root=Path(__file__).resolve().parents[2]
source=r'''#include <stdio.h>
#include <stdint.h>
#include <math.h>
#include <string.h>
int main(){unsigned a,b,c;unsigned long long x,y,z;while(scanf("%x %x %x %llx %llx %llx",&a,&b,&c,&x,&y,&z)==6){
float fa,fb,fc,fr;double da,db,dc,dr;uint32_t r32;uint64_t r64;
memcpy(&fa,&a,4);memcpy(&fb,&b,4);memcpy(&fc,&c,4);
fr=fmaf(fa,fb,fc);memcpy(&r32,&fr,4);
memcpy(&da,&x,8);memcpy(&db,&y,8);memcpy(&dc,&z,8);
dr=fma(da,db,dc);memcpy(&r64,&dr,8);
printf("%08x %016llx\n",r32,(unsigned long long)r64);
}}
'''
rg=random.Random(31415926)
fixed32=[0,0x80000000,0x3f800000,0xbf800000,0x7f800000,0xff800000,0x7fc00000,0x7f7fffff,0x00800000,1,0x007fffff,0x3f800001,0x3f7fffff,0x80000001]
fixed64=[0,0x8000000000000000,0x3ff0000000000000,0xbff0000000000000,0x7ff0000000000000,0xfff0000000000000,0x7ff8000000000000,0x7fefffffffffffff,0x0010000000000000,1,0x000fffffffffffff,0x3ff0000000000001]
rows=[]
for i in range(1400):
    a=[rg.choice(fixed32) if i%3==0 else rg.getrandbits(32) for _ in range(3)]
    b=[rg.choice(fixed64) if i%3==0 else rg.getrandbits(64) for _ in range(3)]
    rows.append(a+b)
with tempfile.TemporaryDirectory() as temp:
    temp=Path(temp)
    (temp/'fma.c').write_text(source)
    subprocess.run(['clang','-O1','-ffp-contract=off',str(temp/'fma.c'),'-lm','-o',str(temp/'native')],check=True)
    encoded=''.join(' '.join((f'{n:08x}' if j<3 else f'{n:016x}') for j,n in enumerate(row))+'\n' for row in rows)
    native=subprocess.run([str(temp/'native')],input=encoded,text=True,capture_output=True,check=True).stdout.splitlines()
    assert len(native)==len(rows)
    (temp/'cases.json').write_text(json.dumps({'rows':[row[:3]+[f'{n:016x}' for n in row[3:]] for row in rows],'expected':[line.split() for line in native]}))
    script=r'''
import fs from 'node:fs';
import {fusedMultiplyAdd} from 'file://REPLACE';
const {rows,expected}=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
const view=new DataView(new ArrayBuffer(8));
const fl32=n=>{view.setUint32(0,n,true);return view.getFloat32(0,true)};
const fl64=n=>{view.setBigUint64(0,BigInt('0x'+n),true);return view.getFloat64(0,true)};
const bin32=n=>{view.setFloat32(0,n,true);return view.getUint32(0,true).toString(16).padStart(8,'0')};
const bin64=n=>{view.setFloat64(0,n,true);return view.getBigUint64(0,true).toString(16).padStart(16,'0')};
let pass=0;
for(let i=0;i<rows.length;i++){
  const [a,b,c,d,e,f]=rows[i];
  const r32=bin32(fusedMultiplyAdd(fl32(a),fl32(b),fl32(c),32));
  const r64=bin64(fusedMultiplyAdd(fl64(d),fl64(e),fl64(f),64));
  const [n32,n64]=expected[i];
  const nan32=h=>(parseInt(h,16)&0x7f800000)===0x7f800000 && (parseInt(h,16)&0x007fffff)!==0;
  const nan64=h=>BigInt('0x'+h)&0x7ff0000000000000n ?
    ((BigInt('0x'+h)&0x7ff0000000000000n)===0x7ff0000000000000n && (BigInt('0x'+h)&0x000fffffffffffffn)!==0n):false;
  if(r32!==n32 && !(nan32(r32)&&nan32(n32)))throw Error(`binary32 mismatch at ${i}: ${r32} != ${n32} ${rows[i]}`);
  if(r64!==n64 && !(nan64(r64)&&nan64(n64)))throw Error(`binary64 mismatch at ${i}: ${r64} != ${n64} ${rows[i]}`);
  pass++;
}
console.log('PASS fusedMultiplyAdd bit-pattern parity, binary32 + binary64:',pass*2,'comparisons');
'''.replace('file://REPLACE',(root/'runtime'/'ieee_fma.mjs').as_uri())
    (temp/'check.mjs').write_text(script)
    check=subprocess.run(['node',str(temp/'check.mjs'),str(temp/'cases.json')],text=True,capture_output=True)
    if check.returncode:
        print(check.stdout,check.stderr,file=sys.stderr)
        sys.exit(check.returncode)
    print(check.stdout.strip())
