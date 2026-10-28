"""Freeze the verified reference lowering and actual remaining startup failures."""
import argparse,hashlib,json,sys
from datetime import datetime,timezone
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'tools'))
from source_first_automate import fingerprint
def read(name):return json.loads((ROOT/name).read_text())
parser=argparse.ArgumentParser();parser.add_argument('--regression',default='reports/oct19-cpp-references-regression.json');parser.add_argument('--build',default='oct19-reference-host-recovery');args=parser.parse_args()
regression=read(args.regression)
assert regression['complete'] and regression['all_passed'] and regression['regression_inputs_unchanged']
for name,expected in regression['regression_inputs'].items():assert hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==expected,name
current=read('factory-output/source-first/'+args.build+'/recovery-report.json')
fp=fingerprint(ROOT/'factory-output/compile_commands.json',ROOT/'factory-output/source-tree/eduke32-master',[])
assert current['compiler_revision_attestation']['verified'] and current['compiler_revision_attestation']['end_fingerprint']==fp
frontier=[]
for batch in current['batch_results']:
 folder=(ROOT/'factory-output/source-first'/args.build/batch['manifest']).parent
 for source in batch['sources']:
  manifest=read((folder/(source+'.manifest.json')).relative_to(ROOT))
  for row in manifest['definitions']:
   if row.get('source_name') in ('add_callback','remove_callback','add_file','s_mutex','s_callbacks','engineSetLogFile','engineSetupLogging','engineLogCallback') or 'lock_guard<' in row.get('source_name',''):
    frontier.append({'source':source,**row})
proof=read('reports/oct16-cpp-references-parity.json');game=read('reports/browser-gameplay-attempt.json')
latest_link=read('factory-output/source-first/oct19-reference-host-linked/global-recovery.json')
latest_input=read('factory-output/source-first/oct19-reference-host-link-input/recovery-report.json')
report={'format':'canonical-sourcefactory-status/4','updated_utc':datetime.now(timezone.utc).isoformat(),
 'compiler_sha256':regression['compiler_frontend_sha256'],'current_compiler_fingerprint':fp,
 'current_recompiled_units':current['verified_batch_units'],'current_emitted_definition_entries':current['readable_definitions'],
 'current_blocked_definition_entries':current['blocked_definitions'],'current_regression_counts':regression['counts'],
 'all_current_regression_inputs_unchanged':True,'current_regression_report':args.regression,
 'reference_native_chromium_proof':proof,'startup_frontier':frontier,'strict_game_gate':game,
 'historical_link_report':'factory-output/source-first/oct16-array-members-linked/global-recovery.json',
 'historical_link_revalidated_at_current_revision':False,'uniform_156_unit_current_revision':False,
 'latest_bounded_link':{key:latest_link[key] for key in ('module_emitted_definition_entries','total_blocked_definitions','ambiguous_export_names','invalid_imports_or_syntax','recovery_round_limit','full_game_linked')},
 'saved_link_work_reuse':{key:latest_input[key] for key in ('saved_verified_link_overlays','rejected_incompatible_saved_link_overlays')},
 'original_gameplay_verified':False,'offline_playable_index_present':(ROOT/'dist/index.html').is_file()}
