#!/usr/bin/env python3
"""Native C++ vs original-source-generated JS sprintf/snprintf and byte-bound guards."""
import json, subprocess, sys, tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
SRC=ROOT/'tests/source_factory/source_first_printf_fixture.cpp'
with tempfile.TemporaryDirectory(prefix='eduke_native_printf_') as td:
    td=Path(td)
    proc=subprocess.run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(ROOT),'--source',str(SRC.relative_to(ROOT)),'--out-dir',str(td)],capture_output=True,text=True,timeout=90,cwd=ROOT)
    assert proc.returncode==0,proc.stderr[-1200:]
    mod=td/'tests/source_factory/source_first_printf_fixture.cpp.mjs'
    manifest=json.loads(mod.with_suffix('.manifest.json').read_text())
    assert manifest['emitted']==4 and manifest['blocked']==0,manifest
    txt=mod.read_text()
    assert 'cByteMemory.sprintf' in txt and 'cByteMemory.snprintf' in txt
    driver=td/'driver.cpp'
    driver.write_text(r'''#include <cstdio>
#include <cstring>
#include <cstdint>
extern "C" int fmt_signed(char*,int,unsigned);
extern "C" int fmt_width(char*,int,int,int);
extern "C" int fmt_str(char*,unsigned long,char const*);
extern "C" int fmt_oct(char*,unsigned);
int main(){
  for(int i=0;i<128;i++){
    char out[256]={};
    const int a=i*104729-6000000;
    const unsigned b=(unsigned)(i*119723183u);
    int r=fmt_signed(out,a,b);printf("%d:%s\n",r,out);
    memset(out,0,sizeof out);
    r=fmt_width(out,a,i%13+1,i%8);printf("%d:%s\n",r,out);
    memset(out,0,sizeof out);
    r=fmt_oct(out,b);printf("%d:%s\n",r,out);
    char in[64]={};for(int j=0;j<(i*7)%24;j++)in[j]=(char)('A'+(i+j)%26);
    for(int cap=0;cap<34;cap+=11){
      memset(out,42,sizeof out);
      r=fmt_str(out,cap,in);
      printf("%d:",r);for(int j=0;j<32;j++)printf("%02x",(unsigned char)out[j]);putchar('\n');
    }
  }
}''')
    native=td/'native'
    proc=subprocess.run(['clang++',str(SRC),str(driver),'-o',str(native)],capture_output=True,text=True,timeout=40)
    assert proc.returncode==0,proc.stderr
    run=subprocess.run([str(native)],capture_output=True,text=True,timeout=40)
    assert run.returncode==0,run.stderr
    entry=td/'driver.mjs'
    entry.write_text('import * as m from '+json.dumps(mod.as_uri())+''';
for(let i=0;i<128;i++){
 const out=new Uint8Array(256);
 const a=i*104729-6000000,b=(i*119723183)>>>0;
 const asText=()=>String.fromCharCode(...out.subarray(0,out.indexOf(0)));
 let r=m.fmt_signed(out,a,b);console.log(r+':'+asText());
 out.fill(0);r=m.fmt_width(out,a,i%13+1,i%8);console.log(r+':'+asText());
 out.fill(0);r=m.fmt_oct(out,b);console.log(r+':'+asText());
 const input=new Uint8Array(64);for(let j=0;j<(i*7)%24;j++)input[j]=65+(i+j)%26;
 for(let cap=0;cap<34;cap+=11){
   out.fill(42);r=m.fmt_str(out,cap,input);
   console.log(r+':'+Array.from(out.subarray(0,32),v=>v.toString(16).padStart(2,'0')).join(''));
 }
}
''')
    test=subprocess.run(['node',str(entry)],capture_output=True,text=True,timeout=40)
    assert test.returncode==0,test.stderr[-1500:]
    expected=run.stdout.splitlines();observed=test.stdout.splitlines()
    assert len(expected)==len(observed)==128*7,(len(expected),len(observed))
    for index,(a,b) in enumerate(zip(expected,observed)):
        assert a==b,(index,a,b)
    guard=td/'guards.mjs'
    guard.write_text((ROOT/'tools/source_byte_memory_runtime.mjs').read_text()+'''
const fmt=Uint8Array.from([37,115,0]);
const bad=f=>{let thrown=false;try{f()}catch(e){thrown=e instanceof RangeError||e instanceof TypeError}if(!thrown)throw Error('missing strict printf guard')};
bad(()=>cByteMemory.sprintf(new Uint8Array(2),Uint8Array.from([65,66,67,0])));
bad(()=>cByteMemory.sprintf(new Uint8Array(5),fmt,Uint8Array.from([65,66,67,68,69,0])));
bad(()=>cByteMemory.snprintf(new Uint8Array(1),2,fmt,Uint8Array.from([65,0])));
bad(()=>cByteMemory.snprintf(new Uint8Array(8),8,Uint8Array.from([37,110,0]),{}));
bad(()=>cByteMemory.sprintf(new Uint8Array(8),Uint8Array.from([37,115,0]),Uint8Array.from([65,66])));
if(cByteMemory.snprintf(null,0,fmt,Uint8Array.from([65,66,0]))!==2)throw Error('n=0 return contract');
''')
    guard_result=subprocess.run(['node',str(guard)],capture_output=True,text=True,timeout=40)
    assert guard_result.returncode==0,guard_result.stderr
print('PASS: 896 native C++/JS printf output and return parity comparisons; bounded destination and format-conversion guards')
