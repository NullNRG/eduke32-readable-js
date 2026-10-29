"""Refresh the factual continuation checkpoint from current build evidence."""
import hashlib,json,sys
from pathlib import Path
from datetime import datetime,timezone
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'tools'))
from verify_recovery_suite import regression_inputs

def read(path):
 p=ROOT/path
 return json.loads(p.read_text()) if p.is_file() else {}
def sha(path):return hashlib.sha256((ROOT/path).read_bytes()).hexdigest()
build=Path('factory-output/source-first/browser-classic')
automatic=read(build/'automatic/recovery-report.json')
linked=read(build/'globally-linked/global-recovery.json')
semantic=read(build/'reports/semantic-index.summary.json')
blockers=read(build/'reports/all-blockers.json')
regression=read('reports/oct29-final-regression.json')
regression_match=regression.get('regression_inputs')==regression_inputs() if regression else False
console=read('factory-output/source-first/oct29-browser-console/source/build/src/osd.cpp.manifest.json')
audio=read('factory-output/source-first/oct29-browser-audio-table/source/audiolib/src/drivers.cpp.manifest.json')
frontier=lambda doc,names:[{'name':r['name'],'status':r['status'],'reason':r.get('reason')} for r in doc.get('definitions',[]) if r['name'] in names]
state={
 'format':'sourcefactory-current-project/2','updated_utc':datetime.now(timezone.utc).isoformat(),
 'gameplay_verified':False,'playable_dist_index_present':(ROOT/'dist/index.html').is_file(),
 'project_launcher':'index.html','launcher_command':'npm run serve:project','build_command':'npm run compile:game',
 'source_repository':'https://github.com/NullNRG/eduke32-readable-js',
 'active_profile':'tools/browser_classic_profile.json','integration_target':build.as_posix(),
 'migration_input':'factory-output/source-first/oct20-engine-preinit-browser',
 'migration_policy':'Historical integration only; do not reuse across different configuration/ABI/compiler/runtime fingerprints.',
 'compiler_frontend_sha256':sha('tools/source_ast_to_js.py'),
 'semantic_index':{k:semantic.get(k) for k in ('fingerprint','selected_units','attempted_units','unit_statuses','all_selected_units_parsed_without_errors','complete_semantic_extraction','limitations')},
 'baseline_compilation':{k:automatic.get(k) for k in ('original_selected_units','attempted_units','verified_batch_units','failed_batch_units','readable_definitions','blocked_definitions','invalid_imports','uniform_compiler_revision_verified','compiler_revision_source_counts')},
 'baseline_compilation_note':'This 113-unit pass precedes the October 29 semantic fixes. All selected units parsed and emitted manifests, but blocked definitions remain. It is not a complete current-revision compile or boot proof.',
 'baseline_global_link':{k:linked.get(k) for k in ('completed_source_units','source_named_modules','unique_exports','ambiguous_export_names','invalid_imports_or_syntax','total_blocked_definitions','ast_dependency_recovery_attempted','recovery_round_limit','full_game_linked')},
 'baseline_global_link_note':'Initial ownership/import audit only; zero recovery rounds. Fixed-point recovery with the latest compiler remains required.',
 'current_blocker_reports':[(build/'reports'/name).as_posix() for name in ('all-blockers.json','all-blockers.csv','root-causes.json','dependency-graph.json','boot-blockers.json')],
 'current_inventory':blockers.get('summary',{k:blockers.get(k) for k in ('audited_source_units','all_selected_units_audited','raw_definition_observations','deduplicated_definition_records','blocked_definition_records','stable_declaration_identity_records','uniform_compiler_revision_verified')}),
 'regression':{'report':'reports/oct29-final-regression.json','complete':regression.get('complete',False),
  'counts':regression.get('counts'),'selected_tests':regression.get('selected_tests'),
  'all_passed':regression.get('all_passed',False),'revision_matches_current_inputs':regression_match,
  'does_not_verify_original_gameplay':True},
 'semantic_changes':['Clang-proven anonymous callback tables and empty C++ function prototype spellings',
  'Exact explicit member operator selection across filtered Clang queries',
  'Pointer/enum template argument identities and target layouts',
  'Whole-selected-program standard new/delete ownership contract; original class-specific/placement operators remain source-owned',
  'Shared browser command database propagated into blockers and boot audits; configured Clang dependency queries serial'],
 'original_console_frontier':frontier(console,{'OSD_Init','OSD_UpdateDrawBuffer'}),
 'original_audio_frontier':frontier(audio,{'SoundDrivers','SoundDriver_IsPCMSupported'}),
 'original_console_initialization_verified':False,'original_allocator_verified':False,'owned_lifetime_emitter_enabled':False,
 'native_template_instantiation_experiment':'reports/oct29-template-instantiation-probe.log',
 'template_experiment_limitation':'Clang can instantiate original queue lifetime bodies, but supplementary declaration provenance and integration are not implemented. No boot claim.',
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
