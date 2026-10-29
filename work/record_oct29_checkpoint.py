"""Refresh the factual continuation checkpoint from current build evidence."""
import hashlib,json,shutil,sys
from pathlib import Path
from datetime import datetime,timezone
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'tools'))
from verify_recovery_suite import regression_inputs

def read(path):
 p=ROOT/path
 return json.loads(p.read_text()) if p.is_file() else {}
def sha(path):return hashlib.sha256((ROOT/path).read_bytes()).hexdigest()
profile=read('tools/browser_classic_profile.json')
build=Path(profile['build_root'])
automatic=read(build/'automatic/recovery-report.json')
linked=read(build/'globally-linked/global-recovery.json')
semantic=read(build/'reports/semantic-index.summary.json')
blockers=read(build/'reports/all-blockers.json')
regression_path=('reports/oct29-memory-final-regression.json' if (ROOT/'reports/oct29-memory-final-regression.json').is_file() else 'reports/oct29-final-regression.json')
regression=read(regression_path)
regression_match=regression.get('regression_inputs')==regression_inputs() if regression else False
inventory=ROOT/build/'all-files-audit.json'
if inventory.is_file():shutil.copyfile(inventory,ROOT/build/'reports/source-files-current.json')
if regression.get('all_passed') and regression.get('complete') and regression_match:
 shutil.copyfile(ROOT/regression_path,ROOT/build/'reports/recovery-regression-final.json')
