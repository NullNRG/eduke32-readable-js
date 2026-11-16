"""Stage active source modules and bounded evidence; exclude caches and assets."""
import json,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
MODULES=ROOT/'factory-output/source-first/browser-classic/browser-modules'
paths=set()
for manifest in MODULES.rglob('*.manifest.json'):
 doc=json.loads(manifest.read_text());source=doc.get('source')
 if not source:continue
 paths.update((manifest,MODULES/(source+'.mjs')))
 for fragment in doc.get('module_fragments',[]):paths.add(MODULES/fragment['module'])
paths.add(MODULES/'browser-combined-symbol-owners.json')
for name in ('component-manifest.json','reports/browser-closure.json','reports/frontier-source_build_src_clip.cpp.json','reports/frontier-source_build_src_engine.cpp.json','reports/frontier-source_build_src_screentext.cpp.json','reports/frontier-source_duke3d_src_common.cpp.json','reports/frontier-source_duke3d_src_game.cpp.json','reports/frontier-source_duke3d_src_text.cpp.json','reports/frontier-source_duke3d_src_cmdline.cpp.json','reports/frontier-source_duke3d_src_demo.cpp.json','reports/frontier-source_duke3d_src_screens.cpp.json'):
 path=MODULES.parent/name
 if path.is_file():paths.add(path)
for name in ('README.md','CURRENT_PORT_STATUS.md','CONTINUE_HERE.md','PORT_GUIDE.md','HANDOFF_SNAPSHOT.json',
 'work/attest_original_wall_overloads.py','work/record_nov16_checkpoint.py','work/stage_nov16_checkpoint.py',
 'work/verify_original_command_line_init.py','work/verify_original_game_lookups.py','work/verify_original_crosshair_frame.py','work/verify_original_collision_geometry.py',
 'reports/nov13-original-command-line-init.json','reports/nov13-original-command-line-parity.log',
 'reports/nov13-original-game-lookups.json','reports/nov13-original-game-lookups-node.log',
 'reports/nov13-original-crosshair-frame.json','reports/evidence/nov13-original-crosshair-services.png',
 'reports/nov16-original-overload-attestation.json','reports/nov16-original-collision-geometry.json','reports/nov16-original-collision-node.log',
 'reports/nov16-original-font-blockers.json',
 'reports/nov16-startup-collision-ci.json','reports/nov16-startup-collision-ci.log','reports/nov16-app-main-current-frontier.json','reports/nov16-integration-checkpoint.md',
 'reports/browser-classic-original-engine-video.json','reports/nov12-original-masked-frame.json'):
 path=ROOT/name
 if path.is_file():paths.add(path)
assert all(path.is_file() and path.is_relative_to(ROOT) for path in paths)
assert not any(path.suffix.lower() in ('.grp','.sqlite','.gz','.zip') for path in paths)
relative=sorted(path.relative_to(ROOT).as_posix() for path in paths)
# Individual git path arguments avoid Windows command-line length limits.
for at in range(0,len(relative),60):subprocess.run(['git','add','-f','--',*relative[at:at+60]],cwd=ROOT,check=True)
print('Staged',len(paths),'active source/proof files; no game archives, SDKs or AST caches')
if __name__!='__main__':raise RuntimeError('Run this staging script explicitly')
