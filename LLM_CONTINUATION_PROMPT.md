# Continue the existing EDuke32 readable JavaScript port

Read CURRENT_PORT_STATUS.md, CONTINUE_HERE.md, HANDOFF_SNAPSHOT.json, reports/nov19-continuation-frontier.json and the active tools/browser_classic_profile.json before changing code. Continue this single canonical compiler/runtime/source tree; preserve all existing original code, evidence, source ownership and licenses.

Target: actual classic single-player EDuke32/Build behavior in readable JavaScript, booted through original app_main and playable offline from dist/index.html. Approved low-level platform/audio services may use WASM; original game/Build code may not. No emulator, replacement engine, fake game boot or success stubs.

Current evidence: original raw E1L1 engine rendering, 20 shared regressions, 1,512 native/Chromium CON arithmetic mutations in seven storage modes, and 4,192 fixed-point arithmetic values. Original app_main/menu/gameplay remain unverified. Do not assume a playable HTML exists.

Follow the concrete repair sequence in CONTINUE_HERE.md: same-switch Gv_DivVar control flow; exact TU-private/ODR linking; real vector factory contracts; existing duplicate-storage migration; original boot/CON/menu/game loop closure; native/browser/offline acceptance. Reuse matching AST inputs and recompile affected code first. Keep heavy Clang jobs serial.

Push frequent factual source/evidence checkpoints to the configured GitHub remote with [skip ci]. Do not use paid services or publish GRPs, SDKs/caches, private asset ZIPs or asset-bearing HTML. Preserve all work and exact failed acceptance criteria if the session ends before gameplay passes.
