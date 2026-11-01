"""Explicit filtered recovery preserves original concrete header template exports."""
import json,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def run(args,cwd):
    p=subprocess.run(list(map(str,args)),cwd=cwd,text=True,capture_output=True,timeout=180)
    assert p.returncode==0,(args,p.stdout[-1400:],p.stderr[-2500:]);return p.stdout
with tempfile.TemporaryDirectory(prefix='requested-header-templates-',dir=ROOT/'work') as temporary:
    root=Path(temporary)
    (root/'helpers.hpp').write_text('template<class T> inline T choose_original(T a,T b){return a<b?a:b;}\n')
    (root/'unit.cpp').write_text('#include "helpers.hpp"\nextern "C" int instantiate(int x){return choose_original(x,31)+(int)choose_original((unsigned)x,73u);}\n')
    (root/'main.cpp').write_text('#include <cstdio>\nextern "C" int instantiate(int);\nint main(){for(int i=-128;i<128;i++)printf("%d\\n",instantiate(i));}')
    exe=root/'oracle.exe';run(['clang++','-std=c++14',root/'unit.cpp',root/'main.cpp','-o',exe],root)
    expected=run([exe],root).splitlines()
    compiler=[sys.executable,ROOT/'tools/source_ast_to_js.py','--root',root,'--source','unit.cpp',
              '--exact-filter','--dependency-closure','--header-dependency-closure','--header-inlines']
    run([*compiler,'--filter','instantiate','--out-dir',root/'called'],root)
    called=json.loads((root/'called/unit.cpp.manifest.json').read_text())
    run([*compiler,'--filter','choose_original','--out-dir',root/'explicit'],root)
    module=root/'explicit/unit.cpp.mjs';explicit=json.loads(module.with_suffix('.manifest.json').read_text())
    selected=[row for row in explicit['definitions'] if row['status']=='source-first']
    previous={row['name'] for row in called['definitions'] if row['source_name']=='choose_original'}
    assert len(selected)==2 and {row['name'] for row in selected}==previous,explicit['definitions']
    names={row['original_type']:row['name'] for row in selected}
    signed=names['int (int, int)'];unsigned=names['unsigned int (unsigned int, unsigned int)']
    runner=root/'run.mjs';runner.write_text('import * as s from '+json.dumps(module.as_uri())+';\n'+
        'for(let i=-128;i<128;i++)console.log(s.'+signed+'(i,31)+(s.'+unsigned+'(i>>>0,73)|0));')
    observed=run(['node',runner],root).splitlines();assert observed==expected,(observed[:3],expected[:3])
print('PASS 256 native/JS cases: explicitly requested original header specializations preserve exact callable identities without an emitted caller')
