// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/duke3d/src/screens.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
import { Alloc__cxx_static_e0036cfb06bcfe42 } from "../../build/src/smmalloc_generic.cpp.mjs";
import { __cxx_global_cell_fffbe90549f36d5aaad66f3d } from "./dnames.cpp.mjs";
import { __cxx_global_cell_1c00885f389728c5c11cb8d1 } from "./dnames.cpp.mjs";
import { ClockTicks } from "./screens.cpp.mjs";
import { __cxx_global_cell_d16777dd8cd77fdf0c735c4c } from "./screens.cpp.mjs";
import { __cxx_global_cell_c7221fd6ffce6a41cc43a6f8 } from "./screens.cpp.mjs";
import { __cxx_global_cell_103ca1df5a9531b359a2ae15 } from "../../audiolib/src/fx_man.cpp.mjs";
import { Free__cxx_static_0dfd3f42f0dc2c05 } from "../../build/src/smmalloc_generic.cpp.mjs";
import { G_GetStringTileASCII } from "./text.cpp.mjs";
import { Gv_GetVarByLabel } from "./gamevars.cpp.mjs";
import { __cxx_global_cell_66791bf155916fdf0696318d } from "./dnames.cpp.mjs";
import { abs } from "../../build/src/engine.cpp.mjs";
import { apScriptEvents } from "./gameexec.cpp.mjs";
import { bakipos } from "./global.cpp.mjs";
import { boardfilename } from "./game.cpp.mjs";
import { curipos } from "./global.cpp.mjs";
import { curpalette } from "../../build/src/palette.cpp.mjs";
import { divtable64 } from "../../build/src/pragmas.cpp.mjs";
import { fix16_half__header_global_d1b95ae64fd6728c } from "./screens.cpp.mjs";
import { fix16_one__header_global_7c933adea594f27c } from "./screens.cpp.mjs";
import { __cxx_global_cell_134f8f7a37f9a3d5a15b9519 } from "./global.cpp.mjs";
import { __cxx_global_cell_a822d0436b33da814b8410a2 } from "./global.cpp.mjs";
import { g_cloudSect } from "./global.cpp.mjs";
import { __cxx_global_cell_13be58e164425bc1433880b5 } from "./global.cpp.mjs";
import { __cxx_global_cell_cd9e3fd19bbbc2e1259f56a8 } from "./global.cpp.mjs";
import { __cxx_global_cell_b9224c19fd76cc2e0a63ab16 } from "./screens.cpp.mjs";
import { __cxx_global_cell_c0e288040dbf9a805036c27d } from "./common.cpp.mjs";
import { __cxx_global_cell_f51bebc92810fbbcedc191bf } from "./global.cpp.mjs";
import { __cxx_global_cell_4c2e99926c93297eef1857b2 } from "./global.cpp.mjs";
import { g_mapInfo } from "./global.cpp.mjs";
import { g_player } from "./global.cpp.mjs";
import { __cxx_global_cell_350f0357d1f4508cfdc7336c } from "./text.cpp.mjs";
import { __cxx_global_cell_c38589ca7df93168d30113b9 } from "./text.cpp.mjs";
import { __cxx_global_cell_f7e268c20b879c2fe3740be6 } from "./gamedef.cpp.mjs";
import { __cxx_global_cell_11016d3c7177543e564ab46c } from "../../build/src/compat.cpp.mjs";
import { handle_memerr } from "../../build/src/compat.cpp.mjs";
import { __cxx_global_cell_f8287b2e627d0e3f51b90c55 } from "../../build/src/pragmas.cpp.mjs";
import { libdivide_s64_do } from "../../../browser-abi/libdivide_source.mjs";
import { libdivide_s64_gen } from "../../../browser-abi/libdivide_provider.mjs";
import { memcpy } from "../../../browser-abi/libc_provider.mjs";
import { __cxx_global_cell_04adffdeab684b9c52206917 } from "../../build/src/mmulti.cpp.mjs";
import { paletteGetClosestColorWithBlacklist } from "../../build/src/colmatch.cpp.mjs";
import { paletteMakeLookupTable } from "../../build/src/palette.cpp.mjs";
import { pow2char__header_global_42c9ca1ec1ac2c93 } from "./screens.cpp.mjs";
import { __cxx_global_cell_84c518e352f66f31d8eaf74c } from "../../build/src/sdlayer.cpp.mjs";
import { __cxx_global_cell_458f422a7bebe88265e9f694 } from "./global.cpp.mjs";
import { __cxx_global_cell_9d5d7fcf3aa35a4809f92551 } from "../../build/src/engine.cpp.mjs";
import { sintable } from "../../build/src/engine.cpp.mjs";
import { sprintf } from "../../../browser-abi/libc_provider.mjs";
import { __cxx_global_cell_4a046e33ecf7aced9bfd0007 } from "../../build/src/engine.cpp.mjs";
import { __cxx_global_cell_88248ca6ca50548115e47549 } from "../../build/src/pragmas.cpp.mjs";
import { tempbuf } from "./global.cpp.mjs";
import { tileInvalidate } from "../../build/src/engine.cpp.mjs";
import { tileLoad } from "../../build/src/tiles.cpp.mjs";
import { tilesiz } from "../../build/src/engine.cpp.mjs";
import { timerGetClockRate } from "../../build/src/timer.cpp.mjs";
import { __cxx_global_cell_37d96f0d18da4d1ab96cf9c5 } from "../../build/src/engine.cpp.mjs";
import { __cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba } from "./global.cpp.mjs";
import { videoFadePalette } from "../../build/src/palette.cpp.mjs";
import { videoSetPalette } from "../../build/src/palette.cpp.mjs";
import { waloff } from "../../build/src/engine.cpp.mjs";
import { __cxx_global_cell_c51fcdf4111f2095a57e764d } from "../../build/src/engine.cpp.mjs";

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
  // The selected GNU ABI lets a strided field loop form its final raw byte
  // address after the last field. Dereference still checks the original
  // array's upper bound and rejects that address.
  const stridedEnd=outside && !p.__cAddressOnly && next===p.upper+p.stridedFieldOffset &&
      change===p.stridedFieldStride;
  if (!Number.isSafeInteger(change) || !Number.isSafeInteger(next) || outside&&!addressOnly&&!stridedEnd)
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
  const sizeLimit=schema.projection && schema.fieldView ? 268435456 : 1048576;
  if (!Number.isSafeInteger(schema.size) || schema.size<1 || schema.size>sizeLimit ||
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
const cRecordArrayByteAddress = (array, count, stride, fieldOffset, fieldSize) => {
  const bytes = array?.[cByteRecordArrayStorage];
  if (!(bytes instanceof Uint8Array) || array.length !== count || bytes.length !== count * stride ||
      !Number.isSafeInteger(fieldOffset) || fieldOffset < 0 || fieldSize < 1 ||
      fieldOffset + fieldSize > stride)
    throw new TypeError('Strided field address requires the complete original byte array');
  const pointer = cPointerOffset(bytes, fieldOffset, 1);
  return {...pointer, stridedFieldOffset:fieldOffset, stridedFieldStride:stride};
};
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
const floorf = a => Math.fround(Math.floor(Math.fround(a)));


// Scalar semantics of a proven original load-float/convert-to-int intrinsic
// pair. This is readable arithmetic, with no CPU/ISA execution machinery.
const cSSEFloat32ToInt32 = value => {
  const number = Math.fround(value);
  if (!Number.isFinite(number)) return -2147483648;
  const lower = Math.floor(number), fraction = number - lower;
  const rounded = fraction < .5 ? lower : fraction > .5 ? lower + 1
    : lower % 2 === 0 ? lower : lower + 1;
  return rounded < -2147483648 || rounded > 2147483647 ? -2147483648 : rounded | 0;
};

const clz64 = value => {let v=BigInt.asUintN(64,BigInt(value));if(v===0n)return 64;let n=0;while((v&(1n<<63n))===0n){v<<=1n;n++;}return n;};
const ctz64 = (value,width) => {let v=BigInt.asUintN(width,BigInt(value));if(v===0n)return width;let n=0;while((v&1n)===0n){v>>=1n;n++;}return n;};
const popcnt = value => {let v=value,n=0;while(v){v&=v-1n;n++;}return n;};

const __builtin_unreachable = () => { throw new Error("C++ undefined behavior: reached __builtin_unreachable"); };
// C/C++ source: source/duke3d/src/screens.cpp:83
export function P_SetGamePalette(player, palid, set) {
  if ((palid >= u32(256))) {
    (palid = u32(0));
  }
  (cRecordObject(cRecordPointer(player, {"align": 1, "arrayAlign": 2, "fields": {"access_incs": {"native": "Uint8Array", "offset": 623, "size": 1}, "access_spritenum": {"native": "Int16Array", "offset": 504, "size": 2}, "access_wallnum": {"native": "Int16Array", "offset": 502, "size": 2}, "actors_killed": {"native": "Uint16Array", "offset": 134, "size": 2}, "actorsqu": {"native": "Int16Array", "offset": 528, "size": 2}, "aim_mode": {"native": "Uint8Array", "offset": 589, "size": 1}, "airleft": {"native": "Int16Array", "offset": 496, "size": 2}, "ammo_amount": {"length": 13, "native": "Int16Array", "offset": 438, "size": 26}, "auto_aim": {"native": "Uint8Array", "offset": 590, "size": 1}, "autostep": {"native": "Int32Array", "offset": 116, "size": 4}, "autostep_sbw": {"native": "Int32Array", "offset": 120, "size": 4}, "bobcounter": {"native": "Int16Array", "offset": 566, "size": 2}, "bobpos": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 48}, "buttonpalette": {"native": "Uint8Array", "offset": 607, "size": 1}, "cheat_phase": {"native": "Int8Array", "offset": 632, "size": 1}, "clipdist": {"native": "Int16Array", "offset": 580, "size": 2}, "crack_time": {"native": "Int16Array", "offset": 564, "size": 2}, "crouch_toggle": {"native": "Int8Array", "offset": 638, "size": 1}, "crouchspeedmodifier": {"native": "Int16Array", "offset": 386, "size": 2}, "crouchzincrement": {"native": "Int16Array", "offset": 384, "size": 2}, "curr_weapon": {"native": "Int8Array", "offset": 635, "size": 1}, "cursectnum": {"native": "Int16Array", "offset": 404, "size": 2}, "customexitsound": {"native": "Int16Array", "offset": 532, "size": 2}, "dead_flag": {"native": "Int16Array", "offset": 572, "size": 2}, "dummyplayersprite": {"native": "Int16Array", "offset": 524, "size": 2}, "extra_extra8": {"native": "Int16Array", "offset": 526, "size": 2}, "falling_counter": {"native": "Uint8Array", "offset": 617, "size": 1}, "filler": {"length": 100, "native": "Int16Array", "offset": 168, "size": 200}, "fist_incs": {"native": "Uint8Array", "offset": 627, "size": 1}, "floorzcutoff": {"native": "Int16Array", "offset": 370, "size": 2}, "floorzoffset": {"native": "Int16Array", "offset": 374, "size": 2}, "floorzrebound": {"native": "Int16Array", "offset": 368, "size": 2}, "footprintcount": {"native": "Uint8Array", "offset": 600, "size": 1}, "footprintpal": {"native": "Uint8Array", "offset": 613, "size": 1}, "footprintshade": {"native": "Uint8Array", "offset": 618, "size": 1}, "frag": {"native": "Uint16Array", "offset": 140, "size": 2}, "frag_ps": {"native": "Uint8Array", "offset": 596, "size": 1}, "fraggedself": {"native": "Uint16Array", "offset": 142, "size": 2}, "fric": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 56}, "fta": {"native": "Int16Array", "offset": 498, "size": 2}, "ftq": {"native": "Int16Array", "offset": 500, "size": 2}, "gm": {"native": "Uint8Array", "offset": 598, "size": 1}, "got_access": {"native": "Int16Array", "offset": 506, "size": 2}, "gotweapon": {"native": "Uint16Array", "offset": 136, "size": 2}, "gravity": {"native": "Int16Array", "offset": 398, "size": 2}, "hard_landing": {"native": "Uint8Array", "offset": 626, "size": 1}, "hbomb_hold_delay": {"native": "Uint8Array", "offset": 595, "size": 1}, "hbomb_on": {"native": "Uint8Array", "offset": 602, "size": 1}, "heat_on": {"native": "Uint8Array", "offset": 614, "size": 1}, "holoduke_on": {"native": "Int16Array", "offset": 574, "size": 2}, "holster_weapon": {"native": "Uint8Array", "offset": 616, "size": 1}, "hurt_delay": {"native": "Uint8Array", "offset": 601, "size": 1}, "i": {"native": "Int16Array", "offset": 516, "size": 2}, "interface_toggle": {"native": "Uint32Array", "offset": 124, "size": 4}, "inv_amount": {"length": 11, "native": "Int16Array", "offset": 464, "size": 22}, "invdisptime": {"native": "Uint8Array", "offset": 615, "size": 1}, "inven_icon": {"native": "Uint8Array", "offset": 606, "size": 1}, "jetpack_on": {"native": "Uint8Array", "offset": 610, "size": 1}, "jetpackzincrement": {"native": "Int16Array", "offset": 396, "size": 2}, "jumping_counter": {"native": "Int16Array", "offset": 494, "size": 2}, "jumping_toggle": {"native": "Uint8Array", "offset": 603, "size": 1}, "kickback_pic": {"native": "Uint8Array", "offset": 597, "size": 1}, "knee_incs": {"native": "Uint8Array", "offset": 622, "size": 1}, "knuckle_incs": {"native": "Uint8Array", "offset": 621, "size": 1}, "last_extra": {"native": "Int16Array", "offset": 408, "size": 2}, "last_full_weapon": {"native": "Uint8Array", "offset": 619, "size": 1}, "last_pissed_time": {"native": "Int16Array", "offset": 534, "size": 2}, "last_quick_kick": {"native": "Uint8Array", "offset": 585, "size": 1}, "last_used_weapon": {"native": "Int8Array", "offset": 637, "size": 1}, "last_weapon": {"native": "Int8Array", "offset": 631, "size": 1}, "loogcnt": {"native": "Int8Array", "offset": 629, "size": 1}, "loogie": {"dims": [6], "offset": 144, "recordArray": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, "size": 24}, "look_ang": {"native": "Int16Array", "offset": 406, "size": 2}, "max_actors_killed": {"native": "Uint16Array", "offset": 132, "size": 2}, "max_ammo_amount": {"length": 13, "native": "Int16Array", "offset": 412, "size": 26}, "max_player_health": {"native": "Int32Array", "offset": 108, "size": 4}, "max_secret_rooms": {"native": "Uint8Array", "offset": 582, "size": 1}, "max_shield_amount": {"native": "Int32Array", "offset": 112, "size": 4}, "maxswimzvel": {"native": "Int16Array", "offset": 394, "size": 2}, "minswimzvel": {"native": "Int16Array", "offset": 392, "size": 2}, "minwaterzdist": {"native": "Int16Array", "offset": 378, "size": 2}, "movement_lock": {"native": "Uint8Array", "offset": 592, "size": 1}, "newowner": {"native": "Int16Array", "offset": 492, "size": 2}, "npos": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 36}, "numloogs": {"native": "Int8Array", "offset": 628, "size": 1}, "olook_ang": {"native": "Int16Array", "offset": 372, "size": 2}, "on_crane": {"native": "Int16Array", "offset": 514, "size": 2}, "on_ground": {"native": "Uint8Array", "offset": 605, "size": 1}, "on_warping_sector": {"native": "Uint8Array", "offset": 599, "size": 1}, "one_eighty_count": {"native": "Int16Array", "offset": 522, "size": 2}, "opos": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 12}, "opyoff": {"native": "Int16Array", "offset": 490, "size": 2}, "oq16ang": {"native": "Int32Array", "offset": 84, "size": 4}, "oq16horiz": {"native": "Int32Array", "offset": 72, "size": 4}, "oq16horizoff": {"native": "Int32Array", "offset": 76, "size": 4}, "orotscrnang": {"native": "Int16Array", "offset": 568, "size": 2}, "over_shoulder_on": {"native": "Uint8Array", "offset": 608, "size": 1}, "padding_": {"length": 1, "native": "Int8Array", "offset": 639, "oneByteTailArray": "clang-flex-arrays-0-or-1/1", "size": 1}, "palette": {"native": "Uint8Array", "offset": 636, "size": 1}, "palookup": {"native": "Uint8Array", "offset": 625, "size": 1}, "pals": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"b": {"native": "Uint8Array", "offset": 2, "size": 1}, "f": {"native": "Uint8Array", "offset": 3, "size": 1}, "g": {"native": "Uint8Array", "offset": 1, "size": 1}, "r": {"native": "Uint8Array", "offset": 0, "size": 1}}, "overlaps": false, "size": 4, "union": false}, "offset": 128}, "parallax_sectnum": {"native": "Int16Array", "offset": 518, "size": 2}, "player_par": {"native": "Int32Array", "offset": 100, "size": 4}, "pos": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}, "pycount": {"native": "Int16Array", "offset": 576, "size": 2}, "pyoff": {"native": "Int16Array", "offset": 488, "size": 2}, "q16ang": {"native": "Int32Array", "offset": 80, "size": 4}, "q16angvel": {"native": "Int32Array", "offset": 88, "size": 4}, "q16horiz": {"native": "Int32Array", "offset": 64, "size": 4}, "q16horizoff": {"native": "Int32Array", "offset": 68, "size": 4}, "quick_kick": {"native": "Uint8Array", "offset": 584, "size": 1}, "random_club_frame": {"native": "Int16Array", "offset": 520, "size": 2}, "rapid_fire_hold": {"native": "Uint8Array", "offset": 604, "size": 1}, "reloading": {"native": "Uint8Array", "offset": 587, "size": 1}, "return_to_center": {"native": "Uint8Array", "offset": 586, "size": 1}, "rotscrnang": {"native": "Int16Array", "offset": 570, "size": 2}, "runspeed": {"native": "Int32Array", "offset": 104, "size": 4}, "sbs": {"native": "Int16Array", "offset": 400, "size": 2}, "scream_voice": {"native": "Int8Array", "offset": 630, "size": 1}, "scuba_on": {"native": "Uint8Array", "offset": 612, "size": 1}, "secret_rooms": {"native": "Uint8Array", "offset": 583, "size": 1}, "show_empty_weapon": {"native": "Uint8Array", "offset": 609, "size": 1}, "shrunkzoffset": {"native": "Int16Array", "offset": 382, "size": 2}, "somethingonplayer": {"native": "Int16Array", "offset": 512, "size": 2}, "sound_pitch": {"native": "Int16Array", "offset": 402, "size": 2}, "spritebridge": {"native": "Uint8Array", "offset": 611, "size": 1}, "spritezoffset": {"native": "Int16Array", "offset": 376, "size": 2}, "subweapon": {"native": "Int16Array", "offset": 410, "size": 2}, "swimspeedmodifier": {"native": "Int16Array", "offset": 388, "size": 2}, "swimzincrement": {"native": "Int16Array", "offset": 390, "size": 2}, "team": {"native": "Uint8Array", "offset": 593, "size": 1}, "timebeforeexit": {"native": "Int16Array", "offset": 530, "size": 2}, "tipincs": {"native": "Uint8Array", "offset": 594, "size": 1}, "toggle_key_flag": {"native": "Uint8Array", "offset": 620, "size": 1}, "transporter_hold": {"native": "Int16Array", "offset": 578, "size": 2}, "truecz": {"native": "Int32Array", "offset": 96, "size": 4}, "truefz": {"native": "Int32Array", "offset": 92, "size": 4}, "vel": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 24}, "visibility": {"native": "Int16Array", "offset": 510, "size": 2}, "wackedbyactor": {"native": "Int16Array", "offset": 486, "size": 2}, "walking_snd_toggle": {"native": "Uint8Array", "offset": 624, "size": 1}, "wantweaponfire": {"native": "Int8Array", "offset": 634, "size": 1}, "waterzoffset": {"native": "Int16Array", "offset": 380, "size": 2}, "weapon_ang": {"native": "Int16Array", "offset": 508, "size": 2}, "weapon_pos": {"native": "Int8Array", "offset": 633, "size": 1}, "weapon_sway": {"native": "Int16Array", "offset": 562, "size": 2}, "weaponswitch": {"native": "Uint8Array", "offset": 591, "size": 1}, "weapreccnt": {"native": "Uint8Array", "offset": 588, "size": 1}, "weaprecs": {"length": 13, "native": "Int16Array", "offset": 536, "size": 26}, "zoom": {"native": "Uint16Array", "offset": 138, "size": 2}}, "overlaps": true, "size": 640, "union": false}, {})).palette = (u32((u32(palid) & 255)) & 255));
  if (cPointerCompare(player, (cPointerElementRef(cRecordPointer(g_player, {"align": 1, "arrayAlign": 1, "fields": {"frags": {"length": 16, "native": "Uint8Array", "offset": 62, "size": 16}, "gotvote": {"native": "Uint8Array", "offset": 93, "size": 1}, "horizAngleAdjust": {"native": "Int32Array", "offset": 32, "size": 4}, "horizRecenter": {"native": "Int32Array", "offset": 28, "size": 4}, "horizSkew": {"native": "Int32Array", "offset": 36, "size": 4}, "input": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"bits": {"native": "Uint32Array", "offset": 0, "size": 4}, "extbits": {"native": "Uint32Array", "offset": 16, "size": 4}, "fvel": {"native": "Int16Array", "offset": 4, "size": 2}, "q16avel": {"native": "Int32Array", "offset": 8, "size": 4}, "q16horz": {"native": "Int32Array", "offset": 12, "size": 4}, "svel": {"native": "Int16Array", "offset": 6, "size": 2}}, "overlaps": false, "size": 20, "union": false}, "offset": 8}, "lastViewUpdate": {"native": "BigUint64Array", "offset": 40, "size": 8}, "netsynctime": {"native": "Int32Array", "offset": 48, "size": 4}, "pcolor": {"native": "Int32Array", "offset": 52, "size": 4}, "ping": {"native": "Int16Array", "offset": 60, "size": 2}, "pingcnt": {"native": "Uint8Array", "offset": 94, "size": 1}, "playerquitflag": {"native": "Uint8Array", "offset": 95, "size": 1}, "ps": {"offset": 0, "pointer": true, "size": 8}, "pteam": {"native": "Int32Array", "offset": 56, "size": 4}, "ready": {"native": "Uint8Array", "offset": 96, "size": 1}, "revision": {"native": "Uint32Array", "offset": 129, "size": 4}, "smoothcamera": {"native": "Uint8Array", "offset": 91, "size": 1}, "user_name": {"length": 32, "native": "Uint8Array", "offset": 97, "size": 32}, "vote": {"native": "Uint8Array", "offset": 92, "size": 1}, "wchoice": {"length": 13, "native": "Uint8Array", "offset": 78, "size": 13}}, "overlaps": false, "size": 133, "union": false}, {}), __cxx_global_cell_458f422a7bebe88265e9f694().value).value).ps, "!=")) {
    return;
  }
  videoSetPalette((u32(i32((__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.brightness >> 2))) & 255), (u32(palid) & 255), (u32(set) & 255));
}

