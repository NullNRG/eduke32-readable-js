"""Original C++ global construction survives both ES-module entry orders."""
import hashlib,json,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tools'))
from source_scalar_helpers import OPERATIONS,REFERENCES,declaration,legacy_declaration,reference_declaration,legacy_reference_declaration
from source_scalar_upgrade import upgrade
def run(args,cwd):
    p=subprocess.run(list(map(str,args)),cwd=cwd,capture_output=True,text=True,timeout=180)
    assert p.returncode==0,(args,p.stdout[-1000:],p.stderr[-3500:]);return p.stdout
with tempfile.TemporaryDirectory(dir=ROOT/'work',prefix='cyclic-scalar-') as folder:
    root=Path(folder)
    (root/'header.hpp').write_text('''#pragma once
struct Clock {static constexpr unsigned long long MASK=0xfeedbeef12345678ULL;
unsigned long long value;Clock():value(MASK){value^=0xa5a5a5a5a5a5a5a5ULL;};};
extern Clock original_clock;unsigned long long read_b();
''')
    (root/'one.cpp').write_text('#include "header.hpp"\nunsigned long long read_a(int n){Clock local;local.value+=(unsigned)n;return local.value+read_b();}\n')
    (root/'two.cpp').write_text('#include "header.hpp"\nClock original_clock;unsigned long long read_b(){return original_clock.value;}\n')
    (root/'main.cpp').write_text('#include <cstdio>\nunsigned long long read_a(int);int main(){for(int n=-128;n<128;n++)printf("%llu\\n",read_a(n));}\n')
    exe=root/'native.exe';run(['clang++','-std=c++14','one.cpp','two.cpp','main.cpp','-o',exe],root)
    expected=run([exe],root).splitlines()
    plan=root/'plan.json';plan.write_text(json.dumps({'root':str(root),'units':[{'source':n+'.cpp','header_inlines':True,'header_dependency_closure':True,'dependency_closure':True} for n in ('one','two')]}))
    out=root/'out';run([sys.executable,ROOT/'tools/source_first_project.py','--plan',plan,'--out-dir',out,'--strict'],root)
    build=json.loads((out/'project-build.json').read_text());assert build['canonical_header_odr_owners']['Clock']=='one.cpp',build
    script=root/'run.mjs';script.write_text('await import(process.argv[2]);const {read_a}=await import('+json.dumps((out/'one.cpp.mjs').as_uri())+');for(let n=-128;n<128;n++)console.log(String(read_a(n)));')
    for name in ('one','two'):assert run(['node',script,(out/(name+'.cpp.mjs')).as_uri()],root).splitlines()==expected
    module=out/'one.cpp.mjs';fresh=module.read_bytes();legacy=fresh.decode()
    for name in OPERATIONS:legacy=legacy.replace(declaration(name),legacy_declaration(name))
    for name in REFERENCES:legacy=legacy.replace(reference_declaration(name),legacy_reference_declaration(name))
    assert legacy!=fresh.decode();module.write_bytes(legacy.encode())
    red=subprocess.run(['node',str(script),(out/'one.cpp.mjs').as_uri()],cwd=root,capture_output=True,text=True)
    assert red.returncode!=0 and 'before initialization' in red.stderr,red.stderr
    digest=hashlib.sha256(module.read_bytes()).hexdigest()
    try:upgrade(module,'0'*64,root/'history')
    except ValueError:pass
    else:raise AssertionError('Changed owner was accepted')
    report=upgrade(module,digest,root/'history')
    assert report['source_definitions_recovered']==0 and module.read_bytes()==fresh,report
    assert run(['node',script,(out/'one.cpp.mjs').as_uri()],root).splitlines()==expected
print('PASS 768 native/JS values: cyclic C++ header factory construction, both module entry orders, exact helper-only owner migration and changed-owner rejection')
