#!/usr/bin/env python3
"""Native parity: C++ local-static arrays initialize on first declaration execution.

Source-first generated JavaScript must not evaluate runtime array initializers at
module import, nor re-evaluate them on subsequent function invocations.
"""
from pathlib import Path
import asyncio, json, shutil, subprocess, sys, tempfile
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[2]

def run(args,cwd):
    result=subprocess.run(args,cwd=cwd,text=True,capture_output=True,timeout=100)
    if result.returncode:raise AssertionError((args,result.stdout[-1800:],result.stderr[-1800:]))
    return result.stdout

with tempfile.TemporaryDirectory(prefix='sourcefirst-static-lifetime-') as temp:
    root=Path(temp)
    (root/'unit.cpp').write_text('''
#include <stdint.h>
static int seed = 3;
extern "C" int set_seed(int n) { seed=n; return seed; }
extern "C" int take_seed() { return ++seed; }
extern "C" int dynamic_local(int x) {
  static int table[3] = {x, take_seed(), seed + 7};
  return table[0]*1000 + table[1]*100 + table[2];
}
extern "C" int dynamic_later(int n) {
  static int table[2] = {n+seed, n*3};
  return table[0]*100 + table[1];
}
extern "C" int zero_local(int x) {static int slots[2]; slots[0]+=x; return slots[0];}
extern "C" int literal_local(int x) {static int slots[2]={4,9}; slots[0]+=x; return slots[0];}
''')
    (root/'main.cpp').write_text('''
#include <stdio.h>
extern "C" int set_seed(int), take_seed(), dynamic_local(int), dynamic_later(int), zero_local(int), literal_local(int);
int main() {
 printf("%d\\n", set_seed(10));
 printf("%d\\n", dynamic_local(5));
 printf("%d\\n", set_seed(50));
 printf("%d\\n", dynamic_local(99));
 printf("%d\\n", dynamic_later(6));
 printf("%d\\n", dynamic_later(19));
 printf("%d\\n", zero_local(3));
 printf("%d\\n", zero_local(7));
 printf("%d\\n", literal_local(2));
 printf("%d\\n", literal_local(4));
 printf("%d\\n", take_seed());
}
''')
    run(['clang++','-std=gnu++14','unit.cpp','main.cpp','-o','native'],root)
    expected=run([str(root/'native')],root).strip().splitlines()
    run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(root),
         '--source','unit.cpp','--out-dir',str(root/'js')],root)
    module=root/'js/unit.cpp.mjs'
    manifest=json.loads(module.with_suffix('.manifest.json').read_text())
    rows={x['source_name']:x for x in manifest['definitions']}
    for name in ('dynamic_local','dynamic_later','zero_local','literal_local','take_seed','set_seed'):
        assert rows[name]['status']=='source-first',rows[name]
    run(['node','--check',str(module)],root)
    (root/'runner.mjs').write_text('''import * as x from './js/unit.cpp.mjs';
console.log(x.set_seed(10));
console.log(x.dynamic_local(5));
console.log(x.set_seed(50));
console.log(x.dynamic_local(99));
console.log(x.dynamic_later(6));
console.log(x.dynamic_later(19));
console.log(x.zero_local(3));
console.log(x.zero_local(7));
console.log(x.literal_local(2));
console.log(x.literal_local(4));
console.log(x.take_seed());
''')
    observed=run(['node',str(root/'runner.mjs')],root).strip().splitlines()
    assert expected==observed,dict(expected=expected,observed=observed)
    async def check_chromium():
        async with async_playwright() as playwright:
            browser=await playwright.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox'])
            try:
                page=await browser.new_page()
                errors=[]
                page.on('pageerror',lambda error:errors.append(str(error)))
                values=await page.evaluate('''async code => {
                  const url=URL.createObjectURL(new Blob([code],{type:'text/javascript'}));
                  try {
                    const x=await import(url);
                    return [x.set_seed(10),x.dynamic_local(5),x.set_seed(50),
                            x.dynamic_local(99),x.dynamic_later(6),x.dynamic_later(19),
                            x.zero_local(3),x.zero_local(7),x.literal_local(2),
                            x.literal_local(4),x.take_seed()].map(String);
                  } finally { URL.revokeObjectURL(url); }
                }''',module.read_text())
                assert not errors,errors
                return values
            finally:await browser.close()
    in_browser=asyncio.run(check_chromium())
    assert expected==in_browser,dict(expected=expected,chromium=in_browser)
    generated=module.read_text()
    assert 'recursive C++ static initialization' in generated
    assert 'let __static_dynamic_local_table__init = 0;' in generated
    assert 'let __static_dynamic_later_table__init = 0;' in generated
    print('PASS 11 native C++/Node/Chromium checks: dynamic function-local arrays initialize on first use, only once; static zero/literal arrays retain storage')
