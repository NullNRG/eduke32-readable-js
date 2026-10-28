"""Native C++ parity: null pointer arrays and full-width integer globals."""
import json,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
SRC='tests/source_factory/source_first_aggregate_slots_fixture.cpp'
def run(argv):
 p=subprocess.run(argv,cwd=ROOT,capture_output=True,text=True,timeout=90)
 assert p.returncode==0,(argv,p.stderr[-1200:],p.stdout[-500:])
 return p.stdout
with tempfile.TemporaryDirectory() as tmp:
 d=Path(tmp)
 run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(ROOT),'--source',SRC,'--out-dir',str(d)])
 module=d/(SRC+'.mjs');mf=json.loads(module.with_suffix('.manifest.json').read_text())
 assert mf['emitted']==6 and mf['blocked']==0,mf
 run(['node','--check',str(module)])
 (d/'runner.mjs').write_text('import * as m from '+json.dumps(module.as_uri())+';\nfor(let i=0;i<512;i++)console.log(m.ref_probe(i)+","+m.count_probe(i)+","+m.sign_probe(i));')
 observed=run(['node',str(d/'runner.mjs')]).splitlines()
 (d/'driver.cpp').write_text('#include <cstdio>\nextern "C" int ref_probe(int),sign_probe(int);\nextern "C" unsigned long long count_probe(int);\nint main(){for(int i=0;i<512;i++)printf("%d,%llu,%d\\n",ref_probe(i),count_probe(i),sign_probe(i));}')
 run(['clang++','-std=c++20',str(ROOT/SRC),str(d/'driver.cpp'),'-o',str(d/'native')])
 expected=run([str(d/'native')]).splitlines()
 assert expected==observed,(expected[:10],observed[:10])
 print('PASS: 1,536 comparisons covering null pointer array identity, 64-bit integer arrays, and short-width arrays')
