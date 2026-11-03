# Continue the canonical EDuke32 project

Read CURRENT_PORT_STATUS.md and HANDOFF_SNAPSHOT.json first. Original enginePreInit now executes in fresh Chromium and returns 0. The game itself has not booted: there is no verified app_main, menu, E1L1 rendering or playable dist/index.html. Preserve this codebase and the original sources. Historical prompts are context, not current execution evidence.

The authoritative profile is tools/browser_classic_profile.json. Original Make selects 111 classic single-player units with NOASM and the original GenericAllocator. Game/Build behavior must remain readable JavaScript. Native WASM is allowed only for isolated SDL2/platform/audio/timing/low-level services. No emulation, replacement engine or fabricated success functions.

The active incremental module tree is the profile's boot_module_root, with 29 partial units. Its component-manifest.json binds exact modules, runtime fingerprints, import audits and execution evidence. The October 20 tree is historical migration input. Current whole-program compilation/linking are incomplete.

On this host:

```powershell
. work/session-env.ps1
npm run status:component
python work/recover_boot_reachable.py source/duke3d/src/game.cpp app_main
python work/verify_fresh_engine_startup.py
```

The original console now initializes, logs and dispatches commands in Chromium. Original player-array storage also links after nested-type and struct-pointer fixes. Continue the original app_main frontier in factory-output/source-first/browser-classic/reports/frontier-source_duke3d_src_game.cpp.json; ENGINEERING_CHECKPOINT.md documents its shared semantic blockers and bounded search limits. The stricter memory model still rejects unverified numeric-pointer field accesses. Original hash initialization, divider setup and streaming XXH32 have already advanced; do not reimplement them from stale reports.

Original engineSetupAllocator followed directly by enginePreInit now executes in fresh Chromium. The entry returns 0 and initializes its own division/system/mode dependencies; app_main does not yet execute. The checksum passes 272 native/Node/Chromium streaming cases. The source-selected GenericAllocator and allocator startup/error chain have separate parity proofs. Native SDL tests verify services only. No game screenshot exists.

Run affected native comparisons after shared changes and complete regressions at integration checkpoints:

```powershell
python tools/verify_recovery_suite.py --jobs 1 --timeout 240 --report reports/resumed-regression.json
python tests/source_factory/verify_original_xxh32_component.py
npm run test:services
npm run compile:game
```

Keep tools/runtime/tests unchanged during a regression run; frozen-input checks invalidate mixed revisions. Keep heavy Clang jobs serial. The latest full run attempted 218 tests; same-input isolated confirmation reached 217 passed and one clock-fixture timeout. Later shared performance/worklist changes pass focused suites, including the explicitly bounded clock fixture and a separate structured-frontier test. A complete pass under final current inputs is not claimed. Read ENGINEERING_CHECKPOINT.md for exact reports and remaining acceptance work. Preserve current C++/pointer lifetime guards rather than counting unsupported functions as recovered.

Original GRP/file I/O now passes native/Node/Chromium comparison: run `python work/verify_original_vfs.py`. Original code indexes the raw GRP's 456 entries, and opens/seeks/reads E1L1.MAP, PALETTE.DAT, GAME.CON and TILES000.ART through both normal fallback and GRP-first search. The platform does not pre-index the archive. Directory validation covers 7,756 bytes; sampled native-parity reads cover 3,712 bytes. See reports/nov01-original-vfs-parity.json. This does not execute the game or verify ZIP decompression.

The original software surface passes 1,062,912 native/Node/Chromium byte comparisons; see reports/nov01-original-softsurface-parity.json. Original CircularQueue has 256 native/Node/Chromium cases. Original engineInitClipMaps mutates 61,464 actual owning bytes in Chromium. These are subsystem proofs, not gameplay. Template destructor recovery, typed ordinary member overloads and native aggregate addresses at libc boundaries now exist.

Inspect storage_ownership_conflicts in the component manifest. The actual source audit finds legacy hidden copies of globals beyond selected re-export lists. Surface/hash/clipping ownership is repaired; engine/console copies require verified recompilation. tools/install_verified_fragment.py rejects new duplicates; work/rebuild_source_owner.py requires an exact owner hash and preserves the full interface, activating only in a fresh runtime.

Original console initialization, logging, queue draining, command dispatch and alias expansion now execute in Chromium. See reports/nov02-original-console-chromium.json for exact module/runtime fingerprints and two inspected diagnostic command callbacks. The original AtomicLogString constructor also passes 256 native/Node/Chromium cases. Shared constructor, while-condition, sized-delete, transitive allocation and function-address semantics are implemented with explicit scope limits; read reports/nov02-constructor-frontier.md. Original enginePreInit now completes without pre-calling helper initializers. Continue original app_main and its dependency chain. Complete app_main, game clock initialization, source SDL integration, frame yielding, menu/E1L1 and gameplay. Host timerInit alone does not initialize original timer.cpp globals. The public compile:game command still needs candidate construction/verification/promotion wired to this incremental tree.

Read BUILD_PORTABILITY.md and BROWSER_SERVICES.md for toolchain setup on another host. Revalidate source/header/ABI/compiler/runtime/configuration fingerprints. The source ABI is source-lp64-addresses/2. Lossless semantic data is in reports/semantic-browser-checkpoint/index.jsonl.gz; restore with work/portable_semantic_checkpoint.py. Raw AST caches and downloaded SDKs are deliberately omitted from compact ZIPs.

```powershell
python work/package_current_continuation.py
npm run serve:project
```

The root index.html is the developer launcher, not the game. The continuation ZIP includes the supplied GRP and is private. Public Git must remain asset-free. Original gameplay acceptance, standalone offline HTML and the public playable release remain incomplete.


Latest shared recovery: packed anonymous typedef assignment and exact selected union initialization pass native/Node/Chromium comparisons. The original input functions advance to missing dependencies, and the separate bounded G_DrawRooms probe reports no semantic blockers. Original app_main remains unlinked (116 direct references in its latest bounded attempt); G_HandleLocalKeys exposes a legal cross-scope goto case. See ENGINEERING_CHECKPOINT.md, reports/nov02-game-provider-frontier.json and the live full-regression report reports/nov02-engine-launcher-full-regression.json.


November 3 verified checkpoint: reports/nov02-engine-launcher-full-regression.json completes 221/221 tests with frozen inputs unchanged. The generated snapshot checks current fingerprints. The original game remains unlinked/unplayed; continue the recorded provider and goto frontier. The current semantic export independently restores and verifies all tables (reports/nov02-semantic-restore.json).
