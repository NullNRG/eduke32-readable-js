"""A source-proven template factory supplies identical required leaf methods."""
import copy,json,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tools'))
from source_header_records import compatible_factory_proof
from source_first_global_link import storage_import_error

def run(args,cwd):
    p=subprocess.run(list(map(str,args)),cwd=cwd,capture_output=True,text=True,timeout=180)
    assert p.returncode==0,(p.stdout[-1500:],p.stderr[-2200:])
    return p.stdout
with tempfile.TemporaryDirectory() as folder:
    root=Path(folder);out=root/'owner';stage=root/'consumer'
    (root/'vec.hpp').write_text('''template<class T>struct Vec{T x,y;
 const Vec<T>operator+(Vec<T>b)const{return {T(x+b.x),T(y+b.y)};}
 const Vec<T>operator-(Vec<T>b)const{return {T(x-b.x),T(y-b.y)};}
 const Vec<T>operator*(Vec<T>b)const{return {T(x*b.x),T(y*b.y)};}
};
''')
    (root/'one.cpp').write_text('#include "vec.hpp"\nextern "C" int first(int n){Vec<int>a{n,n+3},b{7,9};auto c=(a+b)*(a-b);Vec<int>samples[2];samples[0]=c;if(n&1)goto ready;c.x+=2;ready:return c.x+c.y+samples[0].x;}\n')
    (root/'two.cpp').write_text('#include "vec.hpp"\nextern "C" int second(int n){Vec<int>a; a.x=n;a.y=n+3;Vec<int>b{7,9};auto c=a-b;return c.x+c.y;}\n')
    (root/'main.cpp').write_text('#include <cstdio>\nextern "C" int first(int),second(int);int main(){for(int n=-256;n<256;n++)printf("%d %d\\n",first(n),second(n));}\n')
    exe=root/'native.exe';run(['clang++',root/'one.cpp',root/'two.cpp',root/'main.cpp','-o',exe],root)
    expected=run([exe],root).splitlines()
    base=[sys.executable,ROOT/'tools/source_ast_to_js.py','--root',root,'--header-dependency-closure','--dependency-closure','--require-record-layouts']
    run([*base,'--source','one.cpp','--out-dir',out],ROOT)
    owner=json.loads((out/'one.cpp.manifest.json').read_text())
    assert owner['blocked']==0,owner['definitions']
    index=root/'symbols.json';index.write_text(json.dumps({r['name']:'one.cpp' for r in owner['definitions'] if r['status']=='source-first'}))
    run([*base,'--source','two.cpp','--out-dir',stage,'--project-symbols',index,'--import-root',out],ROOT)
    consumer=json.loads((stage/'two.cpp.manifest.json').read_text());assert consumer['blocked']==0,consumer
    dep=next(r for r in consumer['imports'] if r.get('header_record_proof'))
    row=next(r for r in owner['definitions'] if r['name']==dep['name'])
    wanted=dep['header_record_proof'];offered=row['odr_inline']
    assert wanted!=offered and len(wanted['leaf_prototype']['method_bodies'])==1 and len(offered['leaf_prototype']['method_bodies'])==3
    assert compatible_factory_proof(wanted,offered) and not compatible_factory_proof(offered,wanted)
    units={'one.cpp':{'manifest':owner,'module':out/'one.cpp.mjs'}}
    assert storage_import_error(dep,units) is None
    for change in ('body','layout','header','type','format'):
        wrong=copy.deepcopy(dep);p=wrong['header_record_proof']
        if change=='body':p['leaf_prototype']['method_bodies'][next(iter(p['leaf_prototype']['method_bodies']))]='0'*64
        elif change=='layout':p['leaf_prototype']['storage_and_declarations_sha256']='0'*64
        elif change=='header':p['source_header']='different.hpp'
        elif change=='type':p['type']='Vec<double>'
        else:p['leaf_prototype']['format']='unverified'
        assert storage_import_error(wrong,units),change
    # Braced aggregate initialization also installs and calls this prototype.
    # Its method proof must be checked even without CXXConstructExpr.
    (root/'aggregate.cpp').write_text('#include "vec.hpp"\nextern "C" int aggregate(int n){Vec<int>a{n,n+3},b{7,9};auto c=a-b;return c.x+c.y;}\n')
    run([*base,'--source','aggregate.cpp','--out-dir',stage,'--project-symbols',index,'--import-root',out],ROOT)
    aggregate=json.loads((stage/'aggregate.cpp.manifest.json').read_text())
    assert aggregate['blocked']==0 and any(r.get('header_record_proof') for r in aggregate['imports']),aggregate
    script=root/'run.mjs';script.write_text('import {first} from '+json.dumps((out/'one.cpp.mjs').as_uri())+';import {second} from '+json.dumps((stage/'two.cpp.mjs').as_uri())+';for(let n=-256;n<256;n++)console.log([first(n),second(n)].join(" "));')
    assert run(['node',script],ROOT).splitlines()==expected
print('PASS 1024 native/JS values through template method-superset imports; missing/changed methods, native storage, headers, types and unverified proofs rejected')
