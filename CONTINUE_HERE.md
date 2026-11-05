# Continue the canonical project

Read `CURRENT_PORT_STATUS.md`, `HANDOFF_SNAPSHOT.json` and the latest actual Chromium report. Preserve the existing project and all original source/license notices. The port is incomplete; do not claim a playable artifact or show native/diagnostic images as game screenshots.

PowerShell, from the canonical project:

```powershell
. work/session-env.ps1
python work/verify_original_engine_init.py --video-mode --report reports/nov05-original-engine-video.json
```

The successful rebuild/probe commands are logged in `reports/nov05-proven-software-assignment-rebuild.log` and `reports/nov05-original-engine-video.log`. Do not run a second heavy Clang job concurrently. `work/rebuild_source_owner.py` requires the actual current SHA-256 of the owner. It preserves storage and current consumers; header-factory retention preserves original closed implementations rather than introducing initialization cycles. Reuse requires the exact compiler and preprocessing fingerprints.

The last verified shared fix is Clang-proven implicit trivial-record assignment. The software-surface owner rebuild and original 640×480 Chromium video mode now pass. Continue from this verified engine/video boundary. Retain all native layout, lifetime and authored-method checks. Next resolve `bfirst_search_init`/`bfirst_search_try` template recovery, complete `engineFinishLoadBoard` and original map/ART/cache initialization. `cache1d` out-of-line nonstatic methods still need reusable compiler lowering. Reprobe original `app_main`; never substitute a boot stub or fill game state manually.

The SDL event fragment retry failed because internal `sdl_resize` was not imported through a valid original storage provider. Preserve that diagnostic; fix same-TU private ownership or rebuild its complete owner. The broad clip retry rejected a `tilesiz` record-array prototype/storage mismatch; the scalar `quickloadboard` recovery succeeded separately. Do not weaken either ABI check.

After changes stabilize:

```powershell
python tools/verify_recovery_suite.py --jobs 1 --timeout 1200 --report reports/nov05-current-full-regression.json
python tools/verify_port_acceptance.py --build-root factory-output/source-first/browser-classic --out reports/nov05-port-acceptance.json --strict
```

The strict acceptance gate is expected to fail until real original menu, level, input, audio, gameplay and offline evidence exist. Produce genuine Chromium menu/E1L1 screenshots only when those states render. The current repository excludes GRPs, toolchains, AST/SQLite caches and the 362 MB private semantic payload. Local input data remains private.