// C/C++ source: source/duke3d/src/screens.cpp:96
export function G_GetCrosshairColor() {
  if (Boolean(i32((__cxx_global_cell_c0e288040dbf9a805036c27d().value & 128)))) {
    return;
  }
  if (Boolean(__cxx_global_cell_c7221fd6ffce6a41cc43a6f8().value.f)) {
    return;
  }
  tileLoad(__cxx_global_cell_1c00885f389728c5c11cb8d1().value);
  if ((!Boolean((cDeref(cPointerOffset(waloff, __cxx_global_cell_1c00885f389728c5c11cb8d1().value, BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array).value)))) {
    return;
  }
  let ptr = cTypedPointer(cSourceAddresses.decode((cDeref(cPointerOffset(waloff, __cxx_global_cell_1c00885f389728c5c11cb8d1().value, BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array).value)), Uint8Array);
  let ii = i32(Math.imul(i32((cPointerElementRef(cRecordPointer(tilesiz, {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, {}), __cxx_global_cell_1c00885f389728c5c11cb8d1().value).value).x), i32((cPointerElementRef(cRecordPointer(tilesiz, {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, {}), __cxx_global_cell_1c00885f389728c5c11cb8d1().value).value).y)));
  let bri = u64(0);
  let j = u64(0);
  let i;
  (ii > 0);
  do {
    let c = u64((cDeref(ptr, Uint8Array).value));
    if ((c != u64(255))) {
      (i = u64(i32((i32((i32((cPointerElementRef(cRecordPointer(curpalette, {"align": 1, "arrayAlign": 1, "fields": {"b": {"native": "Uint8Array", "offset": 2, "size": 1}, "f": {"native": "Uint8Array", "offset": 3, "size": 1}, "g": {"native": "Uint8Array", "offset": 1, "size": 1}, "r": {"native": "Uint8Array", "offset": 0, "size": 1}}, "overlaps": false, "size": 4, "union": false}, {}), c).value).r) + i32((cPointerElementRef(cRecordPointer(curpalette, {"align": 1, "arrayAlign": 1, "fields": {"b": {"native": "Uint8Array", "offset": 2, "size": 1}, "f": {"native": "Uint8Array", "offset": 3, "size": 1}, "g": {"native": "Uint8Array", "offset": 1, "size": 1}, "r": {"native": "Uint8Array", "offset": 0, "size": 1}}, "overlaps": false, "size": 4, "union": false}, {}), c).value).g))) + i32((cPointerElementRef(cRecordPointer(curpalette, {"align": 1, "arrayAlign": 1, "fields": {"b": {"native": "Uint8Array", "offset": 2, "size": 1}, "f": {"native": "Uint8Array", "offset": 3, "size": 1}, "g": {"native": "Uint8Array", "offset": 1, "size": 1}, "r": {"native": "Uint8Array", "offset": 0, "size": 1}}, "overlaps": false, "size": 4, "union": false}, {}), c).value).b)))));
      if ((i > j)) {
        (j = u64(i));
        (bri = u64(c));
      }
    }
    ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_0.value = next; return previous; })(cRef(() => ptr, __cxx_lvalue_1 => { ptr = __cxx_lvalue_1; }));
  } while (Boolean(((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i32((previous - 1)); __cxx_lvalue_2.value = next; return next; })(cRef(() => ii, __cxx_lvalue_3 => { ii = __cxx_lvalue_3; }))));
  memcpy(__cxx_global_cell_d16777dd8cd77fdf0c735c4c().value, cPointerOffset(curpalette, bri, 4), 4);
  memcpy(__cxx_global_cell_c7221fd6ffce6a41cc43a6f8().value, cPointerOffset(curpalette, bri, 4), 4);
  (__cxx_global_cell_c7221fd6ffce6a41cc43a6f8().value.f = (u32((u32(1) & 255)) & 255));
}

// C/C++ source: source/duke3d/src/screens.cpp:133
export function G_SetCrosshairColor(r, g, b) {
  if (Boolean(i32((__cxx_global_cell_c0e288040dbf9a805036c27d().value & 128)))) {
    return;
  }
  if ((__cxx_global_cell_b9224c19fd76cc2e0a63ab16().value == i32((i32((r + i32((g << 8)))) + i32((b << 16)))))) {
    return;
  }
  tileLoad(__cxx_global_cell_1c00885f389728c5c11cb8d1().value);
  if ((!Boolean((cDeref(cPointerOffset(waloff, __cxx_global_cell_1c00885f389728c5c11cb8d1().value, BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array).value)))) {
    return;
  }
  if ((!Boolean(__cxx_global_cell_c7221fd6ffce6a41cc43a6f8().value.f))) {
    G_GetCrosshairColor();
  }
  (__cxx_global_cell_b9224c19fd76cc2e0a63ab16().value = i32((i32((r + i32((g << 8)))) + i32((b << 16)))));
  (__cxx_global_cell_d16777dd8cd77fdf0c735c4c().value.r = (u32((u32(r) & 255)) & 255));
  (__cxx_global_cell_d16777dd8cd77fdf0c735c4c().value.g = (u32((u32(g) & 255)) & 255));
  (__cxx_global_cell_d16777dd8cd77fdf0c735c4c().value.b = (u32((u32(b) & 255)) & 255));
  let ptr = cTypedPointer(cSourceAddresses.decode((cDeref(cPointerOffset(waloff, __cxx_global_cell_1c00885f389728c5c11cb8d1().value, BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array).value)), Uint8Array);
  let ii = i32(Math.imul(i32((cPointerElementRef(cRecordPointer(tilesiz, {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, {}), __cxx_global_cell_1c00885f389728c5c11cb8d1().value).value).x), i32((cPointerElementRef(cRecordPointer(tilesiz, {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, {}), __cxx_global_cell_1c00885f389728c5c11cb8d1().value).value).y)));
  (ii > 0);
  let i = i32(((videoGetRenderMode__header_0d776a793682() == i32(0)) ? paletteGetClosestColor__header_4b1e03847e64(i32(__cxx_global_cell_d16777dd8cd77fdf0c735c4c().value.r), i32(__cxx_global_cell_d16777dd8cd77fdf0c735c4c().value.g), i32(__cxx_global_cell_d16777dd8cd77fdf0c735c4c().value.b)) : paletteGetClosestColor__header_4b1e03847e64(255, 255, 255)));
  do {
    if ((i32((cDeref(ptr, Uint8Array).value)) != 255)) {
      ((cDeref(ptr, Uint8Array).value) = (u32((u32(i) & 255)) & 255));
    }
    ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_0.value = next; return previous; })(cRef(() => ptr, __cxx_lvalue_1 => { ptr = __cxx_lvalue_1; }));
  } while (Boolean(((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i32((previous - 1)); __cxx_lvalue_2.value = next; return next; })(cRef(() => ii, __cxx_lvalue_3 => { ii = __cxx_lvalue_3; }))));
  paletteMakeLookupTable(i32((i32((256 - 4)) - 1)), null, (u32(__cxx_global_cell_d16777dd8cd77fdf0c735c4c().value.r) & 255), (u32(__cxx_global_cell_d16777dd8cd77fdf0c735c4c().value.g) & 255), (u32(__cxx_global_cell_d16777dd8cd77fdf0c735c4c().value.b) & 255), (u32(1) & 255));
  tileInvalidate(__cxx_global_cell_1c00885f389728c5c11cb8d1().value, (-1), (-1));
}

// C/C++ source: source/duke3d/src/screens.cpp:246
export function palaccum_add(pa, pal, f) {
  const __cxx_lvalue_0 = cRef(() => f, __cxx_lvalue_5 => { f = i32(__cxx_lvalue_5); });
  (f = i32(clamp__header_1ed923c91a30(f, 0, 63)));
  if ((f == 0)) {
    return;
  }
  (cRecordObject(cRecordPointer(pa, {"align": 4, "arrayAlign": 1, "fields": {"b": {"native": "Int32Array", "offset": 8, "size": 4}, "g": {"native": "Int32Array", "offset": 4, "size": 4}, "maxf": {"native": "Int32Array", "offset": 12, "size": 4}, "r": {"native": "Int32Array", "offset": 0, "size": 4}, "sumf": {"native": "Int32Array", "offset": 16, "size": 4}}, "overlaps": false, "size": 20, "union": false}, {})).maxf = i32((max__template_b1cfaf2244c73238(cObjectFieldRef(cRecordObject(cRecordPointer(pa, {"align": 4, "arrayAlign": 1, "fields": {"b": {"native": "Int32Array", "offset": 8, "size": 4}, "g": {"native": "Int32Array", "offset": 4, "size": 4}, "maxf": {"native": "Int32Array", "offset": 12, "size": 4}, "r": {"native": "Int32Array", "offset": 0, "size": 4}, "sumf": {"native": "Int32Array", "offset": 16, "size": 4}}, "overlaps": false, "size": 20, "union": false}, {})), "maxf"), __cxx_lvalue_0)).value));
  ((__cxx_lvalue_1) => (__cxx_lvalue_1.value = i32((Number(__cxx_lvalue_1.value) + Number(f)))))(cObjectFieldRef(cRecordObject(cRecordPointer(pa, {"align": 4, "arrayAlign": 1, "fields": {"b": {"native": "Int32Array", "offset": 8, "size": 4}, "g": {"native": "Int32Array", "offset": 4, "size": 4}, "maxf": {"native": "Int32Array", "offset": 12, "size": 4}, "r": {"native": "Int32Array", "offset": 0, "size": 4}, "sumf": {"native": "Int32Array", "offset": 16, "size": 4}}, "overlaps": false, "size": 20, "union": false}, {})), "sumf"));
  ((__cxx_lvalue_2) => (__cxx_lvalue_2.value = i32((Number(__cxx_lvalue_2.value) + Number(i32(Math.imul(f, i32(clamp__header_36ccfd714bcb(cRecordObject(cRecordPointer(pal, {"align": 1, "arrayAlign": 1, "fields": {"b": {"native": "Uint8Array", "offset": 2, "size": 1}, "f": {"native": "Uint8Array", "offset": 3, "size": 1}, "g": {"native": "Uint8Array", "offset": 1, "size": 1}, "r": {"native": "Uint8Array", "offset": 0, "size": 1}}, "overlaps": false, "size": 4, "union": false}, {})).r, 0, 63)))))))))(cObjectFieldRef(cRecordObject(cRecordPointer(pa, {"align": 4, "arrayAlign": 1, "fields": {"b": {"native": "Int32Array", "offset": 8, "size": 4}, "g": {"native": "Int32Array", "offset": 4, "size": 4}, "maxf": {"native": "Int32Array", "offset": 12, "size": 4}, "r": {"native": "Int32Array", "offset": 0, "size": 4}, "sumf": {"native": "Int32Array", "offset": 16, "size": 4}}, "overlaps": false, "size": 20, "union": false}, {})), "r"));
  ((__cxx_lvalue_3) => (__cxx_lvalue_3.value = i32((Number(__cxx_lvalue_3.value) + Number(i32(Math.imul(f, i32(clamp__header_36ccfd714bcb(cRecordObject(cRecordPointer(pal, {"align": 1, "arrayAlign": 1, "fields": {"b": {"native": "Uint8Array", "offset": 2, "size": 1}, "f": {"native": "Uint8Array", "offset": 3, "size": 1}, "g": {"native": "Uint8Array", "offset": 1, "size": 1}, "r": {"native": "Uint8Array", "offset": 0, "size": 1}}, "overlaps": false, "size": 4, "union": false}, {})).g, 0, 63)))))))))(cObjectFieldRef(cRecordObject(cRecordPointer(pa, {"align": 4, "arrayAlign": 1, "fields": {"b": {"native": "Int32Array", "offset": 8, "size": 4}, "g": {"native": "Int32Array", "offset": 4, "size": 4}, "maxf": {"native": "Int32Array", "offset": 12, "size": 4}, "r": {"native": "Int32Array", "offset": 0, "size": 4}, "sumf": {"native": "Int32Array", "offset": 16, "size": 4}}, "overlaps": false, "size": 20, "union": false}, {})), "g"));
  ((__cxx_lvalue_4) => (__cxx_lvalue_4.value = i32((Number(__cxx_lvalue_4.value) + Number(i32(Math.imul(f, i32(clamp__header_36ccfd714bcb(cRecordObject(cRecordPointer(pal, {"align": 1, "arrayAlign": 1, "fields": {"b": {"native": "Uint8Array", "offset": 2, "size": 1}, "f": {"native": "Uint8Array", "offset": 3, "size": 1}, "g": {"native": "Uint8Array", "offset": 1, "size": 1}, "r": {"native": "Uint8Array", "offset": 0, "size": 1}}, "overlaps": false, "size": 4, "union": false}, {})).b, 0, 63)))))))))(cObjectFieldRef(cRecordObject(cRecordPointer(pa, {"align": 4, "arrayAlign": 1, "fields": {"b": {"native": "Int32Array", "offset": 8, "size": 4}, "g": {"native": "Int32Array", "offset": 4, "size": 4}, "maxf": {"native": "Int32Array", "offset": 12, "size": 4}, "r": {"native": "Int32Array", "offset": 0, "size": 4}, "sumf": {"native": "Int32Array", "offset": 16, "size": 4}}, "overlaps": false, "size": 20, "union": false}, {})), "b"));
}

// C/C++ source: source/duke3d/src/screens.cpp:260
export function G_FadePalaccum(pa) {
  videoFadePalette((u32(i32((__cxx_global_cell_88248ca6ca50548115e47549().value(cRecordObject(cRecordPointer(pa, {"align": 4, "arrayAlign": 1, "fields": {"b": {"native": "Int32Array", "offset": 8, "size": 4}, "g": {"native": "Int32Array", "offset": 4, "size": 4}, "maxf": {"native": "Int32Array", "offset": 12, "size": 4}, "r": {"native": "Int32Array", "offset": 0, "size": 4}, "sumf": {"native": "Int32Array", "offset": 16, "size": 4}}, "overlaps": false, "size": 20, "union": false}, {})).r, cRecordObject(cRecordPointer(pa, {"align": 4, "arrayAlign": 1, "fields": {"b": {"native": "Int32Array", "offset": 8, "size": 4}, "g": {"native": "Int32Array", "offset": 4, "size": 4}, "maxf": {"native": "Int32Array", "offset": 12, "size": 4}, "r": {"native": "Int32Array", "offset": 0, "size": 4}, "sumf": {"native": "Int32Array", "offset": 16, "size": 4}}, "overlaps": false, "size": 20, "union": false}, {})).sumf) << 2))) & 255), (u32(i32((__cxx_global_cell_88248ca6ca50548115e47549().value(cRecordObject(cRecordPointer(pa, {"align": 4, "arrayAlign": 1, "fields": {"b": {"native": "Int32Array", "offset": 8, "size": 4}, "g": {"native": "Int32Array", "offset": 4, "size": 4}, "maxf": {"native": "Int32Array", "offset": 12, "size": 4}, "r": {"native": "Int32Array", "offset": 0, "size": 4}, "sumf": {"native": "Int32Array", "offset": 16, "size": 4}}, "overlaps": false, "size": 20, "union": false}, {})).g, cRecordObject(cRecordPointer(pa, {"align": 4, "arrayAlign": 1, "fields": {"b": {"native": "Int32Array", "offset": 8, "size": 4}, "g": {"native": "Int32Array", "offset": 4, "size": 4}, "maxf": {"native": "Int32Array", "offset": 12, "size": 4}, "r": {"native": "Int32Array", "offset": 0, "size": 4}, "sumf": {"native": "Int32Array", "offset": 16, "size": 4}}, "overlaps": false, "size": 20, "union": false}, {})).sumf) << 2))) & 255), (u32(i32((__cxx_global_cell_88248ca6ca50548115e47549().value(cRecordObject(cRecordPointer(pa, {"align": 4, "arrayAlign": 1, "fields": {"b": {"native": "Int32Array", "offset": 8, "size": 4}, "g": {"native": "Int32Array", "offset": 4, "size": 4}, "maxf": {"native": "Int32Array", "offset": 12, "size": 4}, "r": {"native": "Int32Array", "offset": 0, "size": 4}, "sumf": {"native": "Int32Array", "offset": 16, "size": 4}}, "overlaps": false, "size": 20, "union": false}, {})).b, cRecordObject(cRecordPointer(pa, {"align": 4, "arrayAlign": 1, "fields": {"b": {"native": "Int32Array", "offset": 8, "size": 4}, "g": {"native": "Int32Array", "offset": 4, "size": 4}, "maxf": {"native": "Int32Array", "offset": 12, "size": 4}, "r": {"native": "Int32Array", "offset": 0, "size": 4}, "sumf": {"native": "Int32Array", "offset": 16, "size": 4}}, "overlaps": false, "size": 20, "union": false}, {})).sumf) << 2))) & 255), (u32(i32((cRecordObject(cRecordPointer(pa, {"align": 4, "arrayAlign": 1, "fields": {"b": {"native": "Int32Array", "offset": 8, "size": 4}, "g": {"native": "Int32Array", "offset": 4, "size": 4}, "maxf": {"native": "Int32Array", "offset": 12, "size": 4}, "r": {"native": "Int32Array", "offset": 0, "size": 4}, "sumf": {"native": "Int32Array", "offset": 16, "size": 4}}, "overlaps": false, "size": 20, "union": false}, {})).maxf << 2))) & 255));
}

// C/C++ source: source/duke3d/src/screens.cpp:268
export function gtextsc(sc) {
  return i32(scale__header_b5fee509aa49(sc, __cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.textscale, 400));
}

// C/C++ source: source/duke3d/src/screens.cpp:300
export function G_MoveClouds() {
  let i;
  if ((__cxx_operator_2bd212496e3ec90a(__cxx_global_cell_37d96f0d18da4d1ab96cf9c5().value, __cxx_global_cell_134f8f7a37f9a3d5a15b9519().value) && __cxx_operator_6d2a22ee5048dd1a(__cxx_global_cell_37d96f0d18da4d1ab96cf9c5().value, __cxx_operator_761c63d1e16e183f(cCopyTrivialClass(__cxx_global_cell_134f8f7a37f9a3d5a15b9519().value, ClockTicks(), ["wholeTicks", "ticksS32"]), (ClockTicks()).__cxx_construct_8716ed38f1dfa06d(7))))) {
    return;
  }
  __cxx_global_cell_134f8f7a37f9a3d5a15b9519().value.__cxx_operator_d644da4c0f0f209b(__cxx_operator_e3598b0077b4da36(cCopyTrivialClass(__cxx_global_cell_37d96f0d18da4d1ab96cf9c5().value, ClockTicks(), ["wholeTicks", "ticksS32"]), (ClockTicks()).__cxx_construct_8716ed38f1dfa06d(6)));
  (__cxx_global_cell_13be58e164425bc1433880b5().value = ((u32((__cxx_global_cell_13be58e164425bc1433880b5().value + i32((i32((cDeref(cPointerOffset(sintable, i32((i32((fix16_to_int__header_896d36d84088(cRecordObject(cRecordPointer((cPointerElementRef(cRecordPointer(g_player, {"align": 1, "arrayAlign": 1, "fields": {"frags": {"length": 16, "native": "Uint8Array", "offset": 62, "size": 16}, "gotvote": {"native": "Uint8Array", "offset": 93, "size": 1}, "horizAngleAdjust": {"native": "Int32Array", "offset": 32, "size": 4}, "horizRecenter": {"native": "Int32Array", "offset": 28, "size": 4}, "horizSkew": {"native": "Int32Array", "offset": 36, "size": 4}, "input": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"bits": {"native": "Uint32Array", "offset": 0, "size": 4}, "extbits": {"native": "Uint32Array", "offset": 16, "size": 4}, "fvel": {"native": "Int16Array", "offset": 4, "size": 2}, "q16avel": {"native": "Int32Array", "offset": 8, "size": 4}, "q16horz": {"native": "Int32Array", "offset": 12, "size": 4}, "svel": {"native": "Int16Array", "offset": 6, "size": 2}}, "overlaps": false, "size": 20, "union": false}, "offset": 8}, "lastViewUpdate": {"native": "BigUint64Array", "offset": 40, "size": 8}, "netsynctime": {"native": "Int32Array", "offset": 48, "size": 4}, "pcolor": {"native": "Int32Array", "offset": 52, "size": 4}, "ping": {"native": "Int16Array", "offset": 60, "size": 2}, "pingcnt": {"native": "Uint8Array", "offset": 94, "size": 1}, "playerquitflag": {"native": "Uint8Array", "offset": 95, "size": 1}, "ps": {"offset": 0, "pointer": true, "size": 8}, "pteam": {"native": "Int32Array", "offset": 56, "size": 4}, "ready": {"native": "Uint8Array", "offset": 96, "size": 1}, "revision": {"native": "Uint32Array", "offset": 129, "size": 4}, "smoothcamera": {"native": "Uint8Array", "offset": 91, "size": 1}, "user_name": {"length": 32, "native": "Uint8Array", "offset": 97, "size": 32}, "vote": {"native": "Uint8Array", "offset": 92, "size": 1}, "wchoice": {"length": 13, "native": "Uint8Array", "offset": 78, "size": 13}}, "overlaps": false, "size": 133, "union": false}, {}), __cxx_global_cell_458f422a7bebe88265e9f694().value).value).ps, {"align": 1, "arrayAlign": 2, "fields": {"access_incs": {"native": "Uint8Array", "offset": 623, "size": 1}, "access_spritenum": {"native": "Int16Array", "offset": 504, "size": 2}, "access_wallnum": {"native": "Int16Array", "offset": 502, "size": 2}, "actors_killed": {"native": "Uint16Array", "offset": 134, "size": 2}, "actorsqu": {"native": "Int16Array", "offset": 528, "size": 2}, "aim_mode": {"native": "Uint8Array", "offset": 589, "size": 1}, "airleft": {"native": "Int16Array", "offset": 496, "size": 2}, "ammo_amount": {"length": 13, "native": "Int16Array", "offset": 438, "size": 26}, "auto_aim": {"native": "Uint8Array", "offset": 590, "size": 1}, "autostep": {"native": "Int32Array", "offset": 116, "size": 4}, "autostep_sbw": {"native": "Int32Array", "offset": 120, "size": 4}, "bobcounter": {"native": "Int16Array", "offset": 566, "size": 2}, "bobpos": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 48}, "buttonpalette": {"native": "Uint8Array", "offset": 607, "size": 1}, "cheat_phase": {"native": "Int8Array", "offset": 632, "size": 1}, "clipdist": {"native": "Int16Array", "offset": 580, "size": 2}, "crack_time": {"native": "Int16Array", "offset": 564, "size": 2}, "crouch_toggle": {"native": "Int8Array", "offset": 638, "size": 1}, "crouchspeedmodifier": {"native": "Int16Array", "offset": 386, "size": 2}, "crouchzincrement": {"native": "Int16Array", "offset": 384, "size": 2}, "curr_weapon": {"native": "Int8Array", "offset": 635, "size": 1}, "cursectnum": {"native": "Int16Array", "offset": 404, "size": 2}, "customexitsound": {"native": "Int16Array", "offset": 532, "size": 2}, "dead_flag": {"native": "Int16Array", "offset": 572, "size": 2}, "dummyplayersprite": {"native": "Int16Array", "offset": 524, "size": 2}, "extra_extra8": {"native": "Int16Array", "offset": 526, "size": 2}, "falling_counter": {"native": "Uint8Array", "offset": 617, "size": 1}, "filler": {"length": 100, "native": "Int16Array", "offset": 168, "size": 200}, "fist_incs": {"native": "Uint8Array", "offset": 627, "size": 1}, "floorzcutoff": {"native": "Int16Array", "offset": 370, "size": 2}, "floorzoffset": {"native": "Int16Array", "offset": 374, "size": 2}, "floorzrebound": {"native": "Int16Array", "offset": 368, "size": 2}, "footprintcount": {"native": "Uint8Array", "offset": 600, "size": 1}, "footprintpal": {"native": "Uint8Array", "offset": 613, "size": 1}, "footprintshade": {"native": "Uint8Array", "offset": 618, "size": 1}, "frag": {"native": "Uint16Array", "offset": 140, "size": 2}, "frag_ps": {"native": "Uint8Array", "offset": 596, "size": 1}, "fraggedself": {"native": "Uint16Array", "offset": 142, "size": 2}, "fric": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 56}, "fta": {"native": "Int16Array", "offset": 498, "size": 2}, "ftq": {"native": "Int16Array", "offset": 500, "size": 2}, "gm": {"native": "Uint8Array", "offset": 598, "size": 1}, "got_access": {"native": "Int16Array", "offset": 506, "size": 2}, "gotweapon": {"native": "Uint16Array", "offset": 136, "size": 2}, "gravity": {"native": "Int16Array", "offset": 398, "size": 2}, "hard_landing": {"native": "Uint8Array", "offset": 626, "size": 1}, "hbomb_hold_delay": {"native": "Uint8Array", "offset": 595, "size": 1}, "hbomb_on": {"native": "Uint8Array", "offset": 602, "size": 1}, "heat_on": {"native": "Uint8Array", "offset": 614, "size": 1}, "holoduke_on": {"native": "Int16Array", "offset": 574, "size": 2}, "holster_weapon": {"native": "Uint8Array", "offset": 616, "size": 1}, "hurt_delay": {"native": "Uint8Array", "offset": 601, "size": 1}, "i": {"native": "Int16Array", "offset": 516, "size": 2}, "interface_toggle": {"native": "Uint32Array", "offset": 124, "size": 4}, "inv_amount": {"length": 11, "native": "Int16Array", "offset": 464, "size": 22}, "invdisptime": {"native": "Uint8Array", "offset": 615, "size": 1}, "inven_icon": {"native": "Uint8Array", "offset": 606, "size": 1}, "jetpack_on": {"native": "Uint8Array", "offset": 610, "size": 1}, "jetpackzincrement": {"native": "Int16Array", "offset": 396, "size": 2}, "jumping_counter": {"native": "Int16Array", "offset": 494, "size": 2}, "jumping_toggle": {"native": "Uint8Array", "offset": 603, "size": 1}, "kickback_pic": {"native": "Uint8Array", "offset": 597, "size": 1}, "knee_incs": {"native": "Uint8Array", "offset": 622, "size": 1}, "knuckle_incs": {"native": "Uint8Array", "offset": 621, "size": 1}, "last_extra": {"native": "Int16Array", "offset": 408, "size": 2}, "last_full_weapon": {"native": "Uint8Array", "offset": 619, "size": 1}, "last_pissed_time": {"native": "Int16Array", "offset": 534, "size": 2}, "last_quick_kick": {"native": "Uint8Array", "offset": 585, "size": 1}, "last_used_weapon": {"native": "Int8Array", "offset": 637, "size": 1}, "last_weapon": {"native": "Int8Array", "offset": 631, "size": 1}, "loogcnt": {"native": "Int8Array", "offset": 629, "size": 1}, "loogie": {"dims": [6], "offset": 144, "recordArray": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, "size": 24}, "look_ang": {"native": "Int16Array", "offset": 406, "size": 2}, "max_actors_killed": {"native": "Uint16Array", "offset": 132, "size": 2}, "max_ammo_amount": {"length": 13, "native": "Int16Array", "offset": 412, "size": 26}, "max_player_health": {"native": "Int32Array", "offset": 108, "size": 4}, "max_secret_rooms": {"native": "Uint8Array", "offset": 582, "size": 1}, "max_shield_amount": {"native": "Int32Array", "offset": 112, "size": 4}, "maxswimzvel": {"native": "Int16Array", "offset": 394, "size": 2}, "minswimzvel": {"native": "Int16Array", "offset": 392, "size": 2}, "minwaterzdist": {"native": "Int16Array", "offset": 378, "size": 2}, "movement_lock": {"native": "Uint8Array", "offset": 592, "size": 1}, "newowner": {"native": "Int16Array", "offset": 492, "size": 2}, "npos": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 36}, "numloogs": {"native": "Int8Array", "offset": 628, "size": 1}, "olook_ang": {"native": "Int16Array", "offset": 372, "size": 2}, "on_crane": {"native": "Int16Array", "offset": 514, "size": 2}, "on_ground": {"native": "Uint8Array", "offset": 605, "size": 1}, "on_warping_sector": {"native": "Uint8Array", "offset": 599, "size": 1}, "one_eighty_count": {"native": "Int16Array", "offset": 522, "size": 2}, "opos": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 12}, "opyoff": {"native": "Int16Array", "offset": 490, "size": 2}, "oq16ang": {"native": "Int32Array", "offset": 84, "size": 4}, "oq16horiz": {"native": "Int32Array", "offset": 72, "size": 4}, "oq16horizoff": {"native": "Int32Array", "offset": 76, "size": 4}, "orotscrnang": {"native": "Int16Array", "offset": 568, "size": 2}, "over_shoulder_on": {"native": "Uint8Array", "offset": 608, "size": 1}, "padding_": {"length": 1, "native": "Int8Array", "offset": 639, "oneByteTailArray": "clang-flex-arrays-0-or-1/1", "size": 1}, "palette": {"native": "Uint8Array", "offset": 636, "size": 1}, "palookup": {"native": "Uint8Array", "offset": 625, "size": 1}, "pals": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"b": {"native": "Uint8Array", "offset": 2, "size": 1}, "f": {"native": "Uint8Array", "offset": 3, "size": 1}, "g": {"native": "Uint8Array", "offset": 1, "size": 1}, "r": {"native": "Uint8Array", "offset": 0, "size": 1}}, "overlaps": false, "size": 4, "union": false}, "offset": 128}, "parallax_sectnum": {"native": "Int16Array", "offset": 518, "size": 2}, "player_par": {"native": "Int32Array", "offset": 100, "size": 4}, "pos": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}, "pycount": {"native": "Int16Array", "offset": 576, "size": 2}, "pyoff": {"native": "Int16Array", "offset": 488, "size": 2}, "q16ang": {"native": "Int32Array", "offset": 80, "size": 4}, "q16angvel": {"native": "Int32Array", "offset": 88, "size": 4}, "q16horiz": {"native": "Int32Array", "offset": 64, "size": 4}, "q16horizoff": {"native": "Int32Array", "offset": 68, "size": 4}, "quick_kick": {"native": "Uint8Array", "offset": 584, "size": 1}, "random_club_frame": {"native": "Int16Array", "offset": 520, "size": 2}, "rapid_fire_hold": {"native": "Uint8Array", "offset": 604, "size": 1}, "reloading": {"native": "Uint8Array", "offset": 587, "size": 1}, "return_to_center": {"native": "Uint8Array", "offset": 586, "size": 1}, "rotscrnang": {"native": "Int16Array", "offset": 570, "size": 2}, "runspeed": {"native": "Int32Array", "offset": 104, "size": 4}, "sbs": {"native": "Int16Array", "offset": 400, "size": 2}, "scream_voice": {"native": "Int8Array", "offset": 630, "size": 1}, "scuba_on": {"native": "Uint8Array", "offset": 612, "size": 1}, "secret_rooms": {"native": "Uint8Array", "offset": 583, "size": 1}, "show_empty_weapon": {"native": "Uint8Array", "offset": 609, "size": 1}, "shrunkzoffset": {"native": "Int16Array", "offset": 382, "size": 2}, "somethingonplayer": {"native": "Int16Array", "offset": 512, "size": 2}, "sound_pitch": {"native": "Int16Array", "offset": 402, "size": 2}, "spritebridge": {"native": "Uint8Array", "offset": 611, "size": 1}, "spritezoffset": {"native": "Int16Array", "offset": 376, "size": 2}, "subweapon": {"native": "Int16Array", "offset": 410, "size": 2}, "swimspeedmodifier": {"native": "Int16Array", "offset": 388, "size": 2}, "swimzincrement": {"native": "Int16Array", "offset": 390, "size": 2}, "team": {"native": "Uint8Array", "offset": 593, "size": 1}, "timebeforeexit": {"native": "Int16Array", "offset": 530, "size": 2}, "tipincs": {"native": "Uint8Array", "offset": 594, "size": 1}, "toggle_key_flag": {"native": "Uint8Array", "offset": 620, "size": 1}, "transporter_hold": {"native": "Int16Array", "offset": 578, "size": 2}, "truecz": {"native": "Int32Array", "offset": 96, "size": 4}, "truefz": {"native": "Int32Array", "offset": 92, "size": 4}, "vel": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 24}, "visibility": {"native": "Int16Array", "offset": 510, "size": 2}, "wackedbyactor": {"native": "Int16Array", "offset": 486, "size": 2}, "walking_snd_toggle": {"native": "Uint8Array", "offset": 624, "size": 1}, "wantweaponfire": {"native": "Int8Array", "offset": 634, "size": 1}, "waterzoffset": {"native": "Int16Array", "offset": 380, "size": 2}, "weapon_ang": {"native": "Int16Array", "offset": 508, "size": 2}, "weapon_pos": {"native": "Int8Array", "offset": 633, "size": 1}, "weapon_sway": {"native": "Int16Array", "offset": 562, "size": 2}, "weaponswitch": {"native": "Uint8Array", "offset": 591, "size": 1}, "weapreccnt": {"native": "Uint8Array", "offset": 588, "size": 1}, "weaprecs": {"length": 13, "native": "Int16Array", "offset": 536, "size": 26}, "zoom": {"native": "Uint16Array", "offset": 138, "size": 2}}, "overlaps": true, "size": 640, "union": false}, {})).q16ang) + 512)) & 2047)), Int16Array.BYTES_PER_ELEMENT), Int16Array).value)) >> 9)))) << 16) >> 16));
  (__cxx_global_cell_cd9e3fd19bbbc2e1259f56a8().value = ((u32((__cxx_global_cell_cd9e3fd19bbbc2e1259f56a8().value + i32((i32((cDeref(cPointerOffset(sintable, i32((fix16_to_int__header_896d36d84088(cRecordObject(cRecordPointer((cPointerElementRef(cRecordPointer(g_player, {"align": 1, "arrayAlign": 1, "fields": {"frags": {"length": 16, "native": "Uint8Array", "offset": 62, "size": 16}, "gotvote": {"native": "Uint8Array", "offset": 93, "size": 1}, "horizAngleAdjust": {"native": "Int32Array", "offset": 32, "size": 4}, "horizRecenter": {"native": "Int32Array", "offset": 28, "size": 4}, "horizSkew": {"native": "Int32Array", "offset": 36, "size": 4}, "input": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"bits": {"native": "Uint32Array", "offset": 0, "size": 4}, "extbits": {"native": "Uint32Array", "offset": 16, "size": 4}, "fvel": {"native": "Int16Array", "offset": 4, "size": 2}, "q16avel": {"native": "Int32Array", "offset": 8, "size": 4}, "q16horz": {"native": "Int32Array", "offset": 12, "size": 4}, "svel": {"native": "Int16Array", "offset": 6, "size": 2}}, "overlaps": false, "size": 20, "union": false}, "offset": 8}, "lastViewUpdate": {"native": "BigUint64Array", "offset": 40, "size": 8}, "netsynctime": {"native": "Int32Array", "offset": 48, "size": 4}, "pcolor": {"native": "Int32Array", "offset": 52, "size": 4}, "ping": {"native": "Int16Array", "offset": 60, "size": 2}, "pingcnt": {"native": "Uint8Array", "offset": 94, "size": 1}, "playerquitflag": {"native": "Uint8Array", "offset": 95, "size": 1}, "ps": {"offset": 0, "pointer": true, "size": 8}, "pteam": {"native": "Int32Array", "offset": 56, "size": 4}, "ready": {"native": "Uint8Array", "offset": 96, "size": 1}, "revision": {"native": "Uint32Array", "offset": 129, "size": 4}, "smoothcamera": {"native": "Uint8Array", "offset": 91, "size": 1}, "user_name": {"length": 32, "native": "Uint8Array", "offset": 97, "size": 32}, "vote": {"native": "Uint8Array", "offset": 92, "size": 1}, "wchoice": {"length": 13, "native": "Uint8Array", "offset": 78, "size": 13}}, "overlaps": false, "size": 133, "union": false}, {}), __cxx_global_cell_458f422a7bebe88265e9f694().value).value).ps, {"align": 1, "arrayAlign": 2, "fields": {"access_incs": {"native": "Uint8Array", "offset": 623, "size": 1}, "access_spritenum": {"native": "Int16Array", "offset": 504, "size": 2}, "access_wallnum": {"native": "Int16Array", "offset": 502, "size": 2}, "actors_killed": {"native": "Uint16Array", "offset": 134, "size": 2}, "actorsqu": {"native": "Int16Array", "offset": 528, "size": 2}, "aim_mode": {"native": "Uint8Array", "offset": 589, "size": 1}, "airleft": {"native": "Int16Array", "offset": 496, "size": 2}, "ammo_amount": {"length": 13, "native": "Int16Array", "offset": 438, "size": 26}, "auto_aim": {"native": "Uint8Array", "offset": 590, "size": 1}, "autostep": {"native": "Int32Array", "offset": 116, "size": 4}, "autostep_sbw": {"native": "Int32Array", "offset": 120, "size": 4}, "bobcounter": {"native": "Int16Array", "offset": 566, "size": 2}, "bobpos": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 48}, "buttonpalette": {"native": "Uint8Array", "offset": 607, "size": 1}, "cheat_phase": {"native": "Int8Array", "offset": 632, "size": 1}, "clipdist": {"native": "Int16Array", "offset": 580, "size": 2}, "crack_time": {"native": "Int16Array", "offset": 564, "size": 2}, "crouch_toggle": {"native": "Int8Array", "offset": 638, "size": 1}, "crouchspeedmodifier": {"native": "Int16Array", "offset": 386, "size": 2}, "crouchzincrement": {"native": "Int16Array", "offset": 384, "size": 2}, "curr_weapon": {"native": "Int8Array", "offset": 635, "size": 1}, "cursectnum": {"native": "Int16Array", "offset": 404, "size": 2}, "customexitsound": {"native": "Int16Array", "offset": 532, "size": 2}, "dead_flag": {"native": "Int16Array", "offset": 572, "size": 2}, "dummyplayersprite": {"native": "Int16Array", "offset": 524, "size": 2}, "extra_extra8": {"native": "Int16Array", "offset": 526, "size": 2}, "falling_counter": {"native": "Uint8Array", "offset": 617, "size": 1}, "filler": {"length": 100, "native": "Int16Array", "offset": 168, "size": 200}, "fist_incs": {"native": "Uint8Array", "offset": 627, "size": 1}, "floorzcutoff": {"native": "Int16Array", "offset": 370, "size": 2}, "floorzoffset": {"native": "Int16Array", "offset": 374, "size": 2}, "floorzrebound": {"native": "Int16Array", "offset": 368, "size": 2}, "footprintcount": {"native": "Uint8Array", "offset": 600, "size": 1}, "footprintpal": {"native": "Uint8Array", "offset": 613, "size": 1}, "footprintshade": {"native": "Uint8Array", "offset": 618, "size": 1}, "frag": {"native": "Uint16Array", "offset": 140, "size": 2}, "frag_ps": {"native": "Uint8Array", "offset": 596, "size": 1}, "fraggedself": {"native": "Uint16Array", "offset": 142, "size": 2}, "fric": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 56}, "fta": {"native": "Int16Array", "offset": 498, "size": 2}, "ftq": {"native": "Int16Array", "offset": 500, "size": 2}, "gm": {"native": "Uint8Array", "offset": 598, "size": 1}, "got_access": {"native": "Int16Array", "offset": 506, "size": 2}, "gotweapon": {"native": "Uint16Array", "offset": 136, "size": 2}, "gravity": {"native": "Int16Array", "offset": 398, "size": 2}, "hard_landing": {"native": "Uint8Array", "offset": 626, "size": 1}, "hbomb_hold_delay": {"native": "Uint8Array", "offset": 595, "size": 1}, "hbomb_on": {"native": "Uint8Array", "offset": 602, "size": 1}, "heat_on": {"native": "Uint8Array", "offset": 614, "size": 1}, "holoduke_on": {"native": "Int16Array", "offset": 574, "size": 2}, "holster_weapon": {"native": "Uint8Array", "offset": 616, "size": 1}, "hurt_delay": {"native": "Uint8Array", "offset": 601, "size": 1}, "i": {"native": "Int16Array", "offset": 516, "size": 2}, "interface_toggle": {"native": "Uint32Array", "offset": 124, "size": 4}, "inv_amount": {"length": 11, "native": "Int16Array", "offset": 464, "size": 22}, "invdisptime": {"native": "Uint8Array", "offset": 615, "size": 1}, "inven_icon": {"native": "Uint8Array", "offset": 606, "size": 1}, "jetpack_on": {"native": "Uint8Array", "offset": 610, "size": 1}, "jetpackzincrement": {"native": "Int16Array", "offset": 396, "size": 2}, "jumping_counter": {"native": "Int16Array", "offset": 494, "size": 2}, "jumping_toggle": {"native": "Uint8Array", "offset": 603, "size": 1}, "kickback_pic": {"native": "Uint8Array", "offset": 597, "size": 1}, "knee_incs": {"native": "Uint8Array", "offset": 622, "size": 1}, "knuckle_incs": {"native": "Uint8Array", "offset": 621, "size": 1}, "last_extra": {"native": "Int16Array", "offset": 408, "size": 2}, "last_full_weapon": {"native": "Uint8Array", "offset": 619, "size": 1}, "last_pissed_time": {"native": "Int16Array", "offset": 534, "size": 2}, "last_quick_kick": {"native": "Uint8Array", "offset": 585, "size": 1}, "last_used_weapon": {"native": "Int8Array", "offset": 637, "size": 1}, "last_weapon": {"native": "Int8Array", "offset": 631, "size": 1}, "loogcnt": {"native": "Int8Array", "offset": 629, "size": 1}, "loogie": {"dims": [6], "offset": 144, "recordArray": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, "size": 24}, "look_ang": {"native": "Int16Array", "offset": 406, "size": 2}, "max_actors_killed": {"native": "Uint16Array", "offset": 132, "size": 2}, "max_ammo_amount": {"length": 13, "native": "Int16Array", "offset": 412, "size": 26}, "max_player_health": {"native": "Int32Array", "offset": 108, "size": 4}, "max_secret_rooms": {"native": "Uint8Array", "offset": 582, "size": 1}, "max_shield_amount": {"native": "Int32Array", "offset": 112, "size": 4}, "maxswimzvel": {"native": "Int16Array", "offset": 394, "size": 2}, "minswimzvel": {"native": "Int16Array", "offset": 392, "size": 2}, "minwaterzdist": {"native": "Int16Array", "offset": 378, "size": 2}, "movement_lock": {"native": "Uint8Array", "offset": 592, "size": 1}, "newowner": {"native": "Int16Array", "offset": 492, "size": 2}, "npos": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 36}, "numloogs": {"native": "Int8Array", "offset": 628, "size": 1}, "olook_ang": {"native": "Int16Array", "offset": 372, "size": 2}, "on_crane": {"native": "Int16Array", "offset": 514, "size": 2}, "on_ground": {"native": "Uint8Array", "offset": 605, "size": 1}, "on_warping_sector": {"native": "Uint8Array", "offset": 599, "size": 1}, "one_eighty_count": {"native": "Int16Array", "offset": 522, "size": 2}, "opos": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 12}, "opyoff": {"native": "Int16Array", "offset": 490, "size": 2}, "oq16ang": {"native": "Int32Array", "offset": 84, "size": 4}, "oq16horiz": {"native": "Int32Array", "offset": 72, "size": 4}, "oq16horizoff": {"native": "Int32Array", "offset": 76, "size": 4}, "orotscrnang": {"native": "Int16Array", "offset": 568, "size": 2}, "over_shoulder_on": {"native": "Uint8Array", "offset": 608, "size": 1}, "padding_": {"length": 1, "native": "Int8Array", "offset": 639, "oneByteTailArray": "clang-flex-arrays-0-or-1/1", "size": 1}, "palette": {"native": "Uint8Array", "offset": 636, "size": 1}, "palookup": {"native": "Uint8Array", "offset": 625, "size": 1}, "pals": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"b": {"native": "Uint8Array", "offset": 2, "size": 1}, "f": {"native": "Uint8Array", "offset": 3, "size": 1}, "g": {"native": "Uint8Array", "offset": 1, "size": 1}, "r": {"native": "Uint8Array", "offset": 0, "size": 1}}, "overlaps": false, "size": 4, "union": false}, "offset": 128}, "parallax_sectnum": {"native": "Int16Array", "offset": 518, "size": 2}, "player_par": {"native": "Int32Array", "offset": 100, "size": 4}, "pos": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}, "pycount": {"native": "Int16Array", "offset": 576, "size": 2}, "pyoff": {"native": "Int16Array", "offset": 488, "size": 2}, "q16ang": {"native": "Int32Array", "offset": 80, "size": 4}, "q16angvel": {"native": "Int32Array", "offset": 88, "size": 4}, "q16horiz": {"native": "Int32Array", "offset": 64, "size": 4}, "q16horizoff": {"native": "Int32Array", "offset": 68, "size": 4}, "quick_kick": {"native": "Uint8Array", "offset": 584, "size": 1}, "random_club_frame": {"native": "Int16Array", "offset": 520, "size": 2}, "rapid_fire_hold": {"native": "Uint8Array", "offset": 604, "size": 1}, "reloading": {"native": "Uint8Array", "offset": 587, "size": 1}, "return_to_center": {"native": "Uint8Array", "offset": 586, "size": 1}, "rotscrnang": {"native": "Int16Array", "offset": 570, "size": 2}, "runspeed": {"native": "Int32Array", "offset": 104, "size": 4}, "sbs": {"native": "Int16Array", "offset": 400, "size": 2}, "scream_voice": {"native": "Int8Array", "offset": 630, "size": 1}, "scuba_on": {"native": "Uint8Array", "offset": 612, "size": 1}, "secret_rooms": {"native": "Uint8Array", "offset": 583, "size": 1}, "show_empty_weapon": {"native": "Uint8Array", "offset": 609, "size": 1}, "shrunkzoffset": {"native": "Int16Array", "offset": 382, "size": 2}, "somethingonplayer": {"native": "Int16Array", "offset": 512, "size": 2}, "sound_pitch": {"native": "Int16Array", "offset": 402, "size": 2}, "spritebridge": {"native": "Uint8Array", "offset": 611, "size": 1}, "spritezoffset": {"native": "Int16Array", "offset": 376, "size": 2}, "subweapon": {"native": "Int16Array", "offset": 410, "size": 2}, "swimspeedmodifier": {"native": "Int16Array", "offset": 388, "size": 2}, "swimzincrement": {"native": "Int16Array", "offset": 390, "size": 2}, "team": {"native": "Uint8Array", "offset": 593, "size": 1}, "timebeforeexit": {"native": "Int16Array", "offset": 530, "size": 2}, "tipincs": {"native": "Uint8Array", "offset": 594, "size": 1}, "toggle_key_flag": {"native": "Uint8Array", "offset": 620, "size": 1}, "transporter_hold": {"native": "Int16Array", "offset": 578, "size": 2}, "truecz": {"native": "Int32Array", "offset": 96, "size": 4}, "truefz": {"native": "Int32Array", "offset": 92, "size": 4}, "vel": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 24}, "visibility": {"native": "Int16Array", "offset": 510, "size": 2}, "wackedbyactor": {"native": "Int16Array", "offset": 486, "size": 2}, "walking_snd_toggle": {"native": "Uint8Array", "offset": 624, "size": 1}, "wantweaponfire": {"native": "Int8Array", "offset": 634, "size": 1}, "waterzoffset": {"native": "Int16Array", "offset": 380, "size": 2}, "weapon_ang": {"native": "Int16Array", "offset": 508, "size": 2}, "weapon_pos": {"native": "Int8Array", "offset": 633, "size": 1}, "weapon_sway": {"native": "Int16Array", "offset": 562, "size": 2}, "weaponswitch": {"native": "Uint8Array", "offset": 591, "size": 1}, "weapreccnt": {"native": "Uint8Array", "offset": 588, "size": 1}, "weaprecs": {"length": 13, "native": "Int16Array", "offset": 536, "size": 26}, "zoom": {"native": "Uint16Array", "offset": 138, "size": 2}}, "overlaps": true, "size": 640, "union": false}, {})).q16ang) & 2047)), Int16Array.BYTES_PER_ELEMENT), Int16Array).value)) >> 9)))) << 16) >> 16));
  for ((i = i32((__cxx_global_cell_a822d0436b33da814b8410a2().value - 1))); (i >= 0); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous - 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; }))) {
    ((cPointerElementRef(cRecordPointer(__cxx_global_cell_9d5d7fcf3aa35a4809f92551().value, {"align": 4, "arrayAlign": 1, "fields": {"ceilingheinum": {"native": "Int16Array", "offset": 18, "size": 2}, "ceilingpal": {"native": "Uint8Array", "offset": 21, "size": 1}, "ceilingpicnum": {"native": "Int16Array", "offset": 16, "size": 2}, "ceilingshade": {"native": "Int8Array", "offset": 20, "size": 1}, "ceilingstat": {"native": "Uint16Array", "offset": 12, "size": 2}, "ceilingxpanning": {"native": "Uint8Array", "offset": 22, "size": 1}, "ceilingypanning": {"native": "Uint8Array", "offset": 23, "size": 1}, "ceilingz": {"native": "Int32Array", "offset": 4, "size": 4}, "extra": {"native": "Int16Array", "offset": 38, "size": 2}, "floorheinum": {"native": "Int16Array", "offset": 26, "size": 2}, "floorpal": {"native": "Uint8Array", "offset": 29, "size": 1}, "floorpicnum": {"native": "Int16Array", "offset": 24, "size": 2}, "floorshade": {"native": "Int8Array", "offset": 28, "size": 1}, "floorstat": {"native": "Uint16Array", "offset": 14, "size": 2}, "floorxpanning": {"native": "Uint8Array", "offset": 30, "size": 1}, "floorypanning": {"native": "Uint8Array", "offset": 31, "size": 1}, "floorz": {"native": "Int32Array", "offset": 8, "size": 4}, "fogpal": {"native": "Uint8Array", "offset": 33, "size": 1}, "hitag": {"native": "Int16Array", "offset": 36, "size": 2}, "lotag": {"native": "Int16Array", "offset": 34, "size": 2}, "visibility": {"native": "Uint8Array", "offset": 32, "size": 1}, "wallnum": {"native": "Int16Array", "offset": 2, "size": 2}, "wallptr": {"native": "Int16Array", "offset": 0, "size": 2}}, "overlaps": false, "size": 40, "union": false}, {}), (cDeref(cPointerOffset(g_cloudSect, i, Int16Array.BYTES_PER_ELEMENT), Int16Array).value)).value).ceilingxpanning = (u32((u32(i32((i32(__cxx_global_cell_13be58e164425bc1433880b5().value) >> 6))) & 255)) & 255));
    ((cPointerElementRef(cRecordPointer(__cxx_global_cell_9d5d7fcf3aa35a4809f92551().value, {"align": 4, "arrayAlign": 1, "fields": {"ceilingheinum": {"native": "Int16Array", "offset": 18, "size": 2}, "ceilingpal": {"native": "Uint8Array", "offset": 21, "size": 1}, "ceilingpicnum": {"native": "Int16Array", "offset": 16, "size": 2}, "ceilingshade": {"native": "Int8Array", "offset": 20, "size": 1}, "ceilingstat": {"native": "Uint16Array", "offset": 12, "size": 2}, "ceilingxpanning": {"native": "Uint8Array", "offset": 22, "size": 1}, "ceilingypanning": {"native": "Uint8Array", "offset": 23, "size": 1}, "ceilingz": {"native": "Int32Array", "offset": 4, "size": 4}, "extra": {"native": "Int16Array", "offset": 38, "size": 2}, "floorheinum": {"native": "Int16Array", "offset": 26, "size": 2}, "floorpal": {"native": "Uint8Array", "offset": 29, "size": 1}, "floorpicnum": {"native": "Int16Array", "offset": 24, "size": 2}, "floorshade": {"native": "Int8Array", "offset": 28, "size": 1}, "floorstat": {"native": "Uint16Array", "offset": 14, "size": 2}, "floorxpanning": {"native": "Uint8Array", "offset": 30, "size": 1}, "floorypanning": {"native": "Uint8Array", "offset": 31, "size": 1}, "floorz": {"native": "Int32Array", "offset": 8, "size": 4}, "fogpal": {"native": "Uint8Array", "offset": 33, "size": 1}, "hitag": {"native": "Int16Array", "offset": 36, "size": 2}, "lotag": {"native": "Int16Array", "offset": 34, "size": 2}, "visibility": {"native": "Uint8Array", "offset": 32, "size": 1}, "wallnum": {"native": "Int16Array", "offset": 2, "size": 2}, "wallptr": {"native": "Int16Array", "offset": 0, "size": 2}}, "overlaps": false, "size": 40, "union": false}, {}), (cDeref(cPointerOffset(g_cloudSect, i, Int16Array.BYTES_PER_ELEMENT), Int16Array).value)).value).ceilingypanning = (u32((u32(i32((i32(__cxx_global_cell_cd9e3fd19bbbc2e1259f56a8().value) >> 6))) & 255)) & 255));
  }
}

