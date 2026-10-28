# EDuke32 Source Factory — C/C++ → modern JavaScript toolchain

## Deliverables and explicit completeness

**This is a substantial compiler *foundation*, not yet a complete EDuke32 engine port.**
The supplied single-file `index.html` is a tested native-JavaScript level reconstruction and embeds **11 original C++ functions** genuinely compiled by Clang → LLVM IR → JavaScript. It is **not** the original EDuke32 main loop / CON interpreter / actor simulation. Converting and linking the rest needs an ABI-complete backend and browser SDL/platform port. Never count source files indexed as code successfully compiled.

- Source inventory and include graph: every eligible `.c`, `.cc`, `.cpp`, `.cxx`, `.h`, `.hpp`, `.hh`, `.hxx`, `.inl` from the uploaded source archive.
- EDuke32 GNUmakefile dry-run: produces the exact selected translation-unit list, compiler flags and `compile_commands.json`.
- Original-source transpilation: `tools/compile_eduke_sources.py` compiles unchanged original C++ to LLVM IR and lowers the supported strict subset to JS, parity-tested against native C++.
- Experimental dynamic lowering: `tools/auto_lower_ir.py` discovers *all* functions in supplied LLVM IR and reports function-level pass/failure. Its generated functions are **not considered verified** until independently tested and linked.
- Header pass: `tools/header_constants.py` converts only safe, unconditional literal integers to real JavaScript `export const` declarations; records the skipped conditional definitions, overflow risks and nonliteral macros. Header declarations/types/inline bodies are not transpiled.
- Native JS runtime modules: 32-bit addressed typed heap, BigInt64, malloc/calloc/realloc/free, string and memory functions, virtual filesystem with BUILD GRP mounts, a subset of C standard I/O, explicit symbol registry and dependency checks, input, gamepad, WebAudio, Canvas2D, WebGL2 and **optional** Three.js integration. The Three.js distribution is **not** bundled (this offline build had none installed). C++ ABI/SDL/renderer parity is not implemented.
- Module packaging: `tools/bundle_modules.py` traverses static ESM imports and builds a single offline HTML using inline importmap data URLs (no CDN/fetch/runtime module files). Unknown external/dynamic imports reject the build.
- Browser bridge: 11 tested original C++ functions exported as an ES module and linked into the runtime. CRC32 `123456789` equals `cbf43926` in Chromium.
- Lint: `tools/verify_js.py` runs `node --check` on JS generated modules and strict TypeScript `checkJs` on runtime code. Optional ESLint 9 flat config is provided, but ESLint was **not installed** in the execution environment and was not falsely marked as passing.

## Quick start (inside extracted ZIP)

Prerequisites: Python 3.11+, Clang 17, Node.js 20+, TypeScript (`tsc`), GNU Make. Emscripten is **not necessary** for the verified 11-function subset. A complete engine compilation does require a fully supported C/C++-to-JS backend such as a compatible Emscripten/wasm2js toolchain *and* a browser-adapted EDuke32 port.

```bash
python3 tools/oneclick.py \
  --source input-source/eduke32-master.zip \
  --duke input-data/DUKE3D.GRP \
  --shadow input-data/SW.GRP \
  --out dist/index.html \
  --work factory-output --probe 5
```

This **one command** unpacks the original source archive, indexes all input code and header files, extracts the Makefile commands, probes the original engine, compiles and parity-tests the 11 supported functions, extracts safe header constants, runs JS linting, bundles the modules, embeds both user-supplied GRPs, and verifies their exact checksums. The output is an **offline preview** plus separate transparent blocker reports, **not** complete original EDuke32 gameplay.

Without game data, use the source compiler/auditor independently:

```bash
python3 tools/source_factory.py --source input-source/eduke32-master.zip \
  --out factory-output --probe 12 --verified-js
python3 tools/header_constants.py --source factory-output/source-tree/eduke32-master \
  --out factory-output
python3 tools/verify_js.py
node --test tests/source_factory/runtime.test.mjs
```

