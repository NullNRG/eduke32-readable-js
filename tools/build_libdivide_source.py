"""Compile the original scalar libdivide operations with the canonical compiler.

The C-compatible header definitions use the same algorithms and record fields
as their C++ namespace wrappers. No hand-written division replacement is used.
"""
import hashlib,json,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
HEADER='source/build/include/libdivide.h'
EXPORTS=tuple('libdivide_'+kind+mode for kind in ('u32','s32','u64','s64')
              for mode in ('_do','_branchfree_do'))
def digest(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def build(destination):
    destination=Path(destination);destination.parent.mkdir(parents=True,exist_ok=True)
    source=ROOT/'factory-output/source-tree/eduke32-master'
    with tempfile.TemporaryDirectory(prefix='libdivide-source-') as directory:
        output=Path(directory)
        command=[sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(source),
            '--source',HEADER,'--filter',','.join(EXPORTS),'--out-dir',str(output),
            '--dependency-closure','--header-dependency-closure','--enum-closure']
        result=subprocess.run(command,cwd=ROOT,capture_output=True,text=True,timeout=120)
        if result.returncode:raise RuntimeError(result.stdout+'\n'+result.stderr)
        module=output/(HEADER+'.mjs');manifest=output/(HEADER+'.manifest.json')
        document=json.loads(manifest.read_text())
        exports={row['name'] for row in document['definitions'] if row['status']=='source-first'}
        if document['blocked'] or document['imports'] or not set(EXPORTS)<=exports:
            raise RuntimeError('Original libdivide operation closure is incomplete')
        subprocess.run(['node','--check',str(module)],check=True,capture_output=True,text=True)
        destination.write_bytes(module.read_bytes())
        destination.with_suffix('.manifest.json').write_bytes(manifest.read_bytes())
    provenance={'format':'original-header-js-provider/1','source_header':HEADER,
        'source_header_sha256':digest(source/HEADER),'module_sha256':digest(destination),
        'compiler_frontend_sha256':digest(ROOT/'tools/source_ast_to_js.py'),
        'source_scalar_types_sha256':digest(ROOT/'tools/source_scalar_types.py'),
        'exports':list(EXPORTS),'all_original_dependency_definitions':sorted(exports),
        'source_mode':'Original C-compatible header definitions; C++ namespace is compile-time only',
        'native_parity_required':True,'gameplay_verified':False}
    destination.with_suffix('.provenance.json').write_text(json.dumps(provenance,indent=2)+'\n')
    return provenance
if __name__=='__main__':
    print(json.dumps(build(ROOT/'runtime/libdivide_division_source.mjs'),indent=2))
