"""Native LP64 pointer-array value/identity/callback/byte-copy differential tests."""
import hashlib,json,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def run(command,cwd):
    p=subprocess.run(command,cwd=cwd,capture_output=True,text=True,timeout=120)
    assert p.returncode==0,(command,p.stdout[-1000:],p.stderr[-2000:])
    return p.stdout.strip()
with tempfile.TemporaryDirectory(prefix='eduke-pointer-arrays-') as temp:
    root=Path(temp);out=root/'out'
    (root/'unit.cpp').write_text(r'''
extern "C" void *memcpy(void*,const void*,__SIZE_TYPE__);
int plus(int x){return x+3;}int twice(int x){return x*2;}
char const *global_names[4]={nullptr,"ENG","GFX","GL"};
int (*global_calls[3])(int)={plus,twice,nullptr};
int pointer_array_case(int n){
 char const *names[]={nullptr,"ENG","GFX","GL","ASS"};
 char const *copy[5]={};
 memcpy(copy,names,sizeof(names));
 unsigned i=(unsigned)n%5;
 char const *p=copy[i];
 int identity=copy[i]==names[i];
 copy[0]=names[2];
 return identity*100+(p?p[0]:0)+(names[0]==nullptr?1000:0)+(copy[0]==names[2]?2000:0);
}
int callback_array_case(int n){
 int (*callbacks[3])(int)={plus,twice,nullptr};
 int (*copy[3])(int)={};
 memcpy(copy,callbacks,sizeof(callbacks));
 int (**p)(int)=copy;
 int a=p[0](n),b=p[1](n);
 p[2]=p[0];
 return a+b+10*(p[2]==plus)+100*(copy[1]==twice)+1000*(callbacks[2]==nullptr);
}
int global_array_case(int n){unsigned i=(unsigned)n%4;return (global_names[i]?global_names[i][0]:0)+global_calls[n&1](n);}
int pointer_array_sizes(){return sizeof(int(*[3])(int))+sizeof(int(*)[3])+sizeof(int(*[2])[3])+sizeof(void(*)(int(*[4])(int)));}
int byte_pointer_alias(int n){char const *a[3]={"A","B","C"};char *bytes=(char*)a;char const **p=(char const**)bytes;p[1]=a[2];return p[1][0]+10*(a[1]==a[2])+100*((void*)a==(void*)bytes)+n;}
''')
    (root/'main.cpp').write_text('#include <cstdio>\n#include "unit.cpp"\nint main(){for(int n=0;n<512;n++)printf("%d,%d,%d,%d,%d\\n",pointer_array_case(n),callback_array_case(n),global_array_case(n),pointer_array_sizes(),byte_pointer_alias(n));}\n')
    exe=root/'native.exe';run(['clang++','-std=c++14','-funsigned-char','main.cpp','-o',str(exe)],root)
    expected=run([str(exe)],root).splitlines()
    run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(root),'--source','unit.cpp','--out-dir',str(out)],root)
    manifest=json.loads((out/'unit.cpp.manifest.json').read_text());rows={r['name']:r for r in manifest['definitions']}
    for name in ('global_names','global_calls','pointer_array_case','callback_array_case','global_array_case','pointer_array_sizes','byte_pointer_alias'):
        assert rows[name]['status']=='source-first',(name,rows[name])
    module=out/'unit.cpp.mjs';run(['node','--check',str(module)],root)
    (root/'run.mjs').write_text('import * as m from '+json.dumps(module.as_uri())+';for(let n=0;n<512;n++)console.log([m.pointer_array_case(n),m.callback_array_case(n),m.global_array_case(n),m.pointer_array_sizes(),m.byte_pointer_alias(n)].join(","));')
    try:observed=run(['node',str(root/'run.mjs')],root).splitlines()
    except AssertionError:
        code=module.read_text();start=code.index('export function callback_array_case')
        print(code[start:start+2000]);raise
    assert observed==expected,next(((i,a,b) for i,(a,b) in enumerate(zip(expected,observed)) if a!=b),('length',len(expected),len(observed)))
    # Cross-TU users must not accept the previous plain-Array storage ABI.
    (root/'reader.cpp').write_text('extern char const *global_names[]; int read_table(int n){const char*p=global_names[n%4];return p?p[0]:0;}')
    index=root/'providers.json';index.write_text(json.dumps({'global_names':'unit.cpp'}))
    run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(root),'--source','reader.cpp',
        '--project-symbols',str(index),'--out-dir',str(out)],root)
    reader=json.loads((out/'reader.cpp.manifest.json').read_text())
    dep=next(d for d in reader['imports'] if d['name']=='global_names')
    assert dep['abi']=='source-pointer-array/1' and dep['extent'] is None,dep
    sys.path.insert(0,str(ROOT/'tools'))
    from source_first_global_link import storage_import_error
    provider={'unit.cpp':{'manifest':manifest,'module':module}}
    assert storage_import_error(dep,provider) is None
    import copy
    old=copy.deepcopy(manifest)
    next(d for d in old['definitions'] if d['name']=='global_names').pop('object_storage')
    assert 'contiguous LP64' in storage_import_error(dep,{'unit.cpp':{'manifest':old,'module':module}})
    mismatched={**dep,'extent':5}
    assert 'extent differs' in storage_import_error(mismatched,provider)
    driver=root/'read.mjs';driver.write_text('import {read_table} from '+json.dumps((out/'reader.cpp.mjs').as_uri())+';for(let i=0;i<4;i++)console.log(read_table(i));')
    assert run(['node',str(driver)],root).splitlines()==['0','69','71','71']
    report={'format':'original-source-pointer-array-native-parity/1','native_js_cases':512,
        'compared_values':2560,'passed':True,'checks':['string and null pointer slots','original callable identity','byte-pointer alias round trip','function-pointer array sizes',
        'callback invocation through pointer-to-pointer','global pointer arrays','LP64 contiguous memcpy','independent destination storage',
        'cross-unit incomplete array declaration','old pointer-array provider ABI rejected','mismatched array extent rejected'],
        'compiler_sha256':hashlib.sha256((ROOT/'tools/source_ast_to_js.py').read_bytes()).hexdigest(),'gameplay_verified':False}
    (ROOT/'reports/oct15-pointer-array-parity.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2))
