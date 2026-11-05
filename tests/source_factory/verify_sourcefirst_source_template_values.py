"""Same-signature source template instances keep their native Clang identities."""
import json,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def run(args,cwd):
    p=subprocess.run(list(map(str,args)),cwd=cwd,capture_output=True,text=True,timeout=180)
    assert p.returncode==0,(p.stdout[-1200:],p.stderr[-2400:])
    return p.stdout
with tempfile.TemporaryDirectory() as folder:
    root=Path(folder);source=root/'original';source.mkdir()
    for filename,public,bias in [('one','first',13),('two','second',41)]:
        (source/(filename+'.cpp')).write_text('''template<int N> static int rotate(int angle){return ((angle+N*17+BIAS)>>(N%4))&1023;}
extern "C" int PUBLIC(int n){return rotate<2>(n)+rotate<3>(n)+rotate<7>(n)+(rotate<2>==rotate<3>);}
'''.replace('BIAS',str(bias)).replace('PUBLIC',public).replace('rotate<2>==','rotate<2> =='))
    (source/'main.cpp').write_text('''#include <cstdio>
extern "C" int first(int);extern "C" int second(int);
int main(){for(int n=-256;n<256;n++)printf("%d %d\\n",first(n),second(n));}
''')
    exe=root/'native.exe';run(['clang++',source/'one.cpp',source/'two.cpp',source/'main.cpp','-o',exe],root)
    expected=run([exe],root).splitlines()
    plan=root/'plan.json';plan.write_text(json.dumps({'root':str(source),'units':[{'source':name+'.cpp'} for name in ('one','two')]}))
    out=root/'out';run([sys.executable,ROOT/'tools/source_first_project.py','--plan',plan,'--out-dir',out,'--strict'],ROOT)
    previous=set()
    for name in ('one','two'):
        doc=json.loads((out/(name+'.cpp.manifest.json')).read_text())
        rows=[r for r in doc['definitions'] if r.get('source_name')=='rotate']
        assert len(rows)==3 and all(r['status']=='source-first' and r['linkage']=='internal' for r in rows),doc
        names={r['name'] for r in rows};assert len(names)==3 and not names&previous
        assert len({r['original_type'] for r in rows})==1
        previous.update(names)
    script=root/'run.mjs';script.write_text('import {first} from '+json.dumps((out/'one.cpp.mjs').as_uri())+';import {second} from '+json.dumps((out/'two.cpp.mjs').as_uri())+';for(let n=-256;n<256;n++)console.log([first(n),second(n)].join(" "));')
    assert run(['node',script],ROOT).splitlines()==expected
print('PASS 1024 native/JS source template results, same-signature non-type specializations and TU-private callable identities')
