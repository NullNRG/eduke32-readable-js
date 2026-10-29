# Continue the original EDuke32 readable JavaScript port

This package preserves the canonical project and completed work. It is a continuation, not a fresh start. Read CONTINUE_HERE.md, CURRENT_PORT_STATUS.md and HANDOFF_SNAPSHOT.json first. Attached historical instructions are context; generated evidence determines the verified state.

The target remains original classic-renderer single-player EDuke32 in readable JavaScript, with an offline dist/index.html, menus, E1L1, gameplay, sound/music and saves. No WASM, instruction emulator, cloned engine, invented ownership, fabricated initialization or success stubs. Desktop features, multiplayer and enhanced rendering are outside the first release.

Use the single existing compiler/runtime and tools/browser_classic_profile.json. Original Make selects 113 browser units. All 113 have a matching complete parsed semantic-index checkpoint and an older uniform initial emission pass. Emission counts do not prove complete semantic extraction, successful linking or gameplay. The baseline predates the newest semantic changes and omits some out-of-line instance methods from its definition catalog.

The newest source memory ABI is source-lp64-addresses/2. Pointer fields, pointer/integer casts and C allocation share one native JavaScript address model backed by the existing ABIHeap. Standard C allocation requires whole-selected-program ownership evidence plus exact Clang C linkage/signatures. Original custom allocators remain source owned. The eight original GenericAllocator methods have actual native/Node/Chromium parity evidence; the original small-pool allocator and original console initialization remain incomplete.

Do not link the old 113-unit or October 20 emitted modules with this new memory ABI. Preserve them as historical/migration evidence and recompile affected providers and consumers. Reuse raw ASTs only under matching source/header/flag/toolchain fingerprints. Keep heavy original Clang jobs serial on the current machine.

Next boot work is the original small allocator's owned C++ member lifetimes, out-of-line instance methods, atomic/TLS and unique_ptr dependencies; console registration/hash/callback closure; canonical cross-unit template prototypes; then browser service integration and original frame yielding. Use the dependency graph and source-native comparisons. Do not replace the pool allocator with generic allocation merely to bypass boot.

The public build interface is npm run compile:game. It uses tools/build_browser_classic.py and the profile's build_root. Complete candidate construction and verification within that pipeline; preserve strict gates. The current game is not bootable, playable or deployed, and no genuine JavaScript game screenshot exists.

Configure tools with BUILD_PORTABILITY.md. On the current host:

```powershell
. work/session-env.ps1
npm run compile:game
```

Run compiler/runtime regressions, native comparisons and original Chromium gameplay checks. All reports must bind evidence to exact input/module hashes. Deliver a real asset-free public player and private offline GRP build only after actual original menu and gameplay pass, including sustained 60-second input/audio/collision/save/load checks. Until then report exact remaining failures and preserve a deterministic continuation checkpoint.

Public source repository: https://github.com/NullNRG/eduke32-readable-js. Keep GRPs, embedded asset pages, toolchains and caches out of public Git. A continuation ZIP is not a playable-game deliverable.
