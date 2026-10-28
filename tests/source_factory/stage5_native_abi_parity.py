#!/usr/bin/env python3
"""Compare native x86 CPUID registers and 80-bit long-double ABI bytes.

Valid only when compiler/host support x86-64 long double. No CPU emulation.
"""
import pathlib,subprocess,tempfile,platform,json
ROOT=pathlib.Path(__file__).resolve().parents[2]
C=r'''
#include <stdio.h>
#include <string.h>
#include <stdarg.h>
#include <stdint.h>
#include <cpuid.h>
static void dump(const char *name, int token, ...) {
    va_list a;va_start(a,token);
    long double first=va_arg(a,long double);
    int middle=va_arg(a,int);
    long double last=va_arg(a,long double);
    va_end(a);
    printf("%s:%d:",name,middle);
    for(int i=0;i<10;i++)printf("%02x",((unsigned char*)&first)[i]);
    printf(":");for(int i=0;i<10;i++)printf("%02x",((unsigned char*)&last)[i]);
    puts("");
}
int main(void){
    if(sizeof(long double)!=16)return 2;
    unsigned a,b,c,d;
    __cpuid(0,a,b,c,d);
    printf("CPUID:%u:%u:%u:%u\n",a,b,c,d);
    dump("EXTENDED",17,1.0L,99,-0.0L);
    dump("FRACTION",17,1.0L/3.0L,99,-1.0L/3.0L);
    return 0;
}
'''
JS=r'''
import assert from 'node:assert/strict';
import {LLVMContext} from './runtime/llvm_context.mjs';
const native=JSON.parse(process.argv[2]);
const regs=native[0].split(':').slice(1).map(Number);
const cpuid=new LLVMContext({cpuidProvider:(leaf,subleaf)=>{
  assert.equal(leaf,0);assert.equal(subleaf,0);return regs;
}});
assert.deepEqual(cpuid.x86CPUID(0).map(x=>x>>>0),regs);
for(const line of native.slice(1)){
  const [name,middle,first,last]=line.split(':');
  const toBytes=h=>Uint8Array.from(h.match(/../g).map(x=>parseInt(x,16)));
  const ctx=new LLVMContext(),frame=ctx.createVaFrame(['i32'],[17],
    [toBytes(first),Number(middle),toBytes(last)],['x86_fp80','i32','x86_fp80']);
  const p=frame.overflowPtr;
  assert.equal(p%16,0);
  assert.equal(frame.gpOffset,8);
  assert.equal(ctx.heap.read(frame.registerPtr+8,'i64'),99n);
  assert.deepEqual(ctx.heap.bytes(p,10),toBytes(first));
  assert.deepEqual(ctx.heap.bytes(p+16,10),toBytes(last));
  assert.deepEqual(ctx.heap.bytes(p+10,6),new Uint8Array(6));
}
console.log('PASS native CPU registers and native long-double 80-bit varargs bytes:',native.length);
'''
def main():
    if platform.machine().lower() not in ('x86_64','amd64'):
        print('SKIP x86-64 native ABI parity: non-x86 host');return
    with tempfile.TemporaryDirectory() as folder:
        folder=pathlib.Path(folder)
        (folder/'test.c').write_text(C)
        subprocess.run(['clang','-O1','-std=c11',str(folder/'test.c'),'-o',str(folder/'test')],check=True,capture_output=True)
        rows=subprocess.check_output([str(folder/'test')],text=True).splitlines()
        (ROOT/'stage5-native-test.mjs').write_text(JS)
        try:
            print(subprocess.check_output(['node','stage5-native-test.mjs',json.dumps(rows)],cwd=ROOT,text=True).strip())
        finally:(ROOT/'stage5-native-test.mjs').unlink(missing_ok=True)
if __name__=='__main__':main()
