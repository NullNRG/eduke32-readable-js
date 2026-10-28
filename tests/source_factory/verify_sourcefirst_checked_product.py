#!/usr/bin/env python3
"""Native, Node and Chromium parity for original clang unsigned-64 checked multiply."""
import json,asyncio,shutil,subprocess,sys,tempfile,os
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[2]
def run(args,cwd):
 p=subprocess.run(args,cwd=cwd,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,timeout=80)
 if p.returncode:raise AssertionError((args,p.stdout[-1000:],p.stderr[-1000:]))
 return p.stdout
with tempfile.TemporaryDirectory(prefix='source-umull-') as td:
 root=Path(td)
 (root/'unit.cpp').write_text('''
#include <stdint.h>
extern "C" unsigned long checked_product(unsigned long a,unsigned long b) {
    unsigned long output=0;
    bool overflow=__builtin_umull_overflow(a,b,&output);
    return output ^ (overflow ? 0x123UL : 0UL);
}
extern "C" bool checked_flag(unsigned long a,unsigned long b) {
    unsigned long output=0;
    return __builtin_umull_overflow(a,b,&output);
}
''')
 inputs=[('0','0'),('1','0'),('4000000000','4000000000'),('18446744073709551615','2'),('18446744073709551615','18446744073709551615'),('4294967296','4294967296')]
 (root/'main.cpp').write_text('''#include <cstdio>
extern "C" unsigned long checked_product(unsigned long,unsigned long);
extern "C" bool checked_flag(unsigned long,unsigned long);
int main(){
'''+''.join(f'printf("%lu,%d\\n",checked_product({a}UL,{b}UL),int(checked_flag({a}UL,{b}UL)));\n' for a,b in inputs)+'}')
 # The emitted target is LP64. Windows native `unsigned long` is 32 bits;
 # use its 64-bit unsigned long long and corresponding Clang builtin for
 # the oracle, keeping the SAME 64-bit checked multiplication semantics.
 native_unit='unit.cpp'
 if os.name=='nt':
  (root/'native-unit.cpp').write_text((root/'unit.cpp').read_text().replace('unsigned long','unsigned long long').replace('__builtin_umull_overflow','__builtin_umulll_overflow'))
  (root/'main.cpp').write_text((root/'main.cpp').read_text().replace('unsigned long','unsigned long long').replace('%lu','%llu').replace('UL','ULL'))
  native_unit='native-unit.cpp'
 run(['clang++','-std=gnu++14',native_unit,'main.cpp','-o','native'],root)
 expected=run([str(root/'native')],root).strip().splitlines()
 run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(root),'--source','unit.cpp','--out-dir',str(root/'js')],root)
 mod=root/'js/unit.cpp.mjs';manifest=json.loads(mod.with_suffix('.manifest.json').read_text())
 assert manifest['blocked']==0,manifest['definitions']
 run(['node','--check',str(mod)],root)
 values=json.dumps(inputs)
 statement="const inputs="+values+";for(const [a,b] of inputs)console.log(String(g.checked_product(BigInt(a),BigInt(b)))+','+Number(g.checked_flag(BigInt(a),BigInt(b))));"
 (root/'entry.mjs').write_text("import * as g from './js/unit.cpp.mjs';"+statement)
 observed=run(['node',str(root/'entry.mjs')],root).strip().splitlines()
 assert observed==expected,(expected,observed)
 async def check():
  async with async_playwright() as p:
   browser=await p.chromium.launch(executable_path=shutil.which('chromium'),args=['--no-sandbox'],headless=True)
   try:
    page=await browser.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    result=await page.evaluate('''async ({code,inputs})=>{const url=URL.createObjectURL(new Blob([code],{type:'text/javascript'}));try{const g=await import(url);return inputs.map(([a,b])=>String(g.checked_product(BigInt(a),BigInt(b)))+','+Number(g.checked_flag(BigInt(a),BigInt(b))))}finally{URL.revokeObjectURL(url)}}''',{'code':mod.read_text(),'inputs':inputs})
    assert not errors,errors
    return result
   finally:await browser.close()
 actual=asyncio.run(check());assert actual==expected,(expected,actual)
 # Compile and execute the *real original* mimalloc header helper, rather
 # than inferring its behavior from a similarly-shaped test fixture.
 original_root=ROOT/'factory-output/source-tree/eduke32-master'
 original_dir=root/'original'
 run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),
      '--root',str(original_root),'--source','source/mimalloc/src/options.c',
      '--filter','mi_mul_overflow','--header-inlines','--out-dir',str(original_dir)],root)
 original=original_dir/'source/mimalloc/src/options.c.mjs'
 original_manifest=json.loads(original.with_suffix('.manifest.json').read_text())
 assert original_manifest['emitted']==1 and original_manifest['blocked']==0,original_manifest['definitions']
 native_expected=[]
 for value in expected:
  stored,flag=value.split(',')
  native_expected.append(str(int(stored) ^ (0x123 if flag=='1' else 0))+','+flag)
 (root/'original-entry.mjs').write_text("import * as g from './original/source/mimalloc/src/options.c.mjs';"
   +"const inputs="+values+";for(const [a,b] of inputs){const target={__cReference:true,value:0n};"
   +"const overflow=g.mi_mul_overflow(BigInt(a),BigInt(b),target);"
   +"console.log(String(target.value)+','+Number(overflow))}")
 original_node=run(['node',str(root/'original-entry.mjs')],root).strip().splitlines()
 assert original_node==native_expected,(native_expected,original_node)
 async def check_original():
  async with async_playwright() as p:
   browser=await p.chromium.launch(executable_path=shutil.which('chromium'),args=['--no-sandbox'],headless=True)
   try:
    page=await browser.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    actual=await page.evaluate('''async ({code,inputs})=>{const url=URL.createObjectURL(new Blob([code],{type:'text/javascript'}));
      try {const g=await import(url);return inputs.map(([a,b])=>{let ref={__cReference:true,value:0n};
      let failed=g.mi_mul_overflow(BigInt(a),BigInt(b),ref);return String(ref.value)+','+Number(failed)});
      }finally{URL.revokeObjectURL(url)}}''',{'code':original.read_text(),'inputs':inputs})
    assert not errors,errors
    return actual
   finally:await browser.close()
 original_browser=asyncio.run(check_original())
 assert original_browser==native_expected,(native_expected,original_browser)
 print('PASS native/Node/Chromium original mimalloc mi_mul_overflow:',len(inputs),'cases')
 print('PASS native/Node/Chromium checked multiply 64-bit:',len(inputs),'cases',','.join(expected))
