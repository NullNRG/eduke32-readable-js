"""Native floating parsing through numeric and byte-backed source pointers."""
import json,subprocess,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def run(args,cwd):
    p=subprocess.run(list(map(str,args)),cwd=cwd,capture_output=True,text=True,timeout=120)
    assert p.returncode==0,(p.stdout,p.stderr)
    return p.stdout
cases=['  -12.5e2xyz','0x1.8p+2 rest','42','abc','-Infinity!',
       'nan(payload)!',' -0tail','1e999!','1e-999!','1e+tail','\t.375end','+7.25E-2x']
with tempfile.TemporaryDirectory() as scratch:
    root=Path(scratch);cpp=root/'oracle.cpp';exe=root/'oracle.exe'
    cpp.write_text('''#include <cstdio>
#include <cstdlib>
#include <cstdint>
#include <cstring>
#include <cmath>
#include <cerrno>
int main(){const char* inputs[]={'''+','.join(json.dumps(s) for s in cases)+r'''};
for(const char* s:inputs){char* end;errno=0;double v=strtod(s,&end);
uint64_t bits;memcpy(&bits,&v,8);if(std::isnan(v))printf("nan");
else printf("%016llx",(unsigned long long)bits);
printf(" %lld %d\n",(long long)(end-s),errno);}}
''')
    run(['clang++',cpp,'-o',exe],root)
    expected=[line.split() for line in run([exe],root).splitlines()]
    script=root/'test.mjs'
    imports='import assert from "node:assert/strict";'
    for module,names in [('abi.mjs','ABIHeap'),('stdlib.mjs','createStdlib'),('source_bytes.mjs','sourceByteView')]:
        imports+='import { '+names+' } from '+json.dumps((ROOT/'runtime'/module).as_uri())+';'
    script.write_text(imports+r'''
const inputs=INPUTS,expected=EXPECTED,heap=new ABIHeap(),s=createStdlib({heap}).symbols;
const err=s.__errno_location(),endSlot=heap.malloc(8);
const bits=v=>{if(Number.isNaN(v))return 'nan';
 const a=new ArrayBuffer(8),d=new DataView(a);d.setFloat64(0,v);
 return d.getBigUint64(0).toString(16).padStart(16,'0');};
let count=0;
for(let k=0;k<inputs.length;k++){
 const encoded=Uint8Array.from([...new TextEncoder().encode(inputs[k]),0]);
 for(const kind of ['numeric','view','pointer']){
  const address=heap.malloc(encoded.length+14);heap.u8.set(encoded,address+7);
  const view=heap.borrow(address+7,encoded.length);
  const input=kind==='numeric'?address+7:kind==='view'?view:
   {__cPointer:true,buffer:view.buffer,lower:view.byteOffset-7,
    upper:view.byteOffset+view.length,offset:view.byteOffset,array:false};
  const ref={__cReference:true,value:null};heap.write(err,'i32',0);
  const value=s.strtod(input,kind==='numeric'?endSlot:ref);let used;
  if(kind==='numeric')used=Number(heap.read(endSlot,'u64'))-input;
  else{const tail=sourceByteView(ref.value);assert.equal(tail.buffer,view.buffer);
   used=tail.byteOffset-view.byteOffset;
   if(expected[k][1]==='0')assert.equal(ref.value,input);
   if(kind==='pointer'&&used)assert.equal(ref.value.upper,input.upper);}
  assert.deepEqual([bits(value),String(used),String(heap.read(err,'i32'))],expected[k]);
  heap.free(address);count++;
 }
}
assert.throws(()=>s.strtod(Uint8Array.of(49,50),null),/NUL-terminated/);
assert.throws(()=>s.strtod(Uint8Array.of(49,0),endSlot),/reference storage/);
console.log('PASS '+count+' native/source-pointer floating conversions, original aliases and checked bounds');
'''.replace('INPUTS',json.dumps(cases)).replace('EXPECTED',json.dumps(expected)))
    print(run(['node',script],ROOT).strip())
