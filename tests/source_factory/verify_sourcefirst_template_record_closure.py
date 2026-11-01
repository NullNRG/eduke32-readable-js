"""Native parity for local template specializations and filtered record copies."""
import json,os,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def run(args,cwd=ROOT):
    p=subprocess.run(args,cwd=cwd,text=True,capture_output=True,timeout=120)
    assert p.returncode==0,(args,p.stdout[-1800:],p.stderr[-2500:])
    return p.stdout
with tempfile.TemporaryDirectory(prefix='source-template-record-') as temporary:
    root=Path(temporary)
    (root/'unit.cpp').write_text('''
template<class T> struct Position {T x,y;};
using Point=Position<int>; static Point previous;
template<unsigned Multiple> static unsigned aligned(unsigned n){return (n+Multiple-1)/Multiple*Multiple;}
template<class UInt> static unsigned sumValues(UInt *p,unsigned count){unsigned value=0;for(unsigned i=0;i<count;i++)value+=p[i];return value;}
extern "C" int exercise(int v){
 Point a{v,v*3}; previous=a; Point b=previous; previous={v-7,v+11};
 unsigned short small[3]={(unsigned short)v,3,11}; unsigned large[3]={(unsigned)(v+10000),7,19};
 return b.x+b.y+(int)aligned<16>((unsigned)(v+4096))+(int)sumValues(small,3)+(int)sumValues(large,3)+previous.x;
}''')
    (root/'main.cpp').write_text('#include <cstdio>\nextern "C" int exercise(int);\nint main(){for(int i=-256;i<256;i++)printf("%d\\n",exercise(i));}')
    exe=root/('oracle.exe' if os.name=='nt' else 'oracle')
    run(['clang++','-std=c++14',str(root/'unit.cpp'),str(root/'main.cpp'),'-o',str(exe)])
    expected=run([str(exe)]).splitlines()
    for name,flags in [('full',[]),('filtered',['--filter','exercise','--exact-filter','--dependency-closure'])]:
        out=root/name
        run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(root),'--source','unit.cpp','--out-dir',str(out),*flags])
        module=out/'unit.cpp.mjs';document=json.loads(module.with_suffix('.manifest.json').read_text())
        assert document['blocked']==0,document['definitions']
        functions=[row for row in document['definitions'] if row.get('source_name')=='sumValues' and row['status']=='source-first']
        assert len(functions)==2 and len({row['name'] for row in functions})==2,functions
        runner=root/(name+'.mjs');runner.write_text('import {exercise} from '+json.dumps(module.as_uri())+';for(let i=-256;i<256;i++)console.log(exercise(i));')
        actual=run(['node',str(runner)]).splitlines()
        assert actual==expected,next(((i,a,b) for i,(a,b) in enumerate(zip(actual,expected)) if a!=b),None)
print('PASS: 1024 native/Node comparisons; own-TU template instances, two scalar specializations, filtered template record copy/move and original global storage')
