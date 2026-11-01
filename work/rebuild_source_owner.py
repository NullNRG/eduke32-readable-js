"""Recompile a complete function/data owner into fresh-runtime artifacts.

Requires the exact old owner hash, preserves its entire exported interface, and
never migrates or replaces live JS objects. Original initialization runs again
in the next fresh browser realm. Header/class owners need separate recovery.
"""
import argparse,hashlib,json,os,re,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'tools'))
import recover_browser_component as component
from browser_target_closure import active_exports,build
from source_first_global_link import storage_import_error

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source');parser.add_argument('--expected-sha256',required=True)
    args=parser.parse_args();out=component.OUT;base=component.BASE
    assert args.source in {row['file'] for row in json.loads(component.COMMANDS.read_text())}
    module=out/(args.source+'.mjs');manifest=module.with_suffix('.manifest.json')
    assert module.resolve().is_relative_to(out.resolve())
    old=module.read_bytes();old_meta=manifest.read_bytes();digest=hashlib.sha256(old).hexdigest()
    assert digest==args.expected_sha256,'Original owner changed'
    document=json.loads(old_meta);definitions=[row for row in document['definitions'] if row['status']=='source-first']
    assert definitions and all(row['kind']=='FunctionDecl' or
        row['kind']=='VarDecl' and row.get('physical_source',args.source)==args.source
        for row in definitions),'Only source functions and same-unit data owners are supported'
    names=sorted({row.get('source_name',row['name']) for row in definitions})
    assert all(re.fullmatch(r'[A-Za-z_]\w*',name) for name in names)
    old_exports=active_exports(module)
    build(out,out,base/'reports/browser-closure.json','source/build/src/engine.cpp','enginePreInit')
    owners=json.loads((out/'browser-combined-symbol-owners.json').read_text())
    owners={name:owner for name,owner in owners.items() if owner!=args.source and name not in old_exports}
    stage=base/'owner-rebuilds'/args.source.replace('/','_')/digest[:16];stage.mkdir(parents=True,exist_ok=True)
    index=stage/'providers.json';index.write_text(json.dumps(owners,indent=2)+'\n')
    command=[sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(component.SOURCE),
        '--source',args.source,'--compile-commands',str(component.COMMANDS),'--out-dir',str(stage),
        '--filter',','.join(names),'--exact-filter','--project-symbols',str(index),'--import-root',str(out),
        '--dependency-closure','--header-dependency-closure','--header-inlines','--enum-closure',
        '--require-record-layouts','--rebuild-owner-sha256',digest,'--ast-cache-dir',str(component.CACHE)]
    log=stage/'compile.log'
    with log.open('w') as stream:
        result=subprocess.run(command,cwd=ROOT,stdout=stream,stderr=subprocess.STDOUT,timeout=900)
    assert result.returncode==0,'Source compilation failed: '+str(log)
    candidate=stage/(args.source+'.mjs');current=json.loads(candidate.with_suffix('.manifest.json').read_text())
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
    assert current['blocked']==len(unused_types),[row for row in current['definitions']
        if row['status']=='blocked' and row not in unused_types]
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
        'gameplay_verified':False}
    (stage/'rebuild-report.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2),flush=True)
    build(out,out,base/'reports/browser-closure.json','source/build/src/engine.cpp','enginePreInit')
    component.checkpoint()

if __name__=='__main__':
    with component.component_lock():main()
