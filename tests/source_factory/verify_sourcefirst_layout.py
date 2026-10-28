#!/usr/bin/env python3
import json,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];SRC=ROOT/'tests/source_factory/source_first_layout_fixture.cpp'
def run(command):
 p=subprocess.run(command,cwd=ROOT,capture_output=True,text=True,timeout=80)
 assert p.returncode==0,(p.stdout[-200:],p.stderr[-800:]);return p.stdout
with tempfile.TemporaryDirectory() as temp:
 out=Path(temp)
 run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(ROOT),'--source',str(SRC.relative_to(ROOT)),'--out-dir',str(out)])
 mod=out/(str(SRC.relative_to(ROOT))+'.mjs')
 report=json.loads(mod.with_suffix('.manifest.json').read_text())
 assert report['emitted']==6 and report['blocked']==0,report
 run(['node','--check',str(mod)])
 (out/'entry.mjs').write_text('import * as s from '+json.dumps(mod.as_uri())+'; console.log([s.packetSize(),s.packetAlign(),s.packedSize(),s.packedAlign()].join(","));')
 actual=run(['node',str(out/'entry.mjs')]).strip()
 (out/'main.cpp').write_text('''#include <cstdio>\nextern "C" int packetSize(),packetAlign(),packedSize(),packedAlign();int main(){printf("%d,%d,%d,%d\\n",packetSize(),packetAlign(),packedSize(),packedAlign());}''')
 run(['clang++',str(SRC),str(out/'main.cpp'),'-o',str(out/'original')])
 expected=run([str(out/'original')]).strip()
 assert actual==expected,(actual,expected)
 print('PASS: exact Clang ABI sizeof/alignof parity, including 16-byte struct alignment')
