// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/duke3d/src/gamestructures.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
import { ActorLabels } from "./gamestructures.cpp.mjs";
import { __cxx_global_cell_9e4cb87c453b25482a00c2b9 } from "../../mact/src/control.cpp.mjs";
import { InputLabels } from "./gamestructures.cpp.mjs";
import { __cxx_global_cell_5efadf8c3ac8c3f646e8a150 } from "./menus.cpp.mjs";
import { __cxx_global_cell_a143cc9cf412c52e6ca7a408 } from "./menus.cpp.mjs";
import { __cxx_global_cell_4b62716bda68649a2b393452 } from "./menus.cpp.mjs";
import { PalDataLabels } from "./gamestructures.cpp.mjs";
import { PlayerLabels } from "./gamestructures.cpp.mjs";
import { ProjectileLabels } from "./gamestructures.cpp.mjs";
import { SectorLabels } from "./gamestructures.cpp.mjs";
import { SpriteProjectile } from "./global.cpp.mjs";
import { TileDataLabels } from "./gamestructures.cpp.mjs";
import { TsprLabels } from "./gamestructures.cpp.mjs";
import { UserdefsLabels } from "./gamestructures.cpp.mjs";
import { VM_GetKeywordForID } from "./gamedef.cpp.mjs";
import { WallLabels } from "./gamestructures.cpp.mjs";
import { aGameVars } from "./gamevars.cpp.mjs";
import { actor } from "./global.cpp.mjs";
import { __cxx_global_cell_38abf48ab8ba3db5fce877d9 } from "./global.cpp.mjs";
import { boardfilename } from "./game.cpp.mjs";
import { changespritesect } from "../../build/src/engine.cpp.mjs";
import { changespritestat } from "../../build/src/engine.cpp.mjs";
import { current_verbosity_cutoff } from "../../build/src/loguru.cpp.mjs";
import { __cxx_global_cell_286850f0b72c66d5aae173a9 } from "./global.cpp.mjs";
import { fix16_half__header_global_24711ee8d9fc79e5 } from "./gamestructures.cpp.mjs";
import { fix16_one__header_global_217802013aec91cb } from "./gamestructures.cpp.mjs";
import { g_gametypeFlags } from "./global.cpp.mjs";
import { __cxx_global_cell_462926f90efdfe463807ff55 } from "./global.cpp.mjs";
import { g_noFloorPal } from "../../build/src/palette.cpp.mjs";
import { g_player } from "./global.cpp.mjs";
import { __cxx_global_cell_c678e52b13334e9e7bc849c7 } from "./gameexec.cpp.mjs";
import { g_tile } from "./global.cpp.mjs";
import { __cxx_global_cell_34a2426c22a51b0e2d5bc428 } from "./gameexec.cpp.mjs";
import { getangle } from "../../build/src/engine.cpp.mjs";
import { __cxx_global_cell_81af557897af1f573210de4b } from "../../build/src/engine.cpp.mjs";
import { __cxx_global_cell_687ad03e56ad49d91da7ede0 } from "../../build/src/engine.cpp.mjs";
import { __cxx_global_cell_23f70e7a799326383b6cae79 } from "../../build/src/engine.cpp.mjs";
import { __cxx_global_cell_a248700a49a9585168c4d6fc } from "../../build/src/engine.cpp.mjs";
import { __cxx_global_cell_36ecf5b982ca5148a2b52931 } from "./gamestructures.cpp.mjs";
import { __cxx_global_cell_4dfc2df4beaabb17f13a2a11 } from "./gamestructures.cpp.mjs";
import { __cxx_global_cell_1b64352a65c97cbeac4d8dc1 } from "./gamestructures.cpp.mjs";
import { __cxx_global_cell_1edb9adc2ad33f7dab0cc065 } from "./gamestructures.cpp.mjs";
import { __cxx_global_cell_5369c12f5151e4651feb6d69 } from "./gamestructures.cpp.mjs";
import { __cxx_global_cell_1f238d951ac2733554cfa6c9 } from "./gamestructures.cpp.mjs";
import { __cxx_global_cell_12f6357b924ceaa4592192e7 } from "./gamestructures.cpp.mjs";
import { __cxx_global_cell_55925c071ef91c407236ca84 } from "./gamestructures.cpp.mjs";
import { __cxx_global_cell_6fc9ea499f8ee974932947d6 } from "./gamestructures.cpp.mjs";
import { __cxx_global_cell_7b44353bd3d207ee6f04360e } from "./gamestructures.cpp.mjs";
import { hash_add } from "../../build/src/hash.cpp.mjs";
import { hash_init } from "../../build/src/hash.cpp.mjs";
import { inithashnames } from "./dnames.cpp.mjs";
import { __cxx_global_cell_f5596e70af51a8f811191c88 } from "./gameexec.cpp.mjs";
import { loguru_log } from "../../../browser-abi/loguru_provider.mjs";
import { __cxx_global_cell_4723a60d88a1aa0814b17967 } from "../../build/src/engine.cpp.mjs";
import { picanm } from "../../build/src/engine.cpp.mjs";
import { __cxx_global_cell_f6c55103bb34c1bae0a56530 } from "../../build/src/engine.cpp.mjs";
import { __cxx_global_cell_1eb1cfb64d199abe24ad949b } from "../../build/src/engine.cpp.mjs";
import { __cxx_global_cell_4a046e33ecf7aced9bfd0007 } from "../../build/src/engine.cpp.mjs";
import { __cxx_global_cell_e6d5c05c99c236717ba2a685 } from "../../build/src/engine.cpp.mjs";
import { tilesiz } from "../../build/src/engine.cpp.mjs";
import { __cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba } from "./global.cpp.mjs";
import { __cxx_global_cell_77d5c24237b7b046074e378d } from "../../build/src/engine.cpp.mjs";
import { __cxx_global_cell_5bce98f73f3ed0c837f2729e } from "./gameexec.cpp.mjs";
import { vmStructHashTablePtrs__header_global_6b3478f82798bb33 } from "./gamestructures.cpp.mjs";
import { __cxx_global_cell_781692351a9d53402cd867ca } from "./gamedef.cpp.mjs";
import { __cxx_global_cell_4d8aaa64f68587b18e27604c } from "../../build/src/engine.cpp.mjs";
import { __cxx_global_cell_64b1dd24a985c284baf44a16 } from "../../build/src/engine.cpp.mjs";

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

function i32(value) { return typeof value === "bigint" ? Number(BigInt.asIntN(32,value)) : Number(value) | 0; }
function u32(value) { return typeof value === "bigint" ? Number(BigInt.asUintN(32,value)) : Number(value) >>> 0; }
function i64(value) { return BigInt.asIntN(64, BigInt(value)); }
function u64(value) { return BigInt.asUintN(64, BigInt(value)); }


const clz64 = value => {let v=BigInt.asUintN(64,BigInt(value));if(v===0n)return 64;let n=0;while((v&(1n<<63n))===0n){v<<=1n;n++;}return n;};
const ctz64 = (value,width) => {let v=BigInt.asUintN(width,BigInt(value));if(v===0n)return width;let n=0;while((v&1n)===0n){v>>=1n;n++;}return n;};
const popcnt = value => {let v=value,n=0;while(v){v&=v-1n;n++;}return n;};

const __builtin_unreachable = () => { throw new Error("C++ undefined behavior: reached __builtin_unreachable"); };
// C/C++ source: source/duke3d/src/gamestructures.cpp:179
export function VM_GetWall(wallNum, labelNum) {
  switch (labelNum) {
    case i32(19): {
      (labelNum = i32((cPointerElementRef(cRecordPointer(__cxx_global_cell_64b1dd24a985c284baf44a16().value, {"align": 1, "arrayAlign": 1, "fields": {"blend": {"native": "Uint8Array", "offset": 0, "size": 1}}, "overlaps": false, "size": 1, "union": false}, {}), wallNum).value).blend));
    }
    break;
    case i32(20): {
      (labelNum = i32((i32((getangle(i32(((cPointerElementRef(cRecordPointer(__cxx_global_cell_4d8aaa64f68587b18e27604c().value, {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 8, "union": true}, "offset": 0}, "cstat": {"native": "Uint16Array", "offset": 14, "size": 2}, "extra": {"native": "Int16Array", "offset": 30, "size": 2}, "hitag": {"native": "Int16Array", "offset": 28, "size": 2}, "lotag": {"native": "Int16Array", "offset": 26, "size": 2}, "nextsector": {"native": "Int16Array", "offset": 12, "size": 2}, "nextwall": {"native": "Int16Array", "offset": 10, "size": 2}, "overpicnum": {"native": "Int16Array", "offset": 18, "size": 2}, "pal": {"native": "Uint8Array", "offset": 21, "size": 1}, "picnum": {"native": "Int16Array", "offset": 16, "size": 2}, "point2": {"native": "Int16Array", "offset": 8, "size": 2}, "shade": {"native": "Int8Array", "offset": 20, "size": 1}, "xpanning": {"native": "Uint8Array", "offset": 24, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 22, "size": 1}, "ypanning": {"native": "Uint8Array", "offset": 25, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 23, "size": 1}}, "overlaps": true, "size": 32, "union": false}, {}), (cPointerElementRef(cRecordPointer(__cxx_global_cell_4d8aaa64f68587b18e27604c().value, {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 8, "union": true}, "offset": 0}, "cstat": {"native": "Uint16Array", "offset": 14, "size": 2}, "extra": {"native": "Int16Array", "offset": 30, "size": 2}, "hitag": {"native": "Int16Array", "offset": 28, "size": 2}, "lotag": {"native": "Int16Array", "offset": 26, "size": 2}, "nextsector": {"native": "Int16Array", "offset": 12, "size": 2}, "nextwall": {"native": "Int16Array", "offset": 10, "size": 2}, "overpicnum": {"native": "Int16Array", "offset": 18, "size": 2}, "pal": {"native": "Uint8Array", "offset": 21, "size": 1}, "picnum": {"native": "Int16Array", "offset": 16, "size": 2}, "point2": {"native": "Int16Array", "offset": 8, "size": 2}, "shade": {"native": "Int8Array", "offset": 20, "size": 1}, "xpanning": {"native": "Uint8Array", "offset": 24, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 22, "size": 1}, "ypanning": {"native": "Uint8Array", "offset": 25, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 23, "size": 1}}, "overlaps": true, "size": 32, "union": false}, {}), wallNum).value).point2).value).__cxx_anonymous_0.__cxx_anonymous_0.x - (cPointerElementRef(cRecordPointer(__cxx_global_cell_4d8aaa64f68587b18e27604c().value, {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 8, "union": true}, "offset": 0}, "cstat": {"native": "Uint16Array", "offset": 14, "size": 2}, "extra": {"native": "Int16Array", "offset": 30, "size": 2}, "hitag": {"native": "Int16Array", "offset": 28, "size": 2}, "lotag": {"native": "Int16Array", "offset": 26, "size": 2}, "nextsector": {"native": "Int16Array", "offset": 12, "size": 2}, "nextwall": {"native": "Int16Array", "offset": 10, "size": 2}, "overpicnum": {"native": "Int16Array", "offset": 18, "size": 2}, "pal": {"native": "Uint8Array", "offset": 21, "size": 1}, "picnum": {"native": "Int16Array", "offset": 16, "size": 2}, "point2": {"native": "Int16Array", "offset": 8, "size": 2}, "shade": {"native": "Int8Array", "offset": 20, "size": 1}, "xpanning": {"native": "Uint8Array", "offset": 24, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 22, "size": 1}, "ypanning": {"native": "Uint8Array", "offset": 25, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 23, "size": 1}}, "overlaps": true, "size": 32, "union": false}, {}), wallNum).value).__cxx_anonymous_0.__cxx_anonymous_0.x)), i32(((cPointerElementRef(cRecordPointer(__cxx_global_cell_4d8aaa64f68587b18e27604c().value, {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 8, "union": true}, "offset": 0}, "cstat": {"native": "Uint16Array", "offset": 14, "size": 2}, "extra": {"native": "Int16Array", "offset": 30, "size": 2}, "hitag": {"native": "Int16Array", "offset": 28, "size": 2}, "lotag": {"native": "Int16Array", "offset": 26, "size": 2}, "nextsector": {"native": "Int16Array", "offset": 12, "size": 2}, "nextwall": {"native": "Int16Array", "offset": 10, "size": 2}, "overpicnum": {"native": "Int16Array", "offset": 18, "size": 2}, "pal": {"native": "Uint8Array", "offset": 21, "size": 1}, "picnum": {"native": "Int16Array", "offset": 16, "size": 2}, "point2": {"native": "Int16Array", "offset": 8, "size": 2}, "shade": {"native": "Int8Array", "offset": 20, "size": 1}, "xpanning": {"native": "Uint8Array", "offset": 24, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 22, "size": 1}, "ypanning": {"native": "Uint8Array", "offset": 25, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 23, "size": 1}}, "overlaps": true, "size": 32, "union": false}, {}), (cPointerElementRef(cRecordPointer(__cxx_global_cell_4d8aaa64f68587b18e27604c().value, {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 8, "union": true}, "offset": 0}, "cstat": {"native": "Uint16Array", "offset": 14, "size": 2}, "extra": {"native": "Int16Array", "offset": 30, "size": 2}, "hitag": {"native": "Int16Array", "offset": 28, "size": 2}, "lotag": {"native": "Int16Array", "offset": 26, "size": 2}, "nextsector": {"native": "Int16Array", "offset": 12, "size": 2}, "nextwall": {"native": "Int16Array", "offset": 10, "size": 2}, "overpicnum": {"native": "Int16Array", "offset": 18, "size": 2}, "pal": {"native": "Uint8Array", "offset": 21, "size": 1}, "picnum": {"native": "Int16Array", "offset": 16, "size": 2}, "point2": {"native": "Int16Array", "offset": 8, "size": 2}, "shade": {"native": "Int8Array", "offset": 20, "size": 1}, "xpanning": {"native": "Uint8Array", "offset": 24, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 22, "size": 1}, "ypanning": {"native": "Uint8Array", "offset": 25, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 23, "size": 1}}, "overlaps": true, "size": 32, "union": false}, {}), wallNum).value).point2).value).__cxx_anonymous_0.__cxx_anonymous_0.y - (cPointerElementRef(cRecordPointer(__cxx_global_cell_4d8aaa64f68587b18e27604c().value, {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 8, "union": true}, "offset": 0}, "cstat": {"native": "Uint16Array", "offset": 14, "size": 2}, "extra": {"native": "Int16Array", "offset": 30, "size": 2}, "hitag": {"native": "Int16Array", "offset": 28, "size": 2}, "lotag": {"native": "Int16Array", "offset": 26, "size": 2}, "nextsector": {"native": "Int16Array", "offset": 12, "size": 2}, "nextwall": {"native": "Int16Array", "offset": 10, "size": 2}, "overpicnum": {"native": "Int16Array", "offset": 18, "size": 2}, "pal": {"native": "Uint8Array", "offset": 21, "size": 1}, "picnum": {"native": "Int16Array", "offset": 16, "size": 2}, "point2": {"native": "Int16Array", "offset": 8, "size": 2}, "shade": {"native": "Int8Array", "offset": 20, "size": 1}, "xpanning": {"native": "Uint8Array", "offset": 24, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 22, "size": 1}, "ypanning": {"native": "Uint8Array", "offset": 25, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 23, "size": 1}}, "overlaps": true, "size": 32, "union": false}, {}), wallNum).value).__cxx_anonymous_0.__cxx_anonymous_0.y))) + 512)) & 2047)));
    }
    break;
    default: {
      __builtin_unreachable();
    }
  }
  return i32(labelNum);
}

