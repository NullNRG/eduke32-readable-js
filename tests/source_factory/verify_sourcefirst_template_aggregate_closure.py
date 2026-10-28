#!/usr/bin/env python3
"""Clang-concrete template POD aggregation: exact specialization, native/Node/Chromium parity."""
import asyncio
import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parents[2]

def run(args, cwd, timeout=90):
    proc = subprocess.run(args,cwd=cwd,text=True,capture_output=True,timeout=timeout)
    if proc.returncode:
        raise AssertionError((args,proc.stdout[-1200:],proc.stderr[-1500:]))
    return proc.stdout

with tempfile.TemporaryDirectory(prefix='source-template-pod-') as workdir:
    work = Path(workdir)
    (work/'records.hpp').write_text('''
template<class T> struct point2 { T x, y; };
template<class T> struct point3 { T x, y, z; };
''')
    (work/'unit.cpp').write_text('''
#include "records.hpp"
#include <stdint.h>
extern "C" int32_t signed_point(int32_t x, int32_t y) {
  point2<int> p{x,y}; return p.x * 3 + p.y;
}
extern "C" uint32_t unsigned_point(uint32_t x) {
  point3<unsigned int> p {x, 0xffffffffU, 4U};
  return p.x + p.y + p.z;
}
extern "C" int32_t two_point_types(int32_t x) {
  point2<int> a{x,7}; point3<int> b{2,x,-4};
  return a.x+a.y+b.x+b.y+b.z;
}
''')
    (work/'main.cpp').write_text('''
#include <stdint.h>
#include <stdio.h>
extern "C" int32_t signed_point(int32_t,int32_t);
extern "C" uint32_t unsigned_point(uint32_t);
extern "C" int32_t two_point_types(int32_t);
int main() {
  for(int x=-32;x<=32;x+=4) printf("%d,%u,%d\\n", signed_point(x,19),unsigned_point((uint32_t)x),two_point_types(x));
}
''')
    run(['clang++','-std=gnu++14','unit.cpp','main.cpp','-o','native'],work)
    expected=run([str(work/'native')],work).strip().splitlines()
    modules={}
    for name in ('signed_point','unsigned_point','two_point_types'):
        output=work/name
        run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(work),
            '--source','unit.cpp','--filter',name,'--out-dir',str(output)],work)
        path=output/'unit.cpp.mjs'
        manifest=json.loads(path.with_suffix('.manifest.json').read_text())
        item=next(x for x in manifest['definitions'] if x['source_name']==name)
        assert item['status']=='source-first',(name,item)
        requested={'signed_point':{'point2<int>'},
                   'unsigned_point':{'point3<unsigned int>'},
                   'two_point_types':{'point2<int>','point3<int>'}}[name]
        assert requested.issubset(set(manifest['pod_record_closure']['proven'])),(name,manifest['pod_record_closure'])
        run(['node','--check',str(path)],work)
        modules[name]=path.read_text()
    # A filtered TU must not import an unrelated template's definition.
    assert 'point3<unsigned int>' not in modules['signed_point']
    for name,source in modules.items():
        (work/(name+'.mjs')).write_text(source)
    (work/'runner.mjs').write_text('''
import {signed_point} from './signed_point.mjs';
import {unsigned_point} from './unsigned_point.mjs';
import {two_point_types} from './two_point_types.mjs';
for(let x=-32;x<=32;x+=4)console.log(`${signed_point(x,19)},${unsigned_point(x>>>0)},${two_point_types(x)}`);
''')
    actual=run(['node','runner.mjs'],work).strip().splitlines()
    assert actual==expected,(expected,actual)
    async def browser_check():
        async with async_playwright() as playwright:
            browser=await playwright.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox'])
            try:
                page=await browser.new_page();errors=[]
                page.on('pageerror',lambda error:errors.append(str(error)))
                output=await page.evaluate('''async sources=>{
                  let result=[];
                  for (const [key,source] of Object.entries(sources)) {
                    const url=URL.createObjectURL(new Blob([source],{type:'text/javascript'}));
                    try {const module=await import(url);result.push([key,module[key]])} finally{URL.revokeObjectURL(url)}
                  }
                  const byName=Object.fromEntries(result);
                  const out=[];
                  for(let x=-32;x<=32;x+=4)out.push(`${byName.signed_point(x,19)},${byName.unsigned_point(x>>>0)},${byName.two_point_types(x)}`);
                  return out;
                }''',modules)
                assert errors==[],errors
                return output
            finally:
                await browser.close()
    browser=asyncio.run(browser_check())
    assert browser==expected,(expected,browser)
    # An explicit user constructor is not an aggregate. Reject its attempt at
    # constructing an object through the POD template recovery path.
    (work/'bad.cpp').write_text('''
#include "records.hpp"
template<class T> struct NotPod { T x; NotPod(T v) : x(v) {} };
extern "C" int not_pod(int n){NotPod<int> v{n};return v.x;}
''')
    run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(work),
        '--source','bad.cpp','--filter','not_pod','--out-dir',str(work/'negative')],work)
    bad=json.loads((work/'negative/bad.cpp.manifest.json').read_text())
    item=next(x for x in bad['definitions'] if x['source_name']=='not_pod')
    assert item['status']=='blocked' or not bad['pod_record_closure']['proven'],item
    print('PASS: concrete Clang template POD field-order/initializer closure: '
          f'{len(expected)} native vs Node vs Chromium cases across three source functions; unsafe constructor not promoted')
