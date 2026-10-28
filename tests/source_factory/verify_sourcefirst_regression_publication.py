"""Regression evidence survives transient and permanent publication locks."""
import json,sys,tempfile
from pathlib import Path
from unittest.mock import patch
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tools'))
from verify_recovery_suite import atomic_json
with tempfile.TemporaryDirectory() as directory:
    target=Path(directory)/'result.json';atomic_json(target,{'old':True})
    import os
    original=os.replace;calls=[]
    def transient(source,destination):
        calls.append(1)
        if len(calls)<3:raise PermissionError('reader lock')
        return original(source,destination)
    with patch('verify_recovery_suite.os.replace',transient),patch('verify_recovery_suite.time.sleep'):
        atomic_json(target,{'passed':True})
    assert len(calls)==3 and json.loads(target.read_text())=={'passed':True}
    with patch('verify_recovery_suite.os.replace',side_effect=PermissionError('persistent lock')),patch('verify_recovery_suite.time.sleep'):
        try:atomic_json(target,{'must_not_replace':True})
        except PermissionError:pass
        else:raise AssertionError('Permanent failure was hidden')
    assert json.loads(target.read_text())=={'passed':True}
    assert not list(Path(directory).glob('*.tmp'))
print('Transient publication locks retried; permanent failure preserves prior evidence and cleans temporary files.')
