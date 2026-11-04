"""Included .cpp storage/helpers belong to each real including translation unit."""
import json,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def run(args,cwd):
    p=subprocess.run(list(map(str,args)),cwd=cwd,capture_output=True,text=True,timeout=120)
    assert p.returncode==0,(p.stdout[-1200:],p.stderr[-2400:])
    return p.stdout
with tempfile.TemporaryDirectory() as folder:
    root=Path(folder);source=root/'original';source.mkdir()
    implementation='''static unsigned char translation[256];
static void rebuild(int seed){for(int n=0;n<256;n++)translation[n]=(seed*13+n*7)&255;}
'''
    (source/'included.cpp').write_text(implementation)
    (source/'decoy.cpp').write_text(implementation)
    (source/'one.cpp').write_text('#include "included.cpp"\nextern "C" int original(int n){rebuild(n);return translation[n];}\n')
    (source/'two.cpp').write_text('#include "included.cpp"\nextern "C" int other(int n){return translation[n];}\nextern "C" int other_write(int n){rebuild(n+1);return translation[n];}\n')
    (source/'main.cpp').write_text('''#include <cstdio>
extern "C" int original(int);extern "C" int other(int);extern "C" int other_write(int);
int main(){for(int n=0;n<256;n++){int a=original(n),b=other(n),c=other_write(n);printf("%d %d %d\\n",a,b,c);}}
''')
    exe=root/'native.exe'
    run(['clang++',source/'one.cpp',source/'two.cpp',source/'main.cpp','-o',exe],root)
    expected=run([exe],root).splitlines()
    plan=root/'plan.json'
    plan.write_text(json.dumps({'root':str(source),'units':[
        {'source':name+'.cpp','header_dependency_closure':True} for name in ('one','two')]}))
    out=root/'out'
    run([sys.executable,ROOT/'tools/source_first_project.py','--plan',plan,'--out-dir',out,'--strict'],ROOT)
    for name in ('one','two'):
        doc=json.loads((out/(name+'.cpp.manifest.json')).read_text())
        storage=next(r for r in doc['definitions'] if r.get('source_name')=='translation')
        proof=storage['header_global_definition']
        assert storage['status']=='source-first' and storage['linkage']=='internal',storage
        assert proof['source_header']=='included.cpp' and proof['translation_unit']==name+'.cpp',proof
        assert proof['source_kind']=='included-implementation',proof
    script=root/'run.mjs'
    script.write_text('import {original} from '+json.dumps((out/'one.cpp.mjs').as_uri())+';import {other,other_write} from '+json.dumps((out/'two.cpp.mjs').as_uri())+';for(let n=0;n<256;n++){const a=original(n),b=other(n),c=other_write(n);console.log([a,b,c].join(" "));}')
    assert run(['node',script],ROOT).splitlines()==expected
print('PASS 768 native/JS included-implementation values, per-TU storage, static helper closure and unobserved decoy rejection')
