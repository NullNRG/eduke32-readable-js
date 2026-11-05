"""Recompile a complete function/data owner into fresh-runtime artifacts.

Requires the exact old owner hash, preserves its entire exported interface, and
never migrates or replaces live JS objects. Original initialization runs again
in the next fresh browser realm. Header/class owners need separate recovery.
"""
import argparse,hashlib,json,os,re,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'tools'))
import recover_browser_component as component
from browser_target_closure import active_exports,build,EXPORT,REEXPORT
from source_first_global_link import storage_import_error
from source_owner_aliases import retain_header_aliases

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source');parser.add_argument('--expected-sha256',required=True)
    parser.add_argument('--reuse-emission',type=Path,help='Reuse an exact current compiler/preprocessor-verified whole-owner emission')
    parser.add_argument('--whole-unit',action='store_true',help='Rebuild all original declarations, retaining every previous executable/storage export')
    parser.add_argument('--prune-unconsumed-functions',action='store_true',help='Explicitly omit obsolete function-only exports when neither emitted code nor any existing consumer uses them; preserve their original evidence separately')
    parser.add_argument('--interface-before-sha256',help='Use a verified saved owner interface; every current consumer still must pass before unused exports can be dropped')
    args=parser.parse_args();out=component.OUT;base=component.BASE
    assert args.source in {row['file'] for row in json.loads(component.COMMANDS.read_text())}
    module=out/(args.source+'.mjs');manifest=module.with_suffix('.manifest.json')
    assert module.resolve().is_relative_to(out.resolve())
    old=module.read_bytes();old_meta=manifest.read_bytes();digest=hashlib.sha256(old).hexdigest()
    assert digest==args.expected_sha256,'Original owner changed'
    document=json.loads(old_meta);old_exports=active_exports(module);pruned=[]
    if args.interface_before_sha256:
        assert args.whole_unit and re.fullmatch(r'[a-f0-9]{64}',args.interface_before_sha256)
        saved=base/'owner-history'/args.interface_before_sha256
        code=(saved/'original.mjs').read_bytes();meta=json.loads((saved/'original.manifest.json').read_text())
        assert hashlib.sha256(code).hexdigest()==args.interface_before_sha256
        assert meta['source']==args.source and meta['native_pointer_abi']==document['native_pointer_abi']
        assert meta.get('ast_cache_inputs',{}).get('preprocessor_verified') and meta['ast_cache_inputs']==document.get('ast_cache_inputs')
        retained=set(EXPORT.findall(code.decode()))
        for names,filename in REEXPORT.findall(code.decode()):
            shard=(module.parent/filename).resolve();assert shard.parent==module.parent.resolve()
            matches=[row for row in meta.get('module_fragments',[]) if out/row['module']==shard]
            assert len(matches)==1 and hashlib.sha256(shard.read_bytes()).hexdigest()==matches[0]['sha256']
            declared={name.strip() for name in names.split(',')};assert declared<=active_exports(shard)
            retained.update(declared)
        assert retained<=old_exports,'Saved source interface is no longer fully present'
        pruned=sorted(old_exports-retained);old_exports=retained;document=meta
    definitions=[row for row in document['definitions'] if row['status']=='source-first']
    assert definitions and all(row['kind']=='FunctionDecl' or
        row['kind']=='VarDecl' and (row.get('physical_source',args.source)==args.source or
            args.whole_unit and row.get('header_global_definition')) or
        args.whole_unit and row['kind']=='CXXRecordDecl' and (
            row.get('header_record_factory') and row.get('odr_inline') or
            row['name'].startswith('__cxx_record_') and row.get('source_name'))
        for row in definitions),'Original source data/functions or attested header owners required'
    names=sorted({row.get('source_name',row['name']) for row in definitions if row['kind']!='CXXRecordDecl'})
    assert all(re.fullmatch(r'[A-Za-z_]\w*',name) or args.whole_unit and name.startswith('operator') and not any(c in name for c in ',\r\n') for name in names)
    build(out,out,base/'reports/browser-closure.json','source/build/src/engine.cpp','enginePreInit')
    owners=json.loads((out/'browser-combined-symbol-owners.json').read_text())
    owners={name:owner for name,owner in owners.items() if owner!=args.source and name not in old_exports}
    from source_ast_to_js import compiler_runtime_revision
    stage=base/'owner-rebuilds'/args.source.replace('/','_')/(digest[:16]+'-'+compiler_runtime_revision()[:16]);stage.mkdir(parents=True,exist_ok=True)
    index=stage/'providers.json';index.write_text(json.dumps(owners,indent=2)+'\n')
    command=[sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(component.SOURCE),
        '--source',args.source,'--compile-commands',str(component.COMMANDS),'--out-dir',str(stage),
        '--project-symbols',str(index),'--import-root',str(out),
        '--dependency-closure','--header-dependency-closure','--header-inlines','--enum-closure',
        '--require-record-layouts','--rebuild-owner-sha256',digest,'--ast-cache-dir',str(component.CACHE)]
    if not args.whole_unit:command+=['--filter',','.join(names),'--exact-filter']
    else:
        required_headers=None
        if args.prune_unconsumed_functions:
            required_headers=set()
            for path in out.rglob('*.manifest.json'):
                consumer=json.loads(path.read_text())
                if consumer.get('source')==args.source:continue
                for dep in [*consumer.get('imports',[]),*[d for f in consumer.get('module_fragments',[]) for d in f.get('imports',[])]]:
                    if dep['from']==args.source:required_headers.update([dep['name'],dep.get('binding',dep['name'])])
        command+=['--header-inline-filter',','.join(sorted({row.get('source_name',row['name']) for row in definitions
            if row['kind']=='FunctionDecl' and (required_headers is None or row['name'] in required_headers)}))]

    log=stage/'compile.log'
    if args.reuse_emission:
        from source_ast_cache_paths import source_ast_input_fingerprint
        from source_first_toolchain import frontend_config
        saved=json.loads(args.reuse_emission.read_text())
        assert saved.get('source')==args.source and saved.get('compiler_runtime_input_sha256')==compiler_runtime_revision(),'Saved compiler revision differs'
        selected=next(r for r in json.loads(component.COMMANDS.read_text()) if r['file']==args.source)
        cpp='++' in Path(selected['arguments'][0]).name
        frontend,target=frontend_config(cpp);raw=selected['arguments'][1:];flags=[];i=0
        while i<len(raw):
            value=raw[i]
            if value in ('-c','-MMD','-MP','-M','-MM','-o','-MF','-MT','-MQ'):
                i+=2 if value in ('-o','-MF','-MT','-MQ') else 1;continue
            if value==args.source or value.startswith(('-O','-flto','-march','-mfpmath','-funswitch','-fomit','-fjump')):
                i+=1;continue
            flags.append(value);i+=1
        flags+=['-Iplatform/Windows/include','-Iplatform/Windows/include/SDL2','-Wno-unknown-warning-option',*target]
        actual=source_ast_input_fingerprint(component.SOURCE,frontend,['-x','c++' if cpp else 'c'],flags,args.source)
        assert actual.get('preprocessor_verified') and actual==saved.get('ast_cache_inputs'),'Saved source/header/configuration differs'
        assert Path(saved['module_fragment']['import_root']).resolve()==out.resolve(),'Saved providers belong to another graph'
        stage=args.reuse_emission.resolve().parents[len(Path(args.source).parts)-1]
    else:
        with log.open('w') as stream:
            result=subprocess.run(command,cwd=ROOT,stdout=stream,stderr=subprocess.STDOUT,timeout=900)
        assert result.returncode==0,'Source compilation failed: '+str(log)
    candidate=stage/(args.source+'.mjs');current=json.loads(candidate.with_suffix('.manifest.json').read_text())
    if args.whole_unit:
        from source_header_factory_retention import retain
        current,retained_code=retain(document,current,old.decode(),candidate.read_text())
        candidate.write_text(retained_code,newline='\n')
    if args.prune_unconsumed_functions:
        assert args.whole_unit,'Function omission requires a whole original unit attempt'
        missing=old_exports-active_exports(candidate)
        live={name for row in current['definitions'] if row['status']=='source-first'
              for name in row.get('source_references',[])}
        consumed=set()
        for path in out.rglob('*.manifest.json'):
            consumer=json.loads(path.read_text())
            if consumer.get('source')==args.source:continue
            for dep in [*consumer.get('imports',[]),*[d for f in consumer.get('module_fragments',[]) for d in f.get('imports',[])]]:
                if dep['from']==args.source:consumed.update([dep['name'],dep.get('binding',dep['name'])])
        pattern=r"(?m)^\s*(?:import|export)\s*(\{[^;\n}]*\}|\*\s+as\s+[A-Za-z_$][\w$]*)\s*from\s*['\"](\.{1,2}/[^'\"]+)['\"]"
        for path in out.rglob('*.mjs'):
            if path==module:continue
            for group,relative in re.findall(pattern,path.read_text(encoding='utf-8')):
                if (path.parent/relative).resolve()!=module.resolve():continue
                if group.startswith('*'):consumed.update(old_exports)
                else:consumed.update(re.findall(r'[A-Za-z_$][\w$]*',group))
        assert not missing & (live|consumed),('An original caller still requires omitted exports',sorted(missing & (live|consumed)))
        previous={row['name']:row for row in definitions}
        assert all(name in previous and previous[name]['kind']=='FunctionDecl' for name in missing),'Original storage or class factories cannot be omitted'
        current['unconsumed_legacy_export_omissions']=[{
            'name':name,'source_name':previous[name].get('source_name',name),
            'original_type':previous[name]['original_type'],'previous_owner_sha256':digest,
            'previous_preprocessor_inputs':document.get('ast_cache_inputs'),
            'emitted_references':False,'existing_consumers':False,
            'current_revision_recovery_claimed':False,'original_evidence_preserved_in_owner_history':True}
            for name in sorted(missing)]
        pruned+=sorted(missing);old_exports-=missing
        definitions=[row for row in definitions if row['name'] not in missing]
    if args.whole_unit:
        current,code=retain_header_aliases(document,current,old_exports-active_exports(candidate),candidate.read_text())
        candidate.write_text(code,encoding='utf-8',newline='\n')
    # Type-closure queries can retain a data-only declaration whose optional
    # JS class wrapper has never been implemented or exported. It is not a
    # required executable provider when all live code uses verified byte
    # views instead. Preserve the blocker explicitly; never waive a function,
    # initializer, old export, or type referenced by emitted code.
    live_references={name for row in current['definitions'] if row['status']=='source-first'
                     for name in row.get('source_references',[])}
    unused_types=[row for row in current['definitions'] if row['status']=='blocked'
                  and row['kind'] in ('CXXRecordDecl','RecordDecl')
                  and row['name'] not in old_exports|live_references]
    if not args.whole_unit:
        assert current['blocked']==len(unused_types),[row for row in current['definitions']
            if row['status']=='blocked' and row not in unused_types]
    else:
        assert not any(row['status']=='blocked' and row['name'] in old_exports|live_references
                       for row in current['definitions']),'A required original implementation is still blocked'
    current['unreferenced_type_wrapper_blockers']=[{'name':row['name'],'reason':row.get('reason')}
                                                 for row in unused_types]
    assert old_exports<=active_exports(candidate),'Original public/storage interface was lost'
    new_definitions={row['name']:row for row in current['definitions'] if row['status']=='source-first'}
    for row in definitions:
        assert row['name'] in new_definitions and row['original_type']==new_definitions[row['name']]['original_type'],row['name']
    for dependency in current.get('imports',[]):
        assert dependency['from']!=args.source,'A whole-owner rebuild cannot import its previous storage'
        provider=out/(dependency['from']+'.mjs')
        assert provider.is_file() and dependency.get('binding',dependency['name']) in active_exports(provider),dependency
        error=storage_import_error(dependency,{dependency['from']:{'manifest':json.loads(provider.with_suffix('.manifest.json').read_text()),'module':provider}})
        assert not error,error
    # Existing consumers must retain their actual calling/storage contracts.
    # A source-type or layout change requires recompiling those consumers;
    # never publish an incompatible owner merely because its exports exist.
    units={}
    for path in out.rglob('*.manifest.json'):
        doc=json.loads(path.read_text());source=doc.get('source')
        if source:units[source]={'manifest':doc,'module':out/(source+'.mjs')}
    units[args.source]={'manifest':current,'module':candidate}
    for source,unit in units.items():
        if source==args.source:continue
        doc=unit['manifest']
        for dependency in [*doc.get('imports',[]),*[d for fragment in doc.get('module_fragments',[]) for d in fragment.get('imports',[])]]:
            if dependency['from']!=args.source:continue
            assert dependency.get('binding',dependency['name']) in active_exports(candidate),dependency
            error=storage_import_error(dependency,units)
            assert not error,(source,error,dependency)
    def relocate(match):
        target=(candidate.parent/match[2]).resolve()
        assert target.is_relative_to(out.resolve()) and target.is_file(),target
        relative=os.path.relpath(target,module.parent).replace('\\','/')
        return 'from '+json.dumps(relative if relative.startswith('.') else './'+relative)
    code=re.sub(r'from ([\'\"])(\.{1,2}/[^\'\"]+)\1',relocate,candidate.read_text())
    checked=stage/'checked.mjs';checked.write_text(code,newline='\n')
    subprocess.run(['node','--check',str(checked)],check=True,capture_output=True,text=True)
    assert module.read_bytes()==old and manifest.read_bytes()==old_meta,'Owner changed during rebuild'
    history=base/'owner-history'/digest;history.mkdir(parents=True,exist_ok=True)
    (history/'original.mjs').write_bytes(old);(history/'original.manifest.json').write_bytes(old_meta)
    current.update(output=str(module),recompiled_owner_sha256=digest,
        activation_policy='Fresh runtime only; execute original global/engine initialization. No live-state migration.')
    replacement=module.with_suffix('.owner-rebuild.tmp');replacement.write_text(code,newline='\n')
    replacement_meta=manifest.with_suffix('.owner-rebuild.tmp');replacement_meta.write_text(json.dumps(current,indent=2)+'\n',newline='\n')
    try:
        os.replace(replacement,module);os.replace(replacement_meta,manifest)
    except BaseException:
        module.write_bytes(old);manifest.write_bytes(old_meta);raise
    report={'source':args.source,'replaced_sha256':digest,'original_exports_preserved':sorted(old_exports),
        'new_sha256':hashlib.sha256(module.read_bytes()).hexdigest(),'original_initializer_reexecution_required':True,
        'existing_consumers_abi_verified':True,'whole_unit':args.whole_unit,
        'pruned_unconsumed_exports':pruned,'retained_interface_before_sha256':args.interface_before_sha256,
        'gameplay_verified':False}
    (stage/'rebuild-report.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2),flush=True)
    build(out,out,base/'reports/browser-closure.json','source/build/src/engine.cpp','enginePreInit')
    component.checkpoint()

if __name__=='__main__':
    with component.component_lock():main()
