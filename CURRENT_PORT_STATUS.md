# Current EDuke32 JavaScript port status — November 25, 2026

The original Build engine renders a raw E1L1 scene in Chromium through readable JavaScript. **Original `app_main`, game menus and playable simulation have not been verified. A playable `dist/index.html` has not been produced.** The strict release gate continues to reject delivery.

## November 25 startup callables and CON compiler

The original startup module now has exact Clang identities for eight previously emitted private functions, including `G_Cleanup`, `G_FatalEngineInitError`, and the original allocation wrappers. The attestation verifies the archived producer and preserves the active JavaScript bytes. The original wrappers passed 128 allocation, reallocation, and cleanup cases in Node, preserving 8,256 bytes. The bounded CON probe lowers both `C_Compile` and `C_ParseCommand` and still requires original parser, configuration, and game exit providers. [Startup identities](reports/nov25-original-startup-callables.json) · [Runtime smoke test](reports/nov25-startup-helper-execution.json) · [CON frontier](reports/nov25-original-con-compiler-frontier.json)

The 18-query entry probe lowers the original `app_main` and `G_Startup`. It reports 39 direct unresolved names for the entry. The original fatal-error callback and allocator teardown now resolve inside that probe. `G_CompileScripts` has three direct unresolved names in the same run, `C_Compile`, `G_GameExit`, and `VM_OnEvent`. [Entry frontier](reports/nov25-entry-after-attestation.json) · [Strict release status](reports/nov25-current-release-acceptance.json)

The active modules also gained verified identities for 22 existing private CON parser callables and the original post-load palette callback. Four original token classifiers matched 1,280 native Clang outcomes in both Node and Chromium. These identities preserve the original JavaScript implementation bytes. [Parser callable identities](reports/nov25-con-parser-callables.json) · [Classifier parity](reports/nov25-original-con-token-classification.json) · [Palette callback identity](reports/nov25-game-palette-callable.json)

## November 24 original entry lowering checkpoint

The original game module imports directly in Chromium. The compiler now reconnects the Clang-selected `ClockTicks::operator int` conversion used by `app_main` and resolves static forward declarations through Clang's redeclaration chain. The latest 16-query diagnostic lowers the original entry and leaves **40 direct unresolved names**, down from 42 in the earlier probe. The original logging callback and game-button registration execute directly in Node. `G_Startup` awaits the original CON and error-handling dependencies. The strict release check still requires linked startup, game menus, playable simulation and the offline page. [Entry frontier](reports/nov24-app-main-private-redeclarations.json) · [Startup frontier](reports/nov24-original-entry-frontier.json) · [Helper execution](reports/nov24-original-entry-helper-execution.json)

## November 24 save descriptor startup checkpoint

The compiler now emits Clang-proven numeric extents for direct, type-derived array calls in static initializers. The original save descriptor uses its native 2,048-element count and retains its deferred pointer to `g_origins`. The address runtime now forms the address of typed scalar storage without reading the uninitialized value of `g_deleteQueueSize`. Sector-first Chromium loading passes and verifies both original descriptor addresses. Fresh engine startup also passes with no page exceptions. The original game, globals and savegame modules can each load first in a fresh Node runtime. [Native extent](reports/nov24-original-save-array-extent.json) · [Start order and tag checks](reports/nov24-original-sector-tags.json) · [Engine startup](reports/nov24-engine-after-save-initialization.json)

## November 24 storage and sector checkpoint

The active module audit now finds zero duplicate source storage and zero invalid imports. The original engine constant keeps a single address cell. Recompiling the original `G_Util_PtrToIdx2` replaced a historical savegame shard with a single active function and preserved its native relocation behavior across 40,960 compared words. The original player timer cell is linked. Four sector helpers link, with 4,096 native/Chromium values checked for the two sector tag queries. [Relocation parity](reports/nov24-original-script-relocation-full-parity.json) · [Sector parity](reports/nov24-original-sector-tags.json)

The latest completed bounded VM probe measured 89 unresolved names and two ABI rejections affecting four candidates before the timer and sector installs. The timer lowers but remains behind `G_UpdateScreenArea` and `videoCaptureScreen`. The normal engine-first browser startup test passes on the active modules. The two early reads exposed by sector-first import were fixed in the newer checkpoint above. [VM frontier](reports/nov24-vm-current-frontier.json) · [Timer frontier](reports/nov24-original-game-timer-frontier.json) · [Current engine verification](reports/nov24-current-engine-after-storage.json)

## November 24 scalar writer and angle helper

The active component includes the original `VM_SetStruct` and `G_GetAngleDelta`. Chromium matched the native C++ source on 768 scalar writes and 2,049 angle deltas. The writer test checks every byte, including adjacent bytes that must stay intact. The compiler also normalizes the switch expression and labels to their Clang integer types, including in recovered resume dispatches. Four targeted regressions pass. [Original function results](reports/nov24-original-vm-leaves.json) · [Compiler regressions](reports/nov24-switch-discriminant-regressions.json)

