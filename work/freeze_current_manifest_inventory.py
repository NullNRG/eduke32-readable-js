import json,shutil,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'tools'))
from source_first_automate import batch_artifacts_match
base=ROOT/'factory-output/source-first/oct15-world-recovery'
r=json.loads((base/'recovery-report.json').read_text())
assert r['verified_batch_units']==156 and r['uniform_compiler_revision_verified']
out=ROOT/'factory-output/source-first/oct15-uniform-inventory'
out.mkdir(exist_ok=True);n=0
for batch in r['batch_results']:
    m=base/batch['manifest']
    assert batch_artifacts_match(m.parent,m,batch['artifact_hashes'])
    for source in batch['sources']:
        path=out/(source+'.manifest.json');path.parent.mkdir(parents=True,exist_ok=True)
        shutil.copy2(m.parent/(source+'.manifest.json'),path);n+=1
(out/'recovery-report.json').write_text(json.dumps(r,indent=2)+'\n')
print('Frozen current manifest units',n)
