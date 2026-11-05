"""Retain an unchanged source-header factory and its original closed function graph.
A current native TU fingerprint must equal the saved owner. No data storage or
unknown imported implementation may be copied. Every original JS body is hashed.
"""
import argparse,hashlib,json,os,re,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'tools'))
import recover_browser_component as component
from source_first_global_link import storage_import_error

def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('source');p.add_argument('factory');p.add_argument('--history-owner',required=True);p.add_argument('--expected-sha256',required=True);a=p.parse_args()
 module=component.OUT/(a.source+'.mjs');meta=module.with_suffix('.manifest.json');code=module.read_bytes();before=meta.read_bytes();current=json.loads(before)
 assert hashlib.sha256(code).hexdigest()==a.expected_sha256
 history=component.BASE/'owner-history'/a.history_owner;original=(history/'original.mjs').read_bytes();saved=json.loads((history/'original.manifest.json').read_text())
 assert hashlib.sha256(original).hexdigest()==a.history_owner and current['source']==saved['source']==a.source
 assert current['ast_cache_inputs']==saved['ast_cache_inputs'] and current['ast_cache_inputs']['preprocessor_verified']
 old={r['name']:r for r in saved['definitions'] if r['status']=='source-first'};factory=old[a.factory]
 assert factory['kind']=='CXXRecordDecl' and factory['header_record_factory'] and factory['odr_inline']
 pending=[a.factory];selected={}
 while pending:
  name=pending.pop()
  if name in selected:continue
  row=old[name];assert row['kind'] in ('CXXRecordDecl','FunctionDecl') and not row.get('external_storage_imports') and not row.get('external_imports'),('Header factory graph is not closed',name)
  selected[name]=row;pending.extend(set(row.get('source_references',[]))-selected.keys())
 parser="""import ts from 'typescript';let text='';for await(const c of process.stdin)text+=c;
const {code,names}=JSON.parse(text),ast=ts.createSourceFile('original.mjs',code,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
if(ast.parseDiagnostics.length)throw Error('Original owner syntax invalid');let result={};
for(const name of names){const rows=ast.statements.filter(s=>ts.isFunctionDeclaration(s)&&s.name?.text===name);if(rows.length!==1)throw Error('Missing unique original function '+name);result[name]=rows[0].getText(ast);}process.stdout.write(JSON.stringify(result));"""
 helpers=['cCopyTrivialClass'];process=subprocess.run(['node','--input-type=module','-e',parser],input=json.dumps({'code':original.decode(),'names':list(selected)+helpers}),cwd=ROOT,text=True,capture_output=True,timeout=60);assert process.returncode==0,process.stderr
 bodies=json.loads(process.stdout);text=code.decode();row=next(r for r in current['definitions'] if r['name']==a.factory);alias=row.get('compiler_abi_alias',{});provider=alias.get('provider');assert alias.get('identical_original_factory') and provider
 provider_module=component.OUT/(provider+'.mjs');provider_doc=json.loads(provider_module.with_suffix('.manifest.json').read_text());actual=next(r for r in provider_doc['definitions'] if r['name']==a.factory)
 assert actual['odr_inline']==factory['odr_inline'] and row['odr_inline']==factory['odr_inline']
 relative=os.path.relpath(provider_module,module.parent).replace('\\','/');relative=relative if relative.startswith('.') else './'+relative
 declaration='import { '+a.factory+' as __retained_header_factory_'+a.factory+' } from '+json.dumps(relative)+';\nexport const '+a.factory+' = __retained_header_factory_'+a.factory+';'
 assert text.count(declaration)==1;text=text.replace(declaration,'')
 assert all(not re.search(r'(?m)^export function '+re.escape(name)+r'\(',text) for name in selected)
 for name,body in bodies.items():
  if name in helpers and re.search(r'(?m)^function '+re.escape(name)+r'\(',text):continue
  text+='\n// Unchanged original source/header implementation, retained without a new recovery claim.\n'+body+'\n'
 current['imports']=[d for d in current['imports'] if not(d['from']==provider and d['name']==a.factory and d.get('header_record_proof')==factory['odr_inline'])]
 current['definitions']=[r for r in current['definitions'] if r['name'] not in selected]
 evidence={'source_owner_sha256':a.history_owner,'identical_preprocessor_inputs':True,'source_function_sha256':{n:hashlib.sha256(v.encode()).hexdigest() for n,v in bodies.items()},'current_revision_reemission':False,'additional_source_definitions':0}
 current['definitions'].extend({**r,'retained_original_implementation':evidence} for r in selected.values())
 current['retained_source_header_factory_closures']=current.get('retained_source_header_factory_closures',[])+[{'name':a.factory,**evidence}]
 current['emitted']=sum(r['status']=='source-first' for r in current['definitions']);current['found']=len(current['definitions']);current['blocked']=sum(r['status']=='blocked' for r in current['definitions'])
 # Existing consumers retain the identical header/reference class contract.
 units={a.source:{'manifest':current,'module':module}}
 for path in component.OUT.rglob('*.manifest.json'):
  d=json.loads(path.read_text())
  if d.get('source')==a.source:continue
  for dep in [*d.get('imports',[]),*[i for f in d.get('module_fragments',[]) for i in f.get('imports',[])]]:
   if dep['from']==a.source:assert storage_import_error(dep,units) is None,(d.get('source'),dep)
 temporary=module.with_suffix('.retained-header.tmp.mjs');temporary.write_text(text,newline='\n');subprocess.run(['node','--check',temporary],check=True,capture_output=True)
 assert module.read_bytes()==code and meta.read_bytes()==before
 backup=component.BASE/'owner-history'/a.expected_sha256;backup.mkdir(exist_ok=True);(backup/'original.mjs').write_bytes(code);(backup/'original.manifest.json').write_bytes(before)
 os.replace(temporary,module);meta.write_bytes((json.dumps(current,indent=2)+'\n').encode());component.checkpoint();print(json.dumps(evidence,indent=2))
if __name__=='__main__':
 with component.component_lock():main()
