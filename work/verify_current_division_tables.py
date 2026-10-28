"""Execute the integrated original initializer and compare every table entry."""
import json,os,hashlib
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
target='factory-output/source-first/oct20-engine-preinit-browser'
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'),headless=True)
    page=browser.new_page();page.goto('http://127.0.0.1:8765/runtime/index.mjs')
    result=page.evaluate('''async target=>{
      const p=await import('/'+target+'/source/build/src/pragmas.cpp.mjs');
      const l=await import('/runtime/libdivide_abi.mjs');
      const tables=['divtable64','divtable32','bfdivtable64','bfdivtable32'];
      const gens=['libdivide_s64_gen','libdivide_s32_gen','libdivide_s64_branchfree_gen','libdivide_s32_branchfree_gen'];
      const before=tables.map(name=>p[name]);let checked=0;
      for(let run=0;run<2;run++){
        p.initdivtables();
        for(let j=0;j<4;j++){
          if(p[tables[j]]!==before[j]||p[tables[j]].length!==16384)throw Error('Original table storage identity changed');
          for(let i=1;i<16384;i++){
            const want=l[gens[j]](j%2===0?BigInt(i):i),got=p[tables[j]][i];
            if(BigInt(want.magic)!==BigInt(got.magic)||want.more!==got.more)throw Error('Original division table mismatch');
            checked++;
          }
        }
      }
      return {checked,original_storage_preserved:true,repeatable:true};
    }''',target)
    report={'passed':result['checked']==131064,'result':result,'browser_version':browser.version,
        'module_sha256':hashlib.sha256((ROOT/target/'source/build/src/pragmas.cpp.mjs').read_bytes()).hexdigest(),
        'comparison':'Existing libdivide browser service, previously checked against original native header',
        'gameplay_verified':False}
    browser.close()
(ROOT/'reports/oct21-integrated-division-tables.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2));assert report['passed']
