# Continue the canonical EDuke32 project

Read CURRENT_PORT_STATUS.md, HANDOFF_SNAPSHOT.json and reports/nov12-original-rooms-frame.json. Original E1L1 room rendering now passes in Chromium. The game remains incomplete: app_main, menu, CON, masks/sprites and gameplay have not passed.

User constraint: do not use paid external services. Compile and verify locally.
GitHub checkpoint commits must include `[skip ci]` to avoid starting cloud
Actions builds; no additional hosted compute, deployments or paid APIs.

November 12 follow-up: original mask/sprite dependencies are now linked and execute in Chromium. Read reports/nov12-original-masked-frame.json. The real image includes rooms, fences and raw-map props. Repeated presentation is stable after the SDL RGBX/alpha repair. This is an engine component, not app_main/CON/gameplay. Continue original startup/menu/frame-loop recovery and packed static-array construction with ClockTicks for rotatesprite.

```powershell
. work/session-env.ps1
python work/verify_original_masked_frame.py
python work/recover_boot_reachable.py source/duke3d/src/game.cpp app_main --whole-unit --install-closed-leaves
python work/reproduce_source_ci.py
python tools/recover_browser_component.py --snapshot
```

The renderer uses original ART/MAP loading, original G_InitMultiPsky with original dnames globals, original palette/video calls and original renderDrawRoomsQ16. Do not replace missing game initialization with hand-built data. The room capture is source-engine component evidence and must not be called playable gameplay.

The mask lambdas and classic sprite sibling jump are recovered. UI rotatesprite still needs packed static-array construction with ClockTicks members. Recover generic source semantics and retry their full affected chains. Continue original game.cpp app_main/CON/menu startup after engine rendering. Keep heavy Clang jobs serial.

Existing exports do not mean their generated bodies were refreshed. For shared fixes, find the exact active module_fragments entry and refresh its complete export set using tools/recover_browser_component.py --refresh-fragment-sha256 HASH --whole-unit-refresh. That mode preserves original storage and the exact prior interface, uses source-proven header aliases only when required, and omits unrelated explicit all-header selection. Never bypass its ABI/identity checks. Use a fresh browser realm after replacing a fragment.

The native semantic index already matches the 111-unit portable-codec profile (d906809d). Compiler-only repairs do not require replaying the native index. Do not trigger a changed-input generic index resume; targeted primary-unit semantic refresh must verify all unchanged commands/header observations. The compressed private index payload is an older historical fingerprint; the verified macro-only delta is reports/nov11-portable-semantic-delta.json.

The last local CI reproduction passed 57/57 before the SDL display follow-up; 22 relevant Node checks and real Chromium runtime/original masked-frame checks pass after it; full regression and strict original-game acceptance remain incomplete. No playable dist/index.html exists. Keep pushing source, active modules, exact evidence and factual notes to NullNRG/eduke32-readable-js. Never push GRPs, SDKs, raw AST/SQLite caches or asset-bearing generated HTML. Do not publish a playable release until original boot/menu/gameplay/offline/save/audio checks pass.
