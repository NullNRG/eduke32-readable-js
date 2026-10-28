#!/usr/bin/env python3
"""Affected-unit refresh preserves real revision and full-inventory guards."""
import contextlib,io,json,os,subprocess,sys,tempfile
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0,os.environ.get('EDUKE_TEST_COMPILER_DIR') or str(Path(__file__).resolve().parents[2]/'tools'))
import source_first_automate as auto

units=[{'source':name} for name in ('a.cpp','b.cpp','c.cpp','d.cpp')]
chosen,kept=auto.select_refresh_units({'batch_results':[
    {'sources':['a.cpp','b.cpp'],'status':'ok'},
    {'sources':['c.cpp'],'status':'failed'}]},units,['a.cpp'])
assert {item['source'] for item in chosen}=={'a.cpp','b.cpp','c.cpp','d.cpp'} and not kept
try:auto.select_refresh_units({'batch_results':[]},units,['unselected.cpp'])
except ValueError:pass
else:raise AssertionError('unknown original source accepted')

with tempfile.TemporaryDirectory(prefix='targeted_refresh_') as directory:
    root=Path(directory);(root/'tools').mkdir();source=root/'src';source.mkdir();out=root/'out'
    for name in ('a.cpp','b.cpp'):(source/name).write_text('int original(){return 7;}')
    commands=root/'commands.json';commands.write_text(json.dumps([{'file':name} for name in ('a.cpp','b.cpp')]))
    assets={path.name for path in auto.pipeline_inputs(None,source) if path.parent==auto.ROOT/'tools'}
    for name in assets:(root/'tools'/name).write_text('baseline')
    calls=[]
    def compile_batch(command,timeout):
        plan=json.loads(Path(command[command.index('--plan')+1]).read_text())
        names=[unit['source'] for unit in plan['units']];calls.extend(names)
        target=Path(command[command.index('--out-dir')+1]);target.mkdir(parents=True,exist_ok=True)
        rows=[]
        for name in names:
            module=target/(name+'.mjs');module.write_text('export function original(){return 7;}')
            module.with_suffix('.manifest.json').write_text(json.dumps({'definitions':[{'name':'original','status':'source-first'}]}))
            rows.append({'source':name,'emitted':1})
        (target/'project-build.json').write_text(json.dumps({'format':'source-first-project/1','units':rows,
            'source_definitions_emitted':len(rows),'source_definitions_blocked':0,'invalid_imports':[]}))
        return subprocess.CompletedProcess(command,0,'','')
    argv=['automate','--source-root',str(source),'--compile-commands',str(commands),'--out',str(out),
          '--batch-size','1','--resume','--no-global-link','--revision-retries','0']
    with contextlib.ExitStack() as stack:
        for name,value in {'ROOT':root,'COMPILER':root/'tools/source_first_project.py',
            'FRONTEND':root/'tools/source_ast_to_js.py','FLOW':root/'tools/source_control_flow.py',
            'fingerprint_toolchain':lambda h:h.update(b'fixed-toolchain'),
            'run_compiler_process':compile_batch}.items():stack.enter_context(patch.object(auto,name,value))
        stack.enter_context(patch.object(sys,'argv',argv));stack.enter_context(contextlib.redirect_stdout(io.StringIO()))
        assert auto.main()==0 and len(calls)==2
        before=json.loads((out/'recovery-report.json').read_text())
        b_before=next(row for row in before['batch_results'] if row['sources']==['b.cpp'])
        (source/'a.cpp').write_text('int original(){return 8;}')
        argv.extend(['--refresh-source','a.cpp'])
        assert auto.main()==0 and calls.count('a.cpp')==2 and calls.count('b.cpp')==1
        after=json.loads((out/'recovery-report.json').read_text())
        assert after['verified_batch_units']==2 and after['uniform_compiler_revision_verified']
        assert after['scheduled_units']==2 and after['untouched_verified_batch_rows']==1
        assert b_before==next(row for row in after['batch_results'] if row['sources']==['b.cpp'])
        inventory=json.loads((out/'original-build-inventory.json').read_text())
        assert len(inventory['selected_sources'])==2 and len(inventory['repair_attempted_subset'])==1
        # Shared compiler change invalidates even the explicitly unselected TU.
        (root/'tools/source_ast_to_js.py').write_text('changed compiler')
        assert auto.main()==0 and len(calls)==5
        final=json.loads((out/'recovery-report.json').read_text())
        assert final['uniform_compiler_revision_verified'] and final['untouched_verified_batch_rows']==0
        assert len(final['compiler_revision_source_counts'])==1
print('PASS targeted refresh: batch siblings, failed/missing inventory, exact untouched rows, source-only retry and shared-revision full revalidation')
