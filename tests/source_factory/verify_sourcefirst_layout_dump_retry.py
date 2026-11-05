"""An older complete-dump crash never permits guessed or missing record ABI."""
import json,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tools'))
from source_record_layout_extraction import extract
from source_first_toolchain import frontend_config

def run(args,cwd):
    p=subprocess.run(list(map(str,args)),cwd=cwd,capture_output=True,text=True,timeout=180)
    assert p.returncode==0,(p.stdout[-1500:],p.stderr[-2000:])
    return p.stdout
with tempfile.TemporaryDirectory() as folder:
    root=Path(folder)
    (root/'unit.cpp').write_text('struct POD{int x;float y;};extern "C" int value(int n){POD p;p.x=n;p.y=1.5f;return p.x+(int)(p.y*8); }\n')
    (root/'main.cpp').write_text('#include <cstdio>\nextern "C" int value(int);int main(){for(int n=-256;n<256;n++)printf("%d\\n",value(n));}\n')
    exe=root/'native.exe';run(['clang++',root/'unit.cpp',root/'main.cpp','-o',exe],root)
    expected=run([exe],root).splitlines()
    driver=root/'retry.py';driver.write_text('import sys,subprocess\nfrom pathlib import Path\nsys.path.insert(0,'+repr(str(ROOT/'tools'))+')\nimport source_ast_to_js as m\noriginal=subprocess.run\ndef run(args,*a,**kw):\n if "-fdump-record-layouts-complete" in args:return subprocess.CompletedProcess(args,139,"","simulated older Clang complete-dump crash")\n return original(args,*a,**kw)\nsubprocess.run=run\nm.main()\n')
    out=root/'out';run([sys.executable,driver,'--root',root,'--source','unit.cpp','--out-dir',out,'--require-record-layouts'],ROOT)
    doc=json.loads((out/'unit.cpp.manifest.json').read_text());assert doc['blocked']==0,doc
    attempts=doc['record_layout_extraction']['attempts'];assert attempts[0]['returncode']==139 and attempts[1]['returncode']==0,attempts
    assert attempts[1]['mode']=='-fdump-record-layouts' and doc['record_layout_extraction']['records']>0
    script=root/'run.mjs';script.write_text('import {value} from '+json.dumps((out/'unit.cpp.mjs').as_uri())+';for(let n=-256;n<256;n++)console.log(value(n));')
    assert run(['node',script],ROOT).splitlines()==expected
    frontend,target=frontend_config(True)
    success=extract(frontend,['-x','c++'],target,'unit.cpp',root)
    if success.layout_attempts[0]['returncode']==0:assert len(success.layout_attempts)==1,'Successful complete extraction needlessly retried'
    (root/'bad.cpp').write_text('struct Invalid { MissingType member; };\n')
    failed=extract(frontend,['-x','c++'],target,'bad.cpp',root)
    assert failed.returncode and len(failed.layout_attempts)==2 and all(a['returncode'] for a in failed.layout_attempts)
print('PASS 512 native/JS results after failed complete dump and real used-type ABI extraction; syntax failures remain rejected and successful complete dumps are not retried')
