#!/usr/bin/env python3
"""Clang-backed scoped trivial C++ POD assignment, native/Node/Chromium parity.

The same short record name from different namespaces must not silently share
one JavaScript record schema. Nontrivial user-authored assignment is excluded.
"""
import asyncio, base64, json, shutil, subprocess, sys, tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
COMPILER=ROOT/'tools/source_ast_to_js.py'
SOURCE='''\
#include <stdint.h>
namespace original_math { struct CopyValue { int64_t magnitude; uint8_t weight; }; }
extern "C" int64_t scoped_copy(int64_t v) {
  original_math::CopyValue lhs{v,1};
  original_math::CopyValue rhs{v * 3,7};
  lhs = rhs;
  return lhs.magnitude + lhs.weight;
}
'''
COLLISION='''\
#include <stdint.h>
namespace alpha { struct CopyValue { int64_t magnitude; uint8_t weight; }; }
namespace beta { struct CopyValue { int64_t magnitude; uint8_t weight; int32_t other; }; }
extern "C" int64_t collision(int64_t v) {
  alpha::CopyValue a{v,1}; beta::CopyValue b{v,1,20};
  alpha::CopyValue c=a; a=c;
  return a.magnitude + a.weight + b.other;
}
'''
def run(args,root,timeout=30):
    p=subprocess.run(args,cwd=root,capture_output=True,text=True,timeout=timeout)
    if p.returncode:raise AssertionError((args,p.stdout[-2000:],p.stderr[-2000:]))
    return p.stdout

with tempfile.TemporaryDirectory(prefix='source-scoped-pod-') as temp:
    p=Path(temp);(p/'unit.cpp').write_text(SOURCE)
    values=[-999999,-7,-1,0,1,29,100000]
    (p/'native.cpp').write_text('#include <cstdio>\n#include <stdint.h>\n#include <initializer_list>\nextern "C" int64_t scoped_copy(int64_t);\nint main(){for(auto v:{'+','.join(str(v)+'LL' for v in values)+'}) printf("%lld\\n",(long long)scoped_copy(v));}\n')
    # Use Clang to preserve the same language and ABI semantics as transpiler.
    run(['clang++','-std=c++14','unit.cpp','native.cpp','-o','native'],p)
    expected=run([str(p/'native')],p).splitlines()
    run([sys.executable,str(COMPILER),'--root',str(p),'--source','unit.cpp','--filter','CopyValue,scoped_copy','--out-dir',str(p/'out')],ROOT)
    mod=p/'out/unit.cpp.mjs';doc=json.loads(mod.with_suffix('.manifest.json').read_text())
    rows={r['name']:r for r in doc['definitions']}
    assert rows['scoped_copy']['status']=='source-first',rows['scoped_copy']
    run(['node','--check',str(mod)],p)
    (p/'check.mjs').write_text('import * as m from '+json.dumps(mod.as_uri())+';\n'+
       'for (const n of '+json.dumps(values)+') console.log(String(m.scoped_copy(BigInt(n))));\n')
    result=run(['node','check.mjs'],p).splitlines()
    assert result==expected,(result,expected)
    if shutil.which('chromium'):
        async def check_browser():
            from playwright.async_api import async_playwright
            async with async_playwright() as pw:
                browser=await pw.chromium.launch(executable_path=shutil.which('chromium'),headless=True,
                    args=['--no-sandbox','--disable-gpu-sandbox'])
                try:
                    page=await browser.new_page();await page.set_content('<title>Scoped POD parity</title>')
                    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
                    actual=await page.evaluate('''async args=>{
                        const bytes=Uint8Array.from(atob(args.code),c=>c.charCodeAt(0));
                        const url=URL.createObjectURL(new Blob([bytes],{type:'text/javascript'}));
                        try {const m=await import(url);
                          return args.values.map(v=>String(m.scoped_copy(BigInt(v))));
                        } finally { URL.revokeObjectURL(url); }
                    }''',{'code':base64.b64encode(mod.read_bytes()).decode(),'values':values})
                    assert actual==expected,(actual,expected)
                    assert not errors,errors
                finally:await browser.close()
        asyncio.run(check_browser())
    (p/'unit.cpp').write_text(COLLISION)
    run([sys.executable,str(COMPILER),'--root',str(p),'--source','unit.cpp',
         '--filter','CopyValue,collision','--out-dir',str(p/'ambiguous')],ROOT)
    blocked=json.loads((p/'ambiguous/unit.cpp.manifest.json').read_text())
    row=[r for r in blocked['definitions'] if r['name']=='collision']
    assert row and row[0]['status']=='blocked',row
    print('PASS scoped trivial assignment:',len(values),'native/Node/Chromium cases; ambiguous namespaces blocked')
