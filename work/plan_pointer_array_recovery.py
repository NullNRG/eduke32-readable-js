import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
manifest_root=ROOT/'factory-output/source-first/oct15-uniform-inventory'
rows=[]
for file in manifest_root.glob('source/**/*.manifest.json'):
    m=json.loads(file.read_text());affected=[]
    for d in m['definitions']:
        reason=d.get('reason','')
        if '*' in reason and (reason.startswith('C aggregate list requires verified storage shape:') or
                reason.startswith('unsupported global array element type')):
            affected.append({'name':d['name'],'reason':reason})
    if affected:
        source=m['source']
        boot_priority=1000 if source.startswith(('source/build/','source/duke3d/')) else 500 if source.startswith('source/audiolib/') else 0
        rows.append({'source':source,'score':boot_priority+len(affected),'affected':affected})
rows.sort(key=lambda r:(-r['score'],r['source']))
plan={'format':'original-pointer-array-recovery-plan/1','priority_units':rows,
    'source_revision':'historical uniform scan; fresh emission still required','gameplay_verified':False}
(ROOT/'work/pointer-array-priorities.json').write_text(json.dumps(plan,indent=2)+'\n')
print(json.dumps([{'source':r['source'],'blocked_entries_in_family':len(r['affected'])}for r in rows],indent=2))
state_path=ROOT/'reports/oct15-queued-link.json'
state=json.loads(state_path.read_text());checkpoint=json.loads((ROOT/'factory-output/source-first/oct15-world-linked/link-checkpoint.json').read_text())
state.update(phase='checkpointed-for-shared-semantic-repair',worker_running=False,
    preserved_link_round=checkpoint['last_completed_round'],preserved_verified_link_units=len(checkpoint['verified']),
    reason='Stopped previous-revision retry workers before compiler semantics changed; historical checkpoint retained')
state_path.write_text(json.dumps(state,indent=2)+'\n')
