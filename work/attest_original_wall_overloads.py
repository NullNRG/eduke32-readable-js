"""Add fresh Clang identity metadata to unchanged, previously verified providers.

No generated body or original storage is replaced. The producer manifest digest,
actual shard digest, exact source/header/toolchain fingerprint, source location,
qualified export and original type must all agree before metadata is attached.
"""
import hashlib,json,os,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'tools'))
import recover_browser_component as component
from source_cpp_function_bindings import ABI
from source_first_global_link import exported_names

def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def main():
 source='source/build/src/engine.cpp'
 owner=component.OUT/(source+'.manifest.json');doc=json.loads(owner.read_text())
 fresh_path=ROOT/'work/nov16-overload-attestation'/owner.relative_to(component.OUT)
 fresh=json.loads(fresh_path.read_text())
 fragment=next(f for f in doc['module_fragments'] if f['sha256']=='7317576b8d08f6d282faad89bd7a7f399096eac25233a7883dcb4d9490dcd8c7')
 shard=component.OUT/fragment['module'];assert sha(shard)==fragment['sha256']
 candidates=[p for p in (component.BASE/'boot-probes').glob('**/engine.cpp.manifest.json') if sha(p)==fragment['source_manifest_sha256']]
 assert len(candidates)==1,candidates
 producer_path=candidates[0];producer=json.loads(producer_path.read_text())
 inputs=fresh['ast_cache_inputs']
 assert inputs.get('preprocessor_verified') and inputs.get('content_hashes_not_mtimes')
 assert inputs==producer['ast_cache_inputs']==doc['ast_cache_inputs']
 assert fresh['source']==producer['source']==doc['source']==source
 exports=exported_names(component.OUT/(source+'.mjs'));changes=[]
 for row in doc['definitions']:
  if row.get('source_name')!='getwalldist' or row.get('status')!='source-first':continue
  assert row['name'] in exports and row['name'] in fragment['exports']
  keys=('name','source_name','kind','line','original_type','linkage')
  old=[r for r in producer['definitions'] if all(r.get(k)==row.get(k) for k in keys)]
  new=[r for r in fresh['definitions'] if all(r.get(k)==row.get(k) for k in keys)]
  assert len(old)==len(new)==1,(row['name'],len(old),len(new))
  proof=new[0]['cpp_function_identity']
  assert proof['abi']==ABI and proof['original_type']==row['original_type']
  assert proof['source_name']==row['source_name'] and row['linkage']=='external'
  assert row.get('cpp_function_identity',proof)==proof
  row['cpp_function_identity']=proof
  changes.append({'export':row['name'],'line':row['line'],'identity':proof})
 assert len(changes)==2
 report={'format':'original-clang-provider-metadata-attestation/1','source':source,
  'fresh_manifest':fresh_path.relative_to(ROOT).as_posix(),'fresh_manifest_sha256':sha(fresh_path),
  'producer_manifest':producer_path.relative_to(ROOT).as_posix(),'producer_manifest_sha256':sha(producer_path),
  'unchanged_module':fragment['module'],'unchanged_module_sha256':sha(shard),
  'ast_cache_inputs':inputs,'attested':changes,'generated_code_changed':False,
  'original_storage_changed':False,'gameplay_verified':False}
 temporary=owner.with_suffix('.attestation.tmp');temporary.write_text(json.dumps(doc,indent=2)+'\n');os.replace(temporary,owner)
 assert sha(shard)==report['unchanged_module_sha256']
 path=ROOT/'reports/nov16-original-overload-attestation.json';path.write_text(json.dumps(report,indent=2)+'\n')
 print(json.dumps(report,indent=2))
if __name__=='__main__':
 with component.component_lock():main()
