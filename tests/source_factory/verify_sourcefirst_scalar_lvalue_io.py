"""Synchronous file reads commit native-width bytes into original scalar lvalues."""
import json,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def run(args,cwd):
    p=subprocess.run(list(map(str,args)),cwd=cwd,capture_output=True,text=True,timeout=180)
    assert p.returncode==0,(p.stdout[-1600:],p.stderr[-2200:])
    return p.stdout
cases=[('signed char','g8','17','Int8Array'),('short','g16','0x1234','Int16Array'),('unsigned int','g32','0x12345678u','Uint32Array'),('long long','g64','0x1122334455667788ll','BigInt64Array'),('float','gf','1.5f','Float32Array'),('double','gd','1.5','Float64Array')]
with tempfile.TemporaryDirectory() as folder:
    root=Path(folder);source='\n'.join(typ+' '+name+' = '+initial+';\nextern "C" '+typ+' *address_'+name+'(){return &'+name+';}' for typ,name,initial,_ in cases)
    source+='\nextern "C" void reset(){'+''.join(name+'='+initial+';' for _,name,initial,_ in cases)+'}\n';(root/'unit.cpp').write_text(source)
    driver='#include <cstdio>\n#include <cstring>\n'+''.join('extern '+typ+' '+name+';\n' for typ,name,_,_ in cases)+'extern "C" void reset();int main(){unsigned char data[8]={32,43,54,65,76,87,98,109};\n'
    for _,name,_,_ in cases:driver+='for(unsigned n=0;n<=sizeof('+name+');n++){reset();memcpy(&'+name+',data,n);printf("'+name+' %u ",n);for(unsigned i=0;i<sizeof('+name+');i++)printf("%02x",((unsigned char*)&'+name+')[i]);puts("");}\n'
    driver+='}';(root/'main.cpp').write_text(driver);exe=root/'native.exe';run(['clang++',root/'unit.cpp',root/'main.cpp','-o',exe],root);expected=[s.split() for s in run([exe],root).splitlines()]
    out=root/'out';run([sys.executable,ROOT/'tools/source_ast_to_js.py','--root',root,'--source','unit.cpp','--out-dir',out,'--require-record-layouts'],ROOT)
    doc=json.loads((out/'unit.cpp.manifest.json').read_text());assert doc['blocked']==0,doc
    script=root/'run.mjs'
    script.write_text('import assert from "node:assert/strict";import {NativeRuntime} from '+json.dumps((ROOT/'runtime/index.mjs').as_uri())+';import {sourceHeapAddress,sourceOutputBytes} from '+json.dumps((ROOT/'runtime/source_bytes.mjs').as_uri())+';const m=await import('+json.dumps((out/'unit.cpp.mjs').as_uri())+');\n'+r'''
const runtime=new NativeRuntime(),heap=runtime.heap,s=runtime.library.symbols;
const names=TYPES,expected=EXPECTED,data=Uint8Array.of(32,43,54,65,76,87,98,109);
runtime.fs.mountBytes('bytes.bin',data);const path=Uint8Array.from([...new TextEncoder().encode('bytes.bin'),0]);
const hex=bytes=>Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
try{
 for(const [name,n,want]of expected){m.reset();const ref=m['address_'+name]();assert.equal(ref,m['address_'+name]());
  assert.throws(()=>sourceHeapAddress(ref,heap),/own heap/);
  const fd=s.open(path,0);assert(fd>=0);assert.equal(s.read(fd,ref,Number(n)),BigInt(n));s.close(fd);
  const Type=globalThis[names[name]],a=new Type([m[name]]);assert.equal(hex(new Uint8Array(a.buffer)),want,[name,n]);
 }
 const ref=m.address_g16();m.reset();const value=m.g16,fd=s.open(path,0);
 assert.throws(()=>s.read(fd,ref,3),/type width/);assert.equal(m.g16,value);assert.equal(s.lseek(fd,0,1),0n);
 s.lseek(fd,8,0);assert.equal(s.read(fd,ref,2),0n);assert.equal(m.g16,value);s.close(fd);
 assert.equal(s.read(-9,ref,2),-1);assert.equal(m.g16,value);
 assert.throws(()=>sourceOutputBytes({__cReference:true,value:1},2,heap),/own heap/);
 const empty=sourceOutputBytes(ref,0,heap);empty.commit(0);assert.throws(()=>empty.commit(0),/already committed/);
 console.log('PASS '+expected.length+' native/JS scalar file-read states, exact widths, partial-byte preservation, original lvalue identity, EOF/error behavior and rejected allocation ownership');
}finally{runtime.close();}
'''.replace('TYPES',json.dumps({n:t for _,n,_,t in cases})).replace('EXPECTED',json.dumps(expected)))
    print(run(['node',script],ROOT).strip())
