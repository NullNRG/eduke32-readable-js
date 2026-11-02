"""Same-TU recovery reuses attested header constants; stale input reuse fails."""
import json,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def run(args,success=True):
    task=subprocess.run(list(map(str,args)),cwd=ROOT,text=True,capture_output=True,timeout=180)
    assert (task.returncode==0)==success,(args,task.stdout[-1500:],task.stderr[-3000:]);return task.stdout+task.stderr
with tempfile.TemporaryDirectory(prefix='header-fragment-values-',dir=ROOT/'work') as folder:
    base=Path(folder);source=base/'original';source.mkdir();owner=base/'owner';fragment=base/'fragment'
    header=source/'values.hpp';header.write_text('static const int factor=7;\n')
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
    install=[sys.executable,ROOT/'tools/install_verified_fragment.py','--manifest',fragment/'unit.cpp.manifest.json',
        '--target',owner,'--exports','later','--report',base/'install.json']
    run(install)
    (source/'main.cpp').write_text('#include <cstdio>\nextern "C" int later(int),owner_read();\nint main(){for(int n=0;n<256;n++)printf("%d,%d\\n",later(n),owner_read());}\n')
    oracle=base/'oracle.exe';run(['clang++',source/'unit.cpp',source/'main.cpp','-o',oracle])
    expected=run([oracle]).splitlines()
    runner=base/'run.mjs';runner.write_text('import {later,owner_read} from '+json.dumps((owner/'unit.cpp.mjs').as_uri())+';for(let n=0;n<256;n++)console.log(later(n)+","+owner_read());')
    assert run(['node',runner]).splitlines()==expected
    header.write_text('static const int factor=9;\n')
    stale=compile_fragment()
    assert any(row['name']==name and row['kind']=='VarDecl' for row in stale['definitions']),stale['definitions']
    assert 'duplicates existing original storage' in run(install,success=False)
print('PASS 512 native/JS values: same-TU header constant imported from its existing owner; changed original header prevents stale reuse and installation')
