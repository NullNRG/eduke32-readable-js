"""Reports use their proven current batches and reject changed owned artifacts."""
import json,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'tools'))
from source_first_automate import batch_artifact_hashes
from source_first_missing_map import load_units
with tempfile.TemporaryDirectory() as tmp:
    root=Path(tmp);batch=root/'current';batch.mkdir()
    module=batch/'f.cpp.mjs';module.write_text('export function foo(){return 1;}')
    manifest=module.with_suffix('.manifest.json')
    manifest.write_text(json.dumps({'source':'f.cpp','definitions':[{'name':'foo','status':'source-first'}]}))
    build=batch/'project-build.json'
    build.write_text(json.dumps({'format':'source-first-project/1','units':[{'source':'f.cpp','emitted':1}]}))
    report=root/'recovery-report.json'
    report.write_text(json.dumps({'batch_results':[{'status':'ok','manifest':'current/project-build.json',
        'artifact_hashes':batch_artifact_hashes(batch,build)}]}))
    stale=root/'stale';stale.mkdir()
    (stale/'f.cpp.manifest.json').write_text(json.dumps({'source':'f.cpp','definitions':[]}))
    assert list(load_units(root,report))==['f.cpp']
    try:load_units(root)
    except ValueError as error:assert 'duplicate' in str(error)
    else:raise AssertionError('Unowned duplicate manifests must remain ambiguous')
    module.write_text('export function foo(){return 99;}')
    try:load_units(root,report)
    except ValueError as error:assert 'artifacts changed' in str(error)
    else:raise AssertionError('Tampered owned JavaScript must not be reported as verified')
print('PASS: current report batch ownership excludes stale duplicates and rejects tampering')
