"""The canonical boot command must run the transpiler, not just the old audit."""
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import tempfile
ROOT=Path(__file__).resolve().parents[2]
package=json.loads((ROOT/'package.json').read_text())
assert 'source_first_autonomous.py build' in package['scripts']['compile:game']
controller=(ROOT/'tools/source_first_autonomous.py').read_text()
assert "'--manifest-root',str(linked)" in controller
assert "'--priority-file',str(priority_path)" in controller
with tempfile.TemporaryDirectory(prefix='sourcefirst_pipeline_gate_') as folder:
    root=Path(folder)
    (root/'globally-linked').mkdir();(root/'automatic').mkdir()
    module=(root/'globally-linked/global-recovery.json')
    module.write_text(json.dumps({'completed_source_units':2,
                                  'selected_source_units':156,
                                  'total_blocked_definitions':10,
                                  'unique_exports':4,
                                  'invalid_imports_or_syntax':[],
                                  'ambiguous_export_names':{}}))
    (root/'automatic/recovery-report.json').write_text(json.dumps({
      'verified_batch_units':2,'failed_batch_units':0,'readable_definitions':4,
      'blocked_definitions':10}))
    (root/'source-build-attestation.json').write_text(json.dumps({
      'linked_manifest_sha256':hashlib.sha256(module.read_bytes()).hexdigest(),
      'source_compile_report_present':True}))
    process=subprocess.run([sys.executable,str(ROOT/'tools/source_first_game_gate.py'),
                            '--build-root',str(root)],capture_output=True,text=True)
    assert process.returncode==2,process.stdout+process.stderr
    report=json.loads(process.stdout)
    assert report['fresh_autonomous_output_attested'] is True
    assert report['partial_link_matches_completed_compilation'] is True
    assert report['global_link_manifest_matches_current_inventory'] is False
    assert report['original_browser_boot_frames_input_and_play_verified'] is False
    # Same module bytes without its attestation cannot be accepted as fresh.
    (root/'source-build-attestation.json').unlink()
    process=subprocess.run([sys.executable,str(ROOT/'tools/source_first_game_gate.py'),
                            '--build-root',str(root)],capture_output=True,text=True)
    assert process.returncode==2
    assert json.loads(process.stdout)['fresh_autonomous_output_attested'] is False
print('PASS: canonical build command connected, fresh boot source path, partial/stale inventories fail game gate')
