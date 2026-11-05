"""Native reverse scanlines preserve writes, aliases and countdown exit values."""
import json,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tools'))
from source_ast_to_js import parse_json_stream
from source_terminal_pointer_steps import plan_body_tail

def run(args):
 p=subprocess.run(list(map(str,args)),cwd=ROOT,capture_output=True,text=True,timeout=180);assert p.returncode==0,(p.stdout[-1200:],p.stderr[-2000:]);return p.stdout
with tempfile.TemporaryDirectory() as folder:
 root=Path(folder);(root/'unit.cpp').write_text('''extern "C" int draw(int n){unsigned char pixels[512]={};unsigned char *p;int y=0;int stride[2]={0,32};for(int letter=0;letter<16;letter++){p=pixels+224+letter;for(y=7;y>=0;y--){p[0]=(n+letter*7+y*31)&255;p-=stride[1];}}int sum=0;for(int i=0;i<512;i++)sum=(sum*17+pixels[i])%1000003;return sum+y;}
''')
 (root/'main.cpp').write_text('#include <cstdio>\nextern "C" int draw(int);int main(){for(int n=0;n<512;n++)printf("%d\\n",draw(n));}\n')
 exe=root/'native.exe';run(['clang++',root/'unit.cpp',root/'main.cpp','-o',exe]);expected=run([exe]).splitlines()
 out=root/'out';run([sys.executable,ROOT/'tools/source_ast_to_js.py','--root',root,'--source','unit.cpp','--out-dir',out,'--require-record-layouts'])
 d=json.loads((out/'unit.cpp.manifest.json').read_text());assert d['blocked']==0,d;row=next(r for r in d['definitions'] if r['name']=='draw');assert len(row['terminal_body_pointer_steps'])==1,row
 script=root/'run.mjs';script.write_text('import {draw} from '+json.dumps((out/'unit.cpp.mjs').as_uri())+';for(let n=0;n<512;n++)console.log(draw(n));');assert run(['node',script]).splitlines()==expected
 (root/'negative.cpp').write_text('''extern void escape(char**);extern int tick(int&);void observed(char*b){char*p=b+7;for(int y=7;y>=0;y--){*p=1;p-=1;}if(p==b)*b=0;}
void escaped(char*b){char*p=b+7;for(int y=7;y>=0;y--){escape(&p);*p=1;p-=1;}}
void counteralias(char*b){int y;int &alias=y;char*p=b+7;for(y=7;y>=0;y--){tick(alias);*p=1;p-=1;}}
void volatile_stride(char*b,volatile int *s){char*p=b+7;for(int y=7;y>=0;y--){*p=1;p-=s[0];}}
void changed_counter(char*b){char*p=b+7;for(int y=7;y>=0;y--){if(y==4)y=2;*p=1;p-=1;}}
''')
 ast=parse_json_stream(run(['clang++','-Xclang','-ast-dump=json','-fsyntax-only',root/'negative.cpp']))
 functions=[n for tree in ast for n in tree.get('inner',[]) if n.get('kind')=='FunctionDecl' and any(c.get('kind')=='CompoundStmt' for c in n.get('inner',[]))];assert len(functions)==5
 for f in functions:assert not plan_body_tail(f,lambda t:t),f['name']
print('PASS 512 native/JS reverse scanline buffers and integer exit states; reject observed/escaped pointers, counter aliases/mutations and volatile stride reads')
