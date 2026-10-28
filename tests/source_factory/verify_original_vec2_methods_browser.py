#!/usr/bin/env python3
"""Original vec.h instantiated C++ method ABI, native vs generated JS vs Chromium.

Proves class-template linkage, C++ by-value copies, reference-return identity,
return-by-value, signed overflow arithmetic, and header class factory naming.
It is NOT a complete vec3/vec4 union or Duke gameplay certification.
"""
import asyncio
import base64
import json
import random
import shutil
import subprocess
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from playwright.async_api import async_playwright

ROOT=Path(__file__).resolve().parents[2]
ORIGINAL=ROOT/'factory-output/source-tree/eduke32-master/source/build/include/vec.h'
REPORT=ROOT/'reports/original-vec2-methods-browser.json'
OPS=('vec2_mul','vec2_add','vec2_sub','vec2_plus','vec2_minus',
     'vec2_times','vec2_eq','vec2_chain')
SOURCE='''#include "vec.h"
extern "C" int vec2_mul(int x,int y,int a,int b) {
   vec2_t one{x,y},two{a,b}; one *= two; return one.x ^ one.y;
}
extern "C" int vec2_add(int x,int y,int a,int b) {
   vec2_t one{x,y},two{a,b}; one += two; return one.x ^ one.y;
}
extern "C" int vec2_sub(int x,int y,int a,int b) {
   vec2_t one{x,y},two{a,b}; one -= two; return one.x ^ one.y;
}
extern "C" int vec2_plus(int x,int y,int a,int b) {
   vec2_t one{x,y},two{a,b}; auto three = one + two; return three.x ^ three.y;
}
extern "C" int vec2_minus(int x,int y,int a,int b) {
   vec2_t one{x,y},two{a,b}; auto three = one - two; return three.x ^ three.y;
}
extern "C" int vec2_times(int x,int y,int a,int b) {
   vec2_t one{x,y},two{a,b}; auto three = one * two; return three.x ^ three.y;
}
extern "C" int vec2_eq(int x,int y,int a,int b) {
   vec2_t one{x,y},two{a,b}; return one == two;
}
extern "C" int vec2_chain(int x,int y,int a,int b) {
   vec2_t one{x,y},two{a,b}; auto& ref=(one *= two); ref += two;
   return ref.x ^ ref.y;
}
'''

def command(args,cwd,timeout=100):
    p=subprocess.run(args,cwd=cwd,text=True,capture_output=True,timeout=timeout)
    if p.returncode:
        raise RuntimeError(f'{args!r}: {p.returncode}\n{p.stdout[-1000:]}\n{p.stderr[-1600:]}')
    return p.stdout

async def browser_check(module,inputs,expected):
    chrome=shutil.which('chromium') or shutil.which('google-chrome')
    if not chrome:raise RuntimeError('Chromium is required for real browser verification')
    uri='data:text/javascript;base64,'+base64.b64encode(module.read_bytes()).decode()
    async with async_playwright() as pw:
        browser=await pw.chromium.launch(executable_path=chrome,headless=True,args=['--no-sandbox','--disable-gpu-sandbox'])
        try:
            page=await browser.new_page(viewport={'width':720,'height':320})
            errors=[]
            page.on('pageerror',lambda e:errors.append(str(e)))
            await page.set_content('<!doctype html><meta charset="utf-8"><title>Original EDuke32 vec2 C++ parity</title><main>Original EDuke32 C++ vector operations</main>')
            result=await page.evaluate('''async ({uri,inputs,ops})=>{
                const m=await import(uri);
                return inputs.map(c=>ops.map(op=>m[op](...c)).join(','));
            }''',{'uri':uri,'inputs':inputs,'ops':OPS})
            if result!=expected:
                raise AssertionError('Chromium vector mismatch: '+repr([
                    (i,expected[i],v) for i,v in enumerate(result) if v!=expected[i]][:8]))
            if errors:raise AssertionError('Browser JavaScript errors: '+repr(errors))
            await page.screenshot(path=str(ROOT/'reports/original-vec2-methods-browser.png'))
            return {'browser':'Chromium','errors':errors,'cases':len(result)}
        finally:await browser.close()

