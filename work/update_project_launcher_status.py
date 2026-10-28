"""Write current continuation status without relabelling historical builds."""
import hashlib,json,sys
from datetime import datetime,timezone
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'tools'))
from source_first_automate import fingerprint
def read(name):return json.loads((ROOT/name).read_text(encoding='utf-8-sig'))
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
regression_report='reports/oct21-helper-regression.json'
reg=read(regression_report)
assert reg['complete'] and reg['regression_inputs_unchanged']
checks={row['test']:row for row in reg['tests']}
retry_report='reports/oct21-helper-regression-retry.json'
retry=read(retry_report) if (ROOT/retry_report).is_file() else {}
retry_accepted=bool(retry.get('complete') and retry.get('regression_inputs_unchanged') and
    retry.get('regression_input_sha256')==reg['regression_input_sha256'])
if retry_accepted:
    for row in retry['tests']:checks[row['test']]=row
passed=sum(row['status']=='passed' for row in checks.values())
changed=[name for name,value in reg['regression_inputs'].items() if not (ROOT/name).exists() or sha(ROOT/name)!=value]
assert set(changed)<={'tools/project_workspace.py','tools/project_launcher.py'},changed
if changed:
    packaging=read('reports/oct21-packaging-validation.json')
    assert packaging['passed'] and packaging['packager_sha256']==sha(ROOT/'tools/project_workspace.py')
    assert packaging['launcher_sha256']==sha(ROOT/'tools/project_launcher.py')
frontier=read('reports/oct21-boot-frontier.json');acceptance=read('reports/port-acceptance.json')
state={'format':'sourcefactory-current-project/1','updated_utc':datetime.now(timezone.utc).isoformat(),
    'gameplay_verified':False,'playable_dist_index_present':(ROOT/'dist/index.html').is_file(),
    'project_launcher':'index.html','launcher_command':'npm run serve:project',
    'compiler_frontend_sha256':sha(ROOT/'tools/source_ast_to_js.py'),
    'compiler_fingerprint':fingerprint(ROOT/'factory-output/compile_commands.json',ROOT/'factory-output/source-tree/eduke32-master',[]),
    'regression':{'report':regression_report,'counts':reg['counts'],'complete':True,
        'full_run_all_passed':reg['all_passed'],'accepted_retry_report':retry_report if retry_accepted else None,
        'combined_passed':passed,'combined_total':len(checks),'combined_all_passed':passed==len(checks),
        'remaining_failures':[row['test'] for row in checks.values() if row['status']!='passed'],
        'post_suite_changes':changed,'post_suite_validation':'reports/oct21-packaging-validation.json' if changed else None},
    'browser_proofs':['reports/oct20-project-launcher-browser.json','reports/oct20-browser-host-strings-parity.json',
        'reports/oct20-partial-array-dependencies.json','reports/oct20-original-messagebox-browser.json','reports/oct21-integrated-division-tables.json',
        'reports/oct21-integrated-original-input.json','reports/oct21-static-methods.json'],
    'source_integration':{'staging':'factory-output/source-first/oct20-engine-preinit-browser',
        'palette':'reports/oct20-palette-storage-integration.json','division_tables':'reports/oct21-boot-initdivtables-integration.json',
        'message_box':'reports/oct20-preinit-wm_msgbox-integration.json','startup_frontier':'reports/oct21-boot-frontier.json',
        'whole_owner_refresh':'reports/oct21-boot-owner-refresh.json','logging_refresh':'reports/oct21-loguru-static-refresh.json',
        'runtime_helper_closure':'reports/oct21-embedded-helper-repair.json'},
    'historical_global_link':{'path':'factory-output/source-first/oct20-source-closure-linked','uniform_current_compilation':False,
        'definition_entries':27925,'blocked_observations':4888,'ambiguous_export_groups':2,
        'note':'Historical import/syntax audit passed; later scope-aware audit found 21 undeclared identifiers. Counts are not playable recovery.'},
    'free_identifier_audits':['reports/oct20-original-free-identifiers.json','reports/oct21-browser-free-identifiers.json'],
    'current_inventory':{key:read('reports/all-blockers.json')[key] for key in (
        'audited_source_units','all_selected_units_audited','raw_definition_observations',
        'raw_emitted_definition_observations','raw_blocked_definition_observations',
        'blocked_definition_records','stable_declaration_identity_records','uniform_compiler_revision_verified')},
    'current_blocker_reports':['reports/all-blockers.json','reports/all-blockers.csv',
        'reports/root-causes.json','reports/dependency-graph.json','reports/boot-blockers.json'],
    'failed_acceptance_checks':acceptance['failed_checks'],'unverified_acceptance_checks':acceptance['unverified_checks'],
    'startup_results':[{'entry':r['entry'],'status':r['status'],'log':r.get('log')}for r in frontier['jobs']],
    'cleanup':{'canonical':read('reports/project-cleanup.json'),'superseded_exports':read('reports/oct21-export-cleanup.json'),
        'total_removed_bytes':int(read('reports/project-cleanup.json')['removed_bytes']+read('reports/oct21-export-cleanup.json')['removed_bytes'])},
    'resume':{'project':'npm run serve:project','bounded_original_startup':'python work/recover_current_boot_frontier.py',
        'full_pipeline':'npm run compile:game','strict_acceptance':'python tools/verify_port_acceptance.py --strict','handoff':'npm run handoff:project'},
    'next_implementation':['Original allocator destruction and error paths: sm::Allocator class ABI and handle_memerr',
        'Internal source storage identity for clip-map tables and SDL mutex; preserve one global owner',
        'OSD registration/callback dependency graph required by baselayer_init',
        'Video enumeration record layout, original helpers and provider closure',
        'Refresh historical emitted modules for current pointer helpers and aggregate initializers',
        'Link original app_main and enginePreInit, then verify original menu, E1L1 and sustained gameplay']}
