#!/usr/bin/env python3
"""Chromium byte-alias/type-shape checks for recovered original static globals.

These are initialization/data-storage tests, NOT gameplay/link/runtime acceptance.
"""
import asyncio,json,shutil
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[2]
async def main():
    async with async_playwright() as p:
        browser=await p.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox'])
        try:
            page=await browser.new_page()
            errors=[]
            page.on('pageerror',lambda e:errors.append(str(e)))
            await page.set_content((ROOT/'dist/force-test.html').read_text(),wait_until='domcontentloaded')
            results=await page.evaluate('''async () => {
              await window.__edukeForce.forceRun();
              const mods=window.__edukeForce.modules;
              const module=name=>mods.get('source/'+name+'.mjs');
              const vec=module('build/src/2d.cpp').m32_viewplane;
              vec.x=2147483648;vec.y=-1024;vec.z=77;
              const vector={x:vec.x,xyx:vec.xy.x,y:vec.y,xyy:vec.xy.y,z:vec.z,u:vec.u};
              vec.xy.x=83;
              vector.writeThrough=vec.x;
              const game=module('duke3d/src/gameexec.cpp');
              const sprite=game.dummy_sprite;
              sprite.x=201;sprite.xyz.y=-37;sprite.xy.x=814;sprite.xvel=-222;sprite.vel.y=734;sprite.extra=-32;
              const spriteProbe={x:sprite.x,xyx:sprite.xy.x,xyzx:sprite.xyz.x,y:sprite.y,xyzY:sprite.xyz.y,xvel:sprite.xvel,velx:sprite.vel.x,yvel:sprite.yvel,extra:sprite.extra};
              const joystick=module('build/src/baselayer.cpp').joystick;
              joystick.flags=0;joystick.hasRumble=1;joystick.isGameController=1;
              const flags={bits:joystick.flags,rumble:joystick.hasRumble,game:joystick.isGameController};
              joystick.isGameController=0;flags.afterClear=joystick.flags;
              const ud=module('duke3d/src/global.cpp').ud;
              ud.camerapos.x=15;ud.camerapos.xy.y=-32;
              const globals={cameraX:ud.camerapos.xy.x,cameraY:ud.camerapos.y,keyboardRows:ud.config.KeyboardKeys.length,setupXdim:ud.setup.xdim};
              const voice=module('audiolib/src/multivoc.cpp').VoiceList;
              const ptr=new Uint8Array([1,2]);voice.NextBlock=ptr;
              const voiceProbe={alias:voice.DemandFeed===ptr,loopStart:voice.Loop.Start,emptyTask:voice.task.internal_task,paused:voice.Paused};
              return {count:__edukeForce.result.results.length,failed:__edukeForce.result.results.filter(x=>x.status==='failed').length,vector,sprite:spriteProbe,flags,globals,voice:voiceProbe,appMainAvailable:__edukeForce.result.boot.entryEmitted};
            }''')
            assert results['count']==151 and results['failed']==0,results
            assert results['vector']=={'x':-2147483648,'xyx':-2147483648,'y':-1024,'xyy':-1024,'z':77,'u':-1024,'writeThrough':83},results['vector']
            assert results['sprite']=={'x':814,'xyx':814,'xyzx':814,'y':-37,'xyzY':-37,'xvel':-222,'velx':-222,'yvel':734,'extra':-32},results['sprite']
            assert results['flags']=={'bits':3,'rumble':1,'game':1,'afterClear':2},results['flags']
            assert results['globals']['cameraX']==15 and results['globals']['cameraY']==-32,results['globals']
            assert results['globals']['keyboardRows']>20,results['globals']
            assert results['voice']=={'alias':True,'loopStart':None,'emptyTask':None,'paused':0},results['voice']
            assert not results['appMainAvailable']
            assert not errors,errors
            destination=ROOT/'reports/fix14/browser-record-parity.json'
            destination.write_text(json.dumps({'status':'PASS_INITIALIZATION_LAYOUT_ONLY','observed':results,'pageExceptions':errors,'gameplayVerified':False},indent=2)+'\n')
            print(json.dumps({'status':'PASS_INITIALIZATION_LAYOUT_ONLY',**results},indent=2))
        finally:await browser.close()
if __name__=='__main__':asyncio.run(main())
