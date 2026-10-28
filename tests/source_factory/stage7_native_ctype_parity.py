#!/usr/bin/env python3
"""Compare every unsigned-byte GNU C locale ABI entry with host glibc C locale."""
import json,pathlib,subprocess,tempfile,os
root=pathlib.Path(__file__).resolve().parents[2]
code=r'''
#define _GNU_SOURCE
#include <ctype.h>
#include <stdio.h>
#include <locale.h>
int main(void){setlocale(LC_CTYPE,"C");const unsigned short *b=*__ctype_b_loc();const int *u=*__ctype_toupper_loc();
 for(int i=-1;i<256;i++)printf("%d %u %d\n",i,(unsigned)b[i],u[i]);return 0;}
'''
with tempfile.TemporaryDirectory() as tmp:
 src=pathlib.Path(tmp)/'ctype.c';exe=pathlib.Path(tmp)/'ctype';src.write_text(code)
 subprocess.run(['cc',str(src),'-o',str(exe)],check=True,capture_output=True,text=True)
 native=[tuple(map(int,l.split())) for l in subprocess.check_output([str(exe)],env={**os.environ,'LC_ALL':'C'},text=True).splitlines()]
js=r'''
import {LLVMContext} from './runtime/llvm_context.mjs';
const ctx=new LLVMContext(),h=ctx.heap,s=ctx.libraries,b=Number(h.read(s.__ctype_b_loc(),'u64')),u=Number(h.read(s.__ctype_toupper_loc(),'u64'));
console.log(JSON.stringify(Array.from({length:257},(_,j)=>{const i=j-1;return [i,h.read(b+i*2,'u16'),h.read(u+i*4,'i32')];})));
'''
actual=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=root,text=True))
for a,b in zip(actual,native):
 if tuple(a)!=b:raise AssertionError(f'glibc C locale mismatch: JS {a}, native {b}')
print(f'PASS: {len(native)} classification + {len(native)} toupper native glibc entries')
