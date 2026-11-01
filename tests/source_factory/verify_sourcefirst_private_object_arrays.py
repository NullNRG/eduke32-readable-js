"""Same-source recovery borrows original pointer/record arrays, without clones."""
import json,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'tools'))
from source_first_global_link import storage_import_error
def run(args,cwd=ROOT):
    p=subprocess.run(list(map(str,args)),cwd=cwd,text=True,capture_output=True,timeout=180)
    assert p.returncode==0,(args,p.stdout[-1800:],p.stderr[-3000:]);return p.stdout
with tempfile.TemporaryDirectory(prefix='private-object-arrays-',dir=ROOT/'work') as temporary:
    root=Path(temporary);source=root/'unit.cpp';owner=root/'owner';fragment=root/'fragment'
    source.write_text('''struct Frame{int code;int *pointer;};
static int seed=7;static int *slots[3]={&seed};
static Frame records[2]={{13,&seed},{17,&seed}};
static unsigned char names[2][5]={{1,2},{3,4,5,6,7}};
extern "C" int owner_read(){return seed+records[0].code+records[1].code+*slots[0]+names[1][4];}
extern "C" int fragment_step(int n){*slots[0]+=n;slots[1]=slots[0];
 records[0].code+=n;*records[1].pointer+=3;
 __builtin_memset(&names,n+1,sizeof(names));unsigned char *flat=(unsigned char*)&names;
 flat[6]=(unsigned char)(n+17);
 slots[1][0]+=n;return slots[1][0]+records[0].code+records[1].code+names[1][1];}
''')
    compiler=[sys.executable,ROOT/'tools/source_ast_to_js.py','--root',root,'--source','unit.cpp',
        '--exact-filter','--dependency-closure','--require-record-layouts']
    run([*compiler,'--filter','seed,slots,records,names,owner_read','--out-dir',owner])
    symbols=root/'symbols.json';symbols.write_text('{}')
    run([*compiler,'--filter','slots,records,names,fragment_step','--out-dir',fragment,
        '--project-symbols',symbols,'--import-root',owner])
    manifest=fragment/'unit.cpp.manifest.json';document=json.loads(manifest.read_text())
    assert not [row for row in document['definitions'] if row['kind']=='VarDecl' and row['name'] in ('slots','records','names')],document['definitions']
    row=next(row for row in document['definitions'] if row['name']=='fragment_step')
    assert row['status']=='source-first',row
    original=json.loads((owner/'unit.cpp.manifest.json').read_text())
    units={'unit.cpp':{'module':owner/'unit.cpp.mjs','manifest':original}}
    imports={row['name']:row for row in document['imports']}
    for name in ('slots','records'):
        dep=imports[name]
        assert dep.get('consumer_source')=='unit.cpp' and storage_import_error(dep,units) is None,(dep,row)
        assert 'cannot cross original translation-unit ownership' in storage_import_error({**dep,'consumer_source':'other.cpp'},units)
    run([sys.executable,ROOT/'tools/install_verified_fragment.py','--manifest',manifest,'--target',owner,
        '--exports','fragment_step','--report',root/'installation.json'])
    (root/'main.cpp').write_text('#include <cstdio>\nextern "C" int fragment_step(int),owner_read();\nint main(){for(int n=0;n<256;n++){int result=fragment_step(n);printf("%d,%d\\n",result,owner_read());}}')
    exe=root/'oracle.exe';run(['clang++','-std=c++14',source,root/'main.cpp','-o',exe])
    expected=run([exe]).splitlines()
    runner=root/'run.mjs';runner.write_text('import {fragment_step,owner_read,names} from '+json.dumps((owner/'unit.cpp.mjs').as_uri())+';\nif(names[0].buffer!==names[1].buffer||names[1].byteOffset-names[0].byteOffset!==5)throw Error("Noncontiguous native rows");\nfor(let n=0;n<256;n++){const result=fragment_step(n);console.log(result+","+owner_read());}')
    observed=run(['node',runner]).splitlines();assert observed==expected,(observed[:3],expected[:3])
print('PASS 512 native/JS results: original private pointer/record arrays and contiguous multidimensional scalars retained across fragments; raw byte/row aliasing; cross-source private access rejected')
