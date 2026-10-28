#!/usr/bin/env python3
"""Source-selected C++ operator overloads, native parity and refusal checks."""
from pathlib import Path
import json,subprocess,sys,tempfile
ROOT=Path(__file__).resolve().parents[2]
SOURCES=('source_first_operator_fixture.cpp','source_first_operator_method_fixture.cpp','source_first_conversion_fixture.cpp')
def run(cmd):
    p=subprocess.run(cmd,cwd=ROOT,capture_output=True,text=True,timeout=150)
    assert p.returncode==0,(cmd,p.stdout[-1000:],p.stderr[-1300:])
    return p.stdout
with tempfile.TemporaryDirectory(prefix='eduke_source_ops_') as folder:
    path=Path(folder)
    paths=[]
    for source in SOURCES:
        source='tests/source_factory/'+source
        run([sys.executable,'tools/source_ast_to_js.py','--root',str(ROOT),
             '--source',source,'--out-dir',str(path)])
        module=path/(source+'.mjs');paths.append(module)
        manifest=json.loads(module.with_suffix('.manifest.json').read_text())
        exported={entry['name']:entry for entry in manifest['definitions'] if entry['status']=='source-first'}
        if 'method_' in source:
            assert {'Counter','member_ops'}<=exported.keys(),manifest['definitions']
            blocked={entry['name']:entry for entry in manifest['definitions'] if entry['status']=='blocked'}
            assert 'Unsafe' in blocked and 'unsafe_class' in blocked,manifest['definitions']
            assert 'pointer/reference field' in blocked['Unsafe']['reason'],blocked['Unsafe']
            unsafe=blocked['unsafe_class']
            assert ('Unsafe' in unsafe['reason'] or
                    (unsafe['reason']=='automatic aggregate pointer initializer requires original owner'
                     and 'Unsafe' in unsafe['source_references'])),unsafe
        elif 'conversion_' in source:
            assert {'__cxx_Number','conversion_probe'}<=exported.keys(),manifest['definitions']
            assert 'CXXConversionDecl' not in module.read_text(),module
        else:
            assert 'operator_mix' in exported,manifest['definitions']
            ops=[e for e in manifest['definitions'] if e['source_name']=='operator|']
            assert len(ops)==2 and len({e['name'] for e in ops})==2 and all(e['status']=='source-first' for e in ops),ops
        run(['node','--check',str(module)])
    (path/'driver.cpp').write_text('''#include <cstdio>
extern "C" int operator_mix(int),member_ops(int),conversion_probe(int);
int main(){for(int i=-100;i<100;i++) printf("%d %d %d\\n",operator_mix(i),member_ops(i),conversion_probe(i));}
''')
    run(['clang++','-std=c++14','-O0',str(ROOT/'tests/source_factory'/SOURCES[0]),
         str(ROOT/'tests/source_factory'/SOURCES[1]),str(ROOT/'tests/source_factory'/SOURCES[2]),str(path/'driver.cpp'),'-o',str(path/'native')])
    expected=run([str(path/'native')]).splitlines()
    (path/'driver.mjs').write_text('import {operator_mix} from '+json.dumps(paths[0].as_uri())+';\n'
         'import {member_ops} from '+json.dumps(paths[1].as_uri())+';\n'
         'import {conversion_probe} from '+json.dumps(paths[2].as_uri())+';\n'
         'for(let i=-100;i<100;i++)console.log(operator_mix(i),member_ops(i),conversion_probe(i));\n')
    observed=run(['node',str(path/'driver.mjs')]).splitlines()
    assert len(expected)==len(observed)==200,(len(expected),len(observed))
    assert expected==observed,[(i-100,a,b) for i,(a,b) in enumerate(zip(expected,observed)) if a!=b][:15]
    print('PASS: 600 native C++/JS operator cases, Clang-selected overloaded enum operators, mutating class operators, unsafe pointer-owning class correctly blocked')
