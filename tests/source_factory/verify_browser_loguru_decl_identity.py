#!/usr/bin/env python3
"""Regression: matching C++ log selected by Clang, not a same-named C math ABI."""
import json,subprocess,tempfile,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
COMPILER=ROOT/'tools/source_ast_to_js.py'
SOURCE='source/duke3d/src/game.cpp'
INDEX=ROOT/'factory-output/source-first/browser-target/browser-combined-symbol-owners.json'
original=json.loads(INDEX.read_text())
base={k:v for k,v in original.items() if v!=SOURCE}
assert base.get('log')=='browser-abi/libc_provider'
assert base.get('loguru_log')=='browser-abi/loguru_provider'
with tempfile.TemporaryDirectory() as directory:
    directory=Path(directory)
    def probe(index,subdir):
        map_file=directory/(subdir+'.json');map_file.write_text(json.dumps(index))
        out=directory/subdir
        p=subprocess.run([sys.executable,str(COMPILER),'--root',str(ROOT/'factory-output/source-tree/eduke32-master'),
            '--source',SOURCE,'--filter','G_CheckGametype,clamp','--enum-closure','--header-dependency-closure',
            '--project-symbols',str(map_file),'--out-dir',str(out)],cwd=ROOT,check=True,capture_output=True,text=True,timeout=60)
        return json.loads((out/(SOURCE+'.manifest.json')).read_text()),(out/(SOURCE+'.mjs')).read_text()
    correct,code=probe(base,'typed')
    typed=next(row for row in correct['definitions'] if row['name']=='G_CheckGametype')
    assert typed['status']=='source-first',typed
    assert 'loguru_log' in typed['external_imports'] and 'log' not in typed['external_imports'],typed
    assert 'loguru_log(' in code
    without={name:owner for name,owner in base.items() if name!='loguru_log'}
    blocked,_=probe(without,'unsafe')
    refusal=next(row for row in blocked['definitions'] if row['name']=='G_CheckGametype')
    assert refusal['status']=='blocked' and 'incompatible C host provider' in refusal['reason'],refusal
    assert blocked['emitted']<correct['emitted']
print('PASS exact Clang Loguru identity, math-log noncollision and fail-closed missing typed provider')
