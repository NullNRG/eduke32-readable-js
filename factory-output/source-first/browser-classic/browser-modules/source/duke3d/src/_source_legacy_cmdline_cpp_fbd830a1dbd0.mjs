// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/duke3d/src/cmdline.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
import { Alloc__cxx_static_e0036cfb06bcfe42 } from "../../build/src/smmalloc_generic.cpp.mjs";
import { __cxx_global_cell_e9e7cdf79aac46339de9f120 } from "./cmdline.cpp.mjs";
import { __cxx_global_cell_ad89a438a2202d5a29d0d26d } from "./cmdline.cpp.mjs";
import { Demo_PlayFirst } from "./demo.cpp.mjs";
import { Demo_SetFirst } from "./demo.cpp.mjs";
import { Destroy__cxx_static_777d0ae31c789182 } from "../../build/src/smmalloc_generic.cpp.mjs";
import { Free__cxx_static_0dfd3f42f0dc2c05 } from "../../build/src/smmalloc_generic.cpp.mjs";
import { G_AddClipMap } from "../../build/src/common.cpp.mjs";
import { G_AddCon } from "./common.cpp.mjs";
import { G_AddConModule } from "./common.cpp.mjs";
import { G_AddDef } from "../../build/src/common.cpp.mjs";
import { G_AddDefModule } from "../../build/src/common.cpp.mjs";
import { G_AddGroup } from "./common.cpp.mjs";
import { G_AddPath } from "./common.cpp.mjs";
import { __cxx_global_cell_8405b1e60e6765b2469532f3 } from "./game.cpp.mjs";
import { clearDefNamePtr } from "../../build/src/common.cpp.mjs";
import { clearGrpNamePtr } from "./common.cpp.mjs";
import { clearScriptNamePtr } from "./common.cpp.mjs";
import { current_verbosity_cutoff } from "../../build/src/loguru.cpp.mjs";
import { __cxx_global_cell_e52bb48b6936f3f6004987dc } from "./common.cpp.mjs";
import { __cxx_global_cell_d0bf40931b0c2bbed6177e3e } from "../../build/src/common.cpp.mjs";
import { __cxx_global_cell_b0440c970e7e8379f59d19e9 } from "./cmdline.cpp.mjs";
import { __cxx_global_cell_d0cb64ef22766dce0c3d933d } from "../../build/src/baselayer.cpp.mjs";
import { __cxx_global_cell_64336b74df686a41ba0b80a3 } from "../../build/src/common.cpp.mjs";
import { __cxx_global_cell_99af70ece63462b77bc5f6d7 } from "./cmdline.cpp.mjs";
import { g_firstDemoFile } from "./demo.cpp.mjs";
import { __cxx_global_cell_358690684395ca8ea893b93b } from "./cmdline.cpp.mjs";
import { __cxx_global_cell_c0e288040dbf9a805036c27d } from "./common.cpp.mjs";
import { __cxx_global_cell_27587671eaba76ec3d4a0ad1 } from "./common.cpp.mjs";
import { __cxx_global_cell_e9576a5286a0997ea679c8d5 } from "./global.cpp.mjs";
import { g_modDir } from "../../build/src/vfs.cpp.mjs";
import { __cxx_global_cell_8ae7c85e4eb0188a9d92564a } from "./network.cpp.mjs";
import { __cxx_global_cell_f496251f4ec050118ec259dc } from "./cmdline.cpp.mjs";
import { __cxx_global_cell_d47d33660ab59c48cbbd560e } from "./screens.cpp.mjs";
import { __cxx_global_cell_53eb40c63961c8df63fc36b2 } from "./cmdline.cpp.mjs";
import { __cxx_global_cell_2553af87fa9f43a7967c16e8 } from "./cmdline.cpp.mjs";
import { __cxx_global_cell_6f3783697feff1b900f4941b } from "./cmdline.cpp.mjs";
import { g_player } from "./global.cpp.mjs";
import { __cxx_global_cell_7dc6e906fd58688c90792303 } from "../../build/src/engine.cpp.mjs";
import { __cxx_global_cell_41b93597aa1b675c52f24290 } from "./common.cpp.mjs";
import { __cxx_global_cell_428952e2c5a589c67db10fcc } from "./global.cpp.mjs";
import { __cxx_global_cell_fdd997c846b5c711252a3504 } from "./common.cpp.mjs";
import { g_setupFileName } from "./global.cpp.mjs";
import { __cxx_global_cell_11016d3c7177543e564ab46c } from "../../build/src/compat.cpp.mjs";
import { __cxx_global_cell_6c47f72ba9178ee1cea25b07 } from "./common.cpp.mjs";
import { handle_memerr } from "../../build/src/compat.cpp.mjs";
import { isdigit } from "../../../browser-abi/libc_provider.mjs";
import { loguru_log } from "../../../browser-abi/loguru_provider.mjs";
import { memcpy } from "../../../browser-abi/libc_provider.mjs";
import { __cxx_global_cell_552d0c90c43704c86f3ecf87 } from "../../build/src/rev.cpp.mjs";
import { snprintf } from "../../../browser-abi/libc_provider.mjs";
import { sprintf } from "../../../browser-abi/libc_provider.mjs";
import { sscanf } from "../../../browser-abi/libc_provider.mjs";
import { strcasecmp } from "../../../browser-abi/libc_provider.mjs";
import { strchr } from "../../../browser-abi/libc_provider.mjs";
import { strcpy } from "../../../browser-abi/libc_provider.mjs";
import { strlen } from "../../../browser-abi/libc_provider.mjs";
import { strrchr } from "../../../browser-abi/libc_provider.mjs";
import { strtol } from "../../../browser-abi/libc_provider.mjs";
import { tempbuf } from "./global.cpp.mjs";
import { tolower } from "../../../browser-abi/libc_provider.mjs";
import { __cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba } from "./global.cpp.mjs";
import { wm_msgbox } from "../../build/src/sdlayer.cpp.mjs";

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

function i32(value) { return typeof value === "bigint" ? Number(BigInt.asIntN(32,value)) : Number(value) | 0; }
function u32(value) { return typeof value === "bigint" ? Number(BigInt.asUintN(32,value)) : Number(value) >>> 0; }
function u64(value) { return BigInt.asUintN(64, BigInt(value)); }


const clz64 = value => {let v=BigInt.asUintN(64,BigInt(value));if(v===0n)return 64;let n=0;while((v&(1n<<63n))===0n){v<<=1n;n++;}return n;};
const ctz64 = (value,width) => {let v=BigInt.asUintN(width,BigInt(value));if(v===0n)return width;let n=0;while((v&1n)===0n){v>>=1n;n++;}return n;};
const popcnt = value => {let v=value,n=0;while(v){v&=v-1n;n++;}return n;};

const __builtin_unreachable = () => { throw new Error("C++ undefined behavior: reached __builtin_unreachable"); };
// C/C++ source: source/duke3d/src/cmdline.cpp:39
let __static_G_ShowParameterHelp_s = (() => { const bytes = new Uint8Array(1415); bytes.set([85, 115, 97, 103, 101, 58, 32, 101, 100, 117, 107, 101, 51, 50, 32, 91, 102, 105, 108, 101, 115, 93, 32, 91, 111, 112, 116, 105, 111, 110, 115, 93, 10, 69, 120, 97, 109, 112, 108, 101, 58, 32, 101, 100, 117, 107, 101, 51, 50, 32, 45, 117, 115, 101, 99, 119, 100, 32, 45, 99, 102, 103, 32, 109, 121, 99, 111, 110, 102, 105, 103, 46, 99, 102, 103, 32, 45, 109, 97, 112, 32, 110, 117, 107, 101, 108, 97, 110, 100, 46, 109, 97, 112, 10, 10, 70, 105, 108, 101, 115, 32, 99, 97, 110, 32, 98, 101, 32, 111, 102, 32, 116, 121, 112, 101, 32, 91, 103, 114, 112, 124, 122, 105, 112, 124, 109, 97, 112, 124, 99, 111, 110, 124, 100, 101, 102, 93, 10, 10, 45, 99, 102, 103, 32, 91, 102, 105, 108, 101, 46, 99, 102, 103, 93, 9, 9, 85, 115, 101, 32, 97, 110, 32, 97, 108, 116, 101, 114, 110, 97, 116, 101, 32, 99, 111, 110, 102, 105, 103, 117, 114, 97, 116, 105, 111, 110, 32, 102, 105, 108, 101, 10, 45, 99, 108, 105, 112, 109, 97, 112, 32, 91, 102, 105, 108, 101, 46, 109, 97, 112, 93, 9, 76, 111, 97, 100, 32, 97, 110, 32, 97, 100, 100, 105, 116, 105, 111, 110, 97, 108, 32, 99, 108, 105, 112, 112, 105, 110, 103, 32, 109, 97, 112, 32, 102, 111, 114, 32, 117, 115, 101, 32, 119, 105, 116, 104, 32, 99, 108, 105, 112, 115, 104, 97, 112, 101, 10, 45, 99, 111, 110, 110, 101, 99, 116, 32, 91, 104, 111, 115, 116, 93, 9, 9, 67, 111, 110, 110, 101, 99, 116, 32, 116, 111, 32, 97, 32, 109, 117, 108, 116, 105, 112, 108, 97, 121, 101, 114, 32, 103, 97, 109, 101, 10, 45, 99, 35, 9, 9, 77, 117, 108, 116, 105, 112, 108, 97, 121, 101, 114, 32, 109, 111, 100, 101, 32, 35, 44, 32, 49, 32, 61, 32, 68, 77, 44, 32, 50, 32, 61, 32, 67, 111, 45, 111, 112, 44, 32, 51, 32, 61, 32, 68, 77, 40, 110, 111, 32, 115, 112, 97, 119, 110, 41, 10, 45, 100, 32, 91, 102, 105, 108, 101, 46, 101, 100, 109, 32, 111, 114, 32, 35, 93, 9, 80, 108, 97, 121, 32, 97, 32, 100, 101, 109, 111, 10, 45, 103, 32, 91, 102, 105, 108, 101, 46, 103, 114, 112, 93, 9, 76, 111, 97, 100, 32, 97, 100, 100, 105, 116, 105, 111, 110, 97, 108, 32, 103, 97, 109, 101, 32, 100, 97, 116, 97, 10, 45, 104, 32, 91, 102, 105, 108, 101, 46, 100, 101, 102, 93, 9, 76, 111, 97, 100, 32, 97, 110, 32, 97, 108, 116, 101, 114, 110, 97, 116, 101, 32, 100, 101, 102, 105, 110, 105, 116, 105, 111, 110, 115, 32, 102, 105, 108, 101, 10, 45, 106, 32, 91, 100, 105, 114, 93, 9, 9, 65, 100, 100, 32, 97, 32, 100, 105, 114, 101, 99, 116, 111, 114, 121, 32, 116, 111, 32, 69, 68, 117, 107, 101, 51, 50, 39, 115, 32, 115, 101, 97, 114, 99, 104, 32, 108, 105, 115, 116, 10, 45, 108, 35, 9, 9, 83, 116, 97, 114, 116, 32, 103, 97, 109, 101, 32, 111, 110, 32, 108, 101, 118, 101, 108, 32, 35, 44, 32, 115, 101, 101, 32, 45, 118, 10, 45, 109, 97, 112, 32, 91, 102, 105, 108, 101, 46, 109, 97, 112, 93, 9, 76, 111, 97, 100, 32, 97, 110, 32, 101, 120, 116, 101, 114, 110, 97, 108, 32, 109, 97, 112, 32, 102, 105, 108, 101, 10, 45, 109, 104, 32, 91, 102, 105, 108, 101, 46, 100, 101, 102, 93, 9, 73, 110, 99, 108, 117, 100, 101, 32, 97, 110, 32, 97, 100, 100, 105, 116, 105, 111, 110, 97, 108, 32, 100, 101, 102, 105, 110, 105, 116, 105, 111, 110, 115, 32, 109, 111, 100, 117, 108, 101, 10, 45, 109, 120, 32, 91, 102, 105, 108, 101, 46, 99, 111, 110, 93, 9, 73, 110, 99, 108, 117, 100, 101, 32, 97, 110, 32, 97, 100, 100, 105, 116, 105, 111, 110, 97, 108, 32, 67, 79, 78, 32, 115, 99, 114, 105, 112, 116, 32, 109, 111, 100, 117, 108, 101, 10, 45, 109, 9, 9, 68, 105, 115, 97, 98, 108, 101, 32, 101, 110, 101, 109, 105, 101, 115, 10, 45, 110, 111, 102, 102, 105, 114, 101, 9, 9, 68, 105, 115, 97, 98, 108, 101, 32, 102, 114, 105, 101, 110, 100, 108, 121, 32, 102, 105, 114, 101, 10, 45, 110, 97, 109, 9, 9, 82, 117, 110, 32, 105, 110, 32, 78, 65, 77, 32, 99, 111, 109, 112, 97, 116, 105, 98, 105, 108, 105, 116, 121, 32, 109, 111, 100, 101, 10, 45, 110, 97, 112, 97, 108, 109, 9, 9, 82, 117, 110, 32, 105, 110, 32, 78, 65, 80, 65, 76, 77, 32, 99, 111, 109, 112, 97, 116, 105, 98, 105, 108, 105, 116, 121, 32, 109, 111, 100, 101, 10, 45, 114, 116, 115, 32, 91, 102, 105, 108, 101, 46, 114, 116, 115, 93, 9, 76, 111, 97, 100, 32, 97, 32, 99, 117, 115, 116, 111, 109, 32, 82, 101, 109, 111, 116, 101, 32, 82, 105, 100, 105, 99, 117, 108, 101, 32, 115, 111, 117, 110, 100, 32, 98, 97, 110, 107, 10, 45, 114, 9, 9, 82, 101, 99, 111, 114, 100, 32, 100, 101, 109, 111, 10, 45, 115, 35, 9, 9, 83, 116, 97, 114, 116, 32, 103, 97, 109, 101, 32, 111, 110, 32, 115, 107, 105, 108, 108, 32, 108, 101, 118, 101, 108, 32, 35, 10, 45, 115, 101, 114, 118, 101, 114, 9, 9, 83, 116, 97, 114, 116, 32, 97, 32, 109, 117, 108, 116, 105, 112, 108, 97, 121, 101, 114, 32, 115, 101, 114, 118, 101, 114, 10, 45, 116, 35, 9, 9, 82, 101, 115, 112, 97, 119, 110, 32, 109, 111, 100, 101, 58, 32, 49, 32, 61, 32, 101, 110, 101, 109, 105, 101, 115, 44, 32, 50, 32, 61, 32, 119, 101, 97, 112, 111, 110, 115, 44, 32, 51, 32, 61, 32, 105, 116, 101, 109, 115, 44, 32, 120, 32, 61, 32, 97, 108, 108, 10, 45, 117, 115, 101, 99, 119, 100, 9, 9, 82, 101, 97, 100, 32, 100, 97, 116, 97, 32, 97, 110, 100, 32, 99, 111, 110, 102, 105, 103, 117, 114, 97, 116, 105, 111, 110, 32, 102, 114, 111, 109, 32, 99, 117, 114, 114, 101, 110, 116, 32, 100, 105, 114, 101, 99, 116, 111, 114, 121, 10, 45, 117, 35, 35, 35, 35, 35, 35, 35, 35, 35, 9, 85, 115, 101, 114, 39, 115, 32, 102, 97, 118, 111, 114, 105, 116, 101, 32, 119, 101, 97, 112, 111, 110, 32, 111, 114, 100, 101, 114, 32, 40, 100, 101, 102, 97, 117, 108, 116, 58, 32, 51, 52, 50, 53, 54, 56, 57, 48, 55, 49, 41, 10, 45, 118, 35, 9, 9, 83, 116, 97, 114, 116, 32, 103, 97, 109, 101, 32, 111, 110, 32, 101, 112, 105, 115, 111, 100, 101, 32, 35, 44, 32, 115, 101, 101, 32, 45, 108, 10, 45, 119, 119, 50, 103, 105, 9, 9, 82, 117, 110, 32, 105, 110, 32, 87, 87, 73, 73, 32, 71, 73, 32, 99, 111, 109, 112, 97, 116, 105, 98, 105, 108, 105, 116, 121, 32, 109, 111, 100, 101, 10, 45, 120, 32, 91, 103, 97, 109, 101, 46, 99, 111, 110, 93, 9, 76, 111, 97, 100, 32, 99, 117, 115, 116, 111, 109, 32, 67, 79, 78, 32, 115, 99, 114, 105, 112, 116, 10, 45, 35, 9, 9, 76, 111, 97, 100, 32, 97, 110, 100, 32, 114, 117, 110, 32, 97, 32, 103, 97, 109, 101, 32, 102, 114, 111, 109, 32, 115, 108, 111, 116, 32, 35, 32, 40, 48, 45, 57, 41, 10, 10, 83, 101, 101, 32, 101, 100, 117, 107, 101, 51, 50, 32, 45, 100, 101, 98, 117, 103, 104, 101, 108, 112, 32, 102, 111, 114, 32, 97, 100, 100, 105, 116, 105, 111, 110, 97, 108, 32, 112, 97, 114, 97, 109, 101, 116, 101, 114, 115, 32, 102, 111, 114, 32, 100, 101, 98, 117, 103, 103, 105, 110, 103]); return bytes; })();
const __cxx_literal_e63ef4263136e798262f = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 99, 109, 100, 108, 105, 110, 101, 46, 99, 112, 112, 0]);
export function G_ShowParameterHelp() {

  ((i32(0) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(0), __cxx_literal_e63ef4263136e798262f, u32(91), __static_G_ShowParameterHelp_s));
}

