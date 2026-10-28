#!/usr/bin/env python3
"""Native libc parity for signed/unsigned 64-bit C numeric parsing and C23 0b."""
import subprocess,sys,tempfile,pathlib,json
ROOT=pathlib.Path(__file__).resolve().parents[2]
C=r'''
#include <stdio.h>
#include <stdlib.h>
#include <errno.h>
extern long __isoc23_strtol(const char *, char **, int);
extern unsigned long __isoc23_strtoul(const char *, char **, int);
int main(void){
 const char *values[]={"  -0x1F tail","0b101","+","0x","09","-0","0777","0XAF","0x1G","9223372036854775807","9223372036854775808","-9223372036854775809","18446744073709551615","18446744073709551616","-1","--2","-0b111"};
 for(int mode=0;mode<4;mode++)for(int j=0;j<17;j++){
    const char *t=values[j];char *end=0;errno=0;
    unsigned long long x=mode==0?(unsigned long long)strtol(t,&end,0):
       mode==1?(unsigned long long)strtoul(t,&end,0):
       mode==2?(unsigned long long)__isoc23_strtol(t,&end,0):
       (unsigned long long)__isoc23_strtoul(t,&end,0);
    printf("%d:%d:%llu:%ld:%d\n",mode,j,x,(long)(end-t),errno);
 }
}
'''
JS=r'''
import assert from 'node:assert/strict';
import {LLVMContext} from './runtime/llvm_context.mjs';
const native=JSON.parse(process.argv[2]);
const values=['  -0x1F tail','0b101','+','0x','09','-0','0777','0XAF','0x1G','9223372036854775807','9223372036854775808','-9223372036854775809','18446744073709551615','18446744073709551616','-1','--2','-0b111'];
const names=['strtol','strtoul','__isoc23_strtol','__isoc23_strtoul'];
for(const line of native){
 const [modeText,jText,value,endText,errnoText]=line.split(':');
 const [mode,j,endIndex,errno]=[modeText,jText,endText,errnoText].map(Number);
 const ctx=new LLVMContext(),h=ctx.heap,c=ctx.libraries;
 const ptr=h.writeCString(values[j]),end=h.malloc(8),err=c.__errno_location();
 const actual=c[names[mode]](ptr,end,0);
 assert.equal(BigInt.asUintN(64,actual),BigInt(value),`parsed value: ${names[mode]} ${values[j]}`);
 assert.equal(Number(h.read(end,'u64'))-ptr,endIndex,`endptr: ${names[mode]} ${values[j]}`);
 assert.equal(h.read(err,'i32'),errno,`errno: ${names[mode]} ${values[j]}`);
}
console.log('PASS native strtol and C23 strtol parity:',native.length,'cases');
'''
def main():
 with tempfile.TemporaryDirectory() as tmp:
  d=pathlib.Path(tmp);(d/'fixture.c').write_text(C)
  subprocess.run(['clang','-std=c11',str(d/'fixture.c'),'-o',str(d/'fixture')],check=True,capture_output=True)
  values=subprocess.check_output([str(d/'fixture')],text=True).splitlines()
  script=ROOT/'stage5-strtol-test.mjs';script.write_text(JS)
  try:
   result=subprocess.run(['node',script.name,json.dumps(values)],cwd=ROOT,text=True,capture_output=True)
   if result.returncode:raise RuntimeError((result.stdout+result.stderr)[-2500:])
   print(result.stdout.strip())
  finally:script.unlink(missing_ok=True)
if __name__=='__main__':main()
