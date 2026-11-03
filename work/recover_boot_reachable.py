"""Use the canonical compiler/linker for a narrow original startup call graph.

Semantic inventory remains complete. Emission recovers referenced header bodies
without proactively emitting every unrelated inline body in a type-closure AST.
"""
import hashlib,json,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'tools'))
import recover_browser_component as component
from browser_target_closure import active_exports,build
def main():
    assert len(sys.argv)==3,'source and comma-separated original declarations required'
    source,names=sys.argv[1:];out=component.OUT;base=component.BASE
    assert source in {row['file'] for row in json.loads(component.COMMANDS.read_text())}
    owner=out/(source+'.mjs');existing=active_exports(owner) if owner.is_file() else set()
    if set(names.split(','))<=existing:
        report={'source':source,'requested':names.split(','),'requested_resolved':{name:True for name in names.split(',')},
            'requested_still_unlinked':[],'manifest':owner.with_suffix('.manifest.json').relative_to(ROOT).as_posix(),
            'blocked':[],'already_linked':True,'original_gameplay_verified':False}
        (base/'reports'/('frontier-'+source.replace('/','_')+'.json')).write_text(json.dumps(report,indent=2)+'\n')
        print('Original declarations already linked: '+names);return
    build(out,out,base/'reports/browser-closure.json','source/build/src/engine.cpp','enginePreInit')
    providers=out/'browser-combined-symbol-owners.json'
    key=hashlib.sha256(providers.read_bytes()+names.encode()+(ROOT/'tools/source_ast_to_js.py').read_bytes()).hexdigest()[:16]
    stage=base/'boot-probes'/source.replace('/','_')/('reachable-'+key);stage.mkdir(parents=True,exist_ok=True)
    command=[sys.executable,ROOT/'tools/source_ast_to_js.py','--root',component.SOURCE,'--source',source,
        '--compile-commands',component.COMMANDS,'--out-dir',stage,'--filter',names,'--exact-filter',
        '--dependency-closure','--header-dependency-closure','--enum-closure','--require-record-layouts',
        '--project-symbols',providers,'--import-root',out,'--ast-cache-dir',component.CACHE]
    with (stage/'compile.log').open('w') as log:subprocess.run(list(map(str,command)),cwd=ROOT,stdout=log,stderr=subprocess.STDOUT,check=True,timeout=900)
    manifest=stage/(source+'.manifest.json');doc=json.loads(manifest.read_text())
    requested={row['name']:row for row in doc['definitions'] if row.get('source_name') in names.split(',')}
    frontier={'source':source,'requested':names.split(','),'requested_resolved':{name:name in existing for name in names.split(',')},
        'requested_compiled':{name:any(row.get('source_name')==name and row['status']=='source-first' for row in requested.values()) for name in names.split(',')},
        'requested_still_unlinked':[name for name in names.split(',') if name not in existing],'manifest':manifest.relative_to(ROOT).as_posix(),
        'blocked':[{'name':row['name'],'reason':row.get('reason'),'dependencies':row.get('unresolved_references',[])}
            for row in doc['definitions'] if row['status']=='blocked'],'original_gameplay_verified':False}
    (base/'reports'/('frontier-'+source.replace('/','_')+'.json')).write_text(json.dumps(frontier,indent=2)+'\n')
    assert len(requested)==len(names.split(',')) and all(row['status']=='source-first' for row in requested.values()),requested
    emitted=active_exports(stage/(source+'.mjs'))
    exports=sorted({row['name'] for row in doc['definitions'] if row['status']=='source-first' and row['name'] in emitted-existing})
    subprocess.run(list(map(str,[sys.executable,ROOT/'tools/install_verified_fragment.py','--manifest',manifest,'--target',out,
        '--exports',*exports,'--report',stage/'integration.json'])),cwd=ROOT,check=True)
    report={'source':source,'requested':names.split(','),'requested_resolved':{name:name in active_exports(owner) for name in names.split(',')},
        'requested_still_unlinked':[],'manifest':manifest.relative_to(ROOT).as_posix(),
        'blocked':[{'name':row['name'],'reason':row.get('reason'),'dependencies':row.get('unresolved_references',[])}
            for row in doc['definitions'] if row['status']=='blocked'],'original_gameplay_verified':False}
    (base/'reports'/('frontier-'+source.replace('/','_')+'.json')).write_text(json.dumps(report,indent=2)+'\n')
    build(out,out,base/'reports/browser-closure.json','source/build/src/engine.cpp','enginePreInit');component.checkpoint()
if __name__=='__main__':
    with component.component_lock():main()
