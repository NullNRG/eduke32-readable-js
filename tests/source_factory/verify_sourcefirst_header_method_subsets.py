"""Link one proven template prototype when a real TU supplies all leaf methods."""
import json,subprocess,sys,tempfile
from copy import deepcopy
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tools'))
from source_first_global_link import canonical_header_inline_owner
def run(args,cwd,expected=0):
    result=subprocess.run(list(map(str,args)),cwd=cwd,capture_output=True,text=True,timeout=180)
    assert result.returncode==expected,(result.returncode,result.stdout[-2000:],result.stderr[-4000:])
    return result.stdout
with tempfile.TemporaryDirectory(prefix='header-method-subsets-') as directory:
    root=Path(directory)
    (root/'header.hpp').write_text('''template<class T> struct Vec {
T x,y;
const Vec<T> operator+(const Vec<T> rhs) const {return {(T)(x+rhs.x),(T)(y+rhs.y)};}
const Vec<T> operator-(const Vec<T> rhs) const {return {(T)(x-rhs.x),(T)(y-rhs.y)};}
const Vec<T> operator*(const Vec<T> rhs) const {return {(T)(x*rhs.x),(T)(y*rhs.y)};}
};
''')
    (root/'one.cpp').write_text('#include "header.hpp"\nint one(int x){Vec<int>a{x,4},b{3,5};auto r=a-b;return r.x+r.y;}\nVec<int> make_one(int x){return {x,4};}\n')
    (root/'two.cpp').write_text('#include "header.hpp"\nint two(int x){Vec<int>a{x,4},b{2,3};auto p=a+b,m=a-b,n=a*b;return p.x+p.y+m.x+m.y+n.x+n.y;}\nVec<int> make_two(int x){return {x,9};}\nVec<int> add(Vec<int>a,Vec<int>b){return a+b;}\n')
    (root/'main.cpp').write_text('#include <cstdio>\nint one(int),two(int);int main(){for(int i=-128;i<128;i++)printf("%d,%d\\n",one(i),two(i));}\n')
    exe=root/'native.exe';run(['clang++','-std=c++14','one.cpp','two.cpp','main.cpp','-o',exe],root)
    expected=run([exe],root).splitlines()
    plan=root/'plan.json';plan.write_text(json.dumps({'root':str(root),'units':[
        {'source':name+'.cpp','header_dependency_closure':True,'dependency_closure':True} for name in ('one','two')]}))
    output=root/'out'
    output.mkdir();(output/'ambiguous-symbols.json').write_text('{"obsolete-conflict":[]}')
    run([sys.executable,ROOT/'tools/source_first_project.py','--plan',plan,'--out-dir',output,'--strict'],root)
    summary=json.loads((output/'project-build.json').read_text())
    assert not (output/'ambiguous-symbols.json').exists()
    assert not summary['invalid_imports'] and summary['source_definitions_blocked']==0,summary
    factories={key:value for key,value in summary['canonical_header_odr_owners'].items() if key.startswith('__cxx_record_Vec_')}
    assert len(factories)==1 and list(factories.values())==['two.cpp'],summary
    driver=root/'run.mjs';driver.write_text('import * as a from '+json.dumps((output/'one.cpp.mjs').as_uri())+';\n'
        +'import * as b from '+json.dumps((output/'two.cpp.mjs').as_uri())+';\n'
        +'if(Object.getPrototypeOf(a.make_one(3))!==Object.getPrototypeOf(b.make_two(4)))throw Error("split prototype identity");\n'
        +'const sum=b.add(a.make_one(11),b.make_two(17));if(sum.x!==28||sum.y!==13)throw Error("cross-unit method missing");\n'
        +'for(let i=-128;i<128;i++)console.log(`${a.one(i)},${b.two(i)}`);\n')
    assert run(['node',driver],root).splitlines()==expected
    name=next(iter(factories));units={}
    # Inspect the actual Clang proofs from standalone probes, before ownership
    # imports remove the non-owning factory from one.cpp's final manifest.
    probes=root/'probes'
    for source in ('one.cpp','two.cpp'):
        run([sys.executable,ROOT/'tools/source_ast_to_js.py','--root',root,'--source',source,
             '--out-dir',probes,'--header-dependency-closure'],root)
        document=json.loads((probes/(source+'.manifest.json')).read_text())
        units[source]={'manifest':document,'module':probes/(source+'.mjs')}
    assert canonical_header_inline_owner(units,name,list(units))=='two.cpp'
    row=lambda doc:next(item for item in doc['manifest']['definitions'] if item['name']==name)
    one=row(units['one.cpp'])['odr_inline'];two=row(units['two.cpp'])['odr_inline']
    assert one['semantic_sha256']!=two['semantic_sha256']
    assert one['leaf_prototype']['storage_and_declarations_sha256']==two['leaf_prototype']['storage_and_declarations_sha256']
    for field in ('source_header','type','source_offset'):
        bad=deepcopy(units);row(bad['two.cpp'])['odr_inline'][field]='conflict'
        assert canonical_header_inline_owner(bad,name,list(bad)) is None,field
    for mutation in ('state','body','no_superset','missing_proof','blocked'):
        bad=deepcopy(units);record=row(bad['two.cpp']);leaf=record['odr_inline']['leaf_prototype']
        if mutation=='state':leaf['storage_and_declarations_sha256']='conflicting-layout'
        elif mutation=='body':leaf['method_bodies'][next(iter(one['leaf_prototype']['method_bodies']))]='f'*64
        elif mutation=='no_superset':
            common=next(iter(one['leaf_prototype']['method_bodies']));leaf['method_bodies'].pop(common)
        elif mutation=='missing_proof':record['odr_inline'].pop('leaf_prototype')
        else:record.update(status='blocked',reason='unlinked identifiers: missing')
        assert canonical_header_inline_owner(bad,name,list(bad)) is None,mutation
    # The same header bytes can be included under a different surrounding
    # packing configuration. Exact Clang ABI layouts must prevent coalescing.
    unit=root/'two.cpp';original_unit=unit.read_text()
    unit.write_text('#pragma pack(push,1)\n'+original_unit+'\n#pragma pack(pop)\n')
    run([sys.executable,ROOT/'tools/source_ast_to_js.py','--root',root,'--source','two.cpp',
         '--out-dir',root/'packed','--header-dependency-closure'],root)
    packed={'manifest':json.loads((root/'packed/two.cpp.manifest.json').read_text()),'module':root/'packed/two.cpp.mjs'}
    assert canonical_header_inline_owner({'one.cpp':units['one.cpp'],'two.cpp':packed},name,['one.cpp','two.cpp']) is None
    unit.write_text(original_unit)
    # A body that observes external mutable state is ineligible for this
    # relaxation, even when another TU never instantiates that method.
    header=root/'header.hpp'
    header.write_text('extern int external_state;\n'+header.read_text().replace('(T)(x+rhs.x)','(T)(x+rhs.x+external_state)'))
    run([sys.executable,ROOT/'tools/source_ast_to_js.py','--root',root,'--source','two.cpp',
         '--out-dir',root/'stateful','--header-dependency-closure'],root)
    stateful=json.loads((root/'stateful/two.cpp.manifest.json').read_text())
    record=next(item for item in stateful['definitions'] if item['name']==name)
    assert 'leaf_prototype' not in record['odr_inline'],record
print('PASS 512 native values, shared cross-unit prototype/methods, and conflicting/partial/unproven owners rejected')