To attempt all Make-selected original translation units (diagnostic only, potentially very slow), run:

```bash
python3 tools/source_factory.py --source input-source/eduke32-master.zip \
  --out factory-output --probe-all --verified-js
```

**This does not synthesize C++ source semantics on failures**. It preserves the Clang errors in `factory-output/llvm/*.error.txt` and the exact unit statuses in `inventory.json`.

To regenerate an independent browser runtime page (native JS module test, **not** Duke gameplay):

```bash
python3 tools/bundle_modules.py --root . \
  --entry factory-output/bridge.mjs \
  --out factory-output/source-compiler-runtime.html
```

## Generated files

| File | Content |
| --- | --- |
| `factory-output/inventory.json` | Every source/header file, SHA-256, direct include graph, stage status, failures |
| `factory-output/compile_commands.json` | Source-selected make compile flags for tooling |
| `factory-output/include_graph.json` | Resolved includes and cycles |
| `factory-output/header-constants.mjs` | Verified-conservative numeric macro conversion to JS |
| `factory-output/header-audit.json` | Conditional, conflicting, unconverted header details |
| `factory-output/verified-engine.mjs` | Actual 11 original C++ lowered functions, ES export |
| `factory-output/bridge.mjs` | Imports and links the real lowered functions to native JS runtime |
| `factory-output/auto/autolower-manifest.json` | 16 automatically identified LLVM functions; 11 generated; five blocked |
| `factory-output/js-verification.json` | Syntax/type/lint results including unavailable lint tools |
| `factory-output/source-compiler-runtime.html` | 1-file importmap runtime smoke page |
| `dist/index.html` | Offline game reconstruction preview with original assets and new runtime bridge |

## Major unsolved tasks to achieve the **actual** requested final port

1. Resolve full EDuke32 source dependencies and SDL2 build headers and compile *all required* original C++ game/engine units for a Web target.
2. Implement a complete C++ ABI / LLVM instruction backend or use an Emscripten build with an operational wasm2js pass. Need globals, C++ constructors, vtables, function pointers, exceptions (where applicable), relocations, 64-bit values, C/C++ libraries, and cross-translation-unit calls.
3. Implement/replace browser-only SDL2/window APIs and native graphics/audio input support, plus persistent filesystem, config and game save semantics.
4. Connect the original engine's main loop, CON actor/weapon interpreter, Build renderer, dynamic levels, menus, scripting, multiplayer and audio. A Three.js *adapter* is not a replacement for an original game renderer.
5. Real end-to-end regression tests: start menu → Duke E1L1 → weapons/enemies/AI/CON events, more levels, save/load, sound, 60 seconds performance and gameplay parity. Only then claim a complete working port.

### Current measured execution

- 788 eligible source/header files **indexed**; 330 translation units; 458 headers; 156 units selected by Makefile.
- 3,040 internal include edges; 2 original C++ source units partially compiled to JS, totaling 11 verified functions.
- 2,723 safe header numeric constants emitted to JS, excluding unsafe/conditional values.
- 5 original full-engine Clang probes **failed** because `SDL2/SDL.h` is missing locally; these failures are not translated code.
- 8 new runtime tests passed, including reading the actual Duke archive.
- `node --check` and `tsc --allowJs --checkJs` passed. ESLint not installed and was not executed.
- Standalone HTML verified original GRP SHA-256 round-trip. Chromium loaded Duke E1L1, rendered, moved the player on keyboard input, and had 0 JavaScript exceptions in this test. Those frames are produced by the reconstruction renderer, **not by a compiled EDuke32 original engine**.

## Licensing

The original EDuke32 code is under its bundled license terms (including GPL-2.0 and component licenses); preserve copyright attribution when distributing derivatives. The user-provided Duke Nukem 3D / Shadow Warrior GRP archives are proprietary. They are included solely for the user's personal copy, not for redistribution without permission. No network fetch or installation is required to run the current single-file HTML.
