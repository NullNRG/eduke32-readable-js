#!/usr/bin/env python3
"""Build a single-file diagnostic for *original* Build initdivtables JS."""
import json,html
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
MODULE=ROOT/'factory-output/source-first/browser-target/source/build/src/pragmas.cpp.mjs'
ABI=ROOT/'runtime/libdivide_abi.mjs'
OUT=Path('/mnt/data/EDuke32_Original_Division_Startup_Check.html')
def js_json(s):return json.dumps(s).replace('</','<\\/')
page='''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>EDuke32 Original Division Startup Check</title>
<style>body{background:#111720;color:#e8effb;font:16px/1.5 system-ui,sans-serif;margin:0 auto;padding:32px 20px;max-width:860px}h1{margin:0 0 .4em;color:#f5c753}p{color:#b3bed0}button{background:#f5c753;border:0;border-radius:7px;padding:11px 18px;font-size:16px;font-weight:700;cursor:pointer}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#212e40;border-radius:8px;padding:18px}#state{font-weight:bold}small{color:#a6b1c4}</style>
<h1>EDuke32 · original Build division initializer</h1>
<p>This executes source-generated <code>pragmas.cpp::initdivtables()</code> and checks all 65,532 nonzero-divisor records. It is <b>not a playable game</b>.</p><button id="run">Run source check</button><p id="state">Ready</p><pre id="results">Click Run source check.</pre><small>Contains the original translated initializer and native-JavaScript libdivide generator library. No external network dependencies.</small>
<script type="module">
const library=LIB_SOURCE;
const source=GAME_SOURCE;
const run=document.getElementById('run'), state=document.getElementById('state'), log=document.getElementById('results');
run.onclick=async()=>{
 run.disabled=true;state.textContent='Running original source…';const t=performance.now();
 let libUrl=null,modUrl=null;
 try{
  libUrl=URL.createObjectURL(new Blob([library],{type:'text/javascript'}));
  modUrl=URL.createObjectURL(new Blob([source.replaceAll('../../../browser-abi/libdivide_provider.mjs',libUrl)],{type:'text/javascript'}));
  const p=await import(modUrl),l=await import(libUrl);
  const names=['divtable64','divtable32','bfdivtable64','bfdivtable32'];
  const gens=['libdivide_s64_gen','libdivide_s32_gen','libdivide_s64_branchfree_gen','libdivide_s32_branchfree_gen'];
  let checked=0;
  for(let repeat=0;repeat<2;repeat++){
   p.initdivtables();
   for(let j=0;j<4;j++){
    const a=p[names[j]];if(a.length!==16384)throw Error('table extent mismatch: '+names[j]);
    if(BigInt(a[0].magic)!==0n||a[0].more!==0)throw Error('zero divisor slot overwritten');
    for(let i=1;i<16384;i++){
     const want=l[gens[j]](j%2===0?BigInt(i):i),got=a[i];
     if(BigInt(got.magic)!==BigInt(want.magic)||got.more!==want.more)
       throw Error(`Bad original record ${names[j]}[${i}]`);
     checked++;
    }
   }
  }
  state.textContent='PASS — original initializer executed';
  log.textContent=JSON.stringify({status:'PASS',source:'source/build/src/pragmas.cpp::initdivtables',
    initializedTableRecords:4*16384,verifiedNonzeroRecords:checked/2,repeatedCalls:2,
    observedRecordComparisons:checked,lastS64Magic:p.divtable64[16383].magic.toString(),
    elapsedMilliseconds:Math.round(performance.now()-t),originalGameBootVerified:false},null,2);
 }catch(error){state.textContent='FAIL';log.textContent=String(error?.stack||error);}
 finally{if(modUrl)URL.revokeObjectURL(modUrl);if(libUrl)URL.revokeObjectURL(libUrl);run.disabled=false;}
};
</script></html>'''
page=page.replace('LIB_SOURCE',js_json(ABI.read_text())).replace('GAME_SOURCE',js_json(MODULE.read_text()))
OUT.write_text(page)
print(str(OUT),OUT.stat().st_size)
