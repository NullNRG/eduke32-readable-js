"""Freeze verified continuation work, retaining older attested compiler epochs."""
from pathlib import Path
from datetime import datetime,timezone
import argparse,hashlib,json,sys,zipfile
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'tools'))
from source_first_automate import batch_artifacts_match,fingerprint,portable_relative

def digest(data):return hashlib.sha256(data).hexdigest()
def encoded(value):return (json.dumps(value,indent=2,sort_keys=True)+'\n').encode()
def read(path):return json.loads((ROOT/path).read_text(encoding='utf-8-sig'))

def main():
 parser=argparse.ArgumentParser();parser.add_argument('--out',type=Path,required=True)
 parser.add_argument('--current-build',default='oct16-array-members-recovery')
 parser.add_argument('--regression',default='reports/oct16-array-members-regression-pointer-fields.json');args=parser.parse_args()
 source_closure=args.current_build=='oct20-source-closure-recovery'
 files={};verified_batches=[];verified_links=[]
 def add(path):
  path=Path(path);path=path if path.is_absolute() else ROOT/path
  if path.is_file() and '__pycache__' not in path.parts and path.suffix not in ('.pyc','.sqlite','.dll','.exe','.o','.obj','.a','.lib','.pdb','.bc','.ll','.so','.dylib') and not path.name.endswith(('.partial','.tmp','-wal','-shm')):
   files[path.relative_to(ROOT).as_posix()]=path
 def tree(name):
  for path in (ROOT/name).rglob('*'):add(path)
 for name in ('tools','runtime','tests','licenses','input-source','factory-output/source-tree'):tree(name)
 for name in ('package.json','package-lock.json','dev-requirements.txt','eslint.config.mjs','input-data/DUKE3D.GRP','factory-output/compile_commands.json','factory-output/source-first/autonomous/initial-priorities.json'):
  add(name)
 for name in ('session-env.ps1','package_current_continuation.py','plan_heap_pointer_recovery.py','plan_pointer_array_recovery.py','heap-pointer-priorities.json','pointer-array-priorities.json','prove_baselayer_storage.cjs','verify_exported_entry_attempt.py','verify_clock_header_provider.py','verify_current_browser_modules.py','verify_staged_engine_browser.py','verify_staged_engine_geometry.py','verify_original_clock_globals.py','freeze_current_manifest_inventory.py','update_current_status.py','report_current_frontier.py','finish_current_build.py'):
  add('work/'+name)
 for name in ('cpp-reference-boot-priorities.json','update_cpp_reference_status.py','report_cpp_reference_changes.py','compose_cpp_reference_link_input.py','confirm_cpp_reference_regressions.py','finish_oct19_recovery.py'):add('work/'+name)
 for name in ('source-closure-priorities.json','prepare_source_closure.py','finish_source_closure.py','update_source_closure_status.py'):add('work/'+name)
 # Retain useful verified source modules, not obsolete diagnostic HTML or ASTs.
 for name in ('automatic','force-recovered','browser-target','accelerated-global-link','current-full-linkage-fix','oct15-engine-current','oct15-header-providers','current-clock','oct15-startup-repair','oct15-startup-clock','oct15-startup-entry','oct15-entry-attempt','oct15-uniform-inventory','oct15-pointer-array-recovery','oct15-original-allocators','oct15-osd-allocation-frontier'):
  base=ROOT/'factory-output/source-first'/name
  for path in base.rglob('*'):
   if any(part in ('clang-ast-cache','probes') for part in path.relative_to(base).parts):continue
   if path.suffix in ('.json','.mjs'):add(path)
 for name in ('reports/accelerated-20261014','reports/browser-target','reports/native-oracle','reports/semantic-continuation','reports/oct16-blockers'):tree(name)
 for path in (ROOT/'reports').glob('*'):
  if path.is_file() and path.suffix in ('.json','.csv','.md','.png','.patch') and not path.name.endswith(('continuation-package.json','package-verification.json')):add(path)
  elif path.is_dir() and path.name.startswith(('oct15','oct16','oct19','oct20')):tree(path.relative_to(ROOT))
 for name in ('native-frame-5.png','native-frame-10.png'):add('artifacts/native-oracle/frames/run-20261014T132847256Z/'+name)
 compiler_fp=fingerprint(ROOT/'factory-output/compile_commands.json',ROOT/'factory-output/source-tree/eduke32-master',[])
 def freeze_build(name,historical=False):
  current=ROOT/'factory-output/source-first'/name;checkpoint_path=current/'checkpoint.json'
  if not checkpoint_path.exists():return {'directory':current.relative_to(ROOT).as_posix(),'completed_units':0,'complete':False,'historical':historical}
  checkpoint=json.loads(checkpoint_path.read_text());report_path=current/'recovery-report.json'
  final=json.loads(report_path.read_text()) if report_path.exists() else {}
  revision=final.get('compiler_revision_attestation',{}).get('end_fingerprint') if historical else compiler_fp
  # An old attested final report is retained at ITS revision, never relabeled.
  candidates=final.get('batch_results',[]) if historical else list(checkpoint['batch_cache'].values())
  rows=[row for row in candidates if row.get('status')=='ok' and row.get('compiler_fingerprint')==revision]
  for row in rows:
   manifest=current/portable_relative(row['manifest']);folder=manifest.parent
   assert batch_artifacts_match(folder,manifest,row['artifact_hashes']),manifest
   verified_batches.append((manifest,row['artifact_hashes']))
   for relative in row['artifact_hashes']:add(folder/portable_relative(relative))
   add(manifest);add(current/'plans'/(folder.name+'.json'))
  sources=sorted({source for row in rows for source in row['sources']})
  complete=bool(final.get('uniform_compiler_revision_verified') and final.get('verified_batch_units')==156 and len(sources)==156 and final.get('compiler_revision_attestation',{}).get('end_fingerprint')==revision)
  frozen={**checkpoint,'batch_cache':{key:row for key,row in checkpoint['batch_cache'].items() if row in rows}}
  files[(current/'checkpoint.json').relative_to(ROOT).as_posix()]=encoded(frozen)
  attested_final=bool(final.get('compiler_revision_attestation',{}).get('verified') and
      final['compiler_revision_attestation'].get('end_fingerprint')==revision and
      final.get('verified_batch_units')==len(sources) and not final.get('failed_batch_units'))
  snapshot=final if attested_final else {'format':'source-first-continuation-partial-build/2','original_selected_units':156,'completed_source_units':len(sources),'verified_batch_units':len(sources),'batch_results':rows,'complete':False,'uniform_compiler_revision_verified':False,'compiler_fingerprint':revision,'snapshot_of_running_build':not historical,'original_gameplay_verified':False}
  files[(current/'recovery-report.json').relative_to(ROOT).as_posix()]=encoded(snapshot)
  add(current/'original-build-inventory.json')
  return {'directory':current.relative_to(ROOT).as_posix(),'compiler_fingerprint':revision,'completed_units':len(sources),'completed_sources':sources,'complete':complete,'historical':historical,'readable_definition_entries':final.get('readable_definitions') if complete else sum(r.get('readable_definitions',0) for r in rows),'blocked_definition_entries':final.get('blocked_definitions') if complete else sum(r.get('blocked_definitions',0)for r in rows)}
 older_world=freeze_build('oct15-world-recovery',True)
 historical=freeze_build('oct15-heap-pointer-recovery',True)
 prior_bitfield=freeze_build('oct16-bitfield-boot-recovery',True)
 prior_contiguous=freeze_build('oct15-contiguous-record-recovery',True)
 pointer_partial=freeze_build('oct15-pointer-array-bulk',True)
 prior_array=freeze_build('oct16-array-members-recovery',True) if args.current_build!='oct16-array-members-recovery' else None
 prior_references=freeze_build('oct16-cpp-reference-boot-recovery',True) if args.current_build=='oct19-reference-host-recovery' or source_closure else None
 prior_host=freeze_build('oct19-reference-host-recovery',True) if source_closure else None
 current=freeze_build(args.current_build)
 # Saved link work has its own integrity checkpoint even without a final report.
 linked=ROOT/'factory-output/source-first/oct15-world-linked'
 checkpoint=read(linked.relative_to(ROOT)/'link-checkpoint.json')
 for source,hashes in checkpoint['verified'].items():
  module=linked/(source+'.mjs');manifest=module.with_suffix('.manifest.json')
  assert digest(module.read_bytes())==hashes['module_sha256'] and digest(manifest.read_bytes())==hashes['manifest_sha256'],source
  add(module);add(manifest);verified_links.append((module,manifest,hashes))
 # Only checkpoint-attested recovered units are copied; they are historical,
 # not proof that every staged module or the overall graph is linked.
 add(linked/'link-checkpoint.json');add(linked/'global-recovery.json')
 link_state={'directory':linked.relative_to(ROOT).as_posix(),'historical':True,'saved_round':checkpoint['last_completed_round'],'verified_recovered_units':len(verified_links),'fingerprint':checkpoint['fingerprint'],'complete_global_link_verified':False}
 for name in ('oct15-heap-pointer-linked','oct16-array-members-linked','oct16-cpp-reference-linked','oct19-reference-host-linked','oct20-source-closure-linked'):
  folder=ROOT/'factory-output/source-first'/name
  for path in folder.rglob('*'):
   if any(part in ('clang-ast-cache','probes') for part in path.relative_to(folder).parts):continue
   if path.suffix in ('.mjs','.json'):add(path)
  state_path=folder/'link-checkpoint.json'
  if state_path.is_file():
   for source,hashes in read(state_path.relative_to(ROOT)).get('verified',{}).items():
    module=folder/(source+'.mjs');manifest=module.with_suffix('.manifest.json')
    assert digest(module.read_bytes())==hashes['module_sha256'] and digest(manifest.read_bytes())==hashes['manifest_sha256'],source
    verified_links.append((module,manifest,hashes))
 for name in ('array-members-priorities.json','contiguous-record-priorities.json','compose_oct16_link_input.py','finish_oct16_incremental_link.py','write_oct16_blocker_reports.py','export_semantic_handoff.py','verify_original_player_arrays.py','verify_original_player_pointer_fields.py','verify_original_globals_oct16.py','verify_oct16_package.py','update_oct16_status.py','package_oct16_continuation.py'):
  add('work/'+name)
 add('factory-output/source-first/oct16-incremental-link-input/recovery-report.json')
 add('factory-output/source-first/oct16-incremental-link-input/original-build-inventory.json')
 entry=read('reports/oct15-original-entry-attempt-chromium.json');html=ROOT/'dist/original-entry-attempt.html'
 assert entry['original_app_main_execution_observed'] and not entry['game_booted'] and not entry['network_requests']
 assert digest(html.read_bytes())==entry['page_sha256'];add(html)
 resume=('python tools/source_first_automate.py --out factory-output/source-first/'+args.current_build+' --max-units 2 --jobs 1 --batch-size 1 --timeout 300 --priority-file work/cpp-reference-boot-priorities.json --persistent-ast-cache --ast-cache-shards 2 --no-global-link --resume') if args.current_build in ('oct16-cpp-reference-boot-recovery','oct19-reference-host-recovery') else 'python tools/source_first_automate.py --out factory-output/source-first/oct16-array-members-recovery --max-units 12 --jobs 2 --batch-size 1 --timeout 300 --priority-file work/array-members-priorities.json --persistent-ast-cache --ast-cache-shards 2 --no-global-link --resume'
 if args.current_build=='oct19-reference-host-recovery':resume=resume.replace('--max-units 2','--max-units '+str(current['completed_units']))
 next_link='python work/compose_oct16_link_input.py\npython tools/source_first_global_link.py --directory factory-output/source-first/oct16-incremental-link-input --out factory-output/source-first/oct16-array-members-linked --rounds 4 --retry-budget 12 --jobs 2 --timeout 180 --persistent-ast-cache --resume'
 if args.current_build=='oct16-cpp-reference-boot-recovery':next_link='python work/compose_cpp_reference_link_input.py\npython tools/source_first_global_link.py --directory factory-output/source-first/oct16-cpp-reference-link-input --out factory-output/source-first/oct16-cpp-reference-linked --rounds 4 --retry-budget 12 --jobs 2 --timeout 180 --persistent-ast-cache --resume'
 if args.current_build=='oct19-reference-host-recovery':next_link='python work/compose_cpp_reference_link_input.py --current-build oct19-reference-host-recovery --out factory-output/source-first/oct19-reference-host-link-input\npython tools/source_first_global_link.py --directory factory-output/source-first/oct19-reference-host-link-input --out factory-output/source-first/oct19-reference-host-linked --rounds 4 --retry-budget 12 --jobs 1 --timeout 180 --persistent-ast-cache --resume'
 if source_closure:
  resume='python work/finish_source_closure.py'
  next_link='python work/update_source_closure_status.py'
 regression=read(args.regression)
 assert regression['complete'] and regression['all_passed'] and regression['regression_inputs_unchanged']
 for name,sha in regression['regression_inputs'].items():assert digest((ROOT/name).read_bytes())==sha,name
 state={'format':'eduke32-llm-handoff/2','mode':'continuation','snapshot_utc':datetime.now(timezone.utc).isoformat(),'source_tree_directory':'factory-output/source-tree','compile_commands_path':'factory-output/compile_commands.json','primary_game_assets':'input-data/DUKE3D.GRP','original_inputs':[{'path':name,'bytes':(ROOT/name).stat().st_size,'sha256':digest((ROOT/name).read_bytes())} for name in ('input-source/dukenukem3d-master.zip','input-source/eduke32-master.zip','input-data/DUKE3D.GRP')],'current_compiler_frontend_sha256':digest((ROOT/'tools/source_ast_to_js.py').read_bytes()),'current_compiler_fingerprint':compiler_fp,'historical_uniform_build':historical,'historical_pointer_array_partial_build':pointer_partial,'historical_link_checkpoint':link_state,'current_build':current,'javaScript_game_playable_verified':False,'playable_offline_html_present':False,'original_app_main_execution_observed':True,'actual_startup_stop':entry['result']['error'],'original_app_main_diagnostic':'dist/original-entry-attempt.html','entry_execution_evidence':'reports/oct15-original-entry-attempt-chromium.json','current_regressions':{'report':'reports/oct16-array-members-regression-pointer-fields.json','complete':regression['complete'],'all_passed':regression['all_passed'],'counts':regression['counts']},'earlier_current_turn_regressions':'reports/oct15-heap-pointer-regression.json','verified_new_features':['LP64 pointer arrays and strict cross-TU provider ABI','standalone standard C++ heap lifetime; original game replacements still required','ten source-owned original allocation operator definitions and exact overload identities','native/Chromium original engineVerbosityCallback with shared original callback storage'],'unresolved_game_frontier':['engineSetLogFile/Loguru std::recursive_mutex, lock_guard, vector/iterator, lambda','OSD nontrivial allocation and original mi_* providers','complete record/heap pointer and browser memory ABI bridge','original app_main/enginePreInit dependency closure','original level rendering, game loop and input/audio/save integration'],'omitted':['node_modules','downloaded compiler/browser binaries','raw AST caches','large semantic SQLite database','unrelated SW.GRP','obsolete HTML pages','unattested in-flight source output'],'resume_command':resume,'next_link_command':next_link,'strict_game_test':'npm run test:browser-game','local_postbuild_worker':read('reports/oct15-heap-pointer-queued-link.json'),'local_process_ids_are_host_specific':True}
 state.update(format='eduke32-llm-handoff/3',historical_older_world_build=older_world,historical_bitfield_partial_build=prior_bitfield,
  historical_contiguous_record_partial_build=prior_contiguous,latest_incremental_link={k:v for k,v in read('factory-output/source-first/oct16-array-members-linked/global-recovery.json').items() if k not in ('remaining','recovery_attempts')},
  compact_semantic_declarations=read('reports/semantic-continuation/summary.json'),
  compiler_feature_reports=['reports/oct15-bitfield-parity.json','reports/oct15-contiguous-record-parity.json','reports/oct16-array-members-parity.json','reports/oct16-original-player-array-parity.json','reports/oct16-original-player-pointer-field-parity.json','reports/oct16-original-global-module-evaluation.json'],
  latest_link_job=read('reports/oct16-incremental-link-job.json'))
 state['current_regressions']['report']=args.regression
 if prior_array:
  state['historical_array_storage_partial_build']=prior_array
  state['compiler_feature_reports'].append('reports/oct16-cpp-references-parity.json')
  state['verified_new_features']+=['Clang-selected scalar/pointer lvalue reference arguments, locals and returned lvalues',
   'borrowed reference-member RAII and original standard-library lock_guard constructor/destructor bodies',
   'cross-unit reference calling-contract attestation; historical incompatible providers rejected']
  state['unresolved_game_frontier'][0]='engineSetLogFile/Loguru std::recursive_mutex, Callback string lifetime, vector/iterator, lambda; lock_guard is now emitted'
 if prior_references:
  state['historical_reference_startup_build']=prior_references
  state['compiler_feature_reports'].append('reports/oct19-host-heap-alias-parity.json')
  state['verified_new_features'].append('stable host C heap buffer identity across growth and bounded live-allocation borrowing, with compiled source record aliases')
  current_link=ROOT/'factory-output/source-first/oct19-reference-host-linked/global-recovery.json'
  if current_link.is_file():
   state['latest_incremental_link']={key:value for key,value in read(current_link.relative_to(ROOT)).items() if key not in ('remaining','recovery_attempts','remaining_by_reason','dependency_frontier')}
  state['input_composition_command']='python work/compose_cpp_reference_link_input.py --current-build oct19-reference-host-recovery --out factory-output/source-first/oct19-reference-host-link-input'
  current_input=ROOT/'factory-output/source-first/oct19-reference-host-link-input/recovery-report.json'
  if current_input.is_file():
   composition=read(current_input.relative_to(ROOT))
   state['saved_link_work_reuse']={key:composition[key] for key in ('saved_verified_link_overlays','rejected_incompatible_saved_link_overlays')}
  if (ROOT/'reports/oct19-recovery-job.json').is_file():state['latest_recovery_job']=read('reports/oct19-recovery-job.json')
 if source_closure:
  state['historical_host_reference_build']=prior_host
  state['compiler_feature_reports']+=['reports/oct19-nested-goto-parity.json','reports/oct19-sysroot-inline-parity.json','reports/oct20-original-macro-header-parity.json']
  state['verified_new_features']+=['nested lexical goto with original loop/switch exit ownership',
   'actual target sysroot inline template bodies with physical header proof and reference ABI',
   'Clang macro-expansion provenance for original macro-generated header definitions']
  state['latest_incremental_link']={key:value for key,value in read('factory-output/source-first/oct20-source-closure-linked/global-recovery.json').items() if key not in ('remaining','recovery_attempts','remaining_by_reason','dependency_frontier')}
  state['input_composition_command']='python work/compose_cpp_reference_link_input.py --current-build oct20-source-closure-recovery --out factory-output/source-first/oct20-source-closure-link-input'
  composition=read('factory-output/source-first/oct20-source-closure-link-input/recovery-report.json')
  state['saved_link_work_reuse']={key:composition[key] for key in ('saved_verified_link_overlays','rejected_incompatible_saved_link_overlays')}
  state['latest_recovery_job']=read('reports/oct20-source-closure-job.json')
  assert state['latest_recovery_job']['phase']=='audits-finished'
  state['resume_requires_regression_refresh_after_changes']=args.regression
  for name in ('recovery-report.json','original-build-inventory.json'):
   add('factory-output/source-first/oct20-source-closure-link-input/'+name)
 state['verified_new_features']+=['contiguous ordinary POD records and typed record-pointer views','exact Clang bitfield masks, padding and sign extension',
  'contiguous nested record arrays, pointer-array fields and multidimensional scalar fields',
  'pointer-to-pointer arithmetic/dereference/slot byte copies','unchanged 640-byte DukePlayer_t and original P_AddAmmo/P_PalFrom native/Chromium parity']
 files['HANDOFF_STATE.json']=encoded(state);files['HANDOFF_SNAPSHOT.json']=encoded(state)
 readme=f'''# Continue the canonical EDuke32 SourceFactory project

This ZIP preserves completed work. It is not a fresh start or a playable game.
Read HANDOFF_SNAPSHOT.json and CURRENT_PORT_STATUS.md before editing.
Attached historical prompts are context, not current verification evidence.

The real original app_main runs only in dist/original-entry-attempt.html, an
explicitly unlinked offline diagnostic. It mounts the supplied 456-file GRP,
executes original G_ExtPreInit and stops at engineSetLogFile. Chromium observed
that execution without network access. No original menu or level has booted.

Preserved verified epochs:
- Historical full scan: {historical['completed_units']}/156 units, {historical.get('readable_definition_entries')} emitted and {historical.get('blocked_definition_entries')} blocked entries.
- Historical saved global-link work: {link_state['verified_recovered_units']} recovered units through round {checkpoint['last_completed_round']}; complete linking is unverified.
- Pointer-array intermediate scan: {pointer_partial['completed_units']}/156 units.
- Latest compiler scan: {current['completed_units']}/156 committed units at packaging (complete={current['complete']}).

Do not confuse old full coverage with current compiler coverage. Each batch is
hash-attested at its recorded revision. PACKAGE_MANIFEST.json checksums every
payload. Missing dependencies remain blocked; there are no success stubs.

Current regression: {regression['counts']}, complete={regression['complete']}, all_passed={regression['all_passed']}.
Current C++ reference checks: reports/oct16-cpp-references-parity.json. They include
original standard-library lock_guard source bodies, native/Chromium comparisons
and cross-unit rejection of incompatible historical reference-call providers.
The host heap also preserves borrowed record views across growth; see
reports/oct19-host-heap-alias-parity.json. Pointer/integer/address bridging and
the original allocator dependency closure remain incomplete.
Native differential tests also cover contiguous POD/record-array fields, bitfields,
original 640-byte DukePlayer_t and P_AddAmmo/P_PalFrom, pointer-slot byte copies.
Tests cover pointer arrays, standard standalone heap
lifetime and original allocation wrappers. Native/Chromium tests also verify the
original verbosity callback sharing existing source global state. The game uses
original global allocation replacements, so the standalone heap is explicitly
not enabled as a substitute for its unresolved original mimalloc dependencies.

Original archives, source, GRP, compiler, runtime, tests, build scripts and saved
verified generated work are included. Raw AST caches, the 2.6 GB database,
installed toolchains/browsers/node_modules and obsolete pages are excluded.

Restore Python dependencies from dev-requirements.txt plus playwright==1.64.0,
run npm ci, and install Chromium using python -m playwright install chromium.
Use Clang with captured Linux x86-64 LP64 target/sysroot (bootstrap scripts and
locks are in tools/). work/session-env.ps1 records original host paths; adapt
those paths when moving hosts. tools/prepare_sources.py relocates source inputs.
The native Windows oracle uses LLP64; its long width is not the Linux ABI.

Resume (avoid starting a second writer on the same active output directory):

```text
{resume}
{next_link}
python tools/verify_recovery_suite.py --jobs 1 --timeout 240 --report reports/resumed-regression.json
npm run test:browser-game
```

The current source scope is {current['completed_units']}/156 units at the latest
compiler revision. Earlier full and partial epochs are explicitly historical.
The latest orchestration audit is {'reports/oct20-source-closure-job.json' if source_closure else 'reports/oct19-recovery-job.json' if prior_references else 'reports/oct16-incremental-link-job.json'}.
The linker input mixes current batches with independently hash-attested earlier
work. Saved linked modules are reused only after current ownership, native storage
and reference-call ABI validation. Rejected overlays remain explicit. This is not
uniform current compilation or a completed whole-game fixed point.
The compact semantic-continuation export preserves 94,985 saved Clang declarations
in about 5.7 MB compressed; the 2.6 GB SQLite database is rebuildable and omitted.

The final game test must remain failing until original gameplay actually works.
No WASM, instruction emulator, replacement game or fabricated ownership. Preserve
one canonical compiler and rebuild affected units after shared semantic fixes.
Current blockers include Loguru C++ lifetimes/containers, nontrivial OSD objects,
original allocator linkage, pointer/integer/browser-heap bridging and the full
startup-to-gameplay dependency graph. Do not describe isolated tests as boot.
'''
 files['HANDOFF_README.md']=readme.encode();files['LLM_CONTINUATION_PROMPT.md']=readme.encode()
 files['CURRENT_PORT_STATUS.md']=(ROOT/'reports/oct16-current-status.md').read_bytes()
 args.out.parent.mkdir(parents=True,exist_ok=True);stage=args.out.with_suffix(args.out.suffix+'.partial');rows=[]
 with zipfile.ZipFile(stage,'w',zipfile.ZIP_DEFLATED,compresslevel=5,allowZip64=True) as archive:
  for name,value in sorted(files.items()):
   data=value if isinstance(value,bytes) else value.read_bytes();archive.writestr('EDuke32_SourceFactory/'+name,data)
   rows.append({'path':name,'bytes':len(data),'sha256':digest(data)})
  archive.writestr('EDuke32_SourceFactory/PACKAGE_MANIFEST.json',encoded({'format':'checksum-continuation/2','files':rows,'payload_files':len(rows),'original_gameplay_verified':False}))
  archive.comment=b'Canonical continuation with verified historical and current work. Original browser game has not booted.'
 with zipfile.ZipFile(stage) as archive:
  for row in rows:
   data=archive.read('EDuke32_SourceFactory/'+row['path']);assert len(data)==row['bytes'] and digest(data)==row['sha256'],row['path']
 for manifest,hashes in verified_batches:assert batch_artifacts_match(manifest.parent,manifest,hashes),manifest
 for module,manifest,hashes in verified_links:
  assert digest(module.read_bytes())==hashes['module_sha256'] and digest(manifest.read_bytes())==hashes['manifest_sha256']
 stage.replace(args.out)
 result={'path':str(args.out.resolve()),'bytes':args.out.stat().st_size,'sha256':digest(args.out.read_bytes()),'payload_files':len(rows),'historical_full_units':historical['completed_units'],'total_attested_saved_link_units_across_epochs':len(verified_links),'current_units_snapshotted':current['completed_units'],'all_payload_checksums_verified':True,'not_fresh_start':True,'playable_game':False}
 (ROOT/'reports/oct16-continuation-package.json').write_bytes(encoded(result));print(json.dumps(result,indent=2))
if __name__=='__main__':main()
