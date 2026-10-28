# Continue the canonical project

Read CURRENT_PORT_STATUS.md, HANDOFF_SNAPSHOT.json and reports/project-current-status.json first. This is a continuation, not a fresh start. Preserve original inputs and verified emitted source.

Configure dependencies using BUILD_PORTABILITY.md. On this host:

```powershell
. work/session-env.ps1
python work/recover_current_boot_frontier.py --label next-boot-frontier --entries initprintf OSD_Init baselayer_init videoGetModes enginePreInit app_main
```

The current integration is factory-output/source-first/oct20-engine-preinit-browser. The Oct26 palette-fade and Oct27 gamma-storage frontier reports record the latest failures and gamma integration. XXH3 scalar-header diagnostics are in reports/oct27-xxhash-scalar.log and its generated manifest. work/xxhash-browser-compile-commands.json records the explicit original scalar library configuration; that candidate is not installed or verified. Keep heavy Clang jobs serial. Recompile affected functions into a new epoch and preserve source-owned globals.

Do not run work/recover_browser_preinit.py on this target: it restores an older snapshot. The current frontier helper rejects duplicate globals and incompatible ABI. Replacing an already installed fragment requires tools/install_verified_fragment.py --replace-fragment-sha256 with its exact current manifest hash. This preserves original owner storage and the previous immutable shard. tools/expose_verified_private_storage.py only upgrades verified original bindings.

Original browser checks are work/verify_original_initsystem_browser.py, work/verify_original_clipping_browser.py, work/verify_original_hash_browser.py and work/verify_original_console_browser.py, work/verify_original_palette_storage_browser.py and work/verify_original_gamma_browser.py. Their reports identify test storage and incomplete original initialization. work/upgrade_verified_zero_record_arrays.py only upgrades source-proven all-zero unsigned-byte record storage; the actual palette upgrades and source hashes are in the Oct26 palette-storage integration reports. Owned lifetime plans remain disabled until construction and destruction emission are implemented.

```powershell
npm run serve:project
python tools/verify_recovery_suite.py --jobs 1 --timeout 240 --report reports/next-regression.json
python tools/verify_port_acceptance.py --strict
npm run compile:game
npm run handoff:project
```

compile:game remains the canonical pipeline and fails strict game acceptance while dependencies are unresolved. dist/original-entry-attempt.html is an old failed diagnostic that bypasses services, not a game. Never promote it to dist/index.html or count isolated subsystem tests as gameplay.

The continuation archive includes source and GRP, compiler/runtime, tests, scripts, compact semantic evidence and incremental source epochs. It excludes downloaded toolchain binaries, node_modules, raw ASTs, the large semantic SQLite database and redundant ZIPs. Install tools as documented. CONTINUATION_MANIFEST.json contains verified SHA-256 for every payload.
