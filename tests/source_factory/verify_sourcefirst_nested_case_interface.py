"""The existing nested-case lowerer implements the statement plan interface."""
import json, os, subprocess, sys, tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def run(args,root):
    p=subprocess.run(args,cwd=root,capture_output=True,text=True,timeout=90)
    assert p.returncode==0,(p.stdout[-1000:],p.stderr[-2000:]);return p.stdout.splitlines()
with tempfile.TemporaryDirectory() as temp:
    root=Path(temp)
    (root/'unit.cpp').write_text('''int copied(int count){int result=0;int value=1;int n=(count+3)/4;
if(count<=0)return 0;switch(count%4){case 0:do{result+=value++;case 3:result+=value++;case 2:result+=value++;case 1:result+=value++;}while(--n>0);}return result;}''')
    (root/'main.cpp').write_text('#include <cstdio>\n#include "unit.cpp"\nint main(){for(int i=0;i<128;i++)printf("%d\\n",copied(i));}')
    native=root/'native.exe';run(['clang++','main.cpp','-o',str(native)],root);expected=run([str(native)],root)
    run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(root),'--source','unit.cpp','--out-dir',str(root/'out')],ROOT)
    manifest=json.loads((root/'out/unit.cpp.manifest.json').read_text());assert manifest['blocked']==0,manifest['definitions']
    (root/'run.mjs').write_text('import {copied} from "./out/unit.cpp.mjs";for(let i=0;i<128;i++)console.log(copied(i));')
    assert run(['node',str(root/'run.mjs')],root)==expected
    print('128 native/JS nested-case results passed; statement interface no longer crashes extraction')
