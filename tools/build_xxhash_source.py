"""Build the original scalar xxHash header with the canonical source compiler."""
import hashlib,json,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
HEADER='source/build/include/xxhash.h'
def digest(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def build():
    source=ROOT/'factory-output/source-tree/eduke32-master'
    output=ROOT/'factory-output/source-first/xxhash-browser-library'
    # The captured Make build also compiles xxhash.c as GNU C++14. Scalar
    # selection is the original library's documented CPU-independent path.
    flags=['clang++','-std=gnu++14','-funsigned-char','-DXXH_IMPLEMENTATION=1',
           '-DXXH_STATIC_LINKING_ONLY=1','-DXXH_VECTOR=0','-DXXH_NO_PREFETCH=1',
           '-DXXH_NO_STREAM=1','-DNDEBUG',HEADER]
    with tempfile.TemporaryDirectory(prefix='original-xxhash-config-') as temp:
        commands=Path(temp)/'commands.json'
        commands.write_text(json.dumps([{'file':HEADER,'arguments':flags}]))
        subprocess.run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(source),
            '--source',HEADER,'--compile-commands',str(commands),'--filter',
            'XXH3_64bits,XXH3_accumulate_scalar,XXH128_hash_t','--out-dir',str(output),
            '--dependency-closure','--header-dependency-closure','--enum-closure'],cwd=ROOT,check=True)
    module=output/(HEADER+'.mjs');manifest=output/(HEADER+'.manifest.json')
    doc=json.loads(manifest.read_text());rows=doc['definitions']
    names={r['name'] for r in rows if r['status']=='source-first'}
    failed=[r for r in rows if r['status']=='blocked' and r['kind'] in ('FunctionDecl','VarDecl')]
    if 'XXH3_64bits' not in names or failed or doc['imports']:
        raise RuntimeError('Original xxHash callable/storage closure is incomplete: '+repr(failed))
    subprocess.run(['node','--check',str(module)],check=True)
    destination=ROOT/'runtime/xxhash_source.mjs'
    destination.write_bytes(module.read_bytes())
    destination.with_suffix('.manifest.json').write_bytes(manifest.read_bytes())
    provenance={'format':'original-header-js-provider/1','source_header':HEADER,
        'source_header_sha256':digest(source/HEADER),'module_sha256':digest(destination),
        'compiler_frontend_sha256':digest(ROOT/'tools/source_ast_to_js.py'),
        'compiler_inputs':{p:digest(ROOT/p) for p in ('tools/source_ast_stream.py','tools/source_empty_asm.py',
            'tools/source_pointer_runtime.mjs','tools/source_scalar_types.py')},
        'exports':['XXH3_64bits'],'all_emitted_definitions':sorted(names),
        'excluded_declarations':[r for r in rows if r['status']=='blocked'],
        'original_library_configuration':flags,'native_parity_required':True,'gameplay_verified':False}
    destination.with_suffix('.provenance.json').write_text(json.dumps(provenance,indent=2)+'\n')
    return provenance
if __name__=='__main__':print(json.dumps(build(),indent=2))
