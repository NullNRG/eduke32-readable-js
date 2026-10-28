#!/usr/bin/env python3
"""No C++ translation-unit `static` definition can supply external imports.

Test real original-source pre-change manifests, Clang metadata, source builds,
and native C++ versus generated JavaScript state across two TUs.
"""
import json
from pathlib import Path
import subprocess
import sys
import tempfile

ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'tools'))
from source_first_global_link import (ownership,declared_ownership,internal_definition,
                                     gather_batches,relink,settle_proposals)

SRCROOT=ROOT/'factory-output/source-tree/eduke32-master'
UNIT_ROOT=ROOT/'factory-output/source-first/current-full-check/automatic'
# Exercise the COMPLETE historical inventory, not only synthetic objects.
_, recorded=gather_batches(UNIT_ROOT)
external,ambiguities=ownership(recorded,SRCROOT)
for token in ('ErrorCode','NET_75_CHECK','fx','tempbuf','xlat_fx'):
    assert token not in ambiguities,(token,ambiguities.get(token))
    assert token not in external,token
    assert any(internal_definition(unit,d,SRCROOT,src)
       for src,unit in recorded.items() for d in unit['manifest']['definitions']
       if d['name']==token and d['status']=='source-first'),token
assert not ambiguities,ambiguities
# An internal provider can never resolve an import, even through a tentative
# dependency closure or a remote file with a same-spelled symbol.
units={'a.c':{'module':None,'manifest':{'definitions':[
    {'name':'hidden','kind':'FunctionDecl','linkage':'internal','status':'source-first'}], 'imports':[]}},
    'b.c':{'module':None,'manifest':{'definitions':[
    {'name':'client','kind':'FunctionDecl','linkage':'external','status':'source-first'}],
    'imports':[{'name':'hidden','from':'a.c'}]}}}
assert 'hidden' not in ownership(units)[0]
assert 'hidden' not in declared_ownership(units)[0]
accepted,rejected=settle_proposals({'a.c':units['a.c']},{'b.c':units['b.c']})
assert not accepted and 'b.c' in rejected

with tempfile.TemporaryDirectory(prefix='eduke_static_linkage_') as td:
    base=Path(td)
    (base/'left.cpp').write_text('''static int counter=11;
static int calculate(int value){return counter+=value;}
extern "C" int run_left(int v){return calculate(v);}
''')
    (base/'right.cpp').write_text('''static int counter=-9;
static int calculate(int value){return counter-=value;}
extern "C" int run_right(int v){return calculate(v);}
''')
    plan=base/'plan.json'
    plan.write_text(json.dumps({'root':str(base),'units':[{'source':'left.cpp'},{'source':'right.cpp'}]}))
    build=base/'build'
    cmd=[sys.executable,str(ROOT/'tools/source_first_project.py'),'--plan',str(plan),'--out-dir',str(build)]
    p=subprocess.run(cmd,cwd=ROOT,text=True,capture_output=True,timeout=100)
    assert p.returncode==0,(p.stdout[-1000:],p.stderr[-1000:])
    modules=[]
    for src in ('left.cpp','right.cpp'):
        mf=json.loads((build/(src+'.manifest.json')).read_text())
        entries={d['name']:d for d in mf['definitions']}
        assert entries['counter']['linkage']=='internal',entries
        assert entries['calculate']['linkage']=='internal',entries
        assert all(entries[k]['status']=='source-first' for k in entries),entries
        modules.append((src,{'manifest':mf,'module':build/(src+'.mjs')}))
    own,amb=ownership(dict(modules))
    assert not amb and set(own)=={'run_left','run_right'},(own,amb)
    # Validate complete independent static state (not just first call).
    js=base/'entry.mjs'
    js.write_text('''import {run_left} from './build/left.cpp.mjs';
import {run_right} from './build/right.cpp.mjs';
for(let i=0;i<320;i++){
  const a=i%13-6,b=i%17-8;
  console.log(run_left(a)+','+run_right(b));
}
''')
    native=base/'main.cpp'
    native.write_text('''#include <cstdio>
extern "C" int run_left(int),run_right(int);
int main(){for(int i=0;i<320;i++){int a=i%13-6,b=i%17-8;
printf("%d,%d\\n",run_left(a),run_right(b));}}
''')
    cpp=base/'orig'
    p=subprocess.run(['clang++',str(base/'left.cpp'),str(base/'right.cpp'),str(native),'-o',str(cpp)],capture_output=True,text=True,timeout=40)
    assert p.returncode==0,p.stderr
    def run(cmd):
        p=subprocess.run(cmd,cwd=base,text=True,capture_output=True,timeout=40)
        assert p.returncode==0,(p.stderr[-1000:],p.stdout[-300:])
        return p.stdout.splitlines()
    assert run(['node',str(js)])==run([str(cpp)])
print('PASS: 5 real historical private symbol collisions eliminated; native/JS parity 640 values, global provider isolation')
