# Continue the canonical EDuke32 project

Read CURRENT_PORT_STATUS.md, HANDOFF_SNAPSHOT.json and reports/nov12-original-rooms-frame.json. Original E1L1 room rendering now passes in Chromium. The game remains incomplete: app_main, menu, CON, masks/sprites and gameplay have not passed.

```powershell
. work/session-env.ps1
python work/verify_original_rooms_frame.py
python work/recover_boot_reachable.py source/build/src/engine.cpp renderDrawMasks --install-closed-leaves
python work/reproduce_source_ci.py
python tools/recover_browser_component.py --snapshot
```

The renderer uses original ART/MAP loading, original G_InitMultiPsky with original dnames globals, original palette/video calls and original renderDrawRoomsQ16. Do not replace missing game initialization with hand-built data. The room capture is source-engine component evidence and must not be called playable gameplay.

The current mask frontier is lambda closure/call lowering. classicDrawSprite also has a sibling-scope jump, and UI rotatesprite storage is still blocked. Recover generic source semantics and retry their full affected chains. Continue original game.cpp app_main/CON/menu startup after engine rendering. Keep heavy Clang jobs serial.

Existing exports do not mean their generated bodies were refreshed. For shared fixes, find the exact active module_fragments entry and refresh its complete export set using tools/recover_browser_component.py --refresh-fragment-sha256 HASH --whole-unit-refresh. That mode preserves original storage and the exact prior interface, uses source-proven header aliases only when required, and omits unrelated explicit all-header selection. Never bypass its ABI/identity checks. Use a fresh browser realm after replacing a fragment.

The native semantic index already matches the 111-unit portable-codec profile (d906809d). Compiler-only repairs do not require replaying the native index. Do not trigger a changed-input generic index resume; targeted primary-unit semantic refresh must verify all unchanged commands/header observations. The compressed private index payload is an older historical fingerprint; the verified macro-only delta is reports/nov11-portable-semantic-delta.json.

The last local CI reproduction passed 54/54 and runtime Node checks 22/22; full regression and strict original-game acceptance remain incomplete. No playable dist/index.html exists. Keep pushing source, active modules, exact evidence and factual notes to NullNRG/eduke32-readable-js. Never push GRPs, SDKs, raw AST/SQLite caches or asset-bearing generated HTML. Do not publish a playable release until original boot/menu/gameplay/offline/save/audio checks pass.
