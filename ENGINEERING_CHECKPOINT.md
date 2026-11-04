# Engine startup checkpoint — updated November 3, 2026

**Original `enginePreInit` executes in Chromium and returns 0. The original game does not yet boot.** There is no verified `app_main` execution, rendered menu, E1L1 world image, controlled gameplay session or playable `dist/index.html`. The developer launcher and its screenshots are diagnostics, not gameplay evidence.

## Open and use the launcher

On the configured Windows machine, open `launch-project.cmd`. Alternatively:

```powershell
. work/session-env.ps1
npm run serve:project
```

Open http://127.0.0.1:8765/. On another machine, first follow [BUILD_PORTABILITY.md](BUILD_PORTABILITY.md) and [BROWSER_SERVICES.md](BROWSER_SERVICES.md); downloaded SDKs, Python dependencies and raw AST caches are deliberately omitted from Git.

The launcher provides:

| Control | What actually runs |
| --- | --- |
| Open engine diagnostic | The current readable original modules, original allocator setup, then original `enginePreInit` in a fresh browser page; checks native divider storage and video modes afterward |
| Verify startup in Chromium | The same fresh startup probe through browser automation, saving module/runtime fingerprints and an execution trace |
| Recover app_main dependencies | Targeted canonical source compilation and bounded dependency recovery; saves blockers and refuses to install an incomplete requested root |
| Run full game build | `npm run compile:game` pipeline; currently fails incomplete-game acceptance |
| Run regression tests | Serial compiler/runtime regressions with persistent logs; distinct from gameplay acceptance |
| Check game readiness | Strict original-game acceptance checks |
| Create handoff ZIP | Private continuation with existing work, original sources, local GRP and compact semantic data; excludes downloaded SDKs, raw AST caches and obsolete fragments |
| Review cleanup | Conservative inventory of removable caches; cleanup retains original sources/assets/current semantic data |
| Open game build | Available only when gameplay evidence matches the exact `dist/index.html` bytes |

Only fixed local jobs are accepted. One job runs at a time. Closing a diagnostic does not erase original source or compiler work. For another startup run, reload its page to obtain fresh original globals. A browser-downloaded diagnostic result is local observation; it does not promote the playable-game gate.

## What is verified

* Fresh startup: original `engineSetupAllocator` → original `enginePreInit` → return 0. No manual `initdivtables`, `initsystem` or `videoGetModes` calls precede the entry. The probe subsequently checks **65,532** divider records over contiguous native bytes and **two** video modes. See [startup evidence](reports/oct30-original-browser-component.json).
* Original console allocation, initialization, log-node construction/draining, registration, argument parsing, dispatch and alias expansion run in Chromium, including two inspected command callbacks. See `reports/nov02-original-console-chromium.json`; fingerprints determine whether it still matches the current graph.
* Original packed player storage imports in Node and Chromium: 17 records × 133 bytes, one 2,261-byte allocation, zero initialization, and original `g_player` pointing past the sentinel. See `reports/nov02-original-player-storage.json`.
* Original GRP routines, independently tested, index 456 entries from the raw supplied archive and match native reads/seeks of MAP, ART, CON and palette resources. The browser does not manufacture their directory or game state. See `reports/nov01-original-vfs-parity.json`.
* Original software-surface palette conversion/scaling matches 1,062,912 native/Node/Chromium output bytes. This is **not** original world rendering. Checksum, allocator, clipping storage and atomic/constructor fixtures have separately scoped proofs.
* The real launcher opens the real engine diagnostic in Chromium; Play stays gated. See `reports/nov02-launcher-browser.json`. Its two screenshots show the launcher and startup trace only.

## Canonical configuration and boundaries

`tools/browser_classic_profile.json` is authoritative. It selects **111** original classic-renderer single-player Make units: NOASM, original GenericAllocator, no desktop dialogs/monitor selector, enhanced renderers, multiplayer, mimalloc, ALSA or optional external-media codecs. Six byte-attested source adaptations retain original input archives and native branches. VOC/MIDI/ART/MAP/CON behavior remains required.

