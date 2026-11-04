// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/build/src/kplib.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
import { Alloc__cxx_static_e0036cfb06bcfe42 } from "./smmalloc_generic.cpp.mjs";
import { Free__cxx_static_0dfd3f42f0dc2c05 } from "./smmalloc_generic.cpp.mjs";
import { Realloc__cxx_static_478d5da25b6b3923 } from "./smmalloc_generic.cpp.mjs";
import { __cxx_private_cell_733ac70fd95c3367b90983c8 } from "./kplib.cpp.mjs";
import { __cxx_private_cell_b26e6394b97f66d1fd62bd8c } from "./kplib.cpp.mjs";
import { __cxx_private_cell_258736156e619bfc312178fd } from "./kplib.cpp.mjs";
import { __cxx_private_cell_73f971a45117b405bae691bf } from "./kplib.cpp.mjs";
import { __cxx_private_cell_439d0ebacabacbc4bb46f782 } from "./kplib.cpp.mjs";
import { closedir } from "../../../browser-abi/libc_provider.mjs";
import { divtable32 } from "./pragmas.cpp.mjs";
import { __cxx_private_cell_e0bf579ec89757a16ed9f5aa } from "./kplib.cpp.mjs";
import { fclose } from "../../../browser-abi/libc_provider.mjs";
import { fileno } from "../../../browser-abi/libc_provider.mjs";
import { __cxx_private_cell_3dab0cd39cd715da7cf79ad8 } from "./kplib.cpp.mjs";
import { fopen } from "../../../browser-abi/libc_provider.mjs";
import { fread } from "../../../browser-abi/libc_provider.mjs";
import { fseek } from "../../../browser-abi/libc_provider.mjs";
import { fstat } from "../../../browser-abi/libc_provider.mjs";
import { ftell } from "../../../browser-abi/libc_provider.mjs";
import { __cxx_global_cell_11016d3c7177543e564ab46c } from "./compat.cpp.mjs";
import { __cxx_private_cell_57a5d28f57b8e3415c7b14e5 } from "./kplib.cpp.mjs";
import { __cxx_private_cell_19fba13327f490e0c98ebd37 } from "./kplib.cpp.mjs";
import { __cxx_private_cell_bb1f28aaaf1422ad38efa78a } from "./kplib.cpp.mjs";
import { handle_memerr } from "./compat.cpp.mjs";
import { __cxx_private_cell_44e9d131024042d9f1569617 } from "./kplib.cpp.mjs";
import { __cxx_private_cell_5156c579fa7a8389c264632c } from "./kplib.cpp.mjs";
import { __cxx_private_cell_3927a84e1afc8dfb325bad43 } from "./kplib.cpp.mjs";
import { __cxx_private_cell_3061051e41549ca97da073af } from "./kplib.cpp.mjs";
import { __cxx_global_cell_0c0d9a71eef382369e188fb4 } from "./kplib.cpp.mjs";
import { __cxx_private_cell_b157606d4f95106080f2a466 } from "./kplib.cpp.mjs";
import { __cxx_private_cell_2360a9b21e071c889545420f } from "./kplib.cpp.mjs";
import { __cxx_private_cell_b818bdd96ac5a54d23ef8d71 } from "./kplib.cpp.mjs";
import { __cxx_private_cell_18a15d7d0a28f837f71b69ed } from "./kplib.cpp.mjs";
import { __cxx_private_cell_68d23d870c89fbf375ec9ee7 } from "./kplib.cpp.mjs";
import { __cxx_global_cell_a6e3cfd4eba13fb9886cb240 } from "./pragmas.cpp.mjs";
import { libdivide_s32_do } from "../../../browser-abi/libdivide_source.mjs";
import { libdivide_s32_gen } from "../../../browser-abi/libdivide_provider.mjs";
import { memcpy } from "../../../browser-abi/libc_provider.mjs";
import { memset } from "../../../browser-abi/libc_provider.mjs";
import { __cxx_private_cell_f5e103d64e5ebff54019b0d0 } from "./kplib.cpp.mjs";
import { __cxx_private_cell_2a654032177c315b4aec897b } from "./kplib.cpp.mjs";
import { __cxx_private_cell_00edfc6e9ac95cacc45ca40e } from "./kplib.cpp.mjs";
import { __cxx_private_cell_c0d33cac26996e1d4a46f3d9 } from "./kplib.cpp.mjs";
import { __cxx_private_cell_cb0af6faa2121464215cdde3 } from "./kplib.cpp.mjs";
import { opendir } from "../../../browser-abi/libc_provider.mjs";
import { __cxx_private_cell_515ab30648dd91d600d1cf94 } from "./kplib.cpp.mjs";
import { __cxx_private_cell_db77747fd97e714584d2217b } from "./kplib.cpp.mjs";
import { __cxx_private_cell_efafaac33827fb77a02fa134 } from "./kplib.cpp.mjs";
import { __cxx_private_cell_f4b438f749a364d46c61198d } from "./kplib.cpp.mjs";
import { __cxx_private_cell_23f9e1083f5f338d4e2b34d7 } from "./kplib.cpp.mjs";
import { __cxx_private_cell_a53b89e0c4766998f8de8a84 } from "./kplib.cpp.mjs";
import { readdir } from "../../../browser-abi/libc_provider.mjs";
import { __cxx_private_cell_fd8146c0023b762cfb4928be } from "./kplib.cpp.mjs";
import { strcat } from "../../../browser-abi/libc_provider.mjs";
import { strcpy } from "../../../browser-abi/libc_provider.mjs";
import { strlen } from "../../../browser-abi/libc_provider.mjs";
import { toupperlookup } from "./vfs.cpp.mjs";
import { __cxx_private_cell_84b58697e1377ebb6589640f } from "./kplib.cpp.mjs";

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


