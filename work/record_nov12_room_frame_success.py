from pathlib import Path
from datetime import datetime,timezone
import json,hashlib,sys
R=Path.cwd();sys.path.insert(0,str(R/'tools'))
from source_ast_to_js import compiler_runtime_revision
p=json.loads((R/'reports/nov12-original-rooms-frame.json').read_text());c=json.loads((R/'factory-output/source-first/browser-classic/component-manifest.json').read_text())
assert p['component_passed'] and c['execution_evidence_matches_modules']
body='''# EDuke32 readable JavaScript checkpoint — November 12, 2026

**Original E1L1 room geometry now renders in Chromium through the original Build engine in readable JavaScript. The full game is still not playable.** Original app_main, CON/game startup, menus, masked walls/sprites, player controls, combat, audio, saves and sustained gameplay remain unverified. There is no verified playable dist/index.html.

![Original JavaScript Build room renderer, not yet gameplay](reports/evidence/nov12-original-js-rooms-only.png)

This is an actual 640×480 Canvas capture after original allocator/engine/GRP/palette/console/post-initialization, video setup, artLoadFiles, engineLoadBoard, G_InitMultiPsky, videoSetPalette, videoSetViewableArea, renderDrawRoomsQ16 and videoShowFrame. The sky setup uses the original game's four tile globals and original five-descriptor initialization. No world geometry, textures or sky table were fabricated or manually populated. The probe checks 83,928 loaded geometry bytes against the supplied E1L1 MAP, then renders 97 colors and 209,720 nonblack pixels. Source execution traces, module/runtime hashes and PNG SHA-256 are in reports/nov12-original-rooms-frame.json. The screenshot hash is 2d6e3b544cd1a4c8383b5e81fd7c835bd7a53dbab6d19d44d64df9dc3b619a7c. This is an engine-component frame, not app_main/menu/gameplay acceptance.

The earlier original ART/cache probe verifies all 20 ART headers, 10,240 dimensions, a 16 MiB cache and 349,953 exact pixel bytes across 56 representative tiles. Historical campaign evidence loads all 41 maps and checks 4,077,984 geometry bytes. Those historical reports bind their earlier artifact hashes; the latest room-frame report binds the current active component. The canonical original portable LZ4 decoder passes 128 native/Chromium cases including negative-capacity results and canaries. Its original source is unchanged; only that unit selects LZ4_FAST_DEC_LOOP=0.

Shared compiler repairs recover source-defined out-of-line instance methods with exact selected declarations/receiver identity, native nested-array layout contracts, guarded pointer endpoints, proven same-loop terminal cleanup jumps and scalar retention attributes. The new scalar SSE idiom requires the exact native load/convert bodies, float32 parameter and int32 return semantics; it lowers to readable nearest/ties-even arithmetic under default MXCSR. 8,192 native/Node/Chromium results cover float32 ties, signed zero, subnormals, NaNs/infinities and overflow. Assignments now use the exact Clang lvalue type instead of a stale name cache; 2,560 native/full/filtered comparisons verify differently typed shadows, pointer stride/alias writes, float32 and uint16 storage. Unknown closure/vector storage and unsupported source semantics stay blocked.

The latest completed local CI reproduction is 54/54; Node browser/runtime checks are 22/22. The subsequent refresh-driver recipe was validated by the actual successful original renderer execution. These scoped checks do not replace the complete regression suite, full native engine parity, or gameplay acceptance. The driver supports hash-pinned whole-unit fragment refresh while preserving its exact old interface and storage. Its header selection matches normal whole-unit recovery; explicit all-header selection had introduced unrelated dependency conflicts and was refused without altering the owner.

The authoritative classic single-player NOASM profile selects 111 original units. All selected native semantic extraction is current at fingerprint d906809df5e308b38ac6d3351d9a1dac3f959a172419a553ebc2ddb839055730; the codec macro-only refresh reused 110 units and re-extracted one with unchanged neighboring/header semantics. Whole-program current-revision emission/linking and the separate 90% stable-declaration recovery measurement are incomplete. The partial browser graph has 48 source owners and zero invalid imports; remaining ambiguous owners and a storage conflict are not whole-program success. The whole-engine attempt has 19 blocked records, which is not a count of all remaining game blockers.

Next: recover the original renderDrawMasks lambdas and sprite control flow, then original app_main/CON/menu/game-loop startup. The room probe's original game sky initialization fixed an actual missing prerequisite; its earlier null sky pointer was not repaired by inventing storage. Full reachable storage ownership, yielding original simulation, audio, saves, offline bundling and 60-second gameplay evidence are still required. npm run compile:game is not yet a verified playable-release pipeline. Keep Play gated on exact-artifact gameplay evidence.

Preserve the original source/licenses and this canonical codebase. Original Build/game code runs in readable JavaScript. Only approved low-level services may use WASM; no engine/game WASM, CPU emulation, substitute renderer or success stubs. GRPs, SDK/toolchains, raw AST/SQLite databases and asset-bearing generated HTML stay out of GitHub. This screenshot is source-engine evidence, not a playable release.
'''
for name in ['CURRENT_PORT_STATUS.md','ENGINEERING_CHECKPOINT.md']:(R/name).write_text(body,encoding='utf-8')
resume='''# Continue the canonical EDuke32 project

Read CURRENT_PORT_STATUS.md, HANDOFF_SNAPSHOT.json and reports/nov12-original-rooms-frame.json. Original E1L1 room rendering now passes in Chromium. The game remains incomplete: app_main, menu, CON, masks/sprites and gameplay have not passed.

```powershell
. work/session-env.ps1
python work/verify_original_rooms_frame.py
python work/recover_boot_reachable.py source/build/src/engine.cpp renderDrawMasks --install-closed-leaves
python work/reproduce_source_ci.py
python tools/recover_browser_component.py --snapshot
```

The renderer uses original ART/MAP loading, original G_InitMultiPsky with original dnames globals, original palette/video calls and original renderDrawRoomsQ16. Do not replace missing game initialization with hand-built data. The room capture is source-engine component evidence and must not be called playable gameplay.

The current mask frontier is lambda closure/call lowering. classicDrawSprite also has a sibling-scope jump, and UI rotatesprite storage is still blocked. Recover generic source semantics and retry their full affected chains. Continue original game.cpp app_main/CON/menu startup after engine rendering. Keep heavy Clang jobs serial.

Existing exports do not mean their generated bodies were refreshed. For shared fixes, find the exact active module_fragments entry and refresh its complete export set using tools/recover_browser_component.py --refresh-fragment-sha256 HASH --whole-unit-refresh. That mode preserves original storage and the exact prior interface, uses source-proven header aliases only when required, and omits unrelated explicit all-header selection. Never bypass its ABI/identity checks. Use a fresh browser realm after replacing a fragment.

The native semantic index already matches the 111-unit portable-codec profile (d906809d). Compiler-only repairs do not require replaying the native index. Do not trigger a changed-input generic index resume; targeted primary-unit semantic refresh must verify all unchanged commands/header observations. The compressed private index payload is an older historical fingerprint; the verified macro-only delta is reports/nov11-portable-semantic-delta.json.

The last local CI reproduction passed 54/54 and runtime Node checks 22/22; full regression and strict original-game acceptance remain incomplete. No playable dist/index.html exists. Keep pushing source, active modules, exact evidence and factual notes to NullNRG/eduke32-readable-js. Never push GRPs, SDKs, raw AST/SQLite caches or asset-bearing generated HTML. Do not publish a playable release until original boot/menu/gameplay/offline/save/audio checks pass.
'''
(R/'CONTINUE_HERE.md').write_text(resume,encoding='utf-8')
(R/'LLM_CONTINUATION_PROMPT.md').write_text('Continue this canonical EDuke32 readable-JavaScript project. Read CONTINUE_HERE.md and CURRENT_PORT_STATUS.md. Original E1L1 rooms now genuinely render in Chromium; see reports/nov12-original-rooms-frame.json and its screenshot. The game is not playable: app_main, CON/menu, masks/sprites, controls, audio, saves and full gameplay remain unverified. Implement generic lambda/sprite/UI semantics, then complete original startup and simulation. Preserve original source/ABI/storage, the approved low-level service split and exact-artifact evidence. No clone, substitute renderer, engine WASM/emulation or success stubs. Keep GitHub current.\n',encoding='utf-8')
for name in ['HANDOFF_SNAPSHOT.json','reports/project-current-status.json']:
 f=R/name;d=json.loads(f.read_text());d.update(updated_utc=datetime.now(timezone.utc).isoformat(),compiler_runtime_input_sha256=compiler_runtime_revision(),component_snapshot_sha256=hashlib.sha256((R/'factory-output/source-first/browser-classic/component-manifest.json').read_bytes()).hexdigest(),current_video_report='reports/nov12-original-rooms-frame.json',current_rooms_report='reports/nov12-original-rooms-frame.json',original_room_renderer_linked=True,original_room_renderer_entered_in_chromium=True,original_rooms_frame_verified=True,original_rooms_frame=p['engine_initialization']['original_rooms_frame'],original_rooms_screenshot='reports/evidence/nov12-original-js-rooms-only.png',original_rooms_screenshot_sha256=p['original_rooms_capture']['sha256'],original_game_sky_initialization_executed=True,current_component_execution_evidence_matches_modules=True,current_work='Original masks/lambdas/sprites, then app_main/CON/menu/gameplay',latest_frozen_targeted_passed=54,latest_frozen_targeted_total=54,current_revision_ci_note='54/54 local compiler checks; refresh recipe follow-up verified by real original Chromium room rendering',gameplay_verified=False,world_rendering_verified=False,original_masked_world_verified=False,standalone_player_verified=False)
 d['current_component_evidence_note']='The current successful room-component report binds exact module/runtime bytes; gameplay remains unverified.'
 f.write_text(json.dumps(d,indent=2)+'\n')
r=R/'README.md';t=r.read_text(encoding='utf-8');start=t.index('Original **');end=t.index('The project continues',start)
t=t[:start]+'''Original **E1L1 room geometry now renders in Chromium through the original Build engine in readable JavaScript**. The full game is not playable yet. Original app_main, CON/menu startup, masked sprites, controls, combat, audio and saves remain unverified. There is no verified playable dist/index.html.

![Original JavaScript Build room renderer — component evidence, not gameplay](reports/evidence/nov12-original-js-rooms-only.png)

The frame uses original GRP/ART/MAP loading, original game sky initialization, original palette/video setup and original renderDrawRoomsQ16. [Execution report](reports/nov12-original-rooms-frame.json) binds the capture to exact source modules and runtime bytes. Current local compiler checks pass 54/54; Node runtime checks pass 22/22. These component checks do not establish playable game boot.

'''+t[end:];r.write_text(t,encoding='utf-8')