// C/C++ source: source/duke3d/src/cmdline.cpp:94
let __static_G_ShowDebugHelp_s = (() => { const bytes = new Uint8Array(565); bytes.set([85, 115, 97, 103, 101, 58, 32, 101, 100, 117, 107, 101, 51, 50, 32, 91, 102, 105, 108, 101, 115, 93, 32, 91, 111, 112, 116, 105, 111, 110, 115, 93, 10, 10, 45, 99, 97, 99, 104, 101, 115, 105, 122, 101, 32, 35, 9, 83, 101, 116, 32, 99, 97, 99, 104, 101, 32, 115, 105, 122, 101, 32, 105, 110, 32, 107, 66, 10, 45, 103, 97, 109, 101, 95, 100, 105, 114, 32, 91, 100, 105, 114, 93, 9, 83, 112, 101, 99, 105, 102, 121, 32, 103, 97, 109, 101, 32, 100, 97, 116, 97, 32, 100, 105, 114, 101, 99, 116, 111, 114, 121, 10, 45, 103, 97, 109, 101, 103, 114, 112, 32, 32, 32, 9, 83, 101, 108, 101, 99, 116, 32, 109, 97, 105, 110, 32, 103, 114, 112, 32, 102, 105, 108, 101, 10, 45, 110, 97, 109, 101, 32, 91, 110, 97, 109, 101, 93, 9, 80, 108, 97, 121, 101, 114, 32, 110, 97, 109, 101, 32, 105, 110, 32, 109, 117, 108, 116, 105, 112, 108, 97, 121, 101, 114, 10, 45, 110, 111, 97, 117, 116, 111, 108, 111, 97, 100, 9, 68, 105, 115, 97, 98, 108, 101, 32, 108, 111, 97, 100, 105, 110, 103, 32, 102, 114, 111, 109, 32, 97, 117, 116, 111, 108, 111, 97, 100, 32, 100, 105, 114, 101, 99, 116, 111, 114, 121, 10, 45, 110, 111, 108, 111, 103, 111, 9, 9, 83, 107, 105, 112, 32, 105, 110, 116, 114, 111, 32, 97, 110, 105, 109, 10, 45, 110, 115, 9, 9, 68, 105, 115, 97, 98, 108, 101, 32, 115, 111, 117, 110, 100, 10, 45, 110, 109, 9, 9, 68, 105, 115, 97, 98, 108, 101, 32, 109, 117, 115, 105, 99, 10, 45, 113, 35, 9, 9, 70, 97, 107, 101, 32, 109, 117, 108, 116, 105, 112, 108, 97, 121, 101, 114, 32, 119, 105, 116, 104, 32, 35, 32, 112, 108, 97, 121, 101, 114, 115, 10, 45, 122, 35, 47, 45, 99, 111, 110, 100, 101, 98, 117, 103, 9, 69, 110, 97, 98, 108, 101, 32, 108, 105, 110, 101, 45, 98, 121, 45, 108, 105, 110, 101, 32, 67, 79, 78, 32, 99, 111, 109, 112, 105, 108, 101, 32, 100, 101, 98, 117, 103, 103, 105, 110, 103, 32, 97, 116, 32, 108, 101, 118, 101, 108, 32, 35, 10, 45, 99, 111, 110, 118, 101, 114, 115, 105, 111, 110, 32, 89, 89, 89, 89, 77, 77, 68, 68, 9, 83, 101, 108, 101, 99, 116, 115, 32, 67, 79, 78, 32, 115, 99, 114, 105, 112, 116, 32, 118, 101, 114, 115, 105, 111, 110, 32, 102, 111, 114, 32, 99, 111, 109, 112, 97, 116, 105, 98, 105, 108, 105, 116, 121, 32, 119, 105, 116, 104, 32, 111, 108, 100, 101, 114, 32, 109, 111, 100, 115, 10, 45, 114, 111, 116, 97, 116, 101, 115, 112, 114, 105, 116, 101, 45, 110, 111, 45, 119, 105, 100, 101, 115, 99, 114, 101, 101, 110, 9, 83, 116, 114, 101, 116, 99, 104, 32, 115, 99, 114, 101, 101, 110, 32, 100, 114, 97, 119, 105, 110, 103, 32, 102, 114, 111, 109, 32, 115, 99, 114, 105, 112, 116, 115, 32, 116, 111, 32, 102, 117, 108, 108, 115, 99, 114, 101, 101, 110, 10]); return bytes; })();
const __cxx_literal_011eefefd616c8d4184a = Uint8Array.from([69, 68, 117, 107, 101, 51, 50, 32, 37, 115, 0]);
export function G_ShowDebugHelp() {

  snprintf(tempbuf, 8192, __cxx_literal_011eefefd616c8d4184a, __cxx_global_cell_552d0c90c43704c86f3ecf87().value);
  wm_msgbox(tempbuf, __static_G_ShowDebugHelp_s);
}

// C/C++ source: source/duke3d/src/cmdline.cpp:125
const __cxx_literal_acba3544ac2a1f97ee04 = Uint8Array.from([37, 100, 44, 37, 100, 0]);
const __cxx_literal_60c551d0527016ed186b = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 99, 109, 100, 108, 105, 110, 101, 46, 99, 112, 112, 0]);
const __cxx_literal_302a839d0005c715e98f = Uint8Array.from([80, 108, 97, 121, 105, 110, 103, 32, 100, 101, 109, 111, 32, 37, 115, 0]);
const __cxx_literal_3be3f59eeba9b7208be0 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 99, 109, 100, 108, 105, 110, 101, 46, 99, 112, 112, 0]);
const __cxx_literal_347175543a42c33415fe = Uint8Array.from([80, 114, 111, 102, 105, 108, 101, 32, 100, 101, 109, 111, 32, 37, 115, 44, 32, 37, 100, 32, 102, 114, 97, 109, 101, 115, 47, 103, 97, 109, 101, 116, 105, 99, 44, 32, 114, 101, 112, 101, 97, 116, 101, 100, 32, 49, 120, 46, 0]);
export function G_AddDemo(param) {
  Bstrncpyz__header_ae7ba56a4fcd(tempbuf, param, 8192);
  let colon = cTypedPointer(strchr(tempbuf, i32(58)), Uint8Array);
  let framespertic = i32((-1));
  const __cxx_lvalue_0 = cRef(() => framespertic, __cxx_lvalue_2 => { framespertic = i32(__cxx_lvalue_2); });
  let numrepeats = i32(1);
  const __cxx_lvalue_1 = cRef(() => numrepeats, __cxx_lvalue_3 => { numrepeats = i32(__cxx_lvalue_3); });
  if ((colon && cPointerCompare(colon, tempbuf, "!="))) {
    ((cDeref(((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_4.value = next; return previous; })(cRef(() => colon, __cxx_lvalue_5 => { colon = __cxx_lvalue_5; })), Uint8Array).value) = (u32((u32(0) & 255)) & 255));
    sscanf(colon, __cxx_literal_acba3544ac2a1f97ee04, __cxx_lvalue_0, __cxx_lvalue_1);
  }
  Demo_SetFirst(tempbuf);
  if ((framespertic < 0)) {
    ((i32(0) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(0), __cxx_literal_60c551d0527016ed186b, u32(143), __cxx_literal_302a839d0005c715e98f, g_firstDemoFile));
  } else {
    (framespertic = i32((clamp__header_c949a3c8072f(framespertic, 0, 8) + 1)));
    ((i32(0) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(0), __cxx_literal_3be3f59eeba9b7208be0, u32(150), __cxx_literal_347175543a42c33415fe, g_firstDemoFile, i32((framespertic - 1))));
    Demo_PlayFirst(framespertic, 1);
    (__cxx_global_cell_d47d33660ab59c48cbbd560e().value = i32(1));
  }
}

