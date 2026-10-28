"""A failed new link cannot certify an older, otherwise hash-valid manifest."""
import hashlib,json,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'tools'))
from source_first_autonomous import invalidate_failed_link
with tempfile.TemporaryDirectory() as tmp:
    build=Path(tmp)
    (build/'automatic').mkdir();(build/'globally-linked').mkdir()
    compilation=build/'automatic/recovery-report.json'
    compilation.write_text(json.dumps({'verified_batch_units':156,'uniform_compiler_revision_verified':True}))
    manifest=build/'globally-linked/global-recovery.json'
    manifest.write_text(json.dumps({'completed_source_units':2}))
    old=manifest.read_bytes()
    (build/'source-build-attestation.json').write_text(json.dumps({
        'linked_manifest_sha256':hashlib.sha256(old).hexdigest(),'source_compile_report_present':True}))
    record=invalidate_failed_link(build,1)
    saved=json.loads((build/'source-build-attestation.json').read_text())
    assert record==saved and saved['status']=='failed'
    assert saved['linked_manifest_sha256'] is None
    assert saved['source_compile_report_sha256']==hashlib.sha256(compilation.read_bytes()).hexdigest()
    assert saved['previous_link_manifest_present_but_not_accepted']
    assert manifest.read_bytes()==old and json.loads(compilation.read_text())['verified_batch_units']==156
    assert json.loads((build/'failed-link-stage.json').read_text())==saved
print('PASS: failed link invalidates stale attestation while preserving all156 compiled units and previous evidence')
