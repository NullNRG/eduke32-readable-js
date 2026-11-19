"""Native byte aliases remain alive across proven dominated source goto edges."""
import json,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def run(args,cwd):
    p=subprocess.run(list(map(str,args)),cwd=cwd,capture_output=True,text=True,timeout=180)
    assert p.returncode==0,(p.stdout[-1600:],p.stderr[-2200:])
    return p.stdout
with tempfile.TemporaryDirectory() as folder:
    root=Path(folder)
    (root/'unit.cpp').write_text('''static void store(void*out,int value){unsigned char*p=(unsigned char*)out;for(int i=0;i<4;i++)p[i]=((unsigned)value>>(i*8))&255;}
extern "C" int output(int n){int result;if(n<0)goto error;store(&result,n*17);if((n%7)==3){error:return -9;}return result;}
extern "C" int again(int n){int result=5;void*saved=&result;int count=0;again_label:store(&result,n+count);if(count++<2)goto again_label;return result+100*(&result==saved);}
extern "C" int parameter(int n){if(n<0)goto error;store(&n,n*7);if(n==35){error:return -7;}return n;}
extern "C" int scoped(int n){int sum=0;if(n<0)goto done;for(int i=0;i<4;i++){int value=n+i;void*saved=&value;store(&value,n*3+i);sum+=value+100*(&value==saved);}done:return sum;}
''')
    (root/'main.cpp').write_text('#include <cstdio>\nextern "C" int output(int),again(int),parameter(int),scoped(int);int main(){for(int n=-64;n<256;n++)printf("%d %d %d %d\\n",output(n),again(n),parameter(n),scoped(n));}\n')
    exe=root/'native.exe';run(['clang++',root/'unit.cpp',root/'main.cpp','-o',exe],root);expected=run([exe],root).splitlines()
    out=root/'out';base=[sys.executable,ROOT/'tools/source_ast_to_js.py','--root',root,'--out-dir',out,'--dependency-closure','--header-dependency-closure','--require-record-layouts']
    run([*base,'--source','unit.cpp'],ROOT)
    doc=json.loads((out/'unit.cpp.manifest.json').read_text());assert doc['blocked']==0,doc
    for name in ('output','again','parameter'):
        row=next(r for r in doc['definitions'] if r['name']==name);assert row['byte_scalar_goto_lifetime']['all_storage_precedes_labels_and_jumps'],row
    scoped=next(r for r in doc['definitions'] if r['name']=='scoped')
    assert scoped['byte_scalar_goto_lifetime']['isolated_lexical_storage'],scoped
    script=root/'run.mjs';script.write_text('import * as m from '+json.dumps((out/'unit.cpp.mjs').as_uri())+';for(let n=-64;n<256;n++)console.log([m.output(n),m.again(n),m.parameter(n),m.scoped(n)].join(" "));')
    assert run(['node',script],ROOT).splitlines()==expected
    (root/'blocked.cpp').write_text('''extern void store(void*,int);
int nested(int n){if(n)goto target;{int value;target:store(&value,7);return value;}}
int reentered(int n){again_label:int value=3;store(&value,n);if(n-- > 0)goto again_label;return value;}
''')
    run([*base,'--source','blocked.cpp'],ROOT)
    bad=json.loads((out/'blocked.cpp.manifest.json').read_text())
    for name in ('nested','reentered'):
        row=next(r for r in bad['definitions'] if r['name']==name);assert row['status']=='blocked' and 'proven storage lifetime' in row['reason'],row
print('PASS 1280 native/JS values across error returns, backward jumps, parameter aliases and isolated lexical storage; side-entry and re-entered declarations rejected')
