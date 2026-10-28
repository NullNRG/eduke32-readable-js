#!/usr/bin/env python3
"""Verify C/C++ enum identity, implicit values and readable lowering against native."""
import json, subprocess, tempfile, sys
from pathlib import Path
root=Path(__file__).resolve().parents[2]
src=root/'tests/source_factory/source_first_enum_fixture.cpp'
def run(cmd):
 p=subprocess.run(cmd,text=True,capture_output=True,timeout=55,cwd=root)
 assert p.returncode==0, f'{cmd}: {p.stderr[-1500:]} {p.stdout[-700:]}'
 return p.stdout
with tempfile.TemporaryDirectory() as temp:
 d=Path(temp)
 run([sys.executable,str(root/'tools/source_ast_to_js.py'),'--root',str(root),'--source',str(src.relative_to(root)),'--out-dir',str(d)])
 mod=d/(str(src.relative_to(root))+'.mjs')
 mf=json.loads(mod.with_suffix('.manifest.json').read_text())
 assert mf['emitted']==2 and mf['blocked']==0,mf
 code=mod.read_text()
 assert 'switch (block)' not in code and 'STATE_PENDING' not in code,code
 (d/'driver.mjs').write_text('import {classify,compute} from '+json.dumps(mod.as_uri())+';\nfor(let i=-250;i<250;i++)console.log(classify(i),compute(i));')
 js=run(['node',str(d/'driver.mjs')]).splitlines()
 (d/'main.cpp').write_text('#include <cstdio>\nextern "C" int classify(int),compute(int);int main(){for(int i=-250;i<250;i++)printf("%d %d\\n",classify(i),compute(i));}')
 run(['clang++',str(src),str(d/'main.cpp'),'-o',str(d/'native')])
 native=run([str(d/'native')]).splitlines()
 assert js==native,(js[:8],native[:8])
 print('PASS: 1,000 native C++ enum function results; readable AST enum lowering')
