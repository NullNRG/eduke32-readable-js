"""Generate current factual status; subsystem tests never attest gameplay."""
import hashlib,json,shutil,sys
from datetime import datetime,timezone
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'tools'))
from verify_recovery_suite import regression_inputs
def read(path):
    file=ROOT/path
    return json.loads(file.read_text()) if file.is_file() else {}
def take(doc,*keys):return {key:doc.get(key) for key in keys}
def frontier(path,names):
    return [take(row,'name','status','reason','unresolved_references')
            for row in read(path).get('definitions',[]) if row['name'] in names]
profile=read('tools/browser_classic_profile.json');build=Path(profile['build_root'])
semantic=read(build/'reports/semantic-index.summary.json')
regpath='reports/oct29-services-final-regression.json';regression=read(regpath)
matching=regression.get('regression_inputs')==regression_inputs() if regression else False
if regression.get('complete') and regression.get('all_passed') and matching:
    shutil.copyfile(ROOT/regpath,ROOT/build/'reports/recovery-regression-final.json')
console='factory-output/source-first/oct29-browser-console-native-services-full'
allocator_path='reports/oct29-browser-allocation-chain-parity.json';allocator=read(allocator_path)
service_path='reports/oct29-native-sdl-browser-verification.json';service=read(service_path)
portable=read('reports/semantic-browser-checkpoint/index.jsonl.json')
state={
 'format':'sourcefactory-current-project/3','updated_utc':datetime.now(timezone.utc).isoformat(),
 'source_repository':'https://github.com/NullNRG/eduke32-readable-js',
 'gameplay_verified':False,'playable_dist_index_present':(ROOT/'dist/index.html').is_file(),
 'original_entry_executed_current_profile':False,'original_engine_preinit_executed':False,
 'original_console_initialization_verified':False,'original_menu_rendered_in_javascript':False,
 'original_e1l1_rendered_in_javascript':False,'current_full_profile_emission_verified':False,
 'current_whole_program_linked':False,
 'project_launcher':'index.html','launcher_command':'npm run serve:project',
 'build_command':'npm run compile:game','active_profile':'tools/browser_classic_profile.json',
 'integration_target':build.as_posix(),'migration_input':profile['migration_input'],
 'migration_policy':'Historical migration only. Reuse requires matching source/configuration/ABI/compiler/runtime fingerprints.',
 'continuation_artifact_roots':[build.as_posix(),profile['migration_input'],
   'factory-output/source-first/oct29-browser-allocation-chain',console,
   'factory-output/source-first/oct29-browser-hash-providers',
   'factory-output/source-first/oct29-browser-startup-native-services',
   'factory-output/source-first/oct29-browser-startup-leaf-project',
   'factory-output/source-first/oct29-browser-audio-table','factory-output/browser-services'],
 'compiler_frontend_sha256':hashlib.sha256((ROOT/'tools/source_ast_to_js.py').read_bytes()).hexdigest(),
 'native_pointer_abi':'source-lp64-addresses/2','native_service_pointer_bits':32,
 'native_service_separate_heap':True,'execution_policy':profile.get('execution_policy'),
 'source_preparation':take(read('reports/browser-classic-preparation.json'),
     'selected_units','commands_sha256','allocator_backend','excluded_pool_units','source_adaptations'),
 'semantic_index':take(semantic,'fingerprint','selected_units','attempted_units','unit_statuses',
     'all_selected_units_parsed_without_errors','complete_semantic_extraction','limitations'),
 'baseline_compilation':take(read(build/'automatic/recovery-report.json'),
     'original_selected_units','attempted_units','verified_batch_units','readable_definitions','blocked_definitions'),
 'baseline_compilation_note':'Historical 113-unit initial emission predates current compiler, memory ABI and 111-unit generic-allocator profile. Not current emission or engine boot evidence.',
 'baseline_global_link':take(read(build/'globally-linked/global-recovery.json'),
     'completed_source_units','ambiguous_export_names','invalid_imports_or_syntax','full_game_linked'),
 'blocker_report_warning':'Existing whole-program blocker reports predate current profile/ABI. Refresh from current emission.',
 'regression':{'report':regpath,**take(regression,'complete','counts','selected_tests','completed_tests',
     'all_passed','regression_inputs_unchanged'),'revision_matches_current_inputs':matching,'gameplay_verified':False},
 'original_allocator':{'report':allocator_path,**take(allocator,'passed','commands_sha256','component_selected_units',
     'whole_browser_profile_verified','engine_allocator_startup_verified','engine_preinit_verified','gameplay_verified')},
 'native_browser_services':{'report':service_path,'manifest':'factory-output/browser-services/build-manifest.json',
     **take(service,'passed','browser_version','artifacts','original_engine_translation_units_in_wasm',
       'original_entry_executed','original_gameplay_verified'),
     'integration':'NativeRuntime binds native timing and version. Original SDL surface/event/callback bridging remains incomplete.'},
 'original_console_frontier':frontier(console+'/source/build/src/osd.cpp.manifest.json',
     {'OSD_Init','OSD_RegisterCvar','OSD_RegisterFunction'}),
 'original_hash_frontier':frontier(console+'/source/build/src/hash.cpp.manifest.json',
     {'hash_init','hash_findprime','hash_add','hash_getbucket','hash_getcode'}),
 'original_engine_preinit_frontier':frontier('factory-output/source-first/oct29-browser-startup-native-services/source/build/src/engine.cpp.manifest.json',{'enginePreInit'}),
 'startup_component_build':read('factory-output/source-first/oct29-browser-startup-leaf-project/project-build.json'),
 'logging_cutoff_probe':frontier('factory-output/source-first/oct29-browser-hash-providers/source/build/src/loguru.cpp.manifest.json',
     {'current_verbosity_cutoff','g_stderr_verbosity','s_max_out_verbosity'}),
 'strict_acceptance':take(read('reports/port-acceptance.json'),'all_acceptance_criteria_passed','failed_checks','unverified_checks'),
 'portable_semantic_checkpoint':{'data':'reports/semantic-browser-checkpoint/index.jsonl.gz',
     'metadata':'reports/semantic-browser-checkpoint/index.jsonl.json','lossless_all_tables':True,
     'fingerprint_matches_current_index':portable.get('semantic_fingerprint')==semantic.get('fingerprint'),
     'restore_command':'python work/portable_semantic_checkpoint.py restore --input reports/semantic-browser-checkpoint/index.jsonl.gz --output factory-output/source-first/browser-classic/reports/semantic-index.sqlite'},
 'remaining_acceptance_failures':['Original console/hash/header/logging dependency closure',
   'Current selected-unit emission and verified fixed-point global linkage',
   'Original app_main and enginePreInit execution','Complete SDL/browser-service integration',
   'Original rendered menu and E1L1','60-second gameplay, audio, collision and save/load verification',
   'Verified standalone offline dist/index.html'],
 'resume_commands':['. work/session-env.ps1','npm run compile:game'],
 'subsystem_verification_commands':['python tools/build_browser_services.py',
   'python tests/source_factory/verify_native_sdl_services.py','python work/verify_browser_allocator_chain.py'],
 'no_emulation_introduced':True,'original_game_or_build_engine_in_wasm':False,
 'wasm_policy_note':'Latest user allows SDL2/platform/audio/timing/native utilities in WASM. Game, Build renderer, CON, game loop and asset/storage code remain readable JS.'}
for path in ('reports/project-current-status.json','HANDOFF_SNAPSHOT.json','reports/oct29-browser-checkpoint.json'):
    (ROOT/path).write_text(json.dumps(state,indent=2)+'\n')
print(json.dumps({'gameplay_verified':False,'semantic_units':semantic.get('selected_units'),
    'regression':state['regression'],'native_services_passed':service.get('passed')},indent=2))
