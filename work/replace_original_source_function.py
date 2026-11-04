"""Recompile one original primary-owner function without resetting its storage.

Hash-locked, fresh-runtime-only repair. Static storage and additional emitted
exports are rejected. The original owner and all ABI contracts are preserved.
"""
import argparse,hashlib,json,os,re,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'tools'))
import recover_browser_component as component
from browser_target_closure import active_exports,build
from source_first_global_link import storage_import_error

def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('source');p.add_argument('name');p.add_argument('--expected-sha256',required=True);a=p.parse_args()
 assert re.fullmatch(r'[A-Za-z_]\w*',a.name)
 assert a.source in {r['file'] for r in json.loads(component.COMMANDS.read_text())}
 out=component.OUT;base=component.BASE;module=out/(a.source+'.mjs');meta=module.with_suffix('.manifest.json')
 before=module.read_bytes();old_meta=meta.read_bytes();owner=json.loads(old_meta)
 assert hashlib.sha256(before).hexdigest()==a.expected_sha256,'Original owner changed'
 previous=[r for r in owner['definitions'] if r['name']==a.name and r['status']=='source-first']
 assert len(previous)==1 and previous[0]['kind']=='FunctionDecl'
 parse=r'''import ts from 'typescript';let input='';for await(const s of process.stdin)input+=s;const {code,name}=JSON.parse(input);
 const ast=ts.createSourceFile('owner.mjs',code,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
 if(ast.parseDiagnostics.length)throw Error('Original owner has parser errors');
 const functions=ast.statements.filter(s=>ts.isFunctionDeclaration(s)&&s.name?.text===name&&s.modifiers?.some(m=>m.kind===ts.SyntaxKind.ExportKeyword));
 if(functions.length!==1)throw Error('No unique primary original function');
 const node=functions[0];process.stdout.write(JSON.stringify({start:node.getStart(ast),end:node.end}));'''
 parsed=subprocess.run(['node','--input-type=module','-e',parse],input=json.dumps({'code':before.decode(),'name':a.name}),cwd=ROOT,capture_output=True,text=True,check=True)
 span=json.loads(parsed.stdout)
 build(out,out,base/'reports/browser-closure.json','source/build/src/engine.cpp','enginePreInit')
 providers=json.loads((out/'browser-combined-symbol-owners.json').read_text());providers.pop(a.name,None)
 from source_ast_to_js import compiler_runtime_revision
 stage=base/'owner-function-rebuilds'/a.source.replace('/','_')/(a.name+'-'+a.expected_sha256[:12]+'-'+compiler_runtime_revision()[:12]);stage.mkdir(parents=True,exist_ok=True)
 index=stage/'providers.json';index.write_bytes((json.dumps(providers,indent=2)+'\n').encode())
 command=[sys.executable,ROOT/'tools/source_ast_to_js.py','--root',component.SOURCE,'--source',a.source,
  '--compile-commands',component.COMMANDS,'--out-dir',stage,'--project-symbols',index,'--import-root',out,
  '--filter',a.name,'--exact-filter','--dependency-closure','--header-dependency-closure','--enum-closure',
  '--require-record-layouts','--ast-cache-dir',component.CACHE]
 with (stage/'compile.log').open('w') as log:subprocess.run(list(map(str,command)),cwd=ROOT,stdout=log,stderr=subprocess.STDOUT,check=True,timeout=900)
 candidate=stage/(a.source+'.mjs');manifest=candidate.with_suffix('.manifest.json');doc=json.loads(manifest.read_text());code=candidate.read_text()
 assert doc['blocked']==0 and active_exports(candidate)=={a.name},'Repair requires one completely closed original function'
 row=next(r for r in doc['definitions'] if r['name']==a.name)
 assert row['kind']=='FunctionDecl' and row['status']=='source-first' and row['original_type']==previous[0]['original_type']
 assert doc.get('native_pointer_abi')==owner.get('native_pointer_abi')
 assert doc.get('ast_cache_inputs',{}).get('preprocessor_verified') and doc['ast_cache_inputs']==owner.get('ast_cache_inputs'),'Original TU content changed'
 assert not any(r['kind']=='VarDecl' and r['status']=='source-first' for r in doc['definitions'])
 assert not re.search(r'(?m)^let\s+__static_|^export\s+(?:let|var)\b',code),'Static storage requires a whole-owner rebuild'
 for dep in doc['imports']:
  provider=out/(dep['from']+'.mjs');assert dep.get('binding',dep['name']) in active_exports(provider),dep
  error=storage_import_error(dep,{dep['from']:{'manifest':json.loads(provider.with_suffix('.manifest.json').read_text()),'module':provider}})
  assert not error,error
 def relocate(m):
  target=(candidate.parent/m[2]).resolve();assert target.is_relative_to(out.resolve()) and target.is_file()
  rel=os.path.relpath(target,module.parent).replace('\\','/');return 'from '+json.dumps(rel if rel.startswith('.') else './'+rel)
 code=re.sub(r'from ([\'\"])(\.{1,2}/[^\'\"]+)\1',relocate,code)
 digest=hashlib.sha256(code.encode()).hexdigest();fragment=module.parent/('_source_legacy_'+module.stem.replace('.','_')+'_'+digest[:12]+'.mjs')
 assert not fragment.exists(),'Repair fragment already exists'
 text=before.decode();replacement='import { '+a.name+' } from '+json.dumps('./'+fragment.name)+';\nexport { '+a.name+' } from '+json.dumps('./'+fragment.name)+';'
 # TypeScript spans are UTF-16 indices; convert explicitly before slicing Python Unicode.
 prefix=text.encode('utf-16-le')[:span['start']*2].decode('utf-16-le');suffix=text.encode('utf-16-le')[span['end']*2:].decode('utf-16-le')
 updated=(prefix+replacement+suffix).encode()
 assert module.read_bytes()==before and meta.read_bytes()==old_meta,'Owner changed during repair'
 saved=base/'owner-history'/a.expected_sha256;saved.mkdir(parents=True,exist_ok=True)
 (saved/'original.mjs').write_bytes(before);(saved/'original.manifest.json').write_bytes(old_meta)
 record={'module':fragment.relative_to(out).as_posix(),'sha256':digest,'original_source':a.source,'exports':[a.name],'reexports':[a.name],
  'imports':doc['imports'],'native_pointer_abi':doc['native_pointer_abi'],'source_manifest_sha256':hashlib.sha256(manifest.read_bytes()).hexdigest()}
 owner['definitions']=[row if r['name']==a.name else r for r in owner['definitions']]
 owner.setdefault('module_fragments',[]).append(record)
 owner.setdefault('primary_function_recompilations',[]).append({'name':a.name,'owner_before_sha256':a.expected_sha256,
  'original_function_type':row['original_type'],'source_storage_unchanged':True,'fresh_runtime_required':True,'source_manifest_sha256':record['source_manifest_sha256']})
 temporary=module.with_suffix('.primary-repair.mjs')
 try:
  fragment.write_bytes(code.encode());temporary.write_bytes(updated)
  for path in (fragment,temporary):subprocess.run(['node','--check',path],check=True,capture_output=True,text=True)
  assert active_exports(temporary)==active_exports(module),'Existing interface changed'
  module.write_bytes(updated);meta.write_bytes((json.dumps(owner,indent=2)+'\n').encode())
  build(out,out,base/'reports/browser-closure.json','source/build/src/engine.cpp','enginePreInit');checkpoint=component.checkpoint()
  assert not checkpoint['invalid_imports'],'Original graph has invalid imports after repair'
 except BaseException:
  module.write_bytes(before);meta.write_bytes(old_meta);fragment.unlink(missing_ok=True);raise
 finally:temporary.unlink(missing_ok=True)
 result={'source':a.source,'name':a.name,'owner_before_sha256':a.expected_sha256,'owner_after_sha256':hashlib.sha256(updated).hexdigest(),
  'original_type':row['original_type'],'source_storage_unchanged':True,'imports_verified':True,'existing_exports_preserved':True,'gameplay_verified':False}
 (stage/'integration.json').write_bytes((json.dumps(result,indent=2)+'\n').encode());print(json.dumps(result,indent=2))
if __name__=='__main__':
 with component.component_lock():main()
