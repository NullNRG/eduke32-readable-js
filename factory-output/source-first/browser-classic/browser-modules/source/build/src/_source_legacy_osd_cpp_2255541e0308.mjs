// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/build/src/osd.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
import { Alloc__cxx_static_e0036cfb06bcfe42 } from "./smmalloc_generic.cpp.mjs";
import { Bstrtolower } from "./compat.cpp.mjs";
import { Free__cxx_static_0dfd3f42f0dc2c05 } from "./smmalloc_generic.cpp.mjs";
import { OSD_GetShadePal } from "./osd.cpp.mjs";
import { OSD_ParsingScript } from "./osd.cpp.mjs";
import { OSD_SetTextMode } from "./osd.cpp.mjs";
import { Realloc__cxx_static_478d5da25b6b3923 } from "./smmalloc_generic.cpp.mjs";
import { SDL_AtomicLock } from "../../../browser-abi/sdl_provider.mjs";
import { SDL_AtomicUnlock } from "../../../browser-abi/sdl_provider.mjs";
import { calloc } from "../../../browser-abi/libc_provider.mjs";
import { curpalette } from "./palette.cpp.mjs";
import { current_verbosity_cutoff } from "./loguru.cpp.mjs";
import { free } from "../../../browser-abi/libc_provider.mjs";
import { __cxx_global_cell_11016d3c7177543e564ab46c } from "./compat.cpp.mjs";
import { handle_memerr } from "./compat.cpp.mjs";
import { hash_add } from "./hash.cpp.mjs";
import { hash_find } from "./hash.cpp.mjs";
import { loguru_log } from "../../../browser-abi/loguru_provider.mjs";
import { memcpy } from "../../../browser-abi/libc_provider.mjs";
import { memset } from "../../../browser-abi/libc_provider.mjs";
import { __cxx_global_cell_5a97be12fac9e104b96ea90d } from "./osd.cpp.mjs";
import { osdcmd_cvar_set } from "./osd.cpp.mjs";
import { palookup } from "./engine.cpp.mjs";
import { printext256 } from "./engine.cpp.mjs";
import { strcasecmp } from "../../../browser-abi/libc_provider.mjs";
import { strcpy } from "../../../browser-abi/libc_provider.mjs";
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
  const byBuffer=new WeakMap(),regions=[],opaque=new WeakMap(),byBits=new Map();
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
      if(byBits.has(bits)){
        const value=byBits.get(bits),allocation=globalThis[Symbol.for('source-first.cpp-heap/1')]?.objects.get(value);
        if(allocation&&!allocation.live)throw new RangeError('C address refers to a destroyed C++ object');
        const item=canonical(value);if(item.buffer)liveBounds(item.buffer,item.offset);
        return value;
      }
      for(const region of regions){
        const offset=bits-region.base;
        if(offset<0n||offset>BigInt(region.buffer.byteLength))continue;
        const at=Number(offset),bounds=liveBounds(region.buffer,at);
        return {__cPointer:true,buffer:region.buffer,offset:at,array:false,...bounds};
      }
      throw new TypeError('Unknown original C pointer address');
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
  if (source?.__cDeferredPointer === true) return cPointer(source.resolve());
  if (source && source.__cPointer === true) {
    if(!source.array)globalThis[Symbol.for('source-lp64-addresses/2')]?.assert(source.buffer,source.offset);
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
  if (source===null) return null;
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
const cPointerOffset = (source, delta, stride=1) => {
  const initial=cPointer(source);
  const p=Array.isArray(source) ? {...initial, upper:source.length*stride, stride} : initial;
  if (p.array && p.stride!==stride) throw new TypeError('Cannot reinterpret JS numeric-array element widths');
  const change=Number(delta)*stride, next=p.offset+change;
  if (!Number.isSafeInteger(change) || !Number.isSafeInteger(next) || next<p.lower || next>p.upper)
    throw new RangeError('C pointer escapes original array bounds');
  if(p.__cPointer===true&&p.__cReference===true){
    if(next===p.offset)return p;
    return {__cPointer:true,buffer:p.buffer,array:p.array,lower:p.lower,upper:p.upper,offset:next,
      ...(p.array?{stride:p.stride}: {})};
  }
  const result={...p,offset:next};
  return result;
};
const cDeref = (source, Type) => {
  if (source && !ArrayBuffer.isView(source) && source.__cPointer !== true &&
      typeof source==='object' && 'value' in source) return source;
  const p=cPointer(source);
  if (p.array) {
    if (p.offset>=p.upper) throw new RangeError('C array pointer dereferences one-past-end');
    if (Type.BYTES_PER_ELEMENT!==p.stride || p.offset%p.stride!==0)
      throw new TypeError('Array element type does not match original pointer stride');
    const index=p.offset/p.stride;
    return {get value(){return p.buffer[index];}, set value(value){p.buffer[index]=value;}};
  }
  const width=Type?.BYTES_PER_ELEMENT;
  if (!Number.isSafeInteger(width) || width<=0 || p.offset+width>p.upper)
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
  const array=new Type([initial]),pointer=cPointer(array),reference=cDeref(pointer,Type);
  return {...pointer,__cReference:true,
    get value(){return reference.value;},set value(value){reference.value=value;}};
};
const cPointerCompare = (left,right,op) => {
  if (left?.__cDeferredReference===true) left=left.resolve();
  if (right?.__cDeferredReference===true) right=right.resolve();
  if(left?.__cReference===true&&left.__cPointer!==true&&left.value?.[Symbol.for('source-first.original-byte-record-storage/1')])left=left.value;
  if(right?.__cReference===true&&right.__cPointer!==true&&right.value?.[Symbol.for('source-first.original-byte-record-storage/1')])right=right.value;
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
        const source=cByteRecordStorage.get(next),destination=cByteRecordStorage.get(record);
        if(!source||source.schema!==destination.schema)throw new TypeError('Record-pointer assignment requires identical Clang layout');
        destination.bytes.set(source.bytes);
      }};
    }
  };
  Object.defineProperty(globalThis,key,{value:api});return api;
})();
const cRecordPointer = (source,schema,prototypes={}) => {
  if(source===null)return null;
  if(source?.__cDeferredPointer||source?.__cDeferredReference)return cRecordPointer(source.resolve(),schema,prototypes);
  if(source?.__cReference&&source.__cPointer!==true)return cRecordPointer(source.value,schema,prototypes);
  const owner=source?.[Symbol.for('source-first.record-field-owner/1')],owned=owner&&cByteRecordStorage.get(owner);
  if(owned&&source.offset===owned.bytes.byteOffset&&JSON.stringify(schema)===owned.schema)
    return cRecordPointer(owner,schema,prototypes);
  const bytes=cByteRecordStorage.get(source)?.bytes||source?.[cByteRecordArrayStorage];
  const pointer=cPointer(bytes||source);
  if(pointer.array||!Number.isSafeInteger(schema?.size)||schema.size<1||
      !Number.isSafeInteger(schema.align)||schema.align<1||pointer.offset%schema.align)
    throw new TypeError('Record pointer requires aligned Clang-proven original bytes');
  return {...pointer,__cRecordPointer:true,recordSchema:schema,recordPrototypes:prototypes};
};

