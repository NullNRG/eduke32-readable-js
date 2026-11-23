# Continue the existing EDuke32 readable JavaScript port

Read CURRENT_PORT_STATUS.md, CONTINUE_HERE.md, HANDOFF_SNAPSHOT.json, reports/nov23-continuation-frontier.json and the active tools/browser_classic_profile.json before changing code. Continue this single canonical compiler/runtime/source tree; preserve all existing original code, evidence, source ownership and licenses.

Target: actual classic single-player EDuke32/Build behavior in readable JavaScript, booted through original app_main and playable offline from dist/index.html. Approved low-level platform/audio services may use WASM; original game/Build code may not. No emulator, replacement engine, fake game boot or success stubs.

Current evidence: original raw E1L1 engine rendering rerun November 23, eight targeted regressions on the November 23 compiler (plus the earlier 20-test checkpoint), 1,512 native/Chromium CON arithmetic mutations in seven storage modes, 783 original CON divisions / 3,132 checked values in six storage modes, and 4,192 fixed-point arithmetic values. Original app_main/menu/gameplay remain unverified. Do not assume a playable HTML exists.

Original Gv_DivVar control flow and JavaScript-safe goto-local declarations are implemented and verified. Follow the next repair sequence in CONTINUE_HERE.md: exact TU-private/ODR linking; real vector factory contracts; existing duplicate-storage migration; original boot/CON/menu/game loop closure; native/browser/offline acceptance. Installed private helpers still require exact caller identity joins; do not invent name-only global aliases. Reuse matching AST inputs and recompile affected code first. Keep heavy Clang jobs serial.

Push frequent factual source/evidence checkpoints to the configured GitHub remote with [skip ci]. Do not use paid services or publish GRPs, SDKs/caches, private asset ZIPs or asset-bearing HTML. Preserve all work and exact failed acceptance criteria if the session ends before gameplay passes.
