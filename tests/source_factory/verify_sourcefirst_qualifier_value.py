#!/usr/bin/env python3
"""Qualifiers preserve pointer identity; C++ scalar value-init preserves zeros."""
import json, subprocess, sys, tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
SRC='tests/source_factory/source_first_qualifier_value_fixture.cpp'
def run(argv):
    p=subprocess.run(argv,cwd=ROOT,capture_output=True,text=True,timeout=90)
    assert p.returncode==0,(argv,p.stderr[-1400:],p.stdout[-600:])
    return p.stdout
with tempfile.TemporaryDirectory() as tmp:
    d=Path(tmp)
    run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(ROOT),'--source',SRC,'--out-dir',str(d)])
    m=d/(SRC+'.mjs')
    data=json.loads(m.with_suffix('.manifest.json').read_text())
    emitted={v['name'] for v in data['definitions'] if v['status']=='source-first'}
    assert {'const_alias_identity','zero_initialized_scalar'} <= emitted,data
    assert 'initialized_fields' in emitted,data
    run(['node','--check',str(m)])
    (d/'runner.mjs').write_text('import * as m from '+json.dumps(m.as_uri())+';\nfor(let i=-256;i<256;i++){const p=new Int32Array([i]);console.log(m.const_alias_identity(p,i)+":"+m.zero_initialized_scalar(i)+":"+m.initialized_fields(i));}\n')
    observed=run(['node',str(d/'runner.mjs')]).splitlines()
    (d/'driver.cpp').write_text('#include <cstdio>\nextern "C" int const_alias_identity(int*,int),zero_initialized_scalar(int),initialized_fields(int);\nint main(){for(int i=-256;i<256;i++){int p=i;printf("%d:%d:%d\\n",const_alias_identity(&p,i),zero_initialized_scalar(i),initialized_fields(i));}}')
    run(['clang++','-std=c++20',str(ROOT/SRC),str(d/'driver.cpp'),'-o',str(d/'native')])
    expected=run([str(d/'native')]).splitlines()
    assert observed==expected,(observed[:7],expected[:7])
    print('PASS: 1536 native/JS comparisons: cv-cast identity, scalar value-init, and Clang-proven in-class aggregate defaults')
