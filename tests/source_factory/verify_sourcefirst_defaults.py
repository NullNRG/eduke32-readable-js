#!/usr/bin/env python3
import json,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
SRC=ROOT/'tests/source_factory/source_first_default_fixture.cpp'
def run(argv):
 p=subprocess.run(argv,cwd=ROOT,capture_output=True,text=True,timeout=60)
 assert p.returncode==0,(p.stderr[-900:],p.stdout[-300:]);return p.stdout
with tempfile.TemporaryDirectory() as tmp:
 d=Path(tmp)
 run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(ROOT),'--source',str(SRC.relative_to(ROOT)),'--out-dir',str(d)])
 mod=d/(str(SRC.relative_to(ROOT))+'.mjs');report=json.loads(mod.with_suffix('.manifest.json').read_text())
 assert report['emitted']==2 and report['blocked']==0,report
 (d/'entry.mjs').write_text('import {test_default} from '+json.dumps(mod.as_uri())+';for(let i=-120;i<120;i++)console.log(test_default(i));')
 js=run(['node',str(d/'entry.mjs')]).splitlines()
 (d/'main.cpp').write_text('''#include <cstdio>\nextern "C" int test_default(int);int main(){for(int i=-120;i<120;i++)printf("%d\\n",test_default(i));}''')
 run(['clang++',str(SRC),str(d/'main.cpp'),'-o',str(d/'original')]);native=run([str(d/'original')]).splitlines()
 assert js==native,(js[:7],native[:7])
 print('PASS: 240 native C++ default-argument call cases; AST-proven original initializer')
