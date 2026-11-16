# EDuke32 readable JavaScript status — November 16, 2026

**The original Build engine renders E1L1 rooms and raw-map sprites in JavaScript. The full game is still not playable, and original app_main has not executed.** There is no verified playable standalone dist/index.html.

The asset-free engine-player.html accepts a local GRP and MAP and renders a source-engine frame. Start it with npm run serve:project. The developer index.html provides build/test/status/packaging actions. Neither page is evidence of original game boot or interactive gameplay.

Verified work retained and extended:

- Original allocator, console, enginePreInit/engineInit/enginePostInit, GRP/ART/MAP loading, palette setup, rooms, masks and window presentation execute. The actual 640×480 image is reports/evidence/nov12-original-js-engine-masks.png; 52 source map sprites are queued. No CON/player state was prepopulated.
- Original Anim_Init matches native C++ for 12 records and 44 sound cues. Original G_CheckCommandLine executes with argc=1 and matches its scoped native fixture, Node and Chromium. Other command-line branches are not covered by that comparison.
- Original G_LoadLookups executes in Node and Chromium and exactly matches 204,800 shade-remap bytes and 3,840 base-palette bytes from supplied LOOKUP.DAT. This resource oracle is not native whole-game parity.
- Original crosshair get/set palette services execute after the engine frame, with no HUD drawn. Color-table generation is slow; this does not demonstrate real-time gameplay.
- Original clipmove, pushmove, hitscan and cansee execute on actual E1L1 geometry in Node and Chromium. Eight wall rays, four movement directions and push resolution agree; native C++ verifies the original result layout. This is geometry-component verification, not native collision/game-state parity or player initialization.
- Shared compiler repairs preserve condition-declaration scope/NaN conversion, supported backward retry order, and exact cross-unit Clang overload identity. Their native/full/filtered Node/Chromium fixtures check 14,336, 4,096 and 2,048 results respectively. Unsupported object lifetimes and scope-entering jumps remain blocked.
- The frozen current local compiler CI profile passes 62/62 with unchanged inputs: reports/nov16-startup-collision-ci.json. This is the selected CI profile, not the complete historical suite or original-game acceptance.

Remaining release blockers include original app_main startup dependencies, std::unordered_map-backed font setup, loaddefinitions_game and CON/game initialization, menus/packed ClockTicks static construction, getzrange and other scope-entering jumps, the yielding original frame loop, input/combat/enemies, audio/music, progression, saves and offline bundling. The fresh font audit identifies missing nested unordered_map construction, iterator construction and reference assignment; no tilefont root or G_InitText is being marked recovered (reports/nov16-original-font-blockers.json). The current app_main catalog is reports/nov16-app-main-current-frontier.json. Zero invalid component imports does not imply a complete global game link; unresolved ownership groups remain. The separate stable-identity 90% recovery measurement is unfinished.

Use CONTINUE_HERE.md for exact resume commands. Keep the single canonical classic-browser project, original sources/licenses, verified storage and native semantic index d906809d. Keep heavy Clang work serial and reuse unchanged ASTs. Original game/Build code remains readable JS; only approved low-level services may use WASM. No engine emulation, substitute game, fabricated boot or success stubs.

All work and verification run locally. No paid service or hosted build was started. GitHub checkpoints use [skip ci]. Never publish GRPs, SDKs, raw AST/SQLite caches or asset-bearing generated HTML.
