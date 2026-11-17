// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/duke3d/src/gamevars.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
import { Alloc__cxx_static_e0036cfb06bcfe42 } from "../../build/src/smmalloc_generic.cpp.mjs";
import { __cxx_global_cell_4f8061263e8b951c81aacfd0 } from "./dnames.cpp.mjs";
import { __cxx_global_cell_be5f3f16c99aa0c4c7540262 } from "./dnames.cpp.mjs";
import { __cxx_global_cell_e0021f00946f9fcef1493fe8 } from "./dnames.cpp.mjs";
import { C_ReportError } from "./gamedef.cpp.mjs";
import { __cxx_global_cell_9290bc0bb3f2727885bdfb0e } from "./dnames.cpp.mjs";
import { __cxx_global_cell_2fbb894c12ee103752b36559 } from "./dnames.cpp.mjs";
import { __cxx_global_cell_0aa6eda7dfb9c2ede217d4d4 } from "./dnames.cpp.mjs";
import { Free__cxx_static_0dfd3f42f0dc2c05 } from "../../build/src/smmalloc_generic.cpp.mjs";
import { __cxx_global_cell_182ff03ee4fe21aadf00a8be } from "./dnames.cpp.mjs";
import { __cxx_global_cell_a1135ec6e3c71ee50e4480df } from "./dnames.cpp.mjs";
import { __cxx_global_cell_57ca2f37062e039be72ab5d5 } from "./dnames.cpp.mjs";
import { __cxx_global_cell_0a348ba1bfc02b77af7e4204 } from "./dnames.cpp.mjs";
import { __cxx_global_cell_81a5050f1681bde302982f87 } from "./dnames.cpp.mjs";
import { __cxx_global_cell_725e88840cca111651e3276d } from "./dnames.cpp.mjs";
import { __cxx_global_cell_9871087b1b184d775c972766 } from "./dnames.cpp.mjs";
import { __cxx_global_cell_c4e9a6dc8cec5d981f8c75e7 } from "./dnames.cpp.mjs";
import { __cxx_global_cell_665d998270647c7ad8e0914d } from "./dnames.cpp.mjs";
import { __cxx_global_cell_0371d4defc194a93e64fb6eb } from "./dnames.cpp.mjs";
import { __cxx_global_cell_87081bf72dadfcd3df68bcc9 } from "./dnames.cpp.mjs";
import { __cxx_global_cell_f98f9d6620fc4928caeacaf6 } from "./dnames.cpp.mjs";
import { __cxx_global_cell_8ececfce0f4eb45cc64fe82b } from "./dnames.cpp.mjs";
import { __cxx_global_cell_1b018f3cb172f441e7f0f065 } from "./dnames.cpp.mjs";
import { __cxx_global_cell_67305eaca81f492a2d16db0d } from "./dnames.cpp.mjs";
import { __cxx_global_cell_1b705b619540483e827fd6ea } from "./dnames.cpp.mjs";
import { bfdivtable32 } from "../../build/src/pragmas.cpp.mjs";
import { current_verbosity_cutoff } from "../../build/src/loguru.cpp.mjs";
import { divtable64 } from "../../build/src/pragmas.cpp.mjs";
import { __cxx_global_cell_a9ed12f504f4bd101d4746c6 } from "./gamedef.cpp.mjs";
import { __cxx_global_cell_6742302ef915e025d82bcd36 } from "./global.cpp.mjs";
import { __cxx_global_cell_06245cf7a06b2fd69750f440 } from "./gamedef.cpp.mjs";
import { g_scriptFileName } from "./gamedef.cpp.mjs";
import { __cxx_global_cell_11016d3c7177543e564ab46c } from "../../build/src/compat.cpp.mjs";
import { __cxx_global_cell_079877be927e9ceeb785b6a6 } from "../../build/src/baselayer.cpp.mjs";
import { __cxx_global_cell_778291b6375dd09957e56c1b } from "./gamedef.cpp.mjs";
import { __cxx_global_cell_36ecf5b982ca5148a2b52931 } from "./gamestructures.cpp.mjs";
import { __cxx_global_cell_f0457d06edefc3c775e2c32f } from "./gamedef.cpp.mjs";
import { __cxx_global_cell_2d12a4ce62b5a2309382b8ea } from "./gamedef.cpp.mjs";
import { __cxx_global_cell_4dfc2df4beaabb17f13a2a11 } from "./gamestructures.cpp.mjs";
import { __cxx_global_cell_1b64352a65c97cbeac4d8dc1 } from "./gamestructures.cpp.mjs";
import { __cxx_global_cell_1edb9adc2ad33f7dab0cc065 } from "./gamestructures.cpp.mjs";
import { __cxx_global_cell_5369c12f5151e4651feb6d69 } from "./gamestructures.cpp.mjs";
import { __cxx_global_cell_1f238d951ac2733554cfa6c9 } from "./gamestructures.cpp.mjs";
import { __cxx_global_cell_12f6357b924ceaa4592192e7 } from "./gamestructures.cpp.mjs";
import { __cxx_global_cell_55925c071ef91c407236ca84 } from "./gamestructures.cpp.mjs";
import { __cxx_global_cell_6fc9ea499f8ee974932947d6 } from "./gamestructures.cpp.mjs";
import { __cxx_global_cell_7b44353bd3d207ee6f04360e } from "./gamestructures.cpp.mjs";
import { handle_memerr } from "../../build/src/compat.cpp.mjs";
import { hash_add } from "../../build/src/hash.cpp.mjs";
import { hash_find } from "../../build/src/hash.cpp.mjs";
import { initputs } from "../../build/src/baselayer.cpp.mjs";
import { __cxx_global_cell_1aca80e8b55c802f7b43740d } from "./global.cpp.mjs";
import { __cxx_global_cell_b6db0759e33cdbb028a91dc6 } from "../../build/src/pragmas.cpp.mjs";
import { __cxx_global_cell_f8287b2e627d0e3f51b90c55 } from "../../build/src/pragmas.cpp.mjs";
import { libdivide_s32_branchfree_do } from "../../../browser-abi/libdivide_source.mjs";
import { libdivide_s32_branchfree_gen } from "../../../browser-abi/libdivide_provider.mjs";
import { libdivide_s64_do } from "../../../browser-abi/libdivide_source.mjs";
import { libdivide_s64_gen } from "../../../browser-abi/libdivide_provider.mjs";
import { loguru_log } from "../../../browser-abi/loguru_provider.mjs";
import { memset } from "../../../browser-abi/libc_provider.mjs";
import { strcat } from "../../../browser-abi/libc_provider.mjs";
import { strcpy } from "../../../browser-abi/libc_provider.mjs";
import { strlen } from "../../../browser-abi/libc_provider.mjs";
import { __cxx_global_cell_781692351a9d53402cd867ca } from "./gamedef.cpp.mjs";

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
  const byBuffer=new WeakMap(),regions=[],opaque=new WeakMap(),byBits=new Map(),functionAddresses=new Map();
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
      // An address can be both one-past one allocation and the beginning
      // of its neighbour. A raw malloc address must select its live owner.
      if(native.allocations.has(offset)){
        const size=native.allocations.get(offset);
        if(width<=size)return {lower:offset,upper:offset+size};
      }
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
      if(value?.__cFunctionAddress===true&&functionAddresses.get(value.bits)===value)return value.bits;
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
      // The browser may bind its heap before the first compiled module loads.
      // Register that real address region before decoding a malloc result.
      const native=heap();if(native)regionFor(native.buffer);
      if(byBits.has(bits)){
        const value=byBits.get(bits),allocation=globalThis[Symbol.for('source-first.cpp-heap/1')]?.objects.get(value);
        if(allocation&&!allocation.live)throw new RangeError('C address refers to a destroyed C++ object');
        const item=canonical(value);if(item.buffer)liveBounds(item.buffer,item.offset);
        return value;
      }
      for(const region of regions){
        const offset=bits-region.base;
        if(offset<0n||offset>BigInt(region.buffer.byteLength))continue;
        const at=Number(offset);let bounds;
        try{bounds=liveBounds(region.buffer,at);}
        catch(error){if(functionAddresses.has(bits))return functionAddresses.get(bits);throw error;}
        return {__cPointer:true,buffer:region.buffer,offset:at,array:false,...bounds};
      }
      if(functionAddresses.has(bits))return functionAddresses.get(bits);
      throw new TypeError('Unknown original C pointer address');
    },
    functionFromInteger(value){
      if(typeof value!=='bigint'&&!(typeof value==='number'&&Number.isSafeInteger(value)))
        throw new TypeError('Function address must be exactly representable');
      const bits=BigInt.asUintN(64,BigInt(value));
      if(bits===0n)return null;
      if(typeof byBits.get(bits)==='function')return byBits.get(bits);
      // Source-defined sentinel bits are values, not executable callbacks or
      // allocations. They can be stored/compared/round-tripped, never invoked.
      if(!functionAddresses.has(bits))functionAddresses.set(bits,Object.freeze({__cFunctionAddress:true,bits}));
      return functionAddresses.get(bits);
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



const cStackAlloc = amount => {
  if (typeof amount !== 'number' && typeof amount !== 'bigint')
    throw new TypeError('C stack allocation needs an integral byte count');
  const count=Number(amount);
  if (!Number.isSafeInteger(count) || count<0 || count>8388608)
    throw new RangeError('C stack allocation outside bounded byte extent');
  return new Uint8Array(count || 1);
};
// Bounded source-language pointer aliases over native JS typed buffers/arrays.
// Embedded in generated ES modules; never a CPU, ISA or opcode interpreter.
const cPointer = (source,addressOnly=false) => {
  if(source?.__cFunctionAddress===true)throw new TypeError('Function address has no readable data storage');
  if(typeof source==='number'||typeof source==='bigint')return cPointer(cSourceAddresses.decode(source));
  if (source?.__cDeferredPointer === true) return cPointer(addressOnly&&source.resolveAddress?source.resolveAddress():source.resolve(),addressOnly);
  if (source && source.__cPointer === true) {
    if(!source.array)globalThis[Symbol.for('source-lp64-addresses/2')]?.assert(source.buffer,source.__cAddressOnly?source.lower:source.offset);
    return source;
  }
  if(source?.__cReference===true&&source.value?.[Symbol.for('source-first.original-byte-record-storage/1')])
    return cPointer(source.value);
  const record=source?.[Symbol.for('source-first.original-byte-record-storage/1')];
  if(record)return cPointer(record.bytes);
  const allocation=source&&globalThis[Symbol.for('source-first.cpp-heap/1')]?.objects.get(source);
  if(allocation&&!allocation.live)throw new RangeError('C pointer addresses a destroyed C++ object');
  if (allocation) return {__cPointer:true,buffer:allocation.slots,lower:0,
    upper:allocation.extent,offset:0,array:true,stride:allocation.extent};
  if (Array.isArray(source)) {
    const bytes=source[Symbol.for('source-first.clang-byte-record-array/1')];
    return { __cPointer:true, buffer:source, lower:0, upper:bytes?bytes.length:source.length,
      offset:0,array:true,stride:bytes&&source.length?bytes.length/source.length:1 };
  }
  if (!ArrayBuffer.isView(source) || source instanceof DataView)
    throw new TypeError('C pointer requires bounded array storage');
  globalThis[Symbol.for('source-lp64-addresses/2')]?.assert(source.buffer,source.byteOffset,source.byteLength);
  return { __cPointer:true, buffer:source.buffer, lower:source.byteOffset,
    upper:source.byteOffset+source.byteLength, offset:source.byteOffset, array:false };
};
// A static C array address is a link-time relocation. Resolve its proven
// source owner on use, after module initialization; do not read an ESM binding
// early while merely constructing a forward/static pointer initializer.
const cStaticPointer = (resolve,resolveAddress) => ({__cDeferredPointer:true, resolve, ...(resolveAddress?{resolveAddress}:{})});
// A GNU trailing char[1] keeps its declared array size. Only pointer decay
// may borrow the remaining ORIGINAL complete heap allocation, as Clang's
// configured flexible-array mode allows; ordinary member arrays stay bounded.
const cArrayDecay = source => source?.[Symbol.for('source-first.clang-byte-tail-pointer/1')] || source;
const cPointerElementRef = (source,index) => {
  if (source?.__cDeferredPointer===true || source?.__cDeferredReference===true)
    return cPointerElementRef(source.resolve(),index);
  // C++ native_t is pointer-sized (64-bit on this build) and lowers to
  // BigInt. Convert only when the index is representable exactly in JS.
  if (typeof index === 'bigint') {
    if (index < -BigInt(Number.MAX_SAFE_INTEGER) || index > BigInt(Number.MAX_SAFE_INTEGER))
      throw new RangeError('C pointer index exceeds exactly representable bounds');
    index = Number(index);
  }
  if (!Number.isSafeInteger(index)) throw new TypeError('C pointer index requires an integer');
  if (source?.__cReference===true) {
    // An original field/element lvalue already implements its zero-offset
    // dereference, including packed pointer fields without a pointer-array
    // registration. Other indices still require actual bounded array storage.
    if (index===0) return source;
    if (source.__cPointer!==true) throw new RangeError('C single-object pointer escapes original storage');
  }
  const pointer=cPointer(source);
  if(pointer.__cRecordPointer===true){
    const api=globalThis[Symbol.for('source-first.record-pointer-views/1')];
    if(!api)throw new TypeError('Original record-pointer view provider missing');
    return api.element(pointer,index);
  }
  if (!pointer.array) {
    const allocation=globalThis[Symbol.for('source-first.pointer-array-allocations/1')]?.get(pointer.buffer)||
      (globalThis[Symbol.for('source-lp64-addresses/2')]?{
        lower:pointer.lower,upper:pointer.upper,
        read:offset=>globalThis[Symbol.for('source-lp64-addresses/2')].decode(new DataView(pointer.buffer).getBigUint64(offset,true)),
        write:(offset,value)=>new DataView(pointer.buffer).setBigUint64(offset,globalThis[Symbol.for('source-lp64-addresses/2')].encode(value),true)
      }:null);
    const offset=pointer.offset+index*8;
    if(!allocation)throw new TypeError('C aggregate/pointer slot requires a proven source array');
    if(!Number.isSafeInteger(offset)||offset%8||offset<pointer.lower||offset+8>pointer.upper||
        offset<allocation.lower||offset+8>allocation.upper)throw new RangeError('Pointer slot escapes original LP64 allocation');
    return {...pointer,__cReference:true,offset,get value(){return allocation.read(offset);},set value(value){allocation.write(offset,value);}};
  }
  const stride=pointer.stride || 1;
  const offset=pointer.offset+index*stride;
  if (!Number.isSafeInteger(offset) || offset<pointer.lower || offset>=pointer.upper || offset%stride)
    throw new RangeError('C aggregate/pointer array index escapes original bounds');
  const slot=offset/stride;
  return {...pointer,__cReference:true,offset,get value(){return pointer.buffer[slot];},set value(next){pointer.buffer[slot]=next;}};
};
const cTypedPointer = (source, Type) => {
  if (!Type || !Number.isSafeInteger(Type.BYTES_PER_ELEMENT)) throw new TypeError('Unsupported pointer element type');
  if (source===null||source===0||source===0n) return null;
  const pointerBytes=source?.[Symbol.for('source-first.clang-byte-record-array/1')];
  if(pointerBytes)return cPointer(pointerBytes);
  if (Array.isArray(source)) return { ...cPointer(source), upper:source.length*Type.BYTES_PER_ELEMENT, stride:Type.BYTES_PER_ELEMENT };
  const pointer=cPointer(source);
  if(pointer.__cRecordPointer===true){
    const {__cRecordPointer,recordSchema,recordPrototypes,...raw}=pointer;
    return raw;
  }
  return pointer;
};
const cPointerOffset = (source, delta, stride=1, addressOnly=false) => {
  if(source?.__cDeferredReference===true)source=source.resolve();
  if(source?.__cReference===true&&source.__cPointer!==true&&
      !source.value?.[Symbol.for('source-first.original-byte-record-storage/1')]){
    if((delta===0||delta===0n)&&Number.isSafeInteger(stride)&&stride>0)return source;
    throw new RangeError('C scalar reference arithmetic requires original byte storage');
  }
  // Native record/row arrays expose readable JS indices over one existing
  // byte allocation. Address arithmetic must retain that allocation and its
  // actual subarray offset, rather than turn it into detached object slots.
  const arrayBytes=source?.[Symbol.for('source-first.clang-byte-record-array/1')];
  const initial=cPointer(arrayBytes||source,addressOnly);
  const p=Array.isArray(source)&&!arrayBytes ? {...initial, upper:source.length*stride, stride} : initial;
  if (p.array && p.stride!==stride) throw new TypeError('Cannot reinterpret JS numeric-array element widths');
  const change=Number(delta)*stride, next=p.offset+change;
  const outside=next<p.lower||next>p.upper;
  if (!Number.isSafeInteger(change) || !Number.isSafeInteger(next) || outside&&!addressOnly)
    throw new RangeError('C pointer escapes original array bounds');
  if(p.__cPointer===true&&p.__cReference===true){
    if(next===p.offset)return p;
    return {__cPointer:true,buffer:p.buffer,array:p.array,lower:p.lower,upper:p.upper,offset:next,
      ...(p.array?{stride:p.stride}: {}),...(outside?{__cAddressOnly:true}: {})};
  }
  const result={...p,offset:next,__cAddressOnly:outside};
  return result;
};
const cDeref = (source, Type) => {
  if (source && !ArrayBuffer.isView(source) && source.__cPointer !== true &&
      typeof source==='object' && 'value' in source) return source;
  const p=cPointer(source);
  if (p.array) {
    if (p.offset<p.lower||p.offset>=p.upper) throw new RangeError('C array pointer dereferences outside its original bounds');
    if (Type.BYTES_PER_ELEMENT!==p.stride || p.offset%p.stride!==0)
      throw new TypeError('Array element type does not match original pointer stride');
    const index=p.offset/p.stride;
    return {get value(){return p.buffer[index];}, set value(value){p.buffer[index]=value;}};
  }
  const width=Type?.BYTES_PER_ELEMENT;
  if (!Number.isSafeInteger(width) || width<=0 || p.offset<p.lower || p.offset+width>p.upper)
    throw new RangeError('C typed pointer dereference out of bounds');
  const access=new Map([
    [Uint8Array,['getUint8','setUint8']], [Int8Array,['getInt8','setInt8']],
    [Uint16Array,['getUint16','setUint16']], [Int16Array,['getInt16','setInt16']],
    [Uint32Array,['getUint32','setUint32']], [Int32Array,['getInt32','setInt32']],
    [Float32Array,['getFloat32','setFloat32']], [Float64Array,['getFloat64','setFloat64']],
    [BigInt64Array,['getBigInt64','setBigInt64']], [BigUint64Array,['getBigUint64','setBigUint64']]
  ]).get(Type);
  if (!access) throw new TypeError('Unsupported C pointer scalar type');
  const view=new DataView(p.buffer,p.offset,width);
  return {get value(){return view[access[0]](0,true);},
          set value(next){view[access[1]](0,next,true);}};
};
// An address-reinterpreted scalar has one native byte allocation. Reads via
// its source identifier and all typed/byte aliases share the same DataView.
// A host I/O boundary can marshal an explicitly typed scalar lvalue while
// preserving its original identity and committing writes through its setter.
// This does not grant the lvalue malloc ownership or invent a native buffer.
function cScalarLValueIO(reference, Type) {
  const types=[Int8Array,Uint8Array,Int16Array,Uint16Array,Int32Array,Uint32Array,BigInt64Array,BigUint64Array,Float32Array,Float64Array];
  if(reference?.__cReference!==true || !types.includes(Type))throw new TypeError('Source scalar I/O requires a typed original lvalue');
  const key=Symbol.for('source-first.scalar-lvalue-io/1'),old=reference[key];
  if(old && (old.abi!=='source-scalar-lvalue-io/1'||old.Type!==Type))throw new TypeError('Conflicting scalar lvalue I/O type');
  if(!old)Object.defineProperty(reference,key,{value:Object.freeze({abi:'source-scalar-lvalue-io/1',Type})});
  return reference;
}
const cScalarStorage = (Type, initial) => {
  // An output-only automatic object owns bytes before its original callee
  // writes them. Omitting initial does not emit a C/C++ zero initializer.
  const array=initial===undefined?new Type(1):new Type([initial]),pointer=cPointer(array),reference=cDeref(pointer,Type);
  return {...pointer,__cReference:true,
    get value(){return reference.value;},set value(value){reference.value=value;}};
};
const cPointerCompare = (left,right,op) => {
  if(left===0||left===0n)left=null;
  if(right===0||right===0n)right=null;
  if (left?.__cDeferredReference===true) left=left.resolve();
  if (right?.__cDeferredReference===true) right=right.resolve();
  if(left?.__cReference===true&&left.__cPointer!==true&&left.value?.[Symbol.for('source-first.original-byte-record-storage/1')])left=left.value;
  if(right?.__cReference===true&&right.__cPointer!==true&&right.value?.[Symbol.for('source-first.original-byte-record-storage/1')])right=right.value;
  if(left?.__cFunctionAddress===true||right?.__cFunctionAddress===true){
    if(op!=='=='&&op!=='!=')throw new TypeError('Cannot order integer-derived function addresses');
    const equal=cSourceAddresses.encode(left)===cSourceAddresses.encode(right);
    return op==='=='?equal:!equal;
  }
  if (left===null || right===null) {
    if (op==='==' || op==='!=') return op==='==' ? left===right : left!==right;
    throw new TypeError('Cannot order a null C pointer');
  }
  if(typeof left==='function'||typeof right==='function'){
    if(op==='=='||op==='!=')return op==='=='?left===right:left!==right;
    throw new TypeError('Cannot order original function pointers');
  }
  const opaqueRecord=value=>value?.[Symbol.for('source-first.original-record-storage/1')]===true&&
    !value[Symbol.for('source-first.original-byte-record-storage/1')];
  if(opaqueRecord(left)||opaqueRecord(right)){
    if(op==='=='||op==='!=')return op==='=='?left===right:left!==right;
    throw new TypeError('Cannot order nonbyte original record pointers');
  }
  // Scalar global addresses are stable owner-created reference objects, not
  // array-buffer addresses. Equality is legal; ordering unrelated scalar
  // objects is deliberately rejected rather than guessed.
  if (left?.__cReference===true&&left.__cPointer!==true || right?.__cReference===true&&right.__cPointer!==true) {
    if (op==='==' || op==='!=') return op==='==' ? left===right : left!==right;
    throw new TypeError('Cannot order scalar reference pointers');
  }
  const pointerAddress=value=>cPointer(value?.[Symbol.for('source-first.original-byte-record-storage/1')]?.bytes||value,true);
  const a=Array.isArray(left) && right?.__cPointer && right.array
    ? {...cPointer(left),upper:left.length*right.stride,stride:right.stride} : pointerAddress(left);
  const b=Array.isArray(right) && a.array
    ? {...cPointer(right),upper:right.length*a.stride,stride:a.stride} : pointerAddress(right);
  const address=p=>{const bytes=p.array&&p.buffer[Symbol.for('source-first.clang-byte-record-array/1')];
    return bytes?{buffer:bytes.buffer,offset:bytes.byteOffset+p.offset,lower:bytes.byteOffset+p.lower,upper:bytes.byteOffset+p.upper}:p;};
  const addressA=address(a),addressB=address(b);
  const equal=addressA.buffer===addressB.buffer && addressA.offset===addressB.offset;
  if (op==='==') return equal;
  if (op==='!=') return !equal;
  if (addressA.buffer!==addressB.buffer || addressA.lower!==addressB.lower || addressA.upper!==addressB.upper)
    throw new TypeError('Cannot order pointers to different source array bounds');
  switch(op){case '<':return addressA.offset<addressB.offset;case '<=':return addressA.offset<=addressB.offset;
    case '>':return addressA.offset>addressB.offset;case '>=':return addressA.offset>=addressB.offset;}
  throw new TypeError('Invalid C pointer comparison');
};
const cPointerDiff = (left,right,stride) => {
  const address=value=>{
    const p=Array.isArray(value)?{...cPointer(value,true),upper:value.length*stride,stride}:cPointer(value,true);
    const bytes=p.array&&p.buffer[Symbol.for('source-first.clang-byte-record-array/1')];
    return bytes?{buffer:bytes.buffer,lower:bytes.byteOffset+p.lower,upper:bytes.byteOffset+p.upper,offset:bytes.byteOffset+p.offset}:p;
  };
  const a=address(left),b=address(right);
  if (a.buffer!==b.buffer || a.lower!==b.lower || a.upper!==b.upper)
    throw new TypeError('Cannot subtract pointers to different source arrays');
  const delta=(a.offset-b.offset)/stride;
  if (!Number.isSafeInteger(delta)) throw new RangeError('Misaligned C pointer difference');
  return delta;
};

// Standalone source-array allocations have an abstract aligned base. Aliases
// retain the same buffer and offset; no copying or fabricated integer address.
// Only zero-offset, complete, typed allocations may establish this guarantee.
const cAlignedStorage = (storage, alignment) => {
  if (!Number.isSafeInteger(alignment) || alignment<1 || alignment>1048576 ||
      (alignment & (alignment-1)) || !ArrayBuffer.isView(storage) ||
      storage instanceof DataView || storage.byteOffset!==0 ||
      storage.byteLength!==storage.buffer.byteLength)
    throw new TypeError('Explicit source alignment needs a complete typed allocation');
  const key=Symbol.for('source-first.allocation-alignment/1');
  const registry=globalThis[key] ||= new WeakMap();
  registry.set(storage.buffer,Math.max(alignment,storage.BYTES_PER_ELEMENT,registry.get(storage.buffer)||1));
  return storage;
};

const cRecordObject = source => {
  if (source?.__cDeferredPointer === true || source?.__cDeferredReference === true) return cRecordObject(source.resolve());
  if (source?.__cReference === true) return source.value;
  if (Array.isArray(source)) { if (!source.length) throw new RangeError("C record pointer dereferences empty array"); return source[0]; }
  if (source?.__cRecordPointer === true) return globalThis[Symbol.for("source-first.record-pointer-views/1")].deref(source);
  if (source?.__cPointer === true) {
    if (!source.array) throw new TypeError("C record pointer requires source-backed object slots");
    return cPointerElementRef(source,0).value;
  }
  return source;
};
const cStaticReference = resolve => ({ __cReference:true, __cDeferredReference:true, resolve, get value() { return resolve().value; }, set value(value) { resolve().value=value; } });
function cObjectFieldRef(owner, field) { const storage=owner?.[Symbol.for("source-first.original-byte-record-storage/1")]; if(storage)return globalThis[Symbol.for("source-first.record-pointer-views/1")].fieldReference(owner,field); const key=Symbol.for("source-object-field-references/1"); if (!Object.hasOwn(owner,key)) Object.defineProperty(owner,key,{value:new Map()}); const refs=owner[key]; if (!refs.has(field)) refs.set(field,{__cReference:true,get value(){return owner[field];},set value(value){owner[field]=value;}}); return refs.get(field); }
function cRef(read, write) { return ({ __cReference:true, get value() { return read(); }, set value(v) { write(v); } }); }
function cArrayRef(array, index) { return cRef(() => array[index], v => { array[index] = v; }); }
// Numeric POD records use original Clang field offsets and shared byte storage.
// Overlapping union alternatives are views of the SAME bytes, never independent
// JS properties. This target's ABI has verified little-endian object storage.
const cAggregateRecordTag = Symbol.for('source-first.original-record-storage/1');
const cMarkAggregate = value => { Object.defineProperty(value,cAggregateRecordTag,{value:true}); return value; };
// Evaluate source values in declaration order. Resolve only their verified
// static address relocations after the neighboring storage bindings exist.
const cStaticInitializerValues = values => () => values;
// Independently generated ES modules must recognize the SAME original
// provider-owned byte storage. Symbol metadata is non-enumerable and cannot
// collide with original fields; schema equality remains mandatory for copy.
const cByteRecordStorageTag = Symbol.for('source-first.original-byte-record-storage/1');
const cByteRecordStorage = {
  get:value => value && typeof value==='object' && Object.hasOwn(value,cByteRecordStorageTag)
    ? value[cByteRecordStorageTag] : undefined,
  set:(value,storage) => Object.defineProperty(value,cByteRecordStorageTag,
    {value:Object.freeze(storage)})
};
const cByteRecordNative = {
  Uint8Array:[Uint8Array,'Uint8'], Int8Array:[Int8Array,'Int8'],
  Uint16Array:[Uint16Array,'Uint16'], Int16Array:[Int16Array,'Int16'],
  Uint32Array:[Uint32Array,'Uint32'], Int32Array:[Int32Array,'Int32'],
  Float32Array:[Float32Array,'Float32'], Float64Array:[Float64Array,'Float64'],
  BigInt64Array:[BigInt64Array,'BigInt64'], BigUint64Array:[BigUint64Array,'BigUint64']
};
// A native multidimensional array has ONE allocation. Each readable JS row
// is a typed view into that allocation, so host byte operations and row
// pointers observe exactly the same C storage and original row strides.
const cNativeArray = (type,dims,initializers=[]) => {
  const C=cByteRecordNative[type]?.[0];
  if(!C||!Array.isArray(dims)||!dims.length||dims.length>8||
      dims.some(n=>!Number.isSafeInteger(n)||n<0||n>1000000)||
      dims.reduce((a,b)=>a*b,1)>1000000)
    throw new TypeError('Native C array requires verified dimensions and scalar width');
  const bytes=new Uint8Array(dims.reduce((a,b)=>a*b,1)*C.BYTES_PER_ELEMENT);
  let offset=0;
  const build=(depth,values)=>{
    const length=dims[depth],start=offset;
    if(!(Array.isArray(values)||depth===dims.length-1&&values instanceof C)||values.length>length)
      throw new TypeError('Native C array initializer differs from original dimensions');
    if(depth===dims.length-1){
      const row=new C(bytes.buffer,offset,length);row.set(values);offset+=row.byteLength;return row;
    }
    const rows=Array.from({length},(_,i)=>build(depth+1,values[i]??[]));
    Object.defineProperty(rows,Symbol.for('source-first.clang-byte-record-array/1'),
      {value:bytes.subarray(start,offset)});
    Object.defineProperty(rows,Symbol.for('source-first.native-array-layout/1'),
      {value:JSON.stringify({array:type,dims:dims.slice(depth)})});
    return rows;
  };
  return build(0,initializers);
};
// Pointer fields and uintptr_t share the verified LP64 source address space.
const cByteRecordPointers = cSourceAddresses;
// Contiguous LP64 slots preserve pointer identity and native byte copies.
const cPointerArray = (count, values=[], storage=null) => {
  if(!Number.isSafeInteger(count)||count<0||count>1000000||
      (typeof values!=='function'&&(!Array.isArray(values)||values.length>count)))
    throw new RangeError('Invalid original pointer-array extent');
  const bytes=storage||new Uint8Array(count*8);
  if(!(bytes instanceof Uint8Array)||bytes.length!==count*8||bytes.byteOffset%8)
    throw new TypeError('Pointer array backing store differs from original LP64 extent');
  const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.length),slots=new Array(count).fill(null);
  // Original static pointer relocations can refer to storage exported by a
  // cyclic ES module. Allocate slots now, resolve their proven addresses on
  // first access, before either slot operations or a raw byte copy can see them.
  let pending=values,initializing=false;
  const initialize=()=>{
    if(pending===null)return;
    if(initializing)throw new TypeError('Recursive static pointer-array initialization');
    initializing=true;
    try{
      const initial=typeof pending==='function'?pending():pending;
      if(!Array.isArray(initial)||initial.length>count)throw new TypeError('Invalid static pointer-array relocation list');
      const encoded=initial.map(value=>cByteRecordPointers.encode(value));
      for(let i=0;i<encoded.length;i++)view.setBigUint64(i*8,encoded[i],true);
      pending=null;
    }finally{initializing=false;}
  };
  const allocationView=new DataView(bytes.buffer);
  const allocationKey=Symbol.for('source-first.pointer-array-allocations/1');
  const allocations=globalThis[allocationKey]||(globalThis[allocationKey]=new WeakMap());
  allocations.set(bytes.buffer,{lower:0,upper:bytes.buffer.byteLength,
    read:offset=>{initialize();return cByteRecordPointers.decode(allocationView.getBigUint64(offset,true));},
    write:(offset,value)=>{initialize();allocationView.setBigUint64(offset,cByteRecordPointers.encode(value),true);}});
  Object.defineProperty(slots,Symbol.for('source-first.clang-byte-record-array/1'),{get(){initialize();return bytes;}});
  Object.defineProperty(slots,Symbol.for('source-first.clang-pointer-array/1'),{value:true});
  const indexOf=key=>typeof key==='string'&&/^(0|[1-9][0-9]*)$/.test(key)?Number(key):-1;
  const result=new Proxy(slots,{
    get(target,key,receiver){const i=indexOf(key);if(i>=0){if(i>=count)throw new RangeError('C pointer-array read exceeds extent');initialize();return cByteRecordPointers.decode(view.getBigUint64(i*8,true));}return Reflect.get(target,key,receiver);},
    set(target,key,value,receiver){const i=indexOf(key);if(i>=0){if(i>=count)throw new RangeError('C pointer-array write exceeds extent');initialize();view.setBigUint64(i*8,cByteRecordPointers.encode(value),true);return true;}if(key==='length')throw new TypeError('Cannot resize original C pointer array');return Reflect.set(target,key,value,receiver);}
  });
  if(typeof values!=='function')initialize();
  return result;
};
// Array subobjects are views over their enclosing original allocation.
const cByteArrayMember = (field,bytes,prototypes,values=[]) => {
  const dims=field.dims;
  if(!Array.isArray(dims)||!dims.length||dims.length>8||dims.some(d=>!Number.isSafeInteger(d)||d<1)||
      !Array.isArray(values)||values.length>dims[0])throw new TypeError('Invalid Clang member-array dimensions');
  const count=dims.reduce((a,b)=>a*b,1);
  if(field.recordArray){
    if(field.recordArray.size*count!==bytes.length)throw new TypeError('Record member-array extent mismatch');
    return cByteRecordNDArray(field.recordArray,dims,prototypes,values,bytes);
  }
  const C=field.nativeArray&&cByteRecordNative[field.nativeArray]?.[0],width=field.pointerArray?8:C?.BYTES_PER_ELEMENT;
  if(!width||width*count!==bytes.length)throw new TypeError('Member-array extent mismatch');
  if(dims.length===1){
    if(field.pointerArray)return cPointerArray(dims[0],values,bytes);
    const array=new C(bytes.buffer,bytes.byteOffset,dims[0]);array.set(values);return array;
  }
  const stride=bytes.length/dims[0];
  const rows=Array.from({length:dims[0]},(_,i)=>cByteArrayMember({...field,dims:dims.slice(1)},
    bytes.subarray(i*stride,(i+1)*stride),prototypes,values[i]||[]));
  Object.defineProperty(rows,Symbol.for('source-first.clang-byte-record-array/1'),{value:bytes});
  return rows;
};
const cInitByteRecord = (schema, values={}, storage=null, prototypes={}, allocation=null) => {
  if(schema.pointerEncoding && (schema.pointerEncoding!=='source-lp64-addresses/2' ||
      globalThis[Symbol.for('source-first.native-pointer-abi')]!==schema.pointerEncoding))
    throw new TypeError('Overlapping pointer union requires the verified source address ABI');
  if(schema.projection && (!(storage instanceof Uint8Array) || typeof values==='function' ||
      !values || Object.keys(values).length || schema.prototype))
    throw new TypeError('Nontrivial C++ field view requires existing storage without initialization');
  if (!Number.isSafeInteger(schema.size) || schema.size<1 || schema.size>1048576 ||
      !schema.fields || typeof schema.fields!=='object')
    throw new TypeError('Unverified Clang byte-record schema');
  const bytes=storage || new Uint8Array(schema.size);
  if (!(bytes instanceof Uint8Array) || bytes.byteLength!==schema.size)
    throw new TypeError('Byte record extent differs from Clang ABI');
  let prototype=Object.prototype;
  if (schema.prototype) {
    if (!Object.hasOwn(prototypes,schema.prototype) || typeof prototypes[schema.prototype]!=='function')
      throw new TypeError('Missing original byte-record class provider: '+schema.prototype);
    prototype=prototypes[schema.prototype]();
    if (!prototype || typeof prototype!=='object') throw new TypeError('Invalid original byte-record prototype');
  }
  let pending=typeof values==='function'?values:null,initializing=false;
  const initialize=()=>{
    if(!pending||initializing)return;
    initializing=true;
    try{apply(pending());pending=null;}finally{initializing=false;}
  };
  const target=cMarkAggregate(Object.create(prototype));
  const result=pending?new Proxy(target,{
    get:(object,key,receiver)=>{if(key!==cByteRecordStorageTag&&key!==cAggregateRecordTag)initialize();return Reflect.get(object,key,receiver);},
    set:(object,key,value,receiver)=>{initialize();return Reflect.set(object,key,value,receiver);}
  }):target;
  const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  cByteRecordStorage.set(result,{get bytes(){initialize();return bytes;},schema:JSON.stringify(schema),prototypes});
  for (const [name,field] of Object.entries(schema.fields)) {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name) ||
        ['__proto__','constructor','prototype'].includes(name) ||
        !Number.isSafeInteger(field.offset) || field.offset<0)
      throw new TypeError('Unverified byte-record field');
    if(field.bitfield){
      const bits=field.bitfield;
      if(!Number.isSafeInteger(bits.start)||bits.start<0||bits.start>7||
          !Number.isSafeInteger(bits.width)||bits.width<1||bits.width>64||
          field.size!==Math.ceil((bits.start+bits.width)/8)||field.offset+field.size>bytes.length)
        throw new TypeError('Invalid target-Clang bitfield range');
      const read=()=>{let raw=0n;for(let i=0;i<field.size;i++)raw|=BigInt(bytes[field.offset+i])<<BigInt(i*8);return raw;};
      const mask=((1n<<BigInt(bits.width))-1n)<<BigInt(bits.start);
      Object.defineProperty(result,name,{enumerable:true,get:()=>{
        let value=BigInt.asUintN(bits.width,read()>>BigInt(bits.start));
        if(bits.signed)value=BigInt.asIntN(bits.width,value);
        return bits.boolean?value!==0n:bits.wide?value:Number(value);
      },set:value=>{
        const next=(read()&~mask)|(BigInt.asUintN(bits.width,BigInt(value))<<BigInt(bits.start));
        for(let i=0;i<field.size;i++)bytes[field.offset+i]=Number((next>>BigInt(i*8))&255n);
      }});
    } else if (field.reference) {
      if(field.reference!==true || field.size!==8 || field.offset+8>bytes.length)
        throw new TypeError('Reference field differs from verified LP64 ABI');
      Object.defineProperty(result,name,{enumerable:true,get:()=>{
        const reference=cByteRecordPointers.decode(view.getBigUint64(field.offset,true));
        if(reference?.__cReference!==true)throw new TypeError('Uninitialized original C++ reference member');
        return reference;
      },set:reference=>{
        if(reference?.__cReference!==true)throw new TypeError('C++ reference member requires original lvalue storage');
        view.setBigUint64(field.offset,cByteRecordPointers.encode(reference),true);
      }});
    } else if (field.pointer) {
      if (field.pointer!==true || field.size!==8 || field.offset+8>bytes.length)
        throw new TypeError('Pointer field differs from verified LP64 ABI');
      Object.defineProperty(result,name,{enumerable:true,
        get:()=>cByteRecordPointers.decode(view.getBigUint64(field.offset,true)),
        set:value=>view.setBigUint64(field.offset,cByteRecordPointers.encode(value),true)});
    } else if (field.recordArray||field.pointerArray||field.nativeArray) {
      if(!Number.isSafeInteger(field.size)||field.offset+field.size>bytes.length)
        throw new TypeError('Member array exceeds original record');
      const array=cByteArrayMember(field,bytes.subarray(field.offset,field.offset+field.size),prototypes);
      Object.defineProperty(result,name,{value:array,enumerable:true});
    } else if (field.byteRecord) {
      const extent=field.byteRecord.size;
      if (field.offset+extent>bytes.length) throw new RangeError('Nested record exceeds Clang ABI');
      const child=cInitByteRecord(field.byteRecord,{},bytes.subarray(field.offset,field.offset+extent),prototypes);
      Object.defineProperty(result,name,{value:child,enumerable:true});
    } else {
      const [C,suffix]=cByteRecordNative[field.native] || [];
      if (!C || !Number.isSafeInteger(field.size) || field.size<1 ||
          field.offset+field.size>bytes.length) throw new TypeError('Invalid Clang scalar field');
      if (Object.hasOwn(field,'length')) {
        if (!Number.isSafeInteger(field.length) || field.length<1 ||
            field.length*C.BYTES_PER_ELEMENT!==field.size ||
            (bytes.byteOffset+field.offset)%C.BYTES_PER_ELEMENT)
          throw new TypeError('Unaligned or invalid native array field');
        const array=new C(bytes.buffer,bytes.byteOffset+field.offset,field.length);
        if(field.oneByteTailArray==='clang-flex-arrays-0-or-1/1' && field.length===1 && C.BYTES_PER_ELEMENT===1 && allocation){
          const heap=globalThis[Symbol.for('source-first.native-C-heap/2')];
          // Original allocators can return a payload after their own header.
          // Retain that one live allocation's bounds rather than requiring
          // the source object to start at the raw host malloc address.
          const complete=heap?.buffer===bytes.buffer && [...heap.allocations].find(([base,size])=>
            base<=bytes.byteOffset && allocation.lower>=base && allocation.upper<=base+size);
          if(complete && allocation.offset===bytes.byteOffset &&
              allocation.upper>=bytes.byteOffset+schema.size && allocation.upper>=bytes.byteOffset+field.offset+field.size)
            Object.defineProperty(array,Symbol.for('source-first.clang-byte-tail-pointer/1'),{value:{
              __cPointer:true,array:false,buffer:bytes.buffer,lower:bytes.byteOffset+field.offset,
              offset:bytes.byteOffset+field.offset,upper:allocation.upper}});
        }
        Object.defineProperty(result,name,{value:array,enumerable:true});
      } else {
        if (field.size!==C.BYTES_PER_ELEMENT) throw new TypeError('Native scalar width differs from Clang');
        Object.defineProperty(result,name,{enumerable:true,
          get:()=>view['get'+suffix](field.offset,true),
          set:value=>view['set'+suffix](field.offset,
            suffix.startsWith('Big')?BigInt(value):Number(value),true)});
      }
    }
  }
  function apply(initialValues){
  for (const [name,value] of Object.entries(initialValues)) {
    const field=schema.fields[name];
    if (!field) throw new TypeError('Initializer is not a Clang record field');
    if(field.recordArray||field.pointerArray||field.nativeArray){
      const dest=result[name][Symbol.for('source-first.clang-byte-record-array/1')];
      if(field.recordArray){
        const source=value?.[Symbol.for('source-first.clang-byte-record-array/1')];
        if(!source||source.length!==field.size||value[Symbol.for('source-first.byte-record-array-layout/1')]!==
            JSON.stringify({schema:field.recordArray,dims:field.dims}))throw new TypeError('Member record-array initializer differs from Clang schema');
        dest.set(source);
      }else if(field.pointerArray){
        const populate=(array,dims,items)=>{
          if(!Array.isArray(items)||items.length>dims[0])throw RangeError('Pointer member initializer exceeds original extent');
          for(let i=0;i<items.length;i++)if(dims.length===1)array[i]=items[i];else populate(array[i],dims.slice(1),items[i]);
        };
        populate(result[name],field.dims,value);
      }else cByteArrayMember(field,bytes.subarray(field.offset,field.offset+field.size),prototypes,value);
    } else if (field.byteRecord) {
      const source=cByteRecordStorage.get(value),dest=cByteRecordStorage.get(result[name]);
      if (!source || source.schema!==dest.schema) throw new TypeError('Nested byte-record initializer type mismatch');
      dest.bytes.set(source.bytes);
    } else if (Object.hasOwn(field,'length')) {
      const [C]=cByteRecordNative[field.native];
      if (!(value instanceof C) || value.length>field.length)
        throw new TypeError('Byte-record array initializer mismatch');
      result[name].set(value);
    } else result[name]=value;
  }
  }
  if(!pending)apply(values);
  return result;
};

// One allocation for a C array of Clang-proven trivially-constructed byte
// records. Numeric indices are stable, lazy views over the SAME byte store.
// Unlike Array.from(... cInitByteRecord()), this preserves memcpy, pointer
// strides, and overlapping-union aliasing between consecutive C records.
const cByteRecordArrayStorage = Symbol.for('source-first.clang-byte-record-array/1');
const cByteRecordArray = (schema, count, prototypes={}, initializers=[], storage=null) => {
  if(schema?.projection && (!(storage instanceof Uint8Array)||typeof initializers==='function'||initializers.length))
    throw new TypeError('Nontrivial C++ array view cannot construct objects');
  if (!Number.isSafeInteger(count) || count < 1 || count > 1000000 ||
      !Number.isSafeInteger(schema?.size) || schema.size < 1 ||
      schema.size > 1048576 || count * schema.size > 268435456)
    throw new RangeError('C record array exceeds proven bounded storage');
  if(typeof initializers!=='function'&&(!Array.isArray(initializers)||initializers.length>count))throw new RangeError('C record initializer exceeds array extent');
  const bytes = storage || new Uint8Array(count * schema.size);
  if(!(bytes instanceof Uint8Array)||bytes.length!==count*schema.size)
    throw new TypeError('C record array backing store differs from Clang extent');
  const records = new Array(count).fill(null), signature = JSON.stringify(schema);
  let pending=typeof initializers==='function'?initializers:null,initializing=false;
  const initialize=()=>{
    if(!pending||initializing)return;
    initializing=true;
    try{
      const values=pending();
      if(!Array.isArray(values)||values.length>count)throw RangeError('C record initializer exceeds array extent');
      for(let i=0;i<values.length;i++)result[i]=values[i];
      pending=null;
    }finally{initializing=false;}
  };
  const indexOf = key => {
    if (typeof key !== 'string' || !/^(0|[1-9][0-9]*)$/.test(key)) return -1;
    const i = Number(key);
    return Number.isSafeInteger(i) && i < count ? i : -1;
  };
  const getRecord = i => {
    if (records[i] === null)
      records[i] = cInitByteRecord(schema, {}, bytes.subarray(i * schema.size, (i+1) * schema.size),prototypes);
    return records[i];
  };
  Object.defineProperty(records,Symbol.for('source-first.byte-record-array-layout/1'),
    {value:JSON.stringify({schema,dims:[count]})});
  Object.defineProperty(records,Symbol.for('source-first.byte-record-array-prototypes/1'),{value:prototypes});
  const result=new Proxy(records, {
    get(target, key, receiver) {
      initialize();
      if (key === cByteRecordArrayStorage) return bytes;
      const i = indexOf(key);
      if (i >= 0) return getRecord(i);
      return Reflect.get(target, key, receiver);
    },
    set(target, key, value) {
      initialize();
      const i = indexOf(key);
      if (i < 0) throw new RangeError('C record array index outside original extent');
      if(schema.projection)throw new TypeError('Nontrivial C++ array assignment requires original operator');
      const source = cByteRecordStorage.get(value);
      if (!source || source.schema !== signature)
        throw new TypeError('C record array assignment requires identical Clang byte layout');
      bytes.set(source.bytes, i * schema.size);
      return true;
    }
  });
  if(!pending)for(let i=0;i<initializers.length;i++)result[i]=initializers[i];
  return result;
};

// Every row and element in a multidimensional C array shares one allocation.
const cByteRecordNDArray = (schema,dims,prototypes={},initializers=[],storage=null) => {
  if(schema?.projection && (!(storage instanceof Uint8Array)||typeof initializers==='function'||initializers.length))
    throw new TypeError('Nontrivial C++ array view cannot construct objects');
  if(!Array.isArray(dims)||dims.length<1||dims.length>8||
      dims.some(n=>!Number.isSafeInteger(n)||n<1||n>1000000)||
      !Number.isSafeInteger(schema?.size)||schema.size<1||
      dims.reduce((a,b)=>a*b,1)*schema.size>268435456)
    throw new RangeError('Invalid Clang record array dimensions');
  if(dims.length===1)return cByteRecordArray(schema,dims[0],prototypes,initializers,storage);
  if(typeof initializers!=='function'&&(!Array.isArray(initializers)||initializers.length>dims[0]))throw new RangeError('C record row initializer exceeds extent');
  const stride=dims.slice(1).reduce((a,b)=>a*b,1)*schema.size;
  const bytes=storage||new Uint8Array(dims[0]*stride);
  if(!(bytes instanceof Uint8Array)||bytes.length!==dims[0]*stride)throw new TypeError('Invalid record row storage');
  let resolved=null;
  const values=()=>{
    if(resolved===null){
      resolved=initializers();
      if(!Array.isArray(resolved)||resolved.length>dims[0])throw RangeError('C record row initializer exceeds extent');
    }
    return resolved;
  };
  const rows=Array.from({length:dims[0]},(_,i)=>cByteRecordNDArray(schema,dims.slice(1),prototypes,
    typeof initializers==='function'?()=>values()[i]||[]:initializers[i]||[],bytes.subarray(i*stride,(i+1)*stride)));
  let resolving=false;
  Object.defineProperty(rows,cByteRecordArrayStorage,{get(){
    if(!resolving){resolving=true;try{for(const row of rows)row[cByteRecordArrayStorage];}finally{resolving=false;}}
    return bytes;
  }});
  Object.defineProperty(rows,Symbol.for('source-first.byte-record-array-layout/1'),{value:JSON.stringify({schema,dims})});
  Object.defineProperty(rows,Symbol.for('source-first.byte-record-array-prototypes/1'),{value:prototypes});
  return rows;
};

// Typed casts create views over original bytes, never detached struct copies.
const cRecordPointerViews = (()=>{
  const key=Symbol.for('source-first.record-pointer-views/1');
  if(globalThis[key])return globalThis[key];
  const buffers=new WeakMap(),fieldReferences=new WeakMap();
  const api={
    protocol:'source-record-pointer-views/2',
    fieldReference(owner,name){
      const storage=cByteRecordStorage.get(owner),field=storage&&JSON.parse(storage.schema).fields[name];
      if(!field)throw new TypeError('Field address requires original Clang storage');
      let fields=fieldReferences.get(owner);if(!fields){fields=new Map();fieldReferences.set(owner,fields);}
      if(!fields.has(name)){
        const reference={__cReference:true,get value(){return owner[name];},set value(next){owner[name]=next;}};
        Object.defineProperty(reference,Symbol.for('source-first.record-field-owner/1'),{value:owner});
        if(!field.byteRecord&&!field.recordArray&&!field.pointerArray&&!field.nativeArray&&!field.bitfield&&!Object.hasOwn(field,'length'))Object.assign(reference,{
          __cPointer:true,buffer:storage.bytes.buffer,array:false,
          lower:storage.bytes.byteOffset+field.offset,offset:storage.bytes.byteOffset+field.offset,
          upper:storage.bytes.byteOffset+field.offset+field.size});
        fields.set(name,reference);
      }
      return fields.get(name);
    },
    deref(pointer){
      const p=pointer,schema=p.recordSchema;
      if(p.__cPointer!==true||p.__cRecordPointer!==true||p.array||!schema||p.offset<p.lower||p.offset+schema.size>p.upper)
        throw new RangeError('C record dereference escapes original byte allocation');
      const tail=Object.values(schema.fields).some(field=>field.oneByteTailArray);
      const identity=p.offset+':'+JSON.stringify(schema)+(tail?':'+p.lower+':'+p.upper:'');
      let views=buffers.get(p.buffer);if(!views){views=new Map();buffers.set(p.buffer,views);}
      if(!views.has(identity))views.set(identity,cInitByteRecord(schema,{},new Uint8Array(p.buffer,p.offset,schema.size),p.recordPrototypes,p));
      return views.get(identity);
    },
    element(pointer,index){
      const offset=pointer.offset+Number(index)*pointer.recordSchema.size;
      if(!Number.isSafeInteger(offset))throw new RangeError('Record-pointer index is not exactly representable');
      const item={...pointer,offset},record=api.deref(item);
      return {get value(){return record;},set value(next){
        if(pointer.recordSchema.projection)throw new TypeError('Nontrivial C++ record assignment requires original operator');
        const source=cByteRecordStorage.get(next),destination=cByteRecordStorage.get(record);
        if(!source||source.schema!==destination.schema)throw new TypeError('Record-pointer assignment requires identical Clang layout');
        destination.bytes.set(source.bytes);
      }};
    }
  };
  Object.defineProperty(globalThis,key,{value:api});return api;
})();
const cRecordPointer = (source,schema,prototypes={}) => {
  if(!Number.isSafeInteger(schema?.size)||schema.size<1||!schema.fields||
      !Number.isSafeInteger(schema.align)||schema.align<1)
    throw new TypeError('Record pointer requires an original Clang schema');
  if(source===null||source===0||source===0n)return null;
  if(source?.__cDeferredPointer||source?.__cDeferredReference)return cRecordPointer(source.resolve(),schema,prototypes);
  if(source?.__cReference&&source.__cPointer!==true)return cRecordPointer(source.value,schema,prototypes);
  const owner=source?.[Symbol.for('source-first.record-field-owner/1')],owned=owner&&cByteRecordStorage.get(owner);
  if(owned&&source.offset===owned.bytes.byteOffset&&JSON.stringify(schema)===owned.schema)
    return cRecordPointer(owner,schema,prototypes);
  const bytes=cByteRecordStorage.get(source)?.bytes||source?.[cByteRecordArrayStorage];
  // A host may borrow a flat readable record for field-only C APIs (for
  // example libdivide). Preserve the SAME object rather than serialize a
  // detached copy. Byte casts/copies and pointer arithmetic still require
  // native storage; this facade never acquires a fabricated heap address.
  if(!schema.projection && !bytes && source && typeof source==='object' &&
      (Object.getPrototypeOf(source)===Object.prototype||Object.getPrototypeOf(source)===null) &&
      source.__cPointer!==true && !schema.union &&
      Object.entries(schema.fields).every(([name,field])=>
        (field.pointer||field.native&&!Object.hasOwn(field,'length')) &&
        Object.hasOwn(Object.getOwnPropertyDescriptor(source,name)||{},'value')))
    return {__cReference:true,get value(){return source;}};
  const pointer=cPointer(bytes||source);
  // Source arrays can retain object slots instead of a serialized POD layout.
  // Keep that original owner and stride; do not reinterpret those slots as
  // heap bytes or detach their fields by constructing a new record view.
  if(pointer.array){
    if(schema.projection)throw new TypeError('Nontrivial C++ field view requires original byte storage');
    const owned=Array.isArray(source)
      ? {...pointer,upper:source.length*schema.size,stride:schema.size} : pointer;
    if(owned.stride!==schema.size || owned.lower%owned.stride || owned.offset%owned.stride ||
        owned.upper%owned.stride || !Array.isArray(owned.buffer))
      throw new TypeError('Record pointer differs from original object-array stride');
    if(owned.offset<owned.lower || owned.offset>=owned.upper)
      throw new RangeError('Record pointer dereferences outside original object slots');
    const value=owned.buffer[owned.offset/owned.stride];
    if(value===null || typeof value!=='object' || ArrayBuffer.isView(value))
      throw new TypeError('Record pointer requires original record object slots');
    return owned;
  }
  if(pointer.array||!Number.isSafeInteger(schema?.size)||schema.size<1||
      !Number.isSafeInteger(schema.align)||schema.align<1||pointer.offset%schema.align)
    throw new TypeError('Record pointer requires aligned Clang-proven original bytes');
  return {...pointer,__cRecordPointer:true,recordSchema:schema,recordPrototypes:prototypes};
};

// Readable JS representation of Clang-proven pointer-free C/C++ POD copies.
// Fail closed if external storage has not been materialized in the agreed type.
const cCopyAggregate = (value, schema) => {
  if(schema.byteRecord?.projection || schema.recordArray?.projection)
    throw new TypeError('Nontrivial C++ copy requires original constructor');
  if(schema.recordArray){
    const bytes=value?.[cByteRecordArrayStorage];
    if(!bytes||value[Symbol.for('source-first.byte-record-array-layout/1')]!==JSON.stringify({schema:schema.recordArray,dims:schema.dims}))
      throw new TypeError('C record-array copy requires identical Clang storage');
    return cByteRecordNDArray(schema.recordArray,schema.dims,value[Symbol.for('source-first.byte-record-array-prototypes/1')]||{},[],bytes.slice());
  }
  if(Object.hasOwn(schema,'pointerArray')){
    if(schema.stride!==8||!Array.isArray(value)||value.length!==schema.pointerArray||
        !value[Symbol.for('source-first.clang-pointer-array/1')])throw new TypeError('Pointer-array copy requires exact original storage');
    return cPointerArray(schema.pointerArray,Array.from(value));
  }
  if (Object.hasOwn(schema,'pointer')) {
    if (schema.pointer!==true || !(value===null || typeof value==='function' ||
        value&&globalThis[Symbol.for('source-first.cpp-heap/1')]?.objects.has(value) ||
        ArrayBuffer.isView(value) || Array.isArray(value) || value?.__cReference===true ||
        value?.__cPointer===true || value?.__cDeferredPointer===true ||
        value?.__cDeferredReference===true || value?.[cAggregateRecordTag]===true))
      throw new TypeError('Borrowed pointer copy requires original proven storage');
    return value;
  }
  if (Object.hasOwn(schema,'byteRecord')) {
    const source=cByteRecordStorage.get(value);
    if (!source || source.schema!==JSON.stringify(schema.byteRecord))
      throw new TypeError('Byte-record copy requires exact original Clang type');
    return cInitByteRecord(schema.byteRecord,{},new Uint8Array(source.bytes),source.prototypes);
  }
  if (Object.hasOwn(schema, 'bytes')) {
    if (!(value instanceof Uint8Array) || value.length !== schema.bytes)
      throw new TypeError('C overlapping union requires exact opaque byte storage');
    return new Uint8Array(value);
  }
  if (Object.hasOwn(schema, 'record')) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError('C aggregate requires a record');
    const result = schema.pointerAliases ? cZeroAggregate(schema) : cMarkAggregate(Object.create(Object.getPrototypeOf(value)));
    const fields = Object.keys(schema.record);
    if (Object.keys(value).length !== fields.length || fields.some(k => !Object.hasOwn(value,k)))
      throw new TypeError('C aggregate field shape does not match Clang record');
    for (const field of fields) {
      if (schema.pointerAliases?.some(group=>group.includes(field))) continue;
      result[field] = cCopyAggregate(value[field], schema.record[field]);
    }
    for (const group of schema.pointerAliases || []) result[group[0]] = cCopyAggregate(value[group[0]],{pointer:true});
    return result;
  }
  if (Object.hasOwn(schema, 'array')) {
    const ctor = ({Uint8Array,Int8Array,Uint16Array,Int16Array,Uint32Array,Int32Array,
                   BigUint64Array,BigInt64Array,Float32Array,Float64Array})[schema.array];
    if (!ctor || schema.dims.length !== 1 || !(value instanceof ctor) || value.length !== schema.dims[0])
      throw new TypeError('C array copy requires a bounded typed array of matching element type');
    return new ctor(value);
  }
  if (Object.hasOwn(schema, 'scalar')) {
    if (typeof value !== 'number' && typeof value !== 'bigint') throw new TypeError('C aggregate scalar type mismatch');
    return value;
  }
  throw new TypeError('unsupported C aggregate schema');
};

// C++ value-initialization for verified pointer-free standard-layout aggregates.
// The schema is made from Clang declarations, not inferred at JS runtime.
const cZeroAggregate = (schema, prototypes={}) => {
  if(schema.recordArray)return cByteRecordNDArray(schema.recordArray,schema.dims,prototypes);
  if(Object.hasOwn(schema,'pointerArray')){if(schema.stride!==8)throw new TypeError('Pointer array differs from LP64 ABI');return cPointerArray(schema.pointerArray);}
  if (Object.hasOwn(schema,'byteRecord')) return cInitByteRecord(schema.byteRecord,{},null,prototypes);
  if (Object.hasOwn(schema, 'pointer')) {
    if (schema.pointer !== true) throw new TypeError('Unverified pointer storage schema');
    return null;
  }
  if (Object.hasOwn(schema, 'scalar')) {
    const t = schema.scalar;
    if (/\b(?:long long|int64_t|uint64_t|unsigned long|size_t|uintptr_t|intptr_t)\b/.test(t)) return 0n;
    return 0;
  }
  if (Object.hasOwn(schema, 'array')) {
    const constructors = {Uint8Array,Int8Array,Uint16Array,Int16Array,Uint32Array,
                          Int32Array,Float32Array,Float64Array,BigInt64Array,BigUint64Array};
    const C = constructors[schema.array];
    if (!C || !Array.isArray(schema.dims) || schema.dims.length === 0 || schema.dims.length > 8 ||
        schema.dims.some(n => !Number.isSafeInteger(n) || n < 0 || n > 1000000) ||
        schema.dims.reduce((a,b) => a*b, 1) > 1000000)
      throw new TypeError('Unverified C aggregate zero-array extent');
    if (schema.dims.length === 1) return new C(schema.dims[0]);
    return cNativeArray(schema.array,schema.dims);
  }
  if (Object.hasOwn(schema, 'record')) {
    const result = cMarkAggregate({});
    for (const [name, field] of Object.entries(schema.record)) {
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name) || name === '__proto__' ||
          name === 'constructor' || name === 'prototype')
        throw new TypeError('Unsafe C record field name');
      Object.defineProperty(result, name, {value:cZeroAggregate(field), enumerable:true, writable:true, configurable:true});
    }
    if (schema.pointerAliases !== undefined) {
      if (!Array.isArray(schema.pointerAliases)) throw new TypeError('Invalid C pointer union aliases');
      const seen = new Set();
      for (const group of schema.pointerAliases) {
        if (!Array.isArray(group) || group.length < 2 || group.some(name=>
            seen.has(name) || !Object.hasOwn(schema.record,name) ||
            schema.record[name]?.pointer !== true))
          throw new TypeError('Unverified C pointer alias group');
        let slot=null;
        for (const name of group) {
          seen.add(name);
          Object.defineProperty(result,name,{enumerable:true,configurable:false,
            get:()=>slot, set:value=>{slot=value;}});
        }
      }
    }
    return result;
  }
  // Arbitrarily choosing the active member of a union would be wrong.
  throw new TypeError('C zero aggregate requires nonoverlapping proven field layout');
};

// Implicit trivial C++ assignment changes destination storage in place. Existing
// references to its fields, arrays and overlapping union views retain identity.
// cCopyAggregate validates exact Clang storage schemas and snapshots the source
// before any mutation, including self-assignment or overlapping storage.
const cAssignAggregate = (destination, source, schema, assignmentProof=null) => {
  if(assignmentProof!==null){
    // Only a same-record assignment selected by the original Clang AST may
    // take this path. A JS method prototype occupies no native object bytes.
    // Constructors, authored assignment and generic object copies stay strict.
    const p=assignmentProof,expected=schema.byteRecord;
    if(p.abi!=='source-clang-trivial-record-assignment/1'||!p.clang_method_id||
       !p.record_name||p.record_name!==p.source_record||
       !['copyAssign','moveAssign','clang-trivial-implicit-byte-copy'].includes(p.assignment_mode)||
       p.native_layout?.abi!=='source-record-field-storage/1'||!expected||expected.projection)
      throw TypeError('Trivial record assignment lacks its original Clang proof');
    const stable=value=>Array.isArray(value)?value.map(stable):value&&typeof value==='object'?
      Object.fromEntries(Object.keys(value).sort().map(k=>[k,stable(value[k])])):value;
    const native=value=>JSON.stringify(stable(Object.fromEntries(Object.entries(value).filter(([k])=>k!=='prototype'))));
    const target=cByteRecordStorage.get(destination),input=cByteRecordStorage.get(source);
    if(!target||!input||target.bytes.length!==expected.size||input.bytes.length!==expected.size||
       native(JSON.parse(target.schema))!==native(expected)||native(JSON.parse(input.schema))!==native(expected))
      throw TypeError('Trivial record assignment differs from its original native layout');
    target.bytes.set(new Uint8Array(input.bytes));
    return destination;
  }
  const snapshot = cCopyAggregate(source, schema);
  cCopyAggregate(destination, schema);
  const commit = (target, value, shape) => {
    if (Object.hasOwn(shape, 'byteRecord')) {
      cByteRecordStorage.get(target).bytes.set(cByteRecordStorage.get(value).bytes);
    } else if (Object.hasOwn(shape,'pointerArray')) {
      target[Symbol.for('source-first.clang-byte-record-array/1')].set(value[Symbol.for('source-first.clang-byte-record-array/1')]);
    } else if (Object.hasOwn(shape, 'bytes') || Object.hasOwn(shape, 'array')) {
      target.set(value);
    } else if (Object.hasOwn(shape, 'record')) {
      for (const [name, field] of Object.entries(shape.record)) {
        if (Object.hasOwn(field, 'scalar') || Object.hasOwn(field, 'pointer')) target[name] = value[name];
        else commit(target[name], value[name], field);
      }
    } else throw new TypeError('C++ assignment requires original aggregate storage');
  };
  commit(destination, snapshot, schema);
  return destination;
};

function i32(value) { return typeof value === "bigint" ? Number(BigInt.asIntN(32,value)) : Number(value) | 0; }
function u32(value) { return typeof value === "bigint" ? Number(BigInt.asUintN(32,value)) : Number(value) >>> 0; }
function i64(value) { return BigInt.asIntN(64, BigInt(value)); }
function u64(value) { return BigInt.asUintN(64, BigInt(value)); }


const clz64 = value => {let v=BigInt.asUintN(64,BigInt(value));if(v===0n)return 64;let n=0;while((v&(1n<<63n))===0n){v<<=1n;n++;}return n;};
const ctz64 = (value,width) => {let v=BigInt.asUintN(width,BigInt(value));if(v===0n)return width;let n=0;while((v&1n)===0n){v>>=1n;n++;}return n;};
const popcnt = value => {let v=value,n=0;while(v){v&=v-1n;n++;}return n;};

const __builtin_unreachable = () => { throw new Error("C++ undefined behavior: reached __builtin_unreachable"); };
// C/C++ source: source/build/include/fix16.h:111
export const fix16_rad_to_deg_mult__header_global_2fa31b00bcdf9184 = i32(3754936);
function __cxx_static_address_b3502f5d8cc7dfc1172d321b() {
  return __cxx_static_address_b3502f5d8cc7dfc1172d321b.reference || (__cxx_static_address_b3502f5d8cc7dfc1172d321b.reference = {
    __cReference: true,
    get value() { return fix16_rad_to_deg_mult__header_global_2fa31b00bcdf9184; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:114
export const fix16_deg_to_rad_mult__header_global_ebd38fb98c6339c2 = i32(1144);
function __cxx_static_address_efa173ff3ffbc70b302259b3() {
  return __cxx_static_address_efa173ff3ffbc70b302259b3.reference || (__cxx_static_address_efa173ff3ffbc70b302259b3.reference = {
    __cReference: true,
    get value() { return fix16_deg_to_rad_mult__header_global_ebd38fb98c6339c2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:43
export const KICK_HIT____header_global_9ab951fd2127a105 = ((u32(((u32(0) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_43b6494267fe3386434aed59() {
  return __cxx_static_address_43b6494267fe3386434aed59.reference || (__cxx_static_address_43b6494267fe3386434aed59.reference = {
    __cReference: true,
    get value() { return KICK_HIT____header_global_9ab951fd2127a105; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:44
export const PISTOL_RICOCHET____header_global_d8e310ca05d072de = ((u32(((u32(1) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0078a1c6632c8d02ff6813cc() {
  return __cxx_static_address_0078a1c6632c8d02ff6813cc.reference || (__cxx_static_address_0078a1c6632c8d02ff6813cc.reference = {
    __cReference: true,
    get value() { return PISTOL_RICOCHET____header_global_d8e310ca05d072de; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:45
export const PISTOL_BODYHIT____header_global_ba1854b97e892255 = ((u32(((u32(2) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4ae3f949725760e4ee96cdb3() {
  return __cxx_static_address_4ae3f949725760e4ee96cdb3.reference || (__cxx_static_address_4ae3f949725760e4ee96cdb3.reference = {
    __cReference: true,
    get value() { return PISTOL_BODYHIT____header_global_ba1854b97e892255; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:46
export const PISTOL_FIRE____header_global_64696cb3234ce690 = ((u32(((u32(3) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_867590b269e9162fb9fc7908() {
  return __cxx_static_address_867590b269e9162fb9fc7908.reference || (__cxx_static_address_867590b269e9162fb9fc7908.reference = {
    __cReference: true,
    get value() { return PISTOL_FIRE____header_global_64696cb3234ce690; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:47
export const EJECT_CLIP____header_global_9c229ab00750da0a = ((u32(((u32(4) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a0ab31032027a56e874e59c5() {
  return __cxx_static_address_a0ab31032027a56e874e59c5.reference || (__cxx_static_address_a0ab31032027a56e874e59c5.reference = {
    __cReference: true,
    get value() { return EJECT_CLIP____header_global_9c229ab00750da0a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:48
export const INSERT_CLIP____header_global_d9183cad0d97d626 = ((u32(((u32(5) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_40dee7706b88efb6f17d9b3f() {
  return __cxx_static_address_40dee7706b88efb6f17d9b3f.reference || (__cxx_static_address_40dee7706b88efb6f17d9b3f.reference = {
    __cReference: true,
    get value() { return INSERT_CLIP____header_global_d9183cad0d97d626; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:49
export const CHAINGUN_FIRE____header_global_69d9f94b57752638 = ((u32(((u32(6) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6e8f1d0a9a727aaeb15313e1() {
  return __cxx_static_address_6e8f1d0a9a727aaeb15313e1.reference || (__cxx_static_address_6e8f1d0a9a727aaeb15313e1.reference = {
    __cReference: true,
    get value() { return CHAINGUN_FIRE____header_global_69d9f94b57752638; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:50
export const RPG_SHOOT____header_global_15f888a446b491d2 = ((u32(((u32(7) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_382801035d3da0a55c8b3c0f() {
  return __cxx_static_address_382801035d3da0a55c8b3c0f.reference || (__cxx_static_address_382801035d3da0a55c8b3c0f.reference = {
    __cReference: true,
    get value() { return RPG_SHOOT____header_global_15f888a446b491d2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:51
export const POOLBALLHIT____header_global_0ed7b3f4a87cf7b7 = ((u32(((u32(8) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4fc4e201bc17625bafdc6c30() {
  return __cxx_static_address_4fc4e201bc17625bafdc6c30.reference || (__cxx_static_address_4fc4e201bc17625bafdc6c30.reference = {
    __cReference: true,
    get value() { return POOLBALLHIT____header_global_0ed7b3f4a87cf7b7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:52
export const RPG_EXPLODE____header_global_e1703850eb1feeef = ((u32(((u32(9) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f733e774f82d1f506b0ddc93() {
  return __cxx_static_address_f733e774f82d1f506b0ddc93.reference || (__cxx_static_address_f733e774f82d1f506b0ddc93.reference = {
    __cReference: true,
    get value() { return RPG_EXPLODE____header_global_e1703850eb1feeef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:53
export const CAT_FIRE____header_global_a273946bc179c8dd = ((u32(((u32(10) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_83296b785820ca23debc2bd6() {
  return __cxx_static_address_83296b785820ca23debc2bd6.reference || (__cxx_static_address_83296b785820ca23debc2bd6.reference = {
    __cReference: true,
    get value() { return CAT_FIRE____header_global_a273946bc179c8dd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:54
export const SHRINKER_FIRE____header_global_5d107e49af7df222 = ((u32(((u32(11) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_20d6778fe13467597d8495c1() {
  return __cxx_static_address_20d6778fe13467597d8495c1.reference || (__cxx_static_address_20d6778fe13467597d8495c1.reference = {
    __cReference: true,
    get value() { return SHRINKER_FIRE____header_global_5d107e49af7df222; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:55
export const PIPEBOMB_BOUNCE____header_global_676b6359e1fbce6d = ((u32(((u32(13) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_204f2ca947e5703b7a68b444() {
  return __cxx_static_address_204f2ca947e5703b7a68b444.reference || (__cxx_static_address_204f2ca947e5703b7a68b444.reference = {
    __cReference: true,
    get value() { return PIPEBOMB_BOUNCE____header_global_676b6359e1fbce6d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:56
export const PIPEBOMB_EXPLODE____header_global_6baf92556de55216 = ((u32(((u32(14) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c24343b6babfbfca602098fe() {
  return __cxx_static_address_c24343b6babfbfca602098fe.reference || (__cxx_static_address_c24343b6babfbfca602098fe.reference = {
    __cReference: true,
    get value() { return PIPEBOMB_EXPLODE____header_global_6baf92556de55216; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:57
export const LASERTRIP_ONWALL____header_global_520a73e53bbd2c6f = ((u32(((u32(15) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8a2ae037a6a89670fcfffb89() {
  return __cxx_static_address_8a2ae037a6a89670fcfffb89.reference || (__cxx_static_address_8a2ae037a6a89670fcfffb89.reference = {
    __cReference: true,
    get value() { return LASERTRIP_ONWALL____header_global_520a73e53bbd2c6f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:58
export const LASERTRIP_ARMING____header_global_b97563e2ed9f53db = ((u32(((u32(16) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_784cc39c4f563deba2e2bf88() {
  return __cxx_static_address_784cc39c4f563deba2e2bf88.reference || (__cxx_static_address_784cc39c4f563deba2e2bf88.reference = {
    __cReference: true,
    get value() { return LASERTRIP_ARMING____header_global_b97563e2ed9f53db; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:59
export const LASERTRIP_EXPLODE____header_global_a7e06410872d07e1 = ((u32(((u32(17) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_964bdbce53deaa5e6c8cae22() {
  return __cxx_static_address_964bdbce53deaa5e6c8cae22.reference || (__cxx_static_address_964bdbce53deaa5e6c8cae22.reference = {
    __cReference: true,
    get value() { return LASERTRIP_EXPLODE____header_global_a7e06410872d07e1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:60
export const VENT_BUST____header_global_c0dbf7ebeed84b72 = ((u32(((u32(18) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3c0e28be12b151ca3ac044fb() {
  return __cxx_static_address_3c0e28be12b151ca3ac044fb.reference || (__cxx_static_address_3c0e28be12b151ca3ac044fb.reference = {
    __cReference: true,
    get value() { return VENT_BUST____header_global_c0dbf7ebeed84b72; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:61
export const GLASS_BREAKING____header_global_66c31b6bfa9164c4 = ((u32(((u32(19) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9d17e77a7b837eb4e943224f() {
  return __cxx_static_address_9d17e77a7b837eb4e943224f.reference || (__cxx_static_address_9d17e77a7b837eb4e943224f.reference = {
    __cReference: true,
    get value() { return GLASS_BREAKING____header_global_66c31b6bfa9164c4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:62
export const GLASS_HEAVYBREAK____header_global_8b6094a6052e2c22 = ((u32(((u32(20) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cea15c01f49ef85d1b52525d() {
  return __cxx_static_address_cea15c01f49ef85d1b52525d.reference || (__cxx_static_address_cea15c01f49ef85d1b52525d.reference = {
    __cReference: true,
    get value() { return GLASS_HEAVYBREAK____header_global_8b6094a6052e2c22; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:63
export const SHORT_CIRCUIT____header_global_279a93ed832cb2e3 = ((u32(((u32(21) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_90cc737bfa3fd2e679fad94a() {
  return __cxx_static_address_90cc737bfa3fd2e679fad94a.reference || (__cxx_static_address_90cc737bfa3fd2e679fad94a.reference = {
    __cReference: true,
    get value() { return SHORT_CIRCUIT____header_global_279a93ed832cb2e3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:64
export const ITEM_SPLASH____header_global_493561b21e58dfa1 = ((u32(((u32(22) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_28e2dad70829f5fae1678cb4() {
  return __cxx_static_address_28e2dad70829f5fae1678cb4.reference || (__cxx_static_address_28e2dad70829f5fae1678cb4.reference = {
    __cReference: true,
    get value() { return ITEM_SPLASH____header_global_493561b21e58dfa1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:65
export const DUKE_GASP____header_global_df408af7eb804fa5 = ((u32(((u32(25) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_278b325ea79a2987aa070da0() {
  return __cxx_static_address_278b325ea79a2987aa070da0.reference || (__cxx_static_address_278b325ea79a2987aa070da0.reference = {
    __cReference: true,
    get value() { return DUKE_GASP____header_global_df408af7eb804fa5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:66
export const SLIM_RECOG____header_global_111de361d76a9eb2 = ((u32(((u32(26) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8154c51276ff568e6e8a6426() {
  return __cxx_static_address_8154c51276ff568e6e8a6426.reference || (__cxx_static_address_8154c51276ff568e6e8a6426.reference = {
    __cReference: true,
    get value() { return SLIM_RECOG____header_global_111de361d76a9eb2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:67
export const DUKE_URINATE____header_global_30b55f2bf50db3c6 = ((u32(((u32(28) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3da171577ed5b19bcaeedaf3() {
  return __cxx_static_address_3da171577ed5b19bcaeedaf3.reference || (__cxx_static_address_3da171577ed5b19bcaeedaf3.reference = {
    __cReference: true,
    get value() { return DUKE_URINATE____header_global_30b55f2bf50db3c6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:68
export const ENDSEQVOL3SND2____header_global_7594b4c1aa014dae = ((u32(((u32(29) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9c16f7c17f4411373252a725() {
  return __cxx_static_address_9c16f7c17f4411373252a725.reference || (__cxx_static_address_9c16f7c17f4411373252a725.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND2____header_global_7594b4c1aa014dae; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:69
export const ENDSEQVOL3SND3____header_global_23620429b4c4b11f = ((u32(((u32(30) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_18cd09cef3aa73431965003b() {
  return __cxx_static_address_18cd09cef3aa73431965003b.reference || (__cxx_static_address_18cd09cef3aa73431965003b.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND3____header_global_23620429b4c4b11f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:70
export const DUKE_CRACK____header_global_081fffd271f85da9 = ((u32(((u32(33) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5deaca0516183c5f270c1c7a() {
  return __cxx_static_address_5deaca0516183c5f270c1c7a.reference || (__cxx_static_address_5deaca0516183c5f270c1c7a.reference = {
    __cReference: true,
    get value() { return DUKE_CRACK____header_global_081fffd271f85da9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:71
export const SLIM_ATTACK____header_global_3b50b70dd3f232ca = ((u32(((u32(34) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4ae20d1ac7520fb424947b6f() {
  return __cxx_static_address_4ae20d1ac7520fb424947b6f.reference || (__cxx_static_address_4ae20d1ac7520fb424947b6f.reference = {
    __cReference: true,
    get value() { return SLIM_ATTACK____header_global_3b50b70dd3f232ca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:72
export const SOMETHINGHITFORCE____header_global_07f482a18b8e75cb = ((u32(((u32(35) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ec134e71ada4519fdb6a8994() {
  return __cxx_static_address_ec134e71ada4519fdb6a8994.reference || (__cxx_static_address_ec134e71ada4519fdb6a8994.reference = {
    __cReference: true,
    get value() { return SOMETHINGHITFORCE____header_global_07f482a18b8e75cb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:73
export const DUKE_DRINKING____header_global_26332490d0c23e30 = ((u32(((u32(36) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_39ff0d3bc42a1cd3d1c9475d() {
  return __cxx_static_address_39ff0d3bc42a1cd3d1c9475d.reference || (__cxx_static_address_39ff0d3bc42a1cd3d1c9475d.reference = {
    __cReference: true,
    get value() { return DUKE_DRINKING____header_global_26332490d0c23e30; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:74
export const DUKE_GRUNT____header_global_78e34fad8565a460 = ((u32(((u32(38) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bc71d586dd8fdab89032186d() {
  return __cxx_static_address_bc71d586dd8fdab89032186d.reference || (__cxx_static_address_bc71d586dd8fdab89032186d.reference = {
    __cReference: true,
    get value() { return DUKE_GRUNT____header_global_78e34fad8565a460; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:75
export const DUKE_HARTBEAT____header_global_3cc1ba1485f4db93 = ((u32(((u32(39) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_159a44979faed6e30b5b84ab() {
  return __cxx_static_address_159a44979faed6e30b5b84ab.reference || (__cxx_static_address_159a44979faed6e30b5b84ab.reference = {
    __cReference: true,
    get value() { return DUKE_HARTBEAT____header_global_3cc1ba1485f4db93; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:76
export const DUKE_ONWATER____header_global_72a20c225e0ce58d = ((u32(((u32(40) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6aeb6939737a33aa61bfd951() {
  return __cxx_static_address_6aeb6939737a33aa61bfd951.reference || (__cxx_static_address_6aeb6939737a33aa61bfd951.reference = {
    __cReference: true,
    get value() { return DUKE_ONWATER____header_global_72a20c225e0ce58d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:77
export const DUKE_LAND____header_global_220ec1d9c3657cc9 = ((u32(((u32(42) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_acf6c33b8c2ae5ab9ad980b2() {
  return __cxx_static_address_acf6c33b8c2ae5ab9ad980b2.reference || (__cxx_static_address_acf6c33b8c2ae5ab9ad980b2.reference = {
    __cReference: true,
    get value() { return DUKE_LAND____header_global_220ec1d9c3657cc9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:78
export const DUKE_WALKINDUCTS____header_global_9ff0e028b591b7f5 = ((u32(((u32(43) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ee542594aa733a568760687c() {
  return __cxx_static_address_ee542594aa733a568760687c.reference || (__cxx_static_address_ee542594aa733a568760687c.reference = {
    __cReference: true,
    get value() { return DUKE_WALKINDUCTS____header_global_9ff0e028b591b7f5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:79
export const DUKE_UNDERWATER____header_global_91064b88ddaead5c = ((u32(((u32(48) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7cdc78d83155c2c588dd732d() {
  return __cxx_static_address_7cdc78d83155c2c588dd732d.reference || (__cxx_static_address_7cdc78d83155c2c588dd732d.reference = {
    __cReference: true,
    get value() { return DUKE_UNDERWATER____header_global_91064b88ddaead5c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:80
export const DUKE_JETPACK_ON____header_global_383dc67b18d6fb42 = ((u32(((u32(49) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_df9b225904fbad74125caaf5() {
  return __cxx_static_address_df9b225904fbad74125caaf5.reference || (__cxx_static_address_df9b225904fbad74125caaf5.reference = {
    __cReference: true,
    get value() { return DUKE_JETPACK_ON____header_global_383dc67b18d6fb42; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:81
export const DUKE_JETPACK_IDLE____header_global_0198511d0d78be55 = ((u32(((u32(50) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_54875b0d8f4d7bab28c79004() {
  return __cxx_static_address_54875b0d8f4d7bab28c79004.reference || (__cxx_static_address_54875b0d8f4d7bab28c79004.reference = {
    __cReference: true,
    get value() { return DUKE_JETPACK_IDLE____header_global_0198511d0d78be55; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:82
export const DUKE_JETPACK_OFF____header_global_1bbea260d2179a75 = ((u32(((u32(51) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_084d14cf79274142b6f64bc7() {
  return __cxx_static_address_084d14cf79274142b6f64bc7.reference || (__cxx_static_address_084d14cf79274142b6f64bc7.reference = {
    __cReference: true,
    get value() { return DUKE_JETPACK_OFF____header_global_1bbea260d2179a75; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:83
export const DUKETALKTOBOSS____header_global_1f635de0baa35817 = ((u32(((u32(56) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fd9ad4a5622b66be95d283e7() {
  return __cxx_static_address_fd9ad4a5622b66be95d283e7.reference || (__cxx_static_address_fd9ad4a5622b66be95d283e7.reference = {
    __cReference: true,
    get value() { return DUKETALKTOBOSS____header_global_1f635de0baa35817; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:84
export const SQUISHED____header_global_ddfa5f6f08bf6845 = ((u32(((u32(69) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_168b842067c9022d52f93f0b() {
  return __cxx_static_address_168b842067c9022d52f93f0b.reference || (__cxx_static_address_168b842067c9022d52f93f0b.reference = {
    __cReference: true,
    get value() { return SQUISHED____header_global_ddfa5f6f08bf6845; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:85
export const TELEPORTER____header_global_7dbd565ca1182baf = ((u32(((u32(70) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_297cc9b8d11bcd46d865b9ec() {
  return __cxx_static_address_297cc9b8d11bcd46d865b9ec.reference || (__cxx_static_address_297cc9b8d11bcd46d865b9ec.reference = {
    __cReference: true,
    get value() { return TELEPORTER____header_global_7dbd565ca1182baf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:86
export const ELEVATOR_ON____header_global_6663e2c27a6c2054 = ((u32(((u32(71) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_606d97c913fb071402c18d8c() {
  return __cxx_static_address_606d97c913fb071402c18d8c.reference || (__cxx_static_address_606d97c913fb071402c18d8c.reference = {
    __cReference: true,
    get value() { return ELEVATOR_ON____header_global_6663e2c27a6c2054; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:87
export const ELEVATOR_OFF____header_global_1eb4aeb0a18cd2b9 = ((u32(((u32(73) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fbacaf5ea6db9aa52c9775ad() {
  return __cxx_static_address_fbacaf5ea6db9aa52c9775ad.reference || (__cxx_static_address_fbacaf5ea6db9aa52c9775ad.reference = {
    __cReference: true,
    get value() { return ELEVATOR_OFF____header_global_1eb4aeb0a18cd2b9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:88
export const SUBWAY____header_global_e9193836737e86a3 = ((u32(((u32(75) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9bdcc5c1cd08ab2fa519d29e() {
  return __cxx_static_address_9bdcc5c1cd08ab2fa519d29e.reference || (__cxx_static_address_9bdcc5c1cd08ab2fa519d29e.reference = {
    __cReference: true,
    get value() { return SUBWAY____header_global_e9193836737e86a3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:89
export const SWITCH_ON____header_global_c0a57925c0119fea = ((u32(((u32(76) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6db7190caf07afc8dbc741ef() {
  return __cxx_static_address_6db7190caf07afc8dbc741ef.reference || (__cxx_static_address_6db7190caf07afc8dbc741ef.reference = {
    __cReference: true,
    get value() { return SWITCH_ON____header_global_c0a57925c0119fea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:90
export const FLUSH_TOILET____header_global_201b57c878faa870 = ((u32(((u32(79) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1d91cb9320b0cb2143acc2f5() {
  return __cxx_static_address_1d91cb9320b0cb2143acc2f5.reference || (__cxx_static_address_1d91cb9320b0cb2143acc2f5.reference = {
    __cReference: true,
    get value() { return FLUSH_TOILET____header_global_201b57c878faa870; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:91
export const EARTHQUAKE____header_global_a2d97565410a98a7 = ((u32(((u32(81) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c79135d931bea5b68704cb87() {
  return __cxx_static_address_c79135d931bea5b68704cb87.reference || (__cxx_static_address_c79135d931bea5b68704cb87.reference = {
    __cReference: true,
    get value() { return EARTHQUAKE____header_global_a2d97565410a98a7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:92
export const END_OF_LEVEL_WARN____header_global_35066ab3e583335f = ((u32(((u32(83) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_361cb5863a50114a20ad9ffb() {
  return __cxx_static_address_361cb5863a50114a20ad9ffb.reference || (__cxx_static_address_361cb5863a50114a20ad9ffb.reference = {
    __cReference: true,
    get value() { return END_OF_LEVEL_WARN____header_global_35066ab3e583335f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:93
export const WIND_AMBIENCE____header_global_699c9f32f31f9077 = ((u32(((u32(91) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_477e80a74893ed4d8bbb17a4() {
  return __cxx_static_address_477e80a74893ed4d8bbb17a4.reference || (__cxx_static_address_477e80a74893ed4d8bbb17a4.reference = {
    __cReference: true,
    get value() { return WIND_AMBIENCE____header_global_699c9f32f31f9077; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:94
export const SOMETHING_DRIPPING____header_global_05d8c022242294cd = ((u32(((u32(92) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ea533a8702d14ae9235dfb32() {
  return __cxx_static_address_ea533a8702d14ae9235dfb32.reference || (__cxx_static_address_ea533a8702d14ae9235dfb32.reference = {
    __cReference: true,
    get value() { return SOMETHING_DRIPPING____header_global_05d8c022242294cd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:95
export const BOS1_RECOG____header_global_8132557187f61257 = ((u32(((u32(97) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3e31b2f5e77bb344303c2f81() {
  return __cxx_static_address_3e31b2f5e77bb344303c2f81.reference || (__cxx_static_address_3e31b2f5e77bb344303c2f81.reference = {
    __cReference: true,
    get value() { return BOS1_RECOG____header_global_8132557187f61257; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:96
export const BOS2_RECOG____header_global_20a1e4ad839b1f92 = ((u32(((u32(102) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f10789bfb5303f708dc990aa() {
  return __cxx_static_address_f10789bfb5303f708dc990aa.reference || (__cxx_static_address_f10789bfb5303f708dc990aa.reference = {
    __cReference: true,
    get value() { return BOS2_RECOG____header_global_20a1e4ad839b1f92; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:97
export const DUKE_GETWEAPON2____header_global_483c3421228f874e = ((u32(((u32(107) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0a9c879437ead08ee959ce68() {
  return __cxx_static_address_0a9c879437ead08ee959ce68.reference || (__cxx_static_address_0a9c879437ead08ee959ce68.reference = {
    __cReference: true,
    get value() { return DUKE_GETWEAPON2____header_global_483c3421228f874e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:98
export const SHOTGUN_FIRE____header_global_a02083a8585a7678 = ((u32(((u32(109) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d2d9c07e2626eb97e45407b9() {
  return __cxx_static_address_d2d9c07e2626eb97e45407b9.reference || (__cxx_static_address_d2d9c07e2626eb97e45407b9.reference = {
    __cReference: true,
    get value() { return SHOTGUN_FIRE____header_global_a02083a8585a7678; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:99
export const PRED_RECOG____header_global_d112192c8cbad46b = ((u32(((u32(111) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9b3adff0d2ddb9cea84facf8() {
  return __cxx_static_address_9b3adff0d2ddb9cea84facf8.reference || (__cxx_static_address_9b3adff0d2ddb9cea84facf8.reference = {
    __cReference: true,
    get value() { return PRED_RECOG____header_global_d112192c8cbad46b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:100
export const CAPT_RECOG____header_global_65e44a86c83c1909 = ((u32(((u32(117) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9500efd9284c000732241cd3() {
  return __cxx_static_address_9500efd9284c000732241cd3.reference || (__cxx_static_address_9500efd9284c000732241cd3.reference = {
    __cReference: true,
    get value() { return CAPT_RECOG____header_global_65e44a86c83c1909; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:101
export const PIG_RECOG____header_global_1196288d8eddbc43 = ((u32(((u32(121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a37f36a8e96a707a9e7ee754() {
  return __cxx_static_address_a37f36a8e96a707a9e7ee754.reference || (__cxx_static_address_a37f36a8e96a707a9e7ee754.reference = {
    __cReference: true,
    get value() { return PIG_RECOG____header_global_1196288d8eddbc43; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:102
export const RECO_ROAM____header_global_43cd7c2708f0dc16 = ((u32(((u32(125) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9980c6b26c75d169030f9223() {
  return __cxx_static_address_9980c6b26c75d169030f9223.reference || (__cxx_static_address_9980c6b26c75d169030f9223.reference = {
    __cReference: true,
    get value() { return RECO_ROAM____header_global_43cd7c2708f0dc16; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:103
export const RECO_RECOG____header_global_e7510a3636353715 = ((u32(((u32(126) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fddad9a591cf9a9896899aec() {
  return __cxx_static_address_fddad9a591cf9a9896899aec.reference || (__cxx_static_address_fddad9a591cf9a9896899aec.reference = {
    __cReference: true,
    get value() { return RECO_RECOG____header_global_e7510a3636353715; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:104
export const RECO_ATTACK____header_global_0bab36e7e5bc9d68 = ((u32(((u32(127) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bbb2d2996355de8d9eab0e5f() {
  return __cxx_static_address_bbb2d2996355de8d9eab0e5f.reference || (__cxx_static_address_bbb2d2996355de8d9eab0e5f.reference = {
    __cReference: true,
    get value() { return RECO_ATTACK____header_global_0bab36e7e5bc9d68; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:105
export const RECO_PAIN____header_global_d76e78ca78c9546f = ((u32(((u32(128) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e33e0e39db9de86c58c2c274() {
  return __cxx_static_address_e33e0e39db9de86c58c2c274.reference || (__cxx_static_address_e33e0e39db9de86c58c2c274.reference = {
    __cReference: true,
    get value() { return RECO_PAIN____header_global_d76e78ca78c9546f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:106
export const DRON_RECOG____header_global_45e4825b721d2a41 = ((u32(((u32(131) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4cdb6d5fbc2cb0f5a672c0b4() {
  return __cxx_static_address_4cdb6d5fbc2cb0f5a672c0b4.reference || (__cxx_static_address_4cdb6d5fbc2cb0f5a672c0b4.reference = {
    __cReference: true,
    get value() { return DRON_RECOG____header_global_45e4825b721d2a41; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:107
export const COMM_RECOG____header_global_8c5c246e5f74ff94 = ((u32(((u32(136) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_859f234b125b224bea07d589() {
  return __cxx_static_address_859f234b125b224bea07d589.reference || (__cxx_static_address_859f234b125b224bea07d589.reference = {
    __cReference: true,
    get value() { return COMM_RECOG____header_global_8c5c246e5f74ff94; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:108
export const OCTA_RECOG____header_global_a70e561c132aad33 = ((u32(((u32(141) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ddde09dbae18c587547463b5() {
  return __cxx_static_address_ddde09dbae18c587547463b5.reference || (__cxx_static_address_ddde09dbae18c587547463b5.reference = {
    __cReference: true,
    get value() { return OCTA_RECOG____header_global_a70e561c132aad33; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:109
export const TURR_RECOG____header_global_3cf7cdf568dcd3ca = ((u32(((u32(146) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_01af3e860a954fecf0e6518b() {
  return __cxx_static_address_01af3e860a954fecf0e6518b.reference || (__cxx_static_address_01af3e860a954fecf0e6518b.reference = {
    __cReference: true,
    get value() { return TURR_RECOG____header_global_3cf7cdf568dcd3ca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:110
export const SLIM_DYING____header_global_4b74b370b7e5ac07 = ((u32(((u32(149) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bf305e8e6dde0df8687ca070() {
  return __cxx_static_address_bf305e8e6dde0df8687ca070.reference || (__cxx_static_address_bf305e8e6dde0df8687ca070.reference = {
    __cReference: true,
    get value() { return SLIM_DYING____header_global_4b74b370b7e5ac07; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:111
export const BOS3_RECOG____header_global_b0fcbe22b74d0bf6 = ((u32(((u32(151) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0683c5676b37e37e53accf73() {
  return __cxx_static_address_0683c5676b37e37e53accf73.reference || (__cxx_static_address_0683c5676b37e37e53accf73.reference = {
    __cReference: true,
    get value() { return BOS3_RECOG____header_global_b0fcbe22b74d0bf6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:112
export const BOS1_WALK____header_global_f37e7e462ca6ab73 = ((u32(((u32(156) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3b477d19805cf9a2b927cbf6() {
  return __cxx_static_address_3b477d19805cf9a2b927cbf6.reference || (__cxx_static_address_3b477d19805cf9a2b927cbf6.reference = {
    __cReference: true,
    get value() { return BOS1_WALK____header_global_f37e7e462ca6ab73; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:113
export const THUD____header_global_84ba979b7ad29bb3 = ((u32(((u32(158) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bf8a78e7cb464ad16c64ff8e() {
  return __cxx_static_address_bf8a78e7cb464ad16c64ff8e.reference || (__cxx_static_address_bf8a78e7cb464ad16c64ff8e.reference = {
    __cReference: true,
    get value() { return THUD____header_global_84ba979b7ad29bb3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:114
export const WIERDSHOT_FLY____header_global_8b4f58b62f20a4db = ((u32(((u32(160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f85e4a44e9e5e0edee3457e9() {
  return __cxx_static_address_f85e4a44e9e5e0edee3457e9.reference || (__cxx_static_address_f85e4a44e9e5e0edee3457e9.reference = {
    __cReference: true,
    get value() { return WIERDSHOT_FLY____header_global_8b4f58b62f20a4db; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:115
export const SLIM_ROAM____header_global_85cbed62ddfd3463 = ((u32(((u32(163) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d667355ac5356b7557bda66d() {
  return __cxx_static_address_d667355ac5356b7557bda66d.reference || (__cxx_static_address_d667355ac5356b7557bda66d.reference = {
    __cReference: true,
    get value() { return SLIM_ROAM____header_global_85cbed62ddfd3463; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:116
export const SHOTGUN_COCK____header_global_ea5f71d97148ad27 = ((u32(((u32(169) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e7f1d68a75882b8f2a03f474() {
  return __cxx_static_address_e7f1d68a75882b8f2a03f474.reference || (__cxx_static_address_e7f1d68a75882b8f2a03f474.reference = {
    __cReference: true,
    get value() { return SHOTGUN_COCK____header_global_ea5f71d97148ad27; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:117
export const GENERIC_AMBIENCE17____header_global_5d11e248cd01efbf = ((u32(((u32(177) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_923b713d4b48d3d536ba3e0c() {
  return __cxx_static_address_923b713d4b48d3d536ba3e0c.reference || (__cxx_static_address_923b713d4b48d3d536ba3e0c.reference = {
    __cReference: true,
    get value() { return GENERIC_AMBIENCE17____header_global_5d11e248cd01efbf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:118
export const BONUS_SPEECH1____header_global_d01106096f136d18 = ((u32(((u32(195) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_44dadf98111c1156f5e2204c() {
  return __cxx_static_address_44dadf98111c1156f5e2204c.reference || (__cxx_static_address_44dadf98111c1156f5e2204c.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH1____header_global_d01106096f136d18; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:119
export const BONUS_SPEECH2____header_global_a81c06dd988bf63f = ((u32(((u32(196) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8101ef888d40f702f7f1085e() {
  return __cxx_static_address_8101ef888d40f702f7f1085e.reference || (__cxx_static_address_8101ef888d40f702f7f1085e.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH2____header_global_a81c06dd988bf63f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:120
export const BONUS_SPEECH3____header_global_3692a2d185eab80c = ((u32(((u32(197) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_734ce5c9d9e6995021564af0() {
  return __cxx_static_address_734ce5c9d9e6995021564af0.reference || (__cxx_static_address_734ce5c9d9e6995021564af0.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH3____header_global_3692a2d185eab80c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:121
export const BONUS_SPEECH4____header_global_a9b3bb04b688ddf8 = ((u32(((u32(199) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2399b334935267f6d66c6dff() {
  return __cxx_static_address_2399b334935267f6d66c6dff.reference || (__cxx_static_address_2399b334935267f6d66c6dff.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH4____header_global_a9b3bb04b688ddf8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:122
export const DUKE_LAND_HURT____header_global_a09a2446d75ef18a = ((u32(((u32(200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2b6a2cfdfb6f57c6eb700d9f() {
  return __cxx_static_address_2b6a2cfdfb6f57c6eb700d9f.reference || (__cxx_static_address_2b6a2cfdfb6f57c6eb700d9f.reference = {
    __cReference: true,
    get value() { return DUKE_LAND_HURT____header_global_a09a2446d75ef18a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:123
export const DUKE_SEARCH2____header_global_7d64618323ec9129 = ((u32(((u32(207) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d2d3ccb824991c617863370b() {
  return __cxx_static_address_d2d3ccb824991c617863370b.reference || (__cxx_static_address_d2d3ccb824991c617863370b.reference = {
    __cReference: true,
    get value() { return DUKE_SEARCH2____header_global_7d64618323ec9129; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:124
export const DUKE_CRACK2____header_global_177973c849ade479 = ((u32(((u32(208) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_259dfbd5035d918ea2e053ba() {
  return __cxx_static_address_259dfbd5035d918ea2e053ba.reference || (__cxx_static_address_259dfbd5035d918ea2e053ba.reference = {
    __cReference: true,
    get value() { return DUKE_CRACK2____header_global_177973c849ade479; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:125
export const DUKE_SEARCH____header_global_36f45b1b11659556 = ((u32(((u32(209) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a784d6ba1db27255c6426da1() {
  return __cxx_static_address_a784d6ba1db27255c6426da1.reference || (__cxx_static_address_a784d6ba1db27255c6426da1.reference = {
    __cReference: true,
    get value() { return DUKE_SEARCH____header_global_36f45b1b11659556; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:126
export const DUKE_GET____header_global_04a103c24afb8fd1 = ((u32(((u32(210) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_587de37f41e2336b7fc9971f() {
  return __cxx_static_address_587de37f41e2336b7fc9971f.reference || (__cxx_static_address_587de37f41e2336b7fc9971f.reference = {
    __cReference: true,
    get value() { return DUKE_GET____header_global_04a103c24afb8fd1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:127
export const DUKE_LONGTERM_PAIN____header_global_436620058966d95c = ((u32(((u32(211) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ff5ae3eee6a5e47c6fb4c9aa() {
  return __cxx_static_address_ff5ae3eee6a5e47c6fb4c9aa.reference || (__cxx_static_address_ff5ae3eee6a5e47c6fb4c9aa.reference = {
    __cReference: true,
    get value() { return DUKE_LONGTERM_PAIN____header_global_436620058966d95c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:128
export const MONITOR_ACTIVE____header_global_71b635723b73894a = ((u32(((u32(212) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d303a680b887f1c7e3347b2c() {
  return __cxx_static_address_d303a680b887f1c7e3347b2c.reference || (__cxx_static_address_d303a680b887f1c7e3347b2c.reference = {
    __cReference: true,
    get value() { return MONITOR_ACTIVE____header_global_71b635723b73894a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:129
export const NITEVISION_ONOFF____header_global_76ed0612b55bf397 = ((u32(((u32(213) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a701a9dbb278cfdb2b809ace() {
  return __cxx_static_address_a701a9dbb278cfdb2b809ace.reference || (__cxx_static_address_a701a9dbb278cfdb2b809ace.reference = {
    __cReference: true,
    get value() { return NITEVISION_ONOFF____header_global_76ed0612b55bf397; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:130
export const DUKE_CRACK_FIRST____header_global_c0a55d0e8869bca6 = ((u32(((u32(215) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_becdb0499deeaf520dd30908() {
  return __cxx_static_address_becdb0499deeaf520dd30908.reference || (__cxx_static_address_becdb0499deeaf520dd30908.reference = {
    __cReference: true,
    get value() { return DUKE_CRACK_FIRST____header_global_c0a55d0e8869bca6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:131
export const DUKE_USEMEDKIT____header_global_3aca0d65902c4017 = ((u32(((u32(216) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ce3833ad39d334c0a07f8afa() {
  return __cxx_static_address_ce3833ad39d334c0a07f8afa.reference || (__cxx_static_address_ce3833ad39d334c0a07f8afa.reference = {
    __cReference: true,
    get value() { return DUKE_USEMEDKIT____header_global_3aca0d65902c4017; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:132
export const DUKE_TAKEPILLS____header_global_b9291bbaba89f710 = ((u32(((u32(217) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eee4bf4718ed1f514e0f0f8a() {
  return __cxx_static_address_eee4bf4718ed1f514e0f0f8a.reference || (__cxx_static_address_eee4bf4718ed1f514e0f0f8a.reference = {
    __cReference: true,
    get value() { return DUKE_TAKEPILLS____header_global_b9291bbaba89f710; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:133
export const DUKE_PISSRELIEF____header_global_f9929f69f61014ff = ((u32(((u32(218) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4841637d31eab0d6ad5e70f2() {
  return __cxx_static_address_4841637d31eab0d6ad5e70f2.reference || (__cxx_static_address_4841637d31eab0d6ad5e70f2.reference = {
    __cReference: true,
    get value() { return DUKE_PISSRELIEF____header_global_f9929f69f61014ff; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:134
export const SELECT_WEAPON____header_global_05d1bf3e9599453c = ((u32(((u32(219) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b2fa196e0a94554a3e08984d() {
  return __cxx_static_address_b2fa196e0a94554a3e08984d.reference || (__cxx_static_address_b2fa196e0a94554a3e08984d.reference = {
    __cReference: true,
    get value() { return SELECT_WEAPON____header_global_05d1bf3e9599453c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:135
export const JIBBED_ACTOR5____header_global_32ae2c1ba01ef2fd = ((u32(((u32(226) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a85229b9e84ae919275c351f() {
  return __cxx_static_address_a85229b9e84ae919275c351f.reference || (__cxx_static_address_a85229b9e84ae919275c351f.reference = {
    __cReference: true,
    get value() { return JIBBED_ACTOR5____header_global_32ae2c1ba01ef2fd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:136
export const JIBBED_ACTOR6____header_global_7437a3f446d6b514 = ((u32(((u32(227) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c094160bb37e648997270f12() {
  return __cxx_static_address_c094160bb37e648997270f12.reference || (__cxx_static_address_c094160bb37e648997270f12.reference = {
    __cReference: true,
    get value() { return JIBBED_ACTOR6____header_global_7437a3f446d6b514; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:137
export const DUKE_GOTHEALTHATLOW____header_global_f4c4505411efd936 = ((u32(((u32(229) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ff742784fdad4ab1618adbcf() {
  return __cxx_static_address_ff742784fdad4ab1618adbcf.reference || (__cxx_static_address_ff742784fdad4ab1618adbcf.reference = {
    __cReference: true,
    get value() { return DUKE_GOTHEALTHATLOW____header_global_f4c4505411efd936; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:138
export const BOSSTALKTODUKE____header_global_68d73e421ea455ac = ((u32(((u32(230) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_31f66065ec60121dcff2e02c() {
  return __cxx_static_address_31f66065ec60121dcff2e02c.reference || (__cxx_static_address_31f66065ec60121dcff2e02c.reference = {
    __cReference: true,
    get value() { return BOSSTALKTODUKE____header_global_68d73e421ea455ac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:139
export const WAR_AMBIENCE2____header_global_643e7de32bcfd40a = ((u32(((u32(232) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0423fd37d2e95cacc3b4f3a8() {
  return __cxx_static_address_0423fd37d2e95cacc3b4f3a8.reference || (__cxx_static_address_0423fd37d2e95cacc3b4f3a8.reference = {
    __cReference: true,
    get value() { return WAR_AMBIENCE2____header_global_643e7de32bcfd40a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:140
export const EXITMENUSOUND____header_global_506a7841b2e16a11 = ((u32(((u32(243) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6e5560f74c1ec6e52c8432b1() {
  return __cxx_static_address_6e5560f74c1ec6e52c8432b1.reference || (__cxx_static_address_6e5560f74c1ec6e52c8432b1.reference = {
    __cReference: true,
    get value() { return EXITMENUSOUND____header_global_506a7841b2e16a11; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:141
export const FLY_BY____header_global_4ac4adea2e2a7fad = ((u32(((u32(244) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_12908497dd5e7af8c04cd417() {
  return __cxx_static_address_12908497dd5e7af8c04cd417.reference || (__cxx_static_address_12908497dd5e7af8c04cd417.reference = {
    __cReference: true,
    get value() { return FLY_BY____header_global_4ac4adea2e2a7fad; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:142
export const DUKE_SCREAM____header_global_b22ac932f88d1e1e = ((u32(((u32(245) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_461b320e63a9f5b51b5e0101() {
  return __cxx_static_address_461b320e63a9f5b51b5e0101.reference || (__cxx_static_address_461b320e63a9f5b51b5e0101.reference = {
    __cReference: true,
    get value() { return DUKE_SCREAM____header_global_b22ac932f88d1e1e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:143
export const SHRINKER_HIT____header_global_92a37c92893a3bd9 = ((u32(((u32(246) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a92e726032fde4eb632f8426() {
  return __cxx_static_address_a92e726032fde4eb632f8426.reference || (__cxx_static_address_a92e726032fde4eb632f8426.reference = {
    __cReference: true,
    get value() { return SHRINKER_HIT____header_global_92a37c92893a3bd9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:144
export const RATTY____header_global_7e3556a0569a1a77 = ((u32(((u32(247) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_41e59849d8cf0314cdf9154b() {
  return __cxx_static_address_41e59849d8cf0314cdf9154b.reference || (__cxx_static_address_41e59849d8cf0314cdf9154b.reference = {
    __cReference: true,
    get value() { return RATTY____header_global_7e3556a0569a1a77; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:145
export const BONUSMUSIC____header_global_362d9a46a97bd161 = ((u32(((u32(249) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_64a58036fd43fffaf934abe2() {
  return __cxx_static_address_64a58036fd43fffaf934abe2.reference || (__cxx_static_address_64a58036fd43fffaf934abe2.reference = {
    __cReference: true,
    get value() { return BONUSMUSIC____header_global_362d9a46a97bd161; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:146
export const DUKE_GETWEAPON6____header_global_b4cea2934678d47a = ((u32(((u32(264) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_325ea1fcea05ce9a777bac75() {
  return __cxx_static_address_325ea1fcea05ce9a777bac75.reference || (__cxx_static_address_325ea1fcea05ce9a777bac75.reference = {
    __cReference: true,
    get value() { return DUKE_GETWEAPON6____header_global_b4cea2934678d47a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:147
export const ALIEN_SWITCH1____header_global_ee7bd703d660bf6e = ((u32(((u32(272) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4ecf9a749bef2ce043a2847c() {
  return __cxx_static_address_4ecf9a749bef2ce043a2847c.reference || (__cxx_static_address_4ecf9a749bef2ce043a2847c.reference = {
    __cReference: true,
    get value() { return ALIEN_SWITCH1____header_global_ee7bd703d660bf6e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:148
export const RIPHEADNECK____header_global_6c0a90f4716d6ffa = ((u32(((u32(284) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_95f322e63e0e93127b848dea() {
  return __cxx_static_address_95f322e63e0e93127b848dea.reference || (__cxx_static_address_95f322e63e0e93127b848dea.reference = {
    __cReference: true,
    get value() { return RIPHEADNECK____header_global_6c0a90f4716d6ffa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:149
export const ENDSEQVOL3SND4____header_global_3f7cb65f61979028 = ((u32(((u32(288) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_391e7253b20e6d38711d6132() {
  return __cxx_static_address_391e7253b20e6d38711d6132.reference || (__cxx_static_address_391e7253b20e6d38711d6132.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND4____header_global_3f7cb65f61979028; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:150
export const ENDSEQVOL3SND5____header_global_7c0799cb6841f426 = ((u32(((u32(289) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5068c4237b6dab745d7038e7() {
  return __cxx_static_address_5068c4237b6dab745d7038e7.reference || (__cxx_static_address_5068c4237b6dab745d7038e7.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND5____header_global_7c0799cb6841f426; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:151
export const ENDSEQVOL3SND6____header_global_7bb7ec430e57c4c4 = ((u32(((u32(290) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_23e2358f32c68a5c5e32bd8e() {
  return __cxx_static_address_23e2358f32c68a5c5e32bd8e.reference || (__cxx_static_address_23e2358f32c68a5c5e32bd8e.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND6____header_global_7bb7ec430e57c4c4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:152
export const ENDSEQVOL3SND7____header_global_5898bb52ffd4b5d1 = ((u32(((u32(291) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_857ef9d0496a7e9b3f14c8d4() {
  return __cxx_static_address_857ef9d0496a7e9b3f14c8d4.reference || (__cxx_static_address_857ef9d0496a7e9b3f14c8d4.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND7____header_global_5898bb52ffd4b5d1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:153
export const ENDSEQVOL3SND8____header_global_db33afcbe0500887 = ((u32(((u32(292) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9aabcebbbb7bc9082f08342f() {
  return __cxx_static_address_9aabcebbbb7bc9082f08342f.reference || (__cxx_static_address_9aabcebbbb7bc9082f08342f.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND8____header_global_db33afcbe0500887; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:154
export const ENDSEQVOL3SND9____header_global_66f008e2cfbd1d45 = ((u32(((u32(293) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a634ca81e91e75a06a94512a() {
  return __cxx_static_address_a634ca81e91e75a06a94512a.reference || (__cxx_static_address_a634ca81e91e75a06a94512a.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND9____header_global_66f008e2cfbd1d45; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:155
export const WHIPYOURASS____header_global_72316cf84ef91dac = ((u32(((u32(294) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f643b3d177833fb916dc44fe() {
  return __cxx_static_address_f643b3d177833fb916dc44fe.reference || (__cxx_static_address_f643b3d177833fb916dc44fe.reference = {
    __cReference: true,
    get value() { return WHIPYOURASS____header_global_72316cf84ef91dac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:156
export const ENDSEQVOL2SND1____header_global_419df8cff29c5283 = ((u32(((u32(295) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_94a905146d6b9012a51b78ae() {
  return __cxx_static_address_94a905146d6b9012a51b78ae.reference || (__cxx_static_address_94a905146d6b9012a51b78ae.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND1____header_global_419df8cff29c5283; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:157
export const ENDSEQVOL2SND2____header_global_a401fc3a91f5fc52 = ((u32(((u32(296) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b8fe0b27a3fe77f711aa41f1() {
  return __cxx_static_address_b8fe0b27a3fe77f711aa41f1.reference || (__cxx_static_address_b8fe0b27a3fe77f711aa41f1.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND2____header_global_a401fc3a91f5fc52; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:158
export const ENDSEQVOL2SND3____header_global_67e039a602f9a3f8 = ((u32(((u32(297) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c3e6bdd8472c68590ab3edda() {
  return __cxx_static_address_c3e6bdd8472c68590ab3edda.reference || (__cxx_static_address_c3e6bdd8472c68590ab3edda.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND3____header_global_67e039a602f9a3f8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:159
export const ENDSEQVOL2SND4____header_global_35970e1a296cb3be = ((u32(((u32(298) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_437a3be4bc9083048623be7a() {
  return __cxx_static_address_437a3be4bc9083048623be7a.reference || (__cxx_static_address_437a3be4bc9083048623be7a.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND4____header_global_35970e1a296cb3be; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:160
export const ENDSEQVOL2SND5____header_global_abf35063b03e2333 = ((u32(((u32(299) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_25d00c00ff2d6f413fbcd1f5() {
  return __cxx_static_address_25d00c00ff2d6f413fbcd1f5.reference || (__cxx_static_address_25d00c00ff2d6f413fbcd1f5.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND5____header_global_abf35063b03e2333; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:161
export const ENDSEQVOL2SND6____header_global_0068e3f14480b287 = ((u32(((u32(300) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3106da9b939c24a4cc3d79d3() {
  return __cxx_static_address_3106da9b939c24a4cc3d79d3.reference || (__cxx_static_address_3106da9b939c24a4cc3d79d3.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND6____header_global_0068e3f14480b287; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:162
export const ENDSEQVOL2SND7____header_global_778861bb824a9804 = ((u32(((u32(301) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0774122b636705f2910d3645() {
  return __cxx_static_address_0774122b636705f2910d3645.reference || (__cxx_static_address_0774122b636705f2910d3645.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND7____header_global_778861bb824a9804; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:163
export const SOMETHINGFROZE____header_global_e4c19caa61e5fa71 = ((u32(((u32(303) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d558d0e04426d4152c7acb66() {
  return __cxx_static_address_d558d0e04426d4152c7acb66.reference || (__cxx_static_address_d558d0e04426d4152c7acb66.reference = {
    __cReference: true,
    get value() { return SOMETHINGFROZE____header_global_e4c19caa61e5fa71; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:164
export const WIND_REPEAT____header_global_afa566997ae91def = ((u32(((u32(308) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e3be44e75fe034ee054c663d() {
  return __cxx_static_address_e3be44e75fe034ee054c663d.reference || (__cxx_static_address_e3be44e75fe034ee054c663d.reference = {
    __cReference: true,
    get value() { return WIND_REPEAT____header_global_afa566997ae91def; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:165
export const BOS4_RECOG____header_global_6e78de779492793a = ((u32(((u32(342) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_10ff1ab24457ffecd850e041() {
  return __cxx_static_address_10ff1ab24457ffecd850e041.reference || (__cxx_static_address_10ff1ab24457ffecd850e041.reference = {
    __cReference: true,
    get value() { return BOS4_RECOG____header_global_6e78de779492793a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:166
export const LIGHTNING_SLAP____header_global_12dad42e248b1e89 = ((u32(((u32(351) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c12839e72059cc003b0c10f5() {
  return __cxx_static_address_c12839e72059cc003b0c10f5.reference || (__cxx_static_address_c12839e72059cc003b0c10f5.reference = {
    __cReference: true,
    get value() { return LIGHTNING_SLAP____header_global_12dad42e248b1e89; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:167
export const THUNDER____header_global_6c0ebb84050eb9e5 = ((u32(((u32(352) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c6363633760af6b7eace5e56() {
  return __cxx_static_address_c6363633760af6b7eace5e56.reference || (__cxx_static_address_c6363633760af6b7eace5e56.reference = {
    __cReference: true,
    get value() { return THUNDER____header_global_6c0ebb84050eb9e5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:168
export const INTRO4_1____header_global_9c169ce9b16d5f71 = ((u32(((u32(363) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b347319384f49639b6bbaabc() {
  return __cxx_static_address_b347319384f49639b6bbaabc.reference || (__cxx_static_address_b347319384f49639b6bbaabc.reference = {
    __cReference: true,
    get value() { return INTRO4_1____header_global_9c169ce9b16d5f71; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:169
export const INTRO4_2____header_global_62122012408e3b97 = ((u32(((u32(364) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d45a2de5fff4f02ccbcee605() {
  return __cxx_static_address_d45a2de5fff4f02ccbcee605.reference || (__cxx_static_address_d45a2de5fff4f02ccbcee605.reference = {
    __cReference: true,
    get value() { return INTRO4_2____header_global_62122012408e3b97; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:170
export const INTRO4_3____header_global_25682aaed2b0053d = ((u32(((u32(365) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_19d3613ca51e97d65923c58f() {
  return __cxx_static_address_19d3613ca51e97d65923c58f.reference || (__cxx_static_address_19d3613ca51e97d65923c58f.reference = {
    __cReference: true,
    get value() { return INTRO4_3____header_global_25682aaed2b0053d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:171
export const INTRO4_4____header_global_9da015664dbd12a9 = ((u32(((u32(366) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_07e9a8f3ecef7ebdff04a6f0() {
  return __cxx_static_address_07e9a8f3ecef7ebdff04a6f0.reference || (__cxx_static_address_07e9a8f3ecef7ebdff04a6f0.reference = {
    __cReference: true,
    get value() { return INTRO4_4____header_global_9da015664dbd12a9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:172
export const INTRO4_5____header_global_91b99ffe69927d33 = ((u32(((u32(367) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f14df2b5aad41d1abf68de1f() {
  return __cxx_static_address_f14df2b5aad41d1abf68de1f.reference || (__cxx_static_address_f14df2b5aad41d1abf68de1f.reference = {
    __cReference: true,
    get value() { return INTRO4_5____header_global_91b99ffe69927d33; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:173
export const INTRO4_6____header_global_65a413a56b9f6639 = ((u32(((u32(368) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5125d7bb8fc6ce880f1ec16c() {
  return __cxx_static_address_5125d7bb8fc6ce880f1ec16c.reference || (__cxx_static_address_5125d7bb8fc6ce880f1ec16c.reference = {
    __cReference: true,
    get value() { return INTRO4_6____header_global_65a413a56b9f6639; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:174
export const BOSS4_DEADSPEECH____header_global_537669e1b8a30332 = ((u32(((u32(370) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a2e32f5f6cdf2256e6607063() {
  return __cxx_static_address_a2e32f5f6cdf2256e6607063.reference || (__cxx_static_address_a2e32f5f6cdf2256e6607063.reference = {
    __cReference: true,
    get value() { return BOSS4_DEADSPEECH____header_global_537669e1b8a30332; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:175
export const BOSS4_FIRSTSEE____header_global_ce24d79c9fe3c6c3 = ((u32(((u32(371) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_916be164aa14ce5829c27a44() {
  return __cxx_static_address_916be164aa14ce5829c27a44.reference || (__cxx_static_address_916be164aa14ce5829c27a44.reference = {
    __cReference: true,
    get value() { return BOSS4_FIRSTSEE____header_global_ce24d79c9fe3c6c3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:176
export const VOL4ENDSND1____header_global_87a891fd7dc0ecaf = ((u32(((u32(384) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_82ec305e256523124f9c6cb9() {
  return __cxx_static_address_82ec305e256523124f9c6cb9.reference || (__cxx_static_address_82ec305e256523124f9c6cb9.reference = {
    __cReference: true,
    get value() { return VOL4ENDSND1____header_global_87a891fd7dc0ecaf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:177
export const VOL4ENDSND2____header_global_7f686bc0d1a0fd89 = ((u32(((u32(385) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bfd823868a02d9af3797da42() {
  return __cxx_static_address_bfd823868a02d9af3797da42.reference || (__cxx_static_address_bfd823868a02d9af3797da42.reference = {
    __cReference: true,
    get value() { return VOL4ENDSND2____header_global_7f686bc0d1a0fd89; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:178
export const EXPANDERSHOOT____header_global_903bb251d3ce6db0 = ((u32(((u32(388) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_29588358d14730e643dc03ca() {
  return __cxx_static_address_29588358d14730e643dc03ca.reference || (__cxx_static_address_29588358d14730e643dc03ca.reference = {
    __cReference: true,
    get value() { return EXPANDERSHOOT____header_global_903bb251d3ce6db0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:179
export const INTRO4_B____header_global_daa3be2fe93c5a23 = ((u32(((u32(392) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7bccd9f4ecd63c15b1d5c5fb() {
  return __cxx_static_address_7bccd9f4ecd63c15b1d5c5fb.reference || (__cxx_static_address_7bccd9f4ecd63c15b1d5c5fb.reference = {
    __cReference: true,
    get value() { return INTRO4_B____header_global_daa3be2fe93c5a23; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:180
export const BIGBANG____header_global_feedcb5f2f72d846 = ((u32(((u32(393) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5879e49e19cc5e6b72020f35() {
  return __cxx_static_address_5879e49e19cc5e6b72020f35.reference || (__cxx_static_address_5879e49e19cc5e6b72020f35.reference = {
    __cReference: true,
    get value() { return BIGBANG____header_global_feedcb5f2f72d846; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:181
export const FLAMETHROWER_INTRO____header_global_d8a0b7194932a1a0 = ((u32(((u32(398) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a69f89358739b243e6c83246() {
  return __cxx_static_address_a69f89358739b243e6c83246.reference || (__cxx_static_address_a69f89358739b243e6c83246.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER_INTRO____header_global_d8a0b7194932a1a0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:182
export const FLAMETHROWER_LOOP____header_global_a154df324c9dc90b = ((u32(((u32(399) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f2ef18ea530e40b2128e5268() {
  return __cxx_static_address_f2ef18ea530e40b2128e5268.reference || (__cxx_static_address_f2ef18ea530e40b2128e5268.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER_LOOP____header_global_a154df324c9dc90b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:183
export const FLAMETHROWER_END____header_global_a0172eafd3c989bd = ((u32(((u32(400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_98975a5cc9b70904a7e0a734() {
  return __cxx_static_address_98975a5cc9b70904a7e0a734.reference || (__cxx_static_address_98975a5cc9b70904a7e0a734.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER_END____header_global_a0172eafd3c989bd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:184
export const E5L7_DUKE_QUIT_YOU____header_global_d5587f612e313142 = ((u32(((u32(401) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_149f959917e040c51d2f16dc() {
  return __cxx_static_address_149f959917e040c51d2f16dc.reference || (__cxx_static_address_149f959917e040c51d2f16dc.reference = {
    __cReference: true,
    get value() { return E5L7_DUKE_QUIT_YOU____header_global_d5587f612e313142; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:187
export const SECTOREFFECTOR____header_global_c59489277a89dcbe = ((u32(((u32(1) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b998d1fa7a1b36c599a250ae() {
  return __cxx_static_address_b998d1fa7a1b36c599a250ae.reference || (__cxx_static_address_b998d1fa7a1b36c599a250ae.reference = {
    __cReference: true,
    get value() { return SECTOREFFECTOR____header_global_c59489277a89dcbe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:188
export const ACTIVATOR____header_global_808f22dbc33e3e34 = ((u32(((u32(2) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9c5d534a3b7eb29dbda962a9() {
  return __cxx_static_address_9c5d534a3b7eb29dbda962a9.reference || (__cxx_static_address_9c5d534a3b7eb29dbda962a9.reference = {
    __cReference: true,
    get value() { return ACTIVATOR____header_global_808f22dbc33e3e34; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:189
export const TOUCHPLATE____header_global_ea63a917021f9dd5 = ((u32(((u32(3) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0d796cc002fffdf2129fbf8c() {
  return __cxx_static_address_0d796cc002fffdf2129fbf8c.reference || (__cxx_static_address_0d796cc002fffdf2129fbf8c.reference = {
    __cReference: true,
    get value() { return TOUCHPLATE____header_global_ea63a917021f9dd5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:190
export const ACTIVATORLOCKED____header_global_c48f0ff596e550a1 = ((u32(((u32(4) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b12f0ce711d704217c51b4b7() {
  return __cxx_static_address_b12f0ce711d704217c51b4b7.reference || (__cxx_static_address_b12f0ce711d704217c51b4b7.reference = {
    __cReference: true,
    get value() { return ACTIVATORLOCKED____header_global_c48f0ff596e550a1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:191
export const MUSICANDSFX____header_global_dc99b20391e84ae9 = ((u32(((u32(5) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_11632dd206a7149fd89172b7() {
  return __cxx_static_address_11632dd206a7149fd89172b7.reference || (__cxx_static_address_11632dd206a7149fd89172b7.reference = {
    __cReference: true,
    get value() { return MUSICANDSFX____header_global_dc99b20391e84ae9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:192
export const LOCATORS____header_global_2324da3175b318ce = ((u32(((u32(6) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1b2c3d17f2d4f3d79cd1ff9f() {
  return __cxx_static_address_1b2c3d17f2d4f3d79cd1ff9f.reference || (__cxx_static_address_1b2c3d17f2d4f3d79cd1ff9f.reference = {
    __cReference: true,
    get value() { return LOCATORS____header_global_2324da3175b318ce; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:193
export const CYCLER____header_global_a47bd472fd2ebabf = ((u32(((u32(7) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_be5f8ee5ce613fbfa6d00e81() {
  return __cxx_static_address_be5f8ee5ce613fbfa6d00e81.reference || (__cxx_static_address_be5f8ee5ce613fbfa6d00e81.reference = {
    __cReference: true,
    get value() { return CYCLER____header_global_a47bd472fd2ebabf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:194
export const MASTERSWITCH____header_global_3836083eec83b2dd = ((u32(((u32(8) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_917fb855856d53b6db26ad52() {
  return __cxx_static_address_917fb855856d53b6db26ad52.reference || (__cxx_static_address_917fb855856d53b6db26ad52.reference = {
    __cReference: true,
    get value() { return MASTERSWITCH____header_global_3836083eec83b2dd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:195
export const RESPAWN____header_global_6cccc0b7a6e81303 = ((u32(((u32(9) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ebabb8230e62b32fee40cb73() {
  return __cxx_static_address_ebabb8230e62b32fee40cb73.reference || (__cxx_static_address_ebabb8230e62b32fee40cb73.reference = {
    __cReference: true,
    get value() { return RESPAWN____header_global_6cccc0b7a6e81303; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:196
export const GPSPEED____header_global_96e1e036129e8698 = ((u32(((u32(10) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f37ac4f8133746e4102bbabc() {
  return __cxx_static_address_f37ac4f8133746e4102bbabc.reference || (__cxx_static_address_f37ac4f8133746e4102bbabc.reference = {
    __cReference: true,
    get value() { return GPSPEED____header_global_96e1e036129e8698; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:197
export const FOF____header_global_ee763b7cc81e1a56 = ((u32(((u32(13) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d60483f0103a084501c1f51c() {
  return __cxx_static_address_d60483f0103a084501c1f51c.reference || (__cxx_static_address_d60483f0103a084501c1f51c.reference = {
    __cReference: true,
    get value() { return FOF____header_global_ee763b7cc81e1a56; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:198
export const ARROW____header_global_d7f5c09175c21e7b = ((u32(((u32(20) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0f715145a5796eea1f514f0d() {
  return __cxx_static_address_0f715145a5796eea1f514f0d.reference || (__cxx_static_address_0f715145a5796eea1f514f0d.reference = {
    __cReference: true,
    get value() { return ARROW____header_global_d7f5c09175c21e7b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:199
export const FIRSTGUNSPRITE____header_global_1240f9a7a97ac8a4 = ((u32(((u32(21) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_660dbfdd51933c9fa65bdbf0() {
  return __cxx_static_address_660dbfdd51933c9fa65bdbf0.reference || (__cxx_static_address_660dbfdd51933c9fa65bdbf0.reference = {
    __cReference: true,
    get value() { return FIRSTGUNSPRITE____header_global_1240f9a7a97ac8a4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:200
export const CHAINGUNSPRITE____header_global_3e4613fa31ee0847 = ((u32(((u32(22) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_17a220d97c88a71ffb007c62() {
  return __cxx_static_address_17a220d97c88a71ffb007c62.reference || (__cxx_static_address_17a220d97c88a71ffb007c62.reference = {
    __cReference: true,
    get value() { return CHAINGUNSPRITE____header_global_3e4613fa31ee0847; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:201
export const RPGSPRITE____header_global_d7e3cacc50013955 = ((u32(((u32(23) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e6dce854b1efff310a767879() {
  return __cxx_static_address_e6dce854b1efff310a767879.reference || (__cxx_static_address_e6dce854b1efff310a767879.reference = {
    __cReference: true,
    get value() { return RPGSPRITE____header_global_d7e3cacc50013955; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:202
export const FREEZESPRITE____header_global_43cdbb8990498e04 = ((u32(((u32(24) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ff726a99e5e7f19cbe2d8910() {
  return __cxx_static_address_ff726a99e5e7f19cbe2d8910.reference || (__cxx_static_address_ff726a99e5e7f19cbe2d8910.reference = {
    __cReference: true,
    get value() { return FREEZESPRITE____header_global_43cdbb8990498e04; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:203
export const SHRINKERSPRITE____header_global_fd5f90b6457e68a7 = ((u32(((u32(25) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_157a205042dca638dadc7bb0() {
  return __cxx_static_address_157a205042dca638dadc7bb0.reference || (__cxx_static_address_157a205042dca638dadc7bb0.reference = {
    __cReference: true,
    get value() { return SHRINKERSPRITE____header_global_fd5f90b6457e68a7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:204
export const HEAVYHBOMB____header_global_38319da82abc8fc3 = ((u32(((u32(26) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_43874bf7f06e0ff7007fdf79() {
  return __cxx_static_address_43874bf7f06e0ff7007fdf79.reference || (__cxx_static_address_43874bf7f06e0ff7007fdf79.reference = {
    __cReference: true,
    get value() { return HEAVYHBOMB____header_global_38319da82abc8fc3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:205
export const TRIPBOMBSPRITE____header_global_b0595b4f96da0c58 = ((u32(((u32(27) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_18722e6ae74e5e8719b41bb7() {
  return __cxx_static_address_18722e6ae74e5e8719b41bb7.reference || (__cxx_static_address_18722e6ae74e5e8719b41bb7.reference = {
    __cReference: true,
    get value() { return TRIPBOMBSPRITE____header_global_b0595b4f96da0c58; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:206
export const SHOTGUNSPRITE____header_global_a6e04f7136712542 = ((u32(((u32(28) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_52435d7203f2f5a4c4f00551() {
  return __cxx_static_address_52435d7203f2f5a4c4f00551.reference || (__cxx_static_address_52435d7203f2f5a4c4f00551.reference = {
    __cReference: true,
    get value() { return SHOTGUNSPRITE____header_global_a6e04f7136712542; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:207
export const DEVISTATORSPRITE____header_global_512ceddb3100f111 = ((u32(((u32(29) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3dbbe7fe869835cc997e46c9() {
  return __cxx_static_address_3dbbe7fe869835cc997e46c9.reference || (__cxx_static_address_3dbbe7fe869835cc997e46c9.reference = {
    __cReference: true,
    get value() { return DEVISTATORSPRITE____header_global_512ceddb3100f111; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:208
export const HEALTHBOX____header_global_df58d2d91e20182a = ((u32(((u32(30) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f08b9bb732f388fd5c0def88() {
  return __cxx_static_address_f08b9bb732f388fd5c0def88.reference || (__cxx_static_address_f08b9bb732f388fd5c0def88.reference = {
    __cReference: true,
    get value() { return HEALTHBOX____header_global_df58d2d91e20182a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:209
export const AMMOBOX____header_global_b37ad56990cbad1f = ((u32(((u32(31) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9abc19c5befea4a54f2b9297() {
  return __cxx_static_address_9abc19c5befea4a54f2b9297.reference || (__cxx_static_address_9abc19c5befea4a54f2b9297.reference = {
    __cReference: true,
    get value() { return AMMOBOX____header_global_b37ad56990cbad1f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:210
export const GROWSPRITEICON____header_global_75469fe681a279df = ((u32(((u32(32) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_68eed154ff01720a29c33089() {
  return __cxx_static_address_68eed154ff01720a29c33089.reference || (__cxx_static_address_68eed154ff01720a29c33089.reference = {
    __cReference: true,
    get value() { return GROWSPRITEICON____header_global_75469fe681a279df; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:211
export const INVENTORYBOX____header_global_500dc8fbdf6fb097 = ((u32(((u32(33) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_973e53c634d39737b3e9563f() {
  return __cxx_static_address_973e53c634d39737b3e9563f.reference || (__cxx_static_address_973e53c634d39737b3e9563f.reference = {
    __cReference: true,
    get value() { return INVENTORYBOX____header_global_500dc8fbdf6fb097; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:212
export const FREEZEAMMO____header_global_ae93f064cca4957c = ((u32(((u32(37) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_64647835799147bdebd54e28() {
  return __cxx_static_address_64647835799147bdebd54e28.reference || (__cxx_static_address_64647835799147bdebd54e28.reference = {
    __cReference: true,
    get value() { return FREEZEAMMO____header_global_ae93f064cca4957c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:213
export const AMMO____header_global_5ba580dc5af3149c = ((u32(((u32(40) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_330be33bc88f6ea64f7c2f71() {
  return __cxx_static_address_330be33bc88f6ea64f7c2f71.reference || (__cxx_static_address_330be33bc88f6ea64f7c2f71.reference = {
    __cReference: true,
    get value() { return AMMO____header_global_5ba580dc5af3149c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:214
export const BATTERYAMMO____header_global_b852ce5de39f5c22 = ((u32(((u32(41) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e00e32108ed4abdf176eef6c() {
  return __cxx_static_address_e00e32108ed4abdf176eef6c.reference || (__cxx_static_address_e00e32108ed4abdf176eef6c.reference = {
    __cReference: true,
    get value() { return BATTERYAMMO____header_global_b852ce5de39f5c22; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:215
export const DEVISTATORAMMO____header_global_b848222feee11a66 = ((u32(((u32(42) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c3de945cccffc31a5a1fd76d() {
  return __cxx_static_address_c3de945cccffc31a5a1fd76d.reference || (__cxx_static_address_c3de945cccffc31a5a1fd76d.reference = {
    __cReference: true,
    get value() { return DEVISTATORAMMO____header_global_b848222feee11a66; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:216
export const RPGAMMO____header_global_e6b0f0bebc795b75 = ((u32(((u32(44) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7b77f52eedb82cff42e3a115() {
  return __cxx_static_address_7b77f52eedb82cff42e3a115.reference || (__cxx_static_address_7b77f52eedb82cff42e3a115.reference = {
    __cReference: true,
    get value() { return RPGAMMO____header_global_e6b0f0bebc795b75; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:217
export const GROWAMMO____header_global_993f782f6d0260c2 = ((u32(((u32(45) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4d2d5efbe88fab3d7b3cb26c() {
  return __cxx_static_address_4d2d5efbe88fab3d7b3cb26c.reference || (__cxx_static_address_4d2d5efbe88fab3d7b3cb26c.reference = {
    __cReference: true,
    get value() { return GROWAMMO____header_global_993f782f6d0260c2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:218
export const CRYSTALAMMO____header_global_b0f5d982b83f6461 = ((u32(((u32(46) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c15ab514df87034b76f9e857() {
  return __cxx_static_address_c15ab514df87034b76f9e857.reference || (__cxx_static_address_c15ab514df87034b76f9e857.reference = {
    __cReference: true,
    get value() { return CRYSTALAMMO____header_global_b0f5d982b83f6461; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:219
export const HBOMBAMMO____header_global_5137d4edc30c3680 = ((u32(((u32(47) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_62b64bc0e3b4b4196d7f8a50() {
  return __cxx_static_address_62b64bc0e3b4b4196d7f8a50.reference || (__cxx_static_address_62b64bc0e3b4b4196d7f8a50.reference = {
    __cReference: true,
    get value() { return HBOMBAMMO____header_global_5137d4edc30c3680; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:220
export const AMMOLOTS____header_global_124e35645fd073e5 = ((u32(((u32(48) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c36ef1b173a17a96dcb4c457() {
  return __cxx_static_address_c36ef1b173a17a96dcb4c457.reference || (__cxx_static_address_c36ef1b173a17a96dcb4c457.reference = {
    __cReference: true,
    get value() { return AMMOLOTS____header_global_124e35645fd073e5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:221
export const SHOTGUNAMMO____header_global_e342bca9bbd8a079 = ((u32(((u32(49) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2a09369fb8a98e81215e2c97() {
  return __cxx_static_address_2a09369fb8a98e81215e2c97.reference || (__cxx_static_address_2a09369fb8a98e81215e2c97.reference = {
    __cReference: true,
    get value() { return SHOTGUNAMMO____header_global_e342bca9bbd8a079; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:222
export const COLA____header_global_2e56a350808d6acb = ((u32(((u32(51) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cd966ffba5a4b68c1626c357() {
  return __cxx_static_address_cd966ffba5a4b68c1626c357.reference || (__cxx_static_address_cd966ffba5a4b68c1626c357.reference = {
    __cReference: true,
    get value() { return COLA____header_global_2e56a350808d6acb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:223
export const SIXPAK____header_global_3b8251c65d8e2043 = ((u32(((u32(52) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c5991e9c9bc94168350f44d8() {
  return __cxx_static_address_c5991e9c9bc94168350f44d8.reference || (__cxx_static_address_c5991e9c9bc94168350f44d8.reference = {
    __cReference: true,
    get value() { return SIXPAK____header_global_3b8251c65d8e2043; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:224
export const FIRSTAID____header_global_1a4e1b93372ab692 = ((u32(((u32(53) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6245b4d9ab8f9ce81864c0e9() {
  return __cxx_static_address_6245b4d9ab8f9ce81864c0e9.reference || (__cxx_static_address_6245b4d9ab8f9ce81864c0e9.reference = {
    __cReference: true,
    get value() { return FIRSTAID____header_global_1a4e1b93372ab692; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:225
export const SHIELD____header_global_3f6ec6d1fbad0770 = ((u32(((u32(54) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9c8df6f4ba7c5306ef8ff3a4() {
  return __cxx_static_address_9c8df6f4ba7c5306ef8ff3a4.reference || (__cxx_static_address_9c8df6f4ba7c5306ef8ff3a4.reference = {
    __cReference: true,
    get value() { return SHIELD____header_global_3f6ec6d1fbad0770; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:226
export const STEROIDS____header_global_de44c70c03d5ad47 = ((u32(((u32(55) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_efa7f8a0d397d2ba7107c828() {
  return __cxx_static_address_efa7f8a0d397d2ba7107c828.reference || (__cxx_static_address_efa7f8a0d397d2ba7107c828.reference = {
    __cReference: true,
    get value() { return STEROIDS____header_global_de44c70c03d5ad47; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:227
export const AIRTANK____header_global_1229a53740e94918 = ((u32(((u32(56) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1f4a19332a9b30470b0074c8() {
  return __cxx_static_address_1f4a19332a9b30470b0074c8.reference || (__cxx_static_address_1f4a19332a9b30470b0074c8.reference = {
    __cReference: true,
    get value() { return AIRTANK____header_global_1229a53740e94918; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:228
export const JETPACK____header_global_dea1c3f1812a7881 = ((u32(((u32(57) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_91c039f823d242d3e117ec52() {
  return __cxx_static_address_91c039f823d242d3e117ec52.reference || (__cxx_static_address_91c039f823d242d3e117ec52.reference = {
    __cReference: true,
    get value() { return JETPACK____header_global_dea1c3f1812a7881; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:229
export const HEATSENSOR____header_global_463749a779953690 = ((u32(((u32(59) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aa875a08cbf483394afa5fbe() {
  return __cxx_static_address_aa875a08cbf483394afa5fbe.reference || (__cxx_static_address_aa875a08cbf483394afa5fbe.reference = {
    __cReference: true,
    get value() { return HEATSENSOR____header_global_463749a779953690; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:230
export const ACCESSCARD____header_global_f5dd999f9d36539d = ((u32(((u32(60) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f2baa5ba692fe3f20d3ae6bb() {
  return __cxx_static_address_f2baa5ba692fe3f20d3ae6bb.reference || (__cxx_static_address_f2baa5ba692fe3f20d3ae6bb.reference = {
    __cReference: true,
    get value() { return ACCESSCARD____header_global_f5dd999f9d36539d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:231
export const BOOTS____header_global_7659d9f825af97bf = ((u32(((u32(61) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ffee901dbb886d63bf2c353a() {
  return __cxx_static_address_ffee901dbb886d63bf2c353a.reference || (__cxx_static_address_ffee901dbb886d63bf2c353a.reference = {
    __cReference: true,
    get value() { return BOOTS____header_global_7659d9f825af97bf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:232
export const MIRRORBROKE____header_global_4a54c82affed4da3 = ((u32(((u32(70) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d6553855c9dd21c8d3d5ed6a() {
  return __cxx_static_address_d6553855c9dd21c8d3d5ed6a.reference || (__cxx_static_address_d6553855c9dd21c8d3d5ed6a.reference = {
    __cReference: true,
    get value() { return MIRRORBROKE____header_global_4a54c82affed4da3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:233
export const CLOUDYOCEAN____header_global_1732c6518042a823 = ((u32(((u32(78) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1239a7a069b8485499141318() {
  return __cxx_static_address_1239a7a069b8485499141318.reference || (__cxx_static_address_1239a7a069b8485499141318.reference = {
    __cReference: true,
    get value() { return CLOUDYOCEAN____header_global_1732c6518042a823; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:234
export const CLOUDYSKIES____header_global_54cfd9138206318e = ((u32(((u32(79) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_21e39aec4f2bfb2c278e205e() {
  return __cxx_static_address_21e39aec4f2bfb2c278e205e.reference || (__cxx_static_address_21e39aec4f2bfb2c278e205e.reference = {
    __cReference: true,
    get value() { return CLOUDYSKIES____header_global_54cfd9138206318e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:235
export const MOONSKY1____header_global_065c64b5d49884e0 = ((u32(((u32(80) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_14be77286b62ffdfd26c103b() {
  return __cxx_static_address_14be77286b62ffdfd26c103b.reference || (__cxx_static_address_14be77286b62ffdfd26c103b.reference = {
    __cReference: true,
    get value() { return MOONSKY1____header_global_065c64b5d49884e0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:236
export const BIGORBIT1____header_global_e5effcab8d9ec977 = ((u32(((u32(84) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fe4da4265cc72170c019f855() {
  return __cxx_static_address_fe4da4265cc72170c019f855.reference || (__cxx_static_address_fe4da4265cc72170c019f855.reference = {
    __cReference: true,
    get value() { return BIGORBIT1____header_global_e5effcab8d9ec977; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:237
export const LA____header_global_45ad741dc38fab8f = ((u32(((u32(89) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_41cd55596058099d5b5139cd() {
  return __cxx_static_address_41cd55596058099d5b5139cd.reference || (__cxx_static_address_41cd55596058099d5b5139cd.reference = {
    __cReference: true,
    get value() { return LA____header_global_45ad741dc38fab8f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:238
export const ATOMICHEALTH____header_global_ae75d2e2a3094bd9 = ((u32(((u32(100) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7e5e4648fcd887def0bd53a8() {
  return __cxx_static_address_7e5e4648fcd887def0bd53a8.reference || (__cxx_static_address_7e5e4648fcd887def0bd53a8.reference = {
    __cReference: true,
    get value() { return ATOMICHEALTH____header_global_ae75d2e2a3094bd9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:239
export const TECHLIGHT2____header_global_860d7a1dd79d3b09 = ((u32(((u32(120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_daa56c4aacec54217ee76b83() {
  return __cxx_static_address_daa56c4aacec54217ee76b83.reference || (__cxx_static_address_daa56c4aacec54217ee76b83.reference = {
    __cReference: true,
    get value() { return TECHLIGHT2____header_global_860d7a1dd79d3b09; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:240
export const TECHLIGHTBUST2____header_global_f380176fd67771c5 = ((u32(((u32(121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f0d5c3c305a7d132deb469c1() {
  return __cxx_static_address_f0d5c3c305a7d132deb469c1.reference || (__cxx_static_address_f0d5c3c305a7d132deb469c1.reference = {
    __cReference: true,
    get value() { return TECHLIGHTBUST2____header_global_f380176fd67771c5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:241
export const TECHLIGHT4____header_global_7422815890c0a567 = ((u32(((u32(122) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5a2de1c82a9115b51e456540() {
  return __cxx_static_address_5a2de1c82a9115b51e456540.reference || (__cxx_static_address_5a2de1c82a9115b51e456540.reference = {
    __cReference: true,
    get value() { return TECHLIGHT4____header_global_7422815890c0a567; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:242
export const TECHLIGHTBUST4____header_global_796e09c531a78053 = ((u32(((u32(123) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_92b4736bd9e5fc15e107db9a() {
  return __cxx_static_address_92b4736bd9e5fc15e107db9a.reference || (__cxx_static_address_92b4736bd9e5fc15e107db9a.reference = {
    __cReference: true,
    get value() { return TECHLIGHTBUST4____header_global_796e09c531a78053; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:243
export const WALLLIGHT4____header_global_d5ac2cb531df6fce = ((u32(((u32(124) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dd2d01330fe063ec817a1879() {
  return __cxx_static_address_dd2d01330fe063ec817a1879.reference || (__cxx_static_address_dd2d01330fe063ec817a1879.reference = {
    __cReference: true,
    get value() { return WALLLIGHT4____header_global_d5ac2cb531df6fce; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:244
export const WALLLIGHTBUST4____header_global_d8be78a1bd884449 = ((u32(((u32(125) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c3c7810562da513a65265b79() {
  return __cxx_static_address_c3c7810562da513a65265b79.reference || (__cxx_static_address_c3c7810562da513a65265b79.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST4____header_global_d8be78a1bd884449; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:245
export const ACCESSSWITCH____header_global_e7954771bc148af2 = ((u32(((u32(130) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6dbfd98d40b97fcf3103bb12() {
  return __cxx_static_address_6dbfd98d40b97fcf3103bb12.reference || (__cxx_static_address_6dbfd98d40b97fcf3103bb12.reference = {
    __cReference: true,
    get value() { return ACCESSSWITCH____header_global_e7954771bc148af2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:246
export const SLOTDOOR____header_global_0224994504d5386b = ((u32(((u32(132) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e06977d94fdd490bbdd776f3() {
  return __cxx_static_address_e06977d94fdd490bbdd776f3.reference || (__cxx_static_address_e06977d94fdd490bbdd776f3.reference = {
    __cReference: true,
    get value() { return SLOTDOOR____header_global_0224994504d5386b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:247
export const LIGHTSWITCH____header_global_f548874ec9691f5d = ((u32(((u32(134) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9fc71fee61a57ea98ffe0939() {
  return __cxx_static_address_9fc71fee61a57ea98ffe0939.reference || (__cxx_static_address_9fc71fee61a57ea98ffe0939.reference = {
    __cReference: true,
    get value() { return LIGHTSWITCH____header_global_f548874ec9691f5d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:248
export const SPACEDOORSWITCH____header_global_fbb3f6e281c891e8 = ((u32(((u32(136) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_deccd8495a3089affba31e55() {
  return __cxx_static_address_deccd8495a3089affba31e55.reference || (__cxx_static_address_deccd8495a3089affba31e55.reference = {
    __cReference: true,
    get value() { return SPACEDOORSWITCH____header_global_fbb3f6e281c891e8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:249
export const SPACELIGHTSWITCH____header_global_a132c9c2961b9352 = ((u32(((u32(138) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2ed6444d0dea1e761e81085b() {
  return __cxx_static_address_2ed6444d0dea1e761e81085b.reference || (__cxx_static_address_2ed6444d0dea1e761e81085b.reference = {
    __cReference: true,
    get value() { return SPACELIGHTSWITCH____header_global_a132c9c2961b9352; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:250
export const FRANKENSTINESWITCH____header_global_bb0f87fb49974320 = ((u32(((u32(140) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e8328b8a90af039aef35dec1() {
  return __cxx_static_address_e8328b8a90af039aef35dec1.reference || (__cxx_static_address_e8328b8a90af039aef35dec1.reference = {
    __cReference: true,
    get value() { return FRANKENSTINESWITCH____header_global_bb0f87fb49974320; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:251
export const NUKEBUTTON____header_global_27fb830bdb3a9b83 = ((u32(((u32(142) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a13dca37e722bb24965b4de1() {
  return __cxx_static_address_a13dca37e722bb24965b4de1.reference || (__cxx_static_address_a13dca37e722bb24965b4de1.reference = {
    __cReference: true,
    get value() { return NUKEBUTTON____header_global_27fb830bdb3a9b83; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:252
export const MULTISWITCH____header_global_f2ed18900f2f6050 = ((u32(((u32(146) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3a79aa96aaa977ce4be16247() {
  return __cxx_static_address_3a79aa96aaa977ce4be16247.reference || (__cxx_static_address_3a79aa96aaa977ce4be16247.reference = {
    __cReference: true,
    get value() { return MULTISWITCH____header_global_f2ed18900f2f6050; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:253
export const DOORTILE5____header_global_f63fc6f53064f302 = ((u32(((u32(150) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d477baa4272acbd6d2c0ca86() {
  return __cxx_static_address_d477baa4272acbd6d2c0ca86.reference || (__cxx_static_address_d477baa4272acbd6d2c0ca86.reference = {
    __cReference: true,
    get value() { return DOORTILE5____header_global_f63fc6f53064f302; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:254
export const DOORTILE6____header_global_7fa473818eef3dde = ((u32(((u32(151) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d75cdf6d1a78628b689ce1f3() {
  return __cxx_static_address_d75cdf6d1a78628b689ce1f3.reference || (__cxx_static_address_d75cdf6d1a78628b689ce1f3.reference = {
    __cReference: true,
    get value() { return DOORTILE6____header_global_7fa473818eef3dde; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:255
export const DOORTILE1____header_global_73d773304412e94f = ((u32(((u32(152) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c77b1a30bf144b996bc69b61() {
  return __cxx_static_address_c77b1a30bf144b996bc69b61.reference || (__cxx_static_address_c77b1a30bf144b996bc69b61.reference = {
    __cReference: true,
    get value() { return DOORTILE1____header_global_73d773304412e94f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:256
export const DOORTILE2____header_global_fac2d730b1f39073 = ((u32(((u32(153) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4b0367030dcd35734f89bda6() {
  return __cxx_static_address_4b0367030dcd35734f89bda6.reference || (__cxx_static_address_4b0367030dcd35734f89bda6.reference = {
    __cReference: true,
    get value() { return DOORTILE2____header_global_fac2d730b1f39073; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:257
export const DOORTILE3____header_global_e9b953f79b1246d9 = ((u32(((u32(154) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_03452589174c3a11f7827d41() {
  return __cxx_static_address_03452589174c3a11f7827d41.reference || (__cxx_static_address_03452589174c3a11f7827d41.reference = {
    __cReference: true,
    get value() { return DOORTILE3____header_global_e9b953f79b1246d9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:258
export const DOORTILE4____header_global_b3c8f9f72763b33d = ((u32(((u32(155) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0dfd8720501db834ecec87ff() {
  return __cxx_static_address_0dfd8720501db834ecec87ff.reference || (__cxx_static_address_0dfd8720501db834ecec87ff.reference = {
    __cReference: true,
    get value() { return DOORTILE4____header_global_b3c8f9f72763b33d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:259
export const DOORTILE7____header_global_bde94520ab44b102 = ((u32(((u32(156) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_994acfc257641e155fca492b() {
  return __cxx_static_address_994acfc257641e155fca492b.reference || (__cxx_static_address_994acfc257641e155fca492b.reference = {
    __cReference: true,
    get value() { return DOORTILE7____header_global_bde94520ab44b102; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:260
export const DOORTILE8____header_global_07fc4b1bca74f9b1 = ((u32(((u32(157) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_91c71425836d8459fcfe03b2() {
  return __cxx_static_address_91c71425836d8459fcfe03b2.reference || (__cxx_static_address_91c71425836d8459fcfe03b2.reference = {
    __cReference: true,
    get value() { return DOORTILE8____header_global_07fc4b1bca74f9b1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:261
export const DOORTILE9____header_global_008d3f91bbfe9bac = ((u32(((u32(158) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d66909dce07b18343219d651() {
  return __cxx_static_address_d66909dce07b18343219d651.reference || (__cxx_static_address_d66909dce07b18343219d651.reference = {
    __cReference: true,
    get value() { return DOORTILE9____header_global_008d3f91bbfe9bac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:262
export const DOORTILE10____header_global_8e33b818fb567629 = ((u32(((u32(159) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_38822aff5d8ee8190466e328() {
  return __cxx_static_address_38822aff5d8ee8190466e328.reference || (__cxx_static_address_38822aff5d8ee8190466e328.reference = {
    __cReference: true,
    get value() { return DOORTILE10____header_global_8e33b818fb567629; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:263
export const DOORSHOCK____header_global_2ee36cfab183d600 = ((u32(((u32(160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cd67279d039181546a24ad48() {
  return __cxx_static_address_cd67279d039181546a24ad48.reference || (__cxx_static_address_cd67279d039181546a24ad48.reference = {
    __cReference: true,
    get value() { return DOORSHOCK____header_global_2ee36cfab183d600; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:264
export const DIPSWITCH____header_global_dea13d185f94debc = ((u32(((u32(162) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_df54bf96507e5029c447cba0() {
  return __cxx_static_address_df54bf96507e5029c447cba0.reference || (__cxx_static_address_df54bf96507e5029c447cba0.reference = {
    __cReference: true,
    get value() { return DIPSWITCH____header_global_dea13d185f94debc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:265
export const DIPSWITCH2____header_global_e235076181cc2c51 = ((u32(((u32(164) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_111f62878f549ee745c852ef() {
  return __cxx_static_address_111f62878f549ee745c852ef.reference || (__cxx_static_address_111f62878f549ee745c852ef.reference = {
    __cReference: true,
    get value() { return DIPSWITCH2____header_global_e235076181cc2c51; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:266
export const TECHSWITCH____header_global_aeb8fe2b6a991244 = ((u32(((u32(166) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bc8eea36fb07c8da0e904099() {
  return __cxx_static_address_bc8eea36fb07c8da0e904099.reference || (__cxx_static_address_bc8eea36fb07c8da0e904099.reference = {
    __cReference: true,
    get value() { return TECHSWITCH____header_global_aeb8fe2b6a991244; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:267
export const DIPSWITCH3____header_global_8af58ee76c74ddf8 = ((u32(((u32(168) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7d436dca9025841754d05619() {
  return __cxx_static_address_7d436dca9025841754d05619.reference || (__cxx_static_address_7d436dca9025841754d05619.reference = {
    __cReference: true,
    get value() { return DIPSWITCH3____header_global_8af58ee76c74ddf8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:268
export const ACCESSSWITCH2____header_global_ac31f3ed01503315 = ((u32(((u32(170) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_973e8b460674934df08fe433() {
  return __cxx_static_address_973e8b460674934df08fe433.reference || (__cxx_static_address_973e8b460674934df08fe433.reference = {
    __cReference: true,
    get value() { return ACCESSSWITCH2____header_global_ac31f3ed01503315; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:269
export const FLOORSLIME____header_global_6b9b3733f5971aed = ((u32(((u32(200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f68d9447c3e16679679bb733() {
  return __cxx_static_address_f68d9447c3e16679679bb733.reference || (__cxx_static_address_f68d9447c3e16679679bb733.reference = {
    __cReference: true,
    get value() { return FLOORSLIME____header_global_6b9b3733f5971aed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:270
export const BIGFORCE____header_global_5f90cd45ac668a25 = ((u32(((u32(230) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_400db82480d7f58faa0054a1() {
  return __cxx_static_address_400db82480d7f58faa0054a1.reference || (__cxx_static_address_400db82480d7f58faa0054a1.reference = {
    __cReference: true,
    get value() { return BIGFORCE____header_global_5f90cd45ac668a25; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:271
export const MASKWALL9____header_global_9637d48526d71585 = ((u32(((u32(255) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fff29519eee82518c7940ae7() {
  return __cxx_static_address_fff29519eee82518c7940ae7.reference || (__cxx_static_address_fff29519eee82518c7940ae7.reference = {
    __cReference: true,
    get value() { return MASKWALL9____header_global_9637d48526d71585; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:272
export const SCREENBREAK1____header_global_fc5f43cd657131f0 = ((u32(((u32(263) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9c3d15ae871945e0cda5a3f4() {
  return __cxx_static_address_9c3d15ae871945e0cda5a3f4.reference || (__cxx_static_address_9c3d15ae871945e0cda5a3f4.reference = {
    __cReference: true,
    get value() { return SCREENBREAK1____header_global_fc5f43cd657131f0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:273
export const SCREENBREAK2____header_global_7eae4661c4d5792f = ((u32(((u32(264) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2aa3794d89d99d325e65cbe7() {
  return __cxx_static_address_2aa3794d89d99d325e65cbe7.reference || (__cxx_static_address_2aa3794d89d99d325e65cbe7.reference = {
    __cReference: true,
    get value() { return SCREENBREAK2____header_global_7eae4661c4d5792f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:274
export const SCREENBREAK3____header_global_4cc1b6a5aa9d5c50 = ((u32(((u32(265) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3d6d56bdb316470c2157b51c() {
  return __cxx_static_address_3d6d56bdb316470c2157b51c.reference || (__cxx_static_address_3d6d56bdb316470c2157b51c.reference = {
    __cReference: true,
    get value() { return SCREENBREAK3____header_global_4cc1b6a5aa9d5c50; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:275
export const SCREENBREAK4____header_global_ca1a44b3234bd8fc = ((u32(((u32(266) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_62300ed2511ae7d4e243c8fd() {
  return __cxx_static_address_62300ed2511ae7d4e243c8fd.reference || (__cxx_static_address_62300ed2511ae7d4e243c8fd.reference = {
    __cReference: true,
    get value() { return SCREENBREAK4____header_global_ca1a44b3234bd8fc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:276
export const SCREENBREAK5____header_global_3f26841114bf3972 = ((u32(((u32(267) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a32575d224d2e1ce832f9403() {
  return __cxx_static_address_a32575d224d2e1ce832f9403.reference || (__cxx_static_address_a32575d224d2e1ce832f9403.reference = {
    __cReference: true,
    get value() { return SCREENBREAK5____header_global_3f26841114bf3972; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:277
export const SCREENBREAK6____header_global_a304cd7d71f83696 = ((u32(((u32(268) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cb2ff7bb090ee33e1f0d71ac() {
  return __cxx_static_address_cb2ff7bb090ee33e1f0d71ac.reference || (__cxx_static_address_cb2ff7bb090ee33e1f0d71ac.reference = {
    __cReference: true,
    get value() { return SCREENBREAK6____header_global_a304cd7d71f83696; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:278
export const SCREENBREAK7____header_global_168872f4641b61fa = ((u32(((u32(269) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_34d0d4280a2eebfe252afd0a() {
  return __cxx_static_address_34d0d4280a2eebfe252afd0a.reference || (__cxx_static_address_34d0d4280a2eebfe252afd0a.reference = {
    __cReference: true,
    get value() { return SCREENBREAK7____header_global_168872f4641b61fa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:279
export const SCREENBREAK8____header_global_a5c266e5b535b0b7 = ((u32(((u32(270) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d0d06e0b1d85b2292857934d() {
  return __cxx_static_address_d0d06e0b1d85b2292857934d.reference || (__cxx_static_address_d0d06e0b1d85b2292857934d.reference = {
    __cReference: true,
    get value() { return SCREENBREAK8____header_global_a5c266e5b535b0b7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:280
export const SCREENBREAK9____header_global_3270c3726ed4d701 = ((u32(((u32(271) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ff24cf049afee3330f05917b() {
  return __cxx_static_address_ff24cf049afee3330f05917b.reference || (__cxx_static_address_ff24cf049afee3330f05917b.reference = {
    __cReference: true,
    get value() { return SCREENBREAK9____header_global_3270c3726ed4d701; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:281
export const SCREENBREAK10____header_global_c3f2a016ff243d0b = ((u32(((u32(272) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7d880990370f45f497ed48c5() {
  return __cxx_static_address_7d880990370f45f497ed48c5.reference || (__cxx_static_address_7d880990370f45f497ed48c5.reference = {
    __cReference: true,
    get value() { return SCREENBREAK10____header_global_c3f2a016ff243d0b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:282
export const SCREENBREAK11____header_global_14e2a9343c909025 = ((u32(((u32(273) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b26152b042b268c6d7ed0fdb() {
  return __cxx_static_address_b26152b042b268c6d7ed0fdb.reference || (__cxx_static_address_b26152b042b268c6d7ed0fdb.reference = {
    __cReference: true,
    get value() { return SCREENBREAK11____header_global_14e2a9343c909025; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:283
export const SCREENBREAK12____header_global_89eb5856037cf8be = ((u32(((u32(274) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6cd869163247d6d998ab62ac() {
  return __cxx_static_address_6cd869163247d6d998ab62ac.reference || (__cxx_static_address_6cd869163247d6d998ab62ac.reference = {
    __cReference: true,
    get value() { return SCREENBREAK12____header_global_89eb5856037cf8be; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:284
export const SCREENBREAK13____header_global_91741721d5585ead = ((u32(((u32(275) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1393786eb74afae73283057f() {
  return __cxx_static_address_1393786eb74afae73283057f.reference || (__cxx_static_address_1393786eb74afae73283057f.reference = {
    __cReference: true,
    get value() { return SCREENBREAK13____header_global_91741721d5585ead; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:285
export const MASKWALL1____header_global_ad9974350acb9bdd = ((u32(((u32(285) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_94840769c395fb047a5ad319() {
  return __cxx_static_address_94840769c395fb047a5ad319.reference || (__cxx_static_address_94840769c395fb047a5ad319.reference = {
    __cReference: true,
    get value() { return MASKWALL1____header_global_ad9974350acb9bdd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:286
export const W_TECHWALL1____header_global_7b7478adbfcfac5b = ((u32(((u32(293) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_64aa857ddaa30e1b987f7fde() {
  return __cxx_static_address_64aa857ddaa30e1b987f7fde.reference || (__cxx_static_address_64aa857ddaa30e1b987f7fde.reference = {
    __cReference: true,
    get value() { return W_TECHWALL1____header_global_7b7478adbfcfac5b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:287
export const W_TECHWALL2____header_global_56e1781434978b27 = ((u32(((u32(297) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_63950d7ec0cf02a48bc30ec1() {
  return __cxx_static_address_63950d7ec0cf02a48bc30ec1.reference || (__cxx_static_address_63950d7ec0cf02a48bc30ec1.reference = {
    __cReference: true,
    get value() { return W_TECHWALL2____header_global_56e1781434978b27; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:288
export const W_TECHWALL15____header_global_8228599d369adf2c = ((u32(((u32(299) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7f5edf7cb8c98b52f82a8c1e() {
  return __cxx_static_address_7f5edf7cb8c98b52f82a8c1e.reference || (__cxx_static_address_7f5edf7cb8c98b52f82a8c1e.reference = {
    __cReference: true,
    get value() { return W_TECHWALL15____header_global_8228599d369adf2c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:289
export const W_TECHWALL3____header_global_4ee8503ab22fe941 = ((u32(((u32(301) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8b7830699fe2a557527dcab7() {
  return __cxx_static_address_8b7830699fe2a557527dcab7.reference || (__cxx_static_address_8b7830699fe2a557527dcab7.reference = {
    __cReference: true,
    get value() { return W_TECHWALL3____header_global_4ee8503ab22fe941; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:290
export const W_TECHWALL4____header_global_546328e5cefb924a = ((u32(((u32(305) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_27710644439d93f4b710e25f() {
  return __cxx_static_address_27710644439d93f4b710e25f.reference || (__cxx_static_address_27710644439d93f4b710e25f.reference = {
    __cReference: true,
    get value() { return W_TECHWALL4____header_global_546328e5cefb924a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:291
export const W_TECHWALL10____header_global_d02875217b0c5ca6 = ((u32(((u32(306) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_84e6a0d2ecb14cfb0de52f50() {
  return __cxx_static_address_84e6a0d2ecb14cfb0de52f50.reference || (__cxx_static_address_84e6a0d2ecb14cfb0de52f50.reference = {
    __cReference: true,
    get value() { return W_TECHWALL10____header_global_d02875217b0c5ca6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:292
export const W_TECHWALL16____header_global_ba1205cbf5e4d49d = ((u32(((u32(307) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fe664a6eacb65126aa1308a7() {
  return __cxx_static_address_fe664a6eacb65126aa1308a7.reference || (__cxx_static_address_fe664a6eacb65126aa1308a7.reference = {
    __cReference: true,
    get value() { return W_TECHWALL16____header_global_ba1205cbf5e4d49d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:293
export const WATERTILE2____header_global_735255f4f31f85b4 = ((u32(((u32(336) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1f150a455fa2aae3b0149a37() {
  return __cxx_static_address_1f150a455fa2aae3b0149a37.reference || (__cxx_static_address_1f150a455fa2aae3b0149a37.reference = {
    __cReference: true,
    get value() { return WATERTILE2____header_global_735255f4f31f85b4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:294
export const BPANNEL1____header_global_cc8a9e1176ff1681 = ((u32(((u32(341) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a6ba78bc1c04ce3999366238() {
  return __cxx_static_address_a6ba78bc1c04ce3999366238.reference || (__cxx_static_address_a6ba78bc1c04ce3999366238.reference = {
    __cReference: true,
    get value() { return BPANNEL1____header_global_cc8a9e1176ff1681; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:295
export const PANNEL1____header_global_2feb456c17c27dec = ((u32(((u32(342) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7dc5b27af351af9129b037cd() {
  return __cxx_static_address_7dc5b27af351af9129b037cd.reference || (__cxx_static_address_7dc5b27af351af9129b037cd.reference = {
    __cReference: true,
    get value() { return PANNEL1____header_global_2feb456c17c27dec; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:296
export const PANNEL2____header_global_d2bd9dd95273d147 = ((u32(((u32(343) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b0ec66acd8dd51e9bf1352f8() {
  return __cxx_static_address_b0ec66acd8dd51e9bf1352f8.reference || (__cxx_static_address_b0ec66acd8dd51e9bf1352f8.reference = {
    __cReference: true,
    get value() { return PANNEL2____header_global_d2bd9dd95273d147; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:297
export const STATIC____header_global_ca73fb7e15797326 = ((u32(((u32(351) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_371a12d70a7736e371975edc() {
  return __cxx_static_address_371a12d70a7736e371975edc.reference || (__cxx_static_address_371a12d70a7736e371975edc.reference = {
    __cReference: true,
    get value() { return STATIC____header_global_ca73fb7e15797326; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:298
export const W_SCREENBREAK____header_global_a571fb6139be004a = ((u32(((u32(357) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_217060f88f9f10b001d96231() {
  return __cxx_static_address_217060f88f9f10b001d96231.reference || (__cxx_static_address_217060f88f9f10b001d96231.reference = {
    __cReference: true,
    get value() { return W_SCREENBREAK____header_global_a571fb6139be004a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:299
export const W_HITTECHWALL3____header_global_5d704f91f28e6200 = ((u32(((u32(360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_573bdd0c132b17dddfe139ae() {
  return __cxx_static_address_573bdd0c132b17dddfe139ae.reference || (__cxx_static_address_573bdd0c132b17dddfe139ae.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL3____header_global_5d704f91f28e6200; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:300
export const W_HITTECHWALL4____header_global_1b20d04b8338d140 = ((u32(((u32(361) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9559f7fe56ac655d0e9482d3() {
  return __cxx_static_address_9559f7fe56ac655d0e9482d3.reference || (__cxx_static_address_9559f7fe56ac655d0e9482d3.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL4____header_global_1b20d04b8338d140; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:301
export const W_HITTECHWALL2____header_global_85256fc0706394fa = ((u32(((u32(362) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c10c81e8f27d9d550ac605f3() {
  return __cxx_static_address_c10c81e8f27d9d550ac605f3.reference || (__cxx_static_address_c10c81e8f27d9d550ac605f3.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL2____header_global_85256fc0706394fa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:302
export const W_HITTECHWALL1____header_global_739e12cf716fd69d = ((u32(((u32(363) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e40496aed8efb1c914fe08a2() {
  return __cxx_static_address_e40496aed8efb1c914fe08a2.reference || (__cxx_static_address_e40496aed8efb1c914fe08a2.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL1____header_global_739e12cf716fd69d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:303
export const MASKWALL10____header_global_39bd7ba0133d8e29 = ((u32(((u32(387) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a15c188481a3e46a37b61081() {
  return __cxx_static_address_a15c188481a3e46a37b61081.reference || (__cxx_static_address_a15c188481a3e46a37b61081.reference = {
    __cReference: true,
    get value() { return MASKWALL10____header_global_39bd7ba0133d8e29; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:304
export const MASKWALL11____header_global_799579d1c1eeb5d8 = ((u32(((u32(391) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e810b8db392ded63cbbec3ac() {
  return __cxx_static_address_e810b8db392ded63cbbec3ac.reference || (__cxx_static_address_e810b8db392ded63cbbec3ac.reference = {
    __cReference: true,
    get value() { return MASKWALL11____header_global_799579d1c1eeb5d8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:305
export const DOORTILE22____header_global_480daaca161f3136 = ((u32(((u32(395) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cc108ffb213dd446ff160b5c() {
  return __cxx_static_address_cc108ffb213dd446ff160b5c.reference || (__cxx_static_address_cc108ffb213dd446ff160b5c.reference = {
    __cReference: true,
    get value() { return DOORTILE22____header_global_480daaca161f3136; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:306
export const FANSPRITE____header_global_bd8ebe07063c1c8b = ((u32(((u32(407) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e701ac90c78148045152f7c4() {
  return __cxx_static_address_e701ac90c78148045152f7c4.reference || (__cxx_static_address_e701ac90c78148045152f7c4.reference = {
    __cReference: true,
    get value() { return FANSPRITE____header_global_bd8ebe07063c1c8b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:307
export const FANSPRITEBROKE____header_global_34a9bc1febf781cc = ((u32(((u32(411) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3234594b10b583be22891a27() {
  return __cxx_static_address_3234594b10b583be22891a27.reference || (__cxx_static_address_3234594b10b583be22891a27.reference = {
    __cReference: true,
    get value() { return FANSPRITEBROKE____header_global_34a9bc1febf781cc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:308
export const FANSHADOW____header_global_85e4997019fecb30 = ((u32(((u32(412) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_acbb22aa2b07a5d82ce06f5d() {
  return __cxx_static_address_acbb22aa2b07a5d82ce06f5d.reference || (__cxx_static_address_acbb22aa2b07a5d82ce06f5d.reference = {
    __cReference: true,
    get value() { return FANSHADOW____header_global_85e4997019fecb30; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:309
export const FANSHADOWBROKE____header_global_659f5030259ab98a = ((u32(((u32(416) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ca3ec0e046071474ff7a3eff() {
  return __cxx_static_address_ca3ec0e046071474ff7a3eff.reference || (__cxx_static_address_ca3ec0e046071474ff7a3eff.reference = {
    __cReference: true,
    get value() { return FANSHADOWBROKE____header_global_659f5030259ab98a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:310
export const DOORTILE18____header_global_8a621ccf52eb3f49 = ((u32(((u32(447) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6fc8b3607449d653b31c4d8c() {
  return __cxx_static_address_6fc8b3607449d653b31c4d8c.reference || (__cxx_static_address_6fc8b3607449d653b31c4d8c.reference = {
    __cReference: true,
    get value() { return DOORTILE18____header_global_8a621ccf52eb3f49; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:311
export const DOORTILE19____header_global_87b8d90d82ff6c5b = ((u32(((u32(448) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7dfa6121e694f80676de73f1() {
  return __cxx_static_address_7dfa6121e694f80676de73f1.reference || (__cxx_static_address_7dfa6121e694f80676de73f1.reference = {
    __cReference: true,
    get value() { return DOORTILE19____header_global_87b8d90d82ff6c5b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:312
export const DOORTILE20____header_global_55ddeec407f48859 = ((u32(((u32(449) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8d90609b5789669cf584858a() {
  return __cxx_static_address_8d90609b5789669cf584858a.reference || (__cxx_static_address_8d90609b5789669cf584858a.reference = {
    __cReference: true,
    get value() { return DOORTILE20____header_global_55ddeec407f48859; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:313
export const VIEWSCREEN2____header_global_736dc52007da3f8a = ((u32(((u32(499) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e1e34a298414945148a8ec6d() {
  return __cxx_static_address_e1e34a298414945148a8ec6d.reference || (__cxx_static_address_e1e34a298414945148a8ec6d.reference = {
    __cReference: true,
    get value() { return VIEWSCREEN2____header_global_736dc52007da3f8a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:314
export const VIEWSCREEN____header_global_d7451614f8860220 = ((u32(((u32(502) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5caf2c6a0fd7b9744b2f45e0() {
  return __cxx_static_address_5caf2c6a0fd7b9744b2f45e0.reference || (__cxx_static_address_5caf2c6a0fd7b9744b2f45e0.reference = {
    __cReference: true,
    get value() { return VIEWSCREEN____header_global_d7451614f8860220; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:315
export const GLASS____header_global_f3c1d7616906a1ae = ((u32(((u32(503) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5c9bf557c11c996299243849() {
  return __cxx_static_address_5c9bf557c11c996299243849.reference || (__cxx_static_address_5c9bf557c11c996299243849.reference = {
    __cReference: true,
    get value() { return GLASS____header_global_f3c1d7616906a1ae; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:316
export const GLASS2____header_global_88197425c30425c7 = ((u32(((u32(504) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_afb671b63cd21d277ef0d6af() {
  return __cxx_static_address_afb671b63cd21d277ef0d6af.reference || (__cxx_static_address_afb671b63cd21d277ef0d6af.reference = {
    __cReference: true,
    get value() { return GLASS2____header_global_88197425c30425c7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:317
export const STAINGLASS1____header_global_c16fa7e5ef8aebde = ((u32(((u32(510) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1b8d88179e0b62e61a2c1359() {
  return __cxx_static_address_1b8d88179e0b62e61a2c1359.reference || (__cxx_static_address_1b8d88179e0b62e61a2c1359.reference = {
    __cReference: true,
    get value() { return STAINGLASS1____header_global_c16fa7e5ef8aebde; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:318
export const MASKWALL5____header_global_22ba96f58fbe93fd = ((u32(((u32(514) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0fa227b9394ff7ccb5fca816() {
  return __cxx_static_address_0fa227b9394ff7ccb5fca816.reference || (__cxx_static_address_0fa227b9394ff7ccb5fca816.reference = {
    __cReference: true,
    get value() { return MASKWALL5____header_global_22ba96f58fbe93fd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:319
export const SATELITE____header_global_0ef4a6967bd3bb2a = ((u32(((u32(516) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_54c8e5bde9d001488bebccda() {
  return __cxx_static_address_54c8e5bde9d001488bebccda.reference || (__cxx_static_address_54c8e5bde9d001488bebccda.reference = {
    __cReference: true,
    get value() { return SATELITE____header_global_0ef4a6967bd3bb2a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:320
export const FUELPOD____header_global_4379ea7c05812c90 = ((u32(((u32(517) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0c68ac1387ee610adf004bfd() {
  return __cxx_static_address_0c68ac1387ee610adf004bfd.reference || (__cxx_static_address_0c68ac1387ee610adf004bfd.reference = {
    __cReference: true,
    get value() { return FUELPOD____header_global_4379ea7c05812c90; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:321
export const CRACK1____header_global_3d98f8a05f7609a5 = ((u32(((u32(546) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_deb925816967f0fdbe4133a6() {
  return __cxx_static_address_deb925816967f0fdbe4133a6.reference || (__cxx_static_address_deb925816967f0fdbe4133a6.reference = {
    __cReference: true,
    get value() { return CRACK1____header_global_3d98f8a05f7609a5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:322
export const CRACK2____header_global_02e6219e50abfc28 = ((u32(((u32(547) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_97dda0150f450edfcdc02710() {
  return __cxx_static_address_97dda0150f450edfcdc02710.reference || (__cxx_static_address_97dda0150f450edfcdc02710.reference = {
    __cReference: true,
    get value() { return CRACK2____header_global_02e6219e50abfc28; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:323
export const CRACK3____header_global_875b3ff5f65b6338 = ((u32(((u32(548) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_76bcae77ab5a40569e5b7545() {
  return __cxx_static_address_76bcae77ab5a40569e5b7545.reference || (__cxx_static_address_76bcae77ab5a40569e5b7545.reference = {
    __cReference: true,
    get value() { return CRACK3____header_global_875b3ff5f65b6338; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:324
export const CRACK4____header_global_a9c6bb3644287ed3 = ((u32(((u32(549) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a4bbbc785e7279b908f84994() {
  return __cxx_static_address_a4bbbc785e7279b908f84994.reference || (__cxx_static_address_a4bbbc785e7279b908f84994.reference = {
    __cReference: true,
    get value() { return CRACK4____header_global_a9c6bb3644287ed3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:325
export const FOOTPRINTS____header_global_febfae0813ef4a70 = ((u32(((u32(550) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a150b2d0e74a3974194a3c2e() {
  return __cxx_static_address_a150b2d0e74a3974194a3c2e.reference || (__cxx_static_address_a150b2d0e74a3974194a3c2e.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS____header_global_febfae0813ef4a70; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:326
export const DOMELITE____header_global_1b58b675dc76163f = ((u32(((u32(551) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_80ddd04d0890fc7bc556df9b() {
  return __cxx_static_address_80ddd04d0890fc7bc556df9b.reference || (__cxx_static_address_80ddd04d0890fc7bc556df9b.reference = {
    __cReference: true,
    get value() { return DOMELITE____header_global_1b58b675dc76163f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:327
export const CAMERAPOLE____header_global_e847c9552a1647b2 = ((u32(((u32(554) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e40e09f97e2ecee6953589a7() {
  return __cxx_static_address_e40e09f97e2ecee6953589a7.reference || (__cxx_static_address_e40e09f97e2ecee6953589a7.reference = {
    __cReference: true,
    get value() { return CAMERAPOLE____header_global_e847c9552a1647b2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:328
export const CHAIR1____header_global_092a35de1485d1a9 = ((u32(((u32(556) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8e9c5bc41e2451d49406996b() {
  return __cxx_static_address_8e9c5bc41e2451d49406996b.reference || (__cxx_static_address_8e9c5bc41e2451d49406996b.reference = {
    __cReference: true,
    get value() { return CHAIR1____header_global_092a35de1485d1a9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:329
export const CHAIR2____header_global_18eba8658a10b7e2 = ((u32(((u32(557) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d57a574f07f27340b2880b66() {
  return __cxx_static_address_d57a574f07f27340b2880b66.reference || (__cxx_static_address_d57a574f07f27340b2880b66.reference = {
    __cReference: true,
    get value() { return CHAIR2____header_global_18eba8658a10b7e2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:330
export const BROKENCHAIR____header_global_a75c85f132e58235 = ((u32(((u32(559) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_99e5bdfdff6d1bcd5115ba23() {
  return __cxx_static_address_99e5bdfdff6d1bcd5115ba23.reference || (__cxx_static_address_99e5bdfdff6d1bcd5115ba23.reference = {
    __cReference: true,
    get value() { return BROKENCHAIR____header_global_a75c85f132e58235; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:331
export const MIRROR____header_global_bde4df3056d1c0a3 = ((u32(((u32(560) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e6813dd12d83af945faadc93() {
  return __cxx_static_address_e6813dd12d83af945faadc93.reference || (__cxx_static_address_e6813dd12d83af945faadc93.reference = {
    __cReference: true,
    get value() { return MIRROR____header_global_bde4df3056d1c0a3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:332
export const WATERFOUNTAIN____header_global_0522c2588cf7127b = ((u32(((u32(563) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f6403da5ae5cb0a3f55bafed() {
  return __cxx_static_address_f6403da5ae5cb0a3f55bafed.reference || (__cxx_static_address_f6403da5ae5cb0a3f55bafed.reference = {
    __cReference: true,
    get value() { return WATERFOUNTAIN____header_global_0522c2588cf7127b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:333
export const WATERFOUNTAINBROKE____header_global_ebd54e55201c5d8f = ((u32(((u32(567) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d48b63122bc41a29a24c0ce2() {
  return __cxx_static_address_d48b63122bc41a29a24c0ce2.reference || (__cxx_static_address_d48b63122bc41a29a24c0ce2.reference = {
    __cReference: true,
    get value() { return WATERFOUNTAINBROKE____header_global_ebd54e55201c5d8f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:334
export const FEMMAG1____header_global_d19a136bf9ae7430 = ((u32(((u32(568) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_19f09fc5340f3daa3df265ea() {
  return __cxx_static_address_19f09fc5340f3daa3df265ea.reference || (__cxx_static_address_19f09fc5340f3daa3df265ea.reference = {
    __cReference: true,
    get value() { return FEMMAG1____header_global_d19a136bf9ae7430; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:335
export const TOILET____header_global_a6648ee8d1d8aac6 = ((u32(((u32(569) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9df7c9227f0a937db0cb24b5() {
  return __cxx_static_address_9df7c9227f0a937db0cb24b5.reference || (__cxx_static_address_9df7c9227f0a937db0cb24b5.reference = {
    __cReference: true,
    get value() { return TOILET____header_global_a6648ee8d1d8aac6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:336
export const STALL____header_global_3e673593c4ac6114 = ((u32(((u32(571) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_112be134bf60e74b4c488dfa() {
  return __cxx_static_address_112be134bf60e74b4c488dfa.reference || (__cxx_static_address_112be134bf60e74b4c488dfa.reference = {
    __cReference: true,
    get value() { return STALL____header_global_3e673593c4ac6114; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:337
export const STALLBROKE____header_global_89bea02330827433 = ((u32(((u32(573) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2a06dc262a0e1c939299a16f() {
  return __cxx_static_address_2a06dc262a0e1c939299a16f.reference || (__cxx_static_address_2a06dc262a0e1c939299a16f.reference = {
    __cReference: true,
    get value() { return STALLBROKE____header_global_89bea02330827433; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:338
export const FEMMAG2____header_global_7963386fd84a8e79 = ((u32(((u32(577) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2e1d9ed7ce255afc8081ee47() {
  return __cxx_static_address_2e1d9ed7ce255afc8081ee47.reference || (__cxx_static_address_2e1d9ed7ce255afc8081ee47.reference = {
    __cReference: true,
    get value() { return FEMMAG2____header_global_7963386fd84a8e79; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:339
export const REACTOR2____header_global_b4d2e53ae858cdc3 = ((u32(((u32(578) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d6e7b0111158bef152f1fc44() {
  return __cxx_static_address_d6e7b0111158bef152f1fc44.reference || (__cxx_static_address_d6e7b0111158bef152f1fc44.reference = {
    __cReference: true,
    get value() { return REACTOR2____header_global_b4d2e53ae858cdc3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:340
export const REACTOR2BURNT____header_global_4d286988cc8b46e4 = ((u32(((u32(579) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_49ba6308a1744b67ec5e4cd9() {
  return __cxx_static_address_49ba6308a1744b67ec5e4cd9.reference || (__cxx_static_address_49ba6308a1744b67ec5e4cd9.reference = {
    __cReference: true,
    get value() { return REACTOR2BURNT____header_global_4d286988cc8b46e4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:341
export const REACTOR2SPARK____header_global_a81ff4d0a85a6039 = ((u32(((u32(580) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_42018ff72230206f1e265bae() {
  return __cxx_static_address_42018ff72230206f1e265bae.reference || (__cxx_static_address_42018ff72230206f1e265bae.reference = {
    __cReference: true,
    get value() { return REACTOR2SPARK____header_global_a81ff4d0a85a6039; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:342
export const GRATE1____header_global_37eb31242d2df6a2 = ((u32(((u32(595) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_87720f86d73d36bd1a82a603() {
  return __cxx_static_address_87720f86d73d36bd1a82a603.reference || (__cxx_static_address_87720f86d73d36bd1a82a603.reference = {
    __cReference: true,
    get value() { return GRATE1____header_global_37eb31242d2df6a2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:343
export const BGRATE1____header_global_58624e2d8358a8ed = ((u32(((u32(596) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fcb4c8ec2f82ef5a7934d4a9() {
  return __cxx_static_address_fcb4c8ec2f82ef5a7934d4a9.reference || (__cxx_static_address_fcb4c8ec2f82ef5a7934d4a9.reference = {
    __cReference: true,
    get value() { return BGRATE1____header_global_58624e2d8358a8ed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:344
export const SOLARPANNEL____header_global_cfad0136b42cc101 = ((u32(((u32(602) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5bd72dc221d163fff72bc7cd() {
  return __cxx_static_address_5bd72dc221d163fff72bc7cd.reference || (__cxx_static_address_5bd72dc221d163fff72bc7cd.reference = {
    __cReference: true,
    get value() { return SOLARPANNEL____header_global_cfad0136b42cc101; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:345
export const NAKED1____header_global_b5842ab14cef23c0 = ((u32(((u32(603) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_638455477e39254838123577() {
  return __cxx_static_address_638455477e39254838123577.reference || (__cxx_static_address_638455477e39254838123577.reference = {
    __cReference: true,
    get value() { return NAKED1____header_global_b5842ab14cef23c0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:346
export const ANTENNA____header_global_be8dacbd213763dc = ((u32(((u32(607) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_30261563271f49301a97d71b() {
  return __cxx_static_address_30261563271f49301a97d71b.reference || (__cxx_static_address_30261563271f49301a97d71b.reference = {
    __cReference: true,
    get value() { return ANTENNA____header_global_be8dacbd213763dc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:347
export const MASKWALL12____header_global_5fac2e6d6c1a5734 = ((u32(((u32(609) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b242805f4f7cbc99ba61a749() {
  return __cxx_static_address_b242805f4f7cbc99ba61a749.reference || (__cxx_static_address_b242805f4f7cbc99ba61a749.reference = {
    __cReference: true,
    get value() { return MASKWALL12____header_global_5fac2e6d6c1a5734; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:348
export const TOILETBROKE____header_global_4d2bd5202c4f1e2d = ((u32(((u32(615) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cacaf270030f2a166fd54cbb() {
  return __cxx_static_address_cacaf270030f2a166fd54cbb.reference || (__cxx_static_address_cacaf270030f2a166fd54cbb.reference = {
    __cReference: true,
    get value() { return TOILETBROKE____header_global_4d2bd5202c4f1e2d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:349
export const PIPE2____header_global_1efaa7fb0c7a39c8 = ((u32(((u32(616) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5db9e94c160c3f3b2316c0c0() {
  return __cxx_static_address_5db9e94c160c3f3b2316c0c0.reference || (__cxx_static_address_5db9e94c160c3f3b2316c0c0.reference = {
    __cReference: true,
    get value() { return PIPE2____header_global_1efaa7fb0c7a39c8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:350
export const PIPE1B____header_global_c006eabeb14d5d47 = ((u32(((u32(617) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_da8d2dc5bdc7cf4345072f7d() {
  return __cxx_static_address_da8d2dc5bdc7cf4345072f7d.reference || (__cxx_static_address_da8d2dc5bdc7cf4345072f7d.reference = {
    __cReference: true,
    get value() { return PIPE1B____header_global_c006eabeb14d5d47; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:351
export const PIPE3____header_global_9a13e774e138c996 = ((u32(((u32(618) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1ad66a628889112baac99888() {
  return __cxx_static_address_1ad66a628889112baac99888.reference || (__cxx_static_address_1ad66a628889112baac99888.reference = {
    __cReference: true,
    get value() { return PIPE3____header_global_9a13e774e138c996; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:352
export const PIPE1____header_global_eb0a7582fe6587c7 = ((u32(((u32(619) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_db4ee1333b0f1ae382d88b4c() {
  return __cxx_static_address_db4ee1333b0f1ae382d88b4c.reference || (__cxx_static_address_db4ee1333b0f1ae382d88b4c.reference = {
    __cReference: true,
    get value() { return PIPE1____header_global_eb0a7582fe6587c7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:353
export const CAMERA1____header_global_9002d6de94d263b0 = ((u32(((u32(621) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8b71d905cd8c6a6422513c3d() {
  return __cxx_static_address_8b71d905cd8c6a6422513c3d.reference || (__cxx_static_address_8b71d905cd8c6a6422513c3d.reference = {
    __cReference: true,
    get value() { return CAMERA1____header_global_9002d6de94d263b0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:354
export const PIPE2B____header_global_21d594335142e220 = ((u32(((u32(633) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4cff6d636038f21d512c7bb7() {
  return __cxx_static_address_4cff6d636038f21d512c7bb7.reference || (__cxx_static_address_4cff6d636038f21d512c7bb7.reference = {
    __cReference: true,
    get value() { return PIPE2B____header_global_21d594335142e220; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:355
export const BOLT1____header_global_b9c40d7a6bddd408 = ((u32(((u32(634) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_43b743ddc6b082ab440703e1() {
  return __cxx_static_address_43b743ddc6b082ab440703e1.reference || (__cxx_static_address_43b743ddc6b082ab440703e1.reference = {
    __cReference: true,
    get value() { return BOLT1____header_global_b9c40d7a6bddd408; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:356
export const W_NUMBERS____header_global_6b8bd969884d093b = ((u32(((u32(640) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_15b38df91bc9c778a8a97450() {
  return __cxx_static_address_15b38df91bc9c778a8a97450.reference || (__cxx_static_address_15b38df91bc9c778a8a97450.reference = {
    __cReference: true,
    get value() { return W_NUMBERS____header_global_6b8bd969884d093b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:357
export const WATERDRIP____header_global_4d1462a8ac049e82 = ((u32(((u32(660) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_333a46f301c6373947758241() {
  return __cxx_static_address_333a46f301c6373947758241.reference || (__cxx_static_address_333a46f301c6373947758241.reference = {
    __cReference: true,
    get value() { return WATERDRIP____header_global_4d1462a8ac049e82; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:358
export const WATERBUBBLE____header_global_102067707da62a3c = ((u32(((u32(661) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5a3d4e59a5908ccb3090650d() {
  return __cxx_static_address_5a3d4e59a5908ccb3090650d.reference || (__cxx_static_address_5a3d4e59a5908ccb3090650d.reference = {
    __cReference: true,
    get value() { return WATERBUBBLE____header_global_102067707da62a3c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:359
export const WATERBUBBLEMAKER____header_global_c5473b0e3603197c = ((u32(((u32(662) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_06e6785b38147fec816692eb() {
  return __cxx_static_address_06e6785b38147fec816692eb.reference || (__cxx_static_address_06e6785b38147fec816692eb.reference = {
    __cReference: true,
    get value() { return WATERBUBBLEMAKER____header_global_c5473b0e3603197c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:360
export const W_FORCEFIELD____header_global_f4afc8ca83ca1331 = ((u32(((u32(663) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f9cbe3e600bb1aba6888e0eb() {
  return __cxx_static_address_f9cbe3e600bb1aba6888e0eb.reference || (__cxx_static_address_f9cbe3e600bb1aba6888e0eb.reference = {
    __cReference: true,
    get value() { return W_FORCEFIELD____header_global_f4afc8ca83ca1331; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:361
export const VACUUM____header_global_0277123e8d238ec5 = ((u32(((u32(669) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_754e8b51ca01ba293a72e844() {
  return __cxx_static_address_754e8b51ca01ba293a72e844.reference || (__cxx_static_address_754e8b51ca01ba293a72e844.reference = {
    __cReference: true,
    get value() { return VACUUM____header_global_0277123e8d238ec5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:362
export const FOOTPRINTS2____header_global_dd8208f0ebbebe4d = ((u32(((u32(672) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2646884708be86f5f8540a0f() {
  return __cxx_static_address_2646884708be86f5f8540a0f.reference || (__cxx_static_address_2646884708be86f5f8540a0f.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS2____header_global_dd8208f0ebbebe4d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:363
export const FOOTPRINTS3____header_global_f1430742b374ce5f = ((u32(((u32(673) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d9849997dcb60fe8b1559085() {
  return __cxx_static_address_d9849997dcb60fe8b1559085.reference || (__cxx_static_address_d9849997dcb60fe8b1559085.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS3____header_global_f1430742b374ce5f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:364
export const FOOTPRINTS4____header_global_463f9163fdcc1c25 = ((u32(((u32(674) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_24a05be0019bd00f6a090153() {
  return __cxx_static_address_24a05be0019bd00f6a090153.reference || (__cxx_static_address_24a05be0019bd00f6a090153.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS4____header_global_463f9163fdcc1c25; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:365
export const EGG____header_global_5154922dc8de727f = ((u32(((u32(675) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cd43ffa1c3f49a74418aa1f3() {
  return __cxx_static_address_cd43ffa1c3f49a74418aa1f3.reference || (__cxx_static_address_cd43ffa1c3f49a74418aa1f3.reference = {
    __cReference: true,
    get value() { return EGG____header_global_5154922dc8de727f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:366
export const SCALE____header_global_a0caec61046fe883 = ((u32(((u32(678) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_95edb181132932ef060e4fd6() {
  return __cxx_static_address_95edb181132932ef060e4fd6.reference || (__cxx_static_address_95edb181132932ef060e4fd6.reference = {
    __cReference: true,
    get value() { return SCALE____header_global_a0caec61046fe883; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:367
export const CHAIR3____header_global_5b6e99f92806da06 = ((u32(((u32(680) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_322277ffb42ec07f87603a3d() {
  return __cxx_static_address_322277ffb42ec07f87603a3d.reference || (__cxx_static_address_322277ffb42ec07f87603a3d.reference = {
    __cReference: true,
    get value() { return CHAIR3____header_global_5b6e99f92806da06; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:368
export const CAMERALIGHT____header_global_0d3db3582b19853e = ((u32(((u32(685) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5341d2dc888f758b9c7c94fc() {
  return __cxx_static_address_5341d2dc888f758b9c7c94fc.reference || (__cxx_static_address_5341d2dc888f758b9c7c94fc.reference = {
    __cReference: true,
    get value() { return CAMERALIGHT____header_global_0d3db3582b19853e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:369
export const MOVIECAMERA____header_global_3afb64261569146c = ((u32(((u32(686) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_07a8e13309ccfd1b1dbedaa1() {
  return __cxx_static_address_07a8e13309ccfd1b1dbedaa1.reference || (__cxx_static_address_07a8e13309ccfd1b1dbedaa1.reference = {
    __cReference: true,
    get value() { return MOVIECAMERA____header_global_3afb64261569146c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:370
export const IVUNIT____header_global_137f3a11090943ce = ((u32(((u32(689) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5e41576e76336a68acf74efc() {
  return __cxx_static_address_5e41576e76336a68acf74efc.reference || (__cxx_static_address_5e41576e76336a68acf74efc.reference = {
    __cReference: true,
    get value() { return IVUNIT____header_global_137f3a11090943ce; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:371
export const POT1____header_global_a63d46a51ee04560 = ((u32(((u32(694) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3c3fe2c46f8bacd28dff0855() {
  return __cxx_static_address_3c3fe2c46f8bacd28dff0855.reference || (__cxx_static_address_3c3fe2c46f8bacd28dff0855.reference = {
    __cReference: true,
    get value() { return POT1____header_global_a63d46a51ee04560; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:372
export const POT2____header_global_daa89a3a8e143583 = ((u32(((u32(695) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a07d3a187d8ef2074091b955() {
  return __cxx_static_address_a07d3a187d8ef2074091b955.reference || (__cxx_static_address_a07d3a187d8ef2074091b955.reference = {
    __cReference: true,
    get value() { return POT2____header_global_daa89a3a8e143583; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:373
export const POT3____header_global_6c8d2e7b639dc627 = ((u32(((u32(697) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ed00e77427c238a55daae35d() {
  return __cxx_static_address_ed00e77427c238a55daae35d.reference || (__cxx_static_address_ed00e77427c238a55daae35d.reference = {
    __cReference: true,
    get value() { return POT3____header_global_6c8d2e7b639dc627; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:374
export const PIPE3B____header_global_9ae4ac99225ed684 = ((u32(((u32(700) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_45c38a152a3f041de52480d6() {
  return __cxx_static_address_45c38a152a3f041de52480d6.reference || (__cxx_static_address_45c38a152a3f041de52480d6.reference = {
    __cReference: true,
    get value() { return PIPE3B____header_global_9ae4ac99225ed684; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:375
export const WALLLIGHT3____header_global_3ca59eac4ef7f3a7 = ((u32(((u32(701) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a492987ae94d55d65ccb5425() {
  return __cxx_static_address_a492987ae94d55d65ccb5425.reference || (__cxx_static_address_a492987ae94d55d65ccb5425.reference = {
    __cReference: true,
    get value() { return WALLLIGHT3____header_global_3ca59eac4ef7f3a7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:376
export const WALLLIGHTBUST3____header_global_aa3652686ca940b8 = ((u32(((u32(702) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d181f33f4a25b2df719105b4() {
  return __cxx_static_address_d181f33f4a25b2df719105b4.reference || (__cxx_static_address_d181f33f4a25b2df719105b4.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST3____header_global_aa3652686ca940b8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:377
export const WALLLIGHT1____header_global_7acd5e670120a9d2 = ((u32(((u32(703) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3d468532b37a210a1f79e580() {
  return __cxx_static_address_3d468532b37a210a1f79e580.reference || (__cxx_static_address_3d468532b37a210a1f79e580.reference = {
    __cReference: true,
    get value() { return WALLLIGHT1____header_global_7acd5e670120a9d2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:378
export const WALLLIGHTBUST1____header_global_52a3bd5d45c5e1a0 = ((u32(((u32(704) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_815a30e90ffec0a4a8ae6240() {
  return __cxx_static_address_815a30e90ffec0a4a8ae6240.reference || (__cxx_static_address_815a30e90ffec0a4a8ae6240.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST1____header_global_52a3bd5d45c5e1a0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:379
export const WALLLIGHT2____header_global_6b07fdf21f988519 = ((u32(((u32(705) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6319ddcf596744dc21df4cb8() {
  return __cxx_static_address_6319ddcf596744dc21df4cb8.reference || (__cxx_static_address_6319ddcf596744dc21df4cb8.reference = {
    __cReference: true,
    get value() { return WALLLIGHT2____header_global_6b07fdf21f988519; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:380
export const WALLLIGHTBUST2____header_global_f8f7df2298c42f70 = ((u32(((u32(706) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_626596e2ffb8f3fab187bd46() {
  return __cxx_static_address_626596e2ffb8f3fab187bd46.reference || (__cxx_static_address_626596e2ffb8f3fab187bd46.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST2____header_global_f8f7df2298c42f70; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:381
export const LIGHTSWITCH2____header_global_3a6cb3b6f173976e = ((u32(((u32(712) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c921ca06dad28271e18a38ad() {
  return __cxx_static_address_c921ca06dad28271e18a38ad.reference || (__cxx_static_address_c921ca06dad28271e18a38ad.reference = {
    __cReference: true,
    get value() { return LIGHTSWITCH2____header_global_3a6cb3b6f173976e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:382
export const WAITTOBESEATED____header_global_66ab6c92213d6775 = ((u32(((u32(716) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8145fa00130bc718b6713934() {
  return __cxx_static_address_8145fa00130bc718b6713934.reference || (__cxx_static_address_8145fa00130bc718b6713934.reference = {
    __cReference: true,
    get value() { return WAITTOBESEATED____header_global_66ab6c92213d6775; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:383
export const DOORTILE14____header_global_9f8fddd462c8ac95 = ((u32(((u32(717) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_90e5c4c559ef9ac5304f1dce() {
  return __cxx_static_address_90e5c4c559ef9ac5304f1dce.reference || (__cxx_static_address_90e5c4c559ef9ac5304f1dce.reference = {
    __cReference: true,
    get value() { return DOORTILE14____header_global_9f8fddd462c8ac95; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:384
export const STATUE____header_global_ec0dc3eb74ce397b = ((u32(((u32(753) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1034e722ef7c1704fa470dd4() {
  return __cxx_static_address_1034e722ef7c1704fa470dd4.reference || (__cxx_static_address_1034e722ef7c1704fa470dd4.reference = {
    __cReference: true,
    get value() { return STATUE____header_global_ec0dc3eb74ce397b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:385
export const MIKE____header_global_d8077b387ea39d3e = ((u32(((u32(762) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_01a95d5d0ae2b59eebc2df34() {
  return __cxx_static_address_01a95d5d0ae2b59eebc2df34.reference || (__cxx_static_address_01a95d5d0ae2b59eebc2df34.reference = {
    __cReference: true,
    get value() { return MIKE____header_global_d8077b387ea39d3e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:386
export const VASE____header_global_5b61bb3630b8567c = ((u32(((u32(765) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e993a570867b78fae9962999() {
  return __cxx_static_address_e993a570867b78fae9962999.reference || (__cxx_static_address_e993a570867b78fae9962999.reference = {
    __cReference: true,
    get value() { return VASE____header_global_5b61bb3630b8567c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:387
export const SUSHIPLATE1____header_global_05f7131ea135a2a8 = ((u32(((u32(768) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ef13b6ca3ab93c8c25a5334d() {
  return __cxx_static_address_ef13b6ca3ab93c8c25a5334d.reference || (__cxx_static_address_ef13b6ca3ab93c8c25a5334d.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE1____header_global_05f7131ea135a2a8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:388
export const SUSHIPLATE2____header_global_ef026c2ee3b047cf = ((u32(((u32(769) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4985534257692e324e9d0af8() {
  return __cxx_static_address_4985534257692e324e9d0af8.reference || (__cxx_static_address_4985534257692e324e9d0af8.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE2____header_global_ef026c2ee3b047cf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:389
export const SUSHIPLATE3____header_global_f73c4622a82c5281 = ((u32(((u32(774) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_af4e62d72e11363d83a3272c() {
  return __cxx_static_address_af4e62d72e11363d83a3272c.reference || (__cxx_static_address_af4e62d72e11363d83a3272c.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE3____header_global_f73c4622a82c5281; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:390
export const SUSHIPLATE4____header_global_f411b69fb75aa9f6 = ((u32(((u32(779) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_92a7fc68952ba28b3ddbc664() {
  return __cxx_static_address_92a7fc68952ba28b3ddbc664.reference || (__cxx_static_address_92a7fc68952ba28b3ddbc664.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE4____header_global_f411b69fb75aa9f6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:391
export const DOORTILE16____header_global_2d8ca6256ccdee4c = ((u32(((u32(781) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_70755bde0c3eb125b15c1b1b() {
  return __cxx_static_address_70755bde0c3eb125b15c1b1b.reference || (__cxx_static_address_70755bde0c3eb125b15c1b1b.reference = {
    __cReference: true,
    get value() { return DOORTILE16____header_global_2d8ca6256ccdee4c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:392
export const SUSHIPLATE5____header_global_973fa2030248f26c = ((u32(((u32(792) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_67dcb7dc96f973bbb1b4c352() {
  return __cxx_static_address_67dcb7dc96f973bbb1b4c352.reference || (__cxx_static_address_67dcb7dc96f973bbb1b4c352.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE5____header_global_973fa2030248f26c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:393
export const OJ____header_global_804c57bdf9840ebd = ((u32(((u32(806) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_731308f0001419c1d78a0094() {
  return __cxx_static_address_731308f0001419c1d78a0094.reference || (__cxx_static_address_731308f0001419c1d78a0094.reference = {
    __cReference: true,
    get value() { return OJ____header_global_804c57bdf9840ebd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:394
export const MASKWALL13____header_global_e9e0274173c656b2 = ((u32(((u32(830) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5e782816fd09fd9b99d2875e() {
  return __cxx_static_address_5e782816fd09fd9b99d2875e.reference || (__cxx_static_address_5e782816fd09fd9b99d2875e.reference = {
    __cReference: true,
    get value() { return MASKWALL13____header_global_e9e0274173c656b2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:395
export const HURTRAIL____header_global_bfc78e5637ecf42f = ((u32(((u32(859) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5f46cffb2b32ee5e3afeea7e() {
  return __cxx_static_address_5f46cffb2b32ee5e3afeea7e.reference || (__cxx_static_address_5f46cffb2b32ee5e3afeea7e.reference = {
    __cReference: true,
    get value() { return HURTRAIL____header_global_bfc78e5637ecf42f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:396
export const POWERSWITCH1____header_global_317f6e9cb243bd0e = ((u32(((u32(860) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_77b53f893e674fc90f8a20d8() {
  return __cxx_static_address_77b53f893e674fc90f8a20d8.reference || (__cxx_static_address_77b53f893e674fc90f8a20d8.reference = {
    __cReference: true,
    get value() { return POWERSWITCH1____header_global_317f6e9cb243bd0e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:397
export const LOCKSWITCH1____header_global_d30d88be2c5b5954 = ((u32(((u32(862) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5716310c0b9aa92b943d66e1() {
  return __cxx_static_address_5716310c0b9aa92b943d66e1.reference || (__cxx_static_address_5716310c0b9aa92b943d66e1.reference = {
    __cReference: true,
    get value() { return LOCKSWITCH1____header_global_d30d88be2c5b5954; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:398
export const POWERSWITCH2____header_global_5c231badbe777a45 = ((u32(((u32(864) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2c403d35165fedd83afcf570() {
  return __cxx_static_address_2c403d35165fedd83afcf570.reference || (__cxx_static_address_2c403d35165fedd83afcf570.reference = {
    __cReference: true,
    get value() { return POWERSWITCH2____header_global_5c231badbe777a45; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:399
export const ATM____header_global_cb08d7c6e6a56fc0 = ((u32(((u32(867) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0443ef8d6f56836c8005cc08() {
  return __cxx_static_address_0443ef8d6f56836c8005cc08.reference || (__cxx_static_address_0443ef8d6f56836c8005cc08.reference = {
    __cReference: true,
    get value() { return ATM____header_global_cb08d7c6e6a56fc0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:400
export const STATUEFLASH____header_global_d85e939ec5e78fd0 = ((u32(((u32(869) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cda8d32e86d63b605d4c292b() {
  return __cxx_static_address_cda8d32e86d63b605d4c292b.reference || (__cxx_static_address_cda8d32e86d63b605d4c292b.reference = {
    __cReference: true,
    get value() { return STATUEFLASH____header_global_d85e939ec5e78fd0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:401
export const ATMBROKE____header_global_d5ca1c7741227d38 = ((u32(((u32(888) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ee19cc5e3e614c23ef47f427() {
  return __cxx_static_address_ee19cc5e3e614c23ef47f427.reference || (__cxx_static_address_ee19cc5e3e614c23ef47f427.reference = {
    __cReference: true,
    get value() { return ATMBROKE____header_global_d5ca1c7741227d38; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:402
export const STRIPEBALL____header_global_a62025c12b445dd6 = ((u32(((u32(901) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_44ac20ee3c2786321e05e5fa() {
  return __cxx_static_address_44ac20ee3c2786321e05e5fa.reference || (__cxx_static_address_44ac20ee3c2786321e05e5fa.reference = {
    __cReference: true,
    get value() { return STRIPEBALL____header_global_a62025c12b445dd6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:403
export const QUEBALL____header_global_ebb677dac13d8929 = ((u32(((u32(902) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e705a5d15493999d4a4616ec() {
  return __cxx_static_address_e705a5d15493999d4a4616ec.reference || (__cxx_static_address_e705a5d15493999d4a4616ec.reference = {
    __cReference: true,
    get value() { return QUEBALL____header_global_ebb677dac13d8929; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:404
export const POCKET____header_global_49e0f905d0ca68c2 = ((u32(((u32(903) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_585ea244fa4d530267db43ef() {
  return __cxx_static_address_585ea244fa4d530267db43ef.reference || (__cxx_static_address_585ea244fa4d530267db43ef.reference = {
    __cReference: true,
    get value() { return POCKET____header_global_49e0f905d0ca68c2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:405
export const WOODENHORSE____header_global_085450583401f6fd = ((u32(((u32(904) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f8f55cf424d0deda68408349() {
  return __cxx_static_address_f8f55cf424d0deda68408349.reference || (__cxx_static_address_f8f55cf424d0deda68408349.reference = {
    __cReference: true,
    get value() { return WOODENHORSE____header_global_085450583401f6fd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:406
export const TREE1____header_global_c467993b0f26d1d5 = ((u32(((u32(908) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fe8f1e3cddccdff6de2c331b() {
  return __cxx_static_address_fe8f1e3cddccdff6de2c331b.reference || (__cxx_static_address_fe8f1e3cddccdff6de2c331b.reference = {
    __cReference: true,
    get value() { return TREE1____header_global_c467993b0f26d1d5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:407
export const TREE2____header_global_29790e5669a296b6 = ((u32(((u32(910) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bc3a284d920462c2641b014c() {
  return __cxx_static_address_bc3a284d920462c2641b014c.reference || (__cxx_static_address_bc3a284d920462c2641b014c.reference = {
    __cReference: true,
    get value() { return TREE2____header_global_29790e5669a296b6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:408
export const CACTUS____header_global_9b401c8a85d2f928 = ((u32(((u32(911) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b2462be525ee82b1b9b1476c() {
  return __cxx_static_address_b2462be525ee82b1b9b1476c.reference || (__cxx_static_address_b2462be525ee82b1b9b1476c.reference = {
    __cReference: true,
    get value() { return CACTUS____header_global_9b401c8a85d2f928; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:409
export const MASKWALL2____header_global_db0596dcad31af68 = ((u32(((u32(913) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b6a33e32b4f7b9698a1cc198() {
  return __cxx_static_address_b6a33e32b4f7b9698a1cc198.reference || (__cxx_static_address_b6a33e32b4f7b9698a1cc198.reference = {
    __cReference: true,
    get value() { return MASKWALL2____header_global_db0596dcad31af68; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:410
export const MASKWALL3____header_global_cd5c84799234c352 = ((u32(((u32(914) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_30c4937e42e4f7926f905691() {
  return __cxx_static_address_30c4937e42e4f7926f905691.reference || (__cxx_static_address_30c4937e42e4f7926f905691.reference = {
    __cReference: true,
    get value() { return MASKWALL3____header_global_cd5c84799234c352; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:411
export const MASKWALL4____header_global_196a5a25a4f79c00 = ((u32(((u32(915) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_45630a33b5be9d5970384cc1() {
  return __cxx_static_address_45630a33b5be9d5970384cc1.reference || (__cxx_static_address_45630a33b5be9d5970384cc1.reference = {
    __cReference: true,
    get value() { return MASKWALL4____header_global_196a5a25a4f79c00; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:412
export const FIREEXT____header_global_3cebd4c2e457e012 = ((u32(((u32(916) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1787e7ff7c09d65d0e59953b() {
  return __cxx_static_address_1787e7ff7c09d65d0e59953b.reference || (__cxx_static_address_1787e7ff7c09d65d0e59953b.reference = {
    __cReference: true,
    get value() { return FIREEXT____header_global_3cebd4c2e457e012; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:413
export const TOILETWATER____header_global_a6e5621071992f3d = ((u32(((u32(921) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6b150688d0b4bb75b147be5a() {
  return __cxx_static_address_6b150688d0b4bb75b147be5a.reference || (__cxx_static_address_6b150688d0b4bb75b147be5a.reference = {
    __cReference: true,
    get value() { return TOILETWATER____header_global_a6e5621071992f3d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:414
export const NEON1____header_global_2bdc83ea3108cb77 = ((u32(((u32(925) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9e6cb0c7224615e842f9de3c() {
  return __cxx_static_address_9e6cb0c7224615e842f9de3c.reference || (__cxx_static_address_9e6cb0c7224615e842f9de3c.reference = {
    __cReference: true,
    get value() { return NEON1____header_global_2bdc83ea3108cb77; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:415
export const NEON2____header_global_a428725c97f9afe7 = ((u32(((u32(926) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7f23d6f7dcfb8ba0ca294fde() {
  return __cxx_static_address_7f23d6f7dcfb8ba0ca294fde.reference || (__cxx_static_address_7f23d6f7dcfb8ba0ca294fde.reference = {
    __cReference: true,
    get value() { return NEON2____header_global_a428725c97f9afe7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:416
export const CACTUSBROKE____header_global_da30e3cae546e2ee = ((u32(((u32(939) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8cff57f3a5f264a825766bbe() {
  return __cxx_static_address_8cff57f3a5f264a825766bbe.reference || (__cxx_static_address_8cff57f3a5f264a825766bbe.reference = {
    __cReference: true,
    get value() { return CACTUSBROKE____header_global_da30e3cae546e2ee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:417
export const BOUNCEMINE____header_global_98defc0a74d50804 = ((u32(((u32(940) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a314737210e5f649023f1e93() {
  return __cxx_static_address_a314737210e5f649023f1e93.reference || (__cxx_static_address_a314737210e5f649023f1e93.reference = {
    __cReference: true,
    get value() { return BOUNCEMINE____header_global_98defc0a74d50804; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:418
export const BROKEFIREHYDRENT____header_global_f1556bebfdf99d4c = ((u32(((u32(950) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b06cebfb637bcda330097a5c() {
  return __cxx_static_address_b06cebfb637bcda330097a5c.reference || (__cxx_static_address_b06cebfb637bcda330097a5c.reference = {
    __cReference: true,
    get value() { return BROKEFIREHYDRENT____header_global_f1556bebfdf99d4c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:419
export const BOX____header_global_35784c13c1246afb = ((u32(((u32(951) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_19ef5c611be845c6688ed7e2() {
  return __cxx_static_address_19ef5c611be845c6688ed7e2.reference || (__cxx_static_address_19ef5c611be845c6688ed7e2.reference = {
    __cReference: true,
    get value() { return BOX____header_global_35784c13c1246afb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:420
export const BULLETHOLE____header_global_86d4fb1b5ef31ac4 = ((u32(((u32(952) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9331f37f11462ad7b956492c() {
  return __cxx_static_address_9331f37f11462ad7b956492c.reference || (__cxx_static_address_9331f37f11462ad7b956492c.reference = {
    __cReference: true,
    get value() { return BULLETHOLE____header_global_86d4fb1b5ef31ac4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:421
export const BOTTLE1____header_global_36190ad31c965d64 = ((u32(((u32(954) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a6923230bb1b2e80cfaabad0() {
  return __cxx_static_address_a6923230bb1b2e80cfaabad0.reference || (__cxx_static_address_a6923230bb1b2e80cfaabad0.reference = {
    __cReference: true,
    get value() { return BOTTLE1____header_global_36190ad31c965d64; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:422
export const BOTTLE2____header_global_69b14714bcb7399c = ((u32(((u32(955) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_375e694ff3f0f64338a0fc4c() {
  return __cxx_static_address_375e694ff3f0f64338a0fc4c.reference || (__cxx_static_address_375e694ff3f0f64338a0fc4c.reference = {
    __cReference: true,
    get value() { return BOTTLE2____header_global_69b14714bcb7399c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:423
export const BOTTLE3____header_global_33c3ab1a3c156fb6 = ((u32(((u32(956) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3f8ffefb1d7d99d8092ba50b() {
  return __cxx_static_address_3f8ffefb1d7d99d8092ba50b.reference || (__cxx_static_address_3f8ffefb1d7d99d8092ba50b.reference = {
    __cReference: true,
    get value() { return BOTTLE3____header_global_33c3ab1a3c156fb6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:424
export const BOTTLE4____header_global_7d8a064339123eba = ((u32(((u32(957) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7d00867e8df8e85af00fd3a3() {
  return __cxx_static_address_7d00867e8df8e85af00fd3a3.reference || (__cxx_static_address_7d00867e8df8e85af00fd3a3.reference = {
    __cReference: true,
    get value() { return BOTTLE4____header_global_7d8a064339123eba; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:425
export const FEMPIC5____header_global_3b40e2d3e9d0f3ad = ((u32(((u32(963) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6ba7ca9a99e2822d5345f161() {
  return __cxx_static_address_6ba7ca9a99e2822d5345f161.reference || (__cxx_static_address_6ba7ca9a99e2822d5345f161.reference = {
    __cReference: true,
    get value() { return FEMPIC5____header_global_3b40e2d3e9d0f3ad; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:426
export const FEMPIC6____header_global_ebd9f275eb6eba67 = ((u32(((u32(964) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5bf074aff51f28d40b880bc2() {
  return __cxx_static_address_5bf074aff51f28d40b880bc2.reference || (__cxx_static_address_5bf074aff51f28d40b880bc2.reference = {
    __cReference: true,
    get value() { return FEMPIC6____header_global_ebd9f275eb6eba67; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:427
export const FEMPIC7____header_global_c2ebc91667521fdf = ((u32(((u32(965) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d877955ffdd46cd40c43a9a5() {
  return __cxx_static_address_d877955ffdd46cd40c43a9a5.reference || (__cxx_static_address_d877955ffdd46cd40c43a9a5.reference = {
    __cReference: true,
    get value() { return FEMPIC7____header_global_c2ebc91667521fdf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:428
export const HYDROPLANT____header_global_9905453245484705 = ((u32(((u32(969) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ec71c7cf66179bd1d14b4f8f() {
  return __cxx_static_address_ec71c7cf66179bd1d14b4f8f.reference || (__cxx_static_address_ec71c7cf66179bd1d14b4f8f.reference = {
    __cReference: true,
    get value() { return HYDROPLANT____header_global_9905453245484705; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:429
export const OCEANSPRITE1____header_global_1f003fa38cb7cced = ((u32(((u32(971) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e212d71543d0654232f2d850() {
  return __cxx_static_address_e212d71543d0654232f2d850.reference || (__cxx_static_address_e212d71543d0654232f2d850.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE1____header_global_1f003fa38cb7cced; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:430
export const OCEANSPRITE2____header_global_b71dbe56e02f65a2 = ((u32(((u32(972) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_74f569cd2844d316dc322887() {
  return __cxx_static_address_74f569cd2844d316dc322887.reference || (__cxx_static_address_74f569cd2844d316dc322887.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE2____header_global_b71dbe56e02f65a2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:431
export const OCEANSPRITE3____header_global_5bba17d1828d5eab = ((u32(((u32(973) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f8b6f52779e73219d675fb4b() {
  return __cxx_static_address_f8b6f52779e73219d675fb4b.reference || (__cxx_static_address_f8b6f52779e73219d675fb4b.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE3____header_global_5bba17d1828d5eab; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:432
export const OCEANSPRITE4____header_global_65521be3ae139bac = ((u32(((u32(974) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1005853c014b78111fe3ad55() {
  return __cxx_static_address_1005853c014b78111fe3ad55.reference || (__cxx_static_address_1005853c014b78111fe3ad55.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE4____header_global_65521be3ae139bac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:433
export const OCEANSPRITE5____header_global_323b81dd22c38389 = ((u32(((u32(975) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_031ddcb2deac0203da8c6ea8() {
  return __cxx_static_address_031ddcb2deac0203da8c6ea8.reference || (__cxx_static_address_031ddcb2deac0203da8c6ea8.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE5____header_global_323b81dd22c38389; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:434
export const GENERICPOLE____header_global_731d07e8526878f7 = ((u32(((u32(977) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7382cbcf6c80be5040681e5d() {
  return __cxx_static_address_7382cbcf6c80be5040681e5d.reference || (__cxx_static_address_7382cbcf6c80be5040681e5d.reference = {
    __cReference: true,
    get value() { return GENERICPOLE____header_global_731d07e8526878f7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:435
export const CONE____header_global_4902352f9cc152dc = ((u32(((u32(978) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bfd4ccbd496979198fc38ba8() {
  return __cxx_static_address_bfd4ccbd496979198fc38ba8.reference || (__cxx_static_address_bfd4ccbd496979198fc38ba8.reference = {
    __cReference: true,
    get value() { return CONE____header_global_4902352f9cc152dc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:436
export const HANGLIGHT____header_global_aa1735080f6b0bec = ((u32(((u32(979) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1878e8cc9d31de1796fa1131() {
  return __cxx_static_address_1878e8cc9d31de1796fa1131.reference || (__cxx_static_address_1878e8cc9d31de1796fa1131.reference = {
    __cReference: true,
    get value() { return HANGLIGHT____header_global_aa1735080f6b0bec; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:437
export const HYDRENT____header_global_24a52420cf978160 = ((u32(((u32(981) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_03fd9d8575e943a061d356fb() {
  return __cxx_static_address_03fd9d8575e943a061d356fb.reference || (__cxx_static_address_03fd9d8575e943a061d356fb.reference = {
    __cReference: true,
    get value() { return HYDRENT____header_global_24a52420cf978160; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:438
export const MASKWALL14____header_global_a94d7157f518c24f = ((u32(((u32(988) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5a06a0f470fa6684d6cd553c() {
  return __cxx_static_address_5a06a0f470fa6684d6cd553c.reference || (__cxx_static_address_5a06a0f470fa6684d6cd553c.reference = {
    __cReference: true,
    get value() { return MASKWALL14____header_global_a94d7157f518c24f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:439
export const TIRE____header_global_3b7cd285f1609078 = ((u32(((u32(990) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8a269ddafa33beda8227d753() {
  return __cxx_static_address_8a269ddafa33beda8227d753.reference || (__cxx_static_address_8a269ddafa33beda8227d753.reference = {
    __cReference: true,
    get value() { return TIRE____header_global_3b7cd285f1609078; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:440
export const PIPE5____header_global_3e269ad988f6f67b = ((u32(((u32(994) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_06bcfe8857d087fabcdd6fa1() {
  return __cxx_static_address_06bcfe8857d087fabcdd6fa1.reference || (__cxx_static_address_06bcfe8857d087fabcdd6fa1.reference = {
    __cReference: true,
    get value() { return PIPE5____header_global_3e269ad988f6f67b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:441
export const PIPE6____header_global_596f177099d27d64 = ((u32(((u32(995) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a01e940fff9a54f5484b41cc() {
  return __cxx_static_address_a01e940fff9a54f5484b41cc.reference || (__cxx_static_address_a01e940fff9a54f5484b41cc.reference = {
    __cReference: true,
    get value() { return PIPE6____header_global_596f177099d27d64; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:442
export const PIPE4____header_global_28a4b25ea3e23434 = ((u32(((u32(996) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ee69d9e0e53720569acb5ea0() {
  return __cxx_static_address_ee69d9e0e53720569acb5ea0.reference || (__cxx_static_address_ee69d9e0e53720569acb5ea0.reference = {
    __cReference: true,
    get value() { return PIPE4____header_global_28a4b25ea3e23434; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:443
export const PIPE4B____header_global_3c3cd7dac3a0bf31 = ((u32(((u32(997) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_24dd744a65cad2019c3e6cba() {
  return __cxx_static_address_24dd744a65cad2019c3e6cba.reference || (__cxx_static_address_24dd744a65cad2019c3e6cba.reference = {
    __cReference: true,
    get value() { return PIPE4B____header_global_3c3cd7dac3a0bf31; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:444
export const BROKEHYDROPLANT____header_global_115e35485c978f9f = ((u32(((u32(1003) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cc5d6b83e578c373733b59b0() {
  return __cxx_static_address_cc5d6b83e578c373733b59b0.reference || (__cxx_static_address_cc5d6b83e578c373733b59b0.reference = {
    __cReference: true,
    get value() { return BROKEHYDROPLANT____header_global_115e35485c978f9f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:445
export const PIPE5B____header_global_5c5a318d9a5aabab = ((u32(((u32(1005) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_67da8388b82bf966c0f57326() {
  return __cxx_static_address_67da8388b82bf966c0f57326.reference || (__cxx_static_address_67da8388b82bf966c0f57326.reference = {
    __cReference: true,
    get value() { return PIPE5B____header_global_5c5a318d9a5aabab; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:446
export const NEON3____header_global_260d5ea94abc8ce4 = ((u32(((u32(1007) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_decfe16a9fe6d2b048d64eb4() {
  return __cxx_static_address_decfe16a9fe6d2b048d64eb4.reference || (__cxx_static_address_decfe16a9fe6d2b048d64eb4.reference = {
    __cReference: true,
    get value() { return NEON3____header_global_260d5ea94abc8ce4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:447
export const NEON4____header_global_2fb461107d1e08ef = ((u32(((u32(1008) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_27a16fb769a98fcec411d53c() {
  return __cxx_static_address_27a16fb769a98fcec411d53c.reference || (__cxx_static_address_27a16fb769a98fcec411d53c.reference = {
    __cReference: true,
    get value() { return NEON4____header_global_2fb461107d1e08ef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:448
export const NEON5____header_global_b9e60a352124c20d = ((u32(((u32(1009) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f43f37ff37a93f03b6d933dc() {
  return __cxx_static_address_f43f37ff37a93f03b6d933dc.reference || (__cxx_static_address_f43f37ff37a93f03b6d933dc.reference = {
    __cReference: true,
    get value() { return NEON5____header_global_b9e60a352124c20d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:449
export const BOTTLE5____header_global_ef43722f7fdce8e4 = ((u32(((u32(1012) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bdeef105b88b40c809b54390() {
  return __cxx_static_address_bdeef105b88b40c809b54390.reference || (__cxx_static_address_bdeef105b88b40c809b54390.reference = {
    __cReference: true,
    get value() { return BOTTLE5____header_global_ef43722f7fdce8e4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:450
export const BOTTLE6____header_global_f17567536224399a = ((u32(((u32(1013) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ae29971e137650f1d3ba5727() {
  return __cxx_static_address_ae29971e137650f1d3ba5727.reference || (__cxx_static_address_ae29971e137650f1d3ba5727.reference = {
    __cReference: true,
    get value() { return BOTTLE6____header_global_f17567536224399a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:451
export const BOTTLE8____header_global_c9704032d84cc238 = ((u32(((u32(1014) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_70dc139ff8724e95b015c0fa() {
  return __cxx_static_address_70dc139ff8724e95b015c0fa.reference || (__cxx_static_address_70dc139ff8724e95b015c0fa.reference = {
    __cReference: true,
    get value() { return BOTTLE8____header_global_c9704032d84cc238; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:452
export const SPOTLITE____header_global_c8b6310adde24748 = ((u32(((u32(1020) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_94354ee7a27068adc92d176c() {
  return __cxx_static_address_94354ee7a27068adc92d176c.reference || (__cxx_static_address_94354ee7a27068adc92d176c.reference = {
    __cReference: true,
    get value() { return SPOTLITE____header_global_c8b6310adde24748; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:453
export const MASKWALL15____header_global_7fd1e0ad78ad6083 = ((u32(((u32(1024) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b2a4ca2c567a5fb139f51859() {
  return __cxx_static_address_b2a4ca2c567a5fb139f51859.reference || (__cxx_static_address_b2a4ca2c567a5fb139f51859.reference = {
    __cReference: true,
    get value() { return MASKWALL15____header_global_7fd1e0ad78ad6083; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:454
export const BOTTLE7____header_global_cfa12f90cc390798 = ((u32(((u32(1025) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_971dcb18a6d9208a1d2e816f() {
  return __cxx_static_address_971dcb18a6d9208a1d2e816f.reference || (__cxx_static_address_971dcb18a6d9208a1d2e816f.reference = {
    __cReference: true,
    get value() { return BOTTLE7____header_global_cfa12f90cc390798; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:455
export const HORSEONSIDE____header_global_de7c0c23fc48e4a5 = ((u32(((u32(1026) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5c0dc834d42b8755adc9fbf7() {
  return __cxx_static_address_5c0dc834d42b8755adc9fbf7.reference || (__cxx_static_address_5c0dc834d42b8755adc9fbf7.reference = {
    __cReference: true,
    get value() { return HORSEONSIDE____header_global_de7c0c23fc48e4a5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:456
export const GLASSPIECES____header_global_5dbf8afecc6b849b = ((u32(((u32(1031) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3d9d161f2a60f84243654ed6() {
  return __cxx_static_address_3d9d161f2a60f84243654ed6.reference || (__cxx_static_address_3d9d161f2a60f84243654ed6.reference = {
    __cReference: true,
    get value() { return GLASSPIECES____header_global_5dbf8afecc6b849b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:457
export const NEON6____header_global_8eee35fe98f456b7 = ((u32(((u32(1046) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a98819e084f9de6e86e1acad() {
  return __cxx_static_address_a98819e084f9de6e86e1acad.reference || (__cxx_static_address_a98819e084f9de6e86e1acad.reference = {
    __cReference: true,
    get value() { return NEON6____header_global_8eee35fe98f456b7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:458
export const MASKWALL6____header_global_293cfcbb34ef5243 = ((u32(((u32(1059) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f1bbf4cc9b08f7271f5d5dd0() {
  return __cxx_static_address_f1bbf4cc9b08f7271f5d5dd0.reference || (__cxx_static_address_f1bbf4cc9b08f7271f5d5dd0.reference = {
    __cReference: true,
    get value() { return MASKWALL6____header_global_293cfcbb34ef5243; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:459
export const RUBBERCAN____header_global_8891c26a6508bf38 = ((u32(((u32(1062) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4252ab151d10ce47708931ea() {
  return __cxx_static_address_4252ab151d10ce47708931ea.reference || (__cxx_static_address_4252ab151d10ce47708931ea.reference = {
    __cReference: true,
    get value() { return RUBBERCAN____header_global_8891c26a6508bf38; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:460
export const PLUG____header_global_159c24f2f3d6595c = ((u32(((u32(1069) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b1cf2f9ce4d0be5825eda2c6() {
  return __cxx_static_address_b1cf2f9ce4d0be5825eda2c6.reference || (__cxx_static_address_b1cf2f9ce4d0be5825eda2c6.reference = {
    __cReference: true,
    get value() { return PLUG____header_global_159c24f2f3d6595c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:461
export const OOZFILTER____header_global_0ccf996e1f2daf13 = ((u32(((u32(1079) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d8ef7f4ea1336911bdd2d4ec() {
  return __cxx_static_address_d8ef7f4ea1336911bdd2d4ec.reference || (__cxx_static_address_d8ef7f4ea1336911bdd2d4ec.reference = {
    __cReference: true,
    get value() { return OOZFILTER____header_global_0ccf996e1f2daf13; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:462
export const FLOORPLASMA____header_global_e96f7baa42601b2a = ((u32(((u32(1082) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_81731bab452ce1c899f106cc() {
  return __cxx_static_address_81731bab452ce1c899f106cc.reference || (__cxx_static_address_81731bab452ce1c899f106cc.reference = {
    __cReference: true,
    get value() { return FLOORPLASMA____header_global_e96f7baa42601b2a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:463
export const REACTOR____header_global_a1a28bcf3275c0c6 = ((u32(((u32(1088) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_33f7d01ed729c834349f603d() {
  return __cxx_static_address_33f7d01ed729c834349f603d.reference || (__cxx_static_address_33f7d01ed729c834349f603d.reference = {
    __cReference: true,
    get value() { return REACTOR____header_global_a1a28bcf3275c0c6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:464
export const REACTORSPARK____header_global_62d4e13d2c80925d = ((u32(((u32(1092) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f1ddbe4d5115cfedd09b21c2() {
  return __cxx_static_address_f1ddbe4d5115cfedd09b21c2.reference || (__cxx_static_address_f1ddbe4d5115cfedd09b21c2.reference = {
    __cReference: true,
    get value() { return REACTORSPARK____header_global_62d4e13d2c80925d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:465
export const REACTORBURNT____header_global_54cd19258069b411 = ((u32(((u32(1096) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0403a11e9a4c3afa298b0b32() {
  return __cxx_static_address_0403a11e9a4c3afa298b0b32.reference || (__cxx_static_address_0403a11e9a4c3afa298b0b32.reference = {
    __cReference: true,
    get value() { return REACTORBURNT____header_global_54cd19258069b411; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:466
export const DOORTILE15____header_global_8771f750252eae61 = ((u32(((u32(1102) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aafa738554667ce5d3296aa7() {
  return __cxx_static_address_aafa738554667ce5d3296aa7.reference || (__cxx_static_address_aafa738554667ce5d3296aa7.reference = {
    __cReference: true,
    get value() { return DOORTILE15____header_global_8771f750252eae61; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:467
export const HANDSWITCH____header_global_ff20c3ad492053fc = ((u32(((u32(1111) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_180df10430853706c4f0d24e() {
  return __cxx_static_address_180df10430853706c4f0d24e.reference || (__cxx_static_address_180df10430853706c4f0d24e.reference = {
    __cReference: true,
    get value() { return HANDSWITCH____header_global_ff20c3ad492053fc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:468
export const CIRCLEPANNEL____header_global_1c8b2bebd4b9b52e = ((u32(((u32(1113) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c1e65aa83c3fd8414bb22d20() {
  return __cxx_static_address_c1e65aa83c3fd8414bb22d20.reference || (__cxx_static_address_c1e65aa83c3fd8414bb22d20.reference = {
    __cReference: true,
    get value() { return CIRCLEPANNEL____header_global_1c8b2bebd4b9b52e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:469
export const CIRCLEPANNELBROKE____header_global_9677a04ae804f6dc = ((u32(((u32(1114) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5d9ef5fa7085dd26afdcbe5f() {
  return __cxx_static_address_5d9ef5fa7085dd26afdcbe5f.reference || (__cxx_static_address_5d9ef5fa7085dd26afdcbe5f.reference = {
    __cReference: true,
    get value() { return CIRCLEPANNELBROKE____header_global_9677a04ae804f6dc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:470
export const PULLSWITCH____header_global_99d95f9310dd67f1 = ((u32(((u32(1122) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c995418ef4ed5a9c19886eb8() {
  return __cxx_static_address_c995418ef4ed5a9c19886eb8.reference || (__cxx_static_address_c995418ef4ed5a9c19886eb8.reference = {
    __cReference: true,
    get value() { return PULLSWITCH____header_global_99d95f9310dd67f1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:471
export const MASKWALL8____header_global_4eb7fa06118e3a64 = ((u32(((u32(1124) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e02e823f80bfd3267f42b7fd() {
  return __cxx_static_address_e02e823f80bfd3267f42b7fd.reference || (__cxx_static_address_e02e823f80bfd3267f42b7fd.reference = {
    __cReference: true,
    get value() { return MASKWALL8____header_global_4eb7fa06118e3a64; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:472
export const BIGHOLE____header_global_29912c3612d038aa = ((u32(((u32(1141) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_435620f1095dd0f639bfa2dd() {
  return __cxx_static_address_435620f1095dd0f639bfa2dd.reference || (__cxx_static_address_435620f1095dd0f639bfa2dd.reference = {
    __cReference: true,
    get value() { return BIGHOLE____header_global_29912c3612d038aa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:473
export const ALIENSWITCH____header_global_505565e8e33a1a6b = ((u32(((u32(1142) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0ed3c34dc986f309209d8643() {
  return __cxx_static_address_0ed3c34dc986f309209d8643.reference || (__cxx_static_address_0ed3c34dc986f309209d8643.reference = {
    __cReference: true,
    get value() { return ALIENSWITCH____header_global_505565e8e33a1a6b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:474
export const DOORTILE21____header_global_8e7da44306025d09 = ((u32(((u32(1144) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3682db456df3d1173f151978() {
  return __cxx_static_address_3682db456df3d1173f151978.reference || (__cxx_static_address_3682db456df3d1173f151978.reference = {
    __cReference: true,
    get value() { return DOORTILE21____header_global_8e7da44306025d09; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:475
export const HANDPRINTSWITCH____header_global_318208d937610000 = ((u32(((u32(1155) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_39e44185e8c1d3ce93d2bc40() {
  return __cxx_static_address_39e44185e8c1d3ce93d2bc40.reference || (__cxx_static_address_39e44185e8c1d3ce93d2bc40.reference = {
    __cReference: true,
    get value() { return HANDPRINTSWITCH____header_global_318208d937610000; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:476
export const BOTTLE10____header_global_b8beccf5bb334ea7 = ((u32(((u32(1157) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2e5bc10dee4360c69e696b9a() {
  return __cxx_static_address_2e5bc10dee4360c69e696b9a.reference || (__cxx_static_address_2e5bc10dee4360c69e696b9a.reference = {
    __cReference: true,
    get value() { return BOTTLE10____header_global_b8beccf5bb334ea7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:477
export const BOTTLE11____header_global_f12fcc4d55c24e46 = ((u32(((u32(1158) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4fd23321e16ce14f8172aba7() {
  return __cxx_static_address_4fd23321e16ce14f8172aba7.reference || (__cxx_static_address_4fd23321e16ce14f8172aba7.reference = {
    __cReference: true,
    get value() { return BOTTLE11____header_global_f12fcc4d55c24e46; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:478
export const BOTTLE12____header_global_cd496831b2e5a8d6 = ((u32(((u32(1159) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8fb5c22f49090e72ce5f59f5() {
  return __cxx_static_address_8fb5c22f49090e72ce5f59f5.reference || (__cxx_static_address_8fb5c22f49090e72ce5f59f5.reference = {
    __cReference: true,
    get value() { return BOTTLE12____header_global_cd496831b2e5a8d6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:479
export const BOTTLE13____header_global_ca26e67454fed654 = ((u32(((u32(1160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_daecb985c47de7cbe134b4d3() {
  return __cxx_static_address_daecb985c47de7cbe134b4d3.reference || (__cxx_static_address_daecb985c47de7cbe134b4d3.reference = {
    __cReference: true,
    get value() { return BOTTLE13____header_global_ca26e67454fed654; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:480
export const BOTTLE14____header_global_1bed6cdb7ddac9b8 = ((u32(((u32(1161) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c6a568b0678b3d1276ae5b43() {
  return __cxx_static_address_c6a568b0678b3d1276ae5b43.reference || (__cxx_static_address_c6a568b0678b3d1276ae5b43.reference = {
    __cReference: true,
    get value() { return BOTTLE14____header_global_1bed6cdb7ddac9b8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:481
export const BOTTLE15____header_global_cfe33c233b21dc4f = ((u32(((u32(1162) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d45d9c2b83a775a419399413() {
  return __cxx_static_address_d45d9c2b83a775a419399413.reference || (__cxx_static_address_d45d9c2b83a775a419399413.reference = {
    __cReference: true,
    get value() { return BOTTLE15____header_global_cfe33c233b21dc4f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:482
export const BOTTLE16____header_global_c2cb10066b191971 = ((u32(((u32(1163) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1794f8e2d206624960ce12fb() {
  return __cxx_static_address_1794f8e2d206624960ce12fb.reference || (__cxx_static_address_1794f8e2d206624960ce12fb.reference = {
    __cReference: true,
    get value() { return BOTTLE16____header_global_c2cb10066b191971; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:483
export const BOTTLE17____header_global_f8417acae610729c = ((u32(((u32(1164) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_af03021c8b18145b81a53a0f() {
  return __cxx_static_address_af03021c8b18145b81a53a0f.reference || (__cxx_static_address_af03021c8b18145b81a53a0f.reference = {
    __cReference: true,
    get value() { return BOTTLE17____header_global_f8417acae610729c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:484
export const BOTTLE18____header_global_221a8b89f5140f09 = ((u32(((u32(1165) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4e2e659dbc32de04d8f04536() {
  return __cxx_static_address_4e2e659dbc32de04d8f04536.reference || (__cxx_static_address_4e2e659dbc32de04d8f04536.reference = {
    __cReference: true,
    get value() { return BOTTLE18____header_global_221a8b89f5140f09; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:485
export const BOTTLE19____header_global_2f01635aaeb95f7c = ((u32(((u32(1166) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_544a5c0e4ae6b29ae5e7635b() {
  return __cxx_static_address_544a5c0e4ae6b29ae5e7635b.reference || (__cxx_static_address_544a5c0e4ae6b29ae5e7635b.reference = {
    __cReference: true,
    get value() { return BOTTLE19____header_global_2f01635aaeb95f7c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:486
export const DOORTILE17____header_global_1ec995ae897e1243 = ((u32(((u32(1169) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_264e70c4f86a18a9eb219a10() {
  return __cxx_static_address_264e70c4f86a18a9eb219a10.reference || (__cxx_static_address_264e70c4f86a18a9eb219a10.reference = {
    __cReference: true,
    get value() { return DOORTILE17____header_global_1ec995ae897e1243; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:487
export const MASKWALL7____header_global_afd3ffdce152b5ca = ((u32(((u32(1174) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_324a8954e89a2e4abac0e0c8() {
  return __cxx_static_address_324a8954e89a2e4abac0e0c8.reference || (__cxx_static_address_324a8954e89a2e4abac0e0c8.reference = {
    __cReference: true,
    get value() { return MASKWALL7____header_global_afd3ffdce152b5ca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:488
export const DOORTILE11____header_global_c9871402f0cd2b93 = ((u32(((u32(1178) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_efb4f0e705bc58e8f2534651() {
  return __cxx_static_address_efb4f0e705bc58e8f2534651.reference || (__cxx_static_address_efb4f0e705bc58e8f2534651.reference = {
    __cReference: true,
    get value() { return DOORTILE11____header_global_c9871402f0cd2b93; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:489
export const DOORTILE12____header_global_018c0a4fccc45b3d = ((u32(((u32(1179) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_866bb0cd13c4bf06025af32a() {
  return __cxx_static_address_866bb0cd13c4bf06025af32a.reference || (__cxx_static_address_866bb0cd13c4bf06025af32a.reference = {
    __cReference: true,
    get value() { return DOORTILE12____header_global_018c0a4fccc45b3d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:490
export const VENDMACHINE____header_global_d42ad2b314823972 = ((u32(((u32(1212) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f2a855927e54565167bd5c7b() {
  return __cxx_static_address_f2a855927e54565167bd5c7b.reference || (__cxx_static_address_f2a855927e54565167bd5c7b.reference = {
    __cReference: true,
    get value() { return VENDMACHINE____header_global_d42ad2b314823972; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:491
export const COLAMACHINE____header_global_98df83dff28f0041 = ((u32(((u32(1215) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_51a222f519aad360c72fde6c() {
  return __cxx_static_address_51a222f519aad360c72fde6c.reference || (__cxx_static_address_51a222f519aad360c72fde6c.reference = {
    __cReference: true,
    get value() { return COLAMACHINE____header_global_98df83dff28f0041; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:492
export const CRANEPOLE____header_global_d6da45202215b319 = ((u32(((u32(1221) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ae82243cfafc8f8cea649c82() {
  return __cxx_static_address_ae82243cfafc8f8cea649c82.reference || (__cxx_static_address_ae82243cfafc8f8cea649c82.reference = {
    __cReference: true,
    get value() { return CRANEPOLE____header_global_d6da45202215b319; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:493
export const CRANE____header_global_2783b20f0febb6f6 = ((u32(((u32(1222) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_79786d1bdc3ac020ec91bba3() {
  return __cxx_static_address_79786d1bdc3ac020ec91bba3.reference || (__cxx_static_address_79786d1bdc3ac020ec91bba3.reference = {
    __cReference: true,
    get value() { return CRANE____header_global_2783b20f0febb6f6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:494
export const BARBROKE____header_global_624c09cbd3ed5836 = ((u32(((u32(1225) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_53de274ac15d5914096e5831() {
  return __cxx_static_address_53de274ac15d5914096e5831.reference || (__cxx_static_address_53de274ac15d5914096e5831.reference = {
    __cReference: true,
    get value() { return BARBROKE____header_global_624c09cbd3ed5836; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:495
export const BLOODPOOL____header_global_2d1b4be4d39b407a = ((u32(((u32(1226) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4bc9b3e799665a9cb34f3a84() {
  return __cxx_static_address_4bc9b3e799665a9cb34f3a84.reference || (__cxx_static_address_4bc9b3e799665a9cb34f3a84.reference = {
    __cReference: true,
    get value() { return BLOODPOOL____header_global_2d1b4be4d39b407a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:496
export const NUKEBARREL____header_global_8df19f1766d4bab5 = ((u32(((u32(1227) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cfee1f96f2f3a0fc9fda3061() {
  return __cxx_static_address_cfee1f96f2f3a0fc9fda3061.reference || (__cxx_static_address_cfee1f96f2f3a0fc9fda3061.reference = {
    __cReference: true,
    get value() { return NUKEBARREL____header_global_8df19f1766d4bab5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:497
export const NUKEBARRELDENTED____header_global_4a7b04e86a87f326 = ((u32(((u32(1228) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5a29bbf39a006d7ff36ef64d() {
  return __cxx_static_address_5a29bbf39a006d7ff36ef64d.reference || (__cxx_static_address_5a29bbf39a006d7ff36ef64d.reference = {
    __cReference: true,
    get value() { return NUKEBARRELDENTED____header_global_4a7b04e86a87f326; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:498
export const NUKEBARRELLEAKED____header_global_cbf72d92a70f1b81 = ((u32(((u32(1229) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b8686d1057b356b93dc7673c() {
  return __cxx_static_address_b8686d1057b356b93dc7673c.reference || (__cxx_static_address_b8686d1057b356b93dc7673c.reference = {
    __cReference: true,
    get value() { return NUKEBARRELLEAKED____header_global_cbf72d92a70f1b81; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:499
export const CANWITHSOMETHING____header_global_7c369d8655751156 = ((u32(((u32(1232) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7d45b89a8cb40d227a243fee() {
  return __cxx_static_address_7d45b89a8cb40d227a243fee.reference || (__cxx_static_address_7d45b89a8cb40d227a243fee.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING____header_global_7c369d8655751156; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:500
export const MONEY____header_global_4c6c29960259db30 = ((u32(((u32(1233) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4ae60470ac15fcd5050c6d98() {
  return __cxx_static_address_4ae60470ac15fcd5050c6d98.reference || (__cxx_static_address_4ae60470ac15fcd5050c6d98.reference = {
    __cReference: true,
    get value() { return MONEY____header_global_4c6c29960259db30; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:501
export const BANNER____header_global_eabb909a5ae7ae3f = ((u32(((u32(1236) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ef46337cb9660657167f0020() {
  return __cxx_static_address_ef46337cb9660657167f0020.reference || (__cxx_static_address_ef46337cb9660657167f0020.reference = {
    __cReference: true,
    get value() { return BANNER____header_global_eabb909a5ae7ae3f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:502
export const EXPLODINGBARREL____header_global_77b28265de55a504 = ((u32(((u32(1238) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_40f9f74da1df5435284336b1() {
  return __cxx_static_address_40f9f74da1df5435284336b1.reference || (__cxx_static_address_40f9f74da1df5435284336b1.reference = {
    __cReference: true,
    get value() { return EXPLODINGBARREL____header_global_77b28265de55a504; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:503
export const EXPLODINGBARREL2____header_global_a0c14d0e9816754e = ((u32(((u32(1239) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9d67eb113af29e4eaa590006() {
  return __cxx_static_address_9d67eb113af29e4eaa590006.reference || (__cxx_static_address_9d67eb113af29e4eaa590006.reference = {
    __cReference: true,
    get value() { return EXPLODINGBARREL2____header_global_a0c14d0e9816754e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:504
export const FIREBARREL____header_global_693c9569fd520302 = ((u32(((u32(1240) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ada0fd80db802930dfa61991() {
  return __cxx_static_address_ada0fd80db802930dfa61991.reference || (__cxx_static_address_ada0fd80db802930dfa61991.reference = {
    __cReference: true,
    get value() { return FIREBARREL____header_global_693c9569fd520302; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:505
export const SEENINE____header_global_8b6c45ec9b9a1504 = ((u32(((u32(1247) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_66faa27d01a98165f7047c52() {
  return __cxx_static_address_66faa27d01a98165f7047c52.reference || (__cxx_static_address_66faa27d01a98165f7047c52.reference = {
    __cReference: true,
    get value() { return SEENINE____header_global_8b6c45ec9b9a1504; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:506
export const SEENINEDEAD____header_global_9c9773b0924d7c17 = ((u32(((u32(1248) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_17a641f4bd3ea199df8ea442() {
  return __cxx_static_address_17a641f4bd3ea199df8ea442.reference || (__cxx_static_address_17a641f4bd3ea199df8ea442.reference = {
    __cReference: true,
    get value() { return SEENINEDEAD____header_global_9c9773b0924d7c17; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:507
export const STEAM____header_global_252752bde19c776f = ((u32(((u32(1250) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_243fcbba99c9ad06053f7b42() {
  return __cxx_static_address_243fcbba99c9ad06053f7b42.reference || (__cxx_static_address_243fcbba99c9ad06053f7b42.reference = {
    __cReference: true,
    get value() { return STEAM____header_global_252752bde19c776f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:508
export const CEILINGSTEAM____header_global_d1c83f7ca65c77c3 = ((u32(((u32(1255) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9b1659adfe1b441c5aec6b6b() {
  return __cxx_static_address_9b1659adfe1b441c5aec6b6b.reference || (__cxx_static_address_9b1659adfe1b441c5aec6b6b.reference = {
    __cReference: true,
    get value() { return CEILINGSTEAM____header_global_d1c83f7ca65c77c3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:509
export const PIPE6B____header_global_9cd0f33b9925c774 = ((u32(((u32(1260) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c672b02e592ef49c37f0823c() {
  return __cxx_static_address_c672b02e592ef49c37f0823c.reference || (__cxx_static_address_c672b02e592ef49c37f0823c.reference = {
    __cReference: true,
    get value() { return PIPE6B____header_global_9cd0f33b9925c774; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:510
export const TRANSPORTERBEAM____header_global_1aac877cf0b4ad96 = ((u32(((u32(1261) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3bfdb08b871bc2f75e7f2798() {
  return __cxx_static_address_3bfdb08b871bc2f75e7f2798.reference || (__cxx_static_address_3bfdb08b871bc2f75e7f2798.reference = {
    __cReference: true,
    get value() { return TRANSPORTERBEAM____header_global_1aac877cf0b4ad96; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:511
export const RAT____header_global_1cfa3f67f808e150 = ((u32(((u32(1267) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_445f37946c290409134a14f4() {
  return __cxx_static_address_445f37946c290409134a14f4.reference || (__cxx_static_address_445f37946c290409134a14f4.reference = {
    __cReference: true,
    get value() { return RAT____header_global_1cfa3f67f808e150; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:512
export const TRASH____header_global_aad126f783fc359e = ((u32(((u32(1272) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b94f046aab9964f20b53312b() {
  return __cxx_static_address_b94f046aab9964f20b53312b.reference || (__cxx_static_address_b94f046aab9964f20b53312b.reference = {
    __cReference: true,
    get value() { return TRASH____header_global_aad126f783fc359e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:513
export const FEMPIC1____header_global_e38280387b9a440a = ((u32(((u32(1280) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f003ffb90385c40738ad9af9() {
  return __cxx_static_address_f003ffb90385c40738ad9af9.reference || (__cxx_static_address_f003ffb90385c40738ad9af9.reference = {
    __cReference: true,
    get value() { return FEMPIC1____header_global_e38280387b9a440a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:514
export const FEMPIC2____header_global_8a18a94bd166ea88 = ((u32(((u32(1289) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a6e5b6288ed1855e6a79e0ce() {
  return __cxx_static_address_a6e5b6288ed1855e6a79e0ce.reference || (__cxx_static_address_a6e5b6288ed1855e6a79e0ce.reference = {
    __cReference: true,
    get value() { return FEMPIC2____header_global_8a18a94bd166ea88; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:515
export const BLANKSCREEN____header_global_30bf6f64c54ad2b2 = ((u32(((u32(1293) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_878190a71743345b27783198() {
  return __cxx_static_address_878190a71743345b27783198.reference || (__cxx_static_address_878190a71743345b27783198.reference = {
    __cReference: true,
    get value() { return BLANKSCREEN____header_global_30bf6f64c54ad2b2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:516
export const PODFEM1____header_global_0f9cf5e11e9716af = ((u32(((u32(1294) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ce168754a456fbf39e307dee() {
  return __cxx_static_address_ce168754a456fbf39e307dee.reference || (__cxx_static_address_ce168754a456fbf39e307dee.reference = {
    __cReference: true,
    get value() { return PODFEM1____header_global_0f9cf5e11e9716af; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:517
export const FEMPIC3____header_global_ef5424c80953f8cb = ((u32(((u32(1298) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6508b861f21a675e134dc1a6() {
  return __cxx_static_address_6508b861f21a675e134dc1a6.reference || (__cxx_static_address_6508b861f21a675e134dc1a6.reference = {
    __cReference: true,
    get value() { return FEMPIC3____header_global_ef5424c80953f8cb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:518
export const FEMPIC4____header_global_2a85d313d60fa58d = ((u32(((u32(1306) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ae54ff2a2951e0becdd73cb4() {
  return __cxx_static_address_ae54ff2a2951e0becdd73cb4.reference || (__cxx_static_address_ae54ff2a2951e0becdd73cb4.reference = {
    __cReference: true,
    get value() { return FEMPIC4____header_global_2a85d313d60fa58d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:519
export const FEM1____header_global_e50f64e1ad0e9871 = ((u32(((u32(1312) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_83041adcff7703bf2a06a5a1() {
  return __cxx_static_address_83041adcff7703bf2a06a5a1.reference || (__cxx_static_address_83041adcff7703bf2a06a5a1.reference = {
    __cReference: true,
    get value() { return FEM1____header_global_e50f64e1ad0e9871; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:520
export const FEM2____header_global_90be940b2bda2ae4 = ((u32(((u32(1317) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f39504c5f570df11874dec59() {
  return __cxx_static_address_f39504c5f570df11874dec59.reference || (__cxx_static_address_f39504c5f570df11874dec59.reference = {
    __cReference: true,
    get value() { return FEM2____header_global_90be940b2bda2ae4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:521
export const FEM3____header_global_7359b0124c86ae33 = ((u32(((u32(1321) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a6d79b8bce0cb92410ffb46d() {
  return __cxx_static_address_a6d79b8bce0cb92410ffb46d.reference || (__cxx_static_address_a6d79b8bce0cb92410ffb46d.reference = {
    __cReference: true,
    get value() { return FEM3____header_global_7359b0124c86ae33; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:522
export const FEM5____header_global_dcee6f57f55576a4 = ((u32(((u32(1323) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ee3f2aa9d88be7dbfd9554cb() {
  return __cxx_static_address_ee3f2aa9d88be7dbfd9554cb.reference || (__cxx_static_address_ee3f2aa9d88be7dbfd9554cb.reference = {
    __cReference: true,
    get value() { return FEM5____header_global_dcee6f57f55576a4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:523
export const BLOODYPOLE____header_global_e36a2b7d216671f8 = ((u32(((u32(1324) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b1e08dcb683a6817d51eedef() {
  return __cxx_static_address_b1e08dcb683a6817d51eedef.reference || (__cxx_static_address_b1e08dcb683a6817d51eedef.reference = {
    __cReference: true,
    get value() { return BLOODYPOLE____header_global_e36a2b7d216671f8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:524
export const FEM4____header_global_1327b66114e91812 = ((u32(((u32(1325) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f607d25ce80622fb9dda4356() {
  return __cxx_static_address_f607d25ce80622fb9dda4356.reference || (__cxx_static_address_f607d25ce80622fb9dda4356.reference = {
    __cReference: true,
    get value() { return FEM4____header_global_1327b66114e91812; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:525
export const FEM6____header_global_356efd44f5735f9e = ((u32(((u32(1334) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f7fd4e587f5311a19991adfe() {
  return __cxx_static_address_f7fd4e587f5311a19991adfe.reference || (__cxx_static_address_f7fd4e587f5311a19991adfe.reference = {
    __cReference: true,
    get value() { return FEM6____header_global_356efd44f5735f9e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:526
export const FEM6PAD____header_global_5eab40fc04321529 = ((u32(((u32(1335) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_04e010233eca1f36a5c8cacc() {
  return __cxx_static_address_04e010233eca1f36a5c8cacc.reference || (__cxx_static_address_04e010233eca1f36a5c8cacc.reference = {
    __cReference: true,
    get value() { return FEM6PAD____header_global_5eab40fc04321529; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:527
export const FEM8____header_global_42826ff667d5fdde = ((u32(((u32(1336) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_64e72d277b13824dc6a60bd9() {
  return __cxx_static_address_64e72d277b13824dc6a60bd9.reference || (__cxx_static_address_64e72d277b13824dc6a60bd9.reference = {
    __cReference: true,
    get value() { return FEM8____header_global_42826ff667d5fdde; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:528
export const HELECOPT____header_global_9ddacc4869b0f398 = ((u32(((u32(1346) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e90e729db8d45675f95c8eba() {
  return __cxx_static_address_e90e729db8d45675f95c8eba.reference || (__cxx_static_address_e90e729db8d45675f95c8eba.reference = {
    __cReference: true,
    get value() { return HELECOPT____header_global_9ddacc4869b0f398; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:529
export const FETUSJIB____header_global_25af250b44626ac9 = ((u32(((u32(1347) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_759c47acd68c06c2dedb2c93() {
  return __cxx_static_address_759c47acd68c06c2dedb2c93.reference || (__cxx_static_address_759c47acd68c06c2dedb2c93.reference = {
    __cReference: true,
    get value() { return FETUSJIB____header_global_25af250b44626ac9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:530
export const HOLODUKE____header_global_b122adfbfd32c998 = ((u32(((u32(1348) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6873e90c1f57e446e5c7daca() {
  return __cxx_static_address_6873e90c1f57e446e5c7daca.reference || (__cxx_static_address_6873e90c1f57e446e5c7daca.reference = {
    __cReference: true,
    get value() { return HOLODUKE____header_global_b122adfbfd32c998; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:531
export const SPACEMARINE____header_global_2d8974fcdc5aa829 = ((u32(((u32(1353) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_48fa0c6c4a0347dfb6bae497() {
  return __cxx_static_address_48fa0c6c4a0347dfb6bae497.reference || (__cxx_static_address_48fa0c6c4a0347dfb6bae497.reference = {
    __cReference: true,
    get value() { return SPACEMARINE____header_global_2d8974fcdc5aa829; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:532
export const INDY____header_global_5da100c1def9c35b = ((u32(((u32(1355) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_47901f4a66f62474ab17b778() {
  return __cxx_static_address_47901f4a66f62474ab17b778.reference || (__cxx_static_address_47901f4a66f62474ab17b778.reference = {
    __cReference: true,
    get value() { return INDY____header_global_5da100c1def9c35b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:533
export const FETUS____header_global_f5d04a290939c06c = ((u32(((u32(1358) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1d65599d405d2707eb8ab127() {
  return __cxx_static_address_1d65599d405d2707eb8ab127.reference || (__cxx_static_address_1d65599d405d2707eb8ab127.reference = {
    __cReference: true,
    get value() { return FETUS____header_global_f5d04a290939c06c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:534
export const FETUSBROKE____header_global_7c8a86cc03af2587 = ((u32(((u32(1359) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_51c8dfcb50bd0bd01f1c2c55() {
  return __cxx_static_address_51c8dfcb50bd0bd01f1c2c55.reference || (__cxx_static_address_51c8dfcb50bd0bd01f1c2c55.reference = {
    __cReference: true,
    get value() { return FETUSBROKE____header_global_7c8a86cc03af2587; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:535
export const MONK____header_global_1b0ba497cb7ffbfa = ((u32(((u32(1352) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0c0d98e0f661f776e7e3aa5f() {
  return __cxx_static_address_0c0d98e0f661f776e7e3aa5f.reference || (__cxx_static_address_0c0d98e0f661f776e7e3aa5f.reference = {
    __cReference: true,
    get value() { return MONK____header_global_1b0ba497cb7ffbfa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:536
export const LUKE____header_global_2c05aed7e5c676bd = ((u32(((u32(1354) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1c5e9269cbf8ab4a3f5fa5c0() {
  return __cxx_static_address_1c5e9269cbf8ab4a3f5fa5c0.reference || (__cxx_static_address_1c5e9269cbf8ab4a3f5fa5c0.reference = {
    __cReference: true,
    get value() { return LUKE____header_global_2c05aed7e5c676bd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:537
export const COOLEXPLOSION1____header_global_17e3bb6e6c4e6bc3 = ((u32(((u32(1360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_254fc74c1822709dfc33b3a3() {
  return __cxx_static_address_254fc74c1822709dfc33b3a3.reference || (__cxx_static_address_254fc74c1822709dfc33b3a3.reference = {
    __cReference: true,
    get value() { return COOLEXPLOSION1____header_global_17e3bb6e6c4e6bc3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:538
export const WATERSPLASH2____header_global_78f769d93818711a = ((u32(((u32(1380) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_164bc3300cf441466792d02c() {
  return __cxx_static_address_164bc3300cf441466792d02c.reference || (__cxx_static_address_164bc3300cf441466792d02c.reference = {
    __cReference: true,
    get value() { return WATERSPLASH2____header_global_78f769d93818711a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:539
export const FIREVASE____header_global_04988da489dc5456 = ((u32(((u32(1390) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ddfa24c37c5938b2a86931b0() {
  return __cxx_static_address_ddfa24c37c5938b2a86931b0.reference || (__cxx_static_address_ddfa24c37c5938b2a86931b0.reference = {
    __cReference: true,
    get value() { return FIREVASE____header_global_04988da489dc5456; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:540
export const FEM7____header_global_4509d05ad445bc7f = ((u32(((u32(1395) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b779598363815fb2ad236a87() {
  return __cxx_static_address_b779598363815fb2ad236a87.reference || (__cxx_static_address_b779598363815fb2ad236a87.reference = {
    __cReference: true,
    get value() { return FEM7____header_global_4509d05ad445bc7f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:541
export const APLAYERTOP____header_global_ceb9c58f28290ee7 = ((u32(((u32(1400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f45e4da3c383c6d7cfab8a44() {
  return __cxx_static_address_f45e4da3c383c6d7cfab8a44.reference || (__cxx_static_address_f45e4da3c383c6d7cfab8a44.reference = {
    __cReference: true,
    get value() { return APLAYERTOP____header_global_ceb9c58f28290ee7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:542
export const APLAYER____header_global_049de32a29d4b070 = ((u32(((u32(1405) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6d692b995a52a9ebde65e7d7() {
  return __cxx_static_address_6d692b995a52a9ebde65e7d7.reference || (__cxx_static_address_6d692b995a52a9ebde65e7d7.reference = {
    __cReference: true,
    get value() { return APLAYER____header_global_049de32a29d4b070; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:543
export const PLAYERONWATER____header_global_38a5f2867298e445 = ((u32(((u32(1420) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_857ca1ec2523804d956b2f73() {
  return __cxx_static_address_857ca1ec2523804d956b2f73.reference || (__cxx_static_address_857ca1ec2523804d956b2f73.reference = {
    __cReference: true,
    get value() { return PLAYERONWATER____header_global_38a5f2867298e445; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:544
export const DUKELYINGDEAD____header_global_dadb8686670cb3f6 = ((u32(((u32(1518) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_182838c390b3c9a6f54812d3() {
  return __cxx_static_address_182838c390b3c9a6f54812d3.reference || (__cxx_static_address_182838c390b3c9a6f54812d3.reference = {
    __cReference: true,
    get value() { return DUKELYINGDEAD____header_global_dadb8686670cb3f6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:545
export const DUKETORSO____header_global_417ed5535d7fbf6d = ((u32(((u32(1520) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_24266a822dd25d103ccaace6() {
  return __cxx_static_address_24266a822dd25d103ccaace6.reference || (__cxx_static_address_24266a822dd25d103ccaace6.reference = {
    __cReference: true,
    get value() { return DUKETORSO____header_global_417ed5535d7fbf6d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:546
export const DUKEGUN____header_global_104c67d3d89af42a = ((u32(((u32(1528) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a89e8f18985ffeb2eae254a8() {
  return __cxx_static_address_a89e8f18985ffeb2eae254a8.reference || (__cxx_static_address_a89e8f18985ffeb2eae254a8.reference = {
    __cReference: true,
    get value() { return DUKEGUN____header_global_104c67d3d89af42a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:547
export const DUKELEG____header_global_bba3a4cf17a7e380 = ((u32(((u32(1536) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e263d2dcdb59b5564d332968() {
  return __cxx_static_address_e263d2dcdb59b5564d332968.reference || (__cxx_static_address_e263d2dcdb59b5564d332968.reference = {
    __cReference: true,
    get value() { return DUKELEG____header_global_bba3a4cf17a7e380; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:548
export const SHARK____header_global_7b9e22fb700a7ad2 = ((u32(((u32(1550) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1bb6f8363d38c12245b78ce5() {
  return __cxx_static_address_1bb6f8363d38c12245b78ce5.reference || (__cxx_static_address_1bb6f8363d38c12245b78ce5.reference = {
    __cReference: true,
    get value() { return SHARK____header_global_7b9e22fb700a7ad2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:549
export const BLOOD____header_global_7d265af1a3c794c4 = ((u32(((u32(1620) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_651dda04507c5956f861fee9() {
  return __cxx_static_address_651dda04507c5956f861fee9.reference || (__cxx_static_address_651dda04507c5956f861fee9.reference = {
    __cReference: true,
    get value() { return BLOOD____header_global_7d265af1a3c794c4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:550
export const FIRELASER____header_global_d2e025bc44d402e3 = ((u32(((u32(1625) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dd25da72171cf33f8328f4cf() {
  return __cxx_static_address_dd25da72171cf33f8328f4cf.reference || (__cxx_static_address_dd25da72171cf33f8328f4cf.reference = {
    __cReference: true,
    get value() { return FIRELASER____header_global_d2e025bc44d402e3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:551
export const TRANSPORTERSTAR____header_global_9dd1879fb2d69c36 = ((u32(((u32(1630) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4766deaaf8d9be3641b440b2() {
  return __cxx_static_address_4766deaaf8d9be3641b440b2.reference || (__cxx_static_address_4766deaaf8d9be3641b440b2.reference = {
    __cReference: true,
    get value() { return TRANSPORTERSTAR____header_global_9dd1879fb2d69c36; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:552
export const SPIT____header_global_47ecc8fbd155a05f = ((u32(((u32(1636) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3e96a3dd7528c00fb923dcfa() {
  return __cxx_static_address_3e96a3dd7528c00fb923dcfa.reference || (__cxx_static_address_3e96a3dd7528c00fb923dcfa.reference = {
    __cReference: true,
    get value() { return SPIT____header_global_47ecc8fbd155a05f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:553
export const LOOGIE____header_global_634653474cfdf31c = ((u32(((u32(1637) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d28fc604d773c0375be916e6() {
  return __cxx_static_address_d28fc604d773c0375be916e6.reference || (__cxx_static_address_d28fc604d773c0375be916e6.reference = {
    __cReference: true,
    get value() { return LOOGIE____header_global_634653474cfdf31c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:554
export const FIST____header_global_b5c041d70814bc40 = ((u32(((u32(1640) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e06e31c676e39054b9e42cd1() {
  return __cxx_static_address_e06e31c676e39054b9e42cd1.reference || (__cxx_static_address_e06e31c676e39054b9e42cd1.reference = {
    __cReference: true,
    get value() { return FIST____header_global_b5c041d70814bc40; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:555
export const FREEZEBLAST____header_global_07f99ba4588f4c84 = ((u32(((u32(1641) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_71d78758cba712f78b5fdb24() {
  return __cxx_static_address_71d78758cba712f78b5fdb24.reference || (__cxx_static_address_71d78758cba712f78b5fdb24.reference = {
    __cReference: true,
    get value() { return FREEZEBLAST____header_global_07f99ba4588f4c84; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:556
export const SHRINKSPARK____header_global_2418970080657971 = ((u32(((u32(1646) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_80a1b50f6f450e08c9da76de() {
  return __cxx_static_address_80a1b50f6f450e08c9da76de.reference || (__cxx_static_address_80a1b50f6f450e08c9da76de.reference = {
    __cReference: true,
    get value() { return SHRINKSPARK____header_global_2418970080657971; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:557
export const TONGUE____header_global_d8a097ad87ddb109 = ((u32(((u32(1647) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fe026538ecffd94b19d6342e() {
  return __cxx_static_address_fe026538ecffd94b19d6342e.reference || (__cxx_static_address_fe026538ecffd94b19d6342e.reference = {
    __cReference: true,
    get value() { return TONGUE____header_global_d8a097ad87ddb109; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:558
export const MORTER____header_global_6dc3540210d5c594 = ((u32(((u32(1650) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2faf5adb240eecde645a9558() {
  return __cxx_static_address_2faf5adb240eecde645a9558.reference || (__cxx_static_address_2faf5adb240eecde645a9558.reference = {
    __cReference: true,
    get value() { return MORTER____header_global_6dc3540210d5c594; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:559
export const SHRINKEREXPLOSION____header_global_5ef64fb37c35893f = ((u32(((u32(1656) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_40e013f9287c649b918711a1() {
  return __cxx_static_address_40e013f9287c649b918711a1.reference || (__cxx_static_address_40e013f9287c649b918711a1.reference = {
    __cReference: true,
    get value() { return SHRINKEREXPLOSION____header_global_5ef64fb37c35893f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:560
export const RADIUSEXPLOSION____header_global_8e33514331e7f828 = ((u32(((u32(1670) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8061b23158f95c48d67548d1() {
  return __cxx_static_address_8061b23158f95c48d67548d1.reference || (__cxx_static_address_8061b23158f95c48d67548d1.reference = {
    __cReference: true,
    get value() { return RADIUSEXPLOSION____header_global_8e33514331e7f828; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:561
export const FORCERIPPLE____header_global_0341955303825768 = ((u32(((u32(1671) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f829324cd78813d773d1fcf3() {
  return __cxx_static_address_f829324cd78813d773d1fcf3.reference || (__cxx_static_address_f829324cd78813d773d1fcf3.reference = {
    __cReference: true,
    get value() { return FORCERIPPLE____header_global_0341955303825768; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:562
export const LIZTROOP____header_global_fe7b7687b9573eff = ((u32(((u32(1680) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a937ef7c384827dceb01e6ba() {
  return __cxx_static_address_a937ef7c384827dceb01e6ba.reference || (__cxx_static_address_a937ef7c384827dceb01e6ba.reference = {
    __cReference: true,
    get value() { return LIZTROOP____header_global_fe7b7687b9573eff; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:563
export const LIZTROOPRUNNING____header_global_ce89df10d51d7f1a = ((u32(((u32(1681) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1d4025a12bdc97454671a55a() {
  return __cxx_static_address_1d4025a12bdc97454671a55a.reference || (__cxx_static_address_1d4025a12bdc97454671a55a.reference = {
    __cReference: true,
    get value() { return LIZTROOPRUNNING____header_global_ce89df10d51d7f1a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:564
export const LIZTROOPSTAYPUT____header_global_bee1e2cf48306f6a = ((u32(((u32(1682) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c12f81d014c1c85086988953() {
  return __cxx_static_address_c12f81d014c1c85086988953.reference || (__cxx_static_address_c12f81d014c1c85086988953.reference = {
    __cReference: true,
    get value() { return LIZTROOPSTAYPUT____header_global_bee1e2cf48306f6a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:565
export const LIZTROOPSHOOT____header_global_e41c8cc768f5baba = ((u32(((u32(1715) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b8922881bf1ad7d994c149ad() {
  return __cxx_static_address_b8922881bf1ad7d994c149ad.reference || (__cxx_static_address_b8922881bf1ad7d994c149ad.reference = {
    __cReference: true,
    get value() { return LIZTROOPSHOOT____header_global_e41c8cc768f5baba; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:566
export const LIZTROOPJETPACK____header_global_b8245cef223f377c = ((u32(((u32(1725) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_751e8357af5bd81819a34ed5() {
  return __cxx_static_address_751e8357af5bd81819a34ed5.reference || (__cxx_static_address_751e8357af5bd81819a34ed5.reference = {
    __cReference: true,
    get value() { return LIZTROOPJETPACK____header_global_b8245cef223f377c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:567
export const LIZTROOPONTOILET____header_global_b9774eaaf448abc5 = ((u32(((u32(1741) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_122939710267043841f955e7() {
  return __cxx_static_address_122939710267043841f955e7.reference || (__cxx_static_address_122939710267043841f955e7.reference = {
    __cReference: true,
    get value() { return LIZTROOPONTOILET____header_global_b9774eaaf448abc5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:568
export const LIZTROOPJUSTSIT____header_global_7a75c2778c405898 = ((u32(((u32(1742) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_33d9245e6784e96dc068e74c() {
  return __cxx_static_address_33d9245e6784e96dc068e74c.reference || (__cxx_static_address_33d9245e6784e96dc068e74c.reference = {
    __cReference: true,
    get value() { return LIZTROOPJUSTSIT____header_global_7a75c2778c405898; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:569
export const LIZTROOPDUCKING____header_global_885d2115a792393d = ((u32(((u32(1744) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4a0ea61eb0ef8e51874c38f3() {
  return __cxx_static_address_4a0ea61eb0ef8e51874c38f3.reference || (__cxx_static_address_4a0ea61eb0ef8e51874c38f3.reference = {
    __cReference: true,
    get value() { return LIZTROOPDUCKING____header_global_885d2115a792393d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:570
export const HEADJIB1____header_global_4fef663fead517c7 = ((u32(((u32(1768) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_de13f8a658a74ecdbf8e06a4() {
  return __cxx_static_address_de13f8a658a74ecdbf8e06a4.reference || (__cxx_static_address_de13f8a658a74ecdbf8e06a4.reference = {
    __cReference: true,
    get value() { return HEADJIB1____header_global_4fef663fead517c7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:571
export const ARMJIB1____header_global_43e1ffbf121480a1 = ((u32(((u32(1772) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_10a6cd5d64af04f3e9cd9363() {
  return __cxx_static_address_10a6cd5d64af04f3e9cd9363.reference || (__cxx_static_address_10a6cd5d64af04f3e9cd9363.reference = {
    __cReference: true,
    get value() { return ARMJIB1____header_global_43e1ffbf121480a1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:572
export const LEGJIB1____header_global_d92202de87cfe8ec = ((u32(((u32(1776) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9e3cc38252964f0f736756ba() {
  return __cxx_static_address_9e3cc38252964f0f736756ba.reference || (__cxx_static_address_9e3cc38252964f0f736756ba.reference = {
    __cReference: true,
    get value() { return LEGJIB1____header_global_d92202de87cfe8ec; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:573
export const OCTABRAIN____header_global_b071da9e8a57ccda = ((u32(((u32(1820) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7685acad4625d9c1ffe032f4() {
  return __cxx_static_address_7685acad4625d9c1ffe032f4.reference || (__cxx_static_address_7685acad4625d9c1ffe032f4.reference = {
    __cReference: true,
    get value() { return OCTABRAIN____header_global_b071da9e8a57ccda; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:574
export const OCTABRAINSTAYPUT____header_global_8acc7f4a2e14a923 = ((u32(((u32(1821) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bfdc4d03ec61b56effeb91e3() {
  return __cxx_static_address_bfdc4d03ec61b56effeb91e3.reference || (__cxx_static_address_bfdc4d03ec61b56effeb91e3.reference = {
    __cReference: true,
    get value() { return OCTABRAINSTAYPUT____header_global_8acc7f4a2e14a923; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:575
export const INNERJAW____header_global_a98e3b6aa963f4e9 = ((u32(((u32(1860) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b1c1299e08619061069f8212() {
  return __cxx_static_address_b1c1299e08619061069f8212.reference || (__cxx_static_address_b1c1299e08619061069f8212.reference = {
    __cReference: true,
    get value() { return INNERJAW____header_global_a98e3b6aa963f4e9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:576
export const DRONE____header_global_29baf94d9ecea1b6 = ((u32(((u32(1880) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_999bbf9003c0ca3bc399e91b() {
  return __cxx_static_address_999bbf9003c0ca3bc399e91b.reference || (__cxx_static_address_999bbf9003c0ca3bc399e91b.reference = {
    __cReference: true,
    get value() { return DRONE____header_global_29baf94d9ecea1b6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:577
export const EXPLOSION2____header_global_89222da657a1230c = ((u32(((u32(1890) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7aad03b128000c356a8e9765() {
  return __cxx_static_address_7aad03b128000c356a8e9765.reference || (__cxx_static_address_7aad03b128000c356a8e9765.reference = {
    __cReference: true,
    get value() { return EXPLOSION2____header_global_89222da657a1230c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:578
export const COMMANDER____header_global_04e11ab5540fa14e = ((u32(((u32(1920) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7dd3c780ddafa51b3a2032fe() {
  return __cxx_static_address_7dd3c780ddafa51b3a2032fe.reference || (__cxx_static_address_7dd3c780ddafa51b3a2032fe.reference = {
    __cReference: true,
    get value() { return COMMANDER____header_global_04e11ab5540fa14e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:579
export const COMMANDERSTAYPUT____header_global_6e401fa3c3e23c2c = ((u32(((u32(1921) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8af81c65038d7bb1095e0bf2() {
  return __cxx_static_address_8af81c65038d7bb1095e0bf2.reference || (__cxx_static_address_8af81c65038d7bb1095e0bf2.reference = {
    __cReference: true,
    get value() { return COMMANDERSTAYPUT____header_global_6e401fa3c3e23c2c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:580
export const RECON____header_global_ca6c92596eecf1c5 = ((u32(((u32(1960) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2eea3a2c55b4064905c496e8() {
  return __cxx_static_address_2eea3a2c55b4064905c496e8.reference || (__cxx_static_address_2eea3a2c55b4064905c496e8.reference = {
    __cReference: true,
    get value() { return RECON____header_global_ca6c92596eecf1c5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:581
export const TANK____header_global_b7b916f1a2f16f17 = ((u32(((u32(1975) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0521c40bc3b5bf25440c1658() {
  return __cxx_static_address_0521c40bc3b5bf25440c1658.reference || (__cxx_static_address_0521c40bc3b5bf25440c1658.reference = {
    __cReference: true,
    get value() { return TANK____header_global_b7b916f1a2f16f17; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:582
export const PIGCOP____header_global_d16981165562d66a = ((u32(((u32(2000) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8c09f091cfb2b4661bdbecf2() {
  return __cxx_static_address_8c09f091cfb2b4661bdbecf2.reference || (__cxx_static_address_8c09f091cfb2b4661bdbecf2.reference = {
    __cReference: true,
    get value() { return PIGCOP____header_global_d16981165562d66a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:583
export const PIGCOPSTAYPUT____header_global_b6b0513b4ab57c63 = ((u32(((u32(2001) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_daacee65e61195c3d41b9e86() {
  return __cxx_static_address_daacee65e61195c3d41b9e86.reference || (__cxx_static_address_daacee65e61195c3d41b9e86.reference = {
    __cReference: true,
    get value() { return PIGCOPSTAYPUT____header_global_b6b0513b4ab57c63; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:584
export const PIGCOPDIVE____header_global_a4e020b5bc450627 = ((u32(((u32(2045) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5305edf0da9e9f69a08eab17() {
  return __cxx_static_address_5305edf0da9e9f69a08eab17.reference || (__cxx_static_address_5305edf0da9e9f69a08eab17.reference = {
    __cReference: true,
    get value() { return PIGCOPDIVE____header_global_a4e020b5bc450627; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:585
export const LIZMAN____header_global_31f87c419465d51c = ((u32(((u32(2120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9bde301a24db8f040b16909d() {
  return __cxx_static_address_9bde301a24db8f040b16909d.reference || (__cxx_static_address_9bde301a24db8f040b16909d.reference = {
    __cReference: true,
    get value() { return LIZMAN____header_global_31f87c419465d51c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:586
export const LIZMANSTAYPUT____header_global_5c1416d4f5abe641 = ((u32(((u32(2121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ba45666801c2562e14f001fb() {
  return __cxx_static_address_ba45666801c2562e14f001fb.reference || (__cxx_static_address_ba45666801c2562e14f001fb.reference = {
    __cReference: true,
    get value() { return LIZMANSTAYPUT____header_global_5c1416d4f5abe641; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:587
export const LIZMANSPITTING____header_global_63655bd3668ae4da = ((u32(((u32(2150) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bcc1135bb94b9def4611dd7b() {
  return __cxx_static_address_bcc1135bb94b9def4611dd7b.reference || (__cxx_static_address_bcc1135bb94b9def4611dd7b.reference = {
    __cReference: true,
    get value() { return LIZMANSPITTING____header_global_63655bd3668ae4da; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:588
export const LIZMANFEEDING____header_global_1bcdf0a3498142d9 = ((u32(((u32(2160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_65ec479e7610f42964cff8d6() {
  return __cxx_static_address_65ec479e7610f42964cff8d6.reference || (__cxx_static_address_65ec479e7610f42964cff8d6.reference = {
    __cReference: true,
    get value() { return LIZMANFEEDING____header_global_1bcdf0a3498142d9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:589
export const LIZMANJUMP____header_global_2110d5e51a295e4c = ((u32(((u32(2165) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_968435d3490e17adef938bff() {
  return __cxx_static_address_968435d3490e17adef938bff.reference || (__cxx_static_address_968435d3490e17adef938bff.reference = {
    __cReference: true,
    get value() { return LIZMANJUMP____header_global_2110d5e51a295e4c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:590
export const FECES____header_global_7a7edd67b5c7d4e5 = ((u32(((u32(2200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a9683f258003495084d5f94f() {
  return __cxx_static_address_a9683f258003495084d5f94f.reference || (__cxx_static_address_a9683f258003495084d5f94f.reference = {
    __cReference: true,
    get value() { return FECES____header_global_7a7edd67b5c7d4e5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:591
export const LIZMANHEAD1____header_global_36eec02692f047bc = ((u32(((u32(2201) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_720d0f0fd09618d0b334256e() {
  return __cxx_static_address_720d0f0fd09618d0b334256e.reference || (__cxx_static_address_720d0f0fd09618d0b334256e.reference = {
    __cReference: true,
    get value() { return LIZMANHEAD1____header_global_36eec02692f047bc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:592
export const LIZMANARM1____header_global_1b6620536eebc34d = ((u32(((u32(2205) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6c5954f2535a30513bc00ec3() {
  return __cxx_static_address_6c5954f2535a30513bc00ec3.reference || (__cxx_static_address_6c5954f2535a30513bc00ec3.reference = {
    __cReference: true,
    get value() { return LIZMANARM1____header_global_1b6620536eebc34d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:593
export const LIZMANLEG1____header_global_35fa7f2b0a2bf860 = ((u32(((u32(2209) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c8a45446cf80f58b20650d53() {
  return __cxx_static_address_c8a45446cf80f58b20650d53.reference || (__cxx_static_address_c8a45446cf80f58b20650d53.reference = {
    __cReference: true,
    get value() { return LIZMANLEG1____header_global_35fa7f2b0a2bf860; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:594
export const EXPLOSION2BOT____header_global_5f4761adf7ac66d6 = ((u32(((u32(2219) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3b79222dcab42fce5ed4faa4() {
  return __cxx_static_address_3b79222dcab42fce5ed4faa4.reference || (__cxx_static_address_3b79222dcab42fce5ed4faa4.reference = {
    __cReference: true,
    get value() { return EXPLOSION2BOT____header_global_5f4761adf7ac66d6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:595
export const JIBS1____header_global_16d5ba7595808a47 = ((u32(((u32(2245) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_360103d2ff1269fcec147b16() {
  return __cxx_static_address_360103d2ff1269fcec147b16.reference || (__cxx_static_address_360103d2ff1269fcec147b16.reference = {
    __cReference: true,
    get value() { return JIBS1____header_global_16d5ba7595808a47; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:596
export const JIBS2____header_global_8a7181850829e0f7 = ((u32(((u32(2250) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fa686c2fef09c586bd1ac6fa() {
  return __cxx_static_address_fa686c2fef09c586bd1ac6fa.reference || (__cxx_static_address_fa686c2fef09c586bd1ac6fa.reference = {
    __cReference: true,
    get value() { return JIBS2____header_global_8a7181850829e0f7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:597
export const JIBS3____header_global_6f53079260ae27e8 = ((u32(((u32(2255) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d7f95c5fde6c8bcca836f2f3() {
  return __cxx_static_address_d7f95c5fde6c8bcca836f2f3.reference || (__cxx_static_address_d7f95c5fde6c8bcca836f2f3.reference = {
    __cReference: true,
    get value() { return JIBS3____header_global_6f53079260ae27e8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:598
export const JIBS4____header_global_34f52ec1e4f15b3e = ((u32(((u32(2260) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8980398d09c7ea6bd7991d9e() {
  return __cxx_static_address_8980398d09c7ea6bd7991d9e.reference || (__cxx_static_address_8980398d09c7ea6bd7991d9e.reference = {
    __cReference: true,
    get value() { return JIBS4____header_global_34f52ec1e4f15b3e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:599
export const JIBS5____header_global_2b6e6cf31110004e = ((u32(((u32(2265) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_af2e7a80591648655886026f() {
  return __cxx_static_address_af2e7a80591648655886026f.reference || (__cxx_static_address_af2e7a80591648655886026f.reference = {
    __cReference: true,
    get value() { return JIBS5____header_global_2b6e6cf31110004e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:600
export const BURNING____header_global_9e87f572c21785f1 = ((u32(((u32(2270) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2bd17dba8e542ef14e80162f() {
  return __cxx_static_address_2bd17dba8e542ef14e80162f.reference || (__cxx_static_address_2bd17dba8e542ef14e80162f.reference = {
    __cReference: true,
    get value() { return BURNING____header_global_9e87f572c21785f1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:601
export const FIRE____header_global_ac3a97fd52c73c3d = ((u32(((u32(2271) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_de7f0b42ceed98fcdc6ebde6() {
  return __cxx_static_address_de7f0b42ceed98fcdc6ebde6.reference || (__cxx_static_address_de7f0b42ceed98fcdc6ebde6.reference = {
    __cReference: true,
    get value() { return FIRE____header_global_ac3a97fd52c73c3d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:602
export const JIBS6____header_global_920de23a3b490f85 = ((u32(((u32(2286) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8040cf690e0266155a1fc40e() {
  return __cxx_static_address_8040cf690e0266155a1fc40e.reference || (__cxx_static_address_8040cf690e0266155a1fc40e.reference = {
    __cReference: true,
    get value() { return JIBS6____header_global_920de23a3b490f85; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:603
export const BLOODSPLAT1____header_global_4306d32143984044 = ((u32(((u32(2296) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_791818ed320abc9b4fa33a02() {
  return __cxx_static_address_791818ed320abc9b4fa33a02.reference || (__cxx_static_address_791818ed320abc9b4fa33a02.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT1____header_global_4306d32143984044; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:604
export const BLOODSPLAT3____header_global_6345e98ac88280e1 = ((u32(((u32(2297) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b18a9850e7c1bb0eafaf9ff1() {
  return __cxx_static_address_b18a9850e7c1bb0eafaf9ff1.reference || (__cxx_static_address_b18a9850e7c1bb0eafaf9ff1.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT3____header_global_6345e98ac88280e1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:605
export const BLOODSPLAT2____header_global_cd22f94d658206aa = ((u32(((u32(2298) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_121bfb8cd3ab9b0ed513635e() {
  return __cxx_static_address_121bfb8cd3ab9b0ed513635e.reference || (__cxx_static_address_121bfb8cd3ab9b0ed513635e.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT2____header_global_cd22f94d658206aa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:606
export const BLOODSPLAT4____header_global_3978d979c0b3f57e = ((u32(((u32(2299) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7824d262dbc03cc189f9e548() {
  return __cxx_static_address_7824d262dbc03cc189f9e548.reference || (__cxx_static_address_7824d262dbc03cc189f9e548.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT4____header_global_3978d979c0b3f57e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:607
export const OOZ____header_global_67a4a1737d3eec4a = ((u32(((u32(2300) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2d7951de0572377947967b31() {
  return __cxx_static_address_2d7951de0572377947967b31.reference || (__cxx_static_address_2d7951de0572377947967b31.reference = {
    __cReference: true,
    get value() { return OOZ____header_global_67a4a1737d3eec4a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:608
export const OOZ2____header_global_73c92213eea6b6bd = ((u32(((u32(2309) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c3e5ad2099fd202283bdf07e() {
  return __cxx_static_address_c3e5ad2099fd202283bdf07e.reference || (__cxx_static_address_c3e5ad2099fd202283bdf07e.reference = {
    __cReference: true,
    get value() { return OOZ2____header_global_73c92213eea6b6bd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:609
export const WALLBLOOD1____header_global_cbe649ac2382856d = ((u32(((u32(2301) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cced5eadd0cf0ae8ac2cd1a8() {
  return __cxx_static_address_cced5eadd0cf0ae8ac2cd1a8.reference || (__cxx_static_address_cced5eadd0cf0ae8ac2cd1a8.reference = {
    __cReference: true,
    get value() { return WALLBLOOD1____header_global_cbe649ac2382856d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:610
export const WALLBLOOD2____header_global_3d01cde311f59653 = ((u32(((u32(2302) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b309975d1aadb0c40941578d() {
  return __cxx_static_address_b309975d1aadb0c40941578d.reference || (__cxx_static_address_b309975d1aadb0c40941578d.reference = {
    __cReference: true,
    get value() { return WALLBLOOD2____header_global_3d01cde311f59653; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:611
export const WALLBLOOD3____header_global_fde7563805197b2c = ((u32(((u32(2303) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_913be5dfd4e0fc39410a86fd() {
  return __cxx_static_address_913be5dfd4e0fc39410a86fd.reference || (__cxx_static_address_913be5dfd4e0fc39410a86fd.reference = {
    __cReference: true,
    get value() { return WALLBLOOD3____header_global_fde7563805197b2c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:612
export const WALLBLOOD4____header_global_15ca78716123e899 = ((u32(((u32(2304) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_304a72152b7a65ca731f25e0() {
  return __cxx_static_address_304a72152b7a65ca731f25e0.reference || (__cxx_static_address_304a72152b7a65ca731f25e0.reference = {
    __cReference: true,
    get value() { return WALLBLOOD4____header_global_15ca78716123e899; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:613
export const WALLBLOOD5____header_global_7bab1c2d35b84c53 = ((u32(((u32(2305) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6a7a6d11f71ac033ab109a76() {
  return __cxx_static_address_6a7a6d11f71ac033ab109a76.reference || (__cxx_static_address_6a7a6d11f71ac033ab109a76.reference = {
    __cReference: true,
    get value() { return WALLBLOOD5____header_global_7bab1c2d35b84c53; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:614
export const WALLBLOOD7____header_global_72a21e1a9b644edb = ((u32(((u32(2307) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_674921a7a007cb2a670131e0() {
  return __cxx_static_address_674921a7a007cb2a670131e0.reference || (__cxx_static_address_674921a7a007cb2a670131e0.reference = {
    __cReference: true,
    get value() { return WALLBLOOD7____header_global_72a21e1a9b644edb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:615
export const WALLBLOOD8____header_global_48dbc37ff4b92309 = ((u32(((u32(2308) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_261030d792d734673c8a6f33() {
  return __cxx_static_address_261030d792d734673c8a6f33.reference || (__cxx_static_address_261030d792d734673c8a6f33.reference = {
    __cReference: true,
    get value() { return WALLBLOOD8____header_global_48dbc37ff4b92309; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:616
export const BURNING2____header_global_2601ab70c057e486 = ((u32(((u32(2310) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_971ceb2d254f5d5736e911cb() {
  return __cxx_static_address_971ceb2d254f5d5736e911cb.reference || (__cxx_static_address_971ceb2d254f5d5736e911cb.reference = {
    __cReference: true,
    get value() { return BURNING2____header_global_2601ab70c057e486; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:617
export const FIRE2____header_global_e4c5ca1e1172ce7c = ((u32(((u32(2311) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4af83584325d2f59117f4224() {
  return __cxx_static_address_4af83584325d2f59117f4224.reference || (__cxx_static_address_4af83584325d2f59117f4224.reference = {
    __cReference: true,
    get value() { return FIRE2____header_global_e4c5ca1e1172ce7c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:618
export const CRACKKNUCKLES____header_global_4fef33a74ea25331 = ((u32(((u32(2324) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b5f56aa7faa4c1fc8eb263c6() {
  return __cxx_static_address_b5f56aa7faa4c1fc8eb263c6.reference || (__cxx_static_address_b5f56aa7faa4c1fc8eb263c6.reference = {
    __cReference: true,
    get value() { return CRACKKNUCKLES____header_global_4fef33a74ea25331; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:619
export const SMALLSMOKE____header_global_f317b1568c426501 = ((u32(((u32(2329) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bc797c427fe3f6299441cf42() {
  return __cxx_static_address_bc797c427fe3f6299441cf42.reference || (__cxx_static_address_bc797c427fe3f6299441cf42.reference = {
    __cReference: true,
    get value() { return SMALLSMOKE____header_global_f317b1568c426501; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:620
export const FLOORFLAME____header_global_1d6557fbab4ad1a8 = ((u32(((u32(2333) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0b132164a0abbf3084e8832c() {
  return __cxx_static_address_0b132164a0abbf3084e8832c.reference || (__cxx_static_address_0b132164a0abbf3084e8832c.reference = {
    __cReference: true,
    get value() { return FLOORFLAME____header_global_1d6557fbab4ad1a8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:621
export const ROTATEGUN____header_global_26b8d47459e48e8f = ((u32(((u32(2360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e9afaf5a62079bfb31cf1bc4() {
  return __cxx_static_address_e9afaf5a62079bfb31cf1bc4.reference || (__cxx_static_address_e9afaf5a62079bfb31cf1bc4.reference = {
    __cReference: true,
    get value() { return ROTATEGUN____header_global_26b8d47459e48e8f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:622
export const GREENSLIME____header_global_1c1cbb81f164a6d3 = ((u32(((u32(2370) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c6ec579d6020590f4fde377e() {
  return __cxx_static_address_c6ec579d6020590f4fde377e.reference || (__cxx_static_address_c6ec579d6020590f4fde377e.reference = {
    __cReference: true,
    get value() { return GREENSLIME____header_global_1c1cbb81f164a6d3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:623
export const WATERDRIPSPLASH____header_global_f0cdfed9d68d8659 = ((u32(((u32(2380) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_20cd5b832d595ef1be5aa1fd() {
  return __cxx_static_address_20cd5b832d595ef1be5aa1fd.reference || (__cxx_static_address_20cd5b832d595ef1be5aa1fd.reference = {
    __cReference: true,
    get value() { return WATERDRIPSPLASH____header_global_f0cdfed9d68d8659; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:624
export const SCRAP6____header_global_afca27c46d040878 = ((u32(((u32(2390) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_df69a21558de08e2792d905e() {
  return __cxx_static_address_df69a21558de08e2792d905e.reference || (__cxx_static_address_df69a21558de08e2792d905e.reference = {
    __cReference: true,
    get value() { return SCRAP6____header_global_afca27c46d040878; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:625
export const SCRAP1____header_global_3e5a68703d9b41fa = ((u32(((u32(2400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_122d23b59baa8496a011b421() {
  return __cxx_static_address_122d23b59baa8496a011b421.reference || (__cxx_static_address_122d23b59baa8496a011b421.reference = {
    __cReference: true,
    get value() { return SCRAP1____header_global_3e5a68703d9b41fa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:626
export const SCRAP2____header_global_2f356014bbbe6c61 = ((u32(((u32(2404) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2a4446022b83c8da71ba3689() {
  return __cxx_static_address_2a4446022b83c8da71ba3689.reference || (__cxx_static_address_2a4446022b83c8da71ba3689.reference = {
    __cReference: true,
    get value() { return SCRAP2____header_global_2f356014bbbe6c61; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:627
export const SCRAP3____header_global_244229f6bcfbebe1 = ((u32(((u32(2408) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_767c000e0e3854f901efacee() {
  return __cxx_static_address_767c000e0e3854f901efacee.reference || (__cxx_static_address_767c000e0e3854f901efacee.reference = {
    __cReference: true,
    get value() { return SCRAP3____header_global_244229f6bcfbebe1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:628
export const SCRAP4____header_global_2377643dbda65ff8 = ((u32(((u32(2412) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_99aeedab25d72dc9aa1d694e() {
  return __cxx_static_address_99aeedab25d72dc9aa1d694e.reference || (__cxx_static_address_99aeedab25d72dc9aa1d694e.reference = {
    __cReference: true,
    get value() { return SCRAP4____header_global_2377643dbda65ff8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:629
export const SCRAP5____header_global_45a1f82188c0a034 = ((u32(((u32(2416) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_02abca35e199587b69e0da48() {
  return __cxx_static_address_02abca35e199587b69e0da48.reference || (__cxx_static_address_02abca35e199587b69e0da48.reference = {
    __cReference: true,
    get value() { return SCRAP5____header_global_45a1f82188c0a034; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:630
export const ORGANTIC____header_global_1a9458af7b120b0c = ((u32(((u32(2420) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e52d3b12b8fe1d36e5de9e9b() {
  return __cxx_static_address_e52d3b12b8fe1d36e5de9e9b.reference || (__cxx_static_address_e52d3b12b8fe1d36e5de9e9b.reference = {
    __cReference: true,
    get value() { return ORGANTIC____header_global_1a9458af7b120b0c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:631
export const BETAVERSION____header_global_57846e986a286d51 = ((u32(((u32(2440) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_89f8e013e04dbb185db41d04() {
  return __cxx_static_address_89f8e013e04dbb185db41d04.reference || (__cxx_static_address_89f8e013e04dbb185db41d04.reference = {
    __cReference: true,
    get value() { return BETAVERSION____header_global_57846e986a286d51; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:632
export const SELECTDIR____header_global_c29c81f99fc4622c = ((u32(((u32(2444) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_32d90f6cd39267af9a6359ad() {
  return __cxx_static_address_32d90f6cd39267af9a6359ad.reference || (__cxx_static_address_32d90f6cd39267af9a6359ad.reference = {
    __cReference: true,
    get value() { return SELECTDIR____header_global_c29c81f99fc4622c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:633
export const F1HELP____header_global_12409e2398e6d465 = ((u32(((u32(2445) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a966d224b381435b7013b1d1() {
  return __cxx_static_address_a966d224b381435b7013b1d1.reference || (__cxx_static_address_a966d224b381435b7013b1d1.reference = {
    __cReference: true,
    get value() { return F1HELP____header_global_12409e2398e6d465; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:634
export const GROWSPARK____header_global_9db981fb2fd4983c = ((u32(((u32(2448) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_48554da8b755fa0c2bc65137() {
  return __cxx_static_address_48554da8b755fa0c2bc65137.reference || (__cxx_static_address_48554da8b755fa0c2bc65137.reference = {
    __cReference: true,
    get value() { return GROWSPARK____header_global_9db981fb2fd4983c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:635
export const MENUSCREEN____header_global_a037de79e80940f2 = ((u32(((u32(2456) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dcf974a2541a0c7d914f1a34() {
  return __cxx_static_address_dcf974a2541a0c7d914f1a34.reference || (__cxx_static_address_dcf974a2541a0c7d914f1a34.reference = {
    __cReference: true,
    get value() { return MENUSCREEN____header_global_a037de79e80940f2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:636
export const MENUBAR____header_global_3017a81e6f29e584 = ((u32(((u32(2457) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7df9cd91e63ae5ebc2bd384c() {
  return __cxx_static_address_7df9cd91e63ae5ebc2bd384c.reference || (__cxx_static_address_7df9cd91e63ae5ebc2bd384c.reference = {
    __cReference: true,
    get value() { return MENUBAR____header_global_3017a81e6f29e584; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:637
export const KILLSICON____header_global_1486c6761c2d355f = ((u32(((u32(2458) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6b6cde4ee4760830b3dc6a41() {
  return __cxx_static_address_6b6cde4ee4760830b3dc6a41.reference || (__cxx_static_address_6b6cde4ee4760830b3dc6a41.reference = {
    __cReference: true,
    get value() { return KILLSICON____header_global_1486c6761c2d355f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:638
export const FIRSTAID_ICON____header_global_e968caa1d6f02fbf = ((u32(((u32(2460) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2e6d1cfca1d98d9dc3ac18bc() {
  return __cxx_static_address_2e6d1cfca1d98d9dc3ac18bc.reference || (__cxx_static_address_2e6d1cfca1d98d9dc3ac18bc.reference = {
    __cReference: true,
    get value() { return FIRSTAID_ICON____header_global_e968caa1d6f02fbf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:639
export const HEAT_ICON____header_global_c419852116fb24e6 = ((u32(((u32(2461) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ed89e26b93de4acdaed774dd() {
  return __cxx_static_address_ed89e26b93de4acdaed774dd.reference || (__cxx_static_address_ed89e26b93de4acdaed774dd.reference = {
    __cReference: true,
    get value() { return HEAT_ICON____header_global_c419852116fb24e6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:640
export const BOTTOMSTATUSBAR____header_global_54c0e7da34784f8f = ((u32(((u32(2462) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4ca47649c1198338e19f3aa3() {
  return __cxx_static_address_4ca47649c1198338e19f3aa3.reference || (__cxx_static_address_4ca47649c1198338e19f3aa3.reference = {
    __cReference: true,
    get value() { return BOTTOMSTATUSBAR____header_global_54c0e7da34784f8f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:641
export const BOOT_ICON____header_global_16b335ab1c83884a = ((u32(((u32(2463) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6ddfbdda4dd0921da001be7f() {
  return __cxx_static_address_6ddfbdda4dd0921da001be7f.reference || (__cxx_static_address_6ddfbdda4dd0921da001be7f.reference = {
    __cReference: true,
    get value() { return BOOT_ICON____header_global_16b335ab1c83884a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:642
export const FRAGBAR____header_global_8bec8f53308af471 = ((u32(((u32(2465) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f06b78009693b6d9c922bcf4() {
  return __cxx_static_address_f06b78009693b6d9c922bcf4.reference || (__cxx_static_address_f06b78009693b6d9c922bcf4.reference = {
    __cReference: true,
    get value() { return FRAGBAR____header_global_8bec8f53308af471; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:643
export const JETPACK_ICON____header_global_9eccc36fe3c95a88 = ((u32(((u32(2467) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4798a44c96546340480b3122() {
  return __cxx_static_address_4798a44c96546340480b3122.reference || (__cxx_static_address_4798a44c96546340480b3122.reference = {
    __cReference: true,
    get value() { return JETPACK_ICON____header_global_9eccc36fe3c95a88; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:644
export const AIRTANK_ICON____header_global_ddd7141a8d0a4ef6 = ((u32(((u32(2468) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8ea49602d2038673ea6a6934() {
  return __cxx_static_address_8ea49602d2038673ea6a6934.reference || (__cxx_static_address_8ea49602d2038673ea6a6934.reference = {
    __cReference: true,
    get value() { return AIRTANK_ICON____header_global_ddd7141a8d0a4ef6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:645
export const STEROIDS_ICON____header_global_ce3832336708011f = ((u32(((u32(2469) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a10edddace07d764f3276735() {
  return __cxx_static_address_a10edddace07d764f3276735.reference || (__cxx_static_address_a10edddace07d764f3276735.reference = {
    __cReference: true,
    get value() { return STEROIDS_ICON____header_global_ce3832336708011f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:646
export const HOLODUKE_ICON____header_global_da62bcb44250a872 = ((u32(((u32(2470) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c7e444c0af49f6516fafb6cb() {
  return __cxx_static_address_c7e444c0af49f6516fafb6cb.reference || (__cxx_static_address_c7e444c0af49f6516fafb6cb.reference = {
    __cReference: true,
    get value() { return HOLODUKE_ICON____header_global_da62bcb44250a872; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:647
export const ACCESS_ICON____header_global_05d6d29f806301d6 = ((u32(((u32(2471) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d98757dd947b0ff7daf3f859() {
  return __cxx_static_address_d98757dd947b0ff7daf3f859.reference || (__cxx_static_address_d98757dd947b0ff7daf3f859.reference = {
    __cReference: true,
    get value() { return ACCESS_ICON____header_global_05d6d29f806301d6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:648
export const DIGITALNUM____header_global_9ef35b206599ea27 = ((u32(((u32(2472) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_181385b8d98de68ef2952cf8() {
  return __cxx_static_address_181385b8d98de68ef2952cf8.reference || (__cxx_static_address_181385b8d98de68ef2952cf8.reference = {
    __cReference: true,
    get value() { return DIGITALNUM____header_global_9ef35b206599ea27; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:649
export const DUKECAR____header_global_16d33418350ae827 = ((u32(((u32(2491) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5ece74377afad8e5ec4d5575() {
  return __cxx_static_address_5ece74377afad8e5ec4d5575.reference || (__cxx_static_address_5ece74377afad8e5ec4d5575.reference = {
    __cReference: true,
    get value() { return DUKECAR____header_global_16d33418350ae827; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:650
export const CAMCORNER____header_global_c1e38b5cc9433d1a = ((u32(((u32(2482) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4c17f97b2aedccbb3709bc28() {
  return __cxx_static_address_4c17f97b2aedccbb3709bc28.reference || (__cxx_static_address_4c17f97b2aedccbb3709bc28.reference = {
    __cReference: true,
    get value() { return CAMCORNER____header_global_c1e38b5cc9433d1a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:651
export const CAMLIGHT____header_global_d18b5c05d0bb1ea5 = ((u32(((u32(2484) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0fceefa76ebed8417ad9cefe() {
  return __cxx_static_address_0fceefa76ebed8417ad9cefe.reference || (__cxx_static_address_0fceefa76ebed8417ad9cefe.reference = {
    __cReference: true,
    get value() { return CAMLIGHT____header_global_d18b5c05d0bb1ea5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:652
export const SLIDEBAR____header_global_e1235cded96ea59b = ((u32(((u32(2489) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7459939cbe017cbcac4e76f1() {
  return __cxx_static_address_7459939cbe017cbcac4e76f1.reference || (__cxx_static_address_7459939cbe017cbcac4e76f1.reference = {
    __cReference: true,
    get value() { return SLIDEBAR____header_global_e1235cded96ea59b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:653
export const DREALMS____header_global_8ecdd32ca3f9f2b2 = ((u32(((u32(2492) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d09f804f6ffe177881240c35() {
  return __cxx_static_address_d09f804f6ffe177881240c35.reference || (__cxx_static_address_d09f804f6ffe177881240c35.reference = {
    __cReference: true,
    get value() { return DREALMS____header_global_8ecdd32ca3f9f2b2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:654
export const BETASCREEN____header_global_bdda3b6b2face901 = ((u32(((u32(2493) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c0b387d12b535d7cfdc4f1f6() {
  return __cxx_static_address_c0b387d12b535d7cfdc4f1f6.reference || (__cxx_static_address_c0b387d12b535d7cfdc4f1f6.reference = {
    __cReference: true,
    get value() { return BETASCREEN____header_global_bdda3b6b2face901; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:655
export const WINDOWBORDER1____header_global_cf4bc55a023be46d = ((u32(((u32(2494) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_072e2d5c9df2c842686d613e() {
  return __cxx_static_address_072e2d5c9df2c842686d613e.reference || (__cxx_static_address_072e2d5c9df2c842686d613e.reference = {
    __cReference: true,
    get value() { return WINDOWBORDER1____header_global_cf4bc55a023be46d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:656
export const TEXTBOX____header_global_121c5eeb42e3d4b9 = ((u32(((u32(2495) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4ece47f9ffc5b68da4cf18ae() {
  return __cxx_static_address_4ece47f9ffc5b68da4cf18ae.reference || (__cxx_static_address_4ece47f9ffc5b68da4cf18ae.reference = {
    __cReference: true,
    get value() { return TEXTBOX____header_global_121c5eeb42e3d4b9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:657
export const WINDOWBORDER2____header_global_4f2ff2b4d0b76a94 = ((u32(((u32(2496) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_335dab9ccd820acd7f12d157() {
  return __cxx_static_address_335dab9ccd820acd7f12d157.reference || (__cxx_static_address_335dab9ccd820acd7f12d157.reference = {
    __cReference: true,
    get value() { return WINDOWBORDER2____header_global_4f2ff2b4d0b76a94; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:658
export const DUKENUKEM____header_global_f2b3b7f9516ca28d = ((u32(((u32(2497) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eb6549a4db1d5425e00c064c() {
  return __cxx_static_address_eb6549a4db1d5425e00c064c.reference || (__cxx_static_address_eb6549a4db1d5425e00c064c.reference = {
    __cReference: true,
    get value() { return DUKENUKEM____header_global_f2b3b7f9516ca28d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:659
export const THREEDEE____header_global_fe0853ddef2cf7c1 = ((u32(((u32(2498) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_93c78d17603541532bb7ef8b() {
  return __cxx_static_address_93c78d17603541532bb7ef8b.reference || (__cxx_static_address_93c78d17603541532bb7ef8b.reference = {
    __cReference: true,
    get value() { return THREEDEE____header_global_fe0853ddef2cf7c1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:660
export const INGAMEDUKETHREEDEE____header_global_06d47a9d6cd46128 = ((u32(((u32(2499) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a9a1a9fd28d337b557d37f5b() {
  return __cxx_static_address_a9a1a9fd28d337b557d37f5b.reference || (__cxx_static_address_a9a1a9fd28d337b557d37f5b.reference = {
    __cReference: true,
    get value() { return INGAMEDUKETHREEDEE____header_global_06d47a9d6cd46128; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:661
export const TENSCREEN____header_global_6da9b738a30d0825 = ((u32(((u32(2500) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_68233ad14d5a3898a9a760e8() {
  return __cxx_static_address_68233ad14d5a3898a9a760e8.reference || (__cxx_static_address_68233ad14d5a3898a9a760e8.reference = {
    __cReference: true,
    get value() { return TENSCREEN____header_global_6da9b738a30d0825; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:662
export const PLUTOPAKSPRITE____header_global_43db31cc7738b76d = ((u32(((u32(2501) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3c25a986e69e0588f3e8361e() {
  return __cxx_static_address_3c25a986e69e0588f3e8361e.reference || (__cxx_static_address_3c25a986e69e0588f3e8361e.reference = {
    __cReference: true,
    get value() { return PLUTOPAKSPRITE____header_global_43db31cc7738b76d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:663
export const DEVISTATOR____header_global_3e3c022dacb83938 = ((u32(((u32(2510) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_123f270dd58751cd651cfa34() {
  return __cxx_static_address_123f270dd58751cd651cfa34.reference || (__cxx_static_address_123f270dd58751cd651cfa34.reference = {
    __cReference: true,
    get value() { return DEVISTATOR____header_global_3e3c022dacb83938; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:664
export const KNEE____header_global_fe4ce5c7f20fd39f = ((u32(((u32(2521) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3ea396ebdb37cfba9b3a3966() {
  return __cxx_static_address_3ea396ebdb37cfba9b3a3966.reference || (__cxx_static_address_3ea396ebdb37cfba9b3a3966.reference = {
    __cReference: true,
    get value() { return KNEE____header_global_fe4ce5c7f20fd39f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:665
export const CROSSHAIR____header_global_cf920262c7c01fb7 = ((u32(((u32(2523) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cf182b4f975bfceda25f6b38() {
  return __cxx_static_address_cf182b4f975bfceda25f6b38.reference || (__cxx_static_address_cf182b4f975bfceda25f6b38.reference = {
    __cReference: true,
    get value() { return CROSSHAIR____header_global_cf920262c7c01fb7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:666
export const FIRSTGUN____header_global_d3a75fd03f69408a = ((u32(((u32(2524) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9386932afcb3886c038bed75() {
  return __cxx_static_address_9386932afcb3886c038bed75.reference || (__cxx_static_address_9386932afcb3886c038bed75.reference = {
    __cReference: true,
    get value() { return FIRSTGUN____header_global_d3a75fd03f69408a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:667
export const FIRSTGUNRELOAD____header_global_09cec8c55749afb9 = ((u32(((u32(2528) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c96c8757007ff029df7fe007() {
  return __cxx_static_address_c96c8757007ff029df7fe007.reference || (__cxx_static_address_c96c8757007ff029df7fe007.reference = {
    __cReference: true,
    get value() { return FIRSTGUNRELOAD____header_global_09cec8c55749afb9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:668
export const SHELL____header_global_f8dce4ba7f3614c0 = ((u32(((u32(2533) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b81b6114523aba890999852f() {
  return __cxx_static_address_b81b6114523aba890999852f.reference || (__cxx_static_address_b81b6114523aba890999852f.reference = {
    __cReference: true,
    get value() { return SHELL____header_global_f8dce4ba7f3614c0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:669
export const SHOTGUNSHELL____header_global_3b37f1e099b4e1c7 = ((u32(((u32(2535) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_82088acca3c490bfec058dc3() {
  return __cxx_static_address_82088acca3c490bfec058dc3.reference || (__cxx_static_address_82088acca3c490bfec058dc3.reference = {
    __cReference: true,
    get value() { return SHOTGUNSHELL____header_global_3b37f1e099b4e1c7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:670
export const CHAINGUN____header_global_89711fbc219eeb10 = ((u32(((u32(2536) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4baebbb52206128f156469ab() {
  return __cxx_static_address_4baebbb52206128f156469ab.reference || (__cxx_static_address_4baebbb52206128f156469ab.reference = {
    __cReference: true,
    get value() { return CHAINGUN____header_global_89711fbc219eeb10; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:671
export const RPGGUN____header_global_932afe5ce1132cf6 = ((u32(((u32(2544) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_74c96d71ccba18367c36b8a8() {
  return __cxx_static_address_74c96d71ccba18367c36b8a8.reference || (__cxx_static_address_74c96d71ccba18367c36b8a8.reference = {
    __cReference: true,
    get value() { return RPGGUN____header_global_932afe5ce1132cf6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:672
export const FREEZE____header_global_97f4140df1ab7208 = ((u32(((u32(2548) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_217c5e32773d0aaf8b1b9d97() {
  return __cxx_static_address_217c5e32773d0aaf8b1b9d97.reference || (__cxx_static_address_217c5e32773d0aaf8b1b9d97.reference = {
    __cReference: true,
    get value() { return FREEZE____header_global_97f4140df1ab7208; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:673
export const SHRINKER____header_global_20d1aaf9aa975764 = ((u32(((u32(2556) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5e91572f19cd9b4b80e18456() {
  return __cxx_static_address_5e91572f19cd9b4b80e18456.reference || (__cxx_static_address_5e91572f19cd9b4b80e18456.reference = {
    __cReference: true,
    get value() { return SHRINKER____header_global_20d1aaf9aa975764; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:674
export const HANDHOLDINGLASER____header_global_d526d9ac88449647 = ((u32(((u32(2563) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6da53bf511ff99597fcbf23c() {
  return __cxx_static_address_6da53bf511ff99597fcbf23c.reference || (__cxx_static_address_6da53bf511ff99597fcbf23c.reference = {
    __cReference: true,
    get value() { return HANDHOLDINGLASER____header_global_d526d9ac88449647; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:675
export const TRIPBOMB____header_global_d0b1b8578727309f = ((u32(((u32(2566) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_75bfe097f5c30ae4ae53e272() {
  return __cxx_static_address_75bfe097f5c30ae4ae53e272.reference || (__cxx_static_address_75bfe097f5c30ae4ae53e272.reference = {
    __cReference: true,
    get value() { return TRIPBOMB____header_global_d0b1b8578727309f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:676
export const LASERLINE____header_global_20e751817f483e24 = ((u32(((u32(2567) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_56df6cd2b9b08abe32355a51() {
  return __cxx_static_address_56df6cd2b9b08abe32355a51.reference || (__cxx_static_address_56df6cd2b9b08abe32355a51.reference = {
    __cReference: true,
    get value() { return LASERLINE____header_global_20e751817f483e24; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:677
export const HANDHOLDINGACCESS____header_global_7c7a8aef4336608f = ((u32(((u32(2568) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_186d545ed714d65444c2312b() {
  return __cxx_static_address_186d545ed714d65444c2312b.reference || (__cxx_static_address_186d545ed714d65444c2312b.reference = {
    __cReference: true,
    get value() { return HANDHOLDINGACCESS____header_global_7c7a8aef4336608f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:678
export const HANDREMOTE____header_global_d0b54338ef11561e = ((u32(((u32(2570) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a34e5a9a4c3e1245e5050a11() {
  return __cxx_static_address_a34e5a9a4c3e1245e5050a11.reference || (__cxx_static_address_a34e5a9a4c3e1245e5050a11.reference = {
    __cReference: true,
    get value() { return HANDREMOTE____header_global_d0b54338ef11561e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:679
export const HANDTHROW____header_global_f0fca9da1e4a6f2d = ((u32(((u32(2573) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cbfc6124551edac15c042daa() {
  return __cxx_static_address_cbfc6124551edac15c042daa.reference || (__cxx_static_address_cbfc6124551edac15c042daa.reference = {
    __cReference: true,
    get value() { return HANDTHROW____header_global_f0fca9da1e4a6f2d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:680
export const TIP____header_global_c03b3291ebfed464 = ((u32(((u32(2576) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_281140b55bbad7bc7bc92622() {
  return __cxx_static_address_281140b55bbad7bc7bc92622.reference || (__cxx_static_address_281140b55bbad7bc7bc92622.reference = {
    __cReference: true,
    get value() { return TIP____header_global_c03b3291ebfed464; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:681
export const SCUBAMASK____header_global_892156f2c7635304 = ((u32(((u32(2581) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cdc4078e74eb81923f18db22() {
  return __cxx_static_address_cdc4078e74eb81923f18db22.reference || (__cxx_static_address_cdc4078e74eb81923f18db22.reference = {
    __cReference: true,
    get value() { return SCUBAMASK____header_global_892156f2c7635304; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:682
export const FORCESPHERE____header_global_ffc5f672f1caefe1 = ((u32(((u32(2590) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d03ca0fb1e37eb359e916115() {
  return __cxx_static_address_d03ca0fb1e37eb359e916115.reference || (__cxx_static_address_d03ca0fb1e37eb359e916115.reference = {
    __cReference: true,
    get value() { return FORCESPHERE____header_global_ffc5f672f1caefe1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:683
export const SHOTSPARK1____header_global_2d67184b3dd2f624 = ((u32(((u32(2595) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b58d64b60b7de6a0c89a3b01() {
  return __cxx_static_address_b58d64b60b7de6a0c89a3b01.reference || (__cxx_static_address_b58d64b60b7de6a0c89a3b01.reference = {
    __cReference: true,
    get value() { return SHOTSPARK1____header_global_2d67184b3dd2f624; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:684
export const RPG____header_global_dbb5cd4ccf59d761 = ((u32(((u32(2605) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e211f99b50535a3c082ae336() {
  return __cxx_static_address_e211f99b50535a3c082ae336.reference || (__cxx_static_address_e211f99b50535a3c082ae336.reference = {
    __cReference: true,
    get value() { return RPG____header_global_dbb5cd4ccf59d761; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:685
export const LASERSITE____header_global_6bf6ac76f82f5a37 = ((u32(((u32(2612) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c4a608655fc75d7563a3381b() {
  return __cxx_static_address_c4a608655fc75d7563a3381b.reference || (__cxx_static_address_c4a608655fc75d7563a3381b.reference = {
    __cReference: true,
    get value() { return LASERSITE____header_global_6bf6ac76f82f5a37; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:686
export const SHOTGUN____header_global_cbd049448615880f = ((u32(((u32(2613) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4b75d529e29ab4bbead25704() {
  return __cxx_static_address_4b75d529e29ab4bbead25704.reference || (__cxx_static_address_4b75d529e29ab4bbead25704.reference = {
    __cReference: true,
    get value() { return SHOTGUN____header_global_cbd049448615880f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:687
export const BOSS1____header_global_44ecc79b823426f2 = ((u32(((u32(2630) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4e424142e8ec760b0ca4ce9a() {
  return __cxx_static_address_4e424142e8ec760b0ca4ce9a.reference || (__cxx_static_address_4e424142e8ec760b0ca4ce9a.reference = {
    __cReference: true,
    get value() { return BOSS1____header_global_44ecc79b823426f2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:688
export const BOSS1STAYPUT____header_global_7d8e6a33d5e338f6 = ((u32(((u32(2631) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7648fe4e1eab8fe381734165() {
  return __cxx_static_address_7648fe4e1eab8fe381734165.reference || (__cxx_static_address_7648fe4e1eab8fe381734165.reference = {
    __cReference: true,
    get value() { return BOSS1STAYPUT____header_global_7d8e6a33d5e338f6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:689
export const BOSS1SHOOT____header_global_6df2d7903b29409d = ((u32(((u32(2660) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ea72997f53ad4679449eb92b() {
  return __cxx_static_address_ea72997f53ad4679449eb92b.reference || (__cxx_static_address_ea72997f53ad4679449eb92b.reference = {
    __cReference: true,
    get value() { return BOSS1SHOOT____header_global_6df2d7903b29409d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:690
export const BOSS1LOB____header_global_2265dfeae3467da6 = ((u32(((u32(2670) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_676498d727efbc079f1e7563() {
  return __cxx_static_address_676498d727efbc079f1e7563.reference || (__cxx_static_address_676498d727efbc079f1e7563.reference = {
    __cReference: true,
    get value() { return BOSS1LOB____header_global_2265dfeae3467da6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:691
export const BOSSTOP____header_global_c87d982ceab696a1 = ((u32(((u32(2696) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_019bd60a535e154b445f5b79() {
  return __cxx_static_address_019bd60a535e154b445f5b79.reference || (__cxx_static_address_019bd60a535e154b445f5b79.reference = {
    __cReference: true,
    get value() { return BOSSTOP____header_global_c87d982ceab696a1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:692
export const BOSS2____header_global_71c06b16c2300131 = ((u32(((u32(2710) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5f214ac4b39e698792ea3d21() {
  return __cxx_static_address_5f214ac4b39e698792ea3d21.reference || (__cxx_static_address_5f214ac4b39e698792ea3d21.reference = {
    __cReference: true,
    get value() { return BOSS2____header_global_71c06b16c2300131; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:693
export const BOSS3____header_global_2ca6bb6067033797 = ((u32(((u32(2760) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0afeafebbb7ee00dbecdb1f5() {
  return __cxx_static_address_0afeafebbb7ee00dbecdb1f5.reference || (__cxx_static_address_0afeafebbb7ee00dbecdb1f5.reference = {
    __cReference: true,
    get value() { return BOSS3____header_global_2ca6bb6067033797; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:694
export const SPINNINGNUKEICON____header_global_42c031486e3c19d2 = ((u32(((u32(2813) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7f628913cd7f7c946344ed3f() {
  return __cxx_static_address_7f628913cd7f7c946344ed3f.reference || (__cxx_static_address_7f628913cd7f7c946344ed3f.reference = {
    __cReference: true,
    get value() { return SPINNINGNUKEICON____header_global_42c031486e3c19d2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:695
export const SMALLFNTCURSOR____header_global_6277b4282bd9e1e5 = ((u32(((u32(2821) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4b6f7ff5f1583246e19551fc() {
  return __cxx_static_address_4b6f7ff5f1583246e19551fc.reference || (__cxx_static_address_4b6f7ff5f1583246e19551fc.reference = {
    __cReference: true,
    get value() { return SMALLFNTCURSOR____header_global_6277b4282bd9e1e5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:696
export const STARTALPHANUM____header_global_025c656867273d94 = ((u32(((u32(2822) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5cdaf0c00c0e0bdee1fbeeb8() {
  return __cxx_static_address_5cdaf0c00c0e0bdee1fbeeb8.reference || (__cxx_static_address_5cdaf0c00c0e0bdee1fbeeb8.reference = {
    __cReference: true,
    get value() { return STARTALPHANUM____header_global_025c656867273d94; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:697
export const ENDALPHANUM____header_global_7fa4c13878819ffd = ((u32(((u32(2915) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c7e602e795d18fefc69804b3() {
  return __cxx_static_address_c7e602e795d18fefc69804b3.reference || (__cxx_static_address_c7e602e795d18fefc69804b3.reference = {
    __cReference: true,
    get value() { return ENDALPHANUM____header_global_7fa4c13878819ffd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:698
export const BIGALPHANUM____header_global_35eb1d85bd7b03c5 = ((u32(((u32(2940) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f3671577bce41b9de9bfb8fb() {
  return __cxx_static_address_f3671577bce41b9de9bfb8fb.reference || (__cxx_static_address_f3671577bce41b9de9bfb8fb.reference = {
    __cReference: true,
    get value() { return BIGALPHANUM____header_global_35eb1d85bd7b03c5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:699
export const BIGPERIOD____header_global_e771591433f65ee7 = ((u32(((u32(3002) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fadedb8326889a1fbccda920() {
  return __cxx_static_address_fadedb8326889a1fbccda920.reference || (__cxx_static_address_fadedb8326889a1fbccda920.reference = {
    __cReference: true,
    get value() { return BIGPERIOD____header_global_e771591433f65ee7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:700
export const BIGCOMMA____header_global_524ddb8e7a4a74f4 = ((u32(((u32(3003) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dab5ddaaf28259343677193f() {
  return __cxx_static_address_dab5ddaaf28259343677193f.reference || (__cxx_static_address_dab5ddaaf28259343677193f.reference = {
    __cReference: true,
    get value() { return BIGCOMMA____header_global_524ddb8e7a4a74f4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:701
export const BIGX____header_global_b7c7b52663a5a8de = ((u32(((u32(3004) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6f9ae8103c3a3fa909171f0a() {
  return __cxx_static_address_6f9ae8103c3a3fa909171f0a.reference || (__cxx_static_address_6f9ae8103c3a3fa909171f0a.reference = {
    __cReference: true,
    get value() { return BIGX____header_global_b7c7b52663a5a8de; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:702
export const BIGQ____header_global_6ecf16656a0dc1dd = ((u32(((u32(3005) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_18cabcbdc1cfb5337529e592() {
  return __cxx_static_address_18cabcbdc1cfb5337529e592.reference || (__cxx_static_address_18cabcbdc1cfb5337529e592.reference = {
    __cReference: true,
    get value() { return BIGQ____header_global_6ecf16656a0dc1dd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:703
export const BIGSEMI____header_global_fdb0ab6d81352135 = ((u32(((u32(3006) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_82c3ce0cd364440c638be7a0() {
  return __cxx_static_address_82c3ce0cd364440c638be7a0.reference || (__cxx_static_address_82c3ce0cd364440c638be7a0.reference = {
    __cReference: true,
    get value() { return BIGSEMI____header_global_fdb0ab6d81352135; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:704
export const BIGCOLIN____header_global_6a6c2562cb5d7545 = ((u32(((u32(3007) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_00fec1033f10e36bf5b52c60() {
  return __cxx_static_address_00fec1033f10e36bf5b52c60.reference || (__cxx_static_address_00fec1033f10e36bf5b52c60.reference = {
    __cReference: true,
    get value() { return BIGCOLIN____header_global_6a6c2562cb5d7545; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:705
export const THREEBYFIVE____header_global_89f2a59fe846f7e2 = ((u32(((u32(3010) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d036d058f3ad642a66a11446() {
  return __cxx_static_address_d036d058f3ad642a66a11446.reference || (__cxx_static_address_d036d058f3ad642a66a11446.reference = {
    __cReference: true,
    get value() { return THREEBYFIVE____header_global_89f2a59fe846f7e2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:706
export const BIGAPPOS____header_global_dfad6bdbc2dfd363 = ((u32(((u32(3022) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b5ac2173891edb46db61e8a0() {
  return __cxx_static_address_b5ac2173891edb46db61e8a0.reference || (__cxx_static_address_b5ac2173891edb46db61e8a0.reference = {
    __cReference: true,
    get value() { return BIGAPPOS____header_global_dfad6bdbc2dfd363; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:707
export const MINIFONT____header_global_58f0e80c0232b215 = ((u32(((u32(3072) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b61c5681266cd18c0f44eb5f() {
  return __cxx_static_address_b61c5681266cd18c0f44eb5f.reference || (__cxx_static_address_b61c5681266cd18c0f44eb5f.reference = {
    __cReference: true,
    get value() { return MINIFONT____header_global_58f0e80c0232b215; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:708
export const RESPAWNMARKERRED____header_global_4f358cabeb84a7d3 = ((u32(((u32(3190) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ae7961504307af30c1599934() {
  return __cxx_static_address_ae7961504307af30c1599934.reference || (__cxx_static_address_ae7961504307af30c1599934.reference = {
    __cReference: true,
    get value() { return RESPAWNMARKERRED____header_global_4f358cabeb84a7d3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:709
export const RESPAWNMARKERYELLOW____header_global_db5ce08dcf1ba500 = ((u32(((u32(3200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b19721960b75a559e635bbd8() {
  return __cxx_static_address_b19721960b75a559e635bbd8.reference || (__cxx_static_address_b19721960b75a559e635bbd8.reference = {
    __cReference: true,
    get value() { return RESPAWNMARKERYELLOW____header_global_db5ce08dcf1ba500; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:710
export const RESPAWNMARKERGREEN____header_global_b4789de73a40109b = ((u32(((u32(3210) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e388ece80f948dbcafb7f966() {
  return __cxx_static_address_e388ece80f948dbcafb7f966.reference || (__cxx_static_address_e388ece80f948dbcafb7f966.reference = {
    __cReference: true,
    get value() { return RESPAWNMARKERGREEN____header_global_b4789de73a40109b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:711
export const BONUSSCREEN____header_global_91a6b86f45cfca44 = ((u32(((u32(3240) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9a0bec99ee5ea8163858d1b1() {
  return __cxx_static_address_9a0bec99ee5ea8163858d1b1.reference || (__cxx_static_address_9a0bec99ee5ea8163858d1b1.reference = {
    __cReference: true,
    get value() { return BONUSSCREEN____header_global_91a6b86f45cfca44; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:712
export const VIEWBORDER____header_global_cf0f67455ca7de45 = ((u32(((u32(3250) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ed1709c0838e137336659d1a() {
  return __cxx_static_address_ed1709c0838e137336659d1a.reference || (__cxx_static_address_ed1709c0838e137336659d1a.reference = {
    __cReference: true,
    get value() { return VIEWBORDER____header_global_cf0f67455ca7de45; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:713
export const VICTORY1____header_global_8cb66afa880af236 = ((u32(((u32(3260) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_28d29ef0388eba8ac52a8dfd() {
  return __cxx_static_address_28d29ef0388eba8ac52a8dfd.reference || (__cxx_static_address_28d29ef0388eba8ac52a8dfd.reference = {
    __cReference: true,
    get value() { return VICTORY1____header_global_8cb66afa880af236; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:714
export const ORDERING____header_global_ddbf35c89b1b6738 = ((u32(((u32(3270) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2e5ea8ff07668cbd9f75bc04() {
  return __cxx_static_address_2e5ea8ff07668cbd9f75bc04.reference || (__cxx_static_address_2e5ea8ff07668cbd9f75bc04.reference = {
    __cReference: true,
    get value() { return ORDERING____header_global_ddbf35c89b1b6738; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:715
export const TEXTSTORY____header_global_8fa35db70462d44e = ((u32(((u32(3280) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0e342585f623e554c16bcd36() {
  return __cxx_static_address_0e342585f623e554c16bcd36.reference || (__cxx_static_address_0e342585f623e554c16bcd36.reference = {
    __cReference: true,
    get value() { return TEXTSTORY____header_global_8fa35db70462d44e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:716
export const LOADSCREEN____header_global_daeec836c1a57248 = ((u32(((u32(3281) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7d8b80154297ffc53832fc77() {
  return __cxx_static_address_7d8b80154297ffc53832fc77.reference || (__cxx_static_address_7d8b80154297ffc53832fc77.reference = {
    __cReference: true,
    get value() { return LOADSCREEN____header_global_daeec836c1a57248; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:717
export const BORNTOBEWILDSCREEN____header_global_21d613d36df99ad8 = ((u32(((u32(3370) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_972fbab5153de231cbf9109e() {
  return __cxx_static_address_972fbab5153de231cbf9109e.reference || (__cxx_static_address_972fbab5153de231cbf9109e.reference = {
    __cReference: true,
    get value() { return BORNTOBEWILDSCREEN____header_global_21d613d36df99ad8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:718
export const BLIMP____header_global_2d50a320f216ca64 = ((u32(((u32(3400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_af427f2a8d97b1252d29e42f() {
  return __cxx_static_address_af427f2a8d97b1252d29e42f.reference || (__cxx_static_address_af427f2a8d97b1252d29e42f.reference = {
    __cReference: true,
    get value() { return BLIMP____header_global_2d50a320f216ca64; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:719
export const FEM9____header_global_f345de514d5aac9b = ((u32(((u32(3450) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_082b34f251db0841d7c38a6c() {
  return __cxx_static_address_082b34f251db0841d7c38a6c.reference || (__cxx_static_address_082b34f251db0841d7c38a6c.reference = {
    __cReference: true,
    get value() { return FEM9____header_global_f345de514d5aac9b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:720
export const FRAMEEFFECT1_13____header_global_540c473daf359b32 = ((u32(((u32(3999) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8cd4af9db997f6a88f448ba4() {
  return __cxx_static_address_8cd4af9db997f6a88f448ba4.reference || (__cxx_static_address_8cd4af9db997f6a88f448ba4.reference = {
    __cReference: true,
    get value() { return FRAMEEFFECT1_13____header_global_540c473daf359b32; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:721
export const FRAMEEFFECT1____header_global_e48f1b97719b6ae4 = ((u32(((u32(4095) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5a88896c90ea22f90f4f52ee() {
  return __cxx_static_address_5a88896c90ea22f90f4f52ee.reference || (__cxx_static_address_5a88896c90ea22f90f4f52ee.reference = {
    __cReference: true,
    get value() { return FRAMEEFFECT1____header_global_e48f1b97719b6ae4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:722
export const PANNEL3____header_global_57f5b4333367e4d5 = ((u32(((u32(4099) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f96f59f309715cc7f4542c50() {
  return __cxx_static_address_f96f59f309715cc7f4542c50.reference || (__cxx_static_address_f96f59f309715cc7f4542c50.reference = {
    __cReference: true,
    get value() { return PANNEL3____header_global_57f5b4333367e4d5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:723
export const SCREENBREAK14____header_global_bba7b0abb5c2356a = ((u32(((u32(4120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_234b59fc21b2a1537c942c50() {
  return __cxx_static_address_234b59fc21b2a1537c942c50.reference || (__cxx_static_address_234b59fc21b2a1537c942c50.reference = {
    __cReference: true,
    get value() { return SCREENBREAK14____header_global_bba7b0abb5c2356a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:724
export const SCREENBREAK15____header_global_29b12e9612529a68 = ((u32(((u32(4123) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_27c1a9614c120de3c54f3baa() {
  return __cxx_static_address_27c1a9614c120de3c54f3baa.reference || (__cxx_static_address_27c1a9614c120de3c54f3baa.reference = {
    __cReference: true,
    get value() { return SCREENBREAK15____header_global_29b12e9612529a68; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:725
export const SCREENBREAK19____header_global_023c641dbd5a4b70 = ((u32(((u32(4125) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4a07303b503f8b5776c68d4f() {
  return __cxx_static_address_4a07303b503f8b5776c68d4f.reference || (__cxx_static_address_4a07303b503f8b5776c68d4f.reference = {
    __cReference: true,
    get value() { return SCREENBREAK19____header_global_023c641dbd5a4b70; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:726
export const SCREENBREAK16____header_global_3ea50334a96b4101 = ((u32(((u32(4127) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_24c3a591e5c2ef982e012e9c() {
  return __cxx_static_address_24c3a591e5c2ef982e012e9c.reference || (__cxx_static_address_24c3a591e5c2ef982e012e9c.reference = {
    __cReference: true,
    get value() { return SCREENBREAK16____header_global_3ea50334a96b4101; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:727
export const SCREENBREAK17____header_global_76759b92e80077b8 = ((u32(((u32(4128) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2501ca961c5a316d61feddc1() {
  return __cxx_static_address_2501ca961c5a316d61feddc1.reference || (__cxx_static_address_2501ca961c5a316d61feddc1.reference = {
    __cReference: true,
    get value() { return SCREENBREAK17____header_global_76759b92e80077b8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:728
export const SCREENBREAK18____header_global_e71c47c116d24b9b = ((u32(((u32(4129) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_446ff1ab50f8aab22d4ed65a() {
  return __cxx_static_address_446ff1ab50f8aab22d4ed65a.reference || (__cxx_static_address_446ff1ab50f8aab22d4ed65a.reference = {
    __cReference: true,
    get value() { return SCREENBREAK18____header_global_e71c47c116d24b9b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:729
export const W_TECHWALL11____header_global_2887a76c4f835646 = ((u32(((u32(4130) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1191520426b17ad5a76fbd53() {
  return __cxx_static_address_1191520426b17ad5a76fbd53.reference || (__cxx_static_address_1191520426b17ad5a76fbd53.reference = {
    __cReference: true,
    get value() { return W_TECHWALL11____header_global_2887a76c4f835646; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:730
export const W_TECHWALL12____header_global_8e8c9f2019880744 = ((u32(((u32(4131) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f0161df40228e69917caffd8() {
  return __cxx_static_address_f0161df40228e69917caffd8.reference || (__cxx_static_address_f0161df40228e69917caffd8.reference = {
    __cReference: true,
    get value() { return W_TECHWALL12____header_global_8e8c9f2019880744; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:731
export const W_TECHWALL13____header_global_beef23969f32a455 = ((u32(((u32(4132) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f8de30ed4d367583391c169f() {
  return __cxx_static_address_f8de30ed4d367583391c169f.reference || (__cxx_static_address_f8de30ed4d367583391c169f.reference = {
    __cReference: true,
    get value() { return W_TECHWALL13____header_global_beef23969f32a455; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:732
export const W_TECHWALL14____header_global_65ee8aefa1c106de = ((u32(((u32(4133) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4a47eaf55ecc42c31548044c() {
  return __cxx_static_address_4a47eaf55ecc42c31548044c.reference || (__cxx_static_address_4a47eaf55ecc42c31548044c.reference = {
    __cReference: true,
    get value() { return W_TECHWALL14____header_global_65ee8aefa1c106de; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:733
export const W_TECHWALL5____header_global_58e56e9a8bdc8380 = ((u32(((u32(4134) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9a160ad03d4a29c4407215d4() {
  return __cxx_static_address_9a160ad03d4a29c4407215d4.reference || (__cxx_static_address_9a160ad03d4a29c4407215d4.reference = {
    __cReference: true,
    get value() { return W_TECHWALL5____header_global_58e56e9a8bdc8380; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:734
export const W_TECHWALL6____header_global_1cf4966432ac33fd = ((u32(((u32(4136) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_52ecd5647f1af009a7df47d3() {
  return __cxx_static_address_52ecd5647f1af009a7df47d3.reference || (__cxx_static_address_52ecd5647f1af009a7df47d3.reference = {
    __cReference: true,
    get value() { return W_TECHWALL6____header_global_1cf4966432ac33fd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:735
export const W_TECHWALL7____header_global_b52b7db1829c93ea = ((u32(((u32(4138) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_80dfb90755d4bfdfecb78cf7() {
  return __cxx_static_address_80dfb90755d4bfdfecb78cf7.reference || (__cxx_static_address_80dfb90755d4bfdfecb78cf7.reference = {
    __cReference: true,
    get value() { return W_TECHWALL7____header_global_b52b7db1829c93ea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:736
export const W_TECHWALL8____header_global_124f90620ca57cd1 = ((u32(((u32(4140) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e4bd997b314434164274a097() {
  return __cxx_static_address_e4bd997b314434164274a097.reference || (__cxx_static_address_e4bd997b314434164274a097.reference = {
    __cReference: true,
    get value() { return W_TECHWALL8____header_global_124f90620ca57cd1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:737
export const W_TECHWALL9____header_global_0c0f8edc73e69723 = ((u32(((u32(4142) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2a5e92cc3b79ce2eeb69694b() {
  return __cxx_static_address_2a5e92cc3b79ce2eeb69694b.reference || (__cxx_static_address_2a5e92cc3b79ce2eeb69694b.reference = {
    __cReference: true,
    get value() { return W_TECHWALL9____header_global_0c0f8edc73e69723; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:738
export const BPANNEL3____header_global_6ba375c899a4fd84 = ((u32(((u32(4100) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f2c33e1aaac1c7b75cf4b2c8() {
  return __cxx_static_address_f2c33e1aaac1c7b75cf4b2c8.reference || (__cxx_static_address_f2c33e1aaac1c7b75cf4b2c8.reference = {
    __cReference: true,
    get value() { return BPANNEL3____header_global_6ba375c899a4fd84; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:739
export const W_HITTECHWALL16____header_global_a722414cb4f31800 = ((u32(((u32(4144) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_91f49567e21c7a6020c350a6() {
  return __cxx_static_address_91f49567e21c7a6020c350a6.reference || (__cxx_static_address_91f49567e21c7a6020c350a6.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL16____header_global_a722414cb4f31800; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:740
export const W_HITTECHWALL10____header_global_bb39ad5c107e7858 = ((u32(((u32(4145) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a05c80023d30f6b835bf3487() {
  return __cxx_static_address_a05c80023d30f6b835bf3487.reference || (__cxx_static_address_a05c80023d30f6b835bf3487.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL10____header_global_bb39ad5c107e7858; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:741
export const W_HITTECHWALL15____header_global_cea43ddb2ee3f352 = ((u32(((u32(4147) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_804ee3440f45b6a2a5421903() {
  return __cxx_static_address_804ee3440f45b6a2a5421903.reference || (__cxx_static_address_804ee3440f45b6a2a5421903.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL15____header_global_cea43ddb2ee3f352; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:742
export const W_MILKSHELF____header_global_8fcd5f1061e9265a = ((u32(((u32(4181) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_53b4fc385c28a6fb974fbc07() {
  return __cxx_static_address_53b4fc385c28a6fb974fbc07.reference || (__cxx_static_address_53b4fc385c28a6fb974fbc07.reference = {
    __cReference: true,
    get value() { return W_MILKSHELF____header_global_8fcd5f1061e9265a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:743
export const W_MILKSHELFBROKE____header_global_cc23479aeb7fa82a = ((u32(((u32(4203) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a0bce67d270e41013029c5ee() {
  return __cxx_static_address_a0bce67d270e41013029c5ee.reference || (__cxx_static_address_a0bce67d270e41013029c5ee.reference = {
    __cReference: true,
    get value() { return W_MILKSHELFBROKE____header_global_cc23479aeb7fa82a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:744
export const PURPLELAVA____header_global_8b417b18dcd61e7b = ((u32(((u32(4240) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b41d30f0fd92fdd5c0e3eb43() {
  return __cxx_static_address_b41d30f0fd92fdd5c0e3eb43.reference || (__cxx_static_address_b41d30f0fd92fdd5c0e3eb43.reference = {
    __cReference: true,
    get value() { return PURPLELAVA____header_global_8b417b18dcd61e7b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:745
export const TARGET____header_global_c24d1ec76b53fdc9 = ((u32(((u32(4359) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dfcfd94272683a3384e27d83() {
  return __cxx_static_address_dfcfd94272683a3384e27d83.reference || (__cxx_static_address_dfcfd94272683a3384e27d83.reference = {
    __cReference: true,
    get value() { return TARGET____header_global_c24d1ec76b53fdc9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:746
export const DUCK____header_global_c3300798f65462bf = ((u32(((u32(4361) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7bfe2172b4425190588313a6() {
  return __cxx_static_address_7bfe2172b4425190588313a6.reference || (__cxx_static_address_7bfe2172b4425190588313a6.reference = {
    __cReference: true,
    get value() { return DUCK____header_global_c3300798f65462bf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:747
export const PUKE____header_global_3f56601e0ae5cd90 = ((u32(((u32(4389) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_56f81c555a3383229c4b6eda() {
  return __cxx_static_address_56f81c555a3383229c4b6eda.reference || (__cxx_static_address_56f81c555a3383229c4b6eda.reference = {
    __cReference: true,
    get value() { return PUKE____header_global_3f56601e0ae5cd90; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:748
export const DOORTILE23____header_global_db8f4a910c6ec87c = ((u32(((u32(4391) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_489659ba8314af885fbda461() {
  return __cxx_static_address_489659ba8314af885fbda461.reference || (__cxx_static_address_489659ba8314af885fbda461.reference = {
    __cReference: true,
    get value() { return DOORTILE23____header_global_db8f4a910c6ec87c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:749
export const SPEAKER____header_global_237289db63614e26 = ((u32(((u32(4397) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a6ff47d7eb4b75fe404c647d() {
  return __cxx_static_address_a6ff47d7eb4b75fe404c647d.reference || (__cxx_static_address_a6ff47d7eb4b75fe404c647d.reference = {
    __cReference: true,
    get value() { return SPEAKER____header_global_237289db63614e26; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:750
export const MAIL____header_global_cc8b08c766aa63fc = ((u32(((u32(4410) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ad09d4323e66c3653cb2ce8c() {
  return __cxx_static_address_ad09d4323e66c3653cb2ce8c.reference || (__cxx_static_address_ad09d4323e66c3653cb2ce8c.reference = {
    __cReference: true,
    get value() { return MAIL____header_global_cc8b08c766aa63fc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:751
export const HOTMEAT____header_global_cdd15065dc577714 = ((u32(((u32(4427) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ebd45f896ea68e8f05234130() {
  return __cxx_static_address_ebd45f896ea68e8f05234130.reference || (__cxx_static_address_ebd45f896ea68e8f05234130.reference = {
    __cReference: true,
    get value() { return HOTMEAT____header_global_cdd15065dc577714; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:752
export const TRIPODCAMERA____header_global_2362d649c7b24850 = ((u32(((u32(4444) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5cb888964e314186ae5cd680() {
  return __cxx_static_address_5cb888964e314186ae5cd680.reference || (__cxx_static_address_5cb888964e314186ae5cd680.reference = {
    __cReference: true,
    get value() { return TRIPODCAMERA____header_global_2362d649c7b24850; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:753
export const PAPER____header_global_50ce72516c187bf0 = ((u32(((u32(4460) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ae010c8c20b92161209e1c29() {
  return __cxx_static_address_ae010c8c20b92161209e1c29.reference || (__cxx_static_address_ae010c8c20b92161209e1c29.reference = {
    __cReference: true,
    get value() { return PAPER____header_global_50ce72516c187bf0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:754
export const GENERICPOLE2____header_global_3341fc5d8f0713e6 = ((u32(((u32(4465) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_de13371cb55f51e49a6cf66a() {
  return __cxx_static_address_de13371cb55f51e49a6cf66a.reference || (__cxx_static_address_de13371cb55f51e49a6cf66a.reference = {
    __cReference: true,
    get value() { return GENERICPOLE2____header_global_3341fc5d8f0713e6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:755
export const XXXSTACY____header_global_c5da6a634de21471 = ((u32(((u32(4470) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e7cdb34e9fd3f853cd21188c() {
  return __cxx_static_address_e7cdb34e9fd3f853cd21188c.reference || (__cxx_static_address_e7cdb34e9fd3f853cd21188c.reference = {
    __cReference: true,
    get value() { return XXXSTACY____header_global_c5da6a634de21471; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:756
export const LETTER____header_global_9b8f14cfbf510457 = ((u32(((u32(4502) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_67784c53fa78553656076d0c() {
  return __cxx_static_address_67784c53fa78553656076d0c.reference || (__cxx_static_address_67784c53fa78553656076d0c.reference = {
    __cReference: true,
    get value() { return LETTER____header_global_9b8f14cfbf510457; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:757
export const SIDEBOLT1____header_global_846a4a7e5aa838cf = ((u32(((u32(4525) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7d87a786eff1fb17704c84c0() {
  return __cxx_static_address_7d87a786eff1fb17704c84c0.reference || (__cxx_static_address_7d87a786eff1fb17704c84c0.reference = {
    __cReference: true,
    get value() { return SIDEBOLT1____header_global_846a4a7e5aa838cf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:758
export const FOODOBJECT16____header_global_75dd658c5e52dc2b = ((u32(((u32(4545) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a8adc69bfd03a1fe8e7c9255() {
  return __cxx_static_address_a8adc69bfd03a1fe8e7c9255.reference || (__cxx_static_address_a8adc69bfd03a1fe8e7c9255.reference = {
    __cReference: true,
    get value() { return FOODOBJECT16____header_global_75dd658c5e52dc2b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:759
export const TAMPON____header_global_4745cbe331ce0ea9 = ((u32(((u32(4557) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7e07324337cb389ee6e78ebc() {
  return __cxx_static_address_7e07324337cb389ee6e78ebc.reference || (__cxx_static_address_7e07324337cb389ee6e78ebc.reference = {
    __cReference: true,
    get value() { return TAMPON____header_global_4745cbe331ce0ea9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:760
export const CANWITHSOMETHING2____header_global_1c7b3eadee203b4a = ((u32(((u32(4580) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1cf5f98e4b44abadd661811d() {
  return __cxx_static_address_1cf5f98e4b44abadd661811d.reference || (__cxx_static_address_1cf5f98e4b44abadd661811d.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING2____header_global_1c7b3eadee203b4a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:761
export const CANWITHSOMETHING3____header_global_b2fa9ab5b5c8ae34 = ((u32(((u32(4581) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0e497cab2fe74d9df39a8702() {
  return __cxx_static_address_0e497cab2fe74d9df39a8702.reference || (__cxx_static_address_0e497cab2fe74d9df39a8702.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING3____header_global_b2fa9ab5b5c8ae34; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:762
export const CANWITHSOMETHING4____header_global_92762fec165c8491 = ((u32(((u32(4582) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_148b7131ec991a129be8d4e5() {
  return __cxx_static_address_148b7131ec991a129be8d4e5.reference || (__cxx_static_address_148b7131ec991a129be8d4e5.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING4____header_global_92762fec165c8491; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:763
export const DOLPHIN1____header_global_0f50fed89177c5c0 = ((u32(((u32(4591) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2dbc7321cc78e70ef047f284() {
  return __cxx_static_address_2dbc7321cc78e70ef047f284.reference || (__cxx_static_address_2dbc7321cc78e70ef047f284.reference = {
    __cReference: true,
    get value() { return DOLPHIN1____header_global_0f50fed89177c5c0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:764
export const DOLPHIN2____header_global_94e2fd49e7198210 = ((u32(((u32(4592) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fab43865cfd8a62b4969b3f5() {
  return __cxx_static_address_fab43865cfd8a62b4969b3f5.reference || (__cxx_static_address_fab43865cfd8a62b4969b3f5.reference = {
    __cReference: true,
    get value() { return DOLPHIN2____header_global_94e2fd49e7198210; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:765
export const NEWBEAST____header_global_d2687158d4843bfb = ((u32(((u32(4610) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_098a24a81aaaf25931f69082() {
  return __cxx_static_address_098a24a81aaaf25931f69082.reference || (__cxx_static_address_098a24a81aaaf25931f69082.reference = {
    __cReference: true,
    get value() { return NEWBEAST____header_global_d2687158d4843bfb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:766
export const NEWBEASTSTAYPUT____header_global_c5be0708a4a78bdf = ((u32(((u32(4611) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5ee64101d1ba3607c1a039f6() {
  return __cxx_static_address_5ee64101d1ba3607c1a039f6.reference || (__cxx_static_address_5ee64101d1ba3607c1a039f6.reference = {
    __cReference: true,
    get value() { return NEWBEASTSTAYPUT____header_global_c5be0708a4a78bdf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:767
export const BOSS4____header_global_b1f1034709006fcf = ((u32(((u32(4740) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_57ec22eaca30b04dcae18092() {
  return __cxx_static_address_57ec22eaca30b04dcae18092.reference || (__cxx_static_address_57ec22eaca30b04dcae18092.reference = {
    __cReference: true,
    get value() { return BOSS4____header_global_b1f1034709006fcf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:768
export const BOSS4STAYPUT____header_global_561abf544f904f0d = ((u32(((u32(4741) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0438643d1bef5fe78fb804d3() {
  return __cxx_static_address_0438643d1bef5fe78fb804d3.reference || (__cxx_static_address_0438643d1bef5fe78fb804d3.reference = {
    __cReference: true,
    get value() { return BOSS4STAYPUT____header_global_561abf544f904f0d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:769
export const FEM10____header_global_9174ffc9a07231d3 = ((u32(((u32(4864) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0a9e8f61205b19eac1f5cac4() {
  return __cxx_static_address_0a9e8f61205b19eac1f5cac4.reference || (__cxx_static_address_0a9e8f61205b19eac1f5cac4.reference = {
    __cReference: true,
    get value() { return FEM10____header_global_9174ffc9a07231d3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:770
export const TOUGHGAL____header_global_eb1037f36e4a1dc2 = ((u32(((u32(4866) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_69d5bd8c73a08151dfa46f20() {
  return __cxx_static_address_69d5bd8c73a08151dfa46f20.reference || (__cxx_static_address_69d5bd8c73a08151dfa46f20.reference = {
    __cReference: true,
    get value() { return TOUGHGAL____header_global_eb1037f36e4a1dc2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:771
export const MAN____header_global_f97ac7437044cc8e = ((u32(((u32(4871) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_42d9bfa5c6b69fdeee60eeb1() {
  return __cxx_static_address_42d9bfa5c6b69fdeee60eeb1.reference || (__cxx_static_address_42d9bfa5c6b69fdeee60eeb1.reference = {
    __cReference: true,
    get value() { return MAN____header_global_f97ac7437044cc8e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:772
export const MAN2____header_global_24788d39a2e43b29 = ((u32(((u32(4872) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_484d053085d19ee377bb1b1f() {
  return __cxx_static_address_484d053085d19ee377bb1b1f.reference || (__cxx_static_address_484d053085d19ee377bb1b1f.reference = {
    __cReference: true,
    get value() { return MAN2____header_global_24788d39a2e43b29; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:773
export const WOMAN____header_global_1d76ff04b34b9e00 = ((u32(((u32(4874) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a002bdca62dfdd9705683697() {
  return __cxx_static_address_a002bdca62dfdd9705683697.reference || (__cxx_static_address_a002bdca62dfdd9705683697.reference = {
    __cReference: true,
    get value() { return WOMAN____header_global_1d76ff04b34b9e00; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:774
export const NATURALLIGHTNING____header_global_58af4e61232f47b8 = ((u32(((u32(4890) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a146150e50e9b2303c799653() {
  return __cxx_static_address_a146150e50e9b2303c799653.reference || (__cxx_static_address_a146150e50e9b2303c799653.reference = {
    __cReference: true,
    get value() { return NATURALLIGHTNING____header_global_58af4e61232f47b8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:775
export const WEATHERWARN____header_global_0d0f0e94862bceb7 = ((u32(((u32(4893) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_51a1942f07cc41afdecd9d4f() {
  return __cxx_static_address_51a1942f07cc41afdecd9d4f.reference || (__cxx_static_address_51a1942f07cc41afdecd9d4f.reference = {
    __cReference: true,
    get value() { return WEATHERWARN____header_global_0d0f0e94862bceb7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:776
export const DUKETAG____header_global_b30a3963eb992677 = ((u32(((u32(4900) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2999fbb51151997f169e6596() {
  return __cxx_static_address_2999fbb51151997f169e6596.reference || (__cxx_static_address_2999fbb51151997f169e6596.reference = {
    __cReference: true,
    get value() { return DUKETAG____header_global_b30a3963eb992677; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:777
export const SIGN1____header_global_562c1e3c6173f40a = ((u32(((u32(4909) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dc58052d70cf7cb00f3e830e() {
  return __cxx_static_address_dc58052d70cf7cb00f3e830e.reference || (__cxx_static_address_dc58052d70cf7cb00f3e830e.reference = {
    __cReference: true,
    get value() { return SIGN1____header_global_562c1e3c6173f40a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:778
export const SIGN2____header_global_d949cb24c3eeab00 = ((u32(((u32(4912) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5b7d6ed00fb43ca3f5a2a8e2() {
  return __cxx_static_address_5b7d6ed00fb43ca3f5a2a8e2.reference || (__cxx_static_address_5b7d6ed00fb43ca3f5a2a8e2.reference = {
    __cReference: true,
    get value() { return SIGN2____header_global_d949cb24c3eeab00; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:779
export const JURYGUY____header_global_c441025832fa6d53 = ((u32(((u32(4943) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_45df297bc1101fcfb7ffc7b1() {
  return __cxx_static_address_45df297bc1101fcfb7ffc7b1.reference || (__cxx_static_address_45df297bc1101fcfb7ffc7b1.reference = {
    __cReference: true,
    get value() { return JURYGUY____header_global_c441025832fa6d53; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:780
export const WIDESCREENSTATUSBAR____header_global_e19a5ede0a350389 = ((u32(((u32(5120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e2ff0925b7a6d3079522545f() {
  return __cxx_static_address_e2ff0925b7a6d3079522545f.reference || (__cxx_static_address_e2ff0925b7a6d3079522545f.reference = {
    __cReference: true,
    get value() { return WIDESCREENSTATUSBAR____header_global_e19a5ede0a350389; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:781
export const RPGGUNWIDE____header_global_b7f7dbcfb05ab078 = ((u32(((u32(5121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7c1accdcbefb555da45ed98a() {
  return __cxx_static_address_7c1accdcbefb555da45ed98a.reference || (__cxx_static_address_7c1accdcbefb555da45ed98a.reference = {
    __cReference: true,
    get value() { return RPGGUNWIDE____header_global_b7f7dbcfb05ab078; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:782
export const FIRSTGUNRELOADWIDE____header_global_8353778d0401261a = ((u32(((u32(5122) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8b72946d62468cba26e11b70() {
  return __cxx_static_address_8b72946d62468cba26e11b70.reference || (__cxx_static_address_8b72946d62468cba26e11b70.reference = {
    __cReference: true,
    get value() { return FIRSTGUNRELOADWIDE____header_global_8353778d0401261a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:783
export const FREEZEWIDE____header_global_c84dab49d42c91f2 = ((u32(((u32(5123) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_47c9acb06a37d447f03fd242() {
  return __cxx_static_address_47c9acb06a37d447f03fd242.reference || (__cxx_static_address_47c9acb06a37d447f03fd242.reference = {
    __cReference: true,
    get value() { return FREEZEWIDE____header_global_c84dab49d42c91f2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:784
export const FREEZEFIREWIDE____header_global_b6702d124353d689 = ((u32(((u32(5124) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aae0e459bfd3a7bfc0c2783a() {
  return __cxx_static_address_aae0e459bfd3a7bfc0c2783a.reference || (__cxx_static_address_aae0e459bfd3a7bfc0c2783a.reference = {
    __cReference: true,
    get value() { return FREEZEFIREWIDE____header_global_b6702d124353d689; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:785
export const SHRINKERWIDE____header_global_a030bec73ac05051 = ((u32(((u32(5127) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d4dd6c8a4face9d38d6267e8() {
  return __cxx_static_address_d4dd6c8a4face9d38d6267e8.reference || (__cxx_static_address_d4dd6c8a4face9d38d6267e8.reference = {
    __cReference: true,
    get value() { return SHRINKERWIDE____header_global_a030bec73ac05051; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:786
export const CRACKKNUCKLESWIDE____header_global_86d413b238bcde4e = ((u32(((u32(5129) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_37feb313f753fc86a01c56c5() {
  return __cxx_static_address_37feb313f753fc86a01c56c5.reference || (__cxx_static_address_37feb313f753fc86a01c56c5.reference = {
    __cReference: true,
    get value() { return CRACKKNUCKLESWIDE____header_global_86d413b238bcde4e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:787
export const FLAMETHROWERSPRITE____header_global_389c77dbd6c421f1 = ((u32(((u32(5134) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e634f8980cd46382b85b252f() {
  return __cxx_static_address_e634f8980cd46382b85b252f.reference || (__cxx_static_address_e634f8980cd46382b85b252f.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERSPRITE____header_global_389c77dbd6c421f1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:788
export const FLAMETHROWERAMMO____header_global_ae89eb3badcd3c43 = ((u32(((u32(5135) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_990777494db587749a91e3a0() {
  return __cxx_static_address_990777494db587749a91e3a0.reference || (__cxx_static_address_990777494db587749a91e3a0.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERAMMO____header_global_ae89eb3badcd3c43; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:789
export const FLAMETHROWER____header_global_dce714f9a99685ee = ((u32(((u32(5138) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9add465230ed58c3d56106d9() {
  return __cxx_static_address_9add465230ed58c3d56106d9.reference || (__cxx_static_address_9add465230ed58c3d56106d9.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER____header_global_dce714f9a99685ee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:790
export const FLAMETHROWERFIRE____header_global_8634061a8a9c75f5 = ((u32(((u32(5139) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5e117c4db71f442d712abf8b() {
  return __cxx_static_address_5e117c4db71f442d712abf8b.reference || (__cxx_static_address_5e117c4db71f442d712abf8b.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERFIRE____header_global_8634061a8a9c75f5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:791
export const FLAMETHROWERFLAME____header_global_287c91c68720a879 = ((u32(((u32(1891) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c1f3c7a986f0ecfb9e6bf7e6() {
  return __cxx_static_address_c1f3c7a986f0ecfb9e6bf7e6.reference || (__cxx_static_address_c1f3c7a986f0ecfb9e6bf7e6.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERFLAME____header_global_287c91c68720a879; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:792
export const FLAMETHROWERPILOT____header_global_2c09a5439868be32 = ((u32(((u32(5174) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1d63753f8748b24918dbeb3c() {
  return __cxx_static_address_1d63753f8748b24918dbeb3c.reference || (__cxx_static_address_1d63753f8748b24918dbeb3c.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERPILOT____header_global_2c09a5439868be32; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:793
export const FIREBALL____header_global_629be7d5934070ad = ((u32(((u32(5163) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_60f0fc82f588d8b50129c70f() {
  return __cxx_static_address_60f0fc82f588d8b50129c70f.reference || (__cxx_static_address_60f0fc82f588d8b50129c70f.reference = {
    __cReference: true,
    get value() { return FIREBALL____header_global_629be7d5934070ad; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:794
export const ONFIRE____header_global_5904a3e9d70fb0a3 = ((u32(((u32(5152) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a62b0f94d96e8dfa69493ce7() {
  return __cxx_static_address_a62b0f94d96e8dfa69493ce7.reference || (__cxx_static_address_a62b0f94d96e8dfa69493ce7.reference = {
    __cReference: true,
    get value() { return ONFIRE____header_global_5904a3e9d70fb0a3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:795
export const ONFIRESMOKE____header_global_895d69c923545229 = ((u32(((u32(5143) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_95dd0a609efbe96fd93bef6b() {
  return __cxx_static_address_95dd0a609efbe96fd93bef6b.reference || (__cxx_static_address_95dd0a609efbe96fd93bef6b.reference = {
    __cReference: true,
    get value() { return ONFIRESMOKE____header_global_895d69c923545229; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:796
export const BURNEDCORPSE____header_global_3d52d2cce84f451e = ((u32(((u32(5173) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fa7b9bd2322314ccf0ca2965() {
  return __cxx_static_address_fa7b9bd2322314ccf0ca2965.reference || (__cxx_static_address_fa7b9bd2322314ccf0ca2965.reference = {
    __cReference: true,
    get value() { return BURNEDCORPSE____header_global_3d52d2cce84f451e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:797
export const WHISPYSMOKE____header_global_be72ac5fa8e66331 = ((u32(((u32(5268) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2c407dfdcd048ea78bd8a4a4() {
  return __cxx_static_address_2c407dfdcd048ea78bd8a4a4.reference || (__cxx_static_address_2c407dfdcd048ea78bd8a4a4.reference = {
    __cReference: true,
    get value() { return WHISPYSMOKE____header_global_be72ac5fa8e66331; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:798
export const FIREFLY____header_global_0818b3cb51ba69d4 = ((u32(((u32(5180) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d4071508511db3810f3f559b() {
  return __cxx_static_address_d4071508511db3810f3f559b.reference || (__cxx_static_address_d4071508511db3810f3f559b.reference = {
    __cReference: true,
    get value() { return FIREFLY____header_global_0818b3cb51ba69d4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:799
export const FIREFLYSHRINKEFFECT____header_global_3fa5151ab6b0eaaa = ((u32(((u32(5360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_185c7e89753a8d2a5558c914() {
  return __cxx_static_address_185c7e89753a8d2a5558c914.reference || (__cxx_static_address_185c7e89753a8d2a5558c914.reference = {
    __cReference: true,
    get value() { return FIREFLYSHRINKEFFECT____header_global_3fa5151ab6b0eaaa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:800
export const FIREFLYGROWEFFECT____header_global_4674fadad1f3b78d = ((u32(((u32(5367) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b6181517c4883aa9b5cfbc8f() {
  return __cxx_static_address_b6181517c4883aa9b5cfbc8f.reference || (__cxx_static_address_b6181517c4883aa9b5cfbc8f.reference = {
    __cReference: true,
    get value() { return FIREFLYGROWEFFECT____header_global_4674fadad1f3b78d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:801
export const FIREFLYFLYINGEFFECT____header_global_0e0d0899f2080e3b = ((u32(((u32(5296) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_494d611aac5019886187d504() {
  return __cxx_static_address_494d611aac5019886187d504.reference || (__cxx_static_address_494d611aac5019886187d504.reference = {
    __cReference: true,
    get value() { return FIREFLYFLYINGEFFECT____header_global_0e0d0899f2080e3b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:802
export const BOSS5____header_global_27a52023c9f4b0f4 = ((u32(((u32(5310) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d61cae00ca768fa830b2e22b() {
  return __cxx_static_address_d61cae00ca768fa830b2e22b.reference || (__cxx_static_address_d61cae00ca768fa830b2e22b.reference = {
    __cReference: true,
    get value() { return BOSS5____header_global_27a52023c9f4b0f4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:803
export const BOSS5STAYPUT____header_global_8e0c19f7d1da5ba8 = ((u32(((u32(5311) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a3ae664b6ec76f643a95f104() {
  return __cxx_static_address_a3ae664b6ec76f643a95f104.reference || (__cxx_static_address_a3ae664b6ec76f643a95f104.reference = {
    __cReference: true,
    get value() { return BOSS5STAYPUT____header_global_8e0c19f7d1da5ba8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:804
export const LAVAPOOL____header_global_959a7a903c188f72 = ((u32(((u32(5304) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_335ecd3c50455000ae946cc2() {
  return __cxx_static_address_335ecd3c50455000ae946cc2.reference || (__cxx_static_address_335ecd3c50455000ae946cc2.reference = {
    __cReference: true,
    get value() { return LAVAPOOL____header_global_959a7a903c188f72; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:805
export const LAVASPLASH____header_global_c9a3f1e5f3c9b06d = ((u32(((u32(5371) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_81b97933b72526a9edb457a4() {
  return __cxx_static_address_81b97933b72526a9edb457a4.reference || (__cxx_static_address_81b97933b72526a9edb457a4.reference = {
    __cReference: true,
    get value() { return LAVASPLASH____header_global_c9a3f1e5f3c9b06d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:806
export const LAVAPOOLBUBBLE____header_global_4008c4ba2ca61691 = ((u32(((u32(5207) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ea4bc6ede7668b91a047b10a() {
  return __cxx_static_address_ea4bc6ede7668b91a047b10a.reference || (__cxx_static_address_ea4bc6ede7668b91a047b10a.reference = {
    __cReference: true,
    get value() { return LAVAPOOLBUBBLE____header_global_4008c4ba2ca61691; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:807
export const BOSS2STAYPUT____header_global_675eacb2930f23b0 = ((u32(((u32(2711) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bc754bb046dc925eef029d35() {
  return __cxx_static_address_bc754bb046dc925eef029d35.reference || (__cxx_static_address_bc754bb046dc925eef029d35.reference = {
    __cReference: true,
    get value() { return BOSS2STAYPUT____header_global_675eacb2930f23b0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:808
export const BOSS3STAYPUT____header_global_412d23f011e7265e = ((u32(((u32(2761) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_927da4e0827c31c499ec4d6d() {
  return __cxx_static_address_927da4e0827c31c499ec4d6d.reference || (__cxx_static_address_927da4e0827c31c499ec4d6d.reference = {
    __cReference: true,
    get value() { return BOSS3STAYPUT____header_global_412d23f011e7265e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:809
export const E32_TILE5736____header_global_2d9dfade84088017 = ((u32(((u32(5736) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_161dafb02e2186044aeec3a8() {
  return __cxx_static_address_161dafb02e2186044aeec3a8.reference || (__cxx_static_address_161dafb02e2186044aeec3a8.reference = {
    __cReference: true,
    get value() { return E32_TILE5736____header_global_2d9dfade84088017; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:810
export const E32_TILE5737____header_global_22a239f6c7192edb = ((u32(((u32(5737) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bbb8746eb6d23a24d74f2ace() {
  return __cxx_static_address_bbb8746eb6d23a24d74f2ace.reference || (__cxx_static_address_bbb8746eb6d23a24d74f2ace.reference = {
    __cReference: true,
    get value() { return E32_TILE5737____header_global_22a239f6c7192edb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:811
export const E32_TILE5846____header_global_c23782c6c2eac32d = ((u32(((u32(5846) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_22035a3c820bd721ee54c4c6() {
  return __cxx_static_address_22035a3c820bd721ee54c4c6.reference || (__cxx_static_address_22035a3c820bd721ee54c4c6.reference = {
    __cReference: true,
    get value() { return E32_TILE5846____header_global_c23782c6c2eac32d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/network.h:180
export const cSnapshotMemUsage__header_global_6edc86ee06e99677 = u64((BigInt(u64(64)) * BigInt(u64((BigInt(u64((BigInt(u64((BigInt(72) * BigInt(u64(16384))))) + BigInt(u64((BigInt(96) * BigInt(u64(4096)))))))) + BigInt(u64((BigInt(296) * BigInt(u64(16384))))))))));
function __cxx_static_address_7f8c0cd5ab0c98c0c31057e6() {
  return __cxx_static_address_7f8c0cd5ab0c98c0c31057e6.reference || (__cxx_static_address_7f8c0cd5ab0c98c0c31057e6.reference = {
    __cReference: true,
    get value() { return cSnapshotMemUsage__header_global_6edc86ee06e99677; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export function __cxx_record_DivResult_ce7f2ecf40eaf5e2() {
  return __cxx_record_DivResult_ce7f2ecf40eaf5e2.type || (__cxx_record_DivResult_ce7f2ecf40eaf5e2.type = class __cxx_record_DivResult_ce7f2ecf40eaf5e2__implementation {
  constructor() {
    return Object.setPrototypeOf(cZeroAggregate({"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"q": {"native": "BigUint64Array", "offset": 0, "size": 8}, "r": {"native": "BigUint64Array", "offset": 8, "size": 8}}, "overlaps": false, "size": 16, "union": false}}, {}), new.target.prototype);
  }
});
}

// C/C++ source: source/duke3d/src/gamevars.cpp:30
export let aGameVars = cByteRecordNDArray({"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, [2048], {}, cStaticInitializerValues([]));
function __cxx_static_address_6957e6da908f35038ac6f85b() {
  return __cxx_static_address_6957e6da908f35038ac6f85b.reference || (__cxx_static_address_6957e6da908f35038ac6f85b.reference = {
    __cReference: true,
    get value() { return aGameVars; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/gamevars.cpp:31
export let aGameArrays = cByteRecordNDArray({"align": 1, "arrayAlign": 1, "fields": {"flags": {"native": "BigUint64Array", "offset": 24, "size": 8}, "pValues": {"offset": 8, "pointer": true, "size": 8}, "size": {"native": "BigInt64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "size": 32, "union": false}, [512], {}, cStaticInitializerValues([]));
function __cxx_static_address_fc8cf15cbe1518220404870b() {
  return __cxx_static_address_fc8cf15cbe1518220404870b.reference || (__cxx_static_address_fc8cf15cbe1518220404870b.reference = {
    __cReference: true,
    get value() { return aGameArrays; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/gamevars.cpp:32
export let g_gameVarCount = i32(0);
export function __cxx_global_cell_8406f8e86b0ce3102350571c() {
  return __cxx_global_cell_8406f8e86b0ce3102350571c.reference || (__cxx_global_cell_8406f8e86b0ce3102350571c.reference = {
    __cReference: true,
    get value() { return g_gameVarCount; },
    set value(__cxx_lvalue_0) { g_gameVarCount = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/include/fix16.h:31
export const FIX16_MAX__header_global_6393476090d63e88 = i32(2147483647);
function __cxx_static_address_b38952a3acae6e9e9b264646() {
  return __cxx_static_address_b38952a3acae6e9e9b264646.reference || (__cxx_static_address_b38952a3acae6e9e9b264646.reference = {
    __cReference: true,
    get value() { return FIX16_MAX__header_global_6393476090d63e88; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:32
export const FIX16_MIN__header_global_1b58ba5c6129c83e = i32(2147483648);
function __cxx_static_address_d616b511547b025b3563aa66() {
  return __cxx_static_address_d616b511547b025b3563aa66.reference || (__cxx_static_address_d616b511547b025b3563aa66.reference = {
    __cReference: true,
    get value() { return FIX16_MIN__header_global_1b58ba5c6129c83e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:33
export const FIX16_OVERFLOW__header_global_cd90c98b79eece88 = i32(2147483648);
function __cxx_static_address_2b5425dc99f2044133dd5608() {
  return __cxx_static_address_2b5425dc99f2044133dd5608.reference || (__cxx_static_address_2b5425dc99f2044133dd5608.reference = {
    __cReference: true,
    get value() { return FIX16_OVERFLOW__header_global_cd90c98b79eece88; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:35
export const fix16_one__header_global_ed8aba31ba5aa8d6 = i32(65536);
function __cxx_static_address_7c2e80734db91702d5970da1() {
  return __cxx_static_address_7c2e80734db91702d5970da1.reference || (__cxx_static_address_7c2e80734db91702d5970da1.reference = {
    __cReference: true,
    get value() { return fix16_one__header_global_ed8aba31ba5aa8d6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:36
export const fix16_half__header_global_165cc7a41fb44aa1 = i32(32768);
function __cxx_static_address_5390d42be36132d773ba0957() {
  return __cxx_static_address_5390d42be36132d773ba0957.reference || (__cxx_static_address_5390d42be36132d773ba0957.reference = {
    __cReference: true,
    get value() { return fix16_half__header_global_165cc7a41fb44aa1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:37
export const flt_f161r__header_global_1f47940a69d8fc2e = Math.fround(Math.fround((Math.fround(1) / Math.fround(65536))));
function __cxx_static_address_bc13b0bd219388ab201949a7() {
  return __cxx_static_address_bc13b0bd219388ab201949a7.reference || (__cxx_static_address_bc13b0bd219388ab201949a7.reference = {
    __cReference: true,
    get value() { return flt_f161r__header_global_1f47940a69d8fc2e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/gamevars.cpp:33
export let g_gameArrayCount = i32(0);
export function __cxx_global_cell_312b58e8a14f852e3cc5e7e0() {
  return __cxx_global_cell_312b58e8a14f852e3cc5e7e0.reference || (__cxx_global_cell_312b58e8a14f852e3cc5e7e0.reference = {
    __cReference: true,
    get value() { return g_gameArrayCount; },
    set value(__cxx_lvalue_0) { g_gameArrayCount = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/gamevars.cpp:36
export let aplWeaponClip = cPointerArray(13);
function __cxx_static_address_190dd4a896c9594298dc47ae() {
  return __cxx_static_address_190dd4a896c9594298dc47ae.reference || (__cxx_static_address_190dd4a896c9594298dc47ae.reference = {
    __cReference: true,
    get value() { return aplWeaponClip; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/gamevars.cpp:37
export let aplWeaponFireDelay = cPointerArray(13);
function __cxx_static_address_6b0e0fe333c59213da558759() {
  return __cxx_static_address_6b0e0fe333c59213da558759.reference || (__cxx_static_address_6b0e0fe333c59213da558759.reference = {
    __cReference: true,
    get value() { return aplWeaponFireDelay; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/gamevars.cpp:38
export let aplWeaponFireSound = cPointerArray(13);
function __cxx_static_address_c410851d6be078d278fa97fd() {
  return __cxx_static_address_c410851d6be078d278fa97fd.reference || (__cxx_static_address_c410851d6be078d278fa97fd.reference = {
    __cReference: true,
    get value() { return aplWeaponFireSound; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/gamevars.cpp:39
export let aplWeaponFlags = cPointerArray(13);
function __cxx_static_address_7c6132b2216bf1dd03d45759() {
  return __cxx_static_address_7c6132b2216bf1dd03d45759.reference || (__cxx_static_address_7c6132b2216bf1dd03d45759.reference = {
    __cReference: true,
    get value() { return aplWeaponFlags; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/gamevars.cpp:40
export let aplWeaponFlashColor = cPointerArray(13);
function __cxx_static_address_48e327d23eb76f0cbc06df2f() {
  return __cxx_static_address_48e327d23eb76f0cbc06df2f.reference || (__cxx_static_address_48e327d23eb76f0cbc06df2f.reference = {
    __cReference: true,
    get value() { return aplWeaponFlashColor; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/gamevars.cpp:41
export let aplWeaponHoldDelay = cPointerArray(13);
function __cxx_static_address_d50a83ecc154974f8df2427d() {
  return __cxx_static_address_d50a83ecc154974f8df2427d.reference || (__cxx_static_address_d50a83ecc154974f8df2427d.reference = {
    __cReference: true,
    get value() { return aplWeaponHoldDelay; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/gamevars.cpp:42
export let aplWeaponInitialSound = cPointerArray(13);
function __cxx_static_address_7edbb228c0638f428d178bed() {
  return __cxx_static_address_7edbb228c0638f428d178bed.reference || (__cxx_static_address_7edbb228c0638f428d178bed.reference = {
    __cReference: true,
    get value() { return aplWeaponInitialSound; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/gamevars.cpp:43
export let aplWeaponReload = cPointerArray(13);
function __cxx_static_address_7071c53d8f60069d5069c695() {
  return __cxx_static_address_7071c53d8f60069d5069c695.reference || (__cxx_static_address_7071c53d8f60069d5069c695.reference = {
    __cReference: true,
    get value() { return aplWeaponReload; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/gamevars.cpp:44
export let aplWeaponReloadSound1 = cPointerArray(13);
function __cxx_static_address_1c3455ce6a3d00f79ec77c4a() {
  return __cxx_static_address_1c3455ce6a3d00f79ec77c4a.reference || (__cxx_static_address_1c3455ce6a3d00f79ec77c4a.reference = {
    __cReference: true,
    get value() { return aplWeaponReloadSound1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/gamevars.cpp:45
export let aplWeaponReloadSound2 = cPointerArray(13);
function __cxx_static_address_0dff6e6c2e41efd1b88a73bd() {
  return __cxx_static_address_0dff6e6c2e41efd1b88a73bd.reference || (__cxx_static_address_0dff6e6c2e41efd1b88a73bd.reference = {
    __cReference: true,
    get value() { return aplWeaponReloadSound2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/gamevars.cpp:46
export let aplWeaponSelectSound = cPointerArray(13);
function __cxx_static_address_81acab1ece9a64f442e3eef4() {
  return __cxx_static_address_81acab1ece9a64f442e3eef4.reference || (__cxx_static_address_81acab1ece9a64f442e3eef4.reference = {
    __cReference: true,
    get value() { return aplWeaponSelectSound; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/gamevars.cpp:47
export let aplWeaponShoots = cPointerArray(13);
function __cxx_static_address_676faa31d88e5afbbf9ab22b() {
  return __cxx_static_address_676faa31d88e5afbbf9ab22b.reference || (__cxx_static_address_676faa31d88e5afbbf9ab22b.reference = {
    __cReference: true,
    get value() { return aplWeaponShoots; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/gamevars.cpp:48
export let aplWeaponShotsPerBurst = cPointerArray(13);
function __cxx_static_address_c7549d81690e64b4dd75a3dc() {
  return __cxx_static_address_c7549d81690e64b4dd75a3dc.reference || (__cxx_static_address_c7549d81690e64b4dd75a3dc.reference = {
    __cReference: true,
    get value() { return aplWeaponShotsPerBurst; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/gamevars.cpp:49
export let aplWeaponSound2Sound = cPointerArray(13);
function __cxx_static_address_f46a2b24027a87698988715c() {
  return __cxx_static_address_f46a2b24027a87698988715c.reference || (__cxx_static_address_f46a2b24027a87698988715c.reference = {
    __cReference: true,
    get value() { return aplWeaponSound2Sound; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/gamevars.cpp:50
export let aplWeaponSound2Time = cPointerArray(13);
function __cxx_static_address_f80e7c2e86daa8f580b0e1f9() {
  return __cxx_static_address_f80e7c2e86daa8f580b0e1f9.reference || (__cxx_static_address_f80e7c2e86daa8f580b0e1f9.reference = {
    __cReference: true,
    get value() { return aplWeaponSound2Time; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/gamevars.cpp:51
export let aplWeaponSpawn = cPointerArray(13);
function __cxx_static_address_d3a84d54c1de321f41bff2ca() {
  return __cxx_static_address_d3a84d54c1de321f41bff2ca.reference || (__cxx_static_address_d3a84d54c1de321f41bff2ca.reference = {
    __cReference: true,
    get value() { return aplWeaponSpawn; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/gamevars.cpp:52
export let aplWeaponSpawnTime = cPointerArray(13);
function __cxx_static_address_5499a09950d6f53ec41fd7f9() {
  return __cxx_static_address_5499a09950d6f53ec41fd7f9.reference || (__cxx_static_address_5499a09950d6f53ec41fd7f9.reference = {
    __cReference: true,
    get value() { return aplWeaponSpawnTime; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/gamevars.cpp:53
export let aplWeaponTotalTime = cPointerArray(13);
function __cxx_static_address_4f7d8c70b06127a4646fb4e0() {
  return __cxx_static_address_4f7d8c70b06127a4646fb4e0.reference || (__cxx_static_address_4f7d8c70b06127a4646fb4e0.reference = {
    __cReference: true,
    get value() { return aplWeaponTotalTime; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/gamevars.cpp:54
export let aplWeaponWorksLike = cPointerArray(13);
function __cxx_static_address_de50815adb8560004c20dc3c() {
  return __cxx_static_address_de50815adb8560004c20dc3c.reference || (__cxx_static_address_de50815adb8560004c20dc3c.reference = {
    __cReference: true,
    get value() { return aplWeaponWorksLike; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/gamevars.cpp:111
export const s_gamevars = (() => { const bytes = new Uint8Array(9); bytes.set([67, 79, 78, 58, 118, 97, 114, 115]); return bytes; })();
function __cxx_static_address_1264e0d8ab09d63e8bfc68e3() {
  return __cxx_static_address_1264e0d8ab09d63e8bfc68e3.reference || (__cxx_static_address_1264e0d8ab09d63e8bfc68e3.reference = {
    __cReference: true,
    get value() { return s_gamevars; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_1264e0d8ab09d63e8bfc68e3() { return __cxx_static_address_1264e0d8ab09d63e8bfc68e3(); }

// C/C++ source: source/duke3d/src/gamevars.cpp:112
export const s_arrays = (() => { const bytes = new Uint8Array(9); bytes.set([67, 79, 78, 58, 97, 114, 114, 121]); return bytes; })();
function __cxx_static_address_30a3fcf4606560cb417f7e2b() {
  return __cxx_static_address_30a3fcf4606560cb417f7e2b.reference || (__cxx_static_address_30a3fcf4606560cb417f7e2b.reference = {
    __cReference: true,
    get value() { return s_arrays; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_30a3fcf4606560cb417f7e2b() { return __cxx_static_address_30a3fcf4606560cb417f7e2b(); }

// C/C++ source: source/duke3d/src/gamevars.cpp:113
export const s_mapstate = (() => { const bytes = new Uint8Array(9); bytes.set([67, 79, 78, 58, 119, 114, 108, 100]); return bytes; })();
function __cxx_static_address_69297b829ae0686815af2e28() {
  return __cxx_static_address_69297b829ae0686815af2e28.reference || (__cxx_static_address_69297b829ae0686815af2e28.reference = {
    __cReference: true,
    get value() { return s_mapstate; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_69297b829ae0686815af2e28() { return __cxx_static_address_69297b829ae0686815af2e28(); }

// C/C++ source: source/duke3d/src/gamevars.cpp:114
export const s_EOF = (() => { const bytes = new Uint8Array(16); bytes.set([69, 51, 50, 83, 65, 86, 69, 71, 65, 77, 69, 95, 69, 79, 70]); return bytes; })();
function __cxx_static_address_fef565457c4f69f6124b5acd() {
  return __cxx_static_address_fef565457c4f69f6124b5acd.reference || (__cxx_static_address_fef565457c4f69f6124b5acd.reference = {
    __cReference: true,
    get value() { return s_EOF; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_fef565457c4f69f6124b5acd() { return __cxx_static_address_fef565457c4f69f6124b5acd(); }

// C/C++ source: source/duke3d/src/gamevars.cpp:130
export const s_gv_len = i32(strlen(s_gamevars));
function __cxx_static_address_f62644c3dcfd8f894703e249() {
  return __cxx_static_address_f62644c3dcfd8f894703e249.reference || (__cxx_static_address_f62644c3dcfd8f894703e249.reference = {
    __cReference: true,
    get value() { return s_gv_len; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/gamevars.cpp:131
export const s_ar_len = i32(strlen(s_arrays));
function __cxx_static_address_445a05ff0e2c9cc3255096d4() {
  return __cxx_static_address_445a05ff0e2c9cc3255096d4.reference || (__cxx_static_address_445a05ff0e2c9cc3255096d4.reference = {
    __cReference: true,
    get value() { return s_ar_len; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/gamevars.cpp:905
const __cxx_literal_d260be1e973f0be54546 = Uint8Array.from([47, 47, 32, 67, 117, 114, 114, 101, 110, 116, 32, 71, 97, 109, 101, 32, 68, 101, 102, 105, 110, 105, 116, 105, 111, 110, 115, 10, 10, 0]);
const __cxx_literal_5fac00c7e982dff8e92c = Uint8Array.from([103, 97, 109, 101, 118, 97, 114, 32, 0]);
const __cxx_literal_ffe8db6b1351eebae0ad = Uint8Array.from([32, 0]);
const __cxx_literal_9508d0b75d9a8d07ed0c = Uint8Array.from([32, 71, 65, 77, 69, 86, 65, 82, 95, 80, 69, 82, 80, 76, 65, 89, 69, 82, 0]);
const __cxx_literal_fe9e1ac8ce436f3f9c43 = Uint8Array.from([32, 71, 65, 77, 69, 86, 65, 82, 95, 80, 69, 82, 65, 67, 84, 79, 82, 0]);
const __cxx_literal_70d28ada55fd90e6336a = Uint8Array.from([32, 0]);
const __cxx_literal_a50120c25d5a68d20d94 = Uint8Array.from([32, 47, 47, 32, 0]);
const __cxx_literal_bb8d1769108f147bde67 = Uint8Array.from([32, 40, 115, 121, 115, 116, 101, 109, 41, 0]);
const __cxx_literal_190fcec545cfd2f6e446 = Uint8Array.from([32, 40, 112, 111, 105, 110, 116, 101, 114, 41, 0]);
const __cxx_literal_09580558fc52db77f6a0 = Uint8Array.from([32, 40, 114, 101, 97, 100, 32, 111, 110, 108, 121, 41, 0]);
const __cxx_literal_970f3d335e6bb17c9d0b = Uint8Array.from([32, 40, 115, 112, 101, 99, 105, 97, 108, 41, 0]);
const __cxx_literal_938f5d537616813ddb0d = Uint8Array.from([10, 0]);
const __cxx_literal_73e75ad48f543e773485 = Uint8Array.from([10, 47, 47, 32, 101, 110, 100, 32, 111, 102, 32, 103, 97, 109, 101, 32, 100, 101, 102, 105, 110, 105, 116, 105, 111, 110, 115, 10, 0]);
export function Gv_DumpValues() {
  buildprint__template_d684cd61d5016db8(__cxx_literal_d260be1e973f0be54546);
  for (let i = i64(0); (i < i64(g_gameVarCount)); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i64((previous + 1n)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; }))) {
    buildprint__template_7e9230c56c320659(__cxx_literal_5fac00c7e982dff8e92c, (cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), i).value).szLabel, __cxx_literal_ffe8db6b1351eebae0ad);
    if (Boolean(u64((BigInt((cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), i).value).flags) & BigInt(u64(8192)))))) {
      buildprint__template_3e16cb6dcd32c503((cDeref(cTypedPointer(cSourceAddresses.decode((cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), i).value).__cxx_anonymous_0.global), Int32Array), Int32Array).value));
    } else {
      if (Boolean(u64((BigInt((cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), i).value).flags) & BigInt(u64(32768)))))) {
        buildprint__template_04215400977ec9df((cDeref(cTypedPointer(cSourceAddresses.decode((cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), i).value).__cxx_anonymous_0.global), Int16Array), Int16Array).value));
      } else {
        buildprint__template_4663c7d7435d5abb((cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), i).value).__cxx_anonymous_0.global);
      }
    }
    if (Boolean(u64((BigInt((cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), i).value).flags) & BigInt(u64(1)))))) {
      buildprint__template_d684cd61d5016db8(__cxx_literal_9508d0b75d9a8d07ed0c);
    } else {
      if (Boolean(u64((BigInt((cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), i).value).flags) & BigInt(u64(2)))))) {
        buildprint__template_d684cd61d5016db8(__cxx_literal_fe9e1ac8ce436f3f9c43);
      } else {
        buildprint__template_d6f52b498a2a6584(__cxx_literal_70d28ada55fd90e6336a, (cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), i).value).flags);
      }
    }
    buildprint__template_d684cd61d5016db8(__cxx_literal_a50120c25d5a68d20d94);
    if (Boolean(u64((BigInt((cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), i).value).flags) & BigInt(u64(2048)))))) {
      buildprint__template_d684cd61d5016db8(__cxx_literal_bb8d1769108f147bde67);
    }
    if (Boolean(u64((BigInt((cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), i).value).flags) & BigInt(u64(1351680)))))) {
      buildprint__template_d684cd61d5016db8(__cxx_literal_190fcec545cfd2f6e446);
    }
    if (Boolean(u64((BigInt((cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), i).value).flags) & BigInt(u64(4096)))))) {
      buildprint__template_d684cd61d5016db8(__cxx_literal_09580558fc52db77f6a0);
    }
    if (Boolean(u64((BigInt((cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), i).value).flags) & BigInt(u64(262144)))))) {
      buildprint__template_d684cd61d5016db8(__cxx_literal_970f3d335e6bb17c9d0b);
    }
    buildprint__template_d684cd61d5016db8(__cxx_literal_938f5d537616813ddb0d);
  }
  buildprint__template_d684cd61d5016db8(__cxx_literal_73e75ad48f543e773485);
}

// C/C++ source: source/duke3d/src/gamevars.cpp:959
export function Gv_GetArrayElementSize(arrayIdx) {
  let typeSize = i32(0);
  switch (u64((BigInt((cPointerElementRef(cRecordPointer(aGameArrays, {"align": 1, "arrayAlign": 1, "fields": {"flags": {"native": "BigUint64Array", "offset": 24, "size": 8}, "pValues": {"offset": 8, "pointer": true, "size": 8}, "size": {"native": "BigInt64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {}), arrayIdx).value).flags) & BigInt(u64(1097728))))) {
    case u64(0): {
      (typeSize = i32(8));
    }
    break;
    case u64(32768): {
      (typeSize = i32(1));
    }
    break;
    case u64(16384): {
      (typeSize = i32(2));
    }
    break;
  }
  return u32(typeSize);
}

// C/C++ source: source/duke3d/src/gamevars.cpp:973
const __cxx_literal_6b17be6340877911ec04 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 118, 97, 114, 115, 46, 99, 112, 112, 0]);
const __cxx_literal_5bfecc341f506e77faf4 = Uint8Array.from([37, 115, 58, 37, 100, 58, 32, 116, 111, 111, 32, 109, 97, 110, 121, 32, 97, 114, 114, 97, 121, 115, 32, 100, 101, 102, 105, 110, 101, 100, 33, 0]);
const __cxx_literal_d92da2fed2772e77a901 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 118, 97, 114, 115, 46, 99, 112, 112, 0]);
const __cxx_literal_6b70ec4766fe12d8ccdb = Uint8Array.from([37, 115, 58, 37, 100, 58, 32, 97, 114, 114, 97, 121, 32, 110, 97, 109, 101, 32, 39, 37, 115, 39, 32, 101, 120, 99, 101, 101, 100, 115, 32, 108, 105, 109, 105, 116, 32, 111, 102, 32, 37, 100, 32, 99, 104, 97, 114, 97, 99, 116, 101, 114, 115, 46, 0]);
export function Gv_NewArray(pszLabel, arrayptr, asize, dwFlags) {
  (asize >= i64(0));
  if ((g_gameArrayCount >= i32((2048 >> 2)))) {
    ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(__cxx_global_cell_a9ed12f504f4bd101d4746c6());
    C_ReportError((-1));
    ((i32(-2) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-2), __cxx_literal_6b17be6340877911ec04, u32(981), __cxx_literal_5bfecc341f506e77faf4, g_scriptFileName, __cxx_global_cell_06245cf7a06b2fd69750f440().value));
    return;
  }
  if ((strlen(pszLabel) > u64(i32((26 - 1))))) {
    ((__cxx_lvalue_1) => { const previous = __cxx_lvalue_1.value; const next = i32((previous + 1)); __cxx_lvalue_1.value = next; return previous; })(__cxx_global_cell_a9ed12f504f4bd101d4746c6());
    C_ReportError((-1));
    ((i32(-2) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-2), __cxx_literal_d92da2fed2772e77a901, u32(989), __cxx_literal_6b70ec4766fe12d8ccdb, g_scriptFileName, __cxx_global_cell_06245cf7a06b2fd69750f440().value, pszLabel, 26));
    return;
  }
  let i = i32(hash_find(__cxx_global_cell_f0457d06edefc3c775e2c32f().value, pszLabel));
  if (((i >= 0) && (!Boolean(u64((BigInt((cPointerElementRef(cRecordPointer(aGameArrays, {"align": 1, "arrayAlign": 1, "fields": {"flags": {"native": "BigUint64Array", "offset": 24, "size": 8}, "pValues": {"offset": 8, "pointer": true, "size": 8}, "size": {"native": "BigInt64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {}), i).value).flags) & BigInt(u64(8)))))))) {
    ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i32((previous + 1)); __cxx_lvalue_2.value = next; return previous; })(__cxx_global_cell_778291b6375dd09957e56c1b());
    C_ReportError(i32(23));
    return;
  }
  (i = i32(g_gameArrayCount));
  if (cPointerCompare((cPointerElementRef(cRecordPointer(aGameArrays, {"align": 1, "arrayAlign": 1, "fields": {"flags": {"native": "BigUint64Array", "offset": 24, "size": 8}, "pValues": {"offset": 8, "pointer": true, "size": 8}, "size": {"native": "BigInt64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {}), i).value).szLabel, null, "==")) {
    ((cPointerElementRef(cRecordPointer(aGameArrays, {"align": 1, "arrayAlign": 1, "fields": {"flags": {"native": "BigUint64Array", "offset": 24, "size": 8}, "pValues": {"offset": 8, "pointer": true, "size": 8}, "size": {"native": "BigInt64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {}), i).value).szLabel = cTypedPointer(xcalloc__header_6bfc9d470f33(u64(26), 1), Uint8Array));
  }
  if (cPointerCompare((cPointerElementRef(cRecordPointer(aGameArrays, {"align": 1, "arrayAlign": 1, "fields": {"flags": {"native": "BigUint64Array", "offset": 24, "size": 8}, "pValues": {"offset": 8, "pointer": true, "size": 8}, "size": {"native": "BigInt64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {}), i).value).szLabel, pszLabel, "!=")) {
    strcpy((cPointerElementRef(cRecordPointer(aGameArrays, {"align": 1, "arrayAlign": 1, "fields": {"flags": {"native": "BigUint64Array", "offset": 24, "size": 8}, "pValues": {"offset": 8, "pointer": true, "size": 8}, "size": {"native": "BigInt64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {}), i).value).szLabel, pszLabel);
  }
  ((cPointerElementRef(cRecordPointer(aGameArrays, {"align": 1, "arrayAlign": 1, "fields": {"flags": {"native": "BigUint64Array", "offset": 24, "size": 8}, "pValues": {"offset": 8, "pointer": true, "size": 8}, "size": {"native": "BigInt64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {}), i).value).flags = u64(u32((dwFlags & u32((~i32(8)))))));
  ((cPointerElementRef(cRecordPointer(aGameArrays, {"align": 1, "arrayAlign": 1, "fields": {"flags": {"native": "BigUint64Array", "offset": 24, "size": 8}, "pValues": {"offset": 8, "pointer": true, "size": 8}, "size": {"native": "BigInt64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {}), i).value).size = i64(asize));
  if (arrayptr) {
    ((cPointerElementRef(cRecordPointer(aGameArrays, {"align": 1, "arrayAlign": 1, "fields": {"flags": {"native": "BigUint64Array", "offset": 24, "size": 8}, "pValues": {"offset": 8, "pointer": true, "size": 8}, "size": {"native": "BigInt64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {}), i).value).pValues = cTypedPointer(arrayptr, BigInt64Array));
  } else {
    if ((!Boolean(u64((BigInt((cPointerElementRef(cRecordPointer(aGameArrays, {"align": 1, "arrayAlign": 1, "fields": {"flags": {"native": "BigUint64Array", "offset": 24, "size": 8}, "pValues": {"offset": 8, "pointer": true, "size": 8}, "size": {"native": "BigInt64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {}), i).value).flags) & BigInt(u64(2048))))))) {
      if (Boolean(u64((BigInt((cPointerElementRef(cRecordPointer(aGameArrays, {"align": 1, "arrayAlign": 1, "fields": {"flags": {"native": "BigUint64Array", "offset": 24, "size": 8}, "pValues": {"offset": 8, "pointer": true, "size": 8}, "size": {"native": "BigInt64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {}), i).value).flags) & BigInt(u64(512)))))) {
        do {
          xaligned_free__header_621d51a0063b((cPointerElementRef(cRecordPointer(aGameArrays, {"align": 1, "arrayAlign": 1, "fields": {"flags": {"native": "BigUint64Array", "offset": 24, "size": 8}, "pValues": {"offset": 8, "pointer": true, "size": 8}, "size": {"native": "BigInt64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {}), i).value).pValues);
          ((cPointerElementRef(cRecordPointer(aGameArrays, {"align": 1, "arrayAlign": 1, "fields": {"flags": {"native": "BigUint64Array", "offset": 24, "size": 8}, "pValues": {"offset": 8, "pointer": true, "size": 8}, "size": {"native": "BigInt64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {}), i).value).pValues = null);
        } while (Boolean(0));
      }
      let allocSize = i32(Gv_GetArrayAllocSize__header_9c58d53862c8(i));
      ((__cxx_lvalue_3) => (__cxx_lvalue_3.value = u64((BigInt(__cxx_lvalue_3.value) | BigInt(u64(512))))))(cObjectFieldRef((cPointerElementRef(cRecordPointer(aGameArrays, {"align": 1, "arrayAlign": 1, "fields": {"flags": {"native": "BigUint64Array", "offset": 24, "size": 8}, "pValues": {"offset": 8, "pointer": true, "size": 8}, "size": {"native": "BigInt64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {}), i).value), "flags"));
      if ((allocSize > 0)) {
        ((cPointerElementRef(cRecordPointer(aGameArrays, {"align": 1, "arrayAlign": 1, "fields": {"flags": {"native": "BigUint64Array", "offset": 24, "size": 8}, "pValues": {"offset": 8, "pointer": true, "size": 8}, "size": {"native": "BigInt64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {}), i).value).pValues = cTypedPointer(xaligned_alloc__header_118bc1ffc4be(u64(16), u64(allocSize)), BigInt64Array));
        memset((cPointerElementRef(cRecordPointer(aGameArrays, {"align": 1, "arrayAlign": 1, "fields": {"flags": {"native": "BigUint64Array", "offset": 24, "size": 8}, "pValues": {"offset": 8, "pointer": true, "size": 8}, "size": {"native": "BigInt64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {}), i).value).pValues, 0, u64(allocSize));
      } else {
        ((cPointerElementRef(cRecordPointer(aGameArrays, {"align": 1, "arrayAlign": 1, "fields": {"flags": {"native": "BigUint64Array", "offset": 24, "size": 8}, "pValues": {"offset": 8, "pointer": true, "size": 8}, "size": {"native": "BigInt64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {}), i).value).pValues = null);
      }
    }
  }
  ((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = i32((previous + 1)); __cxx_lvalue_4.value = next; return previous; })(__cxx_global_cell_312b58e8a14f852e3cc5e7e0());
  hash_add(__cxx_global_cell_f0457d06edefc3c775e2c32f().value, (cPointerElementRef(cRecordPointer(aGameArrays, {"align": 1, "arrayAlign": 1, "fields": {"flags": {"native": "BigUint64Array", "offset": 24, "size": 8}, "pValues": {"offset": 8, "pointer": true, "size": 8}, "size": {"native": "BigInt64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {}), i).value).szLabel, i64(i), 1);
}

// C/C++ source: source/duke3d/src/gamevars.cpp:1040
const __cxx_literal_36836abb301e55978304 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 118, 97, 114, 115, 46, 99, 112, 112, 0]);
const __cxx_literal_31935c2fb2fa35b2462a = Uint8Array.from([37, 115, 58, 37, 100, 58, 32, 116, 111, 111, 32, 109, 97, 110, 121, 32, 103, 97, 109, 101, 118, 97, 114, 115, 32, 100, 101, 102, 105, 110, 101, 100, 33, 0]);
const __cxx_literal_3e80025adfc97728bdd1 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 118, 97, 114, 115, 46, 99, 112, 112, 0]);
const __cxx_literal_908007fcc389f1893760 = Uint8Array.from([37, 115, 58, 37, 100, 58, 32, 118, 97, 114, 105, 97, 98, 108, 101, 32, 110, 97, 109, 101, 32, 39, 37, 115, 39, 32, 101, 120, 99, 101, 101, 100, 115, 32, 108, 105, 109, 105, 116, 32, 111, 102, 32, 37, 100, 32, 99, 104, 97, 114, 97, 99, 116, 101, 114, 115, 46, 0]);
const __cxx_literal_5e11932e542293273f43 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 118, 97, 114, 115, 46, 99, 112, 112, 0]);
const __cxx_literal_10521f93802b1a521b06 = Uint8Array.from([37, 115, 58, 37, 100, 58, 32, 99, 97, 110, 110, 111, 116, 32, 114, 101, 100, 101, 102, 105, 110, 101, 32, 105, 110, 116, 101, 114, 110, 97, 108, 32, 103, 97, 109, 101, 118, 97, 114, 32, 39, 37, 115, 39, 46, 0]);
export function Gv_NewVar(pszLabel, lValue, dwFlags) {
  if ((g_gameVarCount >= 2048)) {
    ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(__cxx_global_cell_a9ed12f504f4bd101d4746c6());
    C_ReportError((-1));
    ((i32(-2) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-2), __cxx_literal_36836abb301e55978304, u32(1046), __cxx_literal_31935c2fb2fa35b2462a, g_scriptFileName, __cxx_global_cell_06245cf7a06b2fd69750f440().value));
    return;
  }
  if ((strlen(pszLabel) > u64(i32((26 - 1))))) {
    ((__cxx_lvalue_1) => { const previous = __cxx_lvalue_1.value; const next = i32((previous + 1)); __cxx_lvalue_1.value = next; return previous; })(__cxx_global_cell_a9ed12f504f4bd101d4746c6());
    C_ReportError((-1));
    ((i32(-2) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-2), __cxx_literal_3e80025adfc97728bdd1, u32(1054), __cxx_literal_908007fcc389f1893760, g_scriptFileName, __cxx_global_cell_06245cf7a06b2fd69750f440().value, pszLabel, 26));
    return;
  }
  let gV = i32(hash_find(__cxx_global_cell_2d12a4ce62b5a2309382b8ea().value, pszLabel));
  if (((gV >= 0) && (!Boolean(u64((BigInt((cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), gV).value).flags) & BigInt(u64(8)))))))) {
    if (Boolean(u64((BigInt((cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), gV).value).flags) & BigInt(u64(1351680)))))) {
      C_ReportError((-1));
      ((i32(-1) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-1), __cxx_literal_5e11932e542293273f43, u32(1066), __cxx_literal_10521f93802b1a521b06, g_scriptFileName, __cxx_global_cell_06245cf7a06b2fd69750f440().value, cPointerOffset(__cxx_global_cell_1aca80e8b55c802f7b43740d().value, i32((__cxx_global_cell_6742302ef915e025d82bcd36().value << 6)), Uint8Array.BYTES_PER_ELEMENT)));
      return;
    } else {
      if ((!Boolean(u64((BigInt((cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), gV).value).flags) & BigInt(u64(2048))))))) {
        ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i32((previous + 1)); __cxx_lvalue_2.value = next; return previous; })(__cxx_global_cell_778291b6375dd09957e56c1b());
        C_ReportError(i32(23));
        return;
      }
    }
  }
  if ((gV == (-1))) {
    (gV = i32(g_gameVarCount));
  }
  let newVar = (cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), gV).value);
  if ((u64((BigInt(newVar.flags) & BigInt(u64(2048)))) == u64(0))) {
    if (cPointerCompare(newVar.szLabel, null, "==")) {
      (newVar.szLabel = cTypedPointer(xcalloc__header_6bfc9d470f33(u64(26), 1), Uint8Array));
    }
    if (cPointerCompare(newVar.szLabel, pszLabel, "!=")) {
      strcpy(newVar.szLabel, pszLabel);
    }
    (newVar.flags = u64(dwFlags));
    if (Boolean(u64((BigInt(newVar.flags) & BigInt(u64(3)))))) {
      do {
        xaligned_free__header_621d51a0063b(newVar.__cxx_anonymous_0.pValues);
        (newVar.__cxx_anonymous_0.pValues = null);
      } while (Boolean(0));
    }
  }
  (newVar.defaultValue = i64(lValue));
  ((__cxx_lvalue_3) => (__cxx_lvalue_3.value = u64((BigInt(__cxx_lvalue_3.value) & BigInt(u64((~i32(8))))))))(cObjectFieldRef(newVar, "flags"));
  if ((gV == g_gameVarCount)) {
    hash_add(__cxx_global_cell_2d12a4ce62b5a2309382b8ea().value, newVar.szLabel, i64(((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = i32((previous + 1)); __cxx_lvalue_4.value = next; return previous; })(__cxx_global_cell_8406f8e86b0ce3102350571c())), 0);
  }
  if (Boolean(u64((BigInt(newVar.flags) & BigInt(u64(1)))))) {
    if ((!newVar.__cxx_anonymous_0.pValues)) {
      (newVar.__cxx_anonymous_0.pValues = cTypedPointer(xaligned_alloc__header_118bc1ffc4be(8, u64((BigInt(u64(16)) * BigInt(8)))), BigInt64Array));
      memset(newVar.__cxx_anonymous_0.pValues, 0, u64((BigInt(u64(16)) * BigInt(8))));
    }
    for (let j = i64(i32((16 - 1))); (j >= i64(0)); ((__cxx_lvalue_5) => { const previous = __cxx_lvalue_5.value; const next = i64((previous - 1n)); __cxx_lvalue_5.value = next; return next; })(cRef(() => j, __cxx_lvalue_6 => { j = __cxx_lvalue_6; }))) {
      ((cDeref(cPointerOffset(newVar.__cxx_anonymous_0.pValues, j, BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array).value) = i64(lValue));
    }
  } else {
    if (Boolean(u64((BigInt(newVar.flags) & BigInt(u64(2)))))) {
      if ((!newVar.__cxx_anonymous_0.pValues)) {
        (newVar.__cxx_anonymous_0.pValues = cTypedPointer(xaligned_alloc__header_118bc1ffc4be(u64(16), u64((BigInt(u64(16384)) * BigInt(8)))), BigInt64Array));
        memset(newVar.__cxx_anonymous_0.pValues, 0, u64((BigInt(u64(16384)) * BigInt(8))));
      }
      for (let j = i64(i32((16384 - 1))); (j >= i64(0)); ((__cxx_lvalue_7) => { const previous = __cxx_lvalue_7.value; const next = i64((previous - 1n)); __cxx_lvalue_7.value = next; return next; })(cRef(() => j, __cxx_lvalue_8 => { j = __cxx_lvalue_8; }))) {
        ((cDeref(cPointerOffset(newVar.__cxx_anonymous_0.pValues, j, BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array).value) = i64(lValue));
      }
    } else {
      (newVar.__cxx_anonymous_0.global = i64(lValue));
    }
  }
}

// C/C++ source: source/duke3d/src/gamevars.cpp:1136
export function Gv_GetVarIndex(szGameLabel) {
  let gameVar = i32(hash_find(__cxx_global_cell_2d12a4ce62b5a2309382b8ea().value, szGameLabel));
  if ((u32(gameVar) >= u32(2048))) {
    return i32((-1));
  }
  return i32(gameVar);
}

// C/C++ source: source/duke3d/src/gamevars.cpp:1146
export function Gv_GetArrayIndex(szArrayLabel) {
  let arrayIdx = i32(hash_find(__cxx_global_cell_f0457d06edefc3c775e2c32f().value, szArrayLabel));
  if ((u32(arrayIdx) >= u32(i32((2048 >> 2))))) {
    return i32((-1));
  }
  return i32(arrayIdx);
}

// C/C++ source: source/duke3d/src/gamevars.cpp:1156
export function Gv_GetArrayAllocSizeForCount(arrayIdx, count) {
  if (Boolean(u64((BigInt((cPointerElementRef(cRecordPointer(aGameArrays, {"align": 1, "arrayAlign": 1, "fields": {"flags": {"native": "BigUint64Array", "offset": 24, "size": 8}, "pValues": {"offset": 8, "pointer": true, "size": 8}, "size": {"native": "BigInt64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {}), arrayIdx).value).flags) & BigInt(u64(1048576)))))) {
    return u64((BigInt(u64((BigInt(count) + BigInt(u64(7))))) >> BigInt(3)));
  }
  return u64((BigInt(count) * BigInt(u64(Gv_GetArrayElementSize(arrayIdx)))));
}

// C/C++ source: source/duke3d/src/gamevars.cpp:1164
export function Gv_GetArrayCountForAllocSize(arrayIdx, filelength) {
  if (Boolean(u64((BigInt((cPointerElementRef(cRecordPointer(aGameArrays, {"align": 1, "arrayAlign": 1, "fields": {"flags": {"native": "BigUint64Array", "offset": 24, "size": 8}, "pValues": {"offset": 8, "pointer": true, "size": 8}, "size": {"native": "BigInt64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {}), arrayIdx).value).flags) & BigInt(u64(1048576)))))) {
    return u64((BigInt(filelength) << BigInt(3)));
  }
  let elementSize = u64(Gv_GetArrayElementSize(arrayIdx));
  const __cxx_lvalue_0 = cRef(() => elementSize, __cxx_lvalue_1 => { elementSize = u64(__cxx_lvalue_1); });
  let denominator = u64((min__template_c237f4424e2bda8a(__cxx_lvalue_0, ((__cxx_lvalue_2) => cRef(() => __cxx_lvalue_2, () => { throw new TypeError("const C++ reference write"); }))(4))).value);
  void 0;
  return u64(tabledivide64__header_3e246b8ee560(i64(u64((BigInt(u64((BigInt(filelength) + BigInt(denominator)))) - BigInt(u64(1))))), i64(denominator)));
}

// C/C++ source: source/duke3d/src/gamevars.cpp:1359
export function setvar__(gameVar, newValue, spriteNum, playerNum) {
  let __cxx_var = (cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), gameVar).value);
  switch (u64((BigInt(__cxx_var.flags) & BigInt(u64(i32((i32(3) | i32(1351680)))))))) {
    default: {
      (__cxx_var.__cxx_anonymous_0.global = i64(newValue));
    }
    break;
    case u64(1): {
      ((cDeref(cPointerOffset(__cxx_var.__cxx_anonymous_0.pValues, i32((playerNum & i32((16 - 1)))), BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array).value) = i64(newValue));
    }
    break;
    case u64(2): {
      ((cDeref(cPointerOffset(__cxx_var.__cxx_anonymous_0.pValues, i32((spriteNum & i32((16384 - 1)))), BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array).value) = i64(newValue));
    }
    break;
    case u64(1310720):
    case u64(8192): {
      ((cDeref(cTypedPointer(cSourceAddresses.decode(__cxx_var.__cxx_anonymous_0.global), Int32Array), Int32Array).value) = i32(newValue));
    }
    break;
    case u64(32768): {
      ((cDeref(cTypedPointer(cSourceAddresses.decode(__cxx_var.__cxx_anonymous_0.global), Int16Array), Int16Array).value) = ((u32(((u32(((u32(newValue) << 16) >> 16)) << 16) >> 16)) << 16) >> 16));
    }
    break;
    case u64(1048576): {
      ((cDeref(cTypedPointer(cSourceAddresses.decode(__cxx_var.__cxx_anonymous_0.global), Int32Array), Int32Array).value) = i32(fix16_from_int__header_4ad6254e429b(i32(((u32(((u32(newValue) << 16) >> 16)) << 16) >> 16)))));
    }
    break;
  }
}

// C/C++ source: source/duke3d/src/gamevars.cpp:1375
export function Gv_SetVar__cxx_1f0be5127ed1(gameVar, newValue, spriteNum, playerNum) {
  setvar__(gameVar, newValue, spriteNum, playerNum);
}

// C/C++ source: source/duke3d/src/gamevars.cpp:1386
export function Gv_GetVarDataPtr(szGameLabel) {
  let gameVar = i32(hash_find(__cxx_global_cell_2d12a4ce62b5a2309382b8ea().value, szGameLabel));
  if ((u32(gameVar) >= u32(2048))) {
    return null;
  }
  let __cxx_var = (cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), gameVar).value);
  if (Boolean(u64((BigInt(__cxx_var.flags) & BigInt(u64(i32((i32(3) | i32(1351680))))))))) {
    return __cxx_var.__cxx_anonymous_0.pValues;
  }
  return cObjectFieldRef(__cxx_var.__cxx_anonymous_0, "global");
}

// C/C++ source: source/duke3d/src/gamevars.cpp:1485
export let g_weaponOverridden = cByteRecordNDArray({"align": 4, "arrayAlign": 1, "fields": {"Clip": {"native": "Int32Array", "offset": 4, "size": 4}, "FireDelay": {"native": "Int32Array", "offset": 12, "size": 4}, "FireSound": {"native": "Int32Array", "offset": 48, "size": 4}, "Flags": {"native": "Int32Array", "offset": 24, "size": 4}, "FlashColor": {"native": "Int32Array", "offset": 72, "size": 4}, "HoldDelay": {"native": "Int32Array", "offset": 20, "size": 4}, "InitialSound": {"native": "Int32Array", "offset": 44, "size": 4}, "Reload": {"native": "Int32Array", "offset": 8, "size": 4}, "ReloadSound1": {"native": "Int32Array", "offset": 60, "size": 4}, "ReloadSound2": {"native": "Int32Array", "offset": 64, "size": 4}, "SelectSound": {"native": "Int32Array", "offset": 68, "size": 4}, "Shoots": {"native": "Int32Array", "offset": 28, "size": 4}, "ShotsPerBurst": {"native": "Int32Array", "offset": 40, "size": 4}, "Sound2Sound": {"native": "Int32Array", "offset": 56, "size": 4}, "Sound2Time": {"native": "Int32Array", "offset": 52, "size": 4}, "Spawn": {"native": "Int32Array", "offset": 36, "size": 4}, "SpawnTime": {"native": "Int32Array", "offset": 32, "size": 4}, "TotalTime": {"native": "Int32Array", "offset": 16, "size": 4}, "WorksLike": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 76, "union": false}, [13], {}, cStaticInitializerValues([]));
function __cxx_static_address_594c44ed3e84c81d791653b7() {
  return __cxx_static_address_594c44ed3e84c81d791653b7.reference || (__cxx_static_address_594c44ed3e84c81d791653b7.reference = {
    __cReference: true,
    get value() { return g_weaponOverridden; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/gamevars.cpp:1487
export let weapondefaults = cByteRecordNDArray({"align": 4, "arrayAlign": 1, "fields": {"Clip": {"native": "Int32Array", "offset": 4, "size": 4}, "FireDelay": {"native": "Int32Array", "offset": 12, "size": 4}, "FireSound": {"native": "Int32Array", "offset": 48, "size": 4}, "Flags": {"native": "Int32Array", "offset": 24, "size": 4}, "FlashColor": {"native": "Int32Array", "offset": 72, "size": 4}, "HoldDelay": {"native": "Int32Array", "offset": 20, "size": 4}, "InitialSound": {"native": "Int32Array", "offset": 44, "size": 4}, "Reload": {"native": "Int32Array", "offset": 8, "size": 4}, "ReloadSound1": {"native": "Int32Array", "offset": 60, "size": 4}, "ReloadSound2": {"native": "Int32Array", "offset": 64, "size": 4}, "SelectSound": {"native": "Int32Array", "offset": 68, "size": 4}, "Shoots": {"native": "Int32Array", "offset": 28, "size": 4}, "ShotsPerBurst": {"native": "Int32Array", "offset": 40, "size": 4}, "Sound2Sound": {"native": "Int32Array", "offset": 56, "size": 4}, "Sound2Time": {"native": "Int32Array", "offset": 52, "size": 4}, "Spawn": {"native": "Int32Array", "offset": 36, "size": 4}, "SpawnTime": {"native": "Int32Array", "offset": 32, "size": 4}, "TotalTime": {"native": "Int32Array", "offset": 16, "size": 4}, "WorksLike": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 76, "union": false}, [13], {}, cStaticInitializerValues([cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"Clip": {"native": "Int32Array", "offset": 4, "size": 4}, "FireDelay": {"native": "Int32Array", "offset": 12, "size": 4}, "FireSound": {"native": "Int32Array", "offset": 48, "size": 4}, "Flags": {"native": "Int32Array", "offset": 24, "size": 4}, "FlashColor": {"native": "Int32Array", "offset": 72, "size": 4}, "HoldDelay": {"native": "Int32Array", "offset": 20, "size": 4}, "InitialSound": {"native": "Int32Array", "offset": 44, "size": 4}, "Reload": {"native": "Int32Array", "offset": 8, "size": 4}, "ReloadSound1": {"native": "Int32Array", "offset": 60, "size": 4}, "ReloadSound2": {"native": "Int32Array", "offset": 64, "size": 4}, "SelectSound": {"native": "Int32Array", "offset": 68, "size": 4}, "Shoots": {"native": "Int32Array", "offset": 28, "size": 4}, "ShotsPerBurst": {"native": "Int32Array", "offset": 40, "size": 4}, "Sound2Sound": {"native": "Int32Array", "offset": 56, "size": 4}, "Sound2Time": {"native": "Int32Array", "offset": 52, "size": 4}, "Spawn": {"native": "Int32Array", "offset": 36, "size": 4}, "SpawnTime": {"native": "Int32Array", "offset": 32, "size": 4}, "TotalTime": {"native": "Int32Array", "offset": 16, "size": 4}, "WorksLike": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 76, "union": false}, cStaticInitializerValues({"WorksLike": i32(0), "Clip": 0, "Reload": 0, "FireDelay": 7, "TotalTime": 14, "HoldDelay": 0, "Flags": i32((i32((i32(256) | i32(32))) | i32(4))), "Shoots": i32(KNEE____header_global_fe4ce5c7f20fd39f), "SpawnTime": 0, "Spawn": 0, "ShotsPerBurst": 0, "InitialSound": 0, "FireSound": 0, "Sound2Time": 0, "Sound2Sound": 0, "ReloadSound1": i32(EJECT_CLIP____header_global_9c229ab00750da0a), "ReloadSound2": i32(INSERT_CLIP____header_global_d9183cad0d97d626), "SelectSound": 0, "FlashColor": 0}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"Clip": {"native": "Int32Array", "offset": 4, "size": 4}, "FireDelay": {"native": "Int32Array", "offset": 12, "size": 4}, "FireSound": {"native": "Int32Array", "offset": 48, "size": 4}, "Flags": {"native": "Int32Array", "offset": 24, "size": 4}, "FlashColor": {"native": "Int32Array", "offset": 72, "size": 4}, "HoldDelay": {"native": "Int32Array", "offset": 20, "size": 4}, "InitialSound": {"native": "Int32Array", "offset": 44, "size": 4}, "Reload": {"native": "Int32Array", "offset": 8, "size": 4}, "ReloadSound1": {"native": "Int32Array", "offset": 60, "size": 4}, "ReloadSound2": {"native": "Int32Array", "offset": 64, "size": 4}, "SelectSound": {"native": "Int32Array", "offset": 68, "size": 4}, "Shoots": {"native": "Int32Array", "offset": 28, "size": 4}, "ShotsPerBurst": {"native": "Int32Array", "offset": 40, "size": 4}, "Sound2Sound": {"native": "Int32Array", "offset": 56, "size": 4}, "Sound2Time": {"native": "Int32Array", "offset": 52, "size": 4}, "Spawn": {"native": "Int32Array", "offset": 36, "size": 4}, "SpawnTime": {"native": "Int32Array", "offset": 32, "size": 4}, "TotalTime": {"native": "Int32Array", "offset": 16, "size": 4}, "WorksLike": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 76, "union": false}, cStaticInitializerValues({"WorksLike": i32(1), "Clip": 12, "Reload": 27, "FireDelay": 2, "TotalTime": 5, "HoldDelay": 0, "Flags": i32(32768), "Shoots": i32(SHOTSPARK1____header_global_2d67184b3dd2f624), "SpawnTime": 2, "Spawn": i32(SHELL____header_global_f8dce4ba7f3614c0), "ShotsPerBurst": 0, "InitialSound": 0, "FireSound": i32(PISTOL_FIRE____header_global_64696cb3234ce690), "Sound2Time": 0, "Sound2Sound": 0, "ReloadSound1": i32(EJECT_CLIP____header_global_9c229ab00750da0a), "ReloadSound2": i32(INSERT_CLIP____header_global_d9183cad0d97d626), "SelectSound": i32(INSERT_CLIP____header_global_d9183cad0d97d626), "FlashColor": i32((255 + i32((95 << 8))))}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"Clip": {"native": "Int32Array", "offset": 4, "size": 4}, "FireDelay": {"native": "Int32Array", "offset": 12, "size": 4}, "FireSound": {"native": "Int32Array", "offset": 48, "size": 4}, "Flags": {"native": "Int32Array", "offset": 24, "size": 4}, "FlashColor": {"native": "Int32Array", "offset": 72, "size": 4}, "HoldDelay": {"native": "Int32Array", "offset": 20, "size": 4}, "InitialSound": {"native": "Int32Array", "offset": 44, "size": 4}, "Reload": {"native": "Int32Array", "offset": 8, "size": 4}, "ReloadSound1": {"native": "Int32Array", "offset": 60, "size": 4}, "ReloadSound2": {"native": "Int32Array", "offset": 64, "size": 4}, "SelectSound": {"native": "Int32Array", "offset": 68, "size": 4}, "Shoots": {"native": "Int32Array", "offset": 28, "size": 4}, "ShotsPerBurst": {"native": "Int32Array", "offset": 40, "size": 4}, "Sound2Sound": {"native": "Int32Array", "offset": 56, "size": 4}, "Sound2Time": {"native": "Int32Array", "offset": 52, "size": 4}, "Spawn": {"native": "Int32Array", "offset": 36, "size": 4}, "SpawnTime": {"native": "Int32Array", "offset": 32, "size": 4}, "TotalTime": {"native": "Int32Array", "offset": 16, "size": 4}, "WorksLike": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 76, "union": false}, cStaticInitializerValues({"WorksLike": i32(2), "Clip": 0, "Reload": 13, "FireDelay": 4, "TotalTime": 30, "HoldDelay": 0, "Flags": i32(1024), "Shoots": i32(SHOTGUN____header_global_cbd049448615880f), "SpawnTime": 24, "Spawn": i32(SHOTGUNSHELL____header_global_3b37f1e099b4e1c7), "ShotsPerBurst": 7, "InitialSound": 0, "FireSound": i32(SHOTGUN_FIRE____header_global_a02083a8585a7678), "Sound2Time": 15, "Sound2Sound": i32(SHOTGUN_COCK____header_global_ea5f71d97148ad27), "ReloadSound1": i32(EJECT_CLIP____header_global_9c229ab00750da0a), "ReloadSound2": i32(INSERT_CLIP____header_global_d9183cad0d97d626), "SelectSound": i32(SHOTGUN_COCK____header_global_ea5f71d97148ad27), "FlashColor": i32((255 + i32((95 << 8))))}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"Clip": {"native": "Int32Array", "offset": 4, "size": 4}, "FireDelay": {"native": "Int32Array", "offset": 12, "size": 4}, "FireSound": {"native": "Int32Array", "offset": 48, "size": 4}, "Flags": {"native": "Int32Array", "offset": 24, "size": 4}, "FlashColor": {"native": "Int32Array", "offset": 72, "size": 4}, "HoldDelay": {"native": "Int32Array", "offset": 20, "size": 4}, "InitialSound": {"native": "Int32Array", "offset": 44, "size": 4}, "Reload": {"native": "Int32Array", "offset": 8, "size": 4}, "ReloadSound1": {"native": "Int32Array", "offset": 60, "size": 4}, "ReloadSound2": {"native": "Int32Array", "offset": 64, "size": 4}, "SelectSound": {"native": "Int32Array", "offset": 68, "size": 4}, "Shoots": {"native": "Int32Array", "offset": 28, "size": 4}, "ShotsPerBurst": {"native": "Int32Array", "offset": 40, "size": 4}, "Sound2Sound": {"native": "Int32Array", "offset": 56, "size": 4}, "Sound2Time": {"native": "Int32Array", "offset": 52, "size": 4}, "Spawn": {"native": "Int32Array", "offset": 36, "size": 4}, "SpawnTime": {"native": "Int32Array", "offset": 32, "size": 4}, "TotalTime": {"native": "Int32Array", "offset": 16, "size": 4}, "WorksLike": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 76, "union": false}, cStaticInitializerValues({"WorksLike": i32(3), "Clip": 0, "Reload": 0, "FireDelay": 3, "TotalTime": 12, "HoldDelay": 3, "Flags": i32((i32((i32((i32((i32(4) | i32(16))) | i32(64))) | i32(8192))) | i32(65536))), "Shoots": i32(CHAINGUN____header_global_89711fbc219eeb10), "SpawnTime": 1, "Spawn": i32(SHELL____header_global_f8dce4ba7f3614c0), "ShotsPerBurst": 0, "InitialSound": 0, "FireSound": i32(CHAINGUN_FIRE____header_global_69d9f94b57752638), "Sound2Time": 0, "Sound2Sound": 0, "ReloadSound1": i32(EJECT_CLIP____header_global_9c229ab00750da0a), "ReloadSound2": i32(INSERT_CLIP____header_global_d9183cad0d97d626), "SelectSound": i32(SELECT_WEAPON____header_global_05d1bf3e9599453c), "FlashColor": i32((255 + i32((95 << 8))))}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"Clip": {"native": "Int32Array", "offset": 4, "size": 4}, "FireDelay": {"native": "Int32Array", "offset": 12, "size": 4}, "FireSound": {"native": "Int32Array", "offset": 48, "size": 4}, "Flags": {"native": "Int32Array", "offset": 24, "size": 4}, "FlashColor": {"native": "Int32Array", "offset": 72, "size": 4}, "HoldDelay": {"native": "Int32Array", "offset": 20, "size": 4}, "InitialSound": {"native": "Int32Array", "offset": 44, "size": 4}, "Reload": {"native": "Int32Array", "offset": 8, "size": 4}, "ReloadSound1": {"native": "Int32Array", "offset": 60, "size": 4}, "ReloadSound2": {"native": "Int32Array", "offset": 64, "size": 4}, "SelectSound": {"native": "Int32Array", "offset": 68, "size": 4}, "Shoots": {"native": "Int32Array", "offset": 28, "size": 4}, "ShotsPerBurst": {"native": "Int32Array", "offset": 40, "size": 4}, "Sound2Sound": {"native": "Int32Array", "offset": 56, "size": 4}, "Sound2Time": {"native": "Int32Array", "offset": 52, "size": 4}, "Spawn": {"native": "Int32Array", "offset": 36, "size": 4}, "SpawnTime": {"native": "Int32Array", "offset": 32, "size": 4}, "TotalTime": {"native": "Int32Array", "offset": 16, "size": 4}, "WorksLike": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 76, "union": false}, cStaticInitializerValues({"WorksLike": i32(4), "Clip": 0, "Reload": 0, "FireDelay": 4, "TotalTime": 20, "HoldDelay": 0, "Flags": 0, "Shoots": i32(RPG____header_global_dbb5cd4ccf59d761), "SpawnTime": 0, "Spawn": 0, "ShotsPerBurst": 0, "InitialSound": 0, "FireSound": 0, "Sound2Time": 0, "Sound2Sound": 0, "ReloadSound1": i32(EJECT_CLIP____header_global_9c229ab00750da0a), "ReloadSound2": i32(INSERT_CLIP____header_global_d9183cad0d97d626), "SelectSound": i32(SELECT_WEAPON____header_global_05d1bf3e9599453c), "FlashColor": i32((255 + i32((95 << 8))))}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"Clip": {"native": "Int32Array", "offset": 4, "size": 4}, "FireDelay": {"native": "Int32Array", "offset": 12, "size": 4}, "FireSound": {"native": "Int32Array", "offset": 48, "size": 4}, "Flags": {"native": "Int32Array", "offset": 24, "size": 4}, "FlashColor": {"native": "Int32Array", "offset": 72, "size": 4}, "HoldDelay": {"native": "Int32Array", "offset": 20, "size": 4}, "InitialSound": {"native": "Int32Array", "offset": 44, "size": 4}, "Reload": {"native": "Int32Array", "offset": 8, "size": 4}, "ReloadSound1": {"native": "Int32Array", "offset": 60, "size": 4}, "ReloadSound2": {"native": "Int32Array", "offset": 64, "size": 4}, "SelectSound": {"native": "Int32Array", "offset": 68, "size": 4}, "Shoots": {"native": "Int32Array", "offset": 28, "size": 4}, "ShotsPerBurst": {"native": "Int32Array", "offset": 40, "size": 4}, "Sound2Sound": {"native": "Int32Array", "offset": 56, "size": 4}, "Sound2Time": {"native": "Int32Array", "offset": 52, "size": 4}, "Spawn": {"native": "Int32Array", "offset": 36, "size": 4}, "SpawnTime": {"native": "Int32Array", "offset": 32, "size": 4}, "TotalTime": {"native": "Int32Array", "offset": 16, "size": 4}, "WorksLike": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 76, "union": false}, cStaticInitializerValues({"WorksLike": i32(5), "Clip": 0, "Reload": 30, "FireDelay": 6, "TotalTime": 19, "HoldDelay": 12, "Flags": i32(512), "Shoots": i32(HEAVYHBOMB____header_global_38319da82abc8fc3), "SpawnTime": 0, "Spawn": 0, "ShotsPerBurst": 0, "InitialSound": 0, "FireSound": 0, "Sound2Time": 0, "Sound2Sound": 0, "ReloadSound1": i32(EJECT_CLIP____header_global_9c229ab00750da0a), "ReloadSound2": i32(INSERT_CLIP____header_global_d9183cad0d97d626), "SelectSound": 0, "FlashColor": 0}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"Clip": {"native": "Int32Array", "offset": 4, "size": 4}, "FireDelay": {"native": "Int32Array", "offset": 12, "size": 4}, "FireSound": {"native": "Int32Array", "offset": 48, "size": 4}, "Flags": {"native": "Int32Array", "offset": 24, "size": 4}, "FlashColor": {"native": "Int32Array", "offset": 72, "size": 4}, "HoldDelay": {"native": "Int32Array", "offset": 20, "size": 4}, "InitialSound": {"native": "Int32Array", "offset": 44, "size": 4}, "Reload": {"native": "Int32Array", "offset": 8, "size": 4}, "ReloadSound1": {"native": "Int32Array", "offset": 60, "size": 4}, "ReloadSound2": {"native": "Int32Array", "offset": 64, "size": 4}, "SelectSound": {"native": "Int32Array", "offset": 68, "size": 4}, "Shoots": {"native": "Int32Array", "offset": 28, "size": 4}, "ShotsPerBurst": {"native": "Int32Array", "offset": 40, "size": 4}, "Sound2Sound": {"native": "Int32Array", "offset": 56, "size": 4}, "Sound2Time": {"native": "Int32Array", "offset": 52, "size": 4}, "Spawn": {"native": "Int32Array", "offset": 36, "size": 4}, "SpawnTime": {"native": "Int32Array", "offset": 32, "size": 4}, "TotalTime": {"native": "Int32Array", "offset": 16, "size": 4}, "WorksLike": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 76, "union": false}, cStaticInitializerValues({"WorksLike": i32(6), "Clip": 0, "Reload": 0, "FireDelay": 10, "TotalTime": 12, "HoldDelay": 0, "Flags": i32(2), "Shoots": i32(SHRINKER____header_global_20d1aaf9aa975764), "SpawnTime": 0, "Spawn": 0, "ShotsPerBurst": 0, "InitialSound": i32(SHRINKER_FIRE____header_global_5d107e49af7df222), "FireSound": 0, "Sound2Time": 0, "Sound2Sound": 0, "ReloadSound1": i32(EJECT_CLIP____header_global_9c229ab00750da0a), "ReloadSound2": i32(INSERT_CLIP____header_global_d9183cad0d97d626), "SelectSound": i32(SELECT_WEAPON____header_global_05d1bf3e9599453c), "FlashColor": i32((i32((176 + i32((252 << 8)))) + i32((120 << 16))))}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"Clip": {"native": "Int32Array", "offset": 4, "size": 4}, "FireDelay": {"native": "Int32Array", "offset": 12, "size": 4}, "FireSound": {"native": "Int32Array", "offset": 48, "size": 4}, "Flags": {"native": "Int32Array", "offset": 24, "size": 4}, "FlashColor": {"native": "Int32Array", "offset": 72, "size": 4}, "HoldDelay": {"native": "Int32Array", "offset": 20, "size": 4}, "InitialSound": {"native": "Int32Array", "offset": 44, "size": 4}, "Reload": {"native": "Int32Array", "offset": 8, "size": 4}, "ReloadSound1": {"native": "Int32Array", "offset": 60, "size": 4}, "ReloadSound2": {"native": "Int32Array", "offset": 64, "size": 4}, "SelectSound": {"native": "Int32Array", "offset": 68, "size": 4}, "Shoots": {"native": "Int32Array", "offset": 28, "size": 4}, "ShotsPerBurst": {"native": "Int32Array", "offset": 40, "size": 4}, "Sound2Sound": {"native": "Int32Array", "offset": 56, "size": 4}, "Sound2Time": {"native": "Int32Array", "offset": 52, "size": 4}, "Spawn": {"native": "Int32Array", "offset": 36, "size": 4}, "SpawnTime": {"native": "Int32Array", "offset": 32, "size": 4}, "TotalTime": {"native": "Int32Array", "offset": 16, "size": 4}, "WorksLike": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 76, "union": false}, cStaticInitializerValues({"WorksLike": i32(7), "Clip": 0, "Reload": 0, "FireDelay": 3, "TotalTime": 6, "HoldDelay": 5, "Flags": i32((i32(8) | i32(64))), "Shoots": i32(RPG____header_global_dbb5cd4ccf59d761), "SpawnTime": 0, "Spawn": 0, "ShotsPerBurst": 2, "InitialSound": i32(CAT_FIRE____header_global_a273946bc179c8dd), "FireSound": 0, "Sound2Time": 0, "Sound2Sound": 0, "ReloadSound1": i32(EJECT_CLIP____header_global_9c229ab00750da0a), "ReloadSound2": i32(INSERT_CLIP____header_global_d9183cad0d97d626), "SelectSound": i32(SELECT_WEAPON____header_global_05d1bf3e9599453c), "FlashColor": i32((255 + i32((95 << 8))))}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"Clip": {"native": "Int32Array", "offset": 4, "size": 4}, "FireDelay": {"native": "Int32Array", "offset": 12, "size": 4}, "FireSound": {"native": "Int32Array", "offset": 48, "size": 4}, "Flags": {"native": "Int32Array", "offset": 24, "size": 4}, "FlashColor": {"native": "Int32Array", "offset": 72, "size": 4}, "HoldDelay": {"native": "Int32Array", "offset": 20, "size": 4}, "InitialSound": {"native": "Int32Array", "offset": 44, "size": 4}, "Reload": {"native": "Int32Array", "offset": 8, "size": 4}, "ReloadSound1": {"native": "Int32Array", "offset": 60, "size": 4}, "ReloadSound2": {"native": "Int32Array", "offset": 64, "size": 4}, "SelectSound": {"native": "Int32Array", "offset": 68, "size": 4}, "Shoots": {"native": "Int32Array", "offset": 28, "size": 4}, "ShotsPerBurst": {"native": "Int32Array", "offset": 40, "size": 4}, "Sound2Sound": {"native": "Int32Array", "offset": 56, "size": 4}, "Sound2Time": {"native": "Int32Array", "offset": 52, "size": 4}, "Spawn": {"native": "Int32Array", "offset": 36, "size": 4}, "SpawnTime": {"native": "Int32Array", "offset": 32, "size": 4}, "TotalTime": {"native": "Int32Array", "offset": 16, "size": 4}, "WorksLike": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 76, "union": false}, cStaticInitializerValues({"WorksLike": i32(8), "Clip": 0, "Reload": 16, "FireDelay": 3, "TotalTime": 16, "HoldDelay": 7, "Flags": i32((i32((i32(256) | i32(2048))) | i32(1024))), "Shoots": i32(HANDHOLDINGLASER____header_global_d526d9ac88449647), "SpawnTime": 0, "Spawn": 0, "ShotsPerBurst": 0, "InitialSound": 0, "FireSound": 0, "Sound2Time": 0, "Sound2Sound": 0, "ReloadSound1": i32(EJECT_CLIP____header_global_9c229ab00750da0a), "ReloadSound2": i32(INSERT_CLIP____header_global_d9183cad0d97d626), "SelectSound": 0, "FlashColor": 0}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"Clip": {"native": "Int32Array", "offset": 4, "size": 4}, "FireDelay": {"native": "Int32Array", "offset": 12, "size": 4}, "FireSound": {"native": "Int32Array", "offset": 48, "size": 4}, "Flags": {"native": "Int32Array", "offset": 24, "size": 4}, "FlashColor": {"native": "Int32Array", "offset": 72, "size": 4}, "HoldDelay": {"native": "Int32Array", "offset": 20, "size": 4}, "InitialSound": {"native": "Int32Array", "offset": 44, "size": 4}, "Reload": {"native": "Int32Array", "offset": 8, "size": 4}, "ReloadSound1": {"native": "Int32Array", "offset": 60, "size": 4}, "ReloadSound2": {"native": "Int32Array", "offset": 64, "size": 4}, "SelectSound": {"native": "Int32Array", "offset": 68, "size": 4}, "Shoots": {"native": "Int32Array", "offset": 28, "size": 4}, "ShotsPerBurst": {"native": "Int32Array", "offset": 40, "size": 4}, "Sound2Sound": {"native": "Int32Array", "offset": 56, "size": 4}, "Sound2Time": {"native": "Int32Array", "offset": 52, "size": 4}, "Spawn": {"native": "Int32Array", "offset": 36, "size": 4}, "SpawnTime": {"native": "Int32Array", "offset": 32, "size": 4}, "TotalTime": {"native": "Int32Array", "offset": 16, "size": 4}, "WorksLike": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 76, "union": false}, cStaticInitializerValues({"WorksLike": i32(9), "Clip": 0, "Reload": 0, "FireDelay": 3, "TotalTime": 5, "HoldDelay": 0, "Flags": i32(65536), "Shoots": i32(FREEZEBLAST____header_global_07f99ba4588f4c84), "SpawnTime": 0, "Spawn": 0, "ShotsPerBurst": 0, "InitialSound": i32(CAT_FIRE____header_global_a273946bc179c8dd), "FireSound": i32(CAT_FIRE____header_global_a273946bc179c8dd), "Sound2Time": 0, "Sound2Sound": 0, "ReloadSound1": i32(EJECT_CLIP____header_global_9c229ab00750da0a), "ReloadSound2": i32(INSERT_CLIP____header_global_d9183cad0d97d626), "SelectSound": i32(SELECT_WEAPON____header_global_05d1bf3e9599453c), "FlashColor": i32((i32((72 + i32((88 << 8)))) + i32((140 << 16))))}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"Clip": {"native": "Int32Array", "offset": 4, "size": 4}, "FireDelay": {"native": "Int32Array", "offset": 12, "size": 4}, "FireSound": {"native": "Int32Array", "offset": 48, "size": 4}, "Flags": {"native": "Int32Array", "offset": 24, "size": 4}, "FlashColor": {"native": "Int32Array", "offset": 72, "size": 4}, "HoldDelay": {"native": "Int32Array", "offset": 20, "size": 4}, "InitialSound": {"native": "Int32Array", "offset": 44, "size": 4}, "Reload": {"native": "Int32Array", "offset": 8, "size": 4}, "ReloadSound1": {"native": "Int32Array", "offset": 60, "size": 4}, "ReloadSound2": {"native": "Int32Array", "offset": 64, "size": 4}, "SelectSound": {"native": "Int32Array", "offset": 68, "size": 4}, "Shoots": {"native": "Int32Array", "offset": 28, "size": 4}, "ShotsPerBurst": {"native": "Int32Array", "offset": 40, "size": 4}, "Sound2Sound": {"native": "Int32Array", "offset": 56, "size": 4}, "Sound2Time": {"native": "Int32Array", "offset": 52, "size": 4}, "Spawn": {"native": "Int32Array", "offset": 36, "size": 4}, "SpawnTime": {"native": "Int32Array", "offset": 32, "size": 4}, "TotalTime": {"native": "Int32Array", "offset": 16, "size": 4}, "WorksLike": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 76, "union": false}, cStaticInitializerValues({"WorksLike": i32(10), "Clip": 0, "Reload": 10, "FireDelay": 2, "TotalTime": 10, "HoldDelay": 0, "Flags": i32((i32(128) | i32(256))), "Shoots": 0, "SpawnTime": 0, "Spawn": 0, "ShotsPerBurst": 0, "InitialSound": 0, "FireSound": 0, "Sound2Time": 0, "Sound2Sound": 0, "ReloadSound1": i32(EJECT_CLIP____header_global_9c229ab00750da0a), "ReloadSound2": i32(INSERT_CLIP____header_global_d9183cad0d97d626), "SelectSound": 0, "FlashColor": 0}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"Clip": {"native": "Int32Array", "offset": 4, "size": 4}, "FireDelay": {"native": "Int32Array", "offset": 12, "size": 4}, "FireSound": {"native": "Int32Array", "offset": 48, "size": 4}, "Flags": {"native": "Int32Array", "offset": 24, "size": 4}, "FlashColor": {"native": "Int32Array", "offset": 72, "size": 4}, "HoldDelay": {"native": "Int32Array", "offset": 20, "size": 4}, "InitialSound": {"native": "Int32Array", "offset": 44, "size": 4}, "Reload": {"native": "Int32Array", "offset": 8, "size": 4}, "ReloadSound1": {"native": "Int32Array", "offset": 60, "size": 4}, "ReloadSound2": {"native": "Int32Array", "offset": 64, "size": 4}, "SelectSound": {"native": "Int32Array", "offset": 68, "size": 4}, "Shoots": {"native": "Int32Array", "offset": 28, "size": 4}, "ShotsPerBurst": {"native": "Int32Array", "offset": 40, "size": 4}, "Sound2Sound": {"native": "Int32Array", "offset": 56, "size": 4}, "Sound2Time": {"native": "Int32Array", "offset": 52, "size": 4}, "Spawn": {"native": "Int32Array", "offset": 36, "size": 4}, "SpawnTime": {"native": "Int32Array", "offset": 32, "size": 4}, "TotalTime": {"native": "Int32Array", "offset": 16, "size": 4}, "WorksLike": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 76, "union": false}, cStaticInitializerValues({"WorksLike": i32(11), "Clip": 0, "Reload": 0, "FireDelay": 3, "TotalTime": 5, "HoldDelay": 0, "Flags": i32(2), "Shoots": i32(GROWSPARK____header_global_9db981fb2fd4983c), "SpawnTime": 0, "Spawn": 0, "ShotsPerBurst": 0, "InitialSound": 0, "FireSound": i32(EXPANDERSHOOT____header_global_903bb251d3ce6db0), "Sound2Time": 0, "Sound2Sound": 0, "ReloadSound1": i32(EJECT_CLIP____header_global_9c229ab00750da0a), "ReloadSound2": i32(INSERT_CLIP____header_global_d9183cad0d97d626), "SelectSound": i32(SELECT_WEAPON____header_global_05d1bf3e9599453c), "FlashColor": i32((i32((216 + i32((52 << 8)))) + i32((20 << 16))))}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"Clip": {"native": "Int32Array", "offset": 4, "size": 4}, "FireDelay": {"native": "Int32Array", "offset": 12, "size": 4}, "FireSound": {"native": "Int32Array", "offset": 48, "size": 4}, "Flags": {"native": "Int32Array", "offset": 24, "size": 4}, "FlashColor": {"native": "Int32Array", "offset": 72, "size": 4}, "HoldDelay": {"native": "Int32Array", "offset": 20, "size": 4}, "InitialSound": {"native": "Int32Array", "offset": 44, "size": 4}, "Reload": {"native": "Int32Array", "offset": 8, "size": 4}, "ReloadSound1": {"native": "Int32Array", "offset": 60, "size": 4}, "ReloadSound2": {"native": "Int32Array", "offset": 64, "size": 4}, "SelectSound": {"native": "Int32Array", "offset": 68, "size": 4}, "Shoots": {"native": "Int32Array", "offset": 28, "size": 4}, "ShotsPerBurst": {"native": "Int32Array", "offset": 40, "size": 4}, "Sound2Sound": {"native": "Int32Array", "offset": 56, "size": 4}, "Sound2Time": {"native": "Int32Array", "offset": 52, "size": 4}, "Spawn": {"native": "Int32Array", "offset": 36, "size": 4}, "SpawnTime": {"native": "Int32Array", "offset": 32, "size": 4}, "TotalTime": {"native": "Int32Array", "offset": 16, "size": 4}, "WorksLike": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 76, "union": false}, cStaticInitializerValues({"WorksLike": i32(12), "Clip": 0, "Reload": 0, "FireDelay": 2, "TotalTime": 16, "HoldDelay": 0, "Flags": i32(65536), "Shoots": i32(FIREBALL____header_global_629be7d5934070ad), "SpawnTime": 0, "Spawn": 0, "ShotsPerBurst": 0, "InitialSound": i32(FLAMETHROWER_INTRO____header_global_d8a0b7194932a1a0), "FireSound": i32(FLAMETHROWER_INTRO____header_global_d8a0b7194932a1a0), "Sound2Time": 0, "Sound2Sound": 0, "ReloadSound1": i32(EJECT_CLIP____header_global_9c229ab00750da0a), "ReloadSound2": i32(INSERT_CLIP____header_global_d9183cad0d97d626), "SelectSound": i32(SELECT_WEAPON____header_global_05d1bf3e9599453c), "FlashColor": i32((i32((216 + i32((52 << 8)))) + i32((20 << 16))))}), null, {})]));
function __cxx_static_address_0cc5111497d293e0a89cb218() {
  return __cxx_static_address_0cc5111497d293e0a89cb218.reference || (__cxx_static_address_0cc5111497d293e0a89cb218.reference = {
    __cReference: true,
    get value() { return weapondefaults; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/gamevars.cpp:1590
export function G_StaticToDynamicTile(tile) {
  switch (tile) {
    case i32(CHAINGUN____header_global_89711fbc219eeb10): {
      return i32(__cxx_global_cell_be5f3f16c99aa0c4c7540262().value);
    }
    case i32(FREEZEBLAST____header_global_07f99ba4588f4c84): {
      return i32(__cxx_global_cell_0aa6eda7dfb9c2ede217d4d4().value);
    }
    case i32(GROWSPARK____header_global_9db981fb2fd4983c): {
      return i32(__cxx_global_cell_182ff03ee4fe21aadf00a8be().value);
    }
    case i32(HANDHOLDINGLASER____header_global_d526d9ac88449647): {
      return i32(__cxx_global_cell_a1135ec6e3c71ee50e4480df().value);
    }
    case i32(HEAVYHBOMB____header_global_38319da82abc8fc3): {
      return i32(__cxx_global_cell_57ca2f37062e039be72ab5d5().value);
    }
    case i32(KNEE____header_global_fe4ce5c7f20fd39f): {
      return i32(__cxx_global_cell_81a5050f1681bde302982f87().value);
    }
    case i32(RPG____header_global_dbb5cd4ccf59d761): {
      return i32(__cxx_global_cell_9871087b1b184d775c972766().value);
    }
    case i32(SHELL____header_global_f8dce4ba7f3614c0): {
      return i32(__cxx_global_cell_665d998270647c7ad8e0914d().value);
    }
    case i32(SHOTGUNSHELL____header_global_3b37f1e099b4e1c7): {
      return i32(__cxx_global_cell_87081bf72dadfcd3df68bcc9().value);
    }
    case i32(SHOTGUN____header_global_cbd049448615880f): {
      return i32(__cxx_global_cell_0371d4defc194a93e64fb6eb().value);
    }
    case i32(SHOTSPARK1____header_global_2d67184b3dd2f624): {
      return i32(__cxx_global_cell_1b018f3cb172f441e7f0f065().value);
    }
    case i32(SHRINKER____header_global_20d1aaf9aa975764): {
      return i32(__cxx_global_cell_67305eaca81f492a2d16db0d().value);
    }
    default: {
      return i32(tile);
    }
  }
}

// C/C++ source: source/duke3d/src/gamevars.cpp:1612
export function G_StaticToDynamicSound(sound) {
  switch (sound) {
    case i32(CAT_FIRE____header_global_a273946bc179c8dd): {
      return i32(__cxx_global_cell_4f8061263e8b951c81aacfd0().value);
    }
    case i32(CHAINGUN_FIRE____header_global_69d9f94b57752638): {
      return i32(__cxx_global_cell_e0021f00946f9fcef1493fe8().value);
    }
    case i32(EJECT_CLIP____header_global_9c229ab00750da0a): {
      return i32(__cxx_global_cell_9290bc0bb3f2727885bdfb0e().value);
    }
    case i32(EXPANDERSHOOT____header_global_903bb251d3ce6db0): {
      return i32(__cxx_global_cell_2fbb894c12ee103752b36559().value);
    }
    case i32(INSERT_CLIP____header_global_d9183cad0d97d626): {
      return i32(__cxx_global_cell_0a348ba1bfc02b77af7e4204().value);
    }
    case i32(PISTOL_FIRE____header_global_64696cb3234ce690): {
      return i32(__cxx_global_cell_725e88840cca111651e3276d().value);
    }
    case i32(SELECT_WEAPON____header_global_05d1bf3e9599453c): {
      return i32(__cxx_global_cell_c4e9a6dc8cec5d981f8c75e7().value);
    }
    case i32(SHOTGUN_FIRE____header_global_a02083a8585a7678): {
      return i32(__cxx_global_cell_8ececfce0f4eb45cc64fe82b().value);
    }
    case i32(SHOTGUN_COCK____header_global_ea5f71d97148ad27): {
      return i32(__cxx_global_cell_f98f9d6620fc4928caeacaf6().value);
    }
    case i32(SHRINKER_FIRE____header_global_5d107e49af7df222): {
      return i32(__cxx_global_cell_1b705b619540483e827fd6ea().value);
    }
    default: {
      return i32(sound);
    }
  }
}

// C/C++ source: source/duke3d/src/gamevars.cpp:1654
export function Gv_FinalizeWeaponDefaults() {
  for (let i = i32(0); (i < i32(13)); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; }))) {
    do {
      if ((!Boolean((cPointerElementRef(cRecordPointer(g_weaponOverridden, {"align": 4, "arrayAlign": 1, "fields": {"Clip": {"native": "Int32Array", "offset": 4, "size": 4}, "FireDelay": {"native": "Int32Array", "offset": 12, "size": 4}, "FireSound": {"native": "Int32Array", "offset": 48, "size": 4}, "Flags": {"native": "Int32Array", "offset": 24, "size": 4}, "FlashColor": {"native": "Int32Array", "offset": 72, "size": 4}, "HoldDelay": {"native": "Int32Array", "offset": 20, "size": 4}, "InitialSound": {"native": "Int32Array", "offset": 44, "size": 4}, "Reload": {"native": "Int32Array", "offset": 8, "size": 4}, "ReloadSound1": {"native": "Int32Array", "offset": 60, "size": 4}, "ReloadSound2": {"native": "Int32Array", "offset": 64, "size": 4}, "SelectSound": {"native": "Int32Array", "offset": 68, "size": 4}, "Shoots": {"native": "Int32Array", "offset": 28, "size": 4}, "ShotsPerBurst": {"native": "Int32Array", "offset": 40, "size": 4}, "Sound2Sound": {"native": "Int32Array", "offset": 56, "size": 4}, "Sound2Time": {"native": "Int32Array", "offset": 52, "size": 4}, "Spawn": {"native": "Int32Array", "offset": 36, "size": 4}, "SpawnTime": {"native": "Int32Array", "offset": 32, "size": 4}, "TotalTime": {"native": "Int32Array", "offset": 16, "size": 4}, "WorksLike": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 76, "union": false}, {}), i).value).Shoots))) {
        ((cPointerElementRef(cRecordPointer(weapondefaults, {"align": 4, "arrayAlign": 1, "fields": {"Clip": {"native": "Int32Array", "offset": 4, "size": 4}, "FireDelay": {"native": "Int32Array", "offset": 12, "size": 4}, "FireSound": {"native": "Int32Array", "offset": 48, "size": 4}, "Flags": {"native": "Int32Array", "offset": 24, "size": 4}, "FlashColor": {"native": "Int32Array", "offset": 72, "size": 4}, "HoldDelay": {"native": "Int32Array", "offset": 20, "size": 4}, "InitialSound": {"native": "Int32Array", "offset": 44, "size": 4}, "Reload": {"native": "Int32Array", "offset": 8, "size": 4}, "ReloadSound1": {"native": "Int32Array", "offset": 60, "size": 4}, "ReloadSound2": {"native": "Int32Array", "offset": 64, "size": 4}, "SelectSound": {"native": "Int32Array", "offset": 68, "size": 4}, "Shoots": {"native": "Int32Array", "offset": 28, "size": 4}, "ShotsPerBurst": {"native": "Int32Array", "offset": 40, "size": 4}, "Sound2Sound": {"native": "Int32Array", "offset": 56, "size": 4}, "Sound2Time": {"native": "Int32Array", "offset": 52, "size": 4}, "Spawn": {"native": "Int32Array", "offset": 36, "size": 4}, "SpawnTime": {"native": "Int32Array", "offset": 32, "size": 4}, "TotalTime": {"native": "Int32Array", "offset": 16, "size": 4}, "WorksLike": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 76, "union": false}, {}), i).value).Shoots = i32(G_StaticToDynamicTile((cPointerElementRef(cRecordPointer(weapondefaults, {"align": 4, "arrayAlign": 1, "fields": {"Clip": {"native": "Int32Array", "offset": 4, "size": 4}, "FireDelay": {"native": "Int32Array", "offset": 12, "size": 4}, "FireSound": {"native": "Int32Array", "offset": 48, "size": 4}, "Flags": {"native": "Int32Array", "offset": 24, "size": 4}, "FlashColor": {"native": "Int32Array", "offset": 72, "size": 4}, "HoldDelay": {"native": "Int32Array", "offset": 20, "size": 4}, "InitialSound": {"native": "Int32Array", "offset": 44, "size": 4}, "Reload": {"native": "Int32Array", "offset": 8, "size": 4}, "ReloadSound1": {"native": "Int32Array", "offset": 60, "size": 4}, "ReloadSound2": {"native": "Int32Array", "offset": 64, "size": 4}, "SelectSound": {"native": "Int32Array", "offset": 68, "size": 4}, "Shoots": {"native": "Int32Array", "offset": 28, "size": 4}, "ShotsPerBurst": {"native": "Int32Array", "offset": 40, "size": 4}, "Sound2Sound": {"native": "Int32Array", "offset": 56, "size": 4}, "Sound2Time": {"native": "Int32Array", "offset": 52, "size": 4}, "Spawn": {"native": "Int32Array", "offset": 36, "size": 4}, "SpawnTime": {"native": "Int32Array", "offset": 32, "size": 4}, "TotalTime": {"native": "Int32Array", "offset": 16, "size": 4}, "WorksLike": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 76, "union": false}, {}), i).value).Shoots)));
      }
    } while (Boolean(0));
    do {
      if ((!Boolean((cPointerElementRef(cRecordPointer(g_weaponOverridden, {"align": 4, "arrayAlign": 1, "fields": {"Clip": {"native": "Int32Array", "offset": 4, "size": 4}, "FireDelay": {"native": "Int32Array", "offset": 12, "size": 4}, "FireSound": {"native": "Int32Array", "offset": 48, "size": 4}, "Flags": {"native": "Int32Array", "offset": 24, "size": 4}, "FlashColor": {"native": "Int32Array", "offset": 72, "size": 4}, "HoldDelay": {"native": "Int32Array", "offset": 20, "size": 4}, "InitialSound": {"native": "Int32Array", "offset": 44, "size": 4}, "Reload": {"native": "Int32Array", "offset": 8, "size": 4}, "ReloadSound1": {"native": "Int32Array", "offset": 60, "size": 4}, "ReloadSound2": {"native": "Int32Array", "offset": 64, "size": 4}, "SelectSound": {"native": "Int32Array", "offset": 68, "size": 4}, "Shoots": {"native": "Int32Array", "offset": 28, "size": 4}, "ShotsPerBurst": {"native": "Int32Array", "offset": 40, "size": 4}, "Sound2Sound": {"native": "Int32Array", "offset": 56, "size": 4}, "Sound2Time": {"native": "Int32Array", "offset": 52, "size": 4}, "Spawn": {"native": "Int32Array", "offset": 36, "size": 4}, "SpawnTime": {"native": "Int32Array", "offset": 32, "size": 4}, "TotalTime": {"native": "Int32Array", "offset": 16, "size": 4}, "WorksLike": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 76, "union": false}, {}), i).value).Spawn))) {
        ((cPointerElementRef(cRecordPointer(weapondefaults, {"align": 4, "arrayAlign": 1, "fields": {"Clip": {"native": "Int32Array", "offset": 4, "size": 4}, "FireDelay": {"native": "Int32Array", "offset": 12, "size": 4}, "FireSound": {"native": "Int32Array", "offset": 48, "size": 4}, "Flags": {"native": "Int32Array", "offset": 24, "size": 4}, "FlashColor": {"native": "Int32Array", "offset": 72, "size": 4}, "HoldDelay": {"native": "Int32Array", "offset": 20, "size": 4}, "InitialSound": {"native": "Int32Array", "offset": 44, "size": 4}, "Reload": {"native": "Int32Array", "offset": 8, "size": 4}, "ReloadSound1": {"native": "Int32Array", "offset": 60, "size": 4}, "ReloadSound2": {"native": "Int32Array", "offset": 64, "size": 4}, "SelectSound": {"native": "Int32Array", "offset": 68, "size": 4}, "Shoots": {"native": "Int32Array", "offset": 28, "size": 4}, "ShotsPerBurst": {"native": "Int32Array", "offset": 40, "size": 4}, "Sound2Sound": {"native": "Int32Array", "offset": 56, "size": 4}, "Sound2Time": {"native": "Int32Array", "offset": 52, "size": 4}, "Spawn": {"native": "Int32Array", "offset": 36, "size": 4}, "SpawnTime": {"native": "Int32Array", "offset": 32, "size": 4}, "TotalTime": {"native": "Int32Array", "offset": 16, "size": 4}, "WorksLike": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 76, "union": false}, {}), i).value).Spawn = i32(G_StaticToDynamicTile((cPointerElementRef(cRecordPointer(weapondefaults, {"align": 4, "arrayAlign": 1, "fields": {"Clip": {"native": "Int32Array", "offset": 4, "size": 4}, "FireDelay": {"native": "Int32Array", "offset": 12, "size": 4}, "FireSound": {"native": "Int32Array", "offset": 48, "size": 4}, "Flags": {"native": "Int32Array", "offset": 24, "size": 4}, "FlashColor": {"native": "Int32Array", "offset": 72, "size": 4}, "HoldDelay": {"native": "Int32Array", "offset": 20, "size": 4}, "InitialSound": {"native": "Int32Array", "offset": 44, "size": 4}, "Reload": {"native": "Int32Array", "offset": 8, "size": 4}, "ReloadSound1": {"native": "Int32Array", "offset": 60, "size": 4}, "ReloadSound2": {"native": "Int32Array", "offset": 64, "size": 4}, "SelectSound": {"native": "Int32Array", "offset": 68, "size": 4}, "Shoots": {"native": "Int32Array", "offset": 28, "size": 4}, "ShotsPerBurst": {"native": "Int32Array", "offset": 40, "size": 4}, "Sound2Sound": {"native": "Int32Array", "offset": 56, "size": 4}, "Sound2Time": {"native": "Int32Array", "offset": 52, "size": 4}, "Spawn": {"native": "Int32Array", "offset": 36, "size": 4}, "SpawnTime": {"native": "Int32Array", "offset": 32, "size": 4}, "TotalTime": {"native": "Int32Array", "offset": 16, "size": 4}, "WorksLike": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 76, "union": false}, {}), i).value).Spawn)));
      }
    } while (Boolean(0));
    do {
      if ((!Boolean((cPointerElementRef(cRecordPointer(g_weaponOverridden, {"align": 4, "arrayAlign": 1, "fields": {"Clip": {"native": "Int32Array", "offset": 4, "size": 4}, "FireDelay": {"native": "Int32Array", "offset": 12, "size": 4}, "FireSound": {"native": "Int32Array", "offset": 48, "size": 4}, "Flags": {"native": "Int32Array", "offset": 24, "size": 4}, "FlashColor": {"native": "Int32Array", "offset": 72, "size": 4}, "HoldDelay": {"native": "Int32Array", "offset": 20, "size": 4}, "InitialSound": {"native": "Int32Array", "offset": 44, "size": 4}, "Reload": {"native": "Int32Array", "offset": 8, "size": 4}, "ReloadSound1": {"native": "Int32Array", "offset": 60, "size": 4}, "ReloadSound2": {"native": "Int32Array", "offset": 64, "size": 4}, "SelectSound": {"native": "Int32Array", "offset": 68, "size": 4}, "Shoots": {"native": "Int32Array", "offset": 28, "size": 4}, "ShotsPerBurst": {"native": "Int32Array", "offset": 40, "size": 4}, "Sound2Sound": {"native": "Int32Array", "offset": 56, "size": 4}, "Sound2Time": {"native": "Int32Array", "offset": 52, "size": 4}, "Spawn": {"native": "Int32Array", "offset": 36, "size": 4}, "SpawnTime": {"native": "Int32Array", "offset": 32, "size": 4}, "TotalTime": {"native": "Int32Array", "offset": 16, "size": 4}, "WorksLike": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 76, "union": false}, {}), i).value).InitialSound))) {
        ((cPointerElementRef(cRecordPointer(weapondefaults, {"align": 4, "arrayAlign": 1, "fields": {"Clip": {"native": "Int32Array", "offset": 4, "size": 4}, "FireDelay": {"native": "Int32Array", "offset": 12, "size": 4}, "FireSound": {"native": "Int32Array", "offset": 48, "size": 4}, "Flags": {"native": "Int32Array", "offset": 24, "size": 4}, "FlashColor": {"native": "Int32Array", "offset": 72, "size": 4}, "HoldDelay": {"native": "Int32Array", "offset": 20, "size": 4}, "InitialSound": {"native": "Int32Array", "offset": 44, "size": 4}, "Reload": {"native": "Int32Array", "offset": 8, "size": 4}, "ReloadSound1": {"native": "Int32Array", "offset": 60, "size": 4}, "ReloadSound2": {"native": "Int32Array", "offset": 64, "size": 4}, "SelectSound": {"native": "Int32Array", "offset": 68, "size": 4}, "Shoots": {"native": "Int32Array", "offset": 28, "size": 4}, "ShotsPerBurst": {"native": "Int32Array", "offset": 40, "size": 4}, "Sound2Sound": {"native": "Int32Array", "offset": 56, "size": 4}, "Sound2Time": {"native": "Int32Array", "offset": 52, "size": 4}, "Spawn": {"native": "Int32Array", "offset": 36, "size": 4}, "SpawnTime": {"native": "Int32Array", "offset": 32, "size": 4}, "TotalTime": {"native": "Int32Array", "offset": 16, "size": 4}, "WorksLike": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 76, "union": false}, {}), i).value).InitialSound = i32(G_StaticToDynamicSound((cPointerElementRef(cRecordPointer(weapondefaults, {"align": 4, "arrayAlign": 1, "fields": {"Clip": {"native": "Int32Array", "offset": 4, "size": 4}, "FireDelay": {"native": "Int32Array", "offset": 12, "size": 4}, "FireSound": {"native": "Int32Array", "offset": 48, "size": 4}, "Flags": {"native": "Int32Array", "offset": 24, "size": 4}, "FlashColor": {"native": "Int32Array", "offset": 72, "size": 4}, "HoldDelay": {"native": "Int32Array", "offset": 20, "size": 4}, "InitialSound": {"native": "Int32Array", "offset": 44, "size": 4}, "Reload": {"native": "Int32Array", "offset": 8, "size": 4}, "ReloadSound1": {"native": "Int32Array", "offset": 60, "size": 4}, "ReloadSound2": {"native": "Int32Array", "offset": 64, "size": 4}, "SelectSound": {"native": "Int32Array", "offset": 68, "size": 4}, "Shoots": {"native": "Int32Array", "offset": 28, "size": 4}, "ShotsPerBurst": {"native": "Int32Array", "offset": 40, "size": 4}, "Sound2Sound": {"native": "Int32Array", "offset": 56, "size": 4}, "Sound2Time": {"native": "Int32Array", "offset": 52, "size": 4}, "Spawn": {"native": "Int32Array", "offset": 36, "size": 4}, "SpawnTime": {"native": "Int32Array", "offset": 32, "size": 4}, "TotalTime": {"native": "Int32Array", "offset": 16, "size": 4}, "WorksLike": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 76, "union": false}, {}), i).value).InitialSound)));
      }
    } while (Boolean(0));
    do {
      if ((!Boolean((cPointerElementRef(cRecordPointer(g_weaponOverridden, {"align": 4, "arrayAlign": 1, "fields": {"Clip": {"native": "Int32Array", "offset": 4, "size": 4}, "FireDelay": {"native": "Int32Array", "offset": 12, "size": 4}, "FireSound": {"native": "Int32Array", "offset": 48, "size": 4}, "Flags": {"native": "Int32Array", "offset": 24, "size": 4}, "FlashColor": {"native": "Int32Array", "offset": 72, "size": 4}, "HoldDelay": {"native": "Int32Array", "offset": 20, "size": 4}, "InitialSound": {"native": "Int32Array", "offset": 44, "size": 4}, "Reload": {"native": "Int32Array", "offset": 8, "size": 4}, "ReloadSound1": {"native": "Int32Array", "offset": 60, "size": 4}, "ReloadSound2": {"native": "Int32Array", "offset": 64, "size": 4}, "SelectSound": {"native": "Int32Array", "offset": 68, "size": 4}, "Shoots": {"native": "Int32Array", "offset": 28, "size": 4}, "ShotsPerBurst": {"native": "Int32Array", "offset": 40, "size": 4}, "Sound2Sound": {"native": "Int32Array", "offset": 56, "size": 4}, "Sound2Time": {"native": "Int32Array", "offset": 52, "size": 4}, "Spawn": {"native": "Int32Array", "offset": 36, "size": 4}, "SpawnTime": {"native": "Int32Array", "offset": 32, "size": 4}, "TotalTime": {"native": "Int32Array", "offset": 16, "size": 4}, "WorksLike": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 76, "union": false}, {}), i).value).FireSound))) {
        ((cPointerElementRef(cRecordPointer(weapondefaults, {"align": 4, "arrayAlign": 1, "fields": {"Clip": {"native": "Int32Array", "offset": 4, "size": 4}, "FireDelay": {"native": "Int32Array", "offset": 12, "size": 4}, "FireSound": {"native": "Int32Array", "offset": 48, "size": 4}, "Flags": {"native": "Int32Array", "offset": 24, "size": 4}, "FlashColor": {"native": "Int32Array", "offset": 72, "size": 4}, "HoldDelay": {"native": "Int32Array", "offset": 20, "size": 4}, "InitialSound": {"native": "Int32Array", "offset": 44, "size": 4}, "Reload": {"native": "Int32Array", "offset": 8, "size": 4}, "ReloadSound1": {"native": "Int32Array", "offset": 60, "size": 4}, "ReloadSound2": {"native": "Int32Array", "offset": 64, "size": 4}, "SelectSound": {"native": "Int32Array", "offset": 68, "size": 4}, "Shoots": {"native": "Int32Array", "offset": 28, "size": 4}, "ShotsPerBurst": {"native": "Int32Array", "offset": 40, "size": 4}, "Sound2Sound": {"native": "Int32Array", "offset": 56, "size": 4}, "Sound2Time": {"native": "Int32Array", "offset": 52, "size": 4}, "Spawn": {"native": "Int32Array", "offset": 36, "size": 4}, "SpawnTime": {"native": "Int32Array", "offset": 32, "size": 4}, "TotalTime": {"native": "Int32Array", "offset": 16, "size": 4}, "WorksLike": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 76, "union": false}, {}), i).value).FireSound = i32(G_StaticToDynamicSound((cPointerElementRef(cRecordPointer(weapondefaults, {"align": 4, "arrayAlign": 1, "fields": {"Clip": {"native": "Int32Array", "offset": 4, "size": 4}, "FireDelay": {"native": "Int32Array", "offset": 12, "size": 4}, "FireSound": {"native": "Int32Array", "offset": 48, "size": 4}, "Flags": {"native": "Int32Array", "offset": 24, "size": 4}, "FlashColor": {"native": "Int32Array", "offset": 72, "size": 4}, "HoldDelay": {"native": "Int32Array", "offset": 20, "size": 4}, "InitialSound": {"native": "Int32Array", "offset": 44, "size": 4}, "Reload": {"native": "Int32Array", "offset": 8, "size": 4}, "ReloadSound1": {"native": "Int32Array", "offset": 60, "size": 4}, "ReloadSound2": {"native": "Int32Array", "offset": 64, "size": 4}, "SelectSound": {"native": "Int32Array", "offset": 68, "size": 4}, "Shoots": {"native": "Int32Array", "offset": 28, "size": 4}, "ShotsPerBurst": {"native": "Int32Array", "offset": 40, "size": 4}, "Sound2Sound": {"native": "Int32Array", "offset": 56, "size": 4}, "Sound2Time": {"native": "Int32Array", "offset": 52, "size": 4}, "Spawn": {"native": "Int32Array", "offset": 36, "size": 4}, "SpawnTime": {"native": "Int32Array", "offset": 32, "size": 4}, "TotalTime": {"native": "Int32Array", "offset": 16, "size": 4}, "WorksLike": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 76, "union": false}, {}), i).value).FireSound)));
      }
    } while (Boolean(0));
    do {
      if ((!Boolean((cPointerElementRef(cRecordPointer(g_weaponOverridden, {"align": 4, "arrayAlign": 1, "fields": {"Clip": {"native": "Int32Array", "offset": 4, "size": 4}, "FireDelay": {"native": "Int32Array", "offset": 12, "size": 4}, "FireSound": {"native": "Int32Array", "offset": 48, "size": 4}, "Flags": {"native": "Int32Array", "offset": 24, "size": 4}, "FlashColor": {"native": "Int32Array", "offset": 72, "size": 4}, "HoldDelay": {"native": "Int32Array", "offset": 20, "size": 4}, "InitialSound": {"native": "Int32Array", "offset": 44, "size": 4}, "Reload": {"native": "Int32Array", "offset": 8, "size": 4}, "ReloadSound1": {"native": "Int32Array", "offset": 60, "size": 4}, "ReloadSound2": {"native": "Int32Array", "offset": 64, "size": 4}, "SelectSound": {"native": "Int32Array", "offset": 68, "size": 4}, "Shoots": {"native": "Int32Array", "offset": 28, "size": 4}, "ShotsPerBurst": {"native": "Int32Array", "offset": 40, "size": 4}, "Sound2Sound": {"native": "Int32Array", "offset": 56, "size": 4}, "Sound2Time": {"native": "Int32Array", "offset": 52, "size": 4}, "Spawn": {"native": "Int32Array", "offset": 36, "size": 4}, "SpawnTime": {"native": "Int32Array", "offset": 32, "size": 4}, "TotalTime": {"native": "Int32Array", "offset": 16, "size": 4}, "WorksLike": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 76, "union": false}, {}), i).value).ReloadSound1))) {
        ((cPointerElementRef(cRecordPointer(weapondefaults, {"align": 4, "arrayAlign": 1, "fields": {"Clip": {"native": "Int32Array", "offset": 4, "size": 4}, "FireDelay": {"native": "Int32Array", "offset": 12, "size": 4}, "FireSound": {"native": "Int32Array", "offset": 48, "size": 4}, "Flags": {"native": "Int32Array", "offset": 24, "size": 4}, "FlashColor": {"native": "Int32Array", "offset": 72, "size": 4}, "HoldDelay": {"native": "Int32Array", "offset": 20, "size": 4}, "InitialSound": {"native": "Int32Array", "offset": 44, "size": 4}, "Reload": {"native": "Int32Array", "offset": 8, "size": 4}, "ReloadSound1": {"native": "Int32Array", "offset": 60, "size": 4}, "ReloadSound2": {"native": "Int32Array", "offset": 64, "size": 4}, "SelectSound": {"native": "Int32Array", "offset": 68, "size": 4}, "Shoots": {"native": "Int32Array", "offset": 28, "size": 4}, "ShotsPerBurst": {"native": "Int32Array", "offset": 40, "size": 4}, "Sound2Sound": {"native": "Int32Array", "offset": 56, "size": 4}, "Sound2Time": {"native": "Int32Array", "offset": 52, "size": 4}, "Spawn": {"native": "Int32Array", "offset": 36, "size": 4}, "SpawnTime": {"native": "Int32Array", "offset": 32, "size": 4}, "TotalTime": {"native": "Int32Array", "offset": 16, "size": 4}, "WorksLike": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 76, "union": false}, {}), i).value).ReloadSound1 = i32(G_StaticToDynamicSound((cPointerElementRef(cRecordPointer(weapondefaults, {"align": 4, "arrayAlign": 1, "fields": {"Clip": {"native": "Int32Array", "offset": 4, "size": 4}, "FireDelay": {"native": "Int32Array", "offset": 12, "size": 4}, "FireSound": {"native": "Int32Array", "offset": 48, "size": 4}, "Flags": {"native": "Int32Array", "offset": 24, "size": 4}, "FlashColor": {"native": "Int32Array", "offset": 72, "size": 4}, "HoldDelay": {"native": "Int32Array", "offset": 20, "size": 4}, "InitialSound": {"native": "Int32Array", "offset": 44, "size": 4}, "Reload": {"native": "Int32Array", "offset": 8, "size": 4}, "ReloadSound1": {"native": "Int32Array", "offset": 60, "size": 4}, "ReloadSound2": {"native": "Int32Array", "offset": 64, "size": 4}, "SelectSound": {"native": "Int32Array", "offset": 68, "size": 4}, "Shoots": {"native": "Int32Array", "offset": 28, "size": 4}, "ShotsPerBurst": {"native": "Int32Array", "offset": 40, "size": 4}, "Sound2Sound": {"native": "Int32Array", "offset": 56, "size": 4}, "Sound2Time": {"native": "Int32Array", "offset": 52, "size": 4}, "Spawn": {"native": "Int32Array", "offset": 36, "size": 4}, "SpawnTime": {"native": "Int32Array", "offset": 32, "size": 4}, "TotalTime": {"native": "Int32Array", "offset": 16, "size": 4}, "WorksLike": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 76, "union": false}, {}), i).value).ReloadSound1)));
      }
    } while (Boolean(0));
    do {
      if ((!Boolean((cPointerElementRef(cRecordPointer(g_weaponOverridden, {"align": 4, "arrayAlign": 1, "fields": {"Clip": {"native": "Int32Array", "offset": 4, "size": 4}, "FireDelay": {"native": "Int32Array", "offset": 12, "size": 4}, "FireSound": {"native": "Int32Array", "offset": 48, "size": 4}, "Flags": {"native": "Int32Array", "offset": 24, "size": 4}, "FlashColor": {"native": "Int32Array", "offset": 72, "size": 4}, "HoldDelay": {"native": "Int32Array", "offset": 20, "size": 4}, "InitialSound": {"native": "Int32Array", "offset": 44, "size": 4}, "Reload": {"native": "Int32Array", "offset": 8, "size": 4}, "ReloadSound1": {"native": "Int32Array", "offset": 60, "size": 4}, "ReloadSound2": {"native": "Int32Array", "offset": 64, "size": 4}, "SelectSound": {"native": "Int32Array", "offset": 68, "size": 4}, "Shoots": {"native": "Int32Array", "offset": 28, "size": 4}, "ShotsPerBurst": {"native": "Int32Array", "offset": 40, "size": 4}, "Sound2Sound": {"native": "Int32Array", "offset": 56, "size": 4}, "Sound2Time": {"native": "Int32Array", "offset": 52, "size": 4}, "Spawn": {"native": "Int32Array", "offset": 36, "size": 4}, "SpawnTime": {"native": "Int32Array", "offset": 32, "size": 4}, "TotalTime": {"native": "Int32Array", "offset": 16, "size": 4}, "WorksLike": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 76, "union": false}, {}), i).value).Sound2Sound))) {
        ((cPointerElementRef(cRecordPointer(weapondefaults, {"align": 4, "arrayAlign": 1, "fields": {"Clip": {"native": "Int32Array", "offset": 4, "size": 4}, "FireDelay": {"native": "Int32Array", "offset": 12, "size": 4}, "FireSound": {"native": "Int32Array", "offset": 48, "size": 4}, "Flags": {"native": "Int32Array", "offset": 24, "size": 4}, "FlashColor": {"native": "Int32Array", "offset": 72, "size": 4}, "HoldDelay": {"native": "Int32Array", "offset": 20, "size": 4}, "InitialSound": {"native": "Int32Array", "offset": 44, "size": 4}, "Reload": {"native": "Int32Array", "offset": 8, "size": 4}, "ReloadSound1": {"native": "Int32Array", "offset": 60, "size": 4}, "ReloadSound2": {"native": "Int32Array", "offset": 64, "size": 4}, "SelectSound": {"native": "Int32Array", "offset": 68, "size": 4}, "Shoots": {"native": "Int32Array", "offset": 28, "size": 4}, "ShotsPerBurst": {"native": "Int32Array", "offset": 40, "size": 4}, "Sound2Sound": {"native": "Int32Array", "offset": 56, "size": 4}, "Sound2Time": {"native": "Int32Array", "offset": 52, "size": 4}, "Spawn": {"native": "Int32Array", "offset": 36, "size": 4}, "SpawnTime": {"native": "Int32Array", "offset": 32, "size": 4}, "TotalTime": {"native": "Int32Array", "offset": 16, "size": 4}, "WorksLike": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 76, "union": false}, {}), i).value).Sound2Sound = i32(G_StaticToDynamicSound((cPointerElementRef(cRecordPointer(weapondefaults, {"align": 4, "arrayAlign": 1, "fields": {"Clip": {"native": "Int32Array", "offset": 4, "size": 4}, "FireDelay": {"native": "Int32Array", "offset": 12, "size": 4}, "FireSound": {"native": "Int32Array", "offset": 48, "size": 4}, "Flags": {"native": "Int32Array", "offset": 24, "size": 4}, "FlashColor": {"native": "Int32Array", "offset": 72, "size": 4}, "HoldDelay": {"native": "Int32Array", "offset": 20, "size": 4}, "InitialSound": {"native": "Int32Array", "offset": 44, "size": 4}, "Reload": {"native": "Int32Array", "offset": 8, "size": 4}, "ReloadSound1": {"native": "Int32Array", "offset": 60, "size": 4}, "ReloadSound2": {"native": "Int32Array", "offset": 64, "size": 4}, "SelectSound": {"native": "Int32Array", "offset": 68, "size": 4}, "Shoots": {"native": "Int32Array", "offset": 28, "size": 4}, "ShotsPerBurst": {"native": "Int32Array", "offset": 40, "size": 4}, "Sound2Sound": {"native": "Int32Array", "offset": 56, "size": 4}, "Sound2Time": {"native": "Int32Array", "offset": 52, "size": 4}, "Spawn": {"native": "Int32Array", "offset": 36, "size": 4}, "SpawnTime": {"native": "Int32Array", "offset": 32, "size": 4}, "TotalTime": {"native": "Int32Array", "offset": 16, "size": 4}, "WorksLike": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 76, "union": false}, {}), i).value).Sound2Sound)));
      }
    } while (Boolean(0));
    do {
      if ((!Boolean((cPointerElementRef(cRecordPointer(g_weaponOverridden, {"align": 4, "arrayAlign": 1, "fields": {"Clip": {"native": "Int32Array", "offset": 4, "size": 4}, "FireDelay": {"native": "Int32Array", "offset": 12, "size": 4}, "FireSound": {"native": "Int32Array", "offset": 48, "size": 4}, "Flags": {"native": "Int32Array", "offset": 24, "size": 4}, "FlashColor": {"native": "Int32Array", "offset": 72, "size": 4}, "HoldDelay": {"native": "Int32Array", "offset": 20, "size": 4}, "InitialSound": {"native": "Int32Array", "offset": 44, "size": 4}, "Reload": {"native": "Int32Array", "offset": 8, "size": 4}, "ReloadSound1": {"native": "Int32Array", "offset": 60, "size": 4}, "ReloadSound2": {"native": "Int32Array", "offset": 64, "size": 4}, "SelectSound": {"native": "Int32Array", "offset": 68, "size": 4}, "Shoots": {"native": "Int32Array", "offset": 28, "size": 4}, "ShotsPerBurst": {"native": "Int32Array", "offset": 40, "size": 4}, "Sound2Sound": {"native": "Int32Array", "offset": 56, "size": 4}, "Sound2Time": {"native": "Int32Array", "offset": 52, "size": 4}, "Spawn": {"native": "Int32Array", "offset": 36, "size": 4}, "SpawnTime": {"native": "Int32Array", "offset": 32, "size": 4}, "TotalTime": {"native": "Int32Array", "offset": 16, "size": 4}, "WorksLike": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 76, "union": false}, {}), i).value).ReloadSound2))) {
        ((cPointerElementRef(cRecordPointer(weapondefaults, {"align": 4, "arrayAlign": 1, "fields": {"Clip": {"native": "Int32Array", "offset": 4, "size": 4}, "FireDelay": {"native": "Int32Array", "offset": 12, "size": 4}, "FireSound": {"native": "Int32Array", "offset": 48, "size": 4}, "Flags": {"native": "Int32Array", "offset": 24, "size": 4}, "FlashColor": {"native": "Int32Array", "offset": 72, "size": 4}, "HoldDelay": {"native": "Int32Array", "offset": 20, "size": 4}, "InitialSound": {"native": "Int32Array", "offset": 44, "size": 4}, "Reload": {"native": "Int32Array", "offset": 8, "size": 4}, "ReloadSound1": {"native": "Int32Array", "offset": 60, "size": 4}, "ReloadSound2": {"native": "Int32Array", "offset": 64, "size": 4}, "SelectSound": {"native": "Int32Array", "offset": 68, "size": 4}, "Shoots": {"native": "Int32Array", "offset": 28, "size": 4}, "ShotsPerBurst": {"native": "Int32Array", "offset": 40, "size": 4}, "Sound2Sound": {"native": "Int32Array", "offset": 56, "size": 4}, "Sound2Time": {"native": "Int32Array", "offset": 52, "size": 4}, "Spawn": {"native": "Int32Array", "offset": 36, "size": 4}, "SpawnTime": {"native": "Int32Array", "offset": 32, "size": 4}, "TotalTime": {"native": "Int32Array", "offset": 16, "size": 4}, "WorksLike": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 76, "union": false}, {}), i).value).ReloadSound2 = i32(G_StaticToDynamicSound((cPointerElementRef(cRecordPointer(weapondefaults, {"align": 4, "arrayAlign": 1, "fields": {"Clip": {"native": "Int32Array", "offset": 4, "size": 4}, "FireDelay": {"native": "Int32Array", "offset": 12, "size": 4}, "FireSound": {"native": "Int32Array", "offset": 48, "size": 4}, "Flags": {"native": "Int32Array", "offset": 24, "size": 4}, "FlashColor": {"native": "Int32Array", "offset": 72, "size": 4}, "HoldDelay": {"native": "Int32Array", "offset": 20, "size": 4}, "InitialSound": {"native": "Int32Array", "offset": 44, "size": 4}, "Reload": {"native": "Int32Array", "offset": 8, "size": 4}, "ReloadSound1": {"native": "Int32Array", "offset": 60, "size": 4}, "ReloadSound2": {"native": "Int32Array", "offset": 64, "size": 4}, "SelectSound": {"native": "Int32Array", "offset": 68, "size": 4}, "Shoots": {"native": "Int32Array", "offset": 28, "size": 4}, "ShotsPerBurst": {"native": "Int32Array", "offset": 40, "size": 4}, "Sound2Sound": {"native": "Int32Array", "offset": 56, "size": 4}, "Sound2Time": {"native": "Int32Array", "offset": 52, "size": 4}, "Spawn": {"native": "Int32Array", "offset": 36, "size": 4}, "SpawnTime": {"native": "Int32Array", "offset": 32, "size": 4}, "TotalTime": {"native": "Int32Array", "offset": 16, "size": 4}, "WorksLike": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 76, "union": false}, {}), i).value).ReloadSound2)));
      }
    } while (Boolean(0));
    do {
      if ((!Boolean((cPointerElementRef(cRecordPointer(g_weaponOverridden, {"align": 4, "arrayAlign": 1, "fields": {"Clip": {"native": "Int32Array", "offset": 4, "size": 4}, "FireDelay": {"native": "Int32Array", "offset": 12, "size": 4}, "FireSound": {"native": "Int32Array", "offset": 48, "size": 4}, "Flags": {"native": "Int32Array", "offset": 24, "size": 4}, "FlashColor": {"native": "Int32Array", "offset": 72, "size": 4}, "HoldDelay": {"native": "Int32Array", "offset": 20, "size": 4}, "InitialSound": {"native": "Int32Array", "offset": 44, "size": 4}, "Reload": {"native": "Int32Array", "offset": 8, "size": 4}, "ReloadSound1": {"native": "Int32Array", "offset": 60, "size": 4}, "ReloadSound2": {"native": "Int32Array", "offset": 64, "size": 4}, "SelectSound": {"native": "Int32Array", "offset": 68, "size": 4}, "Shoots": {"native": "Int32Array", "offset": 28, "size": 4}, "ShotsPerBurst": {"native": "Int32Array", "offset": 40, "size": 4}, "Sound2Sound": {"native": "Int32Array", "offset": 56, "size": 4}, "Sound2Time": {"native": "Int32Array", "offset": 52, "size": 4}, "Spawn": {"native": "Int32Array", "offset": 36, "size": 4}, "SpawnTime": {"native": "Int32Array", "offset": 32, "size": 4}, "TotalTime": {"native": "Int32Array", "offset": 16, "size": 4}, "WorksLike": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 76, "union": false}, {}), i).value).SelectSound))) {
        ((cPointerElementRef(cRecordPointer(weapondefaults, {"align": 4, "arrayAlign": 1, "fields": {"Clip": {"native": "Int32Array", "offset": 4, "size": 4}, "FireDelay": {"native": "Int32Array", "offset": 12, "size": 4}, "FireSound": {"native": "Int32Array", "offset": 48, "size": 4}, "Flags": {"native": "Int32Array", "offset": 24, "size": 4}, "FlashColor": {"native": "Int32Array", "offset": 72, "size": 4}, "HoldDelay": {"native": "Int32Array", "offset": 20, "size": 4}, "InitialSound": {"native": "Int32Array", "offset": 44, "size": 4}, "Reload": {"native": "Int32Array", "offset": 8, "size": 4}, "ReloadSound1": {"native": "Int32Array", "offset": 60, "size": 4}, "ReloadSound2": {"native": "Int32Array", "offset": 64, "size": 4}, "SelectSound": {"native": "Int32Array", "offset": 68, "size": 4}, "Shoots": {"native": "Int32Array", "offset": 28, "size": 4}, "ShotsPerBurst": {"native": "Int32Array", "offset": 40, "size": 4}, "Sound2Sound": {"native": "Int32Array", "offset": 56, "size": 4}, "Sound2Time": {"native": "Int32Array", "offset": 52, "size": 4}, "Spawn": {"native": "Int32Array", "offset": 36, "size": 4}, "SpawnTime": {"native": "Int32Array", "offset": 32, "size": 4}, "TotalTime": {"native": "Int32Array", "offset": 16, "size": 4}, "WorksLike": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 76, "union": false}, {}), i).value).SelectSound = i32(G_StaticToDynamicSound((cPointerElementRef(cRecordPointer(weapondefaults, {"align": 4, "arrayAlign": 1, "fields": {"Clip": {"native": "Int32Array", "offset": 4, "size": 4}, "FireDelay": {"native": "Int32Array", "offset": 12, "size": 4}, "FireSound": {"native": "Int32Array", "offset": 48, "size": 4}, "Flags": {"native": "Int32Array", "offset": 24, "size": 4}, "FlashColor": {"native": "Int32Array", "offset": 72, "size": 4}, "HoldDelay": {"native": "Int32Array", "offset": 20, "size": 4}, "InitialSound": {"native": "Int32Array", "offset": 44, "size": 4}, "Reload": {"native": "Int32Array", "offset": 8, "size": 4}, "ReloadSound1": {"native": "Int32Array", "offset": 60, "size": 4}, "ReloadSound2": {"native": "Int32Array", "offset": 64, "size": 4}, "SelectSound": {"native": "Int32Array", "offset": 68, "size": 4}, "Shoots": {"native": "Int32Array", "offset": 28, "size": 4}, "ShotsPerBurst": {"native": "Int32Array", "offset": 40, "size": 4}, "Sound2Sound": {"native": "Int32Array", "offset": 56, "size": 4}, "Sound2Time": {"native": "Int32Array", "offset": 52, "size": 4}, "Spawn": {"native": "Int32Array", "offset": 36, "size": 4}, "SpawnTime": {"native": "Int32Array", "offset": 32, "size": 4}, "TotalTime": {"native": "Int32Array", "offset": 16, "size": 4}, "WorksLike": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 76, "union": false}, {}), i).value).SelectSound)));
      }
    } while (Boolean(0));
  }
}

// C/C++ source: source/duke3d/src/gamevars.cpp:1673
export let lastvisinc = 0;
function __cxx_static_address_b834440029b478ecb74accfe() {
  return __cxx_static_address_b834440029b478ecb74accfe.reference || (__cxx_static_address_b834440029b478ecb74accfe.reference = {
    __cReference: true,
    get value() { return lastvisinc; },
    set value(__cxx_lvalue_0) { lastvisinc = i32(__cxx_lvalue_0); }
  });
}
export function __cxx_private_cell_b834440029b478ecb74accfe() { return __cxx_static_address_b834440029b478ecb74accfe(); }

// C/C++ source: source/build/include/compat.h:1169
export const pow2char__header_global_28f8b4adea4b716f = new Uint8Array([(u32(1) & 255), (u32(2) & 255), (u32(4) & 255), (u32(8) & 255), (u32(16) & 255), (u32(32) & 255), (u32(64) & 255), (u32(128) & 255)]);
function __cxx_static_address_540242d5a25ecf869addeacb() {
  return __cxx_static_address_540242d5a25ecf869addeacb.reference || (__cxx_static_address_540242d5a25ecf869addeacb.reference = {
    __cReference: true,
    get value() { return pow2char__header_global_28f8b4adea4b716f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_540242d5a25ecf869addeacb() { return __cxx_static_address_540242d5a25ecf869addeacb(); }

// C/C++ source: source/build/include/baselayer.h:172
export const g_defaultVideoModes__header_global_7f941a3cc563071e = cByteRecordNDArray({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, [25], {}, cStaticInitializerValues([cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 2560, "y": 1440}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 2560, "y": 1200}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 2560, "y": 1080}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1920, "y": 1440}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1920, "y": 1200}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1920, "y": 1080}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1680, "y": 1050}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1600, "y": 1200}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1600, "y": 900}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1366, "y": 768}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1280, "y": 1024}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1280, "y": 960}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1280, "y": 720}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1152, "y": 864}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1024, "y": 768}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1024, "y": 600}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 800, "y": 600}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 640, "y": 480}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 640, "y": 400}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 512, "y": 384}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 480, "y": 360}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 400, "y": 300}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 320, "y": 240}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 320, "y": 200}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 0, "y": 0}), null, {})]));
function __cxx_static_address_9824f7427071c1df9f212089() {
  return __cxx_static_address_9824f7427071c1df9f212089.reference || (__cxx_static_address_9824f7427071c1df9f212089.reference = {
    __cReference: true,
    get value() { return g_defaultVideoModes__header_global_7f941a3cc563071e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:188
export const g_keyAsciiTable__header_global_6238679d43063ec5 = new Uint8Array([(u32(0) & 255), (u32(0) & 255), 49, 50, 51, 52, 53, 54, 55, 56, 57, 48, 45, 61, (u32(0) & 255), (u32(0) & 255), 113, 119, 101, 114, 116, 121, 117, 105, 111, 112, 91, 93, (u32(0) & 255), (u32(0) & 255), 97, 115, 100, 102, 103, 104, 106, 107, 108, 59, (u32(39) & 255), 96, (u32(0) & 255), (u32(92) & 255), 122, 120, 99, 118, 98, 110, 109, 44, 46, 47, (u32(0) & 255), 42, (u32(0) & 255), (u32(32) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), 55, 56, 57, 45, 52, 53, 54, 43, 49, 50, 51, 48, 46, (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255)]);
function __cxx_static_address_8f9346fbd21af50752a905b3() {
  return __cxx_static_address_8f9346fbd21af50752a905b3.reference || (__cxx_static_address_8f9346fbd21af50752a905b3.reference = {
    __cReference: true,
    get value() { return g_keyAsciiTable__header_global_6238679d43063ec5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_8f9346fbd21af50752a905b3() { return __cxx_static_address_8f9346fbd21af50752a905b3(); }

// C/C++ source: source/build/include/baselayer.h:196
export const g_keyAsciiTableShift__header_global_b3f21f5743f45105 = new Uint8Array([(u32(0) & 255), (u32(0) & 255), 33, 64, 35, 36, 37, 94, 38, 42, 40, 41, 95, 43, (u32(0) & 255), (u32(0) & 255), 81, 87, 69, 82, 84, 89, 85, 73, 79, 80, 123, 125, (u32(0) & 255), (u32(0) & 255), 65, 83, 68, 70, 71, 72, 74, 75, 76, 58, 34, 126, (u32(0) & 255), 124, 90, 88, 67, 86, 66, 78, 77, 60, 62, 63, (u32(0) & 255), 42, (u32(0) & 255), (u32(32) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), 55, 56, 57, 45, 52, 53, 54, 43, 49, 50, 51, 48, 46, (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255)]);
function __cxx_static_address_88f43c87571511f60abfb307() {
  return __cxx_static_address_88f43c87571511f60abfb307.reference || (__cxx_static_address_88f43c87571511f60abfb307.reference = {
    __cReference: true,
    get value() { return g_keyAsciiTableShift__header_global_b3f21f5743f45105; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_88f43c87571511f60abfb307() { return __cxx_static_address_88f43c87571511f60abfb307(); }

// C/C++ source: source/build/include/build.h:895
export const pow2long__header_global_6b68e7a3bfbf783a = new Int32Array([1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144, 524288, 1048576, 2097152, 4194304, 8388608, 16777216, 33554432, 67108864, 134217728, 268435456, 536870912, 1073741824, 2147483647]);
function __cxx_static_address_99eb90a52fc45422a2b496ed() {
  return __cxx_static_address_99eb90a52fc45422a2b496ed.reference || (__cxx_static_address_99eb90a52fc45422a2b496ed.reference = {
    __cReference: true,
    get value() { return pow2long__header_global_6b68e7a3bfbf783a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_99eb90a52fc45422a2b496ed() { return __cxx_static_address_99eb90a52fc45422a2b496ed(); }

// C/C++ source: source/build/include/build.h:907
export const pow2ulong__header_global_5aeb92fca8a61a5d = new Uint32Array([u32(1), u32(2), u32(4), u32(8), u32(16), u32(32), u32(64), u32(128), u32(256), u32(512), u32(1024), u32(2048), u32(4096), u32(8192), u32(16384), u32(32768), u32(65536), u32(131072), u32(262144), u32(524288), u32(1048576), u32(2097152), u32(4194304), u32(8388608), u32(16777216), u32(33554432), u32(67108864), u32(134217728), u32(268435456), u32(536870912), u32(1073741824), u32(2147483648n)]);
function __cxx_static_address_5d7e02e7591a9cf589b3705c() {
  return __cxx_static_address_5d7e02e7591a9cf589b3705c.reference || (__cxx_static_address_5d7e02e7591a9cf589b3705c.reference = {
    __cReference: true,
    get value() { return pow2ulong__header_global_5aeb92fca8a61a5d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_5d7e02e7591a9cf589b3705c() { return __cxx_static_address_5d7e02e7591a9cf589b3705c(); }

// C/C++ source: source/build/include/build.h:919
export const pow264__header_global_467cbc5ab57ae33c = new BigInt64Array([BigInt(i64(1)), BigInt(i64(2)), BigInt(i64(4)), BigInt(i64(8)), BigInt(i64(16)), BigInt(i64(32)), BigInt(i64(64)), BigInt(i64(128)), BigInt(i64(256)), BigInt(i64(512)), BigInt(i64(1024)), BigInt(i64(2048)), BigInt(i64(4096)), BigInt(i64(8192)), BigInt(i64(16384)), BigInt(i64(32768)), BigInt(i64(65536)), BigInt(i64(131072)), BigInt(i64(262144)), BigInt(i64(524288)), BigInt(i64(1048576)), BigInt(i64(2097152)), BigInt(i64(4194304)), BigInt(i64(8388608)), BigInt(i64(16777216)), BigInt(i64(33554432)), BigInt(i64(67108864)), BigInt(i64(134217728)), BigInt(i64(268435456)), BigInt(i64(536870912)), BigInt(i64(1073741824)), BigInt(2147483648n), BigInt(4294967296n), BigInt(8589934592n), BigInt(17179869184n), BigInt(34359738368n), BigInt(68719476736n), BigInt(137438953472n), BigInt(274877906944n), BigInt(549755813888n), BigInt(1099511627776n), BigInt(2199023255552n), BigInt(4398046511104n), BigInt(8796093022208n), BigInt(17592186044416n), BigInt(35184372088832n), BigInt(70368744177664n), BigInt(140737488355328n), BigInt(281474976710656n), BigInt(562949953421312n), BigInt(1125899906842624n), BigInt(2251799813685248n), BigInt(4503599627370496n), BigInt(9007199254740992n), BigInt(18014398509481984n), BigInt(36028797018963968n), BigInt(72057594037927936n), BigInt(144115188075855872n), BigInt(288230376151711744n), BigInt(576460752303423488n), BigInt(1152921504606846976n), BigInt(2305843009213693952n), BigInt(4611686018427387904n), BigInt(9223372036854775807n)]);
function __cxx_static_address_89d47cb9c028f5bc266c339c() {
  return __cxx_static_address_89d47cb9c028f5bc266c339c.reference || (__cxx_static_address_89d47cb9c028f5bc266c339c.reference = {
    __cReference: true,
    get value() { return pow264__header_global_467cbc5ab57ae33c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_89d47cb9c028f5bc266c339c() { return __cxx_static_address_89d47cb9c028f5bc266c339c(); }

// C/C++ source: source/mact/include/keyboard.h:47
export const sctokeylut__header_global_636a95251a9c17b7 = cByteRecordNDArray({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, [102], {}, cStaticInitializerValues([cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([69, 115, 99, 97, 112, 101, 0]), "sc": (u32(1) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([49, 0]), "sc": (u32(2) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([50, 0]), "sc": (u32(3) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([51, 0]), "sc": (u32(4) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([52, 0]), "sc": (u32(5) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([53, 0]), "sc": (u32(6) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([54, 0]), "sc": (u32(7) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([55, 0]), "sc": (u32(8) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([56, 0]), "sc": (u32(9) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([57, 0]), "sc": (u32(10) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([48, 0]), "sc": (u32(11) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([45, 0]), "sc": (u32(12) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([61, 0]), "sc": (u32(13) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([66, 97, 107, 83, 112, 99, 0]), "sc": (u32(14) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([84, 97, 98, 0]), "sc": (u32(15) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([81, 0]), "sc": (u32(16) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([87, 0]), "sc": (u32(17) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([69, 0]), "sc": (u32(18) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([82, 0]), "sc": (u32(19) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([84, 0]), "sc": (u32(20) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([89, 0]), "sc": (u32(21) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([85, 0]), "sc": (u32(22) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([73, 0]), "sc": (u32(23) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([79, 0]), "sc": (u32(24) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([80, 0]), "sc": (u32(25) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([91, 0]), "sc": (u32(26) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([93, 0]), "sc": (u32(27) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([69, 110, 116, 101, 114, 0]), "sc": (u32(28) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([76, 67, 116, 114, 108, 0]), "sc": (u32(29) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([65, 0]), "sc": (u32(30) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([83, 0]), "sc": (u32(31) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([68, 0]), "sc": (u32(32) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 0]), "sc": (u32(33) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([71, 0]), "sc": (u32(34) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([72, 0]), "sc": (u32(35) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([74, 0]), "sc": (u32(36) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 0]), "sc": (u32(37) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([76, 0]), "sc": (u32(38) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([59, 0]), "sc": (u32(39) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([39, 0]), "sc": (u32(40) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([96, 0]), "sc": (u32(41) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([76, 83, 104, 105, 102, 116, 0]), "sc": (u32(42) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([66, 97, 99, 107, 115, 108, 97, 115, 104, 0]), "sc": (u32(43) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([90, 0]), "sc": (u32(44) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([88, 0]), "sc": (u32(45) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([67, 0]), "sc": (u32(46) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([86, 0]), "sc": (u32(47) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([66, 0]), "sc": (u32(48) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([78, 0]), "sc": (u32(49) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([77, 0]), "sc": (u32(50) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([44, 0]), "sc": (u32(51) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([46, 0]), "sc": (u32(52) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([47, 0]), "sc": (u32(53) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([82, 83, 104, 105, 102, 116, 0]), "sc": (u32(54) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 42, 0]), "sc": (u32(55) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([76, 65, 108, 116, 0]), "sc": (u32(56) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([83, 112, 97, 99, 101, 0]), "sc": (u32(57) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([67, 97, 112, 76, 99, 107, 0]), "sc": (u32(58) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 49, 0]), "sc": (u32(59) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 50, 0]), "sc": (u32(60) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 51, 0]), "sc": (u32(61) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 52, 0]), "sc": (u32(62) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 53, 0]), "sc": (u32(63) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 54, 0]), "sc": (u32(64) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 55, 0]), "sc": (u32(65) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 56, 0]), "sc": (u32(66) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 57, 0]), "sc": (u32(67) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 49, 48, 0]), "sc": (u32(68) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([78, 117, 109, 76, 99, 107, 0]), "sc": (u32(69) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([83, 99, 114, 76, 99, 107, 0]), "sc": (u32(70) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 55, 0]), "sc": (u32(71) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 56, 0]), "sc": (u32(72) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 57, 0]), "sc": (u32(73) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 45, 0]), "sc": (u32(74) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 52, 0]), "sc": (u32(75) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 53, 0]), "sc": (u32(76) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 54, 0]), "sc": (u32(77) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 43, 0]), "sc": (u32(78) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 49, 0]), "sc": (u32(79) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 50, 0]), "sc": (u32(80) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 51, 0]), "sc": (u32(81) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 48, 0]), "sc": (u32(82) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 46, 0]), "sc": (u32(83) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([76, 101, 115, 115, 84, 104, 97, 110, 0]), "sc": (u32(86) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 49, 49, 0]), "sc": (u32(87) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 49, 50, 0]), "sc": (u32(88) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 100, 69, 110, 116, 0]), "sc": (u32(156) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([82, 67, 116, 114, 108, 0]), "sc": (u32(157) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 47, 0]), "sc": (u32(181) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([82, 65, 108, 116, 0]), "sc": (u32(184) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([80, 114, 116, 83, 99, 110, 0]), "sc": (u32(183) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([80, 97, 117, 115, 101, 0]), "sc": (u32(197) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([72, 111, 109, 101, 0]), "sc": (u32(199) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([85, 112, 0]), "sc": (u32(200) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([80, 103, 85, 112, 0]), "sc": (u32(201) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([76, 101, 102, 116, 0]), "sc": (u32(203) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([82, 105, 103, 104, 116, 0]), "sc": (u32(205) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([69, 110, 100, 0]), "sc": (u32(207) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([68, 111, 119, 110, 0]), "sc": (u32(208) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([80, 103, 68, 110, 0]), "sc": (u32(209) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([73, 110, 115, 101, 114, 116, 0]), "sc": (u32(210) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([68, 101, 108, 101, 116, 101, 0]), "sc": (u32(211) & 255)}), null, {})]));
function __cxx_static_address_94bb0b1659cda83fd67e92fa() {
  return __cxx_static_address_94bb0b1659cda83fd67e92fa.reference || (__cxx_static_address_94bb0b1659cda83fd67e92fa.reference = {
    __cReference: true,
    get value() { return sctokeylut__header_global_636a95251a9c17b7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/gamestructures.h:86
export let vmStructHashTablePtrs__header_global_f403705445a50b92 = cPointerArray(10, () => [cStaticReference(() => __cxx_global_cell_36ecf5b982ca5148a2b52931().value), cStaticReference(() => __cxx_global_cell_4dfc2df4beaabb17f13a2a11().value), cStaticReference(() => __cxx_global_cell_1b64352a65c97cbeac4d8dc1().value), cStaticReference(() => __cxx_global_cell_1edb9adc2ad33f7dab0cc065().value), cStaticReference(() => __cxx_global_cell_5369c12f5151e4651feb6d69().value), cStaticReference(() => __cxx_global_cell_1f238d951ac2733554cfa6c9().value), cStaticReference(() => __cxx_global_cell_12f6357b924ceaa4592192e7().value), cStaticReference(() => __cxx_global_cell_55925c071ef91c407236ca84().value), cStaticReference(() => __cxx_global_cell_6fc9ea499f8ee974932947d6().value), cStaticReference(() => __cxx_global_cell_7b44353bd3d207ee6f04360e().value)]);
function __cxx_static_address_6bf85265e10b5d47223174df() {
  return __cxx_static_address_6bf85265e10b5d47223174df.reference || (__cxx_static_address_6bf85265e10b5d47223174df.reference = {
    __cReference: true,
    get value() { return vmStructHashTablePtrs__header_global_f403705445a50b92; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/compat.h:1450
export function xaligned_free__header_621d51a0063b(ptr) {
  Free__cxx_static_0dfd3f42f0dc2c05(__cxx_global_cell_11016d3c7177543e564ab46c().value, ptr);
}

// C/C++ source: source/build/include/compat.h:1449
export function xfree__header_ab6d6e4a5e19(ptr) {
  Free__cxx_static_0dfd3f42f0dc2c05(__cxx_global_cell_11016d3c7177543e564ab46c().value, ptr);
}

// C/C++ source: source/build/include/compat.h:1392
export function xmalloc__header_4db79e744b81(size) {
  let ptr = Alloc__cxx_static_e0036cfb06bcfe42(__cxx_global_cell_11016d3c7177543e564ab46c().value, size, u64(16));
  if (cPointerCompare(ptr, null, "!=")) {
    return ptr;
  }
  handle_memerr(i32(size));
  __builtin_unreachable();
}

// C/C++ source: source/build/include/compat.h:1400
export function xcalloc__header_6bfc9d470f33(nmemb, size) {
  let siz = u64((BigInt(nmemb) * BigInt(size)));
  let ptr = Alloc__cxx_static_e0036cfb06bcfe42(__cxx_global_cell_11016d3c7177543e564ab46c().value, siz, u64(16));
  if (cPointerCompare(ptr, null, "!=")) {
    memset(ptr, 0, siz);
    return ptr;
  }
  handle_memerr(i32(size));
  __builtin_unreachable();
}

export function SILENCE_UNUSED__header_0536d3dd65fa(arg0, arg1) {

}

// C/C++ source: source/build/include/compat.h:1428
export function xaligned_alloc__header_118bc1ffc4be(alignment, size) {
  let ptr = Alloc__cxx_static_e0036cfb06bcfe42(__cxx_global_cell_11016d3c7177543e564ab46c().value, size, alignment);
  if (cPointerCompare(ptr, null, "!=")) {
    return ptr;
  }
  handle_memerr(i32(size));
  __builtin_unreachable();
}

// C/C++ source: source/build/include/pragmas.h:141
export function tabledivide32_branchfree__header_0d7ec62441b4(n, d) {

  if (Boolean(i32((i32((d != __cxx_global_cell_b6db0759e33cdbb028a91dc6().value)) & i32((!(u32(d) < u32(16384)))))))) {
    cAssignAggregate((cPointerElementRef(cRecordPointer(bfdivtable32, {"align": 1, "arrayAlign": 1, "fields": {"magic": {"native": "Int32Array", "offset": 0, "size": 4}, "more": {"native": "Uint8Array", "offset": 4, "size": 1}}, "overlaps": false, "size": 5, "union": false}, {}), 0).value), libdivide_s32_branchfree_gen((__cxx_global_cell_b6db0759e33cdbb028a91dc6().value = i32(d))), {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"magic": {"native": "Int32Array", "offset": 0, "size": 4}, "more": {"native": "Uint8Array", "offset": 4, "size": 1}}, "overlaps": false, "size": 5, "union": false}}, {"abi": "source-clang-trivial-record-assignment/1", "assignment_mode": "moveAssign", "clang_assignment_signature": "libdivide_s32_branchfree_t &(libdivide_s32_branchfree_t &&) noexcept", "clang_method_id": "0x1cae041b330", "native_layout": {"abi": "source-record-field-storage/1", "sha256": "9ce070c4dbcc716e36f4dc7d230c2fe3683993c7fa9c37d6a637a708f7c906c0"}, "record_name": "libdivide::libdivide_s32_branchfree_t", "source_record": "libdivide::libdivide_s32_branchfree_t"});
  }
  return i32(libdivide_s32_branchfree_do(n, cPointerOffset(bfdivtable32, i32(Math.imul(i32((u32(d) < u32(16384))), d)), 5)));
}

export function SILENCE_UNUSED__header_7e1842510d90(arg0, arg1) {

}

export function SILENCE_UNUSED__header_1c536497ccff(arg0, arg1) {

}

export function SILENCE_UNUSED__header_43c1a0bf47f1(arg0, arg1) {

}

export function bitmap_test__header_7d80329fe4d3(ptr, n) {

  return Boolean((i32((i32((cDeref(cPointerOffset(ptr, i32((n >> 3)), Int8Array.BYTES_PER_ELEMENT), Int8Array).value)) & i32((cDeref(cPointerOffset(pow2char__header_global_28f8b4adea4b716f, i32((n & 7)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))) == i32((cDeref(cPointerOffset(pow2char__header_global_28f8b4adea4b716f, i32((n & 7)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value))));
}

export function SILENCE_UNUSED__header_ca4cb5f3f88d(arg0, arg1) {

}

export function SILENCE_UNUSED__header_315cba336a55(arg0, arg1) {

}

export function SILENCE_UNUSED__header_ee58b449b30d(arg0, arg1) {

}

export function bitmap_test__header_fc6fdf2f7239(ptr, n) {

  return Boolean((i32((i32((cDeref(cPointerOffset(ptr, i32((n >> 3)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & i32((cDeref(cPointerOffset(pow2char__header_global_28f8b4adea4b716f, i32((n & 7)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))) == i32((cDeref(cPointerOffset(pow2char__header_global_28f8b4adea4b716f, i32((n & 7)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value))));
}

export function SILENCE_UNUSED__header_f97bb749c4f9(arg0, arg1) {

}

// C/C++ source: source/duke3d/src/gamevars.h:125
export function Gv_GetArrayAllocSize__header_9c58d53862c8(arrayIdx) {
  return u64(Gv_GetArrayAllocSizeForCount(arrayIdx, u64((cPointerElementRef(cRecordPointer(aGameArrays, {"align": 1, "arrayAlign": 1, "fields": {"flags": {"native": "BigUint64Array", "offset": 24, "size": 8}, "pValues": {"offset": 8, "pointer": true, "size": 8}, "size": {"native": "BigInt64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {}), arrayIdx).value).size)));
}

export function SILENCE_UNUSED__header_10054d6a9343(arg0, arg1, arg2, arg3) {

}

export function SILENCE_UNUSED__header_ab81914d29c9(arg0, arg1, arg2, arg3) {

}

export function SILENCE_UNUSED__header_652f7fe1d665(arg0, arg1, arg2, arg3) {

}

export function bitmap_set__header_49116a47a17e(ptr, n) {

  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = (u32((__cxx_lvalue_0.value | i32((cDeref(cPointerOffset(pow2char__header_global_28f8b4adea4b716f, i32((n & 7)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))) & 255)))(cDeref(cPointerOffset(ptr, i32((n >> 3)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array));
}

// C/C++ source: source/build/include/print.h:189
const __cxx_literal_427ec19233e5106e96cd = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 105, 110, 99, 108, 117, 100, 101, 47, 112, 114, 105, 110, 116, 46, 104, 0]);
const __cxx_literal_bd454d065e235893bd45 = Uint8Array.from([37, 115, 0]);
export function buildprint__template_d684cd61d5016db8(args) {
  let buf = cTypedPointer(cStackAlloc(u64(i32((1024 + 1)))), Uint8Array);
  ((cDeref(cPointerOffset(buf, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(0) & 255)) & 255));
  let len = u64(buildprint_internal____header_64680af765ba(buf, args));
  (__cxx_global_cell_079877be927e9ceeb785b6a6().value = Boolean(false));
  ((i32(0) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(0), __cxx_literal_427ec19233e5106e96cd, u32(196), __cxx_literal_bd454d065e235893bd45, buf));
  (__cxx_global_cell_079877be927e9ceeb785b6a6().value = Boolean(true));
  initputs(buf);
  return u64(len);
}

// C/C++ source: source/build/include/print.h:189
const __cxx_literal_85f9d6bd58ca2311d708 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 105, 110, 99, 108, 117, 100, 101, 47, 112, 114, 105, 110, 116, 46, 104, 0]);
const __cxx_literal_9eee54306918ad12323a = Uint8Array.from([37, 115, 0]);
export function buildprint__template_7e9230c56c320659(args, __cxx_parameter_1_args, __cxx_parameter_2_args) {
  let buf = cTypedPointer(cStackAlloc(u64(i32((1024 + 1)))), Uint8Array);
  ((cDeref(cPointerOffset(buf, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(0) & 255)) & 255));
  let len = u64(buildprint_internal____template_50022899cc4b822b(buf, args, __cxx_parameter_1_args, __cxx_parameter_2_args));
  (__cxx_global_cell_079877be927e9ceeb785b6a6().value = Boolean(false));
  ((i32(0) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(0), __cxx_literal_85f9d6bd58ca2311d708, u32(196), __cxx_literal_9eee54306918ad12323a, buf));
  (__cxx_global_cell_079877be927e9ceeb785b6a6().value = Boolean(true));
  initputs(buf);
  return u64(len);
}

// C/C++ source: source/build/include/print.h:189
const __cxx_literal_501ca46fa3b603e07beb = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 105, 110, 99, 108, 117, 100, 101, 47, 112, 114, 105, 110, 116, 46, 104, 0]);
const __cxx_literal_d5aa3d6f46ff497846b4 = Uint8Array.from([37, 115, 0]);
export function buildprint__template_3e16cb6dcd32c503(args) {
  let buf = cTypedPointer(cStackAlloc(u64(i32((1024 + 1)))), Uint8Array);
  ((cDeref(cPointerOffset(buf, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(0) & 255)) & 255));
  let len = u64(buildprint_internal____header_2f15807bc739(buf, args));
  (__cxx_global_cell_079877be927e9ceeb785b6a6().value = Boolean(false));
  ((i32(0) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(0), __cxx_literal_501ca46fa3b603e07beb, u32(196), __cxx_literal_d5aa3d6f46ff497846b4, buf));
  (__cxx_global_cell_079877be927e9ceeb785b6a6().value = Boolean(true));
  initputs(buf);
  return u64(len);
}

// C/C++ source: source/build/include/print.h:189
const __cxx_literal_615416ebf1b244a27d51 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 105, 110, 99, 108, 117, 100, 101, 47, 112, 114, 105, 110, 116, 46, 104, 0]);
const __cxx_literal_f5c77dfbc1e4af444d41 = Uint8Array.from([37, 115, 0]);
export function buildprint__template_04215400977ec9df(args) {
  let buf = cTypedPointer(cStackAlloc(u64(i32((1024 + 1)))), Uint8Array);
  ((cDeref(cPointerOffset(buf, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(0) & 255)) & 255));
  let len = u64(buildprint_internal____header_d3c79e08e127(buf, args));
  (__cxx_global_cell_079877be927e9ceeb785b6a6().value = Boolean(false));
  ((i32(0) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(0), __cxx_literal_615416ebf1b244a27d51, u32(196), __cxx_literal_f5c77dfbc1e4af444d41, buf));
  (__cxx_global_cell_079877be927e9ceeb785b6a6().value = Boolean(true));
  initputs(buf);
  return u64(len);
}

// C/C++ source: source/build/include/print.h:189
const __cxx_literal_3c318440ff252b6e9aa8 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 105, 110, 99, 108, 117, 100, 101, 47, 112, 114, 105, 110, 116, 46, 104, 0]);
const __cxx_literal_8de88f42fd3141850116 = Uint8Array.from([37, 115, 0]);
export function buildprint__template_4663c7d7435d5abb(args) {
  let buf = cTypedPointer(cStackAlloc(u64(i32((1024 + 1)))), Uint8Array);
  ((cDeref(cPointerOffset(buf, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(0) & 255)) & 255));
  let len = u64(buildprint_internal____header_86459e5b755a(buf, args));
  (__cxx_global_cell_079877be927e9ceeb785b6a6().value = Boolean(false));
  ((i32(0) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(0), __cxx_literal_3c318440ff252b6e9aa8, u32(196), __cxx_literal_8de88f42fd3141850116, buf));
  (__cxx_global_cell_079877be927e9ceeb785b6a6().value = Boolean(true));
  initputs(buf);
  return u64(len);
}

// C/C++ source: source/build/include/print.h:189
const __cxx_literal_e573e1ac617638fd85af = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 105, 110, 99, 108, 117, 100, 101, 47, 112, 114, 105, 110, 116, 46, 104, 0]);
const __cxx_literal_ee1ef51fcc00713d2f0c = Uint8Array.from([37, 115, 0]);
export function buildprint__template_d6f52b498a2a6584(args, __cxx_parameter_1_args) {
  let buf = cTypedPointer(cStackAlloc(u64(i32((1024 + 1)))), Uint8Array);
  ((cDeref(cPointerOffset(buf, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(0) & 255)) & 255));
  let len = u64(buildprint_internal____template_05bda03ec62a3a9d(buf, args, __cxx_parameter_1_args));
  (__cxx_global_cell_079877be927e9ceeb785b6a6().value = Boolean(false));
  ((i32(0) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(0), __cxx_literal_e573e1ac617638fd85af, u32(196), __cxx_literal_ee1ef51fcc00713d2f0c, buf));
  (__cxx_global_cell_079877be927e9ceeb785b6a6().value = Boolean(true));
  initputs(buf);
  return u64(len);
}

// C/C++ source: @sysroot/usr/include/c++/12/bits/stl_algobase.h:230
export function min__template_c237f4424e2bda8a(__a, __b) {
  if ((__b.value < __a.value)) {
    return __b;
  }
  return __a;
}

// C/C++ source: source/build/include/pragmas.h:111
export function tabledivide64__header_3e246b8ee560(n, d) {

  if (Boolean(i32((i32((d != __cxx_global_cell_f8287b2e627d0e3f51b90c55().value)) & i32((!(u64(d) < u64(16384)))))))) {
    cAssignAggregate((cPointerElementRef(cRecordPointer(divtable64, {"align": 1, "arrayAlign": 1, "fields": {"magic": {"native": "BigInt64Array", "offset": 0, "size": 8}, "more": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 9, "union": false}, {}), 0).value), libdivide_s64_gen((__cxx_global_cell_f8287b2e627d0e3f51b90c55().value = i64(d))), {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"magic": {"native": "BigInt64Array", "offset": 0, "size": 8}, "more": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 9, "union": false}}, {"abi": "source-clang-trivial-record-assignment/1", "assignment_mode": "moveAssign", "clang_assignment_signature": "libdivide_s64_t &(libdivide_s64_t &&) noexcept", "clang_method_id": "0x1cae0417d20", "native_layout": {"abi": "source-record-field-storage/1", "sha256": "530e844acf5f4aae77d6501332d2314b0565b5453efe01e50ae4b2242323f757"}, "record_name": "libdivide::libdivide_s64_t", "source_record": "libdivide::libdivide_s64_t"});
  }
  return i64(libdivide_s64_do(n, cPointerOffset(divtable64, i64((BigInt(i64((u64(d) < u64(16384)))) * BigInt(d))), 9)));
}

// C/C++ source: source/duke3d/src/gamevars.h:185
export function VM_GetStruct__header_65084e54e834(flags, addr) {
  switch (u64((BigInt(u64(flags)) & BigInt(u64((BigInt(u64((BigInt(u64((BigInt(1) | BigInt(2)))) | BigInt(4)))) | BigInt(u64(8)))))))) {
    case 1: {
      return i32((cDeref(cTypedPointer(addr, Int8Array), Int8Array).value));
    }
    case u64((BigInt(1) | BigInt(u64(8)))): {
      return i32((cDeref(cTypedPointer(addr, Uint8Array), Uint8Array).value));
    }
    case 2: {
      return i32((cDeref(cTypedPointer(addr, Int16Array), Int16Array).value));
    }
    case u64((BigInt(2) | BigInt(u64(8)))): {
      return i32((cDeref(cTypedPointer(addr, Uint16Array), Uint16Array).value));
    }
    case 4: {
      return i32((cDeref(cTypedPointer(addr, Int32Array), Int32Array).value));
    }
    case u64((BigInt(4) | BigInt(u64(8)))): {
      return i32((cDeref(cTypedPointer(addr, Uint32Array), Uint32Array).value));
    }
    default: {
      __builtin_unreachable();
    }
  }
}

// C/C++ source: source/duke3d/src/gamevars.h:128
export function Gv_GetArrayValue__header_3474e96e7f11(id, index) {
  if (Boolean(u64((BigInt((cPointerElementRef(cRecordPointer(aGameArrays, {"align": 1, "arrayAlign": 1, "fields": {"flags": {"native": "BigUint64Array", "offset": 24, "size": 8}, "pValues": {"offset": 8, "pointer": true, "size": 8}, "size": {"native": "BigInt64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {}), id).value).flags) & BigInt(u64(256)))))) {
    (index = i32((index << 1)));
  }
  switch (u64((BigInt((cPointerElementRef(cRecordPointer(aGameArrays, {"align": 1, "arrayAlign": 1, "fields": {"flags": {"native": "BigUint64Array", "offset": 24, "size": 8}, "pValues": {"offset": 8, "pointer": true, "size": 8}, "size": {"native": "BigInt64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {}), id).value).flags) & BigInt(u64(1163264))))) {
    default: {
      return i32((cDeref(cPointerOffset((cPointerElementRef(cRecordPointer(aGameArrays, {"align": 1, "arrayAlign": 1, "fields": {"flags": {"native": "BigUint64Array", "offset": 24, "size": 8}, "pValues": {"offset": 8, "pointer": true, "size": 8}, "size": {"native": "BigInt64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {}), id).value).pValues, index, BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array).value));
    }
    case u64(16384): {
      return i32((cDeref(cPointerOffset(cTypedPointer((cPointerElementRef(cRecordPointer(aGameArrays, {"align": 1, "arrayAlign": 1, "fields": {"flags": {"native": "BigUint64Array", "offset": 24, "size": 8}, "pValues": {"offset": 8, "pointer": true, "size": 8}, "size": {"native": "BigInt64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {}), id).value).pValues, Int16Array), index, Int16Array.BYTES_PER_ELEMENT), Int16Array).value));
    }
    case u64(32768): {
      return i32((cDeref(cPointerOffset(cTypedPointer((cPointerElementRef(cRecordPointer(aGameArrays, {"align": 1, "arrayAlign": 1, "fields": {"flags": {"native": "BigUint64Array", "offset": 24, "size": 8}, "pValues": {"offset": 8, "pointer": true, "size": 8}, "size": {"native": "BigInt64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {}), id).value).pValues, Int8Array), index, Int8Array.BYTES_PER_ELEMENT), Int8Array).value));
    }
    case u64(81920): {
      return i32((cDeref(cPointerOffset(cTypedPointer((cPointerElementRef(cRecordPointer(aGameArrays, {"align": 1, "arrayAlign": 1, "fields": {"flags": {"native": "BigUint64Array", "offset": 24, "size": 8}, "pValues": {"offset": 8, "pointer": true, "size": 8}, "size": {"native": "BigInt64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {}), id).value).pValues, Uint16Array), index, Uint16Array.BYTES_PER_ELEMENT), Uint16Array).value));
    }
    case u64(98304): {
      return i32((cDeref(cPointerOffset(cTypedPointer((cPointerElementRef(cRecordPointer(aGameArrays, {"align": 1, "arrayAlign": 1, "fields": {"flags": {"native": "BigUint64Array", "offset": 24, "size": 8}, "pValues": {"offset": 8, "pointer": true, "size": 8}, "size": {"native": "BigInt64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {}), id).value).pValues, Uint8Array), index, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value));
    }
    case u64(1048576): {
      return i32((!(!bitmap_test__header_fc6fdf2f7239(cTypedPointer((cPointerElementRef(cRecordPointer(aGameArrays, {"align": 1, "arrayAlign": 1, "fields": {"flags": {"native": "BigUint64Array", "offset": 24, "size": 8}, "pValues": {"offset": 8, "pointer": true, "size": 8}, "size": {"native": "BigInt64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {}), id).value).pValues, Uint8Array), index))));
    }
  }
}

// C/C++ source: source/duke3d/src/gamedef.h:92
export function C_GetFileForOffset__header_0eca151a03a9(offset) {
  let ofs = __cxx_global_cell_781692351a9d53402cd867ca().value;
  while ((cRecordObject(cRecordPointer(ofs, {"align": 8, "arrayAlign": 1, "fields": {"fn": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 8, "pointer": true, "size": 8}, "offset": {"native": "Int32Array", "offset": 16, "size": 4}}, "overlaps": false, "size": 24, "union": false}, {})).offset > offset)) {
    (ofs = cRecordObject(cRecordPointer(ofs, {"align": 8, "arrayAlign": 1, "fields": {"fn": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 8, "pointer": true, "size": 8}, "offset": {"native": "Int32Array", "offset": 16, "size": 4}}, "overlaps": false, "size": 24, "union": false}, {})).next);
  }
  return cRecordObject(cRecordPointer(ofs, {"align": 8, "arrayAlign": 1, "fields": {"fn": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 8, "pointer": true, "size": 8}, "offset": {"native": "Int32Array", "offset": 16, "size": 4}}, "overlaps": false, "size": 24, "union": false}, {})).fn;
}

// C/C++ source: source/build/include/fix16.h:42
export function fix16_to_int__header_4c12be0cb302(a) {
  return i32(Math.trunc(i32((a + ((a >= 0) ? fix16_half__header_global_165cc7a41fb44aa1 : (-fix16_half__header_global_165cc7a41fb44aa1)))) / fix16_one__header_global_ed8aba31ba5aa8d6));
}

export function NEGATE_ON_CONDITION__header_dae48054905e(value, condition) {
  let invert = i32((!(!Boolean(condition))));
  return i32((i32((value ^ (-invert))) + invert));
}

// C/C++ source: source/build/include/fix16.h:46
export function fix16_from_int__header_4ad6254e429b(a) {
  return i32(Math.imul(a, fix16_one__header_global_ed8aba31ba5aa8d6));
}

export function ARRAY_SIZE__header_4d85ea4859e0(arg0) {
  return u64(7n);
}

export function buildprint_internal____header_64680af765ba(buf, first) {
  return u64(buildprintpiece__cxx_d7482732af7d(buf, first));
}

export function buildprint_internal____template_50022899cc4b822b(buf, first, args, __cxx_parameter_3_args) {
  let len = u64(buildprintpiece__cxx_d7482732af7d(buf, first));
  return u64((BigInt(len) + BigInt(buildprint_internal____template_18f48e968409e523(buf, args, __cxx_parameter_3_args))));
}

export function buildprint_internal____header_2f15807bc739(buf, first) {
  return u64(buildprintpiece__template_f17781d52482de20(buf, first));
}

export function buildprint_internal____header_d3c79e08e127(buf, first) {
  return u64(buildprintpiece__template_ec5834da4fcb6227(buf, first));
}

export function buildprint_internal____header_86459e5b755a(buf, first) {
  return u64(buildprintpiece__template_4ebbcbaff42c948c(buf, first));
}

export function buildprint_internal____template_05bda03ec62a3a9d(buf, first, args) {
  let len = u64(buildprintpiece__cxx_d7482732af7d(buf, first));
  return u64((BigInt(len) + BigInt(buildprint_internal____header_2350640eb8bb(buf, args))));
}

// C/C++ source: source/build/include/print.h:169
export function buildprintpiece__cxx_d7482732af7d(buf, str) {
  strcat(buf, str);
  return u64(strlen(str));
}

// C/C++ source: source/build/include/print.h:182
export function buildprint_internal____template_18f48e968409e523(buf, first, args) {
  let len = u64(buildprintpiece__cxx_d7482732af7d(buf, first));
  return u64((BigInt(len) + BigInt(buildprint_internal____header_64680af765ba(buf, args))));
}

// C/C++ source: source/build/include/print.h:60
export function buildprintpiece__template_f17781d52482de20(buf, x) {
  let numdigits = u64((BigInt(u64((BigInt(u64((BigInt(4) * BigInt(u64(8))))) + BigInt(u64(1))))) / BigInt(u64(3))));
  let str = cZeroAggregate({"array": "Uint8Array", "dims": [13]});
  let strptr = str;
  let totalChars;
  if ((x < 0)) {
    let numChars = u64(logbasenegative__template_7dfeaa46fcd63cf2(x));
    (totalChars = u64((BigInt(numChars) + BigInt(u64(1)))));
    ((cDeref(((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_0.value = next; return previous; })(cRef(() => strptr, __cxx_lvalue_1 => { strptr = __cxx_lvalue_1; })), Uint8Array).value) = (u32(45) & 255));
    ((cDeref(cPointerOffset(strptr, numChars, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32(0) & 255));
    do {
      let qr = cCopyAggregate(divrhs__template_e6a545e349d7765b(x), {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"q": {"native": "Int32Array", "offset": 0, "size": 4}, "r": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}});
      (x = i32(qr.q));
      ((cDeref(cPointerOffset(strptr, u64((BigInt(numChars) - BigInt(u64(1)))), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(i32((i32(48) - i32((u32((u32(qr.r) & 255)) & 255))))) & 255)) & 255));
    } while (Boolean(((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = u64((previous - 1n)); __cxx_lvalue_2.value = next; return next; })(cRef(() => numChars, __cxx_lvalue_3 => { numChars = __cxx_lvalue_3; }))));
  } else {
    let numChars = u64(logbase__template_ef39ddd0b1a25155(x));
    (totalChars = u64(numChars));
    ((cDeref(cPointerOffset(strptr, numChars, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32(0) & 255));
    do {
      let qr = cCopyAggregate(divrhs__template_e6a545e349d7765b(x), {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"q": {"native": "Int32Array", "offset": 0, "size": 4}, "r": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}});
      (x = i32(qr.q));
      ((cDeref(cPointerOffset(strptr, u64((BigInt(numChars) - BigInt(u64(1)))), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(i32((i32(48) + i32((u32((u32(qr.r) & 255)) & 255))))) & 255)) & 255));
    } while (Boolean(((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = u64((previous - 1n)); __cxx_lvalue_4.value = next; return next; })(cRef(() => numChars, __cxx_lvalue_5 => { numChars = __cxx_lvalue_5; }))));
  }
  strcat(buf, str);
  return totalChars;
}

// C/C++ source: source/build/include/print.h:60
export function buildprintpiece__template_ec5834da4fcb6227(buf, x) {
  let numdigits = u64((BigInt(u64((BigInt(u64((BigInt(2) * BigInt(u64(8))))) + BigInt(u64(1))))) / BigInt(u64(3))));
  let str = cZeroAggregate({"array": "Uint8Array", "dims": [7]});
  let strptr = str;
  let totalChars;
  if ((i32(x) < 0)) {
    let numChars = u64(logbasenegative__template_e0d37c6f4a5cc693(x));
    (totalChars = u64((BigInt(numChars) + BigInt(u64(1)))));
    ((cDeref(((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_0.value = next; return previous; })(cRef(() => strptr, __cxx_lvalue_1 => { strptr = __cxx_lvalue_1; })), Uint8Array).value) = (u32(45) & 255));
    ((cDeref(cPointerOffset(strptr, numChars, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32(0) & 255));
    do {
      let qr = cCopyAggregate(divrhs__template_3a7d76e6019a9f10(x), {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"q": {"native": "Int16Array", "offset": 0, "size": 2}, "r": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}});
      (x = ((u32(qr.q) << 16) >> 16));
      ((cDeref(cPointerOffset(strptr, u64((BigInt(numChars) - BigInt(u64(1)))), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(i32((i32(48) - i32((u32((u32(qr.r) & 255)) & 255))))) & 255)) & 255));
    } while (Boolean(((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = u64((previous - 1n)); __cxx_lvalue_2.value = next; return next; })(cRef(() => numChars, __cxx_lvalue_3 => { numChars = __cxx_lvalue_3; }))));
  } else {
    let numChars = u64(logbase__template_5ef7d8d231ecab0f(x));
    (totalChars = u64(numChars));
    ((cDeref(cPointerOffset(strptr, numChars, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32(0) & 255));
    do {
      let qr = cCopyAggregate(divrhs__template_3a7d76e6019a9f10(x), {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"q": {"native": "Int16Array", "offset": 0, "size": 2}, "r": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}});
      (x = ((u32(qr.q) << 16) >> 16));
      ((cDeref(cPointerOffset(strptr, u64((BigInt(numChars) - BigInt(u64(1)))), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(i32((i32(48) + i32((u32((u32(qr.r) & 255)) & 255))))) & 255)) & 255));
    } while (Boolean(((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = u64((previous - 1n)); __cxx_lvalue_4.value = next; return next; })(cRef(() => numChars, __cxx_lvalue_5 => { numChars = __cxx_lvalue_5; }))));
  }
  strcat(buf, str);
  return totalChars;
}

// C/C++ source: source/build/include/print.h:60
export function buildprintpiece__template_4ebbcbaff42c948c(buf, x) {
  let numdigits = u64((BigInt(u64((BigInt(u64((BigInt(8) * BigInt(u64(8))))) + BigInt(u64(1))))) / BigInt(u64(3))));
  let str = cZeroAggregate({"array": "Uint8Array", "dims": [23]});
  let strptr = str;
  let totalChars;
  if ((x < i64(0))) {
    let numChars = u64(logbasenegative__template_7d3a394003ebf7fa(x));
    (totalChars = u64((BigInt(numChars) + BigInt(u64(1)))));
    ((cDeref(((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_0.value = next; return previous; })(cRef(() => strptr, __cxx_lvalue_1 => { strptr = __cxx_lvalue_1; })), Uint8Array).value) = (u32(45) & 255));
    ((cDeref(cPointerOffset(strptr, numChars, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32(0) & 255));
    do {
      let qr = cCopyAggregate(divrhs__template_69735159388489c8(x), {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"q": {"native": "BigInt64Array", "offset": 0, "size": 8}, "r": {"native": "BigInt64Array", "offset": 8, "size": 8}}, "overlaps": false, "size": 16, "union": false}});
      (x = i64(qr.q));
      ((cDeref(cPointerOffset(strptr, u64((BigInt(numChars) - BigInt(u64(1)))), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(i32((i32(48) - i32((u32((u32(qr.r) & 255)) & 255))))) & 255)) & 255));
    } while (Boolean(((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = u64((previous - 1n)); __cxx_lvalue_2.value = next; return next; })(cRef(() => numChars, __cxx_lvalue_3 => { numChars = __cxx_lvalue_3; }))));
  } else {
    let numChars = u64(logbase__template_a8c9ca1c5aec38a0(x));
    (totalChars = u64(numChars));
    ((cDeref(cPointerOffset(strptr, numChars, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32(0) & 255));
    do {
      let qr = cCopyAggregate(divrhs__template_69735159388489c8(x), {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"q": {"native": "BigInt64Array", "offset": 0, "size": 8}, "r": {"native": "BigInt64Array", "offset": 8, "size": 8}}, "overlaps": false, "size": 16, "union": false}});
      (x = i64(qr.q));
      ((cDeref(cPointerOffset(strptr, u64((BigInt(numChars) - BigInt(u64(1)))), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(i32((i32(48) + i32((u32((u32(qr.r) & 255)) & 255))))) & 255)) & 255));
    } while (Boolean(((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = u64((previous - 1n)); __cxx_lvalue_4.value = next; return next; })(cRef(() => numChars, __cxx_lvalue_5 => { numChars = __cxx_lvalue_5; }))));
  }
  strcat(buf, str);
  return totalChars;
}

export function buildprint_internal____header_2350640eb8bb(buf, first) {
  return u64(buildprintpiece__template_317122bbc3ab04ac(buf, first));
}

// C/C++ source: source/build/include/compat.h:1151
export function logbasenegative__template_7dfeaa46fcd63cf2(n) {
  return u64(((n > i32(i64((-i64(u64(10n)))))) ? u64(1) : u64((BigInt(u64(1)) + BigInt(logbase__template_ef39ddd0b1a25155(Math.trunc(n / i32(i64((-i64(u64(10n))))))))))));
}

export function divrhs__template_e6a545e349d7765b(lhs) {
  return cCopyAggregate(divide__template_ba3592ae5cd0f0c1(lhs, i32(i64(10n))), {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"q": {"native": "Int32Array", "offset": 0, "size": 4}, "r": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}});
}

// C/C++ source: source/build/include/compat.h:1145
export function logbase__template_ef39ddd0b1a25155(n) {
  return u64(((n < i32(u64(10n))) ? u64(1) : u64((BigInt(u64(1)) + BigInt(logbase__template_ef39ddd0b1a25155(Math.trunc(n / i32(u64(10n)))))))));
}

// C/C++ source: source/build/include/compat.h:1151
export function logbasenegative__template_e0d37c6f4a5cc693(n) {
  return u64(((i32(n) > i32(((u32(((u32(i64((-i64(u64(10n))))) << 16) >> 16)) << 16) >> 16))) ? u64(1) : u64((BigInt(u64(1)) + BigInt(logbase__template_ef39ddd0b1a25155(Math.trunc(i32(n) / i32(((u32(((u32(i64((-i64(u64(10n))))) << 16) >> 16)) << 16) >> 16)))))))));
}

export function divrhs__template_3a7d76e6019a9f10(lhs) {
  return cCopyAggregate(divide__template_79d93db9b67c18ea(lhs, ((u32(((u32(i64(10n)) << 16) >> 16)) << 16) >> 16)), {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"q": {"native": "Int16Array", "offset": 0, "size": 2}, "r": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}});
}

// C/C++ source: source/build/include/compat.h:1145
export function logbase__template_5ef7d8d231ecab0f(n) {
  return u64(((i32(n) < i32(((u32(((u32(u64(10n)) << 16) >> 16)) << 16) >> 16))) ? u64(1) : u64((BigInt(u64(1)) + BigInt(logbase__template_ef39ddd0b1a25155(Math.trunc(i32(n) / i32(((u32(((u32(u64(10n)) << 16) >> 16)) << 16) >> 16)))))))));
}

// C/C++ source: source/build/include/compat.h:1151
export function logbasenegative__template_7d3a394003ebf7fa(n) {
  return u64(((n > i64((-i64(u64(10n))))) ? u64(1) : u64((BigInt(u64(1)) + BigInt(logbase__template_a8c9ca1c5aec38a0(i64((BigInt(n) / BigInt(i64((-i64(u64(10n)))))))))))));
}

export function divrhs__template_69735159388489c8(lhs) {
  return cCopyAggregate(divide__template_ac9cec9160aba7ca(lhs, i64(10n)), {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"q": {"native": "BigInt64Array", "offset": 0, "size": 8}, "r": {"native": "BigInt64Array", "offset": 8, "size": 8}}, "overlaps": false, "size": 16, "union": false}});
}

// C/C++ source: source/build/include/compat.h:1145
export function logbase__template_a8c9ca1c5aec38a0(n) {
  return u64(((n < i64(u64(10n))) ? u64(1) : u64((BigInt(u64(1)) + BigInt(logbase__template_a8c9ca1c5aec38a0(i64((BigInt(n) / BigInt(i64(u64(10n)))))))))));
}

// C/C++ source: source/build/include/print.h:60
export function buildprintpiece__template_317122bbc3ab04ac(buf, x) {
  let numdigits = u64((BigInt(u64((BigInt(u64((BigInt(8) * BigInt(u64(8))))) + BigInt(u64(1))))) / BigInt(u64(3))));
  let str = cZeroAggregate({"array": "Uint8Array", "dims": [23]});
  let strptr = str;
  let totalChars;
  if ((x < u64(0))) {
    let numChars = u64(logbasenegative__template_80dd429d232fcb75(x));
    (totalChars = u64((BigInt(numChars) + BigInt(u64(1)))));
    ((cDeref(((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_0.value = next; return previous; })(cRef(() => strptr, __cxx_lvalue_1 => { strptr = __cxx_lvalue_1; })), Uint8Array).value) = (u32(45) & 255));
    ((cDeref(cPointerOffset(strptr, numChars, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32(0) & 255));
    do {
      let qr = cCopyAggregate(divrhs__template_baae55235b275631(x), {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"q": {"native": "BigUint64Array", "offset": 0, "size": 8}, "r": {"native": "BigUint64Array", "offset": 8, "size": 8}}, "overlaps": false, "size": 16, "union": false}});
      (x = u64(qr.q));
      ((cDeref(cPointerOffset(strptr, u64((BigInt(numChars) - BigInt(u64(1)))), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(i32((i32(48) - i32((u32((u32(qr.r) & 255)) & 255))))) & 255)) & 255));
    } while (Boolean(((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = u64((previous - 1n)); __cxx_lvalue_2.value = next; return next; })(cRef(() => numChars, __cxx_lvalue_3 => { numChars = __cxx_lvalue_3; }))));
  } else {
    let numChars = u64(logbase__template_d5c7794b338f0cce(x));
    (totalChars = u64(numChars));
    ((cDeref(cPointerOffset(strptr, numChars, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32(0) & 255));
    do {
      let qr = cCopyAggregate(divrhs__template_baae55235b275631(x), {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"q": {"native": "BigUint64Array", "offset": 0, "size": 8}, "r": {"native": "BigUint64Array", "offset": 8, "size": 8}}, "overlaps": false, "size": 16, "union": false}});
      (x = u64(qr.q));
      ((cDeref(cPointerOffset(strptr, u64((BigInt(numChars) - BigInt(u64(1)))), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(i32((i32(48) + i32((u32((u32(qr.r) & 255)) & 255))))) & 255)) & 255));
    } while (Boolean(((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = u64((previous - 1n)); __cxx_lvalue_4.value = next; return next; })(cRef(() => numChars, __cxx_lvalue_5 => { numChars = __cxx_lvalue_5; }))));
  }
  strcat(buf, str);
  return totalChars;
}

export function divide__template_ba3592ae5cd0f0c1(lhs, rhs) {
  return cCopyAggregate(cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"q": {"native": "Int32Array", "offset": 0, "size": 4}, "r": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"q": i32(Math.trunc(lhs / rhs)), "r": i32((lhs % rhs))}, null, {}), {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"q": {"native": "Int32Array", "offset": 0, "size": 4}, "r": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}});
}

export function divide__template_79d93db9b67c18ea(lhs, rhs) {
  return cCopyAggregate(cInitByteRecord({"align": 2, "arrayAlign": 1, "fields": {"q": {"native": "Int16Array", "offset": 0, "size": 2}, "r": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, {"q": ((u32(((u32(Math.trunc(i32(lhs) / i32(rhs))) << 16) >> 16)) << 16) >> 16), "r": ((u32(((u32((i32(lhs) % i32(rhs))) << 16) >> 16)) << 16) >> 16)}, null, {}), {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"q": {"native": "Int16Array", "offset": 0, "size": 2}, "r": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}});
}

export function divide__template_ac9cec9160aba7ca(lhs, rhs) {
  return cCopyAggregate(cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"q": {"native": "BigInt64Array", "offset": 0, "size": 8}, "r": {"native": "BigInt64Array", "offset": 8, "size": 8}}, "overlaps": false, "size": 16, "union": false}, {"q": i64((BigInt(lhs) / BigInt(rhs))), "r": i64((BigInt(lhs) % BigInt(rhs)))}, null, {}), {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"q": {"native": "BigInt64Array", "offset": 0, "size": 8}, "r": {"native": "BigInt64Array", "offset": 8, "size": 8}}, "overlaps": false, "size": 16, "union": false}});
}

// C/C++ source: source/build/include/compat.h:1151
export function logbasenegative__template_80dd429d232fcb75(n) {
  return u64(((n > u64(i64((-i64(u64(10n)))))) ? u64(1) : u64((BigInt(u64(1)) + BigInt(logbase__template_d5c7794b338f0cce(u64((BigInt(n) / BigInt(u64(i64((-i64(u64(10n))))))))))))));
}

export function divrhs__template_baae55235b275631(lhs) {
  return cCopyAggregate(divide__template_c33a5ef944370c88(lhs, u64(i64(10n))), {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"q": {"native": "BigUint64Array", "offset": 0, "size": 8}, "r": {"native": "BigUint64Array", "offset": 8, "size": 8}}, "overlaps": false, "size": 16, "union": false}});
}

// C/C++ source: source/build/include/compat.h:1145
export function logbase__template_d5c7794b338f0cce(n) {
  return u64(((n < u64(10n)) ? u64(1) : u64((BigInt(u64(1)) + BigInt(logbase__template_d5c7794b338f0cce(u64((BigInt(n) / BigInt(u64(10n))))))))));
}

export function divide__template_c33a5ef944370c88(lhs, rhs) {
  return cCopyAggregate(cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"q": {"native": "BigUint64Array", "offset": 0, "size": 8}, "r": {"native": "BigUint64Array", "offset": 8, "size": 8}}, "overlaps": false, "size": 16, "union": false}, {"q": u64((BigInt(lhs) / BigInt(rhs))), "r": u64((BigInt(lhs) % BigInt(rhs)))}, null, {}), {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"q": {"native": "BigUint64Array", "offset": 0, "size": 8}, "r": {"native": "BigUint64Array", "offset": 8, "size": 8}}, "overlaps": false, "size": 16, "union": false}});
}