// Readable JS representation of Clang-proven pointer-free C/C++ POD copies.
// Fail closed if external storage has not been materialized in the agreed type.
const cCopyAggregate = (value, schema) => {
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
    return Array.from({length:schema.dims[0]}, () =>
      cZeroAggregate({array:schema.array,dims:schema.dims.slice(1)}));
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

const i32 = value => typeof value === "bigint" ? Number(BigInt.asIntN(32,value)) : Number(value) | 0;
const u32 = value => typeof value === "bigint" ? Number(BigInt.asUintN(32,value)) : Number(value) >>> 0;
const i64 = value => BigInt.asIntN(64, BigInt(value));
const u64 = value => BigInt.asUintN(64, BigInt(value));


const clz64 = value => {let v=BigInt.asUintN(64,BigInt(value));if(v===0n)return 64;let n=0;while((v&(1n<<63n))===0n){v<<=1n;n++;}return n;};
const ctz64 = (value,width) => {let v=BigInt.asUintN(width,BigInt(value));if(v===0n)return width;let n=0;while((v&1n)===0n){v>>=1n;n++;}return n;};
const popcnt = value => {let v=value,n=0;while(v){v&=v-1n;n++;}return n;};

const __builtin_abs = x => {x=Number(x)|0;if(x===-2147483648)throw new RangeError("C abs signed overflow");return Math.abs(x);};
const __builtin_unreachable = () => { throw new Error("C++ undefined behavior: reached __builtin_unreachable"); };
// C/C++ source: source/build/src/osd.cpp:23
export let whiteColorIdx = i32((-1));
function __cxx_static_address_0ea15dc1aa7360bcf15297a0() {
  return __cxx_static_address_0ea15dc1aa7360bcf15297a0.reference || (__cxx_static_address_0ea15dc1aa7360bcf15297a0.reference = {
    __cReference: true,
    get value() { return whiteColorIdx; },
    set value(__cxx_lvalue_0) { whiteColorIdx = i32(__cxx_lvalue_0); }
  });
}
export function __cxx_private_cell_0ea15dc1aa7360bcf15297a0() { return __cxx_static_address_0ea15dc1aa7360bcf15297a0(); }

// C/C++ source: source/build/src/osd.cpp:35
export let osdrowscur = i32((-1));
function __cxx_static_address_ede42faad942fe375d467e7c() {
  return __cxx_static_address_ede42faad942fe375d467e7c.reference || (__cxx_static_address_ede42faad942fe375d467e7c.reference = {
    __cReference: true,
    get value() { return osdrowscur; },
    set value(__cxx_lvalue_0) { osdrowscur = i32(__cxx_lvalue_0); }
  });
}
export function __cxx_private_cell_ede42faad942fe375d467e7c() { return __cxx_static_address_ede42faad942fe375d467e7c(); }

// C/C++ source: source/build/src/osd.cpp:36
export let osdmaxrows = i32((4320 >> 3));
function __cxx_static_address_6ccf77af1ebb35ce0896b7ab() {
  return __cxx_static_address_6ccf77af1ebb35ce0896b7ab.reference || (__cxx_static_address_6ccf77af1ebb35ce0896b7ab.reference = {
    __cReference: true,
    get value() { return osdmaxrows; },
    set value(__cxx_lvalue_0) { osdmaxrows = i32(__cxx_lvalue_0); }
  });
}
export function __cxx_private_cell_6ccf77af1ebb35ce0896b7ab() { return __cxx_static_address_6ccf77af1ebb35ce0896b7ab(); }

// C/C++ source: source/build/src/osd.cpp:37
export let osdrows = 0;
function __cxx_static_address_118753c0135375278a2f5a8b() {
  return __cxx_static_address_118753c0135375278a2f5a8b.reference || (__cxx_static_address_118753c0135375278a2f5a8b.reference = {
    __cReference: true,
    get value() { return osdrows; },
    set value(__cxx_lvalue_0) { osdrows = i32(__cxx_lvalue_0); }
  });
}
export function __cxx_private_cell_118753c0135375278a2f5a8b() { return __cxx_static_address_118753c0135375278a2f5a8b(); }

// C/C++ source: source/build/src/osd.cpp:47
export let h_osd = cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"prime": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"magic": {"native": "Uint32Array", "offset": 0, "size": 4}, "more": {"native": "Uint8Array", "offset": 4, "size": 1}}, "overlaps": false, "size": 5, "union": false}, "offset": 4}, "v": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "size": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "items": {"offset": 16, "pointer": true, "size": 8}}, "overlaps": true, "size": 24, "union": false}, cStaticInitializerValues({"__cxx_anonymous_0": cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"prime": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"magic": {"native": "Uint32Array", "offset": 0, "size": 4}, "more": {"native": "Uint8Array", "offset": 4, "size": 1}}, "overlaps": false, "size": 5, "union": false}, "offset": 4}, "v": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "size": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": true, "size": 12, "union": true}, cStaticInitializerValues({"size": u32(i32((512 >> 1)))}), null, {}), "items": null}), null, {});
function __cxx_static_address_e29f56370946f18c1c4ce6f4() {
  return __cxx_static_address_e29f56370946f18c1c4ce6f4.reference || (__cxx_static_address_e29f56370946f18c1c4ce6f4.reference = {
    __cReference: true,
    get value() { return h_osd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_e29f56370946f18c1c4ce6f4() { return __cxx_static_address_e29f56370946f18c1c4ce6f4(); }

// C/C++ source: source/build/src/osd.cpp:50
export let default_callbacks = cZeroAggregate({"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"clear": {"offset": 40, "pointer": true, "size": 8}, "drawchar": {"offset": 0, "pointer": true, "size": 8}, "drawcursor": {"offset": 16, "pointer": true, "size": 8}, "drawstr": {"offset": 8, "pointer": true, "size": 8}, "getcolumnwidth": {"offset": 24, "pointer": true, "size": 8}, "getrowheight": {"offset": 32, "pointer": true, "size": 8}, "gettime": {"offset": 48, "pointer": true, "size": 8}, "onshowosd": {"offset": 56, "pointer": true, "size": 8}}, "overlaps": false, "size": 64, "union": false}}, {});
function __cxx_static_address_89f1619e624af57267ee6473() {
  return __cxx_static_address_89f1619e624af57267ee6473.reference || (__cxx_static_address_89f1619e624af57267ee6473.reference = {
    __cReference: true,
    get value() { return default_callbacks; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_89f1619e624af57267ee6473() { return __cxx_static_address_89f1619e624af57267ee6473(); }

// C/C++ source: source/build/src/osd.cpp:52
export let h_cvars = cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"prime": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"magic": {"native": "Uint32Array", "offset": 0, "size": 4}, "more": {"native": "Uint8Array", "offset": 4, "size": 1}}, "overlaps": false, "size": 5, "union": false}, "offset": 4}, "v": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "size": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "items": {"offset": 16, "pointer": true, "size": 8}}, "overlaps": true, "size": 24, "union": false}, cStaticInitializerValues({"__cxx_anonymous_0": cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"prime": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"magic": {"native": "Uint32Array", "offset": 0, "size": 4}, "more": {"native": "Uint8Array", "offset": 4, "size": 1}}, "overlaps": false, "size": 5, "union": false}, "offset": 4}, "v": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "size": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": true, "size": 12, "union": true}, cStaticInitializerValues({"size": u32(i32((512 >> 1)))}), null, {}), "items": null}), null, {});
function __cxx_static_address_a920b40f756adfb47f87522c() {
  return __cxx_static_address_a920b40f756adfb47f87522c.reference || (__cxx_static_address_a920b40f756adfb47f87522c.reference = {
    __cReference: true,
    get value() { return h_cvars; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_a920b40f756adfb47f87522c() { return __cxx_static_address_a920b40f756adfb47f87522c(); }

// C/C++ source: C:\Users\andre\Documents\Codex\2026-10-13\master-execution-prompt-complete-eduke32-readable\work\toolchains\linux-sysroot\usr\include\c++\12/new:174
export function operator_new___ZnwmPv(arg0, __p) {
  return __p;
}

// C/C++ source: C:\Users\andre\Documents\Codex\2026-10-13\master-execution-prompt-complete-eduke32-readable\work\toolchains\linux-sysroot\usr\include\c++\12/new:176
export function operator_new_array___ZnamPv(arg0, __p) {
  return __p;
}

// C/C++ source: source/build/src/osd.cpp:91
export function OSD_CvarModified(pCvar) {
  if (((!__cxx_global_cell_5a97be12fac9e104b96ea90d().value) || (!cRecordObject(cRecordObject(pCvar).pData).__cxx_anonymous_2.ptr))) {
    return i32(0);
  }
  let rv = i32(0);
  switch (u32((cRecordObject(cRecordObject(pCvar).pData).flags & u32(63)))) {
    case u32(1):
    case u32(8):
    case u32(2):
    case u32(4): {
      (rv = i32((cRecordObject(pCvar).defaultValue.u32 != (cDeref(cRecordObject(cRecordObject(pCvar).pData).__cxx_anonymous_2.u32, Uint32Array).value))));
    }
    break;
    case u32(32): {
      (rv = i32((cRecordObject(pCvar).defaultValue.d != (cDeref(cRecordObject(cRecordObject(pCvar).pData).__cxx_anonymous_2.d, Float64Array).value))));
    }
    break;
    case u32(16): {
      (rv = i32(1));
    }
    break;
    default: {
      __builtin_unreachable();
    }
  }
  return i32((Boolean(rv) || (u32((cRecordObject(cRecordObject(pCvar).pData).flags & u32(8192))) == u32(8192))));
}

// C/C++ source: source/build/src/osd.cpp:272
const __cxx_literal_fc3f9e982446b0841503 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 111, 115, 100, 46, 99, 112, 112, 0]);
const __cxx_literal_4be2856cd9807501b05b = Uint8Array.from([37, 115, 0]);
export function osdfunc_echo(parm) {
  ((i32(0) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(0), __cxx_literal_fc3f9e982446b0841503, u32(274), __cxx_literal_4be2856cd9807501b05b, cPointerOffset(cRecordObject(parm).raw, 5, Uint8Array.BYTES_PER_ELEMENT)));
  return i32(0);
}

// C/C++ source: source/build/src/osd.cpp:339
export function _internal_drawosdchar(x, y, ch, shade, pal) {
  (shade = i32(shade));
  (pal = i32(pal));
  let st = new Uint8Array([ch, (u32(0) & 255)]);
  printext256(i32((4 + i32((x << 3)))), i32((4 + i32((y << 3)))), ((u32(whiteColorIdx) << 16) >> 16), ((u32((-1)) << 16) >> 16), st, (u32(0) & 255));
}

// C/C++ source: source/build/src/osd.cpp:349
export function _internal_drawosdstr(x, y, ch, len, shade, pal) {
  const __cxx_lvalue_0 = cRef(() => shade, __cxx_lvalue_2 => { shade = i32(__cxx_lvalue_2); });
  const __cxx_lvalue_1 = cRef(() => pal, __cxx_lvalue_3 => { pal = i32(__cxx_lvalue_3); });
  let st = cZeroAggregate({"array": "Uint8Array", "dims": [1024]});
  (shade = i32(shade));
  if ((len > 1023)) {
    (len = i32(1023));
  }
  memcpy(st, ch, u64(len));
  ((cDeref(cPointerOffset(st, len, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(0) & 255)) & 255));
  OSD_GetShadePal(ch, __cxx_lvalue_0, __cxx_lvalue_1);
  {
    let colidx = i32(((whiteColorIdx >= 0) ? i32((cPointerElementRef(palookup, (u32((u32(pal) & 255)) & 255)).value)[whiteColorIdx]) : whiteColorIdx));
    printext256(i32((4 + i32((x << 3)))), i32((4 + i32((y << 3)))), ((u32(colidx) << 16) >> 16), ((u32((-1)) << 16) >> 16), st, (u32(0) & 255));
  }
}

// C/C++ source: source/build/src/osd.cpp:367
export function _internal_drawosdcursor(x, y, flags, lastkeypress) {
  let st = new Uint8Array([95, (u32(0) & 255)]);
  (lastkeypress = i32(lastkeypress));
  if (Boolean(flags)) {
    ((cDeref(cPointerOffset(st, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32(35) & 255));
  }
  if ((whiteColorIdx > (-1))) {
    printext256(i32((4 + i32((x << 3)))), i32((i32((4 + i32((y << 3)))) + 2)), ((u32(whiteColorIdx) << 16) >> 16), ((u32((-1)) << 16) >> 16), st, (u32(0) & 255));
    return;
  }
  for (let i = i32(0), k = i32((255 + 1)); (i < 256); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; }))) {
    let j = i32((i32((klabs(i32((i32((cPointerElementRef(curpalette, i).value).r) - i32(Math.imul(4, 47))))) + klabs(i32((i32((cPointerElementRef(curpalette, i).value).g) - i32(Math.imul(4, 55))))))) + klabs(i32((i32((cPointerElementRef(curpalette, i).value).b) - i32(Math.imul(4, 63)))))));
    if ((j < k)) {
      (k = i32(j));
      (whiteColorIdx = i32(i));
    }
  }
}

// C/C++ source: source/build/src/osd.cpp:394
export function _internal_getcolumnwidth(w) {
  return i32((Math.trunc(w / 8) - 1));
}

// C/C++ source: source/build/src/osd.cpp:399
export function _internal_getrowheight(w) {
  return i32(Math.trunc(w / 8));
}

// C/C++ source: source/build/src/osd.cpp:404
export function _internal_clearbackground(cols, rows) {
  (cols = i32(cols));
  (rows = i32(rows));
}

// C/C++ source: source/build/src/osd.cpp:410
export function _internal_gettime() {
  return i32(0);
}

// C/C++ source: source/build/include/compat.h:1449
export function xfree(ptr) {
  Free__cxx_static_0dfd3f42f0dc2c05(__cxx_global_cell_11016d3c7177543e564ab46c().value, ptr);
}

// C/C++ source: source/build/include/compat.h:1413
export function xrealloc(ptr, size) {
  let newptr = Realloc__cxx_static_478d5da25b6b3923(__cxx_global_cell_11016d3c7177543e564ab46c().value, ptr, size, u64(16));
  if ((cPointerCompare(newptr, null, "!=") || (size == u64(0)))) {
    return newptr;
  }
  handle_memerr(i32(size));
  __builtin_unreachable();
}

// C/C++ source: source/build/include/pragmas.h:321
export function klabs(a) {
  return i32(__builtin_abs(a));
}

// C/C++ source: source/build/src/osd.cpp:415
export function _internal_onshowosd(a) {
  (a = i32(a));
}

// C/C++ source: source/build/src/osd.cpp:420
export function osd_clear(clearstrings) {
  memset(cRecordObject(__cxx_global_cell_5a97be12fac9e104b96ea90d().value).text.buf, 32, u64(32768));
  memset(cRecordObject(__cxx_global_cell_5a97be12fac9e104b96ea90d().value).text.fmt, i32((cRecordObject(__cxx_global_cell_5a97be12fac9e104b96ea90d().value).draw.textpal + i32((cRecordObject(__cxx_global_cell_5a97be12fac9e104b96ea90d().value).draw.textshade << 5)))), u64(32768));
  (cRecordObject(__cxx_global_cell_5a97be12fac9e104b96ea90d().value).text.lines = i32(1));
  mutex_lock(cObjectFieldRef(cRecordObject(__cxx_global_cell_5a97be12fac9e104b96ea90d().value).log, "mutex"));
  (cRecordObject(__cxx_global_cell_5a97be12fac9e104b96ea90d().value).log.m_lineidx = u32(0));
  if (Boolean(clearstrings)) {
    cRecordObject(cRecordObject(__cxx_global_cell_5a97be12fac9e104b96ea90d().value).log.m_lines).clear();
  }
  mutex_unlock(cObjectFieldRef(cRecordObject(__cxx_global_cell_5a97be12fac9e104b96ea90d().value).log, "mutex"));
}

// C/C++ source: source/build/src/osd.cpp:493
const __cxx_literal_8633e3e7ed2c0eb95b8f = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 111, 115, 100, 46, 99, 112, 112, 0]);
const __cxx_literal_cc3f1a46cf71e0e86805 = Uint8Array.from([82, 101, 109, 111, 118, 101, 100, 32, 97, 108, 105, 97, 115, 32, 37, 115, 32, 40, 39, 37, 115, 39, 41, 0]);
const __cxx_literal_ac634423bfbe969d0c95 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 111, 115, 100, 46, 99, 112, 112, 0]);
const __cxx_literal_311212bcd46d78fdf735 = Uint8Array.from([37, 115, 32, 105, 115, 32, 110, 111, 116, 32, 97, 110, 32, 97, 108, 105, 97, 115, 46, 46, 46, 0]);
const __cxx_literal_6a0f3664cb109dc66f7d = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 111, 115, 100, 46, 99, 112, 112, 0]);
const __cxx_literal_03d12e04d16362392619 = Uint8Array.from([37, 115, 32, 105, 115, 32, 110, 111, 116, 32, 97, 110, 32, 97, 108, 105, 97, 115, 46, 46, 46, 0]);
export function osdfunc_unalias(parm) {
  if ((cRecordObject(parm).numparms < 1)) {
    return i32(1);
  }
  for (let symb = cRecordObject(__cxx_global_cell_5a97be12fac9e104b96ea90d().value).symbols; cPointerCompare(symb, null, "!="); (symb = cRecordObject(symb).next)) {
    if ((!Boolean(strcasecmp((cPointerElementRef(cRecordObject(parm).parms, 0).value), cRecordObject(symb).name)))) {
      if ((cRecordObject(parm).numparms < 2)) {
        if (cPointerCompare(cRecordObject(symb).func, cSourceAddresses.decode(4919), "==")) {
          ((i32(0) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(0), __cxx_literal_8633e3e7ed2c0eb95b8f, u32(506), __cxx_literal_cc3f1a46cf71e0e86805, cRecordObject(symb).name, cRecordObject(symb).help));
          (cRecordObject(symb).func = cSourceAddresses.decode(57005));
        } else {
          ((i32(0) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(0), __cxx_literal_ac634423bfbe969d0c95, u32(510), __cxx_literal_311212bcd46d78fdf735, cRecordObject(symb).name));
        }
        return i32(0);
      }
    }
  }
  ((i32(0) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(0), __cxx_literal_6a0f3664cb109dc66f7d, u32(517), __cxx_literal_03d12e04d16362392619, (cPointerElementRef(cRecordObject(parm).parms, 0).value)));
  return i32(0);
}

