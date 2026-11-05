# Current EDuke32 readable JavaScript port — November 5, 2026

**The original game is not yet playable.** No verified JavaScript menu, E1L1 image, 60-second gameplay session or standalone playable `dist/index.html` exists. Do not present native screenshots or diagnostic canvases as JavaScript gameplay.

Actual Chromium execution has reached original `engineSetupAllocator → enginePreInit → initgroupfile → engineInit → OSD_Init → enginePostInit → videoSetGameMode`. All listed functions now return successfully in Chromium; the original 640×480 video mode passes without page exceptions. Original engine initialization verified the native trigonometric CRC constants and 74,496 original palette/shade/translucency bytes from the supplied 456-entry GRP. These are engine-component proofs, not `app_main`, CON or world rendering.

The implicit C++ vector assignment at `softsurface_initialize` is fixed through a dedicated Clang-proven trivial-assignment path. It passes 512 native/JS cases and a frozen 12/12 assignment/union integration suite. The regenerated original surface owner and complete engine/video component now execute successfully. World rendering, game/menu startup and gameplay remain blocked.

Implemented shared fixes also cover terminal private-pointer steps, typed scalar lvalue reads, dominated scalar-byte storage across goto, lazy header inventory, actual SDL structure writes, canvas window resize/border flags, unchanged-size surface lifetime, video-implied events, bounded `bsearch`, and cached actual-export audits. The original MD4, map-hack search and clip-map initialization storage have been linked. The complete map loader is still blocked.

A frozen targeted regression checkpoint passed 10/10 tests before the latest trivial-assignment change. Host I/O/display tests passed 9/9. The latest assignment integration suite is separate; inspect its report. A complete current compiler regression run remains required. Historical full-suite success is not current verification.

The classic NOASM single-player profile selects 111 original units. All have native semantic observations, with a verified SDL-only semantic delta reusing 110 unchanged units. Semantic fingerprint: `21a27fbf22e0018081f46b96e01d86264b8d9a480a70f6f53bb693d29d9af765`. The refreshed private compressed checkpoint has every table row checked; it is not a complete indirect-call/dataflow model.

The generated game graph remains partial and contains unresolved/ambiguous ownership. `app_main` is not linked. The root launcher is a developer interface; `npm run compile:game` is not yet a reproducible playable-release pipeline. Original Build/game code must stay readable JS; low-level browser/native services may use the previously authorized separate WASM service.

Evidence: `reports/nov05-shared-boot-regression.json`, `reports/nov05-host-io-display-regression.log`, `reports/nov05-trivial-record-assignment-regression.log`, `reports/nov05-original-engine-video.json`, `reports/nov05-sdl-semantic-delta.json`, and `reports/nov05-semantic-payload-verification.json`.
