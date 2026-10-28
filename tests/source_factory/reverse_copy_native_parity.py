#!/usr/bin/env python3
"""Compare original x86 inline-assembly reverse-copy semantics against JS lowering."""
import json,pathlib,subprocess,sys,tempfile
ROOT=pathlib.Path(__file__).resolve().parents[2]
c_source=r'''
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>

static void native_reverse(uint8_t *source, uint8_t *dest, unsigned count) {
#if !defined(__x86_64__)
#error "x86_64 required for native parity test"
#endif
    __asm__ volatile (
      "shrl $1, %%ecx\n\t"
      "jnc 0f\n\t"
      "movb (%%rsi), %%al\n\t"
      "dec %%rsi\n\t"
      "movb %%al, (%%rdi)\n\t"
      "inc %%rdi\n\t"
      "0:\n\t"
      "shrl $1, %%ecx\n\t"
      "jnc 1f\n\t"
      "movw -1(%%rsi), %%ax\n\t"
      "sub $2, %%rsi\n\t"
      "rorw $8, %%ax\n\t"
      "movw %%ax, (%%rdi)\n\t"
      "add $2, %%rdi\n\t"
      "1:\n\t"
      "testl %%ecx, %%ecx\n\t"
      "jz 3f\n\t"
      "2:\n\t"
      "movl -3(%%rsi), %%eax\n\t"
      "sub $4, %%rsi\n\t"
      "bswapl %%eax\n\t"
      "movl %%eax, (%%rdi)\n\t"
      "add $4, %%rdi\n\t"
      "decl %%ecx\n\t"
      "jnz 2b\n\t"
      "3:"
      : "+S" (source), "+D" (dest), "+c" (count)
      :
      : "eax", "memory", "cc");
}
int main(int argc,char **argv){
    if(argc!=4)return 1;
    unsigned char memory[128];
    for(int i=0;i<128;i++)memory[i]=(unsigned char)i;
    int src=atoi(argv[1]),dest=atoi(argv[2]),n=atoi(argv[3]);
    native_reverse(memory+src,memory+dest,(unsigned)n);
    for(int i=0;i<128;i++)printf("%02x",memory[i]);
    putchar('\n');return 0;
}
'''
scenarios=[(95,6,0),(95,6,1),(95,6,2),(95,6,3),(95,6,4),(95,6,7),(95,6,13),(95,6,31),
           (52,45,7),(60,55,8),(90,80,10),(32,30,14)]
with tempfile.TemporaryDirectory(dir=ROOT/'tests') as tmp:
 tmp=pathlib.Path(tmp);src=tmp/'copy.c';bin=tmp/'copy';src.write_text(c_source)
 cmd=['gcc','-O0','-o',str(bin),str(src)];result=subprocess.run(cmd,capture_output=True,text=True)
 if result.returncode:raise RuntimeError('native assembly compilation failed: '+result.stderr)
 expected=[]
 for a,b,n in scenarios:
  res=subprocess.run([str(bin),str(a),str(b),str(n)],capture_output=True,text=True)
  if res.returncode:raise RuntimeError(res.stderr)
  expected.append(res.stdout.strip())
 node='''import assert from 'node:assert/strict';
import {LLVMContext} from '''+json.dumps((ROOT/'runtime/llvm_context.mjs').as_uri())+''';
const inputs='''+json.dumps(scenarios)+''';const expected='''+json.dumps(expected)+''';
for(let i=0;i<inputs.length;i++){
 const [src,dst,count]=inputs[i];
 const ctx=new LLVMContext();const base=ctx.heap.malloc(128);
 for(let b=0;b<128;b++)ctx.heap.u8[base+b]=b;
 const result=ctx.x86ReverseCopy(base+src,base+dst,count);
 assert.deepEqual(result,[base+src-count,base+dst+count,0]);
 const actual=Buffer.from(ctx.heap.u8.subarray(base,base+128)).toString('hex');
 assert.equal(actual,expected[i],'native x86 reverse-copy mismatch at case '+i);
}
console.log('PASS '+inputs.length+' native x86 assembly vs JavaScript reverse-copy parity cases');'''
 f=tmp/'check.mjs';f.write_text(node)
 res=subprocess.run(['node',str(f)],capture_output=True,text=True)
 if res.returncode:raise RuntimeError(res.stderr)
 print(res.stdout.strip())
