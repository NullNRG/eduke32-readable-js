# Current EDuke32 continuation status

Updated November 1, 2026. The original JavaScript game is **not bootable or playable**. Original `enginePreInit` and `app_main` have not executed. There is no verified game menu, E1L1 screenshot, playable `dist/index.html` or deployed player.

The canonical project is this directory. The approved release keeps original Build rendering, game logic, CON, actors, weapons, menus and simulation in readable JavaScript. SDL2/platform/audio/timing may use the isolated native WASM services; no original game or Build translation unit is in that WASM module. Classic single-player is selected; desktop features, enhanced rendering and multiplayer are excluded.

## Actual execution

`reports/oct30-original-browser-component.json` records original `engineSetupAllocator`, `initdivtables`, `initsystem` and `videoGetModes` executing in Chromium. It verifies 65,532 original divider records and two modes sorted by the original comparator. The current component manifest separately checks whether these recorded module/runtime bytes still match; re-run the probe after changing them. These component calls do not establish engine startup.

`reports/oct31-original-xxh32-parity.json` verifies 272 native/Node/Chromium streaming checksum cases through original allocation, reset, chunked updates, digest and free. The comparison exposed and corrected numeric heap pointers reaching record fields without Clang-proven typed views, an enum-comment parsing error and adjacent-allocation address decoding. Ordinary dereferences remain bounded.

`reports/nov01-original-softsurface-parity.json` verifies **1,062,912 bytes** of original native/Node/Chromium software-surface output: initialization, palette conversion, scaling, reinitialization and destruction. The original surface now has one state owner and the divider tables have contiguous native storage. This is indexed-pixel conversion, not world rendering or a game screenshot. `work/probe_original_queue.py` also verifies 256 native/Node/Chromium cases of the original circular queue through the browser allocator. `reports/nov01-original-clip-storage.json` verifies original `engineInitClipMaps` updating 61,464 actual owner bytes in Chromium. These are original subsystem functions, not a replacement engine.

Original GenericAllocator methods have 257 native/Node/Chromium cases; allocator startup/wrappers/error handling have 130 under the selected 111-unit configuration. Native SDL service tests separately verify software/indexed presentation, real DOM input, PCM, timing and heap isolation. Complete source SDL surface/event/audio callback adaptation is unfinished. The current engine component uses the JS SDL service table.

## Current compiler and link

`tools/browser_classic_profile.json` is authoritative. Its `boot_module_root` selects the current incremental tree: **22 partial original units**, not a uniform full-program build. `factory-output/source-first/browser-classic/component-manifest.json` records zero missing imports in that partial graph, 56 ambiguous export groups, and absent `enginePreInit`/`app_main` exports. Whole-program linking remains incomplete. Old output directories are migration/history, not interchangeable artifacts.

The actual-fragment storage audit also exposes legacy copies of globals which were absent from selected-export manifests. Inspect `storage_ownership_conflicts` in the component manifest; zero missing imports does not prove correct shared storage. Surface, hash and clipping fragments have been repaired. Engine/console conflicts still require source recompilation and verification. The compiler and installer reject duplicate storage even when it is not re-exported.

Original Make selects 111 units using classic rendering, NOASM and the original GenericAllocator. Five byte-attested source configuration adaptations exclude ALSA, desktop/optional codecs and unused small-pool/thread-cache allocation. Archived source inputs remain intact. All 111 semantic units parse, but indirect-call dataflow, global read/write classification and some template details are explicitly incomplete. Historical counts of emitted/blocked definitions describe earlier configurations and compiler revisions.

A new definition-cursor audit across all 111 units proves 237 uniquely owned external C header functions; 10 ambiguous groups remain excluded. Observing a header prototype does not establish implementation ownership. Original semantic-index declaration identities, actual definition cursors, source bytes, ABI, toolchain and command fingerprints support this contract.

Shared changes include dependency recovery to a bounded fixed point, stable same-TU C ABI bindings, scalar Clang intrinsics, retained explicit member/enum identities, private single-isolate scalar atomics, stable address-taken locals, byte-backed record pointer views, static relocations and source/host memory interoperability. None is a replacement engine or a game-function success stub.

## Regression evidence

`reports/nov01-integration-full-regression.json` passes **199/199** with complete, unchanged compiler/runtime/test inputs. The earlier November run passed 194/197; its failures were corrected before this final run. A repeat run was interrupted after Chromium exposed the aggregate-address/libc boundary; that repair also passes nine affected checks and the original clipping probe. Fixture success does not verify gameplay.

The later shared layout fixes pass **16/16** affected regressions in `reports/oct31-layout-final-regression.json`. They add Clang C record support, one typed field path for reads/addresses/updates, exact same-TU foreign-field bindings, template identity reconciliation and native global storage at the original owner. Native checks cover 512 C-record cases in Node/Chromium, 512 cross-unit global-address cases and 1,280 original menu-header calculations. These are storage and function comparisons, not a rendered menu. The rebuilt scalar libdivide utility now explicitly compiles the bundled header's original C11 interface.

## Immediate boot blocker

The strict console probe blocks `OSD_Init`, `OSD_RegisterCvar` and `OSD_Puts` on `osdmain_t` memory views. Its nested AtomicSList64/std::atomic and inherited logging nodes still need source-accurate storage and methods. The original queue is recovered and separately tested. Earlier syntax emission did not prove that malloc-backed fields worked. Read `factory-output/source-first/browser-classic/reports/frontier-source_build_src_osd.cpp.json`.

The November compiler recovers the original CircularQueue destructor from its exact template pattern and uses Clang's typed enum spelling. Ordinary overloaded, const/nonconst and static methods now have type-selected names; zero-argument reference-return methods preserve aliases. The surrounding console byte views and inherited atomic-list storage remain blocked.

Then finish original console registration/callbacks, logging and file access, recover original engine initialization, and connect actual indexed rendering. Original `timer.cpp` state must also initialize: the existing host `timerInit` only updates host state and cannot establish original `clockTicksPerSecond`, last-sample or callback initialization. The browser outer loop still needs source-preserving frame yielding. Do not populate missing game state to bypass initialization.

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
