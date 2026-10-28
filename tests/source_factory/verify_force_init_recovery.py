"""Assert four original EDuke32 module-init failures are resolved in actual Chromium."""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
report=json.loads((ROOT/'reports/force-browser/chromium.json').read_text())
required={'source/duke3d/src/dnames.cpp.mjs',
          'source/duke3d/src/gamevars.cpp.mjs',
          'source/duke3d/src/player.cpp.mjs',
          'source/duke3d/src/network.cpp.mjs'}
assert report['browser']=='Chromium'
assert report['source_modules_attempted']==151
assert report['loaded']==136 and report['failed']==15
assert not report['browser_exceptions']
assert report['grp']['hasE1L1']
assert not report['original_gameplay_verified']
assert not report['original_app_main_absent'] is False
result={item['module']:item for item in report['failedModules']}
assert not (required & result.keys()), required & result.keys()
print('PASS: Chromium evaluates 136/151 source JS modules, including four recovered TUs; 15 failures remain')