The bounded VM probe after installing both helpers reports **91 unresolved names**, down from 93. Its two rejected imports still require an actor alias and nested prototype proof and a compatible vec3 factory. It was measured before the subsequent scalar field compiler fix, which passes six targeted regressions. The original game entry point is still absent. [VM diagnostic](reports/nov24-vm-provider-frontier.json) · [Field and pointer regressions](reports/nov24-cast-field-regressions.json)

Opaque pointer casts used directly for scalar member access now preserve the original field offset through anonymous unions and structs. The compiler keeps the original object extent and alignment checks. Original `P_GetP`, `A_CheckEnemySprite` and the enemy tile flag helper link. Chromium matched native C++ on 512 original sprite queries, and all seven field and pointer regressions passed. [Sprite queries](reports/nov24-original-sprite-queries.json) · [Regressions](reports/nov24-anonymous-cast-regressions.json)

## November 23 shared-provider and integer-semantics checkpoint

Nineteen existing original helpers now have verified same-TU callable contracts; together with the ten CON operators, 29 calls bind through original Clang identity and implementation bytes. Typed readers were recompiled after fixing native 64-bit switch labels emitted as JavaScript Numbers. Shared constant lowering now substitutes only Clang-proven non-ODR integral uses; address and volatile uses retain storage dependencies.

- **13/13 targeted regressions pass**, including 3,072 native/Node and 3,072 Chromium constant values, and 4,096 native/Node and 4,096 Chromium switch values. [Results](reports/nov23-header-value-regressions.json)
- Original math/random and allocation wrappers pass **5,120 native/Chromium values** with zero allocation leaks. Allocation failure behavior is outside this successful-allocation test. [Results](reports/nov23-original-bulk-vm-helpers.json)
- Original array-size/value and scalar readers pass **588 native/Chromium values**, covering six array storage modes, both strides and six scalar modes. [Results](reports/nov23-original-vm-array-access.json)
- The same bounded VM probe now has **93 unresolved names and two ABI-rejected imports affecting five candidate definitions**. Thirteen original tile constants become native constant values. Original `A_Dodge` lowers but remains ABI-blocked; it is not counted as linked. [Frontier](reports/nov23-vm-provider-frontier.json)

The actor provider already has contiguous native storage. Its remaining mismatch is nested vector prototype requirements, not a missing actor buffer. Preserve storage; prove the actual consumer operations and required original vector methods before relaxing any projection contract. The separate vec3 factory also remains rejected. The prior checkpoint below is retained as history.

## November 23 compiler checkpoint

TU-private callable reuse is now implemented through Clang-selected mangling/type, original body/offset and full preprocessor fingerprints. Imports verify the exact defining implementation bytes and same-TU ownership. Ten targeted linker/compiler regressions pass, including 1,536 native/Node/Chromium values for mixed public/private overloads, shared statics, callback identity and separate TU state. All ten original CON arithmetic/division operators now bind in original VM callsites, reducing the same bounded probe from 136 to 126 unresolved references. No JavaScript implementation bytes changed. [Regression evidence](reports/nov23-tu-callable-regressions.json) · [Original callsite proof](reports/nov23-vm-tu-callable-closure.json)

The source control-flow pass now recognizes terminal case/default-label suffixes that break out of the same original switch. Eight targeted regressions pass, including 4,608 native/full/filtered Node/Chromium comparisons and rejection of nested-control/entered-storage transfers. Goto-local declarations now use the same JavaScript-safe spelling as their references, fixing the original C++ local named `var`. [Regression evidence](reports/nov23-switch-break-regressions.json)

Original `Gv_DivVar` is linked and passes **783 native/Chromium divisions / 3,132 checked values** across global, per-player, per-actor, int32, int16 and Q16 storage. Original `enginePreInit` initializes the divider tables. Defined nonzero division inputs are tested; full VM execution is not claimed. The existing nine arithmetic helpers still pass all 1,512 mutations after integration. [Division evidence](reports/nov23-original-con-division.json)

A newline-only header-witness mismatch from the previous checkpoint was repaired by reconstructing the exact previously attested CRLF bytes and matching the unchanged recorded SHA-256. Ownership/ABI checks remain enabled. Git already preserves raw bytes. [Restoration evidence](reports/nov23-header-witness-restoration.json)

## Verified current checkpoint

