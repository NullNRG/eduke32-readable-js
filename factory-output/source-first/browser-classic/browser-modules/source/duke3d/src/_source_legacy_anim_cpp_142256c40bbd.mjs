// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/duke3d/src/anim.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
import { Alloc__cxx_static_e0036cfb06bcfe42 } from "../../build/src/smmalloc_generic.cpp.mjs";
import { ClockTicks } from "../../build/src/osd.cpp.mjs";
import { Free__cxx_static_0dfd3f42f0dc2c05 } from "../../build/src/smmalloc_generic.cpp.mjs";
import { divtable64 } from "../../build/src/pragmas.cpp.mjs";
import { __cxx_global_cell_11016d3c7177543e564ab46c } from "../../build/src/compat.cpp.mjs";
import { handle_memerr } from "../../build/src/compat.cpp.mjs";
import { hash_add } from "../../build/src/hash.cpp.mjs";
import { hash_findcase } from "../../build/src/hash.cpp.mjs";
import { __cxx_global_cell_f8287b2e627d0e3f51b90c55 } from "../../build/src/pragmas.cpp.mjs";
import { libdivide_s64_do } from "../../../browser-abi/libdivide_source.mjs";
import { libdivide_s64_gen } from "../../../browser-abi/libdivide_provider.mjs";
import { maybe_append_ext } from "../../build/src/common.cpp.mjs";
import { memset } from "../../../browser-abi/libc_provider.mjs";
import { strlen } from "../../../browser-abi/libc_provider.mjs";

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
export const fix16_rad_to_deg_mult__header_global_dbbea3800cc879fb = i32(3754936);
function __cxx_static_address_f7227c297010fdb25e2fa986() {
  return __cxx_static_address_f7227c297010fdb25e2fa986.reference || (__cxx_static_address_f7227c297010fdb25e2fa986.reference = {
    __cReference: true,
    get value() { return fix16_rad_to_deg_mult__header_global_dbbea3800cc879fb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:114
export const fix16_deg_to_rad_mult__header_global_4bccb5948ea221bf = i32(1144);
function __cxx_static_address_b9343b2f7c1827e35e03ae20() {
  return __cxx_static_address_b9343b2f7c1827e35e03ae20.reference || (__cxx_static_address_b9343b2f7c1827e35e03ae20.reference = {
    __cReference: true,
    get value() { return fix16_deg_to_rad_mult__header_global_4bccb5948ea221bf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:43
export const KICK_HIT____header_global_40ae1f3dfb4c4cf5 = ((u32(((u32(0) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5531a475c09648cb0b9b3732() {
  return __cxx_static_address_5531a475c09648cb0b9b3732.reference || (__cxx_static_address_5531a475c09648cb0b9b3732.reference = {
    __cReference: true,
    get value() { return KICK_HIT____header_global_40ae1f3dfb4c4cf5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:44
export const PISTOL_RICOCHET____header_global_9269a08515e7c1dc = ((u32(((u32(1) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_39ec3af0370eb43ed19aa9ee() {
  return __cxx_static_address_39ec3af0370eb43ed19aa9ee.reference || (__cxx_static_address_39ec3af0370eb43ed19aa9ee.reference = {
    __cReference: true,
    get value() { return PISTOL_RICOCHET____header_global_9269a08515e7c1dc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:45
export const PISTOL_BODYHIT____header_global_dddd16b3216a3c3b = ((u32(((u32(2) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4b5797bcb5992f63528a8f02() {
  return __cxx_static_address_4b5797bcb5992f63528a8f02.reference || (__cxx_static_address_4b5797bcb5992f63528a8f02.reference = {
    __cReference: true,
    get value() { return PISTOL_BODYHIT____header_global_dddd16b3216a3c3b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:46
export const PISTOL_FIRE____header_global_bc9b411c17ab60db = ((u32(((u32(3) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e1357276f6353420fe01fe4e() {
  return __cxx_static_address_e1357276f6353420fe01fe4e.reference || (__cxx_static_address_e1357276f6353420fe01fe4e.reference = {
    __cReference: true,
    get value() { return PISTOL_FIRE____header_global_bc9b411c17ab60db; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:47
export const EJECT_CLIP____header_global_24ff50b03c19e675 = ((u32(((u32(4) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_36e84b2e72bcf3d6e82d7c24() {
  return __cxx_static_address_36e84b2e72bcf3d6e82d7c24.reference || (__cxx_static_address_36e84b2e72bcf3d6e82d7c24.reference = {
    __cReference: true,
    get value() { return EJECT_CLIP____header_global_24ff50b03c19e675; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:48
export const INSERT_CLIP____header_global_efb703d64029eaf5 = ((u32(((u32(5) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0c1be5da270f8b18b401722f() {
  return __cxx_static_address_0c1be5da270f8b18b401722f.reference || (__cxx_static_address_0c1be5da270f8b18b401722f.reference = {
    __cReference: true,
    get value() { return INSERT_CLIP____header_global_efb703d64029eaf5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:49
export const CHAINGUN_FIRE____header_global_f7b5ec4a9d62f1fa = ((u32(((u32(6) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3674056777c0b7ab4c3ad9de() {
  return __cxx_static_address_3674056777c0b7ab4c3ad9de.reference || (__cxx_static_address_3674056777c0b7ab4c3ad9de.reference = {
    __cReference: true,
    get value() { return CHAINGUN_FIRE____header_global_f7b5ec4a9d62f1fa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:50
export const RPG_SHOOT____header_global_3cdf6e6ac836525f = ((u32(((u32(7) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_581b57d39444f827f22e7b85() {
  return __cxx_static_address_581b57d39444f827f22e7b85.reference || (__cxx_static_address_581b57d39444f827f22e7b85.reference = {
    __cReference: true,
    get value() { return RPG_SHOOT____header_global_3cdf6e6ac836525f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:51
export const POOLBALLHIT____header_global_2a8b652406aa3e12 = ((u32(((u32(8) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0f7011b603e57a25b891e467() {
  return __cxx_static_address_0f7011b603e57a25b891e467.reference || (__cxx_static_address_0f7011b603e57a25b891e467.reference = {
    __cReference: true,
    get value() { return POOLBALLHIT____header_global_2a8b652406aa3e12; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:52
export const RPG_EXPLODE____header_global_5104fb845bee6dd9 = ((u32(((u32(9) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0720f086d7e95dacd146e81b() {
  return __cxx_static_address_0720f086d7e95dacd146e81b.reference || (__cxx_static_address_0720f086d7e95dacd146e81b.reference = {
    __cReference: true,
    get value() { return RPG_EXPLODE____header_global_5104fb845bee6dd9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:53
export const CAT_FIRE____header_global_c4053068a65db164 = ((u32(((u32(10) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8aa2f3a8ac24d0e5721dcec9() {
  return __cxx_static_address_8aa2f3a8ac24d0e5721dcec9.reference || (__cxx_static_address_8aa2f3a8ac24d0e5721dcec9.reference = {
    __cReference: true,
    get value() { return CAT_FIRE____header_global_c4053068a65db164; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:54
export const SHRINKER_FIRE____header_global_e8533cac21edcac4 = ((u32(((u32(11) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7ae2ffdeb280b5fc259aa776() {
  return __cxx_static_address_7ae2ffdeb280b5fc259aa776.reference || (__cxx_static_address_7ae2ffdeb280b5fc259aa776.reference = {
    __cReference: true,
    get value() { return SHRINKER_FIRE____header_global_e8533cac21edcac4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:55
export const PIPEBOMB_BOUNCE____header_global_0f1949d5427ea1d2 = ((u32(((u32(13) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e90241d5ea775a9c19fe39af() {
  return __cxx_static_address_e90241d5ea775a9c19fe39af.reference || (__cxx_static_address_e90241d5ea775a9c19fe39af.reference = {
    __cReference: true,
    get value() { return PIPEBOMB_BOUNCE____header_global_0f1949d5427ea1d2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:56
export const PIPEBOMB_EXPLODE____header_global_ded71c7efded2bba = ((u32(((u32(14) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2165d7d5ebc1f712b0b9af66() {
  return __cxx_static_address_2165d7d5ebc1f712b0b9af66.reference || (__cxx_static_address_2165d7d5ebc1f712b0b9af66.reference = {
    __cReference: true,
    get value() { return PIPEBOMB_EXPLODE____header_global_ded71c7efded2bba; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:57
export const LASERTRIP_ONWALL____header_global_bfda23b2da86b2e8 = ((u32(((u32(15) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2c6a163279f64b5d7993016a() {
  return __cxx_static_address_2c6a163279f64b5d7993016a.reference || (__cxx_static_address_2c6a163279f64b5d7993016a.reference = {
    __cReference: true,
    get value() { return LASERTRIP_ONWALL____header_global_bfda23b2da86b2e8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:58
export const LASERTRIP_ARMING____header_global_f0f1c8206cce1dd8 = ((u32(((u32(16) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_585dc655dda5525af8b7cdef() {
  return __cxx_static_address_585dc655dda5525af8b7cdef.reference || (__cxx_static_address_585dc655dda5525af8b7cdef.reference = {
    __cReference: true,
    get value() { return LASERTRIP_ARMING____header_global_f0f1c8206cce1dd8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:59
export const LASERTRIP_EXPLODE____header_global_13d63ec2778e0c96 = ((u32(((u32(17) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5a38981de555b51f598d394a() {
  return __cxx_static_address_5a38981de555b51f598d394a.reference || (__cxx_static_address_5a38981de555b51f598d394a.reference = {
    __cReference: true,
    get value() { return LASERTRIP_EXPLODE____header_global_13d63ec2778e0c96; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:60
export const VENT_BUST____header_global_83729c4753b8d0fd = ((u32(((u32(18) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ab651952dd2c4a1d4652259d() {
  return __cxx_static_address_ab651952dd2c4a1d4652259d.reference || (__cxx_static_address_ab651952dd2c4a1d4652259d.reference = {
    __cReference: true,
    get value() { return VENT_BUST____header_global_83729c4753b8d0fd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:61
export const GLASS_BREAKING____header_global_68f6abfb2fc54775 = ((u32(((u32(19) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ece12b868aeb2b45e439f12d() {
  return __cxx_static_address_ece12b868aeb2b45e439f12d.reference || (__cxx_static_address_ece12b868aeb2b45e439f12d.reference = {
    __cReference: true,
    get value() { return GLASS_BREAKING____header_global_68f6abfb2fc54775; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:62
export const GLASS_HEAVYBREAK____header_global_5eacc147b3cc831c = ((u32(((u32(20) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fb3460cf79bf993d9fb086ce() {
  return __cxx_static_address_fb3460cf79bf993d9fb086ce.reference || (__cxx_static_address_fb3460cf79bf993d9fb086ce.reference = {
    __cReference: true,
    get value() { return GLASS_HEAVYBREAK____header_global_5eacc147b3cc831c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:63
export const SHORT_CIRCUIT____header_global_5de7f76bf3eb5d03 = ((u32(((u32(21) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9c9af5de58a6c3e775387687() {
  return __cxx_static_address_9c9af5de58a6c3e775387687.reference || (__cxx_static_address_9c9af5de58a6c3e775387687.reference = {
    __cReference: true,
    get value() { return SHORT_CIRCUIT____header_global_5de7f76bf3eb5d03; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:64
export const ITEM_SPLASH____header_global_cf6f5b81fb550239 = ((u32(((u32(22) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6d5059b7b480111fee1b9882() {
  return __cxx_static_address_6d5059b7b480111fee1b9882.reference || (__cxx_static_address_6d5059b7b480111fee1b9882.reference = {
    __cReference: true,
    get value() { return ITEM_SPLASH____header_global_cf6f5b81fb550239; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:65
export const DUKE_GASP____header_global_964c014a48349a74 = ((u32(((u32(25) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_159aa726fd130b70cf5b26ec() {
  return __cxx_static_address_159aa726fd130b70cf5b26ec.reference || (__cxx_static_address_159aa726fd130b70cf5b26ec.reference = {
    __cReference: true,
    get value() { return DUKE_GASP____header_global_964c014a48349a74; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:66
export const SLIM_RECOG____header_global_a6dee729aa6af233 = ((u32(((u32(26) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2f87fa2de0f10c4ca77ea747() {
  return __cxx_static_address_2f87fa2de0f10c4ca77ea747.reference || (__cxx_static_address_2f87fa2de0f10c4ca77ea747.reference = {
    __cReference: true,
    get value() { return SLIM_RECOG____header_global_a6dee729aa6af233; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:67
export const DUKE_URINATE____header_global_b7d1ce326bdeb669 = ((u32(((u32(28) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a0a2260b9b0ef390b4b3ce23() {
  return __cxx_static_address_a0a2260b9b0ef390b4b3ce23.reference || (__cxx_static_address_a0a2260b9b0ef390b4b3ce23.reference = {
    __cReference: true,
    get value() { return DUKE_URINATE____header_global_b7d1ce326bdeb669; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:68
export const ENDSEQVOL3SND2____header_global_9da3183b24e3208f = ((u32(((u32(29) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1b0e08a569af222c6ad8b2ae() {
  return __cxx_static_address_1b0e08a569af222c6ad8b2ae.reference || (__cxx_static_address_1b0e08a569af222c6ad8b2ae.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND2____header_global_9da3183b24e3208f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:69
export const ENDSEQVOL3SND3____header_global_a561c201ea9876c9 = ((u32(((u32(30) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c3236062861715ee78857cf3() {
  return __cxx_static_address_c3236062861715ee78857cf3.reference || (__cxx_static_address_c3236062861715ee78857cf3.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND3____header_global_a561c201ea9876c9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:70
export const DUKE_CRACK____header_global_ea1f851fda84bf1d = ((u32(((u32(33) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a32f42594c69fa8dd3eaa5fa() {
  return __cxx_static_address_a32f42594c69fa8dd3eaa5fa.reference || (__cxx_static_address_a32f42594c69fa8dd3eaa5fa.reference = {
    __cReference: true,
    get value() { return DUKE_CRACK____header_global_ea1f851fda84bf1d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:71
export const SLIM_ATTACK____header_global_0db9c9884a7901cc = ((u32(((u32(34) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_23aaeddfa0500f193a5b6b39() {
  return __cxx_static_address_23aaeddfa0500f193a5b6b39.reference || (__cxx_static_address_23aaeddfa0500f193a5b6b39.reference = {
    __cReference: true,
    get value() { return SLIM_ATTACK____header_global_0db9c9884a7901cc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:72
export const SOMETHINGHITFORCE____header_global_2e1c72039c75ae07 = ((u32(((u32(35) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0717230ebe39a65cd69bdebd() {
  return __cxx_static_address_0717230ebe39a65cd69bdebd.reference || (__cxx_static_address_0717230ebe39a65cd69bdebd.reference = {
    __cReference: true,
    get value() { return SOMETHINGHITFORCE____header_global_2e1c72039c75ae07; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:73
export const DUKE_DRINKING____header_global_220bed34d31ad1b3 = ((u32(((u32(36) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bfdff3c2951ba584a640bbe9() {
  return __cxx_static_address_bfdff3c2951ba584a640bbe9.reference || (__cxx_static_address_bfdff3c2951ba584a640bbe9.reference = {
    __cReference: true,
    get value() { return DUKE_DRINKING____header_global_220bed34d31ad1b3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:74
export const DUKE_GRUNT____header_global_1aebe1fb810376c7 = ((u32(((u32(38) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_892695d1a71917cf95836dc4() {
  return __cxx_static_address_892695d1a71917cf95836dc4.reference || (__cxx_static_address_892695d1a71917cf95836dc4.reference = {
    __cReference: true,
    get value() { return DUKE_GRUNT____header_global_1aebe1fb810376c7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:75
export const DUKE_HARTBEAT____header_global_fb4c67f3c15f858f = ((u32(((u32(39) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_639e5e7bea6574d830305ba5() {
  return __cxx_static_address_639e5e7bea6574d830305ba5.reference || (__cxx_static_address_639e5e7bea6574d830305ba5.reference = {
    __cReference: true,
    get value() { return DUKE_HARTBEAT____header_global_fb4c67f3c15f858f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:76
export const DUKE_ONWATER____header_global_1eb89809b04fb091 = ((u32(((u32(40) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_be2708e77db01d74273c68ac() {
  return __cxx_static_address_be2708e77db01d74273c68ac.reference || (__cxx_static_address_be2708e77db01d74273c68ac.reference = {
    __cReference: true,
    get value() { return DUKE_ONWATER____header_global_1eb89809b04fb091; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:77
export const DUKE_LAND____header_global_80e4b56a4515a8aa = ((u32(((u32(42) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3db82ab263ed6071f3d44cfe() {
  return __cxx_static_address_3db82ab263ed6071f3d44cfe.reference || (__cxx_static_address_3db82ab263ed6071f3d44cfe.reference = {
    __cReference: true,
    get value() { return DUKE_LAND____header_global_80e4b56a4515a8aa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:78
export const DUKE_WALKINDUCTS____header_global_c47462d2c76ba5ec = ((u32(((u32(43) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bbdbf2aca15951b085befe11() {
  return __cxx_static_address_bbdbf2aca15951b085befe11.reference || (__cxx_static_address_bbdbf2aca15951b085befe11.reference = {
    __cReference: true,
    get value() { return DUKE_WALKINDUCTS____header_global_c47462d2c76ba5ec; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:79
export const DUKE_UNDERWATER____header_global_43342954da6edb94 = ((u32(((u32(48) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e0d722f3960b41dd454f60f8() {
  return __cxx_static_address_e0d722f3960b41dd454f60f8.reference || (__cxx_static_address_e0d722f3960b41dd454f60f8.reference = {
    __cReference: true,
    get value() { return DUKE_UNDERWATER____header_global_43342954da6edb94; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:80
export const DUKE_JETPACK_ON____header_global_132e93cf4454149c = ((u32(((u32(49) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_40f3bc74b069b8f9ae61b42a() {
  return __cxx_static_address_40f3bc74b069b8f9ae61b42a.reference || (__cxx_static_address_40f3bc74b069b8f9ae61b42a.reference = {
    __cReference: true,
    get value() { return DUKE_JETPACK_ON____header_global_132e93cf4454149c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:81
export const DUKE_JETPACK_IDLE____header_global_ff840cd595b00491 = ((u32(((u32(50) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c73babd55066ee286b9a84be() {
  return __cxx_static_address_c73babd55066ee286b9a84be.reference || (__cxx_static_address_c73babd55066ee286b9a84be.reference = {
    __cReference: true,
    get value() { return DUKE_JETPACK_IDLE____header_global_ff840cd595b00491; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:82
export const DUKE_JETPACK_OFF____header_global_25bc0c4da5f0d768 = ((u32(((u32(51) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5c11d7abea014e17938676a6() {
  return __cxx_static_address_5c11d7abea014e17938676a6.reference || (__cxx_static_address_5c11d7abea014e17938676a6.reference = {
    __cReference: true,
    get value() { return DUKE_JETPACK_OFF____header_global_25bc0c4da5f0d768; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:83
export const DUKETALKTOBOSS____header_global_4458c790f1654846 = ((u32(((u32(56) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9d53f26a93cae1761fbec04c() {
  return __cxx_static_address_9d53f26a93cae1761fbec04c.reference || (__cxx_static_address_9d53f26a93cae1761fbec04c.reference = {
    __cReference: true,
    get value() { return DUKETALKTOBOSS____header_global_4458c790f1654846; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:84
export const SQUISHED____header_global_98023e4e25c8599b = ((u32(((u32(69) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_976e72c8aefb88a72f3b9b7d() {
  return __cxx_static_address_976e72c8aefb88a72f3b9b7d.reference || (__cxx_static_address_976e72c8aefb88a72f3b9b7d.reference = {
    __cReference: true,
    get value() { return SQUISHED____header_global_98023e4e25c8599b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:85
export const TELEPORTER____header_global_cce13a7cd865507c = ((u32(((u32(70) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2fe15867554d6b9b06912343() {
  return __cxx_static_address_2fe15867554d6b9b06912343.reference || (__cxx_static_address_2fe15867554d6b9b06912343.reference = {
    __cReference: true,
    get value() { return TELEPORTER____header_global_cce13a7cd865507c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:86
export const ELEVATOR_ON____header_global_4b2b1cbea386007d = ((u32(((u32(71) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c418a7e1738c60bd4451ee4f() {
  return __cxx_static_address_c418a7e1738c60bd4451ee4f.reference || (__cxx_static_address_c418a7e1738c60bd4451ee4f.reference = {
    __cReference: true,
    get value() { return ELEVATOR_ON____header_global_4b2b1cbea386007d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:87
export const ELEVATOR_OFF____header_global_faf42dd70bf4040c = ((u32(((u32(73) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5a0d6cf7d6fac7514e2f5e9d() {
  return __cxx_static_address_5a0d6cf7d6fac7514e2f5e9d.reference || (__cxx_static_address_5a0d6cf7d6fac7514e2f5e9d.reference = {
    __cReference: true,
    get value() { return ELEVATOR_OFF____header_global_faf42dd70bf4040c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:88
export const SUBWAY____header_global_ec4d1209ca4960e1 = ((u32(((u32(75) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5897234fdd9a96eb83a84f4c() {
  return __cxx_static_address_5897234fdd9a96eb83a84f4c.reference || (__cxx_static_address_5897234fdd9a96eb83a84f4c.reference = {
    __cReference: true,
    get value() { return SUBWAY____header_global_ec4d1209ca4960e1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:89
export const SWITCH_ON____header_global_cabb13f4b06fc171 = ((u32(((u32(76) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ed76e3d792a7b64014bd2583() {
  return __cxx_static_address_ed76e3d792a7b64014bd2583.reference || (__cxx_static_address_ed76e3d792a7b64014bd2583.reference = {
    __cReference: true,
    get value() { return SWITCH_ON____header_global_cabb13f4b06fc171; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:90
export const FLUSH_TOILET____header_global_77e839e02c9ac863 = ((u32(((u32(79) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f3dd62838bcd693e4f4a7724() {
  return __cxx_static_address_f3dd62838bcd693e4f4a7724.reference || (__cxx_static_address_f3dd62838bcd693e4f4a7724.reference = {
    __cReference: true,
    get value() { return FLUSH_TOILET____header_global_77e839e02c9ac863; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:91
export const EARTHQUAKE____header_global_fd7993978b1b8116 = ((u32(((u32(81) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c2f8809cbbe46ee2c5bd0392() {
  return __cxx_static_address_c2f8809cbbe46ee2c5bd0392.reference || (__cxx_static_address_c2f8809cbbe46ee2c5bd0392.reference = {
    __cReference: true,
    get value() { return EARTHQUAKE____header_global_fd7993978b1b8116; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:92
export const END_OF_LEVEL_WARN____header_global_c18c10d90cc3fb96 = ((u32(((u32(83) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_50f82892614bea4f6eaf70cb() {
  return __cxx_static_address_50f82892614bea4f6eaf70cb.reference || (__cxx_static_address_50f82892614bea4f6eaf70cb.reference = {
    __cReference: true,
    get value() { return END_OF_LEVEL_WARN____header_global_c18c10d90cc3fb96; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:93
export const WIND_AMBIENCE____header_global_d595f948aaa0efa6 = ((u32(((u32(91) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fbb306d3d793b817fc444b11() {
  return __cxx_static_address_fbb306d3d793b817fc444b11.reference || (__cxx_static_address_fbb306d3d793b817fc444b11.reference = {
    __cReference: true,
    get value() { return WIND_AMBIENCE____header_global_d595f948aaa0efa6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:94
export const SOMETHING_DRIPPING____header_global_5fc0714456b657d6 = ((u32(((u32(92) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_88aee2fe967c736e3d45bdaf() {
  return __cxx_static_address_88aee2fe967c736e3d45bdaf.reference || (__cxx_static_address_88aee2fe967c736e3d45bdaf.reference = {
    __cReference: true,
    get value() { return SOMETHING_DRIPPING____header_global_5fc0714456b657d6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:95
export const BOS1_RECOG____header_global_30b4e4150cdea1cc = ((u32(((u32(97) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1dfc60167578a847c048dc79() {
  return __cxx_static_address_1dfc60167578a847c048dc79.reference || (__cxx_static_address_1dfc60167578a847c048dc79.reference = {
    __cReference: true,
    get value() { return BOS1_RECOG____header_global_30b4e4150cdea1cc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:96
export const BOS2_RECOG____header_global_6520dd206bd38bc3 = ((u32(((u32(102) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f80a28bdc6b7f2aebe815a22() {
  return __cxx_static_address_f80a28bdc6b7f2aebe815a22.reference || (__cxx_static_address_f80a28bdc6b7f2aebe815a22.reference = {
    __cReference: true,
    get value() { return BOS2_RECOG____header_global_6520dd206bd38bc3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:97
export const DUKE_GETWEAPON2____header_global_a9bebaf1364f62f3 = ((u32(((u32(107) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_11ecba825772f5f17ac5ce8d() {
  return __cxx_static_address_11ecba825772f5f17ac5ce8d.reference || (__cxx_static_address_11ecba825772f5f17ac5ce8d.reference = {
    __cReference: true,
    get value() { return DUKE_GETWEAPON2____header_global_a9bebaf1364f62f3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:98
export const SHOTGUN_FIRE____header_global_1382709633365600 = ((u32(((u32(109) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_827fe232798f31a13e644ed0() {
  return __cxx_static_address_827fe232798f31a13e644ed0.reference || (__cxx_static_address_827fe232798f31a13e644ed0.reference = {
    __cReference: true,
    get value() { return SHOTGUN_FIRE____header_global_1382709633365600; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:99
export const PRED_RECOG____header_global_cd81690ec3fc7200 = ((u32(((u32(111) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0a0c916af60ceaa8590cf229() {
  return __cxx_static_address_0a0c916af60ceaa8590cf229.reference || (__cxx_static_address_0a0c916af60ceaa8590cf229.reference = {
    __cReference: true,
    get value() { return PRED_RECOG____header_global_cd81690ec3fc7200; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:100
export const CAPT_RECOG____header_global_a6a44d491a47a2e5 = ((u32(((u32(117) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_20cce313f66530b6937b9dd2() {
  return __cxx_static_address_20cce313f66530b6937b9dd2.reference || (__cxx_static_address_20cce313f66530b6937b9dd2.reference = {
    __cReference: true,
    get value() { return CAPT_RECOG____header_global_a6a44d491a47a2e5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:101
export const PIG_RECOG____header_global_c3b981e4111577b3 = ((u32(((u32(121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7fba837cc59adb9567e574d0() {
  return __cxx_static_address_7fba837cc59adb9567e574d0.reference || (__cxx_static_address_7fba837cc59adb9567e574d0.reference = {
    __cReference: true,
    get value() { return PIG_RECOG____header_global_c3b981e4111577b3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:102
export const RECO_ROAM____header_global_b3c947aa7824a77b = ((u32(((u32(125) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b9f7a7e71c512513748faeac() {
  return __cxx_static_address_b9f7a7e71c512513748faeac.reference || (__cxx_static_address_b9f7a7e71c512513748faeac.reference = {
    __cReference: true,
    get value() { return RECO_ROAM____header_global_b3c947aa7824a77b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:103
export const RECO_RECOG____header_global_7040c9c1c0c332e5 = ((u32(((u32(126) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f8d216fa6ac65150fedd9835() {
  return __cxx_static_address_f8d216fa6ac65150fedd9835.reference || (__cxx_static_address_f8d216fa6ac65150fedd9835.reference = {
    __cReference: true,
    get value() { return RECO_RECOG____header_global_7040c9c1c0c332e5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:104
export const RECO_ATTACK____header_global_e491ac9b924f0991 = ((u32(((u32(127) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3f8834c4cd199df4e1d04058() {
  return __cxx_static_address_3f8834c4cd199df4e1d04058.reference || (__cxx_static_address_3f8834c4cd199df4e1d04058.reference = {
    __cReference: true,
    get value() { return RECO_ATTACK____header_global_e491ac9b924f0991; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:105
export const RECO_PAIN____header_global_7b85423304943e6d = ((u32(((u32(128) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_951830c2d89082f4a4e20b04() {
  return __cxx_static_address_951830c2d89082f4a4e20b04.reference || (__cxx_static_address_951830c2d89082f4a4e20b04.reference = {
    __cReference: true,
    get value() { return RECO_PAIN____header_global_7b85423304943e6d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:106
export const DRON_RECOG____header_global_238a8e49a0c3d66c = ((u32(((u32(131) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2f3748199016b33e07f4a80c() {
  return __cxx_static_address_2f3748199016b33e07f4a80c.reference || (__cxx_static_address_2f3748199016b33e07f4a80c.reference = {
    __cReference: true,
    get value() { return DRON_RECOG____header_global_238a8e49a0c3d66c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:107
export const COMM_RECOG____header_global_309b5803b05963f9 = ((u32(((u32(136) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8b1581b8507262c5d9e3c88d() {
  return __cxx_static_address_8b1581b8507262c5d9e3c88d.reference || (__cxx_static_address_8b1581b8507262c5d9e3c88d.reference = {
    __cReference: true,
    get value() { return COMM_RECOG____header_global_309b5803b05963f9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:108
export const OCTA_RECOG____header_global_d12e21681281ebec = ((u32(((u32(141) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dfb19ffebc3d5ca92867ae0c() {
  return __cxx_static_address_dfb19ffebc3d5ca92867ae0c.reference || (__cxx_static_address_dfb19ffebc3d5ca92867ae0c.reference = {
    __cReference: true,
    get value() { return OCTA_RECOG____header_global_d12e21681281ebec; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:109
export const TURR_RECOG____header_global_2ae04d6908fc09c7 = ((u32(((u32(146) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_33daa978052f14990f5bee40() {
  return __cxx_static_address_33daa978052f14990f5bee40.reference || (__cxx_static_address_33daa978052f14990f5bee40.reference = {
    __cReference: true,
    get value() { return TURR_RECOG____header_global_2ae04d6908fc09c7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:110
export const SLIM_DYING____header_global_16bbe6aeecf56fdb = ((u32(((u32(149) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0d01a1130f640f4a76dce19f() {
  return __cxx_static_address_0d01a1130f640f4a76dce19f.reference || (__cxx_static_address_0d01a1130f640f4a76dce19f.reference = {
    __cReference: true,
    get value() { return SLIM_DYING____header_global_16bbe6aeecf56fdb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:111
export const BOS3_RECOG____header_global_6b0cc80e622c589e = ((u32(((u32(151) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7207b39db816637896d0d654() {
  return __cxx_static_address_7207b39db816637896d0d654.reference || (__cxx_static_address_7207b39db816637896d0d654.reference = {
    __cReference: true,
    get value() { return BOS3_RECOG____header_global_6b0cc80e622c589e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:112
export const BOS1_WALK____header_global_6d1509f5286ea361 = ((u32(((u32(156) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_220d1801975aafcf38658d7a() {
  return __cxx_static_address_220d1801975aafcf38658d7a.reference || (__cxx_static_address_220d1801975aafcf38658d7a.reference = {
    __cReference: true,
    get value() { return BOS1_WALK____header_global_6d1509f5286ea361; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:113
export const THUD____header_global_d6a6a951d5e77f30 = ((u32(((u32(158) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d81f0867ba3e055414971da2() {
  return __cxx_static_address_d81f0867ba3e055414971da2.reference || (__cxx_static_address_d81f0867ba3e055414971da2.reference = {
    __cReference: true,
    get value() { return THUD____header_global_d6a6a951d5e77f30; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:114
export const WIERDSHOT_FLY____header_global_225174ecb5e8a19e = ((u32(((u32(160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f49a43d3e5bafbc09ed04a05() {
  return __cxx_static_address_f49a43d3e5bafbc09ed04a05.reference || (__cxx_static_address_f49a43d3e5bafbc09ed04a05.reference = {
    __cReference: true,
    get value() { return WIERDSHOT_FLY____header_global_225174ecb5e8a19e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:115
export const SLIM_ROAM____header_global_40813abf6087750d = ((u32(((u32(163) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7f0b2064b5436e9e2acdcb3c() {
  return __cxx_static_address_7f0b2064b5436e9e2acdcb3c.reference || (__cxx_static_address_7f0b2064b5436e9e2acdcb3c.reference = {
    __cReference: true,
    get value() { return SLIM_ROAM____header_global_40813abf6087750d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:116
export const SHOTGUN_COCK____header_global_fb36d38caa822353 = ((u32(((u32(169) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_86fcfa588fa7cbe38ce3d8b4() {
  return __cxx_static_address_86fcfa588fa7cbe38ce3d8b4.reference || (__cxx_static_address_86fcfa588fa7cbe38ce3d8b4.reference = {
    __cReference: true,
    get value() { return SHOTGUN_COCK____header_global_fb36d38caa822353; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:117
export const GENERIC_AMBIENCE17____header_global_76563fcf1be22da6 = ((u32(((u32(177) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a00ad96df7bc60623287dd68() {
  return __cxx_static_address_a00ad96df7bc60623287dd68.reference || (__cxx_static_address_a00ad96df7bc60623287dd68.reference = {
    __cReference: true,
    get value() { return GENERIC_AMBIENCE17____header_global_76563fcf1be22da6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:118
export const BONUS_SPEECH1____header_global_958ed4aef844fed8 = ((u32(((u32(195) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ebe5502b3d36f463ce81019e() {
  return __cxx_static_address_ebe5502b3d36f463ce81019e.reference || (__cxx_static_address_ebe5502b3d36f463ce81019e.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH1____header_global_958ed4aef844fed8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:119
export const BONUS_SPEECH2____header_global_6a3c18bda83fc98f = ((u32(((u32(196) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e709c5e784f23db0f0ae079f() {
  return __cxx_static_address_e709c5e784f23db0f0ae079f.reference || (__cxx_static_address_e709c5e784f23db0f0ae079f.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH2____header_global_6a3c18bda83fc98f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:120
export const BONUS_SPEECH3____header_global_64d2966c6c6b128c = ((u32(((u32(197) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_056e72049e6dce411112b4d5() {
  return __cxx_static_address_056e72049e6dce411112b4d5.reference || (__cxx_static_address_056e72049e6dce411112b4d5.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH3____header_global_64d2966c6c6b128c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:121
export const BONUS_SPEECH4____header_global_10406443e1ea2d38 = ((u32(((u32(199) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4616ad652b0e9cf925c441e0() {
  return __cxx_static_address_4616ad652b0e9cf925c441e0.reference || (__cxx_static_address_4616ad652b0e9cf925c441e0.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH4____header_global_10406443e1ea2d38; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:122
export const DUKE_LAND_HURT____header_global_7f42958370bc5080 = ((u32(((u32(200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bbdbeb3a5840fe3de9cef600() {
  return __cxx_static_address_bbdbeb3a5840fe3de9cef600.reference || (__cxx_static_address_bbdbeb3a5840fe3de9cef600.reference = {
    __cReference: true,
    get value() { return DUKE_LAND_HURT____header_global_7f42958370bc5080; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:123
export const DUKE_SEARCH2____header_global_263d2241e33835c7 = ((u32(((u32(207) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_97f2a96ebe9911b157d627dd() {
  return __cxx_static_address_97f2a96ebe9911b157d627dd.reference || (__cxx_static_address_97f2a96ebe9911b157d627dd.reference = {
    __cReference: true,
    get value() { return DUKE_SEARCH2____header_global_263d2241e33835c7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:124
export const DUKE_CRACK2____header_global_ff4bb434b916b86d = ((u32(((u32(208) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3f841fa18b3c74dcdac00e73() {
  return __cxx_static_address_3f841fa18b3c74dcdac00e73.reference || (__cxx_static_address_3f841fa18b3c74dcdac00e73.reference = {
    __cReference: true,
    get value() { return DUKE_CRACK2____header_global_ff4bb434b916b86d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:125
export const DUKE_SEARCH____header_global_96041f3be2586934 = ((u32(((u32(209) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e2b87987798c95e0aee1d8c6() {
  return __cxx_static_address_e2b87987798c95e0aee1d8c6.reference || (__cxx_static_address_e2b87987798c95e0aee1d8c6.reference = {
    __cReference: true,
    get value() { return DUKE_SEARCH____header_global_96041f3be2586934; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:126
export const DUKE_GET____header_global_6b95f5820f261eae = ((u32(((u32(210) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f5cf02874202c48b8cf292db() {
  return __cxx_static_address_f5cf02874202c48b8cf292db.reference || (__cxx_static_address_f5cf02874202c48b8cf292db.reference = {
    __cReference: true,
    get value() { return DUKE_GET____header_global_6b95f5820f261eae; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:127
export const DUKE_LONGTERM_PAIN____header_global_ec0e76ed7384805c = ((u32(((u32(211) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_23ff65f75b695cce81d88022() {
  return __cxx_static_address_23ff65f75b695cce81d88022.reference || (__cxx_static_address_23ff65f75b695cce81d88022.reference = {
    __cReference: true,
    get value() { return DUKE_LONGTERM_PAIN____header_global_ec0e76ed7384805c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:128
export const MONITOR_ACTIVE____header_global_fd3d3d1ef9be7cea = ((u32(((u32(212) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d40b5369ecaa21ce15b1a823() {
  return __cxx_static_address_d40b5369ecaa21ce15b1a823.reference || (__cxx_static_address_d40b5369ecaa21ce15b1a823.reference = {
    __cReference: true,
    get value() { return MONITOR_ACTIVE____header_global_fd3d3d1ef9be7cea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:129
export const NITEVISION_ONOFF____header_global_b3811331a06145ce = ((u32(((u32(213) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_517f4bac56834770e6140986() {
  return __cxx_static_address_517f4bac56834770e6140986.reference || (__cxx_static_address_517f4bac56834770e6140986.reference = {
    __cReference: true,
    get value() { return NITEVISION_ONOFF____header_global_b3811331a06145ce; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:130
export const DUKE_CRACK_FIRST____header_global_a92d65231f9bd11d = ((u32(((u32(215) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b2baca198c786b89d2923661() {
  return __cxx_static_address_b2baca198c786b89d2923661.reference || (__cxx_static_address_b2baca198c786b89d2923661.reference = {
    __cReference: true,
    get value() { return DUKE_CRACK_FIRST____header_global_a92d65231f9bd11d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:131
export const DUKE_USEMEDKIT____header_global_c85b1b03cd0dbeac = ((u32(((u32(216) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b40e4890261b952bc9474314() {
  return __cxx_static_address_b40e4890261b952bc9474314.reference || (__cxx_static_address_b40e4890261b952bc9474314.reference = {
    __cReference: true,
    get value() { return DUKE_USEMEDKIT____header_global_c85b1b03cd0dbeac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:132
export const DUKE_TAKEPILLS____header_global_488728016bf28b07 = ((u32(((u32(217) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_916f535d266975f081b1a3ad() {
  return __cxx_static_address_916f535d266975f081b1a3ad.reference || (__cxx_static_address_916f535d266975f081b1a3ad.reference = {
    __cReference: true,
    get value() { return DUKE_TAKEPILLS____header_global_488728016bf28b07; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:133
export const DUKE_PISSRELIEF____header_global_eae19b4df25d6c51 = ((u32(((u32(218) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c519b0e4669017b31818fe26() {
  return __cxx_static_address_c519b0e4669017b31818fe26.reference || (__cxx_static_address_c519b0e4669017b31818fe26.reference = {
    __cReference: true,
    get value() { return DUKE_PISSRELIEF____header_global_eae19b4df25d6c51; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:134
export const SELECT_WEAPON____header_global_a7d58b49bdf2d9c2 = ((u32(((u32(219) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b1cd7f905126a758a50fab0b() {
  return __cxx_static_address_b1cd7f905126a758a50fab0b.reference || (__cxx_static_address_b1cd7f905126a758a50fab0b.reference = {
    __cReference: true,
    get value() { return SELECT_WEAPON____header_global_a7d58b49bdf2d9c2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:135
export const JIBBED_ACTOR5____header_global_c3e01f72e182b578 = ((u32(((u32(226) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_055b2c5d6b7099e62c7e8fb8() {
  return __cxx_static_address_055b2c5d6b7099e62c7e8fb8.reference || (__cxx_static_address_055b2c5d6b7099e62c7e8fb8.reference = {
    __cReference: true,
    get value() { return JIBBED_ACTOR5____header_global_c3e01f72e182b578; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:136
export const JIBBED_ACTOR6____header_global_06df586bcd9ec166 = ((u32(((u32(227) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_514d2cfe157cda8f0ba28de7() {
  return __cxx_static_address_514d2cfe157cda8f0ba28de7.reference || (__cxx_static_address_514d2cfe157cda8f0ba28de7.reference = {
    __cReference: true,
    get value() { return JIBBED_ACTOR6____header_global_06df586bcd9ec166; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:137
export const DUKE_GOTHEALTHATLOW____header_global_6e97628d4e138b1c = ((u32(((u32(229) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_abe141ea138993e87c9bdeaf() {
  return __cxx_static_address_abe141ea138993e87c9bdeaf.reference || (__cxx_static_address_abe141ea138993e87c9bdeaf.reference = {
    __cReference: true,
    get value() { return DUKE_GOTHEALTHATLOW____header_global_6e97628d4e138b1c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:138
export const BOSSTALKTODUKE____header_global_a66fdd9f75e2ffee = ((u32(((u32(230) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0a82d7c6da6e232695757326() {
  return __cxx_static_address_0a82d7c6da6e232695757326.reference || (__cxx_static_address_0a82d7c6da6e232695757326.reference = {
    __cReference: true,
    get value() { return BOSSTALKTODUKE____header_global_a66fdd9f75e2ffee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:139
export const WAR_AMBIENCE2____header_global_8b1936f1dcc380db = ((u32(((u32(232) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e8adb7181431b3f0c4212428() {
  return __cxx_static_address_e8adb7181431b3f0c4212428.reference || (__cxx_static_address_e8adb7181431b3f0c4212428.reference = {
    __cReference: true,
    get value() { return WAR_AMBIENCE2____header_global_8b1936f1dcc380db; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:140
export const EXITMENUSOUND____header_global_eb961560679b7d82 = ((u32(((u32(243) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0251eb3235c29df4341b542b() {
  return __cxx_static_address_0251eb3235c29df4341b542b.reference || (__cxx_static_address_0251eb3235c29df4341b542b.reference = {
    __cReference: true,
    get value() { return EXITMENUSOUND____header_global_eb961560679b7d82; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:141
export const FLY_BY____header_global_2d94204cc4b41e29 = ((u32(((u32(244) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6bc61a50c933c06bea316499() {
  return __cxx_static_address_6bc61a50c933c06bea316499.reference || (__cxx_static_address_6bc61a50c933c06bea316499.reference = {
    __cReference: true,
    get value() { return FLY_BY____header_global_2d94204cc4b41e29; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:142
export const DUKE_SCREAM____header_global_dd41584a69ddbbb9 = ((u32(((u32(245) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d51dd05dc7c2388ed87e4ac1() {
  return __cxx_static_address_d51dd05dc7c2388ed87e4ac1.reference || (__cxx_static_address_d51dd05dc7c2388ed87e4ac1.reference = {
    __cReference: true,
    get value() { return DUKE_SCREAM____header_global_dd41584a69ddbbb9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:143
export const SHRINKER_HIT____header_global_44a8694469010d85 = ((u32(((u32(246) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_282421e3be42eadc48926147() {
  return __cxx_static_address_282421e3be42eadc48926147.reference || (__cxx_static_address_282421e3be42eadc48926147.reference = {
    __cReference: true,
    get value() { return SHRINKER_HIT____header_global_44a8694469010d85; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:144
export const RATTY____header_global_fdc80016a4ee33cc = ((u32(((u32(247) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_37271eb205029fc8a5fbdd4a() {
  return __cxx_static_address_37271eb205029fc8a5fbdd4a.reference || (__cxx_static_address_37271eb205029fc8a5fbdd4a.reference = {
    __cReference: true,
    get value() { return RATTY____header_global_fdc80016a4ee33cc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:145
export const BONUSMUSIC____header_global_1ef579a0766c63fb = ((u32(((u32(249) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a34d34b29f2349dff0b066ba() {
  return __cxx_static_address_a34d34b29f2349dff0b066ba.reference || (__cxx_static_address_a34d34b29f2349dff0b066ba.reference = {
    __cReference: true,
    get value() { return BONUSMUSIC____header_global_1ef579a0766c63fb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:146
export const DUKE_GETWEAPON6____header_global_8dfc9b4557be84f2 = ((u32(((u32(264) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_163681f04f6deeefee8714ae() {
  return __cxx_static_address_163681f04f6deeefee8714ae.reference || (__cxx_static_address_163681f04f6deeefee8714ae.reference = {
    __cReference: true,
    get value() { return DUKE_GETWEAPON6____header_global_8dfc9b4557be84f2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:147
export const ALIEN_SWITCH1____header_global_d45c7abed4a06ebe = ((u32(((u32(272) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1d908fed5d158ee82a34254e() {
  return __cxx_static_address_1d908fed5d158ee82a34254e.reference || (__cxx_static_address_1d908fed5d158ee82a34254e.reference = {
    __cReference: true,
    get value() { return ALIEN_SWITCH1____header_global_d45c7abed4a06ebe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:148
export const RIPHEADNECK____header_global_94f93d0d5568fbb5 = ((u32(((u32(284) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dc74ed170f0eafb431d6e07a() {
  return __cxx_static_address_dc74ed170f0eafb431d6e07a.reference || (__cxx_static_address_dc74ed170f0eafb431d6e07a.reference = {
    __cReference: true,
    get value() { return RIPHEADNECK____header_global_94f93d0d5568fbb5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:149
export const ENDSEQVOL3SND4____header_global_b50322b7c362392a = ((u32(((u32(288) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1dc81f89a3d14c801c3b2213() {
  return __cxx_static_address_1dc81f89a3d14c801c3b2213.reference || (__cxx_static_address_1dc81f89a3d14c801c3b2213.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND4____header_global_b50322b7c362392a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:150
export const ENDSEQVOL3SND5____header_global_b0a2c9928df2882b = ((u32(((u32(289) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ac2dd458f9f92bc315967ddc() {
  return __cxx_static_address_ac2dd458f9f92bc315967ddc.reference || (__cxx_static_address_ac2dd458f9f92bc315967ddc.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND5____header_global_b0a2c9928df2882b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:151
export const ENDSEQVOL3SND6____header_global_aeb91319f70c0919 = ((u32(((u32(290) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_10e24ec981b2fabe6a897622() {
  return __cxx_static_address_10e24ec981b2fabe6a897622.reference || (__cxx_static_address_10e24ec981b2fabe6a897622.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND6____header_global_aeb91319f70c0919; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:152
export const ENDSEQVOL3SND7____header_global_49aa40cfcb8fbf23 = ((u32(((u32(291) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0dc307d1c3bee242dac67198() {
  return __cxx_static_address_0dc307d1c3bee242dac67198.reference || (__cxx_static_address_0dc307d1c3bee242dac67198.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND7____header_global_49aa40cfcb8fbf23; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:153
export const ENDSEQVOL3SND8____header_global_6c9e7dd84b54c5a7 = ((u32(((u32(292) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_624657dc46239e773e82dc24() {
  return __cxx_static_address_624657dc46239e773e82dc24.reference || (__cxx_static_address_624657dc46239e773e82dc24.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND8____header_global_6c9e7dd84b54c5a7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:154
export const ENDSEQVOL3SND9____header_global_2d94f72068572770 = ((u32(((u32(293) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_02278dd9e8c2c018108a8ff2() {
  return __cxx_static_address_02278dd9e8c2c018108a8ff2.reference || (__cxx_static_address_02278dd9e8c2c018108a8ff2.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND9____header_global_2d94f72068572770; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:155
export const WHIPYOURASS____header_global_45702a621a502375 = ((u32(((u32(294) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_20599114e16b415070e25131() {
  return __cxx_static_address_20599114e16b415070e25131.reference || (__cxx_static_address_20599114e16b415070e25131.reference = {
    __cReference: true,
    get value() { return WHIPYOURASS____header_global_45702a621a502375; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:156
export const ENDSEQVOL2SND1____header_global_c78d37939560d5db = ((u32(((u32(295) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f9ff6c65af1f236c2518e34c() {
  return __cxx_static_address_f9ff6c65af1f236c2518e34c.reference || (__cxx_static_address_f9ff6c65af1f236c2518e34c.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND1____header_global_c78d37939560d5db; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:157
export const ENDSEQVOL2SND2____header_global_10c79aa3af5ba894 = ((u32(((u32(296) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7b9ea396d42f28a6e41d3747() {
  return __cxx_static_address_7b9ea396d42f28a6e41d3747.reference || (__cxx_static_address_7b9ea396d42f28a6e41d3747.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND2____header_global_10c79aa3af5ba894; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:158
export const ENDSEQVOL2SND3____header_global_6dc459ba9f69564f = ((u32(((u32(297) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1867c099d7654273acaeaa28() {
  return __cxx_static_address_1867c099d7654273acaeaa28.reference || (__cxx_static_address_1867c099d7654273acaeaa28.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND3____header_global_6dc459ba9f69564f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:159
export const ENDSEQVOL2SND4____header_global_c37721485a8c32d0 = ((u32(((u32(298) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4888ea2461101e3737554af7() {
  return __cxx_static_address_4888ea2461101e3737554af7.reference || (__cxx_static_address_4888ea2461101e3737554af7.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND4____header_global_c37721485a8c32d0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:160
export const ENDSEQVOL2SND5____header_global_95828cef3a73ccc3 = ((u32(((u32(299) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e692a30fec7b129d5ae819e5() {
  return __cxx_static_address_e692a30fec7b129d5ae819e5.reference || (__cxx_static_address_e692a30fec7b129d5ae819e5.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND5____header_global_95828cef3a73ccc3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:161
export const ENDSEQVOL2SND6____header_global_040fe631bc9b5835 = ((u32(((u32(300) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6935b64169d7f062ca301c66() {
  return __cxx_static_address_6935b64169d7f062ca301c66.reference || (__cxx_static_address_6935b64169d7f062ca301c66.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND6____header_global_040fe631bc9b5835; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:162
export const ENDSEQVOL2SND7____header_global_6bafb568e8bd823c = ((u32(((u32(301) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a97229bcbffd0558dcdc206f() {
  return __cxx_static_address_a97229bcbffd0558dcdc206f.reference || (__cxx_static_address_a97229bcbffd0558dcdc206f.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND7____header_global_6bafb568e8bd823c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:163
export const SOMETHINGFROZE____header_global_22ae45a5a74bcc54 = ((u32(((u32(303) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1eaff17fca60019e986b7ad8() {
  return __cxx_static_address_1eaff17fca60019e986b7ad8.reference || (__cxx_static_address_1eaff17fca60019e986b7ad8.reference = {
    __cReference: true,
    get value() { return SOMETHINGFROZE____header_global_22ae45a5a74bcc54; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:164
export const WIND_REPEAT____header_global_fd94338086a52b81 = ((u32(((u32(308) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d56e08a5721171078fd182bd() {
  return __cxx_static_address_d56e08a5721171078fd182bd.reference || (__cxx_static_address_d56e08a5721171078fd182bd.reference = {
    __cReference: true,
    get value() { return WIND_REPEAT____header_global_fd94338086a52b81; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:165
export const BOS4_RECOG____header_global_1bd640929808af74 = ((u32(((u32(342) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d9fabeaa6a3f4fe3471d5cb8() {
  return __cxx_static_address_d9fabeaa6a3f4fe3471d5cb8.reference || (__cxx_static_address_d9fabeaa6a3f4fe3471d5cb8.reference = {
    __cReference: true,
    get value() { return BOS4_RECOG____header_global_1bd640929808af74; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:166
export const LIGHTNING_SLAP____header_global_e225042dc8d5506e = ((u32(((u32(351) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_363a91d1b6f15e7d171f5222() {
  return __cxx_static_address_363a91d1b6f15e7d171f5222.reference || (__cxx_static_address_363a91d1b6f15e7d171f5222.reference = {
    __cReference: true,
    get value() { return LIGHTNING_SLAP____header_global_e225042dc8d5506e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:167
export const THUNDER____header_global_df345c4b4a218c48 = ((u32(((u32(352) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b54602ad695bc6647b1d206d() {
  return __cxx_static_address_b54602ad695bc6647b1d206d.reference || (__cxx_static_address_b54602ad695bc6647b1d206d.reference = {
    __cReference: true,
    get value() { return THUNDER____header_global_df345c4b4a218c48; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:168
export const INTRO4_1____header_global_f461cfcbb074c5f1 = ((u32(((u32(363) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0712f498ed31b9ce2a5292a6() {
  return __cxx_static_address_0712f498ed31b9ce2a5292a6.reference || (__cxx_static_address_0712f498ed31b9ce2a5292a6.reference = {
    __cReference: true,
    get value() { return INTRO4_1____header_global_f461cfcbb074c5f1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:169
export const INTRO4_2____header_global_a12de9e72ccde611 = ((u32(((u32(364) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_473134e11fa8acebc3edc89c() {
  return __cxx_static_address_473134e11fa8acebc3edc89c.reference || (__cxx_static_address_473134e11fa8acebc3edc89c.reference = {
    __cReference: true,
    get value() { return INTRO4_2____header_global_a12de9e72ccde611; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:170
export const INTRO4_3____header_global_90550d516ef92997 = ((u32(((u32(365) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1418fd03dd8cb98ec3902157() {
  return __cxx_static_address_1418fd03dd8cb98ec3902157.reference || (__cxx_static_address_1418fd03dd8cb98ec3902157.reference = {
    __cReference: true,
    get value() { return INTRO4_3____header_global_90550d516ef92997; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:171
export const INTRO4_4____header_global_48c441c83e5df0a6 = ((u32(((u32(366) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8edf36d2314d03f7e175795d() {
  return __cxx_static_address_8edf36d2314d03f7e175795d.reference || (__cxx_static_address_8edf36d2314d03f7e175795d.reference = {
    __cReference: true,
    get value() { return INTRO4_4____header_global_48c441c83e5df0a6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:172
export const INTRO4_5____header_global_4bc9a2319bb867d1 = ((u32(((u32(367) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_223cffc787869febe65938de() {
  return __cxx_static_address_223cffc787869febe65938de.reference || (__cxx_static_address_223cffc787869febe65938de.reference = {
    __cReference: true,
    get value() { return INTRO4_5____header_global_4bc9a2319bb867d1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:173
export const INTRO4_6____header_global_f345e7b4e83686d1 = ((u32(((u32(368) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a6488e607c1412302b09ce46() {
  return __cxx_static_address_a6488e607c1412302b09ce46.reference || (__cxx_static_address_a6488e607c1412302b09ce46.reference = {
    __cReference: true,
    get value() { return INTRO4_6____header_global_f345e7b4e83686d1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:174
export const BOSS4_DEADSPEECH____header_global_9a9d8b39f29003b4 = ((u32(((u32(370) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_85b5892e08d908c8d69f6d7a() {
  return __cxx_static_address_85b5892e08d908c8d69f6d7a.reference || (__cxx_static_address_85b5892e08d908c8d69f6d7a.reference = {
    __cReference: true,
    get value() { return BOSS4_DEADSPEECH____header_global_9a9d8b39f29003b4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:175
export const BOSS4_FIRSTSEE____header_global_693fe0d6eab56e48 = ((u32(((u32(371) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ceab7db614f7f7feb7d7f841() {
  return __cxx_static_address_ceab7db614f7f7feb7d7f841.reference || (__cxx_static_address_ceab7db614f7f7feb7d7f841.reference = {
    __cReference: true,
    get value() { return BOSS4_FIRSTSEE____header_global_693fe0d6eab56e48; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:176
export const VOL4ENDSND1____header_global_9886c04733527a19 = ((u32(((u32(384) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9d2522693afa488b529e217c() {
  return __cxx_static_address_9d2522693afa488b529e217c.reference || (__cxx_static_address_9d2522693afa488b529e217c.reference = {
    __cReference: true,
    get value() { return VOL4ENDSND1____header_global_9886c04733527a19; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:177
export const VOL4ENDSND2____header_global_58c074ce8a42285c = ((u32(((u32(385) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_56ef03cf88736274b88a97d3() {
  return __cxx_static_address_56ef03cf88736274b88a97d3.reference || (__cxx_static_address_56ef03cf88736274b88a97d3.reference = {
    __cReference: true,
    get value() { return VOL4ENDSND2____header_global_58c074ce8a42285c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:178
export const EXPANDERSHOOT____header_global_ddc471e1ba34af56 = ((u32(((u32(388) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2307b4d2136e008d456a050f() {
  return __cxx_static_address_2307b4d2136e008d456a050f.reference || (__cxx_static_address_2307b4d2136e008d456a050f.reference = {
    __cReference: true,
    get value() { return EXPANDERSHOOT____header_global_ddc471e1ba34af56; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:179
export const INTRO4_B____header_global_6d396029cb54fcf6 = ((u32(((u32(392) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e0de49fa2063aab61ce2acbc() {
  return __cxx_static_address_e0de49fa2063aab61ce2acbc.reference || (__cxx_static_address_e0de49fa2063aab61ce2acbc.reference = {
    __cReference: true,
    get value() { return INTRO4_B____header_global_6d396029cb54fcf6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:180
export const BIGBANG____header_global_904e45e136429879 = ((u32(((u32(393) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_89991c3ee52b840c4178bc60() {
  return __cxx_static_address_89991c3ee52b840c4178bc60.reference || (__cxx_static_address_89991c3ee52b840c4178bc60.reference = {
    __cReference: true,
    get value() { return BIGBANG____header_global_904e45e136429879; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:181
export const FLAMETHROWER_INTRO____header_global_68c5da582d502583 = ((u32(((u32(398) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_371798a73f2febda4b69f968() {
  return __cxx_static_address_371798a73f2febda4b69f968.reference || (__cxx_static_address_371798a73f2febda4b69f968.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER_INTRO____header_global_68c5da582d502583; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:182
export const FLAMETHROWER_LOOP____header_global_2906257e800fb221 = ((u32(((u32(399) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_99704e7c110c25c8ee73a7ad() {
  return __cxx_static_address_99704e7c110c25c8ee73a7ad.reference || (__cxx_static_address_99704e7c110c25c8ee73a7ad.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER_LOOP____header_global_2906257e800fb221; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:183
export const FLAMETHROWER_END____header_global_488fb2ba1f4dd6e7 = ((u32(((u32(400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_27453025d547cfd78ff6f251() {
  return __cxx_static_address_27453025d547cfd78ff6f251.reference || (__cxx_static_address_27453025d547cfd78ff6f251.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER_END____header_global_488fb2ba1f4dd6e7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:184
export const E5L7_DUKE_QUIT_YOU____header_global_2fd61cd2f2c0a461 = ((u32(((u32(401) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5e7332e4eb24d2fbe1f4352b() {
  return __cxx_static_address_5e7332e4eb24d2fbe1f4352b.reference || (__cxx_static_address_5e7332e4eb24d2fbe1f4352b.reference = {
    __cReference: true,
    get value() { return E5L7_DUKE_QUIT_YOU____header_global_2fd61cd2f2c0a461; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:187
export const SECTOREFFECTOR____header_global_3e269bca2e64befe = ((u32(((u32(1) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e2e3f111089f8379c1ea79fc() {
  return __cxx_static_address_e2e3f111089f8379c1ea79fc.reference || (__cxx_static_address_e2e3f111089f8379c1ea79fc.reference = {
    __cReference: true,
    get value() { return SECTOREFFECTOR____header_global_3e269bca2e64befe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:188
export const ACTIVATOR____header_global_9927035c1fd33650 = ((u32(((u32(2) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5a3fa471155c91363859b77b() {
  return __cxx_static_address_5a3fa471155c91363859b77b.reference || (__cxx_static_address_5a3fa471155c91363859b77b.reference = {
    __cReference: true,
    get value() { return ACTIVATOR____header_global_9927035c1fd33650; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:189
export const TOUCHPLATE____header_global_93c34439c0c0faf9 = ((u32(((u32(3) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_84e22cf63d3d639b5e2a1d56() {
  return __cxx_static_address_84e22cf63d3d639b5e2a1d56.reference || (__cxx_static_address_84e22cf63d3d639b5e2a1d56.reference = {
    __cReference: true,
    get value() { return TOUCHPLATE____header_global_93c34439c0c0faf9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:190
export const ACTIVATORLOCKED____header_global_a3644280cf815ecb = ((u32(((u32(4) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ebfa740bf5a07bb359010a46() {
  return __cxx_static_address_ebfa740bf5a07bb359010a46.reference || (__cxx_static_address_ebfa740bf5a07bb359010a46.reference = {
    __cReference: true,
    get value() { return ACTIVATORLOCKED____header_global_a3644280cf815ecb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:191
export const MUSICANDSFX____header_global_39459ed50165bfac = ((u32(((u32(5) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_35a3b4ec128b7de151f05034() {
  return __cxx_static_address_35a3b4ec128b7de151f05034.reference || (__cxx_static_address_35a3b4ec128b7de151f05034.reference = {
    __cReference: true,
    get value() { return MUSICANDSFX____header_global_39459ed50165bfac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:192
export const LOCATORS____header_global_b7548d41c76b9554 = ((u32(((u32(6) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6eacae60fec56b9ba4bbc200() {
  return __cxx_static_address_6eacae60fec56b9ba4bbc200.reference || (__cxx_static_address_6eacae60fec56b9ba4bbc200.reference = {
    __cReference: true,
    get value() { return LOCATORS____header_global_b7548d41c76b9554; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:193
export const CYCLER____header_global_7d9862b77cc73a7a = ((u32(((u32(7) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1824f69fb6abc2590090262a() {
  return __cxx_static_address_1824f69fb6abc2590090262a.reference || (__cxx_static_address_1824f69fb6abc2590090262a.reference = {
    __cReference: true,
    get value() { return CYCLER____header_global_7d9862b77cc73a7a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:194
export const MASTERSWITCH____header_global_9eb1be6dd3b3f47e = ((u32(((u32(8) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7c682fc4b556a02afe64b48d() {
  return __cxx_static_address_7c682fc4b556a02afe64b48d.reference || (__cxx_static_address_7c682fc4b556a02afe64b48d.reference = {
    __cReference: true,
    get value() { return MASTERSWITCH____header_global_9eb1be6dd3b3f47e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:195
export const RESPAWN____header_global_22e36e748c7b3a20 = ((u32(((u32(9) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ff0097db47ddce9173e54617() {
  return __cxx_static_address_ff0097db47ddce9173e54617.reference || (__cxx_static_address_ff0097db47ddce9173e54617.reference = {
    __cReference: true,
    get value() { return RESPAWN____header_global_22e36e748c7b3a20; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:196
export const GPSPEED____header_global_d159e5a1eced1398 = ((u32(((u32(10) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_edfd7ee57e11b60dde690acb() {
  return __cxx_static_address_edfd7ee57e11b60dde690acb.reference || (__cxx_static_address_edfd7ee57e11b60dde690acb.reference = {
    __cReference: true,
    get value() { return GPSPEED____header_global_d159e5a1eced1398; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:197
export const FOF____header_global_0f40e1168d8df278 = ((u32(((u32(13) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_debab65150ac24529882e66d() {
  return __cxx_static_address_debab65150ac24529882e66d.reference || (__cxx_static_address_debab65150ac24529882e66d.reference = {
    __cReference: true,
    get value() { return FOF____header_global_0f40e1168d8df278; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:198
export const ARROW____header_global_0428a8fc53ed4089 = ((u32(((u32(20) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5db1df239bd1d295c3fb397c() {
  return __cxx_static_address_5db1df239bd1d295c3fb397c.reference || (__cxx_static_address_5db1df239bd1d295c3fb397c.reference = {
    __cReference: true,
    get value() { return ARROW____header_global_0428a8fc53ed4089; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:199
export const FIRSTGUNSPRITE____header_global_30c7e8a740f3ec17 = ((u32(((u32(21) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c2d486003218e440554f1606() {
  return __cxx_static_address_c2d486003218e440554f1606.reference || (__cxx_static_address_c2d486003218e440554f1606.reference = {
    __cReference: true,
    get value() { return FIRSTGUNSPRITE____header_global_30c7e8a740f3ec17; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:200
export const CHAINGUNSPRITE____header_global_a391cfb499caa729 = ((u32(((u32(22) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c3ea6d46de2907462404081d() {
  return __cxx_static_address_c3ea6d46de2907462404081d.reference || (__cxx_static_address_c3ea6d46de2907462404081d.reference = {
    __cReference: true,
    get value() { return CHAINGUNSPRITE____header_global_a391cfb499caa729; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:201
export const RPGSPRITE____header_global_b8784d21c23b4c40 = ((u32(((u32(23) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_261444a51bfb6b16b8a0c011() {
  return __cxx_static_address_261444a51bfb6b16b8a0c011.reference || (__cxx_static_address_261444a51bfb6b16b8a0c011.reference = {
    __cReference: true,
    get value() { return RPGSPRITE____header_global_b8784d21c23b4c40; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:202
export const FREEZESPRITE____header_global_895047b1a457432e = ((u32(((u32(24) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1d8055a49f5d93c48c0f8032() {
  return __cxx_static_address_1d8055a49f5d93c48c0f8032.reference || (__cxx_static_address_1d8055a49f5d93c48c0f8032.reference = {
    __cReference: true,
    get value() { return FREEZESPRITE____header_global_895047b1a457432e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:203
export const SHRINKERSPRITE____header_global_5f1eb3755b667119 = ((u32(((u32(25) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9f347d1fcd92183df246d1fe() {
  return __cxx_static_address_9f347d1fcd92183df246d1fe.reference || (__cxx_static_address_9f347d1fcd92183df246d1fe.reference = {
    __cReference: true,
    get value() { return SHRINKERSPRITE____header_global_5f1eb3755b667119; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:204
export const HEAVYHBOMB____header_global_295b4c8be99f5ac2 = ((u32(((u32(26) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ab24a057c663cacb96d71e58() {
  return __cxx_static_address_ab24a057c663cacb96d71e58.reference || (__cxx_static_address_ab24a057c663cacb96d71e58.reference = {
    __cReference: true,
    get value() { return HEAVYHBOMB____header_global_295b4c8be99f5ac2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:205
export const TRIPBOMBSPRITE____header_global_911b3e103f7e6450 = ((u32(((u32(27) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9102bea6b6edafc027887283() {
  return __cxx_static_address_9102bea6b6edafc027887283.reference || (__cxx_static_address_9102bea6b6edafc027887283.reference = {
    __cReference: true,
    get value() { return TRIPBOMBSPRITE____header_global_911b3e103f7e6450; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:206
export const SHOTGUNSPRITE____header_global_f25a180c5219f377 = ((u32(((u32(28) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5bf3dbe8d0aaaf58ce20ae9f() {
  return __cxx_static_address_5bf3dbe8d0aaaf58ce20ae9f.reference || (__cxx_static_address_5bf3dbe8d0aaaf58ce20ae9f.reference = {
    __cReference: true,
    get value() { return SHOTGUNSPRITE____header_global_f25a180c5219f377; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:207
export const DEVISTATORSPRITE____header_global_4e657fa246db4e6a = ((u32(((u32(29) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_12c5d25e02c0c5a4c68cf48d() {
  return __cxx_static_address_12c5d25e02c0c5a4c68cf48d.reference || (__cxx_static_address_12c5d25e02c0c5a4c68cf48d.reference = {
    __cReference: true,
    get value() { return DEVISTATORSPRITE____header_global_4e657fa246db4e6a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:208
export const HEALTHBOX____header_global_4a4a51feaea8717f = ((u32(((u32(30) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a7776d12523327441cff4ed5() {
  return __cxx_static_address_a7776d12523327441cff4ed5.reference || (__cxx_static_address_a7776d12523327441cff4ed5.reference = {
    __cReference: true,
    get value() { return HEALTHBOX____header_global_4a4a51feaea8717f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:209
export const AMMOBOX____header_global_537c79e1aa76c174 = ((u32(((u32(31) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_33c32a08cd50d6d7291c9353() {
  return __cxx_static_address_33c32a08cd50d6d7291c9353.reference || (__cxx_static_address_33c32a08cd50d6d7291c9353.reference = {
    __cReference: true,
    get value() { return AMMOBOX____header_global_537c79e1aa76c174; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:210
export const GROWSPRITEICON____header_global_c293e450d2be2dc7 = ((u32(((u32(32) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3c2f9993becf77088de1ffdb() {
  return __cxx_static_address_3c2f9993becf77088de1ffdb.reference || (__cxx_static_address_3c2f9993becf77088de1ffdb.reference = {
    __cReference: true,
    get value() { return GROWSPRITEICON____header_global_c293e450d2be2dc7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:211
export const INVENTORYBOX____header_global_14003f5d3d3ff8a5 = ((u32(((u32(33) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5b255f9f729cd5b14b9ac762() {
  return __cxx_static_address_5b255f9f729cd5b14b9ac762.reference || (__cxx_static_address_5b255f9f729cd5b14b9ac762.reference = {
    __cReference: true,
    get value() { return INVENTORYBOX____header_global_14003f5d3d3ff8a5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:212
export const FREEZEAMMO____header_global_1567b577f3ea7b79 = ((u32(((u32(37) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ae64c98fde591d30ccbc27e0() {
  return __cxx_static_address_ae64c98fde591d30ccbc27e0.reference || (__cxx_static_address_ae64c98fde591d30ccbc27e0.reference = {
    __cReference: true,
    get value() { return FREEZEAMMO____header_global_1567b577f3ea7b79; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:213
export const AMMO____header_global_095b373619b89420 = ((u32(((u32(40) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a67339cec69c07cfbc4e2664() {
  return __cxx_static_address_a67339cec69c07cfbc4e2664.reference || (__cxx_static_address_a67339cec69c07cfbc4e2664.reference = {
    __cReference: true,
    get value() { return AMMO____header_global_095b373619b89420; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:214
export const BATTERYAMMO____header_global_c7daccc9fac2d8c7 = ((u32(((u32(41) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a8965fe173bf0f462b7f2b22() {
  return __cxx_static_address_a8965fe173bf0f462b7f2b22.reference || (__cxx_static_address_a8965fe173bf0f462b7f2b22.reference = {
    __cReference: true,
    get value() { return BATTERYAMMO____header_global_c7daccc9fac2d8c7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:215
export const DEVISTATORAMMO____header_global_31015b1334afa611 = ((u32(((u32(42) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_db992b31d8fbf844e39f6dd5() {
  return __cxx_static_address_db992b31d8fbf844e39f6dd5.reference || (__cxx_static_address_db992b31d8fbf844e39f6dd5.reference = {
    __cReference: true,
    get value() { return DEVISTATORAMMO____header_global_31015b1334afa611; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:216
export const RPGAMMO____header_global_26dbd79d0a49e84f = ((u32(((u32(44) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8062884603ed55cb6777de36() {
  return __cxx_static_address_8062884603ed55cb6777de36.reference || (__cxx_static_address_8062884603ed55cb6777de36.reference = {
    __cReference: true,
    get value() { return RPGAMMO____header_global_26dbd79d0a49e84f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:217
export const GROWAMMO____header_global_d55bdccd841315a0 = ((u32(((u32(45) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4ebdfb82d1a5b90e7facbe8a() {
  return __cxx_static_address_4ebdfb82d1a5b90e7facbe8a.reference || (__cxx_static_address_4ebdfb82d1a5b90e7facbe8a.reference = {
    __cReference: true,
    get value() { return GROWAMMO____header_global_d55bdccd841315a0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:218
export const CRYSTALAMMO____header_global_106b0decc7b72399 = ((u32(((u32(46) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6d8d900f164974d59be19508() {
  return __cxx_static_address_6d8d900f164974d59be19508.reference || (__cxx_static_address_6d8d900f164974d59be19508.reference = {
    __cReference: true,
    get value() { return CRYSTALAMMO____header_global_106b0decc7b72399; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:219
export const HBOMBAMMO____header_global_04064ed9fd877a99 = ((u32(((u32(47) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_53c90da4c1ef1ec21549a0ab() {
  return __cxx_static_address_53c90da4c1ef1ec21549a0ab.reference || (__cxx_static_address_53c90da4c1ef1ec21549a0ab.reference = {
    __cReference: true,
    get value() { return HBOMBAMMO____header_global_04064ed9fd877a99; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:220
export const AMMOLOTS____header_global_cfd03334b11b86b7 = ((u32(((u32(48) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3b23f43e0b02483c9cac6d61() {
  return __cxx_static_address_3b23f43e0b02483c9cac6d61.reference || (__cxx_static_address_3b23f43e0b02483c9cac6d61.reference = {
    __cReference: true,
    get value() { return AMMOLOTS____header_global_cfd03334b11b86b7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:221
export const SHOTGUNAMMO____header_global_10e3e4e6edf4de64 = ((u32(((u32(49) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3d6baedc3bc006ff199226ba() {
  return __cxx_static_address_3d6baedc3bc006ff199226ba.reference || (__cxx_static_address_3d6baedc3bc006ff199226ba.reference = {
    __cReference: true,
    get value() { return SHOTGUNAMMO____header_global_10e3e4e6edf4de64; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:222
export const COLA____header_global_dc0626e8b10dcf8c = ((u32(((u32(51) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_80db5f163de5ec75594401e4() {
  return __cxx_static_address_80db5f163de5ec75594401e4.reference || (__cxx_static_address_80db5f163de5ec75594401e4.reference = {
    __cReference: true,
    get value() { return COLA____header_global_dc0626e8b10dcf8c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:223
export const SIXPAK____header_global_5fc3b8265313f100 = ((u32(((u32(52) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b8468660c875a7bb0ad19ae0() {
  return __cxx_static_address_b8468660c875a7bb0ad19ae0.reference || (__cxx_static_address_b8468660c875a7bb0ad19ae0.reference = {
    __cReference: true,
    get value() { return SIXPAK____header_global_5fc3b8265313f100; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:224
export const FIRSTAID____header_global_3b86f29ee222d44e = ((u32(((u32(53) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ecdad54895f30dccaf5ee069() {
  return __cxx_static_address_ecdad54895f30dccaf5ee069.reference || (__cxx_static_address_ecdad54895f30dccaf5ee069.reference = {
    __cReference: true,
    get value() { return FIRSTAID____header_global_3b86f29ee222d44e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:225
export const SHIELD____header_global_1e6dc8f62def1856 = ((u32(((u32(54) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_801ec99da658dbefc8d6368a() {
  return __cxx_static_address_801ec99da658dbefc8d6368a.reference || (__cxx_static_address_801ec99da658dbefc8d6368a.reference = {
    __cReference: true,
    get value() { return SHIELD____header_global_1e6dc8f62def1856; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:226
export const STEROIDS____header_global_b0ade9e3bd4466e4 = ((u32(((u32(55) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f6216b7c0c43ea4182dac6e5() {
  return __cxx_static_address_f6216b7c0c43ea4182dac6e5.reference || (__cxx_static_address_f6216b7c0c43ea4182dac6e5.reference = {
    __cReference: true,
    get value() { return STEROIDS____header_global_b0ade9e3bd4466e4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:227
export const AIRTANK____header_global_87c2140fac043578 = ((u32(((u32(56) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_01ea74be1ba03ee4b6438e81() {
  return __cxx_static_address_01ea74be1ba03ee4b6438e81.reference || (__cxx_static_address_01ea74be1ba03ee4b6438e81.reference = {
    __cReference: true,
    get value() { return AIRTANK____header_global_87c2140fac043578; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:228
export const JETPACK____header_global_48fe2c3a71df5c08 = ((u32(((u32(57) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_22c1217a40776ce71d0c1ffe() {
  return __cxx_static_address_22c1217a40776ce71d0c1ffe.reference || (__cxx_static_address_22c1217a40776ce71d0c1ffe.reference = {
    __cReference: true,
    get value() { return JETPACK____header_global_48fe2c3a71df5c08; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:229
export const HEATSENSOR____header_global_ffcf78113eb57189 = ((u32(((u32(59) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7d6105bb5b1edcde6c758f75() {
  return __cxx_static_address_7d6105bb5b1edcde6c758f75.reference || (__cxx_static_address_7d6105bb5b1edcde6c758f75.reference = {
    __cReference: true,
    get value() { return HEATSENSOR____header_global_ffcf78113eb57189; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:230
export const ACCESSCARD____header_global_0e9e2a64e8132d7e = ((u32(((u32(60) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_31838a8e22afd3be54a8656d() {
  return __cxx_static_address_31838a8e22afd3be54a8656d.reference || (__cxx_static_address_31838a8e22afd3be54a8656d.reference = {
    __cReference: true,
    get value() { return ACCESSCARD____header_global_0e9e2a64e8132d7e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:231
export const BOOTS____header_global_0ebd5bdeb5657ca3 = ((u32(((u32(61) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7262ca727076613c2950d6ef() {
  return __cxx_static_address_7262ca727076613c2950d6ef.reference || (__cxx_static_address_7262ca727076613c2950d6ef.reference = {
    __cReference: true,
    get value() { return BOOTS____header_global_0ebd5bdeb5657ca3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:232
export const MIRRORBROKE____header_global_d11fb9b1c4e7a94d = ((u32(((u32(70) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8a829a1d747e4ee0834104c7() {
  return __cxx_static_address_8a829a1d747e4ee0834104c7.reference || (__cxx_static_address_8a829a1d747e4ee0834104c7.reference = {
    __cReference: true,
    get value() { return MIRRORBROKE____header_global_d11fb9b1c4e7a94d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:233
export const CLOUDYOCEAN____header_global_ee9e65dfe8b51d8b = ((u32(((u32(78) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7c0224494c08db5aedb3e674() {
  return __cxx_static_address_7c0224494c08db5aedb3e674.reference || (__cxx_static_address_7c0224494c08db5aedb3e674.reference = {
    __cReference: true,
    get value() { return CLOUDYOCEAN____header_global_ee9e65dfe8b51d8b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:234
export const CLOUDYSKIES____header_global_c7f090b2f7bbd047 = ((u32(((u32(79) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_662239fefda9e8a8f267556e() {
  return __cxx_static_address_662239fefda9e8a8f267556e.reference || (__cxx_static_address_662239fefda9e8a8f267556e.reference = {
    __cReference: true,
    get value() { return CLOUDYSKIES____header_global_c7f090b2f7bbd047; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:235
export const MOONSKY1____header_global_0d51fcf135c7b995 = ((u32(((u32(80) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0e6a205f1ecb71fa34f7f3a2() {
  return __cxx_static_address_0e6a205f1ecb71fa34f7f3a2.reference || (__cxx_static_address_0e6a205f1ecb71fa34f7f3a2.reference = {
    __cReference: true,
    get value() { return MOONSKY1____header_global_0d51fcf135c7b995; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:236
export const BIGORBIT1____header_global_a719b3a0bb07ab28 = ((u32(((u32(84) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_35fe457c9aa0a50365deda96() {
  return __cxx_static_address_35fe457c9aa0a50365deda96.reference || (__cxx_static_address_35fe457c9aa0a50365deda96.reference = {
    __cReference: true,
    get value() { return BIGORBIT1____header_global_a719b3a0bb07ab28; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:237
export const LA____header_global_1a35daf7d8f30e2e = ((u32(((u32(89) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fedf029f4ac4658466e71e96() {
  return __cxx_static_address_fedf029f4ac4658466e71e96.reference || (__cxx_static_address_fedf029f4ac4658466e71e96.reference = {
    __cReference: true,
    get value() { return LA____header_global_1a35daf7d8f30e2e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:238
export const ATOMICHEALTH____header_global_fe1edbb497577e40 = ((u32(((u32(100) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_35fcb3a03e5fb7b0755e05bb() {
  return __cxx_static_address_35fcb3a03e5fb7b0755e05bb.reference || (__cxx_static_address_35fcb3a03e5fb7b0755e05bb.reference = {
    __cReference: true,
    get value() { return ATOMICHEALTH____header_global_fe1edbb497577e40; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:239
export const TECHLIGHT2____header_global_f2f31a9b963f6167 = ((u32(((u32(120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2a12f553954f6fa6972708f4() {
  return __cxx_static_address_2a12f553954f6fa6972708f4.reference || (__cxx_static_address_2a12f553954f6fa6972708f4.reference = {
    __cReference: true,
    get value() { return TECHLIGHT2____header_global_f2f31a9b963f6167; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:240
export const TECHLIGHTBUST2____header_global_dab555be8ded0643 = ((u32(((u32(121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1ebb3780f2149edfb4e8d3bc() {
  return __cxx_static_address_1ebb3780f2149edfb4e8d3bc.reference || (__cxx_static_address_1ebb3780f2149edfb4e8d3bc.reference = {
    __cReference: true,
    get value() { return TECHLIGHTBUST2____header_global_dab555be8ded0643; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:241
export const TECHLIGHT4____header_global_7fb35232d14e7bfa = ((u32(((u32(122) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7b16f35031a5667aec712b63() {
  return __cxx_static_address_7b16f35031a5667aec712b63.reference || (__cxx_static_address_7b16f35031a5667aec712b63.reference = {
    __cReference: true,
    get value() { return TECHLIGHT4____header_global_7fb35232d14e7bfa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:242
export const TECHLIGHTBUST4____header_global_4bfb2a76c036a001 = ((u32(((u32(123) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_298eec8fe7a606e0325ceb71() {
  return __cxx_static_address_298eec8fe7a606e0325ceb71.reference || (__cxx_static_address_298eec8fe7a606e0325ceb71.reference = {
    __cReference: true,
    get value() { return TECHLIGHTBUST4____header_global_4bfb2a76c036a001; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:243
export const WALLLIGHT4____header_global_89f90fefe4f5e36b = ((u32(((u32(124) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_61c97fd491e1a761356fc7fb() {
  return __cxx_static_address_61c97fd491e1a761356fc7fb.reference || (__cxx_static_address_61c97fd491e1a761356fc7fb.reference = {
    __cReference: true,
    get value() { return WALLLIGHT4____header_global_89f90fefe4f5e36b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:244
export const WALLLIGHTBUST4____header_global_da0e299b70eb7a41 = ((u32(((u32(125) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ea206890f2389b0db7e8ac96() {
  return __cxx_static_address_ea206890f2389b0db7e8ac96.reference || (__cxx_static_address_ea206890f2389b0db7e8ac96.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST4____header_global_da0e299b70eb7a41; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:245
export const ACCESSSWITCH____header_global_a5e56596f59124ea = ((u32(((u32(130) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_54aabe8b06565618b6d60ff7() {
  return __cxx_static_address_54aabe8b06565618b6d60ff7.reference || (__cxx_static_address_54aabe8b06565618b6d60ff7.reference = {
    __cReference: true,
    get value() { return ACCESSSWITCH____header_global_a5e56596f59124ea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:246
export const SLOTDOOR____header_global_13d0ab67b54eeebc = ((u32(((u32(132) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_803f1dc360e091e23d327f98() {
  return __cxx_static_address_803f1dc360e091e23d327f98.reference || (__cxx_static_address_803f1dc360e091e23d327f98.reference = {
    __cReference: true,
    get value() { return SLOTDOOR____header_global_13d0ab67b54eeebc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:247
export const LIGHTSWITCH____header_global_07b8e27b2f82b0d2 = ((u32(((u32(134) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b554bb908e5867455cb4f77c() {
  return __cxx_static_address_b554bb908e5867455cb4f77c.reference || (__cxx_static_address_b554bb908e5867455cb4f77c.reference = {
    __cReference: true,
    get value() { return LIGHTSWITCH____header_global_07b8e27b2f82b0d2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:248
export const SPACEDOORSWITCH____header_global_e0b134f3bfa77137 = ((u32(((u32(136) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_35c566242a8f41efde853f3b() {
  return __cxx_static_address_35c566242a8f41efde853f3b.reference || (__cxx_static_address_35c566242a8f41efde853f3b.reference = {
    __cReference: true,
    get value() { return SPACEDOORSWITCH____header_global_e0b134f3bfa77137; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:249
export const SPACELIGHTSWITCH____header_global_f9407b9d6c5dc383 = ((u32(((u32(138) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c04ad2d370625b8a00a97907() {
  return __cxx_static_address_c04ad2d370625b8a00a97907.reference || (__cxx_static_address_c04ad2d370625b8a00a97907.reference = {
    __cReference: true,
    get value() { return SPACELIGHTSWITCH____header_global_f9407b9d6c5dc383; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:250
export const FRANKENSTINESWITCH____header_global_bb53e811a1bf01d7 = ((u32(((u32(140) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9961d59db2f9f00a0b86c265() {
  return __cxx_static_address_9961d59db2f9f00a0b86c265.reference || (__cxx_static_address_9961d59db2f9f00a0b86c265.reference = {
    __cReference: true,
    get value() { return FRANKENSTINESWITCH____header_global_bb53e811a1bf01d7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:251
export const NUKEBUTTON____header_global_2c2409838c6bab62 = ((u32(((u32(142) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f2ebf82e4613342a45cd57f1() {
  return __cxx_static_address_f2ebf82e4613342a45cd57f1.reference || (__cxx_static_address_f2ebf82e4613342a45cd57f1.reference = {
    __cReference: true,
    get value() { return NUKEBUTTON____header_global_2c2409838c6bab62; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:252
export const MULTISWITCH____header_global_384bbf4e4d204944 = ((u32(((u32(146) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1c40141569f932f0cac1c227() {
  return __cxx_static_address_1c40141569f932f0cac1c227.reference || (__cxx_static_address_1c40141569f932f0cac1c227.reference = {
    __cReference: true,
    get value() { return MULTISWITCH____header_global_384bbf4e4d204944; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:253
export const DOORTILE5____header_global_bc91e9229bf404ba = ((u32(((u32(150) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_389eefcfbe76417129faa92c() {
  return __cxx_static_address_389eefcfbe76417129faa92c.reference || (__cxx_static_address_389eefcfbe76417129faa92c.reference = {
    __cReference: true,
    get value() { return DOORTILE5____header_global_bc91e9229bf404ba; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:254
export const DOORTILE6____header_global_b1928fb3e9b83367 = ((u32(((u32(151) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f04dbc1e8715d6c59a5e2bec() {
  return __cxx_static_address_f04dbc1e8715d6c59a5e2bec.reference || (__cxx_static_address_f04dbc1e8715d6c59a5e2bec.reference = {
    __cReference: true,
    get value() { return DOORTILE6____header_global_b1928fb3e9b83367; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:255
export const DOORTILE1____header_global_10686a1f5ab719a5 = ((u32(((u32(152) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e7f433c19be6ccec480b40ba() {
  return __cxx_static_address_e7f433c19be6ccec480b40ba.reference || (__cxx_static_address_e7f433c19be6ccec480b40ba.reference = {
    __cReference: true,
    get value() { return DOORTILE1____header_global_10686a1f5ab719a5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:256
export const DOORTILE2____header_global_84ffb9c5a7b9eb01 = ((u32(((u32(153) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3c7f2875e4276315dd6b45d1() {
  return __cxx_static_address_3c7f2875e4276315dd6b45d1.reference || (__cxx_static_address_3c7f2875e4276315dd6b45d1.reference = {
    __cReference: true,
    get value() { return DOORTILE2____header_global_84ffb9c5a7b9eb01; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:257
export const DOORTILE3____header_global_73e0425607d98dee = ((u32(((u32(154) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1aa86d5896e38d860c3ca889() {
  return __cxx_static_address_1aa86d5896e38d860c3ca889.reference || (__cxx_static_address_1aa86d5896e38d860c3ca889.reference = {
    __cReference: true,
    get value() { return DOORTILE3____header_global_73e0425607d98dee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:258
export const DOORTILE4____header_global_7af3d2ed4d0f5ee0 = ((u32(((u32(155) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a55722cc29f53519d7445cec() {
  return __cxx_static_address_a55722cc29f53519d7445cec.reference || (__cxx_static_address_a55722cc29f53519d7445cec.reference = {
    __cReference: true,
    get value() { return DOORTILE4____header_global_7af3d2ed4d0f5ee0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:259
export const DOORTILE7____header_global_3da1c3c333579b6b = ((u32(((u32(156) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e238234e7049cf8869d998d5() {
  return __cxx_static_address_e238234e7049cf8869d998d5.reference || (__cxx_static_address_e238234e7049cf8869d998d5.reference = {
    __cReference: true,
    get value() { return DOORTILE7____header_global_3da1c3c333579b6b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:260
export const DOORTILE8____header_global_b6237b56f246f5e6 = ((u32(((u32(157) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9952d74e9521e8e4cc748f6a() {
  return __cxx_static_address_9952d74e9521e8e4cc748f6a.reference || (__cxx_static_address_9952d74e9521e8e4cc748f6a.reference = {
    __cReference: true,
    get value() { return DOORTILE8____header_global_b6237b56f246f5e6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:261
export const DOORTILE9____header_global_8cae44a6765beeaf = ((u32(((u32(158) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_165016c0dadfc9f9aa4b39b2() {
  return __cxx_static_address_165016c0dadfc9f9aa4b39b2.reference || (__cxx_static_address_165016c0dadfc9f9aa4b39b2.reference = {
    __cReference: true,
    get value() { return DOORTILE9____header_global_8cae44a6765beeaf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:262
export const DOORTILE10____header_global_1f95ab6457ceb984 = ((u32(((u32(159) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_db55c8a199233fdf52c02d5d() {
  return __cxx_static_address_db55c8a199233fdf52c02d5d.reference || (__cxx_static_address_db55c8a199233fdf52c02d5d.reference = {
    __cReference: true,
    get value() { return DOORTILE10____header_global_1f95ab6457ceb984; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:263
export const DOORSHOCK____header_global_25ea598eaa98aa23 = ((u32(((u32(160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_53970965d0b6548dc2b74a97() {
  return __cxx_static_address_53970965d0b6548dc2b74a97.reference || (__cxx_static_address_53970965d0b6548dc2b74a97.reference = {
    __cReference: true,
    get value() { return DOORSHOCK____header_global_25ea598eaa98aa23; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:264
export const DIPSWITCH____header_global_3a029edcfa15c6f7 = ((u32(((u32(162) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8ca3edde6a3224db272b50ad() {
  return __cxx_static_address_8ca3edde6a3224db272b50ad.reference || (__cxx_static_address_8ca3edde6a3224db272b50ad.reference = {
    __cReference: true,
    get value() { return DIPSWITCH____header_global_3a029edcfa15c6f7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:265
export const DIPSWITCH2____header_global_553e6aeb347e3d57 = ((u32(((u32(164) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dbdde638bb17fca05aefdadf() {
  return __cxx_static_address_dbdde638bb17fca05aefdadf.reference || (__cxx_static_address_dbdde638bb17fca05aefdadf.reference = {
    __cReference: true,
    get value() { return DIPSWITCH2____header_global_553e6aeb347e3d57; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:266
export const TECHSWITCH____header_global_713314c74d6461c7 = ((u32(((u32(166) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e6ae772ec47fef7c6b181868() {
  return __cxx_static_address_e6ae772ec47fef7c6b181868.reference || (__cxx_static_address_e6ae772ec47fef7c6b181868.reference = {
    __cReference: true,
    get value() { return TECHSWITCH____header_global_713314c74d6461c7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:267
export const DIPSWITCH3____header_global_3cf3926f02b73bb2 = ((u32(((u32(168) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_95098bb29ee8516d1b07abc9() {
  return __cxx_static_address_95098bb29ee8516d1b07abc9.reference || (__cxx_static_address_95098bb29ee8516d1b07abc9.reference = {
    __cReference: true,
    get value() { return DIPSWITCH3____header_global_3cf3926f02b73bb2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:268
export const ACCESSSWITCH2____header_global_537f3b063a9b77c2 = ((u32(((u32(170) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7bb4fe6c7176b6b1b0c3622b() {
  return __cxx_static_address_7bb4fe6c7176b6b1b0c3622b.reference || (__cxx_static_address_7bb4fe6c7176b6b1b0c3622b.reference = {
    __cReference: true,
    get value() { return ACCESSSWITCH2____header_global_537f3b063a9b77c2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:269
export const FLOORSLIME____header_global_ec500934f3666e67 = ((u32(((u32(200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5a1fb8552a4e413fb89a1ca7() {
  return __cxx_static_address_5a1fb8552a4e413fb89a1ca7.reference || (__cxx_static_address_5a1fb8552a4e413fb89a1ca7.reference = {
    __cReference: true,
    get value() { return FLOORSLIME____header_global_ec500934f3666e67; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:270
export const BIGFORCE____header_global_883b623149e38e79 = ((u32(((u32(230) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_389ad73fa8edec7c66a17312() {
  return __cxx_static_address_389ad73fa8edec7c66a17312.reference || (__cxx_static_address_389ad73fa8edec7c66a17312.reference = {
    __cReference: true,
    get value() { return BIGFORCE____header_global_883b623149e38e79; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:271
export const MASKWALL9____header_global_de20a8475f4a412e = ((u32(((u32(255) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_43fba94c7f1308b48619e5fc() {
  return __cxx_static_address_43fba94c7f1308b48619e5fc.reference || (__cxx_static_address_43fba94c7f1308b48619e5fc.reference = {
    __cReference: true,
    get value() { return MASKWALL9____header_global_de20a8475f4a412e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:272
export const SCREENBREAK1____header_global_28373dee9985eb5a = ((u32(((u32(263) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ca671ec9a0f575e933e3d929() {
  return __cxx_static_address_ca671ec9a0f575e933e3d929.reference || (__cxx_static_address_ca671ec9a0f575e933e3d929.reference = {
    __cReference: true,
    get value() { return SCREENBREAK1____header_global_28373dee9985eb5a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:273
export const SCREENBREAK2____header_global_6a54b7ae7639fa05 = ((u32(((u32(264) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b07ebcc86803dd24245d3408() {
  return __cxx_static_address_b07ebcc86803dd24245d3408.reference || (__cxx_static_address_b07ebcc86803dd24245d3408.reference = {
    __cReference: true,
    get value() { return SCREENBREAK2____header_global_6a54b7ae7639fa05; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:274
export const SCREENBREAK3____header_global_9be61e90f2c8e13b = ((u32(((u32(265) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3bb2cf1179710b53b2c7c24d() {
  return __cxx_static_address_3bb2cf1179710b53b2c7c24d.reference || (__cxx_static_address_3bb2cf1179710b53b2c7c24d.reference = {
    __cReference: true,
    get value() { return SCREENBREAK3____header_global_9be61e90f2c8e13b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:275
export const SCREENBREAK4____header_global_e2fd4bb5d0a36c5f = ((u32(((u32(266) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0d0b8f7f4f5610eda92f780e() {
  return __cxx_static_address_0d0b8f7f4f5610eda92f780e.reference || (__cxx_static_address_0d0b8f7f4f5610eda92f780e.reference = {
    __cReference: true,
    get value() { return SCREENBREAK4____header_global_e2fd4bb5d0a36c5f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:276
export const SCREENBREAK5____header_global_6a2c63d3e456119d = ((u32(((u32(267) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1db5ccf6dd9ef264552c660f() {
  return __cxx_static_address_1db5ccf6dd9ef264552c660f.reference || (__cxx_static_address_1db5ccf6dd9ef264552c660f.reference = {
    __cReference: true,
    get value() { return SCREENBREAK5____header_global_6a2c63d3e456119d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:277
export const SCREENBREAK6____header_global_aabd303add881aa7 = ((u32(((u32(268) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_88b62ae20a5a8b746af78d70() {
  return __cxx_static_address_88b62ae20a5a8b746af78d70.reference || (__cxx_static_address_88b62ae20a5a8b746af78d70.reference = {
    __cReference: true,
    get value() { return SCREENBREAK6____header_global_aabd303add881aa7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:278
export const SCREENBREAK7____header_global_89104d26b742c988 = ((u32(((u32(269) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_361e809cbcc0c5dee5723710() {
  return __cxx_static_address_361e809cbcc0c5dee5723710.reference || (__cxx_static_address_361e809cbcc0c5dee5723710.reference = {
    __cReference: true,
    get value() { return SCREENBREAK7____header_global_89104d26b742c988; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:279
export const SCREENBREAK8____header_global_d34667f2ed7afc4b = ((u32(((u32(270) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_45cde69b8edbd6e800989451() {
  return __cxx_static_address_45cde69b8edbd6e800989451.reference || (__cxx_static_address_45cde69b8edbd6e800989451.reference = {
    __cReference: true,
    get value() { return SCREENBREAK8____header_global_d34667f2ed7afc4b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:280
export const SCREENBREAK9____header_global_011b6af6a72d8945 = ((u32(((u32(271) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ce393b051b27e15d034a5b13() {
  return __cxx_static_address_ce393b051b27e15d034a5b13.reference || (__cxx_static_address_ce393b051b27e15d034a5b13.reference = {
    __cReference: true,
    get value() { return SCREENBREAK9____header_global_011b6af6a72d8945; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:281
export const SCREENBREAK10____header_global_dd7dbf93b2333e0a = ((u32(((u32(272) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a905502138905964a1d80ad4() {
  return __cxx_static_address_a905502138905964a1d80ad4.reference || (__cxx_static_address_a905502138905964a1d80ad4.reference = {
    __cReference: true,
    get value() { return SCREENBREAK10____header_global_dd7dbf93b2333e0a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:282
export const SCREENBREAK11____header_global_066cf3c5c0a875ba = ((u32(((u32(273) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9f7f2354f505c983e2554fb8() {
  return __cxx_static_address_9f7f2354f505c983e2554fb8.reference || (__cxx_static_address_9f7f2354f505c983e2554fb8.reference = {
    __cReference: true,
    get value() { return SCREENBREAK11____header_global_066cf3c5c0a875ba; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:283
export const SCREENBREAK12____header_global_980b8c78adb3e0b4 = ((u32(((u32(274) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_007b4c45c6f9f6e5af70ade7() {
  return __cxx_static_address_007b4c45c6f9f6e5af70ade7.reference || (__cxx_static_address_007b4c45c6f9f6e5af70ade7.reference = {
    __cReference: true,
    get value() { return SCREENBREAK12____header_global_980b8c78adb3e0b4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:284
export const SCREENBREAK13____header_global_09d803dd4a01297a = ((u32(((u32(275) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1c8f97b98524765fce89e575() {
  return __cxx_static_address_1c8f97b98524765fce89e575.reference || (__cxx_static_address_1c8f97b98524765fce89e575.reference = {
    __cReference: true,
    get value() { return SCREENBREAK13____header_global_09d803dd4a01297a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:285
export const MASKWALL1____header_global_595b785f53a819ef = ((u32(((u32(285) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aaa4c30ff656fb6cc79b57ef() {
  return __cxx_static_address_aaa4c30ff656fb6cc79b57ef.reference || (__cxx_static_address_aaa4c30ff656fb6cc79b57ef.reference = {
    __cReference: true,
    get value() { return MASKWALL1____header_global_595b785f53a819ef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:286
export const W_TECHWALL1____header_global_a860448ff5c5adc2 = ((u32(((u32(293) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_88dc1f6499af543d650f0720() {
  return __cxx_static_address_88dc1f6499af543d650f0720.reference || (__cxx_static_address_88dc1f6499af543d650f0720.reference = {
    __cReference: true,
    get value() { return W_TECHWALL1____header_global_a860448ff5c5adc2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:287
export const W_TECHWALL2____header_global_e27829a100cd67d3 = ((u32(((u32(297) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3b52dff2b0fedd0ed39c217a() {
  return __cxx_static_address_3b52dff2b0fedd0ed39c217a.reference || (__cxx_static_address_3b52dff2b0fedd0ed39c217a.reference = {
    __cReference: true,
    get value() { return W_TECHWALL2____header_global_e27829a100cd67d3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:288
export const W_TECHWALL15____header_global_53d48b9d64d72fd8 = ((u32(((u32(299) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_46f3fe0b64e310fcaf2b09c4() {
  return __cxx_static_address_46f3fe0b64e310fcaf2b09c4.reference || (__cxx_static_address_46f3fe0b64e310fcaf2b09c4.reference = {
    __cReference: true,
    get value() { return W_TECHWALL15____header_global_53d48b9d64d72fd8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:289
export const W_TECHWALL3____header_global_3df0640804ec24c4 = ((u32(((u32(301) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_706ff0c01ab710bd75e58d46() {
  return __cxx_static_address_706ff0c01ab710bd75e58d46.reference || (__cxx_static_address_706ff0c01ab710bd75e58d46.reference = {
    __cReference: true,
    get value() { return W_TECHWALL3____header_global_3df0640804ec24c4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:290
export const W_TECHWALL4____header_global_851fa369a393b621 = ((u32(((u32(305) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_edff2d42f4668d779aa1daf8() {
  return __cxx_static_address_edff2d42f4668d779aa1daf8.reference || (__cxx_static_address_edff2d42f4668d779aa1daf8.reference = {
    __cReference: true,
    get value() { return W_TECHWALL4____header_global_851fa369a393b621; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:291
export const W_TECHWALL10____header_global_37160d1835c3eaa2 = ((u32(((u32(306) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c6836a206a6c15a7e980f5f2() {
  return __cxx_static_address_c6836a206a6c15a7e980f5f2.reference || (__cxx_static_address_c6836a206a6c15a7e980f5f2.reference = {
    __cReference: true,
    get value() { return W_TECHWALL10____header_global_37160d1835c3eaa2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:292
export const W_TECHWALL16____header_global_4587cd09790b17c4 = ((u32(((u32(307) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_93e19f48f2a86292636e32e5() {
  return __cxx_static_address_93e19f48f2a86292636e32e5.reference || (__cxx_static_address_93e19f48f2a86292636e32e5.reference = {
    __cReference: true,
    get value() { return W_TECHWALL16____header_global_4587cd09790b17c4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:293
export const WATERTILE2____header_global_bda8198313108528 = ((u32(((u32(336) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_712ccad125f0a2a776b7ec97() {
  return __cxx_static_address_712ccad125f0a2a776b7ec97.reference || (__cxx_static_address_712ccad125f0a2a776b7ec97.reference = {
    __cReference: true,
    get value() { return WATERTILE2____header_global_bda8198313108528; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:294
export const BPANNEL1____header_global_aed6381ce4aa3281 = ((u32(((u32(341) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_db0294ecaf24340ebdcf4a4b() {
  return __cxx_static_address_db0294ecaf24340ebdcf4a4b.reference || (__cxx_static_address_db0294ecaf24340ebdcf4a4b.reference = {
    __cReference: true,
    get value() { return BPANNEL1____header_global_aed6381ce4aa3281; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:295
export const PANNEL1____header_global_608552c654adb80b = ((u32(((u32(342) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6d05ae5ae3c46ba71f0bf8d5() {
  return __cxx_static_address_6d05ae5ae3c46ba71f0bf8d5.reference || (__cxx_static_address_6d05ae5ae3c46ba71f0bf8d5.reference = {
    __cReference: true,
    get value() { return PANNEL1____header_global_608552c654adb80b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:296
export const PANNEL2____header_global_e8bc7f43e2e0c133 = ((u32(((u32(343) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_065903345338e5f1584bbe55() {
  return __cxx_static_address_065903345338e5f1584bbe55.reference || (__cxx_static_address_065903345338e5f1584bbe55.reference = {
    __cReference: true,
    get value() { return PANNEL2____header_global_e8bc7f43e2e0c133; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:297
export const STATIC____header_global_a6487979ceb410ea = ((u32(((u32(351) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2b84114c10fff895c8209259() {
  return __cxx_static_address_2b84114c10fff895c8209259.reference || (__cxx_static_address_2b84114c10fff895c8209259.reference = {
    __cReference: true,
    get value() { return STATIC____header_global_a6487979ceb410ea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:298
export const W_SCREENBREAK____header_global_d8028474fe10a2cd = ((u32(((u32(357) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_96ff6995d81fd5acacf601bf() {
  return __cxx_static_address_96ff6995d81fd5acacf601bf.reference || (__cxx_static_address_96ff6995d81fd5acacf601bf.reference = {
    __cReference: true,
    get value() { return W_SCREENBREAK____header_global_d8028474fe10a2cd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:299
export const W_HITTECHWALL3____header_global_c3e51729a65d1fc8 = ((u32(((u32(360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b7c35f886a8c447ff3e82390() {
  return __cxx_static_address_b7c35f886a8c447ff3e82390.reference || (__cxx_static_address_b7c35f886a8c447ff3e82390.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL3____header_global_c3e51729a65d1fc8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:300
export const W_HITTECHWALL4____header_global_be6312c33a999853 = ((u32(((u32(361) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6a181c65c5d40063465d653b() {
  return __cxx_static_address_6a181c65c5d40063465d653b.reference || (__cxx_static_address_6a181c65c5d40063465d653b.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL4____header_global_be6312c33a999853; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:301
export const W_HITTECHWALL2____header_global_c0b6c09fc41e3b94 = ((u32(((u32(362) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_45a07210e8add3e7bd04c710() {
  return __cxx_static_address_45a07210e8add3e7bd04c710.reference || (__cxx_static_address_45a07210e8add3e7bd04c710.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL2____header_global_c0b6c09fc41e3b94; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:302
export const W_HITTECHWALL1____header_global_622d24ad20d1b6e3 = ((u32(((u32(363) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_670fe21b4bf9e3cb12961d24() {
  return __cxx_static_address_670fe21b4bf9e3cb12961d24.reference || (__cxx_static_address_670fe21b4bf9e3cb12961d24.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL1____header_global_622d24ad20d1b6e3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:303
export const MASKWALL10____header_global_91b02a3601ae5da9 = ((u32(((u32(387) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7fb04387ac1b2cd61b37c0ba() {
  return __cxx_static_address_7fb04387ac1b2cd61b37c0ba.reference || (__cxx_static_address_7fb04387ac1b2cd61b37c0ba.reference = {
    __cReference: true,
    get value() { return MASKWALL10____header_global_91b02a3601ae5da9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:304
export const MASKWALL11____header_global_547b21bd0aa68dd3 = ((u32(((u32(391) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a77217890f038fecc87e662e() {
  return __cxx_static_address_a77217890f038fecc87e662e.reference || (__cxx_static_address_a77217890f038fecc87e662e.reference = {
    __cReference: true,
    get value() { return MASKWALL11____header_global_547b21bd0aa68dd3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:305
export const DOORTILE22____header_global_b639315810dc786d = ((u32(((u32(395) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e7ee04d5eda0f0b2ac6105ac() {
  return __cxx_static_address_e7ee04d5eda0f0b2ac6105ac.reference || (__cxx_static_address_e7ee04d5eda0f0b2ac6105ac.reference = {
    __cReference: true,
    get value() { return DOORTILE22____header_global_b639315810dc786d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:306
export const FANSPRITE____header_global_ef08af7cf0db85f6 = ((u32(((u32(407) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a8b9a94df464c8dea5760387() {
  return __cxx_static_address_a8b9a94df464c8dea5760387.reference || (__cxx_static_address_a8b9a94df464c8dea5760387.reference = {
    __cReference: true,
    get value() { return FANSPRITE____header_global_ef08af7cf0db85f6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:307
export const FANSPRITEBROKE____header_global_e3cc5c326e02aae5 = ((u32(((u32(411) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6c57b860bf2f3d3a90841c63() {
  return __cxx_static_address_6c57b860bf2f3d3a90841c63.reference || (__cxx_static_address_6c57b860bf2f3d3a90841c63.reference = {
    __cReference: true,
    get value() { return FANSPRITEBROKE____header_global_e3cc5c326e02aae5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:308
export const FANSHADOW____header_global_56c4e29848b50fda = ((u32(((u32(412) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_571fb8b623fd4f9d365fb415() {
  return __cxx_static_address_571fb8b623fd4f9d365fb415.reference || (__cxx_static_address_571fb8b623fd4f9d365fb415.reference = {
    __cReference: true,
    get value() { return FANSHADOW____header_global_56c4e29848b50fda; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:309
export const FANSHADOWBROKE____header_global_f845adcf874e5347 = ((u32(((u32(416) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_00e4f46d3bacea6fcf38ea14() {
  return __cxx_static_address_00e4f46d3bacea6fcf38ea14.reference || (__cxx_static_address_00e4f46d3bacea6fcf38ea14.reference = {
    __cReference: true,
    get value() { return FANSHADOWBROKE____header_global_f845adcf874e5347; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:310
export const DOORTILE18____header_global_e880dcd62c767e67 = ((u32(((u32(447) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_89ac13062bd93bb9ecbc533a() {
  return __cxx_static_address_89ac13062bd93bb9ecbc533a.reference || (__cxx_static_address_89ac13062bd93bb9ecbc533a.reference = {
    __cReference: true,
    get value() { return DOORTILE18____header_global_e880dcd62c767e67; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:311
export const DOORTILE19____header_global_c3acf72d689dcc65 = ((u32(((u32(448) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d08d20111cea8a4e0b6198a1() {
  return __cxx_static_address_d08d20111cea8a4e0b6198a1.reference || (__cxx_static_address_d08d20111cea8a4e0b6198a1.reference = {
    __cReference: true,
    get value() { return DOORTILE19____header_global_c3acf72d689dcc65; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:312
export const DOORTILE20____header_global_2e23d916e3c5da20 = ((u32(((u32(449) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0c216b971c97c8a7f8e2ecd9() {
  return __cxx_static_address_0c216b971c97c8a7f8e2ecd9.reference || (__cxx_static_address_0c216b971c97c8a7f8e2ecd9.reference = {
    __cReference: true,
    get value() { return DOORTILE20____header_global_2e23d916e3c5da20; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:313
export const VIEWSCREEN2____header_global_17080cd9a2a5a0f1 = ((u32(((u32(499) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ff2d8f6e4365cca2eb41bf54() {
  return __cxx_static_address_ff2d8f6e4365cca2eb41bf54.reference || (__cxx_static_address_ff2d8f6e4365cca2eb41bf54.reference = {
    __cReference: true,
    get value() { return VIEWSCREEN2____header_global_17080cd9a2a5a0f1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:314
export const VIEWSCREEN____header_global_352e71d18743654f = ((u32(((u32(502) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_120b2b1dc26a6da846c33a10() {
  return __cxx_static_address_120b2b1dc26a6da846c33a10.reference || (__cxx_static_address_120b2b1dc26a6da846c33a10.reference = {
    __cReference: true,
    get value() { return VIEWSCREEN____header_global_352e71d18743654f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:315
export const GLASS____header_global_e59fc2e0085ffbc3 = ((u32(((u32(503) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7024818a2313ac95daf6a0c3() {
  return __cxx_static_address_7024818a2313ac95daf6a0c3.reference || (__cxx_static_address_7024818a2313ac95daf6a0c3.reference = {
    __cReference: true,
    get value() { return GLASS____header_global_e59fc2e0085ffbc3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:316
export const GLASS2____header_global_ca36514cfae5877c = ((u32(((u32(504) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d099934adacdba72f8048730() {
  return __cxx_static_address_d099934adacdba72f8048730.reference || (__cxx_static_address_d099934adacdba72f8048730.reference = {
    __cReference: true,
    get value() { return GLASS2____header_global_ca36514cfae5877c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:317
export const STAINGLASS1____header_global_88ed482b85c58108 = ((u32(((u32(510) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_445457164b57657aaa070e67() {
  return __cxx_static_address_445457164b57657aaa070e67.reference || (__cxx_static_address_445457164b57657aaa070e67.reference = {
    __cReference: true,
    get value() { return STAINGLASS1____header_global_88ed482b85c58108; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:318
export const MASKWALL5____header_global_58f401a4e5b26bf6 = ((u32(((u32(514) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_10b3007717ca63ff06481a57() {
  return __cxx_static_address_10b3007717ca63ff06481a57.reference || (__cxx_static_address_10b3007717ca63ff06481a57.reference = {
    __cReference: true,
    get value() { return MASKWALL5____header_global_58f401a4e5b26bf6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:319
export const SATELITE____header_global_e06667d5fcda17da = ((u32(((u32(516) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0f4c498faae81b8e8234da69() {
  return __cxx_static_address_0f4c498faae81b8e8234da69.reference || (__cxx_static_address_0f4c498faae81b8e8234da69.reference = {
    __cReference: true,
    get value() { return SATELITE____header_global_e06667d5fcda17da; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:320
export const FUELPOD____header_global_7d434b09d82f1c65 = ((u32(((u32(517) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_801932089ac1dd873aac168a() {
  return __cxx_static_address_801932089ac1dd873aac168a.reference || (__cxx_static_address_801932089ac1dd873aac168a.reference = {
    __cReference: true,
    get value() { return FUELPOD____header_global_7d434b09d82f1c65; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:321
export const CRACK1____header_global_a607819c655861d6 = ((u32(((u32(546) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6a0447bd40173c1f683061f5() {
  return __cxx_static_address_6a0447bd40173c1f683061f5.reference || (__cxx_static_address_6a0447bd40173c1f683061f5.reference = {
    __cReference: true,
    get value() { return CRACK1____header_global_a607819c655861d6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:322
export const CRACK2____header_global_d7ec3944d2057d0d = ((u32(((u32(547) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_858dd4e59f4458f18a3ee6b3() {
  return __cxx_static_address_858dd4e59f4458f18a3ee6b3.reference || (__cxx_static_address_858dd4e59f4458f18a3ee6b3.reference = {
    __cReference: true,
    get value() { return CRACK2____header_global_d7ec3944d2057d0d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:323
export const CRACK3____header_global_1adde2bfd2d5f672 = ((u32(((u32(548) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_29f5f8e6993944a587b8b0ba() {
  return __cxx_static_address_29f5f8e6993944a587b8b0ba.reference || (__cxx_static_address_29f5f8e6993944a587b8b0ba.reference = {
    __cReference: true,
    get value() { return CRACK3____header_global_1adde2bfd2d5f672; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:324
export const CRACK4____header_global_3c03ab3f6680519f = ((u32(((u32(549) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_88c4cf10b4ef9c36c9ab135f() {
  return __cxx_static_address_88c4cf10b4ef9c36c9ab135f.reference || (__cxx_static_address_88c4cf10b4ef9c36c9ab135f.reference = {
    __cReference: true,
    get value() { return CRACK4____header_global_3c03ab3f6680519f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:325
export const FOOTPRINTS____header_global_7747da2f120f9094 = ((u32(((u32(550) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3935c1c5280f5ea0a298675c() {
  return __cxx_static_address_3935c1c5280f5ea0a298675c.reference || (__cxx_static_address_3935c1c5280f5ea0a298675c.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS____header_global_7747da2f120f9094; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:326
export const DOMELITE____header_global_eddb9c914853b993 = ((u32(((u32(551) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_87a4382e626f80149f3998dd() {
  return __cxx_static_address_87a4382e626f80149f3998dd.reference || (__cxx_static_address_87a4382e626f80149f3998dd.reference = {
    __cReference: true,
    get value() { return DOMELITE____header_global_eddb9c914853b993; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:327
export const CAMERAPOLE____header_global_4d8ad3ab269f0620 = ((u32(((u32(554) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_38758f8ae2f61ed14066db24() {
  return __cxx_static_address_38758f8ae2f61ed14066db24.reference || (__cxx_static_address_38758f8ae2f61ed14066db24.reference = {
    __cReference: true,
    get value() { return CAMERAPOLE____header_global_4d8ad3ab269f0620; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:328
export const CHAIR1____header_global_e4817c78018a34dd = ((u32(((u32(556) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_92ce9c85ae440950e9bf8cc0() {
  return __cxx_static_address_92ce9c85ae440950e9bf8cc0.reference || (__cxx_static_address_92ce9c85ae440950e9bf8cc0.reference = {
    __cReference: true,
    get value() { return CHAIR1____header_global_e4817c78018a34dd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:329
export const CHAIR2____header_global_10c96f4c1e9261c7 = ((u32(((u32(557) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_22fa12b2c92cfd157c92b3a1() {
  return __cxx_static_address_22fa12b2c92cfd157c92b3a1.reference || (__cxx_static_address_22fa12b2c92cfd157c92b3a1.reference = {
    __cReference: true,
    get value() { return CHAIR2____header_global_10c96f4c1e9261c7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:330
export const BROKENCHAIR____header_global_d3ee9b09ecc948ae = ((u32(((u32(559) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6c3005ab68dc149fba01f3d4() {
  return __cxx_static_address_6c3005ab68dc149fba01f3d4.reference || (__cxx_static_address_6c3005ab68dc149fba01f3d4.reference = {
    __cReference: true,
    get value() { return BROKENCHAIR____header_global_d3ee9b09ecc948ae; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:331
export const MIRROR____header_global_4e35b65af26f4bbb = ((u32(((u32(560) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_12efd270292eb90ccb5e4a5d() {
  return __cxx_static_address_12efd270292eb90ccb5e4a5d.reference || (__cxx_static_address_12efd270292eb90ccb5e4a5d.reference = {
    __cReference: true,
    get value() { return MIRROR____header_global_4e35b65af26f4bbb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:332
export const WATERFOUNTAIN____header_global_8960b680c7230a4a = ((u32(((u32(563) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f001e3277c34ba99c8164391() {
  return __cxx_static_address_f001e3277c34ba99c8164391.reference || (__cxx_static_address_f001e3277c34ba99c8164391.reference = {
    __cReference: true,
    get value() { return WATERFOUNTAIN____header_global_8960b680c7230a4a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:333
export const WATERFOUNTAINBROKE____header_global_ea7449a03f5c9d63 = ((u32(((u32(567) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_793c2bcaa106845951216779() {
  return __cxx_static_address_793c2bcaa106845951216779.reference || (__cxx_static_address_793c2bcaa106845951216779.reference = {
    __cReference: true,
    get value() { return WATERFOUNTAINBROKE____header_global_ea7449a03f5c9d63; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:334
export const FEMMAG1____header_global_3f35336956bc299a = ((u32(((u32(568) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_df3b4480559a09c302e6b583() {
  return __cxx_static_address_df3b4480559a09c302e6b583.reference || (__cxx_static_address_df3b4480559a09c302e6b583.reference = {
    __cReference: true,
    get value() { return FEMMAG1____header_global_3f35336956bc299a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:335
export const TOILET____header_global_56e3836c669dbb69 = ((u32(((u32(569) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a2d09cdfb0ef928011099dd0() {
  return __cxx_static_address_a2d09cdfb0ef928011099dd0.reference || (__cxx_static_address_a2d09cdfb0ef928011099dd0.reference = {
    __cReference: true,
    get value() { return TOILET____header_global_56e3836c669dbb69; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:336
export const STALL____header_global_d06c985226502510 = ((u32(((u32(571) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3e114b7783ce5df05fdeee6d() {
  return __cxx_static_address_3e114b7783ce5df05fdeee6d.reference || (__cxx_static_address_3e114b7783ce5df05fdeee6d.reference = {
    __cReference: true,
    get value() { return STALL____header_global_d06c985226502510; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:337
export const STALLBROKE____header_global_ecbfb055e2bddf42 = ((u32(((u32(573) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dbf4abc651e7f7fdb807c23e() {
  return __cxx_static_address_dbf4abc651e7f7fdb807c23e.reference || (__cxx_static_address_dbf4abc651e7f7fdb807c23e.reference = {
    __cReference: true,
    get value() { return STALLBROKE____header_global_ecbfb055e2bddf42; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:338
export const FEMMAG2____header_global_7256395a7b9d96ba = ((u32(((u32(577) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8eb6bd722d5bf35a06d9cda4() {
  return __cxx_static_address_8eb6bd722d5bf35a06d9cda4.reference || (__cxx_static_address_8eb6bd722d5bf35a06d9cda4.reference = {
    __cReference: true,
    get value() { return FEMMAG2____header_global_7256395a7b9d96ba; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:339
export const REACTOR2____header_global_6e81da804d789aea = ((u32(((u32(578) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8fd3b60099fa71bbfde0ea51() {
  return __cxx_static_address_8fd3b60099fa71bbfde0ea51.reference || (__cxx_static_address_8fd3b60099fa71bbfde0ea51.reference = {
    __cReference: true,
    get value() { return REACTOR2____header_global_6e81da804d789aea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:340
export const REACTOR2BURNT____header_global_52f0334338d24362 = ((u32(((u32(579) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0c1f6627805a8d1e535b9b80() {
  return __cxx_static_address_0c1f6627805a8d1e535b9b80.reference || (__cxx_static_address_0c1f6627805a8d1e535b9b80.reference = {
    __cReference: true,
    get value() { return REACTOR2BURNT____header_global_52f0334338d24362; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:341
export const REACTOR2SPARK____header_global_4864c6b59cae7e36 = ((u32(((u32(580) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1b6260ea416904d74040a051() {
  return __cxx_static_address_1b6260ea416904d74040a051.reference || (__cxx_static_address_1b6260ea416904d74040a051.reference = {
    __cReference: true,
    get value() { return REACTOR2SPARK____header_global_4864c6b59cae7e36; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:342
export const GRATE1____header_global_d429903cc00cb9d2 = ((u32(((u32(595) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b0b25cf907ec753fa0520540() {
  return __cxx_static_address_b0b25cf907ec753fa0520540.reference || (__cxx_static_address_b0b25cf907ec753fa0520540.reference = {
    __cReference: true,
    get value() { return GRATE1____header_global_d429903cc00cb9d2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:343
export const BGRATE1____header_global_ac97a7ee44ccf3f7 = ((u32(((u32(596) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_092fb4e507366794f059125e() {
  return __cxx_static_address_092fb4e507366794f059125e.reference || (__cxx_static_address_092fb4e507366794f059125e.reference = {
    __cReference: true,
    get value() { return BGRATE1____header_global_ac97a7ee44ccf3f7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:344
export const SOLARPANNEL____header_global_77899335eaff318a = ((u32(((u32(602) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_66ec03c26981cf072dd96c61() {
  return __cxx_static_address_66ec03c26981cf072dd96c61.reference || (__cxx_static_address_66ec03c26981cf072dd96c61.reference = {
    __cReference: true,
    get value() { return SOLARPANNEL____header_global_77899335eaff318a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:345
export const NAKED1____header_global_9935d9e66bd4c9c4 = ((u32(((u32(603) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_df319d29223d2e20e3ad130b() {
  return __cxx_static_address_df319d29223d2e20e3ad130b.reference || (__cxx_static_address_df319d29223d2e20e3ad130b.reference = {
    __cReference: true,
    get value() { return NAKED1____header_global_9935d9e66bd4c9c4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:346
export const ANTENNA____header_global_66da33f413c9bd83 = ((u32(((u32(607) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ac3309cf9bc620b4dae36dec() {
  return __cxx_static_address_ac3309cf9bc620b4dae36dec.reference || (__cxx_static_address_ac3309cf9bc620b4dae36dec.reference = {
    __cReference: true,
    get value() { return ANTENNA____header_global_66da33f413c9bd83; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:347
export const MASKWALL12____header_global_c755386d9050ac01 = ((u32(((u32(609) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e589c2cce40e99f93e3ef274() {
  return __cxx_static_address_e589c2cce40e99f93e3ef274.reference || (__cxx_static_address_e589c2cce40e99f93e3ef274.reference = {
    __cReference: true,
    get value() { return MASKWALL12____header_global_c755386d9050ac01; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:348
export const TOILETBROKE____header_global_72cd878e406a956a = ((u32(((u32(615) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_deabc5e65170a85b8a164e89() {
  return __cxx_static_address_deabc5e65170a85b8a164e89.reference || (__cxx_static_address_deabc5e65170a85b8a164e89.reference = {
    __cReference: true,
    get value() { return TOILETBROKE____header_global_72cd878e406a956a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:349
export const PIPE2____header_global_8265748d9b9fb741 = ((u32(((u32(616) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_53df3520bbf71044f2ea3b75() {
  return __cxx_static_address_53df3520bbf71044f2ea3b75.reference || (__cxx_static_address_53df3520bbf71044f2ea3b75.reference = {
    __cReference: true,
    get value() { return PIPE2____header_global_8265748d9b9fb741; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:350
export const PIPE1B____header_global_041350a9faa0a87a = ((u32(((u32(617) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_207ab494b9504af581780685() {
  return __cxx_static_address_207ab494b9504af581780685.reference || (__cxx_static_address_207ab494b9504af581780685.reference = {
    __cReference: true,
    get value() { return PIPE1B____header_global_041350a9faa0a87a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:351
export const PIPE3____header_global_a60acc4696049b05 = ((u32(((u32(618) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0bc0f97faba5ca071c0a9b31() {
  return __cxx_static_address_0bc0f97faba5ca071c0a9b31.reference || (__cxx_static_address_0bc0f97faba5ca071c0a9b31.reference = {
    __cReference: true,
    get value() { return PIPE3____header_global_a60acc4696049b05; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:352
export const PIPE1____header_global_7f2fe85a67d2abb0 = ((u32(((u32(619) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f8f03bd39253d7a792801a51() {
  return __cxx_static_address_f8f03bd39253d7a792801a51.reference || (__cxx_static_address_f8f03bd39253d7a792801a51.reference = {
    __cReference: true,
    get value() { return PIPE1____header_global_7f2fe85a67d2abb0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:353
export const CAMERA1____header_global_78ee394ce49bdbce = ((u32(((u32(621) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e84774cfec5a93e0445e6ec9() {
  return __cxx_static_address_e84774cfec5a93e0445e6ec9.reference || (__cxx_static_address_e84774cfec5a93e0445e6ec9.reference = {
    __cReference: true,
    get value() { return CAMERA1____header_global_78ee394ce49bdbce; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:354
export const PIPE2B____header_global_35398d21c04e2461 = ((u32(((u32(633) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a3f8525be2c2f4001b3b52ae() {
  return __cxx_static_address_a3f8525be2c2f4001b3b52ae.reference || (__cxx_static_address_a3f8525be2c2f4001b3b52ae.reference = {
    __cReference: true,
    get value() { return PIPE2B____header_global_35398d21c04e2461; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:355
export const BOLT1____header_global_45207a01385aa705 = ((u32(((u32(634) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9763cafb764bb5d915ce7651() {
  return __cxx_static_address_9763cafb764bb5d915ce7651.reference || (__cxx_static_address_9763cafb764bb5d915ce7651.reference = {
    __cReference: true,
    get value() { return BOLT1____header_global_45207a01385aa705; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:356
export const W_NUMBERS____header_global_25d2d63d5fe25eea = ((u32(((u32(640) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7ec55e9bdf33d8c14e2800f8() {
  return __cxx_static_address_7ec55e9bdf33d8c14e2800f8.reference || (__cxx_static_address_7ec55e9bdf33d8c14e2800f8.reference = {
    __cReference: true,
    get value() { return W_NUMBERS____header_global_25d2d63d5fe25eea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:357
export const WATERDRIP____header_global_4585a71d51d40252 = ((u32(((u32(660) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1f390592c6a12cf83e5f37ae() {
  return __cxx_static_address_1f390592c6a12cf83e5f37ae.reference || (__cxx_static_address_1f390592c6a12cf83e5f37ae.reference = {
    __cReference: true,
    get value() { return WATERDRIP____header_global_4585a71d51d40252; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:358
export const WATERBUBBLE____header_global_10a603c21f24a8c7 = ((u32(((u32(661) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f4b70b2f07b00fbea71574fb() {
  return __cxx_static_address_f4b70b2f07b00fbea71574fb.reference || (__cxx_static_address_f4b70b2f07b00fbea71574fb.reference = {
    __cReference: true,
    get value() { return WATERBUBBLE____header_global_10a603c21f24a8c7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:359
export const WATERBUBBLEMAKER____header_global_a037e360a2747316 = ((u32(((u32(662) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0f158b395abdff1e3071f42b() {
  return __cxx_static_address_0f158b395abdff1e3071f42b.reference || (__cxx_static_address_0f158b395abdff1e3071f42b.reference = {
    __cReference: true,
    get value() { return WATERBUBBLEMAKER____header_global_a037e360a2747316; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:360
export const W_FORCEFIELD____header_global_14aa3029f43978df = ((u32(((u32(663) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c65a51ac1f9b7c99929fa99b() {
  return __cxx_static_address_c65a51ac1f9b7c99929fa99b.reference || (__cxx_static_address_c65a51ac1f9b7c99929fa99b.reference = {
    __cReference: true,
    get value() { return W_FORCEFIELD____header_global_14aa3029f43978df; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:361
export const VACUUM____header_global_7485147afc832111 = ((u32(((u32(669) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_40ad20e9817d02100acbe05a() {
  return __cxx_static_address_40ad20e9817d02100acbe05a.reference || (__cxx_static_address_40ad20e9817d02100acbe05a.reference = {
    __cReference: true,
    get value() { return VACUUM____header_global_7485147afc832111; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:362
export const FOOTPRINTS2____header_global_336353ea49a5540b = ((u32(((u32(672) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c7587a0244dc936f705b2acd() {
  return __cxx_static_address_c7587a0244dc936f705b2acd.reference || (__cxx_static_address_c7587a0244dc936f705b2acd.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS2____header_global_336353ea49a5540b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:363
export const FOOTPRINTS3____header_global_187f37de14c78189 = ((u32(((u32(673) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3e01bee21f444def72d76ba9() {
  return __cxx_static_address_3e01bee21f444def72d76ba9.reference || (__cxx_static_address_3e01bee21f444def72d76ba9.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS3____header_global_187f37de14c78189; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:364
export const FOOTPRINTS4____header_global_722eb04f5e0d9941 = ((u32(((u32(674) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5ac2bbf293b2a9710e473471() {
  return __cxx_static_address_5ac2bbf293b2a9710e473471.reference || (__cxx_static_address_5ac2bbf293b2a9710e473471.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS4____header_global_722eb04f5e0d9941; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:365
export const EGG____header_global_a6c3306ca24a79df = ((u32(((u32(675) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_63329b53870e794d96f4135c() {
  return __cxx_static_address_63329b53870e794d96f4135c.reference || (__cxx_static_address_63329b53870e794d96f4135c.reference = {
    __cReference: true,
    get value() { return EGG____header_global_a6c3306ca24a79df; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:366
export const SCALE____header_global_aa840923acc902de = ((u32(((u32(678) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_08e8cd101549fc5cbc52c2a1() {
  return __cxx_static_address_08e8cd101549fc5cbc52c2a1.reference || (__cxx_static_address_08e8cd101549fc5cbc52c2a1.reference = {
    __cReference: true,
    get value() { return SCALE____header_global_aa840923acc902de; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:367
export const CHAIR3____header_global_15c0076c65f010b9 = ((u32(((u32(680) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4e652a7608a27f18a8637a63() {
  return __cxx_static_address_4e652a7608a27f18a8637a63.reference || (__cxx_static_address_4e652a7608a27f18a8637a63.reference = {
    __cReference: true,
    get value() { return CHAIR3____header_global_15c0076c65f010b9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:368
export const CAMERALIGHT____header_global_ff24810a57326111 = ((u32(((u32(685) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_19353e0859cd74c376c0c7af() {
  return __cxx_static_address_19353e0859cd74c376c0c7af.reference || (__cxx_static_address_19353e0859cd74c376c0c7af.reference = {
    __cReference: true,
    get value() { return CAMERALIGHT____header_global_ff24810a57326111; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:369
export const MOVIECAMERA____header_global_cfb45774ddb0eff0 = ((u32(((u32(686) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ec3f4e99dac4f3a1e098e5b9() {
  return __cxx_static_address_ec3f4e99dac4f3a1e098e5b9.reference || (__cxx_static_address_ec3f4e99dac4f3a1e098e5b9.reference = {
    __cReference: true,
    get value() { return MOVIECAMERA____header_global_cfb45774ddb0eff0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:370
export const IVUNIT____header_global_93f1ba38ffbeb9da = ((u32(((u32(689) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a9907da4dd2e529ce3a18fda() {
  return __cxx_static_address_a9907da4dd2e529ce3a18fda.reference || (__cxx_static_address_a9907da4dd2e529ce3a18fda.reference = {
    __cReference: true,
    get value() { return IVUNIT____header_global_93f1ba38ffbeb9da; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:371
export const POT1____header_global_b1f673eff5260428 = ((u32(((u32(694) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_52cda4b398980277d3f7e1e5() {
  return __cxx_static_address_52cda4b398980277d3f7e1e5.reference || (__cxx_static_address_52cda4b398980277d3f7e1e5.reference = {
    __cReference: true,
    get value() { return POT1____header_global_b1f673eff5260428; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:372
export const POT2____header_global_5899818c097505a1 = ((u32(((u32(695) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eaf6af06ba76a6581ebde2ff() {
  return __cxx_static_address_eaf6af06ba76a6581ebde2ff.reference || (__cxx_static_address_eaf6af06ba76a6581ebde2ff.reference = {
    __cReference: true,
    get value() { return POT2____header_global_5899818c097505a1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:373
export const POT3____header_global_d8b08522a0499aaf = ((u32(((u32(697) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c9b9ede0bd2d5f104be1aa41() {
  return __cxx_static_address_c9b9ede0bd2d5f104be1aa41.reference || (__cxx_static_address_c9b9ede0bd2d5f104be1aa41.reference = {
    __cReference: true,
    get value() { return POT3____header_global_d8b08522a0499aaf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:374
export const PIPE3B____header_global_4d3466eaf6ff1f92 = ((u32(((u32(700) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fe1bc73a3e4809aef2801d2f() {
  return __cxx_static_address_fe1bc73a3e4809aef2801d2f.reference || (__cxx_static_address_fe1bc73a3e4809aef2801d2f.reference = {
    __cReference: true,
    get value() { return PIPE3B____header_global_4d3466eaf6ff1f92; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:375
export const WALLLIGHT3____header_global_0f8d217a00988c3f = ((u32(((u32(701) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ad338b4dd6501f2903bb3e3a() {
  return __cxx_static_address_ad338b4dd6501f2903bb3e3a.reference || (__cxx_static_address_ad338b4dd6501f2903bb3e3a.reference = {
    __cReference: true,
    get value() { return WALLLIGHT3____header_global_0f8d217a00988c3f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:376
export const WALLLIGHTBUST3____header_global_aaf23baddba8f317 = ((u32(((u32(702) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_072d0c56fa9d04410caeed6a() {
  return __cxx_static_address_072d0c56fa9d04410caeed6a.reference || (__cxx_static_address_072d0c56fa9d04410caeed6a.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST3____header_global_aaf23baddba8f317; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:377
export const WALLLIGHT1____header_global_a1749bcf81fea833 = ((u32(((u32(703) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d03ce3bc3546976034178806() {
  return __cxx_static_address_d03ce3bc3546976034178806.reference || (__cxx_static_address_d03ce3bc3546976034178806.reference = {
    __cReference: true,
    get value() { return WALLLIGHT1____header_global_a1749bcf81fea833; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:378
export const WALLLIGHTBUST1____header_global_ed89bbcb490ba884 = ((u32(((u32(704) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3c27b31bb4c154a09bc1a7cd() {
  return __cxx_static_address_3c27b31bb4c154a09bc1a7cd.reference || (__cxx_static_address_3c27b31bb4c154a09bc1a7cd.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST1____header_global_ed89bbcb490ba884; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:379
export const WALLLIGHT2____header_global_9d5f56fd2f4bace6 = ((u32(((u32(705) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4a26c6b57135a8f6533d5471() {
  return __cxx_static_address_4a26c6b57135a8f6533d5471.reference || (__cxx_static_address_4a26c6b57135a8f6533d5471.reference = {
    __cReference: true,
    get value() { return WALLLIGHT2____header_global_9d5f56fd2f4bace6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:380
export const WALLLIGHTBUST2____header_global_ac97540005f305df = ((u32(((u32(706) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_77d2a7ec5a4fed27f45ddbc9() {
  return __cxx_static_address_77d2a7ec5a4fed27f45ddbc9.reference || (__cxx_static_address_77d2a7ec5a4fed27f45ddbc9.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST2____header_global_ac97540005f305df; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:381
export const LIGHTSWITCH2____header_global_5d59b25776ab1cea = ((u32(((u32(712) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a6e2324309c052838e16b203() {
  return __cxx_static_address_a6e2324309c052838e16b203.reference || (__cxx_static_address_a6e2324309c052838e16b203.reference = {
    __cReference: true,
    get value() { return LIGHTSWITCH2____header_global_5d59b25776ab1cea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:382
export const WAITTOBESEATED____header_global_0646993732268270 = ((u32(((u32(716) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_70a948a6f85cfa7fc129c014() {
  return __cxx_static_address_70a948a6f85cfa7fc129c014.reference || (__cxx_static_address_70a948a6f85cfa7fc129c014.reference = {
    __cReference: true,
    get value() { return WAITTOBESEATED____header_global_0646993732268270; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:383
export const DOORTILE14____header_global_812420073aa1133d = ((u32(((u32(717) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c9a37aa28d129e1b47480e16() {
  return __cxx_static_address_c9a37aa28d129e1b47480e16.reference || (__cxx_static_address_c9a37aa28d129e1b47480e16.reference = {
    __cReference: true,
    get value() { return DOORTILE14____header_global_812420073aa1133d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:384
export const STATUE____header_global_38489654fdc2fb9f = ((u32(((u32(753) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0aba128ae3e99a0235bbe8de() {
  return __cxx_static_address_0aba128ae3e99a0235bbe8de.reference || (__cxx_static_address_0aba128ae3e99a0235bbe8de.reference = {
    __cReference: true,
    get value() { return STATUE____header_global_38489654fdc2fb9f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:385
export const MIKE____header_global_f236a72e2d3ffc9b = ((u32(((u32(762) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dede38ec0a924c6ab904ba81() {
  return __cxx_static_address_dede38ec0a924c6ab904ba81.reference || (__cxx_static_address_dede38ec0a924c6ab904ba81.reference = {
    __cReference: true,
    get value() { return MIKE____header_global_f236a72e2d3ffc9b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:386
export const VASE____header_global_36e9c16822aefe64 = ((u32(((u32(765) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_74778f254682743cdcb3c912() {
  return __cxx_static_address_74778f254682743cdcb3c912.reference || (__cxx_static_address_74778f254682743cdcb3c912.reference = {
    __cReference: true,
    get value() { return VASE____header_global_36e9c16822aefe64; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:387
export const SUSHIPLATE1____header_global_ad84a35d942a81ef = ((u32(((u32(768) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8a41a78ccade7faddee22470() {
  return __cxx_static_address_8a41a78ccade7faddee22470.reference || (__cxx_static_address_8a41a78ccade7faddee22470.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE1____header_global_ad84a35d942a81ef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:388
export const SUSHIPLATE2____header_global_bf6ed3a9c20f56c6 = ((u32(((u32(769) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9907417c82cd9a5900cf36ff() {
  return __cxx_static_address_9907417c82cd9a5900cf36ff.reference || (__cxx_static_address_9907417c82cd9a5900cf36ff.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE2____header_global_bf6ed3a9c20f56c6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:389
export const SUSHIPLATE3____header_global_530a6c929510a2db = ((u32(((u32(774) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f2adf659b4d62990c17f0225() {
  return __cxx_static_address_f2adf659b4d62990c17f0225.reference || (__cxx_static_address_f2adf659b4d62990c17f0225.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE3____header_global_530a6c929510a2db; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:390
export const SUSHIPLATE4____header_global_115f67853d5d4a13 = ((u32(((u32(779) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5a6dbdce136208d8f1b3b3d7() {
  return __cxx_static_address_5a6dbdce136208d8f1b3b3d7.reference || (__cxx_static_address_5a6dbdce136208d8f1b3b3d7.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE4____header_global_115f67853d5d4a13; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:391
export const DOORTILE16____header_global_94c4ebd847ba7437 = ((u32(((u32(781) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bef3a1cf56d098bf2823304b() {
  return __cxx_static_address_bef3a1cf56d098bf2823304b.reference || (__cxx_static_address_bef3a1cf56d098bf2823304b.reference = {
    __cReference: true,
    get value() { return DOORTILE16____header_global_94c4ebd847ba7437; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:392
export const SUSHIPLATE5____header_global_2158958a9311c046 = ((u32(((u32(792) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e297785cc565518f7bcf09cd() {
  return __cxx_static_address_e297785cc565518f7bcf09cd.reference || (__cxx_static_address_e297785cc565518f7bcf09cd.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE5____header_global_2158958a9311c046; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:393
export const OJ____header_global_58691e00dd9060ab = ((u32(((u32(806) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e4917fe6b4518fee111a98c6() {
  return __cxx_static_address_e4917fe6b4518fee111a98c6.reference || (__cxx_static_address_e4917fe6b4518fee111a98c6.reference = {
    __cReference: true,
    get value() { return OJ____header_global_58691e00dd9060ab; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:394
export const MASKWALL13____header_global_e3cb6961aecf6324 = ((u32(((u32(830) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b7b4101cb518f4ce225f55f6() {
  return __cxx_static_address_b7b4101cb518f4ce225f55f6.reference || (__cxx_static_address_b7b4101cb518f4ce225f55f6.reference = {
    __cReference: true,
    get value() { return MASKWALL13____header_global_e3cb6961aecf6324; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:395
export const HURTRAIL____header_global_7371b9ac36899dfe = ((u32(((u32(859) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eb7248e6503d20540778c404() {
  return __cxx_static_address_eb7248e6503d20540778c404.reference || (__cxx_static_address_eb7248e6503d20540778c404.reference = {
    __cReference: true,
    get value() { return HURTRAIL____header_global_7371b9ac36899dfe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:396
export const POWERSWITCH1____header_global_4f6e1d84af26d3b3 = ((u32(((u32(860) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_96c386f2027e9f78a69ec66f() {
  return __cxx_static_address_96c386f2027e9f78a69ec66f.reference || (__cxx_static_address_96c386f2027e9f78a69ec66f.reference = {
    __cReference: true,
    get value() { return POWERSWITCH1____header_global_4f6e1d84af26d3b3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:397
export const LOCKSWITCH1____header_global_c7b2132cbebdd8ec = ((u32(((u32(862) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_818d9482ae3a99e686e40f11() {
  return __cxx_static_address_818d9482ae3a99e686e40f11.reference || (__cxx_static_address_818d9482ae3a99e686e40f11.reference = {
    __cReference: true,
    get value() { return LOCKSWITCH1____header_global_c7b2132cbebdd8ec; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:398
export const POWERSWITCH2____header_global_69fe5c84e42d9e8d = ((u32(((u32(864) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4cfc508718f3341cf48e05b8() {
  return __cxx_static_address_4cfc508718f3341cf48e05b8.reference || (__cxx_static_address_4cfc508718f3341cf48e05b8.reference = {
    __cReference: true,
    get value() { return POWERSWITCH2____header_global_69fe5c84e42d9e8d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:399
export const ATM____header_global_04dbd3b26df5f184 = ((u32(((u32(867) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f3d7286e1be61e15aa46d425() {
  return __cxx_static_address_f3d7286e1be61e15aa46d425.reference || (__cxx_static_address_f3d7286e1be61e15aa46d425.reference = {
    __cReference: true,
    get value() { return ATM____header_global_04dbd3b26df5f184; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:400
export const STATUEFLASH____header_global_64b2b577cedec5e7 = ((u32(((u32(869) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1a8a3dc4a0dbc8205d4f53f7() {
  return __cxx_static_address_1a8a3dc4a0dbc8205d4f53f7.reference || (__cxx_static_address_1a8a3dc4a0dbc8205d4f53f7.reference = {
    __cReference: true,
    get value() { return STATUEFLASH____header_global_64b2b577cedec5e7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:401
export const ATMBROKE____header_global_a57dc867447991c7 = ((u32(((u32(888) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_74eeaf6ac14b3176120e70f1() {
  return __cxx_static_address_74eeaf6ac14b3176120e70f1.reference || (__cxx_static_address_74eeaf6ac14b3176120e70f1.reference = {
    __cReference: true,
    get value() { return ATMBROKE____header_global_a57dc867447991c7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:402
export const STRIPEBALL____header_global_48e2bfd4068bfefd = ((u32(((u32(901) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1bdeb3899f323a89f2c529df() {
  return __cxx_static_address_1bdeb3899f323a89f2c529df.reference || (__cxx_static_address_1bdeb3899f323a89f2c529df.reference = {
    __cReference: true,
    get value() { return STRIPEBALL____header_global_48e2bfd4068bfefd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:403
export const QUEBALL____header_global_f8e88345e4d56142 = ((u32(((u32(902) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4c2a7d662260713d8214ec26() {
  return __cxx_static_address_4c2a7d662260713d8214ec26.reference || (__cxx_static_address_4c2a7d662260713d8214ec26.reference = {
    __cReference: true,
    get value() { return QUEBALL____header_global_f8e88345e4d56142; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:404
export const POCKET____header_global_3f40d306660bfae5 = ((u32(((u32(903) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_98f99da91b9e26a7358c186e() {
  return __cxx_static_address_98f99da91b9e26a7358c186e.reference || (__cxx_static_address_98f99da91b9e26a7358c186e.reference = {
    __cReference: true,
    get value() { return POCKET____header_global_3f40d306660bfae5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:405
export const WOODENHORSE____header_global_2aac8765103d1272 = ((u32(((u32(904) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8ec3f0bcb118de2b7988f8d8() {
  return __cxx_static_address_8ec3f0bcb118de2b7988f8d8.reference || (__cxx_static_address_8ec3f0bcb118de2b7988f8d8.reference = {
    __cReference: true,
    get value() { return WOODENHORSE____header_global_2aac8765103d1272; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:406
export const TREE1____header_global_b6c80360f5cb39da = ((u32(((u32(908) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6cfd67146cf284189ce87314() {
  return __cxx_static_address_6cfd67146cf284189ce87314.reference || (__cxx_static_address_6cfd67146cf284189ce87314.reference = {
    __cReference: true,
    get value() { return TREE1____header_global_b6c80360f5cb39da; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:407
export const TREE2____header_global_ec457e1f3ae3d9f2 = ((u32(((u32(910) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_636b3307b6ec1ec68f2094db() {
  return __cxx_static_address_636b3307b6ec1ec68f2094db.reference || (__cxx_static_address_636b3307b6ec1ec68f2094db.reference = {
    __cReference: true,
    get value() { return TREE2____header_global_ec457e1f3ae3d9f2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:408
export const CACTUS____header_global_a8f00f2f3a49dd9e = ((u32(((u32(911) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_72722ef0153e0e40ffbce069() {
  return __cxx_static_address_72722ef0153e0e40ffbce069.reference || (__cxx_static_address_72722ef0153e0e40ffbce069.reference = {
    __cReference: true,
    get value() { return CACTUS____header_global_a8f00f2f3a49dd9e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:409
export const MASKWALL2____header_global_38b76fa809a03f4f = ((u32(((u32(913) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_862a6c812d90211f204861d3() {
  return __cxx_static_address_862a6c812d90211f204861d3.reference || (__cxx_static_address_862a6c812d90211f204861d3.reference = {
    __cReference: true,
    get value() { return MASKWALL2____header_global_38b76fa809a03f4f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:410
export const MASKWALL3____header_global_cf7031d73a7bf683 = ((u32(((u32(914) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_801f771631249a6d0f9dce4a() {
  return __cxx_static_address_801f771631249a6d0f9dce4a.reference || (__cxx_static_address_801f771631249a6d0f9dce4a.reference = {
    __cReference: true,
    get value() { return MASKWALL3____header_global_cf7031d73a7bf683; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:411
export const MASKWALL4____header_global_d1ff5f1e8dd77fd4 = ((u32(((u32(915) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e51e146f598289592e2e7ee7() {
  return __cxx_static_address_e51e146f598289592e2e7ee7.reference || (__cxx_static_address_e51e146f598289592e2e7ee7.reference = {
    __cReference: true,
    get value() { return MASKWALL4____header_global_d1ff5f1e8dd77fd4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:412
export const FIREEXT____header_global_5746a436f0acf206 = ((u32(((u32(916) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5a856ad1f6d64545f67731e9() {
  return __cxx_static_address_5a856ad1f6d64545f67731e9.reference || (__cxx_static_address_5a856ad1f6d64545f67731e9.reference = {
    __cReference: true,
    get value() { return FIREEXT____header_global_5746a436f0acf206; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:413
export const TOILETWATER____header_global_7c32fd8650177bca = ((u32(((u32(921) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dfcb531ad0ba955463d6f931() {
  return __cxx_static_address_dfcb531ad0ba955463d6f931.reference || (__cxx_static_address_dfcb531ad0ba955463d6f931.reference = {
    __cReference: true,
    get value() { return TOILETWATER____header_global_7c32fd8650177bca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:414
export const NEON1____header_global_55bbe9ab5b2d3da0 = ((u32(((u32(925) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_69eb5a643d29e6c13dfd9617() {
  return __cxx_static_address_69eb5a643d29e6c13dfd9617.reference || (__cxx_static_address_69eb5a643d29e6c13dfd9617.reference = {
    __cReference: true,
    get value() { return NEON1____header_global_55bbe9ab5b2d3da0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:415
export const NEON2____header_global_873a5021d75267bf = ((u32(((u32(926) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_02b7ea90c0a85cab5a02e4b4() {
  return __cxx_static_address_02b7ea90c0a85cab5a02e4b4.reference || (__cxx_static_address_02b7ea90c0a85cab5a02e4b4.reference = {
    __cReference: true,
    get value() { return NEON2____header_global_873a5021d75267bf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:416
export const CACTUSBROKE____header_global_f6f92c61d0e9cbb3 = ((u32(((u32(939) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a19be701b8e7ae032ca69693() {
  return __cxx_static_address_a19be701b8e7ae032ca69693.reference || (__cxx_static_address_a19be701b8e7ae032ca69693.reference = {
    __cReference: true,
    get value() { return CACTUSBROKE____header_global_f6f92c61d0e9cbb3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:417
export const BOUNCEMINE____header_global_388e204d0bd69ce9 = ((u32(((u32(940) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b3c15527779b7e73a6b27596() {
  return __cxx_static_address_b3c15527779b7e73a6b27596.reference || (__cxx_static_address_b3c15527779b7e73a6b27596.reference = {
    __cReference: true,
    get value() { return BOUNCEMINE____header_global_388e204d0bd69ce9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:418
export const BROKEFIREHYDRENT____header_global_4edf018bdbbe2696 = ((u32(((u32(950) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_49f10fe3291e94bf076dd37c() {
  return __cxx_static_address_49f10fe3291e94bf076dd37c.reference || (__cxx_static_address_49f10fe3291e94bf076dd37c.reference = {
    __cReference: true,
    get value() { return BROKEFIREHYDRENT____header_global_4edf018bdbbe2696; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:419
export const BOX____header_global_4d66007329e23c17 = ((u32(((u32(951) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b293680961802606a95383a2() {
  return __cxx_static_address_b293680961802606a95383a2.reference || (__cxx_static_address_b293680961802606a95383a2.reference = {
    __cReference: true,
    get value() { return BOX____header_global_4d66007329e23c17; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:420
export const BULLETHOLE____header_global_abf581aca8270ecd = ((u32(((u32(952) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fe5ddb3701acfd1d0731669e() {
  return __cxx_static_address_fe5ddb3701acfd1d0731669e.reference || (__cxx_static_address_fe5ddb3701acfd1d0731669e.reference = {
    __cReference: true,
    get value() { return BULLETHOLE____header_global_abf581aca8270ecd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:421
export const BOTTLE1____header_global_aebc10fee6c0cc26 = ((u32(((u32(954) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1d20c0fdc619724bd970c63b() {
  return __cxx_static_address_1d20c0fdc619724bd970c63b.reference || (__cxx_static_address_1d20c0fdc619724bd970c63b.reference = {
    __cReference: true,
    get value() { return BOTTLE1____header_global_aebc10fee6c0cc26; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:422
export const BOTTLE2____header_global_b20ef40c7133c2ee = ((u32(((u32(955) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8ccb484e46029f3f4b5bacf2() {
  return __cxx_static_address_8ccb484e46029f3f4b5bacf2.reference || (__cxx_static_address_8ccb484e46029f3f4b5bacf2.reference = {
    __cReference: true,
    get value() { return BOTTLE2____header_global_b20ef40c7133c2ee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:423
export const BOTTLE3____header_global_d953038ca3c36459 = ((u32(((u32(956) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_32394fca7a4c6fed5b4e2fe4() {
  return __cxx_static_address_32394fca7a4c6fed5b4e2fe4.reference || (__cxx_static_address_32394fca7a4c6fed5b4e2fe4.reference = {
    __cReference: true,
    get value() { return BOTTLE3____header_global_d953038ca3c36459; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:424
export const BOTTLE4____header_global_882bd27f904185b3 = ((u32(((u32(957) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8ca18e1076cd184d81fcdc45() {
  return __cxx_static_address_8ca18e1076cd184d81fcdc45.reference || (__cxx_static_address_8ca18e1076cd184d81fcdc45.reference = {
    __cReference: true,
    get value() { return BOTTLE4____header_global_882bd27f904185b3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:425
export const FEMPIC5____header_global_50a8da7d77e9f4a3 = ((u32(((u32(963) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_94dc8be4a34d68cbf680a118() {
  return __cxx_static_address_94dc8be4a34d68cbf680a118.reference || (__cxx_static_address_94dc8be4a34d68cbf680a118.reference = {
    __cReference: true,
    get value() { return FEMPIC5____header_global_50a8da7d77e9f4a3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:426
export const FEMPIC6____header_global_4ade5582c195695c = ((u32(((u32(964) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_34e0c4c289ae979022eafb29() {
  return __cxx_static_address_34e0c4c289ae979022eafb29.reference || (__cxx_static_address_34e0c4c289ae979022eafb29.reference = {
    __cReference: true,
    get value() { return FEMPIC6____header_global_4ade5582c195695c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:427
export const FEMPIC7____header_global_d061bfe1a0959c92 = ((u32(((u32(965) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1ca9afb20908ee4252c15482() {
  return __cxx_static_address_1ca9afb20908ee4252c15482.reference || (__cxx_static_address_1ca9afb20908ee4252c15482.reference = {
    __cReference: true,
    get value() { return FEMPIC7____header_global_d061bfe1a0959c92; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:428
export const HYDROPLANT____header_global_4569e559431195a4 = ((u32(((u32(969) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_67886ee728fcccdede77d425() {
  return __cxx_static_address_67886ee728fcccdede77d425.reference || (__cxx_static_address_67886ee728fcccdede77d425.reference = {
    __cReference: true,
    get value() { return HYDROPLANT____header_global_4569e559431195a4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:429
export const OCEANSPRITE1____header_global_ef9cefd5f3d14ce8 = ((u32(((u32(971) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aab02be917f6b55a99c47913() {
  return __cxx_static_address_aab02be917f6b55a99c47913.reference || (__cxx_static_address_aab02be917f6b55a99c47913.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE1____header_global_ef9cefd5f3d14ce8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:430
export const OCEANSPRITE2____header_global_33924a913558aa11 = ((u32(((u32(972) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5c44ac93a298cb14c1946309() {
  return __cxx_static_address_5c44ac93a298cb14c1946309.reference || (__cxx_static_address_5c44ac93a298cb14c1946309.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE2____header_global_33924a913558aa11; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:431
export const OCEANSPRITE3____header_global_207861c05e635e3a = ((u32(((u32(973) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7216fb2c22131cc787a4c48a() {
  return __cxx_static_address_7216fb2c22131cc787a4c48a.reference || (__cxx_static_address_7216fb2c22131cc787a4c48a.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE3____header_global_207861c05e635e3a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:432
export const OCEANSPRITE4____header_global_c64e6197f5a75cb6 = ((u32(((u32(974) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e835fa768d679f15b6c16245() {
  return __cxx_static_address_e835fa768d679f15b6c16245.reference || (__cxx_static_address_e835fa768d679f15b6c16245.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE4____header_global_c64e6197f5a75cb6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:433
export const OCEANSPRITE5____header_global_dcbf87ab34beb9a2 = ((u32(((u32(975) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6cf44165b0287603cf383fcb() {
  return __cxx_static_address_6cf44165b0287603cf383fcb.reference || (__cxx_static_address_6cf44165b0287603cf383fcb.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE5____header_global_dcbf87ab34beb9a2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:434
export const GENERICPOLE____header_global_0407730a4bdc8888 = ((u32(((u32(977) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ed812a7ad321f061992f047c() {
  return __cxx_static_address_ed812a7ad321f061992f047c.reference || (__cxx_static_address_ed812a7ad321f061992f047c.reference = {
    __cReference: true,
    get value() { return GENERICPOLE____header_global_0407730a4bdc8888; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:435
export const CONE____header_global_e2bad4aa7eac0ca5 = ((u32(((u32(978) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8ef0c5f517e9835f1a2c6207() {
  return __cxx_static_address_8ef0c5f517e9835f1a2c6207.reference || (__cxx_static_address_8ef0c5f517e9835f1a2c6207.reference = {
    __cReference: true,
    get value() { return CONE____header_global_e2bad4aa7eac0ca5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:436
export const HANGLIGHT____header_global_4aa6e305042c8f01 = ((u32(((u32(979) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b04300077c9e006fc006c0dc() {
  return __cxx_static_address_b04300077c9e006fc006c0dc.reference || (__cxx_static_address_b04300077c9e006fc006c0dc.reference = {
    __cReference: true,
    get value() { return HANGLIGHT____header_global_4aa6e305042c8f01; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:437
export const HYDRENT____header_global_82afd979470ba6aa = ((u32(((u32(981) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4873fc4244b1db49ae01f7d0() {
  return __cxx_static_address_4873fc4244b1db49ae01f7d0.reference || (__cxx_static_address_4873fc4244b1db49ae01f7d0.reference = {
    __cReference: true,
    get value() { return HYDRENT____header_global_82afd979470ba6aa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:438
export const MASKWALL14____header_global_5970b35e302b3b28 = ((u32(((u32(988) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fc33f78585e4857b4fabdecb() {
  return __cxx_static_address_fc33f78585e4857b4fabdecb.reference || (__cxx_static_address_fc33f78585e4857b4fabdecb.reference = {
    __cReference: true,
    get value() { return MASKWALL14____header_global_5970b35e302b3b28; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:439
export const TIRE____header_global_2c1ca46302f35838 = ((u32(((u32(990) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_528768da80d073428ea894d6() {
  return __cxx_static_address_528768da80d073428ea894d6.reference || (__cxx_static_address_528768da80d073428ea894d6.reference = {
    __cReference: true,
    get value() { return TIRE____header_global_2c1ca46302f35838; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:440
export const PIPE5____header_global_0484b5afbb6821ab = ((u32(((u32(994) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e23ce609fe25003120c988aa() {
  return __cxx_static_address_e23ce609fe25003120c988aa.reference || (__cxx_static_address_e23ce609fe25003120c988aa.reference = {
    __cReference: true,
    get value() { return PIPE5____header_global_0484b5afbb6821ab; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:441
export const PIPE6____header_global_3cd88f0151ee6e63 = ((u32(((u32(995) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7dd4e3f82aa626688294ec2e() {
  return __cxx_static_address_7dd4e3f82aa626688294ec2e.reference || (__cxx_static_address_7dd4e3f82aa626688294ec2e.reference = {
    __cReference: true,
    get value() { return PIPE6____header_global_3cd88f0151ee6e63; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:442
export const PIPE4____header_global_c5bc215054f7ae19 = ((u32(((u32(996) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f2e18578867a9369061aab70() {
  return __cxx_static_address_f2e18578867a9369061aab70.reference || (__cxx_static_address_f2e18578867a9369061aab70.reference = {
    __cReference: true,
    get value() { return PIPE4____header_global_c5bc215054f7ae19; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:443
export const PIPE4B____header_global_3cd0a3cb7da2115f = ((u32(((u32(997) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4b05be0ecf89820a1835aaf5() {
  return __cxx_static_address_4b05be0ecf89820a1835aaf5.reference || (__cxx_static_address_4b05be0ecf89820a1835aaf5.reference = {
    __cReference: true,
    get value() { return PIPE4B____header_global_3cd0a3cb7da2115f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:444
export const BROKEHYDROPLANT____header_global_bb4ab0ac0bf46ba4 = ((u32(((u32(1003) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0f52d54271732e64901ebf8e() {
  return __cxx_static_address_0f52d54271732e64901ebf8e.reference || (__cxx_static_address_0f52d54271732e64901ebf8e.reference = {
    __cReference: true,
    get value() { return BROKEHYDROPLANT____header_global_bb4ab0ac0bf46ba4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:445
export const PIPE5B____header_global_03f8dfa3277749e8 = ((u32(((u32(1005) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_13cd55186cce50a555814fea() {
  return __cxx_static_address_13cd55186cce50a555814fea.reference || (__cxx_static_address_13cd55186cce50a555814fea.reference = {
    __cReference: true,
    get value() { return PIPE5B____header_global_03f8dfa3277749e8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:446
export const NEON3____header_global_f0d98e84e7835554 = ((u32(((u32(1007) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cd65284bd44e9d5892c07b9d() {
  return __cxx_static_address_cd65284bd44e9d5892c07b9d.reference || (__cxx_static_address_cd65284bd44e9d5892c07b9d.reference = {
    __cReference: true,
    get value() { return NEON3____header_global_f0d98e84e7835554; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:447
export const NEON4____header_global_4e64c5d749aa4601 = ((u32(((u32(1008) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b387fb16b64458cb6f4fcc46() {
  return __cxx_static_address_b387fb16b64458cb6f4fcc46.reference || (__cxx_static_address_b387fb16b64458cb6f4fcc46.reference = {
    __cReference: true,
    get value() { return NEON4____header_global_4e64c5d749aa4601; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:448
export const NEON5____header_global_3580deb26e51e035 = ((u32(((u32(1009) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f925869822ef04c691e167fb() {
  return __cxx_static_address_f925869822ef04c691e167fb.reference || (__cxx_static_address_f925869822ef04c691e167fb.reference = {
    __cReference: true,
    get value() { return NEON5____header_global_3580deb26e51e035; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:449
export const BOTTLE5____header_global_ee82427ff937410f = ((u32(((u32(1012) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2a6afb6d215f47d51d611ac3() {
  return __cxx_static_address_2a6afb6d215f47d51d611ac3.reference || (__cxx_static_address_2a6afb6d215f47d51d611ac3.reference = {
    __cReference: true,
    get value() { return BOTTLE5____header_global_ee82427ff937410f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:450
export const BOTTLE6____header_global_24d1f925022d3cdd = ((u32(((u32(1013) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5378fab09a338e12cbeacca9() {
  return __cxx_static_address_5378fab09a338e12cbeacca9.reference || (__cxx_static_address_5378fab09a338e12cbeacca9.reference = {
    __cReference: true,
    get value() { return BOTTLE6____header_global_24d1f925022d3cdd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:451
export const BOTTLE8____header_global_2aa9d90ff089a8d8 = ((u32(((u32(1014) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_618287e8e2a26dcc0de77387() {
  return __cxx_static_address_618287e8e2a26dcc0de77387.reference || (__cxx_static_address_618287e8e2a26dcc0de77387.reference = {
    __cReference: true,
    get value() { return BOTTLE8____header_global_2aa9d90ff089a8d8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:452
export const SPOTLITE____header_global_1a696fcb0d153e3e = ((u32(((u32(1020) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dc046c3dfb7a106851ce3870() {
  return __cxx_static_address_dc046c3dfb7a106851ce3870.reference || (__cxx_static_address_dc046c3dfb7a106851ce3870.reference = {
    __cReference: true,
    get value() { return SPOTLITE____header_global_1a696fcb0d153e3e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:453
export const MASKWALL15____header_global_c779ea58727c13b1 = ((u32(((u32(1024) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3cbfaa0c28395324d294896b() {
  return __cxx_static_address_3cbfaa0c28395324d294896b.reference || (__cxx_static_address_3cbfaa0c28395324d294896b.reference = {
    __cReference: true,
    get value() { return MASKWALL15____header_global_c779ea58727c13b1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:454
export const BOTTLE7____header_global_436821b0d11cfb21 = ((u32(((u32(1025) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d97d6839100c61a1e2235890() {
  return __cxx_static_address_d97d6839100c61a1e2235890.reference || (__cxx_static_address_d97d6839100c61a1e2235890.reference = {
    __cReference: true,
    get value() { return BOTTLE7____header_global_436821b0d11cfb21; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:455
export const HORSEONSIDE____header_global_f05bd560cecc5780 = ((u32(((u32(1026) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cc17c60ad0e9e710a00625bf() {
  return __cxx_static_address_cc17c60ad0e9e710a00625bf.reference || (__cxx_static_address_cc17c60ad0e9e710a00625bf.reference = {
    __cReference: true,
    get value() { return HORSEONSIDE____header_global_f05bd560cecc5780; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:456
export const GLASSPIECES____header_global_972b9e5975d76e4a = ((u32(((u32(1031) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_63f7829df4221fa829a95413() {
  return __cxx_static_address_63f7829df4221fa829a95413.reference || (__cxx_static_address_63f7829df4221fa829a95413.reference = {
    __cReference: true,
    get value() { return GLASSPIECES____header_global_972b9e5975d76e4a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:457
export const NEON6____header_global_d95bb42282caf46b = ((u32(((u32(1046) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3f75fd148aae9b42e30420f6() {
  return __cxx_static_address_3f75fd148aae9b42e30420f6.reference || (__cxx_static_address_3f75fd148aae9b42e30420f6.reference = {
    __cReference: true,
    get value() { return NEON6____header_global_d95bb42282caf46b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:458
export const MASKWALL6____header_global_bd51e6e37c81971e = ((u32(((u32(1059) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_96bb6192b25502760a111d6f() {
  return __cxx_static_address_96bb6192b25502760a111d6f.reference || (__cxx_static_address_96bb6192b25502760a111d6f.reference = {
    __cReference: true,
    get value() { return MASKWALL6____header_global_bd51e6e37c81971e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:459
export const RUBBERCAN____header_global_264e1e636ab2653a = ((u32(((u32(1062) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ac055e1c04a712628785950d() {
  return __cxx_static_address_ac055e1c04a712628785950d.reference || (__cxx_static_address_ac055e1c04a712628785950d.reference = {
    __cReference: true,
    get value() { return RUBBERCAN____header_global_264e1e636ab2653a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:460
export const PLUG____header_global_15005d7ce7fb0a1c = ((u32(((u32(1069) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_47af2c08f9a20d040f133cb9() {
  return __cxx_static_address_47af2c08f9a20d040f133cb9.reference || (__cxx_static_address_47af2c08f9a20d040f133cb9.reference = {
    __cReference: true,
    get value() { return PLUG____header_global_15005d7ce7fb0a1c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:461
export const OOZFILTER____header_global_1cb4386b71101a01 = ((u32(((u32(1079) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2b880fae9105fe2096de4c4f() {
  return __cxx_static_address_2b880fae9105fe2096de4c4f.reference || (__cxx_static_address_2b880fae9105fe2096de4c4f.reference = {
    __cReference: true,
    get value() { return OOZFILTER____header_global_1cb4386b71101a01; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:462
export const FLOORPLASMA____header_global_c0df30a385d1155d = ((u32(((u32(1082) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c18ffb4d0c653d3a65115313() {
  return __cxx_static_address_c18ffb4d0c653d3a65115313.reference || (__cxx_static_address_c18ffb4d0c653d3a65115313.reference = {
    __cReference: true,
    get value() { return FLOORPLASMA____header_global_c0df30a385d1155d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:463
export const REACTOR____header_global_f84f5ad9b64548ac = ((u32(((u32(1088) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_25cbc452ce1a76090aae57b0() {
  return __cxx_static_address_25cbc452ce1a76090aae57b0.reference || (__cxx_static_address_25cbc452ce1a76090aae57b0.reference = {
    __cReference: true,
    get value() { return REACTOR____header_global_f84f5ad9b64548ac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:464
export const REACTORSPARK____header_global_6986d7e0ea41662f = ((u32(((u32(1092) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ef9034347bad62028b82eb4a() {
  return __cxx_static_address_ef9034347bad62028b82eb4a.reference || (__cxx_static_address_ef9034347bad62028b82eb4a.reference = {
    __cReference: true,
    get value() { return REACTORSPARK____header_global_6986d7e0ea41662f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:465
export const REACTORBURNT____header_global_ff120604cc8ab10f = ((u32(((u32(1096) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0da70e436adfca544b268536() {
  return __cxx_static_address_0da70e436adfca544b268536.reference || (__cxx_static_address_0da70e436adfca544b268536.reference = {
    __cReference: true,
    get value() { return REACTORBURNT____header_global_ff120604cc8ab10f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:466
export const DOORTILE15____header_global_2325ef464c664b1f = ((u32(((u32(1102) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d568a0fc1005b08b866afc0b() {
  return __cxx_static_address_d568a0fc1005b08b866afc0b.reference || (__cxx_static_address_d568a0fc1005b08b866afc0b.reference = {
    __cReference: true,
    get value() { return DOORTILE15____header_global_2325ef464c664b1f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:467
export const HANDSWITCH____header_global_2c68da3d179facea = ((u32(((u32(1111) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b58a3355d699a563d80f6edc() {
  return __cxx_static_address_b58a3355d699a563d80f6edc.reference || (__cxx_static_address_b58a3355d699a563d80f6edc.reference = {
    __cReference: true,
    get value() { return HANDSWITCH____header_global_2c68da3d179facea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:468
export const CIRCLEPANNEL____header_global_c913f68b9519239d = ((u32(((u32(1113) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_87fefe7319afe73b29921600() {
  return __cxx_static_address_87fefe7319afe73b29921600.reference || (__cxx_static_address_87fefe7319afe73b29921600.reference = {
    __cReference: true,
    get value() { return CIRCLEPANNEL____header_global_c913f68b9519239d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:469
export const CIRCLEPANNELBROKE____header_global_7d9f0be4c4671c15 = ((u32(((u32(1114) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ce0de1064ce765fd58f581f4() {
  return __cxx_static_address_ce0de1064ce765fd58f581f4.reference || (__cxx_static_address_ce0de1064ce765fd58f581f4.reference = {
    __cReference: true,
    get value() { return CIRCLEPANNELBROKE____header_global_7d9f0be4c4671c15; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:470
export const PULLSWITCH____header_global_2bc5116552986641 = ((u32(((u32(1122) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_991e48bff23b5c14aecdbdc6() {
  return __cxx_static_address_991e48bff23b5c14aecdbdc6.reference || (__cxx_static_address_991e48bff23b5c14aecdbdc6.reference = {
    __cReference: true,
    get value() { return PULLSWITCH____header_global_2bc5116552986641; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:471
export const MASKWALL8____header_global_4c8e835576303461 = ((u32(((u32(1124) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eeec92b2002c8237da4b2d0f() {
  return __cxx_static_address_eeec92b2002c8237da4b2d0f.reference || (__cxx_static_address_eeec92b2002c8237da4b2d0f.reference = {
    __cReference: true,
    get value() { return MASKWALL8____header_global_4c8e835576303461; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:472
export const BIGHOLE____header_global_e4d38367d5896c9f = ((u32(((u32(1141) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b315417b6ad3ad8c303ab364() {
  return __cxx_static_address_b315417b6ad3ad8c303ab364.reference || (__cxx_static_address_b315417b6ad3ad8c303ab364.reference = {
    __cReference: true,
    get value() { return BIGHOLE____header_global_e4d38367d5896c9f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:473
export const ALIENSWITCH____header_global_5afa08470d395c2b = ((u32(((u32(1142) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ec002d28fe2d4efe0f84e137() {
  return __cxx_static_address_ec002d28fe2d4efe0f84e137.reference || (__cxx_static_address_ec002d28fe2d4efe0f84e137.reference = {
    __cReference: true,
    get value() { return ALIENSWITCH____header_global_5afa08470d395c2b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:474
export const DOORTILE21____header_global_0f0e825c572d971e = ((u32(((u32(1144) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_256122d57601305b7aa96a8a() {
  return __cxx_static_address_256122d57601305b7aa96a8a.reference || (__cxx_static_address_256122d57601305b7aa96a8a.reference = {
    __cReference: true,
    get value() { return DOORTILE21____header_global_0f0e825c572d971e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:475
export const HANDPRINTSWITCH____header_global_b08a31dcd5c668f7 = ((u32(((u32(1155) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d4b8e225675b4ecec4dcecfc() {
  return __cxx_static_address_d4b8e225675b4ecec4dcecfc.reference || (__cxx_static_address_d4b8e225675b4ecec4dcecfc.reference = {
    __cReference: true,
    get value() { return HANDPRINTSWITCH____header_global_b08a31dcd5c668f7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:476
export const BOTTLE10____header_global_5ed83fe7354b5972 = ((u32(((u32(1157) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f37a5dedc9c5dcd07e5c3072() {
  return __cxx_static_address_f37a5dedc9c5dcd07e5c3072.reference || (__cxx_static_address_f37a5dedc9c5dcd07e5c3072.reference = {
    __cReference: true,
    get value() { return BOTTLE10____header_global_5ed83fe7354b5972; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:477
export const BOTTLE11____header_global_1b8127befb6f7a22 = ((u32(((u32(1158) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_02c6971ffc7ae01c9ca198f6() {
  return __cxx_static_address_02c6971ffc7ae01c9ca198f6.reference || (__cxx_static_address_02c6971ffc7ae01c9ca198f6.reference = {
    __cReference: true,
    get value() { return BOTTLE11____header_global_1b8127befb6f7a22; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:478
export const BOTTLE12____header_global_96f8e6a46b5fbb66 = ((u32(((u32(1159) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_316070b946a73363c13af3b1() {
  return __cxx_static_address_316070b946a73363c13af3b1.reference || (__cxx_static_address_316070b946a73363c13af3b1.reference = {
    __cReference: true,
    get value() { return BOTTLE12____header_global_96f8e6a46b5fbb66; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:479
export const BOTTLE13____header_global_a618cc9dc04779be = ((u32(((u32(1160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bcd3f158adce756e21f62268() {
  return __cxx_static_address_bcd3f158adce756e21f62268.reference || (__cxx_static_address_bcd3f158adce756e21f62268.reference = {
    __cReference: true,
    get value() { return BOTTLE13____header_global_a618cc9dc04779be; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:480
export const BOTTLE14____header_global_b6f827f3112a9d3c = ((u32(((u32(1161) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5952d95cf05dde225869f061() {
  return __cxx_static_address_5952d95cf05dde225869f061.reference || (__cxx_static_address_5952d95cf05dde225869f061.reference = {
    __cReference: true,
    get value() { return BOTTLE14____header_global_b6f827f3112a9d3c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:481
export const BOTTLE15____header_global_b9c1a10977148f30 = ((u32(((u32(1162) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3b819ddd6915096c95956789() {
  return __cxx_static_address_3b819ddd6915096c95956789.reference || (__cxx_static_address_3b819ddd6915096c95956789.reference = {
    __cReference: true,
    get value() { return BOTTLE15____header_global_b9c1a10977148f30; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:482
export const BOTTLE16____header_global_c271c31d03cc2fd8 = ((u32(((u32(1163) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1c2d20bbc997b4ddbfce32bb() {
  return __cxx_static_address_1c2d20bbc997b4ddbfce32bb.reference || (__cxx_static_address_1c2d20bbc997b4ddbfce32bb.reference = {
    __cReference: true,
    get value() { return BOTTLE16____header_global_c271c31d03cc2fd8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:483
export const BOTTLE17____header_global_1ca5e04536d00da8 = ((u32(((u32(1164) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a0ffbdd7161cc0ca68209605() {
  return __cxx_static_address_a0ffbdd7161cc0ca68209605.reference || (__cxx_static_address_a0ffbdd7161cc0ca68209605.reference = {
    __cReference: true,
    get value() { return BOTTLE17____header_global_1ca5e04536d00da8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:484
export const BOTTLE18____header_global_476d3458c8c39e89 = ((u32(((u32(1165) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c3816dcf1cb7444b787c923d() {
  return __cxx_static_address_c3816dcf1cb7444b787c923d.reference || (__cxx_static_address_c3816dcf1cb7444b787c923d.reference = {
    __cReference: true,
    get value() { return BOTTLE18____header_global_476d3458c8c39e89; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:485
export const BOTTLE19____header_global_a4b5f597bd877e24 = ((u32(((u32(1166) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_605757bb61d635ead35dd7ca() {
  return __cxx_static_address_605757bb61d635ead35dd7ca.reference || (__cxx_static_address_605757bb61d635ead35dd7ca.reference = {
    __cReference: true,
    get value() { return BOTTLE19____header_global_a4b5f597bd877e24; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:486
export const DOORTILE17____header_global_10facb4829ac6cf9 = ((u32(((u32(1169) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f44a149a381f9cad88434b63() {
  return __cxx_static_address_f44a149a381f9cad88434b63.reference || (__cxx_static_address_f44a149a381f9cad88434b63.reference = {
    __cReference: true,
    get value() { return DOORTILE17____header_global_10facb4829ac6cf9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:487
export const MASKWALL7____header_global_c76efa09723b9f8a = ((u32(((u32(1174) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_77af674983033bc6c61b605e() {
  return __cxx_static_address_77af674983033bc6c61b605e.reference || (__cxx_static_address_77af674983033bc6c61b605e.reference = {
    __cReference: true,
    get value() { return MASKWALL7____header_global_c76efa09723b9f8a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:488
export const DOORTILE11____header_global_f09fe3d6d2f7c4a3 = ((u32(((u32(1178) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_904b20b8e92719f1d0041b32() {
  return __cxx_static_address_904b20b8e92719f1d0041b32.reference || (__cxx_static_address_904b20b8e92719f1d0041b32.reference = {
    __cReference: true,
    get value() { return DOORTILE11____header_global_f09fe3d6d2f7c4a3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:489
export const DOORTILE12____header_global_9a1176526a8214f5 = ((u32(((u32(1179) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_be25d92e7df6bab99452cc19() {
  return __cxx_static_address_be25d92e7df6bab99452cc19.reference || (__cxx_static_address_be25d92e7df6bab99452cc19.reference = {
    __cReference: true,
    get value() { return DOORTILE12____header_global_9a1176526a8214f5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:490
export const VENDMACHINE____header_global_a02963c7a416f01e = ((u32(((u32(1212) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6f0e73789d90f34a85ac9874() {
  return __cxx_static_address_6f0e73789d90f34a85ac9874.reference || (__cxx_static_address_6f0e73789d90f34a85ac9874.reference = {
    __cReference: true,
    get value() { return VENDMACHINE____header_global_a02963c7a416f01e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:491
export const COLAMACHINE____header_global_b2a9b724090e1114 = ((u32(((u32(1215) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7c7357f431744565da6e933a() {
  return __cxx_static_address_7c7357f431744565da6e933a.reference || (__cxx_static_address_7c7357f431744565da6e933a.reference = {
    __cReference: true,
    get value() { return COLAMACHINE____header_global_b2a9b724090e1114; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:492
export const CRANEPOLE____header_global_5263867a2334ada5 = ((u32(((u32(1221) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a870886cfeaf5742122610be() {
  return __cxx_static_address_a870886cfeaf5742122610be.reference || (__cxx_static_address_a870886cfeaf5742122610be.reference = {
    __cReference: true,
    get value() { return CRANEPOLE____header_global_5263867a2334ada5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:493
export const CRANE____header_global_e6cea27ba84a3b7f = ((u32(((u32(1222) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6cda09d2606be946e85ca9ba() {
  return __cxx_static_address_6cda09d2606be946e85ca9ba.reference || (__cxx_static_address_6cda09d2606be946e85ca9ba.reference = {
    __cReference: true,
    get value() { return CRANE____header_global_e6cea27ba84a3b7f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:494
export const BARBROKE____header_global_a3b68bd04a7c9bad = ((u32(((u32(1225) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_74f4f16bd0118907943df7b2() {
  return __cxx_static_address_74f4f16bd0118907943df7b2.reference || (__cxx_static_address_74f4f16bd0118907943df7b2.reference = {
    __cReference: true,
    get value() { return BARBROKE____header_global_a3b68bd04a7c9bad; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:495
export const BLOODPOOL____header_global_6e78efc9d0dc7378 = ((u32(((u32(1226) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cacb4ea5e45f1e0a2c2ea565() {
  return __cxx_static_address_cacb4ea5e45f1e0a2c2ea565.reference || (__cxx_static_address_cacb4ea5e45f1e0a2c2ea565.reference = {
    __cReference: true,
    get value() { return BLOODPOOL____header_global_6e78efc9d0dc7378; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:496
export const NUKEBARREL____header_global_ca30fcb89758582e = ((u32(((u32(1227) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_274472f37412d01779ca16a6() {
  return __cxx_static_address_274472f37412d01779ca16a6.reference || (__cxx_static_address_274472f37412d01779ca16a6.reference = {
    __cReference: true,
    get value() { return NUKEBARREL____header_global_ca30fcb89758582e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:497
export const NUKEBARRELDENTED____header_global_300bcb9d35d94e0b = ((u32(((u32(1228) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6ca0752077e4645bc3ff2326() {
  return __cxx_static_address_6ca0752077e4645bc3ff2326.reference || (__cxx_static_address_6ca0752077e4645bc3ff2326.reference = {
    __cReference: true,
    get value() { return NUKEBARRELDENTED____header_global_300bcb9d35d94e0b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:498
export const NUKEBARRELLEAKED____header_global_e7b8f42692dccae9 = ((u32(((u32(1229) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5562177634cee43f24b82715() {
  return __cxx_static_address_5562177634cee43f24b82715.reference || (__cxx_static_address_5562177634cee43f24b82715.reference = {
    __cReference: true,
    get value() { return NUKEBARRELLEAKED____header_global_e7b8f42692dccae9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:499
export const CANWITHSOMETHING____header_global_91160afc42ef5a1e = ((u32(((u32(1232) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7db1fac90afde7ab703be4d0() {
  return __cxx_static_address_7db1fac90afde7ab703be4d0.reference || (__cxx_static_address_7db1fac90afde7ab703be4d0.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING____header_global_91160afc42ef5a1e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:500
export const MONEY____header_global_d1069f536ecb79e7 = ((u32(((u32(1233) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e920385fa5542475ddf2fd19() {
  return __cxx_static_address_e920385fa5542475ddf2fd19.reference || (__cxx_static_address_e920385fa5542475ddf2fd19.reference = {
    __cReference: true,
    get value() { return MONEY____header_global_d1069f536ecb79e7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:501
export const BANNER____header_global_35fa6bba3bf4bb7f = ((u32(((u32(1236) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5f9470b4bedb2d976219e291() {
  return __cxx_static_address_5f9470b4bedb2d976219e291.reference || (__cxx_static_address_5f9470b4bedb2d976219e291.reference = {
    __cReference: true,
    get value() { return BANNER____header_global_35fa6bba3bf4bb7f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:502
export const EXPLODINGBARREL____header_global_00f1a149f0f66fdd = ((u32(((u32(1238) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5943fd6fdecbb8d51cb48c42() {
  return __cxx_static_address_5943fd6fdecbb8d51cb48c42.reference || (__cxx_static_address_5943fd6fdecbb8d51cb48c42.reference = {
    __cReference: true,
    get value() { return EXPLODINGBARREL____header_global_00f1a149f0f66fdd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:503
export const EXPLODINGBARREL2____header_global_1785ab781990357c = ((u32(((u32(1239) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1a51847e96b34f78100266d0() {
  return __cxx_static_address_1a51847e96b34f78100266d0.reference || (__cxx_static_address_1a51847e96b34f78100266d0.reference = {
    __cReference: true,
    get value() { return EXPLODINGBARREL2____header_global_1785ab781990357c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:504
export const FIREBARREL____header_global_db6eaa30dd24cbc1 = ((u32(((u32(1240) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ff0db28b205208c5d41b9119() {
  return __cxx_static_address_ff0db28b205208c5d41b9119.reference || (__cxx_static_address_ff0db28b205208c5d41b9119.reference = {
    __cReference: true,
    get value() { return FIREBARREL____header_global_db6eaa30dd24cbc1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:505
export const SEENINE____header_global_8ae18d8514378fad = ((u32(((u32(1247) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8ff14849a2dcdd6134e6405a() {
  return __cxx_static_address_8ff14849a2dcdd6134e6405a.reference || (__cxx_static_address_8ff14849a2dcdd6134e6405a.reference = {
    __cReference: true,
    get value() { return SEENINE____header_global_8ae18d8514378fad; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:506
export const SEENINEDEAD____header_global_8a0c27073110925c = ((u32(((u32(1248) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e2def870ac5fe90cbc81c27b() {
  return __cxx_static_address_e2def870ac5fe90cbc81c27b.reference || (__cxx_static_address_e2def870ac5fe90cbc81c27b.reference = {
    __cReference: true,
    get value() { return SEENINEDEAD____header_global_8a0c27073110925c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:507
export const STEAM____header_global_a8a66c3fc29be256 = ((u32(((u32(1250) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_12b1361f9bcdf2ba0f9f7cf3() {
  return __cxx_static_address_12b1361f9bcdf2ba0f9f7cf3.reference || (__cxx_static_address_12b1361f9bcdf2ba0f9f7cf3.reference = {
    __cReference: true,
    get value() { return STEAM____header_global_a8a66c3fc29be256; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:508
export const CEILINGSTEAM____header_global_330e36bf98a3c06b = ((u32(((u32(1255) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_db94762f86f6573248be5e5a() {
  return __cxx_static_address_db94762f86f6573248be5e5a.reference || (__cxx_static_address_db94762f86f6573248be5e5a.reference = {
    __cReference: true,
    get value() { return CEILINGSTEAM____header_global_330e36bf98a3c06b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:509
export const PIPE6B____header_global_d4d718d4ce551bb7 = ((u32(((u32(1260) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4aa24f042480a6537336cc56() {
  return __cxx_static_address_4aa24f042480a6537336cc56.reference || (__cxx_static_address_4aa24f042480a6537336cc56.reference = {
    __cReference: true,
    get value() { return PIPE6B____header_global_d4d718d4ce551bb7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:510
export const TRANSPORTERBEAM____header_global_bd52c838494969a2 = ((u32(((u32(1261) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_26d04a5042b30231eff3a9dd() {
  return __cxx_static_address_26d04a5042b30231eff3a9dd.reference || (__cxx_static_address_26d04a5042b30231eff3a9dd.reference = {
    __cReference: true,
    get value() { return TRANSPORTERBEAM____header_global_bd52c838494969a2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:511
export const RAT____header_global_a30d27940b044f4c = ((u32(((u32(1267) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5a8149ee0575d203b1bb2904() {
  return __cxx_static_address_5a8149ee0575d203b1bb2904.reference || (__cxx_static_address_5a8149ee0575d203b1bb2904.reference = {
    __cReference: true,
    get value() { return RAT____header_global_a30d27940b044f4c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:512
export const TRASH____header_global_482b06b64fdf521a = ((u32(((u32(1272) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_741506d4fbbbfbe7d185d637() {
  return __cxx_static_address_741506d4fbbbfbe7d185d637.reference || (__cxx_static_address_741506d4fbbbfbe7d185d637.reference = {
    __cReference: true,
    get value() { return TRASH____header_global_482b06b64fdf521a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:513
export const FEMPIC1____header_global_2049e6d4c6122a52 = ((u32(((u32(1280) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ae0e910ce326865bf4c88d6b() {
  return __cxx_static_address_ae0e910ce326865bf4c88d6b.reference || (__cxx_static_address_ae0e910ce326865bf4c88d6b.reference = {
    __cReference: true,
    get value() { return FEMPIC1____header_global_2049e6d4c6122a52; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:514
export const FEMPIC2____header_global_23e5a1210bec6d74 = ((u32(((u32(1289) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f4d04bd554eeeb72c0c588c5() {
  return __cxx_static_address_f4d04bd554eeeb72c0c588c5.reference || (__cxx_static_address_f4d04bd554eeeb72c0c588c5.reference = {
    __cReference: true,
    get value() { return FEMPIC2____header_global_23e5a1210bec6d74; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:515
export const BLANKSCREEN____header_global_7f03a905f034adcf = ((u32(((u32(1293) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_163c2ad7f15d080d80632877() {
  return __cxx_static_address_163c2ad7f15d080d80632877.reference || (__cxx_static_address_163c2ad7f15d080d80632877.reference = {
    __cReference: true,
    get value() { return BLANKSCREEN____header_global_7f03a905f034adcf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:516
export const PODFEM1____header_global_113f35c528fff8cd = ((u32(((u32(1294) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7c7a7422a58da483ab0a8df2() {
  return __cxx_static_address_7c7a7422a58da483ab0a8df2.reference || (__cxx_static_address_7c7a7422a58da483ab0a8df2.reference = {
    __cReference: true,
    get value() { return PODFEM1____header_global_113f35c528fff8cd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:517
export const FEMPIC3____header_global_1070b077ff68c74e = ((u32(((u32(1298) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_12e68d2855e9a1f67d4acd8a() {
  return __cxx_static_address_12e68d2855e9a1f67d4acd8a.reference || (__cxx_static_address_12e68d2855e9a1f67d4acd8a.reference = {
    __cReference: true,
    get value() { return FEMPIC3____header_global_1070b077ff68c74e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:518
export const FEMPIC4____header_global_3f7ad5805bd569bc = ((u32(((u32(1306) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ed4d00160e5782d7a9974d11() {
  return __cxx_static_address_ed4d00160e5782d7a9974d11.reference || (__cxx_static_address_ed4d00160e5782d7a9974d11.reference = {
    __cReference: true,
    get value() { return FEMPIC4____header_global_3f7ad5805bd569bc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:519
export const FEM1____header_global_184da8a004999187 = ((u32(((u32(1312) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ee829be4dca33cdbda44c1cf() {
  return __cxx_static_address_ee829be4dca33cdbda44c1cf.reference || (__cxx_static_address_ee829be4dca33cdbda44c1cf.reference = {
    __cReference: true,
    get value() { return FEM1____header_global_184da8a004999187; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:520
export const FEM2____header_global_e2d8bf921e624dcd = ((u32(((u32(1317) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e6fd7195cd975fe5e10a15aa() {
  return __cxx_static_address_e6fd7195cd975fe5e10a15aa.reference || (__cxx_static_address_e6fd7195cd975fe5e10a15aa.reference = {
    __cReference: true,
    get value() { return FEM2____header_global_e2d8bf921e624dcd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:521
export const FEM3____header_global_55a4a7ab662a6349 = ((u32(((u32(1321) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_47544163e64f5499da9d4d03() {
  return __cxx_static_address_47544163e64f5499da9d4d03.reference || (__cxx_static_address_47544163e64f5499da9d4d03.reference = {
    __cReference: true,
    get value() { return FEM3____header_global_55a4a7ab662a6349; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:522
export const FEM5____header_global_18d3eae5a70fa711 = ((u32(((u32(1323) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b69dd663b4e65876bb3067db() {
  return __cxx_static_address_b69dd663b4e65876bb3067db.reference || (__cxx_static_address_b69dd663b4e65876bb3067db.reference = {
    __cReference: true,
    get value() { return FEM5____header_global_18d3eae5a70fa711; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:523
export const BLOODYPOLE____header_global_d9792fd7549d7bc5 = ((u32(((u32(1324) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_af8b430a750c6e03be2b9926() {
  return __cxx_static_address_af8b430a750c6e03be2b9926.reference || (__cxx_static_address_af8b430a750c6e03be2b9926.reference = {
    __cReference: true,
    get value() { return BLOODYPOLE____header_global_d9792fd7549d7bc5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:524
export const FEM4____header_global_4e029262f9842582 = ((u32(((u32(1325) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0a0e7c47e4779b6d57d96336() {
  return __cxx_static_address_0a0e7c47e4779b6d57d96336.reference || (__cxx_static_address_0a0e7c47e4779b6d57d96336.reference = {
    __cReference: true,
    get value() { return FEM4____header_global_4e029262f9842582; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:525
export const FEM6____header_global_f652532be3a11ffd = ((u32(((u32(1334) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fcec35f442d972887becea2f() {
  return __cxx_static_address_fcec35f442d972887becea2f.reference || (__cxx_static_address_fcec35f442d972887becea2f.reference = {
    __cReference: true,
    get value() { return FEM6____header_global_f652532be3a11ffd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:526
export const FEM6PAD____header_global_e20d4e94f1f2e7b0 = ((u32(((u32(1335) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_12a5c813d10d2a076f1306fe() {
  return __cxx_static_address_12a5c813d10d2a076f1306fe.reference || (__cxx_static_address_12a5c813d10d2a076f1306fe.reference = {
    __cReference: true,
    get value() { return FEM6PAD____header_global_e20d4e94f1f2e7b0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:527
export const FEM8____header_global_e20c3f1508e5a054 = ((u32(((u32(1336) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7f547f7d2a4603202503225c() {
  return __cxx_static_address_7f547f7d2a4603202503225c.reference || (__cxx_static_address_7f547f7d2a4603202503225c.reference = {
    __cReference: true,
    get value() { return FEM8____header_global_e20c3f1508e5a054; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:528
export const HELECOPT____header_global_6d275c9bfb398bea = ((u32(((u32(1346) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e42b7f6a62f1dcfc3f65e754() {
  return __cxx_static_address_e42b7f6a62f1dcfc3f65e754.reference || (__cxx_static_address_e42b7f6a62f1dcfc3f65e754.reference = {
    __cReference: true,
    get value() { return HELECOPT____header_global_6d275c9bfb398bea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:529
export const FETUSJIB____header_global_bc576f985c6a6478 = ((u32(((u32(1347) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_67f64b5ced591fc39d833695() {
  return __cxx_static_address_67f64b5ced591fc39d833695.reference || (__cxx_static_address_67f64b5ced591fc39d833695.reference = {
    __cReference: true,
    get value() { return FETUSJIB____header_global_bc576f985c6a6478; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:530
export const HOLODUKE____header_global_be63ca8d9905dc02 = ((u32(((u32(1348) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d6a2c1f2f589c21f2310af68() {
  return __cxx_static_address_d6a2c1f2f589c21f2310af68.reference || (__cxx_static_address_d6a2c1f2f589c21f2310af68.reference = {
    __cReference: true,
    get value() { return HOLODUKE____header_global_be63ca8d9905dc02; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:531
export const SPACEMARINE____header_global_8e7bf3010de6c8ba = ((u32(((u32(1353) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3fe28b94dcac724cca05f58e() {
  return __cxx_static_address_3fe28b94dcac724cca05f58e.reference || (__cxx_static_address_3fe28b94dcac724cca05f58e.reference = {
    __cReference: true,
    get value() { return SPACEMARINE____header_global_8e7bf3010de6c8ba; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:532
export const INDY____header_global_0d9e472c8e357d85 = ((u32(((u32(1355) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8377d2deb4d4eb367b9ad3ee() {
  return __cxx_static_address_8377d2deb4d4eb367b9ad3ee.reference || (__cxx_static_address_8377d2deb4d4eb367b9ad3ee.reference = {
    __cReference: true,
    get value() { return INDY____header_global_0d9e472c8e357d85; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:533
export const FETUS____header_global_d052eef134b11e92 = ((u32(((u32(1358) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_90c8161e7c7f2d6124427216() {
  return __cxx_static_address_90c8161e7c7f2d6124427216.reference || (__cxx_static_address_90c8161e7c7f2d6124427216.reference = {
    __cReference: true,
    get value() { return FETUS____header_global_d052eef134b11e92; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:534
export const FETUSBROKE____header_global_c5faf4b577474f85 = ((u32(((u32(1359) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_323ea8c3ef2b9286eb856f7c() {
  return __cxx_static_address_323ea8c3ef2b9286eb856f7c.reference || (__cxx_static_address_323ea8c3ef2b9286eb856f7c.reference = {
    __cReference: true,
    get value() { return FETUSBROKE____header_global_c5faf4b577474f85; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:535
export const MONK____header_global_1e73c3f438fd6aa6 = ((u32(((u32(1352) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6b3a89ca5cc17b882f747b10() {
  return __cxx_static_address_6b3a89ca5cc17b882f747b10.reference || (__cxx_static_address_6b3a89ca5cc17b882f747b10.reference = {
    __cReference: true,
    get value() { return MONK____header_global_1e73c3f438fd6aa6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:536
export const LUKE____header_global_ec7efd61282cb3ab = ((u32(((u32(1354) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2267dffd5d8ffdf116f8ae4a() {
  return __cxx_static_address_2267dffd5d8ffdf116f8ae4a.reference || (__cxx_static_address_2267dffd5d8ffdf116f8ae4a.reference = {
    __cReference: true,
    get value() { return LUKE____header_global_ec7efd61282cb3ab; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:537
export const COOLEXPLOSION1____header_global_555a792bd6aaf333 = ((u32(((u32(1360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0b2cb145b3e4d85cb3769da1() {
  return __cxx_static_address_0b2cb145b3e4d85cb3769da1.reference || (__cxx_static_address_0b2cb145b3e4d85cb3769da1.reference = {
    __cReference: true,
    get value() { return COOLEXPLOSION1____header_global_555a792bd6aaf333; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:538
export const WATERSPLASH2____header_global_8b6e3e508ef70f7c = ((u32(((u32(1380) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c61fc130d7e6ca662b55cac3() {
  return __cxx_static_address_c61fc130d7e6ca662b55cac3.reference || (__cxx_static_address_c61fc130d7e6ca662b55cac3.reference = {
    __cReference: true,
    get value() { return WATERSPLASH2____header_global_8b6e3e508ef70f7c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:539
export const FIREVASE____header_global_03e1c1a146d0a61d = ((u32(((u32(1390) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6e943919e9c69df9a143e34b() {
  return __cxx_static_address_6e943919e9c69df9a143e34b.reference || (__cxx_static_address_6e943919e9c69df9a143e34b.reference = {
    __cReference: true,
    get value() { return FIREVASE____header_global_03e1c1a146d0a61d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:540
export const FEM7____header_global_ce18b61bd45df7b6 = ((u32(((u32(1395) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6335fb965027908752e36f9b() {
  return __cxx_static_address_6335fb965027908752e36f9b.reference || (__cxx_static_address_6335fb965027908752e36f9b.reference = {
    __cReference: true,
    get value() { return FEM7____header_global_ce18b61bd45df7b6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:541
export const APLAYERTOP____header_global_e52dcd88cce4d3e4 = ((u32(((u32(1400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3cd3893089905259b6b96c62() {
  return __cxx_static_address_3cd3893089905259b6b96c62.reference || (__cxx_static_address_3cd3893089905259b6b96c62.reference = {
    __cReference: true,
    get value() { return APLAYERTOP____header_global_e52dcd88cce4d3e4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:542
export const APLAYER____header_global_6f8489f4c8f2d5f5 = ((u32(((u32(1405) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a093317cdf874738794003ff() {
  return __cxx_static_address_a093317cdf874738794003ff.reference || (__cxx_static_address_a093317cdf874738794003ff.reference = {
    __cReference: true,
    get value() { return APLAYER____header_global_6f8489f4c8f2d5f5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:543
export const PLAYERONWATER____header_global_a2b1cf0b4eed90f3 = ((u32(((u32(1420) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_12ddbaa33140fdf1768e1ede() {
  return __cxx_static_address_12ddbaa33140fdf1768e1ede.reference || (__cxx_static_address_12ddbaa33140fdf1768e1ede.reference = {
    __cReference: true,
    get value() { return PLAYERONWATER____header_global_a2b1cf0b4eed90f3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:544
export const DUKELYINGDEAD____header_global_b41929d651c37cf6 = ((u32(((u32(1518) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_87bafcbd6fb01496d590b9b4() {
  return __cxx_static_address_87bafcbd6fb01496d590b9b4.reference || (__cxx_static_address_87bafcbd6fb01496d590b9b4.reference = {
    __cReference: true,
    get value() { return DUKELYINGDEAD____header_global_b41929d651c37cf6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:545
export const DUKETORSO____header_global_adb2fd9045d37396 = ((u32(((u32(1520) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ec5c00d5015072717aac03e7() {
  return __cxx_static_address_ec5c00d5015072717aac03e7.reference || (__cxx_static_address_ec5c00d5015072717aac03e7.reference = {
    __cReference: true,
    get value() { return DUKETORSO____header_global_adb2fd9045d37396; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:546
export const DUKEGUN____header_global_3ccc91d1bb426afd = ((u32(((u32(1528) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_401136b131467d0ea3f2e790() {
  return __cxx_static_address_401136b131467d0ea3f2e790.reference || (__cxx_static_address_401136b131467d0ea3f2e790.reference = {
    __cReference: true,
    get value() { return DUKEGUN____header_global_3ccc91d1bb426afd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:547
export const DUKELEG____header_global_77cc5ba748f5355d = ((u32(((u32(1536) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0939840affbfe57c2b628fa7() {
  return __cxx_static_address_0939840affbfe57c2b628fa7.reference || (__cxx_static_address_0939840affbfe57c2b628fa7.reference = {
    __cReference: true,
    get value() { return DUKELEG____header_global_77cc5ba748f5355d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:548
export const SHARK____header_global_4675bad627af16ec = ((u32(((u32(1550) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b32fb66835a61093f277b1b4() {
  return __cxx_static_address_b32fb66835a61093f277b1b4.reference || (__cxx_static_address_b32fb66835a61093f277b1b4.reference = {
    __cReference: true,
    get value() { return SHARK____header_global_4675bad627af16ec; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:549
export const BLOOD____header_global_bc5a681955bde1a5 = ((u32(((u32(1620) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_51902a2b6761ca67173b8255() {
  return __cxx_static_address_51902a2b6761ca67173b8255.reference || (__cxx_static_address_51902a2b6761ca67173b8255.reference = {
    __cReference: true,
    get value() { return BLOOD____header_global_bc5a681955bde1a5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:550
export const FIRELASER____header_global_48aabd37065fd153 = ((u32(((u32(1625) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fcc4f66f9d53d9b83b283789() {
  return __cxx_static_address_fcc4f66f9d53d9b83b283789.reference || (__cxx_static_address_fcc4f66f9d53d9b83b283789.reference = {
    __cReference: true,
    get value() { return FIRELASER____header_global_48aabd37065fd153; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:551
export const TRANSPORTERSTAR____header_global_6375dc7708f09dde = ((u32(((u32(1630) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e7f04202bf57f1edb113f239() {
  return __cxx_static_address_e7f04202bf57f1edb113f239.reference || (__cxx_static_address_e7f04202bf57f1edb113f239.reference = {
    __cReference: true,
    get value() { return TRANSPORTERSTAR____header_global_6375dc7708f09dde; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:552
export const SPIT____header_global_5b78163b254b51ea = ((u32(((u32(1636) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_255840aacbea0be8be3ead37() {
  return __cxx_static_address_255840aacbea0be8be3ead37.reference || (__cxx_static_address_255840aacbea0be8be3ead37.reference = {
    __cReference: true,
    get value() { return SPIT____header_global_5b78163b254b51ea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:553
export const LOOGIE____header_global_13153873ed80661f = ((u32(((u32(1637) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_38d53e8ab9975fa6f7dbe957() {
  return __cxx_static_address_38d53e8ab9975fa6f7dbe957.reference || (__cxx_static_address_38d53e8ab9975fa6f7dbe957.reference = {
    __cReference: true,
    get value() { return LOOGIE____header_global_13153873ed80661f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:554
export const FIST____header_global_693ca81be12df6a5 = ((u32(((u32(1640) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_367c601955f33c6018d2c43d() {
  return __cxx_static_address_367c601955f33c6018d2c43d.reference || (__cxx_static_address_367c601955f33c6018d2c43d.reference = {
    __cReference: true,
    get value() { return FIST____header_global_693ca81be12df6a5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:555
export const FREEZEBLAST____header_global_f4a07bc891c2cab8 = ((u32(((u32(1641) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fcd04cc91cffabf24a0d3a84() {
  return __cxx_static_address_fcd04cc91cffabf24a0d3a84.reference || (__cxx_static_address_fcd04cc91cffabf24a0d3a84.reference = {
    __cReference: true,
    get value() { return FREEZEBLAST____header_global_f4a07bc891c2cab8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:556
export const SHRINKSPARK____header_global_7b93c0a3b030f321 = ((u32(((u32(1646) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_36d8d72150b03b467199ab2c() {
  return __cxx_static_address_36d8d72150b03b467199ab2c.reference || (__cxx_static_address_36d8d72150b03b467199ab2c.reference = {
    __cReference: true,
    get value() { return SHRINKSPARK____header_global_7b93c0a3b030f321; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:557
export const TONGUE____header_global_922013221f6d8a06 = ((u32(((u32(1647) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_724efbdddb57392c583170e8() {
  return __cxx_static_address_724efbdddb57392c583170e8.reference || (__cxx_static_address_724efbdddb57392c583170e8.reference = {
    __cReference: true,
    get value() { return TONGUE____header_global_922013221f6d8a06; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:558
export const MORTER____header_global_049b3c192d5c332d = ((u32(((u32(1650) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4bd0b50448836a39cd18147c() {
  return __cxx_static_address_4bd0b50448836a39cd18147c.reference || (__cxx_static_address_4bd0b50448836a39cd18147c.reference = {
    __cReference: true,
    get value() { return MORTER____header_global_049b3c192d5c332d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:559
export const SHRINKEREXPLOSION____header_global_bcc9676772d99b1c = ((u32(((u32(1656) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_afee7695c184809814624448() {
  return __cxx_static_address_afee7695c184809814624448.reference || (__cxx_static_address_afee7695c184809814624448.reference = {
    __cReference: true,
    get value() { return SHRINKEREXPLOSION____header_global_bcc9676772d99b1c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:560
export const RADIUSEXPLOSION____header_global_89a3cc46fc456076 = ((u32(((u32(1670) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_39f61c142b1c56c36b2beff4() {
  return __cxx_static_address_39f61c142b1c56c36b2beff4.reference || (__cxx_static_address_39f61c142b1c56c36b2beff4.reference = {
    __cReference: true,
    get value() { return RADIUSEXPLOSION____header_global_89a3cc46fc456076; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:561
export const FORCERIPPLE____header_global_d3f6568ac9e908a6 = ((u32(((u32(1671) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6a3f03c0f789b39d019ec0c6() {
  return __cxx_static_address_6a3f03c0f789b39d019ec0c6.reference || (__cxx_static_address_6a3f03c0f789b39d019ec0c6.reference = {
    __cReference: true,
    get value() { return FORCERIPPLE____header_global_d3f6568ac9e908a6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:562
export const LIZTROOP____header_global_7f3048ced96ea0ee = ((u32(((u32(1680) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_37d8b6e3d56c95982c051d37() {
  return __cxx_static_address_37d8b6e3d56c95982c051d37.reference || (__cxx_static_address_37d8b6e3d56c95982c051d37.reference = {
    __cReference: true,
    get value() { return LIZTROOP____header_global_7f3048ced96ea0ee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:563
export const LIZTROOPRUNNING____header_global_03127c36d2b41cb3 = ((u32(((u32(1681) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b54e3ae2645a26635e064e8a() {
  return __cxx_static_address_b54e3ae2645a26635e064e8a.reference || (__cxx_static_address_b54e3ae2645a26635e064e8a.reference = {
    __cReference: true,
    get value() { return LIZTROOPRUNNING____header_global_03127c36d2b41cb3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:564
export const LIZTROOPSTAYPUT____header_global_25b7a2a56068cc3a = ((u32(((u32(1682) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2f3c6df1dbd8397efc97c5c6() {
  return __cxx_static_address_2f3c6df1dbd8397efc97c5c6.reference || (__cxx_static_address_2f3c6df1dbd8397efc97c5c6.reference = {
    __cReference: true,
    get value() { return LIZTROOPSTAYPUT____header_global_25b7a2a56068cc3a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:565
export const LIZTROOPSHOOT____header_global_805d7229c78b383b = ((u32(((u32(1715) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_622e3f887cf968effab1a52c() {
  return __cxx_static_address_622e3f887cf968effab1a52c.reference || (__cxx_static_address_622e3f887cf968effab1a52c.reference = {
    __cReference: true,
    get value() { return LIZTROOPSHOOT____header_global_805d7229c78b383b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:566
export const LIZTROOPJETPACK____header_global_669ba36795174c21 = ((u32(((u32(1725) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_803c10dbb2166b16babae6d9() {
  return __cxx_static_address_803c10dbb2166b16babae6d9.reference || (__cxx_static_address_803c10dbb2166b16babae6d9.reference = {
    __cReference: true,
    get value() { return LIZTROOPJETPACK____header_global_669ba36795174c21; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:567
export const LIZTROOPONTOILET____header_global_bfc2baf08d2a936a = ((u32(((u32(1741) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1c84d00e8349b54d57307523() {
  return __cxx_static_address_1c84d00e8349b54d57307523.reference || (__cxx_static_address_1c84d00e8349b54d57307523.reference = {
    __cReference: true,
    get value() { return LIZTROOPONTOILET____header_global_bfc2baf08d2a936a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:568
export const LIZTROOPJUSTSIT____header_global_bf160dde23bae736 = ((u32(((u32(1742) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4def57c1ce8397e0e5ed5f25() {
  return __cxx_static_address_4def57c1ce8397e0e5ed5f25.reference || (__cxx_static_address_4def57c1ce8397e0e5ed5f25.reference = {
    __cReference: true,
    get value() { return LIZTROOPJUSTSIT____header_global_bf160dde23bae736; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:569
export const LIZTROOPDUCKING____header_global_6bad5dd26131dc91 = ((u32(((u32(1744) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fa7aa0aa051bf201790a0756() {
  return __cxx_static_address_fa7aa0aa051bf201790a0756.reference || (__cxx_static_address_fa7aa0aa051bf201790a0756.reference = {
    __cReference: true,
    get value() { return LIZTROOPDUCKING____header_global_6bad5dd26131dc91; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:570
export const HEADJIB1____header_global_6f7d62a76ee93776 = ((u32(((u32(1768) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f9a55ae0da5297964bb1140c() {
  return __cxx_static_address_f9a55ae0da5297964bb1140c.reference || (__cxx_static_address_f9a55ae0da5297964bb1140c.reference = {
    __cReference: true,
    get value() { return HEADJIB1____header_global_6f7d62a76ee93776; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:571
export const ARMJIB1____header_global_0101f6782faad0e5 = ((u32(((u32(1772) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b3ae80b7dda92a97c23cc3e0() {
  return __cxx_static_address_b3ae80b7dda92a97c23cc3e0.reference || (__cxx_static_address_b3ae80b7dda92a97c23cc3e0.reference = {
    __cReference: true,
    get value() { return ARMJIB1____header_global_0101f6782faad0e5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:572
export const LEGJIB1____header_global_047c5c5564369b0e = ((u32(((u32(1776) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_26dac62539420ecbb7b6a49f() {
  return __cxx_static_address_26dac62539420ecbb7b6a49f.reference || (__cxx_static_address_26dac62539420ecbb7b6a49f.reference = {
    __cReference: true,
    get value() { return LEGJIB1____header_global_047c5c5564369b0e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:573
export const OCTABRAIN____header_global_0f8711506f31b0d8 = ((u32(((u32(1820) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e34f90f9950859df771160bf() {
  return __cxx_static_address_e34f90f9950859df771160bf.reference || (__cxx_static_address_e34f90f9950859df771160bf.reference = {
    __cReference: true,
    get value() { return OCTABRAIN____header_global_0f8711506f31b0d8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:574
export const OCTABRAINSTAYPUT____header_global_60a1887fe7d4c8c5 = ((u32(((u32(1821) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_841c164ea21a7cc725b207fd() {
  return __cxx_static_address_841c164ea21a7cc725b207fd.reference || (__cxx_static_address_841c164ea21a7cc725b207fd.reference = {
    __cReference: true,
    get value() { return OCTABRAINSTAYPUT____header_global_60a1887fe7d4c8c5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:575
export const INNERJAW____header_global_5eb2ccb2ecc7b51d = ((u32(((u32(1860) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9669324f74e7376abe24ec72() {
  return __cxx_static_address_9669324f74e7376abe24ec72.reference || (__cxx_static_address_9669324f74e7376abe24ec72.reference = {
    __cReference: true,
    get value() { return INNERJAW____header_global_5eb2ccb2ecc7b51d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:576
export const DRONE____header_global_9023fa2ddb06674f = ((u32(((u32(1880) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_304ec21d6d36513370703085() {
  return __cxx_static_address_304ec21d6d36513370703085.reference || (__cxx_static_address_304ec21d6d36513370703085.reference = {
    __cReference: true,
    get value() { return DRONE____header_global_9023fa2ddb06674f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:577
export const EXPLOSION2____header_global_75e4be6a6c27a8c1 = ((u32(((u32(1890) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a0a12a26acc731146cc22fc4() {
  return __cxx_static_address_a0a12a26acc731146cc22fc4.reference || (__cxx_static_address_a0a12a26acc731146cc22fc4.reference = {
    __cReference: true,
    get value() { return EXPLOSION2____header_global_75e4be6a6c27a8c1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:578
export const COMMANDER____header_global_8474dca28d5f1876 = ((u32(((u32(1920) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_899cac5d6113da70084daacb() {
  return __cxx_static_address_899cac5d6113da70084daacb.reference || (__cxx_static_address_899cac5d6113da70084daacb.reference = {
    __cReference: true,
    get value() { return COMMANDER____header_global_8474dca28d5f1876; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:579
export const COMMANDERSTAYPUT____header_global_921869e384c3d6f2 = ((u32(((u32(1921) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ef4cf523d17b21b82b9e7e1d() {
  return __cxx_static_address_ef4cf523d17b21b82b9e7e1d.reference || (__cxx_static_address_ef4cf523d17b21b82b9e7e1d.reference = {
    __cReference: true,
    get value() { return COMMANDERSTAYPUT____header_global_921869e384c3d6f2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:580
export const RECON____header_global_4af50ea6d1a3e01d = ((u32(((u32(1960) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7d199ef43e4640a82c552411() {
  return __cxx_static_address_7d199ef43e4640a82c552411.reference || (__cxx_static_address_7d199ef43e4640a82c552411.reference = {
    __cReference: true,
    get value() { return RECON____header_global_4af50ea6d1a3e01d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:581
export const TANK____header_global_b7695716e052fa28 = ((u32(((u32(1975) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c3a7bca420f50486670ed7c9() {
  return __cxx_static_address_c3a7bca420f50486670ed7c9.reference || (__cxx_static_address_c3a7bca420f50486670ed7c9.reference = {
    __cReference: true,
    get value() { return TANK____header_global_b7695716e052fa28; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:582
export const PIGCOP____header_global_d04a2b63305c1ebf = ((u32(((u32(2000) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a814330acc2893a2e0adbdef() {
  return __cxx_static_address_a814330acc2893a2e0adbdef.reference || (__cxx_static_address_a814330acc2893a2e0adbdef.reference = {
    __cReference: true,
    get value() { return PIGCOP____header_global_d04a2b63305c1ebf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:583
export const PIGCOPSTAYPUT____header_global_07a75cc86064b9ac = ((u32(((u32(2001) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_241c3ff5217058a2f9f28169() {
  return __cxx_static_address_241c3ff5217058a2f9f28169.reference || (__cxx_static_address_241c3ff5217058a2f9f28169.reference = {
    __cReference: true,
    get value() { return PIGCOPSTAYPUT____header_global_07a75cc86064b9ac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:584
export const PIGCOPDIVE____header_global_9bd9e6c0a4d09420 = ((u32(((u32(2045) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8432a8133441cb0d9242372b() {
  return __cxx_static_address_8432a8133441cb0d9242372b.reference || (__cxx_static_address_8432a8133441cb0d9242372b.reference = {
    __cReference: true,
    get value() { return PIGCOPDIVE____header_global_9bd9e6c0a4d09420; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:585
export const LIZMAN____header_global_fafa79ff8fc0d5a3 = ((u32(((u32(2120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bb37a929fae4a67ab805bfd4() {
  return __cxx_static_address_bb37a929fae4a67ab805bfd4.reference || (__cxx_static_address_bb37a929fae4a67ab805bfd4.reference = {
    __cReference: true,
    get value() { return LIZMAN____header_global_fafa79ff8fc0d5a3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:586
export const LIZMANSTAYPUT____header_global_c7c7462e926215c8 = ((u32(((u32(2121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4b3e2856212f919e5ddbc65b() {
  return __cxx_static_address_4b3e2856212f919e5ddbc65b.reference || (__cxx_static_address_4b3e2856212f919e5ddbc65b.reference = {
    __cReference: true,
    get value() { return LIZMANSTAYPUT____header_global_c7c7462e926215c8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:587
export const LIZMANSPITTING____header_global_d12b1904ba487196 = ((u32(((u32(2150) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8922f4506f7117d49018999b() {
  return __cxx_static_address_8922f4506f7117d49018999b.reference || (__cxx_static_address_8922f4506f7117d49018999b.reference = {
    __cReference: true,
    get value() { return LIZMANSPITTING____header_global_d12b1904ba487196; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:588
export const LIZMANFEEDING____header_global_2452e917133812af = ((u32(((u32(2160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bcac99a0e43f3bcca430a515() {
  return __cxx_static_address_bcac99a0e43f3bcca430a515.reference || (__cxx_static_address_bcac99a0e43f3bcca430a515.reference = {
    __cReference: true,
    get value() { return LIZMANFEEDING____header_global_2452e917133812af; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:589
export const LIZMANJUMP____header_global_7b0df646508034b6 = ((u32(((u32(2165) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_497a165b0466fb71da20898a() {
  return __cxx_static_address_497a165b0466fb71da20898a.reference || (__cxx_static_address_497a165b0466fb71da20898a.reference = {
    __cReference: true,
    get value() { return LIZMANJUMP____header_global_7b0df646508034b6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:590
export const FECES____header_global_9aec54a916fdc889 = ((u32(((u32(2200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0ff7b1cf1fa4a691d6d0c1bd() {
  return __cxx_static_address_0ff7b1cf1fa4a691d6d0c1bd.reference || (__cxx_static_address_0ff7b1cf1fa4a691d6d0c1bd.reference = {
    __cReference: true,
    get value() { return FECES____header_global_9aec54a916fdc889; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:591
export const LIZMANHEAD1____header_global_6fed52fe45eb3191 = ((u32(((u32(2201) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4410f2a233d6bd091e4f3d4f() {
  return __cxx_static_address_4410f2a233d6bd091e4f3d4f.reference || (__cxx_static_address_4410f2a233d6bd091e4f3d4f.reference = {
    __cReference: true,
    get value() { return LIZMANHEAD1____header_global_6fed52fe45eb3191; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:592
export const LIZMANARM1____header_global_7b51e41d79359d2e = ((u32(((u32(2205) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8e047a9e3c904000efe71577() {
  return __cxx_static_address_8e047a9e3c904000efe71577.reference || (__cxx_static_address_8e047a9e3c904000efe71577.reference = {
    __cReference: true,
    get value() { return LIZMANARM1____header_global_7b51e41d79359d2e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:593
export const LIZMANLEG1____header_global_b266f6ad9ffa0527 = ((u32(((u32(2209) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a826474617a13b7d5c1ecebe() {
  return __cxx_static_address_a826474617a13b7d5c1ecebe.reference || (__cxx_static_address_a826474617a13b7d5c1ecebe.reference = {
    __cReference: true,
    get value() { return LIZMANLEG1____header_global_b266f6ad9ffa0527; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:594
export const EXPLOSION2BOT____header_global_cc237ae4ad0430ed = ((u32(((u32(2219) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3dbc0e13c2854fd9e25de488() {
  return __cxx_static_address_3dbc0e13c2854fd9e25de488.reference || (__cxx_static_address_3dbc0e13c2854fd9e25de488.reference = {
    __cReference: true,
    get value() { return EXPLOSION2BOT____header_global_cc237ae4ad0430ed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:595
export const JIBS1____header_global_2ad91546fb1972af = ((u32(((u32(2245) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f705d2a9d06074e76c87b55b() {
  return __cxx_static_address_f705d2a9d06074e76c87b55b.reference || (__cxx_static_address_f705d2a9d06074e76c87b55b.reference = {
    __cReference: true,
    get value() { return JIBS1____header_global_2ad91546fb1972af; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:596
export const JIBS2____header_global_73a6b99770b4e4a2 = ((u32(((u32(2250) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a9c937771255863517a60cc4() {
  return __cxx_static_address_a9c937771255863517a60cc4.reference || (__cxx_static_address_a9c937771255863517a60cc4.reference = {
    __cReference: true,
    get value() { return JIBS2____header_global_73a6b99770b4e4a2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:597
export const JIBS3____header_global_cb07e3cea7bce943 = ((u32(((u32(2255) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ffd91449b3c45e65b20f8008() {
  return __cxx_static_address_ffd91449b3c45e65b20f8008.reference || (__cxx_static_address_ffd91449b3c45e65b20f8008.reference = {
    __cReference: true,
    get value() { return JIBS3____header_global_cb07e3cea7bce943; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:598
export const JIBS4____header_global_516bafca1c36190f = ((u32(((u32(2260) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e052f520cab61adc798078a4() {
  return __cxx_static_address_e052f520cab61adc798078a4.reference || (__cxx_static_address_e052f520cab61adc798078a4.reference = {
    __cReference: true,
    get value() { return JIBS4____header_global_516bafca1c36190f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:599
export const JIBS5____header_global_6f42e81d5c75e026 = ((u32(((u32(2265) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2f9d14df44b120ee1e9b8893() {
  return __cxx_static_address_2f9d14df44b120ee1e9b8893.reference || (__cxx_static_address_2f9d14df44b120ee1e9b8893.reference = {
    __cReference: true,
    get value() { return JIBS5____header_global_6f42e81d5c75e026; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:600
export const BURNING____header_global_3333dc2b065c6d95 = ((u32(((u32(2270) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4cc490e65677b37f4b5effb9() {
  return __cxx_static_address_4cc490e65677b37f4b5effb9.reference || (__cxx_static_address_4cc490e65677b37f4b5effb9.reference = {
    __cReference: true,
    get value() { return BURNING____header_global_3333dc2b065c6d95; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:601
export const FIRE____header_global_94cc1cc7f6b809f3 = ((u32(((u32(2271) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3f738585af3a2503cc6f8b29() {
  return __cxx_static_address_3f738585af3a2503cc6f8b29.reference || (__cxx_static_address_3f738585af3a2503cc6f8b29.reference = {
    __cReference: true,
    get value() { return FIRE____header_global_94cc1cc7f6b809f3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:602
export const JIBS6____header_global_f764f46bc91deff8 = ((u32(((u32(2286) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e8d9346c6e2603d68d3d55dc() {
  return __cxx_static_address_e8d9346c6e2603d68d3d55dc.reference || (__cxx_static_address_e8d9346c6e2603d68d3d55dc.reference = {
    __cReference: true,
    get value() { return JIBS6____header_global_f764f46bc91deff8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:603
export const BLOODSPLAT1____header_global_7a3326558bda4242 = ((u32(((u32(2296) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_10393f15a6b2e86880fa3e8e() {
  return __cxx_static_address_10393f15a6b2e86880fa3e8e.reference || (__cxx_static_address_10393f15a6b2e86880fa3e8e.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT1____header_global_7a3326558bda4242; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:604
export const BLOODSPLAT3____header_global_8b286d6e563a1e69 = ((u32(((u32(2297) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_696a64d3204bd0b48eeb893d() {
  return __cxx_static_address_696a64d3204bd0b48eeb893d.reference || (__cxx_static_address_696a64d3204bd0b48eeb893d.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT3____header_global_8b286d6e563a1e69; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:605
export const BLOODSPLAT2____header_global_1a8847c6215dae27 = ((u32(((u32(2298) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e42558ed389a0da053ee5d96() {
  return __cxx_static_address_e42558ed389a0da053ee5d96.reference || (__cxx_static_address_e42558ed389a0da053ee5d96.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT2____header_global_1a8847c6215dae27; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:606
export const BLOODSPLAT4____header_global_b6cdea5e85c50928 = ((u32(((u32(2299) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ac6afbe9cbbe19624cda927c() {
  return __cxx_static_address_ac6afbe9cbbe19624cda927c.reference || (__cxx_static_address_ac6afbe9cbbe19624cda927c.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT4____header_global_b6cdea5e85c50928; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:607
export const OOZ____header_global_544a1c0db78ca741 = ((u32(((u32(2300) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e555ba9b44890238faaa9346() {
  return __cxx_static_address_e555ba9b44890238faaa9346.reference || (__cxx_static_address_e555ba9b44890238faaa9346.reference = {
    __cReference: true,
    get value() { return OOZ____header_global_544a1c0db78ca741; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:608
export const OOZ2____header_global_47dd54bbef74b5ac = ((u32(((u32(2309) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_16c2e13381cf081af5f2e472() {
  return __cxx_static_address_16c2e13381cf081af5f2e472.reference || (__cxx_static_address_16c2e13381cf081af5f2e472.reference = {
    __cReference: true,
    get value() { return OOZ2____header_global_47dd54bbef74b5ac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:609
export const WALLBLOOD1____header_global_3c655e2d0725a5c9 = ((u32(((u32(2301) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cfa1db6a003220a14ef51947() {
  return __cxx_static_address_cfa1db6a003220a14ef51947.reference || (__cxx_static_address_cfa1db6a003220a14ef51947.reference = {
    __cReference: true,
    get value() { return WALLBLOOD1____header_global_3c655e2d0725a5c9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:610
export const WALLBLOOD2____header_global_59ee8f3cd2429a15 = ((u32(((u32(2302) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4346aa0da712c77df61875df() {
  return __cxx_static_address_4346aa0da712c77df61875df.reference || (__cxx_static_address_4346aa0da712c77df61875df.reference = {
    __cReference: true,
    get value() { return WALLBLOOD2____header_global_59ee8f3cd2429a15; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:611
export const WALLBLOOD3____header_global_0f2b2e16faf20640 = ((u32(((u32(2303) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9ce7e000176c42760cea5d3d() {
  return __cxx_static_address_9ce7e000176c42760cea5d3d.reference || (__cxx_static_address_9ce7e000176c42760cea5d3d.reference = {
    __cReference: true,
    get value() { return WALLBLOOD3____header_global_0f2b2e16faf20640; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:612
export const WALLBLOOD4____header_global_625e6cb34a09bfdd = ((u32(((u32(2304) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_39ff744678f0f23f180555cf() {
  return __cxx_static_address_39ff744678f0f23f180555cf.reference || (__cxx_static_address_39ff744678f0f23f180555cf.reference = {
    __cReference: true,
    get value() { return WALLBLOOD4____header_global_625e6cb34a09bfdd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:613
export const WALLBLOOD5____header_global_4acfb8ade24772ef = ((u32(((u32(2305) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b6bcac07544d51d734e4b0a6() {
  return __cxx_static_address_b6bcac07544d51d734e4b0a6.reference || (__cxx_static_address_b6bcac07544d51d734e4b0a6.reference = {
    __cReference: true,
    get value() { return WALLBLOOD5____header_global_4acfb8ade24772ef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:614
export const WALLBLOOD7____header_global_cab1a537fbdebecf = ((u32(((u32(2307) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4d810da69f3c471f9b6a263b() {
  return __cxx_static_address_4d810da69f3c471f9b6a263b.reference || (__cxx_static_address_4d810da69f3c471f9b6a263b.reference = {
    __cReference: true,
    get value() { return WALLBLOOD7____header_global_cab1a537fbdebecf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:615
export const WALLBLOOD8____header_global_3cd855b047f446fd = ((u32(((u32(2308) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_094a6b7fa25608e92fd36dcd() {
  return __cxx_static_address_094a6b7fa25608e92fd36dcd.reference || (__cxx_static_address_094a6b7fa25608e92fd36dcd.reference = {
    __cReference: true,
    get value() { return WALLBLOOD8____header_global_3cd855b047f446fd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:616
export const BURNING2____header_global_a5b1dfcf5a1dabec = ((u32(((u32(2310) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cb419523aa3d9cbf37262b5d() {
  return __cxx_static_address_cb419523aa3d9cbf37262b5d.reference || (__cxx_static_address_cb419523aa3d9cbf37262b5d.reference = {
    __cReference: true,
    get value() { return BURNING2____header_global_a5b1dfcf5a1dabec; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:617
export const FIRE2____header_global_86b36aa0b3308f3c = ((u32(((u32(2311) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_99470d727283ef3d0bee1f36() {
  return __cxx_static_address_99470d727283ef3d0bee1f36.reference || (__cxx_static_address_99470d727283ef3d0bee1f36.reference = {
    __cReference: true,
    get value() { return FIRE2____header_global_86b36aa0b3308f3c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:618
export const CRACKKNUCKLES____header_global_acac01aa5cf99bd5 = ((u32(((u32(2324) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6dc70ae8966d8073d28838b2() {
  return __cxx_static_address_6dc70ae8966d8073d28838b2.reference || (__cxx_static_address_6dc70ae8966d8073d28838b2.reference = {
    __cReference: true,
    get value() { return CRACKKNUCKLES____header_global_acac01aa5cf99bd5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:619
export const SMALLSMOKE____header_global_4185db82fad8078d = ((u32(((u32(2329) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8b3acc9cef75f94fb3d5801c() {
  return __cxx_static_address_8b3acc9cef75f94fb3d5801c.reference || (__cxx_static_address_8b3acc9cef75f94fb3d5801c.reference = {
    __cReference: true,
    get value() { return SMALLSMOKE____header_global_4185db82fad8078d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:620
export const FLOORFLAME____header_global_b52806649be9dc76 = ((u32(((u32(2333) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_429762f0e8bc02c9879d7b10() {
  return __cxx_static_address_429762f0e8bc02c9879d7b10.reference || (__cxx_static_address_429762f0e8bc02c9879d7b10.reference = {
    __cReference: true,
    get value() { return FLOORFLAME____header_global_b52806649be9dc76; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:621
export const ROTATEGUN____header_global_2bdd6df665285933 = ((u32(((u32(2360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ec291d34e0bf6bd4651cec69() {
  return __cxx_static_address_ec291d34e0bf6bd4651cec69.reference || (__cxx_static_address_ec291d34e0bf6bd4651cec69.reference = {
    __cReference: true,
    get value() { return ROTATEGUN____header_global_2bdd6df665285933; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:622
export const GREENSLIME____header_global_329e44650f637327 = ((u32(((u32(2370) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_41a69e139a45833ddb877a68() {
  return __cxx_static_address_41a69e139a45833ddb877a68.reference || (__cxx_static_address_41a69e139a45833ddb877a68.reference = {
    __cReference: true,
    get value() { return GREENSLIME____header_global_329e44650f637327; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:623
export const WATERDRIPSPLASH____header_global_6f8a67f1e511f3a6 = ((u32(((u32(2380) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2f4f26a16035077ed3754f8d() {
  return __cxx_static_address_2f4f26a16035077ed3754f8d.reference || (__cxx_static_address_2f4f26a16035077ed3754f8d.reference = {
    __cReference: true,
    get value() { return WATERDRIPSPLASH____header_global_6f8a67f1e511f3a6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:624
export const SCRAP6____header_global_b05fcb33ae2da564 = ((u32(((u32(2390) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_106c57b0ea54c4d39bf149aa() {
  return __cxx_static_address_106c57b0ea54c4d39bf149aa.reference || (__cxx_static_address_106c57b0ea54c4d39bf149aa.reference = {
    __cReference: true,
    get value() { return SCRAP6____header_global_b05fcb33ae2da564; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:625
export const SCRAP1____header_global_85c2927e6c5880ee = ((u32(((u32(2400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fc5232f7cd0c76b936243276() {
  return __cxx_static_address_fc5232f7cd0c76b936243276.reference || (__cxx_static_address_fc5232f7cd0c76b936243276.reference = {
    __cReference: true,
    get value() { return SCRAP1____header_global_85c2927e6c5880ee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:626
export const SCRAP2____header_global_137d4f25799ed1d5 = ((u32(((u32(2404) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0c8a1974d6314d329ff90a48() {
  return __cxx_static_address_0c8a1974d6314d329ff90a48.reference || (__cxx_static_address_0c8a1974d6314d329ff90a48.reference = {
    __cReference: true,
    get value() { return SCRAP2____header_global_137d4f25799ed1d5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:627
export const SCRAP3____header_global_94af38a8ed097600 = ((u32(((u32(2408) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_532a26f7117d0fc16812ad21() {
  return __cxx_static_address_532a26f7117d0fc16812ad21.reference || (__cxx_static_address_532a26f7117d0fc16812ad21.reference = {
    __cReference: true,
    get value() { return SCRAP3____header_global_94af38a8ed097600; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:628
export const SCRAP4____header_global_ab1e181bd5dfb09f = ((u32(((u32(2412) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d3e83b3cf110a99772725e08() {
  return __cxx_static_address_d3e83b3cf110a99772725e08.reference || (__cxx_static_address_d3e83b3cf110a99772725e08.reference = {
    __cReference: true,
    get value() { return SCRAP4____header_global_ab1e181bd5dfb09f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:629
export const SCRAP5____header_global_cc7a9b43a4d6cd17 = ((u32(((u32(2416) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_11236194122f854384dba8c1() {
  return __cxx_static_address_11236194122f854384dba8c1.reference || (__cxx_static_address_11236194122f854384dba8c1.reference = {
    __cReference: true,
    get value() { return SCRAP5____header_global_cc7a9b43a4d6cd17; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:630
export const ORGANTIC____header_global_a3a716aac045453c = ((u32(((u32(2420) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3b2726a8923fa6968912accc() {
  return __cxx_static_address_3b2726a8923fa6968912accc.reference || (__cxx_static_address_3b2726a8923fa6968912accc.reference = {
    __cReference: true,
    get value() { return ORGANTIC____header_global_a3a716aac045453c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:631
export const BETAVERSION____header_global_d9075bc4cc39988d = ((u32(((u32(2440) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cf1e6e599b9e92f907f06c12() {
  return __cxx_static_address_cf1e6e599b9e92f907f06c12.reference || (__cxx_static_address_cf1e6e599b9e92f907f06c12.reference = {
    __cReference: true,
    get value() { return BETAVERSION____header_global_d9075bc4cc39988d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:632
export const SELECTDIR____header_global_73ee65e16e86e31e = ((u32(((u32(2444) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_574a4c559ae46a2fa1db9d43() {
  return __cxx_static_address_574a4c559ae46a2fa1db9d43.reference || (__cxx_static_address_574a4c559ae46a2fa1db9d43.reference = {
    __cReference: true,
    get value() { return SELECTDIR____header_global_73ee65e16e86e31e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:633
export const F1HELP____header_global_365c5b1af3f124f6 = ((u32(((u32(2445) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_098d1c0f56ba2f271aeffebe() {
  return __cxx_static_address_098d1c0f56ba2f271aeffebe.reference || (__cxx_static_address_098d1c0f56ba2f271aeffebe.reference = {
    __cReference: true,
    get value() { return F1HELP____header_global_365c5b1af3f124f6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:634
export const GROWSPARK____header_global_cb554ab0b01ee3be = ((u32(((u32(2448) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2a7bb14ac9f141caee7ce0ef() {
  return __cxx_static_address_2a7bb14ac9f141caee7ce0ef.reference || (__cxx_static_address_2a7bb14ac9f141caee7ce0ef.reference = {
    __cReference: true,
    get value() { return GROWSPARK____header_global_cb554ab0b01ee3be; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:635
export const MENUSCREEN____header_global_5f2812b64bb4476d = ((u32(((u32(2456) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5d34e9bfcf1742905d09c989() {
  return __cxx_static_address_5d34e9bfcf1742905d09c989.reference || (__cxx_static_address_5d34e9bfcf1742905d09c989.reference = {
    __cReference: true,
    get value() { return MENUSCREEN____header_global_5f2812b64bb4476d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:636
export const MENUBAR____header_global_5a6870af77bf5ad6 = ((u32(((u32(2457) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_577a1b60682a1eb359439e7b() {
  return __cxx_static_address_577a1b60682a1eb359439e7b.reference || (__cxx_static_address_577a1b60682a1eb359439e7b.reference = {
    __cReference: true,
    get value() { return MENUBAR____header_global_5a6870af77bf5ad6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:637
export const KILLSICON____header_global_c8eb704f4e172467 = ((u32(((u32(2458) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aa7785224b463237306bcf8d() {
  return __cxx_static_address_aa7785224b463237306bcf8d.reference || (__cxx_static_address_aa7785224b463237306bcf8d.reference = {
    __cReference: true,
    get value() { return KILLSICON____header_global_c8eb704f4e172467; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:638
export const FIRSTAID_ICON____header_global_c27078308deb73ab = ((u32(((u32(2460) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8cf2bde0245c65f5e68e8a89() {
  return __cxx_static_address_8cf2bde0245c65f5e68e8a89.reference || (__cxx_static_address_8cf2bde0245c65f5e68e8a89.reference = {
    __cReference: true,
    get value() { return FIRSTAID_ICON____header_global_c27078308deb73ab; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:639
export const HEAT_ICON____header_global_a33830deeb159d1a = ((u32(((u32(2461) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e5d5f89c92871283d3577440() {
  return __cxx_static_address_e5d5f89c92871283d3577440.reference || (__cxx_static_address_e5d5f89c92871283d3577440.reference = {
    __cReference: true,
    get value() { return HEAT_ICON____header_global_a33830deeb159d1a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:640
export const BOTTOMSTATUSBAR____header_global_85149e52f632b39e = ((u32(((u32(2462) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d338530392e63a8a9bfb400d() {
  return __cxx_static_address_d338530392e63a8a9bfb400d.reference || (__cxx_static_address_d338530392e63a8a9bfb400d.reference = {
    __cReference: true,
    get value() { return BOTTOMSTATUSBAR____header_global_85149e52f632b39e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:641
export const BOOT_ICON____header_global_0a5a84be97278690 = ((u32(((u32(2463) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_782da332e0826f3dc1faaf31() {
  return __cxx_static_address_782da332e0826f3dc1faaf31.reference || (__cxx_static_address_782da332e0826f3dc1faaf31.reference = {
    __cReference: true,
    get value() { return BOOT_ICON____header_global_0a5a84be97278690; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:642
export const FRAGBAR____header_global_136f73aab58b0a5f = ((u32(((u32(2465) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f80ec3e8936b1de92f678162() {
  return __cxx_static_address_f80ec3e8936b1de92f678162.reference || (__cxx_static_address_f80ec3e8936b1de92f678162.reference = {
    __cReference: true,
    get value() { return FRAGBAR____header_global_136f73aab58b0a5f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:643
export const JETPACK_ICON____header_global_f478032dbdd4a5b6 = ((u32(((u32(2467) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_41e36286e7a035d65c56b253() {
  return __cxx_static_address_41e36286e7a035d65c56b253.reference || (__cxx_static_address_41e36286e7a035d65c56b253.reference = {
    __cReference: true,
    get value() { return JETPACK_ICON____header_global_f478032dbdd4a5b6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:644
export const AIRTANK_ICON____header_global_628815f29617152f = ((u32(((u32(2468) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c4feb2b79f873797581c6398() {
  return __cxx_static_address_c4feb2b79f873797581c6398.reference || (__cxx_static_address_c4feb2b79f873797581c6398.reference = {
    __cReference: true,
    get value() { return AIRTANK_ICON____header_global_628815f29617152f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:645
export const STEROIDS_ICON____header_global_f58c58a83221c5b9 = ((u32(((u32(2469) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_20ab880c7ada5de7908ba340() {
  return __cxx_static_address_20ab880c7ada5de7908ba340.reference || (__cxx_static_address_20ab880c7ada5de7908ba340.reference = {
    __cReference: true,
    get value() { return STEROIDS_ICON____header_global_f58c58a83221c5b9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:646
export const HOLODUKE_ICON____header_global_1f0b5987c7412143 = ((u32(((u32(2470) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_084668250e95a48b95742cd6() {
  return __cxx_static_address_084668250e95a48b95742cd6.reference || (__cxx_static_address_084668250e95a48b95742cd6.reference = {
    __cReference: true,
    get value() { return HOLODUKE_ICON____header_global_1f0b5987c7412143; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:647
export const ACCESS_ICON____header_global_fee630e28c94b14d = ((u32(((u32(2471) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_016ec129cc7bb1d3d9a239f8() {
  return __cxx_static_address_016ec129cc7bb1d3d9a239f8.reference || (__cxx_static_address_016ec129cc7bb1d3d9a239f8.reference = {
    __cReference: true,
    get value() { return ACCESS_ICON____header_global_fee630e28c94b14d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:648
export const DIGITALNUM____header_global_e3d40b42088c1fbc = ((u32(((u32(2472) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b71b9da99565e714382238a3() {
  return __cxx_static_address_b71b9da99565e714382238a3.reference || (__cxx_static_address_b71b9da99565e714382238a3.reference = {
    __cReference: true,
    get value() { return DIGITALNUM____header_global_e3d40b42088c1fbc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:649
export const DUKECAR____header_global_b3c68da3cdc354b1 = ((u32(((u32(2491) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_afb4474a228c7a3697e053ef() {
  return __cxx_static_address_afb4474a228c7a3697e053ef.reference || (__cxx_static_address_afb4474a228c7a3697e053ef.reference = {
    __cReference: true,
    get value() { return DUKECAR____header_global_b3c68da3cdc354b1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:650
export const CAMCORNER____header_global_0acf63c2cf59763b = ((u32(((u32(2482) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3c0877b8ee617aff17d55a09() {
  return __cxx_static_address_3c0877b8ee617aff17d55a09.reference || (__cxx_static_address_3c0877b8ee617aff17d55a09.reference = {
    __cReference: true,
    get value() { return CAMCORNER____header_global_0acf63c2cf59763b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:651
export const CAMLIGHT____header_global_9e31fbf34a1b248a = ((u32(((u32(2484) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e4daf8d481e6704e10519002() {
  return __cxx_static_address_e4daf8d481e6704e10519002.reference || (__cxx_static_address_e4daf8d481e6704e10519002.reference = {
    __cReference: true,
    get value() { return CAMLIGHT____header_global_9e31fbf34a1b248a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:652
export const SLIDEBAR____header_global_247303ff432e7c01 = ((u32(((u32(2489) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a8cf5961b249e26016b01ea8() {
  return __cxx_static_address_a8cf5961b249e26016b01ea8.reference || (__cxx_static_address_a8cf5961b249e26016b01ea8.reference = {
    __cReference: true,
    get value() { return SLIDEBAR____header_global_247303ff432e7c01; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:653
export const DREALMS____header_global_b68ac9a8cf4695bc = ((u32(((u32(2492) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_41644faf1f8699644e102a23() {
  return __cxx_static_address_41644faf1f8699644e102a23.reference || (__cxx_static_address_41644faf1f8699644e102a23.reference = {
    __cReference: true,
    get value() { return DREALMS____header_global_b68ac9a8cf4695bc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:654
export const BETASCREEN____header_global_719d2f129b76e28e = ((u32(((u32(2493) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b8a5b03595a88f66e226d02e() {
  return __cxx_static_address_b8a5b03595a88f66e226d02e.reference || (__cxx_static_address_b8a5b03595a88f66e226d02e.reference = {
    __cReference: true,
    get value() { return BETASCREEN____header_global_719d2f129b76e28e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:655
export const WINDOWBORDER1____header_global_cb7e24264c029cc3 = ((u32(((u32(2494) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0b5b69478602cea5178b6338() {
  return __cxx_static_address_0b5b69478602cea5178b6338.reference || (__cxx_static_address_0b5b69478602cea5178b6338.reference = {
    __cReference: true,
    get value() { return WINDOWBORDER1____header_global_cb7e24264c029cc3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:656
export const TEXTBOX____header_global_d90c1d17b7758530 = ((u32(((u32(2495) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7409e1e2fa38ae28b65dc02e() {
  return __cxx_static_address_7409e1e2fa38ae28b65dc02e.reference || (__cxx_static_address_7409e1e2fa38ae28b65dc02e.reference = {
    __cReference: true,
    get value() { return TEXTBOX____header_global_d90c1d17b7758530; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:657
export const WINDOWBORDER2____header_global_fac7151b33670f59 = ((u32(((u32(2496) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_59c3434c6f099a07cb378492() {
  return __cxx_static_address_59c3434c6f099a07cb378492.reference || (__cxx_static_address_59c3434c6f099a07cb378492.reference = {
    __cReference: true,
    get value() { return WINDOWBORDER2____header_global_fac7151b33670f59; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:658
export const DUKENUKEM____header_global_2767e55ced078920 = ((u32(((u32(2497) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8da8cf7ea5b9571c695ea7c7() {
  return __cxx_static_address_8da8cf7ea5b9571c695ea7c7.reference || (__cxx_static_address_8da8cf7ea5b9571c695ea7c7.reference = {
    __cReference: true,
    get value() { return DUKENUKEM____header_global_2767e55ced078920; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:659
export const THREEDEE____header_global_2c5f9e53186553b9 = ((u32(((u32(2498) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3f6e9f81e74a81ee5a064d3a() {
  return __cxx_static_address_3f6e9f81e74a81ee5a064d3a.reference || (__cxx_static_address_3f6e9f81e74a81ee5a064d3a.reference = {
    __cReference: true,
    get value() { return THREEDEE____header_global_2c5f9e53186553b9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:660
export const INGAMEDUKETHREEDEE____header_global_4212ab1294cfb339 = ((u32(((u32(2499) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6977e822703489b5f625989d() {
  return __cxx_static_address_6977e822703489b5f625989d.reference || (__cxx_static_address_6977e822703489b5f625989d.reference = {
    __cReference: true,
    get value() { return INGAMEDUKETHREEDEE____header_global_4212ab1294cfb339; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:661
export const TENSCREEN____header_global_4a84546c671d624b = ((u32(((u32(2500) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_57bd0d9b0763610be2c41788() {
  return __cxx_static_address_57bd0d9b0763610be2c41788.reference || (__cxx_static_address_57bd0d9b0763610be2c41788.reference = {
    __cReference: true,
    get value() { return TENSCREEN____header_global_4a84546c671d624b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:662
export const PLUTOPAKSPRITE____header_global_7339b8a88c1c7da2 = ((u32(((u32(2501) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_370df625a49555e7e202c09e() {
  return __cxx_static_address_370df625a49555e7e202c09e.reference || (__cxx_static_address_370df625a49555e7e202c09e.reference = {
    __cReference: true,
    get value() { return PLUTOPAKSPRITE____header_global_7339b8a88c1c7da2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:663
export const DEVISTATOR____header_global_8fc47f694334f13c = ((u32(((u32(2510) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_febd20a5b59ba793c3982960() {
  return __cxx_static_address_febd20a5b59ba793c3982960.reference || (__cxx_static_address_febd20a5b59ba793c3982960.reference = {
    __cReference: true,
    get value() { return DEVISTATOR____header_global_8fc47f694334f13c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:664
export const KNEE____header_global_4d934fed06f6f2db = ((u32(((u32(2521) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2032233dc1232170a880a8b5() {
  return __cxx_static_address_2032233dc1232170a880a8b5.reference || (__cxx_static_address_2032233dc1232170a880a8b5.reference = {
    __cReference: true,
    get value() { return KNEE____header_global_4d934fed06f6f2db; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:665
export const CROSSHAIR____header_global_50a99fa961b96ea5 = ((u32(((u32(2523) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_721f80f7907d5fed7ca31fa7() {
  return __cxx_static_address_721f80f7907d5fed7ca31fa7.reference || (__cxx_static_address_721f80f7907d5fed7ca31fa7.reference = {
    __cReference: true,
    get value() { return CROSSHAIR____header_global_50a99fa961b96ea5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:666
export const FIRSTGUN____header_global_5ed95210275b9569 = ((u32(((u32(2524) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e49c3707860a9e0424c4d167() {
  return __cxx_static_address_e49c3707860a9e0424c4d167.reference || (__cxx_static_address_e49c3707860a9e0424c4d167.reference = {
    __cReference: true,
    get value() { return FIRSTGUN____header_global_5ed95210275b9569; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:667
export const FIRSTGUNRELOAD____header_global_8925a765bb02c8df = ((u32(((u32(2528) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a2c74cfd568fb91c21112e81() {
  return __cxx_static_address_a2c74cfd568fb91c21112e81.reference || (__cxx_static_address_a2c74cfd568fb91c21112e81.reference = {
    __cReference: true,
    get value() { return FIRSTGUNRELOAD____header_global_8925a765bb02c8df; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:668
export const SHELL____header_global_ebdce7e59d3c4660 = ((u32(((u32(2533) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b5594ab10c147f301a2ac562() {
  return __cxx_static_address_b5594ab10c147f301a2ac562.reference || (__cxx_static_address_b5594ab10c147f301a2ac562.reference = {
    __cReference: true,
    get value() { return SHELL____header_global_ebdce7e59d3c4660; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:669
export const SHOTGUNSHELL____header_global_b96c21bc879155e0 = ((u32(((u32(2535) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7c54815986e8d0440a6f4202() {
  return __cxx_static_address_7c54815986e8d0440a6f4202.reference || (__cxx_static_address_7c54815986e8d0440a6f4202.reference = {
    __cReference: true,
    get value() { return SHOTGUNSHELL____header_global_b96c21bc879155e0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:670
export const CHAINGUN____header_global_56905970b87f0151 = ((u32(((u32(2536) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bbac78f89a8b4006f85ac12f() {
  return __cxx_static_address_bbac78f89a8b4006f85ac12f.reference || (__cxx_static_address_bbac78f89a8b4006f85ac12f.reference = {
    __cReference: true,
    get value() { return CHAINGUN____header_global_56905970b87f0151; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:671
export const RPGGUN____header_global_0f539db3c7edb351 = ((u32(((u32(2544) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c1305e354d15773d029b67e3() {
  return __cxx_static_address_c1305e354d15773d029b67e3.reference || (__cxx_static_address_c1305e354d15773d029b67e3.reference = {
    __cReference: true,
    get value() { return RPGGUN____header_global_0f539db3c7edb351; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:672
export const FREEZE____header_global_5d56bdcea34d90ce = ((u32(((u32(2548) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ca14170b1340ebc0992fabb3() {
  return __cxx_static_address_ca14170b1340ebc0992fabb3.reference || (__cxx_static_address_ca14170b1340ebc0992fabb3.reference = {
    __cReference: true,
    get value() { return FREEZE____header_global_5d56bdcea34d90ce; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:673
export const SHRINKER____header_global_e3fb4ffb37119197 = ((u32(((u32(2556) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_70b260c42c9872375c2cb568() {
  return __cxx_static_address_70b260c42c9872375c2cb568.reference || (__cxx_static_address_70b260c42c9872375c2cb568.reference = {
    __cReference: true,
    get value() { return SHRINKER____header_global_e3fb4ffb37119197; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:674
export const HANDHOLDINGLASER____header_global_8c90f85f666a12db = ((u32(((u32(2563) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f7ae5eaf3d189c37c17afd59() {
  return __cxx_static_address_f7ae5eaf3d189c37c17afd59.reference || (__cxx_static_address_f7ae5eaf3d189c37c17afd59.reference = {
    __cReference: true,
    get value() { return HANDHOLDINGLASER____header_global_8c90f85f666a12db; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:675
export const TRIPBOMB____header_global_f222c4cc658d1358 = ((u32(((u32(2566) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fbebced0bef97c39fe017a98() {
  return __cxx_static_address_fbebced0bef97c39fe017a98.reference || (__cxx_static_address_fbebced0bef97c39fe017a98.reference = {
    __cReference: true,
    get value() { return TRIPBOMB____header_global_f222c4cc658d1358; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:676
export const LASERLINE____header_global_ec311cbd279d016e = ((u32(((u32(2567) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_acf1d5ebda99e1282cc876ca() {
  return __cxx_static_address_acf1d5ebda99e1282cc876ca.reference || (__cxx_static_address_acf1d5ebda99e1282cc876ca.reference = {
    __cReference: true,
    get value() { return LASERLINE____header_global_ec311cbd279d016e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:677
export const HANDHOLDINGACCESS____header_global_97d1b339f31c972e = ((u32(((u32(2568) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c9249ff99aed93dd159e0741() {
  return __cxx_static_address_c9249ff99aed93dd159e0741.reference || (__cxx_static_address_c9249ff99aed93dd159e0741.reference = {
    __cReference: true,
    get value() { return HANDHOLDINGACCESS____header_global_97d1b339f31c972e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:678
export const HANDREMOTE____header_global_5b4692f9894b2a12 = ((u32(((u32(2570) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1a45e0c51c4147c197f21a7f() {
  return __cxx_static_address_1a45e0c51c4147c197f21a7f.reference || (__cxx_static_address_1a45e0c51c4147c197f21a7f.reference = {
    __cReference: true,
    get value() { return HANDREMOTE____header_global_5b4692f9894b2a12; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:679
export const HANDTHROW____header_global_e94169971d2180d4 = ((u32(((u32(2573) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_225ae7118d42ac6a55005b63() {
  return __cxx_static_address_225ae7118d42ac6a55005b63.reference || (__cxx_static_address_225ae7118d42ac6a55005b63.reference = {
    __cReference: true,
    get value() { return HANDTHROW____header_global_e94169971d2180d4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:680
export const TIP____header_global_feeda5400498f119 = ((u32(((u32(2576) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5f446abbba9bdae1a5ef938c() {
  return __cxx_static_address_5f446abbba9bdae1a5ef938c.reference || (__cxx_static_address_5f446abbba9bdae1a5ef938c.reference = {
    __cReference: true,
    get value() { return TIP____header_global_feeda5400498f119; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:681
export const SCUBAMASK____header_global_afad123656eebc96 = ((u32(((u32(2581) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d14eb570af213b3d19fabcf0() {
  return __cxx_static_address_d14eb570af213b3d19fabcf0.reference || (__cxx_static_address_d14eb570af213b3d19fabcf0.reference = {
    __cReference: true,
    get value() { return SCUBAMASK____header_global_afad123656eebc96; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:682
export const FORCESPHERE____header_global_d9d558c1e87b00b5 = ((u32(((u32(2590) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f91534d70dd609927f828498() {
  return __cxx_static_address_f91534d70dd609927f828498.reference || (__cxx_static_address_f91534d70dd609927f828498.reference = {
    __cReference: true,
    get value() { return FORCESPHERE____header_global_d9d558c1e87b00b5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:683
export const SHOTSPARK1____header_global_4d757967961287d1 = ((u32(((u32(2595) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b7b77339e43f2d390aa87252() {
  return __cxx_static_address_b7b77339e43f2d390aa87252.reference || (__cxx_static_address_b7b77339e43f2d390aa87252.reference = {
    __cReference: true,
    get value() { return SHOTSPARK1____header_global_4d757967961287d1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:684
export const RPG____header_global_ca9b21c3bce7aa9c = ((u32(((u32(2605) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_081f0f52a6c66634ed29e5da() {
  return __cxx_static_address_081f0f52a6c66634ed29e5da.reference || (__cxx_static_address_081f0f52a6c66634ed29e5da.reference = {
    __cReference: true,
    get value() { return RPG____header_global_ca9b21c3bce7aa9c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:685
export const LASERSITE____header_global_426e8a8b86b545bd = ((u32(((u32(2612) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3ed9088946e74210de84e6e3() {
  return __cxx_static_address_3ed9088946e74210de84e6e3.reference || (__cxx_static_address_3ed9088946e74210de84e6e3.reference = {
    __cReference: true,
    get value() { return LASERSITE____header_global_426e8a8b86b545bd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:686
export const SHOTGUN____header_global_1fc08ba0c07a787f = ((u32(((u32(2613) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_03a18b5dc978a9e696ecd7d3() {
  return __cxx_static_address_03a18b5dc978a9e696ecd7d3.reference || (__cxx_static_address_03a18b5dc978a9e696ecd7d3.reference = {
    __cReference: true,
    get value() { return SHOTGUN____header_global_1fc08ba0c07a787f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:687
export const BOSS1____header_global_8214cebe4227ed07 = ((u32(((u32(2630) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_10c86ea1d1eec52207bb4169() {
  return __cxx_static_address_10c86ea1d1eec52207bb4169.reference || (__cxx_static_address_10c86ea1d1eec52207bb4169.reference = {
    __cReference: true,
    get value() { return BOSS1____header_global_8214cebe4227ed07; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:688
export const BOSS1STAYPUT____header_global_721ae824628497f9 = ((u32(((u32(2631) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_833fef6d408418f5d03ad79a() {
  return __cxx_static_address_833fef6d408418f5d03ad79a.reference || (__cxx_static_address_833fef6d408418f5d03ad79a.reference = {
    __cReference: true,
    get value() { return BOSS1STAYPUT____header_global_721ae824628497f9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:689
export const BOSS1SHOOT____header_global_d748fb2fe503e211 = ((u32(((u32(2660) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c7126d690b544d425cc76f28() {
  return __cxx_static_address_c7126d690b544d425cc76f28.reference || (__cxx_static_address_c7126d690b544d425cc76f28.reference = {
    __cReference: true,
    get value() { return BOSS1SHOOT____header_global_d748fb2fe503e211; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:690
export const BOSS1LOB____header_global_b82927f279276791 = ((u32(((u32(2670) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_546b1582d20a057fa2242ea1() {
  return __cxx_static_address_546b1582d20a057fa2242ea1.reference || (__cxx_static_address_546b1582d20a057fa2242ea1.reference = {
    __cReference: true,
    get value() { return BOSS1LOB____header_global_b82927f279276791; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:691
export const BOSSTOP____header_global_f46c0fc7e171d671 = ((u32(((u32(2696) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_51257b3c022f613e459106b1() {
  return __cxx_static_address_51257b3c022f613e459106b1.reference || (__cxx_static_address_51257b3c022f613e459106b1.reference = {
    __cReference: true,
    get value() { return BOSSTOP____header_global_f46c0fc7e171d671; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:692
export const BOSS2____header_global_02c7e2b2b62c9708 = ((u32(((u32(2710) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_41349d6bedf2ad382e6732db() {
  return __cxx_static_address_41349d6bedf2ad382e6732db.reference || (__cxx_static_address_41349d6bedf2ad382e6732db.reference = {
    __cReference: true,
    get value() { return BOSS2____header_global_02c7e2b2b62c9708; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:693
export const BOSS3____header_global_facc3d54bb2c3310 = ((u32(((u32(2760) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8c8b2b7b13871e6eee5e6f40() {
  return __cxx_static_address_8c8b2b7b13871e6eee5e6f40.reference || (__cxx_static_address_8c8b2b7b13871e6eee5e6f40.reference = {
    __cReference: true,
    get value() { return BOSS3____header_global_facc3d54bb2c3310; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:694
export const SPINNINGNUKEICON____header_global_78845202e48a09c8 = ((u32(((u32(2813) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3e8eab262857ff7abba6f57b() {
  return __cxx_static_address_3e8eab262857ff7abba6f57b.reference || (__cxx_static_address_3e8eab262857ff7abba6f57b.reference = {
    __cReference: true,
    get value() { return SPINNINGNUKEICON____header_global_78845202e48a09c8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:695
export const SMALLFNTCURSOR____header_global_b2e0b59e5dd2f49e = ((u32(((u32(2821) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_99366a0e84272a0220f9ce3f() {
  return __cxx_static_address_99366a0e84272a0220f9ce3f.reference || (__cxx_static_address_99366a0e84272a0220f9ce3f.reference = {
    __cReference: true,
    get value() { return SMALLFNTCURSOR____header_global_b2e0b59e5dd2f49e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:696
export const STARTALPHANUM____header_global_24df2a76c4e289e0 = ((u32(((u32(2822) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0327fc77fa9c92e62c8f1922() {
  return __cxx_static_address_0327fc77fa9c92e62c8f1922.reference || (__cxx_static_address_0327fc77fa9c92e62c8f1922.reference = {
    __cReference: true,
    get value() { return STARTALPHANUM____header_global_24df2a76c4e289e0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:697
export const ENDALPHANUM____header_global_b359db105de23f00 = ((u32(((u32(2915) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_54456e970eae22dfc8383161() {
  return __cxx_static_address_54456e970eae22dfc8383161.reference || (__cxx_static_address_54456e970eae22dfc8383161.reference = {
    __cReference: true,
    get value() { return ENDALPHANUM____header_global_b359db105de23f00; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:698
export const BIGALPHANUM____header_global_d0b934cdaac0716d = ((u32(((u32(2940) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_36a10491e90d3ec3edd9972c() {
  return __cxx_static_address_36a10491e90d3ec3edd9972c.reference || (__cxx_static_address_36a10491e90d3ec3edd9972c.reference = {
    __cReference: true,
    get value() { return BIGALPHANUM____header_global_d0b934cdaac0716d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:699
export const BIGPERIOD____header_global_347e262b10885e8c = ((u32(((u32(3002) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2262545851140c462de04e78() {
  return __cxx_static_address_2262545851140c462de04e78.reference || (__cxx_static_address_2262545851140c462de04e78.reference = {
    __cReference: true,
    get value() { return BIGPERIOD____header_global_347e262b10885e8c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:700
export const BIGCOMMA____header_global_8c91b5095f7aabb6 = ((u32(((u32(3003) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d129c3779146b0a1074aceea() {
  return __cxx_static_address_d129c3779146b0a1074aceea.reference || (__cxx_static_address_d129c3779146b0a1074aceea.reference = {
    __cReference: true,
    get value() { return BIGCOMMA____header_global_8c91b5095f7aabb6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:701
export const BIGX____header_global_f6c971fe57ee43c1 = ((u32(((u32(3004) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ee458b67c2af276bead00aa8() {
  return __cxx_static_address_ee458b67c2af276bead00aa8.reference || (__cxx_static_address_ee458b67c2af276bead00aa8.reference = {
    __cReference: true,
    get value() { return BIGX____header_global_f6c971fe57ee43c1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:702
export const BIGQ____header_global_7d085ecc9cccb972 = ((u32(((u32(3005) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_77a67f6b6deed893dec367cd() {
  return __cxx_static_address_77a67f6b6deed893dec367cd.reference || (__cxx_static_address_77a67f6b6deed893dec367cd.reference = {
    __cReference: true,
    get value() { return BIGQ____header_global_7d085ecc9cccb972; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:703
export const BIGSEMI____header_global_ab2a5e993ccf2fb4 = ((u32(((u32(3006) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5f28ad39745937f13fb7c6ea() {
  return __cxx_static_address_5f28ad39745937f13fb7c6ea.reference || (__cxx_static_address_5f28ad39745937f13fb7c6ea.reference = {
    __cReference: true,
    get value() { return BIGSEMI____header_global_ab2a5e993ccf2fb4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:704
export const BIGCOLIN____header_global_4bba00460ecfd8b7 = ((u32(((u32(3007) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eb3457847f3395e02a6d7950() {
  return __cxx_static_address_eb3457847f3395e02a6d7950.reference || (__cxx_static_address_eb3457847f3395e02a6d7950.reference = {
    __cReference: true,
    get value() { return BIGCOLIN____header_global_4bba00460ecfd8b7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:705
export const THREEBYFIVE____header_global_a089aac4914cd448 = ((u32(((u32(3010) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d41d463b66cd25ba6e500a69() {
  return __cxx_static_address_d41d463b66cd25ba6e500a69.reference || (__cxx_static_address_d41d463b66cd25ba6e500a69.reference = {
    __cReference: true,
    get value() { return THREEBYFIVE____header_global_a089aac4914cd448; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:706
export const BIGAPPOS____header_global_86597859a6d4a097 = ((u32(((u32(3022) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e08f74ce514e3521100f1056() {
  return __cxx_static_address_e08f74ce514e3521100f1056.reference || (__cxx_static_address_e08f74ce514e3521100f1056.reference = {
    __cReference: true,
    get value() { return BIGAPPOS____header_global_86597859a6d4a097; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:707
export const MINIFONT____header_global_58527bbeb966719c = ((u32(((u32(3072) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bfb2a0d67eb6f5502d400080() {
  return __cxx_static_address_bfb2a0d67eb6f5502d400080.reference || (__cxx_static_address_bfb2a0d67eb6f5502d400080.reference = {
    __cReference: true,
    get value() { return MINIFONT____header_global_58527bbeb966719c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:708
export const RESPAWNMARKERRED____header_global_490a9fd736dd3c28 = ((u32(((u32(3190) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_796983704282e83d05bb6012() {
  return __cxx_static_address_796983704282e83d05bb6012.reference || (__cxx_static_address_796983704282e83d05bb6012.reference = {
    __cReference: true,
    get value() { return RESPAWNMARKERRED____header_global_490a9fd736dd3c28; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:709
export const RESPAWNMARKERYELLOW____header_global_083e160783739b28 = ((u32(((u32(3200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ae1ee0f07393aa12aac50e50() {
  return __cxx_static_address_ae1ee0f07393aa12aac50e50.reference || (__cxx_static_address_ae1ee0f07393aa12aac50e50.reference = {
    __cReference: true,
    get value() { return RESPAWNMARKERYELLOW____header_global_083e160783739b28; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:710
export const RESPAWNMARKERGREEN____header_global_db533cc210bb54f9 = ((u32(((u32(3210) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d8bd4ba5bf511675ffa74547() {
  return __cxx_static_address_d8bd4ba5bf511675ffa74547.reference || (__cxx_static_address_d8bd4ba5bf511675ffa74547.reference = {
    __cReference: true,
    get value() { return RESPAWNMARKERGREEN____header_global_db533cc210bb54f9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:711
export const BONUSSCREEN____header_global_fed248cfee74fd4b = ((u32(((u32(3240) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e9ccec2faba48ecb65f60864() {
  return __cxx_static_address_e9ccec2faba48ecb65f60864.reference || (__cxx_static_address_e9ccec2faba48ecb65f60864.reference = {
    __cReference: true,
    get value() { return BONUSSCREEN____header_global_fed248cfee74fd4b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:712
export const VIEWBORDER____header_global_7a3fb981639ef897 = ((u32(((u32(3250) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_16d8761308645547a01523ac() {
  return __cxx_static_address_16d8761308645547a01523ac.reference || (__cxx_static_address_16d8761308645547a01523ac.reference = {
    __cReference: true,
    get value() { return VIEWBORDER____header_global_7a3fb981639ef897; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:713
export const VICTORY1____header_global_8f1b096f9e1e4825 = ((u32(((u32(3260) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d9108ee53d505796b828dfd0() {
  return __cxx_static_address_d9108ee53d505796b828dfd0.reference || (__cxx_static_address_d9108ee53d505796b828dfd0.reference = {
    __cReference: true,
    get value() { return VICTORY1____header_global_8f1b096f9e1e4825; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:714
export const ORDERING____header_global_533ac68fc1734f01 = ((u32(((u32(3270) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a9fa06b51fe8527cbbe15059() {
  return __cxx_static_address_a9fa06b51fe8527cbbe15059.reference || (__cxx_static_address_a9fa06b51fe8527cbbe15059.reference = {
    __cReference: true,
    get value() { return ORDERING____header_global_533ac68fc1734f01; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:715
export const TEXTSTORY____header_global_261b87a8ff98b976 = ((u32(((u32(3280) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b42252117908b5c2a4c5362a() {
  return __cxx_static_address_b42252117908b5c2a4c5362a.reference || (__cxx_static_address_b42252117908b5c2a4c5362a.reference = {
    __cReference: true,
    get value() { return TEXTSTORY____header_global_261b87a8ff98b976; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:716
export const LOADSCREEN____header_global_34270ec30d6fbff7 = ((u32(((u32(3281) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2393d2eb9cb06b64a898122b() {
  return __cxx_static_address_2393d2eb9cb06b64a898122b.reference || (__cxx_static_address_2393d2eb9cb06b64a898122b.reference = {
    __cReference: true,
    get value() { return LOADSCREEN____header_global_34270ec30d6fbff7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:717
export const BORNTOBEWILDSCREEN____header_global_f1e50e53674ba05d = ((u32(((u32(3370) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4fd5dce3930a695b6191c2a7() {
  return __cxx_static_address_4fd5dce3930a695b6191c2a7.reference || (__cxx_static_address_4fd5dce3930a695b6191c2a7.reference = {
    __cReference: true,
    get value() { return BORNTOBEWILDSCREEN____header_global_f1e50e53674ba05d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:718
export const BLIMP____header_global_0e86c9835a54bea9 = ((u32(((u32(3400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_24f1d780134842cfcce1b989() {
  return __cxx_static_address_24f1d780134842cfcce1b989.reference || (__cxx_static_address_24f1d780134842cfcce1b989.reference = {
    __cReference: true,
    get value() { return BLIMP____header_global_0e86c9835a54bea9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:719
export const FEM9____header_global_915861c11b1fd089 = ((u32(((u32(3450) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_14230644a2830a71ba8b089a() {
  return __cxx_static_address_14230644a2830a71ba8b089a.reference || (__cxx_static_address_14230644a2830a71ba8b089a.reference = {
    __cReference: true,
    get value() { return FEM9____header_global_915861c11b1fd089; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:720
export const FRAMEEFFECT1_13____header_global_9e0c26d5ce4d3c84 = ((u32(((u32(3999) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bf3056a32eaa02d610448f5c() {
  return __cxx_static_address_bf3056a32eaa02d610448f5c.reference || (__cxx_static_address_bf3056a32eaa02d610448f5c.reference = {
    __cReference: true,
    get value() { return FRAMEEFFECT1_13____header_global_9e0c26d5ce4d3c84; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:721
export const FRAMEEFFECT1____header_global_d789fc10cb31c999 = ((u32(((u32(4095) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a3877ca5cfab0448f238fb2c() {
  return __cxx_static_address_a3877ca5cfab0448f238fb2c.reference || (__cxx_static_address_a3877ca5cfab0448f238fb2c.reference = {
    __cReference: true,
    get value() { return FRAMEEFFECT1____header_global_d789fc10cb31c999; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:722
export const PANNEL3____header_global_c8841d632acd9e48 = ((u32(((u32(4099) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f67609b7011fed3cf3df49db() {
  return __cxx_static_address_f67609b7011fed3cf3df49db.reference || (__cxx_static_address_f67609b7011fed3cf3df49db.reference = {
    __cReference: true,
    get value() { return PANNEL3____header_global_c8841d632acd9e48; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:723
export const SCREENBREAK14____header_global_8bd10fb8435f0d54 = ((u32(((u32(4120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fbe960cf9f695dadebb82ecb() {
  return __cxx_static_address_fbe960cf9f695dadebb82ecb.reference || (__cxx_static_address_fbe960cf9f695dadebb82ecb.reference = {
    __cReference: true,
    get value() { return SCREENBREAK14____header_global_8bd10fb8435f0d54; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:724
export const SCREENBREAK15____header_global_60b29b3fe7c0ed3f = ((u32(((u32(4123) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_06d19e4723ce77778e74629a() {
  return __cxx_static_address_06d19e4723ce77778e74629a.reference || (__cxx_static_address_06d19e4723ce77778e74629a.reference = {
    __cReference: true,
    get value() { return SCREENBREAK15____header_global_60b29b3fe7c0ed3f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:725
export const SCREENBREAK19____header_global_d2af5f67e552ffb7 = ((u32(((u32(4125) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cbcb48611fde4710e4d2690a() {
  return __cxx_static_address_cbcb48611fde4710e4d2690a.reference || (__cxx_static_address_cbcb48611fde4710e4d2690a.reference = {
    __cReference: true,
    get value() { return SCREENBREAK19____header_global_d2af5f67e552ffb7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:726
export const SCREENBREAK16____header_global_d4e5e4677da4c2fd = ((u32(((u32(4127) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2a15c175c75e926a1b9da722() {
  return __cxx_static_address_2a15c175c75e926a1b9da722.reference || (__cxx_static_address_2a15c175c75e926a1b9da722.reference = {
    __cReference: true,
    get value() { return SCREENBREAK16____header_global_d4e5e4677da4c2fd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:727
export const SCREENBREAK17____header_global_3ea53e4502f818df = ((u32(((u32(4128) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5032a3ec6c125d8e46759d5b() {
  return __cxx_static_address_5032a3ec6c125d8e46759d5b.reference || (__cxx_static_address_5032a3ec6c125d8e46759d5b.reference = {
    __cReference: true,
    get value() { return SCREENBREAK17____header_global_3ea53e4502f818df; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:728
export const SCREENBREAK18____header_global_1d111f1f8534ace4 = ((u32(((u32(4129) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2a60d2f50e84052ea3fbd640() {
  return __cxx_static_address_2a60d2f50e84052ea3fbd640.reference || (__cxx_static_address_2a60d2f50e84052ea3fbd640.reference = {
    __cReference: true,
    get value() { return SCREENBREAK18____header_global_1d111f1f8534ace4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:729
export const W_TECHWALL11____header_global_d318e4ac1460965b = ((u32(((u32(4130) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1e065cf567b6057d82c6976d() {
  return __cxx_static_address_1e065cf567b6057d82c6976d.reference || (__cxx_static_address_1e065cf567b6057d82c6976d.reference = {
    __cReference: true,
    get value() { return W_TECHWALL11____header_global_d318e4ac1460965b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:730
export const W_TECHWALL12____header_global_836860e331c5b3ad = ((u32(((u32(4131) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b5dbaf19be27459caa5c04b0() {
  return __cxx_static_address_b5dbaf19be27459caa5c04b0.reference || (__cxx_static_address_b5dbaf19be27459caa5c04b0.reference = {
    __cReference: true,
    get value() { return W_TECHWALL12____header_global_836860e331c5b3ad; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:731
export const W_TECHWALL13____header_global_192b5cc84531e460 = ((u32(((u32(4132) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_28e50b5e4fedfe63198d66c5() {
  return __cxx_static_address_28e50b5e4fedfe63198d66c5.reference || (__cxx_static_address_28e50b5e4fedfe63198d66c5.reference = {
    __cReference: true,
    get value() { return W_TECHWALL13____header_global_192b5cc84531e460; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:732
export const W_TECHWALL14____header_global_2021eb07e282ada2 = ((u32(((u32(4133) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a967626d913ee12ca2b0e180() {
  return __cxx_static_address_a967626d913ee12ca2b0e180.reference || (__cxx_static_address_a967626d913ee12ca2b0e180.reference = {
    __cReference: true,
    get value() { return W_TECHWALL14____header_global_2021eb07e282ada2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:733
export const W_TECHWALL5____header_global_72c6bae0670c94b8 = ((u32(((u32(4134) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_904a7a5ea967deaceb42d3bf() {
  return __cxx_static_address_904a7a5ea967deaceb42d3bf.reference || (__cxx_static_address_904a7a5ea967deaceb42d3bf.reference = {
    __cReference: true,
    get value() { return W_TECHWALL5____header_global_72c6bae0670c94b8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:734
export const W_TECHWALL6____header_global_693b730d081ac0d9 = ((u32(((u32(4136) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_13872b06f0f7af57154fd099() {
  return __cxx_static_address_13872b06f0f7af57154fd099.reference || (__cxx_static_address_13872b06f0f7af57154fd099.reference = {
    __cReference: true,
    get value() { return W_TECHWALL6____header_global_693b730d081ac0d9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:735
export const W_TECHWALL7____header_global_7908b53c0ee1aed8 = ((u32(((u32(4138) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_07dde69a83efee5d2ea6a7fd() {
  return __cxx_static_address_07dde69a83efee5d2ea6a7fd.reference || (__cxx_static_address_07dde69a83efee5d2ea6a7fd.reference = {
    __cReference: true,
    get value() { return W_TECHWALL7____header_global_7908b53c0ee1aed8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:736
export const W_TECHWALL8____header_global_4aabfef6ff92f27c = ((u32(((u32(4140) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c7103e956e1336613bc7d673() {
  return __cxx_static_address_c7103e956e1336613bc7d673.reference || (__cxx_static_address_c7103e956e1336613bc7d673.reference = {
    __cReference: true,
    get value() { return W_TECHWALL8____header_global_4aabfef6ff92f27c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:737
export const W_TECHWALL9____header_global_30a69261d3a5a677 = ((u32(((u32(4142) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_92c5303feed2842669e7e54c() {
  return __cxx_static_address_92c5303feed2842669e7e54c.reference || (__cxx_static_address_92c5303feed2842669e7e54c.reference = {
    __cReference: true,
    get value() { return W_TECHWALL9____header_global_30a69261d3a5a677; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:738
export const BPANNEL3____header_global_d5ef1b9aa5722157 = ((u32(((u32(4100) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3192d7b529b3b8c2de99aa4c() {
  return __cxx_static_address_3192d7b529b3b8c2de99aa4c.reference || (__cxx_static_address_3192d7b529b3b8c2de99aa4c.reference = {
    __cReference: true,
    get value() { return BPANNEL3____header_global_d5ef1b9aa5722157; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:739
export const W_HITTECHWALL16____header_global_9656658b7200ec22 = ((u32(((u32(4144) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8c9becefc606618f3d9c6e3a() {
  return __cxx_static_address_8c9becefc606618f3d9c6e3a.reference || (__cxx_static_address_8c9becefc606618f3d9c6e3a.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL16____header_global_9656658b7200ec22; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:740
export const W_HITTECHWALL10____header_global_cb66c06fc6569cca = ((u32(((u32(4145) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c949c25e77da2cce574841f8() {
  return __cxx_static_address_c949c25e77da2cce574841f8.reference || (__cxx_static_address_c949c25e77da2cce574841f8.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL10____header_global_cb66c06fc6569cca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:741
export const W_HITTECHWALL15____header_global_e251d5aabfcca904 = ((u32(((u32(4147) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bc3abf659b40b5a07097b002() {
  return __cxx_static_address_bc3abf659b40b5a07097b002.reference || (__cxx_static_address_bc3abf659b40b5a07097b002.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL15____header_global_e251d5aabfcca904; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:742
export const W_MILKSHELF____header_global_0c602beb8f135592 = ((u32(((u32(4181) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3c86ad3a2ff7012d89789c6b() {
  return __cxx_static_address_3c86ad3a2ff7012d89789c6b.reference || (__cxx_static_address_3c86ad3a2ff7012d89789c6b.reference = {
    __cReference: true,
    get value() { return W_MILKSHELF____header_global_0c602beb8f135592; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:743
export const W_MILKSHELFBROKE____header_global_8707ff0f1ea36923 = ((u32(((u32(4203) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f48072d5d751fd264ed9b002() {
  return __cxx_static_address_f48072d5d751fd264ed9b002.reference || (__cxx_static_address_f48072d5d751fd264ed9b002.reference = {
    __cReference: true,
    get value() { return W_MILKSHELFBROKE____header_global_8707ff0f1ea36923; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:744
export const PURPLELAVA____header_global_2c71a187ec4dc730 = ((u32(((u32(4240) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_970a69c05c724945a2e07d42() {
  return __cxx_static_address_970a69c05c724945a2e07d42.reference || (__cxx_static_address_970a69c05c724945a2e07d42.reference = {
    __cReference: true,
    get value() { return PURPLELAVA____header_global_2c71a187ec4dc730; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:745
export const TARGET____header_global_8703907693273f57 = ((u32(((u32(4359) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ed80a9717ee8b442fb845899() {
  return __cxx_static_address_ed80a9717ee8b442fb845899.reference || (__cxx_static_address_ed80a9717ee8b442fb845899.reference = {
    __cReference: true,
    get value() { return TARGET____header_global_8703907693273f57; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:746
export const DUCK____header_global_b36f2cf633a155e1 = ((u32(((u32(4361) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0c7b3b71e2391dd3c6daf382() {
  return __cxx_static_address_0c7b3b71e2391dd3c6daf382.reference || (__cxx_static_address_0c7b3b71e2391dd3c6daf382.reference = {
    __cReference: true,
    get value() { return DUCK____header_global_b36f2cf633a155e1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:747
export const PUKE____header_global_4d9b09447d312cba = ((u32(((u32(4389) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0fae4158ffd6df83a31b25ae() {
  return __cxx_static_address_0fae4158ffd6df83a31b25ae.reference || (__cxx_static_address_0fae4158ffd6df83a31b25ae.reference = {
    __cReference: true,
    get value() { return PUKE____header_global_4d9b09447d312cba; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:748
export const DOORTILE23____header_global_564e68f68f2adf64 = ((u32(((u32(4391) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1dd4ff2cec213e181726a022() {
  return __cxx_static_address_1dd4ff2cec213e181726a022.reference || (__cxx_static_address_1dd4ff2cec213e181726a022.reference = {
    __cReference: true,
    get value() { return DOORTILE23____header_global_564e68f68f2adf64; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:749
export const SPEAKER____header_global_db0db828b19c527a = ((u32(((u32(4397) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1581e94a235d4a8188d928d5() {
  return __cxx_static_address_1581e94a235d4a8188d928d5.reference || (__cxx_static_address_1581e94a235d4a8188d928d5.reference = {
    __cReference: true,
    get value() { return SPEAKER____header_global_db0db828b19c527a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:750
export const MAIL____header_global_93b9b9e59fe81dee = ((u32(((u32(4410) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9e7366bdac332400872acbf4() {
  return __cxx_static_address_9e7366bdac332400872acbf4.reference || (__cxx_static_address_9e7366bdac332400872acbf4.reference = {
    __cReference: true,
    get value() { return MAIL____header_global_93b9b9e59fe81dee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:751
export const HOTMEAT____header_global_7902451079253dd8 = ((u32(((u32(4427) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b0cb5090ec5ab09927230b1d() {
  return __cxx_static_address_b0cb5090ec5ab09927230b1d.reference || (__cxx_static_address_b0cb5090ec5ab09927230b1d.reference = {
    __cReference: true,
    get value() { return HOTMEAT____header_global_7902451079253dd8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:752
export const TRIPODCAMERA____header_global_343348b9fce3b453 = ((u32(((u32(4444) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_221a077e16543de65590d9a8() {
  return __cxx_static_address_221a077e16543de65590d9a8.reference || (__cxx_static_address_221a077e16543de65590d9a8.reference = {
    __cReference: true,
    get value() { return TRIPODCAMERA____header_global_343348b9fce3b453; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:753
export const PAPER____header_global_ca046f55498f74a2 = ((u32(((u32(4460) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0c72317588b37137e5e4b12a() {
  return __cxx_static_address_0c72317588b37137e5e4b12a.reference || (__cxx_static_address_0c72317588b37137e5e4b12a.reference = {
    __cReference: true,
    get value() { return PAPER____header_global_ca046f55498f74a2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:754
export const GENERICPOLE2____header_global_32ee8ab683797119 = ((u32(((u32(4465) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_700ac266c5d0797f9b06499c() {
  return __cxx_static_address_700ac266c5d0797f9b06499c.reference || (__cxx_static_address_700ac266c5d0797f9b06499c.reference = {
    __cReference: true,
    get value() { return GENERICPOLE2____header_global_32ee8ab683797119; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:755
export const XXXSTACY____header_global_0f7fa9b5b241fc36 = ((u32(((u32(4470) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_de13cb64de63bb333ead4465() {
  return __cxx_static_address_de13cb64de63bb333ead4465.reference || (__cxx_static_address_de13cb64de63bb333ead4465.reference = {
    __cReference: true,
    get value() { return XXXSTACY____header_global_0f7fa9b5b241fc36; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:756
export const LETTER____header_global_e446da0a4fa7f0cd = ((u32(((u32(4502) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_771b124035e4ef3dfbcf26fe() {
  return __cxx_static_address_771b124035e4ef3dfbcf26fe.reference || (__cxx_static_address_771b124035e4ef3dfbcf26fe.reference = {
    __cReference: true,
    get value() { return LETTER____header_global_e446da0a4fa7f0cd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:757
export const SIDEBOLT1____header_global_8c68a1da1d82de09 = ((u32(((u32(4525) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_07a8e1255a7e3894689527a9() {
  return __cxx_static_address_07a8e1255a7e3894689527a9.reference || (__cxx_static_address_07a8e1255a7e3894689527a9.reference = {
    __cReference: true,
    get value() { return SIDEBOLT1____header_global_8c68a1da1d82de09; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:758
export const FOODOBJECT16____header_global_57cd1852a61dbb09 = ((u32(((u32(4545) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e13cbee9f7161075167e50a8() {
  return __cxx_static_address_e13cbee9f7161075167e50a8.reference || (__cxx_static_address_e13cbee9f7161075167e50a8.reference = {
    __cReference: true,
    get value() { return FOODOBJECT16____header_global_57cd1852a61dbb09; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:759
export const TAMPON____header_global_46aaebcb7751b909 = ((u32(((u32(4557) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_76d91c4a49a718137220efdf() {
  return __cxx_static_address_76d91c4a49a718137220efdf.reference || (__cxx_static_address_76d91c4a49a718137220efdf.reference = {
    __cReference: true,
    get value() { return TAMPON____header_global_46aaebcb7751b909; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:760
export const CANWITHSOMETHING2____header_global_2e48324e72412cd7 = ((u32(((u32(4580) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_39b73ca53ed3ae268324ee4a() {
  return __cxx_static_address_39b73ca53ed3ae268324ee4a.reference || (__cxx_static_address_39b73ca53ed3ae268324ee4a.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING2____header_global_2e48324e72412cd7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:761
export const CANWITHSOMETHING3____header_global_ad5c0b4e270d5abb = ((u32(((u32(4581) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_acf4fe787143793aa102a270() {
  return __cxx_static_address_acf4fe787143793aa102a270.reference || (__cxx_static_address_acf4fe787143793aa102a270.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING3____header_global_ad5c0b4e270d5abb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:762
export const CANWITHSOMETHING4____header_global_0261d3bb04f55f01 = ((u32(((u32(4582) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b008456d0a0a0ae2b505c495() {
  return __cxx_static_address_b008456d0a0a0ae2b505c495.reference || (__cxx_static_address_b008456d0a0a0ae2b505c495.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING4____header_global_0261d3bb04f55f01; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:763
export const DOLPHIN1____header_global_b3bb3d821d880385 = ((u32(((u32(4591) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_79a28055cd391b37d6a5e5aa() {
  return __cxx_static_address_79a28055cd391b37d6a5e5aa.reference || (__cxx_static_address_79a28055cd391b37d6a5e5aa.reference = {
    __cReference: true,
    get value() { return DOLPHIN1____header_global_b3bb3d821d880385; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:764
export const DOLPHIN2____header_global_b9600a5236c3edf7 = ((u32(((u32(4592) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_774e9fae72466d8c601c8272() {
  return __cxx_static_address_774e9fae72466d8c601c8272.reference || (__cxx_static_address_774e9fae72466d8c601c8272.reference = {
    __cReference: true,
    get value() { return DOLPHIN2____header_global_b9600a5236c3edf7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:765
export const NEWBEAST____header_global_c2bd800ffeee0918 = ((u32(((u32(4610) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e8330a66545253111befc33c() {
  return __cxx_static_address_e8330a66545253111befc33c.reference || (__cxx_static_address_e8330a66545253111befc33c.reference = {
    __cReference: true,
    get value() { return NEWBEAST____header_global_c2bd800ffeee0918; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:766
export const NEWBEASTSTAYPUT____header_global_6b943865a5a8a7c4 = ((u32(((u32(4611) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5a44235061ab80a32c8f6d58() {
  return __cxx_static_address_5a44235061ab80a32c8f6d58.reference || (__cxx_static_address_5a44235061ab80a32c8f6d58.reference = {
    __cReference: true,
    get value() { return NEWBEASTSTAYPUT____header_global_6b943865a5a8a7c4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:767
export const BOSS4____header_global_16715b9e5a207c63 = ((u32(((u32(4740) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fd52fa0f771c47bf13a0c682() {
  return __cxx_static_address_fd52fa0f771c47bf13a0c682.reference || (__cxx_static_address_fd52fa0f771c47bf13a0c682.reference = {
    __cReference: true,
    get value() { return BOSS4____header_global_16715b9e5a207c63; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:768
export const BOSS4STAYPUT____header_global_84b3de2d67315849 = ((u32(((u32(4741) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ffdf8e957a860526581dc29f() {
  return __cxx_static_address_ffdf8e957a860526581dc29f.reference || (__cxx_static_address_ffdf8e957a860526581dc29f.reference = {
    __cReference: true,
    get value() { return BOSS4STAYPUT____header_global_84b3de2d67315849; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:769
export const FEM10____header_global_289fcd2bd3192e2e = ((u32(((u32(4864) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3bf36a6e09305b732e83f4af() {
  return __cxx_static_address_3bf36a6e09305b732e83f4af.reference || (__cxx_static_address_3bf36a6e09305b732e83f4af.reference = {
    __cReference: true,
    get value() { return FEM10____header_global_289fcd2bd3192e2e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:770
export const TOUGHGAL____header_global_1423fbe4fbe52233 = ((u32(((u32(4866) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_06a2d2d650d18b045cd5af53() {
  return __cxx_static_address_06a2d2d650d18b045cd5af53.reference || (__cxx_static_address_06a2d2d650d18b045cd5af53.reference = {
    __cReference: true,
    get value() { return TOUGHGAL____header_global_1423fbe4fbe52233; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:771
export const MAN____header_global_27881cf5f1ab10ec = ((u32(((u32(4871) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_98ab263004c0a4f79fdf2e2a() {
  return __cxx_static_address_98ab263004c0a4f79fdf2e2a.reference || (__cxx_static_address_98ab263004c0a4f79fdf2e2a.reference = {
    __cReference: true,
    get value() { return MAN____header_global_27881cf5f1ab10ec; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:772
export const MAN2____header_global_e83b593bf8a8a886 = ((u32(((u32(4872) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_38862492c21827a30ed2a83a() {
  return __cxx_static_address_38862492c21827a30ed2a83a.reference || (__cxx_static_address_38862492c21827a30ed2a83a.reference = {
    __cReference: true,
    get value() { return MAN2____header_global_e83b593bf8a8a886; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:773
export const WOMAN____header_global_b267fb7fe56ec9de = ((u32(((u32(4874) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a1a83614a8e77b052e698314() {
  return __cxx_static_address_a1a83614a8e77b052e698314.reference || (__cxx_static_address_a1a83614a8e77b052e698314.reference = {
    __cReference: true,
    get value() { return WOMAN____header_global_b267fb7fe56ec9de; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:774
export const NATURALLIGHTNING____header_global_1532ed96d5f1b193 = ((u32(((u32(4890) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_39f8868012c2983e5d8e8208() {
  return __cxx_static_address_39f8868012c2983e5d8e8208.reference || (__cxx_static_address_39f8868012c2983e5d8e8208.reference = {
    __cReference: true,
    get value() { return NATURALLIGHTNING____header_global_1532ed96d5f1b193; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:775
export const WEATHERWARN____header_global_41e440af7476ccb8 = ((u32(((u32(4893) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d97438565e9039f59a20e1c2() {
  return __cxx_static_address_d97438565e9039f59a20e1c2.reference || (__cxx_static_address_d97438565e9039f59a20e1c2.reference = {
    __cReference: true,
    get value() { return WEATHERWARN____header_global_41e440af7476ccb8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:776
export const DUKETAG____header_global_dc663722a54bb370 = ((u32(((u32(4900) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0f82441a823a5f32d2637118() {
  return __cxx_static_address_0f82441a823a5f32d2637118.reference || (__cxx_static_address_0f82441a823a5f32d2637118.reference = {
    __cReference: true,
    get value() { return DUKETAG____header_global_dc663722a54bb370; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:777
export const SIGN1____header_global_864f888a132090a0 = ((u32(((u32(4909) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_994fd17c244c7f4b775b7556() {
  return __cxx_static_address_994fd17c244c7f4b775b7556.reference || (__cxx_static_address_994fd17c244c7f4b775b7556.reference = {
    __cReference: true,
    get value() { return SIGN1____header_global_864f888a132090a0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:778
export const SIGN2____header_global_6d485a3a079cf58f = ((u32(((u32(4912) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_99928c14c4c1baa8cfca5675() {
  return __cxx_static_address_99928c14c4c1baa8cfca5675.reference || (__cxx_static_address_99928c14c4c1baa8cfca5675.reference = {
    __cReference: true,
    get value() { return SIGN2____header_global_6d485a3a079cf58f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:779
export const JURYGUY____header_global_0c52284dcbd43e50 = ((u32(((u32(4943) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7e3fdc215485550dd6728ffc() {
  return __cxx_static_address_7e3fdc215485550dd6728ffc.reference || (__cxx_static_address_7e3fdc215485550dd6728ffc.reference = {
    __cReference: true,
    get value() { return JURYGUY____header_global_0c52284dcbd43e50; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:780
export const WIDESCREENSTATUSBAR____header_global_602b55182d26fff4 = ((u32(((u32(5120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ac0b182e41445e1590680757() {
  return __cxx_static_address_ac0b182e41445e1590680757.reference || (__cxx_static_address_ac0b182e41445e1590680757.reference = {
    __cReference: true,
    get value() { return WIDESCREENSTATUSBAR____header_global_602b55182d26fff4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:781
export const RPGGUNWIDE____header_global_a884e2bc0e1968fe = ((u32(((u32(5121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4f6d8e5f4dc52311f6adbb8c() {
  return __cxx_static_address_4f6d8e5f4dc52311f6adbb8c.reference || (__cxx_static_address_4f6d8e5f4dc52311f6adbb8c.reference = {
    __cReference: true,
    get value() { return RPGGUNWIDE____header_global_a884e2bc0e1968fe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:782
export const FIRSTGUNRELOADWIDE____header_global_45d63591caf07428 = ((u32(((u32(5122) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ca5f6f5eacf1453ffc3d75f9() {
  return __cxx_static_address_ca5f6f5eacf1453ffc3d75f9.reference || (__cxx_static_address_ca5f6f5eacf1453ffc3d75f9.reference = {
    __cReference: true,
    get value() { return FIRSTGUNRELOADWIDE____header_global_45d63591caf07428; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:783
export const FREEZEWIDE____header_global_f57abeb00146f44a = ((u32(((u32(5123) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fe0bcee99cc419bbdf294116() {
  return __cxx_static_address_fe0bcee99cc419bbdf294116.reference || (__cxx_static_address_fe0bcee99cc419bbdf294116.reference = {
    __cReference: true,
    get value() { return FREEZEWIDE____header_global_f57abeb00146f44a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:784
export const FREEZEFIREWIDE____header_global_16c7b72070ec4e0f = ((u32(((u32(5124) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a61567bf81da7b060eb5a56c() {
  return __cxx_static_address_a61567bf81da7b060eb5a56c.reference || (__cxx_static_address_a61567bf81da7b060eb5a56c.reference = {
    __cReference: true,
    get value() { return FREEZEFIREWIDE____header_global_16c7b72070ec4e0f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:785
export const SHRINKERWIDE____header_global_446b47da0f6644bd = ((u32(((u32(5127) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4fa4589e8051f33f938f3d00() {
  return __cxx_static_address_4fa4589e8051f33f938f3d00.reference || (__cxx_static_address_4fa4589e8051f33f938f3d00.reference = {
    __cReference: true,
    get value() { return SHRINKERWIDE____header_global_446b47da0f6644bd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:786
export const CRACKKNUCKLESWIDE____header_global_3ddbcb2b15a11f17 = ((u32(((u32(5129) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ea118b88ff9dbf28e56642fa() {
  return __cxx_static_address_ea118b88ff9dbf28e56642fa.reference || (__cxx_static_address_ea118b88ff9dbf28e56642fa.reference = {
    __cReference: true,
    get value() { return CRACKKNUCKLESWIDE____header_global_3ddbcb2b15a11f17; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:787
export const FLAMETHROWERSPRITE____header_global_4cef9392995e7386 = ((u32(((u32(5134) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b398cd4ae12ca4d9cd956927() {
  return __cxx_static_address_b398cd4ae12ca4d9cd956927.reference || (__cxx_static_address_b398cd4ae12ca4d9cd956927.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERSPRITE____header_global_4cef9392995e7386; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:788
export const FLAMETHROWERAMMO____header_global_4a1cb6cd4c481df5 = ((u32(((u32(5135) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3062fc14857f7618bcd69b31() {
  return __cxx_static_address_3062fc14857f7618bcd69b31.reference || (__cxx_static_address_3062fc14857f7618bcd69b31.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERAMMO____header_global_4a1cb6cd4c481df5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:789
export const FLAMETHROWER____header_global_ba1b16fa40396dfc = ((u32(((u32(5138) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d59b7865f525857c2476bcd3() {
  return __cxx_static_address_d59b7865f525857c2476bcd3.reference || (__cxx_static_address_d59b7865f525857c2476bcd3.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER____header_global_ba1b16fa40396dfc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:790
export const FLAMETHROWERFIRE____header_global_20639c4744b1b67e = ((u32(((u32(5139) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_166e1265e2e021ae519446ee() {
  return __cxx_static_address_166e1265e2e021ae519446ee.reference || (__cxx_static_address_166e1265e2e021ae519446ee.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERFIRE____header_global_20639c4744b1b67e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:791
export const FLAMETHROWERFLAME____header_global_3f5cab0643df9e2a = ((u32(((u32(1891) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f2e89a677f78793dbf89458d() {
  return __cxx_static_address_f2e89a677f78793dbf89458d.reference || (__cxx_static_address_f2e89a677f78793dbf89458d.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERFLAME____header_global_3f5cab0643df9e2a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:792
export const FLAMETHROWERPILOT____header_global_afd6c44276bb1304 = ((u32(((u32(5174) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_085c08d60f5f51784f2667c9() {
  return __cxx_static_address_085c08d60f5f51784f2667c9.reference || (__cxx_static_address_085c08d60f5f51784f2667c9.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERPILOT____header_global_afd6c44276bb1304; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:793
export const FIREBALL____header_global_2ab9b24c0a8be0fc = ((u32(((u32(5163) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_881b65723a07945b3a30a9fa() {
  return __cxx_static_address_881b65723a07945b3a30a9fa.reference || (__cxx_static_address_881b65723a07945b3a30a9fa.reference = {
    __cReference: true,
    get value() { return FIREBALL____header_global_2ab9b24c0a8be0fc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:794
export const ONFIRE____header_global_66148207c8e89d68 = ((u32(((u32(5152) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2130ac393b16af5769f6cd48() {
  return __cxx_static_address_2130ac393b16af5769f6cd48.reference || (__cxx_static_address_2130ac393b16af5769f6cd48.reference = {
    __cReference: true,
    get value() { return ONFIRE____header_global_66148207c8e89d68; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:795
export const ONFIRESMOKE____header_global_d5f57054f292decb = ((u32(((u32(5143) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bd937f9969035debf23a4ffe() {
  return __cxx_static_address_bd937f9969035debf23a4ffe.reference || (__cxx_static_address_bd937f9969035debf23a4ffe.reference = {
    __cReference: true,
    get value() { return ONFIRESMOKE____header_global_d5f57054f292decb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:796
export const BURNEDCORPSE____header_global_714c54c902e704fa = ((u32(((u32(5173) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6acbe4ea8652e7dea803db1a() {
  return __cxx_static_address_6acbe4ea8652e7dea803db1a.reference || (__cxx_static_address_6acbe4ea8652e7dea803db1a.reference = {
    __cReference: true,
    get value() { return BURNEDCORPSE____header_global_714c54c902e704fa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:797
export const WHISPYSMOKE____header_global_b554d368d65b1b43 = ((u32(((u32(5268) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_85aefc8378182278a009809e() {
  return __cxx_static_address_85aefc8378182278a009809e.reference || (__cxx_static_address_85aefc8378182278a009809e.reference = {
    __cReference: true,
    get value() { return WHISPYSMOKE____header_global_b554d368d65b1b43; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:798
export const FIREFLY____header_global_92e4a477b118d883 = ((u32(((u32(5180) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_86a06212c4ac8739b9bc8020() {
  return __cxx_static_address_86a06212c4ac8739b9bc8020.reference || (__cxx_static_address_86a06212c4ac8739b9bc8020.reference = {
    __cReference: true,
    get value() { return FIREFLY____header_global_92e4a477b118d883; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:799
export const FIREFLYSHRINKEFFECT____header_global_df5bbc8f1b8f70a5 = ((u32(((u32(5360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1b2ab098539231d4b2e02d78() {
  return __cxx_static_address_1b2ab098539231d4b2e02d78.reference || (__cxx_static_address_1b2ab098539231d4b2e02d78.reference = {
    __cReference: true,
    get value() { return FIREFLYSHRINKEFFECT____header_global_df5bbc8f1b8f70a5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:800
export const FIREFLYGROWEFFECT____header_global_88360bcecb433233 = ((u32(((u32(5367) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3bc0f8ab461c4d99618e834a() {
  return __cxx_static_address_3bc0f8ab461c4d99618e834a.reference || (__cxx_static_address_3bc0f8ab461c4d99618e834a.reference = {
    __cReference: true,
    get value() { return FIREFLYGROWEFFECT____header_global_88360bcecb433233; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:801
export const FIREFLYFLYINGEFFECT____header_global_25838d2e80533c6e = ((u32(((u32(5296) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ade1455cf41284bf28a9297e() {
  return __cxx_static_address_ade1455cf41284bf28a9297e.reference || (__cxx_static_address_ade1455cf41284bf28a9297e.reference = {
    __cReference: true,
    get value() { return FIREFLYFLYINGEFFECT____header_global_25838d2e80533c6e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:802
export const BOSS5____header_global_7f3fb9035f7916d0 = ((u32(((u32(5310) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_abf8060e06aac24ac60ddac6() {
  return __cxx_static_address_abf8060e06aac24ac60ddac6.reference || (__cxx_static_address_abf8060e06aac24ac60ddac6.reference = {
    __cReference: true,
    get value() { return BOSS5____header_global_7f3fb9035f7916d0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:803
export const BOSS5STAYPUT____header_global_b7d5fed05d9942f1 = ((u32(((u32(5311) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_643594a85d9e5c4b31f591f9() {
  return __cxx_static_address_643594a85d9e5c4b31f591f9.reference || (__cxx_static_address_643594a85d9e5c4b31f591f9.reference = {
    __cReference: true,
    get value() { return BOSS5STAYPUT____header_global_b7d5fed05d9942f1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:804
export const LAVAPOOL____header_global_cac7e43b126ac563 = ((u32(((u32(5304) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9d8e6f24fdc109c884c5ecb2() {
  return __cxx_static_address_9d8e6f24fdc109c884c5ecb2.reference || (__cxx_static_address_9d8e6f24fdc109c884c5ecb2.reference = {
    __cReference: true,
    get value() { return LAVAPOOL____header_global_cac7e43b126ac563; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:805
export const LAVASPLASH____header_global_e51af7d67de44b95 = ((u32(((u32(5371) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cc5cf8ea63c1ab1a035a14e2() {
  return __cxx_static_address_cc5cf8ea63c1ab1a035a14e2.reference || (__cxx_static_address_cc5cf8ea63c1ab1a035a14e2.reference = {
    __cReference: true,
    get value() { return LAVASPLASH____header_global_e51af7d67de44b95; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:806
export const LAVAPOOLBUBBLE____header_global_aa006c76820b8a3f = ((u32(((u32(5207) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6b843f10ad02a7dbd8b522ad() {
  return __cxx_static_address_6b843f10ad02a7dbd8b522ad.reference || (__cxx_static_address_6b843f10ad02a7dbd8b522ad.reference = {
    __cReference: true,
    get value() { return LAVAPOOLBUBBLE____header_global_aa006c76820b8a3f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:807
export const BOSS2STAYPUT____header_global_9bb272f8c747fe53 = ((u32(((u32(2711) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_844b7f67398f8fbdffbf6dff() {
  return __cxx_static_address_844b7f67398f8fbdffbf6dff.reference || (__cxx_static_address_844b7f67398f8fbdffbf6dff.reference = {
    __cReference: true,
    get value() { return BOSS2STAYPUT____header_global_9bb272f8c747fe53; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:808
export const BOSS3STAYPUT____header_global_8bef80793ca904a7 = ((u32(((u32(2761) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_168448d3526770e5521a165a() {
  return __cxx_static_address_168448d3526770e5521a165a.reference || (__cxx_static_address_168448d3526770e5521a165a.reference = {
    __cReference: true,
    get value() { return BOSS3STAYPUT____header_global_8bef80793ca904a7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:809
export const E32_TILE5736____header_global_d6a2c5ed1fbb7da0 = ((u32(((u32(5736) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5d0424adabede230192d1af6() {
  return __cxx_static_address_5d0424adabede230192d1af6.reference || (__cxx_static_address_5d0424adabede230192d1af6.reference = {
    __cReference: true,
    get value() { return E32_TILE5736____header_global_d6a2c5ed1fbb7da0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:810
export const E32_TILE5737____header_global_7fa2ac742acc4948 = ((u32(((u32(5737) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9c13836defdf012cb4a5f2a5() {
  return __cxx_static_address_9c13836defdf012cb4a5f2a5.reference || (__cxx_static_address_9c13836defdf012cb4a5f2a5.reference = {
    __cReference: true,
    get value() { return E32_TILE5737____header_global_7fa2ac742acc4948; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:811
export const E32_TILE5846____header_global_f1938e096bb4d978 = ((u32(((u32(5846) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_01aa313fec0eb4a63cc311bf() {
  return __cxx_static_address_01aa313fec0eb4a63cc311bf.reference || (__cxx_static_address_01aa313fec0eb4a63cc311bf.reference = {
    __cReference: true,
    get value() { return E32_TILE5846____header_global_f1938e096bb4d978; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/mio.hpp:133
export const invalid_handle__header_global_4fb4c41aa126db6a = i32((-1));
function __cxx_static_address_d81bb12788a39647596b9e42() {
  return __cxx_static_address_d81bb12788a39647596b9e42.reference || (__cxx_static_address_d81bb12788a39647596b9e42.reference = {
    __cReference: true,
    get value() { return invalid_handle__header_global_4fb4c41aa126db6a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/network.h:180
export const cSnapshotMemUsage__header_global_67d5336007f1c1ff = u64((BigInt(u64(64)) * BigInt(u64((BigInt(u64((BigInt(u64((BigInt(72) * BigInt(u64(16384))))) + BigInt(u64((BigInt(96) * BigInt(u64(4096)))))))) + BigInt(u64((BigInt(296) * BigInt(u64(16384))))))))));
function __cxx_static_address_fb565aeac980e2c1bf775360() {
  return __cxx_static_address_fb565aeac980e2c1bf775360.reference || (__cxx_static_address_fb565aeac980e2c1bf775360.reference = {
    __cReference: true,
    get value() { return cSnapshotMemUsage__header_global_67d5336007f1c1ff; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/anim.cpp:43
export let h_dukeanim = cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"prime": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"magic": {"native": "Uint32Array", "offset": 0, "size": 4}, "more": {"native": "Uint8Array", "offset": 4, "size": 1}}, "overlaps": false, "size": 5, "union": false}, "offset": 4}, "v": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "size": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "items": {"offset": 16, "pointer": true, "size": 8}}, "overlaps": true, "size": 24, "union": false}, cStaticInitializerValues({"__cxx_anonymous_0": cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"prime": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"magic": {"native": "Uint32Array", "offset": 0, "size": 4}, "more": {"native": "Uint8Array", "offset": 4, "size": 1}}, "overlaps": false, "size": 5, "union": false}, "offset": 4}, "v": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "size": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": true, "size": 12, "union": true}, cStaticInitializerValues({"size": u32(8)}), null, {}), "items": null}), null, {});
export function __cxx_global_cell_688eef96adecfa82b6b8d71c() {
  return __cxx_global_cell_688eef96adecfa82b6b8d71c.reference || (__cxx_global_cell_688eef96adecfa82b6b8d71c.reference = {
    __cReference: true,
    get value() { return h_dukeanim; },
    set value(__cxx_lvalue_0) { throw new TypeError("record address cannot replace original object storage"); }
  });
}

// C/C++ source: source/build/include/fix16.h:31
export const FIX16_MAX__header_global_d3f5cb67165ec666 = i32(2147483647);
function __cxx_static_address_725c85c9cdf697fded7bc73d() {
  return __cxx_static_address_725c85c9cdf697fded7bc73d.reference || (__cxx_static_address_725c85c9cdf697fded7bc73d.reference = {
    __cReference: true,
    get value() { return FIX16_MAX__header_global_d3f5cb67165ec666; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:32
export const FIX16_MIN__header_global_e796603aeffcc809 = i32(2147483648);
function __cxx_static_address_9c6ac6f17c82a8b2952f8a30() {
  return __cxx_static_address_9c6ac6f17c82a8b2952f8a30.reference || (__cxx_static_address_9c6ac6f17c82a8b2952f8a30.reference = {
    __cReference: true,
    get value() { return FIX16_MIN__header_global_e796603aeffcc809; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:33
export const FIX16_OVERFLOW__header_global_dead6b9158f92d2b = i32(2147483648);
function __cxx_static_address_f4b0637eee22497c6a71f04f() {
  return __cxx_static_address_f4b0637eee22497c6a71f04f.reference || (__cxx_static_address_f4b0637eee22497c6a71f04f.reference = {
    __cReference: true,
    get value() { return FIX16_OVERFLOW__header_global_dead6b9158f92d2b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:35
export const fix16_one__header_global_267247cf967e8c32 = i32(65536);
function __cxx_static_address_21d755bcff8e8b2337d37be6() {
  return __cxx_static_address_21d755bcff8e8b2337d37be6.reference || (__cxx_static_address_21d755bcff8e8b2337d37be6.reference = {
    __cReference: true,
    get value() { return fix16_one__header_global_267247cf967e8c32; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:36
export const fix16_half__header_global_873e9247db9431e5 = i32(32768);
function __cxx_static_address_21d39c1b4624e1637bfaff0a() {
  return __cxx_static_address_21d39c1b4624e1637bfaff0a.reference || (__cxx_static_address_21d39c1b4624e1637bfaff0a.reference = {
    __cReference: true,
    get value() { return fix16_half__header_global_873e9247db9431e5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:37
export const flt_f161r__header_global_7c18b3140ed9fbe2 = Math.fround(Math.fround((Math.fround(1) / Math.fround(65536))));
function __cxx_static_address_78547418617fc179c5b6b957() {
  return __cxx_static_address_78547418617fc179c5b6b957.reference || (__cxx_static_address_78547418617fc179c5b6b957.reference = {
    __cReference: true,
    get value() { return flt_f161r__header_global_7c18b3140ed9fbe2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/anim.cpp:44
export let g_animPtr = null;
export function __cxx_global_cell_6885ffa8a14b3e9418bda559() {
  return __cxx_global_cell_6885ffa8a14b3e9418bda559.reference || (__cxx_global_cell_6885ffa8a14b3e9418bda559.reference = {
    __cReference: true,
    get value() { return g_animPtr; },
    set value(__cxx_lvalue_0) { g_animPtr = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/duke3d/src/anim.cpp:46
const __cxx_literal_167bfbc983ceb47e0ca9 = Uint8Array.from([46, 97, 110, 109, 0]);
const __cxx_literal_b57ce0f5bf51230264d9 = Uint8Array.from([46, 105, 118, 102, 0]);
export function Anim_Find(s) {
  let ptr = i64(hash_findcase(h_dukeanim, s));
  if ((ptr == i64((-1)))) {
    let siz = i32(u64((BigInt(strlen(s)) + BigInt(u64(5)))));
    let str = cTypedPointer(xcalloc__header_02cb5bd6b7f4(u64(1), u64(siz)), Uint8Array);
    maybe_append_ext(str, siz, s, __cxx_literal_167bfbc983ceb47e0ca9);
    (ptr = i64(hash_findcase(h_dukeanim, str)));
    if ((ptr == i64((-1)))) {
      maybe_append_ext(str, siz, s, __cxx_literal_b57ce0f5bf51230264d9);
      (ptr = i64(hash_findcase(h_dukeanim, str)));
    }
    xfree__header_8ea04ebea51b(str);
  }
  return cRecordPointer(((ptr == i64((-1))) ? null : cRecordPointer(cSourceAddresses.decode(ptr), {"align": 8, "arrayAlign": 1, "fields": {"animbuf": {"offset": 16, "pointer": true, "size": 8}, "animlock": {"native": "Uint8Array", "offset": 36, "size": 1}, "frameaspect1": {"native": "Float64Array", "offset": 0, "size": 8}, "frameaspect2": {"native": "Float64Array", "offset": 8, "size": 8}, "framedelay": {"native": "Uint8Array", "offset": 34, "size": 1}, "frameflags": {"native": "Uint8Array", "offset": 35, "size": 1}, "numsounds": {"native": "Uint16Array", "offset": 32, "size": 2}, "sounds": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {})), {"align": 8, "arrayAlign": 1, "fields": {"animbuf": {"offset": 16, "pointer": true, "size": 8}, "animlock": {"native": "Uint8Array", "offset": 36, "size": 1}, "frameaspect1": {"native": "Float64Array", "offset": 0, "size": 8}, "frameaspect2": {"native": "Float64Array", "offset": 8, "size": 8}, "framedelay": {"native": "Uint8Array", "offset": 34, "size": 1}, "frameflags": {"native": "Uint8Array", "offset": 35, "size": 1}, "numsounds": {"native": "Uint16Array", "offset": 32, "size": 2}, "sounds": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {});
}

// C/C++ source: source/duke3d/src/anim.cpp:70
export function Anim_Create(fn) {
  let anim = cRecordPointer(xcalloc__header_02cb5bd6b7f4(u64(1), 40), {"align": 8, "arrayAlign": 1, "fields": {"animbuf": {"offset": 16, "pointer": true, "size": 8}, "animlock": {"native": "Uint8Array", "offset": 36, "size": 1}, "frameaspect1": {"native": "Float64Array", "offset": 0, "size": 8}, "frameaspect2": {"native": "Float64Array", "offset": 8, "size": 8}, "framedelay": {"native": "Uint8Array", "offset": 34, "size": 1}, "frameflags": {"native": "Uint8Array", "offset": 35, "size": 1}, "numsounds": {"native": "Uint16Array", "offset": 32, "size": 2}, "sounds": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {});
  hash_add(h_dukeanim, fn, i64(cSourceAddresses.encode(anim)), 0);
  return anim;
}

// C/C++ source: source/duke3d/src/anim.cpp:81
export const StopAllSounds = i32((-1));
function __cxx_static_address_79d70e22380c6287a214e9c4() {
  return __cxx_static_address_79d70e22380c6287a214e9c4.reference || (__cxx_static_address_79d70e22380c6287a214e9c4.reference = {
    __cReference: true,
    get value() { return StopAllSounds; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/compat.h:1169
export const pow2char__header_global_89abbc5f3520a41c = new Uint8Array([(u32(1) & 255), (u32(2) & 255), (u32(4) & 255), (u32(8) & 255), (u32(16) & 255), (u32(32) & 255), (u32(64) & 255), (u32(128) & 255)]);
function __cxx_static_address_953edb1b4b3cf1e3e3879268() {
  return __cxx_static_address_953edb1b4b3cf1e3e3879268.reference || (__cxx_static_address_953edb1b4b3cf1e3e3879268.reference = {
    __cReference: true,
    get value() { return pow2char__header_global_89abbc5f3520a41c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_953edb1b4b3cf1e3e3879268() { return __cxx_static_address_953edb1b4b3cf1e3e3879268(); }

// C/C++ source: source/build/include/baselayer.h:172
export const g_defaultVideoModes__header_global_52266e5e1349aa81 = cByteRecordNDArray({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, [25], {}, cStaticInitializerValues([cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 2560, "y": 1440}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 2560, "y": 1200}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 2560, "y": 1080}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1920, "y": 1440}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1920, "y": 1200}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1920, "y": 1080}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1680, "y": 1050}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1600, "y": 1200}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1600, "y": 900}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1366, "y": 768}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1280, "y": 1024}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1280, "y": 960}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1280, "y": 720}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1152, "y": 864}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1024, "y": 768}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1024, "y": 600}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 800, "y": 600}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 640, "y": 480}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 640, "y": 400}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 512, "y": 384}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 480, "y": 360}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 400, "y": 300}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 320, "y": 240}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 320, "y": 200}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 0, "y": 0}), null, {})]));
function __cxx_static_address_3e7da206eb4c0391cfe307e0() {
  return __cxx_static_address_3e7da206eb4c0391cfe307e0.reference || (__cxx_static_address_3e7da206eb4c0391cfe307e0.reference = {
    __cReference: true,
    get value() { return g_defaultVideoModes__header_global_52266e5e1349aa81; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:188
export const g_keyAsciiTable__header_global_f9d405641282fb4b = new Uint8Array([(u32(0) & 255), (u32(0) & 255), 49, 50, 51, 52, 53, 54, 55, 56, 57, 48, 45, 61, (u32(0) & 255), (u32(0) & 255), 113, 119, 101, 114, 116, 121, 117, 105, 111, 112, 91, 93, (u32(0) & 255), (u32(0) & 255), 97, 115, 100, 102, 103, 104, 106, 107, 108, 59, (u32(39) & 255), 96, (u32(0) & 255), (u32(92) & 255), 122, 120, 99, 118, 98, 110, 109, 44, 46, 47, (u32(0) & 255), 42, (u32(0) & 255), (u32(32) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), 55, 56, 57, 45, 52, 53, 54, 43, 49, 50, 51, 48, 46, (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255)]);
function __cxx_static_address_f345d214746d92ff3cfceba2() {
  return __cxx_static_address_f345d214746d92ff3cfceba2.reference || (__cxx_static_address_f345d214746d92ff3cfceba2.reference = {
    __cReference: true,
    get value() { return g_keyAsciiTable__header_global_f9d405641282fb4b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_f345d214746d92ff3cfceba2() { return __cxx_static_address_f345d214746d92ff3cfceba2(); }

// C/C++ source: source/build/include/baselayer.h:196
export const g_keyAsciiTableShift__header_global_cb68466d746701f4 = new Uint8Array([(u32(0) & 255), (u32(0) & 255), 33, 64, 35, 36, 37, 94, 38, 42, 40, 41, 95, 43, (u32(0) & 255), (u32(0) & 255), 81, 87, 69, 82, 84, 89, 85, 73, 79, 80, 123, 125, (u32(0) & 255), (u32(0) & 255), 65, 83, 68, 70, 71, 72, 74, 75, 76, 58, 34, 126, (u32(0) & 255), 124, 90, 88, 67, 86, 66, 78, 77, 60, 62, 63, (u32(0) & 255), 42, (u32(0) & 255), (u32(32) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), 55, 56, 57, 45, 52, 53, 54, 43, 49, 50, 51, 48, 46, (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255)]);
function __cxx_static_address_53808a5cd708cbf05d65666c() {
  return __cxx_static_address_53808a5cd708cbf05d65666c.reference || (__cxx_static_address_53808a5cd708cbf05d65666c.reference = {
    __cReference: true,
    get value() { return g_keyAsciiTableShift__header_global_cb68466d746701f4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_53808a5cd708cbf05d65666c() { return __cxx_static_address_53808a5cd708cbf05d65666c(); }

// C/C++ source: source/build/include/build.h:895
export const pow2long__header_global_f99a2b48a1ef4a7a = new Int32Array([1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144, 524288, 1048576, 2097152, 4194304, 8388608, 16777216, 33554432, 67108864, 134217728, 268435456, 536870912, 1073741824, 2147483647]);
function __cxx_static_address_e62da8fb75d55c8ec377e848() {
  return __cxx_static_address_e62da8fb75d55c8ec377e848.reference || (__cxx_static_address_e62da8fb75d55c8ec377e848.reference = {
    __cReference: true,
    get value() { return pow2long__header_global_f99a2b48a1ef4a7a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_e62da8fb75d55c8ec377e848() { return __cxx_static_address_e62da8fb75d55c8ec377e848(); }

// C/C++ source: source/build/include/build.h:907
export const pow2ulong__header_global_1b8fd1294dcbf2c9 = new Uint32Array([u32(1), u32(2), u32(4), u32(8), u32(16), u32(32), u32(64), u32(128), u32(256), u32(512), u32(1024), u32(2048), u32(4096), u32(8192), u32(16384), u32(32768), u32(65536), u32(131072), u32(262144), u32(524288), u32(1048576), u32(2097152), u32(4194304), u32(8388608), u32(16777216), u32(33554432), u32(67108864), u32(134217728), u32(268435456), u32(536870912), u32(1073741824), u32(2147483648n)]);
function __cxx_static_address_813d78ff3d80470e63f15346() {
  return __cxx_static_address_813d78ff3d80470e63f15346.reference || (__cxx_static_address_813d78ff3d80470e63f15346.reference = {
    __cReference: true,
    get value() { return pow2ulong__header_global_1b8fd1294dcbf2c9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_813d78ff3d80470e63f15346() { return __cxx_static_address_813d78ff3d80470e63f15346(); }

// C/C++ source: source/build/include/build.h:919
export const pow264__header_global_98beeb71826e1e4e = new BigInt64Array([BigInt(i64(1)), BigInt(i64(2)), BigInt(i64(4)), BigInt(i64(8)), BigInt(i64(16)), BigInt(i64(32)), BigInt(i64(64)), BigInt(i64(128)), BigInt(i64(256)), BigInt(i64(512)), BigInt(i64(1024)), BigInt(i64(2048)), BigInt(i64(4096)), BigInt(i64(8192)), BigInt(i64(16384)), BigInt(i64(32768)), BigInt(i64(65536)), BigInt(i64(131072)), BigInt(i64(262144)), BigInt(i64(524288)), BigInt(i64(1048576)), BigInt(i64(2097152)), BigInt(i64(4194304)), BigInt(i64(8388608)), BigInt(i64(16777216)), BigInt(i64(33554432)), BigInt(i64(67108864)), BigInt(i64(134217728)), BigInt(i64(268435456)), BigInt(i64(536870912)), BigInt(i64(1073741824)), BigInt(2147483648n), BigInt(4294967296n), BigInt(8589934592n), BigInt(17179869184n), BigInt(34359738368n), BigInt(68719476736n), BigInt(137438953472n), BigInt(274877906944n), BigInt(549755813888n), BigInt(1099511627776n), BigInt(2199023255552n), BigInt(4398046511104n), BigInt(8796093022208n), BigInt(17592186044416n), BigInt(35184372088832n), BigInt(70368744177664n), BigInt(140737488355328n), BigInt(281474976710656n), BigInt(562949953421312n), BigInt(1125899906842624n), BigInt(2251799813685248n), BigInt(4503599627370496n), BigInt(9007199254740992n), BigInt(18014398509481984n), BigInt(36028797018963968n), BigInt(72057594037927936n), BigInt(144115188075855872n), BigInt(288230376151711744n), BigInt(576460752303423488n), BigInt(1152921504606846976n), BigInt(2305843009213693952n), BigInt(4611686018427387904n), BigInt(9223372036854775807n)]);
function __cxx_static_address_6a41d041f825a0efac216a7c() {
  return __cxx_static_address_6a41d041f825a0efac216a7c.reference || (__cxx_static_address_6a41d041f825a0efac216a7c.reference = {
    __cReference: true,
    get value() { return pow264__header_global_98beeb71826e1e4e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_6a41d041f825a0efac216a7c() { return __cxx_static_address_6a41d041f825a0efac216a7c(); }

// C/C++ source: source/mact/include/keyboard.h:47
export const sctokeylut__header_global_aa092ccb9f2c7186 = cByteRecordNDArray({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, [102], {}, cStaticInitializerValues([cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([69, 115, 99, 97, 112, 101, 0]), "sc": (u32(1) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([49, 0]), "sc": (u32(2) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([50, 0]), "sc": (u32(3) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([51, 0]), "sc": (u32(4) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([52, 0]), "sc": (u32(5) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([53, 0]), "sc": (u32(6) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([54, 0]), "sc": (u32(7) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([55, 0]), "sc": (u32(8) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([56, 0]), "sc": (u32(9) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([57, 0]), "sc": (u32(10) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([48, 0]), "sc": (u32(11) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([45, 0]), "sc": (u32(12) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([61, 0]), "sc": (u32(13) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([66, 97, 107, 83, 112, 99, 0]), "sc": (u32(14) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([84, 97, 98, 0]), "sc": (u32(15) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([81, 0]), "sc": (u32(16) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([87, 0]), "sc": (u32(17) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([69, 0]), "sc": (u32(18) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([82, 0]), "sc": (u32(19) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([84, 0]), "sc": (u32(20) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([89, 0]), "sc": (u32(21) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([85, 0]), "sc": (u32(22) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([73, 0]), "sc": (u32(23) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([79, 0]), "sc": (u32(24) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([80, 0]), "sc": (u32(25) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([91, 0]), "sc": (u32(26) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([93, 0]), "sc": (u32(27) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([69, 110, 116, 101, 114, 0]), "sc": (u32(28) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([76, 67, 116, 114, 108, 0]), "sc": (u32(29) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([65, 0]), "sc": (u32(30) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([83, 0]), "sc": (u32(31) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([68, 0]), "sc": (u32(32) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 0]), "sc": (u32(33) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([71, 0]), "sc": (u32(34) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([72, 0]), "sc": (u32(35) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([74, 0]), "sc": (u32(36) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 0]), "sc": (u32(37) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([76, 0]), "sc": (u32(38) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([59, 0]), "sc": (u32(39) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([39, 0]), "sc": (u32(40) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([96, 0]), "sc": (u32(41) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([76, 83, 104, 105, 102, 116, 0]), "sc": (u32(42) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([66, 97, 99, 107, 115, 108, 97, 115, 104, 0]), "sc": (u32(43) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([90, 0]), "sc": (u32(44) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([88, 0]), "sc": (u32(45) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([67, 0]), "sc": (u32(46) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([86, 0]), "sc": (u32(47) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([66, 0]), "sc": (u32(48) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([78, 0]), "sc": (u32(49) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([77, 0]), "sc": (u32(50) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([44, 0]), "sc": (u32(51) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([46, 0]), "sc": (u32(52) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([47, 0]), "sc": (u32(53) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([82, 83, 104, 105, 102, 116, 0]), "sc": (u32(54) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 42, 0]), "sc": (u32(55) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([76, 65, 108, 116, 0]), "sc": (u32(56) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([83, 112, 97, 99, 101, 0]), "sc": (u32(57) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([67, 97, 112, 76, 99, 107, 0]), "sc": (u32(58) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 49, 0]), "sc": (u32(59) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 50, 0]), "sc": (u32(60) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 51, 0]), "sc": (u32(61) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 52, 0]), "sc": (u32(62) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 53, 0]), "sc": (u32(63) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 54, 0]), "sc": (u32(64) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 55, 0]), "sc": (u32(65) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 56, 0]), "sc": (u32(66) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 57, 0]), "sc": (u32(67) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 49, 48, 0]), "sc": (u32(68) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([78, 117, 109, 76, 99, 107, 0]), "sc": (u32(69) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([83, 99, 114, 76, 99, 107, 0]), "sc": (u32(70) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 55, 0]), "sc": (u32(71) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 56, 0]), "sc": (u32(72) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 57, 0]), "sc": (u32(73) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 45, 0]), "sc": (u32(74) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 52, 0]), "sc": (u32(75) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 53, 0]), "sc": (u32(76) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 54, 0]), "sc": (u32(77) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 43, 0]), "sc": (u32(78) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 49, 0]), "sc": (u32(79) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 50, 0]), "sc": (u32(80) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 51, 0]), "sc": (u32(81) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 48, 0]), "sc": (u32(82) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 46, 0]), "sc": (u32(83) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([76, 101, 115, 115, 84, 104, 97, 110, 0]), "sc": (u32(86) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 49, 49, 0]), "sc": (u32(87) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 49, 50, 0]), "sc": (u32(88) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 100, 69, 110, 116, 0]), "sc": (u32(156) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([82, 67, 116, 114, 108, 0]), "sc": (u32(157) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 47, 0]), "sc": (u32(181) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([82, 65, 108, 116, 0]), "sc": (u32(184) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([80, 114, 116, 83, 99, 110, 0]), "sc": (u32(183) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([80, 97, 117, 115, 101, 0]), "sc": (u32(197) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([72, 111, 109, 101, 0]), "sc": (u32(199) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([85, 112, 0]), "sc": (u32(200) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([80, 103, 85, 112, 0]), "sc": (u32(201) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([76, 101, 102, 116, 0]), "sc": (u32(203) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([82, 105, 103, 104, 116, 0]), "sc": (u32(205) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([69, 110, 100, 0]), "sc": (u32(207) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([68, 111, 119, 110, 0]), "sc": (u32(208) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([80, 103, 68, 110, 0]), "sc": (u32(209) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([73, 110, 115, 101, 114, 116, 0]), "sc": (u32(210) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([68, 101, 108, 101, 116, 101, 0]), "sc": (u32(211) & 255)}), null, {})]));
function __cxx_static_address_57dd17bf740f49bd25af99d1() {
  return __cxx_static_address_57dd17bf740f49bd25af99d1.reference || (__cxx_static_address_57dd17bf740f49bd25af99d1.reference = {
    __cReference: true,
    get value() { return sctokeylut__header_global_aa092ccb9f2c7186; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/compat.h:1400
export function xcalloc__header_02cb5bd6b7f4(nmemb, size) {
  let siz = u64((BigInt(nmemb) * BigInt(size)));
  let ptr = Alloc__cxx_static_e0036cfb06bcfe42(__cxx_global_cell_11016d3c7177543e564ab46c().value, siz, u64(16));
  if (cPointerCompare(ptr, null, "!=")) {
    memset(ptr, 0, siz);
    return ptr;
  }
  handle_memerr(i32(size));
  __builtin_unreachable();
}

// C/C++ source: source/build/include/compat.h:1449
export function xfree__header_8ea04ebea51b(ptr) {
  Free__cxx_static_0dfd3f42f0dc2c05(__cxx_global_cell_11016d3c7177543e564ab46c().value, ptr);
}

export function ARRAY_SIZE__header_e7e29b814591(arg0) {
  return u64(2n);
}

export function ARRAY_SIZE__header_4ec6da3a00fd(arg0) {
  return u64(4n);
}

export function ARRAY_SIZE__header_54d30a5d17fc(arg0) {
  return u64(1n);
}

export function ARRAY_SIZE__header_c92f95127ed8(arg0) {
  return u64(7n);
}

export function ARRAY_SIZE__header_182df29bb857(arg0) {
  return u64(9n);
}

// C/C++ source: source/build/include/compat.h:1392
export function xmalloc__header_94feb8bebd3d(size) {
  let ptr = Alloc__cxx_static_e0036cfb06bcfe42(__cxx_global_cell_11016d3c7177543e564ab46c().value, size, u64(16));
  if (cPointerCompare(ptr, null, "!=")) {
    return ptr;
  }
  handle_memerr(i32(size));
  __builtin_unreachable();
}

export function B_PASS32__header_98e7024a6de7(x) {
  return u32(x);
}

export function divscale16__header_834af2b26eea(eax, ebx) {
  return i32(divscale__header_21ff98c8465f(eax, ebx, 16));
}

// C/C++ source: source/build/include/pragmas.h:164
export function divscale__header_21ff98c8465f(eax, ebx, ecx) {
  return i32(tabledivide64__header_9a7ec2419d80(i64((BigInt(i64(eax)) << BigInt(i32((u32((u32(ecx) & 255)) & 255))))), i64(ebx)));
}

// C/C++ source: source/build/include/pragmas.h:111
export function tabledivide64__header_9a7ec2419d80(n, d) {

  if (Boolean(i32((i32((d != __cxx_global_cell_f8287b2e627d0e3f51b90c55().value)) & i32((!(u64(d) < u64(16384)))))))) {
    cAssignAggregate((cPointerElementRef(cRecordPointer(divtable64, {"align": 1, "arrayAlign": 1, "fields": {"magic": {"native": "BigInt64Array", "offset": 0, "size": 8}, "more": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 9, "union": false}, {}), 0).value), libdivide_s64_gen((__cxx_global_cell_f8287b2e627d0e3f51b90c55().value = i64(d))), {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"magic": {"native": "BigInt64Array", "offset": 0, "size": 8}, "more": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 9, "union": false}});
  }
  return i64(libdivide_s64_do(n, cPointerOffset(divtable64, i64((BigInt(i64((u64(d) < u64(16384)))) * BigInt(d))), 9)));
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
