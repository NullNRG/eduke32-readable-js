"""Original out-of-line instance bodies retain one receiver across source units."""
import copy,json,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tools'))
from source_first_global_link import storage_import_error

def run(args,success=True):
    p=subprocess.run(list(map(str,args)),cwd=ROOT,capture_output=True,text=True,timeout=180)
    assert (p.returncode==0)==success,(args,p.stdout[-1800:],p.stderr[-3500:])
    return p.stdout+p.stderr

with tempfile.TemporaryDirectory(prefix='source-instance-',dir=ROOT/'work') as directory:
    root=Path(directory)
    (root/'counter.hpp').write_text('''struct Counter {
 void reset(int n); int add(int n,int bias=3); int add(unsigned n);
 int value() const; int *address();
 private: int total{};
}; extern Counter counter;
''')
    (root/'owner.cpp').write_text('''#include "counter.hpp"
Counter counter;
void Counter::reset(int n){total=n;}
int Counter::add(int n,int bias){total+=n+bias;return value();}
int Counter::add(unsigned n){total+=(int)n*7;return value();}
int Counter::value() const{return total;}
int *Counter::address(){return &total;}
''')
    (root/'consumer.cpp').write_text('''#include "counter.hpp"
extern "C" int exercise(int n){counter.reset(n);int *alias=counter.address();*alias+=5;
 int a=counter.add(n),b=counter.add((unsigned)(n&15));
 return a*31+b*7+*alias+counter.value();}
''')
    (root/'main.cpp').write_text('#include <cstdio>\nextern "C" int exercise(int);int main(){for(int n=-256;n<256;n++)printf("%d\\n",exercise(n));}\n')
    run(['clang++',root/'owner.cpp',root/'consumer.cpp',root/'main.cpp','-o',root/'native'])
    expected=run([root/'native']).splitlines()
    compiler=[sys.executable,ROOT/'tools/source_ast_to_js.py','--root',root,'--require-record-layouts','--header-dependency-closure']
    target=root/'target';run([*compiler,'--source','owner.cpp','--out-dir',target])
    provider=json.loads((target/'owner.cpp.manifest.json').read_text())
    methods=[r for r in provider['definitions'] if r.get('original_instance_member')]
    assert len(methods)==5 and all(r['status']=='source-first' for r in methods),methods
    symbols={r['name']:'owner.cpp' for r in provider['definitions'] if r['status']=='source-first'}
    path=root/'symbols.json';path.write_text(json.dumps(symbols))
    for label,flags in [('full',[]),('filtered',['--filter','exercise','--exact-filter','--dependency-closure'])]:
        out=root/label;run([*compiler,'--source','consumer.cpp','--out-dir',out,'--project-symbols',path,'--import-root',target,*flags])
        manifest=json.loads((out/'consumer.cpp.manifest.json').read_text())
        row=next(r for r in manifest['definitions'] if r['name']=='exercise')
        assert row['status']=='source-first',row
        imports=[r for r in manifest['imports'] if r.get('instance_method_contract')]
        assert len(imports)==5,imports
        for dep in imports:
            units={'owner.cpp':{'manifest':provider,'module':target/'owner.cpp.mjs'}}
            assert storage_import_error(dep,units) is None
            missing=copy.deepcopy(dep);missing.pop('instance_method_contract')
            assert storage_import_error(missing,units)
            bad=copy.deepcopy(dep);bad['instance_method_contract']['owner']='Different'
            assert storage_import_error(bad,units)
            bad=copy.deepcopy(dep);bad['instance_method_contract']['class_header_proof']['semantic_sha256']='0'*64
            assert storage_import_error(bad,units)
        runner=root/'run.mjs';runner.write_text('import {exercise} from '+json.dumps((out/'consumer.cpp.mjs').as_uri())+';for(let n=-256;n<256;n++)console.log(exercise(n));')
        assert run(['node',runner]).splitlines()==expected
    # A header declaration is never a substitute for an actual method body.
    empty=root/'empty';run([*compiler,'--source','consumer.cpp','--out-dir',empty])
    blocked=json.loads((empty/'consumer.cpp.manifest.json').read_text())
    row=next(r for r in blocked['definitions'] if r['name']=='exercise')
    assert row['status']=='blocked' and any('__cxx_instance_' in name for name in row.get('unresolved_references',[])),row
print('PASS: 1024 native/full/filtered results; original instance bodies, overloaded/default calls, private field pointer aliases and exact cross-unit class ABI; missing/changed providers rejected')
