"""Retry a bounded original startup frontier against proven browser providers.

Keep canonical storage in its original owner. Record every rejection; neither
blocked dependencies nor duplicated globals can be labelled recovered.
"""
import argparse,hashlib,json,re,subprocess,sys,time
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'tools'))
from browser_target_closure import build,active_exports
TARGET=ROOT/'factory-output/source-first/oct20-engine-preinit-browser'
p=argparse.ArgumentParser();p.add_argument('--label',default='oct23-boot-frontier');p.add_argument('--entries',nargs='+');a=p.parse_args()
assert re.fullmatch(r'[A-Za-z0-9_-]+',a.label)
OUT=ROOT/'factory-output/source-first'/a.label
jobs=[('source/build/src/pragmas.cpp','initdivtables'),('source/build/src/clip.cpp','engineInitClipMaps'),
      ('source/build/src/baselayer.cpp','initprintf'),('source/build/src/sdlayer.cpp','initsystem'),
      ('source/build/src/sdlayer.cpp','videoGetModes'),('source/build/src/baselayer.cpp','baselayer_init'),
      ('source/build/src/engine.cpp','enginePreInit'),('source/duke3d/src/game.cpp','app_main'),
      ('source/build/src/compat.cpp','handle_memerr')]
if a.entries:
    # Resolve requested providers from actual source manifests. Never invent
    # ownership or select a similarly named function from a different unit.
    candidates={}
    for path in (TARGET/'source').rglob('*.manifest.json'):
        doc=json.loads(path.read_text());source=doc.get('source')
        if not source:continue
        for row in doc.get('definitions',[]):
            if (row.get('kind')=='FunctionDecl' and row.get('physical_source',source)==source
                    and row.get('name')==row.get('source_name',row.get('name'))):
                candidates.setdefault(row['name'],set()).add(source)
    jobs=[]
    for entry in dict.fromkeys(a.entries):
        owners=candidates.get(entry,set())
        if len(owners)!=1:raise SystemExit('No unique original function owner: '+entry+' '+repr(owners))
        jobs.append((next(iter(owners)),entry))
report={'format':'original-boot-frontier-recovery/1','jobs':[],'gameplay_verified':False}
def save():
    (ROOT/'reports'/(a.label+'.json')).write_text(json.dumps(report,indent=2)+'\n')
for source,entry in jobs:
    if entry in active_exports(TARGET/(source+'.mjs')):
        report['jobs'].append({'source':source,'entry':entry,'status':'already-present'});save();continue
    build(TARGET,TARGET,ROOT/'reports'/(a.label+'-platform-closure.json'))
    symbols=json.loads((TARGET/'browser-combined-symbol-owners.json').read_text())
    # Private globals are visible to a fragment of the SAME original unit only.
    # The compiler verifies the real exported storage binding and ABI again.
    local=json.loads((TARGET/(source+'.manifest.json')).read_text())
    exported=active_exports(TARGET/(source+'.mjs'))
    for row in local['definitions']:
        if row['status']=='source-first' and row['name'] in exported and row.get('linkage')=='internal':symbols[row['name']]=source
    symbols.pop(entry,None)
    folder=OUT/entry;folder.mkdir(parents=True,exist_ok=True)
    index=folder/'symbols.json';index.write_text(json.dumps(symbols,indent=2)+'\n')
    args=[sys.executable,'tools/source_ast_to_js.py','--root','factory-output/source-tree/eduke32-master','--source',source,
          '--compile-commands','factory-output/compile_commands.json','--filter',entry,'--out-dir',str(folder),
          '--project-symbols',str(index),'--import-root',str(TARGET),'--dependency-closure','--enum-closure','--header-dependency-closure']
    log=ROOT/'reports'/(a.label+'-'+entry+'.log');start=time.monotonic()
    with log.open('w',encoding='utf-8') as stream:
        try:code=subprocess.run(args,cwd=ROOT,stdout=stream,stderr=subprocess.STDOUT,timeout=240).returncode
        except subprocess.TimeoutExpired:code='timeout'
    result={'source':source,'entry':entry,'returncode':code,'seconds':round(time.monotonic()-start,2),'log':log.relative_to(ROOT).as_posix()}
    manifest=folder/(source+'.manifest.json')
    if code!=0 or not manifest.is_file():result['status']='compile-rejected'
    else:
        doc=json.loads(manifest.read_text());selected=[r for r in doc['definitions'] if r['name']==entry]
        result['definition']=selected
        conflicts=[r['name'] for r in doc['definitions'] if r['status']=='source-first' and r['kind']=='VarDecl' and r['name'] in exported]
        if conflicts:result.update(status='duplicate-storage-rejected',conflicts=conflicts)
        elif len(selected)!=1 or selected[0]['status']!='source-first':result['status']='source-blocked'
        else:
            install=subprocess.run([sys.executable,'tools/install_verified_fragment.py','--manifest',str(manifest),'--target',str(TARGET),
                '--exports',entry,'--report',str(ROOT/'reports'/(a.label+'-'+entry+'-integration.json'))],cwd=ROOT,capture_output=True,text=True)
            with log.open('a',encoding='utf-8') as stream:stream.write(install.stdout+'\n'+install.stderr)
            result.update(status='installed-source-fragment' if install.returncode==0 else 'integration-rejected',install_returncode=install.returncode)
    report['jobs'].append(result);save();print(entry+': '+result['status'],flush=True)
print('Original startup frontier recorded. Full engine boot remains independently unverified.')
