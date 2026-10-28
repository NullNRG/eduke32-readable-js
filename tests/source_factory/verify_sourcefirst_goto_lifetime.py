#!/usr/bin/env python3
"""Clang-proven C++ trivial destruction and declaration-ID goto alpha-renaming.
Native C++ parity; no interpreter, stub, invented C++ destructor or game-specific code.
"""
import json,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
SOURCE='tests/source_factory/source_first_goto_lifetime_fixture.cpp'
def run(command):
    proc=subprocess.run(command,cwd=ROOT,capture_output=True,text=True,timeout=120)
    assert proc.returncode==0,(command,proc.stdout[-800:],proc.stderr[-1400:])
    return proc.stdout
with tempfile.TemporaryDirectory(prefix='eduke_goto_lifetime_') as folder:
    out=Path(folder)
    run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(ROOT),
         '--source',SOURCE,'--out-dir',str(out)])
    module=out/(SOURCE+'.mjs')
    manifest=json.loads(module.with_suffix('.manifest.json').read_text())
    defs={row['name']:row for row in manifest['definitions']}
    for name in ('trivial_ctor_loop','shadowed_loop'):
        assert defs[name]['status']=='source-first',defs[name]
    assert defs['nontrivial_ctor_loop']['status']=='blocked',defs['nontrivial_ctor_loop']
    assert 'trivial destructor' in defs['nontrivial_ctor_loop']['reason']
    assert defs['trivial_ctor_loop']['control_flow']['detected']['trivial_constructions_checked']==1
    assert defs['shadowed_loop']['control_flow']['detected']['shadowed_locals_renamed']==1
    run(['node','--check',str(module)])
    (out/'native-driver.cpp').write_text('''#include <cstdio>
extern "C" int trivial_ctor_loop(int), shadowed_loop(int);
int main(){for(int x=-30;x<=140;x++) printf("%d %d\\n",trivial_ctor_loop(x),shadowed_loop(x));}
''')
    native=out/'native'
    run(['clang++','-std=c++14','-O0',str(ROOT/SOURCE),str(out/'native-driver.cpp'),'-o',str(native)])
    expectation=run([str(native)]).splitlines()
    (out/'js-driver.mjs').write_text('import {trivial_ctor_loop, shadowed_loop} from '+json.dumps(module.as_uri())+';\n'
         'for(let x=-30;x<=140;x++)console.log(trivial_ctor_loop(x),shadowed_loop(x));\n')
    observed=run(['node',str(out/'js-driver.mjs')]).splitlines()
    assert len(expectation)==len(observed)==171,(len(expectation),len(observed))
    for x,(native_result,js_result) in enumerate(zip(expectation,observed)):
        assert native_result==js_result,(x-30,native_result,js_result)
    print('PASS: 342 native C++/JS goto construction and shadowed-local comparisons; nontrivial destructor blocked')
