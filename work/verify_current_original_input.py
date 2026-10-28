"""Exercise original input readers against their existing source-owned globals."""
import hashlib,json,os
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];target='factory-output/source-first/oct20-engine-preinit-browser'
def cells(source):
    d=json.loads((ROOT/target/(source+'.manifest.json')).read_text())
    return {r['name']:r['global_storage']['binding'] for r in d['definitions'] if r.get('global_storage')}
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'),headless=True)
    page=browser.new_page();page.goto('http://127.0.0.1:8765/runtime/index.mjs')
    result=page.evaluate('''async ({target,bc,sc})=>{
      const b=await import('/'+target+'/source/build/src/baselayer.cpp.mjs');
      const s=await import('/'+target+'/source/build/src/sdlayer.cpp.mjs');
      const set=(m,c,n,v)=>{m[c[n]]().value=v;};let checked=0;
      for(let mask=0;mask<8;mask++){
        set(b,bc,'g_mouseEnabled',!!(mask&1));set(b,bc,'g_mouseGrabbed',!!(mask&2));set(s,sc,'appactive',mask&4?1:0);
        const pos=b[bc.g_mousePos]().value;pos.x=73;pos.y=-21;
        const x={__cReference:true,value:999},y={__cReference:true,value:999};b.mouseReadPos(x,y);
        const active=mask===7;
        if(x.value!==(active?73:0)||y.value!==(active?-21:0))throw Error('Original mouse reader gates differ');
        if(pos.x!==(active?0:73)||pos.y!==(active?0:-21))throw Error('Original mouse delta consumption differs');
        checked++;
      }
      const joystick=b[bc.joystick]().value;joystick.bits=0x1234;
      for(const active of [0,1]){set(s,sc,'appactive',active);const out={__cReference:true,value:-1};b.joyReadButtons(out);
        if(out.value!==(active?0x1234:0))throw Error('Original controller reader differs');checked++;}
      return {checked,source_owned_storage:true,browser_events_to_game_loop_verified:false};
    }''',{'target':target,'bc':cells('source/build/src/baselayer.cpp'),'sc':cells('source/build/src/sdlayer.cpp')})
    report={'passed':result['checked']==10,'result':result,'browser_version':browser.version,
        'module_sha256':hashlib.sha256((ROOT/target/'source/build/src/baselayer.cpp.mjs').read_bytes()).hexdigest(),
        'gameplay_verified':False,'native_comparison_performed':False}
    browser.close()
(ROOT/'reports/oct21-integrated-original-input.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2));assert report['passed']
