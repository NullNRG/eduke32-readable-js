#!/usr/bin/env python3
"""Real Chromium exercise of Clang-transpiled original EDuke32 static globals.

This verifies original variable declarations and native JS storage, NOT gameplay.
Only source-backed Clang output is imported; no engine/gameplay is synthesized.
"""
import asyncio
import json
import os
import shutil
import subprocess
import sys
from hashlib import sha256
from pathlib import Path
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[2]
SOURCE = 'source/duke3d/src/global.cpp'
SRC = ROOT / 'factory-output/source-tree/eduke32-master'
OUTPUT = ROOT / 'factory-output/source-first/browser-original-globals'
MODULE = OUTPUT / (SOURCE+'.mjs')
REPORT = ROOT / 'reports/browser-original-globals.json'

async def main():
    from playwright.async_api import async_playwright
    names = 'g_player_s,g_player,playerdata_t,input_t,g_volumeNames,g_skillNames,g_gametypeNames'
    command = [sys.executable, str(ROOT / 'tools/source_ast_to_js.py'),
               '--root',str(SRC),'--source', SOURCE,'--out-dir',str(OUTPUT),
               '--filter',names]
    proc = subprocess.run(command,cwd=ROOT,text=True,capture_output=True,timeout=150)
    if proc.returncode:
        raise RuntimeError('original AST compile failed: '+(proc.stdout+proc.stderr)[-2000:])
    manifest = json.loads(MODULE.with_suffix('.manifest.json').read_text())
    proofs = {item['source_name']:item for item in manifest['definitions']}
    for name in ('g_player_s','g_player','g_volumeNames','g_skillNames','g_gametypeNames'):
        assert proofs[name]['status']=='source-first',proofs[name]
    check = subprocess.run(['node','--check',str(MODULE)],capture_output=True,text=True,timeout=15)
    assert check.returncode==0,check.stderr
    # Browser imports the exact source-derived ES module. Offline import is
    # network-independent; it does not inject fake variables or emulate Duke.
    from verify_real_browser_runtime import offline_module_uri
    uri = offline_module_uri(MODULE)
    executable=os.environ.get('EDUKE_CHROMIUM_EXECUTABLE') or shutil.which('chromium') or shutil.which('google-chrome')
    if not executable:
        raise RuntimeError('Chromium unavailable; original browser verification not passed')
    report={'format':'eduke32-original-source-global-browser/1',
            'timestamp_utc':datetime.now(timezone.utc).isoformat(),
            'source':SOURCE,'generated_module':str(MODULE.relative_to(ROOT)),
            'source_module_sha256':sha256(MODULE.read_bytes()).hexdigest(),
            'original_game_playable_verified':False,'checks':{},'errors':[]}
    async with async_playwright() as playwright:
        browser=await playwright.chromium.launch(executable_path=executable,
             args=['--no-sandbox','--disable-gpu'])
        try:
            page=await browser.new_page()
            page.on('pageerror',lambda err:report['errors'].append(str(err)))
            await page.set_content('<!DOCTYPE html><title>Original EDuke32 storage regression</title>')
            result=await page.evaluate('''async uri => {
              const g=await import(uri);
              const key=Object.keys(g).find(n=>n.startsWith('g_player_s__header_global_'));
              if (!key)throw Error('missing original player array');
              const slots=g[key], player=g.g_player;
              if(slots.length!==17||player.__cReference!==true||player.value!==slots[1])
                throw Error('original interior pointer/array ownership broken');
              if(typeof slots[1].lastViewUpdate!=='bigint'||slots[1].lastViewUpdate!==0n)
                throw Error('LP64 unsigned long ABI broken');
              if(slots.some(item=>item.ps!==null||item.input.bits!==0||item.frags.length!==16))
                throw Error('zero-initialized original static player data differs');
              slots[1].ping=321;
              if(player.value.ping!==321||slots[0].ping!==0||slots[2].ping!==0)
                throw Error('player pointer mutation aliases another player');
              const chars=row=>Array.from(row).map(n=>String.fromCharCode(n)).join('').split('\\0')[0];
              const tables={volume:g.g_volumeNames,skill:g.g_skillNames,gametype:g.g_gametypeNames};
              for(const table of Object.values(tables)){
                if(!table.every(row=>row instanceof Uint8Array&&row.length===33))
                  throw Error('char table width/ABI mismatch');
              }
              if(chars(tables.volume[0])!=='L.A. Meltdown'||
                 chars(tables.volume[1])!=='Lunar Apocalypse'||
                 chars(tables.skill[0])!=='Piece Of Cake'||
                 chars(tables.gametype[0])!=='DukeMatch (Spawn)')
                throw Error('original C source strings differ');
              const untouched=tables.volume[1][0];
              tables.volume[0][0]=77;
              if(tables.volume[1][0]!==untouched)throw Error('char rows share storage');
              return {playerArraySlots:slots.length,playerPointerIndex:1,
                lp64Zero:String(slots[1].lastViewUpdate),tableRows:Object.fromEntries(
                  Object.entries(tables).map(([k,v])=>[k,v.length])),
                tableWidth:33,stableRows:true,playerPointerIdentity:true};
            }''',uri)
            assert not report['errors'],report['errors']
            report['checks']={'original_player_interior_pointer':'passed',
                'original_static_player_zero_init_lp64':'passed',
                'original_byte_string_tables':'passed',
                'independent_array_rows':'passed',
                'no_page_exceptions':'passed'}
            report['measured']=result
            report['status']='PASSED_ORIGINAL_GLOBALS_ONLY'
        finally:
            await browser.close()
    REPORT.parent.mkdir(parents=True,exist_ok=True)
    REPORT.write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2))
    print('NOTE: this does not prove original app_main, level loading or gameplay')

if __name__=='__main__':
    asyncio.run(main())
