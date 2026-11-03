# Current EDuke32 continuation status

Updated November 2, 2026. Original `enginePreInit` now completes in a fresh Chromium process and returns **0**. The JavaScript game is **not yet bootable or playable**: original `app_main` has not executed. There is no verified game menu, E1L1 screenshot, playable `dist/index.html` or deployed player.

The canonical project is this directory. The approved release keeps original Build rendering, game logic, CON, actors, weapons, menus and simulation in readable JavaScript. SDL2/platform/audio/timing may use the isolated native WASM services; no original game or Build translation unit is in that WASM module. Classic single-player is selected; desktop features, enhanced rendering and multiplayer are excluded.

## Actual execution

`reports/oct30-original-browser-component.json` records original `engineSetupAllocator` followed directly by original `enginePreInit`, which returns 0 in Chromium without page exceptions. `work/verify_fresh_engine_startup.py` deliberately does not pre-call division, system or mode initialization. The original entry initializes 65,532 divider records and two modes, which the probe verifies afterward. The current component manifest separately checks whether these recorded module/runtime bytes still match; re-run the probe after changing them. This establishes original engine pre-initialization, not app_main, menu rendering or gameplay.

`reports/oct31-original-xxh32-parity.json` verifies 272 native/Node/Chromium streaming checksum cases through original allocation, reset, chunked updates, digest and free. The comparison exposed and corrected numeric heap pointers reaching record fields without Clang-proven typed views, an enum-comment parsing error and adjacent-allocation address decoding. Ordinary dereferences remain bounded.

`reports/nov01-original-softsurface-parity.json` verifies **1,062,912 bytes** of original native/Node/Chromium software-surface output: initialization, palette conversion, scaling, reinitialization and destruction. The original surface now has one state owner and the divider tables have contiguous native storage. This is indexed-pixel conversion, not world rendering or a game screenshot. `work/probe_original_queue.py` also verifies 256 native/Node/Chromium cases of the original circular queue through the browser allocator. `reports/nov01-original-clip-storage.json` verifies original `engineInitClipMaps` updating 61,464 actual owner bytes in Chromium. These are original subsystem functions, not a replacement engine.

`reports/nov01-original-vfs-parity.json` now verifies original `kopen4load`, `kfilelength`, `klseek`, `kread`, `ktell`, `kclose` and `initgroupfile` in Node and Chromium against the original native file routines. Only the raw 44,356,548-byte GRP is mounted by the browser platform. Original code builds its 456-entry directory. All names, terminators and offsets are checked (7,756 bytes); 3,712 sampled file/resource bytes match native execution, including beginning/middle/end reads of E1L1.MAP, PALETTE.DAT, GAME.CON and TILES000.ART in both normal fallback and GRP-first search modes. No game state is populated to bypass initialization. ZIP decompression remains unverified.

Original GenericAllocator methods have 257 native/Node/Chromium cases; allocator startup/wrappers/error handling have 130 under the selected 111-unit configuration. Native SDL service tests separately verify software/indexed presentation, real DOM input, PCM, timing and heap isolation. Complete source SDL surface/event/audio callback adaptation is unfinished. The current engine component uses the JS SDL service table.

## Current compiler and link

`tools/browser_classic_profile.json` is authoritative. Its `boot_module_root` selects the current incremental tree: **29 partial original units**, not a uniform full-program build. `factory-output/source-first/browser-classic/component-manifest.json` records zero missing imports in that partial graph, 65 ambiguous export groups, and an executing `enginePreInit` export and absent `app_main` export. Whole-program linking remains incomplete. Old output directories are migration/history, not interchangeable artifacts.

The actual-fragment storage audit also exposes legacy copies of globals which were absent from selected-export manifests. Inspect `storage_ownership_conflicts` in the component manifest; zero missing imports does not prove correct shared storage. Surface, hash and clipping fragments have been repaired. Engine/console conflicts still require source recompilation and verification. The compiler and installer reject duplicate storage even when it is not re-exported.

Original Make selects 111 units using classic rendering, NOASM and the original GenericAllocator. Six byte-attested source configuration adaptations exclude ALSA, desktop/optional codecs and unused small-pool/thread-cache allocation. Archived source inputs remain intact. All 111 semantic units parse, but indirect-call dataflow, global read/write classification and some template details are explicitly incomplete. Historical counts of emitted/blocked definitions describe earlier configurations and compiler revisions.

