"""Record actual component execution separately from whole-game acceptance."""
import hashlib,json,subprocess,sys
from datetime import datetime,timezone
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'tools'))
from verify_recovery_suite import regression_inputs
from source_ast_to_js import compiler_runtime_revision
def read(name):return json.loads((ROOT/name).read_text())
def sha(name):return hashlib.sha256((ROOT/name).read_bytes()).hexdigest()
state=read('HANDOFF_SNAPSHOT.json')
try:state['source_implementation_commit']=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()
except (OSError,subprocess.CalledProcessError):pass
component=read('factory-output/source-first/browser-classic/component-manifest.json')
semantic=read('factory-output/source-first/browser-classic/reports/semantic-index.summary.json')
state['semantic_index']={key:semantic.get(key) for key in ('fingerprint','selected_units','attempted_units',
    'unit_statuses','all_selected_units_parsed_without_errors','complete_semantic_extraction','limitations')}
preparation=read('reports/browser-classic-preparation.json')
state['source_preparation']={key:preparation.get(key) for key in ('selected_units','commands_sha256',
    'allocator_backend','excluded_pool_units','source_adaptations')}
payload_metadata=ROOT/'reports/semantic-browser-checkpoint/index.jsonl.json'
if payload_metadata.is_file():
    payload=read(payload_metadata.relative_to(ROOT))
    state['portable_semantic_checkpoint']['fingerprint_matches_current_index']=payload.get('semantic_fingerprint')==semantic['fingerprint']
    state['portable_semantic_payload_verification']={
        'format':'semantic-continuation-payload-verification/2','payload':'reports/semantic-browser-checkpoint/index.jsonl.gz',
        'payload_sha256':payload.get('payload_sha256'),'semantic_fingerprint':payload.get('semantic_fingerprint'),
        'matches_current_index':payload.get('semantic_fingerprint')==semantic['fingerprint'],
        'table_rows':payload.get('table_rows'),'logical_table_sha256':payload.get('logical_table_sha256'),
        'new_sqlite_restoration_tested':False,'gameplay_verified':False}
    restore_path=ROOT/'reports/nov02-semantic-restore.json'
    if restore_path.is_file():
        restored=read(restore_path.relative_to(ROOT))
        if restored.get('payload_sha256')==payload.get('payload_sha256') and restored.get('logical_tables_verified'):
            state['portable_semantic_payload_verification'].update(new_sqlite_restoration_tested=True,
                independent_restore_report=restore_path.relative_to(ROOT).as_posix())
console_path=ROOT/'reports/nov02-original-console-chromium.json'
console=read(console_path.relative_to(ROOT)) if console_path.is_file() else {}
console_matches=(console.get('artifacts')=={path:digest for path,digest in component.get('artifacts',{}).items() if path.endswith('.mjs')}
    and console.get('runtime_artifacts')==component.get('runtime_artifacts'))
state.update(updated_utc=datetime.now(timezone.utc).isoformat(),
    compiler_frontend_sha256=sha('tools/source_ast_to_js.py'),
    current_full_profile_emission_verified=False,current_whole_program_linked=False,
    original_entry_executed_current_profile=False,original_engine_preinit_executed=bool(component.get('original_engine_startup_verified')),
    original_console_initialization_verified=bool(console_matches and console.get('original_console_initialization_verified') and not console.get('page_errors')),original_menu_rendered_in_javascript=False,
    original_e1l1_rendered_in_javascript=False,gameplay_verified=False,
    playable_dist_index_present=False)
state['boot_module_root']=component['module_root']
state['startup_component_build']={key:component[key] for key in (
    'source_units_with_partial_modules','selected_source_units','compiler_frontend_sha256',
    'whole_selected_program_compiled_under_current_revision','entry_exports',
    'execution_evidence_matches_modules','execution_report','original_engine_startup_verified')}
state['startup_component_build'].update(manifest='factory-output/source-first/browser-classic/component-manifest.json',
    invalid_import_count=len(component['invalid_imports']),
    ambiguous_export_group_count=len(component['ambiguous_export_groups']),
    original_storage_ownership_verified=component.get('original_storage_ownership_verified',False),
    storage_ownership_conflicts=component.get('storage_ownership_conflicts',[]))
state['startup_component_warning']=f"{component['source_units_with_partial_modules']} partial unit modules are incremental artifacts, not a uniform {component['selected_source_units']}-unit game build. Original enginePreInit executes in a fresh Chromium realm without manually initializing its helpers. Original app_main, menus and gameplay remain unverified. Per-module fingerprints retain their individual compiler revisions."
state['original_console_frontier']=read('factory-output/source-first/browser-classic/reports/frontier-source_build_src_osd.cpp.json')
state['original_console_execution']={'report':'reports/nov02-original-console-chromium.json',
    'current_module_and_runtime_fingerprints_match':console_matches,
    **{key:console.get(key) for key in ('component_passed','original_console_initialization_verified',
        'original_console_alias_verified','original_console_command_callbacks','browser_version','page_errors')},
    'original_engine_startup_verified':False,'gameplay_verified':False}
