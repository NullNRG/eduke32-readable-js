#!/usr/bin/env python3
"""Native C++ equivalence for backward/forward pointer alias and bounds semantics."""
import json,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]; SRC='tests/source_factory/source_first_pointer_alias_fixture.cpp'
sys.path.insert(0,str(ROOT/'tools'))
from source_runtime_helpers import embedded
def run(cmd):
 p=subprocess.run(cmd,cwd=ROOT,text=True,capture_output=True,timeout=80)
 assert p.returncode==0,(cmd,p.stderr[-2000:],p.stdout[-500:]);return p.stdout
with tempfile.TemporaryDirectory() as t:
 d=Path(t)
 run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(ROOT),'--source',SRC,'--out-dir',str(d)])
 mod=d/(SRC+'.mjs');mf=json.loads(mod.with_suffix('.manifest.json').read_text())
 assert mf['emitted']==3 and mf['blocked']==0,mf
 run(['node','--check',str(mod)])
 (d/'entry.mjs').write_text('import * as m from '+json.dumps(mod.as_uri())+';for(let i=-40;i<160;i++)console.log(m.pointerWalk(i),m.pointerAliasing(i),m.scriptWordRelocation(i));')
 js=run(['node',str(d/'entry.mjs')]).splitlines()
 (d/'driver.cpp').write_text('''#include <cstdio>
extern "C" int pointerWalk(int),pointerAliasing(int),scriptWordRelocation(int);
int main(){for(int i=-40;i<160;i++)printf("%d %d %d\\n",pointerWalk(i),pointerAliasing(i),scriptWordRelocation(i));}''')
 run(['clang++','-std=c++17',str(ROOT/SRC),str(d/'driver.cpp'),'-o',str(d/'native')]);native=run([str(d/'native')]).splitlines()
 assert js==native,(js[:12],native[:12])
 (d/'bounds.mjs').write_text(embedded(ROOT/'tools/source_address_runtime.mjs')+'\n'+embedded(ROOT/'tools/source_pointer_runtime.mjs')+'''
const bytes=new Uint8Array([2,5,7,11]);
const p=cPointerOffset(bytes,3);const q=cPointerOffset(p,-2);
if (cDeref(q,Uint8Array).value!==5) throw new Error('backward pointer lost alias');
const check=(f)=>{let ok=false;try{f()}catch(e){ok=e instanceof RangeError || e instanceof TypeError;}if(!ok)throw new Error('missing fail-closed bounds guard')};
check(()=>cPointerOffset(p,2));check(()=>cPointerOffset(q,-2));
check(()=>cDeref(cPointerOffset(bytes,4),Uint8Array).value);
check(()=>cPointerDiff(p,new Uint8Array([2,5,7,11]),1));
''')
 run(['node',str(d/'bounds.mjs')])
 print('PASS: 600 native C++/JS results for pointer aliases and integer + pointer, plus bounds/ownership guards')
