"""Whole-unit extension retains source-attested header arrays and live cells."""
import json, subprocess, sys, tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]

def run(args,success=True):
    p=subprocess.run(list(map(str,args)),cwd=ROOT,capture_output=True,text=True,timeout=120)
    assert (p.returncode==0)==success,(args,p.stdout[-1500:],p.stderr[-2500:])
    return p.stdout+p.stderr

with tempfile.TemporaryDirectory(dir=ROOT/'work',prefix='header-array-fragment-') as folder:
    root=Path(folder);target=root/'owner';later=root/'later';header=root/'state.hpp'
    header.write_text('''static const unsigned char weights[4]={3,7,11,19};
static int counts[4]={1,2,3,4};
''')
    (root/'unit.cpp').write_text('''#include "state.hpp"
extern "C" int owner_read(){return counts[0]+counts[1]+counts[2]+counts[3]+weights[0];}
extern "C" int step(int n){counts[n%4]+=n*weights[n%4];return counts[n%4];}
''')
    compiler=[sys.executable,ROOT/'tools/source_ast_to_js.py','--root',root,'--source','unit.cpp',
              '--header-dependency-closure','--ast-cache-dir',root/'cache']
    run([*compiler,'--out-dir',target,'--filter','owner_read','--exact-filter','--dependency-closure'])
    symbols=root/'symbols.json';symbols.write_text('{}')
    run([*compiler,'--out-dir',later,'--project-symbols',symbols,'--import-root',target])
    manifest=later/'unit.cpp.manifest.json';doc=json.loads(manifest.read_text())
    assert doc['blocked']==0,doc['definitions']
    assert not any(r['kind']=='VarDecl' for r in doc['definitions']),doc['definitions']
    arrays=[r for r in doc['imports'] if r['name'].startswith(('counts__','weights__'))]
    assert len(arrays)==2,doc['imports']
    assert all(r.get('native_pointer_abi')=='source-lp64-addresses/2' for r in arrays),arrays
    install=[sys.executable,ROOT/'tools/install_verified_fragment.py','--manifest',manifest,
             '--target',target,'--exports','step','--report',root/'installed.json']
    run(install)
    (root/'main.cpp').write_text('''#include <cstdio>
extern "C" int owner_read(),step(int);
int main(){for(int n=0;n<256;n++){int r=step(n);printf("%d,%d\\n",r,owner_read());}}
''')
    native=root/'oracle.exe'
    run(['clang++',root/'unit.cpp',root/'main.cpp','-o',native])
    expected=run([native]).splitlines();runner=root/'run.mjs'
    runner.write_text('import {step,owner_read} from '+json.dumps((target/'unit.cpp.mjs').as_uri())+
                      ';for(let n=0;n<256;n++){const r=step(n);console.log(r+","+owner_read());}')
    assert run(['node',runner]).splitlines()==expected
    before=(target/'unit.cpp.mjs').read_bytes()
    header.write_text(header.read_text().replace('{3,7,11,19}','{5,7,11,19}'))
    run([*compiler,'--out-dir',later,'--project-symbols',symbols,'--import-root',target])
    assert 'duplicates existing original storage' in run(install,False)
    assert (target/'unit.cpp.mjs').read_bytes()==before
print('PASS 512 native/JS values: immutable/mutable header arrays keep one original storage across whole-unit extension; changed original header rejected atomically')