// C/C++ source: source/duke3d/src/cmdline.cpp:156
const __cxx_literal_7f69b4cf1168663b35b5 = Uint8Array.from([51, 52, 53, 55, 56, 54, 48, 50, 57, 49, 0]);
const __cxx_literal_918015f293a93207d290 = Uint8Array.from([95, 99, 108, 105, 112, 115, 104, 97, 112, 101, 48, 46, 109, 97, 112, 0]);
const __cxx_literal_139b16b7b6c8a6d4e30d = Uint8Array.from([65, 112, 112, 108, 105, 99, 97, 116, 105, 111, 110, 32, 112, 97, 114, 97, 109, 101, 116, 101, 114, 115, 58, 0]);
const __cxx_literal_c3e954d147affd005297 = Uint8Array.from([32, 37, 115, 0]);
const __cxx_literal_30597ba8b1c6f2c5f3ef = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 99, 109, 100, 108, 105, 110, 101, 46, 99, 112, 112, 0]);
const __cxx_literal_548706edd16c2805cd64 = Uint8Array.from([37, 115, 0]);
const __cxx_literal_f4f7798839186de23933 = Uint8Array.from([63, 0]);
const __cxx_literal_646bc10eff9c1108217b = Uint8Array.from([104, 101, 108, 112, 0]);
const __cxx_literal_905702d66d919afc3f80 = Uint8Array.from([45, 104, 101, 108, 112, 0]);
const __cxx_literal_72f1cf2a83f498ecf080 = Uint8Array.from([97, 100, 100, 111, 110, 0]);
const __cxx_literal_ce46c680b26694666f56 = Uint8Array.from([100, 101, 98, 117, 103, 104, 101, 108, 112, 0]);
const __cxx_literal_6c3b428e55aecba65325 = Uint8Array.from([45, 100, 101, 98, 117, 103, 104, 101, 108, 112, 0]);
const __cxx_literal_d370d892183c48706345 = Uint8Array.from([103, 114, 112, 0]);
const __cxx_literal_2a19079e82df73e33155 = Uint8Array.from([103, 0]);
const __cxx_literal_ca84a786b50528a33c0e = Uint8Array.from([103, 97, 109, 101, 95, 100, 105, 114, 0]);
const __cxx_literal_8ab4266bbbd1995af704 = Uint8Array.from([99, 102, 103, 0]);
const __cxx_literal_5dfc307464453c2ef3dd = Uint8Array.from([103, 97, 109, 101, 103, 114, 112, 0]);
const __cxx_literal_5f12737d661f4cc9fab3 = Uint8Array.from([110, 97, 109, 0]);
const __cxx_literal_3d706da0519c5cf87e76 = Uint8Array.from([110, 97, 112, 97, 108, 109, 0]);
const __cxx_literal_819bbdae8233da387027 = Uint8Array.from([119, 119, 50, 103, 105, 0]);
const __cxx_literal_1963daa63346974aba6d = Uint8Array.from([115, 101, 116, 117, 112, 0]);
const __cxx_literal_85eef806f8e4fc8a1339 = Uint8Array.from([110, 111, 115, 101, 116, 117, 112, 0]);
const __cxx_literal_77a68155bd7be889656b = Uint8Array.from([110, 111, 99, 111, 110, 116, 114, 111, 108, 108, 101, 114, 0]);
const __cxx_literal_66b8dedabccdd8394191 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 99, 109, 100, 108, 105, 110, 101, 46, 99, 112, 112, 0]);
const __cxx_literal_057627e76e44ee96d7e9 = Uint8Array.from([67, 111, 110, 116, 114, 111, 108, 108, 101, 114, 32, 115, 117, 112, 112, 111, 114, 116, 32, 100, 105, 115, 97, 98, 108, 101, 100, 46, 0]);
const __cxx_literal_352036a7c0b06a448095 = Uint8Array.from([110, 111, 97, 117, 116, 111, 108, 111, 97, 100, 0]);
const __cxx_literal_4d1da8b4fc90f6a8140f = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 99, 109, 100, 108, 105, 110, 101, 46, 99, 112, 112, 0]);
const __cxx_literal_ac0f9d71b4ee5bd7a28f = Uint8Array.from([65, 117, 116, 111, 108, 111, 97, 100, 32, 100, 105, 115, 97, 98, 108, 101, 100, 0]);
const __cxx_literal_2f5d5176d025b601d907 = Uint8Array.from([112, 111, 114, 116, 0]);
const __cxx_literal_73e46ed61a53bb0ead49 = Uint8Array.from([110, 97, 109, 101, 0]);
const __cxx_literal_287ceed781ebfbffbc6d = Uint8Array.from([109, 97, 112, 0]);
const __cxx_literal_5c1167b4b9e5eb4d628c = Uint8Array.from([110, 111, 102, 102, 105, 114, 101, 0]);
const __cxx_literal_1d3ff75ae53f7b30a9ac = Uint8Array.from([114, 116, 115, 0]);
const __cxx_literal_fae05a3c44c0c9ddd7ce = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 99, 109, 100, 108, 105, 110, 101, 46, 99, 112, 112, 0]);
const __cxx_literal_6f33cee8c2ebed1f24ca = Uint8Array.from([85, 115, 105, 110, 103, 32, 82, 84, 83, 32, 102, 105, 108, 101, 32, 37, 115, 0]);
const __cxx_literal_41037810a2d374b39867 = Uint8Array.from([120, 0]);
const __cxx_literal_16703f8afded39885f6c = Uint8Array.from([109, 120, 0]);
const __cxx_literal_9763a96d2db762cfab65 = Uint8Array.from([104, 0]);
const __cxx_literal_4c930fbb0e5f967c6e56 = Uint8Array.from([109, 104, 0]);
const __cxx_literal_d558fc8a6265f622caad = Uint8Array.from([106, 0]);
const __cxx_literal_3b3ea1212f3eec2592e4 = Uint8Array.from([100, 0]);
const __cxx_literal_d388796743d422b5b719 = Uint8Array.from([99, 108, 105, 112, 109, 97, 112, 0]);
const __cxx_literal_62f931d47deedfb554bd = Uint8Array.from([99, 111, 110, 100, 101, 98, 117, 103, 0]);
const __cxx_literal_541e692f15cbe0a205e0 = Uint8Array.from([110, 111, 108, 111, 103, 111, 0]);
const __cxx_literal_5cabecbcfaaf415b4254 = Uint8Array.from([113, 117, 105, 99, 107, 0]);
const __cxx_literal_173dc013edd2b6090ff2 = Uint8Array.from([114, 111, 116, 97, 116, 101, 115, 112, 114, 105, 116, 101, 45, 110, 111, 45, 119, 105, 100, 101, 115, 99, 114, 101, 101, 110, 0]);
const __cxx_literal_955f34fcc2da88da8c7b = Uint8Array.from([117, 115, 101, 99, 119, 100, 0]);
const __cxx_literal_6845eb4b8f7a355e5326 = Uint8Array.from([99, 97, 99, 104, 101, 115, 105, 122, 101, 0]);
const __cxx_literal_af5d6ffc076eb9c20205 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 99, 109, 100, 108, 105, 110, 101, 46, 99, 112, 112, 0]);
const __cxx_literal_d3f64ec55112a18354b7 = Uint8Array.from([67, 97, 99, 104, 101, 32, 115, 105, 122, 101, 58, 32, 37, 100, 107, 66, 0]);
const __cxx_literal_74bb9747f98dd4401276 = Uint8Array.from([110, 111, 105, 110, 115, 116, 97, 110, 99, 101, 99, 104, 101, 99, 107, 105, 110, 103, 0]);
const __cxx_literal_04315cad4f74002afaca = Uint8Array.from([110, 111, 99, 111, 110, 115, 111, 108, 101, 0]);
const __cxx_literal_94e9b52ebe8a5c14c9ca = Uint8Array.from([99, 111, 110, 102, 0]);
const __cxx_literal_75cde2524ee57913b02d = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 99, 109, 100, 108, 105, 110, 101, 46, 99, 112, 112, 0]);
const __cxx_literal_2f173bac6af2ad02adc0 = Uint8Array.from([79, 116, 104, 101, 114, 32, 112, 108, 97, 121, 101, 114, 32, 34, 65, 73, 46, 34, 0]);
const __cxx_literal_50cbaa877607415c6f02 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 99, 109, 100, 108, 105, 110, 101, 46, 99, 112, 112, 0]);
const __cxx_literal_3b4f6c9cc14aab49e066 = Uint8Array.from([77, 111, 110, 115, 116, 101, 114, 115, 32, 111, 102, 102, 46, 0]);
const __cxx_literal_de2ef13e10ad0dc6491d = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 99, 109, 100, 108, 105, 110, 101, 46, 99, 112, 112, 0]);
const __cxx_literal_d695c83088ace618fe85 = Uint8Array.from([83, 111, 117, 110, 100, 32, 111, 102, 102, 32, 40, 108, 105, 107, 101, 32, 121, 111, 117, 39, 118, 101, 32, 103, 111, 116, 32, 97, 32, 112, 97, 105, 114, 41, 46, 0]);
const __cxx_literal_6fea2656f68e17be859f = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 99, 109, 100, 108, 105, 110, 101, 46, 99, 112, 112, 0]);
const __cxx_literal_0e3bbefdbebb43cd28be = Uint8Array.from([77, 117, 115, 105, 99, 32, 111, 102, 102, 46, 0]);
const __cxx_literal_f9e661a49a99521243cb = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 99, 109, 100, 108, 105, 110, 101, 46, 99, 112, 112, 0]);
const __cxx_literal_028f34514b0bba2d51ef = Uint8Array.from([70, 97, 107, 101, 32, 109, 117, 108, 116, 105, 112, 108, 97, 121, 101, 114, 32, 109, 111, 100, 101, 58, 32, 101, 120, 112, 101, 99, 116, 101, 100, 32, 110, 117, 109, 98, 101, 114, 32, 97, 102, 116, 101, 114, 32, 45, 113, 44, 32, 102, 97, 108, 108, 105, 110, 103, 32, 98, 97, 99, 107, 32, 116, 111, 32, 49, 32, 112, 108, 97, 121, 101, 114, 46, 0]);
const __cxx_literal_56d30e52a25364aced93 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 99, 109, 100, 108, 105, 110, 101, 46, 99, 112, 112, 0]);
const __cxx_literal_2e7c214d674529427d76 = Uint8Array.from([70, 97, 107, 101, 32, 109, 117, 108, 116, 105, 112, 108, 97, 121, 101, 114, 32, 109, 111, 100, 101, 58, 32, 101, 120, 112, 101, 99, 116, 101, 100, 32, 50, 45, 37, 100, 32, 112, 108, 97, 121, 101, 114, 115, 44, 32, 102, 97, 108, 108, 105, 110, 103, 32, 98, 97, 99, 107, 32, 116, 111, 32, 49, 46, 0]);
const __cxx_literal_494253779d4818f5836e = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 99, 109, 100, 108, 105, 110, 101, 46, 99, 112, 112, 0]);
const __cxx_literal_4fbaf38625e314ce780c = Uint8Array.from([70, 97, 107, 101, 32, 109, 117, 108, 116, 105, 112, 108, 97, 121, 101, 114, 32, 109, 111, 100, 101, 58, 32, 37, 100, 32, 112, 108, 97, 121, 101, 114, 115, 46, 0]);
const __cxx_literal_b9256a828a348157bac5 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 99, 109, 100, 108, 105, 110, 101, 46, 99, 112, 112, 0]);
const __cxx_literal_55c2a6d403b10b89c8d1 = Uint8Array.from([68, 101, 109, 111, 32, 114, 101, 99, 111, 114, 100, 32, 109, 111, 100, 101, 32, 111, 110, 46, 0]);
const __cxx_literal_0b6c0ac4a0bc861921db = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 99, 109, 100, 108, 105, 110, 101, 46, 99, 112, 112, 0]);
const __cxx_literal_b0df12f5298ab1c95a6d = Uint8Array.from([82, 101, 115, 112, 97, 119, 110, 32, 111, 110, 46, 0]);
const __cxx_literal_fb9bc546272dce413e41 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 99, 109, 100, 108, 105, 110, 101, 46, 99, 112, 112, 0]);
const __cxx_literal_e3cef480240c3cd14f15 = Uint8Array.from([85, 115, 105, 110, 103, 32, 102, 97, 118, 111, 114, 105, 116, 101, 32, 119, 101, 97, 112, 111, 110, 32, 111, 114, 100, 101, 114, 40, 115, 41, 46, 0]);
const __cxx_literal_79a8396859cc5a7c7d4f = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 99, 109, 100, 108, 105, 110, 101, 46, 99, 112, 112, 0]);
const __cxx_literal_a15274aaeaa46cdf7e24 = Uint8Array.from([85, 115, 105, 110, 103, 32, 100, 101, 102, 97, 117, 108, 116, 32, 119, 101, 97, 112, 111, 110, 32, 111, 114, 100, 101, 114, 115, 46, 0]);
const __cxx_literal_b3482b1fb3baaff9ecae = Uint8Array.from([51, 52, 53, 55, 56, 54, 48, 50, 57, 49, 0]);
const __cxx_literal_a08d5a1c3cfd948a0c67 = Uint8Array.from([46, 109, 97, 112, 0]);
const __cxx_literal_c871cd6e253a5ea8b41b = Uint8Array.from([46, 103, 114, 112, 0]);
const __cxx_literal_4c76e369bb5d4a178917 = Uint8Array.from([46, 122, 105, 112, 0]);
const __cxx_literal_4e13664f4329cf34c88e = Uint8Array.from([46, 112, 107, 51, 0]);
const __cxx_literal_9300766006e947a04785 = Uint8Array.from([46, 112, 107, 52, 0]);
const __cxx_literal_1c5bf15d7dfebcf04969 = Uint8Array.from([46, 99, 111, 110, 0]);
const __cxx_literal_4a1843b328d14ccb6537 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 99, 109, 100, 108, 105, 110, 101, 46, 99, 112, 112, 0]);
const __cxx_literal_96c73b2538759e2f1bec = Uint8Array.from([85, 115, 105, 110, 103, 32, 67, 79, 78, 32, 102, 105, 108, 101, 32, 37, 115, 0]);
const __cxx_literal_4cfbcf9465bb97c16308 = Uint8Array.from([46, 100, 101, 102, 0]);
const __cxx_literal_fb11017495262ae353ca = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 99, 109, 100, 108, 105, 110, 101, 46, 99, 112, 112, 0]);
const __cxx_literal_b918079e17f1d82872a7 = Uint8Array.from([85, 115, 105, 110, 103, 32, 68, 69, 70, 32, 102, 105, 108, 101, 32, 37, 115, 0]);
const __cxx_literal_7c8d65deae67799b9dc4 = Uint8Array.from([46, 114, 116, 115, 0]);
const __cxx_literal_bc9f5ad5ac55a7a99757 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 99, 109, 100, 108, 105, 110, 101, 46, 99, 112, 112, 0]);
const __cxx_literal_fb4f7490747d7f02fff3 = Uint8Array.from([85, 115, 105, 110, 103, 32, 82, 84, 83, 32, 102, 105, 108, 101, 32, 37, 115, 0]);
const __cxx_literal_04f840e2826e08402847 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 99, 109, 100, 108, 105, 110, 101, 46, 99, 112, 112, 0]);
const __cxx_literal_866fcf4c32084da831c4 = Uint8Array.from([73, 103, 110, 111, 114, 101, 100, 32, 97, 112, 112, 108, 105, 99, 97, 116, 105, 111, 110, 32, 112, 97, 114, 97, 109, 101, 116, 101, 114, 32, 39, 37, 115, 39, 46, 0]);
export function G_CheckCommandLine(argc, argv) {
  let c;
  let k;
  (__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.m_respawn_items = i32(0));
  (__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.m_respawn_monsters = i32(0));
  (__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.m_respawn_inventory = i32(0));
  (__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.warp_on = (u32((u32(0) & 255)) & 255));
  (__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.m_ffire = i32(1));
  (__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.m_player_skill = i32((__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.player_skill = i32(2))));
  ((cDeref(cPointerOffset((cPointerElementRef(cRecordPointer(g_player, {"align": 1, "arrayAlign": 1, "fields": {"frags": {"length": 16, "native": "Uint8Array", "offset": 62, "size": 16}, "gotvote": {"native": "Uint8Array", "offset": 93, "size": 1}, "horizAngleAdjust": {"native": "Int32Array", "offset": 32, "size": 4}, "horizRecenter": {"native": "Int32Array", "offset": 28, "size": 4}, "horizSkew": {"native": "Int32Array", "offset": 36, "size": 4}, "input": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"bits": {"native": "Uint32Array", "offset": 0, "size": 4}, "extbits": {"native": "Uint32Array", "offset": 16, "size": 4}, "fvel": {"native": "Int16Array", "offset": 4, "size": 2}, "q16avel": {"native": "Int32Array", "offset": 8, "size": 4}, "q16horz": {"native": "Int32Array", "offset": 12, "size": 4}, "svel": {"native": "Int16Array", "offset": 6, "size": 2}}, "overlaps": false, "size": 20, "union": false}, "offset": 8}, "lastViewUpdate": {"native": "BigUint64Array", "offset": 40, "size": 8}, "netsynctime": {"native": "Int32Array", "offset": 48, "size": 4}, "pcolor": {"native": "Int32Array", "offset": 52, "size": 4}, "ping": {"native": "Int16Array", "offset": 60, "size": 2}, "pingcnt": {"native": "Uint8Array", "offset": 94, "size": 1}, "playerquitflag": {"native": "Uint8Array", "offset": 95, "size": 1}, "ps": {"offset": 0, "pointer": true, "size": 8}, "pteam": {"native": "Int32Array", "offset": 56, "size": 4}, "ready": {"native": "Uint8Array", "offset": 96, "size": 1}, "revision": {"native": "Uint32Array", "offset": 129, "size": 4}, "smoothcamera": {"native": "Uint8Array", "offset": 91, "size": 1}, "user_name": {"length": 32, "native": "Uint8Array", "offset": 97, "size": 32}, "vote": {"native": "Uint8Array", "offset": 92, "size": 1}, "wchoice": {"length": 13, "native": "Uint8Array", "offset": 78, "size": 13}}, "overlaps": false, "size": 133, "union": false}, {}), 0).value).wchoice, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(3) & 255)) & 255));
  ((cDeref(cPointerOffset((cPointerElementRef(cRecordPointer(g_player, {"align": 1, "arrayAlign": 1, "fields": {"frags": {"length": 16, "native": "Uint8Array", "offset": 62, "size": 16}, "gotvote": {"native": "Uint8Array", "offset": 93, "size": 1}, "horizAngleAdjust": {"native": "Int32Array", "offset": 32, "size": 4}, "horizRecenter": {"native": "Int32Array", "offset": 28, "size": 4}, "horizSkew": {"native": "Int32Array", "offset": 36, "size": 4}, "input": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"bits": {"native": "Uint32Array", "offset": 0, "size": 4}, "extbits": {"native": "Uint32Array", "offset": 16, "size": 4}, "fvel": {"native": "Int16Array", "offset": 4, "size": 2}, "q16avel": {"native": "Int32Array", "offset": 8, "size": 4}, "q16horz": {"native": "Int32Array", "offset": 12, "size": 4}, "svel": {"native": "Int16Array", "offset": 6, "size": 2}}, "overlaps": false, "size": 20, "union": false}, "offset": 8}, "lastViewUpdate": {"native": "BigUint64Array", "offset": 40, "size": 8}, "netsynctime": {"native": "Int32Array", "offset": 48, "size": 4}, "pcolor": {"native": "Int32Array", "offset": 52, "size": 4}, "ping": {"native": "Int16Array", "offset": 60, "size": 2}, "pingcnt": {"native": "Uint8Array", "offset": 94, "size": 1}, "playerquitflag": {"native": "Uint8Array", "offset": 95, "size": 1}, "ps": {"offset": 0, "pointer": true, "size": 8}, "pteam": {"native": "Int32Array", "offset": 56, "size": 4}, "ready": {"native": "Uint8Array", "offset": 96, "size": 1}, "revision": {"native": "Uint32Array", "offset": 129, "size": 4}, "smoothcamera": {"native": "Uint8Array", "offset": 91, "size": 1}, "user_name": {"length": 32, "native": "Uint8Array", "offset": 97, "size": 32}, "vote": {"native": "Uint8Array", "offset": 92, "size": 1}, "wchoice": {"length": 13, "native": "Uint8Array", "offset": 78, "size": 13}}, "overlaps": false, "size": 133, "union": false}, {}), 0).value).wchoice, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(4) & 255)) & 255));
  ((cDeref(cPointerOffset((cPointerElementRef(cRecordPointer(g_player, {"align": 1, "arrayAlign": 1, "fields": {"frags": {"length": 16, "native": "Uint8Array", "offset": 62, "size": 16}, "gotvote": {"native": "Uint8Array", "offset": 93, "size": 1}, "horizAngleAdjust": {"native": "Int32Array", "offset": 32, "size": 4}, "horizRecenter": {"native": "Int32Array", "offset": 28, "size": 4}, "horizSkew": {"native": "Int32Array", "offset": 36, "size": 4}, "input": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"bits": {"native": "Uint32Array", "offset": 0, "size": 4}, "extbits": {"native": "Uint32Array", "offset": 16, "size": 4}, "fvel": {"native": "Int16Array", "offset": 4, "size": 2}, "q16avel": {"native": "Int32Array", "offset": 8, "size": 4}, "q16horz": {"native": "Int32Array", "offset": 12, "size": 4}, "svel": {"native": "Int16Array", "offset": 6, "size": 2}}, "overlaps": false, "size": 20, "union": false}, "offset": 8}, "lastViewUpdate": {"native": "BigUint64Array", "offset": 40, "size": 8}, "netsynctime": {"native": "Int32Array", "offset": 48, "size": 4}, "pcolor": {"native": "Int32Array", "offset": 52, "size": 4}, "ping": {"native": "Int16Array", "offset": 60, "size": 2}, "pingcnt": {"native": "Uint8Array", "offset": 94, "size": 1}, "playerquitflag": {"native": "Uint8Array", "offset": 95, "size": 1}, "ps": {"offset": 0, "pointer": true, "size": 8}, "pteam": {"native": "Int32Array", "offset": 56, "size": 4}, "ready": {"native": "Uint8Array", "offset": 96, "size": 1}, "revision": {"native": "Uint32Array", "offset": 129, "size": 4}, "smoothcamera": {"native": "Uint8Array", "offset": 91, "size": 1}, "user_name": {"length": 32, "native": "Uint8Array", "offset": 97, "size": 32}, "vote": {"native": "Uint8Array", "offset": 92, "size": 1}, "wchoice": {"length": 13, "native": "Uint8Array", "offset": 78, "size": 13}}, "overlaps": false, "size": 133, "union": false}, {}), 0).value).wchoice, 2, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(5) & 255)) & 255));
  ((cDeref(cPointerOffset((cPointerElementRef(cRecordPointer(g_player, {"align": 1, "arrayAlign": 1, "fields": {"frags": {"length": 16, "native": "Uint8Array", "offset": 62, "size": 16}, "gotvote": {"native": "Uint8Array", "offset": 93, "size": 1}, "horizAngleAdjust": {"native": "Int32Array", "offset": 32, "size": 4}, "horizRecenter": {"native": "Int32Array", "offset": 28, "size": 4}, "horizSkew": {"native": "Int32Array", "offset": 36, "size": 4}, "input": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"bits": {"native": "Uint32Array", "offset": 0, "size": 4}, "extbits": {"native": "Uint32Array", "offset": 16, "size": 4}, "fvel": {"native": "Int16Array", "offset": 4, "size": 2}, "q16avel": {"native": "Int32Array", "offset": 8, "size": 4}, "q16horz": {"native": "Int32Array", "offset": 12, "size": 4}, "svel": {"native": "Int16Array", "offset": 6, "size": 2}}, "overlaps": false, "size": 20, "union": false}, "offset": 8}, "lastViewUpdate": {"native": "BigUint64Array", "offset": 40, "size": 8}, "netsynctime": {"native": "Int32Array", "offset": 48, "size": 4}, "pcolor": {"native": "Int32Array", "offset": 52, "size": 4}, "ping": {"native": "Int16Array", "offset": 60, "size": 2}, "pingcnt": {"native": "Uint8Array", "offset": 94, "size": 1}, "playerquitflag": {"native": "Uint8Array", "offset": 95, "size": 1}, "ps": {"offset": 0, "pointer": true, "size": 8}, "pteam": {"native": "Int32Array", "offset": 56, "size": 4}, "ready": {"native": "Uint8Array", "offset": 96, "size": 1}, "revision": {"native": "Uint32Array", "offset": 129, "size": 4}, "smoothcamera": {"native": "Uint8Array", "offset": 91, "size": 1}, "user_name": {"length": 32, "native": "Uint8Array", "offset": 97, "size": 32}, "vote": {"native": "Uint8Array", "offset": 92, "size": 1}, "wchoice": {"length": 13, "native": "Uint8Array", "offset": 78, "size": 13}}, "overlaps": false, "size": 133, "union": false}, {}), 0).value).wchoice, 3, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(7) & 255)) & 255));
  ((cDeref(cPointerOffset((cPointerElementRef(cRecordPointer(g_player, {"align": 1, "arrayAlign": 1, "fields": {"frags": {"length": 16, "native": "Uint8Array", "offset": 62, "size": 16}, "gotvote": {"native": "Uint8Array", "offset": 93, "size": 1}, "horizAngleAdjust": {"native": "Int32Array", "offset": 32, "size": 4}, "horizRecenter": {"native": "Int32Array", "offset": 28, "size": 4}, "horizSkew": {"native": "Int32Array", "offset": 36, "size": 4}, "input": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"bits": {"native": "Uint32Array", "offset": 0, "size": 4}, "extbits": {"native": "Uint32Array", "offset": 16, "size": 4}, "fvel": {"native": "Int16Array", "offset": 4, "size": 2}, "q16avel": {"native": "Int32Array", "offset": 8, "size": 4}, "q16horz": {"native": "Int32Array", "offset": 12, "size": 4}, "svel": {"native": "Int16Array", "offset": 6, "size": 2}}, "overlaps": false, "size": 20, "union": false}, "offset": 8}, "lastViewUpdate": {"native": "BigUint64Array", "offset": 40, "size": 8}, "netsynctime": {"native": "Int32Array", "offset": 48, "size": 4}, "pcolor": {"native": "Int32Array", "offset": 52, "size": 4}, "ping": {"native": "Int16Array", "offset": 60, "size": 2}, "pingcnt": {"native": "Uint8Array", "offset": 94, "size": 1}, "playerquitflag": {"native": "Uint8Array", "offset": 95, "size": 1}, "ps": {"offset": 0, "pointer": true, "size": 8}, "pteam": {"native": "Int32Array", "offset": 56, "size": 4}, "ready": {"native": "Uint8Array", "offset": 96, "size": 1}, "revision": {"native": "Uint32Array", "offset": 129, "size": 4}, "smoothcamera": {"native": "Uint8Array", "offset": 91, "size": 1}, "user_name": {"length": 32, "native": "Uint8Array", "offset": 97, "size": 32}, "vote": {"native": "Uint8Array", "offset": 92, "size": 1}, "wchoice": {"length": 13, "native": "Uint8Array", "offset": 78, "size": 13}}, "overlaps": false, "size": 133, "union": false}, {}), 0).value).wchoice, 4, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(8) & 255)) & 255));
  ((cDeref(cPointerOffset((cPointerElementRef(cRecordPointer(g_player, {"align": 1, "arrayAlign": 1, "fields": {"frags": {"length": 16, "native": "Uint8Array", "offset": 62, "size": 16}, "gotvote": {"native": "Uint8Array", "offset": 93, "size": 1}, "horizAngleAdjust": {"native": "Int32Array", "offset": 32, "size": 4}, "horizRecenter": {"native": "Int32Array", "offset": 28, "size": 4}, "horizSkew": {"native": "Int32Array", "offset": 36, "size": 4}, "input": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"bits": {"native": "Uint32Array", "offset": 0, "size": 4}, "extbits": {"native": "Uint32Array", "offset": 16, "size": 4}, "fvel": {"native": "Int16Array", "offset": 4, "size": 2}, "q16avel": {"native": "Int32Array", "offset": 8, "size": 4}, "q16horz": {"native": "Int32Array", "offset": 12, "size": 4}, "svel": {"native": "Int16Array", "offset": 6, "size": 2}}, "overlaps": false, "size": 20, "union": false}, "offset": 8}, "lastViewUpdate": {"native": "BigUint64Array", "offset": 40, "size": 8}, "netsynctime": {"native": "Int32Array", "offset": 48, "size": 4}, "pcolor": {"native": "Int32Array", "offset": 52, "size": 4}, "ping": {"native": "Int16Array", "offset": 60, "size": 2}, "pingcnt": {"native": "Uint8Array", "offset": 94, "size": 1}, "playerquitflag": {"native": "Uint8Array", "offset": 95, "size": 1}, "ps": {"offset": 0, "pointer": true, "size": 8}, "pteam": {"native": "Int32Array", "offset": 56, "size": 4}, "ready": {"native": "Uint8Array", "offset": 96, "size": 1}, "revision": {"native": "Uint32Array", "offset": 129, "size": 4}, "smoothcamera": {"native": "Uint8Array", "offset": 91, "size": 1}, "user_name": {"length": 32, "native": "Uint8Array", "offset": 97, "size": 32}, "vote": {"native": "Uint8Array", "offset": 92, "size": 1}, "wchoice": {"length": 13, "native": "Uint8Array", "offset": 78, "size": 13}}, "overlaps": false, "size": 133, "union": false}, {}), 0).value).wchoice, 5, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(6) & 255)) & 255));
  ((cDeref(cPointerOffset((cPointerElementRef(cRecordPointer(g_player, {"align": 1, "arrayAlign": 1, "fields": {"frags": {"length": 16, "native": "Uint8Array", "offset": 62, "size": 16}, "gotvote": {"native": "Uint8Array", "offset": 93, "size": 1}, "horizAngleAdjust": {"native": "Int32Array", "offset": 32, "size": 4}, "horizRecenter": {"native": "Int32Array", "offset": 28, "size": 4}, "horizSkew": {"native": "Int32Array", "offset": 36, "size": 4}, "input": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"bits": {"native": "Uint32Array", "offset": 0, "size": 4}, "extbits": {"native": "Uint32Array", "offset": 16, "size": 4}, "fvel": {"native": "Int16Array", "offset": 4, "size": 2}, "q16avel": {"native": "Int32Array", "offset": 8, "size": 4}, "q16horz": {"native": "Int32Array", "offset": 12, "size": 4}, "svel": {"native": "Int16Array", "offset": 6, "size": 2}}, "overlaps": false, "size": 20, "union": false}, "offset": 8}, "lastViewUpdate": {"native": "BigUint64Array", "offset": 40, "size": 8}, "netsynctime": {"native": "Int32Array", "offset": 48, "size": 4}, "pcolor": {"native": "Int32Array", "offset": 52, "size": 4}, "ping": {"native": "Int16Array", "offset": 60, "size": 2}, "pingcnt": {"native": "Uint8Array", "offset": 94, "size": 1}, "playerquitflag": {"native": "Uint8Array", "offset": 95, "size": 1}, "ps": {"offset": 0, "pointer": true, "size": 8}, "pteam": {"native": "Int32Array", "offset": 56, "size": 4}, "ready": {"native": "Uint8Array", "offset": 96, "size": 1}, "revision": {"native": "Uint32Array", "offset": 129, "size": 4}, "smoothcamera": {"native": "Uint8Array", "offset": 91, "size": 1}, "user_name": {"length": 32, "native": "Uint8Array", "offset": 97, "size": 32}, "vote": {"native": "Uint8Array", "offset": 92, "size": 1}, "wchoice": {"length": 13, "native": "Uint8Array", "offset": 78, "size": 13}}, "overlaps": false, "size": 133, "union": false}, {}), 0).value).wchoice, 6, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(0) & 255)) & 255));
  ((cDeref(cPointerOffset((cPointerElementRef(cRecordPointer(g_player, {"align": 1, "arrayAlign": 1, "fields": {"frags": {"length": 16, "native": "Uint8Array", "offset": 62, "size": 16}, "gotvote": {"native": "Uint8Array", "offset": 93, "size": 1}, "horizAngleAdjust": {"native": "Int32Array", "offset": 32, "size": 4}, "horizRecenter": {"native": "Int32Array", "offset": 28, "size": 4}, "horizSkew": {"native": "Int32Array", "offset": 36, "size": 4}, "input": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"bits": {"native": "Uint32Array", "offset": 0, "size": 4}, "extbits": {"native": "Uint32Array", "offset": 16, "size": 4}, "fvel": {"native": "Int16Array", "offset": 4, "size": 2}, "q16avel": {"native": "Int32Array", "offset": 8, "size": 4}, "q16horz": {"native": "Int32Array", "offset": 12, "size": 4}, "svel": {"native": "Int16Array", "offset": 6, "size": 2}}, "overlaps": false, "size": 20, "union": false}, "offset": 8}, "lastViewUpdate": {"native": "BigUint64Array", "offset": 40, "size": 8}, "netsynctime": {"native": "Int32Array", "offset": 48, "size": 4}, "pcolor": {"native": "Int32Array", "offset": 52, "size": 4}, "ping": {"native": "Int16Array", "offset": 60, "size": 2}, "pingcnt": {"native": "Uint8Array", "offset": 94, "size": 1}, "playerquitflag": {"native": "Uint8Array", "offset": 95, "size": 1}, "ps": {"offset": 0, "pointer": true, "size": 8}, "pteam": {"native": "Int32Array", "offset": 56, "size": 4}, "ready": {"native": "Uint8Array", "offset": 96, "size": 1}, "revision": {"native": "Uint32Array", "offset": 129, "size": 4}, "smoothcamera": {"native": "Uint8Array", "offset": 91, "size": 1}, "user_name": {"length": 32, "native": "Uint8Array", "offset": 97, "size": 32}, "vote": {"native": "Uint8Array", "offset": 92, "size": 1}, "wchoice": {"length": 13, "native": "Uint8Array", "offset": 78, "size": 13}}, "overlaps": false, "size": 133, "union": false}, {}), 0).value).wchoice, 7, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(2) & 255)) & 255));
  ((cDeref(cPointerOffset((cPointerElementRef(cRecordPointer(g_player, {"align": 1, "arrayAlign": 1, "fields": {"frags": {"length": 16, "native": "Uint8Array", "offset": 62, "size": 16}, "gotvote": {"native": "Uint8Array", "offset": 93, "size": 1}, "horizAngleAdjust": {"native": "Int32Array", "offset": 32, "size": 4}, "horizRecenter": {"native": "Int32Array", "offset": 28, "size": 4}, "horizSkew": {"native": "Int32Array", "offset": 36, "size": 4}, "input": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"bits": {"native": "Uint32Array", "offset": 0, "size": 4}, "extbits": {"native": "Uint32Array", "offset": 16, "size": 4}, "fvel": {"native": "Int16Array", "offset": 4, "size": 2}, "q16avel": {"native": "Int32Array", "offset": 8, "size": 4}, "q16horz": {"native": "Int32Array", "offset": 12, "size": 4}, "svel": {"native": "Int16Array", "offset": 6, "size": 2}}, "overlaps": false, "size": 20, "union": false}, "offset": 8}, "lastViewUpdate": {"native": "BigUint64Array", "offset": 40, "size": 8}, "netsynctime": {"native": "Int32Array", "offset": 48, "size": 4}, "pcolor": {"native": "Int32Array", "offset": 52, "size": 4}, "ping": {"native": "Int16Array", "offset": 60, "size": 2}, "pingcnt": {"native": "Uint8Array", "offset": 94, "size": 1}, "playerquitflag": {"native": "Uint8Array", "offset": 95, "size": 1}, "ps": {"offset": 0, "pointer": true, "size": 8}, "pteam": {"native": "Int32Array", "offset": 56, "size": 4}, "ready": {"native": "Uint8Array", "offset": 96, "size": 1}, "revision": {"native": "Uint32Array", "offset": 129, "size": 4}, "smoothcamera": {"native": "Uint8Array", "offset": 91, "size": 1}, "user_name": {"length": 32, "native": "Uint8Array", "offset": 97, "size": 32}, "vote": {"native": "Uint8Array", "offset": 92, "size": 1}, "wchoice": {"length": 13, "native": "Uint8Array", "offset": 78, "size": 13}}, "overlaps": false, "size": 133, "union": false}, {}), 0).value).wchoice, 8, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(9) & 255)) & 255));
  ((cDeref(cPointerOffset((cPointerElementRef(cRecordPointer(g_player, {"align": 1, "arrayAlign": 1, "fields": {"frags": {"length": 16, "native": "Uint8Array", "offset": 62, "size": 16}, "gotvote": {"native": "Uint8Array", "offset": 93, "size": 1}, "horizAngleAdjust": {"native": "Int32Array", "offset": 32, "size": 4}, "horizRecenter": {"native": "Int32Array", "offset": 28, "size": 4}, "horizSkew": {"native": "Int32Array", "offset": 36, "size": 4}, "input": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"bits": {"native": "Uint32Array", "offset": 0, "size": 4}, "extbits": {"native": "Uint32Array", "offset": 16, "size": 4}, "fvel": {"native": "Int16Array", "offset": 4, "size": 2}, "q16avel": {"native": "Int32Array", "offset": 8, "size": 4}, "q16horz": {"native": "Int32Array", "offset": 12, "size": 4}, "svel": {"native": "Int16Array", "offset": 6, "size": 2}}, "overlaps": false, "size": 20, "union": false}, "offset": 8}, "lastViewUpdate": {"native": "BigUint64Array", "offset": 40, "size": 8}, "netsynctime": {"native": "Int32Array", "offset": 48, "size": 4}, "pcolor": {"native": "Int32Array", "offset": 52, "size": 4}, "ping": {"native": "Int16Array", "offset": 60, "size": 2}, "pingcnt": {"native": "Uint8Array", "offset": 94, "size": 1}, "playerquitflag": {"native": "Uint8Array", "offset": 95, "size": 1}, "ps": {"offset": 0, "pointer": true, "size": 8}, "pteam": {"native": "Int32Array", "offset": 56, "size": 4}, "ready": {"native": "Uint8Array", "offset": 96, "size": 1}, "revision": {"native": "Uint32Array", "offset": 129, "size": 4}, "smoothcamera": {"native": "Uint8Array", "offset": 91, "size": 1}, "user_name": {"length": 32, "native": "Uint8Array", "offset": 97, "size": 32}, "vote": {"native": "Uint8Array", "offset": 92, "size": 1}, "wchoice": {"length": 13, "native": "Uint8Array", "offset": 78, "size": 13}}, "overlaps": false, "size": 133, "union": false}, {}), 0).value).wchoice, 9, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(1) & 255)) & 255));
  sprintf(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.wchoice, __cxx_literal_7f69b4cf1168663b35b5);
  for (let j = i32(48); (j <= i32(57)); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return next; })(cRef(() => j, __cxx_lvalue_1 => { j = __cxx_lvalue_1; }))) {
    let clipshape = __cxx_literal_918015f293a93207d290;
    ((cDeref(cPointerOffset(clipshape, 10, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(j) & 255)) & 255));
    __cxx_global_cell_d0bf40931b0c2bbed6177e3e().value.append(xstrdup__header_795d52f00e26(clipshape));
  }
  if ((argc > 1)) {
    let size = u64(ARRAY_SIZE__header_84a9c9d1a773(tempbuf));
    let bytesWritten = u64(snprintf(tempbuf, size, __cxx_literal_139b16b7b6c8a6d4e30d));
    for (let i = i32(1); (i < argc); ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i32((previous + 1)); __cxx_lvalue_2.value = next; return next; })(cRef(() => i, __cxx_lvalue_3 => { i = __cxx_lvalue_3; }))) {
      (bytesWritten = u64((BigInt(bytesWritten) + BigInt(u64(snprintf(cPointerOffset(tempbuf, bytesWritten, Uint8Array.BYTES_PER_ELEMENT), u64((BigInt(size) - BigInt(bytesWritten))), __cxx_literal_c3e954d147affd005297, (cPointerElementRef(argv, i).value)))))));
    }
    ((i32(0) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(0), __cxx_literal_30597ba8b1c6f2c5f3ef, u32(195), __cxx_literal_548706edd16c2805cd64, tempbuf));
    let i = i32(1);
    do {
      let oc = (cPointerElementRef(argv, i).value);
      let shortopt = i32(0);
      let ignored_short_opt = i32(0);
      (c = oc);
      if ((i32((cDeref(c, Uint8Array).value)) == i32(45))) {
        (shortopt = i32(0));
        if ((((!Boolean(strcasecmp(cPointerOffset(c, 1, Uint8Array.BYTES_PER_ELEMENT), __cxx_literal_f4f7798839186de23933))) || (!Boolean(strcasecmp(cPointerOffset(c, 1, Uint8Array.BYTES_PER_ELEMENT), __cxx_literal_646bc10eff9c1108217b)))) || (!Boolean(strcasecmp(cPointerOffset(c, 1, Uint8Array.BYTES_PER_ELEMENT), __cxx_literal_905702d66d919afc3f80))))) {
          G_ShowParameterHelp();
          do {
            engineDestroyAllocator__header_97a58392f84d();
            cProcess.exit(0);
          } while (Boolean(0));
        }
        if ((!Boolean(strcasecmp(cPointerOffset(c, 1, Uint8Array.BYTES_PER_ELEMENT), __cxx_literal_72f1cf2a83f498ecf080)))) {
          if ((argc > i32((i + 1)))) {
            (__cxx_global_cell_e52bb48b6936f3f6004987dc().value = i32(atoi_safe__header_6849bd99ac50((cPointerElementRef(argv, i32((i + 1))).value))));
            if (((__cxx_global_cell_e52bb48b6936f3f6004987dc().value > i32(0)) && (__cxx_global_cell_e52bb48b6936f3f6004987dc().value < i32(4)))) {
              (__cxx_global_cell_2553af87fa9f43a7967c16e8().value = i32(1));
            } else {
              (__cxx_global_cell_e52bb48b6936f3f6004987dc().value = i32(0));
            }
            ((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = i32((previous + 1)); __cxx_lvalue_4.value = next; return previous; })(cRef(() => i, __cxx_lvalue_5 => { i = __cxx_lvalue_5; }));
          }
          ((__cxx_lvalue_6) => { const previous = __cxx_lvalue_6.value; const next = i32((previous + 1)); __cxx_lvalue_6.value = next; return previous; })(cRef(() => i, __cxx_lvalue_7 => { i = __cxx_lvalue_7; }));
          continue;
        }
        if (((!Boolean(strcasecmp(cPointerOffset(c, 1, Uint8Array.BYTES_PER_ELEMENT), __cxx_literal_ce46c680b26694666f56))) || (!Boolean(strcasecmp(cPointerOffset(c, 1, Uint8Array.BYTES_PER_ELEMENT), __cxx_literal_6c3b428e55aecba65325))))) {
          G_ShowDebugHelp();
          do {
            engineDestroyAllocator__header_97a58392f84d();
            cProcess.exit(0);
          } while (Boolean(0));
        }
        if (((!Boolean(strcasecmp(cPointerOffset(c, 1, Uint8Array.BYTES_PER_ELEMENT), __cxx_literal_d370d892183c48706345))) || (!Boolean(strcasecmp(cPointerOffset(c, 1, Uint8Array.BYTES_PER_ELEMENT), __cxx_literal_2a19079e82df73e33155))))) {
          if ((argc > i32((i + 1)))) {
            G_AddGroup((cPointerElementRef(argv, i32((i + 1))).value));
            ((__cxx_lvalue_8) => { const previous = __cxx_lvalue_8.value; const next = i32((previous + 1)); __cxx_lvalue_8.value = next; return previous; })(cRef(() => i, __cxx_lvalue_9 => { i = __cxx_lvalue_9; }));
          }
          ((__cxx_lvalue_10) => { const previous = __cxx_lvalue_10.value; const next = i32((previous + 1)); __cxx_lvalue_10.value = next; return previous; })(cRef(() => i, __cxx_lvalue_11 => { i = __cxx_lvalue_11; }));
          continue;
        }
        if ((!Boolean(strcasecmp(cPointerOffset(c, 1, Uint8Array.BYTES_PER_ELEMENT), __cxx_literal_ca84a786b50528a33c0e)))) {
          if ((argc > i32((i + 1)))) {
            Bstrncpyz__header_ae7ba56a4fcd(g_modDir, (cPointerElementRef(argv, i32((i + 1))).value), 256);
            G_AddPath((cPointerElementRef(argv, i32((i + 1))).value));
            ((__cxx_lvalue_12) => { const previous = __cxx_lvalue_12.value; const next = i32((previous + 1)); __cxx_lvalue_12.value = next; return previous; })(cRef(() => i, __cxx_lvalue_13 => { i = __cxx_lvalue_13; }));
          }
          ((__cxx_lvalue_14) => { const previous = __cxx_lvalue_14.value; const next = i32((previous + 1)); __cxx_lvalue_14.value = next; return previous; })(cRef(() => i, __cxx_lvalue_15 => { i = __cxx_lvalue_15; }));
          continue;
        }
        if ((!Boolean(strcasecmp(cPointerOffset(c, 1, Uint8Array.BYTES_PER_ELEMENT), __cxx_literal_8ab4266bbbd1995af704)))) {
          if ((argc > i32((i + 1)))) {
            strcpy(g_setupFileName, (cPointerElementRef(argv, i32((i + 1))).value));
            ((__cxx_lvalue_16) => { const previous = __cxx_lvalue_16.value; const next = i32((previous + 1)); __cxx_lvalue_16.value = next; return previous; })(cRef(() => i, __cxx_lvalue_17 => { i = __cxx_lvalue_17; }));
          }
          ((__cxx_lvalue_18) => { const previous = __cxx_lvalue_18.value; const next = i32((previous + 1)); __cxx_lvalue_18.value = next; return previous; })(cRef(() => i, __cxx_lvalue_19 => { i = __cxx_lvalue_19; }));
          continue;
        }
        if ((!Boolean(strcasecmp(cPointerOffset(c, 1, Uint8Array.BYTES_PER_ELEMENT), __cxx_literal_5dfc307464453c2ef3dd)))) {
          if ((argc > i32((i + 1)))) {
            clearGrpNamePtr();
            (__cxx_global_cell_27587671eaba76ec3d4a0ad1().value = dup_filename__header_928249554f1f((cPointerElementRef(argv, i32((i + 1))).value)));
            ((__cxx_lvalue_20) => { const previous = __cxx_lvalue_20.value; const next = i32((previous + 1)); __cxx_lvalue_20.value = next; return previous; })(cRef(() => i, __cxx_lvalue_21 => { i = __cxx_lvalue_21; }));
          }
          ((__cxx_lvalue_22) => { const previous = __cxx_lvalue_22.value; const next = i32((previous + 1)); __cxx_lvalue_22.value = next; return previous; })(cRef(() => i, __cxx_lvalue_23 => { i = __cxx_lvalue_23; }));
          continue;
        }
        if ((!Boolean(strcasecmp(cPointerOffset(c, 1, Uint8Array.BYTES_PER_ELEMENT), __cxx_literal_5f12737d661f4cc9fab3)))) {
          (__cxx_global_cell_c0e288040dbf9a805036c27d().value = i32(2));
          ((__cxx_lvalue_24) => { const previous = __cxx_lvalue_24.value; const next = i32((previous + 1)); __cxx_lvalue_24.value = next; return previous; })(cRef(() => i, __cxx_lvalue_25 => { i = __cxx_lvalue_25; }));
          continue;
        }
        if ((!Boolean(strcasecmp(cPointerOffset(c, 1, Uint8Array.BYTES_PER_ELEMENT), __cxx_literal_3d706da0519c5cf87e76)))) {
          (__cxx_global_cell_c0e288040dbf9a805036c27d().value = i32((2 | 4)));
          ((__cxx_lvalue_26) => { const previous = __cxx_lvalue_26.value; const next = i32((previous + 1)); __cxx_lvalue_26.value = next; return previous; })(cRef(() => i, __cxx_lvalue_27 => { i = __cxx_lvalue_27; }));
          continue;
        }
        if ((!Boolean(strcasecmp(cPointerOffset(c, 1, Uint8Array.BYTES_PER_ELEMENT), __cxx_literal_819bbdae8233da387027)))) {
          (__cxx_global_cell_c0e288040dbf9a805036c27d().value = i32(8));
          ((__cxx_lvalue_28) => { const previous = __cxx_lvalue_28.value; const next = i32((previous + 1)); __cxx_lvalue_28.value = next; return previous; })(cRef(() => i, __cxx_lvalue_29 => { i = __cxx_lvalue_29; }));
          continue;
        }
        if ((!Boolean(strcasecmp(cPointerOffset(c, 1, Uint8Array.BYTES_PER_ELEMENT), __cxx_literal_1963daa63346974aba6d)))) {
          (__cxx_global_cell_b0440c970e7e8379f59d19e9().value = i32(1));
          ((__cxx_lvalue_30) => { const previous = __cxx_lvalue_30.value; const next = i32((previous + 1)); __cxx_lvalue_30.value = next; return previous; })(cRef(() => i, __cxx_lvalue_31 => { i = __cxx_lvalue_31; }));
          continue;
        }
        if ((!Boolean(strcasecmp(cPointerOffset(c, 1, Uint8Array.BYTES_PER_ELEMENT), __cxx_literal_85eef806f8e4fc8a1339)))) {
          (__cxx_global_cell_2553af87fa9f43a7967c16e8().value = i32(1));
          (__cxx_global_cell_b0440c970e7e8379f59d19e9().value = i32(0));
          ((__cxx_lvalue_32) => { const previous = __cxx_lvalue_32.value; const next = i32((previous + 1)); __cxx_lvalue_32.value = next; return previous; })(cRef(() => i, __cxx_lvalue_33 => { i = __cxx_lvalue_33; }));
          continue;
        }
        if ((!Boolean(strcasecmp(cPointerOffset(c, 1, Uint8Array.BYTES_PER_ELEMENT), __cxx_literal_77a68155bd7be889656b)))) {
          ((i32(5) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(5), __cxx_literal_66b8dedabccdd8394191, u32(331), __cxx_literal_057627e76e44ee96d7e9));
          (__cxx_global_cell_d0cb64ef22766dce0c3d933d().value = (u32((__cxx_global_cell_d0cb64ef22766dce0c3d933d().value | i32(1))) & 255));
          ((__cxx_lvalue_34) => { const previous = __cxx_lvalue_34.value; const next = i32((previous + 1)); __cxx_lvalue_34.value = next; return previous; })(cRef(() => i, __cxx_lvalue_35 => { i = __cxx_lvalue_35; }));
          continue;
        }
        if ((!Boolean(strcasecmp(cPointerOffset(c, 1, Uint8Array.BYTES_PER_ELEMENT), __cxx_literal_352036a7c0b06a448095)))) {
          ((i32(0) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(0), __cxx_literal_4d1da8b4fc90f6a8140f, u32(338), __cxx_literal_ac0f9d71b4ee5bd7a28f));
          (__cxx_global_cell_f496251f4ec050118ec259dc().value = i32(1));
          ((__cxx_lvalue_36) => { const previous = __cxx_lvalue_36.value; const next = i32((previous + 1)); __cxx_lvalue_36.value = next; return previous; })(cRef(() => i, __cxx_lvalue_37 => { i = __cxx_lvalue_37; }));
          continue;
        }
        if ((!Boolean(strcasecmp(cPointerOffset(c, 1, Uint8Array.BYTES_PER_ELEMENT), __cxx_literal_2f5d5176d025b601d907)))) {
          if ((argc > i32((i + 1)))) {
            (__cxx_global_cell_8ae7c85e4eb0188a9d92564a().value = (u32((u32(atoi_safe__header_6849bd99ac50((cPointerElementRef(argv, i32((i + 1))).value))) & 65535)) & 65535));
            ((__cxx_lvalue_38) => { const previous = __cxx_lvalue_38.value; const next = i32((previous + 1)); __cxx_lvalue_38.value = next; return previous; })(cRef(() => i, __cxx_lvalue_39 => { i = __cxx_lvalue_39; }));
          }
          ((__cxx_lvalue_40) => { const previous = __cxx_lvalue_40.value; const next = i32((previous + 1)); __cxx_lvalue_40.value = next; return previous; })(cRef(() => i, __cxx_lvalue_41 => { i = __cxx_lvalue_41; }));
          continue;
        }
        if ((!Boolean(strcasecmp(cPointerOffset(c, 1, Uint8Array.BYTES_PER_ELEMENT), __cxx_literal_73e46ed61a53bb0ead49)))) {
          if ((argc > i32((i + 1)))) {
            (__cxx_global_cell_ad89a438a2202d5a29d0d26d().value = (cPointerElementRef(argv, i32((i + 1))).value));
            ((__cxx_lvalue_42) => { const previous = __cxx_lvalue_42.value; const next = i32((previous + 1)); __cxx_lvalue_42.value = next; return previous; })(cRef(() => i, __cxx_lvalue_43 => { i = __cxx_lvalue_43; }));
          }
          ((__cxx_lvalue_44) => { const previous = __cxx_lvalue_44.value; const next = i32((previous + 1)); __cxx_lvalue_44.value = next; return previous; })(cRef(() => i, __cxx_lvalue_45 => { i = __cxx_lvalue_45; }));
          continue;
        }
        if ((!Boolean(strcasecmp(cPointerOffset(c, 1, Uint8Array.BYTES_PER_ELEMENT), __cxx_literal_287ceed781ebfbffbc6d)))) {
          if ((argc > i32((i + 1)))) {
            (__cxx_global_cell_e9e7cdf79aac46339de9f120().value = (cPointerElementRef(argv, i32((i + 1))).value));
            ((__cxx_lvalue_46) => { const previous = __cxx_lvalue_46.value; const next = i32((previous + 1)); __cxx_lvalue_46.value = next; return previous; })(cRef(() => i, __cxx_lvalue_47 => { i = __cxx_lvalue_47; }));
          }
          ((__cxx_lvalue_48) => { const previous = __cxx_lvalue_48.value; const next = i32((previous + 1)); __cxx_lvalue_48.value = next; return previous; })(cRef(() => i, __cxx_lvalue_49 => { i = __cxx_lvalue_49; }));
          continue;
        }
        if ((!Boolean(strcasecmp(cPointerOffset(c, 1, Uint8Array.BYTES_PER_ELEMENT), __cxx_literal_5c1167b4b9e5eb4d628c)))) {
          (__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.m_ffire = i32(0));
          ((__cxx_lvalue_50) => { const previous = __cxx_lvalue_50.value; const next = i32((previous + 1)); __cxx_lvalue_50.value = next; return previous; })(cRef(() => i, __cxx_lvalue_51 => { i = __cxx_lvalue_51; }));
          continue;
        }
        if ((!Boolean(strcasecmp(cPointerOffset(c, 1, Uint8Array.BYTES_PER_ELEMENT), __cxx_literal_1d3ff75ae53f7b30a9ac)))) {
          if ((argc > i32((i + 1)))) {
            xfree__header_fea841e23a87(__cxx_global_cell_41b93597aa1b675c52f24290().value);
            (__cxx_global_cell_41b93597aa1b675c52f24290().value = dup_filename__header_928249554f1f((cPointerElementRef(argv, i32((i + 1))).value)));
            ((i32(0) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(0), __cxx_literal_fae05a3c44c0c9ddd7ce, u32(433), __cxx_literal_6f33cee8c2ebed1f24ca, __cxx_global_cell_41b93597aa1b675c52f24290().value));
            ((__cxx_lvalue_52) => { const previous = __cxx_lvalue_52.value; const next = i32((previous + 1)); __cxx_lvalue_52.value = next; return previous; })(cRef(() => i, __cxx_lvalue_53 => { i = __cxx_lvalue_53; }));
          }
          ((__cxx_lvalue_54) => { const previous = __cxx_lvalue_54.value; const next = i32((previous + 1)); __cxx_lvalue_54.value = next; return previous; })(cRef(() => i, __cxx_lvalue_55 => { i = __cxx_lvalue_55; }));
          continue;
        }
        if ((!Boolean(strcasecmp(cPointerOffset(c, 1, Uint8Array.BYTES_PER_ELEMENT), __cxx_literal_41037810a2d374b39867)))) {
          if ((argc > i32((i + 1)))) {
            G_AddCon((cPointerElementRef(argv, i32((i + 1))).value));
            ((__cxx_lvalue_56) => { const previous = __cxx_lvalue_56.value; const next = i32((previous + 1)); __cxx_lvalue_56.value = next; return previous; })(cRef(() => i, __cxx_lvalue_57 => { i = __cxx_lvalue_57; }));
          }
          ((__cxx_lvalue_58) => { const previous = __cxx_lvalue_58.value; const next = i32((previous + 1)); __cxx_lvalue_58.value = next; return previous; })(cRef(() => i, __cxx_lvalue_59 => { i = __cxx_lvalue_59; }));
          continue;
        }
        if ((!Boolean(strcasecmp(cPointerOffset(c, 1, Uint8Array.BYTES_PER_ELEMENT), __cxx_literal_16703f8afded39885f6c)))) {
          if ((argc > i32((i + 1)))) {
            G_AddConModule((cPointerElementRef(argv, i32((i + 1))).value));
            ((__cxx_lvalue_60) => { const previous = __cxx_lvalue_60.value; const next = i32((previous + 1)); __cxx_lvalue_60.value = next; return previous; })(cRef(() => i, __cxx_lvalue_61 => { i = __cxx_lvalue_61; }));
          }
          ((__cxx_lvalue_62) => { const previous = __cxx_lvalue_62.value; const next = i32((previous + 1)); __cxx_lvalue_62.value = next; return previous; })(cRef(() => i, __cxx_lvalue_63 => { i = __cxx_lvalue_63; }));
          continue;
        }
        if ((!Boolean(strcasecmp(cPointerOffset(c, 1, Uint8Array.BYTES_PER_ELEMENT), __cxx_literal_9763a96d2db762cfab65)))) {
          if ((argc > i32((i + 1)))) {
            G_AddDef((cPointerElementRef(argv, i32((i + 1))).value));
            ((__cxx_lvalue_64) => { const previous = __cxx_lvalue_64.value; const next = i32((previous + 1)); __cxx_lvalue_64.value = next; return previous; })(cRef(() => i, __cxx_lvalue_65 => { i = __cxx_lvalue_65; }));
          }
          ((__cxx_lvalue_66) => { const previous = __cxx_lvalue_66.value; const next = i32((previous + 1)); __cxx_lvalue_66.value = next; return previous; })(cRef(() => i, __cxx_lvalue_67 => { i = __cxx_lvalue_67; }));
          continue;
        }
        if ((!Boolean(strcasecmp(cPointerOffset(c, 1, Uint8Array.BYTES_PER_ELEMENT), __cxx_literal_4c930fbb0e5f967c6e56)))) {
          if ((argc > i32((i + 1)))) {
            G_AddDefModule((cPointerElementRef(argv, i32((i + 1))).value));
            ((__cxx_lvalue_68) => { const previous = __cxx_lvalue_68.value; const next = i32((previous + 1)); __cxx_lvalue_68.value = next; return previous; })(cRef(() => i, __cxx_lvalue_69 => { i = __cxx_lvalue_69; }));
          }
          ((__cxx_lvalue_70) => { const previous = __cxx_lvalue_70.value; const next = i32((previous + 1)); __cxx_lvalue_70.value = next; return previous; })(cRef(() => i, __cxx_lvalue_71 => { i = __cxx_lvalue_71; }));
          continue;
        }
        if ((!Boolean(strcasecmp(cPointerOffset(c, 1, Uint8Array.BYTES_PER_ELEMENT), __cxx_literal_d558fc8a6265f622caad)))) {
          if ((argc > i32((i + 1)))) {
            G_AddPath((cPointerElementRef(argv, i32((i + 1))).value));
            ((__cxx_lvalue_72) => { const previous = __cxx_lvalue_72.value; const next = i32((previous + 1)); __cxx_lvalue_72.value = next; return previous; })(cRef(() => i, __cxx_lvalue_73 => { i = __cxx_lvalue_73; }));
          }
          ((__cxx_lvalue_74) => { const previous = __cxx_lvalue_74.value; const next = i32((previous + 1)); __cxx_lvalue_74.value = next; return previous; })(cRef(() => i, __cxx_lvalue_75 => { i = __cxx_lvalue_75; }));
          continue;
        }
        if ((!Boolean(strcasecmp(cPointerOffset(c, 1, Uint8Array.BYTES_PER_ELEMENT), __cxx_literal_3b3ea1212f3eec2592e4)))) {
          if ((argc > i32((i + 1)))) {
            G_AddDemo((cPointerElementRef(argv, i32((i + 1))).value));
            ((__cxx_lvalue_76) => { const previous = __cxx_lvalue_76.value; const next = i32((previous + 1)); __cxx_lvalue_76.value = next; return previous; })(cRef(() => i, __cxx_lvalue_77 => { i = __cxx_lvalue_77; }));
          }
          ((__cxx_lvalue_78) => { const previous = __cxx_lvalue_78.value; const next = i32((previous + 1)); __cxx_lvalue_78.value = next; return previous; })(cRef(() => i, __cxx_lvalue_79 => { i = __cxx_lvalue_79; }));
          continue;
        }
        if ((!Boolean(strcasecmp(cPointerOffset(c, 1, Uint8Array.BYTES_PER_ELEMENT), __cxx_literal_d388796743d422b5b719)))) {
          if ((argc > i32((i + 1)))) {
            G_AddClipMap((cPointerElementRef(argv, i32((i + 1))).value));
            ((__cxx_lvalue_80) => { const previous = __cxx_lvalue_80.value; const next = i32((previous + 1)); __cxx_lvalue_80.value = next; return previous; })(cRef(() => i, __cxx_lvalue_81 => { i = __cxx_lvalue_81; }));
          }
          ((__cxx_lvalue_82) => { const previous = __cxx_lvalue_82.value; const next = i32((previous + 1)); __cxx_lvalue_82.value = next; return previous; })(cRef(() => i, __cxx_lvalue_83 => { i = __cxx_lvalue_83; }));
          continue;
        }
        if ((!Boolean(strcasecmp(cPointerOffset(c, 1, Uint8Array.BYTES_PER_ELEMENT), __cxx_literal_62f931d47deedfb554bd)))) {
          (__cxx_global_cell_428952e2c5a589c67db10fcc().value = i32(1));
          ((__cxx_lvalue_84) => { const previous = __cxx_lvalue_84.value; const next = i32((previous + 1)); __cxx_lvalue_84.value = next; return previous; })(cRef(() => i, __cxx_lvalue_85 => { i = __cxx_lvalue_85; }));
          continue;
        }
        if (((!Boolean(strcasecmp(cPointerOffset(c, 1, Uint8Array.BYTES_PER_ELEMENT), __cxx_literal_541e692f15cbe0a205e0))) || (!Boolean(strcasecmp(cPointerOffset(c, 1, Uint8Array.BYTES_PER_ELEMENT), __cxx_literal_5cabecbcfaaf415b4254))))) {
          (__cxx_global_cell_d47d33660ab59c48cbbd560e().value = i32(1));
          ((__cxx_lvalue_86) => { const previous = __cxx_lvalue_86.value; const next = i32((previous + 1)); __cxx_lvalue_86.value = next; return previous; })(cRef(() => i, __cxx_lvalue_87 => { i = __cxx_lvalue_87; }));
          continue;
        }
        if ((!Boolean(strcasecmp(cPointerOffset(c, 1, Uint8Array.BYTES_PER_ELEMENT), __cxx_literal_173dc013edd2b6090ff2)))) {
          (__cxx_global_cell_7dc6e906fd58688c90792303().value = i32(1));
          ((__cxx_lvalue_88) => { const previous = __cxx_lvalue_88.value; const next = i32((previous + 1)); __cxx_lvalue_88.value = next; return previous; })(cRef(() => i, __cxx_lvalue_89 => { i = __cxx_lvalue_89; }));
          continue;
        }
        if ((!Boolean(strcasecmp(cPointerOffset(c, 1, Uint8Array.BYTES_PER_ELEMENT), __cxx_literal_955f34fcc2da88da8c7b)))) {
          (__cxx_global_cell_6c47f72ba9178ee1cea25b07().value = i32(1));
          ((__cxx_lvalue_90) => { const previous = __cxx_lvalue_90.value; const next = i32((previous + 1)); __cxx_lvalue_90.value = next; return previous; })(cRef(() => i, __cxx_lvalue_91 => { i = __cxx_lvalue_91; }));
          continue;
        }
        if ((!Boolean(strcasecmp(cPointerOffset(c, 1, Uint8Array.BYTES_PER_ELEMENT), __cxx_literal_6845eb4b8f7a355e5326)))) {
          if ((argc > i32((i + 1)))) {
            let j = u32(strtol((cPointerElementRef(argv, i32((i + 1))).value), null, 10));
            (__cxx_global_cell_8405b1e60e6765b2469532f3().value = i32(u32((j << 10))));
            ((i32(0) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(0), __cxx_literal_af5d6ffc076eb9c20205, u32(541), __cxx_literal_d3f64ec55112a18354b7, j));
            ((__cxx_lvalue_92) => { const previous = __cxx_lvalue_92.value; const next = i32((previous + 1)); __cxx_lvalue_92.value = next; return previous; })(cRef(() => i, __cxx_lvalue_93 => { i = __cxx_lvalue_93; }));
          }
          ((__cxx_lvalue_94) => { const previous = __cxx_lvalue_94.value; const next = i32((previous + 1)); __cxx_lvalue_94.value = next; return previous; })(cRef(() => i, __cxx_lvalue_95 => { i = __cxx_lvalue_95; }));
          continue;
        }
        if ((!Boolean(strcasecmp(cPointerOffset(c, 1, Uint8Array.BYTES_PER_ELEMENT), __cxx_literal_74bb9747f98dd4401276)))) {
          ((__cxx_lvalue_96) => { const previous = __cxx_lvalue_96.value; const next = i32((previous + 1)); __cxx_lvalue_96.value = next; return previous; })(cRef(() => i, __cxx_lvalue_97 => { i = __cxx_lvalue_97; }));
          continue;
        }
        if ((!Boolean(strcasecmp(cPointerOffset(c, 1, Uint8Array.BYTES_PER_ELEMENT), __cxx_literal_04315cad4f74002afaca)))) {
          ((__cxx_lvalue_98) => { const previous = __cxx_lvalue_98.value; const next = i32((previous + 1)); __cxx_lvalue_98.value = next; return previous; })(cRef(() => i, __cxx_lvalue_99 => { i = __cxx_lvalue_99; }));
          continue;
        }
        if ((!Boolean(strcasecmp(cPointerOffset(c, 1, Uint8Array.BYTES_PER_ELEMENT), __cxx_literal_94e9b52ebe8a5c14c9ca)))) {
          if ((argc > i32((i + 1)))) {
            ((__cxx_lvalue_100) => { const previous = __cxx_lvalue_100.value; const next = i32((previous + 1)); __cxx_lvalue_100.value = next; return previous; })(cRef(() => i, __cxx_lvalue_101 => { i = __cxx_lvalue_101; }));
          }
          ((__cxx_lvalue_102) => { const previous = __cxx_lvalue_102.value; const next = i32((previous + 1)); __cxx_lvalue_102.value = next; return previous; })(cRef(() => i, __cxx_lvalue_103 => { i = __cxx_lvalue_103; }));
          continue;
        }
      }
      if ((i32((cDeref(c, Uint8Array).value)) == i32(45))) {
        (shortopt = i32(1));
        ((__cxx_lvalue_104) => { const previous = __cxx_lvalue_104.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_104.value = next; return previous; })(cRef(() => c, __cxx_lvalue_105 => { c = __cxx_lvalue_105; }));
        switch (tolower(i32((cDeref(c, Uint8Array).value)))) {
          case i32(97): {
            (__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.playerai = i32(1));
          }
          ((i32(0) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(0), __cxx_literal_75cde2524ee57913b02d, u32(595), __cxx_literal_2f173bac6af2ad02adc0));
          break;
          case i32(99): {
            ((__cxx_lvalue_106) => { const previous = __cxx_lvalue_106.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_106.value = next; return previous; })(cRef(() => c, __cxx_lvalue_107 => { c = __cxx_lvalue_107; }));
          }
          (__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.m_coop = i32(0));
          while (((i32((cDeref(c, Uint8Array).value)) >= i32(48)) && (i32((cDeref(c, Uint8Array).value)) <= i32(57)))) {
            ((__cxx_lvalue_108) => (__cxx_lvalue_108.value = i32(Math.imul(__cxx_lvalue_108.value, 10))))(cObjectFieldRef(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value, "m_coop"));
            ((__cxx_lvalue_109) => (__cxx_lvalue_109.value = i32((Number(__cxx_lvalue_109.value) + Number(i32((i32((cDeref(c, Uint8Array).value)) - i32(48))))))))(cObjectFieldRef(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value, "m_coop"));
            ((__cxx_lvalue_110) => { const previous = __cxx_lvalue_110.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_110.value = next; return previous; })(cRef(() => c, __cxx_lvalue_111 => { c = __cxx_lvalue_111; }));
          }
          ((__cxx_lvalue_112) => { const previous = __cxx_lvalue_112.value; const next = i32((previous - 1)); __cxx_lvalue_112.value = next; return previous; })(cObjectFieldRef(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value, "m_coop"));
          break;
          case i32(100): {
            ((__cxx_lvalue_113) => { const previous = __cxx_lvalue_113.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_113.value = next; return previous; })(cRef(() => c, __cxx_lvalue_114 => { c = __cxx_lvalue_114; }));
            if (Boolean((cDeref(c, Uint8Array).value))) {
              G_AddDemo(c);
            }
            break;
          }
          case i32(103): {
            ((__cxx_lvalue_115) => { const previous = __cxx_lvalue_115.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_115.value = next; return previous; })(cRef(() => c, __cxx_lvalue_116 => { c = __cxx_lvalue_116; }));
          }
          if (Boolean((cDeref(c, Uint8Array).value))) {
            G_AddGroup(c);
          }
          break;
          case i32(104): {
            ((__cxx_lvalue_117) => { const previous = __cxx_lvalue_117.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_117.value = next; return previous; })(cRef(() => c, __cxx_lvalue_118 => { c = __cxx_lvalue_118; }));
          }
          if (Boolean((cDeref(c, Uint8Array).value))) {
            G_AddDef(c);
          }
          break;
          case i32(106): {
            ((__cxx_lvalue_119) => { const previous = __cxx_lvalue_119.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_119.value = next; return previous; })(cRef(() => c, __cxx_lvalue_120 => { c = __cxx_lvalue_120; }));
          }
          if (Boolean((cDeref(c, Uint8Array).value))) {
            G_AddPath(c);
          }
          break;
          case i32(108): {
            if (Boolean(isdigit(i32((cDeref(cPointerOffset(c, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value))))) {
              (__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.warp_on = (u32((u32(1) & 255)) & 255));
              ((__cxx_lvalue_121) => { const previous = __cxx_lvalue_121.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_121.value = next; return previous; })(cRef(() => c, __cxx_lvalue_122 => { c = __cxx_lvalue_122; }));
              (__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.m_level_number = i32((__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.level_number = i32((u32(i32((atoi_safe__header_6849bd99ac50(c) - 1))) % u32(64))))));
            }
          }
          break;
          case i32(109): {
            if (((i32((cDeref(cPointerOffset(c, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) != i32(97)) && (i32((cDeref(cPointerOffset(c, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) != i32(65)))) {
              (__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.m_monsters_off = i32(1));
              (__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.m_player_skill = i32((__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.player_skill = i32(0))));
              ((i32(0) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(0), __cxx_literal_50cbaa877607415c6f02, u32(644), __cxx_literal_3b4f6c9cc14aab49e066));
            }
          }
          break;
          case i32(110): {
            ((__cxx_lvalue_123) => { const previous = __cxx_lvalue_123.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_123.value = next; return previous; })(cRef(() => c, __cxx_lvalue_124 => { c = __cxx_lvalue_124; }));
          }
          if (((i32((cDeref(c, Uint8Array).value)) == i32(115)) || (i32((cDeref(c, Uint8Array).value)) == i32(83)))) {
            (__cxx_global_cell_6f3783697feff1b900f4941b().value = i32(2));
            ((i32(0) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(0), __cxx_literal_de2ef13e10ad0dc6491d, u32(652), __cxx_literal_d695c83088ace618fe85));
          } else {
            if (((i32((cDeref(c, Uint8Array).value)) == i32(109)) || (i32((cDeref(c, Uint8Array).value)) == i32(77)))) {
              (__cxx_global_cell_53eb40c63961c8df63fc36b2().value = i32(1));
              ((i32(0) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(0), __cxx_literal_6fea2656f68e17be859f, u32(657), __cxx_literal_0e3bbefdbebb43cd28be));
            } else {
              G_ShowParameterHelp();
              do {
                engineDestroyAllocator__header_97a58392f84d();
                cProcess.exit(0);
              } while (Boolean(0));
            }
          }
          break;
          case i32(113): {
            if ((i32((cDeref(((__cxx_lvalue_125) => { const previous = __cxx_lvalue_125.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_125.value = next; return next; })(cRef(() => c, __cxx_lvalue_126 => { c = __cxx_lvalue_126; })), Uint8Array).value)) == 0)) {
              (__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.multimode = i32(1));
              ((i32(0) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(0), __cxx_literal_f9e661a49a99521243cb, u32(669), __cxx_literal_028f34514b0bba2d51ef));
            } else {
              let numpl = i32(atoi_safe__header_6849bd99ac50(c));
              if (((numpl < 2) || (numpl > 16))) {
                ((i32(0) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(0), __cxx_literal_56d30e52a25364aced93, u32(677), __cxx_literal_2e7c214d674529427d76, 16));
              } else {
                (__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.multimode = i32(numpl));
                ((i32(0) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(0), __cxx_literal_494253779d4818f5836e, u32(682), __cxx_literal_4fbaf38625e314ce780c, __cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.multimode));
                (__cxx_global_cell_99af70ece63462b77bc5f6d7().value = i32(numpl));
              }
            }
          }
          (__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.m_coop = i32((__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.coop = i32(0))));
          (__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.m_marker = i32((__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.marker = i32(1))));
          (__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.m_respawn_monsters = i32((__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.respawn_monsters = i32(1))));
          (__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.m_respawn_items = i32((__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.respawn_items = i32(1))));
          (__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.m_respawn_inventory = i32((__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.respawn_inventory = i32(1))));
          break;
          case i32(114): {
            (__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.m_recstat = i32(1));
          }
          ((i32(0) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(0), __cxx_literal_b9256a828a348157bac5, u32(696), __cxx_literal_55c2a6d403b10b89c8d1));
          break;
          case i32(115): {
            ((__cxx_lvalue_127) => { const previous = __cxx_lvalue_127.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_127.value = next; return previous; })(cRef(() => c, __cxx_lvalue_128 => { c = __cxx_lvalue_128; }));
          }
          (__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.m_player_skill = i32((__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.player_skill = i32(clamp__header_710e9819e984(atoi_safe__header_6849bd99ac50(c), 0, __cxx_global_cell_e9576a5286a0997ea679c8d5().value)))));
          if ((__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.m_player_skill == 4)) {
            (__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.m_respawn_monsters = i32((__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.respawn_monsters = i32(1))));
          }
          break;
          case i32(116): {
            ((__cxx_lvalue_129) => { const previous = __cxx_lvalue_129.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_129.value = next; return previous; })(cRef(() => c, __cxx_lvalue_130 => { c = __cxx_lvalue_130; }));
          }
          if ((i32((cDeref(c, Uint8Array).value)) == i32(49))) {
            (__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.m_respawn_monsters = i32(1));
          } else {
            if ((i32((cDeref(c, Uint8Array).value)) == i32(50))) {
              (__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.m_respawn_items = i32(1));
            } else {
              if ((i32((cDeref(c, Uint8Array).value)) == i32(51))) {
                (__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.m_respawn_inventory = i32(1));
              } else {
                (__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.m_respawn_monsters = i32(1));
                (__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.m_respawn_items = i32(1));
                (__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.m_respawn_inventory = i32(1));
              }
            }
          }
          ((i32(0) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(0), __cxx_literal_0b6c0ac4a0bc861921db, u32(715), __cxx_literal_b0df12f5298ab1c95a6d));
          break;
          case i32(117): {
            ((__cxx_lvalue_131) => { const previous = __cxx_lvalue_131.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_131.value = next; return previous; })(cRef(() => c, __cxx_lvalue_132 => { c = __cxx_lvalue_132; }));
            let j = i32(0);
            if (Boolean((cDeref(c, Uint8Array).value))) {
              while ((((i32((cDeref(c, Uint8Array).value)) >= i32(48)) && (i32((cDeref(c, Uint8Array).value)) <= i32(57))) && (j < (min__template_774131ccff66371d(((__cxx_lvalue_133) => cRef(() => __cxx_lvalue_133, () => { throw new TypeError("const C++ reference write"); }))(i32(13)), ((__cxx_lvalue_134) => cRef(() => __cxx_lvalue_134, () => { throw new TypeError("const C++ reference write"); }))(10))).value))) {
                ((cDeref(cPointerOffset((cPointerElementRef(cRecordPointer(g_player, {"align": 1, "arrayAlign": 1, "fields": {"frags": {"length": 16, "native": "Uint8Array", "offset": 62, "size": 16}, "gotvote": {"native": "Uint8Array", "offset": 93, "size": 1}, "horizAngleAdjust": {"native": "Int32Array", "offset": 32, "size": 4}, "horizRecenter": {"native": "Int32Array", "offset": 28, "size": 4}, "horizSkew": {"native": "Int32Array", "offset": 36, "size": 4}, "input": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"bits": {"native": "Uint32Array", "offset": 0, "size": 4}, "extbits": {"native": "Uint32Array", "offset": 16, "size": 4}, "fvel": {"native": "Int16Array", "offset": 4, "size": 2}, "q16avel": {"native": "Int32Array", "offset": 8, "size": 4}, "q16horz": {"native": "Int32Array", "offset": 12, "size": 4}, "svel": {"native": "Int16Array", "offset": 6, "size": 2}}, "overlaps": false, "size": 20, "union": false}, "offset": 8}, "lastViewUpdate": {"native": "BigUint64Array", "offset": 40, "size": 8}, "netsynctime": {"native": "Int32Array", "offset": 48, "size": 4}, "pcolor": {"native": "Int32Array", "offset": 52, "size": 4}, "ping": {"native": "Int16Array", "offset": 60, "size": 2}, "pingcnt": {"native": "Uint8Array", "offset": 94, "size": 1}, "playerquitflag": {"native": "Uint8Array", "offset": 95, "size": 1}, "ps": {"offset": 0, "pointer": true, "size": 8}, "pteam": {"native": "Int32Array", "offset": 56, "size": 4}, "ready": {"native": "Uint8Array", "offset": 96, "size": 1}, "revision": {"native": "Uint32Array", "offset": 129, "size": 4}, "smoothcamera": {"native": "Uint8Array", "offset": 91, "size": 1}, "user_name": {"length": 32, "native": "Uint8Array", "offset": 97, "size": 32}, "vote": {"native": "Uint8Array", "offset": 92, "size": 1}, "wchoice": {"length": 13, "native": "Uint8Array", "offset": 78, "size": 13}}, "overlaps": false, "size": 133, "union": false}, {}), 0).value).wchoice, j, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(i32((i32((cDeref(c, Uint8Array).value)) - i32(48)))) & 255)) & 255));
                ((cDeref(cPointerOffset(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.wchoice, j, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((cDeref(c, Uint8Array).value)) & 255));
                ((__cxx_lvalue_135) => { const previous = __cxx_lvalue_135.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_135.value = next; return previous; })(cRef(() => c, __cxx_lvalue_136 => { c = __cxx_lvalue_136; }));
                ((__cxx_lvalue_137) => { const previous = __cxx_lvalue_137.value; const next = i32((previous + 1)); __cxx_lvalue_137.value = next; return previous; })(cRef(() => j, __cxx_lvalue_138 => { j = __cxx_lvalue_138; }));
              }
              if ((j > 0)) {
                (__cxx_global_cell_358690684395ca8ea893b93b().value = i32(1));
                ((i32(0) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(0), __cxx_literal_fb9bc546272dce413e41, u32(737), __cxx_literal_e3cef480240c3cd14f15));
                while ((j < 10)) {
                  if ((j == 9)) {
                    ((cDeref(cPointerOffset((cPointerElementRef(cRecordPointer(g_player, {"align": 1, "arrayAlign": 1, "fields": {"frags": {"length": 16, "native": "Uint8Array", "offset": 62, "size": 16}, "gotvote": {"native": "Uint8Array", "offset": 93, "size": 1}, "horizAngleAdjust": {"native": "Int32Array", "offset": 32, "size": 4}, "horizRecenter": {"native": "Int32Array", "offset": 28, "size": 4}, "horizSkew": {"native": "Int32Array", "offset": 36, "size": 4}, "input": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"bits": {"native": "Uint32Array", "offset": 0, "size": 4}, "extbits": {"native": "Uint32Array", "offset": 16, "size": 4}, "fvel": {"native": "Int16Array", "offset": 4, "size": 2}, "q16avel": {"native": "Int32Array", "offset": 8, "size": 4}, "q16horz": {"native": "Int32Array", "offset": 12, "size": 4}, "svel": {"native": "Int16Array", "offset": 6, "size": 2}}, "overlaps": false, "size": 20, "union": false}, "offset": 8}, "lastViewUpdate": {"native": "BigUint64Array", "offset": 40, "size": 8}, "netsynctime": {"native": "Int32Array", "offset": 48, "size": 4}, "pcolor": {"native": "Int32Array", "offset": 52, "size": 4}, "ping": {"native": "Int16Array", "offset": 60, "size": 2}, "pingcnt": {"native": "Uint8Array", "offset": 94, "size": 1}, "playerquitflag": {"native": "Uint8Array", "offset": 95, "size": 1}, "ps": {"offset": 0, "pointer": true, "size": 8}, "pteam": {"native": "Int32Array", "offset": 56, "size": 4}, "ready": {"native": "Uint8Array", "offset": 96, "size": 1}, "revision": {"native": "Uint32Array", "offset": 129, "size": 4}, "smoothcamera": {"native": "Uint8Array", "offset": 91, "size": 1}, "user_name": {"length": 32, "native": "Uint8Array", "offset": 97, "size": 32}, "vote": {"native": "Uint8Array", "offset": 92, "size": 1}, "wchoice": {"length": 13, "native": "Uint8Array", "offset": 78, "size": 13}}, "overlaps": false, "size": 133, "union": false}, {}), 0).value).wchoice, 9, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(1) & 255)) & 255));
                    ((cDeref(cPointerOffset(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.wchoice, 9, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32(49) & 255));
                  } else {
                    ((cDeref(cPointerOffset((cPointerElementRef(cRecordPointer(g_player, {"align": 1, "arrayAlign": 1, "fields": {"frags": {"length": 16, "native": "Uint8Array", "offset": 62, "size": 16}, "gotvote": {"native": "Uint8Array", "offset": 93, "size": 1}, "horizAngleAdjust": {"native": "Int32Array", "offset": 32, "size": 4}, "horizRecenter": {"native": "Int32Array", "offset": 28, "size": 4}, "horizSkew": {"native": "Int32Array", "offset": 36, "size": 4}, "input": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"bits": {"native": "Uint32Array", "offset": 0, "size": 4}, "extbits": {"native": "Uint32Array", "offset": 16, "size": 4}, "fvel": {"native": "Int16Array", "offset": 4, "size": 2}, "q16avel": {"native": "Int32Array", "offset": 8, "size": 4}, "q16horz": {"native": "Int32Array", "offset": 12, "size": 4}, "svel": {"native": "Int16Array", "offset": 6, "size": 2}}, "overlaps": false, "size": 20, "union": false}, "offset": 8}, "lastViewUpdate": {"native": "BigUint64Array", "offset": 40, "size": 8}, "netsynctime": {"native": "Int32Array", "offset": 48, "size": 4}, "pcolor": {"native": "Int32Array", "offset": 52, "size": 4}, "ping": {"native": "Int16Array", "offset": 60, "size": 2}, "pingcnt": {"native": "Uint8Array", "offset": 94, "size": 1}, "playerquitflag": {"native": "Uint8Array", "offset": 95, "size": 1}, "ps": {"offset": 0, "pointer": true, "size": 8}, "pteam": {"native": "Int32Array", "offset": 56, "size": 4}, "ready": {"native": "Uint8Array", "offset": 96, "size": 1}, "revision": {"native": "Uint32Array", "offset": 129, "size": 4}, "smoothcamera": {"native": "Uint8Array", "offset": 91, "size": 1}, "user_name": {"length": 32, "native": "Uint8Array", "offset": 97, "size": 32}, "vote": {"native": "Uint8Array", "offset": 92, "size": 1}, "wchoice": {"length": 13, "native": "Uint8Array", "offset": 78, "size": 13}}, "overlaps": false, "size": 133, "union": false}, {}), 0).value).wchoice, j, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(2) & 255)) & 255));
                    ((cDeref(cPointerOffset(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.wchoice, j, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32(50) & 255));
                  }
                  ((__cxx_lvalue_139) => { const previous = __cxx_lvalue_139.value; const next = i32((previous + 1)); __cxx_lvalue_139.value = next; return previous; })(cRef(() => j, __cxx_lvalue_140 => { j = __cxx_lvalue_140; }));
                }
              }
            }
            if ((!Boolean(__cxx_global_cell_358690684395ca8ea893b93b().value))) {
              ((i32(0) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(0), __cxx_literal_79a8396859cc5a7c7d4f, u32(759), __cxx_literal_a15274aaeaa46cdf7e24));
              ((cDeref(cPointerOffset((cPointerElementRef(cRecordPointer(g_player, {"align": 1, "arrayAlign": 1, "fields": {"frags": {"length": 16, "native": "Uint8Array", "offset": 62, "size": 16}, "gotvote": {"native": "Uint8Array", "offset": 93, "size": 1}, "horizAngleAdjust": {"native": "Int32Array", "offset": 32, "size": 4}, "horizRecenter": {"native": "Int32Array", "offset": 28, "size": 4}, "horizSkew": {"native": "Int32Array", "offset": 36, "size": 4}, "input": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"bits": {"native": "Uint32Array", "offset": 0, "size": 4}, "extbits": {"native": "Uint32Array", "offset": 16, "size": 4}, "fvel": {"native": "Int16Array", "offset": 4, "size": 2}, "q16avel": {"native": "Int32Array", "offset": 8, "size": 4}, "q16horz": {"native": "Int32Array", "offset": 12, "size": 4}, "svel": {"native": "Int16Array", "offset": 6, "size": 2}}, "overlaps": false, "size": 20, "union": false}, "offset": 8}, "lastViewUpdate": {"native": "BigUint64Array", "offset": 40, "size": 8}, "netsynctime": {"native": "Int32Array", "offset": 48, "size": 4}, "pcolor": {"native": "Int32Array", "offset": 52, "size": 4}, "ping": {"native": "Int16Array", "offset": 60, "size": 2}, "pingcnt": {"native": "Uint8Array", "offset": 94, "size": 1}, "playerquitflag": {"native": "Uint8Array", "offset": 95, "size": 1}, "ps": {"offset": 0, "pointer": true, "size": 8}, "pteam": {"native": "Int32Array", "offset": 56, "size": 4}, "ready": {"native": "Uint8Array", "offset": 96, "size": 1}, "revision": {"native": "Uint32Array", "offset": 129, "size": 4}, "smoothcamera": {"native": "Uint8Array", "offset": 91, "size": 1}, "user_name": {"length": 32, "native": "Uint8Array", "offset": 97, "size": 32}, "vote": {"native": "Uint8Array", "offset": 92, "size": 1}, "wchoice": {"length": 13, "native": "Uint8Array", "offset": 78, "size": 13}}, "overlaps": false, "size": 133, "union": false}, {}), 0).value).wchoice, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(3) & 255)) & 255));
              ((cDeref(cPointerOffset((cPointerElementRef(cRecordPointer(g_player, {"align": 1, "arrayAlign": 1, "fields": {"frags": {"length": 16, "native": "Uint8Array", "offset": 62, "size": 16}, "gotvote": {"native": "Uint8Array", "offset": 93, "size": 1}, "horizAngleAdjust": {"native": "Int32Array", "offset": 32, "size": 4}, "horizRecenter": {"native": "Int32Array", "offset": 28, "size": 4}, "horizSkew": {"native": "Int32Array", "offset": 36, "size": 4}, "input": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"bits": {"native": "Uint32Array", "offset": 0, "size": 4}, "extbits": {"native": "Uint32Array", "offset": 16, "size": 4}, "fvel": {"native": "Int16Array", "offset": 4, "size": 2}, "q16avel": {"native": "Int32Array", "offset": 8, "size": 4}, "q16horz": {"native": "Int32Array", "offset": 12, "size": 4}, "svel": {"native": "Int16Array", "offset": 6, "size": 2}}, "overlaps": false, "size": 20, "union": false}, "offset": 8}, "lastViewUpdate": {"native": "BigUint64Array", "offset": 40, "size": 8}, "netsynctime": {"native": "Int32Array", "offset": 48, "size": 4}, "pcolor": {"native": "Int32Array", "offset": 52, "size": 4}, "ping": {"native": "Int16Array", "offset": 60, "size": 2}, "pingcnt": {"native": "Uint8Array", "offset": 94, "size": 1}, "playerquitflag": {"native": "Uint8Array", "offset": 95, "size": 1}, "ps": {"offset": 0, "pointer": true, "size": 8}, "pteam": {"native": "Int32Array", "offset": 56, "size": 4}, "ready": {"native": "Uint8Array", "offset": 96, "size": 1}, "revision": {"native": "Uint32Array", "offset": 129, "size": 4}, "smoothcamera": {"native": "Uint8Array", "offset": 91, "size": 1}, "user_name": {"length": 32, "native": "Uint8Array", "offset": 97, "size": 32}, "vote": {"native": "Uint8Array", "offset": 92, "size": 1}, "wchoice": {"length": 13, "native": "Uint8Array", "offset": 78, "size": 13}}, "overlaps": false, "size": 133, "union": false}, {}), 0).value).wchoice, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(4) & 255)) & 255));
              ((cDeref(cPointerOffset((cPointerElementRef(cRecordPointer(g_player, {"align": 1, "arrayAlign": 1, "fields": {"frags": {"length": 16, "native": "Uint8Array", "offset": 62, "size": 16}, "gotvote": {"native": "Uint8Array", "offset": 93, "size": 1}, "horizAngleAdjust": {"native": "Int32Array", "offset": 32, "size": 4}, "horizRecenter": {"native": "Int32Array", "offset": 28, "size": 4}, "horizSkew": {"native": "Int32Array", "offset": 36, "size": 4}, "input": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"bits": {"native": "Uint32Array", "offset": 0, "size": 4}, "extbits": {"native": "Uint32Array", "offset": 16, "size": 4}, "fvel": {"native": "Int16Array", "offset": 4, "size": 2}, "q16avel": {"native": "Int32Array", "offset": 8, "size": 4}, "q16horz": {"native": "Int32Array", "offset": 12, "size": 4}, "svel": {"native": "Int16Array", "offset": 6, "size": 2}}, "overlaps": false, "size": 20, "union": false}, "offset": 8}, "lastViewUpdate": {"native": "BigUint64Array", "offset": 40, "size": 8}, "netsynctime": {"native": "Int32Array", "offset": 48, "size": 4}, "pcolor": {"native": "Int32Array", "offset": 52, "size": 4}, "ping": {"native": "Int16Array", "offset": 60, "size": 2}, "pingcnt": {"native": "Uint8Array", "offset": 94, "size": 1}, "playerquitflag": {"native": "Uint8Array", "offset": 95, "size": 1}, "ps": {"offset": 0, "pointer": true, "size": 8}, "pteam": {"native": "Int32Array", "offset": 56, "size": 4}, "ready": {"native": "Uint8Array", "offset": 96, "size": 1}, "revision": {"native": "Uint32Array", "offset": 129, "size": 4}, "smoothcamera": {"native": "Uint8Array", "offset": 91, "size": 1}, "user_name": {"length": 32, "native": "Uint8Array", "offset": 97, "size": 32}, "vote": {"native": "Uint8Array", "offset": 92, "size": 1}, "wchoice": {"length": 13, "native": "Uint8Array", "offset": 78, "size": 13}}, "overlaps": false, "size": 133, "union": false}, {}), 0).value).wchoice, 2, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(5) & 255)) & 255));
              ((cDeref(cPointerOffset((cPointerElementRef(cRecordPointer(g_player, {"align": 1, "arrayAlign": 1, "fields": {"frags": {"length": 16, "native": "Uint8Array", "offset": 62, "size": 16}, "gotvote": {"native": "Uint8Array", "offset": 93, "size": 1}, "horizAngleAdjust": {"native": "Int32Array", "offset": 32, "size": 4}, "horizRecenter": {"native": "Int32Array", "offset": 28, "size": 4}, "horizSkew": {"native": "Int32Array", "offset": 36, "size": 4}, "input": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"bits": {"native": "Uint32Array", "offset": 0, "size": 4}, "extbits": {"native": "Uint32Array", "offset": 16, "size": 4}, "fvel": {"native": "Int16Array", "offset": 4, "size": 2}, "q16avel": {"native": "Int32Array", "offset": 8, "size": 4}, "q16horz": {"native": "Int32Array", "offset": 12, "size": 4}, "svel": {"native": "Int16Array", "offset": 6, "size": 2}}, "overlaps": false, "size": 20, "union": false}, "offset": 8}, "lastViewUpdate": {"native": "BigUint64Array", "offset": 40, "size": 8}, "netsynctime": {"native": "Int32Array", "offset": 48, "size": 4}, "pcolor": {"native": "Int32Array", "offset": 52, "size": 4}, "ping": {"native": "Int16Array", "offset": 60, "size": 2}, "pingcnt": {"native": "Uint8Array", "offset": 94, "size": 1}, "playerquitflag": {"native": "Uint8Array", "offset": 95, "size": 1}, "ps": {"offset": 0, "pointer": true, "size": 8}, "pteam": {"native": "Int32Array", "offset": 56, "size": 4}, "ready": {"native": "Uint8Array", "offset": 96, "size": 1}, "revision": {"native": "Uint32Array", "offset": 129, "size": 4}, "smoothcamera": {"native": "Uint8Array", "offset": 91, "size": 1}, "user_name": {"length": 32, "native": "Uint8Array", "offset": 97, "size": 32}, "vote": {"native": "Uint8Array", "offset": 92, "size": 1}, "wchoice": {"length": 13, "native": "Uint8Array", "offset": 78, "size": 13}}, "overlaps": false, "size": 133, "union": false}, {}), 0).value).wchoice, 3, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(7) & 255)) & 255));
              ((cDeref(cPointerOffset((cPointerElementRef(cRecordPointer(g_player, {"align": 1, "arrayAlign": 1, "fields": {"frags": {"length": 16, "native": "Uint8Array", "offset": 62, "size": 16}, "gotvote": {"native": "Uint8Array", "offset": 93, "size": 1}, "horizAngleAdjust": {"native": "Int32Array", "offset": 32, "size": 4}, "horizRecenter": {"native": "Int32Array", "offset": 28, "size": 4}, "horizSkew": {"native": "Int32Array", "offset": 36, "size": 4}, "input": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"bits": {"native": "Uint32Array", "offset": 0, "size": 4}, "extbits": {"native": "Uint32Array", "offset": 16, "size": 4}, "fvel": {"native": "Int16Array", "offset": 4, "size": 2}, "q16avel": {"native": "Int32Array", "offset": 8, "size": 4}, "q16horz": {"native": "Int32Array", "offset": 12, "size": 4}, "svel": {"native": "Int16Array", "offset": 6, "size": 2}}, "overlaps": false, "size": 20, "union": false}, "offset": 8}, "lastViewUpdate": {"native": "BigUint64Array", "offset": 40, "size": 8}, "netsynctime": {"native": "Int32Array", "offset": 48, "size": 4}, "pcolor": {"native": "Int32Array", "offset": 52, "size": 4}, "ping": {"native": "Int16Array", "offset": 60, "size": 2}, "pingcnt": {"native": "Uint8Array", "offset": 94, "size": 1}, "playerquitflag": {"native": "Uint8Array", "offset": 95, "size": 1}, "ps": {"offset": 0, "pointer": true, "size": 8}, "pteam": {"native": "Int32Array", "offset": 56, "size": 4}, "ready": {"native": "Uint8Array", "offset": 96, "size": 1}, "revision": {"native": "Uint32Array", "offset": 129, "size": 4}, "smoothcamera": {"native": "Uint8Array", "offset": 91, "size": 1}, "user_name": {"length": 32, "native": "Uint8Array", "offset": 97, "size": 32}, "vote": {"native": "Uint8Array", "offset": 92, "size": 1}, "wchoice": {"length": 13, "native": "Uint8Array", "offset": 78, "size": 13}}, "overlaps": false, "size": 133, "union": false}, {}), 0).value).wchoice, 4, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(8) & 255)) & 255));
              ((cDeref(cPointerOffset((cPointerElementRef(cRecordPointer(g_player, {"align": 1, "arrayAlign": 1, "fields": {"frags": {"length": 16, "native": "Uint8Array", "offset": 62, "size": 16}, "gotvote": {"native": "Uint8Array", "offset": 93, "size": 1}, "horizAngleAdjust": {"native": "Int32Array", "offset": 32, "size": 4}, "horizRecenter": {"native": "Int32Array", "offset": 28, "size": 4}, "horizSkew": {"native": "Int32Array", "offset": 36, "size": 4}, "input": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"bits": {"native": "Uint32Array", "offset": 0, "size": 4}, "extbits": {"native": "Uint32Array", "offset": 16, "size": 4}, "fvel": {"native": "Int16Array", "offset": 4, "size": 2}, "q16avel": {"native": "Int32Array", "offset": 8, "size": 4}, "q16horz": {"native": "Int32Array", "offset": 12, "size": 4}, "svel": {"native": "Int16Array", "offset": 6, "size": 2}}, "overlaps": false, "size": 20, "union": false}, "offset": 8}, "lastViewUpdate": {"native": "BigUint64Array", "offset": 40, "size": 8}, "netsynctime": {"native": "Int32Array", "offset": 48, "size": 4}, "pcolor": {"native": "Int32Array", "offset": 52, "size": 4}, "ping": {"native": "Int16Array", "offset": 60, "size": 2}, "pingcnt": {"native": "Uint8Array", "offset": 94, "size": 1}, "playerquitflag": {"native": "Uint8Array", "offset": 95, "size": 1}, "ps": {"offset": 0, "pointer": true, "size": 8}, "pteam": {"native": "Int32Array", "offset": 56, "size": 4}, "ready": {"native": "Uint8Array", "offset": 96, "size": 1}, "revision": {"native": "Uint32Array", "offset": 129, "size": 4}, "smoothcamera": {"native": "Uint8Array", "offset": 91, "size": 1}, "user_name": {"length": 32, "native": "Uint8Array", "offset": 97, "size": 32}, "vote": {"native": "Uint8Array", "offset": 92, "size": 1}, "wchoice": {"length": 13, "native": "Uint8Array", "offset": 78, "size": 13}}, "overlaps": false, "size": 133, "union": false}, {}), 0).value).wchoice, 5, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(6) & 255)) & 255));
              ((cDeref(cPointerOffset((cPointerElementRef(cRecordPointer(g_player, {"align": 1, "arrayAlign": 1, "fields": {"frags": {"length": 16, "native": "Uint8Array", "offset": 62, "size": 16}, "gotvote": {"native": "Uint8Array", "offset": 93, "size": 1}, "horizAngleAdjust": {"native": "Int32Array", "offset": 32, "size": 4}, "horizRecenter": {"native": "Int32Array", "offset": 28, "size": 4}, "horizSkew": {"native": "Int32Array", "offset": 36, "size": 4}, "input": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"bits": {"native": "Uint32Array", "offset": 0, "size": 4}, "extbits": {"native": "Uint32Array", "offset": 16, "size": 4}, "fvel": {"native": "Int16Array", "offset": 4, "size": 2}, "q16avel": {"native": "Int32Array", "offset": 8, "size": 4}, "q16horz": {"native": "Int32Array", "offset": 12, "size": 4}, "svel": {"native": "Int16Array", "offset": 6, "size": 2}}, "overlaps": false, "size": 20, "union": false}, "offset": 8}, "lastViewUpdate": {"native": "BigUint64Array", "offset": 40, "size": 8}, "netsynctime": {"native": "Int32Array", "offset": 48, "size": 4}, "pcolor": {"native": "Int32Array", "offset": 52, "size": 4}, "ping": {"native": "Int16Array", "offset": 60, "size": 2}, "pingcnt": {"native": "Uint8Array", "offset": 94, "size": 1}, "playerquitflag": {"native": "Uint8Array", "offset": 95, "size": 1}, "ps": {"offset": 0, "pointer": true, "size": 8}, "pteam": {"native": "Int32Array", "offset": 56, "size": 4}, "ready": {"native": "Uint8Array", "offset": 96, "size": 1}, "revision": {"native": "Uint32Array", "offset": 129, "size": 4}, "smoothcamera": {"native": "Uint8Array", "offset": 91, "size": 1}, "user_name": {"length": 32, "native": "Uint8Array", "offset": 97, "size": 32}, "vote": {"native": "Uint8Array", "offset": 92, "size": 1}, "wchoice": {"length": 13, "native": "Uint8Array", "offset": 78, "size": 13}}, "overlaps": false, "size": 133, "union": false}, {}), 0).value).wchoice, 6, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(0) & 255)) & 255));
              ((cDeref(cPointerOffset((cPointerElementRef(cRecordPointer(g_player, {"align": 1, "arrayAlign": 1, "fields": {"frags": {"length": 16, "native": "Uint8Array", "offset": 62, "size": 16}, "gotvote": {"native": "Uint8Array", "offset": 93, "size": 1}, "horizAngleAdjust": {"native": "Int32Array", "offset": 32, "size": 4}, "horizRecenter": {"native": "Int32Array", "offset": 28, "size": 4}, "horizSkew": {"native": "Int32Array", "offset": 36, "size": 4}, "input": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"bits": {"native": "Uint32Array", "offset": 0, "size": 4}, "extbits": {"native": "Uint32Array", "offset": 16, "size": 4}, "fvel": {"native": "Int16Array", "offset": 4, "size": 2}, "q16avel": {"native": "Int32Array", "offset": 8, "size": 4}, "q16horz": {"native": "Int32Array", "offset": 12, "size": 4}, "svel": {"native": "Int16Array", "offset": 6, "size": 2}}, "overlaps": false, "size": 20, "union": false}, "offset": 8}, "lastViewUpdate": {"native": "BigUint64Array", "offset": 40, "size": 8}, "netsynctime": {"native": "Int32Array", "offset": 48, "size": 4}, "pcolor": {"native": "Int32Array", "offset": 52, "size": 4}, "ping": {"native": "Int16Array", "offset": 60, "size": 2}, "pingcnt": {"native": "Uint8Array", "offset": 94, "size": 1}, "playerquitflag": {"native": "Uint8Array", "offset": 95, "size": 1}, "ps": {"offset": 0, "pointer": true, "size": 8}, "pteam": {"native": "Int32Array", "offset": 56, "size": 4}, "ready": {"native": "Uint8Array", "offset": 96, "size": 1}, "revision": {"native": "Uint32Array", "offset": 129, "size": 4}, "smoothcamera": {"native": "Uint8Array", "offset": 91, "size": 1}, "user_name": {"length": 32, "native": "Uint8Array", "offset": 97, "size": 32}, "vote": {"native": "Uint8Array", "offset": 92, "size": 1}, "wchoice": {"length": 13, "native": "Uint8Array", "offset": 78, "size": 13}}, "overlaps": false, "size": 133, "union": false}, {}), 0).value).wchoice, 7, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(2) & 255)) & 255));
              ((cDeref(cPointerOffset((cPointerElementRef(cRecordPointer(g_player, {"align": 1, "arrayAlign": 1, "fields": {"frags": {"length": 16, "native": "Uint8Array", "offset": 62, "size": 16}, "gotvote": {"native": "Uint8Array", "offset": 93, "size": 1}, "horizAngleAdjust": {"native": "Int32Array", "offset": 32, "size": 4}, "horizRecenter": {"native": "Int32Array", "offset": 28, "size": 4}, "horizSkew": {"native": "Int32Array", "offset": 36, "size": 4}, "input": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"bits": {"native": "Uint32Array", "offset": 0, "size": 4}, "extbits": {"native": "Uint32Array", "offset": 16, "size": 4}, "fvel": {"native": "Int16Array", "offset": 4, "size": 2}, "q16avel": {"native": "Int32Array", "offset": 8, "size": 4}, "q16horz": {"native": "Int32Array", "offset": 12, "size": 4}, "svel": {"native": "Int16Array", "offset": 6, "size": 2}}, "overlaps": false, "size": 20, "union": false}, "offset": 8}, "lastViewUpdate": {"native": "BigUint64Array", "offset": 40, "size": 8}, "netsynctime": {"native": "Int32Array", "offset": 48, "size": 4}, "pcolor": {"native": "Int32Array", "offset": 52, "size": 4}, "ping": {"native": "Int16Array", "offset": 60, "size": 2}, "pingcnt": {"native": "Uint8Array", "offset": 94, "size": 1}, "playerquitflag": {"native": "Uint8Array", "offset": 95, "size": 1}, "ps": {"offset": 0, "pointer": true, "size": 8}, "pteam": {"native": "Int32Array", "offset": 56, "size": 4}, "ready": {"native": "Uint8Array", "offset": 96, "size": 1}, "revision": {"native": "Uint32Array", "offset": 129, "size": 4}, "smoothcamera": {"native": "Uint8Array", "offset": 91, "size": 1}, "user_name": {"length": 32, "native": "Uint8Array", "offset": 97, "size": 32}, "vote": {"native": "Uint8Array", "offset": 92, "size": 1}, "wchoice": {"length": 13, "native": "Uint8Array", "offset": 78, "size": 13}}, "overlaps": false, "size": 133, "union": false}, {}), 0).value).wchoice, 8, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(9) & 255)) & 255));
              ((cDeref(cPointerOffset((cPointerElementRef(cRecordPointer(g_player, {"align": 1, "arrayAlign": 1, "fields": {"frags": {"length": 16, "native": "Uint8Array", "offset": 62, "size": 16}, "gotvote": {"native": "Uint8Array", "offset": 93, "size": 1}, "horizAngleAdjust": {"native": "Int32Array", "offset": 32, "size": 4}, "horizRecenter": {"native": "Int32Array", "offset": 28, "size": 4}, "horizSkew": {"native": "Int32Array", "offset": 36, "size": 4}, "input": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"bits": {"native": "Uint32Array", "offset": 0, "size": 4}, "extbits": {"native": "Uint32Array", "offset": 16, "size": 4}, "fvel": {"native": "Int16Array", "offset": 4, "size": 2}, "q16avel": {"native": "Int32Array", "offset": 8, "size": 4}, "q16horz": {"native": "Int32Array", "offset": 12, "size": 4}, "svel": {"native": "Int16Array", "offset": 6, "size": 2}}, "overlaps": false, "size": 20, "union": false}, "offset": 8}, "lastViewUpdate": {"native": "BigUint64Array", "offset": 40, "size": 8}, "netsynctime": {"native": "Int32Array", "offset": 48, "size": 4}, "pcolor": {"native": "Int32Array", "offset": 52, "size": 4}, "ping": {"native": "Int16Array", "offset": 60, "size": 2}, "pingcnt": {"native": "Uint8Array", "offset": 94, "size": 1}, "playerquitflag": {"native": "Uint8Array", "offset": 95, "size": 1}, "ps": {"offset": 0, "pointer": true, "size": 8}, "pteam": {"native": "Int32Array", "offset": 56, "size": 4}, "ready": {"native": "Uint8Array", "offset": 96, "size": 1}, "revision": {"native": "Uint32Array", "offset": 129, "size": 4}, "smoothcamera": {"native": "Uint8Array", "offset": 91, "size": 1}, "user_name": {"length": 32, "native": "Uint8Array", "offset": 97, "size": 32}, "vote": {"native": "Uint8Array", "offset": 92, "size": 1}, "wchoice": {"length": 13, "native": "Uint8Array", "offset": 78, "size": 13}}, "overlaps": false, "size": 133, "union": false}, {}), 0).value).wchoice, 9, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(1) & 255)) & 255));
              sprintf(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.wchoice, __cxx_literal_b3482b1fb3baaff9ecae);
            }
            break;
          }
          case i32(118): {
            ((__cxx_lvalue_141) => { const previous = __cxx_lvalue_141.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_141.value = next; return previous; })(cRef(() => c, __cxx_lvalue_142 => { c = __cxx_lvalue_142; }));
          }
          (__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.warp_on = (u32((u32(1) & 255)) & 255));
          (__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.m_volume_number = i32((__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.volume_number = i32((u32(i32((atoi_safe__header_6849bd99ac50(c) - 1))) % u32(7))))));
          break;
          case i32(119): {
            (__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.coords = i32(1));
          }
          break;
          case i32(120): {
            ((__cxx_lvalue_143) => { const previous = __cxx_lvalue_143.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_143.value = next; return previous; })(cRef(() => c, __cxx_lvalue_144 => { c = __cxx_lvalue_144; }));
          }
          if (Boolean((cDeref(c, Uint8Array).value))) {
            G_AddCon(c);
          }
          break;
          case i32(122): {
            ((__cxx_lvalue_145) => { const previous = __cxx_lvalue_145.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_145.value = next; return previous; })(cRef(() => c, __cxx_lvalue_146 => { c = __cxx_lvalue_146; }));
          }
          (__cxx_global_cell_428952e2c5a589c67db10fcc().value = i32(atoi_safe__header_6849bd99ac50(c)));
          if ((!Boolean(__cxx_global_cell_428952e2c5a589c67db10fcc().value))) {
            (__cxx_global_cell_428952e2c5a589c67db10fcc().value = i32(1));
          }
          break;
          default: {
            (ignored_short_opt = i32(1));
          }
          break;
        }
      } else {
        (shortopt = i32(0));
        (k = strrchr(c, i32(46)));
        if (k) {
          if ((!Boolean(strcasecmp(k, __cxx_literal_a08d5a1c3cfd948a0c67)))) {
            (__cxx_global_cell_e9e7cdf79aac46339de9f120().value = (cPointerElementRef(argv, ((__cxx_lvalue_147) => { const previous = __cxx_lvalue_147.value; const next = i32((previous + 1)); __cxx_lvalue_147.value = next; return previous; })(cRef(() => i, __cxx_lvalue_148 => { i = __cxx_lvalue_148; }))).value));
            continue;
          }
          if (((((!Boolean(strcasecmp(k, __cxx_literal_c871cd6e253a5ea8b41b))) || (!Boolean(strcasecmp(k, __cxx_literal_4c76e369bb5d4a178917)))) || (!Boolean(strcasecmp(k, __cxx_literal_4e13664f4329cf34c88e)))) || (!Boolean(strcasecmp(k, __cxx_literal_9300766006e947a04785))))) {
            G_AddGroup((cPointerElementRef(argv, ((__cxx_lvalue_149) => { const previous = __cxx_lvalue_149.value; const next = i32((previous + 1)); __cxx_lvalue_149.value = next; return previous; })(cRef(() => i, __cxx_lvalue_150 => { i = __cxx_lvalue_150; }))).value));
            continue;
          }
          if ((!Boolean(strcasecmp(k, __cxx_literal_1c5bf15d7dfebcf04969)))) {
            clearScriptNamePtr();
            (__cxx_global_cell_fdd997c846b5c711252a3504().value = dup_filename__header_928249554f1f((cPointerElementRef(argv, ((__cxx_lvalue_151) => { const previous = __cxx_lvalue_151.value; const next = i32((previous + 1)); __cxx_lvalue_151.value = next; return previous; })(cRef(() => i, __cxx_lvalue_152 => { i = __cxx_lvalue_152; }))).value)));
            ((i32(0) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(0), __cxx_literal_4a1843b328d14ccb6537, u32(820), __cxx_literal_96c73b2538759e2f1bec, __cxx_global_cell_fdd997c846b5c711252a3504().value));
            continue;
          }
          if ((!Boolean(strcasecmp(k, __cxx_literal_4cfbcf9465bb97c16308)))) {
            clearDefNamePtr();
            (__cxx_global_cell_64336b74df686a41ba0b80a3().value = dup_filename__header_928249554f1f((cPointerElementRef(argv, ((__cxx_lvalue_153) => { const previous = __cxx_lvalue_153.value; const next = i32((previous + 1)); __cxx_lvalue_153.value = next; return previous; })(cRef(() => i, __cxx_lvalue_154 => { i = __cxx_lvalue_154; }))).value)));
            ((i32(0) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(0), __cxx_literal_fb11017495262ae353ca, u32(827), __cxx_literal_b918079e17f1d82872a7, __cxx_global_cell_64336b74df686a41ba0b80a3().value));
            continue;
          }
          if ((!Boolean(strcasecmp(k, __cxx_literal_7c8d65deae67799b9dc4)))) {
            xfree__header_fea841e23a87(__cxx_global_cell_41b93597aa1b675c52f24290().value);
            (__cxx_global_cell_41b93597aa1b675c52f24290().value = dup_filename__header_928249554f1f((cPointerElementRef(argv, ((__cxx_lvalue_155) => { const previous = __cxx_lvalue_155.value; const next = i32((previous + 1)); __cxx_lvalue_155.value = next; return previous; })(cRef(() => i, __cxx_lvalue_156 => { i = __cxx_lvalue_156; }))).value)));
            ((i32(0) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(0), __cxx_literal_bc9f5ad5ac55a7a99757, u32(834), __cxx_literal_fb4f7490747d7f02fff3, __cxx_global_cell_41b93597aa1b675c52f24290().value));
            continue;
          }
        }
      }
      if (((!Boolean(shortopt)) || Boolean(ignored_short_opt))) {
        ((i32(-1) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-1), __cxx_literal_04f840e2826e08402847, u32(841), __cxx_literal_866fcf4c32084da831c4, oc));
      }
      ((__cxx_lvalue_157) => { const previous = __cxx_lvalue_157.value; const next = i32((previous + 1)); __cxx_lvalue_157.value = next; return previous; })(cRef(() => i, __cxx_lvalue_158 => { i = __cxx_lvalue_158; }));
    } while ((i < argc));
  }
}

