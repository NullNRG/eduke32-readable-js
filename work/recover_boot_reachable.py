"""Use the canonical compiler/linker for a narrow original startup call graph.

Semantic inventory remains complete. Emission recovers referenced header bodies
without proactively emitting every unrelated inline body in a type-closure AST.
"""
import argparse,contextlib,hashlib,json,re,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'tools'))
import recover_browser_component as component
from browser_target_closure import active_exports,build
def source_lowered(row):
    return row.get('status')=='source-first' or row.get('reason','').startswith('unlinked identifiers:')
def retryable_roots(requested, definitions, affected, existing):
    """Select exact, closed functions from the rejected batch for fresh emission."""
    roots = []
    for name in requested:
        candidates = [row for row in definitions if row.get('source_name') == name]
        if len(candidates) != 1:
            continue
        row = candidates[0]
        if (row.get('kind') == 'FunctionDecl' and row['status'] == 'source-first'
                and row['name'] not in affected and row['name'] not in existing):
            roots.append(name)
    return roots


def main(argv=None):
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('source');parser.add_argument('names')
    parser.add_argument('--query-limit',type=int,default=256)
    parser.add_argument('--probe-only',action='store_true',help='Save a separate targeted frontier without installing partial work')
    parser.add_argument('--included-functions',action='store_true',help='Explicitly select requested static/inline functions from Clang-proven included files')
    parser.add_argument('--whole-unit',action='store_true',help='Extract an original unit once; reuse existing storage and install only ABI-verified new definitions')
    parser.add_argument('--install-closed-leaves',action='store_true',help='Install verified dependencies while keeping a blocked requested root unresolved')
    parser.add_argument('--reuse-manifest',type=Path,help='Require current compiler and preprocessor content fingerprints before reusing an emission')
    args=parser.parse_args(argv);source,names=args.source,args.names;out=component.OUT;base=component.BASE
    if args.query_limit<1:parser.error('--query-limit must be positive')
    suffix=''
    if args.probe_only:
        label=re.sub(r'[^A-Za-z0-9_]','_',names)
        if len(label)>55:
            label=label[:38]+'-'+hashlib.sha256(names.encode()).hexdigest()[:16]
        suffix='-'+label
    frontier_path=base/'reports'/('frontier-'+source.replace('/','_')+suffix+'.json')
    assert source in {row['file'] for row in json.loads(component.COMMANDS.read_text())}
    owner=out/(source+'.mjs');existing=active_exports(owner) if owner.is_file() else set()
    # The canonical compiler imports already-owned public/private address cells
    # even for a complete AST. The strict installer independently rejects every
    # duplicate VarDecl before changing the owner. Whole-unit extension therefore
    # uses the same proven storage contract as filtered extension.
    if set(names.split(','))<=existing:
        report={'source':source,'requested':names.split(','),'requested_resolved':{name:True for name in names.split(',')},
            'requested_still_unlinked':[],'manifest':owner.with_suffix('.manifest.json').relative_to(ROOT).as_posix(),
            'blocked':[],'already_linked':True,'original_gameplay_verified':False}
        frontier_path.write_text(json.dumps(report,indent=2)+'\n')
        print('Original declarations already linked: '+names);return 0
    build(out,out,base/'reports/browser-closure.json','source/build/src/engine.cpp','enginePreInit')
    providers=out/'browser-combined-symbol-owners.json'
    # A header factory can legitimately exist in several translation units.
    # The global index must retain that ambiguity. This unit may still reuse
    # its OWN already-installed, source-proven class factory; do not select an
    # arbitrary competing owner or duplicate its object representation.
    if owner.is_file():
        previous=json.loads(owner.with_suffix('.manifest.json').read_text())
        symbols=json.loads(providers.read_text());local={}
        for row in previous.get('definitions',[]):
            proof=row.get('odr_inline',{})
            if (row.get('status')=='source-first' and row.get('kind')=='CXXRecordDecl'
                    and row.get('header_record_factory') and row['name'] in existing
                    and row['name'] not in symbols
                    and proof.get('prototype_factory_abi')=='source-header-record-factory/1'):
                local[row['name']]=source
        if local:
            providers=base/'reports'/('local-factory-providers-'+source.replace('/','_')+'.json')
            providers.write_text(json.dumps({**symbols,**local},indent=2)+'\n')
    from source_ast_to_js import compiler_runtime_revision
    owner_manifest=owner.with_suffix('.manifest.json')
    component_manifest=base/'component-manifest.json'
    # A TU-private identity can change caller lowering without changing the
    # global owner index. Keep that probe's evidence separate from the old run.
    inputs={
        'source':source,'names':names,'query_limit':args.query_limit,
        'whole_unit':args.whole_unit,'included_functions':args.included_functions,
        'compiler_runtime':compiler_runtime_revision(),
        'provider_index':hashlib.sha256(providers.read_bytes()).hexdigest(),
        'owner_manifest':hashlib.sha256(owner_manifest.read_bytes()).hexdigest() if owner_manifest.is_file() else None,
        'component_manifest':hashlib.sha256(component_manifest.read_bytes()).hexdigest() if component_manifest.is_file() else None,
    }
    key=hashlib.sha256(json.dumps(inputs,sort_keys=True).encode()).hexdigest()[:16]
    stage=base/'boot-probes'/source.replace('/','_')/('reachable-'+key);stage.mkdir(parents=True,exist_ok=True)
    command=[sys.executable,ROOT/'tools/source_ast_to_js.py','--root',component.SOURCE,'--source',source,
        '--compile-commands',component.COMMANDS,'--out-dir',stage,
        '--dependency-closure','--header-dependency-closure','--enum-closure','--require-record-layouts',
        '--dependency-query-limit',str(args.query_limit),
        '--project-symbols',providers,'--import-root',out,'--ast-cache-dir',component.CACHE]
    if args.included_functions:command+=['--header-inlines','--header-inline-filter',names]
    if not args.whole_unit:command+=['--filter',names,'--exact-filter']
    if args.reuse_manifest:
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
        rejected_path=stage/(source+'.rejected-imports.json')
        previous_rejection=rejected_path.stat().st_mtime_ns if rejected_path.is_file() else None
        with (stage/'compile.log').open('w') as log:
            result=subprocess.run(list(map(str,command)),cwd=ROOT,stdout=log,stderr=subprocess.STDOUT,timeout=900)
        if result.returncode:
            if rejected_path.is_file() and rejected_path.stat().st_mtime_ns != previous_rejection:
                rejected=json.loads(rejected_path.read_text(encoding='utf-8'))
                if (rejected.get('source')==source and rejected.get('compiler_runtime_input_sha256')==compiler_runtime_revision()
                        and rejected.get('module_written') is False and rejected.get('link_verified') is False):
                    affected=set(rejected['affected_definitions'])
                    definitions=rejected['candidate_definitions']
                    frontier={'source':source,'requested':names.split(','),
                        'requested_resolved':{name:name in existing for name in names.split(',')},
                        'requested_lowered':{name:any(row.get('source_name')==name and source_lowered(row)
                            for row in definitions) for name in names.split(',')},
                        'requested_compiled':{name:False for name in names.split(',')},
                        'requested_still_unlinked':[name for name in names.split(',') if name not in existing],
                        'blocked':[{'name':row['name'],'reason':row.get('reason','rejected source-provider import'),
                            'dependencies':row.get('unresolved_references',[]),'affected_by_rejected_import':row['name'] in affected}
                            for row in definitions if row.get('status')=='blocked' or row['name'] in affected],
                        'import_rejections':rejected['rejected_imports'],
                        'rejected_import_catalog':rejected_path.relative_to(ROOT).as_posix(),
                        'compiler_runtime_input_sha256':rejected['compiler_runtime_input_sha256'],
                        'probe_only':args.probe_only,'installed':False,'original_gameplay_verified':False}
                    frontier_path.write_text(json.dumps(frontier,indent=2)+'\n',encoding='utf-8')
                    if args.install_closed_leaves and not args.probe_only:
                        roots = retryable_roots(frontier['requested'], definitions, affected, existing)
                        if roots and len(roots) < len(frontier['requested']):
                            # A second, smaller compile runs the same emitter and
                            # strict installer. Rejected batch bytes never install.
                            retry = [source, ','.join(roots), '--query-limit', str(args.query_limit)]
                            if args.included_functions:
                                retry.append('--included-functions')
                            print('Retry independent original definitions: ' + ', '.join(roots), flush=True)
                            try:
                                code = main(retry)
                                detail = json.loads(frontier_path.read_text(encoding='utf-8'))
                                frontier['independent_retry'] = {
                                    'requested': roots, 'exit_code': code, 'result': detail}
                                if code == 0:
                                    for name in roots:
                                        frontier['requested_compiled'][name] = True
                                        frontier['requested_resolved'][name] = True
                                    frontier['requested_still_unlinked'] = [
                                        name for name, resolved in frontier['requested_resolved'].items() if not resolved]
                                    frontier['installed'] = bool(detail.get('installed_closed_definitions'))
                            finally:
                                frontier_path.write_text(json.dumps(frontier, indent=2)+'\n', encoding='utf-8')
                    print(json.dumps({'installed':frontier['installed'],'rejected_imports':len(rejected['rejected_imports']),
                        'affected_definitions':len(affected),'frontier':frontier_path.relative_to(ROOT).as_posix()},indent=2))
                    return result.returncode
            result.check_returncode()
        manifest=stage/(source+'.manifest.json');doc=json.loads(manifest.read_text())
    requested={row['name']:row for row in doc['definitions'] if row.get('source_name') in names.split(',')}
    frontier={'source':source,'requested':names.split(','),'requested_resolved':{name:name in existing for name in names.split(',')},
        'requested_lowered':{name:any(row.get('source_name')==name and source_lowered(row) for row in requested.values()) for name in names.split(',')},
        'requested_compiled':{name:any(row.get('source_name')==name and row['status']=='source-first' for row in requested.values()) for name in names.split(',')},
        'requested_still_unlinked':[name for name in names.split(',') if name not in existing],'manifest':manifest.relative_to(ROOT).as_posix(),
        'blocked':[{'name':row['name'],'reason':row.get('reason'),'dependencies':row.get('unresolved_references',[])}
            for row in doc['definitions'] if row['status']=='blocked'],'original_gameplay_verified':False}
    frontier.update(compiler_runtime_input_sha256=doc.get('compiler_runtime_input_sha256'),
        provider_index_sha256=hashlib.sha256(providers.read_bytes()).hexdigest(),
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
    if doc['emitted']==0:
        print(json.dumps({'installed':False,'blocked_definitions':len(frontier['blocked']),
            'frontier':frontier_path.relative_to(ROOT).as_posix(),'original_gameplay_verified':False},indent=2))
        return 1
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
    owner_definitions=json.loads(owner_doc.read_text())['definitions']
    bindings={name:sorted({row['name'] for row in owner_definitions if row.get('source_name',row['name'])==name and row['status']=='source-first' and row['name'] in active}) for name in names.split(',')}
    resolved={name:name in active or len(bindings[name])==1 for name in names.split(',')}
    report={'source':source,'requested':names.split(','),'requested_resolved':resolved,'requested_export_bindings':bindings,
        'requested_still_unlinked':[name for name in names.split(',') if not resolved[name]],'manifest':manifest.relative_to(ROOT).as_posix(),
        'blocked':[{'name':row['name'],'reason':row.get('reason'),'dependencies':row.get('unresolved_references',[])}
            for row in doc['definitions'] if row['status']=='blocked'],'installed_closed_definitions':len(exports),'original_gameplay_verified':False}
    frontier_path.write_text(json.dumps(report,indent=2)+'\n')
    build(out,out,base/'reports/browser-closure.json','source/build/src/engine.cpp','enginePreInit');component.checkpoint()
    return 0 if not report['requested_still_unlinked'] else 1
if __name__=='__main__':
    with component.component_lock():raise SystemExit(main())
