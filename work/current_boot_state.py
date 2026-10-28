import json
from pathlib import Path
for p in ['factory-output/source-first/oct15-heap-pointer-recovery/recovery-report.json','factory-output/source-first/oct15-heap-pointer-linked/global-recovery.json','reports/oct15-postbuild-boot.json']:
 d=json.loads(Path(p).read_text());print(p)
 print({k:v for k,v in d.items() if not isinstance(v,(list,dict))})
 print('nested keys',[(k,len(v))for k,v in d.items()if isinstance(v,(list,dict))])
root=Path('factory-output/source-first/oct15-heap-pointer-linked')
for rel,names in [('source/build/src/baselayer.cpp',['engineLogCallback','engineSetLogFile']),('source/build/src/loguru.cpp',['add_callback','remove_callback','add_file','s_mutex','s_callbacks']),('source/build/src/osd.cpp',['OSD_Init','OSD_Puts'])]:
 d=json.loads((root/(rel+'.manifest.json')).read_text());print(rel)
 for row in d['definitions']:
  if row['name'] in names:print(row['name'],row['status'],row.get('reason'),row.get('source_references'))
