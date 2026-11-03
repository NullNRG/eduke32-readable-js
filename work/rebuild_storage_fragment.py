"""Replace one complete data-only source fragment for fresh runtimes only."""
import argparse,hashlib,json,os,re,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'tools'))
import recover_browser_component as component
from browser_target_closure import active_exports,build
from source_first_global_link import storage_import_error
from source_fragment_storage import audit
sha=lambda data:hashlib.sha256(data).hexdigest()
def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('source');parser.add_argument('--fragment-sha256',required=True)
    args=parser.parse_args();target=component.OUT;owner=target/(args.source+'.mjs');metadata=owner.with_suffix('.manifest.json')
    assert args.source in {row['file'] for row in json.loads(component.COMMANDS.read_text())}
    before=owner.read_bytes();before_meta=metadata.read_bytes();doc=json.loads(before_meta)
    choices=[row for row in doc.get('module_fragments',[]) if row['sha256']==args.fragment_sha256]
    assert len(choices)==1,'Expected original fragment must be unique'
    previous=choices[0];old_file=target/previous['module'];assert sha(old_file.read_bytes())==args.fragment_sha256
    exports=previous['exports'];old_rows={r['name']:r for r in doc['definitions'] if r['name'] in exports and r['status']=='source-first'}
    assert set(old_rows)==set(exports) and all(r['kind']=='VarDecl' for r in old_rows.values()),'Data-only original fragment required'
    declarations=lambda code:set(re.findall(r'^export (?:let|var|const) ([A-Za-z_$][\w$]*)\s*=',code,re.M))
    assert declarations(old_file.read_text())==set(exports),'Hidden original data must not be discarded'
    assert not re.search(r'^let __static_',old_file.read_text(),re.M),'Function static lifetime needs a whole-owner rebuild'
    assert not any(row['source']==args.source for row in audit(target)),'Repair existing duplicate ownership first'
    build(target,target,component.BASE/'reports/browser-closure.json','source/build/src/engine.cpp','enginePreInit')
    stage=component.BASE/'storage-rebuilds'/args.fragment_sha256;stage.mkdir(parents=True,exist_ok=True)
    providers=json.loads((target/'browser-combined-symbol-owners.json').read_text())
    providers={name:provider for name,provider in providers.items() if name not in exports}
    symbols=stage/'providers.json';symbols.write_text(json.dumps(providers,indent=2)+'\n')
    names=sorted({r['source_name'] for r in old_rows.values()});assert all(re.fullmatch(r'[A-Za-z_]\w*',name) for name in names)
    command=[sys.executable,ROOT/'tools/source_ast_to_js.py','--root',component.SOURCE,'--source',args.source,
        '--compile-commands',component.COMMANDS,'--out-dir',stage/'out','--filter',','.join(names),'--exact-filter',
        '--dependency-closure','--header-dependency-closure','--enum-closure','--require-record-layouts',
        '--project-symbols',symbols,'--import-root',target,'--rebuild-owner-sha256',sha(before),'--ast-cache-dir',component.CACHE]
    with (stage/'compile.log').open('w') as log:subprocess.run(list(map(str,command)),cwd=ROOT,stdout=log,stderr=subprocess.STDOUT,check=True,timeout=900)
    manifest=stage/'out'/(args.source+'.manifest.json');new=json.loads(manifest.read_text());candidate=Path(new['output']);code=candidate.read_text()
    rows={r['name']:r for r in new['definitions'] if r['status']=='source-first' and r['kind']=='VarDecl'}
    assert set(rows)==set(old_rows)==declarations(code),'Replacement must own exactly the same original data'
    assert not re.search(r'^let __static_',code,re.M),'New function static storage is not part of this replacement'
    assert new['native_pointer_abi']==doc['native_pointer_abi']
    for name,old in old_rows.items():
        row=rows[name]
        for key in ('source_name','original_type','linkage','physical_source','object_storage','global_storage','private_storage'):
            assert row.get(key)==old.get(key),(name,key)
        for key in ('source_header','source_offset','translation_unit','linkage','definition_rule','physical_origin_proof'):
            assert row.get('header_global_definition',{}).get(key)==old.get('header_global_definition',{}).get(key),(name,key)
    for dep in new['imports']:
        provider=target/(dep['from']+'.mjs');assert provider.is_file() and dep.get('binding',dep['name']) in active_exports(provider),dep
        assert not storage_import_error(dep,{dep['from']:{'manifest':json.loads(provider.with_suffix('.manifest.json').read_text()),'module':provider}}),dep
        assert dep['name'] not in exports,'Replacement cannot import its superseded data'
    def relocate(match):
        path=(candidate.parent/match[2]).resolve();assert path.is_relative_to(target.resolve()) and path.is_file()
        relative=os.path.relpath(path,owner.parent).replace('\\','/')
        return 'from '+json.dumps(relative if relative.startswith('.') else './'+relative)
    code=re.sub(r'from ([\'"])(\.{1,2}/[^\'"]+)\1',relocate,code);digest=sha(code.encode())
    fragment=owner.parent/('_source_legacy_'+owner.stem.replace('.','_')+'_'+digest[:12]+'.mjs')
    if fragment.exists():assert fragment.read_bytes()==code.encode(),'Existing immutable fragment differs'
    reexports=previous.get('reexports',exports)
    pattern=r'export\s*\{\s*'+r'\s*,\s*'.join(re.escape(name) for name in reexports)+r'\s*\}\s*from\s*["\']\./'+re.escape(old_file.name)+r'["\'];'
    assert len(re.findall(pattern,before.decode()))==1
    rendered=re.sub(pattern,lambda _: 'export { '+', '.join(reexports)+' } from '+json.dumps('./'+fragment.name)+';',before.decode(),count=1)
    backup=component.BASE/'owner-history'/sha(before);backup.mkdir(parents=True,exist_ok=True)
    (backup/'original.mjs').write_bytes(before);(backup/'original.manifest.json').write_bytes(before_meta)
    fragment.write_text(code,encoding='utf-8',newline='\n');subprocess.run(['node','--check',str(fragment)],check=True,capture_output=True)
    assert owner.read_bytes()==before and metadata.read_bytes()==before_meta,'Owner changed during rebuild'
    replacement={**previous,'module':fragment.relative_to(target).as_posix(),'sha256':digest,'imports':new['imports'],
        'source_manifest_sha256':sha(manifest.read_bytes()),'activation_policy':'Fresh runtime; original static initialization, no state migration.'}
    doc['module_fragments']=[replacement if row is previous else row for row in doc['module_fragments']]
    doc.setdefault('superseded_module_fragments',[]).append(previous)
    doc['definitions']=[rows.get(row['name'],row) for row in doc['definitions']]
    try:
        owner.write_bytes(rendered.encode());metadata.write_text(json.dumps(doc,indent=2)+'\n')
        assert not any(row['source']==args.source for row in audit(target))
    except BaseException:
        owner.write_bytes(before);metadata.write_bytes(before_meta);raise
    result={'source':args.source,'replaced_fragment_sha256':args.fragment_sha256,'new_fragment_sha256':digest,
        'source_types_layouts_and_storage_owners_preserved':True,'original_exports_preserved':exports,'fresh_runtime_required':True,'gameplay_verified':False}
    (stage/'rebuild-report.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2),flush=True)
    build(target,target,component.BASE/'reports/browser-closure.json','source/build/src/engine.cpp','enginePreInit');component.checkpoint()
if __name__=='__main__':
    with component.component_lock():main()