state['original_hash_frontier']={'original_hash_initializers_linked':True,
    'original_xxh32_parity_report':'reports/oct31-original-xxh32-parity.json',
    'original_xxh32_native_node_chromium_cases':272,
    'original_libdivide_execution_records':65532}
engine_frontier_path=ROOT/'factory-output/source-first/browser-classic/reports/frontier-source_build_src_engine.cpp.json'
engine_frontier=read(engine_frontier_path.relative_to(ROOT)) if engine_frontier_path.is_file() else {}
state['original_engine_preinit_frontier']={
    'linked':bool(component.get('entry_exports',{}).get('enginePreInit')),
    'executed':state['original_engine_preinit_executed'],
    'direct_failures':[row for row in engine_frontier.get('blocked',[]) if row.get('name')=='enginePreInit'],
    'immediate_shared_blocker':'Original enginePreInit returns 0 in fresh Chromium. Packed input assignment and selected union lowering now pass focused parity; original game roots advance to missing dependencies. G_HandleLocalKeys also requires a legal cross-scope goto lowering.',
    'additional_dependencies':['original app_main and game loop','original game clock initialization','source SDL surfaces/events/audio']}
game_frontier=read('factory-output/source-first/browser-classic/reports/frontier-source_duke3d_src_game.cpp.json')
game_manifest=read(game_frontier['manifest'])
game_closure=game_manifest.get('dependency_closure',{})
state['original_app_main_frontier']={'report':'factory-output/source-first/browser-classic/reports/frontier-source_duke3d_src_game.cpp.json',
    'linked':bool(component.get('entry_exports',{}).get('app_main')),'executed':False,
    'manifest':game_frontier['manifest'],'definition_entries':game_manifest.get('found'),
    'emitted_entries':game_manifest.get('emitted'),'blocked_entries':game_manifest.get('blocked'),
    'compiler_revision_matches_current':game_manifest.get('compiler_runtime_input_sha256')==compiler_runtime_revision(),
    'missing_direct_references':next((row.get('dependencies',[]) for row in game_frontier.get('blocked',[]) if row.get('name')=='app_main'),[]),
    'non_link_semantic_blockers':[row for row in game_frontier.get('blocked',[]) if not row.get('reason','').startswith('unlinked identifiers:')],
    'dependency_catalog_is_complete':False,'query_limit':game_closure.get('query_limit'),
    'budget_exhausted':game_closure.get('budget_exhausted'),'unqueried_references':game_closure.get('unqueried_references',[]),
    'reason':'This is a bounded targeted attempt, not the complete game dependency catalog.'}
state['launcher_features']=['interactive original enginePreInit diagnostic','fresh Chromium startup verification',
    'targeted app_main dependency recovery','full build','regression suite','acceptance checks','private continuation ZIP','conservative cleanup preview']
state['launcher_browser_evidence']='reports/nov02-launcher-browser.json'
state['bounded_game_provider_report']='reports/nov02-game-provider-frontier.json'
renderer_probe_path=ROOT/'factory-output/source-first/browser-classic/reports/frontier-source_duke3d_src_game.cpp-G_DrawRooms.json'
if renderer_probe_path.is_file():
    renderer=read(renderer_probe_path.relative_to(ROOT))
    state['original_renderer_lowering_probe']={'report':renderer_probe_path.relative_to(ROOT).as_posix(),
        'compiler_revision_matches_current':renderer.get('compiler_runtime_input_sha256')==compiler_runtime_revision(),
        'query_limit':renderer.get('query_limit'),'requested_compiled':renderer.get('requested_compiled'),
        'semantic_blockers':[row for row in renderer.get('blocked',[]) if not row.get('reason','').startswith('unlinked identifiers:')],
        'installed':False,'original_renderer_executed':False,'gameplay_verified':False}
state['regression_baseline']={'report':'reports/oct30-startup-verified-regression.json',
    'passed':186,'complete':True,'frozen_inputs':True,
    'note':'Earlier revision before subsequent dependency, atomic, header-definition and strict record-pointer changes.'}
regression_report=('reports/nov02-engine-launcher-full-regression.json' if (ROOT/'reports/nov02-engine-launcher-full-regression.json').is_file()
                   else 'reports/nov02-static-startup-full-regression.json' if (ROOT/'reports/nov02-static-startup-full-regression.json').is_file()
                   else 'reports/nov02-method-full-regression.json' if (ROOT/'reports/nov02-method-full-regression.json').is_file()
                   else 'reports/nov01-vfs-final-full-regression.json')