// C/C++ source: source/build/include/compat.h:1235
export function Bstrncpyz__header_ae7ba56a4fcd(dst, src, n) {
  if ((n > u64(0))) {
    memcpy(dst, src, (min__template_c237f4424e2bda8a(((__cxx_lvalue_0) => cRef(() => __cxx_lvalue_0, () => { throw new TypeError("const C++ reference write"); }))(u64((BigInt(strlen(src)) + BigInt(u64(1))))), ((__cxx_lvalue_1) => cRef(() => __cxx_lvalue_1, () => { throw new TypeError("const C++ reference write"); }))(u64((BigInt(n) - BigInt(u64(1))))))).value);
    ((cDeref(cPointerOffset(dst, u64((BigInt(n) - BigInt(u64(1)))), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32(0) & 255));
  }
  return dst;
}

export function clamp__header_c949a3c8072f(__cxx_in, min, max) {
  return i32(((__cxx_in <= i32(min)) ? i32(min) : ((__cxx_in >= i32(max)) ? i32(max) : __cxx_in)));
}

// C/C++ source: source/build/include/compat.h:1378
export function xstrdup__header_795d52f00e26(s) {
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

export function ARRAY_SIZE__header_84a9c9d1a773(arg0) {
  return u64(8192n);
}

// C/C++ source: source/build/include/compat.h:1367
export function engineDestroyAllocator__header_97a58392f84d() {
  Destroy__cxx_static_777d0ae31c789182(__cxx_global_cell_11016d3c7177543e564ab46c().value);
}

// C/C++ source: source/build/include/compat.h:698
export function atoi_safe__header_6849bd99ac50(str) {
  return i32(strtol(str, null, 10));
}

// C/C++ source: source/build/include/common.h:76
export function dup_filename__header_928249554f1f(fn) {
  let buf = cTypedPointer(xmalloc__header_d06663d597c6(u64(256)), Uint8Array);
  return Bstrncpyz__header_ae7ba56a4fcd(buf, fn, u64(256));
}

// C/C++ source: source/build/include/compat.h:1449
export function xfree__header_fea841e23a87(ptr) {
  Free__cxx_static_0dfd3f42f0dc2c05(__cxx_global_cell_11016d3c7177543e564ab46c().value, ptr);
}

export function clamp__header_710e9819e984(__cxx_in, min, max) {
  return i32(((__cxx_in <= i32(min)) ? i32(min) : ((__cxx_in >= i32(max)) ? i32(max) : __cxx_in)));
}

// C/C++ source: @sysroot/usr/include/c++/12/bits/stl_algobase.h:230
export function min__template_774131ccff66371d(__a, __b) {
  if ((__b.value < __a.value)) {
    return __b;
  }
  return __a;
}

// C/C++ source: @sysroot/usr/include/c++/12/bits/stl_algobase.h:230
export function min__template_c237f4424e2bda8a(__a, __b) {
  if ((__b.value < __a.value)) {
    return __b;
  }
  return __a;
}

// C/C++ source: source/build/include/compat.h:1392
export function xmalloc__header_d06663d597c6(size) {
  let ptr = Alloc__cxx_static_e0036cfb06bcfe42(__cxx_global_cell_11016d3c7177543e564ab46c().value, size, u64(16));
  if (cPointerCompare(ptr, null, "!=")) {
    return ptr;
  }
  handle_memerr(i32(size));
  __builtin_unreachable();
}
