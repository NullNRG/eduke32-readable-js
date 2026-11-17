# Continue the canonical EDuke32 JavaScript port

Read CURRENT_PORT_STATUS.md, HANDOFF_SNAPSHOT.json, reports/nov16-static-method-ci.json and reports/nov16-post-font-app-main-frontier.json. Read reports/nov16-static-method-startup-frontier.json and reports/nov16-original-controller-defaults.json. Original controller defaults, G_InitText and text parsing now execute; app_main/menu/gameplay do not. Do not rebuild the native 111-unit semantic index for compiler-only changes.

CON compiler checkpoint: `C_ParseCommand` and `C_Compile` now pass structured control-flow lowering in the original unit. They still need a complete link. `G_Util_PtrToIdx2` is verified as an isolated original relocation function; this does not verify live script resizing. Start from [the exact current link frontier](reports/nov16-con-lowering-frontier.json) and retry the original VM and variable providers before re-emitting the compiler.

All ten original CON structure tables and `VM_InitHashTables` are linked. The original table oracle checks 548 rows against the selected Clang target's ELF object and exercises the original hash initializer and lookups in Chromium. The scalar initializer evaluator uses the existing optional libclang resources. It binds unique source sites only. See `reports/nov17-original-con-structure-label-parity.json`.

```powershell
. work/session-env.ps1
python tests/source_factory/verify_sourcefirst_pointer_alias.py
python tests/source_factory/verify_sourcefirst_nested_goto.py
python work/verify_original_script_relocation.py
python work/verify_original_con_structure_labels.py
python work/recover_boot_reachable.py source/duke3d/src/gameexec.cpp VM_ScriptInfo,apScriptEvents,g_currentEvent,g_thisActorVarID --install-closed-leaves
python work/recover_boot_reachable.py source/duke3d/src/gamestructures.cpp VM_InitHashTables --whole-unit --install-closed-leaves
python work/recover_boot_reachable.py source/duke3d/src/gamevars.cpp aGameVars,aGameArrays,Gv_NewVar,Gv_NewArray,Gv_Init,Gv_Clear --install-closed-leaves
python work/recover_boot_reachable.py source/duke3d/src/gamedef.cpp C_Compile,C_ParseCommand,C_SetScriptSize --whole-unit --install-closed-leaves
```

```powershell
. work/session-env.ps1
python tests/source_factory/verify_sourcefirst_static_pod_constructor.py
python work/verify_original_controller_defaults.py
python tests/source_factory/verify_sourcefirst_unordered_maps.py
python tests/source_factory/verify_sourcefirst_private_unordered.py
python tests/source_factory/verify_sourcefirst_preserved_storage_refresh.py
node --test tests/source_factory/unordered_map_service.test.mjs
python work/native_original_font_oracle.py
python work/verify_original_text_startup_frame.py
python work/reproduce_source_ci.py
```

The font oracle compiles exact original font definitions and the G_InitText mapping-statement suffix, plus the entire original text parser. It does not execute native G_InitText allocation/tile loading or the native full game. The browser executes the entire original G_InitText against real assets. Controlled mapping overrides test emplace preservation and UTF-8; they are test inputs, not seeded game state or launcher defaults.

The definitions/GRP chain is now linked, with real G_ScanGroups and G_LoadGroups execution. Next: complete packed function-static arrays containing ClockTicks and original assignment/lifetime semantics for rotatesprite/menu/HUD, configuration and original CON compilation/game-state startup. Retry original app_main against its refreshed dependency map. Retain original C++ game behavior and real failure paths.

```powershell
python work/recover_boot_reachable.py source/duke3d/src/config.cpp CONFIG_ReadSetup,CONFIG_WriteSetup --whole-unit --install-closed-leaves
python work/recover_boot_reachable.py source/duke3d/src/gamedef.cpp C_Compile --whole-unit --install-closed-leaves
python work/recover_boot_reachable.py source/duke3d/src/game.cpp G_CompileScripts --whole-unit --install-closed-leaves
python work/recover_boot_reachable.py source/duke3d/src/game.cpp app_main --whole-unit --install-closed-leaves
```

For a fragment containing functions only, refresh its complete exact interface with tools/recover_browser_component.py SOURCE NAMES --refresh-fragment-sha256 HASH --whole-unit-refresh. For a mixed fragment, select every function export and add --preserve-fragment-storage: the original immutable shard and its variable/getter exports remain the storage owner. The installer rejects partial replacement without that mode, foreign storage ABIs and preserved storage that may capture a replaced function. Do not rebuild or duplicate the map's original storage merely to refresh its functions. Inspect current module_fragments before choosing a hash; the original mixed font shard has already been split into preserved storage and refreshed functions.

Use npm run serve:project and engine-player.html for the local GRP picker. Regenerate its runner with npm run build:engine-launcher. A playable release still requires original menus, CON/game state, controls/combat/enemies, audio, saves, offline HTML and sustained verified gameplay.

Keep compilation/browser checks local, Clang jobs serial and checkpoint commits marked [skip ci]. Push source and factual evidence to NullNRG/eduke32-readable-js. No paid services, cloud builds, GRPs, SDKs or raw AST/SQLite caches. Do not label or deploy a playable release before acceptance passes.
