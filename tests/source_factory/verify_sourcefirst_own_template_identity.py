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
        if entry['status']=='source-first':
            driver=root/(name+'.mjs');driver.write_text('import {exercise} from '+json.dumps(module.as_uri())+';for(let n=-32;n<32;n++)console.log(exercise(n));')
            assert run(['node',driver]).splitlines()==[str(n*10)for n in range(-32,32)]
        else:
            assert not module.is_file() or 'export function exercise(' not in module.read_text()
            assert all(row['status']=='blocked' for row in instances),instances
print('PASS: full/filtered own-TU NTTP identities stay distinct; unsupported same-signature instances remain blocked rather than execute the wrong body')
