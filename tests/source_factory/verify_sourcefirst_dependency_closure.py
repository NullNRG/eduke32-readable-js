#!/usr/bin/env python3
"""Filtered AST dependency transitive closure with native-source parity."""
import json,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]; SRC='tests/source_factory/source_first_dependency_closure_fixture.cpp'
def run(cmd):
 p=subprocess.run(cmd,cwd=ROOT,text=True,capture_output=True,timeout=90)
 assert p.returncode==0,(cmd,p.stderr[-1400:],p.stdout[-350:]);return p.stdout
with tempfile.TemporaryDirectory() as t:
 d=Path(t)
 flags=[sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(ROOT),'--source',SRC,'--filter','closureEntry','--out-dir',str(d)]
 run(flags)
 mod=d/(SRC+'.mjs');base=json.loads(mod.with_suffix('.manifest.json').read_text())
 assert base['emitted']==0 and base['blocked']==1,base
 run(flags+['--dependency-closure'])
 mf=json.loads(mod.with_suffix('.manifest.json').read_text())
 assert mf['emitted']==3 and mf['blocked']==0,mf
 assert set(mf['dependency_closure']['additional_ast_filters'])=={'closureHelper','closureLeaf'},mf
 run(['node','--check',str(mod)])
 (d/'entry.mjs').write_text('import {closureEntry} from '+json.dumps(mod.as_uri())+';for(let i=-64;i<64;i++)console.log(closureEntry(i));')
 js=run(['node',str(d/'entry.mjs')]).splitlines()
 (d/'native.cpp').write_text('''#include <cstdio>
extern "C" int closureEntry(int);
int main(){for(int i=-64;i<64;i++)printf("%d\\n",closureEntry(i));}''')
 run(['clang++',str(ROOT/SRC),str(d/'native.cpp'),'-o',str(d/'native')]);native=run([str(d/'native')]).splitlines()
 assert js==native,(js[:6],native[:6])
 print('PASS: 128 native C++/JS cases; automatic two-level filtered AST dependency closure')
