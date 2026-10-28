#!/usr/bin/env python3
"""Native-vs-JS parity for source-first char arrays and automatable inventory."""
import json,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
FRONT=ROOT/'tools/source_ast_to_js.py'
FIX=ROOT/'tests/source_factory/source_first_string_fixture.cpp'

def execute(args,**kw):
    r=subprocess.run(args,text=True,capture_output=True,timeout=55,**kw)
    if r.returncode:raise AssertionError(f'{args} failed: {r.stderr[-1500:]} {r.stdout[-1500:]}')
    return r.stdout

with tempfile.TemporaryDirectory(prefix='eduke_sourcefirst_auto_') as directory:
    temp=Path(directory)
    execute([sys.executable,str(FRONT),'--root',str(ROOT),'--source','tests/source_factory/source_first_string_fixture.cpp',
             '--out-dir',str(temp)])
    mod=temp/'tests/source_factory/source_first_string_fixture.cpp.mjs'
    manifest=json.loads(mod.with_suffix('.manifest.json').read_text())
    assert manifest['emitted']==4 and manifest['blocked']==0,manifest
    node=temp/'read.mjs'
    node.write_text('import {payload, visible, test_string_bytes, sum_pair_loop} from '+json.dumps(mod.as_uri())+';\n'+
                    'console.log(JSON.stringify({payload: [...payload], visible: [...visible], value: test_string_bytes(), pairs: Array.from({length: 48}, (_, i) => sum_pair_loop(i))}));\n')
    js=json.loads(execute(['node',str(node)]))
    native=temp/'native'
    driver=temp/'native_driver.cpp'
    driver.write_text('''#include <cstdio>\nextern "C" unsigned char payload[8];\nextern "C" char visible[12];\nextern "C" int test_string_bytes();\nextern "C" int sum_pair_loop(int);\nint main() { for(int i=0;i<8;i++)printf("%d ",payload[i]);printf("\\n");\nfor(int i=0;i<12;i++)printf("%d ",(unsigned char)visible[i]);printf("\\n%d\\n",test_string_bytes());for(int i=0;i<48;i++)printf("%d ",sum_pair_loop(i));puts(""); }''')
    execute(['clang++','-funsigned-char',str(FIX),str(driver),'-o',str(native)])
    parts=execute([str(native)]).strip().splitlines()
    native_values={'payload':list(map(int,parts[0].split())),
                   'visible':list(map(int,parts[1].split())),'value':int(parts[2]),'pairs':list(map(int,parts[3].split()))}
    assert js==native_values,(js,native_values)
    # Reject unsafe C++ cleanup destruction; discard a wrapper ONLY when no
    # C++ nontrivial temporary is enclosed.
    sys.path.insert(0,str(ROOT/'tools'))
    from source_ast_to_js import Emit,Unsupported,c_string_bytes
    expr={'kind':'ExprWithCleanups','inner':[{'kind':'CallExpr','inner':[
        {'kind':'DeclRefExpr','referencedDecl':{'name':'f'}},
        {'kind':'IntegerLiteral','value':'7','type':{'qualType':'int'}}]}]}
    assert Emit().statements(expr).strip()=='f(7);'
    hazard={'kind':'ExprWithCleanups','inner':[{'kind':'CXXBindTemporaryExpr','inner':[expr]}]}
    try:Emit().statements(hazard)
    except Unsupported as exc:assert 'cleanup' in str(exc)
    else:raise AssertionError('nontrivial cleanup must fail')
    for bad in ('"\\x100"','"\\888"','"\\q"'):
        try:c_string_bytes(bad)
        except Unsupported:pass
        else:raise AssertionError(f'malformed C bytes must fail: {bad}')
    # The original 156-unit Make inventory is now complete: recover missing
    # generated GLSL wrappers using the original GNUmakefile recipe first.
    data=json.loads(execute([sys.executable,str(ROOT/'tools/source_first_automate.py'),
                             '--inventory-only','--max-units','4']))
    assert data['make_selected']==156 and data['missing_generated_sources']==[]
    assert all((ROOT/'factory-output/source-tree/eduke32-master'/s).is_file() for s in ('obj/build/polymost1Frag.glsl.cpp','obj/build/polymost1Vert.glsl.cpp'))
    print('PASS: native C/C++ byte-array parity (20 bytes + value + 48 multi-variable for-loop results), AST cleanup checks, 156-source build inventory')
