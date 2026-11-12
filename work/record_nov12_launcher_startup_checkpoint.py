from pathlib import Path
from datetime import datetime,timezone
import json,hashlib,sys
R=Path.cwd();sys.path.insert(0,str(R/'tools'))
from source_ast_to_js import compiler_runtime_revision
revision=compiler_runtime_revision();base=R/'factory-output/source-first/browser-classic'
profile=json.loads((R/'tools/browser_classic_profile.json').read_text());index=json.loads((base/'browser-modules/browser-combined-symbol-owners.json').read_text())
candidates=[]
for path in (base/'boot-probes/source_duke3d_src_game.cpp').rglob('game.cpp.manifest.json'):
 d=json.loads(path.read_text())
 if d.get('compiler_runtime_input_sha256')==revision and any(r.get('source_parameter_bindings') for r in d['definitions']) and any(r.get('source_name')=='app_main' for r in d['definitions']):candidates.append((path.stat().st_mtime_ns,path,d))
assert candidates
_,path,d=max(candidates,key=lambda x:x[0]);entry=next(r for r in d['definitions'] if r.get('source_name')=='app_main')
report={'format':'original-app-main-current-frontier/1','source':d['source'],'manifest':path.relative_to(R).as_posix(),'compiler_runtime_input_sha256':revision,
 'entry_linked':False,'entry_emission_status':entry['status'],'stage_unresolved':entry.get('unresolved_references',[]),
 'still_without_current_provider':[n for n in entry.get('unresolved_references',[]) if n not in index],
 'providers_recovered_since_stage':{n:index[n] for n in entry.get('unresolved_references',[]) if n in index},
 'blocked_definitions':[{'name':r['name'],'file':r.get('physical_source',d['source']),'line':r.get('line'),'type':r.get('original_type'),'reason':r.get('reason'),'missing':r.get('unresolved_references',[])} for r in d['definitions'] if r['status']=='blocked'],
 'original_gameplay_verified':False,'parameter_binding_recovery_installed_closed_definitions':60,
 'additional_frontiers':['factory-output/source-first/browser-classic/reports/frontier-source_duke3d_src_game.cpp.json','factory-output/source-first/browser-classic/reports/frontier-source_duke3d_src_anim.cpp.json'],
 'note':'The unit-level frontier is the most recent timer probe. This file retains the actual app_main whole-unit catalog. Counts are not all-game independent blockers.'}
(R/'reports/nov12-app-main-current-frontier.json').write_text(json.dumps(report,indent=2)+'\n')
c=json.loads((base/'component-manifest.json').read_text());assert c['execution_evidence_matches_modules']
for filename in ['HANDOFF_SNAPSHOT.json','reports/project-current-status.json']:
 p=R/filename;x=json.loads(p.read_text());x.update(updated_utc=datetime.now(timezone.utc).isoformat(),compiler_runtime_input_sha256=revision,
  component_snapshot_sha256=hashlib.sha256((base/'component-manifest.json').read_bytes()).hexdigest(),current_component_execution_evidence_matches_modules=True,
  latest_frozen_targeted_regression='reports/nov12-parameter-bindings-ci-final.json',latest_frozen_targeted_passed=58,latest_frozen_targeted_total=58,
  current_local_ci_profile_verified=True,current_revision_ci_verified=False,current_revision_ci_note='58/58 local CI-profile checks pass under frozen inputs; cloud CI intentionally skipped; full suite and gameplay incomplete',
  engine_launcher='engine-player.html',engine_launcher_guide='PORT_GUIDE.md',engine_launcher_verification='reports/nov12-grp-launcher.json',
  engine_launcher_tested_maps=['E1L1.MAP','E1L2.MAP'],engine_launcher_archive_upload=False,
  expanded_parameter_bindings_native_cases=4096,startup_recovery_installed_definitions=60,
  app_main_frontier_report='reports/nov12-app-main-current-frontier.json',current_work='Original app_main boot closure; UI packed static arrays, animation reference tables and script events',
  engine_launcher_scope='Raw MAP engine frames; original game startup, CON and gameplay remain unverified')
 p.write_text(json.dumps(x,indent=2)+'\n')
for filename in ['CURRENT_PORT_STATUS.md','ENGINEERING_CHECKPOINT.md']:
 p=R/filename;s=p.read_text();s=s.replace('57/57 local compiler CI-profile checks passed before the display follow-up','58/58 local compiler CI-profile checks now pass under frozen inputs')
 s+='''\nThe GRP/MAP launcher is engine-player.html, linked from the root dashboard. It passed real Chromium file-selection and fresh E1L1/E1L2 sessions, with no archive upload or remote requests (reports/nov12-grp-launcher.json). PORT_GUIDE.md explains the port and operation.\n\nThe latest shared compiler repair binds expanded parameter packs by unique Clang declaration IDs. It passes 4,096 native/full/filtered Node/Chromium results and restores valid JavaScript for original buildprint specializations. The installer admitted 60 closed original definitions after rejecting the earlier duplicate-parameter output. This is not game boot. The original MUSIC_Update body was recovered unchanged; its empty original body is not evidence of audio playback. The timer still needs G_HandleSpecialKeys dependencies. Anim_Init remains blocked at static array initialization. The actual app_main catalog is preserved in reports/nov12-app-main-current-frontier.json.\n''';p.write_text(s)
p=R/'PORT_GUIDE.md';s=p.read_text();a=s.index('The compiler\'s local CI-profile checks');b=s.index('## How the port works',a)
s=s[:a]+'''The compiler's local CI-profile checks now pass **58/58 under frozen inputs**. Relevant Node SDL/display tests, the local Chromium runtime check and actual file-selection/engine frame checks also pass. Expanded parameter-pack bindings match native behavior for 4,096 values. The complete current regression suite, native game-state parity and 60-second gameplay acceptance are still incomplete. Historical emission/blocker counts span revisions and are not a completion percentage.

The current app_main dependency catalog is reports/nov12-app-main-current-frontier.json. The latest compiler repair allowed 60 closed source definitions to install, but original startup still has unresolved dependencies. Anim_Init's static arrays, rotatesprite's packed ClockTicks array, script events and the timer special-key path need further work. Original MUSIC_Update is now linked with its original empty body; this does not establish audio functionality.

'''+s[b:];p.write_text(s)
print('Saved current launcher, frozen checks and original app_main frontier')
