"""Private dead terminal pointer steps do not require an out-of-bounds address."""
import json,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tools'))
from source_ast_to_js import parse_json_stream
from source_terminal_pointer_steps import plan

def run(args,cwd):
    p=subprocess.run(list(map(str,args)),cwd=cwd,capture_output=True,text=True,timeout=180)
    assert p.returncode==0,(p.stdout[-1600:],p.stderr[-2400:])
    return p.stdout
with tempfile.TemporaryDirectory() as folder:
    root=Path(folder)
    (root/'unit.cpp').write_text('''static int reverse(const unsigned char*base,int n){const unsigned char*p=base+(n-1)*3;int sum=0,i;for(i=n-1;i>=0;i--,p-=3){if((i&3)==1)continue;sum+=p[0]+p[1]*3+p[2]*7;}return sum+i;}
extern "C" int value(int n){unsigned char data[768];for(int i=0;i<768;i++)data[i]=(i*37+11)&255;return reverse(data,n);}
''')
    (root/'main.cpp').write_text('#include <cstdio>\nextern "C" int value(int);int main(){for(int n=1;n<=256;n++)printf("%d\\n",value(n));}\n')
    exe=root/'native.exe';run(['clang++',root/'unit.cpp',root/'main.cpp','-o',exe],root)
    expected=run([exe],root).splitlines()
    out=root/'out';run([sys.executable,ROOT/'tools/source_ast_to_js.py','--root',root,'--source','unit.cpp','--out-dir',out,'--dependency-closure','--header-dependency-closure','--require-record-layouts'],ROOT)
    doc=json.loads((out/'unit.cpp.manifest.json').read_text());assert doc['blocked']==0,doc
    changed=[r for r in doc['definitions'] if r.get('terminal_pointer_steps')];assert len(changed)==1 and changed[0]['source_name']=='reverse',doc
    script=root/'run.mjs';script.write_text('import {value} from '+json.dumps((out/'unit.cpp.mjs').as_uri())+';for(let n=1;n<=256;n++)console.log(value(n));')
    assert run(['node',script],ROOT).splitlines()==expected
    # These values remain observable or their guards have side effects.
    (root/'negative.cpp').write_text('''extern void escape(char**);extern int condition(int);
int observed(char*base){char*p=base+3;for(int i=1;i>=0;i--,p-=3){}return p==base;}
void escaped(char*base){char*p=base+3;for(int i=1;i>=0;i--,p-=3){escape(&p);}}
void impure(char*base){char*p=base+3;for(int i=1;condition(i);i--,p-=3){*p=1;}}
void refalias(char*base){char*p=base+3;char*&alias=p;for(int i=1;i>=0;i--,p-=3){*p=1;}}
void volatile_counter(char*base){char*p=base+3;for(volatile int i=1;i>=0;i--,p-=3){*p=1;}}
''')
    ast=parse_json_stream(run(['clang++','-Xclang','-ast-dump=json','-fsyntax-only',root/'negative.cpp'],ROOT))
    functions=[n for tree in ast for n in [tree] if n.get('kind')=='FunctionDecl' and n.get('name') in ('observed','escaped','impure','refalias','volatile_counter')]
    if not functions:functions=[n for tree in ast for n in tree.get('inner',[]) if n.get('kind')=='FunctionDecl' and n.get('name') in ('observed','escaped','impure','refalias','volatile_counter')]
    assert len(functions)==5
    for function in functions:assert not plan(function,lambda t:t),function['name']
print('PASS 256 native/JS reverse walks with continue and retained integer exit state; observed/escaped/reference/volatile pointers and impure guards are not rewritten')
