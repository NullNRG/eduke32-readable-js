#!/usr/bin/env python3
"""C locale native/JS exact sign comparison and strict storage bounds."""
from pathlib import Path
import json,subprocess,sys,tempfile
ROOT=Path(__file__).resolve().parents[2]
SRC=ROOT/'tests/source_factory/source_first_case_string_fixture.cpp'
with tempfile.TemporaryDirectory(prefix='eduke_case_strings_') as tmp:
    root=Path(tmp)
    r=subprocess.run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(ROOT),'--source',str(SRC.relative_to(ROOT)),'--out-dir',str(root)],cwd=ROOT,capture_output=True,text=True,timeout=80)
    assert r.returncode==0,r.stderr
    mod=root/'tests/source_factory/source_first_case_string_fixture.cpp.mjs'
    m=json.loads(mod.with_suffix('.manifest.json').read_text());assert m['emitted']==2 and m['blocked']==0,m
    native=root/'main.cpp'
    native.write_text(r'''#include <cstdio>
#include <clocale>
extern "C" int compare_ascii(char const*,char const*);
extern "C" int compare_ascii_n(char const*,char const*,unsigned long);
int main(){setlocale(LC_ALL,"C");for(int i=0;i<256;i++){
 char a[32]={},b[32]={};for(int j=0;j<i%13;j++)a[j]='A'+((i+j*7)%52);for(int j=0;j<(i*5)%13;j++)b[j]='A'+((i+j*3)%52);
 int x=compare_ascii(a,b),y=compare_ascii_n(a,b,i%21);printf("%d,%d\n",(x>0)-(x<0),(y>0)-(y<0));}}
''')
    executable=root/'native'
    r=subprocess.run(['clang++',str(native),str(SRC),'-o',str(executable)],capture_output=True,text=True,timeout=30)
    assert r.returncode==0,r.stderr
    js=root/'main.mjs'
    js.write_text('import * as m from '+json.dumps(mod.as_uri())+''';
for(let i=0;i<256;i++){
 const a=new Uint8Array(32),b=new Uint8Array(32);
 for(let j=0;j<i%13;j++)a[j]=65+(i+j*7)%52;
 for(let j=0;j<(i*5)%13;j++)b[j]=65+(i+j*3)%52;
 const x=m.compare_ascii(a,b),y=m.compare_ascii_n(a,b,i%21);
 console.log(`${Math.sign(x)},${Math.sign(y)}`);
}''')
    n=subprocess.run([str(executable)],capture_output=True,text=True,timeout=30)
    j=subprocess.run(['node',str(js)],capture_output=True,text=True,timeout=30)
    assert n.returncode==0 and j.returncode==0,(n.stderr,j.stderr)
    assert n.stdout==j.stdout,next(((i,a,b) for i,(a,b) in enumerate(zip(n.stdout.splitlines(),j.stdout.splitlines())) if a!=b), 'length discrepancy')
    guard=root/'guard.mjs'
    guard.write_text((ROOT/'tools/source_byte_memory_runtime.mjs').read_text()+'''
const bytes=v=>Uint8Array.from(v),bad=f=>{let ok=false;try{f()}catch(e){ok=e instanceof RangeError||e instanceof TypeError}if(!ok)throw Error('expected bounded C byte guard');};
bad(()=>cByteMemory.strcasecmp(bytes([65]),bytes([65,0])));
bad(()=>cByteMemory.strncasecmp(bytes([65]),bytes([65]),2));
if(cByteMemory.strncasecmp(null,null,0)!==0)throw Error('zero-size strncasecmp touches pointers');
''')
    g=subprocess.run(['node',str(guard)],capture_output=True,text=True,timeout=30)
    assert g.returncode==0,g.stderr
print('PASS: 512 POSIX C locale native/JS ASCII case-folded comparisons and bounded memory guards')
