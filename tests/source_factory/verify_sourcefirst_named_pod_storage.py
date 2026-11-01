"""Named trivial construction and local addresses use actual native storage."""
import json,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def run(args,cwd):
    p=subprocess.run(list(map(str,args)),cwd=cwd,text=True,capture_output=True,timeout=180)
    assert p.returncode==0,(args,p.stdout[-1800:],p.stderr[-3000:]);return p.stdout
with tempfile.TemporaryDirectory(prefix='named-pod-storage-',dir=ROOT/'work') as temporary:
    root=Path(temporary)
    (root/'state.hpp').write_text('typedef struct State{unsigned value;unsigned short samples[3];unsigned char tag;}State;\nstruct Metadata{unsigned value;};\n')
    (root/'unit.cpp').write_text('''#include "state.hpp"
extern "C" void*memset(void*,int,unsigned long);
extern "C" int Metadata(int n){return n*3;}
extern "C" int exercise(int n){
 struct Metadata metadata;memset(&metadata,0,sizeof(metadata));metadata.value=n*5;
 State value;memset(&value,0,sizeof(value));State *identity=&value;
 value.value=n*17;value.samples[0]=n*3;value.samples[1]=n+7;value.samples[2]=n*5;value.tag=n;
 State other={};other=value;other.value+=23;other.samples[1]+=19;
 value=other;value.samples[2]++;
 unsigned char bytes[8];memset(&bytes,n+1,sizeof(bytes));
 unsigned char *pointer=bytes;unsigned char **slot=&pointer;*slot=bytes+3;
 return (int)value.value+identity->samples[1]+identity->samples[2]+value.tag+*pointer+(identity==&value?10000:0)+metadata.value+Metadata(n);
}
''')
    (root/'main.cpp').write_text('#include <cstdio>\nextern "C" int exercise(int);\nint main(){for(int n=0;n<256;n++)printf("%d\\n",exercise(n));}')
    exe=root/'oracle.exe';run(['clang++','-std=c++14',root/'unit.cpp',root/'main.cpp','-o',exe],root)
    expected=run([exe],root).splitlines()
    services=root/'services';services.mkdir()
    (services/'libc.mjs').write_text('import {NativeRuntime} from '+json.dumps((ROOT/'runtime/index.mjs').as_uri())+''';
const runtime=new NativeRuntime();runtime.bindSourceMemory();
export const memset=runtime.library.symbols.memset;export const close=()=>runtime.close();
''')
    (services/'libc.manifest.json').write_text(json.dumps({'native_pointer_abi':'source-lp64-addresses/2'}))
    symbols=root/'symbols.json';symbols.write_text(json.dumps({'memset':'libc'}))
    (root/'unit.c').write_text((root/'unit.cpp').read_text().replace('extern "C" ',''))
    run(['clang','-std=c11','-c',root/'unit.c','-o',root/'c-unit.o'],root)
    run(['clang++',root/'main.cpp',root/'c-unit.o','-o',root/'c-oracle.exe'],root)
    assert run([root/'c-oracle.exe'],root).splitlines()==expected
    for language,filtered in ((language,filtered) for language in ('cpp','c') for filtered in (False,True)):
        out=root/(language+('-filtered' if filtered else '-full'))
        args=[sys.executable,ROOT/'tools/source_ast_to_js.py','--root',root,'--source','unit.'+language,
            '--out-dir',out,'--require-record-layouts','--project-symbols',symbols,'--import-root',services]
        if filtered:args+=['--filter','exercise','--exact-filter','--dependency-closure','--header-dependency-closure','--header-inlines']
        run(args,root);module=out/('unit.'+language+'.mjs');manifest=json.loads(module.with_suffix('.manifest.json').read_text())
        row=next(row for row in manifest['definitions'] if row['source_name']=='exercise')
        assert row['status']=='source-first',row
        if language=='cpp':assert row.get('storage_constructor_count',0)>=1,row
        assert 'State' not in row.get('external_imports',[]),row
        driver=root/'run.mjs';driver.write_text('import {exercise} from '+json.dumps(module.as_uri())+';import {close} from '+json.dumps((services/'libc.mjs').as_uri())+';\ntry{for(let n=0;n<256;n++)console.log(exercise(n));}finally{close();}')
        observed=run(['node',driver],root).splitlines()
        assert observed==expected,next(((i,a,b) for i,(a,b) in enumerate(zip(observed,expected)) if a!=b),None)
print('PASS 1024 native C/C++/JS cases: named trivial header record storage, real host memset of local records/arrays, in-place assignment aliases, retained pointer-variable address')
