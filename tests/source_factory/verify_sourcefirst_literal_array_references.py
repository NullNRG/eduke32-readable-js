"""Original static string bytes survive C++ array-reference template calls."""
import json,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def run(args,cwd):
    p=subprocess.run(list(map(str,args)),cwd=cwd,capture_output=True,text=True,timeout=120)
    assert p.returncode==0,(p.stdout[-1200:],p.stderr[-2400:])
    return p.stdout
with tempfile.TemporaryDirectory() as folder:
    root=Path(folder);source=root/'original';source.mkdir()
    (source/'test.cpp').write_text(r'''
template<unsigned N> static int digest(const char (&text)[N],int seed){
 for(unsigned i=0;i<N;i++)seed=(seed*17+(unsigned char)text[i])%65521;
 return seed;
}
extern "C" int original(int seed){
 return digest("A\0B",seed)+digest("\200\377",seed)+digest(" = ",seed)
       +digest(__func__,seed)+digest("]\n",seed);
}
''')
    (source/'main.cpp').write_text('#include <cstdio>\nextern "C" int original(int);\nint main(){for(int i=0;i<256;i++)printf("%d\\n",original(i));}')
    exe=root/'native.exe'
    run(['clang++','-std=c++14',source/'test.cpp',source/'main.cpp','-o',exe],root)
    expected=run([exe],root).splitlines()
    out=root/'out'
    run([sys.executable,ROOT/'tools/source_ast_to_js.py','--root',source,
         '--source','test.cpp','--out-dir',out,'--header-dependency-closure'],ROOT)
    manifest=json.loads((out/'test.cpp.manifest.json').read_text())
    assert manifest['blocked']==0,manifest
    script=root/'run.mjs'
    script.write_text('import {original} from '+json.dumps((out/'test.cpp.mjs').as_uri())+';for(let i=0;i<256;i++)console.log(original(i));')
    assert run(['node',script],ROOT).splitlines()==expected
print('PASS 256 native/JS C++ array-reference calls: embedded NUL, high bytes, final NUL and __func__')
