#!/usr/bin/env python3
"""Native and JS oracle for exact source-filtered C++ global record pools.

The compiler may demand-recover a *trivial* record hidden by a narrow Clang
AST filter. Nontrivial constructors must not turn into made-up zero objects.
"""
import json
import asyncio
import base64
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
SOURCE='''\
#include <stdint.h>
struct TrivialCell { int32_t x; int32_t y; };
static TrivialCell cells[4];
extern "C" int read_cell(int i) { return i>=0 && i<4 ? cells[i].x+cells[i].y : -1; }
struct Constructed { int value; Constructed() : value(17) {} };
static Constructed requires_constructor[3];
extern "C" int read_constructed(int i) { return requires_constructor[i].value; }
'''

def run(cmd,cwd,timeout=35):
    p=subprocess.run(cmd,cwd=cwd,capture_output=True,text=True,timeout=timeout)
    if p.returncode:raise AssertionError(f'{cmd}\n{p.stdout[-1500:]}\n{p.stderr[-1500:]}')
    return p.stdout

with tempfile.TemporaryDirectory(prefix='eduke-global-ctor-') as dir:
    p=Path(dir);(p/'unit.cpp').write_text(SOURCE)
    (p/'driver.cpp').write_text('''
#include <stdio.h>
extern "C" int read_cell(int),read_constructed(int);
int main(){for(int i=-1;i<5;i++)printf("%d\\n",read_cell(i));printf("%d\\n",read_constructed(1));}
''')
    run(['clang++','-std=c++14','unit.cpp','driver.cpp','-o','native'],p)
    expected=run([str(p/'native')],p).splitlines()
    run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(p),'--source','unit.cpp',
         '--filter','cells,read_cell,requires_constructor,read_constructed','--out-dir',str(p/'out')],ROOT)
    mod=p/'out/unit.cpp.mjs'
    d=json.loads(mod.with_suffix('.manifest.json').read_text());rows={r['name']:r for r in d['definitions']}
    for symbol in ('cells','read_cell'):
        assert rows[symbol]['status']=='source-first',rows[symbol]
    assert rows['requires_constructor']['status']=='blocked',rows['requires_constructor']
    assert 'TrivialCell' in d['pod_record_closure']['proven'],d['pod_record_closure']
    run(['node','--check',str(mod)],p)
    runner=p/'check.mjs'
    runner.write_text('import * as s from '+json.dumps(mod.as_uri())+';\n'
                      + 'for(let i=-1;i<5;i++)console.log(s.read_cell(i));\n')
    observed=run(['node','check.mjs'],p).splitlines()
    assert observed==expected[:6],(observed,expected)
    async def chromium_case():
        from playwright.async_api import async_playwright
        async with async_playwright() as pw:
            browser=await pw.chromium.launch(executable_path=shutil.which('chromium'),
                headless=True,args=['--no-sandbox','--disable-gpu-sandbox'])
            try:
                page=await browser.new_page();await page.set_content('<title>Record array parity</title>')
                errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
                values=await page.evaluate('''async encoded => {
                    const bytes=Uint8Array.from(atob(encoded), c=>c.charCodeAt(0));
                    const url=URL.createObjectURL(new Blob([bytes],{type:'text/javascript'}));
                    try {const mod=await import(url);
                        return Array.from({length:6},(_,k)=>String(mod.read_cell(k-1)));
                    } finally { URL.revokeObjectURL(url); }
                }''',base64.b64encode(mod.read_bytes()).decode())
                assert values==expected[:6],(values,expected)
                assert not errors,errors
            finally:
                await browser.close()
    if shutil.which('chromium'):
        asyncio.run(chromium_case())
    print('PASS source-filtered C++/Node/Chromium record pools 6/6; nontrivial constructor rejected')
