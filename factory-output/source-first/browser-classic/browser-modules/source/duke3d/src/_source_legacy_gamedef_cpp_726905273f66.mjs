// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/duke3d/src/gamedef.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
import { Alloc__cxx_static_e0036cfb06bcfe42 } from "../../build/src/smmalloc_generic.cpp.mjs";
import { __cxx_global_cell_5a1318d87ddacc87fafe95fb } from "./dnames.cpp.mjs";
import { __cxx_global_cell_14b7a7066c3f6d3c98286359 } from "./gamedef.cpp.mjs";
import { EventNames } from "./gamedef.cpp.mjs";
import { Free__cxx_static_0dfd3f42f0dc2c05 } from "../../build/src/smmalloc_generic.cpp.mjs";
import { G_Util_PtrToIdx2 } from "./savegame.cpp.mjs";
import { __cxx_global_cell_339d184e498655528e0449ea } from "./dnames.cpp.mjs";
import { Realloc__cxx_static_478d5da25b6b3923 } from "../../build/src/smmalloc_generic.cpp.mjs";
import { __cxx_global_cell_3e77304d50ec83937ff1f45c } from "./dnames.cpp.mjs";
import { SpriteDeletionQueue } from "./global.cpp.mjs";
import { VM_ScriptInfo } from "./gameexec.cpp.mjs";
import { aGameVars } from "./gamevars.cpp.mjs";
import { actorvartable } from "./gamedef.cpp.mjs";
import { __cxx_global_cell_38abf48ab8ba3db5fce877d9 } from "./global.cpp.mjs";
import { apScriptEvents } from "./gameexec.cpp.mjs";
import { apStrings } from "./global.cpp.mjs";
import { __cxx_global_cell_cc4a0559ddac06eb447295da } from "./gamedef.cpp.mjs";
import { __cxx_global_cell_84099bb478ae12489bd3cc37 } from "./gamedef.cpp.mjs";
import { clearDefNamePtr } from "../../build/src/common.cpp.mjs";
import { current_verbosity_cutoff } from "../../build/src/loguru.cpp.mjs";
import { __cxx_global_cell_9cec72372660080d153969ed } from "./global.cpp.mjs";
import { __cxx_global_cell_fa1a761ad63424391ef2eb7e } from "./global.cpp.mjs";
import { __cxx_global_cell_f0488c3aa4d43399b04094cf } from "./global.cpp.mjs";
import { __cxx_global_cell_64336b74df686a41ba0b80a3 } from "../../build/src/common.cpp.mjs";
import { __cxx_global_cell_c7396d09498f79f4675d125b } from "./global.cpp.mjs";
import { __cxx_global_cell_a9ed12f504f4bd101d4746c6 } from "./gamedef.cpp.mjs";
import { __cxx_global_cell_65816fd170522259e73c192a } from "./global.cpp.mjs";
import { __cxx_global_cell_312b58e8a14f852e3cc5e7e0 } from "./gamevars.cpp.mjs";
import { __cxx_global_cell_8406f8e86b0ce3102350571c } from "./gamevars.cpp.mjs";
import { __cxx_global_cell_35041d56fffbae8d2a330213 } from "./global.cpp.mjs";
import { __cxx_global_cell_98f0b1f570a2f6307c66c6f0 } from "./global.cpp.mjs";
import { __cxx_global_cell_6742302ef915e025d82bcd36 } from "./global.cpp.mjs";
import { __cxx_private_cell_c0d7a45cf66da756fe7006ee } from "./gamedef.cpp.mjs";
import { __cxx_global_cell_06245cf7a06b2fd69750f440 } from "./gamedef.cpp.mjs";
import { g_mapInfo } from "./global.cpp.mjs";
import { __cxx_global_cell_e9576a5286a0997ea679c8d5 } from "./global.cpp.mjs";
import { __cxx_global_cell_e75226e761a45fe1770321b0 } from "./global.cpp.mjs";
import { __cxx_global_cell_55c709d3278bbdef67186917 } from "./global.cpp.mjs";
import { __cxx_private_cell_fcad07c903c24c68027e9027 } from "./gamedef.cpp.mjs";
import { __cxx_global_cell_3b9a6643b5a8adfdd16c2c0e } from "./global.cpp.mjs";
import { __cxx_global_cell_14c7f525d32b0838223674c4 } from "./player.cpp.mjs";
import { __cxx_global_cell_30b06f32517f69cb2a10e60b } from "./player.cpp.mjs";
import { __cxx_global_cell_5cd4a87da022e338050a0e30 } from "./gamedef.cpp.mjs";
import { __cxx_global_cell_164a2be3133df4f0c234cae8 } from "./global.cpp.mjs";
import { g_player } from "./global.cpp.mjs";
import { __cxx_global_cell_bc77ba2124d9f9bdbae1a2b2 } from "./global.cpp.mjs";
import { __cxx_private_cell_8ebe202ae5fb6c8c9971153e } from "./gamedef.cpp.mjs";
import { __cxx_global_cell_c725c74fe2c9d83b97894533 } from "./global.cpp.mjs";
import { __cxx_private_cell_06390b4cc7aa0b9ca95fea1a } from "./gamedef.cpp.mjs";
import { __cxx_global_cell_428952e2c5a589c67db10fcc } from "./global.cpp.mjs";
import { __cxx_private_cell_1b72215e06b29e323e0d276a } from "./gamedef.cpp.mjs";
import { g_scriptFileName } from "./gamedef.cpp.mjs";
import { __cxx_global_cell_7c95f40343184c865284ca02 } from "./global.cpp.mjs";
import { __cxx_global_cell_3a4a097e79a13fa668e3fd57 } from "./global.cpp.mjs";
import { __cxx_global_cell_f7e268c20b879c2fe3740be6 } from "./gamedef.cpp.mjs";
import { __cxx_global_cell_af78946ba4f03068d5c18b7b } from "./global.cpp.mjs";
import { __cxx_global_cell_2519a794ef91626313d8500b } from "./global.cpp.mjs";
import { g_skillNames } from "./global.cpp.mjs";
import { __cxx_private_cell_f12cff23ac9a70d73719e4d2 } from "./gamedef.cpp.mjs";
import { __cxx_global_cell_11016d3c7177543e564ab46c } from "../../build/src/compat.cpp.mjs";
import { __cxx_global_cell_b1c97a6bfe6b79b1e897a68a } from "./global.cpp.mjs";
import { __cxx_global_cell_2bd4d302631cb2e7f9cab27e } from "./global.cpp.mjs";
import { __cxx_private_cell_501929f182a6e7eae833bc82 } from "./gamedef.cpp.mjs";
import { __cxx_private_cell_21fc654e30adb9e60fcf1a9d } from "./gamedef.cpp.mjs";
import { g_tile } from "./global.cpp.mjs";
import { __cxx_global_cell_bb57c023dc177e6059e96f1a } from "./global.cpp.mjs";
import { __cxx_global_cell_f06cc89b42ea26c6f8c956f2 } from "./global.cpp.mjs";
import { __cxx_global_cell_00e4d69d02c23b6c86678573 } from "./global.cpp.mjs";
import { g_volumeFlags } from "./global.cpp.mjs";
import { g_volumeNames } from "./global.cpp.mjs";
import { __cxx_global_cell_778291b6375dd09957e56c1b } from "./gamedef.cpp.mjs";
import { gamefunctions } from "./config.cpp.mjs";
import { globalvartable } from "./gamedef.cpp.mjs";
import { __cxx_private_cell_6e818e10e7fcc27dc3dc3c5b } from "./gamedef.cpp.mjs";
import { __cxx_global_cell_f0457d06edefc3c775e2c32f } from "./gamedef.cpp.mjs";
import { __cxx_global_cell_2d12a4ce62b5a2309382b8ea } from "./gamedef.cpp.mjs";
import { __cxx_private_cell_b56202585616aa9c65ec503a } from "./gamedef.cpp.mjs";
import { __cxx_private_cell_7d62d0a0be2f41b3d20f464b } from "./gamedef.cpp.mjs";
import { __cxx_private_cell_d49b43ec9df2e70e05088d24 } from "./gamedef.cpp.mjs";
import { __cxx_global_cell_d4103f960bb678857722381c } from "./gamedef.cpp.mjs";
import { __cxx_private_cell_adb3542f30964081065bc3c4 } from "./gamedef.cpp.mjs";
import { __cxx_private_cell_2c502a82220a36abae3ae2b2 } from "./gamedef.cpp.mjs";
import { handle_memerr } from "../../build/src/compat.cpp.mjs";
import { hash_add } from "../../build/src/hash.cpp.mjs";
import { hash_find } from "../../build/src/hash.cpp.mjs";
import { hash_findcase } from "../../build/src/hash.cpp.mjs";
import { hash_init } from "../../build/src/hash.cpp.mjs";
import { inthash_add } from "../../build/src/hash.cpp.mjs";
import { inthash_find } from "../../build/src/hash.cpp.mjs";
import { inthash_init } from "../../build/src/hash.cpp.mjs";
import { inttables } from "./gamedef.cpp.mjs";
import { isalnum } from "../../../browser-abi/libc_provider.mjs";
import { isdigit } from "../../../browser-abi/libc_provider.mjs";
import { isspace } from "../../../browser-abi/libc_provider.mjs";
import { isxdigit } from "../../../browser-abi/libc_provider.mjs";
import { iter_tokens } from "./gamedef.cpp.mjs";
import { keywords_for_private_opcodes } from "./gamedef.cpp.mjs";
import { __cxx_global_cell_1aca80e8b55c802f7b43740d } from "./global.cpp.mjs";
import { __cxx_global_cell_bb1aad227706ae6ec200fcf0 } from "./global.cpp.mjs";
import { __cxx_global_cell_ca786e7ce472b03dc90a2ec6 } from "./global.cpp.mjs";
import { loguru_log } from "../../../browser-abi/loguru_provider.mjs";
import { memcpy } from "../../../browser-abi/libc_provider.mjs";
import { memset } from "../../../browser-abi/libc_provider.mjs";
import { playervartable } from "./gamedef.cpp.mjs";
import { pow2char__header_global_9393851f0c146808 } from "./gamedef.cpp.mjs";
import { sscanf } from "../../../browser-abi/libc_provider.mjs";
import { stat } from "../../../browser-abi/libc_provider.mjs";
import { strcat } from "../../../browser-abi/libc_provider.mjs";
import { strcmp } from "../../../browser-abi/libc_provider.mjs";
import { strcpy } from "../../../browser-abi/libc_provider.mjs";
import { strlen } from "../../../browser-abi/libc_provider.mjs";
import { strncmp } from "../../../browser-abi/libc_provider.mjs";
import { strncpy } from "../../../browser-abi/libc_provider.mjs";
import { strtoll } from "../../../browser-abi/libc_provider.mjs";
import { tables } from "./gamedef.cpp.mjs";
import { tempbuf } from "./global.cpp.mjs";
import { __cxx_private_cell_e2c5808de82af938e5d43808 } from "./gamedef.cpp.mjs";
import { tolower } from "../../../browser-abi/libc_provider.mjs";
import { __cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba } from "./global.cpp.mjs";
import { varvartable } from "./gamedef.cpp.mjs";
import { vm_keywords } from "./gamedef.cpp.mjs";
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
// C/C++ source: source/duke3d/src/gamedef.cpp:103
const __cxx_literal_5890739310ab7a385d9c = Uint8Array.from([97, 99, 116, 105, 111, 110, 0]);
const __cxx_literal_7f619029c3aa00ebe34b = Uint8Array.from([97, 99, 116, 111, 114, 0]);
const __cxx_literal_94c8a614e8f08a895fe3 = Uint8Array.from([97, 105, 0]);
const __cxx_literal_e0ab8ebac94497068a55 = Uint8Array.from([100, 101, 102, 105, 110, 101, 0]);
const __cxx_literal_da02280d0b8aa1d25687 = Uint8Array.from([101, 118, 101, 110, 116, 0]);
const __cxx_literal_04287a1c27c83d932e1a = Uint8Array.from([109, 111, 118, 101, 0]);
const __cxx_literal_5ec0644abb441baba301 = Uint8Array.from([115, 116, 97, 116, 101, 0]);
let __static_C_GetLabelType_LabelType = cByteRecordNDArray({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, [7], {}, [cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_5890739310ab7a385d9c, "val": i32(1)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_7f619029c3aa00ebe34b, "val": i32(2)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_94c8a614e8f08a895fe3, "val": i32(4)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_e0ab8ebac94497068a55, "val": i32(8)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_da02280d0b8aa1d25687, "val": i32(16)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_04287a1c27c83d932e1a, "val": i32(32)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_5ec0644abb441baba301, "val": i32(64)}, null, {})]);
const __cxx_literal_d2c7b0a641a968bbce3a = Uint8Array.from([32, 111, 114, 32, 0]);
export function C_GetLabelType(type) {

  let x = (() => { const v = new Uint8Array(64); v.set([]); return v; })();
  {
    const __cxx_range_array_0 = __static_C_GetLabelType_LabelType;
    if (__cxx_range_array_0.length !== 7) throw new RangeError("C array extent mismatch");
    for (let __cxx_range_index_0 = 0; __cxx_range_index_0 < 7; ++__cxx_range_index_0) {
      if ((i32((type & __cxx_range_array_0[__cxx_range_index_0].val)) != __cxx_range_array_0[__cxx_range_index_0].val)) {
        continue;
      }
      if (Boolean((cDeref(cPointerOffset(x, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value))) {
        strcat(x, __cxx_literal_d2c7b0a641a968bbce3a);
      }
      strcat(x, __cxx_range_array_0[__cxx_range_index_0].token);
      if ((type == __cxx_range_array_0[__cxx_range_index_0].val)) {
        break;
      }
    }
  }
  return xstrdup__header_57e322b3fc9a(x);
}

// C/C++ source: source/duke3d/src/gamedef.cpp:882
const __cxx_literal_c8e3965335d0e26af36c = Uint8Array.from([60, 117, 110, 107, 110, 111, 119, 110, 32, 105, 110, 115, 116, 114, 117, 99, 116, 105, 111, 110, 62, 0]);
export function VM_GetKeywordForID(id) {
  {
    const __cxx_range_array_0 = vm_keywords;
    if (__cxx_range_array_0.length !== 516) throw new RangeError("C array extent mismatch");
    for (let __cxx_range_index_0 = 0; __cxx_range_index_0 < 516; ++__cxx_range_index_0) {
      if ((__cxx_range_array_0[__cxx_range_index_0].val == id)) {
        return __cxx_range_array_0[__cxx_range_index_0].token;
      }
    }
  }
  {
    const __cxx_range_array_1 = keywords_for_private_opcodes;
    if (__cxx_range_array_1.length !== 12) throw new RangeError("C array extent mismatch");
    for (let __cxx_range_index_1 = 0; __cxx_range_index_1 < 12; ++__cxx_range_index_1) {
      if ((__cxx_range_array_1[__cxx_range_index_1].val == id)) {
        return __cxx_range_array_1[__cxx_range_index_1].token;
      }
    }
  }
  return __cxx_literal_c8e3965335d0e26af36c;
}

// C/C++ source: source/duke3d/src/gamedef.cpp:1072
const __cxx_literal_d08f008acd5e43bf1191 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 100, 101, 102, 46, 99, 112, 112, 0]);
const __cxx_literal_ae83889b003193f3d6fe = Uint8Array.from([73, 110, 116, 101, 114, 110, 97, 108, 32, 99, 111, 109, 112, 105, 108, 101, 114, 32, 101, 114, 114, 111, 114, 32, 97, 116, 32, 37, 100, 32, 40, 48, 120, 37, 120, 41, 0]);
const __cxx_literal_c4b3d5c4a034634f24a9 = Uint8Array.from([82, 101, 108, 111, 99, 97, 116, 101, 100, 32, 99, 111, 109, 112, 105, 108, 101, 100, 32, 99, 111, 100, 101, 32, 102, 114, 111, 109, 32, 48, 120, 37, 48, 56, 108, 120, 32, 116, 111, 32, 48, 120, 37, 48, 56, 108, 120, 0]);
export function C_SetScriptSize(newsize) {
  const __cxx_lvalue_0 = cRef(() => newsize, __cxx_lvalue_10 => { newsize = i32(__cxx_lvalue_10); });
  for (let i = i32(0); (i < i32((__cxx_global_cell_3a4a097e79a13fa668e3fd57().value - 1))); ((__cxx_lvalue_1) => { const previous = __cxx_lvalue_1.value; const next = i32((previous + 1)); __cxx_lvalue_1.value = next; return next; })(cRef(() => i, __cxx_lvalue_2 => { i = __cxx_lvalue_2; }))) {
    if (bitmap_test__header_5cc6c8232c10(__cxx_global_cell_cc4a0559ddac06eb447295da().value, i)) {
      if ((((cDeref(cPointerOffset(__cxx_global_cell_38abf48ab8ba3db5fce877d9().value, i, BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array).value) < i64(cSourceAddresses.encode(__cxx_global_cell_38abf48ab8ba3db5fce877d9().value))) || ((cDeref(cPointerOffset(__cxx_global_cell_38abf48ab8ba3db5fce877d9().value, i, BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array).value) > i64(cSourceAddresses.encode(__cxx_global_cell_7c95f40343184c865284ca02().value))))) {
        ((__cxx_lvalue_3) => { const previous = __cxx_lvalue_3.value; const next = i32((previous + 1)); __cxx_lvalue_3.value = next; return previous; })(__cxx_global_cell_a9ed12f504f4bd101d4746c6());
        ((i32(-2) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-2), __cxx_literal_d08f008acd5e43bf1191, u32(1081), __cxx_literal_ae83889b003193f3d6fe, i, i));
        VM_ScriptInfo(cPointerOffset(__cxx_global_cell_38abf48ab8ba3db5fce877d9().value, i, BigInt64Array.BYTES_PER_ELEMENT), 16);
      } else {
        ((__cxx_lvalue_4) => (__cxx_lvalue_4.value = i64((BigInt(__cxx_lvalue_4.value) - BigInt(i64(cSourceAddresses.encode(__cxx_global_cell_38abf48ab8ba3db5fce877d9().value)))))))(cDeref(cPointerOffset(__cxx_global_cell_38abf48ab8ba3db5fce877d9().value, i, BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array));
      }
    }
  }
  G_Util_PtrToIdx2(cObjectFieldRef((cPointerElementRef(cRecordPointer(g_tile, {"align": 8, "arrayAlign": 1, "fields": {"cacherange": {"native": "Int32Array", "offset": 36, "size": 4}, "defproj": {"offset": 24, "pointer": true, "size": 8}, "execPtr": {"offset": 0, "pointer": true, "size": 8}, "flags": {"native": "Uint32Array", "offset": 32, "size": 4}, "loadPtr": {"offset": 8, "pointer": true, "size": 8}, "proj": {"offset": 16, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {}), 0).value), "execPtr"), 30720, 40, __cxx_global_cell_38abf48ab8ba3db5fce877d9().value, i32(2));
  G_Util_PtrToIdx2(cObjectFieldRef((cPointerElementRef(cRecordPointer(g_tile, {"align": 8, "arrayAlign": 1, "fields": {"cacherange": {"native": "Int32Array", "offset": 36, "size": 4}, "defproj": {"offset": 24, "pointer": true, "size": 8}, "execPtr": {"offset": 0, "pointer": true, "size": 8}, "flags": {"native": "Uint32Array", "offset": 32, "size": 4}, "loadPtr": {"offset": 8, "pointer": true, "size": 8}, "proj": {"offset": 16, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {}), 0).value), "loadPtr"), 30720, 40, __cxx_global_cell_38abf48ab8ba3db5fce877d9().value, i32(2));
  let old_bitptr_size = u64((BigInt(u64(i32((i32((i32((__cxx_global_cell_3a4a097e79a13fa668e3fd57().value + 7)) >> 3)) + 1)))) * BigInt(1)));
  let new_bitptr_size = u64((BigInt(u64(i32((i32((i32((newsize + 7)) >> 3)) + 1)))) * BigInt(1)));
  let newscript = cTypedPointer(xrealloc__header_d10105957532(__cxx_global_cell_38abf48ab8ba3db5fce877d9().value, u64((BigInt(u64(newsize)) * BigInt(8)))), BigInt64Array);
  (__cxx_global_cell_cc4a0559ddac06eb447295da().value = cTypedPointer(xrealloc__header_d10105957532(__cxx_global_cell_cc4a0559ddac06eb447295da().value, new_bitptr_size), Uint8Array));
  (__cxx_global_cell_84099bb478ae12489bd3cc37().value = cTypedPointer(xrealloc__header_d10105957532(__cxx_global_cell_84099bb478ae12489bd3cc37().value, new_bitptr_size), Uint8Array));
  if ((newsize > __cxx_global_cell_3a4a097e79a13fa668e3fd57().value)) {
    memset(cPointerOffset(newscript, __cxx_global_cell_3a4a097e79a13fa668e3fd57().value, BigInt64Array.BYTES_PER_ELEMENT), 0, u64((BigInt(u64(i32((newsize - __cxx_global_cell_3a4a097e79a13fa668e3fd57().value)))) * BigInt(8))));
    memset(cPointerOffset(__cxx_global_cell_cc4a0559ddac06eb447295da().value, old_bitptr_size, Uint8Array.BYTES_PER_ELEMENT), 0, u64((BigInt(new_bitptr_size) - BigInt(old_bitptr_size))));
    memset(cPointerOffset(__cxx_global_cell_84099bb478ae12489bd3cc37().value, old_bitptr_size, Uint8Array.BYTES_PER_ELEMENT), 0, u64((BigInt(new_bitptr_size) - BigInt(old_bitptr_size))));
  }
  if (cPointerCompare(__cxx_global_cell_38abf48ab8ba3db5fce877d9().value, newscript, "!=")) {
    do {
      SILENCE_UNUSED__header_19ce759deb00(__cxx_literal_c4b3d5c4a034634f24a9, ((__cxx_lvalue_5) => cRef(() => __cxx_lvalue_5, () => { throw new TypeError("const C++ reference write"); }))(u64(cSourceAddresses.encode(__cxx_global_cell_38abf48ab8ba3db5fce877d9().value))), ((__cxx_lvalue_6) => cRef(() => __cxx_lvalue_6, () => { throw new TypeError("const C++ reference write"); }))(u64(cSourceAddresses.encode(newscript))));
    } while (Boolean(0));
    (__cxx_global_cell_7c95f40343184c865284ca02().value = cPointerOffset(newscript, cPointerDiff(__cxx_global_cell_7c95f40343184c865284ca02().value, __cxx_global_cell_38abf48ab8ba3db5fce877d9().value, BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array.BYTES_PER_ELEMENT));
    (__cxx_global_cell_38abf48ab8ba3db5fce877d9().value = newscript);
  }
  let smallestSize = i32((min__template_774131ccff66371d(__cxx_global_cell_3a4a097e79a13fa668e3fd57(), __cxx_lvalue_0)).value);
  for (let i = i32(0); (i < i32((smallestSize - 1))); ((__cxx_lvalue_7) => { const previous = __cxx_lvalue_7.value; const next = i32((previous + 1)); __cxx_lvalue_7.value = next; return next; })(cRef(() => i, __cxx_lvalue_8 => { i = __cxx_lvalue_8; }))) {
    if (bitmap_test__header_5cc6c8232c10(__cxx_global_cell_cc4a0559ddac06eb447295da().value, i)) {
      ((__cxx_lvalue_9) => (__cxx_lvalue_9.value = i64((BigInt(__cxx_lvalue_9.value) + BigInt(i64(cSourceAddresses.encode(__cxx_global_cell_38abf48ab8ba3db5fce877d9().value)))))))(cDeref(cPointerOffset(__cxx_global_cell_38abf48ab8ba3db5fce877d9().value, i, BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array));
    }
  }
  (__cxx_global_cell_3a4a097e79a13fa668e3fd57().value = i32(newsize));
  G_Util_PtrToIdx2(cObjectFieldRef((cPointerElementRef(cRecordPointer(g_tile, {"align": 8, "arrayAlign": 1, "fields": {"cacherange": {"native": "Int32Array", "offset": 36, "size": 4}, "defproj": {"offset": 24, "pointer": true, "size": 8}, "execPtr": {"offset": 0, "pointer": true, "size": 8}, "flags": {"native": "Uint32Array", "offset": 32, "size": 4}, "loadPtr": {"offset": 8, "pointer": true, "size": 8}, "proj": {"offset": 16, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {}), 0).value), "execPtr"), 30720, 40, __cxx_global_cell_38abf48ab8ba3db5fce877d9().value, i32(3));
  G_Util_PtrToIdx2(cObjectFieldRef((cPointerElementRef(cRecordPointer(g_tile, {"align": 8, "arrayAlign": 1, "fields": {"cacherange": {"native": "Int32Array", "offset": 36, "size": 4}, "defproj": {"offset": 24, "pointer": true, "size": 8}, "execPtr": {"offset": 0, "pointer": true, "size": 8}, "flags": {"native": "Uint32Array", "offset": 32, "size": 4}, "loadPtr": {"offset": 8, "pointer": true, "size": 8}, "proj": {"offset": 16, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {}), 0).value), "loadPtr"), 30720, 40, __cxx_global_cell_38abf48ab8ba3db5fce877d9().value, i32(3));
}

// C/C++ source: source/duke3d/src/gamedef.cpp:1127
export function ispecial(c) {
  return Boolean((((((((i32(c) == i32(32)) || (i32(c) == 13)) || (i32(c) == i32(40))) || (i32(c) == i32(41))) || (i32(c) == i32(44))) || (i32(c) == i32(59))) || (i32(c) == 10)));
}

// C/C++ source: source/duke3d/src/gamedef.cpp:1133
export function scriptSkipLine() {
  while ((((i32((cDeref(__cxx_private_cell_e2c5808de82af938e5d43808().value, Uint8Array).value)) != 10) && (i32((cDeref(__cxx_private_cell_e2c5808de82af938e5d43808().value, Uint8Array).value)) != 13)) && (i32((cDeref(__cxx_private_cell_e2c5808de82af938e5d43808().value, Uint8Array).value)) != 0))) {
    ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_0.value = next; return previous; })(__cxx_private_cell_e2c5808de82af938e5d43808());
  }
}

// C/C++ source: source/duke3d/src/gamedef.cpp:1139
export function scriptSkipSpaces() {
  while (((i32((cDeref(__cxx_private_cell_e2c5808de82af938e5d43808().value, Uint8Array).value)) == i32(32)) || (i32((cDeref(__cxx_private_cell_e2c5808de82af938e5d43808().value, Uint8Array).value)) == i32(9)))) {
    ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_0.value = next; return previous; })(__cxx_private_cell_e2c5808de82af938e5d43808());
  }
}

// C/C++ source: source/duke3d/src/gamedef.cpp:1145
const __cxx_literal_feea83f5f5ea3748df28 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 100, 101, 102, 46, 99, 112, 112, 0]);
const __cxx_literal_bd05eb777101b8099357 = Uint8Array.from([37, 115, 58, 37, 100, 58, 32, 103, 111, 116, 32, 99, 111, 109, 109, 101, 110, 116, 46, 0]);
const __cxx_literal_b4c7148d96f503fb9bbc = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 100, 101, 102, 46, 99, 112, 112, 0]);
const __cxx_literal_886a4272eb04be5d96ce = Uint8Array.from([37, 115, 58, 37, 100, 58, 32, 103, 111, 116, 32, 115, 116, 97, 114, 116, 32, 111, 102, 32, 99, 111, 109, 109, 101, 110, 116, 32, 98, 108, 111, 99, 107, 46, 0]);
const __cxx_literal_e6cd39e9f1cf0155519b = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 100, 101, 102, 46, 99, 112, 112, 0]);
const __cxx_literal_810202bbf0ac367baf59 = Uint8Array.from([37, 115, 58, 37, 100, 58, 32, 69, 79, 70, 32, 105, 110, 32, 99, 111, 109, 109, 101, 110, 116, 33, 0]);
const __cxx_literal_6ea54444c20bebaa7c5c = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 100, 101, 102, 46, 99, 112, 112, 0]);
const __cxx_literal_21179bbc5e4151add080 = Uint8Array.from([37, 115, 58, 37, 100, 58, 32, 102, 111, 117, 110, 100, 32, 39, 47, 42, 39, 32, 119, 105, 116, 104, 32, 110, 111, 32, 39, 42, 47, 39, 46, 0]);
const __cxx_literal_0028152db38eaf6bce6a = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 100, 101, 102, 46, 99, 112, 112, 0]);
const __cxx_literal_b54f19986d7e0aca85fd = Uint8Array.from([37, 115, 58, 37, 100, 58, 32, 103, 111, 116, 32, 101, 110, 100, 32, 111, 102, 32, 99, 111, 109, 109, 101, 110, 116, 32, 98, 108, 111, 99, 107, 46, 0]);
const __cxx_literal_bf259a7e6843f5dc85c3 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 100, 101, 102, 46, 99, 112, 112, 0]);
const __cxx_literal_f7f79f6eb3d21ca8f224 = Uint8Array.from([37, 115, 58, 37, 100, 58, 32, 109, 97, 108, 102, 111, 114, 109, 101, 100, 32, 99, 111, 109, 109, 101, 110, 116, 46, 0]);
export function C_SkipComments() {
  do {
    switch (i32((cDeref(__cxx_private_cell_e2c5808de82af938e5d43808().value, Uint8Array).value))) {
      case i32(10): {
        ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(__cxx_global_cell_06245cf7a06b2fd69750f440());
      }
      ;
      case i32(32):
      case i32(9):
      case i32(13):
      case 26: {
        ((__cxx_lvalue_1) => { const previous = __cxx_lvalue_1.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_1.value = next; return previous; })(__cxx_private_cell_e2c5808de82af938e5d43808());
      }
      break;
      case i32(47): {
        switch (i32((cDeref(cPointerOffset(__cxx_private_cell_e2c5808de82af938e5d43808().value, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value))) {
          case i32(47): {
            if ((((__cxx_global_cell_428952e2c5a589c67db10fcc().value > 1) && (!Boolean(__cxx_global_cell_a9ed12f504f4bd101d4746c6().value))) && (!Boolean(__cxx_global_cell_778291b6375dd09957e56c1b().value)))) {
              ((i32(10) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(10), __cxx_literal_feea83f5f5ea3748df28, u32(1165), __cxx_literal_bd05eb777101b8099357, g_scriptFileName, __cxx_global_cell_06245cf7a06b2fd69750f440().value));
            }
          }
          scriptSkipLine();
          continue;
          case i32(42): {
            if ((((__cxx_global_cell_428952e2c5a589c67db10fcc().value > 1) && (!Boolean(__cxx_global_cell_a9ed12f504f4bd101d4746c6().value))) && (!Boolean(__cxx_global_cell_778291b6375dd09957e56c1b().value)))) {
              ((i32(10) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(10), __cxx_literal_b4c7148d96f503fb9bbc, u32(1170), __cxx_literal_886a4272eb04be5d96ce, g_scriptFileName, __cxx_global_cell_06245cf7a06b2fd69750f440().value));
            }
          }
          do {
            if ((i32((cDeref(__cxx_private_cell_e2c5808de82af938e5d43808().value, Uint8Array).value)) == i32(10))) {
              ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i32((previous + 1)); __cxx_lvalue_2.value = next; return previous; })(__cxx_global_cell_06245cf7a06b2fd69750f440());
            }
            ((__cxx_lvalue_3) => { const previous = __cxx_lvalue_3.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_3.value = next; return previous; })(__cxx_private_cell_e2c5808de82af938e5d43808());
          } while ((Boolean((cDeref(__cxx_private_cell_e2c5808de82af938e5d43808().value, Uint8Array).value)) && ((i32((cDeref(cPointerOffset(__cxx_private_cell_e2c5808de82af938e5d43808().value, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) != i32(42)) || (i32((cDeref(cPointerOffset(__cxx_private_cell_e2c5808de82af938e5d43808().value, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) != i32(47)))));
          if ((!Boolean((cDeref(__cxx_private_cell_e2c5808de82af938e5d43808().value, Uint8Array).value)))) {
            if (((!(Boolean(__cxx_global_cell_a9ed12f504f4bd101d4746c6().value) || Boolean(__cxx_global_cell_778291b6375dd09957e56c1b().value))) && Boolean(__cxx_global_cell_428952e2c5a589c67db10fcc().value))) {
              ((i32(10) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(10), __cxx_literal_e6cd39e9f1cf0155519b, u32(1182), __cxx_literal_810202bbf0ac367baf59, g_scriptFileName, __cxx_global_cell_06245cf7a06b2fd69750f440().value));
            }
            C_ReportError((-1));
            ((i32(-2) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-2), __cxx_literal_6ea54444c20bebaa7c5c, u32(1184), __cxx_literal_21179bbc5e4151add080, g_scriptFileName, __cxx_global_cell_06245cf7a06b2fd69750f440().value));
            (__cxx_private_cell_06390b4cc7aa0b9ca95fea1a().value = i64((__cxx_private_cell_fcad07c903c24c68027e9027().value = i32((__cxx_private_cell_8ebe202ae5fb6c8c9971153e().value = i32(0))))));
            ((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = i32((previous + 1)); __cxx_lvalue_4.value = next; return previous; })(__cxx_global_cell_a9ed12f504f4bd101d4746c6());
            continue;
          }
          if ((((__cxx_global_cell_428952e2c5a589c67db10fcc().value > 1) && (!Boolean(__cxx_global_cell_a9ed12f504f4bd101d4746c6().value))) && (!Boolean(__cxx_global_cell_778291b6375dd09957e56c1b().value)))) {
            ((i32(10) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(10), __cxx_literal_0028152db38eaf6bce6a, u32(1191), __cxx_literal_b54f19986d7e0aca85fd, g_scriptFileName, __cxx_global_cell_06245cf7a06b2fd69750f440().value));
          }
          (__cxx_private_cell_e2c5808de82af938e5d43808().value = cPointerOffset(__cxx_private_cell_e2c5808de82af938e5d43808().value, 2, Uint8Array.BYTES_PER_ELEMENT));
          continue;
          default: {
            C_ReportError((-1));
          }
          ((i32(-2) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-2), __cxx_literal_bf259a7e6843f5dc85c3, u32(1197), __cxx_literal_f7f79f6eb3d21ca8f224, g_scriptFileName, __cxx_global_cell_06245cf7a06b2fd69750f440().value));
          scriptSkipLine();
          ((__cxx_lvalue_5) => { const previous = __cxx_lvalue_5.value; const next = i32((previous + 1)); __cxx_lvalue_5.value = next; return previous; })(__cxx_global_cell_a9ed12f504f4bd101d4746c6());
          continue;
        }
      }
      break;
      default: {
        if (ispecial((cDeref(__cxx_private_cell_e2c5808de82af938e5d43808().value, Uint8Array).value))) {
          ((__cxx_lvalue_6) => { const previous = __cxx_lvalue_6.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_6.value = next; return previous; })(__cxx_private_cell_e2c5808de82af938e5d43808());
          continue;
        }
      }
      ;
      case 0: {
        return;
      }
    }
  } while (Boolean(1));
}

// C/C++ source: source/duke3d/src/gamedef.cpp:1218
export function GetDefID(label) {
  return i32(hash_find(__cxx_global_cell_2d12a4ce62b5a2309382b8ea().value, label));
}

// C/C++ source: source/duke3d/src/gamedef.cpp:1219
export function GetADefID(label) {
  return i32(hash_find(__cxx_global_cell_f0457d06edefc3c775e2c32f().value, label));
}

// C/C++ source: source/duke3d/src/gamedef.cpp:1222
export function isaltok(c) {
  return Boolean(((((((((Boolean(isalnum(i32(c))) || (i32(c) == i32(123))) || (i32(c) == i32(125))) || (i32(c) == i32(47))) || (i32(c) == i32(92))) || (i32(c) == i32(42))) || (i32(c) == i32(45))) || (i32(c) == i32(95))) || (i32(c) == i32(46))));
}

// C/C++ source: source/duke3d/src/gamedef.cpp:1228
export function isdigterm(c) {
  return Boolean(((((((((((Boolean(isspace(i32(c))) || (i32(c) == i32(123))) || (i32(c) == i32(125))) || (i32(c) == i32(91))) || (i32(c) == i32(93))) || (i32(c) == i32(47))) || (i32(c) == i32(44))) || (i32(c) == i32(58))) || (i32(c) == i32(46))) || (i32(c) == i32(59))) || (i32(c) == i32(0))));
}

// C/C++ source: source/duke3d/src/gamedef.cpp:1233
export function C_IsLabelChar(c, i) {
  return Boolean(((((Boolean(isalnum(i32(c))) || (i32(c) == i32(95))) || (i32(c) == i32(42))) || (i32(c) == i32(63))) || ((i > 0) && ((i32(c) == i32(43)) || (i32(c) == i32(45))))));
}

// C/C++ source: source/duke3d/src/gamedef.cpp:1238
export function C_GetLabelNameID(pLabel, table, psz) {
  let l = i32(hash_findcase(table, psz));
  return i32(((l >= 0) ? i32((cPointerElementRef(cRecordPointer(pLabel, {"align": 8, "arrayAlign": 1, "fields": {"flags": {"native": "Uint16Array", "offset": 10, "size": 2}, "lId": {"native": "Int16Array", "offset": 8, "size": 2}, "maxParm2": {"native": "Int16Array", "offset": 12, "size": 2}, "name": {"offset": 0, "pointer": true, "size": 8}, "offset": {"native": "Int16Array", "offset": 14, "size": 2}}, "overlaps": false, "size": 16, "union": false}, {}), l).value).lId) : (-1)));
}

// C/C++ source: source/duke3d/src/gamedef.cpp:1247
export function C_GetLabelNameOffset(table, psz) {
  return i32(hash_findcase(table, psz));
}

// C/C++ source: source/duke3d/src/gamedef.cpp:1289
export function scriptWriteValue(value) {
  let index = i64(cPointerDiff(__cxx_global_cell_7c95f40343184c865284ca02().value, __cxx_global_cell_38abf48ab8ba3db5fce877d9().value, BigInt64Array.BYTES_PER_ELEMENT));
  bitmap_clear__header_fe7b22c48bc9(__cxx_global_cell_cc4a0559ddac06eb447295da().value, i32(index));
  bitmap_clear__header_fe7b22c48bc9(__cxx_global_cell_84099bb478ae12489bd3cc37().value, i32(index));
  ((cDeref(((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = cPointerOffset(previous, 1, BigInt64Array.BYTES_PER_ELEMENT); __cxx_lvalue_0.value = next; return previous; })(__cxx_global_cell_7c95f40343184c865284ca02()), BigInt64Array).value) = i64(value));
}

// C/C++ source: source/duke3d/src/gamedef.cpp:1298
export function scriptWriteAtOffset(value, addr) {
  let index = i64(cPointerDiff(addr, __cxx_global_cell_38abf48ab8ba3db5fce877d9().value, BigInt64Array.BYTES_PER_ELEMENT));
  bitmap_clear__header_fe7b22c48bc9(__cxx_global_cell_cc4a0559ddac06eb447295da().value, i32(index));
  bitmap_clear__header_fe7b22c48bc9(__cxx_global_cell_84099bb478ae12489bd3cc37().value, i32(index));
  ((cDeref(addr, BigInt64Array).value) = i64(value));
}

// C/C++ source: source/duke3d/src/gamedef.cpp:1306
export function scriptWritePointer(value, addr) {
  let index = i64(cPointerDiff(addr, __cxx_global_cell_38abf48ab8ba3db5fce877d9().value, BigInt64Array.BYTES_PER_ELEMENT));
  bitmap_set__header_da3c41727d5a(__cxx_global_cell_cc4a0559ddac06eb447295da().value, i32(index));
  bitmap_clear__header_fe7b22c48bc9(__cxx_global_cell_84099bb478ae12489bd3cc37().value, i32(index));
  ((cDeref(addr, BigInt64Array).value) = i64(value));
}

// C/C++ source: source/duke3d/src/gamedef.cpp:1314
export function scriptWriteStateLocation(value, addr) {
  let index = i64(cPointerDiff(addr, __cxx_global_cell_38abf48ab8ba3db5fce877d9().value, BigInt64Array.BYTES_PER_ELEMENT));
  bitmap_clear__header_fe7b22c48bc9(__cxx_global_cell_cc4a0559ddac06eb447295da().value, i32(index));
  bitmap_set__header_da3c41727d5a(__cxx_global_cell_84099bb478ae12489bd3cc37().value, i32(index));
  ((cDeref(addr, BigInt64Array).value) = i64(value));
}

// C/C++ source: source/duke3d/src/gamedef.cpp:1337
export function C_GetKeyword() {
  C_SkipComments();
  let temptextptr = __cxx_private_cell_e2c5808de82af938e5d43808().value;
  if ((i32((cDeref(temptextptr, Uint8Array).value)) == 0)) {
    return i32((-2));
  }
  while ((i32(isaltok((cDeref(temptextptr, Uint8Array).value))) == 0)) {
    ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_0.value = next; return previous; })(cRef(() => temptextptr, __cxx_lvalue_1 => { temptextptr = __cxx_lvalue_1; }));
    if ((i32((cDeref(temptextptr, Uint8Array).value)) == 0)) {
      return i32(0);
    }
  }
  let i = i32(0);
  while (isaltok((cDeref(temptextptr, Uint8Array).value))) {
    ((cDeref(cPointerOffset(tempbuf, ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i32((previous + 1)); __cxx_lvalue_2.value = next; return previous; })(cRef(() => i, __cxx_lvalue_3 => { i = __cxx_lvalue_3; })), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((cDeref(((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_4.value = next; return previous; })(cRef(() => temptextptr, __cxx_lvalue_5 => { temptextptr = __cxx_lvalue_5; })), Uint8Array).value)) & 255));
  }
  ((cDeref(cPointerOffset(tempbuf, i, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(0) & 255)) & 255));
  return i32(hash_find(__cxx_private_cell_d49b43ec9df2e70e05088d24().value, tempbuf));
}

// C/C++ source: source/duke3d/src/gamedef.cpp:1362
const __cxx_literal_d0a11986c26f6dccfaa8 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 100, 101, 102, 46, 99, 112, 112, 0]);
const __cxx_literal_403f791f655c2a8ad67f = Uint8Array.from([37, 115, 58, 37, 100, 58, 32, 107, 101, 121, 119, 111, 114, 100, 32, 39, 37, 115, 39, 46, 0]);
const __cxx_literal_c671154d353c2b546f0c = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 100, 101, 102, 46, 99, 112, 112, 0]);
const __cxx_literal_d3f6c2f0feeff69b7f13 = Uint8Array.from([37, 115, 58, 37, 100, 58, 32, 101, 120, 112, 101, 99, 116, 101, 100, 32, 119, 104, 105, 116, 101, 115, 112, 97, 99, 101, 32, 98, 101, 116, 119, 101, 101, 110, 32, 39, 37, 99, 39, 32, 97, 110, 100, 32, 39, 37, 115, 39, 46, 0]);
export function C_GetNextKeyword() {
  C_SkipComments();
  if ((i32((cDeref(__cxx_private_cell_e2c5808de82af938e5d43808().value, Uint8Array).value)) == 0)) {
    return i32((-2));
  }
  let l = i32(0);
  while (isaltok((cDeref(cPointerOffset(__cxx_private_cell_e2c5808de82af938e5d43808().value, l, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value))) {
    ((cDeref(cPointerOffset(tempbuf, l, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((cDeref(cPointerOffset(__cxx_private_cell_e2c5808de82af938e5d43808().value, l, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
    ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => l, __cxx_lvalue_1 => { l = __cxx_lvalue_1; }));
  }
  ((cDeref(cPointerOffset(tempbuf, l, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(0) & 255)) & 255));
  let i;
  if (((i = i32(hash_find(__cxx_private_cell_d49b43ec9df2e70e05088d24().value, tempbuf))) >= 0)) {
    if ((((i == i32(68)) || (i == i32(69))) || (i == i32(282)))) {
      scriptWriteValue(i32((i32((i | i32((__cxx_global_cell_06245cf7a06b2fd69750f440().value << 12)))) | i32((1 << 31)))));
    } else {
      scriptWriteValue(i32((i | i32((__cxx_global_cell_06245cf7a06b2fd69750f440().value << 12)))));
    }
    (__cxx_private_cell_e2c5808de82af938e5d43808().value = cPointerOffset(__cxx_private_cell_e2c5808de82af938e5d43808().value, l, Uint8Array.BYTES_PER_ELEMENT));
    if (((!(Boolean(__cxx_global_cell_a9ed12f504f4bd101d4746c6().value) || Boolean(__cxx_global_cell_778291b6375dd09957e56c1b().value))) && Boolean(__cxx_global_cell_428952e2c5a589c67db10fcc().value))) {
      ((i32(10) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(10), __cxx_literal_d0a11986c26f6dccfaa8, u32(1386), __cxx_literal_403f791f655c2a8ad67f, g_scriptFileName, __cxx_global_cell_06245cf7a06b2fd69750f440().value, tempbuf));
    }
    return i32(i);
  }
  (__cxx_private_cell_e2c5808de82af938e5d43808().value = cPointerOffset(__cxx_private_cell_e2c5808de82af938e5d43808().value, l, Uint8Array.BYTES_PER_ELEMENT));
  ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i32((previous + 1)); __cxx_lvalue_2.value = next; return previous; })(__cxx_global_cell_a9ed12f504f4bd101d4746c6());
  if ((((i32((cDeref(cPointerOffset(tempbuf, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == i32(123)) || (i32((cDeref(cPointerOffset(tempbuf, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == i32(125))) && (i32((cDeref(cPointerOffset(tempbuf, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) != 0))) {
    C_ReportError((-1));
    ((i32(-2) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-2), __cxx_literal_c671154d353c2b546f0c, u32(1396), __cxx_literal_d3f6c2f0feeff69b7f13, g_scriptFileName, __cxx_global_cell_06245cf7a06b2fd69750f440().value, i32((cDeref(cPointerOffset(tempbuf, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)), cPointerOffset(tempbuf, 1, Uint8Array.BYTES_PER_ELEMENT)));
  } else {
    C_ReportError(i32(3));
  }
  return i32((-1));
}

// C/C++ source: source/duke3d/src/gamedef.cpp:1403
const __cxx_literal_ffe9b53e90b5d20f1fc3 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 100, 101, 102, 46, 99, 112, 112, 0]);
const __cxx_literal_43ac3d772e3cf68b6aec = Uint8Array.from([37, 115, 58, 37, 100, 58, 32, 110, 117, 109, 98, 101, 114, 32, 111, 117, 116, 32, 111, 102, 32, 116, 104, 101, 32, 114, 97, 110, 103, 101, 32, 111, 102, 32, 97, 32, 51, 50, 45, 98, 105, 116, 32, 105, 110, 116, 101, 103, 101, 114, 32, 101, 110, 99, 111, 117, 110, 116, 101, 114, 101, 100, 46, 0]);
const __cxx_literal_a8b50773c5893a2624f6 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 100, 101, 102, 46, 99, 112, 112, 0]);
const __cxx_literal_e8d5a0856bcea03e9caa = Uint8Array.from([37, 115, 58, 37, 100, 58, 32, 105, 110, 118, 97, 108, 105, 100, 32, 99, 104, 97, 114, 97, 99, 116, 101, 114, 32, 39, 37, 99, 39, 32, 105, 110, 32, 100, 101, 99, 105, 109, 97, 108, 32, 99, 111, 110, 115, 116, 97, 110, 116, 33, 0]);
export function parse_decimal_number() {
  let endptr;
  const __cxx_lvalue_0 = cRef(() => endptr, __cxx_lvalue_1 => { endptr = __cxx_lvalue_1; });
  let num = i64(strtoll(__cxx_private_cell_e2c5808de82af938e5d43808().value, __cxx_lvalue_0, 10));
  if (((num >= i64(i32(((-2147483647) - 1)))) && (num <= i64(2147483647)))) {

  } else {
    if (((num > i64(2147483647)) && (num <= i64(4294967295)))) {

    } else {
      ((i32(-1) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-1), __cxx_literal_ffe9b53e90b5d20f1fc3, u32(1429), __cxx_literal_43ac3d772e3cf68b6aec, g_scriptFileName, __cxx_global_cell_06245cf7a06b2fd69750f440().value));
      ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i32((previous + 1)); __cxx_lvalue_2.value = next; return previous; })(__cxx_global_cell_778291b6375dd09957e56c1b());
    }
  }
  if ((!isdigterm((cDeref(endptr, Uint8Array).value)))) {
    ((i32(-1) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-1), __cxx_literal_a8b50773c5893a2624f6, u32(1435), __cxx_literal_e8d5a0856bcea03e9caa, g_scriptFileName, __cxx_global_cell_06245cf7a06b2fd69750f440().value, i32((cDeref(endptr, Uint8Array).value))));
    ((__cxx_lvalue_3) => { const previous = __cxx_lvalue_3.value; const next = i32((previous + 1)); __cxx_lvalue_3.value = next; return previous; })(__cxx_global_cell_778291b6375dd09957e56c1b());
  }
  return i32(num);
}

// C/C++ source: source/duke3d/src/gamedef.cpp:1442
const __cxx_literal_b913512cbfd4bcea758a = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 100, 101, 102, 46, 99, 112, 112, 0]);
const __cxx_literal_3b17a82a7ad4cfefd51a = Uint8Array.from([37, 115, 58, 37, 100, 58, 32, 109, 97, 108, 102, 111, 114, 109, 101, 100, 32, 104, 101, 120, 32, 99, 111, 110, 115, 116, 97, 110, 116, 46, 0]);
const __cxx_literal_6c3f2141256916e2ef43 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 100, 101, 102, 46, 99, 112, 112, 0]);
const __cxx_literal_ef13764f8e426a9d4787 = Uint8Array.from([37, 115, 58, 37, 100, 58, 32, 105, 110, 118, 97, 108, 105, 100, 32, 99, 104, 97, 114, 97, 99, 116, 101, 114, 32, 39, 37, 99, 39, 32, 105, 110, 32, 104, 101, 120, 32, 99, 111, 110, 115, 116, 97, 110, 116, 33, 0]);
const __cxx_literal_9cfa82e7f41c7d5306ed = Uint8Array.from([37, 108, 120, 0]);
const __cxx_literal_668497b345d56d3bbcd1 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 100, 101, 102, 46, 99, 112, 112, 0]);
const __cxx_literal_73668db3cc6c99d8a890 = Uint8Array.from([37, 115, 58, 37, 100, 58, 32, 110, 117, 109, 98, 101, 114, 32, 48, 120, 37, 48, 49, 54, 108, 120, 32, 116, 114, 117, 110, 99, 97, 116, 101, 100, 32, 116, 111, 32, 51, 50, 32, 98, 105, 116, 115, 46, 0]);
export function parse_hex_constant(hexnum) {
  let vcheck = hexnum;
  if ((!Boolean(isxdigit(i32((cDeref(vcheck, Uint8Array).value)))))) {
    ((__cxx_lvalue_1) => { const previous = __cxx_lvalue_1.value; const next = i32((previous + 1)); __cxx_lvalue_1.value = next; return previous; })(__cxx_global_cell_a9ed12f504f4bd101d4746c6());
    ((i32(-2) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-2), __cxx_literal_b913512cbfd4bcea758a, u32(1448), __cxx_literal_3b17a82a7ad4cfefd51a, g_scriptFileName, __cxx_global_cell_06245cf7a06b2fd69750f440().value));
    return i32(0);
  }
  while ((!isdigterm((cDeref(vcheck, Uint8Array).value)))) {
    if ((!Boolean(isxdigit(i32((cDeref(vcheck, Uint8Array).value)))))) {
      ((i32(-1) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-1), __cxx_literal_6c3f2141256916e2ef43, u32(1456), __cxx_literal_ef13764f8e426a9d4787, g_scriptFileName, __cxx_global_cell_06245cf7a06b2fd69750f440().value, i32((cDeref(vcheck, Uint8Array).value))));
      ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i32((previous + 1)); __cxx_lvalue_2.value = next; return previous; })(__cxx_global_cell_778291b6375dd09957e56c1b());
      break;
    }
    ((__cxx_lvalue_3) => { const previous = __cxx_lvalue_3.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_3.value = next; return next; })(cRef(() => vcheck, __cxx_lvalue_4 => { vcheck = __cxx_lvalue_4; }));
  }
  let x;
  const __cxx_lvalue_0 = cRef(() => x, __cxx_lvalue_5 => { x = u64(__cxx_lvalue_5); });
  sscanf(hexnum, __cxx_literal_9cfa82e7f41c7d5306ed, __cxx_lvalue_0);
  if ((x > u64(4294967295))) {
    ((i32(-1) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-1), __cxx_literal_668497b345d56d3bbcd1, u32(1468), __cxx_literal_73668db3cc6c99d8a890, g_scriptFileName, __cxx_global_cell_06245cf7a06b2fd69750f440().value, x));
    ((__cxx_lvalue_6) => { const previous = __cxx_lvalue_6.value; const next = i32((previous + 1)); __cxx_lvalue_6.value = next; return previous; })(__cxx_global_cell_778291b6375dd09957e56c1b());
  }
  return i32(x);
}

// C/C++ source: source/duke3d/src/gamedef.cpp:1793
const __cxx_literal_e126cdb3a5ca9e85f03d = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 100, 101, 102, 46, 99, 112, 112, 0]);
const __cxx_literal_b0b6df35fbc7560e4ff1 = Uint8Array.from([37, 115, 58, 37, 100, 58, 32, 37, 115, 32, 108, 97, 98, 101, 108, 32, 39, 37, 115, 39, 46, 0]);
const __cxx_literal_bcfab94c2e28508a469b = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 100, 101, 102, 46, 99, 112, 112, 0]);
const __cxx_literal_83aa0e1666e10189d788 = Uint8Array.from([37, 115, 58, 37, 100, 58, 32, 101, 120, 112, 101, 99, 116, 101, 100, 32, 37, 115, 44, 32, 102, 111, 117, 110, 100, 32, 37, 115, 46, 0]);
const __cxx_literal_b74869843cc4b9b5244f = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 100, 101, 102, 46, 99, 112, 112, 0]);
const __cxx_literal_a91f3df90fbf11f7157d = Uint8Array.from([37, 115, 58, 37, 100, 58, 32, 99, 111, 110, 115, 116, 97, 110, 116, 32, 37, 108, 100, 46, 0]);
export function C_GetNextValue(type) {
  C_SkipComments();
  if ((i32((cDeref(__cxx_private_cell_e2c5808de82af938e5d43808().value, Uint8Array).value)) == 0)) {
    return i32((-1));
  }
  let l = i32(0);
  while (isaltok((cDeref(cPointerOffset(__cxx_private_cell_e2c5808de82af938e5d43808().value, l, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value))) {
    ((cDeref(cPointerOffset(tempbuf, l, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((cDeref(cPointerOffset(__cxx_private_cell_e2c5808de82af938e5d43808().value, l, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
    ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => l, __cxx_lvalue_1 => { l = __cxx_lvalue_1; }));
  }
  ((cDeref(cPointerOffset(tempbuf, l, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(0) & 255)) & 255));
  let i = i32(hash_find(__cxx_global_cell_d4103f960bb678857722381c().value, tempbuf));
  if ((i >= 0)) {
    if (Boolean(i32((i32((cDeref(cPointerOffset(__cxx_global_cell_ca786e7ce472b03dc90a2ec6().value, i, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & type)))) {
      if ((((__cxx_global_cell_428952e2c5a589c67db10fcc().value > 1) && (!Boolean(__cxx_global_cell_a9ed12f504f4bd101d4746c6().value))) && (!Boolean(__cxx_global_cell_778291b6375dd09957e56c1b().value)))) {
        let gl = C_GetLabelType(i32((cDeref(cPointerOffset(__cxx_global_cell_ca786e7ce472b03dc90a2ec6().value, i, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)));
        ((i32(10) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(10), __cxx_literal_e126cdb3a5ca9e85f03d, u32(1818), __cxx_literal_b0b6df35fbc7560e4ff1, g_scriptFileName, __cxx_global_cell_06245cf7a06b2fd69750f440().value, gl, cPointerOffset(__cxx_global_cell_1aca80e8b55c802f7b43740d().value, i32((i << 6)), Uint8Array.BYTES_PER_ELEMENT)));
        xfree__header_417fd1db3c1d(gl);
      }
      scriptWriteValue((cDeref(cPointerOffset(__cxx_global_cell_bb1aad227706ae6ec200fcf0().value, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value));
      (__cxx_private_cell_e2c5808de82af938e5d43808().value = cPointerOffset(__cxx_private_cell_e2c5808de82af938e5d43808().value, l, Uint8Array.BYTES_PER_ELEMENT));
      return i32((cDeref(cPointerOffset(__cxx_global_cell_ca786e7ce472b03dc90a2ec6().value, i, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value));
    }
    scriptWriteValue(0);
    (__cxx_private_cell_e2c5808de82af938e5d43808().value = cPointerOffset(__cxx_private_cell_e2c5808de82af938e5d43808().value, l, Uint8Array.BYTES_PER_ELEMENT));
    let el = C_GetLabelType(type);
    let gl = C_GetLabelType(i32((cDeref(cPointerOffset(__cxx_global_cell_ca786e7ce472b03dc90a2ec6().value, i, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)));
    C_ReportError((-1));
    ((i32(-1) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-1), __cxx_literal_bcfab94c2e28508a469b, u32(1833), __cxx_literal_83aa0e1666e10189d788, g_scriptFileName, __cxx_global_cell_06245cf7a06b2fd69750f440().value, el, gl));
    ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i32((previous + 1)); __cxx_lvalue_2.value = next; return previous; })(__cxx_global_cell_778291b6375dd09957e56c1b());
    xfree__header_417fd1db3c1d(el);
    xfree__header_417fd1db3c1d(gl);
    return i32((-1));
  }
  if (((isdigit(i32((cDeref(__cxx_private_cell_e2c5808de82af938e5d43808().value, Uint8Array).value))) == 0) && (i32((cDeref(__cxx_private_cell_e2c5808de82af938e5d43808().value, Uint8Array).value)) != i32(45)))) {
    C_ReportError(i32(15));
    ((__cxx_lvalue_3) => { const previous = __cxx_lvalue_3.value; const next = i32((previous + 1)); __cxx_lvalue_3.value = next; return previous; })(__cxx_global_cell_a9ed12f504f4bd101d4746c6());
    scriptWriteValue(0);
    (__cxx_private_cell_e2c5808de82af938e5d43808().value = cPointerOffset(__cxx_private_cell_e2c5808de82af938e5d43808().value, l, Uint8Array.BYTES_PER_ELEMENT));
    if ((!Boolean(l))) {
      ((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_4.value = next; return previous; })(__cxx_private_cell_e2c5808de82af938e5d43808());
    }
    return i32((-1));
  }
  if ((Boolean(isdigit(i32((cDeref(__cxx_private_cell_e2c5808de82af938e5d43808().value, Uint8Array).value)))) && __cxx_private_cell_c0d7a45cf66da756fe7006ee().value)) {
    C_ReportError(i32(25));
    ((__cxx_lvalue_5) => { const previous = __cxx_lvalue_5.value; const next = i32((previous + 1)); __cxx_lvalue_5.value = next; return previous; })(__cxx_global_cell_778291b6375dd09957e56c1b());
  }
  if (((i32((cDeref(cPointerOffset(__cxx_private_cell_e2c5808de82af938e5d43808().value, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == i32(48)) && (tolower(i32((cDeref(cPointerOffset(__cxx_private_cell_e2c5808de82af938e5d43808().value, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value))) == i32(120)))) {
    scriptWriteValue(parse_hex_constant(cPointerOffset(__cxx_private_cell_e2c5808de82af938e5d43808().value, 2, Uint8Array.BYTES_PER_ELEMENT)));
  } else {
    scriptWriteValue(parse_decimal_number());
  }
  if ((((__cxx_global_cell_428952e2c5a589c67db10fcc().value > 1) && (!Boolean(__cxx_global_cell_a9ed12f504f4bd101d4746c6().value))) && (!Boolean(__cxx_global_cell_778291b6375dd09957e56c1b().value)))) {
    ((i32(10) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(10), __cxx_literal_b74869843cc4b9b5244f, u32(1862), __cxx_literal_a91f3df90fbf11f7157d, g_scriptFileName, __cxx_global_cell_06245cf7a06b2fd69750f440().value, i64((cDeref(cPointerOffset(__cxx_global_cell_7c95f40343184c865284ca02().value, (-1), BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array).value))));
  }
  (__cxx_private_cell_e2c5808de82af938e5d43808().value = cPointerOffset(__cxx_private_cell_e2c5808de82af938e5d43808().value, l, Uint8Array.BYTES_PER_ELEMENT));
  return i32(0);
}

// C/C++ source: source/duke3d/src/gamedef.cpp:1946
const __cxx_literal_ea6e9ac884af3fdc735e = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 100, 101, 102, 46, 99, 112, 112, 0]);
const __cxx_literal_01d270efb12c17b9cfb1 = Uint8Array.from([37, 115, 58, 37, 100, 58, 32, 109, 97, 108, 102, 111, 114, 109, 101, 100, 32, 39, 37, 115, 39, 32, 98, 114, 97, 110, 99, 104, 0]);
export function C_CheckMalformedBranch(lastScriptPtr) {
  switch (C_GetKeyword()) {
    case i32(69):
    case i32(64):
    case i32(65):
    case i32(66):
    case i32(63): {
      (__cxx_global_cell_7c95f40343184c865284ca02().value = cPointerOffset(__cxx_global_cell_38abf48ab8ba3db5fce877d9().value, lastScriptPtr, BigInt64Array.BYTES_PER_ELEMENT));
    }
    (__cxx_private_cell_f12cff23ac9a70d73719e4d2().value = Boolean(true));
    C_ReportError((-1));
    ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(__cxx_global_cell_778291b6375dd09957e56c1b());
    ((i32(-1) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-1), __cxx_literal_ea6e9ac884af3fdc735e, u32(1960), __cxx_literal_01d270efb12c17b9cfb1, g_scriptFileName, __cxx_global_cell_06245cf7a06b2fd69750f440().value, VM_GetKeywordForID(i32(i64((BigInt((cDeref(__cxx_global_cell_7c95f40343184c865284ca02().value, BigInt64Array).value)) & BigInt(i64(4095))))))));
    return Boolean(true);
  }
  return Boolean(false);
}

// C/C++ source: source/duke3d/src/gamedef.cpp:1966
const __cxx_literal_df1cc3fa2c561623f04f = Uint8Array.from([105, 102, 0]);
const __cxx_literal_3914abc2c6dcab017fbe = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 100, 101, 102, 46, 99, 112, 112, 0]);
const __cxx_literal_9dc6b9fe8a06e6fbf48a = Uint8Array.from([37, 115, 58, 37, 100, 58, 32, 101, 109, 112, 116, 121, 32, 39, 37, 115, 39, 32, 98, 114, 97, 110, 99, 104, 0]);
export function C_CheckEmptyBranch(tw, lastScriptPtr) {
  if (((((((((Boolean(strncmp(VM_GetKeywordForID(tw), __cxx_literal_df1cc3fa2c561623f04f, u64(2))) && (tw != i32(63))) || (tw == i32(247))) || (tw == i32(229))) || (tw == i32(217))) || (tw == i32(218))) || (tw == i32(241))) || (tw == i32(240))) || (tw == i32(227)))) {
    (__cxx_private_cell_f12cff23ac9a70d73719e4d2().value = Boolean(false));
    return Boolean(false);
  }
  if (((i64((BigInt((cDeref(__cxx_global_cell_7c95f40343184c865284ca02().value, BigInt64Array).value)) & BigInt(i64(4095)))) != i64(282)) || (i64((BigInt((cDeref(__cxx_global_cell_7c95f40343184c865284ca02().value, BigInt64Array).value)) & BigInt(i64(i32((1 << 31)))))) == i64(0)))) {
    (__cxx_private_cell_f12cff23ac9a70d73719e4d2().value = Boolean(false));
  }
  if (__cxx_private_cell_f12cff23ac9a70d73719e4d2().value) {
    C_ReportError((-1));
    ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(__cxx_global_cell_778291b6375dd09957e56c1b());
    (__cxx_global_cell_7c95f40343184c865284ca02().value = cPointerOffset(__cxx_global_cell_38abf48ab8ba3db5fce877d9().value, lastScriptPtr, BigInt64Array.BYTES_PER_ELEMENT));
    ((i32(-1) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-1), __cxx_literal_3914abc2c6dcab017fbe, u32(1986), __cxx_literal_9dc6b9fe8a06e6fbf48a, g_scriptFileName, __cxx_global_cell_06245cf7a06b2fd69750f440().value, VM_GetKeywordForID(i32(i64((BigInt((cDeref(__cxx_global_cell_7c95f40343184c865284ca02().value, BigInt64Array).value)) & BigInt(i64(4095))))))));
    scriptWriteAtOffset(i32((i32((i32(282) | i32((__cxx_global_cell_06245cf7a06b2fd69750f440().value << 12)))) | i32((1 << 31)))), __cxx_global_cell_7c95f40343184c865284ca02().value);
    return Boolean(true);
  }
  return Boolean(false);
}

// C/C++ source: source/duke3d/src/gamedef.cpp:2024
export function C_AddFileOffset(offset, fileName) {
  let newofs = cRecordPointer(xcalloc__header_a91960ec68ef(u64(1), 24), {"align": 8, "arrayAlign": 1, "fields": {"fn": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 8, "pointer": true, "size": 8}, "offset": {"native": "Int32Array", "offset": 16, "size": 4}}, "overlaps": false, "size": 24, "union": false}, {});
  (cRecordObject(cRecordPointer(newofs, {"align": 8, "arrayAlign": 1, "fields": {"fn": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 8, "pointer": true, "size": 8}, "offset": {"native": "Int32Array", "offset": 16, "size": 4}}, "overlaps": false, "size": 24, "union": false}, {})).offset = i32(offset));
  (cRecordObject(cRecordPointer(newofs, {"align": 8, "arrayAlign": 1, "fields": {"fn": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 8, "pointer": true, "size": 8}, "offset": {"native": "Int32Array", "offset": 16, "size": 4}}, "overlaps": false, "size": 24, "union": false}, {})).fn = xstrdup__header_57e322b3fc9a(fileName));
  (cRecordObject(cRecordPointer(newofs, {"align": 8, "arrayAlign": 1, "fields": {"fn": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 8, "pointer": true, "size": 8}, "offset": {"native": "Int32Array", "offset": 16, "size": 4}}, "overlaps": false, "size": 24, "union": false}, {})).next = __cxx_global_cell_781692351a9d53402cd867ca().value);
  (__cxx_global_cell_781692351a9d53402cd867ca().value = newofs);
}

// C/C++ source: source/duke3d/src/gamedef.cpp:2112
export function check_filename_case(fn) {
  (fn = fn);
}

// C/C++ source: source/duke3d/src/gamedef.cpp:2115
export function G_DoGameStartup(params) {
  let p0 = cRecordObject(cRecordPointer((cPointerElementRef(cRecordPointer(g_player, {"align": 1, "arrayAlign": 1, "fields": {"frags": {"length": 16, "native": "Uint8Array", "offset": 62, "size": 16}, "gotvote": {"native": "Uint8Array", "offset": 93, "size": 1}, "horizAngleAdjust": {"native": "Int32Array", "offset": 32, "size": 4}, "horizRecenter": {"native": "Int32Array", "offset": 28, "size": 4}, "horizSkew": {"native": "Int32Array", "offset": 36, "size": 4}, "input": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"bits": {"native": "Uint32Array", "offset": 0, "size": 4}, "extbits": {"native": "Uint32Array", "offset": 16, "size": 4}, "fvel": {"native": "Int16Array", "offset": 4, "size": 2}, "q16avel": {"native": "Int32Array", "offset": 8, "size": 4}, "q16horz": {"native": "Int32Array", "offset": 12, "size": 4}, "svel": {"native": "Int16Array", "offset": 6, "size": 2}}, "overlaps": false, "size": 20, "union": false}, "offset": 8}, "lastViewUpdate": {"native": "BigUint64Array", "offset": 40, "size": 8}, "netsynctime": {"native": "Int32Array", "offset": 48, "size": 4}, "pcolor": {"native": "Int32Array", "offset": 52, "size": 4}, "ping": {"native": "Int16Array", "offset": 60, "size": 2}, "pingcnt": {"native": "Uint8Array", "offset": 94, "size": 1}, "playerquitflag": {"native": "Uint8Array", "offset": 95, "size": 1}, "ps": {"offset": 0, "pointer": true, "size": 8}, "pteam": {"native": "Int32Array", "offset": 56, "size": 4}, "ready": {"native": "Uint8Array", "offset": 96, "size": 1}, "revision": {"native": "Uint32Array", "offset": 129, "size": 4}, "smoothcamera": {"native": "Uint8Array", "offset": 91, "size": 1}, "user_name": {"length": 32, "native": "Uint8Array", "offset": 97, "size": 32}, "vote": {"native": "Uint8Array", "offset": 92, "size": 1}, "wchoice": {"length": 13, "native": "Uint8Array", "offset": 78, "size": 13}}, "overlaps": false, "size": 133, "union": false}, {}), 0).value).ps, {"align": 1, "arrayAlign": 2, "fields": {"access_incs": {"native": "Uint8Array", "offset": 623, "size": 1}, "access_spritenum": {"native": "Int16Array", "offset": 504, "size": 2}, "access_wallnum": {"native": "Int16Array", "offset": 502, "size": 2}, "actors_killed": {"native": "Uint16Array", "offset": 134, "size": 2}, "actorsqu": {"native": "Int16Array", "offset": 528, "size": 2}, "aim_mode": {"native": "Uint8Array", "offset": 589, "size": 1}, "airleft": {"native": "Int16Array", "offset": 496, "size": 2}, "ammo_amount": {"length": 13, "native": "Int16Array", "offset": 438, "size": 26}, "auto_aim": {"native": "Uint8Array", "offset": 590, "size": 1}, "autostep": {"native": "Int32Array", "offset": 116, "size": 4}, "autostep_sbw": {"native": "Int32Array", "offset": 120, "size": 4}, "bobcounter": {"native": "Int16Array", "offset": 566, "size": 2}, "bobpos": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 48}, "buttonpalette": {"native": "Uint8Array", "offset": 607, "size": 1}, "cheat_phase": {"native": "Int8Array", "offset": 632, "size": 1}, "clipdist": {"native": "Int16Array", "offset": 580, "size": 2}, "crack_time": {"native": "Int16Array", "offset": 564, "size": 2}, "crouch_toggle": {"native": "Int8Array", "offset": 638, "size": 1}, "crouchspeedmodifier": {"native": "Int16Array", "offset": 386, "size": 2}, "crouchzincrement": {"native": "Int16Array", "offset": 384, "size": 2}, "curr_weapon": {"native": "Int8Array", "offset": 635, "size": 1}, "cursectnum": {"native": "Int16Array", "offset": 404, "size": 2}, "customexitsound": {"native": "Int16Array", "offset": 532, "size": 2}, "dead_flag": {"native": "Int16Array", "offset": 572, "size": 2}, "dummyplayersprite": {"native": "Int16Array", "offset": 524, "size": 2}, "extra_extra8": {"native": "Int16Array", "offset": 526, "size": 2}, "falling_counter": {"native": "Uint8Array", "offset": 617, "size": 1}, "filler": {"length": 100, "native": "Int16Array", "offset": 168, "size": 200}, "fist_incs": {"native": "Uint8Array", "offset": 627, "size": 1}, "floorzcutoff": {"native": "Int16Array", "offset": 370, "size": 2}, "floorzoffset": {"native": "Int16Array", "offset": 374, "size": 2}, "floorzrebound": {"native": "Int16Array", "offset": 368, "size": 2}, "footprintcount": {"native": "Uint8Array", "offset": 600, "size": 1}, "footprintpal": {"native": "Uint8Array", "offset": 613, "size": 1}, "footprintshade": {"native": "Uint8Array", "offset": 618, "size": 1}, "frag": {"native": "Uint16Array", "offset": 140, "size": 2}, "frag_ps": {"native": "Uint8Array", "offset": 596, "size": 1}, "fraggedself": {"native": "Uint16Array", "offset": 142, "size": 2}, "fric": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 56}, "fta": {"native": "Int16Array", "offset": 498, "size": 2}, "ftq": {"native": "Int16Array", "offset": 500, "size": 2}, "gm": {"native": "Uint8Array", "offset": 598, "size": 1}, "got_access": {"native": "Int16Array", "offset": 506, "size": 2}, "gotweapon": {"native": "Uint16Array", "offset": 136, "size": 2}, "gravity": {"native": "Int16Array", "offset": 398, "size": 2}, "hard_landing": {"native": "Uint8Array", "offset": 626, "size": 1}, "hbomb_hold_delay": {"native": "Uint8Array", "offset": 595, "size": 1}, "hbomb_on": {"native": "Uint8Array", "offset": 602, "size": 1}, "heat_on": {"native": "Uint8Array", "offset": 614, "size": 1}, "holoduke_on": {"native": "Int16Array", "offset": 574, "size": 2}, "holster_weapon": {"native": "Uint8Array", "offset": 616, "size": 1}, "hurt_delay": {"native": "Uint8Array", "offset": 601, "size": 1}, "i": {"native": "Int16Array", "offset": 516, "size": 2}, "interface_toggle": {"native": "Uint32Array", "offset": 124, "size": 4}, "inv_amount": {"length": 11, "native": "Int16Array", "offset": 464, "size": 22}, "invdisptime": {"native": "Uint8Array", "offset": 615, "size": 1}, "inven_icon": {"native": "Uint8Array", "offset": 606, "size": 1}, "jetpack_on": {"native": "Uint8Array", "offset": 610, "size": 1}, "jetpackzincrement": {"native": "Int16Array", "offset": 396, "size": 2}, "jumping_counter": {"native": "Int16Array", "offset": 494, "size": 2}, "jumping_toggle": {"native": "Uint8Array", "offset": 603, "size": 1}, "kickback_pic": {"native": "Uint8Array", "offset": 597, "size": 1}, "knee_incs": {"native": "Uint8Array", "offset": 622, "size": 1}, "knuckle_incs": {"native": "Uint8Array", "offset": 621, "size": 1}, "last_extra": {"native": "Int16Array", "offset": 408, "size": 2}, "last_full_weapon": {"native": "Uint8Array", "offset": 619, "size": 1}, "last_pissed_time": {"native": "Int16Array", "offset": 534, "size": 2}, "last_quick_kick": {"native": "Uint8Array", "offset": 585, "size": 1}, "last_used_weapon": {"native": "Int8Array", "offset": 637, "size": 1}, "last_weapon": {"native": "Int8Array", "offset": 631, "size": 1}, "loogcnt": {"native": "Int8Array", "offset": 629, "size": 1}, "loogie": {"dims": [6], "offset": 144, "recordArray": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, "size": 24}, "look_ang": {"native": "Int16Array", "offset": 406, "size": 2}, "max_actors_killed": {"native": "Uint16Array", "offset": 132, "size": 2}, "max_ammo_amount": {"length": 13, "native": "Int16Array", "offset": 412, "size": 26}, "max_player_health": {"native": "Int32Array", "offset": 108, "size": 4}, "max_secret_rooms": {"native": "Uint8Array", "offset": 582, "size": 1}, "max_shield_amount": {"native": "Int32Array", "offset": 112, "size": 4}, "maxswimzvel": {"native": "Int16Array", "offset": 394, "size": 2}, "minswimzvel": {"native": "Int16Array", "offset": 392, "size": 2}, "minwaterzdist": {"native": "Int16Array", "offset": 378, "size": 2}, "movement_lock": {"native": "Uint8Array", "offset": 592, "size": 1}, "newowner": {"native": "Int16Array", "offset": 492, "size": 2}, "npos": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 36}, "numloogs": {"native": "Int8Array", "offset": 628, "size": 1}, "olook_ang": {"native": "Int16Array", "offset": 372, "size": 2}, "on_crane": {"native": "Int16Array", "offset": 514, "size": 2}, "on_ground": {"native": "Uint8Array", "offset": 605, "size": 1}, "on_warping_sector": {"native": "Uint8Array", "offset": 599, "size": 1}, "one_eighty_count": {"native": "Int16Array", "offset": 522, "size": 2}, "opos": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 12}, "opyoff": {"native": "Int16Array", "offset": 490, "size": 2}, "oq16ang": {"native": "Int32Array", "offset": 84, "size": 4}, "oq16horiz": {"native": "Int32Array", "offset": 72, "size": 4}, "oq16horizoff": {"native": "Int32Array", "offset": 76, "size": 4}, "orotscrnang": {"native": "Int16Array", "offset": 568, "size": 2}, "over_shoulder_on": {"native": "Uint8Array", "offset": 608, "size": 1}, "padding_": {"length": 1, "native": "Int8Array", "offset": 639, "oneByteTailArray": "clang-flex-arrays-0-or-1/1", "size": 1}, "palette": {"native": "Uint8Array", "offset": 636, "size": 1}, "palookup": {"native": "Uint8Array", "offset": 625, "size": 1}, "pals": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"b": {"native": "Uint8Array", "offset": 2, "size": 1}, "f": {"native": "Uint8Array", "offset": 3, "size": 1}, "g": {"native": "Uint8Array", "offset": 1, "size": 1}, "r": {"native": "Uint8Array", "offset": 0, "size": 1}}, "overlaps": false, "size": 4, "union": false}, "offset": 128}, "parallax_sectnum": {"native": "Int16Array", "offset": 518, "size": 2}, "player_par": {"native": "Int32Array", "offset": 100, "size": 4}, "pos": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}, "pycount": {"native": "Int16Array", "offset": 576, "size": 2}, "pyoff": {"native": "Int16Array", "offset": 488, "size": 2}, "q16ang": {"native": "Int32Array", "offset": 80, "size": 4}, "q16angvel": {"native": "Int32Array", "offset": 88, "size": 4}, "q16horiz": {"native": "Int32Array", "offset": 64, "size": 4}, "q16horizoff": {"native": "Int32Array", "offset": 68, "size": 4}, "quick_kick": {"native": "Uint8Array", "offset": 584, "size": 1}, "random_club_frame": {"native": "Int16Array", "offset": 520, "size": 2}, "rapid_fire_hold": {"native": "Uint8Array", "offset": 604, "size": 1}, "reloading": {"native": "Uint8Array", "offset": 587, "size": 1}, "return_to_center": {"native": "Uint8Array", "offset": 586, "size": 1}, "rotscrnang": {"native": "Int16Array", "offset": 570, "size": 2}, "runspeed": {"native": "Int32Array", "offset": 104, "size": 4}, "sbs": {"native": "Int16Array", "offset": 400, "size": 2}, "scream_voice": {"native": "Int8Array", "offset": 630, "size": 1}, "scuba_on": {"native": "Uint8Array", "offset": 612, "size": 1}, "secret_rooms": {"native": "Uint8Array", "offset": 583, "size": 1}, "show_empty_weapon": {"native": "Uint8Array", "offset": 609, "size": 1}, "shrunkzoffset": {"native": "Int16Array", "offset": 382, "size": 2}, "somethingonplayer": {"native": "Int16Array", "offset": 512, "size": 2}, "sound_pitch": {"native": "Int16Array", "offset": 402, "size": 2}, "spritebridge": {"native": "Uint8Array", "offset": 611, "size": 1}, "spritezoffset": {"native": "Int16Array", "offset": 376, "size": 2}, "subweapon": {"native": "Int16Array", "offset": 410, "size": 2}, "swimspeedmodifier": {"native": "Int16Array", "offset": 388, "size": 2}, "swimzincrement": {"native": "Int16Array", "offset": 390, "size": 2}, "team": {"native": "Uint8Array", "offset": 593, "size": 1}, "timebeforeexit": {"native": "Int16Array", "offset": 530, "size": 2}, "tipincs": {"native": "Uint8Array", "offset": 594, "size": 1}, "toggle_key_flag": {"native": "Uint8Array", "offset": 620, "size": 1}, "transporter_hold": {"native": "Int16Array", "offset": 578, "size": 2}, "truecz": {"native": "Int32Array", "offset": 96, "size": 4}, "truefz": {"native": "Int32Array", "offset": 92, "size": 4}, "vel": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 24}, "visibility": {"native": "Int16Array", "offset": 510, "size": 2}, "wackedbyactor": {"native": "Int16Array", "offset": 486, "size": 2}, "walking_snd_toggle": {"native": "Uint8Array", "offset": 624, "size": 1}, "wantweaponfire": {"native": "Int8Array", "offset": 634, "size": 1}, "waterzoffset": {"native": "Int16Array", "offset": 380, "size": 2}, "weapon_ang": {"native": "Int16Array", "offset": 508, "size": 2}, "weapon_pos": {"native": "Int8Array", "offset": 633, "size": 1}, "weapon_sway": {"native": "Int16Array", "offset": 562, "size": 2}, "weaponswitch": {"native": "Uint8Array", "offset": 591, "size": 1}, "weapreccnt": {"native": "Uint8Array", "offset": 588, "size": 1}, "weaprecs": {"length": 13, "native": "Int16Array", "offset": 536, "size": 26}, "zoom": {"native": "Uint16Array", "offset": 138, "size": 2}}, "overlaps": true, "size": 640, "union": false}, {}));
  let j = i32(0);
  (__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.const_visibility = i32((cDeref(cPointerOffset(params, ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => j, __cxx_lvalue_1 => { j = __cxx_lvalue_1; })), Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
  (__cxx_global_cell_35041d56fffbae8d2a330213().value = i32((cDeref(cPointerOffset(params, ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i32((previous + 1)); __cxx_lvalue_2.value = next; return previous; })(cRef(() => j, __cxx_lvalue_3 => { j = __cxx_lvalue_3; })), Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
  (p0.max_shield_amount = i32((cDeref(cPointerOffset(params, j, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
  (p0.max_player_health = i32((cDeref(cPointerOffset(params, j, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
  (__cxx_global_cell_e75226e761a45fe1770321b0().value = i32((cDeref(cPointerOffset(params, ((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = i32((previous + 1)); __cxx_lvalue_4.value = next; return previous; })(cRef(() => j, __cxx_lvalue_5 => { j = __cxx_lvalue_5; })), Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
  (__cxx_global_cell_2bd4d302631cb2e7f9cab27e().value = i32((cDeref(cPointerOffset(params, ((__cxx_lvalue_6) => { const previous = __cxx_lvalue_6.value; const next = i32((previous + 1)); __cxx_lvalue_6.value = next; return previous; })(cRef(() => j, __cxx_lvalue_7 => { j = __cxx_lvalue_7; })), Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
  (__cxx_global_cell_9cec72372660080d153969ed().value = i32((cDeref(cPointerOffset(params, ((__cxx_lvalue_8) => { const previous = __cxx_lvalue_8.value; const next = i32((previous + 1)); __cxx_lvalue_8.value = next; return previous; })(cRef(() => j, __cxx_lvalue_9 => { j = __cxx_lvalue_9; })), Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
  (__cxx_global_cell_98f0b1f570a2f6307c66c6f0().value = i32(((__cxx_global_cell_f7e268c20b879c2fe3740be6().value >= 11) ? (cDeref(cPointerOffset(params, ((__cxx_lvalue_10) => { const previous = __cxx_lvalue_10.value; const next = i32((previous + 1)); __cxx_lvalue_10.value = next; return previous; })(cRef(() => j, __cxx_lvalue_11 => { j = __cxx_lvalue_11; })), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) : __cxx_global_cell_9cec72372660080d153969ed().value)));
  if ((__cxx_global_cell_f7e268c20b879c2fe3740be6().value >= 11)) {
    (__cxx_global_cell_bc77ba2124d9f9bdbae1a2b2().value = i32((cDeref(cPointerOffset(params, ((__cxx_lvalue_12) => { const previous = __cxx_lvalue_12.value; const next = i32((previous + 1)); __cxx_lvalue_12.value = next; return previous; })(cRef(() => j, __cxx_lvalue_13 => { j = __cxx_lvalue_13; })), Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
  }
  if ((__cxx_global_cell_f7e268c20b879c2fe3740be6().value >= 14)) {
    (__cxx_global_cell_b1c97a6bfe6b79b1e897a68a().value = i32((cDeref(cPointerOffset(params, ((__cxx_lvalue_14) => { const previous = __cxx_lvalue_14.value; const next = i32((previous + 1)); __cxx_lvalue_14.value = next; return previous; })(cRef(() => j, __cxx_lvalue_15 => { j = __cxx_lvalue_15; })), Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
  }
  if ((__cxx_global_cell_f7e268c20b879c2fe3740be6().value >= 11)) {
    (__cxx_global_cell_c725c74fe2c9d83b97894533().value = i32((cDeref(cPointerOffset(params, ((__cxx_lvalue_16) => { const previous = __cxx_lvalue_16.value; const next = i32((previous + 1)); __cxx_lvalue_16.value = next; return previous; })(cRef(() => j, __cxx_lvalue_17 => { j = __cxx_lvalue_17; })), Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
    (__cxx_global_cell_164a2be3133df4f0c234cae8().value = i32((cDeref(cPointerOffset(params, ((__cxx_lvalue_18) => { const previous = __cxx_lvalue_18.value; const next = i32((previous + 1)); __cxx_lvalue_18.value = next; return previous; })(cRef(() => j, __cxx_lvalue_19 => { j = __cxx_lvalue_19; })), Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
    (__cxx_global_cell_2519a794ef91626313d8500b().value = i32((cDeref(cPointerOffset(params, ((__cxx_lvalue_20) => { const previous = __cxx_lvalue_20.value; const next = i32((previous + 1)); __cxx_lvalue_20.value = next; return previous; })(cRef(() => j, __cxx_lvalue_21 => { j = __cxx_lvalue_21; })), Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
    (__cxx_global_cell_f06cc89b42ea26c6f8c956f2().value = i32((cDeref(cPointerOffset(params, ((__cxx_lvalue_22) => { const previous = __cxx_lvalue_22.value; const next = i32((previous + 1)); __cxx_lvalue_22.value = next; return previous; })(cRef(() => j, __cxx_lvalue_23 => { j = __cxx_lvalue_23; })), Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
    (__cxx_global_cell_55c709d3278bbdef67186917().value = i32((cDeref(cPointerOffset(params, ((__cxx_lvalue_24) => { const previous = __cxx_lvalue_24.value; const next = i32((previous + 1)); __cxx_lvalue_24.value = next; return previous; })(cRef(() => j, __cxx_lvalue_25 => { j = __cxx_lvalue_25; })), Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
    (__cxx_global_cell_fa1a761ad63424391ef2eb7e().value = i32((cDeref(cPointerOffset(params, ((__cxx_lvalue_26) => { const previous = __cxx_lvalue_26.value; const next = i32((previous + 1)); __cxx_lvalue_26.value = next; return previous; })(cRef(() => j, __cxx_lvalue_27 => { j = __cxx_lvalue_27; })), Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
    (__cxx_global_cell_af78946ba4f03068d5c18b7b().value = i32((cDeref(cPointerOffset(params, ((__cxx_lvalue_28) => { const previous = __cxx_lvalue_28.value; const next = i32((previous + 1)); __cxx_lvalue_28.value = next; return previous; })(cRef(() => j, __cxx_lvalue_29 => { j = __cxx_lvalue_29; })), Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
  }
  ((cDeref(cPointerOffset(p0.max_ammo_amount, 1, Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = ((u32(((u32((cDeref(cPointerOffset(params, ((__cxx_lvalue_30) => { const previous = __cxx_lvalue_30.value; const next = i32((previous + 1)); __cxx_lvalue_30.value = next; return previous; })(cRef(() => j, __cxx_lvalue_31 => { j = __cxx_lvalue_31; })), Int32Array.BYTES_PER_ELEMENT), Int32Array).value)) << 16) >> 16)) << 16) >> 16));
  ((cDeref(cPointerOffset(p0.max_ammo_amount, 2, Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = ((u32(((u32((cDeref(cPointerOffset(params, ((__cxx_lvalue_32) => { const previous = __cxx_lvalue_32.value; const next = i32((previous + 1)); __cxx_lvalue_32.value = next; return previous; })(cRef(() => j, __cxx_lvalue_33 => { j = __cxx_lvalue_33; })), Int32Array.BYTES_PER_ELEMENT), Int32Array).value)) << 16) >> 16)) << 16) >> 16));
  ((cDeref(cPointerOffset(p0.max_ammo_amount, 3, Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = ((u32(((u32((cDeref(cPointerOffset(params, ((__cxx_lvalue_34) => { const previous = __cxx_lvalue_34.value; const next = i32((previous + 1)); __cxx_lvalue_34.value = next; return previous; })(cRef(() => j, __cxx_lvalue_35 => { j = __cxx_lvalue_35; })), Int32Array.BYTES_PER_ELEMENT), Int32Array).value)) << 16) >> 16)) << 16) >> 16));
  ((cDeref(cPointerOffset(p0.max_ammo_amount, 4, Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = ((u32(((u32((cDeref(cPointerOffset(params, ((__cxx_lvalue_36) => { const previous = __cxx_lvalue_36.value; const next = i32((previous + 1)); __cxx_lvalue_36.value = next; return previous; })(cRef(() => j, __cxx_lvalue_37 => { j = __cxx_lvalue_37; })), Int32Array.BYTES_PER_ELEMENT), Int32Array).value)) << 16) >> 16)) << 16) >> 16));
  ((cDeref(cPointerOffset(p0.max_ammo_amount, 5, Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = ((u32(((u32((cDeref(cPointerOffset(params, ((__cxx_lvalue_38) => { const previous = __cxx_lvalue_38.value; const next = i32((previous + 1)); __cxx_lvalue_38.value = next; return previous; })(cRef(() => j, __cxx_lvalue_39 => { j = __cxx_lvalue_39; })), Int32Array.BYTES_PER_ELEMENT), Int32Array).value)) << 16) >> 16)) << 16) >> 16));
  ((cDeref(cPointerOffset(p0.max_ammo_amount, 6, Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = ((u32(((u32((cDeref(cPointerOffset(params, ((__cxx_lvalue_40) => { const previous = __cxx_lvalue_40.value; const next = i32((previous + 1)); __cxx_lvalue_40.value = next; return previous; })(cRef(() => j, __cxx_lvalue_41 => { j = __cxx_lvalue_41; })), Int32Array.BYTES_PER_ELEMENT), Int32Array).value)) << 16) >> 16)) << 16) >> 16));
  ((cDeref(cPointerOffset(p0.max_ammo_amount, 7, Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = ((u32(((u32((cDeref(cPointerOffset(params, ((__cxx_lvalue_42) => { const previous = __cxx_lvalue_42.value; const next = i32((previous + 1)); __cxx_lvalue_42.value = next; return previous; })(cRef(() => j, __cxx_lvalue_43 => { j = __cxx_lvalue_43; })), Int32Array.BYTES_PER_ELEMENT), Int32Array).value)) << 16) >> 16)) << 16) >> 16));
  ((cDeref(cPointerOffset(p0.max_ammo_amount, 8, Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = ((u32(((u32((cDeref(cPointerOffset(params, ((__cxx_lvalue_44) => { const previous = __cxx_lvalue_44.value; const next = i32((previous + 1)); __cxx_lvalue_44.value = next; return previous; })(cRef(() => j, __cxx_lvalue_45 => { j = __cxx_lvalue_45; })), Int32Array.BYTES_PER_ELEMENT), Int32Array).value)) << 16) >> 16)) << 16) >> 16));
  if ((__cxx_global_cell_f7e268c20b879c2fe3740be6().value >= 13)) {
    ((cDeref(cPointerOffset(p0.max_ammo_amount, 9, Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = ((u32(((u32((cDeref(cPointerOffset(params, ((__cxx_lvalue_46) => { const previous = __cxx_lvalue_46.value; const next = i32((previous + 1)); __cxx_lvalue_46.value = next; return previous; })(cRef(() => j, __cxx_lvalue_47 => { j = __cxx_lvalue_47; })), Int32Array.BYTES_PER_ELEMENT), Int32Array).value)) << 16) >> 16)) << 16) >> 16));
    if ((__cxx_global_cell_f7e268c20b879c2fe3740be6().value >= 14)) {
      ((cDeref(cPointerOffset(p0.max_ammo_amount, 11, Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = ((u32(((u32((cDeref(cPointerOffset(params, ((__cxx_lvalue_48) => { const previous = __cxx_lvalue_48.value; const next = i32((previous + 1)); __cxx_lvalue_48.value = next; return previous; })(cRef(() => j, __cxx_lvalue_49 => { j = __cxx_lvalue_49; })), Int32Array.BYTES_PER_ELEMENT), Int32Array).value)) << 16) >> 16)) << 16) >> 16));
    }
    (__cxx_global_cell_f0488c3aa4d43399b04094cf().value = i32((cDeref(cPointerOffset(params, ((__cxx_lvalue_50) => { const previous = __cxx_lvalue_50.value; const next = i32((previous + 1)); __cxx_lvalue_50.value = next; return previous; })(cRef(() => j, __cxx_lvalue_51 => { j = __cxx_lvalue_51; })), Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
    (__cxx_global_cell_3b9a6643b5a8adfdd16c2c0e().value = i32((cDeref(cPointerOffset(params, ((__cxx_lvalue_52) => { const previous = __cxx_lvalue_52.value; const next = i32((previous + 1)); __cxx_lvalue_52.value = next; return previous; })(cRef(() => j, __cxx_lvalue_53 => { j = __cxx_lvalue_53; })), Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
    (__cxx_global_cell_65816fd170522259e73c192a().value = i32((cDeref(cPointerOffset(params, ((__cxx_lvalue_54) => { const previous = __cxx_lvalue_54.value; const next = i32((previous + 1)); __cxx_lvalue_54.value = next; return previous; })(cRef(() => j, __cxx_lvalue_55 => { j = __cxx_lvalue_55; })), Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
    if ((__cxx_global_cell_f7e268c20b879c2fe3740be6().value >= 14)) {
      (__cxx_global_cell_c7396d09498f79f4675d125b().value = i32(clamp__header_f1396d347458((cDeref(cPointerOffset(params, ((__cxx_lvalue_56) => { const previous = __cxx_lvalue_56.value; const next = i32((previous + 1)); __cxx_lvalue_56.value = next; return previous; })(cRef(() => j, __cxx_lvalue_57 => { j = __cxx_lvalue_57; })), Int32Array.BYTES_PER_ELEMENT), Int32Array).value), 0, i64(ARRAY_SIZE__header_bd4fa82976e1(SpriteDeletionQueue)))));
      (__cxx_global_cell_bb57c023dc177e6059e96f1a().value = i32((cDeref(cPointerOffset(params, ((__cxx_lvalue_58) => { const previous = __cxx_lvalue_58.value; const next = i32((previous + 1)); __cxx_lvalue_58.value = next; return previous; })(cRef(() => j, __cxx_lvalue_59 => { j = __cxx_lvalue_59; })), Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
    }
    if ((__cxx_global_cell_f7e268c20b879c2fe3740be6().value >= 16)) {
      ((cDeref(cPointerOffset(p0.max_ammo_amount, 12, Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = ((u32(((u32((cDeref(cPointerOffset(params, ((__cxx_lvalue_60) => { const previous = __cxx_lvalue_60.value; const next = i32((previous + 1)); __cxx_lvalue_60.value = next; return previous; })(cRef(() => j, __cxx_lvalue_61 => { j = __cxx_lvalue_61; })), Int32Array.BYTES_PER_ELEMENT), Int32Array).value)) << 16) >> 16)) << 16) >> 16));
    }
  }
}

// C/C++ source: source/duke3d/src/gamedef.cpp:2179
const __cxx_literal_ba99eb952ba2fc384ff6 = Uint8Array.from([47, 46, 0]);
export function C_DefineMusic(volumeNum, levelNum, fileName) {
  (u32(volumeNum) < u32(i32((7 + 1))));
  (u32(levelNum) < u32(64));
  if ((strcmp(fileName, __cxx_literal_ba99eb952ba2fc384ff6) == 0)) {
    return;
  }
  let pMapInfo = cPointerOffset(g_mapInfo, i32((i32(Math.imul(64, volumeNum)) + levelNum)), 40);
  xfree__header_417fd1db3c1d(cRecordObject(cRecordPointer(pMapInfo, {"align": 8, "arrayAlign": 1, "fields": {"designertime": {"native": "Int32Array", "offset": 4, "size": 4}, "filename": {"offset": 16, "pointer": true, "size": 8}, "musicfn": {"offset": 24, "pointer": true, "size": 8}, "name": {"offset": 8, "pointer": true, "size": 8}, "partime": {"native": "Int32Array", "offset": 0, "size": 4}, "savedstate": {"offset": 32, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {})).musicfn);
  (cRecordObject(cRecordPointer(pMapInfo, {"align": 8, "arrayAlign": 1, "fields": {"designertime": {"native": "Int32Array", "offset": 4, "size": 4}, "filename": {"offset": 16, "pointer": true, "size": 8}, "musicfn": {"offset": 24, "pointer": true, "size": 8}, "name": {"offset": 8, "pointer": true, "size": 8}, "partime": {"native": "Int32Array", "offset": 0, "size": 4}, "savedstate": {"offset": 32, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {})).musicfn = dup_filename__header_992d4c8ea5fb(fileName));
  check_filename_case(cRecordObject(cRecordPointer(pMapInfo, {"align": 8, "arrayAlign": 1, "fields": {"designertime": {"native": "Int32Array", "offset": 4, "size": 4}, "filename": {"offset": 16, "pointer": true, "size": 8}, "musicfn": {"offset": 24, "pointer": true, "size": 8}, "name": {"offset": 8, "pointer": true, "size": 8}, "partime": {"native": "Int32Array", "offset": 0, "size": 4}, "savedstate": {"offset": 32, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {})).musicfn);
}

// C/C++ source: source/duke3d/src/gamedef.cpp:2194
export function C_DefineVolumeFlags(vol, flags) {
  (u32(vol) < u32(7));
  ((cDeref(cPointerOffset(g_volumeFlags, vol, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(flags));
}

// C/C++ source: source/duke3d/src/gamedef.cpp:2201
export function C_UndefineVolume(vol) {
  (u32(vol) < u32(7));
  for (let i = i64(0); (i < i64(64)); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i64((previous + 1n)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; }))) {
    C_UndefineLevel(vol, i32(i));
  }
  ((cDeref(cPointerOffset((cPointerElementRef(g_volumeNames, vol).value), 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32(0) & 255));
  (__cxx_global_cell_00e4d69d02c23b6c86678573().value = i32(0));
  for (let i = i64(i32((7 - 1))); (i >= i64(0)); ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i64((previous - 1n)); __cxx_lvalue_2.value = next; return previous; })(cRef(() => i, __cxx_lvalue_3 => { i = __cxx_lvalue_3; }))) {
    if (Boolean((cDeref(cPointerOffset((cPointerElementRef(g_volumeNames, i).value), 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value))) {
      (__cxx_global_cell_00e4d69d02c23b6c86678573().value = i32(i64((BigInt(i) + BigInt(i64(1))))));
      break;
    }
  }
}

// C/C++ source: source/duke3d/src/gamedef.cpp:2221
export function C_UndefineSkill(skill) {
  (u32(skill) < u32(7));
  ((cDeref(cPointerOffset((cPointerElementRef(g_skillNames, skill).value), 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32(0) & 255));
  (__cxx_global_cell_e9576a5286a0997ea679c8d5().value = ((u32(((u32(0) << 24) >> 24)) << 24) >> 24));
  for (let i = i64(i32((7 - 1))); (i >= i64(0)); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i64((previous - 1n)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; }))) {
    if (Boolean((cDeref(cPointerOffset((cPointerElementRef(g_skillNames, i).value), 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value))) {
      (__cxx_global_cell_e9576a5286a0997ea679c8d5().value = ((u32(((u32(i64((BigInt(i) + BigInt(i64(1))))) << 24) >> 24)) << 24) >> 24));
      break;
    }
  }
}

// C/C++ source: source/duke3d/src/gamedef.cpp:2238
export function C_UndefineLevel(vol, lev) {
  (u32(vol) < u32(7));
  (u32(lev) < u32(64));
  let map = cPointerOffset(g_mapInfo, i32((i32(Math.imul(64, vol)) + lev)), 40);
  do {
    xfree__header_417fd1db3c1d(cRecordObject(cRecordPointer(map, {"align": 8, "arrayAlign": 1, "fields": {"designertime": {"native": "Int32Array", "offset": 4, "size": 4}, "filename": {"offset": 16, "pointer": true, "size": 8}, "musicfn": {"offset": 24, "pointer": true, "size": 8}, "name": {"offset": 8, "pointer": true, "size": 8}, "partime": {"native": "Int32Array", "offset": 0, "size": 4}, "savedstate": {"offset": 32, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {})).filename);
    (cRecordObject(cRecordPointer(map, {"align": 8, "arrayAlign": 1, "fields": {"designertime": {"native": "Int32Array", "offset": 4, "size": 4}, "filename": {"offset": 16, "pointer": true, "size": 8}, "musicfn": {"offset": 24, "pointer": true, "size": 8}, "name": {"offset": 8, "pointer": true, "size": 8}, "partime": {"native": "Int32Array", "offset": 0, "size": 4}, "savedstate": {"offset": 32, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {})).filename = null);
  } while (Boolean(0));
  do {
    xfree__header_417fd1db3c1d(cRecordObject(cRecordPointer(map, {"align": 8, "arrayAlign": 1, "fields": {"designertime": {"native": "Int32Array", "offset": 4, "size": 4}, "filename": {"offset": 16, "pointer": true, "size": 8}, "musicfn": {"offset": 24, "pointer": true, "size": 8}, "name": {"offset": 8, "pointer": true, "size": 8}, "partime": {"native": "Int32Array", "offset": 0, "size": 4}, "savedstate": {"offset": 32, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {})).name);
    (cRecordObject(cRecordPointer(map, {"align": 8, "arrayAlign": 1, "fields": {"designertime": {"native": "Int32Array", "offset": 4, "size": 4}, "filename": {"offset": 16, "pointer": true, "size": 8}, "musicfn": {"offset": 24, "pointer": true, "size": 8}, "name": {"offset": 8, "pointer": true, "size": 8}, "partime": {"native": "Int32Array", "offset": 0, "size": 4}, "savedstate": {"offset": 32, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {})).name = null);
  } while (Boolean(0));
  (cRecordObject(cRecordPointer(map, {"align": 8, "arrayAlign": 1, "fields": {"designertime": {"native": "Int32Array", "offset": 4, "size": 4}, "filename": {"offset": 16, "pointer": true, "size": 8}, "musicfn": {"offset": 24, "pointer": true, "size": 8}, "name": {"offset": 8, "pointer": true, "size": 8}, "partime": {"native": "Int32Array", "offset": 0, "size": 4}, "savedstate": {"offset": 32, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {})).partime = i32(0));
  (cRecordObject(cRecordPointer(map, {"align": 8, "arrayAlign": 1, "fields": {"designertime": {"native": "Int32Array", "offset": 4, "size": 4}, "filename": {"offset": 16, "pointer": true, "size": 8}, "musicfn": {"offset": 24, "pointer": true, "size": 8}, "name": {"offset": 8, "pointer": true, "size": 8}, "partime": {"native": "Int32Array", "offset": 0, "size": 4}, "savedstate": {"offset": 32, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {})).designertime = i32(0));
}

// C/C++ source: source/duke3d/src/gamedef.cpp:2251
const __cxx_literal_26ec84b978c640e01366 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 100, 101, 102, 46, 99, 112, 112, 0]);
const __cxx_literal_4d48059c0f2495d9f1af = Uint8Array.from([85, 115, 105, 110, 103, 32, 100, 101, 102, 105, 110, 105, 116, 105, 111, 110, 115, 32, 102, 105, 108, 101, 58, 32, 37, 115, 46, 0]);
export function C_SetDefName(name) {
  clearDefNamePtr();
  (__cxx_global_cell_64336b74df686a41ba0b80a3().value = dup_filename__header_992d4c8ea5fb(name));
  if (__cxx_global_cell_64336b74df686a41ba0b80a3().value) {
    ((i32(10) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(10), __cxx_literal_26ec84b978c640e01366, u32(2256), __cxx_literal_4d48059c0f2495d9f1af, __cxx_global_cell_64336b74df686a41ba0b80a3().value));
  }
  return i32(cPointerCompare(__cxx_global_cell_64336b74df686a41ba0b80a3().value, null, "=="));
}

// C/C++ source: source/duke3d/src/gamedef.cpp:2264
export function C_AllocProjectile(j) {
  ((cPointerElementRef(cRecordPointer(g_tile, {"align": 8, "arrayAlign": 1, "fields": {"cacherange": {"native": "Int32Array", "offset": 36, "size": 4}, "defproj": {"offset": 24, "pointer": true, "size": 8}, "execPtr": {"offset": 0, "pointer": true, "size": 8}, "flags": {"native": "Uint32Array", "offset": 32, "size": 4}, "loadPtr": {"offset": 8, "pointer": true, "size": 8}, "proj": {"offset": 16, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {}), j).value).proj = cRecordPointer(xrealloc__header_d10105957532((cPointerElementRef(cRecordPointer(g_tile, {"align": 8, "arrayAlign": 1, "fields": {"cacherange": {"native": "Int32Array", "offset": 36, "size": 4}, "defproj": {"offset": 24, "pointer": true, "size": 8}, "execPtr": {"offset": 0, "pointer": true, "size": 8}, "flags": {"native": "Uint32Array", "offset": 32, "size": 4}, "loadPtr": {"offset": 8, "pointer": true, "size": 8}, "proj": {"offset": 16, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {}), j).value).proj, u64((BigInt(u64(2)) * BigInt(64)))), {"align": 4, "arrayAlign": 1, "fields": {"bounces": {"native": "Int16Array", "offset": 38, "size": 2}, "bsound": {"native": "Int16Array", "offset": 40, "size": 2}, "clipdist": {"native": "Uint8Array", "offset": 57, "size": 1}, "cstat": {"native": "Int32Array", "offset": 4, "size": 4}, "decal": {"native": "Int16Array", "offset": 28, "size": 2}, "drop": {"native": "Int16Array", "offset": 34, "size": 2}, "extra": {"native": "Int16Array", "offset": 44, "size": 2}, "extra_rand": {"native": "Int16Array", "offset": 46, "size": 2}, "filler": {"length": 2, "native": "Int8Array", "offset": 58, "size": 2}, "flashcolor": {"native": "Int32Array", "offset": 16, "size": 4}, "hitradius": {"native": "Int32Array", "offset": 8, "size": 4}, "isound": {"native": "Int16Array", "offset": 24, "size": 2}, "movecnt": {"native": "Int8Array", "offset": 56, "size": 1}, "offset": {"native": "Int16Array", "offset": 36, "size": 2}, "pal": {"native": "Int8Array", "offset": 55, "size": 1}, "range": {"native": "Int32Array", "offset": 12, "size": 4}, "shade": {"native": "Int8Array", "offset": 52, "size": 1}, "sound": {"native": "Int16Array", "offset": 22, "size": 2}, "spawns": {"native": "Int16Array", "offset": 20, "size": 2}, "sxrepeat": {"native": "Int8Array", "offset": 48, "size": 1}, "syrepeat": {"native": "Int8Array", "offset": 49, "size": 1}, "tnum": {"native": "Int16Array", "offset": 32, "size": 2}, "toffset": {"native": "Int16Array", "offset": 42, "size": 2}, "trail": {"native": "Int16Array", "offset": 30, "size": 2}, "txrepeat": {"native": "Int8Array", "offset": 50, "size": 1}, "tyrepeat": {"native": "Int8Array", "offset": 51, "size": 1}, "userdata": {"native": "Int32Array", "offset": 60, "size": 4}, "vel": {"native": "Int16Array", "offset": 26, "size": 2}, "workslike": {"native": "Int32Array", "offset": 0, "size": 4}, "xrepeat": {"native": "Int8Array", "offset": 53, "size": 1}, "yrepeat": {"native": "Int8Array", "offset": 54, "size": 1}}, "overlaps": false, "size": 64, "union": false}, {}));
  ((cPointerElementRef(cRecordPointer(g_tile, {"align": 8, "arrayAlign": 1, "fields": {"cacherange": {"native": "Int32Array", "offset": 36, "size": 4}, "defproj": {"offset": 24, "pointer": true, "size": 8}, "execPtr": {"offset": 0, "pointer": true, "size": 8}, "flags": {"native": "Uint32Array", "offset": 32, "size": 4}, "loadPtr": {"offset": 8, "pointer": true, "size": 8}, "proj": {"offset": 16, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {}), j).value).defproj = cPointerOffset((cPointerElementRef(cRecordPointer(g_tile, {"align": 8, "arrayAlign": 1, "fields": {"cacherange": {"native": "Int32Array", "offset": 36, "size": 4}, "defproj": {"offset": 24, "pointer": true, "size": 8}, "execPtr": {"offset": 0, "pointer": true, "size": 8}, "flags": {"native": "Uint32Array", "offset": 32, "size": 4}, "loadPtr": {"offset": 8, "pointer": true, "size": 8}, "proj": {"offset": 16, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {}), j).value).proj, 1, 64));
}

// C/C++ source: source/duke3d/src/gamedef.cpp:2270
export function C_FreeProjectile(j) {
  do {
    xfree__header_417fd1db3c1d((cPointerElementRef(cRecordPointer(g_tile, {"align": 8, "arrayAlign": 1, "fields": {"cacherange": {"native": "Int32Array", "offset": 36, "size": 4}, "defproj": {"offset": 24, "pointer": true, "size": 8}, "execPtr": {"offset": 0, "pointer": true, "size": 8}, "flags": {"native": "Uint32Array", "offset": 32, "size": 4}, "loadPtr": {"offset": 8, "pointer": true, "size": 8}, "proj": {"offset": 16, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {}), j).value).proj);
    ((cPointerElementRef(cRecordPointer(g_tile, {"align": 8, "arrayAlign": 1, "fields": {"cacherange": {"native": "Int32Array", "offset": 36, "size": 4}, "defproj": {"offset": 24, "pointer": true, "size": 8}, "execPtr": {"offset": 0, "pointer": true, "size": 8}, "flags": {"native": "Uint32Array", "offset": 32, "size": 4}, "loadPtr": {"offset": 8, "pointer": true, "size": 8}, "proj": {"offset": 16, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {}), j).value).proj = null);
  } while (Boolean(0));
  ((cPointerElementRef(cRecordPointer(g_tile, {"align": 8, "arrayAlign": 1, "fields": {"cacherange": {"native": "Int32Array", "offset": 36, "size": 4}, "defproj": {"offset": 24, "pointer": true, "size": 8}, "execPtr": {"offset": 0, "pointer": true, "size": 8}, "flags": {"native": "Uint32Array", "offset": 32, "size": 4}, "loadPtr": {"offset": 8, "pointer": true, "size": 8}, "proj": {"offset": 16, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {}), j).value).defproj = null);
}

// C/C++ source: source/duke3d/src/gamedef.cpp:2277
export function C_DefineProjectile(j, what, val) {
  if (cPointerCompare((cPointerElementRef(cRecordPointer(g_tile, {"align": 8, "arrayAlign": 1, "fields": {"cacherange": {"native": "Int32Array", "offset": 36, "size": 4}, "defproj": {"offset": 24, "pointer": true, "size": 8}, "execPtr": {"offset": 0, "pointer": true, "size": 8}, "flags": {"native": "Uint32Array", "offset": 32, "size": 4}, "loadPtr": {"offset": 8, "pointer": true, "size": 8}, "proj": {"offset": 16, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {}), j).value).proj, null, "==")) {
    C_AllocProjectile(j);
    cAssignAggregate(cRecordObject(cRecordPointer((cPointerElementRef(cRecordPointer(g_tile, {"align": 8, "arrayAlign": 1, "fields": {"cacherange": {"native": "Int32Array", "offset": 36, "size": 4}, "defproj": {"offset": 24, "pointer": true, "size": 8}, "execPtr": {"offset": 0, "pointer": true, "size": 8}, "flags": {"native": "Uint32Array", "offset": 32, "size": 4}, "loadPtr": {"offset": 8, "pointer": true, "size": 8}, "proj": {"offset": 16, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {}), j).value).proj, {"align": 4, "arrayAlign": 1, "fields": {"bounces": {"native": "Int16Array", "offset": 38, "size": 2}, "bsound": {"native": "Int16Array", "offset": 40, "size": 2}, "clipdist": {"native": "Uint8Array", "offset": 57, "size": 1}, "cstat": {"native": "Int32Array", "offset": 4, "size": 4}, "decal": {"native": "Int16Array", "offset": 28, "size": 2}, "drop": {"native": "Int16Array", "offset": 34, "size": 2}, "extra": {"native": "Int16Array", "offset": 44, "size": 2}, "extra_rand": {"native": "Int16Array", "offset": 46, "size": 2}, "filler": {"length": 2, "native": "Int8Array", "offset": 58, "size": 2}, "flashcolor": {"native": "Int32Array", "offset": 16, "size": 4}, "hitradius": {"native": "Int32Array", "offset": 8, "size": 4}, "isound": {"native": "Int16Array", "offset": 24, "size": 2}, "movecnt": {"native": "Int8Array", "offset": 56, "size": 1}, "offset": {"native": "Int16Array", "offset": 36, "size": 2}, "pal": {"native": "Int8Array", "offset": 55, "size": 1}, "range": {"native": "Int32Array", "offset": 12, "size": 4}, "shade": {"native": "Int8Array", "offset": 52, "size": 1}, "sound": {"native": "Int16Array", "offset": 22, "size": 2}, "spawns": {"native": "Int16Array", "offset": 20, "size": 2}, "sxrepeat": {"native": "Int8Array", "offset": 48, "size": 1}, "syrepeat": {"native": "Int8Array", "offset": 49, "size": 1}, "tnum": {"native": "Int16Array", "offset": 32, "size": 2}, "toffset": {"native": "Int16Array", "offset": 42, "size": 2}, "trail": {"native": "Int16Array", "offset": 30, "size": 2}, "txrepeat": {"native": "Int8Array", "offset": 50, "size": 1}, "tyrepeat": {"native": "Int8Array", "offset": 51, "size": 1}, "userdata": {"native": "Int32Array", "offset": 60, "size": 4}, "vel": {"native": "Int16Array", "offset": 26, "size": 2}, "workslike": {"native": "Int32Array", "offset": 0, "size": 4}, "xrepeat": {"native": "Int8Array", "offset": 53, "size": 1}, "yrepeat": {"native": "Int8Array", "offset": 54, "size": 1}}, "overlaps": false, "size": 64, "union": false}, {})), __cxx_global_cell_14b7a7066c3f6d3c98286359().value, {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"bounces": {"native": "Int16Array", "offset": 38, "size": 2}, "bsound": {"native": "Int16Array", "offset": 40, "size": 2}, "clipdist": {"native": "Uint8Array", "offset": 57, "size": 1}, "cstat": {"native": "Int32Array", "offset": 4, "size": 4}, "decal": {"native": "Int16Array", "offset": 28, "size": 2}, "drop": {"native": "Int16Array", "offset": 34, "size": 2}, "extra": {"native": "Int16Array", "offset": 44, "size": 2}, "extra_rand": {"native": "Int16Array", "offset": 46, "size": 2}, "filler": {"length": 2, "native": "Int8Array", "offset": 58, "size": 2}, "flashcolor": {"native": "Int32Array", "offset": 16, "size": 4}, "hitradius": {"native": "Int32Array", "offset": 8, "size": 4}, "isound": {"native": "Int16Array", "offset": 24, "size": 2}, "movecnt": {"native": "Int8Array", "offset": 56, "size": 1}, "offset": {"native": "Int16Array", "offset": 36, "size": 2}, "pal": {"native": "Int8Array", "offset": 55, "size": 1}, "range": {"native": "Int32Array", "offset": 12, "size": 4}, "shade": {"native": "Int8Array", "offset": 52, "size": 1}, "sound": {"native": "Int16Array", "offset": 22, "size": 2}, "spawns": {"native": "Int16Array", "offset": 20, "size": 2}, "sxrepeat": {"native": "Int8Array", "offset": 48, "size": 1}, "syrepeat": {"native": "Int8Array", "offset": 49, "size": 1}, "tnum": {"native": "Int16Array", "offset": 32, "size": 2}, "toffset": {"native": "Int16Array", "offset": 42, "size": 2}, "trail": {"native": "Int16Array", "offset": 30, "size": 2}, "txrepeat": {"native": "Int8Array", "offset": 50, "size": 1}, "tyrepeat": {"native": "Int8Array", "offset": 51, "size": 1}, "userdata": {"native": "Int32Array", "offset": 60, "size": 4}, "vel": {"native": "Int16Array", "offset": 26, "size": 2}, "workslike": {"native": "Int32Array", "offset": 0, "size": 4}, "xrepeat": {"native": "Int8Array", "offset": 53, "size": 1}, "yrepeat": {"native": "Int8Array", "offset": 54, "size": 1}}, "overlaps": false, "size": 64, "union": false}}, {"abi": "source-clang-trivial-record-assignment/1", "assignment_mode": "copyAssign", "clang_assignment_signature": "projectile_t &(const projectile_t &) noexcept", "clang_method_id": "0x1501c6c5670", "native_layout": {"abi": "source-record-field-storage/1", "sha256": "2b339c50f2282935dc0264eae8578de007a05e9c52900f1fb8a451d551e451bf"}, "record_name": "projectile_t", "source_record": "projectile_t"});
  }
  let proj = (cPointerElementRef(cRecordPointer(g_tile, {"align": 8, "arrayAlign": 1, "fields": {"cacherange": {"native": "Int32Array", "offset": 36, "size": 4}, "defproj": {"offset": 24, "pointer": true, "size": 8}, "execPtr": {"offset": 0, "pointer": true, "size": 8}, "flags": {"native": "Uint32Array", "offset": 32, "size": 4}, "loadPtr": {"offset": 8, "pointer": true, "size": 8}, "proj": {"offset": 16, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {}), j).value).proj;
  switch (what) {
    case i32(0): {
      (cRecordObject(cRecordPointer(proj, {"align": 4, "arrayAlign": 1, "fields": {"bounces": {"native": "Int16Array", "offset": 38, "size": 2}, "bsound": {"native": "Int16Array", "offset": 40, "size": 2}, "clipdist": {"native": "Uint8Array", "offset": 57, "size": 1}, "cstat": {"native": "Int32Array", "offset": 4, "size": 4}, "decal": {"native": "Int16Array", "offset": 28, "size": 2}, "drop": {"native": "Int16Array", "offset": 34, "size": 2}, "extra": {"native": "Int16Array", "offset": 44, "size": 2}, "extra_rand": {"native": "Int16Array", "offset": 46, "size": 2}, "filler": {"length": 2, "native": "Int8Array", "offset": 58, "size": 2}, "flashcolor": {"native": "Int32Array", "offset": 16, "size": 4}, "hitradius": {"native": "Int32Array", "offset": 8, "size": 4}, "isound": {"native": "Int16Array", "offset": 24, "size": 2}, "movecnt": {"native": "Int8Array", "offset": 56, "size": 1}, "offset": {"native": "Int16Array", "offset": 36, "size": 2}, "pal": {"native": "Int8Array", "offset": 55, "size": 1}, "range": {"native": "Int32Array", "offset": 12, "size": 4}, "shade": {"native": "Int8Array", "offset": 52, "size": 1}, "sound": {"native": "Int16Array", "offset": 22, "size": 2}, "spawns": {"native": "Int16Array", "offset": 20, "size": 2}, "sxrepeat": {"native": "Int8Array", "offset": 48, "size": 1}, "syrepeat": {"native": "Int8Array", "offset": 49, "size": 1}, "tnum": {"native": "Int16Array", "offset": 32, "size": 2}, "toffset": {"native": "Int16Array", "offset": 42, "size": 2}, "trail": {"native": "Int16Array", "offset": 30, "size": 2}, "txrepeat": {"native": "Int8Array", "offset": 50, "size": 1}, "tyrepeat": {"native": "Int8Array", "offset": 51, "size": 1}, "userdata": {"native": "Int32Array", "offset": 60, "size": 4}, "vel": {"native": "Int16Array", "offset": 26, "size": 2}, "workslike": {"native": "Int32Array", "offset": 0, "size": 4}, "xrepeat": {"native": "Int8Array", "offset": 53, "size": 1}, "yrepeat": {"native": "Int8Array", "offset": 54, "size": 1}}, "overlaps": false, "size": 64, "union": false}, {})).workslike = i32(val));
    }
    break;
    case i32(1): {
      (cRecordObject(cRecordPointer(proj, {"align": 4, "arrayAlign": 1, "fields": {"bounces": {"native": "Int16Array", "offset": 38, "size": 2}, "bsound": {"native": "Int16Array", "offset": 40, "size": 2}, "clipdist": {"native": "Uint8Array", "offset": 57, "size": 1}, "cstat": {"native": "Int32Array", "offset": 4, "size": 4}, "decal": {"native": "Int16Array", "offset": 28, "size": 2}, "drop": {"native": "Int16Array", "offset": 34, "size": 2}, "extra": {"native": "Int16Array", "offset": 44, "size": 2}, "extra_rand": {"native": "Int16Array", "offset": 46, "size": 2}, "filler": {"length": 2, "native": "Int8Array", "offset": 58, "size": 2}, "flashcolor": {"native": "Int32Array", "offset": 16, "size": 4}, "hitradius": {"native": "Int32Array", "offset": 8, "size": 4}, "isound": {"native": "Int16Array", "offset": 24, "size": 2}, "movecnt": {"native": "Int8Array", "offset": 56, "size": 1}, "offset": {"native": "Int16Array", "offset": 36, "size": 2}, "pal": {"native": "Int8Array", "offset": 55, "size": 1}, "range": {"native": "Int32Array", "offset": 12, "size": 4}, "shade": {"native": "Int8Array", "offset": 52, "size": 1}, "sound": {"native": "Int16Array", "offset": 22, "size": 2}, "spawns": {"native": "Int16Array", "offset": 20, "size": 2}, "sxrepeat": {"native": "Int8Array", "offset": 48, "size": 1}, "syrepeat": {"native": "Int8Array", "offset": 49, "size": 1}, "tnum": {"native": "Int16Array", "offset": 32, "size": 2}, "toffset": {"native": "Int16Array", "offset": 42, "size": 2}, "trail": {"native": "Int16Array", "offset": 30, "size": 2}, "txrepeat": {"native": "Int8Array", "offset": 50, "size": 1}, "tyrepeat": {"native": "Int8Array", "offset": 51, "size": 1}, "userdata": {"native": "Int32Array", "offset": 60, "size": 4}, "vel": {"native": "Int16Array", "offset": 26, "size": 2}, "workslike": {"native": "Int32Array", "offset": 0, "size": 4}, "xrepeat": {"native": "Int8Array", "offset": 53, "size": 1}, "yrepeat": {"native": "Int8Array", "offset": 54, "size": 1}}, "overlaps": false, "size": 64, "union": false}, {})).spawns = ((u32(((u32(val) << 16) >> 16)) << 16) >> 16));
    }
    break;
    case i32(2): {
      (cRecordObject(cRecordPointer(proj, {"align": 4, "arrayAlign": 1, "fields": {"bounces": {"native": "Int16Array", "offset": 38, "size": 2}, "bsound": {"native": "Int16Array", "offset": 40, "size": 2}, "clipdist": {"native": "Uint8Array", "offset": 57, "size": 1}, "cstat": {"native": "Int32Array", "offset": 4, "size": 4}, "decal": {"native": "Int16Array", "offset": 28, "size": 2}, "drop": {"native": "Int16Array", "offset": 34, "size": 2}, "extra": {"native": "Int16Array", "offset": 44, "size": 2}, "extra_rand": {"native": "Int16Array", "offset": 46, "size": 2}, "filler": {"length": 2, "native": "Int8Array", "offset": 58, "size": 2}, "flashcolor": {"native": "Int32Array", "offset": 16, "size": 4}, "hitradius": {"native": "Int32Array", "offset": 8, "size": 4}, "isound": {"native": "Int16Array", "offset": 24, "size": 2}, "movecnt": {"native": "Int8Array", "offset": 56, "size": 1}, "offset": {"native": "Int16Array", "offset": 36, "size": 2}, "pal": {"native": "Int8Array", "offset": 55, "size": 1}, "range": {"native": "Int32Array", "offset": 12, "size": 4}, "shade": {"native": "Int8Array", "offset": 52, "size": 1}, "sound": {"native": "Int16Array", "offset": 22, "size": 2}, "spawns": {"native": "Int16Array", "offset": 20, "size": 2}, "sxrepeat": {"native": "Int8Array", "offset": 48, "size": 1}, "syrepeat": {"native": "Int8Array", "offset": 49, "size": 1}, "tnum": {"native": "Int16Array", "offset": 32, "size": 2}, "toffset": {"native": "Int16Array", "offset": 42, "size": 2}, "trail": {"native": "Int16Array", "offset": 30, "size": 2}, "txrepeat": {"native": "Int8Array", "offset": 50, "size": 1}, "tyrepeat": {"native": "Int8Array", "offset": 51, "size": 1}, "userdata": {"native": "Int32Array", "offset": 60, "size": 4}, "vel": {"native": "Int16Array", "offset": 26, "size": 2}, "workslike": {"native": "Int32Array", "offset": 0, "size": 4}, "xrepeat": {"native": "Int8Array", "offset": 53, "size": 1}, "yrepeat": {"native": "Int8Array", "offset": 54, "size": 1}}, "overlaps": false, "size": 64, "union": false}, {})).sxrepeat = ((u32(((u32(val) << 24) >> 24)) << 24) >> 24));
    }
    break;
    case i32(3): {
      (cRecordObject(cRecordPointer(proj, {"align": 4, "arrayAlign": 1, "fields": {"bounces": {"native": "Int16Array", "offset": 38, "size": 2}, "bsound": {"native": "Int16Array", "offset": 40, "size": 2}, "clipdist": {"native": "Uint8Array", "offset": 57, "size": 1}, "cstat": {"native": "Int32Array", "offset": 4, "size": 4}, "decal": {"native": "Int16Array", "offset": 28, "size": 2}, "drop": {"native": "Int16Array", "offset": 34, "size": 2}, "extra": {"native": "Int16Array", "offset": 44, "size": 2}, "extra_rand": {"native": "Int16Array", "offset": 46, "size": 2}, "filler": {"length": 2, "native": "Int8Array", "offset": 58, "size": 2}, "flashcolor": {"native": "Int32Array", "offset": 16, "size": 4}, "hitradius": {"native": "Int32Array", "offset": 8, "size": 4}, "isound": {"native": "Int16Array", "offset": 24, "size": 2}, "movecnt": {"native": "Int8Array", "offset": 56, "size": 1}, "offset": {"native": "Int16Array", "offset": 36, "size": 2}, "pal": {"native": "Int8Array", "offset": 55, "size": 1}, "range": {"native": "Int32Array", "offset": 12, "size": 4}, "shade": {"native": "Int8Array", "offset": 52, "size": 1}, "sound": {"native": "Int16Array", "offset": 22, "size": 2}, "spawns": {"native": "Int16Array", "offset": 20, "size": 2}, "sxrepeat": {"native": "Int8Array", "offset": 48, "size": 1}, "syrepeat": {"native": "Int8Array", "offset": 49, "size": 1}, "tnum": {"native": "Int16Array", "offset": 32, "size": 2}, "toffset": {"native": "Int16Array", "offset": 42, "size": 2}, "trail": {"native": "Int16Array", "offset": 30, "size": 2}, "txrepeat": {"native": "Int8Array", "offset": 50, "size": 1}, "tyrepeat": {"native": "Int8Array", "offset": 51, "size": 1}, "userdata": {"native": "Int32Array", "offset": 60, "size": 4}, "vel": {"native": "Int16Array", "offset": 26, "size": 2}, "workslike": {"native": "Int32Array", "offset": 0, "size": 4}, "xrepeat": {"native": "Int8Array", "offset": 53, "size": 1}, "yrepeat": {"native": "Int8Array", "offset": 54, "size": 1}}, "overlaps": false, "size": 64, "union": false}, {})).syrepeat = ((u32(((u32(val) << 24) >> 24)) << 24) >> 24));
    }
    break;
    case i32(4): {
      (cRecordObject(cRecordPointer(proj, {"align": 4, "arrayAlign": 1, "fields": {"bounces": {"native": "Int16Array", "offset": 38, "size": 2}, "bsound": {"native": "Int16Array", "offset": 40, "size": 2}, "clipdist": {"native": "Uint8Array", "offset": 57, "size": 1}, "cstat": {"native": "Int32Array", "offset": 4, "size": 4}, "decal": {"native": "Int16Array", "offset": 28, "size": 2}, "drop": {"native": "Int16Array", "offset": 34, "size": 2}, "extra": {"native": "Int16Array", "offset": 44, "size": 2}, "extra_rand": {"native": "Int16Array", "offset": 46, "size": 2}, "filler": {"length": 2, "native": "Int8Array", "offset": 58, "size": 2}, "flashcolor": {"native": "Int32Array", "offset": 16, "size": 4}, "hitradius": {"native": "Int32Array", "offset": 8, "size": 4}, "isound": {"native": "Int16Array", "offset": 24, "size": 2}, "movecnt": {"native": "Int8Array", "offset": 56, "size": 1}, "offset": {"native": "Int16Array", "offset": 36, "size": 2}, "pal": {"native": "Int8Array", "offset": 55, "size": 1}, "range": {"native": "Int32Array", "offset": 12, "size": 4}, "shade": {"native": "Int8Array", "offset": 52, "size": 1}, "sound": {"native": "Int16Array", "offset": 22, "size": 2}, "spawns": {"native": "Int16Array", "offset": 20, "size": 2}, "sxrepeat": {"native": "Int8Array", "offset": 48, "size": 1}, "syrepeat": {"native": "Int8Array", "offset": 49, "size": 1}, "tnum": {"native": "Int16Array", "offset": 32, "size": 2}, "toffset": {"native": "Int16Array", "offset": 42, "size": 2}, "trail": {"native": "Int16Array", "offset": 30, "size": 2}, "txrepeat": {"native": "Int8Array", "offset": 50, "size": 1}, "tyrepeat": {"native": "Int8Array", "offset": 51, "size": 1}, "userdata": {"native": "Int32Array", "offset": 60, "size": 4}, "vel": {"native": "Int16Array", "offset": 26, "size": 2}, "workslike": {"native": "Int32Array", "offset": 0, "size": 4}, "xrepeat": {"native": "Int8Array", "offset": 53, "size": 1}, "yrepeat": {"native": "Int8Array", "offset": 54, "size": 1}}, "overlaps": false, "size": 64, "union": false}, {})).sound = ((u32(((u32(val) << 16) >> 16)) << 16) >> 16));
    }
    break;
    case i32(5): {
      (cRecordObject(cRecordPointer(proj, {"align": 4, "arrayAlign": 1, "fields": {"bounces": {"native": "Int16Array", "offset": 38, "size": 2}, "bsound": {"native": "Int16Array", "offset": 40, "size": 2}, "clipdist": {"native": "Uint8Array", "offset": 57, "size": 1}, "cstat": {"native": "Int32Array", "offset": 4, "size": 4}, "decal": {"native": "Int16Array", "offset": 28, "size": 2}, "drop": {"native": "Int16Array", "offset": 34, "size": 2}, "extra": {"native": "Int16Array", "offset": 44, "size": 2}, "extra_rand": {"native": "Int16Array", "offset": 46, "size": 2}, "filler": {"length": 2, "native": "Int8Array", "offset": 58, "size": 2}, "flashcolor": {"native": "Int32Array", "offset": 16, "size": 4}, "hitradius": {"native": "Int32Array", "offset": 8, "size": 4}, "isound": {"native": "Int16Array", "offset": 24, "size": 2}, "movecnt": {"native": "Int8Array", "offset": 56, "size": 1}, "offset": {"native": "Int16Array", "offset": 36, "size": 2}, "pal": {"native": "Int8Array", "offset": 55, "size": 1}, "range": {"native": "Int32Array", "offset": 12, "size": 4}, "shade": {"native": "Int8Array", "offset": 52, "size": 1}, "sound": {"native": "Int16Array", "offset": 22, "size": 2}, "spawns": {"native": "Int16Array", "offset": 20, "size": 2}, "sxrepeat": {"native": "Int8Array", "offset": 48, "size": 1}, "syrepeat": {"native": "Int8Array", "offset": 49, "size": 1}, "tnum": {"native": "Int16Array", "offset": 32, "size": 2}, "toffset": {"native": "Int16Array", "offset": 42, "size": 2}, "trail": {"native": "Int16Array", "offset": 30, "size": 2}, "txrepeat": {"native": "Int8Array", "offset": 50, "size": 1}, "tyrepeat": {"native": "Int8Array", "offset": 51, "size": 1}, "userdata": {"native": "Int32Array", "offset": 60, "size": 4}, "vel": {"native": "Int16Array", "offset": 26, "size": 2}, "workslike": {"native": "Int32Array", "offset": 0, "size": 4}, "xrepeat": {"native": "Int8Array", "offset": 53, "size": 1}, "yrepeat": {"native": "Int8Array", "offset": 54, "size": 1}}, "overlaps": false, "size": 64, "union": false}, {})).isound = ((u32(((u32(val) << 16) >> 16)) << 16) >> 16));
    }
    break;
    case i32(6): {
      (cRecordObject(cRecordPointer(proj, {"align": 4, "arrayAlign": 1, "fields": {"bounces": {"native": "Int16Array", "offset": 38, "size": 2}, "bsound": {"native": "Int16Array", "offset": 40, "size": 2}, "clipdist": {"native": "Uint8Array", "offset": 57, "size": 1}, "cstat": {"native": "Int32Array", "offset": 4, "size": 4}, "decal": {"native": "Int16Array", "offset": 28, "size": 2}, "drop": {"native": "Int16Array", "offset": 34, "size": 2}, "extra": {"native": "Int16Array", "offset": 44, "size": 2}, "extra_rand": {"native": "Int16Array", "offset": 46, "size": 2}, "filler": {"length": 2, "native": "Int8Array", "offset": 58, "size": 2}, "flashcolor": {"native": "Int32Array", "offset": 16, "size": 4}, "hitradius": {"native": "Int32Array", "offset": 8, "size": 4}, "isound": {"native": "Int16Array", "offset": 24, "size": 2}, "movecnt": {"native": "Int8Array", "offset": 56, "size": 1}, "offset": {"native": "Int16Array", "offset": 36, "size": 2}, "pal": {"native": "Int8Array", "offset": 55, "size": 1}, "range": {"native": "Int32Array", "offset": 12, "size": 4}, "shade": {"native": "Int8Array", "offset": 52, "size": 1}, "sound": {"native": "Int16Array", "offset": 22, "size": 2}, "spawns": {"native": "Int16Array", "offset": 20, "size": 2}, "sxrepeat": {"native": "Int8Array", "offset": 48, "size": 1}, "syrepeat": {"native": "Int8Array", "offset": 49, "size": 1}, "tnum": {"native": "Int16Array", "offset": 32, "size": 2}, "toffset": {"native": "Int16Array", "offset": 42, "size": 2}, "trail": {"native": "Int16Array", "offset": 30, "size": 2}, "txrepeat": {"native": "Int8Array", "offset": 50, "size": 1}, "tyrepeat": {"native": "Int8Array", "offset": 51, "size": 1}, "userdata": {"native": "Int32Array", "offset": 60, "size": 4}, "vel": {"native": "Int16Array", "offset": 26, "size": 2}, "workslike": {"native": "Int32Array", "offset": 0, "size": 4}, "xrepeat": {"native": "Int8Array", "offset": 53, "size": 1}, "yrepeat": {"native": "Int8Array", "offset": 54, "size": 1}}, "overlaps": false, "size": 64, "union": false}, {})).vel = ((u32(((u32(val) << 16) >> 16)) << 16) >> 16));
    }
    break;
    case i32(7): {
      (cRecordObject(cRecordPointer(proj, {"align": 4, "arrayAlign": 1, "fields": {"bounces": {"native": "Int16Array", "offset": 38, "size": 2}, "bsound": {"native": "Int16Array", "offset": 40, "size": 2}, "clipdist": {"native": "Uint8Array", "offset": 57, "size": 1}, "cstat": {"native": "Int32Array", "offset": 4, "size": 4}, "decal": {"native": "Int16Array", "offset": 28, "size": 2}, "drop": {"native": "Int16Array", "offset": 34, "size": 2}, "extra": {"native": "Int16Array", "offset": 44, "size": 2}, "extra_rand": {"native": "Int16Array", "offset": 46, "size": 2}, "filler": {"length": 2, "native": "Int8Array", "offset": 58, "size": 2}, "flashcolor": {"native": "Int32Array", "offset": 16, "size": 4}, "hitradius": {"native": "Int32Array", "offset": 8, "size": 4}, "isound": {"native": "Int16Array", "offset": 24, "size": 2}, "movecnt": {"native": "Int8Array", "offset": 56, "size": 1}, "offset": {"native": "Int16Array", "offset": 36, "size": 2}, "pal": {"native": "Int8Array", "offset": 55, "size": 1}, "range": {"native": "Int32Array", "offset": 12, "size": 4}, "shade": {"native": "Int8Array", "offset": 52, "size": 1}, "sound": {"native": "Int16Array", "offset": 22, "size": 2}, "spawns": {"native": "Int16Array", "offset": 20, "size": 2}, "sxrepeat": {"native": "Int8Array", "offset": 48, "size": 1}, "syrepeat": {"native": "Int8Array", "offset": 49, "size": 1}, "tnum": {"native": "Int16Array", "offset": 32, "size": 2}, "toffset": {"native": "Int16Array", "offset": 42, "size": 2}, "trail": {"native": "Int16Array", "offset": 30, "size": 2}, "txrepeat": {"native": "Int8Array", "offset": 50, "size": 1}, "tyrepeat": {"native": "Int8Array", "offset": 51, "size": 1}, "userdata": {"native": "Int32Array", "offset": 60, "size": 4}, "vel": {"native": "Int16Array", "offset": 26, "size": 2}, "workslike": {"native": "Int32Array", "offset": 0, "size": 4}, "xrepeat": {"native": "Int8Array", "offset": 53, "size": 1}, "yrepeat": {"native": "Int8Array", "offset": 54, "size": 1}}, "overlaps": false, "size": 64, "union": false}, {})).extra = ((u32(((u32(val) << 16) >> 16)) << 16) >> 16));
    }
    break;
    case i32(8): {
      (cRecordObject(cRecordPointer(proj, {"align": 4, "arrayAlign": 1, "fields": {"bounces": {"native": "Int16Array", "offset": 38, "size": 2}, "bsound": {"native": "Int16Array", "offset": 40, "size": 2}, "clipdist": {"native": "Uint8Array", "offset": 57, "size": 1}, "cstat": {"native": "Int32Array", "offset": 4, "size": 4}, "decal": {"native": "Int16Array", "offset": 28, "size": 2}, "drop": {"native": "Int16Array", "offset": 34, "size": 2}, "extra": {"native": "Int16Array", "offset": 44, "size": 2}, "extra_rand": {"native": "Int16Array", "offset": 46, "size": 2}, "filler": {"length": 2, "native": "Int8Array", "offset": 58, "size": 2}, "flashcolor": {"native": "Int32Array", "offset": 16, "size": 4}, "hitradius": {"native": "Int32Array", "offset": 8, "size": 4}, "isound": {"native": "Int16Array", "offset": 24, "size": 2}, "movecnt": {"native": "Int8Array", "offset": 56, "size": 1}, "offset": {"native": "Int16Array", "offset": 36, "size": 2}, "pal": {"native": "Int8Array", "offset": 55, "size": 1}, "range": {"native": "Int32Array", "offset": 12, "size": 4}, "shade": {"native": "Int8Array", "offset": 52, "size": 1}, "sound": {"native": "Int16Array", "offset": 22, "size": 2}, "spawns": {"native": "Int16Array", "offset": 20, "size": 2}, "sxrepeat": {"native": "Int8Array", "offset": 48, "size": 1}, "syrepeat": {"native": "Int8Array", "offset": 49, "size": 1}, "tnum": {"native": "Int16Array", "offset": 32, "size": 2}, "toffset": {"native": "Int16Array", "offset": 42, "size": 2}, "trail": {"native": "Int16Array", "offset": 30, "size": 2}, "txrepeat": {"native": "Int8Array", "offset": 50, "size": 1}, "tyrepeat": {"native": "Int8Array", "offset": 51, "size": 1}, "userdata": {"native": "Int32Array", "offset": 60, "size": 4}, "vel": {"native": "Int16Array", "offset": 26, "size": 2}, "workslike": {"native": "Int32Array", "offset": 0, "size": 4}, "xrepeat": {"native": "Int8Array", "offset": 53, "size": 1}, "yrepeat": {"native": "Int8Array", "offset": 54, "size": 1}}, "overlaps": false, "size": 64, "union": false}, {})).decal = ((u32(((u32(val) << 16) >> 16)) << 16) >> 16));
    }
    break;
    case i32(9): {
      (cRecordObject(cRecordPointer(proj, {"align": 4, "arrayAlign": 1, "fields": {"bounces": {"native": "Int16Array", "offset": 38, "size": 2}, "bsound": {"native": "Int16Array", "offset": 40, "size": 2}, "clipdist": {"native": "Uint8Array", "offset": 57, "size": 1}, "cstat": {"native": "Int32Array", "offset": 4, "size": 4}, "decal": {"native": "Int16Array", "offset": 28, "size": 2}, "drop": {"native": "Int16Array", "offset": 34, "size": 2}, "extra": {"native": "Int16Array", "offset": 44, "size": 2}, "extra_rand": {"native": "Int16Array", "offset": 46, "size": 2}, "filler": {"length": 2, "native": "Int8Array", "offset": 58, "size": 2}, "flashcolor": {"native": "Int32Array", "offset": 16, "size": 4}, "hitradius": {"native": "Int32Array", "offset": 8, "size": 4}, "isound": {"native": "Int16Array", "offset": 24, "size": 2}, "movecnt": {"native": "Int8Array", "offset": 56, "size": 1}, "offset": {"native": "Int16Array", "offset": 36, "size": 2}, "pal": {"native": "Int8Array", "offset": 55, "size": 1}, "range": {"native": "Int32Array", "offset": 12, "size": 4}, "shade": {"native": "Int8Array", "offset": 52, "size": 1}, "sound": {"native": "Int16Array", "offset": 22, "size": 2}, "spawns": {"native": "Int16Array", "offset": 20, "size": 2}, "sxrepeat": {"native": "Int8Array", "offset": 48, "size": 1}, "syrepeat": {"native": "Int8Array", "offset": 49, "size": 1}, "tnum": {"native": "Int16Array", "offset": 32, "size": 2}, "toffset": {"native": "Int16Array", "offset": 42, "size": 2}, "trail": {"native": "Int16Array", "offset": 30, "size": 2}, "txrepeat": {"native": "Int8Array", "offset": 50, "size": 1}, "tyrepeat": {"native": "Int8Array", "offset": 51, "size": 1}, "userdata": {"native": "Int32Array", "offset": 60, "size": 4}, "vel": {"native": "Int16Array", "offset": 26, "size": 2}, "workslike": {"native": "Int32Array", "offset": 0, "size": 4}, "xrepeat": {"native": "Int8Array", "offset": 53, "size": 1}, "yrepeat": {"native": "Int8Array", "offset": 54, "size": 1}}, "overlaps": false, "size": 64, "union": false}, {})).trail = ((u32(((u32(val) << 16) >> 16)) << 16) >> 16));
    }
    break;
    case i32(10): {
      (cRecordObject(cRecordPointer(proj, {"align": 4, "arrayAlign": 1, "fields": {"bounces": {"native": "Int16Array", "offset": 38, "size": 2}, "bsound": {"native": "Int16Array", "offset": 40, "size": 2}, "clipdist": {"native": "Uint8Array", "offset": 57, "size": 1}, "cstat": {"native": "Int32Array", "offset": 4, "size": 4}, "decal": {"native": "Int16Array", "offset": 28, "size": 2}, "drop": {"native": "Int16Array", "offset": 34, "size": 2}, "extra": {"native": "Int16Array", "offset": 44, "size": 2}, "extra_rand": {"native": "Int16Array", "offset": 46, "size": 2}, "filler": {"length": 2, "native": "Int8Array", "offset": 58, "size": 2}, "flashcolor": {"native": "Int32Array", "offset": 16, "size": 4}, "hitradius": {"native": "Int32Array", "offset": 8, "size": 4}, "isound": {"native": "Int16Array", "offset": 24, "size": 2}, "movecnt": {"native": "Int8Array", "offset": 56, "size": 1}, "offset": {"native": "Int16Array", "offset": 36, "size": 2}, "pal": {"native": "Int8Array", "offset": 55, "size": 1}, "range": {"native": "Int32Array", "offset": 12, "size": 4}, "shade": {"native": "Int8Array", "offset": 52, "size": 1}, "sound": {"native": "Int16Array", "offset": 22, "size": 2}, "spawns": {"native": "Int16Array", "offset": 20, "size": 2}, "sxrepeat": {"native": "Int8Array", "offset": 48, "size": 1}, "syrepeat": {"native": "Int8Array", "offset": 49, "size": 1}, "tnum": {"native": "Int16Array", "offset": 32, "size": 2}, "toffset": {"native": "Int16Array", "offset": 42, "size": 2}, "trail": {"native": "Int16Array", "offset": 30, "size": 2}, "txrepeat": {"native": "Int8Array", "offset": 50, "size": 1}, "tyrepeat": {"native": "Int8Array", "offset": 51, "size": 1}, "userdata": {"native": "Int32Array", "offset": 60, "size": 4}, "vel": {"native": "Int16Array", "offset": 26, "size": 2}, "workslike": {"native": "Int32Array", "offset": 0, "size": 4}, "xrepeat": {"native": "Int8Array", "offset": 53, "size": 1}, "yrepeat": {"native": "Int8Array", "offset": 54, "size": 1}}, "overlaps": false, "size": 64, "union": false}, {})).txrepeat = ((u32(((u32(val) << 24) >> 24)) << 24) >> 24));
    }
    break;
    case i32(11): {
      (cRecordObject(cRecordPointer(proj, {"align": 4, "arrayAlign": 1, "fields": {"bounces": {"native": "Int16Array", "offset": 38, "size": 2}, "bsound": {"native": "Int16Array", "offset": 40, "size": 2}, "clipdist": {"native": "Uint8Array", "offset": 57, "size": 1}, "cstat": {"native": "Int32Array", "offset": 4, "size": 4}, "decal": {"native": "Int16Array", "offset": 28, "size": 2}, "drop": {"native": "Int16Array", "offset": 34, "size": 2}, "extra": {"native": "Int16Array", "offset": 44, "size": 2}, "extra_rand": {"native": "Int16Array", "offset": 46, "size": 2}, "filler": {"length": 2, "native": "Int8Array", "offset": 58, "size": 2}, "flashcolor": {"native": "Int32Array", "offset": 16, "size": 4}, "hitradius": {"native": "Int32Array", "offset": 8, "size": 4}, "isound": {"native": "Int16Array", "offset": 24, "size": 2}, "movecnt": {"native": "Int8Array", "offset": 56, "size": 1}, "offset": {"native": "Int16Array", "offset": 36, "size": 2}, "pal": {"native": "Int8Array", "offset": 55, "size": 1}, "range": {"native": "Int32Array", "offset": 12, "size": 4}, "shade": {"native": "Int8Array", "offset": 52, "size": 1}, "sound": {"native": "Int16Array", "offset": 22, "size": 2}, "spawns": {"native": "Int16Array", "offset": 20, "size": 2}, "sxrepeat": {"native": "Int8Array", "offset": 48, "size": 1}, "syrepeat": {"native": "Int8Array", "offset": 49, "size": 1}, "tnum": {"native": "Int16Array", "offset": 32, "size": 2}, "toffset": {"native": "Int16Array", "offset": 42, "size": 2}, "trail": {"native": "Int16Array", "offset": 30, "size": 2}, "txrepeat": {"native": "Int8Array", "offset": 50, "size": 1}, "tyrepeat": {"native": "Int8Array", "offset": 51, "size": 1}, "userdata": {"native": "Int32Array", "offset": 60, "size": 4}, "vel": {"native": "Int16Array", "offset": 26, "size": 2}, "workslike": {"native": "Int32Array", "offset": 0, "size": 4}, "xrepeat": {"native": "Int8Array", "offset": 53, "size": 1}, "yrepeat": {"native": "Int8Array", "offset": 54, "size": 1}}, "overlaps": false, "size": 64, "union": false}, {})).tyrepeat = ((u32(((u32(val) << 24) >> 24)) << 24) >> 24));
    }
    break;
    case i32(12): {
      (cRecordObject(cRecordPointer(proj, {"align": 4, "arrayAlign": 1, "fields": {"bounces": {"native": "Int16Array", "offset": 38, "size": 2}, "bsound": {"native": "Int16Array", "offset": 40, "size": 2}, "clipdist": {"native": "Uint8Array", "offset": 57, "size": 1}, "cstat": {"native": "Int32Array", "offset": 4, "size": 4}, "decal": {"native": "Int16Array", "offset": 28, "size": 2}, "drop": {"native": "Int16Array", "offset": 34, "size": 2}, "extra": {"native": "Int16Array", "offset": 44, "size": 2}, "extra_rand": {"native": "Int16Array", "offset": 46, "size": 2}, "filler": {"length": 2, "native": "Int8Array", "offset": 58, "size": 2}, "flashcolor": {"native": "Int32Array", "offset": 16, "size": 4}, "hitradius": {"native": "Int32Array", "offset": 8, "size": 4}, "isound": {"native": "Int16Array", "offset": 24, "size": 2}, "movecnt": {"native": "Int8Array", "offset": 56, "size": 1}, "offset": {"native": "Int16Array", "offset": 36, "size": 2}, "pal": {"native": "Int8Array", "offset": 55, "size": 1}, "range": {"native": "Int32Array", "offset": 12, "size": 4}, "shade": {"native": "Int8Array", "offset": 52, "size": 1}, "sound": {"native": "Int16Array", "offset": 22, "size": 2}, "spawns": {"native": "Int16Array", "offset": 20, "size": 2}, "sxrepeat": {"native": "Int8Array", "offset": 48, "size": 1}, "syrepeat": {"native": "Int8Array", "offset": 49, "size": 1}, "tnum": {"native": "Int16Array", "offset": 32, "size": 2}, "toffset": {"native": "Int16Array", "offset": 42, "size": 2}, "trail": {"native": "Int16Array", "offset": 30, "size": 2}, "txrepeat": {"native": "Int8Array", "offset": 50, "size": 1}, "tyrepeat": {"native": "Int8Array", "offset": 51, "size": 1}, "userdata": {"native": "Int32Array", "offset": 60, "size": 4}, "vel": {"native": "Int16Array", "offset": 26, "size": 2}, "workslike": {"native": "Int32Array", "offset": 0, "size": 4}, "xrepeat": {"native": "Int8Array", "offset": 53, "size": 1}, "yrepeat": {"native": "Int8Array", "offset": 54, "size": 1}}, "overlaps": false, "size": 64, "union": false}, {})).toffset = ((u32(((u32(val) << 16) >> 16)) << 16) >> 16));
    }
    break;
    case i32(13): {
      (cRecordObject(cRecordPointer(proj, {"align": 4, "arrayAlign": 1, "fields": {"bounces": {"native": "Int16Array", "offset": 38, "size": 2}, "bsound": {"native": "Int16Array", "offset": 40, "size": 2}, "clipdist": {"native": "Uint8Array", "offset": 57, "size": 1}, "cstat": {"native": "Int32Array", "offset": 4, "size": 4}, "decal": {"native": "Int16Array", "offset": 28, "size": 2}, "drop": {"native": "Int16Array", "offset": 34, "size": 2}, "extra": {"native": "Int16Array", "offset": 44, "size": 2}, "extra_rand": {"native": "Int16Array", "offset": 46, "size": 2}, "filler": {"length": 2, "native": "Int8Array", "offset": 58, "size": 2}, "flashcolor": {"native": "Int32Array", "offset": 16, "size": 4}, "hitradius": {"native": "Int32Array", "offset": 8, "size": 4}, "isound": {"native": "Int16Array", "offset": 24, "size": 2}, "movecnt": {"native": "Int8Array", "offset": 56, "size": 1}, "offset": {"native": "Int16Array", "offset": 36, "size": 2}, "pal": {"native": "Int8Array", "offset": 55, "size": 1}, "range": {"native": "Int32Array", "offset": 12, "size": 4}, "shade": {"native": "Int8Array", "offset": 52, "size": 1}, "sound": {"native": "Int16Array", "offset": 22, "size": 2}, "spawns": {"native": "Int16Array", "offset": 20, "size": 2}, "sxrepeat": {"native": "Int8Array", "offset": 48, "size": 1}, "syrepeat": {"native": "Int8Array", "offset": 49, "size": 1}, "tnum": {"native": "Int16Array", "offset": 32, "size": 2}, "toffset": {"native": "Int16Array", "offset": 42, "size": 2}, "trail": {"native": "Int16Array", "offset": 30, "size": 2}, "txrepeat": {"native": "Int8Array", "offset": 50, "size": 1}, "tyrepeat": {"native": "Int8Array", "offset": 51, "size": 1}, "userdata": {"native": "Int32Array", "offset": 60, "size": 4}, "vel": {"native": "Int16Array", "offset": 26, "size": 2}, "workslike": {"native": "Int32Array", "offset": 0, "size": 4}, "xrepeat": {"native": "Int8Array", "offset": 53, "size": 1}, "yrepeat": {"native": "Int8Array", "offset": 54, "size": 1}}, "overlaps": false, "size": 64, "union": false}, {})).tnum = ((u32(((u32(val) << 16) >> 16)) << 16) >> 16));
    }
    break;
    case i32(14): {
      (cRecordObject(cRecordPointer(proj, {"align": 4, "arrayAlign": 1, "fields": {"bounces": {"native": "Int16Array", "offset": 38, "size": 2}, "bsound": {"native": "Int16Array", "offset": 40, "size": 2}, "clipdist": {"native": "Uint8Array", "offset": 57, "size": 1}, "cstat": {"native": "Int32Array", "offset": 4, "size": 4}, "decal": {"native": "Int16Array", "offset": 28, "size": 2}, "drop": {"native": "Int16Array", "offset": 34, "size": 2}, "extra": {"native": "Int16Array", "offset": 44, "size": 2}, "extra_rand": {"native": "Int16Array", "offset": 46, "size": 2}, "filler": {"length": 2, "native": "Int8Array", "offset": 58, "size": 2}, "flashcolor": {"native": "Int32Array", "offset": 16, "size": 4}, "hitradius": {"native": "Int32Array", "offset": 8, "size": 4}, "isound": {"native": "Int16Array", "offset": 24, "size": 2}, "movecnt": {"native": "Int8Array", "offset": 56, "size": 1}, "offset": {"native": "Int16Array", "offset": 36, "size": 2}, "pal": {"native": "Int8Array", "offset": 55, "size": 1}, "range": {"native": "Int32Array", "offset": 12, "size": 4}, "shade": {"native": "Int8Array", "offset": 52, "size": 1}, "sound": {"native": "Int16Array", "offset": 22, "size": 2}, "spawns": {"native": "Int16Array", "offset": 20, "size": 2}, "sxrepeat": {"native": "Int8Array", "offset": 48, "size": 1}, "syrepeat": {"native": "Int8Array", "offset": 49, "size": 1}, "tnum": {"native": "Int16Array", "offset": 32, "size": 2}, "toffset": {"native": "Int16Array", "offset": 42, "size": 2}, "trail": {"native": "Int16Array", "offset": 30, "size": 2}, "txrepeat": {"native": "Int8Array", "offset": 50, "size": 1}, "tyrepeat": {"native": "Int8Array", "offset": 51, "size": 1}, "userdata": {"native": "Int32Array", "offset": 60, "size": 4}, "vel": {"native": "Int16Array", "offset": 26, "size": 2}, "workslike": {"native": "Int32Array", "offset": 0, "size": 4}, "xrepeat": {"native": "Int8Array", "offset": 53, "size": 1}, "yrepeat": {"native": "Int8Array", "offset": 54, "size": 1}}, "overlaps": false, "size": 64, "union": false}, {})).drop = ((u32(((u32(val) << 16) >> 16)) << 16) >> 16));
    }
    break;
    case i32(15): {
      (cRecordObject(cRecordPointer(proj, {"align": 4, "arrayAlign": 1, "fields": {"bounces": {"native": "Int16Array", "offset": 38, "size": 2}, "bsound": {"native": "Int16Array", "offset": 40, "size": 2}, "clipdist": {"native": "Uint8Array", "offset": 57, "size": 1}, "cstat": {"native": "Int32Array", "offset": 4, "size": 4}, "decal": {"native": "Int16Array", "offset": 28, "size": 2}, "drop": {"native": "Int16Array", "offset": 34, "size": 2}, "extra": {"native": "Int16Array", "offset": 44, "size": 2}, "extra_rand": {"native": "Int16Array", "offset": 46, "size": 2}, "filler": {"length": 2, "native": "Int8Array", "offset": 58, "size": 2}, "flashcolor": {"native": "Int32Array", "offset": 16, "size": 4}, "hitradius": {"native": "Int32Array", "offset": 8, "size": 4}, "isound": {"native": "Int16Array", "offset": 24, "size": 2}, "movecnt": {"native": "Int8Array", "offset": 56, "size": 1}, "offset": {"native": "Int16Array", "offset": 36, "size": 2}, "pal": {"native": "Int8Array", "offset": 55, "size": 1}, "range": {"native": "Int32Array", "offset": 12, "size": 4}, "shade": {"native": "Int8Array", "offset": 52, "size": 1}, "sound": {"native": "Int16Array", "offset": 22, "size": 2}, "spawns": {"native": "Int16Array", "offset": 20, "size": 2}, "sxrepeat": {"native": "Int8Array", "offset": 48, "size": 1}, "syrepeat": {"native": "Int8Array", "offset": 49, "size": 1}, "tnum": {"native": "Int16Array", "offset": 32, "size": 2}, "toffset": {"native": "Int16Array", "offset": 42, "size": 2}, "trail": {"native": "Int16Array", "offset": 30, "size": 2}, "txrepeat": {"native": "Int8Array", "offset": 50, "size": 1}, "tyrepeat": {"native": "Int8Array", "offset": 51, "size": 1}, "userdata": {"native": "Int32Array", "offset": 60, "size": 4}, "vel": {"native": "Int16Array", "offset": 26, "size": 2}, "workslike": {"native": "Int32Array", "offset": 0, "size": 4}, "xrepeat": {"native": "Int8Array", "offset": 53, "size": 1}, "yrepeat": {"native": "Int8Array", "offset": 54, "size": 1}}, "overlaps": false, "size": 64, "union": false}, {})).cstat = i32(val));
    }
    break;
    case i32(16): {
      (cRecordObject(cRecordPointer(proj, {"align": 4, "arrayAlign": 1, "fields": {"bounces": {"native": "Int16Array", "offset": 38, "size": 2}, "bsound": {"native": "Int16Array", "offset": 40, "size": 2}, "clipdist": {"native": "Uint8Array", "offset": 57, "size": 1}, "cstat": {"native": "Int32Array", "offset": 4, "size": 4}, "decal": {"native": "Int16Array", "offset": 28, "size": 2}, "drop": {"native": "Int16Array", "offset": 34, "size": 2}, "extra": {"native": "Int16Array", "offset": 44, "size": 2}, "extra_rand": {"native": "Int16Array", "offset": 46, "size": 2}, "filler": {"length": 2, "native": "Int8Array", "offset": 58, "size": 2}, "flashcolor": {"native": "Int32Array", "offset": 16, "size": 4}, "hitradius": {"native": "Int32Array", "offset": 8, "size": 4}, "isound": {"native": "Int16Array", "offset": 24, "size": 2}, "movecnt": {"native": "Int8Array", "offset": 56, "size": 1}, "offset": {"native": "Int16Array", "offset": 36, "size": 2}, "pal": {"native": "Int8Array", "offset": 55, "size": 1}, "range": {"native": "Int32Array", "offset": 12, "size": 4}, "shade": {"native": "Int8Array", "offset": 52, "size": 1}, "sound": {"native": "Int16Array", "offset": 22, "size": 2}, "spawns": {"native": "Int16Array", "offset": 20, "size": 2}, "sxrepeat": {"native": "Int8Array", "offset": 48, "size": 1}, "syrepeat": {"native": "Int8Array", "offset": 49, "size": 1}, "tnum": {"native": "Int16Array", "offset": 32, "size": 2}, "toffset": {"native": "Int16Array", "offset": 42, "size": 2}, "trail": {"native": "Int16Array", "offset": 30, "size": 2}, "txrepeat": {"native": "Int8Array", "offset": 50, "size": 1}, "tyrepeat": {"native": "Int8Array", "offset": 51, "size": 1}, "userdata": {"native": "Int32Array", "offset": 60, "size": 4}, "vel": {"native": "Int16Array", "offset": 26, "size": 2}, "workslike": {"native": "Int32Array", "offset": 0, "size": 4}, "xrepeat": {"native": "Int8Array", "offset": 53, "size": 1}, "yrepeat": {"native": "Int8Array", "offset": 54, "size": 1}}, "overlaps": false, "size": 64, "union": false}, {})).clipdist = (u32((u32(val) & 255)) & 255));
    }
    break;
    case i32(17): {
      (cRecordObject(cRecordPointer(proj, {"align": 4, "arrayAlign": 1, "fields": {"bounces": {"native": "Int16Array", "offset": 38, "size": 2}, "bsound": {"native": "Int16Array", "offset": 40, "size": 2}, "clipdist": {"native": "Uint8Array", "offset": 57, "size": 1}, "cstat": {"native": "Int32Array", "offset": 4, "size": 4}, "decal": {"native": "Int16Array", "offset": 28, "size": 2}, "drop": {"native": "Int16Array", "offset": 34, "size": 2}, "extra": {"native": "Int16Array", "offset": 44, "size": 2}, "extra_rand": {"native": "Int16Array", "offset": 46, "size": 2}, "filler": {"length": 2, "native": "Int8Array", "offset": 58, "size": 2}, "flashcolor": {"native": "Int32Array", "offset": 16, "size": 4}, "hitradius": {"native": "Int32Array", "offset": 8, "size": 4}, "isound": {"native": "Int16Array", "offset": 24, "size": 2}, "movecnt": {"native": "Int8Array", "offset": 56, "size": 1}, "offset": {"native": "Int16Array", "offset": 36, "size": 2}, "pal": {"native": "Int8Array", "offset": 55, "size": 1}, "range": {"native": "Int32Array", "offset": 12, "size": 4}, "shade": {"native": "Int8Array", "offset": 52, "size": 1}, "sound": {"native": "Int16Array", "offset": 22, "size": 2}, "spawns": {"native": "Int16Array", "offset": 20, "size": 2}, "sxrepeat": {"native": "Int8Array", "offset": 48, "size": 1}, "syrepeat": {"native": "Int8Array", "offset": 49, "size": 1}, "tnum": {"native": "Int16Array", "offset": 32, "size": 2}, "toffset": {"native": "Int16Array", "offset": 42, "size": 2}, "trail": {"native": "Int16Array", "offset": 30, "size": 2}, "txrepeat": {"native": "Int8Array", "offset": 50, "size": 1}, "tyrepeat": {"native": "Int8Array", "offset": 51, "size": 1}, "userdata": {"native": "Int32Array", "offset": 60, "size": 4}, "vel": {"native": "Int16Array", "offset": 26, "size": 2}, "workslike": {"native": "Int32Array", "offset": 0, "size": 4}, "xrepeat": {"native": "Int8Array", "offset": 53, "size": 1}, "yrepeat": {"native": "Int8Array", "offset": 54, "size": 1}}, "overlaps": false, "size": 64, "union": false}, {})).shade = ((u32(((u32(val) << 24) >> 24)) << 24) >> 24));
    }
    break;
    case i32(18): {
      (cRecordObject(cRecordPointer(proj, {"align": 4, "arrayAlign": 1, "fields": {"bounces": {"native": "Int16Array", "offset": 38, "size": 2}, "bsound": {"native": "Int16Array", "offset": 40, "size": 2}, "clipdist": {"native": "Uint8Array", "offset": 57, "size": 1}, "cstat": {"native": "Int32Array", "offset": 4, "size": 4}, "decal": {"native": "Int16Array", "offset": 28, "size": 2}, "drop": {"native": "Int16Array", "offset": 34, "size": 2}, "extra": {"native": "Int16Array", "offset": 44, "size": 2}, "extra_rand": {"native": "Int16Array", "offset": 46, "size": 2}, "filler": {"length": 2, "native": "Int8Array", "offset": 58, "size": 2}, "flashcolor": {"native": "Int32Array", "offset": 16, "size": 4}, "hitradius": {"native": "Int32Array", "offset": 8, "size": 4}, "isound": {"native": "Int16Array", "offset": 24, "size": 2}, "movecnt": {"native": "Int8Array", "offset": 56, "size": 1}, "offset": {"native": "Int16Array", "offset": 36, "size": 2}, "pal": {"native": "Int8Array", "offset": 55, "size": 1}, "range": {"native": "Int32Array", "offset": 12, "size": 4}, "shade": {"native": "Int8Array", "offset": 52, "size": 1}, "sound": {"native": "Int16Array", "offset": 22, "size": 2}, "spawns": {"native": "Int16Array", "offset": 20, "size": 2}, "sxrepeat": {"native": "Int8Array", "offset": 48, "size": 1}, "syrepeat": {"native": "Int8Array", "offset": 49, "size": 1}, "tnum": {"native": "Int16Array", "offset": 32, "size": 2}, "toffset": {"native": "Int16Array", "offset": 42, "size": 2}, "trail": {"native": "Int16Array", "offset": 30, "size": 2}, "txrepeat": {"native": "Int8Array", "offset": 50, "size": 1}, "tyrepeat": {"native": "Int8Array", "offset": 51, "size": 1}, "userdata": {"native": "Int32Array", "offset": 60, "size": 4}, "vel": {"native": "Int16Array", "offset": 26, "size": 2}, "workslike": {"native": "Int32Array", "offset": 0, "size": 4}, "xrepeat": {"native": "Int8Array", "offset": 53, "size": 1}, "yrepeat": {"native": "Int8Array", "offset": 54, "size": 1}}, "overlaps": false, "size": 64, "union": false}, {})).xrepeat = ((u32(((u32(val) << 24) >> 24)) << 24) >> 24));
    }
    break;
    case i32(19): {
      (cRecordObject(cRecordPointer(proj, {"align": 4, "arrayAlign": 1, "fields": {"bounces": {"native": "Int16Array", "offset": 38, "size": 2}, "bsound": {"native": "Int16Array", "offset": 40, "size": 2}, "clipdist": {"native": "Uint8Array", "offset": 57, "size": 1}, "cstat": {"native": "Int32Array", "offset": 4, "size": 4}, "decal": {"native": "Int16Array", "offset": 28, "size": 2}, "drop": {"native": "Int16Array", "offset": 34, "size": 2}, "extra": {"native": "Int16Array", "offset": 44, "size": 2}, "extra_rand": {"native": "Int16Array", "offset": 46, "size": 2}, "filler": {"length": 2, "native": "Int8Array", "offset": 58, "size": 2}, "flashcolor": {"native": "Int32Array", "offset": 16, "size": 4}, "hitradius": {"native": "Int32Array", "offset": 8, "size": 4}, "isound": {"native": "Int16Array", "offset": 24, "size": 2}, "movecnt": {"native": "Int8Array", "offset": 56, "size": 1}, "offset": {"native": "Int16Array", "offset": 36, "size": 2}, "pal": {"native": "Int8Array", "offset": 55, "size": 1}, "range": {"native": "Int32Array", "offset": 12, "size": 4}, "shade": {"native": "Int8Array", "offset": 52, "size": 1}, "sound": {"native": "Int16Array", "offset": 22, "size": 2}, "spawns": {"native": "Int16Array", "offset": 20, "size": 2}, "sxrepeat": {"native": "Int8Array", "offset": 48, "size": 1}, "syrepeat": {"native": "Int8Array", "offset": 49, "size": 1}, "tnum": {"native": "Int16Array", "offset": 32, "size": 2}, "toffset": {"native": "Int16Array", "offset": 42, "size": 2}, "trail": {"native": "Int16Array", "offset": 30, "size": 2}, "txrepeat": {"native": "Int8Array", "offset": 50, "size": 1}, "tyrepeat": {"native": "Int8Array", "offset": 51, "size": 1}, "userdata": {"native": "Int32Array", "offset": 60, "size": 4}, "vel": {"native": "Int16Array", "offset": 26, "size": 2}, "workslike": {"native": "Int32Array", "offset": 0, "size": 4}, "xrepeat": {"native": "Int8Array", "offset": 53, "size": 1}, "yrepeat": {"native": "Int8Array", "offset": 54, "size": 1}}, "overlaps": false, "size": 64, "union": false}, {})).yrepeat = ((u32(((u32(val) << 24) >> 24)) << 24) >> 24));
    }
    break;
    case i32(20): {
      (cRecordObject(cRecordPointer(proj, {"align": 4, "arrayAlign": 1, "fields": {"bounces": {"native": "Int16Array", "offset": 38, "size": 2}, "bsound": {"native": "Int16Array", "offset": 40, "size": 2}, "clipdist": {"native": "Uint8Array", "offset": 57, "size": 1}, "cstat": {"native": "Int32Array", "offset": 4, "size": 4}, "decal": {"native": "Int16Array", "offset": 28, "size": 2}, "drop": {"native": "Int16Array", "offset": 34, "size": 2}, "extra": {"native": "Int16Array", "offset": 44, "size": 2}, "extra_rand": {"native": "Int16Array", "offset": 46, "size": 2}, "filler": {"length": 2, "native": "Int8Array", "offset": 58, "size": 2}, "flashcolor": {"native": "Int32Array", "offset": 16, "size": 4}, "hitradius": {"native": "Int32Array", "offset": 8, "size": 4}, "isound": {"native": "Int16Array", "offset": 24, "size": 2}, "movecnt": {"native": "Int8Array", "offset": 56, "size": 1}, "offset": {"native": "Int16Array", "offset": 36, "size": 2}, "pal": {"native": "Int8Array", "offset": 55, "size": 1}, "range": {"native": "Int32Array", "offset": 12, "size": 4}, "shade": {"native": "Int8Array", "offset": 52, "size": 1}, "sound": {"native": "Int16Array", "offset": 22, "size": 2}, "spawns": {"native": "Int16Array", "offset": 20, "size": 2}, "sxrepeat": {"native": "Int8Array", "offset": 48, "size": 1}, "syrepeat": {"native": "Int8Array", "offset": 49, "size": 1}, "tnum": {"native": "Int16Array", "offset": 32, "size": 2}, "toffset": {"native": "Int16Array", "offset": 42, "size": 2}, "trail": {"native": "Int16Array", "offset": 30, "size": 2}, "txrepeat": {"native": "Int8Array", "offset": 50, "size": 1}, "tyrepeat": {"native": "Int8Array", "offset": 51, "size": 1}, "userdata": {"native": "Int32Array", "offset": 60, "size": 4}, "vel": {"native": "Int16Array", "offset": 26, "size": 2}, "workslike": {"native": "Int32Array", "offset": 0, "size": 4}, "xrepeat": {"native": "Int8Array", "offset": 53, "size": 1}, "yrepeat": {"native": "Int8Array", "offset": 54, "size": 1}}, "overlaps": false, "size": 64, "union": false}, {})).pal = ((u32(((u32(val) << 24) >> 24)) << 24) >> 24));
    }
    break;
    case i32(21): {
      (cRecordObject(cRecordPointer(proj, {"align": 4, "arrayAlign": 1, "fields": {"bounces": {"native": "Int16Array", "offset": 38, "size": 2}, "bsound": {"native": "Int16Array", "offset": 40, "size": 2}, "clipdist": {"native": "Uint8Array", "offset": 57, "size": 1}, "cstat": {"native": "Int32Array", "offset": 4, "size": 4}, "decal": {"native": "Int16Array", "offset": 28, "size": 2}, "drop": {"native": "Int16Array", "offset": 34, "size": 2}, "extra": {"native": "Int16Array", "offset": 44, "size": 2}, "extra_rand": {"native": "Int16Array", "offset": 46, "size": 2}, "filler": {"length": 2, "native": "Int8Array", "offset": 58, "size": 2}, "flashcolor": {"native": "Int32Array", "offset": 16, "size": 4}, "hitradius": {"native": "Int32Array", "offset": 8, "size": 4}, "isound": {"native": "Int16Array", "offset": 24, "size": 2}, "movecnt": {"native": "Int8Array", "offset": 56, "size": 1}, "offset": {"native": "Int16Array", "offset": 36, "size": 2}, "pal": {"native": "Int8Array", "offset": 55, "size": 1}, "range": {"native": "Int32Array", "offset": 12, "size": 4}, "shade": {"native": "Int8Array", "offset": 52, "size": 1}, "sound": {"native": "Int16Array", "offset": 22, "size": 2}, "spawns": {"native": "Int16Array", "offset": 20, "size": 2}, "sxrepeat": {"native": "Int8Array", "offset": 48, "size": 1}, "syrepeat": {"native": "Int8Array", "offset": 49, "size": 1}, "tnum": {"native": "Int16Array", "offset": 32, "size": 2}, "toffset": {"native": "Int16Array", "offset": 42, "size": 2}, "trail": {"native": "Int16Array", "offset": 30, "size": 2}, "txrepeat": {"native": "Int8Array", "offset": 50, "size": 1}, "tyrepeat": {"native": "Int8Array", "offset": 51, "size": 1}, "userdata": {"native": "Int32Array", "offset": 60, "size": 4}, "vel": {"native": "Int16Array", "offset": 26, "size": 2}, "workslike": {"native": "Int32Array", "offset": 0, "size": 4}, "xrepeat": {"native": "Int8Array", "offset": 53, "size": 1}, "yrepeat": {"native": "Int8Array", "offset": 54, "size": 1}}, "overlaps": false, "size": 64, "union": false}, {})).extra_rand = ((u32(((u32(val) << 16) >> 16)) << 16) >> 16));
    }
    break;
    case i32(22): {
      (cRecordObject(cRecordPointer(proj, {"align": 4, "arrayAlign": 1, "fields": {"bounces": {"native": "Int16Array", "offset": 38, "size": 2}, "bsound": {"native": "Int16Array", "offset": 40, "size": 2}, "clipdist": {"native": "Uint8Array", "offset": 57, "size": 1}, "cstat": {"native": "Int32Array", "offset": 4, "size": 4}, "decal": {"native": "Int16Array", "offset": 28, "size": 2}, "drop": {"native": "Int16Array", "offset": 34, "size": 2}, "extra": {"native": "Int16Array", "offset": 44, "size": 2}, "extra_rand": {"native": "Int16Array", "offset": 46, "size": 2}, "filler": {"length": 2, "native": "Int8Array", "offset": 58, "size": 2}, "flashcolor": {"native": "Int32Array", "offset": 16, "size": 4}, "hitradius": {"native": "Int32Array", "offset": 8, "size": 4}, "isound": {"native": "Int16Array", "offset": 24, "size": 2}, "movecnt": {"native": "Int8Array", "offset": 56, "size": 1}, "offset": {"native": "Int16Array", "offset": 36, "size": 2}, "pal": {"native": "Int8Array", "offset": 55, "size": 1}, "range": {"native": "Int32Array", "offset": 12, "size": 4}, "shade": {"native": "Int8Array", "offset": 52, "size": 1}, "sound": {"native": "Int16Array", "offset": 22, "size": 2}, "spawns": {"native": "Int16Array", "offset": 20, "size": 2}, "sxrepeat": {"native": "Int8Array", "offset": 48, "size": 1}, "syrepeat": {"native": "Int8Array", "offset": 49, "size": 1}, "tnum": {"native": "Int16Array", "offset": 32, "size": 2}, "toffset": {"native": "Int16Array", "offset": 42, "size": 2}, "trail": {"native": "Int16Array", "offset": 30, "size": 2}, "txrepeat": {"native": "Int8Array", "offset": 50, "size": 1}, "tyrepeat": {"native": "Int8Array", "offset": 51, "size": 1}, "userdata": {"native": "Int32Array", "offset": 60, "size": 4}, "vel": {"native": "Int16Array", "offset": 26, "size": 2}, "workslike": {"native": "Int32Array", "offset": 0, "size": 4}, "xrepeat": {"native": "Int8Array", "offset": 53, "size": 1}, "yrepeat": {"native": "Int8Array", "offset": 54, "size": 1}}, "overlaps": false, "size": 64, "union": false}, {})).hitradius = i32(val));
    }
    break;
    case i32(23): {
      (cRecordObject(cRecordPointer(proj, {"align": 4, "arrayAlign": 1, "fields": {"bounces": {"native": "Int16Array", "offset": 38, "size": 2}, "bsound": {"native": "Int16Array", "offset": 40, "size": 2}, "clipdist": {"native": "Uint8Array", "offset": 57, "size": 1}, "cstat": {"native": "Int32Array", "offset": 4, "size": 4}, "decal": {"native": "Int16Array", "offset": 28, "size": 2}, "drop": {"native": "Int16Array", "offset": 34, "size": 2}, "extra": {"native": "Int16Array", "offset": 44, "size": 2}, "extra_rand": {"native": "Int16Array", "offset": 46, "size": 2}, "filler": {"length": 2, "native": "Int8Array", "offset": 58, "size": 2}, "flashcolor": {"native": "Int32Array", "offset": 16, "size": 4}, "hitradius": {"native": "Int32Array", "offset": 8, "size": 4}, "isound": {"native": "Int16Array", "offset": 24, "size": 2}, "movecnt": {"native": "Int8Array", "offset": 56, "size": 1}, "offset": {"native": "Int16Array", "offset": 36, "size": 2}, "pal": {"native": "Int8Array", "offset": 55, "size": 1}, "range": {"native": "Int32Array", "offset": 12, "size": 4}, "shade": {"native": "Int8Array", "offset": 52, "size": 1}, "sound": {"native": "Int16Array", "offset": 22, "size": 2}, "spawns": {"native": "Int16Array", "offset": 20, "size": 2}, "sxrepeat": {"native": "Int8Array", "offset": 48, "size": 1}, "syrepeat": {"native": "Int8Array", "offset": 49, "size": 1}, "tnum": {"native": "Int16Array", "offset": 32, "size": 2}, "toffset": {"native": "Int16Array", "offset": 42, "size": 2}, "trail": {"native": "Int16Array", "offset": 30, "size": 2}, "txrepeat": {"native": "Int8Array", "offset": 50, "size": 1}, "tyrepeat": {"native": "Int8Array", "offset": 51, "size": 1}, "userdata": {"native": "Int32Array", "offset": 60, "size": 4}, "vel": {"native": "Int16Array", "offset": 26, "size": 2}, "workslike": {"native": "Int32Array", "offset": 0, "size": 4}, "xrepeat": {"native": "Int8Array", "offset": 53, "size": 1}, "yrepeat": {"native": "Int8Array", "offset": 54, "size": 1}}, "overlaps": false, "size": 64, "union": false}, {})).movecnt = ((u32(((u32(val) << 24) >> 24)) << 24) >> 24));
    }
    break;
    case i32(24): {
      (cRecordObject(cRecordPointer(proj, {"align": 4, "arrayAlign": 1, "fields": {"bounces": {"native": "Int16Array", "offset": 38, "size": 2}, "bsound": {"native": "Int16Array", "offset": 40, "size": 2}, "clipdist": {"native": "Uint8Array", "offset": 57, "size": 1}, "cstat": {"native": "Int32Array", "offset": 4, "size": 4}, "decal": {"native": "Int16Array", "offset": 28, "size": 2}, "drop": {"native": "Int16Array", "offset": 34, "size": 2}, "extra": {"native": "Int16Array", "offset": 44, "size": 2}, "extra_rand": {"native": "Int16Array", "offset": 46, "size": 2}, "filler": {"length": 2, "native": "Int8Array", "offset": 58, "size": 2}, "flashcolor": {"native": "Int32Array", "offset": 16, "size": 4}, "hitradius": {"native": "Int32Array", "offset": 8, "size": 4}, "isound": {"native": "Int16Array", "offset": 24, "size": 2}, "movecnt": {"native": "Int8Array", "offset": 56, "size": 1}, "offset": {"native": "Int16Array", "offset": 36, "size": 2}, "pal": {"native": "Int8Array", "offset": 55, "size": 1}, "range": {"native": "Int32Array", "offset": 12, "size": 4}, "shade": {"native": "Int8Array", "offset": 52, "size": 1}, "sound": {"native": "Int16Array", "offset": 22, "size": 2}, "spawns": {"native": "Int16Array", "offset": 20, "size": 2}, "sxrepeat": {"native": "Int8Array", "offset": 48, "size": 1}, "syrepeat": {"native": "Int8Array", "offset": 49, "size": 1}, "tnum": {"native": "Int16Array", "offset": 32, "size": 2}, "toffset": {"native": "Int16Array", "offset": 42, "size": 2}, "trail": {"native": "Int16Array", "offset": 30, "size": 2}, "txrepeat": {"native": "Int8Array", "offset": 50, "size": 1}, "tyrepeat": {"native": "Int8Array", "offset": 51, "size": 1}, "userdata": {"native": "Int32Array", "offset": 60, "size": 4}, "vel": {"native": "Int16Array", "offset": 26, "size": 2}, "workslike": {"native": "Int32Array", "offset": 0, "size": 4}, "xrepeat": {"native": "Int8Array", "offset": 53, "size": 1}, "yrepeat": {"native": "Int8Array", "offset": 54, "size": 1}}, "overlaps": false, "size": 64, "union": false}, {})).offset = ((u32(((u32(val) << 16) >> 16)) << 16) >> 16));
    }
    break;
    case i32(25): {
      (cRecordObject(cRecordPointer(proj, {"align": 4, "arrayAlign": 1, "fields": {"bounces": {"native": "Int16Array", "offset": 38, "size": 2}, "bsound": {"native": "Int16Array", "offset": 40, "size": 2}, "clipdist": {"native": "Uint8Array", "offset": 57, "size": 1}, "cstat": {"native": "Int32Array", "offset": 4, "size": 4}, "decal": {"native": "Int16Array", "offset": 28, "size": 2}, "drop": {"native": "Int16Array", "offset": 34, "size": 2}, "extra": {"native": "Int16Array", "offset": 44, "size": 2}, "extra_rand": {"native": "Int16Array", "offset": 46, "size": 2}, "filler": {"length": 2, "native": "Int8Array", "offset": 58, "size": 2}, "flashcolor": {"native": "Int32Array", "offset": 16, "size": 4}, "hitradius": {"native": "Int32Array", "offset": 8, "size": 4}, "isound": {"native": "Int16Array", "offset": 24, "size": 2}, "movecnt": {"native": "Int8Array", "offset": 56, "size": 1}, "offset": {"native": "Int16Array", "offset": 36, "size": 2}, "pal": {"native": "Int8Array", "offset": 55, "size": 1}, "range": {"native": "Int32Array", "offset": 12, "size": 4}, "shade": {"native": "Int8Array", "offset": 52, "size": 1}, "sound": {"native": "Int16Array", "offset": 22, "size": 2}, "spawns": {"native": "Int16Array", "offset": 20, "size": 2}, "sxrepeat": {"native": "Int8Array", "offset": 48, "size": 1}, "syrepeat": {"native": "Int8Array", "offset": 49, "size": 1}, "tnum": {"native": "Int16Array", "offset": 32, "size": 2}, "toffset": {"native": "Int16Array", "offset": 42, "size": 2}, "trail": {"native": "Int16Array", "offset": 30, "size": 2}, "txrepeat": {"native": "Int8Array", "offset": 50, "size": 1}, "tyrepeat": {"native": "Int8Array", "offset": 51, "size": 1}, "userdata": {"native": "Int32Array", "offset": 60, "size": 4}, "vel": {"native": "Int16Array", "offset": 26, "size": 2}, "workslike": {"native": "Int32Array", "offset": 0, "size": 4}, "xrepeat": {"native": "Int8Array", "offset": 53, "size": 1}, "yrepeat": {"native": "Int8Array", "offset": 54, "size": 1}}, "overlaps": false, "size": 64, "union": false}, {})).bounces = ((u32(((u32(val) << 16) >> 16)) << 16) >> 16));
    }
    break;
    case i32(26): {
      (cRecordObject(cRecordPointer(proj, {"align": 4, "arrayAlign": 1, "fields": {"bounces": {"native": "Int16Array", "offset": 38, "size": 2}, "bsound": {"native": "Int16Array", "offset": 40, "size": 2}, "clipdist": {"native": "Uint8Array", "offset": 57, "size": 1}, "cstat": {"native": "Int32Array", "offset": 4, "size": 4}, "decal": {"native": "Int16Array", "offset": 28, "size": 2}, "drop": {"native": "Int16Array", "offset": 34, "size": 2}, "extra": {"native": "Int16Array", "offset": 44, "size": 2}, "extra_rand": {"native": "Int16Array", "offset": 46, "size": 2}, "filler": {"length": 2, "native": "Int8Array", "offset": 58, "size": 2}, "flashcolor": {"native": "Int32Array", "offset": 16, "size": 4}, "hitradius": {"native": "Int32Array", "offset": 8, "size": 4}, "isound": {"native": "Int16Array", "offset": 24, "size": 2}, "movecnt": {"native": "Int8Array", "offset": 56, "size": 1}, "offset": {"native": "Int16Array", "offset": 36, "size": 2}, "pal": {"native": "Int8Array", "offset": 55, "size": 1}, "range": {"native": "Int32Array", "offset": 12, "size": 4}, "shade": {"native": "Int8Array", "offset": 52, "size": 1}, "sound": {"native": "Int16Array", "offset": 22, "size": 2}, "spawns": {"native": "Int16Array", "offset": 20, "size": 2}, "sxrepeat": {"native": "Int8Array", "offset": 48, "size": 1}, "syrepeat": {"native": "Int8Array", "offset": 49, "size": 1}, "tnum": {"native": "Int16Array", "offset": 32, "size": 2}, "toffset": {"native": "Int16Array", "offset": 42, "size": 2}, "trail": {"native": "Int16Array", "offset": 30, "size": 2}, "txrepeat": {"native": "Int8Array", "offset": 50, "size": 1}, "tyrepeat": {"native": "Int8Array", "offset": 51, "size": 1}, "userdata": {"native": "Int32Array", "offset": 60, "size": 4}, "vel": {"native": "Int16Array", "offset": 26, "size": 2}, "workslike": {"native": "Int32Array", "offset": 0, "size": 4}, "xrepeat": {"native": "Int8Array", "offset": 53, "size": 1}, "yrepeat": {"native": "Int8Array", "offset": 54, "size": 1}}, "overlaps": false, "size": 64, "union": false}, {})).bsound = ((u32(((u32(val) << 16) >> 16)) << 16) >> 16));
    }
    break;
    case i32(27): {
      (cRecordObject(cRecordPointer(proj, {"align": 4, "arrayAlign": 1, "fields": {"bounces": {"native": "Int16Array", "offset": 38, "size": 2}, "bsound": {"native": "Int16Array", "offset": 40, "size": 2}, "clipdist": {"native": "Uint8Array", "offset": 57, "size": 1}, "cstat": {"native": "Int32Array", "offset": 4, "size": 4}, "decal": {"native": "Int16Array", "offset": 28, "size": 2}, "drop": {"native": "Int16Array", "offset": 34, "size": 2}, "extra": {"native": "Int16Array", "offset": 44, "size": 2}, "extra_rand": {"native": "Int16Array", "offset": 46, "size": 2}, "filler": {"length": 2, "native": "Int8Array", "offset": 58, "size": 2}, "flashcolor": {"native": "Int32Array", "offset": 16, "size": 4}, "hitradius": {"native": "Int32Array", "offset": 8, "size": 4}, "isound": {"native": "Int16Array", "offset": 24, "size": 2}, "movecnt": {"native": "Int8Array", "offset": 56, "size": 1}, "offset": {"native": "Int16Array", "offset": 36, "size": 2}, "pal": {"native": "Int8Array", "offset": 55, "size": 1}, "range": {"native": "Int32Array", "offset": 12, "size": 4}, "shade": {"native": "Int8Array", "offset": 52, "size": 1}, "sound": {"native": "Int16Array", "offset": 22, "size": 2}, "spawns": {"native": "Int16Array", "offset": 20, "size": 2}, "sxrepeat": {"native": "Int8Array", "offset": 48, "size": 1}, "syrepeat": {"native": "Int8Array", "offset": 49, "size": 1}, "tnum": {"native": "Int16Array", "offset": 32, "size": 2}, "toffset": {"native": "Int16Array", "offset": 42, "size": 2}, "trail": {"native": "Int16Array", "offset": 30, "size": 2}, "txrepeat": {"native": "Int8Array", "offset": 50, "size": 1}, "tyrepeat": {"native": "Int8Array", "offset": 51, "size": 1}, "userdata": {"native": "Int32Array", "offset": 60, "size": 4}, "vel": {"native": "Int16Array", "offset": 26, "size": 2}, "workslike": {"native": "Int32Array", "offset": 0, "size": 4}, "xrepeat": {"native": "Int8Array", "offset": 53, "size": 1}, "yrepeat": {"native": "Int8Array", "offset": 54, "size": 1}}, "overlaps": false, "size": 64, "union": false}, {})).range = i32(val));
    }
    break;
    case i32(28): {
      (cRecordObject(cRecordPointer(proj, {"align": 4, "arrayAlign": 1, "fields": {"bounces": {"native": "Int16Array", "offset": 38, "size": 2}, "bsound": {"native": "Int16Array", "offset": 40, "size": 2}, "clipdist": {"native": "Uint8Array", "offset": 57, "size": 1}, "cstat": {"native": "Int32Array", "offset": 4, "size": 4}, "decal": {"native": "Int16Array", "offset": 28, "size": 2}, "drop": {"native": "Int16Array", "offset": 34, "size": 2}, "extra": {"native": "Int16Array", "offset": 44, "size": 2}, "extra_rand": {"native": "Int16Array", "offset": 46, "size": 2}, "filler": {"length": 2, "native": "Int8Array", "offset": 58, "size": 2}, "flashcolor": {"native": "Int32Array", "offset": 16, "size": 4}, "hitradius": {"native": "Int32Array", "offset": 8, "size": 4}, "isound": {"native": "Int16Array", "offset": 24, "size": 2}, "movecnt": {"native": "Int8Array", "offset": 56, "size": 1}, "offset": {"native": "Int16Array", "offset": 36, "size": 2}, "pal": {"native": "Int8Array", "offset": 55, "size": 1}, "range": {"native": "Int32Array", "offset": 12, "size": 4}, "shade": {"native": "Int8Array", "offset": 52, "size": 1}, "sound": {"native": "Int16Array", "offset": 22, "size": 2}, "spawns": {"native": "Int16Array", "offset": 20, "size": 2}, "sxrepeat": {"native": "Int8Array", "offset": 48, "size": 1}, "syrepeat": {"native": "Int8Array", "offset": 49, "size": 1}, "tnum": {"native": "Int16Array", "offset": 32, "size": 2}, "toffset": {"native": "Int16Array", "offset": 42, "size": 2}, "trail": {"native": "Int16Array", "offset": 30, "size": 2}, "txrepeat": {"native": "Int8Array", "offset": 50, "size": 1}, "tyrepeat": {"native": "Int8Array", "offset": 51, "size": 1}, "userdata": {"native": "Int32Array", "offset": 60, "size": 4}, "vel": {"native": "Int16Array", "offset": 26, "size": 2}, "workslike": {"native": "Int32Array", "offset": 0, "size": 4}, "xrepeat": {"native": "Int8Array", "offset": 53, "size": 1}, "yrepeat": {"native": "Int8Array", "offset": 54, "size": 1}}, "overlaps": false, "size": 64, "union": false}, {})).flashcolor = i32(val));
    }
    break;
    case i32(29): {
      (cRecordObject(cRecordPointer(proj, {"align": 4, "arrayAlign": 1, "fields": {"bounces": {"native": "Int16Array", "offset": 38, "size": 2}, "bsound": {"native": "Int16Array", "offset": 40, "size": 2}, "clipdist": {"native": "Uint8Array", "offset": 57, "size": 1}, "cstat": {"native": "Int32Array", "offset": 4, "size": 4}, "decal": {"native": "Int16Array", "offset": 28, "size": 2}, "drop": {"native": "Int16Array", "offset": 34, "size": 2}, "extra": {"native": "Int16Array", "offset": 44, "size": 2}, "extra_rand": {"native": "Int16Array", "offset": 46, "size": 2}, "filler": {"length": 2, "native": "Int8Array", "offset": 58, "size": 2}, "flashcolor": {"native": "Int32Array", "offset": 16, "size": 4}, "hitradius": {"native": "Int32Array", "offset": 8, "size": 4}, "isound": {"native": "Int16Array", "offset": 24, "size": 2}, "movecnt": {"native": "Int8Array", "offset": 56, "size": 1}, "offset": {"native": "Int16Array", "offset": 36, "size": 2}, "pal": {"native": "Int8Array", "offset": 55, "size": 1}, "range": {"native": "Int32Array", "offset": 12, "size": 4}, "shade": {"native": "Int8Array", "offset": 52, "size": 1}, "sound": {"native": "Int16Array", "offset": 22, "size": 2}, "spawns": {"native": "Int16Array", "offset": 20, "size": 2}, "sxrepeat": {"native": "Int8Array", "offset": 48, "size": 1}, "syrepeat": {"native": "Int8Array", "offset": 49, "size": 1}, "tnum": {"native": "Int16Array", "offset": 32, "size": 2}, "toffset": {"native": "Int16Array", "offset": 42, "size": 2}, "trail": {"native": "Int16Array", "offset": 30, "size": 2}, "txrepeat": {"native": "Int8Array", "offset": 50, "size": 1}, "tyrepeat": {"native": "Int8Array", "offset": 51, "size": 1}, "userdata": {"native": "Int32Array", "offset": 60, "size": 4}, "vel": {"native": "Int16Array", "offset": 26, "size": 2}, "workslike": {"native": "Int32Array", "offset": 0, "size": 4}, "xrepeat": {"native": "Int8Array", "offset": 53, "size": 1}, "yrepeat": {"native": "Int8Array", "offset": 54, "size": 1}}, "overlaps": false, "size": 64, "union": false}, {})).userdata = i32(val));
    }
    break;
    default: {
      break;
    }
  }
  cAssignAggregate(cRecordObject(cRecordPointer((cPointerElementRef(cRecordPointer(g_tile, {"align": 8, "arrayAlign": 1, "fields": {"cacherange": {"native": "Int32Array", "offset": 36, "size": 4}, "defproj": {"offset": 24, "pointer": true, "size": 8}, "execPtr": {"offset": 0, "pointer": true, "size": 8}, "flags": {"native": "Uint32Array", "offset": 32, "size": 4}, "loadPtr": {"offset": 8, "pointer": true, "size": 8}, "proj": {"offset": 16, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {}), j).value).defproj, {"align": 4, "arrayAlign": 1, "fields": {"bounces": {"native": "Int16Array", "offset": 38, "size": 2}, "bsound": {"native": "Int16Array", "offset": 40, "size": 2}, "clipdist": {"native": "Uint8Array", "offset": 57, "size": 1}, "cstat": {"native": "Int32Array", "offset": 4, "size": 4}, "decal": {"native": "Int16Array", "offset": 28, "size": 2}, "drop": {"native": "Int16Array", "offset": 34, "size": 2}, "extra": {"native": "Int16Array", "offset": 44, "size": 2}, "extra_rand": {"native": "Int16Array", "offset": 46, "size": 2}, "filler": {"length": 2, "native": "Int8Array", "offset": 58, "size": 2}, "flashcolor": {"native": "Int32Array", "offset": 16, "size": 4}, "hitradius": {"native": "Int32Array", "offset": 8, "size": 4}, "isound": {"native": "Int16Array", "offset": 24, "size": 2}, "movecnt": {"native": "Int8Array", "offset": 56, "size": 1}, "offset": {"native": "Int16Array", "offset": 36, "size": 2}, "pal": {"native": "Int8Array", "offset": 55, "size": 1}, "range": {"native": "Int32Array", "offset": 12, "size": 4}, "shade": {"native": "Int8Array", "offset": 52, "size": 1}, "sound": {"native": "Int16Array", "offset": 22, "size": 2}, "spawns": {"native": "Int16Array", "offset": 20, "size": 2}, "sxrepeat": {"native": "Int8Array", "offset": 48, "size": 1}, "syrepeat": {"native": "Int8Array", "offset": 49, "size": 1}, "tnum": {"native": "Int16Array", "offset": 32, "size": 2}, "toffset": {"native": "Int16Array", "offset": 42, "size": 2}, "trail": {"native": "Int16Array", "offset": 30, "size": 2}, "txrepeat": {"native": "Int8Array", "offset": 50, "size": 1}, "tyrepeat": {"native": "Int8Array", "offset": 51, "size": 1}, "userdata": {"native": "Int32Array", "offset": 60, "size": 4}, "vel": {"native": "Int16Array", "offset": 26, "size": 2}, "workslike": {"native": "Int32Array", "offset": 0, "size": 4}, "xrepeat": {"native": "Int8Array", "offset": 53, "size": 1}, "yrepeat": {"native": "Int8Array", "offset": 54, "size": 1}}, "overlaps": false, "size": 64, "union": false}, {})), cRecordObject(cRecordPointer(proj, {"align": 4, "arrayAlign": 1, "fields": {"bounces": {"native": "Int16Array", "offset": 38, "size": 2}, "bsound": {"native": "Int16Array", "offset": 40, "size": 2}, "clipdist": {"native": "Uint8Array", "offset": 57, "size": 1}, "cstat": {"native": "Int32Array", "offset": 4, "size": 4}, "decal": {"native": "Int16Array", "offset": 28, "size": 2}, "drop": {"native": "Int16Array", "offset": 34, "size": 2}, "extra": {"native": "Int16Array", "offset": 44, "size": 2}, "extra_rand": {"native": "Int16Array", "offset": 46, "size": 2}, "filler": {"length": 2, "native": "Int8Array", "offset": 58, "size": 2}, "flashcolor": {"native": "Int32Array", "offset": 16, "size": 4}, "hitradius": {"native": "Int32Array", "offset": 8, "size": 4}, "isound": {"native": "Int16Array", "offset": 24, "size": 2}, "movecnt": {"native": "Int8Array", "offset": 56, "size": 1}, "offset": {"native": "Int16Array", "offset": 36, "size": 2}, "pal": {"native": "Int8Array", "offset": 55, "size": 1}, "range": {"native": "Int32Array", "offset": 12, "size": 4}, "shade": {"native": "Int8Array", "offset": 52, "size": 1}, "sound": {"native": "Int16Array", "offset": 22, "size": 2}, "spawns": {"native": "Int16Array", "offset": 20, "size": 2}, "sxrepeat": {"native": "Int8Array", "offset": 48, "size": 1}, "syrepeat": {"native": "Int8Array", "offset": 49, "size": 1}, "tnum": {"native": "Int16Array", "offset": 32, "size": 2}, "toffset": {"native": "Int16Array", "offset": 42, "size": 2}, "trail": {"native": "Int16Array", "offset": 30, "size": 2}, "txrepeat": {"native": "Int8Array", "offset": 50, "size": 1}, "tyrepeat": {"native": "Int8Array", "offset": 51, "size": 1}, "userdata": {"native": "Int32Array", "offset": 60, "size": 4}, "vel": {"native": "Int16Array", "offset": 26, "size": 2}, "workslike": {"native": "Int32Array", "offset": 0, "size": 4}, "xrepeat": {"native": "Int8Array", "offset": 53, "size": 1}, "yrepeat": {"native": "Int8Array", "offset": 54, "size": 1}}, "overlaps": false, "size": 64, "union": false}, {})), {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"bounces": {"native": "Int16Array", "offset": 38, "size": 2}, "bsound": {"native": "Int16Array", "offset": 40, "size": 2}, "clipdist": {"native": "Uint8Array", "offset": 57, "size": 1}, "cstat": {"native": "Int32Array", "offset": 4, "size": 4}, "decal": {"native": "Int16Array", "offset": 28, "size": 2}, "drop": {"native": "Int16Array", "offset": 34, "size": 2}, "extra": {"native": "Int16Array", "offset": 44, "size": 2}, "extra_rand": {"native": "Int16Array", "offset": 46, "size": 2}, "filler": {"length": 2, "native": "Int8Array", "offset": 58, "size": 2}, "flashcolor": {"native": "Int32Array", "offset": 16, "size": 4}, "hitradius": {"native": "Int32Array", "offset": 8, "size": 4}, "isound": {"native": "Int16Array", "offset": 24, "size": 2}, "movecnt": {"native": "Int8Array", "offset": 56, "size": 1}, "offset": {"native": "Int16Array", "offset": 36, "size": 2}, "pal": {"native": "Int8Array", "offset": 55, "size": 1}, "range": {"native": "Int32Array", "offset": 12, "size": 4}, "shade": {"native": "Int8Array", "offset": 52, "size": 1}, "sound": {"native": "Int16Array", "offset": 22, "size": 2}, "spawns": {"native": "Int16Array", "offset": 20, "size": 2}, "sxrepeat": {"native": "Int8Array", "offset": 48, "size": 1}, "syrepeat": {"native": "Int8Array", "offset": 49, "size": 1}, "tnum": {"native": "Int16Array", "offset": 32, "size": 2}, "toffset": {"native": "Int16Array", "offset": 42, "size": 2}, "trail": {"native": "Int16Array", "offset": 30, "size": 2}, "txrepeat": {"native": "Int8Array", "offset": 50, "size": 1}, "tyrepeat": {"native": "Int8Array", "offset": 51, "size": 1}, "userdata": {"native": "Int32Array", "offset": 60, "size": 4}, "vel": {"native": "Int16Array", "offset": 26, "size": 2}, "workslike": {"native": "Int32Array", "offset": 0, "size": 4}, "xrepeat": {"native": "Int8Array", "offset": 53, "size": 1}, "yrepeat": {"native": "Int8Array", "offset": 54, "size": 1}}, "overlaps": false, "size": 64, "union": false}}, {"abi": "source-clang-trivial-record-assignment/1", "assignment_mode": "copyAssign", "clang_assignment_signature": "projectile_t &(const projectile_t &) noexcept", "clang_method_id": "0x1501c6c5670", "native_layout": {"abi": "source-record-field-storage/1", "sha256": "2b339c50f2282935dc0264eae8578de007a05e9c52900f1fb8a451d551e451bf"}, "record_name": "projectile_t", "source_record": "projectile_t"});
  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = u32((__cxx_lvalue_0.value | u32(8)))))(cObjectFieldRef((cPointerElementRef(cRecordPointer(g_tile, {"align": 8, "arrayAlign": 1, "fields": {"cacherange": {"native": "Int32Array", "offset": 36, "size": 4}, "defproj": {"offset": 24, "pointer": true, "size": 8}, "execPtr": {"offset": 0, "pointer": true, "size": 8}, "flags": {"native": "Uint32Array", "offset": 32, "size": 4}, "loadPtr": {"offset": 8, "pointer": true, "size": 8}, "proj": {"offset": 16, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {}), j).value), "flags"));
}

// C/C++ source: source/duke3d/src/gamedef.cpp:2327
export function C_AllocQuote(qnum) {
  (u32(qnum) < u32(16384));
  if (cPointerCompare((cPointerElementRef(apStrings, qnum).value), null, "==")) {
    ((cPointerElementRef(apStrings, qnum).value) = cTypedPointer(xcalloc__header_a91960ec68ef(u64(128), 1), Uint8Array));
    return i32(1);
  }
  return i32(0);
}

// C/C++ source: source/duke3d/src/gamedef.cpp:2341
export function C_ReplaceQuoteSubstring(q, query, replacement) {
  let querylength = u64(strlen(query));
  for (let i = i64(u64((BigInt(u64((BigInt(u64(128)) - BigInt(querylength)))) - BigInt(u64(2))))); (i >= i64(0)); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i64((previous - 1n)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; }))) {
    if ((strncmp(cPointerOffset((cPointerElementRef(apStrings, q).value), i, Uint8Array.BYTES_PER_ELEMENT), query, querylength) == 0)) {
      memset(tempbuf, 0, 8192);
      strncpy(tempbuf, (cPointerElementRef(apStrings, q).value), u64(i));
      strcat(tempbuf, replacement);
      strcat(tempbuf, cPointerOffset((cPointerElementRef(apStrings, q).value), u64((BigInt(u64(i)) + BigInt(querylength))), Uint8Array.BYTES_PER_ELEMENT));
      Bstrncpyz__header_20d79fc0de0e((cPointerElementRef(apStrings, q).value), tempbuf, u64(128));
      (i = i64(u64((BigInt(u64((BigInt(u64(128)) - BigInt(querylength)))) - BigInt(u64(2))))));
    }
  }
}

// C/C++ source: source/duke3d/src/gamedef.cpp:2358
const __cxx_literal_d450fd923f7ab30e9a15 = Uint8Array.from([83, 80, 65, 67, 69, 0]);
const __cxx_literal_a159b66b3dfa28ba0d7b = Uint8Array.from([79, 80, 69, 78, 0]);
const __cxx_literal_3eeceafbee6ea70d54e0 = Uint8Array.from([85, 83, 69, 0]);
const __cxx_literal_b854756a795c109ef02e = Uint8Array.from([94, 48, 50, 37, 115, 94, 48, 50, 32, 98, 101, 97, 116, 32, 37, 115, 94, 48, 50, 32, 108, 105, 107, 101, 32, 97, 32, 99, 117, 114, 0]);
const __cxx_literal_9fed2f9c80433cb0bbe9 = Uint8Array.from([94, 48, 50, 37, 115, 94, 48, 50, 32, 98, 114, 111, 107, 101, 32, 37, 115, 0]);
const __cxx_literal_38fc4f5e12fe31e2d6a0 = Uint8Array.from([94, 48, 50, 37, 115, 94, 48, 50, 32, 98, 111, 100, 121, 32, 98, 97, 103, 103, 101, 100, 32, 37, 115, 0]);
const __cxx_literal_b8bca615f3df4711e593 = Uint8Array.from([94, 48, 50, 37, 115, 94, 48, 50, 32, 98, 111, 110, 101, 100, 32, 37, 115, 94, 48, 50, 32, 108, 105, 107, 101, 32, 97, 32, 102, 105, 115, 104, 0]);
const __cxx_literal_c56107d39320b34b421f = Uint8Array.from([94, 48, 50, 37, 115, 94, 48, 50, 32, 99, 97, 115, 116, 114, 97, 116, 101, 100, 32, 37, 115, 0]);
const __cxx_literal_406028c2bc552290edd9 = Uint8Array.from([94, 48, 50, 37, 115, 94, 48, 50, 32, 99, 114, 101, 97, 109, 101, 100, 32, 37, 115, 0]);
const __cxx_literal_d97428ddac0e776573ba = Uint8Array.from([94, 48, 50, 37, 115, 94, 48, 50, 32, 99, 114, 117, 115, 104, 101, 100, 32, 37, 115, 0]);
const __cxx_literal_47c12e5ef2e18a6db720 = Uint8Array.from([94, 48, 50, 37, 115, 94, 48, 50, 32, 100, 101, 115, 116, 114, 111, 121, 101, 100, 32, 37, 115, 0]);
const __cxx_literal_40a93dce45d2ad9ab888 = Uint8Array.from([94, 48, 50, 37, 115, 94, 48, 50, 32, 100, 105, 99, 101, 100, 32, 37, 115, 0]);
const __cxx_literal_1df379fcae26c5686913 = Uint8Array.from([94, 48, 50, 37, 115, 94, 48, 50, 32, 100, 105, 115, 101, 109, 98, 111, 119, 101, 108, 101, 100, 32, 37, 115, 0]);
const __cxx_literal_5056f17da90881fd52f0 = Uint8Array.from([94, 48, 50, 37, 115, 94, 48, 50, 32, 101, 114, 97, 115, 101, 100, 32, 37, 115, 0]);
const __cxx_literal_d621d3f061348083ff50 = Uint8Array.from([94, 48, 50, 37, 115, 94, 48, 50, 32, 101, 118, 105, 115, 99, 101, 114, 97, 116, 101, 100, 32, 37, 115, 0]);
const __cxx_literal_96588841242d4d084c59 = Uint8Array.from([94, 48, 50, 37, 115, 94, 48, 50, 32, 102, 108, 97, 105, 108, 101, 100, 32, 37, 115, 0]);
const __cxx_literal_cb5fd20b83db91f5a992 = Uint8Array.from([94, 48, 50, 37, 115, 94, 48, 50, 32, 102, 108, 97, 116, 116, 101, 110, 101, 100, 32, 37, 115, 0]);
const __cxx_literal_df6448595da9d42e0650 = Uint8Array.from([94, 48, 50, 37, 115, 94, 48, 50, 32, 103, 97, 118, 101, 32, 65, 110, 65, 108, 32, 77, 97, 68, 110, 69, 115, 83, 32, 116, 111, 32, 37, 115, 0]);
const __cxx_literal_4278529c757704c06462 = Uint8Array.from([94, 48, 50, 37, 115, 94, 48, 50, 32, 103, 97, 118, 101, 32, 37, 115, 94, 48, 50, 32, 65, 110, 97, 108, 32, 74, 117, 115, 116, 105, 99, 101, 0]);
const __cxx_literal_a3eb87138a0471bf41d1 = Uint8Array.from([94, 48, 50, 37, 115, 94, 48, 50, 32, 104, 111, 115, 101, 100, 32, 37, 115, 0]);
const __cxx_literal_3f20b71a9d309a84b138 = Uint8Array.from([94, 48, 50, 37, 115, 94, 48, 50, 32, 104, 117, 114, 116, 32, 37, 115, 94, 48, 50, 32, 114, 101, 97, 108, 32, 98, 97, 100, 0]);
const __cxx_literal_857165ef9696e51a5a24 = Uint8Array.from([94, 48, 50, 37, 115, 94, 48, 50, 32, 107, 105, 108, 108, 101, 100, 32, 37, 115, 0]);
const __cxx_literal_9b7cc9d8a10d6212cfc2 = Uint8Array.from([94, 48, 50, 37, 115, 94, 48, 50, 32, 109, 97, 100, 101, 32, 100, 111, 103, 32, 109, 101, 97, 116, 32, 111, 117, 116, 32, 111, 102, 32, 37, 115, 0]);
const __cxx_literal_76cb162e05aaf0895ad8 = Uint8Array.from([94, 48, 50, 37, 115, 94, 48, 50, 32, 109, 97, 100, 101, 32, 109, 105, 110, 99, 101, 109, 101, 97, 116, 32, 111, 117, 116, 32, 111, 102, 32, 37, 115, 0]);
const __cxx_literal_ed4f6d8707394208a5ec = Uint8Array.from([94, 48, 50, 37, 115, 94, 48, 50, 32, 109, 97, 110, 104, 97, 110, 100, 108, 101, 100, 32, 37, 115, 0]);
const __cxx_literal_9830ffa516f946a6a8cd = Uint8Array.from([94, 48, 50, 37, 115, 94, 48, 50, 32, 109, 97, 115, 115, 97, 99, 114, 101, 100, 32, 37, 115, 0]);
const __cxx_literal_f9fe479eb417681c318a = Uint8Array.from([94, 48, 50, 37, 115, 94, 48, 50, 32, 109, 117, 116, 105, 108, 97, 116, 101, 100, 32, 37, 115, 0]);
const __cxx_literal_3473f2f880a26eb84c50 = Uint8Array.from([94, 48, 50, 37, 115, 94, 48, 50, 32, 109, 117, 114, 100, 101, 114, 101, 100, 32, 37, 115, 0]);
const __cxx_literal_c43e3acb8f6fae991aec = Uint8Array.from([94, 48, 50, 37, 115, 94, 48, 50, 32, 110, 101, 117, 116, 101, 114, 101, 100, 32, 37, 115, 0]);
const __cxx_literal_a07804edf5c10f952710 = Uint8Array.from([94, 48, 50, 37, 115, 94, 48, 50, 32, 112, 117, 110, 116, 101, 100, 32, 37, 115, 0]);
const __cxx_literal_7c0c71a6c32dfa412acd = Uint8Array.from([94, 48, 50, 37, 115, 94, 48, 50, 32, 114, 101, 97, 109, 101, 100, 32, 37, 115, 0]);
const __cxx_literal_ddfd15ca3ae9832415e1 = Uint8Array.from([94, 48, 50, 37, 115, 94, 48, 50, 32, 114, 105, 112, 112, 101, 100, 32, 37, 115, 94, 48, 50, 32, 97, 32, 110, 101, 119, 32, 111, 114, 105, 102, 105, 99, 101, 0]);
const __cxx_literal_9716053303a91aa3f716 = Uint8Array.from([94, 48, 50, 37, 115, 94, 48, 50, 32, 114, 111, 99, 107, 101, 100, 32, 37, 115, 0]);
const __cxx_literal_fb878adac6efb193a5ba = Uint8Array.from([94, 48, 50, 37, 115, 94, 48, 50, 32, 115, 101, 110, 116, 32, 37, 115, 94, 48, 50, 32, 116, 111, 32, 104, 101, 108, 108, 0]);
const __cxx_literal_8e44c937df389e25b463 = Uint8Array.from([94, 48, 50, 37, 115, 94, 48, 50, 32, 115, 104, 114, 101, 100, 100, 101, 100, 32, 37, 115, 0]);
const __cxx_literal_06c79cb21845528504f3 = Uint8Array.from([94, 48, 50, 37, 115, 94, 48, 50, 32, 115, 108, 97, 115, 104, 101, 100, 32, 37, 115, 0]);
const __cxx_literal_5773a641afa8c6e97c2d = Uint8Array.from([94, 48, 50, 37, 115, 94, 48, 50, 32, 115, 108, 97, 117, 103, 104, 116, 101, 114, 101, 100, 32, 37, 115, 0]);
const __cxx_literal_7b450d5733e11549958c = Uint8Array.from([94, 48, 50, 37, 115, 94, 48, 50, 32, 115, 108, 105, 99, 101, 100, 32, 37, 115, 0]);
const __cxx_literal_5486ff68b559e6ea939e = Uint8Array.from([94, 48, 50, 37, 115, 94, 48, 50, 32, 115, 109, 97, 99, 107, 101, 100, 32, 37, 115, 32, 97, 114, 111, 117, 110, 100, 0]);
const __cxx_literal_b4797566ce541f82ae23 = Uint8Array.from([94, 48, 50, 37, 115, 94, 48, 50, 32, 115, 109, 97, 115, 104, 101, 100, 32, 37, 115, 0]);
const __cxx_literal_cac6c409d4e7421d681e = Uint8Array.from([94, 48, 50, 37, 115, 94, 48, 50, 32, 115, 110, 117, 102, 102, 101, 100, 32, 37, 115, 0]);
const __cxx_literal_7cd2c6d78e83218965da = Uint8Array.from([94, 48, 50, 37, 115, 94, 48, 50, 32, 115, 111, 100, 111, 109, 105, 122, 101, 100, 32, 37, 115, 0]);
const __cxx_literal_cbf68640203bace934fe = Uint8Array.from([94, 48, 50, 37, 115, 94, 48, 50, 32, 115, 112, 108, 97, 116, 116, 101, 114, 101, 100, 32, 37, 115, 0]);
const __cxx_literal_6c1e6d650915e333e3b2 = Uint8Array.from([94, 48, 50, 37, 115, 94, 48, 50, 32, 115, 112, 114, 97, 121, 101, 100, 32, 37, 115, 0]);
const __cxx_literal_36d302bee10569a53e60 = Uint8Array.from([94, 48, 50, 37, 115, 94, 48, 50, 32, 115, 113, 117, 97, 115, 104, 101, 100, 32, 37, 115, 0]);
const __cxx_literal_2d412f91120e5fb6970b = Uint8Array.from([94, 48, 50, 37, 115, 94, 48, 50, 32, 116, 104, 114, 111, 116, 116, 108, 101, 100, 32, 37, 115, 0]);
const __cxx_literal_731d6bb2cb11f0f92c01 = Uint8Array.from([94, 48, 50, 37, 115, 94, 48, 50, 32, 116, 111, 97, 115, 116, 101, 100, 32, 37, 115, 0]);
const __cxx_literal_feb95bb51b8956a99994 = Uint8Array.from([94, 48, 50, 37, 115, 94, 48, 50, 32, 118, 101, 110, 116, 101, 100, 32, 37, 115, 0]);
const __cxx_literal_2d2ba30504c0f200ed66 = Uint8Array.from([94, 48, 50, 37, 115, 94, 48, 50, 32, 118, 101, 110, 116, 105, 108, 97, 116, 101, 100, 32, 37, 115, 0]);
const __cxx_literal_53e880caee66ec00297e = Uint8Array.from([94, 48, 50, 37, 115, 94, 48, 50, 32, 119, 97, 115, 116, 101, 100, 32, 37, 115, 0]);
const __cxx_literal_1f737052030be4317fb8 = Uint8Array.from([94, 48, 50, 37, 115, 94, 48, 50, 32, 119, 114, 101, 99, 107, 101, 100, 32, 37, 115, 0]);
const __cxx_literal_148e27c85441b0fdb30f = Uint8Array.from([94, 48, 50, 37, 115, 94, 48, 50, 32, 105, 115, 32, 101, 120, 99, 114, 101, 109, 101, 110, 116, 0]);
const __cxx_literal_28d2f0d736a818f1bbca = Uint8Array.from([94, 48, 50, 37, 115, 94, 48, 50, 32, 105, 115, 32, 104, 97, 109, 98, 117, 114, 103, 101, 114, 0]);
const __cxx_literal_1cf2d16b26de9e3182cb = Uint8Array.from([94, 48, 50, 37, 115, 94, 48, 50, 32, 115, 117, 102, 102, 101, 114, 101, 100, 32, 115, 99, 114, 111, 116, 117, 109, 32, 115, 101, 112, 97, 114, 97, 116, 105, 111, 110, 0]);
const __cxx_literal_44367d78891be5ec3066 = Uint8Array.from([94, 48, 50, 37, 115, 94, 48, 50, 32, 118, 111, 108, 117, 110, 116, 101, 101, 114, 101, 100, 32, 102, 111, 114, 32, 112, 111, 112, 117, 108, 97, 116, 105, 111, 110, 32, 99, 111, 110, 116, 114, 111, 108, 0]);
const __cxx_literal_05a63eae8c8889272de0 = Uint8Array.from([94, 48, 50, 37, 115, 94, 48, 50, 32, 104, 97, 115, 32, 115, 117, 105, 99, 105, 100, 101, 100, 0]);
const __cxx_literal_9dc7ba8929d8f213e92a = Uint8Array.from([94, 48, 50, 37, 115, 94, 48, 50, 32, 98, 108, 101, 100, 32, 111, 117, 116, 0]);
export function C_InitQuotes() {
  for (let i = i32(0); (i < 128); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; }))) {
    C_AllocQuote(i);
  }
  let OpenGameFunc = (cPointerElementRef(gamefunctions, 6).value);
  C_ReplaceQuoteSubstring(u64(13), __cxx_literal_d450fd923f7ab30e9a15, OpenGameFunc);
  C_ReplaceQuoteSubstring(u64(13), __cxx_literal_a159b66b3dfa28ba0d7b, OpenGameFunc);
  C_ReplaceQuoteSubstring(u64(13), __cxx_literal_3eeceafbee6ea70d54e0, OpenGameFunc);
  let PlayerObituaries = cPointerArray(48, [__cxx_literal_b854756a795c109ef02e, __cxx_literal_9fed2f9c80433cb0bbe9, __cxx_literal_38fc4f5e12fe31e2d6a0, __cxx_literal_b8bca615f3df4711e593, __cxx_literal_c56107d39320b34b421f, __cxx_literal_406028c2bc552290edd9, __cxx_literal_d97428ddac0e776573ba, __cxx_literal_47c12e5ef2e18a6db720, __cxx_literal_40a93dce45d2ad9ab888, __cxx_literal_1df379fcae26c5686913, __cxx_literal_5056f17da90881fd52f0, __cxx_literal_d621d3f061348083ff50, __cxx_literal_96588841242d4d084c59, __cxx_literal_cb5fd20b83db91f5a992, __cxx_literal_df6448595da9d42e0650, __cxx_literal_4278529c757704c06462, __cxx_literal_a3eb87138a0471bf41d1, __cxx_literal_3f20b71a9d309a84b138, __cxx_literal_857165ef9696e51a5a24, __cxx_literal_9b7cc9d8a10d6212cfc2, __cxx_literal_76cb162e05aaf0895ad8, __cxx_literal_ed4f6d8707394208a5ec, __cxx_literal_9830ffa516f946a6a8cd, __cxx_literal_f9fe479eb417681c318a, __cxx_literal_3473f2f880a26eb84c50, __cxx_literal_c43e3acb8f6fae991aec, __cxx_literal_a07804edf5c10f952710, __cxx_literal_7c0c71a6c32dfa412acd, __cxx_literal_ddfd15ca3ae9832415e1, __cxx_literal_9716053303a91aa3f716, __cxx_literal_fb878adac6efb193a5ba, __cxx_literal_8e44c937df389e25b463, __cxx_literal_06c79cb21845528504f3, __cxx_literal_5773a641afa8c6e97c2d, __cxx_literal_7b450d5733e11549958c, __cxx_literal_5486ff68b559e6ea939e, __cxx_literal_b4797566ce541f82ae23, __cxx_literal_cac6c409d4e7421d681e, __cxx_literal_7cd2c6d78e83218965da, __cxx_literal_cbf68640203bace934fe, __cxx_literal_6c1e6d650915e333e3b2, __cxx_literal_36d302bee10569a53e60, __cxx_literal_2d412f91120e5fb6970b, __cxx_literal_731d6bb2cb11f0f92c01, __cxx_literal_feb95bb51b8956a99994, __cxx_literal_2d2ba30504c0f200ed66, __cxx_literal_53e880caee66ec00297e, __cxx_literal_1f737052030be4317fb8]);
  let PlayerSelfObituaries = cPointerArray(6, [__cxx_literal_148e27c85441b0fdb30f, __cxx_literal_28d2f0d736a818f1bbca, __cxx_literal_1cf2d16b26de9e3182cb, __cxx_literal_44367d78891be5ec3066, __cxx_literal_05a63eae8c8889272de0, __cxx_literal_9dc7ba8929d8f213e92a]);


  (__cxx_global_cell_14c7f525d32b0838223674c4().value = i32(ARRAY_SIZE__header_6acb20764cfa(PlayerObituaries)));
  for (let i = i64(i32((__cxx_global_cell_14c7f525d32b0838223674c4().value - 1))); (i >= i64(0)); ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i64((previous - 1n)); __cxx_lvalue_2.value = next; return previous; })(cRef(() => i, __cxx_lvalue_3 => { i = __cxx_lvalue_3; }))) {
    if (Boolean(C_AllocQuote(i32(i64((BigInt(i) + BigInt(i64(i32((16384 - 128)))))))))) {
      strcpy((cPointerElementRef(apStrings, i64((BigInt(i) + BigInt(i64(i32((16384 - 128))))))).value), (cPointerElementRef(PlayerObituaries, i).value));
    }
  }
  (__cxx_global_cell_30b06f32517f69cb2a10e60b().value = i32(ARRAY_SIZE__header_fc0707ff3649(PlayerSelfObituaries)));
  for (let i = i64(i32((__cxx_global_cell_30b06f32517f69cb2a10e60b().value - 1))); (i >= i64(0)); ((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = i64((previous - 1n)); __cxx_lvalue_4.value = next; return previous; })(cRef(() => i, __cxx_lvalue_5 => { i = __cxx_lvalue_5; }))) {
    if (Boolean(C_AllocQuote(i32(i64((BigInt(i) + BigInt(i64(i32((16384 - 32)))))))))) {
      strcpy((cPointerElementRef(apStrings, i64((BigInt(i) + BigInt(i64(i32((16384 - 32))))))).value), (cPointerElementRef(PlayerSelfObituaries, i).value));
    }
  }
}

// C/C++ source: source/duke3d/src/gamedef.cpp:2498
export function C_BitOrNextValue(valptr) {
  C_GetNextValue(i32(8));
  ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = cPointerOffset(previous, -1, BigInt64Array.BYTES_PER_ELEMENT); __cxx_lvalue_0.value = next; return previous; })(__cxx_global_cell_7c95f40343184c865284ca02());
  ((__cxx_lvalue_1) => (__cxx_lvalue_1.value = i32((__cxx_lvalue_1.value | (cDeref(__cxx_global_cell_7c95f40343184c865284ca02().value, BigInt64Array).value)))))(cDeref(valptr, Int32Array));
}

// C/C++ source: source/duke3d/src/gamedef.cpp:2505
export function C_FinishBitOr(value) {
  scriptWriteValue(value);
}

// C/C++ source: source/duke3d/src/gamedef.cpp:2510
export function C_FillEventBreakStackWithJump(breakPtr, destination) {
  while (breakPtr) {
    (breakPtr = cPointerOffset(__cxx_global_cell_38abf48ab8ba3db5fce877d9().value, i64(cSourceAddresses.encode(breakPtr)), BigInt64Array.BYTES_PER_ELEMENT));
    let tempPtr = i64((cDeref(breakPtr, BigInt64Array).value));
    scriptWriteAtOffset(i32(destination), breakPtr);
    (breakPtr = cTypedPointer(cSourceAddresses.decode(tempPtr), BigInt64Array));
  }
}

// C/C++ source: source/duke3d/src/gamedef.cpp:2521
const __cxx_literal_f93a3e24e0e0e80f76f4 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 100, 101, 102, 46, 99, 112, 112, 0]);
const __cxx_literal_335ca18bf78df4856ba0 = Uint8Array.from([37, 115, 58, 37, 100, 58, 32, 37, 115, 32, 45, 62, 32, 37, 115, 32, 102, 111, 114, 32, 118, 97, 114, 32, 37, 115, 0]);
export function scriptUpdateOpcodeForVariableType(ins) {
  let opcode = i32((-1));
  if (((cDeref(cPointerOffset(ins, 1, BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array).value) < i64(2048))) {
    switch (u64((BigInt((cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), i64((BigInt((cDeref(cPointerOffset(ins, 1, BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array).value)) & BigInt(i64(i32((2048 - 1))))))).value).flags) & BigInt(u64(i32((i32(3) | i32(1351680)))))))) {
      case u64(0): {
        (opcode = i32(inthash_find(__cxx_private_cell_b56202585616aa9c65ec503a().value, i64((BigInt((cDeref(ins, BigInt64Array).value)) & BigInt(i64(4095)))))));
      }
      break;
      case u64(2): {
        (opcode = i32(inthash_find(__cxx_private_cell_6e818e10e7fcc27dc3dc3c5b().value, i64((BigInt((cDeref(ins, BigInt64Array).value)) & BigInt(i64(4095)))))));
      }
      break;
      case u64(1): {
        (opcode = i32(inthash_find(__cxx_private_cell_adb3542f30964081065bc3c4().value, i64((BigInt((cDeref(ins, BigInt64Array).value)) & BigInt(i64(4095)))))));
      }
      break;
    }
  }
  if ((opcode != (-1))) {
    if ((((__cxx_global_cell_428952e2c5a589c67db10fcc().value > 1) && (!Boolean(__cxx_global_cell_a9ed12f504f4bd101d4746c6().value))) && (!Boolean(__cxx_global_cell_778291b6375dd09957e56c1b().value)))) {
      ((i32(10) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(10), __cxx_literal_f93a3e24e0e0e80f76f4, u32(2546), __cxx_literal_335ca18bf78df4856ba0, g_scriptFileName, __cxx_global_cell_06245cf7a06b2fd69750f440().value, VM_GetKeywordForID(i32(i64((BigInt((cDeref(ins, BigInt64Array).value)) & BigInt(i64(4095)))))), VM_GetKeywordForID(opcode), (cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), i64((BigInt((cDeref(cPointerOffset(ins, 1, BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array).value)) & BigInt(i64(i32((2048 - 1))))))).value).szLabel));
    }
    scriptWriteAtOffset(i32((opcode | i32((__cxx_global_cell_06245cf7a06b2fd69750f440().value << 12)))), ins);
  }
}

// C/C++ source: source/duke3d/src/gamedef.cpp:6376
export function C_AddDefinition(lLabel, lValue, lType) {
  strcpy(cPointerOffset(__cxx_global_cell_1aca80e8b55c802f7b43740d().value, i32((__cxx_global_cell_6742302ef915e025d82bcd36().value << 6)), Uint8Array.BYTES_PER_ELEMENT), lLabel);
  ((cDeref(cPointerOffset(__cxx_global_cell_ca786e7ce472b03dc90a2ec6().value, __cxx_global_cell_6742302ef915e025d82bcd36().value, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(lType) & 255)) & 255));
  hash_add(__cxx_global_cell_d4103f960bb678857722381c().value, cPointerOffset(__cxx_global_cell_1aca80e8b55c802f7b43740d().value, i32((__cxx_global_cell_6742302ef915e025d82bcd36().value << 6)), Uint8Array.BYTES_PER_ELEMENT), i64(__cxx_global_cell_6742302ef915e025d82bcd36().value), 0);
  ((cDeref(cPointerOffset(__cxx_global_cell_bb1aad227706ae6ec200fcf0().value, ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(__cxx_global_cell_6742302ef915e025d82bcd36()), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(lValue));
}

// C/C++ source: source/duke3d/src/gamedef.cpp:6384
const __cxx_literal_905d3ce3163cdb5ce09f = Uint8Array.from([67, 76, 73, 80, 77, 65, 83, 75, 48, 0]);
const __cxx_literal_4c4f1974317a05daafc6 = Uint8Array.from([67, 76, 73, 80, 77, 65, 83, 75, 49, 0]);
const __cxx_literal_dbfa40db37c83c0be40e = Uint8Array.from([71, 65, 77, 69, 65, 82, 82, 65, 89, 95, 66, 79, 79, 76, 69, 65, 78, 0]);
const __cxx_literal_31ab2085eb9be4da810b = Uint8Array.from([71, 65, 77, 69, 65, 82, 82, 65, 89, 95, 73, 78, 84, 49, 54, 0]);
const __cxx_literal_c57775dc8c20c07708ba = Uint8Array.from([71, 65, 77, 69, 65, 82, 82, 65, 89, 95, 73, 78, 84, 56, 0]);
const __cxx_literal_97a5aaadb668d70b6ed1 = Uint8Array.from([71, 65, 77, 69, 65, 82, 82, 65, 89, 95, 82, 69, 83, 84, 79, 82, 69, 0]);
const __cxx_literal_510235c6d973f2a82794 = Uint8Array.from([71, 65, 77, 69, 65, 82, 82, 65, 89, 95, 85, 73, 78, 84, 49, 54, 0]);
const __cxx_literal_7b977d0ae7acd48889c4 = Uint8Array.from([71, 65, 77, 69, 65, 82, 82, 65, 89, 95, 85, 73, 78, 84, 56, 0]);
const __cxx_literal_c6d0a70cb96daf65fcbf = Uint8Array.from([71, 65, 77, 69, 86, 65, 82, 95, 78, 79, 68, 69, 70, 65, 85, 76, 84, 0]);
const __cxx_literal_120383b5f037a6dc8d95 = Uint8Array.from([71, 65, 77, 69, 86, 65, 82, 95, 78, 79, 77, 85, 76, 84, 73, 0]);
const __cxx_literal_a081af6e48fac911125b = Uint8Array.from([71, 65, 77, 69, 86, 65, 82, 95, 78, 79, 82, 69, 83, 69, 84, 0]);
const __cxx_literal_9bdabe8e35e7f4245047 = Uint8Array.from([71, 65, 77, 69, 86, 65, 82, 95, 80, 69, 82, 65, 67, 84, 79, 82, 0]);
const __cxx_literal_acdc582b19fd7731ddaf = Uint8Array.from([71, 65, 77, 69, 86, 65, 82, 95, 80, 69, 82, 80, 76, 65, 89, 69, 82, 0]);
const __cxx_literal_77e133911d84c1db16e6 = Uint8Array.from([71, 65, 77, 69, 86, 65, 82, 95, 83, 69, 82, 73, 65, 76, 73, 90, 69, 0]);
const __cxx_literal_83551c318c8081269e16 = Uint8Array.from([77, 65, 88, 95, 87, 69, 65, 80, 79, 78, 83, 0]);
const __cxx_literal_b3d9902c6a84fdbbc33f = Uint8Array.from([77, 65, 88, 83, 80, 82, 73, 84, 69, 83, 0]);
const __cxx_literal_9b1adc0431743f4cd32e = Uint8Array.from([77, 65, 88, 83, 80, 82, 73, 84, 69, 83, 79, 78, 83, 67, 82, 69, 69, 78, 0]);
const __cxx_literal_717c24f7a0e5fddab260 = Uint8Array.from([77, 65, 88, 83, 84, 65, 84, 85, 83, 0]);
const __cxx_literal_6d24dd3427e1557b6e4e = Uint8Array.from([77, 65, 88, 84, 73, 76, 69, 83, 0]);
const __cxx_literal_5022874a7bf663605df0 = Uint8Array.from([77, 65, 88, 76, 69, 86, 69, 76, 83, 0]);
const __cxx_literal_a296a86fff67456e5189 = Uint8Array.from([77, 65, 88, 86, 79, 76, 85, 77, 69, 83, 0]);
const __cxx_literal_1f3dbec25567e66ca373 = Uint8Array.from([80, 82, 79, 74, 95, 66, 79, 85, 78, 67, 69, 83, 0]);
const __cxx_literal_13e1095dc0efff7a4aa0 = Uint8Array.from([80, 82, 79, 74, 95, 66, 83, 79, 85, 78, 68, 0]);
const __cxx_literal_33b2b0a9955065a7625b = Uint8Array.from([80, 82, 79, 74, 95, 67, 76, 73, 80, 68, 73, 83, 84, 0]);
const __cxx_literal_21df5110a17f37e6505f = Uint8Array.from([80, 82, 79, 74, 95, 67, 83, 84, 65, 84, 0]);
const __cxx_literal_12c22c02583aad33c34b = Uint8Array.from([80, 82, 79, 74, 95, 68, 69, 67, 65, 76, 0]);
const __cxx_literal_1c67300278128fd0c9e6 = Uint8Array.from([80, 82, 79, 74, 95, 68, 82, 79, 80, 0]);
const __cxx_literal_3c162e907765791c20e6 = Uint8Array.from([80, 82, 79, 74, 95, 69, 88, 84, 82, 65, 0]);
const __cxx_literal_121206967729b74806a1 = Uint8Array.from([80, 82, 79, 74, 95, 69, 88, 84, 82, 65, 95, 82, 65, 78, 68, 0]);
const __cxx_literal_a0cfba233adfc256e929 = Uint8Array.from([80, 82, 79, 74, 95, 70, 76, 65, 83, 72, 95, 67, 79, 76, 79, 82, 0]);
const __cxx_literal_8474f199a6a3668a2db5 = Uint8Array.from([80, 82, 79, 74, 95, 72, 73, 84, 82, 65, 68, 73, 85, 83, 0]);
const __cxx_literal_7b56925f63fe807baf62 = Uint8Array.from([80, 82, 79, 74, 95, 73, 83, 79, 85, 78, 68, 0]);
const __cxx_literal_e1129bfdd1fb7d394749 = Uint8Array.from([80, 82, 79, 74, 95, 79, 70, 70, 83, 69, 84, 0]);
const __cxx_literal_e7d17ae0d97d5a019380 = Uint8Array.from([80, 82, 79, 74, 95, 80, 65, 76, 0]);
const __cxx_literal_a6a20236cd1c4b47fa50 = Uint8Array.from([80, 82, 79, 74, 95, 82, 65, 78, 71, 69, 0]);
const __cxx_literal_7ad4a5418f92e355988c = Uint8Array.from([80, 82, 79, 74, 95, 83, 72, 65, 68, 69, 0]);
const __cxx_literal_6ffe3132fdc50ac70162 = Uint8Array.from([80, 82, 79, 74, 95, 83, 79, 85, 78, 68, 0]);
const __cxx_literal_8d2d10f20e89fcbd536e = Uint8Array.from([80, 82, 79, 74, 95, 83, 80, 65, 87, 78, 83, 0]);
const __cxx_literal_24d5e43702a127a43f12 = Uint8Array.from([80, 82, 79, 74, 95, 83, 88, 82, 69, 80, 69, 65, 84, 0]);
const __cxx_literal_410dfbc8b63ef01fe7ca = Uint8Array.from([80, 82, 79, 74, 95, 83, 89, 82, 69, 80, 69, 65, 84, 0]);
const __cxx_literal_d2e82aba97f2767cbd8d = Uint8Array.from([80, 82, 79, 74, 95, 84, 78, 85, 77, 0]);
const __cxx_literal_ba6535a314f867a9f4ea = Uint8Array.from([80, 82, 79, 74, 95, 84, 79, 70, 70, 83, 69, 84, 0]);
const __cxx_literal_d9cc523017a58d44a10d = Uint8Array.from([80, 82, 79, 74, 95, 84, 82, 65, 73, 76, 0]);
const __cxx_literal_59e846d798532825aabe = Uint8Array.from([80, 82, 79, 74, 95, 84, 88, 82, 69, 80, 69, 65, 84, 0]);
const __cxx_literal_9104902cd6569acb1c4d = Uint8Array.from([80, 82, 79, 74, 95, 84, 89, 82, 69, 80, 69, 65, 84, 0]);
const __cxx_literal_87aca8517b5d5081651a = Uint8Array.from([80, 82, 79, 74, 95, 85, 83, 69, 82, 68, 65, 84, 65, 0]);
const __cxx_literal_9584aa8b183e0f8df1b2 = Uint8Array.from([80, 82, 79, 74, 95, 86, 69, 76, 0]);
const __cxx_literal_52e11d204bf3e113417e = Uint8Array.from([80, 82, 79, 74, 95, 86, 69, 76, 95, 77, 85, 76, 84, 0]);
const __cxx_literal_8b084989838285d02df1 = Uint8Array.from([80, 82, 79, 74, 95, 87, 79, 82, 75, 83, 76, 73, 75, 69, 0]);
const __cxx_literal_78e6dde018aabec62005 = Uint8Array.from([80, 82, 79, 74, 95, 88, 82, 69, 80, 69, 65, 84, 0]);
const __cxx_literal_30998aaf43a4117c5b8e = Uint8Array.from([80, 82, 79, 74, 95, 89, 82, 69, 80, 69, 65, 84, 0]);
const __cxx_literal_ddafe8d11a426eddcf62 = Uint8Array.from([80, 70, 95, 65, 67, 67, 85, 82, 65, 84, 69, 0]);
const __cxx_literal_3229a5e8b334b3ba93d0 = Uint8Array.from([80, 70, 95, 65, 67, 67, 85, 82, 65, 84, 69, 95, 65, 85, 84, 79, 65, 73, 77, 0]);
const __cxx_literal_dd4c6b158624471b48e0 = Uint8Array.from([80, 70, 95, 66, 76, 79, 79, 68, 0]);
const __cxx_literal_3b71c10bda9e3b20b2c5 = Uint8Array.from([80, 70, 95, 66, 79, 85, 78, 67, 69, 83, 79, 70, 70, 77, 73, 82, 82, 79, 82, 83, 0]);
const __cxx_literal_8b8b8bd36dcdb4526540 = Uint8Array.from([80, 70, 95, 66, 79, 85, 78, 67, 69, 83, 79, 70, 70, 83, 80, 82, 73, 84, 69, 83, 0]);
const __cxx_literal_041b0fdf42382f5e1f32 = Uint8Array.from([80, 70, 95, 66, 79, 85, 78, 67, 69, 83, 79, 70, 70, 87, 65, 76, 76, 83, 0]);
const __cxx_literal_0c98c469c4bdda718e92 = Uint8Array.from([80, 70, 95, 67, 79, 79, 76, 69, 88, 80, 76, 79, 83, 73, 79, 78, 49, 0]);
const __cxx_literal_ff4715a61a52da53eda3 = Uint8Array.from([80, 70, 95, 69, 88, 80, 76, 79, 68, 69, 79, 78, 84, 73, 77, 69, 82, 0]);
const __cxx_literal_60d3ddd221c867ac5ce0 = Uint8Array.from([80, 70, 95, 70, 79, 82, 67, 69, 73, 77, 80, 65, 67, 84, 0]);
const __cxx_literal_decb5d65d8efa68e3e01 = Uint8Array.from([80, 70, 95, 72, 73, 84, 82, 65, 68, 73, 85, 83, 95, 65, 68, 68, 73, 84, 73, 86, 69, 0]);
const __cxx_literal_e7a0c9e39bb2a4b8ac6d = Uint8Array.from([80, 70, 95, 72, 73, 84, 83, 67, 65, 78, 0]);
const __cxx_literal_1e523f9206ad997bfc92 = Uint8Array.from([80, 70, 95, 75, 78, 69, 69, 0]);
const __cxx_literal_85970b718a64a6dd45c4 = Uint8Array.from([80, 70, 95, 76, 79, 83, 69, 83, 86, 69, 76, 79, 67, 73, 84, 89, 0]);
const __cxx_literal_1f842bc22267bcba6912 = Uint8Array.from([80, 70, 95, 78, 79, 65, 73, 77, 0]);
const __cxx_literal_595c2c3293e3fe158181 = Uint8Array.from([80, 70, 95, 78, 79, 83, 69, 84, 79, 87, 78, 69, 82, 83, 72, 65, 68, 69, 0]);
const __cxx_literal_8736f861ff342336f25b = Uint8Array.from([80, 70, 95, 82, 65, 68, 73, 85, 83, 95, 80, 73, 67, 78, 85, 77, 0]);
const __cxx_literal_2b61aaa16f75af8fd325 = Uint8Array.from([80, 70, 95, 82, 65, 78, 68, 68, 69, 67, 65, 76, 83, 73, 90, 69, 0]);
const __cxx_literal_86e0c871c242265845e9 = Uint8Array.from([80, 70, 95, 82, 69, 65, 76, 67, 76, 73, 80, 68, 73, 83, 84, 0]);
const __cxx_literal_4bde2ee0644869ac7dcb = Uint8Array.from([80, 70, 95, 82, 80, 71, 0]);
const __cxx_literal_dbc85fcb93bb0ce64ce4 = Uint8Array.from([80, 70, 95, 82, 80, 71, 95, 73, 77, 80, 65, 67, 84, 0]);
const __cxx_literal_43d48bded9450f82e947 = Uint8Array.from([80, 70, 95, 82, 80, 71, 95, 73, 77, 80, 65, 67, 84, 95, 68, 65, 77, 65, 71, 69, 0]);
const __cxx_literal_bff46a0024b9ef49b463 = Uint8Array.from([80, 70, 95, 83, 80, 73, 84, 0]);
const __cxx_literal_aa6d3cab2d8ac1267d9b = Uint8Array.from([80, 70, 95, 84, 73, 77, 69, 68, 0]);
const __cxx_literal_438fc7e3e5172ba7e1f5 = Uint8Array.from([80, 70, 95, 87, 65, 84, 69, 82, 66, 85, 66, 66, 76, 69, 83, 0]);
const __cxx_literal_8cf1297f7ac40ce00978 = Uint8Array.from([83, 70, 76, 65, 71, 95, 66, 65, 68, 71, 85, 89, 0]);
const __cxx_literal_abf33baffa69bc9e3942 = Uint8Array.from([83, 70, 76, 65, 71, 95, 68, 65, 77, 65, 71, 69, 69, 86, 69, 78, 84, 0]);
const __cxx_literal_58e613289a70d875f589 = Uint8Array.from([83, 70, 76, 65, 71, 95, 71, 82, 69, 69, 78, 83, 76, 73, 77, 69, 70, 79, 79, 68, 0]);
const __cxx_literal_a86dfbd0a05411255960 = Uint8Array.from([83, 70, 76, 65, 71, 95, 72, 85, 82, 84, 83, 80, 65, 87, 78, 66, 76, 79, 79, 68, 0]);
const __cxx_literal_ffb3f9a0e4de80df6b08 = Uint8Array.from([83, 70, 76, 65, 71, 95, 78, 79, 67, 76, 73, 80, 0]);
const __cxx_literal_76791f7f57a25bb7a13e = Uint8Array.from([83, 70, 76, 65, 71, 95, 78, 79, 68, 65, 77, 65, 71, 69, 80, 85, 83, 72, 0]);
const __cxx_literal_b9cb99d23b46801cdae1 = Uint8Array.from([83, 70, 76, 65, 71, 95, 78, 79, 69, 86, 69, 78, 84, 83, 0]);
const __cxx_literal_dd49ac678d71275d2ad0 = Uint8Array.from([83, 70, 76, 65, 71, 95, 78, 79, 76, 73, 71, 72, 84, 0]);
const __cxx_literal_c2bbb9eeb34eee324007 = Uint8Array.from([83, 70, 76, 65, 71, 95, 78, 79, 80, 65, 76, 0]);
const __cxx_literal_c3ddb72a54b2a134be61 = Uint8Array.from([83, 70, 76, 65, 71, 95, 78, 79, 83, 72, 65, 68, 69, 0]);
const __cxx_literal_5b26d2c32f75c853ff33 = Uint8Array.from([83, 70, 76, 65, 71, 95, 78, 79, 84, 69, 76, 69, 80, 79, 82, 84, 0]);
const __cxx_literal_8d4072250fd05bcb3c37 = Uint8Array.from([83, 70, 76, 65, 71, 95, 78, 79, 87, 65, 84, 69, 82, 68, 73, 80, 0]);
const __cxx_literal_d17df9c1af7bbbd4dafc = Uint8Array.from([83, 70, 76, 65, 71, 95, 78, 86, 71, 0]);
const __cxx_literal_2993c86fcc2f8680d16f = Uint8Array.from([83, 70, 76, 65, 71, 95, 82, 69, 65, 76, 67, 76, 73, 80, 68, 73, 83, 84, 0]);
const __cxx_literal_6ac4ba32eea0064f1dda = Uint8Array.from([83, 70, 76, 65, 71, 95, 83, 72, 65, 68, 79, 87, 0]);
const __cxx_literal_c4ba6fff6acf104d42dd = Uint8Array.from([83, 70, 76, 65, 71, 95, 83, 77, 79, 79, 84, 72, 77, 79, 86, 69, 0]);
const __cxx_literal_41d7f000a6ed9a8ce0d8 = Uint8Array.from([83, 70, 76, 65, 71, 95, 85, 83, 69, 65, 67, 84, 73, 86, 65, 84, 79, 82, 0]);
const __cxx_literal_ff260e6a7c4164969f47 = Uint8Array.from([83, 70, 76, 65, 71, 95, 87, 65, 75, 69, 85, 80, 66, 65, 68, 71, 85, 89, 83, 0]);
const __cxx_literal_da4eef625709b3e8e6c9 = Uint8Array.from([83, 70, 76, 65, 71, 95, 78, 79, 87, 65, 84, 69, 82, 83, 69, 67, 84, 79, 82, 0]);
const __cxx_literal_9e6a8205b42bb051d455 = Uint8Array.from([83, 70, 76, 65, 71, 95, 81, 85, 69, 85, 69, 68, 70, 79, 82, 68, 69, 76, 69, 84, 69, 0]);
const __cxx_literal_aaf52f95e5dba3f62c49 = Uint8Array.from([83, 84, 65, 84, 95, 65, 67, 84, 73, 86, 65, 84, 79, 82, 0]);
const __cxx_literal_53af52f86a10697f1245 = Uint8Array.from([83, 84, 65, 84, 95, 65, 67, 84, 79, 82, 0]);
const __cxx_literal_9c5f9184604cdcfedaac = Uint8Array.from([83, 84, 65, 84, 95, 68, 69, 70, 65, 85, 76, 84, 0]);
const __cxx_literal_81440d663a21c5831e39 = Uint8Array.from([83, 84, 65, 84, 95, 68, 85, 77, 77, 89, 80, 76, 65, 89, 69, 82, 0]);
const __cxx_literal_def9fea1f34a9e2e25b4 = Uint8Array.from([83, 84, 65, 84, 95, 69, 70, 70, 69, 67, 84, 79, 82, 0]);
const __cxx_literal_89a1c505410452b64624 = Uint8Array.from([83, 84, 65, 84, 95, 70, 65, 76, 76, 69, 82, 0]);
const __cxx_literal_e1ee573dea49580eaa38 = Uint8Array.from([83, 84, 65, 84, 95, 70, 88, 0]);
const __cxx_literal_fa0d6ca78f67237bfee6 = Uint8Array.from([83, 84, 65, 84, 95, 76, 73, 71, 72, 84, 0]);
const __cxx_literal_4c5c24a0b1e387a42c3d = Uint8Array.from([83, 84, 65, 84, 95, 76, 79, 67, 65, 84, 79, 82, 0]);
const __cxx_literal_c109f5a35903696f9384 = Uint8Array.from([83, 84, 65, 84, 95, 77, 73, 83, 67, 0]);
const __cxx_literal_caef54e9c2fedd44317a = Uint8Array.from([83, 84, 65, 84, 95, 80, 76, 65, 89, 69, 82, 0]);
const __cxx_literal_62865e0bc39d5c6ad1c7 = Uint8Array.from([83, 84, 65, 84, 95, 80, 82, 79, 74, 69, 67, 84, 73, 76, 69, 0]);
const __cxx_literal_7d5edb4be6cc49f5c602 = Uint8Array.from([83, 84, 65, 84, 95, 83, 84, 65, 78, 68, 65, 66, 76, 69, 0]);
const __cxx_literal_8ecd464061d0d1fcf715 = Uint8Array.from([83, 84, 65, 84, 95, 84, 82, 65, 78, 83, 80, 79, 82, 84, 0]);
const __cxx_literal_e113e4c3810a04ef6039 = Uint8Array.from([83, 84, 65, 84, 95, 90, 79, 77, 66, 73, 69, 65, 67, 84, 79, 82, 0]);
const __cxx_literal_507f0858f4a3650aea37 = Uint8Array.from([83, 84, 82, 95, 66, 69, 83, 84, 84, 73, 77, 69, 0]);
const __cxx_literal_fc160906ee93598d1ea4 = Uint8Array.from([83, 84, 82, 95, 68, 69, 83, 73, 71, 78, 69, 82, 84, 73, 77, 69, 0]);
const __cxx_literal_8fe6f03eb51b6566ea09 = Uint8Array.from([83, 84, 82, 95, 71, 65, 77, 69, 84, 89, 80, 69, 0]);
const __cxx_literal_6841acc4e31aebee33b0 = Uint8Array.from([83, 84, 82, 95, 77, 65, 80, 70, 73, 76, 69, 78, 65, 77, 69, 0]);
const __cxx_literal_3b836681c192d68abd58 = Uint8Array.from([83, 84, 82, 95, 77, 65, 80, 78, 65, 77, 69, 0]);
const __cxx_literal_32077d398baaac9c887c = Uint8Array.from([83, 84, 82, 95, 80, 65, 82, 84, 73, 77, 69, 0]);
const __cxx_literal_162d0f0dba71d1f1a629 = Uint8Array.from([83, 84, 82, 95, 80, 76, 65, 89, 69, 82, 78, 65, 77, 69, 0]);
const __cxx_literal_3245e19bc8c98615afeb = Uint8Array.from([83, 84, 82, 95, 82, 69, 86, 73, 83, 73, 79, 78, 0]);
const __cxx_literal_844d8741ee8c69e6ff6c = Uint8Array.from([83, 84, 82, 95, 85, 83, 69, 82, 77, 65, 80, 70, 73, 76, 69, 78, 65, 77, 69, 0]);
const __cxx_literal_b4cb2655e4189487507c = Uint8Array.from([83, 84, 82, 95, 86, 69, 82, 83, 73, 79, 78, 0]);
const __cxx_literal_def945c35529e7b25563 = Uint8Array.from([83, 84, 82, 95, 86, 79, 76, 85, 77, 69, 78, 65, 77, 69, 0]);
const __cxx_literal_0ac1b720b212deb2e601 = Uint8Array.from([83, 84, 82, 95, 89, 79, 85, 82, 84, 73, 77, 69, 0]);
const __cxx_literal_3835a917dc43bb482566 = Uint8Array.from([84, 73, 76, 69, 95, 65, 78, 73, 77, 0]);
const __cxx_literal_9861edb5f051651811a0 = Uint8Array.from([84, 73, 76, 69, 95, 86, 73, 69, 87, 83, 67, 82, 0]);
let __static_C_AddDefaultDefinitions_predefined = cByteRecordNDArray({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, [124], {}, [cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_905d3ce3163cdb5ce09f, "val": i32(i64((BigInt(i64((BigInt(1n) << BigInt(16)))) + BigInt(1n))))}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_4c4f1974317a05daafc6, "val": i32(i64((BigInt(i64((BigInt(256n) << BigInt(16)))) + BigInt(64n))))}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_dbfa40db37c83c0be40e, "val": i32(1048576)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_31ab2085eb9be4da810b, "val": i32(16384)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_c57775dc8c20c07708ba, "val": i32(32768)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_97a5aaadb668d70b6ed1, "val": i32(16)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_510235c6d973f2a82794, "val": i32(81920)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_7b977d0ae7acd48889c4, "val": i32(98304)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_c6d0a70cb96daf65fcbf, "val": i32(1024)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_120383b5f037a6dc8d95, "val": i32(524288)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_a081af6e48fac911125b, "val": i32(131072)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_9bdabe8e35e7f4245047, "val": i32(2)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_acdc582b19fd7731ddaf, "val": i32(1)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_77e133911d84c1db16e6, "val": i32(2097152)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_83551c318c8081269e16, "val": i32(13)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_b3d9902c6a84fdbbc33f, "val": 16384}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_9b1adc0431743f4cd32e, "val": 4096}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_717c24f7a0e5fddab260, "val": 1024}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_6d24dd3427e1557b6e4e, "val": 30720}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_5022874a7bf663605df0, "val": 64}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_a296a86fff67456e5189, "val": 7}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_1f3dbec25567e66ca373, "val": i32(25)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_13e1095dc0efff7a4aa0, "val": i32(26)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_33b2b0a9955065a7625b, "val": i32(16)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_21df5110a17f37e6505f, "val": i32(15)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_12c22c02583aad33c34b, "val": i32(8)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_1c67300278128fd0c9e6, "val": i32(14)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_3c162e907765791c20e6, "val": i32(7)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_121206967729b74806a1, "val": i32(21)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_a0cfba233adfc256e929, "val": i32(28)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_8474f199a6a3668a2db5, "val": i32(22)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_7b56925f63fe807baf62, "val": i32(5)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_e1129bfdd1fb7d394749, "val": i32(24)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_e7d17ae0d97d5a019380, "val": i32(20)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_a6a20236cd1c4b47fa50, "val": i32(27)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_7ad4a5418f92e355988c, "val": i32(17)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_6ffe3132fdc50ac70162, "val": i32(4)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_8d2d10f20e89fcbd536e, "val": i32(1)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_24d5e43702a127a43f12, "val": i32(2)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_410dfbc8b63ef01fe7ca, "val": i32(3)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_d2e82aba97f2767cbd8d, "val": i32(13)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_ba6535a314f867a9f4ea, "val": i32(12)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_d9cc523017a58d44a10d, "val": i32(9)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_59e846d798532825aabe, "val": i32(10)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_9104902cd6569acb1c4d, "val": i32(11)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_87aca8517b5d5081651a, "val": i32(29)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_9584aa8b183e0f8df1b2, "val": i32(6)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_52e11d204bf3e113417e, "val": i32(23)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_8b084989838285d02df1, "val": i32(0)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_78e6dde018aabec62005, "val": i32(18)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_30998aaf43a4117c5b8e, "val": i32(19)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_ddafe8d11a426eddcf62, "val": i32(1048576)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_3229a5e8b334b3ba93d0, "val": i32(131072)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_dd4c6b158624471b48e0, "val": i32(1024)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_3b71c10bda9e3b20b2c5, "val": i32(8)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_8b8b8bd36dcdb4526540, "val": i32(128)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_041b0fdf42382f5e1f32, "val": i32(4)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_0c98c469c4bdda718e92, "val": i32(512)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_ff4715a61a52da53eda3, "val": i32(16384)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_60d3ddd221c867ac5ce0, "val": i32(262144)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_decb5d65d8efa68e3e01, "val": i32(16777216)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_e7a0c9e39bb2a4b8ac6d, "val": i32(1)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_1e523f9206ad997bfc92, "val": i32(16)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_85970b718a64a6dd45c4, "val": i32(2048)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_1f842bc22267bcba6912, "val": i32(4096)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_595c2c3293e3fe158181, "val": i32(2097152)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_8736f861ff342336f25b, "val": i32(65536)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_2b61aaa16f75af8fd325, "val": i32(8192)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_86e0c871c242265845e9, "val": i32(524288)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_4bde2ee0644869ac7dcb, "val": i32(2)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_dbc85fcb93bb0ce64ce4, "val": i32(32768)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_43d48bded9450f82e947, "val": i32(4194304)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_bff46a0024b9ef49b463, "val": i32(256)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_aa6d3cab2d8ac1267d9b, "val": i32(64)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_438fc7e3e5172ba7e1f5, "val": i32(32)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_8cf1297f7ac40ce00978, "val": i32(32)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_abf33baffa69bc9e3942, "val": i32(67108864)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_58e613289a70d875f589, "val": i32(8388608)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_a86dfbd0a05411255960, "val": i32(4194304)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_ffb3f9a0e4de80df6b08, "val": i32(2048)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_76791f7f57a25bb7a13e, "val": i32(1048576)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_b9cb99d23b46801cdae1, "val": i32(128)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_dd49ac678d71275d2ad0, "val": i32(256)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_c2bbb9eeb34eee324007, "val": i32(64)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_c3ddb72a54b2a134be61, "val": i32(4)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_5b26d2c32f75c853ff33, "val": i32(16384)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_8d4072250fd05bcb3c37, "val": i32(2097152)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_d17df9c1af7bbbd4dafc, "val": i32(2)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_2993c86fcc2f8680d16f, "val": i32(16777216)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_6ac4ba32eea0064f1dda, "val": i32(1)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_c4ba6fff6acf104d42dd, "val": i32(8192)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_41d7f000a6ed9a8ce0d8, "val": i32(512)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_ff260e6a7c4164969f47, "val": i32(33554432)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_da4eef625709b3e8e6c9, "val": i32(134217728)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_9e6a8205b42bb051d455, "val": i32(268435456)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_aaf52f95e5dba3f62c49, "val": 8}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_53af52f86a10697f1245, "val": 1}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_9c5f9184604cdcfedaac, "val": 0}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_81440d663a21c5831e39, "val": 13}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_def9fea1f34a9e2e25b4, "val": 3}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_89a1c505410452b64624, "val": 12}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_e1ee573dea49580eaa38, "val": 11}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_fa0d6ca78f67237bfee6, "val": 14}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_4c5c24a0b1e387a42c3d, "val": 7}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_c109f5a35903696f9384, "val": 5}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_caef54e9c2fedd44317a, "val": 10}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_62865e0bc39d5c6ad1c7, "val": 4}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_7d5edb4be6cc49f5c602, "val": 6}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_8ecd464061d0d1fcf715, "val": 9}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_e113e4c3810a04ef6039, "val": 2}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_507f0858f4a3650aea37, "val": i32(9)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_fc160906ee93598d1ea4, "val": i32(8)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_8fe6f03eb51b6566ea09, "val": i32(4)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_6841acc4e31aebee33b0, "val": i32(1)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_3b836681c192d68abd58, "val": i32(0)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_32077d398baaac9c887c, "val": i32(7)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_162d0f0dba71d1f1a629, "val": i32(2)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_3245e19bc8c98615afeb, "val": i32(11)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_844d8741ee8c69e6ff6c, "val": i32(10)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_b4cb2655e4189487507c, "val": i32(3)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_def945c35529e7b25563, "val": i32(5)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_0ac1b720b212deb2e601, "val": i32(6)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_3835a917dc43bb482566, "val": i32((30720 - 4))}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"token": {"offset": 0, "pointer": true, "size": 8}, "val": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"token": __cxx_literal_9861edb5f051651811a0, "val": i32((30720 - 5))}, null, {})]);
const __cxx_literal_f45cc98a67195e2a2ec5 = Uint8Array.from([78, 79, 0]);
export function C_AddDefaultDefinitions() {
  for (let i = i32(0); (i < i32(164)); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; }))) {
    C_AddDefinition((cPointerElementRef(EventNames, i).value), i, i32((i32(8) | i32(16))));
  }

  {
    const __cxx_range_array_0 = __static_C_AddDefaultDefinitions_predefined;
    if (__cxx_range_array_0.length !== 124) throw new RangeError("C array extent mismatch");
    for (let __cxx_range_index_0 = 0; __cxx_range_index_0 < 124; ++__cxx_range_index_0) {
      C_AddDefinition(__cxx_range_array_0[__cxx_range_index_0].token, __cxx_range_array_0[__cxx_range_index_0].val, i32(8));
    }
  }
  C_AddDefinition(__cxx_literal_f45cc98a67195e2a2ec5, 0, i32((i32((i32((i32(8) | i32(1))) | i32(4))) | i32(32))));
}

// C/C++ source: source/duke3d/src/gamedef.cpp:6551
export function C_InitProjectiles() {
  let Projectile = cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"bounces": {"native": "Int16Array", "offset": 38, "size": 2}, "bsound": {"native": "Int16Array", "offset": 40, "size": 2}, "clipdist": {"native": "Uint8Array", "offset": 57, "size": 1}, "cstat": {"native": "Int32Array", "offset": 4, "size": 4}, "decal": {"native": "Int16Array", "offset": 28, "size": 2}, "drop": {"native": "Int16Array", "offset": 34, "size": 2}, "extra": {"native": "Int16Array", "offset": 44, "size": 2}, "extra_rand": {"native": "Int16Array", "offset": 46, "size": 2}, "filler": {"length": 2, "native": "Int8Array", "offset": 58, "size": 2}, "flashcolor": {"native": "Int32Array", "offset": 16, "size": 4}, "hitradius": {"native": "Int32Array", "offset": 8, "size": 4}, "isound": {"native": "Int16Array", "offset": 24, "size": 2}, "movecnt": {"native": "Int8Array", "offset": 56, "size": 1}, "offset": {"native": "Int16Array", "offset": 36, "size": 2}, "pal": {"native": "Int8Array", "offset": 55, "size": 1}, "range": {"native": "Int32Array", "offset": 12, "size": 4}, "shade": {"native": "Int8Array", "offset": 52, "size": 1}, "sound": {"native": "Int16Array", "offset": 22, "size": 2}, "spawns": {"native": "Int16Array", "offset": 20, "size": 2}, "sxrepeat": {"native": "Int8Array", "offset": 48, "size": 1}, "syrepeat": {"native": "Int8Array", "offset": 49, "size": 1}, "tnum": {"native": "Int16Array", "offset": 32, "size": 2}, "toffset": {"native": "Int16Array", "offset": 42, "size": 2}, "trail": {"native": "Int16Array", "offset": 30, "size": 2}, "txrepeat": {"native": "Int8Array", "offset": 50, "size": 1}, "tyrepeat": {"native": "Int8Array", "offset": 51, "size": 1}, "userdata": {"native": "Int32Array", "offset": 60, "size": 4}, "vel": {"native": "Int16Array", "offset": 26, "size": 2}, "workslike": {"native": "Int32Array", "offset": 0, "size": 4}, "xrepeat": {"native": "Int8Array", "offset": 53, "size": 1}, "yrepeat": {"native": "Int8Array", "offset": 54, "size": 1}}, "overlaps": false, "size": 64, "union": false}, {"workslike": 1, "cstat": (-1), "hitradius": 2048, "range": 0, "flashcolor": 0, "spawns": ((u32(__cxx_global_cell_3e77304d50ec83937ff1f45c().value) << 16) >> 16), "sound": ((u32((-1)) << 16) >> 16), "isound": ((u32((-1)) << 16) >> 16), "vel": ((u32(600) << 16) >> 16), "decal": ((u32(__cxx_global_cell_5a1318d87ddacc87fafe95fb().value) << 16) >> 16), "trail": ((u32((-1)) << 16) >> 16), "tnum": ((u32(0) << 16) >> 16), "drop": ((u32(0) << 16) >> 16), "offset": ((u32(448) << 16) >> 16), "bounces": ((u32(((u32(__cxx_global_cell_3b9a6643b5a8adfdd16c2c0e().value) << 16) >> 16)) << 16) >> 16), "bsound": ((u32(__cxx_global_cell_339d184e498655528e0449ea().value) << 16) >> 16), "toffset": ((u32(1) << 16) >> 16), "extra": ((u32(100) << 16) >> 16), "extra_rand": ((u32((-1)) << 16) >> 16), "sxrepeat": ((u32((-1)) << 24) >> 24), "syrepeat": ((u32((-1)) << 24) >> 24), "txrepeat": ((u32((-1)) << 24) >> 24), "tyrepeat": ((u32((-1)) << 24) >> 24), "shade": ((u32((-96)) << 24) >> 24), "xrepeat": ((u32(18) << 24) >> 24), "yrepeat": ((u32(18) << 24) >> 24), "pal": ((u32(0) << 24) >> 24), "movecnt": ((u32(1) << 24) >> 24), "clipdist": (u32(32) & 255), "filler": new Int8Array([((u32(0) << 24) >> 24), ((u32(0) << 24) >> 24)]), "userdata": 0}, null, {});
  cAssignAggregate(__cxx_global_cell_14b7a7066c3f6d3c98286359().value, Projectile, {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"bounces": {"native": "Int16Array", "offset": 38, "size": 2}, "bsound": {"native": "Int16Array", "offset": 40, "size": 2}, "clipdist": {"native": "Uint8Array", "offset": 57, "size": 1}, "cstat": {"native": "Int32Array", "offset": 4, "size": 4}, "decal": {"native": "Int16Array", "offset": 28, "size": 2}, "drop": {"native": "Int16Array", "offset": 34, "size": 2}, "extra": {"native": "Int16Array", "offset": 44, "size": 2}, "extra_rand": {"native": "Int16Array", "offset": 46, "size": 2}, "filler": {"length": 2, "native": "Int8Array", "offset": 58, "size": 2}, "flashcolor": {"native": "Int32Array", "offset": 16, "size": 4}, "hitradius": {"native": "Int32Array", "offset": 8, "size": 4}, "isound": {"native": "Int16Array", "offset": 24, "size": 2}, "movecnt": {"native": "Int8Array", "offset": 56, "size": 1}, "offset": {"native": "Int16Array", "offset": 36, "size": 2}, "pal": {"native": "Int8Array", "offset": 55, "size": 1}, "range": {"native": "Int32Array", "offset": 12, "size": 4}, "shade": {"native": "Int8Array", "offset": 52, "size": 1}, "sound": {"native": "Int16Array", "offset": 22, "size": 2}, "spawns": {"native": "Int16Array", "offset": 20, "size": 2}, "sxrepeat": {"native": "Int8Array", "offset": 48, "size": 1}, "syrepeat": {"native": "Int8Array", "offset": 49, "size": 1}, "tnum": {"native": "Int16Array", "offset": 32, "size": 2}, "toffset": {"native": "Int16Array", "offset": 42, "size": 2}, "trail": {"native": "Int16Array", "offset": 30, "size": 2}, "txrepeat": {"native": "Int8Array", "offset": 50, "size": 1}, "tyrepeat": {"native": "Int8Array", "offset": 51, "size": 1}, "userdata": {"native": "Int32Array", "offset": 60, "size": 4}, "vel": {"native": "Int16Array", "offset": 26, "size": 2}, "workslike": {"native": "Int32Array", "offset": 0, "size": 4}, "xrepeat": {"native": "Int8Array", "offset": 53, "size": 1}, "yrepeat": {"native": "Int8Array", "offset": 54, "size": 1}}, "overlaps": false, "size": 64, "union": false}}, {"abi": "source-clang-trivial-record-assignment/1", "assignment_mode": "copyAssign", "clang_assignment_signature": "projectile_t &(const projectile_t &) noexcept", "clang_method_id": "0x1501c6c5670", "native_layout": {"abi": "source-record-field-storage/1", "sha256": "2b339c50f2282935dc0264eae8578de007a05e9c52900f1fb8a451d551e451bf"}, "record_name": "projectile_t", "source_record": "projectile_t"});
  {
    const __cxx_range_array_0 = g_tile;
    if (__cxx_range_array_0.length !== 30720) throw new RangeError("C array extent mismatch");
    for (let __cxx_range_index_0 = 0; __cxx_range_index_0 < 30720; ++__cxx_range_index_0) {
      if (__cxx_range_array_0[__cxx_range_index_0].proj) {
        cAssignAggregate(cRecordObject(cRecordPointer(__cxx_range_array_0[__cxx_range_index_0].proj, {"align": 4, "arrayAlign": 1, "fields": {"bounces": {"native": "Int16Array", "offset": 38, "size": 2}, "bsound": {"native": "Int16Array", "offset": 40, "size": 2}, "clipdist": {"native": "Uint8Array", "offset": 57, "size": 1}, "cstat": {"native": "Int32Array", "offset": 4, "size": 4}, "decal": {"native": "Int16Array", "offset": 28, "size": 2}, "drop": {"native": "Int16Array", "offset": 34, "size": 2}, "extra": {"native": "Int16Array", "offset": 44, "size": 2}, "extra_rand": {"native": "Int16Array", "offset": 46, "size": 2}, "filler": {"length": 2, "native": "Int8Array", "offset": 58, "size": 2}, "flashcolor": {"native": "Int32Array", "offset": 16, "size": 4}, "hitradius": {"native": "Int32Array", "offset": 8, "size": 4}, "isound": {"native": "Int16Array", "offset": 24, "size": 2}, "movecnt": {"native": "Int8Array", "offset": 56, "size": 1}, "offset": {"native": "Int16Array", "offset": 36, "size": 2}, "pal": {"native": "Int8Array", "offset": 55, "size": 1}, "range": {"native": "Int32Array", "offset": 12, "size": 4}, "shade": {"native": "Int8Array", "offset": 52, "size": 1}, "sound": {"native": "Int16Array", "offset": 22, "size": 2}, "spawns": {"native": "Int16Array", "offset": 20, "size": 2}, "sxrepeat": {"native": "Int8Array", "offset": 48, "size": 1}, "syrepeat": {"native": "Int8Array", "offset": 49, "size": 1}, "tnum": {"native": "Int16Array", "offset": 32, "size": 2}, "toffset": {"native": "Int16Array", "offset": 42, "size": 2}, "trail": {"native": "Int16Array", "offset": 30, "size": 2}, "txrepeat": {"native": "Int8Array", "offset": 50, "size": 1}, "tyrepeat": {"native": "Int8Array", "offset": 51, "size": 1}, "userdata": {"native": "Int32Array", "offset": 60, "size": 4}, "vel": {"native": "Int16Array", "offset": 26, "size": 2}, "workslike": {"native": "Int32Array", "offset": 0, "size": 4}, "xrepeat": {"native": "Int8Array", "offset": 53, "size": 1}, "yrepeat": {"native": "Int8Array", "offset": 54, "size": 1}}, "overlaps": false, "size": 64, "union": false}, {})), __cxx_global_cell_14b7a7066c3f6d3c98286359().value, {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"bounces": {"native": "Int16Array", "offset": 38, "size": 2}, "bsound": {"native": "Int16Array", "offset": 40, "size": 2}, "clipdist": {"native": "Uint8Array", "offset": 57, "size": 1}, "cstat": {"native": "Int32Array", "offset": 4, "size": 4}, "decal": {"native": "Int16Array", "offset": 28, "size": 2}, "drop": {"native": "Int16Array", "offset": 34, "size": 2}, "extra": {"native": "Int16Array", "offset": 44, "size": 2}, "extra_rand": {"native": "Int16Array", "offset": 46, "size": 2}, "filler": {"length": 2, "native": "Int8Array", "offset": 58, "size": 2}, "flashcolor": {"native": "Int32Array", "offset": 16, "size": 4}, "hitradius": {"native": "Int32Array", "offset": 8, "size": 4}, "isound": {"native": "Int16Array", "offset": 24, "size": 2}, "movecnt": {"native": "Int8Array", "offset": 56, "size": 1}, "offset": {"native": "Int16Array", "offset": 36, "size": 2}, "pal": {"native": "Int8Array", "offset": 55, "size": 1}, "range": {"native": "Int32Array", "offset": 12, "size": 4}, "shade": {"native": "Int8Array", "offset": 52, "size": 1}, "sound": {"native": "Int16Array", "offset": 22, "size": 2}, "spawns": {"native": "Int16Array", "offset": 20, "size": 2}, "sxrepeat": {"native": "Int8Array", "offset": 48, "size": 1}, "syrepeat": {"native": "Int8Array", "offset": 49, "size": 1}, "tnum": {"native": "Int16Array", "offset": 32, "size": 2}, "toffset": {"native": "Int16Array", "offset": 42, "size": 2}, "trail": {"native": "Int16Array", "offset": 30, "size": 2}, "txrepeat": {"native": "Int8Array", "offset": 50, "size": 1}, "tyrepeat": {"native": "Int8Array", "offset": 51, "size": 1}, "userdata": {"native": "Int32Array", "offset": 60, "size": 4}, "vel": {"native": "Int16Array", "offset": 26, "size": 2}, "workslike": {"native": "Int32Array", "offset": 0, "size": 4}, "xrepeat": {"native": "Int8Array", "offset": 53, "size": 1}, "yrepeat": {"native": "Int8Array", "offset": 54, "size": 1}}, "overlaps": false, "size": 64, "union": false}}, {"abi": "source-clang-trivial-record-assignment/1", "assignment_mode": "copyAssign", "clang_assignment_signature": "projectile_t &(const projectile_t &) noexcept", "clang_method_id": "0x1501c6c5670", "native_layout": {"abi": "source-record-field-storage/1", "sha256": "2b339c50f2282935dc0264eae8578de007a05e9c52900f1fb8a451d551e451bf"}, "record_name": "projectile_t", "source_record": "projectile_t"});
      }
      if (__cxx_range_array_0[__cxx_range_index_0].defproj) {
        cAssignAggregate(cRecordObject(cRecordPointer(__cxx_range_array_0[__cxx_range_index_0].defproj, {"align": 4, "arrayAlign": 1, "fields": {"bounces": {"native": "Int16Array", "offset": 38, "size": 2}, "bsound": {"native": "Int16Array", "offset": 40, "size": 2}, "clipdist": {"native": "Uint8Array", "offset": 57, "size": 1}, "cstat": {"native": "Int32Array", "offset": 4, "size": 4}, "decal": {"native": "Int16Array", "offset": 28, "size": 2}, "drop": {"native": "Int16Array", "offset": 34, "size": 2}, "extra": {"native": "Int16Array", "offset": 44, "size": 2}, "extra_rand": {"native": "Int16Array", "offset": 46, "size": 2}, "filler": {"length": 2, "native": "Int8Array", "offset": 58, "size": 2}, "flashcolor": {"native": "Int32Array", "offset": 16, "size": 4}, "hitradius": {"native": "Int32Array", "offset": 8, "size": 4}, "isound": {"native": "Int16Array", "offset": 24, "size": 2}, "movecnt": {"native": "Int8Array", "offset": 56, "size": 1}, "offset": {"native": "Int16Array", "offset": 36, "size": 2}, "pal": {"native": "Int8Array", "offset": 55, "size": 1}, "range": {"native": "Int32Array", "offset": 12, "size": 4}, "shade": {"native": "Int8Array", "offset": 52, "size": 1}, "sound": {"native": "Int16Array", "offset": 22, "size": 2}, "spawns": {"native": "Int16Array", "offset": 20, "size": 2}, "sxrepeat": {"native": "Int8Array", "offset": 48, "size": 1}, "syrepeat": {"native": "Int8Array", "offset": 49, "size": 1}, "tnum": {"native": "Int16Array", "offset": 32, "size": 2}, "toffset": {"native": "Int16Array", "offset": 42, "size": 2}, "trail": {"native": "Int16Array", "offset": 30, "size": 2}, "txrepeat": {"native": "Int8Array", "offset": 50, "size": 1}, "tyrepeat": {"native": "Int8Array", "offset": 51, "size": 1}, "userdata": {"native": "Int32Array", "offset": 60, "size": 4}, "vel": {"native": "Int16Array", "offset": 26, "size": 2}, "workslike": {"native": "Int32Array", "offset": 0, "size": 4}, "xrepeat": {"native": "Int8Array", "offset": 53, "size": 1}, "yrepeat": {"native": "Int8Array", "offset": 54, "size": 1}}, "overlaps": false, "size": 64, "union": false}, {})), __cxx_global_cell_14b7a7066c3f6d3c98286359().value, {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"bounces": {"native": "Int16Array", "offset": 38, "size": 2}, "bsound": {"native": "Int16Array", "offset": 40, "size": 2}, "clipdist": {"native": "Uint8Array", "offset": 57, "size": 1}, "cstat": {"native": "Int32Array", "offset": 4, "size": 4}, "decal": {"native": "Int16Array", "offset": 28, "size": 2}, "drop": {"native": "Int16Array", "offset": 34, "size": 2}, "extra": {"native": "Int16Array", "offset": 44, "size": 2}, "extra_rand": {"native": "Int16Array", "offset": 46, "size": 2}, "filler": {"length": 2, "native": "Int8Array", "offset": 58, "size": 2}, "flashcolor": {"native": "Int32Array", "offset": 16, "size": 4}, "hitradius": {"native": "Int32Array", "offset": 8, "size": 4}, "isound": {"native": "Int16Array", "offset": 24, "size": 2}, "movecnt": {"native": "Int8Array", "offset": 56, "size": 1}, "offset": {"native": "Int16Array", "offset": 36, "size": 2}, "pal": {"native": "Int8Array", "offset": 55, "size": 1}, "range": {"native": "Int32Array", "offset": 12, "size": 4}, "shade": {"native": "Int8Array", "offset": 52, "size": 1}, "sound": {"native": "Int16Array", "offset": 22, "size": 2}, "spawns": {"native": "Int16Array", "offset": 20, "size": 2}, "sxrepeat": {"native": "Int8Array", "offset": 48, "size": 1}, "syrepeat": {"native": "Int8Array", "offset": 49, "size": 1}, "tnum": {"native": "Int16Array", "offset": 32, "size": 2}, "toffset": {"native": "Int16Array", "offset": 42, "size": 2}, "trail": {"native": "Int16Array", "offset": 30, "size": 2}, "txrepeat": {"native": "Int8Array", "offset": 50, "size": 1}, "tyrepeat": {"native": "Int8Array", "offset": 51, "size": 1}, "userdata": {"native": "Int32Array", "offset": 60, "size": 4}, "vel": {"native": "Int16Array", "offset": 26, "size": 2}, "workslike": {"native": "Int32Array", "offset": 0, "size": 4}, "xrepeat": {"native": "Int8Array", "offset": 53, "size": 1}, "yrepeat": {"native": "Int8Array", "offset": 54, "size": 1}}, "overlaps": false, "size": 64, "union": false}}, {"abi": "source-clang-trivial-record-assignment/1", "assignment_mode": "copyAssign", "clang_assignment_signature": "projectile_t &(const projectile_t &) noexcept", "clang_method_id": "0x1501c6c5670", "native_layout": {"abi": "source-record-field-storage/1", "sha256": "2b339c50f2282935dc0264eae8578de007a05e9c52900f1fb8a451d551e451bf"}, "record_name": "projectile_t", "source_record": "projectile_t"});
      }
    }
  }
}

// C/C++ source: source/duke3d/src/gamedef.cpp:6584
const __cxx_literal_83fd5fe805b1155e698b = Uint8Array.from([44, 32, 118, 48, 46, 57, 57, 32, 99, 111, 109, 112, 97, 116, 105, 98, 105, 108, 105, 116, 121, 32, 109, 111, 100, 101, 0]);
const __cxx_literal_be596868e3d2dc28bc1f = Uint8Array.from([44, 32, 118, 49, 46, 48, 32, 99, 111, 109, 112, 97, 116, 105, 98, 105, 108, 105, 116, 121, 32, 109, 111, 100, 101, 0]);
const __cxx_literal_36da7c29fd7406e3ac68 = Uint8Array.from([44, 32, 118, 49, 46, 49, 32, 99, 111, 109, 112, 97, 116, 105, 98, 105, 108, 105, 116, 121, 32, 109, 111, 100, 101, 0]);
const __cxx_literal_992b103f112a7bee4ec3 = Uint8Array.from([44, 32, 118, 49, 46, 51, 68, 32, 99, 111, 109, 112, 97, 116, 105, 98, 105, 108, 105, 116, 121, 32, 109, 111, 100, 101, 0]);
const __cxx_literal_cd6424b0fc30bdca4a29 = Uint8Array.from([0]);
export function C_ScriptVersionString(version) {
  switch (version) {
    case 9: {
      return __cxx_literal_83fd5fe805b1155e698b;
    }
    case 10: {
      return __cxx_literal_be596868e3d2dc28bc1f;
    }
    case 11: {
      return __cxx_literal_36da7c29fd7406e3ac68;
    }
    case 13: {
      return __cxx_literal_992b103f112a7bee4ec3;
    }
  }
  return __cxx_literal_cd6424b0fc30bdca4a29;
}

// C/C++ source: source/duke3d/src/gamedef.cpp:6604
const __cxx_literal_207c592ac3d3108a0889 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 100, 101, 102, 46, 99, 112, 112, 0]);
const __cxx_literal_78fe4ccbfdab2d51e0a6 = Uint8Array.from([37, 100, 47, 37, 100, 32, 108, 97, 98, 101, 108, 115, 44, 32, 37, 100, 47, 37, 100, 32, 118, 97, 114, 105, 97, 98, 108, 101, 115, 44, 32, 37, 100, 47, 37, 100, 32, 97, 114, 114, 97, 121, 115, 0]);
const __cxx_literal_5acdb5a343fa269d4632 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 100, 101, 102, 46, 99, 112, 112, 0]);
const __cxx_literal_a60bb5f148a19cc8b970 = Uint8Array.from([37, 100, 32, 115, 116, 114, 105, 110, 103, 115, 44, 32, 37, 100, 32, 101, 118, 101, 110, 116, 115, 44, 32, 37, 100, 32, 97, 99, 116, 111, 114, 115, 0]);
export function C_PrintStats() {
  ((i32(10) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(10), __cxx_literal_207c592ac3d3108a0889, u32(6607), __cxx_literal_78fe4ccbfdab2d51e0a6, __cxx_global_cell_6742302ef915e025d82bcd36().value, 16384, __cxx_global_cell_8406f8e86b0ce3102350571c().value, 2048, __cxx_global_cell_312b58e8a14f852e3cc5e7e0().value, i32((2048 >> 2))));
  let cnt = i32(__cxx_global_cell_5cd4a87da022e338050a0e30().value);
  let cnt2 = i32(0);
  let cnt3 = i32(0);
  {
    const __cxx_range_array_0 = apStrings;
    if (__cxx_range_array_0.length !== 16384) throw new RangeError("C array extent mismatch");
    if (!__cxx_range_array_0[Symbol.for("source-first.clang-pointer-array/1")]) throw new TypeError("C pointer array storage ABI missing");
    for (let __cxx_range_index_0 = 0; __cxx_range_index_0 < 16384; ++__cxx_range_index_0) {
      if (__cxx_range_array_0[__cxx_range_index_0]) {
        ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => cnt, __cxx_lvalue_1 => { cnt = __cxx_lvalue_1; }));
      }
    }
  }
  for (const apScriptEvent of apScriptEvents) {
    if (Boolean(apScriptEvent.value)) {
      ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i32((previous + 1)); __cxx_lvalue_2.value = next; return previous; })(cRef(() => cnt2, __cxx_lvalue_3 => { cnt2 = __cxx_lvalue_3; }));
    }
  }
  {
    const __cxx_range_array_1 = g_tile;
    if (__cxx_range_array_1.length !== 30720) throw new RangeError("C array extent mismatch");
    for (let __cxx_range_index_1 = 0; __cxx_range_index_1 < 30720; ++__cxx_range_index_1) {
      if (__cxx_range_array_1[__cxx_range_index_1].execPtr) {
        ((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = i32((previous + 1)); __cxx_lvalue_4.value = next; return previous; })(cRef(() => cnt3, __cxx_lvalue_5 => { cnt3 = __cxx_lvalue_5; }));
      }
    }
  }
  ((i32(10) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(10), __cxx_literal_5acdb5a343fa269d4632, u32(6623), __cxx_literal_a60bb5f148a19cc8b970, cnt, cnt2, cnt3));
}

// C/C++ source: source/duke3d/src/gamedef.cpp:6627
export function scriptInitTables() {
  {
    const __cxx_range_array_0 = tables;
    if (__cxx_range_array_0.length !== 5) throw new RangeError("C array extent mismatch");
    if (!__cxx_range_array_0[Symbol.for("source-first.clang-pointer-array/1")]) throw new TypeError("C pointer array storage ABI missing");
    for (let __cxx_range_index_0 = 0; __cxx_range_index_0 < 5; ++__cxx_range_index_0) {
      let table = __cxx_range_array_0[__cxx_range_index_0];
      hash_init(table);
    }
  }
  {
    const __cxx_range_array_1 = inttables;
    if (__cxx_range_array_1.length !== 4) throw new RangeError("C array extent mismatch");
    if (!__cxx_range_array_1[Symbol.for("source-first.clang-pointer-array/1")]) throw new TypeError("C pointer array storage ABI missing");
    for (let __cxx_range_index_1 = 0; __cxx_range_index_1 < 4; ++__cxx_range_index_1) {
      let table = __cxx_range_array_1[__cxx_range_index_1];
      inthash_init(table);
    }
  }
  {
    const __cxx_range_array_2 = vm_keywords;
    if (__cxx_range_array_2.length !== 516) throw new RangeError("C array extent mismatch");
    for (let __cxx_range_index_2 = 0; __cxx_range_index_2 < 516; ++__cxx_range_index_2) {
      hash_add(__cxx_private_cell_d49b43ec9df2e70e05088d24().value, __cxx_range_array_2[__cxx_range_index_2].token, i64(__cxx_range_array_2[__cxx_range_index_2].val), 0);
    }
  }
  {
    const __cxx_range_array_3 = iter_tokens;
    if (__cxx_range_array_3.length !== 16) throw new RangeError("C array extent mismatch");
    for (let __cxx_range_index_3 = 0; __cxx_range_index_3 < 16; ++__cxx_range_index_3) {
      hash_add(__cxx_private_cell_7d62d0a0be2f41b3d20f464b().value, __cxx_range_array_3[__cxx_range_index_3].token, i64(__cxx_range_array_3[__cxx_range_index_3].val), 0);
    }
  }
  {
    const __cxx_range_array_4 = varvartable;
    if (__cxx_range_array_4.length !== 31) throw new RangeError("C array extent mismatch");
    for (let __cxx_range_index_4 = 0; __cxx_range_index_4 < 31; ++__cxx_range_index_4) {
      inthash_add(__cxx_private_cell_2c502a82220a36abae3ae2b2().value, i64(__cxx_range_array_4[__cxx_range_index_4].x), i64(__cxx_range_array_4[__cxx_range_index_4].y), 0);
    }
  }
  {
    const __cxx_range_array_5 = globalvartable;
    if (__cxx_range_array_5.length !== 1) throw new RangeError("C array extent mismatch");
    for (let __cxx_range_index_5 = 0; __cxx_range_index_5 < 1; ++__cxx_range_index_5) {
      inthash_add(__cxx_private_cell_b56202585616aa9c65ec503a().value, i64(__cxx_range_array_5[__cxx_range_index_5].x), i64(__cxx_range_array_5[__cxx_range_index_5].y), 0);
    }
  }
  {
    const __cxx_range_array_6 = playervartable;
    if (__cxx_range_array_6.length !== 1) throw new RangeError("C array extent mismatch");
    for (let __cxx_range_index_6 = 0; __cxx_range_index_6 < 1; ++__cxx_range_index_6) {
      inthash_add(__cxx_private_cell_adb3542f30964081065bc3c4().value, i64(__cxx_range_array_6[__cxx_range_index_6].x), i64(__cxx_range_array_6[__cxx_range_index_6].y), 0);
    }
  }
  {
    const __cxx_range_array_7 = actorvartable;
    if (__cxx_range_array_7.length !== 1) throw new RangeError("C array extent mismatch");
    for (let __cxx_range_index_7 = 0; __cxx_range_index_7 < 1; ++__cxx_range_index_7) {
      inthash_add(__cxx_private_cell_6e818e10e7fcc27dc3dc3c5b().value, i64(__cxx_range_array_7[__cxx_range_index_7].x), i64(__cxx_range_array_7[__cxx_range_index_7].y), 0);
    }
  }
}

// C/C++ source: source/duke3d/src/gamedef.cpp:6654
export function C_GetLabelIndex(val, type) {
  for (let i = i32(0); (i < __cxx_global_cell_6742302ef915e025d82bcd36().value); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; }))) {
    if ((((cDeref(cPointerOffset(__cxx_global_cell_bb1aad227706ae6ec200fcf0().value, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) == val) && (i32((i32((cDeref(cPointerOffset(__cxx_global_cell_ca786e7ce472b03dc90a2ec6().value, i, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & type)) != 0))) {
      return i32(i);
    }
  }
  for (let i = i32(0); (i < __cxx_global_cell_6742302ef915e025d82bcd36().value); ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i32((previous + 1)); __cxx_lvalue_2.value = next; return previous; })(cRef(() => i, __cxx_lvalue_3 => { i = __cxx_lvalue_3; }))) {
    if (((cDeref(cPointerOffset(__cxx_global_cell_bb1aad227706ae6ec200fcf0().value, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) == val)) {
      return i32(i);
    }
  }
  return i32((-1));
}

// C/C++ source: source/duke3d/src/gamedef.cpp:6915
const __cxx_literal_f3c18bf7c12604b182df = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 100, 101, 102, 46, 99, 112, 112, 0]);
const __cxx_literal_da9808495cc1bf593375 = Uint8Array.from([37, 115, 58, 32, 73, 110, 32, 37, 115, 32, 39, 37, 115, 39, 58, 0]);
const __cxx_literal_24df5db94646c2c19beb = Uint8Array.from([101, 118, 101, 110, 116, 0]);
const __cxx_literal_7c026401dca8ee0f570c = Uint8Array.from([97, 99, 116, 111, 114, 0]);
const __cxx_literal_287357609a711c1162a5 = Uint8Array.from([115, 116, 97, 116, 101, 0]);
const __cxx_literal_29c68cbd3d55d55be99e = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 100, 101, 102, 46, 99, 112, 112, 0]);
const __cxx_literal_946e2deb3cd166724f5e = Uint8Array.from([37, 115, 58, 32, 65, 116, 32, 116, 111, 112, 32, 108, 101, 118, 101, 108, 58, 0]);
const __cxx_literal_c9a9d96eb4515ba0d242 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 100, 101, 102, 46, 99, 112, 112, 0]);
const __cxx_literal_32f0ba4c4bd3d67b81ec = Uint8Array.from([37, 115, 58, 37, 100, 58, 32, 39, 37, 115, 39, 32, 110, 111, 116, 32, 97, 116, 32, 116, 111, 112, 32, 108, 101, 118, 101, 108, 32, 119, 105, 116, 104, 105, 110, 32, 115, 99, 114, 105, 112, 116, 46, 0]);
const __cxx_literal_71c6ded1fc11c44fc543 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 100, 101, 102, 46, 99, 112, 112, 0]);
const __cxx_literal_d47a5a6b445bf6c1a5bc = Uint8Array.from([37, 115, 58, 37, 100, 58, 32, 107, 101, 121, 119, 111, 114, 100, 32, 39, 37, 115, 39, 32, 111, 110, 108, 121, 32, 97, 118, 97, 105, 108, 97, 98, 108, 101, 32, 100, 117, 114, 105, 110, 103, 32, 101, 118, 101, 110, 116, 115, 46, 0]);
const __cxx_literal_25fcbdb56204a029e7ca = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 100, 101, 102, 46, 99, 112, 112, 0]);
const __cxx_literal_911c3a3aac1242d220c4 = Uint8Array.from([37, 115, 58, 37, 100, 58, 32, 39, 37, 115, 39, 32, 118, 97, 108, 117, 101, 32, 101, 120, 99, 101, 101, 100, 115, 32, 77, 65, 88, 84, 73, 76, 69, 83, 46, 32, 32, 77, 97, 120, 105, 109, 117, 109, 32, 105, 115, 32, 37, 100, 46, 0]);
const __cxx_literal_82c7874d981359696eb9 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 100, 101, 102, 46, 99, 112, 112, 0]);
const __cxx_literal_984daa2fa699e69b1bc8 = Uint8Array.from([37, 115, 58, 37, 100, 58, 32, 101, 120, 112, 101, 99, 116, 101, 100, 32, 97, 32, 107, 101, 121, 119, 111, 114, 100, 32, 98, 117, 116, 32, 102, 111, 117, 110, 100, 32, 39, 37, 115, 39, 46, 0]);
const __cxx_literal_550634c405a486546331 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 100, 101, 102, 46, 99, 112, 112, 0]);
const __cxx_literal_c8eee76288cccea6597d = Uint8Array.from([37, 115, 58, 37, 100, 58, 32, 102, 111, 117, 110, 100, 32, 39, 37, 115, 39, 32, 119, 105, 116, 104, 105, 110, 32, 37, 115, 46, 0]);
const __cxx_literal_798838ba8e3aa2895645 = Uint8Array.from([97, 110, 32, 101, 118, 101, 110, 116, 0]);
const __cxx_literal_a6bdeb1d9640c08149a9 = Uint8Array.from([97, 110, 32, 97, 99, 116, 111, 114, 0]);
const __cxx_literal_ffdbbd104bb0fdc21727 = Uint8Array.from([97, 32, 115, 116, 97, 116, 101, 0]);
const __cxx_literal_6612e611a102928dd0e0 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 100, 101, 102, 46, 99, 112, 112, 0]);
const __cxx_literal_7a2dbbdcdcf80cf69b83 = Uint8Array.from([37, 115, 58, 37, 100, 58, 32, 115, 121, 109, 98, 111, 108, 32, 39, 37, 115, 39, 32, 105, 115, 32, 97, 32, 107, 101, 121, 119, 111, 114, 100, 46, 0]);
const __cxx_literal_b419a854de4e4352f0a0 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 100, 101, 102, 46, 99, 112, 112, 0]);
const __cxx_literal_fa4543bb13d0d9919ab2 = Uint8Array.from([37, 115, 58, 37, 100, 58, 32, 100, 105, 100, 32, 110, 111, 116, 32, 102, 105, 110, 100, 32, 39, 101, 110, 100, 115, 119, 105, 116, 99, 104, 39, 32, 98, 101, 102, 111, 114, 101, 32, 39, 37, 115, 39, 46, 0]);
const __cxx_literal_ef316aebdc574b0c61f6 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 100, 101, 102, 46, 99, 112, 112, 0]);
const __cxx_literal_24ac96701e20e9ffbba4 = Uint8Array.from([37, 115, 58, 37, 100, 58, 32, 115, 121, 109, 98, 111, 108, 32, 39, 37, 115, 39, 32, 105, 115, 32, 110, 111, 116, 32, 97, 32, 100, 101, 102, 105, 110, 105, 116, 105, 111, 110, 46, 0]);
const __cxx_literal_2337288e527a7abaf6f4 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 100, 101, 102, 46, 99, 112, 112, 0]);
const __cxx_literal_a26c2e56372e250170ea = Uint8Array.from([37, 115, 58, 37, 100, 58, 32, 115, 121, 109, 98, 111, 108, 32, 39, 37, 115, 39, 32, 105, 115, 32, 110, 111, 116, 32, 97, 32, 118, 97, 114, 105, 97, 98, 108, 101, 46, 0]);
const __cxx_literal_57e1a29eb7ff69ff2f7e = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 100, 101, 102, 46, 99, 112, 112, 0]);
const __cxx_literal_e6acdb66c7b3f9c45076 = Uint8Array.from([37, 115, 58, 37, 100, 58, 32, 115, 121, 109, 98, 111, 108, 32, 39, 37, 115, 39, 32, 105, 115, 32, 110, 111, 116, 32, 97, 110, 32, 97, 114, 114, 97, 121, 46, 0]);
const __cxx_literal_491f2801fa58f4ccb37c = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 100, 101, 102, 46, 99, 112, 112, 0]);
const __cxx_literal_3b7ff396fdd4dc9367b1 = Uint8Array.from([37, 115, 58, 37, 100, 58, 32, 109, 97, 108, 102, 111, 114, 109, 101, 100, 32, 97, 114, 114, 97, 121, 32, 105, 110, 100, 101, 120, 58, 32, 101, 120, 112, 101, 99, 116, 101, 100, 32, 93, 44, 32, 102, 111, 117, 110, 100, 32, 39, 37, 99, 39, 46, 0]);
const __cxx_literal_32da721e369487d952d1 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 100, 101, 102, 46, 99, 112, 112, 0]);
const __cxx_literal_fbce0767315fb015c28f = Uint8Array.from([37, 115, 58, 37, 100, 58, 32, 109, 97, 108, 102, 111, 114, 109, 101, 100, 32, 97, 114, 114, 97, 121, 32, 105, 110, 100, 101, 120, 58, 32, 101, 120, 112, 101, 99, 116, 101, 100, 32, 91, 44, 32, 102, 111, 117, 110, 100, 32, 39, 37, 99, 39, 46, 0]);
const __cxx_literal_49a82a5529577f446c39 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 100, 101, 102, 46, 99, 112, 112, 0]);
const __cxx_literal_512f2227b0889843debf = Uint8Array.from([37, 115, 58, 37, 100, 58, 32, 97, 114, 114, 97, 121, 115, 32, 99, 97, 110, 32, 111, 110, 108, 121, 32, 98, 101, 32, 119, 114, 105, 116, 116, 101, 110, 32, 116, 111, 32, 117, 115, 105, 110, 103, 32, 39, 115, 101, 116, 97, 114, 114, 97, 121, 39, 46, 0]);
const __cxx_literal_85138b62fefc0d3d611b = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 100, 101, 102, 46, 99, 112, 112, 0]);
const __cxx_literal_67a6004a999afe9fdeca = Uint8Array.from([37, 115, 58, 37, 100, 58, 32, 112, 97, 114, 97, 109, 101, 116, 101, 114, 32, 39, 37, 115, 39, 32, 105, 115, 32, 117, 110, 100, 101, 102, 105, 110, 101, 100, 46, 0]);
const __cxx_literal_9409f67a60f614464979 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 100, 101, 102, 46, 99, 112, 112, 0]);
const __cxx_literal_fb54ef0143617e1bbee4 = Uint8Array.from([37, 115, 58, 37, 100, 58, 32, 115, 121, 109, 98, 111, 108, 32, 39, 37, 115, 39, 32, 105, 115, 32, 110, 111, 116, 32, 97, 32, 118, 97, 108, 105, 100, 32, 115, 116, 114, 117, 99, 116, 117, 114, 101, 32, 109, 101, 109, 98, 101, 114, 46, 0]);
const __cxx_literal_586c047f44661fd50d6d = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 100, 101, 102, 46, 99, 112, 112, 0]);
const __cxx_literal_50f70477552433451316 = Uint8Array.from([37, 115, 58, 37, 100, 58, 32, 115, 121, 110, 116, 97, 120, 32, 101, 114, 114, 111, 114, 46, 0]);
const __cxx_literal_a0b0e484f9e7daff7c37 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 100, 101, 102, 46, 99, 112, 112, 0]);
const __cxx_literal_86f59b62021157b02877 = Uint8Array.from([37, 115, 58, 37, 100, 58, 32, 118, 97, 114, 105, 97, 98, 108, 101, 32, 39, 37, 115, 39, 32, 105, 115, 32, 114, 101, 97, 100, 45, 111, 110, 108, 121, 46, 0]);
const __cxx_literal_97f85414b4736638e00f = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 100, 101, 102, 46, 99, 112, 112, 0]);
const __cxx_literal_70296c919fd54e0b368e = Uint8Array.from([37, 115, 58, 37, 100, 58, 32, 97, 114, 114, 97, 121, 32, 39, 37, 115, 39, 32, 105, 115, 32, 114, 101, 97, 100, 45, 111, 110, 108, 121, 46, 0]);
const __cxx_literal_284f7b8485b3989c9868 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 100, 101, 102, 46, 99, 112, 112, 0]);
const __cxx_literal_52779f10c5c9623140c2 = Uint8Array.from([37, 115, 58, 37, 100, 58, 32, 118, 97, 114, 105, 97, 98, 108, 101, 32, 39, 37, 115, 39, 32, 105, 115, 32, 111, 102, 32, 116, 104, 101, 32, 119, 114, 111, 110, 103, 32, 116, 121, 112, 101, 46, 0]);
const __cxx_literal_f721b74cea19f0e53313 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 100, 101, 102, 46, 99, 112, 112, 0]);
const __cxx_literal_37bf0996228500fc1dc8 = Uint8Array.from([37, 115, 58, 37, 100, 58, 32, 116, 111, 111, 32, 109, 97, 110, 121, 32, 108, 97, 98, 101, 108, 115, 32, 100, 101, 102, 105, 110, 101, 100, 33, 32, 77, 97, 120, 105, 109, 117, 109, 32, 105, 115, 32, 37, 100, 46, 0]);
const __cxx_literal_b3e5b5b7a1d284cf737e = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 100, 101, 102, 46, 99, 112, 112, 0]);
const __cxx_literal_8e8d7332e187b6e11310 = Uint8Array.from([37, 115, 58, 37, 100, 58, 32, 118, 97, 114, 105, 97, 98, 108, 101, 32, 39, 37, 115, 39, 32, 115, 104, 111, 117, 108, 100, 32, 98, 101, 32, 101, 105, 116, 104, 101, 114, 32, 112, 101, 114, 45, 112, 108, 97, 121, 101, 114, 32, 79, 82, 32, 112, 101, 114, 45, 97, 99, 116, 111, 114, 44, 32, 110, 111, 116, 32, 98, 111, 116, 104, 46, 0]);
const __cxx_literal_c1260812c7233ce9e2a3 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 100, 101, 102, 46, 99, 112, 112, 0]);
const __cxx_literal_ef18ff321ebba52499a7 = Uint8Array.from([37, 115, 58, 37, 100, 58, 32, 100, 117, 112, 108, 105, 99, 97, 116, 101, 32, 99, 97, 115, 101, 32, 105, 103, 110, 111, 114, 101, 100, 46, 0]);
const __cxx_literal_01c737e2448f0985c3d3 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 100, 101, 102, 46, 99, 112, 112, 0]);
const __cxx_literal_d6ddd44ad04b0994f8a0 = Uint8Array.from([37, 115, 58, 37, 100, 58, 32, 100, 117, 112, 108, 105, 99, 97, 116, 101, 32, 100, 101, 102, 105, 110, 105, 116, 105, 111, 110, 32, 39, 37, 115, 39, 32, 105, 103, 110, 111, 114, 101, 100, 46, 0]);
const __cxx_literal_0a71d020c80b07a613f8 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 100, 101, 102, 46, 99, 112, 112, 0]);
const __cxx_literal_644d0ef4c44e29143f2f = Uint8Array.from([37, 115, 58, 37, 100, 58, 32, 102, 111, 117, 110, 100, 32, 39, 37, 115, 39, 32, 119, 105, 116, 104, 105, 110, 32, 97, 32, 108, 111, 99, 97, 108, 32, 101, 118, 101, 110, 116, 46, 0]);
const __cxx_literal_3fce03d974d014fcc43c = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 100, 101, 102, 46, 99, 112, 112, 0]);
const __cxx_literal_1f8058942fbcf0b57c47 = Uint8Array.from([37, 115, 58, 37, 100, 58, 32, 101, 120, 112, 101, 99, 116, 101, 100, 32, 97, 32, 108, 97, 98, 101, 108, 44, 32, 102, 111, 117, 110, 100, 32, 97, 32, 99, 111, 110, 115, 116, 97, 110, 116, 46, 0]);
const __cxx_literal_5b87b9c35e1699579098 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 100, 101, 102, 46, 99, 112, 112, 0]);
const __cxx_literal_1428dcc603f1a3fd2cbe = Uint8Array.from([37, 115, 58, 37, 100, 58, 32, 115, 121, 109, 98, 111, 108, 32, 39, 37, 115, 39, 32, 97, 108, 114, 101, 97, 100, 121, 32, 117, 115, 101, 100, 32, 102, 111, 114, 32, 118, 97, 114, 105, 97, 98, 108, 101, 46, 0]);
const __cxx_literal_1204a27c8424895fee52 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 100, 101, 102, 46, 99, 112, 112, 0]);
const __cxx_literal_08fba51cd49263cf1a32 = Uint8Array.from([37, 115, 58, 37, 100, 58, 32, 118, 97, 114, 105, 97, 98, 108, 101, 32, 39, 37, 115, 39, 32, 109, 97, 115, 107, 115, 32, 107, 101, 121, 119, 111, 114, 100, 46, 0]);
const __cxx_literal_faf2dd79f1438e520970 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 100, 101, 102, 46, 99, 112, 112, 0]);
const __cxx_literal_4c081a246ba21b552c26 = Uint8Array.from([37, 115, 58, 37, 100, 58, 32, 97, 114, 114, 97, 121, 32, 39, 37, 115, 39, 32, 109, 97, 115, 107, 115, 32, 107, 101, 121, 119, 111, 114, 100, 46, 0]);
export function C_ReportError(error) {
  if (Boolean(strcmp(__cxx_private_cell_501929f182a6e7eae833bc82().value, __cxx_private_cell_21fc654e30adb9e60fcf1a9d().value))) {
    if (((Boolean(__cxx_private_cell_1b72215e06b29e323e0d276a().value) || Boolean(__cxx_private_cell_8ebe202ae5fb6c8c9971153e().value)) || Boolean(__cxx_private_cell_06390b4cc7aa0b9ca95fea1a().value))) {
      ((i32(10) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(10), __cxx_literal_f3c18bf7c12604b182df, u32(6920), __cxx_literal_da9808495cc1bf593375, g_scriptFileName, (Boolean(__cxx_private_cell_1b72215e06b29e323e0d276a().value) ? __cxx_literal_24df5db94646c2c19beb : (Boolean(__cxx_private_cell_06390b4cc7aa0b9ca95fea1a().value) ? __cxx_literal_7c026401dca8ee0f570c : __cxx_literal_287357609a711c1162a5)), __cxx_private_cell_501929f182a6e7eae833bc82().value));
    } else {
      ((i32(10) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(10), __cxx_literal_29c68cbd3d55d55be99e, u32(6921), __cxx_literal_946e2deb3cd166724f5e, g_scriptFileName));
    }
    strcpy(__cxx_private_cell_21fc654e30adb9e60fcf1a9d().value, __cxx_private_cell_501929f182a6e7eae833bc82().value);
  }
  switch (error) {
    case i32(14): {
      ((i32(-2) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-2), __cxx_literal_c9a9d96eb4515ba0d242, u32(6927), __cxx_literal_32f0ba4c4bd3d67b81ec, g_scriptFileName, __cxx_global_cell_06245cf7a06b2fd69750f440().value, tempbuf));
    }
    break;
    case i32(1): {
      ((i32(-2) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-2), __cxx_literal_71c6ded1fc11c44fc543, u32(6930), __cxx_literal_d47a5a6b445bf6c1a5bc, g_scriptFileName, __cxx_global_cell_06245cf7a06b2fd69750f440().value, tempbuf));
    }
    break;
    case i32(2): {
      ((i32(-2) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-2), __cxx_literal_25fcbdb56204a029e7ca, u32(6933), __cxx_literal_911c3a3aac1242d220c4, g_scriptFileName, __cxx_global_cell_06245cf7a06b2fd69750f440().value, tempbuf, i32((30720 - 1))));
    }
    break;
    case i32(3): {
      ((i32(-2) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-2), __cxx_literal_82c7874d981359696eb9, u32(6936), __cxx_literal_984daa2fa699e69b1bc8, g_scriptFileName, __cxx_global_cell_06245cf7a06b2fd69750f440().value, tempbuf));
    }
    break;
    case i32(4): {
      ((i32(-2) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-2), __cxx_literal_550634c405a486546331, u32(6939), __cxx_literal_c8eee76288cccea6597d, g_scriptFileName, __cxx_global_cell_06245cf7a06b2fd69750f440().value, tempbuf, (Boolean(__cxx_private_cell_1b72215e06b29e323e0d276a().value) ? __cxx_literal_798838ba8e3aa2895645 : (Boolean(__cxx_private_cell_06390b4cc7aa0b9ca95fea1a().value) ? __cxx_literal_a6bdeb1d9640c08149a9 : __cxx_literal_ffdbbd104bb0fdc21727))));
    }
    break;
    case i32(8): {
      ((i32(-2) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-2), __cxx_literal_6612e611a102928dd0e0, u32(6942), __cxx_literal_7a2dbbdcdcf80cf69b83, g_scriptFileName, __cxx_global_cell_06245cf7a06b2fd69750f440().value, cPointerOffset(__cxx_global_cell_1aca80e8b55c802f7b43740d().value, i32((__cxx_global_cell_6742302ef915e025d82bcd36().value << 6)), Uint8Array.BYTES_PER_ELEMENT)));
    }
    break;
    case i32(9): {
      ((i32(-2) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-2), __cxx_literal_b419a854de4e4352f0a0, u32(6945), __cxx_literal_fa4543bb13d0d9919ab2, g_scriptFileName, __cxx_global_cell_06245cf7a06b2fd69750f440().value, cPointerOffset(__cxx_global_cell_1aca80e8b55c802f7b43740d().value, i32((__cxx_global_cell_6742302ef915e025d82bcd36().value << 6)), Uint8Array.BYTES_PER_ELEMENT)));
    }
    break;
    case i32(11): {
      ((i32(-2) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-2), __cxx_literal_ef316aebdc574b0c61f6, u32(6948), __cxx_literal_24ac96701e20e9ffbba4, g_scriptFileName, __cxx_global_cell_06245cf7a06b2fd69750f440().value, cPointerOffset(__cxx_global_cell_1aca80e8b55c802f7b43740d().value, i32((__cxx_global_cell_6742302ef915e025d82bcd36().value << 6)), Uint8Array.BYTES_PER_ELEMENT)));
    }
    break;
    case i32(12): {
      ((i32(-2) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-2), __cxx_literal_2337288e527a7abaf6f4, u32(6951), __cxx_literal_a26c2e56372e250170ea, g_scriptFileName, __cxx_global_cell_06245cf7a06b2fd69750f440().value, cPointerOffset(__cxx_global_cell_1aca80e8b55c802f7b43740d().value, i32((__cxx_global_cell_6742302ef915e025d82bcd36().value << 6)), Uint8Array.BYTES_PER_ELEMENT)));
    }
    break;
    case i32(10): {
      ((i32(-2) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-2), __cxx_literal_57e1a29eb7ff69ff2f7e, u32(6954), __cxx_literal_e6acdb66c7b3f9c45076, g_scriptFileName, __cxx_global_cell_06245cf7a06b2fd69750f440().value, cPointerOffset(__cxx_global_cell_1aca80e8b55c802f7b43740d().value, i32((__cxx_global_cell_6742302ef915e025d82bcd36().value << 6)), Uint8Array.BYTES_PER_ELEMENT)));
    }
    break;
    case i32(5): {
      ((i32(-2) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-2), __cxx_literal_491f2801fa58f4ccb37c, u32(6957), __cxx_literal_3b7ff396fdd4dc9367b1, g_scriptFileName, __cxx_global_cell_06245cf7a06b2fd69750f440().value, i32((cDeref(__cxx_private_cell_e2c5808de82af938e5d43808().value, Uint8Array).value))));
    }
    break;
    case i32(6): {
      ((i32(-2) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-2), __cxx_literal_32da721e369487d952d1, u32(6960), __cxx_literal_fbce0767315fb015c28f, g_scriptFileName, __cxx_global_cell_06245cf7a06b2fd69750f440().value, i32((cDeref(__cxx_private_cell_e2c5808de82af938e5d43808().value, Uint8Array).value))));
    }
    break;
    case i32(7): {
      ((i32(-2) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-2), __cxx_literal_49a82a5529577f446c39, u32(6963), __cxx_literal_512f2227b0889843debf, g_scriptFileName, __cxx_global_cell_06245cf7a06b2fd69750f440().value));
    }
    break;
    case i32(15): {
      ((i32(-2) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-2), __cxx_literal_85138b62fefc0d3d611b, u32(6966), __cxx_literal_67a6004a999afe9fdeca, g_scriptFileName, __cxx_global_cell_06245cf7a06b2fd69750f440().value, tempbuf));
    }
    break;
    case i32(13): {
      ((i32(-2) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-2), __cxx_literal_9409f67a60f614464979, u32(6969), __cxx_literal_fb54ef0143617e1bbee4, g_scriptFileName, __cxx_global_cell_06245cf7a06b2fd69750f440().value, cPointerOffset(__cxx_global_cell_1aca80e8b55c802f7b43740d().value, i32((__cxx_global_cell_6742302ef915e025d82bcd36().value << 6)), Uint8Array.BYTES_PER_ELEMENT)));
    }
    break;
    case i32(16): {
      ((i32(-2) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-2), __cxx_literal_586c047f44661fd50d6d, u32(6972), __cxx_literal_50f70477552433451316, g_scriptFileName, __cxx_global_cell_06245cf7a06b2fd69750f440().value));
    }
    break;
    case i32(18): {
      ((i32(-2) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-2), __cxx_literal_a0b0e484f9e7daff7c37, u32(6975), __cxx_literal_86f59b62021157b02877, g_scriptFileName, __cxx_global_cell_06245cf7a06b2fd69750f440().value, cPointerOffset(__cxx_global_cell_1aca80e8b55c802f7b43740d().value, i32((__cxx_global_cell_6742302ef915e025d82bcd36().value << 6)), Uint8Array.BYTES_PER_ELEMENT)));
    }
    break;
    case i32(0): {
      ((i32(-2) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-2), __cxx_literal_97f85414b4736638e00f, u32(6978), __cxx_literal_70296c919fd54e0b368e, g_scriptFileName, __cxx_global_cell_06245cf7a06b2fd69750f440().value, cPointerOffset(__cxx_global_cell_1aca80e8b55c802f7b43740d().value, i32((__cxx_global_cell_6742302ef915e025d82bcd36().value << 6)), Uint8Array.BYTES_PER_ELEMENT)));
    }
    break;
    case i32(19): {
      ((i32(-2) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-2), __cxx_literal_284f7b8485b3989c9868, u32(6981), __cxx_literal_52779f10c5c9623140c2, g_scriptFileName, __cxx_global_cell_06245cf7a06b2fd69750f440().value, cPointerOffset(__cxx_global_cell_1aca80e8b55c802f7b43740d().value, i32((__cxx_global_cell_6742302ef915e025d82bcd36().value << 6)), Uint8Array.BYTES_PER_ELEMENT)));
    }
    break;
    case i32(17): {
      ((i32(-2) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-2), __cxx_literal_f721b74cea19f0e53313, u32(6984), __cxx_literal_37bf0996228500fc1dc8, g_scriptFileName, __cxx_global_cell_06245cf7a06b2fd69750f440().value, 16384));
    }
    break;
    case i32(21): {
      ((i32(-1) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-1), __cxx_literal_b3e5b5b7a1d284cf737e, u32(6987), __cxx_literal_8e8d7332e187b6e11310, g_scriptFileName, __cxx_global_cell_06245cf7a06b2fd69750f440().value, cPointerOffset(__cxx_global_cell_1aca80e8b55c802f7b43740d().value, i32((__cxx_global_cell_6742302ef915e025d82bcd36().value << 6)), Uint8Array.BYTES_PER_ELEMENT)));
    }
    break;
    case i32(22): {
      ((i32(-1) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-1), __cxx_literal_c1260812c7233ce9e2a3, u32(6990), __cxx_literal_ef18ff321ebba52499a7, g_scriptFileName, __cxx_global_cell_06245cf7a06b2fd69750f440().value));
    }
    break;
    case i32(23): {
      ((i32(-1) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-1), __cxx_literal_01c737e2448f0985c3d3, u32(6993), __cxx_literal_d6ddd44ad04b0994f8a0, g_scriptFileName, __cxx_global_cell_06245cf7a06b2fd69750f440().value, cPointerOffset(__cxx_global_cell_1aca80e8b55c802f7b43740d().value, i32((__cxx_global_cell_6742302ef915e025d82bcd36().value << 6)), Uint8Array.BYTES_PER_ELEMENT)));
    }
    break;
    case i32(24): {
      ((i32(-1) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-1), __cxx_literal_0a71d020c80b07a613f8, u32(6996), __cxx_literal_644d0ef4c44e29143f2f, g_scriptFileName, __cxx_global_cell_06245cf7a06b2fd69750f440().value, tempbuf));
    }
    break;
    case i32(25): {
      ((i32(-1) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-1), __cxx_literal_3fce03d974d014fcc43c, u32(6999), __cxx_literal_1f8058942fbcf0b57c47, g_scriptFileName, __cxx_global_cell_06245cf7a06b2fd69750f440().value));
    }
    break;
    case i32(26): {
      ((i32(-1) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-1), __cxx_literal_5b87b9c35e1699579098, u32(7002), __cxx_literal_1428dcc603f1a3fd2cbe, g_scriptFileName, __cxx_global_cell_06245cf7a06b2fd69750f440().value, cPointerOffset(__cxx_global_cell_1aca80e8b55c802f7b43740d().value, i32((__cxx_global_cell_6742302ef915e025d82bcd36().value << 6)), Uint8Array.BYTES_PER_ELEMENT)));
    }
    break;
    case i32(27): {
      ((i32(-1) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-1), __cxx_literal_1204a27c8424895fee52, u32(7005), __cxx_literal_08fba51cd49263cf1a32, g_scriptFileName, __cxx_global_cell_06245cf7a06b2fd69750f440().value, cPointerOffset(__cxx_global_cell_1aca80e8b55c802f7b43740d().value, i32((__cxx_global_cell_6742302ef915e025d82bcd36().value << 6)), Uint8Array.BYTES_PER_ELEMENT)));
    }
    break;
    case i32(20): {
      ((i32(-1) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-1), __cxx_literal_faf2dd79f1438e520970, u32(7008), __cxx_literal_4c081a246ba21b552c26, g_scriptFileName, __cxx_global_cell_06245cf7a06b2fd69750f440().value, cPointerOffset(__cxx_global_cell_1aca80e8b55c802f7b43740d().value, i32((__cxx_global_cell_6742302ef915e025d82bcd36().value << 6)), Uint8Array.BYTES_PER_ELEMENT)));
    }
    break;
  }
}

// C/C++ source: source/build/include/compat.h:1378
export function xstrdup__header_57e322b3fc9a(s) {
  let len = i32(u64((BigInt(strlen(s)) + BigInt(u64(1)))));
  let ptr = cTypedPointer(Alloc__cxx_static_e0036cfb06bcfe42(__cxx_global_cell_11016d3c7177543e564ab46c().value, u64(len), u64(16)), Uint8Array);
  if (cPointerCompare(ptr, null, "!=")) {
    strcpy(ptr, s);
    ((cDeref(cPointerOffset(ptr, i32((len - 1)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32(0) & 255));
    return ptr;
  }
  handle_memerr(len);
  __builtin_unreachable();
}

export function ARRAY_SIZE__header_78ca1afef65b(arg0) {
  return u64(31n);
}

export function ARRAY_SIZE__header_1b7eba0688f8(arg0) {
  return u64(1n);
}

export function bitmap_test__header_5cc6c8232c10(ptr, n) {

  return Boolean((i32((i32((cDeref(cPointerOffset(ptr, i32((n >> 3)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & i32((cDeref(cPointerOffset(pow2char__header_global_9393851f0c146808, i32((n & 7)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))) == i32((cDeref(cPointerOffset(pow2char__header_global_9393851f0c146808, i32((n & 7)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value))));
}

// C/C++ source: source/build/include/compat.h:1413
export function xrealloc__header_d10105957532(ptr, size) {
  let newptr = Realloc__cxx_static_478d5da25b6b3923(__cxx_global_cell_11016d3c7177543e564ab46c().value, ptr, size, u64(16));
  if ((cPointerCompare(newptr, null, "!=") || (size == u64(0)))) {
    return newptr;
  }
  handle_memerr(i32(size));
  __builtin_unreachable();
}

export function SILENCE_UNUSED__header_19ce759deb00(arg0, arg1, arg2) {

}

// C/C++ source: @sysroot/usr/include/c++/12/bits/stl_algobase.h:230
export function min__template_774131ccff66371d(__a, __b) {
  if ((__b.value < __a.value)) {
    return __b;
  }
  return __a;
}

export function bitmap_clear__header_fe7b22c48bc9(ptr, n) {

  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = (u32((__cxx_lvalue_0.value & (~i32((cDeref(cPointerOffset(pow2char__header_global_9393851f0c146808, i32((n & 7)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value))))) & 255)))(cDeref(cPointerOffset(ptr, i32((n >> 3)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array));
}

export function bitmap_set__header_da3c41727d5a(ptr, n) {

  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = (u32((__cxx_lvalue_0.value | i32((cDeref(cPointerOffset(pow2char__header_global_9393851f0c146808, i32((n & 7)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))) & 255)))(cDeref(cPointerOffset(ptr, i32((n >> 3)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array));
}

// C/C++ source: source/build/include/compat.h:1449
export function xfree__header_417fd1db3c1d(ptr) {
  Free__cxx_static_0dfd3f42f0dc2c05(__cxx_global_cell_11016d3c7177543e564ab46c().value, ptr);
}

// C/C++ source: source/build/include/compat.h:1400
export function xcalloc__header_a91960ec68ef(nmemb, size) {
  let siz = u64((BigInt(nmemb) * BigInt(size)));
  let ptr = Alloc__cxx_static_e0036cfb06bcfe42(__cxx_global_cell_11016d3c7177543e564ab46c().value, siz, u64(16));
  if (cPointerCompare(ptr, null, "!=")) {
    memset(ptr, 0, siz);
    return ptr;
  }
  handle_memerr(i32(size));
  __builtin_unreachable();
}

// C/C++ source: source/build/include/compat.h:1392
export function xmalloc__header_7064013f2c11(size) {
  let ptr = Alloc__cxx_static_e0036cfb06bcfe42(__cxx_global_cell_11016d3c7177543e564ab46c().value, size, u64(16));
  if (cPointerCompare(ptr, null, "!=")) {
    return ptr;
  }
  handle_memerr(i32(size));
  __builtin_unreachable();
}

export function clamp__header_f1396d347458(__cxx_in, min, max) {
  return i32(((__cxx_in <= i32(min)) ? i32(min) : ((__cxx_in >= i32(max)) ? i32(max) : __cxx_in)));
}

export function ARRAY_SIZE__header_bd4fa82976e1(arg0) {
  return u64(1024n);
}

// C/C++ source: source/build/include/common.h:76
export function dup_filename__header_992d4c8ea5fb(fn) {
  let buf = cTypedPointer(xmalloc__header_7064013f2c11(u64(256)), Uint8Array);
  return Bstrncpyz__header_20d79fc0de0e(buf, fn, u64(256));
}

// C/C++ source: source/build/include/compat.h:1235
export function Bstrncpyz__header_20d79fc0de0e(dst, src, n) {
  if ((n > u64(0))) {
    memcpy(dst, src, (min__template_c237f4424e2bda8a(((__cxx_lvalue_0) => cRef(() => __cxx_lvalue_0, () => { throw new TypeError("const C++ reference write"); }))(u64((BigInt(strlen(src)) + BigInt(u64(1))))), ((__cxx_lvalue_1) => cRef(() => __cxx_lvalue_1, () => { throw new TypeError("const C++ reference write"); }))(u64((BigInt(n) - BigInt(u64(1))))))).value);
    ((cDeref(cPointerOffset(dst, u64((BigInt(n) - BigInt(u64(1)))), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32(0) & 255));
  }
  return dst;
}

export function ARRAY_SIZE__header_6acb20764cfa(arg0) {
  return u64(48n);
}

export function ARRAY_SIZE__header_fc0707ff3649(arg0) {
  return u64(6n);
}

// C/C++ source: source/build/include/vfs.h:150
export function buildvfs_isdir__header_2380bcd92c58(path) {
  let st = cZeroAggregate({"byteRecord": {"align": 8, "arrayAlign": 8, "fields": {"__glibc_reserved": {"length": 3, "native": "BigInt64Array", "offset": 120, "size": 24}, "__pad0": {"native": "Int32Array", "offset": 36, "size": 4}, "st_atim": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"tv_nsec": {"native": "BigInt64Array", "offset": 8, "size": 8}, "tv_sec": {"native": "BigInt64Array", "offset": 0, "size": 8}}, "overlaps": false, "size": 16, "union": false}, "offset": 72}, "st_blksize": {"native": "BigInt64Array", "offset": 56, "size": 8}, "st_blocks": {"native": "BigInt64Array", "offset": 64, "size": 8}, "st_ctim": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"tv_nsec": {"native": "BigInt64Array", "offset": 8, "size": 8}, "tv_sec": {"native": "BigInt64Array", "offset": 0, "size": 8}}, "overlaps": false, "size": 16, "union": false}, "offset": 104}, "st_dev": {"native": "BigUint64Array", "offset": 0, "size": 8}, "st_gid": {"native": "Uint32Array", "offset": 32, "size": 4}, "st_ino": {"native": "BigUint64Array", "offset": 8, "size": 8}, "st_mode": {"native": "Uint32Array", "offset": 24, "size": 4}, "st_mtim": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"tv_nsec": {"native": "BigInt64Array", "offset": 8, "size": 8}, "tv_sec": {"native": "BigInt64Array", "offset": 0, "size": 8}}, "overlaps": false, "size": 16, "union": false}, "offset": 88}, "st_nlink": {"native": "BigUint64Array", "offset": 16, "size": 8}, "st_rdev": {"native": "BigUint64Array", "offset": 40, "size": 8}, "st_size": {"native": "BigInt64Array", "offset": 48, "size": 8}, "st_uid": {"native": "Uint32Array", "offset": 28, "size": 4}}, "overlaps": false, "size": 144, "union": false}}, {});
  return i32((Boolean(stat(path, st)) ? 0 : i32((u32((st.st_mode & u32(16384))) == u32(16384)))));
}

export function swap__header_9ca3dca17ecb(a, b) {
  let t = i64((cDeref(a, BigInt64Array).value));
  ((cDeref(a, BigInt64Array).value) = i64((cDeref(b, BigInt64Array).value)));
  ((cDeref(b, BigInt64Array).value) = i64(t));
}

// C/C++ source: source/duke3d/src/duke3d.h:158
export function G_TileHasActor__header_74bfe4880a98(tileNum) {
  return i32(cPointerCompare((cPointerElementRef(cRecordPointer(g_tile, {"align": 8, "arrayAlign": 1, "fields": {"cacherange": {"native": "Int32Array", "offset": 36, "size": 4}, "defproj": {"offset": 24, "pointer": true, "size": 8}, "execPtr": {"offset": 0, "pointer": true, "size": 8}, "flags": {"native": "Uint32Array", "offset": 32, "size": 4}, "loadPtr": {"offset": 8, "pointer": true, "size": 8}, "proj": {"offset": 16, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {}), tileNum).value).execPtr, null, "!="));
}

// C/C++ source: @sysroot/usr/include/c++/12/bits/stl_algobase.h:230
export function min__template_c237f4424e2bda8a(__a, __b) {
  if ((__b.value < __a.value)) {
    return __b;
  }
  return __a;
}