// C/C++ source: source/build/src/osd.cpp:606
export function osdfunc_clear(UNUSED_parm) {
  ;
  osd_clear(i32(true));
  return i32(0);
}

// C/C++ source: source/build/src/osd.cpp:678
const __cxx_literal_b2a4d7dafa1630c62661 = Uint8Array.from([111, 115, 100, 114, 111, 119, 115, 0]);
const __cxx_literal_c9692dd91d0da436071f = Uint8Array.from([111, 115, 100, 116, 101, 120, 116, 109, 111, 100, 101, 0]);
const __cxx_literal_2e5a4020efce6fc8e7d6 = Uint8Array.from([111, 115, 100, 104, 105, 115, 116, 111, 114, 121, 100, 101, 112, 116, 104, 0]);
export function osdcmd_cvar_set_osd(parm) {
  let r = i32(osdcmd_cvar_set(parm));
  if ((r != 0)) {
    return i32(r);
  }
  if ((!Boolean(strcasecmp(cRecordObject(parm).name, __cxx_literal_b2a4d7dafa1630c62661)))) {
    (cRecordObject(__cxx_global_cell_5a97be12fac9e104b96ea90d().value).draw.rows = i32((Boolean(osdrows) ? clamp__header_b0c3fa1a2e69(osdrows, 1, osdmaxrows) : i32((osdmaxrows >> 1)))));
    if ((osdrowscur != (-1))) {
      (osdrowscur = i32(cRecordObject(__cxx_global_cell_5a97be12fac9e104b96ea90d().value).draw.rows));
    }
  } else {
    if ((!Boolean(strcasecmp(cRecordObject(parm).name, __cxx_literal_c9692dd91d0da436071f)))) {
      OSD_SetTextMode(cRecordObject(__cxx_global_cell_5a97be12fac9e104b96ea90d().value).draw.mode);
    } else {
      if ((!Boolean(strcasecmp(cRecordObject(parm).name, __cxx_literal_2e5a4020efce6fc8e7d6)))) {
        {
          const __cxx_range_array_0 = cRecordObject(__cxx_global_cell_5a97be12fac9e104b96ea90d().value).history.buf;
          if (__cxx_range_array_0.length !== 256) throw new RangeError("C array extent mismatch");
          if (!__cxx_range_array_0[Symbol.for("source-first.clang-pointer-array/1")]) throw new TypeError("C pointer array storage ABI missing");
          for (let __cxx_range_index_0 = 0; __cxx_range_index_0 < 256; ++__cxx_range_index_0) {
            do {
              xfree(__cxx_range_array_0[__cxx_range_index_0]);
              (__cxx_range_array_0[__cxx_range_index_0] = null);
            } while (Boolean(0));
          }
        }
      }
    }
  }
  return i32(0);
}

