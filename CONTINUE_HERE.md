# Continue the canonical EDuke32 project

Read `CURRENT_PORT_STATUS.md`, `HANDOFF_SNAPSHOT.json` and the exact current Chromium report. Preserve this codebase, original source/license notices, native storage identity and the classic browser profile. The game is incomplete; do not label a diagnostic/native screenshot as JavaScript gameplay.

From the canonical project in PowerShell:

```powershell
. work/session-env.ps1
python work/verify_original_map_load.py --report reports/nov11-original-e1l1-map-load.json
python work/verify_original_map_load.py --all-grp-maps --report reports/nov11-original-campaign-map-load.json
python work/verify_original_lz4_compression.py --video-mode --report reports/nov11-original-lz4-compression-parity.json
python tools/recover_browser_component.py --snapshot
```

E1L1 now genuinely loads through original `engineLoadBoard`, matching full sector/wall bytes, sprite coordinates and original start, with original `inside` verification. The current CI-reproduction regression is 46/46, Node browser/runtime tests are 22/22 and GitHub CI passed `ff0f700`; it covers native layout finalization, pointer/raw unions, exact anonymous owners, array data ABI, deferred pure pointer limits and fragment replacement. It does not replace a complete suite run or gameplay acceptance.

The next original dependency chain is base ART textures and cache allocation:

```powershell
python work/recover_boot_reachable.py source/build/src/tiles.cpp artLoadFiles,tileLoad --install-closed-leaves
```

See `reports/nov11-art-cache-root-causes.json` and the fresh targeted ART frontier. Complete the generic source-defined out-of-line `cache1d` methods and global object construction, then recover original `drawrooms`/`drawmasks` and `app_main`/CON/menu initialization. Do not replace cache/renderer/game routines with stubs or independent implementations. `artSetupMapArt` is linked, but is not base ART initialization. The native source remains the behavior oracle.

Heavy Clang jobs must stay serial. Reuse only matching compiler/source/preprocessor/ABI fingerprints. Refreshes preserve the exact previous fragment interface and all original storage; additional compiler-emitted helpers do not become owner exports. The strict fragment installer still audits all emitted code/imports/storage. Missing native anonymous fields must stay blocked instead of emitting undefined field reads.

After shared changes stabilize:

```powershell
python tools/verify_recovery_suite.py --jobs 1 --timeout 1200 --report reports/nov11-current-full-regression.json
python tools/verify_port_acceptance.py --build-root factory-output/source-first/browser-classic --out reports/nov11-port-acceptance.json --strict
```

Strict gameplay acceptance is expected to fail until original menu, world rendering, input, audio, saves, offline operation and 60-second gameplay evidence exist. No verified playable `dist/index.html` exists. No real game screenshot exists. Never prepopulate world/game state to bypass original initialization.
