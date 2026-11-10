# Continue the canonical project

Read `CURRENT_PORT_STATUS.md`, `HANDOFF_SNAPSHOT.json` and the latest actual Chromium report. Preserve the existing project and all original source/license notices. The port is incomplete; do not claim a playable artifact or show native/diagnostic images as game screenshots.

PowerShell, from the canonical project:

```powershell
. work/session-env.ps1
python work/verify_original_bfirst_search.py --video-mode --report reports/nov10-original-bfirst-search.json
```

The successful rebuild/probe commands are logged in `reports/nov05-proven-software-assignment-rebuild.log` and `reports/nov05-original-engine-video.log`. Do not run a second heavy Clang job concurrently. `work/rebuild_source_owner.py` requires the actual current SHA-256 of the owner. It preserves storage and current consumers; header-factory retention preserves original closed implementations rather than introducing initialization cycles. Reuse requires the exact compiler and preprocessing fingerprints.

The latest verified compiler checkpoint fixes filtered template-instance identities, implicit non-inline header template recovery and exact private-storage scalar-helper attestation. The affected suite passes 17/17 with unchanged inputs. Original `bfirst_search_init` and `bfirst_search_try` pass 512 native/Chromium comparisons after real engine/GRP/video initialization. `calc_sector_reachability`, `engineFinishLoadBoard`, `updatesector` and `updatesectorneighbor` are linked. See `reports/nov10-original-bfirst-search.json` and `reports/nov10-map-reachability-closure.log`.

Continue the full original map-loader frontier, then ART/cache and `app_main`; do not fill game state manually. The active recovery command is:

```powershell
python work/recover_boot_reachable.py source/build/src/engine.cpp engineLoadBoard,engineLoadBoardV5V6 --install-closed-leaves
```

`cache1d` out-of-line nonstatic methods still need reusable source lowering. The last broad regression attempt was 243/247; all four focused failures now pass, but the complete suite must be rerun under the new revision.

The SDL event fragment retry failed because internal `sdl_resize` was not imported through a valid original storage provider. Preserve that diagnostic; fix same-TU private ownership or rebuild its complete owner. The broad clip retry rejected a `tilesiz` record-array prototype/storage mismatch; the scalar `quickloadboard` recovery succeeded separately. Do not weaken either ABI check.

After changes stabilize:

```powershell
python tools/verify_recovery_suite.py --jobs 1 --timeout 1200 --report reports/nov10-current-full-regression.json
python tools/verify_port_acceptance.py --build-root factory-output/source-first/browser-classic --out reports/nov05-port-acceptance.json --strict
```

The strict acceptance gate is expected to fail until real original menu, level, input, audio, gameplay and offline evidence exist. Produce genuine Chromium menu/E1L1 screenshots only when those states render. The current repository excludes GRPs, toolchains, AST/SQLite caches and the 362 MB private semantic payload. Local input data remains private.