The current incremental tree is `factory-output/source-first/browser-classic/browser-modules`: **31 partial units**, zero missing imports in that partial graph, **65 ambiguous export groups** and remaining legacy storage conflicts. These are not 111 uniformly compiled/linked units. Per-fragment fingerprints retain their actual revisions. Zero missing imports is not proof that duplicate hidden storage has correct ownership.

Original game logic, Build renderer, CON, actors, weapons, collision and menus must remain readable JavaScript. Isolated WASM SDL/platform/audio/timing/low-level services are permitted; no original game/Build translation unit or emulator is permitted there. The current startup probe binds the JS SDL service table. Native SDL2 services pass independent browser tests but their complete original-source callback/surface/audio integration remains unfinished.

All 111 selected semantic units parse under the fresh browser-display configuration. Its semantic fingerprint is `b801d9e2b82229629ddaa6e5276a35396458b2a6526ecc0cc11599eefaf93058`. This is a semantic inventory, not full readable-JS emission. Indirect-call dataflow, global read/write classification and automatic emitter-to-USR attachment remain incomplete.

## Immediate implementation frontier

The latest targeted `app_main` attempt is recorded in `factory-output/source-first/browser-classic/reports/frontier-source_duke3d_src_game.cpp.json`. The latest bounded attempt found 183 entries: 138 emitted and 45 blocked. Strict ABI/import checks installed 136 newly closed definitions into the existing game owner; the requested app_main remains unlinked with **120 direct unresolved references** at that attempt. These are staged source/link measurements, not gameplay recovery or whole-program totals.

The dependency worklist now consumes the complete structured unresolved-reference list, rather than the diagnostic string truncated to twelve names. This exposed additional genuine dependencies. The latest app_main attempt reached its **256-query** limit in 16 rounds, with **239 references not queried**. Raising the budget alone will not fix missing semantics.

Prioritize these shared compiler fixes:

1. **Packed input assignment — shared fix implemented.** The compiler now proves global anonymous typedef/tag identity and trivial copy/move traits within one complete Clang invocation, retains exact layouts, and gives dereferenced record pointers their original byte views. Native/Node/Chromium tests check 512 cases per JS runtime, including copy, move, self-assignment, aliases and every resulting object byte. Scoped alias collisions remain rejected. Original `drawframe_do` (game.cpp:6472) and `dukeFillInputForTic` (game.cpp:6523) now get past assignment lowering; their missing source dependencies still prevent installation. This is not a claim of complete C++ assignment/lifetime support.
2. **Selected union initialization — shared fix implemented.** Initializers retain the exact selected field through an unchanged same-TU function/body/ordinal witness. Anonymous field bindings also require the original lexical child and source tag token when reconciling duplicate record declarations. Native/Node/Chromium tests check 512 cases per JS runtime, including anonymous alternatives, a named nonfirst member and complete vector bytes; changed bodies/selections are rejected. The current original `G_DrawRooms` probe gets past union lowering and reports only unresolved dependencies. That 12-query probe is feature verification, not the complete renderer dependency closure or execution.
3. **Complete source dependency chains and storage ownership.** Recover original providers by verified declarations and current header contracts, not guessed function names. Retain cyclic fixed-point linking and reject unproved duplicate globals. There are further initialization, script/menu/game-loop/render dependencies beyond the direct list.
4. **Original clock and browser frame boundary.** Host `timerInit` initializes host service state, not original `timer.cpp` globals. Recover original initialization. Adapt the authored game loop to yield at verified frame boundaries while retaining simulation order, restart paths and lifetimes.
5. **Original presentation and services.** Connect original indexed framebuffer/surface output, SDL callbacks/events and audio to the browser. Complete native-versus-JS menu/level/game-state checks; do not reconstruct a separate world renderer or seed missing game state.

The next exposed control-flow blocker is original `G_HandleLocalKeys`: quick-save/load jumps into sibling `if` blocks at `FAKE_F2` / `FAKE_F3`. Clang accepts this source, but the current structured lowering rejects the lexical-scope transition. Preserve bypassed keyboard conditions, continuation order and actual lifetime barriers when extending the generic goto lowering; do not rewrite this game function as a workaround.

