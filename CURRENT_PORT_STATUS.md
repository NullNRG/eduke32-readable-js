# Current EDuke32 continuation status

## Update, October 28

The browser startup integration now contains the original `videoSetPalette` and `osdcmd_cvar_set_baselayer` functions. The original XXH3 checksum has passed 272 native/Node and Chromium comparisons, and the original gamma function still matches 5,376 native samples in Chromium. Palette function installation is not evidence that the complete palette/surface path or the game runs.

The 156-test result below belongs to the earlier compiler revision, not the current revision. A provisional classic-browser profile has been added; its Make-selected source inventory and integration into the canonical build remain unverified. The original startup, menu, level, playable HTML and gameplay screenshots remain incomplete.

The compiler now supports a tested range-for pattern over pointer-array members. Original `osdcmd_cvar_set_osd` passes that former blocker but remains blocked by `OSD_SetTextMode`; it has not been installed or executed. Current full-regression progress, when available, is in `reports/oct28-recovery-regression.json`.

The source checkpoint is now public at https://github.com/NullNRG/eduke32-readable-js and basic GitHub source/runtime CI passes. Original Make selection for the Linux classic configuration was audited at 114 units; final browser platform/audio selection remains pending. The current full suite is recorded in reports/oct28-publication-fixed-regression.json. The full run finished with 160 passes and four failures. All four subsequently passed targeted reruns after test harness/time-budget corrections. Compiler/runtime inputs were unchanged; reports/oct28-regression-followup.json records that combined assessment. A single full run on the latest test-file revision has not been performed. Game acceptance remains failed.

The remaining text records the preceding checkpoint and its checksum blocker has since been resolved as described above.

**The original game is not bootable or playable. There is no playable dist/index.html or genuine gameplay screenshot.** The root index.html is the existing build/test/acceptance/cleanup/handoff launcher.

This preserves the canonical source, supplied GRP, compiler, runtime and previous work. No WASM, emulator, imitation game or fabricated boot was introduced.

The frozen current regression completed 156/156 tests: {'passed': 156, 'failed': 0, 'timeout': 0, 'launch-failed': 0}. Exact fingerprints and logs: `reports/oct27-final-recovery-regression.json`. These tests do not establish original gameplay.

Original initsystem, timer/video-service setup, Bstrtoken and videoGetDisplayName execute in Chromium. Original engineInitClipMaps also executes, using a Free-only host adapter rather than the complete original allocator. Original hash lookups pass 768 native/browser comparisons. Original osdcmd_cvar_set passes 384 browser mutation cases and a read-only case with explicitly test-populated console data. Original OSD initialization and registration remain blocked; this is not an initialized game console. The Oct26 full regression found one type-query failure, fixed before the current run; the interrupted Oct27 intermediate run is retained without a completion claim.

Shared fixes cover source scalar bytes under pointer casts, nested type recovery from filtered ASTs, source-owned nested private record storage, and record member pointers independent of typedef spelling. Integer parsing, scanf and the original libdivide header operations have native and browser verification. Exact old fragment hashes are required when installing replacement fragments; original globals are preserved.

enginePreInit still requires baselayer_init, initprintf and videoGetModes. Deeper failures include original allocator lifetimes/operators, console callbacks, the original XXH3 checksum, and duplicate header globals. Palette arrays and the fade record now use proven contiguous byte storage; 2,048 native/browser record comparisons pass. Original videoSetGamma executes through a real browser SDL window, with 5,376 sampled gamma values matching native exactly. The owned-subobject lifetime planner is tested metadata only and is NOT enabled in the emitter. app_main remains blocked.

The audit covers 156 selected units: 27952 emitted observations, 4861 blocked observations, 4834 deduplicated blocked records. These use mixed historical compiler revisions, not a fresh uniform build or ninety-percent semantic recovery.

Menu, E1L1, world rendering, movement, weapons, enemies, collision, audio, saving/loading, 60 seconds of gameplay, native-game parity, offline bundling and reproducible playable builds have not passed. Exact acceptance failures are in reports/port-acceptance.json and reports/project-current-status.json.

The latest original console retry is reports/oct28-console-draw-frontier.json: OSD_UpdateDrawBuffer blocks on member-operator access, followed by OSD_ResizeDisplay, OSD_SetTextMode and osdcmd_cvar_set_osd. These functions have not been installed or executed.
