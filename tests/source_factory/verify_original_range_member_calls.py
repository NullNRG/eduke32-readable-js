#!/usr/bin/env python3
"""C++ record references passed as field values: exact native/Node/Chromium parity.

A source object may be aliased by `auto&`, but only field reads passed by value
are lowered. Reference parameters and field-address escapes remain blocked.
"""
import asyncio,json,shutil,subprocess,sys,tempfile
from pathlib import Path
from playwright.async_api import async_playwright
from verify_browser_closure_chromium import inline_graph
ROOT=Path(__file__).resolve().parents[2]
SOURCE='tests/source_factory/source_first_range_member_call_fixture.cpp'
OUT='factory-output/source-first/range-member-call'
REPORT=ROOT/'reports/browser-target/range-member-call-parity.json'
def run(cmd):
    p=subprocess.run(cmd,cwd=ROOT,capture_output=True,text=True,timeout=35)
    assert p.returncode==0,(cmd,p.stdout[-1500:],p.stderr[-1500:])
    return p.stdout
async def main():
    run([sys.executable,'tools/source_ast_to_js.py','--root','.','--source',SOURCE,
         '--filter','range_member_call','--dependency-closure','--out-dir',OUT])
    manifest=json.loads((ROOT/OUT/(SOURCE+'.manifest.json')).read_text())
    by_name={d['name']:d for d in manifest['definitions']}
    assert by_name['range_member_call_safe']['status']=='source-first'
    for name in ('range_member_call_unsafe_address','range_member_call_unsafe_reference'):
        assert by_name[name]['status']=='blocked' and 'reference escapes' in by_name[name]['reason']
    generated=ROOT/OUT/(SOURCE+'.mjs')
    run(['node','--check',str(generated)])
    with tempfile.TemporaryDirectory() as folder:
        tmp=Path(folder)
        driver=tmp/'native.cpp'
        driver.write_text('''#include <cstdio>\nextern "C" int range_member_call_safe(int);\nint main(){for(int i=-256;i<=256;i++)printf("%d\\n",range_member_call_safe(i));}\n''')
        exe=tmp/'native'
        run(['clang++','-std=c++17',str(ROOT/SOURCE),str(driver),'-o',str(exe)])
        expected=[int(x) for x in run([str(exe)]).splitlines()]
    expr='''import {range_member_call_safe} from '''+json.dumps(generated.as_uri())+'''; console.log(JSON.stringify(Array.from({length:513},(_,i)=>range_member_call_safe(i-256))));'''
    node=json.loads(run(['node','--input-type=module','-e',expr]));assert node==expected
    urls=inline_graph({'source':OUT+'/'+SOURCE+'.mjs'})
    errors=[]
    async with async_playwright() as playwright:
        browser=await playwright.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox'])
        try:
            page=await browser.new_page()
            page.on('pageerror',lambda error:errors.append(str(error)))
            await page.set_content('<html><body>Source record reference test</body></html>')
            chromium=await page.evaluate('''async urls=>{const {range_member_call_safe}=await import(urls.source);
                return Array.from({length:513},(_,i)=>range_member_call_safe(i-256));}''',urls)
        finally:await browser.close()
    assert chromium==expected and not errors,(errors,chromium[:3])
    outcome={'status':'PASS','native_node_chromium_matches':513,
             'original_Cpp_unsafe_reference_rejected':True,'original_Cpp_unsafe_address_rejected':True,
             'duke_G_InitDynamicNames_emitted':False,'original_gameplay_verified':False}
    REPORT.parent.mkdir(parents=True,exist_ok=True);REPORT.write_text(json.dumps(outcome,indent=2)+'\n')
    print(json.dumps(outcome,indent=2))
if __name__=='__main__':asyncio.run(main())
