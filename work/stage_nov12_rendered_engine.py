import json,hashlib,sys,subprocess
from pathlib import Path
ROOT=Path.cwd();sys.path.insert(0,str(ROOT/'tools'))
import recover_browser_component as component
with component.component_lock():
 report=component.checkpoint()
 proof=json.loads((ROOT/'reports/nov12-original-rooms-frame.json').read_text())
 assert proof['component_passed'] and proof['engine_initialization']['original_rooms_frame_rendered']
 paths=[]
 for p in component.OUT.rglob('*.manifest.json'):
  d=json.loads(p.read_text())
  if not d.get('source'):continue
  paths += [p,component.OUT/(d['source']+'.mjs')]
  paths += [component.OUT/f['module'] for f in d.get('module_fragments',[])]
 paths += [component.BASE/'component-manifest.json',component.OUT/'browser-combined-symbol-owners.json',component.BASE/'reports/browser-closure.json']
 for source in ['source/build/src/engine.cpp','source/build/src/hightile.cpp','source/build/src/kplib.cpp','source/duke3d/src/common.cpp']:
  p=component.BASE/'reports'/('frontier-'+source.replace('/','_')+'.json')
  if p.is_file():paths.append(p)
 paths += [ROOT/'reports/nov12-original-rooms-frame.json',ROOT/'reports/evidence/nov12-original-js-rooms-only.png',ROOT/'reports/browser-classic-original-engine-video.json',ROOT/'reports/nov12-original-game-sky-init.log',ROOT/'reports/nov12-renderer-scoped-types-refresh.log',ROOT/'reports/nov12-classic-renderer-whole-unit.log',ROOT/'reports/nov12-classic-rooms-scalar-round.log']
 names=sorted({p.relative_to(ROOT).as_posix() for p in paths})
 assert all((ROOT/p).is_file() for p in names)
 subprocess.run(['git','add','-f','--',*names],check=True)
 print(json.dumps({'staged_active_files':len(names),'invalid_imports':len(report['invalid_imports']),'component_evidence_matches_modules':report['execution_evidence_matches_modules'],'room_frame':proof['engine_initialization']['original_rooms_frame'],'gameplay_verified':False},indent=2))