A new definition-cursor audit across all 111 units proves 237 uniquely owned external C header functions; 10 ambiguous groups remain excluded. Observing a header prototype does not establish implementation ownership. Original semantic-index declaration identities, actual definition cursors, source bytes, ABI, toolchain and command fingerprints support this contract.

Shared changes include dependency recovery to a bounded fixed point, stable same-TU C ABI bindings, scalar Clang intrinsics, retained explicit member/enum identities, private single-isolate scalar atomics, stable address-taken locals, byte-backed record pointer views, static relocations and source/host memory interoperability. None is a replacement engine or a game-function success stub.

## Regression evidence

The latest full frozen run, `reports/nov02-static-startup-full-regression.json`, attempted 218 tests: 215 passed, two failed by internal timeout and one hit the outer timeout. Same-input isolated confirmation in `reports/nov02-static-startup-confirmed-regression.json` reached 217 passed and one clock-fixture internal timeout. Subsequent shared performance and dependency-worklist fixes pass focused suites in `reports/nov02-closure-performance-regression.json`, `reports/nov02-complete-frontier-regression.json` and `reports/nov02-worklist-final-regression.json`. The clock fixture now states its bounded query budget; separate tests exercise the complete structured frontier. No final complete-suite pass under the latest tools/tests is claimed. See ENGINEERING_CHECKPOINT.md and the generated snapshot for revision matches. Fixture success does not establish gameplay.

The new native comparisons cover inherited byte storage, exact original instance-method dispatch, scoped typedef/reference arguments, default arguments and integer/pointer atomics. Native/Node/Chromium byte-method checks cover 512 cases in full and filtered compilation. Record-array address checks cover 256 cases, including original subarray offsets and complete resulting bytes. Same-TU header values reuse their original owner only with an identical preprocessor dependency fingerprint; changed headers are rejected by integration. Focused reports retain their individual revisions.

`reports/nov02-original-atomic-list-parity.json` verifies original `AtomicSList64::push`, `pop`, `first` and `isEmpty` in 256 native/Node/Chromium cases, including empty pop and original pointer/link order. JavaScript operates on native-constructed snapshots; That snapshot fixture does not test JavaScript construction; later constructor and original console execution proofs are recorded separately below. `reports/nov02-original-atomic-fragment-refresh.json` records exact-hash replacement of the installed original console dependency fragment after the shared helper fixes, without duplicated original globals.

The subsequent atomic adapter correction matches Clang's actual `gnu++14` compare-exchange ordering contract, including the original pop's release/acquire pair. All 24 accepted success/failure combinations have native comparisons; invalid failure orders and pointer/integer alignment remain guarded. `reports/nov02-atomic-pop-regression.json` passes its three affected checks. This helper change postdates the complete 210/211 run; it is not a new full-suite pass. See `reports/nov02-atomic-order-contract.md`.

Shared archive-path fixes include native-sized integer pointees, nested pointer indexing, constructor/record-tag identity, real byte-backed local metadata, bounded POSIX/stdio buffers and resizable-heap string decoding. Named-record C/C++ parity covers 1,024 cases; native-sized integer pointers cover 2,048 results; same-source private arrays cover 512 results. Readable original resume-dispatch lowering matches 10,240 native/JS resumptions and retains authored loops and named labels. This does not establish original ZIP-decoder parity.

The later shared layout fixes pass **16/16** affected regressions in `reports/oct31-layout-final-regression.json`. They add Clang C record support, one typed field path for reads/addresses/updates, exact same-TU foreign-field bindings, template identity reconciliation and native global storage at the original owner. Native checks cover 512 C-record cases in Node/Chromium, 512 cross-unit global-address cases and 1,280 original menu-header calculations. These are storage and function comparisons, not a rendered menu. The rebuilt scalar libdivide utility now explicitly compiles the bundled header's original C11 interface.

## Immediate boot blocker

Original console initialization now executes in Chromium. `reports/nov02-original-console-chromium.json` verifies actual `OSD_Init`, log-node construction/draining, printing, command registration/dispatch and alias expansion, with two inspected command callbacks and no page exceptions. No original implementation is replaced. This is console execution, not engine startup or gameplay. Recheck its recorded module/runtime fingerprints after graph changes.

