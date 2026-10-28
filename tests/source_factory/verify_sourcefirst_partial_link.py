#!/usr/bin/env python3
"""Native original-AST linking: one bad provider cannot poison an independent export."""
import json
from pathlib import Path
import subprocess
import sys
import tempfile

ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'tools'))
from source_first_global_link import relink

with tempfile.TemporaryDirectory(prefix='source_link_partial_') as scratch:
    temp=Path(scratch);src=temp/'original';src.mkdir()
    (src/'provider.cpp').write_text('''extern int absent();
int unstable(){ return absent(); }
int stable(){ return 7; }
''')
    (src/'consumer.cpp').write_text('''extern int stable(); extern int unstable();
int useful(){ return stable()+5; }
int unsafe(){ return unstable()+2; }
''')
    out=temp/'automatic';out.mkdir()
    batches=[]
    for i,name in enumerate(('provider.cpp','consumer.cpp')):
        batch=out/f'batch{i}';batch.mkdir()
        proc=subprocess.run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),
            '--root',str(src),'--source',name,'--out-dir',str(batch)],
            capture_output=True,text=True,timeout=90,cwd=ROOT)
        assert proc.returncode==0,(proc.stderr,proc.stdout)
        (batch/'project-build.json').write_text(json.dumps({'units':[{'source':name}]}))
        batches.append({'status':'ok','sources':[name],'manifest':f'batch{i}/project-build.json'})
    (out/'recovery-report.json').write_text(json.dumps({'original_selected_units':2,'batch_results':batches}))
    link=temp/'linked'
    result=relink(out,link,src,round_limit=3,timeout=90,jobs=2)
    assert result['completed_source_units']==2,result
    assert not result['invalid_imports_or_syntax'],result['invalid_imports_or_syntax']
    mf=json.loads((link/'consumer.cpp.manifest.json').read_text())
    definitions={v['name']:v for v in mf['definitions']}
    assert definitions['useful']['status']=='source-first',definitions['useful']
    assert definitions['unsafe']['status']=='blocked',definitions['unsafe']
    assert any(v.get('phase')=='dependency-pruning' and 'unstable' in v['unproven_tentative_declarations']
               for v in result['recovery_attempts']),result['recovery_attempts']
    mod=link/'consumer.cpp.mjs'
    comparison=subprocess.run(['clang++','-std=c++14','-x','c++','-','-o',str(temp/'reference')],
        input='int stable(){return 7;} int useful(){return stable()+5;} '
              '\n#include <iostream>\nint main(){std::cout<<useful()<<"\\n";}',
        text=True,capture_output=True)
    assert comparison.returncode==0,comparison.stderr
    expected=subprocess.check_output([str(temp/'reference')],text=True).strip()
    runner=temp/'main.mjs'
    runner.write_text('import {useful} from '+json.dumps(mod.as_uri())+';console.log(useful());')
    observed=subprocess.check_output(['node',str(runner)],text=True).strip()
    assert expected==observed=='12',(expected,observed)
    print('PASS: proof-driven dependency pruning retained original callable source, blocked unlinked provider, native/JS parity 12')
