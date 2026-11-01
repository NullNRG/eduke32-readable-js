// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/build/src/sdlayer.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
import { __cxx_global_cell_b3926346e92cac557f00175c } from "./sdlayer.cpp.mjs";
import { __cxx_global_cell_56606cfee73eb8d6c7d57541 } from "./sdlayer.cpp.mjs";
import { calc_ylookup } from "./baselayer.cpp.mjs";
import { __cxx_global_cell_f0c9c3446e396d6353338d7e } from "./sdlayer.cpp.mjs";
import { __cxx_global_cell_9541123d8c6d2c52896ac26a } from "./engine.cpp.mjs";
import { __cxx_global_cell_82b1d07c07b2d44b437f8e68 } from "./sdlayer.cpp.mjs";
import { __cxx_global_cell_96cc27380f17556df4ccc300 } from "./engine.cpp.mjs";
import { __cxx_global_cell_1fc8813e2419d4023365727f } from "./sdlayer.cpp.mjs";
import { __cxx_global_cell_93d7c17084d3a8832fd9f6c6 } from "./sdlayer.cpp.mjs";
import { softsurface_getBuffer } from "./softsurface.cpp.mjs";
import { __cxx_global_cell_22f848239c12c0d9f2b6f9e3 } from "./engine.cpp.mjs";
import { __cxx_global_cell_ce636929c03d679219ea2982 } from "./engine.cpp.mjs";