// C/C++ source: source/duke3d/src/gamestructures.cpp:198
export function VM_SetWall(wallNum, labelNum, newValue) {
  switch (labelNum) {
    case i32(19): {
      ((cPointerElementRef(cRecordPointer(__cxx_global_cell_64b1dd24a985c284baf44a16().value, {"align": 1, "arrayAlign": 1, "fields": {"blend": {"native": "Uint8Array", "offset": 0, "size": 1}}, "overlaps": false, "size": 1, "union": false}, {}), wallNum).value).blend = (u32((u32(newValue) & 255)) & 255));
    }
    break;
  }
}

// C/C++ source: source/duke3d/src/gamestructures.cpp:292
const __cxx_literal_6b60ef03072aaaac7dc9 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 115, 116, 114, 117, 99, 116, 117, 114, 101, 115, 46, 99, 112, 112, 0]);
const __cxx_literal_8f006de44342ba2388b8 = Uint8Array.from([37, 115, 58, 37, 100, 58, 32, 37, 115, 58, 32, 105, 110, 118, 97, 108, 105, 100, 32, 115, 101, 99, 116, 110, 117, 109, 32, 37, 100, 32, 102, 111, 114, 32, 115, 112, 114, 105, 116, 101, 32, 37, 100, 10, 0]);
const __cxx_literal_df8b3af6327e2970ba4d = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 115, 116, 114, 117, 99, 116, 117, 114, 101, 115, 46, 99, 112, 112, 0]);
const __cxx_literal_fe7b47b329bed3b881e1 = Uint8Array.from([37, 115, 58, 37, 100, 58, 32, 37, 115, 58, 32, 105, 110, 118, 97, 108, 105, 100, 32, 115, 116, 97, 116, 110, 117, 109, 32, 37, 100, 32, 102, 111, 114, 32, 115, 112, 114, 105, 116, 101, 32, 37, 100, 10, 0]);
export function VM_SetSprite(spriteNum, labelNum, lParm2, newValue) {
  let a = (cPointerElementRef(cRecordPointer(actor, {"align": 1, "arrayAlign": 4, "fields": {"bpos": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 44}, "ceilingz": {"native": "Int32Array", "offset": 60, "size": 4}, "cgg": {"native": "Uint8Array", "offset": 94, "size": 1}, "dispicnum": {"native": "Int16Array", "offset": 92, "size": 2}, "filler": {"length": 2, "native": "Uint8Array", "offset": 90, "size": 2}, "flags": {"native": "Uint32Array", "offset": 40, "size": 4}, "floorz": {"native": "Int32Array", "offset": 56, "size": 4}, "floorzoffset": {"native": "Int8Array", "offset": 88, "size": 1}, "htang": {"native": "Int16Array", "offset": 74, "size": 2}, "htextra": {"native": "Int16Array", "offset": 76, "size": 2}, "htowner": {"native": "Int16Array", "offset": 78, "size": 2}, "htpicnum": {"native": "Int16Array", "offset": 72, "size": 2}, "lasttransport": {"native": "Uint8Array", "offset": 95, "size": 1}, "lastv": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 64}, "movflag": {"native": "Int16Array", "offset": 80, "size": 2}, "stayput": {"native": "Int16Array", "offset": 86, "size": 2}, "t_data": {"length": 10, "native": "Int32Array", "offset": 0, "size": 40}, "tempang": {"native": "Int16Array", "offset": 82, "size": 2}, "timetosleep": {"native": "Int16Array", "offset": 84, "size": 2}, "waterzoffset": {"native": "Int8Array", "offset": 89, "size": 1}}, "overlaps": true, "size": 96, "union": false}, {}), spriteNum).value);
  let ext = (cPointerElementRef(cRecordPointer(__cxx_global_cell_e6d5c05c99c236717ba2a685().value, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"tspr": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "size": 8, "union": true}, "offset": 0}, "alpha": {"native": "Float32Array", "offset": 8, "size": 4}, "filler": {"length": 12, "native": "Uint8Array", "offset": 52, "size": 12}, "flags": {"native": "Uint16Array", "offset": 12, "size": 2}, "mdangoff": {"native": "Int16Array", "offset": 20, "size": 2}, "mdanimcur": {"native": "Int16Array", "offset": 14, "size": 2}, "mdanimtims": {"native": "Uint32Array", "offset": 16, "size": 4}, "mdpitch": {"native": "Int16Array", "offset": 24, "size": 2}, "mdpivot_offset": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 28}, "mdposition_offset": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 40}, "mdroll": {"native": "Int16Array", "offset": 26, "size": 2}, "xpanning": {"native": "Uint8Array", "offset": 22, "size": 1}, "ypanning": {"native": "Uint8Array", "offset": 23, "size": 1}}, "overlaps": true, "size": 64, "union": false}, {}), spriteNum).value);
  switch (labelNum) {
    case i32(13): {
      if (Boolean(i32((i32((u32(spriteNum) >= u32(16384))) | i32((u32(newValue) >= u32(4096))))))) {
        do {
          ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = i32((__cxx_lvalue_0.value | i32(1)))))(cObjectFieldRef(__cxx_global_cell_5bce98f73f3ed0c837f2729e().value, "flags"));
          ((i32(-2) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-2), __cxx_literal_6b60ef03072aaaac7dc9, u32(302), __cxx_literal_8f006de44342ba2388b8, C_GetFileForOffset__header_3a230d97d314(i32(cPointerDiff(__cxx_global_cell_f5596e70af51a8f811191c88().value, __cxx_global_cell_38abf48ab8ba3db5fce877d9().value, BigInt64Array.BYTES_PER_ELEMENT))), i32((i32((__cxx_global_cell_34a2426c22a51b0e2d5bc428().value & (~i32((1 << 31))))) >> 12)), VM_GetKeywordForID(i32((__cxx_global_cell_34a2426c22a51b0e2d5bc428().value & 4095))), newValue, spriteNum));
        } while (Boolean(0));
        ((__cxx_lvalue_1) => (__cxx_lvalue_1.value = i32((__cxx_lvalue_1.value & (~i32(1))))))(cObjectFieldRef(__cxx_global_cell_5bce98f73f3ed0c837f2729e().value, "flags"));
      } else {
        changespritesect(((u32(spriteNum) << 16) >> 16), ((u32(newValue) << 16) >> 16));
      }
    }
    break;
    case i32(14): {
      if (Boolean(i32((i32((u32(spriteNum) >= u32(16384))) | i32((u32(newValue) >= u32(1024))))))) {
        do {
          ((__cxx_lvalue_2) => (__cxx_lvalue_2.value = i32((__cxx_lvalue_2.value | i32(1)))))(cObjectFieldRef(__cxx_global_cell_5bce98f73f3ed0c837f2729e().value, "flags"));
          ((i32(-2) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-2), __cxx_literal_df8b3af6327e2970ba4d, u32(311), __cxx_literal_fe7b47b329bed3b881e1, C_GetFileForOffset__header_3a230d97d314(i32(cPointerDiff(__cxx_global_cell_f5596e70af51a8f811191c88().value, __cxx_global_cell_38abf48ab8ba3db5fce877d9().value, BigInt64Array.BYTES_PER_ELEMENT))), i32((i32((__cxx_global_cell_34a2426c22a51b0e2d5bc428().value & (~i32((1 << 31))))) >> 12)), VM_GetKeywordForID(i32((__cxx_global_cell_34a2426c22a51b0e2d5bc428().value & 4095))), newValue, spriteNum));
        } while (Boolean(0));
        ((__cxx_lvalue_3) => (__cxx_lvalue_3.value = i32((__cxx_lvalue_3.value & (~i32(1))))))(cObjectFieldRef(__cxx_global_cell_5bce98f73f3ed0c837f2729e().value, "flags"));
      } else {
        changespritestat(((u32(spriteNum) << 16) >> 16), ((u32(newValue) << 16) >> 16));
      }
    }
    break;
    case i32(45): {
      ((cDeref(cPointerOffset(a.t_data, lParm2, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(newValue));
    }
    break;
    case i32(59): {
      (ext.alpha = Math.fround(Math.fround((Math.fround(Math.fround(newValue)) * Math.fround((Math.fround(1) / Math.fround(255)))))));
    }
    break;
    default: {
      __builtin_unreachable();
    }
  }
}

// C/C++ source: source/duke3d/src/gamestructures.cpp:324
export function VM_GetSprite(spriteNum, labelNum, lParm2) {
  let a = (cPointerElementRef(cRecordPointer(actor, {"align": 1, "arrayAlign": 4, "fields": {"bpos": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 44}, "ceilingz": {"native": "Int32Array", "offset": 60, "size": 4}, "cgg": {"native": "Uint8Array", "offset": 94, "size": 1}, "dispicnum": {"native": "Int16Array", "offset": 92, "size": 2}, "filler": {"length": 2, "native": "Uint8Array", "offset": 90, "size": 2}, "flags": {"native": "Uint32Array", "offset": 40, "size": 4}, "floorz": {"native": "Int32Array", "offset": 56, "size": 4}, "floorzoffset": {"native": "Int8Array", "offset": 88, "size": 1}, "htang": {"native": "Int16Array", "offset": 74, "size": 2}, "htextra": {"native": "Int16Array", "offset": 76, "size": 2}, "htowner": {"native": "Int16Array", "offset": 78, "size": 2}, "htpicnum": {"native": "Int16Array", "offset": 72, "size": 2}, "lasttransport": {"native": "Uint8Array", "offset": 95, "size": 1}, "lastv": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 64}, "movflag": {"native": "Int16Array", "offset": 80, "size": 2}, "stayput": {"native": "Int16Array", "offset": 86, "size": 2}, "t_data": {"length": 10, "native": "Int32Array", "offset": 0, "size": 40}, "tempang": {"native": "Int16Array", "offset": 82, "size": 2}, "timetosleep": {"native": "Int16Array", "offset": 84, "size": 2}, "waterzoffset": {"native": "Int8Array", "offset": 89, "size": 1}}, "overlaps": true, "size": 96, "union": false}, {}), spriteNum).value);
  let s = (cPointerElementRef(cRecordPointer(__cxx_global_cell_4a046e33ecf7aced9bfd0007().value, {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xyz": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "__cxx_anonymous_15": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"xvel": {"native": "Int16Array", "offset": 0, "size": 2}, "yvel": {"native": "Int16Array", "offset": 2, "size": 2}, "zvel": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "vel": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}, "z": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"d": {"native": "Int16Array", "offset": 0, "size": 2}, "u": {"native": "Int16Array", "offset": 2, "size": 2}, "v": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 0}}, "overlaps": true, "size": 6, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 32}, "ang": {"native": "Int16Array", "offset": 28, "size": 2}, "blend": {"native": "Uint8Array", "offset": 19, "size": 1}, "clipdist": {"native": "Uint8Array", "offset": 18, "size": 1}, "cstat": {"native": "Uint16Array", "offset": 12, "size": 2}, "extra": {"native": "Int16Array", "offset": 42, "size": 2}, "hitag": {"native": "Int16Array", "offset": 40, "size": 2}, "lotag": {"native": "Int16Array", "offset": 38, "size": 2}, "owner": {"native": "Int16Array", "offset": 30, "size": 2}, "pal": {"native": "Uint8Array", "offset": 17, "size": 1}, "picnum": {"native": "Int16Array", "offset": 14, "size": 2}, "sectnum": {"native": "Int16Array", "offset": 24, "size": 2}, "shade": {"native": "Int8Array", "offset": 16, "size": 1}, "statnum": {"native": "Int16Array", "offset": 26, "size": 2}, "xoffset": {"native": "Int8Array", "offset": 22, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 20, "size": 1}, "yoffset": {"native": "Int8Array", "offset": 23, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 21, "size": 1}}, "overlaps": true, "size": 44, "union": false}, {}), spriteNum).value);
  let ext = (cPointerElementRef(cRecordPointer(__cxx_global_cell_e6d5c05c99c236717ba2a685().value, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"tspr": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "size": 8, "union": true}, "offset": 0}, "alpha": {"native": "Float32Array", "offset": 8, "size": 4}, "filler": {"length": 12, "native": "Uint8Array", "offset": 52, "size": 12}, "flags": {"native": "Uint16Array", "offset": 12, "size": 2}, "mdangoff": {"native": "Int16Array", "offset": 20, "size": 2}, "mdanimcur": {"native": "Int16Array", "offset": 14, "size": 2}, "mdanimtims": {"native": "Uint32Array", "offset": 16, "size": 4}, "mdpitch": {"native": "Int16Array", "offset": 24, "size": 2}, "mdpivot_offset": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 28}, "mdposition_offset": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 40}, "mdroll": {"native": "Int16Array", "offset": 26, "size": 2}, "xpanning": {"native": "Uint8Array", "offset": 22, "size": 1}, "ypanning": {"native": "Uint8Array", "offset": 23, "size": 1}}, "overlaps": true, "size": 64, "union": false}, {}), spriteNum).value);
  switch (labelNum) {
    case i32(45): {
      (labelNum = i32((cDeref(cPointerOffset(a.t_data, lParm2, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
    }
    break;
    case i32(59): {
      (labelNum = i32((u32((u32(Math.fround((ext.alpha * Math.fround(255)))) & 255)) & 255)));
    }
    break;
    case i32(60): {
      (labelNum = i32((i32(s.statnum) != 1024)));
    }
    break;
    default: {
      __builtin_unreachable();
    }
  }
  return i32(labelNum);
}

// C/C++ source: source/duke3d/src/gamestructures.cpp:749
const __cxx_literal_42d5eb944ac92b040016 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 115, 116, 114, 117, 99, 116, 117, 114, 101, 115, 46, 99, 112, 112, 0]);
const __cxx_literal_3928c2d11de73b630fda = Uint8Array.from([37, 115, 58, 37, 100, 58, 32, 37, 115, 58, 32, 105, 110, 118, 97, 108, 105, 100, 32, 112, 114, 111, 106, 101, 99, 116, 105, 108, 101, 32, 37, 100, 10, 0]);
export function VM_GetProjectile(tileNum, labelNum) {
  if (((u32(tileNum) >= u32(30720)) || cPointerCompare((cPointerElementRef(cRecordPointer(g_tile, {"align": 8, "arrayAlign": 1, "fields": {"cacherange": {"native": "Int32Array", "offset": 36, "size": 4}, "defproj": {"offset": 24, "pointer": true, "size": 8}, "execPtr": {"offset": 0, "pointer": true, "size": 8}, "flags": {"native": "Uint32Array", "offset": 32, "size": 4}, "loadPtr": {"offset": 8, "pointer": true, "size": 8}, "proj": {"offset": 16, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {}), tileNum).value).proj, null, "=="))) {
    do {
      ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = i32((__cxx_lvalue_0.value | i32(1)))))(cObjectFieldRef(__cxx_global_cell_5bce98f73f3ed0c837f2729e().value, "flags"));
      ((i32(-2) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-2), __cxx_literal_42d5eb944ac92b040016, u32(753), __cxx_literal_3928c2d11de73b630fda, C_GetFileForOffset__header_3a230d97d314(i32(cPointerDiff(__cxx_global_cell_f5596e70af51a8f811191c88().value, __cxx_global_cell_38abf48ab8ba3db5fce877d9().value, BigInt64Array.BYTES_PER_ELEMENT))), i32((i32((__cxx_global_cell_34a2426c22a51b0e2d5bc428().value & (~i32((1 << 31))))) >> 12)), VM_GetKeywordForID(i32((__cxx_global_cell_34a2426c22a51b0e2d5bc428().value & 4095))), tileNum));
    } while (Boolean(0));
    return i32((-1));
  }
  let p = cRecordObject(cRecordPointer((cPointerElementRef(cRecordPointer(g_tile, {"align": 8, "arrayAlign": 1, "fields": {"cacherange": {"native": "Int32Array", "offset": 36, "size": 4}, "defproj": {"offset": 24, "pointer": true, "size": 8}, "execPtr": {"offset": 0, "pointer": true, "size": 8}, "flags": {"native": "Uint32Array", "offset": 32, "size": 4}, "loadPtr": {"offset": 8, "pointer": true, "size": 8}, "proj": {"offset": 16, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {}), tileNum).value).proj, {"align": 4, "arrayAlign": 1, "fields": {"bounces": {"native": "Int16Array", "offset": 38, "size": 2}, "bsound": {"native": "Int16Array", "offset": 40, "size": 2}, "clipdist": {"native": "Uint8Array", "offset": 57, "size": 1}, "cstat": {"native": "Int32Array", "offset": 4, "size": 4}, "decal": {"native": "Int16Array", "offset": 28, "size": 2}, "drop": {"native": "Int16Array", "offset": 34, "size": 2}, "extra": {"native": "Int16Array", "offset": 44, "size": 2}, "extra_rand": {"native": "Int16Array", "offset": 46, "size": 2}, "filler": {"length": 2, "native": "Int8Array", "offset": 58, "size": 2}, "flashcolor": {"native": "Int32Array", "offset": 16, "size": 4}, "hitradius": {"native": "Int32Array", "offset": 8, "size": 4}, "isound": {"native": "Int16Array", "offset": 24, "size": 2}, "movecnt": {"native": "Int8Array", "offset": 56, "size": 1}, "offset": {"native": "Int16Array", "offset": 36, "size": 2}, "pal": {"native": "Int8Array", "offset": 55, "size": 1}, "range": {"native": "Int32Array", "offset": 12, "size": 4}, "shade": {"native": "Int8Array", "offset": 52, "size": 1}, "sound": {"native": "Int16Array", "offset": 22, "size": 2}, "spawns": {"native": "Int16Array", "offset": 20, "size": 2}, "sxrepeat": {"native": "Int8Array", "offset": 48, "size": 1}, "syrepeat": {"native": "Int8Array", "offset": 49, "size": 1}, "tnum": {"native": "Int16Array", "offset": 32, "size": 2}, "toffset": {"native": "Int16Array", "offset": 42, "size": 2}, "trail": {"native": "Int16Array", "offset": 30, "size": 2}, "txrepeat": {"native": "Int8Array", "offset": 50, "size": 1}, "tyrepeat": {"native": "Int8Array", "offset": 51, "size": 1}, "userdata": {"native": "Int32Array", "offset": 60, "size": 4}, "vel": {"native": "Int16Array", "offset": 26, "size": 2}, "workslike": {"native": "Int32Array", "offset": 0, "size": 4}, "xrepeat": {"native": "Int8Array", "offset": 53, "size": 1}, "yrepeat": {"native": "Int8Array", "offset": 54, "size": 1}}, "overlaps": false, "size": 64, "union": false}, {}));
  switch (labelNum) {
    case i32(25): {
      (labelNum = i32(p.bounces));
    }
    break;
    case i32(26): {
      (labelNum = i32(p.bsound));
    }
    break;
    case i32(16): {
      (labelNum = i32(p.clipdist));
    }
    break;
    case i32(15): {
      (labelNum = i32(p.cstat));
    }
    break;
    case i32(8): {
      (labelNum = i32(p.decal));
    }
    break;
    case i32(14): {
      (labelNum = i32(p.drop));
    }
    break;
    case i32(7): {
      (labelNum = i32(p.extra));
    }
    break;
    case i32(21): {
      (labelNum = i32(p.extra_rand));
    }
    break;
    case i32(28): {
      (labelNum = i32(p.flashcolor));
    }
    break;
    case i32(22): {
      (labelNum = i32(p.hitradius));
    }
    break;
    case i32(5): {
      (labelNum = i32(p.isound));
    }
    break;
    case i32(23): {
      (labelNum = i32(p.movecnt));
    }
    break;
    case i32(24): {
      (labelNum = i32(p.offset));
    }
    break;
    case i32(20): {
      (labelNum = i32(p.pal));
    }
    break;
    case i32(27): {
      (labelNum = i32(p.range));
    }
    break;
    case i32(17): {
      (labelNum = i32(p.shade));
    }
    break;
    case i32(4): {
      (labelNum = i32(p.sound));
    }
    break;
    case i32(1): {
      (labelNum = i32(p.spawns));
    }
    break;
    case i32(2): {
      (labelNum = i32(p.sxrepeat));
    }
    break;
    case i32(3): {
      (labelNum = i32(p.syrepeat));
    }
    break;
    case i32(13): {
      (labelNum = i32(p.tnum));
    }
    break;
    case i32(12): {
      (labelNum = i32(p.toffset));
    }
    break;
    case i32(9): {
      (labelNum = i32(p.trail));
    }
    break;
    case i32(10): {
      (labelNum = i32(p.txrepeat));
    }
    break;
    case i32(11): {
      (labelNum = i32(p.tyrepeat));
    }
    break;
    case i32(29): {
      (labelNum = i32(p.userdata));
    }
    break;
    case i32(6): {
      (labelNum = i32(p.vel));
    }
    break;
    case i32(0): {
      (labelNum = i32(p.workslike));
    }
    break;
    case i32(18): {
      (labelNum = i32(p.xrepeat));
    }
    break;
    case i32(19): {
      (labelNum = i32(p.yrepeat));
    }
    break;
    default: {
      __builtin_unreachable();
    }
  }
  return i32(labelNum);
}

// C/C++ source: source/duke3d/src/gamestructures.cpp:798
const __cxx_literal_5e01f1c487905caf6ac0 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 115, 116, 114, 117, 99, 116, 117, 114, 101, 115, 46, 99, 112, 112, 0]);
const __cxx_literal_22130c1a06c6869437f0 = Uint8Array.from([37, 115, 58, 37, 100, 58, 32, 37, 115, 58, 32, 105, 110, 118, 97, 108, 105, 100, 32, 112, 114, 111, 106, 101, 99, 116, 105, 108, 101, 32, 37, 100, 10, 0]);
export function VM_SetProjectile(tileNum, labelNum, newValue) {
  if (((u32(tileNum) >= u32(30720)) || cPointerCompare((cPointerElementRef(cRecordPointer(g_tile, {"align": 8, "arrayAlign": 1, "fields": {"cacherange": {"native": "Int32Array", "offset": 36, "size": 4}, "defproj": {"offset": 24, "pointer": true, "size": 8}, "execPtr": {"offset": 0, "pointer": true, "size": 8}, "flags": {"native": "Uint32Array", "offset": 32, "size": 4}, "loadPtr": {"offset": 8, "pointer": true, "size": 8}, "proj": {"offset": 16, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {}), tileNum).value).proj, null, "=="))) {
    do {
      ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = i32((__cxx_lvalue_0.value | i32(1)))))(cObjectFieldRef(__cxx_global_cell_5bce98f73f3ed0c837f2729e().value, "flags"));
      ((i32(-2) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-2), __cxx_literal_5e01f1c487905caf6ac0, u32(802), __cxx_literal_22130c1a06c6869437f0, C_GetFileForOffset__header_3a230d97d314(i32(cPointerDiff(__cxx_global_cell_f5596e70af51a8f811191c88().value, __cxx_global_cell_38abf48ab8ba3db5fce877d9().value, BigInt64Array.BYTES_PER_ELEMENT))), i32((i32((__cxx_global_cell_34a2426c22a51b0e2d5bc428().value & (~i32((1 << 31))))) >> 12)), VM_GetKeywordForID(i32((__cxx_global_cell_34a2426c22a51b0e2d5bc428().value & 4095))), tileNum));
    } while (Boolean(0));
    return;
  }
  let p = cRecordObject(cRecordPointer((cPointerElementRef(cRecordPointer(g_tile, {"align": 8, "arrayAlign": 1, "fields": {"cacherange": {"native": "Int32Array", "offset": 36, "size": 4}, "defproj": {"offset": 24, "pointer": true, "size": 8}, "execPtr": {"offset": 0, "pointer": true, "size": 8}, "flags": {"native": "Uint32Array", "offset": 32, "size": 4}, "loadPtr": {"offset": 8, "pointer": true, "size": 8}, "proj": {"offset": 16, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {}), tileNum).value).proj, {"align": 4, "arrayAlign": 1, "fields": {"bounces": {"native": "Int16Array", "offset": 38, "size": 2}, "bsound": {"native": "Int16Array", "offset": 40, "size": 2}, "clipdist": {"native": "Uint8Array", "offset": 57, "size": 1}, "cstat": {"native": "Int32Array", "offset": 4, "size": 4}, "decal": {"native": "Int16Array", "offset": 28, "size": 2}, "drop": {"native": "Int16Array", "offset": 34, "size": 2}, "extra": {"native": "Int16Array", "offset": 44, "size": 2}, "extra_rand": {"native": "Int16Array", "offset": 46, "size": 2}, "filler": {"length": 2, "native": "Int8Array", "offset": 58, "size": 2}, "flashcolor": {"native": "Int32Array", "offset": 16, "size": 4}, "hitradius": {"native": "Int32Array", "offset": 8, "size": 4}, "isound": {"native": "Int16Array", "offset": 24, "size": 2}, "movecnt": {"native": "Int8Array", "offset": 56, "size": 1}, "offset": {"native": "Int16Array", "offset": 36, "size": 2}, "pal": {"native": "Int8Array", "offset": 55, "size": 1}, "range": {"native": "Int32Array", "offset": 12, "size": 4}, "shade": {"native": "Int8Array", "offset": 52, "size": 1}, "sound": {"native": "Int16Array", "offset": 22, "size": 2}, "spawns": {"native": "Int16Array", "offset": 20, "size": 2}, "sxrepeat": {"native": "Int8Array", "offset": 48, "size": 1}, "syrepeat": {"native": "Int8Array", "offset": 49, "size": 1}, "tnum": {"native": "Int16Array", "offset": 32, "size": 2}, "toffset": {"native": "Int16Array", "offset": 42, "size": 2}, "trail": {"native": "Int16Array", "offset": 30, "size": 2}, "txrepeat": {"native": "Int8Array", "offset": 50, "size": 1}, "tyrepeat": {"native": "Int8Array", "offset": 51, "size": 1}, "userdata": {"native": "Int32Array", "offset": 60, "size": 4}, "vel": {"native": "Int16Array", "offset": 26, "size": 2}, "workslike": {"native": "Int32Array", "offset": 0, "size": 4}, "xrepeat": {"native": "Int8Array", "offset": 53, "size": 1}, "yrepeat": {"native": "Int8Array", "offset": 54, "size": 1}}, "overlaps": false, "size": 64, "union": false}, {}));
  switch (labelNum) {
    case i32(25): {
      (p.bounces = ((u32(((u32(newValue) << 16) >> 16)) << 16) >> 16));
    }
    break;
    case i32(26): {
      (p.bsound = ((u32(((u32(newValue) << 16) >> 16)) << 16) >> 16));
    }
    break;
    case i32(16): {
      (p.clipdist = (u32((u32(newValue) & 255)) & 255));
    }
    break;
    case i32(15): {
      (p.cstat = i32(newValue));
    }
    break;
    case i32(8): {
      (p.decal = ((u32(((u32(newValue) << 16) >> 16)) << 16) >> 16));
    }
    break;
    case i32(14): {
      (p.drop = ((u32(((u32(newValue) << 16) >> 16)) << 16) >> 16));
    }
    break;
    case i32(7): {
      (p.extra = ((u32(((u32(newValue) << 16) >> 16)) << 16) >> 16));
    }
    break;
    case i32(21): {
      (p.extra_rand = ((u32(((u32(newValue) << 16) >> 16)) << 16) >> 16));
    }
    break;
    case i32(28): {
      (p.flashcolor = i32(newValue));
    }
    break;
    case i32(22): {
      (p.hitradius = i32(newValue));
    }
    break;
    case i32(5): {
      (p.isound = ((u32(((u32(newValue) << 16) >> 16)) << 16) >> 16));
    }
    break;
    case i32(23): {
      (p.movecnt = ((u32(((u32(newValue) << 24) >> 24)) << 24) >> 24));
    }
    break;
    case i32(24): {
      (p.offset = ((u32(((u32(newValue) << 16) >> 16)) << 16) >> 16));
    }
    break;
    case i32(20): {
      (p.pal = ((u32(((u32(newValue) << 24) >> 24)) << 24) >> 24));
    }
    break;
    case i32(27): {
      (p.range = i32(newValue));
    }
    break;
    case i32(17): {
      (p.shade = ((u32(((u32(newValue) << 24) >> 24)) << 24) >> 24));
    }
    break;
    case i32(4): {
      (p.sound = ((u32(((u32(newValue) << 16) >> 16)) << 16) >> 16));
    }
    break;
    case i32(1): {
      (p.spawns = ((u32(((u32(newValue) << 16) >> 16)) << 16) >> 16));
    }
    break;
    case i32(2): {
      (p.sxrepeat = ((u32(((u32(newValue) << 24) >> 24)) << 24) >> 24));
    }
    break;
    case i32(3): {
      (p.syrepeat = ((u32(((u32(newValue) << 24) >> 24)) << 24) >> 24));
    }
    break;
    case i32(13): {
      (p.tnum = ((u32(((u32(newValue) << 16) >> 16)) << 16) >> 16));
    }
    break;
    case i32(12): {
      (p.toffset = ((u32(((u32(newValue) << 16) >> 16)) << 16) >> 16));
    }
    break;
    case i32(9): {
      (p.trail = ((u32(((u32(newValue) << 16) >> 16)) << 16) >> 16));
    }
    break;
    case i32(10): {
      (p.txrepeat = ((u32(((u32(newValue) << 24) >> 24)) << 24) >> 24));
    }
    break;
    case i32(11): {
      (p.tyrepeat = ((u32(((u32(newValue) << 24) >> 24)) << 24) >> 24));
    }
    break;
    case i32(29): {
      (p.userdata = i32(newValue));
    }
    break;
    case i32(6): {
      (p.vel = ((u32(((u32(newValue) << 16) >> 16)) << 16) >> 16));
    }
    break;
    case i32(0): {
      (p.workslike = i32(newValue));
    }
    break;
    case i32(18): {
      (p.xrepeat = ((u32(((u32(newValue) << 24) >> 24)) << 24) >> 24));
    }
    break;
    case i32(19): {
      (p.yrepeat = ((u32(((u32(newValue) << 24) >> 24)) << 24) >> 24));
    }
    break;
  }
}

// C/C++ source: source/duke3d/src/gamestructures.cpp:843
const __cxx_literal_73bcdaf4a85d339cfa87 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 115, 116, 114, 117, 99, 116, 117, 114, 101, 115, 46, 99, 112, 112, 0]);
const __cxx_literal_df7861e790581c55bf4e = Uint8Array.from([37, 115, 58, 37, 100, 58, 32, 37, 115, 58, 32, 37, 115, 32, 105, 110, 118, 97, 108, 105, 100, 32, 102, 111, 114, 32, 112, 114, 111, 106, 101, 99, 116, 105, 108, 101, 32, 37, 100, 10, 0]);
export function VM_GetActiveProjectile(spriteNum, labelNum) {
  if ((u32(spriteNum) >= u32(16384))) {
    do {
      ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = i32((__cxx_lvalue_0.value | i32(1)))))(cObjectFieldRef(__cxx_global_cell_5bce98f73f3ed0c837f2729e().value, "flags"));
      ((i32(-2) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-2), __cxx_literal_73bcdaf4a85d339cfa87, u32(847), __cxx_literal_df7861e790581c55bf4e, C_GetFileForOffset__header_3a230d97d314(i32(cPointerDiff(__cxx_global_cell_f5596e70af51a8f811191c88().value, __cxx_global_cell_38abf48ab8ba3db5fce877d9().value, BigInt64Array.BYTES_PER_ELEMENT))), i32((i32((__cxx_global_cell_34a2426c22a51b0e2d5bc428().value & (~i32((1 << 31))))) >> 12)), VM_GetKeywordForID(i32((__cxx_global_cell_34a2426c22a51b0e2d5bc428().value & 4095))), (cPointerElementRef(cRecordPointer(ProjectileLabels, {"align": 8, "arrayAlign": 1, "fields": {"flags": {"native": "Uint16Array", "offset": 10, "size": 2}, "lId": {"native": "Int16Array", "offset": 8, "size": 2}, "maxParm2": {"native": "Int16Array", "offset": 12, "size": 2}, "name": {"offset": 0, "pointer": true, "size": 8}, "offset": {"native": "Int16Array", "offset": 14, "size": 2}}, "overlaps": false, "size": 16, "union": false}, {}), labelNum).value).name, spriteNum));
    } while (Boolean(0));
    return i32((-1));
  }
  let p = (cPointerElementRef(cRecordPointer(SpriteProjectile, {"align": 4, "arrayAlign": 1, "fields": {"bounces": {"native": "Int16Array", "offset": 38, "size": 2}, "bsound": {"native": "Int16Array", "offset": 40, "size": 2}, "clipdist": {"native": "Uint8Array", "offset": 57, "size": 1}, "cstat": {"native": "Int32Array", "offset": 4, "size": 4}, "decal": {"native": "Int16Array", "offset": 28, "size": 2}, "drop": {"native": "Int16Array", "offset": 34, "size": 2}, "extra": {"native": "Int16Array", "offset": 44, "size": 2}, "extra_rand": {"native": "Int16Array", "offset": 46, "size": 2}, "filler": {"length": 2, "native": "Int8Array", "offset": 58, "size": 2}, "flashcolor": {"native": "Int32Array", "offset": 16, "size": 4}, "hitradius": {"native": "Int32Array", "offset": 8, "size": 4}, "isound": {"native": "Int16Array", "offset": 24, "size": 2}, "movecnt": {"native": "Int8Array", "offset": 56, "size": 1}, "offset": {"native": "Int16Array", "offset": 36, "size": 2}, "pal": {"native": "Int8Array", "offset": 55, "size": 1}, "range": {"native": "Int32Array", "offset": 12, "size": 4}, "shade": {"native": "Int8Array", "offset": 52, "size": 1}, "sound": {"native": "Int16Array", "offset": 22, "size": 2}, "spawns": {"native": "Int16Array", "offset": 20, "size": 2}, "sxrepeat": {"native": "Int8Array", "offset": 48, "size": 1}, "syrepeat": {"native": "Int8Array", "offset": 49, "size": 1}, "tnum": {"native": "Int16Array", "offset": 32, "size": 2}, "toffset": {"native": "Int16Array", "offset": 42, "size": 2}, "trail": {"native": "Int16Array", "offset": 30, "size": 2}, "txrepeat": {"native": "Int8Array", "offset": 50, "size": 1}, "tyrepeat": {"native": "Int8Array", "offset": 51, "size": 1}, "userdata": {"native": "Int32Array", "offset": 60, "size": 4}, "vel": {"native": "Int16Array", "offset": 26, "size": 2}, "workslike": {"native": "Int32Array", "offset": 0, "size": 4}, "xrepeat": {"native": "Int8Array", "offset": 53, "size": 1}, "yrepeat": {"native": "Int8Array", "offset": 54, "size": 1}}, "overlaps": false, "size": 64, "union": false}, {}), spriteNum).value);
  switch (labelNum) {
    case i32(0): {
      (labelNum = i32(p.workslike));
    }
    break;
    case i32(1): {
      (labelNum = i32(p.spawns));
    }
    break;
    case i32(2): {
      (labelNum = i32(p.sxrepeat));
    }
    break;
    case i32(3): {
      (labelNum = i32(p.syrepeat));
    }
    break;
    case i32(4): {
      (labelNum = i32(p.sound));
    }
    break;
    case i32(5): {
      (labelNum = i32(p.isound));
    }
    break;
    case i32(6): {
      (labelNum = i32(p.vel));
    }
    break;
    case i32(7): {
      (labelNum = i32(p.extra));
    }
    break;
    case i32(8): {
      (labelNum = i32(p.decal));
    }
    break;
    case i32(9): {
      (labelNum = i32(p.trail));
    }
    break;
    case i32(10): {
      (labelNum = i32(p.txrepeat));
    }
    break;
    case i32(11): {
      (labelNum = i32(p.tyrepeat));
    }
    break;
    case i32(12): {
      (labelNum = i32(p.toffset));
    }
    break;
    case i32(13): {
      (labelNum = i32(p.tnum));
    }
    break;
    case i32(14): {
      (labelNum = i32(p.drop));
    }
    break;
    case i32(15): {
      (labelNum = i32(p.cstat));
    }
    break;
    case i32(16): {
      (labelNum = i32(p.clipdist));
    }
    break;
    case i32(17): {
      (labelNum = i32(p.shade));
    }
    break;
    case i32(18): {
      (labelNum = i32(p.xrepeat));
    }
    break;
    case i32(19): {
      (labelNum = i32(p.yrepeat));
    }
    break;
    case i32(20): {
      (labelNum = i32(p.pal));
    }
    break;
    case i32(21): {
      (labelNum = i32(p.extra_rand));
    }
    break;
    case i32(22): {
      (labelNum = i32(p.hitradius));
    }
    break;
    case i32(23): {
      (labelNum = i32(p.movecnt));
    }
    break;
    case i32(24): {
      (labelNum = i32(p.offset));
    }
    break;
    case i32(25): {
      (labelNum = i32(p.bounces));
    }
    break;
    case i32(26): {
      (labelNum = i32(p.bsound));
    }
    break;
    case i32(27): {
      (labelNum = i32(p.range));
    }
    break;
    case i32(28): {
      (labelNum = i32(p.flashcolor));
    }
    break;
    case i32(29): {
      (labelNum = i32(p.userdata));
    }
    break;
    default: {
      __builtin_unreachable();
    }
  }
  return i32(labelNum);
}

// C/C++ source: source/duke3d/src/gamestructures.cpp:892
const __cxx_literal_2ee4af7932b86be18ef3 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 115, 116, 114, 117, 99, 116, 117, 114, 101, 115, 46, 99, 112, 112, 0]);
const __cxx_literal_66ed9a8b340967065029 = Uint8Array.from([37, 115, 58, 37, 100, 58, 32, 37, 115, 58, 32, 37, 115, 32, 105, 110, 118, 97, 108, 105, 100, 32, 102, 111, 114, 32, 112, 114, 111, 106, 101, 99, 116, 105, 108, 101, 32, 37, 100, 10, 0]);
export function VM_SetActiveProjectile(spriteNum, labelNum, newValue) {
  if ((u32(spriteNum) >= u32(16384))) {
    do {
      ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = i32((__cxx_lvalue_0.value | i32(1)))))(cObjectFieldRef(__cxx_global_cell_5bce98f73f3ed0c837f2729e().value, "flags"));
      ((i32(-2) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-2), __cxx_literal_2ee4af7932b86be18ef3, u32(896), __cxx_literal_66ed9a8b340967065029, C_GetFileForOffset__header_3a230d97d314(i32(cPointerDiff(__cxx_global_cell_f5596e70af51a8f811191c88().value, __cxx_global_cell_38abf48ab8ba3db5fce877d9().value, BigInt64Array.BYTES_PER_ELEMENT))), i32((i32((__cxx_global_cell_34a2426c22a51b0e2d5bc428().value & (~i32((1 << 31))))) >> 12)), VM_GetKeywordForID(i32((__cxx_global_cell_34a2426c22a51b0e2d5bc428().value & 4095))), (cPointerElementRef(cRecordPointer(ProjectileLabels, {"align": 8, "arrayAlign": 1, "fields": {"flags": {"native": "Uint16Array", "offset": 10, "size": 2}, "lId": {"native": "Int16Array", "offset": 8, "size": 2}, "maxParm2": {"native": "Int16Array", "offset": 12, "size": 2}, "name": {"offset": 0, "pointer": true, "size": 8}, "offset": {"native": "Int16Array", "offset": 14, "size": 2}}, "overlaps": false, "size": 16, "union": false}, {}), labelNum).value).name, spriteNum));
    } while (Boolean(0));
    return;
  }
  let p = (cPointerElementRef(cRecordPointer(SpriteProjectile, {"align": 4, "arrayAlign": 1, "fields": {"bounces": {"native": "Int16Array", "offset": 38, "size": 2}, "bsound": {"native": "Int16Array", "offset": 40, "size": 2}, "clipdist": {"native": "Uint8Array", "offset": 57, "size": 1}, "cstat": {"native": "Int32Array", "offset": 4, "size": 4}, "decal": {"native": "Int16Array", "offset": 28, "size": 2}, "drop": {"native": "Int16Array", "offset": 34, "size": 2}, "extra": {"native": "Int16Array", "offset": 44, "size": 2}, "extra_rand": {"native": "Int16Array", "offset": 46, "size": 2}, "filler": {"length": 2, "native": "Int8Array", "offset": 58, "size": 2}, "flashcolor": {"native": "Int32Array", "offset": 16, "size": 4}, "hitradius": {"native": "Int32Array", "offset": 8, "size": 4}, "isound": {"native": "Int16Array", "offset": 24, "size": 2}, "movecnt": {"native": "Int8Array", "offset": 56, "size": 1}, "offset": {"native": "Int16Array", "offset": 36, "size": 2}, "pal": {"native": "Int8Array", "offset": 55, "size": 1}, "range": {"native": "Int32Array", "offset": 12, "size": 4}, "shade": {"native": "Int8Array", "offset": 52, "size": 1}, "sound": {"native": "Int16Array", "offset": 22, "size": 2}, "spawns": {"native": "Int16Array", "offset": 20, "size": 2}, "sxrepeat": {"native": "Int8Array", "offset": 48, "size": 1}, "syrepeat": {"native": "Int8Array", "offset": 49, "size": 1}, "tnum": {"native": "Int16Array", "offset": 32, "size": 2}, "toffset": {"native": "Int16Array", "offset": 42, "size": 2}, "trail": {"native": "Int16Array", "offset": 30, "size": 2}, "txrepeat": {"native": "Int8Array", "offset": 50, "size": 1}, "tyrepeat": {"native": "Int8Array", "offset": 51, "size": 1}, "userdata": {"native": "Int32Array", "offset": 60, "size": 4}, "vel": {"native": "Int16Array", "offset": 26, "size": 2}, "workslike": {"native": "Int32Array", "offset": 0, "size": 4}, "xrepeat": {"native": "Int8Array", "offset": 53, "size": 1}, "yrepeat": {"native": "Int8Array", "offset": 54, "size": 1}}, "overlaps": false, "size": 64, "union": false}, {}), spriteNum).value);
  switch (labelNum) {
    case i32(0): {
      (p.workslike = i32(newValue));
    }
    break;
    case i32(1): {
      (p.spawns = ((u32(((u32(newValue) << 16) >> 16)) << 16) >> 16));
    }
    break;
    case i32(2): {
      (p.sxrepeat = ((u32(((u32(newValue) << 24) >> 24)) << 24) >> 24));
    }
    break;
    case i32(3): {
      (p.syrepeat = ((u32(((u32(newValue) << 24) >> 24)) << 24) >> 24));
    }
    break;
    case i32(4): {
      (p.sound = ((u32(((u32(newValue) << 16) >> 16)) << 16) >> 16));
    }
    break;
    case i32(5): {
      (p.isound = ((u32(((u32(newValue) << 16) >> 16)) << 16) >> 16));
    }
    break;
    case i32(6): {
      (p.vel = ((u32(((u32(newValue) << 16) >> 16)) << 16) >> 16));
    }
    break;
    case i32(7): {
      (p.extra = ((u32(((u32(newValue) << 16) >> 16)) << 16) >> 16));
    }
    break;
    case i32(8): {
      (p.decal = ((u32(((u32(newValue) << 16) >> 16)) << 16) >> 16));
    }
    break;
    case i32(9): {
      (p.trail = ((u32(((u32(newValue) << 16) >> 16)) << 16) >> 16));
    }
    break;
    case i32(10): {
      (p.txrepeat = ((u32(((u32(newValue) << 24) >> 24)) << 24) >> 24));
    }
    break;
    case i32(11): {
      (p.tyrepeat = ((u32(((u32(newValue) << 24) >> 24)) << 24) >> 24));
    }
    break;
    case i32(12): {
      (p.toffset = ((u32(((u32(newValue) << 16) >> 16)) << 16) >> 16));
    }
    break;
    case i32(13): {
      (p.tnum = ((u32(((u32(newValue) << 16) >> 16)) << 16) >> 16));
    }
    break;
    case i32(14): {
      (p.drop = ((u32(((u32(newValue) << 16) >> 16)) << 16) >> 16));
    }
    break;
    case i32(15): {
      (p.cstat = i32(newValue));
    }
    break;
    case i32(16): {
      (p.clipdist = (u32((u32(newValue) & 255)) & 255));
    }
    break;
    case i32(17): {
      (p.shade = ((u32(((u32(newValue) << 24) >> 24)) << 24) >> 24));
    }
    break;
    case i32(18): {
      (p.xrepeat = ((u32(((u32(newValue) << 24) >> 24)) << 24) >> 24));
    }
    break;
    case i32(19): {
      (p.yrepeat = ((u32(((u32(newValue) << 24) >> 24)) << 24) >> 24));
    }
    break;
    case i32(20): {
      (p.pal = ((u32(((u32(newValue) << 24) >> 24)) << 24) >> 24));
    }
    break;
    case i32(21): {
      (p.extra_rand = ((u32(((u32(newValue) << 16) >> 16)) << 16) >> 16));
    }
    break;
    case i32(22): {
      (p.hitradius = i32(newValue));
    }
    break;
    case i32(23): {
      (p.movecnt = ((u32(((u32(newValue) << 24) >> 24)) << 24) >> 24));
    }
    break;
    case i32(24): {
      (p.offset = ((u32(((u32(newValue) << 16) >> 16)) << 16) >> 16));
    }
    break;
    case i32(25): {
      (p.bounces = ((u32(((u32(newValue) << 16) >> 16)) << 16) >> 16));
    }
    break;
    case i32(26): {
      (p.bsound = ((u32(((u32(newValue) << 16) >> 16)) << 16) >> 16));
    }
    break;
    case i32(27): {
      (p.range = i32(newValue));
    }
    break;
    case i32(28): {
      (p.flashcolor = i32(newValue));
    }
    break;
    case i32(29): {
      (p.userdata = i32(newValue));
    }
    break;
  }
}

