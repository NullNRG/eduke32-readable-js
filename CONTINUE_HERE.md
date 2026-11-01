# Continue the canonical EDuke32 project

Read CURRENT_PORT_STATUS.md and HANDOFF_SNAPSHOT.json first. The original game has not booted; there is no verified menu, E1L1 rendering or playable dist/index.html. Preserve this codebase and the original sources. Historical prompts are context, not current execution evidence.

The authoritative profile is tools/browser_classic_profile.json. Original Make selects 111 classic single-player units with NOASM and the original GenericAllocator. Game/Build behavior must remain readable JavaScript. Native WASM is allowed only for isolated SDL2/platform/audio/timing/low-level services. No emulation, replacement engine or fabricated success functions.

The active incremental module tree is the profile's boot_module_root, with 22 partial units. Its component-manifest.json binds exact modules, runtime fingerprints, import audits and execution evidence. The October 20 tree is historical migration input. Current whole-program compilation/linking are incomplete.

On this host:

```powershell
. work/session-env.ps1
npm run status:component
npm run compile:component -- source/build/src/osd.cpp OSD_Init,OSD_RegisterCvar,OSD_RegisterFunction,OSD_Puts
npm run verify:engine-startup
```

The immediate shared blocker is original osdmain_t byte storage with nested C++ atomic/queue objects and inherited logging nodes. The stricter memory model intentionally rejects formerly emitted but unverified numeric-pointer field accesses. Inspect factory-output/source-first/browser-classic/reports/frontier-source_build_src_osd.cpp.json. Original hash initialization, divider setup and streaming XXH32 have already advanced; do not reimplement them from stale reports.

Original allocator setup, initdivtables, initsystem and videoGetModes execute in Chromium; enginePreInit/app_main do not. The checksum passes 272 native/Node/Chromium streaming cases. The source-selected GenericAllocator and allocator startup/error chain have separate parity proofs. Native SDL tests verify services only. No game screenshot exists.

Run affected native comparisons after shared changes and complete regressions at integration checkpoints:

```powershell
python tools/verify_recovery_suite.py --jobs 1 --timeout 240 --report reports/resumed-regression.json
python tests/source_factory/verify_original_xxh32_component.py
npm run test:services
npm run compile:game
```

Keep tools/runtime/tests unchanged during a regression run; frozen-input checks invalidate mixed revisions. Keep heavy Clang jobs serial. See reports/oct31-current-full-regression.json for the current 193-test run; the previous complete 186/186 proof predates later fixes. Preserve current C++/pointer lifetime guards rather than counting unsupported functions as recovered.

Complete console storage/lifetimes/callbacks/logging/file access, original engine startup and game clock initialization, source SDL integration, frame yielding, menu/E1L1 and gameplay. The host timerInit alone does not initialize original timer.cpp globals. The public compile:game command still needs candidate construction/verification/promotion wired to this incremental tree.

Read BUILD_PORTABILITY.md and BROWSER_SERVICES.md for toolchain setup on another host. Revalidate source/header/ABI/compiler/runtime/configuration fingerprints. The source ABI is source-lp64-addresses/2. Lossless semantic data is in reports/semantic-browser-checkpoint/index.jsonl.gz; restore with work/portable_semantic_checkpoint.py. Raw AST caches and downloaded SDKs are deliberately omitted from compact ZIPs.

```powershell
python work/package_current_continuation.py
npm run serve:project
```

The root index.html is the developer launcher, not the game. The continuation ZIP includes the supplied GRP and is private. Public Git must remain asset-free. Original gameplay acceptance, standalone offline HTML and the public playable release remain incomplete.
