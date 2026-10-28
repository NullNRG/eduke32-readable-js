#!/usr/bin/env python3
"""Native Clang / source-JavaScript parity on target array ABI and attributes."""
import json,subprocess,sys,tempfile
from pathlib import Path
root=Path(__file__).resolve().parents[2]
src=root/'tests/source_factory/source_first_array_layout_fixture.cpp'
def run(cmd):
 p=subprocess.run(cmd,cwd=root,capture_output=True,text=True,timeout=90)
 assert p.returncode==0,(cmd,p.stdout[-800:],p.stderr[-1800:])
 return p.stdout
with tempfile.TemporaryDirectory() as scratch:
 out=Path(scratch)
 run([sys.executable,str(root/'tools/source_ast_to_js.py'),'--root',str(root),'--source',str(src.relative_to(root)),'--out-dir',str(out)])
 mod=out/(str(src.relative_to(root))+'.mjs')
 manifest=json.loads(mod.with_suffix('.manifest.json').read_text())
 assert manifest['blocked']==0 and manifest['emitted']==6,manifest
 code=mod.read_text()
 assert 'switch (block)' not in code and 'LLVM' not in code,code
 run(['node','--check',str(mod)])
 (out/'driver.mjs').write_text('import * as m from '+json.dumps(mod.as_uri())+';\nconsole.log([m.matrixBytes(),m.matrixAlign(),m.rowBytes(),m.rowAlign(),m.localArrayBytes()]);for(let i=-45;i<=45;i++)console.log(m.sizeOfParameter(i));')
 got=run(['node',str(out/'driver.mjs')]).splitlines()
 (out/'driver.cpp').write_text('''#include <cstdio>\nextern "C" int matrixBytes(),matrixAlign(),rowBytes(),rowAlign(),localArrayBytes(),sizeOfParameter(int);int main(){printf("[ %d, %d, %d, %d, %d ]\\n",matrixBytes(),matrixAlign(),rowBytes(),rowAlign(),localArrayBytes());for(int i=-45;i<=45;i++)printf("%d\\n",sizeOfParameter(i));}\n''')
 run(['clang++','-std=c++20',str(src),str(out/'driver.cpp'),'-o',str(out/'native')])
 expected=run([str(out/'native')]).splitlines()
 assert got==expected,(got[:8],expected[:8])
 print('PASS: 96 native C++/JS results; fixed nested array ABI, typedef expansion, and [[likely]] semantics')