// C/C++ source: source/build/include/compat.h:1400
export function xcalloc(nmemb, size) {
  let siz = u64((BigInt(nmemb) * BigInt(size)));
  let ptr = Alloc__cxx_static_e0036cfb06bcfe42(__cxx_global_cell_11016d3c7177543e564ab46c().value, siz, u64(16));
  if (cPointerCompare(ptr, null, "!=")) {
    memset(ptr, 0, siz);
    return ptr;
  }
  handle_memerr(i32(size));
  __builtin_unreachable();
}

// C/C++ source: source/build/include/compat.h:1378
export function xstrdup(s) {
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

// C/C++ source: source/build/src/osd.cpp:703
const __cxx_literal_531139adca6af44c74f5 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 111, 115, 100, 46, 99, 112, 112, 0]);
const __cxx_literal_e24223e81a0cce52a6d2 = Uint8Array.from([116, 111, 103, 103, 108, 101, 58, 32, 98, 97, 100, 32, 99, 118, 97, 114, 32, 110, 97, 109, 101, 32, 39, 37, 115, 39, 32, 111, 114, 32, 119, 114, 111, 110, 103, 32, 99, 118, 97, 114, 32, 116, 121, 112, 101, 32, 111, 114, 32, 99, 111, 109, 112, 108, 101, 120, 105, 116, 121, 46, 0]);
const __cxx_literal_2d6bb77510dff4cfeb15 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 111, 115, 100, 46, 99, 112, 112, 0]);
const __cxx_literal_0b3f52a8e0cbb786993f = Uint8Array.from([116, 111, 103, 103, 108, 101, 58, 32, 99, 118, 97, 114, 32, 39, 37, 115, 39, 32, 105, 115, 32, 114, 101, 97, 100, 32, 111, 110, 108, 121, 46, 0]);
const __cxx_literal_cabc83a5476a82bc1432 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 111, 115, 100, 46, 99, 112, 112, 0]);
const __cxx_literal_c5a465684a1a0e96bf17 = Uint8Array.from([37, 115, 32, 37, 100, 0]);
const __cxx_literal_b3da06f42e5040aeedcf = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 111, 115, 100, 46, 99, 112, 112, 0]);
const __cxx_literal_91932fa904686d60043f = Uint8Array.from([37, 115, 32, 37, 100, 0]);
export function osdfunc_toggle(parm) {
  if ((cRecordObject(parm).numparms != 1)) {
    return i32(1);
  }
  let i = i32(hash_find(__cxx_static_address_a920b40f756adfb47f87522c(), (cPointerElementRef(cRecordObject(parm).parms, 0).value)));
  if ((i == (-1))) {
    for ((i = i32((cRecordObject(__cxx_global_cell_5a97be12fac9e104b96ea90d().value).numcvars - 1))); (i >= 0); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous - 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; }))) {
      if ((!Boolean(strcasecmp((cPointerElementRef(cRecordObject(parm).parms, 0).value), cRecordObject((cPointerElementRef(cRecordObject(__cxx_global_cell_5a97be12fac9e104b96ea90d().value).cvars, i).value).pData).name)))) {
        break;
      }
    }
  }
  if ((((i == (-1)) || (!Boolean(u32((cRecordObject((cPointerElementRef(cRecordObject(__cxx_global_cell_5a97be12fac9e104b96ea90d().value).cvars, i).value).pData).flags & u32(14)))))) || cPointerCompare(cRecordObject(osd_findexactsymbol((cPointerElementRef(cRecordObject(parm).parms, 0).value))).func, osdcmd_cvar_set, "!="))) {
    ((i32(0) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(0), __cxx_literal_531139adca6af44c74f5, u32(721), __cxx_literal_e24223e81a0cce52a6d2, (cPointerElementRef(cRecordObject(parm).parms, 0).value)));
    return i32(0);
  }
  let pData = cRecordObject((cPointerElementRef(cRecordObject(__cxx_global_cell_5a97be12fac9e104b96ea90d().value).cvars, i).value).pData);
  if (Boolean(u32((pData.flags & u32(64))))) {
    ((i32(0) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(0), __cxx_literal_2d6bb77510dff4cfeb15, u32(729), __cxx_literal_0b3f52a8e0cbb786993f, pData.name));
    return i32(0);
  }
  switch (u32((cRecordObject((cPointerElementRef(cRecordObject(__cxx_global_cell_5a97be12fac9e104b96ea90d().value).cvars, i).value).pData).flags & u32(14)))) {
    case u32(2):
    case u32(8): {
      if ((((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i32((previous + 1)); __cxx_lvalue_2.value = next; return next; })(cDeref(pData.__cxx_anonymous_2.i32, Int32Array)) > pData.max)) {
        ((cDeref(pData.__cxx_anonymous_2.i32, Int32Array).value) = i32(pData.min));
      }
      if ((u32((pData.flags & u32(63))) == u32(8))) {
        ((cDeref(pData.__cxx_anonymous_2.i32, Int32Array).value) = i32(((cDeref(pData.__cxx_anonymous_2.i32, Int32Array).value) != 0)));
      }
      if ((!Boolean(OSD_ParsingScript()))) {
        ((i32(0) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(0), __cxx_literal_cabc83a5476a82bc1432, u32(745), __cxx_literal_c5a465684a1a0e96bf17, pData.name, (cDeref(pData.__cxx_anonymous_2.i32, Int32Array).value)));
      }
    }
    break;
    case u32(4): {
      if ((((__cxx_lvalue_3) => { const previous = __cxx_lvalue_3.value; const next = u32((previous + 1)); __cxx_lvalue_3.value = next; return next; })(cDeref(pData.__cxx_anonymous_2.u32, Uint32Array)) > u32(pData.max))) {
        ((cDeref(pData.__cxx_anonymous_2.u32, Uint32Array).value) = u32(pData.min));
      }
      if ((!Boolean(OSD_ParsingScript()))) {
        ((i32(0) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(0), __cxx_literal_b3da06f42e5040aeedcf, u32(754), __cxx_literal_91932fa904686d60043f, pData.name, (cDeref(pData.__cxx_anonymous_2.u32, Uint32Array).value)));
      }
    }
    break;
    default: {
      __builtin_unreachable();
    }
  }
  ((__cxx_lvalue_4) => (__cxx_lvalue_4.value = u32((__cxx_lvalue_4.value | u32(8192)))))(cObjectFieldRef(cRecordObject((cPointerElementRef(cRecordObject(__cxx_global_cell_5a97be12fac9e104b96ea90d().value).cvars, i).value).pData), "flags"));
  return i32(0);
}

