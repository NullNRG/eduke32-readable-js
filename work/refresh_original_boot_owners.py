"""Refresh complete original units so private globals remain owned exactly once."""
import argparse,hashlib,json,os,re,subprocess,sys,time
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'tools'))
from browser_target_closure import build,active_exports
from source_first_global_link import storage_import_error
TARGET=ROOT/'factory-output/source-first/oct20-engine-preinit-browser'
p=argparse.ArgumentParser();p.add_argument('--sources',nargs='+',default=['source/build/src/clip.cpp','source/build/src/baselayer.cpp','source/build/src/sdlayer.cpp'])
p.add_argument('--label',default='oct21-boot-owner-refresh');a=p.parse_args()
assert re.fullmatch(r'[A-Za-z0-9_-]+',a.label)
OUT=ROOT/'factory-output/source-first'/a.label
jobs=a.sources
report={'format':'original-owner-refresh/1','jobs':[],'gameplay_verified':False}
def save():(ROOT/'reports'/(a.label+'.json')).write_text(json.dumps(report,indent=2)+'\n')
for source in jobs:
    build(TARGET,TARGET,ROOT/'reports/oct21-browser-platform-closure.json')
    symbols=json.loads((TARGET/'browser-combined-symbol-owners.json').read_text())
    # A whole-unit refresh owns its local definitions; only other-unit symbols
    # may be imports. This avoids duplicating or externally binding internals.
    symbols={name:owner for name,owner in symbols.items() if owner!=source}
    OUT.mkdir(parents=True,exist_ok=True);index=OUT/(Path(source).stem+'-symbols.json');index.write_text(json.dumps(symbols,indent=2)+'\n')
    label=Path(source).stem;log=ROOT/'reports'/('oct21-owner-'+label+'.log');start=time.monotonic()
    args=[sys.executable,'tools/source_ast_to_js.py','--root','factory-output/source-tree/eduke32-master','--source',source,
        '--compile-commands','factory-output/compile_commands.json','--out-dir',str(OUT),'--project-symbols',str(index),
        '--import-root',str(TARGET),'--enum-closure','--header-dependency-closure']
    with log.open('w',encoding='utf-8') as stream:
        try:code=subprocess.run(args,cwd=ROOT,stdout=stream,stderr=subprocess.STDOUT,timeout=300).returncode
        except subprocess.TimeoutExpired:code='timeout'
    result={'source':source,'returncode':code,'seconds':round(time.monotonic()-start,2),'log':log.relative_to(ROOT).as_posix()}
    new=OUT/(source+'.mjs');old=TARGET/(source+'.mjs');mf=old.with_suffix('.manifest.json')
    if code!=0 or not new.is_file():result['status']='compile-rejected'
    else:
        before=old.read_bytes();before_manifest=mf.read_bytes();doc=json.loads(new.with_suffix('.manifest.json').read_text());prior=json.loads(before_manifest)
        available=active_exports(new);previous=active_exports(old);lost=sorted(previous-available)
        rows={r['name']:r for r in doc['definitions'] if r['status']=='source-first'};changed=[]
        for row in prior['definitions']:
            if row['status']!='source-first' or row['name'] not in rows:continue
            for key in ('object_storage','global_storage','reference_contract'):
                if row.get(key)!=rows[row['name']].get(key):changed.append({'name':row['name'],'contract':key})
        errors=[]
        for dep in doc['imports']:
            provider=TARGET/(dep['from']+'.mjs')
            if dep.get('binding',dep['name']) not in active_exports(provider):errors.append({'name':dep['name'],'reason':'missing export'});continue
            if dep.get('abi') or dep.get('binding'):
                error=storage_import_error(dep,{dep['from']:{'manifest':json.loads(provider.with_suffix('.manifest.json').read_text()),'module':provider}})
                if error:errors.append({'name':dep['name'],'reason':error})
        result.update(lost_exports=lost,changed_contracts=changed,import_errors=errors,
            boot_definitions=[r for r in doc['definitions'] if r['name'] in ('engineInitClipMaps','baselayer_init','initprintf','initsystem','videoGetModes')])
        if lost or changed or errors:result['status']='integration-rejected'
        else:
            def relocate(match):
                resolved=(new.parent/match[2]).resolve();assert resolved.is_relative_to(TARGET) and resolved.is_file()
                relative=os.path.relpath(resolved,old.parent).replace('\\','/')
                return 'from '+json.dumps(relative if relative.startswith('.') else './'+relative)
            rendered=re.sub(r'from ([\'"])(\.{1,2}/[^\'"]+)\1',relocate,new.read_text())
            candidate=old.with_suffix('.candidate.mjs');candidate.write_text(rendered,encoding='utf-8',newline='\n')
            try:subprocess.run(['node','--check',str(candidate)],check=True,capture_output=True)
            finally:candidate.unlink(missing_ok=True)
            backup=ROOT/'work/owner-refresh-backup'/label/hashlib.sha256(before).hexdigest()[:16];backup.mkdir(parents=True,exist_ok=True)
            (backup/old.name).write_bytes(before);(backup/mf.name).write_bytes(before_manifest)
            assert old.read_bytes()==before and mf.read_bytes()==before_manifest
            old.write_text(rendered,encoding='utf-8',newline='\n');doc['output']=str(old);mf.write_text(json.dumps(doc,indent=2)+'\n')
            result.update(status='installed-complete-owner',added_exports=sorted(available-previous),
                module_sha256=hashlib.sha256(old.read_bytes()).hexdigest(),manifest_sha256=hashlib.sha256(mf.read_bytes()).hexdigest())
    report['jobs'].append(result);save();print(source+': '+result['status'],flush=True)
