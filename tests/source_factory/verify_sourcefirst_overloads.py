#!/usr/bin/env python3
"""Prove type-directed C++ overloading against the original compiled source."""
import json,subprocess,tempfile,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
SRC='tests/source_factory/source_first_overload_fixture.cpp'
def run(args):
 p=subprocess.run(args,cwd=ROOT,capture_output=True,text=True,timeout=65)
 assert p.returncode==0,(args,p.stderr[-1600:],p.stdout[-800:])
 return p.stdout
with tempfile.TemporaryDirectory() as t:
 folder=Path(t)
 run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(ROOT),'--source',SRC,'--out-dir',str(folder)])
 path=folder/(SRC+'.mjs');data=json.loads(path.with_suffix('.manifest.json').read_text())
 assert data['emitted']==4 and data['blocked']==0,data
 exports=[x for x in data['definitions'] if x['source_name']=='overloaded']
 assert len(exports)==2 and len({x['name'] for x in exports})==2,exports
 assert all(x['name'].startswith('overloaded__cxx_') for x in exports),exports
 code=path.read_text()
 assert all('export function '+x['name'] in code for x in exports),code
 assert 'LLVM' not in code.split('// Narrowing helpers')[1],code
 run(['node','--check',str(path)])
 (folder/'entry.mjs').write_text('import {unaffected,resolveOverloads} from '+json.dumps(path.as_uri())+';for(let i=-80;i<80;i++){console.log(unaffected(i));console.log(resolveOverloads(i));}')
 js=run(['node',str(folder/'entry.mjs')]).splitlines()
 (folder/'main.cpp').write_text('''#include <cstdio>
extern "C" int unaffected(int),resolveOverloads(int);
int main(){for(int i=-80;i<80;i++){printf("%d\\n",unaffected(i));printf("%d\\n",resolveOverloads(i));}}''')
 run(['clang++',str(ROOT/SRC),str(folder/'main.cpp'),'-o',str(folder/'native')]);native=run([str(folder/'native')]).splitlines()
 assert js==native,(js[:8],native[:8]);print('PASS: 320 native C++/JS cases, two type-distinguished overloads and Clang-resolved call sites')
