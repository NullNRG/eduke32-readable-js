"""Refresh original functions while retaining immutable mixed-fragment storage."""
import hashlib,json,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def run(args,ok=True):
 task=subprocess.run(list(map(str,args)),cwd=ROOT,capture_output=True,text=True,timeout=180)
 assert (task.returncode==0)==ok,(args,task.stdout[-1800:],task.stderr[-2200:]);return task.stdout
with tempfile.TemporaryDirectory(prefix='source-preserved-storage-') as directory:
 root=Path(directory);src=root/'source';src.mkdir();owner=root/'owner';candidate=root/'candidate'
 code='static int counter=7;int step(int n){counter+=n;return counter;}int read(){return counter;}\n'
 (src/'unit.cpp').write_text(code)
 compiler=[sys.executable,ROOT/'tools/source_ast_to_js.py','--root',src,'--source','unit.cpp','--require-record-layouts']
 run([*compiler,'--out-dir',owner]);module=owner/'unit.cpp.mjs';manifest=owner/'unit.cpp.manifest.json';doc=json.loads(manifest.read_text());before=module.read_bytes();digest=hashlib.sha256(before).hexdigest()
 storage=next(row['private_storage'] for row in doc['definitions'] if row['name']=='counter');binding=storage['binding']
 legacy=owner/('_source_legacy_unit_cpp_'+digest[:12]+'.mjs');legacy.write_bytes(before)
 names=['counter','step','read'];reexports=[*names,binding]
 module.write_text('export { '+', '.join(reexports)+' } from "./'+legacy.name+'";\n')
 doc['module_fragments']=[{'module':legacy.name,'sha256':digest,'original_source':'unit.cpp','exports':names,'reexports':reexports,'imports':[],'native_pointer_abi':doc['native_pointer_abi']}]
 manifest.write_text(json.dumps(doc));index=root/'symbols.json';index.write_text(json.dumps({name:'unit.cpp' for name in names}))
 (src/'unit.cpp').write_text(code.replace('counter+=n','counter+=n*2'))
 run([*compiler,'--out-dir',candidate,'--filter','step,read','--exact-filter','--dependency-closure','--project-symbols',index,'--import-root',owner])
 install=[sys.executable,ROOT/'tools/install_verified_fragment.py','--manifest',candidate/'unit.cpp.manifest.json','--target',owner,'--exports','step','read','--replace-fragment-sha256',digest,'--report',root/'integration.json']
 original_owner=module.read_bytes();original_manifest=manifest.read_bytes()
 run(install,False);assert module.read_bytes()==original_owner and manifest.read_bytes()==original_manifest
 run([*install,'--preserve-fragment-storage'])
 assert legacy.read_bytes()==before and hashlib.sha256(legacy.read_bytes()).hexdigest()==digest
 updated=json.loads(manifest.read_text());preserved=[f for f in updated['module_fragments'] if f.get('preserved_storage_from_sha256')==digest]
 assert len(preserved)==1 and preserved[0]['exports']==['counter'] and preserved[0]['reexports']==['counter',binding],preserved
 assert len([row for row in updated['definitions'] if row['name']=='counter'])==1
 runner=root/'run.mjs';runner.write_text('import * as m from '+json.dumps(module.as_uri())+';const p=m.'+binding+'();if(m.read()!==7||m.step(3)!==13||m.read()!==13||m.'+binding+'()!==p||p.value!==13)throw Error("storage reset or stale function");console.log("PASS");')
 assert run(['node',runner]).strip()=='PASS'
print('PASS: mixed-fragment function refresh preserves exact original storage bytes/address binding and executes new code; unsafe partial replacement rejected')
