"""Attest existing compiler-generated record bytes without rewriting source code.

The exact initializer schema must reproduce the old full ABI digest, and the
actual exported address cell must return that same record. No class-method
contract is relaxed and no implementation or recovered-definition count changes.
"""
import argparse,hashlib,json,os,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'tools'))
from source_record_data_access import layout_contract
from browser_target_closure import active_exports

def upgrade(module,expected_sha256,history):
    module=Path(module).resolve();meta=module.with_suffix('.manifest.json')
    code=module.read_bytes();before=meta.read_bytes();doc=json.loads(before)
    digest=hashlib.sha256(code).hexdigest()
    if digest!=expected_sha256:raise ValueError('Original owner changed')
    assert doc['native_pointer_abi']=='source-lp64-addresses/2'
    assert (doc.get('ast_cache_inputs') or {}).get('preprocessor_verified'),'Original verified preprocessing fingerprint required'
    targets=[r for r in doc['definitions'] if r.get('status')=='source-first' and r.get('kind')=='VarDecl'
             and r.get('global_storage',{}).get('byte_record_schema_sha256')]
    if not targets:return {'changed':False,'source':doc['source'],'source_definitions_recovered':0}
    relative=Path(doc['source']);assert not relative.is_absolute() and '..' not in relative.parts
    root=module.parents[len(relative.parts)-1]
    assert root/(doc['source']+'.mjs')==module
    files=[(module,code)]
    for fragment in doc.get('module_fragments',[]):
        path=(root/fragment['module']).resolve();assert path.parent==module.parent
        data=path.read_bytes();assert hashlib.sha256(data).hexdigest()==fragment['sha256']
        files.append((path,data))
    parser=r'''import ts from 'typescript';let input='';for await(const part of process.stdin)input+=part;
const {files,names,bindings}=JSON.parse(input),rows=[],getters=[];
for(let index=0;index<files.length;index++){
 const ast=ts.createSourceFile('owner.mjs',files[index],ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
 if(ast.parseDiagnostics.length)throw Error('Original source module has parser errors');
 for(const statement of ast.statements){
  if(!statement.modifiers?.some(m=>m.kind===ts.SyntaxKind.ExportKeyword))continue;
  if(ts.isVariableStatement(statement))for(const decl of statement.declarationList.declarations){
   if(!ts.isIdentifier(decl.name)||!names.includes(decl.name.text)||!decl.initializer||!ts.isCallExpression(decl.initializer))continue;
   const call=decl.initializer,kind=call.expression.getText(ast);if(!['cZeroAggregate','cInitByteRecord'].includes(kind))continue;
   const value=JSON.parse(call.arguments[0].getText(ast)),schema=kind==='cZeroAggregate'?value.byteRecord:value;
   if(schema)rows.push({name:decl.name.text,index,schema,kind});
  }
  if(ts.isFunctionDeclaration(statement)&&bindings.includes(statement.name?.text)){
   const found=[];function visit(node){if(ts.isGetAccessorDeclaration(node)&&node.name.getText(ast)==='value'){
    const body=node.body?.statements;if(body?.length===1&&ts.isReturnStatement(body[0])&&ts.isIdentifier(body[0].expression))found.push(body[0].expression.text);
   }ts.forEachChild(node,visit);}visit(statement);getters.push({binding:statement.name.text,found});
  }
 }
}
process.stdout.write(JSON.stringify({rows,getters}));'''
    payload={'files':[data.decode() for path,data in files],'names':[r['name'] for r in targets],
             'bindings':[r['global_storage']['binding'] for r in targets]}
    process=subprocess.run(['node','--input-type=module','-e',parser],input=json.dumps(payload),cwd=ROOT,
                           capture_output=True,text=True,timeout=120)
    if process.returncode:raise ValueError('Original initializer parse failed: '+process.stderr[-1600:])
    parsed=json.loads(process.stdout);changed=[];available=active_exports(module)
    for row in targets:
        name=row['name'];storage=row['global_storage'];binding=storage['binding']
        assert name in available and binding in available
        found=[r for r in parsed['rows'] if r['name']==name]
        getter=[r for r in parsed['getters'] if r['binding']==binding]
        assert len(found)==1 and len(getter)==1 and getter[0]['found']==[name],('Ambiguous original storage/getter',name)
        schema=found[0]['schema'];assert schema.get('fields') and schema.get('size',0)>0
        assert hashlib.sha256(json.dumps(schema,sort_keys=True).encode()).hexdigest()==storage['byte_record_schema_sha256'],('Original schema differs from recorded ABI',name)
        contract=layout_contract(schema)
        if storage.get('byte_record_native_layout')==contract:continue
        assert 'byte_record_native_layout' not in storage,('Conflicting native field layout',name)
        exports=[r for r in doc.get('storage_exports',[]) if r.get('name')==name and r.get('binding')==binding]
        assert len(exports)==1 and exports[0].get('byte_record_schema_sha256')==storage['byte_record_schema_sha256']
        storage['byte_record_native_layout']=contract;exports[0]['byte_record_native_layout']=contract
        changed.append({'name':name,'binding':binding,'original_full_schema_sha256':storage['byte_record_schema_sha256'],
                        'native_layout':contract,'initializer':found[0]['kind']})
    if not changed:return {'changed':False,'source':doc['source'],'source_definitions_recovered':0}
    record={'kind':'verified-original-record-field-storage/1','owner_sha256':digest,
        'previous_manifest_sha256':hashlib.sha256(before).hexdigest(),'records':changed,
        'actual_code_sha256':{path.relative_to(root).as_posix():hashlib.sha256(data).hexdigest() for path,data in files},
        'source_code_changed':False,'source_definitions_recovered':0,'class_method_contracts_unchanged':True}
    doc.setdefault('record_field_storage_attestations',[]).append(record)
    assert meta.read_bytes()==before and all(path.read_bytes()==data for path,data in files),'Owner changed during attestation'
    saved=Path(history)/(digest+'-'+record['previous_manifest_sha256'][:16]);saved.mkdir(parents=True,exist_ok=True)
    (saved/'original.mjs').write_bytes(code);(saved/'original.manifest.json').write_bytes(before)
    stage=meta.with_suffix('.record-layout.tmp');stage.write_bytes((json.dumps(doc,indent=2)+'\n').encode());os.replace(stage,meta)
    return {'changed':True,'source':doc['source'],**record}

if __name__=='__main__':
    import recover_browser_component as component
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('sources',nargs='+')
    args=parser.parse_args();selected={r['file'] for r in json.loads(component.COMMANDS.read_text())}
    with component.component_lock():
        for source in args.sources:
            assert source in selected;module=component.OUT/(source+'.mjs')
            print(json.dumps(upgrade(module,hashlib.sha256(module.read_bytes()).hexdigest(),component.BASE/'owner-history'),indent=2))
        component.checkpoint()