// C/C++ source: source/duke3d/src/gamestructures.cpp:1128
const __cxx_literal_bc15c07a91a046dd124b = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 115, 116, 114, 117, 99, 116, 117, 114, 101, 115, 46, 99, 112, 112, 0]);
const __cxx_literal_51505bf7940d8a16df72 = Uint8Array.from([37, 115, 58, 37, 100, 58, 32, 37, 115, 58, 32, 37, 115, 91, 37, 100, 93, 32, 105, 110, 118, 97, 108, 105, 100, 32, 102, 111, 114, 32, 117, 115, 101, 114, 100, 101, 102, 0]);
export function VM_GetUserdef(labelNum, lParm2) {
  if ((Boolean(i32((i32((cPointerElementRef(cRecordPointer(UserdefsLabels, {"align": 8, "arrayAlign": 1, "fields": {"flags": {"native": "Uint16Array", "offset": 10, "size": 2}, "lId": {"native": "Int16Array", "offset": 8, "size": 2}, "maxParm2": {"native": "Int16Array", "offset": 12, "size": 2}, "name": {"offset": 0, "pointer": true, "size": 8}, "offset": {"native": "Int16Array", "offset": 14, "size": 2}}, "overlaps": false, "size": 16, "union": false}, {}), labelNum).value).flags) & 16))) && (u32(lParm2) >= u32((cPointerElementRef(cRecordPointer(UserdefsLabels, {"align": 8, "arrayAlign": 1, "fields": {"flags": {"native": "Uint16Array", "offset": 10, "size": 2}, "lId": {"native": "Int16Array", "offset": 8, "size": 2}, "maxParm2": {"native": "Int16Array", "offset": 12, "size": 2}, "name": {"offset": 0, "pointer": true, "size": 8}, "offset": {"native": "Int16Array", "offset": 14, "size": 2}}, "overlaps": false, "size": 16, "union": false}, {}), labelNum).value).maxParm2)))) {
    do {
      ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = i32((__cxx_lvalue_0.value | i32(1)))))(cObjectFieldRef(__cxx_global_cell_5bce98f73f3ed0c837f2729e().value, "flags"));
      ((i32(-2) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-2), __cxx_literal_bc15c07a91a046dd124b, u32(1132), __cxx_literal_51505bf7940d8a16df72, C_GetFileForOffset__header_3a230d97d314(i32(cPointerDiff(__cxx_global_cell_f5596e70af51a8f811191c88().value, __cxx_global_cell_38abf48ab8ba3db5fce877d9().value, BigInt64Array.BYTES_PER_ELEMENT))), i32((i32((__cxx_global_cell_34a2426c22a51b0e2d5bc428().value & (~i32((1 << 31))))) >> 12)), VM_GetKeywordForID(i32((__cxx_global_cell_34a2426c22a51b0e2d5bc428().value & 4095))), (cPointerElementRef(cRecordPointer(UserdefsLabels, {"align": 8, "arrayAlign": 1, "fields": {"flags": {"native": "Uint16Array", "offset": 10, "size": 2}, "lId": {"native": "Int16Array", "offset": 8, "size": 2}, "maxParm2": {"native": "Int16Array", "offset": 12, "size": 2}, "name": {"offset": 0, "pointer": true, "size": 8}, "offset": {"native": "Int16Array", "offset": 14, "size": 2}}, "overlaps": false, "size": 16, "union": false}, {}), labelNum).value).name, lParm2));
    } while (Boolean(0));
    return i32((-1));
  }
  switch (labelNum) {
    case i32(0): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.god));
    }
    break;
    case i32(1): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.warp_on));
    }
    break;
    case i32(2): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.cashman));
    }
    break;
    case i32(3): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.eog));
    }
    break;
    case i32(4): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.showallmap));
    }
    break;
    case i32(5): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.show_help));
    }
    break;
    case i32(6): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.scrollmode));
    }
    break;
    case i32(7): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.noclip));
    }
    break;
    case i32(13): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.overhead_on));
    }
    break;
    case i32(14): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.last_overhead));
    }
    break;
    case i32(15): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.showweapons));
    }
    break;
    case i32(16): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.pause_on));
    }
    break;
    case i32(17): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.from_bonus));
    }
    break;
    case i32(18): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.camerasprite));
    }
    break;
    case i32(19): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.last_camsprite));
    }
    break;
    case i32(20): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.last_level));
    }
    break;
    case i32(21): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.secretlevel));
    }
    break;
    case i32(22): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.const_visibility));
    }
    break;
    case i32(23): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.uw_framerate));
    }
    break;
    case i32(24): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.camera_time));
    }
    break;
    case i32(25): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.folfvel));
    }
    break;
    case i32(26): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.folsvel));
    }
    break;
    case i32(27): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.folavel));
    }
    break;
    case i32(28): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.folx));
    }
    break;
    case i32(29): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.foly));
    }
    break;
    case i32(30): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.fola));
    }
    break;
    case i32(31): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.reccnt));
    }
    break;
    case i32(32): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.entered_name));
    }
    break;
    case i32(33): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.screen_tilting));
    }
    break;
    case i32(34): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.shadows));
    }
    break;
    case i32(35): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.fta_on));
    }
    break;
    case i32(36): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.executions));
    }
    break;
    case i32(37): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.auto_run));
    }
    break;
    case i32(38): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.coords));
    }
    break;
    case i32(39): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.showfps));
    }
    break;
    case i32(40): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.m_coop));
    }
    break;
    case i32(41): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.coop));
    }
    break;
    case i32(42): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.screen_size));
    }
    break;
    case i32(43): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.lockout));
    }
    break;
    case i32(44): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.crosshair));
    }
    break;
    case i32(45): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.playerai));
    }
    break;
    case i32(46): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.respawn_monsters));
    }
    break;
    case i32(47): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.respawn_items));
    }
    break;
    case i32(48): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.respawn_inventory));
    }
    break;
    case i32(49): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.recstat));
    }
    break;
    case i32(50): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.monsters_off));
    }
    break;
    case i32(51): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.brightness));
    }
    break;
    case i32(52): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.m_respawn_items));
    }
    break;
    case i32(53): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.m_respawn_monsters));
    }
    break;
    case i32(54): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.m_respawn_inventory));
    }
    break;
    case i32(55): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.m_recstat));
    }
    break;
    case i32(56): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.m_monsters_off));
    }
    break;
    case i32(57): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.detail));
    }
    break;
    case i32(58): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.m_ffire));
    }
    break;
    case i32(59): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.ffire));
    }
    break;
    case i32(60): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.m_player_skill));
    }
    break;
    case i32(61): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.m_level_number));
    }
    break;
    case i32(62): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.m_volume_number));
    }
    break;
    case i32(166): {
      (labelNum = i32(Menu_HaveUserMap__header_94b09d1d1fc7()));
    }
    break;
    case i32(63): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.multimode));
    }
    break;
    case i32(64): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.player_skill));
    }
    break;
    case i32(65): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.level_number));
    }
    break;
    case i32(66): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.volume_number));
    }
    break;
    case i32(165): {
      (labelNum = i32(G_HaveUserMap__header_36f36d810416()));
    }
    break;
    case i32(67): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.m_marker));
    }
    break;
    case i32(68): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.marker));
    }
    break;
    case i32(69): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.mouseflip));
    }
    break;
    case i32(70): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.statusbarscale));
    }
    break;
    case i32(71): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.drawweapon));
    }
    break;
    case i32(72): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.mouseaiming));
    }
    break;
    case i32(73): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.weaponswitch));
    }
    break;
    case i32(74): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.democams));
    }
    break;
    case i32(75): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.color));
    }
    break;
    case i32(76): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.msgdisptime));
    }
    break;
    case i32(77): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.statusbarmode));
    }
    break;
    case i32(78): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.m_noexits));
    }
    break;
    case i32(79): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.noexits));
    }
    break;
    case i32(80): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.autovote));
    }
    break;
    case i32(81): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.automsg));
    }
    break;
    case i32(82): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.idplayers));
    }
    break;
    case i32(83): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.team));
    }
    break;
    case i32(84): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.viewbob));
    }
    break;
    case i32(85): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.weaponsway));
    }
    break;
    case i32(86): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.obituaries));
    }
    break;
    case i32(87): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.levelstats));
    }
    break;
    case i32(88): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.crosshairscale));
    }
    break;
    case i32(89): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.althud));
    }
    break;
    case i32(90): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.display_bonus_screen));
    }
    break;
    case i32(91): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.show_level_text));
    }
    break;
    case i32(92): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.weaponscale));
    }
    break;
    case i32(93): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.textscale));
    }
    break;
    case i32(94): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.runkey_mode));
    }
    break;
    case i32(95): {
      (labelNum = i32((cDeref(cPointerOffset(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.returnvar, 0, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
    }
    break;
    case i32(96): {
      (labelNum = i32((cDeref(cPointerOffset(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.returnvar, 1, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
    }
    break;
    case i32(97): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.playerbest));
    }
    break;
    case i32(98): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.config.MusicToggle));
    }
    break;
    case i32(99): {
      (labelNum = i32(__cxx_global_cell_77d5c24237b7b046074e378d().value));
    }
    break;
    case i32(100):
    case i32(101): {
      (labelNum = i32(0));
    }
    break;
    case i32(102): {
      (labelNum = i32((cDeref(cPointerOffset(g_gametypeFlags, __cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.coop, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
    }
    break;
    case i32(103): {
      (labelNum = i32((cDeref(cPointerOffset(g_gametypeFlags, __cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.m_coop, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
    }
    break;
    case i32(104): {
      (labelNum = i32(__cxx_global_cell_687ad03e56ad49d91da7ede0().value));
    }
    break;
    case i32(105): {
      (labelNum = i32(__cxx_global_cell_286850f0b72c66d5aae173a9().value));
    }
    break;
    case i32(106): {
      (labelNum = i32(__cxx_global_cell_5bce98f73f3ed0c837f2729e().value.playerNum));
    }
    break;
    case i32(107): {
      (labelNum = i32(__cxx_global_cell_5bce98f73f3ed0c837f2729e().value.spriteNum));
    }
    break;
    case i32(108): {
      (labelNum = i32(__cxx_global_cell_5bce98f73f3ed0c837f2729e().value.playerDist));
    }
    break;
    case i32(109): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.config.SoundToggle));
    }
    break;
    case i32(110): {
      (labelNum = i32(__cxx_global_cell_5efadf8c3ac8c3f646e8a150().value.between.x));
    }
    break;
    case i32(112): {
      (labelNum = i32(__cxx_global_cell_4b62716bda68649a2b393452().value.between.x));
    }
    break;
    case i32(113): {
      (labelNum = i32(__cxx_global_cell_4723a60d88a1aa0814b17967().value));
    }
    break;
    case i32(114): {
      (labelNum = i32((cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), __cxx_global_cell_c678e52b13334e9e7bc849c7().value).value).__cxx_anonymous_0.global));
    }
    break;
    case i32(115): {
      (labelNum = i32((cDeref(cPointerOffset(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.returnvar, 0, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
    }
    break;
    case i32(116): {
      (labelNum = i32((cDeref(cPointerOffset(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.returnvar, 1, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
    }
    break;
    case i32(117): {
      (labelNum = i32((cDeref(cPointerOffset(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.returnvar, 2, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
    }
    break;
    case i32(118): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.screenfade));
    }
    break;
    case i32(119): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.menubackground));
    }
    break;
    case i32(120): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.statusbarflags));
    }
    break;
    case i32(121): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.statusbarrange));
    }
    break;
    case i32(122): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.statusbarcustom));
    }
    break;
    case i32(123): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.hudontop));
    }
    break;
    case i32(124): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.menu_slidebarz));
    }
    break;
    case i32(125): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.menu_slidebarmargin));
    }
    break;
    case i32(126): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.menu_slidecursorz));
    }
    break;
    case i32(127): {
      (labelNum = i32(__cxx_global_cell_a248700a49a9585168c4d6fc().value));
    }
    break;
    case i32(128): {
      (labelNum = i32(__cxx_global_cell_23f70e7a799326383b6cae79().value));
    }
    break;
    case i32(129): {
      (labelNum = i32(__cxx_global_cell_81af557897af1f573210de4b().value));
    }
    break;
    case i32(130): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.default_volume));
    }
    break;
    case i32(131): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.default_skill));
    }
    break;
    case i32(132): {
      (labelNum = i32(__cxx_global_cell_4b62716bda68649a2b393452().value.shade_deselected));
    }
    break;
    case i32(133): {
      (labelNum = i32(__cxx_global_cell_4b62716bda68649a2b393452().value.shade_disabled));
    }
    break;
    case i32(134): {
      (labelNum = i32(__cxx_global_cell_4b62716bda68649a2b393452().value.zoom));
    }
    break;
    case i32(135): {
      (labelNum = i32(__cxx_global_cell_4b62716bda68649a2b393452().value.emptychar.x));
    }
    break;
    case i32(137): {
      (labelNum = i32(__cxx_global_cell_4b62716bda68649a2b393452().value.pal_selected));
    }
    break;
    case i32(138): {
      (labelNum = i32(__cxx_global_cell_4b62716bda68649a2b393452().value.pal_deselected));
    }
    break;
    case i32(139): {
      (labelNum = i32(__cxx_global_cell_4b62716bda68649a2b393452().value.pal_disabled));
    }
    break;
    case i32(143): {
      (labelNum = i32(__cxx_global_cell_5efadf8c3ac8c3f646e8a150().value.zoom));
    }
    break;
    case i32(144): {
      (labelNum = i32(__cxx_global_cell_5efadf8c3ac8c3f646e8a150().value.emptychar.x));
    }
    break;
    case i32(146): {
      (labelNum = i32(__cxx_global_cell_5efadf8c3ac8c3f646e8a150().value.pal_selected));
    }
    break;
    case i32(147): {
      (labelNum = i32(__cxx_global_cell_5efadf8c3ac8c3f646e8a150().value.pal_deselected));
    }
    break;
    case i32(148): {
      (labelNum = i32(__cxx_global_cell_5efadf8c3ac8c3f646e8a150().value.pal_disabled));
    }
    break;
    case i32(152): {
      (labelNum = i32(__cxx_global_cell_a143cc9cf412c52e6ca7a408().value.zoom));
    }
    break;
    case i32(153): {
      (labelNum = i32(__cxx_global_cell_a143cc9cf412c52e6ca7a408().value.emptychar.x));
    }
    break;
    case i32(154): {
      (labelNum = i32(__cxx_global_cell_a143cc9cf412c52e6ca7a408().value.between.x));
    }
    break;
    case i32(156): {
      (labelNum = i32(__cxx_global_cell_a143cc9cf412c52e6ca7a408().value.pal_selected));
    }
    break;
    case i32(157): {
      (labelNum = i32(__cxx_global_cell_a143cc9cf412c52e6ca7a408().value.pal_deselected));
    }
    break;
    case i32(158): {
      (labelNum = i32(__cxx_global_cell_a143cc9cf412c52e6ca7a408().value.pal_disabled));
    }
    break;
    case i32(162): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.menutitle_pal));
    }
    break;
    case i32(163): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.slidebar_palselected));
    }
    break;
    case i32(164): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.slidebar_paldisabled));
    }
    break;
    case i32(167): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.music_episode));
    }
    break;
    case i32(168): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.music_level));
    }
    break;
    case i32(169): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.shadow_pal));
    }
    break;
    case i32(170): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.menu_scrollbartilenum));
    }
    break;
    case i32(171): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.menu_scrollbarz));
    }
    break;
    case i32(172): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.menu_scrollcursorz));
    }
    break;
    case i32(173): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.quote_yoffset));
    }
    break;
    case i32(174): {
      if ((lParm2 == 0)) {
        (labelNum = i32((cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), __cxx_global_cell_c678e52b13334e9e7bc849c7().value).value).__cxx_anonymous_0.global));
      } else {
        (labelNum = i32((cDeref(cPointerOffset(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.returnvar, i32((lParm2 - 1)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
      }
    }
    break;
    case i32(175): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.userbytever));
    }
    break;
    case i32(176): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.autosave));
    }
    break;
    case i32(177): {
      (labelNum = i32(__cxx_global_cell_f6c55103bb34c1bae0a56530().value));
    }
    break;
    case i32(178): {
      (labelNum = i32(__cxx_global_cell_1eb1cfb64d199abe24ad949b().value));
    }
    break;
    case i32(179): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.fov));
    }
    break;
    case i32(182): {
      (labelNum = i32((__cxx_global_cell_9e4cb87c453b25482a00c2b9().value == 1)));
    }
    break;
    case i32(183): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.m_newgamecustom));
    }
    break;
    case i32(184): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.m_newgamecustomsub));
    }
    break;
    case i32(185): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.m_newgamecustoml3));
    }
    break;
    case i32(186): {
      (labelNum = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.kick_mode));
    }
    break;
    default: {
      __builtin_unreachable();
    }
  }
  return i32(labelNum);
}