// C/C++ source: source/build/include/mutex.h:29
export function mutex_lock(mutex) {
  SDL_AtomicLock(mutex);
}

// C/C++ source: source/build/include/mutex.h:40
export function mutex_unlock(mutex) {
  SDL_AtomicUnlock(mutex);
}

// C/C++ source: source/build/include/compat.h:1392
export function xmalloc(size) {
  let ptr = Alloc__cxx_static_e0036cfb06bcfe42(__cxx_global_cell_11016d3c7177543e564ab46c().value, size, u64(16));
  if (cPointerCompare(ptr, null, "!=")) {
    return ptr;
  }
  handle_memerr(i32(size));
  __builtin_unreachable();
}

// C/C++ source: source/build/src/osd.cpp:1919
export function osd_strtoken(s, ptrptr, restart) {
  ((cDeref(restart, Int32Array).value) = i32(0));
  if ((!ptrptr)) {
    return null;
  }
  let p = (s ? s : (cPointerElementRef(ptrptr, 0).value));
  if ((!p)) {
    return null;
  }
  while ((i32((cDeref(p, Uint8Array).value)) == i32(32))) {
    ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_0.value = next; return previous; })(cRef(() => p, __cxx_lvalue_1 => { p = __cxx_lvalue_1; }));
  }
  if ((i32((cDeref(p, Uint8Array).value)) == i32(59))) {
    ((cDeref(restart, Int32Array).value) = i32(1));
    ((cPointerElementRef(ptrptr, 0).value) = cPointerOffset(p, 1, Uint8Array.BYTES_PER_ELEMENT));
    return null;
  } else {
    if ((i32((cDeref(p, Uint8Array).value)) == 0)) {
      ((cPointerElementRef(ptrptr, 0).value) = null);
      return null;
    }
  }
  let start;
  if ((i32((cDeref(p, Uint8Array).value)) == i32(34))) {
    (start = ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_2.value = next; return next; })(cRef(() => p, __cxx_lvalue_3 => { p = __cxx_lvalue_3; })));
    let p2 = p;
    while ((i32((cDeref(p, Uint8Array).value)) != 0)) {
      if ((i32((cDeref(p, Uint8Array).value)) == i32(34))) {
        ((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_4.value = next; return previous; })(cRef(() => p, __cxx_lvalue_5 => { p = __cxx_lvalue_5; }));
        break;
      } else {
        if ((i32((cDeref(p, Uint8Array).value)) == i32(92))) {
          switch (i32((cDeref(((__cxx_lvalue_6) => { const previous = __cxx_lvalue_6.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_6.value = next; return next; })(cRef(() => p, __cxx_lvalue_7 => { p = __cxx_lvalue_7; })), Uint8Array).value))) {
            case i32(110): {
              ((cDeref(p2, Uint8Array).value) = (u32(10) & 255));
            }
            break;
            case i32(114): {
              ((cDeref(p2, Uint8Array).value) = (u32(13) & 255));
            }
            break;
            default: {
              ((cDeref(p2, Uint8Array).value) = (u32((cDeref(p, Uint8Array).value)) & 255));
            }
            break;
          }
        } else {
          ((cDeref(p2, Uint8Array).value) = (u32((cDeref(p, Uint8Array).value)) & 255));
        }
      }
      (((__cxx_lvalue_8) => { const previous = __cxx_lvalue_8.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_8.value = next; return previous; })(cRef(() => p2, __cxx_lvalue_9 => { p2 = __cxx_lvalue_9; })), ((__cxx_lvalue_10) => { const previous = __cxx_lvalue_10.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_10.value = next; return previous; })(cRef(() => p, __cxx_lvalue_11 => { p = __cxx_lvalue_11; })));
    }
    ((cDeref(p2, Uint8Array).value) = (u32((u32(0) & 255)) & 255));
  } else {
    (start = p);
    while ((((i32((cDeref(p, Uint8Array).value)) != 0) && (i32((cDeref(p, Uint8Array).value)) != i32(59))) && (i32((cDeref(p, Uint8Array).value)) != i32(32)))) {
      ((__cxx_lvalue_12) => { const previous = __cxx_lvalue_12.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_12.value = next; return previous; })(cRef(() => p, __cxx_lvalue_13 => { p = __cxx_lvalue_13; }));
    }
  }
  if ((i32((cDeref(p, Uint8Array).value)) == 0)) {
    ((cPointerElementRef(ptrptr, 0).value) = null);
  } else {
    if ((i32((cDeref(p, Uint8Array).value)) == i32(59))) {
      ((cDeref(p, Uint8Array).value) = (u32((u32(0) & 255)) & 255));
      ((cPointerElementRef(ptrptr, 0).value) = cPointerOffset(p, 1, Uint8Array.BYTES_PER_ELEMENT));
      ((cDeref(restart, Int32Array).value) = i32(1));
    } else {
      ((cDeref(((__cxx_lvalue_14) => { const previous = __cxx_lvalue_14.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_14.value = next; return previous; })(cRef(() => p, __cxx_lvalue_15 => { p = __cxx_lvalue_15; })), Uint8Array).value) = (u32((u32(0) & 255)) & 255));
      ((cPointerElementRef(ptrptr, 0).value) = p);
    }
  }
  return start;
}