for name in state['browser_proofs']:assert read(name).get('passed'),name
text=f'''# Current EDuke32 project status

**The original JavaScript game is not yet playable. There is no `dist/index.html`.**

The permanent project launcher is `index.html`. Open `launch-project.cmd`, or run
`npm run serve:project`. It offers builds, tests, strict game checks, continuation
ZIP creation, cleanup preview and saved job output. Chromium desktop/mobile
checks passed. Play remains unavailable until an actual game build exists.

The full compiler/runtime regression run passed 143/144; one original-source
test exceeded its internal time limit. Combining that preserved run with an
accepted retry currently yields {passed}/{len(checks)} passing checks. The reports
retain both attempts and their exact compiler/runtime/test fingerprints.
Any subsequent packaging-only change has separate validation recorded in the
status JSON. These checks do not attest complete original-game behavior.

Implemented and verified in this checkpoint:

- Browser C-string decoding from resizable heap storage, borrowed source pointers
  and source variadic formatting: 256 native/Node/Chromium comparison cases.
- Clang partial-array initializer dependency traversal, shared pointer storage,
  callback imports and deferred static relocation across cyclic modules:
  256 native/Node/Chromium comparison cases, including byte-copy access.
- The original palette pointer table now imports its original engine storage.
  Other palette globals retain their existing ABI. A full newer palette unit is
  saved separately and needs matching consumer updates before integration.
- Original `wm_msgbox` executes through the assembled source modules in Chromium.
- Static C++ method references now retain their exact owning class, including
  header discovery and function addresses: 256 native/Node/Chromium cases.
  The original Loguru signal-options initializer now loads successfully.
- The refreshed original input readers pass 10 Chromium state cases. Browser
  input events reaching the original game loop remain unverified.
- Transitive pointer helpers were restored in 13 saved modules, preserving
  every original emitted byte and export. This repairs helper dependencies;
  it does not recover missing original definitions.
- Original `initdivtables` is integrated and executes twice with 131,064 record
  comparisons, retaining the existing source-owned table objects.
- Windows fragment hashes now match the exact bytes written to disk.
- Obsolete cache/index data and superseded exports removed: 3,421,385,483 bytes
  (3.42 GB). Original source,
  GRP assets, current semantic database and emitted checkpoints were retained.

Original startup still fails acceptance. The bounded recovery report records
the allocator, source-storage, OSD and video dependencies blocking progress.
The current manifest audit covers all 156 selected units and reports 4,843
blocked records (4,870 blocked observations). Only 6,420 definition records have
stable identity evidence; unmatched records remain separate observations.
These are mixed compilation revisions, not a fresh uniform 156-unit rebuild.
There is no verified original menu, level rendering, player control or 60-second
gameplay run. Do not treat independent subsystem tests as game completion.

Read `reports/project-current-status.json`, `reports/oct21-boot-frontier.json`
and `CONTINUE_HERE.md`. The scope-aware identifier audits also expose missing
names in historical output that its older syntax/import audit did not catch.
Resume the same codebase; keep ABI and ownership checks enabled.
'''
(ROOT/'CURRENT_PORT_STATUS.md').write_text(text,encoding='utf-8')
(ROOT/'reports/project-current-status.json').write_text(json.dumps(state,indent=2)+'\n')
(ROOT/'HANDOFF_SNAPSHOT.json').write_text(json.dumps(state,indent=2)+'\n')
print(json.dumps({'regression':state['regression'],'gameplay_verified':False,'startup_results':state['startup_results']},indent=2))
