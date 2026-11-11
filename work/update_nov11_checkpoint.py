from pathlib import Path
import json,sys,hashlib
from datetime import datetime,timezone
ROOT=Path.cwd();sys.path.insert(0,str(ROOT/'tools'))
from source_ast_to_js import compiler_runtime_revision
campaign=ROOT/'reports/nov11-original-campaign-map-load.json'
c=json.loads(campaign.read_text()) if campaign.is_file() else {}
allmaps=c.get('engine_initialization',{}).get('original_maps_loaded',[]) if c.get('component_passed') else []
extra=(f" The repeated-load campaign probe also passes all {len(allmaps)} supplied campaign maps (`reports/nov11-original-campaign-map-load.json`)." if allmaps else '')
body='''# Current EDuke32 readable JavaScript port - November 11, 2026

**The original game is not yet playable.** Original `app_main`, CON/game initialization, menus, world rendering, sustained gameplay and a playable standalone `dist/index.html` remain unverified. Diagnostic console images are not game screenshots.

The original `engineLoadBoard` now executes successfully in Chromium after original engine/allocator/GRP/palette/console/post-initialization and 640x480 video startup. E1L1 loads 325 sectors, 1,975 walls and 644 sprites. All sector/wall bytes and every sprite coordinate match the supplied original MAP: 83,928 bytes checked. The starting position, angle and sector match the MAP, and original `inside` accepts the start. This is actual original-source map loading, not manually populated state (`reports/nov11-original-e1l1-map-load.json`).EXTRA

Shared compiler repairs preserve anonymous-record ownership when one header is included under multiple typedef names; native enclosing scope remains part of the layout identity. Missing anonymous projected fields now block emission. A new fixture compares 1,024 native/full/filtered results, alias writes and complete object bytes, and rejects changed owner layouts. The current CI-reproduction suite passes **46/46 with unchanged inputs** (`reports/nov11-ci-reproduction-regression.json`); browser/runtime Node checks pass **22/22**. GitHub CI passed source checkpoint `ff0f700` ([run](https://github.com/NullNRG/eduke32-readable-js/actions/runs/43052188110)). The earlier shared-semantics suite passed 15/15 before the finalized pointer-only layout follow-up. A full regression under this latest revision has not passed; the last broad attempt was 243/247, with its four failures subsequently fixed in focused runs.

The original ART map-setup and LZ4 dependency chains now link. Original LZ4 compression passes 128 native-versus-Chromium cases, comparing complete outputs and canaries, including nine insufficient-capacity cases (`reports/nov11-original-lz4-compression-parity.json`). Correct overlapping native pointer/raw-byte unions, trivial union construction and const-pointer limit evaluation replaced invalid prior behavior. Finalized native layout extraction avoids Clang's premature packed-record layout calculation; discarded LLVM output is used solely for native layout diagnostics, never as shipped/executed engine code. Finalized debug type emission also preserves layouts when an owning unit only stores pointers to a record; ABI checks remain strict. Data-only record-array imports retain exact native layouts, type/bounds/stride and ownership checks; an optional JavaScript prototype cannot change their native bytes. Original search helpers previously passed 512 native/Chromium comparisons.

The classic NOASM single-player profile selects 111 original units in `tools/browser_classic_profile.json`. Its partial graph contains 46 source owners, zero invalid imports, 20 ambiguous export groups and one storage-ownership conflict. These are not complete-program success counts. The source semantic fingerprint remains `21a27fbf22e0018081f46b96e01d86264b8d9a480a70f6f53bb693d29d9af765`; current emission of every selected unit is not verified.

The launcher now hashes actual bytes on each verification check, handles rapid same-size/restored-timestamp rewrites, and uses the profile-selected engine execution report. It correctly reports the original startup component as verified and gameplay as unverified.

Next: complete original base ART loading and tile-cache methods (`artLoadFiles`, `tileLoad`), then original classic rendering and the game startup/menu/CON chain. `artSetupMapArt` succeeding alone does not load the base ART textures. The fresh ART frontier and grouped causes are `reports/nov11-art-cache-root-causes.json`: missing original `g_cache`, LZ4 decompression cross-scope control flow and original `engineUnInit` dependencies. Strict acceptance remains failed (`reports/nov11-port-acceptance.json`). Source-accurate out-of-line `cache1d` methods, event/private ownership, remaining global conflicts and browser-yielding original simulation remain necessary. The launcher exists as a developer interface; `npm run compile:game` still cannot produce a verified playable release.

The repository preserves source/compiler/runtime/tests and active generated modules. GRPs, downloaded toolchains, AST/SQLite caches, private semantic payloads and generated pages embedding assets remain private. Original Build/game execution remains readable JavaScript. The approved profile allows WASM only for low-level services; no original game/Build engine is executed in WASM or emulated.
'''.replace('EXTRA',extra)
for name in ['CURRENT_PORT_STATUS.md','ENGINEERING_CHECKPOINT.md']:(ROOT/name).write_text(body,encoding='utf-8')
resume='''# Continue the canonical EDuke32 project

Read `CURRENT_PORT_STATUS.md`, `HANDOFF_SNAPSHOT.json` and the exact current Chromium report. Preserve this codebase, original source/license notices, native storage identity and the classic browser profile. The game is incomplete; do not label a diagnostic/native screenshot as JavaScript gameplay.

From the canonical project in PowerShell:

```powershell
. work/session-env.ps1
python work/verify_original_map_load.py --report reports/nov11-original-e1l1-map-load.json
python work/verify_original_map_load.py --all-grp-maps --report reports/nov11-original-campaign-map-load.json
python work/verify_original_lz4_compression.py --video-mode --report reports/nov11-original-lz4-compression-parity.json
python tools/recover_browser_component.py --snapshot
```

E1L1 now genuinely loads through original `engineLoadBoard`, matching full sector/wall bytes, sprite coordinates and original start, with original `inside` verification. The current CI-reproduction regression is 46/46, Node browser/runtime tests are 22/22 and GitHub CI passed `ff0f700`; it covers native layout finalization, pointer/raw unions, exact anonymous owners, array data ABI, deferred pure pointer limits and fragment replacement. It does not replace a complete suite run or gameplay acceptance.

The next original dependency chain is base ART textures and cache allocation:

```powershell
python work/recover_boot_reachable.py source/build/src/tiles.cpp artLoadFiles,tileLoad --install-closed-leaves
```

See `reports/nov11-art-cache-root-causes.json` and the fresh targeted ART frontier. Complete the generic source-defined out-of-line `cache1d` methods and global object construction, then recover original `drawrooms`/`drawmasks` and `app_main`/CON/menu initialization. Do not replace cache/renderer/game routines with stubs or independent implementations. `artSetupMapArt` is linked, but is not base ART initialization. The native source remains the behavior oracle.

Heavy Clang jobs must stay serial. Reuse only matching compiler/source/preprocessor/ABI fingerprints. Refreshes preserve the exact previous fragment interface and all original storage; additional compiler-emitted helpers do not become owner exports. The strict fragment installer still audits all emitted code/imports/storage. Missing native anonymous fields must stay blocked instead of emitting undefined field reads.

After shared changes stabilize:

```powershell
python tools/verify_recovery_suite.py --jobs 1 --timeout 1200 --report reports/nov11-current-full-regression.json
python tools/verify_port_acceptance.py --build-root factory-output/source-first/browser-classic --out reports/nov11-port-acceptance.json --strict
```

Strict gameplay acceptance is expected to fail until original menu, world rendering, input, audio, saves, offline operation and 60-second gameplay evidence exist. No verified playable `dist/index.html` exists. No real game screenshot exists. Never prepopulate world/game state to bypass original initialization.
'''
(ROOT/'CONTINUE_HERE.md').write_text(resume,encoding='utf-8')
(ROOT/'LLM_CONTINUATION_PROMPT.md').write_text('# LLM continuation\n\nContinue the existing canonical EDuke32 readable-JavaScript port. Follow `CONTINUE_HERE.md` and `CURRENT_PORT_STATUS.md`. E1L1 loading is verified; rendering, original app_main and gameplay are not. Complete the original ART/cache/rendering/game startup dependencies and verify real gameplay. Preserve the approved classic browser/service split, exact ABI/ownership checks and original source behavior. Do not create a clone, substitute renderer, emulator, missing-function stub or false success report.\n',encoding='utf-8')
for name in ['HANDOFF_SNAPSHOT.json','reports/project-current-status.json']:
 p=ROOT/name;d=json.loads(p.read_text());d.update(updated_utc=datetime.now(timezone.utc).isoformat(),compiler_runtime_input_sha256=compiler_runtime_revision(),component_snapshot_sha256=hashlib.sha256((ROOT/'factory-output/source-first/browser-classic/component-manifest.json').read_bytes()).hexdigest(),current_video_report='reports/nov11-original-e1l1-map-load.json',latest_frozen_targeted_regression='reports/nov11-ci-reproduction-regression.json',latest_frozen_targeted_passed=46,latest_frozen_targeted_total=46,original_map_loader_executed=True,original_e1l1_map_loaded=True,original_e1l1_geometry_bytes_verified=83928,original_e1l1_counts={'sectors':325,'walls':1975,'sprites':644},original_lz4_compression_native_cases=128,original_lz4_insufficient_capacity_cases=9,original_lz4_compression_native_chromium_passed=True,current_component_execution_evidence_matches_modules=True,current_work='Complete original base ART/cache methods, then original rendering and app_main/CON/menu startup',gameplay_verified=False,latest_github_ci_verified_sha='ff0f700cf723345b177f1a104c909491947b8273',latest_github_ci_run='https://github.com/NullNRG/eduke32-readable-js/actions/runs/43052188110',browser_runtime_node_passed=22,browser_runtime_node_total=22,current_acceptance_report='reports/nov11-port-acceptance.json',current_acceptance_passed=False,original_art_cache_frontier='reports/nov11-art-cache-root-causes.json')
 if allmaps:d.update(original_campaign_maps_loaded=len(allmaps),original_campaign_map_load_report='reports/nov11-original-campaign-map-load.json')
 p.write_text(json.dumps(d,indent=2)+'\n')