// C/C++ source: source/build/src/osd.cpp:2136
export function osd_addsymbol(pszName) {
  if ((cRecordObject(__cxx_global_cell_5a97be12fac9e104b96ea90d().value).numsymbols >= 512)) {
    return null;
  }
  let newsymb = cRecordPointer(xcalloc(u64(1), 32), {"align": 8, "arrayAlign": 1, "fields": {"func": {"offset": 24, "pointer": true, "size": 8}, "help": {"offset": 16, "pointer": true, "size": 8}, "name": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {});
  if ((!cRecordObject(__cxx_global_cell_5a97be12fac9e104b96ea90d().value).symbols)) {
    (cRecordObject(__cxx_global_cell_5a97be12fac9e104b96ea90d().value).symbols = newsymb);
  } else {
    if ((strcasecmp(pszName, cRecordObject(cRecordObject(__cxx_global_cell_5a97be12fac9e104b96ea90d().value).symbols).name) <= 0)) {
      let t = cRecordObject(__cxx_global_cell_5a97be12fac9e104b96ea90d().value).symbols;
      (cRecordObject(__cxx_global_cell_5a97be12fac9e104b96ea90d().value).symbols = newsymb);
      (cRecordObject(cRecordObject(__cxx_global_cell_5a97be12fac9e104b96ea90d().value).symbols).next = t);
    } else {
      let s = cRecordObject(__cxx_global_cell_5a97be12fac9e104b96ea90d().value).symbols;
      while (cRecordObject(s).next) {
        if ((strcasecmp(cRecordObject(cRecordObject(s).next).name, pszName) > 0)) {
          break;
        }
        (s = cRecordObject(s).next);
      }
      let t = cRecordObject(s).next;
      (cRecordObject(s).next = newsymb);
      (cRecordObject(newsymb).next = t);
    }
  }
  let lowercase = Bstrtolower(xstrdup(pszName));
  hash_add(__cxx_static_address_e29f56370946f18c1c4ce6f4(), pszName, i64(cRecordObject(__cxx_global_cell_5a97be12fac9e104b96ea90d().value).numsymbols), 1);
  hash_add(__cxx_static_address_e29f56370946f18c1c4ce6f4(), lowercase, i64(cRecordObject(__cxx_global_cell_5a97be12fac9e104b96ea90d().value).numsymbols), 1);
  xfree(lowercase);
  ((cPointerElementRef(cRecordObject(__cxx_global_cell_5a97be12fac9e104b96ea90d().value).symbptrs, ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cObjectFieldRef(cRecordObject(__cxx_global_cell_5a97be12fac9e104b96ea90d().value), "numsymbols"))).value) = newsymb);
  return newsymb;
}

// C/C++ source: source/build/src/osd.cpp:2208
export function osd_findexactsymbol(pszName) {
  if (cPointerCompare(cRecordObject(__cxx_global_cell_5a97be12fac9e104b96ea90d().value).symbols, null, "==")) {
    return null;
  }
  let symbolNum = i32(hash_find(__cxx_static_address_e29f56370946f18c1c4ce6f4(), pszName));
  if ((symbolNum < 0)) {
    let lname = xstrdup(pszName);
    Bstrtolower(lname);
    (symbolNum = i32(hash_find(__cxx_static_address_e29f56370946f18c1c4ce6f4(), lname)));
    xfree(lname);
  }
  return ((symbolNum >= 0) ? (cPointerElementRef(cRecordObject(__cxx_global_cell_5a97be12fac9e104b96ea90d().value).symbptrs, symbolNum).value) : null);
}

// C/C++ source: source/build/include/compat.h:1161
export function nextPow2(value) {
  let i = i32(1);
  while ((i < value)) {
    (i = i32((i << 1)));
  }
  return i32(i);
}

// C/C++ source: source/build/src/osd.cpp:2226
const __cxx_literal_0d4e907c43e8f9c1c4e2 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 111, 115, 100, 46, 99, 112, 112, 0]);
const __cxx_literal_55a3b6865b4a4a324c90 = Uint8Array.from([39, 37, 115, 39, 32, 105, 115, 32, 39, 37, 102, 39, 0]);
const __cxx_literal_1c8ec05283718887f0e7 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 111, 115, 100, 46, 99, 112, 112, 0]);
const __cxx_literal_7b65d785a888781b1940 = Uint8Array.from([37, 115, 32, 91, 37, 100, 45, 37, 100, 93, 58, 32, 37, 115, 0]);
const __cxx_literal_399be2954d3308be4bca = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 111, 115, 100, 46, 99, 112, 112, 0]);
const __cxx_literal_d9d3d3fc41c98027e495 = Uint8Array.from([39, 37, 115, 39, 32, 105, 115, 32, 39, 37, 102, 39, 0]);
const __cxx_literal_81f25836e0b65910a6fc = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 111, 115, 100, 46, 99, 112, 112, 0]);
const __cxx_literal_1c40030cb5f86a492909 = Uint8Array.from([37, 115, 32, 91, 37, 100, 45, 37, 100, 93, 58, 32, 37, 115, 0]);
const __cxx_literal_ee08316e7a94d94b433c = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 111, 115, 100, 46, 99, 112, 112, 0]);
const __cxx_literal_503ccae0f76cec1551fc = Uint8Array.from([39, 37, 115, 39, 32, 105, 115, 32, 39, 37, 100, 39, 0]);
const __cxx_literal_800e5db64467b65ff656 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 111, 115, 100, 46, 99, 112, 112, 0]);
const __cxx_literal_0ea098051673a5ca5676 = Uint8Array.from([37, 115, 32, 91, 37, 100, 37, 99, 37, 100, 93, 58, 32, 37, 115, 0]);
const __cxx_literal_a4cb91eeaf8b7e839fe0 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 111, 115, 100, 46, 99, 112, 112, 0]);
const __cxx_literal_77c202e53e59ebf24778 = Uint8Array.from([39, 37, 115, 39, 32, 105, 115, 32, 39, 37, 100, 39, 0]);
const __cxx_literal_29acc1751cd18d3a36d4 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 111, 115, 100, 46, 99, 112, 112, 0]);
const __cxx_literal_f7d30323d5d90c621f48 = Uint8Array.from([37, 115, 32, 91, 37, 100, 45, 37, 100, 93, 58, 32, 37, 115, 0]);
const __cxx_literal_aee4bdba328f0572970e = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 111, 115, 100, 46, 99, 112, 112, 0]);
const __cxx_literal_2937516f73f87218733d = Uint8Array.from([39, 37, 115, 39, 32, 105, 115, 32, 39, 37, 115, 39, 0]);
const __cxx_literal_3e61f770303bfe48b0bd = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 111, 115, 100, 46, 99, 112, 112, 0]);
const __cxx_literal_e53206c759e221b4ec3c = Uint8Array.from([37, 115, 58, 32, 37, 115, 0]);
export function osdfunc_printvar(cvaridx) {
  let pData = cRecordObject((cPointerElementRef(cRecordObject(__cxx_global_cell_5a97be12fac9e104b96ea90d().value).cvars, cvaridx).value).pData);
  switch (u32((pData.flags & u32(63)))) {
    case u32(1): {
      ((i32(0) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(0), __cxx_literal_0d4e907c43e8f9c1c4e2, u32(2233), __cxx_literal_55a3b6865b4a4a324c90, pData.name, (cDeref(pData.__cxx_anonymous_2.f, Float32Array).value)));
    }
    ((i32(0) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(0), __cxx_literal_1c8ec05283718887f0e7, u32(2234), __cxx_literal_7b65d785a888781b1940, pData.name, pData.min, pData.max, pData.desc));
    return i32(0);
    case u32(32): {
      ((i32(0) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(0), __cxx_literal_399be2954d3308be4bca, u32(2237), __cxx_literal_d9d3d3fc41c98027e495, pData.name, (cDeref(pData.__cxx_anonymous_2.d, Float64Array).value)));
    }
    ((i32(0) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(0), __cxx_literal_81f25836e0b65910a6fc, u32(2238), __cxx_literal_1c40030cb5f86a492909, pData.name, pData.min, pData.max, pData.desc));
    return i32(0);
    case u32(2):
    case u32(8): {
      ((i32(0) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(0), __cxx_literal_ee08316e7a94d94b433c, u32(2242), __cxx_literal_503ccae0f76cec1551fc, pData.name, (cDeref(pData.__cxx_anonymous_2.i32, Int32Array).value)));
    }
    ((i32(0) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(0), __cxx_literal_800e5db64467b65ff656, u32(2243), __cxx_literal_0ea098051673a5ca5676, pData.name, pData.min, i32((Boolean(u32((pData.flags & u32(8)))) ? 47 : 45)), pData.max, pData.desc));
    return i32(0);
    case u32(4): {
      ((i32(0) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(0), __cxx_literal_a4cb91eeaf8b7e839fe0, u32(2246), __cxx_literal_77c202e53e59ebf24778, pData.name, (cDeref(pData.__cxx_anonymous_2.u32, Uint32Array).value)));
    }
    ((i32(0) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(0), __cxx_literal_29acc1751cd18d3a36d4, u32(2247), __cxx_literal_f7d30323d5d90c621f48, pData.name, pData.min, pData.max, pData.desc));
    return i32(0);
    case u32(16): {
      ((i32(0) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(0), __cxx_literal_aee4bdba328f0572970e, u32(2250), __cxx_literal_2937516f73f87218733d, pData.name, pData.__cxx_anonymous_2.string));
    }
    ((i32(0) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(0), __cxx_literal_3e61f770303bfe48b0bd, u32(2251), __cxx_literal_e53206c759e221b4ec3c, pData.name, pData.desc));
    return i32(0);
    default: {
      __builtin_unreachable();
    }
  }
}

