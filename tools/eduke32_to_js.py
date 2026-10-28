#!/usr/bin/env python3
"""Build a browser-adapted EDuke32 fork as one JS-only HTML artifact.

This is a DRIVER, not a home-grown C++ parser. The compiler backend is
Emscripten's LLVM -> WebAssembly -> wasm2js conversion (-sWASM=0).
A source tree without an Emscripten platform backend is intentionally rejected.
The user-uploaded 2026 source tree has no such backend.

Usage:
  python tools/eduke32_to_js.py --browser-source /path/to/eduke32-browser-fork \
      --grp /path/to/DUKE3D.GRP --out dist/full-index.html

Prerequisites: emsdk activated (`emcc`, `em++`, GNU make, SDK libraries).
"""
from __future__ import annotations
import argparse, os, pathlib, shutil, subprocess, sys, tempfile, textwrap
ROOT=pathlib.Path(__file__).resolve().parents[1]

def fail(message):raise SystemExit('EDuke32 to JS: '+message)

def preflight(src):
    if not (src/'GNUmakefile').exists():fail('GNUmakefile not found. Pass the root of an EDuke32 source tree.')
    if not (src/'platform'/'emscripten').is_dir() and 'EMSCRIPTEN' not in (src/'Common.mak').read_text(errors='replace'):
        fail('source has NO Emscripten/browser platform support. The uploaded EDuke32 archive falls in this category; use a browser-adapted EDuke32 fork or implement platform/emscripten first. Refusing to produce a fake "complete" port.')
    for name in ['emcc','em++','make']:
        if not shutil.which(name):fail('missing tool '+name+'; install and activate the Emscripten SDK')
    test='int main(void){return 0;}'
    with tempfile.TemporaryDirectory() as td:
        p=pathlib.Path(td)
        (p/'probe.c').write_text(test)
        r=subprocess.run(['emcc',str(p/'probe.c'),'-sWASM=0','-sSINGLE_FILE=1','-o',str(p/'probe.js')],stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True)
        if r.returncode or not (p/'probe.js').exists():fail('Installed Emscripten does not support wasm2js (-sWASM=0):\n'+r.stdout[-3000:])

WRAPPER=r'''#!/usr/bin/env python3
import os,sys
exe=os.environ['EDUKE_REAL_'+os.path.basename(sys.argv[0]).upper().replace('+','P')]
args=sys.argv[1:]
compile_only=any(x in args for x in ('-c','-E','-S','-M','-MM'))
if not compile_only and '-o' in args:
    idx=args.index('-o')
    if idx+1<len(args) and args[idx+1].endswith(('.js','.html','.mjs')):
        args+=['-sWASM=0','-sSINGLE_FILE=1','-sASYNCIFY=1','-sALLOW_MEMORY_GROWTH=1','-sFORCE_FILESYSTEM=1','-sNO_EXIT_RUNTIME=1']
        for grp in os.environ.get('EDUKE_EMBED_GRP','').split(os.pathsep):
            if grp: args+=['--embed-file',grp+'@/'+os.path.basename(grp)]
os.execv(exe,[exe,*args])
'''

def wrap_script(js,out):
    """Emscripten code must be built with SINGLE_FILE and EMBED_FILE.
    We do not attempt to rewrite an Emscripten wasm-dependent loader.
    """
    src=pathlib.Path(js).read_text(encoding='utf8')
    if 'wasmBinaryFile' in src and ('fetch(wasmBinaryFile)' in src or 'instantiateStreaming' in src):
        fail('compiled JS still requests an external WASM payload; check -sWASM=0 linker flags')
    if '<script' in src.lower():fail('Unexpected HTML/script markup inside compiled JS')
    content=src.replace('</script','<\\/script').replace('</SCRIPT','<\\/SCRIPT')
    html='''<!doctype html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1,maximum-scale=1"/><title>EDuke32 · Compiled JavaScript</title><style>html,body{height:100%;margin:0;background:#050505;color:#ddd}#canvas{position:absolute;inset:0;margin:auto;max-width:100%;max-height:100%;outline:none}#status{position:absolute;top:6px;left:9px;z-index:5;font:13px monospace}#log{position:absolute;bottom:4px;left:9px;max-width:90vw;max-height:20vh;overflow:auto;font:11px monospace;opacity:.75}</style></head><body><div id="status">Initializing compiled EDuke32 JavaScript…</div><canvas id="canvas" tabindex="0" oncontextmenu="event.preventDefault()"></canvas><div id="log"></div><script>var Module={canvas:document.getElementById('canvas'),setStatus:function(msg){document.getElementById('status').textContent=msg},print:function(s){console.log(s)},printErr:function(s){console.error(s);document.getElementById('log').textContent+=s+'\\n'},onRuntimeInitialized:function(){document.getElementById('status').textContent='EDuke32 JS initialized';document.getElementById('canvas').focus()}};</script><script>'''+content+'''</script></body></html>'''
    out.parent.mkdir(parents=True,exist_ok=True);out.write_text(html,encoding='utf-8')
    print('Bundled compiled engine into',out,'bytes',out.stat().st_size)

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--browser-source',type=pathlib.Path,help='EDuke32 source WITH Emscripten integration')
    p.add_argument('--grp',type=pathlib.Path,action='append',default=[],help='Owned original GRP; repeat for additional archives')
    p.add_argument('--out',type=pathlib.Path,default=ROOT/'dist'/'full-index.html')
    p.add_argument('--build-output',type=pathlib.Path,help='Wrap a precompiled *JS-only* Emscripten .js (skip compilation)')
    p.add_argument('--jobs',type=int,default=4)
    args=p.parse_args()
    if args.build_output:
        if not args.build_output.is_file():fail('Compiled JS file missing')
        wrap_script(args.build_output,args.out);return
    if not args.browser_source:fail('--browser-source is required for C/C++ compilation')
    src=args.browser_source.resolve();preflight(src)
    for grp in args.grp:
        if not grp.is_file():fail('GRP file missing '+str(grp))
    with tempfile.TemporaryDirectory(prefix='eduke32_js_wrapper_') as td:
        binpath=pathlib.Path(td)
        env=os.environ.copy()
        for name,variable in [('emcc','EDUKE_REAL_EMCC'),('em++','EDUKE_REAL_EMPP')]:
            exe=shutil.which(name);assert exe
            env[variable]=exe
            wrapper=binpath/name;wrapper.write_text(WRAPPER);wrapper.chmod(0o755)
        env['EDUKE_EMBED_GRP']=os.pathsep.join(str(x.resolve()) for x in args.grp)
        env['PATH']=str(binpath)+os.pathsep+env.get('PATH','')
        # Browser ports differ in target details; this uses the published EDuke32-WASM interface.
        cmd=['make','PLATFORM=EMSCRIPTEN','EM_SINGLE_FILE=1','NETDUKE32=0','USE_LIBVPX=0','RENDERTYPE=SDL','SDL_TARGET=2',f'-j{max(1,args.jobs)}']
        print('Running:',*cmd,flush=True)
        r=subprocess.run(cmd,cwd=src,env=env)
        if r.returncode:fail('browser-source build failed; original source may need additional browser port patches')
    # Do not guess if target is present; look for an Emscripten-generated JS-only artifact.
    candidates=[p for p in src.rglob('*.js') if p.name.lower().startswith(('eduke32','duke3d')) and 'node_modules' not in p.parts]
    if not candidates:fail('build finished but no EDuke32 JS output detected; specify --build-output directly')
    js=max(candidates,key=lambda p:p.stat().st_mtime)
    wrap_script(js,args.out)

if __name__=='__main__':main()
