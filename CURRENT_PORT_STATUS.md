# Current EDuke32 JavaScript port status — November 23, 2026

The original Build engine renders a raw E1L1 scene in Chromium through readable JavaScript. **Original `app_main`, game menus and playable simulation have not been verified. A playable `dist/index.html` has not been produced.** The strict release gate continues to reject delivery.

## November 23 compiler checkpoint

The source control-flow pass now recognizes terminal case/default-label suffixes that break out of the same original switch. Seven targeted regressions pass, including 4,608 native/full/filtered Node/Chromium comparisons and rejection of nested-control/entered-storage transfers. Original Gv_DivVar recovery is running; linking/execution is not yet claimed. [Regression evidence](reports/nov23-switch-break-regressions.json)

A newline-only header-witness mismatch from the previous checkpoint was repaired by reconstructing the exact previously attested CRLF bytes and matching the unchanged recorded SHA-256. Ownership/ABI checks remain enabled. Git already preserves raw bytes. [Restoration evidence](reports/nov23-header-witness-restoration.json)

## Verified current checkpoint

- **20/20 shared compiler/runtime regressions pass** under frozen inputs. [Results](reports/nov19-final-shared-regressions.json)
- The original nine CON arithmetic helpers execute in Chromium and match **1,512 native mutations / 6,048 checked values** across global, per-player, per-actor, int32, int16, Q16 and raw-Q16 storage. The original 32-byte game-variable storage is checked. This is function-level verification; complete VM byte-storage parity and CON execution are not claimed. [Evidence](reports/nov19-original-con-variable-operators.json)
- The original fixed-point implementation unit links with 29 definitions and no blockers in that unit. Eight arithmetic/saturation functions match **4,192 native/Chromium values**. Original integer-to-fixed conversion separately matches 519 cases. [Arithmetic](reports/nov19-original-fix16-arithmetic.json) · [Conversion](reports/nov19-original-fix16-integer-conversion.json)
- The current source modules run original allocator/engine initialization, GRP recognition/loading, ART/MAP loading, palettes, room/mask drawing, font initialization and presentation. The full renderer rerun has zero page exceptions and reproduces the E1L1 capture below. The canonical component manifest confirms evidence matches current module/runtime bytes. [Current rendering proof](reports/nov19-original-text-startup-frame.json) · [Fresh pre-initialization](reports/nov19-current-engine-component.json)
- Original font initialization checks 1,536 mapping entries and six pointer identities; the original text parser matches 105 native cases. Original user-map lookup matches native C++ in 36 Chromium cases with the original 2,036-byte user_defs layout. [User-map query](reports/nov19-original-user-map-query.json)

![Original JavaScript Build renderer; raw E1L1 engine test, not gameplay](reports/evidence/nov19-original-text-startup.png)

## Implemented shared fixes

Authored copy/move operations invoke the original Clang-selected constructor bodies, preserving side effects, moved-from mutation and independent objects. Verified integer addresses can expose existing scalar class storage and original methods without running constructors. These borrowed views require exact native layouts, retain bounds checks, and do not authorize aggregate copying or unproven pointer-owning classes.

Incremental recovery reuses unchanged immutable header arrays, primitive constants and typedef constants after exact initializer/helper checks. Function refresh can preserve the original storage, untouched helpers and verified class factories; retained definitions that capture a replaced function are rejected. Targeted header selection avoids compiling unrelated inline bodies. Exact declaration joins retain body/type/overload checks while excluding source callers that cannot match.

## Open issues and next work

The current component audit has **zero invalid imports, 46 ambiguous ownership groups and two source units with duplicate-storage findings**. These component results do not establish whole-program linkage. [Machine-readable issues and repair approach](reports/nov19-continuation-frontier.json)

1. Recover original `Gv_DivVar`: its jump to a flat default-label suffix ending in `break` needs exact same-switch control/lifetime proof.
2. Resolve same-TU private header-function ownership and template ODR ambiguity without name-only aliases, duplicated state or arbitrary overload selection.
3. Resolve the original vec2/vec3 factory method/layout contracts. A real emitted provider must supply every required original method; anonymous-union/native-alias proofs must remain strict.
4. Repair existing duplicate header storage in engine.cpp and savegame.cpp, preserving one original address/cell and actual source initializers. The exact duplicates are in the issue report.
5. Refresh and close original `app_main` startup: script compilation, configuration/exit chains, menus and game state. Then integrate original yielding simulation, rendering, controls, audio/music, progression and saves.
6. Verify all selected units under one current compiler revision, the native game comparison, 60 seconds of actual gameplay and the self-contained offline player.

The classic profile selects **111 native units** and excludes desktop dialogs, enhanced rendering, multiplayer and optional codecs. All selected units were parsed previously; only 69 units currently have partial browser modules. This is not uniform current-revision JavaScript completion. Historical 156-unit inventories and export totals use different configurations/counting methods.

The latest complete VM probe passed source lowering but had 136 unresolved references and one vec3 factory rejection. It was a 32-query probe before later helper changes, not a current comprehensive blocker count. The acceptance report also contains stale 113-unit attempt evidence with two excluded allocator units; configuration/build provenance must be reconciled. [Strict acceptance](reports/nov19-current-release-acceptance.json)

Use [CONTINUE_HERE.md](CONTINUE_HERE.md) for exact commands and implementation locations. Preserve readable original game/Build JavaScript. Native WASM is permitted only for the approved low-level platform/audio utilities. No substitute engine, fake boot, success stubs or emulation. Verification stays local; checkpoint pushes use [skip ci]. Never publish GRPs, SDKs, caches or asset-bearing HTML.
