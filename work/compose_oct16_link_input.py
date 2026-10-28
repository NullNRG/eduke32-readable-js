"""Compose attested incremental source batches without claiming uniform compilation."""
import hashlib,json,shutil,sys
from collections import Counter
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'tools'))
from source_first_automate import batch_artifacts_match,portable_relative,fingerprint
from source_first_global_link import write_json
BASE=ROOT/'factory-output/source-first/oct15-heap-pointer-recovery'
NEW=ROOT/'factory-output/source-first/oct16-array-members-recovery'
OUT=ROOT/'factory-output/source-first/oct16-incremental-link-input'
def read(p):return json.loads(p.read_text())
def main():
 old=read(BASE/'recovery-report.json');new=read(NEW/'recovery-report.json')
 assert old['verified_batch_units']==156 and old['uniform_compiler_revision_verified']
 assert new['verified_batch_units']==12 and new['failed_batch_units']==0 and new['compiler_revision_attestation']['verified']
 assert new['compiler_revision_attestation']['end_fingerprint']==fingerprint(ROOT/'factory-output/compile_commands.json',ROOT/'factory-output/source-tree/eduke32-master',[])
 replace={s for r in new['batch_results'] for s in r['sources']}
 chosen=[(BASE,r) for r in old['batch_results'] if not (set(r['sources'])&replace)]+[(NEW,r) for r in new['batch_results']]
 sources=[s for _,r in chosen for s in r['sources']];assert len(sources)==156 and len(set(sources))==156
 OUT.mkdir(parents=True,exist_ok=True);rows=[]
 for base,row in chosen:
  manifest=base/portable_relative(row['manifest']);assert batch_artifacts_match(manifest.parent,manifest,row['artifact_hashes'])
  folder=OUT/portable_relative(row['manifest']).parent;folder.mkdir(parents=True,exist_ok=True)
  for name in row['artifact_hashes']:
   source=manifest.parent/portable_relative(name);dest=folder/portable_relative(name);dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(source,dest)
  assert batch_artifacts_match(folder,folder/manifest.name,row['artifact_hashes'])
  rows.append({**row,'incremental_origin':str(base.relative_to(ROOT))})
 report={'format':'attested-incremental-mixed-revision-link-input/1','original_selected_units':156,'scheduled_units':156,'attempted_units':156,
  'verified_batch_units':156,'failed_batch_units':0,'batch_results':rows,'readable_definitions':sum(r['readable_definitions'] for r in rows),
  'blocked_definitions':sum(r['blocked_definitions'] for r in rows),'invalid_imports':0,'fully_linked_project':False,'gameplay_verified':False,
  'uniform_compiler_revision_verified':False,'compiler_revision_source_counts':dict(Counter(r['compiler_fingerprint'] for r in rows for s in r['sources'])),
  'compiler_revision_attestation':{'verified':False,'reason':'Explicitly mixed historical/current compiler epochs. Each batch is independently hash-attested; all imports still require strict linker storage ABI verification.'},
  'latest_recompiled_sources':sorted(replace),'older_unchanged_batches_reused':156-len(replace)}
 write_json(OUT/'recovery-report.json',report)
 shutil.copy2(BASE/'original-build-inventory.json',OUT/'original-build-inventory.json')
 print(json.dumps({k:v for k,v in report.items() if k not in ('batch_results','latest_recompiled_sources')},indent=2))
if __name__=='__main__':main()
