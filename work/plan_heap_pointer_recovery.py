import json
from pathlib import Path
p=json.loads(Path('work/pointer-array-priorities.json').read_text())
front=['source/build/src/smmalloc_generic.cpp','source/mimalloc/src/alloc.c','source/build/src/osd.cpp','source/build/src/loguru.cpp','source/build/src/baselayer.cpp','source/duke3d/src/game.cpp']
old={r['source']:r for r in p['priority_units']}
for n,name in enumerate(front):old[name]={'source':name,'score':5000-n,'reason':'original startup allocator/logging closure'}
p['priority_units']=sorted(old.values(),key=lambda r:-r['score'])
Path('work/heap-pointer-priorities.json').write_text(json.dumps(p,indent=2)+'\n')

