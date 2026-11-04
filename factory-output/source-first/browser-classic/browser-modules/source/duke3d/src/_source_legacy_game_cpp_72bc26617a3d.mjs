// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/duke3d/src/game.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
import { Alloc__cxx_static_e0036cfb06bcfe42 } from "../../build/src/smmalloc_generic.cpp.mjs";
import { BLOODYPOLE____header_global_b964b8f9100b455f } from "./game.cpp.mjs";
import { ClockTicks } from "../../build/src/osd.cpp.mjs";
import { DOLPHIN1____header_global_7ad32523df8df580 } from "./game.cpp.mjs";
import { DOLPHIN2____header_global_2bb93381647a9fa3 } from "./game.cpp.mjs";
import { Destroy__cxx_static_777d0ae31c789182 } from "../../build/src/smmalloc_generic.cpp.mjs";
import { FEM10____header_global_e92de30930810443 } from "./game.cpp.mjs";
import { FEM1____header_global_6c3bc763a4679cf7 } from "./game.cpp.mjs";
import { FEM2____header_global_ae5b44893de611e7 } from "./game.cpp.mjs";
import { FEM3____header_global_7e6d9b03142394e3 } from "./game.cpp.mjs";
import { FEM4____header_global_eaf38733028fc1a5 } from "./game.cpp.mjs";
import { FEM5____header_global_e32b47543e14be44 } from "./game.cpp.mjs";
import { FEM6PAD____header_global_dc109a1f8ffa544e } from "./game.cpp.mjs";
import { FEM6____header_global_9281c402db288bc3 } from "./game.cpp.mjs";
import { FEM7____header_global_4a24bed2a474cbd9 } from "./game.cpp.mjs";
import { FEM8____header_global_825a520321d1db82 } from "./game.cpp.mjs";
import { FEM9____header_global_7f5bf24344a06d81 } from "./game.cpp.mjs";
import { FEMMAG1____header_global_75336c4c3f0706c3 } from "./game.cpp.mjs";
import { FEMMAG2____header_global_e3f4bc57305c96ad } from "./game.cpp.mjs";
import { FEMPIC1____header_global_a4533ec869e1a3ef } from "./game.cpp.mjs";
import { FEMPIC2____header_global_c2d8f42bec6a5474 } from "./game.cpp.mjs";
import { FEMPIC3____header_global_dc9da92f4881cddb } from "./game.cpp.mjs";
import { FEMPIC4____header_global_a2e22e1e820d41ca } from "./game.cpp.mjs";
import { FEMPIC5____header_global_4b9b81180494dc18 } from "./game.cpp.mjs";
import { FEMPIC6____header_global_56bbc29002714e92 } from "./game.cpp.mjs";
import { FEMPIC7____header_global_703b730890361b83 } from "./game.cpp.mjs";
import { FETUSBROKE____header_global_ee76e864e3ff4f53 } from "./game.cpp.mjs";
import { FETUSJIB____header_global_7259937db3ed30e2 } from "./game.cpp.mjs";
import { FETUS____header_global_9e8d6d6ae00e3abf } from "./game.cpp.mjs";
import { FOODOBJECT16____header_global_15fdc1142339fb3d } from "./game.cpp.mjs";
import { Free__cxx_static_0dfd3f42f0dc2c05 } from "../../build/src/smmalloc_generic.cpp.mjs";
import { HOTMEAT____header_global_ce822bbd1a72c1cc } from "./game.cpp.mjs";
import { MAN2____header_global_23cf71ab2b089498 } from "./game.cpp.mjs";
import { MAN____header_global_da1bf674cdcd85bc } from "./game.cpp.mjs";
import { MenuGameplayEntry } from "./game.cpp.mjs";
import { NAKED1____header_global_3661ff61ff0ae6d7 } from "./game.cpp.mjs";
import { OOZ2____header_global_6a1003811cb69a4f } from "./game.cpp.mjs";
import { OOZ____header_global_07ccc0068f41803e } from "./game.cpp.mjs";
import { PODFEM1____header_global_b80f05ac6849519f } from "./game.cpp.mjs";
import { Realloc__cxx_static_478d5da25b6b3923 } from "../../build/src/smmalloc_generic.cpp.mjs";
import { STATUEFLASH____header_global_50aadf0d7bdf4b1c } from "./game.cpp.mjs";
import { STATUE____header_global_921a665274513c3b } from "./game.cpp.mjs";
import { SUSHIPLATE1____header_global_5989a406925be94d } from "./game.cpp.mjs";
import { SUSHIPLATE2____header_global_55fa13e8f4537e24 } from "./game.cpp.mjs";
import { SUSHIPLATE3____header_global_8ed387bd6d5117ca } from "./game.cpp.mjs";
import { SUSHIPLATE4____header_global_3287006f85034463 } from "./game.cpp.mjs";
import { current_verbosity_cutoff } from "../../build/src/loguru.cpp.mjs";
import { divtable64 } from "../../build/src/pragmas.cpp.mjs";
import { fix16_half__header_global_02a9a2d25f5c82a5 } from "./game.cpp.mjs";
import { fix16_one__header_global_49e594ecaa72fc74 } from "./game.cpp.mjs";
import { __cxx_global_cell_c0e288040dbf9a805036c27d } from "./common.cpp.mjs";
import { g_player } from "./global.cpp.mjs";
import { __cxx_global_cell_11016d3c7177543e564ab46c } from "../../build/src/compat.cpp.mjs";
import { __cxx_global_cell_a98bb585faaf2a8f60d62e9a } from "./dnames.cpp.mjs";
import { handle_memerr } from "../../build/src/compat.cpp.mjs";
import { inthash_find } from "../../build/src/hash.cpp.mjs";
import { __cxx_global_cell_f8287b2e627d0e3f51b90c55 } from "../../build/src/pragmas.cpp.mjs";
import { libdivide_s64_do } from "../../../browser-abi/libdivide_source.mjs";
import { libdivide_s64_gen } from "../../../browser-abi/libdivide_provider.mjs";
import { loguru_log } from "../../../browser-abi/loguru_provider.mjs";
import { memcpy } from "../../../browser-abi/libc_provider.mjs";
import { memset } from "../../../browser-abi/libc_provider.mjs";
import { __cxx_global_cell_04adffdeab684b9c52206917 } from "../../build/src/mmulti.cpp.mjs";
import { nanosleep } from "../../../browser-abi/libc_provider.mjs";
import { scriptfile_getlinum } from "../../build/src/scriptfile.cpp.mjs";
import { scriptfile_getnumber } from "../../build/src/scriptfile.cpp.mjs";
import { scriptfile_getsymbol } from "../../build/src/scriptfile.cpp.mjs";
import { __cxx_global_cell_4a046e33ecf7aced9bfd0007 } from "../../build/src/engine.cpp.mjs";
import { strlen } from "../../../browser-abi/libc_provider.mjs";
import { testkopen } from "../../../browser-abi/libc_provider.mjs";
import { __cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba } from "./global.cpp.mjs";

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



function cCopyTrivialClass(value, C, fields) {
  if (!(value instanceof C)) throw new TypeError('C++ trivial class copy type mismatch');
  const copy=Object.create(C.prototype);
  for (const field of fields) copy[field]=value[field];
  return copy;
}

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

// Browser-hosted termination for an exactly verified ISO C exit(int) ABI.
// Throwing stops the current stack; the launcher decides whether to close the
// native browser runtime. This does not emulate a CPU or import an SDL library.
const cProcess = Object.freeze({
  exit(status) {
    const code = Number(status);
    if (!Number.isFinite(code) || !Number.isSafeInteger(code))
      throw new TypeError('C exit status must be an integer');
    const stopped = new Error(`C process terminated with status ${code | 0}`);
    stopped.name = 'CProcessExit';
    stopped.status = code | 0;
    throw stopped;
  }
});

const i32 = value => typeof value === "bigint" ? Number(BigInt.asIntN(32,value)) : Number(value) | 0;
const u32 = value => typeof value === "bigint" ? Number(BigInt.asUintN(32,value)) : Number(value) >>> 0;
const i64 = value => BigInt.asIntN(64, BigInt(value));
const u64 = value => BigInt.asUintN(64, BigInt(value));


const clz64 = value => {let v=BigInt.asUintN(64,BigInt(value));if(v===0n)return 64;let n=0;while((v&(1n<<63n))===0n){v<<=1n;n++;}return n;};
const ctz64 = (value,width) => {let v=BigInt.asUintN(width,BigInt(value));if(v===0n)return width;let n=0;while((v&1n)===0n){v>>=1n;n++;}return n;};
const popcnt = value => {let v=value,n=0;while(v){v&=v-1n;n++;}return n;};

const __builtin_abs = x => {x=Number(x)|0;if(x===-2147483648)throw new RangeError("C abs signed overflow");return Math.abs(x);};
const __builtin_unreachable = () => { throw new Error("C++ undefined behavior: reached __builtin_unreachable"); };
// C/C++ source: source/build/include/fix16.h:111
export const fix16_rad_to_deg_mult__header_global_7fa6356a87cc8aef = i32(3754936);
function __cxx_static_address_a9f38bbf0074c6c973146a3a() {
  return __cxx_static_address_a9f38bbf0074c6c973146a3a.reference || (__cxx_static_address_a9f38bbf0074c6c973146a3a.reference = {
    __cReference: true,
    get value() { return fix16_rad_to_deg_mult__header_global_7fa6356a87cc8aef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:114
export const fix16_deg_to_rad_mult__header_global_4b4aada34deeedde = i32(1144);
function __cxx_static_address_8191d66380fbbcd21d1539e9() {
  return __cxx_static_address_8191d66380fbbcd21d1539e9.reference || (__cxx_static_address_8191d66380fbbcd21d1539e9.reference = {
    __cReference: true,
    get value() { return fix16_deg_to_rad_mult__header_global_4b4aada34deeedde; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:43
export const KICK_HIT____header_global_1dbaab7d44971d5d = ((u32(((u32(0) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7de77b6bf840bc0634544719() {
  return __cxx_static_address_7de77b6bf840bc0634544719.reference || (__cxx_static_address_7de77b6bf840bc0634544719.reference = {
    __cReference: true,
    get value() { return KICK_HIT____header_global_1dbaab7d44971d5d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:44
export const PISTOL_RICOCHET____header_global_7ae4961a4c4482b9 = ((u32(((u32(1) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_12db878a10e661f1ed091414() {
  return __cxx_static_address_12db878a10e661f1ed091414.reference || (__cxx_static_address_12db878a10e661f1ed091414.reference = {
    __cReference: true,
    get value() { return PISTOL_RICOCHET____header_global_7ae4961a4c4482b9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:45
export const PISTOL_BODYHIT____header_global_7a519b7cd2952d6f = ((u32(((u32(2) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8531fadd0401f7d675a98253() {
  return __cxx_static_address_8531fadd0401f7d675a98253.reference || (__cxx_static_address_8531fadd0401f7d675a98253.reference = {
    __cReference: true,
    get value() { return PISTOL_BODYHIT____header_global_7a519b7cd2952d6f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:46
export const PISTOL_FIRE____header_global_90245cf79d237ffc = ((u32(((u32(3) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3d096168d72b44395f910cfc() {
  return __cxx_static_address_3d096168d72b44395f910cfc.reference || (__cxx_static_address_3d096168d72b44395f910cfc.reference = {
    __cReference: true,
    get value() { return PISTOL_FIRE____header_global_90245cf79d237ffc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:47
export const EJECT_CLIP____header_global_a0e246f49b4f202f = ((u32(((u32(4) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_70a98ecca0f38ed2745aaf16() {
  return __cxx_static_address_70a98ecca0f38ed2745aaf16.reference || (__cxx_static_address_70a98ecca0f38ed2745aaf16.reference = {
    __cReference: true,
    get value() { return EJECT_CLIP____header_global_a0e246f49b4f202f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:48
export const INSERT_CLIP____header_global_ecc47cea36d11f43 = ((u32(((u32(5) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_29749290872d4ccf9f489971() {
  return __cxx_static_address_29749290872d4ccf9f489971.reference || (__cxx_static_address_29749290872d4ccf9f489971.reference = {
    __cReference: true,
    get value() { return INSERT_CLIP____header_global_ecc47cea36d11f43; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:49
export const CHAINGUN_FIRE____header_global_7b4f3a9ca43c63c9 = ((u32(((u32(6) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2e02eff092711e3984623770() {
  return __cxx_static_address_2e02eff092711e3984623770.reference || (__cxx_static_address_2e02eff092711e3984623770.reference = {
    __cReference: true,
    get value() { return CHAINGUN_FIRE____header_global_7b4f3a9ca43c63c9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:50
export const RPG_SHOOT____header_global_3f6db7d8bd0669b3 = ((u32(((u32(7) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_86c0641d2531a4263afaab3f() {
  return __cxx_static_address_86c0641d2531a4263afaab3f.reference || (__cxx_static_address_86c0641d2531a4263afaab3f.reference = {
    __cReference: true,
    get value() { return RPG_SHOOT____header_global_3f6db7d8bd0669b3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:51
export const POOLBALLHIT____header_global_59957f2d68c15db5 = ((u32(((u32(8) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2aed3d2e97e3f76345076584() {
  return __cxx_static_address_2aed3d2e97e3f76345076584.reference || (__cxx_static_address_2aed3d2e97e3f76345076584.reference = {
    __cReference: true,
    get value() { return POOLBALLHIT____header_global_59957f2d68c15db5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:52
export const RPG_EXPLODE____header_global_cda3cf4b894985f0 = ((u32(((u32(9) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7d2df0866d255645b0d5c638() {
  return __cxx_static_address_7d2df0866d255645b0d5c638.reference || (__cxx_static_address_7d2df0866d255645b0d5c638.reference = {
    __cReference: true,
    get value() { return RPG_EXPLODE____header_global_cda3cf4b894985f0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:53
export const CAT_FIRE____header_global_dca7667ca8004062 = ((u32(((u32(10) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7bfece4f48a5a3cd41adc1fd() {
  return __cxx_static_address_7bfece4f48a5a3cd41adc1fd.reference || (__cxx_static_address_7bfece4f48a5a3cd41adc1fd.reference = {
    __cReference: true,
    get value() { return CAT_FIRE____header_global_dca7667ca8004062; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:54
export const SHRINKER_FIRE____header_global_51383ef1d5b7af11 = ((u32(((u32(11) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d1c4be8c52c0ca2addd939c2() {
  return __cxx_static_address_d1c4be8c52c0ca2addd939c2.reference || (__cxx_static_address_d1c4be8c52c0ca2addd939c2.reference = {
    __cReference: true,
    get value() { return SHRINKER_FIRE____header_global_51383ef1d5b7af11; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:55
export const PIPEBOMB_BOUNCE____header_global_00a8543f2ed1be30 = ((u32(((u32(13) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0c11f9268b48887beb3add4c() {
  return __cxx_static_address_0c11f9268b48887beb3add4c.reference || (__cxx_static_address_0c11f9268b48887beb3add4c.reference = {
    __cReference: true,
    get value() { return PIPEBOMB_BOUNCE____header_global_00a8543f2ed1be30; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:56
export const PIPEBOMB_EXPLODE____header_global_4c55390131ab5fd8 = ((u32(((u32(14) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b60af0ad4d1d96d7d78b707a() {
  return __cxx_static_address_b60af0ad4d1d96d7d78b707a.reference || (__cxx_static_address_b60af0ad4d1d96d7d78b707a.reference = {
    __cReference: true,
    get value() { return PIPEBOMB_EXPLODE____header_global_4c55390131ab5fd8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:57
export const LASERTRIP_ONWALL____header_global_6225b76fd3851ec8 = ((u32(((u32(15) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_34a80b7e001c244d81e631dd() {
  return __cxx_static_address_34a80b7e001c244d81e631dd.reference || (__cxx_static_address_34a80b7e001c244d81e631dd.reference = {
    __cReference: true,
    get value() { return LASERTRIP_ONWALL____header_global_6225b76fd3851ec8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:58
export const LASERTRIP_ARMING____header_global_618eedcfda66a154 = ((u32(((u32(16) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ba5dfc664c709c0475d48576() {
  return __cxx_static_address_ba5dfc664c709c0475d48576.reference || (__cxx_static_address_ba5dfc664c709c0475d48576.reference = {
    __cReference: true,
    get value() { return LASERTRIP_ARMING____header_global_618eedcfda66a154; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:59
export const LASERTRIP_EXPLODE____header_global_4df09d9bfc9b0898 = ((u32(((u32(17) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7ab7de95cd7804807b9040b6() {
  return __cxx_static_address_7ab7de95cd7804807b9040b6.reference || (__cxx_static_address_7ab7de95cd7804807b9040b6.reference = {
    __cReference: true,
    get value() { return LASERTRIP_EXPLODE____header_global_4df09d9bfc9b0898; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:60
export const VENT_BUST____header_global_7049fd73a5218558 = ((u32(((u32(18) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6157895b4e9b1fb925068ec0() {
  return __cxx_static_address_6157895b4e9b1fb925068ec0.reference || (__cxx_static_address_6157895b4e9b1fb925068ec0.reference = {
    __cReference: true,
    get value() { return VENT_BUST____header_global_7049fd73a5218558; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:61
export const GLASS_BREAKING____header_global_b059a101aa2102cb = ((u32(((u32(19) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d7991b5f4b1ee52f57a13cd7() {
  return __cxx_static_address_d7991b5f4b1ee52f57a13cd7.reference || (__cxx_static_address_d7991b5f4b1ee52f57a13cd7.reference = {
    __cReference: true,
    get value() { return GLASS_BREAKING____header_global_b059a101aa2102cb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:62
export const GLASS_HEAVYBREAK____header_global_29c1e662e9cec851 = ((u32(((u32(20) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_92a8ebfc506c9baf2ca166e7() {
  return __cxx_static_address_92a8ebfc506c9baf2ca166e7.reference || (__cxx_static_address_92a8ebfc506c9baf2ca166e7.reference = {
    __cReference: true,
    get value() { return GLASS_HEAVYBREAK____header_global_29c1e662e9cec851; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:63
export const SHORT_CIRCUIT____header_global_8ce4e565f969855d = ((u32(((u32(21) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_68d79ebe8b52ce9c93c44f18() {
  return __cxx_static_address_68d79ebe8b52ce9c93c44f18.reference || (__cxx_static_address_68d79ebe8b52ce9c93c44f18.reference = {
    __cReference: true,
    get value() { return SHORT_CIRCUIT____header_global_8ce4e565f969855d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:64
export const ITEM_SPLASH____header_global_aa5e3a01f40ab03b = ((u32(((u32(22) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3f762ee833b1038f7f0bd716() {
  return __cxx_static_address_3f762ee833b1038f7f0bd716.reference || (__cxx_static_address_3f762ee833b1038f7f0bd716.reference = {
    __cReference: true,
    get value() { return ITEM_SPLASH____header_global_aa5e3a01f40ab03b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:65
export const DUKE_GASP____header_global_b1c6415aba0cadc6 = ((u32(((u32(25) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_104ea5c7861a7b0ab4272dcb() {
  return __cxx_static_address_104ea5c7861a7b0ab4272dcb.reference || (__cxx_static_address_104ea5c7861a7b0ab4272dcb.reference = {
    __cReference: true,
    get value() { return DUKE_GASP____header_global_b1c6415aba0cadc6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:66
export const SLIM_RECOG____header_global_40cb0541b1d6302d = ((u32(((u32(26) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a5471b6634113426583b3351() {
  return __cxx_static_address_a5471b6634113426583b3351.reference || (__cxx_static_address_a5471b6634113426583b3351.reference = {
    __cReference: true,
    get value() { return SLIM_RECOG____header_global_40cb0541b1d6302d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:67
export const DUKE_URINATE____header_global_94ed7d0e83acaae5 = ((u32(((u32(28) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e8c80cc6a317ea21ebce1b54() {
  return __cxx_static_address_e8c80cc6a317ea21ebce1b54.reference || (__cxx_static_address_e8c80cc6a317ea21ebce1b54.reference = {
    __cReference: true,
    get value() { return DUKE_URINATE____header_global_94ed7d0e83acaae5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:68
export const ENDSEQVOL3SND2____header_global_1f9fe74fb9757f0b = ((u32(((u32(29) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1e010c91d254a4ef77f64a5b() {
  return __cxx_static_address_1e010c91d254a4ef77f64a5b.reference || (__cxx_static_address_1e010c91d254a4ef77f64a5b.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND2____header_global_1f9fe74fb9757f0b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:69
export const ENDSEQVOL3SND3____header_global_7e87ce7be49ddb1c = ((u32(((u32(30) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b209a8c89b7e8dcc426e94f9() {
  return __cxx_static_address_b209a8c89b7e8dcc426e94f9.reference || (__cxx_static_address_b209a8c89b7e8dcc426e94f9.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND3____header_global_7e87ce7be49ddb1c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:70
export const DUKE_CRACK____header_global_6706d20ab9bdba63 = ((u32(((u32(33) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f40d3c185a3edff31d78ffc8() {
  return __cxx_static_address_f40d3c185a3edff31d78ffc8.reference || (__cxx_static_address_f40d3c185a3edff31d78ffc8.reference = {
    __cReference: true,
    get value() { return DUKE_CRACK____header_global_6706d20ab9bdba63; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:71
export const SLIM_ATTACK____header_global_435a02dca7bde90b = ((u32(((u32(34) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a22ced96674116f672081ba1() {
  return __cxx_static_address_a22ced96674116f672081ba1.reference || (__cxx_static_address_a22ced96674116f672081ba1.reference = {
    __cReference: true,
    get value() { return SLIM_ATTACK____header_global_435a02dca7bde90b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:72
export const SOMETHINGHITFORCE____header_global_18c0885b705bf626 = ((u32(((u32(35) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8dff09e765b11e3812b9059d() {
  return __cxx_static_address_8dff09e765b11e3812b9059d.reference || (__cxx_static_address_8dff09e765b11e3812b9059d.reference = {
    __cReference: true,
    get value() { return SOMETHINGHITFORCE____header_global_18c0885b705bf626; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:73
export const DUKE_DRINKING____header_global_0c4b8fa43fdf211a = ((u32(((u32(36) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a17ee61d6bfcd6870208d958() {
  return __cxx_static_address_a17ee61d6bfcd6870208d958.reference || (__cxx_static_address_a17ee61d6bfcd6870208d958.reference = {
    __cReference: true,
    get value() { return DUKE_DRINKING____header_global_0c4b8fa43fdf211a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:74
export const DUKE_GRUNT____header_global_ff1acf89bf99460d = ((u32(((u32(38) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fd9ff80e5ad7a275a7442952() {
  return __cxx_static_address_fd9ff80e5ad7a275a7442952.reference || (__cxx_static_address_fd9ff80e5ad7a275a7442952.reference = {
    __cReference: true,
    get value() { return DUKE_GRUNT____header_global_ff1acf89bf99460d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:75
export const DUKE_HARTBEAT____header_global_e08d18439a9d4fa2 = ((u32(((u32(39) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_81e6ba9c4da9759500010e93() {
  return __cxx_static_address_81e6ba9c4da9759500010e93.reference || (__cxx_static_address_81e6ba9c4da9759500010e93.reference = {
    __cReference: true,
    get value() { return DUKE_HARTBEAT____header_global_e08d18439a9d4fa2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:76
export const DUKE_ONWATER____header_global_87b0cce999336535 = ((u32(((u32(40) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_af2af0c09c598d301312bf4d() {
  return __cxx_static_address_af2af0c09c598d301312bf4d.reference || (__cxx_static_address_af2af0c09c598d301312bf4d.reference = {
    __cReference: true,
    get value() { return DUKE_ONWATER____header_global_87b0cce999336535; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:77
export const DUKE_LAND____header_global_02561ddbdae2c6e9 = ((u32(((u32(42) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_77d9549143b88dd8c24a7fed() {
  return __cxx_static_address_77d9549143b88dd8c24a7fed.reference || (__cxx_static_address_77d9549143b88dd8c24a7fed.reference = {
    __cReference: true,
    get value() { return DUKE_LAND____header_global_02561ddbdae2c6e9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:78
export const DUKE_WALKINDUCTS____header_global_79b805613e264a9b = ((u32(((u32(43) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bb24731d16e7d83799aab681() {
  return __cxx_static_address_bb24731d16e7d83799aab681.reference || (__cxx_static_address_bb24731d16e7d83799aab681.reference = {
    __cReference: true,
    get value() { return DUKE_WALKINDUCTS____header_global_79b805613e264a9b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:79
export const DUKE_UNDERWATER____header_global_51a64ed740dda300 = ((u32(((u32(48) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9c25ef7528d757a5fcea0596() {
  return __cxx_static_address_9c25ef7528d757a5fcea0596.reference || (__cxx_static_address_9c25ef7528d757a5fcea0596.reference = {
    __cReference: true,
    get value() { return DUKE_UNDERWATER____header_global_51a64ed740dda300; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:80
export const DUKE_JETPACK_ON____header_global_46d4e4e6ad6a69c4 = ((u32(((u32(49) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a1e57dbafcf1ddec5d80eb12() {
  return __cxx_static_address_a1e57dbafcf1ddec5d80eb12.reference || (__cxx_static_address_a1e57dbafcf1ddec5d80eb12.reference = {
    __cReference: true,
    get value() { return DUKE_JETPACK_ON____header_global_46d4e4e6ad6a69c4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:81
export const DUKE_JETPACK_IDLE____header_global_d4046063288bc341 = ((u32(((u32(50) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3569aad162eb511e2c5937d6() {
  return __cxx_static_address_3569aad162eb511e2c5937d6.reference || (__cxx_static_address_3569aad162eb511e2c5937d6.reference = {
    __cReference: true,
    get value() { return DUKE_JETPACK_IDLE____header_global_d4046063288bc341; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:82
export const DUKE_JETPACK_OFF____header_global_2e4ea7af4c219524 = ((u32(((u32(51) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e96a039882ab35fb4a5639bc() {
  return __cxx_static_address_e96a039882ab35fb4a5639bc.reference || (__cxx_static_address_e96a039882ab35fb4a5639bc.reference = {
    __cReference: true,
    get value() { return DUKE_JETPACK_OFF____header_global_2e4ea7af4c219524; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:83
export const DUKETALKTOBOSS____header_global_8a2df836370eb6b4 = ((u32(((u32(56) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1cf127222fbc8868f6d5c2c4() {
  return __cxx_static_address_1cf127222fbc8868f6d5c2c4.reference || (__cxx_static_address_1cf127222fbc8868f6d5c2c4.reference = {
    __cReference: true,
    get value() { return DUKETALKTOBOSS____header_global_8a2df836370eb6b4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:84
export const SQUISHED____header_global_75896886bae1642e = ((u32(((u32(69) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4345b2c60130c84e642ac9f0() {
  return __cxx_static_address_4345b2c60130c84e642ac9f0.reference || (__cxx_static_address_4345b2c60130c84e642ac9f0.reference = {
    __cReference: true,
    get value() { return SQUISHED____header_global_75896886bae1642e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:85
export const TELEPORTER____header_global_d2383ce16837dd7a = ((u32(((u32(70) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f4bd8a5702bf8765027e072c() {
  return __cxx_static_address_f4bd8a5702bf8765027e072c.reference || (__cxx_static_address_f4bd8a5702bf8765027e072c.reference = {
    __cReference: true,
    get value() { return TELEPORTER____header_global_d2383ce16837dd7a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:86
export const ELEVATOR_ON____header_global_a24bfa38fbc31216 = ((u32(((u32(71) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bb3e3a2c93389aba346c1274() {
  return __cxx_static_address_bb3e3a2c93389aba346c1274.reference || (__cxx_static_address_bb3e3a2c93389aba346c1274.reference = {
    __cReference: true,
    get value() { return ELEVATOR_ON____header_global_a24bfa38fbc31216; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:87
export const ELEVATOR_OFF____header_global_4b7b188ef8e161bd = ((u32(((u32(73) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a9b33401a30ee8250cf78a7b() {
  return __cxx_static_address_a9b33401a30ee8250cf78a7b.reference || (__cxx_static_address_a9b33401a30ee8250cf78a7b.reference = {
    __cReference: true,
    get value() { return ELEVATOR_OFF____header_global_4b7b188ef8e161bd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:88
export const SUBWAY____header_global_dca5095b3cac5ee7 = ((u32(((u32(75) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a1413b1d3e2feef431e1fcdb() {
  return __cxx_static_address_a1413b1d3e2feef431e1fcdb.reference || (__cxx_static_address_a1413b1d3e2feef431e1fcdb.reference = {
    __cReference: true,
    get value() { return SUBWAY____header_global_dca5095b3cac5ee7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:89
export const SWITCH_ON____header_global_e7f1556fae12f3ac = ((u32(((u32(76) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_640188645b256b77380d2bad() {
  return __cxx_static_address_640188645b256b77380d2bad.reference || (__cxx_static_address_640188645b256b77380d2bad.reference = {
    __cReference: true,
    get value() { return SWITCH_ON____header_global_e7f1556fae12f3ac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:90
export const FLUSH_TOILET____header_global_61f8f080f9989fa7 = ((u32(((u32(79) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2a7b376a1516c2b62768bede() {
  return __cxx_static_address_2a7b376a1516c2b62768bede.reference || (__cxx_static_address_2a7b376a1516c2b62768bede.reference = {
    __cReference: true,
    get value() { return FLUSH_TOILET____header_global_61f8f080f9989fa7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:91
export const EARTHQUAKE____header_global_c9815362f1e2c103 = ((u32(((u32(81) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_502e08753961607cba831a1f() {
  return __cxx_static_address_502e08753961607cba831a1f.reference || (__cxx_static_address_502e08753961607cba831a1f.reference = {
    __cReference: true,
    get value() { return EARTHQUAKE____header_global_c9815362f1e2c103; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:92
export const END_OF_LEVEL_WARN____header_global_2e77b6644a5e186a = ((u32(((u32(83) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_97a531ec83bcb93db7dd3315() {
  return __cxx_static_address_97a531ec83bcb93db7dd3315.reference || (__cxx_static_address_97a531ec83bcb93db7dd3315.reference = {
    __cReference: true,
    get value() { return END_OF_LEVEL_WARN____header_global_2e77b6644a5e186a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:93
export const WIND_AMBIENCE____header_global_6ad0fb60a92af14a = ((u32(((u32(91) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_713076c8f6032fd405f04da3() {
  return __cxx_static_address_713076c8f6032fd405f04da3.reference || (__cxx_static_address_713076c8f6032fd405f04da3.reference = {
    __cReference: true,
    get value() { return WIND_AMBIENCE____header_global_6ad0fb60a92af14a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:94
export const SOMETHING_DRIPPING____header_global_e87670c14fd140e6 = ((u32(((u32(92) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f902d3be7e49ab75d5a16622() {
  return __cxx_static_address_f902d3be7e49ab75d5a16622.reference || (__cxx_static_address_f902d3be7e49ab75d5a16622.reference = {
    __cReference: true,
    get value() { return SOMETHING_DRIPPING____header_global_e87670c14fd140e6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:95
export const BOS1_RECOG____header_global_bb008b2b8f5eaf21 = ((u32(((u32(97) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fa0dbf6b0b6699de967c9ff5() {
  return __cxx_static_address_fa0dbf6b0b6699de967c9ff5.reference || (__cxx_static_address_fa0dbf6b0b6699de967c9ff5.reference = {
    __cReference: true,
    get value() { return BOS1_RECOG____header_global_bb008b2b8f5eaf21; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:96
export const BOS2_RECOG____header_global_604dd9635d9c56d6 = ((u32(((u32(102) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b5537ead57fa8e9103d6c546() {
  return __cxx_static_address_b5537ead57fa8e9103d6c546.reference || (__cxx_static_address_b5537ead57fa8e9103d6c546.reference = {
    __cReference: true,
    get value() { return BOS2_RECOG____header_global_604dd9635d9c56d6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:97
export const DUKE_GETWEAPON2____header_global_aac5815c1edaf884 = ((u32(((u32(107) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d670041e422ff9befd4bf9b2() {
  return __cxx_static_address_d670041e422ff9befd4bf9b2.reference || (__cxx_static_address_d670041e422ff9befd4bf9b2.reference = {
    __cReference: true,
    get value() { return DUKE_GETWEAPON2____header_global_aac5815c1edaf884; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:98
export const SHOTGUN_FIRE____header_global_2ab4d6d7beb64ddc = ((u32(((u32(109) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_16d90bb29df28ddc13126a61() {
  return __cxx_static_address_16d90bb29df28ddc13126a61.reference || (__cxx_static_address_16d90bb29df28ddc13126a61.reference = {
    __cReference: true,
    get value() { return SHOTGUN_FIRE____header_global_2ab4d6d7beb64ddc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:99
export const PRED_RECOG____header_global_74ccb8f5c393159f = ((u32(((u32(111) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_260be26681f33c53627cdca5() {
  return __cxx_static_address_260be26681f33c53627cdca5.reference || (__cxx_static_address_260be26681f33c53627cdca5.reference = {
    __cReference: true,
    get value() { return PRED_RECOG____header_global_74ccb8f5c393159f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:100
export const CAPT_RECOG____header_global_9ff19b347e19de35 = ((u32(((u32(117) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c76ea4da6f8353aeee96dbc1() {
  return __cxx_static_address_c76ea4da6f8353aeee96dbc1.reference || (__cxx_static_address_c76ea4da6f8353aeee96dbc1.reference = {
    __cReference: true,
    get value() { return CAPT_RECOG____header_global_9ff19b347e19de35; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:101
export const PIG_RECOG____header_global_4a8c6a9d9a1bc599 = ((u32(((u32(121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a6a14186d893cdd589542dae() {
  return __cxx_static_address_a6a14186d893cdd589542dae.reference || (__cxx_static_address_a6a14186d893cdd589542dae.reference = {
    __cReference: true,
    get value() { return PIG_RECOG____header_global_4a8c6a9d9a1bc599; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:102
export const RECO_ROAM____header_global_9445c4c061959d82 = ((u32(((u32(125) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4ff9b110caa7c0faa86e0816() {
  return __cxx_static_address_4ff9b110caa7c0faa86e0816.reference || (__cxx_static_address_4ff9b110caa7c0faa86e0816.reference = {
    __cReference: true,
    get value() { return RECO_ROAM____header_global_9445c4c061959d82; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:103
export const RECO_RECOG____header_global_01e9bb9ac23d17c8 = ((u32(((u32(126) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_04f0c11fef355def67cdf2dc() {
  return __cxx_static_address_04f0c11fef355def67cdf2dc.reference || (__cxx_static_address_04f0c11fef355def67cdf2dc.reference = {
    __cReference: true,
    get value() { return RECO_RECOG____header_global_01e9bb9ac23d17c8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:104
export const RECO_ATTACK____header_global_2b53d7ae94283a60 = ((u32(((u32(127) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bddf744e9df11eeff6711a07() {
  return __cxx_static_address_bddf744e9df11eeff6711a07.reference || (__cxx_static_address_bddf744e9df11eeff6711a07.reference = {
    __cReference: true,
    get value() { return RECO_ATTACK____header_global_2b53d7ae94283a60; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:105
export const RECO_PAIN____header_global_aa63f96db87bd1fc = ((u32(((u32(128) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c0a81129de5f9456bad2f946() {
  return __cxx_static_address_c0a81129de5f9456bad2f946.reference || (__cxx_static_address_c0a81129de5f9456bad2f946.reference = {
    __cReference: true,
    get value() { return RECO_PAIN____header_global_aa63f96db87bd1fc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:106
export const DRON_RECOG____header_global_71370e5992dcf13a = ((u32(((u32(131) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_669cf6e20b5bb938b1ce9f57() {
  return __cxx_static_address_669cf6e20b5bb938b1ce9f57.reference || (__cxx_static_address_669cf6e20b5bb938b1ce9f57.reference = {
    __cReference: true,
    get value() { return DRON_RECOG____header_global_71370e5992dcf13a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:107
export const COMM_RECOG____header_global_c638fb1ab25c7604 = ((u32(((u32(136) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_09497de47dd5165da30fd6bf() {
  return __cxx_static_address_09497de47dd5165da30fd6bf.reference || (__cxx_static_address_09497de47dd5165da30fd6bf.reference = {
    __cReference: true,
    get value() { return COMM_RECOG____header_global_c638fb1ab25c7604; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:108
export const OCTA_RECOG____header_global_2ea47588f3196082 = ((u32(((u32(141) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c7fbd8fe633305f2069bfced() {
  return __cxx_static_address_c7fbd8fe633305f2069bfced.reference || (__cxx_static_address_c7fbd8fe633305f2069bfced.reference = {
    __cReference: true,
    get value() { return OCTA_RECOG____header_global_2ea47588f3196082; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:109
export const TURR_RECOG____header_global_2e29f71d090029eb = ((u32(((u32(146) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aca67f253cb81abc1c8d13c3() {
  return __cxx_static_address_aca67f253cb81abc1c8d13c3.reference || (__cxx_static_address_aca67f253cb81abc1c8d13c3.reference = {
    __cReference: true,
    get value() { return TURR_RECOG____header_global_2e29f71d090029eb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:110
export const SLIM_DYING____header_global_ea9e47bfdaca99ba = ((u32(((u32(149) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c01223e8573fca31949ddce4() {
  return __cxx_static_address_c01223e8573fca31949ddce4.reference || (__cxx_static_address_c01223e8573fca31949ddce4.reference = {
    __cReference: true,
    get value() { return SLIM_DYING____header_global_ea9e47bfdaca99ba; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:111
export const BOS3_RECOG____header_global_3d04550b7f255b3c = ((u32(((u32(151) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e285450d42e63002e62abef3() {
  return __cxx_static_address_e285450d42e63002e62abef3.reference || (__cxx_static_address_e285450d42e63002e62abef3.reference = {
    __cReference: true,
    get value() { return BOS3_RECOG____header_global_3d04550b7f255b3c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:112
export const BOS1_WALK____header_global_a04978c77dc80b1d = ((u32(((u32(156) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3bb27925fc6d6574440a783d() {
  return __cxx_static_address_3bb27925fc6d6574440a783d.reference || (__cxx_static_address_3bb27925fc6d6574440a783d.reference = {
    __cReference: true,
    get value() { return BOS1_WALK____header_global_a04978c77dc80b1d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:113
export const THUD____header_global_2baa175992216702 = ((u32(((u32(158) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f0eefe6c09975186887cfe2e() {
  return __cxx_static_address_f0eefe6c09975186887cfe2e.reference || (__cxx_static_address_f0eefe6c09975186887cfe2e.reference = {
    __cReference: true,
    get value() { return THUD____header_global_2baa175992216702; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:114
export const WIERDSHOT_FLY____header_global_284b01e73ed06467 = ((u32(((u32(160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_33193d53c8c4a5b8f63e0c8d() {
  return __cxx_static_address_33193d53c8c4a5b8f63e0c8d.reference || (__cxx_static_address_33193d53c8c4a5b8f63e0c8d.reference = {
    __cReference: true,
    get value() { return WIERDSHOT_FLY____header_global_284b01e73ed06467; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:115
export const SLIM_ROAM____header_global_af1e468759caada0 = ((u32(((u32(163) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_790b740f018665134c9a5a70() {
  return __cxx_static_address_790b740f018665134c9a5a70.reference || (__cxx_static_address_790b740f018665134c9a5a70.reference = {
    __cReference: true,
    get value() { return SLIM_ROAM____header_global_af1e468759caada0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:116
export const SHOTGUN_COCK____header_global_af8dbc34bd11bcd7 = ((u32(((u32(169) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e9936fcb0d8887f0c4c93ebf() {
  return __cxx_static_address_e9936fcb0d8887f0c4c93ebf.reference || (__cxx_static_address_e9936fcb0d8887f0c4c93ebf.reference = {
    __cReference: true,
    get value() { return SHOTGUN_COCK____header_global_af8dbc34bd11bcd7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:117
export const GENERIC_AMBIENCE17____header_global_e4dd240bdd0d6c18 = ((u32(((u32(177) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fa83f59ac544699d45f2c5cc() {
  return __cxx_static_address_fa83f59ac544699d45f2c5cc.reference || (__cxx_static_address_fa83f59ac544699d45f2c5cc.reference = {
    __cReference: true,
    get value() { return GENERIC_AMBIENCE17____header_global_e4dd240bdd0d6c18; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:118
export const BONUS_SPEECH1____header_global_97bdcde3fd1bcd73 = ((u32(((u32(195) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_77e757fda6f9a52835397ccb() {
  return __cxx_static_address_77e757fda6f9a52835397ccb.reference || (__cxx_static_address_77e757fda6f9a52835397ccb.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH1____header_global_97bdcde3fd1bcd73; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:119
export const BONUS_SPEECH2____header_global_405476a8af0a3d72 = ((u32(((u32(196) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_df05a24a7d14eda25700d0c6() {
  return __cxx_static_address_df05a24a7d14eda25700d0c6.reference || (__cxx_static_address_df05a24a7d14eda25700d0c6.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH2____header_global_405476a8af0a3d72; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:120
export const BONUS_SPEECH3____header_global_2a722b1d5c4db4e3 = ((u32(((u32(197) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_116c5e6e6b092795286170d5() {
  return __cxx_static_address_116c5e6e6b092795286170d5.reference || (__cxx_static_address_116c5e6e6b092795286170d5.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH3____header_global_2a722b1d5c4db4e3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:121
export const BONUS_SPEECH4____header_global_4b07387cd9a704a6 = ((u32(((u32(199) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9a3a87d4e53fce8f56ff6d2d() {
  return __cxx_static_address_9a3a87d4e53fce8f56ff6d2d.reference || (__cxx_static_address_9a3a87d4e53fce8f56ff6d2d.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH4____header_global_4b07387cd9a704a6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:122
export const DUKE_LAND_HURT____header_global_67fb7bf8a9011789 = ((u32(((u32(200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4354ea1391fc5f6b926b9ca7() {
  return __cxx_static_address_4354ea1391fc5f6b926b9ca7.reference || (__cxx_static_address_4354ea1391fc5f6b926b9ca7.reference = {
    __cReference: true,
    get value() { return DUKE_LAND_HURT____header_global_67fb7bf8a9011789; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:123
export const DUKE_SEARCH2____header_global_7328966bf6dea2c7 = ((u32(((u32(207) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_84575f363c6ac5166f3ab70d() {
  return __cxx_static_address_84575f363c6ac5166f3ab70d.reference || (__cxx_static_address_84575f363c6ac5166f3ab70d.reference = {
    __cReference: true,
    get value() { return DUKE_SEARCH2____header_global_7328966bf6dea2c7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:124
export const DUKE_CRACK2____header_global_5f5a7781a21ea6bc = ((u32(((u32(208) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_40ceff3a4d5e156331a9c35e() {
  return __cxx_static_address_40ceff3a4d5e156331a9c35e.reference || (__cxx_static_address_40ceff3a4d5e156331a9c35e.reference = {
    __cReference: true,
    get value() { return DUKE_CRACK2____header_global_5f5a7781a21ea6bc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:125
export const DUKE_SEARCH____header_global_240c4d9a1334ed52 = ((u32(((u32(209) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eaa3bc39506d22e8f50603b5() {
  return __cxx_static_address_eaa3bc39506d22e8f50603b5.reference || (__cxx_static_address_eaa3bc39506d22e8f50603b5.reference = {
    __cReference: true,
    get value() { return DUKE_SEARCH____header_global_240c4d9a1334ed52; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:126
export const DUKE_GET____header_global_6c8930b92b563dee = ((u32(((u32(210) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_38d4b4e89252346e0989e852() {
  return __cxx_static_address_38d4b4e89252346e0989e852.reference || (__cxx_static_address_38d4b4e89252346e0989e852.reference = {
    __cReference: true,
    get value() { return DUKE_GET____header_global_6c8930b92b563dee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:127
export const DUKE_LONGTERM_PAIN____header_global_2c02d73ca1052a23 = ((u32(((u32(211) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e122541f91e8d1027beffb13() {
  return __cxx_static_address_e122541f91e8d1027beffb13.reference || (__cxx_static_address_e122541f91e8d1027beffb13.reference = {
    __cReference: true,
    get value() { return DUKE_LONGTERM_PAIN____header_global_2c02d73ca1052a23; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:128
export const MONITOR_ACTIVE____header_global_49a02c97091c0933 = ((u32(((u32(212) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1464d932d52b1fdab7a52482() {
  return __cxx_static_address_1464d932d52b1fdab7a52482.reference || (__cxx_static_address_1464d932d52b1fdab7a52482.reference = {
    __cReference: true,
    get value() { return MONITOR_ACTIVE____header_global_49a02c97091c0933; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:129
export const NITEVISION_ONOFF____header_global_415d10a0a68f1b37 = ((u32(((u32(213) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d49d7b277ff42ca7f0c59444() {
  return __cxx_static_address_d49d7b277ff42ca7f0c59444.reference || (__cxx_static_address_d49d7b277ff42ca7f0c59444.reference = {
    __cReference: true,
    get value() { return NITEVISION_ONOFF____header_global_415d10a0a68f1b37; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:130
export const DUKE_CRACK_FIRST____header_global_3fe964fb371a7e6f = ((u32(((u32(215) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_38c5a6c76d8ee45353c9732e() {
  return __cxx_static_address_38c5a6c76d8ee45353c9732e.reference || (__cxx_static_address_38c5a6c76d8ee45353c9732e.reference = {
    __cReference: true,
    get value() { return DUKE_CRACK_FIRST____header_global_3fe964fb371a7e6f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:131
export const DUKE_USEMEDKIT____header_global_e2be2c1be5673902 = ((u32(((u32(216) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c18cf463a280f4e374a8ff68() {
  return __cxx_static_address_c18cf463a280f4e374a8ff68.reference || (__cxx_static_address_c18cf463a280f4e374a8ff68.reference = {
    __cReference: true,
    get value() { return DUKE_USEMEDKIT____header_global_e2be2c1be5673902; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:132
export const DUKE_TAKEPILLS____header_global_7d19003ad5150291 = ((u32(((u32(217) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1e54825e8d79bab227ea205a() {
  return __cxx_static_address_1e54825e8d79bab227ea205a.reference || (__cxx_static_address_1e54825e8d79bab227ea205a.reference = {
    __cReference: true,
    get value() { return DUKE_TAKEPILLS____header_global_7d19003ad5150291; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:133
export const DUKE_PISSRELIEF____header_global_7959b7eef902e852 = ((u32(((u32(218) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c223d63ee80c6c273496a155() {
  return __cxx_static_address_c223d63ee80c6c273496a155.reference || (__cxx_static_address_c223d63ee80c6c273496a155.reference = {
    __cReference: true,
    get value() { return DUKE_PISSRELIEF____header_global_7959b7eef902e852; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:134
export const SELECT_WEAPON____header_global_8ab8e46cae4731a8 = ((u32(((u32(219) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_06848af82234360bdc97780a() {
  return __cxx_static_address_06848af82234360bdc97780a.reference || (__cxx_static_address_06848af82234360bdc97780a.reference = {
    __cReference: true,
    get value() { return SELECT_WEAPON____header_global_8ab8e46cae4731a8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:135
export const JIBBED_ACTOR5____header_global_fa3b7ef1d59ab069 = ((u32(((u32(226) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6cc1fe7a878bffa328d76321() {
  return __cxx_static_address_6cc1fe7a878bffa328d76321.reference || (__cxx_static_address_6cc1fe7a878bffa328d76321.reference = {
    __cReference: true,
    get value() { return JIBBED_ACTOR5____header_global_fa3b7ef1d59ab069; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:136
export const JIBBED_ACTOR6____header_global_0ef8af71dbc81baa = ((u32(((u32(227) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_91019f765e989dd585e48b02() {
  return __cxx_static_address_91019f765e989dd585e48b02.reference || (__cxx_static_address_91019f765e989dd585e48b02.reference = {
    __cReference: true,
    get value() { return JIBBED_ACTOR6____header_global_0ef8af71dbc81baa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:137
export const DUKE_GOTHEALTHATLOW____header_global_f23952252b8f87bd = ((u32(((u32(229) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7bb900eb15bf96d6b4dfec02() {
  return __cxx_static_address_7bb900eb15bf96d6b4dfec02.reference || (__cxx_static_address_7bb900eb15bf96d6b4dfec02.reference = {
    __cReference: true,
    get value() { return DUKE_GOTHEALTHATLOW____header_global_f23952252b8f87bd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:138
export const BOSSTALKTODUKE____header_global_1fe95171ac67ff35 = ((u32(((u32(230) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_25f47859e907d5f137b9ead4() {
  return __cxx_static_address_25f47859e907d5f137b9ead4.reference || (__cxx_static_address_25f47859e907d5f137b9ead4.reference = {
    __cReference: true,
    get value() { return BOSSTALKTODUKE____header_global_1fe95171ac67ff35; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:139
export const WAR_AMBIENCE2____header_global_1fbf1ab0988e184c = ((u32(((u32(232) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7280ae128e27348d07ccb825() {
  return __cxx_static_address_7280ae128e27348d07ccb825.reference || (__cxx_static_address_7280ae128e27348d07ccb825.reference = {
    __cReference: true,
    get value() { return WAR_AMBIENCE2____header_global_1fbf1ab0988e184c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:140
export const EXITMENUSOUND____header_global_4e9ab1d1751a895d = ((u32(((u32(243) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f077897b5434fbe1c1e9166c() {
  return __cxx_static_address_f077897b5434fbe1c1e9166c.reference || (__cxx_static_address_f077897b5434fbe1c1e9166c.reference = {
    __cReference: true,
    get value() { return EXITMENUSOUND____header_global_4e9ab1d1751a895d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:141
export const FLY_BY____header_global_3435b7101c43e680 = ((u32(((u32(244) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c578dcbf5bd8bc2bbc9e9cde() {
  return __cxx_static_address_c578dcbf5bd8bc2bbc9e9cde.reference || (__cxx_static_address_c578dcbf5bd8bc2bbc9e9cde.reference = {
    __cReference: true,
    get value() { return FLY_BY____header_global_3435b7101c43e680; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:142
export const DUKE_SCREAM____header_global_0f54bbf31d255162 = ((u32(((u32(245) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ba993fb4e68bac08cf36a351() {
  return __cxx_static_address_ba993fb4e68bac08cf36a351.reference || (__cxx_static_address_ba993fb4e68bac08cf36a351.reference = {
    __cReference: true,
    get value() { return DUKE_SCREAM____header_global_0f54bbf31d255162; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:143
export const SHRINKER_HIT____header_global_b30b4fbd67772d65 = ((u32(((u32(246) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_313fe9018b6686d5855aa499() {
  return __cxx_static_address_313fe9018b6686d5855aa499.reference || (__cxx_static_address_313fe9018b6686d5855aa499.reference = {
    __cReference: true,
    get value() { return SHRINKER_HIT____header_global_b30b4fbd67772d65; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:144
export const RATTY____header_global_8c77a7dd49d84755 = ((u32(((u32(247) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b01753d0b025d1e795e8eacf() {
  return __cxx_static_address_b01753d0b025d1e795e8eacf.reference || (__cxx_static_address_b01753d0b025d1e795e8eacf.reference = {
    __cReference: true,
    get value() { return RATTY____header_global_8c77a7dd49d84755; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:145
export const BONUSMUSIC____header_global_ba22c4b772b98d17 = ((u32(((u32(249) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1bbe72559f6d094c81310e7e() {
  return __cxx_static_address_1bbe72559f6d094c81310e7e.reference || (__cxx_static_address_1bbe72559f6d094c81310e7e.reference = {
    __cReference: true,
    get value() { return BONUSMUSIC____header_global_ba22c4b772b98d17; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:146
export const DUKE_GETWEAPON6____header_global_94adc9b7c1e50e80 = ((u32(((u32(264) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b38dbcf0addb8994cd4557e4() {
  return __cxx_static_address_b38dbcf0addb8994cd4557e4.reference || (__cxx_static_address_b38dbcf0addb8994cd4557e4.reference = {
    __cReference: true,
    get value() { return DUKE_GETWEAPON6____header_global_94adc9b7c1e50e80; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:147
export const ALIEN_SWITCH1____header_global_5c36e5e8670d0740 = ((u32(((u32(272) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a13725764e02459d59b99208() {
  return __cxx_static_address_a13725764e02459d59b99208.reference || (__cxx_static_address_a13725764e02459d59b99208.reference = {
    __cReference: true,
    get value() { return ALIEN_SWITCH1____header_global_5c36e5e8670d0740; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:148
export const RIPHEADNECK____header_global_254fd6e1a5d996ce = ((u32(((u32(284) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dc1b4d8d3edb20e26162c261() {
  return __cxx_static_address_dc1b4d8d3edb20e26162c261.reference || (__cxx_static_address_dc1b4d8d3edb20e26162c261.reference = {
    __cReference: true,
    get value() { return RIPHEADNECK____header_global_254fd6e1a5d996ce; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:149
export const ENDSEQVOL3SND4____header_global_1976627155e8c6c7 = ((u32(((u32(288) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_19441ad18ebbfb5bb1b07c28() {
  return __cxx_static_address_19441ad18ebbfb5bb1b07c28.reference || (__cxx_static_address_19441ad18ebbfb5bb1b07c28.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND4____header_global_1976627155e8c6c7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:150
export const ENDSEQVOL3SND5____header_global_45f5f4be1823c33e = ((u32(((u32(289) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0ab37ed8b95bf2273de2feaa() {
  return __cxx_static_address_0ab37ed8b95bf2273de2feaa.reference || (__cxx_static_address_0ab37ed8b95bf2273de2feaa.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND5____header_global_45f5f4be1823c33e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:151
export const ENDSEQVOL3SND6____header_global_5afdcc646c93d612 = ((u32(((u32(290) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9eaf13acda064f07d416e4a0() {
  return __cxx_static_address_9eaf13acda064f07d416e4a0.reference || (__cxx_static_address_9eaf13acda064f07d416e4a0.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND6____header_global_5afdcc646c93d612; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:152
export const ENDSEQVOL3SND7____header_global_f20cfc485a0ec5a4 = ((u32(((u32(291) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9b4930882cae44f1a1087999() {
  return __cxx_static_address_9b4930882cae44f1a1087999.reference || (__cxx_static_address_9b4930882cae44f1a1087999.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND7____header_global_f20cfc485a0ec5a4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:153
export const ENDSEQVOL3SND8____header_global_91282edafde5da7d = ((u32(((u32(292) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f2760bfe4514de045b04df65() {
  return __cxx_static_address_f2760bfe4514de045b04df65.reference || (__cxx_static_address_f2760bfe4514de045b04df65.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND8____header_global_91282edafde5da7d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:154
export const ENDSEQVOL3SND9____header_global_21737cff777f33a2 = ((u32(((u32(293) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e167311c79f31b09bd182d9d() {
  return __cxx_static_address_e167311c79f31b09bd182d9d.reference || (__cxx_static_address_e167311c79f31b09bd182d9d.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND9____header_global_21737cff777f33a2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:155
export const WHIPYOURASS____header_global_4d88c33568f44ea7 = ((u32(((u32(294) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e33e454e27de661072052054() {
  return __cxx_static_address_e33e454e27de661072052054.reference || (__cxx_static_address_e33e454e27de661072052054.reference = {
    __cReference: true,
    get value() { return WHIPYOURASS____header_global_4d88c33568f44ea7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:156
export const ENDSEQVOL2SND1____header_global_db772d4ca987f1a0 = ((u32(((u32(295) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_28dcb06fe328108fad17b4e3() {
  return __cxx_static_address_28dcb06fe328108fad17b4e3.reference || (__cxx_static_address_28dcb06fe328108fad17b4e3.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND1____header_global_db772d4ca987f1a0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:157
export const ENDSEQVOL2SND2____header_global_512c5f78ad3cb794 = ((u32(((u32(296) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a5b6dac31bd5e419727c018a() {
  return __cxx_static_address_a5b6dac31bd5e419727c018a.reference || (__cxx_static_address_a5b6dac31bd5e419727c018a.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND2____header_global_512c5f78ad3cb794; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:158
export const ENDSEQVOL2SND3____header_global_5a26c35e5d01f9a9 = ((u32(((u32(297) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_49af7bfc585f526f23393301() {
  return __cxx_static_address_49af7bfc585f526f23393301.reference || (__cxx_static_address_49af7bfc585f526f23393301.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND3____header_global_5a26c35e5d01f9a9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:159
export const ENDSEQVOL2SND4____header_global_802bf6e278921d24 = ((u32(((u32(298) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_54f62f9542d3a25ec19c8d28() {
  return __cxx_static_address_54f62f9542d3a25ec19c8d28.reference || (__cxx_static_address_54f62f9542d3a25ec19c8d28.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND4____header_global_802bf6e278921d24; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:160
export const ENDSEQVOL2SND5____header_global_06f785fc5b2b719c = ((u32(((u32(299) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_20142fe7b38ae42e8d22d5d9() {
  return __cxx_static_address_20142fe7b38ae42e8d22d5d9.reference || (__cxx_static_address_20142fe7b38ae42e8d22d5d9.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND5____header_global_06f785fc5b2b719c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:161
export const ENDSEQVOL2SND6____header_global_c2377dafe5963810 = ((u32(((u32(300) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c10a042354ada575e50b8c97() {
  return __cxx_static_address_c10a042354ada575e50b8c97.reference || (__cxx_static_address_c10a042354ada575e50b8c97.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND6____header_global_c2377dafe5963810; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:162
export const ENDSEQVOL2SND7____header_global_18f41555e9630b75 = ((u32(((u32(301) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fb796b583f09dd70d6527c81() {
  return __cxx_static_address_fb796b583f09dd70d6527c81.reference || (__cxx_static_address_fb796b583f09dd70d6527c81.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND7____header_global_18f41555e9630b75; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:163
export const SOMETHINGFROZE____header_global_3d36b4123332880b = ((u32(((u32(303) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_57e1519435bfaa9bce1184e6() {
  return __cxx_static_address_57e1519435bfaa9bce1184e6.reference || (__cxx_static_address_57e1519435bfaa9bce1184e6.reference = {
    __cReference: true,
    get value() { return SOMETHINGFROZE____header_global_3d36b4123332880b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:164
export const WIND_REPEAT____header_global_00c048190d5377e1 = ((u32(((u32(308) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_32b1dc6415bc631cb2343338() {
  return __cxx_static_address_32b1dc6415bc631cb2343338.reference || (__cxx_static_address_32b1dc6415bc631cb2343338.reference = {
    __cReference: true,
    get value() { return WIND_REPEAT____header_global_00c048190d5377e1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:165
export const BOS4_RECOG____header_global_4a57acb35d5637bd = ((u32(((u32(342) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bfda214cc4320975582fd391() {
  return __cxx_static_address_bfda214cc4320975582fd391.reference || (__cxx_static_address_bfda214cc4320975582fd391.reference = {
    __cReference: true,
    get value() { return BOS4_RECOG____header_global_4a57acb35d5637bd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:166
export const LIGHTNING_SLAP____header_global_e53bb458c2b692c6 = ((u32(((u32(351) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f469a64597827eb2cac2ed51() {
  return __cxx_static_address_f469a64597827eb2cac2ed51.reference || (__cxx_static_address_f469a64597827eb2cac2ed51.reference = {
    __cReference: true,
    get value() { return LIGHTNING_SLAP____header_global_e53bb458c2b692c6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:167
export const THUNDER____header_global_07a5194ee4388ec2 = ((u32(((u32(352) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f79a74c1eea745d19ba8ca5c() {
  return __cxx_static_address_f79a74c1eea745d19ba8ca5c.reference || (__cxx_static_address_f79a74c1eea745d19ba8ca5c.reference = {
    __cReference: true,
    get value() { return THUNDER____header_global_07a5194ee4388ec2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:168
export const INTRO4_1____header_global_ee27b7de78df47e9 = ((u32(((u32(363) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d386c5f38de88906cc6318ec() {
  return __cxx_static_address_d386c5f38de88906cc6318ec.reference || (__cxx_static_address_d386c5f38de88906cc6318ec.reference = {
    __cReference: true,
    get value() { return INTRO4_1____header_global_ee27b7de78df47e9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:169
export const INTRO4_2____header_global_a66e5b13c573d107 = ((u32(((u32(364) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_14d50fe3d25b518aafa6c9ca() {
  return __cxx_static_address_14d50fe3d25b518aafa6c9ca.reference || (__cxx_static_address_14d50fe3d25b518aafa6c9ca.reference = {
    __cReference: true,
    get value() { return INTRO4_2____header_global_a66e5b13c573d107; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:170
export const INTRO4_3____header_global_94800c9f0a082755 = ((u32(((u32(365) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5094651da15723a2a515005c() {
  return __cxx_static_address_5094651da15723a2a515005c.reference || (__cxx_static_address_5094651da15723a2a515005c.reference = {
    __cReference: true,
    get value() { return INTRO4_3____header_global_94800c9f0a082755; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:171
export const INTRO4_4____header_global_740c0fb18a145ebc = ((u32(((u32(366) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2ef4bd27cdd8066abb8da2e7() {
  return __cxx_static_address_2ef4bd27cdd8066abb8da2e7.reference || (__cxx_static_address_2ef4bd27cdd8066abb8da2e7.reference = {
    __cReference: true,
    get value() { return INTRO4_4____header_global_740c0fb18a145ebc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:172
export const INTRO4_5____header_global_50666e388dda7846 = ((u32(((u32(367) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3f7aed4be87e9aaa3160a78b() {
  return __cxx_static_address_3f7aed4be87e9aaa3160a78b.reference || (__cxx_static_address_3f7aed4be87e9aaa3160a78b.reference = {
    __cReference: true,
    get value() { return INTRO4_5____header_global_50666e388dda7846; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:173
export const INTRO4_6____header_global_ed49778db1ac6c9d = ((u32(((u32(368) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_47dc9e43ce03767b3f95ed9a() {
  return __cxx_static_address_47dc9e43ce03767b3f95ed9a.reference || (__cxx_static_address_47dc9e43ce03767b3f95ed9a.reference = {
    __cReference: true,
    get value() { return INTRO4_6____header_global_ed49778db1ac6c9d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:174
export const BOSS4_DEADSPEECH____header_global_eef0b2c562c47dad = ((u32(((u32(370) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_580e1b4e83d112bcc79405f6() {
  return __cxx_static_address_580e1b4e83d112bcc79405f6.reference || (__cxx_static_address_580e1b4e83d112bcc79405f6.reference = {
    __cReference: true,
    get value() { return BOSS4_DEADSPEECH____header_global_eef0b2c562c47dad; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:175
export const BOSS4_FIRSTSEE____header_global_c6886cec998c1947 = ((u32(((u32(371) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a4e942aac66dce16c82d386f() {
  return __cxx_static_address_a4e942aac66dce16c82d386f.reference || (__cxx_static_address_a4e942aac66dce16c82d386f.reference = {
    __cReference: true,
    get value() { return BOSS4_FIRSTSEE____header_global_c6886cec998c1947; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:176
export const VOL4ENDSND1____header_global_30a4e041123f1dc0 = ((u32(((u32(384) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5b3786518be9b9323b647155() {
  return __cxx_static_address_5b3786518be9b9323b647155.reference || (__cxx_static_address_5b3786518be9b9323b647155.reference = {
    __cReference: true,
    get value() { return VOL4ENDSND1____header_global_30a4e041123f1dc0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:177
export const VOL4ENDSND2____header_global_e64ef7ac411678d0 = ((u32(((u32(385) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eecd687b7a17be521f27900e() {
  return __cxx_static_address_eecd687b7a17be521f27900e.reference || (__cxx_static_address_eecd687b7a17be521f27900e.reference = {
    __cReference: true,
    get value() { return VOL4ENDSND2____header_global_e64ef7ac411678d0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:178
export const EXPANDERSHOOT____header_global_2f813a900cae92ef = ((u32(((u32(388) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_499f643e6c3348de0f664afc() {
  return __cxx_static_address_499f643e6c3348de0f664afc.reference || (__cxx_static_address_499f643e6c3348de0f664afc.reference = {
    __cReference: true,
    get value() { return EXPANDERSHOOT____header_global_2f813a900cae92ef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:179
export const INTRO4_B____header_global_28176cc8eef97e2e = ((u32(((u32(392) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a0503edc4daaecd7d0969bd5() {
  return __cxx_static_address_a0503edc4daaecd7d0969bd5.reference || (__cxx_static_address_a0503edc4daaecd7d0969bd5.reference = {
    __cReference: true,
    get value() { return INTRO4_B____header_global_28176cc8eef97e2e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:180
export const BIGBANG____header_global_bc1c9335def9f13b = ((u32(((u32(393) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_771a1d5206fdf0537a1febed() {
  return __cxx_static_address_771a1d5206fdf0537a1febed.reference || (__cxx_static_address_771a1d5206fdf0537a1febed.reference = {
    __cReference: true,
    get value() { return BIGBANG____header_global_bc1c9335def9f13b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:181
export const FLAMETHROWER_INTRO____header_global_801de439e3611465 = ((u32(((u32(398) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b66e4c41ad24a2e7e504b548() {
  return __cxx_static_address_b66e4c41ad24a2e7e504b548.reference || (__cxx_static_address_b66e4c41ad24a2e7e504b548.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER_INTRO____header_global_801de439e3611465; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:182
export const FLAMETHROWER_LOOP____header_global_a27a6a3d68a9a1d6 = ((u32(((u32(399) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_72a809475134665338d6e2b9() {
  return __cxx_static_address_72a809475134665338d6e2b9.reference || (__cxx_static_address_72a809475134665338d6e2b9.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER_LOOP____header_global_a27a6a3d68a9a1d6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:183
export const FLAMETHROWER_END____header_global_afc10509e13e528c = ((u32(((u32(400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3941cb54f9b97de74a7d6403() {
  return __cxx_static_address_3941cb54f9b97de74a7d6403.reference || (__cxx_static_address_3941cb54f9b97de74a7d6403.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER_END____header_global_afc10509e13e528c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:184
export const E5L7_DUKE_QUIT_YOU____header_global_f1531c35c09b5db3 = ((u32(((u32(401) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a6e442a9bccdea30d32f5593() {
  return __cxx_static_address_a6e442a9bccdea30d32f5593.reference || (__cxx_static_address_a6e442a9bccdea30d32f5593.reference = {
    __cReference: true,
    get value() { return E5L7_DUKE_QUIT_YOU____header_global_f1531c35c09b5db3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:188
export const ACTIVATOR____header_global_1cfa5ef6d9b59a19 = ((u32(((u32(2) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1313095d55c09d9b7a085b63() {
  return __cxx_static_address_1313095d55c09d9b7a085b63.reference || (__cxx_static_address_1313095d55c09d9b7a085b63.reference = {
    __cReference: true,
    get value() { return ACTIVATOR____header_global_1cfa5ef6d9b59a19; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:189
export const TOUCHPLATE____header_global_a09ad3f12b1307cf = ((u32(((u32(3) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5de4043137ffc8dc9f95b88b() {
  return __cxx_static_address_5de4043137ffc8dc9f95b88b.reference || (__cxx_static_address_5de4043137ffc8dc9f95b88b.reference = {
    __cReference: true,
    get value() { return TOUCHPLATE____header_global_a09ad3f12b1307cf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:190
export const ACTIVATORLOCKED____header_global_52e53163afa4d76d = ((u32(((u32(4) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_29d7fea5998ddc7860dd271f() {
  return __cxx_static_address_29d7fea5998ddc7860dd271f.reference || (__cxx_static_address_29d7fea5998ddc7860dd271f.reference = {
    __cReference: true,
    get value() { return ACTIVATORLOCKED____header_global_52e53163afa4d76d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:191
export const MUSICANDSFX____header_global_d94d416d87ac6edc = ((u32(((u32(5) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eee26eb6c4f4f608ca3eaf16() {
  return __cxx_static_address_eee26eb6c4f4f608ca3eaf16.reference || (__cxx_static_address_eee26eb6c4f4f608ca3eaf16.reference = {
    __cReference: true,
    get value() { return MUSICANDSFX____header_global_d94d416d87ac6edc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:192
export const LOCATORS____header_global_423a9ceb0959d5fc = ((u32(((u32(6) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_659d86108579d2e9f4cb2631() {
  return __cxx_static_address_659d86108579d2e9f4cb2631.reference || (__cxx_static_address_659d86108579d2e9f4cb2631.reference = {
    __cReference: true,
    get value() { return LOCATORS____header_global_423a9ceb0959d5fc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:193
export const CYCLER____header_global_7cdf3210258ab77b = ((u32(((u32(7) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0375f8aa053e761c2a417509() {
  return __cxx_static_address_0375f8aa053e761c2a417509.reference || (__cxx_static_address_0375f8aa053e761c2a417509.reference = {
    __cReference: true,
    get value() { return CYCLER____header_global_7cdf3210258ab77b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:194
export const MASTERSWITCH____header_global_f761901f786382e7 = ((u32(((u32(8) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ab21c4597bc66e9334a8a7ee() {
  return __cxx_static_address_ab21c4597bc66e9334a8a7ee.reference || (__cxx_static_address_ab21c4597bc66e9334a8a7ee.reference = {
    __cReference: true,
    get value() { return MASTERSWITCH____header_global_f761901f786382e7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:195
export const RESPAWN____header_global_e9e8f235b4da513b = ((u32(((u32(9) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d741acb19c39ff3004b6e327() {
  return __cxx_static_address_d741acb19c39ff3004b6e327.reference || (__cxx_static_address_d741acb19c39ff3004b6e327.reference = {
    __cReference: true,
    get value() { return RESPAWN____header_global_e9e8f235b4da513b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:196
export const GPSPEED____header_global_da008286a1e0d6ec = ((u32(((u32(10) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bfa42e0614c1e382aa688f6f() {
  return __cxx_static_address_bfa42e0614c1e382aa688f6f.reference || (__cxx_static_address_bfa42e0614c1e382aa688f6f.reference = {
    __cReference: true,
    get value() { return GPSPEED____header_global_da008286a1e0d6ec; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:197
export const FOF____header_global_b17e067a9c98e7b9 = ((u32(((u32(13) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_61504f65a4b02d5b4790e048() {
  return __cxx_static_address_61504f65a4b02d5b4790e048.reference || (__cxx_static_address_61504f65a4b02d5b4790e048.reference = {
    __cReference: true,
    get value() { return FOF____header_global_b17e067a9c98e7b9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:198
export const ARROW____header_global_4d8bba364a854204 = ((u32(((u32(20) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3149f0ae6d3c23c27f357c5a() {
  return __cxx_static_address_3149f0ae6d3c23c27f357c5a.reference || (__cxx_static_address_3149f0ae6d3c23c27f357c5a.reference = {
    __cReference: true,
    get value() { return ARROW____header_global_4d8bba364a854204; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:199
export const FIRSTGUNSPRITE____header_global_08fb3d7c56c3273c = ((u32(((u32(21) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_01a018508403341d7caeefbd() {
  return __cxx_static_address_01a018508403341d7caeefbd.reference || (__cxx_static_address_01a018508403341d7caeefbd.reference = {
    __cReference: true,
    get value() { return FIRSTGUNSPRITE____header_global_08fb3d7c56c3273c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:200
export const CHAINGUNSPRITE____header_global_230d25d36a97e952 = ((u32(((u32(22) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_36969a3f63377d9032c3c74a() {
  return __cxx_static_address_36969a3f63377d9032c3c74a.reference || (__cxx_static_address_36969a3f63377d9032c3c74a.reference = {
    __cReference: true,
    get value() { return CHAINGUNSPRITE____header_global_230d25d36a97e952; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:201
export const RPGSPRITE____header_global_25ebe54a2ad9566b = ((u32(((u32(23) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bd1cd026fec69a8ff2f2ecdd() {
  return __cxx_static_address_bd1cd026fec69a8ff2f2ecdd.reference || (__cxx_static_address_bd1cd026fec69a8ff2f2ecdd.reference = {
    __cReference: true,
    get value() { return RPGSPRITE____header_global_25ebe54a2ad9566b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:202
export const FREEZESPRITE____header_global_6f19a4ec549f5c7b = ((u32(((u32(24) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c93ac722b9588b5f9ae325fd() {
  return __cxx_static_address_c93ac722b9588b5f9ae325fd.reference || (__cxx_static_address_c93ac722b9588b5f9ae325fd.reference = {
    __cReference: true,
    get value() { return FREEZESPRITE____header_global_6f19a4ec549f5c7b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:203
export const SHRINKERSPRITE____header_global_92157020cc849ac1 = ((u32(((u32(25) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_925829f11318a4acae400b7c() {
  return __cxx_static_address_925829f11318a4acae400b7c.reference || (__cxx_static_address_925829f11318a4acae400b7c.reference = {
    __cReference: true,
    get value() { return SHRINKERSPRITE____header_global_92157020cc849ac1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:204
export const HEAVYHBOMB____header_global_2ea7bc1ef953de2b = ((u32(((u32(26) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9eda1afaaef8411fe46ce7a2() {
  return __cxx_static_address_9eda1afaaef8411fe46ce7a2.reference || (__cxx_static_address_9eda1afaaef8411fe46ce7a2.reference = {
    __cReference: true,
    get value() { return HEAVYHBOMB____header_global_2ea7bc1ef953de2b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:205
export const TRIPBOMBSPRITE____header_global_f51a4efe636eb046 = ((u32(((u32(27) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2410b3a5bbc38dfd41b9b9f0() {
  return __cxx_static_address_2410b3a5bbc38dfd41b9b9f0.reference || (__cxx_static_address_2410b3a5bbc38dfd41b9b9f0.reference = {
    __cReference: true,
    get value() { return TRIPBOMBSPRITE____header_global_f51a4efe636eb046; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:206
export const SHOTGUNSPRITE____header_global_c403a2281a5a6c54 = ((u32(((u32(28) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9caaa1d515f22bdc14558543() {
  return __cxx_static_address_9caaa1d515f22bdc14558543.reference || (__cxx_static_address_9caaa1d515f22bdc14558543.reference = {
    __cReference: true,
    get value() { return SHOTGUNSPRITE____header_global_c403a2281a5a6c54; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:207
export const DEVISTATORSPRITE____header_global_7af9efd0d814477b = ((u32(((u32(29) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7f798546e897cc1f3a6aea37() {
  return __cxx_static_address_7f798546e897cc1f3a6aea37.reference || (__cxx_static_address_7f798546e897cc1f3a6aea37.reference = {
    __cReference: true,
    get value() { return DEVISTATORSPRITE____header_global_7af9efd0d814477b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:208
export const HEALTHBOX____header_global_ded0d6551472a532 = ((u32(((u32(30) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e11a842859af1b22b687db9a() {
  return __cxx_static_address_e11a842859af1b22b687db9a.reference || (__cxx_static_address_e11a842859af1b22b687db9a.reference = {
    __cReference: true,
    get value() { return HEALTHBOX____header_global_ded0d6551472a532; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:209
export const AMMOBOX____header_global_d325ecef76010d9e = ((u32(((u32(31) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_72a0d7afa13126202d933c17() {
  return __cxx_static_address_72a0d7afa13126202d933c17.reference || (__cxx_static_address_72a0d7afa13126202d933c17.reference = {
    __cReference: true,
    get value() { return AMMOBOX____header_global_d325ecef76010d9e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:210
export const GROWSPRITEICON____header_global_565b9958fc5f54f6 = ((u32(((u32(32) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a12b996288735eccb020e0a0() {
  return __cxx_static_address_a12b996288735eccb020e0a0.reference || (__cxx_static_address_a12b996288735eccb020e0a0.reference = {
    __cReference: true,
    get value() { return GROWSPRITEICON____header_global_565b9958fc5f54f6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:211
export const INVENTORYBOX____header_global_cd4eb7e06a244686 = ((u32(((u32(33) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b059ca86071d63723a4ad030() {
  return __cxx_static_address_b059ca86071d63723a4ad030.reference || (__cxx_static_address_b059ca86071d63723a4ad030.reference = {
    __cReference: true,
    get value() { return INVENTORYBOX____header_global_cd4eb7e06a244686; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:212
export const FREEZEAMMO____header_global_adc63c69e788bc89 = ((u32(((u32(37) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1afc30f8a029ff08ee824b00() {
  return __cxx_static_address_1afc30f8a029ff08ee824b00.reference || (__cxx_static_address_1afc30f8a029ff08ee824b00.reference = {
    __cReference: true,
    get value() { return FREEZEAMMO____header_global_adc63c69e788bc89; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:213
export const AMMO____header_global_0ee821c76ad32d41 = ((u32(((u32(40) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4cdc13bc42482e3f682ad119() {
  return __cxx_static_address_4cdc13bc42482e3f682ad119.reference || (__cxx_static_address_4cdc13bc42482e3f682ad119.reference = {
    __cReference: true,
    get value() { return AMMO____header_global_0ee821c76ad32d41; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:214
export const BATTERYAMMO____header_global_f1f8909058d1a27b = ((u32(((u32(41) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_042ee10dca962ffb84d04a64() {
  return __cxx_static_address_042ee10dca962ffb84d04a64.reference || (__cxx_static_address_042ee10dca962ffb84d04a64.reference = {
    __cReference: true,
    get value() { return BATTERYAMMO____header_global_f1f8909058d1a27b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:215
export const DEVISTATORAMMO____header_global_ca46378d934f7517 = ((u32(((u32(42) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d9c28ef4ee25ddaa9dab1cc6() {
  return __cxx_static_address_d9c28ef4ee25ddaa9dab1cc6.reference || (__cxx_static_address_d9c28ef4ee25ddaa9dab1cc6.reference = {
    __cReference: true,
    get value() { return DEVISTATORAMMO____header_global_ca46378d934f7517; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:216
export const RPGAMMO____header_global_d765cd1dae93a81d = ((u32(((u32(44) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1ee7bb892c170966c8514dd0() {
  return __cxx_static_address_1ee7bb892c170966c8514dd0.reference || (__cxx_static_address_1ee7bb892c170966c8514dd0.reference = {
    __cReference: true,
    get value() { return RPGAMMO____header_global_d765cd1dae93a81d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:217
export const GROWAMMO____header_global_6512ce23dd9e402f = ((u32(((u32(45) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a22a9ed908eb112252220d5d() {
  return __cxx_static_address_a22a9ed908eb112252220d5d.reference || (__cxx_static_address_a22a9ed908eb112252220d5d.reference = {
    __cReference: true,
    get value() { return GROWAMMO____header_global_6512ce23dd9e402f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:219
export const HBOMBAMMO____header_global_c411723c11da12d2 = ((u32(((u32(47) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6ba45fa1dcf3565d27c6b885() {
  return __cxx_static_address_6ba45fa1dcf3565d27c6b885.reference || (__cxx_static_address_6ba45fa1dcf3565d27c6b885.reference = {
    __cReference: true,
    get value() { return HBOMBAMMO____header_global_c411723c11da12d2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:220
export const AMMOLOTS____header_global_65da3a5d461a1e7a = ((u32(((u32(48) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_19cce1134f1beae59eddf824() {
  return __cxx_static_address_19cce1134f1beae59eddf824.reference || (__cxx_static_address_19cce1134f1beae59eddf824.reference = {
    __cReference: true,
    get value() { return AMMOLOTS____header_global_65da3a5d461a1e7a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:221
export const SHOTGUNAMMO____header_global_091d8d0304e7e300 = ((u32(((u32(49) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_836572e3ac975a260817a061() {
  return __cxx_static_address_836572e3ac975a260817a061.reference || (__cxx_static_address_836572e3ac975a260817a061.reference = {
    __cReference: true,
    get value() { return SHOTGUNAMMO____header_global_091d8d0304e7e300; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:222
export const COLA____header_global_6d33f9537becdc6d = ((u32(((u32(51) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e879da7cbf4b42b639becc01() {
  return __cxx_static_address_e879da7cbf4b42b639becc01.reference || (__cxx_static_address_e879da7cbf4b42b639becc01.reference = {
    __cReference: true,
    get value() { return COLA____header_global_6d33f9537becdc6d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:223
export const SIXPAK____header_global_5626cb5d6b073479 = ((u32(((u32(52) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bc03a9933fdb615d2abdd75f() {
  return __cxx_static_address_bc03a9933fdb615d2abdd75f.reference || (__cxx_static_address_bc03a9933fdb615d2abdd75f.reference = {
    __cReference: true,
    get value() { return SIXPAK____header_global_5626cb5d6b073479; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:224
export const FIRSTAID____header_global_7b550f4f62c0fd0b = ((u32(((u32(53) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1588766ec80298a2bd352067() {
  return __cxx_static_address_1588766ec80298a2bd352067.reference || (__cxx_static_address_1588766ec80298a2bd352067.reference = {
    __cReference: true,
    get value() { return FIRSTAID____header_global_7b550f4f62c0fd0b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:225
export const SHIELD____header_global_78fe52597376084a = ((u32(((u32(54) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9b64ac23c781e9a8f55c0806() {
  return __cxx_static_address_9b64ac23c781e9a8f55c0806.reference || (__cxx_static_address_9b64ac23c781e9a8f55c0806.reference = {
    __cReference: true,
    get value() { return SHIELD____header_global_78fe52597376084a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:226
export const STEROIDS____header_global_2c13bab4f30e16e2 = ((u32(((u32(55) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c81bd67e20b3303a405a2b13() {
  return __cxx_static_address_c81bd67e20b3303a405a2b13.reference || (__cxx_static_address_c81bd67e20b3303a405a2b13.reference = {
    __cReference: true,
    get value() { return STEROIDS____header_global_2c13bab4f30e16e2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:227
export const AIRTANK____header_global_8fa425591c7d35c0 = ((u32(((u32(56) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0c1d9d889b3517364515a9af() {
  return __cxx_static_address_0c1d9d889b3517364515a9af.reference || (__cxx_static_address_0c1d9d889b3517364515a9af.reference = {
    __cReference: true,
    get value() { return AIRTANK____header_global_8fa425591c7d35c0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:228
export const JETPACK____header_global_0d509ca021ba315c = ((u32(((u32(57) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a342e0238abfb066817991be() {
  return __cxx_static_address_a342e0238abfb066817991be.reference || (__cxx_static_address_a342e0238abfb066817991be.reference = {
    __cReference: true,
    get value() { return JETPACK____header_global_0d509ca021ba315c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:229
export const HEATSENSOR____header_global_cbb520c931ec10d8 = ((u32(((u32(59) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ef57ee9ff1effaf683c1e79a() {
  return __cxx_static_address_ef57ee9ff1effaf683c1e79a.reference || (__cxx_static_address_ef57ee9ff1effaf683c1e79a.reference = {
    __cReference: true,
    get value() { return HEATSENSOR____header_global_cbb520c931ec10d8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:230
export const ACCESSCARD____header_global_f035a3080269f739 = ((u32(((u32(60) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a548a7c0c4d55bdfc24ef2ea() {
  return __cxx_static_address_a548a7c0c4d55bdfc24ef2ea.reference || (__cxx_static_address_a548a7c0c4d55bdfc24ef2ea.reference = {
    __cReference: true,
    get value() { return ACCESSCARD____header_global_f035a3080269f739; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:231
export const BOOTS____header_global_a198e6a8f128975b = ((u32(((u32(61) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9135645b1bcebbf23650097e() {
  return __cxx_static_address_9135645b1bcebbf23650097e.reference || (__cxx_static_address_9135645b1bcebbf23650097e.reference = {
    __cReference: true,
    get value() { return BOOTS____header_global_a198e6a8f128975b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:232
export const MIRRORBROKE____header_global_d485dbc7fe2bf4bd = ((u32(((u32(70) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_77faeafcd37c1142feb16fac() {
  return __cxx_static_address_77faeafcd37c1142feb16fac.reference || (__cxx_static_address_77faeafcd37c1142feb16fac.reference = {
    __cReference: true,
    get value() { return MIRRORBROKE____header_global_d485dbc7fe2bf4bd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:233
export const CLOUDYOCEAN____header_global_5f0d43e0ab8816e1 = ((u32(((u32(78) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2782cdcc2609a30974e77c46() {
  return __cxx_static_address_2782cdcc2609a30974e77c46.reference || (__cxx_static_address_2782cdcc2609a30974e77c46.reference = {
    __cReference: true,
    get value() { return CLOUDYOCEAN____header_global_5f0d43e0ab8816e1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:234
export const CLOUDYSKIES____header_global_2c387feb6521150f = ((u32(((u32(79) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2ea0353264e795b2d4300b55() {
  return __cxx_static_address_2ea0353264e795b2d4300b55.reference || (__cxx_static_address_2ea0353264e795b2d4300b55.reference = {
    __cReference: true,
    get value() { return CLOUDYSKIES____header_global_2c387feb6521150f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:235
export const MOONSKY1____header_global_bccd5c23599c1f6f = ((u32(((u32(80) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c6bf492fc88ba6a7dfa2d494() {
  return __cxx_static_address_c6bf492fc88ba6a7dfa2d494.reference || (__cxx_static_address_c6bf492fc88ba6a7dfa2d494.reference = {
    __cReference: true,
    get value() { return MOONSKY1____header_global_bccd5c23599c1f6f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:236
export const BIGORBIT1____header_global_88462eb1d8e98572 = ((u32(((u32(84) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eda7ae33c2aca677bde4160c() {
  return __cxx_static_address_eda7ae33c2aca677bde4160c.reference || (__cxx_static_address_eda7ae33c2aca677bde4160c.reference = {
    __cReference: true,
    get value() { return BIGORBIT1____header_global_88462eb1d8e98572; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:237
export const LA____header_global_bc25cd4541ec6838 = ((u32(((u32(89) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ad93394fb010f5438c5e97a0() {
  return __cxx_static_address_ad93394fb010f5438c5e97a0.reference || (__cxx_static_address_ad93394fb010f5438c5e97a0.reference = {
    __cReference: true,
    get value() { return LA____header_global_bc25cd4541ec6838; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:239
export const TECHLIGHT2____header_global_e38c31b3e7cf5c25 = ((u32(((u32(120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eb40b5f03dc07c5d78c18378() {
  return __cxx_static_address_eb40b5f03dc07c5d78c18378.reference || (__cxx_static_address_eb40b5f03dc07c5d78c18378.reference = {
    __cReference: true,
    get value() { return TECHLIGHT2____header_global_e38c31b3e7cf5c25; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:240
export const TECHLIGHTBUST2____header_global_22b464f3f4ec8c9a = ((u32(((u32(121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cbad4f693cf48087d045590f() {
  return __cxx_static_address_cbad4f693cf48087d045590f.reference || (__cxx_static_address_cbad4f693cf48087d045590f.reference = {
    __cReference: true,
    get value() { return TECHLIGHTBUST2____header_global_22b464f3f4ec8c9a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:241
export const TECHLIGHT4____header_global_726734087ad31bde = ((u32(((u32(122) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f01020dc28b7a60e854b18d1() {
  return __cxx_static_address_f01020dc28b7a60e854b18d1.reference || (__cxx_static_address_f01020dc28b7a60e854b18d1.reference = {
    __cReference: true,
    get value() { return TECHLIGHT4____header_global_726734087ad31bde; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:242
export const TECHLIGHTBUST4____header_global_292f2a8519ff9f20 = ((u32(((u32(123) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_792a1eeb3355d2a0e5b92a2a() {
  return __cxx_static_address_792a1eeb3355d2a0e5b92a2a.reference || (__cxx_static_address_792a1eeb3355d2a0e5b92a2a.reference = {
    __cReference: true,
    get value() { return TECHLIGHTBUST4____header_global_292f2a8519ff9f20; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:243
export const WALLLIGHT4____header_global_1f58649aff26ca26 = ((u32(((u32(124) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_de860ff2f5a0897be1e61b93() {
  return __cxx_static_address_de860ff2f5a0897be1e61b93.reference || (__cxx_static_address_de860ff2f5a0897be1e61b93.reference = {
    __cReference: true,
    get value() { return WALLLIGHT4____header_global_1f58649aff26ca26; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:244
export const WALLLIGHTBUST4____header_global_54e3fe9b1d5ea455 = ((u32(((u32(125) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2adebf931286185681e65f70() {
  return __cxx_static_address_2adebf931286185681e65f70.reference || (__cxx_static_address_2adebf931286185681e65f70.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST4____header_global_54e3fe9b1d5ea455; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:245
export const ACCESSSWITCH____header_global_022b14c9ee5e0775 = ((u32(((u32(130) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_33a1ebf0defe69cf30f89f49() {
  return __cxx_static_address_33a1ebf0defe69cf30f89f49.reference || (__cxx_static_address_33a1ebf0defe69cf30f89f49.reference = {
    __cReference: true,
    get value() { return ACCESSSWITCH____header_global_022b14c9ee5e0775; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:246
export const SLOTDOOR____header_global_cd574e50d7c2ad3a = ((u32(((u32(132) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_db7e2c1a9a49c7fbd9c2bfb3() {
  return __cxx_static_address_db7e2c1a9a49c7fbd9c2bfb3.reference || (__cxx_static_address_db7e2c1a9a49c7fbd9c2bfb3.reference = {
    __cReference: true,
    get value() { return SLOTDOOR____header_global_cd574e50d7c2ad3a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:247
export const LIGHTSWITCH____header_global_ecbe2ba0f4248992 = ((u32(((u32(134) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4f36b5ab9ae2205376da25ad() {
  return __cxx_static_address_4f36b5ab9ae2205376da25ad.reference || (__cxx_static_address_4f36b5ab9ae2205376da25ad.reference = {
    __cReference: true,
    get value() { return LIGHTSWITCH____header_global_ecbe2ba0f4248992; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:248
export const SPACEDOORSWITCH____header_global_3b410d37c4572198 = ((u32(((u32(136) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9d0c6c84dfd36de6034da956() {
  return __cxx_static_address_9d0c6c84dfd36de6034da956.reference || (__cxx_static_address_9d0c6c84dfd36de6034da956.reference = {
    __cReference: true,
    get value() { return SPACEDOORSWITCH____header_global_3b410d37c4572198; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:249
export const SPACELIGHTSWITCH____header_global_17e0be51c9ac0625 = ((u32(((u32(138) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_59c0206e491b82856e5b16b8() {
  return __cxx_static_address_59c0206e491b82856e5b16b8.reference || (__cxx_static_address_59c0206e491b82856e5b16b8.reference = {
    __cReference: true,
    get value() { return SPACELIGHTSWITCH____header_global_17e0be51c9ac0625; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:250
export const FRANKENSTINESWITCH____header_global_a4b33f21193d3295 = ((u32(((u32(140) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8240db10820fdceb58f2eac0() {
  return __cxx_static_address_8240db10820fdceb58f2eac0.reference || (__cxx_static_address_8240db10820fdceb58f2eac0.reference = {
    __cReference: true,
    get value() { return FRANKENSTINESWITCH____header_global_a4b33f21193d3295; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:251
export const NUKEBUTTON____header_global_efd9bd282be9aff8 = ((u32(((u32(142) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_46acc503a0e331e2b1e83093() {
  return __cxx_static_address_46acc503a0e331e2b1e83093.reference || (__cxx_static_address_46acc503a0e331e2b1e83093.reference = {
    __cReference: true,
    get value() { return NUKEBUTTON____header_global_efd9bd282be9aff8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:252
export const MULTISWITCH____header_global_405b3cc4bc598fdd = ((u32(((u32(146) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0c3beef25eedfb4f22dfbac5() {
  return __cxx_static_address_0c3beef25eedfb4f22dfbac5.reference || (__cxx_static_address_0c3beef25eedfb4f22dfbac5.reference = {
    __cReference: true,
    get value() { return MULTISWITCH____header_global_405b3cc4bc598fdd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:253
export const DOORTILE5____header_global_6b03a30130892d65 = ((u32(((u32(150) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_65c924214503f0ac3f12ff1c() {
  return __cxx_static_address_65c924214503f0ac3f12ff1c.reference || (__cxx_static_address_65c924214503f0ac3f12ff1c.reference = {
    __cReference: true,
    get value() { return DOORTILE5____header_global_6b03a30130892d65; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:254
export const DOORTILE6____header_global_1ff816991facfd19 = ((u32(((u32(151) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a49e8b32c8f9ba5537778be8() {
  return __cxx_static_address_a49e8b32c8f9ba5537778be8.reference || (__cxx_static_address_a49e8b32c8f9ba5537778be8.reference = {
    __cReference: true,
    get value() { return DOORTILE6____header_global_1ff816991facfd19; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:255
export const DOORTILE1____header_global_3d65c362ac8a1ff4 = ((u32(((u32(152) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6431c6cabc4fc734ae3d409d() {
  return __cxx_static_address_6431c6cabc4fc734ae3d409d.reference || (__cxx_static_address_6431c6cabc4fc734ae3d409d.reference = {
    __cReference: true,
    get value() { return DOORTILE1____header_global_3d65c362ac8a1ff4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:256
export const DOORTILE2____header_global_e04bf8c3c8e5b7c4 = ((u32(((u32(153) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eea9aa652b97ae33148dc38f() {
  return __cxx_static_address_eea9aa652b97ae33148dc38f.reference || (__cxx_static_address_eea9aa652b97ae33148dc38f.reference = {
    __cReference: true,
    get value() { return DOORTILE2____header_global_e04bf8c3c8e5b7c4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:257
export const DOORTILE3____header_global_9ee8c49ced930dc7 = ((u32(((u32(154) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_00056282a7ac493b099ce451() {
  return __cxx_static_address_00056282a7ac493b099ce451.reference || (__cxx_static_address_00056282a7ac493b099ce451.reference = {
    __cReference: true,
    get value() { return DOORTILE3____header_global_9ee8c49ced930dc7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:258
export const DOORTILE4____header_global_363046a71488427f = ((u32(((u32(155) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f17a27edffdef220fbb837ea() {
  return __cxx_static_address_f17a27edffdef220fbb837ea.reference || (__cxx_static_address_f17a27edffdef220fbb837ea.reference = {
    __cReference: true,
    get value() { return DOORTILE4____header_global_363046a71488427f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:259
export const DOORTILE7____header_global_ca149b6c1a33c80b = ((u32(((u32(156) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ff7e197ff4919d7f5a5c8b0d() {
  return __cxx_static_address_ff7e197ff4919d7f5a5c8b0d.reference || (__cxx_static_address_ff7e197ff4919d7f5a5c8b0d.reference = {
    __cReference: true,
    get value() { return DOORTILE7____header_global_ca149b6c1a33c80b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:260
export const DOORTILE8____header_global_45d4e749328dcbfd = ((u32(((u32(157) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dc816fbbcb5eab14433e0dec() {
  return __cxx_static_address_dc816fbbcb5eab14433e0dec.reference || (__cxx_static_address_dc816fbbcb5eab14433e0dec.reference = {
    __cReference: true,
    get value() { return DOORTILE8____header_global_45d4e749328dcbfd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:261
export const DOORTILE9____header_global_f44f946d837cb648 = ((u32(((u32(158) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a7316a3351e74a4b0cdcf42b() {
  return __cxx_static_address_a7316a3351e74a4b0cdcf42b.reference || (__cxx_static_address_a7316a3351e74a4b0cdcf42b.reference = {
    __cReference: true,
    get value() { return DOORTILE9____header_global_f44f946d837cb648; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:262
export const DOORTILE10____header_global_bd8cb4eb846bec72 = ((u32(((u32(159) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_289332e5e50f5162e0eff06f() {
  return __cxx_static_address_289332e5e50f5162e0eff06f.reference || (__cxx_static_address_289332e5e50f5162e0eff06f.reference = {
    __cReference: true,
    get value() { return DOORTILE10____header_global_bd8cb4eb846bec72; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:263
export const DOORSHOCK____header_global_7044fea55acf6707 = ((u32(((u32(160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_74fe08ef36d60d3520e31251() {
  return __cxx_static_address_74fe08ef36d60d3520e31251.reference || (__cxx_static_address_74fe08ef36d60d3520e31251.reference = {
    __cReference: true,
    get value() { return DOORSHOCK____header_global_7044fea55acf6707; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:264
export const DIPSWITCH____header_global_58b0eef124d7e106 = ((u32(((u32(162) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9bf4284ba8ef71a932d8d70a() {
  return __cxx_static_address_9bf4284ba8ef71a932d8d70a.reference || (__cxx_static_address_9bf4284ba8ef71a932d8d70a.reference = {
    __cReference: true,
    get value() { return DIPSWITCH____header_global_58b0eef124d7e106; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:265
export const DIPSWITCH2____header_global_1f0bbe3335cc20fd = ((u32(((u32(164) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eb6bdbd9260a4df8bf32cf3c() {
  return __cxx_static_address_eb6bdbd9260a4df8bf32cf3c.reference || (__cxx_static_address_eb6bdbd9260a4df8bf32cf3c.reference = {
    __cReference: true,
    get value() { return DIPSWITCH2____header_global_1f0bbe3335cc20fd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:266
export const TECHSWITCH____header_global_c6e2e2390f1818d1 = ((u32(((u32(166) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_155cdbd9cf14dd16ec69729c() {
  return __cxx_static_address_155cdbd9cf14dd16ec69729c.reference || (__cxx_static_address_155cdbd9cf14dd16ec69729c.reference = {
    __cReference: true,
    get value() { return TECHSWITCH____header_global_c6e2e2390f1818d1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:267
export const DIPSWITCH3____header_global_664a6cdc672356ff = ((u32(((u32(168) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ecaeb644be122133833abd77() {
  return __cxx_static_address_ecaeb644be122133833abd77.reference || (__cxx_static_address_ecaeb644be122133833abd77.reference = {
    __cReference: true,
    get value() { return DIPSWITCH3____header_global_664a6cdc672356ff; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:268
export const ACCESSSWITCH2____header_global_00587625c1ee4b07 = ((u32(((u32(170) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fd1049690ad4e39b3701b319() {
  return __cxx_static_address_fd1049690ad4e39b3701b319.reference || (__cxx_static_address_fd1049690ad4e39b3701b319.reference = {
    __cReference: true,
    get value() { return ACCESSSWITCH2____header_global_00587625c1ee4b07; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:269
export const FLOORSLIME____header_global_8c143871874e3dd9 = ((u32(((u32(200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3ecf0ae4779d1fba2093eb12() {
  return __cxx_static_address_3ecf0ae4779d1fba2093eb12.reference || (__cxx_static_address_3ecf0ae4779d1fba2093eb12.reference = {
    __cReference: true,
    get value() { return FLOORSLIME____header_global_8c143871874e3dd9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:270
export const BIGFORCE____header_global_d9001451b55de3a4 = ((u32(((u32(230) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7351d2403de01efb64d1150d() {
  return __cxx_static_address_7351d2403de01efb64d1150d.reference || (__cxx_static_address_7351d2403de01efb64d1150d.reference = {
    __cReference: true,
    get value() { return BIGFORCE____header_global_d9001451b55de3a4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:271
export const MASKWALL9____header_global_b4914d362fed9cfa = ((u32(((u32(255) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_95b29e936d4818753b666066() {
  return __cxx_static_address_95b29e936d4818753b666066.reference || (__cxx_static_address_95b29e936d4818753b666066.reference = {
    __cReference: true,
    get value() { return MASKWALL9____header_global_b4914d362fed9cfa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:272
export const SCREENBREAK1____header_global_133a5c1790402597 = ((u32(((u32(263) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d94a09e29b17974eba0cf6af() {
  return __cxx_static_address_d94a09e29b17974eba0cf6af.reference || (__cxx_static_address_d94a09e29b17974eba0cf6af.reference = {
    __cReference: true,
    get value() { return SCREENBREAK1____header_global_133a5c1790402597; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:273
export const SCREENBREAK2____header_global_5933d426cd4b090c = ((u32(((u32(264) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_512f51f9c1696bb03648bebc() {
  return __cxx_static_address_512f51f9c1696bb03648bebc.reference || (__cxx_static_address_512f51f9c1696bb03648bebc.reference = {
    __cReference: true,
    get value() { return SCREENBREAK2____header_global_5933d426cd4b090c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:274
export const SCREENBREAK3____header_global_820cd13feb66cb11 = ((u32(((u32(265) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0d38a3e816c3d9c234c55442() {
  return __cxx_static_address_0d38a3e816c3d9c234c55442.reference || (__cxx_static_address_0d38a3e816c3d9c234c55442.reference = {
    __cReference: true,
    get value() { return SCREENBREAK3____header_global_820cd13feb66cb11; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:275
export const SCREENBREAK4____header_global_0fdc0fd1f87e318e = ((u32(((u32(266) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cbc6653144c7d9bbed43e1cd() {
  return __cxx_static_address_cbc6653144c7d9bbed43e1cd.reference || (__cxx_static_address_cbc6653144c7d9bbed43e1cd.reference = {
    __cReference: true,
    get value() { return SCREENBREAK4____header_global_0fdc0fd1f87e318e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:276
export const SCREENBREAK5____header_global_e2ba31960890800d = ((u32(((u32(267) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c8e636cbb85fa5e843a35534() {
  return __cxx_static_address_c8e636cbb85fa5e843a35534.reference || (__cxx_static_address_c8e636cbb85fa5e843a35534.reference = {
    __cReference: true,
    get value() { return SCREENBREAK5____header_global_e2ba31960890800d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:277
export const SCREENBREAK6____header_global_18859719d0368d65 = ((u32(((u32(268) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cb23ef192ec73937062e7a09() {
  return __cxx_static_address_cb23ef192ec73937062e7a09.reference || (__cxx_static_address_cb23ef192ec73937062e7a09.reference = {
    __cReference: true,
    get value() { return SCREENBREAK6____header_global_18859719d0368d65; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:278
export const SCREENBREAK7____header_global_752062a7fc2b62c4 = ((u32(((u32(269) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0605135b7ce93833cf6d5211() {
  return __cxx_static_address_0605135b7ce93833cf6d5211.reference || (__cxx_static_address_0605135b7ce93833cf6d5211.reference = {
    __cReference: true,
    get value() { return SCREENBREAK7____header_global_752062a7fc2b62c4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:279
export const SCREENBREAK8____header_global_77826a5577ca79e6 = ((u32(((u32(270) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b945cfede6903497aa13dcc3() {
  return __cxx_static_address_b945cfede6903497aa13dcc3.reference || (__cxx_static_address_b945cfede6903497aa13dcc3.reference = {
    __cReference: true,
    get value() { return SCREENBREAK8____header_global_77826a5577ca79e6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:280
export const SCREENBREAK9____header_global_49e0b03324f66b9e = ((u32(((u32(271) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4a09f356414ead421cd0ad52() {
  return __cxx_static_address_4a09f356414ead421cd0ad52.reference || (__cxx_static_address_4a09f356414ead421cd0ad52.reference = {
    __cReference: true,
    get value() { return SCREENBREAK9____header_global_49e0b03324f66b9e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:281
export const SCREENBREAK10____header_global_28874717c4bd93c1 = ((u32(((u32(272) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_86001fb84f86eb41e6ee11cd() {
  return __cxx_static_address_86001fb84f86eb41e6ee11cd.reference || (__cxx_static_address_86001fb84f86eb41e6ee11cd.reference = {
    __cReference: true,
    get value() { return SCREENBREAK10____header_global_28874717c4bd93c1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:282
export const SCREENBREAK11____header_global_93ea33b6b93e2c82 = ((u32(((u32(273) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_98a0fb89bce894ffbf36c3cf() {
  return __cxx_static_address_98a0fb89bce894ffbf36c3cf.reference || (__cxx_static_address_98a0fb89bce894ffbf36c3cf.reference = {
    __cReference: true,
    get value() { return SCREENBREAK11____header_global_93ea33b6b93e2c82; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:283
export const SCREENBREAK12____header_global_fb24a81e3affc509 = ((u32(((u32(274) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d9d0f521ad8301451f3447dc() {
  return __cxx_static_address_d9d0f521ad8301451f3447dc.reference || (__cxx_static_address_d9d0f521ad8301451f3447dc.reference = {
    __cReference: true,
    get value() { return SCREENBREAK12____header_global_fb24a81e3affc509; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:284
export const SCREENBREAK13____header_global_6fba591c8ade88d2 = ((u32(((u32(275) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ac124358d4e07c1db1622208() {
  return __cxx_static_address_ac124358d4e07c1db1622208.reference || (__cxx_static_address_ac124358d4e07c1db1622208.reference = {
    __cReference: true,
    get value() { return SCREENBREAK13____header_global_6fba591c8ade88d2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:285
export const MASKWALL1____header_global_98cfb8b24427eb09 = ((u32(((u32(285) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7bcbc86db8ef7e6ae5e0dc66() {
  return __cxx_static_address_7bcbc86db8ef7e6ae5e0dc66.reference || (__cxx_static_address_7bcbc86db8ef7e6ae5e0dc66.reference = {
    __cReference: true,
    get value() { return MASKWALL1____header_global_98cfb8b24427eb09; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:286
export const W_TECHWALL1____header_global_7cba171f5df3d5f6 = ((u32(((u32(293) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4c94ac11f609a142386ce7a5() {
  return __cxx_static_address_4c94ac11f609a142386ce7a5.reference || (__cxx_static_address_4c94ac11f609a142386ce7a5.reference = {
    __cReference: true,
    get value() { return W_TECHWALL1____header_global_7cba171f5df3d5f6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:287
export const W_TECHWALL2____header_global_3b9db476bd4106f6 = ((u32(((u32(297) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f8120f6a8af84fc5885a618f() {
  return __cxx_static_address_f8120f6a8af84fc5885a618f.reference || (__cxx_static_address_f8120f6a8af84fc5885a618f.reference = {
    __cReference: true,
    get value() { return W_TECHWALL2____header_global_3b9db476bd4106f6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:288
export const W_TECHWALL15____header_global_1d5e239ef427290a = ((u32(((u32(299) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bd6a9ed428ddf3186e64ed19() {
  return __cxx_static_address_bd6a9ed428ddf3186e64ed19.reference || (__cxx_static_address_bd6a9ed428ddf3186e64ed19.reference = {
    __cReference: true,
    get value() { return W_TECHWALL15____header_global_1d5e239ef427290a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:289
export const W_TECHWALL3____header_global_3ac0e8d1f4cf5de5 = ((u32(((u32(301) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ecfc8cf56e5705ba60958b95() {
  return __cxx_static_address_ecfc8cf56e5705ba60958b95.reference || (__cxx_static_address_ecfc8cf56e5705ba60958b95.reference = {
    __cReference: true,
    get value() { return W_TECHWALL3____header_global_3ac0e8d1f4cf5de5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:290
export const W_TECHWALL4____header_global_f8fb6bfe716e2518 = ((u32(((u32(305) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2e6d96ccb98b53286e737acf() {
  return __cxx_static_address_2e6d96ccb98b53286e737acf.reference || (__cxx_static_address_2e6d96ccb98b53286e737acf.reference = {
    __cReference: true,
    get value() { return W_TECHWALL4____header_global_f8fb6bfe716e2518; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:291
export const W_TECHWALL10____header_global_29bb6755458998f1 = ((u32(((u32(306) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f0562d535957b0850e451580() {
  return __cxx_static_address_f0562d535957b0850e451580.reference || (__cxx_static_address_f0562d535957b0850e451580.reference = {
    __cReference: true,
    get value() { return W_TECHWALL10____header_global_29bb6755458998f1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:292
export const W_TECHWALL16____header_global_fa5622fba3b50913 = ((u32(((u32(307) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0ce6effd20f19e417eeb2154() {
  return __cxx_static_address_0ce6effd20f19e417eeb2154.reference || (__cxx_static_address_0ce6effd20f19e417eeb2154.reference = {
    __cReference: true,
    get value() { return W_TECHWALL16____header_global_fa5622fba3b50913; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:293
export const WATERTILE2____header_global_cb48b318ee8a7d54 = ((u32(((u32(336) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_43c4d40acef7c7cef67a0663() {
  return __cxx_static_address_43c4d40acef7c7cef67a0663.reference || (__cxx_static_address_43c4d40acef7c7cef67a0663.reference = {
    __cReference: true,
    get value() { return WATERTILE2____header_global_cb48b318ee8a7d54; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:294
export const BPANNEL1____header_global_dc7204e5427f3629 = ((u32(((u32(341) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ceb9039de5bd9c84e82c2fe3() {
  return __cxx_static_address_ceb9039de5bd9c84e82c2fe3.reference || (__cxx_static_address_ceb9039de5bd9c84e82c2fe3.reference = {
    __cReference: true,
    get value() { return BPANNEL1____header_global_dc7204e5427f3629; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:295
export const PANNEL1____header_global_f5336d967ed4bfaa = ((u32(((u32(342) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4d16dc64dd9dac624001998c() {
  return __cxx_static_address_4d16dc64dd9dac624001998c.reference || (__cxx_static_address_4d16dc64dd9dac624001998c.reference = {
    __cReference: true,
    get value() { return PANNEL1____header_global_f5336d967ed4bfaa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:296
export const PANNEL2____header_global_b27b6fe4e40357da = ((u32(((u32(343) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_31fbeeb7aed99e444c111e80() {
  return __cxx_static_address_31fbeeb7aed99e444c111e80.reference || (__cxx_static_address_31fbeeb7aed99e444c111e80.reference = {
    __cReference: true,
    get value() { return PANNEL2____header_global_b27b6fe4e40357da; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:297
export const STATIC____header_global_78f390b0725bbb00 = ((u32(((u32(351) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bb765f31dd2d3f25163371ec() {
  return __cxx_static_address_bb765f31dd2d3f25163371ec.reference || (__cxx_static_address_bb765f31dd2d3f25163371ec.reference = {
    __cReference: true,
    get value() { return STATIC____header_global_78f390b0725bbb00; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:298
export const W_SCREENBREAK____header_global_bfcbb03067ed4cbb = ((u32(((u32(357) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9c0095913b40e664f8579a25() {
  return __cxx_static_address_9c0095913b40e664f8579a25.reference || (__cxx_static_address_9c0095913b40e664f8579a25.reference = {
    __cReference: true,
    get value() { return W_SCREENBREAK____header_global_bfcbb03067ed4cbb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:299
export const W_HITTECHWALL3____header_global_d842edf47a533a30 = ((u32(((u32(360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_acb69ead8e3e32475f4addd4() {
  return __cxx_static_address_acb69ead8e3e32475f4addd4.reference || (__cxx_static_address_acb69ead8e3e32475f4addd4.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL3____header_global_d842edf47a533a30; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:300
export const W_HITTECHWALL4____header_global_7b98f3d916770c7a = ((u32(((u32(361) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_90e4b6541d3cfcdf929284c2() {
  return __cxx_static_address_90e4b6541d3cfcdf929284c2.reference || (__cxx_static_address_90e4b6541d3cfcdf929284c2.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL4____header_global_7b98f3d916770c7a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:301
export const W_HITTECHWALL2____header_global_94dc25f869d2cfe3 = ((u32(((u32(362) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0ab3b68ed359ac65e943e04a() {
  return __cxx_static_address_0ab3b68ed359ac65e943e04a.reference || (__cxx_static_address_0ab3b68ed359ac65e943e04a.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL2____header_global_94dc25f869d2cfe3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:302
export const W_HITTECHWALL1____header_global_3c905423f45530d6 = ((u32(((u32(363) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_09a88f991d77c8fbaa1a46a2() {
  return __cxx_static_address_09a88f991d77c8fbaa1a46a2.reference || (__cxx_static_address_09a88f991d77c8fbaa1a46a2.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL1____header_global_3c905423f45530d6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:303
export const MASKWALL10____header_global_a6a602c5e88afb70 = ((u32(((u32(387) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2b626d2fa93a15dda0167500() {
  return __cxx_static_address_2b626d2fa93a15dda0167500.reference || (__cxx_static_address_2b626d2fa93a15dda0167500.reference = {
    __cReference: true,
    get value() { return MASKWALL10____header_global_a6a602c5e88afb70; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:304
export const MASKWALL11____header_global_d21c5e346c5aa84d = ((u32(((u32(391) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eef0debb395d5a11d4db6bf1() {
  return __cxx_static_address_eef0debb395d5a11d4db6bf1.reference || (__cxx_static_address_eef0debb395d5a11d4db6bf1.reference = {
    __cReference: true,
    get value() { return MASKWALL11____header_global_d21c5e346c5aa84d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:305
export const DOORTILE22____header_global_613f69b6d1e2a419 = ((u32(((u32(395) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_54c8f9dbed4847a243d021a4() {
  return __cxx_static_address_54c8f9dbed4847a243d021a4.reference || (__cxx_static_address_54c8f9dbed4847a243d021a4.reference = {
    __cReference: true,
    get value() { return DOORTILE22____header_global_613f69b6d1e2a419; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:306
export const FANSPRITE____header_global_681b0b93ea238c03 = ((u32(((u32(407) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9a73594c762c40029c59e9e6() {
  return __cxx_static_address_9a73594c762c40029c59e9e6.reference || (__cxx_static_address_9a73594c762c40029c59e9e6.reference = {
    __cReference: true,
    get value() { return FANSPRITE____header_global_681b0b93ea238c03; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:307
export const FANSPRITEBROKE____header_global_910d9b5f91f628d5 = ((u32(((u32(411) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e3327a0b1035e4cbdaeeefb8() {
  return __cxx_static_address_e3327a0b1035e4cbdaeeefb8.reference || (__cxx_static_address_e3327a0b1035e4cbdaeeefb8.reference = {
    __cReference: true,
    get value() { return FANSPRITEBROKE____header_global_910d9b5f91f628d5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:308
export const FANSHADOW____header_global_3bf1e9faa3c14f3d = ((u32(((u32(412) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6c297217f2104ebab19ca3ff() {
  return __cxx_static_address_6c297217f2104ebab19ca3ff.reference || (__cxx_static_address_6c297217f2104ebab19ca3ff.reference = {
    __cReference: true,
    get value() { return FANSHADOW____header_global_3bf1e9faa3c14f3d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:309
export const FANSHADOWBROKE____header_global_a6b2d2fe68c06445 = ((u32(((u32(416) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_140f6684b08d7247e4956136() {
  return __cxx_static_address_140f6684b08d7247e4956136.reference || (__cxx_static_address_140f6684b08d7247e4956136.reference = {
    __cReference: true,
    get value() { return FANSHADOWBROKE____header_global_a6b2d2fe68c06445; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:310
export const DOORTILE18____header_global_1cd3fd586c9fb732 = ((u32(((u32(447) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1e9ef1561e755a9e7798319d() {
  return __cxx_static_address_1e9ef1561e755a9e7798319d.reference || (__cxx_static_address_1e9ef1561e755a9e7798319d.reference = {
    __cReference: true,
    get value() { return DOORTILE18____header_global_1cd3fd586c9fb732; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:311
export const DOORTILE19____header_global_a374f21f16e7f727 = ((u32(((u32(448) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fd466985bf70e2988c95ff85() {
  return __cxx_static_address_fd466985bf70e2988c95ff85.reference || (__cxx_static_address_fd466985bf70e2988c95ff85.reference = {
    __cReference: true,
    get value() { return DOORTILE19____header_global_a374f21f16e7f727; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:312
export const DOORTILE20____header_global_e9562bc3aa2a6fb3 = ((u32(((u32(449) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a2039d3192ac77f31e6b3aab() {
  return __cxx_static_address_a2039d3192ac77f31e6b3aab.reference || (__cxx_static_address_a2039d3192ac77f31e6b3aab.reference = {
    __cReference: true,
    get value() { return DOORTILE20____header_global_e9562bc3aa2a6fb3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:313
export const VIEWSCREEN2____header_global_b1a6cefd3c09eac9 = ((u32(((u32(499) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c90f8b1511313702f2a00c07() {
  return __cxx_static_address_c90f8b1511313702f2a00c07.reference || (__cxx_static_address_c90f8b1511313702f2a00c07.reference = {
    __cReference: true,
    get value() { return VIEWSCREEN2____header_global_b1a6cefd3c09eac9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:314
export const VIEWSCREEN____header_global_e6df8cddeb7b65ee = ((u32(((u32(502) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_93938916cf6770c545d06f27() {
  return __cxx_static_address_93938916cf6770c545d06f27.reference || (__cxx_static_address_93938916cf6770c545d06f27.reference = {
    __cReference: true,
    get value() { return VIEWSCREEN____header_global_e6df8cddeb7b65ee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:315
export const GLASS____header_global_45d06c8a2f751453 = ((u32(((u32(503) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6b79fb6965b573e930aefb86() {
  return __cxx_static_address_6b79fb6965b573e930aefb86.reference || (__cxx_static_address_6b79fb6965b573e930aefb86.reference = {
    __cReference: true,
    get value() { return GLASS____header_global_45d06c8a2f751453; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:316
export const GLASS2____header_global_e415037bf08c4751 = ((u32(((u32(504) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c744373bfa09af92cb18ef42() {
  return __cxx_static_address_c744373bfa09af92cb18ef42.reference || (__cxx_static_address_c744373bfa09af92cb18ef42.reference = {
    __cReference: true,
    get value() { return GLASS2____header_global_e415037bf08c4751; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:317
export const STAINGLASS1____header_global_8a4f14ca35eb7a33 = ((u32(((u32(510) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a8b67328e7d62b2114f62389() {
  return __cxx_static_address_a8b67328e7d62b2114f62389.reference || (__cxx_static_address_a8b67328e7d62b2114f62389.reference = {
    __cReference: true,
    get value() { return STAINGLASS1____header_global_8a4f14ca35eb7a33; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:318
export const MASKWALL5____header_global_c215eaa15ce8f1d1 = ((u32(((u32(514) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3d9371bbdee51ff9d74ef19d() {
  return __cxx_static_address_3d9371bbdee51ff9d74ef19d.reference || (__cxx_static_address_3d9371bbdee51ff9d74ef19d.reference = {
    __cReference: true,
    get value() { return MASKWALL5____header_global_c215eaa15ce8f1d1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:319
export const SATELITE____header_global_4c2ed0605d5f60d6 = ((u32(((u32(516) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b06020dca86ea0f26ab0d485() {
  return __cxx_static_address_b06020dca86ea0f26ab0d485.reference || (__cxx_static_address_b06020dca86ea0f26ab0d485.reference = {
    __cReference: true,
    get value() { return SATELITE____header_global_4c2ed0605d5f60d6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:320
export const FUELPOD____header_global_33805c2581f0f708 = ((u32(((u32(517) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4f690f9a4511246a31f3e6b9() {
  return __cxx_static_address_4f690f9a4511246a31f3e6b9.reference || (__cxx_static_address_4f690f9a4511246a31f3e6b9.reference = {
    __cReference: true,
    get value() { return FUELPOD____header_global_33805c2581f0f708; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:326
export const DOMELITE____header_global_0083b507bc648935 = ((u32(((u32(551) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4f0efcf48e5ba5b428905fc3() {
  return __cxx_static_address_4f0efcf48e5ba5b428905fc3.reference || (__cxx_static_address_4f0efcf48e5ba5b428905fc3.reference = {
    __cReference: true,
    get value() { return DOMELITE____header_global_0083b507bc648935; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:327
export const CAMERAPOLE____header_global_79d77073b50a14ec = ((u32(((u32(554) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_77285730be6198e7ea1ce0f6() {
  return __cxx_static_address_77285730be6198e7ea1ce0f6.reference || (__cxx_static_address_77285730be6198e7ea1ce0f6.reference = {
    __cReference: true,
    get value() { return CAMERAPOLE____header_global_79d77073b50a14ec; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:328
export const CHAIR1____header_global_651515a7f8c19b31 = ((u32(((u32(556) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ddba006653710b5e4f5bfe25() {
  return __cxx_static_address_ddba006653710b5e4f5bfe25.reference || (__cxx_static_address_ddba006653710b5e4f5bfe25.reference = {
    __cReference: true,
    get value() { return CHAIR1____header_global_651515a7f8c19b31; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:329
export const CHAIR2____header_global_31073934ead127a5 = ((u32(((u32(557) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5cc95510aadabed1fe9a2ef7() {
  return __cxx_static_address_5cc95510aadabed1fe9a2ef7.reference || (__cxx_static_address_5cc95510aadabed1fe9a2ef7.reference = {
    __cReference: true,
    get value() { return CHAIR2____header_global_31073934ead127a5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:330
export const BROKENCHAIR____header_global_6d8fc5f4a7d95139 = ((u32(((u32(559) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_675576dc38591c9b4d1346b5() {
  return __cxx_static_address_675576dc38591c9b4d1346b5.reference || (__cxx_static_address_675576dc38591c9b4d1346b5.reference = {
    __cReference: true,
    get value() { return BROKENCHAIR____header_global_6d8fc5f4a7d95139; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:331
export const MIRROR____header_global_43a78267aacafbe4 = ((u32(((u32(560) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4266feb573a072f8410ced97() {
  return __cxx_static_address_4266feb573a072f8410ced97.reference || (__cxx_static_address_4266feb573a072f8410ced97.reference = {
    __cReference: true,
    get value() { return MIRROR____header_global_43a78267aacafbe4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:332
export const WATERFOUNTAIN____header_global_82f97bd9cddf82ea = ((u32(((u32(563) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_032936bf46af9e51b057a090() {
  return __cxx_static_address_032936bf46af9e51b057a090.reference || (__cxx_static_address_032936bf46af9e51b057a090.reference = {
    __cReference: true,
    get value() { return WATERFOUNTAIN____header_global_82f97bd9cddf82ea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:333
export const WATERFOUNTAINBROKE____header_global_1fae1d41ff74ebf4 = ((u32(((u32(567) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9aad339cacff4809f18c6ae3() {
  return __cxx_static_address_9aad339cacff4809f18c6ae3.reference || (__cxx_static_address_9aad339cacff4809f18c6ae3.reference = {
    __cReference: true,
    get value() { return WATERFOUNTAINBROKE____header_global_1fae1d41ff74ebf4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:335
export const TOILET____header_global_f24a4e527dccb16c = ((u32(((u32(569) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3ddcddb56b446141bfd4a647() {
  return __cxx_static_address_3ddcddb56b446141bfd4a647.reference || (__cxx_static_address_3ddcddb56b446141bfd4a647.reference = {
    __cReference: true,
    get value() { return TOILET____header_global_f24a4e527dccb16c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:336
export const STALL____header_global_ee2e325d065fa1f4 = ((u32(((u32(571) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b256704fe29b163a7a569d32() {
  return __cxx_static_address_b256704fe29b163a7a569d32.reference || (__cxx_static_address_b256704fe29b163a7a569d32.reference = {
    __cReference: true,
    get value() { return STALL____header_global_ee2e325d065fa1f4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:337
export const STALLBROKE____header_global_0758ece2c90744ec = ((u32(((u32(573) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0d566fe395366157b3b3ac0b() {
  return __cxx_static_address_0d566fe395366157b3b3ac0b.reference || (__cxx_static_address_0d566fe395366157b3b3ac0b.reference = {
    __cReference: true,
    get value() { return STALLBROKE____header_global_0758ece2c90744ec; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:339
export const REACTOR2____header_global_7c0f2a8b3489ebca = ((u32(((u32(578) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4ccbe275e23dbd6d4a728a27() {
  return __cxx_static_address_4ccbe275e23dbd6d4a728a27.reference || (__cxx_static_address_4ccbe275e23dbd6d4a728a27.reference = {
    __cReference: true,
    get value() { return REACTOR2____header_global_7c0f2a8b3489ebca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:340
export const REACTOR2BURNT____header_global_56c902de9684c5a7 = ((u32(((u32(579) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dc9d1cdc295a7455848734c8() {
  return __cxx_static_address_dc9d1cdc295a7455848734c8.reference || (__cxx_static_address_dc9d1cdc295a7455848734c8.reference = {
    __cReference: true,
    get value() { return REACTOR2BURNT____header_global_56c902de9684c5a7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:341
export const REACTOR2SPARK____header_global_fab869202e22c868 = ((u32(((u32(580) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c2645b33c2dcab480b9cd405() {
  return __cxx_static_address_c2645b33c2dcab480b9cd405.reference || (__cxx_static_address_c2645b33c2dcab480b9cd405.reference = {
    __cReference: true,
    get value() { return REACTOR2SPARK____header_global_fab869202e22c868; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:342
export const GRATE1____header_global_c1b9180626c77227 = ((u32(((u32(595) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f3afd57291a558d106bb50a2() {
  return __cxx_static_address_f3afd57291a558d106bb50a2.reference || (__cxx_static_address_f3afd57291a558d106bb50a2.reference = {
    __cReference: true,
    get value() { return GRATE1____header_global_c1b9180626c77227; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:343
export const BGRATE1____header_global_19113273e5fff4e7 = ((u32(((u32(596) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3ea2340863c48be94c084fbe() {
  return __cxx_static_address_3ea2340863c48be94c084fbe.reference || (__cxx_static_address_3ea2340863c48be94c084fbe.reference = {
    __cReference: true,
    get value() { return BGRATE1____header_global_19113273e5fff4e7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:344
export const SOLARPANNEL____header_global_cbb25bda8ef49168 = ((u32(((u32(602) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a554c5d7988c0074314d6535() {
  return __cxx_static_address_a554c5d7988c0074314d6535.reference || (__cxx_static_address_a554c5d7988c0074314d6535.reference = {
    __cReference: true,
    get value() { return SOLARPANNEL____header_global_cbb25bda8ef49168; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:346
export const ANTENNA____header_global_1e9d5fd7c732f77b = ((u32(((u32(607) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_db9cb2852e5c8940a4f41e66() {
  return __cxx_static_address_db9cb2852e5c8940a4f41e66.reference || (__cxx_static_address_db9cb2852e5c8940a4f41e66.reference = {
    __cReference: true,
    get value() { return ANTENNA____header_global_1e9d5fd7c732f77b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:347
export const MASKWALL12____header_global_29be14e1d50962dc = ((u32(((u32(609) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d0bcbaeb34c45b3eb3d9ef53() {
  return __cxx_static_address_d0bcbaeb34c45b3eb3d9ef53.reference || (__cxx_static_address_d0bcbaeb34c45b3eb3d9ef53.reference = {
    __cReference: true,
    get value() { return MASKWALL12____header_global_29be14e1d50962dc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:348
export const TOILETBROKE____header_global_1ae4fc546a5f3c5c = ((u32(((u32(615) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ab03b5c3aec78948370c767c() {
  return __cxx_static_address_ab03b5c3aec78948370c767c.reference || (__cxx_static_address_ab03b5c3aec78948370c767c.reference = {
    __cReference: true,
    get value() { return TOILETBROKE____header_global_1ae4fc546a5f3c5c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:349
export const PIPE2____header_global_e5d10e1642f4254f = ((u32(((u32(616) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5832e4832241faa8ca33e594() {
  return __cxx_static_address_5832e4832241faa8ca33e594.reference || (__cxx_static_address_5832e4832241faa8ca33e594.reference = {
    __cReference: true,
    get value() { return PIPE2____header_global_e5d10e1642f4254f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:350
export const PIPE1B____header_global_16708957addfa42c = ((u32(((u32(617) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_260f44a9bf0b1e60c502a315() {
  return __cxx_static_address_260f44a9bf0b1e60c502a315.reference || (__cxx_static_address_260f44a9bf0b1e60c502a315.reference = {
    __cReference: true,
    get value() { return PIPE1B____header_global_16708957addfa42c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:351
export const PIPE3____header_global_34ffab19e4f0e17d = ((u32(((u32(618) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2d856c87dd7c5d067799e165() {
  return __cxx_static_address_2d856c87dd7c5d067799e165.reference || (__cxx_static_address_2d856c87dd7c5d067799e165.reference = {
    __cReference: true,
    get value() { return PIPE3____header_global_34ffab19e4f0e17d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:352
export const PIPE1____header_global_8e0a7b48aef5305a = ((u32(((u32(619) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_47435e325d56d136d9350641() {
  return __cxx_static_address_47435e325d56d136d9350641.reference || (__cxx_static_address_47435e325d56d136d9350641.reference = {
    __cReference: true,
    get value() { return PIPE1____header_global_8e0a7b48aef5305a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:354
export const PIPE2B____header_global_ca15172b670f3703 = ((u32(((u32(633) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6cde2382ef843517a3377579() {
  return __cxx_static_address_6cde2382ef843517a3377579.reference || (__cxx_static_address_6cde2382ef843517a3377579.reference = {
    __cReference: true,
    get value() { return PIPE2B____header_global_ca15172b670f3703; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:355
export const BOLT1____header_global_c4a4f38cf60e87b7 = ((u32(((u32(634) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f79dad00c99143d0b7e4e145() {
  return __cxx_static_address_f79dad00c99143d0b7e4e145.reference || (__cxx_static_address_f79dad00c99143d0b7e4e145.reference = {
    __cReference: true,
    get value() { return BOLT1____header_global_c4a4f38cf60e87b7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:356
export const W_NUMBERS____header_global_69129663f0d2ebe6 = ((u32(((u32(640) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_319ad0fc5d40d89569a63e3d() {
  return __cxx_static_address_319ad0fc5d40d89569a63e3d.reference || (__cxx_static_address_319ad0fc5d40d89569a63e3d.reference = {
    __cReference: true,
    get value() { return W_NUMBERS____header_global_69129663f0d2ebe6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:357
export const WATERDRIP____header_global_70126a3583d47bbd = ((u32(((u32(660) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_45a0ab5bb8af418e51c986b3() {
  return __cxx_static_address_45a0ab5bb8af418e51c986b3.reference || (__cxx_static_address_45a0ab5bb8af418e51c986b3.reference = {
    __cReference: true,
    get value() { return WATERDRIP____header_global_70126a3583d47bbd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:358
export const WATERBUBBLE____header_global_8517bb3b35a95d7d = ((u32(((u32(661) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9dbe4e37fcf23d9ba8ba27d0() {
  return __cxx_static_address_9dbe4e37fcf23d9ba8ba27d0.reference || (__cxx_static_address_9dbe4e37fcf23d9ba8ba27d0.reference = {
    __cReference: true,
    get value() { return WATERBUBBLE____header_global_8517bb3b35a95d7d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:359
export const WATERBUBBLEMAKER____header_global_294963b997775d4d = ((u32(((u32(662) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a3ec051c3754a386219d37af() {
  return __cxx_static_address_a3ec051c3754a386219d37af.reference || (__cxx_static_address_a3ec051c3754a386219d37af.reference = {
    __cReference: true,
    get value() { return WATERBUBBLEMAKER____header_global_294963b997775d4d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:360
export const W_FORCEFIELD____header_global_ce84f9b6b111897e = ((u32(((u32(663) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0b50fde6ca176ad4e3a61891() {
  return __cxx_static_address_0b50fde6ca176ad4e3a61891.reference || (__cxx_static_address_0b50fde6ca176ad4e3a61891.reference = {
    __cReference: true,
    get value() { return W_FORCEFIELD____header_global_ce84f9b6b111897e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:361
export const VACUUM____header_global_86b7b56b87b4f086 = ((u32(((u32(669) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_84bb4eae452fbf273e12f2e7() {
  return __cxx_static_address_84bb4eae452fbf273e12f2e7.reference || (__cxx_static_address_84bb4eae452fbf273e12f2e7.reference = {
    __cReference: true,
    get value() { return VACUUM____header_global_86b7b56b87b4f086; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:365
export const EGG____header_global_684a1472fdb2e2cc = ((u32(((u32(675) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ebe38e5a229144fa3e303060() {
  return __cxx_static_address_ebe38e5a229144fa3e303060.reference || (__cxx_static_address_ebe38e5a229144fa3e303060.reference = {
    __cReference: true,
    get value() { return EGG____header_global_684a1472fdb2e2cc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:366
export const SCALE____header_global_457468210ece55b4 = ((u32(((u32(678) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cccaf2320258a7776910b808() {
  return __cxx_static_address_cccaf2320258a7776910b808.reference || (__cxx_static_address_cccaf2320258a7776910b808.reference = {
    __cReference: true,
    get value() { return SCALE____header_global_457468210ece55b4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:368
export const CAMERALIGHT____header_global_430c8641d2f60d19 = ((u32(((u32(685) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bb855a590e774d0b6c33303e() {
  return __cxx_static_address_bb855a590e774d0b6c33303e.reference || (__cxx_static_address_bb855a590e774d0b6c33303e.reference = {
    __cReference: true,
    get value() { return CAMERALIGHT____header_global_430c8641d2f60d19; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:369
export const MOVIECAMERA____header_global_397d9fd54cd96fca = ((u32(((u32(686) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_00278febc47269b554284bfd() {
  return __cxx_static_address_00278febc47269b554284bfd.reference || (__cxx_static_address_00278febc47269b554284bfd.reference = {
    __cReference: true,
    get value() { return MOVIECAMERA____header_global_397d9fd54cd96fca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:370
export const IVUNIT____header_global_4911369f45ca95ea = ((u32(((u32(689) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0be3ea4269c6bb81a1d5545d() {
  return __cxx_static_address_0be3ea4269c6bb81a1d5545d.reference || (__cxx_static_address_0be3ea4269c6bb81a1d5545d.reference = {
    __cReference: true,
    get value() { return IVUNIT____header_global_4911369f45ca95ea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:371
export const POT1____header_global_ca450aef047d81d1 = ((u32(((u32(694) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a5eebcc92ab8d9f5a5b23557() {
  return __cxx_static_address_a5eebcc92ab8d9f5a5b23557.reference || (__cxx_static_address_a5eebcc92ab8d9f5a5b23557.reference = {
    __cReference: true,
    get value() { return POT1____header_global_ca450aef047d81d1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:372
export const POT2____header_global_2312e3b32ea20207 = ((u32(((u32(695) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5e4f50f1b364afe28f7b3b29() {
  return __cxx_static_address_5e4f50f1b364afe28f7b3b29.reference || (__cxx_static_address_5e4f50f1b364afe28f7b3b29.reference = {
    __cReference: true,
    get value() { return POT2____header_global_2312e3b32ea20207; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:373
export const POT3____header_global_d2e455b7ba92ac12 = ((u32(((u32(697) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_724e307b6a1c99fbecd91400() {
  return __cxx_static_address_724e307b6a1c99fbecd91400.reference || (__cxx_static_address_724e307b6a1c99fbecd91400.reference = {
    __cReference: true,
    get value() { return POT3____header_global_d2e455b7ba92ac12; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:374
export const PIPE3B____header_global_53e952b3e6ae5c74 = ((u32(((u32(700) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0d0d10e407224cbf63515bf9() {
  return __cxx_static_address_0d0d10e407224cbf63515bf9.reference || (__cxx_static_address_0d0d10e407224cbf63515bf9.reference = {
    __cReference: true,
    get value() { return PIPE3B____header_global_53e952b3e6ae5c74; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:375
export const WALLLIGHT3____header_global_a9ef043a6bb681f4 = ((u32(((u32(701) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3298116e8a96342e6e4c8446() {
  return __cxx_static_address_3298116e8a96342e6e4c8446.reference || (__cxx_static_address_3298116e8a96342e6e4c8446.reference = {
    __cReference: true,
    get value() { return WALLLIGHT3____header_global_a9ef043a6bb681f4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:376
export const WALLLIGHTBUST3____header_global_8457a45bbbc82489 = ((u32(((u32(702) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_04889b037223d704db270bfe() {
  return __cxx_static_address_04889b037223d704db270bfe.reference || (__cxx_static_address_04889b037223d704db270bfe.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST3____header_global_8457a45bbbc82489; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:377
export const WALLLIGHT1____header_global_c331fcf8be2e2011 = ((u32(((u32(703) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5d6ec800151744ec30cdaa3e() {
  return __cxx_static_address_5d6ec800151744ec30cdaa3e.reference || (__cxx_static_address_5d6ec800151744ec30cdaa3e.reference = {
    __cReference: true,
    get value() { return WALLLIGHT1____header_global_c331fcf8be2e2011; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:378
export const WALLLIGHTBUST1____header_global_211a49c0ecc23ab9 = ((u32(((u32(704) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_600e7924cad201c4a779b4c5() {
  return __cxx_static_address_600e7924cad201c4a779b4c5.reference || (__cxx_static_address_600e7924cad201c4a779b4c5.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST1____header_global_211a49c0ecc23ab9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:379
export const WALLLIGHT2____header_global_be08777d247f2f19 = ((u32(((u32(705) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ad416f1647e4992bb9bd603d() {
  return __cxx_static_address_ad416f1647e4992bb9bd603d.reference || (__cxx_static_address_ad416f1647e4992bb9bd603d.reference = {
    __cReference: true,
    get value() { return WALLLIGHT2____header_global_be08777d247f2f19; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:380
export const WALLLIGHTBUST2____header_global_bb072870ee1a31cf = ((u32(((u32(706) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_867a69ca7df219faca82cd4a() {
  return __cxx_static_address_867a69ca7df219faca82cd4a.reference || (__cxx_static_address_867a69ca7df219faca82cd4a.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST2____header_global_bb072870ee1a31cf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:381
export const LIGHTSWITCH2____header_global_75fb316466acd2b8 = ((u32(((u32(712) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2153e89f369e87b23d9d592b() {
  return __cxx_static_address_2153e89f369e87b23d9d592b.reference || (__cxx_static_address_2153e89f369e87b23d9d592b.reference = {
    __cReference: true,
    get value() { return LIGHTSWITCH2____header_global_75fb316466acd2b8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:382
export const WAITTOBESEATED____header_global_91456181c06e9ed9 = ((u32(((u32(716) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7f4e7edb1ac6f3b65325549f() {
  return __cxx_static_address_7f4e7edb1ac6f3b65325549f.reference || (__cxx_static_address_7f4e7edb1ac6f3b65325549f.reference = {
    __cReference: true,
    get value() { return WAITTOBESEATED____header_global_91456181c06e9ed9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:383
export const DOORTILE14____header_global_86818512e2de2105 = ((u32(((u32(717) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_06190dba51b9d27a090bdc06() {
  return __cxx_static_address_06190dba51b9d27a090bdc06.reference || (__cxx_static_address_06190dba51b9d27a090bdc06.reference = {
    __cReference: true,
    get value() { return DOORTILE14____header_global_86818512e2de2105; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:385
export const MIKE____header_global_6787baa0f098270b = ((u32(((u32(762) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_68508bc1463f5d8c38bd5128() {
  return __cxx_static_address_68508bc1463f5d8c38bd5128.reference || (__cxx_static_address_68508bc1463f5d8c38bd5128.reference = {
    __cReference: true,
    get value() { return MIKE____header_global_6787baa0f098270b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:386
export const VASE____header_global_b9cf1af24dbaf399 = ((u32(((u32(765) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b9bc4c2cfa664ce1b459a10f() {
  return __cxx_static_address_b9bc4c2cfa664ce1b459a10f.reference || (__cxx_static_address_b9bc4c2cfa664ce1b459a10f.reference = {
    __cReference: true,
    get value() { return VASE____header_global_b9cf1af24dbaf399; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:391
export const DOORTILE16____header_global_5a241b01e3fb37a1 = ((u32(((u32(781) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8575aea9d5d758a7490d8714() {
  return __cxx_static_address_8575aea9d5d758a7490d8714.reference || (__cxx_static_address_8575aea9d5d758a7490d8714.reference = {
    __cReference: true,
    get value() { return DOORTILE16____header_global_5a241b01e3fb37a1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:392
export const SUSHIPLATE5____header_global_b0f8f7818968b739 = ((u32(((u32(792) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7e99d39678ba31d161061e26() {
  return __cxx_static_address_7e99d39678ba31d161061e26.reference || (__cxx_static_address_7e99d39678ba31d161061e26.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE5____header_global_b0f8f7818968b739; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:393
export const OJ____header_global_b20213eca66dcff5 = ((u32(((u32(806) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_992434cb639c775e14b19194() {
  return __cxx_static_address_992434cb639c775e14b19194.reference || (__cxx_static_address_992434cb639c775e14b19194.reference = {
    __cReference: true,
    get value() { return OJ____header_global_b20213eca66dcff5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:394
export const MASKWALL13____header_global_f40415df9803524c = ((u32(((u32(830) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bde4c466aef718888806a87c() {
  return __cxx_static_address_bde4c466aef718888806a87c.reference || (__cxx_static_address_bde4c466aef718888806a87c.reference = {
    __cReference: true,
    get value() { return MASKWALL13____header_global_f40415df9803524c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:395
export const HURTRAIL____header_global_74e7a51d38aca8b2 = ((u32(((u32(859) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d6a2b682004a32a04c3bea48() {
  return __cxx_static_address_d6a2b682004a32a04c3bea48.reference || (__cxx_static_address_d6a2b682004a32a04c3bea48.reference = {
    __cReference: true,
    get value() { return HURTRAIL____header_global_74e7a51d38aca8b2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:396
export const POWERSWITCH1____header_global_7f3470fc8ac8fd45 = ((u32(((u32(860) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_17e8b8af24b4f66875d84b19() {
  return __cxx_static_address_17e8b8af24b4f66875d84b19.reference || (__cxx_static_address_17e8b8af24b4f66875d84b19.reference = {
    __cReference: true,
    get value() { return POWERSWITCH1____header_global_7f3470fc8ac8fd45; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:397
export const LOCKSWITCH1____header_global_ddbe8f08004dd3ea = ((u32(((u32(862) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0344c628098b9c2e55aa1f97() {
  return __cxx_static_address_0344c628098b9c2e55aa1f97.reference || (__cxx_static_address_0344c628098b9c2e55aa1f97.reference = {
    __cReference: true,
    get value() { return LOCKSWITCH1____header_global_ddbe8f08004dd3ea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:398
export const POWERSWITCH2____header_global_99f51847e93badf3 = ((u32(((u32(864) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_74f6df5b442265a9139dd52c() {
  return __cxx_static_address_74f6df5b442265a9139dd52c.reference || (__cxx_static_address_74f6df5b442265a9139dd52c.reference = {
    __cReference: true,
    get value() { return POWERSWITCH2____header_global_99f51847e93badf3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:399
export const ATM____header_global_dc8e1fe7903b8572 = ((u32(((u32(867) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b3efd609e1a5de3c2cf19067() {
  return __cxx_static_address_b3efd609e1a5de3c2cf19067.reference || (__cxx_static_address_b3efd609e1a5de3c2cf19067.reference = {
    __cReference: true,
    get value() { return ATM____header_global_dc8e1fe7903b8572; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:401
export const ATMBROKE____header_global_60088b860b91f8ba = ((u32(((u32(888) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cf6a5056f04bc7b951d1ce99() {
  return __cxx_static_address_cf6a5056f04bc7b951d1ce99.reference || (__cxx_static_address_cf6a5056f04bc7b951d1ce99.reference = {
    __cReference: true,
    get value() { return ATMBROKE____header_global_60088b860b91f8ba; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:402
export const STRIPEBALL____header_global_d9e0326604155b18 = ((u32(((u32(901) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8a30b360073a97dd4ed32f74() {
  return __cxx_static_address_8a30b360073a97dd4ed32f74.reference || (__cxx_static_address_8a30b360073a97dd4ed32f74.reference = {
    __cReference: true,
    get value() { return STRIPEBALL____header_global_d9e0326604155b18; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:403
export const QUEBALL____header_global_50726802c702fa5f = ((u32(((u32(902) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_deaa0b03a383f6272290ffac() {
  return __cxx_static_address_deaa0b03a383f6272290ffac.reference || (__cxx_static_address_deaa0b03a383f6272290ffac.reference = {
    __cReference: true,
    get value() { return QUEBALL____header_global_50726802c702fa5f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:404
export const POCKET____header_global_70445bee74f19ae5 = ((u32(((u32(903) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e5ba5dee2702c0f501cd17a3() {
  return __cxx_static_address_e5ba5dee2702c0f501cd17a3.reference || (__cxx_static_address_e5ba5dee2702c0f501cd17a3.reference = {
    __cReference: true,
    get value() { return POCKET____header_global_70445bee74f19ae5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:405
export const WOODENHORSE____header_global_5c4730c3b57f1958 = ((u32(((u32(904) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c5da78cb07a781c4e0b3cac7() {
  return __cxx_static_address_c5da78cb07a781c4e0b3cac7.reference || (__cxx_static_address_c5da78cb07a781c4e0b3cac7.reference = {
    __cReference: true,
    get value() { return WOODENHORSE____header_global_5c4730c3b57f1958; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:406
export const TREE1____header_global_a5d7643ae8f7d514 = ((u32(((u32(908) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3a6ca80999001895244562a1() {
  return __cxx_static_address_3a6ca80999001895244562a1.reference || (__cxx_static_address_3a6ca80999001895244562a1.reference = {
    __cReference: true,
    get value() { return TREE1____header_global_a5d7643ae8f7d514; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:407
export const TREE2____header_global_3c89a23d1d99aaf9 = ((u32(((u32(910) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7536308c531c29712c3929ff() {
  return __cxx_static_address_7536308c531c29712c3929ff.reference || (__cxx_static_address_7536308c531c29712c3929ff.reference = {
    __cReference: true,
    get value() { return TREE2____header_global_3c89a23d1d99aaf9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:408
export const CACTUS____header_global_b6092f3ab91709df = ((u32(((u32(911) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_33c895768922bcdcee692759() {
  return __cxx_static_address_33c895768922bcdcee692759.reference || (__cxx_static_address_33c895768922bcdcee692759.reference = {
    __cReference: true,
    get value() { return CACTUS____header_global_b6092f3ab91709df; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:409
export const MASKWALL2____header_global_96c8268cff3c1acd = ((u32(((u32(913) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_00c0e2837e4f502c8af0ce51() {
  return __cxx_static_address_00c0e2837e4f502c8af0ce51.reference || (__cxx_static_address_00c0e2837e4f502c8af0ce51.reference = {
    __cReference: true,
    get value() { return MASKWALL2____header_global_96c8268cff3c1acd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:410
export const MASKWALL3____header_global_df4b0271811e95c4 = ((u32(((u32(914) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9d0b61b114cc99de4df5f9bd() {
  return __cxx_static_address_9d0b61b114cc99de4df5f9bd.reference || (__cxx_static_address_9d0b61b114cc99de4df5f9bd.reference = {
    __cReference: true,
    get value() { return MASKWALL3____header_global_df4b0271811e95c4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:411
export const MASKWALL4____header_global_f3996e86596eef7d = ((u32(((u32(915) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b87b7bc112965d84f4d47a1a() {
  return __cxx_static_address_b87b7bc112965d84f4d47a1a.reference || (__cxx_static_address_b87b7bc112965d84f4d47a1a.reference = {
    __cReference: true,
    get value() { return MASKWALL4____header_global_f3996e86596eef7d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:412
export const FIREEXT____header_global_82b27d67ffc3dfd6 = ((u32(((u32(916) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_46819b999fc14b9745692f56() {
  return __cxx_static_address_46819b999fc14b9745692f56.reference || (__cxx_static_address_46819b999fc14b9745692f56.reference = {
    __cReference: true,
    get value() { return FIREEXT____header_global_82b27d67ffc3dfd6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:413
export const TOILETWATER____header_global_497f9a3bde837d5f = ((u32(((u32(921) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dc669157d16334d15de635ac() {
  return __cxx_static_address_dc669157d16334d15de635ac.reference || (__cxx_static_address_dc669157d16334d15de635ac.reference = {
    __cReference: true,
    get value() { return TOILETWATER____header_global_497f9a3bde837d5f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:416
export const CACTUSBROKE____header_global_bafb2aeef013b6be = ((u32(((u32(939) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9cceaf6fcb54a6eb5584a8cc() {
  return __cxx_static_address_9cceaf6fcb54a6eb5584a8cc.reference || (__cxx_static_address_9cceaf6fcb54a6eb5584a8cc.reference = {
    __cReference: true,
    get value() { return CACTUSBROKE____header_global_bafb2aeef013b6be; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:417
export const BOUNCEMINE____header_global_194fcc028ca81bc9 = ((u32(((u32(940) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e2e3884c070cd77d1f36cd52() {
  return __cxx_static_address_e2e3884c070cd77d1f36cd52.reference || (__cxx_static_address_e2e3884c070cd77d1f36cd52.reference = {
    __cReference: true,
    get value() { return BOUNCEMINE____header_global_194fcc028ca81bc9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:418
export const BROKEFIREHYDRENT____header_global_5c55e699acb06b0f = ((u32(((u32(950) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4f53caa27c6d07f24d691d06() {
  return __cxx_static_address_4f53caa27c6d07f24d691d06.reference || (__cxx_static_address_4f53caa27c6d07f24d691d06.reference = {
    __cReference: true,
    get value() { return BROKEFIREHYDRENT____header_global_5c55e699acb06b0f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:419
export const BOX____header_global_e648c3c035f632de = ((u32(((u32(951) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_79f82d65fbfd8ca419c19ad3() {
  return __cxx_static_address_79f82d65fbfd8ca419c19ad3.reference || (__cxx_static_address_79f82d65fbfd8ca419c19ad3.reference = {
    __cReference: true,
    get value() { return BOX____header_global_e648c3c035f632de; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:421
export const BOTTLE1____header_global_708e8321803d2b81 = ((u32(((u32(954) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9b986f058dc84646cd863c41() {
  return __cxx_static_address_9b986f058dc84646cd863c41.reference || (__cxx_static_address_9b986f058dc84646cd863c41.reference = {
    __cReference: true,
    get value() { return BOTTLE1____header_global_708e8321803d2b81; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:422
export const BOTTLE2____header_global_8deaca8ecc596379 = ((u32(((u32(955) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ff5b300da4d1d94bd8eca33f() {
  return __cxx_static_address_ff5b300da4d1d94bd8eca33f.reference || (__cxx_static_address_ff5b300da4d1d94bd8eca33f.reference = {
    __cReference: true,
    get value() { return BOTTLE2____header_global_8deaca8ecc596379; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:423
export const BOTTLE3____header_global_52c576d086a4778e = ((u32(((u32(956) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_64a5f1c21b758e6bdc7f19b4() {
  return __cxx_static_address_64a5f1c21b758e6bdc7f19b4.reference || (__cxx_static_address_64a5f1c21b758e6bdc7f19b4.reference = {
    __cReference: true,
    get value() { return BOTTLE3____header_global_52c576d086a4778e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:424
export const BOTTLE4____header_global_7d5c442a54ce4e8e = ((u32(((u32(957) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e038f4c267b4c1156ff43967() {
  return __cxx_static_address_e038f4c267b4c1156ff43967.reference || (__cxx_static_address_e038f4c267b4c1156ff43967.reference = {
    __cReference: true,
    get value() { return BOTTLE4____header_global_7d5c442a54ce4e8e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:428
export const HYDROPLANT____header_global_cc103357888bee5e = ((u32(((u32(969) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d4c640ed959185a9d0ef9e65() {
  return __cxx_static_address_d4c640ed959185a9d0ef9e65.reference || (__cxx_static_address_d4c640ed959185a9d0ef9e65.reference = {
    __cReference: true,
    get value() { return HYDROPLANT____header_global_cc103357888bee5e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:429
export const OCEANSPRITE1____header_global_dc7dd41cb7672d3c = ((u32(((u32(971) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_92cab6998e245157ca1edd86() {
  return __cxx_static_address_92cab6998e245157ca1edd86.reference || (__cxx_static_address_92cab6998e245157ca1edd86.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE1____header_global_dc7dd41cb7672d3c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:430
export const OCEANSPRITE2____header_global_e181fde5dc9fd4aa = ((u32(((u32(972) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7786ab1894980c70abac6d97() {
  return __cxx_static_address_7786ab1894980c70abac6d97.reference || (__cxx_static_address_7786ab1894980c70abac6d97.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE2____header_global_e181fde5dc9fd4aa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:431
export const OCEANSPRITE3____header_global_49b9ed3f9b95ef4e = ((u32(((u32(973) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5fd7fc2485bb9c3362bce1bd() {
  return __cxx_static_address_5fd7fc2485bb9c3362bce1bd.reference || (__cxx_static_address_5fd7fc2485bb9c3362bce1bd.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE3____header_global_49b9ed3f9b95ef4e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:432
export const OCEANSPRITE4____header_global_22b6b75e62bbb893 = ((u32(((u32(974) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a5163146d2119410f5ad3422() {
  return __cxx_static_address_a5163146d2119410f5ad3422.reference || (__cxx_static_address_a5163146d2119410f5ad3422.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE4____header_global_22b6b75e62bbb893; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:433
export const OCEANSPRITE5____header_global_0e5bf4322de8bfcd = ((u32(((u32(975) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d4603c485b953ce4ec78a76e() {
  return __cxx_static_address_d4603c485b953ce4ec78a76e.reference || (__cxx_static_address_d4603c485b953ce4ec78a76e.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE5____header_global_0e5bf4322de8bfcd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:434
export const GENERICPOLE____header_global_f93654b5ea7cdaae = ((u32(((u32(977) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_00c29a5c3ce50ba403078fdc() {
  return __cxx_static_address_00c29a5c3ce50ba403078fdc.reference || (__cxx_static_address_00c29a5c3ce50ba403078fdc.reference = {
    __cReference: true,
    get value() { return GENERICPOLE____header_global_f93654b5ea7cdaae; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:435
export const CONE____header_global_4ee472a87631ff8f = ((u32(((u32(978) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_94281ba85dc482fe5b1868a3() {
  return __cxx_static_address_94281ba85dc482fe5b1868a3.reference || (__cxx_static_address_94281ba85dc482fe5b1868a3.reference = {
    __cReference: true,
    get value() { return CONE____header_global_4ee472a87631ff8f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:436
export const HANGLIGHT____header_global_4597cce6f51670f1 = ((u32(((u32(979) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0cd23ef7ad062b7855a04f5f() {
  return __cxx_static_address_0cd23ef7ad062b7855a04f5f.reference || (__cxx_static_address_0cd23ef7ad062b7855a04f5f.reference = {
    __cReference: true,
    get value() { return HANGLIGHT____header_global_4597cce6f51670f1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:437
export const HYDRENT____header_global_4567f8f767fe6247 = ((u32(((u32(981) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4c9c14d386c03c556068a47f() {
  return __cxx_static_address_4c9c14d386c03c556068a47f.reference || (__cxx_static_address_4c9c14d386c03c556068a47f.reference = {
    __cReference: true,
    get value() { return HYDRENT____header_global_4567f8f767fe6247; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:438
export const MASKWALL14____header_global_613194661e3b40c4 = ((u32(((u32(988) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_07eea8e9c2ad7661f2812634() {
  return __cxx_static_address_07eea8e9c2ad7661f2812634.reference || (__cxx_static_address_07eea8e9c2ad7661f2812634.reference = {
    __cReference: true,
    get value() { return MASKWALL14____header_global_613194661e3b40c4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:439
export const TIRE____header_global_00c5c8ccc1f9fd3a = ((u32(((u32(990) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_37ee5385f4d0c93301b48885() {
  return __cxx_static_address_37ee5385f4d0c93301b48885.reference || (__cxx_static_address_37ee5385f4d0c93301b48885.reference = {
    __cReference: true,
    get value() { return TIRE____header_global_00c5c8ccc1f9fd3a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:440
export const PIPE5____header_global_8f7f53cbbfc4c8e3 = ((u32(((u32(994) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_13ba0fd8fd960549f6df2a6d() {
  return __cxx_static_address_13ba0fd8fd960549f6df2a6d.reference || (__cxx_static_address_13ba0fd8fd960549f6df2a6d.reference = {
    __cReference: true,
    get value() { return PIPE5____header_global_8f7f53cbbfc4c8e3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:441
export const PIPE6____header_global_ae9b15c751c631c9 = ((u32(((u32(995) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c52d0b8e0c0e3ddf51746286() {
  return __cxx_static_address_c52d0b8e0c0e3ddf51746286.reference || (__cxx_static_address_c52d0b8e0c0e3ddf51746286.reference = {
    __cReference: true,
    get value() { return PIPE6____header_global_ae9b15c751c631c9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:442
export const PIPE4____header_global_adec71d564473ffe = ((u32(((u32(996) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eb9f52dcf5770fa697bede0d() {
  return __cxx_static_address_eb9f52dcf5770fa697bede0d.reference || (__cxx_static_address_eb9f52dcf5770fa697bede0d.reference = {
    __cReference: true,
    get value() { return PIPE4____header_global_adec71d564473ffe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:443
export const PIPE4B____header_global_5e097d7fe200871d = ((u32(((u32(997) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f212bada0fc55d6854742103() {
  return __cxx_static_address_f212bada0fc55d6854742103.reference || (__cxx_static_address_f212bada0fc55d6854742103.reference = {
    __cReference: true,
    get value() { return PIPE4B____header_global_5e097d7fe200871d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:444
export const BROKEHYDROPLANT____header_global_e2d042996a9eece4 = ((u32(((u32(1003) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_db788a8c14d60b0ddcc9859b() {
  return __cxx_static_address_db788a8c14d60b0ddcc9859b.reference || (__cxx_static_address_db788a8c14d60b0ddcc9859b.reference = {
    __cReference: true,
    get value() { return BROKEHYDROPLANT____header_global_e2d042996a9eece4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:445
export const PIPE5B____header_global_0abb74677ae338a4 = ((u32(((u32(1005) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6e2ce8695d30d4007f5fb758() {
  return __cxx_static_address_6e2ce8695d30d4007f5fb758.reference || (__cxx_static_address_6e2ce8695d30d4007f5fb758.reference = {
    __cReference: true,
    get value() { return PIPE5B____header_global_0abb74677ae338a4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:449
export const BOTTLE5____header_global_1dd254d705c9b25e = ((u32(((u32(1012) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_28410dc7d6a29a56c5f6fb5d() {
  return __cxx_static_address_28410dc7d6a29a56c5f6fb5d.reference || (__cxx_static_address_28410dc7d6a29a56c5f6fb5d.reference = {
    __cReference: true,
    get value() { return BOTTLE5____header_global_1dd254d705c9b25e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:450
export const BOTTLE6____header_global_b70b71f87376d357 = ((u32(((u32(1013) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b1f0076fd8b12c44c450c842() {
  return __cxx_static_address_b1f0076fd8b12c44c450c842.reference || (__cxx_static_address_b1f0076fd8b12c44c450c842.reference = {
    __cReference: true,
    get value() { return BOTTLE6____header_global_b70b71f87376d357; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:451
export const BOTTLE8____header_global_32cfffab6f8709ad = ((u32(((u32(1014) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_42cb96719b2893da84dd752f() {
  return __cxx_static_address_42cb96719b2893da84dd752f.reference || (__cxx_static_address_42cb96719b2893da84dd752f.reference = {
    __cReference: true,
    get value() { return BOTTLE8____header_global_32cfffab6f8709ad; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:452
export const SPOTLITE____header_global_a159c154b2de07bd = ((u32(((u32(1020) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c0422ddacb62b4b3f9cfc929() {
  return __cxx_static_address_c0422ddacb62b4b3f9cfc929.reference || (__cxx_static_address_c0422ddacb62b4b3f9cfc929.reference = {
    __cReference: true,
    get value() { return SPOTLITE____header_global_a159c154b2de07bd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:453
export const MASKWALL15____header_global_8b87f7afe7e2e54e = ((u32(((u32(1024) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2cbed07fdc208740802d9649() {
  return __cxx_static_address_2cbed07fdc208740802d9649.reference || (__cxx_static_address_2cbed07fdc208740802d9649.reference = {
    __cReference: true,
    get value() { return MASKWALL15____header_global_8b87f7afe7e2e54e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:454
export const BOTTLE7____header_global_e55c0f772137dee8 = ((u32(((u32(1025) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_45c6061d313550f3cd6579cc() {
  return __cxx_static_address_45c6061d313550f3cd6579cc.reference || (__cxx_static_address_45c6061d313550f3cd6579cc.reference = {
    __cReference: true,
    get value() { return BOTTLE7____header_global_e55c0f772137dee8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:455
export const HORSEONSIDE____header_global_f5640156846cebf8 = ((u32(((u32(1026) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_96f97b8be957acd478fb0b88() {
  return __cxx_static_address_96f97b8be957acd478fb0b88.reference || (__cxx_static_address_96f97b8be957acd478fb0b88.reference = {
    __cReference: true,
    get value() { return HORSEONSIDE____header_global_f5640156846cebf8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:456
export const GLASSPIECES____header_global_22efe2b8d817fee5 = ((u32(((u32(1031) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5332c78e3746f525c7e04aa6() {
  return __cxx_static_address_5332c78e3746f525c7e04aa6.reference || (__cxx_static_address_5332c78e3746f525c7e04aa6.reference = {
    __cReference: true,
    get value() { return GLASSPIECES____header_global_22efe2b8d817fee5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:458
export const MASKWALL6____header_global_d064af92fbea9f39 = ((u32(((u32(1059) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_72da34c3c4cc39221aa4e59f() {
  return __cxx_static_address_72da34c3c4cc39221aa4e59f.reference || (__cxx_static_address_72da34c3c4cc39221aa4e59f.reference = {
    __cReference: true,
    get value() { return MASKWALL6____header_global_d064af92fbea9f39; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:459
export const RUBBERCAN____header_global_271628b7b2ea1da1 = ((u32(((u32(1062) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eb4d64eae5d8a2d852797bd3() {
  return __cxx_static_address_eb4d64eae5d8a2d852797bd3.reference || (__cxx_static_address_eb4d64eae5d8a2d852797bd3.reference = {
    __cReference: true,
    get value() { return RUBBERCAN____header_global_271628b7b2ea1da1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:460
export const PLUG____header_global_c78e57cffead7529 = ((u32(((u32(1069) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c6d8751d2722716dcf35e8be() {
  return __cxx_static_address_c6d8751d2722716dcf35e8be.reference || (__cxx_static_address_c6d8751d2722716dcf35e8be.reference = {
    __cReference: true,
    get value() { return PLUG____header_global_c78e57cffead7529; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:461
export const OOZFILTER____header_global_3eb1d1730f40c76d = ((u32(((u32(1079) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_279184f0a5afa2b061b50efb() {
  return __cxx_static_address_279184f0a5afa2b061b50efb.reference || (__cxx_static_address_279184f0a5afa2b061b50efb.reference = {
    __cReference: true,
    get value() { return OOZFILTER____header_global_3eb1d1730f40c76d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:462
export const FLOORPLASMA____header_global_1a47b87d8d755504 = ((u32(((u32(1082) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cb9b8363fe82b7599596be9c() {
  return __cxx_static_address_cb9b8363fe82b7599596be9c.reference || (__cxx_static_address_cb9b8363fe82b7599596be9c.reference = {
    __cReference: true,
    get value() { return FLOORPLASMA____header_global_1a47b87d8d755504; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:463
export const REACTOR____header_global_acb026429a921947 = ((u32(((u32(1088) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bad32d2678a32def2425b2de() {
  return __cxx_static_address_bad32d2678a32def2425b2de.reference || (__cxx_static_address_bad32d2678a32def2425b2de.reference = {
    __cReference: true,
    get value() { return REACTOR____header_global_acb026429a921947; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:464
export const REACTORSPARK____header_global_800f382b9d58aeed = ((u32(((u32(1092) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0d9b0ec81fdf8b0146642ba3() {
  return __cxx_static_address_0d9b0ec81fdf8b0146642ba3.reference || (__cxx_static_address_0d9b0ec81fdf8b0146642ba3.reference = {
    __cReference: true,
    get value() { return REACTORSPARK____header_global_800f382b9d58aeed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:465
export const REACTORBURNT____header_global_2ac73c71bbd7ac12 = ((u32(((u32(1096) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_672d6b8b24f31cb2c27e3895() {
  return __cxx_static_address_672d6b8b24f31cb2c27e3895.reference || (__cxx_static_address_672d6b8b24f31cb2c27e3895.reference = {
    __cReference: true,
    get value() { return REACTORBURNT____header_global_2ac73c71bbd7ac12; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:466
export const DOORTILE15____header_global_8315bb8999003e6d = ((u32(((u32(1102) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d7916d91e793d7a3a7dd5f6d() {
  return __cxx_static_address_d7916d91e793d7a3a7dd5f6d.reference || (__cxx_static_address_d7916d91e793d7a3a7dd5f6d.reference = {
    __cReference: true,
    get value() { return DOORTILE15____header_global_8315bb8999003e6d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:467
export const HANDSWITCH____header_global_6c75b1a5ce4ccfa5 = ((u32(((u32(1111) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5e1636721d8454abca351443() {
  return __cxx_static_address_5e1636721d8454abca351443.reference || (__cxx_static_address_5e1636721d8454abca351443.reference = {
    __cReference: true,
    get value() { return HANDSWITCH____header_global_6c75b1a5ce4ccfa5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:468
export const CIRCLEPANNEL____header_global_3f3250882895a89e = ((u32(((u32(1113) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cff870a3e8aa895d1258a4e0() {
  return __cxx_static_address_cff870a3e8aa895d1258a4e0.reference || (__cxx_static_address_cff870a3e8aa895d1258a4e0.reference = {
    __cReference: true,
    get value() { return CIRCLEPANNEL____header_global_3f3250882895a89e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:469
export const CIRCLEPANNELBROKE____header_global_4da04eca3174c6f4 = ((u32(((u32(1114) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0590b15b98c669a8fe394783() {
  return __cxx_static_address_0590b15b98c669a8fe394783.reference || (__cxx_static_address_0590b15b98c669a8fe394783.reference = {
    __cReference: true,
    get value() { return CIRCLEPANNELBROKE____header_global_4da04eca3174c6f4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:470
export const PULLSWITCH____header_global_bbfb5fffb3ea6843 = ((u32(((u32(1122) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_374f5550793ca079fb4c759a() {
  return __cxx_static_address_374f5550793ca079fb4c759a.reference || (__cxx_static_address_374f5550793ca079fb4c759a.reference = {
    __cReference: true,
    get value() { return PULLSWITCH____header_global_bbfb5fffb3ea6843; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:471
export const MASKWALL8____header_global_106048b20d5490ea = ((u32(((u32(1124) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_da9cccd378ddb367f8fbaa69() {
  return __cxx_static_address_da9cccd378ddb367f8fbaa69.reference || (__cxx_static_address_da9cccd378ddb367f8fbaa69.reference = {
    __cReference: true,
    get value() { return MASKWALL8____header_global_106048b20d5490ea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:472
export const BIGHOLE____header_global_870625783f35c108 = ((u32(((u32(1141) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e1a1ba6c0b494222fdc6c6ba() {
  return __cxx_static_address_e1a1ba6c0b494222fdc6c6ba.reference || (__cxx_static_address_e1a1ba6c0b494222fdc6c6ba.reference = {
    __cReference: true,
    get value() { return BIGHOLE____header_global_870625783f35c108; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:473
export const ALIENSWITCH____header_global_3d23f236581e256f = ((u32(((u32(1142) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9797e03dd9bc68e38c76bec7() {
  return __cxx_static_address_9797e03dd9bc68e38c76bec7.reference || (__cxx_static_address_9797e03dd9bc68e38c76bec7.reference = {
    __cReference: true,
    get value() { return ALIENSWITCH____header_global_3d23f236581e256f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:474
export const DOORTILE21____header_global_25e3e6b7379d0749 = ((u32(((u32(1144) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1e988711058b2e759928c80a() {
  return __cxx_static_address_1e988711058b2e759928c80a.reference || (__cxx_static_address_1e988711058b2e759928c80a.reference = {
    __cReference: true,
    get value() { return DOORTILE21____header_global_25e3e6b7379d0749; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:475
export const HANDPRINTSWITCH____header_global_bba2e8732e439587 = ((u32(((u32(1155) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_280a7f17b2acc68292a04fc1() {
  return __cxx_static_address_280a7f17b2acc68292a04fc1.reference || (__cxx_static_address_280a7f17b2acc68292a04fc1.reference = {
    __cReference: true,
    get value() { return HANDPRINTSWITCH____header_global_bba2e8732e439587; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:476
export const BOTTLE10____header_global_a1be8c779e70e32f = ((u32(((u32(1157) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3aaf8f2a4ab6814f848dad2a() {
  return __cxx_static_address_3aaf8f2a4ab6814f848dad2a.reference || (__cxx_static_address_3aaf8f2a4ab6814f848dad2a.reference = {
    __cReference: true,
    get value() { return BOTTLE10____header_global_a1be8c779e70e32f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:477
export const BOTTLE11____header_global_a1646e8ace32f00c = ((u32(((u32(1158) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bf6397d43792e1d39b11f14b() {
  return __cxx_static_address_bf6397d43792e1d39b11f14b.reference || (__cxx_static_address_bf6397d43792e1d39b11f14b.reference = {
    __cReference: true,
    get value() { return BOTTLE11____header_global_a1646e8ace32f00c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:478
export const BOTTLE12____header_global_b7a1b42f08203679 = ((u32(((u32(1159) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7ad3ad176c16f4494070bb54() {
  return __cxx_static_address_7ad3ad176c16f4494070bb54.reference || (__cxx_static_address_7ad3ad176c16f4494070bb54.reference = {
    __cReference: true,
    get value() { return BOTTLE12____header_global_b7a1b42f08203679; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:479
export const BOTTLE13____header_global_f82a6ac7d629f6a4 = ((u32(((u32(1160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_01e52e505a1b462ac24efb0f() {
  return __cxx_static_address_01e52e505a1b462ac24efb0f.reference || (__cxx_static_address_01e52e505a1b462ac24efb0f.reference = {
    __cReference: true,
    get value() { return BOTTLE13____header_global_f82a6ac7d629f6a4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:480
export const BOTTLE14____header_global_46628d95f8a68e32 = ((u32(((u32(1161) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4084a4c725eea13412114301() {
  return __cxx_static_address_4084a4c725eea13412114301.reference || (__cxx_static_address_4084a4c725eea13412114301.reference = {
    __cReference: true,
    get value() { return BOTTLE14____header_global_46628d95f8a68e32; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:481
export const BOTTLE15____header_global_8afef42d142717dd = ((u32(((u32(1162) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_40ab12c79a8b2611322178bc() {
  return __cxx_static_address_40ab12c79a8b2611322178bc.reference || (__cxx_static_address_40ab12c79a8b2611322178bc.reference = {
    __cReference: true,
    get value() { return BOTTLE15____header_global_8afef42d142717dd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:482
export const BOTTLE16____header_global_81a546baafad5833 = ((u32(((u32(1163) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_27f01d25eed9e6f53e3d4fca() {
  return __cxx_static_address_27f01d25eed9e6f53e3d4fca.reference || (__cxx_static_address_27f01d25eed9e6f53e3d4fca.reference = {
    __cReference: true,
    get value() { return BOTTLE16____header_global_81a546baafad5833; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:483
export const BOTTLE17____header_global_2bab138453e1418e = ((u32(((u32(1164) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_14019c718d0c316fec5618b4() {
  return __cxx_static_address_14019c718d0c316fec5618b4.reference || (__cxx_static_address_14019c718d0c316fec5618b4.reference = {
    __cReference: true,
    get value() { return BOTTLE17____header_global_2bab138453e1418e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:484
export const BOTTLE18____header_global_6964de26f8a27f9b = ((u32(((u32(1165) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9a14033dad03650e1de0c814() {
  return __cxx_static_address_9a14033dad03650e1de0c814.reference || (__cxx_static_address_9a14033dad03650e1de0c814.reference = {
    __cReference: true,
    get value() { return BOTTLE18____header_global_6964de26f8a27f9b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:485
export const BOTTLE19____header_global_19a824bdac23a4d9 = ((u32(((u32(1166) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e75aafd4e8c35914791d1989() {
  return __cxx_static_address_e75aafd4e8c35914791d1989.reference || (__cxx_static_address_e75aafd4e8c35914791d1989.reference = {
    __cReference: true,
    get value() { return BOTTLE19____header_global_19a824bdac23a4d9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:486
export const DOORTILE17____header_global_11ea9bc162405e36 = ((u32(((u32(1169) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3ad89350632e17db9769bb6a() {
  return __cxx_static_address_3ad89350632e17db9769bb6a.reference || (__cxx_static_address_3ad89350632e17db9769bb6a.reference = {
    __cReference: true,
    get value() { return DOORTILE17____header_global_11ea9bc162405e36; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:487
export const MASKWALL7____header_global_d4b698e04210b69f = ((u32(((u32(1174) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_31cbeb506a990e19f7cb3a1d() {
  return __cxx_static_address_31cbeb506a990e19f7cb3a1d.reference || (__cxx_static_address_31cbeb506a990e19f7cb3a1d.reference = {
    __cReference: true,
    get value() { return MASKWALL7____header_global_d4b698e04210b69f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:488
export const DOORTILE11____header_global_0ea834ca1f790d29 = ((u32(((u32(1178) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c8c59286593419eae3615a73() {
  return __cxx_static_address_c8c59286593419eae3615a73.reference || (__cxx_static_address_c8c59286593419eae3615a73.reference = {
    __cReference: true,
    get value() { return DOORTILE11____header_global_0ea834ca1f790d29; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:489
export const DOORTILE12____header_global_4cfbf524af8eabbb = ((u32(((u32(1179) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a0af3f9f28b04d8229681ee8() {
  return __cxx_static_address_a0af3f9f28b04d8229681ee8.reference || (__cxx_static_address_a0af3f9f28b04d8229681ee8.reference = {
    __cReference: true,
    get value() { return DOORTILE12____header_global_4cfbf524af8eabbb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:490
export const VENDMACHINE____header_global_c3fdc3846e55ff56 = ((u32(((u32(1212) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_93465e041c7ab9d3a471d271() {
  return __cxx_static_address_93465e041c7ab9d3a471d271.reference || (__cxx_static_address_93465e041c7ab9d3a471d271.reference = {
    __cReference: true,
    get value() { return VENDMACHINE____header_global_c3fdc3846e55ff56; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:491
export const COLAMACHINE____header_global_b2b92d35b8e3878d = ((u32(((u32(1215) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_41dbfc2b2da9cda85d927afb() {
  return __cxx_static_address_41dbfc2b2da9cda85d927afb.reference || (__cxx_static_address_41dbfc2b2da9cda85d927afb.reference = {
    __cReference: true,
    get value() { return COLAMACHINE____header_global_b2b92d35b8e3878d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:492
export const CRANEPOLE____header_global_b36c0bae918fb1a7 = ((u32(((u32(1221) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0b16fd7ea4d2a512a4480da0() {
  return __cxx_static_address_0b16fd7ea4d2a512a4480da0.reference || (__cxx_static_address_0b16fd7ea4d2a512a4480da0.reference = {
    __cReference: true,
    get value() { return CRANEPOLE____header_global_b36c0bae918fb1a7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:493
export const CRANE____header_global_5bc730bd8ffa7518 = ((u32(((u32(1222) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_98cf7f4d84001de1cee2fe6d() {
  return __cxx_static_address_98cf7f4d84001de1cee2fe6d.reference || (__cxx_static_address_98cf7f4d84001de1cee2fe6d.reference = {
    __cReference: true,
    get value() { return CRANE____header_global_5bc730bd8ffa7518; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:494
export const BARBROKE____header_global_759db87c2a82b8c6 = ((u32(((u32(1225) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b19ddf44c28465280d8c9fd1() {
  return __cxx_static_address_b19ddf44c28465280d8c9fd1.reference || (__cxx_static_address_b19ddf44c28465280d8c9fd1.reference = {
    __cReference: true,
    get value() { return BARBROKE____header_global_759db87c2a82b8c6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:496
export const NUKEBARREL____header_global_bdbdc598aff7b562 = ((u32(((u32(1227) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_750e40b8a075a0a0d8bc6deb() {
  return __cxx_static_address_750e40b8a075a0a0d8bc6deb.reference || (__cxx_static_address_750e40b8a075a0a0d8bc6deb.reference = {
    __cReference: true,
    get value() { return NUKEBARREL____header_global_bdbdc598aff7b562; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:497
export const NUKEBARRELDENTED____header_global_4095fdffb503ef72 = ((u32(((u32(1228) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a17b4925e1971861c69668a2() {
  return __cxx_static_address_a17b4925e1971861c69668a2.reference || (__cxx_static_address_a17b4925e1971861c69668a2.reference = {
    __cReference: true,
    get value() { return NUKEBARRELDENTED____header_global_4095fdffb503ef72; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:498
export const NUKEBARRELLEAKED____header_global_f4d80fad0a99ed8c = ((u32(((u32(1229) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_50f19c0b81afbeb19faad68c() {
  return __cxx_static_address_50f19c0b81afbeb19faad68c.reference || (__cxx_static_address_50f19c0b81afbeb19faad68c.reference = {
    __cReference: true,
    get value() { return NUKEBARRELLEAKED____header_global_f4d80fad0a99ed8c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:499
export const CANWITHSOMETHING____header_global_ea46e2a6721c142d = ((u32(((u32(1232) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_01030b32da9ebbee2ca39a9f() {
  return __cxx_static_address_01030b32da9ebbee2ca39a9f.reference || (__cxx_static_address_01030b32da9ebbee2ca39a9f.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING____header_global_ea46e2a6721c142d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:501
export const BANNER____header_global_9e5cef8e1a3a7b50 = ((u32(((u32(1236) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_58d5f2c9c8ce783e1da8851d() {
  return __cxx_static_address_58d5f2c9c8ce783e1da8851d.reference || (__cxx_static_address_58d5f2c9c8ce783e1da8851d.reference = {
    __cReference: true,
    get value() { return BANNER____header_global_9e5cef8e1a3a7b50; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:502
export const EXPLODINGBARREL____header_global_82dfdfee2b928b1d = ((u32(((u32(1238) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4a054080aaf88fd88b941fa7() {
  return __cxx_static_address_4a054080aaf88fd88b941fa7.reference || (__cxx_static_address_4a054080aaf88fd88b941fa7.reference = {
    __cReference: true,
    get value() { return EXPLODINGBARREL____header_global_82dfdfee2b928b1d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:503
export const EXPLODINGBARREL2____header_global_4b2e675f69acd33f = ((u32(((u32(1239) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6de225b4c8664ee6fd70c62e() {
  return __cxx_static_address_6de225b4c8664ee6fd70c62e.reference || (__cxx_static_address_6de225b4c8664ee6fd70c62e.reference = {
    __cReference: true,
    get value() { return EXPLODINGBARREL2____header_global_4b2e675f69acd33f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:504
export const FIREBARREL____header_global_c658e35f87eccaa9 = ((u32(((u32(1240) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_74bf2c73272d5c758b48c0b9() {
  return __cxx_static_address_74bf2c73272d5c758b48c0b9.reference || (__cxx_static_address_74bf2c73272d5c758b48c0b9.reference = {
    __cReference: true,
    get value() { return FIREBARREL____header_global_c658e35f87eccaa9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:505
export const SEENINE____header_global_28163f02a14be9e5 = ((u32(((u32(1247) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_010f62902587280b5862f8b0() {
  return __cxx_static_address_010f62902587280b5862f8b0.reference || (__cxx_static_address_010f62902587280b5862f8b0.reference = {
    __cReference: true,
    get value() { return SEENINE____header_global_28163f02a14be9e5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:506
export const SEENINEDEAD____header_global_47dd06cd0b3f5237 = ((u32(((u32(1248) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1410368fe83649f9bb8aa46e() {
  return __cxx_static_address_1410368fe83649f9bb8aa46e.reference || (__cxx_static_address_1410368fe83649f9bb8aa46e.reference = {
    __cReference: true,
    get value() { return SEENINEDEAD____header_global_47dd06cd0b3f5237; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:507
export const STEAM____header_global_42dc728828809ad1 = ((u32(((u32(1250) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5cee78255383e96a48c07557() {
  return __cxx_static_address_5cee78255383e96a48c07557.reference || (__cxx_static_address_5cee78255383e96a48c07557.reference = {
    __cReference: true,
    get value() { return STEAM____header_global_42dc728828809ad1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:508
export const CEILINGSTEAM____header_global_def72cf3b4f72afa = ((u32(((u32(1255) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f9da2e1c04c2afc22d8a804b() {
  return __cxx_static_address_f9da2e1c04c2afc22d8a804b.reference || (__cxx_static_address_f9da2e1c04c2afc22d8a804b.reference = {
    __cReference: true,
    get value() { return CEILINGSTEAM____header_global_def72cf3b4f72afa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:509
export const PIPE6B____header_global_483550d6bcfca330 = ((u32(((u32(1260) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c88827fe3f6ea64a58bb6d9d() {
  return __cxx_static_address_c88827fe3f6ea64a58bb6d9d.reference || (__cxx_static_address_c88827fe3f6ea64a58bb6d9d.reference = {
    __cReference: true,
    get value() { return PIPE6B____header_global_483550d6bcfca330; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:510
export const TRANSPORTERBEAM____header_global_e23e7ee27675baef = ((u32(((u32(1261) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d5296a2ae07a789619a673a4() {
  return __cxx_static_address_d5296a2ae07a789619a673a4.reference || (__cxx_static_address_d5296a2ae07a789619a673a4.reference = {
    __cReference: true,
    get value() { return TRANSPORTERBEAM____header_global_e23e7ee27675baef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:512
export const TRASH____header_global_6abade18d5bf0f17 = ((u32(((u32(1272) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_64ded4266ce4e350a8bbf034() {
  return __cxx_static_address_64ded4266ce4e350a8bbf034.reference || (__cxx_static_address_64ded4266ce4e350a8bbf034.reference = {
    __cReference: true,
    get value() { return TRASH____header_global_6abade18d5bf0f17; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:515
export const BLANKSCREEN____header_global_373ff2ecf5f1dc64 = ((u32(((u32(1293) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5e2d24f92e8341d0d628147a() {
  return __cxx_static_address_5e2d24f92e8341d0d628147a.reference || (__cxx_static_address_5e2d24f92e8341d0d628147a.reference = {
    __cReference: true,
    get value() { return BLANKSCREEN____header_global_373ff2ecf5f1dc64; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:528
export const HELECOPT____header_global_dfeb0818dea87141 = ((u32(((u32(1346) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8a77223d905c3e7624f6bc1c() {
  return __cxx_static_address_8a77223d905c3e7624f6bc1c.reference || (__cxx_static_address_8a77223d905c3e7624f6bc1c.reference = {
    __cReference: true,
    get value() { return HELECOPT____header_global_dfeb0818dea87141; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:530
export const HOLODUKE____header_global_13b886505f87b279 = ((u32(((u32(1348) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_feebc35b4a8bd6b2cfd38714() {
  return __cxx_static_address_feebc35b4a8bd6b2cfd38714.reference || (__cxx_static_address_feebc35b4a8bd6b2cfd38714.reference = {
    __cReference: true,
    get value() { return HOLODUKE____header_global_13b886505f87b279; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:531
export const SPACEMARINE____header_global_0a597080febb9a98 = ((u32(((u32(1353) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_24c2f1ed31a648915d9a7a03() {
  return __cxx_static_address_24c2f1ed31a648915d9a7a03.reference || (__cxx_static_address_24c2f1ed31a648915d9a7a03.reference = {
    __cReference: true,
    get value() { return SPACEMARINE____header_global_0a597080febb9a98; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:532
export const INDY____header_global_d9dd7f479db3a2fc = ((u32(((u32(1355) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c7a35234d322f5c45f91eaaf() {
  return __cxx_static_address_c7a35234d322f5c45f91eaaf.reference || (__cxx_static_address_c7a35234d322f5c45f91eaaf.reference = {
    __cReference: true,
    get value() { return INDY____header_global_d9dd7f479db3a2fc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:535
export const MONK____header_global_f1e36dda4b0b3b24 = ((u32(((u32(1352) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cbee23ec3a27044743528cf2() {
  return __cxx_static_address_cbee23ec3a27044743528cf2.reference || (__cxx_static_address_cbee23ec3a27044743528cf2.reference = {
    __cReference: true,
    get value() { return MONK____header_global_f1e36dda4b0b3b24; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:536
export const LUKE____header_global_283b878592aa5905 = ((u32(((u32(1354) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_28a4d20ac087ff213ddd34d9() {
  return __cxx_static_address_28a4d20ac087ff213ddd34d9.reference || (__cxx_static_address_28a4d20ac087ff213ddd34d9.reference = {
    __cReference: true,
    get value() { return LUKE____header_global_283b878592aa5905; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:538
export const WATERSPLASH2____header_global_5858c320dd2ceacb = ((u32(((u32(1380) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a98c669647a5e60447c41db3() {
  return __cxx_static_address_a98c669647a5e60447c41db3.reference || (__cxx_static_address_a98c669647a5e60447c41db3.reference = {
    __cReference: true,
    get value() { return WATERSPLASH2____header_global_5858c320dd2ceacb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:539
export const FIREVASE____header_global_452656818c5efe49 = ((u32(((u32(1390) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_858c29040352d749610a05fc() {
  return __cxx_static_address_858c29040352d749610a05fc.reference || (__cxx_static_address_858c29040352d749610a05fc.reference = {
    __cReference: true,
    get value() { return FIREVASE____header_global_452656818c5efe49; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:541
export const APLAYERTOP____header_global_2551368a86d2786a = ((u32(((u32(1400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3efb57b56e455ed13001ef37() {
  return __cxx_static_address_3efb57b56e455ed13001ef37.reference || (__cxx_static_address_3efb57b56e455ed13001ef37.reference = {
    __cReference: true,
    get value() { return APLAYERTOP____header_global_2551368a86d2786a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:548
export const SHARK____header_global_73f480b3e454e6e7 = ((u32(((u32(1550) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2a3b599bdb99e7adde981b40() {
  return __cxx_static_address_2a3b599bdb99e7adde981b40.reference || (__cxx_static_address_2a3b599bdb99e7adde981b40.reference = {
    __cReference: true,
    get value() { return SHARK____header_global_73f480b3e454e6e7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:549
export const BLOOD____header_global_18d9130e9ad7a076 = ((u32(((u32(1620) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4c43d7e234c5d887e2c776ba() {
  return __cxx_static_address_4c43d7e234c5d887e2c776ba.reference || (__cxx_static_address_4c43d7e234c5d887e2c776ba.reference = {
    __cReference: true,
    get value() { return BLOOD____header_global_18d9130e9ad7a076; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:551
export const TRANSPORTERSTAR____header_global_ba6472ec63c38517 = ((u32(((u32(1630) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_893afb777d672540eb60d0f7() {
  return __cxx_static_address_893afb777d672540eb60d0f7.reference || (__cxx_static_address_893afb777d672540eb60d0f7.reference = {
    __cReference: true,
    get value() { return TRANSPORTERSTAR____header_global_ba6472ec63c38517; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:552
export const SPIT____header_global_752b8aed352778f2 = ((u32(((u32(1636) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_916a4747d331ffaaa9107a30() {
  return __cxx_static_address_916a4747d331ffaaa9107a30.reference || (__cxx_static_address_916a4747d331ffaaa9107a30.reference = {
    __cReference: true,
    get value() { return SPIT____header_global_752b8aed352778f2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:553
export const LOOGIE____header_global_608c0adf524f2c36 = ((u32(((u32(1637) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fa6f174435963babd3edda90() {
  return __cxx_static_address_fa6f174435963babd3edda90.reference || (__cxx_static_address_fa6f174435963babd3edda90.reference = {
    __cReference: true,
    get value() { return LOOGIE____header_global_608c0adf524f2c36; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:554
export const FIST____header_global_c5df36679a529e8a = ((u32(((u32(1640) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_08a7c29125d8930d2f42522f() {
  return __cxx_static_address_08a7c29125d8930d2f42522f.reference || (__cxx_static_address_08a7c29125d8930d2f42522f.reference = {
    __cReference: true,
    get value() { return FIST____header_global_c5df36679a529e8a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:557
export const TONGUE____header_global_2813061ed8bb30a9 = ((u32(((u32(1647) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f173f35a86bdeef01a89a176() {
  return __cxx_static_address_f173f35a86bdeef01a89a176.reference || (__cxx_static_address_f173f35a86bdeef01a89a176.reference = {
    __cReference: true,
    get value() { return TONGUE____header_global_2813061ed8bb30a9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:558
export const MORTER____header_global_d3cdcdfc33bbf404 = ((u32(((u32(1650) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8c2abe3cc4e0309122b5bd7b() {
  return __cxx_static_address_8c2abe3cc4e0309122b5bd7b.reference || (__cxx_static_address_8c2abe3cc4e0309122b5bd7b.reference = {
    __cReference: true,
    get value() { return MORTER____header_global_d3cdcdfc33bbf404; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:560
export const RADIUSEXPLOSION____header_global_65798f932aefd9e0 = ((u32(((u32(1670) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b5ac5319279c40b9d96d07a8() {
  return __cxx_static_address_b5ac5319279c40b9d96d07a8.reference || (__cxx_static_address_b5ac5319279c40b9d96d07a8.reference = {
    __cReference: true,
    get value() { return RADIUSEXPLOSION____header_global_65798f932aefd9e0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:561
export const FORCERIPPLE____header_global_02c55da439ecb983 = ((u32(((u32(1671) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_506100652cb5035f20cd64dd() {
  return __cxx_static_address_506100652cb5035f20cd64dd.reference || (__cxx_static_address_506100652cb5035f20cd64dd.reference = {
    __cReference: true,
    get value() { return FORCERIPPLE____header_global_02c55da439ecb983; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:562
export const LIZTROOP____header_global_1fafce70706357cf = ((u32(((u32(1680) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c095a03d081e261384c64b33() {
  return __cxx_static_address_c095a03d081e261384c64b33.reference || (__cxx_static_address_c095a03d081e261384c64b33.reference = {
    __cReference: true,
    get value() { return LIZTROOP____header_global_1fafce70706357cf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:563
export const LIZTROOPRUNNING____header_global_e1e0030e7ea58665 = ((u32(((u32(1681) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_175e1ab7df28a028fb704535() {
  return __cxx_static_address_175e1ab7df28a028fb704535.reference || (__cxx_static_address_175e1ab7df28a028fb704535.reference = {
    __cReference: true,
    get value() { return LIZTROOPRUNNING____header_global_e1e0030e7ea58665; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:564
export const LIZTROOPSTAYPUT____header_global_65d7b72a23dd53e8 = ((u32(((u32(1682) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5cc340fa307e1afac1ca5e03() {
  return __cxx_static_address_5cc340fa307e1afac1ca5e03.reference || (__cxx_static_address_5cc340fa307e1afac1ca5e03.reference = {
    __cReference: true,
    get value() { return LIZTROOPSTAYPUT____header_global_65d7b72a23dd53e8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:565
export const LIZTROOPSHOOT____header_global_0f545ddcac3efc7c = ((u32(((u32(1715) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fad100563f1e00e4344f6d0e() {
  return __cxx_static_address_fad100563f1e00e4344f6d0e.reference || (__cxx_static_address_fad100563f1e00e4344f6d0e.reference = {
    __cReference: true,
    get value() { return LIZTROOPSHOOT____header_global_0f545ddcac3efc7c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:566
export const LIZTROOPJETPACK____header_global_fbd4d5c8a7fd214c = ((u32(((u32(1725) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bc7cb6e1e4f18a2ad55167fa() {
  return __cxx_static_address_bc7cb6e1e4f18a2ad55167fa.reference || (__cxx_static_address_bc7cb6e1e4f18a2ad55167fa.reference = {
    __cReference: true,
    get value() { return LIZTROOPJETPACK____header_global_fbd4d5c8a7fd214c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:567
export const LIZTROOPONTOILET____header_global_8573c91071a95f3e = ((u32(((u32(1741) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_71cf056bff878c5a5d9e01a4() {
  return __cxx_static_address_71cf056bff878c5a5d9e01a4.reference || (__cxx_static_address_71cf056bff878c5a5d9e01a4.reference = {
    __cReference: true,
    get value() { return LIZTROOPONTOILET____header_global_8573c91071a95f3e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:568
export const LIZTROOPJUSTSIT____header_global_37f68a3363147394 = ((u32(((u32(1742) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d5e13723df3a6488f7735838() {
  return __cxx_static_address_d5e13723df3a6488f7735838.reference || (__cxx_static_address_d5e13723df3a6488f7735838.reference = {
    __cReference: true,
    get value() { return LIZTROOPJUSTSIT____header_global_37f68a3363147394; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:569
export const LIZTROOPDUCKING____header_global_626235fe91540519 = ((u32(((u32(1744) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9342986f531af67e4715c06e() {
  return __cxx_static_address_9342986f531af67e4715c06e.reference || (__cxx_static_address_9342986f531af67e4715c06e.reference = {
    __cReference: true,
    get value() { return LIZTROOPDUCKING____header_global_626235fe91540519; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:573
export const OCTABRAIN____header_global_a1c6719436a1b6ff = ((u32(((u32(1820) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_92b4788f95e00ea40747c2d3() {
  return __cxx_static_address_92b4788f95e00ea40747c2d3.reference || (__cxx_static_address_92b4788f95e00ea40747c2d3.reference = {
    __cReference: true,
    get value() { return OCTABRAIN____header_global_a1c6719436a1b6ff; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:574
export const OCTABRAINSTAYPUT____header_global_fa777866935c70f1 = ((u32(((u32(1821) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_698e58abad06ec8e9b4c0b77() {
  return __cxx_static_address_698e58abad06ec8e9b4c0b77.reference || (__cxx_static_address_698e58abad06ec8e9b4c0b77.reference = {
    __cReference: true,
    get value() { return OCTABRAINSTAYPUT____header_global_fa777866935c70f1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:575
export const INNERJAW____header_global_784091222ced53ee = ((u32(((u32(1860) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c3d4ce78ba4f44b714106018() {
  return __cxx_static_address_c3d4ce78ba4f44b714106018.reference || (__cxx_static_address_c3d4ce78ba4f44b714106018.reference = {
    __cReference: true,
    get value() { return INNERJAW____header_global_784091222ced53ee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:576
export const DRONE____header_global_0b0dcd2adca8e08f = ((u32(((u32(1880) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dcfacb5ea59a4a96f151ecce() {
  return __cxx_static_address_dcfacb5ea59a4a96f151ecce.reference || (__cxx_static_address_dcfacb5ea59a4a96f151ecce.reference = {
    __cReference: true,
    get value() { return DRONE____header_global_0b0dcd2adca8e08f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:578
export const COMMANDER____header_global_604efb11ecc59b7b = ((u32(((u32(1920) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2e7b8a1daef57379b229aa77() {
  return __cxx_static_address_2e7b8a1daef57379b229aa77.reference || (__cxx_static_address_2e7b8a1daef57379b229aa77.reference = {
    __cReference: true,
    get value() { return COMMANDER____header_global_604efb11ecc59b7b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:579
export const COMMANDERSTAYPUT____header_global_3a3dd0b7d842eb75 = ((u32(((u32(1921) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f479b032572a59b1d87d26d1() {
  return __cxx_static_address_f479b032572a59b1d87d26d1.reference || (__cxx_static_address_f479b032572a59b1d87d26d1.reference = {
    __cReference: true,
    get value() { return COMMANDERSTAYPUT____header_global_3a3dd0b7d842eb75; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:581
export const TANK____header_global_1fa87a4affd2fc62 = ((u32(((u32(1975) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3c9e1ba51a6fec4e14f0d95a() {
  return __cxx_static_address_3c9e1ba51a6fec4e14f0d95a.reference || (__cxx_static_address_3c9e1ba51a6fec4e14f0d95a.reference = {
    __cReference: true,
    get value() { return TANK____header_global_1fa87a4affd2fc62; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:582
export const PIGCOP____header_global_c6cf06ec9360de25 = ((u32(((u32(2000) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a5fc59cc74648f58b6b32ef4() {
  return __cxx_static_address_a5fc59cc74648f58b6b32ef4.reference || (__cxx_static_address_a5fc59cc74648f58b6b32ef4.reference = {
    __cReference: true,
    get value() { return PIGCOP____header_global_c6cf06ec9360de25; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:583
export const PIGCOPSTAYPUT____header_global_8ee529e71c4bf1d9 = ((u32(((u32(2001) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ce979a75c0db681bc4bd11f8() {
  return __cxx_static_address_ce979a75c0db681bc4bd11f8.reference || (__cxx_static_address_ce979a75c0db681bc4bd11f8.reference = {
    __cReference: true,
    get value() { return PIGCOPSTAYPUT____header_global_8ee529e71c4bf1d9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:584
export const PIGCOPDIVE____header_global_a5e66679e074ef41 = ((u32(((u32(2045) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d4a1eee31f6d283c95428e91() {
  return __cxx_static_address_d4a1eee31f6d283c95428e91.reference || (__cxx_static_address_d4a1eee31f6d283c95428e91.reference = {
    __cReference: true,
    get value() { return PIGCOPDIVE____header_global_a5e66679e074ef41; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:585
export const LIZMAN____header_global_85f5098aaf02409a = ((u32(((u32(2120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c04222ffc2503cbba5d20820() {
  return __cxx_static_address_c04222ffc2503cbba5d20820.reference || (__cxx_static_address_c04222ffc2503cbba5d20820.reference = {
    __cReference: true,
    get value() { return LIZMAN____header_global_85f5098aaf02409a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:586
export const LIZMANSTAYPUT____header_global_56e5a528f853cb31 = ((u32(((u32(2121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_07b368897cbcb15e0bb2c49f() {
  return __cxx_static_address_07b368897cbcb15e0bb2c49f.reference || (__cxx_static_address_07b368897cbcb15e0bb2c49f.reference = {
    __cReference: true,
    get value() { return LIZMANSTAYPUT____header_global_56e5a528f853cb31; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:587
export const LIZMANSPITTING____header_global_7626352a77a49973 = ((u32(((u32(2150) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_caf946a5c21eaf31d319935b() {
  return __cxx_static_address_caf946a5c21eaf31d319935b.reference || (__cxx_static_address_caf946a5c21eaf31d319935b.reference = {
    __cReference: true,
    get value() { return LIZMANSPITTING____header_global_7626352a77a49973; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:588
export const LIZMANFEEDING____header_global_edafed67e43561ab = ((u32(((u32(2160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2a9dbeeae1b2b1f9d1d1570b() {
  return __cxx_static_address_2a9dbeeae1b2b1f9d1d1570b.reference || (__cxx_static_address_2a9dbeeae1b2b1f9d1d1570b.reference = {
    __cReference: true,
    get value() { return LIZMANFEEDING____header_global_edafed67e43561ab; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:589
export const LIZMANJUMP____header_global_1068973854461995 = ((u32(((u32(2165) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_21731fc6699059a5f6a42919() {
  return __cxx_static_address_21731fc6699059a5f6a42919.reference || (__cxx_static_address_21731fc6699059a5f6a42919.reference = {
    __cReference: true,
    get value() { return LIZMANJUMP____header_global_1068973854461995; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:590
export const FECES____header_global_57148f164a0ed622 = ((u32(((u32(2200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_860826ea9923d60ccfb42314() {
  return __cxx_static_address_860826ea9923d60ccfb42314.reference || (__cxx_static_address_860826ea9923d60ccfb42314.reference = {
    __cReference: true,
    get value() { return FECES____header_global_57148f164a0ed622; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:609
export const WALLBLOOD1____header_global_e12889d8610a7a73 = ((u32(((u32(2301) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d8e285ee1a50e22f60154ee5() {
  return __cxx_static_address_d8e285ee1a50e22f60154ee5.reference || (__cxx_static_address_d8e285ee1a50e22f60154ee5.reference = {
    __cReference: true,
    get value() { return WALLBLOOD1____header_global_e12889d8610a7a73; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:610
export const WALLBLOOD2____header_global_42db76d941f51ccf = ((u32(((u32(2302) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_41bf09332529fa12fb8fef59() {
  return __cxx_static_address_41bf09332529fa12fb8fef59.reference || (__cxx_static_address_41bf09332529fa12fb8fef59.reference = {
    __cReference: true,
    get value() { return WALLBLOOD2____header_global_42db76d941f51ccf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:611
export const WALLBLOOD3____header_global_b4be9593b5905ec3 = ((u32(((u32(2303) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b54c3e04b1b9f09aad086d67() {
  return __cxx_static_address_b54c3e04b1b9f09aad086d67.reference || (__cxx_static_address_b54c3e04b1b9f09aad086d67.reference = {
    __cReference: true,
    get value() { return WALLBLOOD3____header_global_b4be9593b5905ec3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:612
export const WALLBLOOD4____header_global_e0eb30f21fc1ecd2 = ((u32(((u32(2304) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7812524e41663b3154859d24() {
  return __cxx_static_address_7812524e41663b3154859d24.reference || (__cxx_static_address_7812524e41663b3154859d24.reference = {
    __cReference: true,
    get value() { return WALLBLOOD4____header_global_e0eb30f21fc1ecd2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:613
export const WALLBLOOD5____header_global_2414a64c798e669a = ((u32(((u32(2305) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fc947a59afed52f2e7b284d0() {
  return __cxx_static_address_fc947a59afed52f2e7b284d0.reference || (__cxx_static_address_fc947a59afed52f2e7b284d0.reference = {
    __cReference: true,
    get value() { return WALLBLOOD5____header_global_2414a64c798e669a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:614
export const WALLBLOOD7____header_global_9a5d28e2fb5698b6 = ((u32(((u32(2307) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c0c9467e5eff30e3835af10a() {
  return __cxx_static_address_c0c9467e5eff30e3835af10a.reference || (__cxx_static_address_c0c9467e5eff30e3835af10a.reference = {
    __cReference: true,
    get value() { return WALLBLOOD7____header_global_9a5d28e2fb5698b6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:615
export const WALLBLOOD8____header_global_c3690a3d7d568656 = ((u32(((u32(2308) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1aba495a4235f846ed34f0a4() {
  return __cxx_static_address_1aba495a4235f846ed34f0a4.reference || (__cxx_static_address_1aba495a4235f846ed34f0a4.reference = {
    __cReference: true,
    get value() { return WALLBLOOD8____header_global_c3690a3d7d568656; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:618
export const CRACKKNUCKLES____header_global_aa4245f589143169 = ((u32(((u32(2324) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1e60f429b06fe2f785b88ddb() {
  return __cxx_static_address_1e60f429b06fe2f785b88ddb.reference || (__cxx_static_address_1e60f429b06fe2f785b88ddb.reference = {
    __cReference: true,
    get value() { return CRACKKNUCKLES____header_global_aa4245f589143169; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:621
export const ROTATEGUN____header_global_499f96c6f6aec73b = ((u32(((u32(2360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_867bf99ea0a5ba760c6e4d76() {
  return __cxx_static_address_867bf99ea0a5ba760c6e4d76.reference || (__cxx_static_address_867bf99ea0a5ba760c6e4d76.reference = {
    __cReference: true,
    get value() { return ROTATEGUN____header_global_499f96c6f6aec73b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:622
export const GREENSLIME____header_global_e863f69a82d3df57 = ((u32(((u32(2370) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_265101e8e2882209829cd8e6() {
  return __cxx_static_address_265101e8e2882209829cd8e6.reference || (__cxx_static_address_265101e8e2882209829cd8e6.reference = {
    __cReference: true,
    get value() { return GREENSLIME____header_global_e863f69a82d3df57; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:623
export const WATERDRIPSPLASH____header_global_286aba7eda91c566 = ((u32(((u32(2380) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_406f874c17e97b065b2e7ca6() {
  return __cxx_static_address_406f874c17e97b065b2e7ca6.reference || (__cxx_static_address_406f874c17e97b065b2e7ca6.reference = {
    __cReference: true,
    get value() { return WATERDRIPSPLASH____header_global_286aba7eda91c566; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:624
export const SCRAP6____header_global_ffc40c733c472885 = ((u32(((u32(2390) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d009ecbfcdc437804014f3db() {
  return __cxx_static_address_d009ecbfcdc437804014f3db.reference || (__cxx_static_address_d009ecbfcdc437804014f3db.reference = {
    __cReference: true,
    get value() { return SCRAP6____header_global_ffc40c733c472885; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:630
export const ORGANTIC____header_global_4d2f1a591b76ba7a = ((u32(((u32(2420) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_43a2e99c4504d414bd9e11cb() {
  return __cxx_static_address_43a2e99c4504d414bd9e11cb.reference || (__cxx_static_address_43a2e99c4504d414bd9e11cb.reference = {
    __cReference: true,
    get value() { return ORGANTIC____header_global_4d2f1a591b76ba7a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:631
export const BETAVERSION____header_global_6124aa4a63a82e16 = ((u32(((u32(2440) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a1c5ca2b96df3242dcb65f3e() {
  return __cxx_static_address_a1c5ca2b96df3242dcb65f3e.reference || (__cxx_static_address_a1c5ca2b96df3242dcb65f3e.reference = {
    __cReference: true,
    get value() { return BETAVERSION____header_global_6124aa4a63a82e16; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:632
export const SELECTDIR____header_global_14ea72417a05b61d = ((u32(((u32(2444) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1b6d59072afa2c52b7cbaffc() {
  return __cxx_static_address_1b6d59072afa2c52b7cbaffc.reference || (__cxx_static_address_1b6d59072afa2c52b7cbaffc.reference = {
    __cReference: true,
    get value() { return SELECTDIR____header_global_14ea72417a05b61d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:633
export const F1HELP____header_global_7c8314acbc014baf = ((u32(((u32(2445) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f1cad62bf48c3af17b09389c() {
  return __cxx_static_address_f1cad62bf48c3af17b09389c.reference || (__cxx_static_address_f1cad62bf48c3af17b09389c.reference = {
    __cReference: true,
    get value() { return F1HELP____header_global_7c8314acbc014baf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:635
export const MENUSCREEN____header_global_7db127c2936f9fca = ((u32(((u32(2456) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6a76a93425b530580ce8defe() {
  return __cxx_static_address_6a76a93425b530580ce8defe.reference || (__cxx_static_address_6a76a93425b530580ce8defe.reference = {
    __cReference: true,
    get value() { return MENUSCREEN____header_global_7db127c2936f9fca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:636
export const MENUBAR____header_global_4c00095f714adbaa = ((u32(((u32(2457) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_db0e898e8c029e1c99845a37() {
  return __cxx_static_address_db0e898e8c029e1c99845a37.reference || (__cxx_static_address_db0e898e8c029e1c99845a37.reference = {
    __cReference: true,
    get value() { return MENUBAR____header_global_4c00095f714adbaa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:637
export const KILLSICON____header_global_8e9f1029cacfd7a1 = ((u32(((u32(2458) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b76869cb7ba27069ff2ec51a() {
  return __cxx_static_address_b76869cb7ba27069ff2ec51a.reference || (__cxx_static_address_b76869cb7ba27069ff2ec51a.reference = {
    __cReference: true,
    get value() { return KILLSICON____header_global_8e9f1029cacfd7a1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:638
export const FIRSTAID_ICON____header_global_6727536bfcb6da9d = ((u32(((u32(2460) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0ea69073779f122f0480b3a1() {
  return __cxx_static_address_0ea69073779f122f0480b3a1.reference || (__cxx_static_address_0ea69073779f122f0480b3a1.reference = {
    __cReference: true,
    get value() { return FIRSTAID_ICON____header_global_6727536bfcb6da9d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:639
export const HEAT_ICON____header_global_20e9a25a366c3c39 = ((u32(((u32(2461) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f73f86994b017284a83d6b72() {
  return __cxx_static_address_f73f86994b017284a83d6b72.reference || (__cxx_static_address_f73f86994b017284a83d6b72.reference = {
    __cReference: true,
    get value() { return HEAT_ICON____header_global_20e9a25a366c3c39; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:640
export const BOTTOMSTATUSBAR____header_global_be255fe87a3c9343 = ((u32(((u32(2462) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e162029ea853748e99eda369() {
  return __cxx_static_address_e162029ea853748e99eda369.reference || (__cxx_static_address_e162029ea853748e99eda369.reference = {
    __cReference: true,
    get value() { return BOTTOMSTATUSBAR____header_global_be255fe87a3c9343; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:641
export const BOOT_ICON____header_global_a989e37f9dd19629 = ((u32(((u32(2463) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_022d288a3cd65c928d01059b() {
  return __cxx_static_address_022d288a3cd65c928d01059b.reference || (__cxx_static_address_022d288a3cd65c928d01059b.reference = {
    __cReference: true,
    get value() { return BOOT_ICON____header_global_a989e37f9dd19629; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:642
export const FRAGBAR____header_global_163c18fd5f26ff00 = ((u32(((u32(2465) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_855f9b0e4e885a2e3a282ca0() {
  return __cxx_static_address_855f9b0e4e885a2e3a282ca0.reference || (__cxx_static_address_855f9b0e4e885a2e3a282ca0.reference = {
    __cReference: true,
    get value() { return FRAGBAR____header_global_163c18fd5f26ff00; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:643
export const JETPACK_ICON____header_global_ff75931bb4a01a1a = ((u32(((u32(2467) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4e7c96d96644c422793c4bf4() {
  return __cxx_static_address_4e7c96d96644c422793c4bf4.reference || (__cxx_static_address_4e7c96d96644c422793c4bf4.reference = {
    __cReference: true,
    get value() { return JETPACK_ICON____header_global_ff75931bb4a01a1a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:644
export const AIRTANK_ICON____header_global_4af300434d42f05a = ((u32(((u32(2468) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8771ff70c407fdd5fab489a2() {
  return __cxx_static_address_8771ff70c407fdd5fab489a2.reference || (__cxx_static_address_8771ff70c407fdd5fab489a2.reference = {
    __cReference: true,
    get value() { return AIRTANK_ICON____header_global_4af300434d42f05a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:645
export const STEROIDS_ICON____header_global_afa1ae07c585856a = ((u32(((u32(2469) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fec699afe768f07028ecc551() {
  return __cxx_static_address_fec699afe768f07028ecc551.reference || (__cxx_static_address_fec699afe768f07028ecc551.reference = {
    __cReference: true,
    get value() { return STEROIDS_ICON____header_global_afa1ae07c585856a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:646
export const HOLODUKE_ICON____header_global_0aac4f0121328e4f = ((u32(((u32(2470) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f25f499987949dda58131cb6() {
  return __cxx_static_address_f25f499987949dda58131cb6.reference || (__cxx_static_address_f25f499987949dda58131cb6.reference = {
    __cReference: true,
    get value() { return HOLODUKE_ICON____header_global_0aac4f0121328e4f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:647
export const ACCESS_ICON____header_global_ac6714586dde5396 = ((u32(((u32(2471) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_464541cf1efb90453d81ad0b() {
  return __cxx_static_address_464541cf1efb90453d81ad0b.reference || (__cxx_static_address_464541cf1efb90453d81ad0b.reference = {
    __cReference: true,
    get value() { return ACCESS_ICON____header_global_ac6714586dde5396; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:648
export const DIGITALNUM____header_global_17e257d1e2bf8f14 = ((u32(((u32(2472) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_124d79499a60f89c45b88d85() {
  return __cxx_static_address_124d79499a60f89c45b88d85.reference || (__cxx_static_address_124d79499a60f89c45b88d85.reference = {
    __cReference: true,
    get value() { return DIGITALNUM____header_global_17e257d1e2bf8f14; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:649
export const DUKECAR____header_global_7cb3eeaa49914b82 = ((u32(((u32(2491) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3a18dc62b29c69ec21ef31db() {
  return __cxx_static_address_3a18dc62b29c69ec21ef31db.reference || (__cxx_static_address_3a18dc62b29c69ec21ef31db.reference = {
    __cReference: true,
    get value() { return DUKECAR____header_global_7cb3eeaa49914b82; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:650
export const CAMCORNER____header_global_66b2801c376f2952 = ((u32(((u32(2482) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9dcc563478b5e31bfb3e55a3() {
  return __cxx_static_address_9dcc563478b5e31bfb3e55a3.reference || (__cxx_static_address_9dcc563478b5e31bfb3e55a3.reference = {
    __cReference: true,
    get value() { return CAMCORNER____header_global_66b2801c376f2952; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:651
export const CAMLIGHT____header_global_765df622d33c9a94 = ((u32(((u32(2484) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bb8d928685c1b86581c0a3d7() {
  return __cxx_static_address_bb8d928685c1b86581c0a3d7.reference || (__cxx_static_address_bb8d928685c1b86581c0a3d7.reference = {
    __cReference: true,
    get value() { return CAMLIGHT____header_global_765df622d33c9a94; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:652
export const SLIDEBAR____header_global_4bface8a296d99cd = ((u32(((u32(2489) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_395ad1955063211fe3180452() {
  return __cxx_static_address_395ad1955063211fe3180452.reference || (__cxx_static_address_395ad1955063211fe3180452.reference = {
    __cReference: true,
    get value() { return SLIDEBAR____header_global_4bface8a296d99cd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:653
export const DREALMS____header_global_7e60f9e4fbb6fbed = ((u32(((u32(2492) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_89795c1439a0cd5672c194c4() {
  return __cxx_static_address_89795c1439a0cd5672c194c4.reference || (__cxx_static_address_89795c1439a0cd5672c194c4.reference = {
    __cReference: true,
    get value() { return DREALMS____header_global_7e60f9e4fbb6fbed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:654
export const BETASCREEN____header_global_3ad8ec890df56619 = ((u32(((u32(2493) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_010fbd6ea616e1f8697e6f72() {
  return __cxx_static_address_010fbd6ea616e1f8697e6f72.reference || (__cxx_static_address_010fbd6ea616e1f8697e6f72.reference = {
    __cReference: true,
    get value() { return BETASCREEN____header_global_3ad8ec890df56619; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:655
export const WINDOWBORDER1____header_global_ace9631144b6819a = ((u32(((u32(2494) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5bc97f2fdb4035684ed5b2f6() {
  return __cxx_static_address_5bc97f2fdb4035684ed5b2f6.reference || (__cxx_static_address_5bc97f2fdb4035684ed5b2f6.reference = {
    __cReference: true,
    get value() { return WINDOWBORDER1____header_global_ace9631144b6819a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:656
export const TEXTBOX____header_global_177ba94f33bb74ee = ((u32(((u32(2495) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ce14c7733e8bbd338beb662c() {
  return __cxx_static_address_ce14c7733e8bbd338beb662c.reference || (__cxx_static_address_ce14c7733e8bbd338beb662c.reference = {
    __cReference: true,
    get value() { return TEXTBOX____header_global_177ba94f33bb74ee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:657
export const WINDOWBORDER2____header_global_20752b85bb457439 = ((u32(((u32(2496) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3c9935efa4376616c3c51e2d() {
  return __cxx_static_address_3c9935efa4376616c3c51e2d.reference || (__cxx_static_address_3c9935efa4376616c3c51e2d.reference = {
    __cReference: true,
    get value() { return WINDOWBORDER2____header_global_20752b85bb457439; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:658
export const DUKENUKEM____header_global_41b920842be6a394 = ((u32(((u32(2497) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_27da7e32274be2fcbd892c2a() {
  return __cxx_static_address_27da7e32274be2fcbd892c2a.reference || (__cxx_static_address_27da7e32274be2fcbd892c2a.reference = {
    __cReference: true,
    get value() { return DUKENUKEM____header_global_41b920842be6a394; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:659
export const THREEDEE____header_global_5e4d9b2406c9f809 = ((u32(((u32(2498) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e1718ea061fe43c1d4c7715a() {
  return __cxx_static_address_e1718ea061fe43c1d4c7715a.reference || (__cxx_static_address_e1718ea061fe43c1d4c7715a.reference = {
    __cReference: true,
    get value() { return THREEDEE____header_global_5e4d9b2406c9f809; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:660
export const INGAMEDUKETHREEDEE____header_global_c742df94bacb83a4 = ((u32(((u32(2499) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b958eff160e9336183cffbce() {
  return __cxx_static_address_b958eff160e9336183cffbce.reference || (__cxx_static_address_b958eff160e9336183cffbce.reference = {
    __cReference: true,
    get value() { return INGAMEDUKETHREEDEE____header_global_c742df94bacb83a4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:661
export const TENSCREEN____header_global_8adb837d59e11d1e = ((u32(((u32(2500) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_354eb5eeaf4916ac99870419() {
  return __cxx_static_address_354eb5eeaf4916ac99870419.reference || (__cxx_static_address_354eb5eeaf4916ac99870419.reference = {
    __cReference: true,
    get value() { return TENSCREEN____header_global_8adb837d59e11d1e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:662
export const PLUTOPAKSPRITE____header_global_3f0d7a6b7bdb98cd = ((u32(((u32(2501) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cb4a3759e8c5378ead25f97d() {
  return __cxx_static_address_cb4a3759e8c5378ead25f97d.reference || (__cxx_static_address_cb4a3759e8c5378ead25f97d.reference = {
    __cReference: true,
    get value() { return PLUTOPAKSPRITE____header_global_3f0d7a6b7bdb98cd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:663
export const DEVISTATOR____header_global_b15786fce4c0bd3f = ((u32(((u32(2510) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3e04ddcb2f4bd85d927eb9f2() {
  return __cxx_static_address_3e04ddcb2f4bd85d927eb9f2.reference || (__cxx_static_address_3e04ddcb2f4bd85d927eb9f2.reference = {
    __cReference: true,
    get value() { return DEVISTATOR____header_global_b15786fce4c0bd3f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:664
export const KNEE____header_global_9d629596ceed5559 = ((u32(((u32(2521) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6e194e7178a5debf091cd28d() {
  return __cxx_static_address_6e194e7178a5debf091cd28d.reference || (__cxx_static_address_6e194e7178a5debf091cd28d.reference = {
    __cReference: true,
    get value() { return KNEE____header_global_9d629596ceed5559; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:665
export const CROSSHAIR____header_global_563d3b2b83e7f0e5 = ((u32(((u32(2523) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8f367db05117fbb713aff620() {
  return __cxx_static_address_8f367db05117fbb713aff620.reference || (__cxx_static_address_8f367db05117fbb713aff620.reference = {
    __cReference: true,
    get value() { return CROSSHAIR____header_global_563d3b2b83e7f0e5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:666
export const FIRSTGUN____header_global_0987e6e803c2b10b = ((u32(((u32(2524) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d77b8c05481ed082bcec66ba() {
  return __cxx_static_address_d77b8c05481ed082bcec66ba.reference || (__cxx_static_address_d77b8c05481ed082bcec66ba.reference = {
    __cReference: true,
    get value() { return FIRSTGUN____header_global_0987e6e803c2b10b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:667
export const FIRSTGUNRELOAD____header_global_2280b391a83c4c32 = ((u32(((u32(2528) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7093ca210153a48e80d805f6() {
  return __cxx_static_address_7093ca210153a48e80d805f6.reference || (__cxx_static_address_7093ca210153a48e80d805f6.reference = {
    __cReference: true,
    get value() { return FIRSTGUNRELOAD____header_global_2280b391a83c4c32; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:671
export const RPGGUN____header_global_97cd0adee44d84b6 = ((u32(((u32(2544) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6d1b8b3564bc5a4fb620d2d6() {
  return __cxx_static_address_6d1b8b3564bc5a4fb620d2d6.reference || (__cxx_static_address_6d1b8b3564bc5a4fb620d2d6.reference = {
    __cReference: true,
    get value() { return RPGGUN____header_global_97cd0adee44d84b6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:672
export const FREEZE____header_global_c499d99d7de1f0dd = ((u32(((u32(2548) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_49762acd52da3192a915ec05() {
  return __cxx_static_address_49762acd52da3192a915ec05.reference || (__cxx_static_address_49762acd52da3192a915ec05.reference = {
    __cReference: true,
    get value() { return FREEZE____header_global_c499d99d7de1f0dd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:673
export const SHRINKER____header_global_c3e3564a402ed2b4 = ((u32(((u32(2556) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9e1a958034808f3d56f87d78() {
  return __cxx_static_address_9e1a958034808f3d56f87d78.reference || (__cxx_static_address_9e1a958034808f3d56f87d78.reference = {
    __cReference: true,
    get value() { return SHRINKER____header_global_c3e3564a402ed2b4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:674
export const HANDHOLDINGLASER____header_global_4d8e366c4b389cd7 = ((u32(((u32(2563) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_78e55404a82f71ec438b3963() {
  return __cxx_static_address_78e55404a82f71ec438b3963.reference || (__cxx_static_address_78e55404a82f71ec438b3963.reference = {
    __cReference: true,
    get value() { return HANDHOLDINGLASER____header_global_4d8e366c4b389cd7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:675
export const TRIPBOMB____header_global_336fbd019c37b6dc = ((u32(((u32(2566) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5010f6e52a96c0dc55712980() {
  return __cxx_static_address_5010f6e52a96c0dc55712980.reference || (__cxx_static_address_5010f6e52a96c0dc55712980.reference = {
    __cReference: true,
    get value() { return TRIPBOMB____header_global_336fbd019c37b6dc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:677
export const HANDHOLDINGACCESS____header_global_22d4ee0ca974f47c = ((u32(((u32(2568) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_87f8fd650c81f522bab14cce() {
  return __cxx_static_address_87f8fd650c81f522bab14cce.reference || (__cxx_static_address_87f8fd650c81f522bab14cce.reference = {
    __cReference: true,
    get value() { return HANDHOLDINGACCESS____header_global_22d4ee0ca974f47c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:678
export const HANDREMOTE____header_global_89d3d71b614e4737 = ((u32(((u32(2570) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_627aeb802df6a4d37bb2ecfb() {
  return __cxx_static_address_627aeb802df6a4d37bb2ecfb.reference || (__cxx_static_address_627aeb802df6a4d37bb2ecfb.reference = {
    __cReference: true,
    get value() { return HANDREMOTE____header_global_89d3d71b614e4737; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:679
export const HANDTHROW____header_global_4114b856838236f5 = ((u32(((u32(2573) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6a8a368ba59b98dba124fe15() {
  return __cxx_static_address_6a8a368ba59b98dba124fe15.reference || (__cxx_static_address_6a8a368ba59b98dba124fe15.reference = {
    __cReference: true,
    get value() { return HANDTHROW____header_global_4114b856838236f5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:680
export const TIP____header_global_3f46558901ed257a = ((u32(((u32(2576) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8521b7e4c019c82e5b95deea() {
  return __cxx_static_address_8521b7e4c019c82e5b95deea.reference || (__cxx_static_address_8521b7e4c019c82e5b95deea.reference = {
    __cReference: true,
    get value() { return TIP____header_global_3f46558901ed257a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:681
export const SCUBAMASK____header_global_57c142d59d1321bf = ((u32(((u32(2581) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f64e072e98788caa61dbdb50() {
  return __cxx_static_address_f64e072e98788caa61dbdb50.reference || (__cxx_static_address_f64e072e98788caa61dbdb50.reference = {
    __cReference: true,
    get value() { return SCUBAMASK____header_global_57c142d59d1321bf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:683
export const SHOTSPARK1____header_global_dedc995ecf0d289f = ((u32(((u32(2595) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d8ed2da08477db551a74499f() {
  return __cxx_static_address_d8ed2da08477db551a74499f.reference || (__cxx_static_address_d8ed2da08477db551a74499f.reference = {
    __cReference: true,
    get value() { return SHOTSPARK1____header_global_dedc995ecf0d289f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:685
export const LASERSITE____header_global_5270a9d72e1e5fac = ((u32(((u32(2612) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ebb28238dbe923ab4f88c822() {
  return __cxx_static_address_ebb28238dbe923ab4f88c822.reference || (__cxx_static_address_ebb28238dbe923ab4f88c822.reference = {
    __cReference: true,
    get value() { return LASERSITE____header_global_5270a9d72e1e5fac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:686
export const SHOTGUN____header_global_e6b2acead1aec60a = ((u32(((u32(2613) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a864a6a6f6b8d7ce4e9f8cba() {
  return __cxx_static_address_a864a6a6f6b8d7ce4e9f8cba.reference || (__cxx_static_address_a864a6a6f6b8d7ce4e9f8cba.reference = {
    __cReference: true,
    get value() { return SHOTGUN____header_global_e6b2acead1aec60a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:687
export const BOSS1____header_global_f9a01ced695a6232 = ((u32(((u32(2630) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9ac528ba576df22526459780() {
  return __cxx_static_address_9ac528ba576df22526459780.reference || (__cxx_static_address_9ac528ba576df22526459780.reference = {
    __cReference: true,
    get value() { return BOSS1____header_global_f9a01ced695a6232; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:688
export const BOSS1STAYPUT____header_global_28eadfdcd2d43115 = ((u32(((u32(2631) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9ab0815a3521d2ec52300e3b() {
  return __cxx_static_address_9ab0815a3521d2ec52300e3b.reference || (__cxx_static_address_9ab0815a3521d2ec52300e3b.reference = {
    __cReference: true,
    get value() { return BOSS1STAYPUT____header_global_28eadfdcd2d43115; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:689
export const BOSS1SHOOT____header_global_338d6a06de6743f2 = ((u32(((u32(2660) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fdfeaa8a954fba772af79e55() {
  return __cxx_static_address_fdfeaa8a954fba772af79e55.reference || (__cxx_static_address_fdfeaa8a954fba772af79e55.reference = {
    __cReference: true,
    get value() { return BOSS1SHOOT____header_global_338d6a06de6743f2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:690
export const BOSS1LOB____header_global_8729d23102b1edd7 = ((u32(((u32(2670) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0df5751f5719bcb4826341c6() {
  return __cxx_static_address_0df5751f5719bcb4826341c6.reference || (__cxx_static_address_0df5751f5719bcb4826341c6.reference = {
    __cReference: true,
    get value() { return BOSS1LOB____header_global_8729d23102b1edd7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:691
export const BOSSTOP____header_global_88d7221f71cb11a9 = ((u32(((u32(2696) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5cfde495d6f83016b4bb4f92() {
  return __cxx_static_address_5cfde495d6f83016b4bb4f92.reference || (__cxx_static_address_5cfde495d6f83016b4bb4f92.reference = {
    __cReference: true,
    get value() { return BOSSTOP____header_global_88d7221f71cb11a9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:692
export const BOSS2____header_global_49d0f6f221186e31 = ((u32(((u32(2710) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9141503846c169b49f193f8d() {
  return __cxx_static_address_9141503846c169b49f193f8d.reference || (__cxx_static_address_9141503846c169b49f193f8d.reference = {
    __cReference: true,
    get value() { return BOSS2____header_global_49d0f6f221186e31; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:693
export const BOSS3____header_global_f7f3df83b58abf98 = ((u32(((u32(2760) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_558e0779abdfa435183079a6() {
  return __cxx_static_address_558e0779abdfa435183079a6.reference || (__cxx_static_address_558e0779abdfa435183079a6.reference = {
    __cReference: true,
    get value() { return BOSS3____header_global_f7f3df83b58abf98; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:694
export const SPINNINGNUKEICON____header_global_2ad19879ee739b54 = ((u32(((u32(2813) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c6186b068f3fa424954e48b0() {
  return __cxx_static_address_c6186b068f3fa424954e48b0.reference || (__cxx_static_address_c6186b068f3fa424954e48b0.reference = {
    __cReference: true,
    get value() { return SPINNINGNUKEICON____header_global_2ad19879ee739b54; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:695
export const SMALLFNTCURSOR____header_global_b08fcc05559402c5 = ((u32(((u32(2821) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_056f8325a6c90803f7f441d4() {
  return __cxx_static_address_056f8325a6c90803f7f441d4.reference || (__cxx_static_address_056f8325a6c90803f7f441d4.reference = {
    __cReference: true,
    get value() { return SMALLFNTCURSOR____header_global_b08fcc05559402c5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:696
export const STARTALPHANUM____header_global_24a82f8e771742e6 = ((u32(((u32(2822) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_028506febc089d86168b420a() {
  return __cxx_static_address_028506febc089d86168b420a.reference || (__cxx_static_address_028506febc089d86168b420a.reference = {
    __cReference: true,
    get value() { return STARTALPHANUM____header_global_24a82f8e771742e6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:697
export const ENDALPHANUM____header_global_69eb4c406caa0ff7 = ((u32(((u32(2915) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6709e9dd01f84804b96930cc() {
  return __cxx_static_address_6709e9dd01f84804b96930cc.reference || (__cxx_static_address_6709e9dd01f84804b96930cc.reference = {
    __cReference: true,
    get value() { return ENDALPHANUM____header_global_69eb4c406caa0ff7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:698
export const BIGALPHANUM____header_global_f8acc2a7f6a96ad6 = ((u32(((u32(2940) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1c3eb5b3263afc953d5c3e5c() {
  return __cxx_static_address_1c3eb5b3263afc953d5c3e5c.reference || (__cxx_static_address_1c3eb5b3263afc953d5c3e5c.reference = {
    __cReference: true,
    get value() { return BIGALPHANUM____header_global_f8acc2a7f6a96ad6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:699
export const BIGPERIOD____header_global_0ff4fa9aa20ab58d = ((u32(((u32(3002) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_70f0ff50d4f6894005d01ded() {
  return __cxx_static_address_70f0ff50d4f6894005d01ded.reference || (__cxx_static_address_70f0ff50d4f6894005d01ded.reference = {
    __cReference: true,
    get value() { return BIGPERIOD____header_global_0ff4fa9aa20ab58d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:700
export const BIGCOMMA____header_global_be32715f66181747 = ((u32(((u32(3003) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_73058a8fa0d033a1446800c8() {
  return __cxx_static_address_73058a8fa0d033a1446800c8.reference || (__cxx_static_address_73058a8fa0d033a1446800c8.reference = {
    __cReference: true,
    get value() { return BIGCOMMA____header_global_be32715f66181747; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:701
export const BIGX____header_global_269df37931f3a9ae = ((u32(((u32(3004) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_47247e7d0c4c38e84540e324() {
  return __cxx_static_address_47247e7d0c4c38e84540e324.reference || (__cxx_static_address_47247e7d0c4c38e84540e324.reference = {
    __cReference: true,
    get value() { return BIGX____header_global_269df37931f3a9ae; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:702
export const BIGQ____header_global_99efd1a17ce1ff2c = ((u32(((u32(3005) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5bf34bfda208b06bbe813666() {
  return __cxx_static_address_5bf34bfda208b06bbe813666.reference || (__cxx_static_address_5bf34bfda208b06bbe813666.reference = {
    __cReference: true,
    get value() { return BIGQ____header_global_99efd1a17ce1ff2c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:703
export const BIGSEMI____header_global_df3b448601fa64f8 = ((u32(((u32(3006) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a20350d773c3cc83f03df152() {
  return __cxx_static_address_a20350d773c3cc83f03df152.reference || (__cxx_static_address_a20350d773c3cc83f03df152.reference = {
    __cReference: true,
    get value() { return BIGSEMI____header_global_df3b448601fa64f8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:704
export const BIGCOLIN____header_global_6cd47a0ae94c1495 = ((u32(((u32(3007) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c45cbcab1b28b7f63e87fd83() {
  return __cxx_static_address_c45cbcab1b28b7f63e87fd83.reference || (__cxx_static_address_c45cbcab1b28b7f63e87fd83.reference = {
    __cReference: true,
    get value() { return BIGCOLIN____header_global_6cd47a0ae94c1495; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:705
export const THREEBYFIVE____header_global_bcf2240e08b34890 = ((u32(((u32(3010) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_58d38c354d57c5aaa94dc256() {
  return __cxx_static_address_58d38c354d57c5aaa94dc256.reference || (__cxx_static_address_58d38c354d57c5aaa94dc256.reference = {
    __cReference: true,
    get value() { return THREEBYFIVE____header_global_bcf2240e08b34890; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:706
export const BIGAPPOS____header_global_4cd891f3e36b779d = ((u32(((u32(3022) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b3191b6a85adda6a22c011af() {
  return __cxx_static_address_b3191b6a85adda6a22c011af.reference || (__cxx_static_address_b3191b6a85adda6a22c011af.reference = {
    __cReference: true,
    get value() { return BIGAPPOS____header_global_4cd891f3e36b779d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:707
export const MINIFONT____header_global_9f2b0de758221d55 = ((u32(((u32(3072) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_891aa92df46b51ebb7acc9c7() {
  return __cxx_static_address_891aa92df46b51ebb7acc9c7.reference || (__cxx_static_address_891aa92df46b51ebb7acc9c7.reference = {
    __cReference: true,
    get value() { return MINIFONT____header_global_9f2b0de758221d55; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:711
export const BONUSSCREEN____header_global_d8397756d52ec79c = ((u32(((u32(3240) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_85ccf27b4a4e3b4a4aa9f743() {
  return __cxx_static_address_85ccf27b4a4e3b4a4aa9f743.reference || (__cxx_static_address_85ccf27b4a4e3b4a4aa9f743.reference = {
    __cReference: true,
    get value() { return BONUSSCREEN____header_global_d8397756d52ec79c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:712
export const VIEWBORDER____header_global_9decf9e2a7b24fcb = ((u32(((u32(3250) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_93c235d6d52ff4017381b913() {
  return __cxx_static_address_93c235d6d52ff4017381b913.reference || (__cxx_static_address_93c235d6d52ff4017381b913.reference = {
    __cReference: true,
    get value() { return VIEWBORDER____header_global_9decf9e2a7b24fcb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:713
export const VICTORY1____header_global_ffec02d344185fba = ((u32(((u32(3260) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e7453c8587c9860a2310a7a6() {
  return __cxx_static_address_e7453c8587c9860a2310a7a6.reference || (__cxx_static_address_e7453c8587c9860a2310a7a6.reference = {
    __cReference: true,
    get value() { return VICTORY1____header_global_ffec02d344185fba; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:714
export const ORDERING____header_global_d0dc0be47a7b0441 = ((u32(((u32(3270) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ccd93ff91826ce7e21cae433() {
  return __cxx_static_address_ccd93ff91826ce7e21cae433.reference || (__cxx_static_address_ccd93ff91826ce7e21cae433.reference = {
    __cReference: true,
    get value() { return ORDERING____header_global_d0dc0be47a7b0441; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:715
export const TEXTSTORY____header_global_649ed148b1c3545d = ((u32(((u32(3280) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5642f6490c76990bbd2ba509() {
  return __cxx_static_address_5642f6490c76990bbd2ba509.reference || (__cxx_static_address_5642f6490c76990bbd2ba509.reference = {
    __cReference: true,
    get value() { return TEXTSTORY____header_global_649ed148b1c3545d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:716
export const LOADSCREEN____header_global_688f98af17605ef4 = ((u32(((u32(3281) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e4000b1ebe8c5240b5e72139() {
  return __cxx_static_address_e4000b1ebe8c5240b5e72139.reference || (__cxx_static_address_e4000b1ebe8c5240b5e72139.reference = {
    __cReference: true,
    get value() { return LOADSCREEN____header_global_688f98af17605ef4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:717
export const BORNTOBEWILDSCREEN____header_global_4bbfd6c9db01ef37 = ((u32(((u32(3370) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0f0dbf308ef0d13a021fe80d() {
  return __cxx_static_address_0f0dbf308ef0d13a021fe80d.reference || (__cxx_static_address_0f0dbf308ef0d13a021fe80d.reference = {
    __cReference: true,
    get value() { return BORNTOBEWILDSCREEN____header_global_4bbfd6c9db01ef37; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:718
export const BLIMP____header_global_c89f7671ff8ae206 = ((u32(((u32(3400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1f71c4637ce53e0ef211b3e6() {
  return __cxx_static_address_1f71c4637ce53e0ef211b3e6.reference || (__cxx_static_address_1f71c4637ce53e0ef211b3e6.reference = {
    __cReference: true,
    get value() { return BLIMP____header_global_c89f7671ff8ae206; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:722
export const PANNEL3____header_global_cb8054fb83526295 = ((u32(((u32(4099) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_658ce5d3b040cbde02042bec() {
  return __cxx_static_address_658ce5d3b040cbde02042bec.reference || (__cxx_static_address_658ce5d3b040cbde02042bec.reference = {
    __cReference: true,
    get value() { return PANNEL3____header_global_cb8054fb83526295; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:723
export const SCREENBREAK14____header_global_562bfce5533d0aaf = ((u32(((u32(4120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b40fd5648e27afaedb609562() {
  return __cxx_static_address_b40fd5648e27afaedb609562.reference || (__cxx_static_address_b40fd5648e27afaedb609562.reference = {
    __cReference: true,
    get value() { return SCREENBREAK14____header_global_562bfce5533d0aaf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:724
export const SCREENBREAK15____header_global_36e1f0de9d141a56 = ((u32(((u32(4123) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_610cccb258a06c7034639b8f() {
  return __cxx_static_address_610cccb258a06c7034639b8f.reference || (__cxx_static_address_610cccb258a06c7034639b8f.reference = {
    __cReference: true,
    get value() { return SCREENBREAK15____header_global_36e1f0de9d141a56; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:725
export const SCREENBREAK19____header_global_db04924aabf5d27c = ((u32(((u32(4125) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_26630a366d03774cf07eca9f() {
  return __cxx_static_address_26630a366d03774cf07eca9f.reference || (__cxx_static_address_26630a366d03774cf07eca9f.reference = {
    __cReference: true,
    get value() { return SCREENBREAK19____header_global_db04924aabf5d27c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:726
export const SCREENBREAK16____header_global_76cab3ea0086f520 = ((u32(((u32(4127) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_681bd2f03fe329b392b0ad77() {
  return __cxx_static_address_681bd2f03fe329b392b0ad77.reference || (__cxx_static_address_681bd2f03fe329b392b0ad77.reference = {
    __cReference: true,
    get value() { return SCREENBREAK16____header_global_76cab3ea0086f520; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:727
export const SCREENBREAK17____header_global_eb79025281f04605 = ((u32(((u32(4128) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0e03b4fdf7b2480ecfbb6b50() {
  return __cxx_static_address_0e03b4fdf7b2480ecfbb6b50.reference || (__cxx_static_address_0e03b4fdf7b2480ecfbb6b50.reference = {
    __cReference: true,
    get value() { return SCREENBREAK17____header_global_eb79025281f04605; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:728
export const SCREENBREAK18____header_global_32bf93182da69f77 = ((u32(((u32(4129) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3266c4b821cc2d487635d46c() {
  return __cxx_static_address_3266c4b821cc2d487635d46c.reference || (__cxx_static_address_3266c4b821cc2d487635d46c.reference = {
    __cReference: true,
    get value() { return SCREENBREAK18____header_global_32bf93182da69f77; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:729
export const W_TECHWALL11____header_global_9d26302e6d53d2ab = ((u32(((u32(4130) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7d09630e2a87f4c711f76bf0() {
  return __cxx_static_address_7d09630e2a87f4c711f76bf0.reference || (__cxx_static_address_7d09630e2a87f4c711f76bf0.reference = {
    __cReference: true,
    get value() { return W_TECHWALL11____header_global_9d26302e6d53d2ab; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:730
export const W_TECHWALL12____header_global_6b58dceffc6687af = ((u32(((u32(4131) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4c3a3e14aff639bd67066aab() {
  return __cxx_static_address_4c3a3e14aff639bd67066aab.reference || (__cxx_static_address_4c3a3e14aff639bd67066aab.reference = {
    __cReference: true,
    get value() { return W_TECHWALL12____header_global_6b58dceffc6687af; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:731
export const W_TECHWALL13____header_global_703e7d8ae8a4414f = ((u32(((u32(4132) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dcf2c51a68f8edfc73329453() {
  return __cxx_static_address_dcf2c51a68f8edfc73329453.reference || (__cxx_static_address_dcf2c51a68f8edfc73329453.reference = {
    __cReference: true,
    get value() { return W_TECHWALL13____header_global_703e7d8ae8a4414f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:732
export const W_TECHWALL14____header_global_d1d81b53a16fc34a = ((u32(((u32(4133) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a1cb683f38c4467feeaa5a4b() {
  return __cxx_static_address_a1cb683f38c4467feeaa5a4b.reference || (__cxx_static_address_a1cb683f38c4467feeaa5a4b.reference = {
    __cReference: true,
    get value() { return W_TECHWALL14____header_global_d1d81b53a16fc34a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:733
export const W_TECHWALL5____header_global_85b565bef508cef9 = ((u32(((u32(4134) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_23df42195867a238c7bc294c() {
  return __cxx_static_address_23df42195867a238c7bc294c.reference || (__cxx_static_address_23df42195867a238c7bc294c.reference = {
    __cReference: true,
    get value() { return W_TECHWALL5____header_global_85b565bef508cef9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:734
export const W_TECHWALL6____header_global_924230b4dfb01d31 = ((u32(((u32(4136) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_48f6a6a828658092e7a55fb7() {
  return __cxx_static_address_48f6a6a828658092e7a55fb7.reference || (__cxx_static_address_48f6a6a828658092e7a55fb7.reference = {
    __cReference: true,
    get value() { return W_TECHWALL6____header_global_924230b4dfb01d31; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:735
export const W_TECHWALL7____header_global_a4fc73d1abcbf30d = ((u32(((u32(4138) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_02a8b25ab2cfdd65bb6196c9() {
  return __cxx_static_address_02a8b25ab2cfdd65bb6196c9.reference || (__cxx_static_address_02a8b25ab2cfdd65bb6196c9.reference = {
    __cReference: true,
    get value() { return W_TECHWALL7____header_global_a4fc73d1abcbf30d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:736
export const W_TECHWALL8____header_global_679427361c22dd57 = ((u32(((u32(4140) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3f9fbfe666b06a6a0a7c598b() {
  return __cxx_static_address_3f9fbfe666b06a6a0a7c598b.reference || (__cxx_static_address_3f9fbfe666b06a6a0a7c598b.reference = {
    __cReference: true,
    get value() { return W_TECHWALL8____header_global_679427361c22dd57; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:737
export const W_TECHWALL9____header_global_c33eb4f3e1a10dea = ((u32(((u32(4142) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ea9f94200389ecc8440adeeb() {
  return __cxx_static_address_ea9f94200389ecc8440adeeb.reference || (__cxx_static_address_ea9f94200389ecc8440adeeb.reference = {
    __cReference: true,
    get value() { return W_TECHWALL9____header_global_c33eb4f3e1a10dea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:738
export const BPANNEL3____header_global_cfd35b27348330e3 = ((u32(((u32(4100) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f7f30f5c4d019e87c9067649() {
  return __cxx_static_address_f7f30f5c4d019e87c9067649.reference || (__cxx_static_address_f7f30f5c4d019e87c9067649.reference = {
    __cReference: true,
    get value() { return BPANNEL3____header_global_cfd35b27348330e3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:739
export const W_HITTECHWALL16____header_global_bb28823fc6093ab2 = ((u32(((u32(4144) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e3b545374cad28d696cc247a() {
  return __cxx_static_address_e3b545374cad28d696cc247a.reference || (__cxx_static_address_e3b545374cad28d696cc247a.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL16____header_global_bb28823fc6093ab2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:740
export const W_HITTECHWALL10____header_global_9ac8c05c4e0df046 = ((u32(((u32(4145) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_27c1bebf2a9d9dc2aa35e1d7() {
  return __cxx_static_address_27c1bebf2a9d9dc2aa35e1d7.reference || (__cxx_static_address_27c1bebf2a9d9dc2aa35e1d7.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL10____header_global_9ac8c05c4e0df046; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:741
export const W_HITTECHWALL15____header_global_69aba5703ba0cbfb = ((u32(((u32(4147) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_258fdda93f29279c7792c0fc() {
  return __cxx_static_address_258fdda93f29279c7792c0fc.reference || (__cxx_static_address_258fdda93f29279c7792c0fc.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL15____header_global_69aba5703ba0cbfb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:742
export const W_MILKSHELF____header_global_2153ca7757bf8ff9 = ((u32(((u32(4181) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c7604db5377ba5f6e9f67669() {
  return __cxx_static_address_c7604db5377ba5f6e9f67669.reference || (__cxx_static_address_c7604db5377ba5f6e9f67669.reference = {
    __cReference: true,
    get value() { return W_MILKSHELF____header_global_2153ca7757bf8ff9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:743
export const W_MILKSHELFBROKE____header_global_6ed21e1376acb3e6 = ((u32(((u32(4203) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7ef7be2b043295d45a389ea4() {
  return __cxx_static_address_7ef7be2b043295d45a389ea4.reference || (__cxx_static_address_7ef7be2b043295d45a389ea4.reference = {
    __cReference: true,
    get value() { return W_MILKSHELFBROKE____header_global_6ed21e1376acb3e6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:744
export const PURPLELAVA____header_global_863586957ef6c9f8 = ((u32(((u32(4240) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_933c282edf78c8a153c8dcce() {
  return __cxx_static_address_933c282edf78c8a153c8dcce.reference || (__cxx_static_address_933c282edf78c8a153c8dcce.reference = {
    __cReference: true,
    get value() { return PURPLELAVA____header_global_863586957ef6c9f8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:745
export const TARGET____header_global_bd85c0e0fd621a38 = ((u32(((u32(4359) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4af21beb4f2b2a41b0e6b08f() {
  return __cxx_static_address_4af21beb4f2b2a41b0e6b08f.reference || (__cxx_static_address_4af21beb4f2b2a41b0e6b08f.reference = {
    __cReference: true,
    get value() { return TARGET____header_global_bd85c0e0fd621a38; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:746
export const DUCK____header_global_52c27978d6f0d258 = ((u32(((u32(4361) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dbcc9a2d735db20edf83b6a1() {
  return __cxx_static_address_dbcc9a2d735db20edf83b6a1.reference || (__cxx_static_address_dbcc9a2d735db20edf83b6a1.reference = {
    __cReference: true,
    get value() { return DUCK____header_global_52c27978d6f0d258; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:748
export const DOORTILE23____header_global_7ed40c82db1fb82d = ((u32(((u32(4391) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e9a89f5aa47fe65723e79e5b() {
  return __cxx_static_address_e9a89f5aa47fe65723e79e5b.reference || (__cxx_static_address_e9a89f5aa47fe65723e79e5b.reference = {
    __cReference: true,
    get value() { return DOORTILE23____header_global_7ed40c82db1fb82d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:749
export const SPEAKER____header_global_5a261074dde48119 = ((u32(((u32(4397) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9e5318883afe7183e868e6f1() {
  return __cxx_static_address_9e5318883afe7183e868e6f1.reference || (__cxx_static_address_9e5318883afe7183e868e6f1.reference = {
    __cReference: true,
    get value() { return SPEAKER____header_global_5a261074dde48119; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:752
export const TRIPODCAMERA____header_global_11ecd29a501212bb = ((u32(((u32(4444) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_32763da88766c16f9ccc7894() {
  return __cxx_static_address_32763da88766c16f9ccc7894.reference || (__cxx_static_address_32763da88766c16f9ccc7894.reference = {
    __cReference: true,
    get value() { return TRIPODCAMERA____header_global_11ecd29a501212bb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:754
export const GENERICPOLE2____header_global_2b1c4f42c462b8ce = ((u32(((u32(4465) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bad875716a1918aec31037ff() {
  return __cxx_static_address_bad875716a1918aec31037ff.reference || (__cxx_static_address_bad875716a1918aec31037ff.reference = {
    __cReference: true,
    get value() { return GENERICPOLE2____header_global_2b1c4f42c462b8ce; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:755
export const XXXSTACY____header_global_280527d95dc742b7 = ((u32(((u32(4470) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cacb17614bd8bb7143b8206b() {
  return __cxx_static_address_cacb17614bd8bb7143b8206b.reference || (__cxx_static_address_cacb17614bd8bb7143b8206b.reference = {
    __cReference: true,
    get value() { return XXXSTACY____header_global_280527d95dc742b7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:756
export const LETTER____header_global_2dec70866bee1989 = ((u32(((u32(4502) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0d9917b690fc9bd45224d471() {
  return __cxx_static_address_0d9917b690fc9bd45224d471.reference || (__cxx_static_address_0d9917b690fc9bd45224d471.reference = {
    __cReference: true,
    get value() { return LETTER____header_global_2dec70866bee1989; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:757
export const SIDEBOLT1____header_global_2f4f75eb7835a973 = ((u32(((u32(4525) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5f26a1a7b6351ebb94ff68fe() {
  return __cxx_static_address_5f26a1a7b6351ebb94ff68fe.reference || (__cxx_static_address_5f26a1a7b6351ebb94ff68fe.reference = {
    __cReference: true,
    get value() { return SIDEBOLT1____header_global_2f4f75eb7835a973; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:759
export const TAMPON____header_global_a7ea7f038f56b8f6 = ((u32(((u32(4557) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dffc8c90c276e625df02aa4c() {
  return __cxx_static_address_dffc8c90c276e625df02aa4c.reference || (__cxx_static_address_dffc8c90c276e625df02aa4c.reference = {
    __cReference: true,
    get value() { return TAMPON____header_global_a7ea7f038f56b8f6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:760
export const CANWITHSOMETHING2____header_global_34b390d6e67ee584 = ((u32(((u32(4580) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_15358e129c697efa7e5fd9ec() {
  return __cxx_static_address_15358e129c697efa7e5fd9ec.reference || (__cxx_static_address_15358e129c697efa7e5fd9ec.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING2____header_global_34b390d6e67ee584; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:761
export const CANWITHSOMETHING3____header_global_3a9f43ad3be61a38 = ((u32(((u32(4581) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e8490a6caf5b24007ad96827() {
  return __cxx_static_address_e8490a6caf5b24007ad96827.reference || (__cxx_static_address_e8490a6caf5b24007ad96827.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING3____header_global_3a9f43ad3be61a38; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:762
export const CANWITHSOMETHING4____header_global_a2acd19400330127 = ((u32(((u32(4582) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4293eb244a7fa7977b2feab2() {
  return __cxx_static_address_4293eb244a7fa7977b2feab2.reference || (__cxx_static_address_4293eb244a7fa7977b2feab2.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING4____header_global_a2acd19400330127; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:765
export const NEWBEAST____header_global_e367561f47c17cf0 = ((u32(((u32(4610) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e80e70a00d45c19c78a9fd53() {
  return __cxx_static_address_e80e70a00d45c19c78a9fd53.reference || (__cxx_static_address_e80e70a00d45c19c78a9fd53.reference = {
    __cReference: true,
    get value() { return NEWBEAST____header_global_e367561f47c17cf0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:766
export const NEWBEASTSTAYPUT____header_global_5244bc0e994db253 = ((u32(((u32(4611) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_79b6ae060e9bbd5b2543d2e6() {
  return __cxx_static_address_79b6ae060e9bbd5b2543d2e6.reference || (__cxx_static_address_79b6ae060e9bbd5b2543d2e6.reference = {
    __cReference: true,
    get value() { return NEWBEASTSTAYPUT____header_global_5244bc0e994db253; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:767
export const BOSS4____header_global_eb35045c86566e39 = ((u32(((u32(4740) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c8ff3537caadbdbb4da7ab6e() {
  return __cxx_static_address_c8ff3537caadbdbb4da7ab6e.reference || (__cxx_static_address_c8ff3537caadbdbb4da7ab6e.reference = {
    __cReference: true,
    get value() { return BOSS4____header_global_eb35045c86566e39; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:768
export const BOSS4STAYPUT____header_global_a39ebc938955245e = ((u32(((u32(4741) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_05e6b2bfe76cf035daf61389() {
  return __cxx_static_address_05e6b2bfe76cf035daf61389.reference || (__cxx_static_address_05e6b2bfe76cf035daf61389.reference = {
    __cReference: true,
    get value() { return BOSS4STAYPUT____header_global_a39ebc938955245e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:770
export const TOUGHGAL____header_global_fa61e1b00903e5df = ((u32(((u32(4866) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_914dede16af8b321b6efbd8c() {
  return __cxx_static_address_914dede16af8b321b6efbd8c.reference || (__cxx_static_address_914dede16af8b321b6efbd8c.reference = {
    __cReference: true,
    get value() { return TOUGHGAL____header_global_fa61e1b00903e5df; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:773
export const WOMAN____header_global_f6e40f9dc2a9b217 = ((u32(((u32(4874) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_458493a01bf605ebafff8158() {
  return __cxx_static_address_458493a01bf605ebafff8158.reference || (__cxx_static_address_458493a01bf605ebafff8158.reference = {
    __cReference: true,
    get value() { return WOMAN____header_global_f6e40f9dc2a9b217; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:774
export const NATURALLIGHTNING____header_global_597ff5cf69109d14 = ((u32(((u32(4890) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eb477afc6176771b64dc65e0() {
  return __cxx_static_address_eb477afc6176771b64dc65e0.reference || (__cxx_static_address_eb477afc6176771b64dc65e0.reference = {
    __cReference: true,
    get value() { return NATURALLIGHTNING____header_global_597ff5cf69109d14; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:775
export const WEATHERWARN____header_global_7cb776dd75e02596 = ((u32(((u32(4893) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_429481b3ddb6382a122dca76() {
  return __cxx_static_address_429481b3ddb6382a122dca76.reference || (__cxx_static_address_429481b3ddb6382a122dca76.reference = {
    __cReference: true,
    get value() { return WEATHERWARN____header_global_7cb776dd75e02596; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:776
export const DUKETAG____header_global_c37f3e2a51ac18e0 = ((u32(((u32(4900) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_321723a1843dc1b14c328858() {
  return __cxx_static_address_321723a1843dc1b14c328858.reference || (__cxx_static_address_321723a1843dc1b14c328858.reference = {
    __cReference: true,
    get value() { return DUKETAG____header_global_c37f3e2a51ac18e0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:777
export const SIGN1____header_global_25caf825da999b57 = ((u32(((u32(4909) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_755bfcca3dcbc6f1fe1985b1() {
  return __cxx_static_address_755bfcca3dcbc6f1fe1985b1.reference || (__cxx_static_address_755bfcca3dcbc6f1fe1985b1.reference = {
    __cReference: true,
    get value() { return SIGN1____header_global_25caf825da999b57; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:778
export const SIGN2____header_global_6d8eff1134f4ccf3 = ((u32(((u32(4912) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d3395d9e36f02c47f3305791() {
  return __cxx_static_address_d3395d9e36f02c47f3305791.reference || (__cxx_static_address_d3395d9e36f02c47f3305791.reference = {
    __cReference: true,
    get value() { return SIGN2____header_global_6d8eff1134f4ccf3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:779
export const JURYGUY____header_global_a73b24f20d05a47c = ((u32(((u32(4943) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_019704da89bb794a74361e81() {
  return __cxx_static_address_019704da89bb794a74361e81.reference || (__cxx_static_address_019704da89bb794a74361e81.reference = {
    __cReference: true,
    get value() { return JURYGUY____header_global_a73b24f20d05a47c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:780
export const WIDESCREENSTATUSBAR____header_global_ad2548e73b14abbc = ((u32(((u32(5120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c7972e875bc55e155815d641() {
  return __cxx_static_address_c7972e875bc55e155815d641.reference || (__cxx_static_address_c7972e875bc55e155815d641.reference = {
    __cReference: true,
    get value() { return WIDESCREENSTATUSBAR____header_global_ad2548e73b14abbc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:781
export const RPGGUNWIDE____header_global_d9334602a7a28c2d = ((u32(((u32(5121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ef719a20d2f9bcf4a0b2e18a() {
  return __cxx_static_address_ef719a20d2f9bcf4a0b2e18a.reference || (__cxx_static_address_ef719a20d2f9bcf4a0b2e18a.reference = {
    __cReference: true,
    get value() { return RPGGUNWIDE____header_global_d9334602a7a28c2d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:782
export const FIRSTGUNRELOADWIDE____header_global_e8556437ed2d194e = ((u32(((u32(5122) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7c1b450f5affd8f9d595e44b() {
  return __cxx_static_address_7c1b450f5affd8f9d595e44b.reference || (__cxx_static_address_7c1b450f5affd8f9d595e44b.reference = {
    __cReference: true,
    get value() { return FIRSTGUNRELOADWIDE____header_global_e8556437ed2d194e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:783
export const FREEZEWIDE____header_global_60192622d47f8dfa = ((u32(((u32(5123) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c511505d31272ee225f3160f() {
  return __cxx_static_address_c511505d31272ee225f3160f.reference || (__cxx_static_address_c511505d31272ee225f3160f.reference = {
    __cReference: true,
    get value() { return FREEZEWIDE____header_global_60192622d47f8dfa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:784
export const FREEZEFIREWIDE____header_global_45df68f99ac99690 = ((u32(((u32(5124) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_951671eea7f6a25ac2c63ea9() {
  return __cxx_static_address_951671eea7f6a25ac2c63ea9.reference || (__cxx_static_address_951671eea7f6a25ac2c63ea9.reference = {
    __cReference: true,
    get value() { return FREEZEFIREWIDE____header_global_45df68f99ac99690; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:785
export const SHRINKERWIDE____header_global_428f4a525e852c9f = ((u32(((u32(5127) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e96dcf80c603f45b6b9faa52() {
  return __cxx_static_address_e96dcf80c603f45b6b9faa52.reference || (__cxx_static_address_e96dcf80c603f45b6b9faa52.reference = {
    __cReference: true,
    get value() { return SHRINKERWIDE____header_global_428f4a525e852c9f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:786
export const CRACKKNUCKLESWIDE____header_global_fecccdf07d56cfa6 = ((u32(((u32(5129) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5265e152cdc2ee731cc05982() {
  return __cxx_static_address_5265e152cdc2ee731cc05982.reference || (__cxx_static_address_5265e152cdc2ee731cc05982.reference = {
    __cReference: true,
    get value() { return CRACKKNUCKLESWIDE____header_global_fecccdf07d56cfa6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:787
export const FLAMETHROWERSPRITE____header_global_60da80d0c9eb9cc4 = ((u32(((u32(5134) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_491b932d973c563aa9f97149() {
  return __cxx_static_address_491b932d973c563aa9f97149.reference || (__cxx_static_address_491b932d973c563aa9f97149.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERSPRITE____header_global_60da80d0c9eb9cc4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:788
export const FLAMETHROWERAMMO____header_global_28d0019f16bbd43d = ((u32(((u32(5135) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b44679c375621d8d3fd235ad() {
  return __cxx_static_address_b44679c375621d8d3fd235ad.reference || (__cxx_static_address_b44679c375621d8d3fd235ad.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERAMMO____header_global_28d0019f16bbd43d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:789
export const FLAMETHROWER____header_global_9e29cfb836198536 = ((u32(((u32(5138) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9b6e61217e39cd04588e57f5() {
  return __cxx_static_address_9b6e61217e39cd04588e57f5.reference || (__cxx_static_address_9b6e61217e39cd04588e57f5.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER____header_global_9e29cfb836198536; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:790
export const FLAMETHROWERFIRE____header_global_593785b881081ef6 = ((u32(((u32(5139) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cbd7322a47d63d74c304ba8f() {
  return __cxx_static_address_cbd7322a47d63d74c304ba8f.reference || (__cxx_static_address_cbd7322a47d63d74c304ba8f.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERFIRE____header_global_593785b881081ef6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:791
export const FLAMETHROWERFLAME____header_global_1acffe4a2add9b5e = ((u32(((u32(1891) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5a0a03eacb91119be1e450d7() {
  return __cxx_static_address_5a0a03eacb91119be1e450d7.reference || (__cxx_static_address_5a0a03eacb91119be1e450d7.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERFLAME____header_global_1acffe4a2add9b5e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:792
export const FLAMETHROWERPILOT____header_global_19e83feb8d281ae2 = ((u32(((u32(5174) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6b31e8eb4205b51923c7897d() {
  return __cxx_static_address_6b31e8eb4205b51923c7897d.reference || (__cxx_static_address_6b31e8eb4205b51923c7897d.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERPILOT____header_global_19e83feb8d281ae2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:793
export const FIREBALL____header_global_94e1d0844b00c15d = ((u32(((u32(5163) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fe75bba07212de0bc041c22b() {
  return __cxx_static_address_fe75bba07212de0bc041c22b.reference || (__cxx_static_address_fe75bba07212de0bc041c22b.reference = {
    __cReference: true,
    get value() { return FIREBALL____header_global_94e1d0844b00c15d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:794
export const ONFIRE____header_global_2aa2abcb369164f6 = ((u32(((u32(5152) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_28bbf1f7b76108d465241a13() {
  return __cxx_static_address_28bbf1f7b76108d465241a13.reference || (__cxx_static_address_28bbf1f7b76108d465241a13.reference = {
    __cReference: true,
    get value() { return ONFIRE____header_global_2aa2abcb369164f6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:795
export const ONFIRESMOKE____header_global_22e7b5ee722cf135 = ((u32(((u32(5143) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d657c5d4cc8eec9ddd43e219() {
  return __cxx_static_address_d657c5d4cc8eec9ddd43e219.reference || (__cxx_static_address_d657c5d4cc8eec9ddd43e219.reference = {
    __cReference: true,
    get value() { return ONFIRESMOKE____header_global_22e7b5ee722cf135; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:796
export const BURNEDCORPSE____header_global_c5529a5c27d1f01b = ((u32(((u32(5173) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6c7820822131dc4ea8d0f2b3() {
  return __cxx_static_address_6c7820822131dc4ea8d0f2b3.reference || (__cxx_static_address_6c7820822131dc4ea8d0f2b3.reference = {
    __cReference: true,
    get value() { return BURNEDCORPSE____header_global_c5529a5c27d1f01b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:797
export const WHISPYSMOKE____header_global_7eb34ab4384990aa = ((u32(((u32(5268) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_36d462342698b9a9ff8bb529() {
  return __cxx_static_address_36d462342698b9a9ff8bb529.reference || (__cxx_static_address_36d462342698b9a9ff8bb529.reference = {
    __cReference: true,
    get value() { return WHISPYSMOKE____header_global_7eb34ab4384990aa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:798
export const FIREFLY____header_global_7a8186b966903e66 = ((u32(((u32(5180) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d4f5e91b5205d32ed13cb521() {
  return __cxx_static_address_d4f5e91b5205d32ed13cb521.reference || (__cxx_static_address_d4f5e91b5205d32ed13cb521.reference = {
    __cReference: true,
    get value() { return FIREFLY____header_global_7a8186b966903e66; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:799
export const FIREFLYSHRINKEFFECT____header_global_115661aabbb1ff79 = ((u32(((u32(5360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ac79e1b2590233747139822b() {
  return __cxx_static_address_ac79e1b2590233747139822b.reference || (__cxx_static_address_ac79e1b2590233747139822b.reference = {
    __cReference: true,
    get value() { return FIREFLYSHRINKEFFECT____header_global_115661aabbb1ff79; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:800
export const FIREFLYGROWEFFECT____header_global_a27182c5d437fa6f = ((u32(((u32(5367) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fac054b580c75630d559c844() {
  return __cxx_static_address_fac054b580c75630d559c844.reference || (__cxx_static_address_fac054b580c75630d559c844.reference = {
    __cReference: true,
    get value() { return FIREFLYGROWEFFECT____header_global_a27182c5d437fa6f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:801
export const FIREFLYFLYINGEFFECT____header_global_e9998f1286a15907 = ((u32(((u32(5296) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_638917de8289f59a2c1bceaf() {
  return __cxx_static_address_638917de8289f59a2c1bceaf.reference || (__cxx_static_address_638917de8289f59a2c1bceaf.reference = {
    __cReference: true,
    get value() { return FIREFLYFLYINGEFFECT____header_global_e9998f1286a15907; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:802
export const BOSS5____header_global_aafaff96bde4d1fa = ((u32(((u32(5310) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1053312e19a6f4ea584473c8() {
  return __cxx_static_address_1053312e19a6f4ea584473c8.reference || (__cxx_static_address_1053312e19a6f4ea584473c8.reference = {
    __cReference: true,
    get value() { return BOSS5____header_global_aafaff96bde4d1fa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:803
export const BOSS5STAYPUT____header_global_50827d1fd67a4b22 = ((u32(((u32(5311) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2e7478127323044e03b76852() {
  return __cxx_static_address_2e7478127323044e03b76852.reference || (__cxx_static_address_2e7478127323044e03b76852.reference = {
    __cReference: true,
    get value() { return BOSS5STAYPUT____header_global_50827d1fd67a4b22; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:804
export const LAVAPOOL____header_global_c82b2bb48450ce0a = ((u32(((u32(5304) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_14a627a2795262b6a510947d() {
  return __cxx_static_address_14a627a2795262b6a510947d.reference || (__cxx_static_address_14a627a2795262b6a510947d.reference = {
    __cReference: true,
    get value() { return LAVAPOOL____header_global_c82b2bb48450ce0a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:805
export const LAVASPLASH____header_global_17797fcea500bb3c = ((u32(((u32(5371) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fc5a559f9b911ce6cb1606b4() {
  return __cxx_static_address_fc5a559f9b911ce6cb1606b4.reference || (__cxx_static_address_fc5a559f9b911ce6cb1606b4.reference = {
    __cReference: true,
    get value() { return LAVASPLASH____header_global_17797fcea500bb3c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:806
export const LAVAPOOLBUBBLE____header_global_0a1786b1bef4661a = ((u32(((u32(5207) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b08fd9518003be7a4851c609() {
  return __cxx_static_address_b08fd9518003be7a4851c609.reference || (__cxx_static_address_b08fd9518003be7a4851c609.reference = {
    __cReference: true,
    get value() { return LAVAPOOLBUBBLE____header_global_0a1786b1bef4661a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:807
export const BOSS2STAYPUT____header_global_28f907f86bc95671 = ((u32(((u32(2711) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e7d9d9a345ed85999584dd84() {
  return __cxx_static_address_e7d9d9a345ed85999584dd84.reference || (__cxx_static_address_e7d9d9a345ed85999584dd84.reference = {
    __cReference: true,
    get value() { return BOSS2STAYPUT____header_global_28f907f86bc95671; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:808
export const BOSS3STAYPUT____header_global_b4d91eb27bb0e1e6 = ((u32(((u32(2761) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ea910b8d32bfd3795c6c5d6f() {
  return __cxx_static_address_ea910b8d32bfd3795c6c5d6f.reference || (__cxx_static_address_ea910b8d32bfd3795c6c5d6f.reference = {
    __cReference: true,
    get value() { return BOSS3STAYPUT____header_global_b4d91eb27bb0e1e6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:809
export const E32_TILE5736____header_global_9a2434b1d6b13e22 = ((u32(((u32(5736) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f6c03a14b518332ff0255d6e() {
  return __cxx_static_address_f6c03a14b518332ff0255d6e.reference || (__cxx_static_address_f6c03a14b518332ff0255d6e.reference = {
    __cReference: true,
    get value() { return E32_TILE5736____header_global_9a2434b1d6b13e22; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:810
export const E32_TILE5737____header_global_c875704b72420d86 = ((u32(((u32(5737) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c49a029b253eece76422b5e2() {
  return __cxx_static_address_c49a029b253eece76422b5e2.reference || (__cxx_static_address_c49a029b253eece76422b5e2.reference = {
    __cReference: true,
    get value() { return E32_TILE5737____header_global_c875704b72420d86; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:811
export const E32_TILE5846____header_global_d6b80eb4b6f03ecf = ((u32(((u32(5846) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ca58f4b9329559485611726b() {
  return __cxx_static_address_ca58f4b9329559485611726b.reference || (__cxx_static_address_ca58f4b9329559485611726b.reference = {
    __cReference: true,
    get value() { return E32_TILE5846____header_global_d6b80eb4b6f03ecf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/network.h:180
export const cSnapshotMemUsage__header_global_5012fb2675c1b296 = u64((BigInt(u64(64)) * BigInt(u64((BigInt(u64((BigInt(u64((BigInt(72) * BigInt(u64(16384))))) + BigInt(u64((BigInt(96) * BigInt(u64(4096)))))))) + BigInt(u64((BigInt(296) * BigInt(u64(16384))))))))));
function __cxx_static_address_971ef5f1aca2676522157dd2() {
  return __cxx_static_address_971ef5f1aca2676522157dd2.reference || (__cxx_static_address_971ef5f1aca2676522157dd2.reference = {
    __cReference: true,
    get value() { return cSnapshotMemUsage__header_global_5012fb2675c1b296; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/game.cpp:75
export let AppProperName = Uint8Array.from([69, 68, 117, 107, 101, 51, 50, 0]);
export function __cxx_global_cell_7ad9490ab779b926bf483166() {
  return __cxx_global_cell_7ad9490ab779b926bf483166.reference || (__cxx_global_cell_7ad9490ab779b926bf483166.reference = {
    __cReference: true,
    get value() { return AppProperName; },
    set value(__cxx_lvalue_0) { AppProperName = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/duke3d/src/game.cpp:76
export let AppTechnicalName = Uint8Array.from([101, 100, 117, 107, 101, 51, 50, 0]);
export function __cxx_global_cell_d3ca539b706f6435a7034970() {
  return __cxx_global_cell_d3ca539b706f6435a7034970.reference || (__cxx_global_cell_d3ca539b706f6435a7034970.reference = {
    __cReference: true,
    get value() { return AppTechnicalName; },
    set value(__cxx_lvalue_0) { AppTechnicalName = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/duke3d/src/game.cpp:78
export let g_quitDeadline = i32(0);
export function __cxx_global_cell_0d2ab16bdddf6615d258fa6a() {
  return __cxx_global_cell_0d2ab16bdddf6615d258fa6a.reference || (__cxx_global_cell_0d2ab16bdddf6615d258fa6a.reference = {
    __cReference: true,
    get value() { return g_quitDeadline; },
    set value(__cxx_lvalue_0) { g_quitDeadline = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/game.cpp:80
export let g_cameraDistance = i32(0);
export function __cxx_global_cell_9cef20cb19b42f4cfa85797b() {
  return __cxx_global_cell_9cef20cb19b42f4cfa85797b.reference || (__cxx_global_cell_9cef20cb19b42f4cfa85797b.reference = {
    __cReference: true,
    get value() { return g_cameraDistance; },
    set value(__cxx_lvalue_0) { g_cameraDistance = i32(__cxx_lvalue_0); }
  });
}

export let g_cameraClock = i32(0);
export function __cxx_global_cell_915885e2bacffc3a024f309d() {
  return __cxx_global_cell_915885e2bacffc3a024f309d.reference || (__cxx_global_cell_915885e2bacffc3a024f309d.reference = {
    __cReference: true,
    get value() { return g_cameraClock; },
    set value(__cxx_lvalue_0) { g_cameraClock = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/game.cpp:83
export let boardfilename = (() => { const items = new Uint8Array(256); items.set([(u32(0) & 255)]); return items; })();
function __cxx_static_address_7b94b27010261458b86134f0() {
  return __cxx_static_address_7b94b27010261458b86134f0.reference || (__cxx_static_address_7b94b27010261458b86134f0.reference = {
    __cReference: true,
    get value() { return boardfilename; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/game.cpp:84
export let currentboardfilename = (() => { const items = new Uint8Array(256); items.set([(u32(0) & 255)]); return items; })();
function __cxx_static_address_e1a6765e4c3781e6b7f95161() {
  return __cxx_static_address_e1a6765e4c3781e6b7f95161.reference || (__cxx_static_address_e1a6765e4c3781e6b7f95161.reference = {
    __cReference: true,
    get value() { return currentboardfilename; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/game.cpp:86
export let voting = i32((-1));
export function __cxx_global_cell_82e31d5020a88903aa9c5a6b() {
  return __cxx_global_cell_82e31d5020a88903aa9c5a6b.reference || (__cxx_global_cell_82e31d5020a88903aa9c5a6b.reference = {
    __cReference: true,
    get value() { return voting; },
    set value(__cxx_lvalue_0) { voting = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/game.cpp:87
export let vote_map = i32((-1));
export function __cxx_global_cell_cdf6a0fd4954c44448f8ee26() {
  return __cxx_global_cell_cdf6a0fd4954c44448f8ee26.reference || (__cxx_global_cell_cdf6a0fd4954c44448f8ee26.reference = {
    __cReference: true,
    get value() { return vote_map; },
    set value(__cxx_lvalue_0) { vote_map = i32(__cxx_lvalue_0); }
  });
}

export let vote_episode = i32((-1));
export function __cxx_global_cell_c98af2840c6c4037f82f6134() {
  return __cxx_global_cell_c98af2840c6c4037f82f6134.reference || (__cxx_global_cell_c98af2840c6c4037f82f6134.reference = {
    __cReference: true,
    get value() { return vote_episode; },
    set value(__cxx_lvalue_0) { vote_episode = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/game.cpp:89
export let g_BenchmarkMode = i32(0);
export function __cxx_global_cell_fd061a74a82145843a9c000f() {
  return __cxx_global_cell_fd061a74a82145843a9c000f.reference || (__cxx_global_cell_fd061a74a82145843a9c000f.reference = {
    __cReference: true,
    get value() { return g_BenchmarkMode; },
    set value(__cxx_lvalue_0) { g_BenchmarkMode = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/game.cpp:91
export let g_Debug = i32(0);
export function __cxx_global_cell_9a77723c4fa5ca1e9ee15261() {
  return __cxx_global_cell_9a77723c4fa5ca1e9ee15261.reference || (__cxx_global_cell_9a77723c4fa5ca1e9ee15261.reference = {
    __cReference: true,
    get value() { return g_Debug; },
    set value(__cxx_lvalue_0) { g_Debug = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/game.cpp:93
export let g_vm_preempt = i32(1);
export function __cxx_global_cell_45a45bd09cd0eab4ebcb00cf() {
  return __cxx_global_cell_45a45bd09cd0eab4ebcb00cf.reference || (__cxx_global_cell_45a45bd09cd0eab4ebcb00cf.reference = {
    __cReference: true,
    get value() { return g_vm_preempt; },
    set value(__cxx_lvalue_0) { g_vm_preempt = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/game.cpp:96
export const defaultrtsfilename = cPointerArray(4, () => [Uint8Array.from([68, 85, 75, 69, 46, 82, 84, 83, 0]), Uint8Array.from([78, 65, 77, 46, 82, 84, 83, 0]), Uint8Array.from([78, 65, 80, 65, 76, 77, 46, 82, 84, 83, 0]), Uint8Array.from([87, 87, 50, 71, 73, 46, 82, 84, 83, 0])]);
function __cxx_static_address_a9b647721b865af9e3d46107() {
  return __cxx_static_address_a9b647721b865af9e3d46107.reference || (__cxx_static_address_a9b647721b865af9e3d46107.reference = {
    __cReference: true,
    get value() { return defaultrtsfilename; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/game.cpp:99
export let g_Shareware = i32(0);
export function __cxx_global_cell_e1d25c484f6e2a51686cce4a() {
  return __cxx_global_cell_e1d25c484f6e2a51686cce4a.reference || (__cxx_global_cell_e1d25c484f6e2a51686cce4a.reference = {
    __cReference: true,
    get value() { return g_Shareware; },
    set value(__cxx_lvalue_0) { g_Shareware = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/game.cpp:110
export let tempwallptr = 0;
export function __cxx_global_cell_810b06e2a17ec770a557ed86() {
  return __cxx_global_cell_810b06e2a17ec770a557ed86.reference || (__cxx_global_cell_810b06e2a17ec770a557ed86.reference = {
    __cReference: true,
    get value() { return tempwallptr; },
    set value(__cxx_lvalue_0) { tempwallptr = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/game.cpp:112
export let nonsharedtimer = 0;
function __cxx_static_address_97c3a5d674a06dd7a28c8761() {
  return __cxx_static_address_97c3a5d674a06dd7a28c8761.reference || (__cxx_static_address_97c3a5d674a06dd7a28c8761.reference = {
    __cReference: true,
    get value() { return nonsharedtimer; },
    set value(__cxx_lvalue_0) { nonsharedtimer = i32(__cxx_lvalue_0); }
  });
}
export function __cxx_private_cell_97c3a5d674a06dd7a28c8761() { return __cxx_static_address_97c3a5d674a06dd7a28c8761(); }

// C/C++ source: source/duke3d/src/game.cpp:114
export let ticrandomseed = 0;
export function __cxx_global_cell_68b6d54980cdb16254a25314() {
  return __cxx_global_cell_68b6d54980cdb16254a25314.reference || (__cxx_global_cell_68b6d54980cdb16254a25314.reference = {
    __cReference: true,
    get value() { return ticrandomseed; },
    set value(__cxx_lvalue_0) { ticrandomseed = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/include/fix16.h:31
export const FIX16_MAX__header_global_75c3bdc9033d5b07 = i32(2147483647);
function __cxx_static_address_74e11ab7f00bdfffeff4b98f() {
  return __cxx_static_address_74e11ab7f00bdfffeff4b98f.reference || (__cxx_static_address_74e11ab7f00bdfffeff4b98f.reference = {
    __cReference: true,
    get value() { return FIX16_MAX__header_global_75c3bdc9033d5b07; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:32
export const FIX16_MIN__header_global_c7e72fb990aef0d1 = i32(2147483648);
function __cxx_static_address_2276ba28ac946ef35dd185f6() {
  return __cxx_static_address_2276ba28ac946ef35dd185f6.reference || (__cxx_static_address_2276ba28ac946ef35dd185f6.reference = {
    __cReference: true,
    get value() { return FIX16_MIN__header_global_c7e72fb990aef0d1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:33
export const FIX16_OVERFLOW__header_global_475e994a16e7f05a = i32(2147483648);
function __cxx_static_address_d6f522543aa491f74c0abc8f() {
  return __cxx_static_address_d6f522543aa491f74c0abc8f.reference || (__cxx_static_address_d6f522543aa491f74c0abc8f.reference = {
    __cReference: true,
    get value() { return FIX16_OVERFLOW__header_global_475e994a16e7f05a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/game.cpp:116
export let hud_showmapname = i32(1);
export function __cxx_global_cell_2ee6a4c1e2e244c04f3df21d() {
  return __cxx_global_cell_2ee6a4c1e2e244c04f3df21d.reference || (__cxx_global_cell_2ee6a4c1e2e244c04f3df21d.reference = {
    __cReference: true,
    get value() { return hud_showmapname; },
    set value(__cxx_lvalue_0) { hud_showmapname = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/game.cpp:118
export let g_levelTextTime = i32(0);
export function __cxx_global_cell_34a7b68257676ec1276613a0() {
  return __cxx_global_cell_34a7b68257676ec1276613a0.reference || (__cxx_global_cell_34a7b68257676ec1276613a0.reference = {
    __cReference: true,
    get value() { return g_levelTextTime; },
    set value(__cxx_lvalue_0) { g_levelTextTime = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/game.cpp:124
export function M32RunScript(s) {
  (s = s);
}

// C/C++ source: source/duke3d/src/game.cpp:126
const __cxx_literal_34429ecd739807e0763e = Uint8Array.from([0]);
export function G_DefaultRtsFile() {
  if (Boolean(i32((__cxx_global_cell_c0e288040dbf9a805036c27d().value & 1)))) {
    return (cPointerElementRef(defaultrtsfilename, 0).value);
  } else {
    if (Boolean(i32((__cxx_global_cell_c0e288040dbf9a805036c27d().value & 8)))) {
      return (cPointerElementRef(defaultrtsfilename, 3).value);
    } else {
      if (Boolean(i32((__cxx_global_cell_c0e288040dbf9a805036c27d().value & 4)))) {
        if (((!Boolean(testkopen((cPointerElementRef(defaultrtsfilename, 2).value), (u32(0) & 255)))) && Boolean(testkopen((cPointerElementRef(defaultrtsfilename, 1).value), (u32(0) & 255))))) {
          return (cPointerElementRef(defaultrtsfilename, 1).value);
        } else {
          return (cPointerElementRef(defaultrtsfilename, 2).value);
        }
      } else {
        if (Boolean(i32((__cxx_global_cell_c0e288040dbf9a805036c27d().value & 2)))) {
          if (((!Boolean(testkopen((cPointerElementRef(defaultrtsfilename, 1).value), (u32(0) & 255)))) && Boolean(testkopen((cPointerElementRef(defaultrtsfilename, 2).value), (u32(0) & 255))))) {
            return (cPointerElementRef(defaultrtsfilename, 2).value);
          } else {
            return (cPointerElementRef(defaultrtsfilename, 1).value);
          }
        }
      }
    }
  }
  return __cxx_literal_34429ecd739807e0763e;
}

// C/C++ source: source/duke3d/src/game.cpp:264
export function A_CheckInventorySprite(s) {
  switch (tileGetMapping__header_4ce924747fea(i32(cRecordObject(cRecordPointer(s, {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xyz": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "__cxx_anonymous_15": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"xvel": {"native": "Int16Array", "offset": 0, "size": 2}, "yvel": {"native": "Int16Array", "offset": 2, "size": 2}, "zvel": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "vel": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}, "z": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"d": {"native": "Int16Array", "offset": 0, "size": 2}, "u": {"native": "Int16Array", "offset": 2, "size": 2}, "v": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 0}}, "overlaps": true, "size": 6, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 32}, "ang": {"native": "Int16Array", "offset": 28, "size": 2}, "blend": {"native": "Uint8Array", "offset": 19, "size": 1}, "clipdist": {"native": "Uint8Array", "offset": 18, "size": 1}, "cstat": {"native": "Uint16Array", "offset": 12, "size": 2}, "extra": {"native": "Int16Array", "offset": 42, "size": 2}, "hitag": {"native": "Int16Array", "offset": 40, "size": 2}, "lotag": {"native": "Int16Array", "offset": 38, "size": 2}, "owner": {"native": "Int16Array", "offset": 30, "size": 2}, "pal": {"native": "Uint8Array", "offset": 17, "size": 1}, "picnum": {"native": "Int16Array", "offset": 14, "size": 2}, "sectnum": {"native": "Int16Array", "offset": 24, "size": 2}, "shade": {"native": "Int8Array", "offset": 16, "size": 1}, "statnum": {"native": "Int16Array", "offset": 26, "size": 2}, "xoffset": {"native": "Int8Array", "offset": 22, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 20, "size": 1}, "yoffset": {"native": "Int8Array", "offset": 23, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 21, "size": 1}}, "overlaps": true, "size": 44, "union": false}, {})).picnum))) {
    case i32(FIRSTAID____header_global_7b550f4f62c0fd0b):
    case i32(STEROIDS____header_global_2c13bab4f30e16e2):
    case i32(HEATSENSOR____header_global_cbb520c931ec10d8):
    case i32(BOOTS____header_global_a198e6a8f128975b):
    case i32(JETPACK____header_global_0d509ca021ba315c):
    case i32(HOLODUKE____header_global_13b886505f87b279):
    case i32(AIRTANK____header_global_8fa425591c7d35c0): {
      return i32(1);
    }
    default: {
      return i32(0);
    }
  }
}

// C/C++ source: source/duke3d/src/game.cpp:304
export function app_exit(returnCode) {
  if ((returnCode != 0)) {
    do {
      engineDestroyAllocator__header_30442726231d();
      cProcess.exit(returnCode);
    } while (Boolean(0));
  }
  do {
    engineDestroyAllocator__header_30442726231d();
    cProcess.exit(0);
  } while (Boolean(0));
}

// C/C++ source: source/duke3d/src/game.cpp:455
export let ror_protectedsectors = new Uint8Array(512);
function __cxx_static_address_ece5c8005d023643c26b6693() {
  return __cxx_static_address_ece5c8005d023643c26b6693.reference || (__cxx_static_address_ece5c8005d023643c26b6693.reference = {
    __cReference: true,
    get value() { return ror_protectedsectors; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/game.cpp:456
export let drawing_ror = i32(0);
function __cxx_static_address_59bee722c3ce76b8747bf728() {
  return __cxx_static_address_59bee722c3ce76b8747bf728.reference || (__cxx_static_address_59bee722c3ce76b8747bf728.reference = {
    __cReference: true,
    get value() { return drawing_ror; },
    set value(__cxx_lvalue_0) { drawing_ror = i32(__cxx_lvalue_0); }
  });
}
export function __cxx_private_cell_59bee722c3ce76b8747bf728() { return __cxx_static_address_59bee722c3ce76b8747bf728(); }

// C/C++ source: source/duke3d/src/game.cpp:457
export let ror_sprite = i32((-1));
function __cxx_static_address_c951871e8e014b0c51d61aa6() {
  return __cxx_static_address_c951871e8e014b0c51d61aa6.reference || (__cxx_static_address_c951871e8e014b0c51d61aa6.reference = {
    __cReference: true,
    get value() { return ror_sprite; },
    set value(__cxx_lvalue_0) { ror_sprite = i32(__cxx_lvalue_0); }
  });
}
export function __cxx_private_cell_c951871e8e014b0c51d61aa6() { return __cxx_static_address_c951871e8e014b0c51d61aa6(); }

// C/C++ source: source/duke3d/src/game.cpp:3624
export function G_CheckAdultTile(tileNum) {
  switch (tileGetMapping__header_4ce924747fea(tileNum)) {
    case i32(FEM1____header_global_6c3bc763a4679cf7):
    case i32(FEM2____header_global_ae5b44893de611e7):
    case i32(FEM3____header_global_7e6d9b03142394e3):
    case i32(FEM4____header_global_eaf38733028fc1a5):
    case i32(FEM5____header_global_e32b47543e14be44):
    case i32(FEM6____header_global_9281c402db288bc3):
    case i32(FEM7____header_global_4a24bed2a474cbd9):
    case i32(FEM8____header_global_825a520321d1db82):
    case i32(FEM9____header_global_7f5bf24344a06d81):
    case i32(FEM10____header_global_e92de30930810443):
    case i32(MAN____header_global_da1bf674cdcd85bc):
    case i32(MAN2____header_global_23cf71ab2b089498):
    case i32(WOMAN____header_global_f6e40f9dc2a9b217):
    case i32(NAKED1____header_global_3661ff61ff0ae6d7):
    case i32(PODFEM1____header_global_b80f05ac6849519f):
    case i32(FEMMAG1____header_global_75336c4c3f0706c3):
    case i32(FEMMAG2____header_global_e3f4bc57305c96ad):
    case i32(FEMPIC1____header_global_a4533ec869e1a3ef):
    case i32(FEMPIC2____header_global_c2d8f42bec6a5474):
    case i32(FEMPIC3____header_global_dc9da92f4881cddb):
    case i32(FEMPIC4____header_global_a2e22e1e820d41ca):
    case i32(FEMPIC5____header_global_4b9b81180494dc18):
    case i32(FEMPIC6____header_global_56bbc29002714e92):
    case i32(FEMPIC7____header_global_703b730890361b83):
    case i32(BLOODYPOLE____header_global_b964b8f9100b455f):
    case i32(FEM6PAD____header_global_dc109a1f8ffa544e):
    case i32(STATUE____header_global_921a665274513c3b):
    case i32(STATUEFLASH____header_global_50aadf0d7bdf4b1c):
    case i32(OOZ____header_global_07ccc0068f41803e):
    case i32(OOZ2____header_global_6a1003811cb69a4f):
    case i32(WALLBLOOD1____header_global_e12889d8610a7a73):
    case i32(WALLBLOOD2____header_global_42db76d941f51ccf):
    case i32(WALLBLOOD3____header_global_b4be9593b5905ec3):
    case i32(WALLBLOOD4____header_global_e0eb30f21fc1ecd2):
    case i32(WALLBLOOD5____header_global_2414a64c798e669a):
    case i32(WALLBLOOD7____header_global_9a5d28e2fb5698b6):
    case i32(WALLBLOOD8____header_global_c3690a3d7d568656):
    case i32(SUSHIPLATE1____header_global_5989a406925be94d):
    case i32(SUSHIPLATE2____header_global_55fa13e8f4537e24):
    case i32(SUSHIPLATE3____header_global_8ed387bd6d5117ca):
    case i32(SUSHIPLATE4____header_global_3287006f85034463):
    case i32(FETUS____header_global_9e8d6d6ae00e3abf):
    case i32(FETUSJIB____header_global_7259937db3ed30e2):
    case i32(FETUSBROKE____header_global_ee76e864e3ff4f53):
    case i32(HOTMEAT____header_global_ce822bbd1a72c1cc):
    case i32(FOODOBJECT16____header_global_15fdc1142339fb3d):
    case i32(DOLPHIN1____header_global_7ad32523df8df580):
    case i32(DOLPHIN2____header_global_2bb93381647a9fa3):
    case i32(TOUGHGAL____header_global_fa61e1b00903e5df):
    case i32(TAMPON____header_global_a7ea7f038f56b8f6):
    case i32(XXXSTACY____header_global_280527d95dc742b7):
    case 4946:
    case 4947:
    case 693:
    case 2254:
    case 4560:
    case 4561:
    case 4562:
    case 4498:
    case 4957: {
      return i32(1);
    }
  }
  return i32(0);
}

// C/C++ source: source/duke3d/src/game.cpp:4611
export let g_RTSPlaying = 0;
function __cxx_static_address_68d89cd14f95d780b77b0761() {
  return __cxx_static_address_68d89cd14f95d780b77b0761.reference || (__cxx_static_address_68d89cd14f95d780b77b0761.reference = {
    __cReference: true,
    get value() { return g_RTSPlaying; },
    set value(__cxx_lvalue_0) { g_RTSPlaying = i32(__cxx_lvalue_0); }
  });
}
export function __cxx_private_cell_68d89cd14f95d780b77b0761() { return __cxx_static_address_68d89cd14f95d780b77b0761(); }

// C/C++ source: source/duke3d/src/game.cpp:5224
const __cxx_literal_e10864aca55ed1a4056f = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 46, 99, 112, 112, 0]);
const __cxx_literal_6baa83e77361bfb61037 = Uint8Array.from([37, 115, 58, 37, 100, 58, 32, 101, 114, 114, 111, 114, 58, 32, 102, 114, 97, 109, 101, 32, 110, 117, 109, 98, 101, 114, 32, 109, 117, 115, 116, 32, 98, 101, 32, 103, 114, 101, 97, 116, 101, 114, 32, 116, 104, 97, 110, 32, 122, 101, 114, 111, 0]);
const __cxx_literal_2d49ff376e372b200759 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 46, 99, 112, 112, 0]);
const __cxx_literal_cb85285f2eb8d9c26218 = Uint8Array.from([37, 115, 58, 37, 100, 58, 32, 101, 114, 114, 111, 114, 58, 32, 102, 114, 97, 109, 101, 32, 110, 117, 109, 98, 101, 114, 115, 32, 109, 117, 115, 116, 32, 98, 101, 32, 105, 110, 32, 40, 110, 111, 116, 32, 110, 101, 99, 101, 115, 115, 97, 114, 105, 108, 121, 32, 115, 116, 114, 105, 99, 116, 108, 121, 41, 32, 97, 115, 99, 101, 110, 100, 105, 110, 103, 32, 111, 114, 100, 101, 114, 0]);
const __cxx_literal_e169d9c6e65a74481ebd = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 46, 99, 112, 112, 0]);
const __cxx_literal_260e808321fcd26d6f62 = Uint8Array.from([37, 115, 58, 37, 100, 58, 32, 101, 114, 114, 111, 114, 58, 32, 115, 111, 117, 110, 100, 32, 110, 117, 109, 98, 101, 114, 32, 35, 37, 100, 32, 105, 110, 118, 97, 108, 105, 100, 0]);
const __cxx_literal_5a20e655cd890db75501 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 46, 99, 112, 112, 0]);
const __cxx_literal_21129500982a45cc789b = Uint8Array.from([70, 97, 105, 108, 101, 100, 32, 100, 101, 102, 105, 110, 105, 110, 103, 32, 115, 111, 117, 110, 100, 32, 115, 101, 113, 117, 101, 110, 99, 101, 32, 102, 111, 114, 32, 97, 110, 105, 109, 32, 39, 37, 115, 39, 46, 0]);
export function parsedefinitions_game_animsounds(pScript, blockEnd, fileName, animPtr) {
  xfree__header_25587e65bc1e(cRecordObject(cRecordPointer(animPtr, {"align": 8, "arrayAlign": 1, "fields": {"animbuf": {"offset": 16, "pointer": true, "size": 8}, "animlock": {"native": "Uint8Array", "offset": 36, "size": 1}, "frameaspect1": {"native": "Float64Array", "offset": 0, "size": 8}, "frameaspect2": {"native": "Float64Array", "offset": 8, "size": 8}, "framedelay": {"native": "Uint8Array", "offset": 34, "size": 1}, "frameflags": {"native": "Uint8Array", "offset": 35, "size": 1}, "numsounds": {"native": "Uint16Array", "offset": 32, "size": 2}, "sounds": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {})).sounds);
  let numPairs = u64(0);
  let allocSize = u64(4);
  (cRecordObject(cRecordPointer(animPtr, {"align": 8, "arrayAlign": 1, "fields": {"animbuf": {"offset": 16, "pointer": true, "size": 8}, "animlock": {"native": "Uint8Array", "offset": 36, "size": 1}, "frameaspect1": {"native": "Float64Array", "offset": 0, "size": 8}, "frameaspect2": {"native": "Float64Array", "offset": 8, "size": 8}, "framedelay": {"native": "Uint8Array", "offset": 34, "size": 1}, "frameflags": {"native": "Uint8Array", "offset": 35, "size": 1}, "numsounds": {"native": "Uint16Array", "offset": 32, "size": 2}, "sounds": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {})).sounds = cRecordPointer(xmalloc__header_b8c4af936cfc(u64((BigInt(allocSize) * BigInt(4)))), {"align": 2, "arrayAlign": 1, "fields": {"frame": {"native": "Uint16Array", "offset": 0, "size": 2}, "sound": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, {}));
  (cRecordObject(cRecordPointer(animPtr, {"align": 8, "arrayAlign": 1, "fields": {"animbuf": {"offset": 16, "pointer": true, "size": 8}, "animlock": {"native": "Uint8Array", "offset": 36, "size": 1}, "frameaspect1": {"native": "Float64Array", "offset": 0, "size": 8}, "frameaspect2": {"native": "Float64Array", "offset": 8, "size": 8}, "framedelay": {"native": "Uint8Array", "offset": 34, "size": 1}, "frameflags": {"native": "Uint8Array", "offset": 35, "size": 1}, "numsounds": {"native": "Uint16Array", "offset": 32, "size": 2}, "sounds": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {})).numsounds = (u32((u32(0) & 65535)) & 65535));
  let defError = i32(1);
  let lastFrameNum = (u32((u32(1) & 65535)) & 65535);
  while (cPointerCompare(cRecordObject(cRecordPointer(pScript, {"align": 8, "arrayAlign": 1, "fields": {"eof": {"offset": 32, "pointer": true, "size": 8}, "filename": {"offset": 40, "pointer": true, "size": 8}, "linenum": {"native": "Int32Array", "offset": 48, "size": 4}, "lineoffs": {"offset": 56, "pointer": true, "size": 8}, "ltextptr": {"offset": 16, "pointer": true, "size": 8}, "textbuf": {"offset": 0, "pointer": true, "size": 8}, "textlength": {"native": "Uint32Array", "offset": 8, "size": 4}, "textptr": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": false, "size": 64, "union": false}, {})).textptr, blockEnd, "<")) {
    let frameNum;
    const __cxx_lvalue_0 = cRef(() => frameNum, __cxx_lvalue_2 => { frameNum = i32(__cxx_lvalue_2); });
    let soundNum;
    const __cxx_lvalue_1 = cRef(() => soundNum, __cxx_lvalue_3 => { soundNum = i32(__cxx_lvalue_3); });
    if ((cPointerDiff(blockEnd, cRecordObject(cRecordPointer(pScript, {"align": 8, "arrayAlign": 1, "fields": {"eof": {"offset": 32, "pointer": true, "size": 8}, "filename": {"offset": 40, "pointer": true, "size": 8}, "linenum": {"native": "Int32Array", "offset": 48, "size": 4}, "lineoffs": {"offset": 56, "pointer": true, "size": 8}, "ltextptr": {"offset": 16, "pointer": true, "size": 8}, "textbuf": {"offset": 0, "pointer": true, "size": 8}, "textlength": {"native": "Uint32Array", "offset": 8, "size": 4}, "textptr": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": false, "size": 64, "union": false}, {})).textptr, Uint8Array.BYTES_PER_ELEMENT) == i64(1))) {
      break;
    }
    if (Boolean(scriptfile_getnumber(pScript, __cxx_lvalue_0))) {
      break;
    }
    (defError = i32(1));
    if (Boolean(scriptfile_getsymbol(pScript, __cxx_lvalue_1))) {
      break;
    }
    if ((frameNum <= 0)) {
      ((i32(-2) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-2), __cxx_literal_e10864aca55ed1a4056f, u32(5261), __cxx_literal_6baa83e77361bfb61037, cRecordObject(cRecordPointer(pScript, {"align": 8, "arrayAlign": 1, "fields": {"eof": {"offset": 32, "pointer": true, "size": 8}, "filename": {"offset": 40, "pointer": true, "size": 8}, "linenum": {"native": "Int32Array", "offset": 48, "size": 4}, "lineoffs": {"offset": 56, "pointer": true, "size": 8}, "ltextptr": {"offset": 16, "pointer": true, "size": 8}, "textbuf": {"offset": 0, "pointer": true, "size": 8}, "textlength": {"native": "Uint32Array", "offset": 8, "size": 4}, "textptr": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": false, "size": 64, "union": false}, {})).filename, scriptfile_getlinum(pScript, cRecordObject(cRecordPointer(pScript, {"align": 8, "arrayAlign": 1, "fields": {"eof": {"offset": 32, "pointer": true, "size": 8}, "filename": {"offset": 40, "pointer": true, "size": 8}, "linenum": {"native": "Int32Array", "offset": 48, "size": 4}, "lineoffs": {"offset": 56, "pointer": true, "size": 8}, "ltextptr": {"offset": 16, "pointer": true, "size": 8}, "textbuf": {"offset": 0, "pointer": true, "size": 8}, "textlength": {"native": "Uint32Array", "offset": 8, "size": 4}, "textptr": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": false, "size": 64, "union": false}, {})).ltextptr)));
      break;
    }
    if ((frameNum < i32(lastFrameNum))) {
      ((i32(-2) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-2), __cxx_literal_2d49ff376e372b200759, u32(5268), __cxx_literal_cb85285f2eb8d9c26218, cRecordObject(cRecordPointer(pScript, {"align": 8, "arrayAlign": 1, "fields": {"eof": {"offset": 32, "pointer": true, "size": 8}, "filename": {"offset": 40, "pointer": true, "size": 8}, "linenum": {"native": "Int32Array", "offset": 48, "size": 4}, "lineoffs": {"offset": 56, "pointer": true, "size": 8}, "ltextptr": {"offset": 16, "pointer": true, "size": 8}, "textbuf": {"offset": 0, "pointer": true, "size": 8}, "textlength": {"native": "Uint32Array", "offset": 8, "size": 4}, "textptr": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": false, "size": 64, "union": false}, {})).filename, scriptfile_getlinum(pScript, cRecordObject(cRecordPointer(pScript, {"align": 8, "arrayAlign": 1, "fields": {"eof": {"offset": 32, "pointer": true, "size": 8}, "filename": {"offset": 40, "pointer": true, "size": 8}, "linenum": {"native": "Int32Array", "offset": 48, "size": 4}, "lineoffs": {"offset": 56, "pointer": true, "size": 8}, "ltextptr": {"offset": 16, "pointer": true, "size": 8}, "textbuf": {"offset": 0, "pointer": true, "size": 8}, "textlength": {"native": "Uint32Array", "offset": 8, "size": 4}, "textptr": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": false, "size": 64, "union": false}, {})).ltextptr)));
      break;
    }
    (lastFrameNum = (u32((u32(frameNum) & 65535)) & 65535));
    if (((u32(soundNum) >= u32(16384)) && (soundNum != (-1)))) {
      ((i32(-2) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-2), __cxx_literal_e169d9c6e65a74481ebd, u32(5278), __cxx_literal_260e808321fcd26d6f62, cRecordObject(cRecordPointer(pScript, {"align": 8, "arrayAlign": 1, "fields": {"eof": {"offset": 32, "pointer": true, "size": 8}, "filename": {"offset": 40, "pointer": true, "size": 8}, "linenum": {"native": "Int32Array", "offset": 48, "size": 4}, "lineoffs": {"offset": 56, "pointer": true, "size": 8}, "ltextptr": {"offset": 16, "pointer": true, "size": 8}, "textbuf": {"offset": 0, "pointer": true, "size": 8}, "textlength": {"native": "Uint32Array", "offset": 8, "size": 4}, "textptr": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": false, "size": 64, "union": false}, {})).filename, scriptfile_getlinum(pScript, cRecordObject(cRecordPointer(pScript, {"align": 8, "arrayAlign": 1, "fields": {"eof": {"offset": 32, "pointer": true, "size": 8}, "filename": {"offset": 40, "pointer": true, "size": 8}, "linenum": {"native": "Int32Array", "offset": 48, "size": 4}, "lineoffs": {"offset": 56, "pointer": true, "size": 8}, "ltextptr": {"offset": 16, "pointer": true, "size": 8}, "textbuf": {"offset": 0, "pointer": true, "size": 8}, "textlength": {"native": "Uint32Array", "offset": 8, "size": 4}, "textptr": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": false, "size": 64, "union": false}, {})).ltextptr), soundNum));
      break;
    }
    if ((numPairs >= allocSize)) {
      (allocSize = u64((BigInt(allocSize) * BigInt(u64(2)))));
      (cRecordObject(cRecordPointer(animPtr, {"align": 8, "arrayAlign": 1, "fields": {"animbuf": {"offset": 16, "pointer": true, "size": 8}, "animlock": {"native": "Uint8Array", "offset": 36, "size": 1}, "frameaspect1": {"native": "Float64Array", "offset": 0, "size": 8}, "frameaspect2": {"native": "Float64Array", "offset": 8, "size": 8}, "framedelay": {"native": "Uint8Array", "offset": 34, "size": 1}, "frameflags": {"native": "Uint8Array", "offset": 35, "size": 1}, "numsounds": {"native": "Uint16Array", "offset": 32, "size": 2}, "sounds": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {})).sounds = cRecordPointer(xrealloc__header_d80e72c0e866(cRecordObject(cRecordPointer(animPtr, {"align": 8, "arrayAlign": 1, "fields": {"animbuf": {"offset": 16, "pointer": true, "size": 8}, "animlock": {"native": "Uint8Array", "offset": 36, "size": 1}, "frameaspect1": {"native": "Float64Array", "offset": 0, "size": 8}, "frameaspect2": {"native": "Float64Array", "offset": 8, "size": 8}, "framedelay": {"native": "Uint8Array", "offset": 34, "size": 1}, "frameflags": {"native": "Uint8Array", "offset": 35, "size": 1}, "numsounds": {"native": "Uint16Array", "offset": 32, "size": 2}, "sounds": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {})).sounds, u64((BigInt(allocSize) * BigInt(4)))), {"align": 2, "arrayAlign": 1, "fields": {"frame": {"native": "Uint16Array", "offset": 0, "size": 2}, "sound": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, {}));
    }
    (defError = i32(0));
    let sound = (cPointerElementRef(cRecordPointer(cRecordObject(cRecordPointer(animPtr, {"align": 8, "arrayAlign": 1, "fields": {"animbuf": {"offset": 16, "pointer": true, "size": 8}, "animlock": {"native": "Uint8Array", "offset": 36, "size": 1}, "frameaspect1": {"native": "Float64Array", "offset": 0, "size": 8}, "frameaspect2": {"native": "Float64Array", "offset": 8, "size": 8}, "framedelay": {"native": "Uint8Array", "offset": 34, "size": 1}, "frameflags": {"native": "Uint8Array", "offset": 35, "size": 1}, "numsounds": {"native": "Uint16Array", "offset": 32, "size": 2}, "sounds": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {})).sounds, {"align": 2, "arrayAlign": 1, "fields": {"frame": {"native": "Uint16Array", "offset": 0, "size": 2}, "sound": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, {}), numPairs).value);
    (sound.frame = (u32((u32(frameNum) & 65535)) & 65535));
    (sound.sound = ((u32(((u32(soundNum) << 16) >> 16)) << 16) >> 16));
    ((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = u64((previous + 1n)); __cxx_lvalue_4.value = next; return next; })(cRef(() => numPairs, __cxx_lvalue_5 => { numPairs = __cxx_lvalue_5; }));
  }
  if ((!Boolean(defError))) {
    (cRecordObject(cRecordPointer(animPtr, {"align": 8, "arrayAlign": 1, "fields": {"animbuf": {"offset": 16, "pointer": true, "size": 8}, "animlock": {"native": "Uint8Array", "offset": 36, "size": 1}, "frameaspect1": {"native": "Float64Array", "offset": 0, "size": 8}, "frameaspect2": {"native": "Float64Array", "offset": 8, "size": 8}, "framedelay": {"native": "Uint8Array", "offset": 34, "size": 1}, "frameflags": {"native": "Uint8Array", "offset": 35, "size": 1}, "numsounds": {"native": "Uint16Array", "offset": 32, "size": 2}, "sounds": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {})).numsounds = (u32((u32(numPairs) & 65535)) & 65535));
  } else {
    do {
      xfree__header_25587e65bc1e(cRecordObject(cRecordPointer(animPtr, {"align": 8, "arrayAlign": 1, "fields": {"animbuf": {"offset": 16, "pointer": true, "size": 8}, "animlock": {"native": "Uint8Array", "offset": 36, "size": 1}, "frameaspect1": {"native": "Float64Array", "offset": 0, "size": 8}, "frameaspect2": {"native": "Float64Array", "offset": 8, "size": 8}, "framedelay": {"native": "Uint8Array", "offset": 34, "size": 1}, "frameflags": {"native": "Uint8Array", "offset": 35, "size": 1}, "numsounds": {"native": "Uint16Array", "offset": 32, "size": 2}, "sounds": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {})).sounds);
      (cRecordObject(cRecordPointer(animPtr, {"align": 8, "arrayAlign": 1, "fields": {"animbuf": {"offset": 16, "pointer": true, "size": 8}, "animlock": {"native": "Uint8Array", "offset": 36, "size": 1}, "frameaspect1": {"native": "Float64Array", "offset": 0, "size": 8}, "frameaspect2": {"native": "Float64Array", "offset": 8, "size": 8}, "framedelay": {"native": "Uint8Array", "offset": 34, "size": 1}, "frameflags": {"native": "Uint8Array", "offset": 35, "size": 1}, "numsounds": {"native": "Uint16Array", "offset": 32, "size": 2}, "sounds": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {})).sounds = null);
    } while (Boolean(0));
    ((i32(-2) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-2), __cxx_literal_5a20e655cd890db75501, u32(5306), __cxx_literal_21129500982a45cc789b, fileName));
  }
}

// C/C++ source: source/duke3d/src/game.cpp:5310
export const newGameTokens = cByteRecordNDArray({"align": 8, "arrayAlign": 1, "fields": {"text": {"offset": 0, "pointer": true, "size": 8}, "tokenid": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, [1], {}, cStaticInitializerValues([cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"text": {"offset": 0, "pointer": true, "size": 8}, "tokenid": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"text": Uint8Array.from([99, 104, 111, 105, 99, 101, 0]), "tokenid": i32(26)}), null, {})]));
function __cxx_static_address_4e75b2eacf7869195cc4dd22() {
  return __cxx_static_address_4e75b2eacf7869195cc4dd22.reference || (__cxx_static_address_4e75b2eacf7869195cc4dd22.reference = {
    __cReference: true,
    get value() { return newGameTokens; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/game.cpp:5314
export const newGameChoiceTokens = cByteRecordNDArray({"align": 8, "arrayAlign": 1, "fields": {"text": {"offset": 0, "pointer": true, "size": 8}, "tokenid": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, [5], {}, cStaticInitializerValues([cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"text": {"offset": 0, "pointer": true, "size": 8}, "tokenid": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"text": Uint8Array.from([110, 97, 109, 101, 0]), "tokenid": i32(27)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"text": {"offset": 0, "pointer": true, "size": 8}, "tokenid": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"text": Uint8Array.from([108, 111, 99, 107, 101, 100, 0]), "tokenid": i32(28)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"text": {"offset": 0, "pointer": true, "size": 8}, "tokenid": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"text": Uint8Array.from([104, 105, 100, 100, 101, 110, 0]), "tokenid": i32(29)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"text": {"offset": 0, "pointer": true, "size": 8}, "tokenid": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"text": Uint8Array.from([99, 104, 111, 105, 99, 101, 0]), "tokenid": i32(26)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"text": {"offset": 0, "pointer": true, "size": 8}, "tokenid": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"text": Uint8Array.from([117, 115, 101, 114, 99, 111, 110, 116, 101, 110, 116, 0]), "tokenid": i32(30)}), null, {})]));
function __cxx_static_address_c469a12350430ef4ea817193() {
  return __cxx_static_address_c469a12350430ef4ea817193.reference || (__cxx_static_address_c469a12350430ef4ea817193.reference = {
    __cReference: true,
    get value() { return newGameChoiceTokens; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/game.cpp:5386
export function newgamechoices_recursive_free(parent) {
  let entries = cRecordObject(cRecordPointer(parent, {"align": 8, "arrayAlign": 1, "fields": {"flags": {"native": "Uint8Array", "offset": 64, "size": 1}, "name": {"length": 64, "native": "Uint8Array", "offset": 0, "size": 64}, "subentries": {"offset": 72, "pointer": true, "size": 8}}, "overlaps": false, "prototype": "MenuGameplayEntry", "size": 80, "union": false}, {"MenuGameplayEntry": () => MenuGameplayEntry().prototype})).subentries;
  for (let i = i32(0); (i < 7); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; }))) {
    if ((cPointerElementRef(entries, i).value).subentries) {
      newgamechoices_recursive_free(cPointerOffset(entries, i, 80));
    }
  }
  do {
    xfree__header_25587e65bc1e(cRecordObject(cRecordPointer(parent, {"align": 8, "arrayAlign": 1, "fields": {"flags": {"native": "Uint8Array", "offset": 64, "size": 1}, "name": {"length": 64, "native": "Uint8Array", "offset": 0, "size": 64}, "subentries": {"offset": 72, "pointer": true, "size": 8}}, "overlaps": false, "prototype": "MenuGameplayEntry", "size": 80, "union": false}, {"MenuGameplayEntry": () => MenuGameplayEntry().prototype})).subentries);
    (cRecordObject(cRecordPointer(parent, {"align": 8, "arrayAlign": 1, "fields": {"flags": {"native": "Uint8Array", "offset": 64, "size": 1}, "name": {"length": 64, "native": "Uint8Array", "offset": 0, "size": 64}, "subentries": {"offset": 72, "pointer": true, "size": 8}}, "overlaps": false, "prototype": "MenuGameplayEntry", "size": 80, "union": false}, {"MenuGameplayEntry": () => MenuGameplayEntry().prototype})).subentries = null);
  } while (Boolean(0));
}

// C/C++ source: source/duke3d/src/game.cpp:5952
export function G_FreeHashAnim(arg0, key) {
  xfree__header_25587e65bc1e(cSourceAddresses.decode(key));
}

// C/C++ source: source/duke3d/src/game.cpp:6430
export function G_MaybeAllocPlayer(pnum) {
  if (cPointerCompare((cPointerElementRef(cRecordPointer(g_player, {"align": 1, "arrayAlign": 1, "fields": {"frags": {"length": 16, "native": "Uint8Array", "offset": 62, "size": 16}, "gotvote": {"native": "Uint8Array", "offset": 93, "size": 1}, "horizAngleAdjust": {"native": "Int32Array", "offset": 32, "size": 4}, "horizRecenter": {"native": "Int32Array", "offset": 28, "size": 4}, "horizSkew": {"native": "Int32Array", "offset": 36, "size": 4}, "input": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"bits": {"native": "Uint32Array", "offset": 0, "size": 4}, "extbits": {"native": "Uint32Array", "offset": 16, "size": 4}, "fvel": {"native": "Int16Array", "offset": 4, "size": 2}, "q16avel": {"native": "Int32Array", "offset": 8, "size": 4}, "q16horz": {"native": "Int32Array", "offset": 12, "size": 4}, "svel": {"native": "Int16Array", "offset": 6, "size": 2}}, "overlaps": false, "size": 20, "union": false}, "offset": 8}, "lastViewUpdate": {"native": "BigUint64Array", "offset": 40, "size": 8}, "netsynctime": {"native": "Int32Array", "offset": 48, "size": 4}, "pcolor": {"native": "Int32Array", "offset": 52, "size": 4}, "ping": {"native": "Int16Array", "offset": 60, "size": 2}, "pingcnt": {"native": "Uint8Array", "offset": 94, "size": 1}, "playerquitflag": {"native": "Uint8Array", "offset": 95, "size": 1}, "ps": {"offset": 0, "pointer": true, "size": 8}, "pteam": {"native": "Int32Array", "offset": 56, "size": 4}, "ready": {"native": "Uint8Array", "offset": 96, "size": 1}, "revision": {"native": "Uint32Array", "offset": 129, "size": 4}, "smoothcamera": {"native": "Uint8Array", "offset": 91, "size": 1}, "user_name": {"length": 32, "native": "Uint8Array", "offset": 97, "size": 32}, "vote": {"native": "Uint8Array", "offset": 92, "size": 1}, "wchoice": {"length": 13, "native": "Uint8Array", "offset": 78, "size": 13}}, "overlaps": false, "size": 133, "union": false}, {}), pnum).value).ps, null, "==")) {
    ((cPointerElementRef(cRecordPointer(g_player, {"align": 1, "arrayAlign": 1, "fields": {"frags": {"length": 16, "native": "Uint8Array", "offset": 62, "size": 16}, "gotvote": {"native": "Uint8Array", "offset": 93, "size": 1}, "horizAngleAdjust": {"native": "Int32Array", "offset": 32, "size": 4}, "horizRecenter": {"native": "Int32Array", "offset": 28, "size": 4}, "horizSkew": {"native": "Int32Array", "offset": 36, "size": 4}, "input": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"bits": {"native": "Uint32Array", "offset": 0, "size": 4}, "extbits": {"native": "Uint32Array", "offset": 16, "size": 4}, "fvel": {"native": "Int16Array", "offset": 4, "size": 2}, "q16avel": {"native": "Int32Array", "offset": 8, "size": 4}, "q16horz": {"native": "Int32Array", "offset": 12, "size": 4}, "svel": {"native": "Int16Array", "offset": 6, "size": 2}}, "overlaps": false, "size": 20, "union": false}, "offset": 8}, "lastViewUpdate": {"native": "BigUint64Array", "offset": 40, "size": 8}, "netsynctime": {"native": "Int32Array", "offset": 48, "size": 4}, "pcolor": {"native": "Int32Array", "offset": 52, "size": 4}, "ping": {"native": "Int16Array", "offset": 60, "size": 2}, "pingcnt": {"native": "Uint8Array", "offset": 94, "size": 1}, "playerquitflag": {"native": "Uint8Array", "offset": 95, "size": 1}, "ps": {"offset": 0, "pointer": true, "size": 8}, "pteam": {"native": "Int32Array", "offset": 56, "size": 4}, "ready": {"native": "Uint8Array", "offset": 96, "size": 1}, "revision": {"native": "Uint32Array", "offset": 129, "size": 4}, "smoothcamera": {"native": "Uint8Array", "offset": 91, "size": 1}, "user_name": {"length": 32, "native": "Uint8Array", "offset": 97, "size": 32}, "vote": {"native": "Uint8Array", "offset": 92, "size": 1}, "wchoice": {"length": 13, "native": "Uint8Array", "offset": 78, "size": 13}}, "overlaps": false, "size": 133, "union": false}, {}), pnum).value).ps = cRecordPointer(xcalloc__header_ccb5f0fe89eb(u64(1), 640), {"align": 1, "arrayAlign": 2, "fields": {"access_incs": {"native": "Uint8Array", "offset": 623, "size": 1}, "access_spritenum": {"native": "Int16Array", "offset": 504, "size": 2}, "access_wallnum": {"native": "Int16Array", "offset": 502, "size": 2}, "actors_killed": {"native": "Uint16Array", "offset": 134, "size": 2}, "actorsqu": {"native": "Int16Array", "offset": 528, "size": 2}, "aim_mode": {"native": "Uint8Array", "offset": 589, "size": 1}, "airleft": {"native": "Int16Array", "offset": 496, "size": 2}, "ammo_amount": {"length": 13, "native": "Int16Array", "offset": 438, "size": 26}, "auto_aim": {"native": "Uint8Array", "offset": 590, "size": 1}, "autostep": {"native": "Int32Array", "offset": 116, "size": 4}, "autostep_sbw": {"native": "Int32Array", "offset": 120, "size": 4}, "bobcounter": {"native": "Int16Array", "offset": 566, "size": 2}, "bobpos": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 48}, "buttonpalette": {"native": "Uint8Array", "offset": 607, "size": 1}, "cheat_phase": {"native": "Int8Array", "offset": 632, "size": 1}, "clipdist": {"native": "Int16Array", "offset": 580, "size": 2}, "crack_time": {"native": "Int16Array", "offset": 564, "size": 2}, "crouch_toggle": {"native": "Int8Array", "offset": 638, "size": 1}, "crouchspeedmodifier": {"native": "Int16Array", "offset": 386, "size": 2}, "crouchzincrement": {"native": "Int16Array", "offset": 384, "size": 2}, "curr_weapon": {"native": "Int8Array", "offset": 635, "size": 1}, "cursectnum": {"native": "Int16Array", "offset": 404, "size": 2}, "customexitsound": {"native": "Int16Array", "offset": 532, "size": 2}, "dead_flag": {"native": "Int16Array", "offset": 572, "size": 2}, "dummyplayersprite": {"native": "Int16Array", "offset": 524, "size": 2}, "extra_extra8": {"native": "Int16Array", "offset": 526, "size": 2}, "falling_counter": {"native": "Uint8Array", "offset": 617, "size": 1}, "filler": {"length": 100, "native": "Int16Array", "offset": 168, "size": 200}, "fist_incs": {"native": "Uint8Array", "offset": 627, "size": 1}, "floorzcutoff": {"native": "Int16Array", "offset": 370, "size": 2}, "floorzoffset": {"native": "Int16Array", "offset": 374, "size": 2}, "floorzrebound": {"native": "Int16Array", "offset": 368, "size": 2}, "footprintcount": {"native": "Uint8Array", "offset": 600, "size": 1}, "footprintpal": {"native": "Uint8Array", "offset": 613, "size": 1}, "footprintshade": {"native": "Uint8Array", "offset": 618, "size": 1}, "frag": {"native": "Uint16Array", "offset": 140, "size": 2}, "frag_ps": {"native": "Uint8Array", "offset": 596, "size": 1}, "fraggedself": {"native": "Uint16Array", "offset": 142, "size": 2}, "fric": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 56}, "fta": {"native": "Int16Array", "offset": 498, "size": 2}, "ftq": {"native": "Int16Array", "offset": 500, "size": 2}, "gm": {"native": "Uint8Array", "offset": 598, "size": 1}, "got_access": {"native": "Int16Array", "offset": 506, "size": 2}, "gotweapon": {"native": "Uint16Array", "offset": 136, "size": 2}, "gravity": {"native": "Int16Array", "offset": 398, "size": 2}, "hard_landing": {"native": "Uint8Array", "offset": 626, "size": 1}, "hbomb_hold_delay": {"native": "Uint8Array", "offset": 595, "size": 1}, "hbomb_on": {"native": "Uint8Array", "offset": 602, "size": 1}, "heat_on": {"native": "Uint8Array", "offset": 614, "size": 1}, "holoduke_on": {"native": "Int16Array", "offset": 574, "size": 2}, "holster_weapon": {"native": "Uint8Array", "offset": 616, "size": 1}, "hurt_delay": {"native": "Uint8Array", "offset": 601, "size": 1}, "i": {"native": "Int16Array", "offset": 516, "size": 2}, "interface_toggle": {"native": "Uint32Array", "offset": 124, "size": 4}, "inv_amount": {"length": 11, "native": "Int16Array", "offset": 464, "size": 22}, "invdisptime": {"native": "Uint8Array", "offset": 615, "size": 1}, "inven_icon": {"native": "Uint8Array", "offset": 606, "size": 1}, "jetpack_on": {"native": "Uint8Array", "offset": 610, "size": 1}, "jetpackzincrement": {"native": "Int16Array", "offset": 396, "size": 2}, "jumping_counter": {"native": "Int16Array", "offset": 494, "size": 2}, "jumping_toggle": {"native": "Uint8Array", "offset": 603, "size": 1}, "kickback_pic": {"native": "Uint8Array", "offset": 597, "size": 1}, "knee_incs": {"native": "Uint8Array", "offset": 622, "size": 1}, "knuckle_incs": {"native": "Uint8Array", "offset": 621, "size": 1}, "last_extra": {"native": "Int16Array", "offset": 408, "size": 2}, "last_full_weapon": {"native": "Uint8Array", "offset": 619, "size": 1}, "last_pissed_time": {"native": "Int16Array", "offset": 534, "size": 2}, "last_quick_kick": {"native": "Uint8Array", "offset": 585, "size": 1}, "last_used_weapon": {"native": "Int8Array", "offset": 637, "size": 1}, "last_weapon": {"native": "Int8Array", "offset": 631, "size": 1}, "loogcnt": {"native": "Int8Array", "offset": 629, "size": 1}, "loogie": {"dims": [6], "offset": 144, "recordArray": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, "size": 24}, "look_ang": {"native": "Int16Array", "offset": 406, "size": 2}, "max_actors_killed": {"native": "Uint16Array", "offset": 132, "size": 2}, "max_ammo_amount": {"length": 13, "native": "Int16Array", "offset": 412, "size": 26}, "max_player_health": {"native": "Int32Array", "offset": 108, "size": 4}, "max_secret_rooms": {"native": "Uint8Array", "offset": 582, "size": 1}, "max_shield_amount": {"native": "Int32Array", "offset": 112, "size": 4}, "maxswimzvel": {"native": "Int16Array", "offset": 394, "size": 2}, "minswimzvel": {"native": "Int16Array", "offset": 392, "size": 2}, "minwaterzdist": {"native": "Int16Array", "offset": 378, "size": 2}, "movement_lock": {"native": "Uint8Array", "offset": 592, "size": 1}, "newowner": {"native": "Int16Array", "offset": 492, "size": 2}, "npos": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 36}, "numloogs": {"native": "Int8Array", "offset": 628, "size": 1}, "olook_ang": {"native": "Int16Array", "offset": 372, "size": 2}, "on_crane": {"native": "Int16Array", "offset": 514, "size": 2}, "on_ground": {"native": "Uint8Array", "offset": 605, "size": 1}, "on_warping_sector": {"native": "Uint8Array", "offset": 599, "size": 1}, "one_eighty_count": {"native": "Int16Array", "offset": 522, "size": 2}, "opos": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 12}, "opyoff": {"native": "Int16Array", "offset": 490, "size": 2}, "oq16ang": {"native": "Int32Array", "offset": 84, "size": 4}, "oq16horiz": {"native": "Int32Array", "offset": 72, "size": 4}, "oq16horizoff": {"native": "Int32Array", "offset": 76, "size": 4}, "orotscrnang": {"native": "Int16Array", "offset": 568, "size": 2}, "over_shoulder_on": {"native": "Uint8Array", "offset": 608, "size": 1}, "padding_": {"length": 1, "native": "Int8Array", "offset": 639, "size": 1}, "palette": {"native": "Uint8Array", "offset": 636, "size": 1}, "palookup": {"native": "Uint8Array", "offset": 625, "size": 1}, "pals": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"b": {"native": "Uint8Array", "offset": 2, "size": 1}, "f": {"native": "Uint8Array", "offset": 3, "size": 1}, "g": {"native": "Uint8Array", "offset": 1, "size": 1}, "r": {"native": "Uint8Array", "offset": 0, "size": 1}}, "overlaps": false, "size": 4, "union": false}, "offset": 128}, "parallax_sectnum": {"native": "Int16Array", "offset": 518, "size": 2}, "player_par": {"native": "Int32Array", "offset": 100, "size": 4}, "pos": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}, "pycount": {"native": "Int16Array", "offset": 576, "size": 2}, "pyoff": {"native": "Int16Array", "offset": 488, "size": 2}, "q16ang": {"native": "Int32Array", "offset": 80, "size": 4}, "q16angvel": {"native": "Int32Array", "offset": 88, "size": 4}, "q16horiz": {"native": "Int32Array", "offset": 64, "size": 4}, "q16horizoff": {"native": "Int32Array", "offset": 68, "size": 4}, "quick_kick": {"native": "Uint8Array", "offset": 584, "size": 1}, "random_club_frame": {"native": "Int16Array", "offset": 520, "size": 2}, "rapid_fire_hold": {"native": "Uint8Array", "offset": 604, "size": 1}, "reloading": {"native": "Uint8Array", "offset": 587, "size": 1}, "return_to_center": {"native": "Uint8Array", "offset": 586, "size": 1}, "rotscrnang": {"native": "Int16Array", "offset": 570, "size": 2}, "runspeed": {"native": "Int32Array", "offset": 104, "size": 4}, "sbs": {"native": "Int16Array", "offset": 400, "size": 2}, "scream_voice": {"native": "Int8Array", "offset": 630, "size": 1}, "scuba_on": {"native": "Uint8Array", "offset": 612, "size": 1}, "secret_rooms": {"native": "Uint8Array", "offset": 583, "size": 1}, "show_empty_weapon": {"native": "Uint8Array", "offset": 609, "size": 1}, "shrunkzoffset": {"native": "Int16Array", "offset": 382, "size": 2}, "somethingonplayer": {"native": "Int16Array", "offset": 512, "size": 2}, "sound_pitch": {"native": "Int16Array", "offset": 402, "size": 2}, "spritebridge": {"native": "Uint8Array", "offset": 611, "size": 1}, "spritezoffset": {"native": "Int16Array", "offset": 376, "size": 2}, "subweapon": {"native": "Int16Array", "offset": 410, "size": 2}, "swimspeedmodifier": {"native": "Int16Array", "offset": 388, "size": 2}, "swimzincrement": {"native": "Int16Array", "offset": 390, "size": 2}, "team": {"native": "Uint8Array", "offset": 593, "size": 1}, "timebeforeexit": {"native": "Int16Array", "offset": 530, "size": 2}, "tipincs": {"native": "Uint8Array", "offset": 594, "size": 1}, "toggle_key_flag": {"native": "Uint8Array", "offset": 620, "size": 1}, "transporter_hold": {"native": "Int16Array", "offset": 578, "size": 2}, "truecz": {"native": "Int32Array", "offset": 96, "size": 4}, "truefz": {"native": "Int32Array", "offset": 92, "size": 4}, "vel": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 24}, "visibility": {"native": "Int16Array", "offset": 510, "size": 2}, "wackedbyactor": {"native": "Int16Array", "offset": 486, "size": 2}, "walking_snd_toggle": {"native": "Uint8Array", "offset": 624, "size": 1}, "wantweaponfire": {"native": "Int8Array", "offset": 634, "size": 1}, "waterzoffset": {"native": "Int16Array", "offset": 380, "size": 2}, "weapon_ang": {"native": "Int16Array", "offset": 508, "size": 2}, "weapon_pos": {"native": "Int8Array", "offset": 633, "size": 1}, "weapon_sway": {"native": "Int16Array", "offset": 562, "size": 2}, "weaponswitch": {"native": "Uint8Array", "offset": 591, "size": 1}, "weapreccnt": {"native": "Uint8Array", "offset": 588, "size": 1}, "weaprecs": {"length": 13, "native": "Int16Array", "offset": 536, "size": 26}, "zoom": {"native": "Uint16Array", "offset": 138, "size": 2}}, "overlaps": true, "size": 640, "union": false}, {}));
  }
}

// C/C++ source: source/duke3d/src/game.cpp:6570
const __cxx_literal_a720ca6149f5dd46f45d = Uint8Array.from([86, 77, 0]);
const __cxx_literal_d9a8a28337e22f25deb6 = Uint8Array.from([67, 79, 78, 0]);
export function dukeVerbosityCallback(verbosity) {
  switch (verbosity) {
    default: {
      return null;
    }
    case i32(9): {
      return __cxx_literal_a720ca6149f5dd46f45d;
    }
    case i32(10): {
      return __cxx_literal_d9a8a28337e22f25deb6;
    }
  }
}

// C/C++ source: source/build/include/compat.h:1169
export const pow2char__header_global_ba4e5a8bedb79825 = new Uint8Array([(u32(1) & 255), (u32(2) & 255), (u32(4) & 255), (u32(8) & 255), (u32(16) & 255), (u32(32) & 255), (u32(64) & 255), (u32(128) & 255)]);
function __cxx_static_address_cbe6556703d9bc46f2656bb8() {
  return __cxx_static_address_cbe6556703d9bc46f2656bb8.reference || (__cxx_static_address_cbe6556703d9bc46f2656bb8.reference = {
    __cReference: true,
    get value() { return pow2char__header_global_ba4e5a8bedb79825; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_cbe6556703d9bc46f2656bb8() { return __cxx_static_address_cbe6556703d9bc46f2656bb8(); }

// C/C++ source: source/build/include/baselayer.h:172
export const g_defaultVideoModes__header_global_cb710d580b9a9525 = cByteRecordNDArray({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, [25], {}, cStaticInitializerValues([cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 2560, "y": 1440}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 2560, "y": 1200}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 2560, "y": 1080}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1920, "y": 1440}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1920, "y": 1200}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1920, "y": 1080}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1680, "y": 1050}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1600, "y": 1200}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1600, "y": 900}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1366, "y": 768}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1280, "y": 1024}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1280, "y": 960}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1280, "y": 720}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1152, "y": 864}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1024, "y": 768}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1024, "y": 600}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 800, "y": 600}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 640, "y": 480}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 640, "y": 400}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 512, "y": 384}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 480, "y": 360}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 400, "y": 300}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 320, "y": 240}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 320, "y": 200}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 0, "y": 0}), null, {})]));
function __cxx_static_address_1973e917add904285b294912() {
  return __cxx_static_address_1973e917add904285b294912.reference || (__cxx_static_address_1973e917add904285b294912.reference = {
    __cReference: true,
    get value() { return g_defaultVideoModes__header_global_cb710d580b9a9525; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:188
export const g_keyAsciiTable__header_global_3f8fcdb3c8550dee = new Uint8Array([(u32(0) & 255), (u32(0) & 255), 49, 50, 51, 52, 53, 54, 55, 56, 57, 48, 45, 61, (u32(0) & 255), (u32(0) & 255), 113, 119, 101, 114, 116, 121, 117, 105, 111, 112, 91, 93, (u32(0) & 255), (u32(0) & 255), 97, 115, 100, 102, 103, 104, 106, 107, 108, 59, (u32(39) & 255), 96, (u32(0) & 255), (u32(92) & 255), 122, 120, 99, 118, 98, 110, 109, 44, 46, 47, (u32(0) & 255), 42, (u32(0) & 255), (u32(32) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), 55, 56, 57, 45, 52, 53, 54, 43, 49, 50, 51, 48, 46, (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255)]);
function __cxx_static_address_266fdb1de99493e32c6a9b8a() {
  return __cxx_static_address_266fdb1de99493e32c6a9b8a.reference || (__cxx_static_address_266fdb1de99493e32c6a9b8a.reference = {
    __cReference: true,
    get value() { return g_keyAsciiTable__header_global_3f8fcdb3c8550dee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_266fdb1de99493e32c6a9b8a() { return __cxx_static_address_266fdb1de99493e32c6a9b8a(); }

// C/C++ source: source/build/include/baselayer.h:196
export const g_keyAsciiTableShift__header_global_3ea219c88f22903b = new Uint8Array([(u32(0) & 255), (u32(0) & 255), 33, 64, 35, 36, 37, 94, 38, 42, 40, 41, 95, 43, (u32(0) & 255), (u32(0) & 255), 81, 87, 69, 82, 84, 89, 85, 73, 79, 80, 123, 125, (u32(0) & 255), (u32(0) & 255), 65, 83, 68, 70, 71, 72, 74, 75, 76, 58, 34, 126, (u32(0) & 255), 124, 90, 88, 67, 86, 66, 78, 77, 60, 62, 63, (u32(0) & 255), 42, (u32(0) & 255), (u32(32) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), 55, 56, 57, 45, 52, 53, 54, 43, 49, 50, 51, 48, 46, (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255)]);
function __cxx_static_address_5b3dbf744bbb9524a5ed0c02() {
  return __cxx_static_address_5b3dbf744bbb9524a5ed0c02.reference || (__cxx_static_address_5b3dbf744bbb9524a5ed0c02.reference = {
    __cReference: true,
    get value() { return g_keyAsciiTableShift__header_global_3ea219c88f22903b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_5b3dbf744bbb9524a5ed0c02() { return __cxx_static_address_5b3dbf744bbb9524a5ed0c02(); }

// C/C++ source: source/build/include/build.h:895
export const pow2long__header_global_d7c11c7ee68d3df0 = new Int32Array([1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144, 524288, 1048576, 2097152, 4194304, 8388608, 16777216, 33554432, 67108864, 134217728, 268435456, 536870912, 1073741824, 2147483647]);
function __cxx_static_address_b21c40ff54b8ebb1f1858f9e() {
  return __cxx_static_address_b21c40ff54b8ebb1f1858f9e.reference || (__cxx_static_address_b21c40ff54b8ebb1f1858f9e.reference = {
    __cReference: true,
    get value() { return pow2long__header_global_d7c11c7ee68d3df0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_b21c40ff54b8ebb1f1858f9e() { return __cxx_static_address_b21c40ff54b8ebb1f1858f9e(); }

// C/C++ source: source/build/include/build.h:907
export const pow2ulong__header_global_1beb70803868ef5c = new Uint32Array([u32(1), u32(2), u32(4), u32(8), u32(16), u32(32), u32(64), u32(128), u32(256), u32(512), u32(1024), u32(2048), u32(4096), u32(8192), u32(16384), u32(32768), u32(65536), u32(131072), u32(262144), u32(524288), u32(1048576), u32(2097152), u32(4194304), u32(8388608), u32(16777216), u32(33554432), u32(67108864), u32(134217728), u32(268435456), u32(536870912), u32(1073741824), u32(2147483648n)]);
function __cxx_static_address_268865744154838b0d2cf8c3() {
  return __cxx_static_address_268865744154838b0d2cf8c3.reference || (__cxx_static_address_268865744154838b0d2cf8c3.reference = {
    __cReference: true,
    get value() { return pow2ulong__header_global_1beb70803868ef5c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_268865744154838b0d2cf8c3() { return __cxx_static_address_268865744154838b0d2cf8c3(); }

// C/C++ source: source/build/include/build.h:919
export const pow264__header_global_1f36195f2c17ca0f = new BigInt64Array([BigInt(i64(1)), BigInt(i64(2)), BigInt(i64(4)), BigInt(i64(8)), BigInt(i64(16)), BigInt(i64(32)), BigInt(i64(64)), BigInt(i64(128)), BigInt(i64(256)), BigInt(i64(512)), BigInt(i64(1024)), BigInt(i64(2048)), BigInt(i64(4096)), BigInt(i64(8192)), BigInt(i64(16384)), BigInt(i64(32768)), BigInt(i64(65536)), BigInt(i64(131072)), BigInt(i64(262144)), BigInt(i64(524288)), BigInt(i64(1048576)), BigInt(i64(2097152)), BigInt(i64(4194304)), BigInt(i64(8388608)), BigInt(i64(16777216)), BigInt(i64(33554432)), BigInt(i64(67108864)), BigInt(i64(134217728)), BigInt(i64(268435456)), BigInt(i64(536870912)), BigInt(i64(1073741824)), BigInt(2147483648n), BigInt(4294967296n), BigInt(8589934592n), BigInt(17179869184n), BigInt(34359738368n), BigInt(68719476736n), BigInt(137438953472n), BigInt(274877906944n), BigInt(549755813888n), BigInt(1099511627776n), BigInt(2199023255552n), BigInt(4398046511104n), BigInt(8796093022208n), BigInt(17592186044416n), BigInt(35184372088832n), BigInt(70368744177664n), BigInt(140737488355328n), BigInt(281474976710656n), BigInt(562949953421312n), BigInt(1125899906842624n), BigInt(2251799813685248n), BigInt(4503599627370496n), BigInt(9007199254740992n), BigInt(18014398509481984n), BigInt(36028797018963968n), BigInt(72057594037927936n), BigInt(144115188075855872n), BigInt(288230376151711744n), BigInt(576460752303423488n), BigInt(1152921504606846976n), BigInt(2305843009213693952n), BigInt(4611686018427387904n), BigInt(9223372036854775807n)]);
function __cxx_static_address_f1fd465bc4486382d4db784d() {
  return __cxx_static_address_f1fd465bc4486382d4db784d.reference || (__cxx_static_address_f1fd465bc4486382d4db784d.reference = {
    __cReference: true,
    get value() { return pow264__header_global_1f36195f2c17ca0f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_f1fd465bc4486382d4db784d() { return __cxx_static_address_f1fd465bc4486382d4db784d(); }

// C/C++ source: source/mact/include/keyboard.h:47
export const sctokeylut__header_global_d8327b8451131bda = cByteRecordNDArray({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, [102], {}, cStaticInitializerValues([cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([69, 115, 99, 97, 112, 101, 0]), "sc": (u32(1) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([49, 0]), "sc": (u32(2) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([50, 0]), "sc": (u32(3) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([51, 0]), "sc": (u32(4) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([52, 0]), "sc": (u32(5) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([53, 0]), "sc": (u32(6) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([54, 0]), "sc": (u32(7) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([55, 0]), "sc": (u32(8) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([56, 0]), "sc": (u32(9) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([57, 0]), "sc": (u32(10) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([48, 0]), "sc": (u32(11) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([45, 0]), "sc": (u32(12) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([61, 0]), "sc": (u32(13) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([66, 97, 107, 83, 112, 99, 0]), "sc": (u32(14) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([84, 97, 98, 0]), "sc": (u32(15) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([81, 0]), "sc": (u32(16) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([87, 0]), "sc": (u32(17) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([69, 0]), "sc": (u32(18) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([82, 0]), "sc": (u32(19) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([84, 0]), "sc": (u32(20) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([89, 0]), "sc": (u32(21) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([85, 0]), "sc": (u32(22) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([73, 0]), "sc": (u32(23) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([79, 0]), "sc": (u32(24) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([80, 0]), "sc": (u32(25) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([91, 0]), "sc": (u32(26) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([93, 0]), "sc": (u32(27) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([69, 110, 116, 101, 114, 0]), "sc": (u32(28) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([76, 67, 116, 114, 108, 0]), "sc": (u32(29) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([65, 0]), "sc": (u32(30) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([83, 0]), "sc": (u32(31) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([68, 0]), "sc": (u32(32) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 0]), "sc": (u32(33) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([71, 0]), "sc": (u32(34) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([72, 0]), "sc": (u32(35) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([74, 0]), "sc": (u32(36) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 0]), "sc": (u32(37) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([76, 0]), "sc": (u32(38) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([59, 0]), "sc": (u32(39) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([39, 0]), "sc": (u32(40) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([96, 0]), "sc": (u32(41) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([76, 83, 104, 105, 102, 116, 0]), "sc": (u32(42) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([66, 97, 99, 107, 115, 108, 97, 115, 104, 0]), "sc": (u32(43) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([90, 0]), "sc": (u32(44) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([88, 0]), "sc": (u32(45) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([67, 0]), "sc": (u32(46) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([86, 0]), "sc": (u32(47) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([66, 0]), "sc": (u32(48) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([78, 0]), "sc": (u32(49) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([77, 0]), "sc": (u32(50) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([44, 0]), "sc": (u32(51) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([46, 0]), "sc": (u32(52) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([47, 0]), "sc": (u32(53) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([82, 83, 104, 105, 102, 116, 0]), "sc": (u32(54) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 42, 0]), "sc": (u32(55) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([76, 65, 108, 116, 0]), "sc": (u32(56) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([83, 112, 97, 99, 101, 0]), "sc": (u32(57) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([67, 97, 112, 76, 99, 107, 0]), "sc": (u32(58) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 49, 0]), "sc": (u32(59) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 50, 0]), "sc": (u32(60) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 51, 0]), "sc": (u32(61) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 52, 0]), "sc": (u32(62) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 53, 0]), "sc": (u32(63) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 54, 0]), "sc": (u32(64) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 55, 0]), "sc": (u32(65) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 56, 0]), "sc": (u32(66) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 57, 0]), "sc": (u32(67) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 49, 48, 0]), "sc": (u32(68) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([78, 117, 109, 76, 99, 107, 0]), "sc": (u32(69) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([83, 99, 114, 76, 99, 107, 0]), "sc": (u32(70) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 55, 0]), "sc": (u32(71) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 56, 0]), "sc": (u32(72) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 57, 0]), "sc": (u32(73) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 45, 0]), "sc": (u32(74) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 52, 0]), "sc": (u32(75) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 53, 0]), "sc": (u32(76) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 54, 0]), "sc": (u32(77) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 43, 0]), "sc": (u32(78) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 49, 0]), "sc": (u32(79) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 50, 0]), "sc": (u32(80) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 51, 0]), "sc": (u32(81) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 48, 0]), "sc": (u32(82) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 46, 0]), "sc": (u32(83) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([76, 101, 115, 115, 84, 104, 97, 110, 0]), "sc": (u32(86) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 49, 49, 0]), "sc": (u32(87) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 49, 50, 0]), "sc": (u32(88) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 100, 69, 110, 116, 0]), "sc": (u32(156) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([82, 67, 116, 114, 108, 0]), "sc": (u32(157) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 47, 0]), "sc": (u32(181) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([82, 65, 108, 116, 0]), "sc": (u32(184) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([80, 114, 116, 83, 99, 110, 0]), "sc": (u32(183) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([80, 97, 117, 115, 101, 0]), "sc": (u32(197) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([72, 111, 109, 101, 0]), "sc": (u32(199) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([85, 112, 0]), "sc": (u32(200) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([80, 103, 85, 112, 0]), "sc": (u32(201) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([76, 101, 102, 116, 0]), "sc": (u32(203) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([82, 105, 103, 104, 116, 0]), "sc": (u32(205) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([69, 110, 100, 0]), "sc": (u32(207) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([68, 111, 119, 110, 0]), "sc": (u32(208) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([80, 103, 68, 110, 0]), "sc": (u32(209) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([73, 110, 115, 101, 114, 116, 0]), "sc": (u32(210) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([68, 101, 108, 101, 116, 101, 0]), "sc": (u32(211) & 255)}), null, {})]));
function __cxx_static_address_592a85812ab0ec80dd31a164() {
  return __cxx_static_address_592a85812ab0ec80dd31a164.reference || (__cxx_static_address_592a85812ab0ec80dd31a164.reference = {
    __cReference: true,
    get value() { return sctokeylut__header_global_d8327b8451131bda; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/game.cpp:1608
export function tileGetMapping__header_4ce924747fea(tile) {
  let found = i32(inthash_find(__cxx_global_cell_a98bb585faaf2a8f60d62e9a().value, i64(tile)));
  return i32(((found != (-1)) ? found : tile));
}

// C/C++ source: source/duke3d/src/game.cpp:1367
export function engineDestroyAllocator__header_30442726231d() {
  Destroy__cxx_static_777d0ae31c789182(__cxx_global_cell_11016d3c7177543e564ab46c().value);
}

// C/C++ source: source/duke3d/src/game.cpp:321
export function klabs__header_ba1b16eb9e0d(a) {
  return i32(__builtin_abs(a));
}

export function mulscale28__header_720cded9c90d(eax, edx) {
  return i32(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) >> BigInt(i32((u32((u32(28) & 255)) & 255))))));
}

export function divscale16__header_f6da3b48adba(eax, ebx) {
  return i32(divscale__header_c72624098a8a(eax, ebx, 16));
}

export function mulscale16__header_f97b38ea5f11(eax, edx) {
  return i32(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) >> BigInt(i32((u32((u32(16) & 255)) & 255))))));
}

// C/C++ source: @sysroot/usr/include/c++/12/bits/stl_algobase.h:230
export function min__template_774131ccff66371d(__a, __b) {
  if ((__b.value < __a.value)) {
    return __b;
  }
  return __a;
}

// C/C++ source: source/duke3d/src/game.cpp:157
export function Duke_ApplySpritePropertiesToTSprite__header_f55df38813a8(tspr, spr) {



  let cstat = (u32(cRecordObject(cRecordPointer(spr, {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xyz": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "__cxx_anonymous_15": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"xvel": {"native": "Int16Array", "offset": 0, "size": 2}, "yvel": {"native": "Int16Array", "offset": 2, "size": 2}, "zvel": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "vel": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}, "z": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"d": {"native": "Int16Array", "offset": 0, "size": 2}, "u": {"native": "Int16Array", "offset": 2, "size": 2}, "v": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 0}}, "overlaps": true, "size": 6, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 32}, "ang": {"native": "Int16Array", "offset": 28, "size": 2}, "blend": {"native": "Uint8Array", "offset": 19, "size": 1}, "clipdist": {"native": "Uint8Array", "offset": 18, "size": 1}, "cstat": {"native": "Uint16Array", "offset": 12, "size": 2}, "extra": {"native": "Int16Array", "offset": 42, "size": 2}, "hitag": {"native": "Int16Array", "offset": 40, "size": 2}, "lotag": {"native": "Int16Array", "offset": 38, "size": 2}, "owner": {"native": "Int16Array", "offset": 30, "size": 2}, "pal": {"native": "Uint8Array", "offset": 17, "size": 1}, "picnum": {"native": "Int16Array", "offset": 14, "size": 2}, "sectnum": {"native": "Int16Array", "offset": 24, "size": 2}, "shade": {"native": "Int8Array", "offset": 16, "size": 1}, "statnum": {"native": "Int16Array", "offset": 26, "size": 2}, "xoffset": {"native": "Int8Array", "offset": 22, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 20, "size": 1}, "yoffset": {"native": "Int8Array", "offset": 23, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 21, "size": 1}}, "overlaps": true, "size": 44, "union": false}, {})).cstat) & 65535);
  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = (u32((__cxx_lvalue_0.value | i32((i32((i32((i32(cstat) & i32(1024))) >> 9)) | i32((i32((i32(cstat) & i32((i32(8192) | i32(16384))))) >> 11)))))) & 255)))(cObjectFieldRef(cRecordObject(cRecordPointer(tspr, {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xyz": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "__cxx_anonymous_15": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"xvel": {"native": "Int16Array", "offset": 0, "size": 2}, "yvel": {"native": "Int16Array", "offset": 2, "size": 2}, "zvel": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "vel": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}, "z": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"d": {"native": "Int16Array", "offset": 0, "size": 2}, "u": {"native": "Int16Array", "offset": 2, "size": 2}, "v": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 0}}, "overlaps": true, "size": 6, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 32}, "ang": {"native": "Int16Array", "offset": 28, "size": 2}, "blend": {"native": "Uint8Array", "offset": 19, "size": 1}, "clipdist": {"native": "Uint8Array", "offset": 18, "size": 1}, "cstat": {"native": "Uint16Array", "offset": 12, "size": 2}, "extra": {"native": "Int16Array", "offset": 42, "size": 2}, "hitag": {"native": "Int16Array", "offset": 40, "size": 2}, "lotag": {"native": "Int16Array", "offset": 38, "size": 2}, "owner": {"native": "Int16Array", "offset": 30, "size": 2}, "pal": {"native": "Uint8Array", "offset": 17, "size": 1}, "picnum": {"native": "Int16Array", "offset": 14, "size": 2}, "sectnum": {"native": "Int16Array", "offset": 24, "size": 2}, "shade": {"native": "Int8Array", "offset": 16, "size": 1}, "statnum": {"native": "Int16Array", "offset": 26, "size": 2}, "xoffset": {"native": "Int8Array", "offset": 22, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 20, "size": 1}, "yoffset": {"native": "Int8Array", "offset": 23, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 21, "size": 1}}, "overlaps": true, "size": 44, "union": false}, {})), "clipdist"));
}

export function bitmap_test__header_9187d8b27cd5(ptr, n) {

  return Boolean((i32((i32((cDeref(cPointerOffset(ptr, i32((n >> 3)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & i32((cDeref(cPointerOffset(pow2char__header_global_ba4e5a8bedb79825, i32((n & 7)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))) == i32((cDeref(cPointerOffset(pow2char__header_global_ba4e5a8bedb79825, i32((n & 7)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value))));
}

// C/C++ source: source/duke3d/src/game.cpp:42
export function fix16_to_int__header_e5543c7659b8(a) {
  return i32(Math.trunc(i32((a + ((a >= 0) ? fix16_half__header_global_02a9a2d25f5c82a5 : (-fix16_half__header_global_02a9a2d25f5c82a5)))) / fix16_one__header_global_49e594ecaa72fc74));
}

export function bitmap_clear__header_03f32c4c9b40(ptr, n) {

  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = (u32((__cxx_lvalue_0.value & (~i32((cDeref(cPointerOffset(pow2char__header_global_ba4e5a8bedb79825, i32((n & 7)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value))))) & 255)))(cDeref(cPointerOffset(ptr, i32((n >> 3)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array));
}

// C/C++ source: source/duke3d/src/game.cpp:1079
export function videoGetRenderMode__header_0ef762c67d49() {
  return i32(0);
}

export function clamp__header_0915f0c9d86f(__cxx_in, min, max) {
  return ((u32(((i32(__cxx_in) <= i32(((u32(((u32(min) << 16) >> 16)) << 16) >> 16))) ? ((u32(((u32(min) << 16) >> 16)) << 16) >> 16) : ((i32(__cxx_in) >= i32(((u32(((u32(max) << 16) >> 16)) << 16) >> 16))) ? ((u32(((u32(max) << 16) >> 16)) << 16) >> 16) : __cxx_in))) << 16) >> 16);
}

// C/C++ source: source/duke3d/src/game.cpp:46
export function fix16_from_int__header_a4fc00426563(a) {
  return i32(Math.imul(a, fix16_one__header_global_49e594ecaa72fc74));
}

export function divscale22__header_dfc973511742(eax, ebx) {
  return i32(divscale__header_c72624098a8a(eax, ebx, 22));
}

// C/C++ source: source/duke3d/src/game.cpp:66
export function fix16_clamp__header_15c51fe79beb(x, lo, hi) {
  return i32(clamp__header_7e65ff40578f(x, lo, hi));
}

// C/C++ source: source/duke3d/src/game.cpp:380
export function swapbufreverse__header_4269a1f15261(s, d, c) {
  let src = cTypedPointer(s, Uint8Array);
  let dst = cTypedPointer(d, Uint8Array);
  (c >= 4);
  do {
    swap__header_fa4b97c5d52d(dst, src);
    swap__header_fa4b97c5d52d(cPointerOffset(dst, 1, Uint8Array.BYTES_PER_ELEMENT), cPointerOffset(src, -(1), Uint8Array.BYTES_PER_ELEMENT));
    swap__header_fa4b97c5d52d(cPointerOffset(dst, 2, Uint8Array.BYTES_PER_ELEMENT), cPointerOffset(src, -(2), Uint8Array.BYTES_PER_ELEMENT));
    swap__header_fa4b97c5d52d(cPointerOffset(dst, 3, Uint8Array.BYTES_PER_ELEMENT), cPointerOffset(src, -(3), Uint8Array.BYTES_PER_ELEMENT));
    ((dst = cPointerOffset(dst, 4, Uint8Array.BYTES_PER_ELEMENT)), (src = cPointerOffset(src, -(4), Uint8Array.BYTES_PER_ELEMENT)));
  } while (((c = i32((Number(c) - Number(4)))) > 4));
  while (Boolean(((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous - 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => c, __cxx_lvalue_1 => { c = __cxx_lvalue_1; })))) {
    swap__header_fa4b97c5d52d(((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_2.value = next; return previous; })(cRef(() => dst, __cxx_lvalue_3 => { dst = __cxx_lvalue_3; })), ((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = cPointerOffset(previous, -1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_4.value = next; return previous; })(cRef(() => src, __cxx_lvalue_5 => { src = __cxx_lvalue_5; })));
  }
}

export function swap__header_fa4b97c5d52d(a, b) {
  let t = (u32((cDeref(a, Uint8Array).value)) & 255);
  ((cDeref(a, Uint8Array).value) = (u32((cDeref(b, Uint8Array).value)) & 255));
  ((cDeref(b, Uint8Array).value) = (u32(t) & 255));
}

// C/C++ source: source/duke3d/src/game.cpp:443
export function P_Get__header_3382e5673ae1(spriteNum) {
  return i32(P_GetP__header_5ca4a2fe56be(cRecordPointer(cPointerOffset(__cxx_global_cell_4a046e33ecf7aced9bfd0007().value, spriteNum, 44), {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xyz": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "__cxx_anonymous_15": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"xvel": {"native": "Int16Array", "offset": 0, "size": 2}, "yvel": {"native": "Int16Array", "offset": 2, "size": 2}, "zvel": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "vel": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}, "z": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"d": {"native": "Int16Array", "offset": 0, "size": 2}, "u": {"native": "Int16Array", "offset": 2, "size": 2}, "v": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 0}}, "overlaps": true, "size": 6, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 32}, "ang": {"native": "Int16Array", "offset": 28, "size": 2}, "blend": {"native": "Uint8Array", "offset": 19, "size": 1}, "clipdist": {"native": "Uint8Array", "offset": 18, "size": 1}, "cstat": {"native": "Uint16Array", "offset": 12, "size": 2}, "extra": {"native": "Int16Array", "offset": 42, "size": 2}, "hitag": {"native": "Int16Array", "offset": 40, "size": 2}, "lotag": {"native": "Int16Array", "offset": 38, "size": 2}, "owner": {"native": "Int16Array", "offset": 30, "size": 2}, "pal": {"native": "Uint8Array", "offset": 17, "size": 1}, "picnum": {"native": "Int16Array", "offset": 14, "size": 2}, "sectnum": {"native": "Int16Array", "offset": 24, "size": 2}, "shade": {"native": "Int8Array", "offset": 16, "size": 1}, "statnum": {"native": "Int16Array", "offset": 26, "size": 2}, "xoffset": {"native": "Int8Array", "offset": 22, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 20, "size": 1}, "yoffset": {"native": "Int8Array", "offset": 23, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 21, "size": 1}}, "overlaps": true, "size": 44, "union": false}, {})));
}

export function bitmap_set__header_c55045fa1bbe(ptr, n) {

  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = (u32((__cxx_lvalue_0.value | i32((cDeref(cPointerOffset(pow2char__header_global_ba4e5a8bedb79825, i32((n & 7)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))) & 255)))(cDeref(cPointerOffset(ptr, i32((n >> 3)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array));
}

// C/C++ source: source/duke3d/src/game.cpp:422
export function P_GetP__header_5ca4a2fe56be(pSprite) {
  (i32(cRecordObject(cRecordPointer(cRecordPointer(pSprite, {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xyz": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "__cxx_anonymous_15": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"xvel": {"native": "Int16Array", "offset": 0, "size": 2}, "yvel": {"native": "Int16Array", "offset": 2, "size": 2}, "zvel": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "vel": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}, "z": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"d": {"native": "Int16Array", "offset": 0, "size": 2}, "u": {"native": "Int16Array", "offset": 2, "size": 2}, "v": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 0}}, "overlaps": true, "size": 6, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 32}, "ang": {"native": "Int16Array", "offset": 28, "size": 2}, "blend": {"native": "Uint8Array", "offset": 19, "size": 1}, "clipdist": {"native": "Uint8Array", "offset": 18, "size": 1}, "cstat": {"native": "Uint16Array", "offset": 12, "size": 2}, "extra": {"native": "Int16Array", "offset": 42, "size": 2}, "hitag": {"native": "Int16Array", "offset": 40, "size": 2}, "lotag": {"native": "Int16Array", "offset": 38, "size": 2}, "owner": {"native": "Int16Array", "offset": 30, "size": 2}, "pal": {"native": "Uint8Array", "offset": 17, "size": 1}, "picnum": {"native": "Int16Array", "offset": 14, "size": 2}, "sectnum": {"native": "Int16Array", "offset": 24, "size": 2}, "shade": {"native": "Int8Array", "offset": 16, "size": 1}, "statnum": {"native": "Int16Array", "offset": 26, "size": 2}, "xoffset": {"native": "Int8Array", "offset": 22, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 20, "size": 1}, "yoffset": {"native": "Int8Array", "offset": 23, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 21, "size": 1}}, "overlaps": true, "size": 44, "union": false}, {}), {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xyz": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "__cxx_anonymous_15": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"xvel": {"native": "Int16Array", "offset": 0, "size": 2}, "yvel": {"native": "Int16Array", "offset": 2, "size": 2}, "zvel": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "vel": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}, "z": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"d": {"native": "Int16Array", "offset": 0, "size": 2}, "u": {"native": "Int16Array", "offset": 2, "size": 2}, "v": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 0}}, "overlaps": true, "size": 6, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 32}, "ang": {"native": "Int16Array", "offset": 28, "size": 2}, "blend": {"native": "Uint8Array", "offset": 19, "size": 1}, "clipdist": {"native": "Uint8Array", "offset": 18, "size": 1}, "cstat": {"native": "Uint16Array", "offset": 12, "size": 2}, "extra": {"native": "Int16Array", "offset": 42, "size": 2}, "hitag": {"native": "Int16Array", "offset": 40, "size": 2}, "lotag": {"native": "Int16Array", "offset": 38, "size": 2}, "owner": {"native": "Int16Array", "offset": 30, "size": 2}, "pal": {"native": "Uint8Array", "offset": 17, "size": 1}, "picnum": {"native": "Int16Array", "offset": 14, "size": 2}, "sectnum": {"native": "Int16Array", "offset": 24, "size": 2}, "shade": {"native": "Int8Array", "offset": 16, "size": 1}, "statnum": {"native": "Int16Array", "offset": 26, "size": 2}, "xoffset": {"native": "Int8Array", "offset": 22, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 20, "size": 1}, "yoffset": {"native": "Int8Array", "offset": 23, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 21, "size": 1}}, "overlaps": true, "size": 44, "union": false}, {})).__cxx_anonymous_15.__cxx_anonymous_0.yvel) == 0);
  return i32(0);
}

// C/C++ source: source/duke3d/src/game.cpp:611
let __static_G_GetViewscreenSizeShift__header_72c9a4444924_mask = i32((i32((1 << 2)) - 1));
export function G_GetViewscreenSizeShift__header_72c9a4444924(spr) {

  let rem = i32((i32((i32(cRecordObject(cRecordPointer(spr, {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xyz": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "__cxx_anonymous_15": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"xvel": {"native": "Int16Array", "offset": 0, "size": 2}, "yvel": {"native": "Int16Array", "offset": 2, "size": 2}, "zvel": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "vel": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}, "z": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"d": {"native": "Int16Array", "offset": 0, "size": 2}, "u": {"native": "Int16Array", "offset": 2, "size": 2}, "v": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 0}}, "overlaps": true, "size": 6, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 32}, "ang": {"native": "Int16Array", "offset": 28, "size": 2}, "blend": {"native": "Uint8Array", "offset": 19, "size": 1}, "clipdist": {"native": "Uint8Array", "offset": 18, "size": 1}, "cstat": {"native": "Uint16Array", "offset": 12, "size": 2}, "extra": {"native": "Int16Array", "offset": 42, "size": 2}, "hitag": {"native": "Int16Array", "offset": 40, "size": 2}, "lotag": {"native": "Int16Array", "offset": 38, "size": 2}, "owner": {"native": "Int16Array", "offset": 30, "size": 2}, "pal": {"native": "Uint8Array", "offset": 17, "size": 1}, "picnum": {"native": "Int16Array", "offset": 14, "size": 2}, "sectnum": {"native": "Int16Array", "offset": 24, "size": 2}, "shade": {"native": "Int8Array", "offset": 16, "size": 1}, "statnum": {"native": "Int16Array", "offset": 26, "size": 2}, "xoffset": {"native": "Int8Array", "offset": 22, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 20, "size": 1}, "yoffset": {"native": "Int8Array", "offset": 23, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 21, "size": 1}}, "overlaps": true, "size": 44, "union": false}, {})).xrepeat) & __static_G_GetViewscreenSizeShift__header_72c9a4444924_mask)) | i32((i32(cRecordObject(cRecordPointer(spr, {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xyz": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "__cxx_anonymous_15": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"xvel": {"native": "Int16Array", "offset": 0, "size": 2}, "yvel": {"native": "Int16Array", "offset": 2, "size": 2}, "zvel": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "vel": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}, "z": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"d": {"native": "Int16Array", "offset": 0, "size": 2}, "u": {"native": "Int16Array", "offset": 2, "size": 2}, "v": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 0}}, "overlaps": true, "size": 6, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 32}, "ang": {"native": "Int16Array", "offset": 28, "size": 2}, "blend": {"native": "Uint8Array", "offset": 19, "size": 1}, "clipdist": {"native": "Uint8Array", "offset": 18, "size": 1}, "cstat": {"native": "Uint16Array", "offset": 12, "size": 2}, "extra": {"native": "Int16Array", "offset": 42, "size": 2}, "hitag": {"native": "Int16Array", "offset": 40, "size": 2}, "lotag": {"native": "Int16Array", "offset": 38, "size": 2}, "owner": {"native": "Int16Array", "offset": 30, "size": 2}, "pal": {"native": "Uint8Array", "offset": 17, "size": 1}, "picnum": {"native": "Int16Array", "offset": 14, "size": 2}, "sectnum": {"native": "Int16Array", "offset": 24, "size": 2}, "shade": {"native": "Int8Array", "offset": 16, "size": 1}, "statnum": {"native": "Int16Array", "offset": 26, "size": 2}, "xoffset": {"native": "Int8Array", "offset": 22, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 20, "size": 1}, "yoffset": {"native": "Int8Array", "offset": 23, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 21, "size": 1}}, "overlaps": true, "size": 44, "union": false}, {})).yrepeat) & __static_G_GetViewscreenSizeShift__header_72c9a4444924_mask))));
  for (let i = i32(0); (i < 2); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; }))) {
    if (Boolean(i32((rem & i32((1 << i)))))) {
      return i32(i);
    }
  }
  return i32(2);
}

export function clamp__header_7e65ff40578f(__cxx_in, min, max) {
  return i32(((__cxx_in <= i32(min)) ? i32(min) : ((__cxx_in >= i32(max)) ? i32(max) : __cxx_in)));
}

export function mulscale6__header_d5ca2e363966(eax, edx) {
  return i32(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) >> BigInt(i32((u32((u32(6) & 255)) & 255))))));
}

// C/C++ source: @sysroot/usr/include/c++/12/bits/stl_algobase.h:254
export function max__template_b1cfaf2244c73238(__a, __b) {
  if ((__a.value < __b.value)) {
    return __b;
  }
  return __a;
}

export function clamp__header_fb9a8a4e1ef1(__cxx_in, min, max) {
  return (u32(((i32(__cxx_in) <= i32((u32((u32(min) & 65535)) & 65535))) ? (u32((u32(min) & 65535)) & 65535) : ((i32(__cxx_in) >= i32((u32((u32(max) & 65535)) & 65535))) ? (u32((u32(max) & 65535)) & 65535) : __cxx_in))) & 65535);
}

// C/C++ source: source/duke3d/src/game.cpp:1449
export function xfree__header_25587e65bc1e(ptr) {
  Free__cxx_static_0dfd3f42f0dc2c05(__cxx_global_cell_11016d3c7177543e564ab46c().value, ptr);
}

// C/C++ source: source/duke3d/src/game.cpp:1392
export function xmalloc__header_b8c4af936cfc(size) {
  let ptr = Alloc__cxx_static_e0036cfb06bcfe42(__cxx_global_cell_11016d3c7177543e564ab46c().value, size, u64(16));
  if (cPointerCompare(ptr, null, "!=")) {
    return ptr;
  }
  handle_memerr(i32(size));
  __builtin_unreachable();
}

// C/C++ source: source/duke3d/src/game.cpp:1413
export function xrealloc__header_d80e72c0e866(ptr, size) {
  let newptr = Realloc__cxx_static_478d5da25b6b3923(__cxx_global_cell_11016d3c7177543e564ab46c().value, ptr, size, u64(16));
  if ((cPointerCompare(newptr, null, "!=") || (size == u64(0)))) {
    return newptr;
  }
  handle_memerr(i32(size));
  __builtin_unreachable();
}

// C/C++ source: source/duke3d/src/game.cpp:1400
export function xcalloc__header_ccb5f0fe89eb(nmemb, size) {
  let siz = u64((BigInt(nmemb) * BigInt(size)));
  let ptr = Alloc__cxx_static_e0036cfb06bcfe42(__cxx_global_cell_11016d3c7177543e564ab46c().value, siz, u64(16));
  if (cPointerCompare(ptr, null, "!=")) {
    memset(ptr, 0, siz);
    return ptr;
  }
  handle_memerr(i32(size));
  __builtin_unreachable();
}

export function ARRAY_SIZE__header_629f6c994b6a(arg0) {
  return u64(5n);
}

export function ARRAY_SIZE__header_45c5cc752339(arg0) {
  return u64(64n);
}

export function ARRAY_SIZE__header_f8557a61fa7e(arg0) {
  return u64(17n);
}

export function ARRAY_SIZE__header_251e3654dd1b(arg0) {
  return u64(8n);
}

export function ARRAY_SIZE__header_30888aa7cde6(arg0) {
  return u64(6n);
}

export function ARRAY_SIZE__header_8e1e61e90c11(arg0) {
  return u64(1n);
}

// C/C++ source: source/duke3d/src/game.cpp:1235
export function Bstrncpyz__header_1b07c15e1e64(dst, src, n) {
  if ((n > u64(0))) {
    memcpy(dst, src, (min__template_c237f4424e2bda8a(((__cxx_lvalue_0) => cRef(() => __cxx_lvalue_0, () => { throw new TypeError("const C++ reference write"); }))(u64((BigInt(strlen(src)) + BigInt(u64(1))))), ((__cxx_lvalue_1) => cRef(() => __cxx_lvalue_1, () => { throw new TypeError("const C++ reference write"); }))(u64((BigInt(n) - BigInt(u64(1))))))).value);
    ((cDeref(cPointerOffset(dst, u64((BigInt(n) - BigInt(u64(1)))), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32(0) & 255));
  }
  return dst;
}

export function ARRAY_SIZE__header_c646a883023a(arg0) {
  return u64(29n);
}

export function ARRAY_SIZE__header_a4bf8e69dabb(arg0) {
  return u64(7n);
}

export function ARRAY_SIZE__header_248a2b6a206c(arg0) {
  return u64(3n);
}

export function ARRAY_SIZE__header_40c5d203784c(arg0) {
  return u64(4n);
}

// C/C++ source: source/duke3d/src/game.cpp:638
export function P_SetupMiscInputSettings__header_950f2544e596() {
  let ps = (cPointerElementRef(cRecordPointer(g_player, {"align": 1, "arrayAlign": 1, "fields": {"frags": {"length": 16, "native": "Uint8Array", "offset": 62, "size": 16}, "gotvote": {"native": "Uint8Array", "offset": 93, "size": 1}, "horizAngleAdjust": {"native": "Int32Array", "offset": 32, "size": 4}, "horizRecenter": {"native": "Int32Array", "offset": 28, "size": 4}, "horizSkew": {"native": "Int32Array", "offset": 36, "size": 4}, "input": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"bits": {"native": "Uint32Array", "offset": 0, "size": 4}, "extbits": {"native": "Uint32Array", "offset": 16, "size": 4}, "fvel": {"native": "Int16Array", "offset": 4, "size": 2}, "q16avel": {"native": "Int32Array", "offset": 8, "size": 4}, "q16horz": {"native": "Int32Array", "offset": 12, "size": 4}, "svel": {"native": "Int16Array", "offset": 6, "size": 2}}, "overlaps": false, "size": 20, "union": false}, "offset": 8}, "lastViewUpdate": {"native": "BigUint64Array", "offset": 40, "size": 8}, "netsynctime": {"native": "Int32Array", "offset": 48, "size": 4}, "pcolor": {"native": "Int32Array", "offset": 52, "size": 4}, "ping": {"native": "Int16Array", "offset": 60, "size": 2}, "pingcnt": {"native": "Uint8Array", "offset": 94, "size": 1}, "playerquitflag": {"native": "Uint8Array", "offset": 95, "size": 1}, "ps": {"offset": 0, "pointer": true, "size": 8}, "pteam": {"native": "Int32Array", "offset": 56, "size": 4}, "ready": {"native": "Uint8Array", "offset": 96, "size": 1}, "revision": {"native": "Uint32Array", "offset": 129, "size": 4}, "smoothcamera": {"native": "Uint8Array", "offset": 91, "size": 1}, "user_name": {"length": 32, "native": "Uint8Array", "offset": 97, "size": 32}, "vote": {"native": "Uint8Array", "offset": 92, "size": 1}, "wchoice": {"length": 13, "native": "Uint8Array", "offset": 78, "size": 13}}, "overlaps": false, "size": 133, "union": false}, {}), __cxx_global_cell_04adffdeab684b9c52206917().value).value).ps;
  (cRecordObject(cRecordPointer(ps, {"align": 1, "arrayAlign": 2, "fields": {"access_incs": {"native": "Uint8Array", "offset": 623, "size": 1}, "access_spritenum": {"native": "Int16Array", "offset": 504, "size": 2}, "access_wallnum": {"native": "Int16Array", "offset": 502, "size": 2}, "actors_killed": {"native": "Uint16Array", "offset": 134, "size": 2}, "actorsqu": {"native": "Int16Array", "offset": 528, "size": 2}, "aim_mode": {"native": "Uint8Array", "offset": 589, "size": 1}, "airleft": {"native": "Int16Array", "offset": 496, "size": 2}, "ammo_amount": {"length": 13, "native": "Int16Array", "offset": 438, "size": 26}, "auto_aim": {"native": "Uint8Array", "offset": 590, "size": 1}, "autostep": {"native": "Int32Array", "offset": 116, "size": 4}, "autostep_sbw": {"native": "Int32Array", "offset": 120, "size": 4}, "bobcounter": {"native": "Int16Array", "offset": 566, "size": 2}, "bobpos": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 48}, "buttonpalette": {"native": "Uint8Array", "offset": 607, "size": 1}, "cheat_phase": {"native": "Int8Array", "offset": 632, "size": 1}, "clipdist": {"native": "Int16Array", "offset": 580, "size": 2}, "crack_time": {"native": "Int16Array", "offset": 564, "size": 2}, "crouch_toggle": {"native": "Int8Array", "offset": 638, "size": 1}, "crouchspeedmodifier": {"native": "Int16Array", "offset": 386, "size": 2}, "crouchzincrement": {"native": "Int16Array", "offset": 384, "size": 2}, "curr_weapon": {"native": "Int8Array", "offset": 635, "size": 1}, "cursectnum": {"native": "Int16Array", "offset": 404, "size": 2}, "customexitsound": {"native": "Int16Array", "offset": 532, "size": 2}, "dead_flag": {"native": "Int16Array", "offset": 572, "size": 2}, "dummyplayersprite": {"native": "Int16Array", "offset": 524, "size": 2}, "extra_extra8": {"native": "Int16Array", "offset": 526, "size": 2}, "falling_counter": {"native": "Uint8Array", "offset": 617, "size": 1}, "filler": {"length": 100, "native": "Int16Array", "offset": 168, "size": 200}, "fist_incs": {"native": "Uint8Array", "offset": 627, "size": 1}, "floorzcutoff": {"native": "Int16Array", "offset": 370, "size": 2}, "floorzoffset": {"native": "Int16Array", "offset": 374, "size": 2}, "floorzrebound": {"native": "Int16Array", "offset": 368, "size": 2}, "footprintcount": {"native": "Uint8Array", "offset": 600, "size": 1}, "footprintpal": {"native": "Uint8Array", "offset": 613, "size": 1}, "footprintshade": {"native": "Uint8Array", "offset": 618, "size": 1}, "frag": {"native": "Uint16Array", "offset": 140, "size": 2}, "frag_ps": {"native": "Uint8Array", "offset": 596, "size": 1}, "fraggedself": {"native": "Uint16Array", "offset": 142, "size": 2}, "fric": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 56}, "fta": {"native": "Int16Array", "offset": 498, "size": 2}, "ftq": {"native": "Int16Array", "offset": 500, "size": 2}, "gm": {"native": "Uint8Array", "offset": 598, "size": 1}, "got_access": {"native": "Int16Array", "offset": 506, "size": 2}, "gotweapon": {"native": "Uint16Array", "offset": 136, "size": 2}, "gravity": {"native": "Int16Array", "offset": 398, "size": 2}, "hard_landing": {"native": "Uint8Array", "offset": 626, "size": 1}, "hbomb_hold_delay": {"native": "Uint8Array", "offset": 595, "size": 1}, "hbomb_on": {"native": "Uint8Array", "offset": 602, "size": 1}, "heat_on": {"native": "Uint8Array", "offset": 614, "size": 1}, "holoduke_on": {"native": "Int16Array", "offset": 574, "size": 2}, "holster_weapon": {"native": "Uint8Array", "offset": 616, "size": 1}, "hurt_delay": {"native": "Uint8Array", "offset": 601, "size": 1}, "i": {"native": "Int16Array", "offset": 516, "size": 2}, "interface_toggle": {"native": "Uint32Array", "offset": 124, "size": 4}, "inv_amount": {"length": 11, "native": "Int16Array", "offset": 464, "size": 22}, "invdisptime": {"native": "Uint8Array", "offset": 615, "size": 1}, "inven_icon": {"native": "Uint8Array", "offset": 606, "size": 1}, "jetpack_on": {"native": "Uint8Array", "offset": 610, "size": 1}, "jetpackzincrement": {"native": "Int16Array", "offset": 396, "size": 2}, "jumping_counter": {"native": "Int16Array", "offset": 494, "size": 2}, "jumping_toggle": {"native": "Uint8Array", "offset": 603, "size": 1}, "kickback_pic": {"native": "Uint8Array", "offset": 597, "size": 1}, "knee_incs": {"native": "Uint8Array", "offset": 622, "size": 1}, "knuckle_incs": {"native": "Uint8Array", "offset": 621, "size": 1}, "last_extra": {"native": "Int16Array", "offset": 408, "size": 2}, "last_full_weapon": {"native": "Uint8Array", "offset": 619, "size": 1}, "last_pissed_time": {"native": "Int16Array", "offset": 534, "size": 2}, "last_quick_kick": {"native": "Uint8Array", "offset": 585, "size": 1}, "last_used_weapon": {"native": "Int8Array", "offset": 637, "size": 1}, "last_weapon": {"native": "Int8Array", "offset": 631, "size": 1}, "loogcnt": {"native": "Int8Array", "offset": 629, "size": 1}, "loogie": {"dims": [6], "offset": 144, "recordArray": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, "size": 24}, "look_ang": {"native": "Int16Array", "offset": 406, "size": 2}, "max_actors_killed": {"native": "Uint16Array", "offset": 132, "size": 2}, "max_ammo_amount": {"length": 13, "native": "Int16Array", "offset": 412, "size": 26}, "max_player_health": {"native": "Int32Array", "offset": 108, "size": 4}, "max_secret_rooms": {"native": "Uint8Array", "offset": 582, "size": 1}, "max_shield_amount": {"native": "Int32Array", "offset": 112, "size": 4}, "maxswimzvel": {"native": "Int16Array", "offset": 394, "size": 2}, "minswimzvel": {"native": "Int16Array", "offset": 392, "size": 2}, "minwaterzdist": {"native": "Int16Array", "offset": 378, "size": 2}, "movement_lock": {"native": "Uint8Array", "offset": 592, "size": 1}, "newowner": {"native": "Int16Array", "offset": 492, "size": 2}, "npos": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 36}, "numloogs": {"native": "Int8Array", "offset": 628, "size": 1}, "olook_ang": {"native": "Int16Array", "offset": 372, "size": 2}, "on_crane": {"native": "Int16Array", "offset": 514, "size": 2}, "on_ground": {"native": "Uint8Array", "offset": 605, "size": 1}, "on_warping_sector": {"native": "Uint8Array", "offset": 599, "size": 1}, "one_eighty_count": {"native": "Int16Array", "offset": 522, "size": 2}, "opos": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 12}, "opyoff": {"native": "Int16Array", "offset": 490, "size": 2}, "oq16ang": {"native": "Int32Array", "offset": 84, "size": 4}, "oq16horiz": {"native": "Int32Array", "offset": 72, "size": 4}, "oq16horizoff": {"native": "Int32Array", "offset": 76, "size": 4}, "orotscrnang": {"native": "Int16Array", "offset": 568, "size": 2}, "over_shoulder_on": {"native": "Uint8Array", "offset": 608, "size": 1}, "padding_": {"length": 1, "native": "Int8Array", "offset": 639, "size": 1}, "palette": {"native": "Uint8Array", "offset": 636, "size": 1}, "palookup": {"native": "Uint8Array", "offset": 625, "size": 1}, "pals": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"b": {"native": "Uint8Array", "offset": 2, "size": 1}, "f": {"native": "Uint8Array", "offset": 3, "size": 1}, "g": {"native": "Uint8Array", "offset": 1, "size": 1}, "r": {"native": "Uint8Array", "offset": 0, "size": 1}}, "overlaps": false, "size": 4, "union": false}, "offset": 128}, "parallax_sectnum": {"native": "Int16Array", "offset": 518, "size": 2}, "player_par": {"native": "Int32Array", "offset": 100, "size": 4}, "pos": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}, "pycount": {"native": "Int16Array", "offset": 576, "size": 2}, "pyoff": {"native": "Int16Array", "offset": 488, "size": 2}, "q16ang": {"native": "Int32Array", "offset": 80, "size": 4}, "q16angvel": {"native": "Int32Array", "offset": 88, "size": 4}, "q16horiz": {"native": "Int32Array", "offset": 64, "size": 4}, "q16horizoff": {"native": "Int32Array", "offset": 68, "size": 4}, "quick_kick": {"native": "Uint8Array", "offset": 584, "size": 1}, "random_club_frame": {"native": "Int16Array", "offset": 520, "size": 2}, "rapid_fire_hold": {"native": "Uint8Array", "offset": 604, "size": 1}, "reloading": {"native": "Uint8Array", "offset": 587, "size": 1}, "return_to_center": {"native": "Uint8Array", "offset": 586, "size": 1}, "rotscrnang": {"native": "Int16Array", "offset": 570, "size": 2}, "runspeed": {"native": "Int32Array", "offset": 104, "size": 4}, "sbs": {"native": "Int16Array", "offset": 400, "size": 2}, "scream_voice": {"native": "Int8Array", "offset": 630, "size": 1}, "scuba_on": {"native": "Uint8Array", "offset": 612, "size": 1}, "secret_rooms": {"native": "Uint8Array", "offset": 583, "size": 1}, "show_empty_weapon": {"native": "Uint8Array", "offset": 609, "size": 1}, "shrunkzoffset": {"native": "Int16Array", "offset": 382, "size": 2}, "somethingonplayer": {"native": "Int16Array", "offset": 512, "size": 2}, "sound_pitch": {"native": "Int16Array", "offset": 402, "size": 2}, "spritebridge": {"native": "Uint8Array", "offset": 611, "size": 1}, "spritezoffset": {"native": "Int16Array", "offset": 376, "size": 2}, "subweapon": {"native": "Int16Array", "offset": 410, "size": 2}, "swimspeedmodifier": {"native": "Int16Array", "offset": 388, "size": 2}, "swimzincrement": {"native": "Int16Array", "offset": 390, "size": 2}, "team": {"native": "Uint8Array", "offset": 593, "size": 1}, "timebeforeexit": {"native": "Int16Array", "offset": 530, "size": 2}, "tipincs": {"native": "Uint8Array", "offset": 594, "size": 1}, "toggle_key_flag": {"native": "Uint8Array", "offset": 620, "size": 1}, "transporter_hold": {"native": "Int16Array", "offset": 578, "size": 2}, "truecz": {"native": "Int32Array", "offset": 96, "size": 4}, "truefz": {"native": "Int32Array", "offset": 92, "size": 4}, "vel": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 24}, "visibility": {"native": "Int16Array", "offset": 510, "size": 2}, "wackedbyactor": {"native": "Int16Array", "offset": 486, "size": 2}, "walking_snd_toggle": {"native": "Uint8Array", "offset": 624, "size": 1}, "wantweaponfire": {"native": "Int8Array", "offset": 634, "size": 1}, "waterzoffset": {"native": "Int16Array", "offset": 380, "size": 2}, "weapon_ang": {"native": "Int16Array", "offset": 508, "size": 2}, "weapon_pos": {"native": "Int8Array", "offset": 633, "size": 1}, "weapon_sway": {"native": "Int16Array", "offset": 562, "size": 2}, "weaponswitch": {"native": "Uint8Array", "offset": 591, "size": 1}, "weapreccnt": {"native": "Uint8Array", "offset": 588, "size": 1}, "weaprecs": {"length": 13, "native": "Int16Array", "offset": 536, "size": 26}, "zoom": {"native": "Uint16Array", "offset": 138, "size": 2}}, "overlaps": true, "size": 640, "union": false}, {})).aim_mode = (u32((u32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.mouseaiming) & 255)) & 255));
  (cRecordObject(cRecordPointer(ps, {"align": 1, "arrayAlign": 2, "fields": {"access_incs": {"native": "Uint8Array", "offset": 623, "size": 1}, "access_spritenum": {"native": "Int16Array", "offset": 504, "size": 2}, "access_wallnum": {"native": "Int16Array", "offset": 502, "size": 2}, "actors_killed": {"native": "Uint16Array", "offset": 134, "size": 2}, "actorsqu": {"native": "Int16Array", "offset": 528, "size": 2}, "aim_mode": {"native": "Uint8Array", "offset": 589, "size": 1}, "airleft": {"native": "Int16Array", "offset": 496, "size": 2}, "ammo_amount": {"length": 13, "native": "Int16Array", "offset": 438, "size": 26}, "auto_aim": {"native": "Uint8Array", "offset": 590, "size": 1}, "autostep": {"native": "Int32Array", "offset": 116, "size": 4}, "autostep_sbw": {"native": "Int32Array", "offset": 120, "size": 4}, "bobcounter": {"native": "Int16Array", "offset": 566, "size": 2}, "bobpos": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 48}, "buttonpalette": {"native": "Uint8Array", "offset": 607, "size": 1}, "cheat_phase": {"native": "Int8Array", "offset": 632, "size": 1}, "clipdist": {"native": "Int16Array", "offset": 580, "size": 2}, "crack_time": {"native": "Int16Array", "offset": 564, "size": 2}, "crouch_toggle": {"native": "Int8Array", "offset": 638, "size": 1}, "crouchspeedmodifier": {"native": "Int16Array", "offset": 386, "size": 2}, "crouchzincrement": {"native": "Int16Array", "offset": 384, "size": 2}, "curr_weapon": {"native": "Int8Array", "offset": 635, "size": 1}, "cursectnum": {"native": "Int16Array", "offset": 404, "size": 2}, "customexitsound": {"native": "Int16Array", "offset": 532, "size": 2}, "dead_flag": {"native": "Int16Array", "offset": 572, "size": 2}, "dummyplayersprite": {"native": "Int16Array", "offset": 524, "size": 2}, "extra_extra8": {"native": "Int16Array", "offset": 526, "size": 2}, "falling_counter": {"native": "Uint8Array", "offset": 617, "size": 1}, "filler": {"length": 100, "native": "Int16Array", "offset": 168, "size": 200}, "fist_incs": {"native": "Uint8Array", "offset": 627, "size": 1}, "floorzcutoff": {"native": "Int16Array", "offset": 370, "size": 2}, "floorzoffset": {"native": "Int16Array", "offset": 374, "size": 2}, "floorzrebound": {"native": "Int16Array", "offset": 368, "size": 2}, "footprintcount": {"native": "Uint8Array", "offset": 600, "size": 1}, "footprintpal": {"native": "Uint8Array", "offset": 613, "size": 1}, "footprintshade": {"native": "Uint8Array", "offset": 618, "size": 1}, "frag": {"native": "Uint16Array", "offset": 140, "size": 2}, "frag_ps": {"native": "Uint8Array", "offset": 596, "size": 1}, "fraggedself": {"native": "Uint16Array", "offset": 142, "size": 2}, "fric": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 56}, "fta": {"native": "Int16Array", "offset": 498, "size": 2}, "ftq": {"native": "Int16Array", "offset": 500, "size": 2}, "gm": {"native": "Uint8Array", "offset": 598, "size": 1}, "got_access": {"native": "Int16Array", "offset": 506, "size": 2}, "gotweapon": {"native": "Uint16Array", "offset": 136, "size": 2}, "gravity": {"native": "Int16Array", "offset": 398, "size": 2}, "hard_landing": {"native": "Uint8Array", "offset": 626, "size": 1}, "hbomb_hold_delay": {"native": "Uint8Array", "offset": 595, "size": 1}, "hbomb_on": {"native": "Uint8Array", "offset": 602, "size": 1}, "heat_on": {"native": "Uint8Array", "offset": 614, "size": 1}, "holoduke_on": {"native": "Int16Array", "offset": 574, "size": 2}, "holster_weapon": {"native": "Uint8Array", "offset": 616, "size": 1}, "hurt_delay": {"native": "Uint8Array", "offset": 601, "size": 1}, "i": {"native": "Int16Array", "offset": 516, "size": 2}, "interface_toggle": {"native": "Uint32Array", "offset": 124, "size": 4}, "inv_amount": {"length": 11, "native": "Int16Array", "offset": 464, "size": 22}, "invdisptime": {"native": "Uint8Array", "offset": 615, "size": 1}, "inven_icon": {"native": "Uint8Array", "offset": 606, "size": 1}, "jetpack_on": {"native": "Uint8Array", "offset": 610, "size": 1}, "jetpackzincrement": {"native": "Int16Array", "offset": 396, "size": 2}, "jumping_counter": {"native": "Int16Array", "offset": 494, "size": 2}, "jumping_toggle": {"native": "Uint8Array", "offset": 603, "size": 1}, "kickback_pic": {"native": "Uint8Array", "offset": 597, "size": 1}, "knee_incs": {"native": "Uint8Array", "offset": 622, "size": 1}, "knuckle_incs": {"native": "Uint8Array", "offset": 621, "size": 1}, "last_extra": {"native": "Int16Array", "offset": 408, "size": 2}, "last_full_weapon": {"native": "Uint8Array", "offset": 619, "size": 1}, "last_pissed_time": {"native": "Int16Array", "offset": 534, "size": 2}, "last_quick_kick": {"native": "Uint8Array", "offset": 585, "size": 1}, "last_used_weapon": {"native": "Int8Array", "offset": 637, "size": 1}, "last_weapon": {"native": "Int8Array", "offset": 631, "size": 1}, "loogcnt": {"native": "Int8Array", "offset": 629, "size": 1}, "loogie": {"dims": [6], "offset": 144, "recordArray": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, "size": 24}, "look_ang": {"native": "Int16Array", "offset": 406, "size": 2}, "max_actors_killed": {"native": "Uint16Array", "offset": 132, "size": 2}, "max_ammo_amount": {"length": 13, "native": "Int16Array", "offset": 412, "size": 26}, "max_player_health": {"native": "Int32Array", "offset": 108, "size": 4}, "max_secret_rooms": {"native": "Uint8Array", "offset": 582, "size": 1}, "max_shield_amount": {"native": "Int32Array", "offset": 112, "size": 4}, "maxswimzvel": {"native": "Int16Array", "offset": 394, "size": 2}, "minswimzvel": {"native": "Int16Array", "offset": 392, "size": 2}, "minwaterzdist": {"native": "Int16Array", "offset": 378, "size": 2}, "movement_lock": {"native": "Uint8Array", "offset": 592, "size": 1}, "newowner": {"native": "Int16Array", "offset": 492, "size": 2}, "npos": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 36}, "numloogs": {"native": "Int8Array", "offset": 628, "size": 1}, "olook_ang": {"native": "Int16Array", "offset": 372, "size": 2}, "on_crane": {"native": "Int16Array", "offset": 514, "size": 2}, "on_ground": {"native": "Uint8Array", "offset": 605, "size": 1}, "on_warping_sector": {"native": "Uint8Array", "offset": 599, "size": 1}, "one_eighty_count": {"native": "Int16Array", "offset": 522, "size": 2}, "opos": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 12}, "opyoff": {"native": "Int16Array", "offset": 490, "size": 2}, "oq16ang": {"native": "Int32Array", "offset": 84, "size": 4}, "oq16horiz": {"native": "Int32Array", "offset": 72, "size": 4}, "oq16horizoff": {"native": "Int32Array", "offset": 76, "size": 4}, "orotscrnang": {"native": "Int16Array", "offset": 568, "size": 2}, "over_shoulder_on": {"native": "Uint8Array", "offset": 608, "size": 1}, "padding_": {"length": 1, "native": "Int8Array", "offset": 639, "size": 1}, "palette": {"native": "Uint8Array", "offset": 636, "size": 1}, "palookup": {"native": "Uint8Array", "offset": 625, "size": 1}, "pals": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"b": {"native": "Uint8Array", "offset": 2, "size": 1}, "f": {"native": "Uint8Array", "offset": 3, "size": 1}, "g": {"native": "Uint8Array", "offset": 1, "size": 1}, "r": {"native": "Uint8Array", "offset": 0, "size": 1}}, "overlaps": false, "size": 4, "union": false}, "offset": 128}, "parallax_sectnum": {"native": "Int16Array", "offset": 518, "size": 2}, "player_par": {"native": "Int32Array", "offset": 100, "size": 4}, "pos": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}, "pycount": {"native": "Int16Array", "offset": 576, "size": 2}, "pyoff": {"native": "Int16Array", "offset": 488, "size": 2}, "q16ang": {"native": "Int32Array", "offset": 80, "size": 4}, "q16angvel": {"native": "Int32Array", "offset": 88, "size": 4}, "q16horiz": {"native": "Int32Array", "offset": 64, "size": 4}, "q16horizoff": {"native": "Int32Array", "offset": 68, "size": 4}, "quick_kick": {"native": "Uint8Array", "offset": 584, "size": 1}, "random_club_frame": {"native": "Int16Array", "offset": 520, "size": 2}, "rapid_fire_hold": {"native": "Uint8Array", "offset": 604, "size": 1}, "reloading": {"native": "Uint8Array", "offset": 587, "size": 1}, "return_to_center": {"native": "Uint8Array", "offset": 586, "size": 1}, "rotscrnang": {"native": "Int16Array", "offset": 570, "size": 2}, "runspeed": {"native": "Int32Array", "offset": 104, "size": 4}, "sbs": {"native": "Int16Array", "offset": 400, "size": 2}, "scream_voice": {"native": "Int8Array", "offset": 630, "size": 1}, "scuba_on": {"native": "Uint8Array", "offset": 612, "size": 1}, "secret_rooms": {"native": "Uint8Array", "offset": 583, "size": 1}, "show_empty_weapon": {"native": "Uint8Array", "offset": 609, "size": 1}, "shrunkzoffset": {"native": "Int16Array", "offset": 382, "size": 2}, "somethingonplayer": {"native": "Int16Array", "offset": 512, "size": 2}, "sound_pitch": {"native": "Int16Array", "offset": 402, "size": 2}, "spritebridge": {"native": "Uint8Array", "offset": 611, "size": 1}, "spritezoffset": {"native": "Int16Array", "offset": 376, "size": 2}, "subweapon": {"native": "Int16Array", "offset": 410, "size": 2}, "swimspeedmodifier": {"native": "Int16Array", "offset": 388, "size": 2}, "swimzincrement": {"native": "Int16Array", "offset": 390, "size": 2}, "team": {"native": "Uint8Array", "offset": 593, "size": 1}, "timebeforeexit": {"native": "Int16Array", "offset": 530, "size": 2}, "tipincs": {"native": "Uint8Array", "offset": 594, "size": 1}, "toggle_key_flag": {"native": "Uint8Array", "offset": 620, "size": 1}, "transporter_hold": {"native": "Int16Array", "offset": 578, "size": 2}, "truecz": {"native": "Int32Array", "offset": 96, "size": 4}, "truefz": {"native": "Int32Array", "offset": 92, "size": 4}, "vel": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 24}, "visibility": {"native": "Int16Array", "offset": 510, "size": 2}, "wackedbyactor": {"native": "Int16Array", "offset": 486, "size": 2}, "walking_snd_toggle": {"native": "Uint8Array", "offset": 624, "size": 1}, "wantweaponfire": {"native": "Int8Array", "offset": 634, "size": 1}, "waterzoffset": {"native": "Int16Array", "offset": 380, "size": 2}, "weapon_ang": {"native": "Int16Array", "offset": 508, "size": 2}, "weapon_pos": {"native": "Int8Array", "offset": 633, "size": 1}, "weapon_sway": {"native": "Int16Array", "offset": 562, "size": 2}, "weaponswitch": {"native": "Uint8Array", "offset": 591, "size": 1}, "weapreccnt": {"native": "Uint8Array", "offset": 588, "size": 1}, "weaprecs": {"length": 13, "native": "Int16Array", "offset": 536, "size": 26}, "zoom": {"native": "Uint16Array", "offset": 138, "size": 2}}, "overlaps": true, "size": 640, "union": false}, {})).auto_aim = (u32((u32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.config.AutoAim) & 255)) & 255));
  (cRecordObject(cRecordPointer(ps, {"align": 1, "arrayAlign": 2, "fields": {"access_incs": {"native": "Uint8Array", "offset": 623, "size": 1}, "access_spritenum": {"native": "Int16Array", "offset": 504, "size": 2}, "access_wallnum": {"native": "Int16Array", "offset": 502, "size": 2}, "actors_killed": {"native": "Uint16Array", "offset": 134, "size": 2}, "actorsqu": {"native": "Int16Array", "offset": 528, "size": 2}, "aim_mode": {"native": "Uint8Array", "offset": 589, "size": 1}, "airleft": {"native": "Int16Array", "offset": 496, "size": 2}, "ammo_amount": {"length": 13, "native": "Int16Array", "offset": 438, "size": 26}, "auto_aim": {"native": "Uint8Array", "offset": 590, "size": 1}, "autostep": {"native": "Int32Array", "offset": 116, "size": 4}, "autostep_sbw": {"native": "Int32Array", "offset": 120, "size": 4}, "bobcounter": {"native": "Int16Array", "offset": 566, "size": 2}, "bobpos": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 48}, "buttonpalette": {"native": "Uint8Array", "offset": 607, "size": 1}, "cheat_phase": {"native": "Int8Array", "offset": 632, "size": 1}, "clipdist": {"native": "Int16Array", "offset": 580, "size": 2}, "crack_time": {"native": "Int16Array", "offset": 564, "size": 2}, "crouch_toggle": {"native": "Int8Array", "offset": 638, "size": 1}, "crouchspeedmodifier": {"native": "Int16Array", "offset": 386, "size": 2}, "crouchzincrement": {"native": "Int16Array", "offset": 384, "size": 2}, "curr_weapon": {"native": "Int8Array", "offset": 635, "size": 1}, "cursectnum": {"native": "Int16Array", "offset": 404, "size": 2}, "customexitsound": {"native": "Int16Array", "offset": 532, "size": 2}, "dead_flag": {"native": "Int16Array", "offset": 572, "size": 2}, "dummyplayersprite": {"native": "Int16Array", "offset": 524, "size": 2}, "extra_extra8": {"native": "Int16Array", "offset": 526, "size": 2}, "falling_counter": {"native": "Uint8Array", "offset": 617, "size": 1}, "filler": {"length": 100, "native": "Int16Array", "offset": 168, "size": 200}, "fist_incs": {"native": "Uint8Array", "offset": 627, "size": 1}, "floorzcutoff": {"native": "Int16Array", "offset": 370, "size": 2}, "floorzoffset": {"native": "Int16Array", "offset": 374, "size": 2}, "floorzrebound": {"native": "Int16Array", "offset": 368, "size": 2}, "footprintcount": {"native": "Uint8Array", "offset": 600, "size": 1}, "footprintpal": {"native": "Uint8Array", "offset": 613, "size": 1}, "footprintshade": {"native": "Uint8Array", "offset": 618, "size": 1}, "frag": {"native": "Uint16Array", "offset": 140, "size": 2}, "frag_ps": {"native": "Uint8Array", "offset": 596, "size": 1}, "fraggedself": {"native": "Uint16Array", "offset": 142, "size": 2}, "fric": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 56}, "fta": {"native": "Int16Array", "offset": 498, "size": 2}, "ftq": {"native": "Int16Array", "offset": 500, "size": 2}, "gm": {"native": "Uint8Array", "offset": 598, "size": 1}, "got_access": {"native": "Int16Array", "offset": 506, "size": 2}, "gotweapon": {"native": "Uint16Array", "offset": 136, "size": 2}, "gravity": {"native": "Int16Array", "offset": 398, "size": 2}, "hard_landing": {"native": "Uint8Array", "offset": 626, "size": 1}, "hbomb_hold_delay": {"native": "Uint8Array", "offset": 595, "size": 1}, "hbomb_on": {"native": "Uint8Array", "offset": 602, "size": 1}, "heat_on": {"native": "Uint8Array", "offset": 614, "size": 1}, "holoduke_on": {"native": "Int16Array", "offset": 574, "size": 2}, "holster_weapon": {"native": "Uint8Array", "offset": 616, "size": 1}, "hurt_delay": {"native": "Uint8Array", "offset": 601, "size": 1}, "i": {"native": "Int16Array", "offset": 516, "size": 2}, "interface_toggle": {"native": "Uint32Array", "offset": 124, "size": 4}, "inv_amount": {"length": 11, "native": "Int16Array", "offset": 464, "size": 22}, "invdisptime": {"native": "Uint8Array", "offset": 615, "size": 1}, "inven_icon": {"native": "Uint8Array", "offset": 606, "size": 1}, "jetpack_on": {"native": "Uint8Array", "offset": 610, "size": 1}, "jetpackzincrement": {"native": "Int16Array", "offset": 396, "size": 2}, "jumping_counter": {"native": "Int16Array", "offset": 494, "size": 2}, "jumping_toggle": {"native": "Uint8Array", "offset": 603, "size": 1}, "kickback_pic": {"native": "Uint8Array", "offset": 597, "size": 1}, "knee_incs": {"native": "Uint8Array", "offset": 622, "size": 1}, "knuckle_incs": {"native": "Uint8Array", "offset": 621, "size": 1}, "last_extra": {"native": "Int16Array", "offset": 408, "size": 2}, "last_full_weapon": {"native": "Uint8Array", "offset": 619, "size": 1}, "last_pissed_time": {"native": "Int16Array", "offset": 534, "size": 2}, "last_quick_kick": {"native": "Uint8Array", "offset": 585, "size": 1}, "last_used_weapon": {"native": "Int8Array", "offset": 637, "size": 1}, "last_weapon": {"native": "Int8Array", "offset": 631, "size": 1}, "loogcnt": {"native": "Int8Array", "offset": 629, "size": 1}, "loogie": {"dims": [6], "offset": 144, "recordArray": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, "size": 24}, "look_ang": {"native": "Int16Array", "offset": 406, "size": 2}, "max_actors_killed": {"native": "Uint16Array", "offset": 132, "size": 2}, "max_ammo_amount": {"length": 13, "native": "Int16Array", "offset": 412, "size": 26}, "max_player_health": {"native": "Int32Array", "offset": 108, "size": 4}, "max_secret_rooms": {"native": "Uint8Array", "offset": 582, "size": 1}, "max_shield_amount": {"native": "Int32Array", "offset": 112, "size": 4}, "maxswimzvel": {"native": "Int16Array", "offset": 394, "size": 2}, "minswimzvel": {"native": "Int16Array", "offset": 392, "size": 2}, "minwaterzdist": {"native": "Int16Array", "offset": 378, "size": 2}, "movement_lock": {"native": "Uint8Array", "offset": 592, "size": 1}, "newowner": {"native": "Int16Array", "offset": 492, "size": 2}, "npos": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 36}, "numloogs": {"native": "Int8Array", "offset": 628, "size": 1}, "olook_ang": {"native": "Int16Array", "offset": 372, "size": 2}, "on_crane": {"native": "Int16Array", "offset": 514, "size": 2}, "on_ground": {"native": "Uint8Array", "offset": 605, "size": 1}, "on_warping_sector": {"native": "Uint8Array", "offset": 599, "size": 1}, "one_eighty_count": {"native": "Int16Array", "offset": 522, "size": 2}, "opos": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 12}, "opyoff": {"native": "Int16Array", "offset": 490, "size": 2}, "oq16ang": {"native": "Int32Array", "offset": 84, "size": 4}, "oq16horiz": {"native": "Int32Array", "offset": 72, "size": 4}, "oq16horizoff": {"native": "Int32Array", "offset": 76, "size": 4}, "orotscrnang": {"native": "Int16Array", "offset": 568, "size": 2}, "over_shoulder_on": {"native": "Uint8Array", "offset": 608, "size": 1}, "padding_": {"length": 1, "native": "Int8Array", "offset": 639, "size": 1}, "palette": {"native": "Uint8Array", "offset": 636, "size": 1}, "palookup": {"native": "Uint8Array", "offset": 625, "size": 1}, "pals": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"b": {"native": "Uint8Array", "offset": 2, "size": 1}, "f": {"native": "Uint8Array", "offset": 3, "size": 1}, "g": {"native": "Uint8Array", "offset": 1, "size": 1}, "r": {"native": "Uint8Array", "offset": 0, "size": 1}}, "overlaps": false, "size": 4, "union": false}, "offset": 128}, "parallax_sectnum": {"native": "Int16Array", "offset": 518, "size": 2}, "player_par": {"native": "Int32Array", "offset": 100, "size": 4}, "pos": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}, "pycount": {"native": "Int16Array", "offset": 576, "size": 2}, "pyoff": {"native": "Int16Array", "offset": 488, "size": 2}, "q16ang": {"native": "Int32Array", "offset": 80, "size": 4}, "q16angvel": {"native": "Int32Array", "offset": 88, "size": 4}, "q16horiz": {"native": "Int32Array", "offset": 64, "size": 4}, "q16horizoff": {"native": "Int32Array", "offset": 68, "size": 4}, "quick_kick": {"native": "Uint8Array", "offset": 584, "size": 1}, "random_club_frame": {"native": "Int16Array", "offset": 520, "size": 2}, "rapid_fire_hold": {"native": "Uint8Array", "offset": 604, "size": 1}, "reloading": {"native": "Uint8Array", "offset": 587, "size": 1}, "return_to_center": {"native": "Uint8Array", "offset": 586, "size": 1}, "rotscrnang": {"native": "Int16Array", "offset": 570, "size": 2}, "runspeed": {"native": "Int32Array", "offset": 104, "size": 4}, "sbs": {"native": "Int16Array", "offset": 400, "size": 2}, "scream_voice": {"native": "Int8Array", "offset": 630, "size": 1}, "scuba_on": {"native": "Uint8Array", "offset": 612, "size": 1}, "secret_rooms": {"native": "Uint8Array", "offset": 583, "size": 1}, "show_empty_weapon": {"native": "Uint8Array", "offset": 609, "size": 1}, "shrunkzoffset": {"native": "Int16Array", "offset": 382, "size": 2}, "somethingonplayer": {"native": "Int16Array", "offset": 512, "size": 2}, "sound_pitch": {"native": "Int16Array", "offset": 402, "size": 2}, "spritebridge": {"native": "Uint8Array", "offset": 611, "size": 1}, "spritezoffset": {"native": "Int16Array", "offset": 376, "size": 2}, "subweapon": {"native": "Int16Array", "offset": 410, "size": 2}, "swimspeedmodifier": {"native": "Int16Array", "offset": 388, "size": 2}, "swimzincrement": {"native": "Int16Array", "offset": 390, "size": 2}, "team": {"native": "Uint8Array", "offset": 593, "size": 1}, "timebeforeexit": {"native": "Int16Array", "offset": 530, "size": 2}, "tipincs": {"native": "Uint8Array", "offset": 594, "size": 1}, "toggle_key_flag": {"native": "Uint8Array", "offset": 620, "size": 1}, "transporter_hold": {"native": "Int16Array", "offset": 578, "size": 2}, "truecz": {"native": "Int32Array", "offset": 96, "size": 4}, "truefz": {"native": "Int32Array", "offset": 92, "size": 4}, "vel": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 24}, "visibility": {"native": "Int16Array", "offset": 510, "size": 2}, "wackedbyactor": {"native": "Int16Array", "offset": 486, "size": 2}, "walking_snd_toggle": {"native": "Uint8Array", "offset": 624, "size": 1}, "wantweaponfire": {"native": "Int8Array", "offset": 634, "size": 1}, "waterzoffset": {"native": "Int16Array", "offset": 380, "size": 2}, "weapon_ang": {"native": "Int16Array", "offset": 508, "size": 2}, "weapon_pos": {"native": "Int8Array", "offset": 633, "size": 1}, "weapon_sway": {"native": "Int16Array", "offset": 562, "size": 2}, "weaponswitch": {"native": "Uint8Array", "offset": 591, "size": 1}, "weapreccnt": {"native": "Uint8Array", "offset": 588, "size": 1}, "weaprecs": {"length": 13, "native": "Int16Array", "offset": 536, "size": 26}, "zoom": {"native": "Uint16Array", "offset": 138, "size": 2}}, "overlaps": true, "size": 640, "union": false}, {})).weaponswitch = (u32((u32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.weaponswitch) & 255)) & 255));
}

// C/C++ source: source/duke3d/src/game.cpp:293
export function G_HaveUserMap__header_15b4a3bd2091() {
  return i32((((i32((cDeref(cPointerOffset(boardfilename, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) != 0) && (__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.level_number == 7)) && (__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.volume_number == 0)));
}

export function mulscale9__header_892ae3e42452(eax, edx) {
  return i32(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) >> BigInt(i32((u32((u32(9) & 255)) & 255))))));
}

// C/C++ source: source/duke3d/src/game.cpp:431
let __static_G_GetTeamPalette__header_a2181cbc67c1_pal = new Int8Array([((u32(3) << 24) >> 24), ((u32(10) << 24) >> 24), ((u32(11) << 24) >> 24), ((u32(12) << 24) >> 24)]);
export function G_GetTeamPalette__header_a2181cbc67c1(team) {

  if ((u64(u32(team)) >= ARRAY_SIZE__header_bfe944817cc0(__static_G_GetTeamPalette__header_a2181cbc67c1_pal))) {
    return i32(0);
  }
  return i32((cDeref(cPointerOffset(__static_G_GetTeamPalette__header_a2181cbc67c1_pal, team, Int8Array.BYTES_PER_ELEMENT), Int8Array).value));
}

// C/C++ source: source/duke3d/src/game.cpp:88
export function idle__header_cf379e75d7bd(msec) {
  let req = cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"tv_nsec": {"native": "BigInt64Array", "offset": 8, "size": 8}, "tv_sec": {"native": "BigInt64Array", "offset": 0, "size": 8}}, "overlaps": false, "size": 16, "union": false}, {"tv_sec": i64(0), "tv_nsec": i64(i32(Math.imul(msec, 1000000)))}, null, {});
  do {

  } while (Boolean(nanosleep(req, req)));
}

// C/C++ source: source/duke3d/src/game.cpp:328
export function ksgn__header_b773516e10d7(a) {
  return i32((i32((a > 0)) - i32((a < 0))));
}

// C/C++ source: source/duke3d/src/game.cpp:164
export function divscale__header_c72624098a8a(eax, ebx, ecx) {
  return i32(tabledivide64__header_18a105f3e279(i64((BigInt(i64(eax)) << BigInt(i32((u32((u32(ecx) & 255)) & 255))))), i64(ebx)));
}

// C/C++ source: source/duke3d/src/game.cpp:700
export function renderMakeTSpriteFromSprite__header_7e20003a0552(tspr, spritenum) {
  let spr = cRecordPointer(cPointerOffset(__cxx_global_cell_4a046e33ecf7aced9bfd0007().value, spritenum, 44), {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xyz": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "__cxx_anonymous_15": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"xvel": {"native": "Int16Array", "offset": 0, "size": 2}, "yvel": {"native": "Int16Array", "offset": 2, "size": 2}, "zvel": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "vel": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}, "z": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"d": {"native": "Int16Array", "offset": 0, "size": 2}, "u": {"native": "Int16Array", "offset": 2, "size": 2}, "v": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 0}}, "overlaps": true, "size": 6, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 32}, "ang": {"native": "Int16Array", "offset": 28, "size": 2}, "blend": {"native": "Uint8Array", "offset": 19, "size": 1}, "clipdist": {"native": "Uint8Array", "offset": 18, "size": 1}, "cstat": {"native": "Uint16Array", "offset": 12, "size": 2}, "extra": {"native": "Int16Array", "offset": 42, "size": 2}, "hitag": {"native": "Int16Array", "offset": 40, "size": 2}, "lotag": {"native": "Int16Array", "offset": 38, "size": 2}, "owner": {"native": "Int16Array", "offset": 30, "size": 2}, "pal": {"native": "Uint8Array", "offset": 17, "size": 1}, "picnum": {"native": "Int16Array", "offset": 14, "size": 2}, "sectnum": {"native": "Int16Array", "offset": 24, "size": 2}, "shade": {"native": "Int8Array", "offset": 16, "size": 1}, "statnum": {"native": "Int16Array", "offset": 26, "size": 2}, "xoffset": {"native": "Int8Array", "offset": 22, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 20, "size": 1}, "yoffset": {"native": "Int8Array", "offset": 23, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 21, "size": 1}}, "overlaps": true, "size": 44, "union": false}, {});
  cAssignAggregate(cRecordObject(cRecordPointer(tspr, {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xyz": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "__cxx_anonymous_15": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"xvel": {"native": "Int16Array", "offset": 0, "size": 2}, "yvel": {"native": "Int16Array", "offset": 2, "size": 2}, "zvel": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "vel": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}, "z": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"d": {"native": "Int16Array", "offset": 0, "size": 2}, "u": {"native": "Int16Array", "offset": 2, "size": 2}, "v": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 0}}, "overlaps": true, "size": 6, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 32}, "ang": {"native": "Int16Array", "offset": 28, "size": 2}, "blend": {"native": "Uint8Array", "offset": 19, "size": 1}, "clipdist": {"native": "Uint8Array", "offset": 18, "size": 1}, "cstat": {"native": "Uint16Array", "offset": 12, "size": 2}, "extra": {"native": "Int16Array", "offset": 42, "size": 2}, "hitag": {"native": "Int16Array", "offset": 40, "size": 2}, "lotag": {"native": "Int16Array", "offset": 38, "size": 2}, "owner": {"native": "Int16Array", "offset": 30, "size": 2}, "pal": {"native": "Uint8Array", "offset": 17, "size": 1}, "picnum": {"native": "Int16Array", "offset": 14, "size": 2}, "sectnum": {"native": "Int16Array", "offset": 24, "size": 2}, "shade": {"native": "Int8Array", "offset": 16, "size": 1}, "statnum": {"native": "Int16Array", "offset": 26, "size": 2}, "xoffset": {"native": "Int8Array", "offset": 22, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 20, "size": 1}, "yoffset": {"native": "Int8Array", "offset": 23, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 21, "size": 1}}, "overlaps": true, "size": 44, "union": false}, {})).__cxx_anonymous_0.xyz, cRecordObject(cRecordPointer(spr, {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xyz": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "__cxx_anonymous_15": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"xvel": {"native": "Int16Array", "offset": 0, "size": 2}, "yvel": {"native": "Int16Array", "offset": 2, "size": 2}, "zvel": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "vel": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}, "z": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"d": {"native": "Int16Array", "offset": 0, "size": 2}, "u": {"native": "Int16Array", "offset": 2, "size": 2}, "v": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 0}}, "overlaps": true, "size": 6, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 32}, "ang": {"native": "Int16Array", "offset": 28, "size": 2}, "blend": {"native": "Uint8Array", "offset": 19, "size": 1}, "clipdist": {"native": "Uint8Array", "offset": 18, "size": 1}, "cstat": {"native": "Uint16Array", "offset": 12, "size": 2}, "extra": {"native": "Int16Array", "offset": 42, "size": 2}, "hitag": {"native": "Int16Array", "offset": 40, "size": 2}, "lotag": {"native": "Int16Array", "offset": 38, "size": 2}, "owner": {"native": "Int16Array", "offset": 30, "size": 2}, "pal": {"native": "Uint8Array", "offset": 17, "size": 1}, "picnum": {"native": "Int16Array", "offset": 14, "size": 2}, "sectnum": {"native": "Int16Array", "offset": 24, "size": 2}, "shade": {"native": "Int8Array", "offset": 16, "size": 1}, "statnum": {"native": "Int16Array", "offset": 26, "size": 2}, "xoffset": {"native": "Int8Array", "offset": 22, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 20, "size": 1}, "yoffset": {"native": "Int8Array", "offset": 23, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 21, "size": 1}}, "overlaps": true, "size": 44, "union": false}, {})).__cxx_anonymous_0.xyz, {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}});
  (cRecordObject(cRecordPointer(tspr, {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xyz": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "__cxx_anonymous_15": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"xvel": {"native": "Int16Array", "offset": 0, "size": 2}, "yvel": {"native": "Int16Array", "offset": 2, "size": 2}, "zvel": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "vel": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}, "z": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"d": {"native": "Int16Array", "offset": 0, "size": 2}, "u": {"native": "Int16Array", "offset": 2, "size": 2}, "v": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 0}}, "overlaps": true, "size": 6, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 32}, "ang": {"native": "Int16Array", "offset": 28, "size": 2}, "blend": {"native": "Uint8Array", "offset": 19, "size": 1}, "clipdist": {"native": "Uint8Array", "offset": 18, "size": 1}, "cstat": {"native": "Uint16Array", "offset": 12, "size": 2}, "extra": {"native": "Int16Array", "offset": 42, "size": 2}, "hitag": {"native": "Int16Array", "offset": 40, "size": 2}, "lotag": {"native": "Int16Array", "offset": 38, "size": 2}, "owner": {"native": "Int16Array", "offset": 30, "size": 2}, "pal": {"native": "Uint8Array", "offset": 17, "size": 1}, "picnum": {"native": "Int16Array", "offset": 14, "size": 2}, "sectnum": {"native": "Int16Array", "offset": 24, "size": 2}, "shade": {"native": "Int8Array", "offset": 16, "size": 1}, "statnum": {"native": "Int16Array", "offset": 26, "size": 2}, "xoffset": {"native": "Int8Array", "offset": 22, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 20, "size": 1}, "yoffset": {"native": "Int8Array", "offset": 23, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 21, "size": 1}}, "overlaps": true, "size": 44, "union": false}, {})).cstat = (u32(cRecordObject(cRecordPointer(spr, {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xyz": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "__cxx_anonymous_15": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"xvel": {"native": "Int16Array", "offset": 0, "size": 2}, "yvel": {"native": "Int16Array", "offset": 2, "size": 2}, "zvel": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "vel": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}, "z": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"d": {"native": "Int16Array", "offset": 0, "size": 2}, "u": {"native": "Int16Array", "offset": 2, "size": 2}, "v": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 0}}, "overlaps": true, "size": 6, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 32}, "ang": {"native": "Int16Array", "offset": 28, "size": 2}, "blend": {"native": "Uint8Array", "offset": 19, "size": 1}, "clipdist": {"native": "Uint8Array", "offset": 18, "size": 1}, "cstat": {"native": "Uint16Array", "offset": 12, "size": 2}, "extra": {"native": "Int16Array", "offset": 42, "size": 2}, "hitag": {"native": "Int16Array", "offset": 40, "size": 2}, "lotag": {"native": "Int16Array", "offset": 38, "size": 2}, "owner": {"native": "Int16Array", "offset": 30, "size": 2}, "pal": {"native": "Uint8Array", "offset": 17, "size": 1}, "picnum": {"native": "Int16Array", "offset": 14, "size": 2}, "sectnum": {"native": "Int16Array", "offset": 24, "size": 2}, "shade": {"native": "Int8Array", "offset": 16, "size": 1}, "statnum": {"native": "Int16Array", "offset": 26, "size": 2}, "xoffset": {"native": "Int8Array", "offset": 22, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 20, "size": 1}, "yoffset": {"native": "Int8Array", "offset": 23, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 21, "size": 1}}, "overlaps": true, "size": 44, "union": false}, {})).cstat) & 65535));
  (cRecordObject(cRecordPointer(tspr, {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xyz": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "__cxx_anonymous_15": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"xvel": {"native": "Int16Array", "offset": 0, "size": 2}, "yvel": {"native": "Int16Array", "offset": 2, "size": 2}, "zvel": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "vel": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}, "z": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"d": {"native": "Int16Array", "offset": 0, "size": 2}, "u": {"native": "Int16Array", "offset": 2, "size": 2}, "v": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 0}}, "overlaps": true, "size": 6, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 32}, "ang": {"native": "Int16Array", "offset": 28, "size": 2}, "blend": {"native": "Uint8Array", "offset": 19, "size": 1}, "clipdist": {"native": "Uint8Array", "offset": 18, "size": 1}, "cstat": {"native": "Uint16Array", "offset": 12, "size": 2}, "extra": {"native": "Int16Array", "offset": 42, "size": 2}, "hitag": {"native": "Int16Array", "offset": 40, "size": 2}, "lotag": {"native": "Int16Array", "offset": 38, "size": 2}, "owner": {"native": "Int16Array", "offset": 30, "size": 2}, "pal": {"native": "Uint8Array", "offset": 17, "size": 1}, "picnum": {"native": "Int16Array", "offset": 14, "size": 2}, "sectnum": {"native": "Int16Array", "offset": 24, "size": 2}, "shade": {"native": "Int8Array", "offset": 16, "size": 1}, "statnum": {"native": "Int16Array", "offset": 26, "size": 2}, "xoffset": {"native": "Int8Array", "offset": 22, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 20, "size": 1}, "yoffset": {"native": "Int8Array", "offset": 23, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 21, "size": 1}}, "overlaps": true, "size": 44, "union": false}, {})).picnum = ((u32(cRecordObject(cRecordPointer(spr, {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xyz": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "__cxx_anonymous_15": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"xvel": {"native": "Int16Array", "offset": 0, "size": 2}, "yvel": {"native": "Int16Array", "offset": 2, "size": 2}, "zvel": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "vel": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}, "z": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"d": {"native": "Int16Array", "offset": 0, "size": 2}, "u": {"native": "Int16Array", "offset": 2, "size": 2}, "v": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 0}}, "overlaps": true, "size": 6, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 32}, "ang": {"native": "Int16Array", "offset": 28, "size": 2}, "blend": {"native": "Uint8Array", "offset": 19, "size": 1}, "clipdist": {"native": "Uint8Array", "offset": 18, "size": 1}, "cstat": {"native": "Uint16Array", "offset": 12, "size": 2}, "extra": {"native": "Int16Array", "offset": 42, "size": 2}, "hitag": {"native": "Int16Array", "offset": 40, "size": 2}, "lotag": {"native": "Int16Array", "offset": 38, "size": 2}, "owner": {"native": "Int16Array", "offset": 30, "size": 2}, "pal": {"native": "Uint8Array", "offset": 17, "size": 1}, "picnum": {"native": "Int16Array", "offset": 14, "size": 2}, "sectnum": {"native": "Int16Array", "offset": 24, "size": 2}, "shade": {"native": "Int8Array", "offset": 16, "size": 1}, "statnum": {"native": "Int16Array", "offset": 26, "size": 2}, "xoffset": {"native": "Int8Array", "offset": 22, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 20, "size": 1}, "yoffset": {"native": "Int8Array", "offset": 23, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 21, "size": 1}}, "overlaps": true, "size": 44, "union": false}, {})).picnum) << 16) >> 16));
  (cRecordObject(cRecordPointer(tspr, {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xyz": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "__cxx_anonymous_15": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"xvel": {"native": "Int16Array", "offset": 0, "size": 2}, "yvel": {"native": "Int16Array", "offset": 2, "size": 2}, "zvel": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "vel": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}, "z": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"d": {"native": "Int16Array", "offset": 0, "size": 2}, "u": {"native": "Int16Array", "offset": 2, "size": 2}, "v": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 0}}, "overlaps": true, "size": 6, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 32}, "ang": {"native": "Int16Array", "offset": 28, "size": 2}, "blend": {"native": "Uint8Array", "offset": 19, "size": 1}, "clipdist": {"native": "Uint8Array", "offset": 18, "size": 1}, "cstat": {"native": "Uint16Array", "offset": 12, "size": 2}, "extra": {"native": "Int16Array", "offset": 42, "size": 2}, "hitag": {"native": "Int16Array", "offset": 40, "size": 2}, "lotag": {"native": "Int16Array", "offset": 38, "size": 2}, "owner": {"native": "Int16Array", "offset": 30, "size": 2}, "pal": {"native": "Uint8Array", "offset": 17, "size": 1}, "picnum": {"native": "Int16Array", "offset": 14, "size": 2}, "sectnum": {"native": "Int16Array", "offset": 24, "size": 2}, "shade": {"native": "Int8Array", "offset": 16, "size": 1}, "statnum": {"native": "Int16Array", "offset": 26, "size": 2}, "xoffset": {"native": "Int8Array", "offset": 22, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 20, "size": 1}, "yoffset": {"native": "Int8Array", "offset": 23, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 21, "size": 1}}, "overlaps": true, "size": 44, "union": false}, {})).shade = ((u32(cRecordObject(cRecordPointer(spr, {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xyz": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "__cxx_anonymous_15": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"xvel": {"native": "Int16Array", "offset": 0, "size": 2}, "yvel": {"native": "Int16Array", "offset": 2, "size": 2}, "zvel": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "vel": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}, "z": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"d": {"native": "Int16Array", "offset": 0, "size": 2}, "u": {"native": "Int16Array", "offset": 2, "size": 2}, "v": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 0}}, "overlaps": true, "size": 6, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 32}, "ang": {"native": "Int16Array", "offset": 28, "size": 2}, "blend": {"native": "Uint8Array", "offset": 19, "size": 1}, "clipdist": {"native": "Uint8Array", "offset": 18, "size": 1}, "cstat": {"native": "Uint16Array", "offset": 12, "size": 2}, "extra": {"native": "Int16Array", "offset": 42, "size": 2}, "hitag": {"native": "Int16Array", "offset": 40, "size": 2}, "lotag": {"native": "Int16Array", "offset": 38, "size": 2}, "owner": {"native": "Int16Array", "offset": 30, "size": 2}, "pal": {"native": "Uint8Array", "offset": 17, "size": 1}, "picnum": {"native": "Int16Array", "offset": 14, "size": 2}, "sectnum": {"native": "Int16Array", "offset": 24, "size": 2}, "shade": {"native": "Int8Array", "offset": 16, "size": 1}, "statnum": {"native": "Int16Array", "offset": 26, "size": 2}, "xoffset": {"native": "Int8Array", "offset": 22, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 20, "size": 1}, "yoffset": {"native": "Int8Array", "offset": 23, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 21, "size": 1}}, "overlaps": true, "size": 44, "union": false}, {})).shade) << 24) >> 24));
  (cRecordObject(cRecordPointer(tspr, {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xyz": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "__cxx_anonymous_15": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"xvel": {"native": "Int16Array", "offset": 0, "size": 2}, "yvel": {"native": "Int16Array", "offset": 2, "size": 2}, "zvel": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "vel": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}, "z": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"d": {"native": "Int16Array", "offset": 0, "size": 2}, "u": {"native": "Int16Array", "offset": 2, "size": 2}, "v": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 0}}, "overlaps": true, "size": 6, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 32}, "ang": {"native": "Int16Array", "offset": 28, "size": 2}, "blend": {"native": "Uint8Array", "offset": 19, "size": 1}, "clipdist": {"native": "Uint8Array", "offset": 18, "size": 1}, "cstat": {"native": "Uint16Array", "offset": 12, "size": 2}, "extra": {"native": "Int16Array", "offset": 42, "size": 2}, "hitag": {"native": "Int16Array", "offset": 40, "size": 2}, "lotag": {"native": "Int16Array", "offset": 38, "size": 2}, "owner": {"native": "Int16Array", "offset": 30, "size": 2}, "pal": {"native": "Uint8Array", "offset": 17, "size": 1}, "picnum": {"native": "Int16Array", "offset": 14, "size": 2}, "sectnum": {"native": "Int16Array", "offset": 24, "size": 2}, "shade": {"native": "Int8Array", "offset": 16, "size": 1}, "statnum": {"native": "Int16Array", "offset": 26, "size": 2}, "xoffset": {"native": "Int8Array", "offset": 22, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 20, "size": 1}, "yoffset": {"native": "Int8Array", "offset": 23, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 21, "size": 1}}, "overlaps": true, "size": 44, "union": false}, {})).pal = (u32(cRecordObject(cRecordPointer(spr, {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xyz": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "__cxx_anonymous_15": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"xvel": {"native": "Int16Array", "offset": 0, "size": 2}, "yvel": {"native": "Int16Array", "offset": 2, "size": 2}, "zvel": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "vel": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}, "z": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"d": {"native": "Int16Array", "offset": 0, "size": 2}, "u": {"native": "Int16Array", "offset": 2, "size": 2}, "v": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 0}}, "overlaps": true, "size": 6, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 32}, "ang": {"native": "Int16Array", "offset": 28, "size": 2}, "blend": {"native": "Uint8Array", "offset": 19, "size": 1}, "clipdist": {"native": "Uint8Array", "offset": 18, "size": 1}, "cstat": {"native": "Uint16Array", "offset": 12, "size": 2}, "extra": {"native": "Int16Array", "offset": 42, "size": 2}, "hitag": {"native": "Int16Array", "offset": 40, "size": 2}, "lotag": {"native": "Int16Array", "offset": 38, "size": 2}, "owner": {"native": "Int16Array", "offset": 30, "size": 2}, "pal": {"native": "Uint8Array", "offset": 17, "size": 1}, "picnum": {"native": "Int16Array", "offset": 14, "size": 2}, "sectnum": {"native": "Int16Array", "offset": 24, "size": 2}, "shade": {"native": "Int8Array", "offset": 16, "size": 1}, "statnum": {"native": "Int16Array", "offset": 26, "size": 2}, "xoffset": {"native": "Int8Array", "offset": 22, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 20, "size": 1}, "yoffset": {"native": "Int8Array", "offset": 23, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 21, "size": 1}}, "overlaps": true, "size": 44, "union": false}, {})).pal) & 255));
  (cRecordObject(cRecordPointer(tspr, {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xyz": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "__cxx_anonymous_15": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"xvel": {"native": "Int16Array", "offset": 0, "size": 2}, "yvel": {"native": "Int16Array", "offset": 2, "size": 2}, "zvel": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "vel": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}, "z": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"d": {"native": "Int16Array", "offset": 0, "size": 2}, "u": {"native": "Int16Array", "offset": 2, "size": 2}, "v": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 0}}, "overlaps": true, "size": 6, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 32}, "ang": {"native": "Int16Array", "offset": 28, "size": 2}, "blend": {"native": "Uint8Array", "offset": 19, "size": 1}, "clipdist": {"native": "Uint8Array", "offset": 18, "size": 1}, "cstat": {"native": "Uint16Array", "offset": 12, "size": 2}, "extra": {"native": "Int16Array", "offset": 42, "size": 2}, "hitag": {"native": "Int16Array", "offset": 40, "size": 2}, "lotag": {"native": "Int16Array", "offset": 38, "size": 2}, "owner": {"native": "Int16Array", "offset": 30, "size": 2}, "pal": {"native": "Uint8Array", "offset": 17, "size": 1}, "picnum": {"native": "Int16Array", "offset": 14, "size": 2}, "sectnum": {"native": "Int16Array", "offset": 24, "size": 2}, "shade": {"native": "Int8Array", "offset": 16, "size": 1}, "statnum": {"native": "Int16Array", "offset": 26, "size": 2}, "xoffset": {"native": "Int8Array", "offset": 22, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 20, "size": 1}, "yoffset": {"native": "Int8Array", "offset": 23, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 21, "size": 1}}, "overlaps": true, "size": 44, "union": false}, {})).blend = (u32(cRecordObject(cRecordPointer(spr, {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xyz": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "__cxx_anonymous_15": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"xvel": {"native": "Int16Array", "offset": 0, "size": 2}, "yvel": {"native": "Int16Array", "offset": 2, "size": 2}, "zvel": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "vel": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}, "z": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"d": {"native": "Int16Array", "offset": 0, "size": 2}, "u": {"native": "Int16Array", "offset": 2, "size": 2}, "v": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 0}}, "overlaps": true, "size": 6, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 32}, "ang": {"native": "Int16Array", "offset": 28, "size": 2}, "blend": {"native": "Uint8Array", "offset": 19, "size": 1}, "clipdist": {"native": "Uint8Array", "offset": 18, "size": 1}, "cstat": {"native": "Uint16Array", "offset": 12, "size": 2}, "extra": {"native": "Int16Array", "offset": 42, "size": 2}, "hitag": {"native": "Int16Array", "offset": 40, "size": 2}, "lotag": {"native": "Int16Array", "offset": 38, "size": 2}, "owner": {"native": "Int16Array", "offset": 30, "size": 2}, "pal": {"native": "Uint8Array", "offset": 17, "size": 1}, "picnum": {"native": "Int16Array", "offset": 14, "size": 2}, "sectnum": {"native": "Int16Array", "offset": 24, "size": 2}, "shade": {"native": "Int8Array", "offset": 16, "size": 1}, "statnum": {"native": "Int16Array", "offset": 26, "size": 2}, "xoffset": {"native": "Int8Array", "offset": 22, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 20, "size": 1}, "yoffset": {"native": "Int8Array", "offset": 23, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 21, "size": 1}}, "overlaps": true, "size": 44, "union": false}, {})).blend) & 255));
  (cRecordObject(cRecordPointer(tspr, {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xyz": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "__cxx_anonymous_15": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"xvel": {"native": "Int16Array", "offset": 0, "size": 2}, "yvel": {"native": "Int16Array", "offset": 2, "size": 2}, "zvel": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "vel": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}, "z": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"d": {"native": "Int16Array", "offset": 0, "size": 2}, "u": {"native": "Int16Array", "offset": 2, "size": 2}, "v": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 0}}, "overlaps": true, "size": 6, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 32}, "ang": {"native": "Int16Array", "offset": 28, "size": 2}, "blend": {"native": "Uint8Array", "offset": 19, "size": 1}, "clipdist": {"native": "Uint8Array", "offset": 18, "size": 1}, "cstat": {"native": "Uint16Array", "offset": 12, "size": 2}, "extra": {"native": "Int16Array", "offset": 42, "size": 2}, "hitag": {"native": "Int16Array", "offset": 40, "size": 2}, "lotag": {"native": "Int16Array", "offset": 38, "size": 2}, "owner": {"native": "Int16Array", "offset": 30, "size": 2}, "pal": {"native": "Uint8Array", "offset": 17, "size": 1}, "picnum": {"native": "Int16Array", "offset": 14, "size": 2}, "sectnum": {"native": "Int16Array", "offset": 24, "size": 2}, "shade": {"native": "Int8Array", "offset": 16, "size": 1}, "statnum": {"native": "Int16Array", "offset": 26, "size": 2}, "xoffset": {"native": "Int8Array", "offset": 22, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 20, "size": 1}, "yoffset": {"native": "Int8Array", "offset": 23, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 21, "size": 1}}, "overlaps": true, "size": 44, "union": false}, {})).xrepeat = (u32(cRecordObject(cRecordPointer(spr, {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xyz": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "__cxx_anonymous_15": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"xvel": {"native": "Int16Array", "offset": 0, "size": 2}, "yvel": {"native": "Int16Array", "offset": 2, "size": 2}, "zvel": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "vel": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}, "z": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"d": {"native": "Int16Array", "offset": 0, "size": 2}, "u": {"native": "Int16Array", "offset": 2, "size": 2}, "v": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 0}}, "overlaps": true, "size": 6, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 32}, "ang": {"native": "Int16Array", "offset": 28, "size": 2}, "blend": {"native": "Uint8Array", "offset": 19, "size": 1}, "clipdist": {"native": "Uint8Array", "offset": 18, "size": 1}, "cstat": {"native": "Uint16Array", "offset": 12, "size": 2}, "extra": {"native": "Int16Array", "offset": 42, "size": 2}, "hitag": {"native": "Int16Array", "offset": 40, "size": 2}, "lotag": {"native": "Int16Array", "offset": 38, "size": 2}, "owner": {"native": "Int16Array", "offset": 30, "size": 2}, "pal": {"native": "Uint8Array", "offset": 17, "size": 1}, "picnum": {"native": "Int16Array", "offset": 14, "size": 2}, "sectnum": {"native": "Int16Array", "offset": 24, "size": 2}, "shade": {"native": "Int8Array", "offset": 16, "size": 1}, "statnum": {"native": "Int16Array", "offset": 26, "size": 2}, "xoffset": {"native": "Int8Array", "offset": 22, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 20, "size": 1}, "yoffset": {"native": "Int8Array", "offset": 23, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 21, "size": 1}}, "overlaps": true, "size": 44, "union": false}, {})).xrepeat) & 255));
  (cRecordObject(cRecordPointer(tspr, {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xyz": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "__cxx_anonymous_15": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"xvel": {"native": "Int16Array", "offset": 0, "size": 2}, "yvel": {"native": "Int16Array", "offset": 2, "size": 2}, "zvel": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "vel": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}, "z": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"d": {"native": "Int16Array", "offset": 0, "size": 2}, "u": {"native": "Int16Array", "offset": 2, "size": 2}, "v": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 0}}, "overlaps": true, "size": 6, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 32}, "ang": {"native": "Int16Array", "offset": 28, "size": 2}, "blend": {"native": "Uint8Array", "offset": 19, "size": 1}, "clipdist": {"native": "Uint8Array", "offset": 18, "size": 1}, "cstat": {"native": "Uint16Array", "offset": 12, "size": 2}, "extra": {"native": "Int16Array", "offset": 42, "size": 2}, "hitag": {"native": "Int16Array", "offset": 40, "size": 2}, "lotag": {"native": "Int16Array", "offset": 38, "size": 2}, "owner": {"native": "Int16Array", "offset": 30, "size": 2}, "pal": {"native": "Uint8Array", "offset": 17, "size": 1}, "picnum": {"native": "Int16Array", "offset": 14, "size": 2}, "sectnum": {"native": "Int16Array", "offset": 24, "size": 2}, "shade": {"native": "Int8Array", "offset": 16, "size": 1}, "statnum": {"native": "Int16Array", "offset": 26, "size": 2}, "xoffset": {"native": "Int8Array", "offset": 22, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 20, "size": 1}, "yoffset": {"native": "Int8Array", "offset": 23, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 21, "size": 1}}, "overlaps": true, "size": 44, "union": false}, {})).yrepeat = (u32(cRecordObject(cRecordPointer(spr, {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xyz": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "__cxx_anonymous_15": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"xvel": {"native": "Int16Array", "offset": 0, "size": 2}, "yvel": {"native": "Int16Array", "offset": 2, "size": 2}, "zvel": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "vel": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}, "z": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"d": {"native": "Int16Array", "offset": 0, "size": 2}, "u": {"native": "Int16Array", "offset": 2, "size": 2}, "v": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 0}}, "overlaps": true, "size": 6, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 32}, "ang": {"native": "Int16Array", "offset": 28, "size": 2}, "blend": {"native": "Uint8Array", "offset": 19, "size": 1}, "clipdist": {"native": "Uint8Array", "offset": 18, "size": 1}, "cstat": {"native": "Uint16Array", "offset": 12, "size": 2}, "extra": {"native": "Int16Array", "offset": 42, "size": 2}, "hitag": {"native": "Int16Array", "offset": 40, "size": 2}, "lotag": {"native": "Int16Array", "offset": 38, "size": 2}, "owner": {"native": "Int16Array", "offset": 30, "size": 2}, "pal": {"native": "Uint8Array", "offset": 17, "size": 1}, "picnum": {"native": "Int16Array", "offset": 14, "size": 2}, "sectnum": {"native": "Int16Array", "offset": 24, "size": 2}, "shade": {"native": "Int8Array", "offset": 16, "size": 1}, "statnum": {"native": "Int16Array", "offset": 26, "size": 2}, "xoffset": {"native": "Int8Array", "offset": 22, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 20, "size": 1}, "yoffset": {"native": "Int8Array", "offset": 23, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 21, "size": 1}}, "overlaps": true, "size": 44, "union": false}, {})).yrepeat) & 255));
  (cRecordObject(cRecordPointer(tspr, {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xyz": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "__cxx_anonymous_15": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"xvel": {"native": "Int16Array", "offset": 0, "size": 2}, "yvel": {"native": "Int16Array", "offset": 2, "size": 2}, "zvel": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "vel": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}, "z": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"d": {"native": "Int16Array", "offset": 0, "size": 2}, "u": {"native": "Int16Array", "offset": 2, "size": 2}, "v": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 0}}, "overlaps": true, "size": 6, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 32}, "ang": {"native": "Int16Array", "offset": 28, "size": 2}, "blend": {"native": "Uint8Array", "offset": 19, "size": 1}, "clipdist": {"native": "Uint8Array", "offset": 18, "size": 1}, "cstat": {"native": "Uint16Array", "offset": 12, "size": 2}, "extra": {"native": "Int16Array", "offset": 42, "size": 2}, "hitag": {"native": "Int16Array", "offset": 40, "size": 2}, "lotag": {"native": "Int16Array", "offset": 38, "size": 2}, "owner": {"native": "Int16Array", "offset": 30, "size": 2}, "pal": {"native": "Uint8Array", "offset": 17, "size": 1}, "picnum": {"native": "Int16Array", "offset": 14, "size": 2}, "sectnum": {"native": "Int16Array", "offset": 24, "size": 2}, "shade": {"native": "Int8Array", "offset": 16, "size": 1}, "statnum": {"native": "Int16Array", "offset": 26, "size": 2}, "xoffset": {"native": "Int8Array", "offset": 22, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 20, "size": 1}, "yoffset": {"native": "Int8Array", "offset": 23, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 21, "size": 1}}, "overlaps": true, "size": 44, "union": false}, {})).xoffset = ((u32(cRecordObject(cRecordPointer(spr, {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xyz": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "__cxx_anonymous_15": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"xvel": {"native": "Int16Array", "offset": 0, "size": 2}, "yvel": {"native": "Int16Array", "offset": 2, "size": 2}, "zvel": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "vel": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}, "z": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"d": {"native": "Int16Array", "offset": 0, "size": 2}, "u": {"native": "Int16Array", "offset": 2, "size": 2}, "v": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 0}}, "overlaps": true, "size": 6, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 32}, "ang": {"native": "Int16Array", "offset": 28, "size": 2}, "blend": {"native": "Uint8Array", "offset": 19, "size": 1}, "clipdist": {"native": "Uint8Array", "offset": 18, "size": 1}, "cstat": {"native": "Uint16Array", "offset": 12, "size": 2}, "extra": {"native": "Int16Array", "offset": 42, "size": 2}, "hitag": {"native": "Int16Array", "offset": 40, "size": 2}, "lotag": {"native": "Int16Array", "offset": 38, "size": 2}, "owner": {"native": "Int16Array", "offset": 30, "size": 2}, "pal": {"native": "Uint8Array", "offset": 17, "size": 1}, "picnum": {"native": "Int16Array", "offset": 14, "size": 2}, "sectnum": {"native": "Int16Array", "offset": 24, "size": 2}, "shade": {"native": "Int8Array", "offset": 16, "size": 1}, "statnum": {"native": "Int16Array", "offset": 26, "size": 2}, "xoffset": {"native": "Int8Array", "offset": 22, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 20, "size": 1}, "yoffset": {"native": "Int8Array", "offset": 23, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 21, "size": 1}}, "overlaps": true, "size": 44, "union": false}, {})).xoffset) << 24) >> 24));
  (cRecordObject(cRecordPointer(tspr, {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xyz": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "__cxx_anonymous_15": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"xvel": {"native": "Int16Array", "offset": 0, "size": 2}, "yvel": {"native": "Int16Array", "offset": 2, "size": 2}, "zvel": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "vel": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}, "z": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"d": {"native": "Int16Array", "offset": 0, "size": 2}, "u": {"native": "Int16Array", "offset": 2, "size": 2}, "v": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 0}}, "overlaps": true, "size": 6, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 32}, "ang": {"native": "Int16Array", "offset": 28, "size": 2}, "blend": {"native": "Uint8Array", "offset": 19, "size": 1}, "clipdist": {"native": "Uint8Array", "offset": 18, "size": 1}, "cstat": {"native": "Uint16Array", "offset": 12, "size": 2}, "extra": {"native": "Int16Array", "offset": 42, "size": 2}, "hitag": {"native": "Int16Array", "offset": 40, "size": 2}, "lotag": {"native": "Int16Array", "offset": 38, "size": 2}, "owner": {"native": "Int16Array", "offset": 30, "size": 2}, "pal": {"native": "Uint8Array", "offset": 17, "size": 1}, "picnum": {"native": "Int16Array", "offset": 14, "size": 2}, "sectnum": {"native": "Int16Array", "offset": 24, "size": 2}, "shade": {"native": "Int8Array", "offset": 16, "size": 1}, "statnum": {"native": "Int16Array", "offset": 26, "size": 2}, "xoffset": {"native": "Int8Array", "offset": 22, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 20, "size": 1}, "yoffset": {"native": "Int8Array", "offset": 23, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 21, "size": 1}}, "overlaps": true, "size": 44, "union": false}, {})).yoffset = ((u32(cRecordObject(cRecordPointer(spr, {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xyz": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "__cxx_anonymous_15": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"xvel": {"native": "Int16Array", "offset": 0, "size": 2}, "yvel": {"native": "Int16Array", "offset": 2, "size": 2}, "zvel": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "vel": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}, "z": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"d": {"native": "Int16Array", "offset": 0, "size": 2}, "u": {"native": "Int16Array", "offset": 2, "size": 2}, "v": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 0}}, "overlaps": true, "size": 6, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 32}, "ang": {"native": "Int16Array", "offset": 28, "size": 2}, "blend": {"native": "Uint8Array", "offset": 19, "size": 1}, "clipdist": {"native": "Uint8Array", "offset": 18, "size": 1}, "cstat": {"native": "Uint16Array", "offset": 12, "size": 2}, "extra": {"native": "Int16Array", "offset": 42, "size": 2}, "hitag": {"native": "Int16Array", "offset": 40, "size": 2}, "lotag": {"native": "Int16Array", "offset": 38, "size": 2}, "owner": {"native": "Int16Array", "offset": 30, "size": 2}, "pal": {"native": "Uint8Array", "offset": 17, "size": 1}, "picnum": {"native": "Int16Array", "offset": 14, "size": 2}, "sectnum": {"native": "Int16Array", "offset": 24, "size": 2}, "shade": {"native": "Int8Array", "offset": 16, "size": 1}, "statnum": {"native": "Int16Array", "offset": 26, "size": 2}, "xoffset": {"native": "Int8Array", "offset": 22, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 20, "size": 1}, "yoffset": {"native": "Int8Array", "offset": 23, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 21, "size": 1}}, "overlaps": true, "size": 44, "union": false}, {})).yoffset) << 24) >> 24));
  (cRecordObject(cRecordPointer(tspr, {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xyz": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "__cxx_anonymous_15": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"xvel": {"native": "Int16Array", "offset": 0, "size": 2}, "yvel": {"native": "Int16Array", "offset": 2, "size": 2}, "zvel": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "vel": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}, "z": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"d": {"native": "Int16Array", "offset": 0, "size": 2}, "u": {"native": "Int16Array", "offset": 2, "size": 2}, "v": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 0}}, "overlaps": true, "size": 6, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 32}, "ang": {"native": "Int16Array", "offset": 28, "size": 2}, "blend": {"native": "Uint8Array", "offset": 19, "size": 1}, "clipdist": {"native": "Uint8Array", "offset": 18, "size": 1}, "cstat": {"native": "Uint16Array", "offset": 12, "size": 2}, "extra": {"native": "Int16Array", "offset": 42, "size": 2}, "hitag": {"native": "Int16Array", "offset": 40, "size": 2}, "lotag": {"native": "Int16Array", "offset": 38, "size": 2}, "owner": {"native": "Int16Array", "offset": 30, "size": 2}, "pal": {"native": "Uint8Array", "offset": 17, "size": 1}, "picnum": {"native": "Int16Array", "offset": 14, "size": 2}, "sectnum": {"native": "Int16Array", "offset": 24, "size": 2}, "shade": {"native": "Int8Array", "offset": 16, "size": 1}, "statnum": {"native": "Int16Array", "offset": 26, "size": 2}, "xoffset": {"native": "Int8Array", "offset": 22, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 20, "size": 1}, "yoffset": {"native": "Int8Array", "offset": 23, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 21, "size": 1}}, "overlaps": true, "size": 44, "union": false}, {})).sectnum = ((u32(cRecordObject(cRecordPointer(spr, {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xyz": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "__cxx_anonymous_15": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"xvel": {"native": "Int16Array", "offset": 0, "size": 2}, "yvel": {"native": "Int16Array", "offset": 2, "size": 2}, "zvel": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "vel": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}, "z": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"d": {"native": "Int16Array", "offset": 0, "size": 2}, "u": {"native": "Int16Array", "offset": 2, "size": 2}, "v": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 0}}, "overlaps": true, "size": 6, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 32}, "ang": {"native": "Int16Array", "offset": 28, "size": 2}, "blend": {"native": "Uint8Array", "offset": 19, "size": 1}, "clipdist": {"native": "Uint8Array", "offset": 18, "size": 1}, "cstat": {"native": "Uint16Array", "offset": 12, "size": 2}, "extra": {"native": "Int16Array", "offset": 42, "size": 2}, "hitag": {"native": "Int16Array", "offset": 40, "size": 2}, "lotag": {"native": "Int16Array", "offset": 38, "size": 2}, "owner": {"native": "Int16Array", "offset": 30, "size": 2}, "pal": {"native": "Uint8Array", "offset": 17, "size": 1}, "picnum": {"native": "Int16Array", "offset": 14, "size": 2}, "sectnum": {"native": "Int16Array", "offset": 24, "size": 2}, "shade": {"native": "Int8Array", "offset": 16, "size": 1}, "statnum": {"native": "Int16Array", "offset": 26, "size": 2}, "xoffset": {"native": "Int8Array", "offset": 22, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 20, "size": 1}, "yoffset": {"native": "Int8Array", "offset": 23, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 21, "size": 1}}, "overlaps": true, "size": 44, "union": false}, {})).sectnum) << 16) >> 16));
  (cRecordObject(cRecordPointer(tspr, {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xyz": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "__cxx_anonymous_15": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"xvel": {"native": "Int16Array", "offset": 0, "size": 2}, "yvel": {"native": "Int16Array", "offset": 2, "size": 2}, "zvel": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "vel": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}, "z": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"d": {"native": "Int16Array", "offset": 0, "size": 2}, "u": {"native": "Int16Array", "offset": 2, "size": 2}, "v": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 0}}, "overlaps": true, "size": 6, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 32}, "ang": {"native": "Int16Array", "offset": 28, "size": 2}, "blend": {"native": "Uint8Array", "offset": 19, "size": 1}, "clipdist": {"native": "Uint8Array", "offset": 18, "size": 1}, "cstat": {"native": "Uint16Array", "offset": 12, "size": 2}, "extra": {"native": "Int16Array", "offset": 42, "size": 2}, "hitag": {"native": "Int16Array", "offset": 40, "size": 2}, "lotag": {"native": "Int16Array", "offset": 38, "size": 2}, "owner": {"native": "Int16Array", "offset": 30, "size": 2}, "pal": {"native": "Uint8Array", "offset": 17, "size": 1}, "picnum": {"native": "Int16Array", "offset": 14, "size": 2}, "sectnum": {"native": "Int16Array", "offset": 24, "size": 2}, "shade": {"native": "Int8Array", "offset": 16, "size": 1}, "statnum": {"native": "Int16Array", "offset": 26, "size": 2}, "xoffset": {"native": "Int8Array", "offset": 22, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 20, "size": 1}, "yoffset": {"native": "Int8Array", "offset": 23, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 21, "size": 1}}, "overlaps": true, "size": 44, "union": false}, {})).statnum = ((u32(cRecordObject(cRecordPointer(spr, {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xyz": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "__cxx_anonymous_15": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"xvel": {"native": "Int16Array", "offset": 0, "size": 2}, "yvel": {"native": "Int16Array", "offset": 2, "size": 2}, "zvel": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "vel": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}, "z": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"d": {"native": "Int16Array", "offset": 0, "size": 2}, "u": {"native": "Int16Array", "offset": 2, "size": 2}, "v": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 0}}, "overlaps": true, "size": 6, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 32}, "ang": {"native": "Int16Array", "offset": 28, "size": 2}, "blend": {"native": "Uint8Array", "offset": 19, "size": 1}, "clipdist": {"native": "Uint8Array", "offset": 18, "size": 1}, "cstat": {"native": "Uint16Array", "offset": 12, "size": 2}, "extra": {"native": "Int16Array", "offset": 42, "size": 2}, "hitag": {"native": "Int16Array", "offset": 40, "size": 2}, "lotag": {"native": "Int16Array", "offset": 38, "size": 2}, "owner": {"native": "Int16Array", "offset": 30, "size": 2}, "pal": {"native": "Uint8Array", "offset": 17, "size": 1}, "picnum": {"native": "Int16Array", "offset": 14, "size": 2}, "sectnum": {"native": "Int16Array", "offset": 24, "size": 2}, "shade": {"native": "Int8Array", "offset": 16, "size": 1}, "statnum": {"native": "Int16Array", "offset": 26, "size": 2}, "xoffset": {"native": "Int8Array", "offset": 22, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 20, "size": 1}, "yoffset": {"native": "Int8Array", "offset": 23, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 21, "size": 1}}, "overlaps": true, "size": 44, "union": false}, {})).statnum) << 16) >> 16));
  (cRecordObject(cRecordPointer(tspr, {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xyz": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "__cxx_anonymous_15": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"xvel": {"native": "Int16Array", "offset": 0, "size": 2}, "yvel": {"native": "Int16Array", "offset": 2, "size": 2}, "zvel": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "vel": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}, "z": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"d": {"native": "Int16Array", "offset": 0, "size": 2}, "u": {"native": "Int16Array", "offset": 2, "size": 2}, "v": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 0}}, "overlaps": true, "size": 6, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 32}, "ang": {"native": "Int16Array", "offset": 28, "size": 2}, "blend": {"native": "Uint8Array", "offset": 19, "size": 1}, "clipdist": {"native": "Uint8Array", "offset": 18, "size": 1}, "cstat": {"native": "Uint16Array", "offset": 12, "size": 2}, "extra": {"native": "Int16Array", "offset": 42, "size": 2}, "hitag": {"native": "Int16Array", "offset": 40, "size": 2}, "lotag": {"native": "Int16Array", "offset": 38, "size": 2}, "owner": {"native": "Int16Array", "offset": 30, "size": 2}, "pal": {"native": "Uint8Array", "offset": 17, "size": 1}, "picnum": {"native": "Int16Array", "offset": 14, "size": 2}, "sectnum": {"native": "Int16Array", "offset": 24, "size": 2}, "shade": {"native": "Int8Array", "offset": 16, "size": 1}, "statnum": {"native": "Int16Array", "offset": 26, "size": 2}, "xoffset": {"native": "Int8Array", "offset": 22, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 20, "size": 1}, "yoffset": {"native": "Int8Array", "offset": 23, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 21, "size": 1}}, "overlaps": true, "size": 44, "union": false}, {})).ang = ((u32(cRecordObject(cRecordPointer(spr, {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xyz": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "__cxx_anonymous_15": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"xvel": {"native": "Int16Array", "offset": 0, "size": 2}, "yvel": {"native": "Int16Array", "offset": 2, "size": 2}, "zvel": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "vel": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}, "z": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"d": {"native": "Int16Array", "offset": 0, "size": 2}, "u": {"native": "Int16Array", "offset": 2, "size": 2}, "v": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 0}}, "overlaps": true, "size": 6, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 32}, "ang": {"native": "Int16Array", "offset": 28, "size": 2}, "blend": {"native": "Uint8Array", "offset": 19, "size": 1}, "clipdist": {"native": "Uint8Array", "offset": 18, "size": 1}, "cstat": {"native": "Uint16Array", "offset": 12, "size": 2}, "extra": {"native": "Int16Array", "offset": 42, "size": 2}, "hitag": {"native": "Int16Array", "offset": 40, "size": 2}, "lotag": {"native": "Int16Array", "offset": 38, "size": 2}, "owner": {"native": "Int16Array", "offset": 30, "size": 2}, "pal": {"native": "Uint8Array", "offset": 17, "size": 1}, "picnum": {"native": "Int16Array", "offset": 14, "size": 2}, "sectnum": {"native": "Int16Array", "offset": 24, "size": 2}, "shade": {"native": "Int8Array", "offset": 16, "size": 1}, "statnum": {"native": "Int16Array", "offset": 26, "size": 2}, "xoffset": {"native": "Int8Array", "offset": 22, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 20, "size": 1}, "yoffset": {"native": "Int8Array", "offset": 23, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 21, "size": 1}}, "overlaps": true, "size": 44, "union": false}, {})).ang) << 16) >> 16));
  cAssignAggregate(cRecordObject(cRecordPointer(tspr, {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xyz": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "__cxx_anonymous_15": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"xvel": {"native": "Int16Array", "offset": 0, "size": 2}, "yvel": {"native": "Int16Array", "offset": 2, "size": 2}, "zvel": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "vel": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}, "z": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"d": {"native": "Int16Array", "offset": 0, "size": 2}, "u": {"native": "Int16Array", "offset": 2, "size": 2}, "v": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 0}}, "overlaps": true, "size": 6, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 32}, "ang": {"native": "Int16Array", "offset": 28, "size": 2}, "blend": {"native": "Uint8Array", "offset": 19, "size": 1}, "clipdist": {"native": "Uint8Array", "offset": 18, "size": 1}, "cstat": {"native": "Uint16Array", "offset": 12, "size": 2}, "extra": {"native": "Int16Array", "offset": 42, "size": 2}, "hitag": {"native": "Int16Array", "offset": 40, "size": 2}, "lotag": {"native": "Int16Array", "offset": 38, "size": 2}, "owner": {"native": "Int16Array", "offset": 30, "size": 2}, "pal": {"native": "Uint8Array", "offset": 17, "size": 1}, "picnum": {"native": "Int16Array", "offset": 14, "size": 2}, "sectnum": {"native": "Int16Array", "offset": 24, "size": 2}, "shade": {"native": "Int8Array", "offset": 16, "size": 1}, "statnum": {"native": "Int16Array", "offset": 26, "size": 2}, "xoffset": {"native": "Int8Array", "offset": 22, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 20, "size": 1}, "yoffset": {"native": "Int8Array", "offset": 23, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 21, "size": 1}}, "overlaps": true, "size": 44, "union": false}, {})).__cxx_anonymous_15.vel, cRecordObject(cRecordPointer(spr, {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xyz": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "__cxx_anonymous_15": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"xvel": {"native": "Int16Array", "offset": 0, "size": 2}, "yvel": {"native": "Int16Array", "offset": 2, "size": 2}, "zvel": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "vel": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}, "z": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"d": {"native": "Int16Array", "offset": 0, "size": 2}, "u": {"native": "Int16Array", "offset": 2, "size": 2}, "v": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 0}}, "overlaps": true, "size": 6, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 32}, "ang": {"native": "Int16Array", "offset": 28, "size": 2}, "blend": {"native": "Uint8Array", "offset": 19, "size": 1}, "clipdist": {"native": "Uint8Array", "offset": 18, "size": 1}, "cstat": {"native": "Uint16Array", "offset": 12, "size": 2}, "extra": {"native": "Int16Array", "offset": 42, "size": 2}, "hitag": {"native": "Int16Array", "offset": 40, "size": 2}, "lotag": {"native": "Int16Array", "offset": 38, "size": 2}, "owner": {"native": "Int16Array", "offset": 30, "size": 2}, "pal": {"native": "Uint8Array", "offset": 17, "size": 1}, "picnum": {"native": "Int16Array", "offset": 14, "size": 2}, "sectnum": {"native": "Int16Array", "offset": 24, "size": 2}, "shade": {"native": "Int8Array", "offset": 16, "size": 1}, "statnum": {"native": "Int16Array", "offset": 26, "size": 2}, "xoffset": {"native": "Int8Array", "offset": 22, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 20, "size": 1}, "yoffset": {"native": "Int8Array", "offset": 23, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 21, "size": 1}}, "overlaps": true, "size": 44, "union": false}, {})).__cxx_anonymous_15.vel, {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}, "z": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"d": {"native": "Int16Array", "offset": 0, "size": 2}, "u": {"native": "Int16Array", "offset": 2, "size": 2}, "v": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 0}}, "overlaps": true, "size": 6, "union": false}});
  (cRecordObject(cRecordPointer(tspr, {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xyz": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "__cxx_anonymous_15": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"xvel": {"native": "Int16Array", "offset": 0, "size": 2}, "yvel": {"native": "Int16Array", "offset": 2, "size": 2}, "zvel": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "vel": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}, "z": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"d": {"native": "Int16Array", "offset": 0, "size": 2}, "u": {"native": "Int16Array", "offset": 2, "size": 2}, "v": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 0}}, "overlaps": true, "size": 6, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 32}, "ang": {"native": "Int16Array", "offset": 28, "size": 2}, "blend": {"native": "Uint8Array", "offset": 19, "size": 1}, "clipdist": {"native": "Uint8Array", "offset": 18, "size": 1}, "cstat": {"native": "Uint16Array", "offset": 12, "size": 2}, "extra": {"native": "Int16Array", "offset": 42, "size": 2}, "hitag": {"native": "Int16Array", "offset": 40, "size": 2}, "lotag": {"native": "Int16Array", "offset": 38, "size": 2}, "owner": {"native": "Int16Array", "offset": 30, "size": 2}, "pal": {"native": "Uint8Array", "offset": 17, "size": 1}, "picnum": {"native": "Int16Array", "offset": 14, "size": 2}, "sectnum": {"native": "Int16Array", "offset": 24, "size": 2}, "shade": {"native": "Int8Array", "offset": 16, "size": 1}, "statnum": {"native": "Int16Array", "offset": 26, "size": 2}, "xoffset": {"native": "Int8Array", "offset": 22, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 20, "size": 1}, "yoffset": {"native": "Int8Array", "offset": 23, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 21, "size": 1}}, "overlaps": true, "size": 44, "union": false}, {})).lotag = ((u32(cRecordObject(cRecordPointer(spr, {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xyz": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "__cxx_anonymous_15": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"xvel": {"native": "Int16Array", "offset": 0, "size": 2}, "yvel": {"native": "Int16Array", "offset": 2, "size": 2}, "zvel": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "vel": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}, "z": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"d": {"native": "Int16Array", "offset": 0, "size": 2}, "u": {"native": "Int16Array", "offset": 2, "size": 2}, "v": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 0}}, "overlaps": true, "size": 6, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 32}, "ang": {"native": "Int16Array", "offset": 28, "size": 2}, "blend": {"native": "Uint8Array", "offset": 19, "size": 1}, "clipdist": {"native": "Uint8Array", "offset": 18, "size": 1}, "cstat": {"native": "Uint16Array", "offset": 12, "size": 2}, "extra": {"native": "Int16Array", "offset": 42, "size": 2}, "hitag": {"native": "Int16Array", "offset": 40, "size": 2}, "lotag": {"native": "Int16Array", "offset": 38, "size": 2}, "owner": {"native": "Int16Array", "offset": 30, "size": 2}, "pal": {"native": "Uint8Array", "offset": 17, "size": 1}, "picnum": {"native": "Int16Array", "offset": 14, "size": 2}, "sectnum": {"native": "Int16Array", "offset": 24, "size": 2}, "shade": {"native": "Int8Array", "offset": 16, "size": 1}, "statnum": {"native": "Int16Array", "offset": 26, "size": 2}, "xoffset": {"native": "Int8Array", "offset": 22, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 20, "size": 1}, "yoffset": {"native": "Int8Array", "offset": 23, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 21, "size": 1}}, "overlaps": true, "size": 44, "union": false}, {})).lotag) << 16) >> 16));
  (cRecordObject(cRecordPointer(tspr, {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xyz": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "__cxx_anonymous_15": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"xvel": {"native": "Int16Array", "offset": 0, "size": 2}, "yvel": {"native": "Int16Array", "offset": 2, "size": 2}, "zvel": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "vel": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}, "z": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"d": {"native": "Int16Array", "offset": 0, "size": 2}, "u": {"native": "Int16Array", "offset": 2, "size": 2}, "v": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 0}}, "overlaps": true, "size": 6, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 32}, "ang": {"native": "Int16Array", "offset": 28, "size": 2}, "blend": {"native": "Uint8Array", "offset": 19, "size": 1}, "clipdist": {"native": "Uint8Array", "offset": 18, "size": 1}, "cstat": {"native": "Uint16Array", "offset": 12, "size": 2}, "extra": {"native": "Int16Array", "offset": 42, "size": 2}, "hitag": {"native": "Int16Array", "offset": 40, "size": 2}, "lotag": {"native": "Int16Array", "offset": 38, "size": 2}, "owner": {"native": "Int16Array", "offset": 30, "size": 2}, "pal": {"native": "Uint8Array", "offset": 17, "size": 1}, "picnum": {"native": "Int16Array", "offset": 14, "size": 2}, "sectnum": {"native": "Int16Array", "offset": 24, "size": 2}, "shade": {"native": "Int8Array", "offset": 16, "size": 1}, "statnum": {"native": "Int16Array", "offset": 26, "size": 2}, "xoffset": {"native": "Int8Array", "offset": 22, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 20, "size": 1}, "yoffset": {"native": "Int8Array", "offset": 23, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 21, "size": 1}}, "overlaps": true, "size": 44, "union": false}, {})).hitag = ((u32(cRecordObject(cRecordPointer(spr, {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xyz": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "__cxx_anonymous_15": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"xvel": {"native": "Int16Array", "offset": 0, "size": 2}, "yvel": {"native": "Int16Array", "offset": 2, "size": 2}, "zvel": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "vel": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}, "z": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"d": {"native": "Int16Array", "offset": 0, "size": 2}, "u": {"native": "Int16Array", "offset": 2, "size": 2}, "v": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 0}}, "overlaps": true, "size": 6, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 32}, "ang": {"native": "Int16Array", "offset": 28, "size": 2}, "blend": {"native": "Uint8Array", "offset": 19, "size": 1}, "clipdist": {"native": "Uint8Array", "offset": 18, "size": 1}, "cstat": {"native": "Uint16Array", "offset": 12, "size": 2}, "extra": {"native": "Int16Array", "offset": 42, "size": 2}, "hitag": {"native": "Int16Array", "offset": 40, "size": 2}, "lotag": {"native": "Int16Array", "offset": 38, "size": 2}, "owner": {"native": "Int16Array", "offset": 30, "size": 2}, "pal": {"native": "Uint8Array", "offset": 17, "size": 1}, "picnum": {"native": "Int16Array", "offset": 14, "size": 2}, "sectnum": {"native": "Int16Array", "offset": 24, "size": 2}, "shade": {"native": "Int8Array", "offset": 16, "size": 1}, "statnum": {"native": "Int16Array", "offset": 26, "size": 2}, "xoffset": {"native": "Int8Array", "offset": 22, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 20, "size": 1}, "yoffset": {"native": "Int8Array", "offset": 23, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 21, "size": 1}}, "overlaps": true, "size": 44, "union": false}, {})).hitag) << 16) >> 16));
  (cRecordObject(cRecordPointer(tspr, {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xyz": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "__cxx_anonymous_15": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"xvel": {"native": "Int16Array", "offset": 0, "size": 2}, "yvel": {"native": "Int16Array", "offset": 2, "size": 2}, "zvel": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "vel": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}, "z": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"d": {"native": "Int16Array", "offset": 0, "size": 2}, "u": {"native": "Int16Array", "offset": 2, "size": 2}, "v": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 0}}, "overlaps": true, "size": 6, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 32}, "ang": {"native": "Int16Array", "offset": 28, "size": 2}, "blend": {"native": "Uint8Array", "offset": 19, "size": 1}, "clipdist": {"native": "Uint8Array", "offset": 18, "size": 1}, "cstat": {"native": "Uint16Array", "offset": 12, "size": 2}, "extra": {"native": "Int16Array", "offset": 42, "size": 2}, "hitag": {"native": "Int16Array", "offset": 40, "size": 2}, "lotag": {"native": "Int16Array", "offset": 38, "size": 2}, "owner": {"native": "Int16Array", "offset": 30, "size": 2}, "pal": {"native": "Uint8Array", "offset": 17, "size": 1}, "picnum": {"native": "Int16Array", "offset": 14, "size": 2}, "sectnum": {"native": "Int16Array", "offset": 24, "size": 2}, "shade": {"native": "Int8Array", "offset": 16, "size": 1}, "statnum": {"native": "Int16Array", "offset": 26, "size": 2}, "xoffset": {"native": "Int8Array", "offset": 22, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 20, "size": 1}, "yoffset": {"native": "Int8Array", "offset": 23, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 21, "size": 1}}, "overlaps": true, "size": 44, "union": false}, {})).extra = ((u32(cRecordObject(cRecordPointer(spr, {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xyz": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "__cxx_anonymous_15": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"xvel": {"native": "Int16Array", "offset": 0, "size": 2}, "yvel": {"native": "Int16Array", "offset": 2, "size": 2}, "zvel": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "vel": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}, "z": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"d": {"native": "Int16Array", "offset": 0, "size": 2}, "u": {"native": "Int16Array", "offset": 2, "size": 2}, "v": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 0}}, "overlaps": true, "size": 6, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 32}, "ang": {"native": "Int16Array", "offset": 28, "size": 2}, "blend": {"native": "Uint8Array", "offset": 19, "size": 1}, "clipdist": {"native": "Uint8Array", "offset": 18, "size": 1}, "cstat": {"native": "Uint16Array", "offset": 12, "size": 2}, "extra": {"native": "Int16Array", "offset": 42, "size": 2}, "hitag": {"native": "Int16Array", "offset": 40, "size": 2}, "lotag": {"native": "Int16Array", "offset": 38, "size": 2}, "owner": {"native": "Int16Array", "offset": 30, "size": 2}, "pal": {"native": "Uint8Array", "offset": 17, "size": 1}, "picnum": {"native": "Int16Array", "offset": 14, "size": 2}, "sectnum": {"native": "Int16Array", "offset": 24, "size": 2}, "shade": {"native": "Int8Array", "offset": 16, "size": 1}, "statnum": {"native": "Int16Array", "offset": 26, "size": 2}, "xoffset": {"native": "Int8Array", "offset": 22, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 20, "size": 1}, "yoffset": {"native": "Int8Array", "offset": 23, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 21, "size": 1}}, "overlaps": true, "size": 44, "union": false}, {})).extra) << 16) >> 16));
  (cRecordObject(cRecordPointer(tspr, {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xyz": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "__cxx_anonymous_15": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"xvel": {"native": "Int16Array", "offset": 0, "size": 2}, "yvel": {"native": "Int16Array", "offset": 2, "size": 2}, "zvel": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "vel": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}, "z": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"d": {"native": "Int16Array", "offset": 0, "size": 2}, "u": {"native": "Int16Array", "offset": 2, "size": 2}, "v": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 0}}, "overlaps": true, "size": 6, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 32}, "ang": {"native": "Int16Array", "offset": 28, "size": 2}, "blend": {"native": "Uint8Array", "offset": 19, "size": 1}, "clipdist": {"native": "Uint8Array", "offset": 18, "size": 1}, "cstat": {"native": "Uint16Array", "offset": 12, "size": 2}, "extra": {"native": "Int16Array", "offset": 42, "size": 2}, "hitag": {"native": "Int16Array", "offset": 40, "size": 2}, "lotag": {"native": "Int16Array", "offset": 38, "size": 2}, "owner": {"native": "Int16Array", "offset": 30, "size": 2}, "pal": {"native": "Uint8Array", "offset": 17, "size": 1}, "picnum": {"native": "Int16Array", "offset": 14, "size": 2}, "sectnum": {"native": "Int16Array", "offset": 24, "size": 2}, "shade": {"native": "Int8Array", "offset": 16, "size": 1}, "statnum": {"native": "Int16Array", "offset": 26, "size": 2}, "xoffset": {"native": "Int8Array", "offset": 22, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 20, "size": 1}, "yoffset": {"native": "Int8Array", "offset": 23, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 21, "size": 1}}, "overlaps": true, "size": 44, "union": false}, {})).clipdist = (u32((u32(0) & 255)) & 255));
  (cRecordObject(cRecordPointer(tspr, {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xyz": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "__cxx_anonymous_15": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"xvel": {"native": "Int16Array", "offset": 0, "size": 2}, "yvel": {"native": "Int16Array", "offset": 2, "size": 2}, "zvel": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "vel": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}, "z": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"d": {"native": "Int16Array", "offset": 0, "size": 2}, "u": {"native": "Int16Array", "offset": 2, "size": 2}, "v": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 0}}, "overlaps": true, "size": 6, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 32}, "ang": {"native": "Int16Array", "offset": 28, "size": 2}, "blend": {"native": "Uint8Array", "offset": 19, "size": 1}, "clipdist": {"native": "Uint8Array", "offset": 18, "size": 1}, "cstat": {"native": "Uint16Array", "offset": 12, "size": 2}, "extra": {"native": "Int16Array", "offset": 42, "size": 2}, "hitag": {"native": "Int16Array", "offset": 40, "size": 2}, "lotag": {"native": "Int16Array", "offset": 38, "size": 2}, "owner": {"native": "Int16Array", "offset": 30, "size": 2}, "pal": {"native": "Uint8Array", "offset": 17, "size": 1}, "picnum": {"native": "Int16Array", "offset": 14, "size": 2}, "sectnum": {"native": "Int16Array", "offset": 24, "size": 2}, "shade": {"native": "Int8Array", "offset": 16, "size": 1}, "statnum": {"native": "Int16Array", "offset": 26, "size": 2}, "xoffset": {"native": "Int8Array", "offset": 22, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 20, "size": 1}, "yoffset": {"native": "Int8Array", "offset": 23, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 21, "size": 1}}, "overlaps": true, "size": 44, "union": false}, {})).owner = ((u32(((u32(spritenum) << 16) >> 16)) << 16) >> 16));
  return tspr;
}

// C/C++ source: @sysroot/usr/include/c++/12/bits/stl_algobase.h:230
export function min__template_c237f4424e2bda8a(__a, __b) {
  if ((__b.value < __a.value)) {
    return __b;
  }
  return __a;
}

export function ARRAY_SIZE__header_bfe944817cc0(arg0) {
  return u64(4n);
}

// C/C++ source: source/duke3d/src/game.cpp:111
export function tabledivide64__header_18a105f3e279(n, d) {

  if (Boolean(i32((i32((d != __cxx_global_cell_f8287b2e627d0e3f51b90c55().value)) & i32((!(u64(d) < u64(16384)))))))) {
    cAssignAggregate((cPointerElementRef(cRecordPointer(divtable64, {"align": 1, "arrayAlign": 1, "fields": {"magic": {"native": "BigInt64Array", "offset": 0, "size": 8}, "more": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 9, "union": false}, {}), 0).value), libdivide_s64_gen((__cxx_global_cell_f8287b2e627d0e3f51b90c55().value = i64(d))), {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"magic": {"native": "BigInt64Array", "offset": 0, "size": 8}, "more": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 9, "union": false}});
  }
  return i64(libdivide_s64_do(n, cPointerOffset(divtable64, i64((BigInt(i64((u64(d) < u64(16384)))) * BigInt(d))), 9)));
}

export function SILENCE_UNUSED__header_2c60b085d029(arg0, arg1) {

}

export function __cxx_operator_761c63d1e16e183f(lhs, rhs) {
  return cCopyTrivialClass(lhs.__cxx_operator_86b05ee676890126(rhs), ClockTicks(), ["wholeTicks", "ticksS32"]);
}

export function __cxx_operator_11a696315e969ab4(lhs, rhs) {
  return Boolean((lhs.wholeTicks < rhs.wholeTicks));
}

export function __cxx_operator_9d5bfff63c86ec9c(lhs, rhs) {
  return Boolean(__cxx_operator_11a696315e969ab4(rhs, lhs));
}

export function __cxx_operator_6d2a22ee5048dd1a(lhs, rhs) {
  return Boolean((!__cxx_operator_11a696315e969ab4(lhs, rhs)));
}
