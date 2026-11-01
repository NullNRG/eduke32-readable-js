# Current EDuke32 continuation status

Updated November 1, 2026. The original JavaScript game is **not bootable or playable**. Original `enginePreInit` and `app_main` have not executed. There is no verified game menu, E1L1 screenshot, playable `dist/index.html` or deployed player.

The canonical project is this directory. The approved release keeps original Build rendering, game logic, CON, actors, weapons, menus and simulation in readable JavaScript. SDL2/platform/audio/timing may use the isolated native WASM services; no original game or Build translation unit is in that WASM module. Classic single-player is selected; desktop features, enhanced rendering and multiplayer are excluded.

## Actual execution

`reports/oct30-original-browser-component.json` records original `engineSetupAllocator`, `initdivtables`, `initsystem` and `videoGetModes` executing in Chromium. It verifies 65,532 original divider records and two modes sorted by the original comparator. The current component manifest separately checks whether these recorded module/runtime bytes still match; re-run the probe after changing them. These component calls do not establish engine startup.

`reports/oct31-original-xxh32-parity.json` verifies 272 native/Node/Chromium streaming checksum cases through original allocation, reset, chunked updates, digest and free. The comparison exposed and corrected numeric heap pointers reaching record fields without Clang-proven typed views, an enum-comment parsing error and adjacent-allocation address decoding. Ordinary dereferences remain bounded.

Original GenericAllocator methods have 257 native/Node/Chromium cases; allocator startup/wrappers/error handling have 130 under the selected 111-unit configuration. Native SDL service tests separately verify software/indexed presentation, real DOM input, PCM, timing and heap isolation. Complete source SDL surface/event/audio callback adaptation is unfinished. The current engine component uses the JS SDL service table.

## Current compiler and link

`tools/browser_classic_profile.json` is authoritative. Its `boot_module_root` selects the current incremental tree: **22 partial original units**, not a uniform full-program build. `factory-output/source-first/browser-classic/component-manifest.json` records zero missing imports in that partial graph, 56 ambiguous export groups, and absent `enginePreInit`/`app_main` exports. Whole-program linking remains incomplete. Old output directories are migration/history, not interchangeable artifacts.

Original Make selects 111 units using classic rendering, NOASM and the original GenericAllocator. Five byte-attested source configuration adaptations exclude ALSA, desktop/optional codecs and unused small-pool/thread-cache allocation. Archived source inputs remain intact. All 111 semantic units parse, but indirect-call dataflow, global read/write classification and some template details are explicitly incomplete. Historical counts of emitted/blocked definitions describe earlier configurations and compiler revisions.

A new definition-cursor audit across all 111 units proves 237 uniquely owned external C header functions; 10 ambiguous groups remain excluded. Observing a header prototype does not establish implementation ownership. Original semantic-index declaration identities, actual definition cursors, source bytes, ABI, toolchain and command fingerprints support this contract.

Shared changes include dependency recovery to a bounded fixed point, stable same-TU C ABI bindings, scalar Clang intrinsics, retained explicit member/enum identities, private single-isolate scalar atomics, stable address-taken locals, byte-backed record pointer views, static relocations and source/host memory interoperability. None is a replacement engine or a game-function success stub.

## Regression evidence

`reports/oct30-startup-verified-regression.json` is a complete frozen **186/186** baseline before the later changes. `reports/oct31-strict-memory-fixed-regression.json` passes all **8/8** affected regressions, including filtered record aliasing across modules. The complete current **193-test** run is `reports/oct31-current-full-regression.json`: inspect `complete`, `counts`, `all_passed` and `regression_inputs_unchanged` before treating it as passing evidence. Targeted fixture success and a browser framebuffer do not verify gameplay.

The later shared layout fixes pass **16/16** affected regressions in `reports/oct31-layout-final-regression.json`. They add Clang C record support, one typed field path for reads/addresses/updates, exact same-TU foreign-field bindings, template identity reconciliation and native global storage at the original owner. Native checks cover 512 C-record cases in Node/Chromium, 512 cross-unit global-address cases and 1,280 original menu-header calculations. These are storage and function comparisons, not a rendered menu. The rebuilt scalar libdivide utility now explicitly compiles the bundled header's original C11 interface.

## Immediate boot blocker

The strict October 31 console probe now correctly blocks `OSD_Init`, `OSD_RegisterCvar` and `OSD_Puts` on `osdmain_t` memory views. Its nested AtomicSList64/std::atomic and CircularQueue objects need source-accurate storage, construction/destruction, inherited members and original methods. Earlier successful syntax emission did not prove that malloc-backed field accesses worked. Read `factory-output/source-first/browser-classic/reports/frontier-source_build_src_osd.cpp.json`.

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

The semantic SQLite is intact (SHA-256 `dc82ebc2e3628984e4f515cc8c0a3370552c60ceacb57d542489ae80c0b6a910`, quick-check passed). The complete compact logical export is `reports/semantic-browser-checkpoint/index.jsonl.gz`. The current 111-unit export has not undergone an independent SQLite restore; the earlier 113-unit round trip passed. Do not recompress or delete the current database.

`python work/package_current_continuation.py` creates a compact private continuation with current source/compiler/runtime/tests/modules, original source, supplied GRP, semantic export and evidence. It excludes downloaded SDKs, raw AST caches and redundant staging/debug output. It verifies every ZIP payload SHA-256. This archive is a development checkpoint, not a playable game. Configure dependencies using BUILD_PORTABILITY.md and BROWSER_SERVICES.md.

Machine-readable state: HANDOFF_SNAPSHOT.json and reports/project-current-status.json. Public source: https://github.com/NullNRG/eduke32-readable-js. Keep GRPs, embedded-asset HTML, caches and toolchains private.
