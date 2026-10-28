#!/usr/bin/env python3
"""Differential Clang enums with cross-enum explicit aliases and implicit tails."""
import json,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
SRC='tests/source_factory/source_first_enum_alias_fixture.cpp'
def run(cmd):
    p=subprocess.run(cmd,cwd=ROOT,capture_output=True,text=True,timeout=110)
    assert p.returncode==0,(cmd,p.stderr[-1500:],p.stdout[-800:])
    return p.stdout
with tempfile.TemporaryDirectory(prefix='enum_alias_') as td:
    folder=Path(td)
    common=[sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(ROOT),'--source',SRC,'--out-dir',str(folder)]
    run(common)
    mod=folder/(SRC+'.mjs')
    manifest=json.loads(mod.with_suffix('.manifest.json').read_text())
    defs={item['name']:item for item in manifest['definitions']}
    assert defs['enum_alias_chain']['status']=='source-first',defs['enum_alias_chain']
    run(['node','--check',str(mod)])
    (folder/'driver.cpp').write_text('''#include <cstdio>
extern "C" int enum_alias_chain(int);
int main(){for(int x=-255;x<257;x++) printf("%d\\n",enum_alias_chain(x));}
''')
    run(['clang++','-std=c++14',str(ROOT/SRC),str(folder/'driver.cpp'),'-o',str(folder/'native')])
    cpp=run([str(folder/'native')]).splitlines()
    (folder/'driver.mjs').write_text('import {enum_alias_chain} from '+json.dumps(mod.as_uri())+';\n'
        'for(let x=-255;x<257;x++)console.log(enum_alias_chain(x));\n')
    js=run(['node',str(folder/'driver.mjs')]).splitlines()
    assert len(cpp)==len(js)==512 and cpp==js,(len(cpp),len(js),list(zip(cpp,js))[:8])
    print('PASS: 512 C++/JS cross-enum explicit-reference and implicit-value parity cases')