// C/C++ source: source/duke3d/src/screens.cpp:2236
export function G_PrintTime_ClockPad() {
  let clockpad = i32(2);
  const __cxx_lvalue_0 = cRef(() => clockpad, __cxx_lvalue_2 => { clockpad = i32(__cxx_lvalue_2); });
  let ii;
  let ij;
  const __cxx_lvalue_1 = cRef(() => ij, __cxx_lvalue_3 => { ij = i32(__cxx_lvalue_3); });
  for (((ii = i32(Math.trunc(cRecordObject(cRecordPointer((cPointerElementRef(cRecordPointer(g_player, {"align": 1, "arrayAlign": 1, "fields": {"frags": {"length": 16, "native": "Uint8Array", "offset": 62, "size": 16}, "gotvote": {"native": "Uint8Array", "offset": 93, "size": 1}, "horizAngleAdjust": {"native": "Int32Array", "offset": 32, "size": 4}, "horizRecenter": {"native": "Int32Array", "offset": 28, "size": 4}, "horizSkew": {"native": "Int32Array", "offset": 36, "size": 4}, "input": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"bits": {"native": "Uint32Array", "offset": 0, "size": 4}, "extbits": {"native": "Uint32Array", "offset": 16, "size": 4}, "fvel": {"native": "Int16Array", "offset": 4, "size": 2}, "q16avel": {"native": "Int32Array", "offset": 8, "size": 4}, "q16horz": {"native": "Int32Array", "offset": 12, "size": 4}, "svel": {"native": "Int16Array", "offset": 6, "size": 2}}, "overlaps": false, "size": 20, "union": false}, "offset": 8}, "lastViewUpdate": {"native": "BigUint64Array", "offset": 40, "size": 8}, "netsynctime": {"native": "Int32Array", "offset": 48, "size": 4}, "pcolor": {"native": "Int32Array", "offset": 52, "size": 4}, "ping": {"native": "Int16Array", "offset": 60, "size": 2}, "pingcnt": {"native": "Uint8Array", "offset": 94, "size": 1}, "playerquitflag": {"native": "Uint8Array", "offset": 95, "size": 1}, "ps": {"offset": 0, "pointer": true, "size": 8}, "pteam": {"native": "Int32Array", "offset": 56, "size": 4}, "ready": {"native": "Uint8Array", "offset": 96, "size": 1}, "revision": {"native": "Uint32Array", "offset": 129, "size": 4}, "smoothcamera": {"native": "Uint8Array", "offset": 91, "size": 1}, "user_name": {"length": 32, "native": "Uint8Array", "offset": 97, "size": 32}, "vote": {"native": "Uint8Array", "offset": 92, "size": 1}, "wchoice": {"length": 13, "native": "Uint8Array", "offset": 78, "size": 13}}, "overlaps": false, "size": 133, "union": false}, {}), __cxx_global_cell_04adffdeab684b9c52206917().value).value).ps, {"align": 1, "arrayAlign": 2, "fields": {"access_incs": {"native": "Uint8Array", "offset": 623, "size": 1}, "access_spritenum": {"native": "Int16Array", "offset": 504, "size": 2}, "access_wallnum": {"native": "Int16Array", "offset": 502, "size": 2}, "actors_killed": {"native": "Uint16Array", "offset": 134, "size": 2}, "actorsqu": {"native": "Int16Array", "offset": 528, "size": 2}, "aim_mode": {"native": "Uint8Array", "offset": 589, "size": 1}, "airleft": {"native": "Int16Array", "offset": 496, "size": 2}, "ammo_amount": {"length": 13, "native": "Int16Array", "offset": 438, "size": 26}, "auto_aim": {"native": "Uint8Array", "offset": 590, "size": 1}, "autostep": {"native": "Int32Array", "offset": 116, "size": 4}, "autostep_sbw": {"native": "Int32Array", "offset": 120, "size": 4}, "bobcounter": {"native": "Int16Array", "offset": 566, "size": 2}, "bobpos": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 48}, "buttonpalette": {"native": "Uint8Array", "offset": 607, "size": 1}, "cheat_phase": {"native": "Int8Array", "offset": 632, "size": 1}, "clipdist": {"native": "Int16Array", "offset": 580, "size": 2}, "crack_time": {"native": "Int16Array", "offset": 564, "size": 2}, "crouch_toggle": {"native": "Int8Array", "offset": 638, "size": 1}, "crouchspeedmodifier": {"native": "Int16Array", "offset": 386, "size": 2}, "crouchzincrement": {"native": "Int16Array", "offset": 384, "size": 2}, "curr_weapon": {"native": "Int8Array", "offset": 635, "size": 1}, "cursectnum": {"native": "Int16Array", "offset": 404, "size": 2}, "customexitsound": {"native": "Int16Array", "offset": 532, "size": 2}, "dead_flag": {"native": "Int16Array", "offset": 572, "size": 2}, "dummyplayersprite": {"native": "Int16Array", "offset": 524, "size": 2}, "extra_extra8": {"native": "Int16Array", "offset": 526, "size": 2}, "falling_counter": {"native": "Uint8Array", "offset": 617, "size": 1}, "filler": {"length": 100, "native": "Int16Array", "offset": 168, "size": 200}, "fist_incs": {"native": "Uint8Array", "offset": 627, "size": 1}, "floorzcutoff": {"native": "Int16Array", "offset": 370, "size": 2}, "floorzoffset": {"native": "Int16Array", "offset": 374, "size": 2}, "floorzrebound": {"native": "Int16Array", "offset": 368, "size": 2}, "footprintcount": {"native": "Uint8Array", "offset": 600, "size": 1}, "footprintpal": {"native": "Uint8Array", "offset": 613, "size": 1}, "footprintshade": {"native": "Uint8Array", "offset": 618, "size": 1}, "frag": {"native": "Uint16Array", "offset": 140, "size": 2}, "frag_ps": {"native": "Uint8Array", "offset": 596, "size": 1}, "fraggedself": {"native": "Uint16Array", "offset": 142, "size": 2}, "fric": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 56}, "fta": {"native": "Int16Array", "offset": 498, "size": 2}, "ftq": {"native": "Int16Array", "offset": 500, "size": 2}, "gm": {"native": "Uint8Array", "offset": 598, "size": 1}, "got_access": {"native": "Int16Array", "offset": 506, "size": 2}, "gotweapon": {"native": "Uint16Array", "offset": 136, "size": 2}, "gravity": {"native": "Int16Array", "offset": 398, "size": 2}, "hard_landing": {"native": "Uint8Array", "offset": 626, "size": 1}, "hbomb_hold_delay": {"native": "Uint8Array", "offset": 595, "size": 1}, "hbomb_on": {"native": "Uint8Array", "offset": 602, "size": 1}, "heat_on": {"native": "Uint8Array", "offset": 614, "size": 1}, "holoduke_on": {"native": "Int16Array", "offset": 574, "size": 2}, "holster_weapon": {"native": "Uint8Array", "offset": 616, "size": 1}, "hurt_delay": {"native": "Uint8Array", "offset": 601, "size": 1}, "i": {"native": "Int16Array", "offset": 516, "size": 2}, "interface_toggle": {"native": "Uint32Array", "offset": 124, "size": 4}, "inv_amount": {"length": 11, "native": "Int16Array", "offset": 464, "size": 22}, "invdisptime": {"native": "Uint8Array", "offset": 615, "size": 1}, "inven_icon": {"native": "Uint8Array", "offset": 606, "size": 1}, "jetpack_on": {"native": "Uint8Array", "offset": 610, "size": 1}, "jetpackzincrement": {"native": "Int16Array", "offset": 396, "size": 2}, "jumping_counter": {"native": "Int16Array", "offset": 494, "size": 2}, "jumping_toggle": {"native": "Uint8Array", "offset": 603, "size": 1}, "kickback_pic": {"native": "Uint8Array", "offset": 597, "size": 1}, "knee_incs": {"native": "Uint8Array", "offset": 622, "size": 1}, "knuckle_incs": {"native": "Uint8Array", "offset": 621, "size": 1}, "last_extra": {"native": "Int16Array", "offset": 408, "size": 2}, "last_full_weapon": {"native": "Uint8Array", "offset": 619, "size": 1}, "last_pissed_time": {"native": "Int16Array", "offset": 534, "size": 2}, "last_quick_kick": {"native": "Uint8Array", "offset": 585, "size": 1}, "last_used_weapon": {"native": "Int8Array", "offset": 637, "size": 1}, "last_weapon": {"native": "Int8Array", "offset": 631, "size": 1}, "loogcnt": {"native": "Int8Array", "offset": 629, "size": 1}, "loogie": {"dims": [6], "offset": 144, "recordArray": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, "size": 24}, "look_ang": {"native": "Int16Array", "offset": 406, "size": 2}, "max_actors_killed": {"native": "Uint16Array", "offset": 132, "size": 2}, "max_ammo_amount": {"length": 13, "native": "Int16Array", "offset": 412, "size": 26}, "max_player_health": {"native": "Int32Array", "offset": 108, "size": 4}, "max_secret_rooms": {"native": "Uint8Array", "offset": 582, "size": 1}, "max_shield_amount": {"native": "Int32Array", "offset": 112, "size": 4}, "maxswimzvel": {"native": "Int16Array", "offset": 394, "size": 2}, "minswimzvel": {"native": "Int16Array", "offset": 392, "size": 2}, "minwaterzdist": {"native": "Int16Array", "offset": 378, "size": 2}, "movement_lock": {"native": "Uint8Array", "offset": 592, "size": 1}, "newowner": {"native": "Int16Array", "offset": 492, "size": 2}, "npos": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 36}, "numloogs": {"native": "Int8Array", "offset": 628, "size": 1}, "olook_ang": {"native": "Int16Array", "offset": 372, "size": 2}, "on_crane": {"native": "Int16Array", "offset": 514, "size": 2}, "on_ground": {"native": "Uint8Array", "offset": 605, "size": 1}, "on_warping_sector": {"native": "Uint8Array", "offset": 599, "size": 1}, "one_eighty_count": {"native": "Int16Array", "offset": 522, "size": 2}, "opos": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 12}, "opyoff": {"native": "Int16Array", "offset": 490, "size": 2}, "oq16ang": {"native": "Int32Array", "offset": 84, "size": 4}, "oq16horiz": {"native": "Int32Array", "offset": 72, "size": 4}, "oq16horizoff": {"native": "Int32Array", "offset": 76, "size": 4}, "orotscrnang": {"native": "Int16Array", "offset": 568, "size": 2}, "over_shoulder_on": {"native": "Uint8Array", "offset": 608, "size": 1}, "padding_": {"length": 1, "native": "Int8Array", "offset": 639, "oneByteTailArray": "clang-flex-arrays-0-or-1/1", "size": 1}, "palette": {"native": "Uint8Array", "offset": 636, "size": 1}, "palookup": {"native": "Uint8Array", "offset": 625, "size": 1}, "pals": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"b": {"native": "Uint8Array", "offset": 2, "size": 1}, "f": {"native": "Uint8Array", "offset": 3, "size": 1}, "g": {"native": "Uint8Array", "offset": 1, "size": 1}, "r": {"native": "Uint8Array", "offset": 0, "size": 1}}, "overlaps": false, "size": 4, "union": false}, "offset": 128}, "parallax_sectnum": {"native": "Int16Array", "offset": 518, "size": 2}, "player_par": {"native": "Int32Array", "offset": 100, "size": 4}, "pos": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}, "pycount": {"native": "Int16Array", "offset": 576, "size": 2}, "pyoff": {"native": "Int16Array", "offset": 488, "size": 2}, "q16ang": {"native": "Int32Array", "offset": 80, "size": 4}, "q16angvel": {"native": "Int32Array", "offset": 88, "size": 4}, "q16horiz": {"native": "Int32Array", "offset": 64, "size": 4}, "q16horizoff": {"native": "Int32Array", "offset": 68, "size": 4}, "quick_kick": {"native": "Uint8Array", "offset": 584, "size": 1}, "random_club_frame": {"native": "Int16Array", "offset": 520, "size": 2}, "rapid_fire_hold": {"native": "Uint8Array", "offset": 604, "size": 1}, "reloading": {"native": "Uint8Array", "offset": 587, "size": 1}, "return_to_center": {"native": "Uint8Array", "offset": 586, "size": 1}, "rotscrnang": {"native": "Int16Array", "offset": 570, "size": 2}, "runspeed": {"native": "Int32Array", "offset": 104, "size": 4}, "sbs": {"native": "Int16Array", "offset": 400, "size": 2}, "scream_voice": {"native": "Int8Array", "offset": 630, "size": 1}, "scuba_on": {"native": "Uint8Array", "offset": 612, "size": 1}, "secret_rooms": {"native": "Uint8Array", "offset": 583, "size": 1}, "show_empty_weapon": {"native": "Uint8Array", "offset": 609, "size": 1}, "shrunkzoffset": {"native": "Int16Array", "offset": 382, "size": 2}, "somethingonplayer": {"native": "Int16Array", "offset": 512, "size": 2}, "sound_pitch": {"native": "Int16Array", "offset": 402, "size": 2}, "spritebridge": {"native": "Uint8Array", "offset": 611, "size": 1}, "spritezoffset": {"native": "Int16Array", "offset": 376, "size": 2}, "subweapon": {"native": "Int16Array", "offset": 410, "size": 2}, "swimspeedmodifier": {"native": "Int16Array", "offset": 388, "size": 2}, "swimzincrement": {"native": "Int16Array", "offset": 390, "size": 2}, "team": {"native": "Uint8Array", "offset": 593, "size": 1}, "timebeforeexit": {"native": "Int16Array", "offset": 530, "size": 2}, "tipincs": {"native": "Uint8Array", "offset": 594, "size": 1}, "toggle_key_flag": {"native": "Uint8Array", "offset": 620, "size": 1}, "transporter_hold": {"native": "Int16Array", "offset": 578, "size": 2}, "truecz": {"native": "Int32Array", "offset": 96, "size": 4}, "truefz": {"native": "Int32Array", "offset": 92, "size": 4}, "vel": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 24}, "visibility": {"native": "Int16Array", "offset": 510, "size": 2}, "wackedbyactor": {"native": "Int16Array", "offset": 486, "size": 2}, "walking_snd_toggle": {"native": "Uint8Array", "offset": 624, "size": 1}, "wantweaponfire": {"native": "Int8Array", "offset": 634, "size": 1}, "waterzoffset": {"native": "Int16Array", "offset": 380, "size": 2}, "weapon_ang": {"native": "Int16Array", "offset": 508, "size": 2}, "weapon_pos": {"native": "Int8Array", "offset": 633, "size": 1}, "weapon_sway": {"native": "Int16Array", "offset": 562, "size": 2}, "weaponswitch": {"native": "Uint8Array", "offset": 591, "size": 1}, "weapreccnt": {"native": "Uint8Array", "offset": 588, "size": 1}, "weaprecs": {"length": 13, "native": "Int16Array", "offset": 536, "size": 26}, "zoom": {"native": "Uint16Array", "offset": 138, "size": 2}}, "overlaps": true, "size": 640, "union": false}, {})).player_par / i32(Math.imul(30, 60))))), (ij = i32(1))); (ii > 9); ((ii = i32((Number(ii) / Number(10)))), ((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = i32((previous + 1)); __cxx_lvalue_4.value = next; return previous; })(__cxx_lvalue_1))) {

  }
  (clockpad = i32((max__template_b1cfaf2244c73238(__cxx_lvalue_0, __cxx_lvalue_1)).value));
  if ((!(((__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.volume_number == 0) && (i32((i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.last_level) - 1)) == 7)) && Boolean((cDeref(cPointerOffset(boardfilename, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value))))) {
    for (((ii = i32(Math.trunc((cPointerElementRef(cRecordPointer(g_mapInfo, {"align": 8, "arrayAlign": 1, "fields": {"designertime": {"native": "Int32Array", "offset": 4, "size": 4}, "filename": {"offset": 16, "pointer": true, "size": 8}, "musicfn": {"offset": 24, "pointer": true, "size": 8}, "name": {"offset": 8, "pointer": true, "size": 8}, "partime": {"native": "Int32Array", "offset": 0, "size": 4}, "savedstate": {"offset": 32, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {}), G_LastMapInfoIndex__header_f469b18c9eb7()).value).partime / i32(Math.imul(30, 60))))), (ij = i32(1))); (ii > 9); ((ii = i32((Number(ii) / Number(10)))), ((__cxx_lvalue_5) => { const previous = __cxx_lvalue_5.value; const next = i32((previous + 1)); __cxx_lvalue_5.value = next; return previous; })(__cxx_lvalue_1))) {

    }
    (clockpad = i32((max__template_b1cfaf2244c73238(__cxx_lvalue_0, __cxx_lvalue_1)).value));
    if (((!Boolean(i32((__cxx_global_cell_c0e288040dbf9a805036c27d().value & i32((2 | 8)))))) && Boolean((cPointerElementRef(cRecordPointer(g_mapInfo, {"align": 8, "arrayAlign": 1, "fields": {"designertime": {"native": "Int32Array", "offset": 4, "size": 4}, "filename": {"offset": 16, "pointer": true, "size": 8}, "musicfn": {"offset": 24, "pointer": true, "size": 8}, "name": {"offset": 8, "pointer": true, "size": 8}, "partime": {"native": "Int32Array", "offset": 0, "size": 4}, "savedstate": {"offset": 32, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {}), G_LastMapInfoIndex__header_f469b18c9eb7()).value).designertime))) {
      for (((ii = i32(Math.trunc((cPointerElementRef(cRecordPointer(g_mapInfo, {"align": 8, "arrayAlign": 1, "fields": {"designertime": {"native": "Int32Array", "offset": 4, "size": 4}, "filename": {"offset": 16, "pointer": true, "size": 8}, "musicfn": {"offset": 24, "pointer": true, "size": 8}, "name": {"offset": 8, "pointer": true, "size": 8}, "partime": {"native": "Int32Array", "offset": 0, "size": 4}, "savedstate": {"offset": 32, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {}), G_LastMapInfoIndex__header_f469b18c9eb7()).value).designertime / i32(Math.imul(30, 60))))), (ij = i32(1))); (ii > 9); ((ii = i32((Number(ii) / Number(10)))), ((__cxx_lvalue_6) => { const previous = __cxx_lvalue_6.value; const next = i32((previous + 1)); __cxx_lvalue_6.value = next; return previous; })(__cxx_lvalue_1))) {

      }
      (clockpad = i32((max__template_b1cfaf2244c73238(__cxx_lvalue_0, __cxx_lvalue_1)).value));
    }
  }
  if ((__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.playerbest > 0)) {
    for (((ii = i32(Math.trunc(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.playerbest / i32(Math.imul(30, 60))))), (ij = i32(1))); (ii > 9); ((ii = i32((Number(ii) / Number(10)))), ((__cxx_lvalue_7) => { const previous = __cxx_lvalue_7.value; const next = i32((previous + 1)); __cxx_lvalue_7.value = next; return previous; })(__cxx_lvalue_1))) {

    }
  }
  (clockpad = i32((max__template_b1cfaf2244c73238(__cxx_lvalue_0, __cxx_lvalue_1)).value));
  return i32(clockpad);
}

// C/C++ source: source/duke3d/src/screens.cpp:2259
const __cxx_literal_357ef6e60c7d68974f58 = Uint8Array.from([37, 48, 42, 100, 58, 37, 48, 50, 100, 0]);
export function G_PrintTime2(time) {
  sprintf(tempbuf, __cxx_literal_357ef6e60c7d68974f58, G_PrintTime_ClockPad(), Math.trunc(time / i32(Math.imul(30, 60))), (Math.trunc(time / 30) % 60));
  return tempbuf;
}

// C/C++ source: source/duke3d/src/screens.cpp:2264
const __cxx_literal_9137a565cf7c6be090be = Uint8Array.from([37, 48, 42, 100, 58, 37, 48, 50, 100, 46, 37, 48, 50, 100, 0]);
export function G_PrintTime3(time) {
  sprintf(tempbuf, __cxx_literal_9137a565cf7c6be090be, G_PrintTime_ClockPad(), Math.trunc(time / i32(Math.imul(30, 60))), (Math.trunc(time / 30) % 60), Math.trunc(i32(Math.imul((time % 30), 33)) / 10));
  return tempbuf;
}

// C/C++ source: source/duke3d/src/screens.cpp:2270
export function G_PrintYourTime() {
  return G_PrintTime3(cRecordObject(cRecordPointer((cPointerElementRef(cRecordPointer(g_player, {"align": 1, "arrayAlign": 1, "fields": {"frags": {"length": 16, "native": "Uint8Array", "offset": 62, "size": 16}, "gotvote": {"native": "Uint8Array", "offset": 93, "size": 1}, "horizAngleAdjust": {"native": "Int32Array", "offset": 32, "size": 4}, "horizRecenter": {"native": "Int32Array", "offset": 28, "size": 4}, "horizSkew": {"native": "Int32Array", "offset": 36, "size": 4}, "input": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"bits": {"native": "Uint32Array", "offset": 0, "size": 4}, "extbits": {"native": "Uint32Array", "offset": 16, "size": 4}, "fvel": {"native": "Int16Array", "offset": 4, "size": 2}, "q16avel": {"native": "Int32Array", "offset": 8, "size": 4}, "q16horz": {"native": "Int32Array", "offset": 12, "size": 4}, "svel": {"native": "Int16Array", "offset": 6, "size": 2}}, "overlaps": false, "size": 20, "union": false}, "offset": 8}, "lastViewUpdate": {"native": "BigUint64Array", "offset": 40, "size": 8}, "netsynctime": {"native": "Int32Array", "offset": 48, "size": 4}, "pcolor": {"native": "Int32Array", "offset": 52, "size": 4}, "ping": {"native": "Int16Array", "offset": 60, "size": 2}, "pingcnt": {"native": "Uint8Array", "offset": 94, "size": 1}, "playerquitflag": {"native": "Uint8Array", "offset": 95, "size": 1}, "ps": {"offset": 0, "pointer": true, "size": 8}, "pteam": {"native": "Int32Array", "offset": 56, "size": 4}, "ready": {"native": "Uint8Array", "offset": 96, "size": 1}, "revision": {"native": "Uint32Array", "offset": 129, "size": 4}, "smoothcamera": {"native": "Uint8Array", "offset": 91, "size": 1}, "user_name": {"length": 32, "native": "Uint8Array", "offset": 97, "size": 32}, "vote": {"native": "Uint8Array", "offset": 92, "size": 1}, "wchoice": {"length": 13, "native": "Uint8Array", "offset": 78, "size": 13}}, "overlaps": false, "size": 133, "union": false}, {}), __cxx_global_cell_04adffdeab684b9c52206917().value).value).ps, {"align": 1, "arrayAlign": 2, "fields": {"access_incs": {"native": "Uint8Array", "offset": 623, "size": 1}, "access_spritenum": {"native": "Int16Array", "offset": 504, "size": 2}, "access_wallnum": {"native": "Int16Array", "offset": 502, "size": 2}, "actors_killed": {"native": "Uint16Array", "offset": 134, "size": 2}, "actorsqu": {"native": "Int16Array", "offset": 528, "size": 2}, "aim_mode": {"native": "Uint8Array", "offset": 589, "size": 1}, "airleft": {"native": "Int16Array", "offset": 496, "size": 2}, "ammo_amount": {"length": 13, "native": "Int16Array", "offset": 438, "size": 26}, "auto_aim": {"native": "Uint8Array", "offset": 590, "size": 1}, "autostep": {"native": "Int32Array", "offset": 116, "size": 4}, "autostep_sbw": {"native": "Int32Array", "offset": 120, "size": 4}, "bobcounter": {"native": "Int16Array", "offset": 566, "size": 2}, "bobpos": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 48}, "buttonpalette": {"native": "Uint8Array", "offset": 607, "size": 1}, "cheat_phase": {"native": "Int8Array", "offset": 632, "size": 1}, "clipdist": {"native": "Int16Array", "offset": 580, "size": 2}, "crack_time": {"native": "Int16Array", "offset": 564, "size": 2}, "crouch_toggle": {"native": "Int8Array", "offset": 638, "size": 1}, "crouchspeedmodifier": {"native": "Int16Array", "offset": 386, "size": 2}, "crouchzincrement": {"native": "Int16Array", "offset": 384, "size": 2}, "curr_weapon": {"native": "Int8Array", "offset": 635, "size": 1}, "cursectnum": {"native": "Int16Array", "offset": 404, "size": 2}, "customexitsound": {"native": "Int16Array", "offset": 532, "size": 2}, "dead_flag": {"native": "Int16Array", "offset": 572, "size": 2}, "dummyplayersprite": {"native": "Int16Array", "offset": 524, "size": 2}, "extra_extra8": {"native": "Int16Array", "offset": 526, "size": 2}, "falling_counter": {"native": "Uint8Array", "offset": 617, "size": 1}, "filler": {"length": 100, "native": "Int16Array", "offset": 168, "size": 200}, "fist_incs": {"native": "Uint8Array", "offset": 627, "size": 1}, "floorzcutoff": {"native": "Int16Array", "offset": 370, "size": 2}, "floorzoffset": {"native": "Int16Array", "offset": 374, "size": 2}, "floorzrebound": {"native": "Int16Array", "offset": 368, "size": 2}, "footprintcount": {"native": "Uint8Array", "offset": 600, "size": 1}, "footprintpal": {"native": "Uint8Array", "offset": 613, "size": 1}, "footprintshade": {"native": "Uint8Array", "offset": 618, "size": 1}, "frag": {"native": "Uint16Array", "offset": 140, "size": 2}, "frag_ps": {"native": "Uint8Array", "offset": 596, "size": 1}, "fraggedself": {"native": "Uint16Array", "offset": 142, "size": 2}, "fric": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 56}, "fta": {"native": "Int16Array", "offset": 498, "size": 2}, "ftq": {"native": "Int16Array", "offset": 500, "size": 2}, "gm": {"native": "Uint8Array", "offset": 598, "size": 1}, "got_access": {"native": "Int16Array", "offset": 506, "size": 2}, "gotweapon": {"native": "Uint16Array", "offset": 136, "size": 2}, "gravity": {"native": "Int16Array", "offset": 398, "size": 2}, "hard_landing": {"native": "Uint8Array", "offset": 626, "size": 1}, "hbomb_hold_delay": {"native": "Uint8Array", "offset": 595, "size": 1}, "hbomb_on": {"native": "Uint8Array", "offset": 602, "size": 1}, "heat_on": {"native": "Uint8Array", "offset": 614, "size": 1}, "holoduke_on": {"native": "Int16Array", "offset": 574, "size": 2}, "holster_weapon": {"native": "Uint8Array", "offset": 616, "size": 1}, "hurt_delay": {"native": "Uint8Array", "offset": 601, "size": 1}, "i": {"native": "Int16Array", "offset": 516, "size": 2}, "interface_toggle": {"native": "Uint32Array", "offset": 124, "size": 4}, "inv_amount": {"length": 11, "native": "Int16Array", "offset": 464, "size": 22}, "invdisptime": {"native": "Uint8Array", "offset": 615, "size": 1}, "inven_icon": {"native": "Uint8Array", "offset": 606, "size": 1}, "jetpack_on": {"native": "Uint8Array", "offset": 610, "size": 1}, "jetpackzincrement": {"native": "Int16Array", "offset": 396, "size": 2}, "jumping_counter": {"native": "Int16Array", "offset": 494, "size": 2}, "jumping_toggle": {"native": "Uint8Array", "offset": 603, "size": 1}, "kickback_pic": {"native": "Uint8Array", "offset": 597, "size": 1}, "knee_incs": {"native": "Uint8Array", "offset": 622, "size": 1}, "knuckle_incs": {"native": "Uint8Array", "offset": 621, "size": 1}, "last_extra": {"native": "Int16Array", "offset": 408, "size": 2}, "last_full_weapon": {"native": "Uint8Array", "offset": 619, "size": 1}, "last_pissed_time": {"native": "Int16Array", "offset": 534, "size": 2}, "last_quick_kick": {"native": "Uint8Array", "offset": 585, "size": 1}, "last_used_weapon": {"native": "Int8Array", "offset": 637, "size": 1}, "last_weapon": {"native": "Int8Array", "offset": 631, "size": 1}, "loogcnt": {"native": "Int8Array", "offset": 629, "size": 1}, "loogie": {"dims": [6], "offset": 144, "recordArray": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, "size": 24}, "look_ang": {"native": "Int16Array", "offset": 406, "size": 2}, "max_actors_killed": {"native": "Uint16Array", "offset": 132, "size": 2}, "max_ammo_amount": {"length": 13, "native": "Int16Array", "offset": 412, "size": 26}, "max_player_health": {"native": "Int32Array", "offset": 108, "size": 4}, "max_secret_rooms": {"native": "Uint8Array", "offset": 582, "size": 1}, "max_shield_amount": {"native": "Int32Array", "offset": 112, "size": 4}, "maxswimzvel": {"native": "Int16Array", "offset": 394, "size": 2}, "minswimzvel": {"native": "Int16Array", "offset": 392, "size": 2}, "minwaterzdist": {"native": "Int16Array", "offset": 378, "size": 2}, "movement_lock": {"native": "Uint8Array", "offset": 592, "size": 1}, "newowner": {"native": "Int16Array", "offset": 492, "size": 2}, "npos": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 36}, "numloogs": {"native": "Int8Array", "offset": 628, "size": 1}, "olook_ang": {"native": "Int16Array", "offset": 372, "size": 2}, "on_crane": {"native": "Int16Array", "offset": 514, "size": 2}, "on_ground": {"native": "Uint8Array", "offset": 605, "size": 1}, "on_warping_sector": {"native": "Uint8Array", "offset": 599, "size": 1}, "one_eighty_count": {"native": "Int16Array", "offset": 522, "size": 2}, "opos": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 12}, "opyoff": {"native": "Int16Array", "offset": 490, "size": 2}, "oq16ang": {"native": "Int32Array", "offset": 84, "size": 4}, "oq16horiz": {"native": "Int32Array", "offset": 72, "size": 4}, "oq16horizoff": {"native": "Int32Array", "offset": 76, "size": 4}, "orotscrnang": {"native": "Int16Array", "offset": 568, "size": 2}, "over_shoulder_on": {"native": "Uint8Array", "offset": 608, "size": 1}, "padding_": {"length": 1, "native": "Int8Array", "offset": 639, "oneByteTailArray": "clang-flex-arrays-0-or-1/1", "size": 1}, "palette": {"native": "Uint8Array", "offset": 636, "size": 1}, "palookup": {"native": "Uint8Array", "offset": 625, "size": 1}, "pals": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"b": {"native": "Uint8Array", "offset": 2, "size": 1}, "f": {"native": "Uint8Array", "offset": 3, "size": 1}, "g": {"native": "Uint8Array", "offset": 1, "size": 1}, "r": {"native": "Uint8Array", "offset": 0, "size": 1}}, "overlaps": false, "size": 4, "union": false}, "offset": 128}, "parallax_sectnum": {"native": "Int16Array", "offset": 518, "size": 2}, "player_par": {"native": "Int32Array", "offset": 100, "size": 4}, "pos": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}, "pycount": {"native": "Int16Array", "offset": 576, "size": 2}, "pyoff": {"native": "Int16Array", "offset": 488, "size": 2}, "q16ang": {"native": "Int32Array", "offset": 80, "size": 4}, "q16angvel": {"native": "Int32Array", "offset": 88, "size": 4}, "q16horiz": {"native": "Int32Array", "offset": 64, "size": 4}, "q16horizoff": {"native": "Int32Array", "offset": 68, "size": 4}, "quick_kick": {"native": "Uint8Array", "offset": 584, "size": 1}, "random_club_frame": {"native": "Int16Array", "offset": 520, "size": 2}, "rapid_fire_hold": {"native": "Uint8Array", "offset": 604, "size": 1}, "reloading": {"native": "Uint8Array", "offset": 587, "size": 1}, "return_to_center": {"native": "Uint8Array", "offset": 586, "size": 1}, "rotscrnang": {"native": "Int16Array", "offset": 570, "size": 2}, "runspeed": {"native": "Int32Array", "offset": 104, "size": 4}, "sbs": {"native": "Int16Array", "offset": 400, "size": 2}, "scream_voice": {"native": "Int8Array", "offset": 630, "size": 1}, "scuba_on": {"native": "Uint8Array", "offset": 612, "size": 1}, "secret_rooms": {"native": "Uint8Array", "offset": 583, "size": 1}, "show_empty_weapon": {"native": "Uint8Array", "offset": 609, "size": 1}, "shrunkzoffset": {"native": "Int16Array", "offset": 382, "size": 2}, "somethingonplayer": {"native": "Int16Array", "offset": 512, "size": 2}, "sound_pitch": {"native": "Int16Array", "offset": 402, "size": 2}, "spritebridge": {"native": "Uint8Array", "offset": 611, "size": 1}, "spritezoffset": {"native": "Int16Array", "offset": 376, "size": 2}, "subweapon": {"native": "Int16Array", "offset": 410, "size": 2}, "swimspeedmodifier": {"native": "Int16Array", "offset": 388, "size": 2}, "swimzincrement": {"native": "Int16Array", "offset": 390, "size": 2}, "team": {"native": "Uint8Array", "offset": 593, "size": 1}, "timebeforeexit": {"native": "Int16Array", "offset": 530, "size": 2}, "tipincs": {"native": "Uint8Array", "offset": 594, "size": 1}, "toggle_key_flag": {"native": "Uint8Array", "offset": 620, "size": 1}, "transporter_hold": {"native": "Int16Array", "offset": 578, "size": 2}, "truecz": {"native": "Int32Array", "offset": 96, "size": 4}, "truefz": {"native": "Int32Array", "offset": 92, "size": 4}, "vel": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 24}, "visibility": {"native": "Int16Array", "offset": 510, "size": 2}, "wackedbyactor": {"native": "Int16Array", "offset": 486, "size": 2}, "walking_snd_toggle": {"native": "Uint8Array", "offset": 624, "size": 1}, "wantweaponfire": {"native": "Int8Array", "offset": 634, "size": 1}, "waterzoffset": {"native": "Int16Array", "offset": 380, "size": 2}, "weapon_ang": {"native": "Int16Array", "offset": 508, "size": 2}, "weapon_pos": {"native": "Int8Array", "offset": 633, "size": 1}, "weapon_sway": {"native": "Int16Array", "offset": 562, "size": 2}, "weaponswitch": {"native": "Uint8Array", "offset": 591, "size": 1}, "weapreccnt": {"native": "Uint8Array", "offset": 588, "size": 1}, "weaprecs": {"length": 13, "native": "Int16Array", "offset": 536, "size": 26}, "zoom": {"native": "Uint16Array", "offset": 138, "size": 2}}, "overlaps": true, "size": 640, "union": false}, {})).player_par);
}

