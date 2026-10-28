#!/usr/bin/env python3
"""Original C++ header-defined member-operator closure, native/Node/Chromium parity.

A real source fixture stands in for one translation unit, not gameplay. Also
checks the original EDuke32 game-loop symbol against its pre-fix blocker.
"""
from __future__ import annotations
import asyncio, hashlib, json, shutil, subprocess, sys, tempfile
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[2]
SOURCE='tests/source_factory/member_operator_fixture.cpp'
GAME='source/duke3d/src/game.cpp'
PROBE=ROOT/'factory-output/source-first/startup-probe-method'
REPORT=ROOT/'reports/startup/member-operator-parity.json'

def run(command, timeout=100):
    proc=subprocess.run(command,cwd=ROOT,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,timeout=timeout)
    if proc.returncode:
        raise AssertionError((command,proc.stdout[-900:],proc.stderr[-1800:]))
    return proc.stdout

async def browser_check(code,pairs):
    async with async_playwright() as playwright:
        browser=await playwright.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox'])
        try:
            page=await browser.new_page()
            errors=[]
            page.on('pageerror',lambda err:errors.append(str(err)))
            values=await page.evaluate('''async ({code,pairs}) => {
                const url=URL.createObjectURL(new Blob([code],{type:'text/javascript'}));
                try { const mod=await import(url); return pairs.map(([a,b]) => mod.original_add(a,b)); }
                finally { URL.revokeObjectURL(url); }
            }''',{'code':code,'pairs':pairs})
            assert not errors,errors
            return values
        finally:await browser.close()

async def main():
    with tempfile.TemporaryDirectory(prefix='eduke_member_operator_') as directory:
        folder=Path(directory)
        out=folder/'out'
        run([sys.executable,'tools/source_ast_to_js.py','--root',str(ROOT),
             '--source',SOURCE,'--filter','original_add','--out-dir',str(out)])
        module=out/(SOURCE+'.mjs')
        manifest=json.loads(module.with_suffix('.manifest.json').read_text())
        assert manifest['member_operator_closure']['proven']==['Accumulator'],manifest['member_operator_closure']
        assert {d['name'] for d in manifest['definitions'] if d['status']=='source-first'}=={'Accumulator','original_add'}
        run(['node','--check',str(module)])
        # In addition to positive/negative arithmetic, test 32-bit signed wrap
        # permitted by the fixture's intentionally unsigned-safe small domain.
        pairs=[[a,b] for a in range(-25,26,5) for b in range(-25,26,5)]
        (folder/'main.cpp').write_text('''#include <cstdio>
extern "C" int original_add(int,int);
int main(){for(int a=-25;a<=25;a+=5)for(int b=-25;b<=25;b+=5)printf("%d\\n",original_add(a,b));}
''')
        run(['clang++','-std=c++14',SOURCE,str(folder/'main.cpp'),'-o',str(folder/'native')])
        native=[int(x) for x in run([str(folder/'native')]).splitlines()]
        driver=folder/'driver.mjs'
        driver.write_text('import {original_add} from '+json.dumps(module.as_uri())+';\n'
                          +'for(let a=-25;a<=25;a+=5)for(let b=-25;b<=25;b+=5) console.log(original_add(a,b));\n')
        node=[int(x) for x in run(['node',str(driver)]).splitlines()]
        browser=await browser_check(module.read_text(),pairs)
        assert native==node==browser,(native,node,browser)
        game_manifest_path=PROBE/(GAME+'.manifest.json')
        game_manifest=json.loads(game_manifest_path.read_text())
        assert 'ClockTicks' in {d['name'] for d in game_manifest['definitions'] if d['status']=='source-first'}
        loop=next(d for d in game_manifest['definitions'] if d['name']=='G_DoMoveThings')
        assert loop['reason'].startswith('unlinked identifiers:') and 'ClockTicks' not in loop['reason'],loop
        # Check the exact original-source ClockTicks class on a few cases;
        # this is not a gameplay invocation, since the game loop isn't linked.
        game_module=(PROBE/(GAME+'.mjs')).read_text()
        game_checks=await browser_clockticks(game_module)
        assert game_checks==['65536','-65536','-131072'],game_checks
        REPORT.parent.mkdir(parents=True,exist_ok=True)
        proof={'format':'original-source-member-operator-closure/1','status':'PASS',
               'fixture_native_node_chromium_equal':True,'fixture_cases':len(pairs),
               'original_header':'source/build/include/clockticks.hpp',
               'header_class_recovered':'ClockTicks','game_loop_emitted':False,
               'game_loop_next_blocker':loop['reason'],
               'original_app_main_linked':False,'playable_game_verified':False,
               'generated_module_sha256':hashlib.sha256(game_module.encode()).hexdigest(),
               'chromium_clockticks_scale16':game_checks}
        REPORT.write_text(json.dumps(proof,indent=2)+'\n')
        print(json.dumps(proof,indent=2))

async def browser_clockticks(game_code):
    async with async_playwright() as playwright:
        browser=await playwright.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox'])
        try:
            page=await browser.new_page()
            return await page.evaluate('''async source => {
                const url=URL.createObjectURL(new Blob([source],{type:'text/javascript'}));
                try { const {ClockTicks}=await import(url);
                  return [ClockTicks.__cxx_construct_8716ed38f1dfa06d(1).toScale16(),
                          ClockTicks.__cxx_construct_8716ed38f1dfa06d(-1).toScale16(),
                          ClockTicks.__cxx_construct_8716ed38f1dfa06d(-2).toScale16()].map(String);
                } finally { URL.revokeObjectURL(url); }
            }''',game_code)
        finally:await browser.close()

if __name__=='__main__':asyncio.run(main())
