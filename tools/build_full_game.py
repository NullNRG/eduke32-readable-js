#!/usr/bin/env python3
"""Whole-source EDuke32 -> single HTML driver with strict game completeness gate.

A browser game is emitted only when every build unit has compiled and every
required LLVM symbol has lowered and linked. No reconstruction is substituted.
"""
import argparse, base64, hashlib, json, pathlib, re, subprocess, sys, html
from bundle_modules import IMPORT, DYNAMIC

HERE=pathlib.Path(__file__).resolve().parents[1]

def inline_graph(root,entry):
    root=root.resolve();entry=(root/entry).resolve()
    found={};queue=[entry];s=[]
    while queue:
        path=queue.pop(0)
        if path in found:continue
        if not path.is_relative_to(root) or not path.is_file():raise ValueError('Missing unsafe import '+str(path))
        source=path.read_text()
        if DYNAMIC.search(source):raise ValueError('Dynamic import unsupported '+str(path))
        found[path]='@eduke/'+path.relative_to(root).as_posix()
        deps=[(name,(path.parent/name).resolve()) for name in IMPORT.findall(source)]
        s.append((path,source,deps))
        queue.extend(d for _,d in deps)
    mappings={}
    for path,source,deps in s:
        for name,child in deps:
            source=source.replace('"'+name+'"','"'+found[child]+'"').replace("'"+name+"'","'"+found[child]+"'")
        mappings[found[path]]='data:text/javascript;base64,'+base64.b64encode(source.encode()).decode()
    return found[entry],mappings

def assemble(source_out,out,entry_name,values,assets):
    ref,modules=inline_graph(source_out,'linked.mjs')
    embed=[]
    for name,filename in assets:
        if not filename.is_file():raise ValueError('Asset missing: '+str(filename))
        encoded=base64.b64encode(filename.read_bytes()).decode()
        embed.append(f'<script type="application/octet-stream" id="{html.escape(name)}">{encoded}</script>')
    js=f'''import {{boot}} from {json.dumps(ref)};
const status=document.getElementById('status');
try {{
  const ctx=boot();
  globalThis.CompiledEDuke32Context=ctx;
  const target={json.dumps(entry_name)};
  const input={json.dumps(values)};
  const result=ctx.call(target,input);
  status.textContent=`Entry ${{target}}(${{input.join(', ')}}) returned ${{String(result)}}`;
}} catch(e) {{status.textContent=`Compiled entry failed: ${{e.message}}`;console.error(e)}}'''
    doc='''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>C/C++ whole-program JavaScript compilation</title>
<style>body{font:16px/1.55 system-ui;margin:5vw;background:#101318;color:#e5e8ef}#status{white-space:pre-wrap;font-size:1.3rem}</style>
<h1>Compiled C/C++ program</h1><p id="status">Starting native JavaScript...</p>
<script type="importmap">'''+json.dumps({'imports':modules},separators=(',',':')).replace('<','\\u003c')+'''</script>
<script type="module">'''+js+'''</script>'''+''.join(embed)+'''</html>'''
    out.parent.mkdir(parents=True,exist_ok=True);out.write_text(doc)
    return {'html':str(out),'bytes':out.stat().st_size,'modules':len(modules),
            'entry':entry_name,'js_only':True,'asset_count':len(assets)}

