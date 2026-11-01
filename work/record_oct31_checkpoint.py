"""Record actual component execution separately from whole-game acceptance."""
import hashlib,json
from datetime import datetime,timezone
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def read(name):return json.loads((ROOT/name).read_text())
def sha(name):return hashlib.sha256((ROOT/name).read_bytes()).hexdigest()
state=read('HANDOFF_SNAPSHOT.json')
component=read('factory-output/source-first/browser-classic/component-manifest.json')
state.update(updated_utc=datetime.now(timezone.utc).isoformat(),
    compiler_frontend_sha256=sha('tools/source_ast_to_js.py'),
    current_full_profile_emission_verified=False,current_whole_program_linked=False,
    original_entry_executed_current_profile=False,original_engine_preinit_executed=False,
    original_console_initialization_verified=False,original_menu_rendered_in_javascript=False,
    original_e1l1_rendered_in_javascript=False,gameplay_verified=False,
    playable_dist_index_present=False)
state['boot_module_root']=component['module_root']
state['startup_component_build']={key:component[key] for key in (
    'source_units_with_partial_modules','selected_source_units','compiler_frontend_sha256',
    'whole_selected_program_compiled_under_current_revision','entry_exports',
    'execution_evidence_matches_modules','execution_report','original_engine_startup_verified')}
state['startup_component_build'].update(manifest='factory-output/source-first/browser-classic/component-manifest.json',
    invalid_import_count=len(component['invalid_imports']),
    ambiguous_export_group_count=len(component['ambiguous_export_groups']))
state['startup_component_warning']='22 partial unit modules are incremental artifacts, not a uniform 111-unit game build. Executed allocator/division/system/video calls do not execute original enginePreInit or app_main. Per-module fingerprints retain their individual compiler revisions.'
state['original_console_frontier']=read('factory-output/source-first/browser-classic/reports/frontier-source_build_src_osd.cpp.json')
state['original_hash_frontier']={'original_hash_initializers_linked':True,
    'original_xxh32_parity_report':'reports/oct31-original-xxh32-parity.json',
    'original_xxh32_native_node_chromium_cases':272,
    'original_libdivide_execution_records':65532}
state['original_engine_preinit_frontier']={
    'linked':False,'executed':False,
    'immediate_shared_blocker':'Original osdmain_t byte storage contains AtomicSList64/std::atomic; inheritance and queue lifetime lowering remain incomplete.',
    'additional_dependencies':['original console registration and callbacks','original file access','logging','remaining engine services']}
state['regression_baseline']={'report':'reports/oct30-startup-verified-regression.json',
    'passed':186,'complete':True,'frozen_inputs':True,
    'note':'Earlier revision before subsequent dependency, atomic, header-definition and strict record-pointer changes.'}
report=read('reports/oct31-current-full-regression.json')
keys=('complete','counts','selected_tests','completed_tests','all_passed','regression_inputs_unchanged','compiler_frontend_sha256')
state['regression']={'report':'reports/oct31-current-full-regression.json',**{k:report[k] for k in keys},
    'revision_matches_current_inputs':bool(report['complete'] and report['regression_inputs_unchanged'] and report['compiler_frontend_sha256']==state['compiler_frontend_sha256']),
    'gameplay_verified':False}
state['latest_targeted_regression']={'report':'reports/oct31-strict-memory-fixed-regression.json',
    'passed':8,'complete':True,'frozen_inputs':True}
state['source_header_definitions']={'contract':'factory-output/browser-classic/compile_commands.header-definitions.json',
    'witness':'factory-output/browser-classic/compile_commands.header-definitions.witness.json',
    'audited_units':111,'uniquely_owned_external_c_header_functions':237,
    'ambiguous_groups_excluded':10,'prototype_observation_does_not_prove_definition':True}
state['known_correctness_gaps']=[
    'Nontrivial heap-backed C++ record views, source constructors/destructors, std::atomic class methods and inherited storage are not fully implemented.',
    'The existing host timerInit initializes host service state but not original timer.cpp globals. It cannot verify original game-clock initialization; recover original timer initialization before gameplay.',
    'Source SDL surface/event/audio callback adaptation is incomplete; the component currently uses the JS SDL adapter.',
    'compile:game does not yet construct and verify a playable candidate from the incremental component.',
    'The complete selected-unit emission and fixed-point link have not been repeated under the current compiler.'
]
state['remaining_acceptance_failures']=[
    'Original console C++ object storage/lifetime, registration, logging and file-access closure',
    'Current uniform selected-unit emission and verified fixed-point global linkage',
    'Original app_main and enginePreInit execution',
    'Original game-clock state and complete SDL/browser service integration',
    'Original rendered menu and E1L1',
    '60-second gameplay, audio, collision, interaction, progression and save/load verification',
    'Verified standalone offline dist/index.html and reproducible one-command playable build'
]
state['resume_commands']=[
    '. work/session-env.ps1',
    'npm run status:component',
    'npm run compile:component -- source/build/src/osd.cpp OSD_Init,OSD_RegisterCvar,OSD_RegisterFunction,OSD_Puts',
    'npm run verify:engine-startup',
    'python tools/verify_recovery_suite.py --jobs 1 --timeout 240 --report reports/resumed-regression.json',
    'npm run compile:game'
]
state['subsystem_verification_commands']=[
    'python tests/source_factory/verify_original_xxh32_component.py',
    'npm run test:services',
    'node --test tests/source_factory/source_heap_addresses.test.mjs tests/source_factory/source_ctype_functions.test.mjs tests/source_factory/source_sdl_spinlock.test.mjs',
    'python work/package_current_continuation.py'
]
for path in ('HANDOFF_SNAPSHOT.json','reports/project-current-status.json'):
    (ROOT/path).write_text(json.dumps(state,indent=2)+'\n')
print(json.dumps({'regression':state['regression'],'gameplay_verified':False},indent=2))
