from pathlib import Path
import json
for name in ('oct15-world-recovery','oct15-world-linked','oct15-pointer-array-bulk','oct15-heap-pointer-recovery'):
 root=Path('factory-output/source-first')/name
 for file in ('checkpoint.json','link-checkpoint.json','recovery-report.json'):
  p=root/file
  if not p.exists():continue
  d=json.loads(p.read_text());print(name,file,list(d))
  if file=='checkpoint.json':
   rows=list(d['batch_cache'].values());print('rows',len(rows),'first',{k:v for k,v in rows[0].items()if k!='artifact_hashes'} if rows else None)
  if file=='link-checkpoint.json':
   print('verified',len(d['verified']),'first',list(d['verified'].items())[:1])
  if file=='recovery-report.json':print({k:d[k]for k in ('verified_batch_units','failed_batch_units','readable_definitions','blocked_definitions','uniform_compiler_revision_verified') if k in d})
