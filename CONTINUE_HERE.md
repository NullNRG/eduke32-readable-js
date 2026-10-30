# Continue the canonical project

This is a continuation of the existing EDuke32 SourceFactory project. The original JavaScript game has not booted. Read `CURRENT_PORT_STATUS.md`, `HANDOFF_SNAPSHOT.json` and `reports/project-current-status.json` before changing code. Historical prompts and reports do not establish current execution success.

The authoritative configuration is `tools/browser_classic_profile.json`. It now selects 111 original units for classic software rendering, NOASM and single-player browser services, using the original GenericAllocator backend. Native small-pool/thread caches and their statistics are explicitly excluded; their implementations are not counted as recovered. The October 20 integration is a preserved migration input. It is not the active build output and cannot be mixed with the new pointer ABI.

On this host:

```powershell
. work/session-env.ps1
npm run compile:game
```

The build uses `tools/build_browser_classic.py` and `factory-output/source-first/browser-classic`. Original source preparation, profile inventory, semantic extraction, C/C++ allocator ownership proofs, emission, linking, blocker reports and strict acceptance use this configuration. Browser candidate construction and real gameplay remain unfinished; the acceptance gate must continue failing until original startup and gameplay pass.

The 113-unit semantic index and initial uniform emission pass are preserved. That emission pass predates the newest compiler changes. The new source memory ABI is `source-lp64-addresses/2`; old modules use incompatible pointer tokens. Recompile providers and consumers after this ABI change. Raw Clang AST reuse remains independently fingerprinted and does not imply valid JavaScript artifact reuse.

Latest memory work is documented in `tools/SOURCE_MEMORY_ABI.md`. Standard C allocation reuses the project's ABIHeap. All eight original GenericAllocator methods passed 257 native/Node/Chromium cases under the preceding configuration. The browser source overlay now routes original xmalloc/xcalloc/xrealloc/xfree wrappers directly to those original methods. Refresh the ownership proof, recompile and execute this chain under the current configuration before claiming startup. Owned C++ subobjects and console boot closure remain incomplete.

Latest original probes:

- `factory-output/source-first/oct29-browser-generic-allocator-addresses`
- `factory-output/source-first/oct29-browser-console-addresses`
- `reports/oct29-original-generic-allocator-full-parity.json`
- `reports/oct29-memory-full-regression.json` (check complete/all_passed and input fingerprints)

Keep heavy original Clang jobs serial. To repeat the allocator execution comparison after regenerating its module, run `python work/verify_original_generic_allocator_full.py`. The fixture regression is `python tests/source_factory/verify_sourcefirst_native_addresses.py`.

```powershell
npm run serve:project
python tools/verify_recovery_suite.py --jobs 1 --timeout 240 --report reports/resumed-regression.json
python tools/verify_port_acceptance.py --build-root factory-output/source-first/browser-classic --reports factory-output/source-first/browser-classic/reports --out reports/port-acceptance.json --strict
```

Preserve original source inputs, license notices, supplied GRP and verified implementation work. `dist/original-entry-attempt.html` is an old failed diagnostic. There is no verified playable dist/index.html, original JavaScript menu or E1L1 screenshot. The latest user explicitly allows SDL2/platform/audio/timing in WASM; original game and Build engine code must remain readable JS. No emulator, replacement engine or success stubs are permitted. Follow `BROWSER_SERVICES.md` for the pinned SDK, explicit wasm32/LP64 bridge and native-service tests.

The fresh 111-unit semantic index and ownership contract are complete for the extractor's documented scope. `reports/oct29-browser-allocation-chain-parity.json` verifies actual original allocator startup/error paths in Chromium. `reports/oct29-native-sdl-browser-verification.json` verifies the SDL2 WASM service module, not game boot. Current osd/hash probes are in `factory-output/source-first/oct29-browser-console-native-services-full`. The full original game still needs current emission, fixed-point linking, browser ABI integration and frame yielding.

For another host, follow BUILD_PORTABILITY.md and adapt the saved host paths. Revalidate source, commands, toolchain/sysroot, ABI, compiler and runtime fingerprints. Do not restore old browser snapshots over current implementation work.