def assemble_incomplete_diagnostic(work,out,assets):
    """One-file cached original-source inspection, explicitly NOT gameplay."""
    ref,modules=inline_graph(work,'linked.mjs')
    report=json.loads((work/'symbol-link-report.json').read_text())
    missing=report.get('unresolved_symbols',[])
    # Keep the original source-to-transpiled-JS mapping visible in a one-file
    # distribution, not just in the source archive.
    source_map=json.loads((work/'source-map.json').read_text())
    asset_scripts=[]
    for name,filename in assets:
        if not filename.is_file():raise ValueError('Missing original game asset: '+str(filename))
        encoded=base64.b64encode(filename.read_bytes()).decode('ascii')
        asset_scripts.append('<script type="application/octet-stream" id="asset-'+html.escape(name)+'">'+encoded+'</script>')
    js=f'''import {{boot}} from {json.dumps(ref)};
import {{VirtualFS}} from "@eduke/runtime/filesystem.mjs";
const missing={json.dumps(missing)};
const status=document.getElementById('status');
const output=document.getElementById('runtime-output');
const decode=new TextDecoder();
const log=(name,bytes)=>{{output.textContent+=(name+': '+decode.decode(bytes));if(output.textContent.length>65536)output.textContent=output.textContent.slice(-65536);}};
document.getElementById('issues').textContent=missing.map((s,i)=>String(i+1)+'. '+s).join(String.fromCharCode(10));
document.getElementById('source-modules').textContent=Object.entries(JSON.parse(document.getElementById('source-map').textContent)).map(([source,item])=>source+'  →  '+item.module+'  ('+item.functions.length+' functions)').join('\\n');
status.textContent='Loaded {len(modules)} original compiled source/runtime modules. '+missing.length+' missing externals. NOT playable.';
document.getElementById('start').addEventListener('click',()=>{{
  const button=document.getElementById('start');button.disabled=true;
  status.textContent='Tracing original C/C++ main (debug-only; unresolved externals throw on use)...';
  try {{
    const fs=new VirtualFS();
    for(const name of ['duke','shadow']){{
      const element=document.getElementById('asset-'+name);
      if(!element)continue;
      const b64=element.textContent.trim(),binary=atob(b64),bytes=new Uint8Array(binary.length);
      for(let i=0;i<bytes.length;i++)bytes[i]=binary.charCodeAt(i);
      fs.mountBytes(name==='duke'?'DUKE3D.GRP':'SW.GRP',bytes);
      fs.mountGRP(bytes);
    }}
    // Tripwire exports permit registration of unresolved data relocations;
    // every missing function still THROWS immediately if executed. This is
    // an original-source diagnostic, never a playable build or fake feature.
    const libraries=Object.fromEntries(missing.map(name=>[name,()=>{{throw Error('Unresolved required external used: '+name)}}]));
    const ctx=boot({{libraries,fs,canvas:document.getElementById('game'),stdio:{{stdout:b=>log('stdout',b),stderr:b=>log('stderr',b)}}}});
    globalThis.OriginalEDukeContext=ctx;
    const argc=1,argv=ctx.heap.calloc(2,8),name=ctx.heap.writeCString('eduke32');
    ctx.heap.write(argv,'u64',BigInt(name));
    log('trace',new TextEncoder().encode('Registered '+ctx.functions.size+' original C/C++ functions.'+String.fromCharCode(10)));
    const result=ctx.call('main',[argc,argv]);
    status.textContent='Original main returned '+String(result)+'; this does not establish gameplay.';
  }}catch(e){{status.textContent='Original C/C++ startup blocked: '+e.message;console.error(e)}}
  finally{{button.disabled=false;}}
}});'''
    doc='''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>EDuke32 native JavaScript — incomplete compiled checkpoint</title>
<style>body{background:#121723;color:#e5eaf5;font:15px/1.5 system-ui;margin:3vw;max-width:950px}canvas{border:1px solid #526276;background:#000;max-width:100%}button{padding:10px;color:white;background:#294365;border:1px solid #85a8d7}pre{white-space:pre-wrap;word-break:break-word;font-size:12px}#status{padding:14px;background:#243146}</style></head><body>
<h2>EDuke32 — actual source-compiled JavaScript checkpoint</h2><p>This single HTML contains the genuine LLVM-lowered C/C++ modules and original game assets, but missing runtime dependencies prevent playable game execution. No replacement gameplay is supplied.</p><p id="status">Loading modules...</p>
<button id="start">Trace original C/C++ main (diagnostic)</button><pre id="runtime-output"></pre><p><canvas id="game" width="800" height="600" tabindex="0"></canvas></p><details><summary>Exact unresolved link dependencies</summary><pre id="issues"></pre></details>
<details><summary>Original Duke source files and their transpiled JavaScript modules</summary><pre id="source-modules"></pre></details>
<script type="application/json" id="source-map">'''+json.dumps(source_map,separators=(',',':')).replace('<',r'\u003c')+'''</script>
<script type="importmap">'''
    doc+=json.dumps({'imports':modules},separators=(',',':')).replace('<',r'\u003c')+'</script>'
    doc+='<script type="module">'+js+'</script>'+''.join(asset_scripts)+'</body></html>'
    out.parent.mkdir(parents=True,exist_ok=True)
    out.write_text(doc)
    manifest={'kind':'incomplete-original-compiler-diagnostic','playable':False,'html':str(out),'html_bytes':out.stat().st_size,
              'modules':len(modules),'unresolved_symbols':len(missing),'assets':[name for name,_ in assets]}
    out.with_suffix('.manifest.json').write_text(json.dumps(manifest,indent=2))
    return manifest


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--source',type=pathlib.Path,help='EDuke source ZIP or extracted root')
    p.add_argument('--cached-diagnostic',action='store_true',help='Create a self-contained original-code forensic HTML; NOT a playable game')
    p.add_argument('--out',type=pathlib.Path,required=True,help='Output index.html')
    p.add_argument('--work',type=pathlib.Path,default=HERE/'factory-output'/'whole-program')
    p.add_argument('--entry',default='main',help='LLVM symbol to run after successful linking')
    p.add_argument('--args',default='[]',help='JSON array of entry point arguments')
    p.add_argument('--duke',type=pathlib.Path)
    p.add_argument('--shadow',type=pathlib.Path)
    p.add_argument('--fixture',action='store_true',help='Test against a standalone C/C++ fixture without GNU Make')
    p.add_argument('--jobs',type=int,default=8)
    p.add_argument('--timeout',type=int,default=20)
    a=p.parse_args()
    work=a.work.resolve()
    if a.cached_diagnostic:
        assets=[(key,getattr(a,key).resolve()) for key in ('duke','shadow') if getattr(a,key)]
        print(json.dumps(assemble_incomplete_diagnostic(work,a.out,assets),indent=2))
        return
    if a.source is None:p.error('--source required for complete builds')
    cmd=[sys.executable,str(HERE/'tools'/'whole_program.py'),'--source',str(a.source),'--out',str(work),'--jobs',str(a.jobs),'--timeout',str(a.timeout)]
    if a.fixture:cmd.append('--fixture')
    process=subprocess.run(cmd,check=False)
    if process.returncode:raise SystemExit(process.returncode)
    manifest=json.loads((work/'SUMMARY.json').read_text())
    syms=json.loads((work/'symbol-link-report.json').read_text())
    if not manifest['actual_complete_build']:
        p.error('The engine is NOT completely compiled/linked. No fake game HTML will be emitted. See '+str(work/'SUMMARY.json')+' and '+str(work/'symbol-link-report.json'))
    if a.entry not in syms['symbols_lowered']:
        p.error('Compiled build has no entry symbol '+a.entry)
    values=json.loads(a.args)
    if not isinstance(values,list):p.error('--args needs JSON array')
    assets=[(key,getattr(a,key).resolve()) for key in ('duke','shadow') if getattr(a,key)]
    result=assemble(work,a.out,a.entry,values,assets)
    (a.out.with_suffix('.manifest.json')).write_text(json.dumps(result,indent=2))
    print(json.dumps(result,indent=2))
if __name__=='__main__':main()
