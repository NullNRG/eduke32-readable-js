import json,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
build=ROOT/'factory-output/source-first/oct15-heap-pointer-recovery'
checkpoint=json.loads((build/'checkpoint.json').read_text())
rows=[]
for batch in checkpoint['batch_cache'].values():
 if batch.get('status')!='ok':continue
 directory=(build/Path(batch['manifest'])).parent
 for source in batch['sources']:
  file=directory/(source+'.manifest.json');m=json.loads(file.read_text())
  for definition in m['definitions']:
   if definition['status']=='blocked':rows.append({'source':source,**definition})
priority={'source/duke3d/src/game.cpp':0,'source/build/src/baselayer.cpp':1,'source/build/src/osd.cpp':2,'source/build/src/smmalloc_generic.cpp':3,'source/mimalloc/src/alloc.c':4}
rows.sort(key=lambda d:(priority.get(d['source'],20),d.get('line') or 0))
selected=[d for d in rows if d['name'] in ('app_main','engineSetLogFile','engineLogCallback','OSD_Init','OSD_Puts','mi_new','mi_free','mi_new_nothrow','mi_free_size') or 'original_allocator_definition' in d]
report={'format':'current-source-partial-startup-frontier/1','scope':'Only committed latest compiler batches; not a complete 156-unit inventory','compiler_frontend_sha256':hashlib.sha256((ROOT/'tools/source_ast_to_js.py').read_bytes()).hexdigest(),'compiler_fingerprint':checkpoint['fingerprint'],'committed_units':len(checkpoint['batch_cache']),'startup_definitions':selected,'game_booted':False,'gameplay_verified':False}
(ROOT/'reports/oct15-current-partial-frontier.json').write_text(json.dumps(report,indent=2)+'\n')
for d in selected:print(d['source'],d['name'],d.get('reason'))
