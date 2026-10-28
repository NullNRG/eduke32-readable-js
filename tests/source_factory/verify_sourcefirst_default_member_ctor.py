#!/usr/bin/env python3
"""C++ default-member initializers: native/JS/Chromium parity and source proof.

Do not treat a compiler-synthesized implicit ctor as a trivial ctor: original
scalar DMI expressions have observable initial values and must be preserved.
"""
import asyncio
import base64
import json
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

def run(cmd, cwd, timeout=120):
    p=subprocess.run(cmd,cwd=cwd,capture_output=True,text=True,timeout=timeout)
    assert p.returncode==0,(cmd,p.stdout[-2000:],p.stderr[-2000:])
    return p.stdout

async def verify_browser(payload, expected):
    from playwright.async_api import async_playwright
    import shutil
    chromium=shutil.which('chromium')
    if not chromium:
        print('SKIP Chromium: browser unavailable')
        return 0
    async with async_playwright() as pw:
        browser=await pw.chromium.launch(executable_path=chromium,headless=True,args=['--no-sandbox','--disable-gpu-sandbox'])
        try:
            page=await browser.new_page()
            exceptions=[]
            page.on('pageerror',lambda e: exceptions.append(str(e)))
            await page.set_content('<html><body>Original source-generated JavaScript</body></html>')
            actual=await page.evaluate('''async (encoded) => {
                const bytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0));
                const url=URL.createObjectURL(new Blob([bytes],{type:'text/javascript'}));
                try { const mod=await import(url);let values=[];
                    for(let i=0;i<256;i++)values.push(mod.step(i));
                    return values; }
                finally {URL.revokeObjectURL(url)}
            }''',base64.b64encode(payload).decode())
            assert actual==expected,next(((i,a,b) for i,(a,b) in enumerate(zip(actual,expected)) if a!=b),None)
            assert not exceptions,exceptions
            return len(actual)
        finally:
            await browser.close()

with tempfile.TemporaryDirectory(prefix='eduke-dmi-native-browser-') as tmp:
    path=Path(tmp)
    (path/'state.hpp').write_text('''#include <stdint.h>
struct Counter { uint16_t count = 17; uint16_t get() const {return count;} };
''')
    (path/'unit.cpp').write_text('''#include "state.hpp"
Counter global;
extern "C" int step(int i) {
  if(i>0 && i%5==0) global.count=(uint16_t)(i*521+3);
  return (int)global.get();
}
''')
    (path/'native.cpp').write_text('''#include <stdio.h>
extern "C" int step(int);
int main(){for(int i=0;i<256;i++)printf("%d\\n",step(i));}
''')
    run(['clang++','-std=c++14','unit.cpp','native.cpp','-o','native'],path)
    expected=[int(v) for v in run([str(path/'native')],path).splitlines()]
    assert expected[1]==17
    output=path/'compiled'
    run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),
        '--root',str(path),'--source','unit.cpp','--out-dir',str(output)],ROOT)
    generated=output/'unit.cpp.mjs'
    manifest=json.loads(generated.with_suffix('.manifest.json').read_text())
    status={r['name']:r for r in manifest['definitions']}
    assert all(status[name]['status']=='source-first' for name in ('Counter','global','step')),status
    assert status['Counter'].get('header_record_factory'),status['Counter']
    run(['node','--check',str(generated)],path)
    (path/'run.mjs').write_text('''import {step} from "./compiled/unit.cpp.mjs";
for(let i=0;i<256;i++)console.log(step(i));
''')
    actual=[int(v) for v in run(['node','run.mjs'],path).splitlines()]
    assert actual==expected
    checked=asyncio.run(verify_browser(generated.read_bytes(),expected))
    # Filtered Clang dumps omit the record definition. Demand-query the exact
    # original header, prove its physical bytes and emit constructor there.
    (path/'filtered.cpp').write_text('#include "state.hpp"\nstatic Counter second;\n')
    run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'), '--root',str(path),
         '--source','filtered.cpp','--filter','second','--out-dir',str(output)],ROOT)
    filter_module=output/'filtered.cpp.mjs'
    fmanifest=json.loads(filter_module.with_suffix('.manifest.json').read_text())
    assert fmanifest['header_ctor_closure']['proven']==['Counter'],fmanifest['header_ctor_closure']
    assert all(r['status']=='source-first' for r in fmanifest['definitions'])
    assert run(['node','--input-type=module','-e',
        'import('+json.dumps(filter_module.as_uri())+').then(x=>console.log(x.second.count))'],path).strip()=='17' 
    original=ROOT/'factory-output/source-first/dmi-header-recovery/source/build/src/screenshot.cpp.mjs'
    if original.is_file():
        original_manifest=json.loads(original.with_suffix('.manifest.json').read_text())
        rows={r['name']:r for r in original_manifest['definitions']}
        assert all(rows[k]['status']=='source-first' for k in ('OutputFileCounter','capturecounter'))
        assert rows['OutputFileCounter'].get('header_record_factory')
        assert 'this.count = ' in original.read_text()
    print(f'PASS default-member constructor from source AST: 256 native/Node cases, {checked} Chromium cases, original screenshot record emitted')
