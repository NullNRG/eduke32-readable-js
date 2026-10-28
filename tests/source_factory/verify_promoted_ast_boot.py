#!/usr/bin/env python3
"""Execute source-generated original Build/Duke functions in real Chromium.

This is a startup-function test, NEVER a gameplay/playability claim.
"""
import json,subprocess
from pathlib import Path
from urllib.parse import unquote,urlparse
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2]
TARGET=ROOT/'factory-output/source-first/browser-target'
for f in ('duke3d/src/sounds.cpp.mjs','build/src/vfs.cpp.mjs'):
 subprocess.run(['node','--check',str(TARGET/'source'/f)],check=True,timeout=15,capture_output=True)
errs=[]
def fulfill(route):
 pth=unquote(urlparse(route.request.url).path)
 if pth=='/':route.fulfill(status=200,content_type='text/html',body='<html>EDuke original startup-function regression</html>');return
 p=(TARGET/pth.lstrip('/')).resolve()
 if not p.is_relative_to(TARGET.resolve()) or not p.is_file():
  errs.append('unresolved dependency '+pth);route.fulfill(status=404,body='missing');return
 route.fulfill(status=200,content_type='text/javascript',body=p.read_bytes())
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 try:
  pg=browser.new_page();pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.route('https://sourcefactory.invalid/**',fulfill)
  pg.goto('about:blank')
  got=pg.evaluate('''async()=>{
    const root='https://sourcefactory.invalid/source/';
    const [s,r,v]=await Promise.all([import(root+'duke3d/src/sounds.cpp.mjs'),import(root+'duke3d/src/rts.cpp.mjs'),import(root+'build/src/vfs.cpp.mjs')]);
    if(typeof s.S_ClearSoundLocks!=='function'||typeof v.kclose!=='function')throw Error('Missing original-source exports');
    const sounds=s.__cxx_global_cell_967815c905458390bb332151();
    const max=s.__cxx_global_cell_ee31083067930f45ce0bf187();
    const original={sounds:sounds.value,max:max.value,cache:r.rts_lumplockbyte.slice()};
    const before=[190,200,254,255,199,180,201,240,0,254,255];
    let checks=0;
    try{
      sounds.value=[{value:{lock:200}},{value:{lock:254}},{value:{lock:255}}];max.value=2;
      r.rts_lumplockbyte.set(before);
      s.S_ClearSoundLocks();
      const expected=[190,199,199,255,199,180,199,199,0,199,255];
      for(let i=0;i<expected.length;i++){if(r.rts_lumplockbyte[i]!==expected[i])throw Error('Incorrect original RTS lock '+i);checks++;}
      const locks=sounds.value.map(x=>x.value.lock);
      for(let i=0;i<locks.length;i++){if(locks[i]!==[199,199,255][i])throw Error('Incorrect original sound lock '+i);checks++;}
      v.kclose(-1);checks++;
    }finally{sounds.value=original.sounds;max.value=original.max;r.rts_lumplockbyte.set(original.cache);}
    return {checks,soundExports:Object.keys(s).length,vfsExports:Object.keys(v).length,invalidHandleWasRejectedWithoutCallingOS:true};
  }''')
  assert got['checks']==15,got
  assert not errs,errs
 finally:browser.close()
report={'format':'eduke32-promoted-original-ast-chromium/1','status':'PASS',
        'browser':'Chromium','result':got,'pageErrors':errs,'originalGameplayVerified':False}
out=ROOT/'reports/browser-target/promoted-original-ast-chromium.json'
out.write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
