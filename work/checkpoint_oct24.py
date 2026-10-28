"""Publish a factual continuation checkpoint after frozen verification."""
import hashlib,json,sys
from datetime import datetime,timezone
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'tools'))
from verify_recovery_suite import regression_inputs
from source_first_automate import fingerprint
def read(name):return json.loads((ROOT/name).read_text(encoding='utf-8-sig'))
regpath='reports/oct27-final-recovery-regression.json';reg=read(regpath)
assert reg['complete'] and reg['regression_inputs_unchanged'],'Finish frozen regression first'
assert reg['regression_inputs']==regression_inputs(),'Current inputs differ from tested revision'
inventory=read('reports/all-blockers.json');acceptance=read('reports/port-acceptance.json')
proofs=['reports/oct23-original-initsystem-browser.json','reports/oct23-original-clipping-browser.json','reports/oct25-source-integer-parity.json','reports/oct25-source-scanf-parity.json','reports/oct25-original-libdivide-parity.json','reports/oct26-scalar-bytes-parity.json','reports/oct26-private-nested-parity.json','reports/oct26-filtered-record-pointer-parity.json','reports/oct26-original-hash-browser.json','reports/oct26-original-console-browser.json','reports/oct27-original-palette-storage-browser.json','reports/oct27-original-gamma-browser.json']
for name in proofs:assert read(name).get('passed'),name
frontiers=['reports/oct24-identity-frontier.json','reports/oct25-console-frontier.json','reports/oct26-console-storage-frontier.json','reports/oct26-startup-callback-frontier.json','reports/oct26-palette-fade-frontier.json','reports/oct27-gamma-storage-frontier.json']
entries={r['entry']:{**r,'report':name} for name in frontiers for r in read(name)['jobs']}
resume={'environment':'. work/session-env.ps1','launcher':'npm run serve:project','startup':'python work/recover_current_boot_frontier.py --label next-boot-frontier --entries initprintf OSD_Init baselayer_init videoGetModes enginePreInit app_main','regressions':'python tools/verify_recovery_suite.py --jobs 1 --timeout 240 --report reports/next-regression.json','pipeline':'npm run compile:game','acceptance':'python tools/verify_port_acceptance.py --strict','handoff':'npm run handoff:project'}
remaining=['Original allocator destruction, unique_ptr custom deleter, array/atomic subobjects, placement construction and thread caches','Owned-subobject plans are tested metadata only; emitter integration remains disabled','initprintf -> xrealloc -> handle_memerr -> engineDestroyAllocator','OSD_Init original operator new/CircularQueue, OSD_RegisterCvar/hash_add and range-loop callbacks','videoSetPalette now requires XXH3_64bits; its original scalar header compilation blocks on alignment attributes and __builtin_assume. videoGetModes header-global duplication remains','Original app_main closure, GRP-to-level loading, menus, renderer, gameplay, audio and save/load','Old menu/music undeclared references and historical export ambiguities']
state={'format':'sourcefactory-current-project/1','updated_utc':datetime.now(timezone.utc).isoformat(),'gameplay_verified':False,'playable_dist_index_present':(ROOT/'dist/index.html').is_file(),'project_launcher':'index.html','launcher_command':resume['launcher'],'compiler_frontend_sha256':hashlib.sha256((ROOT/'tools/source_ast_to_js.py').read_bytes()).hexdigest(),'compiler_fingerprint':fingerprint(ROOT/'factory-output/compile_commands.json',ROOT/'factory-output/source-tree/eduke32-master',[]),'regression':{'report':regpath,'complete':True,'counts':reg['counts'],'selected_tests':reg['selected_tests'],'all_passed':reg['all_passed'],'regression_input_sha256':reg['regression_input_sha256'],'revision_matches_current_inputs':True,'failures':[r for r in reg['tests'] if r['status']!='passed'],'does_not_verify_original_gameplay':True},'browser_and_native_proofs':proofs,'integration_target':'factory-output/source-first/oct20-engine-preinit-browser','original_allocator_verified':False,'original_console_initialization_verified':False,'owned_lifetime_emitter_enabled':False,'current_inventory':{k:inventory[k] for k in ('audited_source_units','all_selected_units_audited','raw_definition_observations','raw_emitted_definition_observations','raw_blocked_definition_observations','blocked_definition_records','stable_declaration_identity_records','uniform_compiler_revision_verified')},'inventory_limitation':'Mixed historical emission revisions; not semantic or ninety-percent recovery proof','current_blocker_reports':['reports/all-blockers.json','reports/all-blockers.csv','reports/root-causes.json','reports/dependency-graph.json','reports/boot-blockers.json'],'scope_aware_symbol_audit':'reports/oct26-browser-free-identifiers.json','undeclared_identifier_occurrences':read('reports/oct26-browser-free-identifiers.json')['count'],'startup_results':entries,'failed_acceptance_checks':acceptance['failed_checks'],'unverified_acceptance_checks':acceptance['unverified_checks'],'cleanup':{'previously_verified_removed_bytes':3971270717,'reports':['reports/project-cleanup.json','reports/oct21-export-cleanup.json','reports/oct22-superseded-handoff-cleanup.json']},'remaining_implementation':remaining,'resume':resume}
status=f'''# Current EDuke32 continuation status

**The original game is not bootable or playable. There is no playable dist/index.html or genuine gameplay screenshot.** The root index.html is the existing build/test/acceptance/cleanup/handoff launcher.

This preserves the canonical source, supplied GRP, compiler, runtime and previous work. No WASM, emulator, imitation game or fabricated boot was introduced.

The frozen current regression completed {reg['completed_tests']}/{reg['selected_tests']} tests: {reg['counts']}. Exact fingerprints and logs: `{regpath}`. These tests do not establish original gameplay.

Original initsystem, timer/video-service setup, Bstrtoken and videoGetDisplayName execute in Chromium. Original engineInitClipMaps also executes, using a Free-only host adapter rather than the complete original allocator. Original hash lookups pass 768 native/browser comparisons. Original osdcmd_cvar_set passes 384 browser mutation cases and a read-only case with explicitly test-populated console data. Original OSD initialization and registration remain blocked; this is not an initialized game console. The Oct26 full regression found one type-query failure, fixed before the current run; the interrupted Oct27 intermediate run is retained without a completion claim.

Shared fixes cover source scalar bytes under pointer casts, nested type recovery from filtered ASTs, source-owned nested private record storage, and record member pointers independent of typedef spelling. Integer parsing, scanf and the original libdivide header operations have native and browser verification. Exact old fragment hashes are required when installing replacement fragments; original globals are preserved.

enginePreInit still requires baselayer_init, initprintf and videoGetModes. Deeper failures include original allocator lifetimes/operators, console callbacks, the original XXH3 checksum, and duplicate header globals. Palette arrays and the fade record now use proven contiguous byte storage; 2,048 native/browser record comparisons pass. Original videoSetGamma executes through a real browser SDL window, with 5,376 sampled gamma values matching native exactly. The owned-subobject lifetime planner is tested metadata only and is NOT enabled in the emitter. app_main remains blocked.

The audit covers {inventory['audited_source_units']} selected units: {inventory['raw_emitted_definition_observations']} emitted observations, {inventory['raw_blocked_definition_observations']} blocked observations, {inventory['blocked_definition_records']} deduplicated blocked records. These use mixed historical compiler revisions, not a fresh uniform build or ninety-percent semantic recovery.

Menu, E1L1, world rendering, movement, weapons, enemies, collision, audio, saving/loading, 60 seconds of gameplay, native-game parity, offline bundling and reproducible playable builds have not passed. Exact acceptance failures are in reports/port-acceptance.json and reports/project-current-status.json.
'''
continuation='''# Continue the canonical project

Read CURRENT_PORT_STATUS.md, HANDOFF_SNAPSHOT.json and reports/project-current-status.json first. This is a continuation, not a fresh start. Preserve original inputs and verified emitted source.

Configure dependencies using BUILD_PORTABILITY.md. On this host:

```powershell
. work/session-env.ps1
python work/recover_current_boot_frontier.py --label next-boot-frontier --entries initprintf OSD_Init baselayer_init videoGetModes enginePreInit app_main
```

The current integration is factory-output/source-first/oct20-engine-preinit-browser. The Oct26 palette-fade and Oct27 gamma-storage frontier reports record the latest failures and gamma integration. XXH3 scalar-header diagnostics are in reports/oct27-xxhash-scalar.log and its generated manifest. work/xxhash-browser-compile-commands.json records the explicit original scalar library configuration; that candidate is not installed or verified. Keep heavy Clang jobs serial. Recompile affected functions into a new epoch and preserve source-owned globals.

Do not run work/recover_browser_preinit.py on this target: it restores an older snapshot. The current frontier helper rejects duplicate globals and incompatible ABI. Replacing an already installed fragment requires tools/install_verified_fragment.py --replace-fragment-sha256 with its exact current manifest hash. This preserves original owner storage and the previous immutable shard. tools/expose_verified_private_storage.py only upgrades verified original bindings.

Original browser checks are work/verify_original_initsystem_browser.py, work/verify_original_clipping_browser.py, work/verify_original_hash_browser.py and work/verify_original_console_browser.py, work/verify_original_palette_storage_browser.py and work/verify_original_gamma_browser.py. Their reports identify test storage and incomplete original initialization. work/upgrade_verified_zero_record_arrays.py only upgrades source-proven all-zero unsigned-byte record storage; the actual palette upgrades and source hashes are in the Oct26 palette-storage integration reports. Owned lifetime plans remain disabled until construction and destruction emission are implemented.

```powershell
npm run serve:project
python tools/verify_recovery_suite.py --jobs 1 --timeout 240 --report reports/next-regression.json
python tools/verify_port_acceptance.py --strict
npm run compile:game
npm run handoff:project
```

compile:game remains the canonical pipeline and fails strict game acceptance while dependencies are unresolved. dist/original-entry-attempt.html is an old failed diagnostic that bypasses services, not a game. Never promote it to dist/index.html or count isolated subsystem tests as gameplay.

The continuation archive includes source and GRP, compiler/runtime, tests, scripts, compact semantic evidence and incremental source epochs. It excludes downloaded toolchain binaries, node_modules, raw ASTs, the large semantic SQLite database and redundant ZIPs. Install tools as documented. CONTINUATION_MANIFEST.json contains verified SHA-256 for every payload.
'''
for name,value in [('CURRENT_PORT_STATUS.md',status),('CONTINUE_HERE.md',continuation),('HANDOFF_SNAPSHOT.json',json.dumps(state,indent=2)+'\n'),('reports/project-current-status.json',json.dumps(state,indent=2)+'\n')]:
    (ROOT/name).write_text(value,encoding='utf-8')
print(json.dumps({'status_updated':True,'gameplay_verified':False,'regression':state['regression']},indent=2))
