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
 parser=argparse.ArgumentParser();parser.add_argument('--out',type=Path,required=True);args=parser.parse_args()
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
 # Retain useful verified source modules, not obsolete diagnostic HTML or ASTs.
 for name in ('automatic','force-recovered','browser-target','accelerated-global-link','current-full-linkage-fix','oct15-engine-current','oct15-header-providers','current-clock','oct15-startup-repair','oct15-startup-clock','oct15-startup-entry','oct15-entry-attempt','oct15-uniform-inventory','oct15-pointer-array-recovery','oct15-original-allocators','oct15-osd-allocation-frontier'):
  base=ROOT/'factory-output/source-first'/name
  for path in base.rglob('*'):
   if any(part in ('clang-ast-cache','probes') for part in path.relative_to(base).parts):continue
   if path.suffix in ('.json','.mjs'):add(path)
 for name in ('reports/accelerated-20261014','reports/browser-target','reports/native-oracle'):tree(name)
 for path in (ROOT/'reports').glob('*'):
  if path.is_file() and path.suffix in ('.json','.csv','.md','.png','.patch') and path.name!='oct15-continuation-package.json':add(path)
  elif path.is_dir() and path.name.startswith('oct15'):tree(path.relative_to(ROOT))
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
  snapshot=final if complete else {'format':'source-first-continuation-partial-build/2','original_selected_units':156,'completed_source_units':len(sources),'verified_batch_units':len(sources),'batch_results':rows,'complete':False,'uniform_compiler_revision_verified':False,'compiler_fingerprint':revision,'snapshot_of_running_build':not historical,'original_gameplay_verified':False}
  files[(current/'recovery-report.json').relative_to(ROOT).as_posix()]=encoded(snapshot)
  add(current/'original-build-inventory.json')
  return {'directory':current.relative_to(ROOT).as_posix(),'compiler_fingerprint':revision,'completed_units':len(sources),'completed_sources':sources,'complete':complete,'historical':historical,'readable_definition_entries':final.get('readable_definitions') if complete else sum(r.get('readable_definitions',0) for r in rows),'blocked_definition_entries':final.get('blocked_definitions') if complete else sum(r.get('blocked_definitions',0)for r in rows)}
 historical=freeze_build('oct15-world-recovery',True)
 pointer_partial=freeze_build('oct15-pointer-array-bulk',True)
 current=freeze_build('oct15-heap-pointer-recovery')
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
 entry=read('reports/oct15-original-entry-attempt-chromium.json');html=ROOT/'dist/original-entry-attempt.html'
 assert entry['original_app_main_execution_observed'] and not entry['game_booted'] and not entry['network_requests']
 assert digest(html.read_bytes())==entry['page_sha256'];add(html)
 resume='python tools/source_first_automate.py --out factory-output/source-first/oct15-heap-pointer-recovery --jobs 2 --batch-size 1 --timeout 300 --priority-file work/heap-pointer-priorities.json --persistent-ast-cache --ast-cache-shards 2 --no-global-link --resume'
 next_link='python tools/source_first_global_link.py --directory factory-output/source-first/oct15-heap-pointer-recovery --out factory-output/source-first/oct15-heap-pointer-linked --rounds 4 --retry-budget 12 --jobs 2 --timeout 180 --persistent-ast-cache --resume'
 regression=read('reports/oct15-allocator-storage-regression.json')
 state={'format':'eduke32-llm-handoff/2','mode':'continuation','snapshot_utc':datetime.now(timezone.utc).isoformat(),'source_tree_directory':'factory-output/source-tree','compile_commands_path':'factory-output/compile_commands.json','primary_game_assets':'input-data/DUKE3D.GRP','original_inputs':[{'path':name,'bytes':(ROOT/name).stat().st_size,'sha256':digest((ROOT/name).read_bytes())} for name in ('input-source/dukenukem3d-master.zip','input-source/eduke32-master.zip','input-data/DUKE3D.GRP')],'current_compiler_frontend_sha256':digest((ROOT/'tools/source_ast_to_js.py').read_bytes()),'current_compiler_fingerprint':compiler_fp,'historical_uniform_build':historical,'historical_pointer_array_partial_build':pointer_partial,'historical_link_checkpoint':link_state,'current_build':current,'javaScript_game_playable_verified':False,'playable_offline_html_present':False,'original_app_main_execution_observed':True,'actual_startup_stop':entry['result']['error'],'original_app_main_diagnostic':'dist/original-entry-attempt.html','entry_execution_evidence':'reports/oct15-original-entry-attempt-chromium.json','current_regressions':{'report':'reports/oct15-allocator-storage-regression.json','complete':regression['complete'],'all_passed':regression['all_passed'],'counts':regression['counts']},'earlier_current_turn_regressions':'reports/oct15-heap-pointer-regression.json','verified_new_features':['LP64 pointer arrays and strict cross-TU provider ABI','standalone standard C++ heap lifetime; original game replacements still required','ten source-owned original allocation operator definitions and exact overload identities','native/Chromium original engineVerbosityCallback with shared original callback storage'],'unresolved_game_frontier':['engineSetLogFile/Loguru std::recursive_mutex, lock_guard, vector/iterator, lambda','OSD nontrivial allocation and original mi_* providers','complete record/heap pointer and browser memory ABI bridge','original app_main/enginePreInit dependency closure','original level rendering, game loop and input/audio/save integration'],'omitted':['node_modules','downloaded compiler/browser binaries','raw AST caches','large semantic SQLite database','unrelated SW.GRP','obsolete HTML pages','unattested in-flight source output'],'resume_command':resume,'next_link_command':next_link,'strict_game_test':'npm run test:browser-game','local_postbuild_worker':read('reports/oct15-heap-pointer-queued-link.json'),'local_process_ids_are_host_specific':True}
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
- Historical saved global-link work: {len(verified_links)} recovered units through round {checkpoint['last_completed_round']}; complete linking is unverified.
- Pointer-array intermediate scan: {pointer_partial['completed_units']}/156 units.
- Latest compiler scan: {current['completed_units']}/156 committed units at packaging (complete={current['complete']}).

