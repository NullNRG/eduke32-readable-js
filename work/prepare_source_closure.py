import json
from pathlib import Path
p=Path('work/cpp-reference-boot-priorities.json')
rows=json.loads(p.read_text())['priority_units']
for source in ('source/build/src/pragmas.cpp','source/build/src/osd.cpp','source/duke3d/src/game.cpp','source/build/src/clip.cpp','source/build/src/tiles.cpp'):
 rows.append({'source':source,'score':990-len(rows),'reason':'original startup and rendering dependencies after macro/sysroot header recovery'})
Path('work/source-closure-priorities.json').write_text(json.dumps({'priority_units':rows},indent=2)+'\n')