// C/C++ source: source/duke3d/src/gamestructures.cpp:1551
const __cxx_literal_25c15884ff64a013b162 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 115, 116, 114, 117, 99, 116, 117, 114, 101, 115, 46, 99, 112, 112, 0]);
const __cxx_literal_3febdb8bc2c5eac41a3d = Uint8Array.from([37, 115, 58, 37, 100, 58, 32, 37, 115, 58, 32, 105, 110, 118, 97, 108, 105, 100, 32, 112, 108, 97, 121, 101, 114, 32, 37, 100, 10, 0]);
export function VM_GetPlayerInput(playerNum, labelNum) {
  if ((u32(playerNum) >= u32(__cxx_global_cell_462926f90efdfe463807ff55().value))) {
    do {
      ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = i32((__cxx_lvalue_0.value | i32(1)))))(cObjectFieldRef(__cxx_global_cell_5bce98f73f3ed0c837f2729e().value, "flags"));
      ((i32(-2) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-2), __cxx_literal_25c15884ff64a013b162, u32(1555), __cxx_literal_3febdb8bc2c5eac41a3d, C_GetFileForOffset__header_3a230d97d314(i32(cPointerDiff(__cxx_global_cell_f5596e70af51a8f811191c88().value, __cxx_global_cell_38abf48ab8ba3db5fce877d9().value, BigInt64Array.BYTES_PER_ELEMENT))), i32((i32((__cxx_global_cell_34a2426c22a51b0e2d5bc428().value & (~i32((1 << 31))))) >> 12)), VM_GetKeywordForID(i32((__cxx_global_cell_34a2426c22a51b0e2d5bc428().value & 4095))), playerNum));
    } while (Boolean(0));
    return i32((-1));
  }
  let i = (cPointerElementRef(cRecordPointer(g_player, {"align": 1, "arrayAlign": 1, "fields": {"frags": {"length": 16, "native": "Uint8Array", "offset": 62, "size": 16}, "gotvote": {"native": "Uint8Array", "offset": 93, "size": 1}, "horizAngleAdjust": {"native": "Int32Array", "offset": 32, "size": 4}, "horizRecenter": {"native": "Int32Array", "offset": 28, "size": 4}, "horizSkew": {"native": "Int32Array", "offset": 36, "size": 4}, "input": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"bits": {"native": "Uint32Array", "offset": 0, "size": 4}, "extbits": {"native": "Uint32Array", "offset": 16, "size": 4}, "fvel": {"native": "Int16Array", "offset": 4, "size": 2}, "q16avel": {"native": "Int32Array", "offset": 8, "size": 4}, "q16horz": {"native": "Int32Array", "offset": 12, "size": 4}, "svel": {"native": "Int16Array", "offset": 6, "size": 2}}, "overlaps": false, "size": 20, "union": false}, "offset": 8}, "lastViewUpdate": {"native": "BigUint64Array", "offset": 40, "size": 8}, "netsynctime": {"native": "Int32Array", "offset": 48, "size": 4}, "pcolor": {"native": "Int32Array", "offset": 52, "size": 4}, "ping": {"native": "Int16Array", "offset": 60, "size": 2}, "pingcnt": {"native": "Uint8Array", "offset": 94, "size": 1}, "playerquitflag": {"native": "Uint8Array", "offset": 95, "size": 1}, "ps": {"offset": 0, "pointer": true, "size": 8}, "pteam": {"native": "Int32Array", "offset": 56, "size": 4}, "ready": {"native": "Uint8Array", "offset": 96, "size": 1}, "revision": {"native": "Uint32Array", "offset": 129, "size": 4}, "smoothcamera": {"native": "Uint8Array", "offset": 91, "size": 1}, "user_name": {"length": 32, "native": "Uint8Array", "offset": 97, "size": 32}, "vote": {"native": "Uint8Array", "offset": 92, "size": 1}, "wchoice": {"length": 13, "native": "Uint8Array", "offset": 78, "size": 13}}, "overlaps": false, "size": 133, "union": false}, {}), playerNum).value).input;
  switch (labelNum) {
    case i32(0): {
      (labelNum = i32(fix16_to_int__header_dca2865dd032(i.q16avel)));
    }
    break;
    case i32(2): {
      (labelNum = i32(fix16_to_int__header_dca2865dd032(i.q16horz)));
    }
    break;
    case i32(1): {
      (labelNum = i32(i.q16avel));
    }
    break;
    case i32(3): {
      (labelNum = i32(i.q16horz));
    }
    break;
    case i32(4): {
      (labelNum = i32(i.fvel));
    }
    break;
    case i32(5): {
      (labelNum = i32(i.svel));
    }
    break;
    case i32(6): {
      (labelNum = i32(i.bits));
    }
    break;
    case i32(7): {
      (labelNum = i32(i.extbits));
    }
    break;
    default: {
      __builtin_unreachable();
    }
  }
  return i32(labelNum);
}