Do not confuse old full coverage with current compiler coverage. Each batch is
hash-attested at its recorded revision. PACKAGE_MANIFEST.json checksums every
payload. Missing dependencies remain blocked; there are no success stubs.

Current regression: {regression['counts']}, complete={regression['complete']}, all_passed={regression['all_passed']}.
Native differential tests cover pointer arrays, standard standalone heap
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

On the original host, reports/oct15-heap-pointer-queued-link.json records the
authorized worker waiting for the active rebuild, then running the saved linker,
original boot audit and strict game gate. It cannot implement new C++ semantics.
Its process IDs are host-specific and are not valid on a receiving machine.

The final game test must remain failing until original gameplay actually works.
No WASM, instruction emulator, replacement game or fabricated ownership. Preserve
one canonical compiler and rebuild affected units after shared semantic fixes.
Current blockers include Loguru C++ lifetimes/containers, nontrivial OSD objects,
original allocator linkage, pointer/integer/browser-heap bridging and the full
startup-to-gameplay dependency graph. Do not describe isolated tests as boot.
'''
 files['HANDOFF_README.md']=readme.encode();files['LLM_CONTINUATION_PROMPT.md']=readme.encode()
 files['CURRENT_PORT_STATUS.md']=(ROOT/'reports/oct15-current-status.md').read_bytes()
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
 result={'path':str(args.out.resolve()),'bytes':args.out.stat().st_size,'sha256':digest(args.out.read_bytes()),'payload_files':len(rows),'historical_full_units':historical['completed_units'],'historical_recovered_link_units':len(verified_links),'current_units_snapshotted':current['completed_units'],'all_payload_checksums_verified':True,'not_fresh_start':True,'playable_game':False}
 (ROOT/'reports/oct15-continuation-package.json').write_bytes(encoded(result));print(json.dumps(result,indent=2))
if __name__=='__main__':main()
