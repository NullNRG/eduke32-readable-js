#!/usr/bin/env python3
"""Build one canonical EDuke32 source audit, verified JS modules, and HTML.

A playable HTML is an existing partial BUILD-data reconstruction until the
original EDuke32 engine (CON interpreter + platform + renderer) is linked.
"""
import argparse, json, pathlib, re, shutil, subprocess, sys
from bundle_modules import bundle
ROOT=pathlib.Path(__file__).resolve().parents[1]

def call(argv,cwd=None):
    print('+',' '.join(map(str,argv)),flush=True)
    return subprocess.run([str(x) for x in argv],cwd=cwd,check=True)

def embed_bridge(html_path,module_page):
    html=html_path.read_text()
    snippet=module_page.read_text()
    mapped=re.search(r'<script type="importmap">(.*?)</script>',snippet,re.S)
    if not mapped:raise RuntimeError('Offline importmap not generated')
    script='''<script type="module">
import { bootstrap, verifyOriginalCRC32 } from '@eduke/factory-output/bridge.mjs';
try {
 globalThis.EDukeCompiledSourceRuntime=bootstrap();
 const crc=verifyOriginalCRC32();
 console.info('[EDuke32 Source Factory] 11 original C++ functions linked, CRC32 test=',crc.toString(16));
} catch(error) { console.error('EDuke32 LLVM source bridge failed',error); }
</script>'''
    injected='<script type="importmap">'+mapped.group(1)+'</script>'+script
    if '</body>' not in html:raise RuntimeError('Malformed HTML bundle: missing body close')
    html=html.replace('</body>',injected+'</body>',1)
    html_path.write_text(html)

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--source',type=pathlib.Path,required=True,help='Original EDuke32 ZIP or extracted root')
    p.add_argument('--duke',type=pathlib.Path,help='Owned Duke Nukem 3D GRP data')
    p.add_argument('--shadow',type=pathlib.Path,help='Owned Shadow Warrior GRP data')
    p.add_argument('--out',type=pathlib.Path,required=True,help='Standalone HTML output')
    p.add_argument('--work',type=pathlib.Path,default=ROOT/'factory-output')
    p.add_argument('--probe',type=int,default=5)
    a=p.parse_args();work=a.work.resolve()
    if work != (ROOT/'factory-output').resolve():
        p.error('--work currently must be the canonical factory-output directory inside the extracted toolchain')
    work.mkdir(parents=True,exist_ok=True)
    shutil.copyfile(ROOT/'web'/'source_bridge.mjs',work/'bridge.mjs')
    call([sys.executable,ROOT/'tools'/'source_factory.py','--source',a.source,'--out',work,'--probe',a.probe,'--verified-js'])
    source=work/'source-tree'
    if not (source/'source').exists():
        roots=[p.parent for p in source.rglob('GNUmakefile')]
        if roots:source=roots[0]
        else:source=a.source
    call([sys.executable,ROOT/'tools'/'header_constants.py','--source',source,'--out',work])
    call([sys.executable,ROOT/'tools'/'verify_js.py','--root',ROOT])
    runtime_file=work/'source-compiler-runtime.html'
    bundle(ROOT,'factory-output/bridge.mjs',runtime_file,'EDuke32 Source Factory Runtime',[])
    if a.duke or a.shadow:
        cmd=[sys.executable,ROOT/'tools'/'build.py','--source',source,'--out',a.out]
        if a.duke:cmd.extend(['--duke',a.duke])
        if a.shadow:cmd.extend(['--shadow',a.shadow])
        call(cmd)
        embed_bridge(a.out,runtime_file)
        call([sys.executable,ROOT/'tools'/'extract_embedded_grp.py',a.out,'--verify-only'])
    result={'source_audit':str(work/'inventory.json'),
            'compile_commands':str(work/'compile_commands.json'),
            'browser_runtime':str(runtime_file),
            'html':str(a.out) if (a.duke or a.shadow) else None,
            'source_functions_transpiled_and_tested':11,
            'original_engine_gameplay_transpiled':False,
            'original_engine_main_loop_linked':False,
            'limitations':'HTML game preview is a reconstruction; original EDuke32 engine still requires porting and full LLVM/C++ ABI support'}
    (work/'RELEASE.json').write_text(json.dumps(result,indent=2))
    print('Finished source factory build:',json.dumps(result,indent=2))
if __name__=='__main__':main()
