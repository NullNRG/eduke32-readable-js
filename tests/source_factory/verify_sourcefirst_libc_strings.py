#!/usr/bin/env python3
"""Native C string contracts and exact copy bytes versus bounded JS storage."""
import json
import subprocess
import sys
import tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
SRC=ROOT/'tests/source_factory/source_first_c_string_runtime_fixture.cpp'
with tempfile.TemporaryDirectory(prefix='eduke_libc_string_') as td:
    root=Path(td)
    compiled=subprocess.run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(ROOT),
        '--source','tests/source_factory/source_first_c_string_runtime_fixture.cpp','--out-dir',str(root)],
        cwd=ROOT,capture_output=True,text=True,timeout=100)
    assert compiled.returncode==0,compiled.stderr[-1800:]
    mod=root/'tests/source_factory/source_first_c_string_runtime_fixture.cpp.mjs'
    mf=json.loads(mod.with_suffix('.manifest.json').read_text())
    assert mf['emitted']==5 and mf['blocked']==0,mf
    code=mod.read_text()
    for name in ('strlen','strcmp','strncmp','strcpy','strncpy'):
        assert f'cByteMemory.{name}' in code,name
    native=root/'driver.cpp'
    native.write_text('''#include <cstdio>
#include <cstring>
extern "C" unsigned long check_strlen(const char*);
extern "C" int check_strcmp(const char*,const char*);
extern "C" int check_strncmp(const char*,const char*,unsigned long);
extern "C" void check_strcpy(char*,const char*);
extern "C" void check_strncpy(char*,const char*,unsigned long);
int main(){
for(int i=0;i<256;i++){
 char a[40]={},b[40]={},c[40]={},d[40]={};
 int la=i%19,lb=(i*7)%19;
 for(int j=0;j<la;j++)a[j]='A'+(i+j*3)%23;
 for(int j=0;j<lb;j++)b[j]='A'+(i*5+j*7)%23;
 memset(c,42,sizeof(c));memset(d,42,sizeof(d));
 check_strcpy(c,a);check_strncpy(d,b,27);
 int sum=0;for(int j=0;j<40;j++)sum+=(unsigned char)c[j]+(unsigned char)d[j];
 printf("%lu,%d,%d,%d\\n",check_strlen(a),check_strcmp(a,b),check_strncmp(a,b,i%25),sum);
}}
''')
    exe=root/'native'
    cc=subprocess.run(['clang++',str(SRC),str(native),'-o',str(exe)],cwd=ROOT,capture_output=True,text=True,timeout=40)
    assert cc.returncode==0,cc.stderr
    js=root/'entry.mjs';js.write_text('''import * as f from '''+json.dumps(mod.as_uri())+''';
for(let i=0;i<256;i++){
 const a=new Uint8Array(40),b=new Uint8Array(40),c=new Uint8Array(40),d=new Uint8Array(40);
 const la=i%19,lb=i*7%19;
 for(let j=0;j<la;j++)a[j]=65+(i+j*3)%23;
 for(let j=0;j<lb;j++)b[j]=65+(i*5+j*7)%23;
 c.fill(42);d.fill(42);
 f.check_strcpy(c,a);f.check_strncpy(d,b,27);
 let sum=0;for(let j=0;j<40;j++)sum+=c[j]+d[j];
 console.log([f.check_strlen(a),f.check_strcmp(a,b),f.check_strncmp(a,b,i%25),sum].join(','));
}
''')
    def run(args):
        p=subprocess.run(args,cwd=root,capture_output=True,text=True,timeout=40)
        assert p.returncode==0,(p.stderr[-1500:],p.stdout[-300:])
        return p.stdout
    observed=[list(map(int,row.split(','))) for row in run(['node',str(js)]).splitlines()]
    expected=[list(map(int,row.split(','))) for row in run([str(exe)]).splitlines()]
    assert len(observed)==len(expected)==256
    def portable_result(row):
        # C specifies only the sign of strcmp/strncmp. Host libc implementations
        # may return a signed byte difference or just -1/+1 for identical inputs.
        return [row[0],(row[1]>0)-(row[1]<0),(row[2]>0)-(row[2]<0),row[3]]
    for index,(actual,native_row) in enumerate(zip(observed,expected)):
        assert portable_result(actual)==portable_result(native_row),(index,actual,native_row)
    runtime=ROOT/'tools/source_byte_memory_runtime.mjs'
    (root/'guards.mjs').write_text(runtime.read_text()+'''
const u=x=>Uint8Array.from(x),bad=f=>{let ok=false;try{f()}catch(e){ok=e instanceof TypeError||e instanceof RangeError}if(!ok)throw Error('missing C-string safety gate')};
bad(()=>cByteMemory.strlen(u([65,66])));
bad(()=>cByteMemory.strcpy(u([0,0]),u([65,66,0])));
bad(()=>cByteMemory.strcpy(u([65,66,0]),u([65,66])));
const x=u([65,66,0,0]);bad(()=>cByteMemory.strcpy(x,x));
bad(()=>cByteMemory.strncmp(u([65,66]),u([65,66]),3));
if(cByteMemory.strncmp(null,null,0)!==0)throw Error('zero-size C string compare touches invalid pointer');
const y=u([7,7,7]);cByteMemory.strncpy(y,u([65,66,67,68]),3);
if(y.join(',')!=='65,66,67')throw Error('truncated strncpy altered bytes');
const z=u([7,7,7,7]);cByteMemory.strncpy(z,u([65,0]),4);
if(z.join(',')!=='65,0,0,0')throw Error('strncpy failed zero padding');
''')
    run(['node',str(root/'guards.mjs')])
print('PASS: 256 native C++ / JS C-string comparisons, exact lengths/copy checksums, strcmp/strncmp sign contracts, bounded-string guards')
