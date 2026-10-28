#!/usr/bin/env python3
"""Native DIV register order and translated C ABI arithmetic parity regression."""
from pathlib import Path
import tempfile,subprocess,json,random
ROOT=Path(__file__).resolve().parents[2]
LOWERING=(ROOT/'tools/llvm_linked_backend.py').read_text()
assert 'self.operand(asm[4])+\',\'+self.operand(asm[5])+\',\'+self.operand(asm[3])' in LOWERING, 'x86 DIV lowering must pass EAX, EDX, divisor, not the constraint declaration order'
rng=random.Random(240934)
cases=[]
for d in [1,2,3,7,13,17,31,127,257,4095,65535,2**31-1,2**32-1]:
 for _ in range(5):cases.append([rng.randrange(0,2**32),rng.randrange(0,d),d])
source='''#include <stdint.h>\n#include <stdio.h>\nint main(void){unsigned a,h,d,q,r;\n'''
for a,h,d in cases:
 source+=f'a={a}u;h={h}u;d={d}u;__asm__ volatile("divl %4" : "=a"(q), "=d"(r) : "a"(a), "d"(h), "rm"(d));printf("%u %u\\n",q,r);\n'
source+='return 0;}\n'
with tempfile.TemporaryDirectory() as td:
 p=Path(td);(p/'test.c').write_text(source)
 subprocess.run(['cc','-O0','-o',str(p/'test'),str(p/'test.c')],check=True,capture_output=True)
 native=subprocess.run([str(p/'test')],check=True,capture_output=True,text=True).stdout.strip().splitlines()
 js='''import {LLVMContext} from '''+json.dumps((ROOT/'runtime/llvm_context.mjs').as_uri())+''';\nconst c=new LLVMContext();const rows='''+json.dumps(cases)+''';for(const row of rows){const [q,r]=c.x86DivRem(32,...row);console.log((q>>>0)+' '+(r>>>0))}\n'''
 (p/'test.mjs').write_text(js)
 jsv=subprocess.run(['node',str(p/'test.mjs')],check=True,capture_output=True,text=True).stdout.strip().splitlines()
 assert len(native)==len(jsv),('case mismatch',len(native),len(jsv))
 for i,(n,j) in enumerate(zip(native,jsv)):
  if n!=j:raise AssertionError(f'case {i} {cases[i]} native={n} JS={j}')
print(json.dumps({'native_x86_div_parity_cases':len(cases),'passed':True}))
