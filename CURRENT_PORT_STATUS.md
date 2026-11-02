# Current EDuke32 continuation status

Updated November 2, 2026. The original JavaScript game is **not bootable or playable**. Original `enginePreInit` and `app_main` have not executed. There is no verified game menu, E1L1 screenshot, playable `dist/index.html` or deployed player.

The canonical project is this directory. The approved release keeps original Build rendering, game logic, CON, actors, weapons, menus and simulation in readable JavaScript. SDL2/platform/audio/timing may use the isolated native WASM services; no original game or Build translation unit is in that WASM module. Classic single-player is selected; desktop features, enhanced rendering and multiplayer are excluded.

## Actual execution

`reports/oct30-original-browser-component.json` records original `engineSetupAllocator`, `initdivtables`, `initsystem` and `videoGetModes` executing in Chromium. It verifies 65,532 original divider records and two modes sorted by the original comparator. The current component manifest separately checks whether these recorded module/runtime bytes still match; re-run the probe after changing them. These component calls do not establish engine startup.

`reports/oct31-original-xxh32-parity.json` verifies 272 native/Node/Chromium streaming checksum cases through original allocation, reset, chunked updates, digest and free. The comparison exposed and corrected numeric heap pointers reaching record fields without Clang-proven typed views, an enum-comment parsing error and adjacent-allocation address decoding. Ordinary dereferences remain bounded.

`reports/nov01-original-softsurface-parity.json` verifies **1,062,912 bytes** of original native/Node/Chromium software-surface output: initialization, palette conversion, scaling, reinitialization and destruction. The original surface now has one state owner and the divider tables have contiguous native storage. This is indexed-pixel conversion, not world rendering or a game screenshot. `work/probe_original_queue.py` also verifies 256 native/Node/Chromium cases of the original circular queue through the browser allocator. `reports/nov01-original-clip-storage.json` verifies original `engineInitClipMaps` updating 61,464 actual owner bytes in Chromium. These are original subsystem functions, not a replacement engine.

`reports/nov01-original-vfs-parity.json` now verifies original `kopen4load`, `kfilelength`, `klseek`, `kread`, `ktell`, `kclose` and `initgroupfile` in Node and Chromium against the original native file routines. Only the raw 44,356,548-byte GRP is mounted by the browser platform. Original code builds its 456-entry directory. All names, terminators and offsets are checked (7,756 bytes); 3,712 sampled file/resource bytes match native execution, including beginning/middle/end reads of E1L1.MAP, PALETTE.DAT, GAME.CON and TILES000.ART in both normal fallback and GRP-first search modes. No game state is populated to bypass initialization. ZIP decompression remains unverified.

Original GenericAllocator methods have 257 native/Node/Chromium cases; allocator startup/wrappers/error handling have 130 under the selected 111-unit configuration. Native SDL service tests separately verify software/indexed presentation, real DOM input, PCM, timing and heap isolation. Complete source SDL surface/event/audio callback adaptation is unfinished. The current engine component uses the JS SDL service table.

## Current compiler and link

`tools/browser_classic_profile.json` is authoritative. Its `boot_module_root` selects the current incremental tree: **22 partial original units**, not a uniform full-program build. `factory-output/source-first/browser-classic/component-manifest.json` records zero missing imports in that partial graph, 57 ambiguous export groups, and absent `enginePreInit`/`app_main` exports. Whole-program linking remains incomplete. Old output directories are migration/history, not interchangeable artifacts.

The actual-fragment storage audit also exposes legacy copies of globals which were absent from selected-export manifests. Inspect `storage_ownership_conflicts` in the component manifest; zero missing imports does not prove correct shared storage. Surface, hash and clipping fragments have been repaired. Engine/console conflicts still require source recompilation and verification. The compiler and installer reject duplicate storage even when it is not re-exported.

Original Make selects 111 units using classic rendering, NOASM and the original GenericAllocator. Five byte-attested source configuration adaptations exclude ALSA, desktop/optional codecs and unused small-pool/thread-cache allocation. Archived source inputs remain intact. All 111 semantic units parse, but indirect-call dataflow, global read/write classification and some template details are explicitly incomplete. Historical counts of emitted/blocked definitions describe earlier configurations and compiler revisions.

A new definition-cursor audit across all 111 units proves 237 uniquely owned external C header functions; 10 ambiguous groups remain excluded. Observing a header prototype does not establish implementation ownership. Original semantic-index declaration identities, actual definition cursors, source bytes, ABI, toolchain and command fingerprints support this contract.

Shared changes include dependency recovery to a bounded fixed point, stable same-TU C ABI bindings, scalar Clang intrinsics, retained explicit member/enum identities, private single-isolate scalar atomics, stable address-taken locals, byte-backed record pointer views, static relocations and source/host memory interoperability. None is a replacement engine or a game-function success stub.

## Regression evidence

`reports/nov01-vfs-final-full-regression.json` passes **207/207** for the earlier frozen source-I/O checkpoint. Its fingerprints no longer match the new compiler/helper changes. The complete frozen run in `reports/nov02-method-full-regression.json` passes **210/211**; its sole failure expected every source range to be removed. The corrected AST-stream test checks preserved class/method spans against the same Clang dump and passes, along with four related checks, in `reports/nov02-corrected-stream-regression.json`. Compiler/runtime bytes did not change between these runs; only that test changed. A subsequent all-211 frozen pass is not claimed. Fixture success does not verify gameplay.

