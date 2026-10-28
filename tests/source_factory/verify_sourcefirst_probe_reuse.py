"""Reuse only identical empty-index probes; preserve real linking and guards."""
from contextlib import redirect_stdout
from io import StringIO
import json
from pathlib import Path
import subprocess
import sys
import tempfile
from unittest.mock import patch

ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'tools'))
import source_first_project as project


def build(root,units,name,strict=True,corrupt=False):
    plan=root/(name+'.json');out=root/name
    plan.write_text(json.dumps({'root':str(root),'units':[{'source':source} for source in units]}))
    original=project.run_emit
    def emit(*args,**kwargs):
        result=original(*args,**kwargs)
        if corrupt:Path(result['file']).write_text('export function broken( {\n')
        return result
    argv=['source_first_project.py','--plan',str(plan),'--out-dir',str(out)]
    if strict:argv.append('--strict')
    with patch.object(sys,'argv',argv),patch.object(project,'run_emit',side_effect=emit) as calls,redirect_stdout(StringIO()):
        code=project.main()
    report=json.loads((out/'project-build.json').read_text())
    return code,report,calls.call_args_list,out


with tempfile.TemporaryDirectory(prefix='source probe reuse ') as temp:
    root=Path(temp)
    (root/'single.cpp').write_text('int singleton(int value){return value*3+4;}\n')
    code,report,calls,out=build(root,['single.cpp'],'single')
    assert code==0 and len(calls)==report['compiler_passes']==1,(code,report,calls)
    assert report['reused_empty_external_index_probes']==['single.cpp']
    assert report['source_definitions_emitted']==1 and not report['source_definitions_blocked']
    assert report['attempted_units']==1 and not report['invalid_imports']
    for name,delta in (('local-left.cpp',11),('local-right.cpp',-9)):
        (root/name).write_text(f'static int internal_only(int value){{return value+({delta});}}\n')
    code,report,calls,_=build(root,['local-left.cpp','local-right.cpp'],'internal')
    assert code==0 and len(calls)==report['compiler_passes']==2,(code,report,calls)
    assert len(report['reused_empty_external_index_probes'])==2 and not report['relowered_with_external_index']
    assert report['source_definitions_emitted']==2 and report['attempted_units']==2
    (root/'provider.cpp').write_text('int provider(int value){return value+7;}\n')
    (root/'consumer.cpp').write_text('extern int provider(int); int consumer(int value){return provider(value)*2;}\n')
    code,report,calls,out=build(root,['provider.cpp','consumer.cpp'],'linked')
    assert code==0 and len(calls)==report['compiler_passes']==3,(code,report,calls)
    assert report['reused_unaffected_external_index_probes']==['provider.cpp']
    assert report['relowered_with_external_index']==['consumer.cpp']
    assert report['linked_imports']==1 and not report['invalid_imports'] and report['source_definitions_emitted']==2
    source=out/'consumer.cpp.mjs';manifest=json.loads(source.with_suffix('.manifest.json').read_text())
    assert any(row['name']=='provider' and row['from']=='provider.cpp' for row in manifest['imports'])
    js=root/'run.mjs';js.write_text('import {consumer} from '+json.dumps(source.as_uri())+
        ';for(let i=-128;i<128;i++)console.log(consumer(i));\n')
    (root/'main.cpp').write_text('#include <cstdio>\nint consumer(int);int main(){for(int i=-128;i<128;i++)printf("%d\\n",consumer(i));}\n')
    def run(command):
        result=subprocess.run(command,cwd=root,capture_output=True,text=True,timeout=60)
        assert result.returncode==0,(command,result.stdout[-1000:],result.stderr[-2000:])
        return result.stdout.splitlines()
    native=root/'native'
    run(['clang++',str(root/'provider.cpp'),str(root/'consumer.cpp'),str(root/'main.cpp'),'-o',str(native)])
    expected=run([str(native)]);observed=run(['node',str(js)])
    assert len(expected)==len(observed)==256 and expected==observed
    (root/'blocked.cpp').write_text('extern int missing_original(); int blocked(){return missing_original();}\n')
    code,report,calls,_=build(root,['blocked.cpp'],'blocked')
    assert code==2 and len(calls)==1 and report['source_definitions_blocked']==1,report
    assert report['source_definitions_emitted']==0,'reused probe falsely counted a blocked definition'
    code,report,calls,_=build(root,['single.cpp'],'corrupted',corrupt=True)
    assert code==2 and len(calls)==1 and any('invalid_javascript' in item for item in report['invalid_imports']),report
print('PASS: one lowering for empty external indexes, real two-TU relowering/import ownership, 256 native comparisons, blocked/syntax guards preserved')
