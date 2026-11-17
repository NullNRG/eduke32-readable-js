// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/build/src/vfs.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
import { Alloc__cxx_static_e0036cfb06bcfe42 } from "./smmalloc_generic.cpp.mjs";
import { Bclosedir } from "./compat.cpp.mjs";
import { Bcorrectfilename } from "../../../browser-abi/libc_provider.mjs";
import { Bgetsystemdrives } from "./compat.cpp.mjs";
import { Bopendir } from "./compat.cpp.mjs";
import { Breaddir } from "./compat.cpp.mjs";
import { Bstrtolower } from "./compat.cpp.mjs";
import { Bstrupr } from "./compat.cpp.mjs";
import { Destroy__cxx_static_777d0ae31c789182 } from "./smmalloc_generic.cpp.mjs";
import { Free__cxx_static_0dfd3f42f0dc2c05 } from "./smmalloc_generic.cpp.mjs";
import { LZ4_compressBound } from "./lz4.c.mjs";
import { LZ4_compress_fast } from "./lz4.c.mjs";
import { LZ4_decompress_safe } from "./lz4.c.mjs";
import { Realloc__cxx_static_478d5da25b6b3923 } from "./smmalloc_generic.cpp.mjs";
import { __errno_location } from "../../../browser-abi/libc_provider.mjs";
import { close } from "../../../browser-abi/libc_provider.mjs";
import { __cxx_private_cell_614b4dff60c54bf98cd5634e } from "./vfs.cpp.mjs";
import { current_verbosity_cutoff } from "./loguru.cpp.mjs";
import { fclose } from "../../../browser-abi/libc_provider.mjs";
import { fdopen } from "../../../browser-abi/libc_provider.mjs";
import { __cxx_private_cell_3a9ab4328ffa236764eb60c3 } from "./vfs.cpp.mjs";
import { __cxx_private_cell_e58f38ca23a4c7031f169daa } from "./vfs.cpp.mjs";
import { __cxx_private_cell_e0923db928126267627d131f } from "./vfs.cpp.mjs";
import { __cxx_private_cell_0e6a8863bdc69dd261cf550b } from "./vfs.cpp.mjs";
import { fstat } from "../../../browser-abi/libc_provider.mjs";
import { fwrite } from "../../../browser-abi/libc_provider.mjs";
import { g_modDir } from "./vfs.cpp.mjs";
import { __cxx_global_cell_11016d3c7177543e564ab46c } from "./compat.cpp.mjs";
import { gfilelist } from "./vfs.cpp.mjs";
import { gfileoffs } from "./vfs.cpp.mjs";
import { __cxx_private_cell_40e26d32b6ca71fd78ad3b32 } from "./vfs.cpp.mjs";
import { __cxx_private_cell_b077455bc7a20cfc79ce2bba } from "./vfs.cpp.mjs";
import { __cxx_private_cell_22ad39b5d1fff4dd8ee9cb2a } from "./vfs.cpp.mjs";
import { __cxx_private_cell_d14239ea2126a8005fdc7edd } from "./vfs.cpp.mjs";
import { groupname } from "./vfs.cpp.mjs";
import { handle_memerr } from "./compat.cpp.mjs";
import { __cxx_global_cell_84bfc13188837cd8ad2617ac } from "./vfs.cpp.mjs";
import { __cxx_global_cell_82fc53700c75bce13e04b518 } from "./vfs.cpp.mjs";
import { kzaddstack } from "./kplib.cpp.mjs";
import { __cxx_private_cell_c51318c3fc474f17943c1125 } from "./vfs.cpp.mjs";
import { kzfindfile } from "./kplib.cpp.mjs";
import { kzfindfilestart } from "./kplib.cpp.mjs";
import { __cxx_global_cell_0c0d9a71eef382369e188fb4 } from "./kplib.cpp.mjs";
import { kzopen } from "./kplib.cpp.mjs";
import { kzread } from "./kplib.cpp.mjs";
import { kzseek } from "./kplib.cpp.mjs";
import { loguru_log } from "../../../browser-abi/loguru_provider.mjs";
import { lseek } from "../../../browser-abi/libc_provider.mjs";
import { __cxx_global_cell_2e953df8db08c3fc6f0c3e07 } from "./vfs.cpp.mjs";
import { __cxx_private_cell_bd28db781fd61f721b55fb90 } from "./vfs.cpp.mjs";
import { memcmp } from "../../../browser-abi/libc_provider.mjs";
import { memcpy } from "../../../browser-abi/libc_provider.mjs";
import { memset } from "../../../browser-abi/libc_provider.mjs";
import { __cxx_global_cell_92d90c06123336f9a13fd848 } from "./vfs.cpp.mjs";
import { open } from "../../../browser-abi/libc_provider.mjs";
import { __cxx_global_cell_787e3556986da6109d0447e0 } from "./vfs.cpp.mjs";
import { read } from "../../../browser-abi/libc_provider.mjs";
import { __cxx_private_cell_8b2fddc852cc4e1abb4ae8af } from "./vfs.cpp.mjs";
import { snprintf } from "../../../browser-abi/libc_provider.mjs";
import { stat } from "../../../browser-abi/libc_provider.mjs";
import { strcasecmp } from "../../../browser-abi/libc_provider.mjs";
import { strcat } from "../../../browser-abi/libc_provider.mjs";
import { strcmp } from "../../../browser-abi/libc_provider.mjs";
import { strcpy } from "../../../browser-abi/libc_provider.mjs";
import { strlen } from "../../../browser-abi/libc_provider.mjs";
import { strncmp } from "../../../browser-abi/libc_provider.mjs";
import { strncpy } from "../../../browser-abi/libc_provider.mjs";
import { toupperlookup } from "./vfs.cpp.mjs";
import { wildmatch } from "./kplib.cpp.mjs";

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
function i64(value) { return BigInt.asIntN(64, BigInt(value)); }
function u64(value) { return BigInt.asUintN(64, BigInt(value)); }


const clz64 = value => {let v=BigInt.asUintN(64,BigInt(value));if(v===0n)return 64;let n=0;while((v&(1n<<63n))===0n){v<<=1n;n++;}return n;};
const ctz64 = (value,width) => {let v=BigInt.asUintN(width,BigInt(value));if(v===0n)return width;let n=0;while((v&1n)===0n){v>>=1n;n++;}return n;};
const popcnt = value => {let v=value,n=0;while(v){v&=v-1n;n++;}return n;};

