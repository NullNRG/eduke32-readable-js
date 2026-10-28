#!/usr/bin/env python3
"""Verify historical original LZ4 sizeof blockers against native source code."""
from pathlib import Path
import json
import subprocess
import sys
import tempfile
ROOT=Path(__file__).resolve().parents[2]
SOURCE='source/build/src/lz4.c'
ORIGINAL=ROOT/'factory-output/source-tree/eduke32-master'
BASELINE=ROOT/'factory-output/source-first/globally-linked/global-recovery.json'
NAMES=('LZ4_sizeofState','LZ4_sizeofStreamState')

def execute(args,cwd,timeout=120):
    p=subprocess.run(args,cwd=cwd,capture_output=True,text=True,timeout=timeout)
    assert p.returncode==0,(args,p.stdout[-1500:],p.stderr[-1800:])
    return p.stdout.strip()

baseline=json.loads(BASELINE.read_text())
blocked={(item['source'],item['name']) for item in baseline['remaining']}
assert all((SOURCE,name) in blocked for name in NAMES), 'historical baseline does not match blocked original symbols'
with tempfile.TemporaryDirectory(prefix='eduke-original-abi-') as tmp:
    dest=Path(tmp)
    execute([sys.executable,str(ROOT/'tools/source_ast_to_js.py'), '--root',str(ORIGINAL),
             '--source',SOURCE,'--out-dir',str(dest/'compiled')],ROOT)
    module=dest/'compiled'/f'{SOURCE}.mjs'
    manifest=json.loads(module.with_suffix('.manifest.json').read_text())
    exported={item['source_name'] for item in manifest['definitions'] if item['status']=='source-first'}
    assert set(NAMES).issubset(exported), set(NAMES)-exported
    execute(['node','--check',str(module)],ROOT)
    (dest/'main.cpp').write_text('''
#include <stdio.h>
#include "lz4.h"
int main(){printf("%d,%d\\n",LZ4_sizeofState(),LZ4_sizeofStreamState());}
''')
    execute(['clang++','-w','-std=gnu++14',f'-I{ORIGINAL}/source/build/include',
             '-fno-exceptions','-x','c++',str(ORIGINAL/SOURCE),str(dest/'main.cpp'),
             '-o',str(dest/'native')],ROOT)
    expected=execute([str(dest/'native')],ROOT)
    (dest/'run.mjs').write_text('import * as m from '+json.dumps(module.as_uri())+';\n'+
             'console.log(m.LZ4_sizeofState()+","+m.LZ4_sizeofStreamState());\n')
    actual=execute(['node',str(dest/'run.mjs')],ROOT)
    assert actual==expected,(actual,expected)
    print('PASS original EDuke32 LZ4 sizeof functions: native = JS = '+expected+
          '; both previously blocked in complete historical inventory')