def main():
    if not ORIGINAL.is_file():raise RuntimeError('Run python tools/prepare_sources.py first')
    rng=random.Random(20261014)
    edges=(-2147483648,-2147483647,-1073741824,-65536,-32768,-1,0,1,2,32767,65536,1073741824,2147483646,2147483647)
    inputs=[]
    for i in range(256):
        vals=[rng.choice(edges) if i%3==0 else rng.randint(-2**31,2**31-1) for _ in range(4)]
        if i%7==0:vals[2:]=vals[:2]  # exercise true vector equality
        inputs.append(vals)
    with tempfile.TemporaryDirectory(prefix='eduke-original-vec2-') as tmp:
        folder=Path(tmp)
        shutil.copyfile(ORIGINAL,folder/'vec.h')
        (folder/'compat.h').write_text('#pragma once\n#include <stdint.h>\n#define EDUKE32_STATIC_ASSERT static_assert\n')
        (folder/'probe.cpp').write_text(SOURCE)
        (folder/'driver.cpp').write_text('#include <cstdio>\n'+
            'extern "C" {'+';'.join('int '+name+'(int,int,int,int)' for name in OPS)+';}\n'+
            'int main(){int a,b,c,d;while(scanf("%d %d %d %d",&a,&b,&c,&d)==4){\n'+
            'printf("'+','.join(['%d']*len(OPS))+'\\n",'+','.join(name+'(a,b,c,d)' for name in OPS)+');}}\n')
        command(['clang++','-std=gnu++14','-fwrapv','-Wno-c++17-extensions','probe.cpp','driver.cpp','-o','oracle'],folder)
        oracle=subprocess.run([str(folder/'oracle')],input=''.join(' '.join(map(str,values))+'\n' for values in inputs),capture_output=True,text=True,check=True)
        expected=oracle.stdout.splitlines()
        out=folder/'compiled'
        command([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(folder),
                 '--source','probe.cpp','--out-dir',str(out)],ROOT)
        module=out/'probe.cpp.mjs'
        manifest=json.loads(module.with_suffix('.manifest.json').read_text())
        rows={d['source_name']:d for d in manifest['definitions']}
        for name in OPS:
            assert rows[name]['status']=='source-first',(name,rows[name].get('reason'))
        assert rows['vec2<int>']['status']=='source-first'
        command(['node','--check',str(module)],ROOT)
        (folder/'inputs.json').write_text(json.dumps(inputs))
        (folder/'run.mjs').write_text('import * as m from '+json.dumps(module.as_uri())+';\n'
            +'import {readFileSync} from "node:fs";\n'
            +'const rows=JSON.parse(readFileSync('+json.dumps(str(folder/'inputs.json'))+',"utf8"));\n'
            +'const ops='+json.dumps(OPS)+';\n'
            +'for(const row of rows)console.log(ops.map(op=>m[op](...row)).join(","));\n')
        actual=command(['node',str(folder/'run.mjs')],ROOT).splitlines()
        if actual!=expected:
            raise AssertionError('Node native/JS mismatch: '+repr([
                (i,expected[i],v) for i,v in enumerate(actual) if v!=expected[i]][:8]))
        browser=asyncio.run(browser_check(module,inputs,expected))
    result={'format':'eduke32-original-vec2-method-parity/1',
        'timestamp_utc':datetime.now(timezone.utc).isoformat(),
        'original_source':'source/build/include/vec.h',
        'operations':list(OPS),'cases':len(inputs),
        'node_native_js_checks':len(inputs)*len(OPS),
        'chromium_native_js_checks':len(inputs)*len(OPS),
        'status':'PASS','original_gameplay_verified':False,
        'scope':'original source C++ vec2<int> template methods, by-value and reference-return ABI; not vec3/vec4 or game',
        'browser_errors':browser['errors']}
    REPORT.write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps(result,indent=2))

if __name__=='__main__':main()
