"""Overlay verified reference startup batches without relabeling historical units."""
import argparse,hashlib,json,shutil,sys
from collections import Counter
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'tools'))
from source_first_automate import batch_artifact_hashes,batch_artifacts_match,portable_relative,fingerprint
from source_first_global_link import ownership,storage_import_error,write_json
BASE=ROOT/'factory-output/source-first/oct15-heap-pointer-recovery'
parser=argparse.ArgumentParser();parser.add_argument('--current-build',default='oct16-cpp-reference-boot-recovery');parser.add_argument('--out',type=Path,default=ROOT/'factory-output/source-first/oct16-cpp-reference-link-input');args=parser.parse_args()
OVERLAYS=[ROOT/'factory-output/source-first'/name for name in dict.fromkeys(('oct16-array-members-recovery','oct19-reference-host-recovery',args.current_build))]
OUT=args.out.resolve()
base=json.loads((BASE/'recovery-report.json').read_text())
assert base['verified_batch_units']==156 and base['uniform_compiler_revision_verified']
chosen=[(BASE,row) for row in base['batch_results']]
latest=[]
for directory in OVERLAYS:
 report=json.loads((directory/'recovery-report.json').read_text())
 assert report['failed_batch_units']==0 and report['compiler_revision_attestation']['verified']
 sources={source for row in report['batch_results'] for source in row['sources']}
 for _,row in chosen:
  overlap=set(row['sources'])&sources
  assert not overlap or overlap==set(row['sources']),'partial historical batch replacement requires source-level re-attestation'
 chosen=[(folder,row) for folder,row in chosen if not (set(row['sources'])&sources)]+[(directory,row) for row in report['batch_results']]
 latest=sorted(sources)
assert report['compiler_revision_attestation']['end_fingerprint']==fingerprint(ROOT/'factory-output/compile_commands.json',ROOT/'factory-output/source-tree/eduke32-master',[])
# Reuse actual, checkpoint-attested linking work instead of recovering the
# same old definitions again. Current/array-storage source batches stay
# protected. A historical candidate may only add exports to a one-unit batch.
# These epochs remain explicitly historical; every import still faces the
# production linker's ownership, native storage and reference ABI checks.
protected={source for folder,row in chosen if folder in OVERLAYS for source in row['sources']}
fallbacks={row['sources'][0]:(folder,row) for folder,row in chosen if len(row['sources'])==1}
reused=[]
for epoch in ('oct15-heap-pointer-linked','oct16-array-members-linked','oct16-cpp-reference-linked','oct19-reference-host-linked'):
 folder=ROOT/'factory-output/source-first'/epoch;checkpoint_path=folder/'link-checkpoint.json'
 if not checkpoint_path.is_file():continue
 checkpoint=json.loads(checkpoint_path.read_text())
 for source,hashes in checkpoint.get('verified',{}).items():
  if source in protected:continue
  candidate=folder/(source+'.mjs');mf=candidate.with_suffix('.manifest.json')
  assert hashlib.sha256(candidate.read_bytes()).hexdigest()==hashes['module_sha256'],source
  assert hashlib.sha256(mf.read_bytes()).hexdigest()==hashes['manifest_sha256'],source
  parsed=json.loads(mf.read_text());assert parsed['source']==source
  previous=next(((index,base,row)for index,(base,row)in enumerate(chosen)if row['sources']==[source]),None)
  if previous is None:continue
  index,base,row=previous
  before_module=(base/portable_relative(row['manifest'])).parent/(source+'.manifest.json')
  original=json.loads(before_module.read_text())
  old_names={d['name']for d in original['definitions']if d['status']=='source-first'}
  new_names={d['name']for d in parsed['definitions']if d['status']=='source-first'}
  if not old_names<new_names:continue
  target=OUT/('saved-link-'+epoch+'-'+hashlib.sha256(source.encode()).hexdigest()[:12]);target.mkdir(parents=True,exist_ok=True)
  module=target/(source+'.mjs');module.parent.mkdir(parents=True,exist_ok=True)
  shutil.copy2(candidate,module);shutil.copy2(mf,module.with_suffix('.manifest.json'))
  emitted=len(new_names);blocked=sum(d['status']=='blocked'for d in parsed['definitions'])
  project={'format':'source-first-project/1','units':[{'source':source,'emitted':emitted,'blocked':blocked}],
   'historical_saved_link_provenance':{'directory':folder.relative_to(ROOT).as_posix(),'fingerprint':checkpoint['fingerprint'],'verified':hashes},
   'fresh_compilation_performed':False,'uniform_current_compilation':False,'gameplay_verified':False}
  manifest=target/'project-build.json';write_json(manifest,project);artifacts=batch_artifact_hashes(target,manifest);assert artifacts
  linked_row={'status':'ok','sources':[source],'manifest':manifest.relative_to(OUT).as_posix(),
   'artifact_hashes':artifacts,'readable_definitions':emitted,'blocked_definitions':blocked,
   'compiler_fingerprint':'historical-link:'+checkpoint['fingerprint'],'historical_link_provenance':project['historical_saved_link_provenance']}
  chosen[index]=(OUT,linked_row);reused.append({'source':source,'epoch':epoch,'added_definition_entries':len(new_names-old_names)})
