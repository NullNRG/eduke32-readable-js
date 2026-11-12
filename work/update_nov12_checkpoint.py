from pathlib import Path
from datetime import datetime, timezone
import json
import hashlib
import sys
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'tools'))
from source_ast_to_js import compiler_runtime_revision
ci=json.loads((ROOT/'reports/nov11-ci-reproduction-regression.json').read_text())
assert ci['complete'] and ci['all_passed'] and ci['counts']['passed']==52
status='''# EDuke32 readable JavaScript checkpoint — November 12, 2026

**The original game is not playable yet.** Original app_main, CON/game startup, menus, world rendering, input-driven gameplay and a playable standalone dist/index.html remain unverified. No gameplay screenshot is available.

Original engine/allocator/GRP/palette/console/post-initialization and 640×480 video startup execute in Chromium. Original artLoadFiles loads all 20 supplied ART files: 10,240 dimension values match their headers, with 3,546 nonempty tiles. Original cache1d initBuffer initializes a 16 MiB cache. Original tileLoad then loads 56 representative tiles across every ART file; **all 349,953 pixel bytes match the supplied GRP**, and the original cache advances from one free block to 57 blocks. See reports/nov11-original-tile-pixels.json. This proves source texture loading, not world rendering or gameplay.

Six original out-of-line cache1d instance methods now link with their exact Clang-selected declarations and original receiver identity. New compiler lowering verifies the source/header class contract on both ends of each import; it does not invent methods or replace source bodies. The native/full/filtered instance-method fixture passes 1,024 results. Nested record-array imports preserve native byte layouts while excluding only optional JavaScript prototypes from the physical-layout digest; the 512-case native fixture passes with strict ABI/layout/ownership rejection tests.

The profile now selects the original portable LZ4 decoder using LZ4_FAST_DEC_LOOP=0 only for the original lz4.c unit. Original source bytes are unchanged. The diagnostic decoder passes 128 native/Chromium cases, including insufficient-capacity results, every output byte and canaries. Canonical owner replacement succeeded with 89 definitions and no blocked definitions. Three unconsumed optional fast-loop helpers are explicitly omitted by the original option; provider history is preserved. Canonical decoder execution is being rechecked separately. Shared pointer fixes retain strict actual memory-access checks while allowing original compared endpoint addresses. Focused pointer regression is 5/5; broader current-revision CI is pending.

The native semantic index is current for 111 selected classic single-player NOASM units. Its fingerprint is d906809df5e308b38ac6d3351d9a1dac3f959a172419a553ebc2ddb839055730. A macro-only semantic refresh reused 110 unchanged units and re-extracted only LZ4; all unchanged command rows and native header declarations/references matched exactly (reports/nov11-portable-semantic-delta.json). The generic resume tool initially started an unnecessary full refresh; it was stopped and the verified lossless checkpoint was restored before the successful incremental refresh. The compressed private checkpoint remains the older historical fingerprint; do not describe it as the new index.

Earlier evidence verifies original engineLoadBoard across 41 campaign maps and 4,077,984 geometry bytes. E1L1 has 325 sectors, 1,975 walls and 644 sprites. That historical evidence predates the current module hashes. The last GitHub source CI success was ff0f700; its 46 Python checks and 22 Node tests do not certify the present changes. The current workflow adds four checks and will be run again. No complete-program or gameplay success is implied by any component/export count.

Next: recover and execute original renderDrawRoomsQ16/renderDrawMasks/videoSetViewableArea/renderSetAspect using the original loaded map, palettes and tiles, then original app_main/CON/menu/game loop. Preserve original control flow, allocation identity and source storage. Do not substitute world rendering, manually populate missing game state, stub missing implementations, or use WASM for original Build/game code. Native services alone may use the approved low-level WASM bridge.

GitHub checkpoints preserve compiler/runtime/tests, active readable modules and factual evidence. GRPs, private asset bytes, toolchains, SQLite/AST databases and asset-bearing generated pages stay out of Git. npm run compile:game is still not a verified playable-release pipeline. Full selected-unit emission under this revision, whole-game linking, 90% stable-identity recovery measurement, audio, saves, offline operation and 60-second gameplay acceptance remain incomplete.
'''
status=status.replace('Canonical decoder execution is being rechecked separately.', 'The installed canonical decoder also passes all 128 native/Chromium cases (reports/nov12-canonical-lz4-native-parity.json).')
status=status.replace('Focused pointer regression is 5/5; broader current-revision CI is pending.', 'Focused pointer regression is 5/5; current local CI reproduction passes 50/50 with unchanged compiler/runtime/test inputs.')
status=status.replace('The last GitHub source CI success was ff0f700; its 46 Python checks and 22 Node tests do not certify the present changes. The current workflow adds four checks and will be run again.', 'GitHub source CI passes checkpoint 184121f (https://github.com/NullNRG/eduke32-readable-js/actions/runs/43245627813). Current local CI reproduction is 50/50 and browser/runtime Node tests are 22/22. These checks cover the present source changes, not original gameplay.')
status=status.replace('50/50','52/52')
status+='\nThe latest renderer recovery exposed an original sibling-scope sprite-cleanup jump. A reusable lowering now inlines only a proven terminal-continue suffix into the same original loop, rejecting captured target locals, shadowed bindings, changed loop ownership and nontrivial destruction ordering. Its 1,024 native/full/filtered Node/Chromium results and six control-flow/lifetime regressions pass. Scalar used/unused/asm-label metadata is now excluded from initializer expressions; 512 native/JS state comparisons pass. The original hicfindsubst and kprender chains now link, including the original PNG decoder, without substituted image-decoder stubs. The min overload family remains ambiguous as an unqualified public root; exact selected helpers link. Current renderer re-extraction is still required before claiming a rendered level.\n'
for name in ['CURRENT_PORT_STATUS.md','ENGINEERING_CHECKPOINT.md']:
 (ROOT/name).write_text(status,encoding='utf-8')
