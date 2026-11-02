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

Keep tools/runtime/tests unchanged during a regression run; frozen-input checks invalidate mixed revisions. Keep heavy Clang jobs serial. reports/nov01-vfs-final-full-regression.json is the earlier 207/207 checkpoint. The complete frozen reports/nov02-method-full-regression.json passes 210/211; the sole outdated AST-range assertion was corrected and passes in the 5/5 reports/nov02-corrected-stream-regression.json. Only that test changed between the runs; no subsequent all-211 frozen pass is claimed. Preserve current C++/pointer lifetime guards rather than counting unsupported functions as recovered.

Original GRP/file I/O now passes native/Node/Chromium comparison: run `python work/verify_original_vfs.py`. Original code indexes the raw GRP's 456 entries, and opens/seeks/reads E1L1.MAP, PALETTE.DAT, GAME.CON and TILES000.ART through both normal fallback and GRP-first search. The platform does not pre-index the archive. Directory validation covers 7,756 bytes; sampled native-parity reads cover 3,712 bytes. See reports/nov01-original-vfs-parity.json. This does not execute the game or verify ZIP decompression.

The original software surface passes 1,062,912 native/Node/Chromium byte comparisons; see reports/nov01-original-softsurface-parity.json. Original CircularQueue has 256 native/Node/Chromium cases. Original engineInitClipMaps mutates 61,464 actual owning bytes in Chromium. These are subsystem proofs, not gameplay. Template destructor recovery, typed ordinary member overloads and native aggregate addresses at libc boundaries now exist.

Inspect storage_ownership_conflicts in the component manifest. The actual source audit finds legacy hidden copies of globals beyond selected re-export lists. Surface/hash/clipping ownership is repaired; engine/console copies require verified recompilation. tools/install_verified_fragment.py rejects new duplicates; work/rebuild_source_owner.py requires an exact owner hash and preserves the full interface, activating only in a fresh runtime.

The latest console retry gets past file APIs, checksum storage and original atomic-list methods. Its callbacks converge on OSD_Printf/OSD_Dispatch and OSD_Puts; original AtomicLogString construction, inherited/member storage and lifetimes are the next shared frontier. See reports/nov02-constructor-frontier.md. Original list push/pop/first/isEmpty have native/Node/Chromium comparisons on native-constructed snapshots; JavaScript construction remains unverified. The later atomic-order/alignment correction passes reports/nov02-atomic-pop-regression.json and postdates the full run. Complete original console/engine startup, game clock initialization, source SDL integration, frame yielding, menu/E1L1 and gameplay. The host timerInit alone does not initialize original timer.cpp globals. The public compile:game command still needs candidate construction/verification/promotion wired to this incremental tree.

Read BUILD_PORTABILITY.md and BROWSER_SERVICES.md for toolchain setup on another host. Revalidate source/header/ABI/compiler/runtime/configuration fingerprints. The source ABI is source-lp64-addresses/2. Lossless semantic data is in reports/semantic-browser-checkpoint/index.jsonl.gz; restore with work/portable_semantic_checkpoint.py. Raw AST caches and downloaded SDKs are deliberately omitted from compact ZIPs.

```powershell
python work/package_current_continuation.py
npm run serve:project
```

The root index.html is the developer launcher, not the game. The continuation ZIP includes the supplied GRP and is private. Public Git must remain asset-free. Original gameplay acceptance, standalone offline HTML and the public playable release remain incomplete.