// LP64 source object addresses over native JavaScript storage. No instructions
// or virtual machine are executed. Pointer slots and uintptr_t use these SAME
// bits; arithmetic remains ordinary generated JavaScript/BigInt arithmetic.
const cSourceAddresses = (() => {
  const abi='source-lp64-addresses/2', abiKey=Symbol.for('source-first.native-pointer-abi');
  if(globalThis[abiKey] && globalThis[abiKey]!==abi)
    throw new TypeError('Incompatible source pointer representation');
  if(globalThis[Symbol.for('source-first.byte-record-pointer-identities/1')])
    throw new TypeError('Legacy pointer tokens cannot share LP64 address storage');
  globalThis[abiKey]=abi;
  const key=Symbol.for(abi);
  if(globalThis[key])return globalThis[key];
  const byBuffer=new WeakMap(),regions=[],opaque=new WeakMap(),byBits=new Map();
  let nextRegion=0x10000000000n,nextOpaque=0xffff000000000000n;
  const heapKey=Symbol.for('source-first.native-C-heap/2');
  const heap=()=>globalThis[heapKey];
  const regionFor=buffer=>{
    if(!(buffer instanceof ArrayBuffer))throw new TypeError('C address requires original byte storage');
    let region=byBuffer.get(buffer);
    if(!region){
      if(buffer.byteLength>0x100000000)throw new RangeError('C address region exceeds 4 GiB');
      const native=heap();
      region={buffer,base:native?.buffer===buffer?0n:nextRegion};
      if(region.base!==0n){nextRegion+=0x200000000n;if(nextRegion>=nextOpaque)throw new RangeError('LP64 source address capacity exceeded');}
      regions.push(region);byBuffer.set(buffer,region);
    }
    if(region.base===0n&&heap()?.buffer!==buffer)throw new TypeError('Original C heap identity changed');
    return region;
  };
  const liveBounds=(buffer,offset,width=0)=>{
    if(!Number.isSafeInteger(offset)||!Number.isSafeInteger(width)||offset<0||width<0)
      throw new RangeError('Invalid original C pointer bounds');
    const cpp=globalThis[Symbol.for('source-first.cpp-heap/1')]?.buffers.get(buffer);
    if(cpp&&!cpp.live)throw new RangeError('C pointer addresses deleted C++ storage');
    const native=heap();
    if(native?.buffer===buffer){
      for(const [base,size] of native.allocations){
        if(offset>=base&&offset+width<=base+size)return {lower:base,upper:base+size};
      }
      throw new RangeError('C pointer addresses freed or unallocated heap storage');
    }
    if(!Number.isSafeInteger(offset)||offset<0||offset+width>buffer.byteLength)
      throw new RangeError('C pointer address escapes original byte storage');
    return {lower:0,upper:buffer.byteLength};
  };
  const canonical=value=>{
    if(value?.__cDeferredPointer===true||value?.__cDeferredReference===true)return canonical(value.resolve());
    const bytes=value?.[Symbol.for('source-first.original-byte-record-storage/1')]?.bytes||
      value?.[Symbol.for('source-first.clang-byte-record-array/1')];
    if(bytes)return {buffer:bytes.buffer,offset:bytes.byteOffset};
    if(ArrayBuffer.isView(value))return {buffer:value.buffer,offset:value.byteOffset};
    if(value?.__cPointer===true){
      const arrayBytes=value.array&&value.buffer?.[Symbol.for('source-first.clang-byte-record-array/1')];
      if(arrayBytes)return {buffer:arrayBytes.buffer,offset:arrayBytes.byteOffset+value.offset};
      if(!value.array)return {buffer:value.buffer,offset:value.offset};
      // Managed non-byte C++ objects retain identity but do not acquire an
      // invented byte layout. Integer arithmetic on opaque addresses fails.
      if(value.offset===0&&globalThis[Symbol.for('source-first.cpp-heap/1')]?.objects.get(value.buffer?.[0]))
        return {owner:value.buffer[0],value:value.buffer[0]};
      throw new TypeError('C integer address requires proven contiguous byte storage');
    }
    if(value?.__cReference===true){
      if(value.value?.[Symbol.for('source-first.original-byte-record-storage/1')])return canonical(value.value);
      return {owner:value,value};
    }
    if(typeof value==='function'||Array.isArray(value)||globalThis[Symbol.for('source-first.cpp-heap/1')]?.objects.get(value))
      return {owner:value,value};
    throw new TypeError('C address requires original storage, lvalue or callable');
  };
  const api={abi,
    encode(value){
      const seen=new Set();
      while(value?.__cDeferredPointer===true||value?.__cDeferredReference===true){
        if(seen.has(value))throw new TypeError('Cyclic original static pointer relocation');
        seen.add(value);value=value.resolve();
      }
      if(value===null)return 0n;
      const item=canonical(value);
      if(item.buffer){
        const region=regionFor(item.buffer);liveBounds(item.buffer,item.offset);
        const bits=region.base+BigInt(item.offset);
        if(!byBits.has(bits))byBits.set(bits,value);
        return bits;
      }
      if(!opaque.has(item.owner)){
        if(nextOpaque>0xfffffffffffffff8n)throw new RangeError('C opaque address capacity exceeded');
        opaque.set(item.owner,nextOpaque);byBits.set(nextOpaque,item.value);nextOpaque+=8n;
      }
      return opaque.get(item.owner);
    },
    decode(value){
      if(typeof value!=='bigint'&&!(typeof value==='number'&&Number.isSafeInteger(value)))
        throw new TypeError('C integer address must be exactly representable');
      const bits=BigInt.asUintN(64,BigInt(value));
      if(bits===0n)return null;
      if(byBits.has(bits)){
        const value=byBits.get(bits),allocation=globalThis[Symbol.for('source-first.cpp-heap/1')]?.objects.get(value);
        if(allocation&&!allocation.live)throw new RangeError('C address refers to a destroyed C++ object');
        const item=canonical(value);if(item.buffer)liveBounds(item.buffer,item.offset);
        return value;
      }
      for(const region of regions){
        const offset=bits-region.base;
        if(offset<0n||offset>BigInt(region.buffer.byteLength))continue;
        const at=Number(offset),bounds=liveBounds(region.buffer,at);
        return {__cPointer:true,buffer:region.buffer,offset:at,array:false,...bounds};
      }
      throw new TypeError('Unknown original C pointer address');
    },
    assert(buffer,offset,width=0){liveBounds(buffer,offset,width);},
    forgetHeap(base,size){
      const start=BigInt(base),end=start+BigInt(size);
      for(const bits of byBits.keys())if(bits>=start&&bits<=end)byBits.delete(bits);
    },
    forgetAllocation(value){
      if(value===undefined)return;
      const item=canonical(value);
      if(item.buffer){
        const region=byBuffer.get(item.buffer);
        if(region&&region.base!==0n){
          const end=region.base+BigInt(region.buffer.byteLength);
          for(const bits of byBits.keys())if(bits>=region.base&&bits<=end)byBits.delete(bits);
          regions.splice(regions.indexOf(region),1);byBuffer.delete(item.buffer);
        }
      }else if(opaque.has(item.owner)){
        byBits.delete(opaque.get(item.owner));opaque.delete(item.owner);
      }
    },
    registerHeap(native){
      if(heap()&&heap()!==native)throw new TypeError('Cannot replace the original source C heap');
      if(byBuffer.has(native.buffer)&&byBuffer.get(native.buffer).base!==0n)
        throw new TypeError('C heap was previously registered as foreign storage');
      globalThis[heapKey]=native;regionFor(native.buffer);
    }
  };
  globalThis[key]=api;return api;
})();