`reports/nov02-game-provider-frontier.json` and `.csv` map **347 deduplicated unresolved names observed in this bounded attempt** to actual semantic declaration candidates, with stable USRs and affected callers. These are not whole-program blocker/fanout totals. Locals and fields are excluded from provider candidates. Header definition locations are explicitly not treated as TU ownership proofs. The highest observed source weights include original dynamic tile-name storage, game startup, common globals, engine services, screens, sound and configuration. Reuse the strict owner/header contracts before compiling or installing a candidate.

Resume using the same codebase:

```powershell
. work/session-env.ps1
npm run status:component
npm run verify:engine-startup
npm run recover:app-main
python work/recover_boot_reachable.py source/duke3d/src/game.cpp G_DrawRooms --query-limit 12 --probe-only
# After each shared fix, retry the affected roots and their native/browser tests.
python tools/verify_recovery_suite.py --jobs 1 --timeout 240 --report reports/resumed-regression.json
npm run compile:game
```

Keep heavy Clang jobs serial on this host. Reuse AST caches only when source/header/configuration/ABI/compiler fingerprints match. `work/rebuild_storage_fragment.py` can replace a data-only original fragment only with its exact prior hash, unchanged declaration/layout/storage interface and no duplicates; activate in a fresh runtime. Do not refresh existing storage with an ordinary additive recovery command.

## Regression and release limits

The complete frozen `reports/nov02-engine-launcher-full-regression.json` run passes **221/221 tests**, with compiler/runtime/test inputs unchanged. This includes the packed assignment, exact union selection, original vector/menu-header and launcher checks. The new GitHub CI native/Node fixtures also pass on Linux. These are compiler/runtime and subsystem proofs; original app_main and gameplay remain unverified. The subsequent launcher publication race was fixed and passes two focused checks plus Linux CI. The compiler/runtime inputs still match the 221-test run, while the complete tools/tests fingerprint differs in the launcher and its test. A new all-221 run after that UI-only change is not claimed. The current semantic export also passed an independent SQLite restoration with all table hashes and rows checked; see `reports/nov02-semantic-restore.json`.

Complete selected-unit emission, source ownership and fixed-point linking after shared semantics stabilize. Then verify original menu and E1L1 rendering, at least 60 seconds of controlled gameplay, enemies/weapons/collision/interactions, sound/music, progression, save/reload/persistence and offline operation. Bind evidence to the exact promoted player. `compile:game` still needs candidate construction/promotion from the incremental graph. The stable-declaration 90% compiler-recovery measurement also remains unverified.

Public source is [NullNRG/eduke32-readable-js](https://github.com/NullNRG/eduke32-readable-js). CI now also exercises launcher job/gate checks and the asset-free packed-record/union native-versus-JS fixtures. GRPs, embedded-asset HTML, SDKs, caches and private continuation ZIPs must stay out of public Git/CI. Pages deployment remains disabled until an asset-free original player passes gameplay gates. Do not publish native reference frames or the diagnostic canvas as JavaScript gameplay screenshots.


November 3 dynamic-name checkpoint: the original dynamic-name unit, weapon/spawn arrays and integer-hash providers are now linked. Original `G_InitDynamicNames` executes in Node and Chromium and matches 2,311 native comparison rows: 767 globals, 625 tile records, 142 sound records, actual pointer remaps, weapon/spawn arrays before/after initialization, and 767 map lookups. `reports/nov03-original-dynamic-initialization.json` binds that evidence to module/runtime hashes. EnginePreInit and original console verification were refreshed for the 31-unit partial graph. This does not execute app_main or render the game.

Resume dependency recovery with `python work/recover_boot_reachable.py source/duke3d/src/game.cpp app_main --install-closed-leaves`. Validated saved emissions can be reused with `--reuse-manifest PATH`; it checks current compiler and complete Clang preprocessor content fingerprints before strict import/ABI installation. The default dependency budget remains bounded and records unqueried references. The earlier G_HandleLocalKeys scope-entry issue is still a known unsupported case; that definition was not reached in the latest bounded attempt.
