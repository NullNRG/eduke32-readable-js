"""Same-TU recovery reuses attested header constants; stale input reuse fails."""
import json,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def run(args,success=True):
    task=subprocess.run(list(map(str,args)),cwd=ROOT,text=True,capture_output=True,timeout=180)
    assert (task.returncode==0)==success,(args,task.stdout[-1500:],task.stderr[-3000:]);return task.stdout+task.stderr
with tempfile.TemporaryDirectory(prefix='header-fragment-values-',dir=ROOT/'work') as folder:
    base=Path(folder);source=base/'original';source.mkdir();owner=base/'owner';fragment=base/'fragment'
    header=source/'values.hpp';header.write_text('typedef int HeaderValue; static const HeaderValue factor=7;\n')
    (source/'unit.cpp').write_text('''#include "values.hpp"
extern "C" int owner_read(){return factor;}
extern "C" int later(int n){return factor*n+factor;}
''')
    symbols=base/'symbols.json';symbols.write_text('{}')
    command=[sys.executable,ROOT/'tools/source_ast_to_js.py','--root',source,'--source','unit.cpp',
        '--exact-filter','--dependency-closure','--header-dependency-closure','--header-inlines','--ast-cache-dir',base/'cache']
    run([*command,'--filter','owner_read','--out-dir',owner])
    initial=json.loads((owner/'unit.cpp.manifest.json').read_text())
    values=[row for row in initial['definitions'] if row.get('header_global_definition')]
    assert len(values)==1 and values[0]['status']=='source-first',values
    name=values[0]['name']
    def compile_fragment():
        run([*command,'--filter','later','--out-dir',fragment,'--import-root',owner,'--project-symbols',symbols])
        return json.loads((fragment/'unit.cpp.manifest.json').read_text())
    document=compile_fragment()
    assert not any(row['kind']=='VarDecl' for row in document['definitions']),document['definitions']
    assert document['imports']==[{'name':name,'from':'unit.cpp','native_pointer_abi':'source-lp64-addresses/2'}],document['imports']
    unit=source/'unit.cpp'
    unit.write_text(unit.read_text().replace('factor*n+factor','factor*n+factor+n'))
    document=compile_fragment()
    assert document['ast_cache_inputs']!=initial['ast_cache_inputs']
    assert not any(row['kind']=='VarDecl' for row in document['definitions']),document['definitions']
    assert [row['name'] for row in document['header_storage_reattestations']]==[name],document
    assert document['header_storage_reattestations'][0]['abi']=='source-immutable-header-scalar-reattestation/1'
    install=[sys.executable,ROOT/'tools/install_verified_fragment.py','--manifest',fragment/'unit.cpp.manifest.json',
        '--target',owner,'--exports','later','--report',base/'install.json']
    run(install)
    (source/'main.cpp').write_text('#include <cstdio>\nextern "C" int later(int),owner_read();\nint main(){for(int n=0;n<256;n++)printf("%d,%d\\n",later(n),owner_read());}\n')
    oracle=base/'oracle.exe';run(['clang++',source/'unit.cpp',source/'main.cpp','-o',oracle])
    expected=run([oracle]).splitlines()
    runner=base/'run.mjs';runner.write_text('import {later,owner_read} from '+json.dumps((owner/'unit.cpp.mjs').as_uri())+';for(let n=0;n<256;n++)console.log(later(n)+","+owner_read());')
    assert run(['node',runner]).splitlines()==expected
    header.write_text('typedef int HeaderValue; static const HeaderValue factor=9;\n')
    stale=compile_fragment()
    assert any(row['name']==name and row['kind']=='VarDecl' for row in stale['definitions']),stale['definitions']
    assert not stale.get('header_storage_reattestations'),stale
    assert 'duplicates existing original storage' in run(install,success=False)
print('PASS 512 native/JS values: same-TU header constant survives primary-source edits; changed initializer prevents stale reuse and installation')

with tempfile.TemporaryDirectory(prefix='header-array-fragment-',dir=ROOT/'work') as folder:
    base=Path(folder);source=base/'original';source.mkdir();owner=base/'owner';fragment=base/'fragment'
    header=source/'values.hpp';header.write_text('static const unsigned char masks[4]={1,2,4,8};\n')
    unit=source/'unit.cpp'
    original='''#include "values.hpp"
extern "C" int first(int n){return masks[n&3];}
extern "C" const unsigned char* address(){return masks;}
extern "C" int later(int n){return masks[n&3]+first(n)+n;}
extern "C" int identity(){return address()==&masks[0];}
'''
    unit.write_text(original)
    command=[sys.executable,ROOT/'tools/source_ast_to_js.py','--root',source,'--source','unit.cpp',
        '--exact-filter','--dependency-closure','--header-dependency-closure','--header-inlines','--ast-cache-dir',base/'cache']
    run([*command,'--filter','first,address','--out-dir',owner])
    initial=json.loads((owner/'unit.cpp.manifest.json').read_text())
    arrays=[row for row in initial['definitions'] if row.get('private_storage',{}).get('scalar_array')]
    assert len(arrays)==1,initial['definitions']
    array_name=arrays[0]['name']
    symbols=base/'symbols.json';symbols.write_text(json.dumps({'first':'unit.cpp','address':'unit.cpp'}))
    unit.write_text(original.replace('+first(n)+n','+first(n)+n*2'))
    run([*command,'--filter','later,identity','--out-dir',fragment,'--import-root',owner,'--project-symbols',symbols])
    document=json.loads((fragment/'unit.cpp.manifest.json').read_text())
    assert document['ast_cache_inputs']!=initial['ast_cache_inputs']
    assert not any(row['kind']=='VarDecl' for row in document['definitions']),document['definitions']
    assert [row['name'] for row in document['header_storage_reattestations']]==[array_name],document
    install=[sys.executable,ROOT/'tools/install_verified_fragment.py','--manifest',fragment/'unit.cpp.manifest.json',
        '--target',owner,'--exports','later','identity','--report',base/'install.json']
    run(install)
    (source/'main.cpp').write_text('#include <cstdio>\nextern "C" int later(int),first(int),identity();\nint main(){for(int n=0;n<256;n++)printf("%d,%d,%d\\n",later(n),first(n),identity());}\n')
    native=base/'native.exe';run(['clang++',source/'unit.cpp',source/'main.cpp','-o',native])
    expected=run([native]).splitlines()
    runner=base/'run.mjs';runner.write_text('import {later,first,identity} from '+json.dumps((owner/'unit.cpp.mjs').as_uri())+';for(let n=0;n<256;n++)console.log([later(n),first(n),identity()].join(","));')
    assert run(['node',runner]).splitlines()==expected
    header.write_text('static const unsigned char masks[4]={2,3,5,9};\n')
    run([*command,'--filter','later,identity','--out-dir',fragment,'--import-root',owner,'--project-symbols',symbols])
    changed=json.loads((fragment/'unit.cpp.manifest.json').read_text())
    assert not changed.get('header_storage_reattestations'),changed
    assert any(row['name']==array_name and row['kind']=='VarDecl' for row in changed['definitions']),changed
    assert 'duplicates existing original storage' in run(install,success=False)
print('PASS 768 native/JS values after primary-source edits, original header-array pointer identity preserved, changed initializers rejected')
