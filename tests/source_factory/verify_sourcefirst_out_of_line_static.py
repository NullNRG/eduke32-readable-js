"""Out-of-line static method identities link across units without class stubs."""
import copy,json
import os
from pathlib import Path
import subprocess
import sys
import tempfile

ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'tools'))
from source_static_members import rebind_static_references

# Mismatching or ambiguous callsites may never become static method providers.
method={'kind':'CXXMethodDecl','id':'full-method','name':'run','storageClass':'static',
        'mangledName':'_ZN4Left3runEi','type':{'qualType':'int (int)'}}
reference={'kind':'DeclRefExpr','type':{'qualType':'int (int)'},
    'referencedDecl':{k:method[k] for k in ('kind','id','name','type')},
    'range':{'begin':{'offset':20,'tokLen':4},'end':{'offset':26,'tokLen':3}}}
owner={'kind':'FunctionDecl','name':'api','mangledName':'_Z3apii','loc':{'offset':3},
       'type':{'qualType':'int (int)'},'inner':[{'kind':'CompoundStmt','inner':[reference]}]}
complete=[{'kind':'CXXRecordDecl','name':'Left','completeDefinition':True,'inner':[method]},owner]
filtered=[copy.deepcopy(owner)];filtered[0]['inner'][0]['inner'][0]['referencedDecl']['id']='filtered-method'
assert rebind_static_references(copy.deepcopy(filtered),complete)==1
for variant in ('nonstatic','type','owner','duplicate'):
    changed=copy.deepcopy(complete)
    if variant=='nonstatic':changed[0]['inner'][0].pop('storageClass')
    elif variant=='type':changed[1]['inner'][0]['inner'][0]['type']['qualType']='void ()'
    elif variant=='owner':changed[1]['loc']['offset']+=1
    else:changed.append(copy.deepcopy(changed[1]))
    unresolved=copy.deepcopy(filtered)
    assert rebind_static_references(unresolved,changed)==0,variant
    assert unresolved==filtered,variant


def run(args,cwd):
    result=subprocess.run(args,cwd=cwd,capture_output=True,text=True,timeout=100)
    assert result.returncode==0,(args,result.stdout[-2000:],result.stderr[-3500:])
    return result.stdout.strip()


with tempfile.TemporaryDirectory(prefix='source-static-members-') as temporary:
    root=Path(temporary)
    (root/'methods.hpp').write_text('''#pragma once
namespace left {struct Math {
 static const int scale=3;
 static int f(int); static int f(int,int);static int use(int);
 static unsigned long long address(void*);
};}
namespace right {struct Math {static int f(int);};}
''')
    (root/'provider.cpp').write_text('''#include "methods.hpp"
int left::Math::f(int x){return x*scale+7;}
int left::Math::f(int x,int y){return x-y*2;}
int left::Math::use(int n){auto callback=(int(*)(int))&f;return callback(n)+f(n,5);}
unsigned long long left::Math::address(void*p){return (unsigned long long)p;}
int right::Math::f(int n){return n^77;}
''')
    (root/'caller.cpp').write_text('''#include "methods.hpp"
int api_static(int n){return left::Math::use(n)+right::Math::f(n);}
''')
    (root/'driver.cpp').write_text('''#include <cstdio>
int api_static(int);
int main(){for(int n=-512;n<512;n++)printf("%d\\n",api_static(n));}
''')
    executable=root/('native.exe' if os.name=='nt' else 'native')
    run(['clang++','-std=c++14','provider.cpp','caller.cpp','driver.cpp','-o',str(executable)],root)
    expected=run([str(executable)],root).splitlines()
    out=root/'out'
    def emit(name,index=None,filters=None):
        command=[sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(root),
                 '--source',name,'--out-dir',str(out)]
        if index:command+=['--project-symbols',str(index)]
        if filters:command+=['--filter',filters,'--dependency-closure','--header-dependency-closure']
        run(command,ROOT)
        return json.loads((out/(name+'.manifest.json')).read_text())
    provider=emit('provider.cpp')
    methods=[row for row in provider['definitions'] if row.get('original_static_member')]
    assert len(methods)==5,methods
    for row in methods:
        assert row['original_static_member']['mangled_name'].startswith('_Z')
        assert row['physical_source']=='provider.cpp',row
        assert row['status']=='source-first',row
    assert len({row['name'] for row in methods if row['source_name']=='f'})==3
    assert any(row.get('non_odr_static_constants') for row in methods)
    caller=emit('caller.cpp')
    row=next(row for row in caller['definitions'] if row['name']=='api_static')
    assert row['status']=='blocked' and 'unlinked identifiers:' in row['reason'],row
    assert all('__cxx_static_' in name for name in row['unresolved_references']),row
    index=root/'symbols.json'
    index.write_text(json.dumps({row['name']:'provider.cpp' for row in methods if row['status']=='source-first'}))
    caller=emit('caller.cpp',index)
    row=next(row for row in caller['definitions'] if row['name']=='api_static')
    assert row['status']=='source-first',row
    assert len(caller['imports'])==2,caller['imports']
    runner=root/'run.mjs'
    runner.write_text('import {api_static} from '+json.dumps((out/'caller.cpp.mjs').as_uri())+';\n'
                     'for(let n=-512;n<512;n++)console.log(api_static(n));\n')
    assert run(['node',str(runner)],root).splitlines()==expected
    # Filtered dumps omit the classes and cannot share declaration IDs with a
    # second Clang parse. Exact same-source callsites must recover their owners.
    filtered=emit('caller.cpp',filters='api_static')
    row=next(r for r in filtered['definitions'] if r['name']=='api_static')
    assert row['status']=='blocked' and row['reason'].startswith('unlinked identifiers:'),row
    assert all('__cxx_static_' in name for name in row['unresolved_references']),row
    filtered=emit('caller.cpp',index,filters='api_static')
    row=next(r for r in filtered['definitions'] if r['name']=='api_static')
    assert row['status']=='source-first',row
    assert filtered['full_type_closure']['static_member_references_rebound']>=2,filtered['full_type_closure']
    assert run(['node',str(runner)],root).splitlines()==expected
    (root/'address.cpp').write_text('#include "methods.hpp"\nconst int*constant_address(){return &left::Math::scale;}\n')
    address=emit('address.cpp')
    row=next(r for r in address['definitions'] if r['name']=='constant_address')
    assert row['status']=='blocked' and 'scale' in row['reason'],row
print('PASS 2048 native/JavaScript values: full and filtered static calls, exact namespace/overload identities, callbacks and cross-unit linking')
