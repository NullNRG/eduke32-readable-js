"""Native field ABI remains stable when another TU instantiates class methods."""
import copy,hashlib,json,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tools'))
from source_first_global_link import storage_import_error
from source_record_data_access import compatible
from source_record_layout_upgrade import upgrade
def run(args,cwd):
    p=subprocess.run(list(map(str,args)),cwd=cwd,capture_output=True,text=True,timeout=180)
    assert p.returncode==0,(p.stdout[-1200:],p.stderr[-2400:])
    return p.stdout
with tempfile.TemporaryDirectory() as folder:
    root=Path(folder);original=root/'original';original.mkdir();out=root/'out'
    (original/'types.hpp').write_text('''#pragma once
template<class T> struct Vec {T x,y;int sum()const{return x+y;}};extern Vec<int> shared;
''')
    (original/'one.cpp').write_text('#include "types.hpp"\nVec<int> shared;extern "C" int get(){return shared.x+shared.y;}\n')
    (original/'two.cpp').write_text('#include "types.hpp"\nextern "C" int step(int n){Vec<int> local{7,9};int localSum=local.sum();shared.x+=n;shared.y-=n*3;return shared.x*31+shared.y+localSum;}\n')
    (original/'main.cpp').write_text('''#include <cstdio>
extern "C" int step(int);extern "C" int get();
int main(){for(int n=-64;n<64;n++){int a=step(n);printf("%d %d\\n",a,get());}}
''')
    exe=root/'native.exe';run(['clang++',original/'one.cpp',original/'two.cpp',original/'main.cpp','-o',exe],root)
    expected=run([exe],root).splitlines()
    base=[sys.executable,ROOT/'tools/source_ast_to_js.py','--root',original,'--out-dir',out,
          '--header-dependency-closure','--require-record-layouts','--ast-cache-dir',root/'cache']
    run([*base,'--source','one.cpp'],ROOT)
    owner_path=out/'one.cpp.manifest.json';owner=json.loads(owner_path.read_text())
    # Partially instantiated class factories have separate method contracts.
    # This boundary deliberately imports the original storage and functions.
    module=out/'one.cpp.mjs';original_code=module.read_bytes()
    for row in owner['definitions']:
        row.get('global_storage',{}).pop('byte_record_native_layout',None)
    for row in owner['storage_exports']:row.pop('byte_record_native_layout',None)
    owner_path.write_bytes((json.dumps(owner,indent=2)+'\n').encode())
    try:upgrade(module,'0'*64,root/'history')
    except ValueError:pass
    else:raise AssertionError('Changed owner accepted')
    attestation=upgrade(module,hashlib.sha256(original_code).hexdigest(),root/'history')
    assert attestation['changed'] and not attestation['source_code_changed'] and attestation['source_definitions_recovered']==0
    assert module.read_bytes()==original_code
    owner=json.loads(owner_path.read_text())
    symbols={r['name']:'one.cpp' for r in owner['definitions'] if r['status']=='source-first' and r['kind'] in ('VarDecl','FunctionDecl')}
    index=root/'index.json';index.write_text(json.dumps(symbols))
    stage=root/'consumer'
    run([*base,'--source','two.cpp','--out-dir',stage,'--project-symbols',index,'--import-root',out],ROOT)
    consumer=json.loads((stage/'two.cpp.manifest.json').read_text())
    assert consumer['blocked']==0,consumer
    dependency=next(d for d in consumer['imports'] if d['name']=='shared')
    provider=next(r['global_storage'] for r in owner['definitions'] if r['name']=='shared')
    assert dependency['byte_record_schema_sha256']!=provider['byte_record_schema_sha256'],'Fixture must reproduce prototype-only ABI mismatch'
    assert compatible(dependency,provider),dependency
    units={'one.cpp':{'manifest':owner,'module':out/'one.cpp.mjs'}}
    assert storage_import_error(dependency,units) is None
    wrong=copy.deepcopy(dependency);wrong.pop('byte_record_data_access')
    assert storage_import_error(wrong,units),'Whole-object/method consumers must retain strict prototype contract'
    wrong=copy.deepcopy(dependency);wrong['byte_record_native_layout']['sha256']='0'*64
    assert storage_import_error(wrong,units),'Changed field storage must fail'
    wrong=copy.deepcopy(dependency);wrong['original_type']='Other<int>'
    assert storage_import_error(wrong,units),'Unrelated class identity must fail'
    wrong=copy.deepcopy(dependency);wrong['byte_record_data_access']['accesses'][0]['fields'][0]['id']=None
    assert storage_import_error(wrong,units),'Unproven Clang member must fail'
    for typ in ['Vec<int *>','int Owner::*','int *&','Vec<int *> &']:
        wrong=copy.deepcopy(dependency)
        wrong['byte_record_data_access']['accesses'][0]['result_type']=typ
        assert not compatible(wrong,provider),('Class, member-pointer or reference field accepted',typ)
    (original/'method.cpp').write_text('#include "types.hpp"\nextern "C" int method(){return shared.sum();}\n')
    rejected=subprocess.run(list(map(str,[*base,'--source','method.cpp','--out-dir',root/'method',
        '--project-symbols',index,'--import-root',out])),cwd=ROOT,capture_output=True,text=True,timeout=180)
    if rejected.returncode==0:
        methods=json.loads((root/'method/method.cpp.manifest.json').read_text())
        assert not any(r['name']=='method' and r['status']=='source-first' for r in methods['definitions']),methods
    else:assert 'identical Clang byte representation' in rejected.stderr,rejected.stderr
    script=root/'run.mjs';script.write_text('import {step} from '+json.dumps((stage/'two.cpp.mjs').as_uri())+';import {get} from '+json.dumps((out/'one.cpp.mjs').as_uri())+';for(let n=-64;n<64;n++){const a=step(n);console.log([a,get()].join(" "));}')
    assert run(['node',script],ROOT).splitlines()==expected
print('PASS 256 native/JS field operations across differently instantiated C++ TUs; reject changed layouts, class identities, method/whole-object contracts and missing Clang evidence')
