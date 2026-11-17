// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/duke3d/src/gamevars.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
import { Alloc__cxx_static_e0036cfb06bcfe42 } from "../../build/src/smmalloc_generic.cpp.mjs";
import { Bstrupr } from "../../build/src/compat.cpp.mjs";
import { __cxx_global_cell_4f8061263e8b951c81aacfd0 } from "./dnames.cpp.mjs";
import { CAT_FIRE____header_global_a273946bc179c8dd } from "./gamevars.cpp.mjs";
import { __cxx_global_cell_be5f3f16c99aa0c4c7540262 } from "./dnames.cpp.mjs";
import { __cxx_global_cell_e0021f00946f9fcef1493fe8 } from "./dnames.cpp.mjs";
import { CHAINGUN_FIRE____header_global_69d9f94b57752638 } from "./gamevars.cpp.mjs";
import { CHAINGUN____header_global_89711fbc219eeb10 } from "./gamevars.cpp.mjs";
import { C_ReportError } from "./gamedef.cpp.mjs";
import { __cxx_global_cell_9290bc0bb3f2727885bdfb0e } from "./dnames.cpp.mjs";
import { EJECT_CLIP____header_global_9c229ab00750da0a } from "./gamevars.cpp.mjs";
import { __cxx_global_cell_2fbb894c12ee103752b36559 } from "./dnames.cpp.mjs";
import { EXPANDERSHOOT____header_global_903bb251d3ce6db0 } from "./gamevars.cpp.mjs";
import { __cxx_global_cell_0aa6eda7dfb9c2ede217d4d4 } from "./dnames.cpp.mjs";
import { FREEZEBLAST____header_global_07f99ba4588f4c84 } from "./gamevars.cpp.mjs";
import { Free__cxx_static_0dfd3f42f0dc2c05 } from "../../build/src/smmalloc_generic.cpp.mjs";
import { __cxx_global_cell_182ff03ee4fe21aadf00a8be } from "./dnames.cpp.mjs";
import { GROWSPARK____header_global_9db981fb2fd4983c } from "./gamevars.cpp.mjs";
import { __cxx_global_cell_a1135ec6e3c71ee50e4480df } from "./dnames.cpp.mjs";
import { HANDHOLDINGLASER____header_global_d526d9ac88449647 } from "./gamevars.cpp.mjs";
import { __cxx_global_cell_57ca2f37062e039be72ab5d5 } from "./dnames.cpp.mjs";
import { HEAVYHBOMB____header_global_38319da82abc8fc3 } from "./gamevars.cpp.mjs";
import { __cxx_global_cell_0a348ba1bfc02b77af7e4204 } from "./dnames.cpp.mjs";
import { INSERT_CLIP____header_global_d9183cad0d97d626 } from "./gamevars.cpp.mjs";
import { __cxx_global_cell_81a5050f1681bde302982f87 } from "./dnames.cpp.mjs";
import { KNEE____header_global_fe4ce5c7f20fd39f } from "./gamevars.cpp.mjs";
import { __cxx_global_cell_4e6f24ae9c3dade74700992b } from "../../build/src/engine.cpp.mjs";
import { __cxx_global_cell_725e88840cca111651e3276d } from "./dnames.cpp.mjs";
import { PISTOL_FIRE____header_global_64696cb3234ce690 } from "./gamevars.cpp.mjs";
import { __cxx_global_cell_9871087b1b184d775c972766 } from "./dnames.cpp.mjs";
import { RPG____header_global_dbb5cd4ccf59d761 } from "./gamevars.cpp.mjs";
import { __cxx_global_cell_c4e9a6dc8cec5d981f8c75e7 } from "./dnames.cpp.mjs";
import { SELECT_WEAPON____header_global_05d1bf3e9599453c } from "./gamevars.cpp.mjs";
import { __cxx_global_cell_665d998270647c7ad8e0914d } from "./dnames.cpp.mjs";
import { SHELL____header_global_f8dce4ba7f3614c0 } from "./gamevars.cpp.mjs";
import { __cxx_global_cell_0371d4defc194a93e64fb6eb } from "./dnames.cpp.mjs";
import { __cxx_global_cell_87081bf72dadfcd3df68bcc9 } from "./dnames.cpp.mjs";
import { SHOTGUNSHELL____header_global_3b37f1e099b4e1c7 } from "./gamevars.cpp.mjs";
import { __cxx_global_cell_f98f9d6620fc4928caeacaf6 } from "./dnames.cpp.mjs";
import { SHOTGUN_COCK____header_global_ea5f71d97148ad27 } from "./gamevars.cpp.mjs";
import { __cxx_global_cell_8ececfce0f4eb45cc64fe82b } from "./dnames.cpp.mjs";
import { SHOTGUN_FIRE____header_global_a02083a8585a7678 } from "./gamevars.cpp.mjs";
import { SHOTGUN____header_global_cbd049448615880f } from "./gamevars.cpp.mjs";
import { __cxx_global_cell_1b018f3cb172f441e7f0f065 } from "./dnames.cpp.mjs";
import { SHOTSPARK1____header_global_2d67184b3dd2f624 } from "./gamevars.cpp.mjs";
import { __cxx_global_cell_67305eaca81f492a2d16db0d } from "./dnames.cpp.mjs";
import { __cxx_global_cell_1b705b619540483e827fd6ea } from "./dnames.cpp.mjs";
import { SHRINKER_FIRE____header_global_5d107e49af7df222 } from "./gamevars.cpp.mjs";
import { SHRINKER____header_global_20d1aaf9aa975764 } from "./gamevars.cpp.mjs";
import { aGameArrays } from "./gamevars.cpp.mjs";
import { aGameVars } from "./gamevars.cpp.mjs";
import { __cxx_global_cell_c1c0a03508c5080698c5ec5d } from "../../build/src/engine.cpp.mjs";
import { bfdivtable32 } from "../../build/src/pragmas.cpp.mjs";
import { current_verbosity_cutoff } from "../../build/src/loguru.cpp.mjs";
import { __cxx_global_cell_27361f8c1fd7174d309e19f2 } from "../../build/src/engine.cpp.mjs";
import { divtable64 } from "../../build/src/pragmas.cpp.mjs";
import { fix16_half__header_global_165cc7a41fb44aa1 } from "./gamevars.cpp.mjs";
import { fix16_one__header_global_ed8aba31ba5aa8d6 } from "./gamevars.cpp.mjs";
import { __cxx_global_cell_915885e2bacffc3a024f309d } from "./game.cpp.mjs";
import { __cxx_global_cell_9cef20cb19b42f4cfa85797b } from "./game.cpp.mjs";
import { __cxx_global_cell_0253173354832cddecae7ca7 } from "./menus.cpp.mjs";
import { __cxx_global_cell_a9ed12f504f4bd101d4746c6 } from "./gamedef.cpp.mjs";
import { __cxx_global_cell_af7005133235fcf35d534b57 } from "./global.cpp.mjs";
import { __cxx_global_cell_312b58e8a14f852e3cc5e7e0 } from "./gamevars.cpp.mjs";
import { __cxx_global_cell_c0e288040dbf9a805036c27d } from "./common.cpp.mjs";
import { __cxx_global_cell_8406f8e86b0ce3102350571c } from "./gamevars.cpp.mjs";
import { g_gametypeFlags } from "./global.cpp.mjs";
import { __cxx_global_cell_6742302ef915e025d82bcd36 } from "./global.cpp.mjs";
import { __cxx_global_cell_465a0b3c161b50504ffed39e } from "./savegame.cpp.mjs";
import { __cxx_global_cell_06245cf7a06b2fd69750f440 } from "./gamedef.cpp.mjs";
import { g_radiusDmgStatnums } from "./actors.cpp.mjs";
import { g_scriptFileName } from "./gamedef.cpp.mjs";
import { __cxx_global_cell_11016d3c7177543e564ab46c } from "../../build/src/compat.cpp.mjs";
import { __cxx_global_cell_b1c97a6bfe6b79b1e897a68a } from "./global.cpp.mjs";
import { __cxx_global_cell_079877be927e9ceeb785b6a6 } from "../../build/src/baselayer.cpp.mjs";
import { __cxx_global_cell_778291b6375dd09957e56c1b } from "./gamedef.cpp.mjs";
import { g_weaponOverridden } from "./gamevars.cpp.mjs";
import { gotpic } from "../../build/src/engine.cpp.mjs";
import { gotsector } from "../../build/src/engine.cpp.mjs";
import { __cxx_global_cell_f0457d06edefc3c775e2c32f } from "./gamedef.cpp.mjs";
import { __cxx_global_cell_2d12a4ce62b5a2309382b8ea } from "./gamedef.cpp.mjs";
import { handle_memerr } from "../../build/src/compat.cpp.mjs";
import { hash_add } from "../../build/src/hash.cpp.mjs";
import { hash_find } from "../../build/src/hash.cpp.mjs";
import { hash_free } from "../../build/src/hash.cpp.mjs";
import { hash_init } from "../../build/src/hash.cpp.mjs";
import { __cxx_global_cell_428db7966f68b580bdb8b8d9 } from "./player.cpp.mjs";
import { initputs } from "../../build/src/baselayer.cpp.mjs";
import { __cxx_global_cell_1aca80e8b55c802f7b43740d } from "./global.cpp.mjs";
import { __cxx_global_cell_b6db0759e33cdbb028a91dc6 } from "../../build/src/pragmas.cpp.mjs";
import { __cxx_global_cell_f8287b2e627d0e3f51b90c55 } from "../../build/src/pragmas.cpp.mjs";
import { __cxx_private_cell_b834440029b478ecb74accfe } from "./gamevars.cpp.mjs";
import { libdivide_s32_branchfree_do } from "../../../browser-abi/libdivide_source.mjs";
import { libdivide_s32_branchfree_gen } from "../../../browser-abi/libdivide_provider.mjs";
import { libdivide_s64_do } from "../../../browser-abi/libdivide_source.mjs";
import { libdivide_s64_gen } from "../../../browser-abi/libdivide_provider.mjs";
import { loguru_log } from "../../../browser-abi/loguru_provider.mjs";
import { memset } from "../../../browser-abi/libc_provider.mjs";
import { __cxx_global_cell_04adffdeab684b9c52206917 } from "../../build/src/mmulti.cpp.mjs";
import { __cxx_global_cell_af3e7a8f9b4d40a559acf109 } from "../../build/src/mmulti.cpp.mjs";
import { __cxx_global_cell_0d84c36af55f8d659082f1bb } from "../../build/src/engine.cpp.mjs";
import { __cxx_global_cell_9fbed4c78bef6ce8bf955682 } from "../../build/src/engine.cpp.mjs";
import { pow2char__header_global_28f8b4adea4b716f } from "./gamevars.cpp.mjs";
import { __cxx_global_cell_cff3db0365d00ccd4662087c } from "../../build/src/engine.cpp.mjs";
import { __cxx_global_cell_458f422a7bebe88265e9f694 } from "./global.cpp.mjs";
import { show2dsector } from "../../build/src/engine.cpp.mjs";
import { sprintf } from "../../../browser-abi/libc_provider.mjs";
import { strcat } from "../../../browser-abi/libc_provider.mjs";
import { strcpy } from "../../../browser-abi/libc_provider.mjs";
import { strlen } from "../../../browser-abi/libc_provider.mjs";
import { tilesiz } from "../../build/src/engine.cpp.mjs";
import { __cxx_global_cell_37d96f0d18da4d1ab96cf9c5 } from "../../build/src/engine.cpp.mjs";
import { __cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba } from "./global.cpp.mjs";
import { __cxx_global_cell_c84014786923d3572b20a599 } from "../../build/src/engine.cpp.mjs";
import { __cxx_global_cell_5bce98f73f3ed0c837f2729e } from "./gameexec.cpp.mjs";
import { vmStructHashTablePtrs__header_global_f403705445a50b92 } from "./gamevars.cpp.mjs";
import { __cxx_global_cell_781692351a9d53402cd867ca } from "./gamedef.cpp.mjs";
import { weapondefaults } from "./gamevars.cpp.mjs";
import { __cxx_global_cell_221fd34161be9be2eedf7faf } from "../../build/src/engine.cpp.mjs";
import { __cxx_global_cell_46c79554e27038ae817b7d39 } from "../../build/src/engine.cpp.mjs";
import { __cxx_global_cell_22f848239c12c0d9f2b6f9e3 } from "../../build/src/engine.cpp.mjs";
import { __cxx_global_cell_ce636929c03d679219ea2982 } from "../../build/src/engine.cpp.mjs";
import { __cxx_global_cell_9de9945f48c8bc47d005b6f8 } from "../../build/src/engine.cpp.mjs";

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
// C/C++ source: source/duke3d/src/gamevars.cpp:60
export function Gv_Free() {
  {
    const __cxx_range_array_0 = aGameVars;
    if (__cxx_range_array_0.length !== 2048) throw new RangeError("C array extent mismatch");
    for (let __cxx_range_index_0 = 0; __cxx_range_index_0 < 2048; ++__cxx_range_index_0) {
      if (Boolean(u64((BigInt(__cxx_range_array_0[__cxx_range_index_0].flags) & BigInt(u64(3)))))) {
        do {
          xaligned_free__header_621d51a0063b(__cxx_range_array_0[__cxx_range_index_0].__cxx_anonymous_0.pValues);
          (__cxx_range_array_0[__cxx_range_index_0].__cxx_anonymous_0.pValues = null);
        } while (Boolean(0));
      }
      ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = u64((BigInt(__cxx_lvalue_0.value) | BigInt(u64(8))))))(cObjectFieldRef(__cxx_range_array_0[__cxx_range_index_0], "flags"));
    }
  }
  {
    const __cxx_range_array_1 = aGameArrays;
    if (__cxx_range_array_1.length !== 512) throw new RangeError("C array extent mismatch");
    for (let __cxx_range_index_1 = 0; __cxx_range_index_1 < 512; ++__cxx_range_index_1) {
      if (Boolean(u64((BigInt(__cxx_range_array_1[__cxx_range_index_1].flags) & BigInt(u64(512)))))) {
        do {
          xaligned_free__header_621d51a0063b(__cxx_range_array_1[__cxx_range_index_1].pValues);
          (__cxx_range_array_1[__cxx_range_index_1].pValues = null);
        } while (Boolean(0));
      }
      ((__cxx_lvalue_1) => (__cxx_lvalue_1.value = u64((BigInt(__cxx_lvalue_1.value) | BigInt(u64(8))))))(cObjectFieldRef(__cxx_range_array_1[__cxx_range_index_1], "flags"));
    }
  }

  let varCount = i32((__cxx_global_cell_8406f8e86b0ce3102350571c().value | i32((__cxx_global_cell_312b58e8a14f852e3cc5e7e0().value << 16))));
  (__cxx_global_cell_8406f8e86b0ce3102350571c().value = i32((__cxx_global_cell_312b58e8a14f852e3cc5e7e0().value = i32(0))));
  hash_init(__cxx_global_cell_2d12a4ce62b5a2309382b8ea().value);
  hash_init(__cxx_global_cell_f0457d06edefc3c775e2c32f().value);
  return i32(varCount);
}

// C/C++ source: source/duke3d/src/gamevars.cpp:89
export function Gv_Clear() {
  Gv_Free();
  {
    const __cxx_range_array_0 = aGameVars;
    if (__cxx_range_array_0.length !== 2048) throw new RangeError("C array extent mismatch");
    for (let __cxx_range_index_0 = 0; __cxx_range_index_0 < 2048; ++__cxx_range_index_0) {
      do {
        xfree__header_ab6d6e4a5e19(__cxx_range_array_0[__cxx_range_index_0].szLabel);
        (__cxx_range_array_0[__cxx_range_index_0].szLabel = null);
      } while (Boolean(0));
    }
  }
  memset(aGameVars, 0, 65536);
  {
    const __cxx_range_array_1 = aGameArrays;
    if (__cxx_range_array_1.length !== 512) throw new RangeError("C array extent mismatch");
    for (let __cxx_range_index_1 = 0; __cxx_range_index_1 < 512; ++__cxx_range_index_1) {
      do {
        xfree__header_ab6d6e4a5e19(__cxx_range_array_1[__cxx_range_index_1].szLabel);
        (__cxx_range_array_1[__cxx_range_index_1].szLabel = null);
      } while (Boolean(0));
    }
  }
  memset(aGameArrays, 0, 16384);
  {
    const __cxx_range_array_2 = vmStructHashTablePtrs__header_global_f403705445a50b92;
    if (__cxx_range_array_2.length !== 10) throw new RangeError("C array extent mismatch");
    if (!__cxx_range_array_2[Symbol.for("source-first.clang-pointer-array/1")]) throw new TypeError("C pointer array storage ABI missing");
    for (let __cxx_range_index_2 = 0; __cxx_range_index_2 < 10; ++__cxx_range_index_2) {
      let i = __cxx_range_array_2[__cxx_range_index_2];
      hash_free(i);
    }
  }
}

// C/C++ source: source/duke3d/src/gamevars.cpp:905
const __cxx_literal_73540c43817b45899431 = Uint8Array.from([47, 47, 32, 67, 117, 114, 114, 101, 110, 116, 32, 71, 97, 109, 101, 32, 68, 101, 102, 105, 110, 105, 116, 105, 111, 110, 115, 10, 10, 0]);
const __cxx_literal_1acd5276d27ac41b1e5d = Uint8Array.from([103, 97, 109, 101, 118, 97, 114, 32, 0]);
const __cxx_literal_812621699f3d6964bee0 = Uint8Array.from([32, 0]);
const __cxx_literal_7aa326023d3e6273c977 = Uint8Array.from([32, 71, 65, 77, 69, 86, 65, 82, 95, 80, 69, 82, 80, 76, 65, 89, 69, 82, 0]);
const __cxx_literal_918942fc122fd77cc45c = Uint8Array.from([32, 71, 65, 77, 69, 86, 65, 82, 95, 80, 69, 82, 65, 67, 84, 79, 82, 0]);
const __cxx_literal_a80bdf42a4ea2f4f424f = Uint8Array.from([32, 0]);
const __cxx_literal_04b4df7f373b85f9c470 = Uint8Array.from([32, 47, 47, 32, 0]);
const __cxx_literal_c7e799c81305ef96fe49 = Uint8Array.from([32, 40, 115, 121, 115, 116, 101, 109, 41, 0]);
const __cxx_literal_9b2b42c09c74fd61d044 = Uint8Array.from([32, 40, 112, 111, 105, 110, 116, 101, 114, 41, 0]);
const __cxx_literal_3d2f5de538aca1d92181 = Uint8Array.from([32, 40, 114, 101, 97, 100, 32, 111, 110, 108, 121, 41, 0]);
const __cxx_literal_2e1c416cec8e8eab581a = Uint8Array.from([32, 40, 115, 112, 101, 99, 105, 97, 108, 41, 0]);
const __cxx_literal_684210dc6bfde881bf71 = Uint8Array.from([10, 0]);
const __cxx_literal_2359d0449e947ba858b8 = Uint8Array.from([10, 47, 47, 32, 101, 110, 100, 32, 111, 102, 32, 103, 97, 109, 101, 32, 100, 101, 102, 105, 110, 105, 116, 105, 111, 110, 115, 10, 0]);
export function Gv_DumpValues() {
  buildprint__template_d684cd61d5016db8(__cxx_literal_73540c43817b45899431);
  for (let i = i64(0); (i < i64(__cxx_global_cell_8406f8e86b0ce3102350571c().value)); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i64((previous + 1n)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; }))) {
    buildprint__template_7e9230c56c320659(__cxx_literal_1acd5276d27ac41b1e5d, (cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), i).value).szLabel, __cxx_literal_812621699f3d6964bee0);
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
      buildprint__template_d684cd61d5016db8(__cxx_literal_7aa326023d3e6273c977);
    } else {
      if (Boolean(u64((BigInt((cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), i).value).flags) & BigInt(u64(2)))))) {
        buildprint__template_d684cd61d5016db8(__cxx_literal_918942fc122fd77cc45c);
      } else {
        buildprint__template_d6f52b498a2a6584(__cxx_literal_a80bdf42a4ea2f4f424f, (cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), i).value).flags);
      }
    }
    buildprint__template_d684cd61d5016db8(__cxx_literal_04b4df7f373b85f9c470);
    if (Boolean(u64((BigInt((cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), i).value).flags) & BigInt(u64(2048)))))) {
      buildprint__template_d684cd61d5016db8(__cxx_literal_c7e799c81305ef96fe49);
    }
    if (Boolean(u64((BigInt((cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), i).value).flags) & BigInt(u64(1351680)))))) {
      buildprint__template_d684cd61d5016db8(__cxx_literal_9b2b42c09c74fd61d044);
    }
    if (Boolean(u64((BigInt((cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), i).value).flags) & BigInt(u64(4096)))))) {
      buildprint__template_d684cd61d5016db8(__cxx_literal_3d2f5de538aca1d92181);
    }
    if (Boolean(u64((BigInt((cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), i).value).flags) & BigInt(u64(262144)))))) {
      buildprint__template_d684cd61d5016db8(__cxx_literal_2e1c416cec8e8eab581a);
    }
    buildprint__template_d684cd61d5016db8(__cxx_literal_684210dc6bfde881bf71);
  }
  buildprint__template_d684cd61d5016db8(__cxx_literal_2359d0449e947ba858b8);
}