export function clamp__header_b0c3fa1a2e69(__cxx_in, min, max) {
  return i32(((__cxx_in <= i32(min)) ? i32(min) : ((__cxx_in >= i32(max)) ? i32(max) : __cxx_in)));
}

// C/C++ source: @sysroot/usr/include/c++/12/bits/stl_algobase.h:254
export function max__template_b1cfaf2244c73238(__a, __b) {
  if ((__a.value < __b.value)) {
    return __b;
  }
  return __a;
}

export function ARRAY_SIZE__header_72600e724364(arg0) {
  return u64(10n);
}

// C/C++ source: source/build/src/osd.cpp:37
export class __cxx_record_CircularQueue_72e67824d02fa6e1 {
  constructor() {
    this.m_items = null;
    (this.m_items = calloc(u64(i64(1024n)), 8));
    this.clear();
  }
  clear() {
    (this.m_head = i32((-1)));
    (this.m_tail = i32((-1)));
    (this.m_count = i32(0));
    if (Boolean(i32((i32((u32(3) & 255)) & i32(2))))) {
      for (let i = i32(0); (i64(i) < i64(1024n)); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; }))) {
        do {
          xfree((cPointerElementRef(this.m_items, i).value));
          ((cPointerElementRef(this.m_items, i).value) = null);
        } while (Boolean(0));
      }
    }
    if (Boolean(i32((i32((u32(3) & 255)) & i32(1))))) {
      for (let i = i32(0); (i64(i) < i64(1024n)); ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i32((previous + 1)); __cxx_lvalue_2.value = next; return previous; })(cRef(() => i, __cxx_lvalue_3 => { i = __cxx_lvalue_3; }))) {
        ((cPointerElementRef(this.m_items, i).value) = cTypedPointer(null, Uint8Array));
      }
    }
  }
  pushBack(item) {
    if ((i64(this.m_head) == i64((BigInt(i64(1024n)) - BigInt(i64(1)))))) {
      (this.m_head = i32((-1)));
    } else {
      if ((i64(this.m_count) < i64(1024n))) {
        ((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = i32((previous + 1)); __cxx_lvalue_4.value = next; return next; })(cObjectFieldRef(this, "m_count"));
      }
    }
    if (Boolean(i32((i32((((__cxx_lvalue_5) => { const previous = __cxx_lvalue_5.value; const next = i32((previous + 1)); __cxx_lvalue_5.value = next; return next; })(cObjectFieldRef(this, "m_head")) == this.m_tail)) | i32((this.m_tail == (-1))))))) {
      if (Boolean(i32((i32((this.m_tail != (-1))) & i32((i32((i32((u32(3) & 255)) & i32(2))) == i32(2))))))) {
        xfree((cPointerElementRef(this.m_items, this.m_tail).value));
      }
      (this.m_tail = i32(i64((BigInt(i64(i32((this.m_tail + 1)))) % BigInt(i64(1024n))))));
    }
    ((cPointerElementRef(this.m_items, this.m_head).value) = item.value);
  }
  size() {
    return i32(this.m_count);
  }
  capacity() {
    return i32(i64(1024n));
  }
  frontIndex() {
    return i32(this.m_tail);
  }
  isEmpty() {
    return Boolean((this.m_count == 0));
  }
  isFull() {
    return Boolean((i64(this.m_count) == i64(1024n)));
  }
  __cxx_operator_9b870cb68c30a1d7(index) {
    return cPointerElementRef(this.m_items, index);
  }
  __cxx_destruct_4f87ed507d518235() {
    free(this.m_items);
  }
}
