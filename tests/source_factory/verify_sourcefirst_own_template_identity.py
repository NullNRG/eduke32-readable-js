"""Distinct same-signature NTTP instances may never collapse to one body."""
import json,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def run(args):
    p=subprocess.run(list(map(str,args)),cwd=ROOT,text=True,capture_output=True,timeout=90)
    assert p.returncode==0,(p.stdout[-900:],p.stderr[-1800:]);return p.stdout
with tempfile.TemporaryDirectory(prefix='source-own-nttp-') as temporary:
    root=Path(temporary)
    (root/'unit.cpp').write_text('''template<unsigned Salt> static int mix(int n){return n*Salt;}
extern "C" int exercise(int n){return mix<3>(n)+mix<7>(n);}
''')
    for name,flags in [('full',[]),('filtered',['--filter','exercise','--exact-filter','--dependency-closure'])]:
        out=root/name
        run([sys.executable,ROOT/'tools/source_ast_to_js.py','--root',root,'--source','unit.cpp','--out-dir',out,*flags])
        module=out/'unit.cpp.mjs';document=json.loads(module.with_suffix('.manifest.json').read_text())
        instances=[row for row in document['definitions'] if row.get('source_name')=='mix']
        assert len(instances)==2 and len({row['clang_template_mangled_name'] for row in instances})==2,instances
        entry=next(row for row in document['definitions'] if row['name']=='exercise')
        assert entry['status']=='source-first' and all(row['status']=='source-first' for row in instances),document
        driver=root/(name+'.mjs');driver.write_text('import {exercise} from '+json.dumps(module.as_uri())+';for(let n=-32;n<32;n++)console.log(exercise(n));')
        native_driver=root/'main.cpp';native_driver.write_text('#include <cstdio>\nextern "C" int exercise(int);\nint main(){for(int n=-32;n<32;n++)printf("%d\\n",exercise(n));}')
        run(['clang++',root/'unit.cpp',native_driver,'-o',root/'native'])
        assert run(['node',driver]).splitlines()==run([root/'native']).splitlines()
print('PASS: 128 native/full/filtered same-signature NTTP results; Clang-selected instances remain distinct')
