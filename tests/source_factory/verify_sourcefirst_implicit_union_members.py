"""Trivial implicit union copies are storage operations, not runtime imports."""
import json,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def run(args,cwd):
    p=subprocess.run(list(map(str,args)),cwd=cwd,capture_output=True,text=True,timeout=180)
    assert p.returncode==0,(p.stdout[-1500:],p.stderr[-2000:])
    return p.stdout
with tempfile.TemporaryDirectory() as folder:
    root=Path(folder)
    (root/'vectors.hpp').write_text('''template<class T>struct Vec2{T x,y;Vec2<T>&operator+=(Vec2<T> b){x+=b.x;y+=b.y;return *this;}};
template<class T>struct Vec3{
 union{struct{T x,y,z;};struct{T d,u,v;};Vec2<T> xy;};
 Vec3<T>&operator+=(const Vec3<T>&b){x+=b.x;y+=b.y;z+=b.z;return *this;}
 Vec3<T>&operator+=(const Vec2<T>&b){xy+=b;return *this;}
 Vec3<T>&operator-=(const Vec3<T>&b){x-=b.x;y-=b.y;z-=b.z;return *this;}
 Vec3<T>&operator*=(const Vec3<T>&b){x*=b.x;y*=b.y;z*=b.z;return *this;}
 const Vec3<T>operator+(const Vec3<T>&b)const{return {T(x+b.x),T(y+b.y),T(z+b.z)};}
};
''')
    (root/'vector.cpp').write_text('''#include "vectors.hpp"
extern "C" int step(int n){
 Vec3<int> x{1,2,3},y{n,2*n,3*n};x+=y;Vec3<int> copied=x;
 copied.xy.x+=7;copied+=y.xy;copied-=y;copied*=y;
 Vec3<int> result;result=copied+y;
 return result.x+result.u*3+result.v*7+(result.d==result.x)*11;
}
''')
    (root/'main.cpp').write_text('#include <cstdio>\nextern "C" int step(int);int main(){for(int n=-512;n<512;n++)printf("%d\\n",step(n));}\n')
    exe=root/'native.exe';run(['clang++',root/'vector.cpp',root/'main.cpp','-o',exe],root)
    expected=run([exe],root).splitlines()
    out=root/'out';base=[sys.executable,ROOT/'tools/source_ast_to_js.py','--root',root,'--out-dir',out,'--header-dependency-closure','--dependency-closure','--require-record-layouts']
    run([*base,'--source','vector.cpp'],ROOT)
    manifest=json.loads((out/'vector.cpp.manifest.json').read_text());assert manifest['blocked']==0,manifest
    assert len([r for r in manifest['definitions'] if r.get('header_record_factory')])==2
    script=root/'run.mjs';script.write_text('import {step} from '+json.dumps((out/'vector.cpp.mjs').as_uri())+';for(let n=-512;n<512;n++)console.log(step(n));')
    assert run(['node',script],ROOT).splitlines()==expected
    (root/'calls.hpp').write_text('extern int missing(int);template<class T>struct Calls{T x;int get(){return missing(x);}};\n')
    (root/'calls.cpp').write_text('#include "calls.hpp"\nextern "C" int need(){Calls<int>x{3};return x.get();}\n')
    run([*base,'--source','calls.cpp'],ROOT)
    blocked=json.loads((out/'calls.cpp.manifest.json').read_text())
    assert any(r['status']=='blocked' and 'missing' in r.get('unresolved_references',[]) for r in blocked['definitions']),blocked
    assert not any(r['name']=='need' and r['status']=='source-first' for r in blocked['definitions'])
print('PASS 1024 native/JS vector values with anonymous unions, aliased members, implicit copies and authored operators; actual external method calls remain blocked')