rejected=[]
while True:
 units={}
 for folder,row in chosen:
  batch=(folder/portable_relative(row['manifest'])).parent
  for source in row['sources']:
   module=batch/(source+'.mjs');units[source]={'module':module if module.is_file() else None,'manifest':json.loads(module.with_suffix('.manifest.json').read_text())}
 owners,ambiguous=ownership(units,ROOT/'factory-output/source-tree/eduke32-master');bad={}
 for index,(folder,row) in enumerate(chosen):
  if not row.get('historical_link_provenance'):continue
  source=row['sources'][0];errors=[]
  for dep in units[source]['manifest'].get('imports',[]):
   if dep['name'] in ambiguous or owners.get(dep['name'])!=dep['from']:errors.append({'dependency':dep,'reason':'current composition lacks the unique original provider'})
   error=storage_import_error(dep,units)
   if error:errors.append({'dependency':dep,'reason':error})
  if errors:bad[index]={'source':source,'epoch':row['historical_link_provenance']['directory'],'errors':errors}
 if not bad:break
 for index,item in bad.items():
  rejected.append(item);chosen[index]=fallbacks[item['source']]
accepted_sources={row['sources'][0]for _,row in chosen if row.get('historical_link_provenance')}
accepted=[item for item in reused if item['source'] in accepted_sources]
all_sources=[source for _,row in chosen for source in row['sources']]
assert len(all_sources)==len(set(all_sources))==156
OUT.mkdir(parents=True,exist_ok=True);rows=[]
for directory,row in chosen:
 manifest=directory/portable_relative(row['manifest']);assert batch_artifacts_match(manifest.parent,manifest,row['artifact_hashes'])
 folder=OUT/portable_relative(row['manifest']).parent;folder.mkdir(parents=True,exist_ok=True)
 for relative in row['artifact_hashes']:
  source=manifest.parent/portable_relative(relative);target=folder/portable_relative(relative);target.parent.mkdir(parents=True,exist_ok=True)
  if source.resolve()!=target.resolve():shutil.copy2(source,target)
 assert batch_artifacts_match(folder,folder/manifest.name,row['artifact_hashes'])
 rows.append({**row,'incremental_origin':directory.relative_to(ROOT).as_posix()})
result={'format':'attested-incremental-mixed-revision-link-input/2','original_selected_units':156,'scheduled_units':156,'attempted_units':156,
 'verified_batch_units':156,'failed_batch_units':0,'batch_results':rows,'readable_definitions':sum(r['readable_definitions']for r in rows),
 'blocked_definitions':sum(r['blocked_definitions']for r in rows),'invalid_imports':0,'fully_linked_project':False,'gameplay_verified':False,
 'uniform_compiler_revision_verified':False,'compiler_revision_source_counts':dict(Counter(row['compiler_fingerprint']for row in rows for _ in row['sources'])),
 'compiler_revision_attestation':{'verified':False,'reason':str(len(latest))+' current startup/engine units overlaid on earlier array-storage and historical units. All are independently hash-attested. Reference and native storage ABI gates remain mandatory.'},
 'latest_recompiled_sources':latest,'older_unchanged_batches_reused':156-len(latest),'saved_verified_link_overlays':accepted,'rejected_incompatible_saved_link_overlays':rejected}
write_json(OUT/'recovery-report.json',result);shutil.copy2(BASE/'original-build-inventory.json',OUT/'original-build-inventory.json')
print(json.dumps({key:value for key,value in result.items()if key not in ('batch_results','latest_recompiled_sources')},indent=2))
