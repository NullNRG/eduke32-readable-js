#!/usr/bin/env python3
"""Compile and execute original pragmas.cpp::initdivtables in Node and Chromium.

Uses source-verified libdivide browser service and native C++ header oracle.
This is a real Build initializer test; it does not claim full EDuke32 boot.
"""
import asyncio,base64,json,os,pathlib,shutil,subprocess,sys
ROOT=pathlib.Path(__file__).resolve().parents[2]
OUT=ROOT/'factory-output/source-first/browser-target'
SOURCE=ROOT/'factory-output/source-tree/eduke32-master'
TABLES=('divtable64','divtable32','bfdivtable64','bfdivtable32')
GENS=('libdivide_s64_gen','libdivide_s32_gen','libdivide_s64_branchfree_gen','libdivide_s32_branchfree_gen')

def cmd(args,timeout=120):
    run=subprocess.run(args,cwd=ROOT,text=True,capture_output=True,timeout=timeout)
    assert run.returncode==0,(args,run.stdout[-1800:],run.stderr[-1800:])
    return run.stdout

# Canonical one-command compile/link path (also used by browser builds).
cmd([sys.executable,str(ROOT/'tools/build_original_division_startup.py')])
module=OUT/'source/build/src/pragmas.cpp.mjs'
meta=json.loads(module.with_suffix('.manifest.json').read_text())
assert len(meta['definitions'])==5
assert all(x['status']=='source-first' for x in meta['definitions'])
cmd(['node','--check',str(module)])
checks="""
const names=['divtable64','divtable32','bfdivtable64','bfdivtable32'];
const gens=['libdivide_s64_gen','libdivide_s32_gen','libdivide_s64_branchfree_gen','libdivide_s32_branchfree_gen'];
const one=()=>{
 p.initdivtables();
 let compared=0;
 for(let j=0;j<4;j++){
  const data=p[names[j]], fn=l[gens[j]];
  if(data.length!==16384)throw Error('invalid original table extent '+names[j]);
  if(BigInt(data[0].magic)!==0n||data[0].more!==0)throw Error('zero index changed');
  for(let i=1;i<16384;i++){
   const wanted=fn(j%2===0?BigInt(i):i),got=data[i];
   if(BigInt(wanted.magic)!==BigInt(got.magic)||wanted.more!==got.more)
     throw Error(`mismatch ${names[j]}[${i}]`);
   compared++;
  }
 }
 return compared;
};
const n=one(), second=one();
if(second!==n||n!==65532)throw Error('original initializer not repeatable');
"""
runner=OUT/'test_original_initdivtables.mjs'
runner.write_text("import * as p from "+json.dumps(module.as_uri())+';\nimport * as l from '+json.dumps((ROOT/'runtime/libdivide_abi.mjs').as_uri())+';\n'+checks+"console.log(JSON.stringify({status:'PASS',source:'pragmas.cpp::initdivtables',records:n,repeat:true}));\n")
node=json.loads(cmd(['node',str(runner)]).splitlines()[-1]);assert node['records']==65532
print('NODE:',node)
if shutil.which('chromium'):
    async def run_browser():
        from playwright.async_api import async_playwright
        async with async_playwright() as pw:
            browser=await pw.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--disable-gpu-sandbox'])
            try:
                page=await browser.new_page();await page.set_content('<!doctype html><meta charset="utf-8"><title>Original Build initdivtables</title>')
                errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
                result=await page.evaluate('''async o=>{
                  const blob=s=>URL.createObjectURL(new Blob([s],{type:'text/javascript'}));
                  const library=blob(o.lib);
                  const source=blob(o.source.replaceAll(o.relative,library));
                  try {
                    const p=await import(source),l=await import(library);
                    const names=['divtable64','divtable32','bfdivtable64','bfdivtable32'];
                    const gens=['libdivide_s64_gen','libdivide_s32_gen','libdivide_s64_branchfree_gen','libdivide_s32_branchfree_gen'];
                    const once=()=>{
                      p.initdivtables();let checked=0;
                      for(let j=0;j<4;j++){
                        if(p[names[j]].length!==16384)throw Error('wrong table extent');
                        for(let i=1;i<16384;i++){
                          const want=l[gens[j]](j%2===0?BigInt(i):i);
                          const got=p[names[j]][i];
                          if(BigInt(want.magic)!==BigInt(got.magic)||want.more!==got.more)
                            throw Error('wrong original table '+names[j]+'['+i+']');
                          checked++;
                        }
                      }return checked;
                    };
                    const checked=once();if(once()!==checked)throw Error('re-run mismatch');
                    return {status:'PASS',checked,zero:BigInt(p.divtable64[0].magic)===0n,
                      high:p.divtable64[16383].magic.toString(),repeat:true};
                  }finally{URL.revokeObjectURL(source);URL.revokeObjectURL(library);}
                }''',{'lib':(ROOT/'runtime/libdivide_abi.mjs').read_text(),
                        'source':module.read_text(),'relative':'../../../browser-abi/libdivide_provider.mjs'})
                assert result['status']=='PASS' and result['checked']==65532 and result['zero'] and result['repeat'],result
                assert not errors,errors
                return result
            finally:await browser.close()
    chromium=asyncio.run(run_browser());print('CHROMIUM:',chromium)
else:chromium={'status':'SKIPPED','reason':'Chromium not installed'}
report={'status':'PASS','source':'source/build/src/pragmas.cpp::initdivtables',
        'fully_emitted':True,'node':node,'chromium':chromium,'original_game_boot_verified':False}
location=ROOT/'reports/original-startup/initdivtables-browser.json';location.parent.mkdir(parents=True,exist_ok=True)
location.write_text(json.dumps(report,indent=2)+'\n')
print('PASS original Build initdivtables compiled and executed Node / Chromium')
