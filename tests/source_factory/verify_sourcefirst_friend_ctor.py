#!/usr/bin/env python3
"""Original source-defined C++ friends, typed constructors and class copies."""
import json, subprocess, sys, tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
SRC='tests/source_factory/source_first_friend_ctor_fixture.cpp'
def run(argv):
    p=subprocess.run(argv,cwd=ROOT,capture_output=True,text=True,timeout=120)
    assert p.returncode==0,(argv,p.stdout[-600:],p.stderr[-1500:]);return p.stdout
with tempfile.TemporaryDirectory(prefix='eduke_friend_parity_') as tmp:
    tmp=Path(tmp)
    native=tmp/'native'
    (tmp/'main.cpp').write_text('''#include <cstdio>
extern "C" int run(int,int);
int main(){for(int a=-50;a<50;a++)for(int b=-5;b<5;b++)printf("%d\\n",run(a,b));}
''')
    run(['clang++','-std=c++14','-O0',SRC,str(tmp/'main.cpp'),'-o',str(native)])
    expected=run([str(native)]).splitlines()
    assert len(expected)==1000
    for mode in ('full','filtered'):
        out=tmp/mode
        cmd=[sys.executable,'tools/source_ast_to_js.py','--root',str(ROOT),
             '--source',SRC,'--out-dir',str(out)]
        if mode=='filtered':cmd+=['--filter','run']
        run(cmd)
        generated=out/(SRC+'.mjs')
        manifest=json.loads(generated.with_suffix('.manifest.json').read_text())
        assert {'run','Counter'}.issubset({d['name'] for d in manifest['definitions']
                                               if d['status']=='source-first'}),manifest['definitions']
        friends=[d for d in manifest['definitions'] if d.get('source_name') in ('operator-','operator<')]
        assert len(friends)==2 and all(d['status']=='source-first' for d in friends),friends
        if mode=='filtered':
            assert ('Counter' in (manifest['friend_closure']['proven']+manifest['pod_record_closure']['proven']) or manifest['full_type_closure']['retained_type_roots']>0),manifest
        run(['node','--check',str(generated)])
        (tmp/(mode+'.mjs')).write_text('import {run} from '+json.dumps(generated.as_uri())+';\n'
            +'for(let a=-50;a<50;a++)for(let b=-5;b<5;b++)console.log(run(a,b));\n')
        observed=run(['node',str(tmp/(mode+'.mjs'))]).splitlines()
        assert observed==expected,[(i,a,b) for i,(a,b) in enumerate(zip(expected,observed)) if a!=b][:10]
print('PASS: 2,000 native C++/readable JS friend-operator and overloaded-delegating-constructor parity cases; filtered header friend closure')
