#!/usr/bin/env python3
"""Regress real boot-first compilation and non-claiming Clang audit fallback."""
from pathlib import Path
import json
import subprocess
import sys
import tempfile

ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'tools'))
from source_first_autonomous import read_link,plan
from source_historical_checkpoint import materialize
history=materialize();historical_root=history.__enter__()
import atexit
atexit.register(lambda:history.__exit__(None,None,None))
BASE=historical_root/'current-full-linkage-fix/global-recovery.json'

historical=read_link(BASE)
priority=plan(historical,156,manifest_root=BASE.parent)
ordered=[r['source'] for r in priority['priority_units']]
assert 'source/duke3d/src/game.cpp' in ordered[:2], ordered[:5]
assert priority['boot_source_depths']['source/duke3d/src/game.cpp']==0
assert priority['boot_source_depths']['source/build/src/engine.cpp']==0
assert len(set(ordered))==len(ordered)
assert len(priority['priority_units'])==len({x['source'] for x in historical['remaining']})
print('PASS: historical Clang owners prioritize original app_main and enginePreInit, without inventing sources')

with tempfile.TemporaryDirectory(prefix='eduke_boot_provenance_') as scratch:
    directory=Path(scratch)
    current=directory/'empty_current_link'
    current.mkdir()
    report=directory/'boot.json'
    proc=subprocess.run([sys.executable,str(ROOT/'tools/source_first_boot_audit.py'),
       '--manifest-root',str(current),'--historical-manifest-root',str(historical_root/'globally-linked'),'--out',str(report),'--depth','0',
       '--entry','app_main'],cwd=ROOT,capture_output=True,text=True,timeout=120)
    assert proc.returncode==2, (proc.returncode,proc.stderr[-1500:])
    result=json.loads(report.read_text())
    entry=result['entry_definition']
    assert entry and entry['source']=='source/duke3d/src/game.cpp',entry
    assert entry['status']=='blocked' and entry['probe_only_not_linked'] is True,entry
    assert entry['reference_coverage']=='fresh Clang AST',entry
    summary=result['summary']
    assert summary['boot_entry_has_emitted_js'] is False,summary
    assert summary['graph_emitted']==0 and summary['graph_diagnostic_probe_only']==1,summary
    assert summary['current_linked_manifests']==0,summary
    assert summary['historical_owner_manifests_for_diagnostics']>=150,summary
    assert not result['fresh_probe_failures'],result['fresh_probe_failures']
    print('PASS: cold original app_main source probe is reported as diagnostic, never linked boot code')

    missing=directory/'missing.json'
    proc=subprocess.run([sys.executable,str(ROOT/'tools/source_first_boot_audit.py'),
       '--manifest-root',str(current),'--historical-manifest-root',str(historical_root/'globally-linked'),'--out',str(missing),'--depth','0',
       '--entry','nonexistent_cxx_function_zzzz'],cwd=ROOT,capture_output=True,text=True,timeout=120)
    assert proc.returncode==2
    result=json.loads(missing.read_text())
    assert result['entry_definition'] is None
    assert any(x['symbol']=='nonexistent_cxx_function_zzzz' and not x['owners']
               for x in result['fresh_probe_failures'])
    print('PASS: unowned original entry fails closed without guessed function exports')
