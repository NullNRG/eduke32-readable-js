"""Publish factual local verification and continuation notes after integration."""
import datetime,hashlib,json,shutil,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'tools'))
from source_ast_to_js import compiler_runtime_revision
def read(path):return json.loads((ROOT/path).read_text())
def main():
 ci=read('reports/nov11-ci-reproduction-regression.json')
 assert ci['complete'] and ci['all_passed'] and ci['regression_inputs_unchanged']
 assert ci['selected_tests']==ci['completed_tests']==62
 shutil.copyfile(ROOT/'reports/nov11-ci-reproduction-regression.json',ROOT/'reports/nov16-startup-collision-ci.json')
 component=read('factory-output/source-first/browser-classic/component-manifest.json')
 assert not component['invalid_imports']
 clip=read('factory-output/source-first/browser-classic/reports/frontier-source_build_src_clip.cpp.json')
 resolved=clip.get('requested_resolved',{})
 collision_path=ROOT/'reports/nov16-original-collision-geometry.json'
 collision=json.loads(collision_path.read_text()) if collision_path.is_file() else {}
 tested=collision.get('passed',False)
 game=read('factory-output/source-first/browser-classic/reports/frontier-source_duke3d_src_game.cpp.json')
 (ROOT/'reports/nov16-app-main-current-frontier.json').write_text(json.dumps(game,indent=2)+'\n')
 collision_scope=('Original clipmove, pushmove, hitscan and cansee execute on actual E1L1 geometry in Node and Chromium. Eight wall rays, four movement directions and push resolution agree; native C++ verifies the original result layout. This is geometry-component verification, not native collision/game-state parity or player initialization.' if tested else 'Collision execution is not yet verified. Current linked roots: '+json.dumps(resolved)+'.')
 status=f'''# EDuke32 readable JavaScript status — November 16, 2026

**The original Build engine renders E1L1 rooms and raw-map sprites in JavaScript. The full game is still not playable, and original app_main has not executed.** There is no verified playable standalone dist/index.html.

The asset-free engine-player.html accepts a local GRP and MAP and renders a source-engine frame. Start it with npm run serve:project. The developer index.html provides build/test/status/packaging actions. Neither page is evidence of original game boot or interactive gameplay.

Verified work retained and extended:

- Original allocator, console, enginePreInit/engineInit/enginePostInit, GRP/ART/MAP loading, palette setup, rooms, masks and window presentation execute. The actual 640×480 image is reports/evidence/nov12-original-js-engine-masks.png; 52 source map sprites are queued. No CON/player state was prepopulated.
- Original Anim_Init matches native C++ for 12 records and 44 sound cues. Original G_CheckCommandLine executes with argc=1 and matches its scoped native fixture, Node and Chromium. Other command-line branches are not covered by that comparison.
- Original G_LoadLookups executes in Node and Chromium and exactly matches 204,800 shade-remap bytes and 3,840 base-palette bytes from supplied LOOKUP.DAT. This resource oracle is not native whole-game parity.
- Original crosshair get/set palette services execute after the engine frame, with no HUD drawn. Color-table generation is slow; this does not demonstrate real-time gameplay.
- {collision_scope}
- Shared compiler repairs preserve condition-declaration scope/NaN conversion, supported backward retry order, and exact cross-unit Clang overload identity. Their native/full/filtered Node/Chromium fixtures check 14,336, 4,096 and 2,048 results respectively. Unsupported object lifetimes and scope-entering jumps remain blocked.
- The frozen current local compiler CI profile passes 62/62 with unchanged inputs: reports/nov16-startup-collision-ci.json. This is the selected CI profile, not the complete historical suite or original-game acceptance.

Remaining release blockers include original app_main startup dependencies, std::unordered_map-backed font setup, loaddefinitions_game and CON/game initialization, menus/packed ClockTicks static construction, getzrange and other scope-entering jumps, the yielding original frame loop, input/combat/enemies, audio/music, progression, saves and offline bundling. The current app_main catalog is reports/nov16-app-main-current-frontier.json. Zero invalid component imports does not imply a complete global game link; unresolved ownership groups remain. The separate stable-identity 90% recovery measurement is unfinished.

Use CONTINUE_HERE.md for exact resume commands. Keep the single canonical classic-browser project, original sources/licenses, verified storage and native semantic index d906809d. Keep heavy Clang work serial and reuse unchanged ASTs. Original game/Build code remains readable JS; only approved low-level services may use WASM. No engine emulation, substitute game, fabricated boot or success stubs.

All work and verification run locally. No paid service or hosted build was started. GitHub checkpoints use [skip ci]. Never publish GRPs, SDKs, raw AST/SQLite caches or asset-bearing generated HTML.
'''
 (ROOT/'CURRENT_PORT_STATUS.md').write_text(status)
 continuation='''# Continue the canonical EDuke32 JavaScript port

Read CURRENT_PORT_STATUS.md, HANDOFF_SNAPSHOT.json, reports/nov16-app-main-current-frontier.json and reports/nov16-startup-collision-ci.json. The game is not yet playable. The GRP picker renders original raw MAP geometry; do not call it a game menu or player session.

```powershell
. work/session-env.ps1
python work/verify_original_command_line_init.py
python work/verify_original_game_lookups.py
python work/verify_original_collision_geometry.py
python work/verify_original_masked_frame.py
python work/reproduce_source_ci.py
python tools/recover_browser_component.py --snapshot
```

Next recovery chain: source/build/src/screentext.cpp tilefontGetPtr,tilefontMaybeDefineMapping,tilefontLookup require original std::unordered_map semantics; those unblock original G_InitText. Original G_LoadGroups now needs loaddefinitions_game. Recover shared semantics, retry affected units and original app_main. UI rotatesprite still needs exact packed static-array ClockTicks construction. getzrange and some game functions still enter different lexical scopes through goto; preserve lifetimes/order in generic lowering.

```powershell
python work/recover_boot_reachable.py source/build/src/screentext.cpp tilefontGetPtr,tilefontMaybeDefineMapping,tilefontLookup --whole-unit --install-closed-leaves
python work/recover_boot_reachable.py source/duke3d/src/text.cpp G_InitText --whole-unit --install-closed-leaves
python work/recover_boot_reachable.py source/duke3d/src/game.cpp app_main --whole-unit --install-closed-leaves
```

Existing owned exports short-circuit recovery. To refresh implementations after compiler changes, use tools/recover_browser_component.py --refresh-fragment-sha256 HASH --whole-unit-refresh with the exact active module_fragments entry; preserve its complete interface, source ownership and storage ABI. Never trim hashed shards or choose overloads by name/arity. The new getwalldist provider metadata is attested against unchanged producer/shard/source/header/toolchain fingerprints in reports/nov16-original-overload-attestation.json.

The current semantic index covers the 111-unit classic profile at d906809d; compiler-only edits do not require repeating semantic extraction. Keep heavy Clang work serial on this machine. Do not mix current compiled, linked, executed and gameplay-verified status.

Use npm run serve:project and engine-player.html for local GRP selection; no archive upload occurs. Regenerate its runner with npm run build:engine-launcher. The release still requires original menus, CON/game state, controls/combat, audio, saves, offline standalone HTML and 60 seconds of genuine verified gameplay.

Keep pushing source, active modules and factual evidence to NullNRG/eduke32-readable-js. Include [skip ci] in every checkpoint commit. No paid services, cloud builds, GRPs, SDKs or raw AST/SQLite caches. Do not deploy or label a playable release until the actual acceptance tests pass.
'''
 (ROOT/'CONTINUE_HERE.md').write_text(continuation)
 (ROOT/'reports/nov16-integration-checkpoint.md').write_text(status)
 snapshot=read('HANDOFF_SNAPSHOT.json')
 snapshot.update(updated_utc=datetime.datetime.now(datetime.timezone.utc).isoformat(),compiler_runtime_input_sha256=compiler_runtime_revision(),
  component_snapshot_sha256=hashlib.sha256((ROOT/'factory-output/source-first/browser-classic/component-manifest.json').read_bytes()).hexdigest(),
  latest_frozen_targeted_regression='reports/nov16-startup-collision-ci.json',latest_frozen_targeted_passed=62,latest_frozen_targeted_total=62,
  current_work='Original font/definitions/CON/menu boot closure; source collision geometry components '+('executed' if tested else 'not yet verified'),
  current_app_main_frontier='reports/nov16-app-main-current-frontier.json',original_command_line_argc1_verified=True,
  original_game_lookup_resource_verified=True,original_collision_geometry_verified=tested,original_collision_native_game_parity=False,
  current_full_regression_complete=False,gameplay_verified=False,current_whole_program_linked=False,original_entry_executed_current_profile=False)
 (ROOT/'HANDOFF_SNAPSHOT.json').write_text(json.dumps(snapshot,indent=2)+'\n')
 readme=ROOT/'README.md';text=readme.read_text();marker='## November 16 integration checkpoint'
 if marker not in text:
  lines=text.splitlines();lines[2:2]=[marker,'', 'The frozen local compiler CI profile passes **62/62**. Original command-line defaults and lookup-resource loading now execute in Node and Chromium; cross-file overload identity and collision recovery are integrated. Read [current status](CURRENT_PORT_STATUS.md) for the exact collision evidence and remaining startup dependencies. **Original app_main and playable gameplay remain incomplete.** No paid or hosted builds were used.',''];text='\n'.join(lines)+'\n'
 readme.write_text(text)
 guide=ROOT/'PORT_GUIDE.md';text=guide.read_text();text=text.replace('## Verified position, November 13, 2026','## Verified position (rendering checkpoint, November 13, 2026)')
 text+='\nNovember 16 integration: see CURRENT_PORT_STATUS.md for the new compiler, command-line, lookup and collision checks. The frozen local CI profile now passes 62/62; the table above describes rendering components, not full game boot.\n';guide.write_text(text)
 print(json.dumps({'local_ci':'62/62','component_invalid_imports':len(component['invalid_imports']),'collision_geometry_executed':tested,'gameplay_verified':False}))
if __name__=='__main__':main()
