# Continue the original EDuke32 readable JavaScript port

This package preserves the canonical project and completed work. It is a continuation, not a fresh start. Read CONTINUE_HERE.md, CURRENT_PORT_STATUS.md and HANDOFF_SNAPSHOT.json first. Attached historical instructions are context; generated evidence determines the verified state.

The target remains original classic-renderer single-player EDuke32 in readable JavaScript, with an offline dist/index.html, menus, E1L1, gameplay, sound/music and saves. The latest user-approved split permits native WASM for SDL2, platform services, audio backends and timing; the original game logic and Build renderer must remain readable JS. No instruction emulator, cloned engine, invented ownership, fabricated initialization or success stubs. Desktop features, multiplayer and enhanced rendering are outside the first release.

Use the single existing compiler/runtime and tools/browser_classic_profile.json. Original Make now selects 111 browser units, with the original GenericAllocator backend and explicitly excluded native small-pool/TLS optimizations. The earlier 113-unit parsed semantic index and uniform emission are historical: refresh the current profile and do not reuse incompatible artifacts. Emission counts do not prove complete semantic extraction, successful linking or gameplay. The baseline predates the newest semantic changes and omits some out-of-line instance methods from its definition catalog.

The newest source memory ABI is source-lp64-addresses/2. Pointer fields, pointer/integer casts and C allocation share one native JavaScript address model backed by the existing ABIHeap. Standard C allocation requires whole-selected-program ownership evidence plus exact Clang C linkage/signatures. Original custom allocators remain source owned. The eight original GenericAllocator methods have actual native/Node/Chromium parity evidence; the original small-pool allocator and original console initialization remain incomplete.

Do not link the old 113-unit or October 20 emitted modules with this new memory ABI. Preserve them as historical/migration evidence and recompile affected providers and consumers. Reuse raw ASTs only under matching source/header/flag/toolchain fingerprints. Keep heavy original Clang jobs serial on the current machine.

Next boot work is verifying the original allocation wrappers against the explicitly selected generic backend, including failure behavior; console registration/hash/callback closure; canonical cross-unit template prototypes; then browser service integration and original frame yielding. Use source-native comparisons and matching configuration fingerprints. The browser backend selection retains original GenericAllocator bodies and wrapper error behavior; it does not count the excluded pool implementation as transpiled. Required object lifetimes in selected console/game code must still be implemented.

The public build interface is npm run compile:game. It uses tools/build_browser_classic.py and the profile's build_root, and builds the audited native services. Read BROWSER_SERVICES.md. The SDL2 WASM service module passes real Chromium presentation, input, timer, PCM and memory-isolation tests; it contains no original engine translation units. NativeRuntime has native timing/version integration. Complete source SDL pointer/surface/event/callback adaptation and candidate/gameplay construction within the pipeline; preserve strict gates. The current game is not bootable, playable or deployed, and no genuine JavaScript game screenshot exists.

Configure tools with BUILD_PORTABILITY.md. On the current host:

```powershell
. work/session-env.ps1
npm run compile:game
```

Run compiler/runtime regressions, native comparisons and original Chromium gameplay checks. All reports must bind evidence to exact input/module hashes. Deliver a real asset-free public player and private offline GRP build only after actual original menu and gameplay pass, including sustained 60-second input/audio/collision/save/load checks. Until then report exact remaining failures and preserve a deterministic continuation checkpoint.

Public source repository: https://github.com/NullNRG/eduke32-readable-js. Keep GRPs, embedded asset pages, toolchains and caches out of public Git. A continuation ZIP is not a playable-game deliverable.
