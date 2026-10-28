import json
from pathlib import Path
sources=['source/build/src/engine.cpp','source/build/src/osd.cpp','source/build/src/baselayer.cpp','source/duke3d/src/sector.cpp','source/duke3d/src/actors.cpp','source/duke3d/src/global.cpp','source/duke3d/src/game.cpp','source/build/src/loguru.cpp']
commands=json.loads(Path('factory-output/compile_commands.json').read_text());selected={x['file']for x in commands}
assert all(s in selected for s in sources),set(sources)-selected
p={'format':'contiguous-record-affected-unit-plan/1','priority_units':[{'source':s,'score':1000-i,'reason':'world storage / original startup closure'}for i,s in enumerate(sources)]}
Path('work/contiguous-record-priorities.json').write_text(json.dumps(p,indent=2)+'\n')