The new native comparisons cover inherited byte storage, exact original instance-method dispatch, scoped typedef/reference arguments, default arguments and integer/pointer atomics. Native/Node/Chromium byte-method checks cover 512 cases in full and filtered compilation. Record-array address checks cover 256 cases, including original subarray offsets and complete resulting bytes. Same-TU header values reuse their original owner only with an identical preprocessor dependency fingerprint; changed headers are rejected by integration. Focused reports retain their individual revisions.

`reports/nov02-original-atomic-list-parity.json` verifies original `AtomicSList64::push`, `first` and `isEmpty` in 256 native/Node/Chromium cases. JavaScript operates on native-constructed snapshots; neither JavaScript construction nor `pop` nor console startup is established. `reports/nov02-original-atomic-fragment-refresh.json` records exact-hash replacement of the installed original console dependency fragment after the shared array-address fix, without duplicated original globals.

Shared archive-path fixes include native-sized integer pointees, nested pointer indexing, constructor/record-tag identity, real byte-backed local metadata, bounded POSIX/stdio buffers and resizable-heap string decoding. Named-record C/C++ parity covers 1,024 cases; native-sized integer pointers cover 2,048 results; same-source private arrays cover 512 results. Readable original resume-dispatch lowering matches 10,240 native/JS resumptions and retains authored loops and named labels. This does not establish original ZIP-decoder parity.

The later shared layout fixes pass **16/16** affected regressions in `reports/oct31-layout-final-regression.json`. They add Clang C record support, one typed field path for reads/addresses/updates, exact same-TU foreign-field bindings, template identity reconciliation and native global storage at the original owner. Native checks cover 512 C-record cases in Node/Chromium, 512 cross-unit global-address cases and 1,280 original menu-header calculations. These are storage and function comparisons, not a rendered menu. The rebuilt scalar libdivide utility now explicitly compiles the bundled header's original C11 interface.

## Immediate boot blocker

The console probe now lowers `osdmain_t` field views and original atomic-list push/load/compare-exchange bodies. Its direct remaining semantic failure is `AtomicLogString` construction and inherited/member object lifetimes. The original circular queue is recovered and separately tested. Earlier syntax emission did not prove that malloc-backed fields worked. Read `factory-output/source-first/browser-classic/reports/frontier-source_build_src_osd.cpp.json` and `reports/nov02-constructor-frontier.md`.

The compiler recovers the original CircularQueue destructor from its exact template pattern and uses Clang's typed enum spelling. Ordinary overloaded, const/nonconst and static methods have type-selected names; zero-argument reference-return methods preserve aliases. Separate Clang-proven projections expose existing nontrivial fields and one nonvirtual base at offset zero. Exact original method bodies can borrow those bytes. These views grant no construction, copying, assignment, destruction, virtual dispatch or multiple-inheritance semantics.

The refreshed console frontier gets past file access, checksum storage, array-size evaluation and atomic-list methods. Original callbacks converge on `OSD_Printf`/`OSD_Dispatch`, then `OSD_Puts`, blocked by original `AtomicLogString` construction/lifetime support. Finish these shared semantics, original console initialization, engine initialization and actual indexed rendering. Original `timer.cpp` state must also initialize: the existing host `timerInit` only updates host state and cannot establish original `clockTicksPerSecond`, last-sample or callback initialization. The browser outer loop still needs source-preserving frame yielding. Do not populate missing game state to bypass initialization.

The public `npm run compile:game` interface exists, but it does not yet construct/promote a verified playable candidate from the incremental component. Complete that integration and the native/browser menu, E1L1, 60-second gameplay, audio, collision, progression, save/load and offline checks before publishing.

## Reproducible continuation

```powershell
. work/session-env.ps1
npm run status:component
npm run compile:component -- source/build/src/osd.cpp OSD_Init,OSD_RegisterCvar,OSD_RegisterFunction,OSD_Puts
npm run verify:engine-startup
```

The startup verification intentionally fails until original `enginePreInit` returns successfully. Heavy original Clang jobs must remain serial on this memory-constrained host. Raw AST caches include actual source/header/configuration/toolchain content fingerprints; they do not authorize reuse of mismatched JS artifacts. The ABI is `source-lp64-addresses/2`.

The session environment limits retained AST caches to 128 MiB per cache directory. The November cleanup evicted only regenerable AST entries; original source, assets and semantic data were retained. Source checkpoints `0944416` and `301aa26` are pushed to the public repository; verification/status commits may follow them.

The semantic SQLite is intact (SHA-256 `dc82ebc2e3628984e4f515cc8c0a3370552c60ceacb57d542489ae80c0b6a910`, quick-check passed). The complete compact logical export is `reports/semantic-browser-checkpoint/index.jsonl.gz`. The current 111-unit export has not undergone an independent SQLite restore; the earlier 113-unit round trip passed. Do not recompress or delete the current database.

`python work/package_current_continuation.py` creates a compact private continuation with current source/compiler/runtime/tests/modules, original source, supplied GRP, semantic export and evidence. It excludes downloaded SDKs, raw AST caches and redundant staging/debug output. It verifies every ZIP payload SHA-256. This archive is a development checkpoint, not a playable game. Configure dependencies using BUILD_PORTABILITY.md and BROWSER_SERVICES.md.

Machine-readable state: HANDOFF_SNAPSHOT.json and reports/project-current-status.json. Public source: https://github.com/NullNRG/eduke32-readable-js. Keep GRPs, embedded-asset HTML, caches and toolchains private.
