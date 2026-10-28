#!/usr/bin/env python3
"""Bundle a CLOSED static ES-module graph into a one-file offline index.html.

Uses import maps with data: URIs (no network or external file dependencies).
It does not compile native C/C++; input must be existing ES modules.
"""
import argparse,base64,html,json,pathlib,re,subprocess,sys
IMPORT=re.compile(r'(?m)^\s*(?:import\s+.*?\s+from\s+|import\s*)[\'\"](\.[^\'\"]+)[\'\"]')
DYNAMIC=re.compile(r'\bimport\s*\(')

def bundle(root, entry, out, title, assets):
    root=root.resolve(); entry=(root/entry).resolve()
    if not entry.is_relative_to(root):raise ValueError('Entry outside root')
    queue=[entry]; mapping={}; inputs=[]
    while queue:
        file=queue.pop(0)
        if file in mapping:continue
        if not file.is_file() or not file.is_relative_to(root):raise ValueError('Missing/escaping ES module '+str(file))
        text=file.read_text()
        if DYNAMIC.search(text):raise ValueError('Dynamic imports unsupported: '+str(file))
        spec='@eduke/'+file.relative_to(root).as_posix()
        mapping[file]=spec
        imports=[]
        for rel in IMPORT.findall(text):
            nextfile=(file.parent/rel).resolve()
            if not nextfile.is_relative_to(root):raise ValueError('Import path escape '+rel)
            imports.append((rel,nextfile))
            queue.append(nextfile)
        inputs.append((file,text,imports))
    modules={}
    for file,src,imports in inputs:
        for rel,local in imports:
            src=src.replace("'"+rel+"'", "'"+mapping[local]+"'").replace('"'+rel+'"','"'+mapping[local]+'"')
        encoded=base64.b64encode(src.encode()).decode()
        modules[mapping[file]]='data:text/javascript;base64,'+encoded
    asset_tags=[]
    for id,file in assets:
        body=base64.b64encode(file.read_bytes()).decode()
        asset_tags.append(f'<script id="{html.escape(id)}" type="application/octet-stream">{body}</script>')
    imap=json.dumps({'imports':modules},separators=(',',':')).replace('<','\\u003c')
    script=(f"import * as mod from '{mapping[entry]}'; "
            "globalThis.EDukeNativeRuntime=mod; const node=document.getElementById('status'); "
            "try { let status='Runtime modules imported ('+Object.keys(mod).length+' exports)'; "
            "if(typeof mod.bootstrap==='function'){ const rt=mod.bootstrap(document.getElementById('screen')); "
            "const crc=mod.verifyOriginalCRC32(); rt.renderer?.resize(640,360); rt.renderer?.clear(22,36,64); "
            "status+='; 11 original C++ functions linked; CRC32='+crc.toString(16)+'; renderer='+rt.renderer?.backend; "
            "globalThis.EDukeRunningRuntime=rt; } "
            "node.textContent=status+'. Full EDuke32 gameplay is NOT linked.'; } "
            "catch(e){node.textContent='Runtime exception: '+e.message; console.error(e);}")
    content='''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'''+html.escape(title)+'''</title><style>body{background:#101418;color:#e1e7eb;font:16px/1.55 system-ui;margin:4vw}pre{white-space:pre-wrap;background:#202932;padding:1rem;border-radius:.6rem}canvas{background:#000;max-width:100%}</style><h1>EDuke32 Native JS Runtime</h1><p id="status">Loading inline ECMAScript modules…</p><canvas id="screen" width="640" height="360"></canvas><pre>Source-to-JS compiler foundation and browser ABI demo. This page is a runtime smoke test, NOT compiled EDuke32 gameplay. Use the separate existing Duke3D HTML for the reconstruction preview.</pre><script type="importmap">'''+imap+'''</script><script type="module">'''+script+'''</script>'''+''.join(asset_tags)+'''</html>'''
    out.parent.mkdir(parents=True,exist_ok=True);out.write_text(content)
    check={'output':str(out),'modules':len(modules),'asset_count':len(assets),'bytes':out.stat().st_size,'no_external_scripts':True,'entry':mapping[entry]}
    (out.with_suffix('.manifest.json')).write_text(json.dumps(check,indent=2))
    return check

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--root',type=pathlib.Path,required=True)
    p.add_argument('--entry',default='index.mjs')
    p.add_argument('--out',type=pathlib.Path,required=True)
    p.add_argument('--asset',action='append',default=[],help='ID=/path/data.grp')
    a=p.parse_args();assets=[]
    for arg in a.asset:
        name,sep,file=arg.partition('=')
        if not sep or not re.fullmatch('[a-zA-Z][a-zA-Z0-9_-]+',name):p.error('Asset must be ID=/path/to/file')
        assets.append((name,pathlib.Path(file)))
    print(json.dumps(bundle(a.root,a.entry,a.out,'EDuke32 Source Factory',assets),indent=2))
if __name__=='__main__':main()
