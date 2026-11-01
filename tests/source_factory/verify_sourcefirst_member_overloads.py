"""Original Clang-selected ordinary/const/static member overloads, no dispatch."""
import json,os,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def run(args):
    p=subprocess.run(list(map(str,args)),cwd=ROOT,text=True,capture_output=True,timeout=120)
    assert p.returncode==0,(p.stdout[-1600:],p.stderr[-3000:]);return p.stdout
with tempfile.TemporaryDirectory(prefix='source-member-overloads-') as temporary:
    root=Path(temporary)
    (root/'members.hpp').write_text('''#pragma once
struct Counter {
 int value;Counter(int n):value(n){}
 int choose(int n){value+=n;return value+13;}
 int choose(short n){value-=n;return value-19;}
 int &get(){return value;}
 const int &get()const{return value;}
 static int scale(int n){return n*3;}
 static int scale(short n){return n*7;}
};
''')
    (root/'unit.cpp').write_text('''#include "members.hpp"
extern "C" int exercise(int n){Counter c(n);const Counter &ref=c;
 int a=c.choose((short)3);int b=c.choose(5);c.get()+=11;
 return a+b+ref.get()+Counter::scale((short)7)+Counter::scale(9);}
''')
    (root/'main.cpp').write_text('#include <cstdio>\nextern "C" int exercise(int);\nint main(){for(int n=-256;n<256;n++)printf("%d\\n",exercise(n));}')
    exe=root/('oracle.exe' if os.name=='nt' else 'oracle')
    run(['clang++','-std=c++14',root/'unit.cpp',root/'main.cpp','-o',exe]);expected=run([exe]).splitlines()
    for name,flags in [('full',[]),('filtered',['--filter','exercise','--exact-filter','--dependency-closure','--header-dependency-closure'])]:
        out=root/name
        run([sys.executable,ROOT/'tools/source_ast_to_js.py','--root',root,'--source','unit.cpp','--out-dir',out,*flags])
        module=out/'unit.cpp.mjs';manifest=json.loads(module.with_suffix('.manifest.json').read_text())
        assert manifest['blocked']==0,manifest['definitions']
        assert module.read_text().count('choose__cxx_method_')>=4
        driver=root/(name+'.mjs');driver.write_text('import {exercise} from '+json.dumps(module.as_uri())+';for(let n=-256;n<256;n++)console.log(exercise(n));')
        actual=run(['node',driver]).splitlines();assert actual==expected,next(((i,a,b)for i,(a,b)in enumerate(zip(actual,expected))if a!=b),None)
print('PASS 1024 native/Node results: exact const/nonconst reference members and overloaded ordinary/static methods in full and filtered source')
