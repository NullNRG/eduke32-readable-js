# EDuke32 readable JavaScript status — November 16, 2026

**Original font initialization and text parsing now execute in the JavaScript engine. The full game is still not playable: original app_main has not booted.** No verified playable standalone dist/index.html exists.

On November 17, all ten original CON structure-label tables were linked. The selected Clang target's ELF object matches all 548 label rows in Node and Chromium, including field offsets and signedness flags. Chromium runs the original `VM_InitHashTables` and matches all 548 hash lookups to their table indices. The original VM event storage is also linked. This checkpoint covers VM table initialization. `GAME.CON` compilation and gameplay remain unverified.

The existing engine-player.html accepts a local GRP/MAP and renders through the original Build engine. It remains a raw-map engine preview; no original game menu, player session or substituted gameplay is being presented.

Verified current work:

- Original allocator, console, enginePreInit/engineInit/enginePostInit, GRP/ART/MAP loading, palette setup, room and mask drawing, and presentation still execute in Chromium. The real E1L1 capture remains SHA-256 fac199fda80ebd92b83153953d1b6fe96a604373b8bdc39eac6b3b34905b7b89.
- Original G_ScanGroups recognizes/selects the supplied archive and original G_LoadGroups initializes its 456-entry resource index before engine/ART initialization. Original parsedefinitions_game/loaddefinitions_game, sound/music definition services and menu gameplay-entry storage are linked. This does not establish audio playback, CON initialization or menu rendering.
- All five original font-map functions are linked. Full original G_InitText executes twice through real ART/tile loading and original allocation. Its 1,536 mapping results and six pointer identity checks match exact original mapping statements compiled natively. Two actual 512-byte glyph buffers are allocated by the source function.
- The entire original G_ScreenTextFromString parser matches 105 native cases covering three fonts, colour escapes, case flags, numeric width, whitespace, empty input and a controlled UTF-8 mapping. Output termination/bounds are checked. This is function/component parity, not original menu or gameplay acceptance.
- Original font/game functions are unchanged. A typed standard-library service supplies the supported default-allocator unsigned/nested unordered_map operations. Native/full/filtered Node/Chromium comparisons pass 2,048 results. Custom allocation hooks and unproven multi-unit allocator ownership remain blocked. Opaque objects retain pointer identity and reject native byte-layout access; see STANDARD_LIBRARY_ADAPTERS.md.
- Incremental function refresh now preserves original storage in an immutable source shard. Private library imports verify source ownership, original type and service ABI. The old map is retained; no second map or success stub is installed.
- The previous frozen local compiler profile passed 65/65 under unchanged inputs (reports/nov16-con-lowering-ci-final.json), before the final shadowed-declaration fix. The latest revision passed all seven targeted native and browser regressions (reports/nov16-con-shadowing-regression.json). These are component tests, not game acceptance.

Additional verified controller/compiler checkpoint:

- Clang-proven trivial static aggregates retain original method prototypes and stable native storage. Range-loop method receivers alias the original subobjects; authored constructors and nontrivial destruction remain blocked. The packed-table regression matches 2,048 native/full/filtered rows in Node and Chromium, including mutation and repeated calls.
- Original CONFIG_SetGameControllerDefaults executes twice after original engine pre-initialization in Chromium, populating original mappings and restoring a changed binding. This does not verify gamepad events, full CONFIG_ReadSetup or native whole-configuration parity. The original g_myAimMode global is now linked.
- Original `C_Compile` and `C_ParseCommand` now pass structured lowering. This covers the fatal script-error branch, four same-loop jumps between parser cases and the parser's two backward retries. Both functions still lack original providers and have not executed on a CON file. `CONFIG_SetDefaults` still requires `VM_ExecuteEvent`. Locale services also remain needed by setup read/write.
- The original `G_Util_PtrToIdx2` relocation helper is linked. All four modes match native C++ in 256 cases in Node and Chromium, including sparse slots and varying strides. The full script-allocation resize path still needs execution verification.
- The updated modules passed the real resource/font/parser/E1L1 engine probe again. See reports/nov16-original-controller-defaults.json and reports/nov16-static-method-startup-frontier.json.

Earlier scoped native/component checks remain: 12 animation records/44 sound cues, argc=1 command-line defaults, original LOOKUP.DAT remaps/palettes, and E1L1 ray/movement/push geometry. See the corresponding November 13/16 reports for exact scope.

The earlier app_main catalog recorded 41 direct unresolved startup names, each potentially leading to further dependencies. The count is not a completion percentage. Major remaining work includes configuration, CON compilation/game state, menu/HUD rendering and packed ClockTicks arrays, original game rendering/interpolation, the yielding simulation/input loop, audio/music, progression, saves and offline bundling. Some scope-entering goto cases, including getzrange, remain blocked. Native gameplay parity, 60 seconds of real gameplay and the separate stable-identity 90% recovery comparison have not passed.

Use CONTINUE_HERE.md for deterministic resume commands. Preserve the single canonical classic-browser project, original sources/licenses and native semantic index d906809d. Keep heavy Clang jobs serial. Game/Build code remains readable JavaScript; only approved low-level services may use WASM. No emulation, imitation engine or fake game boot.

All verification runs locally. No paid service, cloud build or deployment was started. GitHub commits include [skip ci]. Never publish GRPs, SDKs, AST/SQLite caches or asset-bearing generated HTML.
