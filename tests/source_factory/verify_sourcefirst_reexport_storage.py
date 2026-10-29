"""Source-owned pointer arrays remain linkable through immutable source shards."""
import json,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tools'))
from source_first_global_link import exported_names,storage_import_error
def run(args):
    p=subprocess.run(args,cwd=ROOT,capture_output=True,text=True,timeout=120)
    assert p.returncode==0,(p.stdout[-1000:],p.stderr[-2000:]);return p.stdout
with tempfile.TemporaryDirectory(prefix='source-reexport-storage-') as directory:
    root=Path(directory);(root/'unit.cpp').write_text('int seed=7; int *slots[4]={&seed}; int slots_read(){return *slots[0];}\n')
    run([sys.executable,'tools/source_ast_to_js.py','--root',str(root),'--source','unit.cpp','--out-dir',str(root/'out')])
    module=root/'out/unit.cpp.mjs';manifest=json.loads(module.with_suffix('.manifest.json').read_text())
    row=next(r for r in manifest['definitions'] if r['name']=='slots')
    assert row['status']=='source-first' and row['object_storage']['abi']=='source-pointer-array/1',row
    shard=module.with_name('_source_legacy_verified_storage.mjs');module.rename(shard)
    names=exported_names(shard);facade='export { '+', '.join(sorted(names))+' } from "./'+shard.name+'";\n'
    module.write_text(facade)
    dependency={**row['object_storage'],'name':'slots','from':'unit.cpp','native_pointer_abi':manifest['native_pointer_abi']}
    units={'unit.cpp':{'module':module,'manifest':manifest}}
    assert storage_import_error(dependency,units) is None
    assert exported_names(module)==names
    (root/'check.mjs').write_text('import * as facade from '+json.dumps(module.as_uri())+';import * as original from '+json.dumps(shard.as_uri())+';if(facade.slots!==original.slots||facade.slots_read()!==7)throw Error("storage identity or source behavior");')
    run(['node',str(root/'check.mjs')])
    module.write_text(facade.replace(shard.name,'_source_legacy_missing.mjs'))
    assert storage_import_error(dependency,units)=='pointer array absent from actual provider JavaScript'
    module.write_text(facade.replace('slots,','invented_slots,'))
    assert 'slots' not in exported_names(module)
    # An otherwise matching path through a parent directory is never followed.
    module.write_text('export { slots } from "./_source_legacy_/../../outside.mjs";\n')
    assert 'slots' not in exported_names(module)
print('Verified original pointer-array ABI and identity through source reexports; missing, invented and escaping targets rejected.')
