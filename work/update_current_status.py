"""Write current factual status from committed build and browser evidence."""
import hashlib,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def read(name):return json.loads((ROOT/name).read_text())
checkpoint=read('factory-output/source-first/oct15-heap-pointer-recovery/checkpoint.json')
regression=read('reports/oct15-allocator-storage-regression.json')
entry=read('reports/oct15-original-entry-attempt-chromium.json')
old=read('factory-output/source-first/oct15-world-recovery/recovery-report.json')
current_count=len(checkpoint['batch_cache']);fp=checkpoint['fingerprint']
report=f'''# Current canonical EDuke32 JavaScript port status

The original game has **not booted**. There is no playable dist/index.html.
The original game entry executes in an explicitly unlinked offline diagnostic,
then stops at engineSetLogFile. No game menu, level or gameplay is verified.

## Actual browser execution

The latest dist/original-entry-attempt.html embeds 64 real JavaScript modules
and the supplied DUKE3D.GRP. Its SHA-256 is {entry['page_sha256']}.
Chromium {entry['browser_version']} observed, without network requests:

```text
Actual DUKE3D.GRP mounted: 456 files; E1L1.MAP=true
ENTER original game.cpp::app_main(1, ["eduke32"])
ENTER original G_ExtPreInit
RETURN original G_ExtPreInit
STOP: ReferenceError: engineSetLogFile is not defined
```

See reports/oct15-original-entry-attempt-chromium.json and its screenshot.
Original G_ExtPreInit changes the real browser virtual filesystem directory and
search paths. The entry diagnostic retains the actual compiler-lowered body
before missing-import pruning. Its production manifest remains blocked.
Unproven ABI cells remain absent. No missing-function stubs are installed.
This is an execution diagnostic, not game boot or an acceptance-test substitute.

## Implemented and verified in this continuation

- LP64 pointer arrays have contiguous eight-byte slots, string/null and callable
  identities, pointer-to-pointer access, byte-cast aliases and memcpy semantics.
  Native differential tests compare 2,560 values in 512 cases. Cross-TU array
  imports now reject older storage and mismatched extents explicitly.
- Standalone standard C++ scalar/array allocation and eligible source-class
  lifetimes execute original constructors/destructors and preserve this identity.
  Native differential tests compare 3,584 values in 512 cases. The captured game
  overrides global new/delete, so this standalone backend is deliberately not
  used as a replacement for its original unresolved allocator implementations.
- Ten original strong global allocation operators, previously omitted because
  their definitions live in mimalloc-new-delete.h, now have exact physical body
  hashes, including-TU ownership and stable Clang-mangled overload identities.
  Native differential tests compare 2,048 values in 512 cases. Their mi_* inputs
  in the differential fixture are instrumentation only, never game providers.
  Original OSD_Puts now refers to the exact same allocation-provider identity.
  The actual game operators remain blocked on original mi_* dependencies.
- The original engineVerbosityCallback now runs against the existing browser
  module's callback storage. Native/Node and native/Chromium comparisons pass
  512 cases each, both standalone and integrated. No duplicate global state.
- Source-module fragments can import proven existing providers and append real
  re-exports after symbol and storage ABI validation. Chromium evaluates all
  154 active source modules with zero exceptions; the ESM graph has 985 imports
  linked across 158 total modules. These checks do not establish gameplay.

Current regression report: reports/oct15-allocator-storage-regression.json.
Snapshot counts: {regression['counts']}; complete={regression['complete']};
all_passed={regression['all_passed']}.
The previous same-session revision passed all 127 checks with unchanged inputs
(reports/oct15-heap-pointer-regression.json). The newest revision adds the
original allocator identity/parity test and extends pointer-array ABI checks.

## Preserve the distinct compiler epochs

Historical full Make-selected scan: 156/156 at
0872800903cdbfdf9daf56c9a809f45891602978270135f144fd7c204bf9b1cf,
with {old['readable_definitions']} emitted and {old['blocked_definitions']} blocked
entries. Those entries are not unique linked recovered gameplay functions.
The frozen comprehensive reports retain their historical revision explicitly.
Only 6,284 declarations had stable identity evidence in that frozen audit; there
is no verified 90-percent historical recovery comparison.

An intermediate pointer-array scan processed 6/156 units. The latest full rebuild
is in factory-output/source-first/oct15-heap-pointer-recovery. At this status
snapshot {current_count}/156 units are committed at {fp}. Its source outputs are
not yet a globally linked game. Read its final recovery report when complete.
Do not label older full coverage as a full attempt under the newest compiler.

The interrupted older global linker saved round 4 and 39 hash-attested recovered
units in oct15-world-linked/link-checkpoint.json. Its worker was stopped before
compiler changes. The saved work remains included as historical recovery;
there is no claim that the complete staged graph or app_main was linked.

## Exact acceptance failures

The strict game test reports FAILED_MISSING_ORIGINAL_GAME_HTML. Failed checks:
uniform_selected_unit_attempts, complete_source_semantics,
startup_dependency_closure, linked_javascript_integrity,
reachable_gameplay_recovery and self_contained_offline_game. Its default artifact
roots are older; the independent historical 156-unit attestation above remains
valid but does not satisfy current game acceptance.

Historical recovery ninety percent, original browser gameplay, native engine
comparison and reproducible one-command game build remain unverified.
No original menu, E1L1 loading, movement, jumping, weapons, enemies, collision,
audio, save/load or 60-second browser gameplay test has passed. Native executable
screenshots and separate framebuffer/geometry tests are reference evidence only.

## Immediate original implementation frontier

engineSetLogFile needs Loguru callback/file services, original callback state and
engineLogCallback. Loguru still requires recursive_mutex/lock_guard lifetime,
vector/iterator, lambda, string and file-service semantics. OSD_Init needs its
complete osdmain_t layout plus nontrivial queue/atomic-object initialization;
OSD_Puts needs original allocation and AtomicLogString behavior. Original mi_new
still needs mi_heap_alloc_new; mi_new_nothrow needs mi_malloc/mi_try_new.
reports/oct15-current-partial-frontier.json records fresh committed evidence.

Complete source heap/browser memory bridging, nontrivial class subobjects,
contiguous record arrays, nested goto/lambda renderer paths, original game/CON
closure, map/resource I/O and cooperative browser scheduling remain incomplete.
Fix shared semantics and recompile affected units; never add no-op providers.

## Reproduce and resume

On the original host, dot-source work/session-env.ps1. Avoid starting a second
writer if the newest rebuild is still running. The authorized local worker in
reports/oct15-heap-pointer-queued-link.json waits for this rebuild, then runs
linking, original boot auditing and the strict game gate. That worker does not
automatically implement additional missing C++ semantics. Process IDs are host
specific. Its persistent checkpoints are
reusable with the following command:

```text
python tools/source_first_automate.py --out factory-output/source-first/oct15-heap-pointer-recovery --jobs 2 --batch-size 1 --timeout 300 --priority-file work/heap-pointer-priorities.json --persistent-ast-cache --ast-cache-shards 2 --no-global-link --resume
python tools/source_first_global_link.py --directory factory-output/source-first/oct15-heap-pointer-recovery --out factory-output/source-first/oct15-heap-pointer-linked --rounds 4 --retry-budget 12 --jobs 2 --timeout 180 --persistent-ast-cache --resume
python tools/verify_recovery_suite.py --jobs 1 --timeout 240 --report reports/resumed-regression.json
npm run test:browser-game
```

Recreate only the diagnostic with tools/capture_original_entry_attempt.py,
tools/build_original_entry_attempt_html.py and
tests/source_factory/verify_original_entry_attempt.py. That diagnostic must
never be renamed index.html or counted as game completion.

The compact continuation ZIP preserves original archives/source/GRP, actual
compiler/runtime/tests, old verified full coverage, saved linker recovery,
current committed output and checksum-bound evidence. It excludes installed
toolchains, node_modules, raw AST caches, the 2.6 GB SQLite index and old pages.
No WASM or instruction emulator is shipped.
'''
(ROOT/'reports/oct15-current-status.md').write_text(report)
(ROOT/'CURRENT_PORT_STATUS.md').write_text(report)
print('Updated factual status:',current_count,'committed units;',regression['counts'])
