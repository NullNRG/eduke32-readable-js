"""Embedded record/reference helpers retain their pointer-runtime dependency."""
import json,os,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def run(args,cwd):
    result=subprocess.run(args,cwd=cwd,capture_output=True,text=True,timeout=90)
    assert result.returncode==0,(args,result.stdout[-1000:],result.stderr[-2000:])
    return result.stdout
with tempfile.TemporaryDirectory(prefix='helper-closure-') as temp:
    root=Path(temp)
    (root/'unit.c').write_text('struct Item {int value;}; int read(struct Item* p){return p->value;}')
    (root/'main.c').write_text('#include <stdio.h>\nstruct Item {int value;}; int read(struct Item*); int main(){for(int i=0;i<256;i++){struct Item x={i*7-19};printf("%d\\n",read(&x));}}')
    native=root/('native.exe' if os.name=='nt' else 'native')
    run(['clang','unit.c','main.c','-o',str(native)],root)
    expected=run([str(native)],root).splitlines()
    out=root/'out'
    run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(root),'--source','unit.c','--out-dir',str(out)],ROOT)
    module=out/'unit.c.mjs'
    (root/'run.mjs').write_text('import {read} from '+json.dumps(module.as_uri())+';\n'
        'for(let i=0;i<256;i++)console.log(read({__cPointer:true,buffer:[{value:i*7-19}],lower:0,upper:4,offset:0,array:true,stride:4}));')
    assert run(['node',str(root/'run.mjs')],ROOT).splitlines()==expected
    report={'passed':True,'native_node_values':256,'gameplay_verified':False,'check':'Original record reader accepts a bounded source pointer with transitive helper bindings present'}
    (ROOT/'reports/oct21-helper-closure.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2))