// C/C++ source: source/duke3d/src/screens.cpp:2274
const __cxx_literal_c21c2eac1139a05784b5 = Uint8Array.from([60, 105, 110, 118, 97, 108, 105, 100, 62, 0]);
export function G_PrintParTime() {
  if ((i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.last_level) < 1)) {
    return __cxx_literal_c21c2eac1139a05784b5;
  }
  return G_PrintTime2((cPointerElementRef(cRecordPointer(g_mapInfo, {"align": 8, "arrayAlign": 1, "fields": {"designertime": {"native": "Int32Array", "offset": 4, "size": 4}, "filename": {"offset": 16, "pointer": true, "size": 8}, "musicfn": {"offset": 24, "pointer": true, "size": 8}, "name": {"offset": 8, "pointer": true, "size": 8}, "partime": {"native": "Int32Array", "offset": 0, "size": 4}, "savedstate": {"offset": 32, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {}), G_LastMapInfoIndex__header_f469b18c9eb7()).value).partime);
}

// C/C++ source: source/duke3d/src/screens.cpp:2280
const __cxx_literal_e4175506ee99f5471239 = Uint8Array.from([60, 105, 110, 118, 97, 108, 105, 100, 62, 0]);
export function G_PrintDesignerTime() {
  if ((i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.last_level) < 1)) {
    return __cxx_literal_e4175506ee99f5471239;
  }
  return G_PrintTime2((cPointerElementRef(cRecordPointer(g_mapInfo, {"align": 8, "arrayAlign": 1, "fields": {"designertime": {"native": "Int32Array", "offset": 4, "size": 4}, "filename": {"offset": 16, "pointer": true, "size": 8}, "musicfn": {"offset": 24, "pointer": true, "size": 8}, "name": {"offset": 8, "pointer": true, "size": 8}, "partime": {"native": "Int32Array", "offset": 0, "size": 4}, "savedstate": {"offset": 32, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {}), G_LastMapInfoIndex__header_f469b18c9eb7()).value).designertime);
}

// C/C++ source: source/duke3d/src/screens.cpp:2286
export function G_PrintBestTime() {
  return G_PrintTime3(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.playerbest);
}

// C/C++ source: source/build/include/build.h:1079
export function videoGetRenderMode__header_0d776a793682() {
  return i32(0);
}

// C/C++ source: source/build/include/colmatch.h:25
export function paletteGetClosestColor__header_4b1e03847e64(r, g, b) {
  return i32(paletteGetClosestColorUpToIndex__header_0367764ec25c(r, g, b, 255));
}

// C/C++ source: source/duke3d/src/screens.h:27
export function G_LastMapInfoIndex__header_f469b18c9eb7() {
  (i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.last_level) >= 1);
  return i32((i32((i32(Math.imul(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.volume_number, 64)) + i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.last_level))) - 1));
}

export function clamp__header_1ed923c91a30(__cxx_in, min, max) {
  return i32(((__cxx_in <= i32(min)) ? i32(min) : ((__cxx_in >= i32(max)) ? i32(max) : __cxx_in)));
}

// C/C++ source: @sysroot/usr/include/c++/12/bits/stl_algobase.h:254
export function max__template_b1cfaf2244c73238(__a, __b) {
  if ((__a.value < __b.value)) {
    return __b;
  }
  return __a;
}

export function clamp__header_36ccfd714bcb(__cxx_in, min, max) {
  return (u32(((i32(__cxx_in) <= i32((u32((u32(min) & 255)) & 255))) ? (u32((u32(min) & 255)) & 255) : ((i32(__cxx_in) >= i32((u32((u32(max) & 255)) & 255))) ? (u32((u32(max) & 255)) & 255) : __cxx_in))) & 255);
}

// C/C++ source: source/build/include/pragmas.h:174
export function scale__header_b5fee509aa49(eax, edx, ecx) {
  return i32(tabledivide64__header_575390bae6bc(i64((BigInt(i64(eax)) * BigInt(i64(edx)))), i64(ecx)));
}

// C/C++ source: source/build/include/pragmas.h:328
export function ksgn__header_08b3870a8b53(a) {
  return i32((i32((a > 0)) - i32((a < 0))));
}

// C/C++ source: source/build/include/pragmas.h:321
export function klabs__header_941226bc098a(a) {
  return i32(abs(a));
}

// C/C++ source: source/build/include/fix16.h:42
export function fix16_to_int__header_896d36d84088(a) {
  return i32(Math.trunc(i32((a + ((a >= 0) ? fix16_half__header_global_d1b95ae64fd6728c : (-fix16_half__header_global_d1b95ae64fd6728c)))) / fix16_one__header_global_7c933adea594f27c));
}

export function divscale16__header_5b4c97a9971c(eax, ebx) {
  return i32(divscale__header_82c0213efdce(eax, ebx, 16));
}

export function mulscale16__header_4d9de231d0b7(eax, edx) {
  return i32(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) >> BigInt(i32((u32((u32(16) & 255)) & 255))))));
}

