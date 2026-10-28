#!/usr/bin/env python3
"""Verify source-linked C standard library byte functions, no fake imports."""
from pathlib import Path
import subprocess,sys,tempfile,json
ROOT=Path(__file__).resolve().parents[2]
def run(a,cwd):
 p=subprocess.run(a,cwd=cwd,capture_output=True,text=True,timeout=85)
 assert p.returncode==0,(a,p.stdout[-1000:],p.stderr[-1800:]);return p.stdout
with tempfile.TemporaryDirectory(prefix='eduke-libc-') as work:
 d=Path(work)
 (d/'source.cpp').write_text('''#include <cstring>
extern "C" int call_memcpy(unsigned char* a,const unsigned char* b,unsigned long n){ std::memcpy(a,b,n); return 4; }
extern "C" int call_memset(unsigned char* a,int k,unsigned long n){ std::memset(a,k,n); return 5; }
extern "C" int call_memmove(unsigned char* a,const unsigned char* b,unsigned long n){ std::memmove(a,b,n); return 6; }
extern "C" int call_memcmp(const unsigned char* a,const unsigned char* b,unsigned long n){ return std::memcmp(a,b,n); }
''')
 (d/'driver.cpp').write_text('''#include <cstdio>
extern "C" int call_memcpy(unsigned char*,const unsigned char*,unsigned long);
extern "C" int call_memset(unsigned char*,int,unsigned long);
extern "C" int call_memmove(unsigned char*,const unsigned char*,unsigned long);
extern "C" int call_memcmp(const unsigned char*,const unsigned char*,unsigned long);
int main(){ for(int i=0;i<240;i++){
 unsigned char a[16],b[16];for(int j=0;j<16;j++){a[j]=(i+j*3)&255;b[j]=(i*5+j*11)&255;}
 int cmp=call_memcmp(a,b,16);call_memcpy(a,b,16);call_memset(a+3,i,4);call_memmove(b+2,b,12);
 unsigned sum=0;for(int j=0;j<16;j++)sum+=a[j]+b[j];
 printf("%u,%d\\n",sum,(cmp>0)-(cmp<0));}}
''')
 run(['clang++','-std=c++17','source.cpp','driver.cpp','-o','native'],d)
 expected=run([str(d/'native')],d).splitlines()
 out=d/'out'
 run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(d),'--source','source.cpp','--out-dir',str(out)],d)
 manifest=json.loads((out/'source.cpp.manifest.json').read_text())
 bad=[(r['source_name'],r.get('reason')) for r in manifest['definitions'] if r['status']!='source-first']
 assert not bad,bad
 code=(out/'source.cpp.mjs').read_text()
 assert 'cByteMemory.memcpy' in code and 'cByteMemory.memcmp' in code
 run(['node','--check',str(out/'source.cpp.mjs')],d)
 (d/'test.mjs').write_text('''import {call_memcpy,call_memset,call_memmove,call_memcmp} from './out/source.cpp.mjs';
for(let i=0;i<240;i++){
 const a=Uint8Array.from({length:16},(_,j)=>(i+j*3)&255);
 const b=Uint8Array.from({length:16},(_,j)=>(i*5+j*11)&255);
 const cmp=call_memcmp(a,b,16);call_memcpy(a,b,16);
 const ap={__cPointer:true,array:false,buffer:a.buffer,lower:0,upper:16,offset:3};
 const bp={__cPointer:true,array:false,buffer:b.buffer,lower:0,upper:16,offset:2};
 call_memset(ap,i,4);call_memmove(bp,b,12);
 let sum=0;for(let j=0;j<16;j++)sum+=a[j]+b[j];
 console.log(`${sum},${Math.sign(cmp)}`);
}
''')
 actual=run(['node','test.mjs'],d).splitlines()
 assert actual==expected,next(((i,a,b) for i,(a,b) in enumerate(zip(actual,expected)) if a!=b),None)
 print('PASS 480 native C++/JS libc memcpy/memmove/memset/memcmp comparisons')
