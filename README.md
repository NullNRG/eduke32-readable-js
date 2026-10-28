**DEFAULT: SOURCE-FIRST READABLE JAVASCRIPT.** See `SOURCE_FIRST_STATUS.md` and `npm run compile:readable`. The old LLVM-lowered JS backend is legacy diagnostic tooling only; `npm run compile:game` is strict and cannot fake a playable output.

---

# CURRENT ARCHITECTURE ALERT — SOURCE-FIRST REBUILD

**The readable C/C++ → JavaScript target is `tools/source_ast_to_js.py`, not `tools/whole_program.py`.**
The old LLVM-backend output is retained solely as legacy comparison data, not as the
requested readable port. The new source-first compiler is **not yet a whole-game transpiler**.
See [`SOURCE_FIRST_STATUS.md`](SOURCE_FIRST_STATUS.md) for verified progress, blockers,
and reproduction commands. No Duke frames have been verified from source-first JS.

---

# EDuke32 C/C++ → JavaScript: verified partial transpiler and standalone gameplay preview

**Status: executable browser PREVIEW, NOT a complete EDuke32 port.** This checkpoint uses the user's original August 2026 EDuke32 archive, Duke Nukem 3D and Shadow Warrior GRP data. It separates demonstrably transpiled C++ functions from a JavaScript map reconstruction. Calling the preview a complete EDuke32 recompilation would be incorrect.

## Open it now

- `dist/index.html`: ONE offline HTML document with both original GRP archives and game selector. No external links, fetches or `.wasm` required.
- `dist/duke-only.html`: lighter Duke3D-only offline HTML; recommended for first testing.
- `dist/shadow-only.html`: lighter Shadow Warrior-only HTML.

After opening, choose a map and **Explore level**; WASD to move, arrows to turn, mouse pointer-lock to look, Space to jump, F to fire, Tab map, E use, Menu to return. On touch screens, joystick/look/fire controls are present. Builds draw original sectors, walls, artwork and some sprites. The main renderer uses WebGL2; a new self-contained Canvas2D software raycaster is used when WebGL2 is unavailable. The CPU fallback is verified by headless Chromium with real original E1L1 / $BULLET map data and keyboard movement.

## Source-to-JS transpiler now implemented

`tools/compile_eduke_sources.py` takes **unchanged C++ files** from the original user's EDuke32 source archive, compiles them with installed LLVM/Clang at `-O1 -S -emit-llvm`, then `tools/llvm_ir_to_js.py` generates **executable JavaScript** from Clang's SSA control-flow graph. It supports the tested subset: integer operations, branches, phi nodes, load/store, constant-array GEP and linear memory. The output is `web/compiled_engine_crc32.js`, embedded inside every HTML build.

Verified original source functions:

- `Bcrc32`, `initcrc32table` — original `source/build/src/crc32.cpp` (included in the playable player for actual archive diagnostics).
- `fix16_add`, `fix16_sub`, `fix16_sadd`, `fix16_ssub`, `fix16_mul`, `fix16_smul`, `fix16_lerp8`, `fix16_lerp16`, `fix16_lerp32` — original `source/build/src/fix16.cpp` (compiled and parity-tested; engine gameplay not yet linked to these functions).

**63** CRC32 tests and **12,044** original fixed-point add/sub assertions PASS; the five newly transpiled mul/lerp functions also pass **7,000** results checked against the C++ functions compiled into a native shared library from the same EDuke32 source. Clang also compiles more original source to LLVM IR; however the strict subset translator rejects unsupported IR, so **the 11 verified functions are the only compiled C++ functions claimed in this build**. The full EDuke32 source tree is included unmodified for future development.

### Build and verify

**Single reproducible command** (accepts your original source ZIP directly and emits one standalone HTML):

```bash
python3 tools/rebuild.py --source-zip input-source/eduke32-master.zip \
  --duke /path/to/DUKE3D.GRP --shadow /path/to/SW.GRP --out dist/index.html
```

Requires Python 3, Clang/LLVM 17+, and Node.js. The command unpacks the original source into a temporary folder, compiles and tests 11 unchanged C++ functions, packages the game data, and verifies the GRP archive checksums. It refuses to claim unsupported functions were translated. Run `python3 tests/run_inline_browser.py dist/index.html` for a Chromium smoke test when Playwright and Chromium are installed.

## Honest engine completeness

- ✅ Compiled into JS: 11 genuine EDuke32 C++ utility/math functions (manifest in `dist/llvm-transpiler-manifest.json`). No manual recreation for those functions.
- ✅ Data: all 41 Duke and 28 Shadow MAPs parse, tile palettes/textures unpack, original GRP exact SHA-256 round-trip.
- ✅ Browser: real in-game frames, keyboard movement, original textures, sector traversal; both games tested separately using Chromium Canvas2D fallback and without any network requests.
- ⚠️ The **rest of original EDuke32 C/C++ gameplay logic is NOT compiled**. The map preview is authored native JS, not C++ translated gameplay.
- ❌ No original EDuke32 software/Polymost/Polymer renderer, weapon and CON execution, savegames, dynamic sectors, accurate sprites, multiplayer, UI or sound system parity.
- ❌ Entire EDuke32 executable compiled to JS-only, single HTML: requires a working Emscripten/SDL browser platform port, C/C++ linker dependencies and full wasm2js or equivalent backend. Not provided by the source ZIP; Emscripten SDK/wasm2js not available here. `tools/eduke32_to_js.py` is **only a driver** for a previously browser-adapted source tree.

## Remaining path to a full native-game port

The **full** EDuke32 engine still cannot be compiled with the included strict-subset LLVM text translator: it does not implement ABI-compliant structs, arbitrary globals, C++ exceptions/RTTI, native call conventions, LLVM intrinsics, function pointers, SDL/graphics/audio, filesystem/OS services, or inter-module linking. Only the explicitly allowlisted verified functions are converted. Source audit tooling intentionally rejects unsupported functions rather than emitting bogus JavaScript.

Use the included `tools/eduke32_to_js.py` with a **browser-adapted EDuke32 source fork**, Emscripten SDK and its wasm2js backend for a full build. The provided source archive lacks a browser platform implementation. Two publicly documented candidate sources are DigitalCyberSoft/eduke32-wasm and the EDuke32 Emscripten merge request !365. Neither source fork is bundled or silently substituted for the user's original code. A `.wasm` build is not a JS-only conversion; `-sWASM=0` must be verified with the SDK version used.

## Licensing and use

`input-source/` contains the unmodified user-supplied source ZIPs. EDuke32 / BUILD engine licenses remain attached to the original source code. `Bcrc32` code originates under zlib terms; fix16 code has its own upstream licensing. The user-provided retail GRP archives are **proprietary** and are embedded solely at the user's request. Do not distribute this artifact publicly without the appropriate rights.


**Latest checkpoint:** See `CONTINUATION_STAGE17.md`, `STAGE17_RESULTS.json`, `STAGE17_BLOCKERS.md`. Not yet playable.


**Latest checkpoint:** See `CONTINUATION_STAGE17.md`, `STAGE17_RESULTS.json`, `STAGE17_BLOCKERS.md`. Not yet playable.