resume='''# Continue the canonical EDuke32 project

Read CURRENT_PORT_STATUS.md, HANDOFF_SNAPSHOT.json and reports/nov11-original-tile-pixels.json. The game remains incomplete. Preserve this canonical codebase and original source/license notices.

```powershell
. work/session-env.ps1
python work/verify_original_tile_pixels.py
python work/verify_portable_lz4_diagnostic.py --canonical
python work/recover_boot_reachable.py source/build/src/engine.cpp renderDrawRoomsQ16,renderDrawMasks,videoSetViewableArea,renderSetAspect --install-closed-leaves
python work/reproduce_source_ci.py
python tools/recover_browser_component.py --snapshot
```

Heavy Clang jobs must remain serial. The rendering command may leave a partial frontier; inspect it and recover shared source dependencies, never fill missing source functions with stubs. Original ART/cache loading and pixel bytes are verified, but app_main/CON/menu/world rendering/gameplay are not. Diagnostic/native screenshots must not be labeled JavaScript gameplay.

The semantic index already matches the portable codec profile. Do not reset it with a changed-command generic resume. tools/refresh_semantic_unit.py supports --before-commands for a verified one-unit macro-only change; all unrelated commands and header semantics must remain identical. The older private compressed checkpoint has a different historical fingerprint.

Use work/reproduce_source_ci.py for current 52-check local CI reproduction. Focused native/JS results are component evidence only. Run the complete regression at integration stabilization and strict original-game acceptance before publishing a playable artifact. No verified playable dist/index.html currently exists. Keep committing source checkpoints and exact evidence to NullNRG/eduke32-readable-js; never commit GRPs, SDKs, AST/SQLite caches or asset-bearing generated HTML.
'''
(ROOT/'CONTINUE_HERE.md').write_text(resume,encoding='utf-8')
(ROOT/'LLM_CONTINUATION_PROMPT.md').write_text('Continue the existing canonical EDuke32 readable-JavaScript port. Follow CONTINUE_HERE.md and CURRENT_PORT_STATUS.md. Original engine, ART/cache and 56 tiles/349,953 exact pixel bytes are verified; app_main, menu, world rendering and gameplay are not. Complete original rendering and game startup; preserve original source behavior and typed ABI/ownership. Never claim gameplay from component probes. Keep GitHub checkpoints current.\n',encoding='utf-8')
for name in ['HANDOFF_SNAPSHOT.json','reports/project-current-status.json']:
 p=ROOT/name;doc=json.loads(p.read_text())
 doc.update(updated_utc=datetime.now(timezone.utc).isoformat(),current_video_report='reports/nov11-original-tile-pixels.json',current_work='Original classic world rendering, then app_main/CON/menu/game loop',original_art_load_verified=True,original_art_files=20,original_art_dimension_values_verified=10240,original_art_nonempty_tiles=3546,original_cache_bytes=16777216,original_tile_pixels_verified=True,original_tile_pixel_bytes_verified=349953,original_tile_pixel_tiles_verified=56,semantic_fingerprint='d906809df5e308b38ac6d3351d9a1dac3f959a172419a553ebc2ddb839055730',semantic_units_reused=110,semantic_units_reextracted=1,current_revision_ci_verified=False,original_app_main_executed=False,world_rendering_verified=False,gameplay_verified=False,standalone_player_verified=False)
 doc['current_component_execution_evidence_matches_modules']=False
 doc['current_component_evidence_note']='Recompute component snapshot after renderer recovery; pixel report binds its exact modules and runtime.'
 doc.update(compiler_runtime_input_sha256=compiler_runtime_revision(),
  component_snapshot_sha256=hashlib.sha256((ROOT/'factory-output/source-first/browser-classic/component-manifest.json').read_bytes()).hexdigest(),
  latest_frozen_targeted_passed=52,latest_frozen_targeted_total=52,current_revision_ci_verified=True,
  latest_github_ci_verified_sha='184121ff93232e30b810cf1e43b92b09a6d91126',
  latest_github_ci_run='https://github.com/NullNRG/eduke32-readable-js/actions/runs/43245627813',
  original_lz4_decode_canonical_native_chromium_passed=True,original_lz4_decode_canonical_cases=128,
  original_art_cache_frontier='reports/nov11-original-tile-pixels.json',
  semantic_current_delta_report='reports/nov11-portable-semantic-delta.json',
  semantic_compressed_payload_is_historical=True)
 p.write_text(json.dumps(doc,indent=2)+'\n')
