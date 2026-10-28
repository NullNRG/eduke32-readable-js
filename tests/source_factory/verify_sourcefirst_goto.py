#!/usr/bin/env python3
"""Differential Clang-source-AST JS vs native C++ for recoverable goto flows."""
import json, subprocess, sys, tempfile
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
SOURCE=ROOT/'tests/source_factory/source_first_goto_fixture.cpp'
FUNCTIONS=('forward','nested','backward','mixed','switch_exit','cleanup','two_loops','nested_error_return')

def run(cmd, **kw):
    p=subprocess.run(cmd,capture_output=True,text=True,timeout=120,**kw)
    if p.returncode:raise AssertionError(f'{cmd}\nSTDERR: {p.stderr[-2200:]}\nSTDOUT: {p.stdout[-2200:]}')
    return p.stdout

with tempfile.TemporaryDirectory(prefix='sourceflow_') as folder:
    tmp=Path(folder)
    run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(ROOT),
         '--source','tests/source_factory/source_first_goto_fixture.cpp',
         '--out-dir',str(tmp)])
    target=tmp/'tests/source_factory/source_first_goto_fixture.cpp.mjs'
    m=json.loads(target.with_suffix('.manifest.json').read_text())
    assert m['emitted']==len(FUNCTIONS) and m['blocked']==0,m
    assert m['control_flow']['structured_functions']==len(FUNCTIONS)
    js=target.read_text()
    assert 'switch (' in js and 'while (true)' in js and '__source_exit_' in js
    assert 'v["' not in js and 'ctx.load' not in js and 'switch (block)' not in js
    run(['node','--check',str(target)])
    samples=[]
    for fn in FUNCTIONS:
        for n in range(-15,46):
            for mval in ([-5,0,1,4,9] if fn in ('nested','two_loops') else [0]):
                samples.append((fn,n,mval))
    script=tmp/'native.cpp'
    script.write_text('''#include <iostream>\n#include <string>\n'''+ '\n'.join('extern "C" int '+fn+'(int'+(',int' if fn in ('nested','two_loops') else '')+');' for fn in FUNCTIONS)+'''\nint main(){ std::string fn; int n,m; while (std::cin>>fn>>n>>m) {
 int result=0;'''+''.join('if(fn=="'+fn+'")result='+fn+'(n'+(',m' if fn in ('nested','two_loops') else '')+');else ' for fn in FUNCTIONS)+'{return 3;} std::cout<<result<<"\\n";}}\n')
    executable=tmp/'native'
    run(['clang++','-std=c++14','-O0',str(SOURCE),str(script),'-o',str(executable)])
    data=''.join(f'{fn} {n} {m}\n' for fn,n,m in samples)
    native=subprocess.run([str(executable)],input=data,text=True,capture_output=True,timeout=45,check=True).stdout.splitlines()
    runner=tmp/'runner.mjs'
    runner.write_text('''import * as mod from '''+json.dumps(target.as_uri())+''';\nconst samples = '''+json.dumps(samples)+''';
for (const [fn,n,m] of samples) console.log(mod[fn](...(['nested','two_loops'].includes(fn)?[n,m]:[n])));
''')
    node=run(['node',str(runner)]).splitlines()
    assert len(native)==len(node)==len(samples)
    for i,((fn,n,m),a,b) in enumerate(zip(samples,native,node)):
        if a!=b:raise AssertionError(f'Native/JS mismatch #{i}: {fn}({n},{m}): C++={a} JS={b}')
    print(f'PASS: {len(samples)} native C++ / readable JavaScript goto parity cases, {len(FUNCTIONS)} structured functions, no LLVM fallback')
    # Irreducible crossings are not silently emitted using a PC interpreter.
    sys.path.insert(0,str(ROOT/'tools'))
    from source_control_flow import SourceFlowPlan,ControlFlowUnsupported
    ast={'kind':'CompoundStmt','inner':[
      {'kind':'GotoStmt','targetLabelDeclId':'L2'},
      {'kind':'LabelStmt','declId':'L1','name':'L1','inner':[{'kind':'NullStmt'}]},
      {'kind':'NullStmt'},
      {'kind':'LabelStmt','declId':'L2','name':'L2','inner':[{'kind':'NullStmt'}]},
      {'kind':'GotoStmt','targetLabelDeclId':'L1'},
    ]}
    try:
        SourceFlowPlan(ast)
    except ControlFlowUnsupported as e:
        assert 'irreducible' in str(e),str(e)
    else:raise AssertionError('Crossing goto graph must fail closed')
    # A destructor/temporary scope may not be elided by region conversion.
    ast={'kind':'CompoundStmt','inner':[
      {'kind':'GotoStmt','targetLabelDeclId':'END'},
      {'kind':'CXXConstructExpr'},
      {'kind':'LabelStmt','declId':'END','name':'finish','inner':[{'kind':'NullStmt'}]},
    ]}
    try: SourceFlowPlan(ast)
    except ControlFlowUnsupported as e: assert 'lifetime' in str(e)
    else: raise AssertionError('Nontrivial C++ lifetime must be blocked')
    print('PASS: irreducible graph and C++ lifetime fail-closed checks')
