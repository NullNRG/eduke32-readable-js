#!/usr/bin/env python3
"""Native C++ parity for Clang-proven POD value copies and array independence."""
import json,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
SRC='tests/source_factory/source_first_trivial_aggregate_fixture.cpp'
def run(argv):
    p=subprocess.run(argv,cwd=ROOT,capture_output=True,text=True,timeout=120)
    assert p.returncode==0,(argv,p.stdout[-2000:],p.stderr[-2000:]);return p.stdout
with tempfile.TemporaryDirectory() as temp:
    path=Path(temp)
    run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(ROOT),'--source',SRC,'--out-dir',str(path)])
    mod=path/(SRC+'.mjs'); data=json.loads(mod.with_suffix('.manifest.json').read_text())
    defs={d['source_name']:d for d in data['definitions']}
    for name in ('by_value_host','copy_twice'):
        assert defs[name]['status']=='source-first',defs[name]
    for name in ('pointer_alias_must_block','custom_copy_must_block'):
        assert defs[name]['status']=='blocked',defs[name]
    run(['node','--check',str(mod)])
    (path/'js.mjs').write_text('import {by_value_host,copy_twice} from '+json.dumps(mod.as_uri())+';\n'
        'for(let i=-256;i<256;i++)console.log(by_value_host(i)+","+copy_twice(i));\n')
    observed=run(['node',str(path/'js.mjs')]).splitlines()
    (path/'main.cpp').write_text('#include <cstdio>\nextern "C" int by_value_host(int),copy_twice(int);\n'
        'int main(){for(int i=-256;i<256;i++)printf("%d,%d\\n",by_value_host(i),copy_twice(i));}\n')
    run(['clang++','-std=c++14',str(ROOT/SRC),str(path/'main.cpp'),'-o',str(path/'native')])
    expected=run([str(path/'native')]).splitlines()
    assert expected==observed,next(((i,a,b) for i,(a,b) in enumerate(zip(expected,observed)) if a!=b),None)
    print('PASS: 1,024 native C++/JS comparisons, nested POD copies and array isolation; pointer and custom copies blocked')
