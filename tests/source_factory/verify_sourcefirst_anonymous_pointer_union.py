#!/usr/bin/env python3
"""ABI-proven C anonymous pointer union: source-compiled shared alias tests."""
import json,subprocess,tempfile,sys,base64,asyncio,shutil
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def run(cmd,cwd,timeout=60):
 p=subprocess.run(cmd,cwd=cwd,text=True,capture_output=True,timeout=timeout)
 assert p.returncode==0,(cmd,p.stdout[-1200:],p.stderr[-1200:]);return p.stdout
async def browser(module):
 from playwright.async_api import async_playwright
 exe=shutil.which('chromium')
 if not exe:return False
 async with async_playwright() as pw:
  br=await pw.chromium.launch(executable_path=exe,headless=True,args=['--no-sandbox','--disable-gpu-sandbox'])
  try:
   page=await br.new_page();await page.set_content('<title>Source C union ABI</title>')
   errs=[];page.on('pageerror',lambda err:errs.append(str(err)))
   got=await page.evaluate('''async encoded=>{const u=URL.createObjectURL(new Blob([Uint8Array.from(atob(encoded),c=>c.charCodeAt(0))],{type:'text/javascript'})); try {const m=await import(u);if(m.g.a!==null||m.g.b!==null)throw Error('not zeroed');const p={original:'verified'};m.g.a=p;if(m.g.b!==p)throw Error('alias is not shared');m.g.b=null;if(m.g.a!==null)throw Error('reverse alias is not shared');return [m.g.n,m.g.flag,m.g.tail]}finally{URL.revokeObjectURL(u)}}''',base64.b64encode(module).decode())
   assert got==[0,0,None],got
   assert not errs,errs
   return True
  finally:await br.close()
with tempfile.TemporaryDirectory(prefix='eduke-c-pointer-union-') as td:
 p=Path(td)
 (p/'unit.cpp').write_text('''struct A { int x; };struct B { int y; };typedef struct { int n,flag;union {A *a;B *b;};int *tail; } state_t;state_t g;extern "C" int check(){return (g.n==0 && g.flag==0 && g.a==nullptr && g.b==nullptr && g.tail==nullptr); }\n''')
 (p/'native.cpp').write_text('''#include <stdio.h>\nextern "C" int check();int main(){printf("%d\\n",check());}\n''')
 run(['clang++','-std=gnu++14','unit.cpp','native.cpp','-o','native'],p)
 assert run([str(p/'native')],p).strip()=='1'
 run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(p),'--source','unit.cpp','--out-dir',str(p/'out')],ROOT)
 module=p/'out/unit.cpp.mjs';text=module.read_text();manifest=json.loads((p/'out/unit.cpp.manifest.json').read_text());defs={r['name']:r for r in manifest['definitions']};assert defs['g']['status']=='source-first',defs['g']
 assert 'pointerAliases' in text and '"a", "b"' in text
 got=run(['node','--input-type=module','-e','import('+json.dumps(module.as_uri())+').then(m=>{if(m.g.a!==null || m.g.b!==null)throw Error("bad zero");let v={x:42};m.g.a=v;if(m.g.b!==v)throw Error("bad alias");m.g.b=null;if(m.g.a!==null)throw Error("bad reverse alias");console.log(m.g.n,m.g.flag,m.g.tail)})'],p)
 assert got.strip()=='0 0 null',got
 # The copy must keep the two union member names backed by one pointer
 # slot, but must not share the original object instance's slot.
 copy_text=module.read_text()+'\nexport {cCopyAggregate};\n'
 copy_mod=p/'out/clone.mjs';copy_mod.write_text(copy_text)
 probe='''import {g,cCopyAggregate} from "./out/clone.mjs";
 const schema={record:{n:{scalar:"int"},flag:{scalar:"int"},a:{pointer:true},b:{pointer:true},tail:{pointer:true}},pointerAliases:[["a","b"]]};
 const obj={__cReference:true,test:1};g.a=obj;const clone=cCopyAggregate(g,schema);
 if(clone.a!==obj||clone.b!==obj)throw Error("copied alias corrupt");
 clone.b=null;if(clone.a!==null||g.a!==obj)throw Error("copied slot is not independent");console.log("copy PASS");'''
 (p/'copy.mjs').write_text(probe)
 assert run(['node','copy.mjs'],p).strip()=='copy PASS'
 b=asyncio.run(browser(module.read_bytes()))
 source=ROOT/'factory-output/source-first/fix14-types/source/duke3d/src/gameexec.cpp.mjs'
 if source.exists():
  src=source.read_text()
  assert '"pSprite", "pUSprite"' in src and 'export let vm = cZeroAggregate' in src
 print('PASS source C pointer union native/Node'+('/Chromium' if b else '')+'; original vmstate_t emitted')
