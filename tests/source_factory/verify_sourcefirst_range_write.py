#!/usr/bin/env python3
"""Mutable source C++ references must alias their original array storage."""
import json,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
SRC='tests/source_factory/source_first_range_write_fixture.cpp'
def run(cmd):
    p=subprocess.run(cmd,cwd=ROOT,text=True,capture_output=True,timeout=90)
    assert p.returncode==0,(cmd,p.stderr[-1600:],p.stdout[-500:])
    return p.stdout
with tempfile.TemporaryDirectory() as directory:
    out=Path(directory)
    run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(ROOT),
         '--source',SRC,'--filter','range_write','--out-dir',str(out)])
    module=out/(SRC+'.mjs')
    mf=json.loads(module.with_suffix('.manifest.json').read_text())
    defs={d['name']:d for d in mf['definitions']}
    assert defs['range_write']['status']=='source-first',defs['range_write']
    assert defs['range_write_unsafe']['status']=='blocked',defs['range_write_unsafe']
    assert 'reference escapes through call' in defs['range_write_unsafe']['reason'],defs['range_write_unsafe']
    code=module.read_text()
    assert 'for (let __cxx_range_index_' in code and 'C array extent mismatch' in code
    assert 'for (const item of values)' not in code,code
    run(['node','--check',str(module)])
    (out/'invoke.mjs').write_text('import {range_write} from '+json.dumps(module.as_uri())+';'
       'for(let s=-255;s<257;s++)console.log(range_write(s));\n')
    js=run(['node',str(out/'invoke.mjs')]).splitlines()
    (out/'main.cpp').write_text('#include <cstdio>\nextern "C" int range_write(int);\n'
       'int main(){for(int s=-255;s<257;s++)printf("%d\\n",range_write(s));}\n')
    run(['clang++',str(ROOT/SRC),str(out/'main.cpp'),'-o',str(out/'native')])
    native=run([str(out/'native')]).splitlines()
    assert native==js,(native[:8],js[:8])
    print('PASS: 512 native C++/JS mutable range-for cases, 2 independent loops, call-escape blocked')