// C/C++ source: source/duke3d/src/gamevars.cpp:942
export function Gv_ResetVars() {
  Gv_Free();
  {
    const __cxx_range_array_0 = aGameVars;
    if (__cxx_range_array_0.length !== 2048) throw new RangeError("C array extent mismatch");
    for (let __cxx_range_index_0 = 0; __cxx_range_index_0 < 2048; ++__cxx_range_index_0) {
      if (cPointerCompare(__cxx_range_array_0[__cxx_range_index_0].szLabel, null, "!=")) {
        Gv_NewVar(__cxx_range_array_0[__cxx_range_index_0].szLabel, (Boolean(u64((BigInt(__cxx_range_array_0[__cxx_range_index_0].flags) & BigInt(u64(1024))))) ? __cxx_range_array_0[__cxx_range_index_0].__cxx_anonymous_0.global : __cxx_range_array_0[__cxx_range_index_0].defaultValue), u32(__cxx_range_array_0[__cxx_range_index_0].flags));
      }
    }
  }
  {
    const __cxx_range_array_1 = aGameArrays;
    if (__cxx_range_array_1.length !== 512) throw new RangeError("C array extent mismatch");
    for (let __cxx_range_index_1 = 0; __cxx_range_index_1 < 512; ++__cxx_range_index_1) {
      if ((cPointerCompare(__cxx_range_array_1[__cxx_range_index_1].szLabel, null, "!=") && Boolean(u64((BigInt(__cxx_range_array_1[__cxx_range_index_1].flags) & BigInt(u64(8))))))) {
        Gv_NewArray(__cxx_range_array_1[__cxx_range_index_1].szLabel, __cxx_range_array_1[__cxx_range_index_1].pValues, __cxx_range_array_1[__cxx_range_index_1].size, u32(__cxx_range_array_1[__cxx_range_index_1].flags));
      }
    }
  }
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
const __cxx_literal_90ae9edd05bb539a041e = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 118, 97, 114, 115, 46, 99, 112, 112, 0]);
const __cxx_literal_1c9dbfec6c7c29632671 = Uint8Array.from([37, 115, 58, 37, 100, 58, 32, 116, 111, 111, 32, 109, 97, 110, 121, 32, 97, 114, 114, 97, 121, 115, 32, 100, 101, 102, 105, 110, 101, 100, 33, 0]);
const __cxx_literal_37f9d38e275000f1b4e3 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 118, 97, 114, 115, 46, 99, 112, 112, 0]);
const __cxx_literal_02762d65b33757c06896 = Uint8Array.from([37, 115, 58, 37, 100, 58, 32, 97, 114, 114, 97, 121, 32, 110, 97, 109, 101, 32, 39, 37, 115, 39, 32, 101, 120, 99, 101, 101, 100, 115, 32, 108, 105, 109, 105, 116, 32, 111, 102, 32, 37, 100, 32, 99, 104, 97, 114, 97, 99, 116, 101, 114, 115, 46, 0]);
export function Gv_NewArray(pszLabel, arrayptr, asize, dwFlags) {
  (asize >= i64(0));
  if ((__cxx_global_cell_312b58e8a14f852e3cc5e7e0().value >= i32((2048 >> 2)))) {
    ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(__cxx_global_cell_a9ed12f504f4bd101d4746c6());
    C_ReportError((-1));
    ((i32(-2) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-2), __cxx_literal_90ae9edd05bb539a041e, u32(981), __cxx_literal_1c9dbfec6c7c29632671, g_scriptFileName, __cxx_global_cell_06245cf7a06b2fd69750f440().value));
    return;
  }
  if ((strlen(pszLabel) > u64(i32((26 - 1))))) {
    ((__cxx_lvalue_1) => { const previous = __cxx_lvalue_1.value; const next = i32((previous + 1)); __cxx_lvalue_1.value = next; return previous; })(__cxx_global_cell_a9ed12f504f4bd101d4746c6());
    C_ReportError((-1));
    ((i32(-2) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-2), __cxx_literal_37f9d38e275000f1b4e3, u32(989), __cxx_literal_02762d65b33757c06896, g_scriptFileName, __cxx_global_cell_06245cf7a06b2fd69750f440().value, pszLabel, 26));
    return;
  }
  let i = i32(hash_find(__cxx_global_cell_f0457d06edefc3c775e2c32f().value, pszLabel));
  if (((i >= 0) && (!Boolean(u64((BigInt((cPointerElementRef(cRecordPointer(aGameArrays, {"align": 1, "arrayAlign": 1, "fields": {"flags": {"native": "BigUint64Array", "offset": 24, "size": 8}, "pValues": {"offset": 8, "pointer": true, "size": 8}, "size": {"native": "BigInt64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {}), i).value).flags) & BigInt(u64(8)))))))) {
    ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i32((previous + 1)); __cxx_lvalue_2.value = next; return previous; })(__cxx_global_cell_778291b6375dd09957e56c1b());
    C_ReportError(i32(23));
    return;
  }
  (i = i32(__cxx_global_cell_312b58e8a14f852e3cc5e7e0().value));
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
const __cxx_literal_d0c72f9dfd4e081f0d88 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 118, 97, 114, 115, 46, 99, 112, 112, 0]);
const __cxx_literal_be1ef99e01721f52a38e = Uint8Array.from([37, 115, 58, 37, 100, 58, 32, 116, 111, 111, 32, 109, 97, 110, 121, 32, 103, 97, 109, 101, 118, 97, 114, 115, 32, 100, 101, 102, 105, 110, 101, 100, 33, 0]);
const __cxx_literal_4c4e8c16cf7bd2207ee4 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 118, 97, 114, 115, 46, 99, 112, 112, 0]);
const __cxx_literal_f919704650f962c98a32 = Uint8Array.from([37, 115, 58, 37, 100, 58, 32, 118, 97, 114, 105, 97, 98, 108, 101, 32, 110, 97, 109, 101, 32, 39, 37, 115, 39, 32, 101, 120, 99, 101, 101, 100, 115, 32, 108, 105, 109, 105, 116, 32, 111, 102, 32, 37, 100, 32, 99, 104, 97, 114, 97, 99, 116, 101, 114, 115, 46, 0]);
const __cxx_literal_370110b3d912050368b6 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 118, 97, 114, 115, 46, 99, 112, 112, 0]);
const __cxx_literal_557c9847d3a039c0ae4c = Uint8Array.from([37, 115, 58, 37, 100, 58, 32, 99, 97, 110, 110, 111, 116, 32, 114, 101, 100, 101, 102, 105, 110, 101, 32, 105, 110, 116, 101, 114, 110, 97, 108, 32, 103, 97, 109, 101, 118, 97, 114, 32, 39, 37, 115, 39, 46, 0]);
export function Gv_NewVar(pszLabel, lValue, dwFlags) {
  if ((__cxx_global_cell_8406f8e86b0ce3102350571c().value >= 2048)) {
    ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(__cxx_global_cell_a9ed12f504f4bd101d4746c6());
    C_ReportError((-1));
    ((i32(-2) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-2), __cxx_literal_d0c72f9dfd4e081f0d88, u32(1046), __cxx_literal_be1ef99e01721f52a38e, g_scriptFileName, __cxx_global_cell_06245cf7a06b2fd69750f440().value));
    return;
  }
  if ((strlen(pszLabel) > u64(i32((26 - 1))))) {
    ((__cxx_lvalue_1) => { const previous = __cxx_lvalue_1.value; const next = i32((previous + 1)); __cxx_lvalue_1.value = next; return previous; })(__cxx_global_cell_a9ed12f504f4bd101d4746c6());
    C_ReportError((-1));
    ((i32(-2) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-2), __cxx_literal_4c4e8c16cf7bd2207ee4, u32(1054), __cxx_literal_f919704650f962c98a32, g_scriptFileName, __cxx_global_cell_06245cf7a06b2fd69750f440().value, pszLabel, 26));
    return;
  }
  let gV = i32(hash_find(__cxx_global_cell_2d12a4ce62b5a2309382b8ea().value, pszLabel));
  if (((gV >= 0) && (!Boolean(u64((BigInt((cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), gV).value).flags) & BigInt(u64(8)))))))) {
    if (Boolean(u64((BigInt((cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), gV).value).flags) & BigInt(u64(1351680)))))) {
      C_ReportError((-1));
      ((i32(-1) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-1), __cxx_literal_370110b3d912050368b6, u32(1066), __cxx_literal_557c9847d3a039c0ae4c, g_scriptFileName, __cxx_global_cell_06245cf7a06b2fd69750f440().value, cPointerOffset(__cxx_global_cell_1aca80e8b55c802f7b43740d().value, i32((__cxx_global_cell_6742302ef915e025d82bcd36().value << 6)), Uint8Array.BYTES_PER_ELEMENT)));
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
    (gV = i32(__cxx_global_cell_8406f8e86b0ce3102350571c().value));
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
  if ((gV == __cxx_global_cell_8406f8e86b0ce3102350571c().value)) {
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

// C/C++ source: source/duke3d/src/gamevars.cpp:1374
export function Gv_SetVar__cxx_3507c00cfaa8(gameVar, newValue) {
  setvar__(gameVar, newValue, __cxx_global_cell_5bce98f73f3ed0c837f2729e().value.spriteNum, __cxx_global_cell_5bce98f73f3ed0c837f2729e().value.playerNum);
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

// C/C++ source: source/duke3d/src/gamevars.cpp:1675
const __cxx_literal_560cf61721e81f0a2fde = Uint8Array.from([115, 112, 114, 105, 116, 101, 0]);
const __cxx_literal_359f2807c71689272e3d = Uint8Array.from([95, 95, 115, 112, 114, 105, 116, 101, 95, 95, 0]);
const __cxx_literal_87125c3483bcacd8f945 = Uint8Array.from([95, 95, 97, 99, 116, 111, 114, 95, 95, 0]);
const __cxx_literal_2c4c565706dfd2628462 = Uint8Array.from([95, 95, 115, 112, 114, 105, 116, 101, 101, 120, 116, 95, 95, 0]);
const __cxx_literal_0bf4ff5b985c4102937a = Uint8Array.from([115, 101, 99, 116, 111, 114, 0]);
const __cxx_literal_7b549b1f8becf8927489 = Uint8Array.from([95, 95, 115, 101, 99, 116, 111, 114, 95, 95, 0]);
const __cxx_literal_75c5f6cfe9a1863928d4 = Uint8Array.from([119, 97, 108, 108, 0]);
const __cxx_literal_1cab742d0a4c512f83aa = Uint8Array.from([95, 95, 119, 97, 108, 108, 95, 95, 0]);
const __cxx_literal_d3dd95d09863eda6408b = Uint8Array.from([112, 108, 97, 121, 101, 114, 0]);
const __cxx_literal_c2e8fc6d7bc8e48ff301 = Uint8Array.from([95, 95, 112, 108, 97, 121, 101, 114, 95, 95, 0]);
const __cxx_literal_ffb020f3acd06c0232a9 = Uint8Array.from([97, 99, 116, 111, 114, 118, 97, 114, 0]);
const __cxx_literal_980488cab6293ee2d5e7 = Uint8Array.from([112, 108, 97, 121, 101, 114, 118, 97, 114, 0]);
const __cxx_literal_ddcc181d2576d0d3bc48 = Uint8Array.from([116, 115, 112, 114, 0]);
const __cxx_literal_1187bb4e7034a0db6e51 = Uint8Array.from([112, 114, 111, 106, 101, 99, 116, 105, 108, 101, 0]);
const __cxx_literal_158cbdd7d447fac99140 = Uint8Array.from([116, 104, 105, 115, 112, 114, 111, 106, 101, 99, 116, 105, 108, 101, 0]);
const __cxx_literal_94274a13090c6323235a = Uint8Array.from([117, 115, 101, 114, 100, 101, 102, 0]);
const __cxx_literal_32fbcdd3c72dd50e13f7 = Uint8Array.from([105, 110, 112, 117, 116, 0]);
const __cxx_literal_946a694cb8f1b7b25ae5 = Uint8Array.from([116, 105, 108, 101, 100, 97, 116, 97, 0]);
const __cxx_literal_7b17f403e8f6e852d169 = Uint8Array.from([112, 97, 108, 100, 97, 116, 97, 0]);
const __cxx_literal_d130342c5c80e1f11796 = Uint8Array.from([87, 69, 65, 80, 79, 78, 37, 100, 95, 67, 108, 105, 112, 0]);
const __cxx_literal_2d6f91951342112f6a49 = Uint8Array.from([87, 69, 65, 80, 79, 78, 37, 100, 95, 70, 105, 114, 101, 68, 101, 108, 97, 121, 0]);
const __cxx_literal_343642e590a1a0d229cb = Uint8Array.from([87, 69, 65, 80, 79, 78, 37, 100, 95, 70, 105, 114, 101, 83, 111, 117, 110, 100, 0]);
const __cxx_literal_76c138ca5593d6207186 = Uint8Array.from([87, 69, 65, 80, 79, 78, 37, 100, 95, 70, 108, 97, 103, 115, 0]);
const __cxx_literal_a623111eaaf6a68e631b = Uint8Array.from([87, 69, 65, 80, 79, 78, 37, 100, 95, 70, 108, 97, 115, 104, 67, 111, 108, 111, 114, 0]);
const __cxx_literal_e02e5abca4eab22942a2 = Uint8Array.from([87, 69, 65, 80, 79, 78, 37, 100, 95, 72, 111, 108, 100, 68, 101, 108, 97, 121, 0]);
const __cxx_literal_4449f48d4adf24fd9aa6 = Uint8Array.from([87, 69, 65, 80, 79, 78, 37, 100, 95, 73, 110, 105, 116, 105, 97, 108, 83, 111, 117, 110, 100, 0]);
const __cxx_literal_c9fc837c9fe1f7f8a7f1 = Uint8Array.from([87, 69, 65, 80, 79, 78, 37, 100, 95, 82, 101, 108, 111, 97, 100, 0]);
const __cxx_literal_dcff78fc91463a0ecd25 = Uint8Array.from([87, 69, 65, 80, 79, 78, 37, 100, 95, 82, 101, 108, 111, 97, 100, 83, 111, 117, 110, 100, 49, 0]);
const __cxx_literal_fb0efd074c9d145280b2 = Uint8Array.from([87, 69, 65, 80, 79, 78, 37, 100, 95, 82, 101, 108, 111, 97, 100, 83, 111, 117, 110, 100, 50, 0]);
const __cxx_literal_de935af36abd33356df1 = Uint8Array.from([87, 69, 65, 80, 79, 78, 37, 100, 95, 83, 101, 108, 101, 99, 116, 83, 111, 117, 110, 100, 0]);
const __cxx_literal_889721cd6245741519a9 = Uint8Array.from([87, 69, 65, 80, 79, 78, 37, 100, 95, 83, 104, 111, 111, 116, 115, 0]);
const __cxx_literal_ae2d488b9b57fcdf1436 = Uint8Array.from([87, 69, 65, 80, 79, 78, 37, 100, 95, 83, 104, 111, 116, 115, 80, 101, 114, 66, 117, 114, 115, 116, 0]);
const __cxx_literal_f4580de47bf96f7922af = Uint8Array.from([87, 69, 65, 80, 79, 78, 37, 100, 95, 83, 111, 117, 110, 100, 50, 83, 111, 117, 110, 100, 0]);
const __cxx_literal_3bfd4be7cf322bb66e76 = Uint8Array.from([87, 69, 65, 80, 79, 78, 37, 100, 95, 83, 111, 117, 110, 100, 50, 84, 105, 109, 101, 0]);
const __cxx_literal_296d4f2f0e62f11b01fe = Uint8Array.from([87, 69, 65, 80, 79, 78, 37, 100, 95, 83, 112, 97, 119, 110, 0]);
const __cxx_literal_413dba4f23fce83c2681 = Uint8Array.from([87, 69, 65, 80, 79, 78, 37, 100, 95, 83, 112, 97, 119, 110, 84, 105, 109, 101, 0]);
const __cxx_literal_bdb9697f0b4fc1100b5b = Uint8Array.from([87, 69, 65, 80, 79, 78, 37, 100, 95, 84, 111, 116, 97, 108, 84, 105, 109, 101, 0]);
const __cxx_literal_3d3580e93fc7f1174768 = Uint8Array.from([87, 69, 65, 80, 79, 78, 37, 100, 95, 87, 111, 114, 107, 115, 76, 105, 107, 101, 0]);
const __cxx_literal_e17423e67fc0d33a7a05 = Uint8Array.from([71, 82, 69, 78, 65, 68, 69, 95, 76, 73, 70, 69, 84, 73, 77, 69, 0]);
const __cxx_literal_ca4bc8655da932edfb7c = Uint8Array.from([71, 82, 69, 78, 65, 68, 69, 95, 76, 73, 70, 69, 84, 73, 77, 69, 95, 86, 65, 82, 0]);
const __cxx_literal_2952b5c703d2409d6501 = Uint8Array.from([80, 73, 80, 69, 66, 79, 77, 66, 95, 67, 79, 78, 84, 82, 79, 76, 0]);
const __cxx_literal_6f146f1d4904a8d78b62 = Uint8Array.from([83, 84, 73, 67, 75, 89, 66, 79, 77, 66, 95, 76, 73, 70, 69, 84, 73, 77, 69, 0]);
const __cxx_literal_3d5a10ab6093a07aadc5 = Uint8Array.from([83, 84, 73, 67, 75, 89, 66, 79, 77, 66, 95, 76, 73, 70, 69, 84, 73, 77, 69, 95, 86, 65, 82, 0]);
const __cxx_literal_9f1e40e8452e64fcced2 = Uint8Array.from([84, 82, 73, 80, 66, 79, 77, 66, 95, 67, 79, 78, 84, 82, 79, 76, 0]);
const __cxx_literal_a937ace98b4062ad2a31 = Uint8Array.from([65, 78, 71, 82, 65, 78, 71, 69, 0]);
const __cxx_literal_4c181f0223c2dce56755 = Uint8Array.from([65, 85, 84, 79, 65, 73, 77, 65, 78, 71, 76, 69, 0]);
const __cxx_literal_31355655622610f56b7a = Uint8Array.from([67, 79, 79, 80, 0]);
const __cxx_literal_68f5dd80e343963b1ec6 = Uint8Array.from([70, 70, 73, 82, 69, 0]);
const __cxx_literal_b93eab313fb8615c7db4 = Uint8Array.from([72, 73, 84, 65, 71, 0]);
const __cxx_literal_550703c79a68f5c52ddf = Uint8Array.from([76, 69, 86, 69, 76, 0]);
const __cxx_literal_ea15bbabd4ee4fbf4c6f = Uint8Array.from([76, 79, 84, 65, 71, 0]);
const __cxx_literal_190b834b600267c1d630 = Uint8Array.from([77, 65, 82, 75, 69, 82, 0]);
const __cxx_literal_fb699ed5f1252ec5ad87 = Uint8Array.from([77, 79, 78, 83, 84, 69, 82, 83, 95, 79, 70, 70, 0]);
const __cxx_literal_1e6c6d182df3d86a5ab8 = Uint8Array.from([77, 85, 76, 84, 73, 77, 79, 68, 69, 0]);
const __cxx_literal_3196d42fee47f4dc5882 = Uint8Array.from([78, 85, 77, 83, 69, 67, 84, 79, 82, 83, 0]);
const __cxx_literal_daaddbd9e49c45e81440 = Uint8Array.from([78, 85, 77, 87, 65, 76, 76, 83, 0]);
const __cxx_literal_d98589519abfb27270f9 = Uint8Array.from([78, 117, 109, 115, 112, 114, 105, 116, 101, 115, 0]);
const __cxx_literal_459ab570ae50026c01d7 = Uint8Array.from([82, 69, 83, 80, 65, 87, 78, 95, 73, 78, 86, 69, 78, 84, 79, 82, 89, 0]);
const __cxx_literal_0a18cc2463a83bfa0bb3 = Uint8Array.from([82, 69, 83, 80, 65, 87, 78, 95, 73, 84, 69, 77, 83, 0]);
const __cxx_literal_ab2361bcaf1d2df0a12f = Uint8Array.from([82, 69, 83, 80, 65, 87, 78, 95, 77, 79, 78, 83, 84, 69, 82, 83, 0]);
const __cxx_literal_ae1e5821b72ee65037ab = Uint8Array.from([82, 69, 84, 85, 82, 78, 0]);
const __cxx_literal_224e9612e796f8616ea7 = Uint8Array.from([84, 69, 88, 84, 85, 82, 69, 0]);
const __cxx_literal_0c493730c6b251512596 = Uint8Array.from([84, 72, 73, 83, 65, 67, 84, 79, 82, 0]);
const __cxx_literal_c465044d0ddd29e3ebc3 = Uint8Array.from([86, 79, 76, 85, 77, 69, 0]);
const __cxx_literal_f76d3cc93e9b2616d5b0 = Uint8Array.from([87, 69, 65, 80, 79, 78, 0]);
const __cxx_literal_cb87f2ad7cf8230f8ecc = Uint8Array.from([87, 79, 82, 75, 83, 76, 73, 75, 69, 0]);
const __cxx_literal_2863df4f46ce2ea1c8cf = Uint8Array.from([90, 82, 65, 78, 71, 69, 0]);
const __cxx_literal_767e95ff20d649a71ca0 = Uint8Array.from([97, 117, 116, 111, 109, 97, 112, 112, 105, 110, 103, 0]);
const __cxx_literal_4b43b8cdf651ad976537 = Uint8Array.from([99, 97, 109, 101, 114, 97, 97, 110, 103, 0]);
const __cxx_literal_0046af65899e85b12b1f = Uint8Array.from([99, 97, 109, 101, 114, 97, 99, 108, 111, 99, 107, 0]);
const __cxx_literal_66df458de1e5ff4ba35f = Uint8Array.from([99, 97, 109, 101, 114, 97, 100, 105, 115, 116, 0]);
const __cxx_literal_4dc4203d8413880f18b4 = Uint8Array.from([99, 97, 109, 101, 114, 97, 104, 111, 114, 105, 122, 0]);
const __cxx_literal_e4e413560f4afc3e2471 = Uint8Array.from([99, 97, 109, 101, 114, 97, 113, 49, 54, 97, 110, 103, 0]);
const __cxx_literal_df322f0773e2da9c40cf = Uint8Array.from([99, 97, 109, 101, 114, 97, 113, 49, 54, 104, 111, 114, 105, 122, 0]);
const __cxx_literal_76db0ca911ea010d33ce = Uint8Array.from([99, 97, 109, 101, 114, 97, 115, 101, 99, 116, 0]);
const __cxx_literal_ebd73e6042490a6bb565 = Uint8Array.from([99, 97, 109, 101, 114, 97, 120, 0]);
const __cxx_literal_fa1a37f9f6058ec77ea4 = Uint8Array.from([99, 97, 109, 101, 114, 97, 121, 0]);
const __cxx_literal_0fa723f710aeeadd5b10 = Uint8Array.from([99, 97, 109, 101, 114, 97, 122, 0]);
const __cxx_literal_26b37f6016bf80682ee9 = Uint8Array.from([99, 117, 114, 114, 101, 110, 116, 95, 109, 101, 110, 117, 0]);
const __cxx_literal_2208ca007bd773eae95d = Uint8Array.from([99, 117, 114, 114, 101, 110, 116, 119, 101, 97, 112, 111, 110, 0]);
const __cxx_literal_7bb6ba0e5d59448eca45 = Uint8Array.from([100, 105, 115, 112, 108, 97, 121, 95, 109, 105, 114, 114, 111, 114, 0]);
const __cxx_literal_90892e3eab70b8da9f05 = Uint8Array.from([102, 114, 97, 109, 101, 114, 97, 116, 101, 0]);
const __cxx_literal_c59e4eea532229701bc5 = Uint8Array.from([103, 97, 109, 101, 116, 121, 112, 101, 95, 102, 108, 97, 103, 115, 0]);
const __cxx_literal_a4ad0101227c9e63fd80 = Uint8Array.from([103, 114, 97, 118, 105, 116, 97, 116, 105, 111, 110, 97, 108, 99, 111, 110, 115, 116, 97, 110, 116, 0]);
const __cxx_literal_e60327195a3ccdabf4a4 = Uint8Array.from([103, 115, 0]);
const __cxx_literal_d2ecb73f08e6f46c3a80 = Uint8Array.from([103, 117, 110, 95, 112, 111, 115, 0]);
const __cxx_literal_d630a3f22d46bcf6a3d8 = Uint8Array.from([108, 97, 115, 116, 115, 97, 118, 101, 112, 111, 115, 0]);
const __cxx_literal_509314da1458426e6378 = Uint8Array.from([108, 97, 115, 116, 118, 105, 115, 105, 110, 99, 0]);
const __cxx_literal_34507ef131c08c5fdd15 = Uint8Array.from([108, 111, 111, 107, 105, 110, 103, 95, 97, 110, 103, 83, 82, 49, 0]);
const __cxx_literal_cd3bc93060f8502a8637 = Uint8Array.from([108, 111, 111, 107, 105, 110, 103, 95, 97, 114, 99, 0]);
const __cxx_literal_2afa5ff9c401329ab77f = Uint8Array.from([109, 121, 99, 111, 110, 110, 101, 99, 116, 105, 110, 100, 101, 120, 0]);
const __cxx_literal_3b781a05bbe5e9087a9b = Uint8Array.from([110, 117, 109, 112, 108, 97, 121, 101, 114, 115, 0]);
const __cxx_literal_2019792425a4823108c8 = Uint8Array.from([110, 117, 109, 115, 101, 99, 116, 111, 114, 115, 0]);
const __cxx_literal_4bfc9e9efd53743eb591 = Uint8Array.from([114, 97, 110, 100, 111, 109, 115, 101, 101, 100, 0]);
const __cxx_literal_3bdc13c6e15c80937baf = Uint8Array.from([115, 99, 114, 101, 101, 110, 112, 101, 101, 107, 0]);
const __cxx_literal_b8fd792d8c9529a2d829 = Uint8Array.from([116, 111, 116, 97, 108, 99, 108, 111, 99, 107, 0]);
const __cxx_literal_19f0e5077d9eefefe918 = Uint8Array.from([118, 105, 101, 119, 105, 110, 103, 114, 97, 110, 103, 101, 0]);
const __cxx_literal_64ea75e64ef7039e84f1 = Uint8Array.from([119, 101, 97, 112, 111, 110, 95, 120, 111, 102, 102, 115, 101, 116, 0]);
const __cxx_literal_a78dda9d6faaeec99c16 = Uint8Array.from([119, 101, 97, 112, 111, 110, 99, 111, 117, 110, 116, 0]);
const __cxx_literal_ebe62dcf7e8c11600f3d = Uint8Array.from([119, 105, 110, 100, 111, 119, 120, 49, 0]);
const __cxx_literal_e692d08c7a0fccb75ee5 = Uint8Array.from([119, 105, 110, 100, 111, 119, 120, 50, 0]);
const __cxx_literal_4ead0a4e7fc4a4997ca4 = Uint8Array.from([119, 105, 110, 100, 111, 119, 121, 49, 0]);
const __cxx_literal_8c9812f6580cc35365b6 = Uint8Array.from([119, 105, 110, 100, 111, 119, 121, 50, 0]);
const __cxx_literal_63412c73a210634032a9 = Uint8Array.from([120, 100, 105, 109, 0]);
const __cxx_literal_a6797beecbcbd5f895b5 = Uint8Array.from([121, 100, 105, 109, 0]);
const __cxx_literal_31062437e69c153a539c = Uint8Array.from([121, 120, 97, 115, 112, 101, 99, 116, 0]);
const __cxx_literal_3d0030233eb06cfeca59 = Uint8Array.from([114, 101, 110, 100, 109, 111, 100, 101, 0]);
const __cxx_literal_18cb9da2d5f1f3e69c12 = Uint8Array.from([103, 111, 116, 112, 105, 99, 0]);
const __cxx_literal_8c24e1fb9efcbabc1fbd = Uint8Array.from([103, 111, 116, 115, 101, 99, 116, 111, 114, 0]);
const __cxx_literal_096c4ea92c5dc802f5b8 = Uint8Array.from([114, 97, 100, 105, 117, 115, 100, 109, 103, 115, 116, 97, 116, 110, 117, 109, 115, 0]);
const __cxx_literal_266f6bdd2ed6e57e5756 = Uint8Array.from([115, 104, 111, 119, 50, 100, 115, 101, 99, 116, 111, 114, 0]);
const __cxx_literal_bd164fed14f70bdd234d = Uint8Array.from([116, 105, 108, 101, 115, 105, 122, 120, 0]);
const __cxx_literal_1492c803c24736303120 = Uint8Array.from([116, 105, 108, 101, 115, 105, 122, 121, 0]);
export function Gv_AddSystemVars() {
  Gv_NewVar(__cxx_literal_560cf61721e81f0a2fde, i64((-1)), u32(i32((i32((i32(4096) | i32(2048))) | i32(262144)))));
  Gv_NewVar(__cxx_literal_359f2807c71689272e3d, i64((-1)), u32(i32((i32((i32(4096) | i32(2048))) | i32(262144)))));
  Gv_NewVar(__cxx_literal_87125c3483bcacd8f945, i64((-1)), u32(i32((i32((i32(4096) | i32(2048))) | i32(262144)))));
  Gv_NewVar(__cxx_literal_2c4c565706dfd2628462, i64((-1)), u32(i32((i32((i32(4096) | i32(2048))) | i32(262144)))));
  Gv_NewVar(__cxx_literal_0bf4ff5b985c4102937a, i64((-1)), u32(i32((i32((i32(4096) | i32(2048))) | i32(262144)))));
  Gv_NewVar(__cxx_literal_7b549b1f8becf8927489, i64((-1)), u32(i32((i32((i32(4096) | i32(2048))) | i32(262144)))));
  Gv_NewVar(__cxx_literal_75c5f6cfe9a1863928d4, i64((-1)), u32(i32((i32((i32(4096) | i32(2048))) | i32(262144)))));
  Gv_NewVar(__cxx_literal_1cab742d0a4c512f83aa, i64((-1)), u32(i32((i32((i32(4096) | i32(2048))) | i32(262144)))));
  Gv_NewVar(__cxx_literal_d3dd95d09863eda6408b, i64((-1)), u32(i32((i32((i32(4096) | i32(2048))) | i32(262144)))));
  Gv_NewVar(__cxx_literal_c2e8fc6d7bc8e48ff301, i64((-1)), u32(i32((i32((i32(4096) | i32(2048))) | i32(262144)))));
  Gv_NewVar(__cxx_literal_ffb020f3acd06c0232a9, i64((-1)), u32(i32((i32((i32(4096) | i32(2048))) | i32(262144)))));
  Gv_NewVar(__cxx_literal_980488cab6293ee2d5e7, i64((-1)), u32(i32((i32((i32(4096) | i32(2048))) | i32(262144)))));
  Gv_NewVar(__cxx_literal_ddcc181d2576d0d3bc48, i64((-1)), u32(i32((i32((i32(4096) | i32(2048))) | i32(262144)))));
  Gv_NewVar(__cxx_literal_1187bb4e7034a0db6e51, i64((-1)), u32(i32((i32((i32(4096) | i32(2048))) | i32(262144)))));
  Gv_NewVar(__cxx_literal_158cbdd7d447fac99140, i64((-1)), u32(i32((i32((i32(4096) | i32(2048))) | i32(262144)))));
  Gv_NewVar(__cxx_literal_94274a13090c6323235a, i64((-1)), u32(i32((i32((i32(4096) | i32(2048))) | i32(262144)))));
  Gv_NewVar(__cxx_literal_32fbcdd3c72dd50e13f7, i64((-1)), u32(i32((i32((i32(4096) | i32(2048))) | i32(262144)))));
  Gv_NewVar(__cxx_literal_946a694cb8f1b7b25ae5, i64((-1)), u32(i32((i32((i32(4096) | i32(2048))) | i32(262144)))));
  Gv_NewVar(__cxx_literal_7b17f403e8f6e852d169, i64((-1)), u32(i32((i32((i32(4096) | i32(2048))) | i32(262144)))));
  if (Boolean(i32((__cxx_global_cell_c0e288040dbf9a805036c27d().value & i32((2 | 8)))))) {
    ((cPointerElementRef(cRecordPointer(weapondefaults, {"align": 4, "arrayAlign": 1, "fields": {"Clip": {"native": "Int32Array", "offset": 4, "size": 4}, "FireDelay": {"native": "Int32Array", "offset": 12, "size": 4}, "FireSound": {"native": "Int32Array", "offset": 48, "size": 4}, "Flags": {"native": "Int32Array", "offset": 24, "size": 4}, "FlashColor": {"native": "Int32Array", "offset": 72, "size": 4}, "HoldDelay": {"native": "Int32Array", "offset": 20, "size": 4}, "InitialSound": {"native": "Int32Array", "offset": 44, "size": 4}, "Reload": {"native": "Int32Array", "offset": 8, "size": 4}, "ReloadSound1": {"native": "Int32Array", "offset": 60, "size": 4}, "ReloadSound2": {"native": "Int32Array", "offset": 64, "size": 4}, "SelectSound": {"native": "Int32Array", "offset": 68, "size": 4}, "Shoots": {"native": "Int32Array", "offset": 28, "size": 4}, "ShotsPerBurst": {"native": "Int32Array", "offset": 40, "size": 4}, "Sound2Sound": {"native": "Int32Array", "offset": 56, "size": 4}, "Sound2Time": {"native": "Int32Array", "offset": 52, "size": 4}, "Spawn": {"native": "Int32Array", "offset": 36, "size": 4}, "SpawnTime": {"native": "Int32Array", "offset": 32, "size": 4}, "TotalTime": {"native": "Int32Array", "offset": 16, "size": 4}, "WorksLike": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 76, "union": false}, {}), 1).value).Clip = i32(20));
    ((cPointerElementRef(cRecordPointer(weapondefaults, {"align": 4, "arrayAlign": 1, "fields": {"Clip": {"native": "Int32Array", "offset": 4, "size": 4}, "FireDelay": {"native": "Int32Array", "offset": 12, "size": 4}, "FireSound": {"native": "Int32Array", "offset": 48, "size": 4}, "Flags": {"native": "Int32Array", "offset": 24, "size": 4}, "FlashColor": {"native": "Int32Array", "offset": 72, "size": 4}, "HoldDelay": {"native": "Int32Array", "offset": 20, "size": 4}, "InitialSound": {"native": "Int32Array", "offset": 44, "size": 4}, "Reload": {"native": "Int32Array", "offset": 8, "size": 4}, "ReloadSound1": {"native": "Int32Array", "offset": 60, "size": 4}, "ReloadSound2": {"native": "Int32Array", "offset": 64, "size": 4}, "SelectSound": {"native": "Int32Array", "offset": 68, "size": 4}, "Shoots": {"native": "Int32Array", "offset": 28, "size": 4}, "ShotsPerBurst": {"native": "Int32Array", "offset": 40, "size": 4}, "Sound2Sound": {"native": "Int32Array", "offset": 56, "size": 4}, "Sound2Time": {"native": "Int32Array", "offset": 52, "size": 4}, "Spawn": {"native": "Int32Array", "offset": 36, "size": 4}, "SpawnTime": {"native": "Int32Array", "offset": 32, "size": 4}, "TotalTime": {"native": "Int32Array", "offset": 16, "size": 4}, "WorksLike": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 76, "union": false}, {}), 1).value).Reload = i32(50));
    ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = i32((__cxx_lvalue_0.value | i32(1)))))(cObjectFieldRef((cPointerElementRef(cRecordPointer(weapondefaults, {"align": 4, "arrayAlign": 1, "fields": {"Clip": {"native": "Int32Array", "offset": 4, "size": 4}, "FireDelay": {"native": "Int32Array", "offset": 12, "size": 4}, "FireSound": {"native": "Int32Array", "offset": 48, "size": 4}, "Flags": {"native": "Int32Array", "offset": 24, "size": 4}, "FlashColor": {"native": "Int32Array", "offset": 72, "size": 4}, "HoldDelay": {"native": "Int32Array", "offset": 20, "size": 4}, "InitialSound": {"native": "Int32Array", "offset": 44, "size": 4}, "Reload": {"native": "Int32Array", "offset": 8, "size": 4}, "ReloadSound1": {"native": "Int32Array", "offset": 60, "size": 4}, "ReloadSound2": {"native": "Int32Array", "offset": 64, "size": 4}, "SelectSound": {"native": "Int32Array", "offset": 68, "size": 4}, "Shoots": {"native": "Int32Array", "offset": 28, "size": 4}, "ShotsPerBurst": {"native": "Int32Array", "offset": 40, "size": 4}, "Sound2Sound": {"native": "Int32Array", "offset": 56, "size": 4}, "Sound2Time": {"native": "Int32Array", "offset": 52, "size": 4}, "Spawn": {"native": "Int32Array", "offset": 36, "size": 4}, "SpawnTime": {"native": "Int32Array", "offset": 32, "size": 4}, "TotalTime": {"native": "Int32Array", "offset": 16, "size": 4}, "WorksLike": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 76, "union": false}, {}), 1).value), "Flags"));
    ((cPointerElementRef(cRecordPointer(weapondefaults, {"align": 4, "arrayAlign": 1, "fields": {"Clip": {"native": "Int32Array", "offset": 4, "size": 4}, "FireDelay": {"native": "Int32Array", "offset": 12, "size": 4}, "FireSound": {"native": "Int32Array", "offset": 48, "size": 4}, "Flags": {"native": "Int32Array", "offset": 24, "size": 4}, "FlashColor": {"native": "Int32Array", "offset": 72, "size": 4}, "HoldDelay": {"native": "Int32Array", "offset": 20, "size": 4}, "InitialSound": {"native": "Int32Array", "offset": 44, "size": 4}, "Reload": {"native": "Int32Array", "offset": 8, "size": 4}, "ReloadSound1": {"native": "Int32Array", "offset": 60, "size": 4}, "ReloadSound2": {"native": "Int32Array", "offset": 64, "size": 4}, "SelectSound": {"native": "Int32Array", "offset": 68, "size": 4}, "Shoots": {"native": "Int32Array", "offset": 28, "size": 4}, "ShotsPerBurst": {"native": "Int32Array", "offset": 40, "size": 4}, "Sound2Sound": {"native": "Int32Array", "offset": 56, "size": 4}, "Sound2Time": {"native": "Int32Array", "offset": 52, "size": 4}, "Spawn": {"native": "Int32Array", "offset": 36, "size": 4}, "SpawnTime": {"native": "Int32Array", "offset": 32, "size": 4}, "TotalTime": {"native": "Int32Array", "offset": 16, "size": 4}, "WorksLike": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 76, "union": false}, {}), 6).value).TotalTime = i32(30));
    ((cPointerElementRef(cRecordPointer(weapondefaults, {"align": 4, "arrayAlign": 1, "fields": {"Clip": {"native": "Int32Array", "offset": 4, "size": 4}, "FireDelay": {"native": "Int32Array", "offset": 12, "size": 4}, "FireSound": {"native": "Int32Array", "offset": 48, "size": 4}, "Flags": {"native": "Int32Array", "offset": 24, "size": 4}, "FlashColor": {"native": "Int32Array", "offset": 72, "size": 4}, "HoldDelay": {"native": "Int32Array", "offset": 20, "size": 4}, "InitialSound": {"native": "Int32Array", "offset": 44, "size": 4}, "Reload": {"native": "Int32Array", "offset": 8, "size": 4}, "ReloadSound1": {"native": "Int32Array", "offset": 60, "size": 4}, "ReloadSound2": {"native": "Int32Array", "offset": 64, "size": 4}, "SelectSound": {"native": "Int32Array", "offset": 68, "size": 4}, "Shoots": {"native": "Int32Array", "offset": 28, "size": 4}, "ShotsPerBurst": {"native": "Int32Array", "offset": 40, "size": 4}, "Sound2Sound": {"native": "Int32Array", "offset": 56, "size": 4}, "Sound2Time": {"native": "Int32Array", "offset": 52, "size": 4}, "Spawn": {"native": "Int32Array", "offset": 36, "size": 4}, "SpawnTime": {"native": "Int32Array", "offset": 32, "size": 4}, "TotalTime": {"native": "Int32Array", "offset": 16, "size": 4}, "WorksLike": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 76, "union": false}, {}), 11).value).TotalTime = i32(30));
    if (Boolean(i32((__cxx_global_cell_c0e288040dbf9a805036c27d().value & 8)))) {
      ((cPointerElementRef(cRecordPointer(weapondefaults, {"align": 4, "arrayAlign": 1, "fields": {"Clip": {"native": "Int32Array", "offset": 4, "size": 4}, "FireDelay": {"native": "Int32Array", "offset": 12, "size": 4}, "FireSound": {"native": "Int32Array", "offset": 48, "size": 4}, "Flags": {"native": "Int32Array", "offset": 24, "size": 4}, "FlashColor": {"native": "Int32Array", "offset": 72, "size": 4}, "HoldDelay": {"native": "Int32Array", "offset": 20, "size": 4}, "InitialSound": {"native": "Int32Array", "offset": 44, "size": 4}, "Reload": {"native": "Int32Array", "offset": 8, "size": 4}, "ReloadSound1": {"native": "Int32Array", "offset": 60, "size": 4}, "ReloadSound2": {"native": "Int32Array", "offset": 64, "size": 4}, "SelectSound": {"native": "Int32Array", "offset": 68, "size": 4}, "Shoots": {"native": "Int32Array", "offset": 28, "size": 4}, "ShotsPerBurst": {"native": "Int32Array", "offset": 40, "size": 4}, "Sound2Sound": {"native": "Int32Array", "offset": 56, "size": 4}, "Sound2Time": {"native": "Int32Array", "offset": 52, "size": 4}, "Spawn": {"native": "Int32Array", "offset": 36, "size": 4}, "SpawnTime": {"native": "Int32Array", "offset": 32, "size": 4}, "TotalTime": {"native": "Int32Array", "offset": 16, "size": 4}, "WorksLike": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 76, "union": false}, {}), 0).value).HoldDelay = i32(14));
      ((cPointerElementRef(cRecordPointer(weapondefaults, {"align": 4, "arrayAlign": 1, "fields": {"Clip": {"native": "Int32Array", "offset": 4, "size": 4}, "FireDelay": {"native": "Int32Array", "offset": 12, "size": 4}, "FireSound": {"native": "Int32Array", "offset": 48, "size": 4}, "Flags": {"native": "Int32Array", "offset": 24, "size": 4}, "FlashColor": {"native": "Int32Array", "offset": 72, "size": 4}, "HoldDelay": {"native": "Int32Array", "offset": 20, "size": 4}, "InitialSound": {"native": "Int32Array", "offset": 44, "size": 4}, "Reload": {"native": "Int32Array", "offset": 8, "size": 4}, "ReloadSound1": {"native": "Int32Array", "offset": 60, "size": 4}, "ReloadSound2": {"native": "Int32Array", "offset": 64, "size": 4}, "SelectSound": {"native": "Int32Array", "offset": 68, "size": 4}, "Shoots": {"native": "Int32Array", "offset": 28, "size": 4}, "ShotsPerBurst": {"native": "Int32Array", "offset": 40, "size": 4}, "Sound2Sound": {"native": "Int32Array", "offset": 56, "size": 4}, "Sound2Time": {"native": "Int32Array", "offset": 52, "size": 4}, "Spawn": {"native": "Int32Array", "offset": 36, "size": 4}, "SpawnTime": {"native": "Int32Array", "offset": 32, "size": 4}, "TotalTime": {"native": "Int32Array", "offset": 16, "size": 4}, "WorksLike": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 76, "union": false}, {}), 0).value).Reload = i32(30));
      ((__cxx_lvalue_1) => (__cxx_lvalue_1.value = i32((__cxx_lvalue_1.value | i32(4)))))(cObjectFieldRef((cPointerElementRef(cRecordPointer(weapondefaults, {"align": 4, "arrayAlign": 1, "fields": {"Clip": {"native": "Int32Array", "offset": 4, "size": 4}, "FireDelay": {"native": "Int32Array", "offset": 12, "size": 4}, "FireSound": {"native": "Int32Array", "offset": 48, "size": 4}, "Flags": {"native": "Int32Array", "offset": 24, "size": 4}, "FlashColor": {"native": "Int32Array", "offset": 72, "size": 4}, "HoldDelay": {"native": "Int32Array", "offset": 20, "size": 4}, "InitialSound": {"native": "Int32Array", "offset": 44, "size": 4}, "Reload": {"native": "Int32Array", "offset": 8, "size": 4}, "ReloadSound1": {"native": "Int32Array", "offset": 60, "size": 4}, "ReloadSound2": {"native": "Int32Array", "offset": 64, "size": 4}, "SelectSound": {"native": "Int32Array", "offset": 68, "size": 4}, "Shoots": {"native": "Int32Array", "offset": 28, "size": 4}, "ShotsPerBurst": {"native": "Int32Array", "offset": 40, "size": 4}, "Sound2Sound": {"native": "Int32Array", "offset": 56, "size": 4}, "Sound2Time": {"native": "Int32Array", "offset": 52, "size": 4}, "Spawn": {"native": "Int32Array", "offset": 36, "size": 4}, "SpawnTime": {"native": "Int32Array", "offset": 32, "size": 4}, "TotalTime": {"native": "Int32Array", "offset": 16, "size": 4}, "WorksLike": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 76, "union": false}, {}), 1).value), "Flags"));
      ((cPointerElementRef(cRecordPointer(weapondefaults, {"align": 4, "arrayAlign": 1, "fields": {"Clip": {"native": "Int32Array", "offset": 4, "size": 4}, "FireDelay": {"native": "Int32Array", "offset": 12, "size": 4}, "FireSound": {"native": "Int32Array", "offset": 48, "size": 4}, "Flags": {"native": "Int32Array", "offset": 24, "size": 4}, "FlashColor": {"native": "Int32Array", "offset": 72, "size": 4}, "HoldDelay": {"native": "Int32Array", "offset": 20, "size": 4}, "InitialSound": {"native": "Int32Array", "offset": 44, "size": 4}, "Reload": {"native": "Int32Array", "offset": 8, "size": 4}, "ReloadSound1": {"native": "Int32Array", "offset": 60, "size": 4}, "ReloadSound2": {"native": "Int32Array", "offset": 64, "size": 4}, "SelectSound": {"native": "Int32Array", "offset": 68, "size": 4}, "Shoots": {"native": "Int32Array", "offset": 28, "size": 4}, "ShotsPerBurst": {"native": "Int32Array", "offset": 40, "size": 4}, "Sound2Sound": {"native": "Int32Array", "offset": 56, "size": 4}, "Sound2Time": {"native": "Int32Array", "offset": 52, "size": 4}, "Spawn": {"native": "Int32Array", "offset": 36, "size": 4}, "SpawnTime": {"native": "Int32Array", "offset": 32, "size": 4}, "TotalTime": {"native": "Int32Array", "offset": 16, "size": 4}, "WorksLike": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 76, "union": false}, {}), 2).value).TotalTime = i32(31));
      ((cPointerElementRef(cRecordPointer(weapondefaults, {"align": 4, "arrayAlign": 1, "fields": {"Clip": {"native": "Int32Array", "offset": 4, "size": 4}, "FireDelay": {"native": "Int32Array", "offset": 12, "size": 4}, "FireSound": {"native": "Int32Array", "offset": 48, "size": 4}, "Flags": {"native": "Int32Array", "offset": 24, "size": 4}, "FlashColor": {"native": "Int32Array", "offset": 72, "size": 4}, "HoldDelay": {"native": "Int32Array", "offset": 20, "size": 4}, "InitialSound": {"native": "Int32Array", "offset": 44, "size": 4}, "Reload": {"native": "Int32Array", "offset": 8, "size": 4}, "ReloadSound1": {"native": "Int32Array", "offset": 60, "size": 4}, "ReloadSound2": {"native": "Int32Array", "offset": 64, "size": 4}, "SelectSound": {"native": "Int32Array", "offset": 68, "size": 4}, "Shoots": {"native": "Int32Array", "offset": 28, "size": 4}, "ShotsPerBurst": {"native": "Int32Array", "offset": 40, "size": 4}, "Sound2Sound": {"native": "Int32Array", "offset": 56, "size": 4}, "Sound2Time": {"native": "Int32Array", "offset": 52, "size": 4}, "Spawn": {"native": "Int32Array", "offset": 36, "size": 4}, "SpawnTime": {"native": "Int32Array", "offset": 32, "size": 4}, "TotalTime": {"native": "Int32Array", "offset": 16, "size": 4}, "WorksLike": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 76, "union": false}, {}), 3).value).FireDelay = i32(1));
      ((cPointerElementRef(cRecordPointer(weapondefaults, {"align": 4, "arrayAlign": 1, "fields": {"Clip": {"native": "Int32Array", "offset": 4, "size": 4}, "FireDelay": {"native": "Int32Array", "offset": 12, "size": 4}, "FireSound": {"native": "Int32Array", "offset": 48, "size": 4}, "Flags": {"native": "Int32Array", "offset": 24, "size": 4}, "FlashColor": {"native": "Int32Array", "offset": 72, "size": 4}, "HoldDelay": {"native": "Int32Array", "offset": 20, "size": 4}, "InitialSound": {"native": "Int32Array", "offset": 44, "size": 4}, "Reload": {"native": "Int32Array", "offset": 8, "size": 4}, "ReloadSound1": {"native": "Int32Array", "offset": 60, "size": 4}, "ReloadSound2": {"native": "Int32Array", "offset": 64, "size": 4}, "SelectSound": {"native": "Int32Array", "offset": 68, "size": 4}, "Shoots": {"native": "Int32Array", "offset": 28, "size": 4}, "ShotsPerBurst": {"native": "Int32Array", "offset": 40, "size": 4}, "Sound2Sound": {"native": "Int32Array", "offset": 56, "size": 4}, "Sound2Time": {"native": "Int32Array", "offset": 52, "size": 4}, "Spawn": {"native": "Int32Array", "offset": 36, "size": 4}, "SpawnTime": {"native": "Int32Array", "offset": 32, "size": 4}, "TotalTime": {"native": "Int32Array", "offset": 16, "size": 4}, "WorksLike": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 76, "union": false}, {}), 3).value).HoldDelay = i32(10));
      ((cPointerElementRef(cRecordPointer(weapondefaults, {"align": 4, "arrayAlign": 1, "fields": {"Clip": {"native": "Int32Array", "offset": 4, "size": 4}, "FireDelay": {"native": "Int32Array", "offset": 12, "size": 4}, "FireSound": {"native": "Int32Array", "offset": 48, "size": 4}, "Flags": {"native": "Int32Array", "offset": 24, "size": 4}, "FlashColor": {"native": "Int32Array", "offset": 72, "size": 4}, "HoldDelay": {"native": "Int32Array", "offset": 20, "size": 4}, "InitialSound": {"native": "Int32Array", "offset": 44, "size": 4}, "Reload": {"native": "Int32Array", "offset": 8, "size": 4}, "ReloadSound1": {"native": "Int32Array", "offset": 60, "size": 4}, "ReloadSound2": {"native": "Int32Array", "offset": 64, "size": 4}, "SelectSound": {"native": "Int32Array", "offset": 68, "size": 4}, "Shoots": {"native": "Int32Array", "offset": 28, "size": 4}, "ShotsPerBurst": {"native": "Int32Array", "offset": 40, "size": 4}, "Sound2Sound": {"native": "Int32Array", "offset": 56, "size": 4}, "Sound2Time": {"native": "Int32Array", "offset": 52, "size": 4}, "Spawn": {"native": "Int32Array", "offset": 36, "size": 4}, "SpawnTime": {"native": "Int32Array", "offset": 32, "size": 4}, "TotalTime": {"native": "Int32Array", "offset": 16, "size": 4}, "WorksLike": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 76, "union": false}, {}), 3).value).Reload = i32(30));
      ((cPointerElementRef(cRecordPointer(weapondefaults, {"align": 4, "arrayAlign": 1, "fields": {"Clip": {"native": "Int32Array", "offset": 4, "size": 4}, "FireDelay": {"native": "Int32Array", "offset": 12, "size": 4}, "FireSound": {"native": "Int32Array", "offset": 48, "size": 4}, "Flags": {"native": "Int32Array", "offset": 24, "size": 4}, "FlashColor": {"native": "Int32Array", "offset": 72, "size": 4}, "HoldDelay": {"native": "Int32Array", "offset": 20, "size": 4}, "InitialSound": {"native": "Int32Array", "offset": 44, "size": 4}, "Reload": {"native": "Int32Array", "offset": 8, "size": 4}, "ReloadSound1": {"native": "Int32Array", "offset": 60, "size": 4}, "ReloadSound2": {"native": "Int32Array", "offset": 64, "size": 4}, "SelectSound": {"native": "Int32Array", "offset": 68, "size": 4}, "Shoots": {"native": "Int32Array", "offset": 28, "size": 4}, "ShotsPerBurst": {"native": "Int32Array", "offset": 40, "size": 4}, "Sound2Sound": {"native": "Int32Array", "offset": 56, "size": 4}, "Sound2Time": {"native": "Int32Array", "offset": 52, "size": 4}, "Spawn": {"native": "Int32Array", "offset": 36, "size": 4}, "SpawnTime": {"native": "Int32Array", "offset": 32, "size": 4}, "TotalTime": {"native": "Int32Array", "offset": 16, "size": 4}, "WorksLike": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 76, "union": false}, {}), 3).value).SpawnTime = i32(0));
      ((cPointerElementRef(cRecordPointer(weapondefaults, {"align": 4, "arrayAlign": 1, "fields": {"Clip": {"native": "Int32Array", "offset": 4, "size": 4}, "FireDelay": {"native": "Int32Array", "offset": 12, "size": 4}, "FireSound": {"native": "Int32Array", "offset": 48, "size": 4}, "Flags": {"native": "Int32Array", "offset": 24, "size": 4}, "FlashColor": {"native": "Int32Array", "offset": 72, "size": 4}, "HoldDelay": {"native": "Int32Array", "offset": 20, "size": 4}, "InitialSound": {"native": "Int32Array", "offset": 44, "size": 4}, "Reload": {"native": "Int32Array", "offset": 8, "size": 4}, "ReloadSound1": {"native": "Int32Array", "offset": 60, "size": 4}, "ReloadSound2": {"native": "Int32Array", "offset": 64, "size": 4}, "SelectSound": {"native": "Int32Array", "offset": 68, "size": 4}, "Shoots": {"native": "Int32Array", "offset": 28, "size": 4}, "ShotsPerBurst": {"native": "Int32Array", "offset": 40, "size": 4}, "Sound2Sound": {"native": "Int32Array", "offset": 56, "size": 4}, "Sound2Time": {"native": "Int32Array", "offset": 52, "size": 4}, "Spawn": {"native": "Int32Array", "offset": 36, "size": 4}, "SpawnTime": {"native": "Int32Array", "offset": 32, "size": 4}, "TotalTime": {"native": "Int32Array", "offset": 16, "size": 4}, "WorksLike": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 76, "union": false}, {}), 4).value).Reload = i32(30));
      ((cPointerElementRef(cRecordPointer(weapondefaults, {"align": 4, "arrayAlign": 1, "fields": {"Clip": {"native": "Int32Array", "offset": 4, "size": 4}, "FireDelay": {"native": "Int32Array", "offset": 12, "size": 4}, "FireSound": {"native": "Int32Array", "offset": 48, "size": 4}, "Flags": {"native": "Int32Array", "offset": 24, "size": 4}, "FlashColor": {"native": "Int32Array", "offset": 72, "size": 4}, "HoldDelay": {"native": "Int32Array", "offset": 20, "size": 4}, "InitialSound": {"native": "Int32Array", "offset": 44, "size": 4}, "Reload": {"native": "Int32Array", "offset": 8, "size": 4}, "ReloadSound1": {"native": "Int32Array", "offset": 60, "size": 4}, "ReloadSound2": {"native": "Int32Array", "offset": 64, "size": 4}, "SelectSound": {"native": "Int32Array", "offset": 68, "size": 4}, "Shoots": {"native": "Int32Array", "offset": 28, "size": 4}, "ShotsPerBurst": {"native": "Int32Array", "offset": 40, "size": 4}, "Sound2Sound": {"native": "Int32Array", "offset": 56, "size": 4}, "Sound2Time": {"native": "Int32Array", "offset": 52, "size": 4}, "Spawn": {"native": "Int32Array", "offset": 36, "size": 4}, "SpawnTime": {"native": "Int32Array", "offset": 32, "size": 4}, "TotalTime": {"native": "Int32Array", "offset": 16, "size": 4}, "WorksLike": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 76, "union": false}, {}), 7).value).FireDelay = i32(2));
      ((cPointerElementRef(cRecordPointer(weapondefaults, {"align": 4, "arrayAlign": 1, "fields": {"Clip": {"native": "Int32Array", "offset": 4, "size": 4}, "FireDelay": {"native": "Int32Array", "offset": 12, "size": 4}, "FireSound": {"native": "Int32Array", "offset": 48, "size": 4}, "Flags": {"native": "Int32Array", "offset": 24, "size": 4}, "FlashColor": {"native": "Int32Array", "offset": 72, "size": 4}, "HoldDelay": {"native": "Int32Array", "offset": 20, "size": 4}, "InitialSound": {"native": "Int32Array", "offset": 44, "size": 4}, "Reload": {"native": "Int32Array", "offset": 8, "size": 4}, "ReloadSound1": {"native": "Int32Array", "offset": 60, "size": 4}, "ReloadSound2": {"native": "Int32Array", "offset": 64, "size": 4}, "SelectSound": {"native": "Int32Array", "offset": 68, "size": 4}, "Shoots": {"native": "Int32Array", "offset": 28, "size": 4}, "ShotsPerBurst": {"native": "Int32Array", "offset": 40, "size": 4}, "Sound2Sound": {"native": "Int32Array", "offset": 56, "size": 4}, "Sound2Time": {"native": "Int32Array", "offset": 52, "size": 4}, "Spawn": {"native": "Int32Array", "offset": 36, "size": 4}, "SpawnTime": {"native": "Int32Array", "offset": 32, "size": 4}, "TotalTime": {"native": "Int32Array", "offset": 16, "size": 4}, "WorksLike": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 76, "union": false}, {}), 7).value).Flags = i32(8));
      ((cPointerElementRef(cRecordPointer(weapondefaults, {"align": 4, "arrayAlign": 1, "fields": {"Clip": {"native": "Int32Array", "offset": 4, "size": 4}, "FireDelay": {"native": "Int32Array", "offset": 12, "size": 4}, "FireSound": {"native": "Int32Array", "offset": 48, "size": 4}, "Flags": {"native": "Int32Array", "offset": 24, "size": 4}, "FlashColor": {"native": "Int32Array", "offset": 72, "size": 4}, "HoldDelay": {"native": "Int32Array", "offset": 20, "size": 4}, "InitialSound": {"native": "Int32Array", "offset": 44, "size": 4}, "Reload": {"native": "Int32Array", "offset": 8, "size": 4}, "ReloadSound1": {"native": "Int32Array", "offset": 60, "size": 4}, "ReloadSound2": {"native": "Int32Array", "offset": 64, "size": 4}, "SelectSound": {"native": "Int32Array", "offset": 68, "size": 4}, "Shoots": {"native": "Int32Array", "offset": 28, "size": 4}, "ShotsPerBurst": {"native": "Int32Array", "offset": 40, "size": 4}, "Sound2Sound": {"native": "Int32Array", "offset": 56, "size": 4}, "Sound2Time": {"native": "Int32Array", "offset": 52, "size": 4}, "Spawn": {"native": "Int32Array", "offset": 36, "size": 4}, "SpawnTime": {"native": "Int32Array", "offset": 32, "size": 4}, "TotalTime": {"native": "Int32Array", "offset": 16, "size": 4}, "WorksLike": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 76, "union": false}, {}), 7).value).Reload = i32(30));
      ((cPointerElementRef(cRecordPointer(weapondefaults, {"align": 4, "arrayAlign": 1, "fields": {"Clip": {"native": "Int32Array", "offset": 4, "size": 4}, "FireDelay": {"native": "Int32Array", "offset": 12, "size": 4}, "FireSound": {"native": "Int32Array", "offset": 48, "size": 4}, "Flags": {"native": "Int32Array", "offset": 24, "size": 4}, "FlashColor": {"native": "Int32Array", "offset": 72, "size": 4}, "HoldDelay": {"native": "Int32Array", "offset": 20, "size": 4}, "InitialSound": {"native": "Int32Array", "offset": 44, "size": 4}, "Reload": {"native": "Int32Array", "offset": 8, "size": 4}, "ReloadSound1": {"native": "Int32Array", "offset": 60, "size": 4}, "ReloadSound2": {"native": "Int32Array", "offset": 64, "size": 4}, "SelectSound": {"native": "Int32Array", "offset": 68, "size": 4}, "Shoots": {"native": "Int32Array", "offset": 28, "size": 4}, "ShotsPerBurst": {"native": "Int32Array", "offset": 40, "size": 4}, "Sound2Sound": {"native": "Int32Array", "offset": 56, "size": 4}, "Sound2Time": {"native": "Int32Array", "offset": 52, "size": 4}, "Spawn": {"native": "Int32Array", "offset": 36, "size": 4}, "SpawnTime": {"native": "Int32Array", "offset": 32, "size": 4}, "TotalTime": {"native": "Int32Array", "offset": 16, "size": 4}, "WorksLike": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 76, "union": false}, {}), 7).value).ShotsPerBurst = i32(0));
      ((cPointerElementRef(cRecordPointer(weapondefaults, {"align": 4, "arrayAlign": 1, "fields": {"Clip": {"native": "Int32Array", "offset": 4, "size": 4}, "FireDelay": {"native": "Int32Array", "offset": 12, "size": 4}, "FireSound": {"native": "Int32Array", "offset": 48, "size": 4}, "Flags": {"native": "Int32Array", "offset": 24, "size": 4}, "FlashColor": {"native": "Int32Array", "offset": 72, "size": 4}, "HoldDelay": {"native": "Int32Array", "offset": 20, "size": 4}, "InitialSound": {"native": "Int32Array", "offset": 44, "size": 4}, "Reload": {"native": "Int32Array", "offset": 8, "size": 4}, "ReloadSound1": {"native": "Int32Array", "offset": 60, "size": 4}, "ReloadSound2": {"native": "Int32Array", "offset": 64, "size": 4}, "SelectSound": {"native": "Int32Array", "offset": 68, "size": 4}, "Shoots": {"native": "Int32Array", "offset": 28, "size": 4}, "ShotsPerBurst": {"native": "Int32Array", "offset": 40, "size": 4}, "Sound2Sound": {"native": "Int32Array", "offset": 56, "size": 4}, "Sound2Time": {"native": "Int32Array", "offset": 52, "size": 4}, "Spawn": {"native": "Int32Array", "offset": 36, "size": 4}, "SpawnTime": {"native": "Int32Array", "offset": 32, "size": 4}, "TotalTime": {"native": "Int32Array", "offset": 16, "size": 4}, "WorksLike": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 76, "union": false}, {}), 7).value).TotalTime = i32(5));
      ((cPointerElementRef(cRecordPointer(weapondefaults, {"align": 4, "arrayAlign": 1, "fields": {"Clip": {"native": "Int32Array", "offset": 4, "size": 4}, "FireDelay": {"native": "Int32Array", "offset": 12, "size": 4}, "FireSound": {"native": "Int32Array", "offset": 48, "size": 4}, "Flags": {"native": "Int32Array", "offset": 24, "size": 4}, "FlashColor": {"native": "Int32Array", "offset": 72, "size": 4}, "HoldDelay": {"native": "Int32Array", "offset": 20, "size": 4}, "InitialSound": {"native": "Int32Array", "offset": 44, "size": 4}, "Reload": {"native": "Int32Array", "offset": 8, "size": 4}, "ReloadSound1": {"native": "Int32Array", "offset": 60, "size": 4}, "ReloadSound2": {"native": "Int32Array", "offset": 64, "size": 4}, "SelectSound": {"native": "Int32Array", "offset": 68, "size": 4}, "Shoots": {"native": "Int32Array", "offset": 28, "size": 4}, "ShotsPerBurst": {"native": "Int32Array", "offset": 40, "size": 4}, "Sound2Sound": {"native": "Int32Array", "offset": 56, "size": 4}, "Sound2Time": {"native": "Int32Array", "offset": 52, "size": 4}, "Spawn": {"native": "Int32Array", "offset": 36, "size": 4}, "SpawnTime": {"native": "Int32Array", "offset": 32, "size": 4}, "TotalTime": {"native": "Int32Array", "offset": 16, "size": 4}, "WorksLike": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 76, "union": false}, {}), 8).value).Flags = i32(2048));
      ((cPointerElementRef(cRecordPointer(weapondefaults, {"align": 4, "arrayAlign": 1, "fields": {"Clip": {"native": "Int32Array", "offset": 4, "size": 4}, "FireDelay": {"native": "Int32Array", "offset": 12, "size": 4}, "FireSound": {"native": "Int32Array", "offset": 48, "size": 4}, "Flags": {"native": "Int32Array", "offset": 24, "size": 4}, "FlashColor": {"native": "Int32Array", "offset": 72, "size": 4}, "HoldDelay": {"native": "Int32Array", "offset": 20, "size": 4}, "InitialSound": {"native": "Int32Array", "offset": 44, "size": 4}, "Reload": {"native": "Int32Array", "offset": 8, "size": 4}, "ReloadSound1": {"native": "Int32Array", "offset": 60, "size": 4}, "ReloadSound2": {"native": "Int32Array", "offset": 64, "size": 4}, "SelectSound": {"native": "Int32Array", "offset": 68, "size": 4}, "Shoots": {"native": "Int32Array", "offset": 28, "size": 4}, "ShotsPerBurst": {"native": "Int32Array", "offset": 40, "size": 4}, "Sound2Sound": {"native": "Int32Array", "offset": 56, "size": 4}, "Sound2Time": {"native": "Int32Array", "offset": 52, "size": 4}, "Spawn": {"native": "Int32Array", "offset": 36, "size": 4}, "SpawnTime": {"native": "Int32Array", "offset": 32, "size": 4}, "TotalTime": {"native": "Int32Array", "offset": 16, "size": 4}, "WorksLike": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 76, "union": false}, {}), 8).value).HoldDelay = i32(0));
      ((cPointerElementRef(cRecordPointer(weapondefaults, {"align": 4, "arrayAlign": 1, "fields": {"Clip": {"native": "Int32Array", "offset": 4, "size": 4}, "FireDelay": {"native": "Int32Array", "offset": 12, "size": 4}, "FireSound": {"native": "Int32Array", "offset": 48, "size": 4}, "Flags": {"native": "Int32Array", "offset": 24, "size": 4}, "FlashColor": {"native": "Int32Array", "offset": 72, "size": 4}, "HoldDelay": {"native": "Int32Array", "offset": 20, "size": 4}, "InitialSound": {"native": "Int32Array", "offset": 44, "size": 4}, "Reload": {"native": "Int32Array", "offset": 8, "size": 4}, "ReloadSound1": {"native": "Int32Array", "offset": 60, "size": 4}, "ReloadSound2": {"native": "Int32Array", "offset": 64, "size": 4}, "SelectSound": {"native": "Int32Array", "offset": 68, "size": 4}, "Shoots": {"native": "Int32Array", "offset": 28, "size": 4}, "ShotsPerBurst": {"native": "Int32Array", "offset": 40, "size": 4}, "Sound2Sound": {"native": "Int32Array", "offset": 56, "size": 4}, "Sound2Time": {"native": "Int32Array", "offset": 52, "size": 4}, "Spawn": {"native": "Int32Array", "offset": 36, "size": 4}, "SpawnTime": {"native": "Int32Array", "offset": 32, "size": 4}, "TotalTime": {"native": "Int32Array", "offset": 16, "size": 4}, "WorksLike": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 76, "union": false}, {}), 8).value).Reload = i32(30));
      ((cPointerElementRef(cRecordPointer(weapondefaults, {"align": 4, "arrayAlign": 1, "fields": {"Clip": {"native": "Int32Array", "offset": 4, "size": 4}, "FireDelay": {"native": "Int32Array", "offset": 12, "size": 4}, "FireSound": {"native": "Int32Array", "offset": 48, "size": 4}, "Flags": {"native": "Int32Array", "offset": 24, "size": 4}, "FlashColor": {"native": "Int32Array", "offset": 72, "size": 4}, "HoldDelay": {"native": "Int32Array", "offset": 20, "size": 4}, "InitialSound": {"native": "Int32Array", "offset": 44, "size": 4}, "Reload": {"native": "Int32Array", "offset": 8, "size": 4}, "ReloadSound1": {"native": "Int32Array", "offset": 60, "size": 4}, "ReloadSound2": {"native": "Int32Array", "offset": 64, "size": 4}, "SelectSound": {"native": "Int32Array", "offset": 68, "size": 4}, "Shoots": {"native": "Int32Array", "offset": 28, "size": 4}, "ShotsPerBurst": {"native": "Int32Array", "offset": 40, "size": 4}, "Sound2Sound": {"native": "Int32Array", "offset": 56, "size": 4}, "Sound2Time": {"native": "Int32Array", "offset": 52, "size": 4}, "Spawn": {"native": "Int32Array", "offset": 36, "size": 4}, "SpawnTime": {"native": "Int32Array", "offset": 32, "size": 4}, "TotalTime": {"native": "Int32Array", "offset": 16, "size": 4}, "WorksLike": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 76, "union": false}, {}), 9).value).Flags = i32(8));
      ((cPointerElementRef(cRecordPointer(weapondefaults, {"align": 4, "arrayAlign": 1, "fields": {"Clip": {"native": "Int32Array", "offset": 4, "size": 4}, "FireDelay": {"native": "Int32Array", "offset": 12, "size": 4}, "FireSound": {"native": "Int32Array", "offset": 48, "size": 4}, "Flags": {"native": "Int32Array", "offset": 24, "size": 4}, "FlashColor": {"native": "Int32Array", "offset": 72, "size": 4}, "HoldDelay": {"native": "Int32Array", "offset": 20, "size": 4}, "InitialSound": {"native": "Int32Array", "offset": 44, "size": 4}, "Reload": {"native": "Int32Array", "offset": 8, "size": 4}, "ReloadSound1": {"native": "Int32Array", "offset": 60, "size": 4}, "ReloadSound2": {"native": "Int32Array", "offset": 64, "size": 4}, "SelectSound": {"native": "Int32Array", "offset": 68, "size": 4}, "Shoots": {"native": "Int32Array", "offset": 28, "size": 4}, "ShotsPerBurst": {"native": "Int32Array", "offset": 40, "size": 4}, "Sound2Sound": {"native": "Int32Array", "offset": 56, "size": 4}, "Sound2Time": {"native": "Int32Array", "offset": 52, "size": 4}, "Spawn": {"native": "Int32Array", "offset": 36, "size": 4}, "SpawnTime": {"native": "Int32Array", "offset": 32, "size": 4}, "TotalTime": {"native": "Int32Array", "offset": 16, "size": 4}, "WorksLike": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 76, "union": false}, {}), 10).value).Reload = i32(30));
      ((cPointerElementRef(cRecordPointer(weapondefaults, {"align": 4, "arrayAlign": 1, "fields": {"Clip": {"native": "Int32Array", "offset": 4, "size": 4}, "FireDelay": {"native": "Int32Array", "offset": 12, "size": 4}, "FireSound": {"native": "Int32Array", "offset": 48, "size": 4}, "Flags": {"native": "Int32Array", "offset": 24, "size": 4}, "FlashColor": {"native": "Int32Array", "offset": 72, "size": 4}, "HoldDelay": {"native": "Int32Array", "offset": 20, "size": 4}, "InitialSound": {"native": "Int32Array", "offset": 44, "size": 4}, "Reload": {"native": "Int32Array", "offset": 8, "size": 4}, "ReloadSound1": {"native": "Int32Array", "offset": 60, "size": 4}, "ReloadSound2": {"native": "Int32Array", "offset": 64, "size": 4}, "SelectSound": {"native": "Int32Array", "offset": 68, "size": 4}, "Shoots": {"native": "Int32Array", "offset": 28, "size": 4}, "ShotsPerBurst": {"native": "Int32Array", "offset": 40, "size": 4}, "Sound2Sound": {"native": "Int32Array", "offset": 56, "size": 4}, "Sound2Time": {"native": "Int32Array", "offset": 52, "size": 4}, "Spawn": {"native": "Int32Array", "offset": 36, "size": 4}, "SpawnTime": {"native": "Int32Array", "offset": 32, "size": 4}, "TotalTime": {"native": "Int32Array", "offset": 16, "size": 4}, "WorksLike": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 76, "union": false}, {}), 11).value).InitialSound = i32(__cxx_global_cell_2fbb894c12ee103752b36559().value));
    }
  }
  let aszBuf = cZeroAggregate({"array": "Uint8Array", "dims": [64]});
  for (let i = i32(0); (i < i32(13)); ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i32((previous + 1)); __cxx_lvalue_2.value = next; return previous; })(cRef(() => i, __cxx_lvalue_3 => { i = __cxx_lvalue_3; }))) {
    do {
      sprintf(aszBuf, __cxx_literal_d130342c5c80e1f11796, i);
      Bstrupr(aszBuf);
      Gv_NewVar(aszBuf, i64((cPointerElementRef(cRecordPointer(weapondefaults, {"align": 4, "arrayAlign": 1, "fields": {"Clip": {"native": "Int32Array", "offset": 4, "size": 4}, "FireDelay": {"native": "Int32Array", "offset": 12, "size": 4}, "FireSound": {"native": "Int32Array", "offset": 48, "size": 4}, "Flags": {"native": "Int32Array", "offset": 24, "size": 4}, "FlashColor": {"native": "Int32Array", "offset": 72, "size": 4}, "HoldDelay": {"native": "Int32Array", "offset": 20, "size": 4}, "InitialSound": {"native": "Int32Array", "offset": 44, "size": 4}, "Reload": {"native": "Int32Array", "offset": 8, "size": 4}, "ReloadSound1": {"native": "Int32Array", "offset": 60, "size": 4}, "ReloadSound2": {"native": "Int32Array", "offset": 64, "size": 4}, "SelectSound": {"native": "Int32Array", "offset": 68, "size": 4}, "Shoots": {"native": "Int32Array", "offset": 28, "size": 4}, "ShotsPerBurst": {"native": "Int32Array", "offset": 40, "size": 4}, "Sound2Sound": {"native": "Int32Array", "offset": 56, "size": 4}, "Sound2Time": {"native": "Int32Array", "offset": 52, "size": 4}, "Spawn": {"native": "Int32Array", "offset": 36, "size": 4}, "SpawnTime": {"native": "Int32Array", "offset": 32, "size": 4}, "TotalTime": {"native": "Int32Array", "offset": 16, "size": 4}, "WorksLike": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 76, "union": false}, {}), i).value).Clip), u32(i32((i32(1) | i32(2048)))));
    } while (Boolean(0));
    do {
      sprintf(aszBuf, __cxx_literal_2d6f91951342112f6a49, i);
      Bstrupr(aszBuf);
      Gv_NewVar(aszBuf, i64((cPointerElementRef(cRecordPointer(weapondefaults, {"align": 4, "arrayAlign": 1, "fields": {"Clip": {"native": "Int32Array", "offset": 4, "size": 4}, "FireDelay": {"native": "Int32Array", "offset": 12, "size": 4}, "FireSound": {"native": "Int32Array", "offset": 48, "size": 4}, "Flags": {"native": "Int32Array", "offset": 24, "size": 4}, "FlashColor": {"native": "Int32Array", "offset": 72, "size": 4}, "HoldDelay": {"native": "Int32Array", "offset": 20, "size": 4}, "InitialSound": {"native": "Int32Array", "offset": 44, "size": 4}, "Reload": {"native": "Int32Array", "offset": 8, "size": 4}, "ReloadSound1": {"native": "Int32Array", "offset": 60, "size": 4}, "ReloadSound2": {"native": "Int32Array", "offset": 64, "size": 4}, "SelectSound": {"native": "Int32Array", "offset": 68, "size": 4}, "Shoots": {"native": "Int32Array", "offset": 28, "size": 4}, "ShotsPerBurst": {"native": "Int32Array", "offset": 40, "size": 4}, "Sound2Sound": {"native": "Int32Array", "offset": 56, "size": 4}, "Sound2Time": {"native": "Int32Array", "offset": 52, "size": 4}, "Spawn": {"native": "Int32Array", "offset": 36, "size": 4}, "SpawnTime": {"native": "Int32Array", "offset": 32, "size": 4}, "TotalTime": {"native": "Int32Array", "offset": 16, "size": 4}, "WorksLike": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 76, "union": false}, {}), i).value).FireDelay), u32(i32((i32(1) | i32(2048)))));
    } while (Boolean(0));
    do {
      sprintf(aszBuf, __cxx_literal_343642e590a1a0d229cb, i);
      Bstrupr(aszBuf);
      Gv_NewVar(aszBuf, i64((cPointerElementRef(cRecordPointer(weapondefaults, {"align": 4, "arrayAlign": 1, "fields": {"Clip": {"native": "Int32Array", "offset": 4, "size": 4}, "FireDelay": {"native": "Int32Array", "offset": 12, "size": 4}, "FireSound": {"native": "Int32Array", "offset": 48, "size": 4}, "Flags": {"native": "Int32Array", "offset": 24, "size": 4}, "FlashColor": {"native": "Int32Array", "offset": 72, "size": 4}, "HoldDelay": {"native": "Int32Array", "offset": 20, "size": 4}, "InitialSound": {"native": "Int32Array", "offset": 44, "size": 4}, "Reload": {"native": "Int32Array", "offset": 8, "size": 4}, "ReloadSound1": {"native": "Int32Array", "offset": 60, "size": 4}, "ReloadSound2": {"native": "Int32Array", "offset": 64, "size": 4}, "SelectSound": {"native": "Int32Array", "offset": 68, "size": 4}, "Shoots": {"native": "Int32Array", "offset": 28, "size": 4}, "ShotsPerBurst": {"native": "Int32Array", "offset": 40, "size": 4}, "Sound2Sound": {"native": "Int32Array", "offset": 56, "size": 4}, "Sound2Time": {"native": "Int32Array", "offset": 52, "size": 4}, "Spawn": {"native": "Int32Array", "offset": 36, "size": 4}, "SpawnTime": {"native": "Int32Array", "offset": 32, "size": 4}, "TotalTime": {"native": "Int32Array", "offset": 16, "size": 4}, "WorksLike": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 76, "union": false}, {}), i).value).FireSound), u32(i32((i32(1) | i32(2048)))));
    } while (Boolean(0));
    do {
      sprintf(aszBuf, __cxx_literal_76c138ca5593d6207186, i);
      Bstrupr(aszBuf);
      Gv_NewVar(aszBuf, i64((cPointerElementRef(cRecordPointer(weapondefaults, {"align": 4, "arrayAlign": 1, "fields": {"Clip": {"native": "Int32Array", "offset": 4, "size": 4}, "FireDelay": {"native": "Int32Array", "offset": 12, "size": 4}, "FireSound": {"native": "Int32Array", "offset": 48, "size": 4}, "Flags": {"native": "Int32Array", "offset": 24, "size": 4}, "FlashColor": {"native": "Int32Array", "offset": 72, "size": 4}, "HoldDelay": {"native": "Int32Array", "offset": 20, "size": 4}, "InitialSound": {"native": "Int32Array", "offset": 44, "size": 4}, "Reload": {"native": "Int32Array", "offset": 8, "size": 4}, "ReloadSound1": {"native": "Int32Array", "offset": 60, "size": 4}, "ReloadSound2": {"native": "Int32Array", "offset": 64, "size": 4}, "SelectSound": {"native": "Int32Array", "offset": 68, "size": 4}, "Shoots": {"native": "Int32Array", "offset": 28, "size": 4}, "ShotsPerBurst": {"native": "Int32Array", "offset": 40, "size": 4}, "Sound2Sound": {"native": "Int32Array", "offset": 56, "size": 4}, "Sound2Time": {"native": "Int32Array", "offset": 52, "size": 4}, "Spawn": {"native": "Int32Array", "offset": 36, "size": 4}, "SpawnTime": {"native": "Int32Array", "offset": 32, "size": 4}, "TotalTime": {"native": "Int32Array", "offset": 16, "size": 4}, "WorksLike": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 76, "union": false}, {}), i).value).Flags), u32(i32((i32(1) | i32(2048)))));
    } while (Boolean(0));
    do {
      sprintf(aszBuf, __cxx_literal_a623111eaaf6a68e631b, i);
      Bstrupr(aszBuf);
      Gv_NewVar(aszBuf, i64((cPointerElementRef(cRecordPointer(weapondefaults, {"align": 4, "arrayAlign": 1, "fields": {"Clip": {"native": "Int32Array", "offset": 4, "size": 4}, "FireDelay": {"native": "Int32Array", "offset": 12, "size": 4}, "FireSound": {"native": "Int32Array", "offset": 48, "size": 4}, "Flags": {"native": "Int32Array", "offset": 24, "size": 4}, "FlashColor": {"native": "Int32Array", "offset": 72, "size": 4}, "HoldDelay": {"native": "Int32Array", "offset": 20, "size": 4}, "InitialSound": {"native": "Int32Array", "offset": 44, "size": 4}, "Reload": {"native": "Int32Array", "offset": 8, "size": 4}, "ReloadSound1": {"native": "Int32Array", "offset": 60, "size": 4}, "ReloadSound2": {"native": "Int32Array", "offset": 64, "size": 4}, "SelectSound": {"native": "Int32Array", "offset": 68, "size": 4}, "Shoots": {"native": "Int32Array", "offset": 28, "size": 4}, "ShotsPerBurst": {"native": "Int32Array", "offset": 40, "size": 4}, "Sound2Sound": {"native": "Int32Array", "offset": 56, "size": 4}, "Sound2Time": {"native": "Int32Array", "offset": 52, "size": 4}, "Spawn": {"native": "Int32Array", "offset": 36, "size": 4}, "SpawnTime": {"native": "Int32Array", "offset": 32, "size": 4}, "TotalTime": {"native": "Int32Array", "offset": 16, "size": 4}, "WorksLike": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 76, "union": false}, {}), i).value).FlashColor), u32(i32((i32(1) | i32(2048)))));
    } while (Boolean(0));
    do {
      sprintf(aszBuf, __cxx_literal_e02e5abca4eab22942a2, i);
      Bstrupr(aszBuf);
      Gv_NewVar(aszBuf, i64((cPointerElementRef(cRecordPointer(weapondefaults, {"align": 4, "arrayAlign": 1, "fields": {"Clip": {"native": "Int32Array", "offset": 4, "size": 4}, "FireDelay": {"native": "Int32Array", "offset": 12, "size": 4}, "FireSound": {"native": "Int32Array", "offset": 48, "size": 4}, "Flags": {"native": "Int32Array", "offset": 24, "size": 4}, "FlashColor": {"native": "Int32Array", "offset": 72, "size": 4}, "HoldDelay": {"native": "Int32Array", "offset": 20, "size": 4}, "InitialSound": {"native": "Int32Array", "offset": 44, "size": 4}, "Reload": {"native": "Int32Array", "offset": 8, "size": 4}, "ReloadSound1": {"native": "Int32Array", "offset": 60, "size": 4}, "ReloadSound2": {"native": "Int32Array", "offset": 64, "size": 4}, "SelectSound": {"native": "Int32Array", "offset": 68, "size": 4}, "Shoots": {"native": "Int32Array", "offset": 28, "size": 4}, "ShotsPerBurst": {"native": "Int32Array", "offset": 40, "size": 4}, "Sound2Sound": {"native": "Int32Array", "offset": 56, "size": 4}, "Sound2Time": {"native": "Int32Array", "offset": 52, "size": 4}, "Spawn": {"native": "Int32Array", "offset": 36, "size": 4}, "SpawnTime": {"native": "Int32Array", "offset": 32, "size": 4}, "TotalTime": {"native": "Int32Array", "offset": 16, "size": 4}, "WorksLike": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 76, "union": false}, {}), i).value).HoldDelay), u32(i32((i32(1) | i32(2048)))));
    } while (Boolean(0));
    do {
      sprintf(aszBuf, __cxx_literal_4449f48d4adf24fd9aa6, i);
      Bstrupr(aszBuf);
      Gv_NewVar(aszBuf, i64((cPointerElementRef(cRecordPointer(weapondefaults, {"align": 4, "arrayAlign": 1, "fields": {"Clip": {"native": "Int32Array", "offset": 4, "size": 4}, "FireDelay": {"native": "Int32Array", "offset": 12, "size": 4}, "FireSound": {"native": "Int32Array", "offset": 48, "size": 4}, "Flags": {"native": "Int32Array", "offset": 24, "size": 4}, "FlashColor": {"native": "Int32Array", "offset": 72, "size": 4}, "HoldDelay": {"native": "Int32Array", "offset": 20, "size": 4}, "InitialSound": {"native": "Int32Array", "offset": 44, "size": 4}, "Reload": {"native": "Int32Array", "offset": 8, "size": 4}, "ReloadSound1": {"native": "Int32Array", "offset": 60, "size": 4}, "ReloadSound2": {"native": "Int32Array", "offset": 64, "size": 4}, "SelectSound": {"native": "Int32Array", "offset": 68, "size": 4}, "Shoots": {"native": "Int32Array", "offset": 28, "size": 4}, "ShotsPerBurst": {"native": "Int32Array", "offset": 40, "size": 4}, "Sound2Sound": {"native": "Int32Array", "offset": 56, "size": 4}, "Sound2Time": {"native": "Int32Array", "offset": 52, "size": 4}, "Spawn": {"native": "Int32Array", "offset": 36, "size": 4}, "SpawnTime": {"native": "Int32Array", "offset": 32, "size": 4}, "TotalTime": {"native": "Int32Array", "offset": 16, "size": 4}, "WorksLike": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 76, "union": false}, {}), i).value).InitialSound), u32(i32((i32(1) | i32(2048)))));
    } while (Boolean(0));
    do {
      sprintf(aszBuf, __cxx_literal_c9fc837c9fe1f7f8a7f1, i);
      Bstrupr(aszBuf);
      Gv_NewVar(aszBuf, i64((cPointerElementRef(cRecordPointer(weapondefaults, {"align": 4, "arrayAlign": 1, "fields": {"Clip": {"native": "Int32Array", "offset": 4, "size": 4}, "FireDelay": {"native": "Int32Array", "offset": 12, "size": 4}, "FireSound": {"native": "Int32Array", "offset": 48, "size": 4}, "Flags": {"native": "Int32Array", "offset": 24, "size": 4}, "FlashColor": {"native": "Int32Array", "offset": 72, "size": 4}, "HoldDelay": {"native": "Int32Array", "offset": 20, "size": 4}, "InitialSound": {"native": "Int32Array", "offset": 44, "size": 4}, "Reload": {"native": "Int32Array", "offset": 8, "size": 4}, "ReloadSound1": {"native": "Int32Array", "offset": 60, "size": 4}, "ReloadSound2": {"native": "Int32Array", "offset": 64, "size": 4}, "SelectSound": {"native": "Int32Array", "offset": 68, "size": 4}, "Shoots": {"native": "Int32Array", "offset": 28, "size": 4}, "ShotsPerBurst": {"native": "Int32Array", "offset": 40, "size": 4}, "Sound2Sound": {"native": "Int32Array", "offset": 56, "size": 4}, "Sound2Time": {"native": "Int32Array", "offset": 52, "size": 4}, "Spawn": {"native": "Int32Array", "offset": 36, "size": 4}, "SpawnTime": {"native": "Int32Array", "offset": 32, "size": 4}, "TotalTime": {"native": "Int32Array", "offset": 16, "size": 4}, "WorksLike": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 76, "union": false}, {}), i).value).Reload), u32(i32((i32(1) | i32(2048)))));
    } while (Boolean(0));
    do {
      sprintf(aszBuf, __cxx_literal_dcff78fc91463a0ecd25, i);
      Bstrupr(aszBuf);
      Gv_NewVar(aszBuf, i64((cPointerElementRef(cRecordPointer(weapondefaults, {"align": 4, "arrayAlign": 1, "fields": {"Clip": {"native": "Int32Array", "offset": 4, "size": 4}, "FireDelay": {"native": "Int32Array", "offset": 12, "size": 4}, "FireSound": {"native": "Int32Array", "offset": 48, "size": 4}, "Flags": {"native": "Int32Array", "offset": 24, "size": 4}, "FlashColor": {"native": "Int32Array", "offset": 72, "size": 4}, "HoldDelay": {"native": "Int32Array", "offset": 20, "size": 4}, "InitialSound": {"native": "Int32Array", "offset": 44, "size": 4}, "Reload": {"native": "Int32Array", "offset": 8, "size": 4}, "ReloadSound1": {"native": "Int32Array", "offset": 60, "size": 4}, "ReloadSound2": {"native": "Int32Array", "offset": 64, "size": 4}, "SelectSound": {"native": "Int32Array", "offset": 68, "size": 4}, "Shoots": {"native": "Int32Array", "offset": 28, "size": 4}, "ShotsPerBurst": {"native": "Int32Array", "offset": 40, "size": 4}, "Sound2Sound": {"native": "Int32Array", "offset": 56, "size": 4}, "Sound2Time": {"native": "Int32Array", "offset": 52, "size": 4}, "Spawn": {"native": "Int32Array", "offset": 36, "size": 4}, "SpawnTime": {"native": "Int32Array", "offset": 32, "size": 4}, "TotalTime": {"native": "Int32Array", "offset": 16, "size": 4}, "WorksLike": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 76, "union": false}, {}), i).value).ReloadSound1), u32(i32((i32(1) | i32(2048)))));
    } while (Boolean(0));
    do {
      sprintf(aszBuf, __cxx_literal_fb0efd074c9d145280b2, i);
      Bstrupr(aszBuf);
      Gv_NewVar(aszBuf, i64((cPointerElementRef(cRecordPointer(weapondefaults, {"align": 4, "arrayAlign": 1, "fields": {"Clip": {"native": "Int32Array", "offset": 4, "size": 4}, "FireDelay": {"native": "Int32Array", "offset": 12, "size": 4}, "FireSound": {"native": "Int32Array", "offset": 48, "size": 4}, "Flags": {"native": "Int32Array", "offset": 24, "size": 4}, "FlashColor": {"native": "Int32Array", "offset": 72, "size": 4}, "HoldDelay": {"native": "Int32Array", "offset": 20, "size": 4}, "InitialSound": {"native": "Int32Array", "offset": 44, "size": 4}, "Reload": {"native": "Int32Array", "offset": 8, "size": 4}, "ReloadSound1": {"native": "Int32Array", "offset": 60, "size": 4}, "ReloadSound2": {"native": "Int32Array", "offset": 64, "size": 4}, "SelectSound": {"native": "Int32Array", "offset": 68, "size": 4}, "Shoots": {"native": "Int32Array", "offset": 28, "size": 4}, "ShotsPerBurst": {"native": "Int32Array", "offset": 40, "size": 4}, "Sound2Sound": {"native": "Int32Array", "offset": 56, "size": 4}, "Sound2Time": {"native": "Int32Array", "offset": 52, "size": 4}, "Spawn": {"native": "Int32Array", "offset": 36, "size": 4}, "SpawnTime": {"native": "Int32Array", "offset": 32, "size": 4}, "TotalTime": {"native": "Int32Array", "offset": 16, "size": 4}, "WorksLike": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 76, "union": false}, {}), i).value).ReloadSound2), u32(i32((i32(1) | i32(2048)))));
    } while (Boolean(0));
    do {
      sprintf(aszBuf, __cxx_literal_de935af36abd33356df1, i);
      Bstrupr(aszBuf);
      Gv_NewVar(aszBuf, i64((cPointerElementRef(cRecordPointer(weapondefaults, {"align": 4, "arrayAlign": 1, "fields": {"Clip": {"native": "Int32Array", "offset": 4, "size": 4}, "FireDelay": {"native": "Int32Array", "offset": 12, "size": 4}, "FireSound": {"native": "Int32Array", "offset": 48, "size": 4}, "Flags": {"native": "Int32Array", "offset": 24, "size": 4}, "FlashColor": {"native": "Int32Array", "offset": 72, "size": 4}, "HoldDelay": {"native": "Int32Array", "offset": 20, "size": 4}, "InitialSound": {"native": "Int32Array", "offset": 44, "size": 4}, "Reload": {"native": "Int32Array", "offset": 8, "size": 4}, "ReloadSound1": {"native": "Int32Array", "offset": 60, "size": 4}, "ReloadSound2": {"native": "Int32Array", "offset": 64, "size": 4}, "SelectSound": {"native": "Int32Array", "offset": 68, "size": 4}, "Shoots": {"native": "Int32Array", "offset": 28, "size": 4}, "ShotsPerBurst": {"native": "Int32Array", "offset": 40, "size": 4}, "Sound2Sound": {"native": "Int32Array", "offset": 56, "size": 4}, "Sound2Time": {"native": "Int32Array", "offset": 52, "size": 4}, "Spawn": {"native": "Int32Array", "offset": 36, "size": 4}, "SpawnTime": {"native": "Int32Array", "offset": 32, "size": 4}, "TotalTime": {"native": "Int32Array", "offset": 16, "size": 4}, "WorksLike": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 76, "union": false}, {}), i).value).SelectSound), u32(i32((i32(1) | i32(2048)))));
    } while (Boolean(0));
    do {
      sprintf(aszBuf, __cxx_literal_889721cd6245741519a9, i);
      Bstrupr(aszBuf);
      Gv_NewVar(aszBuf, i64((cPointerElementRef(cRecordPointer(weapondefaults, {"align": 4, "arrayAlign": 1, "fields": {"Clip": {"native": "Int32Array", "offset": 4, "size": 4}, "FireDelay": {"native": "Int32Array", "offset": 12, "size": 4}, "FireSound": {"native": "Int32Array", "offset": 48, "size": 4}, "Flags": {"native": "Int32Array", "offset": 24, "size": 4}, "FlashColor": {"native": "Int32Array", "offset": 72, "size": 4}, "HoldDelay": {"native": "Int32Array", "offset": 20, "size": 4}, "InitialSound": {"native": "Int32Array", "offset": 44, "size": 4}, "Reload": {"native": "Int32Array", "offset": 8, "size": 4}, "ReloadSound1": {"native": "Int32Array", "offset": 60, "size": 4}, "ReloadSound2": {"native": "Int32Array", "offset": 64, "size": 4}, "SelectSound": {"native": "Int32Array", "offset": 68, "size": 4}, "Shoots": {"native": "Int32Array", "offset": 28, "size": 4}, "ShotsPerBurst": {"native": "Int32Array", "offset": 40, "size": 4}, "Sound2Sound": {"native": "Int32Array", "offset": 56, "size": 4}, "Sound2Time": {"native": "Int32Array", "offset": 52, "size": 4}, "Spawn": {"native": "Int32Array", "offset": 36, "size": 4}, "SpawnTime": {"native": "Int32Array", "offset": 32, "size": 4}, "TotalTime": {"native": "Int32Array", "offset": 16, "size": 4}, "WorksLike": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 76, "union": false}, {}), i).value).Shoots), u32(i32((i32(1) | i32(2048)))));
    } while (Boolean(0));
    do {
      sprintf(aszBuf, __cxx_literal_ae2d488b9b57fcdf1436, i);
      Bstrupr(aszBuf);
      Gv_NewVar(aszBuf, i64((cPointerElementRef(cRecordPointer(weapondefaults, {"align": 4, "arrayAlign": 1, "fields": {"Clip": {"native": "Int32Array", "offset": 4, "size": 4}, "FireDelay": {"native": "Int32Array", "offset": 12, "size": 4}, "FireSound": {"native": "Int32Array", "offset": 48, "size": 4}, "Flags": {"native": "Int32Array", "offset": 24, "size": 4}, "FlashColor": {"native": "Int32Array", "offset": 72, "size": 4}, "HoldDelay": {"native": "Int32Array", "offset": 20, "size": 4}, "InitialSound": {"native": "Int32Array", "offset": 44, "size": 4}, "Reload": {"native": "Int32Array", "offset": 8, "size": 4}, "ReloadSound1": {"native": "Int32Array", "offset": 60, "size": 4}, "ReloadSound2": {"native": "Int32Array", "offset": 64, "size": 4}, "SelectSound": {"native": "Int32Array", "offset": 68, "size": 4}, "Shoots": {"native": "Int32Array", "offset": 28, "size": 4}, "ShotsPerBurst": {"native": "Int32Array", "offset": 40, "size": 4}, "Sound2Sound": {"native": "Int32Array", "offset": 56, "size": 4}, "Sound2Time": {"native": "Int32Array", "offset": 52, "size": 4}, "Spawn": {"native": "Int32Array", "offset": 36, "size": 4}, "SpawnTime": {"native": "Int32Array", "offset": 32, "size": 4}, "TotalTime": {"native": "Int32Array", "offset": 16, "size": 4}, "WorksLike": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 76, "union": false}, {}), i).value).ShotsPerBurst), u32(i32((i32(1) | i32(2048)))));
    } while (Boolean(0));
    do {
      sprintf(aszBuf, __cxx_literal_f4580de47bf96f7922af, i);
      Bstrupr(aszBuf);
      Gv_NewVar(aszBuf, i64((cPointerElementRef(cRecordPointer(weapondefaults, {"align": 4, "arrayAlign": 1, "fields": {"Clip": {"native": "Int32Array", "offset": 4, "size": 4}, "FireDelay": {"native": "Int32Array", "offset": 12, "size": 4}, "FireSound": {"native": "Int32Array", "offset": 48, "size": 4}, "Flags": {"native": "Int32Array", "offset": 24, "size": 4}, "FlashColor": {"native": "Int32Array", "offset": 72, "size": 4}, "HoldDelay": {"native": "Int32Array", "offset": 20, "size": 4}, "InitialSound": {"native": "Int32Array", "offset": 44, "size": 4}, "Reload": {"native": "Int32Array", "offset": 8, "size": 4}, "ReloadSound1": {"native": "Int32Array", "offset": 60, "size": 4}, "ReloadSound2": {"native": "Int32Array", "offset": 64, "size": 4}, "SelectSound": {"native": "Int32Array", "offset": 68, "size": 4}, "Shoots": {"native": "Int32Array", "offset": 28, "size": 4}, "ShotsPerBurst": {"native": "Int32Array", "offset": 40, "size": 4}, "Sound2Sound": {"native": "Int32Array", "offset": 56, "size": 4}, "Sound2Time": {"native": "Int32Array", "offset": 52, "size": 4}, "Spawn": {"native": "Int32Array", "offset": 36, "size": 4}, "SpawnTime": {"native": "Int32Array", "offset": 32, "size": 4}, "TotalTime": {"native": "Int32Array", "offset": 16, "size": 4}, "WorksLike": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 76, "union": false}, {}), i).value).Sound2Sound), u32(i32((i32(1) | i32(2048)))));
    } while (Boolean(0));
    do {
      sprintf(aszBuf, __cxx_literal_3bfd4be7cf322bb66e76, i);
      Bstrupr(aszBuf);
      Gv_NewVar(aszBuf, i64((cPointerElementRef(cRecordPointer(weapondefaults, {"align": 4, "arrayAlign": 1, "fields": {"Clip": {"native": "Int32Array", "offset": 4, "size": 4}, "FireDelay": {"native": "Int32Array", "offset": 12, "size": 4}, "FireSound": {"native": "Int32Array", "offset": 48, "size": 4}, "Flags": {"native": "Int32Array", "offset": 24, "size": 4}, "FlashColor": {"native": "Int32Array", "offset": 72, "size": 4}, "HoldDelay": {"native": "Int32Array", "offset": 20, "size": 4}, "InitialSound": {"native": "Int32Array", "offset": 44, "size": 4}, "Reload": {"native": "Int32Array", "offset": 8, "size": 4}, "ReloadSound1": {"native": "Int32Array", "offset": 60, "size": 4}, "ReloadSound2": {"native": "Int32Array", "offset": 64, "size": 4}, "SelectSound": {"native": "Int32Array", "offset": 68, "size": 4}, "Shoots": {"native": "Int32Array", "offset": 28, "size": 4}, "ShotsPerBurst": {"native": "Int32Array", "offset": 40, "size": 4}, "Sound2Sound": {"native": "Int32Array", "offset": 56, "size": 4}, "Sound2Time": {"native": "Int32Array", "offset": 52, "size": 4}, "Spawn": {"native": "Int32Array", "offset": 36, "size": 4}, "SpawnTime": {"native": "Int32Array", "offset": 32, "size": 4}, "TotalTime": {"native": "Int32Array", "offset": 16, "size": 4}, "WorksLike": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 76, "union": false}, {}), i).value).Sound2Time), u32(i32((i32(1) | i32(2048)))));
    } while (Boolean(0));
    do {
      sprintf(aszBuf, __cxx_literal_296d4f2f0e62f11b01fe, i);
      Bstrupr(aszBuf);
      Gv_NewVar(aszBuf, i64((cPointerElementRef(cRecordPointer(weapondefaults, {"align": 4, "arrayAlign": 1, "fields": {"Clip": {"native": "Int32Array", "offset": 4, "size": 4}, "FireDelay": {"native": "Int32Array", "offset": 12, "size": 4}, "FireSound": {"native": "Int32Array", "offset": 48, "size": 4}, "Flags": {"native": "Int32Array", "offset": 24, "size": 4}, "FlashColor": {"native": "Int32Array", "offset": 72, "size": 4}, "HoldDelay": {"native": "Int32Array", "offset": 20, "size": 4}, "InitialSound": {"native": "Int32Array", "offset": 44, "size": 4}, "Reload": {"native": "Int32Array", "offset": 8, "size": 4}, "ReloadSound1": {"native": "Int32Array", "offset": 60, "size": 4}, "ReloadSound2": {"native": "Int32Array", "offset": 64, "size": 4}, "SelectSound": {"native": "Int32Array", "offset": 68, "size": 4}, "Shoots": {"native": "Int32Array", "offset": 28, "size": 4}, "ShotsPerBurst": {"native": "Int32Array", "offset": 40, "size": 4}, "Sound2Sound": {"native": "Int32Array", "offset": 56, "size": 4}, "Sound2Time": {"native": "Int32Array", "offset": 52, "size": 4}, "Spawn": {"native": "Int32Array", "offset": 36, "size": 4}, "SpawnTime": {"native": "Int32Array", "offset": 32, "size": 4}, "TotalTime": {"native": "Int32Array", "offset": 16, "size": 4}, "WorksLike": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 76, "union": false}, {}), i).value).Spawn), u32(i32((i32(1) | i32(2048)))));
    } while (Boolean(0));
    do {
      sprintf(aszBuf, __cxx_literal_413dba4f23fce83c2681, i);
      Bstrupr(aszBuf);
      Gv_NewVar(aszBuf, i64((cPointerElementRef(cRecordPointer(weapondefaults, {"align": 4, "arrayAlign": 1, "fields": {"Clip": {"native": "Int32Array", "offset": 4, "size": 4}, "FireDelay": {"native": "Int32Array", "offset": 12, "size": 4}, "FireSound": {"native": "Int32Array", "offset": 48, "size": 4}, "Flags": {"native": "Int32Array", "offset": 24, "size": 4}, "FlashColor": {"native": "Int32Array", "offset": 72, "size": 4}, "HoldDelay": {"native": "Int32Array", "offset": 20, "size": 4}, "InitialSound": {"native": "Int32Array", "offset": 44, "size": 4}, "Reload": {"native": "Int32Array", "offset": 8, "size": 4}, "ReloadSound1": {"native": "Int32Array", "offset": 60, "size": 4}, "ReloadSound2": {"native": "Int32Array", "offset": 64, "size": 4}, "SelectSound": {"native": "Int32Array", "offset": 68, "size": 4}, "Shoots": {"native": "Int32Array", "offset": 28, "size": 4}, "ShotsPerBurst": {"native": "Int32Array", "offset": 40, "size": 4}, "Sound2Sound": {"native": "Int32Array", "offset": 56, "size": 4}, "Sound2Time": {"native": "Int32Array", "offset": 52, "size": 4}, "Spawn": {"native": "Int32Array", "offset": 36, "size": 4}, "SpawnTime": {"native": "Int32Array", "offset": 32, "size": 4}, "TotalTime": {"native": "Int32Array", "offset": 16, "size": 4}, "WorksLike": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 76, "union": false}, {}), i).value).SpawnTime), u32(i32((i32(1) | i32(2048)))));
    } while (Boolean(0));
    do {
      sprintf(aszBuf, __cxx_literal_bdb9697f0b4fc1100b5b, i);
      Bstrupr(aszBuf);
      Gv_NewVar(aszBuf, i64((cPointerElementRef(cRecordPointer(weapondefaults, {"align": 4, "arrayAlign": 1, "fields": {"Clip": {"native": "Int32Array", "offset": 4, "size": 4}, "FireDelay": {"native": "Int32Array", "offset": 12, "size": 4}, "FireSound": {"native": "Int32Array", "offset": 48, "size": 4}, "Flags": {"native": "Int32Array", "offset": 24, "size": 4}, "FlashColor": {"native": "Int32Array", "offset": 72, "size": 4}, "HoldDelay": {"native": "Int32Array", "offset": 20, "size": 4}, "InitialSound": {"native": "Int32Array", "offset": 44, "size": 4}, "Reload": {"native": "Int32Array", "offset": 8, "size": 4}, "ReloadSound1": {"native": "Int32Array", "offset": 60, "size": 4}, "ReloadSound2": {"native": "Int32Array", "offset": 64, "size": 4}, "SelectSound": {"native": "Int32Array", "offset": 68, "size": 4}, "Shoots": {"native": "Int32Array", "offset": 28, "size": 4}, "ShotsPerBurst": {"native": "Int32Array", "offset": 40, "size": 4}, "Sound2Sound": {"native": "Int32Array", "offset": 56, "size": 4}, "Sound2Time": {"native": "Int32Array", "offset": 52, "size": 4}, "Spawn": {"native": "Int32Array", "offset": 36, "size": 4}, "SpawnTime": {"native": "Int32Array", "offset": 32, "size": 4}, "TotalTime": {"native": "Int32Array", "offset": 16, "size": 4}, "WorksLike": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 76, "union": false}, {}), i).value).TotalTime), u32(i32((i32(1) | i32(2048)))));
    } while (Boolean(0));
    do {
      sprintf(aszBuf, __cxx_literal_3d3580e93fc7f1174768, i);
      Bstrupr(aszBuf);
      Gv_NewVar(aszBuf, i64((cPointerElementRef(cRecordPointer(weapondefaults, {"align": 4, "arrayAlign": 1, "fields": {"Clip": {"native": "Int32Array", "offset": 4, "size": 4}, "FireDelay": {"native": "Int32Array", "offset": 12, "size": 4}, "FireSound": {"native": "Int32Array", "offset": 48, "size": 4}, "Flags": {"native": "Int32Array", "offset": 24, "size": 4}, "FlashColor": {"native": "Int32Array", "offset": 72, "size": 4}, "HoldDelay": {"native": "Int32Array", "offset": 20, "size": 4}, "InitialSound": {"native": "Int32Array", "offset": 44, "size": 4}, "Reload": {"native": "Int32Array", "offset": 8, "size": 4}, "ReloadSound1": {"native": "Int32Array", "offset": 60, "size": 4}, "ReloadSound2": {"native": "Int32Array", "offset": 64, "size": 4}, "SelectSound": {"native": "Int32Array", "offset": 68, "size": 4}, "Shoots": {"native": "Int32Array", "offset": 28, "size": 4}, "ShotsPerBurst": {"native": "Int32Array", "offset": 40, "size": 4}, "Sound2Sound": {"native": "Int32Array", "offset": 56, "size": 4}, "Sound2Time": {"native": "Int32Array", "offset": 52, "size": 4}, "Spawn": {"native": "Int32Array", "offset": 36, "size": 4}, "SpawnTime": {"native": "Int32Array", "offset": 32, "size": 4}, "TotalTime": {"native": "Int32Array", "offset": 16, "size": 4}, "WorksLike": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 76, "union": false}, {}), i).value).WorksLike), u32(i32((i32(1) | i32(2048)))));
    } while (Boolean(0));
  }
  Gv_NewVar(__cxx_literal_e17423e67fc0d33a7a05, i64(120), u32(i32((i32(2048) | i32(1)))));
  Gv_NewVar(__cxx_literal_ca4bc8655da932edfb7c, i64(30), u32(i32((i32(2048) | i32(1)))));
  Gv_NewVar(__cxx_literal_2952b5c703d2409d6501, i64((Boolean(i32((__cxx_global_cell_c0e288040dbf9a805036c27d().value & i32((2 | 8))))) ? 2 : 1)), u32(i32((i32(2048) | i32(1)))));
  Gv_NewVar(__cxx_literal_6f146f1d4904a8d78b62, i64(120), u32(i32((i32(2048) | i32(1)))));
  Gv_NewVar(__cxx_literal_3d5a10ab6093a07aadc5, i64(30), u32(i32((i32(2048) | i32(1)))));
  Gv_NewVar(__cxx_literal_9f1e40e8452e64fcced2, i64(1), u32(i32((i32(2048) | i32(1)))));
  Gv_NewVar(__cxx_literal_a937ace98b4062ad2a31, i64(18), u32(i32((i32(2048) | i32(1)))));
  Gv_NewVar(__cxx_literal_4c181f0223c2dce56755, i64(0), u32(i32((i32(2048) | i32(1)))));
  Gv_NewVar(__cxx_literal_31355655622610f56b7a, i64(cSourceAddresses.encode(cObjectFieldRef(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value, "coop"))), u32(i32((i32(2048) | i32(8192)))));
  Gv_NewVar(__cxx_literal_68f5dd80e343963b1ec6, i64(cSourceAddresses.encode(cObjectFieldRef(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value, "ffire"))), u32(i32((i32(2048) | i32(8192)))));
  Gv_NewVar(__cxx_literal_b93eab313fb8615c7db4, i64(0), u32(2048));
  Gv_NewVar(__cxx_literal_550703c79a68f5c52ddf, i64(cSourceAddresses.encode(cObjectFieldRef(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value, "level_number"))), u32(i32((i32((i32(2048) | i32(8192))) | i32(4096)))));
  Gv_NewVar(__cxx_literal_ea15bbabd4ee4fbf4c6f, i64(0), u32(2048));
  Gv_NewVar(__cxx_literal_190b834b600267c1d630, i64(cSourceAddresses.encode(cObjectFieldRef(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value, "marker"))), u32(i32((i32(2048) | i32(8192)))));
  Gv_NewVar(__cxx_literal_fb699ed5f1252ec5ad87, i64(cSourceAddresses.encode(cObjectFieldRef(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value, "monsters_off"))), u32(i32((i32(2048) | i32(8192)))));
  Gv_NewVar(__cxx_literal_1e6c6d182df3d86a5ab8, i64(cSourceAddresses.encode(cObjectFieldRef(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value, "multimode"))), u32(i32((i32(2048) | i32(8192)))));
  Gv_NewVar(__cxx_literal_3196d42fee47f4dc5882, i64(cSourceAddresses.encode(cScalarLValueIO(__cxx_global_cell_0d84c36af55f8d659082f1bb(), Int16Array))), u32(i32((i32((i32(2048) | i32(32768))) | i32(4096)))));
  Gv_NewVar(__cxx_literal_daaddbd9e49c45e81440, i64(cSourceAddresses.encode(cScalarLValueIO(__cxx_global_cell_9fbed4c78bef6ce8bf955682(), Int16Array))), u32(i32((i32((i32(2048) | i32(32768))) | i32(4096)))));
  Gv_NewVar(__cxx_literal_d98589519abfb27270f9, i64(cSourceAddresses.encode(cScalarLValueIO(__cxx_global_cell_4e6f24ae9c3dade74700992b(), Int32Array))), u32(i32((i32((i32(2048) | i32(8192))) | i32(4096)))));
  Gv_NewVar(__cxx_literal_459ab570ae50026c01d7, i64(cSourceAddresses.encode(cObjectFieldRef(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value, "respawn_inventory"))), u32(i32((i32(2048) | i32(8192)))));
  Gv_NewVar(__cxx_literal_0a18cc2463a83bfa0bb3, i64(cSourceAddresses.encode(cObjectFieldRef(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value, "respawn_items"))), u32(i32((i32(2048) | i32(8192)))));
  Gv_NewVar(__cxx_literal_ab2361bcaf1d2df0a12f, i64(cSourceAddresses.encode(cObjectFieldRef(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value, "respawn_monsters"))), u32(i32((i32(2048) | i32(8192)))));
  Gv_NewVar(__cxx_literal_ae1e5821b72ee65037ab, i64(0), u32(2048));
  Gv_NewVar(__cxx_literal_224e9612e796f8616ea7, i64(0), u32(2048));
  Gv_NewVar(__cxx_literal_0c493730c6b251512596, i64(0), u32(i32((i32(2048) | i32(4096)))));
  Gv_NewVar(__cxx_literal_c465044d0ddd29e3ebc3, i64(cSourceAddresses.encode(cObjectFieldRef(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value, "volume_number"))), u32(i32((i32((i32(2048) | i32(8192))) | i32(4096)))));
  Gv_NewVar(__cxx_literal_f76d3cc93e9b2616d5b0, i64(0), u32(i32((i32((i32(2048) | i32(1))) | i32(4096)))));
  Gv_NewVar(__cxx_literal_cb87f2ad7cf8230f8ecc, i64(0), u32(i32((i32((i32(2048) | i32(1))) | i32(4096)))));
  Gv_NewVar(__cxx_literal_2863df4f46ce2ea1c8cf, i64(4), u32(i32((i32(2048) | i32(1)))));
  Gv_NewVar(__cxx_literal_767e95ff20d649a71ca0, i64(cSourceAddresses.encode(cScalarLValueIO(__cxx_global_cell_c1c0a03508c5080698c5ec5d(), Int32Array))), u32(i32((i32(2048) | i32(8192)))));
  Gv_NewVar(__cxx_literal_4b43b8cdf651ad976537, i64(cSourceAddresses.encode(cObjectFieldRef(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value, "cameraq16ang"))), u32(i32((i32(2048) | i32(1048576)))));
  Gv_NewVar(__cxx_literal_0046af65899e85b12b1f, i64(cSourceAddresses.encode(cScalarLValueIO(__cxx_global_cell_915885e2bacffc3a024f309d(), Int32Array))), u32(i32((i32(2048) | i32(8192)))));
  Gv_NewVar(__cxx_literal_66df458de1e5ff4ba35f, i64(cSourceAddresses.encode(cScalarLValueIO(__cxx_global_cell_9cef20cb19b42f4cfa85797b(), Int32Array))), u32(i32((i32(2048) | i32(8192)))));
  Gv_NewVar(__cxx_literal_4dc4203d8413880f18b4, i64(cSourceAddresses.encode(cObjectFieldRef(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value, "cameraq16horiz"))), u32(i32((i32(2048) | i32(1048576)))));
  Gv_NewVar(__cxx_literal_e4e413560f4afc3e2471, i64(cSourceAddresses.encode(cObjectFieldRef(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value, "cameraq16ang"))), u32(i32((i32(2048) | i32(1310720)))));
  Gv_NewVar(__cxx_literal_df322f0773e2da9c40cf, i64(cSourceAddresses.encode(cObjectFieldRef(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value, "cameraq16horiz"))), u32(i32((i32(2048) | i32(1310720)))));
  Gv_NewVar(__cxx_literal_76db0ca911ea010d33ce, i64(cSourceAddresses.encode(cObjectFieldRef(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value, "camerasect"))), u32(i32((i32(2048) | i32(32768)))));
  Gv_NewVar(__cxx_literal_ebd73e6042490a6bb565, i64(cSourceAddresses.encode(cObjectFieldRef(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.camerapos.__cxx_anonymous_0.__cxx_anonymous_0, "x"))), u32(i32((i32(2048) | i32(8192)))));
  Gv_NewVar(__cxx_literal_fa1a37f9f6058ec77ea4, i64(cSourceAddresses.encode(cObjectFieldRef(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.camerapos.__cxx_anonymous_0.__cxx_anonymous_0, "y"))), u32(i32((i32(2048) | i32(8192)))));
  Gv_NewVar(__cxx_literal_0fa723f710aeeadd5b10, i64(cSourceAddresses.encode(cObjectFieldRef(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.camerapos.__cxx_anonymous_0.__cxx_anonymous_0, "z"))), u32(i32((i32(2048) | i32(8192)))));
  Gv_NewVar(__cxx_literal_26b37f6016bf80682ee9, i64(cSourceAddresses.encode(cScalarLValueIO(__cxx_global_cell_0253173354832cddecae7ca7(), Int32Array))), u32(i32((i32((i32(2048) | i32(8192))) | i32(4096)))));
  Gv_NewVar(__cxx_literal_2208ca007bd773eae95d, i64(cSourceAddresses.encode(cObjectFieldRef(__cxx_global_cell_428db7966f68b580bdb8b8d9().value, "cur"))), u32(i32((i32(2048) | i32(8192)))));
  Gv_NewVar(__cxx_literal_7bb6ba0e5d59448eca45, i64(cSourceAddresses.encode(cScalarLValueIO(__cxx_global_cell_27361f8c1fd7174d309e19f2(), Int32Array))), u32(i32((i32(2048) | i32(8192)))));
  Gv_NewVar(__cxx_literal_90892e3eab70b8da9f05, i64(cSourceAddresses.encode(cScalarLValueIO(__cxx_global_cell_af7005133235fcf35d534b57(), Int32Array))), u32(i32((i32((i32(2048) | i32(8192))) | i32(4096)))));
  Gv_NewVar(__cxx_literal_c59e4eea532229701bc5, i64(cSourceAddresses.encode(cPointerOffset(g_gametypeFlags, __cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.coop, Int32Array.BYTES_PER_ELEMENT))), u32(i32((i32(2048) | i32(8192)))));
  Gv_NewVar(__cxx_literal_a4ad0101227c9e63fd80, i64(cSourceAddresses.encode(cScalarLValueIO(__cxx_global_cell_b1c97a6bfe6b79b1e897a68a(), Int32Array))), u32(i32((i32(2048) | i32(8192)))));
  Gv_NewVar(__cxx_literal_e60327195a3ccdabf4a4, i64(cSourceAddresses.encode(cObjectFieldRef(__cxx_global_cell_428db7966f68b580bdb8b8d9().value, "shade"))), u32(i32((i32(2048) | i32(8192)))));
  Gv_NewVar(__cxx_literal_d2ecb73f08e6f46c3a80, i64(cSourceAddresses.encode(cObjectFieldRef(__cxx_global_cell_428db7966f68b580bdb8b8d9().value, "gunposy"))), u32(i32((i32(2048) | i32(8192)))));
  Gv_NewVar(__cxx_literal_d630a3f22d46bcf6a3d8, i64(cSourceAddresses.encode(cScalarLValueIO(__cxx_global_cell_465a0b3c161b50504ffed39e(), Int32Array))), u32(i32((i32(2048) | i32(8192)))));
  Gv_NewVar(__cxx_literal_509314da1458426e6378, i64(cSourceAddresses.encode(cScalarLValueIO(__cxx_private_cell_b834440029b478ecb74accfe(), Int32Array))), u32(i32((i32(2048) | i32(8192)))));
  Gv_NewVar(__cxx_literal_34507ef131c08c5fdd15, i64(cSourceAddresses.encode(cObjectFieldRef(__cxx_global_cell_428db7966f68b580bdb8b8d9().value, "lookhalfang"))), u32(i32((i32(2048) | i32(8192)))));
  Gv_NewVar(__cxx_literal_cd3bc93060f8502a8637, i64(cSourceAddresses.encode(cObjectFieldRef(__cxx_global_cell_428db7966f68b580bdb8b8d9().value, "lookhoriz"))), u32(i32((i32(2048) | i32(8192)))));
  Gv_NewVar(__cxx_literal_2afa5ff9c401329ab77f, i64(cSourceAddresses.encode(cScalarLValueIO(__cxx_global_cell_04adffdeab684b9c52206917(), Int32Array))), u32(i32((i32((i32(2048) | i32(8192))) | i32(4096)))));
  Gv_NewVar(__cxx_literal_3b781a05bbe5e9087a9b, i64(cSourceAddresses.encode(cScalarLValueIO(__cxx_global_cell_af3e7a8f9b4d40a559acf109(), Int32Array))), u32(i32((i32((i32(2048) | i32(8192))) | i32(4096)))));
  Gv_NewVar(__cxx_literal_2019792425a4823108c8, i64(cSourceAddresses.encode(cScalarLValueIO(__cxx_global_cell_0d84c36af55f8d659082f1bb(), Int16Array))), u32(i32((i32((i32(2048) | i32(32768))) | i32(4096)))));
  Gv_NewVar(__cxx_literal_4bfc9e9efd53743eb591, i64(cSourceAddresses.encode(cScalarLValueIO(__cxx_global_cell_cff3db0365d00ccd4662087c(), Int32Array))), u32(i32((i32(2048) | i32(8192)))));
  Gv_NewVar(__cxx_literal_3bdc13c6e15c80937baf, i64(cSourceAddresses.encode(cScalarLValueIO(__cxx_global_cell_458f422a7bebe88265e9f694(), Int32Array))), u32(i32((i32((i32(2048) | i32(8192))) | i32(4096)))));
  Gv_NewVar(__cxx_literal_b8fd792d8c9529a2d829, i64(cSourceAddresses.encode(__cxx_global_cell_37d96f0d18da4d1ab96cf9c5())), u32(i32((i32((i32(2048) | i32(8192))) | i32(4096)))));
  Gv_NewVar(__cxx_literal_19f0e5077d9eefefe918, i64(cSourceAddresses.encode(cScalarLValueIO(__cxx_global_cell_c84014786923d3572b20a599(), Int32Array))), u32(i32((i32((i32(2048) | i32(8192))) | i32(4096)))));
  Gv_NewVar(__cxx_literal_64ea75e64ef7039e84f1, i64(cSourceAddresses.encode(cObjectFieldRef(__cxx_global_cell_428db7966f68b580bdb8b8d9().value, "gunposx"))), u32(i32((i32(2048) | i32(8192)))));
  Gv_NewVar(__cxx_literal_a78dda9d6faaeec99c16, i64(cSourceAddresses.encode(cObjectFieldRef(__cxx_global_cell_428db7966f68b580bdb8b8d9().value, "count"))), u32(i32((i32(2048) | i32(8192)))));
  Gv_NewVar(__cxx_literal_ebe62dcf7e8c11600f3d, i64(cSourceAddresses.encode(cObjectFieldRef(__cxx_global_cell_221fd34161be9be2eedf7faf().value, "x"))), u32(i32((i32((i32(2048) | i32(8192))) | i32(4096)))));
  Gv_NewVar(__cxx_literal_e692d08c7a0fccb75ee5, i64(cSourceAddresses.encode(cObjectFieldRef(__cxx_global_cell_46c79554e27038ae817b7d39().value, "x"))), u32(i32((i32((i32(2048) | i32(8192))) | i32(4096)))));
  Gv_NewVar(__cxx_literal_4ead0a4e7fc4a4997ca4, i64(cSourceAddresses.encode(cObjectFieldRef(__cxx_global_cell_221fd34161be9be2eedf7faf().value, "y"))), u32(i32((i32((i32(2048) | i32(8192))) | i32(4096)))));
  Gv_NewVar(__cxx_literal_8c9812f6580cc35365b6, i64(cSourceAddresses.encode(cObjectFieldRef(__cxx_global_cell_46c79554e27038ae817b7d39().value, "y"))), u32(i32((i32((i32(2048) | i32(8192))) | i32(4096)))));
  Gv_NewVar(__cxx_literal_63412c73a210634032a9, i64(cSourceAddresses.encode(cScalarLValueIO(__cxx_global_cell_22f848239c12c0d9f2b6f9e3(), Int32Array))), u32(i32((i32((i32(2048) | i32(8192))) | i32(4096)))));
  Gv_NewVar(__cxx_literal_a6797beecbcbd5f895b5, i64(cSourceAddresses.encode(cScalarLValueIO(__cxx_global_cell_ce636929c03d679219ea2982(), Int32Array))), u32(i32((i32((i32(2048) | i32(8192))) | i32(4096)))));
  Gv_NewVar(__cxx_literal_31062437e69c153a539c, i64(cSourceAddresses.encode(cScalarLValueIO(__cxx_global_cell_9de9945f48c8bc47d005b6f8(), Int32Array))), u32(i32((i32((i32(2048) | i32(8192))) | i32(4096)))));
  Gv_NewVar(__cxx_literal_3d0030233eb06cfeca59, i64(0), u32(i32((i32(4096) | i32(2048)))));
  Gv_NewArray(__cxx_literal_18cb9da2d5f1f3e69c12, cPointerOffset(gotpic, 0, Uint8Array.BYTES_PER_ELEMENT), i64(30720), u32(i32((i32(2048) | i32(1048576)))));
  Gv_NewArray(__cxx_literal_8c24e1fb9efcbabc1fbd, cPointerOffset(gotsector, 0, Uint8Array.BYTES_PER_ELEMENT), i64(4096), u32(i32((i32(2048) | i32(1048576)))));
  Gv_NewArray(__cxx_literal_096c4ea92c5dc802f5b8, cPointerOffset(g_radiusDmgStatnums, 0, Uint8Array.BYTES_PER_ELEMENT), i64(1024), u32(i32((i32(2048) | i32(1048576)))));
  Gv_NewArray(__cxx_literal_266f6bdd2ed6e57e5756, cPointerOffset(show2dsector, 0, Uint8Array.BYTES_PER_ELEMENT), i64(4096), u32(i32((i32(2048) | i32(1048576)))));
  Gv_NewArray(__cxx_literal_bd164fed14f70bdd234d, cObjectFieldRef((cPointerElementRef(cRecordPointer(tilesiz, {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, {}), 0).value), "x"), i64(30720), u32(i32((i32((i32((i32(2048) | i32(256))) | i32(4096))) | i32(16384)))));
  Gv_NewArray(__cxx_literal_1492c803c24736303120, cObjectFieldRef((cPointerElementRef(cRecordPointer(tilesiz, {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, {}), 0).value), "y"), i64(30720), u32(i32((i32((i32((i32(2048) | i32(256))) | i32(4096))) | i32(16384)))));
}

// C/C++ source: source/duke3d/src/gamevars.cpp:1935
const __cxx_literal_34e272a7ad16bfa8917d = Uint8Array.from([67, 79, 79, 80, 0]);
const __cxx_literal_cfd83a794cea6e103af9 = Uint8Array.from([70, 70, 73, 82, 69, 0]);
const __cxx_literal_0c2c183c87c1d573d8ab = Uint8Array.from([76, 69, 86, 69, 76, 0]);
const __cxx_literal_a89e855293acfa9a6397 = Uint8Array.from([77, 65, 82, 75, 69, 82, 0]);
const __cxx_literal_c79c0583375d3a1a84e9 = Uint8Array.from([77, 79, 78, 83, 84, 69, 82, 83, 95, 79, 70, 70, 0]);
const __cxx_literal_b931352399f51d78167a = Uint8Array.from([77, 85, 76, 84, 73, 77, 79, 68, 69, 0]);
const __cxx_literal_cae07beea3e37af21e60 = Uint8Array.from([78, 85, 77, 83, 69, 67, 84, 79, 82, 83, 0]);
const __cxx_literal_4e1db40576cfd70d4bd7 = Uint8Array.from([78, 85, 77, 87, 65, 76, 76, 83, 0]);
const __cxx_literal_fde44c5b4c4b1e01b130 = Uint8Array.from([78, 117, 109, 115, 112, 114, 105, 116, 101, 115, 0]);
const __cxx_literal_d5ba6e3a713de21824c3 = Uint8Array.from([82, 69, 83, 80, 65, 87, 78, 95, 73, 78, 86, 69, 78, 84, 79, 82, 89, 0]);
const __cxx_literal_2787e18fa41f89118f17 = Uint8Array.from([82, 69, 83, 80, 65, 87, 78, 95, 73, 84, 69, 77, 83, 0]);
const __cxx_literal_b126554c5cf8fa6d330c = Uint8Array.from([82, 69, 83, 80, 65, 87, 78, 95, 77, 79, 78, 83, 84, 69, 82, 83, 0]);
const __cxx_literal_3b2ab249902c2edb6eee = Uint8Array.from([86, 79, 76, 85, 77, 69, 0]);
const __cxx_literal_75946ae363278efea4fb = Uint8Array.from([97, 117, 116, 111, 109, 97, 112, 112, 105, 110, 103, 0]);
const __cxx_literal_4c9d5f74c29e0a9e1ed1 = Uint8Array.from([99, 97, 109, 101, 114, 97, 97, 110, 103, 0]);
const __cxx_literal_37693314926032e175a4 = Uint8Array.from([99, 97, 109, 101, 114, 97, 99, 108, 111, 99, 107, 0]);
const __cxx_literal_28e7b10503c08085ecaa = Uint8Array.from([99, 97, 109, 101, 114, 97, 100, 105, 115, 116, 0]);
const __cxx_literal_93462cc79150419ca0b2 = Uint8Array.from([99, 97, 109, 101, 114, 97, 104, 111, 114, 105, 122, 0]);
const __cxx_literal_1920e2bab15b6bb1c483 = Uint8Array.from([99, 97, 109, 101, 114, 97, 113, 49, 54, 97, 110, 103, 0]);
const __cxx_literal_efe68ef329117f5854d2 = Uint8Array.from([99, 97, 109, 101, 114, 97, 113, 49, 54, 104, 111, 114, 105, 122, 0]);
const __cxx_literal_bb3b7a75e0b5300b7224 = Uint8Array.from([99, 97, 109, 101, 114, 97, 115, 101, 99, 116, 0]);
const __cxx_literal_5590d4cf3fd01affc59b = Uint8Array.from([99, 97, 109, 101, 114, 97, 120, 0]);
const __cxx_literal_86b7de28b74b045d3a06 = Uint8Array.from([99, 97, 109, 101, 114, 97, 121, 0]);
const __cxx_literal_53b6cfa38a186eed0452 = Uint8Array.from([99, 97, 109, 101, 114, 97, 122, 0]);
const __cxx_literal_5d0f6a03c708e3b1a1bd = Uint8Array.from([99, 117, 114, 114, 101, 110, 116, 95, 109, 101, 110, 117, 0]);
const __cxx_literal_951b0ebc314745793515 = Uint8Array.from([99, 117, 114, 114, 101, 110, 116, 119, 101, 97, 112, 111, 110, 0]);
const __cxx_literal_b48e9d61b9ce07ebdae3 = Uint8Array.from([100, 105, 115, 112, 108, 97, 121, 95, 109, 105, 114, 114, 111, 114, 0]);
const __cxx_literal_5aedb04336a186444def = Uint8Array.from([102, 114, 97, 109, 101, 114, 97, 116, 101, 0]);
const __cxx_literal_7a1147d974631fdd2d33 = Uint8Array.from([103, 97, 109, 101, 116, 121, 112, 101, 95, 102, 108, 97, 103, 115, 0]);
const __cxx_literal_33ed68627a2c85eb7102 = Uint8Array.from([103, 114, 97, 118, 105, 116, 97, 116, 105, 111, 110, 97, 108, 99, 111, 110, 115, 116, 97, 110, 116, 0]);
const __cxx_literal_a90af6969b04b5333c41 = Uint8Array.from([103, 115, 0]);
const __cxx_literal_e50ecc67d20817790476 = Uint8Array.from([103, 117, 110, 95, 112, 111, 115, 0]);
const __cxx_literal_8e4ca176f3f7b7ceebf9 = Uint8Array.from([108, 97, 115, 116, 115, 97, 118, 101, 112, 111, 115, 0]);
const __cxx_literal_7995e6ce942549255c5b = Uint8Array.from([108, 97, 115, 116, 118, 105, 115, 105, 110, 99, 0]);
const __cxx_literal_81f74234ebbebb3871e0 = Uint8Array.from([108, 111, 111, 107, 105, 110, 103, 95, 97, 110, 103, 83, 82, 49, 0]);
const __cxx_literal_dbaf32621248ddfc1f27 = Uint8Array.from([108, 111, 111, 107, 105, 110, 103, 95, 97, 114, 99, 0]);
const __cxx_literal_b7c4c5aa508424dc0097 = Uint8Array.from([109, 121, 99, 111, 110, 110, 101, 99, 116, 105, 110, 100, 101, 120, 0]);
const __cxx_literal_ea5d025a7437794b60de = Uint8Array.from([110, 117, 109, 112, 108, 97, 121, 101, 114, 115, 0]);
const __cxx_literal_f507eaa85ef236f536b3 = Uint8Array.from([110, 117, 109, 115, 101, 99, 116, 111, 114, 115, 0]);
const __cxx_literal_0b1dc6848613eaca1ccd = Uint8Array.from([114, 97, 110, 100, 111, 109, 115, 101, 101, 100, 0]);
const __cxx_literal_17bc4f378e440d698ba8 = Uint8Array.from([115, 99, 114, 101, 101, 110, 112, 101, 101, 107, 0]);
const __cxx_literal_85a9d7d15c485ceec17a = Uint8Array.from([116, 111, 116, 97, 108, 99, 108, 111, 99, 107, 0]);
const __cxx_literal_91bec1c11ad1b351055e = Uint8Array.from([118, 105, 101, 119, 105, 110, 103, 114, 97, 110, 103, 101, 0]);
const __cxx_literal_c957b9c11b730cb87aed = Uint8Array.from([119, 101, 97, 112, 111, 110, 95, 120, 111, 102, 102, 115, 101, 116, 0]);
const __cxx_literal_b8e1f043cd45bb24fda3 = Uint8Array.from([119, 101, 97, 112, 111, 110, 99, 111, 117, 110, 116, 0]);
const __cxx_literal_8fbf2a4c9c19246829c7 = Uint8Array.from([119, 105, 110, 100, 111, 119, 120, 49, 0]);
const __cxx_literal_6485dcf6ef04fdfb8a00 = Uint8Array.from([119, 105, 110, 100, 111, 119, 120, 50, 0]);
const __cxx_literal_69e90fa966694cfec1eb = Uint8Array.from([119, 105, 110, 100, 111, 119, 121, 49, 0]);
const __cxx_literal_2937d4f1f6c21ac084de = Uint8Array.from([119, 105, 110, 100, 111, 119, 121, 50, 0]);
const __cxx_literal_d3780b053a964cabd588 = Uint8Array.from([120, 100, 105, 109, 0]);
const __cxx_literal_e97d1a0c82b34edcc1e2 = Uint8Array.from([121, 100, 105, 109, 0]);
const __cxx_literal_991030b6d3878a29a954 = Uint8Array.from([121, 120, 97, 115, 112, 101, 99, 116, 0]);
const __cxx_literal_54d2f50360fd0abbffd3 = Uint8Array.from([103, 111, 116, 112, 105, 99, 0]);
const __cxx_literal_37ba1528bc58cf12f6c8 = Uint8Array.from([103, 111, 116, 115, 101, 99, 116, 111, 114, 0]);
const __cxx_literal_d27484256d04ad475658 = Uint8Array.from([114, 97, 100, 105, 117, 115, 100, 109, 103, 115, 116, 97, 116, 110, 117, 109, 115, 0]);
const __cxx_literal_6706d3039986306e86f7 = Uint8Array.from([115, 104, 111, 119, 50, 100, 115, 101, 99, 116, 111, 114, 0]);
const __cxx_literal_0280dd40cddd3bb16ce1 = Uint8Array.from([116, 105, 108, 101, 115, 105, 122, 120, 0]);
const __cxx_literal_09836fcff46717285804 = Uint8Array.from([116, 105, 108, 101, 115, 105, 122, 121, 0]);
export function Gv_RefreshPointers() {
  ((cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), Gv_GetVarIndex(__cxx_literal_34e272a7ad16bfa8917d)).value).__cxx_anonymous_0.global = i64(cSourceAddresses.encode(cObjectFieldRef(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value, "coop"))));
  ((cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), Gv_GetVarIndex(__cxx_literal_cfd83a794cea6e103af9)).value).__cxx_anonymous_0.global = i64(cSourceAddresses.encode(cObjectFieldRef(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value, "ffire"))));
  ((cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), Gv_GetVarIndex(__cxx_literal_0c2c183c87c1d573d8ab)).value).__cxx_anonymous_0.global = i64(cSourceAddresses.encode(cObjectFieldRef(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value, "level_number"))));
  ((cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), Gv_GetVarIndex(__cxx_literal_a89e855293acfa9a6397)).value).__cxx_anonymous_0.global = i64(cSourceAddresses.encode(cObjectFieldRef(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value, "marker"))));
  ((cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), Gv_GetVarIndex(__cxx_literal_c79c0583375d3a1a84e9)).value).__cxx_anonymous_0.global = i64(cSourceAddresses.encode(cObjectFieldRef(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value, "monsters_off"))));
  ((cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), Gv_GetVarIndex(__cxx_literal_b931352399f51d78167a)).value).__cxx_anonymous_0.global = i64(cSourceAddresses.encode(cObjectFieldRef(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value, "multimode"))));
  ((cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), Gv_GetVarIndex(__cxx_literal_cae07beea3e37af21e60)).value).__cxx_anonymous_0.global = i64(cSourceAddresses.encode(cScalarLValueIO(__cxx_global_cell_0d84c36af55f8d659082f1bb(), Int16Array))));
  ((cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), Gv_GetVarIndex(__cxx_literal_4e1db40576cfd70d4bd7)).value).__cxx_anonymous_0.global = i64(cSourceAddresses.encode(cScalarLValueIO(__cxx_global_cell_9fbed4c78bef6ce8bf955682(), Int16Array))));
  ((cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), Gv_GetVarIndex(__cxx_literal_fde44c5b4c4b1e01b130)).value).__cxx_anonymous_0.global = i64(cSourceAddresses.encode(cScalarLValueIO(__cxx_global_cell_4e6f24ae9c3dade74700992b(), Int32Array))));
  ((cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), Gv_GetVarIndex(__cxx_literal_d5ba6e3a713de21824c3)).value).__cxx_anonymous_0.global = i64(cSourceAddresses.encode(cObjectFieldRef(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value, "respawn_inventory"))));
  ((cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), Gv_GetVarIndex(__cxx_literal_2787e18fa41f89118f17)).value).__cxx_anonymous_0.global = i64(cSourceAddresses.encode(cObjectFieldRef(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value, "respawn_items"))));
  ((cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), Gv_GetVarIndex(__cxx_literal_b126554c5cf8fa6d330c)).value).__cxx_anonymous_0.global = i64(cSourceAddresses.encode(cObjectFieldRef(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value, "respawn_monsters"))));
  ((cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), Gv_GetVarIndex(__cxx_literal_3b2ab249902c2edb6eee)).value).__cxx_anonymous_0.global = i64(cSourceAddresses.encode(cObjectFieldRef(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value, "volume_number"))));
  ((cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), Gv_GetVarIndex(__cxx_literal_75946ae363278efea4fb)).value).__cxx_anonymous_0.global = i64(cSourceAddresses.encode(cScalarLValueIO(__cxx_global_cell_c1c0a03508c5080698c5ec5d(), Int32Array))));
  ((cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), Gv_GetVarIndex(__cxx_literal_4c9d5f74c29e0a9e1ed1)).value).__cxx_anonymous_0.global = i64(cSourceAddresses.encode(cObjectFieldRef(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value, "cameraq16ang"))));
  ((cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), Gv_GetVarIndex(__cxx_literal_37693314926032e175a4)).value).__cxx_anonymous_0.global = i64(cSourceAddresses.encode(cScalarLValueIO(__cxx_global_cell_915885e2bacffc3a024f309d(), Int32Array))));
  ((cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), Gv_GetVarIndex(__cxx_literal_28e7b10503c08085ecaa)).value).__cxx_anonymous_0.global = i64(cSourceAddresses.encode(cScalarLValueIO(__cxx_global_cell_9cef20cb19b42f4cfa85797b(), Int32Array))));
  ((cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), Gv_GetVarIndex(__cxx_literal_93462cc79150419ca0b2)).value).__cxx_anonymous_0.global = i64(cSourceAddresses.encode(cObjectFieldRef(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value, "cameraq16horiz"))));
  ((cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), Gv_GetVarIndex(__cxx_literal_1920e2bab15b6bb1c483)).value).__cxx_anonymous_0.global = i64(cSourceAddresses.encode(cObjectFieldRef(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value, "cameraq16ang"))));
  ((cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), Gv_GetVarIndex(__cxx_literal_efe68ef329117f5854d2)).value).__cxx_anonymous_0.global = i64(cSourceAddresses.encode(cObjectFieldRef(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value, "cameraq16horiz"))));
  ((cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), Gv_GetVarIndex(__cxx_literal_bb3b7a75e0b5300b7224)).value).__cxx_anonymous_0.global = i64(cSourceAddresses.encode(cObjectFieldRef(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value, "camerasect"))));
  ((cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), Gv_GetVarIndex(__cxx_literal_5590d4cf3fd01affc59b)).value).__cxx_anonymous_0.global = i64(cSourceAddresses.encode(cObjectFieldRef(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.camerapos.__cxx_anonymous_0.__cxx_anonymous_0, "x"))));
  ((cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), Gv_GetVarIndex(__cxx_literal_86b7de28b74b045d3a06)).value).__cxx_anonymous_0.global = i64(cSourceAddresses.encode(cObjectFieldRef(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.camerapos.__cxx_anonymous_0.__cxx_anonymous_0, "y"))));
  ((cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), Gv_GetVarIndex(__cxx_literal_53b6cfa38a186eed0452)).value).__cxx_anonymous_0.global = i64(cSourceAddresses.encode(cObjectFieldRef(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.camerapos.__cxx_anonymous_0.__cxx_anonymous_0, "z"))));
  ((cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), Gv_GetVarIndex(__cxx_literal_5d0f6a03c708e3b1a1bd)).value).__cxx_anonymous_0.global = i64(cSourceAddresses.encode(cScalarLValueIO(__cxx_global_cell_0253173354832cddecae7ca7(), Int32Array))));
  ((cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), Gv_GetVarIndex(__cxx_literal_951b0ebc314745793515)).value).__cxx_anonymous_0.global = i64(cSourceAddresses.encode(cObjectFieldRef(__cxx_global_cell_428db7966f68b580bdb8b8d9().value, "cur"))));
  ((cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), Gv_GetVarIndex(__cxx_literal_b48e9d61b9ce07ebdae3)).value).__cxx_anonymous_0.global = i64(cSourceAddresses.encode(cScalarLValueIO(__cxx_global_cell_27361f8c1fd7174d309e19f2(), Int32Array))));
  ((cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), Gv_GetVarIndex(__cxx_literal_5aedb04336a186444def)).value).__cxx_anonymous_0.global = i64(cSourceAddresses.encode(cScalarLValueIO(__cxx_global_cell_af7005133235fcf35d534b57(), Int32Array))));
  ((cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), Gv_GetVarIndex(__cxx_literal_7a1147d974631fdd2d33)).value).__cxx_anonymous_0.global = i64(cSourceAddresses.encode(cPointerOffset(g_gametypeFlags, __cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.coop, Int32Array.BYTES_PER_ELEMENT))));
  ((cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), Gv_GetVarIndex(__cxx_literal_33ed68627a2c85eb7102)).value).__cxx_anonymous_0.global = i64(cSourceAddresses.encode(cScalarLValueIO(__cxx_global_cell_b1c97a6bfe6b79b1e897a68a(), Int32Array))));
  ((cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), Gv_GetVarIndex(__cxx_literal_a90af6969b04b5333c41)).value).__cxx_anonymous_0.global = i64(cSourceAddresses.encode(cObjectFieldRef(__cxx_global_cell_428db7966f68b580bdb8b8d9().value, "shade"))));
  ((cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), Gv_GetVarIndex(__cxx_literal_e50ecc67d20817790476)).value).__cxx_anonymous_0.global = i64(cSourceAddresses.encode(cObjectFieldRef(__cxx_global_cell_428db7966f68b580bdb8b8d9().value, "gunposy"))));
  ((cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), Gv_GetVarIndex(__cxx_literal_8e4ca176f3f7b7ceebf9)).value).__cxx_anonymous_0.global = i64(cSourceAddresses.encode(cScalarLValueIO(__cxx_global_cell_465a0b3c161b50504ffed39e(), Int32Array))));
  ((cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), Gv_GetVarIndex(__cxx_literal_7995e6ce942549255c5b)).value).__cxx_anonymous_0.global = i64(cSourceAddresses.encode(cScalarLValueIO(__cxx_private_cell_b834440029b478ecb74accfe(), Int32Array))));
  ((cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), Gv_GetVarIndex(__cxx_literal_81f74234ebbebb3871e0)).value).__cxx_anonymous_0.global = i64(cSourceAddresses.encode(cObjectFieldRef(__cxx_global_cell_428db7966f68b580bdb8b8d9().value, "lookhalfang"))));
  ((cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), Gv_GetVarIndex(__cxx_literal_dbaf32621248ddfc1f27)).value).__cxx_anonymous_0.global = i64(cSourceAddresses.encode(cObjectFieldRef(__cxx_global_cell_428db7966f68b580bdb8b8d9().value, "lookhoriz"))));
  ((cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), Gv_GetVarIndex(__cxx_literal_b7c4c5aa508424dc0097)).value).__cxx_anonymous_0.global = i64(cSourceAddresses.encode(cScalarLValueIO(__cxx_global_cell_04adffdeab684b9c52206917(), Int32Array))));
  ((cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), Gv_GetVarIndex(__cxx_literal_ea5d025a7437794b60de)).value).__cxx_anonymous_0.global = i64(cSourceAddresses.encode(cScalarLValueIO(__cxx_global_cell_af3e7a8f9b4d40a559acf109(), Int32Array))));
  ((cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), Gv_GetVarIndex(__cxx_literal_f507eaa85ef236f536b3)).value).__cxx_anonymous_0.global = i64(cSourceAddresses.encode(cScalarLValueIO(__cxx_global_cell_0d84c36af55f8d659082f1bb(), Int16Array))));
  ((cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), Gv_GetVarIndex(__cxx_literal_0b1dc6848613eaca1ccd)).value).__cxx_anonymous_0.global = i64(cSourceAddresses.encode(cScalarLValueIO(__cxx_global_cell_cff3db0365d00ccd4662087c(), Int32Array))));
  ((cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), Gv_GetVarIndex(__cxx_literal_17bc4f378e440d698ba8)).value).__cxx_anonymous_0.global = i64(cSourceAddresses.encode(cScalarLValueIO(__cxx_global_cell_458f422a7bebe88265e9f694(), Int32Array))));
  ((cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), Gv_GetVarIndex(__cxx_literal_85a9d7d15c485ceec17a)).value).__cxx_anonymous_0.global = i64(cSourceAddresses.encode(__cxx_global_cell_37d96f0d18da4d1ab96cf9c5())));
  ((cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), Gv_GetVarIndex(__cxx_literal_91bec1c11ad1b351055e)).value).__cxx_anonymous_0.global = i64(cSourceAddresses.encode(cScalarLValueIO(__cxx_global_cell_c84014786923d3572b20a599(), Int32Array))));
  ((cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), Gv_GetVarIndex(__cxx_literal_c957b9c11b730cb87aed)).value).__cxx_anonymous_0.global = i64(cSourceAddresses.encode(cObjectFieldRef(__cxx_global_cell_428db7966f68b580bdb8b8d9().value, "gunposx"))));
  ((cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), Gv_GetVarIndex(__cxx_literal_b8e1f043cd45bb24fda3)).value).__cxx_anonymous_0.global = i64(cSourceAddresses.encode(cObjectFieldRef(__cxx_global_cell_428db7966f68b580bdb8b8d9().value, "count"))));
  ((cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), Gv_GetVarIndex(__cxx_literal_8fbf2a4c9c19246829c7)).value).__cxx_anonymous_0.global = i64(cSourceAddresses.encode(cObjectFieldRef(__cxx_global_cell_221fd34161be9be2eedf7faf().value, "x"))));
  ((cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), Gv_GetVarIndex(__cxx_literal_6485dcf6ef04fdfb8a00)).value).__cxx_anonymous_0.global = i64(cSourceAddresses.encode(cObjectFieldRef(__cxx_global_cell_46c79554e27038ae817b7d39().value, "x"))));
  ((cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), Gv_GetVarIndex(__cxx_literal_69e90fa966694cfec1eb)).value).__cxx_anonymous_0.global = i64(cSourceAddresses.encode(cObjectFieldRef(__cxx_global_cell_221fd34161be9be2eedf7faf().value, "y"))));
  ((cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), Gv_GetVarIndex(__cxx_literal_2937d4f1f6c21ac084de)).value).__cxx_anonymous_0.global = i64(cSourceAddresses.encode(cObjectFieldRef(__cxx_global_cell_46c79554e27038ae817b7d39().value, "y"))));
  ((cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), Gv_GetVarIndex(__cxx_literal_d3780b053a964cabd588)).value).__cxx_anonymous_0.global = i64(cSourceAddresses.encode(cScalarLValueIO(__cxx_global_cell_22f848239c12c0d9f2b6f9e3(), Int32Array))));
  ((cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), Gv_GetVarIndex(__cxx_literal_e97d1a0c82b34edcc1e2)).value).__cxx_anonymous_0.global = i64(cSourceAddresses.encode(cScalarLValueIO(__cxx_global_cell_ce636929c03d679219ea2982(), Int32Array))));
  ((cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), Gv_GetVarIndex(__cxx_literal_991030b6d3878a29a954)).value).__cxx_anonymous_0.global = i64(cSourceAddresses.encode(cScalarLValueIO(__cxx_global_cell_9de9945f48c8bc47d005b6f8(), Int32Array))));
  ((cPointerElementRef(cRecordPointer(aGameArrays, {"align": 1, "arrayAlign": 1, "fields": {"flags": {"native": "BigUint64Array", "offset": 24, "size": 8}, "pValues": {"offset": 8, "pointer": true, "size": 8}, "size": {"native": "BigInt64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {}), Gv_GetArrayIndex(__cxx_literal_54d2f50360fd0abbffd3)).value).pValues = cTypedPointer(cPointerOffset(gotpic, 0, Uint8Array.BYTES_PER_ELEMENT), BigInt64Array));
  ((cPointerElementRef(cRecordPointer(aGameArrays, {"align": 1, "arrayAlign": 1, "fields": {"flags": {"native": "BigUint64Array", "offset": 24, "size": 8}, "pValues": {"offset": 8, "pointer": true, "size": 8}, "size": {"native": "BigInt64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {}), Gv_GetArrayIndex(__cxx_literal_37ba1528bc58cf12f6c8)).value).pValues = cTypedPointer(cPointerOffset(gotsector, 0, Uint8Array.BYTES_PER_ELEMENT), BigInt64Array));
  ((cPointerElementRef(cRecordPointer(aGameArrays, {"align": 1, "arrayAlign": 1, "fields": {"flags": {"native": "BigUint64Array", "offset": 24, "size": 8}, "pValues": {"offset": 8, "pointer": true, "size": 8}, "size": {"native": "BigInt64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {}), Gv_GetArrayIndex(__cxx_literal_d27484256d04ad475658)).value).pValues = cTypedPointer(cPointerOffset(g_radiusDmgStatnums, 0, Uint8Array.BYTES_PER_ELEMENT), BigInt64Array));
  ((cPointerElementRef(cRecordPointer(aGameArrays, {"align": 1, "arrayAlign": 1, "fields": {"flags": {"native": "BigUint64Array", "offset": 24, "size": 8}, "pValues": {"offset": 8, "pointer": true, "size": 8}, "size": {"native": "BigInt64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {}), Gv_GetArrayIndex(__cxx_literal_6706d3039986306e86f7)).value).pValues = cTypedPointer(cPointerOffset(show2dsector, 0, Uint8Array.BYTES_PER_ELEMENT), BigInt64Array));
  ((cPointerElementRef(cRecordPointer(aGameArrays, {"align": 1, "arrayAlign": 1, "fields": {"flags": {"native": "BigUint64Array", "offset": 24, "size": 8}, "pValues": {"offset": 8, "pointer": true, "size": 8}, "size": {"native": "BigInt64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {}), Gv_GetArrayIndex(__cxx_literal_0280dd40cddd3bb16ce1)).value).pValues = cTypedPointer(cObjectFieldRef((cPointerElementRef(cRecordPointer(tilesiz, {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, {}), 0).value), "x"), BigInt64Array));
  ((cPointerElementRef(cRecordPointer(aGameArrays, {"align": 1, "arrayAlign": 1, "fields": {"flags": {"native": "BigUint64Array", "offset": 24, "size": 8}, "pValues": {"offset": 8, "pointer": true, "size": 8}, "size": {"native": "BigInt64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {}), Gv_GetArrayIndex(__cxx_literal_09836fcff46717285804)).value).pValues = cTypedPointer(cObjectFieldRef((cPointerElementRef(cRecordPointer(tilesiz, {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, {}), 0).value), "y"), BigInt64Array));
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
    cAssignAggregate((cPointerElementRef(cRecordPointer(bfdivtable32, {"align": 1, "arrayAlign": 1, "fields": {"magic": {"native": "Int32Array", "offset": 0, "size": 4}, "more": {"native": "Uint8Array", "offset": 4, "size": 1}}, "overlaps": false, "size": 5, "union": false}, {}), 0).value), libdivide_s32_branchfree_gen((__cxx_global_cell_b6db0759e33cdbb028a91dc6().value = i32(d))), {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"magic": {"native": "Int32Array", "offset": 0, "size": 4}, "more": {"native": "Uint8Array", "offset": 4, "size": 1}}, "overlaps": false, "size": 5, "union": false}}, {"abi": "source-clang-trivial-record-assignment/1", "assignment_mode": "moveAssign", "clang_assignment_signature": "libdivide_s32_branchfree_t &(libdivide_s32_branchfree_t &&) noexcept", "clang_method_id": "0x1fb3abbee20", "native_layout": {"abi": "source-record-field-storage/1", "sha256": "9ce070c4dbcc716e36f4dc7d230c2fe3683993c7fa9c37d6a637a708f7c906c0"}, "record_name": "libdivide::libdivide_s32_branchfree_t", "source_record": "libdivide::libdivide_s32_branchfree_t"});
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
const __cxx_literal_ab6b6413db8b7189ffde = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 105, 110, 99, 108, 117, 100, 101, 47, 112, 114, 105, 110, 116, 46, 104, 0]);
const __cxx_literal_4d35e16dbf828521057e = Uint8Array.from([37, 115, 0]);
export function buildprint__template_d684cd61d5016db8(args) {
  let buf = cTypedPointer(cStackAlloc(u64(i32((1024 + 1)))), Uint8Array);
  ((cDeref(cPointerOffset(buf, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(0) & 255)) & 255));
  let len = u64(buildprint_internal____header_64680af765ba(buf, args));
  (__cxx_global_cell_079877be927e9ceeb785b6a6().value = Boolean(false));
  ((i32(0) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(0), __cxx_literal_ab6b6413db8b7189ffde, u32(196), __cxx_literal_4d35e16dbf828521057e, buf));
  (__cxx_global_cell_079877be927e9ceeb785b6a6().value = Boolean(true));
  initputs(buf);
  return u64(len);
}

// C/C++ source: source/build/include/print.h:189
const __cxx_literal_71a50015e564de7970eb = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 105, 110, 99, 108, 117, 100, 101, 47, 112, 114, 105, 110, 116, 46, 104, 0]);
const __cxx_literal_4ae3fe80d52d92a593e5 = Uint8Array.from([37, 115, 0]);
export function buildprint__template_7e9230c56c320659(args, __cxx_parameter_1_args, __cxx_parameter_2_args) {
  let buf = cTypedPointer(cStackAlloc(u64(i32((1024 + 1)))), Uint8Array);
  ((cDeref(cPointerOffset(buf, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(0) & 255)) & 255));
  let len = u64(buildprint_internal____template_50022899cc4b822b(buf, args, __cxx_parameter_1_args, __cxx_parameter_2_args));
  (__cxx_global_cell_079877be927e9ceeb785b6a6().value = Boolean(false));
  ((i32(0) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(0), __cxx_literal_71a50015e564de7970eb, u32(196), __cxx_literal_4ae3fe80d52d92a593e5, buf));
  (__cxx_global_cell_079877be927e9ceeb785b6a6().value = Boolean(true));
  initputs(buf);
  return u64(len);
}

// C/C++ source: source/build/include/print.h:189
const __cxx_literal_045abcb907e4b103b8e3 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 105, 110, 99, 108, 117, 100, 101, 47, 112, 114, 105, 110, 116, 46, 104, 0]);
const __cxx_literal_725190f717eba2f692c7 = Uint8Array.from([37, 115, 0]);
export function buildprint__template_3e16cb6dcd32c503(args) {
  let buf = cTypedPointer(cStackAlloc(u64(i32((1024 + 1)))), Uint8Array);
  ((cDeref(cPointerOffset(buf, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(0) & 255)) & 255));
  let len = u64(buildprint_internal____header_2f15807bc739(buf, args));
  (__cxx_global_cell_079877be927e9ceeb785b6a6().value = Boolean(false));
  ((i32(0) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(0), __cxx_literal_045abcb907e4b103b8e3, u32(196), __cxx_literal_725190f717eba2f692c7, buf));
  (__cxx_global_cell_079877be927e9ceeb785b6a6().value = Boolean(true));
  initputs(buf);
  return u64(len);
}

// C/C++ source: source/build/include/print.h:189
const __cxx_literal_34a4c76e355c56a16f38 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 105, 110, 99, 108, 117, 100, 101, 47, 112, 114, 105, 110, 116, 46, 104, 0]);
const __cxx_literal_48355840241a4cbad952 = Uint8Array.from([37, 115, 0]);
export function buildprint__template_04215400977ec9df(args) {
  let buf = cTypedPointer(cStackAlloc(u64(i32((1024 + 1)))), Uint8Array);
  ((cDeref(cPointerOffset(buf, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(0) & 255)) & 255));
  let len = u64(buildprint_internal____header_d3c79e08e127(buf, args));
  (__cxx_global_cell_079877be927e9ceeb785b6a6().value = Boolean(false));
  ((i32(0) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(0), __cxx_literal_34a4c76e355c56a16f38, u32(196), __cxx_literal_48355840241a4cbad952, buf));
  (__cxx_global_cell_079877be927e9ceeb785b6a6().value = Boolean(true));
  initputs(buf);
  return u64(len);
}

// C/C++ source: source/build/include/print.h:189
const __cxx_literal_5e3a856288520245f08c = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 105, 110, 99, 108, 117, 100, 101, 47, 112, 114, 105, 110, 116, 46, 104, 0]);
const __cxx_literal_ec09ad405c127ec5bb72 = Uint8Array.from([37, 115, 0]);
export function buildprint__template_4663c7d7435d5abb(args) {
  let buf = cTypedPointer(cStackAlloc(u64(i32((1024 + 1)))), Uint8Array);
  ((cDeref(cPointerOffset(buf, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(0) & 255)) & 255));
  let len = u64(buildprint_internal____header_86459e5b755a(buf, args));
  (__cxx_global_cell_079877be927e9ceeb785b6a6().value = Boolean(false));
  ((i32(0) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(0), __cxx_literal_5e3a856288520245f08c, u32(196), __cxx_literal_ec09ad405c127ec5bb72, buf));
  (__cxx_global_cell_079877be927e9ceeb785b6a6().value = Boolean(true));
  initputs(buf);
  return u64(len);
}

// C/C++ source: source/build/include/print.h:189
const __cxx_literal_bd371572f4c5c5aabf2d = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 105, 110, 99, 108, 117, 100, 101, 47, 112, 114, 105, 110, 116, 46, 104, 0]);
const __cxx_literal_98c4790af19101b7fc47 = Uint8Array.from([37, 115, 0]);
export function buildprint__template_d6f52b498a2a6584(args, __cxx_parameter_1_args) {
  let buf = cTypedPointer(cStackAlloc(u64(i32((1024 + 1)))), Uint8Array);
  ((cDeref(cPointerOffset(buf, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(0) & 255)) & 255));
  let len = u64(buildprint_internal____template_05bda03ec62a3a9d(buf, args, __cxx_parameter_1_args));
  (__cxx_global_cell_079877be927e9ceeb785b6a6().value = Boolean(false));
  ((i32(0) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(0), __cxx_literal_bd371572f4c5c5aabf2d, u32(196), __cxx_literal_98c4790af19101b7fc47, buf));
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
    cAssignAggregate((cPointerElementRef(cRecordPointer(divtable64, {"align": 1, "arrayAlign": 1, "fields": {"magic": {"native": "BigInt64Array", "offset": 0, "size": 8}, "more": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 9, "union": false}, {}), 0).value), libdivide_s64_gen((__cxx_global_cell_f8287b2e627d0e3f51b90c55().value = i64(d))), {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"magic": {"native": "BigInt64Array", "offset": 0, "size": 8}, "more": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 9, "union": false}}, {"abi": "source-clang-trivial-record-assignment/1", "assignment_mode": "moveAssign", "clang_assignment_signature": "libdivide_s64_t &(libdivide_s64_t &&) noexcept", "clang_method_id": "0x1fb3abbb810", "native_layout": {"abi": "source-record-field-storage/1", "sha256": "530e844acf5f4aae77d6501332d2314b0565b5453efe01e50ae4b2242323f757"}, "record_name": "libdivide::libdivide_s64_t", "source_record": "libdivide::libdivide_s64_t"});
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
