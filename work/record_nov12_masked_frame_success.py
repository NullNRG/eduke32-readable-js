from pathlib import Path
from datetime import datetime,timezone
import hashlib,json,sys
R=Path.cwd();sys.path.insert(0,str(R/'tools'))
from source_ast_to_js import compiler_runtime_revision
p=json.loads((R/'reports/nov12-original-masked-frame.json').read_text());c=json.loads((R/'factory-output/source-first/browser-classic/component-manifest.json').read_text())
e=p['engine_initialization'];assert p['component_passed'] and c['execution_evidence_matches_modules']
assert e['original_repeat_presentation']['changed_pixels']==0
assert e['original_mask_renderer']['executed'] and e['original_mask_renderer']['changed_pixels']>0
body='''# EDuke32 readable JavaScript checkpoint — November 12, 2026

**Original E1L1 rooms and sprites now render in Chromium through the original Build engine in readable JavaScript. The game is not yet playable.** Original app_main, CON/game initialization, menus, player controls, weapons/enemies, audio, saves and sustained gameplay remain unverified. No verified playable dist/index.html exists.

![Original JavaScript Build rooms and sprites; raw map engine component, not gameplay](reports/evidence/nov12-original-js-engine-masks.png)

The actual source path executes allocator/engine/console initialization, original GRP/ART/MAP loading, original G_InitMultiPsky and palette/view setup, renderDrawRoomsQ16, renderDrawMasks and videoShowFrame. The engine queues 52 map sprites; masks change 23,695 displayed pixels. The 640×480 final capture has 126 colors and 219,481 nonblack pixels. Repeating presentation without drawing changes zero pixels. Eight original divideu32_noinline boundary cases also pass. Exact module/runtime hashes, source trace and PNG evidence are in reports/nov12-original-masked-frame.json. The PNG SHA-256 is fac199fda80ebd92b83153953d1b6fe96a604373b8bdc39eac6b3b34905b7b89.

This is raw MAP engine state. Original game/CON sprite animation and app_main have not executed. The screenshot must not be labeled a playable session, original game boot, complete level acceptance or a 60-second gameplay test.

Shared compiler work now lowers proved local reference lambdas, sibling branch tails plus original postludes, exact anonymous-union destruction/layout traits, and persistent packed function-static POD construction. The original voxel division callback, classicDrawVoxel, classicDrawSprite, renderDrawSprite and renderDrawMasks are linked. No original function was replaced by a stub. The first masked-frame probe exposed zero-alpha window presentation; the browser adapter now exposes an opaque SDL RGBX window surface and copies X padding to opaque transfer alpha without modifying original framebuffer bytes.

Verification: 57/57 local compiler CI-profile checks passed before the display follow-up; 22 relevant Node SDL/display tests and the real Chromium runtime check pass after that follow-up, along with this original masked frame. Scoped native/full/filtered Node/Chromium fixtures cover 3,072 lambda results, 1,024 branch-tail results and 2,048 static POD results. The complete current regression suite and strict original-game acceptance remain incomplete. The partial graph still has unresolved ownership/storage groups and is not a whole-program link.

Next: complete original app_main/CON/menu startup and the original frame loop. UI rotatesprite still needs exact packed static-array construction with ClockTicks members. Native game-state parity, interactive input/combat, sound/music, progression, saves, offline bundling and sustained gameplay must pass before a release. The separately required 90% declaration recovery comparison is also unfinished. Do not count optional desktop exclusions as recovered game functions.

Use CONTINUE_HERE.md for deterministic commands. Preserve source, licenses, selected classic profile and semantic index d906809d; compiler-only changes do not require re-extracting 111 native units. Keep heavy Clang jobs serial. Original game/Build code remains readable JavaScript; only approved low-level services may use native WASM. No emulation, cloned engine or fake boot/gameplay.

User cost constraint: use local compilation and browser verification. No paid external services or additional cloud builds. GitHub checkpoint commits include [skip ci]. Do not upload GRPs, SDKs, raw AST/SQLite databases or asset-bearing player HTML.
'''
for name in ['CURRENT_PORT_STATUS.md','ENGINEERING_CHECKPOINT.md']:(R/name).write_text(body,encoding='utf-8')
resume=(R/'CONTINUE_HERE.md').read_text()
start=resume.index('November 12 follow-up:');end=resume.index('```powershell',start)
resume=resume[:start]+'''November 12 follow-up: original mask/sprite dependencies are now linked and execute in Chromium. Read reports/nov12-original-masked-frame.json. The real image includes rooms, fences and raw-map props. Repeated presentation is stable after the SDL RGBX/alpha repair. This is an engine component, not app_main/CON/gameplay. Continue original startup/menu/frame-loop recovery and packed static-array construction with ClockTicks for rotatesprite.

'''+resume[end:]
resume=resume.replace('python work/verify_original_rooms_frame.py','python work/verify_original_masked_frame.py')
resume=resume.replace('The current mask frontier is lambda closure/call lowering. classicDrawSprite also has a sibling-scope jump, and UI rotatesprite storage is still blocked.','The mask lambdas and classic sprite sibling jump are recovered. UI rotatesprite still needs packed static-array construction with ClockTicks members.')
resume=resume.replace('passed 54/54 and runtime Node checks 22/22','passed 57/57 before the SDL display follow-up; 22 relevant Node checks and real Chromium runtime/original masked-frame checks pass after it')
(R/'CONTINUE_HERE.md').write_text(resume,encoding='utf-8')
(R/'LLM_CONTINUATION_PROMPT.md').write_text('Continue this canonical EDuke32 readable-JavaScript project. Read CONTINUE_HERE.md, CURRENT_PORT_STATUS.md, HANDOFF_SNAPSHOT.json and reports/nov12-original-masked-frame.json. Original E1L1 rooms and sprites now render through real source engine calls; repeated presentation is stable after the SDL RGBX repair. This is raw-map engine evidence, not app_main/CON/menu or playable gameplay. Complete original startup, UI static-record array construction, yielding source simulation, input, audio, saves and offline acceptance. Preserve all source/ABI/storage proofs and existing implementations. No cloned engine, game/engine WASM, emulation or success stubs. Use local tools and tests only: the user prohibits paid external services. GitHub checkpoint commits require [skip ci] to avoid cloud builds. Never upload GRPs or private toolchain/cache payloads.\n',encoding='utf-8')
readme=(R/'README.md').read_text();a=readme.index('Original **');b=readme.index('The project continues',a)
readme=readme[:a]+'''Original **E1L1 rooms and sprites now render in Chromium through the original Build engine in readable JavaScript**. The full game is not playable yet. Original app_main, CON/menu startup, controls, weapons/enemies, audio and saves remain unverified. There is no verified playable dist/index.html.

![Original JavaScript Build rooms and sprites; raw-map component, not gameplay](reports/evidence/nov12-original-js-engine-masks.png)

[Execution report](reports/nov12-original-masked-frame.json) binds original GRP/ART/MAP loading, sky, room/mask drawing and stable repeated presentation to exact source modules and runtime bytes. Read CURRENT_PORT_STATUS.md for test scope and remaining work. The user prohibits paid external services; verification runs locally and GitHub checkpoint commits use [skip ci].

'''+readme[b:];(R/'README.md').write_text(readme,encoding='utf-8')
for name in ['HANDOFF_SNAPSHOT.json','reports/project-current-status.json']:
 d=json.loads((R/name).read_text());d.update(updated_utc=datetime.now(timezone.utc).isoformat(),compiler_runtime_input_sha256=compiler_runtime_revision(),
 current_video_report='reports/nov12-original-masked-frame.json',current_work='Original app_main/CON/menu/frame loop and UI packed static-array ClockTicks construction',
 current_component_execution_evidence_matches_modules=c['execution_evidence_matches_modules'],component_snapshot_sha256=hashlib.sha256((R/'factory-output/source-first/browser-classic/component-manifest.json').read_bytes()).hexdigest(),
 original_mask_renderer_linked=True,original_sprite_renderer_linked=True,original_mask_renderer_executed=True,original_masked_frame_component_verified=True,
 original_game_sprite_animation_executed=False,original_masked_frame_report='reports/nov12-original-masked-frame.json',original_masked_frame=e['original_rooms_frame'],
 original_masked_frame_screenshot='reports/evidence/nov12-original-js-engine-masks.png',original_masked_frame_screenshot_sha256=p['original_rooms_capture']['sha256'],
 original_masked_frame_changed_pixels=e['original_mask_renderer']['changed_pixels'],original_masked_frame_queued_sprites=e['original_mask_renderer']['queued_sprites'],
 original_repeat_presentation_changed_pixels=0,original_division_callback_boundary_cases=8,
 latest_frozen_targeted_regression='reports/nov12-static-pod-ci-reproduction.json',latest_frozen_targeted_passed=57,latest_frozen_targeted_total=57,
 current_revision_ci_verified=False,current_revision_ci_note='57 local compiler checks before SDL follow-up; 22 Node SDL/display checks, real Chromium runtime and original masked frame pass after it; full suite incomplete',
 current_component_evidence_note='Original raw-map rooms and masks execute with exact module/runtime bytes; app_main/CON/menu/gameplay remain unverified',
 latest_github_ci_verified_sha='8b6b4df5a09c6f5f81e6b708b155a56f4c50d133',latest_github_ci_run='https://github.com/NullNRG/eduke32-readable-js/actions/runs/43271532489',
 execution_cost_constraint='Local compute/browser tests only; no paid external services; GitHub checkpoint commits use [skip ci]',github_cloud_builds_allowed=False)
 (R/name).write_text(json.dumps(d,indent=2)+'\n')
print('Saved exact masked-frame checkpoint and cost constraint')
