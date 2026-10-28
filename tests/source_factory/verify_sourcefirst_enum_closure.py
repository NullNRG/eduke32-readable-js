#!/usr/bin/env python3
"""Verify exact Clang source enum recovery and collision rejection."""
import json,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
SOURCE='tests/source_factory/source_first_enum_closure_fixture.cpp'
def run(cmd):
    p=subprocess.run(cmd,cwd=ROOT,text=True,capture_output=True,timeout=90)
    assert p.returncode==0,(cmd,p.stderr[-1400:],p.stdout[-400:])
    return p.stdout
with tempfile.TemporaryDirectory() as t:
    d=Path(t)
    common=[sys.executable,str(ROOT/'tools/source_ast_to_js.py'),
            '--root',str(ROOT),'--source',SOURCE,'--out-dir',str(d)]
    run(common+['--filter','enum_consumed'])
    module=d/(SOURCE+'.mjs')
    initial=json.loads(module.with_suffix('.manifest.json').read_text())
    assert initial['emitted']==0 and 'enum constant without Clang' in initial['definitions'][0]['reason'],initial
    run(common+['--filter','enum_consumed','--enum-closure'])
    manifest=json.loads(module.with_suffix('.manifest.json').read_text())
    assert manifest['emitted']==1 and manifest['blocked']==0,manifest
    assert all(manifest['enum_closure']['proven_values'][n]==value for n,value in
               [('FLAGS_ONE',2),('FLAGS_TWO',8),('FLAGS_THREE',32)]),manifest
    run(['node','--check',str(module)])
    (d/'runner.mjs').write_text('import {enum_consumed} from '+json.dumps(module.as_uri())+
         ';for(let i=-256;i<256;i++)console.log(enum_consumed(i));')
    js=run(['node',str(d/'runner.mjs')]).splitlines()
    (d/'driver.cpp').write_text('#include <cstdio>\nextern "C" int enum_consumed(int);\n'
        'int main(){for(int i=-256;i<256;i++)printf("%d\\n",enum_consumed(i));}')
    run(['clang++',str(ROOT/SOURCE),str(d/'driver.cpp'),'-o',str(d/'native')])
    native=run([str(d/'native')]).splitlines()
    assert native==js,(native[:8],js[:8])
    run(common+['--filter','enum_ambig','--enum-closure'])
    manifest=json.loads(module.with_suffix('.manifest.json').read_text())
    assert manifest['emitted']==0 and manifest['blocked']>=1,manifest
    assert 'DUPLICATE_VALUE' in manifest['enum_closure']['rejected'],manifest
    print('PASS: 512 C++/JS enum closure cases, Clang values and namespace collision blocked')
