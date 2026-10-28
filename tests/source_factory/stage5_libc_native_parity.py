#!/usr/bin/env python3
"""Compare browser libm numeric results and C-locale string operations to native libc."""
import pathlib,subprocess,tempfile,json,sys,math
ROOT=pathlib.Path(__file__).resolve().parents[2]
SOURCE=r'''
#include <math.h>
#include <ctype.h>
#include <string.h>
#include <stdio.h>
#include <locale.h>
int main(void){
 setlocale(LC_ALL,"C");
 for(int x=-1;x<256;x++)printf("CHAR %d %d %d %d %d %d\n",x,!!isalpha(x),!!islower(x),!!isupper(x),!!isspace(x),!!isxdigit(x));
 const char *hay="bananaban", *needle="ana";
 printf("STRING %ld\n",(long)(strstr(hay,needle)-hay));
 char dest[32]="A";
 strncat(dest,needle,2);strncat(dest,needle,0);strncat(dest,needle,99);
 printf("APPEND %s\n",dest);
 double vals[]={-0.75,-0.1,0.0,0.1,0.75,3.5};
 for(int i=0;i<6;i++){
  double x=vals[i];
  printf("MATH %.17g %.17g %.17g %.17g %.17g %.17g\n",x,sin(x),cos(x),tan(x),exp(x),sqrt(x+1));
 }
 return 0;
}
'''
JS=r'''
import assert from 'node:assert/strict';
import {LLVMContext} from './runtime/llvm_context.mjs';
const rows=JSON.parse(process.argv[2]);
const ctx=new LLVMContext(), h=ctx.heap,c=ctx.libraries;
for(const line of rows){
 const parts=line.split(' ');
 if(parts[0]==='CHAR'){
  const n=Number(parts[1]);
  assert.deepEqual([c.isalpha(n),c.islower(n),c.isupper(n),c.isspace(n),c.isxdigit(n)].map(Number),parts.slice(2).map(Number));
 } else if(parts[0]==='STRING') {
  const a=h.writeCString('bananaban'),b=h.writeCString('ana');
  assert.equal(c.strstr(a,b)-a,Number(parts[1]));
 }else if(parts[0]==='APPEND'){
  const d=h.malloc(40),a=h.writeCString('ana');h.write(d,'u8',65);h.write(d+1,'u8',0);
  c.strncat(d,a,2);c.strncat(d,a,0);c.strncat(d,a,99);
  assert.equal(h.readCString(d),parts[1]);
 }else if(parts[0]==='MATH'){
  const [x,sin,cos,tan,exp,sqrt]=parts.slice(1).map(Number);
  const near=(actual,want)=>{
    if(Object.is(want,0)) assert.ok(Math.abs(actual)<1e-14);
    else assert.ok(Math.abs(actual-want)<=1e-12*Math.max(1,Math.abs(want)),`${actual} != ${want}`);
  };
  near(c.sin(x),sin);near(c.cos(x),cos);near(c.tan(x),tan);near(c.exp(x),exp);near(c.sqrt(x+1),sqrt);
 }
}
console.log('PASS native libc comparison:',rows.length,'classification/string/math outputs');
'''
def main():
 with tempfile.TemporaryDirectory() as tmp:
  p=pathlib.Path(tmp);(p/'source.c').write_text(SOURCE)
  subprocess.run(['clang','-O1',str(p/'source.c'),'-lm','-o',str(p/'native')],check=True,capture_output=True)
  rows=subprocess.check_output([str(p/'native')],text=True).splitlines()
  target=ROOT/'stage5-libc-test.mjs';target.write_text(JS)
  try:print(subprocess.check_output(['node',target.name,json.dumps(rows)],cwd=ROOT,text=True).strip())
  finally:target.unlink(missing_ok=True)
if __name__=='__main__':main()