// C/C++ source: source/build/include/build.h:1683
export function renderDisableFog__header_128271eadafa() {

}

export function bitmap_test__header_e7a5c842a067(ptr, n) {

  return Boolean((i32((i32((cDeref(cPointerOffset(ptr, i32((n >> 3)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & i32((cDeref(cPointerOffset(pow2char__header_global_42c9ca1ec1ac2c93, i32((n & 7)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))) == i32((cDeref(cPointerOffset(pow2char__header_global_42c9ca1ec1ac2c93, i32((n & 7)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value))));
}

export function dmulscale16__header_b11598486c57(eax, edx, esi, edi) {
  return i32(i64((BigInt(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) + BigInt(i64((BigInt(i64(esi)) * BigInt(i64(edi)))))))) >> BigInt(i32((u32((u32(16) & 255)) & 255))))));
}

// C/C++ source: source/build/include/build.h:1693
export function renderEnableFog__header_f24c3bc9c7c0() {

}

// C/C++ source: source/build/include/build.h:746
export function spriteGetSlope__header_054a7b561fc1(spritenum) {
  let spr = cRecordPointer(cPointerOffset(__cxx_global_cell_4a046e33ecf7aced9bfd0007().value, spritenum, 44), {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xyz": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "__cxx_anonymous_15": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"xvel": {"native": "Int16Array", "offset": 0, "size": 2}, "yvel": {"native": "Int16Array", "offset": 2, "size": 2}, "zvel": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "vel": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}, "z": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"d": {"native": "Int16Array", "offset": 0, "size": 2}, "u": {"native": "Int16Array", "offset": 2, "size": 2}, "v": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 0}}, "overlaps": true, "size": 6, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 32}, "ang": {"native": "Int16Array", "offset": 28, "size": 2}, "blend": {"native": "Uint8Array", "offset": 19, "size": 1}, "clipdist": {"native": "Uint8Array", "offset": 18, "size": 1}, "cstat": {"native": "Uint16Array", "offset": 12, "size": 2}, "extra": {"native": "Int16Array", "offset": 42, "size": 2}, "hitag": {"native": "Int16Array", "offset": 40, "size": 2}, "lotag": {"native": "Int16Array", "offset": 38, "size": 2}, "owner": {"native": "Int16Array", "offset": 30, "size": 2}, "pal": {"native": "Uint8Array", "offset": 17, "size": 1}, "picnum": {"native": "Int16Array", "offset": 14, "size": 2}, "sectnum": {"native": "Int16Array", "offset": 24, "size": 2}, "shade": {"native": "Int8Array", "offset": 16, "size": 1}, "statnum": {"native": "Int16Array", "offset": 26, "size": 2}, "xoffset": {"native": "Int8Array", "offset": 22, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 20, "size": 1}, "yoffset": {"native": "Int8Array", "offset": 23, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 21, "size": 1}}, "overlaps": true, "size": 44, "union": false}, {});
  let cstat = (u32((u32(i32((i32(cRecordObject(cRecordPointer(spr, {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xyz": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "__cxx_anonymous_15": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"xvel": {"native": "Int16Array", "offset": 0, "size": 2}, "yvel": {"native": "Int16Array", "offset": 2, "size": 2}, "zvel": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "vel": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}, "z": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"d": {"native": "Int16Array", "offset": 0, "size": 2}, "u": {"native": "Int16Array", "offset": 2, "size": 2}, "v": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 0}}, "overlaps": true, "size": 6, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 32}, "ang": {"native": "Int16Array", "offset": 28, "size": 2}, "blend": {"native": "Uint8Array", "offset": 19, "size": 1}, "clipdist": {"native": "Uint8Array", "offset": 18, "size": 1}, "cstat": {"native": "Uint16Array", "offset": 12, "size": 2}, "extra": {"native": "Int16Array", "offset": 42, "size": 2}, "hitag": {"native": "Int16Array", "offset": 40, "size": 2}, "lotag": {"native": "Int16Array", "offset": 38, "size": 2}, "owner": {"native": "Int16Array", "offset": 30, "size": 2}, "pal": {"native": "Uint8Array", "offset": 17, "size": 1}, "picnum": {"native": "Int16Array", "offset": 14, "size": 2}, "sectnum": {"native": "Int16Array", "offset": 24, "size": 2}, "shade": {"native": "Int8Array", "offset": 16, "size": 1}, "statnum": {"native": "Int16Array", "offset": 26, "size": 2}, "xoffset": {"native": "Int8Array", "offset": 22, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 20, "size": 1}, "yoffset": {"native": "Int8Array", "offset": 23, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 21, "size": 1}}, "overlaps": true, "size": 44, "union": false}, {})).cstat) & i32(48)))) & 65535)) & 65535);
  if ((i32(cstat) != i32(48))) {
    return ((u32(((u32(0) << 16) >> 16)) << 16) >> 16);
  }
  return ((u32(((u32(i32((i32((u32((u32(cRecordObject(cRecordPointer(spr, {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xyz": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "__cxx_anonymous_15": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"xvel": {"native": "Int16Array", "offset": 0, "size": 2}, "yvel": {"native": "Int16Array", "offset": 2, "size": 2}, "zvel": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "vel": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}, "z": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"d": {"native": "Int16Array", "offset": 0, "size": 2}, "u": {"native": "Int16Array", "offset": 2, "size": 2}, "v": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 0}}, "overlaps": true, "size": 6, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 32}, "ang": {"native": "Int16Array", "offset": 28, "size": 2}, "blend": {"native": "Uint8Array", "offset": 19, "size": 1}, "clipdist": {"native": "Uint8Array", "offset": 18, "size": 1}, "cstat": {"native": "Uint16Array", "offset": 12, "size": 2}, "extra": {"native": "Int16Array", "offset": 42, "size": 2}, "hitag": {"native": "Int16Array", "offset": 40, "size": 2}, "lotag": {"native": "Int16Array", "offset": 38, "size": 2}, "owner": {"native": "Int16Array", "offset": 30, "size": 2}, "pal": {"native": "Uint8Array", "offset": 17, "size": 1}, "picnum": {"native": "Int16Array", "offset": 14, "size": 2}, "sectnum": {"native": "Int16Array", "offset": 24, "size": 2}, "shade": {"native": "Int8Array", "offset": 16, "size": 1}, "statnum": {"native": "Int16Array", "offset": 26, "size": 2}, "xoffset": {"native": "Int8Array", "offset": 22, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 20, "size": 1}, "yoffset": {"native": "Int8Array", "offset": 23, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 21, "size": 1}}, "overlaps": true, "size": 44, "union": false}, {})).xoffset) & 255)) & 255)) + i32((i32((u32((u32(cRecordObject(cRecordPointer(spr, {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xyz": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "__cxx_anonymous_15": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"xvel": {"native": "Int16Array", "offset": 0, "size": 2}, "yvel": {"native": "Int16Array", "offset": 2, "size": 2}, "zvel": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "vel": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}, "z": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"d": {"native": "Int16Array", "offset": 0, "size": 2}, "u": {"native": "Int16Array", "offset": 2, "size": 2}, "v": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 0}}, "overlaps": true, "size": 6, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 32}, "ang": {"native": "Int16Array", "offset": 28, "size": 2}, "blend": {"native": "Uint8Array", "offset": 19, "size": 1}, "clipdist": {"native": "Uint8Array", "offset": 18, "size": 1}, "cstat": {"native": "Uint16Array", "offset": 12, "size": 2}, "extra": {"native": "Int16Array", "offset": 42, "size": 2}, "hitag": {"native": "Int16Array", "offset": 40, "size": 2}, "lotag": {"native": "Int16Array", "offset": 38, "size": 2}, "owner": {"native": "Int16Array", "offset": 30, "size": 2}, "pal": {"native": "Uint8Array", "offset": 17, "size": 1}, "picnum": {"native": "Int16Array", "offset": 14, "size": 2}, "sectnum": {"native": "Int16Array", "offset": 24, "size": 2}, "shade": {"native": "Int8Array", "offset": 16, "size": 1}, "statnum": {"native": "Int16Array", "offset": 26, "size": 2}, "xoffset": {"native": "Int8Array", "offset": 22, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 20, "size": 1}, "yoffset": {"native": "Int8Array", "offset": 23, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 21, "size": 1}}, "overlaps": true, "size": 44, "union": false}, {})).yoffset) & 255)) & 255)) << 8))))) << 16) >> 16)) << 16) >> 16);
}

export function divscale12__header_3099ab232e06(eax, ebx) {
  return i32(divscale__header_82c0213efdce(eax, ebx, 12));
}

// C/C++ source: @sysroot/usr/include/c++/12/bits/stl_algobase.h:230
export function min__template_c5ffcfb092321e6b(__a, __b) {
  if ((__b.value < __a.value)) {
    return __b;
  }
  return __a;
}

// C/C++ source: source/build/include/compat.h:706
export function Blrintf__header_9200a89d0141(x) {
  return cSSEFloat32ToInt32(x);
}

export function bitmap_set__header_236f942968a8(ptr, n) {

  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = (u32((__cxx_lvalue_0.value | i32((cDeref(cPointerOffset(pow2char__header_global_42c9ca1ec1ac2c93, i32((n & 7)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))) & 255)))(cDeref(cPointerOffset(ptr, i32((n >> 3)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array));
}

// C/C++ source: source/duke3d/src/game.h:469
export function calc_smoothratio__header_bb7344063104(totalclk, ototalclk) {
  if (((Boolean(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.pause_on) || Boolean(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.show_help)) || Boolean(i32((i32(cRecordObject(cRecordPointer((cPointerElementRef(cRecordPointer(g_player, {"align": 1, "arrayAlign": 1, "fields": {"frags": {"length": 16, "native": "Uint8Array", "offset": 62, "size": 16}, "gotvote": {"native": "Uint8Array", "offset": 93, "size": 1}, "horizAngleAdjust": {"native": "Int32Array", "offset": 32, "size": 4}, "horizRecenter": {"native": "Int32Array", "offset": 28, "size": 4}, "horizSkew": {"native": "Int32Array", "offset": 36, "size": 4}, "input": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"bits": {"native": "Uint32Array", "offset": 0, "size": 4}, "extbits": {"native": "Uint32Array", "offset": 16, "size": 4}, "fvel": {"native": "Int16Array", "offset": 4, "size": 2}, "q16avel": {"native": "Int32Array", "offset": 8, "size": 4}, "q16horz": {"native": "Int32Array", "offset": 12, "size": 4}, "svel": {"native": "Int16Array", "offset": 6, "size": 2}}, "overlaps": false, "size": 20, "union": false}, "offset": 8}, "lastViewUpdate": {"native": "BigUint64Array", "offset": 40, "size": 8}, "netsynctime": {"native": "Int32Array", "offset": 48, "size": 4}, "pcolor": {"native": "Int32Array", "offset": 52, "size": 4}, "ping": {"native": "Int16Array", "offset": 60, "size": 2}, "pingcnt": {"native": "Uint8Array", "offset": 94, "size": 1}, "playerquitflag": {"native": "Uint8Array", "offset": 95, "size": 1}, "ps": {"offset": 0, "pointer": true, "size": 8}, "pteam": {"native": "Int32Array", "offset": 56, "size": 4}, "ready": {"native": "Uint8Array", "offset": 96, "size": 1}, "revision": {"native": "Uint32Array", "offset": 129, "size": 4}, "smoothcamera": {"native": "Uint8Array", "offset": 91, "size": 1}, "user_name": {"length": 32, "native": "Uint8Array", "offset": 97, "size": 32}, "vote": {"native": "Uint8Array", "offset": 92, "size": 1}, "wchoice": {"length": 13, "native": "Uint8Array", "offset": 78, "size": 13}}, "overlaps": false, "size": 133, "union": false}, {}), __cxx_global_cell_04adffdeab684b9c52206917().value).value).ps, {"align": 1, "arrayAlign": 2, "fields": {"access_incs": {"native": "Uint8Array", "offset": 623, "size": 1}, "access_spritenum": {"native": "Int16Array", "offset": 504, "size": 2}, "access_wallnum": {"native": "Int16Array", "offset": 502, "size": 2}, "actors_killed": {"native": "Uint16Array", "offset": 134, "size": 2}, "actorsqu": {"native": "Int16Array", "offset": 528, "size": 2}, "aim_mode": {"native": "Uint8Array", "offset": 589, "size": 1}, "airleft": {"native": "Int16Array", "offset": 496, "size": 2}, "ammo_amount": {"length": 13, "native": "Int16Array", "offset": 438, "size": 26}, "auto_aim": {"native": "Uint8Array", "offset": 590, "size": 1}, "autostep": {"native": "Int32Array", "offset": 116, "size": 4}, "autostep_sbw": {"native": "Int32Array", "offset": 120, "size": 4}, "bobcounter": {"native": "Int16Array", "offset": 566, "size": 2}, "bobpos": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 48}, "buttonpalette": {"native": "Uint8Array", "offset": 607, "size": 1}, "cheat_phase": {"native": "Int8Array", "offset": 632, "size": 1}, "clipdist": {"native": "Int16Array", "offset": 580, "size": 2}, "crack_time": {"native": "Int16Array", "offset": 564, "size": 2}, "crouch_toggle": {"native": "Int8Array", "offset": 638, "size": 1}, "crouchspeedmodifier": {"native": "Int16Array", "offset": 386, "size": 2}, "crouchzincrement": {"native": "Int16Array", "offset": 384, "size": 2}, "curr_weapon": {"native": "Int8Array", "offset": 635, "size": 1}, "cursectnum": {"native": "Int16Array", "offset": 404, "size": 2}, "customexitsound": {"native": "Int16Array", "offset": 532, "size": 2}, "dead_flag": {"native": "Int16Array", "offset": 572, "size": 2}, "dummyplayersprite": {"native": "Int16Array", "offset": 524, "size": 2}, "extra_extra8": {"native": "Int16Array", "offset": 526, "size": 2}, "falling_counter": {"native": "Uint8Array", "offset": 617, "size": 1}, "filler": {"length": 100, "native": "Int16Array", "offset": 168, "size": 200}, "fist_incs": {"native": "Uint8Array", "offset": 627, "size": 1}, "floorzcutoff": {"native": "Int16Array", "offset": 370, "size": 2}, "floorzoffset": {"native": "Int16Array", "offset": 374, "size": 2}, "floorzrebound": {"native": "Int16Array", "offset": 368, "size": 2}, "footprintcount": {"native": "Uint8Array", "offset": 600, "size": 1}, "footprintpal": {"native": "Uint8Array", "offset": 613, "size": 1}, "footprintshade": {"native": "Uint8Array", "offset": 618, "size": 1}, "frag": {"native": "Uint16Array", "offset": 140, "size": 2}, "frag_ps": {"native": "Uint8Array", "offset": 596, "size": 1}, "fraggedself": {"native": "Uint16Array", "offset": 142, "size": 2}, "fric": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 56}, "fta": {"native": "Int16Array", "offset": 498, "size": 2}, "ftq": {"native": "Int16Array", "offset": 500, "size": 2}, "gm": {"native": "Uint8Array", "offset": 598, "size": 1}, "got_access": {"native": "Int16Array", "offset": 506, "size": 2}, "gotweapon": {"native": "Uint16Array", "offset": 136, "size": 2}, "gravity": {"native": "Int16Array", "offset": 398, "size": 2}, "hard_landing": {"native": "Uint8Array", "offset": 626, "size": 1}, "hbomb_hold_delay": {"native": "Uint8Array", "offset": 595, "size": 1}, "hbomb_on": {"native": "Uint8Array", "offset": 602, "size": 1}, "heat_on": {"native": "Uint8Array", "offset": 614, "size": 1}, "holoduke_on": {"native": "Int16Array", "offset": 574, "size": 2}, "holster_weapon": {"native": "Uint8Array", "offset": 616, "size": 1}, "hurt_delay": {"native": "Uint8Array", "offset": 601, "size": 1}, "i": {"native": "Int16Array", "offset": 516, "size": 2}, "interface_toggle": {"native": "Uint32Array", "offset": 124, "size": 4}, "inv_amount": {"length": 11, "native": "Int16Array", "offset": 464, "size": 22}, "invdisptime": {"native": "Uint8Array", "offset": 615, "size": 1}, "inven_icon": {"native": "Uint8Array", "offset": 606, "size": 1}, "jetpack_on": {"native": "Uint8Array", "offset": 610, "size": 1}, "jetpackzincrement": {"native": "Int16Array", "offset": 396, "size": 2}, "jumping_counter": {"native": "Int16Array", "offset": 494, "size": 2}, "jumping_toggle": {"native": "Uint8Array", "offset": 603, "size": 1}, "kickback_pic": {"native": "Uint8Array", "offset": 597, "size": 1}, "knee_incs": {"native": "Uint8Array", "offset": 622, "size": 1}, "knuckle_incs": {"native": "Uint8Array", "offset": 621, "size": 1}, "last_extra": {"native": "Int16Array", "offset": 408, "size": 2}, "last_full_weapon": {"native": "Uint8Array", "offset": 619, "size": 1}, "last_pissed_time": {"native": "Int16Array", "offset": 534, "size": 2}, "last_quick_kick": {"native": "Uint8Array", "offset": 585, "size": 1}, "last_used_weapon": {"native": "Int8Array", "offset": 637, "size": 1}, "last_weapon": {"native": "Int8Array", "offset": 631, "size": 1}, "loogcnt": {"native": "Int8Array", "offset": 629, "size": 1}, "loogie": {"dims": [6], "offset": 144, "recordArray": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, "size": 24}, "look_ang": {"native": "Int16Array", "offset": 406, "size": 2}, "max_actors_killed": {"native": "Uint16Array", "offset": 132, "size": 2}, "max_ammo_amount": {"length": 13, "native": "Int16Array", "offset": 412, "size": 26}, "max_player_health": {"native": "Int32Array", "offset": 108, "size": 4}, "max_secret_rooms": {"native": "Uint8Array", "offset": 582, "size": 1}, "max_shield_amount": {"native": "Int32Array", "offset": 112, "size": 4}, "maxswimzvel": {"native": "Int16Array", "offset": 394, "size": 2}, "minswimzvel": {"native": "Int16Array", "offset": 392, "size": 2}, "minwaterzdist": {"native": "Int16Array", "offset": 378, "size": 2}, "movement_lock": {"native": "Uint8Array", "offset": 592, "size": 1}, "newowner": {"native": "Int16Array", "offset": 492, "size": 2}, "npos": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 36}, "numloogs": {"native": "Int8Array", "offset": 628, "size": 1}, "olook_ang": {"native": "Int16Array", "offset": 372, "size": 2}, "on_crane": {"native": "Int16Array", "offset": 514, "size": 2}, "on_ground": {"native": "Uint8Array", "offset": 605, "size": 1}, "on_warping_sector": {"native": "Uint8Array", "offset": 599, "size": 1}, "one_eighty_count": {"native": "Int16Array", "offset": 522, "size": 2}, "opos": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 12}, "opyoff": {"native": "Int16Array", "offset": 490, "size": 2}, "oq16ang": {"native": "Int32Array", "offset": 84, "size": 4}, "oq16horiz": {"native": "Int32Array", "offset": 72, "size": 4}, "oq16horizoff": {"native": "Int32Array", "offset": 76, "size": 4}, "orotscrnang": {"native": "Int16Array", "offset": 568, "size": 2}, "over_shoulder_on": {"native": "Uint8Array", "offset": 608, "size": 1}, "padding_": {"length": 1, "native": "Int8Array", "offset": 639, "oneByteTailArray": "clang-flex-arrays-0-or-1/1", "size": 1}, "palette": {"native": "Uint8Array", "offset": 636, "size": 1}, "palookup": {"native": "Uint8Array", "offset": 625, "size": 1}, "pals": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"b": {"native": "Uint8Array", "offset": 2, "size": 1}, "f": {"native": "Uint8Array", "offset": 3, "size": 1}, "g": {"native": "Uint8Array", "offset": 1, "size": 1}, "r": {"native": "Uint8Array", "offset": 0, "size": 1}}, "overlaps": false, "size": 4, "union": false}, "offset": 128}, "parallax_sectnum": {"native": "Int16Array", "offset": 518, "size": 2}, "player_par": {"native": "Int32Array", "offset": 100, "size": 4}, "pos": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}, "pycount": {"native": "Int16Array", "offset": 576, "size": 2}, "pyoff": {"native": "Int16Array", "offset": 488, "size": 2}, "q16ang": {"native": "Int32Array", "offset": 80, "size": 4}, "q16angvel": {"native": "Int32Array", "offset": 88, "size": 4}, "q16horiz": {"native": "Int32Array", "offset": 64, "size": 4}, "q16horizoff": {"native": "Int32Array", "offset": 68, "size": 4}, "quick_kick": {"native": "Uint8Array", "offset": 584, "size": 1}, "random_club_frame": {"native": "Int16Array", "offset": 520, "size": 2}, "rapid_fire_hold": {"native": "Uint8Array", "offset": 604, "size": 1}, "reloading": {"native": "Uint8Array", "offset": 587, "size": 1}, "return_to_center": {"native": "Uint8Array", "offset": 586, "size": 1}, "rotscrnang": {"native": "Int16Array", "offset": 570, "size": 2}, "runspeed": {"native": "Int32Array", "offset": 104, "size": 4}, "sbs": {"native": "Int16Array", "offset": 400, "size": 2}, "scream_voice": {"native": "Int8Array", "offset": 630, "size": 1}, "scuba_on": {"native": "Uint8Array", "offset": 612, "size": 1}, "secret_rooms": {"native": "Uint8Array", "offset": 583, "size": 1}, "show_empty_weapon": {"native": "Uint8Array", "offset": 609, "size": 1}, "shrunkzoffset": {"native": "Int16Array", "offset": 382, "size": 2}, "somethingonplayer": {"native": "Int16Array", "offset": 512, "size": 2}, "sound_pitch": {"native": "Int16Array", "offset": 402, "size": 2}, "spritebridge": {"native": "Uint8Array", "offset": 611, "size": 1}, "spritezoffset": {"native": "Int16Array", "offset": 376, "size": 2}, "subweapon": {"native": "Int16Array", "offset": 410, "size": 2}, "swimspeedmodifier": {"native": "Int16Array", "offset": 388, "size": 2}, "swimzincrement": {"native": "Int16Array", "offset": 390, "size": 2}, "team": {"native": "Uint8Array", "offset": 593, "size": 1}, "timebeforeexit": {"native": "Int16Array", "offset": 530, "size": 2}, "tipincs": {"native": "Uint8Array", "offset": 594, "size": 1}, "toggle_key_flag": {"native": "Uint8Array", "offset": 620, "size": 1}, "transporter_hold": {"native": "Int16Array", "offset": 578, "size": 2}, "truecz": {"native": "Int32Array", "offset": 96, "size": 4}, "truefz": {"native": "Int32Array", "offset": 92, "size": 4}, "vel": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 24}, "visibility": {"native": "Int16Array", "offset": 510, "size": 2}, "wackedbyactor": {"native": "Int16Array", "offset": 486, "size": 2}, "walking_snd_toggle": {"native": "Uint8Array", "offset": 624, "size": 1}, "wantweaponfire": {"native": "Int8Array", "offset": 634, "size": 1}, "waterzoffset": {"native": "Int16Array", "offset": 380, "size": 2}, "weapon_ang": {"native": "Int16Array", "offset": 508, "size": 2}, "weapon_pos": {"native": "Int8Array", "offset": 633, "size": 1}, "weapon_sway": {"native": "Int16Array", "offset": 562, "size": 2}, "weaponswitch": {"native": "Uint8Array", "offset": 591, "size": 1}, "weapreccnt": {"native": "Uint8Array", "offset": 588, "size": 1}, "weaprecs": {"length": 13, "native": "Int16Array", "offset": 536, "size": 26}, "zoom": {"native": "Uint16Array", "offset": 138, "size": 2}}, "overlaps": true, "size": 640, "union": false}, {})).gm) & i32(1)))))) {
    return i32(65536);
  }
  return i32(calc_smoothratio__header_feb3dd756c37(cCopyTrivialClass(totalclk, ClockTicks(), ["wholeTicks", "ticksS32"]), cCopyTrivialClass(ototalclk, ClockTicks(), ["wholeTicks", "ticksS32"]), 30));
}

// C/C++ source: source/duke3d/src/global.h:233
export function G_RestoreInterpolations__header_a73eacfaf5f0() {
  let i = i32((__cxx_global_cell_f51bebc92810fbbcedc191bf().value - 1));
  if (Boolean(((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous - 1)); __cxx_lvalue_0.value = next; return next; })(__cxx_global_cell_4c2e99926c93297eef1857b2()))) {
    return;
  }
  for (; (i >= 0); ((__cxx_lvalue_1) => { const previous = __cxx_lvalue_1.value; const next = i32((previous - 1)); __cxx_lvalue_1.value = next; return previous; })(cRef(() => i, __cxx_lvalue_2 => { i = __cxx_lvalue_2; }))) {
    ((cDeref((cPointerElementRef(curipos, i).value), Int32Array).value) = i32((cDeref(cPointerOffset(bakipos, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
  }
}

// C/C++ source: source/duke3d/src/game.h:293
export function G_HaveUserMap__header_ab9aa9fa295e() {
  return i32((((i32((cDeref(cPointerOffset(boardfilename, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) != 0) && (__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.level_number == 7)) && (__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.volume_number == 0)));
}

// C/C++ source: source/duke3d/src/game.h:130
const __cxx_literal_ada53938eb451fdd2dc5 = Uint8Array.from([76, 79, 71, 79, 95, 70, 76, 65, 71, 83, 0]);
export function G_GetLogoFlags__header_8eb7b53543e9() {
  return i32(Gv_GetVarByLabel(__cxx_literal_ada53938eb451fdd2dc5, 255, (-1), (-1)));
}

// C/C++ source: source/duke3d/src/gameexec.h:44
export function VM_HaveEvent__header_5fd7f46a2a49(nEventID) {
  return i32((!(!Boolean((cDeref(cPointerOffset(apScriptEvents, nEventID, BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array).value)))));
}

// C/C++ source: source/duke3d/src/sbar.h:30
export function sbarsc__header_6ac0ae1aca54(sc) {
  return i32(scale__header_b5fee509aa49(sc, __cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.statusbarscale, 100));
}

// C/C++ source: source/duke3d/src/sbar.h:40
export function sbartile__header_5e2b748e6608() {
  return i32(((Boolean(i32((__cxx_global_cell_c0e288040dbf9a805036c27d().value & 1))) && (__cxx_global_cell_f7e268c20b879c2fe3740be6().value >= 16)) ? __cxx_global_cell_66791bf155916fdf0696318d().value : __cxx_global_cell_fffbe90549f36d5aaad66f3d().value));
}

// C/C++ source: source/build/include/baselayer.h:364
const __cxx_literal_1eff7d4f5245983a6261 = Uint8Array.from([99, 97, 108, 99, 95, 115, 109, 111, 111, 116, 104, 114, 97, 116, 105, 111, 58, 32, 114, 97, 116, 105, 111, 58, 32, 37, 100, 0]);
export function calc_smoothratio__header_feb3dd756c37(totalclk, ototalclk, gameTicRate) {
  let tfreq = i32(floorf(((__cxx_global_cell_84c518e352f66f31d8eaf74c().value * 120) / timerGetClockRate())));
  let clk = i32(__cxx_operator_761c63d1e16e183f(cCopyTrivialClass(totalclk, ClockTicks(), ["wholeTicks", "ticksS32"]), ototalclk).toScale16());
  let tics = Math.fround(Math.fround((Math.fround((Math.fround((Math.fround((Math.fround(1) / Math.fround(65536))) * Math.fround((Math.fround(1) / Math.fround(120))))) * Math.fround(tfreq))) * Math.fround(clk))));
  let ratio = i32(__cxx_global_cell_88248ca6ca50548115e47549().value(i32(Math.fround((Math.fround((Math.fround(65536) * tics)) * Math.fround(gameTicRate)))), tfreq));
  const __cxx_lvalue_0 = cRef(() => ratio, __cxx_lvalue_1 => { ratio = i32(__cxx_lvalue_1); });
  if ((u32(ratio) > u32(66048))) {
    do {
      SILENCE_UNUSED__header_63469fd6c852(__cxx_literal_1eff7d4f5245983a6261, __cxx_lvalue_0);
    } while (Boolean(0));
  }
  return i32(clamp__header_1ed923c91a30(ratio, 0, 65536));
}

// C/C++ source: source/build/include/random.h:43
export function wrand__header_aee131f3bc81() {
  (__cxx_global_cell_c51fcdf4111f2095a57e764d().value = u32((u32(Math.imul(u32(1103515245), __cxx_global_cell_c51fcdf4111f2095a57e764d().value)) + u32(12345))));
  return i32(u32(((__cxx_global_cell_c51fcdf4111f2095a57e764d().value >>> 16) & u32(32767))));
}

// C/C++ source: source/build/include/colmatch.h:16
export function paletteGetClosestColorUpToIndex__header_0367764ec25c(r, g, b, lastokcol) {
  return i32(paletteGetClosestColorWithBlacklist(r, g, b, lastokcol, null));
}

// C/C++ source: source/build/include/pragmas.h:111
export function tabledivide64__header_575390bae6bc(n, d) {

  if (Boolean(i32((i32((d != __cxx_global_cell_f8287b2e627d0e3f51b90c55().value)) & i32((!(u64(d) < u64(16384)))))))) {
    cAssignAggregate((cPointerElementRef(cRecordPointer(divtable64, {"align": 1, "arrayAlign": 1, "fields": {"magic": {"native": "BigInt64Array", "offset": 0, "size": 8}, "more": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 9, "union": false}, {}), 0).value), libdivide_s64_gen((__cxx_global_cell_f8287b2e627d0e3f51b90c55().value = i64(d))), {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"magic": {"native": "BigInt64Array", "offset": 0, "size": 8}, "more": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 9, "union": false}}, {"abi": "source-clang-trivial-record-assignment/1", "assignment_mode": "moveAssign", "clang_assignment_signature": "libdivide_s64_t &(libdivide_s64_t &&) noexcept", "clang_method_id": "0x26f46a5a900", "native_layout": {"abi": "source-record-field-storage/1", "sha256": "530e844acf5f4aae77d6501332d2314b0565b5453efe01e50ae4b2242323f757"}, "record_name": "libdivide::libdivide_s64_t", "source_record": "libdivide::libdivide_s64_t"});
  }
  return i64(libdivide_s64_do(n, cPointerOffset(divtable64, i64((BigInt(i64((u64(d) < u64(16384)))) * BigInt(d))), 9)));
}

// C/C++ source: source/build/include/pragmas.h:164
export function divscale__header_82c0213efdce(eax, ebx, ecx) {
  return i32(tabledivide64__header_575390bae6bc(i64((BigInt(i64(eax)) << BigInt(i32((u32((u32(ecx) & 255)) & 255))))), i64(ebx)));
}

// C/C++ source: source/duke3d/src/text.h:93
export function PopulateConstWidth__header_8b7a926ef04e(tilefontPtr, font, flags) {
  let numeral = (u32(48) & 255);
  let tile = (u32((u32(G_GetStringTileASCII(cCopyAggregate(tilefontPtr, {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"opaque": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "size": 8, "union": false}}), font, numeral, flags)) & 65535)) & 65535);
  (i32(tile) < 30720);
  return i32((i32((i32((cPointerElementRef(cRecordPointer(tilesiz, {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, {}), tile).value).x) - 1)) << 16));
}

// C/C++ source: source/duke3d/src/text.h:104
export function G_ScreenTextGetBuf__header_df5c5da1f755(textbufcount) {
  if ((__cxx_global_cell_c38589ca7df93168d30113b9().value < textbufcount)) {
    (__cxx_global_cell_c38589ca7df93168d30113b9().value = u64(textbufcount));
    xfree__header_967e1e4d8f07(__cxx_global_cell_350f0357d1f4508cfdc7336c().value);
    (__cxx_global_cell_350f0357d1f4508cfdc7336c().value = cTypedPointer(xmalloc__header_d4ba3aa920dc(u64((BigInt(2) * BigInt(textbufcount)))), Uint16Array));
  }
  return __cxx_global_cell_350f0357d1f4508cfdc7336c().value;
}

// C/C++ source: source/audiolib/include/fx_man.h:97
export function FX_CheckMVErr__header_4510dbfb03cd(status) {
  if ((status != i32(0))) {
    FX_SetErrorCode__header_277217f4e16b(i32(2));
    (status = i32(-2));
  }
  return i32(status);
}

export function SILENCE_UNUSED__header_63469fd6c852(arg0, arg1) {

}

// C/C++ source: source/build/include/compat.h:1449
export function xfree__header_967e1e4d8f07(ptr) {
  Free__cxx_static_0dfd3f42f0dc2c05(__cxx_global_cell_11016d3c7177543e564ab46c().value, ptr);
}

// C/C++ source: source/build/include/compat.h:1392
export function xmalloc__header_d4ba3aa920dc(size) {
  let ptr = Alloc__cxx_static_e0036cfb06bcfe42(__cxx_global_cell_11016d3c7177543e564ab46c().value, size, u64(16));
  if (cPointerCompare(ptr, null, "!=")) {
    return ptr;
  }
  handle_memerr(i32(size));
  __builtin_unreachable();
}

// C/C++ source: source/audiolib/include/fx_man.h:91
export function FX_SetErrorCode__header_277217f4e16b(status) {
  (__cxx_global_cell_103ca1df5a9531b359a2ae15().value = i32(status));
  return i32(-1);
}

export function __cxx_operator_e3598b0077b4da36(lhs, rhs) {
  return cCopyTrivialClass(lhs.__cxx_operator_c4f1fab776aa8f78(rhs), ClockTicks(), ["wholeTicks", "ticksS32"]);
}

export function __cxx_operator_761c63d1e16e183f(lhs, rhs) {
  return cCopyTrivialClass(lhs.__cxx_operator_86b05ee676890126(rhs), ClockTicks(), ["wholeTicks", "ticksS32"]);
}

export function __cxx_operator_565aa0a1c7b59878(lhs, rhs) {
  return cCopyTrivialClass(lhs.__cxx_operator_1260acd8fbd617cf(rhs), ClockTicks(), ["wholeTicks", "ticksS32"]);
}

export function __cxx_operator_11a696315e969ab4(lhs, rhs) {
  return Boolean((lhs.wholeTicks < rhs.wholeTicks));
}

export function __cxx_operator_9d5bfff63c86ec9c(lhs, rhs) {
  return Boolean(__cxx_operator_11a696315e969ab4(rhs, lhs));
}

export function __cxx_operator_2bd212496e3ec90a(lhs, rhs) {
  return Boolean((!__cxx_operator_9d5bfff63c86ec9c(lhs, rhs)));
}

export function __cxx_operator_6d2a22ee5048dd1a(lhs, rhs) {
  return Boolean((!__cxx_operator_11a696315e969ab4(lhs, rhs)));
}