text=f'''# EDuke32 SourceFactory — current continuation status

**NOT BOOTABLE OR PLAYABLE. No original-game dist/index.html exists.**

Implemented generic source C++ lvalue references: scalar and pointer arguments, local aliases, returned lvalues, const scalar temporary storage, stable addressed local/global storage and single evaluation of reference arguments. Borrowed reference members now retain aliases through source constructors and destructors. Namespace-qualified concrete template identities are preserved. The original standard-library lock_guard constructor/destructor is translated from Clang AST; it is not a logging stub.

Native C++ versus Node and Chromium: 512 cases and {proof['compared_values']:,} compared values, plus 512 cross-unit reference cases. Trivial reference scopes also preserve original aliases through Clang-validated goto edges and shadowed declarations. The linker rejects both a new reference caller with an incompatible old provider and an old caller lacking the new provider's reference contract. Compiler/cache fingerprints include the new reference semantics module and host runtime modules.

The host C heap now grows a resizable ArrayBuffer without replacing its identity. Bounded views can be borrowed from live allocations; compiled source record/array-field views stay valid after independent allocations grow the heap. Another 512 native/Chromium cases compare 1,536 values and verify shared source/host writes and rejection of new borrowing after free. This does not complete source-pointer/integer address conversion, ownership bridging or the original game allocators.

Current full compiler regression: {regression['counts']['passed']}/{regression['selected_tests']} passed with all input hashes unchanged. Report: {args.regression}. These are compiler/runtime tests, not original gameplay.

Current affected source compilation: {current['verified_batch_units']} units (logging, baselayer, engine, scripts, network, audio and input), {current['readable_definitions']} emitted and {current['blocked_definitions']} blocked entries, zero failed units and {current['invalid_imports']} invalid imports. Fingerprint: {fp}. This is not a fresh uniform 156-unit build.

Original Loguru's lock_guard<std::recursive_mutex> is now source-first emitted. Its callback registration remains blocked by Callback/string temporary lifetime, std::recursive_mutex and vector/iterator semantics. Original engineSetLogFile, engineLogCallback and engineSetupLogging remain blocked by their recorded dependencies. The original smmalloc/mimalloc allocators, OSD queue/lifetime, native pointer/address bridging and engine startup/render/gameplay closure are still incomplete.

Latest bounded whole-program audit: {latest_link['total_blocked_definitions']} blocked observations, {len(latest_link['ambiguous_export_names'])} ambiguous factory groups and {len(latest_link['invalid_imports_or_syntax'])} invalid import/syntax issues. It reuses actual hash-attested historical link work only when current provider/storage/reference ABI checks accept it. Incompatible saved recoveries are explicitly rejected. Reports/all-blockers.json and reports/boot-blockers.json describe this mixed-revision scope. The recorded {latest_link['recovery_round_limit']} recovery round(s) are a bounded audit, not a completed fixed point. The preserved 12-unit array-storage epoch and older complete 156-unit epochs retain their original fingerprints; none is relabeled as current.

Historical original-entry offline diagnostic: real DUKE3D.GRP mounts (456 files, E1L1 present), original app_main enters, original G_ExtPreInit returns, then ReferenceError: engineSetLogFile is not defined. That diagnostic has not advanced to the menu or a level.

Strict original-game acceptance: FAILED_MISSING_ORIGINAL_GAME_HTML. No menu, E1L1 gameplay, movement/jumping/shooting, enemies/collision, audio, save/load, 60-second gameplay or native full-engine comparison is verified. No WASM, CPU emulator, replacement game or missing-function success stub has been added.

Resume after dot-sourcing work/session-env.ps1 (adapt recorded toolchain paths on another host):

```text
python tools/source_first_automate.py --out factory-output/source-first/{args.build} --max-units {current['verified_batch_units']} --jobs 1 --batch-size 1 --timeout 300 --priority-file work/cpp-reference-boot-priorities.json --persistent-ast-cache --ast-cache-shards 2 --no-global-link --resume
python tools/verify_recovery_suite.py --jobs 1 --timeout 240 --report reports/resumed-regression.json
npm run test:browser-game
```

Next engineering frontier: original recursive_mutex services, Callback/string/vector lifetime, OSD and original allocators. Recompile affected providers and consumers before mixing source epochs; enforce reference and native storage ABI checks in both directions. Full original startup/gameplay still requires engineering work.
'''
(ROOT/'reports/oct16-current-status.json').write_text(json.dumps(report,indent=2)+'\n')
for name in ('reports/oct16-current-status.md','CURRENT_PORT_STATUS.md'):(ROOT/name).write_text(text)
print(json.dumps({'regression':regression['counts'],'current_units':current['verified_batch_units'],'compiler_fingerprint':fp,'gameplay_verified':False}))