// C/C++ source: source/duke3d/src/gamestructures.cpp:1578
const __cxx_literal_1c3e6641473adb74da91 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 115, 116, 114, 117, 99, 116, 117, 114, 101, 115, 46, 99, 112, 112, 0]);
const __cxx_literal_18f0a6b0314bd580afc9 = Uint8Array.from([37, 115, 58, 37, 100, 58, 32, 37, 115, 58, 32, 105, 110, 118, 97, 108, 105, 100, 32, 112, 108, 97, 121, 101, 114, 32, 37, 100, 10, 0]);
export function VM_SetPlayerInput(playerNum, labelNum, newValue) {
  if ((u32(playerNum) >= u32(__cxx_global_cell_462926f90efdfe463807ff55().value))) {
    do {
      ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = i32((__cxx_lvalue_0.value | i32(1)))))(cObjectFieldRef(__cxx_global_cell_5bce98f73f3ed0c837f2729e().value, "flags"));
      ((i32(-2) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-2), __cxx_literal_1c3e6641473adb74da91, u32(1582), __cxx_literal_18f0a6b0314bd580afc9, C_GetFileForOffset__header_3a230d97d314(i32(cPointerDiff(__cxx_global_cell_f5596e70af51a8f811191c88().value, __cxx_global_cell_38abf48ab8ba3db5fce877d9().value, BigInt64Array.BYTES_PER_ELEMENT))), i32((i32((__cxx_global_cell_34a2426c22a51b0e2d5bc428().value & (~i32((1 << 31))))) >> 12)), VM_GetKeywordForID(i32((__cxx_global_cell_34a2426c22a51b0e2d5bc428().value & 4095))), playerNum));
    } while (Boolean(0));
    return;
  }
  let i = (cPointerElementRef(cRecordPointer(g_player, {"align": 1, "arrayAlign": 1, "fields": {"frags": {"length": 16, "native": "Uint8Array", "offset": 62, "size": 16}, "gotvote": {"native": "Uint8Array", "offset": 93, "size": 1}, "horizAngleAdjust": {"native": "Int32Array", "offset": 32, "size": 4}, "horizRecenter": {"native": "Int32Array", "offset": 28, "size": 4}, "horizSkew": {"native": "Int32Array", "offset": 36, "size": 4}, "input": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"bits": {"native": "Uint32Array", "offset": 0, "size": 4}, "extbits": {"native": "Uint32Array", "offset": 16, "size": 4}, "fvel": {"native": "Int16Array", "offset": 4, "size": 2}, "q16avel": {"native": "Int32Array", "offset": 8, "size": 4}, "q16horz": {"native": "Int32Array", "offset": 12, "size": 4}, "svel": {"native": "Int16Array", "offset": 6, "size": 2}}, "overlaps": false, "size": 20, "union": false}, "offset": 8}, "lastViewUpdate": {"native": "BigUint64Array", "offset": 40, "size": 8}, "netsynctime": {"native": "Int32Array", "offset": 48, "size": 4}, "pcolor": {"native": "Int32Array", "offset": 52, "size": 4}, "ping": {"native": "Int16Array", "offset": 60, "size": 2}, "pingcnt": {"native": "Uint8Array", "offset": 94, "size": 1}, "playerquitflag": {"native": "Uint8Array", "offset": 95, "size": 1}, "ps": {"offset": 0, "pointer": true, "size": 8}, "pteam": {"native": "Int32Array", "offset": 56, "size": 4}, "ready": {"native": "Uint8Array", "offset": 96, "size": 1}, "revision": {"native": "Uint32Array", "offset": 129, "size": 4}, "smoothcamera": {"native": "Uint8Array", "offset": 91, "size": 1}, "user_name": {"length": 32, "native": "Uint8Array", "offset": 97, "size": 32}, "vote": {"native": "Uint8Array", "offset": 92, "size": 1}, "wchoice": {"length": 13, "native": "Uint8Array", "offset": 78, "size": 13}}, "overlaps": false, "size": 133, "union": false}, {}), playerNum).value).input;
  switch (labelNum) {
    case i32(0): {
      (i.q16avel = i32(fix16_from_int__header_6f2807549e5a(newValue)));
    }
    break;
    case i32(2): {
      (i.q16horz = i32(fix16_from_int__header_6f2807549e5a(newValue)));
    }
    break;
    case i32(1): {
      (i.q16avel = i32(newValue));
    }
    break;
    case i32(3): {
      (i.q16horz = i32(newValue));
    }
    break;
    case i32(4): {
      (i.fvel = ((u32(((u32(newValue) << 16) >> 16)) << 16) >> 16));
    }
    break;
    case i32(5): {
      (i.svel = ((u32(((u32(newValue) << 16) >> 16)) << 16) >> 16));
    }
    break;
    case i32(6): {
      (i.bits = u32(newValue));
    }
    break;
    case i32(7): {
      (i.extbits = u32(newValue));
    }
    break;
  }
}