- **13/13 targeted compiler/linker regressions pass** on the latest November 23 compiler. The preceding TU-callable checkpoint passed 10/10 on its recorded inputs. The earlier switch checkpoint passed 8/8 tests and the November 19 checkpoint passed 20/20 under their recorded inputs; a new complete historical-suite run is not claimed. [Current results](reports/nov23-header-value-regressions.json) · [Earlier results](reports/nov19-final-shared-regressions.json)
- The original nine CON arithmetic helpers execute in Chromium and match **1,512 native mutations / 6,048 checked values** across global, per-player, per-actor, int32, int16, Q16 and raw-Q16 storage. The original 32-byte game-variable storage is checked. This is function-level verification; complete VM byte-storage parity and CON execution are not claimed. [Evidence](reports/nov19-original-con-variable-operators.json)
- The original fixed-point implementation unit links with 29 definitions and no blockers in that unit. Eight arithmetic/saturation functions match **4,192 native/Chromium values**. Original integer-to-fixed conversion separately matches 519 cases. [Arithmetic](reports/nov19-original-fix16-arithmetic.json) · [Conversion](reports/nov19-original-fix16-integer-conversion.json)
- The November 23 source modules run original allocator/engine initialization, GRP recognition/loading, ART/MAP loading, palettes, room/mask drawing, font initialization and presentation. The full renderer rerun has zero page exceptions and reproduces the E1L1 capture below. Its evidence records actual module/runtime hashes. [Current rendering proof](reports/nov23-original-text-startup-frame.json)
- Original font initialization checks 1,536 mapping entries and six pointer identities; the original text parser matches 105 native cases. Original user-map lookup matches native C++ in 36 Chromium cases with the original 2,036-byte user_defs layout. [User-map query](reports/nov19-original-user-map-query.json)

![Original JavaScript Build renderer; raw E1L1 engine test, not gameplay](reports/evidence/nov23-original-text-startup.png)

## Implemented shared fixes

Authored copy/move operations invoke the original Clang-selected constructor bodies, preserving side effects, moved-from mutation and independent objects. Verified integer addresses can expose existing scalar class storage and original methods without running constructors. These borrowed views require exact native layouts, retain bounds checks, and do not authorize aggregate copying or unproven pointer-owning classes.

Incremental recovery reuses unchanged immutable header arrays, primitive constants and typedef constants after exact initializer/helper checks. Function refresh can preserve the original storage, untouched helpers and verified class factories; retained definitions that capture a replaced function are rejected. Targeted header selection avoids compiling unrelated inline bodies. Exact declaration joins retain body/type/overload checks while excluding source callers that cannot match.

## Open issues and next work

The earlier component audit had **zero invalid imports, 46 ambiguous ownership groups and two source units with duplicate-storage findings**. Both duplicate storage findings are repaired in the checkpoint above. These component results do not establish whole-program linkage. [Machine-readable issues and repair approach](reports/nov23-continuation-frontier.json)

1. Completed November 23: original `Gv_DivVar` same-switch control flow, JavaScript-safe local declarations, linking and native/Chromium division verification. Continue with shared ownership and VM closure below.
2. Roll out the verified TU-callable contract to remaining provider candidates. Refresh original functions with exact source/implementation proofs; handle immutable constants and template ODR identities separately. Do not add name-only aliases or duplicate state.
3. Resolve the original vec2/vec3 factory method/layout contracts. A real emitted provider must supply every required original method; anonymous-union/native-alias proofs must remain strict.
4. Repair existing duplicate header storage in engine.cpp and savegame.cpp, preserving one original address/cell and actual source initializers. The exact duplicates are in the issue report.
5. Refresh and close original `app_main` startup: script compilation, configuration/exit chains, menus and game state. Then integrate original yielding simulation, rendering, controls, audio/music, progression and saves.
6. Verify all selected units under one current compiler revision, the native game comparison, 60 seconds of actual gameplay and the self-contained offline player.

The classic profile selects **111 native units** and excludes desktop dialogs, enhanced rendering, multiplayer and optional codecs. All selected units were parsed previously; only 69 units currently have partial browser modules. This is not uniform current-revision JavaScript completion. Historical 156-unit inventories and export totals use different configurations/counting methods.

The latest November 23 VM probe passes source lowering but still has **93 unresolved names and two ABI-rejected imports affecting five candidate definitions**. The preceding 126-name provider inventory is historical; 29 current call bindings now verify. Prioritize original-provider refresh and exact constant identities before reimplementing existing helpers. This is a 32-query diagnostic, not a comprehensive whole-program count. The acceptance report still contains stale 113-unit attempt evidence with two excluded allocator units; configuration/build provenance must be reconciled. [Current VM frontier](reports/nov23-vm-provider-frontier.json) · [Strict acceptance](reports/nov23-current-release-acceptance.json)

Use [CONTINUE_HERE.md](CONTINUE_HERE.md) for exact commands and implementation locations. Preserve readable original game/Build JavaScript. Native WASM is permitted only for the approved low-level platform/audio utilities. No substitute engine, fake boot, success stubs or emulation. Verification stays local; checkpoint pushes use [skip ci]. Never publish GRPs, SDKs, caches or asset-bearing HTML.
