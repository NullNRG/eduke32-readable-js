#!/usr/bin/env python3
import json,sys,subprocess,tempfile
from pathlib import Path
root=Path(__file__).resolve().parents[2];src=root/'tests/source_factory/source_first_scope_fixture.cpp'
def run(argv):
 p=subprocess.run(argv,cwd=root,text=True,capture_output=True,timeout=60)
 assert p.returncode==0,(p.stderr[-1000:],p.stdout[-1000:]);return p.stdout
with tempfile.TemporaryDirectory() as t:
 dest=Path(t)
 run([sys.executable,str(root/'tools/source_ast_to_js.py'),'--root',str(root),'--source',str(src.relative_to(root)),'--out-dir',str(dest)])
 module=dest/(str(src.relative_to(root))+'.mjs')
 report=json.loads(module.with_suffix('.manifest.json').read_text())
 assert report['emitted']==2 and report['blocked']==0,report
 run(['node','--check',str(module)])
 (dest/'call.mjs').write_text('import {switch_scope,block_scope} from '+json.dumps(module.as_uri())+';for(let i=-80;i<80;i++)console.log(switch_scope((i%6+6)%6-1,i),block_scope(i));')
 js=run(['node',str(dest/'call.mjs')]).splitlines()
 (dest/'main.cpp').write_text('''#include <cstdio>\nextern "C" int switch_scope(int,int),block_scope(int);int main(){for(int i=-80;i<80;i++)printf("%d %d\\n",switch_scope((i%6+6)%6-1,i),block_scope(i));}''')
 run(['clang++',str(src),str(dest/'main.cpp'),'-o',str(dest/'original')])
 native=run([str(dest/'original')]).splitlines()
 assert js==native,(js[:7],native[:7])
 print('PASS: 320 native/JS scope and switch cases, C++ shadowing maintained')
