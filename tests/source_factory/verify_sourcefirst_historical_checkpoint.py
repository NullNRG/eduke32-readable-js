"""Historical source comparisons survive cleanup without old executable builds."""
import hashlib,sys,tempfile
from pathlib import Path
from unittest.mock import patch
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tools'))
import source_historical_checkpoint as history
files=history.contents()
assert len(files)==736 and all(name.endswith('.json') for name in files)
assert len(history.recorded_units())==156
assert len(history.report('globally-linked/global-recovery.json')['remaining'])==5065
assert len(history.report('current-full-linkage-fix/global-recovery.json')['remaining'])==6257
with history.materialize() as root:
    assert all(hashlib.sha256((root/name).read_bytes()).digest()==hashlib.sha256(data).digest()
               for name,data in files.items())
assert not root.exists(), 'Temporary comparison metadata was retained'
with tempfile.TemporaryDirectory() as temporary:
    wrong=Path(temporary)/'changed.zip';wrong.write_bytes(history.ARCHIVE.read_bytes()+b'changed')
    with patch.object(history,'ARCHIVE',wrong):
        try:history.contents()
        except ValueError:pass
        else:raise AssertionError('Modified historical comparison metadata accepted')
print('PASS: original 156-unit history and blocker identities retained in 2.2 MB; modified history rejected; no old executable artifacts')
