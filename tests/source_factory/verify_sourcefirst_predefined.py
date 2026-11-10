#!/usr/bin/env python3
"""Clang-provided predefined identifiers: original-native vs source JS parity."""
import json, subprocess, sys, tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
SOURCE='tests/source_factory/source_first_predefined_fixture.cpp'
def run(command):
    p=subprocess.run(command,cwd=ROOT,text=True,capture_output=True,timeout=90)
    assert p.returncode==0,(command,p.stderr[-1200:],p.stdout[-300:])
    return p.stdout
with tempfile.TemporaryDirectory() as directory:
    out=Path(directory)
    run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'), '--root',str(ROOT),
        '--source',SOURCE,'--out-dir',str(out)])
    module=out/(SOURCE+'.mjs')
    manifest=json.loads(module.with_suffix('.manifest.json').read_text())
    assert manifest['emitted']==1 and manifest['blocked']==0,manifest
    text=module.read_text()
    assert '__PRETTY_FUNCTION__' not in text,text[:2500]
    run(['node','--check',str(module)])
    (out/'invoke.mjs').write_text('import {boot_name} from '+json.dumps(module.as_uri())+';\n'
        'for(let x=-256;x<256;x++)console.log(boot_name(x));\n')
    js=run(['node',str(out/'invoke.mjs')]).splitlines()
    (out/'main.cpp').write_text('#include <cstdio>\nextern "C" int boot_name(int);\n'
        'int main(){for(int x=-256;x<256;x++)printf("%d\\n",boot_name(x));}\n')
    run(['clang++',str(ROOT/SOURCE),str(out/'main.cpp'),'-o',str(out/'native')])
    native=run([str(out/'native')]).splitlines()
    assert native==js,(native[:10],js[:10])
    print('PASS: 512 original C++ vs readable JS cases, Clang-verified predefined identifiers')