// C/C++ source: source/duke3d/src/gamestructures.cpp:1618
const __cxx_literal_a9e909231028b98878d9 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 115, 116, 114, 117, 99, 116, 117, 114, 101, 115, 46, 99, 112, 112, 0]);
const __cxx_literal_97c1a3161e832366d97c = Uint8Array.from([37, 115, 58, 37, 100, 58, 32, 37, 115, 58, 32, 105, 110, 118, 97, 108, 105, 100, 32, 116, 105, 108, 101, 32, 37, 100, 10, 0]);
export function VM_GetTileData(tileNum, labelNum) {
  if ((u32(tileNum) >= u32(30720))) {
    do {
      ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = i32((__cxx_lvalue_0.value | i32(1)))))(cObjectFieldRef(__cxx_global_cell_5bce98f73f3ed0c837f2729e().value, "flags"));
      ((i32(-2) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-2), __cxx_literal_a9e909231028b98878d9, u32(1622), __cxx_literal_97c1a3161e832366d97c, C_GetFileForOffset__header_3a230d97d314(i32(cPointerDiff(__cxx_global_cell_f5596e70af51a8f811191c88().value, __cxx_global_cell_38abf48ab8ba3db5fce877d9().value, BigInt64Array.BYTES_PER_ELEMENT))), i32((i32((__cxx_global_cell_34a2426c22a51b0e2d5bc428().value & (~i32((1 << 31))))) >> 12)), VM_GetKeywordForID(i32((__cxx_global_cell_34a2426c22a51b0e2d5bc428().value & 4095))), tileNum));
    } while (Boolean(0));
    return i32((-1));
  }
  let p = (cPointerElementRef(cRecordPointer(picanm, {"align": 1, "arrayAlign": 1, "fields": {"num": {"native": "Uint8Array", "offset": 0, "size": 1}, "sf": {"native": "Uint8Array", "offset": 3, "size": 1}, "tileflags": {"native": "Uint8Array", "offset": 4, "size": 1}, "xofs": {"native": "Int8Array", "offset": 1, "size": 1}, "yofs": {"native": "Int8Array", "offset": 2, "size": 1}}, "overlaps": false, "size": 5, "union": false}, {}), tileNum).value);
  switch (labelNum) {
    case i32(0): {
      (labelNum = i32((cPointerElementRef(cRecordPointer(tilesiz, {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, {}), tileNum).value).x));
    }
    break;
    case i32(1): {
      (labelNum = i32((cPointerElementRef(cRecordPointer(tilesiz, {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, {}), tileNum).value).y));
    }
    break;
    case i32(7): {
      (labelNum = i32((cPointerElementRef(cRecordPointer(g_tile, {"align": 8, "arrayAlign": 1, "fields": {"cacherange": {"native": "Int32Array", "offset": 36, "size": 4}, "defproj": {"offset": 24, "pointer": true, "size": 8}, "execPtr": {"offset": 0, "pointer": true, "size": 8}, "flags": {"native": "Uint32Array", "offset": 32, "size": 4}, "loadPtr": {"offset": 8, "pointer": true, "size": 8}, "proj": {"offset": 16, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {}), tileNum).value).flags));
    }
    break;
    case i32(2): {
      (labelNum = i32(p.num));
    }
    break;
    case i32(3): {
      (labelNum = i32(p.xofs));
    }
    break;
    case i32(4): {
      (labelNum = i32(p.yofs));
    }
    break;
    case i32(5): {
      (labelNum = i32((i32(p.sf) & i32(15))));
    }
    break;
    case i32(6): {
      (labelNum = i32((i32((i32(p.sf) & i32(192))) >> i32(6))));
    }
    break;
    default: {
      __builtin_unreachable();
    }
  }
  return i32(labelNum);
}

// C/C++ source: source/duke3d/src/gamestructures.cpp:1648
const __cxx_literal_c33d4a308c11000a60ce = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 115, 116, 114, 117, 99, 116, 117, 114, 101, 115, 46, 99, 112, 112, 0]);
const __cxx_literal_c1d8875b3617cfe804d4 = Uint8Array.from([37, 115, 58, 37, 100, 58, 32, 37, 115, 58, 32, 105, 110, 118, 97, 108, 105, 100, 32, 116, 105, 108, 101, 32, 37, 100, 10, 0]);
export function VM_SetTileData(tileNum, labelNum, newValue) {
  if ((u32(tileNum) >= u32(30720))) {
    do {
      ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = i32((__cxx_lvalue_0.value | i32(1)))))(cObjectFieldRef(__cxx_global_cell_5bce98f73f3ed0c837f2729e().value, "flags"));
      ((i32(-2) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-2), __cxx_literal_c33d4a308c11000a60ce, u32(1652), __cxx_literal_c1d8875b3617cfe804d4, C_GetFileForOffset__header_3a230d97d314(i32(cPointerDiff(__cxx_global_cell_f5596e70af51a8f811191c88().value, __cxx_global_cell_38abf48ab8ba3db5fce877d9().value, BigInt64Array.BYTES_PER_ELEMENT))), i32((i32((__cxx_global_cell_34a2426c22a51b0e2d5bc428().value & (~i32((1 << 31))))) >> 12)), VM_GetKeywordForID(i32((__cxx_global_cell_34a2426c22a51b0e2d5bc428().value & 4095))), tileNum));
    } while (Boolean(0));
    return;
  }
  let p = (cPointerElementRef(cRecordPointer(picanm, {"align": 1, "arrayAlign": 1, "fields": {"num": {"native": "Uint8Array", "offset": 0, "size": 1}, "sf": {"native": "Uint8Array", "offset": 3, "size": 1}, "tileflags": {"native": "Uint8Array", "offset": 4, "size": 1}, "xofs": {"native": "Int8Array", "offset": 1, "size": 1}, "yofs": {"native": "Int8Array", "offset": 2, "size": 1}}, "overlaps": false, "size": 5, "union": false}, {}), tileNum).value);
  switch (labelNum) {
    case i32(7): {
      ((cPointerElementRef(cRecordPointer(g_tile, {"align": 8, "arrayAlign": 1, "fields": {"cacherange": {"native": "Int32Array", "offset": 36, "size": 4}, "defproj": {"offset": 24, "pointer": true, "size": 8}, "execPtr": {"offset": 0, "pointer": true, "size": 8}, "flags": {"native": "Uint32Array", "offset": 32, "size": 4}, "loadPtr": {"offset": 8, "pointer": true, "size": 8}, "proj": {"offset": 16, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {}), tileNum).value).flags = u32(newValue));
    }
    break;
    case i32(2): {
      (p.num = (u32((u32(newValue) & 255)) & 255));
    }
    break;
    case i32(3): {
      (p.xofs = ((u32(((u32(newValue) << 24) >> 24)) << 24) >> 24));
    }
    break;
    case i32(4): {
      (p.yofs = ((u32(((u32(newValue) << 24) >> 24)) << 24) >> 24));
    }
    break;
    case i32(5): {
      (p.sf = (u32((u32(i32((i32((i32(p.sf) & (~i32(15)))) | i32((newValue & i32(15)))))) & 255)) & 255));
    }
    break;
    case i32(6): {
      (p.sf = (u32((u32(i32((i32((i32(p.sf) & (~i32(192)))) | i32((i32((newValue << i32(6))) & i32(192)))))) & 255)) & 255));
    }
    break;
  }
}

// C/C++ source: source/duke3d/src/gamestructures.cpp:1680
const __cxx_literal_7214c7231c472a5d6961 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 115, 116, 114, 117, 99, 116, 117, 114, 101, 115, 46, 99, 112, 112, 0]);
const __cxx_literal_eff127517aa2dbd62874 = Uint8Array.from([37, 115, 58, 37, 100, 58, 32, 37, 115, 58, 32, 105, 110, 118, 97, 108, 105, 100, 32, 112, 97, 108, 101, 116, 116, 101, 32, 37, 100, 10, 0]);
export function VM_GetPalData(palNum, labelNum) {
  if ((u32(palNum) >= u32(256))) {
    do {
      ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = i32((__cxx_lvalue_0.value | i32(1)))))(cObjectFieldRef(__cxx_global_cell_5bce98f73f3ed0c837f2729e().value, "flags"));
      ((i32(-2) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-2), __cxx_literal_7214c7231c472a5d6961, u32(1684), __cxx_literal_eff127517aa2dbd62874, C_GetFileForOffset__header_3a230d97d314(i32(cPointerDiff(__cxx_global_cell_f5596e70af51a8f811191c88().value, __cxx_global_cell_38abf48ab8ba3db5fce877d9().value, BigInt64Array.BYTES_PER_ELEMENT))), i32((i32((__cxx_global_cell_34a2426c22a51b0e2d5bc428().value & (~i32((1 << 31))))) >> 12)), VM_GetKeywordForID(i32((__cxx_global_cell_34a2426c22a51b0e2d5bc428().value & 4095))), palNum));
    } while (Boolean(0));
    return i32((-1));
  }
  switch (labelNum) {
    case i32(0): {
      (labelNum = i32((cDeref(cPointerOffset(g_noFloorPal, palNum, Int8Array.BYTES_PER_ELEMENT), Int8Array).value)));
    }
    break;
    default: {
      __builtin_unreachable();
    }
  }
  return i32(labelNum);
}

