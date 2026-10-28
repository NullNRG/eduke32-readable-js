#!/usr/bin/env python3
"""Saved Linux/Windows artifact paths reuse exact bytes and reject escapes."""
import hashlib,json,os,sys,tempfile
from pathlib import Path
sys.path.insert(0,os.environ.get('EDUKE_TEST_COMPILER_DIR') or str(Path(__file__).resolve().parents[2]/'tools'))
import source_first_automate as auto
import source_first_global_link as link

for path in ('/tmp/module','\\rooted','C:relative','C:\\absolute','../escape','x\\..\\escape','\\\\server\\share','.'):
    try:auto.portable_relative(path)
    except ValueError:pass
    else:raise AssertionError('accepted unsafe saved path '+repr(path))
assert auto.portable_relative('batch\\source/game.cpp.mjs').as_posix()=='batch/source/game.cpp.mjs'
assert auto.portable_artifact_hashes({'x/y':'one','x\\y':'two'}) is None

with tempfile.TemporaryDirectory() as temp:
    root=Path(temp);directory=root/'saved';batch=directory/'batch';batch.mkdir(parents=True)
    module=batch/'source/game.cpp.mjs';module.parent.mkdir()
    module.write_text('export function original(){return 7;}\n')
    manifest=module.with_suffix('.manifest.json')
    manifest.write_text(json.dumps({'output':'/mnt/data/old-project/source/game.cpp.mjs',
        'definitions':[{'name':'original','status':'source-first'}]}))
    build=batch/'project-build.json'
    build.write_text(json.dumps({'format':'source-first-project/1',
        'units':[{'source':'source/game.cpp','emitted':1}]}))
    hashes=auto.batch_artifact_hashes(batch,build)
    report=directory/'recovery-report.json'
    report.write_text(json.dumps({'batch_results':[{'status':'ok','manifest':'batch\\project-build.json',
        'artifact_hashes':{key.replace('/','\\'):value for key,value in hashes.items()}}]}))
    before={path:hashlib.sha256(path.read_bytes()).hexdigest() for path in (module,manifest,build,report)}
    _,units=link.gather_batches(directory)
    assert units['source/game.cpp']['module']==module
    assert units['source/game.cpp']['manifest']['output'].startswith('/mnt/data/')
    assert all(hashlib.sha256(path.read_bytes()).hexdigest()==value for path,value in before.items())
    original=root/'original';original.mkdir();(original/'source.cpp').write_text('int original(){return 7;}')
    nonheader=original/'generated.def';nonheader.write_text('ORIGINAL(7)')
    fingerprint=link.link_input_fingerprint(directory,original,include_toolchain=False)
    nonheader.write_text('ORIGINAL(8)')
    assert fingerprint!=link.link_input_fingerprint(directory,original,include_toolchain=False)
    module.write_text('export function original(){return 999;}')
    for operation in (lambda:link.gather_batches(directory),
                      lambda:link.link_input_fingerprint(directory,original,include_toolchain=False)):
        try:operation()
        except ValueError:pass
        else:raise AssertionError('modified original-source JS trusted')
    # Two malformed sides must not compare equal as None and authorize reuse.
    module.unlink()
    assert not auto.batch_artifacts_match(batch,build,{'x/y':'one','x\\y':'two'})
    saved=json.loads(report.read_text());saved['batch_results'][0]['artifact_hashes']={'../escape':'bad'}
    report.write_text(json.dumps(saved))
    try:link.gather_batches(directory)
    except ValueError:pass
    else:raise AssertionError('corrupt hashes and missing artifacts accepted together')
print('PASS portable reuse: both separator conventions, unchanged artifact bytes, path escape rejection, full-source invalidation and tamper rejection')