console=read('factory-output/source-first/oct29-browser-console-addresses/source/build/src/osd.cpp.manifest.json') or read('factory-output/source-first/oct29-browser-console-lifetime/source/build/src/osd.cpp.manifest.json')
audio=read('factory-output/source-first/oct29-browser-audio-table/source/audiolib/src/drivers.cpp.manifest.json')
allocator=read('factory-output/source-first/oct29-browser-generic-allocator-addresses/source/build/src/smmalloc_generic.cpp.manifest.json')
frontier=lambda doc,names:[{'name':r['name'],'status':r['status'],'reason':r.get('reason')} for r in doc.get('definitions',[]) if r['name'] in names]
state={
 'format':'sourcefactory-current-project/2','updated_utc':datetime.now(timezone.utc).isoformat(),
 'gameplay_verified':False,'playable_dist_index_present':(ROOT/'dist/index.html').is_file(),
 'current_full_profile_emission_verified':False,'current_whole_program_linked':False,
 'original_entry_executed_current_profile':False,'original_menu_rendered_in_javascript':False,
 'original_e1l1_rendered_in_javascript':False,
 'project_launcher':'index.html','launcher_command':'npm run serve:project','build_command':'npm run compile:game',
 'source_repository':'https://github.com/NullNRG/eduke32-readable-js',
 'active_profile':'tools/browser_classic_profile.json','integration_target':build.as_posix(),
 'migration_input':profile['migration_input'],
 'continuation_artifact_roots':[build.as_posix(),profile['migration_input'],
    'factory-output/source-first/oct29-browser-generic-allocator-addresses',
    'factory-output/source-first/oct29-browser-console-addresses',
    'factory-output/source-first/oct29-browser-audio-table'],
 'migration_policy':'Historical integration only; do not reuse across different configuration/ABI/compiler/runtime fingerprints.',
 'compiler_frontend_sha256':sha('tools/source_ast_to_js.py'),
 'native_pointer_abi':'source-lp64-addresses/2',
 'native_pointer_abi_migration':'Recompile providers and consumers; the old 113-unit baseline and October 20 integration use incompatible pointer tokens.',
 'semantic_index':{k:semantic.get(k) for k in ('fingerprint','selected_units','attempted_units','unit_statuses','all_selected_units_parsed_without_errors','complete_semantic_extraction','limitations')},
 'baseline_compilation':{k:automatic.get(k) for k in ('original_selected_units','attempted_units','verified_batch_units','failed_batch_units','readable_definitions','blocked_definitions','invalid_imports','uniform_compiler_revision_verified','compiler_revision_source_counts')},
 'baseline_compilation_note':'This 113-unit pass precedes the October 29 semantic fixes. All selected units parsed and emitted manifests, but blocked definitions remain. It is not a complete current-revision compile or boot proof.',
 'baseline_global_link':{k:linked.get(k) for k in ('completed_source_units','source_named_modules','unique_exports','ambiguous_export_names','invalid_imports_or_syntax','total_blocked_definitions','ast_dependency_recovery_attempted','recovery_round_limit','full_game_linked')},
 'baseline_global_link_note':'Initial ownership/import audit only; zero recovery rounds. Fixed-point recovery with the latest compiler remains required.',
 'current_blocker_reports':[(build/'reports'/name).as_posix() for name in ('all-blockers.json','all-blockers.csv','root-causes.json','dependency-graph.json','boot-blockers.json')],
 'current_inventory':blockers.get('summary',{k:blockers.get(k) for k in ('audited_source_units','all_selected_units_audited','raw_definition_observations','deduplicated_definition_records','blocked_definition_records','stable_declaration_identity_records','uniform_compiler_revision_verified')}),
 'regression':{'report':regression_path,'complete':regression.get('complete',False),
  'counts':regression.get('counts'),'selected_tests':regression.get('selected_tests'),
  'all_passed':regression.get('all_passed',False),'revision_matches_current_inputs':regression_match,
  'does_not_verify_original_gameplay':True,'frontend_matches_full_suite':regression.get('compiler_frontend_sha256')==sha('tools/source_ast_to_js.py')},
 'latest_semantic_regression':{'report':'reports/oct29-template-lifetime-regression.json',**{k:read('reports/oct29-template-lifetime-regression.json').get(k) for k in ('complete','all_passed','counts','regression_inputs_unchanged')}},
 'original_template_destructor_closure':console.get('template_destructor_closure'),
 'latest_pipeline_regression':{'report':'reports/oct29-compressed-cache-regression.json',**{k:read('reports/oct29-compressed-cache-regression.json').get(k) for k in ('complete','all_passed','counts','regression_inputs_unchanged')}},
 'original_ast_cache_proof':{'report':'reports/oct29-original-cache-proof.json',**{k:read('reports/oct29-original-cache-proof.json').get(k) for k in ('passed','readable_js_bytes_unchanged','gameplay_verified')}},
 'semantic_changes':['Clang-proven anonymous callback tables and empty C++ function prototype spellings',
  'Exact explicit member operator selection across filtered Clang queries',
  'Pointer/enum template argument identities and target layouts',
  'Whole-selected-program standard new/delete ownership contract; original class-specific/placement operators remain source-owned',
  'Shared browser command database propagated into blockers and boot audits; configured Clang dependency queries serial'],
 'memory_changes':['Pointer fields and pointer/integer casts use one LP64 byte-address representation',
  'Canonical ABIHeap C allocation, alignment, realloc, failure behavior, native low-address sentinel range and browser heap binding',
  'Whole-selected-program C allocation ownership and exact Clang C linkage proof, including filtered declarations',
  'Deferred static relocations preserve actual source storage and C++ delete releases retained registry buffers',
  'Original out-of-line static methods and non-ODR integral class constants lower by Clang identity'],
 'original_console_frontier':frontier(console,{'OSD_Init','OSD_UpdateDrawBuffer'}),
 'latest_static_member_regression':{'report':'reports/oct29-static-member-regression.json',**{k:read('reports/oct29-static-member-regression.json').get(k) for k in ('complete','all_passed','counts','regression_inputs_unchanged')}},
 'original_generic_allocator_frontier':[{'source_name':r['source_name'],'name':r['name'],'status':r['status'],'reason':r.get('reason')} for r in allocator.get('definitions',[]) if r.get('original_static_member')],
 'original_generic_allocator_partial_parity':read('reports/oct29-original-generic-allocator-parity.json'),
 'original_generic_allocator_full_parity':read('reports/oct29-original-generic-allocator-full-parity.json'),
 'strict_acceptance':{k:read('reports/port-acceptance.json').get(k) for k in ('all_acceptance_criteria_passed','failed_checks','unverified_checks')},
 'latest_memory_regression':{'report':'reports/oct29-memory-corrected-regression.json',**{k:read('reports/oct29-memory-corrected-regression.json').get(k) for k in ('complete','all_passed','counts','regression_inputs_unchanged')}},
 'portable_semantic_checkpoint':{'data':'reports/semantic-browser-checkpoint/index.jsonl.gz',
  'metadata':'reports/semantic-browser-checkpoint/index.jsonl.json','lossless_all_tables':True,
  'restore_command':'python work/portable_semantic_checkpoint.py restore --input reports/semantic-browser-checkpoint/index.jsonl.gz --output factory-output/source-first/browser-classic/reports/semantic-index.sqlite',
  'note':'Restore only if the destination database is absent; resume also requires matching source/commands/toolchain fingerprints.'},
 'original_audio_frontier':frontier(audio,{'SoundDrivers','SoundDriver_IsPCMSupported'}),
 'original_console_initialization_verified':False,'original_allocator_verified':False,
 'original_generic_allocator_verified':read('reports/oct29-original-generic-allocator-full-parity.json').get('passed',False),'owned_lifetime_emitter_enabled':False,
 'native_template_instantiation_experiment':'reports/oct29-template-instantiation-probe.log',
 'template_experiment_limitation':'Demanded template destructor recovery is implemented with original template/macro-context and declaration-binding proofs. Original CircularQueue destruction and C allocation/free lowering pass; the class still needs original xfree through the small-pool allocator. This is source lowering, not executed console/game initialization.',
 'unrepresented_original_methods_note':'The 113-unit baseline predates out-of-line static lowering and omits 8 GenericAllocator methods. The latest isolated compile emits all 8 with exact Clang ownership and native/Node/Chromium allocation parity. Seven original small-allocator instance methods/constructors remain unrepresented by the baseline. The baseline blocked count is not a complete definition inventory.',
 'remaining_acceptance_failures':['Original app_main and enginePreInit boot closure','Original allocator and console initialization',
  'Canonical cross-unit template prototypes and remaining dependencies','Browser platform integration under the new profile',
  'Real rendered menu and E1L1','60-second gameplay/input/audio/collision/save/load verification','Standalone offline dist/index.html'],
 'resume_commands':['. work/session-env.ps1','npm run compile:game'],
 'developer_probe_commands':['python work/probe_template_instantiation.py'],
 'no_wasm_or_emulation_introduced':True}
for path in ('reports/project-current-status.json','HANDOFF_SNAPSHOT.json','reports/oct29-browser-checkpoint.json'):
 p=ROOT/path;p.write_text(json.dumps(state,indent=2)+'\n')
print(json.dumps({'gameplay_verified':False,'compiler_frontend_sha256':state['compiler_frontend_sha256'],
 'baseline_units':automatic.get('verified_batch_units'),'regression':state['regression']},indent=2))
