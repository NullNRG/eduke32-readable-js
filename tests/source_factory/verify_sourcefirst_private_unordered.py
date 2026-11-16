"""One original unit's opaque library object stays owned across source fragments."""
import copy,json,os,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tools'))
from source_ast_stream import run_clang_ast
from source_first_toolchain import frontend_config
from source_ast_to_js import produce
from source_scalar_helpers import emit as emit_scalars
from source_first_global_link import storage_import_error
SOURCE='''#include <unordered_map>
static std::unordered_map<unsigned,unsigned short> table;
static unsigned initial_size=std::unordered_map<unsigned,unsigned short>{}.size();
unsigned checkpoint_size(){return initial_size;}
unsigned store(unsigned key,unsigned short value){table[key]=value;return table[key];}
unsigned read(unsigned key){auto it=table.find(key);return it==table.end()?0:it->second;}
void* address(){return &table;}
'''
def run(args):
 task=subprocess.run(list(map(str,args)),cwd=ROOT,capture_output=True,text=True,timeout=180)
 assert task.returncode==0,(args,task.stdout[-1500:],task.stderr[-2000:]);return task.stdout.strip()
with tempfile.TemporaryDirectory(prefix='source-private-unordered-') as directory:
 root=Path(directory);src=root/'unit.cpp';src.write_text(SOURCE);owner=root/'owner'
 run([sys.executable,ROOT/'tools/source_ast_to_js.py','--root',root,'--source','unit.cpp','--out-dir',owner,'--require-record-layouts','--header-dependency-closure'])
 manifest=json.loads((owner/'unit.cpp.manifest.json').read_text());provider=owner/'unit.cpp.mjs'
 private=next(r['private_storage'] for r in manifest['definitions'] if r['name']=='table')
 frontend,flags=frontend_config();ast,_=run_clang_ast([frontend,*flags,'-std=c++14','-fsyntax-only','-Xclang','-ast-dump=json',str(src)],cwd=root)
 # This fixture is a complete one-unit source program: its full native AST
 # proves absence of global replacements. A production multi-unit CLI build
 # instead requires its native semantic-index standard-heap contract.
 units,rows=produce(ast,src,'unit.cpp',filters='read,address,checkpoint_size',source_root=root,
  header_dependency_closure=True,project_symbols={name:'unit.cpp' for name in ('table','initial_size')},
  private_source_storage={r['name']:r['private_storage'] for r in manifest['definitions'] if r.get('private_storage')},
  existing_source_storage={r['name']:r for r in manifest['definitions'] if r['name'] in ('table','initial_size')},standard_heap_runtime=True)
 for name in ('read','address','checkpoint_size'):
  row=next(r for r in rows if r['name']==name);assert row['status']=='source-first',row
 imports=[d for row in rows if row['status']=='source-first' for d in row.get('external_storage_imports',[])]
 assert imports and all(d.get('opaque_library',{}).get('abi')=='source-opaque-std-unordered-map/1' for d in imports if d['name']=='table'),imports
 assert any(d['name']=='initial_size' and 'opaque_library' not in d for d in imports),imports
 providers={'unit.cpp':{'manifest':manifest,'module':provider}}
 for dependency in imports:
  dep={**dependency,'from':'unit.cpp','native_pointer_abi':manifest['native_pointer_abi']};assert storage_import_error(dep,providers) is None,(dep,storage_import_error(dep,providers))
  if dependency['name']=='table':
   changed=copy.deepcopy(dep);changed['opaque_library']['schema']['key']=16;assert storage_import_error(changed,providers)
   changed=copy.deepcopy(dep);changed.pop('opaque_library');assert storage_import_error(changed,providers)
  changed=copy.deepcopy(dep);changed['consumer_source']='other.cpp';assert storage_import_error(changed,providers)
 body='\n\n'.join(code for code,row in zip(units,[r for r in rows if r['status']=='source-first']) if row['name'] in ('read','address','checkpoint_size'));binding=private['binding']
 consumer=root/'consumer.mjs';consumer.write_text('import {'+binding+'} from '+json.dumps(provider.as_uri())+';\n'+(ROOT/'tools/source_unordered_map_runtime.mjs').read_text()+'\n'+emit_scalars(body)+'\n'+body)
 scalar_binding=next(r['private_storage']['binding'] for r in manifest['definitions'] if r['name']=='initial_size')
 consumer.write_text(consumer.read_text().replace('import {'+binding+'}', 'import {'+binding+', '+scalar_binding+'}'))
 runner=root/'run.mjs';runner.write_text('import * as a from '+json.dumps(provider.as_uri())+';import * as b from '+json.dumps(consumer.as_uri())+';for(let k=0;k<1024;k++){const v=(k*19)&65535;if(a.store(k,v)!==v||b.read(k)!==v||a.read(k)!==v||a.address()!==b.address()||b.checkpoint_size()!==0)throw Error("private map identity/value differs");}console.log("PASS shared private map");')
 assert run(['node',runner])=='PASS shared private map'
print('PASS: 1024 original-source fragment writes/reads and identical container addresses; missing/wrong library ABI and foreign owner rejected')
