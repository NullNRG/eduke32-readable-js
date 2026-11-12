# Continue the canonical EDuke32 project

Read CURRENT_PORT_STATUS.md, HANDOFF_SNAPSHOT.json and reports/nov11-original-tile-pixels.json. The game remains incomplete. Preserve this canonical codebase and original source/license notices.

```powershell
. work/session-env.ps1
python work/verify_original_tile_pixels.py
python work/verify_portable_lz4_diagnostic.py --canonical
python work/recover_boot_reachable.py source/build/src/engine.cpp renderDrawRoomsQ16,renderDrawMasks,videoSetViewableArea,renderSetAspect --install-closed-leaves
python work/reproduce_source_ci.py
python tools/recover_browser_component.py --snapshot
```

Heavy Clang jobs must remain serial. The rendering command may leave a partial frontier; inspect it and recover shared source dependencies, never fill missing source functions with stubs. Original ART/cache loading and pixel bytes are verified, but app_main/CON/menu/world rendering/gameplay are not. Diagnostic/native screenshots must not be labeled JavaScript gameplay.

The semantic index already matches the portable codec profile. Do not reset it with a changed-command generic resume. tools/refresh_semantic_unit.py supports --before-commands for a verified one-unit macro-only change; all unrelated commands and header semantics must remain identical. The older private compressed checkpoint has a different historical fingerprint.

Use work/reproduce_source_ci.py for current 52-check local CI reproduction. Focused native/JS results are component evidence only. Run the complete regression at integration stabilization and strict original-game acceptance before publishing a playable artifact. No verified playable dist/index.html currently exists. Keep committing source checkpoints and exact evidence to NullNRG/eduke32-readable-js; never commit GRPs, SDKs, AST/SQLite caches or asset-bearing generated HTML.
