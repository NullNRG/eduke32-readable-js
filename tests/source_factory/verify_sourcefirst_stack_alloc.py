#!/usr/bin/env python3
"""Clang original alloca semantics: bounded independent byte spans; native/Node/Chromium parity."""
import asyncio,json,shutil,subprocess,sys,tempfile
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[2]
def run(args,cwd):
 p=subprocess.run(args,cwd=cwd,text=True,capture_output=True,timeout=90)
 if p.returncode:raise AssertionError((args,p.stdout[-1300:],p.stderr[-1300:]))
 return p.stdout
with tempfile.TemporaryDirectory(prefix='source-alloca-') as folder:
 root=Path(folder)
 (root/'unit.cpp').write_text('''
#include <stdint.h>
extern "C" int32_t stack_bytes(int32_t n, int32_t seed) {
    uint8_t *p = (uint8_t*)__builtin_alloca(n);
    for (int32_t i=0;i<n;++i) p[i]=(uint8_t)(i*5+seed);
    int32_t result=0;
    for (int32_t i=0;i<n;++i) result += p[i];
    return result;
}
extern "C" uint32_t stack_twice(uint32_t n) {
    uint8_t *a=(uint8_t*)__builtin_alloca(n);
    uint8_t *b=(uint8_t*)__builtin_alloca(n);
    for (uint32_t i=0;i<n;++i) {a[i]=(uint8_t)i;b[i]=(uint8_t)(200-i);}
    uint32_t result=0;
    for (uint32_t i=0;i<n;++i) result += a[i]*2+b[i];
    return result;
}
''')
 (root/'main.cpp').write_text('''
#include <stdio.h>
#include <stdint.h>
extern "C" int32_t stack_bytes(int32_t,int32_t);
extern "C" uint32_t stack_twice(uint32_t);
int main(){printf("%d\\n",stack_bytes(3,4));printf("%d\\n",stack_bytes(32,253));printf("%d\\n",stack_bytes(101,28));printf("%u\\n",stack_twice(10));printf("%u\\n",stack_twice(123));}
''')
 run(['clang++','-std=gnu++14','unit.cpp','main.cpp','-o','native'],root)
 expected=run([str(root/'native')],root).strip().splitlines()
 run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(root),'--source','unit.cpp','--out-dir',str(root/'js')],root)
 mod=root/'js/unit.cpp.mjs';mf=json.loads(mod.with_suffix('.manifest.json').read_text())
 assert mf['blocked']==0,mf['definitions']
 generated=mod.read_text();assert 'cStackAlloc(' in generated
 run(['node','--check',str(mod)],root)
 runner='''import * as g from './js/unit.cpp.mjs';console.log(g.stack_bytes(3,4));console.log(g.stack_bytes(32,253));console.log(g.stack_bytes(101,28));console.log(g.stack_twice(10));console.log(g.stack_twice(123));'''
 (root/'entry.mjs').write_text(runner)
 observed=run(['node',str(root/'entry.mjs')],root).strip().splitlines()
 assert observed==expected,(expected,observed)
 async def chromium():
  async with async_playwright() as p:
   browser=await p.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox'])
   try:
    page=await browser.new_page();errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    result=await page.evaluate('''async code=>{const url=URL.createObjectURL(new Blob([code],{type:'text/javascript'}));try{const g=await import(url);return [g.stack_bytes(3,4),g.stack_bytes(32,253),g.stack_bytes(101,28),g.stack_twice(10),g.stack_twice(123)].map(String)}finally{URL.revokeObjectURL(url)}}''',generated)
    assert not errors,errors
    return result
   finally:await browser.close()
 actual=asyncio.run(chromium());assert actual==expected,(expected,actual)
 print('PASS Clang C++/Node/Chromium source first stack alloca parity:',len(expected),'cases;',','.join(expected))
