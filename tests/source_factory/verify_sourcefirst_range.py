#!/usr/bin/env python3
"""Source AST range-for structural lowering and native-vs-JS parity."""
import json
from pathlib import Path
import subprocess
import sys
import tempfile
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'tools'))
from source_ast_to_js import Emit,parse_json_stream,kind,kids,Unsupported
SRC=ROOT/'tests/source_factory/source_first_range_fixture.cpp'
p=subprocess.run(['clang++','-std=gnu++14','-Xclang','-ast-dump=json',
    '-Xclang','-ast-dump-filter=range_','-fsyntax-only',str(SRC)],
    text=True,capture_output=True,check=True)
ns=[n for n in parse_json_stream(p.stdout) if kind(n)=='FunctionDecl' and any(kind(x)=='CompoundStmt' for x in kids(n))]
assert len(ns)==2,len(ns)
functions=[Emit().function(n) for n in ns]
assert all('for (const entry of lookup)' in f for f in functions)
assert all('while (true)' not in f and 'switch (block)' not in f for f in functions)
with tempfile.TemporaryDirectory() as td:
    tmp=Path(td)
    m=tmp/'out.mjs'
    m.write_text('const i32 = n => n | 0;\nconst lookup=[{code:4,value:30},{code:7,value:40},{code:7,value:50},{code:12,value:60},{code:-2,value:90}];\n'
                 +'\n'.join(functions)+'\n')
    subprocess.run(['node','--check',str(m)],check=True)
    node='import {range_find,range_sum} from '+json.dumps(m.as_uri())+'; console.log(JSON.stringify({find:Array.from({length:301},(_,i)=>range_find(i-150)),sum:range_sum()}));'
    js=subprocess.run(['node','--input-type=module','-e',node],capture_output=True,text=True,check=True)
    driver=tmp/'driver.cpp'
    driver.write_text('#include <cstdio>\nextern "C" int range_find(int);extern "C" int range_sum();\nint main(){for(int i=-150;i<=150;i++)printf("%d,",range_find(i));printf("\\n%d\\n",range_sum());}')
    native=tmp/'native'
    subprocess.run(['clang++',str(SRC),str(driver),'-o',str(native)],check=True)
    got=subprocess.run([str(native)],capture_output=True,text=True,check=True).stdout.splitlines()
    actual=json.loads(js.stdout)
    assert actual['find']==[int(s) for s in got[0].split(',') if s]
    assert actual['sum']==int(got[1])
    # By-value records are not accidentally lowered into JS references.
    broken=json.loads(json.dumps(ns[0]))
    def walk(n):
        if n.get('kind')=='CXXForRangeStmt':
            n['inner'][6]['inner'][0]['type']={'qualType':'Lookup'}
        for child in n.get('inner',[]):
            if child:walk(child)
    walk(broken)
    try:Emit().function(broken)
    except Unsupported as e:assert 'range iteration' in str(e)
    else:raise AssertionError('record copies must not silently alias')
print('PASS: 302 native C++/JS array range-for parity results; readable for...of; by-value record safety')
