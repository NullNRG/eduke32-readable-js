"""Original typed CON array/scalar readers versus native source excerpts."""
import hashlib,json,re,subprocess,tempfile
from pathlib import Path
from verify_original_demo_snapshot_heap import ROOT,run_browser_probe
from original_probe_evidence import current_inputs,unchanged_inputs

def function(text,start):
 begin=text.index(start);opening=text.index('{',begin);depth=1;end=opening+1
 while depth:
  depth+=(text[end]=='{')-(text[end]=='}');end+=1
 return text[begin:end]

if __name__=='__main__':
 profile=json.loads((ROOT/'tools/browser_classic_profile.json').read_text());source=ROOT/profile['prepared_source_root']
 header=(source/'source/duke3d/src/gamevars.h').read_text();cpp=(source/'source/duke3d/src/gamevars.cpp').read_text();labels=(source/'source/duke3d/src/gamedef.h').read_text()
 enum=re.search(r'enum GamearrayFlags_t\s*\{.*?\};',header,re.S)[0]
 end=header.index('} gamearray_t;')+len('} gamearray_t;');record=header[header.rfind('typedef struct',0,end):end]
 maxdefs='\n'.join(re.findall(r'(?m)^#\s*define MAXGAME(?:VARS|ARRAYS)[^\n]*',header))
 labeldefs='\n'.join(re.findall(r'(?m)^#define LABEL_(?:CHAR|SHORT|INT|UNSIGNED)\s[^\n]*',labels))
 bodies='\n'.join([function(cpp,'unsigned __fastcall Gv_GetArrayElementSize('),function(cpp,'size_t __fastcall Gv_GetArrayAllocSizeForCount('),
  function(header,'static FORCE_INLINE size_t Gv_GetArrayAllocSize('),function(header,'static FORCE_INLINE int __fastcall Gv_GetArrayValue('),
  '#define LABEL_TYPES (LABEL_CHAR|LABEL_SHORT|LABEL_INT|LABEL_UNSIGNED)',function(header,'static inline int __fastcall VM_GetStruct(')])
 native='#include <cstdio>\n#include "compat.h"\n'+maxdefs+'\n'+labeldefs+'\n'+enum+'\n#pragma pack(push,1)\n'+record+'\n#pragma pack(pop)\ngamearray_t aGameArrays[MAXGAMEARRAYS];\n'+bodies+r'''
int main(){int f[]={0,GAMEARRAY_INT16,GAMEARRAY_INT8,GAMEARRAY_UINT16,GAMEARRAY_UINT8,GAMEARRAY_BITMAP};
 printf("F,%zu",sizeof(gamearray_t));for(int v:f)printf(",%d",v);printf(",%d\n",GAMEARRAY_STRIDE2);
 intptr_t wide[64];int16_t s16[64];uint16_t u16[64];int8_t s8[64];uint8_t u8[64];
 for(int j=0;j<64;j++){wide[j]=(intptr_t(1)<<34)+j*73-1000;s16[j]=j*73-1000;u16[j]=j*1007;s8[j]=(j%25)*7-100;u8[j]=j*5+9;}
 for(int mode=0;mode<6;mode++)for(int stride=0;stride<2;stride++){
  void*data=mode==0?(void*)wide:mode==1?(void*)s16:mode==2?(void*)s8:mode==3?(void*)u16:(void*)u8;
  aGameArrays[0].pValues=(intptr_t*)data;aGameArrays[0].size=47;aGameArrays[0].flags=f[mode]|(stride?GAMEARRAY_STRIDE2:0);
  printf("A,%d,%d,%zu",mode,stride,Gv_GetArrayAllocSize(0));for(int i=0;i<16;i++)printf(",%d",Gv_GetArrayValue(0,i));printf("\n");
 }
 int flags[]={LABEL_CHAR,LABEL_CHAR|LABEL_UNSIGNED,LABEL_SHORT,LABEL_SHORT|LABEL_UNSIGNED,LABEL_INT,LABEL_INT|LABEL_UNSIGNED};
 for(int mode=0;mode<6;mode++)for(int i=0;i<64;i++){
  alignas(8) int8_t a=i-32;alignas(8) uint8_t b=i*7;alignas(8) int16_t c=i*333-10000;alignas(8) uint16_t d=i*1007;
  alignas(8) int32_t e=-1000000+i*100003;alignas(8) uint32_t f=0xdead0000u+i*1231u;
  void*data=mode==0?(void*)&a:mode==1?(void*)&b:mode==2?(void*)&c:mode==3?(void*)&d:mode==4?(void*)&e:(void*)&f;
  printf("S,%d,%d,%d\n",mode,i,VM_GetStruct(flags[mode],(intptr_t*)data));
 }}
'''
 with tempfile.TemporaryDirectory(prefix='original-vm-array-') as folder:
  folder=Path(folder);unit=folder/'oracle.cpp';exe=folder/'oracle.exe';unit.write_text(native)
  flags=['-std=c++14','-funsigned-char','-DNOASM','-DNDEBUG','-DEDUKE32_BROWSER=1']
  flags+=['-I'+str(source/p) for p in ('source/build/include','platform/Windows/include','platform/Windows/include/SDL2')]
  p=subprocess.run(['clang++',*flags,str(unit),'-o',str(exe)],capture_output=True,text=True);assert p.returncode==0,p.stderr
  expected=subprocess.check_output([str(exe)],text=True).splitlines()
 meta=[int(v) for v in expected.pop(0).split(',')[1:]];assert meta[0]==32,meta
 probe=r'''async base=>{
 const {NativeRuntime}=await import('/runtime/index.mjs');const r=new NativeRuntime({renderer:'canvas2d',memoryBytes:16<<20});r.bindSourceMemory();
 const release=(await import(base+'/browser-abi/libc_provider.mjs')).bindBrowserC(r);const ptr=r.heap.malloc(512,8);
 try{const g=await import(base+'/source/duke3d/src/gameexec.cpp.mjs'),v=await import(base+'/source/duke3d/src/gamevars.cpp.mjs');
 const slot=v.aGameArrays[0],address=globalThis[Symbol.for('source-lp64-addresses/2')],rows=[],view=()=>new DataView(r.heap.buffer),f=FLAGS;
 slot.pValues=address.decode(BigInt(ptr));slot.size=47n;
 for(let mode=0;mode<6;mode++)for(let stride=0;stride<2;stride++){
  for(let j=0;j<64;j++){if(mode===0)view().setBigInt64(ptr+j*8,(1n<<34n)+BigInt(j*73-1000),true);else if(mode===1)view().setInt16(ptr+j*2,j*73-1000,true);else if(mode===2)view().setInt8(ptr+j,(j%25)*7-100);else if(mode===3)view().setUint16(ptr+j*2,j*1007,true);else view().setUint8(ptr+j,j*5+9);}
  slot.flags=BigInt(f[mode]|(stride?STRIDE:0));const values=['A',mode,stride,g.Gv_GetArrayAllocSize(0).toString()];for(let i=0;i<16;i++)values.push(g.Gv_GetArrayValue(0,i));rows.push(values.join(','));
 }
 const labelFlags=[1,9,2,10,4,12];for(let mode=0;mode<6;mode++)for(let i=0;i<64;i++){
  if(mode===0)view().setInt8(ptr,i-32);else if(mode===1)view().setUint8(ptr,i*7);else if(mode===2)view().setInt16(ptr,i*333-10000,true);else if(mode===3)view().setUint16(ptr,i*1007,true);else if(mode===4)view().setInt32(ptr,-1000000+i*100003,true);else view().setUint32(ptr,0xdead0000+i*1231,true);
  rows.push(['S',mode,i,g.VM_GetStruct(labelFlags[mode],address.decode(BigInt(ptr)))].join(','));
 }
 const marker=Symbol.for('source-first.original-byte-record-storage/1');return {rows,array_record_bytes:slot[marker]?.bytes?.length??null};
 }finally{r.heap.free(ptr);release();r.close();}
}'''.replace('FLAGS',json.dumps(meta[1:7])).replace('STRIDE',str(meta[7]))
 inputs=current_inputs();actual=run_browser_probe(probe);assert actual['array_record_bytes']==meta[0],actual['array_record_bytes']
 assert actual['rows']==expected,next(((i,a,b) for i,(a,b) in enumerate(zip(actual['rows'],expected)) if a!=b),None)
 report={'verified':True,'functions':['Gv_GetArrayValue','Gv_GetArrayAllocSize','VM_GetStruct'],'native_chromium_values':12*17+6*64,
  'array_storage_modes':6,'stride_modes':2,'scalar_storage_modes':6,'original_array_record_bytes':meta[0],
  'native_oracle_sha256':hashlib.sha256(native.encode()).hexdigest(),'results_sha256':hashlib.sha256(json.dumps(expected).encode()).hexdigest(),'gameplay_verified':False}
 report.update(unchanged_inputs(inputs));report['chromium_version']=actual['chromium_version']
 (ROOT/'reports/nov23-original-vm-array-access.json').write_text(json.dumps(report,indent=2)+'\n');print('PASS',report['native_chromium_values'],'original typed array/scalar native/Chromium values')
