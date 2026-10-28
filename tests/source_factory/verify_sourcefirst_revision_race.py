#!/usr/bin/env python3
"""Change scratch dependencies during compilation; real core files stay untouched."""
import contextlib
import io
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
from unittest.mock import patch

sys.path.insert(0,os.environ.get('EDUKE_TEST_COMPILER_DIR') or str(Path(__file__).resolve().parents[2]/'tools'))
import source_first_automate as auto


def exercise(change_kind, retries=2, jobs=1):
    with tempfile.TemporaryDirectory(prefix='revision_race_') as directory:
        root=Path(directory);(root/'tools').mkdir();source=root/'src';source.mkdir()
        (source/'sample.cpp').write_text('int sample() { return 1; }')
        (source/'types.h').write_text('typedef int Value;')
        commands=root/'commands.json';commands.write_text(json.dumps([{'file':'sample.cpp'}]))
        out=root/'out'
        # Cover the actual pipeline dependency set as lowering helpers grow.
        # Compilation stays mocked; revision detection and retries are real.
        assets={path.name for path in auto.pipeline_inputs(None,source)
                if path.parent==auto.ROOT/'tools'}|{'compiler.py','frontend.py','flow.py'}
        for name in assets:(root/'tools'/name).write_text('baseline')
        toolchain=root/'toolchain';toolchain.write_bytes(b'original toolchain')
        calls=[]

        def fake_toolchain(h):
            # Represents the binary/sysroot layer, intentionally absent from
            # the inexpensive per-batch guard so final full attestation matters.
            h.update(toolchain.read_bytes())

        def compile_batch(command, timeout):
            calls.append(command)
            target=Path(command[command.index('--out-dir')+1]);target.mkdir(parents=True,exist_ok=True)
            module=target/'sample.cpp.mjs';module.write_text('export function sample() { return 1; }')
            module.with_suffix('.manifest.json').write_text(json.dumps({
                'definitions':[{'name':'sample','status':'source-first'}]}))
            (target/'project-build.json').write_text(json.dumps({
                'format':'source-first-project/1','units':[{'source':'sample.cpp','emitted':1}],
                'source_definitions_emitted':1,'source_definitions_blocked':0,'invalid_imports':[]}))
            if len(calls)==1 or retries==0:
                changed={'runtime':root/'tools/source_pointer_runtime.mjs',
                         'header':source/'types.h','source':source/'sample.cpp',
                         'toolchain':toolchain}[change_kind]
                changed.write_text('changed revision '+str(len(calls)))
            return subprocess.CompletedProcess(command,0,'','')

        argv=['source_first_automate.py','--source-root',str(source),'--compile-commands',str(commands),
              '--out',str(out),'--no-global-link','--resume','--revision-retries',str(retries),'--jobs',str(jobs)]
        with contextlib.ExitStack() as stack:
            for name,value in {'ROOT':root,'COMPILER':root/'tools/compiler.py',
                               'FRONTEND':root/'tools/frontend.py','FLOW':root/'tools/flow.py',
                               'fingerprint_toolchain':fake_toolchain,'run_compiler_process':compile_batch}.items():
                stack.enter_context(patch.object(auto,name,value))
            stack.enter_context(patch.object(sys,'argv',argv))
            stack.enter_context(contextlib.redirect_stdout(io.StringIO()))
            result=auto.main()
            report=json.loads((out/'recovery-report.json').read_text())
            assert report['compiler_revision_retry_events'],report
            if retries==0:
                assert result==2 and not report['uniform_compiler_revision_verified'],report
                assert report['verified_batch_units']==0,report
                return
            assert result==0 and len(calls)==2,(result,len(calls),report)
            assert report['uniform_compiler_revision_verified'],report
            row=report['batch_results'][0]
            assert row['input_guard_before']==row['input_guard_after'] and row['revision_guard_verified']
            assert row['compiler_fingerprint']==report['compiler_revision_attestation']['end_fingerprint']
            # Stable current guarded rows can be reused without recompilation.
            assert auto.main()==0 and len(calls)==2
            # Legacy checkpoint evidence is not enough for a production reuse.
            checkpoint=json.loads((out/'checkpoint.json').read_text())
            for row in checkpoint['batch_cache'].values():
                for key in ('revision_guard_verified','input_guard_before','input_guard_after'):row.pop(key,None)
            (out/'checkpoint.json').write_text(json.dumps(checkpoint))
            assert auto.main()==0 and len(calls)==3
            # Repair-only mode also reschedules successful legacy report rows;
            # an old report cannot certify the current compiler revision.
            report=json.loads((out/'recovery-report.json').read_text())
            for row in report['batch_results']:
                for key in ('revision_guard_verified','input_guard_before','input_guard_after'):row.pop(key,None)
            (out/'recovery-report.json').write_text(json.dumps(report))
            checkpoint=json.loads((out/'checkpoint.json').read_text())
            for row in checkpoint['batch_cache'].values():
                for key in ('revision_guard_verified','input_guard_before','input_guard_after'):row.pop(key,None)
            (out/'checkpoint.json').write_text(json.dumps(checkpoint))
            argv.append('--repair-failed')
            assert auto.main()==0 and len(calls)==4


for kind in ('runtime','header','source','toolchain'):exercise(kind)
exercise('runtime',jobs=2)
exercise('runtime',retries=0)
print('PASS: mid-batch runtime/header/source/toolchain changes invalidate and retry; stable guarded reuse; legacy rejection; exhausted retry fails')