// Bounded source-language pointer aliases over native JS typed buffers/arrays.
// Embedded in generated ES modules; never a CPU, ISA or opcode interpreter.
const cPointer = source => {
  if(source?.__cFunctionAddress===true)throw new TypeError('Function address has no readable data storage');
  if(typeof source==='number'||typeof source==='bigint')return cPointer(cSourceAddresses.decode(source));
  if (source?.__cDeferredPointer === true) return cPointer(source.resolve());
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
const cStaticPointer = resolve => ({__cDeferredPointer:true, resolve});
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
  const initial=cPointer(arrayBytes||source);
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
  const pointerAddress=value=>cPointer(value?.[Symbol.for('source-first.original-byte-record-storage/1')]?.bytes||value);
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
    const p=Array.isArray(value)?{...cPointer(value),upper:value.length*stride,stride}:cPointer(value);
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
const cObjectFieldRef = (owner, field) => { const storage=owner?.[Symbol.for("source-first.original-byte-record-storage/1")]; if(storage)return globalThis[Symbol.for("source-first.record-pointer-views/1")].fieldReference(owner,field); const key=Symbol.for("source-object-field-references/1"); if (!Object.hasOwn(owner,key)) Object.defineProperty(owner,key,{value:new Map()}); const refs=owner[key]; if (!refs.has(field)) refs.set(field,{__cReference:true,get value(){return owner[field];},set value(value){owner[field]=value;}}); return refs.get(field); };
const cRef = (read, write) => ({ __cReference:true, get value() { return read(); }, set value(v) { write(v); } });
const cArrayRef = (array, index) => cRef(() => array[index], v => { array[index] = v; });
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
const cInitByteRecord = (schema, values={}, storage=null, prototypes={}) => {
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
      const identity=p.offset+':'+JSON.stringify(schema);
      let views=buffers.get(p.buffer);if(!views){views=new Map();buffers.set(p.buffer,views);}
      if(!views.has(identity))views.set(identity,cInitByteRecord(schema,{},new Uint8Array(p.buffer,p.offset,schema.size),p.recordPrototypes));
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
const cAssignAggregate = (destination, source, schema) => {
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

const i32 = value => typeof value === "bigint" ? Number(BigInt.asIntN(32,value)) : Number(value) | 0;
const u32 = value => typeof value === "bigint" ? Number(BigInt.asUintN(32,value)) : Number(value) >>> 0;
const i64 = value => BigInt.asIntN(64, BigInt(value));
const u64 = value => BigInt.asUintN(64, BigInt(value));


const clz64 = value => {let v=BigInt.asUintN(64,BigInt(value));if(v===0n)return 64;let n=0;while((v&(1n<<63n))===0n){v<<=1n;n++;}return n;};
const ctz64 = (value,width) => {let v=BigInt.asUintN(width,BigInt(value));if(v===0n)return width;let n=0;while((v&1n)===0n){v>>=1n;n++;}return n;};
const popcnt = value => {let v=value,n=0;while(v){v&=v-1n;n++;}return n;};

const __builtin_unreachable = () => { throw new Error("C++ undefined behavior: reached __builtin_unreachable"); };
// C/C++ source: source/build/include/fix16.h:111
export const fix16_rad_to_deg_mult__header_global_dd589d651dd16aed = i32(3754936);
function __cxx_static_address_df0de278a3c59b499550a215() {
  return __cxx_static_address_df0de278a3c59b499550a215.reference || (__cxx_static_address_df0de278a3c59b499550a215.reference = {
    __cReference: true,
    get value() { return fix16_rad_to_deg_mult__header_global_dd589d651dd16aed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:114
export const fix16_deg_to_rad_mult__header_global_49f0d20c2dca6292 = i32(1144);
function __cxx_static_address_365acf57861655745196cddc() {
  return __cxx_static_address_365acf57861655745196cddc.reference || (__cxx_static_address_365acf57861655745196cddc.reference = {
    __cReference: true,
    get value() { return fix16_deg_to_rad_mult__header_global_49f0d20c2dca6292; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/kplib.cpp:40
export function klrotl(i, sh) {
  return i32((i32((i >> (-sh))) | i32((i << sh))));
}

// C/C++ source: source/build/src/kplib.cpp:57
export let kp_frameplace = 0n;
function __cxx_static_address_aa9058e19fbcb0f313bf966e() {
  return __cxx_static_address_aa9058e19fbcb0f313bf966e.reference || (__cxx_static_address_aa9058e19fbcb0f313bf966e.reference = {
    __cReference: true,
    get value() { return kp_frameplace; },
    set value(__cxx_lvalue_0) { kp_frameplace = i64(__cxx_lvalue_0); }
  });
}
export function __cxx_private_cell_aa9058e19fbcb0f313bf966e() { return __cxx_static_address_aa9058e19fbcb0f313bf966e(); }

// C/C++ source: source/build/src/kplib.cpp:58
export let kp_bytesperline = 0;
function __cxx_static_address_2cc7af37d8316f277973d69d() {
  return __cxx_static_address_2cc7af37d8316f277973d69d.reference || (__cxx_static_address_2cc7af37d8316f277973d69d.reference = {
    __cReference: true,
    get value() { return kp_bytesperline; },
    set value(__cxx_lvalue_0) { kp_bytesperline = i32(__cxx_lvalue_0); }
  });
}
export function __cxx_private_cell_2cc7af37d8316f277973d69d() { return __cxx_static_address_2cc7af37d8316f277973d69d(); }

export let kp_xres = 0;
function __cxx_static_address_4a3aa4f1e59b84a6f47a8d3f() {
  return __cxx_static_address_4a3aa4f1e59b84a6f47a8d3f.reference || (__cxx_static_address_4a3aa4f1e59b84a6f47a8d3f.reference = {
    __cReference: true,
    get value() { return kp_xres; },
    set value(__cxx_lvalue_0) { kp_xres = i32(__cxx_lvalue_0); }
  });
}
export function __cxx_private_cell_4a3aa4f1e59b84a6f47a8d3f() { return __cxx_static_address_4a3aa4f1e59b84a6f47a8d3f(); }

export let kp_yres = 0;
function __cxx_static_address_9beff426ee0521384f277d04() {
  return __cxx_static_address_9beff426ee0521384f277d04.reference || (__cxx_static_address_9beff426ee0521384f277d04.reference = {
    __cReference: true,
    get value() { return kp_yres; },
    set value(__cxx_lvalue_0) { kp_yres = i32(__cxx_lvalue_0); }
  });
}
export function __cxx_private_cell_9beff426ee0521384f277d04() { return __cxx_static_address_9beff426ee0521384f277d04(); }

// C/C++ source: source/build/src/kplib.cpp:71
export const pow2long = new Int32Array([1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144, 524288, 1048576, 2097152, 4194304, 8388608, 16777216, 33554432, 67108864, 134217728, 268435456, 536870912, 1073741824, i32(2147483648)]);
function __cxx_static_address_89ede466f067784cc19f00d2() {
  return __cxx_static_address_89ede466f067784cc19f00d2.reference || (__cxx_static_address_89ede466f067784cc19f00d2.reference = {
    __cReference: true,
    get value() { return pow2long; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_89ede466f067784cc19f00d2() { return __cxx_static_address_89ede466f067784cc19f00d2(); }

// C/C++ source: source/build/src/kplib.cpp:108
export let palcol = new Int32Array(256);
function __cxx_static_address_abb9d4c9f889cbe37f43f79a() {
  return __cxx_static_address_abb9d4c9f889cbe37f43f79a.reference || (__cxx_static_address_abb9d4c9f889cbe37f43f79a.reference = {
    __cReference: true,
    get value() { return palcol; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_abb9d4c9f889cbe37f43f79a() { return __cxx_static_address_abb9d4c9f889cbe37f43f79a(); }

// C/C++ source: source/build/src/kplib.cpp:109
export let paleng = 0;
function __cxx_static_address_7474954c0b4cbc7822f97ecb() {
  return __cxx_static_address_7474954c0b4cbc7822f97ecb.reference || (__cxx_static_address_7474954c0b4cbc7822f97ecb.reference = {
    __cReference: true,
    get value() { return paleng; },
    set value(__cxx_lvalue_0) { paleng = i32(__cxx_lvalue_0); }
  });
}
export function __cxx_private_cell_7474954c0b4cbc7822f97ecb() { return __cxx_static_address_7474954c0b4cbc7822f97ecb(); }

export let bakcol = 0;
function __cxx_static_address_42b0e83725da16d589c74876() {
  return __cxx_static_address_42b0e83725da16d589c74876.reference || (__cxx_static_address_42b0e83725da16d589c74876.reference = {
    __cReference: true,
    get value() { return bakcol; },
    set value(__cxx_lvalue_0) { bakcol = i32(__cxx_lvalue_0); }
  });
}
export function __cxx_private_cell_42b0e83725da16d589c74876() { return __cxx_static_address_42b0e83725da16d589c74876(); }

export let numhufblocks = 0;
function __cxx_static_address_0680712895ed2a96bfc9eea6() {
  return __cxx_static_address_0680712895ed2a96bfc9eea6.reference || (__cxx_static_address_0680712895ed2a96bfc9eea6.reference = {
    __cReference: true,
    get value() { return numhufblocks; },
    set value(__cxx_lvalue_0) { numhufblocks = i32(__cxx_lvalue_0); }
  });
}
export function __cxx_private_cell_0680712895ed2a96bfc9eea6() { return __cxx_static_address_0680712895ed2a96bfc9eea6(); }

export let zlibcompflags = 0;
function __cxx_static_address_b06566e62c00f716167daaea() {
  return __cxx_static_address_b06566e62c00f716167daaea.reference || (__cxx_static_address_b06566e62c00f716167daaea.reference = {
    __cReference: true,
    get value() { return zlibcompflags; },
    set value(__cxx_lvalue_0) { zlibcompflags = i32(__cxx_lvalue_0); }
  });
}
export function __cxx_private_cell_b06566e62c00f716167daaea() { return __cxx_static_address_b06566e62c00f716167daaea(); }

// C/C++ source: source/build/src/kplib.cpp:110
export let kcoltype = 0;
function __cxx_static_address_8eb99a37935b399f54f5ade9() {
  return __cxx_static_address_8eb99a37935b399f54f5ade9.reference || (__cxx_static_address_8eb99a37935b399f54f5ade9.reference = {
    __cReference: true,
    get value() { return kcoltype; },
    set value(__cxx_lvalue_0) { kcoltype = ((u32(__cxx_lvalue_0) << 24) >> 24); }
  });
}
export function __cxx_private_cell_8eb99a37935b399f54f5ade9() { return __cxx_static_address_8eb99a37935b399f54f5ade9(); }

export let filtype = 0;
function __cxx_static_address_7335388bc40819ffb70d8c50() {
  return __cxx_static_address_7335388bc40819ffb70d8c50.reference || (__cxx_static_address_7335388bc40819ffb70d8c50.reference = {
    __cReference: true,
    get value() { return filtype; },
    set value(__cxx_lvalue_0) { filtype = ((u32(__cxx_lvalue_0) << 24) >> 24); }
  });
}
export function __cxx_private_cell_7335388bc40819ffb70d8c50() { return __cxx_static_address_7335388bc40819ffb70d8c50(); }

export let bitdepth = 0;
function __cxx_static_address_dc0c53b0b0987a1252c52e39() {
  return __cxx_static_address_dc0c53b0b0987a1252c52e39.reference || (__cxx_static_address_dc0c53b0b0987a1252c52e39.reference = {
    __cReference: true,
    get value() { return bitdepth; },
    set value(__cxx_lvalue_0) { bitdepth = ((u32(__cxx_lvalue_0) << 24) >> 24); }
  });
}
export function __cxx_private_cell_dc0c53b0b0987a1252c52e39() { return __cxx_static_address_dc0c53b0b0987a1252c52e39(); }

// C/C++ source: source/build/src/kplib.cpp:123
export let bakr = i32(128);
function __cxx_static_address_a03aea8a2e93335a33286665() {
  return __cxx_static_address_a03aea8a2e93335a33286665.reference || (__cxx_static_address_a03aea8a2e93335a33286665.reference = {
    __cReference: true,
    get value() { return bakr; },
    set value(__cxx_lvalue_0) { bakr = i32(__cxx_lvalue_0); }
  });
}
export function __cxx_private_cell_a03aea8a2e93335a33286665() { return __cxx_static_address_a03aea8a2e93335a33286665(); }

export let bakg = i32(128);
function __cxx_static_address_912432260f9f60491d6aaf54() {
  return __cxx_static_address_912432260f9f60491d6aaf54.reference || (__cxx_static_address_912432260f9f60491d6aaf54.reference = {
    __cReference: true,
    get value() { return bakg; },
    set value(__cxx_lvalue_0) { bakg = i32(__cxx_lvalue_0); }
  });
}
export function __cxx_private_cell_912432260f9f60491d6aaf54() { return __cxx_static_address_912432260f9f60491d6aaf54(); }

export let bakb = i32(128);
function __cxx_static_address_d65fc33cba52df605eefdcf9() {
  return __cxx_static_address_d65fc33cba52df605eefdcf9.reference || (__cxx_static_address_d65fc33cba52df605eefdcf9.reference = {
    __cReference: true,
    get value() { return bakb; },
    set value(__cxx_lvalue_0) { bakb = i32(__cxx_lvalue_0); }
  });
}
export function __cxx_private_cell_d65fc33cba52df605eefdcf9() { return __cxx_static_address_d65fc33cba52df605eefdcf9(); }

export let xm = 0;
function __cxx_static_address_a4a36844d745091ca3c2714a() {
  return __cxx_static_address_a4a36844d745091ca3c2714a.reference || (__cxx_static_address_a4a36844d745091ca3c2714a.reference = {
    __cReference: true,
    get value() { return xm; },
    set value(__cxx_lvalue_0) { xm = i32(__cxx_lvalue_0); }
  });
}
export function __cxx_private_cell_a4a36844d745091ca3c2714a() { return __cxx_static_address_a4a36844d745091ca3c2714a(); }

export let xmn = new Int32Array(4);
function __cxx_static_address_bbb012d26ca6a35449bd8f01() {
  return __cxx_static_address_bbb012d26ca6a35449bd8f01.reference || (__cxx_static_address_bbb012d26ca6a35449bd8f01.reference = {
    __cReference: true,
    get value() { return xmn; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_bbb012d26ca6a35449bd8f01() { return __cxx_static_address_bbb012d26ca6a35449bd8f01(); }

export let xr0 = 0;
function __cxx_static_address_eb788de64cb93c7f56597b86() {
  return __cxx_static_address_eb788de64cb93c7f56597b86.reference || (__cxx_static_address_eb788de64cb93c7f56597b86.reference = {
    __cReference: true,
    get value() { return xr0; },
    set value(__cxx_lvalue_0) { xr0 = i32(__cxx_lvalue_0); }
  });
}
export function __cxx_private_cell_eb788de64cb93c7f56597b86() { return __cxx_static_address_eb788de64cb93c7f56597b86(); }

export let xr1 = 0;
function __cxx_static_address_46cb85d5a04766d0635ecfc3() {
  return __cxx_static_address_46cb85d5a04766d0635ecfc3.reference || (__cxx_static_address_46cb85d5a04766d0635ecfc3.reference = {
    __cReference: true,
    get value() { return xr1; },
    set value(__cxx_lvalue_0) { xr1 = i32(__cxx_lvalue_0); }
  });
}
export function __cxx_private_cell_46cb85d5a04766d0635ecfc3() { return __cxx_static_address_46cb85d5a04766d0635ecfc3(); }

export let xplc = 0;
function __cxx_static_address_58655bc654cd90bf184d8756() {
  return __cxx_static_address_58655bc654cd90bf184d8756.reference || (__cxx_static_address_58655bc654cd90bf184d8756.reference = {
    __cReference: true,
    get value() { return xplc; },
    set value(__cxx_lvalue_0) { xplc = i32(__cxx_lvalue_0); }
  });
}
export function __cxx_private_cell_58655bc654cd90bf184d8756() { return __cxx_static_address_58655bc654cd90bf184d8756(); }

export let yplc = 0;
function __cxx_static_address_acafa6719cf860e283a235ed() {
  return __cxx_static_address_acafa6719cf860e283a235ed.reference || (__cxx_static_address_acafa6719cf860e283a235ed.reference = {
    __cReference: true,
    get value() { return yplc; },
    set value(__cxx_lvalue_0) { yplc = i32(__cxx_lvalue_0); }
  });
}
export function __cxx_private_cell_acafa6719cf860e283a235ed() { return __cxx_static_address_acafa6719cf860e283a235ed(); }

// C/C++ source: source/build/src/kplib.cpp:125
export let nfplace = 0n;
function __cxx_static_address_0eb7df977bc7da9c1e4ac613() {
  return __cxx_static_address_0eb7df977bc7da9c1e4ac613.reference || (__cxx_static_address_0eb7df977bc7da9c1e4ac613.reference = {
    __cReference: true,
    get value() { return nfplace; },
    set value(__cxx_lvalue_0) { nfplace = i64(__cxx_lvalue_0); }
  });
}
export function __cxx_private_cell_0eb7df977bc7da9c1e4ac613() { return __cxx_static_address_0eb7df977bc7da9c1e4ac613(); }

export let filt = 0;
function __cxx_static_address_c335b0edd5f95393c742a026() {
  return __cxx_static_address_c335b0edd5f95393c742a026.reference || (__cxx_static_address_c335b0edd5f95393c742a026.reference = {
    __cReference: true,
    get value() { return filt; },
    set value(__cxx_lvalue_0) { filt = i32(__cxx_lvalue_0); }
  });
}
export function __cxx_private_cell_c335b0edd5f95393c742a026() { return __cxx_static_address_c335b0edd5f95393c742a026(); }

export let xsiz = 0;
function __cxx_static_address_cd33825ec36b5b3a2a2a3517() {
  return __cxx_static_address_cd33825ec36b5b3a2a2a3517.reference || (__cxx_static_address_cd33825ec36b5b3a2a2a3517.reference = {
    __cReference: true,
    get value() { return xsiz; },
    set value(__cxx_lvalue_0) { xsiz = i32(__cxx_lvalue_0); }
  });
}
export function __cxx_private_cell_cd33825ec36b5b3a2a2a3517() { return __cxx_static_address_cd33825ec36b5b3a2a2a3517(); }

export let ysiz = 0;
function __cxx_static_address_4fa7bed9e2d7aaef3d1713c1() {
  return __cxx_static_address_4fa7bed9e2d7aaef3d1713c1.reference || (__cxx_static_address_4fa7bed9e2d7aaef3d1713c1.reference = {
    __cReference: true,
    get value() { return ysiz; },
    set value(__cxx_lvalue_0) { ysiz = i32(__cxx_lvalue_0); }
  });
}
export function __cxx_private_cell_4fa7bed9e2d7aaef3d1713c1() { return __cxx_static_address_4fa7bed9e2d7aaef3d1713c1(); }

// C/C++ source: source/build/src/kplib.cpp:127
export let xsizbpl = 0;
export function __cxx_global_cell_a229cb194672fefc7d370552() {
  return __cxx_global_cell_a229cb194672fefc7d370552.reference || (__cxx_global_cell_a229cb194672fefc7d370552.reference = {
    __cReference: true,
    get value() { return xsizbpl; },
    set value(__cxx_lvalue_0) { xsizbpl = i32(__cxx_lvalue_0); }
  });
}

export let ixsiz = 0;
export function __cxx_global_cell_3ebbc8ed534bff5f19d52bab() {
  return __cxx_global_cell_3ebbc8ed534bff5f19d52bab.reference || (__cxx_global_cell_3ebbc8ed534bff5f19d52bab.reference = {
    __cReference: true,
    get value() { return ixsiz; },
    set value(__cxx_lvalue_0) { ixsiz = i32(__cxx_lvalue_0); }
  });
}

export let ixoff = 0;
export function __cxx_global_cell_64b6397cf8750fb99cc9a086() {
  return __cxx_global_cell_64b6397cf8750fb99cc9a086.reference || (__cxx_global_cell_64b6397cf8750fb99cc9a086.reference = {
    __cReference: true,
    get value() { return ixoff; },
    set value(__cxx_lvalue_0) { ixoff = i32(__cxx_lvalue_0); }
  });
}

export let iyoff = 0;
export function __cxx_global_cell_1241fd28b9c332f87290381c() {
  return __cxx_global_cell_1241fd28b9c332f87290381c.reference || (__cxx_global_cell_1241fd28b9c332f87290381c.reference = {
    __cReference: true,
    get value() { return iyoff; },
    set value(__cxx_lvalue_0) { iyoff = i32(__cxx_lvalue_0); }
  });
}

export let ixstp = 0;
export function __cxx_global_cell_8f65c64e61176127370a62c6() {
  return __cxx_global_cell_8f65c64e61176127370a62c6.reference || (__cxx_global_cell_8f65c64e61176127370a62c6.reference = {
    __cReference: true,
    get value() { return ixstp; },
    set value(__cxx_lvalue_0) { ixstp = i32(__cxx_lvalue_0); }
  });
}

export let iystp = 0;
export function __cxx_global_cell_f3c1ad3fdef391eb83499b8c() {
  return __cxx_global_cell_f3c1ad3fdef391eb83499b8c.reference || (__cxx_global_cell_f3c1ad3fdef391eb83499b8c.reference = {
    __cReference: true,
    get value() { return iystp; },
    set value(__cxx_lvalue_0) { iystp = i32(__cxx_lvalue_0); }
  });
}

export let intlac = 0;
export function __cxx_global_cell_7935786d12910cda8910768f() {
  return __cxx_global_cell_7935786d12910cda8910768f.reference || (__cxx_global_cell_7935786d12910cda8910768f.reference = {
    __cReference: true,
    get value() { return intlac; },
    set value(__cxx_lvalue_0) { intlac = i32(__cxx_lvalue_0); }
  });
}

export let nbpl = 0;
export function __cxx_global_cell_d5e30f187c99e9da61258a1a() {
  return __cxx_global_cell_d5e30f187c99e9da61258a1a.reference || (__cxx_global_cell_d5e30f187c99e9da61258a1a.reference = {
    __cReference: true,
    get value() { return nbpl; },
    set value(__cxx_lvalue_0) { nbpl = i32(__cxx_lvalue_0); }
  });
}

export let opixbuf0 = new Uint8Array(4);
function __cxx_static_address_30c3020854ebf0677052a095() {
  return __cxx_static_address_30c3020854ebf0677052a095.reference || (__cxx_static_address_30c3020854ebf0677052a095.reference = {
    __cReference: true,
    get value() { return opixbuf0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_30c3020854ebf0677052a095() { return __cxx_static_address_30c3020854ebf0677052a095(); }

export let opixbuf1 = new Uint8Array(4);
function __cxx_static_address_c0d14c7a36260d8c9e084978() {
  return __cxx_static_address_c0d14c7a36260d8c9e084978.reference || (__cxx_static_address_c0d14c7a36260d8c9e084978.reference = {
    __cReference: true,
    get value() { return opixbuf1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_c0d14c7a36260d8c9e084978() { return __cxx_static_address_c0d14c7a36260d8c9e084978(); }

// C/C++ source: source/build/src/kplib.cpp:172
export function bitrev(b, c) {
  let i;
  let j;
  for ((((i = i32(1)), (j = i32(0))), (c = i32((1 << c)))); (i < c); (i = i32((Number(i) + Number(i))))) {
    (j = i32((Number(j) + Number(j))));
    if (Boolean(i32((b & i)))) {
      ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => j, __cxx_lvalue_1 => { j = __cxx_lvalue_1; }));
    }
  }
  return i32(j);
}

// C/C++ source: source/build/src/kplib.cpp:184
export function suckbitsnextblock() {
  if (Boolean(__cxx_private_cell_84b58697e1377ebb6589640f().value)) {
    B_BUF32__header_5d2f345cbe77(cPointerOffset(__cxx_private_cell_cb0af6faa2121464215cdde3().value, 0, Uint8Array.BYTES_PER_ELEMENT), B_UNBUF32__header_c1468ac058f1(cPointerOffset(__cxx_private_cell_cb0af6faa2121464215cdde3().value, u64((BigInt(131072) - BigInt(u64(4)))), Uint8Array.BYTES_PER_ELEMENT)));
    let n = u32((min__template_c5ffcfb092321e6b(((__cxx_lvalue_0) => cRef(() => __cxx_lvalue_0, () => { throw new TypeError("const C++ reference write"); }))(u32(i32((__cxx_global_cell_0c0d9a71eef382369e188fb4().value.compleng - __cxx_global_cell_0c0d9a71eef382369e188fb4().value.comptell)))), ((__cxx_lvalue_1) => cRef(() => __cxx_lvalue_1, () => { throw new TypeError("const C++ reference write"); }))(u32(u64((BigInt(131072) - BigInt(u64(4)))))))).value);
    fread(cPointerOffset(__cxx_private_cell_cb0af6faa2121464215cdde3().value, 4, Uint8Array.BYTES_PER_ELEMENT), u64(n), u64(1), __cxx_global_cell_0c0d9a71eef382369e188fb4().value.fil);
    ((__cxx_lvalue_2) => (__cxx_lvalue_2.value = i32((Number(__cxx_lvalue_2.value) + Number(n)))))(cObjectFieldRef(__cxx_global_cell_0c0d9a71eef382369e188fb4().value, "comptell"));
    (__cxx_private_cell_b26e6394b97f66d1fd62bd8c().value = i32((Number(__cxx_private_cell_b26e6394b97f66d1fd62bd8c().value) - Number(u64((BigInt(u64((BigInt(131072) - BigInt(u64(4))))) << BigInt(3)))))));
    return;
  }
  if (__cxx_private_cell_c0d33cac26996e1d4a46f3d9().value) {
    (__cxx_private_cell_3dab0cd39cd715da7cf79ad8().value = __cxx_private_cell_c0d33cac26996e1d4a46f3d9().value);
    (__cxx_private_cell_c0d33cac26996e1d4a46f3d9().value = null);
    (__cxx_private_cell_b26e6394b97f66d1fd62bd8c().value = i32((Number(__cxx_private_cell_b26e6394b97f66d1fd62bd8c().value) - Number(i32((i32((__cxx_private_cell_f5e103d64e5ebff54019b0d0().value - 4)) << 3))))));
    return;
  }
  (__cxx_private_cell_f5e103d64e5ebff54019b0d0().value = i32(B_SWAP32__header_86d0d39cb98e(B_UNBUF32__header_c1468ac058f1(cPointerOffset(__cxx_private_cell_3dab0cd39cd715da7cf79ad8().value, 8, Uint8Array.BYTES_PER_ELEMENT)))));
  (__cxx_private_cell_c0d33cac26996e1d4a46f3d9().value = cPointerOffset(__cxx_private_cell_3dab0cd39cd715da7cf79ad8().value, i32((__cxx_private_cell_f5e103d64e5ebff54019b0d0().value + 12)), Uint8Array.BYTES_PER_ELEMENT));
  B_BUF32__header_5d2f345cbe77(cPointerOffset(__cxx_private_cell_e0bf579ec89757a16ed9f5aa().value, 0, Uint8Array.BYTES_PER_ELEMENT), B_UNBUF32__header_c1468ac058f1(cPointerOffset(__cxx_private_cell_3dab0cd39cd715da7cf79ad8().value, 0, Uint8Array.BYTES_PER_ELEMENT)));
  if ((B_UNBUF32__header_c1468ac058f1(cPointerOffset(__cxx_private_cell_3dab0cd39cd715da7cf79ad8().value, 12, Uint8Array.BYTES_PER_ELEMENT)) == B_PASS32__header_8a7178a88765(1413563465))) {
    B_BUF32__header_5d2f345cbe77(cPointerOffset(__cxx_private_cell_e0bf579ec89757a16ed9f5aa().value, 4, Uint8Array.BYTES_PER_ELEMENT), B_UNBUF32__header_c1468ac058f1(cPointerOffset(__cxx_private_cell_3dab0cd39cd715da7cf79ad8().value, 16, Uint8Array.BYTES_PER_ELEMENT)));
  }
  (__cxx_private_cell_3dab0cd39cd715da7cf79ad8().value = cPointerOffset(__cxx_private_cell_e0bf579ec89757a16ed9f5aa().value, 4, Uint8Array.BYTES_PER_ELEMENT));
  (__cxx_private_cell_b26e6394b97f66d1fd62bd8c().value = i32((Number(__cxx_private_cell_b26e6394b97f66d1fd62bd8c().value) - Number(32))));
}

// C/C++ source: source/build/src/kplib.cpp:217
export function peekbits(n) {
  return i32(u32(((B_PASS32__header_8a7178a88765(B_UNBUF32__header_c1468ac058f1(cPointerOffset(__cxx_private_cell_3dab0cd39cd715da7cf79ad8().value, i32((__cxx_private_cell_b26e6394b97f66d1fd62bd8c().value >> 3)), Uint8Array.BYTES_PER_ELEMENT))) >>> i32((__cxx_private_cell_b26e6394b97f66d1fd62bd8c().value & 7))) & u32((cDeref(cPointerOffset(__cxx_private_cell_db77747fd97e714584d2217b().value, n, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)))));
}

// C/C++ source: source/build/src/kplib.cpp:218
export function suckbits(n) {
  (__cxx_private_cell_b26e6394b97f66d1fd62bd8c().value = i32((Number(__cxx_private_cell_b26e6394b97f66d1fd62bd8c().value) + Number(n))));
  if ((__cxx_private_cell_b26e6394b97f66d1fd62bd8c().value < 0)) {
    return;
  }
  suckbitsnextblock();
}

// C/C++ source: source/build/src/kplib.cpp:219
export function getbits(n) {
  let i = i32(peekbits(n));
  suckbits(n);
  return i32(i);
}

// C/C++ source: source/build/src/kplib.cpp:221
export function hufgetsym(hitab, hbmax) {
  let v;
  let n;
  (v = i32((n = i32(0))));
  do {
    (v = i32((i32((i32((i32((v << 1)) + getbits(1))) + (cDeref(cPointerOffset(hbmax, n, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))) - (cDeref(cPointerOffset(hbmax, i32((n + 1)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value))));
    ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => n, __cxx_lvalue_1 => { n = __cxx_lvalue_1; }));
  } while ((v >= 0));
  return i32((cDeref(cPointerOffset(hitab, i32(((cDeref(cPointerOffset(hbmax, n, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) + v)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value));
}

// C/C++ source: source/build/src/kplib.cpp:241
export function qhufgencode(hitab, hbmax, qhval, qhbit, numbits) {
  let i;
  let j;
  let k;
  let n;
  let r;
  (i = i32((r = i32(0))));
  for ((n = i32(1)); (n <= numbits); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => n, __cxx_lvalue_1 => { n = __cxx_lvalue_1; }))) {
    for ((k = i32((cDeref(cPointerOffset(hbmax, i32((n - 1)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value))); (k < (cDeref(cPointerOffset(hbmax, n, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)); ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i32((previous + 1)); __cxx_lvalue_2.value = next; return previous; })(cRef(() => k, __cxx_lvalue_3 => { k = __cxx_lvalue_3; }))) {
      for ((j = i32((i + (cDeref(cPointerOffset(__cxx_private_cell_db77747fd97e714584d2217b().value, i32((numbits - n)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value)))); (i <= j); ((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = i32((previous + 1)); __cxx_lvalue_4.value = next; return previous; })(cRef(() => i, __cxx_lvalue_5 => { i = __cxx_lvalue_5; }))) {
        (r = i32(bitrev(i, numbits)));
        ((cDeref(cPointerOffset(qhval, r, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((cDeref(cPointerOffset(hitab, k, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
        ((cDeref(cPointerOffset(qhbit, r, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32((u32(n) & 255)) & 255)) & 255));
      }
    }
  }
  for ((j = i32((cDeref(cPointerOffset(__cxx_private_cell_db77747fd97e714584d2217b().value, numbits, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))); (i <= j); ((__cxx_lvalue_6) => { const previous = __cxx_lvalue_6.value; const next = i32((previous + 1)); __cxx_lvalue_6.value = next; return previous; })(cRef(() => i, __cxx_lvalue_7 => { i = __cxx_lvalue_7; }))) {
    (r = i32(bitrev(i, numbits)));
    ((cDeref(cPointerOffset(qhbit, r, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(0) & 255)) & 255));
  }
}

// C/C++ source: source/build/src/kplib.cpp:289
export function hufgencode(inbuf, inum, hitab, hbmax) {
  let i;
  let tbuf = cZeroAggregate({"array": "Int32Array", "dims": [31]});
  let tbufptr;
  let hbmaxptr;
  memset(tbuf, 0, 124);
  for ((i = i32((inum - 1))); (i >= 0); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous - 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; }))) {
    ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i32((previous + 1)); __cxx_lvalue_2.value = next; return previous; })(cDeref(cPointerOffset(tbuf, (cDeref(cPointerOffset(inbuf, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value), Int32Array.BYTES_PER_ELEMENT), Int32Array));
  }
  ((cDeref(cPointerOffset(tbuf, 0, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(((cDeref(cPointerOffset(hbmax, 0, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(0))));
  for ((i = i32(0)); (i < 28); (i = i32((Number(i) + Number(4))))) {
    (tbufptr = cPointerOffset(tbuf, i, Int32Array.BYTES_PER_ELEMENT));
    (hbmaxptr = cPointerOffset(hbmax, i, Int32Array.BYTES_PER_ELEMENT));
    ((cDeref(cPointerOffset(hbmaxptr, 1, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(((cDeref(hbmaxptr, Int32Array).value) + (cDeref(tbufptr, Int32Array).value))));
    ((cDeref(cPointerOffset(hbmaxptr, 2, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(((cDeref(cPointerOffset(hbmaxptr, 1, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) + (cDeref(cPointerOffset(tbufptr, 1, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))));
    ((cDeref(cPointerOffset(hbmaxptr, 3, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(((cDeref(cPointerOffset(hbmaxptr, 2, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) + (cDeref(cPointerOffset(tbufptr, 2, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))));
    ((cDeref(cPointerOffset(hbmaxptr, 4, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(((cDeref(cPointerOffset(hbmaxptr, 3, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) + (cDeref(cPointerOffset(tbufptr, 3, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))));
  }
  (tbufptr = cPointerOffset(tbuf, i, Int32Array.BYTES_PER_ELEMENT));
  (hbmaxptr = cPointerOffset(hbmax, i, Int32Array.BYTES_PER_ELEMENT));
  ((cDeref(cPointerOffset(hbmaxptr, 1, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(((cDeref(hbmaxptr, Int32Array).value) + (cDeref(tbufptr, Int32Array).value))));
  ((cDeref(cPointerOffset(hbmaxptr, 2, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(((cDeref(cPointerOffset(hbmaxptr, 1, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) + (cDeref(cPointerOffset(tbufptr, 1, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))));
  ((cDeref(cPointerOffset(hbmaxptr, 3, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(((cDeref(cPointerOffset(hbmaxptr, 2, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) + (cDeref(cPointerOffset(tbufptr, 2, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))));
  for ((i = i32(0)); (i < inum); ((__cxx_lvalue_3) => { const previous = __cxx_lvalue_3.value; const next = i32((previous + 1)); __cxx_lvalue_3.value = next; return previous; })(cRef(() => i, __cxx_lvalue_4 => { i = __cxx_lvalue_4; }))) {
    if (Boolean((cDeref(cPointerOffset(inbuf, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))) {
      ((cDeref(cPointerOffset(hitab, ((__cxx_lvalue_5) => { const previous = __cxx_lvalue_5.value; const next = i32((previous + 1)); __cxx_lvalue_5.value = next; return previous; })(cDeref(cPointerOffset(hbmax, (cDeref(cPointerOffset(inbuf, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value), Int32Array.BYTES_PER_ELEMENT), Int32Array)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(i));
    }
  }
}

// C/C++ source: source/build/include/fix16.h:31
export const FIX16_MAX__header_global_9e4ae9fe1fbe18f7 = i32(2147483647);
function __cxx_static_address_9355e88b90a0545d6f537583() {
  return __cxx_static_address_9355e88b90a0545d6f537583.reference || (__cxx_static_address_9355e88b90a0545d6f537583.reference = {
    __cReference: true,
    get value() { return FIX16_MAX__header_global_9e4ae9fe1fbe18f7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:32
export const FIX16_MIN__header_global_cbd114d175704fe4 = i32(2147483648);
function __cxx_static_address_105dc1da94b6a370ee7f751b() {
  return __cxx_static_address_105dc1da94b6a370ee7f751b.reference || (__cxx_static_address_105dc1da94b6a370ee7f751b.reference = {
    __cReference: true,
    get value() { return FIX16_MIN__header_global_cbd114d175704fe4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:33
export const FIX16_OVERFLOW__header_global_d03d8d49df115f88 = i32(2147483648);
function __cxx_static_address_8bc858501464b531988df99a() {
  return __cxx_static_address_8bc858501464b531988df99a.reference || (__cxx_static_address_8bc858501464b531988df99a.reference = {
    __cReference: true,
    get value() { return FIX16_OVERFLOW__header_global_d03d8d49df115f88; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:35
export const fix16_one__header_global_3baf29cace4caa4b = i32(65536);
function __cxx_static_address_551685a455c92a649a9a8fef() {
  return __cxx_static_address_551685a455c92a649a9a8fef.reference || (__cxx_static_address_551685a455c92a649a9a8fef.reference = {
    __cReference: true,
    get value() { return fix16_one__header_global_3baf29cace4caa4b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:36
export const fix16_half__header_global_3255a961c9d37148 = i32(32768);
function __cxx_static_address_e1712c4b79aaa1fb1280f555() {
  return __cxx_static_address_e1712c4b79aaa1fb1280f555.reference || (__cxx_static_address_e1712c4b79aaa1fb1280f555.reference = {
    __cReference: true,
    get value() { return fix16_half__header_global_3255a961c9d37148; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:37
export const flt_f161r__header_global_d9c7d7f2518316ce = Math.fround(Math.fround((Math.fround(1) / Math.fround(65536))));
function __cxx_static_address_7279ff2227745f9e8d60ca4b() {
  return __cxx_static_address_7279ff2227745f9e8d60ca4b.reference || (__cxx_static_address_7279ff2227745f9e8d60ca4b.reference = {
    __cReference: true,
    get value() { return flt_f161r__header_global_d9c7d7f2518316ce; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/kplib.cpp:317
export function initpass() {
  let i;
  let j;
  let k;
  do {
    (i = i32((intlac << 2)));
    (ixoff = i32((i32((67240192 >> i)) & 15)));
    (iyoff = i32((i32((4202512 >> i)) & 15)));
    if ((((ixoff >= xsiz) || (iyoff >= ysiz)) && (intlac >= 2))) {
      (i = i32((-1)));
      ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous - 1)); __cxx_lvalue_0.value = next; return previous; })(__cxx_global_cell_7935786d12910cda8910768f());
    }
  } while ((i < 0));
  (j = i32((i32((857870592 >> i)) & 15)));
  (ixstp = i32((1 << j)));
  (k = i32((i32((858923280 >> i)) & 15)));
  (iystp = i32((1 << k)));
  (ixsiz = i32((i32((i32((i32((xsiz + ixstp)) - 1)) - ixoff)) >> j)));
  (nbpl = i32((kp_bytesperline << k)));
  (xsizbpl = i32(Math.imul(i32((i32((67244801 >> i32((i32(kcoltype) << 2)))) & 15)), ixsiz)));
  switch (i32(bitdepth)) {
    case 1: {
      (xsizbpl = i32((i32((xsizbpl + 7)) >> 3)));
    }
    break;
    case 2: {
      (xsizbpl = i32((i32((xsizbpl + 3)) >> 2)));
    }
    break;
    case 4: {
      (xsizbpl = i32((i32((xsizbpl + 1)) >> 1)));
    }
    break;
  }
  memset(__cxx_private_cell_cb0af6faa2121464215cdde3().value, 0, u64((BigInt(u64(i32((xsizbpl + 1)))) * BigInt(1))));
  B_BUF32__header_5d2f345cbe77(cPointerOffset(opixbuf0, 0, Uint8Array.BYTES_PER_ELEMENT), u32(0));
  B_BUF32__header_5d2f345cbe77(cPointerOffset(opixbuf1, 0, Uint8Array.BYTES_PER_ELEMENT), u32(0));
  (xplc = i32(xsizbpl));
  (yplc = i32(iyoff));
  (xm = i32(0));
  (filt = i32((-1)));
  (i = i32(ixoff));
  (i = i32((i32(((-i32((i >= 0))) | i32((ixstp - 1)))) & i)));
  (k = i32((i32(((-i32((yplc >= 0))) | i32((iystp - 1)))) & yplc)));
  (nfplace = i64((BigInt(i64(i32((i32(Math.imul(k, kp_bytesperline)) + i32((i << 2)))))) + BigInt(kp_frameplace))));
  (xr0 = i32((max__template_b1cfaf2244c73238(((__cxx_lvalue_1) => cRef(() => __cxx_lvalue_1, () => { throw new TypeError("const C++ reference write"); }))(i32((i32((i32(((-ixoff) + i32((1 << j)))) - 1)) >> j))), ((__cxx_lvalue_2) => cRef(() => __cxx_lvalue_2, () => { throw new TypeError("const C++ reference write"); }))(0))).value));
  (xr1 = i32((min__template_774131ccff66371d(((__cxx_lvalue_3) => cRef(() => __cxx_lvalue_3, () => { throw new TypeError("const C++ reference write"); }))(i32((i32((i32((i32((kp_xres - ixoff)) + i32((1 << j)))) - 1)) >> j))), __cxx_global_cell_3ebbc8ed534bff5f19d52bab())).value));
  (xr0 = i32((ixsiz - xr0)));
  (xr1 = i32((ixsiz - xr1)));
  if ((i32(kcoltype) == 4)) {
    (xr0 = i32(Math.imul(xr0, 2)));
    (xr1 = i32(Math.imul(xr1, 2)));
  } else {
    if ((i32(kcoltype) == 2)) {
      (xr0 = i32((i32(Math.imul(xr0, 3)) - 2)));
      (xr1 = i32((i32(Math.imul(xr1, 3)) - 2)));
    } else {
      if ((i32(kcoltype) == 6)) {
        (xr0 = i32((i32(Math.imul(xr0, 4)) - 2)));
        (xr1 = i32((i32(Math.imul(xr1, 4)) - 2)));
      } else {
        switch (i32(bitdepth)) {
          case 1: {
            (xr0 = i32((Number(xr0) + Number(i32((i32(((-ixsiz) & 7)) + 7))))));
          }
          (xr1 = i32((Number(xr1) + Number(i32((i32(((-ixsiz) & 7)) + 7))))));
          break;
          case 2: {
            (xr0 = i32((i32((i32((xr0 + i32(((-ixsiz) & 3)))) + 3)) << 1)));
          }
          (xr1 = i32((i32((i32((xr1 + i32(((-ixsiz) & 3)))) + 3)) << 1)));
          break;
          case 4: {
            (xr0 = i32((i32((i32((xr0 + i32(((-ixsiz) & 1)))) + 1)) << 2)));
          }
          (xr1 = i32((i32((i32((xr1 + i32(((-ixsiz) & 1)))) + 1)) << 2)));
          break;
        }
      }
    }
  }
  (ixstp = i32((ixstp << 2)));
  return i32(0);
}

// C/C++ source: source/build/src/kplib.cpp:550
export function Paeth686(a, b, c) {
  let ptr = cPointerOffset(__cxx_private_cell_733ac70fd95c3367b90983c8().value, i32((i32((c - a)) - i32((b - 512)))), Int32Array.BYTES_PER_ELEMENT);
  let esi = i32((cDeref(cPointerOffset(ptr, b, Int32Array.BYTES_PER_ELEMENT), Int32Array).value));
  let edi = i32((cDeref(cPointerOffset(ptr, c, Int32Array.BYTES_PER_ELEMENT), Int32Array).value));
  if ((edi >= esi)) {
    ((edi = i32(esi)), (c = i32(b)));
  }
  return i32(((edi < (cDeref(cPointerOffset(ptr, a, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)) ? c : a));
}

// C/C++ source: source/build/src/kplib.cpp:574
export function pal8hlineasm(x, xr1, p, ixstp) {
  for (; (x > xr1); ((p = i64((BigInt(p) + BigInt(i64(ixstp))))), ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous - 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => x, __cxx_lvalue_1 => { x = __cxx_lvalue_1; })))) {
    B_BUF32__header_5d2f345cbe77(cSourceAddresses.decode(p), u32((cDeref(cPointerOffset(palcol, (cDeref(cPointerOffset(__cxx_private_cell_cb0af6faa2121464215cdde3().value, x, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value), Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
  }
}

// C/C++ source: source/build/src/kplib.cpp:589
export let filter1st = 0;
function __cxx_static_address_716f7d463636ea4ee81dc233() {
  return __cxx_static_address_716f7d463636ea4ee81dc233.reference || (__cxx_static_address_716f7d463636ea4ee81dc233.reference = {
    __cReference: true,
    get value() { return filter1st; },
    set value(__cxx_lvalue_0) { filter1st = i32(__cxx_lvalue_0); }
  });
}
export function __cxx_private_cell_716f7d463636ea4ee81dc233() { return __cxx_static_address_716f7d463636ea4ee81dc233(); }

export let filterest = 0;
function __cxx_static_address_1d51987224f96ddbd0fc7996() {
  return __cxx_static_address_1d51987224f96ddbd0fc7996.reference || (__cxx_static_address_1d51987224f96ddbd0fc7996.reference = {
    __cReference: true,
    get value() { return filterest; },
    set value(__cxx_lvalue_0) { filterest = i32(__cxx_lvalue_0); }
  });
}
export function __cxx_private_cell_1d51987224f96ddbd0fc7996() { return __cxx_static_address_1d51987224f96ddbd0fc7996(); }

// C/C++ source: source/build/src/kplib.cpp:688
export function initpngtables() {
  let i;
  let j;
  let k;
  (j = i32(1));
  (k = i32(0));
  for ((i = i32(0)); (i < 30); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; }))) {
    ((cDeref(cPointerOffset((cPointerElementRef(__cxx_private_cell_44e9d131024042d9f1569617().value, i).value), 1, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(j));
    (j = i32((Number(j) + Number(i32((1 << k))))));
    ((cDeref(cPointerOffset((cPointerElementRef(__cxx_private_cell_44e9d131024042d9f1569617().value, i).value), 0, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(k));
    (k = i32((Number(k) + Number(i32((Boolean(i32((i & 1))) && (i >= 2)))))));
  }
  (j = i32(3));
  (k = i32(0));
  for ((i = i32(257)); (i < 285); ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i32((previous + 1)); __cxx_lvalue_2.value = next; return previous; })(cRef(() => i, __cxx_lvalue_3 => { i = __cxx_lvalue_3; }))) {
    ((cDeref(cPointerOffset((cPointerElementRef(__cxx_private_cell_44e9d131024042d9f1569617().value, i32((i32((i + 30)) - 257))).value), 1, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(j));
    (j = i32((Number(j) + Number(i32((1 << k))))));
    ((cDeref(cPointerOffset((cPointerElementRef(__cxx_private_cell_44e9d131024042d9f1569617().value, i32((i32((i + 30)) - 257))).value), 0, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(k));
    (k = i32((Number(k) + Number(i32(((!Boolean(i32((i & 3)))) && (i >= 264)))))));
  }
  ((cDeref(cPointerOffset((cPointerElementRef(__cxx_private_cell_44e9d131024042d9f1569617().value, i32((i32((285 + 30)) - 257))).value), 1, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(258));
  ((cDeref(cPointerOffset((cPointerElementRef(__cxx_private_cell_44e9d131024042d9f1569617().value, i32((i32((285 + 30)) - 257))).value), 0, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(0));
  for ((i = i32(0)); (i < 512); ((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = i32((previous + 1)); __cxx_lvalue_4.value = next; return previous; })(cRef(() => i, __cxx_lvalue_5 => { i = __cxx_lvalue_5; }))) {
    ((cDeref(cPointerOffset(__cxx_private_cell_733ac70fd95c3367b90983c8().value, i32((512 + i)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(((cDeref(cPointerOffset(__cxx_private_cell_733ac70fd95c3367b90983c8().value, i32((512 - i)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(i))));
  }
}

// C/C++ source: source/build/src/kplib.cpp:968
export let kpeginited = i32(0);
function __cxx_static_address_7d868b482eb5810f00372b0d() {
  return __cxx_static_address_7d868b482eb5810f00372b0d.reference || (__cxx_static_address_7d868b482eb5810f00372b0d.reference = {
    __cReference: true,
    get value() { return kpeginited; },
    set value(__cxx_lvalue_0) { kpeginited = i32(__cxx_lvalue_0); }
  });
}
export function __cxx_private_cell_7d868b482eb5810f00372b0d() { return __cxx_static_address_7d868b482eb5810f00372b0d(); }

// C/C++ source: source/build/src/kplib.cpp:969
export let clipxdim = 0;
function __cxx_static_address_a3dc6c1c21374777b45fcc5c() {
  return __cxx_static_address_a3dc6c1c21374777b45fcc5c.reference || (__cxx_static_address_a3dc6c1c21374777b45fcc5c.reference = {
    __cReference: true,
    get value() { return clipxdim; },
    set value(__cxx_lvalue_0) { clipxdim = i32(__cxx_lvalue_0); }
  });
}
export function __cxx_private_cell_a3dc6c1c21374777b45fcc5c() { return __cxx_static_address_a3dc6c1c21374777b45fcc5c(); }

export let clipydim = 0;
function __cxx_static_address_1c04f082b2329ae41fa28dbe() {
  return __cxx_static_address_1c04f082b2329ae41fa28dbe.reference || (__cxx_static_address_1c04f082b2329ae41fa28dbe.reference = {
    __cReference: true,
    get value() { return clipydim; },
    set value(__cxx_lvalue_0) { clipydim = i32(__cxx_lvalue_0); }
  });
}
export function __cxx_private_cell_1c04f082b2329ae41fa28dbe() { return __cxx_static_address_1c04f082b2329ae41fa28dbe(); }

// C/C++ source: source/build/src/kplib.cpp:971
export let hufmaxatbit = cNativeArray("Int32Array", [8, 20], Array.from({ length: 8 }, () => new Int32Array(20)));
function __cxx_static_address_41fcb4f438c2044fc294cd5b() {
  return __cxx_static_address_41fcb4f438c2044fc294cd5b.reference || (__cxx_static_address_41fcb4f438c2044fc294cd5b.reference = {
    __cReference: true,
    get value() { return hufmaxatbit; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_41fcb4f438c2044fc294cd5b() { return __cxx_static_address_41fcb4f438c2044fc294cd5b(); }

export let hufvalatbit = cNativeArray("Int32Array", [8, 20], Array.from({ length: 8 }, () => new Int32Array(20)));
function __cxx_static_address_0420b5466f11b0b9a0aa7df8() {
  return __cxx_static_address_0420b5466f11b0b9a0aa7df8.reference || (__cxx_static_address_0420b5466f11b0b9a0aa7df8.reference = {
    __cReference: true,
    get value() { return hufvalatbit; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_0420b5466f11b0b9a0aa7df8() { return __cxx_static_address_0420b5466f11b0b9a0aa7df8(); }

export let hufcnt = new Int32Array(8);
function __cxx_static_address_b7850715537bab8893907581() {
  return __cxx_static_address_b7850715537bab8893907581.reference || (__cxx_static_address_b7850715537bab8893907581.reference = {
    __cReference: true,
    get value() { return hufcnt; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_b7850715537bab8893907581() { return __cxx_static_address_b7850715537bab8893907581(); }

// C/C++ source: source/build/src/kplib.cpp:972
export let hufnumatbit = cNativeArray("Uint8Array", [8, 20], Array.from({ length: 8 }, () => new Uint8Array(20)));
function __cxx_static_address_eeab23a119c748c6fbd652ad() {
  return __cxx_static_address_eeab23a119c748c6fbd652ad.reference || (__cxx_static_address_eeab23a119c748c6fbd652ad.reference = {
    __cReference: true,
    get value() { return hufnumatbit; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_eeab23a119c748c6fbd652ad() { return __cxx_static_address_eeab23a119c748c6fbd652ad(); }

export let huftable = cNativeArray("Uint8Array", [8, 256], Array.from({ length: 8 }, () => new Uint8Array(256)));
function __cxx_static_address_63dad10dda3f828a9fea2b00() {
  return __cxx_static_address_63dad10dda3f828a9fea2b00.reference || (__cxx_static_address_63dad10dda3f828a9fea2b00.reference = {
    __cReference: true,
    get value() { return huftable; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_63dad10dda3f828a9fea2b00() { return __cxx_static_address_63dad10dda3f828a9fea2b00(); }

// C/C++ source: source/build/src/kplib.cpp:973
export let hufquickval = cNativeArray("Int32Array", [8, 1024], Array.from({ length: 8 }, () => new Int32Array(1024)));
function __cxx_static_address_e879e947574e9c7c3989ff42() {
  return __cxx_static_address_e879e947574e9c7c3989ff42.reference || (__cxx_static_address_e879e947574e9c7c3989ff42.reference = {
    __cReference: true,
    get value() { return hufquickval; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_e879e947574e9c7c3989ff42() { return __cxx_static_address_e879e947574e9c7c3989ff42(); }

export let hufquickbits = cNativeArray("Int32Array", [8, 1024], Array.from({ length: 8 }, () => new Int32Array(1024)));
function __cxx_static_address_15dfae2b1bea130c98975532() {
  return __cxx_static_address_15dfae2b1bea130c98975532.reference || (__cxx_static_address_15dfae2b1bea130c98975532.reference = {
    __cReference: true,
    get value() { return hufquickbits; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_15dfae2b1bea130c98975532() { return __cxx_static_address_15dfae2b1bea130c98975532(); }

export let hufquickcnt = new Int32Array(8);
function __cxx_static_address_e2fc648bd897c4cce13f2aec() {
  return __cxx_static_address_e2fc648bd897c4cce13f2aec.reference || (__cxx_static_address_e2fc648bd897c4cce13f2aec.reference = {
    __cReference: true,
    get value() { return hufquickcnt; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_e2fc648bd897c4cce13f2aec() { return __cxx_static_address_e2fc648bd897c4cce13f2aec(); }

// C/C++ source: source/build/src/kplib.cpp:974
export let quantab = cNativeArray("Int32Array", [4, 64], Array.from({ length: 4 }, () => new Int32Array(64)));
function __cxx_static_address_d1c37acef3cf6af279ae655a() {
  return __cxx_static_address_d1c37acef3cf6af279ae655a.reference || (__cxx_static_address_d1c37acef3cf6af279ae655a.reference = {
    __cReference: true,
    get value() { return quantab; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_d1c37acef3cf6af279ae655a() { return __cxx_static_address_d1c37acef3cf6af279ae655a(); }

export let dct = cNativeArray("Int32Array", [12, 64], Array.from({ length: 12 }, () => new Int32Array(64)));
function __cxx_static_address_19534326900cefdba550d3f3() {
  return __cxx_static_address_19534326900cefdba550d3f3.reference || (__cxx_static_address_19534326900cefdba550d3f3.reference = {
    __cReference: true,
    get value() { return dct; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_19534326900cefdba550d3f3() { return __cxx_static_address_19534326900cefdba550d3f3(); }

export let lastdc = new Int32Array(4);
function __cxx_static_address_f42989924089f2a657d36855() {
  return __cxx_static_address_f42989924089f2a657d36855.reference || (__cxx_static_address_f42989924089f2a657d36855.reference = {
    __cReference: true,
    get value() { return lastdc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_f42989924089f2a657d36855() { return __cxx_static_address_f42989924089f2a657d36855(); }

export let unzig = new Int32Array(64);
function __cxx_static_address_80f29d816baa224f8a52651f() {
  return __cxx_static_address_80f29d816baa224f8a52651f.reference || (__cxx_static_address_80f29d816baa224f8a52651f.reference = {
    __cReference: true,
    get value() { return unzig; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_80f29d816baa224f8a52651f() { return __cxx_static_address_80f29d816baa224f8a52651f(); }

export let zigit = new Int32Array(64);
function __cxx_static_address_9e8d54a8d1a2d78d10e25b18() {
  return __cxx_static_address_9e8d54a8d1a2d78d10e25b18.reference || (__cxx_static_address_9e8d54a8d1a2d78d10e25b18.reference = {
    __cReference: true,
    get value() { return zigit; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_9e8d54a8d1a2d78d10e25b18() { return __cxx_static_address_9e8d54a8d1a2d78d10e25b18(); }

// C/C++ source: source/build/src/kplib.cpp:975
export let gnumcomponents = 0;
function __cxx_static_address_75d78c8649b786e365f68c19() {
  return __cxx_static_address_75d78c8649b786e365f68c19.reference || (__cxx_static_address_75d78c8649b786e365f68c19.reference = {
    __cReference: true,
    get value() { return gnumcomponents; },
    set value(__cxx_lvalue_0) { gnumcomponents = (u32(__cxx_lvalue_0) & 255); }
  });
}
export function __cxx_private_cell_75d78c8649b786e365f68c19() { return __cxx_static_address_75d78c8649b786e365f68c19(); }

export let dcflagor = new Uint8Array(64);
function __cxx_static_address_d4df59d379ae9d06bd106fea() {
  return __cxx_static_address_d4df59d379ae9d06bd106fea.reference || (__cxx_static_address_d4df59d379ae9d06bd106fea.reference = {
    __cReference: true,
    get value() { return dcflagor; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_d4df59d379ae9d06bd106fea() { return __cxx_static_address_d4df59d379ae9d06bd106fea(); }

// C/C++ source: source/build/src/kplib.cpp:976
export let gcompid = new Int32Array(4);
function __cxx_static_address_62a354041c44e3a59a5bb6e5() {
  return __cxx_static_address_62a354041c44e3a59a5bb6e5.reference || (__cxx_static_address_62a354041c44e3a59a5bb6e5.reference = {
    __cReference: true,
    get value() { return gcompid; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_62a354041c44e3a59a5bb6e5() { return __cxx_static_address_62a354041c44e3a59a5bb6e5(); }

export let gcomphsamp = new Int32Array(4);
function __cxx_static_address_7227327f0b56c1a24fecf82d() {
  return __cxx_static_address_7227327f0b56c1a24fecf82d.reference || (__cxx_static_address_7227327f0b56c1a24fecf82d.reference = {
    __cReference: true,
    get value() { return gcomphsamp; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_7227327f0b56c1a24fecf82d() { return __cxx_static_address_7227327f0b56c1a24fecf82d(); }

export let gcompvsamp = new Int32Array(4);
function __cxx_static_address_10384be384c9cf5d1b6af2a7() {
  return __cxx_static_address_10384be384c9cf5d1b6af2a7.reference || (__cxx_static_address_10384be384c9cf5d1b6af2a7.reference = {
    __cReference: true,
    get value() { return gcompvsamp; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_10384be384c9cf5d1b6af2a7() { return __cxx_static_address_10384be384c9cf5d1b6af2a7(); }

export let gcompquantab = new Int32Array(4);
function __cxx_static_address_f4d3a84eedaad36cd50bed43() {
  return __cxx_static_address_f4d3a84eedaad36cd50bed43.reference || (__cxx_static_address_f4d3a84eedaad36cd50bed43.reference = {
    __cReference: true,
    get value() { return gcompquantab; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_f4d3a84eedaad36cd50bed43() { return __cxx_static_address_f4d3a84eedaad36cd50bed43(); }

export let gcomphsampshift = new Int32Array(4);
function __cxx_static_address_55c218e97391e5caa76bc580() {
  return __cxx_static_address_55c218e97391e5caa76bc580.reference || (__cxx_static_address_55c218e97391e5caa76bc580.reference = {
    __cReference: true,
    get value() { return gcomphsampshift; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_55c218e97391e5caa76bc580() { return __cxx_static_address_55c218e97391e5caa76bc580(); }

export let gcompvsampshift = new Int32Array(4);
function __cxx_static_address_f9127a62ff28682f4f5b37e6() {
  return __cxx_static_address_f9127a62ff28682f4f5b37e6.reference || (__cxx_static_address_f9127a62ff28682f4f5b37e6.reference = {
    __cReference: true,
    get value() { return gcompvsampshift; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_f9127a62ff28682f4f5b37e6() { return __cxx_static_address_f9127a62ff28682f4f5b37e6(); }

// C/C++ source: source/build/src/kplib.cpp:977
export let lnumcomponents = 0;
function __cxx_static_address_3509fb0eb490ee128ca9f127() {
  return __cxx_static_address_3509fb0eb490ee128ca9f127.reference || (__cxx_static_address_3509fb0eb490ee128ca9f127.reference = {
    __cReference: true,
    get value() { return lnumcomponents; },
    set value(__cxx_lvalue_0) { lnumcomponents = i32(__cxx_lvalue_0); }
  });
}
export function __cxx_private_cell_3509fb0eb490ee128ca9f127() { return __cxx_static_address_3509fb0eb490ee128ca9f127(); }

export let lcompid = new Int32Array(4);
function __cxx_static_address_780a71cbdc8f628e0d94911e() {
  return __cxx_static_address_780a71cbdc8f628e0d94911e.reference || (__cxx_static_address_780a71cbdc8f628e0d94911e.reference = {
    __cReference: true,
    get value() { return lcompid; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_780a71cbdc8f628e0d94911e() { return __cxx_static_address_780a71cbdc8f628e0d94911e(); }

export let lcompdc = new Int32Array(4);
function __cxx_static_address_8f32512841b5e7b1c7b7ee09() {
  return __cxx_static_address_8f32512841b5e7b1c7b7ee09.reference || (__cxx_static_address_8f32512841b5e7b1c7b7ee09.reference = {
    __cReference: true,
    get value() { return lcompdc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_8f32512841b5e7b1c7b7ee09() { return __cxx_static_address_8f32512841b5e7b1c7b7ee09(); }

export let lcompac = new Int32Array(4);
function __cxx_static_address_0c0dbb7b0f5c15485797c65b() {
  return __cxx_static_address_0c0dbb7b0f5c15485797c65b.reference || (__cxx_static_address_0c0dbb7b0f5c15485797c65b.reference = {
    __cReference: true,
    get value() { return lcompac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_0c0dbb7b0f5c15485797c65b() { return __cxx_static_address_0c0dbb7b0f5c15485797c65b(); }

export let lcomphsamp = new Int32Array(4);
function __cxx_static_address_ad70b0bbb072d1abc9cc220e() {
  return __cxx_static_address_ad70b0bbb072d1abc9cc220e.reference || (__cxx_static_address_ad70b0bbb072d1abc9cc220e.reference = {
    __cReference: true,
    get value() { return lcomphsamp; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_ad70b0bbb072d1abc9cc220e() { return __cxx_static_address_ad70b0bbb072d1abc9cc220e(); }

export let lcompvsamp = new Int32Array(4);
function __cxx_static_address_a93825664212712b246323ca() {
  return __cxx_static_address_a93825664212712b246323ca.reference || (__cxx_static_address_a93825664212712b246323ca.reference = {
    __cReference: true,
    get value() { return lcompvsamp; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_a93825664212712b246323ca() { return __cxx_static_address_a93825664212712b246323ca(); }

export let lcompquantab = new Int32Array(4);
function __cxx_static_address_c83421310512dbb3c439a08e() {
  return __cxx_static_address_c83421310512dbb3c439a08e.reference || (__cxx_static_address_c83421310512dbb3c439a08e.reference = {
    __cReference: true,
    get value() { return lcompquantab; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_c83421310512dbb3c439a08e() { return __cxx_static_address_c83421310512dbb3c439a08e(); }

// C/C++ source: source/build/src/kplib.cpp:978
export let lcomphvsamp0 = 0;
function __cxx_static_address_5b41e208efb540392a35c934() {
  return __cxx_static_address_5b41e208efb540392a35c934.reference || (__cxx_static_address_5b41e208efb540392a35c934.reference = {
    __cReference: true,
    get value() { return lcomphvsamp0; },
    set value(__cxx_lvalue_0) { lcomphvsamp0 = i32(__cxx_lvalue_0); }
  });
}
export function __cxx_private_cell_5b41e208efb540392a35c934() { return __cxx_static_address_5b41e208efb540392a35c934(); }

export let lcomphsampshift0 = 0;
function __cxx_static_address_f6191a42e236b7d145b8bb7c() {
  return __cxx_static_address_f6191a42e236b7d145b8bb7c.reference || (__cxx_static_address_f6191a42e236b7d145b8bb7c.reference = {
    __cReference: true,
    get value() { return lcomphsampshift0; },
    set value(__cxx_lvalue_0) { lcomphsampshift0 = i32(__cxx_lvalue_0); }
  });
}
export function __cxx_private_cell_f6191a42e236b7d145b8bb7c() { return __cxx_static_address_f6191a42e236b7d145b8bb7c(); }

export let lcompvsampshift0 = 0;
function __cxx_static_address_07fbbf67d5756cc331ba3662() {
  return __cxx_static_address_07fbbf67d5756cc331ba3662.reference || (__cxx_static_address_07fbbf67d5756cc331ba3662.reference = {
    __cReference: true,
    get value() { return lcompvsampshift0; },
    set value(__cxx_lvalue_0) { lcompvsampshift0 = i32(__cxx_lvalue_0); }
  });
}
export function __cxx_private_cell_07fbbf67d5756cc331ba3662() { return __cxx_static_address_07fbbf67d5756cc331ba3662(); }

// C/C++ source: source/build/src/kplib.cpp:979
export let colclip = new Int32Array(1024);
function __cxx_static_address_01337dfaea8095be9fc9e8c0() {
  return __cxx_static_address_01337dfaea8095be9fc9e8c0.reference || (__cxx_static_address_01337dfaea8095be9fc9e8c0.reference = {
    __cReference: true,
    get value() { return colclip; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_01337dfaea8095be9fc9e8c0() { return __cxx_static_address_01337dfaea8095be9fc9e8c0(); }

export let colclipup8 = new Int32Array(1024);
function __cxx_static_address_18b9cb201742c8b2f5dc9da4() {
  return __cxx_static_address_18b9cb201742c8b2f5dc9da4.reference || (__cxx_static_address_18b9cb201742c8b2f5dc9da4.reference = {
    __cReference: true,
    get value() { return colclipup8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_18b9cb201742c8b2f5dc9da4() { return __cxx_static_address_18b9cb201742c8b2f5dc9da4(); }

export let colclipup16 = new Int32Array(1024);
function __cxx_static_address_15f8ff9c4d3432a740dcfe9f() {
  return __cxx_static_address_15f8ff9c4d3432a740dcfe9f.reference || (__cxx_static_address_15f8ff9c4d3432a740dcfe9f.reference = {
    __cReference: true,
    get value() { return colclipup16; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_15f8ff9c4d3432a740dcfe9f() { return __cxx_static_address_15f8ff9c4d3432a740dcfe9f(); }

// C/C++ source: source/build/src/kplib.cpp:1020
export function mulshr24(a, b) {
  return i32(i64((BigInt(i64((BigInt(i64(a)) * BigInt(i64(b))))) >> BigInt(24))));
}

// C/C++ source: source/build/src/kplib.cpp:1025
export function mulshr32(a, b) {
  return i32(i64((BigInt(i64((BigInt(i64(a)) * BigInt(i64(b))))) >> BigInt(32))));
}

// C/C++ source: source/build/src/kplib.cpp:1032
export let cosqr16 = new Int32Array([23726566, 23270667, 21920489, 19727919, 16777216, 13181774, 9079764, 4628823]);
function __cxx_static_address_6b0a1eea6980b95702f7d476() {
  return __cxx_static_address_6b0a1eea6980b95702f7d476.reference || (__cxx_static_address_6b0a1eea6980b95702f7d476.reference = {
    __cReference: true,
    get value() { return cosqr16; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_6b0a1eea6980b95702f7d476() { return __cxx_static_address_6b0a1eea6980b95702f7d476(); }

// C/C++ source: source/build/src/kplib.cpp:1034
export let crmul = new Int32Array(4096);
function __cxx_static_address_38ea85f8209c940eddcd58e9() {
  return __cxx_static_address_38ea85f8209c940eddcd58e9.reference || (__cxx_static_address_38ea85f8209c940eddcd58e9.reference = {
    __cReference: true,
    get value() { return crmul; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_38ea85f8209c940eddcd58e9() { return __cxx_static_address_38ea85f8209c940eddcd58e9(); }

export let cbmul = new Int32Array(4096);
function __cxx_static_address_bcff3e961faff31cb085446b() {
  return __cxx_static_address_bcff3e961faff31cb085446b.reference || (__cxx_static_address_bcff3e961faff31cb085446b.reference = {
    __cReference: true,
    get value() { return cbmul; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_bcff3e961faff31cb085446b() { return __cxx_static_address_bcff3e961faff31cb085446b(); }

// C/C++ source: source/build/src/kplib.cpp:1036
export function initkpeg() {
  let i;
  let j;
  let y;
  let x = i32(0);
  for ((i = i32(0)); (i < 16); (i = i32((Number(i) + Number(2))))) {
    for ((y = i32((8 - 1))); (y >= 0); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous - 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => y, __cxx_lvalue_1 => { y = __cxx_lvalue_1; }))) {
      if ((u32(i32((i - y))) < u32(8))) {
        ((cDeref(cPointerOffset(unzig, ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i32((previous + 1)); __cxx_lvalue_2.value = next; return previous; })(cRef(() => x, __cxx_lvalue_3 => { x = __cxx_lvalue_3; })), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((i32((i32((y << 3)) + i)) - y)));
      }
    }
    for ((y = i32(0)); (y < 8); ((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = i32((previous + 1)); __cxx_lvalue_4.value = next; return previous; })(cRef(() => y, __cxx_lvalue_5 => { y = __cxx_lvalue_5; }))) {
      if ((u32(i32((i32((i + 1)) - y))) < u32(8))) {
        ((cDeref(cPointerOffset(unzig, ((__cxx_lvalue_6) => { const previous = __cxx_lvalue_6.value; const next = i32((previous + 1)); __cxx_lvalue_6.value = next; return previous; })(cRef(() => x, __cxx_lvalue_7 => { x = __cxx_lvalue_7; })), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((i32((i32((i32((y << 3)) + i)) + 1)) - y)));
      }
    }
  }
  for ((i = i32((64 - 1))); (i >= 0); ((__cxx_lvalue_8) => { const previous = __cxx_lvalue_8.value; const next = i32((previous - 1)); __cxx_lvalue_8.value = next; return previous; })(cRef(() => i, __cxx_lvalue_9 => { i = __cxx_lvalue_9; }))) {
    ((cDeref(cPointerOffset(zigit, (cDeref(cPointerOffset(unzig, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(i));
  }
  for ((i = i32((64 - 1))); (i >= 0); ((__cxx_lvalue_10) => { const previous = __cxx_lvalue_10.value; const next = i32((previous - 1)); __cxx_lvalue_10.value = next; return previous; })(cRef(() => i, __cxx_lvalue_11 => { i = __cxx_lvalue_11; }))) {
    ((cDeref(cPointerOffset(dcflagor, i, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32((u32(i32((1 << i32(((cDeref(cPointerOffset(unzig, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) >> 3))))) & 255)) & 255)) & 255));
  }
  for ((i = i32(0)); (i < 128); ((__cxx_lvalue_12) => { const previous = __cxx_lvalue_12.value; const next = i32((previous + 1)); __cxx_lvalue_12.value = next; return previous; })(cRef(() => i, __cxx_lvalue_13 => { i = __cxx_lvalue_13; }))) {
    ((cDeref(cPointerOffset(colclip, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((i + 128)));
  }
  for ((i = i32(128)); (i < 512); ((__cxx_lvalue_14) => { const previous = __cxx_lvalue_14.value; const next = i32((previous + 1)); __cxx_lvalue_14.value = next; return previous; })(cRef(() => i, __cxx_lvalue_15 => { i = __cxx_lvalue_15; }))) {
    ((cDeref(cPointerOffset(colclip, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(255));
  }
  for ((i = i32(512)); (i < 896); ((__cxx_lvalue_16) => { const previous = __cxx_lvalue_16.value; const next = i32((previous + 1)); __cxx_lvalue_16.value = next; return previous; })(cRef(() => i, __cxx_lvalue_17 => { i = __cxx_lvalue_17; }))) {
    ((cDeref(cPointerOffset(colclip, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(0));
  }
  for ((i = i32(896)); (i < 1024); ((__cxx_lvalue_18) => { const previous = __cxx_lvalue_18.value; const next = i32((previous + 1)); __cxx_lvalue_18.value = next; return previous; })(cRef(() => i, __cxx_lvalue_19 => { i = __cxx_lvalue_19; }))) {
    ((cDeref(cPointerOffset(colclip, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((i - 896)));
  }
  for ((i = i32(0)); (i < 1024); ((__cxx_lvalue_20) => { const previous = __cxx_lvalue_20.value; const next = i32((previous + 1)); __cxx_lvalue_20.value = next; return previous; })(cRef(() => i, __cxx_lvalue_21 => { i = __cxx_lvalue_21; }))) {
    ((cDeref(cPointerOffset(colclipup8, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(((cDeref(cPointerOffset(colclip, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) << 8)));
    ((cDeref(cPointerOffset(colclipup16, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(u32((u32(i32(((cDeref(cPointerOffset(colclip, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) << 16))) + 4278190080))));
  }
  for ((i = i32(0)); (i < 2048); ((__cxx_lvalue_22) => { const previous = __cxx_lvalue_22.value; const next = i32((previous + 1)); __cxx_lvalue_22.value = next; return previous; })(cRef(() => i, __cxx_lvalue_23 => { i = __cxx_lvalue_23; }))) {
    (j = i32((i - 1024)));
    ((cDeref(cPointerOffset(crmul, i32((i32((i << 1)) + 0)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(Math.imul(j, 1470104)));
    ((cDeref(cPointerOffset(crmul, i32((i32((i << 1)) + 1)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(Math.imul(j, (-748830))));
    ((cDeref(cPointerOffset(cbmul, i32((i32((i << 1)) + 0)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(Math.imul(j, (-360857))));
    ((cDeref(cPointerOffset(cbmul, i32((i32((i << 1)) + 1)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(Math.imul(j, 1858077)));
  }
  memset(cPointerOffset((cPointerElementRef(dct, 10).value), 0, Int32Array.BYTES_PER_ELEMENT), 0, u64((BigInt(u64(i32(Math.imul(64, 2)))) * BigInt(4))));
}

// C/C++ source: source/build/src/kplib.cpp:1081
export function huffgetval(index, curbits, num, daval, dabits) {
  let b;
  let v;
  let pow2;
  let hmax;
  (hmax = cPointerOffset((cPointerElementRef(hufmaxatbit, index).value), 0, Int32Array.BYTES_PER_ELEMENT));
  (pow2 = i32((cDeref(cPointerOffset(pow2long, i32((curbits - 1)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
  if (Boolean(i32((num & pow2)))) {
    (v = i32(1));
  } else {
    (v = i32(0));
  }
  for ((b = i32(1)); (b <= 16); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => b, __cxx_lvalue_1 => { b = __cxx_lvalue_1; }))) {
    if ((v < (cDeref(cPointerOffset(hmax, b, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))) {
      ((cDeref(dabits, Int32Array).value) = i32(b));
      ((cDeref(daval, Int32Array).value) = i32((cDeref(cPointerOffset((cPointerElementRef(huftable, index).value), i32(((cDeref(cPointerOffset((cPointerElementRef(hufvalatbit, index).value), b, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) + v)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)));
      return;
    }
    (pow2 = i32((pow2 >> 1)));
    (v = i32((v << 1)));
    if (Boolean(i32((num & pow2)))) {
      ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i32((previous + 1)); __cxx_lvalue_2.value = next; return previous; })(cRef(() => v, __cxx_lvalue_3 => { v = __cxx_lvalue_3; }));
    }
  }
  ((cDeref(dabits, Int32Array).value) = i32(16));
  ((cDeref(daval, Int32Array).value) = i32(0));
}

// C/C++ source: source/build/src/kplib.cpp:1102
export function invdct8x8(dc, dcflag) {
  let edc;
  let t0;
  let t1;
  let t2;
  let t3;
  let t4;
  let t5;
  let t6;
  let t7;
  (edc = cPointerOffset(dc, 64, Int32Array.BYTES_PER_ELEMENT));
  do {
    if (Boolean(i32((i32(dcflag) & 1)))) {
      (t3 = i32(((cDeref(cPointerOffset(dc, 2, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) + (cDeref(cPointerOffset(dc, 6, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))));
      (t2 = i32((i32((mulshr32(i32(((cDeref(cPointerOffset(dc, 2, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) - (cDeref(cPointerOffset(dc, 6, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))), i32((23726566 << 6))) << 2)) - t3)));
      (t4 = i32(((cDeref(cPointerOffset(dc, 0, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) + (cDeref(cPointerOffset(dc, 4, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))));
      (t5 = i32(((cDeref(cPointerOffset(dc, 0, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) - (cDeref(cPointerOffset(dc, 4, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))));
      (t0 = i32((t4 + t3)));
      (t3 = i32((t4 - t3)));
      (t1 = i32((t5 + t2)));
      (t2 = i32((t5 - t2)));
      (t4 = i32((mulshr32(i32((i32((i32(((cDeref(cPointerOffset(dc, 5, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) - (cDeref(cPointerOffset(dc, 3, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))) + (cDeref(cPointerOffset(dc, 1, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))) - (cDeref(cPointerOffset(dc, 7, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))), i32((31000253 << 6))) << 2)));
      (t7 = i32((i32((i32(((cDeref(cPointerOffset(dc, 1, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) + (cDeref(cPointerOffset(dc, 7, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))) + (cDeref(cPointerOffset(dc, 5, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))) + (cDeref(cPointerOffset(dc, 3, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))));
      (t6 = i32((i32((i32((mulshr32(i32(((cDeref(cPointerOffset(dc, 3, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) - (cDeref(cPointerOffset(dc, 5, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))), i32((43840978 << 5))) << 3)) + t4)) - t7)));
      (t5 = i32((i32((mulshr32(i32((i32((i32(((cDeref(cPointerOffset(dc, 1, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) + (cDeref(cPointerOffset(dc, 7, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))) - (cDeref(cPointerOffset(dc, 5, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))) - (cDeref(cPointerOffset(dc, 3, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))), i32((23726566 << 6))) << 2)) - t6)));
      (t4 = i32((i32((i32((mulshr32(i32(((cDeref(cPointerOffset(dc, 1, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) - (cDeref(cPointerOffset(dc, 7, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))), i32((18159528 << 6))) << 2)) - t4)) + t5)));
      ((cDeref(cPointerOffset(dc, 0, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((t0 + t7)));
      ((cDeref(cPointerOffset(dc, 7, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((t0 - t7)));
      ((cDeref(cPointerOffset(dc, 1, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((t1 + t6)));
      ((cDeref(cPointerOffset(dc, 6, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((t1 - t6)));
      ((cDeref(cPointerOffset(dc, 2, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((t2 + t5)));
      ((cDeref(cPointerOffset(dc, 5, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((t2 - t5)));
      ((cDeref(cPointerOffset(dc, 4, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((t3 + t4)));
      ((cDeref(cPointerOffset(dc, 3, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((t3 - t4)));
    }
    (dc = cPointerOffset(dc, 8, Int32Array.BYTES_PER_ELEMENT));
    (dcflag = (u32((dcflag >> 1)) & 255));
  } while (cPointerCompare(dc, edc, "<"));
  (dc = cPointerOffset(dc, -(32), Int32Array.BYTES_PER_ELEMENT));
  (edc = cPointerOffset(edc, -(24), Int32Array.BYTES_PER_ELEMENT));
  do {
    (t3 = i32(((cDeref(cPointerOffset(dc, i32((i32(Math.imul(2, 8)) - 32)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) + (cDeref(cPointerOffset(dc, i32((i32(Math.imul(6, 8)) - 32)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value))));
    (t2 = i32((i32((mulshr32(i32(((cDeref(cPointerOffset(dc, i32((i32(Math.imul(2, 8)) - 32)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) - (cDeref(cPointerOffset(dc, i32((i32(Math.imul(6, 8)) - 32)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value))), i32((23726566 << 6))) << 2)) - t3)));
    (t4 = i32(((cDeref(cPointerOffset(dc, i32((i32(Math.imul(0, 8)) - 32)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) + (cDeref(cPointerOffset(dc, i32((i32(Math.imul(4, 8)) - 32)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value))));
    (t5 = i32(((cDeref(cPointerOffset(dc, i32((i32(Math.imul(0, 8)) - 32)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) - (cDeref(cPointerOffset(dc, i32((i32(Math.imul(4, 8)) - 32)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value))));
    (t0 = i32((t4 + t3)));
    (t3 = i32((t4 - t3)));
    (t1 = i32((t5 + t2)));
    (t2 = i32((t5 - t2)));
    (t4 = i32((mulshr32(i32((i32((i32(((cDeref(cPointerOffset(dc, i32((i32(Math.imul(5, 8)) - 32)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) - (cDeref(cPointerOffset(dc, i32((i32(Math.imul(3, 8)) - 32)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value))) + (cDeref(cPointerOffset(dc, i32((i32(Math.imul(1, 8)) - 32)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value))) - (cDeref(cPointerOffset(dc, i32((i32(Math.imul(7, 8)) - 32)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value))), i32((31000253 << 6))) << 2)));
    (t7 = i32((i32((i32(((cDeref(cPointerOffset(dc, i32((i32(Math.imul(1, 8)) - 32)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) + (cDeref(cPointerOffset(dc, i32((i32(Math.imul(7, 8)) - 32)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value))) + (cDeref(cPointerOffset(dc, i32((i32(Math.imul(5, 8)) - 32)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value))) + (cDeref(cPointerOffset(dc, i32((i32(Math.imul(3, 8)) - 32)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value))));
    (t6 = i32((i32((i32((mulshr32(i32(((cDeref(cPointerOffset(dc, i32((i32(Math.imul(3, 8)) - 32)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) - (cDeref(cPointerOffset(dc, i32((i32(Math.imul(5, 8)) - 32)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value))), i32((43840978 << 5))) << 3)) + t4)) - t7)));
    (t5 = i32((i32((mulshr32(i32((i32((i32(((cDeref(cPointerOffset(dc, i32((i32(Math.imul(1, 8)) - 32)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) + (cDeref(cPointerOffset(dc, i32((i32(Math.imul(7, 8)) - 32)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value))) - (cDeref(cPointerOffset(dc, i32((i32(Math.imul(5, 8)) - 32)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value))) - (cDeref(cPointerOffset(dc, i32((i32(Math.imul(3, 8)) - 32)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value))), i32((23726566 << 6))) << 2)) - t6)));
    (t4 = i32((i32((i32((mulshr32(i32(((cDeref(cPointerOffset(dc, i32((i32(Math.imul(1, 8)) - 32)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) - (cDeref(cPointerOffset(dc, i32((i32(Math.imul(7, 8)) - 32)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value))), i32((18159528 << 6))) << 2)) - t4)) + t5)));
    ((cDeref(cPointerOffset(dc, i32((i32(Math.imul(0, 8)) - 32)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((t0 + t7)));
    ((cDeref(cPointerOffset(dc, i32((i32(Math.imul(7, 8)) - 32)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((t0 - t7)));
    ((cDeref(cPointerOffset(dc, i32((i32(Math.imul(1, 8)) - 32)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((t1 + t6)));
    ((cDeref(cPointerOffset(dc, i32((i32(Math.imul(6, 8)) - 32)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((t1 - t6)));
    ((cDeref(cPointerOffset(dc, i32((i32(Math.imul(2, 8)) - 32)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((t2 + t5)));
    ((cDeref(cPointerOffset(dc, i32((i32(Math.imul(5, 8)) - 32)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((t2 - t5)));
    ((cDeref(cPointerOffset(dc, i32((i32(Math.imul(4, 8)) - 32)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((t3 + t4)));
    ((cDeref(cPointerOffset(dc, i32((i32(Math.imul(3, 8)) - 32)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((t3 - t4)));
    ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = cPointerOffset(previous, 1, Int32Array.BYTES_PER_ELEMENT); __cxx_lvalue_0.value = next; return previous; })(cRef(() => dc, __cxx_lvalue_1 => { dc = __cxx_lvalue_1; }));
  } while (cPointerCompare(dc, edc, "<"));
}

// C/C++ source: source/build/src/kplib.cpp:1149
export function yrbrend(x, y, ldct) {
  let i;
  let j;
  let ox;
  let oy;
  let xx;
  let yy;
  let xxx;
  let yyy;
  let xxxend;
  let yyyend;
  let yv;
  let cr = i32(0);
  let cb = i32(0);
  let odc;
  let dc;
  let dc2;
  let p;
  let pp;
  (odc = ldct);
  (dc2 = cPointerOffset(ldct, i32((10 << 6)), Int32Array.BYTES_PER_ELEMENT));
  for ((yy = i32(0)); (yy < i32(((cDeref(cPointerOffset(lcompvsamp, 0, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) << 3))); (yy = i32((Number(yy) + Number(8))))) {
    (oy = i32((y + yy)));
    if ((u32(oy) >= u32(clipydim))) {
      (odc = cPointerOffset(odc, i32(((cDeref(cPointerOffset(lcomphsamp, 0, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) << 6)), Int32Array.BYTES_PER_ELEMENT));
      continue;
    }
    (pp = i64((BigInt(i64(i32((i32(Math.imul(oy, kp_bytesperline)) + i32((x << 2)))))) + BigInt(kp_frameplace))));
    for ((xx = i32(0)); (xx < i32(((cDeref(cPointerOffset(lcomphsamp, 0, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) << 3))); ((xx = i32((Number(xx) + Number(8)))), (odc = cPointerOffset(odc, 64, Int32Array.BYTES_PER_ELEMENT)))) {
      (ox = i32((x + xx)));
      if ((u32(ox) >= u32(clipxdim))) {
        continue;
      }
      (p = i64((BigInt(pp) + BigInt(i64(i32((xx << 2)))))));
      (dc = odc);
      if ((lnumcomponents > 1)) {
        (dc2 = cPointerOffset(ldct, i32((i32((i32((lcomphvsamp0 << 6)) + i32((i32((yy >> lcompvsampshift0)) << 3)))) + i32((xx >> lcomphsampshift0)))), Int32Array.BYTES_PER_ELEMENT));
      }
      (xxxend = i32((min__template_774131ccff66371d(((__cxx_lvalue_0) => cRef(() => __cxx_lvalue_0, () => { throw new TypeError("const C++ reference write"); }))(i32((clipxdim - ox))), ((__cxx_lvalue_1) => cRef(() => __cxx_lvalue_1, () => { throw new TypeError("const C++ reference write"); }))(8))).value));
      (yyyend = i32((min__template_774131ccff66371d(((__cxx_lvalue_2) => cRef(() => __cxx_lvalue_2, () => { throw new TypeError("const C++ reference write"); }))(i32((clipydim - oy))), ((__cxx_lvalue_3) => cRef(() => __cxx_lvalue_3, () => { throw new TypeError("const C++ reference write"); }))(8))).value));
      if ((((cDeref(cPointerOffset(lcomphsamp, 0, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) == 1) && (xxxend == 8))) {
        for ((yyy = i32(0)); (yyy < yyyend); ((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = i32((previous + 1)); __cxx_lvalue_4.value = next; return previous; })(cRef(() => yyy, __cxx_lvalue_5 => { yyy = __cxx_lvalue_5; }))) {
          for ((xxx = i32(0)); (xxx < 8); ((__cxx_lvalue_6) => { const previous = __cxx_lvalue_6.value; const next = i32((previous + 1)); __cxx_lvalue_6.value = next; return previous; })(cRef(() => xxx, __cxx_lvalue_7 => { xxx = __cxx_lvalue_7; }))) {
            (yv = i32((cDeref(cPointerOffset(dc, xxx, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
            (cr = i32((i32(((cDeref(cPointerOffset(dc2, i32((xxx + 64)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) >> i32((20 - 1)))) & (~1))));
            (cb = i32((i32(((cDeref(cPointerOffset(dc2, xxx, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) >> i32((20 - 1)))) & (~1))));
            ((cDeref(cPointerOffset(cTypedPointer(cSourceAddresses.decode(p), Int32Array), xxx, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((i32(((cDeref(cPointerOffset(colclipup16, (u32(i32((yv + (cDeref(cPointerOffset(crmul, i32((cr + 2048)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value)))) >>> 22), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) + (cDeref(cPointerOffset(colclipup8, (u32(i32((i32((yv + (cDeref(cPointerOffset(crmul, i32((cr + 2049)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value))) + (cDeref(cPointerOffset(cbmul, i32((cb + 2048)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value)))) >>> 22), Int32Array.BYTES_PER_ELEMENT), Int32Array).value))) + (cDeref(cPointerOffset(colclip, (u32(i32((yv + (cDeref(cPointerOffset(cbmul, i32((cb + 2049)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value)))) >>> 22), Int32Array.BYTES_PER_ELEMENT), Int32Array).value))));
          }
          (p = i64((BigInt(p) + BigInt(i64(kp_bytesperline)))));
          (dc = cPointerOffset(dc, 8, Int32Array.BYTES_PER_ELEMENT));
          if ((!Boolean(i32((i32((yyy + 1)) & i32(((cDeref(cPointerOffset(lcompvsamp, 0, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) - 1))))))) {
            (dc2 = cPointerOffset(dc2, 8, Int32Array.BYTES_PER_ELEMENT));
          }
        }
      } else {
        if ((((cDeref(cPointerOffset(lcomphsamp, 0, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) == 2) && (xxxend == 8))) {
          for ((yyy = i32(0)); (yyy < yyyend); ((__cxx_lvalue_8) => { const previous = __cxx_lvalue_8.value; const next = i32((previous + 1)); __cxx_lvalue_8.value = next; return previous; })(cRef(() => yyy, __cxx_lvalue_9 => { yyy = __cxx_lvalue_9; }))) {
            for ((xxx = i32(0)); (xxx < 8); (xxx = i32((Number(xxx) + Number(2))))) {
              (yv = i32((cDeref(cPointerOffset(dc, xxx, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
              (cr = i32((i32(((cDeref(cPointerOffset(dc2, i32((i32((xxx >> 1)) + 64)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) >> i32((20 - 1)))) & (~1))));
              (cb = i32((i32(((cDeref(cPointerOffset(dc2, i32((xxx >> 1)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) >> i32((20 - 1)))) & (~1))));
              (i = i32(((cDeref(cPointerOffset(crmul, i32((cr + 2049)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) + (cDeref(cPointerOffset(cbmul, i32((cb + 2048)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value))));
              (cr = i32((cDeref(cPointerOffset(crmul, i32((cr + 2048)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
              (cb = i32((cDeref(cPointerOffset(cbmul, i32((cb + 2049)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
              ((cDeref(cPointerOffset(cTypedPointer(cSourceAddresses.decode(p), Int32Array), xxx, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((i32(((cDeref(cPointerOffset(colclipup16, (u32(i32((yv + cr))) >>> 22), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) + (cDeref(cPointerOffset(colclipup8, (u32(i32((yv + i))) >>> 22), Int32Array.BYTES_PER_ELEMENT), Int32Array).value))) + (cDeref(cPointerOffset(colclip, (u32(i32((yv + cb))) >>> 22), Int32Array.BYTES_PER_ELEMENT), Int32Array).value))));
              (yv = i32((cDeref(cPointerOffset(dc, i32((xxx + 1)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
              ((cDeref(cPointerOffset(cTypedPointer(cSourceAddresses.decode(p), Int32Array), i32((xxx + 1)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((i32(((cDeref(cPointerOffset(colclipup16, (u32(i32((yv + cr))) >>> 22), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) + (cDeref(cPointerOffset(colclipup8, (u32(i32((yv + i))) >>> 22), Int32Array.BYTES_PER_ELEMENT), Int32Array).value))) + (cDeref(cPointerOffset(colclip, (u32(i32((yv + cb))) >>> 22), Int32Array.BYTES_PER_ELEMENT), Int32Array).value))));
            }
            (p = i64((BigInt(p) + BigInt(i64(kp_bytesperline)))));
            (dc = cPointerOffset(dc, 8, Int32Array.BYTES_PER_ELEMENT));
            if ((!Boolean(i32((i32((yyy + 1)) & i32(((cDeref(cPointerOffset(lcompvsamp, 0, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) - 1))))))) {
              (dc2 = cPointerOffset(dc2, 8, Int32Array.BYTES_PER_ELEMENT));
            }
          }
        } else {
          for ((yyy = i32(0)); (yyy < yyyend); ((__cxx_lvalue_10) => { const previous = __cxx_lvalue_10.value; const next = i32((previous + 1)); __cxx_lvalue_10.value = next; return previous; })(cRef(() => yyy, __cxx_lvalue_11 => { yyy = __cxx_lvalue_11; }))) {
            (i = i32(0));
            (j = i32(1));
            for ((xxx = i32(0)); (xxx < xxxend); ((__cxx_lvalue_12) => { const previous = __cxx_lvalue_12.value; const next = i32((previous + 1)); __cxx_lvalue_12.value = next; return previous; })(cRef(() => xxx, __cxx_lvalue_13 => { xxx = __cxx_lvalue_13; }))) {
              (yv = i32((cDeref(cPointerOffset(dc, xxx, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
              ((__cxx_lvalue_14) => { const previous = __cxx_lvalue_14.value; const next = i32((previous - 1)); __cxx_lvalue_14.value = next; return previous; })(cRef(() => j, __cxx_lvalue_15 => { j = __cxx_lvalue_15; }));
              if ((!Boolean(j))) {
                (j = i32((cDeref(cPointerOffset(lcomphsamp, 0, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
                (cr = i32((i32(((cDeref(cPointerOffset(dc2, i32((i + 64)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) >> i32((20 - 1)))) & (~1))));
                (cb = i32((i32(((cDeref(cPointerOffset(dc2, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) >> i32((20 - 1)))) & (~1))));
                ((__cxx_lvalue_16) => { const previous = __cxx_lvalue_16.value; const next = i32((previous + 1)); __cxx_lvalue_16.value = next; return previous; })(cRef(() => i, __cxx_lvalue_17 => { i = __cxx_lvalue_17; }));
              }
              ((cDeref(cPointerOffset(cTypedPointer(cSourceAddresses.decode(p), Int32Array), xxx, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((i32(((cDeref(cPointerOffset(colclipup16, (u32(i32((yv + (cDeref(cPointerOffset(crmul, i32((cr + 2048)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value)))) >>> 22), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) + (cDeref(cPointerOffset(colclipup8, (u32(i32((i32((yv + (cDeref(cPointerOffset(crmul, i32((cr + 2049)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value))) + (cDeref(cPointerOffset(cbmul, i32((cb + 2048)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value)))) >>> 22), Int32Array.BYTES_PER_ELEMENT), Int32Array).value))) + (cDeref(cPointerOffset(colclip, (u32(i32((yv + (cDeref(cPointerOffset(cbmul, i32((cb + 2049)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value)))) >>> 22), Int32Array.BYTES_PER_ELEMENT), Int32Array).value))));
            }
            (p = i64((BigInt(p) + BigInt(i64(kp_bytesperline)))));
            (dc = cPointerOffset(dc, 8, Int32Array.BYTES_PER_ELEMENT));
            if ((!Boolean(i32((i32((yyy + 1)) & i32(((cDeref(cPointerOffset(lcompvsamp, 0, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) - 1))))))) {
              (dc2 = cPointerOffset(dc2, 8, Int32Array.BYTES_PER_ELEMENT));
            }
          }
        }
      }
    }
  }
}

// C/C++ source: source/build/src/kplib.cpp:1238
export let kplib_yrbrend_func = yrbrend;
export function __cxx_global_cell_8b7adf41b928f7d45bbdef6d() {
  return __cxx_global_cell_8b7adf41b928f7d45bbdef6d.reference || (__cxx_global_cell_8b7adf41b928f7d45bbdef6d.reference = {
    __cReference: true,
    get value() { return kplib_yrbrend_func; },
    set value(__cxx_lvalue_0) { kplib_yrbrend_func = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/build/src/kplib.cpp:1248
export function kpegrend(kfilebuf, kfilength, dakpframeplace, dakpbytesperline, daxres, dayres) {
  let i, j, v, leng, xdim, ydim, index, prec, restartcnt, restartinterval, x, y, z, xx, yy, zz, dc, num, curbits, c, daval, dabits, hqval, hqbits, hqcnt, quanptr, passcnt, ghsampmax, gvsampmax, glhsampmax, glvsampmax, glhstep, glvstep, eobrun, Ss, Se, Ah, Al, Alut, dctx, dcty, ldctx, lshx, lshy, dctbuf, dctptr, ldctptr, dcs, ch, marker, dcflag, kfileptr, kfileend, __cxx_lvalue_0, __cxx_lvalue_1, __cxx_lvalue_2, __cxx_lvalue_3, __cxx_lvalue_4, __cxx_lvalue_5, __cxx_lvalue_6;



  leng = i32(0);
  xdim = i32(0);
  __cxx_lvalue_0 = cRef(() => xdim, __cxx_lvalue_8 => { xdim = i32(__cxx_lvalue_8); });
  ydim = i32(0);
  __cxx_lvalue_1 = cRef(() => ydim, __cxx_lvalue_9 => { ydim = i32(__cxx_lvalue_9); });










  dc = null;




  __cxx_lvalue_2 = cRef(() => daval, __cxx_lvalue_10 => { daval = i32(__cxx_lvalue_10); });

  __cxx_lvalue_3 = cRef(() => dabits, __cxx_lvalue_11 => { dabits = i32(__cxx_lvalue_11); });



  quanptr = null;
  passcnt = i32(0);
  ghsampmax = i32(0);
  gvsampmax = i32(0);
  glhsampmax = i32(0);
  glvsampmax = i32(0);

  __cxx_lvalue_4 = cRef(() => glhstep, __cxx_lvalue_12 => { glhstep = i32(__cxx_lvalue_12); });

  __cxx_lvalue_5 = cRef(() => glvstep, __cxx_lvalue_13 => { glvstep = i32(__cxx_lvalue_13); });


  __cxx_lvalue_6 = cRef(() => Ss, __cxx_lvalue_14 => { Ss = i32(__cxx_lvalue_14); });



  Alut = cZeroAggregate({"array": "Int32Array", "dims": [2]});
  dctx = cZeroAggregate({"array": "Int32Array", "dims": [12]});
  dcty = cZeroAggregate({"array": "Int32Array", "dims": [12]});
  ldctx = cZeroAggregate({"array": "Int32Array", "dims": [12]});
  lshx = cZeroAggregate({"array": "Int32Array", "dims": [4]});
  lshy = cZeroAggregate({"array": "Int32Array", "dims": [4]});
  dctbuf = null;
  dctptr = cZeroAggregate({"pointerArray": 12, "stride": 8});
  ldctptr = cZeroAggregate({"pointerArray": 12, "stride": 8});
  dcs = null;





  if ((!Boolean(kpeginited))) {
    (kpeginited = i32(1));
    initkpeg();
  }
  (kfileptr = cTypedPointer(kfilebuf, Uint8Array));
  (kfileend = cPointerOffset(kfileptr, kfilength, Uint8Array.BYTES_PER_ELEMENT));
  if ((i32(B_UNBUF16__header_48ae80884dfc(kfileptr)) == i32(B_PASS16__header_7269365a3bec(55551)))) {
    (kfileptr = cPointerOffset(kfileptr, 2, Uint8Array.BYTES_PER_ELEMENT));
  } else {
    return i32((-1));
  }
  (restartinterval = i32(0));
  __source_control_0: for ((i = i32(0)); (i < 4); ((__cxx_lvalue_15) => { const previous = __cxx_lvalue_15.value; const next = i32((previous + 1)); __cxx_lvalue_15.value = next; return previous; })(cRef(() => i, __cxx_lvalue_16 => { i = __cxx_lvalue_16; }))) {
    ((cDeref(cPointerOffset(lastdc, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(0));
  }
  __source_control_1: for ((i = i32(0)); (i < 8); ((__cxx_lvalue_17) => { const previous = __cxx_lvalue_17.value; const next = i32((previous + 1)); __cxx_lvalue_17.value = next; return previous; })(cRef(() => i, __cxx_lvalue_18 => { i = __cxx_lvalue_18; }))) {
    ((cDeref(cPointerOffset(hufcnt, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(0));
  }
  (kcoltype = ((u32(((u32(0) << 24) >> 24)) << 24) >> 24));
  (bitdepth = ((u32(((u32(8) << 24) >> 24)) << 24) >> 24));
  __source_control_2: do {
    (ch = (u32((cDeref(((__cxx_lvalue_19) => { const previous = __cxx_lvalue_19.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_19.value = next; return previous; })(cRef(() => kfileptr, __cxx_lvalue_20 => { kfileptr = __cxx_lvalue_20; })), Uint8Array).value)) & 255));
    if ((i32(ch) != 255)) {
      continue __source_control_2;
    }
    __source_control_3: do {
      (marker = (u32((cDeref(((__cxx_lvalue_21) => { const previous = __cxx_lvalue_21.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_21.value = next; return previous; })(cRef(() => kfileptr, __cxx_lvalue_22 => { kfileptr = __cxx_lvalue_22; })), Uint8Array).value)) & 255));
    } while ((i32(marker) == 255));
    if ((i32(marker) != 217)) {
      (leng = i32(i64((BigInt(i64((BigInt(i64((BigInt(i64((cDeref(cPointerOffset(kfileptr, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value))) << BigInt(8)))) + BigInt(i64((cDeref(cPointerOffset(kfileptr, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))))) - BigInt(i64(2))))));
      (kfileptr = cPointerOffset(kfileptr, 2, Uint8Array.BYTES_PER_ELEMENT));
    }
    __source_control_4: switch (i32(marker)) {
      case 192:
      case 193:
      case 194: {
        ((__cxx_lvalue_23) => { const previous = __cxx_lvalue_23.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_23.value = next; return previous; })(cRef(() => kfileptr, __cxx_lvalue_24 => { kfileptr = __cxx_lvalue_24; }));
      }
      (ydim = i32(B_SWAP16__header_b45431f7a004(B_UNBUF16__header_48ae80884dfc(cPointerOffset(kfileptr, 0, Uint8Array.BYTES_PER_ELEMENT)))));
      (xdim = i32(B_SWAP16__header_b45431f7a004(B_UNBUF16__header_48ae80884dfc(cPointerOffset(kfileptr, 2, Uint8Array.BYTES_PER_ELEMENT)))));
      (kp_frameplace = i64(dakpframeplace));
      (kp_bytesperline = i32(dakpbytesperline));
      (kp_xres = i32(daxres));
      (kp_yres = i32(dayres));
      (gnumcomponents = (u32((cDeref(cPointerOffset(kfileptr, 4, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
      (kfileptr = cPointerOffset(kfileptr, 5, Uint8Array.BYTES_PER_ELEMENT));
      (ghsampmax = i32((gvsampmax = i32((glhsampmax = i32((glvsampmax = i32(0))))))));
      __source_control_5: for ((z = i32(0)); (z < i32(gnumcomponents)); ((__cxx_lvalue_25) => { const previous = __cxx_lvalue_25.value; const next = i32((previous + 1)); __cxx_lvalue_25.value = next; return previous; })(cRef(() => z, __cxx_lvalue_26 => { z = __cxx_lvalue_26; }))) {
        ((cDeref(cPointerOffset(gcompid, z, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((cDeref(cPointerOffset(kfileptr, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)));
        ((cDeref(cPointerOffset(gcomphsamp, z, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((i32((cDeref(cPointerOffset(kfileptr, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) >> 4)));
        ((cDeref(cPointerOffset(gcompvsamp, z, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((i32((cDeref(cPointerOffset(kfileptr, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 15)));
        ((cDeref(cPointerOffset(gcompquantab, z, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((cDeref(cPointerOffset(kfileptr, 2, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)));
        __source_control_6: for ((i = i32(0)); (i < 8); ((__cxx_lvalue_27) => { const previous = __cxx_lvalue_27.value; const next = i32((previous + 1)); __cxx_lvalue_27.value = next; return previous; })(cRef(() => i, __cxx_lvalue_28 => { i = __cxx_lvalue_28; }))) {
          if (((cDeref(cPointerOffset(gcomphsamp, z, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) == (cDeref(cPointerOffset(pow2long, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))) {
            ((cDeref(cPointerOffset(gcomphsampshift, z, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(i));
            break __source_control_6;
          }
        }
        __source_control_7: for ((i = i32(0)); (i < 8); ((__cxx_lvalue_29) => { const previous = __cxx_lvalue_29.value; const next = i32((previous + 1)); __cxx_lvalue_29.value = next; return previous; })(cRef(() => i, __cxx_lvalue_30 => { i = __cxx_lvalue_30; }))) {
          if (((cDeref(cPointerOffset(gcompvsamp, z, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) == (cDeref(cPointerOffset(pow2long, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))) {
            ((cDeref(cPointerOffset(gcompvsampshift, z, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(i));
            break __source_control_7;
          }
        }
        if (((cDeref(cPointerOffset(gcomphsamp, z, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) > ghsampmax)) {
          (ghsampmax = i32((cDeref(cPointerOffset(gcomphsamp, z, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
          (glhsampmax = i32((cDeref(cPointerOffset(gcomphsampshift, z, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
        }
        if (((cDeref(cPointerOffset(gcompvsamp, z, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) > gvsampmax)) {
          (gvsampmax = i32((cDeref(cPointerOffset(gcompvsamp, z, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
          (glvsampmax = i32((cDeref(cPointerOffset(gcompvsampshift, z, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
        }
        (kfileptr = cPointerOffset(kfileptr, 3, Uint8Array.BYTES_PER_ELEMENT));
      }
      break __source_control_4;
      case 196: {
        __source_control_8: do {
          (ch = (u32((cDeref(((__cxx_lvalue_31) => { const previous = __cxx_lvalue_31.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_31.value = next; return previous; })(cRef(() => kfileptr, __cxx_lvalue_32 => { kfileptr = __cxx_lvalue_32; })), Uint8Array).value)) & 255));
          ((__cxx_lvalue_33) => { const previous = __cxx_lvalue_33.value; const next = i32((previous - 1)); __cxx_lvalue_33.value = next; return previous; })(cRef(() => leng, __cxx_lvalue_34 => { leng = __cxx_lvalue_34; }));
          if ((i32(ch) >= 16)) {
            (index = i32((i32(ch) - 12)));
          } else {
            (index = i32(ch));
          }
          memcpy(cPointerOffset((cPointerElementRef(hufnumatbit, index).value), 1, Uint8Array.BYTES_PER_ELEMENT), kfileptr, u64(16));
          (kfileptr = cPointerOffset(kfileptr, 16, Uint8Array.BYTES_PER_ELEMENT));
          (leng = i32((Number(leng) - Number(16))));
          (v = i32(0));
          ((cDeref(cPointerOffset(hufcnt, index, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(0));
          ((cDeref(cPointerOffset(hufquickcnt, index, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(0));
          __source_control_9: for ((i = i32(1)); (i <= 16); ((__cxx_lvalue_35) => { const previous = __cxx_lvalue_35.value; const next = i32((previous + 1)); __cxx_lvalue_35.value = next; return previous; })(cRef(() => i, __cxx_lvalue_36 => { i = __cxx_lvalue_36; }))) {
            ((cDeref(cPointerOffset((cPointerElementRef(hufmaxatbit, index).value), i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((v + i32((cDeref(cPointerOffset((cPointerElementRef(hufnumatbit, index).value), i, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))));
            ((cDeref(cPointerOffset((cPointerElementRef(hufvalatbit, index).value), i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(((cDeref(cPointerOffset(hufcnt, index, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) - v)));
            memcpy(cPointerOffset((cPointerElementRef(huftable, index).value), (cDeref(cPointerOffset(hufcnt, index, Int32Array.BYTES_PER_ELEMENT), Int32Array).value), Uint8Array.BYTES_PER_ELEMENT), kfileptr, u64(i32((cDeref(cPointerOffset((cPointerElementRef(hufnumatbit, index).value), i, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value))));
            if ((i <= 10)) {
              __source_control_10: for ((c = i32(0)); (c < i32((cDeref(cPointerOffset((cPointerElementRef(hufnumatbit, index).value), i, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value))); ((__cxx_lvalue_37) => { const previous = __cxx_lvalue_37.value; const next = i32((previous + 1)); __cxx_lvalue_37.value = next; return previous; })(cRef(() => c, __cxx_lvalue_38 => { c = __cxx_lvalue_38; }))) {
                __source_control_11: for ((j = i32((1 << i32((10 - i))))); (j > 0); ((__cxx_lvalue_39) => { const previous = __cxx_lvalue_39.value; const next = i32((previous - 1)); __cxx_lvalue_39.value = next; return previous; })(cRef(() => j, __cxx_lvalue_40 => { j = __cxx_lvalue_40; }))) {
                  ((cDeref(cPointerOffset((cPointerElementRef(hufquickval, index).value), (cDeref(cPointerOffset(hufquickcnt, index, Int32Array.BYTES_PER_ELEMENT), Int32Array).value), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((cDeref(cPointerOffset((cPointerElementRef(huftable, index).value), i32(((cDeref(cPointerOffset(hufcnt, index, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) + c)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)));
                  ((cDeref(cPointerOffset((cPointerElementRef(hufquickbits, index).value), (cDeref(cPointerOffset(hufquickcnt, index, Int32Array.BYTES_PER_ELEMENT), Int32Array).value), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(i));
                  ((__cxx_lvalue_41) => { const previous = __cxx_lvalue_41.value; const next = i32((previous + 1)); __cxx_lvalue_41.value = next; return previous; })(cDeref(cPointerOffset(hufquickcnt, index, Int32Array.BYTES_PER_ELEMENT), Int32Array));
                }
              }
            }
            (kfileptr = cPointerOffset(kfileptr, i32((cDeref(cPointerOffset((cPointerElementRef(hufnumatbit, index).value), i, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)), Uint8Array.BYTES_PER_ELEMENT));
            (leng = i32((Number(leng) - Number(i32((cDeref(cPointerOffset((cPointerElementRef(hufnumatbit, index).value), i, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value))))));
            ((__cxx_lvalue_42) => (__cxx_lvalue_42.value = i32((Number(__cxx_lvalue_42.value) + Number(i32((cDeref(cPointerOffset((cPointerElementRef(hufnumatbit, index).value), i, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))))))(cDeref(cPointerOffset(hufcnt, index, Int32Array.BYTES_PER_ELEMENT), Int32Array));
            (v = i32((i32((v + i32((cDeref(cPointerOffset((cPointerElementRef(hufnumatbit, index).value), i, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))) << 1)));
          }
        } while ((leng > 0));
      }
      break __source_control_4;
      case 219: {
        __source_control_12: do {
          (ch = (u32((cDeref(((__cxx_lvalue_43) => { const previous = __cxx_lvalue_43.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_43.value = next; return previous; })(cRef(() => kfileptr, __cxx_lvalue_44 => { kfileptr = __cxx_lvalue_44; })), Uint8Array).value)) & 255));
          ((__cxx_lvalue_45) => { const previous = __cxx_lvalue_45.value; const next = i32((previous - 1)); __cxx_lvalue_45.value = next; return previous; })(cRef(() => leng, __cxx_lvalue_46 => { leng = __cxx_lvalue_46; }));
          (index = i32((i32(ch) & 15)));
          (prec = i32((i32(ch) >> 4)));
          __source_control_13: for ((z = i32(0)); (z < 64); ((__cxx_lvalue_47) => { const previous = __cxx_lvalue_47.value; const next = i32((previous + 1)); __cxx_lvalue_47.value = next; return previous; })(cRef(() => z, __cxx_lvalue_48 => { z = __cxx_lvalue_48; }))) {
            (v = i32((cDeref(((__cxx_lvalue_49) => { const previous = __cxx_lvalue_49.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_49.value = next; return previous; })(cRef(() => kfileptr, __cxx_lvalue_50 => { kfileptr = __cxx_lvalue_50; })), Uint8Array).value)));
            if (Boolean(prec)) {
              (v = i32((i32((v << 8)) + i32((cDeref(((__cxx_lvalue_51) => { const previous = __cxx_lvalue_51.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_51.value = next; return previous; })(cRef(() => kfileptr, __cxx_lvalue_52 => { kfileptr = __cxx_lvalue_52; })), Uint8Array).value)))));
            }
            (v = i32((v << 19)));
            if (Boolean(i32(((cDeref(cPointerOffset(unzig, z, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) & 7)))) {
              (v = i32(mulshr24(v, (cDeref(cPointerOffset(cosqr16, i32(((cDeref(cPointerOffset(unzig, z, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) & 7)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value))));
            }
            if (Boolean(i32(((cDeref(cPointerOffset(unzig, z, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) >> 3)))) {
              (v = i32(mulshr24(v, (cDeref(cPointerOffset(cosqr16, i32(((cDeref(cPointerOffset(unzig, z, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) >> 3)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value))));
            }
            ((cDeref(cPointerOffset((cPointerElementRef(quantab, index).value), (cDeref(cPointerOffset(unzig, z, Int32Array.BYTES_PER_ELEMENT), Int32Array).value), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(v));
          }
          (leng = i32((Number(leng) - Number(64))));
          if (Boolean(prec)) {
            (leng = i32((Number(leng) - Number(64))));
          }
        } while ((leng > 0));
      }
      break __source_control_4;
      case 221: {
        (restartinterval = i32(B_SWAP16__header_b45431f7a004(B_UNBUF16__header_48ae80884dfc(cPointerOffset(kfileptr, 0, Uint8Array.BYTES_PER_ELEMENT)))));
      }
      (kfileptr = cPointerOffset(kfileptr, leng, Uint8Array.BYTES_PER_ELEMENT));
      break __source_control_4;
      case 218: {
        if (((xdim <= 0) || (ydim <= 0))) {
          xfree__header_dacf3b9e1753(dctbuf);
          return i32((-1));
        }
      }
      (lnumcomponents = i32((cDeref(((__cxx_lvalue_53) => { const previous = __cxx_lvalue_53.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_53.value = next; return previous; })(cRef(() => kfileptr, __cxx_lvalue_54 => { kfileptr = __cxx_lvalue_54; })), Uint8Array).value)));
      if ((!Boolean(lnumcomponents))) {
        xfree__header_dacf3b9e1753(dctbuf);
        return i32((-1));
      }
      if ((lnumcomponents > 1)) {
        (kcoltype = ((u32(((u32(2) << 24) >> 24)) << 24) >> 24));
      }
      __source_control_14: for ((z = i32(0)); (z < lnumcomponents); ((__cxx_lvalue_55) => { const previous = __cxx_lvalue_55.value; const next = i32((previous + 1)); __cxx_lvalue_55.value = next; return previous; })(cRef(() => z, __cxx_lvalue_56 => { z = __cxx_lvalue_56; }))) {
        ((cDeref(cPointerOffset(lcompid, z, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((cDeref(cPointerOffset(kfileptr, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)));
        ((cDeref(cPointerOffset(lcompdc, z, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((i32((cDeref(cPointerOffset(kfileptr, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) >> 4)));
        ((cDeref(cPointerOffset(lcompac, z, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((i32((cDeref(cPointerOffset(kfileptr, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 15)));
        (kfileptr = cPointerOffset(kfileptr, 2, Uint8Array.BYTES_PER_ELEMENT));
      }
      (Ss = i32((cDeref(cPointerOffset(kfileptr, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)));
      (Se = i32((cDeref(cPointerOffset(kfileptr, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)));
      (Ah = i32((i32((cDeref(cPointerOffset(kfileptr, 2, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) >> 4)));
      (Al = i32((i32((cDeref(cPointerOffset(kfileptr, 2, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 15)));
      (kfileptr = cPointerOffset(kfileptr, 3, Uint8Array.BYTES_PER_ELEMENT));
      if (((!Boolean(passcnt)) && (((Boolean(Ss) || (Se != 63)) || Boolean(Ah)) || Boolean(Al)))) {
        __source_control_15: for ((z = i32((zz = i32(0)))); (z < i32(gnumcomponents)); ((__cxx_lvalue_57) => { const previous = __cxx_lvalue_57.value; const next = i32((previous + 1)); __cxx_lvalue_57.value = next; return previous; })(cRef(() => z, __cxx_lvalue_58 => { z = __cxx_lvalue_58; }))) {
          ((cDeref(cPointerOffset(dctx, z, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((i32((i32((i32((xdim + i32((ghsampmax << 3)))) - 1)) >> i32((glhsampmax + 3)))) << (cDeref(cPointerOffset(gcomphsampshift, z, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))));
          ((cDeref(cPointerOffset(dcty, z, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((i32((i32((i32((ydim + i32((gvsampmax << 3)))) - 1)) >> i32((glvsampmax + 3)))) << (cDeref(cPointerOffset(gcompvsampshift, z, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))));
          (zz = i32((Number(zz) + Number(i32(Math.imul((cDeref(cPointerOffset(dctx, z, Int32Array.BYTES_PER_ELEMENT), Int32Array).value), (cDeref(cPointerOffset(dcty, z, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)))))));
        }
        (z = i32(u64((BigInt(u64(i32(Math.imul(zz, 64)))) * BigInt(2)))));
        (dctbuf = cTypedPointer(xmalloc__header_19a1c2b77820(u64(z)), Int16Array));
        if ((!dctbuf)) {
          return i32((-1));
        }
        memset(dctbuf, 0, u64(z));
        __source_control_16: for ((z = i32((zz = i32(0)))); (z < i32(gnumcomponents)); ((__cxx_lvalue_59) => { const previous = __cxx_lvalue_59.value; const next = i32((previous + 1)); __cxx_lvalue_59.value = next; return previous; })(cRef(() => z, __cxx_lvalue_60 => { z = __cxx_lvalue_60; }))) {
          ((cPointerElementRef(dctptr, z).value) = cPointerOffset(dctbuf, i32(Math.imul(zz, 64)), Int16Array.BYTES_PER_ELEMENT));
          (zz = i32((Number(zz) + Number(i32(Math.imul((cDeref(cPointerOffset(dctx, z, Int32Array.BYTES_PER_ELEMENT), Int32Array).value), (cDeref(cPointerOffset(dcty, z, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)))))));
        }
      }
      (glhstep = i32((glvstep = i32(2147483647))));
      __source_control_17: for ((z = i32(0)); (z < lnumcomponents); ((__cxx_lvalue_61) => { const previous = __cxx_lvalue_61.value; const next = i32((previous + 1)); __cxx_lvalue_61.value = next; return previous; })(cRef(() => z, __cxx_lvalue_62 => { z = __cxx_lvalue_62; }))) {
        __source_control_18: for ((zz = i32(0)); (zz < i32(gnumcomponents)); ((__cxx_lvalue_63) => { const previous = __cxx_lvalue_63.value; const next = i32((previous + 1)); __cxx_lvalue_63.value = next; return previous; })(cRef(() => zz, __cxx_lvalue_64 => { zz = __cxx_lvalue_64; }))) {
          if (((cDeref(cPointerOffset(lcompid, z, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) == (cDeref(cPointerOffset(gcompid, zz, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))) {
            ((cPointerElementRef(ldctptr, z).value) = (cPointerElementRef(dctptr, zz).value));
            ((cDeref(cPointerOffset(ldctx, z, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((cDeref(cPointerOffset(dctx, zz, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
            ((cDeref(cPointerOffset(lcomphsamp, z, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((cDeref(cPointerOffset(gcomphsamp, zz, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
            ((cDeref(cPointerOffset(lcompvsamp, z, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((cDeref(cPointerOffset(gcompvsamp, zz, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
            ((cDeref(cPointerOffset(lcompquantab, z, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((cDeref(cPointerOffset(gcompquantab, zz, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
            if ((!Boolean(z))) {
              (lcomphsampshift0 = i32((cDeref(cPointerOffset(gcomphsampshift, zz, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
              (lcompvsampshift0 = i32((cDeref(cPointerOffset(gcompvsampshift, zz, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
            }
            ((cDeref(cPointerOffset(lshx, z, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((i32((glhsampmax - (cDeref(cPointerOffset(gcomphsampshift, zz, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))) + 3)));
            ((cDeref(cPointerOffset(lshy, z, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((i32((glvsampmax - (cDeref(cPointerOffset(gcompvsampshift, zz, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))) + 3)));
            if (((cDeref(cPointerOffset(gcomphsampshift, zz, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) < glhstep)) {
              (glhstep = i32((cDeref(cPointerOffset(gcomphsampshift, zz, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
            }
            if (((cDeref(cPointerOffset(gcompvsampshift, zz, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) < glvstep)) {
              (glvstep = i32((cDeref(cPointerOffset(gcompvsampshift, zz, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
            }
          }
        }
      }
      (glhstep = i32((ghsampmax >> glhstep)));
      ((cDeref(cPointerOffset(lcomphsamp, 0, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((min__template_774131ccff66371d(cDeref(cPointerOffset(lcomphsamp, 0, Int32Array.BYTES_PER_ELEMENT), Int32Array), __cxx_lvalue_4)).value));
      (glhstep = i32((glhstep << 3)));
      (glvstep = i32((gvsampmax >> glvstep)));
      ((cDeref(cPointerOffset(lcompvsamp, 0, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((min__template_774131ccff66371d(cDeref(cPointerOffset(lcompvsamp, 0, Int32Array.BYTES_PER_ELEMENT), Int32Array), __cxx_lvalue_5)).value));
      (glvstep = i32((glvstep << 3)));
      (lcomphvsamp0 = i32(Math.imul((cDeref(cPointerOffset(lcomphsamp, 0, Int32Array.BYTES_PER_ELEMENT), Int32Array).value), (cDeref(cPointerOffset(lcompvsamp, 0, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))));
      (clipxdim = i32((min__template_774131ccff66371d(__cxx_lvalue_0, __cxx_static_address_4a3aa4f1e59b84a6f47a8d3f())).value));
      (clipydim = i32((min__template_774131ccff66371d(__cxx_lvalue_1, __cxx_static_address_9beff426ee0521384f277d04())).value));
      ((cDeref(cPointerOffset(Alut, 0, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((1 << Al)));
      ((cDeref(cPointerOffset(Alut, 1, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((-(cDeref(cPointerOffset(Alut, 0, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))));
      (restartcnt = i32(restartinterval));
      (eobrun = i32(0));
      (marker = (u32((u32(208) & 255)) & 255));
      (num = i32(0));
      (curbits = i32(0));
      __source_exit_kpegrend_break2: {
        __source_control_19: for ((y = i32(0)); (y < ydim); (y = i32((Number(y) + Number(glvstep))))) {
          __source_control_20: for ((x = i32(0)); (x < xdim); (x = i32((Number(x) + Number(glhstep))))) {
            if ((cPointerDiff(cPointerOffset(kfileptr, -(4), Uint8Array.BYTES_PER_ELEMENT), cTypedPointer(kfilebuf, Uint8Array), Uint8Array.BYTES_PER_ELEMENT) >= i64(kfilength))) {
              break __source_exit_kpegrend_break2;
            }
            if ((!dctbuf)) {
              (dc = (cPointerElementRef(dct, 0).value));
            }
            __source_control_21: for ((c = i32(0)); (c < lnumcomponents); ((__cxx_lvalue_65) => { const previous = __cxx_lvalue_65.value; const next = i32((previous + 1)); __cxx_lvalue_65.value = next; return previous; })(cRef(() => c, __cxx_lvalue_66 => { c = __cxx_lvalue_66; }))) {
              (hqval = cPointerOffset((cPointerElementRef(hufquickval, i32(((cDeref(cPointerOffset(lcompac, c, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) + 4))).value), 0, Int32Array.BYTES_PER_ELEMENT));
              (hqbits = cPointerOffset((cPointerElementRef(hufquickbits, i32(((cDeref(cPointerOffset(lcompac, c, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) + 4))).value), 0, Int32Array.BYTES_PER_ELEMENT));
              (hqcnt = i32((cDeref(cPointerOffset(hufquickcnt, i32(((cDeref(cPointerOffset(lcompac, c, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) + 4)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
              if ((!dctbuf)) {
                (quanptr = cPointerOffset((cPointerElementRef(quantab, (cDeref(cPointerOffset(lcompquantab, c, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)).value), 0, Int32Array.BYTES_PER_ELEMENT));
              }
              __source_control_22: for ((yy = i32(0)); (yy < i32(((cDeref(cPointerOffset(lcompvsamp, c, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) << 3))); (yy = i32((Number(yy) + Number(8))))) {
                __source_control_23: for ((xx = i32(0)); (xx < i32(((cDeref(cPointerOffset(lcomphsamp, c, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) << 3))); (xx = i32((Number(xx) + Number(8))))) {
                  if (dctbuf) {
                    (dcs = cPointerOffset((cPointerElementRef(ldctptr, c).value), i32((i32((i32(Math.imul(i32((i32((y + yy)) >> (cDeref(cPointerOffset(lshy, c, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))), (cDeref(cPointerOffset(ldctx, c, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))) + i32((i32((x + xx)) >> (cDeref(cPointerOffset(lshx, c, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))))) << 6)), Int16Array.BYTES_PER_ELEMENT));
                  }
                  if ((!Boolean(Ss))) {
                    __source_control_24: while ((curbits < 16)) {
                      (ch = (u32((cDeref(((__cxx_lvalue_67) => { const previous = __cxx_lvalue_67.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_67.value = next; return previous; })(cRef(() => kfileptr, __cxx_lvalue_68 => { kfileptr = __cxx_lvalue_68; })), Uint8Array).value)) & 255));
                      (num = i32((i32((num << 8)) + i32(ch))));
                      (curbits = i32((Number(curbits) + Number(8))));
                      if ((i32(ch) == 255)) {
                        ((__cxx_lvalue_69) => { const previous = __cxx_lvalue_69.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_69.value = next; return previous; })(cRef(() => kfileptr, __cxx_lvalue_70 => { kfileptr = __cxx_lvalue_70; }));
                        if (cPointerCompare(kfileptr, kfileend, ">=")) {
                          (num = i32((num << 8)));
                          (curbits = i32((Number(curbits) + Number(8))));
                        }
                      }
                    }
                    ;
                    if ((!Boolean(Ah))) {
                      (i = i32((i32((num >> i32((curbits - 10)))) & 1023)));
                      if ((i < (cDeref(cPointerOffset(hufquickcnt, (cDeref(cPointerOffset(lcompdc, c, Int32Array.BYTES_PER_ELEMENT), Int32Array).value), Int32Array.BYTES_PER_ELEMENT), Int32Array).value))) {
                        (daval = i32((cDeref(cPointerOffset((cPointerElementRef(hufquickval, (cDeref(cPointerOffset(lcompdc, c, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)).value), i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
                        (curbits = i32((Number(curbits) - Number((cDeref(cPointerOffset((cPointerElementRef(hufquickbits, (cDeref(cPointerOffset(lcompdc, c, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)).value), i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)))));
                      } else {
                        huffgetval((cDeref(cPointerOffset(lcompdc, c, Int32Array.BYTES_PER_ELEMENT), Int32Array).value), curbits, num, __cxx_lvalue_2, __cxx_lvalue_3);
                        (curbits = i32((Number(curbits) - Number(dabits))));
                      }
                      if (Boolean(daval)) {
                        __source_control_25: while ((curbits < daval)) {
                          (ch = (u32((cDeref(((__cxx_lvalue_71) => { const previous = __cxx_lvalue_71.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_71.value = next; return previous; })(cRef(() => kfileptr, __cxx_lvalue_72 => { kfileptr = __cxx_lvalue_72; })), Uint8Array).value)) & 255));
                          (num = i32((i32((num << 8)) + i32(ch))));
                          (curbits = i32((Number(curbits) + Number(8))));
                          if ((i32(ch) == 255)) {
                            ((__cxx_lvalue_73) => { const previous = __cxx_lvalue_73.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_73.value = next; return previous; })(cRef(() => kfileptr, __cxx_lvalue_74 => { kfileptr = __cxx_lvalue_74; }));
                            if (cPointerCompare(kfileptr, kfileend, ">=")) {
                              (num = i32((num << 8)));
                              (curbits = i32((Number(curbits) + Number(8))));
                            }
                          }
                        }
                        ;
                        (curbits = i32((Number(curbits) - Number(daval))));
                        (v = i32(u32(((u32(num) >>> curbits) & u32((cDeref(cPointerOffset(__cxx_private_cell_db77747fd97e714584d2217b().value, daval, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))))));
                        if ((v <= (cDeref(cPointerOffset(__cxx_private_cell_db77747fd97e714584d2217b().value, i32((daval - 1)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value))) {
                          (v = i32((Number(v) - Number((cDeref(cPointerOffset(__cxx_private_cell_db77747fd97e714584d2217b().value, daval, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)))));
                        }
                        ((__cxx_lvalue_75) => (__cxx_lvalue_75.value = i32((Number(__cxx_lvalue_75.value) + Number(v)))))(cDeref(cPointerOffset(lastdc, c, Int32Array.BYTES_PER_ELEMENT), Int32Array));
                      }
                      if ((!dctbuf)) {
                        ((cDeref(cPointerOffset(dc, 0, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((cDeref(cPointerOffset(lastdc, c, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
                      } else {
                        ((cDeref(cPointerOffset(dcs, 0, Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = ((u32(((u32(((u32(i32(((cDeref(cPointerOffset(lastdc, c, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) << Al))) << 16) >> 16)) << 16) >> 16)) << 16) >> 16));
                      }
                    } else {
                      if (Boolean(i32((num & (cDeref(cPointerOffset(pow2long, ((__cxx_lvalue_76) => { const previous = __cxx_lvalue_76.value; const next = i32((previous - 1)); __cxx_lvalue_76.value = next; return next; })(cRef(() => curbits, __cxx_lvalue_77 => { curbits = __cxx_lvalue_77; })), Int32Array.BYTES_PER_ELEMENT), Int32Array).value))))) {
                        ((__cxx_lvalue_78) => (__cxx_lvalue_78.value = ((u32((__cxx_lvalue_78.value | i32(((u32(((u32((cDeref(cPointerOffset(Alut, 0, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)) << 16) >> 16)) << 16) >> 16)))) << 16) >> 16)))(cDeref(cPointerOffset(dcs, 0, Int16Array.BYTES_PER_ELEMENT), Int16Array));
                      }
                    }
                  }
                  if ((!dctbuf)) {
                    memset(cPointerOffset(dc, 1, Int32Array.BYTES_PER_ELEMENT), 0, u64(i32(Math.imul(63, 4))));
                  }
                  (z = i32((max__template_b1cfaf2244c73238(__cxx_lvalue_6, ((__cxx_lvalue_79) => cRef(() => __cxx_lvalue_79, () => { throw new TypeError("const C++ reference write"); }))(1))).value));
                  (dcflag = (u32((u32(1) & 255)) & 255));
                  if ((eobrun <= 0)) {
                    __source_control_26: for (; (z <= Se); ((__cxx_lvalue_80) => { const previous = __cxx_lvalue_80.value; const next = i32((previous + 1)); __cxx_lvalue_80.value = next; return previous; })(cRef(() => z, __cxx_lvalue_81 => { z = __cxx_lvalue_81; }))) {
                      __source_control_27: while ((curbits < 16)) {
                        (ch = (u32((cDeref(((__cxx_lvalue_82) => { const previous = __cxx_lvalue_82.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_82.value = next; return previous; })(cRef(() => kfileptr, __cxx_lvalue_83 => { kfileptr = __cxx_lvalue_83; })), Uint8Array).value)) & 255));
                        (num = i32((i32((num << 8)) + i32(ch))));
                        (curbits = i32((Number(curbits) + Number(8))));
                        if ((i32(ch) == 255)) {
                          ((__cxx_lvalue_84) => { const previous = __cxx_lvalue_84.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_84.value = next; return previous; })(cRef(() => kfileptr, __cxx_lvalue_85 => { kfileptr = __cxx_lvalue_85; }));
                          if (cPointerCompare(kfileptr, kfileend, ">=")) {
                            (num = i32((num << 8)));
                            (curbits = i32((Number(curbits) + Number(8))));
                          }
                        }
                      }
                      ;
                      (i = i32((i32((num >> i32((curbits - 10)))) & 1023)));
                      if ((i < hqcnt)) {
                        (daval = i32((cDeref(cPointerOffset(hqval, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
                        (curbits = i32((Number(curbits) - Number((cDeref(cPointerOffset(hqbits, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)))));
                      } else {
                        huffgetval(i32(((cDeref(cPointerOffset(lcompac, c, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) + 4)), curbits, num, __cxx_lvalue_2, __cxx_lvalue_3);
                        (curbits = i32((Number(curbits) - Number(dabits))));
                      }
                      (zz = i32((daval >> 4)));
                      (daval = i32((daval & 15)));
                      if (Boolean(daval)) {
                        if (Boolean(Ah)) {
                          __source_control_28: while ((curbits < 8)) {
                            (ch = (u32((cDeref(((__cxx_lvalue_86) => { const previous = __cxx_lvalue_86.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_86.value = next; return previous; })(cRef(() => kfileptr, __cxx_lvalue_87 => { kfileptr = __cxx_lvalue_87; })), Uint8Array).value)) & 255));
                            (num = i32((i32((num << 8)) + i32(ch))));
                            (curbits = i32((Number(curbits) + Number(8))));
                            if ((i32(ch) == 255)) {
                              ((__cxx_lvalue_88) => { const previous = __cxx_lvalue_88.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_88.value = next; return previous; })(cRef(() => kfileptr, __cxx_lvalue_89 => { kfileptr = __cxx_lvalue_89; }));
                              if (cPointerCompare(kfileptr, kfileend, ">=")) {
                                (num = i32((num << 8)));
                                (curbits = i32((Number(curbits) + Number(8))));
                              }
                            }
                          }
                          ;
                          if (Boolean(i32((num & (cDeref(cPointerOffset(pow2long, ((__cxx_lvalue_90) => { const previous = __cxx_lvalue_90.value; const next = i32((previous - 1)); __cxx_lvalue_90.value = next; return next; })(cRef(() => curbits, __cxx_lvalue_91 => { curbits = __cxx_lvalue_91; })), Int32Array.BYTES_PER_ELEMENT), Int32Array).value))))) {
                            (daval = i32((cDeref(cPointerOffset(Alut, 0, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
                          } else {
                            (daval = i32((cDeref(cPointerOffset(Alut, 1, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
                          }
                        }
                      } else {
                        if ((zz < 15)) {
                          (eobrun = i32((cDeref(cPointerOffset(pow2long, zz, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
                          if (Boolean(zz)) {
                            __source_control_29: while ((curbits < zz)) {
                              (ch = (u32((cDeref(((__cxx_lvalue_92) => { const previous = __cxx_lvalue_92.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_92.value = next; return previous; })(cRef(() => kfileptr, __cxx_lvalue_93 => { kfileptr = __cxx_lvalue_93; })), Uint8Array).value)) & 255));
                              (num = i32((i32((num << 8)) + i32(ch))));
                              (curbits = i32((Number(curbits) + Number(8))));
                              if ((i32(ch) == 255)) {
                                ((__cxx_lvalue_94) => { const previous = __cxx_lvalue_94.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_94.value = next; return previous; })(cRef(() => kfileptr, __cxx_lvalue_95 => { kfileptr = __cxx_lvalue_95; }));
                                if (cPointerCompare(kfileptr, kfileend, ">=")) {
                                  (num = i32((num << 8)));
                                  (curbits = i32((Number(curbits) + Number(8))));
                                }
                              }
                            }
                            ;
                            (curbits = i32((Number(curbits) - Number(zz))));
                            (eobrun = i32((Number(eobrun) + Number(u32(((u32(num) >>> curbits) & u32((cDeref(cPointerOffset(__cxx_private_cell_db77747fd97e714584d2217b().value, zz, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))))))));
                          }
                          if ((!Boolean(Ah))) {
                            ((__cxx_lvalue_96) => { const previous = __cxx_lvalue_96.value; const next = i32((previous - 1)); __cxx_lvalue_96.value = next; return previous; })(cRef(() => eobrun, __cxx_lvalue_97 => { eobrun = __cxx_lvalue_97; }));
                          }
                          break __source_control_26;
                        }
                      }
                      if (Boolean(Ah)) {
                        __source_control_30: do {
                          if (Boolean((cDeref(cPointerOffset(dcs, z, Int16Array.BYTES_PER_ELEMENT), Int16Array).value))) {
                            __source_control_31: while ((curbits < 8)) {
                              (ch = (u32((cDeref(((__cxx_lvalue_98) => { const previous = __cxx_lvalue_98.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_98.value = next; return previous; })(cRef(() => kfileptr, __cxx_lvalue_99 => { kfileptr = __cxx_lvalue_99; })), Uint8Array).value)) & 255));
                              (num = i32((i32((num << 8)) + i32(ch))));
                              (curbits = i32((Number(curbits) + Number(8))));
                              if ((i32(ch) == 255)) {
                                ((__cxx_lvalue_100) => { const previous = __cxx_lvalue_100.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_100.value = next; return previous; })(cRef(() => kfileptr, __cxx_lvalue_101 => { kfileptr = __cxx_lvalue_101; }));
                                if (cPointerCompare(kfileptr, kfileend, ">=")) {
                                  (num = i32((num << 8)));
                                  (curbits = i32((Number(curbits) + Number(8))));
                                }
                              }
                            }
                            ;
                            if (Boolean(i32((num & (cDeref(cPointerOffset(pow2long, ((__cxx_lvalue_102) => { const previous = __cxx_lvalue_102.value; const next = i32((previous - 1)); __cxx_lvalue_102.value = next; return next; })(cRef(() => curbits, __cxx_lvalue_103 => { curbits = __cxx_lvalue_103; })), Int32Array.BYTES_PER_ELEMENT), Int32Array).value))))) {
                              ((__cxx_lvalue_104) => (__cxx_lvalue_104.value = ((u32((__cxx_lvalue_104.value + i32(((u32(((u32((cDeref(cPointerOffset(Alut, (i32((cDeref(cPointerOffset(dcs, z, Int16Array.BYTES_PER_ELEMENT), Int16Array).value)) < 0), Int32Array.BYTES_PER_ELEMENT), Int32Array).value)) << 16) >> 16)) << 16) >> 16)))) << 16) >> 16)))(cDeref(cPointerOffset(dcs, z, Int16Array.BYTES_PER_ELEMENT), Int16Array));
                            }
                          } else {
                            if ((((__cxx_lvalue_105) => { const previous = __cxx_lvalue_105.value; const next = i32((previous - 1)); __cxx_lvalue_105.value = next; return next; })(cRef(() => zz, __cxx_lvalue_106 => { zz = __cxx_lvalue_106; })) < 0)) {
                              break __source_control_30;
                            }
                          }
                          ((__cxx_lvalue_107) => { const previous = __cxx_lvalue_107.value; const next = i32((previous + 1)); __cxx_lvalue_107.value = next; return previous; })(cRef(() => z, __cxx_lvalue_108 => { z = __cxx_lvalue_108; }));
                        } while ((z <= Se));
                        if (Boolean(daval)) {
                          ((cDeref(cPointerOffset(dcs, z, Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = ((u32(((u32(((u32(daval) << 16) >> 16)) << 16) >> 16)) << 16) >> 16));
                        }
                      } else {
                        (z = i32((Number(z) + Number(zz))));
                        if ((z > Se)) {
                          break __source_control_26;
                        }
                        __source_control_32: while ((curbits < daval)) {
                          (ch = (u32((cDeref(((__cxx_lvalue_109) => { const previous = __cxx_lvalue_109.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_109.value = next; return previous; })(cRef(() => kfileptr, __cxx_lvalue_110 => { kfileptr = __cxx_lvalue_110; })), Uint8Array).value)) & 255));
                          (num = i32((i32((num << 8)) + i32(ch))));
                          (curbits = i32((Number(curbits) + Number(8))));
                          if ((i32(ch) == 255)) {
                            ((__cxx_lvalue_111) => { const previous = __cxx_lvalue_111.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_111.value = next; return previous; })(cRef(() => kfileptr, __cxx_lvalue_112 => { kfileptr = __cxx_lvalue_112; }));
                            if (cPointerCompare(kfileptr, kfileend, ">=")) {
                              (num = i32((num << 8)));
                              (curbits = i32((Number(curbits) + Number(8))));
                            }
                          }
                        }
                        ;
                        (curbits = i32((Number(curbits) - Number(daval))));
                        (v = i32(u32(((u32(num) >>> curbits) & u32((cDeref(cPointerOffset(__cxx_private_cell_db77747fd97e714584d2217b().value, daval, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))))));
                        if (((daval >= 1) && (v <= (cDeref(cPointerOffset(__cxx_private_cell_db77747fd97e714584d2217b().value, i32((daval - 1)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value)))) {
                          (v = i32((Number(v) - Number((cDeref(cPointerOffset(__cxx_private_cell_db77747fd97e714584d2217b().value, daval, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)))));
                        }
                        (dcflag = (u32((dcflag | i32((cDeref(cPointerOffset(dcflagor, z, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))) & 255));
                        if ((!dctbuf)) {
                          ((cDeref(cPointerOffset(dc, (cDeref(cPointerOffset(unzig, z, Int32Array.BYTES_PER_ELEMENT), Int32Array).value), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(v));
                        } else {
                          ((cDeref(cPointerOffset(dcs, z, Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = ((u32(((u32(((u32(i32((v << Al))) << 16) >> 16)) << 16) >> 16)) << 16) >> 16));
                        }
                      }
                    }
                  } else {
                    if ((!Boolean(Ah))) {
                      ((__cxx_lvalue_113) => { const previous = __cxx_lvalue_113.value; const next = i32((previous - 1)); __cxx_lvalue_113.value = next; return previous; })(cRef(() => eobrun, __cxx_lvalue_114 => { eobrun = __cxx_lvalue_114; }));
                    }
                  }
                  if ((Boolean(Ah) && (eobrun > 0))) {
                    ((__cxx_lvalue_115) => { const previous = __cxx_lvalue_115.value; const next = i32((previous - 1)); __cxx_lvalue_115.value = next; return previous; })(cRef(() => eobrun, __cxx_lvalue_116 => { eobrun = __cxx_lvalue_116; }));
                    __source_control_33: for (; (z <= Se); ((__cxx_lvalue_117) => { const previous = __cxx_lvalue_117.value; const next = i32((previous + 1)); __cxx_lvalue_117.value = next; return previous; })(cRef(() => z, __cxx_lvalue_118 => { z = __cxx_lvalue_118; }))) {
                      if ((!Boolean((cDeref(cPointerOffset(dcs, z, Int16Array.BYTES_PER_ELEMENT), Int16Array).value)))) {
                        continue __source_control_33;
                      }
                      __source_control_34: while ((curbits < 8)) {
                        (ch = (u32((cDeref(((__cxx_lvalue_119) => { const previous = __cxx_lvalue_119.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_119.value = next; return previous; })(cRef(() => kfileptr, __cxx_lvalue_120 => { kfileptr = __cxx_lvalue_120; })), Uint8Array).value)) & 255));
                        (num = i32((i32((num << 8)) + i32(ch))));
                        (curbits = i32((Number(curbits) + Number(8))));
                        if ((i32(ch) == 255)) {
                          ((__cxx_lvalue_121) => { const previous = __cxx_lvalue_121.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_121.value = next; return previous; })(cRef(() => kfileptr, __cxx_lvalue_122 => { kfileptr = __cxx_lvalue_122; }));
                          if (cPointerCompare(kfileptr, kfileend, ">=")) {
                            (num = i32((num << 8)));
                            (curbits = i32((Number(curbits) + Number(8))));
                          }
                        }
                      }
                      ;
                      if (Boolean(i32((num & (cDeref(cPointerOffset(pow2long, ((__cxx_lvalue_123) => { const previous = __cxx_lvalue_123.value; const next = i32((previous - 1)); __cxx_lvalue_123.value = next; return next; })(cRef(() => curbits, __cxx_lvalue_124 => { curbits = __cxx_lvalue_124; })), Int32Array.BYTES_PER_ELEMENT), Int32Array).value))))) {
                        ((__cxx_lvalue_125) => (__cxx_lvalue_125.value = ((u32((__cxx_lvalue_125.value + i32(((u32(((u32((cDeref(cPointerOffset(Alut, (i32((cDeref(cPointerOffset(dcs, z, Int16Array.BYTES_PER_ELEMENT), Int16Array).value)) < 0), Int32Array.BYTES_PER_ELEMENT), Int32Array).value)) << 16) >> 16)) << 16) >> 16)))) << 16) >> 16)))(cDeref(cPointerOffset(dcs, z, Int16Array.BYTES_PER_ELEMENT), Int16Array));
                      }
                    }
                  }
                  if ((!dctbuf)) {
                    __source_control_35: for ((z = i32((64 - 1))); (z >= 0); ((__cxx_lvalue_126) => { const previous = __cxx_lvalue_126.value; const next = i32((previous - 1)); __cxx_lvalue_126.value = next; return previous; })(cRef(() => z, __cxx_lvalue_127 => { z = __cxx_lvalue_127; }))) {
                      ((__cxx_lvalue_128) => (__cxx_lvalue_128.value = i32(Math.imul(__cxx_lvalue_128.value, (cDeref(cPointerOffset(quanptr, z, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)))))(cDeref(cPointerOffset(dc, z, Int32Array.BYTES_PER_ELEMENT), Int32Array));
                    }
                    invdct8x8(dc, dcflag);
                    (dc = cPointerOffset(dc, 64, Int32Array.BYTES_PER_ELEMENT));
                  }
                }
              }
            }
            if ((!dctbuf)) {
              kplib_yrbrend_func(x, y, cPointerOffset((cPointerElementRef(dct, 0).value), 0, Int32Array.BYTES_PER_ELEMENT));
            }
            ((__cxx_lvalue_129) => { const previous = __cxx_lvalue_129.value; const next = i32((previous - 1)); __cxx_lvalue_129.value = next; return previous; })(cRef(() => restartcnt, __cxx_lvalue_130 => { restartcnt = __cxx_lvalue_130; }));
            if ((!Boolean(restartcnt))) {
              (kfileptr = cPointerOffset(kfileptr, i32((1 - i32((curbits >> 3)))), Uint8Array.BYTES_PER_ELEMENT));
              (curbits = i32(0));
              if (((i32((cDeref(cPointerOffset(kfileptr, (-2), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) != 255) || (i32((cDeref(cPointerOffset(kfileptr, (-1), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) != i32(marker)))) {
                ((__cxx_lvalue_131) => { const previous = __cxx_lvalue_131.value; const next = cPointerOffset(previous, -1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_131.value = next; return previous; })(cRef(() => kfileptr, __cxx_lvalue_132 => { kfileptr = __cxx_lvalue_132; }));
              }
              ((__cxx_lvalue_133) => { const previous = __cxx_lvalue_133.value; const next = (u32((previous + 1)) & 255); __cxx_lvalue_133.value = next; return previous; })(cRef(() => marker, __cxx_lvalue_134 => { marker = __cxx_lvalue_134; }));
              if ((i32(marker) >= 216)) {
                (marker = (u32((u32(208) & 255)) & 255));
              }
              (restartcnt = i32(restartinterval));
              __source_control_36: for ((i = i32(0)); (i < 4); ((__cxx_lvalue_135) => { const previous = __cxx_lvalue_135.value; const next = i32((previous + 1)); __cxx_lvalue_135.value = next; return previous; })(cRef(() => i, __cxx_lvalue_136 => { i = __cxx_lvalue_136; }))) {
                ((cDeref(cPointerOffset(lastdc, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(0));
              }
              (eobrun = i32(0));
            }
          }
        }
      }
      ;
      if ((!dctbuf)) {
        return i32(0);
      }
      ((__cxx_lvalue_137) => { const previous = __cxx_lvalue_137.value; const next = i32((previous + 1)); __cxx_lvalue_137.value = next; return previous; })(cRef(() => passcnt, __cxx_lvalue_138 => { passcnt = __cxx_lvalue_138; }));
      (kfileptr = cPointerOffset(kfileptr, -(i32((i32((curbits >> 3)) + 1))), Uint8Array.BYTES_PER_ELEMENT));
      break __source_control_4;
      case 217: {
        break __source_control_4;
      }
      default: {
        (kfileptr = cPointerOffset(kfileptr, leng, Uint8Array.BYTES_PER_ELEMENT));
      }
      break __source_control_4;
    }
  } while ((cPointerDiff(kfileptr, cTypedPointer(kfilebuf, Uint8Array), Uint8Array.BYTES_PER_ELEMENT) < i64(kfilength)));
  if ((!dctbuf)) {
    return i32(0);
  }
  (lnumcomponents = i32(gnumcomponents));
  __source_control_37: for ((i = i32(0)); (i < i32(gnumcomponents)); ((__cxx_lvalue_139) => { const previous = __cxx_lvalue_139.value; const next = i32((previous + 1)); __cxx_lvalue_139.value = next; return previous; })(cRef(() => i, __cxx_lvalue_140 => { i = __cxx_lvalue_140; }))) {
    ((cDeref(cPointerOffset(lcomphsamp, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((cDeref(cPointerOffset(gcomphsamp, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
    ((__cxx_lvalue_141) => (__cxx_lvalue_141.value = i32((__cxx_lvalue_141.value << 3))))(cDeref(cPointerOffset(gcomphsamp, i, Int32Array.BYTES_PER_ELEMENT), Int32Array));
    ((cDeref(cPointerOffset(lcompvsamp, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((cDeref(cPointerOffset(gcompvsamp, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
    ((__cxx_lvalue_142) => (__cxx_lvalue_142.value = i32((__cxx_lvalue_142.value << 3))))(cDeref(cPointerOffset(gcompvsamp, i, Int32Array.BYTES_PER_ELEMENT), Int32Array));
    ((cDeref(cPointerOffset(lshx, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((i32((glhsampmax - (cDeref(cPointerOffset(gcomphsampshift, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))) + 3)));
    ((cDeref(cPointerOffset(lshy, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((i32((glvsampmax - (cDeref(cPointerOffset(gcompvsampshift, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))) + 3)));
  }
  (lcomphsampshift0 = i32((cDeref(cPointerOffset(gcomphsampshift, 0, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
  (lcompvsampshift0 = i32((cDeref(cPointerOffset(gcompvsampshift, 0, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
  (lcomphvsamp0 = i32(((cDeref(cPointerOffset(lcomphsamp, 0, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) << lcompvsampshift0)));
  __source_control_38: for ((y = i32(0)); (y < ydim); (y = i32((Number(y) + Number((cDeref(cPointerOffset(gcompvsamp, 0, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)))))) {
    __source_control_39: for ((x = i32(0)); (x < xdim); (x = i32((Number(x) + Number((cDeref(cPointerOffset(gcomphsamp, 0, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)))))) {
      (dc = (cPointerElementRef(dct, 0).value));
      __source_control_40: for ((c = i32(0)); (c < i32(gnumcomponents)); ((__cxx_lvalue_143) => { const previous = __cxx_lvalue_143.value; const next = i32((previous + 1)); __cxx_lvalue_143.value = next; return previous; })(cRef(() => c, __cxx_lvalue_144 => { c = __cxx_lvalue_144; }))) {
        __source_control_41: for ((yy = i32(0)); (yy < (cDeref(cPointerOffset(gcompvsamp, c, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)); (yy = i32((Number(yy) + Number(8))))) {
          __source_control_42: for ((xx = i32(0)); (xx < (cDeref(cPointerOffset(gcomphsamp, c, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)); ((xx = i32((Number(xx) + Number(8)))), (dc = cPointerOffset(dc, 64, Int32Array.BYTES_PER_ELEMENT)))) {
            (dcs = cPointerOffset((cPointerElementRef(dctptr, c).value), i32((i32((i32(Math.imul(i32((i32((y + yy)) >> (cDeref(cPointerOffset(lshy, c, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))), (cDeref(cPointerOffset(dctx, c, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))) + i32((i32((x + xx)) >> (cDeref(cPointerOffset(lshx, c, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))))) << 6)), Int16Array.BYTES_PER_ELEMENT));
            (quanptr = cPointerOffset((cPointerElementRef(quantab, (cDeref(cPointerOffset(gcompquantab, c, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)).value), 0, Int32Array.BYTES_PER_ELEMENT));
            __source_control_43: for ((z = i32(0)); (z < 64); ((__cxx_lvalue_145) => { const previous = __cxx_lvalue_145.value; const next = i32((previous + 1)); __cxx_lvalue_145.value = next; return previous; })(cRef(() => z, __cxx_lvalue_146 => { z = __cxx_lvalue_146; }))) {
              ((cDeref(cPointerOffset(dc, z, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(Math.imul(i32((cDeref(cPointerOffset(dcs, (cDeref(cPointerOffset(zigit, z, Int32Array.BYTES_PER_ELEMENT), Int32Array).value), Int16Array.BYTES_PER_ELEMENT), Int16Array).value)), (cDeref(cPointerOffset(quanptr, z, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))));
            }
            invdct8x8(dc, (u32(255) & 255));
          }
        }
      }
      kplib_yrbrend_func(x, y, cPointerOffset((cPointerElementRef(dct, 0).value), 0, Int32Array.BYTES_PER_ELEMENT));
    }
  }
  xfree__header_dacf3b9e1753(dctbuf);
  return i32(0);
}

// C/C++ source: source/build/src/kplib.cpp:1616
export let suffix = new Uint8Array(4100);
function __cxx_static_address_5bb6bf4bbc8a6745b513c303() {
  return __cxx_static_address_5bb6bf4bbc8a6745b513c303.reference || (__cxx_static_address_5bb6bf4bbc8a6745b513c303.reference = {
    __cReference: true,
    get value() { return suffix; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_5bb6bf4bbc8a6745b513c303() { return __cxx_static_address_5bb6bf4bbc8a6745b513c303(); }

export let filbuffer = new Uint8Array(768);
function __cxx_static_address_8f56da9eaab99d5c387644a3() {
  return __cxx_static_address_8f56da9eaab99d5c387644a3.reference || (__cxx_static_address_8f56da9eaab99d5c387644a3.reference = {
    __cReference: true,
    get value() { return filbuffer; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_8f56da9eaab99d5c387644a3() { return __cxx_static_address_8f56da9eaab99d5c387644a3(); }

export let tempstack = new Uint8Array(4096);
function __cxx_static_address_7b9818068a7d8c5283404107() {
  return __cxx_static_address_7b9818068a7d8c5283404107.reference || (__cxx_static_address_7b9818068a7d8c5283404107.reference = {
    __cReference: true,
    get value() { return tempstack; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_7b9818068a7d8c5283404107() { return __cxx_static_address_7b9818068a7d8c5283404107(); }

// C/C++ source: source/build/src/kplib.cpp:1617
export let prefix = new Int32Array(4100);
function __cxx_static_address_9160c75e0ea21ef79a69d2b9() {
  return __cxx_static_address_9160c75e0ea21ef79a69d2b9.reference || (__cxx_static_address_9160c75e0ea21ef79a69d2b9.reference = {
    __cReference: true,
    get value() { return prefix; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_9160c75e0ea21ef79a69d2b9() { return __cxx_static_address_9160c75e0ea21ef79a69d2b9(); }

// C/C++ source: source/build/src/kplib.cpp:1619
export function kgifrend(kfilebuf, kfilelength, dakpframeplace, dakpbytesperline, daxres, dayres) {
  let i;
  let x;
  let y;
  let xsiz;
  let ysiz;
  let yinc;
  let xend;
  let xspan;
  let yspan;
  let currstr;
  let numbitgoal;
  let lzcols;
  let dat;
  let blocklen;
  let bitcnt;
  let xoff;
  let transcol;
  let yoff;
  let numbits;
  let startnumbits;
  let chunkind;
  let ilacefirst;
  let ptr;
  let cptr = null;
  let daglobxoffs = i32(0);
  let daglobyoffs = i32(0);
  (kfilelength = i32(kfilelength));
  (kcoltype = ((u32(((u32(3) << 24) >> 24)) << 24) >> 24));
  (bitdepth = ((u32(((u32(8) << 24) >> 24)) << 24) >> 24));
  if ((((i32((cDeref(cPointerOffset(kfilebuf, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) != i32(71)) || (i32((cDeref(cPointerOffset(kfilebuf, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) != i32(73))) || (i32((cDeref(cPointerOffset(kfilebuf, 2, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) != i32(70)))) {
    return i32((-1));
  }
  (paleng = i32((1 << i32((i32((i32((cDeref(cPointerOffset(kfilebuf, 10, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 7)) + 1)))));
  (ptr = cTypedPointer(cPointerOffset(kfilebuf, 13, Uint8Array.BYTES_PER_ELEMENT), Uint8Array));
  if (Boolean(i32((i32((cDeref(cPointerOffset(kfilebuf, 10, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 128)))) {
    (cptr = ptr);
    (ptr = cPointerOffset(ptr, i32(Math.imul(paleng, 3)), Uint8Array.BYTES_PER_ELEMENT));
  }
  (transcol = i32((-1)));
  while ((i32((chunkind = (u32((u32((cDeref(((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_0.value = next; return previous; })(cRef(() => ptr, __cxx_lvalue_1 => { ptr = __cxx_lvalue_1; })), Uint8Array).value)) & 255)) & 255))) == i32(33))) {
    if ((i32((cDeref(cPointerOffset(ptr, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == 249)) {
      if (Boolean(i32((i32((cDeref(cPointerOffset(ptr, 2, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 1)))) {
        (transcol = i32((u32((cDeref(cPointerOffset(ptr, 5, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255)));
      }
    }
    ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_2.value = next; return previous; })(cRef(() => ptr, __cxx_lvalue_3 => { ptr = __cxx_lvalue_3; }));
    do {
      (i = i32((cDeref(((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_4.value = next; return previous; })(cRef(() => ptr, __cxx_lvalue_5 => { ptr = __cxx_lvalue_5; })), Uint8Array).value)));
      (ptr = cPointerOffset(ptr, i, Uint8Array.BYTES_PER_ELEMENT));
    } while (Boolean(i));
  }
  if ((i32(chunkind) != i32(44))) {
    return i32((-1));
  }
  (xoff = i32(B_PASS16__header_15ea0d7111ad(B_UNBUF16__header_48ae80884dfc(cPointerOffset(ptr, 0, Uint8Array.BYTES_PER_ELEMENT)))));
  (yoff = i64(B_PASS16__header_15ea0d7111ad(B_UNBUF16__header_48ae80884dfc(cPointerOffset(ptr, 2, Uint8Array.BYTES_PER_ELEMENT)))));
  (xspan = i32(B_PASS16__header_15ea0d7111ad(B_UNBUF16__header_48ae80884dfc(cPointerOffset(ptr, 4, Uint8Array.BYTES_PER_ELEMENT)))));
  (yspan = i32(B_PASS16__header_15ea0d7111ad(B_UNBUF16__header_48ae80884dfc(cPointerOffset(ptr, 6, Uint8Array.BYTES_PER_ELEMENT)))));
  (ptr = cPointerOffset(ptr, 9, Uint8Array.BYTES_PER_ELEMENT));
  if (Boolean(i32((i32((cDeref(cPointerOffset(ptr, (-1), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 64)))) {
    (yinc = i32(8));
    (ilacefirst = (u32((u32(1) & 255)) & 255));
  } else {
    (yinc = i32(1));
    (ilacefirst = (u32((u32(0) & 255)) & 255));
  }
  if (Boolean(i32((i32((cDeref(cPointerOffset(ptr, (-1), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 128)))) {
    (paleng = i32((1 << i32((i32((i32((cDeref(cPointerOffset(ptr, (-1), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 7)) + 1)))));
    (cptr = ptr);
    (ptr = cPointerOffset(ptr, i32(Math.imul(paleng, 3)), Uint8Array.BYTES_PER_ELEMENT));
  }
  for ((i = i32(0)); (i < paleng); ((__cxx_lvalue_6) => { const previous = __cxx_lvalue_6.value; const next = i32((previous + 1)); __cxx_lvalue_6.value = next; return previous; })(cRef(() => i, __cxx_lvalue_7 => { i = __cxx_lvalue_7; }))) {
    ((cDeref(cPointerOffset(palcol, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(B_PASS32__header_8a7178a88765(u32((u32(i32((i32((i32((i32((cDeref(cPointerOffset(cptr, i32(Math.imul(i, 3)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) << 16)) + i32((i32((cDeref(cPointerOffset(cptr, i32((i32(Math.imul(i, 3)) + 1)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) << 8)))) + i32((cDeref(cPointerOffset(cptr, i32((i32(Math.imul(i, 3)) + 2)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value))))) + 4278190080)))));
  }
  for (; (i < 256); ((__cxx_lvalue_8) => { const previous = __cxx_lvalue_8.value; const next = i32((previous + 1)); __cxx_lvalue_8.value = next; return previous; })(cRef(() => i, __cxx_lvalue_9 => { i = __cxx_lvalue_9; }))) {
    ((cDeref(cPointerOffset(palcol, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(B_PASS32__header_8a7178a88765(4278190080)));
  }
  if ((transcol >= 0)) {
    ((__cxx_lvalue_10) => (__cxx_lvalue_10.value = i32((__cxx_lvalue_10.value & B_PASS32__header_8a7178a88765((~4278190080))))))(cDeref(cPointerOffset(palcol, transcol, Int32Array.BYTES_PER_ELEMENT), Int32Array));
  }
  (xsiz = i32(B_PASS16__header_15ea0d7111ad(B_UNBUF16__header_48ae80884dfc(cPointerOffset(kfilebuf, 6, Uint8Array.BYTES_PER_ELEMENT)))));
  (ysiz = i32(B_PASS16__header_15ea0d7111ad(B_UNBUF16__header_48ae80884dfc(cPointerOffset(kfilebuf, 8, Uint8Array.BYTES_PER_ELEMENT)))));
  if (((((xoff != 0) || (yoff != i64(0))) || (xsiz != xspan)) || (ysiz != yspan))) {
    (daglobxoffs = i32((Number(daglobxoffs) + Number(xoff))));
    (daglobyoffs = i32((Number(daglobyoffs) + Number(yoff))));
  }
  (xspan = i32((Number(xspan) + Number(daglobxoffs))));
  (yspan = i32((Number(yspan) + Number(daglobyoffs))));
  (y = i32(daglobyoffs));
  if ((u32(y) < u32(dayres))) {
    (yoff = i64((BigInt(i64(i32(Math.imul(y, dakpbytesperline)))) + BigInt(dakpframeplace))));
    (x = i32(daglobxoffs));
    (xend = i32(xspan));
  } else {
    (x = i32(u32((u32(daglobxoffs) + 2147483648))));
    (xend = i32(u32((u32(xspan) + 2147483648))));
  }
  (lzcols = i32((1 << i32((cDeref(ptr, Uint8Array).value)))));
  (startnumbits = (u32((u32((u32((u32(i32((i32((cDeref(ptr, Uint8Array).value)) + 1))) & 255)) & 255)) & 255)) & 255));
  ((__cxx_lvalue_11) => { const previous = __cxx_lvalue_11.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_11.value = next; return previous; })(cRef(() => ptr, __cxx_lvalue_12 => { ptr = __cxx_lvalue_12; }));
  for ((i = i32((lzcols - 1))); (i >= 0); ((__cxx_lvalue_13) => { const previous = __cxx_lvalue_13.value; const next = i32((previous - 1)); __cxx_lvalue_13.value = next; return previous; })(cRef(() => i, __cxx_lvalue_14 => { i = __cxx_lvalue_14; }))) {
    ((cDeref(cPointerOffset(suffix, i, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32((u32(((cDeref(cPointerOffset(prefix, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(i))) & 255)) & 255)) & 255));
  }
  (currstr = i32((lzcols + 2)));
  (numbits = (u32(startnumbits) & 255));
  (numbitgoal = i32((lzcols << 1)));
  (blocklen = i32((cDeref(((__cxx_lvalue_15) => { const previous = __cxx_lvalue_15.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_15.value = next; return previous; })(cRef(() => ptr, __cxx_lvalue_16 => { ptr = __cxx_lvalue_16; })), Uint8Array).value)));
  memcpy(filbuffer, ptr, u64(blocklen));
  (ptr = cPointerOffset(ptr, blocklen, Uint8Array.BYTES_PER_ELEMENT));
  (bitcnt = i32(0));
  while (Boolean(1)) {
    (dat = i32(u32(((B_PASS32__header_8a7178a88765(B_UNBUF32__header_c1468ac058f1(cPointerOffset(filbuffer, i32((bitcnt >> 3)), Uint8Array.BYTES_PER_ELEMENT))) >>> i32((bitcnt & 7))) & u32(i32((numbitgoal - 1)))))));
    (bitcnt = i32((Number(bitcnt) + Number(i32(numbits)))));
    if ((i32((bitcnt >> 3)) > i32((blocklen - 3)))) {
      B_BUF16__header_3391c2afcc82(filbuffer, B_UNBUF16__header_48ae80884dfc(cPointerOffset(filbuffer, i32((bitcnt >> 3)), Uint8Array.BYTES_PER_ELEMENT)));
      (i = i32((blocklen - i32((bitcnt >> 3)))));
      (blocklen = i32((cDeref(((__cxx_lvalue_17) => { const previous = __cxx_lvalue_17.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_17.value = next; return previous; })(cRef(() => ptr, __cxx_lvalue_18 => { ptr = __cxx_lvalue_18; })), Uint8Array).value)));
      memcpy(cPointerOffset(filbuffer, i, Uint8Array.BYTES_PER_ELEMENT), ptr, u64(blocklen));
      (ptr = cPointerOffset(ptr, blocklen, Uint8Array.BYTES_PER_ELEMENT));
      (bitcnt = i32((bitcnt & 7)));
      (blocklen = i32((Number(blocklen) + Number(i))));
    }
    if ((dat == lzcols)) {
      (currstr = i32((lzcols + 2)));
      (numbits = (u32(startnumbits) & 255));
      (numbitgoal = i32((lzcols << 1)));
      continue;
    }
    if (((currstr == numbitgoal) && (i32(numbits) < 12))) {
      ((__cxx_lvalue_19) => { const previous = __cxx_lvalue_19.value; const next = (u32((previous + 1)) & 255); __cxx_lvalue_19.value = next; return previous; })(cRef(() => numbits, __cxx_lvalue_20 => { numbits = __cxx_lvalue_20; }));
      (numbitgoal = i32((numbitgoal << 1)));
    }
    ((cDeref(cPointerOffset(prefix, currstr, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(dat));
    for ((i = i32(0)); (dat >= lzcols); (dat = i32((cDeref(cPointerOffset(prefix, dat, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)))) {
      ((cDeref(cPointerOffset(tempstack, ((__cxx_lvalue_21) => { const previous = __cxx_lvalue_21.value; const next = i32((previous + 1)); __cxx_lvalue_21.value = next; return previous; })(cRef(() => i, __cxx_lvalue_22 => { i = __cxx_lvalue_22; })), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((cDeref(cPointerOffset(suffix, dat, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
    }
    ((cDeref(cPointerOffset(tempstack, i, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32((u32((cDeref(cPointerOffset(prefix, dat, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)) & 255)) & 255)) & 255));
    ((cDeref(cPointerOffset(suffix, i32((currstr - 1)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32(((cDeref(cPointerOffset(suffix, currstr, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32((u32(dat) & 255)) & 255)) & 255))) & 255));
    for (; (i >= 0); ((__cxx_lvalue_23) => { const previous = __cxx_lvalue_23.value; const next = i32((previous - 1)); __cxx_lvalue_23.value = next; return previous; })(cRef(() => i, __cxx_lvalue_24 => { i = __cxx_lvalue_24; }))) {
      if ((u32(x) < u32(daxres))) {
        B_BUF32__header_5d2f345cbe77(cSourceAddresses.decode(i64((BigInt(yoff) + BigInt(i64(i32((x << 2))))))), u32((cDeref(cPointerOffset(palcol, i32((cDeref(cPointerOffset(tempstack, i, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
      }
      ((__cxx_lvalue_25) => { const previous = __cxx_lvalue_25.value; const next = i32((previous + 1)); __cxx_lvalue_25.value = next; return previous; })(cRef(() => x, __cxx_lvalue_26 => { x = __cxx_lvalue_26; }));
      if ((x == xend)) {
        (y = i32((Number(y) + Number(yinc))));
        if ((y >= yspan)) {
          switch (yinc) {
            case 8: {
              if ((!Boolean(ilacefirst))) {
                (y = i32((daglobyoffs + 2)));
                (yinc = i32(4));
                break;
              }
            }
            (ilacefirst = (u32((u32(0) & 255)) & 255));
            (y = i32((daglobyoffs + 4)));
            (yinc = i32(8));
            break;
            case 4: {
              (y = i32((daglobyoffs + 1)));
            }
            (yinc = i32(2));
            break;
            case 2:
            case 1: {
              return i32(0);
            }
          }
        }
        if ((u32(y) < u32(dayres))) {
          (yoff = i64((BigInt(i64(i32(Math.imul(y, dakpbytesperline)))) + BigInt(dakpframeplace))));
          (x = i32(daglobxoffs));
          (xend = i32(xspan));
        } else {
          (x = i32(u32((u32(daglobxoffs) + 2147483648))));
          (xend = i32(u32((u32(xspan) + 2147483648))));
        }
      }
    }
    ((__cxx_lvalue_27) => { const previous = __cxx_lvalue_27.value; const next = i32((previous + 1)); __cxx_lvalue_27.value = next; return previous; })(cRef(() => currstr, __cxx_lvalue_28 => { currstr = __cxx_lvalue_28; }));
  }
}

// C/C++ source: source/build/src/kplib.cpp:1785
export function ktgarend(header, fleng, dakpframeplace, dakpbytesperline, daxres, dayres) {
  let i = i32(0);
  let x;
  let y;
  let pi;
  let xi;
  let yi;
  let x0;
  let x1;
  let y0;
  let y1;
  let xsiz;
  let ysiz;
  let rlestat;
  let colbyte;
  let pixbyte;
  let p;
  let fptr;
  let cptr = null;
  let nptr;
  if (((fleng < 19) || Boolean(i32((i32((cDeref(cPointerOffset(header, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 254))))) {
    return i32((-1));
  }
  if (((i32((cDeref(cPointerOffset(header, 2, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) >= 12) || (!Boolean(i32((i32((1 << i32((cDeref(cPointerOffset(header, 2, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))) & 3598)))))) {
    return i32((-1));
  }
  if (((Boolean(i32((i32((cDeref(cPointerOffset(header, 16, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 7))) || (i32((cDeref(cPointerOffset(header, 16, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == 0)) || (i32((cDeref(cPointerOffset(header, 16, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) > 32))) {
    return i32((-1));
  }
  if (Boolean(i32((i32((cDeref(cPointerOffset(header, 17, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 192)))) {
    return i32((-1));
  }
  (fptr = cTypedPointer(cPointerOffset(header, i32((i32((cDeref(cPointerOffset(header, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) + 18)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array));
  (xsiz = i32(B_PASS16__header_15ea0d7111ad(B_UNBUF16__header_48ae80884dfc(cPointerOffset(header, 12, Uint8Array.BYTES_PER_ELEMENT)))));
  if ((xsiz <= 0)) {
    return i32((-1));
  }
  (ysiz = i32(B_PASS16__header_15ea0d7111ad(B_UNBUF16__header_48ae80884dfc(cPointerOffset(header, 14, Uint8Array.BYTES_PER_ELEMENT)))));
  if ((ysiz <= 0)) {
    return i32((-1));
  }
  (colbyte = i32((i32((i32((cDeref(cPointerOffset(header, 16, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) + 7)) >> 3)));
  if ((i32((cDeref(cPointerOffset(header, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == 1)) {
    (pixbyte = i32((i32((i32((cDeref(cPointerOffset(header, 7, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) + 7)) >> 3)));
    (cptr = cPointerOffset(fptr, i32(Math.imul((-i32(B_PASS16__header_15ea0d7111ad(B_UNBUF16__header_48ae80884dfc(cPointerOffset(header, 3, Uint8Array.BYTES_PER_ELEMENT))))), pixbyte)), Uint8Array.BYTES_PER_ELEMENT));
    (fptr = cPointerOffset(fptr, i32(Math.imul(i32(B_PASS16__header_15ea0d7111ad(B_UNBUF16__header_48ae80884dfc(cPointerOffset(header, 5, Uint8Array.BYTES_PER_ELEMENT)))), pixbyte)), Uint8Array.BYTES_PER_ELEMENT));
  } else {
    (pixbyte = i32(colbyte));
  }
  switch (pixbyte) {
    case 1: {
      (kcoltype = ((u32(((u32(0) << 24) >> 24)) << 24) >> 24));
    }
    (bitdepth = ((u32(((u32(8) << 24) >> 24)) << 24) >> 24));
    ((cDeref(cPointerOffset(palcol, 0, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(B_PASS32__header_8a7178a88765(4278190080)));
    for ((i = i32(1)); (i < 256); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; }))) {
      ((cDeref(cPointerOffset(palcol, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(((cDeref(cPointerOffset(palcol, i32((i - 1)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) + B_PASS32__header_08503142e865(65793))));
    }
    break;
    case 2:
    case 3: {
      (kcoltype = ((u32(((u32(2) << 24) >> 24)) << 24) >> 24));
    }
    break;
    case 4: {
      (kcoltype = ((u32(((u32(6) << 24) >> 24)) << 24) >> 24));
    }
    break;
  }
  if ((!Boolean(i32((i32((cDeref(cPointerOffset(header, 17, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 16))))) {
    (x0 = i32(0));
    (x1 = i32(xsiz));
    (xi = i32(1));
  } else {
    (x0 = i32((xsiz - 1)));
    (x1 = i32((-1)));
    (xi = i32((-1)));
  }
  if (Boolean(i32((i32((cDeref(cPointerOffset(header, 17, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 32)))) {
    (y0 = i32(0));
    (y1 = i32(ysiz));
    (yi = i32(1));
    (pi = i32(dakpbytesperline));
  } else {
    (y0 = i32((ysiz - 1)));
    (y1 = i32((-1)));
    (yi = i32((-1)));
    (pi = i32((-dakpbytesperline)));
  }
  if ((i32((cDeref(cPointerOffset(header, 2, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) < 8)) {
    (rlestat = i32((-2)));
  } else {
    (rlestat = i32((-1)));
  }
  (p = i64((BigInt(i64(i32(Math.imul(y0, dakpbytesperline)))) + BigInt(dakpframeplace))));
  for ((y = i32(y0)); (y != y1); ((y = i32((Number(y) + Number(yi)))), (p = i64((BigInt(p) + BigInt(i64(pi))))))) {
    for ((x = i32(x0)); (x != x1); (x = i32((Number(x) + Number(xi))))) {
      if ((rlestat < 128)) {
        if ((i32((rlestat & 127)) == 127)) {
          (rlestat = i32((cDeref(cPointerOffset(fptr, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)));
          ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_2.value = next; return previous; })(cRef(() => fptr, __cxx_lvalue_3 => { fptr = __cxx_lvalue_3; }));
        }
        if ((i32((cDeref(cPointerOffset(header, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == 1)) {
          if ((colbyte == 1)) {
            (i = i32((cDeref(cPointerOffset(fptr, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)));
          } else {
            (i = i32(B_PASS16__header_15ea0d7111ad(B_UNBUF16__header_48ae80884dfc(cPointerOffset(fptr, 0, Uint8Array.BYTES_PER_ELEMENT)))));
          }
          (nptr = cPointerOffset(cptr, i32(Math.imul(i, pixbyte)), Uint8Array.BYTES_PER_ELEMENT));
        } else {
          (nptr = fptr);
        }
        switch (pixbyte) {
          case 1: {
            (i = i32((cDeref(cPointerOffset(palcol, i32((cDeref(cPointerOffset(nptr, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
          }
          break;
          case 2: {
            (i = i32(B_PASS16__header_15ea0d7111ad(B_UNBUF16__header_48ae80884dfc(cPointerOffset(nptr, 0, Uint8Array.BYTES_PER_ELEMENT)))));
          }
          (i = i32(B_PASS32__header_8a7178a88765(u32((u32(i32((i32((i32((i32((i & 31744)) << 9)) + i32((i32((i & 992)) << 6)))) + i32((i32((i & 31)) << 3))))) + 4278190080)))));
          break;
          case 3: {
            (i = i32(u32((B_UNBUF32__header_c1468ac058f1(cPointerOffset(nptr, 0, Uint8Array.BYTES_PER_ELEMENT)) | B_PASS32__header_8a7178a88765(4278190080)))));
          }
          break;
          case 4: {
            (i = i32(B_UNBUF32__header_c1468ac058f1(cPointerOffset(nptr, 0, Uint8Array.BYTES_PER_ELEMENT))));
          }
          break;
        }
        (fptr = cPointerOffset(fptr, colbyte, Uint8Array.BYTES_PER_ELEMENT));
      }
      if ((rlestat >= 0)) {
        ((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = i32((previous - 1)); __cxx_lvalue_4.value = next; return previous; })(cRef(() => rlestat, __cxx_lvalue_5 => { rlestat = __cxx_lvalue_5; }));
      }
      if (((u32(x) < u32(daxres)) && (u32(y) < u32(dayres)))) {
        B_BUF32__header_5d2f345cbe77(cSourceAddresses.decode(i64((BigInt(i64(i32(Math.imul(x, 4)))) + BigInt(p)))), u32(i));
      }
    }
  }
  return i32(0);
}

// C/C++ source: source/build/src/kplib.cpp:1885
export function kbmprend(buf, fleng, dakpframeplace, dakpbytesperline, daxres, dayres) {
  let i;
  let j;
  let x;
  let y;
  let x0;
  let x1;
  let y0;
  let y1;
  let rastoff;
  let headsiz;
  let xsiz;
  let ysiz;
  let cdim;
  let comp;
  let cptrinc;
  let lptr;
  let cptr;
  (fleng = i32(fleng));
  (headsiz = i32(B_UNBUF32__header_c1468ac058f1(cPointerOffset(buf, 14, Uint8Array.BYTES_PER_ELEMENT))));
  if ((headsiz == B_PASS32__header_08503142e865(12))) {
    if ((i32(B_UNBUF16__header_48ae80884dfc(cPointerOffset(buf, 22, Uint8Array.BYTES_PER_ELEMENT))) != i32(B_PASS16__header_c2d8d3cb4508(1)))) {
      return i32((-1));
    }
    (xsiz = i32(B_PASS16__header_15ea0d7111ad(B_UNBUF16__header_48ae80884dfc(cPointerOffset(buf, 18, Uint8Array.BYTES_PER_ELEMENT)))));
    (ysiz = i32(B_PASS16__header_15ea0d7111ad(B_UNBUF16__header_48ae80884dfc(cPointerOffset(buf, 20, Uint8Array.BYTES_PER_ELEMENT)))));
    (cdim = i32(B_PASS16__header_15ea0d7111ad(B_UNBUF16__header_48ae80884dfc(cPointerOffset(buf, 24, Uint8Array.BYTES_PER_ELEMENT)))));
    (comp = i32(0));
  } else {
    if ((i32(B_UNBUF16__header_48ae80884dfc(cPointerOffset(buf, 26, Uint8Array.BYTES_PER_ELEMENT))) != i32(B_PASS16__header_c2d8d3cb4508(1)))) {
      return i32((-1));
    }
    (xsiz = i32(B_PASS32__header_8a7178a88765(B_UNBUF32__header_c1468ac058f1(cPointerOffset(buf, 18, Uint8Array.BYTES_PER_ELEMENT)))));
    (ysiz = i32(B_PASS32__header_8a7178a88765(B_UNBUF32__header_c1468ac058f1(cPointerOffset(buf, 22, Uint8Array.BYTES_PER_ELEMENT)))));
    (cdim = i32(B_PASS16__header_15ea0d7111ad(B_UNBUF16__header_48ae80884dfc(cPointerOffset(buf, 28, Uint8Array.BYTES_PER_ELEMENT)))));
    (comp = i32(B_PASS32__header_8a7178a88765(B_UNBUF32__header_c1468ac058f1(cPointerOffset(buf, 30, Uint8Array.BYTES_PER_ELEMENT)))));
  }
  if (((xsiz <= 0) || (!Boolean(ysiz)))) {
    return i32((-1));
  }
  if (((u32(i32((cdim - 1))) >= u32(32)) || (!Boolean(i32((i32((1 << cdim)) & 16843027)))))) {
    return i32((-1));
  }
  if (((comp != 0) && (comp != 3))) {
    return i32((-1));
  }
  (rastoff = i32(B_PASS32__header_8a7178a88765(B_UNBUF32__header_c1468ac058f1(cPointerOffset(buf, 10, Uint8Array.BYTES_PER_ELEMENT)))));
  if ((cdim < 16)) {
    if ((cdim == 2)) {
      ((cDeref(cPointerOffset(palcol, 0, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(4294967295));
      ((cDeref(cPointerOffset(palcol, 1, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(B_PASS32__header_8a7178a88765(4278190080)));
    }
    if ((headsiz == B_PASS32__header_08503142e865(12))) {
      (j = i32(3));
    } else {
      (j = i32(4));
    }
    for (((i = i32(0)), (cptr = cPointerOffset(buf, i32((headsiz + 14)), Uint8Array.BYTES_PER_ELEMENT))); cPointerCompare(cptr, cPointerOffset(buf, rastoff, Uint8Array.BYTES_PER_ELEMENT), "<"); (((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; })), (cptr = cPointerOffset(cptr, j, Uint8Array.BYTES_PER_ELEMENT)))) {
      ((cDeref(cPointerOffset(palcol, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(u32((B_UNBUF32__header_c1468ac058f1(cPointerOffset(cptr, 0, Uint8Array.BYTES_PER_ELEMENT)) | B_PASS32__header_8a7178a88765(4278190080)))));
    }
    (kcoltype = ((u32(((u32(3) << 24) >> 24)) << 24) >> 24));
    (bitdepth = ((u32(((u32(((u32(cdim) << 24) >> 24)) << 24) >> 24)) << 24) >> 24));
    (paleng = i32(i));
  } else {
    if ((!Boolean(i32((cdim & 15))))) {
      (kcoltype = ((u32(((u32(2) << 24) >> 24)) << 24) >> 24));
      switch (cdim) {
        case 16: {
          ((cDeref(cPointerOffset(palcol, 0, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(10));
        }
        ((cDeref(cPointerOffset(palcol, 1, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(5));
        ((cDeref(cPointerOffset(palcol, 2, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(0));
        ((cDeref(cPointerOffset(palcol, 3, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(5));
        ((cDeref(cPointerOffset(palcol, 4, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(5));
        ((cDeref(cPointerOffset(palcol, 5, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(5));
        break;
        case 32: {
          ((cDeref(cPointerOffset(palcol, 0, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(16));
        }
        ((cDeref(cPointerOffset(palcol, 1, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(8));
        ((cDeref(cPointerOffset(palcol, 2, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(0));
        ((cDeref(cPointerOffset(palcol, 3, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(8));
        ((cDeref(cPointerOffset(palcol, 4, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(8));
        ((cDeref(cPointerOffset(palcol, 5, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(8));
        break;
      }
      if ((comp == 3)) {
        for ((i = i32(0)); (i < 3); ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i32((previous + 1)); __cxx_lvalue_2.value = next; return previous; })(cRef(() => i, __cxx_lvalue_3 => { i = __cxx_lvalue_3; }))) {
          (j = i32(B_UNBUF32__header_c1468ac058f1(cPointerOffset(buf, i32((i32((headsiz + i32((i << 2)))) + 14)), Uint8Array.BYTES_PER_ELEMENT))));
          for (((cDeref(cPointerOffset(palcol, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(0)); ((cDeref(cPointerOffset(palcol, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) < 32); ((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = i32((previous + 1)); __cxx_lvalue_4.value = next; return previous; })(cDeref(cPointerOffset(palcol, i, Int32Array.BYTES_PER_ELEMENT), Int32Array))) {
            if (Boolean(i32((j & 1)))) {
              break;
            }
            (j = i32((u32(j) >>> 1)));
          }
          for (((cDeref(cPointerOffset(palcol, i32((i + 3)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(0)); ((cDeref(cPointerOffset(palcol, i32((i + 3)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) < 32); ((__cxx_lvalue_5) => { const previous = __cxx_lvalue_5.value; const next = i32((previous + 1)); __cxx_lvalue_5.value = next; return previous; })(cDeref(cPointerOffset(palcol, i32((i + 3)), Int32Array.BYTES_PER_ELEMENT), Int32Array))) {
            if ((!Boolean(i32((j & 1))))) {
              break;
            }
            (j = i32((u32(j) >>> 1)));
          }
        }
      }
      ((cDeref(cPointerOffset(palcol, 0, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((24 - i32(((cDeref(cPointerOffset(palcol, 0, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) + (cDeref(cPointerOffset(palcol, 3, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))))));
      ((cDeref(cPointerOffset(palcol, 1, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((16 - i32(((cDeref(cPointerOffset(palcol, 1, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) + (cDeref(cPointerOffset(palcol, 4, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))))));
      ((cDeref(cPointerOffset(palcol, 2, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((8 - i32(((cDeref(cPointerOffset(palcol, 2, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) + (cDeref(cPointerOffset(palcol, 5, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))))));
      ((cDeref(cPointerOffset(palcol, 3, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(((-i32((1 << i32((24 - (cDeref(cPointerOffset(palcol, 3, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)))))) & 16711680)));
      ((cDeref(cPointerOffset(palcol, 4, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(((-i32((1 << i32((16 - (cDeref(cPointerOffset(palcol, 4, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)))))) & 65280)));
      ((cDeref(cPointerOffset(palcol, 5, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(((-i32((1 << i32((8 - (cDeref(cPointerOffset(palcol, 5, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)))))) & 255)));
    }
  }
  (cptrinc = i32((i32((i32((i32(Math.imul(xsiz, cdim)) + 31)) >> 3)) & (~3))));
  (cptr = cPointerOffset(buf, rastoff, Uint8Array.BYTES_PER_ELEMENT));
  if ((ysiz < 0)) {
    (ysiz = i32((-ysiz)));
  } else {
    (cptr = cPointerOffset(cptr, i32(Math.imul(i32((ysiz - 1)), cptrinc)), Uint8Array.BYTES_PER_ELEMENT));
    (cptrinc = i32((-cptrinc)));
  }
  (x0 = i32(0));
  (x1 = i32(xsiz));
  (y0 = i32(0));
  (y1 = i32(ysiz));
  if ((x1 > daxres)) {
    (x1 = i32(daxres));
  }
  for ((y = i32(y0)); (y < y1); (((__cxx_lvalue_6) => { const previous = __cxx_lvalue_6.value; const next = i32((previous + 1)); __cxx_lvalue_6.value = next; return previous; })(cRef(() => y, __cxx_lvalue_7 => { y = __cxx_lvalue_7; })), (cptr = cPointerOffset(cptr, cptrinc, Uint8Array.BYTES_PER_ELEMENT)))) {
    if ((u32(y) >= u32(dayres))) {
      continue;
    }
    (lptr = cTypedPointer(cSourceAddresses.decode(i64((BigInt(i64(i32(Math.imul(y, dakpbytesperline)))) + BigInt(dakpframeplace)))), Int32Array));
    switch (cdim) {
      case 1: {
        for ((x = i32(x0)); (x < x1); ((__cxx_lvalue_8) => { const previous = __cxx_lvalue_8.value; const next = i32((previous + 1)); __cxx_lvalue_8.value = next; return previous; })(cRef(() => x, __cxx_lvalue_9 => { x = __cxx_lvalue_9; }))) {
          ((cDeref(cPointerOffset(lptr, x, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((cDeref(cPointerOffset(palcol, i32((i32((i32((cDeref(cPointerOffset(cptr, i32((x >> 3)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) >> i32((i32((x & 7)) ^ 7)))) & 1)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
        }
      }
      break;
      case 4: {
        for ((x = i32(x0)); (x < x1); ((__cxx_lvalue_10) => { const previous = __cxx_lvalue_10.value; const next = i32((previous + 1)); __cxx_lvalue_10.value = next; return previous; })(cRef(() => x, __cxx_lvalue_11 => { x = __cxx_lvalue_11; }))) {
          ((cDeref(cPointerOffset(lptr, x, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((cDeref(cPointerOffset(palcol, i32((i32((i32((cDeref(cPointerOffset(cptr, i32((x >> 1)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) >> i32((i32((i32((x & 1)) ^ 1)) << 2)))) & 15)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
        }
      }
      break;
      case 8: {
        for ((x = i32(x0)); (x < x1); ((__cxx_lvalue_12) => { const previous = __cxx_lvalue_12.value; const next = i32((previous + 1)); __cxx_lvalue_12.value = next; return previous; })(cRef(() => x, __cxx_lvalue_13 => { x = __cxx_lvalue_13; }))) {
          ((cDeref(cPointerOffset(lptr, x, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((cDeref(cPointerOffset(palcol, i32((cDeref(cPointerOffset(cptr, x, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
        }
      }
      break;
      case 16: {
        for ((x = i32(x0)); (x < x1); ((__cxx_lvalue_14) => { const previous = __cxx_lvalue_14.value; const next = i32((previous + 1)); __cxx_lvalue_14.value = next; return previous; })(cRef(() => x, __cxx_lvalue_15 => { x = __cxx_lvalue_15; }))) {
          (i = i32(B_UNBUF16__header_48ae80884dfc(cPointerOffset(cptr, i32((x << 1)), Uint8Array.BYTES_PER_ELEMENT))));
          ((cDeref(cPointerOffset(lptr, x, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(u32((u32(i32((i32((i32((klrotl(i, (cDeref(cPointerOffset(palcol, 0, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)) & (cDeref(cPointerOffset(palcol, 3, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))) + i32((klrotl(i, (cDeref(cPointerOffset(palcol, 1, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)) & (cDeref(cPointerOffset(palcol, 4, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))))) + i32((klrotl(i, (cDeref(cPointerOffset(palcol, 2, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)) & (cDeref(cPointerOffset(palcol, 5, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)))))) + B_PASS32__header_8a7178a88765(4278190080)))));
        }
      }
      break;
      case 24: {
        for ((x = i32(x0)); (x < x1); ((__cxx_lvalue_16) => { const previous = __cxx_lvalue_16.value; const next = i32((previous + 1)); __cxx_lvalue_16.value = next; return previous; })(cRef(() => x, __cxx_lvalue_17 => { x = __cxx_lvalue_17; }))) {
          ((cDeref(cPointerOffset(lptr, x, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(u32((B_UNBUF32__header_c1468ac058f1(cPointerOffset(cptr, i32(Math.imul(x, 3)), Uint8Array.BYTES_PER_ELEMENT)) | B_PASS32__header_8a7178a88765(4278190080)))));
        }
      }
      break;
      case 32: {
        for ((x = i32(x0)); (x < x1); ((__cxx_lvalue_18) => { const previous = __cxx_lvalue_18.value; const next = i32((previous + 1)); __cxx_lvalue_18.value = next; return previous; })(cRef(() => x, __cxx_lvalue_19 => { x = __cxx_lvalue_19; }))) {
          (i = i32(B_UNBUF32__header_c1468ac058f1(cPointerOffset(cptr, i32((x << 2)), Uint8Array.BYTES_PER_ELEMENT))));
          ((cDeref(cPointerOffset(lptr, x, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(u32((u32(i32((i32((i32((klrotl(i, (cDeref(cPointerOffset(palcol, 0, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)) & (cDeref(cPointerOffset(palcol, 3, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))) + i32((klrotl(i, (cDeref(cPointerOffset(palcol, 1, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)) & (cDeref(cPointerOffset(palcol, 4, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))))) + i32((klrotl(i, (cDeref(cPointerOffset(palcol, 2, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)) & (cDeref(cPointerOffset(palcol, 5, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)))))) + B_PASS32__header_8a7178a88765(4278190080)))));
        }
      }
      break;
    }
  }
  return i32(0);
}

// C/C++ source: source/build/src/kplib.cpp:1997
export function kpcxrend(buf, fleng, dakpframeplace, dakpbytesperline, daxres, dayres) {
  const __cxx_lvalue_0 = cRef(() => daxres, __cxx_lvalue_32 => { daxres = i32(__cxx_lvalue_32); });
  const __cxx_lvalue_1 = cRef(() => dayres, __cxx_lvalue_33 => { dayres = i32(__cxx_lvalue_33); });
  let j;
  let x;
  let y;
  let nplanes;
  let x0;
  let x1;
  const __cxx_lvalue_2 = cRef(() => x1, __cxx_lvalue_5 => { x1 = i32(__cxx_lvalue_5); });
  let y0;
  let y1;
  let bpl;
  let xsiz;
  const __cxx_lvalue_3 = cRef(() => xsiz, __cxx_lvalue_6 => { xsiz = i32(__cxx_lvalue_6); });
  let ysiz;
  const __cxx_lvalue_4 = cRef(() => ysiz, __cxx_lvalue_7 => { ysiz = i32(__cxx_lvalue_7); });
  let p;
  let i;
  let c;
  let cptr;
  if ((B_UNBUF32__header_c1468ac058f1(buf) != B_PASS32__header_8a7178a88765(134284554))) {
    return i32((-1));
  }
  (xsiz = i32((i32((i32(B_PASS16__header_15ea0d7111ad(B_UNBUF16__header_48ae80884dfc(cPointerOffset(buf, 8, Uint8Array.BYTES_PER_ELEMENT)))) - i32(B_PASS16__header_15ea0d7111ad(B_UNBUF16__header_48ae80884dfc(cPointerOffset(buf, 4, Uint8Array.BYTES_PER_ELEMENT)))))) + 1)));
  if ((xsiz <= 0)) {
    return i32((-1));
  }
  (ysiz = i32((i32((i32(B_PASS16__header_15ea0d7111ad(B_UNBUF16__header_48ae80884dfc(cPointerOffset(buf, 10, Uint8Array.BYTES_PER_ELEMENT)))) - i32(B_PASS16__header_15ea0d7111ad(B_UNBUF16__header_48ae80884dfc(cPointerOffset(buf, 6, Uint8Array.BYTES_PER_ELEMENT)))))) + 1)));
  if ((ysiz <= 0)) {
    return i32((-1));
  }
  (nplanes = i32((cDeref(cPointerOffset(buf, 65, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)));
  (bpl = i32(B_PASS16__header_15ea0d7111ad(B_UNBUF16__header_48ae80884dfc(cPointerOffset(buf, 66, Uint8Array.BYTES_PER_ELEMENT)))));
  if ((nplanes == 1)) {
    (cptr = cTypedPointer(cPointerOffset(buf, i32((fleng - 768)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array));
    for ((i = i64(0)); (i < i64(256)); ((__cxx_lvalue_8) => { const previous = __cxx_lvalue_8.value; const next = i64((previous + 1n)); __cxx_lvalue_8.value = next; return previous; })(cRef(() => i, __cxx_lvalue_9 => { i = __cxx_lvalue_9; }))) {
      ((cDeref(cPointerOffset(palcol, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(u32((u32(i32((i32((i32((i32((cDeref(cPointerOffset(cptr, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) << 16)) + i32((i32((cDeref(cPointerOffset(cptr, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) << 8)))) + i32((cDeref(cPointerOffset(cptr, 2, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value))))) + B_PASS32__header_8a7178a88765(4278190080)))));
      (cptr = cPointerOffset(cptr, 3, Uint8Array.BYTES_PER_ELEMENT));
    }
    (kcoltype = ((u32(((u32(3) << 24) >> 24)) << 24) >> 24));
    (bitdepth = ((u32(((u32(8) << 24) >> 24)) << 24) >> 24));
    (paleng = i32(256));
  } else {
    if ((nplanes == 3)) {
      (kcoltype = ((u32(((u32(2) << 24) >> 24)) << 24) >> 24));
      (x0 = i32(0));
      (x1 = i32((min__template_774131ccff66371d(__cxx_lvalue_3, __cxx_lvalue_0)).value));
      (y0 = i32(0));
      (y1 = i32((min__template_774131ccff66371d(__cxx_lvalue_4, __cxx_lvalue_1)).value));
      (i = i64((BigInt(i64((BigInt(i64(i32(Math.imul(y0, dakpbytesperline)))) + BigInt(dakpframeplace)))) + BigInt(i64(3)))));
      for ((y = i32(y0)); (y < y1); (((__cxx_lvalue_10) => { const previous = __cxx_lvalue_10.value; const next = i32((previous + 1)); __cxx_lvalue_10.value = next; return previous; })(cRef(() => y, __cxx_lvalue_11 => { y = __cxx_lvalue_11; })), (i = i64((BigInt(i) + BigInt(i64(dakpbytesperline))))))) {
        for ((x = i32(x0)); (x < x1); ((__cxx_lvalue_12) => { const previous = __cxx_lvalue_12.value; const next = i32((previous + 1)); __cxx_lvalue_12.value = next; return previous; })(cRef(() => x, __cxx_lvalue_13 => { x = __cxx_lvalue_13; }))) {
          ((cDeref(cTypedPointer(cSourceAddresses.decode(i64((BigInt(i64(i32((x << 2)))) + BigInt(i)))), Uint8Array), Uint8Array).value) = (u32((u32(255) & 255)) & 255));
        }
      }
    }
  }
  (x = i32((x0 = i32(0))));
  (x1 = i32(xsiz));
  (y = i32((y0 = i32(0))));
  (y1 = i32(ysiz));
  (cptr = cTypedPointer(cPointerOffset(buf, 128, Uint8Array.BYTES_PER_ELEMENT), Uint8Array));
  (p = i64((BigInt(i64(i32(Math.imul(y, dakpbytesperline)))) + BigInt(dakpframeplace))));
  if ((bpl > xsiz)) {
    (daxres = i32((min__template_774131ccff66371d(__cxx_lvalue_0, __cxx_lvalue_2)).value));
    (x1 = i32((Number(x1) + Number(i32((bpl - xsiz))))));
  }
  (j = i32((nplanes - 1)));
  (daxres = i32((daxres << 2)));
  (x0 = i32((x0 << 2)));
  (x1 = i32((x1 << 2)));
  (x = i32((x << 2)));
  (x = i32((Number(x) + Number(j))));
  if ((nplanes == 1)) {
    do {
      (c = (u32((cDeref(((__cxx_lvalue_14) => { const previous = __cxx_lvalue_14.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_14.value = next; return previous; })(cRef(() => cptr, __cxx_lvalue_15 => { cptr = __cxx_lvalue_15; })), Uint8Array).value)) & 255));
      if ((i32(c) < 192)) {
        (i = i64(1));
      } else {
        (i = i64(i32((i32(c) & 63))));
        (c = (u32((cDeref(((__cxx_lvalue_16) => { const previous = __cxx_lvalue_16.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_16.value = next; return previous; })(cRef(() => cptr, __cxx_lvalue_17 => { cptr = __cxx_lvalue_17; })), Uint8Array).value)) & 255));
      }
      (j = i32((cDeref(cPointerOffset(palcol, i32(c), Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
      for (; Boolean(i); ((__cxx_lvalue_18) => { const previous = __cxx_lvalue_18.value; const next = i64((previous - 1n)); __cxx_lvalue_18.value = next; return previous; })(cRef(() => i, __cxx_lvalue_19 => { i = __cxx_lvalue_19; }))) {
        if ((u32(y) < u32(dayres))) {
          if ((u32(x) < u32(daxres))) {
            B_BUF32__header_5d2f345cbe77(cSourceAddresses.decode(i64((BigInt(i64(x)) + BigInt(p)))), u32(j));
          }
        }
        (x = i32((Number(x) + Number(4))));
        if ((x >= x1)) {
          (x = i32(x0));
          ((__cxx_lvalue_20) => { const previous = __cxx_lvalue_20.value; const next = i32((previous + 1)); __cxx_lvalue_20.value = next; return previous; })(cRef(() => y, __cxx_lvalue_21 => { y = __cxx_lvalue_21; }));
          (p = i64((BigInt(p) + BigInt(i64(dakpbytesperline)))));
        }
      }
    } while ((y < y1));
  } else {
    if ((nplanes == 3)) {
      do {
        (c = (u32((cDeref(((__cxx_lvalue_22) => { const previous = __cxx_lvalue_22.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_22.value = next; return previous; })(cRef(() => cptr, __cxx_lvalue_23 => { cptr = __cxx_lvalue_23; })), Uint8Array).value)) & 255));
        if ((i32(c) < 192)) {
          (i = i64(1));
        } else {
          (i = i64(i32((i32(c) & 63))));
          (c = (u32((cDeref(((__cxx_lvalue_24) => { const previous = __cxx_lvalue_24.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_24.value = next; return previous; })(cRef(() => cptr, __cxx_lvalue_25 => { cptr = __cxx_lvalue_25; })), Uint8Array).value)) & 255));
        }
        for (; Boolean(i); ((__cxx_lvalue_26) => { const previous = __cxx_lvalue_26.value; const next = i64((previous - 1n)); __cxx_lvalue_26.value = next; return previous; })(cRef(() => i, __cxx_lvalue_27 => { i = __cxx_lvalue_27; }))) {
          if ((u32(y) < u32(dayres))) {
            if ((u32(x) < u32(daxres))) {
              ((cDeref(cTypedPointer(cSourceAddresses.decode(i64((BigInt(i64(x)) + BigInt(p)))), Uint8Array), Uint8Array).value) = (u32((u32(c) & 255)) & 255));
            }
          }
          (x = i32((Number(x) + Number(4))));
          if ((x >= x1)) {
            ((__cxx_lvalue_28) => { const previous = __cxx_lvalue_28.value; const next = i32((previous - 1)); __cxx_lvalue_28.value = next; return previous; })(cRef(() => j, __cxx_lvalue_29 => { j = __cxx_lvalue_29; }));
            if ((j < 0)) {
              (j = i32((3 - 1)));
              ((__cxx_lvalue_30) => { const previous = __cxx_lvalue_30.value; const next = i32((previous + 1)); __cxx_lvalue_30.value = next; return previous; })(cRef(() => y, __cxx_lvalue_31 => { y = __cxx_lvalue_31; }));
              (p = i64((BigInt(p) + BigInt(i64(dakpbytesperline)))));
            }
            (x = i32((x0 + j)));
          }
        }
      } while ((y < y1));
    }
  }
  return i32(0);
}

// C/C++ source: source/build/src/kplib.cpp:2205
export function istarga(buf, leng) {
  return i32(((((((((leng >= 19) && (!Boolean(i32((i32((cDeref(cPointerOffset(buf, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 254))))) && (i32((cDeref(cPointerOffset(buf, 2, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) < 12)) && Boolean(i32((i32((1 << i32((cDeref(cPointerOffset(buf, 2, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))) & 3598)))) && (!Boolean(i32((i32((cDeref(cPointerOffset(buf, 16, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 7))))) && (i32((cDeref(cPointerOffset(buf, 16, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) != 0)) && (i32((cDeref(cPointerOffset(buf, 16, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) <= 32)) && (!Boolean(i32((i32((cDeref(cPointerOffset(buf, 17, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 192))))));
}

// C/C++ source: source/build/src/kplib.cpp:2212
export function kpgetdim(buf, leng, xsiz, ysiz) {
  let lptr;
  let cptr;
  let ubuf = cTypedPointer(buf, Uint8Array);
  ((cDeref(xsiz, Int32Array).value) = i32(((cDeref(ysiz, Int32Array).value) = i32(0))));
  if ((leng < 16)) {
    return;
  }
  if ((i32(B_UNBUF16__header_48ae80884dfc(cPointerOffset(ubuf, 0, Uint8Array.BYTES_PER_ELEMENT))) == i32(B_PASS16__header_c2d8d3cb4508(20617)))) {
    (lptr = cTypedPointer(buf, Int32Array));
    if ((((cDeref(cPointerOffset(lptr, 0, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) != B_PASS32__header_08503142e865(1196314761)) || ((cDeref(cPointerOffset(lptr, 1, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) != B_PASS32__header_08503142e865(169478669)))) {
      return;
    }
    (lptr = cPointerOffset(lptr, 2, Int32Array.BYTES_PER_ELEMENT));
    while ((u64((BigInt(u64(cSourceAddresses.encode(lptr))) - BigInt(u64(cSourceAddresses.encode(buf))))) < u64(i32((leng - 16))))) {
      if (((cDeref(cPointerOffset(lptr, 1, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) == B_PASS32__header_08503142e865(1380206665))) {
        ((cDeref(xsiz, Int32Array).value) = i32(B_SWAP32__header_c7537f5ee250((cDeref(cPointerOffset(lptr, 2, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))));
        ((cDeref(ysiz, Int32Array).value) = i32(B_SWAP32__header_c7537f5ee250((cDeref(cPointerOffset(lptr, 3, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))));
        break;
      }
      (lptr = cTypedPointer(cSourceAddresses.decode(i64((BigInt(i64((BigInt(i64(cSourceAddresses.encode(lptr))) + BigInt(i64(B_SWAP32__header_c7537f5ee250((cDeref(cPointerOffset(lptr, 0, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))))))) + BigInt(i64(12))))), Int32Array));
    }
  } else {
    if ((i32(B_UNBUF16__header_48ae80884dfc(cPointerOffset(ubuf, 0, Uint8Array.BYTES_PER_ELEMENT))) == i32(B_PASS16__header_7269365a3bec(55551)))) {
      (cptr = cTypedPointer(cPointerOffset(buf, 2, Uint8Array.BYTES_PER_ELEMENT), Uint8Array));
      while ((u64((BigInt(u64(cSourceAddresses.encode(cptr))) - BigInt(u64(cSourceAddresses.encode(buf))))) < u64(i32((leng - 8))))) {
        if (((i32((cDeref(cPointerOffset(cptr, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) != 255) || (i32((cDeref(cPointerOffset(cptr, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == 255))) {
          ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_0.value = next; return previous; })(cRef(() => cptr, __cxx_lvalue_1 => { cptr = __cxx_lvalue_1; }));
          continue;
        }
        if ((u32(i32((i32((cDeref(cPointerOffset(cptr, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) - 192))) < u32(3))) {
          ((cDeref(ysiz, Int32Array).value) = i32(B_SWAP16__header_b45431f7a004(B_UNBUF16__header_48ae80884dfc(cPointerOffset(cptr, 5, Uint8Array.BYTES_PER_ELEMENT)))));
          ((cDeref(xsiz, Int32Array).value) = i32(B_SWAP16__header_b45431f7a004(B_UNBUF16__header_48ae80884dfc(cPointerOffset(cptr, 7, Uint8Array.BYTES_PER_ELEMENT)))));
          break;
        }
        (cptr = cPointerOffset(cptr, i32((i32(B_SWAP16__header_b45431f7a004(B_UNBUF16__header_48ae80884dfc(cPointerOffset(cptr, 2, Uint8Array.BYTES_PER_ELEMENT)))) + 2)), Uint8Array.BYTES_PER_ELEMENT));
      }
    } else {
      if ((((i32((cDeref(cPointerOffset(ubuf, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == i32(71)) && (i32((cDeref(cPointerOffset(ubuf, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == i32(73))) && (i32((cDeref(cPointerOffset(ubuf, 2, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == i32(70)))) {
        ((cDeref(xsiz, Int32Array).value) = i32(B_PASS16__header_15ea0d7111ad(B_UNBUF16__header_48ae80884dfc(cPointerOffset(buf, 6, Uint8Array.BYTES_PER_ELEMENT)))));
        ((cDeref(ysiz, Int32Array).value) = i32(B_PASS16__header_15ea0d7111ad(B_UNBUF16__header_48ae80884dfc(cPointerOffset(buf, 8, Uint8Array.BYTES_PER_ELEMENT)))));
      } else {
        if (((i32((cDeref(cPointerOffset(ubuf, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == i32(66)) && (i32((cDeref(cPointerOffset(ubuf, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == i32(77)))) {
          if ((B_UNBUF32__header_c1468ac058f1(cPointerOffset(buf, 14, Uint8Array.BYTES_PER_ELEMENT)) == B_PASS32__header_8a7178a88765(12))) {
            if ((i32(B_UNBUF16__header_48ae80884dfc(cPointerOffset(buf, 22, Uint8Array.BYTES_PER_ELEMENT))) != i32(B_PASS16__header_c2d8d3cb4508(1)))) {
              return;
            }
            ((cDeref(xsiz, Int32Array).value) = i32(B_PASS16__header_15ea0d7111ad(B_UNBUF16__header_48ae80884dfc(cPointerOffset(buf, 18, Uint8Array.BYTES_PER_ELEMENT)))));
            ((cDeref(ysiz, Int32Array).value) = i32(B_PASS16__header_15ea0d7111ad(B_UNBUF16__header_48ae80884dfc(cPointerOffset(buf, 20, Uint8Array.BYTES_PER_ELEMENT)))));
          } else {
            if ((i32(B_UNBUF16__header_48ae80884dfc(cPointerOffset(buf, 26, Uint8Array.BYTES_PER_ELEMENT))) != i32(B_PASS16__header_c2d8d3cb4508(1)))) {
              return;
            }
            ((cDeref(xsiz, Int32Array).value) = i32(B_PASS32__header_8a7178a88765(B_UNBUF32__header_c1468ac058f1(cPointerOffset(buf, 18, Uint8Array.BYTES_PER_ELEMENT)))));
            ((cDeref(ysiz, Int32Array).value) = i32(B_PASS32__header_8a7178a88765(B_UNBUF32__header_c1468ac058f1(cPointerOffset(buf, 22, Uint8Array.BYTES_PER_ELEMENT)))));
          }
        } else {
          if ((B_UNBUF32__header_c1468ac058f1(ubuf) == B_PASS32__header_8a7178a88765(134284554))) {
            ((cDeref(xsiz, Int32Array).value) = i32((i32((i32(B_PASS16__header_15ea0d7111ad(B_UNBUF16__header_48ae80884dfc(cPointerOffset(buf, 8, Uint8Array.BYTES_PER_ELEMENT)))) - i32(B_PASS16__header_15ea0d7111ad(B_UNBUF16__header_48ae80884dfc(cPointerOffset(buf, 4, Uint8Array.BYTES_PER_ELEMENT)))))) + 1)));
            ((cDeref(ysiz, Int32Array).value) = i32((i32((i32(B_PASS16__header_15ea0d7111ad(B_UNBUF16__header_48ae80884dfc(cPointerOffset(buf, 10, Uint8Array.BYTES_PER_ELEMENT)))) - i32(B_PASS16__header_15ea0d7111ad(B_UNBUF16__header_48ae80884dfc(cPointerOffset(buf, 6, Uint8Array.BYTES_PER_ELEMENT)))))) + 1)));
          } else {
            if (Boolean(istarga(ubuf, leng))) {
              ((cDeref(xsiz, Int32Array).value) = i32(B_PASS16__header_15ea0d7111ad(B_UNBUF16__header_48ae80884dfc(cPointerOffset(buf, 12, Uint8Array.BYTES_PER_ELEMENT)))));
              ((cDeref(ysiz, Int32Array).value) = i32(B_PASS16__header_15ea0d7111ad(B_UNBUF16__header_48ae80884dfc(cPointerOffset(buf, 14, Uint8Array.BYTES_PER_ELEMENT)))));
            }
          }
        }
      }
    }
  }
}

// C/C++ source: source/build/src/kplib.cpp:2338
export function wildmatch(match, wild) {
  do {
    let match_deref = i32((cDeref(match, Uint8Array).value));
    let wild_deref = i32((cDeref(wild, Uint8Array).value));
    if ((Boolean(match_deref) && ((i32((cDeref(cPointerOffset(toupperlookup, wild_deref, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == i32((cDeref(cPointerOffset(toupperlookup, match_deref, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value))) || (wild_deref == i32(63))))) {
      (((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_0.value = next; return previous; })(cRef(() => wild, __cxx_lvalue_1 => { wild = __cxx_lvalue_1; })), ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_2.value = next; return previous; })(cRef(() => match, __cxx_lvalue_3 => { match = __cxx_lvalue_3; })));
      continue;
    } else {
      if ((i32((match_deref | wild_deref)) == i32(0))) {
        return i32(1);
      } else {
        if ((wild_deref == i32(42))) {
          do {
            ((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_4.value = next; return previous; })(cRef(() => wild, __cxx_lvalue_5 => { wild = __cxx_lvalue_5; }));
          } while ((i32((cDeref(wild, Uint8Array).value)) == i32(42)));
          let wild_deref = i32((cDeref(wild, Uint8Array).value));
          do {
            if ((wild_deref == i32(0))) {
              return i32(1);
            }
            while ((Boolean((cDeref(match, Uint8Array).value)) && (i32((cDeref(cPointerOffset(toupperlookup, (cDeref(match, Uint8Array).value), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) != i32((cDeref(cPointerOffset(toupperlookup, wild_deref, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value))))) {
              ((__cxx_lvalue_6) => { const previous = __cxx_lvalue_6.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_6.value = next; return previous; })(cRef(() => match, __cxx_lvalue_7 => { match = __cxx_lvalue_7; }));
            }
            if (((Boolean((cDeref(match, Uint8Array).value)) && Boolean((cDeref(cPointerOffset(match, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value))) && (i32((cDeref(cPointerOffset(toupperlookup, (cDeref(cPointerOffset(match, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) != i32((cDeref(cPointerOffset(toupperlookup, (cDeref(cPointerOffset(wild, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value))))) {
              ((__cxx_lvalue_8) => { const previous = __cxx_lvalue_8.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_8.value = next; return previous; })(cRef(() => match, __cxx_lvalue_9 => { match = __cxx_lvalue_9; }));
              continue;
            }
            break;
          } while (Boolean(1));
          if ((i32((cDeref(cPointerOffset(toupperlookup, (cDeref(match, Uint8Array).value), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == i32((cDeref(cPointerOffset(toupperlookup, wild_deref, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))) {
            continue;
          }
        }
      }
    }
    return i32(0);
  } while (Boolean(1));
}

// C/C++ source: source/build/src/kplib.cpp:2391
export function kzcheckhashsiz(siz) {
  if ((!__cxx_private_cell_b157606d4f95106080f2a466().value)) {
    memset(__cxx_private_cell_2360a9b21e071c889545420f().value, (-1), 1024);
    (__cxx_private_cell_b157606d4f95106080f2a466().value = cTypedPointer(xmalloc__header_19a1c2b77820(u64(8192)), Uint8Array));
    if ((!__cxx_private_cell_b157606d4f95106080f2a466().value)) {
      return i32(0);
    }
    (__cxx_private_cell_b818bdd96ac5a54d23ef8d71().value = i32(0));
    (__cxx_private_cell_68d23d870c89fbf375ec9ee7().value = i32((-1)));
    (__cxx_private_cell_18a15d7d0a28f837f71b69ed().value = i32(8192));
    (__cxx_private_cell_3061051e41549ca97da073af().value = i32((-1)));
  }
  if ((i32((__cxx_private_cell_b818bdd96ac5a54d23ef8d71().value + siz)) > __cxx_private_cell_18a15d7d0a28f837f71b69ed().value)) {
    let i = i32(__cxx_private_cell_18a15d7d0a28f837f71b69ed().value);
    do {
      (i = i32((i << 1)));
    } while ((i32((__cxx_private_cell_b818bdd96ac5a54d23ef8d71().value + siz)) > i));
    (__cxx_private_cell_b157606d4f95106080f2a466().value = cTypedPointer(xrealloc__header_a75fad26d587(__cxx_private_cell_b157606d4f95106080f2a466().value, u64(i)), Uint8Array));
    if ((!__cxx_private_cell_b157606d4f95106080f2a466().value)) {
      return i32(0);
    }
    (__cxx_private_cell_18a15d7d0a28f837f71b69ed().value = i32(i));
  }
  return i32(1);
}

// C/C++ source: source/build/src/kplib.cpp:2409
export function kzcalchash(st) {
  let i;
  let hashind;
  for (((i = i32(0)), (hashind = i32(0))); Boolean((cDeref(cPointerOffset(st, i, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; }))) {
    (hashind = i32((i32((cDeref(cPointerOffset(toupperlookup, (cDeref(cPointerOffset(st, i, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) - i32((i32((hashind << 1)) + hashind)))));
  }
  return i32(u64((BigInt(u64(hashind)) % BigInt(ARRAY_SIZE__header_5684d083f66c(__cxx_private_cell_2360a9b21e071c889545420f().value)))));
}

// C/C++ source: source/build/src/kplib.cpp:2419
export function kzcheckhash(filnam, zipnam, fileoffs, fileleng, iscomp) {
  let i;
  if ((!__cxx_private_cell_b157606d4f95106080f2a466().value)) {
    return i32(0);
  }
  if ((i32((cDeref(cPointerOffset(filnam, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == i32(124))) {
    ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_0.value = next; return previous; })(cRef(() => filnam, __cxx_lvalue_1 => { filnam = __cxx_lvalue_1; }));
  }
  for ((i = i32((cDeref(cPointerOffset(__cxx_private_cell_2360a9b21e071c889545420f().value, kzcalchash(filnam), Int32Array.BYTES_PER_ELEMENT), Int32Array).value))); (i >= 0); (i = i32(B_UNBUF32__header_c1468ac058f1(cPointerOffset(__cxx_private_cell_b157606d4f95106080f2a466().value, i, Uint8Array.BYTES_PER_ELEMENT))))) {
    if ((!Boolean(filnamcmp__header_a9607fbb77a7(filnam, cPointerOffset(__cxx_private_cell_b157606d4f95106080f2a466().value, i32((i + 21)), Uint8Array.BYTES_PER_ELEMENT))))) {
      ((cPointerElementRef(zipnam, 0).value) = cPointerOffset(__cxx_private_cell_b157606d4f95106080f2a466().value, B_UNBUF32__header_c1468ac058f1(cPointerOffset(__cxx_private_cell_b157606d4f95106080f2a466().value, i32((i + 8)), Uint8Array.BYTES_PER_ELEMENT)), Uint8Array.BYTES_PER_ELEMENT));
      ((cDeref(fileoffs, Int32Array).value) = i32(B_UNBUF32__header_c1468ac058f1(cPointerOffset(__cxx_private_cell_b157606d4f95106080f2a466().value, i32((i + 12)), Uint8Array.BYTES_PER_ELEMENT))));
      ((cDeref(fileleng, Int32Array).value) = i32(B_UNBUF32__header_c1468ac058f1(cPointerOffset(__cxx_private_cell_b157606d4f95106080f2a466().value, i32((i + 16)), Uint8Array.BYTES_PER_ELEMENT))));
      ((cDeref(iscomp, Uint8Array).value) = (u32((cDeref(cPointerOffset(__cxx_private_cell_b157606d4f95106080f2a466().value, i32((i + 20)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
      return i32(1);
    }
  }
  return i32(0);
}

// C/C++ source: source/build/src/kplib.cpp:2437
export function kzuninit() {
  do {
    xfree__header_dacf3b9e1753(__cxx_private_cell_b157606d4f95106080f2a466().value);
    (__cxx_private_cell_b157606d4f95106080f2a466().value = null);
  } while (Boolean(0));
  (__cxx_private_cell_b818bdd96ac5a54d23ef8d71().value = i32((__cxx_private_cell_18a15d7d0a28f837f71b69ed().value = i32(0))));
  (__cxx_private_cell_3061051e41549ca97da073af().value = i32((-1)));
}

// C/C++ source: source/build/src/kplib.cpp:2445
const __cxx_literal_d711379a690c9a945ab1 = Uint8Array.from([114, 98, 0]);
export function kzaddstack(filnam) {
  let fil;
  let i;
  const __cxx_lvalue_0 = cScalarStorage(Int32Array);
  let j;
  const __cxx_lvalue_1 = cScalarStorage(Int32Array);
  let k;
  let leng;
  let hashind;
  let zipnamoffs;
  let numfiles;
  let tempbuf = cZeroAggregate({"array": "Uint8Array", "dims": [306]});
  (fil = fopen(filnam, __cxx_literal_d711379a690c9a945ab1));
  if ((!fil)) {
    (__cxx_lvalue_0.value = i32(u64((BigInt(strlen(filnam)) + BigInt(u64(5))))));
    if ((!Boolean(kzcheckhashsiz(__cxx_lvalue_0.value)))) {
      return i32((-1));
    }
    B_BUF32__header_5d2f345cbe77(cPointerOffset(__cxx_private_cell_b157606d4f95106080f2a466().value, __cxx_private_cell_b818bdd96ac5a54d23ef8d71().value, Uint8Array.BYTES_PER_ELEMENT), u32(__cxx_private_cell_3061051e41549ca97da073af().value));
    (__cxx_private_cell_3061051e41549ca97da073af().value = i32(__cxx_private_cell_b818bdd96ac5a54d23ef8d71().value));
    strcpy(cPointerOffset(__cxx_private_cell_b157606d4f95106080f2a466().value, i32((__cxx_private_cell_b818bdd96ac5a54d23ef8d71().value + 4)), Uint8Array.BYTES_PER_ELEMENT), filnam);
    (__cxx_private_cell_b818bdd96ac5a54d23ef8d71().value = i32((Number(__cxx_private_cell_b818bdd96ac5a54d23ef8d71().value) + Number(__cxx_lvalue_0.value))));
    return i32((-1));
  }
  (__cxx_lvalue_0.value = i32(u64((BigInt(strlen(filnam)) + BigInt(u64(1))))));
  if ((!Boolean(kzcheckhashsiz(__cxx_lvalue_0.value)))) {
    fclose(fil);
    return i32((-1));
  }
  strcpy(cPointerOffset(__cxx_private_cell_b157606d4f95106080f2a466().value, __cxx_private_cell_b818bdd96ac5a54d23ef8d71().value, Uint8Array.BYTES_PER_ELEMENT), filnam);
  (zipnamoffs = i32(__cxx_private_cell_b818bdd96ac5a54d23ef8d71().value));
  (__cxx_private_cell_b818bdd96ac5a54d23ef8d71().value = i32((Number(__cxx_private_cell_b818bdd96ac5a54d23ef8d71().value) + Number(__cxx_lvalue_0.value))));
  fread(__cxx_lvalue_0, u64(4), u64(1), fil);
  if ((__cxx_lvalue_0.value == B_PASS32__header_08503142e865(67324752))) {
    fseek(fil, i64((BigInt(buildvfs_flength__header_0b643cd4c0f7(fil)) - BigInt(i64(22)))), 0);
    fread(tempbuf, u64(22), u64(1), fil);
    if ((B_UNBUF32__header_c1468ac058f1(cPointerOffset(tempbuf, 0, Uint8Array.BYTES_PER_ELEMENT)) == B_PASS32__header_8a7178a88765(101010256))) {
      (numfiles = i32(B_PASS16__header_15ea0d7111ad(B_UNBUF16__header_48ae80884dfc(cPointerOffset(tempbuf, 10, Uint8Array.BYTES_PER_ELEMENT)))));
      fseek(fil, i64(B_PASS32__header_8a7178a88765(B_UNBUF32__header_c1468ac058f1(cPointerOffset(tempbuf, 16, Uint8Array.BYTES_PER_ELEMENT)))), 0);
    } else {
      fseek(fil, i64(0), 0);
      (numfiles = i32(0));
      while (Boolean(1)) {
        if ((!Boolean(fread(__cxx_lvalue_1, u64(4), u64(1), fil)))) {
          (numfiles = i32((-1)));
          break;
        }
        if ((__cxx_lvalue_1.value == B_PASS32__header_08503142e865(33639248))) {
          break;
        }
        if ((__cxx_lvalue_1.value != B_PASS32__header_08503142e865(67324752))) {
          (numfiles = i32((-1)));
          break;
        }
        fread(tempbuf, u64(26), u64(1), fil);
        fseek(fil, i64(u32((u32((B_PASS32__header_8a7178a88765(B_UNBUF32__header_c1468ac058f1(cPointerOffset(tempbuf, 14, Uint8Array.BYTES_PER_ELEMENT))) + u32(B_PASS16__header_15ea0d7111ad(B_UNBUF16__header_48ae80884dfc(cPointerOffset(tempbuf, 24, Uint8Array.BYTES_PER_ELEMENT)))))) + u32(B_PASS16__header_15ea0d7111ad(B_UNBUF16__header_48ae80884dfc(cPointerOffset(tempbuf, 22, Uint8Array.BYTES_PER_ELEMENT))))))), 1);
        ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i32((previous + 1)); __cxx_lvalue_2.value = next; return previous; })(cRef(() => numfiles, __cxx_lvalue_3 => { numfiles = __cxx_lvalue_3; }));
      }
      if ((numfiles < 0)) {
        fclose(fil);
        return i32((-1));
      }
      fseek(fil, i64((-4)), 1);
    }
    for ((__cxx_lvalue_0.value = i32(0)); (__cxx_lvalue_0.value < numfiles); ((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = i32((previous + 1)); __cxx_lvalue_4.value = next; return previous; })(__cxx_lvalue_0)) {
      fread(tempbuf, u64(46), u64(1), fil);
      if ((B_UNBUF32__header_c1468ac058f1(cPointerOffset(tempbuf, 0, Uint8Array.BYTES_PER_ELEMENT)) != B_PASS32__header_8a7178a88765(33639248))) {
        fclose(fil);
        return i32(0);
      }
      (__cxx_lvalue_1.value = i32(B_PASS16__header_15ea0d7111ad(B_UNBUF16__header_48ae80884dfc(cPointerOffset(tempbuf, 28, Uint8Array.BYTES_PER_ELEMENT)))));
      fread(cPointerOffset(tempbuf, 46, Uint8Array.BYTES_PER_ELEMENT), u64(__cxx_lvalue_1.value), u64(1), fil);
      ((cDeref(cPointerOffset(tempbuf, i32((__cxx_lvalue_1.value + 46)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(0) & 255)) & 255));
      (__cxx_lvalue_1.value = i32(u64((BigInt(strlen(cPointerOffset(tempbuf, 46, Uint8Array.BYTES_PER_ELEMENT))) + BigInt(u64(22))))));
      if ((!Boolean(kzcheckhashsiz(__cxx_lvalue_1.value)))) {
        fclose(fil);
        return i32((-1));
      }
      (hashind = i32(kzcalchash(cPointerOffset(tempbuf, 46, Uint8Array.BYTES_PER_ELEMENT))));
      B_BUF32__header_5d2f345cbe77(cPointerOffset(__cxx_private_cell_b157606d4f95106080f2a466().value, __cxx_private_cell_b818bdd96ac5a54d23ef8d71().value, Uint8Array.BYTES_PER_ELEMENT), u32((cDeref(cPointerOffset(__cxx_private_cell_2360a9b21e071c889545420f().value, hashind, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
      B_BUF32__header_5d2f345cbe77(cPointerOffset(__cxx_private_cell_b157606d4f95106080f2a466().value, i32((__cxx_private_cell_b818bdd96ac5a54d23ef8d71().value + 4)), Uint8Array.BYTES_PER_ELEMENT), u32(__cxx_private_cell_68d23d870c89fbf375ec9ee7().value));
      B_BUF32__header_5d2f345cbe77(cPointerOffset(__cxx_private_cell_b157606d4f95106080f2a466().value, i32((__cxx_private_cell_b818bdd96ac5a54d23ef8d71().value + 8)), Uint8Array.BYTES_PER_ELEMENT), u32(zipnamoffs));
      B_BUF32__header_5d2f345cbe77(cPointerOffset(__cxx_private_cell_b157606d4f95106080f2a466().value, i32((__cxx_private_cell_b818bdd96ac5a54d23ef8d71().value + 12)), Uint8Array.BYTES_PER_ELEMENT), B_PASS32__header_8a7178a88765(B_UNBUF32__header_c1468ac058f1(cPointerOffset(tempbuf, 42, Uint8Array.BYTES_PER_ELEMENT))));
      B_BUF32__header_5d2f345cbe77(cPointerOffset(__cxx_private_cell_b157606d4f95106080f2a466().value, i32((__cxx_private_cell_b818bdd96ac5a54d23ef8d71().value + 16)), Uint8Array.BYTES_PER_ELEMENT), u32(0));
      ((cDeref(cPointerOffset(__cxx_private_cell_b157606d4f95106080f2a466().value, i32((__cxx_private_cell_b818bdd96ac5a54d23ef8d71().value + 20)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(1) & 255)) & 255));
      strcpy(cPointerOffset(__cxx_private_cell_b157606d4f95106080f2a466().value, i32((__cxx_private_cell_b818bdd96ac5a54d23ef8d71().value + 21)), Uint8Array.BYTES_PER_ELEMENT), cPointerOffset(tempbuf, 46, Uint8Array.BYTES_PER_ELEMENT));
      ((cDeref(cPointerOffset(__cxx_private_cell_2360a9b21e071c889545420f().value, hashind, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(__cxx_private_cell_b818bdd96ac5a54d23ef8d71().value));
      (__cxx_private_cell_68d23d870c89fbf375ec9ee7().value = i32(__cxx_private_cell_b818bdd96ac5a54d23ef8d71().value));
      (__cxx_private_cell_b818bdd96ac5a54d23ef8d71().value = i32((Number(__cxx_private_cell_b818bdd96ac5a54d23ef8d71().value) + Number(__cxx_lvalue_1.value))));
      (__cxx_lvalue_1.value = i32(B_PASS16__header_15ea0d7111ad(B_UNBUF16__header_48ae80884dfc(cPointerOffset(tempbuf, 30, Uint8Array.BYTES_PER_ELEMENT)))));
      (__cxx_lvalue_1.value = i32((Number(__cxx_lvalue_1.value) + Number(i32(B_PASS16__header_15ea0d7111ad(B_UNBUF16__header_48ae80884dfc(cPointerOffset(tempbuf, 32, Uint8Array.BYTES_PER_ELEMENT))))))));
      fseek(fil, i64(__cxx_lvalue_1.value), 1);
    }
  } else {
    if ((__cxx_lvalue_0.value == B_PASS32__header_08503142e865(1399743819))) {
      fread(tempbuf, u64(12), u64(1), fil);
      if (((B_UNBUF32__header_c1468ac058f1(cPointerOffset(tempbuf, 0, Uint8Array.BYTES_PER_ELEMENT)) != B_PASS32__header_8a7178a88765(1702259817)) || (B_UNBUF32__header_c1468ac058f1(cPointerOffset(tempbuf, 4, Uint8Array.BYTES_PER_ELEMENT)) != B_PASS32__header_8a7178a88765(1851878770)))) {
        fclose(fil);
        return i32(0);
      }
      (numfiles = i32(B_PASS32__header_8a7178a88765(B_UNBUF32__header_c1468ac058f1(cPointerOffset(tempbuf, 8, Uint8Array.BYTES_PER_ELEMENT)))));
      (k = i32((i32((numfiles + 1)) << 4)));
      for ((__cxx_lvalue_0.value = i32(0)); (__cxx_lvalue_0.value < numfiles); (((__cxx_lvalue_5) => { const previous = __cxx_lvalue_5.value; const next = i32((previous + 1)); __cxx_lvalue_5.value = next; return previous; })(__cxx_lvalue_0), (k = i32((Number(k) + Number(leng)))))) {
        fread(tempbuf, u64(16), u64(1), fil);
        (leng = i32(B_PASS32__header_8a7178a88765(B_UNBUF32__header_c1468ac058f1(cPointerOffset(tempbuf, 12, Uint8Array.BYTES_PER_ELEMENT)))));
        ((cDeref(cPointerOffset(tempbuf, 12, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(0) & 255)) & 255));
        (__cxx_lvalue_1.value = i32(u64((BigInt(strlen(tempbuf)) + BigInt(u64(22))))));
        if ((!Boolean(kzcheckhashsiz(__cxx_lvalue_1.value)))) {
          fclose(fil);
          return i32((-1));
        }
        (hashind = i32(kzcalchash(tempbuf)));
        B_BUF32__header_5d2f345cbe77(cPointerOffset(__cxx_private_cell_b157606d4f95106080f2a466().value, __cxx_private_cell_b818bdd96ac5a54d23ef8d71().value, Uint8Array.BYTES_PER_ELEMENT), u32((cDeref(cPointerOffset(__cxx_private_cell_2360a9b21e071c889545420f().value, hashind, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
        B_BUF32__header_5d2f345cbe77(cPointerOffset(__cxx_private_cell_b157606d4f95106080f2a466().value, i32((__cxx_private_cell_b818bdd96ac5a54d23ef8d71().value + 4)), Uint8Array.BYTES_PER_ELEMENT), u32(__cxx_private_cell_68d23d870c89fbf375ec9ee7().value));
        B_BUF32__header_5d2f345cbe77(cPointerOffset(__cxx_private_cell_b157606d4f95106080f2a466().value, i32((__cxx_private_cell_b818bdd96ac5a54d23ef8d71().value + 8)), Uint8Array.BYTES_PER_ELEMENT), u32(zipnamoffs));
        B_BUF32__header_5d2f345cbe77(cPointerOffset(__cxx_private_cell_b157606d4f95106080f2a466().value, i32((__cxx_private_cell_b818bdd96ac5a54d23ef8d71().value + 12)), Uint8Array.BYTES_PER_ELEMENT), u32(k));
        B_BUF32__header_5d2f345cbe77(cPointerOffset(__cxx_private_cell_b157606d4f95106080f2a466().value, i32((__cxx_private_cell_b818bdd96ac5a54d23ef8d71().value + 16)), Uint8Array.BYTES_PER_ELEMENT), u32(leng));
        ((cDeref(cPointerOffset(__cxx_private_cell_b157606d4f95106080f2a466().value, i32((__cxx_private_cell_b818bdd96ac5a54d23ef8d71().value + 20)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(0) & 255)) & 255));
        strcpy(cPointerOffset(__cxx_private_cell_b157606d4f95106080f2a466().value, i32((__cxx_private_cell_b818bdd96ac5a54d23ef8d71().value + 21)), Uint8Array.BYTES_PER_ELEMENT), tempbuf);
        ((cDeref(cPointerOffset(__cxx_private_cell_2360a9b21e071c889545420f().value, hashind, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(__cxx_private_cell_b818bdd96ac5a54d23ef8d71().value));
        (__cxx_private_cell_68d23d870c89fbf375ec9ee7().value = i32(__cxx_private_cell_b818bdd96ac5a54d23ef8d71().value));
        (__cxx_private_cell_b818bdd96ac5a54d23ef8d71().value = i32((Number(__cxx_private_cell_b818bdd96ac5a54d23ef8d71().value) + Number(__cxx_lvalue_1.value))));
      }
    }
  }
  fclose(fil);
  return i32(0);
}

// C/C++ source: source/build/src/kplib.cpp:2550
export function kzsetfil(fil) {
  (__cxx_global_cell_0c0d9a71eef382369e188fb4().value.fil = fil);
  (__cxx_global_cell_0c0d9a71eef382369e188fb4().value.comptyp = i32(0));
  (__cxx_global_cell_0c0d9a71eef382369e188fb4().value.seek0 = i32(0));
  (__cxx_global_cell_0c0d9a71eef382369e188fb4().value.leng = i32(buildvfs_flength__header_0b643cd4c0f7(fil)));
  (__cxx_global_cell_0c0d9a71eef382369e188fb4().value.pos = i32(0));
  (__cxx_global_cell_0c0d9a71eef382369e188fb4().value.i = i32(0));
}

// C/C++ source: source/build/src/kplib.cpp:2560
const __cxx_literal_d3d5a0b19523842ad27b = Uint8Array.from([114, 98, 0]);
const __cxx_literal_e16f068ffed61af4282d = Uint8Array.from([114, 98, 0]);
const __cxx_literal_55bd84ff901737e829b8 = Uint8Array.from([47, 0]);
const __cxx_literal_384adde444d935d66846 = Uint8Array.from([114, 98, 0]);
export function kzopen(filnam) {
  let fil = null;
  let i;
  let fileoffs;
  const __cxx_lvalue_0 = cRef(() => fileoffs, __cxx_lvalue_4 => { fileoffs = i32(__cxx_lvalue_4); });
  let fileleng;
  const __cxx_lvalue_1 = cRef(() => fileleng, __cxx_lvalue_5 => { fileleng = i32(__cxx_lvalue_5); });
  let tempbuf = cZeroAggregate({"array": "Uint8Array", "dims": [306]});
  let zipnam;
  const __cxx_lvalue_2 = cRef(() => zipnam, __cxx_lvalue_6 => { zipnam = __cxx_lvalue_6; });
  let iscomp;
  const __cxx_lvalue_3 = cRef(() => iscomp, __cxx_lvalue_7 => { iscomp = (u32(__cxx_lvalue_7) & 255); });
  if ((i32((cDeref(cPointerOffset(filnam, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) != i32(124))) {
    (__cxx_global_cell_0c0d9a71eef382369e188fb4().value.fil = fopen(filnam, __cxx_literal_d3d5a0b19523842ad27b));
    if (__cxx_global_cell_0c0d9a71eef382369e188fb4().value.fil) {
      (__cxx_global_cell_0c0d9a71eef382369e188fb4().value.comptyp = i32(0));
      (__cxx_global_cell_0c0d9a71eef382369e188fb4().value.seek0 = i32(0));
      (__cxx_global_cell_0c0d9a71eef382369e188fb4().value.leng = i32(buildvfs_flength__header_0b643cd4c0f7(__cxx_global_cell_0c0d9a71eef382369e188fb4().value.fil)));
      (__cxx_global_cell_0c0d9a71eef382369e188fb4().value.pos = i32(0));
      (__cxx_global_cell_0c0d9a71eef382369e188fb4().value.i = i32(0));
      return i64(cSourceAddresses.encode(__cxx_global_cell_0c0d9a71eef382369e188fb4().value.fil));
    }
  }
  if (Boolean(kzcheckhash(filnam, __cxx_lvalue_2, __cxx_lvalue_0, __cxx_lvalue_1, __cxx_lvalue_3))) {
    (fil = fopen(zipnam, __cxx_literal_e16f068ffed61af4282d));
    if ((!fil)) {
      return i64(0);
    }
    fseek(fil, i64(fileoffs), 0);
    if ((!Boolean(iscomp))) {
      (__cxx_global_cell_0c0d9a71eef382369e188fb4().value.fil = fil);
      (__cxx_global_cell_0c0d9a71eef382369e188fb4().value.comptyp = i32(0));
      (__cxx_global_cell_0c0d9a71eef382369e188fb4().value.seek0 = i32(fileoffs));
      (__cxx_global_cell_0c0d9a71eef382369e188fb4().value.leng = i32(fileleng));
      (__cxx_global_cell_0c0d9a71eef382369e188fb4().value.pos = i32(0));
      (__cxx_global_cell_0c0d9a71eef382369e188fb4().value.i = i32(0));
      return i64(cSourceAddresses.encode(__cxx_global_cell_0c0d9a71eef382369e188fb4().value.fil));
    } else {
      fread(tempbuf, u64(30), u64(1), fil);
      if ((B_UNBUF32__header_c1468ac058f1(cPointerOffset(tempbuf, 0, Uint8Array.BYTES_PER_ELEMENT)) != B_PASS32__header_8a7178a88765(67324752))) {
        fclose(fil);
        return i64(0);
      }
      fseek(fil, i64(i32((i32(B_PASS16__header_15ea0d7111ad(B_UNBUF16__header_48ae80884dfc(cPointerOffset(tempbuf, 26, Uint8Array.BYTES_PER_ELEMENT)))) + i32(B_PASS16__header_15ea0d7111ad(B_UNBUF16__header_48ae80884dfc(cPointerOffset(tempbuf, 28, Uint8Array.BYTES_PER_ELEMENT))))))), 1);
      (__cxx_global_cell_0c0d9a71eef382369e188fb4().value.fil = fil);
      (__cxx_global_cell_0c0d9a71eef382369e188fb4().value.comptyp = i32(B_PASS16__header_15ea0d7111ad(B_UNBUF16__header_48ae80884dfc(cPointerOffset(tempbuf, 8, Uint8Array.BYTES_PER_ELEMENT)))));
      (__cxx_global_cell_0c0d9a71eef382369e188fb4().value.seek0 = i32(ftell(fil)));
      (__cxx_global_cell_0c0d9a71eef382369e188fb4().value.leng = i32(B_PASS32__header_8a7178a88765(B_UNBUF32__header_c1468ac058f1(cPointerOffset(tempbuf, 22, Uint8Array.BYTES_PER_ELEMENT)))));
      (__cxx_global_cell_0c0d9a71eef382369e188fb4().value.pos = i32(0));
      switch (__cxx_global_cell_0c0d9a71eef382369e188fb4().value.comptyp) {
        case 0: {
          (__cxx_global_cell_0c0d9a71eef382369e188fb4().value.i = i32(0));
        }
        return i64(cSourceAddresses.encode(__cxx_global_cell_0c0d9a71eef382369e188fb4().value.fil));
        case 8: {
          if ((!Boolean(__cxx_private_cell_515ab30648dd91d600d1cf94().value))) {
            (__cxx_private_cell_515ab30648dd91d600d1cf94().value = (u32((u32(1) & 255)) & 255));
            initpngtables();
          }
        }
        (__cxx_global_cell_0c0d9a71eef382369e188fb4().value.comptell = i32(0));
        (__cxx_global_cell_0c0d9a71eef382369e188fb4().value.compleng = i32(B_PASS32__header_8a7178a88765(B_UNBUF32__header_c1468ac058f1(cPointerOffset(tempbuf, 18, Uint8Array.BYTES_PER_ELEMENT)))));
        (__cxx_private_cell_19fba13327f490e0c98ebd37().value = i32(2147483647));
        return i64(cSourceAddresses.encode(__cxx_global_cell_0c0d9a71eef382369e188fb4().value.fil));
        default: {
          fclose(__cxx_global_cell_0c0d9a71eef382369e188fb4().value.fil);
        }
        (__cxx_global_cell_0c0d9a71eef382369e188fb4().value.fil = null);
        return i64(0);
      }
    }
  }
  let namlen = i32(strlen(filnam));
  for ((i = i32(__cxx_private_cell_3061051e41549ca97da073af().value)); (i >= 0); (i = i32(B_UNBUF32__header_c1468ac058f1(cPointerOffset(__cxx_private_cell_b157606d4f95106080f2a466().value, i, Uint8Array.BYTES_PER_ELEMENT))))) {
    strcpy(tempbuf, cPointerOffset(__cxx_private_cell_b157606d4f95106080f2a466().value, i32((i + 4)), Uint8Array.BYTES_PER_ELEMENT));
    let j = u32(strlen(tempbuf));
    if ((u64(u32((u32(i32((namlen + 1))) + j))) >= 306)) {
      continue;
    }
    if (((((Boolean(j) && (i32((cDeref(cPointerOffset(tempbuf, u32((j - u32(1))), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) != i32(47))) && (i32((cDeref(cPointerOffset(tempbuf, u32((j - u32(1))), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) != i32(92))) && (i32((cDeref(cPointerOffset(filnam, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) != i32(47))) && (i32((cDeref(cPointerOffset(filnam, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) != i32(92)))) {
      strcat(tempbuf, __cxx_literal_55bd84ff901737e829b8);
    }
    strcat(tempbuf, filnam);
    (__cxx_global_cell_0c0d9a71eef382369e188fb4().value.fil = fopen(tempbuf, __cxx_literal_384adde444d935d66846));
    if (__cxx_global_cell_0c0d9a71eef382369e188fb4().value.fil) {
      (__cxx_global_cell_0c0d9a71eef382369e188fb4().value.comptyp = i32(0));
      (__cxx_global_cell_0c0d9a71eef382369e188fb4().value.seek0 = i32(0));
      (__cxx_global_cell_0c0d9a71eef382369e188fb4().value.leng = i32(buildvfs_flength__header_0b643cd4c0f7(fil)));
      (__cxx_global_cell_0c0d9a71eef382369e188fb4().value.pos = i32(0));
      (__cxx_global_cell_0c0d9a71eef382369e188fb4().value.i = i32(0));
      return i64(cSourceAddresses.encode(__cxx_global_cell_0c0d9a71eef382369e188fb4().value.fil));
    }
  }
  return i64(0);
}

// C/C++ source: source/build/src/kplib.cpp:2662
export let hfind = null;
function __cxx_static_address_10a264abfd37072da9013188() {
  return __cxx_static_address_10a264abfd37072da9013188.reference || (__cxx_static_address_10a264abfd37072da9013188.reference = {
    __cReference: true,
    get value() { return hfind; },
    set value(__cxx_lvalue_0) { hfind = __cxx_lvalue_0; }
  });
}
export function __cxx_private_cell_10a264abfd37072da9013188() { return __cxx_static_address_10a264abfd37072da9013188(); }

// C/C++ source: source/build/src/kplib.cpp:2663
export let findata = null;
function __cxx_static_address_2fae99cde3dce247c9a2190e() {
  return __cxx_static_address_2fae99cde3dce247c9a2190e.reference || (__cxx_static_address_2fae99cde3dce247c9a2190e.reference = {
    __cReference: true,
    get value() { return findata; },
    set value(__cxx_lvalue_0) { findata = __cxx_lvalue_0; }
  });
}
export function __cxx_private_cell_2fae99cde3dce247c9a2190e() { return __cxx_static_address_2fae99cde3dce247c9a2190e(); }

// C/C++ source: source/build/src/kplib.cpp:2673
export let srchstat = i32((-1));
function __cxx_static_address_823831e89d2903e406a4dfc7() {
  return __cxx_static_address_823831e89d2903e406a4dfc7.reference || (__cxx_static_address_823831e89d2903e406a4dfc7.reference = {
    __cReference: true,
    get value() { return srchstat; },
    set value(__cxx_lvalue_0) { srchstat = i32(__cxx_lvalue_0); }
  });
}
export function __cxx_private_cell_823831e89d2903e406a4dfc7() { return __cxx_static_address_823831e89d2903e406a4dfc7(); }

export let srchzoff = i32(0);
function __cxx_static_address_187a378358fa46f2f5c85783() {
  return __cxx_static_address_187a378358fa46f2f5c85783.reference || (__cxx_static_address_187a378358fa46f2f5c85783.reference = {
    __cReference: true,
    get value() { return srchzoff; },
    set value(__cxx_lvalue_0) { srchzoff = i32(__cxx_lvalue_0); }
  });
}
export function __cxx_private_cell_187a378358fa46f2f5c85783() { return __cxx_static_address_187a378358fa46f2f5c85783(); }

export let srchdoff = i32((-1));
function __cxx_static_address_0d0a678fe45f8fad2300da36() {
  return __cxx_static_address_0d0a678fe45f8fad2300da36.reference || (__cxx_static_address_0d0a678fe45f8fad2300da36.reference = {
    __cReference: true,
    get value() { return srchdoff; },
    set value(__cxx_lvalue_0) { srchdoff = i32(__cxx_lvalue_0); }
  });
}
export function __cxx_private_cell_0d0a678fe45f8fad2300da36() { return __cxx_static_address_0d0a678fe45f8fad2300da36(); }

export let wildstpathleng = 0;
function __cxx_static_address_cdbd1b981997730a505f4a19() {
  return __cxx_static_address_cdbd1b981997730a505f4a19.reference || (__cxx_static_address_cdbd1b981997730a505f4a19.reference = {
    __cReference: true,
    get value() { return wildstpathleng; },
    set value(__cxx_lvalue_0) { wildstpathleng = i32(__cxx_lvalue_0); }
  });
}
export function __cxx_private_cell_cdbd1b981997730a505f4a19() { return __cxx_static_address_cdbd1b981997730a505f4a19(); }

// C/C++ source: source/build/src/kplib.cpp:2674
export let wildst = (() => { const bytes = new Uint8Array(260); bytes.set([]); return bytes; })();
function __cxx_static_address_5b78b4a1c647c7f560583a85() {
  return __cxx_static_address_5b78b4a1c647c7f560583a85.reference || (__cxx_static_address_5b78b4a1c647c7f560583a85.reference = {
    __cReference: true,
    get value() { return wildst; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_5b78b4a1c647c7f560583a85() { return __cxx_static_address_5b78b4a1c647c7f560583a85(); }

export let newildst = (() => { const bytes = new Uint8Array(260); bytes.set([]); return bytes; })();
function __cxx_static_address_ab545bd2240c7bb3972e6488() {
  return __cxx_static_address_ab545bd2240c7bb3972e6488.reference || (__cxx_static_address_ab545bd2240c7bb3972e6488.reference = {
    __cReference: true,
    get value() { return newildst; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_ab545bd2240c7bb3972e6488() { return __cxx_static_address_ab545bd2240c7bb3972e6488(); }

// C/C++ source: source/build/src/kplib.cpp:2676
export function kzfindfilestart(st) {
  if (hfind) {
    closedir(hfind);
    (hfind = null);
  }
  strcpy(wildst, st);
  strcpy(newildst, st);
  (srchstat = i32(0));
  (srchzoff = i32(__cxx_private_cell_68d23d870c89fbf375ec9ee7().value));
  (srchdoff = i32(__cxx_private_cell_3061051e41549ca97da073af().value));
}

// C/C++ source: source/build/src/kplib.cpp:2688
const __cxx_literal_943d3651a2d857fd4247 = Uint8Array.from([46, 0]);
const __cxx_literal_097cfeb956829ca7f97b = Uint8Array.from([47, 0]);
const __cxx_literal_993c9768fa82b10de4a5 = Uint8Array.from([47, 0]);
export function kzfindfile(filnam) {
  let i, s;
  __source_loop_kzfindfile_beg: while (true) {
    ;
    ((cDeref(cPointerOffset(filnam, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(0) & 255)) & 255));
    if ((srchstat == 0)) {
      if ((!Boolean((cDeref(cPointerOffset(newildst, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))) {
        (srchstat = i32((-1)));
        return i32(0);
      }
      __source_control_0: do {
        (srchstat = i32(1));
        (wildstpathleng = i32(0));
        __source_control_1: for ((i = i32(0)); Boolean((cDeref(cPointerOffset(newildst, i, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)); ((__cxx_lvalue_1) => { const previous = __cxx_lvalue_1.value; const next = i32((previous + 1)); __cxx_lvalue_1.value = next; return previous; })(cRef(() => i, __cxx_lvalue_2 => { i = __cxx_lvalue_2; }))) {
          if (((i32((cDeref(cPointerOffset(newildst, i, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == i32(47)) || (i32((cDeref(cPointerOffset(newildst, i, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == i32(92)))) {
            (wildstpathleng = i32((i + 1)));
          }
        }
        memcpy(filnam, newildst, u64(wildstpathleng));
        if ((!hfind)) {
          s = __cxx_literal_943d3651a2d857fd4247;
          if ((wildstpathleng > 0)) {
            ((cDeref(cPointerOffset(filnam, wildstpathleng, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(0) & 255)) & 255));
            (s = filnam);
          }
          (hfind = opendir(s));
          if ((!hfind)) {
            if ((!__cxx_private_cell_b157606d4f95106080f2a466().value)) {
              return i32(0);
            }
            (srchstat = i32(2));
            continue __source_control_0;
          }
        }
        break __source_control_0;
        return i32(1);
      } while (Boolean(0));
    }
    if ((srchstat == 1)) {
      __source_control_2: while (Boolean(1)) {
        memcpy(filnam, newildst, u64(wildstpathleng));
        if (cPointerCompare((findata = readdir(hfind)), null, "==")) {
          closedir(hfind);
          (hfind = null);
          if ((!__cxx_private_cell_b157606d4f95106080f2a466().value)) {
            return i32(0);
          }
          (srchstat = i32(2));
          break __source_control_2;
        }
        (i = i32(wildstpathleng));
        if ((i32(cRecordObject(cRecordPointer(findata, {"align": 8, "arrayAlign": 1, "fields": {"d_ino": {"native": "BigUint64Array", "offset": 0, "size": 8}, "d_name": {"length": 256, "native": "Uint8Array", "offset": 19, "size": 256}, "d_off": {"native": "BigInt64Array", "offset": 8, "size": 8}, "d_reclen": {"native": "Uint16Array", "offset": 16, "size": 2}, "d_type": {"native": "Uint8Array", "offset": 18, "size": 1}}, "overlaps": false, "size": 280, "union": false}, {})).d_type) == i32(4))) {
          if (((i32((cDeref(cPointerOffset(cRecordObject(cRecordPointer(findata, {"align": 8, "arrayAlign": 1, "fields": {"d_ino": {"native": "BigUint64Array", "offset": 0, "size": 8}, "d_name": {"length": 256, "native": "Uint8Array", "offset": 19, "size": 256}, "d_off": {"native": "BigInt64Array", "offset": 8, "size": 8}, "d_reclen": {"native": "Uint16Array", "offset": 16, "size": 2}, "d_type": {"native": "Uint8Array", "offset": 18, "size": 1}}, "overlaps": false, "size": 280, "union": false}, {})).d_name, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == i32(46)) && (!Boolean((cDeref(cPointerOffset(cRecordObject(cRecordPointer(findata, {"align": 8, "arrayAlign": 1, "fields": {"d_ino": {"native": "BigUint64Array", "offset": 0, "size": 8}, "d_name": {"length": 256, "native": "Uint8Array", "offset": 19, "size": 256}, "d_off": {"native": "BigInt64Array", "offset": 8, "size": 8}, "d_reclen": {"native": "Uint16Array", "offset": 16, "size": 2}, "d_type": {"native": "Uint8Array", "offset": 18, "size": 1}}, "overlaps": false, "size": 280, "union": false}, {})).d_name, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value))))) {
            continue __source_control_2;
          }
        } else {
          if (((i32(cRecordObject(cRecordPointer(findata, {"align": 8, "arrayAlign": 1, "fields": {"d_ino": {"native": "BigUint64Array", "offset": 0, "size": 8}, "d_name": {"length": 256, "native": "Uint8Array", "offset": 19, "size": 256}, "d_off": {"native": "BigInt64Array", "offset": 8, "size": 8}, "d_reclen": {"native": "Uint16Array", "offset": 16, "size": 2}, "d_type": {"native": "Uint8Array", "offset": 18, "size": 1}}, "overlaps": false, "size": 280, "union": false}, {})).d_type) == i32(8)) || (i32(cRecordObject(cRecordPointer(findata, {"align": 8, "arrayAlign": 1, "fields": {"d_ino": {"native": "BigUint64Array", "offset": 0, "size": 8}, "d_name": {"length": 256, "native": "Uint8Array", "offset": 19, "size": 256}, "d_off": {"native": "BigInt64Array", "offset": 8, "size": 8}, "d_reclen": {"native": "Uint16Array", "offset": 16, "size": 2}, "d_type": {"native": "Uint8Array", "offset": 18, "size": 1}}, "overlaps": false, "size": 280, "union": false}, {})).d_type) == i32(10)))) {
            if ((i32((cDeref(cPointerOffset(cRecordObject(cRecordPointer(findata, {"align": 8, "arrayAlign": 1, "fields": {"d_ino": {"native": "BigUint64Array", "offset": 0, "size": 8}, "d_name": {"length": 256, "native": "Uint8Array", "offset": 19, "size": 256}, "d_off": {"native": "BigInt64Array", "offset": 8, "size": 8}, "d_reclen": {"native": "Uint16Array", "offset": 16, "size": 2}, "d_type": {"native": "Uint8Array", "offset": 18, "size": 1}}, "overlaps": false, "size": 280, "union": false}, {})).d_name, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == i32(46))) {
              continue __source_control_2;
            }
          } else {
            continue __source_control_2;
          }
        }
        if ((!Boolean(wildmatch(cRecordObject(cRecordPointer(findata, {"align": 8, "arrayAlign": 1, "fields": {"d_ino": {"native": "BigUint64Array", "offset": 0, "size": 8}, "d_name": {"length": 256, "native": "Uint8Array", "offset": 19, "size": 256}, "d_off": {"native": "BigInt64Array", "offset": 8, "size": 8}, "d_reclen": {"native": "Uint16Array", "offset": 16, "size": 2}, "d_type": {"native": "Uint8Array", "offset": 18, "size": 1}}, "overlaps": false, "size": 280, "union": false}, {})).d_name, cPointerOffset(newildst, wildstpathleng, Uint8Array.BYTES_PER_ELEMENT))))) {
          continue __source_control_2;
        }
        strcpy(cPointerOffset(filnam, i, Uint8Array.BYTES_PER_ELEMENT), cRecordObject(cRecordPointer(findata, {"align": 8, "arrayAlign": 1, "fields": {"d_ino": {"native": "BigUint64Array", "offset": 0, "size": 8}, "d_name": {"length": 256, "native": "Uint8Array", "offset": 19, "size": 256}, "d_off": {"native": "BigInt64Array", "offset": 8, "size": 8}, "d_reclen": {"native": "Uint16Array", "offset": 16, "size": 2}, "d_type": {"native": "Uint8Array", "offset": 18, "size": 1}}, "overlaps": false, "size": 280, "union": false}, {})).d_name);
        if ((i32(cRecordObject(cRecordPointer(findata, {"align": 8, "arrayAlign": 1, "fields": {"d_ino": {"native": "BigUint64Array", "offset": 0, "size": 8}, "d_name": {"length": 256, "native": "Uint8Array", "offset": 19, "size": 256}, "d_off": {"native": "BigInt64Array", "offset": 8, "size": 8}, "d_reclen": {"native": "Uint16Array", "offset": 16, "size": 2}, "d_type": {"native": "Uint8Array", "offset": 18, "size": 1}}, "overlaps": false, "size": 280, "union": false}, {})).d_type) == i32(4))) {
          strcat(cPointerOffset(filnam, i, Uint8Array.BYTES_PER_ELEMENT), __cxx_literal_097cfeb956829ca7f97b);
        }
        return i32(1);
      }
    }
    __source_control_3: while ((srchstat == 2)) {
      if ((srchzoff < 0)) {
        (srchstat = i32(3));
        break __source_control_3;
      }
      if (Boolean(wildmatch(cPointerOffset(__cxx_private_cell_b157606d4f95106080f2a466().value, i32((srchzoff + 21)), Uint8Array.BYTES_PER_ELEMENT), newildst))) {
        ((cDeref(cPointerOffset(filnam, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32(124) & 255));
        strcpy(cPointerOffset(filnam, 1, Uint8Array.BYTES_PER_ELEMENT), cPointerOffset(__cxx_private_cell_b157606d4f95106080f2a466().value, i32((srchzoff + 21)), Uint8Array.BYTES_PER_ELEMENT));
        (srchzoff = i32(B_UNBUF32__header_c1468ac058f1(cPointerOffset(__cxx_private_cell_b157606d4f95106080f2a466().value, i32((srchzoff + 4)), Uint8Array.BYTES_PER_ELEMENT))));
        return i32(1);
      }
      (srchzoff = i32(B_UNBUF32__header_c1468ac058f1(cPointerOffset(__cxx_private_cell_b157606d4f95106080f2a466().value, i32((srchzoff + 4)), Uint8Array.BYTES_PER_ELEMENT))));
    }
    __source_control_4: while ((srchstat == 3)) {
      if ((srchdoff < 0)) {
        (srchstat = i32((-1)));
        break __source_control_4;
      }
      strcpy(newildst, cPointerOffset(__cxx_private_cell_b157606d4f95106080f2a466().value, i32((srchdoff + 4)), Uint8Array.BYTES_PER_ELEMENT));
      (i = i32(strlen(newildst)));
      if (((((Boolean(i) && (i32((cDeref(cPointerOffset(newildst, i32((i - 1)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) != i32(47))) && (i32((cDeref(cPointerOffset(newildst, i32((i - 1)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) != i32(92))) && (i32((cDeref(cPointerOffset(filnam, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) != i32(47))) && (i32((cDeref(cPointerOffset(filnam, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) != i32(92)))) {
        strcat(newildst, __cxx_literal_993c9768fa82b10de4a5);
      }
      strcat(newildst, wildst);
      (srchdoff = i32(B_UNBUF32__header_c1468ac058f1(cPointerOffset(__cxx_private_cell_b157606d4f95106080f2a466().value, srchdoff, Uint8Array.BYTES_PER_ELEMENT))));
      (srchstat = i32(0));
      continue __source_loop_kzfindfile_beg;
    }
    break;
  }
  return i32(0);
}

// C/C++ source: source/build/src/kplib.cpp:2810
export function putbuf4zip(buf, uncomp0, uncomp1) {
  const __cxx_lvalue_0 = cRef(() => uncomp0, __cxx_lvalue_2 => { uncomp0 = i32(__cxx_lvalue_2); });
  const __cxx_lvalue_1 = cRef(() => uncomp1, __cxx_lvalue_3 => { uncomp1 = i32(__cxx_lvalue_3); });
  let i0;
  let i1;
  (i0 = i32((max__template_b1cfaf2244c73238(__cxx_lvalue_0, cObjectFieldRef(__cxx_global_cell_0c0d9a71eef382369e188fb4().value, "pos"))).value));
  (i1 = i32((min__template_774131ccff66371d(__cxx_lvalue_1, cObjectFieldRef(__cxx_global_cell_0c0d9a71eef382369e188fb4().value, "endpos"))).value));
  if ((i0 < i1)) {
    memcpy(cPointerOffset(__cxx_private_cell_bb1f28aaaf1422ad38efa78a().value, i0, Uint8Array.BYTES_PER_ELEMENT), cPointerOffset(buf, i32((i0 - uncomp0)), Uint8Array.BYTES_PER_ELEMENT), u64(i32((i1 - i0))));
  }
}

// C/C++ source: source/build/src/kplib.cpp:2821
export function kzread(buffer, leng) {
  const __cxx_lvalue_0 = cRef(() => leng, __cxx_lvalue_40 => { leng = i32(__cxx_lvalue_40); });
  let __cxx_lvalue_1 = null;
  let i, j, k, bfinal, btype, hlit, hdist;







  if (((!__cxx_global_cell_0c0d9a71eef382369e188fb4().value.fil) || (leng <= 0))) {
    return i32(0);
  }
  __source_exit_retkzread: {
    if ((!__cxx_lvalue_1 && ((__cxx_global_cell_0c0d9a71eef382369e188fb4().value.comptyp == 0)))) {
      if ((__cxx_global_cell_0c0d9a71eef382369e188fb4().value.pos != __cxx_global_cell_0c0d9a71eef382369e188fb4().value.i)) {
        fseek(__cxx_global_cell_0c0d9a71eef382369e188fb4().value.fil, i64(i32((__cxx_global_cell_0c0d9a71eef382369e188fb4().value.seek0 + __cxx_global_cell_0c0d9a71eef382369e188fb4().value.pos))), 0);
        (__cxx_global_cell_0c0d9a71eef382369e188fb4().value.i = i32(__cxx_global_cell_0c0d9a71eef382369e188fb4().value.pos));
      }
      (i = i32((min__template_774131ccff66371d(((__cxx_lvalue_2) => cRef(() => __cxx_lvalue_2, () => { throw new TypeError("const C++ reference write"); }))(i32((__cxx_global_cell_0c0d9a71eef382369e188fb4().value.leng - __cxx_global_cell_0c0d9a71eef382369e188fb4().value.pos))), __cxx_lvalue_0)).value));
      fread(buffer, u64(i), u64(1), __cxx_global_cell_0c0d9a71eef382369e188fb4().value.fil);
      ((__cxx_lvalue_3) => (__cxx_lvalue_3.value = i32((Number(__cxx_lvalue_3.value) + Number(i)))))(cObjectFieldRef(__cxx_global_cell_0c0d9a71eef382369e188fb4().value, "i"));
    } else {
      if (((__cxx_lvalue_1 === "kzreadplc0" || __cxx_lvalue_1 === "kzreadplc1" || __cxx_lvalue_1 === "kzreadplc2" || __cxx_lvalue_1 === "kzreadplc3") || (!__cxx_lvalue_1 && ((__cxx_global_cell_0c0d9a71eef382369e188fb4().value.comptyp == 8))))) {
        (__cxx_private_cell_84b58697e1377ebb6589640f().value = i32(1));
        (__cxx_private_cell_bb1f28aaaf1422ad38efa78a().value = cTypedPointer(buffer, Uint8Array));
        (__cxx_private_cell_bb1f28aaaf1422ad38efa78a().value = cPointerOffset(__cxx_private_cell_bb1f28aaaf1422ad38efa78a().value, (-__cxx_global_cell_0c0d9a71eef382369e188fb4().value.pos), Uint8Array.BYTES_PER_ELEMENT));
        (__cxx_global_cell_0c0d9a71eef382369e188fb4().value.endpos = i32((min__template_774131ccff66371d(((__cxx_lvalue_4) => cRef(() => __cxx_lvalue_4, () => { throw new TypeError("const C++ reference write"); }))(i32((__cxx_global_cell_0c0d9a71eef382369e188fb4().value.pos + leng))), cObjectFieldRef(__cxx_global_cell_0c0d9a71eef382369e188fb4().value, "leng"))).value));
        if ((__cxx_global_cell_0c0d9a71eef382369e188fb4().value.endpos == __cxx_global_cell_0c0d9a71eef382369e188fb4().value.pos)) {
          return i32(0);
        }
        if ((__cxx_global_cell_0c0d9a71eef382369e188fb4().value.pos < i32((__cxx_private_cell_19fba13327f490e0c98ebd37().value - 32768)))) {
          if (Boolean(__cxx_global_cell_0c0d9a71eef382369e188fb4().value.comptell)) {
            fseek(__cxx_global_cell_0c0d9a71eef382369e188fb4().value.fil, i64(__cxx_global_cell_0c0d9a71eef382369e188fb4().value.seek0), 0);
          }
          (__cxx_private_cell_19fba13327f490e0c98ebd37().value = i32(0));
          (__cxx_private_cell_57a5d28f57b8e3415c7b14e5().value = i32(16384));
          (__cxx_global_cell_0c0d9a71eef382369e188fb4().value.jmpplc = i32(0));
          (__cxx_global_cell_0c0d9a71eef382369e188fb4().value.comptell = i32((min__template_774131ccff66371d(cObjectFieldRef(__cxx_global_cell_0c0d9a71eef382369e188fb4().value, "compleng"), ((__cxx_lvalue_5) => cRef(() => __cxx_lvalue_5, () => { throw new TypeError("const C++ reference write"); }))(i32(131072)))).value));
          fread(cPointerOffset(__cxx_private_cell_cb0af6faa2121464215cdde3().value, 0, Uint8Array.BYTES_PER_ELEMENT), u64(__cxx_global_cell_0c0d9a71eef382369e188fb4().value.comptell), u64(1), __cxx_global_cell_0c0d9a71eef382369e188fb4().value.fil);
          (__cxx_private_cell_b26e6394b97f66d1fd62bd8c().value = i32((-i32((i32((i32(131072) - 4)) << 3)))));
          (__cxx_private_cell_3dab0cd39cd715da7cf79ad8().value = cPointerOffset(__cxx_private_cell_cb0af6faa2121464215cdde3().value, (-i32((__cxx_private_cell_b26e6394b97f66d1fd62bd8c().value >> 3))), Uint8Array.BYTES_PER_ELEMENT));
        } else {
          (i = i32((max__template_b1cfaf2244c73238(((__cxx_lvalue_6) => cRef(() => __cxx_lvalue_6, () => { throw new TypeError("const C++ reference write"); }))(i32((__cxx_private_cell_19fba13327f490e0c98ebd37().value - 32768))), ((__cxx_lvalue_7) => cRef(() => __cxx_lvalue_7, () => { throw new TypeError("const C++ reference write"); }))(0))).value));
          (j = i32((__cxx_private_cell_57a5d28f57b8e3415c7b14e5().value - 16384)));
          if ((__cxx_global_cell_0c0d9a71eef382369e188fb4().value.endpos <= __cxx_private_cell_19fba13327f490e0c98ebd37().value)) {
            (j = i32(__cxx_global_cell_0c0d9a71eef382369e188fb4().value.endpos));
          }
          if ((!Boolean(i32((i32((i ^ j)) & 32768))))) {
            putbuf4zip(cPointerOffset(__cxx_private_cell_fd8146c0023b762cfb4928be().value, i32((i & 32767)), Uint8Array.BYTES_PER_ELEMENT), i, j);
          } else {
            putbuf4zip(cPointerOffset(__cxx_private_cell_fd8146c0023b762cfb4928be().value, i32((i & 32767)), Uint8Array.BYTES_PER_ELEMENT), i, i32((j & (~32767))));
            putbuf4zip(__cxx_private_cell_fd8146c0023b762cfb4928be().value, i32((j & (~32767))), j);
          }
          if ((__cxx_global_cell_0c0d9a71eef382369e188fb4().value.endpos <= __cxx_private_cell_19fba13327f490e0c98ebd37().value)) {
            break __source_exit_retkzread;
          }
        }
        switch (__cxx_global_cell_0c0d9a71eef382369e188fb4().value.jmpplc) {
          case 0: __cxx_lvalue_1 = "kzreadplc0"; break;
          case 1: __cxx_lvalue_1 = "kzreadplc1"; break;
          case 2: __cxx_lvalue_1 = "kzreadplc2"; break;
          case 3: __cxx_lvalue_1 = "kzreadplc3"; break;
        }
        // Original resume label: kzreadplc0
        if (!__cxx_lvalue_1 || __cxx_lvalue_1 === "kzreadplc0") {
          __cxx_lvalue_1 = null;
          if (!__cxx_lvalue_1) {
            ;
          }
        }
        if (!__cxx_lvalue_1 || __cxx_lvalue_1 === "kzreadplc1" || __cxx_lvalue_1 === "kzreadplc2") {
          __source_control_0: do {
            if (!__cxx_lvalue_1) {
              (bfinal = i32(getbits(1)));
            }
            if (!__cxx_lvalue_1) {
              (btype = i32(getbits(2)));
            }
            if (!__cxx_lvalue_1 || __cxx_lvalue_1 === "kzreadplc1") {
              if (((__cxx_lvalue_1 === "kzreadplc1") || (!__cxx_lvalue_1 && ((btype == 0))))) {
                if (!__cxx_lvalue_1) {
                  suckbits(i32(((-__cxx_private_cell_b26e6394b97f66d1fd62bd8c().value) & 7)));
                }
                if (!__cxx_lvalue_1) {
                  (i = i32(getbits(16)));
                }
                if (!__cxx_lvalue_1) {
                  if ((i32((getbits(16) ^ i)) != 65535)) {
                    if (!__cxx_lvalue_1) {
                      return i32((-1));
                    }
                  }
                }
                if (!__cxx_lvalue_1 || __cxx_lvalue_1 === "kzreadplc1") {
                  __source_control_1: for (; ((__cxx_lvalue_1 === "kzreadplc1") || (!__cxx_lvalue_1 && (Boolean(i)))); ((__cxx_lvalue_8) => { const previous = __cxx_lvalue_8.value; const next = i32((previous - 1)); __cxx_lvalue_8.value = next; return previous; })(cRef(() => i, __cxx_lvalue_9 => { i = __cxx_lvalue_9; }))) {
                    if (!__cxx_lvalue_1 || __cxx_lvalue_1 === "kzreadplc1") {
                      if (((__cxx_lvalue_1 === "kzreadplc1") || (!__cxx_lvalue_1 && ((__cxx_private_cell_19fba13327f490e0c98ebd37().value >= __cxx_private_cell_57a5d28f57b8e3415c7b14e5().value))))) {
                        if (!__cxx_lvalue_1) {
                          putbuf4zip(cPointerOffset(__cxx_private_cell_fd8146c0023b762cfb4928be().value, i32((i32((__cxx_private_cell_57a5d28f57b8e3415c7b14e5().value - 16384)) & 32767)), Uint8Array.BYTES_PER_ELEMENT), i32((__cxx_private_cell_57a5d28f57b8e3415c7b14e5().value - 16384)), __cxx_private_cell_57a5d28f57b8e3415c7b14e5().value);
                        }
                        if (!__cxx_lvalue_1) {
                          (__cxx_private_cell_57a5d28f57b8e3415c7b14e5().value = i32((Number(__cxx_private_cell_57a5d28f57b8e3415c7b14e5().value) + Number(16384))));
                        }
                        if (!__cxx_lvalue_1 || __cxx_lvalue_1 === "kzreadplc1") {
                          if (((__cxx_lvalue_1 === "kzreadplc1") || (!__cxx_lvalue_1 && ((i32((__cxx_private_cell_57a5d28f57b8e3415c7b14e5().value - 16384)) >= __cxx_global_cell_0c0d9a71eef382369e188fb4().value.endpos))))) {
                            if (!__cxx_lvalue_1) {
                              (__cxx_global_cell_0c0d9a71eef382369e188fb4().value.jmpplc = i32(1));
                            }
                            if (!__cxx_lvalue_1) {
                              (__cxx_global_cell_0c0d9a71eef382369e188fb4().value.i = i32(i));
                            }
                            if (!__cxx_lvalue_1) {
                              (__cxx_global_cell_0c0d9a71eef382369e188fb4().value.bfinal = i32(bfinal));
                            }
                            if (!__cxx_lvalue_1) {
                              break __source_exit_retkzread;
                            }
                            // Original resume label: kzreadplc1
                            if (!__cxx_lvalue_1 || __cxx_lvalue_1 === "kzreadplc1") {
                              __cxx_lvalue_1 = null;
                              if (!__cxx_lvalue_1) {
                                ;
                              }
                            }
                            if (!__cxx_lvalue_1) {
                              (i = i32(__cxx_global_cell_0c0d9a71eef382369e188fb4().value.i));
                            }
                            if (!__cxx_lvalue_1) {
                              (bfinal = i32(__cxx_global_cell_0c0d9a71eef382369e188fb4().value.bfinal));
                            }
                          }
                        }
                      }
                    }
                    if (!__cxx_lvalue_1) {
                      ((cDeref(cPointerOffset(__cxx_private_cell_fd8146c0023b762cfb4928be().value, i32((((__cxx_lvalue_10) => { const previous = __cxx_lvalue_10.value; const next = i32((previous + 1)); __cxx_lvalue_10.value = next; return previous; })(__cxx_private_cell_19fba13327f490e0c98ebd37()) & 32767)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32((u32(getbits(8)) & 255)) & 255)) & 255));
                    }
                  }
                }
                if (!__cxx_lvalue_1) {
                  continue __source_control_0;
                }
              }
            }
            if (!__cxx_lvalue_1) {
              if ((btype == 3)) {
                if (!__cxx_lvalue_1) {
                  continue __source_control_0;
                }
              }
            }
            if (!__cxx_lvalue_1) {
              if ((btype == 1)) {
                if (!__cxx_lvalue_1) {
                  (hlit = i32(288));
                }
                if (!__cxx_lvalue_1) {
                  (hdist = i32(32));
                }
                if (!__cxx_lvalue_1) {
                  (i = i32(0));
                }
                if (!__cxx_lvalue_1) {
                  __source_control_2: for (; (i < 144); ((__cxx_lvalue_11) => { const previous = __cxx_lvalue_11.value; const next = i32((previous + 1)); __cxx_lvalue_11.value = next; return previous; })(cRef(() => i, __cxx_lvalue_12 => { i = __cxx_lvalue_12; }))) {
                    if (!__cxx_lvalue_1) {
                      ((cDeref(cPointerOffset(__cxx_private_cell_439d0ebacabacbc4bb46f782().value, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(8));
                    }
                  }
                }
                if (!__cxx_lvalue_1) {
                  __source_control_3: for (; (i < 256); ((__cxx_lvalue_13) => { const previous = __cxx_lvalue_13.value; const next = i32((previous + 1)); __cxx_lvalue_13.value = next; return previous; })(cRef(() => i, __cxx_lvalue_14 => { i = __cxx_lvalue_14; }))) {
                    if (!__cxx_lvalue_1) {
                      ((cDeref(cPointerOffset(__cxx_private_cell_439d0ebacabacbc4bb46f782().value, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(9));
                    }
                  }
                }
                if (!__cxx_lvalue_1) {
                  __source_control_4: for (; (i < 280); ((__cxx_lvalue_15) => { const previous = __cxx_lvalue_15.value; const next = i32((previous + 1)); __cxx_lvalue_15.value = next; return previous; })(cRef(() => i, __cxx_lvalue_16 => { i = __cxx_lvalue_16; }))) {
                    if (!__cxx_lvalue_1) {
                      ((cDeref(cPointerOffset(__cxx_private_cell_439d0ebacabacbc4bb46f782().value, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(7));
                    }
                  }
                }
                if (!__cxx_lvalue_1) {
                  __source_control_5: for (; (i < 288); ((__cxx_lvalue_17) => { const previous = __cxx_lvalue_17.value; const next = i32((previous + 1)); __cxx_lvalue_17.value = next; return previous; })(cRef(() => i, __cxx_lvalue_18 => { i = __cxx_lvalue_18; }))) {
                    if (!__cxx_lvalue_1) {
                      ((cDeref(cPointerOffset(__cxx_private_cell_439d0ebacabacbc4bb46f782().value, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(8));
                    }
                  }
                }
                if (!__cxx_lvalue_1) {
                  __source_control_6: for (; (i < 320); ((__cxx_lvalue_19) => { const previous = __cxx_lvalue_19.value; const next = i32((previous + 1)); __cxx_lvalue_19.value = next; return previous; })(cRef(() => i, __cxx_lvalue_20 => { i = __cxx_lvalue_20; }))) {
                    if (!__cxx_lvalue_1) {
                      ((cDeref(cPointerOffset(__cxx_private_cell_439d0ebacabacbc4bb46f782().value, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(5));
                    }
                  }
                }
              } else {
                if (!__cxx_lvalue_1) {
                  (hlit = i32((getbits(5) + 257)));
                }
                if (!__cxx_lvalue_1) {
                  (hdist = i32((getbits(5) + 1)));
                }
                if (!__cxx_lvalue_1) {
                  (j = i32((getbits(4) + 4)));
                }
                if (!__cxx_lvalue_1) {
                  __source_control_7: for ((i = i32(0)); (i < j); ((__cxx_lvalue_21) => { const previous = __cxx_lvalue_21.value; const next = i32((previous + 1)); __cxx_lvalue_21.value = next; return previous; })(cRef(() => i, __cxx_lvalue_22 => { i = __cxx_lvalue_22; }))) {
                    if (!__cxx_lvalue_1) {
                      ((cDeref(cPointerOffset(__cxx_private_cell_73f971a45117b405bae691bf().value, (cDeref(cPointerOffset(__cxx_private_cell_258736156e619bfc312178fd().value, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(getbits(3)));
                    }
                  }
                }
                if (!__cxx_lvalue_1) {
                  __source_control_8: for (; (i < 19); ((__cxx_lvalue_23) => { const previous = __cxx_lvalue_23.value; const next = i32((previous + 1)); __cxx_lvalue_23.value = next; return previous; })(cRef(() => i, __cxx_lvalue_24 => { i = __cxx_lvalue_24; }))) {
                    if (!__cxx_lvalue_1) {
                      ((cDeref(cPointerOffset(__cxx_private_cell_73f971a45117b405bae691bf().value, (cDeref(cPointerOffset(__cxx_private_cell_258736156e619bfc312178fd().value, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(0));
                    }
                  }
                }
                if (!__cxx_lvalue_1) {
                  hufgencode(__cxx_private_cell_73f971a45117b405bae691bf().value, 19, __cxx_private_cell_5156c579fa7a8389c264632c().value, __cxx_private_cell_2a654032177c315b4aec897b().value);
                }
                if (!__cxx_lvalue_1) {
                  (j = i32(0));
                }
                if (!__cxx_lvalue_1) {
                  (k = i32((hlit + hdist)));
                }
                if (!__cxx_lvalue_1) {
                  __source_control_9: while ((j < k)) {
                    if (!__cxx_lvalue_1) {
                      (i = i32(hufgetsym(__cxx_private_cell_5156c579fa7a8389c264632c().value, __cxx_private_cell_2a654032177c315b4aec897b().value)));
                    }
                    if (!__cxx_lvalue_1) {
                      if ((i < 16)) {
                        if (!__cxx_lvalue_1) {
                          ((cDeref(cPointerOffset(__cxx_private_cell_439d0ebacabacbc4bb46f782().value, ((__cxx_lvalue_25) => { const previous = __cxx_lvalue_25.value; const next = i32((previous + 1)); __cxx_lvalue_25.value = next; return previous; })(cRef(() => j, __cxx_lvalue_26 => { j = __cxx_lvalue_26; })), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(i));
                        }
                        if (!__cxx_lvalue_1) {
                          continue __source_control_9;
                        }
                      }
                    }
                    if (!__cxx_lvalue_1) {
                      if ((i == 16)) {
                        if (!__cxx_lvalue_1) {
                          __source_control_10: for ((i = i32((getbits(2) + 3))); Boolean(i); ((__cxx_lvalue_27) => { const previous = __cxx_lvalue_27.value; const next = i32((previous - 1)); __cxx_lvalue_27.value = next; return previous; })(cRef(() => i, __cxx_lvalue_28 => { i = __cxx_lvalue_28; }))) {
                            if (!__cxx_lvalue_1) {
                              ((cDeref(cPointerOffset(__cxx_private_cell_439d0ebacabacbc4bb46f782().value, j, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((cDeref(cPointerOffset(__cxx_private_cell_439d0ebacabacbc4bb46f782().value, i32((j - 1)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
                            }
                            if (!__cxx_lvalue_1) {
                              ((__cxx_lvalue_29) => { const previous = __cxx_lvalue_29.value; const next = i32((previous + 1)); __cxx_lvalue_29.value = next; return previous; })(cRef(() => j, __cxx_lvalue_30 => { j = __cxx_lvalue_30; }));
                            }
                          }
                        }
                      } else {
                        if (!__cxx_lvalue_1) {
                          if ((i == 17)) {
                            if (!__cxx_lvalue_1) {
                              (i = i32((getbits(3) + 3)));
                            }
                          } else {
                            if (!__cxx_lvalue_1) {
                              (i = i32((getbits(7) + 11)));
                            }
                          }
                        }
                        if (!__cxx_lvalue_1) {
                          __source_control_11: for (; Boolean(i); ((__cxx_lvalue_31) => { const previous = __cxx_lvalue_31.value; const next = i32((previous - 1)); __cxx_lvalue_31.value = next; return previous; })(cRef(() => i, __cxx_lvalue_32 => { i = __cxx_lvalue_32; }))) {
                            if (!__cxx_lvalue_1) {
                              ((cDeref(cPointerOffset(__cxx_private_cell_439d0ebacabacbc4bb46f782().value, ((__cxx_lvalue_33) => { const previous = __cxx_lvalue_33.value; const next = i32((previous + 1)); __cxx_lvalue_33.value = next; return previous; })(cRef(() => j, __cxx_lvalue_34 => { j = __cxx_lvalue_34; })), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(0));
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
            if (!__cxx_lvalue_1) {
              hufgencode(__cxx_private_cell_439d0ebacabacbc4bb46f782().value, hlit, __cxx_private_cell_5156c579fa7a8389c264632c().value, __cxx_private_cell_2a654032177c315b4aec897b().value);
            }
            if (!__cxx_lvalue_1) {
              qhufgencode(__cxx_private_cell_5156c579fa7a8389c264632c().value, __cxx_private_cell_2a654032177c315b4aec897b().value, __cxx_private_cell_23f9e1083f5f338d4e2b34d7().value, __cxx_private_cell_efafaac33827fb77a02fa134().value, 9);
            }
            if (!__cxx_lvalue_1) {
              hufgencode(cPointerOffset(__cxx_private_cell_439d0ebacabacbc4bb46f782().value, hlit, Int32Array.BYTES_PER_ELEMENT), hdist, __cxx_private_cell_3927a84e1afc8dfb325bad43().value, __cxx_private_cell_00edfc6e9ac95cacc45ca40e().value);
            }
            if (!__cxx_lvalue_1) {
              qhufgencode(__cxx_private_cell_3927a84e1afc8dfb325bad43().value, __cxx_private_cell_00edfc6e9ac95cacc45ca40e().value, __cxx_private_cell_a53b89e0c4766998f8de8a84().value, __cxx_private_cell_f4b438f749a364d46c61198d().value, 6);
            }
            if (!__cxx_lvalue_1 || __cxx_lvalue_1 === "kzreadplc2") {
              __source_control_12: while (((__cxx_lvalue_1 === "kzreadplc2") || (!__cxx_lvalue_1 && (Boolean(1))))) {
                if (!__cxx_lvalue_1 || __cxx_lvalue_1 === "kzreadplc2") {
                  if (((__cxx_lvalue_1 === "kzreadplc2") || (!__cxx_lvalue_1 && ((__cxx_private_cell_19fba13327f490e0c98ebd37().value >= __cxx_private_cell_57a5d28f57b8e3415c7b14e5().value))))) {
                    if (!__cxx_lvalue_1) {
                      putbuf4zip(cPointerOffset(__cxx_private_cell_fd8146c0023b762cfb4928be().value, i32((i32((__cxx_private_cell_57a5d28f57b8e3415c7b14e5().value - 16384)) & 32767)), Uint8Array.BYTES_PER_ELEMENT), i32((__cxx_private_cell_57a5d28f57b8e3415c7b14e5().value - 16384)), __cxx_private_cell_57a5d28f57b8e3415c7b14e5().value);
                    }
                    if (!__cxx_lvalue_1) {
                      (__cxx_private_cell_57a5d28f57b8e3415c7b14e5().value = i32((Number(__cxx_private_cell_57a5d28f57b8e3415c7b14e5().value) + Number(16384))));
                    }
                    if (!__cxx_lvalue_1 || __cxx_lvalue_1 === "kzreadplc2") {
                      if (((__cxx_lvalue_1 === "kzreadplc2") || (!__cxx_lvalue_1 && ((i32((__cxx_private_cell_57a5d28f57b8e3415c7b14e5().value - 16384)) >= __cxx_global_cell_0c0d9a71eef382369e188fb4().value.endpos))))) {
                        if (!__cxx_lvalue_1) {
                          (__cxx_global_cell_0c0d9a71eef382369e188fb4().value.jmpplc = i32(2));
                        }
                        if (!__cxx_lvalue_1) {
                          (__cxx_global_cell_0c0d9a71eef382369e188fb4().value.bfinal = i32(bfinal));
                        }
                        if (!__cxx_lvalue_1) {
                          break __source_exit_retkzread;
                        }
                        // Original resume label: kzreadplc2
                        if (!__cxx_lvalue_1 || __cxx_lvalue_1 === "kzreadplc2") {
                          __cxx_lvalue_1 = null;
                          if (!__cxx_lvalue_1) {
                            ;
                          }
                        }
                        if (!__cxx_lvalue_1) {
                          (bfinal = i32(__cxx_global_cell_0c0d9a71eef382369e188fb4().value.bfinal));
                        }
                      }
                    }
                  }
                }
                if (!__cxx_lvalue_1) {
                  (k = i32(peekbits(9)));
                }
                if (!__cxx_lvalue_1) {
                  if (Boolean((cDeref(cPointerOffset(__cxx_private_cell_efafaac33827fb77a02fa134().value, k, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value))) {
                    if (!__cxx_lvalue_1) {
                      (i = i32((cDeref(cPointerOffset(__cxx_private_cell_23f9e1083f5f338d4e2b34d7().value, k, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
                    }
                    if (!__cxx_lvalue_1) {
                      suckbits(i32((cDeref(cPointerOffset(__cxx_private_cell_efafaac33827fb77a02fa134().value, k, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)));
                    }
                  } else {
                    if (!__cxx_lvalue_1) {
                      (i = i32(hufgetsym(__cxx_private_cell_5156c579fa7a8389c264632c().value, __cxx_private_cell_2a654032177c315b4aec897b().value)));
                    }
                  }
                }
                if (!__cxx_lvalue_1) {
                  if ((i < 256)) {
                    if (!__cxx_lvalue_1) {
                      ((cDeref(cPointerOffset(__cxx_private_cell_fd8146c0023b762cfb4928be().value, i32((((__cxx_lvalue_35) => { const previous = __cxx_lvalue_35.value; const next = i32((previous + 1)); __cxx_lvalue_35.value = next; return previous; })(__cxx_private_cell_19fba13327f490e0c98ebd37()) & 32767)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32((u32(i) & 255)) & 255)) & 255));
                    }
                    if (!__cxx_lvalue_1) {
                      continue __source_control_12;
                    }
                  }
                }
                if (!__cxx_lvalue_1) {
                  if ((i == 256)) {
                    if (!__cxx_lvalue_1) {
                      break __source_control_12;
                    }
                  }
                }
                if (!__cxx_lvalue_1) {
                  (i = i32((getbits((cDeref(cPointerOffset((cPointerElementRef(__cxx_private_cell_44e9d131024042d9f1569617().value, i32((i32((i + 30)) - 257))).value), 0, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)) + (cDeref(cPointerOffset((cPointerElementRef(__cxx_private_cell_44e9d131024042d9f1569617().value, i32((i32((i + 30)) - 257))).value), 1, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))));
                }
                if (!__cxx_lvalue_1) {
                  (k = i32(peekbits(6)));
                }
                if (!__cxx_lvalue_1) {
                  if (Boolean((cDeref(cPointerOffset(__cxx_private_cell_f4b438f749a364d46c61198d().value, k, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value))) {
                    if (!__cxx_lvalue_1) {
                      (j = i32((cDeref(cPointerOffset(__cxx_private_cell_a53b89e0c4766998f8de8a84().value, k, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
                    }
                    if (!__cxx_lvalue_1) {
                      suckbits(i32((cDeref(cPointerOffset(__cxx_private_cell_f4b438f749a364d46c61198d().value, k, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)));
                    }
                  } else {
                    if (!__cxx_lvalue_1) {
                      (j = i32(hufgetsym(__cxx_private_cell_3927a84e1afc8dfb325bad43().value, __cxx_private_cell_00edfc6e9ac95cacc45ca40e().value)));
                    }
                  }
                }
                if (!__cxx_lvalue_1) {
                  (j = i32((getbits((cDeref(cPointerOffset((cPointerElementRef(__cxx_private_cell_44e9d131024042d9f1569617().value, j).value), 0, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)) + (cDeref(cPointerOffset((cPointerElementRef(__cxx_private_cell_44e9d131024042d9f1569617().value, j).value), 1, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))));
                }
                if (!__cxx_lvalue_1) {
                  __source_control_13: for (; Boolean(i); (((__cxx_lvalue_36) => { const previous = __cxx_lvalue_36.value; const next = i32((previous - 1)); __cxx_lvalue_36.value = next; return previous; })(cRef(() => i, __cxx_lvalue_37 => { i = __cxx_lvalue_37; })), ((__cxx_lvalue_38) => { const previous = __cxx_lvalue_38.value; const next = i32((previous + 1)); __cxx_lvalue_38.value = next; return previous; })(__cxx_private_cell_19fba13327f490e0c98ebd37()))) {
                    if (!__cxx_lvalue_1) {
                      ((cDeref(cPointerOffset(__cxx_private_cell_fd8146c0023b762cfb4928be().value, i32((__cxx_private_cell_19fba13327f490e0c98ebd37().value & 32767)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((cDeref(cPointerOffset(__cxx_private_cell_fd8146c0023b762cfb4928be().value, i32((i32((__cxx_private_cell_19fba13327f490e0c98ebd37().value - j)) & 32767)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
                    }
                  }
                }
              }
            }
          } while ((!Boolean(bfinal)));
        }
        if (!__cxx_lvalue_1) {
          (__cxx_private_cell_57a5d28f57b8e3415c7b14e5().value = i32((Number(__cxx_private_cell_57a5d28f57b8e3415c7b14e5().value) - Number(16384))));
        }
        if (!__cxx_lvalue_1) {
          if ((!Boolean(i32((i32((__cxx_private_cell_57a5d28f57b8e3415c7b14e5().value ^ __cxx_private_cell_19fba13327f490e0c98ebd37().value)) & 32768))))) {
            if (!__cxx_lvalue_1) {
              putbuf4zip(cPointerOffset(__cxx_private_cell_fd8146c0023b762cfb4928be().value, i32((__cxx_private_cell_57a5d28f57b8e3415c7b14e5().value & 32767)), Uint8Array.BYTES_PER_ELEMENT), __cxx_private_cell_57a5d28f57b8e3415c7b14e5().value, __cxx_private_cell_19fba13327f490e0c98ebd37().value);
            }
          } else {
            if (!__cxx_lvalue_1) {
              putbuf4zip(cPointerOffset(__cxx_private_cell_fd8146c0023b762cfb4928be().value, i32((__cxx_private_cell_57a5d28f57b8e3415c7b14e5().value & 32767)), Uint8Array.BYTES_PER_ELEMENT), __cxx_private_cell_57a5d28f57b8e3415c7b14e5().value, i32((__cxx_private_cell_19fba13327f490e0c98ebd37().value & (~32767))));
            }
            if (!__cxx_lvalue_1) {
              putbuf4zip(__cxx_private_cell_fd8146c0023b762cfb4928be().value, i32((__cxx_private_cell_19fba13327f490e0c98ebd37().value & (~32767))), __cxx_private_cell_19fba13327f490e0c98ebd37().value);
            }
          }
        }
        // Original resume label: kzreadplc3
        if (!__cxx_lvalue_1 || __cxx_lvalue_1 === "kzreadplc3") {
          __cxx_lvalue_1 = null;
          if (!__cxx_lvalue_1) {
            ;
          }
        }
        if (!__cxx_lvalue_1) {
          (__cxx_global_cell_0c0d9a71eef382369e188fb4().value.jmpplc = i32(3));
        }
      }
    }
  }
  if (!__cxx_lvalue_1) {
    ;
  }
  if (!__cxx_lvalue_1) {
    (i = i32(__cxx_global_cell_0c0d9a71eef382369e188fb4().value.pos));
  }
  if (!__cxx_lvalue_1) {
    ((__cxx_lvalue_39) => (__cxx_lvalue_39.value = i32((Number(__cxx_lvalue_39.value) + Number(leng)))))(cObjectFieldRef(__cxx_global_cell_0c0d9a71eef382369e188fb4().value, "pos"));
  }
  if (!__cxx_lvalue_1) {
    if ((__cxx_global_cell_0c0d9a71eef382369e188fb4().value.pos > __cxx_global_cell_0c0d9a71eef382369e188fb4().value.leng)) {
      if (!__cxx_lvalue_1) {
        (__cxx_global_cell_0c0d9a71eef382369e188fb4().value.pos = i32(__cxx_global_cell_0c0d9a71eef382369e188fb4().value.leng));
      }
    }
  }
  if (!__cxx_lvalue_1) {
    return i32((__cxx_global_cell_0c0d9a71eef382369e188fb4().value.pos - i));
  }
}

// C/C++ source: source/build/src/kplib.cpp:3023
export function kzseek(offset, whence) {
  if ((!__cxx_global_cell_0c0d9a71eef382369e188fb4().value.fil)) {
    return i32((-1));
  }
  switch (whence) {
    case 1: {
      ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = i32((Number(__cxx_lvalue_0.value) + Number(offset)))))(cObjectFieldRef(__cxx_global_cell_0c0d9a71eef382369e188fb4().value, "pos"));
    }
    break;
    case 2: {
      (__cxx_global_cell_0c0d9a71eef382369e188fb4().value.pos = i32((__cxx_global_cell_0c0d9a71eef382369e188fb4().value.leng + offset)));
    }
    break;
    case 0:
    default: {
      (__cxx_global_cell_0c0d9a71eef382369e188fb4().value.pos = i32(offset));
    }
  }
  if ((__cxx_global_cell_0c0d9a71eef382369e188fb4().value.pos < 0)) {
    (__cxx_global_cell_0c0d9a71eef382369e188fb4().value.pos = i32(0));
  }
  if ((__cxx_global_cell_0c0d9a71eef382369e188fb4().value.pos > __cxx_global_cell_0c0d9a71eef382369e188fb4().value.leng)) {
    (__cxx_global_cell_0c0d9a71eef382369e188fb4().value.pos = i32(__cxx_global_cell_0c0d9a71eef382369e188fb4().value.leng));
  }
  return i32(__cxx_global_cell_0c0d9a71eef382369e188fb4().value.pos);
}

// C/C++ source: source/build/include/compat.h:1169
export const pow2char__header_global_021abad301e15d3d = new Uint8Array([(u32(1) & 255), (u32(2) & 255), (u32(4) & 255), (u32(8) & 255), (u32(16) & 255), (u32(32) & 255), (u32(64) & 255), (u32(128) & 255)]);
function __cxx_static_address_392ede9e6a1b24fbaec3a0a9() {
  return __cxx_static_address_392ede9e6a1b24fbaec3a0a9.reference || (__cxx_static_address_392ede9e6a1b24fbaec3a0a9.reference = {
    __cReference: true,
    get value() { return pow2char__header_global_021abad301e15d3d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_392ede9e6a1b24fbaec3a0a9() { return __cxx_static_address_392ede9e6a1b24fbaec3a0a9(); }

// C/C++ source: source/build/include/baselayer.h:172
export const g_defaultVideoModes__header_global_d83845986d05a170 = cByteRecordNDArray({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, [25], {}, cStaticInitializerValues([cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 2560, "y": 1440}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 2560, "y": 1200}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 2560, "y": 1080}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1920, "y": 1440}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1920, "y": 1200}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1920, "y": 1080}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1680, "y": 1050}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1600, "y": 1200}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1600, "y": 900}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1366, "y": 768}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1280, "y": 1024}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1280, "y": 960}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1280, "y": 720}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1152, "y": 864}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1024, "y": 768}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1024, "y": 600}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 800, "y": 600}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 640, "y": 480}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 640, "y": 400}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 512, "y": 384}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 480, "y": 360}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 400, "y": 300}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 320, "y": 240}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 320, "y": 200}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 0, "y": 0}), null, {})]));
function __cxx_static_address_ecf42c81fb28d66b3df8d0b2() {
  return __cxx_static_address_ecf42c81fb28d66b3df8d0b2.reference || (__cxx_static_address_ecf42c81fb28d66b3df8d0b2.reference = {
    __cReference: true,
    get value() { return g_defaultVideoModes__header_global_d83845986d05a170; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:188
export const g_keyAsciiTable__header_global_c95e5842fd0d2550 = new Uint8Array([(u32(0) & 255), (u32(0) & 255), 49, 50, 51, 52, 53, 54, 55, 56, 57, 48, 45, 61, (u32(0) & 255), (u32(0) & 255), 113, 119, 101, 114, 116, 121, 117, 105, 111, 112, 91, 93, (u32(0) & 255), (u32(0) & 255), 97, 115, 100, 102, 103, 104, 106, 107, 108, 59, (u32(39) & 255), 96, (u32(0) & 255), (u32(92) & 255), 122, 120, 99, 118, 98, 110, 109, 44, 46, 47, (u32(0) & 255), 42, (u32(0) & 255), (u32(32) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), 55, 56, 57, 45, 52, 53, 54, 43, 49, 50, 51, 48, 46, (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255)]);
function __cxx_static_address_b8e0c56e48bee3e7640acce2() {
  return __cxx_static_address_b8e0c56e48bee3e7640acce2.reference || (__cxx_static_address_b8e0c56e48bee3e7640acce2.reference = {
    __cReference: true,
    get value() { return g_keyAsciiTable__header_global_c95e5842fd0d2550; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_b8e0c56e48bee3e7640acce2() { return __cxx_static_address_b8e0c56e48bee3e7640acce2(); }

// C/C++ source: source/build/include/baselayer.h:196
export const g_keyAsciiTableShift__header_global_19855f14872cb82b = new Uint8Array([(u32(0) & 255), (u32(0) & 255), 33, 64, 35, 36, 37, 94, 38, 42, 40, 41, 95, 43, (u32(0) & 255), (u32(0) & 255), 81, 87, 69, 82, 84, 89, 85, 73, 79, 80, 123, 125, (u32(0) & 255), (u32(0) & 255), 65, 83, 68, 70, 71, 72, 74, 75, 76, 58, 34, 126, (u32(0) & 255), 124, 90, 88, 67, 86, 66, 78, 77, 60, 62, 63, (u32(0) & 255), 42, (u32(0) & 255), (u32(32) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), 55, 56, 57, 45, 52, 53, 54, 43, 49, 50, 51, 48, 46, (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255)]);
function __cxx_static_address_1732bdf654b8967d8379974f() {
  return __cxx_static_address_1732bdf654b8967d8379974f.reference || (__cxx_static_address_1732bdf654b8967d8379974f.reference = {
    __cReference: true,
    get value() { return g_keyAsciiTableShift__header_global_19855f14872cb82b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_1732bdf654b8967d8379974f() { return __cxx_static_address_1732bdf654b8967d8379974f(); }

// C/C++ source: source/build/src/kplib.cpp:1032
export function B_BUF32__header_5d2f345cbe77(buf, x) {
  ((cDeref(cTypedPointer(buf, Uint32Array), Uint32Array).value) = u32(x));
}

// C/C++ source: source/build/src/kplib.cpp:1036
export function B_UNBUF32__header_c1468ac058f1(buf) {
  return u32((cDeref(cTypedPointer(buf, Uint32Array), Uint32Array).value));
}

// C/C++ source: @sysroot/usr/include/c++/12/bits/stl_algobase.h:230
export function min__template_c5ffcfb092321e6b(__a, __b) {
  if ((__b.value < __a.value)) {
    return __b;
  }
  return __a;
}

export function B_SWAP32__header_86d0d39cb98e(x) {
  return u32(B_SWAP32_impl__header_92ffc23b353f(u32(x)));
}

export function B_PASS32__header_8a7178a88765(x) {
  return u32(x);
}

// C/C++ source: @sysroot/usr/include/c++/12/bits/stl_algobase.h:254
export function max__template_b1cfaf2244c73238(__a, __b) {
  if ((__a.value < __b.value)) {
    return __b;
  }
  return __a;
}

// C/C++ source: @sysroot/usr/include/c++/12/bits/stl_algobase.h:230
export function min__template_774131ccff66371d(__a, __b) {
  if ((__b.value < __a.value)) {
    return __b;
  }
  return __a;
}

export function B_PASS32__header_08503142e865(x) {
  return i32(x);
}

export function B_SWAP32__header_c7537f5ee250(x) {
  return i32(B_SWAP32_impl__header_92ffc23b353f(u32(x)));
}

// C/C++ source: source/build/src/kplib.cpp:121
export function tabledivide32__header_baacfef35b3a(n, d) {

  if (Boolean(i32((i32((d != __cxx_global_cell_a6e3cfd4eba13fb9886cb240().value)) & i32((!(u32(d) < u32(16384)))))))) {
    cAssignAggregate((cPointerElementRef(cRecordPointer(divtable32, {"align": 1, "arrayAlign": 1, "fields": {"magic": {"native": "Int32Array", "offset": 0, "size": 4}, "more": {"native": "Uint8Array", "offset": 4, "size": 1}}, "overlaps": false, "size": 5, "union": false}, {}), 0).value), libdivide_s32_gen((__cxx_global_cell_a6e3cfd4eba13fb9886cb240().value = i32(d))), {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"magic": {"native": "Int32Array", "offset": 0, "size": 4}, "more": {"native": "Uint8Array", "offset": 4, "size": 1}}, "overlaps": false, "size": 5, "union": false}});
  }
  return i32(libdivide_s32_do(n, cPointerOffset(divtable32, i32(Math.imul(i32((u32(d) < u32(16384))), d)), 5)));
}

// C/C++ source: source/build/src/kplib.cpp:1035
export function B_UNBUF16__header_48ae80884dfc(buf) {
  return (u32((cDeref(cTypedPointer(buf, Uint16Array), Uint16Array).value)) & 65535);
}

export function B_PASS16__header_7269365a3bec(x) {
  return (u32((u32(x) & 65535)) & 65535);
}

export function B_SWAP16__header_b45431f7a004(x) {
  return (u32(B_SWAP16_impl__header_370a30133afa((u32(x) & 65535))) & 65535);
}

// C/C++ source: source/build/src/kplib.cpp:1449
export function xfree__header_dacf3b9e1753(ptr) {
  Free__cxx_static_0dfd3f42f0dc2c05(__cxx_global_cell_11016d3c7177543e564ab46c().value, ptr);
}

// C/C++ source: source/build/src/kplib.cpp:1392
export function xmalloc__header_19a1c2b77820(size) {
  let ptr = Alloc__cxx_static_e0036cfb06bcfe42(__cxx_global_cell_11016d3c7177543e564ab46c().value, size, u64(16));
  if (cPointerCompare(ptr, null, "!=")) {
    return ptr;
  }
  handle_memerr(i32(size));
  __builtin_unreachable();
}

export function B_PASS16__header_15ea0d7111ad(x) {
  return (u32(x) & 65535);
}

// C/C++ source: source/build/src/kplib.cpp:1031
export function B_BUF16__header_3391c2afcc82(buf, x) {
  ((cDeref(cTypedPointer(buf, Uint16Array), Uint16Array).value) = (u32(x) & 65535));
}

export function B_PASS16__header_c2d8d3cb4508(x) {
  return ((u32(((u32(x) << 16) >> 16)) << 16) >> 16);
}

// C/C++ source: source/build/src/kplib.cpp:1413
export function xrealloc__header_a75fad26d587(ptr, size) {
  let newptr = Realloc__cxx_static_478d5da25b6b3923(__cxx_global_cell_11016d3c7177543e564ab46c().value, ptr, size, u64(16));
  if ((cPointerCompare(newptr, null, "!=") || (size == u64(0)))) {
    return newptr;
  }
  handle_memerr(i32(size));
  __builtin_unreachable();
}

export function ARRAY_SIZE__header_5684d083f66c(arg0) {
  return u64(256n);
}

// C/C++ source: source/build/src/kplib.cpp:56
export function filnamcmp__header_a9607fbb77a7(j, i) {
  while (((Boolean((cDeref(i, Uint8Array).value)) && Boolean((cDeref(j, Uint8Array).value))) && (i32((cDeref(cPointerOffset(toupperlookup, (cDeref(i, Uint8Array).value), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == i32((cDeref(cPointerOffset(toupperlookup, (cDeref(j, Uint8Array).value), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value))))) {
    (((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_0.value = next; return previous; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; })), ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_2.value = next; return previous; })(cRef(() => j, __cxx_lvalue_3 => { j = __cxx_lvalue_3; })));
  }
  return i32(((i32((cDeref(i, Uint8Array).value)) != i32(0)) || (i32((cDeref(j, Uint8Array).value)) != i32(0))));
}

// C/C++ source: source/build/src/kplib.cpp:131
export function buildvfs_flength__header_0b643cd4c0f7(f) {
  return i64(buildvfs_length__header_f87e30a27827(fileno(f)));
}

// C/C++ source: source/build/src/kplib.cpp:948
export function B_SWAP32_impl__header_92ffc23b353f(value) {
  return u32((u32((u32(((u32((value & 4278190080)) >>> 24) | (u32((value & 16711680)) >>> 8))) | u32((u32((value & 65280)) << 8)))) | u32((u32((value & 255)) << 24))));
}

// C/C++ source: source/build/src/kplib.cpp:942
export function B_SWAP16_impl__header_370a30133afa(value) {
  return (u32((u32(((u32((u32(value) & 65280)) >>> 8) | u32((u32((u32(value) & 255)) << 8)))) & 65535)) & 65535);
}

// C/C++ source: source/build/src/kplib.cpp:105
export function buildvfs_length__header_f87e30a27827(fd) {
  let st = cZeroAggregate({"byteRecord": {"align": 8, "arrayAlign": 8, "fields": {"__glibc_reserved": {"length": 3, "native": "BigInt64Array", "offset": 120, "size": 24}, "__pad0": {"native": "Int32Array", "offset": 36, "size": 4}, "st_atim": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"tv_nsec": {"native": "BigInt64Array", "offset": 8, "size": 8}, "tv_sec": {"native": "BigInt64Array", "offset": 0, "size": 8}}, "overlaps": false, "size": 16, "union": false}, "offset": 72}, "st_blksize": {"native": "BigInt64Array", "offset": 56, "size": 8}, "st_blocks": {"native": "BigInt64Array", "offset": 64, "size": 8}, "st_ctim": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"tv_nsec": {"native": "BigInt64Array", "offset": 8, "size": 8}, "tv_sec": {"native": "BigInt64Array", "offset": 0, "size": 8}}, "overlaps": false, "size": 16, "union": false}, "offset": 104}, "st_dev": {"native": "BigUint64Array", "offset": 0, "size": 8}, "st_gid": {"native": "Uint32Array", "offset": 32, "size": 4}, "st_ino": {"native": "BigUint64Array", "offset": 8, "size": 8}, "st_mode": {"native": "Uint32Array", "offset": 24, "size": 4}, "st_mtim": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"tv_nsec": {"native": "BigInt64Array", "offset": 8, "size": 8}, "tv_sec": {"native": "BigInt64Array", "offset": 0, "size": 8}}, "overlaps": false, "size": 16, "union": false}, "offset": 88}, "st_nlink": {"native": "BigUint64Array", "offset": 16, "size": 8}, "st_rdev": {"native": "BigUint64Array", "offset": 40, "size": 8}, "st_size": {"native": "BigInt64Array", "offset": 48, "size": 8}, "st_uid": {"native": "Uint32Array", "offset": 28, "size": 4}}, "overlaps": false, "size": 144, "union": false}}, {});
  return i64(((fstat(fd, st) < 0) ? i64((-1)) : st.st_size));
}
