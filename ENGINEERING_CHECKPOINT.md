# Current EDuke32 readable JavaScript port — November 5, 2026

**The original game is not yet playable.** No verified JavaScript menu, E1L1 image, 60-second gameplay session or standalone playable `dist/index.html` exists. Do not present native screenshots or diagnostic canvases as JavaScript gameplay.

Actual Chromium execution has reached original `engineSetupAllocator → enginePreInit → initgroupfile → engineInit → OSD_Init → enginePostInit → videoSetGameMode`. The last function has not returned successfully. Original engine initialization verified the native trigonometric CRC constants and 74,496 original palette/shade/translucency bytes from the supplied 456-entry GRP. These are engine-component proofs, not `app_main`, CON or world rendering.

The current video frontier is implicit C++ record assignment in `softsurface_initialize`: identical native vector fields carried different optional JavaScript method prototypes. A new Clang-proven trivial-assignment path passes 512 native/JS cross-TU cases, self-assignment, alias retention and negative layout/proof/custom-operator checks. The software-surface owner is being regenerated and the Chromium video probe must pass before advancing.

Implemented shared fixes also cover terminal private-pointer steps, typed scalar lvalue reads, dominated scalar-byte storage across goto, lazy header inventory, actual SDL structure writes, canvas window resize/border flags, unchanged-size surface lifetime, video-implied events, bounded `bsearch`, and cached actual-export audits. The original MD4, map-hack search and clip-map initialization storage have been linked. The complete map loader is still blocked.

A frozen targeted regression checkpoint passed 10/10 tests before the latest trivial-assignment change. Host I/O/display tests passed 9/9. The latest assignment integration suite is separate; inspect its report. A complete current compiler regression run remains required. Historical full-suite success is not current verification.

The classic NOASM single-player profile selects 111 original units. All have native semantic observations, with a verified SDL-only semantic delta reusing 110 unchanged units. Semantic fingerprint: `21a27fbf22e0018081f46b96e01d86264b8d9a480a70f6f53bb693d29d9af765`. The refreshed private compressed checkpoint has every table row checked; it is not a complete indirect-call/dataflow model.

The generated game graph remains partial and contains unresolved/ambiguous ownership. `app_main` is not linked. The root launcher is a developer interface; `npm run compile:game` is not yet a reproducible playable-release pipeline. Original Build/game code must stay readable JS; low-level browser/native services may use the previously authorized separate WASM service.

Evidence: `reports/nov05-shared-boot-regression.json`, `reports/nov05-host-io-display-regression.log`, `reports/nov05-trivial-record-assignment-regression.log`, `reports/nov05-original-engine-video.json`, `reports/nov05-sdl-semantic-delta.json`, and `reports/nov05-semantic-payload-verification.json`.

# Continue the canonical project

Read `CURRENT_PORT_STATUS.md`, `HANDOFF_SNAPSHOT.json` and the latest actual Chromium report. Preserve the existing project and all original source/license notices. The port is incomplete; do not claim a playable artifact or show native/diagnostic images as game screenshots.

PowerShell, from the canonical project:

```powershell
. work/session-env.ps1
python work/verify_original_engine_init.py --video-mode --report reports/nov05-original-engine-video.json
```

The active rebuild/probe command is logged in `reports/nov05-proven-software-assignment-rebuild.log` and `reports/nov05-original-engine-video.log`. Do not run a second heavy Clang job concurrently. `work/rebuild_source_owner.py` requires the actual current SHA-256 of the owner. It preserves storage and current consumers; header-factory retention preserves original closed implementations rather than introducing initialization cycles. Reuse requires the exact compiler and preprocessing fingerprints.

The last verified shared fix is Clang-proven implicit trivial-record assignment. After the current owner rebuild, retry the original video path. Retain all native layout, lifetime and authored-method checks. Next resolve `bfirst_search_init`/`bfirst_search_try` template recovery, complete `engineFinishLoadBoard` and original map/ART/cache initialization. `cache1d` out-of-line nonstatic methods still need reusable compiler lowering. Reprobe original `app_main`; never substitute a boot stub or fill game state manually.

The SDL event fragment retry failed because internal `sdl_resize` was not imported through a valid original storage provider. Preserve that diagnostic; fix same-TU private ownership or rebuild its complete owner. The broad clip retry rejected a `tilesiz` record-array prototype/storage mismatch; the scalar `quickloadboard` recovery succeeded separately. Do not weaken either ABI check.

After changes stabilize:

```powershell
python tools/verify_recovery_suite.py --jobs 1 --timeout 1200 --report reports/nov05-current-full-regression.json
python tools/verify_port_acceptance.py --build-root factory-output/source-first/browser-classic --out reports/nov05-port-acceptance.json --strict
```

The strict acceptance gate is expected to fail until real original menu, level, input, audio, gameplay and offline evidence exist. Produce genuine Chromium menu/E1L1 screenshots only when those states render. The current repository excludes GRPs, toolchains, AST/SQLite caches and the 362 MB private semantic payload. Local input data remains private.