const i32 = value => typeof value === "bigint" ? Number(BigInt.asIntN(32,value)) : Number(value) | 0;
const u32 = value => typeof value === "bigint" ? Number(BigInt.asUintN(32,value)) : Number(value) >>> 0;
const i64 = value => BigInt.asIntN(64, BigInt(value));

// C/C++ source: source/build/src/sdlayer.cpp:1955
let __static_videoBeginDrawing_backupFrameplace = i64(0);
export function videoBeginDrawing() {
  if ((__cxx_global_cell_b3926346e92cac557f00175c().value > 8)) {
    if (Boolean(__cxx_global_cell_93d7c17084d3a8832fd9f6c6().value)) {
      return;
    }
    (__cxx_global_cell_f0c9c3446e396d6353338d7e().value = i64(0));
    (__cxx_global_cell_56606cfee73eb8d6c7d57541().value = i32(0));
    (__cxx_global_cell_1fc8813e2419d4023365727f().value = (u32((u32(0) & 255)) & 255));
    return;
  }
  if ((((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(__cxx_global_cell_82b1d07c07b2d44b437f8e68()) > 0)) {
    return;
  }

  if (Boolean(__cxx_global_cell_9541123d8c6d2c52896ac26a().value)) {
    if (Boolean(__cxx_global_cell_93d7c17084d3a8832fd9f6c6().value)) {
      if ((!Boolean(__static_videoBeginDrawing_backupFrameplace))) {
        (__static_videoBeginDrawing_backupFrameplace = i64(__cxx_global_cell_f0c9c3446e396d6353338d7e().value));
      } else {
        if (((__cxx_global_cell_f0c9c3446e396d6353338d7e().value != i64(cSourceAddresses.encode(__cxx_global_cell_96cc27380f17556df4ccc300().value))) && (__cxx_global_cell_f0c9c3446e396d6353338d7e().value != __static_videoBeginDrawing_backupFrameplace))) {
          return;
        }
      }
    }
    (__cxx_global_cell_f0c9c3446e396d6353338d7e().value = i64(cSourceAddresses.encode(__cxx_global_cell_96cc27380f17556df4ccc300().value)));
    if (Boolean(__cxx_global_cell_93d7c17084d3a8832fd9f6c6().value)) {
      return;
    }
  } else {
    if (Boolean(__cxx_global_cell_93d7c17084d3a8832fd9f6c6().value)) {
      if (Boolean(__static_videoBeginDrawing_backupFrameplace)) {
        (__cxx_global_cell_f0c9c3446e396d6353338d7e().value = i64(__static_videoBeginDrawing_backupFrameplace));
        (__static_videoBeginDrawing_backupFrameplace = i64(0));
      }
      return;
    } else {
      (__cxx_global_cell_f0c9c3446e396d6353338d7e().value = i64(cSourceAddresses.encode(softsurface_getBuffer())));
    }
  }
  if (Boolean(__cxx_global_cell_1fc8813e2419d4023365727f().value)) {
    (__cxx_global_cell_56606cfee73eb8d6c7d57541().value = i32(__cxx_global_cell_22f848239c12c0d9f2b6f9e3().value));
    calc_ylookup(__cxx_global_cell_56606cfee73eb8d6c7d57541().value, __cxx_global_cell_ce636929c03d679219ea2982().value);
    (__cxx_global_cell_1fc8813e2419d4023365727f().value = (u32((u32(0) & 255)) & 255));
  }
}
