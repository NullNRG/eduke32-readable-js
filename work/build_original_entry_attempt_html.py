"""Offline packaging for an honest original-app_main execution attempt."""
import base64,gzip,hashlib,json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
entry=ROOT/'factory-output/source-first/oct15-entry-attempt/source/duke3d/src/game.cpp.mjs'
seen={}
def key(path):return 'eduke/'+path.relative_to(ROOT).as_posix()
def visit(path):
    path=path.resolve()
    if path in seen:return key(path)
    if not path.is_relative_to(ROOT):raise ValueError('Dependency outside canonical project')
    seen[path]=''
    source=path.read_text()
    def relocate(match):
        child=(path.parent/match.group(2)).resolve()
        return 'from '+json.dumps(visit(child))
    source=re.sub(r'from ([\'"])(\.{1,2}/[^\'"]+)\1',relocate,source)
    # Observe the real source call and result without replacing its behavior.
    if path==entry:
        source=source.replace('import { G_ExtPreInit }','import { G_ExtPreInit as original_G_ExtPreInit }')
        source+='\nfunction G_ExtPreInit(...args) { globalThis.__entryLog("ENTER original G_ExtPreInit"); const result=original_G_ExtPreInit(...args); globalThis.__entryLog("RETURN original G_ExtPreInit"); return result; }\n'
    seen[path]=source
    return key(path)
runtime=ROOT/'runtime/index.mjs'
target=ROOT/'factory-output/source-first/browser-target'
roots={'entry':visit(entry),'runtime':visit(runtime),
    'libc':visit(target/'browser-abi/libc_provider.mjs'),
    'sdl':visit(target/'browser-abi/sdl_provider.mjs'),
    'compat':visit(target/'source/build/src/compat.cpp.mjs')}
modules={key(p):s for p,s in seen.items()}
raw=(ROOT/'input-data/DUKE3D.GRP').read_bytes()
packed=base64.b64encode(gzip.compress(raw,compresslevel=6,mtime=0)).decode()
page='''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>EDuke32 original JavaScript entry attempt</title>
<style>body{font:16px/1.5 system-ui;background:#10151d;color:#edf2f7;max-width:1000px;margin:32px auto;padding:0 22px}h1{font-size:26px}button{font:inherit;padding:12px 18px;background:#356fa9;color:white;border:0;border-radius:5px}pre{padding:20px;background:#080c13;white-space:pre-wrap;overflow-wrap:anywhere;border:1px solid #34465b}#state{color:#ffd38d}canvas{display:none}</style>
<h1>EDuke32 · Original JavaScript entry attempt</h1><p>This invokes the original Clang-translated <code>game.cpp::app_main</code> with the supplied game archive. Startup is incomplete. Missing dependencies throw real errors. This is not a playable game.</p>
<button id="run">Run original app_main</button><p id="state">Ready</p><pre id="trace" aria-live="polite"></pre><canvas id="screen" width="640" height="480"></canvas>
<script id="grp" type="application/octet-stream">__GRP__</script><script>
const sources=__MODULES__,roots=__ROOTS__;
const imports={};
for(const [name,source] of Object.entries(sources))imports[name]=URL.createObjectURL(new Blob([source],{type:'text/javascript'}));
const map=document.createElement('script');map.type='importmap';map.textContent=JSON.stringify({imports});document.head.append(map);
globalThis.entryAttempt={format:'eduke32-original-entry-execution/1',trace:[],assets:null,entryInvoked:false,entryReturned:false,gameplayVerified:false,error:null};
globalThis.__entryLog=message=>{entryAttempt.trace.push({at:performance.now(),message});document.querySelector('#trace').textContent+=message+'\\n';console.log(message);};
document.querySelector('#run').onclick=async()=>{
document.querySelector('#run').disabled=true;document.querySelector('#state').textContent='Executing original source…';
try{
 const [{NativeRuntime,bindSourceFreeAllocator},libc,sdl,compat]=await Promise.all([import(roots.runtime),import(roots.libc),import(roots.sdl),import(roots.compat)]);
 const rt=new NativeRuntime({canvas:document.querySelector('#screen'),renderer:'canvas2d'});globalThis.entryRuntime=rt;
 libc.bindBrowserC(rt);sdl.bindBrowserSDL(rt);bindSourceFreeAllocator(compat.__cxx_global_cell_11016d3c7177543e564ab46c,libc.free);
 const packed=Uint8Array.from(atob(document.querySelector('#grp').textContent),c=>c.charCodeAt(0));
 const stream=new Blob([packed]).stream().pipeThrough(new DecompressionStream('gzip'));
 const bytes=new Uint8Array(await new Response(stream).arrayBuffer());
 const directory=rt.fs.mountGRP(bytes);rt.fs.mountBytes('DUKE3D.GRP',bytes);
 entryAttempt.assets={bytes:bytes.length,entries:directory.length,hasE1L1:rt.fs.exists('E1L1.MAP')};
 __entryLog('Actual DUKE3D.GRP mounted: '+directory.length+' files; E1L1.MAP='+entryAttempt.assets.hasE1L1);
 const original=await import(roots.entry);
 entryAttempt.entryInvoked=true;__entryLog('ENTER original game.cpp::app_main(1, ["eduke32"])');
 const result=original.app_main(1,[new TextEncoder().encode('eduke32\\0')]);
 entryAttempt.entryReturned=true;entryAttempt.returnValue=result;__entryLog('RETURN original app_main: '+result);
 document.querySelector('#state').textContent='Original entry returned '+result+'; gameplay has not been verified.';
}catch(error){entryAttempt.error={name:error.name,message:error.message,stack:error.stack};__entryLog('STOP: '+error.name+': '+error.message);__entryLog(error.stack||String(error));document.querySelector('#state').textContent='Startup stopped: '+error.message;}
};
</script></html>'''.replace('__GRP__',packed).replace('__MODULES__',json.dumps(modules).replace('</','<\\/')).replace('__ROOTS__',json.dumps(roots))
out=ROOT/'dist/original-entry-attempt.html';out.parent.mkdir(exist_ok=True);out.write_text(page,encoding='utf-8')
report={'format':'offline-original-entry-attempt-package/1','html':str(out.relative_to(ROOT)),
    'bytes':out.stat().st_size,'sha256':hashlib.sha256(out.read_bytes()).hexdigest(),
    'grp_sha256':hashlib.sha256(raw).hexdigest(),'embedded_modules':len(modules),
    'gameplay_verified':False,'remote_dependencies':False,'modules':[
        {'path':str(p.relative_to(ROOT)),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in seen]}
(ROOT/'reports/oct15-original-entry-attempt-package.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({k:v for k,v in report.items() if k!='modules'},indent=2))
