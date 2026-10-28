#!/usr/bin/env python3
"""Clang verified implicit enum tail when filtered AST omits the EnumDecl."""
import json,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
SRC='tests/source_factory/source_first_enum_span_fixture.cpp'
def run(cmd):
 p=subprocess.run(cmd,cwd=ROOT,capture_output=True,text=True,timeout=100)
 assert p.returncode==0,(cmd,p.stdout[-1500:],p.stderr[-1500:])
 return p.stdout
with tempfile.TemporaryDirectory() as td:
 out=Path(td)
 run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(ROOT),'--source',SRC,
      '--filter','enum_span_tail','--enum-closure','--out-dir',str(out)])
 module=out/(SRC+'.mjs');mf=json.loads(module.with_suffix('.manifest.json').read_text())
 assert mf['emitted']==1,mf['definitions']
 assert mf['enum_closure']['proven_values'].get('SOURCE_END')==25,mf['enum_closure']
 run(['node','--check',str(module)])
 (out/'js.mjs').write_text('import {enum_span_tail} from '+json.dumps(module.as_uri())+';\n'
   'for(let n=-255;n<257;++n)console.log(enum_span_tail(n));\n')
 (out/'main.cpp').write_text('#include <cstdio>\nextern "C" int enum_span_tail(int);\n'
   'int main(){for(int n=-255;n<257;++n)printf("%d\\n",enum_span_tail(n));}\n')
 run(['clang++','-std=c++14',str(ROOT/SRC),str(out/'main.cpp'),'-o',str(out/'native')])
 assert run(['node',str(out/'js.mjs')])==run([str(out/'native')])
print('PASS: 512 native C++/JS implicit enum-tail parity cases with filtered Clang declaration closure')
