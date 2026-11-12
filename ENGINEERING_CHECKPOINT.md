# EDuke32 readable JavaScript checkpoint — November 12, 2026

**Original E1L1 rooms and sprites now render in Chromium through the original Build engine in readable JavaScript. The game is not yet playable.** Original app_main, CON/game initialization, menus, player controls, weapons/enemies, audio, saves and sustained gameplay remain unverified. No verified playable dist/index.html exists.

![Original JavaScript Build rooms and sprites; raw map engine component, not gameplay](reports/evidence/nov12-original-js-engine-masks.png)

The actual source path executes allocator/engine/console initialization, original GRP/ART/MAP loading, original G_InitMultiPsky and palette/view setup, renderDrawRoomsQ16, renderDrawMasks and videoShowFrame. The engine queues 52 map sprites; masks change 23,695 displayed pixels. The 640×480 final capture has 126 colors and 219,481 nonblack pixels. Repeating presentation without drawing changes zero pixels. Eight original divideu32_noinline boundary cases also pass. Exact module/runtime hashes, source trace and PNG evidence are in reports/nov12-original-masked-frame.json. The PNG SHA-256 is fac199fda80ebd92b83153953d1b6fe96a604373b8bdc39eac6b3b34905b7b89.

This is raw MAP engine state. Original game/CON sprite animation and app_main have not executed. The screenshot must not be labeled a playable session, original game boot, complete level acceptance or a 60-second gameplay test.

Shared compiler work now lowers proved local reference lambdas, sibling branch tails plus original postludes, exact anonymous-union destruction/layout traits, and persistent packed function-static POD construction. The original voxel division callback, classicDrawVoxel, classicDrawSprite, renderDrawSprite and renderDrawMasks are linked. No original function was replaced by a stub. The first masked-frame probe exposed zero-alpha window presentation; the browser adapter now exposes an opaque SDL RGBX window surface and copies X padding to opaque transfer alpha without modifying original framebuffer bytes.

Verification: 57/57 local compiler CI-profile checks passed before the display follow-up; 22 relevant Node SDL/display tests and the real Chromium runtime check pass after that follow-up, along with this original masked frame. Scoped native/full/filtered Node/Chromium fixtures cover 3,072 lambda results, 1,024 branch-tail results and 2,048 static POD results. The complete current regression suite and strict original-game acceptance remain incomplete. The partial graph still has unresolved ownership/storage groups and is not a whole-program link.

Next: complete original app_main/CON/menu startup and the original frame loop. UI rotatesprite still needs exact packed static-array construction with ClockTicks members. Native game-state parity, interactive input/combat, sound/music, progression, saves, offline bundling and sustained gameplay must pass before a release. The separately required 90% declaration recovery comparison is also unfinished. Do not count optional desktop exclusions as recovered game functions.

Use CONTINUE_HERE.md for deterministic commands. Preserve source, licenses, selected classic profile and semantic index d906809d; compiler-only changes do not require re-extracting 111 native units. Keep heavy Clang jobs serial. Original game/Build code remains readable JavaScript; only approved low-level services may use native WASM. No emulation, cloned engine or fake boot/gameplay.

User cost constraint: use local compilation and browser verification. No paid external services or additional cloud builds. GitHub checkpoint commits include [skip ci]. Do not upload GRPs, SDKs, raw AST/SQLite databases or asset-bearing player HTML.