report=read(regression_report)
keys=('complete','counts','selected_tests','completed_tests','all_passed','regression_inputs_unchanged','compiler_frontend_sha256')
state['regression']={'report':regression_report,**{k:report.get(k) for k in keys},
    'revision_matches_current_inputs':bool(report['complete'] and report['regression_inputs_unchanged'] and
        report['regression_inputs']==regression_inputs()),
    'gameplay_verified':False}
corrected_path=ROOT/'reports/nov02-corrected-stream-regression.json'
if corrected_path.is_file():
    corrected=read(corrected_path.relative_to(ROOT));current=regression_inputs()
    before=report.get('regression_inputs',{})
    state['corrected_regression_tests']={'report':corrected_path.relative_to(ROOT).as_posix(),
        **{key:corrected.get(key) for key in keys},
        'revision_matches_current_inputs':corrected.get('regression_inputs')==current,
        'files_changed_since_complete_run':[name for name in sorted(set(before)|set(current)) if before.get(name)!=current.get(name)],
        'subsequent_full_pass_claimed':False}
targeted_report=('reports/nov02-union-selection-regression.json' if (ROOT/'reports/nov02-union-selection-regression.json').is_file()
                 else 'reports/nov02-packed-assignment-regression.json' if (ROOT/'reports/nov02-packed-assignment-regression.json').is_file()
                 else 'reports/nov02-launcher-regression.json' if (ROOT/'reports/nov02-launcher-regression.json').is_file()
                 else 'reports/nov02-worklist-final-regression.json' if (ROOT/'reports/nov02-worklist-final-regression.json').is_file()
                 else 'reports/nov02-static-player-final-regression.json' if (ROOT/'reports/nov02-static-player-final-regression.json').is_file()
                 else 'reports/nov02-player-storage-final-regression.json' if (ROOT/'reports/nov02-player-storage-final-regression.json').is_file()
                 else 'reports/nov02-header-scope-regression.json' if (ROOT/'reports/nov02-header-scope-regression.json').is_file()
                 else 'reports/nov02-console-final-regression.json' if (ROOT/'reports/nov02-console-final-regression.json').is_file()
                 else 'reports/nov02-function-address-regression.json' if (ROOT/'reports/nov02-function-address-regression.json').is_file()
                 else 'reports/nov02-atomic-pop-regression.json' if (ROOT/'reports/nov02-atomic-pop-regression.json').is_file()
                 else 'reports/nov02-array-address-regression.json' if (ROOT/'reports/nov02-array-address-regression.json').is_file()
                 else 'reports/nov01-archive-compiler-regression.json')
targeted=read(targeted_report)
state['latest_targeted_regression']={'report':targeted_report,
    **{key:targeted.get(key) for key in keys},
    'revision_matches_current_inputs':targeted.get('regression_inputs')==regression_inputs(),
    'note':'Focused subset only; fingerprints and the current complete regression are recorded separately.'}
atomic_report=ROOT/'reports/nov02-original-atomic-list-parity.json'
if atomic_report.is_file():
    atomic=read(atomic_report.relative_to(ROOT))
    state['original_atomic_list_methods']={'report':atomic_report.relative_to(ROOT).as_posix(),
        **{key:atomic[key] for key in ('passed','native_node_chromium_cases','original_methods',
            'javascript_constructed_list_or_nodes','pop_verified','console_initialization_verified','gameplay_verified')},
        'frontier_note':'reports/nov02-constructor-frontier.md',
        'compiler_and_runtime_helpers_match':bool(atomic.get('compiler_and_runtime_helpers')) and all(
            (ROOT/path).is_file() and sha(path)==digest for path,digest in atomic.get('compiler_and_runtime_helpers',{}).items())}
log_constructor_path=ROOT/'reports/nov02-original-log-constructor-parity.json'
if log_constructor_path.is_file():
    constructor=read(log_constructor_path.relative_to(ROOT))
    state['original_log_node_constructor']={'report':log_constructor_path.relative_to(ROOT).as_posix(),
        **{key:constructor.get(key) for key in ('passed','native_node_chromium_cases',
            'javascript_constructed_original_log_node','original_default_base_initializer_executed',
            'original_scalar_atomic_constructor_executed','fixture_record_span_is_byte_identical_to_original')},
        'compiler_and_runtime_helpers_match':all(sha(path)==digest for path,digest in constructor.get('compiler_and_runtime_helpers',{}).items())}
vfs=read('reports/nov01-original-vfs-parity.json')
state['original_resource_io']={'report':'reports/nov01-original-vfs-parity.json',
    'passed':vfs['passed'],'native_node_chromium_match':vfs['native_node_chromium_match'],
    **{key:vfs['result'][key] for key in ('archive_length','directory_entries',
        'original_directory_bytes_verified','native_parity_sample_bytes')},
    'original_grp_index_executed':True,'original_engine_startup_verified':False,
    'gameplay_verified':False,'resource_names':['E1L1.MAP','PALETTE.DAT','GAME.CON','TILES000.ART'],
    'raw_archive_only_mounted':True,'game_state_prepopulated':False}