The compiler recovers the original CircularQueue destructor from its exact template pattern and uses Clang's typed enum spelling. Ordinary overloaded, const/nonconst and static methods have type-selected names; zero-argument reference-return methods preserve aliases. Separate Clang-proven projections expose existing nontrivial fields and one nonvirtual base at offset zero. Exact original method bodies can borrow those bytes. These views grant no construction, copying, assignment, destruction, virtual dispatch or multiple-inheritance semantics.

Selected original single-base constructors now initialize native byte storage in place, including original default member initializers and `std::atomic<int>`. Trivial destruction is required; copies, multiple/virtual inheritance and nontrivial inherited destruction remain unsupported. Native/Node/Chromium comparisons cover 1,536 constructor results, 512 while-condition results and 512 integer function-address results. The exact original log-node record also passes 256 comparisons. Read `reports/nov02-constructor-frontier.md` for scope and current evidence.

Original `enginePreInit` and `baselayer_init` now link and the fresh original entry executes successfully. Desktop monitor-selection registration is excluded by an attested browser-only source guard; its native branch remains byte-identical. Continue through original `app_main` and its actual dependency frontier. Original `timer.cpp` state must also initialize: host `timerInit` alone does not establish original clock globals. The browser outer loop still needs source-preserving frame yielding. Do not populate missing game state to bypass initialization.

The public `npm run compile:game` interface exists, but it does not yet construct/promote a verified playable candidate from the incremental component. Complete that integration and the native/browser menu, E1L1, 60-second gameplay, audio, collision, progression, save/load and offline checks before publishing.

## Reproducible continuation

```powershell
. work/session-env.ps1
npm run status:component
python work/recover_boot_reachable.py source/duke3d/src/game.cpp app_main
python work/verify_fresh_engine_startup.py
```

The fresh startup verification now passes; it is not the whole-game acceptance test. Heavy original Clang jobs must remain serial on this memory-constrained host. Raw AST caches include actual source/header/configuration/toolchain content fingerprints; they do not authorize reuse of mismatched JS artifacts. The ABI is `source-lp64-addresses/2`.

The session environment limits retained AST caches to 128 MiB per cache directory. Cleanup retains original source, assets and semantic data. Current implementation checkpoints are pushed to NullNRG/eduke32-readable-js; consult Git history for the exact revision.

The fresh selected semantic index has fingerprint `b801d9e2b82229629ddaa6e5276a35396458b2a6526ecc0cc11599eefaf93058`, with all 111 units parsed. The compact logical export at `reports/semantic-browser-checkpoint/index.jsonl.gz` must match this fingerprint before packaging. The generated snapshot records the export/restoration verification separately; do not delete the saved previous SQLite until the new continuation and independent restore are verified.

`python work/package_current_continuation.py` creates a compact private continuation with current source/compiler/runtime/tests/modules, original source, supplied GRP, semantic export and evidence. It excludes downloaded SDKs, raw AST caches and redundant staging/debug output. It verifies every ZIP payload SHA-256. This archive is a development checkpoint, not a playable game. Configure dependencies using BUILD_PORTABILITY.md and BROWSER_SERVICES.md.

Machine-readable state: HANDOFF_SNAPSHOT.json and reports/project-current-status.json. Public source: https://github.com/NullNRG/eduke32-readable-js. Keep GRPs, embedded-asset HTML, caches and toolchains private.

`reports/nov02-original-player-storage.json` verifies the original header-defined player array in Node and Chromium against an independent Clang layout: 17 packed records, 133 bytes each, one 2,261-byte allocation, original zero initialization and the sentinel-preserving g_player offset. `work/rebuild_storage_fragment.py` requires exact prior fragment bytes, unchanged original declaration identities/types/layouts and no duplicate storage; activation is in a fresh runtime.


The developer launcher now opens an actual original-engine diagnostic, runs fresh Chromium verification and resumes app_main dependency recovery. See ENGINEERING_CHECKPOINT.md for the 116-reference bounded app_main frontier, verified shared input/union lowering, and remaining provider/goto blockers. Launcher screenshots are diagnostic evidence only.


Latest shared recovery: packed anonymous typedef assignment and exact selected union initialization pass native/Node/Chromium comparisons. The original input functions advance to missing dependencies, and the separate bounded G_DrawRooms probe reports no semantic blockers. Original app_main remains unlinked (116 direct references in its latest bounded attempt); G_HandleLocalKeys exposes a legal cross-scope goto case. See ENGINEERING_CHECKPOINT.md, reports/nov02-game-provider-frontier.json and the live full-regression report reports/nov02-engine-launcher-full-regression.json.
