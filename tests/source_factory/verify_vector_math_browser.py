#!/usr/bin/env python3
"""Native original-vec.h vs source-generated JS integer vector component parity.

Scope: numeric int32/uint32 compound multiplication and ordinary POD fields.
This does not certify vec3 union aliasing, templates, gameplay, or app_main.
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
REPORT=ROOT/'reports/vector-math-browser.json'

def run(args,cwd,timeout=75):
    p=subprocess.run(args,cwd=cwd,text=True,capture_output=True,timeout=timeout)
    if p.returncode: raise RuntimeError(f'{args} exit {p.returncode}: {p.stderr[-2400:]} {p.stdout[-300:]}')
    return p.stdout

def main():
    if not ORIGINAL.exists(): raise RuntimeError('Original source not prepared: run python tools/prepare_sources.py')
    rng=random.Random(20261014)
    extremes=[-2147483648,-2147483647,-1073741823,-65537,-32768,-1,0,1,2,32767,65535,1073741823,2147483646,2147483647]
    cases=[]
    for n in range(512):
        values=[rng.choice(extremes) if n%3==0 else rng.randint(-2147483648,2147483647) for _ in range(4)]
        cases.append(values)
    with tempfile.TemporaryDirectory(prefix='eduke-vector-parity-') as td:
        folder=Path(td)
        shutil.copyfile(ORIGINAL,folder/'vec.h')
        (folder/'compat.h').write_text('#pragma once\n#include <stdint.h>\n#define EDUKE32_STATIC_ASSERT static_assert\n')
        # This fixture tests the *general emitter's* record-component semantics.
        # The native reference below instead invokes the actual original
        # EDuke32 C++ vector template. Do not confuse it with a recovered
        # vec2 C++ class or a linked game.
        (folder/'math.cpp').write_text('''#include <stdint.h>
struct PackedVec { int32_t x,y; };
struct UnsignedVec { uint32_t x,y; };
extern "C" int32_t source_vec_mul(int32_t x,int32_t y,int32_t a,int32_t b) {
    PackedVec p{x,y},q{a,b};p.x*=q.x;p.y*=q.y;return p.x^p.y;
}
extern "C" uint32_t source_uvec_mul(uint32_t x,uint32_t y,uint32_t a,uint32_t b) {
    UnsignedVec p{x,y},q{a,b};p.x*=q.x;p.y*=q.y;return p.x^p.y;
}
''')
        (folder/'oracle.cpp').write_text('''#include "vec.h"
#include <cstdint>
#include <cstdio>
#include <cstdlib>
int main(int argc,char** argv) {
  (void)argc;(void)argv;
  int64_t x,y,a,b;
  while (std::scanf("%lld %lld %lld %lld", (long long*)&x,(long long*)&y,(long long*)&a,(long long*)&b)==4) {
    vec2_t p{(int32_t)x,(int32_t)y},q{(int32_t)a,(int32_t)b};p*=q;
    vec2u_t up{(uint32_t)x,(uint32_t)y},uq{(uint32_t)a,(uint32_t)b};up*=uq;
    std::printf("%d,%u\\n",p.x^p.y,up.x^up.y);
  }
}
''')
        # Native oracle and generated JS must share the same 32-bit integer
        # model. Signed multiply overflow uses Clang's explicit -fwrapv mode.
        run(['clang++','-std=gnu++14','-fwrapv','-Wno-c++17-extensions','oracle.cpp','-o','oracle'],folder)
        data=''.join(' '.join(map(str,row))+'\n' for row in cases)
        expected=subprocess.run([str(folder/'oracle')],input=data,capture_output=True,text=True,check=True).stdout.splitlines()
        output=folder/'compiled'
        run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(folder),
             '--source','math.cpp','--out-dir',str(output)],ROOT)
        module=output/'math.cpp.mjs'
        mf=json.loads(module.with_suffix('.manifest.json').read_text())
        assert mf['blocked']==0 and mf['emitted']==4,(mf['emitted'],mf['blocked'],mf['definitions'])
        run(['node','--check',str(module)],ROOT)
        testcases=folder/'cases.json';testcases.write_text(json.dumps(cases))
        (folder/'node.mjs').write_text('import {source_vec_mul,source_uvec_mul} from '+json.dumps(module.as_uri())+';\n'
            +'import {readFileSync} from "node:fs";\n'
            +'const cases=JSON.parse(readFileSync('+json.dumps(str(testcases))+',"utf8"));\n'
            +'for(const [x,y,a,b] of cases) console.log(source_vec_mul(x,y,a,b)+","+source_uvec_mul(x>>>0,y>>>0,a>>>0,b>>>0));\n')
        observed=run(['node',str(folder/'node.mjs')],ROOT).splitlines()
        if expected!=observed:
            errors=[{'index':n,'inputs':cases[n],'expected':a,'actual':b} for n,(a,b) in enumerate(zip(expected,observed)) if a!=b]
            raise AssertionError('Native EDuke32 vec2 vs transpiled JS differs: '+str(errors[:8]))
        async def browser_run():
            chromium=shutil.which('chromium') or shutil.which('google-chrome')
            if not chromium:raise RuntimeError('Chromium executable unavailable')
            uri='data:text/javascript;base64,'+base64.b64encode(module.read_bytes()).decode()
            async with async_playwright() as p:
                browser=await p.chromium.launch(executable_path=chromium,headless=True,args=['--no-sandbox','--disable-gpu-sandbox'])
                try:
                    page=await browser.new_page(viewport={'width':640,'height':320})
                    errors=[];page.on('pageerror',lambda err:errors.append(str(err)))
                    await page.set_content('<!doctype html><title>EDuke32 vector parity test</title><main>EDuke32 original vec2 math native/JS parity</main>')
                    actual=await page.evaluate('''async ({uri,cases})=>{
                      const m=await import(uri);
                      return cases.map(([x,y,a,b])=>String(m.source_vec_mul(x,y,a,b))+','+
                        String(m.source_uvec_mul(x>>>0,y>>>0,a>>>0,b>>>0)));
                    }''',{'uri':uri,'cases':cases})
                    if actual!=expected:raise AssertionError('Chromium vector numerical mismatch: '+str([(i,x,y) for i,(x,y) in enumerate(zip(expected,actual)) if x!=y][:8]))
                    if errors:raise AssertionError('Browser errors: '+str(errors))
                    await page.screenshot(path=str(ROOT/'reports/vector-math-browser.png'))
                    return {'checks':len(actual)*2,'page_errors':errors,'browser':'Chromium'}
                finally:await browser.close()
        browser=asyncio.run(browser_run())
    report={'format':'eduke32-vector-math-parity/1','timestamp_utc':datetime.now(timezone.utc).isoformat(),
        'original_header':'source/build/include/vec.h','source_case_count':len(cases),
        'native_vs_js_node_checks':len(cases)*2,'native_vs_js_chromium_checks':browser['checks'],
        'status':'PASS','scope':'vec2 int32/uint32 component compound-multiply via source-generated JS; not complete C++ vector ABI or gameplay',
        'gameplay_verified':False,'page_errors':browser['page_errors']}
    REPORT.write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2))

if __name__=='__main__':main()
