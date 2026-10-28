#!/usr/bin/env python3
"""Package original-source JS modules into an instrumented, offline browser force-run.

A force-run is NOT a game build: it executes available emitted ES modules,
loads real GRP bytes through the original browser VFS, and fails visibly on
incomplete boot linking. Never replace the strict gameplay acceptance gate.
"""
from __future__ import annotations
import argparse, base64, hashlib, html, json, re
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
DEFAULT = ROOT/'factory-output/source-first/accelerated-global-link'

def build(source:Path, out:Path):
    manifest_path = source/'global-recovery.json'
    if not manifest_path.is_file():raise FileNotFoundError(manifest_path)
    global_manifest=json.loads(manifest_path.read_text())
    modules=sorted(source.rglob('*.mjs'))
    if len(modules)<1:raise ValueError('No compiled original source modules found')
    entries=[];payload=[]
    for mod in modules:
        content=mod.read_bytes()
        rel=mod.relative_to(source).as_posix()
        entries.append({'path':rel,'bytes':len(content),'sha256':hashlib.sha256(content).hexdigest()})
        payload.append(f'<script type="application/x-eduke-module" data-module="{html.escape(rel,quote=True)}">'
                       +base64.b64encode(content).decode('ascii')+'</script>')
    vfs=ROOT/'runtime/filesystem.mjs'
    payload.append('<script type="application/x-eduke-vfs" id="real-vfs">'+base64.b64encode(vfs.read_bytes()).decode('ascii')+'</script>')
    boot_info = {
        'entry':'app_main', 'entryEmitted':False, 'linkedGame':bool(global_manifest.get('full_game_linked',False)),
        'compiledUnits':global_manifest.get('completed_source_units'),
        'blockedDefinitions':global_manifest.get('total_blocked_definitions'),
        'invalidImports':len(global_manifest.get('invalid_imports_or_syntax',[])),
        'ambiguousOwners':len(global_manifest.get('ambiguous_export_names',{})),
        'moduleCount':len(modules),
    }
    # Prove status from actual sources rather than trusting a narrative handoff.
    boot_info['entryEmitted']=any(bool(re.search(rb'^export\s+(?:async\s+)?function\s+app_main\s*\(',m.read_bytes(),re.M)) for m in modules)
    bridge='https://digitalcybersoft.github.io/eduke32-wasm/'
    page='''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>EDuke32 Native-JS Force Run / Source Diagnostics</title>
<style>
:root{color-scheme:dark;font:15px/1.45 system-ui, sans-serif;background:#0a101a;color:#e8edf6}*{box-sizing:border-box}body{max-width:1200px;margin:auto;padding:26px}h1{font-size:clamp(1.5rem,4vw,2.4rem);margin:0}p{color:#b9c6d8}.sub{color:#90a6c1;margin:8px 0 28px}.bar{display:flex;flex-wrap:wrap;gap:9px;align-items:center;margin:18px 0}.panel{border:1px solid #34465e;border-radius:12px;background:#142035;padding:18px;margin:14px 0}.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(155px,1fr));gap:12px}.stat{border:1px solid #34465e;border-radius:9px;padding:13px}.stat strong{display:block;font-size:1.5rem}.stat small{color:#b7c3d1}.warning{color:#ffd38d}.good{color:#9be9c5}.bad{color:#ff9e9e}button,.action{padding:10px 15px;border:1px solid #618db7;border-radius:9px;background:#23527c;color:white;font:inherit;cursor:pointer;text-decoration:none}button:hover,.action:hover{background:#326894}button:disabled{opacity:.45;cursor:wait}input{max-width:100%}code{color:#c4dbff}pre{white-space:pre-wrap;word-break:break-word;background:#08101f;padding:14px;min-height:100px;max-height:390px;overflow:auto;border-radius:9px}.scroll{max-height:350px;overflow:auto}table{border-collapse:collapse;width:100%;font-size:12px}td,th{border-bottom:1px solid #34465e;text-align:left;padding:7px}progress{width:100%;height:15px}.footer{font-size:.9rem}
</style></head><body>
<header><h1>EDuke32 — Native JavaScript Force Run</h1><p class="sub">Offline execution of saved source-generated EDuke32 JavaScript modules (older compiler revision). This is a debugging harness, not a simulated Duke game.</p></header>
<div class="panel"><strong class="warning">Original game boot is currently BLOCKED.</strong> <span id="boot-status"></span><p>The original <code>app_main</code> is not yet linked. Force mode still loads compiled modules, mounts actual DUKE3D.GRP files and executes proven source functions to identify failures, instead of hiding them.</p>
<div class="bar"><button id="force">Force-load every compiled source module</button><button id="boot">Attempt original app_main</button><button id="export">Export results JSON</button></div><progress id="progress" max="1" value="0"></progress></div>
<div class="stats"><div class="stat"><strong id="units">—</strong><small>Saved source units (prior revision)</small></div><div class="stat"><strong id="modules">—</strong><small>Embedded original JS modules</small></div><div class="stat"><strong id="loaded">0</strong><small>Successfully evaluated modules</small></div><div class="stat"><strong id="failed">0</strong><small>Module init failures</small></div></div>
<div class="panel"><h2>Real Duke Nukem 3D data</h2><p>Import your <code>DUKE3D.GRP</code>. The project’s existing native-JS <code>VirtualFS</code> mounts the original archive and reports the authentic MAP, ART and CON files. No fake assets are used.</p><input type="file" id="grp" accept=".grp"><div id="grp-result" class="sub">No GRP mounted.</div></div>
<div class="panel"><h2>Source execution evidence</h2><pre id="console" aria-live="polite"></pre><div class="scroll"><table><thead><tr><th>Original source module</th><th>Evaluation</th><th>Exports</th><th>Details</th></tr></thead><tbody id="result-rows"></tbody></table></div></div>
<div class="panel"><h2>Playable original-engine reference (different technology)</h2><p>An open-source EDuke32 fork already runs in browsers using <strong>WebAssembly plus JavaScript</strong>. It has the actual EDuke32 engine, shareware episode, sound, input, saves, and an option to import your own retail GRP. This is a practical play-now reference, <strong>not</strong> a completed native-JavaScript port.</p><a class="action" target="_blank" rel="noopener noreferrer" href="__BRIDGE__">Open the independently maintained EDuke32 browser port</a><p class="footer">Source: <a href="https://github.com/DigitalCyberSoft/eduke32-wasm" target="_blank" rel="noopener noreferrer">DigitalCyberSoft/eduke32-wasm</a>. Internet required for that external game; this diagnostic page runs offline.</p></div>
__PAYLOAD__
<script>
'use strict';
const boot=__BOOT__;
const sourceNodes=[...document.querySelectorAll('script[data-module]')];
const $=id=>document.getElementById(id);
const result={format:'eduke32-force-source-browser/1',timestamp:new Date().toISOString(),boot,results:[],grp:null,errors:[],originalGameplayVerified:false};
const modules=new Map();
const append=(message)=>{$('console').textContent+=message+'\\n';$('console').scrollTop=$('console').scrollHeight;};
const bytesOf=node=>{const raw=atob(node.textContent.trim());const out=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)out[i]=raw.charCodeAt(i);return out;};
async function importSource(node){const url=URL.createObjectURL(new Blob([bytesOf(node)],{type:'text/javascript'}));try{return await import(url)}finally{URL.revokeObjectURL(url)}}
function setCounts(){ $('loaded').textContent=String(result.results.filter(r=>r.status==='loaded').length);$('failed').textContent=String(result.results.filter(r=>r.status==='failed').length);}
function addRow(row){result.results.push(row);const tr=document.createElement('tr');for(const value of [row.module,row.status,String(row.exports||0),row.error||row.probe||'']){const td=document.createElement('td');td.textContent=value;tr.appendChild(td);} $('result-rows').appendChild(tr);setCounts();}
async function loadOne(node){const name=node.dataset.module;if(modules.has(name))return modules.get(name);try{const mod=await importSource(node);modules.set(name,mod);const row={module:name,status:'loaded',exports:Object.keys(mod).length};if(name.endsWith('duke3d/src/game.cpp.mjs')){const fn=Object.keys(mod).find(k=>/^ksgn__header_/.test(k));if(fn){const actual=[mod[fn](-7),mod[fn](0),mod[fn](7)];row.probe='Original ksgn(-7,0,7): '+actual.join(',');if(actual.join(',')!=='-1,0,1')throw new Error('Original ksgn smoke parity mismatch '+actual.join(','));}}addRow(row);return mod;}catch(err){const row={module:name,status:'failed',error:String(err.stack||err).slice(0,480)};addRow(row);result.errors.push(row);return null;}}
async function forceRun(){ $('force').disabled=true;$('progress').max=sourceNodes.length;try{for(let i=0;i<sourceNodes.length;i++){await loadOne(sourceNodes[i]);$('progress').value=i+1;if(i%5===0)await new Promise(resolve=>setTimeout(resolve,0));}append('SOURCE MODULE EVALUATION FINISHED: '+$('loaded').textContent+' loaded, '+$('failed').textContent+' failed; game linked='+boot.linkedGame); }finally{$('force').disabled=false}}
async function tryBoot(){append('Attempting actual original app_main, without synthetic startup...');if(!boot.entryEmitted){const err='BLOCKED: original app_main was not emitted by the source compiler; cannot execute original game.';append(err);result.errors.push({phase:'app_main',error:err});return;}const item=sourceNodes.find(n=>n.dataset.module.endsWith('/game.cpp.mjs'));if(!item){append('BLOCKED: no original game.cpp JS module');return;}const m=await loadOne(item);if(!m||typeof m.app_main!=='function'){append('BLOCKED: original app_main cannot be loaded');return;}try{const value=m.app_main(0,null);append('app_main returned: '+String(value));}catch(e){append('ORIGINAL STARTUP ERROR: '+String(e.stack||e));result.errors.push({phase:'app_main',error:String(e.stack||e)});}}
async function mountGRP(file){const fsModule=await importSource($('real-vfs'));const vfs=new fsModule.VirtualFS();const buf=new Uint8Array(await file.arrayBuffer());const directory=vfs.mountGRP(buf);const names=['E1L1.MAP','TILES000.ART','GAME.CON','DEFS.CON','USER.CON'];const present=names.filter(x=>vfs.exists(x)).map(x=>x+': '+vfs.size(x)+' bytes');result.grp={filename:file.name,bytes:buf.length,entries:directory.length,present,hasE1L1:vfs.exists('E1L1.MAP')};$('grp-result').textContent='Mounted '+directory.length+' actual source-game archive entries. '+present.join(' | ');append('Real GRP mounted: '+directory.length+' entries; E1L1.MAP='+result.grp.hasE1L1);globalThis.__edukeFS=vfs;}
$('force').addEventListener('click',()=>forceRun().catch(e=>append('FORCE ERROR: '+e.stack)));
$('boot').addEventListener('click',()=>tryBoot().catch(e=>append('BOOT DIAGNOSTIC ERROR: '+e.stack)));
$('grp').addEventListener('change',async e=>{if(e.target.files[0])try{await mountGRP(e.target.files[0])}catch(err){$('grp-result').textContent='GRP ERROR: '+err;result.errors.push({phase:'grp',error:String(err)})}});
$('export').addEventListener('click',()=>{const link=document.createElement('a');const uri=URL.createObjectURL(new Blob([JSON.stringify(result,null,2)],{type:'application/json'}));link.href=uri;link.download='eduke32-force-browser.json';link.click();setTimeout(()=>URL.revokeObjectURL(uri),500)});
$('boot-status').textContent=' '+(boot.entryEmitted?'Entry emitted (not game-verified)':'Entry not emitted');$('units').textContent=String(boot.compiledUnits||'?');$('modules').textContent=String(sourceNodes.length);append('Loaded test harness with '+sourceNodes.length+' original source JS modules. Click Force-load to evaluate them.');
globalThis.__edukeForce={result,forceRun,tryBoot,mountGRP,modules};
</script></body></html>'''
    page=page.replace('__BRIDGE__',bridge).replace('__PAYLOAD__','\n'.join(payload)).replace('__BOOT__',json.dumps(boot_info).replace('</','<\\/'))
    out.parent.mkdir(parents=True,exist_ok=True)
    out.write_text(page,encoding='utf-8')
    record={'format':'eduke32-offline-force-run-build/1','source':str(source.relative_to(ROOT)), 'html':str(out.relative_to(ROOT)), 'bytes':out.stat().st_size,'modules':entries,'originalGameLinked':boot_info['linkedGame'],'appMainEmitted':boot_info['entryEmitted'],'gameplayVerified':False}
    report=ROOT/'reports/force-browser/build.json';report.parent.mkdir(parents=True,exist_ok=True);report.write_text(json.dumps(record,indent=2)+'\n')
    print(json.dumps({'html':str(out),'bytes':out.stat().st_size,'modules':len(entries),'original_gameplay_verified':False},indent=2))
    return record
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--source',type=Path,default=DEFAULT);p.add_argument('--out',type=Path,default=ROOT/'dist/force-test.html');a=p.parse_args();build(a.source.resolve(),a.out.resolve())
