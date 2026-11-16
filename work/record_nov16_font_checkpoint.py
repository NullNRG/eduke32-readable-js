"""Record verified font startup without upgrading it to a game-boot claim."""
import datetime,hashlib,json,shutil,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'tools'))
import recover_browser_component as component
from source_ast_to_js import compiler_runtime_revision
def read(name):return json.loads((ROOT/name).read_text())
def main():
 ci=read('reports/nov11-ci-reproduction-regression.json')
 assert ci['complete'] and ci['all_passed'] and ci['regression_inputs_unchanged'] and ci['selected_tests']==65
 proof_path=ROOT/'reports/nov16-original-text-startup-frame.json';proof=json.loads(proof_path.read_text())
 text=proof.get('engine_initialization',{}).get('original_text_startup',{})
 assert proof['component_passed'] and text.get('original_full_G_InitText_executed') and text.get('native_original_text_parser_cases')==105
 resources=proof.get('engine_initialization',{}).get('original_resource_group_loading',{})
 assert resources.get('original_G_LoadGroups_executed') and resources.get('original_G_ScanGroups_executed')
 modules={p.relative_to(ROOT).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in component.OUT.rglob('*.mjs')}
 assert proof['artifacts']==modules,'Engine evidence differs from current source modules'
 shutil.copyfile(ROOT/'reports/nov11-ci-reproduction-regression.json',ROOT/'reports/nov16-font-startup-ci.json')
 shutil.copyfile(proof_path,ROOT/'reports/browser-classic-original-engine-video.json')
 with component.component_lock():component.checkpoint()
 checkpoint=read('factory-output/source-first/browser-classic/component-manifest.json')
 assert checkpoint['execution_evidence_matches_modules'] and not checkpoint['invalid_imports']
 game=read('factory-output/source-first/browser-classic/reports/frontier-source_duke3d_src_game.cpp-app_main.json')
 (ROOT/'reports/nov16-post-font-app-main-frontier.json').write_text(json.dumps(game,indent=2)+'\n')
 app=next(row for row in game['blocked'] if row['name']=='app_main')
 status=f'''# EDuke32 readable JavaScript status — November 16, 2026

**Original font initialization and text parsing now execute in the JavaScript engine. The full game is still not playable: original app_main has not booted.** No verified playable standalone dist/index.html exists.

The existing engine-player.html accepts a local GRP/MAP and renders through the original Build engine. It remains a raw-map engine preview; no original game menu, player session or substituted gameplay is being presented.

Verified current work:

- Original allocator, console, enginePreInit/engineInit/enginePostInit, GRP/ART/MAP loading, palette setup, room and mask drawing, and presentation still execute in Chromium. The real E1L1 capture remains SHA-256 fac199fda80ebd92b83153953d1b6fe96a604373b8bdc39eac6b3b34905b7b89.
- Original G_ScanGroups recognizes/selects the supplied archive and original G_LoadGroups initializes its 456-entry resource index before engine/ART initialization. Original parsedefinitions_game/loaddefinitions_game, sound/music definition services and menu gameplay-entry storage are linked. This does not establish audio playback, CON initialization or menu rendering.
- All five original font-map functions are linked. Full original G_InitText executes twice through real ART/tile loading and original allocation. Its 1,536 mapping results and six pointer identity checks match exact original mapping statements compiled natively. Two actual 512-byte glyph buffers are allocated by the source function.
- The entire original G_ScreenTextFromString parser matches 105 native cases covering three fonts, colour escapes, case flags, numeric width, whitespace, empty input and a controlled UTF-8 mapping. Output termination/bounds are checked. This is function/component parity, not original menu or gameplay acceptance.
- Original font/game functions are unchanged. A typed standard-library service supplies the supported default-allocator unsigned/nested unordered_map operations. Native/full/filtered Node/Chromium comparisons pass 2,048 results. Custom allocation hooks and unproven multi-unit allocator ownership remain blocked. Opaque objects retain pointer identity and reject native byte-layout access; see STANDARD_LIBRARY_ADAPTERS.md.
- Incremental function refresh now preserves original storage in an immutable source shard. Private library imports verify source ownership, original type and service ABI. The old map is retained; no second map or success stub is installed.
- The frozen final local compiler CI profile passes 65/65 under unchanged inputs (reports/nov16-font-startup-ci.json). Twelve local host-I/O/display/service checks also pass. This selected suite is not the complete historical suite or game acceptance.

Earlier scoped native/component checks remain: 12 animation records/44 sound cues, argc=1 command-line defaults, original LOOKUP.DAT remaps/palettes, and E1L1 ray/movement/push geometry. See the corresponding November 13/16 reports for exact scope.

The refreshed app_main catalog still has {len(app['dependencies'])} direct unresolved startup names, each potentially leading to further dependencies. The count is not a completion percentage. Major remaining work includes configuration, CON compilation/game state, menu/HUD rendering and packed ClockTicks arrays, original game rendering/interpolation, the yielding simulation/input loop, audio/music, progression, saves and offline bundling. Scope-entering goto cases, including getzrange, remain blocked. Native gameplay parity, 60 seconds of real gameplay and the separate stable-identity 90% recovery comparison have not passed.

Use CONTINUE_HERE.md for deterministic resume commands. Preserve the single canonical classic-browser project, original sources/licenses and native semantic index d906809d. Keep heavy Clang jobs serial. Game/Build code remains readable JavaScript; only approved low-level services may use WASM. No emulation, imitation engine or fake game boot.

All verification runs locally. No paid service, cloud build or deployment was started. GitHub commits include [skip ci]. Never publish GRPs, SDKs, AST/SQLite caches or asset-bearing generated HTML.
'''
 (ROOT/'CURRENT_PORT_STATUS.md').write_text(status)
 (ROOT/'reports/nov16-font-startup-checkpoint.md').write_text(status)
 continuation='''# Continue the canonical EDuke32 JavaScript port

Read CURRENT_PORT_STATUS.md, HANDOFF_SNAPSHOT.json, reports/nov16-font-startup-ci.json and reports/nov16-post-font-app-main-frontier.json. Original G_InitText and text parsing now execute; app_main/menu/gameplay do not. Do not rebuild the native 111-unit semantic index for compiler-only changes.

```powershell
. work/session-env.ps1
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
python work/recover_boot_reachable.py source/duke3d/src/gamedef.cpp G_CompileScripts --whole-unit --install-closed-leaves
python work/recover_boot_reachable.py source/duke3d/src/game.cpp app_main --whole-unit --install-closed-leaves
```

For a fragment containing functions only, refresh its complete exact interface with tools/recover_browser_component.py SOURCE NAMES --refresh-fragment-sha256 HASH --whole-unit-refresh. For a mixed fragment, select every function export and add --preserve-fragment-storage: the original immutable shard and its variable/getter exports remain the storage owner. The installer rejects partial replacement without that mode, foreign storage ABIs and preserved storage that may capture a replaced function. Do not rebuild or duplicate the map's original storage merely to refresh its functions. Inspect current module_fragments before choosing a hash; the original mixed font shard has already been split into preserved storage and refreshed functions.

Use npm run serve:project and engine-player.html for the local GRP picker. Regenerate its runner with npm run build:engine-launcher. A playable release still requires original menus, CON/game state, controls/combat/enemies, audio, saves, offline HTML and sustained verified gameplay.

Keep compilation/browser checks local, Clang jobs serial and checkpoint commits marked [skip ci]. Push source and factual evidence to NullNRG/eduke32-readable-js. No paid services, cloud builds, GRPs, SDKs or raw AST/SQLite caches. Do not label or deploy a playable release before acceptance passes.
'''
 (ROOT/'CONTINUE_HERE.md').write_text(continuation)
 snap=read('HANDOFF_SNAPSHOT.json');snap.update(updated_utc=datetime.datetime.now(datetime.timezone.utc).isoformat(),
  compiler_runtime_input_sha256=compiler_runtime_revision(),component_snapshot_sha256=hashlib.sha256((ROOT/'factory-output/source-first/browser-classic/component-manifest.json').read_bytes()).hexdigest(),
  latest_frozen_targeted_regression='reports/nov16-font-startup-ci.json',latest_frozen_targeted_passed=65,latest_frozen_targeted_total=65,
  current_video_report='reports/nov16-original-text-startup-frame.json',original_font_initialization_verified=True,
  original_font_mapping_native_entries=1536,original_text_parser_native_cases=105,current_app_main_frontier='reports/nov16-post-font-app-main-frontier.json',
  original_resource_group_loading_verified=True,original_resource_group_entry_count=456,
  current_work='Definitions/CON/configuration/menu boot closure and packed ClockTicks arrays; original font startup and text parser now verified',
  gameplay_verified=False,original_entry_executed_current_profile=False,current_full_regression_complete=False,current_whole_program_linked=False)
 (ROOT/'HANDOFF_SNAPSHOT.json').write_text(json.dumps(snap,indent=2)+'\n')
 readme=ROOT/'README.md';body=readme.read_text();heading='## Original font startup verified — November 16'
 if heading not in body:
  lines=body.splitlines();lines[2:2]=[heading,'','Original `G_InitText` and the text parser now execute in the JavaScript engine. Native comparisons cover 1,536 font-table entries and 105 parser cases; the frozen local compiler profile passes **65/65**. Read [current status](CURRENT_PORT_STATUS.md) and [standard-library service scope](STANDARD_LIBRARY_ADAPTERS.md). **Original app_main, menus and playable gameplay remain incomplete.**',''];body='\n'.join(lines)+'\n'
 readme.write_text(body)
 print(json.dumps({'font_startup_verified':True,'text_parser_native_cases':105,'local_ci':'65/65','component_invalid_imports':0,'app_main_unresolved_names':len(app['dependencies']),'gameplay_verified':False}))
if __name__=='__main__':main()
