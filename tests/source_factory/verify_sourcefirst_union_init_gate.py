#!/usr/bin/env python3
"""Anonymous union views must preserve native byte overlap after ABI recovery."""
from pathlib import Path
import subprocess,sys,tempfile,json
ROOT=Path(__file__).resolve().parents[2]
with tempfile.TemporaryDirectory(prefix='eduke-union-gate-') as tmp:
 d=Path(tmp)
 (d/'unit.cpp').write_text('''unsigned unsafe(int x) { union { unsigned a; unsigned char bytes[4]; } u={1}; return u.bytes[x & 3]; }
int safe(int x) { struct OnlyType { int field; }; return x+7; }
''')
 p=subprocess.run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(d),'--source','unit.cpp','--out-dir',str(d/'out')],capture_output=True,text=True,timeout=65)
 assert p.returncode==0,p.stderr
 m=json.loads((d/'out/unit.cpp.manifest.json').read_text())
 rows={r['source_name']:r for r in m['definitions']}
 assert rows['unsafe']['status']=='source-first',rows['unsafe']
 assert rows['safe']['status']=='source-first',rows['safe']
 q=subprocess.run(['node','--check',str(d/'out/unit.cpp.mjs')],capture_output=True,text=True)
 assert q.returncode==0,q.stderr
 (d/'main.cpp').write_text('#include <cstdio>\nunsigned unsafe(int);int safe(int);\nint main(){for(int i=-256;i<256;i++)printf("%u,%d\\n",unsafe(i),safe(i));}\n')
 native=d/'native.exe'
 p=subprocess.run(['clang++','-std=c++14',str(d/'unit.cpp'),str(d/'main.cpp'),'-o',str(native)],capture_output=True,text=True)
 assert p.returncode==0,p.stderr
 expected=subprocess.check_output([str(native)],text=True).splitlines()
 module=d/'out/unit.cpp.mjs'
 (d/'run.mjs').write_text('import * as s from '+json.dumps(module.as_uri())+';for(let i=-256;i<256;i++)console.log(`${s.unsafe(i)},${s.safe(i)}`);')
 actual=subprocess.check_output(['node',str(d/'run.mjs')],text=True).splitlines()
 assert actual==expected,(actual[:8],expected[:8])
 print('PASS: 1024 native/JS values; anonymous union uses shared original bytes; compile-time record declaration accepted')
