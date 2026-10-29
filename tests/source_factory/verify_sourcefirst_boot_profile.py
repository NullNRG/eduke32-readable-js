"""Boot audits and diagnostic cold probes obey the selected browser profile."""
import contextlib
import hashlib
import io
import json
from pathlib import Path
import subprocess
import sys
import tempfile
from unittest.mock import patch

ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'tools'))
import source_first_boot_audit as audit

with tempfile.TemporaryDirectory(prefix='eduke-boot-profile-') as temporary:
    root=Path(temporary);source=root/'original';source.mkdir()
    linked=root/'linked';linked.mkdir()
    commands=root/'browser-commands.json'
    commands.write_text(json.dumps([{'file':'unit.cpp','arguments':['g++','-DBROWSER=1','unit.cpp']}]))
    legacy=root/'factory-output/compile_commands.json';legacy.parent.mkdir(parents=True)
    legacy.write_text(json.dumps([{'file':'unit.cpp'},{'file':'desktop.cpp'}]))
    row={'name':'app_main','source_name':'app_main','kind':'FunctionDecl',
         'status':'blocked','reason':'missing original dependency','source_references':[]}
    (linked/'unit.manifest.json').write_text(json.dumps({'source':'unit.cpp','definitions':[row]}))
    (linked/'desktop.manifest.json').write_text(json.dumps({'source':'desktop.cpp',
        'definitions':[{**row,'status':'source-first'}]}))
    output=root/'boot.json'
    args=['audit','--source-root',str(source),'--compile-commands',str(commands),
          '--manifest-root',str(linked),'--out',str(output)]
    with patch.object(audit,'ROOT',root),patch.object(sys,'argv',args+['--fast-current-only']),contextlib.redirect_stdout(io.StringIO()):
        assert audit.main()==2
    report=json.loads(output.read_text());summary=report['summary']
    assert summary['original_source_units']==1 and summary['current_linked_manifests']==1,summary
    assert not summary['boot_entry_has_emitted_js'],summary
    assert summary['compile_commands_sha256']==hashlib.sha256(commands.read_bytes()).hexdigest()
    observed=[]
    def cold(command,**kwargs):
        observed.append(command)
        assert command[command.index('--compile-commands')+1]==str(commands.resolve())
        out=Path(command[command.index('--out-dir')+1]);out.mkdir(parents=True,exist_ok=True)
        (out/'unit.cpp.manifest.json').write_text(json.dumps({'source':'unit.cpp',
            'definitions':[{**row,'status':'source-first'}]}))
        return subprocess.CompletedProcess(command,0,'','')
    with patch.object(audit,'ROOT',root),patch.object(sys,'argv',args),patch.object(audit.subprocess,'run',cold),contextlib.redirect_stdout(io.StringIO()):
        assert audit.main()==2
    report=json.loads(output.read_text())
    assert len(observed)==1
    assert not report['summary']['boot_entry_has_emitted_js']
    assert report['summary']['graph_diagnostic_probe_only']==1
    assert report['entry_definition']['probe_only_not_linked']
print('PASS: selected-unit boot inventory, exact profile propagation, excluded desktop owners and cold-probe success cannot certify linkage')
