#!/usr/bin/env python3
"""Cross-TU Clang-native vs transpiled-JavaScript parity (struct, SIMD, i128)."""
import json,pathlib,subprocess,sys,tempfile
root=pathlib.Path(__file__).resolve().parents[1];fixtures=root/'tests/whole_program_dedupe_fixture'
with tempfile.TemporaryDirectory() as tmp:
  work=pathlib.Path(tmp)
  program=r'''
#include <stdio.h>
#include "calc.h"
int main(void){
 for(unsigned long long i=0;i<24;i++){
  unsigned long long n=100+i*97, d=3+i%7;
  float f=(float)i/8.0f+0.25f;
  printf("%llu,%lld,%.9g\n",(unsigned long long)calculate(n,d),(long long)wide_arithmetic(i+2,i*5+1),(double)vector_sum(f));
 }
}
'''
  (work/'native_main.c').write_text(program)
  args=['clang','-O1','-I'+str(fixtures),str(work/'native_main.c'),str(fixtures/'math.c'),str(fixtures/'main.c'),'-o',str(work/'native')]
  subprocess.run(args,check=True,capture_output=True)
  expected=[line.split(',') for line in subprocess.run([work/'native'],check=True,capture_output=True,text=True).stdout.splitlines()]
  subprocess.run([sys.executable,root/'tools/whole_program.py','--source',fixtures,'--out',work/'compiled','--fixture','--require-complete'],check=True,capture_output=True)
  values=[{'n':100+i*97,'d':3+i%7,'high':i+2,'low':i*5+1,'f':i/8+.25} for i in range(24)]
  program='''import{boot}from '''+json.dumps((work/'compiled/linked.mjs').as_uri())+''';
const c=boot();const cases='''+json.dumps(values)+''';
for(const v of cases)console.log([String(c.call('calculate',[BigInt(v.n),BigInt(v.d)])),String(c.call('wide_arithmetic',[BigInt(v.high),BigInt(v.low)])),String(c.call('vector_sum',[v.f]))].join(','));'''
  actual=[line.split(',') for line in subprocess.run(['node','--input-type=module','-e',program],check=True,capture_output=True,text=True).stdout.splitlines()]
  assert len(actual)==len(expected)==24
  for i,(a,b) in enumerate(zip(actual,expected)):
    assert a[:2]==b[:2],f'case {i} integer mismatch: JS={a} C={b}'
    assert abs(float(a[2])-float(b[2]))<1e-5,f'case {i} SIMD mismatch JS={a} C={b}'
  print(json.dumps({'native_compiler':'clang','source_translation_units':2,'cases':len(expected),'primitive_comparisons':len(expected)*3,'result':'PASS'},indent=2))
