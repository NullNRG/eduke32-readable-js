"""Local trivial unions retain exact native bytes without runtime constructors."""
import json,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def run(args,cwd):
    p=subprocess.run(list(map(str,args)),cwd=cwd,capture_output=True,text=True,timeout=180)
    assert p.returncode==0,(p.stdout[-1400:],p.stderr[-2000:])
    return p.stdout
with tempfile.TemporaryDirectory() as folder:
    root=Path(folder)
    (root/'bits.hpp').write_text('''static inline unsigned bits(int n){union{unsigned i;float f;}v;v.f=n==0?-0.0f:float(n)*0.125f;return v.i;}
union Named{unsigned i;float f;};
static inline unsigned named(int n){Named v;v.f=float(n)*0.25f;Named copy=v;copy.i^=0x80000000u;return copy.i;}
''')
    (root/'unit.cpp').write_text('#include "bits.hpp"\nextern "C" unsigned value(int n){return bits(n)^named(n); }\n')
    (root/'main.cpp').write_text('#include <cstdio>\nextern "C" unsigned value(int);int main(){for(int n=-1024;n<1024;n++)printf("%u\\n",value(n));}\n')
    exe=root/'native.exe';run(['clang++',root/'unit.cpp',root/'main.cpp','-o',exe],root)
    expected=run([exe],root).splitlines()
    out=root/'out';run([sys.executable,ROOT/'tools/source_ast_to_js.py','--root',root,'--source','unit.cpp','--out-dir',out,'--header-dependency-closure','--dependency-closure','--require-record-layouts'],ROOT)
    doc=json.loads((out/'unit.cpp.manifest.json').read_text());assert doc['blocked']==0,doc
    assert sum(r.get('storage_constructor_count',0) for r in doc['definitions'])>=2,doc
    script=root/'run.mjs';script.write_text('import {value} from '+json.dumps((out/'unit.cpp.mjs').as_uri())+';for(let n=-1024;n<1024;n++)console.log(value(n));')
    assert run(['node',script],ROOT).splitlines()==expected
print('PASS 2048 native/JS int-float union aliases, signed zero, named/anonymous trivial default construction and union copies')