state['prior_frozen_full_regression']={'report':'reports/nov01-integration-full-regression.json',
    'passed':199,'complete':True,'frozen_inputs':True,'revision_matches_current_inputs':False}
state['vfs_regression_corrections']={'earlier_complete_report':'reports/nov01-vfs-corrected-full-regression.json',
    'earlier_passed':204,'earlier_failed':3,
    'fixes':['Preserve a complete original class provider with no fields while rejecting a same-named C function as a constructor.',
        'Retain the original allocation-operator dependency check when the console reaches its newer explicit atomic-list method blocker.',
        'Rebuild the original libdivide provider after shared pointer helper changes.'],
    'division_parity_report':'reports/oct25-original-libdivide-parity.json',
    'native_node_chromium_divisions':3968,'native_node_chromium_wide_arithmetic_cases':256}
acceptance=read('reports/nov01-port-acceptance.json')
state['strict_acceptance']={'report':'reports/nov01-port-acceptance.json',
    **{key:acceptance[key] for key in ('all_acceptance_criteria_passed','original_game_playable_verified',
        'failed_checks','unverified_checks')}}
state['november_source_recovery']={
    'software_surface_parity_report':'reports/nov01-original-softsurface-parity.json',
    'software_surface_native_node_chromium_compared_bytes':1062912,
    'original_world_rendering_verified':False,
    'circular_queue_native_node_chromium_cases':256,
    'original_clipping_owner_bytes_verified_in_chromium':61464,
    'original_clipping_report':'reports/nov01-original-clip-storage.json',
    'circular_queue_log':'reports/nov01-original-queue-parity.log',
    'member_overload_native_node_cases':1024,
    'template_record_native_node_cases':1024,
    'source_storage_audit':'tools/source_fragment_storage.py',
    'source_storage_policy':'Actual hidden fragment VarDecls are audited, independently of selected re-exports. Known legacy conflicts are not verified source ownership.'}
state['earlier_full_regression']={'report':'reports/oct31-first-full-regression.json','passed':185,'failed':6,'selected_tests':191,'frozen_inputs':True,'note':'Earlier strict-layout revision. Subsequent shared fixes pass all 16 affected regressions; current full run is separate.'}
state['shared_layout_recovery']={'native_c_records_node_chromium_cases':512,'original_menu_header_native_cases':1280,'cross_unit_record_owner_native_cases':512,'compiler_features':['Clang C RecordDecl layouts','one typed record path for reads/addresses/compound updates','same-TU field selection by mangled owner/body/ordinal','source-proven template record deduplication','native byte storage at original global owners'],'original_menu_rendering_verified':False}
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
if component.get('storage_ownership_conflicts'):
    state['known_correctness_gaps'].insert(0,'Legacy source fragments still duplicate some original globals. The component manifest enumerates the actual active conflicts; zero missing imports does not prove shared storage correctness.')
state['remaining_acceptance_failures']=[
    'Original app_main dependency closure and legal cross-scope goto lowering in original quick-save/load handling',
    'Remaining actual duplicate source storage in legacy fragments',
    'Current uniform selected-unit emission and verified fixed-point global linkage',
    'Original app_main execution (enginePreInit already passes independently)',
    'Original game-clock state and complete SDL/browser service integration',
    'Original rendered menu and E1L1',
    '60-second gameplay, audio, collision, interaction, progression and save/load verification',
    'Verified standalone offline dist/index.html and reproducible one-command playable build'
]
state['resume_commands']=[
    '. work/session-env.ps1',
    'npm run status:component',
    'npm run recover:app-main',
    'npm run verify:engine-startup',
    'python tools/verify_recovery_suite.py --jobs 1 --timeout 240 --report reports/resumed-regression.json',
    'npm run compile:game'
]
state['subsystem_verification_commands']=[
    'python work/verify_original_vfs.py',
    'python tests/source_factory/verify_original_xxh32_component.py',
    'python work/verify_original_softsurface.py',
    'python work/verify_original_clip_component.py',
    'python work/probe_original_queue.py',
    'npm run test:services',
    'node --test tests/source_factory/source_heap_addresses.test.mjs tests/source_factory/source_ctype_functions.test.mjs tests/source_factory/source_sdl_spinlock.test.mjs',
    'python work/package_current_continuation.py'
]
for path in ('HANDOFF_SNAPSHOT.json','reports/project-current-status.json'):
    (ROOT/path).write_text(json.dumps(state,indent=2)+'\n')
print(json.dumps({'regression':state['regression'],'gameplay_verified':False},indent=2))