// C/C++ source: source/duke3d/src/gamestructures.cpp:1718
export function VM_InitHashTables() {
  {
    const __cxx_range_array_0 = vmStructHashTablePtrs__header_global_6b3478f82798bb33;
    if (__cxx_range_array_0.length !== 10) throw new RangeError("C array extent mismatch");
    if (!__cxx_range_array_0[Symbol.for("source-first.clang-pointer-array/1")]) throw new TypeError("C pointer array storage ABI missing");
    for (let __cxx_range_index_0 = 0; __cxx_range_index_0 < 10; ++__cxx_range_index_0) {
      let table = __cxx_range_array_0[__cxx_range_index_0];
      hash_init(table);
    }
  }
  inithashnames();
  do {
    for (let i = i32(0); (i64(i) < i64(ARRAY_SIZE__header_f4445ac8eef7(ActorLabels))); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; }))) {
      hash_add(__cxx_global_cell_36ecf5b982ca5148a2b52931().value, (cPointerElementRef(cRecordPointer(ActorLabels, {"align": 8, "arrayAlign": 1, "fields": {"flags": {"native": "Uint16Array", "offset": 10, "size": 2}, "lId": {"native": "Int16Array", "offset": 8, "size": 2}, "maxParm2": {"native": "Int16Array", "offset": 12, "size": 2}, "name": {"offset": 0, "pointer": true, "size": 8}, "offset": {"native": "Int16Array", "offset": 14, "size": 2}}, "overlaps": false, "size": 16, "union": false}, {}), i).value).name, i64(i), 0);
    }

  } while (Boolean(0));
  do {
    for (let i = i32(0); (i64(i) < i64(ARRAY_SIZE__header_ab35039d5e21(InputLabels))); ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i32((previous + 1)); __cxx_lvalue_2.value = next; return previous; })(cRef(() => i, __cxx_lvalue_3 => { i = __cxx_lvalue_3; }))) {
      hash_add(__cxx_global_cell_4dfc2df4beaabb17f13a2a11().value, (cPointerElementRef(cRecordPointer(InputLabels, {"align": 8, "arrayAlign": 1, "fields": {"flags": {"native": "Uint16Array", "offset": 10, "size": 2}, "lId": {"native": "Int16Array", "offset": 8, "size": 2}, "maxParm2": {"native": "Int16Array", "offset": 12, "size": 2}, "name": {"offset": 0, "pointer": true, "size": 8}, "offset": {"native": "Int16Array", "offset": 14, "size": 2}}, "overlaps": false, "size": 16, "union": false}, {}), i).value).name, i64(i), 0);
    }

  } while (Boolean(0));
  do {
    for (let i = i32(0); (i64(i) < i64(ARRAY_SIZE__header_1fb178e7bece(PalDataLabels))); ((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = i32((previous + 1)); __cxx_lvalue_4.value = next; return previous; })(cRef(() => i, __cxx_lvalue_5 => { i = __cxx_lvalue_5; }))) {
      hash_add(__cxx_global_cell_1b64352a65c97cbeac4d8dc1().value, (cPointerElementRef(cRecordPointer(PalDataLabels, {"align": 8, "arrayAlign": 1, "fields": {"flags": {"native": "Uint16Array", "offset": 10, "size": 2}, "lId": {"native": "Int16Array", "offset": 8, "size": 2}, "maxParm2": {"native": "Int16Array", "offset": 12, "size": 2}, "name": {"offset": 0, "pointer": true, "size": 8}, "offset": {"native": "Int16Array", "offset": 14, "size": 2}}, "overlaps": false, "size": 16, "union": false}, {}), i).value).name, i64(i), 0);
    }

  } while (Boolean(0));
  do {
    for (let i = i32(0); (i64(i) < i64(ARRAY_SIZE__header_a0e12283bf57(PlayerLabels))); ((__cxx_lvalue_6) => { const previous = __cxx_lvalue_6.value; const next = i32((previous + 1)); __cxx_lvalue_6.value = next; return previous; })(cRef(() => i, __cxx_lvalue_7 => { i = __cxx_lvalue_7; }))) {
      hash_add(__cxx_global_cell_1edb9adc2ad33f7dab0cc065().value, (cPointerElementRef(cRecordPointer(PlayerLabels, {"align": 8, "arrayAlign": 1, "fields": {"flags": {"native": "Uint16Array", "offset": 10, "size": 2}, "lId": {"native": "Int16Array", "offset": 8, "size": 2}, "maxParm2": {"native": "Int16Array", "offset": 12, "size": 2}, "name": {"offset": 0, "pointer": true, "size": 8}, "offset": {"native": "Int16Array", "offset": 14, "size": 2}}, "overlaps": false, "size": 16, "union": false}, {}), i).value).name, i64(i), 0);
    }

  } while (Boolean(0));
  do {
    for (let i = i32(0); (i64(i) < i64(ARRAY_SIZE__header_d9a02da31d0e(ProjectileLabels))); ((__cxx_lvalue_8) => { const previous = __cxx_lvalue_8.value; const next = i32((previous + 1)); __cxx_lvalue_8.value = next; return previous; })(cRef(() => i, __cxx_lvalue_9 => { i = __cxx_lvalue_9; }))) {
      hash_add(__cxx_global_cell_5369c12f5151e4651feb6d69().value, (cPointerElementRef(cRecordPointer(ProjectileLabels, {"align": 8, "arrayAlign": 1, "fields": {"flags": {"native": "Uint16Array", "offset": 10, "size": 2}, "lId": {"native": "Int16Array", "offset": 8, "size": 2}, "maxParm2": {"native": "Int16Array", "offset": 12, "size": 2}, "name": {"offset": 0, "pointer": true, "size": 8}, "offset": {"native": "Int16Array", "offset": 14, "size": 2}}, "overlaps": false, "size": 16, "union": false}, {}), i).value).name, i64(i), 0);
    }

  } while (Boolean(0));
  do {
    for (let i = i32(0); (i64(i) < i64(ARRAY_SIZE__header_5795883076c7(SectorLabels))); ((__cxx_lvalue_10) => { const previous = __cxx_lvalue_10.value; const next = i32((previous + 1)); __cxx_lvalue_10.value = next; return previous; })(cRef(() => i, __cxx_lvalue_11 => { i = __cxx_lvalue_11; }))) {
      hash_add(__cxx_global_cell_1f238d951ac2733554cfa6c9().value, (cPointerElementRef(cRecordPointer(SectorLabels, {"align": 8, "arrayAlign": 1, "fields": {"flags": {"native": "Uint16Array", "offset": 10, "size": 2}, "lId": {"native": "Int16Array", "offset": 8, "size": 2}, "maxParm2": {"native": "Int16Array", "offset": 12, "size": 2}, "name": {"offset": 0, "pointer": true, "size": 8}, "offset": {"native": "Int16Array", "offset": 14, "size": 2}}, "overlaps": false, "size": 16, "union": false}, {}), i).value).name, i64(i), 0);
    }

  } while (Boolean(0));
  do {
    for (let i = i32(0); (i64(i) < i64(ARRAY_SIZE__header_ab35039d5e21(TileDataLabels))); ((__cxx_lvalue_12) => { const previous = __cxx_lvalue_12.value; const next = i32((previous + 1)); __cxx_lvalue_12.value = next; return previous; })(cRef(() => i, __cxx_lvalue_13 => { i = __cxx_lvalue_13; }))) {
      hash_add(__cxx_global_cell_12f6357b924ceaa4592192e7().value, (cPointerElementRef(cRecordPointer(TileDataLabels, {"align": 8, "arrayAlign": 1, "fields": {"flags": {"native": "Uint16Array", "offset": 10, "size": 2}, "lId": {"native": "Int16Array", "offset": 8, "size": 2}, "maxParm2": {"native": "Int16Array", "offset": 12, "size": 2}, "name": {"offset": 0, "pointer": true, "size": 8}, "offset": {"native": "Int16Array", "offset": 14, "size": 2}}, "overlaps": false, "size": 16, "union": false}, {}), i).value).name, i64(i), 0);
    }

  } while (Boolean(0));
  do {
    for (let i = i32(0); (i64(i) < i64(ARRAY_SIZE__header_3308d4d75a33(TsprLabels))); ((__cxx_lvalue_14) => { const previous = __cxx_lvalue_14.value; const next = i32((previous + 1)); __cxx_lvalue_14.value = next; return previous; })(cRef(() => i, __cxx_lvalue_15 => { i = __cxx_lvalue_15; }))) {
      hash_add(__cxx_global_cell_55925c071ef91c407236ca84().value, (cPointerElementRef(cRecordPointer(TsprLabels, {"align": 8, "arrayAlign": 1, "fields": {"flags": {"native": "Uint16Array", "offset": 10, "size": 2}, "lId": {"native": "Int16Array", "offset": 8, "size": 2}, "maxParm2": {"native": "Int16Array", "offset": 12, "size": 2}, "name": {"offset": 0, "pointer": true, "size": 8}, "offset": {"native": "Int16Array", "offset": 14, "size": 2}}, "overlaps": false, "size": 16, "union": false}, {}), i).value).name, i64(i), 0);
    }

  } while (Boolean(0));
  do {
    for (let i = i32(0); (i64(i) < i64(ARRAY_SIZE__header_6ddb53c363b4(UserdefsLabels))); ((__cxx_lvalue_16) => { const previous = __cxx_lvalue_16.value; const next = i32((previous + 1)); __cxx_lvalue_16.value = next; return previous; })(cRef(() => i, __cxx_lvalue_17 => { i = __cxx_lvalue_17; }))) {
      hash_add(__cxx_global_cell_6fc9ea499f8ee974932947d6().value, (cPointerElementRef(cRecordPointer(UserdefsLabels, {"align": 8, "arrayAlign": 1, "fields": {"flags": {"native": "Uint16Array", "offset": 10, "size": 2}, "lId": {"native": "Int16Array", "offset": 8, "size": 2}, "maxParm2": {"native": "Int16Array", "offset": 12, "size": 2}, "name": {"offset": 0, "pointer": true, "size": 8}, "offset": {"native": "Int16Array", "offset": 14, "size": 2}}, "overlaps": false, "size": 16, "union": false}, {}), i).value).name, i64(i), 0);
    }

  } while (Boolean(0));
  do {
    for (let i = i32(0); (i64(i) < i64(ARRAY_SIZE__header_a86ac7a3f372(WallLabels))); ((__cxx_lvalue_18) => { const previous = __cxx_lvalue_18.value; const next = i32((previous + 1)); __cxx_lvalue_18.value = next; return previous; })(cRef(() => i, __cxx_lvalue_19 => { i = __cxx_lvalue_19; }))) {
      hash_add(__cxx_global_cell_7b44353bd3d207ee6f04360e().value, (cPointerElementRef(cRecordPointer(WallLabels, {"align": 8, "arrayAlign": 1, "fields": {"flags": {"native": "Uint16Array", "offset": 10, "size": 2}, "lId": {"native": "Int16Array", "offset": 8, "size": 2}, "maxParm2": {"native": "Int16Array", "offset": 12, "size": 2}, "name": {"offset": 0, "pointer": true, "size": 8}, "offset": {"native": "Int16Array", "offset": 14, "size": 2}}, "overlaps": false, "size": 16, "union": false}, {}), i).value).name, i64(i), 0);
    }

  } while (Boolean(0));
}

