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
    parser.add_argument('--whole-unit',action='store_true',help='Rebuild all original declarations, retaining every previous executable/storage export')
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
        args.whole_unit and row['kind']=='CXXRecordDecl' and row.get('header_record_factory') and row.get('odr_inline')
        for row in definitions),'Original source data/functions or attested header owners required'
    names=sorted({row.get('source_name',row['name']) for row in definitions})
    assert all(re.fullmatch(r'[A-Za-z_]\w*',name) for name in names)
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
    else:command+=['--header-inline-filter',','.join(sorted({row.get('source_name',row['name']) for row in definitions if row['kind']=='FunctionDecl'}))]
    log=stage/'compile.log'
    with log.open('w') as stream:
        result=subprocess.run(command,cwd=ROOT,stdout=stream,stderr=subprocess.STDOUT,timeout=900)
    assert result.returncode==0,'Source compilation failed: '+str(log)
    candidate=stage/(args.source+'.mjs');current=json.loads(candidate.with_suffix('.manifest.json').read_text())
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
