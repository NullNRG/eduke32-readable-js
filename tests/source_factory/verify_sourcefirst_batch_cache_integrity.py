#!/usr/bin/env python3
"""Batch resume must never trust edited/missing compiler output as recovered code."""
import hashlib,json,os,sys,tempfile
from pathlib import Path
sys.path.insert(0,os.environ.get('EDUKE_TEST_COMPILER_DIR') or str(Path(__file__).resolve().parents[2]/'tools'))
import source_first_automate as mod

with tempfile.TemporaryDirectory() as temp:
    root=Path(temp);src_root=root/'original';src_root.mkdir()
    file='sample.cpp';(src_root/file).write_text('int original(int x) {return x+1;}')
    out=root/'generated';out.mkdir()
    name='batch-'+hashlib.sha256(file.encode()).hexdigest()[:16]
    folder=out/name;folder.mkdir()
    module=folder/(file+'.mjs');module.write_text('export function original(x){return x+1;}\n')
    unit_manifest=module.with_suffix('.manifest.json')
    unit_manifest.write_text(json.dumps({'definitions':[{'name':'original','status':'source-first'}]}))
    manifest=folder/'project-build.json'
    manifest.write_text(json.dumps({'format':'source-first-project/1','units':[{'source':file,'emitted':1}]}))
    first=mod.batch_artifact_hashes(folder,manifest)
    assert first and len(first)==3,first
    source_hash=hashlib.sha256(b'source-fingerprint')
    mod.sha(src_root/file,source_hash)
    fp=source_hash.hexdigest()
    saved={'sources':[file],'status':'ok','fingerprint':fp,'manifest':f'{name}/project-build.json',
           'artifact_hashes':first,'compiler_fingerprint':'source-fingerprint','readable_definitions':1,'blocked_definitions':0,'invalid_imports':0}
    state={file:saved}
    original_compiler=mod.COMPILER
    try:
        mod.COMPILER=root/'compiler-does-not-exist.py'
        row,_=mod.run_batch([{'source':file,'bytes':5}],out,src_root,3,state,
            'source-fingerprint',0)
        assert row['status']=='ok',row
        # Same source and fingerprint, but DIFFERENT module bytes: must recompile.
        module.write_text('export function original(x){return x+999;}\n')
        assert first!=mod.batch_artifact_hashes(folder,manifest)
        attempted,_=mod.run_batch([{'source':file,'bytes':5}],out,src_root,3,state,
            'source-fingerprint',0)
        assert attempted['status']=='failed',attempted
        # Unmodified compiler fingerprint is not enough to trust missing JS.
        module.unlink()
        assert mod.batch_artifact_hashes(folder,manifest) is None
    finally:
        mod.COMPILER=original_compiler
print('PASS batch resume: valid reuse, tampered JS rejected, missing JS rejected')