// C/C++ source: source/duke3d/src/gamedef.h:92
export function C_GetFileForOffset__header_3a230d97d314(offset) {
  let ofs = __cxx_global_cell_781692351a9d53402cd867ca().value;
  while ((cRecordObject(cRecordPointer(ofs, {"align": 8, "arrayAlign": 1, "fields": {"fn": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 8, "pointer": true, "size": 8}, "offset": {"native": "Int32Array", "offset": 16, "size": 4}}, "overlaps": false, "size": 24, "union": false}, {})).offset > offset)) {
    (ofs = cRecordObject(cRecordPointer(ofs, {"align": 8, "arrayAlign": 1, "fields": {"fn": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 8, "pointer": true, "size": 8}, "offset": {"native": "Int32Array", "offset": 16, "size": 4}}, "overlaps": false, "size": 24, "union": false}, {})).next);
  }
  return cRecordObject(cRecordPointer(ofs, {"align": 8, "arrayAlign": 1, "fields": {"fn": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 8, "pointer": true, "size": 8}, "offset": {"native": "Int32Array", "offset": 16, "size": 4}}, "overlaps": false, "size": 24, "union": false}, {})).fn;
}

// C/C++ source: source/build/include/fix16.h:42
export function fix16_to_int__header_dca2865dd032(a) {
  return i32(Math.trunc(i32((a + ((a >= 0) ? fix16_half__header_global_24711ee8d9fc79e5 : (-fix16_half__header_global_24711ee8d9fc79e5)))) / fix16_one__header_global_217802013aec91cb));
}

// C/C++ source: source/build/include/fix16.h:46
export function fix16_from_int__header_6f2807549e5a(a) {
  return i32(Math.imul(a, fix16_one__header_global_217802013aec91cb));
}

// C/C++ source: source/duke3d/src/game.h:298
export function Menu_HaveUserMap__header_94b09d1d1fc7() {
  return i32((((i32((cDeref(cPointerOffset(boardfilename, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) != 0) && (__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.m_level_number == 7)) && (__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.m_volume_number == 0)));
}

// C/C++ source: source/duke3d/src/game.h:293
export function G_HaveUserMap__header_36f36d810416() {
  return i32((((i32((cDeref(cPointerOffset(boardfilename, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) != 0) && (__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.level_number == 7)) && (__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.volume_number == 0)));
}

export function clamp__header_0e5be9d2bafd(__cxx_in, min, max) {
  return i32(((__cxx_in <= i32(min)) ? i32(min) : ((__cxx_in >= i32(max)) ? i32(max) : __cxx_in)));
}

export function ARRAY_SIZE__header_f4445ac8eef7(arg0) {
  return u64(63n);
}

export function ARRAY_SIZE__header_ab35039d5e21(arg0) {
  return u64(8n);
}

export function ARRAY_SIZE__header_1fb178e7bece(arg0) {
  return u64(1n);
}

export function ARRAY_SIZE__header_a0e12283bf57(arg0) {
  return u64(176n);
}

export function ARRAY_SIZE__header_d9a02da31d0e(arg0) {
  return u64(30n);
}

export function ARRAY_SIZE__header_5795883076c7(arg0) {
  return u64(31n);
}

export function ARRAY_SIZE__header_3308d4d75a33(arg0) {
  return u64(23n);
}

export function ARRAY_SIZE__header_6ddb53c363b4(arg0) {
  return u64(187n);
}

export function ARRAY_SIZE__header_a86ac7a3f372(arg0) {
  return u64(21n);
}