const __builtin_unreachable = () => { throw new Error("C++ undefined behavior: reached __builtin_unreachable"); };
// C/C++ source: source/build/src/vfs.cpp:48
export function kzipopen(filnam) {
  let i;
  let newst = cZeroAggregate({"array": "Uint8Array", "dims": [264]});
  ((cDeref(cPointerOffset(newst, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32(124) & 255));
  for ((i = u32(0)); ((i < u32(i32((256 + 4)))) && Boolean((cDeref(cPointerOffset(filnam, i, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value))); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = u32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; }))) {
    ((cDeref(cPointerOffset(newst, u32((i + u32(1))), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((cDeref(cPointerOffset(filnam, i, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
  }
  ((cDeref(cPointerOffset(newst, u32((i + u32(1))), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(0) & 255)) & 255));
  return i64(kzopen(newst));
}

// C/C++ source: source/build/src/vfs.cpp:64
export function kpzbufloadfil(handle) {
  let leng = i32(kfilelength(handle));
  if ((leng > __cxx_global_cell_82fc53700c75bce13e04b518().value)) {
    (__cxx_global_cell_84bfc13188837cd8ad2617ac().value = cTypedPointer(xrealloc__header_9fb083e4a075(__cxx_global_cell_84bfc13188837cd8ad2617ac().value, u64(i32((leng + 1)))), Uint8Array));
    (__cxx_global_cell_82fc53700c75bce13e04b518().value = i32(leng));
    if ((!__cxx_global_cell_84bfc13188837cd8ad2617ac().value)) {
      return i32(0);
    }
  }
  ((cDeref(cPointerOffset(__cxx_global_cell_84bfc13188837cd8ad2617ac().value, leng, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(0) & 255)) & 255));
  kread(handle, __cxx_global_cell_84bfc13188837cd8ad2617ac().value, leng);
  return i32(leng);
}

// C/C++ source: source/build/src/vfs.cpp:81
export function kpzbufload(filnam) {
  let handle = i32(kopen4load(filnam, (u32(0) & 255)));
  if ((handle == (-1))) {
    return i32(0);
  }
  let leng = i32(kpzbufloadfil(handle));
  kclose(handle);
  return i32(leng);
}

// C/C++ source: source/build/src/vfs.cpp:135
let __static_listsearchpath_sp = null;
export function listsearchpath(initp) {

  if (Boolean(initp)) {
    (__static_listsearchpath_sp = __cxx_private_cell_8b2fddc852cc4e1abb4ae8af().value);
  } else {
    if (cPointerCompare(__static_listsearchpath_sp, null, "!=")) {
      (__static_listsearchpath_sp = cRecordObject(cRecordPointer(__static_listsearchpath_sp, {"align": 8, "arrayAlign": 1, "fields": {"next": {"offset": 0, "pointer": true, "size": 8}, "path": {"offset": 8, "pointer": true, "size": 8}, "pathlen": {"native": "BigUint64Array", "offset": 16, "size": 8}, "user": {"native": "Int32Array", "offset": 24, "size": 4}}, "overlaps": false, "size": 32, "union": false}, {})).next);
    }
  }
  return (__static_listsearchpath_sp ? cRecordObject(cRecordPointer(__static_listsearchpath_sp, {"align": 8, "arrayAlign": 1, "fields": {"next": {"offset": 0, "pointer": true, "size": 8}, "path": {"offset": 8, "pointer": true, "size": 8}, "pathlen": {"native": "BigUint64Array", "offset": 16, "size": 8}, "user": {"native": "Int32Array", "offset": 24, "size": 4}}, "overlaps": false, "size": 32, "union": false}, {})).path : null);
}

// C/C++ source: source/build/src/vfs.cpp:147
const __cxx_literal_0368d5720abf35018d79 = Uint8Array.from([47, 0]);
const __cxx_literal_0cf6cbd231c7f124798f = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 118, 102, 115, 46, 99, 112, 112, 0]);
const __cxx_literal_f0db0da788838edbd851 = Uint8Array.from([85, 115, 105, 110, 103, 32, 100, 105, 114, 101, 99, 116, 111, 114, 121, 32, 37, 115, 0]);
export function addsearchpath_user(p, user) {
  let st = cZeroAggregate({"byteRecord": {"align": 8, "arrayAlign": 8, "fields": {"__glibc_reserved": {"length": 3, "native": "BigInt64Array", "offset": 120, "size": 24}, "__pad0": {"native": "Int32Array", "offset": 36, "size": 4}, "st_atim": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"tv_nsec": {"native": "BigInt64Array", "offset": 8, "size": 8}, "tv_sec": {"native": "BigInt64Array", "offset": 0, "size": 8}}, "overlaps": false, "size": 16, "union": false}, "offset": 72}, "st_blksize": {"native": "BigInt64Array", "offset": 56, "size": 8}, "st_blocks": {"native": "BigInt64Array", "offset": 64, "size": 8}, "st_ctim": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"tv_nsec": {"native": "BigInt64Array", "offset": 8, "size": 8}, "tv_sec": {"native": "BigInt64Array", "offset": 0, "size": 8}}, "overlaps": false, "size": 16, "union": false}, "offset": 104}, "st_dev": {"native": "BigUint64Array", "offset": 0, "size": 8}, "st_gid": {"native": "Uint32Array", "offset": 32, "size": 4}, "st_ino": {"native": "BigUint64Array", "offset": 8, "size": 8}, "st_mode": {"native": "Uint32Array", "offset": 24, "size": 4}, "st_mtim": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"tv_nsec": {"native": "BigInt64Array", "offset": 8, "size": 8}, "tv_sec": {"native": "BigInt64Array", "offset": 0, "size": 8}}, "overlaps": false, "size": 16, "union": false}, "offset": 88}, "st_nlink": {"native": "BigUint64Array", "offset": 16, "size": 8}, "st_rdev": {"native": "BigUint64Array", "offset": 40, "size": 8}, "st_size": {"native": "BigInt64Array", "offset": 48, "size": 8}, "st_uid": {"native": "Uint32Array", "offset": 28, "size": 4}}, "overlaps": false, "size": 144, "union": false}}, {});
  let s;
  let srch;
  let path = xstrdup__header_54caacf0b3b5(p);
  if ((i32((cDeref(cPointerOffset(path, u64((BigInt(strlen(path)) - BigInt(u64(1)))), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == i32(92))) {
    ((cDeref(cPointerOffset(path, u64((BigInt(strlen(path)) - BigInt(u64(1)))), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(0) & 255)) & 255));
  }
  if ((stat(path, st) < 0)) {
    xfree__header_13edfa973cd4(path);
    if (((cDeref(__errno_location(), Int32Array).value) == 2)) {
      return i32((-2));
    }
    return i32((-1));
  }
  if ((!Boolean(u32((st.st_mode & u32(16384)))))) {
    xfree__header_13edfa973cd4(path);
    return i32((-1));
  }
  (srch = cRecordPointer(xmalloc__header_74ee7b637863(32), {"align": 8, "arrayAlign": 1, "fields": {"next": {"offset": 0, "pointer": true, "size": 8}, "path": {"offset": 8, "pointer": true, "size": 8}, "pathlen": {"native": "BigUint64Array", "offset": 16, "size": 8}, "user": {"native": "Int32Array", "offset": 24, "size": 4}}, "overlaps": false, "size": 32, "union": false}, {}));
  (cRecordObject(cRecordPointer(srch, {"align": 8, "arrayAlign": 1, "fields": {"next": {"offset": 0, "pointer": true, "size": 8}, "path": {"offset": 8, "pointer": true, "size": 8}, "pathlen": {"native": "BigUint64Array", "offset": 16, "size": 8}, "user": {"native": "Int32Array", "offset": 24, "size": 4}}, "overlaps": false, "size": 32, "union": false}, {})).next = __cxx_private_cell_8b2fddc852cc4e1abb4ae8af().value);
  (cRecordObject(cRecordPointer(srch, {"align": 8, "arrayAlign": 1, "fields": {"next": {"offset": 0, "pointer": true, "size": 8}, "path": {"offset": 8, "pointer": true, "size": 8}, "pathlen": {"native": "BigUint64Array", "offset": 16, "size": 8}, "user": {"native": "Int32Array", "offset": 24, "size": 4}}, "overlaps": false, "size": 32, "union": false}, {})).pathlen = u64((BigInt(strlen(path)) + BigInt(u64(1)))));
  (cRecordObject(cRecordPointer(srch, {"align": 8, "arrayAlign": 1, "fields": {"next": {"offset": 0, "pointer": true, "size": 8}, "path": {"offset": 8, "pointer": true, "size": 8}, "pathlen": {"native": "BigUint64Array", "offset": 16, "size": 8}, "user": {"native": "Int32Array", "offset": 24, "size": 4}}, "overlaps": false, "size": 32, "union": false}, {})).path = cTypedPointer(xmalloc__header_74ee7b637863(u64((BigInt(cRecordObject(cRecordPointer(srch, {"align": 8, "arrayAlign": 1, "fields": {"next": {"offset": 0, "pointer": true, "size": 8}, "path": {"offset": 8, "pointer": true, "size": 8}, "pathlen": {"native": "BigUint64Array", "offset": 16, "size": 8}, "user": {"native": "Int32Array", "offset": 24, "size": 4}}, "overlaps": false, "size": 32, "union": false}, {})).pathlen) + BigInt(u64(1))))), Uint8Array));
  strcpy(cRecordObject(cRecordPointer(srch, {"align": 8, "arrayAlign": 1, "fields": {"next": {"offset": 0, "pointer": true, "size": 8}, "path": {"offset": 8, "pointer": true, "size": 8}, "pathlen": {"native": "BigUint64Array", "offset": 16, "size": 8}, "user": {"native": "Int32Array", "offset": 24, "size": 4}}, "overlaps": false, "size": 32, "union": false}, {})).path, path);
  for ((s = cRecordObject(cRecordPointer(srch, {"align": 8, "arrayAlign": 1, "fields": {"next": {"offset": 0, "pointer": true, "size": 8}, "path": {"offset": 8, "pointer": true, "size": 8}, "pathlen": {"native": "BigUint64Array", "offset": 16, "size": 8}, "user": {"native": "Int32Array", "offset": 24, "size": 4}}, "overlaps": false, "size": 32, "union": false}, {})).path); Boolean((cDeref(s, Uint8Array).value)); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_0.value = next; return previous; })(cRef(() => s, __cxx_lvalue_1 => { s = __cxx_lvalue_1; }))) {

  }
  ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = cPointerOffset(previous, -1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_2.value = next; return previous; })(cRef(() => s, __cxx_lvalue_3 => { s = __cxx_lvalue_3; }));
  if ((cPointerCompare(s, cRecordObject(cRecordPointer(srch, {"align": 8, "arrayAlign": 1, "fields": {"next": {"offset": 0, "pointer": true, "size": 8}, "path": {"offset": 8, "pointer": true, "size": 8}, "pathlen": {"native": "BigUint64Array", "offset": 16, "size": 8}, "user": {"native": "Int32Array", "offset": 24, "size": 4}}, "overlaps": false, "size": 32, "union": false}, {})).path, "<") || (i32((cDeref(cPointerOffset(toupperlookup, (cDeref(s, Uint8Array).value), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) != i32(47)))) {
    strcat(cRecordObject(cRecordPointer(srch, {"align": 8, "arrayAlign": 1, "fields": {"next": {"offset": 0, "pointer": true, "size": 8}, "path": {"offset": 8, "pointer": true, "size": 8}, "pathlen": {"native": "BigUint64Array", "offset": 16, "size": 8}, "user": {"native": "Int32Array", "offset": 24, "size": 4}}, "overlaps": false, "size": 32, "union": false}, {})).path, __cxx_literal_0368d5720abf35018d79);
  }
  (__cxx_private_cell_8b2fddc852cc4e1abb4ae8af().value = srch);
  if ((cRecordObject(cRecordPointer(srch, {"align": 8, "arrayAlign": 1, "fields": {"next": {"offset": 0, "pointer": true, "size": 8}, "path": {"offset": 8, "pointer": true, "size": 8}, "pathlen": {"native": "BigUint64Array", "offset": 16, "size": 8}, "user": {"native": "Int32Array", "offset": 24, "size": 4}}, "overlaps": false, "size": 32, "union": false}, {})).pathlen > __cxx_private_cell_bd28db781fd61f721b55fb90().value)) {
    (__cxx_private_cell_bd28db781fd61f721b55fb90().value = u64(cRecordObject(cRecordPointer(srch, {"align": 8, "arrayAlign": 1, "fields": {"next": {"offset": 0, "pointer": true, "size": 8}, "path": {"offset": 8, "pointer": true, "size": 8}, "pathlen": {"native": "BigUint64Array", "offset": 16, "size": 8}, "user": {"native": "Int32Array", "offset": 24, "size": 4}}, "overlaps": false, "size": 32, "union": false}, {})).pathlen));
  }
  Bcorrectfilename(cRecordObject(cRecordPointer(srch, {"align": 8, "arrayAlign": 1, "fields": {"next": {"offset": 0, "pointer": true, "size": 8}, "path": {"offset": 8, "pointer": true, "size": 8}, "pathlen": {"native": "BigUint64Array", "offset": 16, "size": 8}, "user": {"native": "Int32Array", "offset": 24, "size": 4}}, "overlaps": false, "size": 32, "union": false}, {})).path, 0);
  (cRecordObject(cRecordPointer(srch, {"align": 8, "arrayAlign": 1, "fields": {"next": {"offset": 0, "pointer": true, "size": 8}, "path": {"offset": 8, "pointer": true, "size": 8}, "pathlen": {"native": "BigUint64Array", "offset": 16, "size": 8}, "user": {"native": "Int32Array", "offset": 24, "size": 4}}, "overlaps": false, "size": 32, "union": false}, {})).user = i32(user));
  ((i32(0) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(0), __cxx_literal_0cf6cbd231c7f124798f, u32(190), __cxx_literal_f0db0da788838edbd851, cRecordObject(cRecordPointer(srch, {"align": 8, "arrayAlign": 1, "fields": {"next": {"offset": 0, "pointer": true, "size": 8}, "path": {"offset": 8, "pointer": true, "size": 8}, "pathlen": {"native": "BigUint64Array", "offset": 16, "size": 8}, "user": {"native": "Int32Array", "offset": 24, "size": 4}}, "overlaps": false, "size": 32, "union": false}, {})).path));
  xfree__header_13edfa973cd4(path);
  return i32(0);
}

// C/C++ source: source/build/src/vfs.cpp:196
const __cxx_literal_82dcf0609b49a165428b = Uint8Array.from([47, 0]);
const __cxx_literal_e41b7c53216f6c9a4dcc = Uint8Array.from([82, 101, 109, 111, 118, 105, 110, 103, 32, 100, 105, 114, 101, 99, 116, 111, 114, 121, 32, 37, 115, 32, 102, 114, 111, 109, 32, 115, 101, 97, 114, 99, 104, 32, 112, 97, 116, 104, 115, 0]);
export function removesearchpath(p) {
  let srch;
  let s;
  let path = cTypedPointer(xmalloc__header_74ee7b637863(u64((BigInt(strlen(p)) + BigInt(u64(2))))), Uint8Array);
  const __cxx_lvalue_0 = cRef(() => path, __cxx_lvalue_1 => { path = __cxx_lvalue_1; });
  strcpy(path, p);
  if ((i32((cDeref(cPointerOffset(path, u64((BigInt(strlen(path)) - BigInt(u64(1)))), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == i32(92))) {
    ((cDeref(cPointerOffset(path, u64((BigInt(strlen(path)) - BigInt(u64(1)))), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(0) & 255)) & 255));
  }
  for ((s = path); Boolean((cDeref(s, Uint8Array).value)); ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_2.value = next; return previous; })(cRef(() => s, __cxx_lvalue_3 => { s = __cxx_lvalue_3; }))) {

  }
  ((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = cPointerOffset(previous, -1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_4.value = next; return previous; })(cRef(() => s, __cxx_lvalue_5 => { s = __cxx_lvalue_5; }));
  if ((cPointerCompare(s, path, "<") || (i32((cDeref(cPointerOffset(toupperlookup, (cDeref(s, Uint8Array).value), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) != i32(47)))) {
    strcat(path, __cxx_literal_82dcf0609b49a165428b);
  }
  Bcorrectfilename(path, 0);
  for ((srch = __cxx_private_cell_8b2fddc852cc4e1abb4ae8af().value); srch; (srch = cRecordObject(cRecordPointer(srch, {"align": 8, "arrayAlign": 1, "fields": {"next": {"offset": 0, "pointer": true, "size": 8}, "path": {"offset": 8, "pointer": true, "size": 8}, "pathlen": {"native": "BigUint64Array", "offset": 16, "size": 8}, "user": {"native": "Int32Array", "offset": 24, "size": 4}}, "overlaps": false, "size": 32, "union": false}, {})).next)) {
    if ((!Boolean(strncmp(path, cRecordObject(cRecordPointer(srch, {"align": 8, "arrayAlign": 1, "fields": {"next": {"offset": 0, "pointer": true, "size": 8}, "path": {"offset": 8, "pointer": true, "size": 8}, "pathlen": {"native": "BigUint64Array", "offset": 16, "size": 8}, "user": {"native": "Int32Array", "offset": 24, "size": 4}}, "overlaps": false, "size": 32, "union": false}, {})).path, cRecordObject(cRecordPointer(srch, {"align": 8, "arrayAlign": 1, "fields": {"next": {"offset": 0, "pointer": true, "size": 8}, "path": {"offset": 8, "pointer": true, "size": 8}, "pathlen": {"native": "BigUint64Array", "offset": 16, "size": 8}, "user": {"native": "Int32Array", "offset": 24, "size": 4}}, "overlaps": false, "size": 32, "union": false}, {})).pathlen)))) {
      do {
        SILENCE_UNUSED__header_5119f34568fc(__cxx_literal_e41b7c53216f6c9a4dcc, __cxx_lvalue_0);
      } while (Boolean(0));
      if (cPointerCompare(srch, __cxx_private_cell_8b2fddc852cc4e1abb4ae8af().value, "==")) {
        (__cxx_private_cell_8b2fddc852cc4e1abb4ae8af().value = cRecordObject(cRecordPointer(srch, {"align": 8, "arrayAlign": 1, "fields": {"next": {"offset": 0, "pointer": true, "size": 8}, "path": {"offset": 8, "pointer": true, "size": 8}, "pathlen": {"native": "BigUint64Array", "offset": 16, "size": 8}, "user": {"native": "Int32Array", "offset": 24, "size": 4}}, "overlaps": false, "size": 32, "union": false}, {})).next);
      } else {
        let sp;
        for ((sp = __cxx_private_cell_8b2fddc852cc4e1abb4ae8af().value); sp; (sp = cRecordObject(cRecordPointer(sp, {"align": 8, "arrayAlign": 1, "fields": {"next": {"offset": 0, "pointer": true, "size": 8}, "path": {"offset": 8, "pointer": true, "size": 8}, "pathlen": {"native": "BigUint64Array", "offset": 16, "size": 8}, "user": {"native": "Int32Array", "offset": 24, "size": 4}}, "overlaps": false, "size": 32, "union": false}, {})).next)) {
          if (cPointerCompare(cRecordObject(cRecordPointer(sp, {"align": 8, "arrayAlign": 1, "fields": {"next": {"offset": 0, "pointer": true, "size": 8}, "path": {"offset": 8, "pointer": true, "size": 8}, "pathlen": {"native": "BigUint64Array", "offset": 16, "size": 8}, "user": {"native": "Int32Array", "offset": 24, "size": 4}}, "overlaps": false, "size": 32, "union": false}, {})).next, srch, "==")) {
            (cRecordObject(cRecordPointer(sp, {"align": 8, "arrayAlign": 1, "fields": {"next": {"offset": 0, "pointer": true, "size": 8}, "path": {"offset": 8, "pointer": true, "size": 8}, "pathlen": {"native": "BigUint64Array", "offset": 16, "size": 8}, "user": {"native": "Int32Array", "offset": 24, "size": 4}}, "overlaps": false, "size": 32, "union": false}, {})).next = cRecordObject(cRecordPointer(srch, {"align": 8, "arrayAlign": 1, "fields": {"next": {"offset": 0, "pointer": true, "size": 8}, "path": {"offset": 8, "pointer": true, "size": 8}, "pathlen": {"native": "BigUint64Array", "offset": 16, "size": 8}, "user": {"native": "Int32Array", "offset": 24, "size": 4}}, "overlaps": false, "size": 32, "union": false}, {})).next);
            break;
          }
        }
      }
      xfree__header_13edfa973cd4(cRecordObject(cRecordPointer(srch, {"align": 8, "arrayAlign": 1, "fields": {"next": {"offset": 0, "pointer": true, "size": 8}, "path": {"offset": 8, "pointer": true, "size": 8}, "pathlen": {"native": "BigUint64Array", "offset": 16, "size": 8}, "user": {"native": "Int32Array", "offset": 24, "size": 4}}, "overlaps": false, "size": 32, "union": false}, {})).path);
      xfree__header_13edfa973cd4(srch);
      break;
    }
  }
  xfree__header_13edfa973cd4(path);
  return i32(0);
}

// C/C++ source: source/build/src/vfs.cpp:247
export function removesearchpaths_withuser(usermask) {
  let next;
  for (let srch = __cxx_private_cell_8b2fddc852cc4e1abb4ae8af().value; srch; (srch = next)) {
    (next = cRecordObject(cRecordPointer(srch, {"align": 8, "arrayAlign": 1, "fields": {"next": {"offset": 0, "pointer": true, "size": 8}, "path": {"offset": 8, "pointer": true, "size": 8}, "pathlen": {"native": "BigUint64Array", "offset": 16, "size": 8}, "user": {"native": "Int32Array", "offset": 24, "size": 4}}, "overlaps": false, "size": 32, "union": false}, {})).next);
    if (Boolean(i32((cRecordObject(cRecordPointer(srch, {"align": 8, "arrayAlign": 1, "fields": {"next": {"offset": 0, "pointer": true, "size": 8}, "path": {"offset": 8, "pointer": true, "size": 8}, "pathlen": {"native": "BigUint64Array", "offset": 16, "size": 8}, "user": {"native": "Int32Array", "offset": 24, "size": 4}}, "overlaps": false, "size": 32, "union": false}, {})).user & usermask)))) {
      if (cPointerCompare(srch, __cxx_private_cell_8b2fddc852cc4e1abb4ae8af().value, "==")) {
        (__cxx_private_cell_8b2fddc852cc4e1abb4ae8af().value = cRecordObject(cRecordPointer(srch, {"align": 8, "arrayAlign": 1, "fields": {"next": {"offset": 0, "pointer": true, "size": 8}, "path": {"offset": 8, "pointer": true, "size": 8}, "pathlen": {"native": "BigUint64Array", "offset": 16, "size": 8}, "user": {"native": "Int32Array", "offset": 24, "size": 4}}, "overlaps": false, "size": 32, "union": false}, {})).next);
      } else {
        let sp;
        for ((sp = __cxx_private_cell_8b2fddc852cc4e1abb4ae8af().value); sp; (sp = cRecordObject(cRecordPointer(sp, {"align": 8, "arrayAlign": 1, "fields": {"next": {"offset": 0, "pointer": true, "size": 8}, "path": {"offset": 8, "pointer": true, "size": 8}, "pathlen": {"native": "BigUint64Array", "offset": 16, "size": 8}, "user": {"native": "Int32Array", "offset": 24, "size": 4}}, "overlaps": false, "size": 32, "union": false}, {})).next)) {
          if (cPointerCompare(cRecordObject(cRecordPointer(sp, {"align": 8, "arrayAlign": 1, "fields": {"next": {"offset": 0, "pointer": true, "size": 8}, "path": {"offset": 8, "pointer": true, "size": 8}, "pathlen": {"native": "BigUint64Array", "offset": 16, "size": 8}, "user": {"native": "Int32Array", "offset": 24, "size": 4}}, "overlaps": false, "size": 32, "union": false}, {})).next, srch, "==")) {
            (cRecordObject(cRecordPointer(sp, {"align": 8, "arrayAlign": 1, "fields": {"next": {"offset": 0, "pointer": true, "size": 8}, "path": {"offset": 8, "pointer": true, "size": 8}, "pathlen": {"native": "BigUint64Array", "offset": 16, "size": 8}, "user": {"native": "Int32Array", "offset": 24, "size": 4}}, "overlaps": false, "size": 32, "union": false}, {})).next = cRecordObject(cRecordPointer(srch, {"align": 8, "arrayAlign": 1, "fields": {"next": {"offset": 0, "pointer": true, "size": 8}, "path": {"offset": 8, "pointer": true, "size": 8}, "pathlen": {"native": "BigUint64Array", "offset": 16, "size": 8}, "user": {"native": "Int32Array", "offset": 24, "size": 4}}, "overlaps": false, "size": 32, "union": false}, {})).next);
            break;
          }
        }
      }
      xfree__header_13edfa973cd4(cRecordObject(cRecordPointer(srch, {"align": 8, "arrayAlign": 1, "fields": {"next": {"offset": 0, "pointer": true, "size": 8}, "path": {"offset": 8, "pointer": true, "size": 8}, "pathlen": {"native": "BigUint64Array", "offset": 16, "size": 8}, "user": {"native": "Int32Array", "offset": 24, "size": 4}}, "overlaps": false, "size": 32, "union": false}, {})).path);
      xfree__header_13edfa973cd4(srch);
    }
  }
}

// C/C++ source: source/build/src/vfs.cpp:280
const __cxx_literal_e2b37721af2f86e10ff4 = Uint8Array.from([46, 47, 0]);
export function findfrompath(fn, where) {
  if (((!fn) || (!Boolean((cDeref(cPointerOffset(fn, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value))))) {
    return i32((-1));
  }
  if (Boolean(__cxx_global_cell_787e3556986da6109d0447e0().value)) {
    if (Boolean(buildvfs_exists__header_a5d5ccb242c5(fn))) {
      ((cPointerElementRef(where, 0).value) = xstrdup__header_54caacf0b3b5(fn));
      return i32(0);
    } else {
      let tfn = Bstrtolower(xstrdup__header_54caacf0b3b5(fn));
      if (Boolean(buildvfs_exists__header_a5d5ccb242c5(tfn))) {
        ((cPointerElementRef(where, 0).value) = tfn);
        return i32(0);
      }
      Bstrupr(tfn);
      if (Boolean(buildvfs_exists__header_a5d5ccb242c5(tfn))) {
        ((cPointerElementRef(where, 0).value) = tfn);
        return i32(0);
      }
      xfree__header_13edfa973cd4(tfn);
    }
  }
  let cpfn;
  for ((cpfn = fn); (i32((cDeref(cPointerOffset(toupperlookup, (cDeref(cpfn, Uint8Array).value), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == i32(47)); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_0.value = next; return previous; })(cRef(() => cpfn, __cxx_lvalue_1 => { cpfn = __cxx_lvalue_1; }))) {

  }
  let ffn = xstrdup__header_54caacf0b3b5(cpfn);
  Bcorrectfilename(ffn, 0);
  let allocsiz = i32((max__template_b1cfaf2244c73238(((__cxx_lvalue_2) => cRef(() => __cxx_lvalue_2, () => { throw new TypeError("const C++ reference write"); }))(i32(__cxx_private_cell_bd28db781fd61f721b55fb90().value)), ((__cxx_lvalue_3) => cRef(() => __cxx_lvalue_3, () => { throw new TypeError("const C++ reference write"); }))(2))).value);
  (allocsiz = i32((Number(allocsiz) + Number(strlen(ffn)))));
  (allocsiz = i32((Number(allocsiz) + Number(1))));
  let pfn = cTypedPointer(xmalloc__header_74ee7b637863(u64(allocsiz)), Uint8Array);
  strcpy(pfn, __cxx_literal_e2b37721af2f86e10ff4);
  strcat(pfn, ffn);
  if (Boolean(buildvfs_exists__header_a5d5ccb242c5(pfn))) {
    ((cPointerElementRef(where, 0).value) = pfn);
    xfree__header_13edfa973cd4(ffn);
    return i32(0);
  }
  for (let sp = __cxx_private_cell_8b2fddc852cc4e1abb4ae8af().value; sp; (sp = cRecordObject(cRecordPointer(sp, {"align": 8, "arrayAlign": 1, "fields": {"next": {"offset": 0, "pointer": true, "size": 8}, "path": {"offset": 8, "pointer": true, "size": 8}, "pathlen": {"native": "BigUint64Array", "offset": 16, "size": 8}, "user": {"native": "Int32Array", "offset": 24, "size": 4}}, "overlaps": false, "size": 32, "union": false}, {})).next)) {
    let tfn = xstrdup__header_54caacf0b3b5(ffn);
    strcpy(pfn, cRecordObject(cRecordPointer(sp, {"align": 8, "arrayAlign": 1, "fields": {"next": {"offset": 0, "pointer": true, "size": 8}, "path": {"offset": 8, "pointer": true, "size": 8}, "pathlen": {"native": "BigUint64Array", "offset": 16, "size": 8}, "user": {"native": "Int32Array", "offset": 24, "size": 4}}, "overlaps": false, "size": 32, "union": false}, {})).path);
    strcat(pfn, ffn);
    if (Boolean(buildvfs_exists__header_a5d5ccb242c5(pfn))) {
      ((cPointerElementRef(where, 0).value) = pfn);
      xfree__header_13edfa973cd4(ffn);
      xfree__header_13edfa973cd4(tfn);
      return i32(0);
    }
    strcpy(pfn, cRecordObject(cRecordPointer(sp, {"align": 8, "arrayAlign": 1, "fields": {"next": {"offset": 0, "pointer": true, "size": 8}, "path": {"offset": 8, "pointer": true, "size": 8}, "pathlen": {"native": "BigUint64Array", "offset": 16, "size": 8}, "user": {"native": "Int32Array", "offset": 24, "size": 4}}, "overlaps": false, "size": 32, "union": false}, {})).path);
    Bstrtolower(tfn);
    strcat(pfn, tfn);
    if (Boolean(buildvfs_exists__header_a5d5ccb242c5(pfn))) {
      ((cPointerElementRef(where, 0).value) = pfn);
      xfree__header_13edfa973cd4(ffn);
      xfree__header_13edfa973cd4(tfn);
      return i32(0);
    }
    strcpy(pfn, cRecordObject(cRecordPointer(sp, {"align": 8, "arrayAlign": 1, "fields": {"next": {"offset": 0, "pointer": true, "size": 8}, "path": {"offset": 8, "pointer": true, "size": 8}, "pathlen": {"native": "BigUint64Array", "offset": 16, "size": 8}, "user": {"native": "Int32Array", "offset": 24, "size": 4}}, "overlaps": false, "size": 32, "union": false}, {})).path);
    Bstrupr(tfn);
    strcat(pfn, tfn);
    if (Boolean(buildvfs_exists__header_a5d5ccb242c5(pfn))) {
      ((cPointerElementRef(where, 0).value) = pfn);
      xfree__header_13edfa973cd4(ffn);
      xfree__header_13edfa973cd4(tfn);
      return i32(0);
    }
    xfree__header_13edfa973cd4(tfn);
  }
  xfree__header_13edfa973cd4(pfn);
  xfree__header_13edfa973cd4(ffn);
  return i32((-1));
}

// C/C++ source: source/build/src/vfs.cpp:394
export function openfrompath_internal(fn, where, flags, mode) {
  if ((findfrompath(fn, where) < 0)) {
    return (-1);
  }
  return open((cPointerElementRef(where, 0).value), flags, mode);
}

// C/C++ source: source/build/src/vfs.cpp:402
export function openfrompath(fn, flags, mode) {
  let pfn = null;
  const __cxx_lvalue_0 = cRef(() => pfn, __cxx_lvalue_1 => { pfn = __cxx_lvalue_1; });
  let h = i32(openfrompath_internal(fn, __cxx_lvalue_0, flags, mode));
  xfree__header_13edfa973cd4(pfn);
  return h;
}

// C/C++ source: source/build/src/vfs.cpp:413
export function fopenfrompath(fn, mode) {
  let fh;
  let h;
  let bmode = i32(0);
  let smode = i32(0);
  let c;
  for ((c = mode); Boolean((cDeref(cPointerOffset(c, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)); ) {
    if (((i32((cDeref(cPointerOffset(c, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == i32(114)) && (i32((cDeref(cPointerOffset(c, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == i32(43)))) {
      (bmode = i32(2));
      (smode = i32((256 | 128)));
      (c = cPointerOffset(c, 2, Uint8Array.BYTES_PER_ELEMENT));
    } else {
      if ((i32((cDeref(cPointerOffset(c, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == i32(114))) {
        (bmode = i32(0));
        (smode = i32(256));
        (c = cPointerOffset(c, 1, Uint8Array.BYTES_PER_ELEMENT));
      } else {
        if (((i32((cDeref(cPointerOffset(c, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == i32(119)) && (i32((cDeref(cPointerOffset(c, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == i32(43)))) {
          (bmode = i32((i32((2 | 64)) | 512)));
          (smode = i32((256 | 128)));
          (c = cPointerOffset(c, 2, Uint8Array.BYTES_PER_ELEMENT));
        } else {
          if ((i32((cDeref(cPointerOffset(c, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == i32(119))) {
            (bmode = i32((i32((1 | 64)) | 512)));
            (smode = i32((256 | 128)));
            (c = cPointerOffset(c, 2, Uint8Array.BYTES_PER_ELEMENT));
          } else {
            if (((i32((cDeref(cPointerOffset(c, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == i32(97)) && (i32((cDeref(cPointerOffset(c, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == i32(43)))) {
              (bmode = i32((2 | 64)));
              (smode = i32((256 | 128)));
              (c = cPointerOffset(c, 2, Uint8Array.BYTES_PER_ELEMENT));
            } else {
              if ((i32((cDeref(cPointerOffset(c, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == i32(97))) {
                (bmode = i32((1 | 64)));
                (smode = i32((256 | 128)));
                (c = cPointerOffset(c, 1, Uint8Array.BYTES_PER_ELEMENT));
              } else {
                if ((i32((cDeref(cPointerOffset(c, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == i32(98))) {
                  (bmode = i32((bmode | 0)));
                  (c = cPointerOffset(c, 1, Uint8Array.BYTES_PER_ELEMENT));
                } else {
                  if ((i32((cDeref(cPointerOffset(c, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == i32(116))) {
                    (bmode = i32((bmode | 0)));
                    (c = cPointerOffset(c, 1, Uint8Array.BYTES_PER_ELEMENT));
                  } else {
                    ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_0.value = next; return previous; })(cRef(() => c, __cxx_lvalue_1 => { c = __cxx_lvalue_1; }));
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  (fh = i32(openfrompath(fn, bmode, smode)));
  if ((fh < 0)) {
    return null;
  }
  (h = fdopen(fh, mode));
  if ((!h)) {
    close(fh);
  }
  return h;
}

// C/C++ source: source/build/src/vfs.cpp:476
export function cache1d_file_fromzip(fil) {
  return i32((i32((cDeref(cPointerOffset(__cxx_private_cell_3a9ab4328ffa236764eb60c3().value, fil, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == i32(254)));
}

// C/C++ source: source/build/src/vfs.cpp:487
const __cxx_literal_d4eaadae076acf11f6b1 = Uint8Array.from([75, 101, 110, 83, 105, 108, 118, 101, 114, 109, 97, 110, 0]);
export function initgroupfile(filename) {
  let buf = cZeroAggregate({"array": "Uint8Array", "dims": [70]});
  ((cDeref(cPointerOffset(toupperlookup, 92, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(47) & 255)) & 255));
  if (cPointerCompare(filename, null, "==")) {
    return i32((-1));
  }
  if ((__cxx_global_cell_92d90c06123336f9a13fd848().value >= 8)) {
    return i32((-1));
  }
  let zfn = null;
  const __cxx_lvalue_0 = cRef(() => zfn, __cxx_lvalue_5 => { zfn = __cxx_lvalue_5; });
  if ((kopen_internal(filename, __cxx_lvalue_0, (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), __cxx_global_cell_92d90c06123336f9a13fd848().value, __cxx_private_cell_22ad39b5d1fff4dd8ee9cb2a().value, __cxx_private_cell_b077455bc7a20cfc79ce2bba().value, __cxx_private_cell_d14239ea2126a8005fdc7edd().value) < 0)) {
    return i32((-1));
  }
  if (zfn) {
    kread_grp(__cxx_global_cell_92d90c06123336f9a13fd848().value, buf, 4);
    if (((((i32((cDeref(cPointerOffset(buf, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == 80) && (i32((cDeref(cPointerOffset(buf, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == 75)) && (i32((cDeref(cPointerOffset(buf, 2, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == 3)) && (i32((cDeref(cPointerOffset(buf, 3, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == 4))) {
      kclose_grp(__cxx_global_cell_92d90c06123336f9a13fd848().value);
      kzaddstack(zfn);
      xfree__header_13edfa973cd4(zfn);
      return i32(8);
    }
    klseek_grp(__cxx_global_cell_92d90c06123336f9a13fd848().value, 0, 0);
    xfree__header_13edfa973cd4(zfn);
  }
  kread_grp(__cxx_global_cell_92d90c06123336f9a13fd848().value, buf, 16);
  if ((!Boolean(memcmp(buf, __cxx_literal_d4eaadae076acf11f6b1, u64(12))))) {
    ((cDeref(cPointerOffset(__cxx_private_cell_40e26d32b6ca71fd78ad3b32().value, __cxx_global_cell_92d90c06123336f9a13fd848().value, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(B_PASS32__header_416cc10abcf4((cDeref(cTypedPointer(cPointerOffset(buf, 12, Uint8Array.BYTES_PER_ELEMENT), Int32Array), Int32Array).value))));
    ((cPointerElementRef(gfilelist, __cxx_global_cell_92d90c06123336f9a13fd848().value).value) = cTypedPointer(xmalloc__header_74ee7b637863(u64(i32(((cDeref(cPointerOffset(__cxx_private_cell_40e26d32b6ca71fd78ad3b32().value, __cxx_global_cell_92d90c06123336f9a13fd848().value, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) << 4)))), Uint8Array));
    ((cPointerElementRef(gfileoffs, __cxx_global_cell_92d90c06123336f9a13fd848().value).value) = cTypedPointer(xmalloc__header_74ee7b637863(u64(i32((i32(((cDeref(cPointerOffset(__cxx_private_cell_40e26d32b6ca71fd78ad3b32().value, __cxx_global_cell_92d90c06123336f9a13fd848().value, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) + 1)) << 2)))), Int32Array));
    kread_grp(__cxx_global_cell_92d90c06123336f9a13fd848().value, (cPointerElementRef(gfilelist, __cxx_global_cell_92d90c06123336f9a13fd848().value).value), i32(((cDeref(cPointerOffset(__cxx_private_cell_40e26d32b6ca71fd78ad3b32().value, __cxx_global_cell_92d90c06123336f9a13fd848().value, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) << 4)));
    let j = i32((i32(((cDeref(cPointerOffset(__cxx_private_cell_40e26d32b6ca71fd78ad3b32().value, __cxx_global_cell_92d90c06123336f9a13fd848().value, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) + 1)) << 4));
    for (let i = i64(0); (i < i64((cDeref(cPointerOffset(__cxx_private_cell_40e26d32b6ca71fd78ad3b32().value, __cxx_global_cell_92d90c06123336f9a13fd848().value, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))); ((__cxx_lvalue_6) => { const previous = __cxx_lvalue_6.value; const next = i64((previous + 1n)); __cxx_lvalue_6.value = next; return previous; })(cRef(() => i, __cxx_lvalue_7 => { i = __cxx_lvalue_7; }))) {
      let k = i32(B_PASS32__header_416cc10abcf4((cDeref(cTypedPointer(cPointerOffset((cPointerElementRef(gfilelist, __cxx_global_cell_92d90c06123336f9a13fd848().value).value), i64((BigInt(i64((BigInt(i) << BigInt(4)))) + BigInt(i64(12)))), Uint8Array.BYTES_PER_ELEMENT), Int32Array), Int32Array).value)));
      ((cDeref(cPointerOffset((cPointerElementRef(gfilelist, __cxx_global_cell_92d90c06123336f9a13fd848().value).value), i64((BigInt(i64((BigInt(i) << BigInt(4)))) + BigInt(i64(12)))), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(0) & 255)) & 255));
      ((cDeref(cPointerOffset((cPointerElementRef(gfileoffs, __cxx_global_cell_92d90c06123336f9a13fd848().value).value), i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(j));
      (j = i32((Number(j) + Number(k))));
    }
    ((cDeref(cPointerOffset((cPointerElementRef(gfileoffs, __cxx_global_cell_92d90c06123336f9a13fd848().value).value), (cDeref(cPointerOffset(__cxx_private_cell_40e26d32b6ca71fd78ad3b32().value, __cxx_global_cell_92d90c06123336f9a13fd848().value, Int32Array.BYTES_PER_ELEMENT), Int32Array).value), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(j));
    ((cPointerElementRef(groupname, __cxx_global_cell_92d90c06123336f9a13fd848().value).value) = xstrdup__header_54caacf0b3b5(filename));
    return i32(((__cxx_lvalue_8) => { const previous = __cxx_lvalue_8.value; const next = i32((previous + 1)); __cxx_lvalue_8.value = next; return previous; })(__cxx_global_cell_92d90c06123336f9a13fd848()));
  }
  klseek_grp(__cxx_global_cell_92d90c06123336f9a13fd848().value, 0, 0);
  let version;
  const __cxx_lvalue_1 = cScalarStorage(Int32Array);
  kread_grp(__cxx_global_cell_92d90c06123336f9a13fd848().value, __cxx_lvalue_1, 4);
  (__cxx_lvalue_1.value = i32(B_PASS32__header_416cc10abcf4(__cxx_lvalue_1.value)));
  while (((__cxx_lvalue_1.value == 1) || (__cxx_lvalue_1.value == 2))) {
    let zerobuf = cZeroAggregate({"array": "Uint8Array", "dims": [70]});
    memset(zerobuf, 0, u64(70));
    let numfiles;
    const __cxx_lvalue_2 = cScalarStorage(Int32Array);
    kread_grp(__cxx_global_cell_92d90c06123336f9a13fd848().value, __cxx_lvalue_2, 4);
    (__cxx_lvalue_2.value = i32(B_PASS32__header_416cc10abcf4(__cxx_lvalue_2.value)));
    let temp;
    const __cxx_lvalue_3 = cScalarStorage(Uint8Array);
    let temp2;
    kread_grp(__cxx_global_cell_92d90c06123336f9a13fd848().value, __cxx_lvalue_3, 1);
    if ((i32(__cxx_lvalue_3.value) > 31)) {
      break;
    }
    klseek_grp(__cxx_global_cell_92d90c06123336f9a13fd848().value, i32(__cxx_lvalue_3.value), 1);
    (__cxx_lvalue_3.value = (u32((u32(i32((32 - i32(__cxx_lvalue_3.value)))) & 255)) & 255));
    kread_grp(__cxx_global_cell_92d90c06123336f9a13fd848().value, buf, i32(__cxx_lvalue_3.value));
    if (Boolean(memcmp(buf, zerobuf, u64(__cxx_lvalue_3.value)))) {
      break;
    }
    if ((__cxx_lvalue_1.value == 2)) {
      kread_grp(__cxx_global_cell_92d90c06123336f9a13fd848().value, __cxx_lvalue_3, 1);
      if ((i32(__cxx_lvalue_3.value) > 11)) {
        break;
      }
      klseek_grp(__cxx_global_cell_92d90c06123336f9a13fd848().value, i32(__cxx_lvalue_3.value), 1);
      (__cxx_lvalue_3.value = (u32((u32(i32((12 - i32(__cxx_lvalue_3.value)))) & 255)) & 255));
      kread_grp(__cxx_global_cell_92d90c06123336f9a13fd848().value, buf, i32(__cxx_lvalue_3.value));
      if (Boolean(memcmp(buf, zerobuf, u64(__cxx_lvalue_3.value)))) {
        break;
      }
    }
    (temp2 = (u32((u32(0) & 255)) & 255));
    for (let i = i32(0); (i < 3); ((__cxx_lvalue_9) => { const previous = __cxx_lvalue_9.value; const next = i32((previous + 1)); __cxx_lvalue_9.value = next; return previous; })(cRef(() => i, __cxx_lvalue_10 => { i = __cxx_lvalue_10; }))) {
      kread_grp(__cxx_global_cell_92d90c06123336f9a13fd848().value, __cxx_lvalue_3, 1);
      if ((i32(__cxx_lvalue_3.value) > 70)) {
        (temp2 = (u32((u32(1) & 255)) & 255));
        break;
      }
      klseek_grp(__cxx_global_cell_92d90c06123336f9a13fd848().value, i32(__cxx_lvalue_3.value), 1);
      (__cxx_lvalue_3.value = (u32((u32(i32((70 - i32(__cxx_lvalue_3.value)))) & 255)) & 255));
      if ((i32(__cxx_lvalue_3.value) == 0)) {
        continue;
      }
      kread_grp(__cxx_global_cell_92d90c06123336f9a13fd848().value, buf, i32(__cxx_lvalue_3.value));
      (temp2 = (u32((temp2 | i32((!(!Boolean(memcmp(buf, zerobuf, u64(__cxx_lvalue_3.value)))))))) & 255));
    }
    if (Boolean(temp2)) {
      break;
    }
    ((cDeref(cPointerOffset(__cxx_private_cell_40e26d32b6ca71fd78ad3b32().value, __cxx_global_cell_92d90c06123336f9a13fd848().value, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(__cxx_lvalue_2.value));
    ((cPointerElementRef(gfilelist, __cxx_global_cell_92d90c06123336f9a13fd848().value).value) = cTypedPointer(xmalloc__header_74ee7b637863(u64(i32(((cDeref(cPointerOffset(__cxx_private_cell_40e26d32b6ca71fd78ad3b32().value, __cxx_global_cell_92d90c06123336f9a13fd848().value, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) << 4)))), Uint8Array));
    ((cPointerElementRef(gfileoffs, __cxx_global_cell_92d90c06123336f9a13fd848().value).value) = cTypedPointer(xmalloc__header_74ee7b637863(u64(i32((i32(((cDeref(cPointerOffset(__cxx_private_cell_40e26d32b6ca71fd78ad3b32().value, __cxx_global_cell_92d90c06123336f9a13fd848().value, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) + 1)) << 2)))), Int32Array));
    let j = i32((((__cxx_lvalue_1.value == 2) ? 267 : 254) + i32(Math.imul(__cxx_lvalue_2.value, 121))));
    let k;
    const __cxx_lvalue_4 = cScalarStorage(Int32Array);
    for (let i = i64(0); (i < i64(__cxx_lvalue_2.value)); ((__cxx_lvalue_11) => { const previous = __cxx_lvalue_11.value; const next = i64((previous + 1n)); __cxx_lvalue_11.value = next; return previous; })(cRef(() => i, __cxx_lvalue_12 => { i = __cxx_lvalue_12; }))) {
      kread_grp(__cxx_global_cell_92d90c06123336f9a13fd848().value, __cxx_lvalue_3, 1);
      if ((i32(__cxx_lvalue_3.value) > 12)) {
        (__cxx_lvalue_3.value = (u32((u32(12) & 255)) & 255));
      }
      kread_grp(__cxx_global_cell_92d90c06123336f9a13fd848().value, cPointerOffset((cPointerElementRef(gfilelist, __cxx_global_cell_92d90c06123336f9a13fd848().value).value), i64((BigInt(i) << BigInt(4))), Uint8Array.BYTES_PER_ELEMENT), i32(__cxx_lvalue_3.value));
      ((cDeref(cPointerOffset((cPointerElementRef(gfilelist, __cxx_global_cell_92d90c06123336f9a13fd848().value).value), i64((BigInt(i64((BigInt(i) << BigInt(4)))) + BigInt(i64(__cxx_lvalue_3.value)))), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(0) & 255)) & 255));
      klseek_grp(__cxx_global_cell_92d90c06123336f9a13fd848().value, i32((12 - i32(__cxx_lvalue_3.value))), 1);
      kread_grp(__cxx_global_cell_92d90c06123336f9a13fd848().value, __cxx_lvalue_4, 4);
      (__cxx_lvalue_4.value = i32(B_PASS32__header_416cc10abcf4(__cxx_lvalue_4.value)));
      ((cDeref(cPointerOffset((cPointerElementRef(gfileoffs, __cxx_global_cell_92d90c06123336f9a13fd848().value).value), i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(j));
      (j = i32((Number(j) + Number(__cxx_lvalue_4.value))));
      klseek_grp(__cxx_global_cell_92d90c06123336f9a13fd848().value, 104, 1);
    }
    ((cDeref(cPointerOffset((cPointerElementRef(gfileoffs, __cxx_global_cell_92d90c06123336f9a13fd848().value).value), (cDeref(cPointerOffset(__cxx_private_cell_40e26d32b6ca71fd78ad3b32().value, __cxx_global_cell_92d90c06123336f9a13fd848().value, Int32Array.BYTES_PER_ELEMENT), Int32Array).value), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(j));
    ((cPointerElementRef(groupname, __cxx_global_cell_92d90c06123336f9a13fd848().value).value) = xstrdup__header_54caacf0b3b5(filename));
    return i32(((__cxx_lvalue_13) => { const previous = __cxx_lvalue_13.value; const next = i32((previous + 1)); __cxx_lvalue_13.value = next; return previous; })(__cxx_global_cell_92d90c06123336f9a13fd848()));
  }
  kclose_grp(__cxx_global_cell_92d90c06123336f9a13fd848().value);
  return i32((-1));
}

// C/C++ source: source/build/src/vfs.cpp:659
export function uninitgroupfile() {
  let i;
  for ((i = i32((__cxx_global_cell_92d90c06123336f9a13fd848().value - 1))); (i >= 0); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous - 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; }))) {
    if (((cDeref(cPointerOffset(__cxx_private_cell_b077455bc7a20cfc79ce2bba().value, i, BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array).value) != i64((-1)))) {
      do {
        xfree__header_13edfa973cd4((cPointerElementRef(gfilelist, i).value));
        ((cPointerElementRef(gfilelist, i).value) = null);
      } while (Boolean(0));
      do {
        xfree__header_13edfa973cd4((cPointerElementRef(gfileoffs, i).value));
        ((cPointerElementRef(gfileoffs, i).value) = null);
      } while (Boolean(0));
      do {
        xfree__header_13edfa973cd4((cPointerElementRef(groupname, i).value));
        ((cPointerElementRef(groupname, i).value) = null);
      } while (Boolean(0));
      close(i32((cDeref(cPointerOffset(__cxx_private_cell_b077455bc7a20cfc79ce2bba().value, i, BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array).value)));
      ((cDeref(cPointerOffset(__cxx_private_cell_b077455bc7a20cfc79ce2bba().value, i, BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array).value) = i64((-1)));
    }
  }
  (__cxx_global_cell_92d90c06123336f9a13fd848().value = i32(0));
  for ((i = i32(0)); (i < 64); ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i32((previous + 1)); __cxx_lvalue_2.value = next; return previous; })(cRef(() => i, __cxx_lvalue_3 => { i = __cxx_lvalue_3; }))) {
    if ((i32((cDeref(cPointerOffset(__cxx_private_cell_3a9ab4328ffa236764eb60c3().value, i, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) < i32(254))) {
      ((cDeref(cPointerOffset(__cxx_private_cell_e58f38ca23a4c7031f169daa().value, i, BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array).value) = i64((-1)));
    }
  }
}

// C/C++ source: source/build/src/vfs.cpp:730
export function kopen_internal(filename, lastpfn, searchfirst, checkcase, tryzip, newhandle, arraygrp, arrayhan, arraypos) {
  let fil, i, k, __cxx_scope_3_i, gfileptr, j;
  if (((i32(searchfirst) == 0) && ((fil = i32(openfrompath_internal(filename, lastpfn, i32((0 | 0)), 256))) >= 0))) {
    (checkcase = (u32(checkcase) & 255));
    ((cDeref(cPointerOffset(arraygrp, newhandle, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(255) & 255)) & 255));
    ((cDeref(cPointerOffset(arrayhan, newhandle, BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array).value) = i64(fil));
    ((cDeref(cPointerOffset(arraypos, newhandle, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(0));
    return i32(newhandle);
  }
  __source_control_0: for (; (i32((cDeref(cPointerOffset(toupperlookup, (cDeref(filename, Uint8Array).value), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == i32(47)); ((__cxx_lvalue_1) => { const previous = __cxx_lvalue_1.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_1.value = next; return previous; })(cRef(() => filename, __cxx_lvalue_2 => { filename = __cxx_lvalue_2; }))) {

  }
  if (Boolean(tryzip)) {

    if (((__cxx_private_cell_c51318c3fc474f17943c1125().value != newhandle) && (kztell__header_df1c549f3c13() >= 0))) {
      if ((__cxx_private_cell_c51318c3fc474f17943c1125().value >= 0)) {
        ((cDeref(cPointerOffset(arraypos, __cxx_private_cell_c51318c3fc474f17943c1125().value, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(kztell__header_df1c549f3c13()));
      }
      kzclose__header_fa818b4f2176();
      (__cxx_private_cell_c51318c3fc474f17943c1125().value = i32((-1)));
    }
    if (((i32(searchfirst) != 1) && ((i = i64(kzipopen(filename))) != i64(0)))) {
      (__cxx_private_cell_c51318c3fc474f17943c1125().value = i32(newhandle));
      ((cDeref(cPointerOffset(arraygrp, newhandle, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(254) & 255)) & 255));
      ((cDeref(cPointerOffset(arrayhan, newhandle, BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array).value) = i64(i));
      ((cDeref(cPointerOffset(arraypos, newhandle, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(0));
      strcpy((cPointerElementRef(__cxx_private_cell_e0923db928126267627d131f().value, newhandle).value), filename);
      return i32(newhandle);
    }
  }
  __source_control_1: for (k = i64(((i32(searchfirst) != 1) ? i32((__cxx_global_cell_92d90c06123336f9a13fd848().value - 1)) : 0)); (k >= i64(0)); ((__cxx_lvalue_3) => { const previous = __cxx_lvalue_3.value; const next = i64((previous - 1n)); __cxx_lvalue_3.value = next; return next; })(cRef(() => k, __cxx_lvalue_4 => { k = __cxx_lvalue_4; }))) {
    if (((cDeref(cPointerOffset(__cxx_private_cell_b077455bc7a20cfc79ce2bba().value, k, BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array).value) < i64(0))) {
      continue __source_control_1;
    }
    __source_control_2: for (__cxx_scope_3_i = i64(i32(((cDeref(cPointerOffset(__cxx_private_cell_40e26d32b6ca71fd78ad3b32().value, k, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) - 1))); (__cxx_scope_3_i >= i64(0)); ((__cxx_lvalue_5) => { const previous = __cxx_lvalue_5.value; const next = i64((previous - 1n)); __cxx_lvalue_5.value = next; return next; })(cRef(() => __cxx_scope_3_i, __cxx_lvalue_6 => { __cxx_scope_3_i = __cxx_lvalue_6; }))) {
      gfileptr = cTypedPointer(cPointerOffset((cPointerElementRef(gfilelist, k).value), i64((BigInt(__cxx_scope_3_i) << BigInt(4))), Uint8Array.BYTES_PER_ELEMENT), Uint8Array);
      __source_exit_gnumfiles_continue: {
        __source_control_3: for ((j = u32(0)); (j < u32(13)); ((__cxx_lvalue_7) => { const previous = __cxx_lvalue_7.value; const next = u32((previous + 1)); __cxx_lvalue_7.value = next; return next; })(cRef(() => j, __cxx_lvalue_8 => { j = __cxx_lvalue_8; }))) {
          if ((!Boolean((cDeref(cPointerOffset(filename, j, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))) {
            break __source_control_3;
          }
          if ((i32((cDeref(cPointerOffset(toupperlookup, (cDeref(cPointerOffset(filename, j, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) != i32((cDeref(cPointerOffset(toupperlookup, (cDeref(cPointerOffset(gfileptr, j, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))) {
            break __source_exit_gnumfiles_continue;
          }
        }
        if (((j < u32(13)) && Boolean((cDeref(cPointerOffset(gfileptr, j, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))) {
          continue __source_control_2;
        }
        if (((j == u32(13)) && Boolean((cDeref(cPointerOffset(filename, j, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))) {
          continue __source_control_2;
        }
        ((cDeref(cPointerOffset(arraygrp, newhandle, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(k) & 255)) & 255));
        ((cDeref(cPointerOffset(arrayhan, newhandle, BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array).value) = i64(__cxx_scope_3_i));
        ((cDeref(cPointerOffset(arraypos, newhandle, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(0));
        return i32(newhandle);
      }
      ;
    }
  }
  return i32((-1));
}

// C/C++ source: source/build/src/vfs.cpp:830
export function krename(crcval, filenum, newname) {
  strncpy(cTypedPointer(cPointerOffset((cPointerElementRef(gfilelist, crcval).value), i32((filenum << 4)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array), newname, u64(12));
}

// C/C++ source: source/build/src/vfs.cpp:835
export function kfileparent(handle) {
  let groupnum = i32((cDeref(cPointerOffset(__cxx_private_cell_3a9ab4328ffa236764eb60c3().value, handle, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value));
  if (((u32(groupnum) >= u32(8)) || ((cDeref(cPointerOffset(__cxx_private_cell_b077455bc7a20cfc79ce2bba().value, groupnum, BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array).value) == i64((-1))))) {
    return null;
  }
  return (cPointerElementRef(groupname, groupnum).value);
}

// C/C++ source: source/build/src/vfs.cpp:845
const __cxx_literal_b4d31f036ea909bb266a = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 118, 102, 115, 46, 99, 112, 112, 0]);
const __cxx_literal_7253b2c13f3aac0026de = Uint8Array.from([84, 79, 79, 32, 77, 65, 78, 89, 32, 70, 73, 76, 69, 83, 32, 79, 80, 69, 78, 32, 73, 78, 32, 70, 73, 76, 69, 32, 71, 82, 79, 85, 80, 73, 78, 71, 32, 83, 89, 83, 84, 69, 77, 33, 0]);
export function kopen4load(filename, searchfirst) {
  let newhandle = i32((64 - 1));
  if (cPointerCompare(filename, null, "==")) {
    return (-1);
  }
  while (((cDeref(cPointerOffset(__cxx_private_cell_e58f38ca23a4c7031f169daa().value, newhandle, BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array).value) != i64((-1)))) {
    ((__cxx_lvalue_1) => { const previous = __cxx_lvalue_1.value; const next = i32((previous - 1)); __cxx_lvalue_1.value = next; return previous; })(cRef(() => newhandle, __cxx_lvalue_2 => { newhandle = __cxx_lvalue_2; }));
    if ((newhandle < 0)) {
      ((i32(-2) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-2), __cxx_literal_b4d31f036ea909bb266a, u32(857), __cxx_literal_7253b2c13f3aac0026de));
      do {
        engineDestroyAllocator__header_79eabc223f85();
        cProcess.exit(0);
      } while (Boolean(0));
    }
  }
  let lastpfn = null;
  const __cxx_lvalue_0 = cRef(() => lastpfn, __cxx_lvalue_3 => { lastpfn = __cxx_lvalue_3; });
  let h = i32(kopen_internal(filename, __cxx_lvalue_0, searchfirst, (u32(1) & 255), (u32(1) & 255), newhandle, __cxx_private_cell_3a9ab4328ffa236764eb60c3().value, __cxx_private_cell_e58f38ca23a4c7031f169daa().value, __cxx_private_cell_0e6a8863bdc69dd261cf550b().value));
  xfree__header_13edfa973cd4(lastpfn);
  return h;
}

// C/C++ source: source/build/src/vfs.cpp:873
let __static_kopen4loadfrommod_staticFileName = new Uint8Array(256);
const __cxx_literal_f63c18718986e61f009c = Uint8Array.from([37, 115, 47, 37, 115, 0]);
export function kopen4loadfrommod(fileName, searchfirst) {
  let kFile = i32((-1));
  if (((i32((cDeref(cPointerOffset(g_modDir, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) != i32(47)) || (i32((cDeref(cPointerOffset(g_modDir, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) != 0))) {

    snprintf(__static_kopen4loadfrommod_staticFileName, 256, __cxx_literal_f63c18718986e61f009c, g_modDir, fileName);
    (kFile = i32(kopen4load(__static_kopen4loadfrommod_staticFileName, searchfirst)));
  }
  return ((kFile == (-1)) ? kopen4load(fileName, searchfirst) : kFile);
}

// C/C++ source: source/build/src/vfs.cpp:887
export function kread_internal(handle, buffer, leng, arraygrp, arrayhan, arraypos) {
  const __cxx_lvalue_0 = cRef(() => leng, __cxx_lvalue_4 => { leng = i32(__cxx_lvalue_4); });
  let filenum = i32((cDeref(cPointerOffset(arrayhan, handle, BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array).value));
  let groupnum = i32((cDeref(cPointerOffset(arraygrp, handle, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value));
  if ((groupnum == i32(255))) {
    return i32(read(filenum, buffer, u64(leng)));
  } else {
    if ((groupnum == i32(254))) {
      if ((__cxx_private_cell_c51318c3fc474f17943c1125().value != handle)) {
        if ((kztell__header_df1c549f3c13() >= 0)) {
          ((cDeref(cPointerOffset(arraypos, __cxx_private_cell_c51318c3fc474f17943c1125().value, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(kztell__header_df1c549f3c13()));
          kzclose__header_fa818b4f2176();
        }
        (__cxx_private_cell_c51318c3fc474f17943c1125().value = i32(handle));
        kzipopen((cPointerElementRef(__cxx_private_cell_e0923db928126267627d131f().value, handle).value));
        kzseek((cDeref(cPointerOffset(arraypos, handle, Int32Array.BYTES_PER_ELEMENT), Int32Array).value), 0);
      }
      return i32(kzread(buffer, leng));
    }
  }
  if (((cDeref(cPointerOffset(__cxx_private_cell_b077455bc7a20cfc79ce2bba().value, groupnum, BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array).value) == i64((-1)))) {
    return i32(0);
  }
  let rootgroupnum = i32(groupnum);
  let i = i32(0);
  while ((i32((cDeref(cPointerOffset(__cxx_private_cell_22ad39b5d1fff4dd8ee9cb2a().value, rootgroupnum, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) != i32(255))) {
    (i = i32((Number(i) + Number((cDeref(cPointerOffset((cPointerElementRef(gfileoffs, (cDeref(cPointerOffset(__cxx_private_cell_22ad39b5d1fff4dd8ee9cb2a().value, rootgroupnum, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)).value), (cDeref(cPointerOffset(__cxx_private_cell_b077455bc7a20cfc79ce2bba().value, rootgroupnum, BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array).value), Int32Array.BYTES_PER_ELEMENT), Int32Array).value)))));
    (rootgroupnum = i32((cDeref(cPointerOffset(__cxx_private_cell_22ad39b5d1fff4dd8ee9cb2a().value, rootgroupnum, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)));
  }
  if (((cDeref(cPointerOffset(__cxx_private_cell_b077455bc7a20cfc79ce2bba().value, rootgroupnum, BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array).value) != i64((-1)))) {
    (i = i32((Number(i) + Number(i32(((cDeref(cPointerOffset((cPointerElementRef(gfileoffs, groupnum).value), filenum, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) + (cDeref(cPointerOffset(arraypos, handle, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)))))));
    if ((i != (cDeref(cPointerOffset(__cxx_private_cell_d14239ea2126a8005fdc7edd().value, rootgroupnum, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))) {
      lseek(i32((cDeref(cPointerOffset(__cxx_private_cell_b077455bc7a20cfc79ce2bba().value, rootgroupnum, BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array).value)), i64(i), 0);
      ((cDeref(cPointerOffset(__cxx_private_cell_d14239ea2126a8005fdc7edd().value, rootgroupnum, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(i));
    }
    (leng = i32((min__template_774131ccff66371d(__cxx_lvalue_0, ((__cxx_lvalue_1) => cRef(() => __cxx_lvalue_1, () => { throw new TypeError("const C++ reference write"); }))(i32((i32(((cDeref(cPointerOffset((cPointerElementRef(gfileoffs, groupnum).value), i32((filenum + 1)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) - (cDeref(cPointerOffset((cPointerElementRef(gfileoffs, groupnum).value), filenum, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))) - (cDeref(cPointerOffset(arraypos, handle, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)))))).value));
    (leng = i32(read(i32((cDeref(cPointerOffset(__cxx_private_cell_b077455bc7a20cfc79ce2bba().value, rootgroupnum, BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array).value)), buffer, u64(leng))));
    ((__cxx_lvalue_2) => (__cxx_lvalue_2.value = i32((Number(__cxx_lvalue_2.value) + Number(leng)))))(cDeref(cPointerOffset(arraypos, handle, Int32Array.BYTES_PER_ELEMENT), Int32Array));
    ((__cxx_lvalue_3) => (__cxx_lvalue_3.value = i32((Number(__cxx_lvalue_3.value) + Number(leng)))))(cDeref(cPointerOffset(__cxx_private_cell_d14239ea2126a8005fdc7edd().value, rootgroupnum, Int32Array.BYTES_PER_ELEMENT), Int32Array));
    return i32(leng);
  }
  return i32(0);
}

// C/C++ source: source/build/src/vfs.cpp:935
export function klseek_internal(handle, offset, whence, arraygrp, arrayhan, arraypos) {
  let groupnum = i32((cDeref(cPointerOffset(arraygrp, handle, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value));
  if ((groupnum == i32(255))) {
    return i32(lseek(i32((cDeref(cPointerOffset(arrayhan, handle, BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array).value)), i64(offset), whence));
  } else {
    if ((groupnum == i32(254))) {
      if ((__cxx_private_cell_c51318c3fc474f17943c1125().value != handle)) {
        if ((kztell__header_df1c549f3c13() >= 0)) {
          ((cDeref(cPointerOffset(arraypos, __cxx_private_cell_c51318c3fc474f17943c1125().value, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(kztell__header_df1c549f3c13()));
          kzclose__header_fa818b4f2176();
        }
        (__cxx_private_cell_c51318c3fc474f17943c1125().value = i32(handle));
        kzipopen((cPointerElementRef(__cxx_private_cell_e0923db928126267627d131f().value, handle).value));
        kzseek((cDeref(cPointerOffset(arraypos, handle, Int32Array.BYTES_PER_ELEMENT), Int32Array).value), 0);
      }
      return i32(kzseek(offset, whence));
    }
  }
  if (((cDeref(cPointerOffset(__cxx_private_cell_b077455bc7a20cfc79ce2bba().value, groupnum, BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array).value) != i64((-1)))) {
    switch (whence) {
      case 0: {
        ((cDeref(cPointerOffset(arraypos, handle, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(offset));
      }
      break;
      case 2: {
        let i = i32((cDeref(cPointerOffset(arrayhan, handle, BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array).value));
        ((cDeref(cPointerOffset(arraypos, handle, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((i32(((cDeref(cPointerOffset((cPointerElementRef(gfileoffs, groupnum).value), i32((i + 1)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) - (cDeref(cPointerOffset((cPointerElementRef(gfileoffs, groupnum).value), i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))) + offset)));
        break;
      }
      case 1: {
        ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = i32((Number(__cxx_lvalue_0.value) + Number(offset)))))(cDeref(cPointerOffset(arraypos, handle, Int32Array.BYTES_PER_ELEMENT), Int32Array));
      }
      break;
    }
    return i32((cDeref(cPointerOffset(arraypos, handle, Int32Array.BYTES_PER_ELEMENT), Int32Array).value));
  }
  return i32((-1));
}

// C/C++ source: source/build/src/vfs.cpp:974
export function kfilelength_internal(handle, arraygrp, arrayhan, arraypos) {
  let groupnum = i32((cDeref(cPointerOffset(arraygrp, handle, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value));
  if ((groupnum == i32(255))) {
    return i32(buildvfs_length__header_e629f4d97284(i32((cDeref(cPointerOffset(arrayhan, handle, BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array).value))));
  } else {
    if ((groupnum == i32(254))) {
      if ((__cxx_private_cell_c51318c3fc474f17943c1125().value != handle)) {
        if ((kztell__header_df1c549f3c13() >= 0)) {
          ((cDeref(cPointerOffset(arraypos, __cxx_private_cell_c51318c3fc474f17943c1125().value, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(kztell__header_df1c549f3c13()));
          kzclose__header_fa818b4f2176();
        }
        (__cxx_private_cell_c51318c3fc474f17943c1125().value = i32(handle));
        kzipopen((cPointerElementRef(__cxx_private_cell_e0923db928126267627d131f().value, handle).value));
        kzseek((cDeref(cPointerOffset(arraypos, handle, Int32Array.BYTES_PER_ELEMENT), Int32Array).value), 0);
      }
      return i32(kzfilelength__header_fa0b046b8508());
    }
  }
  let i = i32((cDeref(cPointerOffset(arrayhan, handle, BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array).value));
  return i32(((cDeref(cPointerOffset((cPointerElementRef(gfileoffs, groupnum).value), i32((i + 1)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) - (cDeref(cPointerOffset((cPointerElementRef(gfileoffs, groupnum).value), i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
}

// C/C++ source: source/build/src/vfs.cpp:998
export function ktell_internal(handle, arraygrp, arrayhan, arraypos) {
  let groupnum = i32((cDeref(cPointerOffset(arraygrp, handle, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value));
  if ((groupnum == i32(255))) {
    return i32(lseek(i32((cDeref(cPointerOffset(arrayhan, handle, BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array).value)), i64(0), 1));
  } else {
    if ((groupnum == i32(254))) {
      if ((__cxx_private_cell_c51318c3fc474f17943c1125().value != handle)) {
        if ((kztell__header_df1c549f3c13() >= 0)) {
          ((cDeref(cPointerOffset(arraypos, __cxx_private_cell_c51318c3fc474f17943c1125().value, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(kztell__header_df1c549f3c13()));
          kzclose__header_fa818b4f2176();
        }
        (__cxx_private_cell_c51318c3fc474f17943c1125().value = i32(handle));
        kzipopen((cPointerElementRef(__cxx_private_cell_e0923db928126267627d131f().value, handle).value));
        kzseek((cDeref(cPointerOffset(arraypos, handle, Int32Array.BYTES_PER_ELEMENT), Int32Array).value), 0);
      }
      return i32(kztell__header_df1c549f3c13());
    }
  }
  if (((cDeref(cPointerOffset(__cxx_private_cell_b077455bc7a20cfc79ce2bba().value, groupnum, BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array).value) != i64((-1)))) {
    return i32((cDeref(cPointerOffset(arraypos, handle, Int32Array.BYTES_PER_ELEMENT), Int32Array).value));
  }
  return i32((-1));
}

// C/C++ source: source/build/src/vfs.cpp:1021
export function kclose_internal(handle, arraygrp, arrayhan) {
  if ((handle < 0)) {
    return;
  }
  if ((i32((cDeref(cPointerOffset(arraygrp, handle, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == i32(255))) {
    close(i32((cDeref(cPointerOffset(arrayhan, handle, BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array).value)));
  } else {
    if ((i32((cDeref(cPointerOffset(arraygrp, handle, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == i32(254))) {
      kzclose__header_fa818b4f2176();
      (__cxx_private_cell_c51318c3fc474f17943c1125().value = i32((-1)));
    }
  }
  ((cDeref(cPointerOffset(arrayhan, handle, BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array).value) = i64((-1)));
}

// C/C++ source: source/build/src/vfs.cpp:1035
export function kread(handle, buffer, leng) {
  return i32(kread_internal(handle, buffer, leng, __cxx_private_cell_3a9ab4328ffa236764eb60c3().value, __cxx_private_cell_e58f38ca23a4c7031f169daa().value, __cxx_private_cell_0e6a8863bdc69dd261cf550b().value));
}

// C/C++ source: source/build/src/vfs.cpp:1039
export function klseek(handle, offset, whence) {
  return i32(klseek_internal(handle, offset, whence, __cxx_private_cell_3a9ab4328ffa236764eb60c3().value, __cxx_private_cell_e58f38ca23a4c7031f169daa().value, __cxx_private_cell_0e6a8863bdc69dd261cf550b().value));
}

// C/C++ source: source/build/src/vfs.cpp:1043
export function kfilelength(handle) {
  return i32(kfilelength_internal(handle, __cxx_private_cell_3a9ab4328ffa236764eb60c3().value, __cxx_private_cell_e58f38ca23a4c7031f169daa().value, __cxx_private_cell_0e6a8863bdc69dd261cf550b().value));
}

// C/C++ source: source/build/src/vfs.cpp:1047
export function ktell(handle) {
  return i32(ktell_internal(handle, __cxx_private_cell_3a9ab4328ffa236764eb60c3().value, __cxx_private_cell_e58f38ca23a4c7031f169daa().value, __cxx_private_cell_0e6a8863bdc69dd261cf550b().value));
}

// C/C++ source: source/build/src/vfs.cpp:1051
export function kclose(handle) {
  return kclose_internal(handle, __cxx_private_cell_3a9ab4328ffa236764eb60c3().value, __cxx_private_cell_e58f38ca23a4c7031f169daa().value);
}

// C/C++ source: source/build/src/vfs.cpp:1056
export function kread_grp(handle, buffer, leng) {
  return i32(kread_internal(handle, buffer, leng, __cxx_private_cell_22ad39b5d1fff4dd8ee9cb2a().value, __cxx_private_cell_b077455bc7a20cfc79ce2bba().value, __cxx_private_cell_d14239ea2126a8005fdc7edd().value));
}

// C/C++ source: source/build/src/vfs.cpp:1060
export function klseek_grp(handle, offset, whence) {
  return i32(klseek_internal(handle, offset, whence, __cxx_private_cell_22ad39b5d1fff4dd8ee9cb2a().value, __cxx_private_cell_b077455bc7a20cfc79ce2bba().value, __cxx_private_cell_d14239ea2126a8005fdc7edd().value));
}

// C/C++ source: source/build/src/vfs.cpp:1064
export function kclose_grp(handle) {
  return kclose_internal(handle, __cxx_private_cell_22ad39b5d1fff4dd8ee9cb2a().value, __cxx_private_cell_b077455bc7a20cfc79ce2bba().value);
}

// C/C++ source: source/build/src/vfs.cpp:1070
export function klistaddentry(rec, name, type, source) {
  let r = null;
  let attach = null;
  if ((cPointerElementRef(rec, 0).value)) {
    let insensitive;
    let v;
    let last = null;
    for ((attach = (cPointerElementRef(rec, 0).value)); attach; ((last = attach), (attach = cRecordObject(cRecordPointer(attach, {"align": 8, "arrayAlign": 1, "fields": {"name": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 16, "pointer": true, "size": 8}, "prev": {"offset": 24, "pointer": true, "size": 8}, "source": {"native": "Int32Array", "offset": 12, "size": 4}, "type": {"native": "Int32Array", "offset": 8, "size": 4}, "usera": {"offset": 32, "pointer": true, "size": 8}, "userb": {"offset": 40, "pointer": true, "size": 8}}, "overlaps": false, "size": 48, "union": false}, {})).next))) {
      if ((type == i32(4))) {
        continue;
      }
      if (((source == i32(2147483647)) || (cRecordObject(cRecordPointer(attach, {"align": 8, "arrayAlign": 1, "fields": {"name": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 16, "pointer": true, "size": 8}, "prev": {"offset": 24, "pointer": true, "size": 8}, "source": {"native": "Int32Array", "offset": 12, "size": 4}, "type": {"native": "Int32Array", "offset": 8, "size": 4}, "usera": {"offset": 32, "pointer": true, "size": 8}, "userb": {"offset": 40, "pointer": true, "size": 8}}, "overlaps": false, "size": 48, "union": false}, {})).source == i32(2147483647)))) {
        (insensitive = i32(1));
      } else {
        if (((source == i32(2147483646)) || (cRecordObject(cRecordPointer(attach, {"align": 8, "arrayAlign": 1, "fields": {"name": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 16, "pointer": true, "size": 8}, "prev": {"offset": 24, "pointer": true, "size": 8}, "source": {"native": "Int32Array", "offset": 12, "size": 4}, "type": {"native": "Int32Array", "offset": 8, "size": 4}, "usera": {"offset": 32, "pointer": true, "size": 8}, "userb": {"offset": 40, "pointer": true, "size": 8}}, "overlaps": false, "size": 48, "union": false}, {})).source == i32(2147483646)))) {
          (insensitive = i32(1));
        } else {
          let editstatus;
          (insensitive = i32((!Boolean(editstatus))));
        }
      }
      if (Boolean(insensitive)) {
        (v = i32(strcasecmp(name, cRecordObject(cRecordPointer(attach, {"align": 8, "arrayAlign": 1, "fields": {"name": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 16, "pointer": true, "size": 8}, "prev": {"offset": 24, "pointer": true, "size": 8}, "source": {"native": "Int32Array", "offset": 12, "size": 4}, "type": {"native": "Int32Array", "offset": 8, "size": 4}, "usera": {"offset": 32, "pointer": true, "size": 8}, "userb": {"offset": 40, "pointer": true, "size": 8}}, "overlaps": false, "size": 48, "union": false}, {})).name)));
      } else {
        (v = i32(strcmp(name, cRecordObject(cRecordPointer(attach, {"align": 8, "arrayAlign": 1, "fields": {"name": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 16, "pointer": true, "size": 8}, "prev": {"offset": 24, "pointer": true, "size": 8}, "source": {"native": "Int32Array", "offset": 12, "size": 4}, "type": {"native": "Int32Array", "offset": 8, "size": 4}, "usera": {"offset": 32, "pointer": true, "size": 8}, "userb": {"offset": 40, "pointer": true, "size": 8}}, "overlaps": false, "size": 48, "union": false}, {})).name)));
      }
      if ((v > 0)) {
        continue;
      }
      if ((v < 0)) {
        (attach = null);
        break;
      }
      if ((source >= cRecordObject(cRecordPointer(attach, {"align": 8, "arrayAlign": 1, "fields": {"name": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 16, "pointer": true, "size": 8}, "prev": {"offset": 24, "pointer": true, "size": 8}, "source": {"native": "Int32Array", "offset": 12, "size": 4}, "type": {"native": "Int32Array", "offset": 8, "size": 4}, "usera": {"offset": 32, "pointer": true, "size": 8}, "userb": {"offset": 40, "pointer": true, "size": 8}}, "overlaps": false, "size": 48, "union": false}, {})).source)) {
        return i32(1);
      }
      (r = attach);
      break;
    }
    if ((!attach)) {
      (attach = last);
    }
  }
  if (r) {
    (cRecordObject(cRecordPointer(r, {"align": 8, "arrayAlign": 1, "fields": {"name": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 16, "pointer": true, "size": 8}, "prev": {"offset": 24, "pointer": true, "size": 8}, "source": {"native": "Int32Array", "offset": 12, "size": 4}, "type": {"native": "Int32Array", "offset": 8, "size": 4}, "usera": {"offset": 32, "pointer": true, "size": 8}, "userb": {"offset": 40, "pointer": true, "size": 8}}, "overlaps": false, "size": 48, "union": false}, {})).type = i32(type));
    (cRecordObject(cRecordPointer(r, {"align": 8, "arrayAlign": 1, "fields": {"name": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 16, "pointer": true, "size": 8}, "prev": {"offset": 24, "pointer": true, "size": 8}, "source": {"native": "Int32Array", "offset": 12, "size": 4}, "type": {"native": "Int32Array", "offset": 8, "size": 4}, "usera": {"offset": 32, "pointer": true, "size": 8}, "userb": {"offset": 40, "pointer": true, "size": 8}}, "overlaps": false, "size": 48, "union": false}, {})).source = i32(source));
    return i32(0);
  }
  (r = cRecordPointer(xmalloc__header_74ee7b637863(u64((BigInt(u64((BigInt(48) + BigInt(strlen(name))))) + BigInt(u64(1))))), {"align": 8, "arrayAlign": 1, "fields": {"name": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 16, "pointer": true, "size": 8}, "prev": {"offset": 24, "pointer": true, "size": 8}, "source": {"native": "Int32Array", "offset": 12, "size": 4}, "type": {"native": "Int32Array", "offset": 8, "size": 4}, "usera": {"offset": 32, "pointer": true, "size": 8}, "userb": {"offset": 40, "pointer": true, "size": 8}}, "overlaps": false, "size": 48, "union": false}, {}));
  (cRecordObject(cRecordPointer(r, {"align": 8, "arrayAlign": 1, "fields": {"name": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 16, "pointer": true, "size": 8}, "prev": {"offset": 24, "pointer": true, "size": 8}, "source": {"native": "Int32Array", "offset": 12, "size": 4}, "type": {"native": "Int32Array", "offset": 8, "size": 4}, "usera": {"offset": 32, "pointer": true, "size": 8}, "userb": {"offset": 40, "pointer": true, "size": 8}}, "overlaps": false, "size": 48, "union": false}, {})).name = cPointerOffset(cTypedPointer(r, Uint8Array), 48, Uint8Array.BYTES_PER_ELEMENT));
  strcpy(cRecordObject(cRecordPointer(r, {"align": 8, "arrayAlign": 1, "fields": {"name": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 16, "pointer": true, "size": 8}, "prev": {"offset": 24, "pointer": true, "size": 8}, "source": {"native": "Int32Array", "offset": 12, "size": 4}, "type": {"native": "Int32Array", "offset": 8, "size": 4}, "usera": {"offset": 32, "pointer": true, "size": 8}, "userb": {"offset": 40, "pointer": true, "size": 8}}, "overlaps": false, "size": 48, "union": false}, {})).name, name);
  (cRecordObject(cRecordPointer(r, {"align": 8, "arrayAlign": 1, "fields": {"name": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 16, "pointer": true, "size": 8}, "prev": {"offset": 24, "pointer": true, "size": 8}, "source": {"native": "Int32Array", "offset": 12, "size": 4}, "type": {"native": "Int32Array", "offset": 8, "size": 4}, "usera": {"offset": 32, "pointer": true, "size": 8}, "userb": {"offset": 40, "pointer": true, "size": 8}}, "overlaps": false, "size": 48, "union": false}, {})).type = i32(type));
  (cRecordObject(cRecordPointer(r, {"align": 8, "arrayAlign": 1, "fields": {"name": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 16, "pointer": true, "size": 8}, "prev": {"offset": 24, "pointer": true, "size": 8}, "source": {"native": "Int32Array", "offset": 12, "size": 4}, "type": {"native": "Int32Array", "offset": 8, "size": 4}, "usera": {"offset": 32, "pointer": true, "size": 8}, "userb": {"offset": 40, "pointer": true, "size": 8}}, "overlaps": false, "size": 48, "union": false}, {})).source = i32(source));
  (cRecordObject(cRecordPointer(r, {"align": 8, "arrayAlign": 1, "fields": {"name": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 16, "pointer": true, "size": 8}, "prev": {"offset": 24, "pointer": true, "size": 8}, "source": {"native": "Int32Array", "offset": 12, "size": 4}, "type": {"native": "Int32Array", "offset": 8, "size": 4}, "usera": {"offset": 32, "pointer": true, "size": 8}, "userb": {"offset": 40, "pointer": true, "size": 8}}, "overlaps": false, "size": 48, "union": false}, {})).usera = (cRecordObject(cRecordPointer(r, {"align": 8, "arrayAlign": 1, "fields": {"name": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 16, "pointer": true, "size": 8}, "prev": {"offset": 24, "pointer": true, "size": 8}, "source": {"native": "Int32Array", "offset": 12, "size": 4}, "type": {"native": "Int32Array", "offset": 8, "size": 4}, "usera": {"offset": 32, "pointer": true, "size": 8}, "userb": {"offset": 40, "pointer": true, "size": 8}}, "overlaps": false, "size": 48, "union": false}, {})).userb = null));
  if ((!attach)) {
    (cRecordObject(cRecordPointer(r, {"align": 8, "arrayAlign": 1, "fields": {"name": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 16, "pointer": true, "size": 8}, "prev": {"offset": 24, "pointer": true, "size": 8}, "source": {"native": "Int32Array", "offset": 12, "size": 4}, "type": {"native": "Int32Array", "offset": 8, "size": 4}, "usera": {"offset": 32, "pointer": true, "size": 8}, "userb": {"offset": 40, "pointer": true, "size": 8}}, "overlaps": false, "size": 48, "union": false}, {})).prev = null);
    (cRecordObject(cRecordPointer(r, {"align": 8, "arrayAlign": 1, "fields": {"name": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 16, "pointer": true, "size": 8}, "prev": {"offset": 24, "pointer": true, "size": 8}, "source": {"native": "Int32Array", "offset": 12, "size": 4}, "type": {"native": "Int32Array", "offset": 8, "size": 4}, "usera": {"offset": 32, "pointer": true, "size": 8}, "userb": {"offset": 40, "pointer": true, "size": 8}}, "overlaps": false, "size": 48, "union": false}, {})).next = (cPointerElementRef(rec, 0).value));
    if ((cPointerElementRef(rec, 0).value)) {
      (cRecordObject(cRecordPointer((cPointerElementRef(rec, 0).value), {"align": 8, "arrayAlign": 1, "fields": {"name": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 16, "pointer": true, "size": 8}, "prev": {"offset": 24, "pointer": true, "size": 8}, "source": {"native": "Int32Array", "offset": 12, "size": 4}, "type": {"native": "Int32Array", "offset": 8, "size": 4}, "usera": {"offset": 32, "pointer": true, "size": 8}, "userb": {"offset": 40, "pointer": true, "size": 8}}, "overlaps": false, "size": 48, "union": false}, {})).prev = r);
    }
    ((cPointerElementRef(rec, 0).value) = r);
  } else {
    (cRecordObject(cRecordPointer(r, {"align": 8, "arrayAlign": 1, "fields": {"name": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 16, "pointer": true, "size": 8}, "prev": {"offset": 24, "pointer": true, "size": 8}, "source": {"native": "Int32Array", "offset": 12, "size": 4}, "type": {"native": "Int32Array", "offset": 8, "size": 4}, "usera": {"offset": 32, "pointer": true, "size": 8}, "userb": {"offset": 40, "pointer": true, "size": 8}}, "overlaps": false, "size": 48, "union": false}, {})).prev = attach);
    (cRecordObject(cRecordPointer(r, {"align": 8, "arrayAlign": 1, "fields": {"name": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 16, "pointer": true, "size": 8}, "prev": {"offset": 24, "pointer": true, "size": 8}, "source": {"native": "Int32Array", "offset": 12, "size": 4}, "type": {"native": "Int32Array", "offset": 8, "size": 4}, "usera": {"offset": 32, "pointer": true, "size": 8}, "userb": {"offset": 40, "pointer": true, "size": 8}}, "overlaps": false, "size": 48, "union": false}, {})).next = cRecordObject(cRecordPointer(attach, {"align": 8, "arrayAlign": 1, "fields": {"name": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 16, "pointer": true, "size": 8}, "prev": {"offset": 24, "pointer": true, "size": 8}, "source": {"native": "Int32Array", "offset": 12, "size": 4}, "type": {"native": "Int32Array", "offset": 8, "size": 4}, "usera": {"offset": 32, "pointer": true, "size": 8}, "userb": {"offset": 40, "pointer": true, "size": 8}}, "overlaps": false, "size": 48, "union": false}, {})).next);
    if (cRecordObject(cRecordPointer(attach, {"align": 8, "arrayAlign": 1, "fields": {"name": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 16, "pointer": true, "size": 8}, "prev": {"offset": 24, "pointer": true, "size": 8}, "source": {"native": "Int32Array", "offset": 12, "size": 4}, "type": {"native": "Int32Array", "offset": 8, "size": 4}, "usera": {"offset": 32, "pointer": true, "size": 8}, "userb": {"offset": 40, "pointer": true, "size": 8}}, "overlaps": false, "size": 48, "union": false}, {})).next) {
      (cRecordObject(cRecordPointer(cRecordObject(cRecordPointer(attach, {"align": 8, "arrayAlign": 1, "fields": {"name": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 16, "pointer": true, "size": 8}, "prev": {"offset": 24, "pointer": true, "size": 8}, "source": {"native": "Int32Array", "offset": 12, "size": 4}, "type": {"native": "Int32Array", "offset": 8, "size": 4}, "usera": {"offset": 32, "pointer": true, "size": 8}, "userb": {"offset": 40, "pointer": true, "size": 8}}, "overlaps": false, "size": 48, "union": false}, {})).next, {"align": 8, "arrayAlign": 1, "fields": {"name": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 16, "pointer": true, "size": 8}, "prev": {"offset": 24, "pointer": true, "size": 8}, "source": {"native": "Int32Array", "offset": 12, "size": 4}, "type": {"native": "Int32Array", "offset": 8, "size": 4}, "usera": {"offset": 32, "pointer": true, "size": 8}, "userb": {"offset": 40, "pointer": true, "size": 8}}, "overlaps": false, "size": 48, "union": false}, {})).prev = r);
    }
    (cRecordObject(cRecordPointer(attach, {"align": 8, "arrayAlign": 1, "fields": {"name": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 16, "pointer": true, "size": 8}, "prev": {"offset": 24, "pointer": true, "size": 8}, "source": {"native": "Int32Array", "offset": 12, "size": 4}, "type": {"native": "Int32Array", "offset": 8, "size": 4}, "usera": {"offset": 32, "pointer": true, "size": 8}, "userb": {"offset": 40, "pointer": true, "size": 8}}, "overlaps": false, "size": 48, "union": false}, {})).next = r);
  }
  return i32(0);
}

// C/C++ source: source/build/src/vfs.cpp:1150
export function klistfree(rec) {
  let n;
  while (rec) {
    (n = cRecordObject(cRecordPointer(rec, {"align": 8, "arrayAlign": 1, "fields": {"name": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 16, "pointer": true, "size": 8}, "prev": {"offset": 24, "pointer": true, "size": 8}, "source": {"native": "Int32Array", "offset": 12, "size": 4}, "type": {"native": "Int32Array", "offset": 8, "size": 4}, "usera": {"offset": 32, "pointer": true, "size": 8}, "userb": {"offset": 40, "pointer": true, "size": 8}}, "overlaps": false, "size": 48, "union": false}, {})).next);
    xfree__header_13edfa973cd4(rec);
    (rec = n);
  }
}

// C/C++ source: source/build/src/vfs.cpp:1162
const __cxx_literal_645bee8d039cc37d5f3c = Uint8Array.from([46, 46, 0]);
let __static_klistpath_CUR_DIR = Uint8Array.from([46, 47, 0]);
const __cxx_literal_46c3ff67beee9a68ce5f = Uint8Array.from([47, 0]);
const __cxx_literal_f295003dc9e9e44613f1 = Uint8Array.from([47, 0]);
export function klistpath(_path, mask, type) {
  let rec, path, i, j, stackdepth, search, d, buf, dir, dirent, __cxx_scope_10_buf, __cxx_scope_11_i, __cxx_scope_12_j, ftype, __cxx_scope_14_buf, __cxx_scope_15_i, __cxx_scope_16_j, drives, drp, __cxx_lvalue_0;
  rec = null;
  __cxx_lvalue_0 = cRef(() => rec, __cxx_lvalue_2 => { rec = __cxx_lvalue_2; });
  (path = xstrdup__header_54caacf0b3b5(_path));
  {


    __source_control_0: for ((i = i32(0)); ((i32((cDeref(cPointerOffset(path, i, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == i32(46)) || (i32((cDeref(cPointerOffset(toupperlookup, (cDeref(cPointerOffset(path, i, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == i32(47))); ) {
      ((__cxx_lvalue_3) => { const previous = __cxx_lvalue_3.value; const next = i32((previous + 1)); __cxx_lvalue_3.value = next; return previous; })(cRef(() => i, __cxx_lvalue_4 => { i = __cxx_lvalue_4; }));
    }
    __source_control_1: for ((j = i32(0)); Boolean(((cDeref(cPointerOffset(path, j, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((cDeref(cPointerOffset(path, i, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255))); (((__cxx_lvalue_5) => { const previous = __cxx_lvalue_5.value; const next = i32((previous + 1)); __cxx_lvalue_5.value = next; return previous; })(cRef(() => j, __cxx_lvalue_6 => { j = __cxx_lvalue_6; })), ((__cxx_lvalue_7) => { const previous = __cxx_lvalue_7.value; const next = i32((previous + 1)); __cxx_lvalue_7.value = next; return previous; })(cRef(() => i, __cxx_lvalue_8 => { i = __cxx_lvalue_8; })))) {
      ;
    }
    __source_control_2: while (((j > 0) && (i32((cDeref(cPointerOffset(toupperlookup, (cDeref(cPointerOffset(path, i32((j - 1)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == i32(47)))) {
      ((__cxx_lvalue_9) => { const previous = __cxx_lvalue_9.value; const next = i32((previous - 1)); __cxx_lvalue_9.value = next; return previous; })(cRef(() => j, __cxx_lvalue_10 => { j = __cxx_lvalue_10; }));
    }
    ((cDeref(cPointerOffset(path, j, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(0) & 255)) & 255));
  }
  if ((Boolean((cDeref(path, Uint8Array).value)) && Boolean(i32((type & i32(2)))))) {
    if ((klistaddentry(__cxx_lvalue_0, __cxx_literal_645bee8d039cc37d5f3c, i32(2), i32(1)) < 0)) {
      xfree__header_13edfa973cd4(path);
      klistfree(rec);
      return null;
    }
  }
  __source_exit_failure: {
    if ((!Boolean(i32((type & i32(256)))))) {
      stackdepth = i32(1);

      search = null;
      d = (Boolean(__cxx_global_cell_787e3556986da6109d0447e0().value) ? _path : __static_klistpath_CUR_DIR);
      buf = cZeroAggregate({"array": "Uint8Array", "dims": [256]});


      __source_control_3: do {
        __source_exit_next: {
          if ((cPointerCompare(d, __static_klistpath_CUR_DIR, "==") && Boolean(i32((type & i32(8)))))) {
            break __source_exit_next;
          }
          strcpy(buf, d);
          if ((!Boolean(__cxx_global_cell_787e3556986da6109d0447e0().value))) {
            strcat(buf, path);
            if (Boolean((cDeref(path, Uint8Array).value))) {
              strcat(buf, __cxx_literal_46c3ff67beee9a68ce5f);
            }
          }
          (dir = Bopendir(buf));
          if (dir) {
            __source_control_4: while ((dirent = Breaddir(dir))) {
              if ((((i32((cDeref(cPointerOffset(cRecordObject(cRecordPointer(dirent, {"align": 8, "arrayAlign": 1, "fields": {"mode": {"native": "Uint32Array", "offset": 8, "size": 4}, "mtime": {"native": "Uint32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "namlen": {"native": "Uint16Array", "offset": 20, "size": 2}, "size": {"native": "Uint32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 24, "union": false}, {})).name, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == i32(46)) && (i32((cDeref(cPointerOffset(cRecordObject(cRecordPointer(dirent, {"align": 8, "arrayAlign": 1, "fields": {"mode": {"native": "Uint32Array", "offset": 8, "size": 4}, "mtime": {"native": "Uint32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "namlen": {"native": "Uint16Array", "offset": 20, "size": 2}, "size": {"native": "Uint32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 24, "union": false}, {})).name, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == 0)) || (((i32((cDeref(cPointerOffset(cRecordObject(cRecordPointer(dirent, {"align": 8, "arrayAlign": 1, "fields": {"mode": {"native": "Uint32Array", "offset": 8, "size": 4}, "mtime": {"native": "Uint32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "namlen": {"native": "Uint16Array", "offset": 20, "size": 2}, "size": {"native": "Uint32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 24, "union": false}, {})).name, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == i32(46)) && (i32((cDeref(cPointerOffset(cRecordObject(cRecordPointer(dirent, {"align": 8, "arrayAlign": 1, "fields": {"mode": {"native": "Uint32Array", "offset": 8, "size": 4}, "mtime": {"native": "Uint32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "namlen": {"native": "Uint16Array", "offset": 20, "size": 2}, "size": {"native": "Uint32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 24, "union": false}, {})).name, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == i32(46))) && (i32((cDeref(cPointerOffset(cRecordObject(cRecordPointer(dirent, {"align": 8, "arrayAlign": 1, "fields": {"mode": {"native": "Uint32Array", "offset": 8, "size": 4}, "mtime": {"native": "Uint32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "namlen": {"native": "Uint16Array", "offset": 20, "size": 2}, "size": {"native": "Uint32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 24, "union": false}, {})).name, 2, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == 0)))) {
                continue __source_control_4;
              }
              if ((Boolean(i32((type & i32(2)))) && (!Boolean(u32((cRecordObject(cRecordPointer(dirent, {"align": 8, "arrayAlign": 1, "fields": {"mode": {"native": "Uint32Array", "offset": 8, "size": 4}, "mtime": {"native": "Uint32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "namlen": {"native": "Uint16Array", "offset": 20, "size": 2}, "size": {"native": "Uint32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 24, "union": false}, {})).mode & u32(16384))))))) {
                continue __source_control_4;
              }
              if ((Boolean(i32((type & i32(1)))) && Boolean(u32((cRecordObject(cRecordPointer(dirent, {"align": 8, "arrayAlign": 1, "fields": {"mode": {"native": "Uint32Array", "offset": 8, "size": 4}, "mtime": {"native": "Uint32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "namlen": {"native": "Uint16Array", "offset": 20, "size": 2}, "size": {"native": "Uint32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 24, "union": false}, {})).mode & u32(16384)))))) {
                continue __source_control_4;
              }
              if ((!Boolean(wildmatch(cRecordObject(cRecordPointer(dirent, {"align": 8, "arrayAlign": 1, "fields": {"mode": {"native": "Uint32Array", "offset": 8, "size": 4}, "mtime": {"native": "Uint32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "namlen": {"native": "Uint16Array", "offset": 20, "size": 2}, "size": {"native": "Uint32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 24, "union": false}, {})).name, mask)))) {
                continue __source_control_4;
              }
              __source_control_5: switch (klistaddentry(__cxx_lvalue_0, cRecordObject(cRecordPointer(dirent, {"align": 8, "arrayAlign": 1, "fields": {"mode": {"native": "Uint32Array", "offset": 8, "size": 4}, "mtime": {"native": "Uint32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "namlen": {"native": "Uint16Array", "offset": 20, "size": 2}, "size": {"native": "Uint32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 24, "union": false}, {})).name, i32((Boolean(u32((cRecordObject(cRecordPointer(dirent, {"align": 8, "arrayAlign": 1, "fields": {"mode": {"native": "Uint32Array", "offset": 8, "size": 4}, "mtime": {"native": "Uint32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "namlen": {"native": "Uint16Array", "offset": 20, "size": 2}, "size": {"native": "Uint32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 24, "union": false}, {})).mode & u32(16384)))) ? 2 : 1)), stackdepth)) {
                case (-1): {
                  break __source_exit_failure;
                }
                default: {
                  break __source_control_5;
                }
              }
            }
            Bclosedir(dir);
          }
        }
        if (Boolean(__cxx_global_cell_787e3556986da6109d0447e0().value)) {
          break __source_control_3;
        }
        if ((!search)) {
          (search = __cxx_private_cell_8b2fddc852cc4e1abb4ae8af().value);
          (stackdepth = i32(2));
        } else {
          (search = cRecordObject(cRecordPointer(search, {"align": 8, "arrayAlign": 1, "fields": {"next": {"offset": 0, "pointer": true, "size": 8}, "path": {"offset": 8, "pointer": true, "size": 8}, "pathlen": {"native": "BigUint64Array", "offset": 16, "size": 8}, "user": {"native": "Int32Array", "offset": 24, "size": 4}}, "overlaps": false, "size": 32, "union": false}, {})).next);
          ((__cxx_lvalue_11) => { const previous = __cxx_lvalue_11.value; const next = i32((previous + 1)); __cxx_lvalue_11.value = next; return previous; })(cRef(() => stackdepth, __cxx_lvalue_12 => { stackdepth = __cxx_lvalue_12; }));
        }
        if (search) {
          (d = cRecordObject(cRecordPointer(search, {"align": 8, "arrayAlign": 1, "fields": {"next": {"offset": 0, "pointer": true, "size": 8}, "path": {"offset": 8, "pointer": true, "size": 8}, "pathlen": {"native": "BigUint64Array", "offset": 16, "size": 8}, "user": {"native": "Int32Array", "offset": 24, "size": 4}}, "overlaps": false, "size": 32, "union": false}, {})).path);
        }
      } while (search);
    }
    if ((!Boolean(i32((type & i32(8)))))) {
      if ((!Boolean(__cxx_global_cell_787e3556986da6109d0447e0().value))) {
        __cxx_scope_10_buf = cZeroAggregate({"array": "Uint8Array", "dims": [260]});



        strcpy(__cxx_scope_10_buf, path);
        if (Boolean((cDeref(path, Uint8Array).value))) {
          strcat(__cxx_scope_10_buf, __cxx_literal_f295003dc9e9e44613f1);
        }
        strcat(__cxx_scope_10_buf, mask);
        __source_control_6: for (kzfindfilestart(__cxx_scope_10_buf); Boolean(kzfindfile(__cxx_scope_10_buf)); ) {
          if ((i32((cDeref(cPointerOffset(__cxx_scope_10_buf, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) != i32(124))) {
            continue __source_control_6;
          }
          __source_control_7: for ((__cxx_scope_11_i = i32(1)); Boolean(((cDeref(cPointerOffset(__cxx_scope_10_buf, i32((__cxx_scope_11_i - 1)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((cDeref(cPointerOffset(__cxx_scope_10_buf, __cxx_scope_11_i, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255))); ((__cxx_lvalue_13) => { const previous = __cxx_lvalue_13.value; const next = i32((previous + 1)); __cxx_lvalue_13.value = next; return previous; })(cRef(() => __cxx_scope_11_i, __cxx_lvalue_14 => { __cxx_scope_11_i = __cxx_lvalue_14; }))) {

          }
          (__cxx_scope_11_i = i32((Number(__cxx_scope_11_i) - Number(2))));
          if ((__cxx_scope_11_i < 0)) {
            (__cxx_scope_11_i = i32(0));
          }
          if ((i32((cDeref(cPointerOffset(toupperlookup, (cDeref(cPointerOffset(__cxx_scope_10_buf, __cxx_scope_11_i, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == i32(47))) {
            (ftype = i32(2));
            ((cDeref(cPointerOffset(__cxx_scope_10_buf, __cxx_scope_11_i, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(0) & 255)) & 255));
          } else {
            (ftype = i32(1));
          }
          __source_control_8: for ((__cxx_scope_12_j = i32(0)); (Boolean((cDeref(cPointerOffset(__cxx_scope_10_buf, __cxx_scope_12_j, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) && Boolean((cDeref(cPointerOffset(path, __cxx_scope_12_j, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value))); ((__cxx_lvalue_15) => { const previous = __cxx_lvalue_15.value; const next = i32((previous + 1)); __cxx_lvalue_15.value = next; return previous; })(cRef(() => __cxx_scope_12_j, __cxx_lvalue_16 => { __cxx_scope_12_j = __cxx_lvalue_16; }))) {
            if ((i32((cDeref(cPointerOffset(toupperlookup, (cDeref(cPointerOffset(path, __cxx_scope_12_j, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == i32((cDeref(cPointerOffset(toupperlookup, (cDeref(cPointerOffset(__cxx_scope_10_buf, __cxx_scope_12_j, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))) {
              continue __source_control_8;
            }
            break __source_control_8;
          }
          if ((((!Boolean((cDeref(cPointerOffset(path, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value))) && Boolean((cDeref(cPointerOffset(__cxx_scope_10_buf, __cxx_scope_12_j, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value))) || ((!Boolean((cDeref(cPointerOffset(path, __cxx_scope_12_j, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value))) && (i32((cDeref(cPointerOffset(toupperlookup, (cDeref(cPointerOffset(__cxx_scope_10_buf, __cxx_scope_12_j, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == i32(47))))) {
            if ((__cxx_scope_12_j > 0)) {
              ((__cxx_lvalue_17) => { const previous = __cxx_lvalue_17.value; const next = i32((previous + 1)); __cxx_lvalue_17.value = next; return previous; })(cRef(() => __cxx_scope_12_j, __cxx_lvalue_18 => { __cxx_scope_12_j = __cxx_lvalue_18; }));
            }
            __source_control_9: for ((__cxx_scope_11_i = i32(0)); (Boolean(((cDeref(cPointerOffset(__cxx_scope_10_buf, __cxx_scope_11_i, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((cDeref(cPointerOffset(__cxx_scope_10_buf, __cxx_scope_12_j, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255))) && (i32((cDeref(cPointerOffset(toupperlookup, (cDeref(cPointerOffset(__cxx_scope_10_buf, __cxx_scope_12_j, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) != i32(47))); (((__cxx_lvalue_19) => { const previous = __cxx_lvalue_19.value; const next = i32((previous + 1)); __cxx_lvalue_19.value = next; return previous; })(cRef(() => __cxx_scope_11_i, __cxx_lvalue_20 => { __cxx_scope_11_i = __cxx_lvalue_20; })), ((__cxx_lvalue_21) => { const previous = __cxx_lvalue_21.value; const next = i32((previous + 1)); __cxx_lvalue_21.value = next; return previous; })(cRef(() => __cxx_scope_12_j, __cxx_lvalue_22 => { __cxx_scope_12_j = __cxx_lvalue_22; })))) {
              ;
            }
            if ((i32((cDeref(cPointerOffset(toupperlookup, (cDeref(cPointerOffset(__cxx_scope_10_buf, __cxx_scope_12_j, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == i32(47))) {
              continue __source_control_6;
            }
          } else {
            continue __source_control_6;
          }
          if ((Boolean(i32((type & i32(2)))) && (ftype != i32(2)))) {
            continue __source_control_6;
          }
          if ((Boolean(i32((type & i32(1)))) && (ftype != i32(1)))) {
            continue __source_control_6;
          }
          __source_control_10: switch (klistaddentry(__cxx_lvalue_0, __cxx_scope_10_buf, ftype, i32(2147483646))) {
            case (-1): {
              break __source_exit_failure;
            }
            default: {
              break __source_control_10;
            }
          }
        }
      }
    }
    if ((!Boolean(i32((type & i32(8)))))) {
      if ((((!Boolean(__cxx_global_cell_787e3556986da6109d0447e0().value)) && (!Boolean((cDeref(path, Uint8Array).value)))) && Boolean(i32((type & i32(1)))))) {
        __cxx_scope_14_buf = cZeroAggregate({"array": "Uint8Array", "dims": [13]});


        ((cDeref(cPointerOffset(__cxx_scope_14_buf, 12, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(0) & 255)) & 255));
        __source_control_11: for ((__cxx_scope_15_i = i32(0)); (__cxx_scope_15_i < 8); ((__cxx_lvalue_23) => { const previous = __cxx_lvalue_23.value; const next = i32((previous + 1)); __cxx_lvalue_23.value = next; return previous; })(cRef(() => __cxx_scope_15_i, __cxx_lvalue_24 => { __cxx_scope_15_i = __cxx_lvalue_24; }))) {
          if (((cDeref(cPointerOffset(__cxx_private_cell_b077455bc7a20cfc79ce2bba().value, __cxx_scope_15_i, BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array).value) == i64((-1)))) {
            continue __source_control_11;
          }
          __source_control_12: for ((__cxx_scope_16_j = i32(((cDeref(cPointerOffset(__cxx_private_cell_40e26d32b6ca71fd78ad3b32().value, __cxx_scope_15_i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) - 1))); (__cxx_scope_16_j >= 0); ((__cxx_lvalue_25) => { const previous = __cxx_lvalue_25.value; const next = i32((previous - 1)); __cxx_lvalue_25.value = next; return previous; })(cRef(() => __cxx_scope_16_j, __cxx_lvalue_26 => { __cxx_scope_16_j = __cxx_lvalue_26; }))) {
            memcpy(__cxx_scope_14_buf, cPointerOffset((cPointerElementRef(gfilelist, __cxx_scope_15_i).value), i32((__cxx_scope_16_j << 4)), Uint8Array.BYTES_PER_ELEMENT), u64(12));
            if ((!Boolean(wildmatch(__cxx_scope_14_buf, mask)))) {
              continue __source_control_12;
            }
            __source_control_13: switch (klistaddentry(__cxx_lvalue_0, __cxx_scope_14_buf, i32(1), i32(2147483647))) {
              case (-1): {
                break __source_exit_failure;
              }
              default: {
                break __source_control_13;
              }
            }
          }
        }
      }
    }
    if ((Boolean(__cxx_global_cell_787e3556986da6109d0447e0().value) && Boolean(i32((type & i32(4)))))) {


      (drives = Bgetsystemdrives());
      if (drives) {
        __source_control_14: for ((drp = drives); Boolean((cDeref(drp, Uint8Array).value)); (drp = cPointerOffset(drp, u64((BigInt(strlen(drp)) + BigInt(u64(1)))), Uint8Array.BYTES_PER_ELEMENT))) {
          if ((klistaddentry(__cxx_lvalue_0, drp, i32(4), i32(0)) < 0)) {
            xfree__header_13edfa973cd4(drives);
            break __source_exit_failure;
          }
        }
        xfree__header_13edfa973cd4(drives);
      }
    }
    xfree__header_13edfa973cd4(path);
    return rec;
  }
  xfree__header_13edfa973cd4(path);
  klistfree(rec);
  return null;
}

// C/C++ source: source/build/src/vfs.cpp:1425
export function kdfread_func(fil, outbuf, length) {
  return i32(kread(i32(fil), outbuf, length));
}

// C/C++ source: source/build/src/vfs.cpp:1430
export function dfwrite_func(fp, inbuf, length) {
  fwrite(inbuf, u64(length), u64(1), cRecordPointer(cSourceAddresses.decode(fp), {"align": 8, "arrayAlign": 1, "fields": {"_IO_backup_base": {"offset": 80, "pointer": true, "size": 8}, "_IO_buf_base": {"offset": 56, "pointer": true, "size": 8}, "_IO_buf_end": {"offset": 64, "pointer": true, "size": 8}, "_IO_read_base": {"offset": 24, "pointer": true, "size": 8}, "_IO_read_end": {"offset": 16, "pointer": true, "size": 8}, "_IO_read_ptr": {"offset": 8, "pointer": true, "size": 8}, "_IO_save_base": {"offset": 72, "pointer": true, "size": 8}, "_IO_save_end": {"offset": 88, "pointer": true, "size": 8}, "_IO_write_base": {"offset": 32, "pointer": true, "size": 8}, "_IO_write_end": {"offset": 48, "pointer": true, "size": 8}, "_IO_write_ptr": {"offset": 40, "pointer": true, "size": 8}, "__pad5": {"native": "BigUint64Array", "offset": 184, "size": 8}, "_chain": {"offset": 104, "pointer": true, "size": 8}, "_codecvt": {"offset": 152, "pointer": true, "size": 8}, "_cur_column": {"native": "Uint16Array", "offset": 128, "size": 2}, "_fileno": {"native": "Int32Array", "offset": 112, "size": 4}, "_flags": {"native": "Int32Array", "offset": 0, "size": 4}, "_flags2": {"native": "Int32Array", "offset": 116, "size": 4}, "_freeres_buf": {"offset": 176, "pointer": true, "size": 8}, "_freeres_list": {"offset": 168, "pointer": true, "size": 8}, "_lock": {"offset": 136, "pointer": true, "size": 8}, "_markers": {"offset": 96, "pointer": true, "size": 8}, "_mode": {"native": "Int32Array", "offset": 192, "size": 4}, "_offset": {"native": "BigInt64Array", "offset": 144, "size": 8}, "_old_offset": {"native": "BigInt64Array", "offset": 120, "size": 8}, "_shortbuf": {"length": 1, "native": "Uint8Array", "offset": 131, "size": 1}, "_unused2": {"length": 20, "native": "Uint8Array", "offset": 196, "size": 20}, "_vtable_offset": {"native": "Int8Array", "offset": 130, "size": 1}, "_wide_data": {"offset": 160, "pointer": true, "size": 8}}, "overlaps": false, "size": 216, "union": false}, {}));
}

// C/C++ source: source/build/src/vfs.cpp:1448
export function kdfread_LZ4(buffer, dasizeof, count, fil) {
  let leng;
  const __cxx_lvalue_0 = cScalarStorage(Int32Array);
  if (((kread(fil, __cxx_lvalue_0, i32(4)) != i32(4)) || (__cxx_lvalue_0.value < 0))) {
    return i32((-1));
  }
  (__cxx_lvalue_0.value = i32(B_PASS32__header_416cc10abcf4(__cxx_lvalue_0.value)));
  let pCompressedData = __cxx_private_cell_614b4dff60c54bf98cd5634e().value;
  if ((i64(__cxx_lvalue_0.value) > i64(ARRAY_SIZE__header_d8336ed114b0(__cxx_private_cell_614b4dff60c54bf98cd5634e().value)))) {
    (pCompressedData = cTypedPointer(xaligned_alloc__header_dfccd4cb96f1(u64(16), u64(__cxx_lvalue_0.value)), Uint8Array));
  }
  if ((kread(fil, pCompressedData, __cxx_lvalue_0.value) != i32(__cxx_lvalue_0.value))) {
    return i32((-1));
  }
  let decompressedLength = i32(LZ4_decompress_safe(pCompressedData, cTypedPointer(buffer, Uint8Array), __cxx_lvalue_0.value, i32(Math.imul(dasizeof, count))));
  if (cPointerCompare(pCompressedData, __cxx_private_cell_614b4dff60c54bf98cd5634e().value, "!=")) {
    xaligned_free__header_de7cc18f4b2c(pCompressedData);
  }
  return i32(Math.trunc(decompressedLength / dasizeof));
}

// C/C++ source: source/build/src/vfs.cpp:1480
export function dfwrite_LZ4(buffer, dasizeof, count, fil) {
  let pCompressedData = __cxx_private_cell_614b4dff60c54bf98cd5634e().value;
  let maxCompressedSize = i32(LZ4_compressBound(i32(Math.imul(dasizeof, count))));
  if ((i64(maxCompressedSize) > i64(ARRAY_SIZE__header_d8336ed114b0(__cxx_private_cell_614b4dff60c54bf98cd5634e().value)))) {
    (pCompressedData = cTypedPointer(xaligned_alloc__header_dfccd4cb96f1(u64(16), u64(maxCompressedSize)), Uint8Array));
  }
  let leng = i32(LZ4_compress_fast(cTypedPointer(buffer, Uint8Array), pCompressedData, i32(Math.imul(dasizeof, count)), maxCompressedSize, __cxx_global_cell_2e953df8db08c3fc6f0c3e07().value));
  let swleng = i32(B_PASS32__header_416cc10abcf4(leng));
  const __cxx_lvalue_0 = cScalarStorage(Int32Array, swleng);
  fwrite(__cxx_lvalue_0, 4, u64(1), fil);
  fwrite(pCompressedData, u64(leng), u64(1), fil);
  if (cPointerCompare(pCompressedData, __cxx_private_cell_614b4dff60c54bf98cd5634e().value, "!=")) {
    xaligned_free__header_de7cc18f4b2c(pCompressedData);
  }
}

// C/C++ source: source/build/include/compat.h:1413
export function xrealloc__header_9fb083e4a075(ptr, size) {
  let newptr = Realloc__cxx_static_478d5da25b6b3923(__cxx_global_cell_11016d3c7177543e564ab46c().value, ptr, size, u64(16));
  if ((cPointerCompare(newptr, null, "!=") || (size == u64(0)))) {
    return newptr;
  }
  handle_memerr(i32(size));
  __builtin_unreachable();
}

// C/C++ source: source/build/include/compat.h:1378
export function xstrdup__header_54caacf0b3b5(s) {
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

// C/C++ source: source/build/include/compat.h:1449
export function xfree__header_13edfa973cd4(ptr) {
  Free__cxx_static_0dfd3f42f0dc2c05(__cxx_global_cell_11016d3c7177543e564ab46c().value, ptr);
}

// C/C++ source: source/build/include/compat.h:1392
export function xmalloc__header_74ee7b637863(size) {
  let ptr = Alloc__cxx_static_e0036cfb06bcfe42(__cxx_global_cell_11016d3c7177543e564ab46c().value, size, u64(16));
  if (cPointerCompare(ptr, null, "!=")) {
    return ptr;
  }
  handle_memerr(i32(size));
  __builtin_unreachable();
}

export function SILENCE_UNUSED__header_5119f34568fc(arg0, arg1) {

}

// C/C++ source: source/build/include/vfs.h:140
export function buildvfs_exists__header_a5d5ccb242c5(path) {
  let st = cZeroAggregate({"byteRecord": {"align": 8, "arrayAlign": 8, "fields": {"__glibc_reserved": {"length": 3, "native": "BigInt64Array", "offset": 120, "size": 24}, "__pad0": {"native": "Int32Array", "offset": 36, "size": 4}, "st_atim": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"tv_nsec": {"native": "BigInt64Array", "offset": 8, "size": 8}, "tv_sec": {"native": "BigInt64Array", "offset": 0, "size": 8}}, "overlaps": false, "size": 16, "union": false}, "offset": 72}, "st_blksize": {"native": "BigInt64Array", "offset": 56, "size": 8}, "st_blocks": {"native": "BigInt64Array", "offset": 64, "size": 8}, "st_ctim": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"tv_nsec": {"native": "BigInt64Array", "offset": 8, "size": 8}, "tv_sec": {"native": "BigInt64Array", "offset": 0, "size": 8}}, "overlaps": false, "size": 16, "union": false}, "offset": 104}, "st_dev": {"native": "BigUint64Array", "offset": 0, "size": 8}, "st_gid": {"native": "Uint32Array", "offset": 32, "size": 4}, "st_ino": {"native": "BigUint64Array", "offset": 8, "size": 8}, "st_mode": {"native": "Uint32Array", "offset": 24, "size": 4}, "st_mtim": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"tv_nsec": {"native": "BigInt64Array", "offset": 8, "size": 8}, "tv_sec": {"native": "BigInt64Array", "offset": 0, "size": 8}}, "overlaps": false, "size": 16, "union": false}, "offset": 88}, "st_nlink": {"native": "BigUint64Array", "offset": 16, "size": 8}, "st_rdev": {"native": "BigUint64Array", "offset": 40, "size": 8}, "st_size": {"native": "BigInt64Array", "offset": 48, "size": 8}, "st_uid": {"native": "Uint32Array", "offset": 28, "size": 4}}, "overlaps": false, "size": 144, "union": false}}, {});
  return i32((!Boolean(stat(path, st))));
}

// C/C++ source: @sysroot/usr/include/c++/12/bits/stl_algobase.h:254
export function max__template_b1cfaf2244c73238(__a, __b) {
  if ((__a.value < __b.value)) {
    return __b;
  }
  return __a;
}

export function B_PASS32__header_416cc10abcf4(x) {
  return i32(x);
}

// C/C++ source: source/build/include/kplib.h:44
export function kztell__header_df1c549f3c13() {
  return i32((__cxx_global_cell_0c0d9a71eef382369e188fb4().value.fil ? __cxx_global_cell_0c0d9a71eef382369e188fb4().value.pos : (-1)));
}

// C/C++ source: source/build/include/kplib.h:48
export function kzclose__header_fa818b4f2176() {
  do {
    if (__cxx_global_cell_0c0d9a71eef382369e188fb4().value.fil) {
      fclose(__cxx_global_cell_0c0d9a71eef382369e188fb4().value.fil);
      (__cxx_global_cell_0c0d9a71eef382369e188fb4().value.fil = cRecordPointer(null, {"align": 8, "arrayAlign": 1, "fields": {"_IO_backup_base": {"offset": 80, "pointer": true, "size": 8}, "_IO_buf_base": {"offset": 56, "pointer": true, "size": 8}, "_IO_buf_end": {"offset": 64, "pointer": true, "size": 8}, "_IO_read_base": {"offset": 24, "pointer": true, "size": 8}, "_IO_read_end": {"offset": 16, "pointer": true, "size": 8}, "_IO_read_ptr": {"offset": 8, "pointer": true, "size": 8}, "_IO_save_base": {"offset": 72, "pointer": true, "size": 8}, "_IO_save_end": {"offset": 88, "pointer": true, "size": 8}, "_IO_write_base": {"offset": 32, "pointer": true, "size": 8}, "_IO_write_end": {"offset": 48, "pointer": true, "size": 8}, "_IO_write_ptr": {"offset": 40, "pointer": true, "size": 8}, "__pad5": {"native": "BigUint64Array", "offset": 184, "size": 8}, "_chain": {"offset": 104, "pointer": true, "size": 8}, "_codecvt": {"offset": 152, "pointer": true, "size": 8}, "_cur_column": {"native": "Uint16Array", "offset": 128, "size": 2}, "_fileno": {"native": "Int32Array", "offset": 112, "size": 4}, "_flags": {"native": "Int32Array", "offset": 0, "size": 4}, "_flags2": {"native": "Int32Array", "offset": 116, "size": 4}, "_freeres_buf": {"offset": 176, "pointer": true, "size": 8}, "_freeres_list": {"offset": 168, "pointer": true, "size": 8}, "_lock": {"offset": 136, "pointer": true, "size": 8}, "_markers": {"offset": 96, "pointer": true, "size": 8}, "_mode": {"native": "Int32Array", "offset": 192, "size": 4}, "_offset": {"native": "BigInt64Array", "offset": 144, "size": 8}, "_old_offset": {"native": "BigInt64Array", "offset": 120, "size": 8}, "_shortbuf": {"length": 1, "native": "Uint8Array", "offset": 131, "size": 1}, "_unused2": {"length": 20, "native": "Uint8Array", "offset": 196, "size": 20}, "_vtable_offset": {"native": "Int8Array", "offset": 130, "size": 1}, "_wide_data": {"offset": 160, "pointer": true, "size": 8}}, "overlaps": false, "size": 216, "union": false}, {}));
    }
  } while (Boolean(0));
}

// C/C++ source: source/build/include/compat.h:1367
export function engineDestroyAllocator__header_79eabc223f85() {
  Destroy__cxx_static_777d0ae31c789182(__cxx_global_cell_11016d3c7177543e564ab46c().value);
}

// C/C++ source: @sysroot/usr/include/c++/12/bits/stl_algobase.h:230
export function min__template_774131ccff66371d(__a, __b) {
  if ((__b.value < __a.value)) {
    return __b;
  }
  return __a;
}

// C/C++ source: source/build/include/vfs.h:105
export function buildvfs_length__header_e629f4d97284(fd) {
  let st = cZeroAggregate({"byteRecord": {"align": 8, "arrayAlign": 8, "fields": {"__glibc_reserved": {"length": 3, "native": "BigInt64Array", "offset": 120, "size": 24}, "__pad0": {"native": "Int32Array", "offset": 36, "size": 4}, "st_atim": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"tv_nsec": {"native": "BigInt64Array", "offset": 8, "size": 8}, "tv_sec": {"native": "BigInt64Array", "offset": 0, "size": 8}}, "overlaps": false, "size": 16, "union": false}, "offset": 72}, "st_blksize": {"native": "BigInt64Array", "offset": 56, "size": 8}, "st_blocks": {"native": "BigInt64Array", "offset": 64, "size": 8}, "st_ctim": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"tv_nsec": {"native": "BigInt64Array", "offset": 8, "size": 8}, "tv_sec": {"native": "BigInt64Array", "offset": 0, "size": 8}}, "overlaps": false, "size": 16, "union": false}, "offset": 104}, "st_dev": {"native": "BigUint64Array", "offset": 0, "size": 8}, "st_gid": {"native": "Uint32Array", "offset": 32, "size": 4}, "st_ino": {"native": "BigUint64Array", "offset": 8, "size": 8}, "st_mode": {"native": "Uint32Array", "offset": 24, "size": 4}, "st_mtim": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"tv_nsec": {"native": "BigInt64Array", "offset": 8, "size": 8}, "tv_sec": {"native": "BigInt64Array", "offset": 0, "size": 8}}, "overlaps": false, "size": 16, "union": false}, "offset": 88}, "st_nlink": {"native": "BigUint64Array", "offset": 16, "size": 8}, "st_rdev": {"native": "BigUint64Array", "offset": 40, "size": 8}, "st_size": {"native": "BigInt64Array", "offset": 48, "size": 8}, "st_uid": {"native": "Uint32Array", "offset": 28, "size": 4}}, "overlaps": false, "size": 144, "union": false}}, {});
  return i64(((fstat(fd, st) < 0) ? i64((-1)) : st.st_size));
}

// C/C++ source: source/build/include/kplib.h:46
export function kzfilelength__header_fa0b046b8508() {
  return i32((__cxx_global_cell_0c0d9a71eef382369e188fb4().value.fil ? __cxx_global_cell_0c0d9a71eef382369e188fb4().value.leng : 0));
}

export function ARRAY_SIZE__header_d8336ed114b0(arg0) {
  return u64(131072n);
}

// C/C++ source: source/build/include/compat.h:1428
export function xaligned_alloc__header_dfccd4cb96f1(alignment, size) {
  let ptr = Alloc__cxx_static_e0036cfb06bcfe42(__cxx_global_cell_11016d3c7177543e564ab46c().value, size, alignment);
  if (cPointerCompare(ptr, null, "!=")) {
    return ptr;
  }
  handle_memerr(i32(size));
  __builtin_unreachable();
}

// C/C++ source: source/build/include/compat.h:1450
export function xaligned_free__header_de7cc18f4b2c(ptr) {
  Free__cxx_static_0dfd3f42f0dc2c05(__cxx_global_cell_11016d3c7177543e564ab46c().value, ptr);
}
