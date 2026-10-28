#!/usr/bin/env python3
"""Run original source-compiled G_CheckGametype in real Chromium with test-owned state.
The TEST state simulates selected game globals; the function body itself is
unchanged Clang-generated source, linked to the implemented browser Loguru.
This is not a game boot test.
"""
from pathlib import Path
import json,re
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2]
module=ROOT/'factory-output/source-first/browser-target/source/duke3d/src/game.cpp.mjs'
logger=ROOT/'runtime/browser_loguru.mjs'
source=module.read_text().split('// SOURCEFACTORY_VERIFIED_REEXPORT_BEGIN')[0];provider=logger.read_text()
assert 'export function G_CheckGametype' in source
assert 'loguru_log' in source
assert re.search(r'export function clamp__header_',source)
source=re.sub(r'^import\s+.*?;\s*$', '',source,flags=re.M)
source=re.sub(r'^export\s+', '',source,flags=re.M)
provider=re.sub(r'^export\s+', '',provider,flags=re.M)
script='''(input) => {
  const calls=[];
  const originalInfo=console.info;
  try {
    console.info = value => calls.push(value);
    const loguru_log = new Function(input.provider + ';return loguru_log;')();
    const byte = str => new TextEncoder().encode(str+'\\0');
    const ud={m_coop:99,m_respawn_inventory:0,m_respawn_items:0};
    const g_gametypeNames=[byte('DUKEMATCH'),byte('COOP'),byte('TEAM')];
    const g_gametypeFlags=Int32Array.from([0,1024,0]);
    const __cxx_global_cell_b0597697bdbf1bdf4de5ac94=()=>({value:3});
    const current_verbosity_cutoff=()=>0;
    const api=new Function('ud','g_gametypeNames','g_gametypeFlags',
      '__cxx_global_cell_b0597697bdbf1bdf4de5ac94','current_verbosity_cutoff',
      'loguru_log',input.source+';return {G_CheckGametype};')(
        ud,g_gametypeNames,g_gametypeFlags,
        __cxx_global_cell_b0597697bdbf1bdf4de5ac94,current_verbosity_cutoff,loguru_log);
    api.G_CheckGametype();
    const bounded=ud.m_coop===2&&ud.m_respawn_items===0;
    ud.m_coop=1;
    api.G_CheckGametype();
    return {bounded, m_coop:ud.m_coop,items:ud.m_respawn_items,
      inventory:ud.m_respawn_inventory,calls};
  } finally {console.info=originalInfo;}
}'''
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    try:
        page=browser.new_page()
        page.goto('about:blank')
        result=page.evaluate(script,{'source':source,'provider':provider})
        assert result['bounded'] and result['m_coop']==1
        assert result['items']==1 and result['inventory']==1
        assert len(result['calls'])==2, result
        assert result['calls'][1].endswith('COOP'), result
    finally: browser.close()
print(json.dumps({'status':'PASS','browser':'Chromium','originalSourceFunction':'G_CheckGametype',
                  'gameplayVerified':False,'result':result},indent=2))
