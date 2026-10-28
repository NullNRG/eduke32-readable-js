#!/usr/bin/env python3
"""C++/Node/Chromium end-to-end original union assignment & byte-backed global pool."""
import asyncio, base64, json, shutil, subprocess, tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
SOURCE='''#include <stdint.h>
union Cell { uint32_t word; uint8_t color[4]; };
static Cell cells[8];
extern "C" uint32_t set_word(int i, uint32_t v) { cells[i].word=v; return cells[i].color[0]; }
extern "C" uint32_t read_word(int i) { return cells[i].word; }
extern "C" uint32_t copy_word(int src, int dst) { cells[dst]=cells[src]; return cells[dst].word; }
'''
DRIVER='''#include <stdio.h>
#include <stdint.h>
extern "C" uint32_t set_word(int, uint32_t), read_word(int), copy_word(int,int);
int main(){printf("%u\\n",set_word(1,0x12345678));printf("%u\\n",read_word(1));printf("%u\\n",copy_word(1,2));printf("%u\\n",set_word(1,0xabcdef01));printf("%u\\n",read_word(2));printf("%u\\n",copy_word(1,2));printf("%u\\n",read_word(2));}
'''
CALLS=['set_word(1,0x12345678)','read_word(1)','copy_word(1,2)','set_word(1,0xabcdef01)','read_word(2)','copy_word(1,2)','read_word(2)']
def run(args,cwd):
 p=subprocess.run(args,cwd=cwd,timeout=30,capture_output=True,text=True)
 if p.returncode:raise AssertionError({'cmd':args,'stderr':p.stderr[-2000:],'stdout':p.stdout[-2000:]})
 return p.stdout.strip().splitlines()
async def browser_test(source,expected):
 from playwright.async_api import async_playwright
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--disable-gpu-sandbox'])
  try:
   page=await browser.new_page();await page.set_content('<title>source union assignment</title>');errors=[]
   page.on('pageerror',lambda e:errors.append(str(e)))
   results=await page.evaluate('''async ({data,calls}) => {const bytes=Uint8Array.from(atob(data),ch=>ch.charCodeAt(0));const url=URL.createObjectURL(new Blob([bytes],{type:'text/javascript'}));try{const m=await import(url);return [m.set_word(1,0x12345678),m.read_word(1),m.copy_word(1,2),m.set_word(1,0xabcdef01),m.read_word(2),m.copy_word(1,2),m.read_word(2)].map(String)}finally{URL.revokeObjectURL(url)}}''',{'data':base64.b64encode(source.encode()).decode(),'calls':CALLS})
   assert results==expected and not errors,(results,expected,errors)
  finally:await browser.close()
with tempfile.TemporaryDirectory(prefix='eduke-byte-pool-compile-') as temp:
 root=Path(temp);(root/'original.cpp').write_text(SOURCE);(root/'main.cpp').write_text(DRIVER)
 run(['clang++','-std=c++17','original.cpp','main.cpp','-o','native'],root)
 native=run([str(root/'native')],root)
 run(['python',str(ROOT/'tools/source_ast_to_js.py'),'--root',str(root),'--source','original.cpp','--filter','cells,set_word,read_word,copy_word','--out-dir',str(root/'out')],ROOT)
 source=(root/'out/original.cpp.mjs').read_text()
 manifest=json.loads((root/'out/original.cpp.manifest.json').read_text())
 required=('Cell','cells','set_word','read_word','copy_word')
 assert all(any(d['name']==x and d['status']=='source-first' for d in manifest['definitions']) for x in required),manifest['definitions']
 assert 'cByteRecordArray(' in source and 'cAssignAggregate(' in source
 runner=(root/'check.mjs');runner.write_text('import * as m from '+json.dumps((root/'out/original.cpp.mjs').as_uri())+';\n'+'\n'.join('console.log('+('m.'+call)+');' for call in CALLS)+'\n')
 node=run(['node',str(runner)],root)
 assert node==native,(node,native)
 if shutil.which('chromium'):asyncio.run(browser_test(source,native))
 print('PASS Clang byte-backed global array + implicit C++ union assignment: 5 source symbols, 7 native/Node/Chromium calls')
