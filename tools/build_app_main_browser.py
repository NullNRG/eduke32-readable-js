#!/usr/bin/env python3
"""Build an offline, original-entry-aware browser *link diagnostic*.

This never synthesizes app_main, missing import providers, or gameplay. The
entry is callable ONLY if the original source compiler emitted it and the
existing runtime link passes. Source-module evaluation and GRP mounting are
not presented as evidence of gameplay.
"""
from __future__ import annotations
import argparse, base64, gzip, hashlib, html, json, re
from pathlib import Path
from build_force_browser import build

ROOT = Path(__file__).resolve().parents[1]

def create(source:Path, out:Path, data:Path, include_assets:bool=True):
    entry_source='source/duke3d/src/game.cpp'
    manifest_path=source/(entry_source+'.manifest.json')
    if not manifest_path.is_file():raise FileNotFoundError(manifest_path)
    manifest=json.loads(manifest_path.read_text())
    matches=[row for row in manifest.get('definitions',[]) if row.get('name')=='app_main' and row.get('kind')=='FunctionDecl']
    if len(matches)!=1:raise RuntimeError('Expected ONE Clang-verified original app_main definition; found '+str(len(matches)))
    entry=matches[0]
    js_path=source/(entry_source+'.mjs')
    compiled=js_path.is_file() and bool(re.search(r'^export\s+(?:async\s+)?function\s+app_main\s*\(',js_path.read_text(),re.M))
    status='entry_emitted' if compiled and entry.get('status')=='source-first' else 'entry_blocked'
    if compiled != (entry.get('status')=='source-first'):
        raise RuntimeError('Source manifest and actual JS entry disagree')
    # Build on existing canonical module packer; do not maintain a parallel loader.
    build(source,out)
    page=out.read_text()
    body={
       'format':'eduke32-original-entry-browser-link-audit/1',
       'entry':entry_source+'::app_main',
       'source_status':entry.get('status'),
       'entry_js_export_verified':compiled,
       'status':status,
       'reason':entry.get('reason'),
       'unresolved':entry.get('unresolved_references',[]),
       'source_reference_count':len(entry.get('source_references',[])),
       'source_manifest_sha256':hashlib.sha256(manifest_path.read_bytes()).hexdigest(),
       'entry_source_sha256':None,
       'real_grp_embedded':include_assets,
       'verified_playable':False,
    }
    source_path=ROOT/'factory-output/source-tree/eduke32-master'/entry_source
    if source_path.is_file():
        body['entry_source_sha256']=hashlib.sha256(source_path.read_bytes()).hexdigest()
    asset=''
    if include_assets:
        if not data.is_file():raise FileNotFoundError(data)
        binary=data.read_bytes()
        if binary[:12]!=b'KenSilverman':raise ValueError('Original DUKE3D.GRP signature invalid')
        body['grp_sha256']=hashlib.sha256(binary).hexdigest()
        body['grp_bytes']=len(binary)
        packed=gzip.compress(binary,compresslevel=6,mtime=0)
        body['grp_packed_bytes']=len(packed)
        body['grp_packing']='gzip/6'
        asset='<script type="application/x-duke-grp-gzip" id="embedded-duke-grp">'+base64.b64encode(packed).decode('ascii')+'</script>'
    card='''
<section class="panel" id="original-entry" data-entry-status="__STATUS__">
<h2>Original app_main browser link</h2>
<p><strong class="bad" id="entry-verdict">Link status: __STATUS__</strong></p>
<p>Launch attempts use the original <code>game.cpp::app_main</code> only. The page includes all available compiled source modules and __ASSETS__. No replacement game loop, substitute rendering, synthetic player, or fake entry routine is installed.</p>
<p>Compiler status: <code id="entry-manifest-state"></code>. Source dependencies: <span id="entry-needed"></span>. Source manifest SHA-256: <code id="entry-sha"></code>.</p>
<div class="bar"><button id="entry-try" type="button">Attempt source-linked app_main</button><button id="entry-audit" type="button">Show unresolved entry symbols</button><button id="entry-report" type="button">Download boot audit JSON</button></div>
<pre id="entry-console" aria-live="polite"></pre>
<div class="scroll"><table><thead><tr><th>Unresolved original symbol</th><th>State</th></tr></thead><tbody id="entry-rows"></tbody></table></div>
</section>
<script>
'use strict';
const __entryAudit = __ENTRY_JSON__;
const __entryText = document.getElementById('entry-console');
function __reportLine(s){__entryText.textContent += s+'\\n';}
function __entrySet(){
 document.getElementById('entry-needed').textContent=__entryAudit.unresolved.length+' unresolved references';
 document.getElementById('entry-manifest-state').textContent=__entryAudit.source_status;
 document.getElementById('entry-sha').textContent=__entryAudit.source_manifest_sha256.slice(0,16)+'…';
 __reportLine('Entry: '+__entryAudit.entry);
 __reportLine('Compiler: '+__entryAudit.source_status+' / '+(__entryAudit.reason||'no reason'));
 __reportLine(__entryAudit.entry_js_export_verified?'Source entry emitted; runtime closure still requires proof.':'BLOCKED: source compiler did not emit app_main; no browser wrapper can execute this missing original function.');
}
function __entryDetails(){
 const rows=document.getElementById('entry-rows');rows.replaceChildren();
 for(const name of __entryAudit.unresolved){const tr=document.createElement('tr'),a=document.createElement('td'),b=document.createElement('td');a.textContent=name;b.textContent='unresolved in saved source snapshot';tr.append(a,b);rows.append(tr);}
 __reportLine('Unresolved names: '+__entryAudit.unresolved.join(', '));
}
async function __attemptSourceEntry(){
 if(!__entryAudit.entry_js_export_verified){__reportLine('STOP: original app_main not in compiled JS. No surrogate is allowed.');return;}
 await globalThis.__edukeForce.tryBoot();
}
function __downloadAudit(){const blob=new Blob([JSON.stringify({...__entryAudit,browser:globalThis.__edukeForce.result},null,2)],{type:'application/json'});const u=URL.createObjectURL(blob);const a=document.createElement('a');a.href=u;a.download='eduke32-app-main-link-audit.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);}
document.getElementById('entry-try').addEventListener('click',__attemptSourceEntry);
document.getElementById('entry-audit').addEventListener('click',__entryDetails);
document.getElementById('entry-report').addEventListener('click',__downloadAudit);
__entrySet();
const __embeddedData=document.getElementById('embedded-duke-grp');
async function __mountEmbeddedGRP(){
 if(!__embeddedData)return null;
 const raw=atob(__embeddedData.textContent.trim());const packed=new Uint8Array(raw.length);
 for(let i=0;i<raw.length;i++)packed[i]=raw.charCodeAt(i);
 if(typeof DecompressionStream!=='function')throw new Error('Browser gzip decompression unsupported');
 const stream=new Blob([packed]).stream().pipeThrough(new DecompressionStream('gzip'));
 const bytes=new Uint8Array(await new Response(stream).arrayBuffer());
 if(bytes.length!==__entryAudit.grp_bytes)throw new Error('GRP decompression length mismatch');
 const file=new File([bytes],'DUKE3D.GRP',{type:'application/octet-stream'});
 await globalThis.__edukeForce.mountGRP(file);
 __reportLine('Verified original GRP mounted: '+globalThis.__edukeForce.result.grp.entries+' entries, E1L1='+globalThis.__edukeForce.result.grp.hasE1L1);
 return globalThis.__edukeForce.result.grp;
}
globalThis.__edukeEntry={audit:__entryAudit,attempt:__attemptSourceEntry,mountAssets:__mountEmbeddedGRP};
</script>
'''
    card=card.replace('__STATUS__',html.escape(status)).replace('__ASSETS__','the original 44 MB game archive' if include_assets else 'a selectable game archive').replace('__ENTRY_JSON__',json.dumps(body).replace('</','<\\/'))
    # Previous force harness deliberately retains its own buttons and scripts.
    # Place the additional report after it so its loader exists when invoked.
    page=page.replace('</body>',asset+card+'</body>')
    page=page.replace('<title>EDuke32 Native-JS Force Run / Source Diagnostics</title>','<title>EDuke32 app_main Original-Source Browser Link Audit</title>')
    out.write_text(page,encoding='utf-8')
    report=ROOT/'reports/app-main-browser/build.json';report.parent.mkdir(parents=True,exist_ok=True)
    body.update({'html':str(out.relative_to(ROOT)),'html_bytes':out.stat().st_size,'module_count':len(list(source.rglob('*.mjs')))})
    report.write_text(json.dumps(body,indent=2)+'\n')
    print(json.dumps({'output':str(out),'bytes':out.stat().st_size,'modules':body['module_count'],'app_main_emitted':compiled,'unresolved':len(body['unresolved']),'embedded_grp':include_assets},indent=2))
    return body

if __name__=='__main__':
    p=argparse.ArgumentParser()
    p.add_argument('--source',type=Path,default=ROOT/'factory-output/source-first/force-recovered')
    p.add_argument('--out',type=Path,default=ROOT/'dist/app-main.html')
    p.add_argument('--grp',type=Path,default=ROOT/'input-data/DUKE3D.GRP')
    p.add_argument('--no-embed-grp',action='store_true')
    a=p.parse_args();create(a.source.resolve(),a.out.resolve(),a.grp.resolve(),not a.no_embed_grp)
