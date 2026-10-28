#!/usr/bin/env python3
"""Real original EDuke32/LibXMP goto recovery audit (do not mask link errors)."""
import json, subprocess, sys, tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
with tempfile.TemporaryDirectory(prefix='eduke_goto_') as tmp:
    proc=subprocess.run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),
        '--root',str(ROOT/'factory-output/source-tree/eduke32-master'),
        '--source','source/libxmp-lite/src/dataio.c','--out-dir',tmp],
        cwd=ROOT,text=True,capture_output=True,timeout=60)
    if proc.returncode:raise AssertionError(proc.stderr[-2200:])
    mf=Path(tmp)/'source/libxmp-lite/src/dataio.c.manifest.json'
    data=json.loads(mf.read_text());names=('read8','read8s','read16l','read16b','read24l','read24b','read32l','read32b')
    selected=[i for i in data['definitions'] if i['name'] in names]
    assert len(selected)==8,selected
    for item in selected:
        assert item['status']=='blocked' and item['reason'].startswith('unlinked identifiers:'),item
        assert not 'GotoStmt' in item['reason'],item
        flow=item.get('control_flow',{})
        assert flow['detected']['exit_blocks']>=1,item
        assert flow['strategy']=='structured-source-labels-no-opcode-dispatch',item
    assert data['llvm_fallback_used'] is False
    print('PASS: 8 original libxmp dataio goto definitions structurally recovered; external I/O remains explicitly unlinked')
