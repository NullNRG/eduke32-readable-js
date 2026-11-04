"""Use the canonical compiler/linker for a narrow original startup call graph.

Semantic inventory remains complete. Emission recovers referenced header bodies
without proactively emitting every unrelated inline body in a type-closure AST.
"""
import argparse,contextlib,hashlib,json,re,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'tools'))
import recover_browser_component as component
from browser_target_closure import active_exports,build
def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('source');parser.add_argument('names')
    parser.add_argument('--query-limit',type=int,default=256)
    parser.add_argument('--probe-only',action='store_true',help='Save a separate targeted frontier without installing partial work')
    parser.add_argument('--whole-unit',action='store_true',help='Extract a new original unit once; install only ABI-verified emitted definitions')
    parser.add_argument('--install-closed-leaves',action='store_true',help='Install verified dependencies while keeping a blocked requested root unresolved')
    parser.add_argument('--reuse-manifest',type=Path,help='Require current compiler and preprocessor content fingerprints before reusing an emission')
    args=parser.parse_args();source,names=args.source,args.names;out=component.OUT;base=component.BASE
    if args.query_limit<1:parser.error('--query-limit must be positive')
    suffix='-'+re.sub(r'[^A-Za-z0-9_]','_',names) if args.probe_only else ''
    frontier_path=base/'reports'/('frontier-'+source.replace('/','_')+suffix+'.json')
    assert source in {row['file'] for row in json.loads(component.COMMANDS.read_text())}
    owner=out/(source+'.mjs');existing=active_exports(owner) if owner.is_file() else set()
    if args.whole_unit and existing:parser.error('Whole-unit recovery requires a new owner; existing storage needs filtered extension')
    if set(names.split(','))<=existing:
        report={'source':source,'requested':names.split(','),'requested_resolved':{name:True for name in names.split(',')},
            'requested_still_unlinked':[],'manifest':owner.with_suffix('.manifest.json').relative_to(ROOT).as_posix(),
            'blocked':[],'already_linked':True,'original_gameplay_verified':False}
        frontier_path.write_text(json.dumps(report,indent=2)+'\n')
        print('Original declarations already linked: '+names);return 0
    build(out,out,base/'reports/browser-closure.json','source/build/src/engine.cpp','enginePreInit')
    providers=out/'browser-combined-symbol-owners.json'
    key=hashlib.sha256(providers.read_bytes()+names.encode()+str((args.query_limit,args.whole_unit)).encode()+(ROOT/'tools/source_ast_to_js.py').read_bytes()).hexdigest()[:16]
    stage=base/'boot-probes'/source.replace('/','_')/('reachable-'+key);stage.mkdir(parents=True,exist_ok=True)
    command=[sys.executable,ROOT/'tools/source_ast_to_js.py','--root',component.SOURCE,'--source',source,
        '--compile-commands',component.COMMANDS,'--out-dir',stage,
        '--dependency-closure','--header-dependency-closure','--enum-closure','--require-record-layouts',
        '--dependency-query-limit',str(args.query_limit),
        '--project-symbols',providers,'--import-root',out,'--ast-cache-dir',component.CACHE]
    if not args.whole_unit:command+=['--filter',names,'--exact-filter']
    if args.reuse_manifest:
        from source_ast_to_js import compiler_runtime_revision
        from source_ast_cache_paths import source_ast_input_fingerprint
        from source_first_toolchain import frontend_config
        manifest=args.reuse_manifest.resolve();doc=json.loads(manifest.read_text())
        if doc.get('source')!=source or doc.get('compiler_runtime_input_sha256')!=compiler_runtime_revision():
            raise ValueError('Saved emission source/compiler differs from the current revision')
        if Path(doc.get('module_fragment',{}).get('import_root','')).resolve()!=out.resolve():
            raise ValueError('Saved emission belongs to another provider graph')
        selected=next(row for row in json.loads(component.COMMANDS.read_text()) if row['file']==source)
        cpp='++' in Path(selected['arguments'][0]).name
        frontend,target=frontend_config(cpp);raw=selected['arguments'][1:];flags=[];i=0
        # Match canonical command normalization. Any future normalization
        # difference fails the saved content-fingerprint comparison.
        while i<len(raw):
            value=raw[i]
            if value in ('-c','-MMD','-MP','-M','-MM','-o','-MF','-MT','-MQ'):
                i+=2 if value in ('-o','-MF','-MT','-MQ') else 1;continue
            if value==source or value.startswith(('-O','-flto','-march','-mfpmath','-funswitch','-fomit','-fjump')):
                i+=1;continue
            flags.append(value);i+=1
        flags+=['-Iplatform/Windows/include','-Iplatform/Windows/include/SDL2','-Wno-unknown-warning-option',*target]
        current=source_ast_input_fingerprint(component.SOURCE,frontend,['-x','c++' if cpp else 'c'],flags,source)
        if not current.get('preprocessor_verified') or current!=doc.get('ast_cache_inputs'):
            raise ValueError('Saved source/header/configuration/toolchain content fingerprint differs')
        stage=manifest.parents[len(Path(source).parts)-1]
    else:
        with (stage/'compile.log').open('w') as log:subprocess.run(list(map(str,command)),cwd=ROOT,stdout=log,stderr=subprocess.STDOUT,check=True,timeout=900)
        manifest=stage/(source+'.manifest.json');doc=json.loads(manifest.read_text())
    requested={row['name']:row for row in doc['definitions'] if row.get('source_name') in names.split(',')}
    frontier={'source':source,'requested':names.split(','),'requested_resolved':{name:name in existing for name in names.split(',')},
        'requested_compiled':{name:any(row.get('source_name')==name and row['status']=='source-first' for row in requested.values()) for name in names.split(',')},
        'requested_still_unlinked':[name for name in names.split(',') if name not in existing],'manifest':manifest.relative_to(ROOT).as_posix(),
        'blocked':[{'name':row['name'],'reason':row.get('reason'),'dependencies':row.get('unresolved_references',[])}
            for row in doc['definitions'] if row['status']=='blocked'],'original_gameplay_verified':False}
    frontier.update(compiler_runtime_input_sha256=doc.get('compiler_runtime_input_sha256'),
        query_limit=args.query_limit,dependency_budget_exhausted=doc.get('dependency_closure',{}).get('budget_exhausted'),
        unqueried_references=doc.get('dependency_closure',{}).get('unqueried_references',[]),probe_only=args.probe_only)
    frontier_path.write_text(json.dumps(frontier,indent=2)+'\n')
    compiled=len(requested)==len(names.split(',')) and all(row['status']=='source-first' for row in requested.values())
    if (not compiled and not args.install_closed_leaves) or args.probe_only:
        print(json.dumps({'requested':names.split(','),'requested_compiled':frontier['requested_compiled'],
            'installed':False,'blocked_definitions':len(frontier['blocked']),
            'semantic_blockers':[row for row in frontier['blocked'] if not row.get('reason','').startswith('unlinked identifiers:')],
            'frontier':frontier_path.relative_to(ROOT).as_posix(),'original_gameplay_verified':False},indent=2))
        return 0 if compiled else 1
    emitted=active_exports(stage/(source+'.mjs'))
    exports=sorted({row['name'] for row in doc['definitions'] if row['status']=='source-first' and row['name'] in emitted-existing})
    if not exports:
        print('No new closed source definitions to install');return 0 if compiled else 1
    # Invoke the existing strict installer in-process. A complete data unit
    # can exceed Windows' process argument limit; never split its storage
    # into separately initialized copies merely to fit a command line.
    import install_verified_fragment
    created_owner=not owner.exists()
    owner_doc=owner.with_suffix('.manifest.json')
    if created_owner:
        if doc.get('native_pointer_abi')!='source-lp64-addresses/2':raise ValueError('Unverified native-pointer ABI')
        owner.parent.mkdir(parents=True,exist_ok=True)
        # This source facade contains no implementations or storage. Every
        # real definition is attached by the unchanged ABI/ownership checks.
        container={**doc,'output':str(owner),'definitions':[],'imports':[],
            'storage_exports':[],'private_storage_exports':[],'found':0,'emitted':0,'blocked':0}
        container.pop('module_fragment',None)
        owner.write_bytes(b'// Original-source facade; definitions are supplied by verified source fragments.\n')
        owner_doc.write_text(json.dumps(container,indent=2)+'\n')
    arguments=sys.argv
    try:
        sys.argv=['install_verified_fragment.py','--manifest',str(manifest),'--target',str(out),
            '--exports',*exports,'--report',str(stage/'integration.json')]
        with (stage/'integration.log').open('w') as stream,contextlib.redirect_stdout(stream):
            install_verified_fragment.main()
    except BaseException:
        if created_owner:
            # The strict installer rolls back its fragment transaction before
            # propagating a failure. Remove only our newly created empty facade.
            owner.unlink(missing_ok=True);owner_doc.unlink(missing_ok=True)
        raise
    finally:sys.argv=arguments
    active=active_exports(owner)
    report={'source':source,'requested':names.split(','),'requested_resolved':{name:name in active for name in names.split(',')},
        'requested_still_unlinked':[name for name in names.split(',') if name not in active],'manifest':manifest.relative_to(ROOT).as_posix(),
        'blocked':[{'name':row['name'],'reason':row.get('reason'),'dependencies':row.get('unresolved_references',[])}
            for row in doc['definitions'] if row['status']=='blocked'],'installed_closed_definitions':len(exports),'original_gameplay_verified':False}
    frontier_path.write_text(json.dumps(report,indent=2)+'\n')
    build(out,out,base/'reports/browser-closure.json','source/build/src/engine.cpp','enginePreInit');component.checkpoint()
    return 0 if not report['requested_still_unlinked'] else 1
if __name__=='__main__':
    with component.component_lock():raise SystemExit(main())
