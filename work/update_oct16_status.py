"""Record completed source/compiler checks and the exact unsuccessful game gates."""
import hashlib,json
from datetime import datetime,timezone
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def read(name):return json.loads((ROOT/name).read_text())
def write(name,text):
 p=ROOT/name;t=p.with_suffix('.partial');t.write_text(text);t.replace(p)
def main():
 compile=read('factory-output/source-first/oct16-array-members-recovery/recovery-report.json')
 regression=read('reports/oct16-array-members-regression-pointer-fields.json')
 linker=read('factory-output/source-first/oct16-array-members-linked/global-recovery.json')
 boot=read('reports/oct16-original-boot-audit.json');game=read('reports/browser-gameplay-attempt.json')
 assert compile['verified_batch_units']==12 and compile['compiler_revision_attestation']['verified']
 assert regression['complete'] and regression['all_passed'] and regression['regression_inputs_unchanged']
 for name,expected in regression['regression_inputs'].items():assert hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==expected,name
 entry=read('reports/oct15-original-entry-attempt-chromium.json')
 frontier=[]
 for source,names in {'source/build/src/baselayer.cpp':['engineSetLogFile','engineLogCallback','engineSetupAllocator','engineSetupLogging'],
  'source/build/src/osd.cpp':['OSD_Init','OSD_Puts'],'source/build/src/loguru.cpp':['add_callback','remove_callback','add_file','s_mutex','s_callbacks'],
  'source/duke3d/src/game.cpp':['app_main','G_MaybeAllocPlayer'],'source/mimalloc/src/alloc.c':['mi_new','mi_new_nothrow','mi_free']}.items():
  path=ROOT/'factory-output/source-first/oct16-array-members-linked'/(source+'.manifest.json')
  if path.exists():
   for row in json.loads(path.read_text()).get('definitions',[]):
    if row.get('source_name',row['name']) in names:frontier.append({'source':source,**row})
 report={'format':'canonical-sourcefactory-status/3','updated_utc':datetime.now(timezone.utc).isoformat(),'compiler_sha256':regression['compiler_frontend_sha256'],
  'current_compiler_fingerprint':compile['compiler_revision_attestation']['end_fingerprint'],'current_recompiled_units':12,
  'current_emitted_definition_entries':compile['readable_definitions'],'current_blocked_definition_entries':compile['blocked_definitions'],
  'current_regression_counts':regression['counts'],'all_current_regression_inputs_unchanged':True,
  'incremental_link_summary':{k:v for k,v in linker.items() if k not in ('remaining','recovery_attempts')},
  'startup_frontier':frontier,'boot_summary':boot['summary'],'strict_game_gate':game,'original_entry_diagnostic':entry['result'],
  'original_gameplay_verified':False,'offline_playable_index_present':(ROOT/'dist/index.html').is_file()}
 write('reports/oct16-current-status.json',json.dumps(report,indent=2)+'\n')
 original=read('reports/oct16-original-player-array-parity.json');semantic=read('reports/semantic-continuation/summary.json')
 lines=['# EDuke32 SourceFactory continuation — 2026-10-16','','**NOT PLAYABLE. No verified original-game dist/index.html exists.**','',
  'Implemented in the canonical compiler: contiguous ordinary POD storage; exact Clang-derived bitfields; nested record-array, pointer-array and multidimensional scalar array fields; pointer-to-pointer strides, dereference, address identity and slot byte copies. Original functions are never counted as recovered solely because their syntax was emitted.','',
  f"Current regression: {regression['counts']['passed']}/{regression['selected_tests']} passed, complete, with all compiler/runtime/test input hashes unchanged. Report: reports/oct16-array-members-regression-pointer-fields.json.",'',
  'Native and Chromium checks use unchanged original DukePlayer_t, P_AddAmmo and P_PalFrom. The 640-byte original savegame layout, vector-array storage, ammo clamping, palette mutation and byte copies agree for 1,024 compared values. These are original-source component checks; they do not validate movement, a level or gameplay.','',
  f"Current affected-unit compilation: 12 verified units, {compile['readable_definitions']} emitted and {compile['blocked_definitions']} blocked definition entries, zero failed units and {compile['invalid_imports']} invalid imports. All 12 share fingerprint {compile['compiler_revision_attestation']['end_fingerprint']}. The historical complete scan has 156/156 verified units, 27,760 emitted and 4,905 blocked entries under its older revision. These are different scopes and must not be used as a direct recovery percentage.",'',
  'The incremental linker input explicitly combines these 12 current units with 144 independently hash-attested historical units. It is not uniform compilation under the new revision. All original provider, storage ABI, ownership and fixed-point rejection checks remain enabled.','',
  f"Linked inventory: {linker.get('total_blocked_definitions')} blocked definition entries; {len(linker.get('ambiguous_export_names',{}))} ambiguous export groups; {len(linker.get('invalid_imports_or_syntax',[]))} invalid imports/syntax. Full game linked: {linker.get('full_game_linked')}. Full details: factory-output/source-first/oct16-array-members-linked/global-recovery.json.",'',
  'The link audit is bounded by its recorded round and retry budgets; deferred proposals do not count as a completed fixed point. The source-type factory ambiguity groups and invalid import list remain explicit in the global report and blocker reports.','',
  'Actual saved offline Chromium entry execution: real DUKE3D.GRP mounted (456 files, E1L1 present); original app_main entered; original G_ExtPreInit returned; execution stopped at ReferenceError: engineSetLogFile is not defined. This earlier diagnostic was not rebuilt with the new storage compiler and is not the game deliverable. No original menu or level has booted.','',
  'The current original global.cpp module also evaluates successfully in Node and Chromium: 994 exports, 16 original player slots, correctly zero-initialized player pointers and no exceptions. This verifies that source unit only; original engine service initialization and gameplay remain unverified.','',
  'Host-memory bridging remains incomplete: runtime/abi.mjs exposes numeric addresses and replaces its ArrayBuffer on growth, while source lowering uses verified LP64 layouts and bounded native views. A complete original-pointer/address/ownership bridge must preserve aliases across allocation, reallocation, host calls and buffer growth. Do not substitute the standalone heap for the game allocator.','',
  'The remaining startup frontier includes original Loguru C++ mutex/lock_guard, vector/string/iterator/lambda and object lifetime semantics; OSD queue/atomic objects; original smmalloc/mimalloc allocation and native address-space operations; enginePreInit/app_main closure; original rendering, scripts, map/resource loading, browser scheduling, input, audio and save/load integration. The new compiler removes the DukePlayer_t layout failure from G_MaybeAllocPlayer; its original source dependencies still require linking.','',
  f"Strict original game test: {game['status']}. Failed acceptance checks: "+', '.join(game.get('failed_acceptance_checks',[]))+'.',
  'Unverified acceptance checks: '+', '.join(game.get('unverified_acceptance_checks',[]))+'.','',
  'The default strict gate also inspects older canonical artifact roots. The independent current-unit and historical full-coverage reports above remain valid, but none proves current whole-game acceptance. No browser menu, E1L1, player movement/jumping/shooting, enemies, collision, audio, save/load, 60-second gameplay, native full-engine parity or reproducible complete offline game build has passed.','',
  f"Compact semantic metadata: {semantic['declaration_records']:,} actual saved Clang declaration records, {semantic['compressed_bytes']:,} bytes compressed, from a database with 156 parsed units. This is an independent historical semantic epoch; complete indirect-call dataflow and global reads/writes remain incomplete. The large SQLite database and raw AST caches are omitted from the handoff. The exported USRs are used only for uniquely matched blocker identities; unmatched declarations remain explicitly marked.",'',
  'Reports: reports/all-blockers.json and .csv, root-causes.json, dependency-graph.json, boot-blockers.json. These describe the mixed-revision linked inventory and preserve uncertainty. They do not claim 90% historical recovery.','',
  '## Deterministic resume','',
  'On the original host, dot-source work/session-env.ps1. On another host restore the locked Python/Node/Clang/sysroot dependencies and adapt recorded host paths. Source archives, original source, GRP, compiler/runtime, tests, complete historical and current affected-unit artifacts are preserved. Run:','',
  '```text',
  'python tools/source_first_automate.py --out factory-output/source-first/oct16-array-members-recovery --max-units 12 --jobs 2 --batch-size 1 --timeout 300 --priority-file work/array-members-priorities.json --persistent-ast-cache --ast-cache-shards 2 --no-global-link --resume',
  'python work/compose_oct16_link_input.py',
  'python tools/source_first_global_link.py --directory factory-output/source-first/oct16-incremental-link-input --out factory-output/source-first/oct16-array-members-linked --rounds 4 --retry-budget 12 --jobs 2 --timeout 180 --persistent-ast-cache --resume',
  'python tools/verify_recovery_suite.py --jobs 1 --timeout 240 --report reports/resumed-regression.json',
  'npm run test:browser-game',
  '```','',
  'The strict game test must keep failing until independently verified original gameplay works. No WebAssembly, machine emulator, substitute game, fabricated source owner, allocator bypass or success stub has been added.']
 text='\n'.join(lines)+'\n';write('reports/oct16-current-status.md',text);write('CURRENT_PORT_STATUS.md',text)
 print(json.dumps({k:v for k,v in report.items() if k not in ('startup_frontier','incremental_link_summary','original_entry_diagnostic')},indent=2))
if __name__=='__main__':main()
