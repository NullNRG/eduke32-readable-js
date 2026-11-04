// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/build/src/hash.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
import { Alloc__cxx_static_e0036cfb06bcfe42 } from "./smmalloc_generic.cpp.mjs";
import { ClockTicks } from "./osd.cpp.mjs";
import { Create__cxx_static_b7202f8c9d4230a6 } from "./smmalloc_generic.cpp.mjs";
import { Destroy__cxx_static_777d0ae31c789182 } from "./smmalloc_generic.cpp.mjs";
import { Free__cxx_static_0dfd3f42f0dc2c05 } from "./smmalloc_generic.cpp.mjs";
import { Realloc__cxx_static_478d5da25b6b3923 } from "./smmalloc_generic.cpp.mjs";
import { SDL_AtomicLock } from "../../../browser-abi/sdl_provider.mjs";
import { SDL_AtomicTryLock } from "../../../browser-abi/sdl_provider.mjs";
import { SDL_AtomicUnlock } from "../../../browser-abi/sdl_provider.mjs";
import { current_verbosity_cutoff } from "./loguru.cpp.mjs";
import { fileno } from "../../../browser-abi/libc_provider.mjs";
import { free } from "../../../browser-abi/libc_provider.mjs";
import { fstat } from "../../../browser-abi/libc_provider.mjs";
import { fwrite } from "../../../browser-abi/libc_provider.mjs";
import { __cxx_global_cell_11016d3c7177543e564ab46c } from "./compat.cpp.mjs";
import { handle_memerr } from "./compat.cpp.mjs";
import { libdivide_u32_do } from "../../../browser-abi/libdivide_source.mjs";
import { loguru_log } from "../../../browser-abi/loguru_provider.mjs";
import { memcpy } from "../../../browser-abi/libc_provider.mjs";
import { memset } from "../../../browser-abi/libc_provider.mjs";
import { __cxx_global_cell_5a97be12fac9e104b96ea90d } from "./osd.cpp.mjs";
import { pthread_getspecific } from "../../../browser-abi/libc_provider.mjs";
import { pthread_key_create } from "../../../browser-abi/libc_provider.mjs";
import { pthread_key_delete } from "../../../browser-abi/libc_provider.mjs";
import { pthread_mutex_destroy } from "../../../browser-abi/libc_provider.mjs";
import { pthread_mutex_init } from "../../../browser-abi/libc_provider.mjs";
import { pthread_mutex_lock } from "../../../browser-abi/libc_provider.mjs";
import { pthread_mutex_trylock } from "../../../browser-abi/libc_provider.mjs";
import { pthread_mutex_unlock } from "../../../browser-abi/libc_provider.mjs";
import { pthread_once } from "../../../browser-abi/libc_provider.mjs";
import { pthread_self } from "../../../browser-abi/libc_provider.mjs";
import { pthread_setspecific } from "../../../browser-abi/libc_provider.mjs";
import { rand } from "../../../browser-abi/libc_provider.mjs";
import { stat } from "../../../browser-abi/libc_provider.mjs";
import { strcasecmp } from "../../../browser-abi/libc_provider.mjs";
import { strcat } from "../../../browser-abi/libc_provider.mjs";
import { strcmp } from "../../../browser-abi/libc_provider.mjs";
import { strcpy } from "../../../browser-abi/libc_provider.mjs";
import { strlen } from "../../../browser-abi/libc_provider.mjs";
import { strrchr } from "../../../browser-abi/libc_provider.mjs";
import { strtol } from "../../../browser-abi/libc_provider.mjs";
import { tolower } from "../../../browser-abi/libc_provider.mjs";

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


function cCopyTrivialClass(value, C, fields) {
  if (!(value instanceof C)) throw new TypeError('C++ trivial class copy type mismatch');
  const copy=Object.create(C.prototype);
  for (const field of fields) copy[field]=value[field];
  return copy;
}

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
  const result=cMarkAggregate(Object.create(prototype)), view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  cByteRecordStorage.set(result,{bytes,schema:JSON.stringify(schema),prototypes});
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
  for (const [name,value] of Object.entries(values)) {
    const field=schema.fields[name];
    if (!field) throw new TypeError('Initializer is not a Clang record field');
    if(field.recordArray||field.pointerArray||field.nativeArray){
      const dest=result[name][Symbol.for('source-first.clang-byte-record-array/1')];
      if(field.recordArray){
        const source=value?.[Symbol.for('source-first.clang-byte-record-array/1')];
        if(!source||source.length!==field.size||value[Symbol.for('source-first.byte-record-array-layout/1')]!==
            JSON.stringify({schema:field.recordArray,dims:field.dims}))throw new TypeError('Member record-array initializer differs from Clang schema');
        dest.set(source);
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
  if(!Array.isArray(initializers)||initializers.length>count)throw new RangeError('C record initializer exceeds array extent');
  const bytes = storage || new Uint8Array(count * schema.size);
  if(!(bytes instanceof Uint8Array)||bytes.length!==count*schema.size)
    throw new TypeError('C record array backing store differs from Clang extent');
  const records = new Array(count).fill(null), signature = JSON.stringify(schema);
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
      if (key === cByteRecordArrayStorage) return bytes;
      const i = indexOf(key);
      if (i >= 0) return getRecord(i);
      return Reflect.get(target, key, receiver);
    },
    set(target, key, value) {
      const i = indexOf(key);
      if (i < 0) throw new RangeError('C record array index outside original extent');
      const source = cByteRecordStorage.get(value);
      if (!source || source.schema !== signature)
        throw new TypeError('C record array assignment requires identical Clang byte layout');
      bytes.set(source.bytes, i * schema.size);
      return true;
    }
  });
  for(let i=0;i<initializers.length;i++)result[i]=initializers[i];
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
  if(!Array.isArray(initializers)||initializers.length>dims[0])throw new RangeError('C record row initializer exceeds extent');
  const stride=dims.slice(1).reduce((a,b)=>a*b,1)*schema.size;
  const bytes=storage||new Uint8Array(dims[0]*stride);
  if(!(bytes instanceof Uint8Array)||bytes.length!==dims[0]*stride)throw new TypeError('Invalid record row storage');
  const rows=Array.from({length:dims[0]},(_,i)=>cByteRecordNDArray(schema,dims.slice(1),prototypes,
    initializers[i]||[],bytes.subarray(i*stride,(i+1)*stride)));
  Object.defineProperty(rows,cByteRecordArrayStorage,{value:bytes});
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
const i128 = value => BigInt.asIntN(128, BigInt(value));
const u128 = value => BigInt.asUintN(128, BigInt(value));
const floor = a => Math.floor(a);
const ceil = a => Math.ceil(a);


const clz64 = value => {let v=BigInt.asUintN(64,BigInt(value));if(v===0n)return 64;let n=0;while((v&(1n<<63n))===0n){v<<=1n;n++;}return n;};
const ctz64 = (value,width) => {let v=BigInt.asUintN(width,BigInt(value));if(v===0n)return width;let n=0;while((v&1n)===0n){v>>=1n;n++;}return n;};
const popcnt = value => {let v=value,n=0;while(v){v&=v-1n;n++;}return n;};

const __builtin_clz = x => Math.clz32(Number(x) >>> 0);
const __builtin_clzl = x => clz64(x);
const __builtin_clzll = x => clz64(x);
const __builtin_unreachable = () => { throw new Error("C++ undefined behavior: reached __builtin_unreachable"); };
// C/C++ source: source/build/include/fix16.h:111
export const fix16_rad_to_deg_mult__header_global_8d13a8e62c325a7a = i32(3754936);
function __cxx_static_address_2fe60cb8baf0ccb20ad0c59c() {
  return __cxx_static_address_2fe60cb8baf0ccb20ad0c59c.reference || (__cxx_static_address_2fe60cb8baf0ccb20ad0c59c.reference = {
    __cReference: true,
    get value() { return fix16_rad_to_deg_mult__header_global_8d13a8e62c325a7a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:114
export const fix16_deg_to_rad_mult__header_global_c7fca5383eff0bc8 = i32(1144);
function __cxx_static_address_98b7114a17032a05b805bd26() {
  return __cxx_static_address_98b7114a17032a05b805bd26.reference || (__cxx_static_address_98b7114a17032a05b805bd26.reference = {
    __cReference: true,
    get value() { return fix16_deg_to_rad_mult__header_global_c7fca5383eff0bc8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:31
export const FIX16_MAX__header_global_0616859451093a17 = i32(2147483647);
function __cxx_static_address_5cd6b03e753ef264be0950af() {
  return __cxx_static_address_5cd6b03e753ef264be0950af.reference || (__cxx_static_address_5cd6b03e753ef264be0950af.reference = {
    __cReference: true,
    get value() { return FIX16_MAX__header_global_0616859451093a17; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:32
export const FIX16_MIN__header_global_d70430241281b66e = i32(2147483648);
function __cxx_static_address_a1c35466ed6213c2f296d80c() {
  return __cxx_static_address_a1c35466ed6213c2f296d80c.reference || (__cxx_static_address_a1c35466ed6213c2f296d80c.reference = {
    __cReference: true,
    get value() { return FIX16_MIN__header_global_d70430241281b66e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:33
export const FIX16_OVERFLOW__header_global_46c89777830d1cd2 = i32(2147483648);
function __cxx_static_address_9529d939e33d2a8ea2d3cae5() {
  return __cxx_static_address_9529d939e33d2a8ea2d3cae5.reference || (__cxx_static_address_9529d939e33d2a8ea2d3cae5.reference = {
    __cReference: true,
    get value() { return FIX16_OVERFLOW__header_global_46c89777830d1cd2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:35
export const fix16_one__header_global_3b4d7b2538482ff3 = i32(65536);
function __cxx_static_address_618c1c5df1d9cdc349a8c982() {
  return __cxx_static_address_618c1c5df1d9cdc349a8c982.reference || (__cxx_static_address_618c1c5df1d9cdc349a8c982.reference = {
    __cReference: true,
    get value() { return fix16_one__header_global_3b4d7b2538482ff3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:36
export const fix16_half__header_global_9c99409ddc41c935 = i32(32768);
function __cxx_static_address_90895f0d3cf41e87ede1bc5f() {
  return __cxx_static_address_90895f0d3cf41e87ede1bc5f.reference || (__cxx_static_address_90895f0d3cf41e87ede1bc5f.reference = {
    __cReference: true,
    get value() { return fix16_half__header_global_9c99409ddc41c935; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:37
export const flt_f161r__header_global_305188e02ae0f5bf = Math.fround(Math.fround((Math.fround(1) / Math.fround(65536))));
function __cxx_static_address_3bdd7aec01d417ee87f6fbf5() {
  return __cxx_static_address_3bdd7aec01d417ee87f6fbf5.reference || (__cxx_static_address_3bdd7aec01d417ee87f6fbf5.reference = {
    __cReference: true,
    get value() { return flt_f161r__header_global_305188e02ae0f5bf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: C:\Users\andre\Documents\Codex\2026-10-13\master-execution-prompt-complete-eduke32-readable\work\toolchains\linux-sysroot\usr\include\x86_64-linux-gnu/bits/byteswap.h:34
export function __bswap_16(__bsx) {
  return (u32((u32(i32((i32((i32((i32(__bsx) >> 8)) & 255)) | i32((i32((i32(__bsx) & 255)) << 8))))) & 65535)) & 65535);
}

// C/C++ source: source/build/src/hash.cpp:49
export function __bswap_32(__bsx) {
  return u32((u32((u32(((u32((__bsx & 4278190080)) >>> 24) | (u32((__bsx & 16711680)) >>> 8))) | u32((u32((__bsx & 65280)) << 8)))) | u32((u32((__bsx & 255)) << 24))));
}

// C/C++ source: source/build/src/hash.cpp:70
export function __bswap_64(__bsx) {
  return u64((BigInt(u64((BigInt(u64((BigInt(u64((BigInt(u64((BigInt(u64((BigInt(u64((BigInt(u64((BigInt(u64((BigInt(u64(__bsx)) & BigInt(18374686479671623680n)))) >> BigInt(56)))) | BigInt(u64((BigInt(u64((BigInt(u64(__bsx)) & BigInt(71776119061217280n)))) >> BigInt(40))))))) | BigInt(u64((BigInt(u64((BigInt(u64(__bsx)) & BigInt(280375465082880n)))) >> BigInt(24))))))) | BigInt(u64((BigInt(u64((BigInt(u64(__bsx)) & BigInt(1095216660480n)))) >> BigInt(8))))))) | BigInt(u64((BigInt(u64((BigInt(u64(__bsx)) & BigInt(4278190080n)))) << BigInt(8))))))) | BigInt(u64((BigInt(u64((BigInt(u64(__bsx)) & BigInt(16711680n)))) << BigInt(24))))))) | BigInt(u64((BigInt(u64((BigInt(u64(__bsx)) & BigInt(65280n)))) << BigInt(40))))))) | BigInt(u64((BigInt(u64((BigInt(u64(__bsx)) & BigInt(255n)))) << BigInt(56))))));
}

// C/C++ source: C:\Users\andre\Documents\Codex\2026-10-13\master-execution-prompt-complete-eduke32-readable\work\toolchains\linux-sysroot\usr\include\x86_64-linux-gnu/bits/uintn-identity.h:33
export function __uint16_identity(__x) {
  return __x;
}

// C/C++ source: source/build/src/hash.cpp:39
export function __uint32_identity(__x) {
  return __x;
}

// C/C++ source: source/build/src/hash.cpp:45
export function __uint64_identity(__x) {
  return __x;
}

// C/C++ source: source/build/src/hash.cpp:47
export function iscanonical__cxx_a3dce400c4f1(__val) {
  return i32((void 0, 1));
}

// C/C++ source: source/build/src/hash.cpp:48
export function iscanonical__cxx_262aebf77d93(__val) {
  return i32((void 0, 1));
}

// C/C++ source: source/build/src/hash.cpp:1003
export function __size_to_integer__cxx_e3394d618576(__n) {
  return i32(__n);
}

// C/C++ source: source/build/src/hash.cpp:1005
export function __size_to_integer__cxx_543ad98a7693(__n) {
  return u32(__n);
}

// C/C++ source: source/build/src/hash.cpp:1007
export function __size_to_integer__cxx_725e18ad9d9e(__n) {
  return i64(__n);
}

// C/C++ source: source/build/src/hash.cpp:1009
export function __size_to_integer__cxx_0a44b83009ba(__n) {
  return u64(__n);
}

// C/C++ source: source/build/src/hash.cpp:1011
export function __size_to_integer__cxx_6ac9c70ccc53(__n) {
  return i64(__n);
}

// C/C++ source: source/build/src/hash.cpp:1013
export function __size_to_integer__cxx_e5265ced1fd8(__n) {
  return u64(__n);
}

// C/C++ source: source/build/src/hash.cpp:1041
export function __size_to_integer__cxx_9725a00dea2c(__n) {
  return i64(__n);
}

// C/C++ source: source/build/src/hash.cpp:1043
export function __size_to_integer__cxx_1f836a5706ff(__n) {
  return i64(__n);
}

// C/C++ source: source/build/src/hash.cpp:1045
export function __size_to_integer__cxx_3bf6d42a3086(__n) {
  return i64(__n);
}

// C/C++ source: source/build/src/hash.cpp:1505
export function __lg__cxx_5d561eceadad(__n) {
  return i32((i32((i32(Math.imul(i32(4), 8)) - 1)) - __builtin_clz(u32(__n))));
}

// C/C++ source: source/build/src/hash.cpp:1509
export function __lg__cxx_bff60accdd0c(__n) {
  return u32(i32((i32((i32(Math.imul(i32(4), 8)) - 1)) - __builtin_clz(__n))));
}

// C/C++ source: source/build/src/hash.cpp:1513
export function __lg__cxx_cfcbf570c404(__n) {
  return i64(i32((i32((i32(Math.imul(i32(8), 8)) - 1)) - __builtin_clzl(u64(__n)))));
}

// C/C++ source: source/build/src/hash.cpp:1517
export function __lg__cxx_a6d660286b2d(__n) {
  return u64(i32((i32((i32(Math.imul(i32(8), 8)) - 1)) - __builtin_clzl(__n))));
}

// C/C++ source: source/build/src/hash.cpp:1521
export function __lg__cxx_2827038c92bd(__n) {
  return i64(i32((i32((i32(Math.imul(i32(8), 8)) - 1)) - __builtin_clzll(u64(__n)))));
}

// C/C++ source: source/build/src/hash.cpp:1525
export function __lg__cxx_42192ce3e0c3(__n) {
  return u64(i32((i32((i32(Math.imul(i32(8), 8)) - 1)) - __builtin_clzll(__n))));
}

// C/C++ source: source/build/src/hash.cpp:174
export function operator_new___ZnwmPv(arg0, __p) {
  return __p;
}

// C/C++ source: source/build/src/hash.cpp:176
export function operator_new_array___ZnamPv(arg0, __p) {
  return __p;
}

// C/C++ source: source/build/src/hash.cpp:180
export function operator_delete___ZdlPvS_(arg0, arg1) {

}

// C/C++ source: source/build/src/hash.cpp:181
export function operator_delete_array___ZdaPvS_(arg0, arg1) {

}

// C/C++ source: source/build/src/hash.cpp:698
export function atoi_safe(str) {
  return i32(strtol(str, null, 10));
}

// C/C++ source: source/build/src/hash.cpp:97
export function _mm_cvtsi64_si32(__m) {
  return i32((cPointerElementRef(__m, 0).value));
}

// C/C++ source: source/build/src/hash.cpp:125
export function _mm_cvtm64_si64(__m) {
  return i64((cPointerElementRef(__m, 0).value));
}

// C/C++ source: source/build/src/hash.cpp:707
export function _mm_mullo_pi16(__m1, __m2) {
  return (__m1 * __m2);
}

// C/C++ source: source/build/src/hash.cpp:1079
export function _mm_and_si64(__m1, __m2) {
  return (__m1 & __m2);
}

// C/C++ source: source/build/src/hash.cpp:1099
export function _mm_andnot_si64(__m1, __m2) {
  return ((~__m1) & __m2);
}

// C/C++ source: source/build/src/hash.cpp:1116
export function _mm_or_si64(__m1, __m2) {
  return (__m1 | __m2);
}

// C/C++ source: source/build/src/hash.cpp:1133
export function _mm_xor_si64(__m1, __m2) {
  return (__m1 ^ __m2);
}

// C/C++ source: source/build/src/hash.cpp:1154
export function _mm_cmpeq_pi8(__m1, __m2) {
  return cPointerCompare(__m1, __m2, "==");
}

// C/C++ source: source/build/src/hash.cpp:1175
export function _mm_cmpeq_pi16(__m1, __m2) {
  return cPointerCompare(__m1, __m2, "==");
}

// C/C++ source: source/build/src/hash.cpp:1196
export function _mm_cmpeq_pi32(__m1, __m2) {
  return cPointerCompare(__m1, __m2, "==");
}

// C/C++ source: source/build/src/hash.cpp:55
export function _mm_free(__p) {
  free(__p);
}

// C/C++ source: C:/Users/andre/Documents/Codex/2026-10-13/master-execution-prompt-complete-eduke32-readable/work/toolchains/llvm-mingw-20261006-ucrt-x86_64/lib/clang/23/include/xmmintrin.h:79
export function _mm_add_ss(__a, __b) {
  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = Math.fround((__cxx_lvalue_0.value + (cPointerElementRef(__b, 0).value)))))(cPointerElementRef(__a, 0));
  return __a;
}

// C/C++ source: source/build/src/hash.cpp:119
export function _mm_sub_ss(__a, __b) {
  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = Math.fround((__cxx_lvalue_0.value - (cPointerElementRef(__b, 0).value)))))(cPointerElementRef(__a, 0));
  return __a;
}

// C/C++ source: source/build/src/hash.cpp:160
export function _mm_mul_ss(__a, __b) {
  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = Math.fround((__cxx_lvalue_0.value * (cPointerElementRef(__b, 0).value)))))(cPointerElementRef(__a, 0));
  return __a;
}

// C/C++ source: source/build/src/hash.cpp:179
export function _mm_mul_ps(__a, __b) {
  return Math.fround((__a * __b));
}

// C/C++ source: source/build/src/hash.cpp:200
export function _mm_div_ss(__a, __b) {
  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = Math.fround((__cxx_lvalue_0.value / (cPointerElementRef(__b, 0).value)))))(cPointerElementRef(__a, 0));
  return __a;
}

// C/C++ source: source/build/src/hash.cpp:218
export function _mm_div_ps(__a, __b) {
  return Math.fround((__a / __b));
}

// C/C++ source: source/build/src/hash.cpp:426
export function _mm_and_ps(__a, __b) {
  return (__a & __b);
}

// C/C++ source: source/build/src/hash.cpp:447
export function _mm_andnot_ps(__a, __b) {
  return ((~__a) & __b);
}

// C/C++ source: source/build/src/hash.cpp:464
export function _mm_or_ps(__a, __b) {
  return (__a | __b);
}

// C/C++ source: source/build/src/hash.cpp:482
export function _mm_xor_ps(__a, __b) {
  return (__a ^ __b);
}

// C/C++ source: source/build/src/hash.cpp:1606
export function _mm_cvtsi32_ss(__a, __b) {
  ((cPointerElementRef(__a, 0).value) = Math.fround(Math.fround(__b)));
  return __a;
}

// C/C++ source: source/build/src/hash.cpp:1628
export function _mm_cvt_si2ss(__a, __b) {
  return _mm_cvtsi32_ss(__a, __b);
}

// C/C++ source: source/build/src/hash.cpp:1652
export function _mm_cvtsi64_ss(__a, __b) {
  ((cPointerElementRef(__a, 0).value) = Math.fround(Math.fround(__b)));
  return __a;
}

// C/C++ source: source/build/src/hash.cpp:1720
export function _mm_cvtss_f32(__a) {
  return Math.fround((cPointerElementRef(__a, 0).value));
}

// C/C++ source: source/build/src/hash.cpp:1839
export function _mm_load_ps(__p) {
  return (__p).value;
}

// C/C++ source: source/build/src/hash.cpp:1856
export function _mm_loadu_ps(__p) {

  return cRecordObject(cRecordPointer(__p, {"align": 1, "arrayAlign": 1, "fields": {"__v": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "size": 16, "union": false}, {})).__v;
}

// C/C++ source: source/build/src/hash.cpp:2072
export function _mm_store_ss(__p, __a) {

  (cRecordObject(cRecordPointer(__p, {"align": 4, "arrayAlign": 1, "fields": {"__u": {"native": "Float32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 4, "union": false}, {})).__u = Math.fround((cPointerElementRef(__a, 0).value)));
}

// C/C++ source: source/build/src/hash.cpp:2093
export function _mm_storeu_ps(__p, __a) {

  (cRecordObject(cRecordPointer(__p, {"align": 1, "arrayAlign": 1, "fields": {"__v": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "size": 16, "union": false}, {})).__v = __a);
}

// C/C++ source: source/build/src/hash.cpp:2114
export function _mm_store_ps(__p, __a) {
  ((__p).value = __a);
}

// C/C++ source: source/build/src/hash.cpp:2796
export function _mm_move_ss(__a, __b) {
  ((cPointerElementRef(__a, 0).value) = Math.fround((cPointerElementRef(__b, 0).value)));
  return __a;
}

// C/C++ source: source/build/src/hash.cpp:80
export function _mm_add_sd(__a, __b) {
  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = (__cxx_lvalue_0.value + (cPointerElementRef(__b, 0).value))))(cPointerElementRef(__a, 0));
  return __a;
}

// C/C++ source: source/build/src/hash.cpp:120
export function _mm_sub_sd(__a, __b) {
  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = (__cxx_lvalue_0.value - (cPointerElementRef(__b, 0).value))))(cPointerElementRef(__a, 0));
  return __a;
}

// C/C++ source: source/build/src/hash.cpp:159
export function _mm_mul_sd(__a, __b) {
  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = (__cxx_lvalue_0.value * (cPointerElementRef(__b, 0).value))))(cPointerElementRef(__a, 0));
  return __a;
}

// C/C++ source: source/build/src/hash.cpp:177
export function _mm_mul_pd(__a, __b) {
  return (__a * __b);
}

// C/C++ source: source/build/src/hash.cpp:199
export function _mm_div_sd(__a, __b) {
  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = (__cxx_lvalue_0.value / (cPointerElementRef(__b, 0).value))))(cPointerElementRef(__a, 0));
  return __a;
}

// C/C++ source: source/build/src/hash.cpp:218
export function _mm_div_pd(__a, __b) {
  return (__a / __b);
}

// C/C++ source: source/build/src/hash.cpp:366
export function _mm_and_pd(__a, __b) {
  return (__a & __b);
}

// C/C++ source: source/build/src/hash.cpp:387
export function _mm_andnot_pd(__a, __b) {
  return ((~__a) & __b);
}

// C/C++ source: source/build/src/hash.cpp:403
export function _mm_or_pd(__a, __b) {
  return (__a | __b);
}

// C/C++ source: source/build/src/hash.cpp:420
export function _mm_xor_pd(__a, __b) {
  return (__a ^ __b);
}

// C/C++ source: source/build/src/hash.cpp:1410
export function _mm_cvtsi32_sd(__a, __b) {
  ((cPointerElementRef(__a, 0).value) = __b);
  return __a;
}

// C/C++ source: source/build/src/hash.cpp:1435
export function _mm_cvtss_sd(__a, __b) {
  ((cPointerElementRef(__a, 0).value) = (cPointerElementRef(__b, 0).value));
  return __a;
}

// C/C++ source: source/build/src/hash.cpp:1548
export function _mm_cvtsd_f64(__a) {
  return (cPointerElementRef(__a, 0).value);
}

// C/C++ source: source/build/src/hash.cpp:1563
export function _mm_load_pd(__dp) {
  return (__dp).value;
}

// C/C++ source: source/build/src/hash.cpp:1619
export function _mm_loadu_pd(__dp) {

  return cRecordObject(cRecordPointer(__dp, {"align": 1, "arrayAlign": 1, "fields": {"__v": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "size": 16, "union": false}, {})).__v;
}

// C/C++ source: source/build/src/hash.cpp:1887
export function _mm_move_sd(__a, __b) {
  ((cPointerElementRef(__a, 0).value) = (cPointerElementRef(__b, 0).value));
  return __a;
}

// C/C++ source: source/build/src/hash.cpp:1903
export function _mm_store_sd(__dp, __a) {

  (cRecordObject(cRecordPointer(__dp, {"align": 8, "arrayAlign": 1, "fields": {"__u": {"native": "Float64Array", "offset": 0, "size": 8}}, "overlaps": false, "size": 8, "union": false}, {})).__u = (cPointerElementRef(__a, 0).value));
}

// C/C++ source: source/build/src/hash.cpp:1924
export function _mm_store_pd(__dp, __a) {
  ((__dp).value = __a);
}

// C/C++ source: source/build/src/hash.cpp:1980
export function _mm_storeu_pd(__dp, __a) {

  (cRecordObject(cRecordPointer(__dp, {"align": 1, "arrayAlign": 1, "fields": {"__v": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "size": 16, "union": false}, {})).__v = __a);
}

// C/C++ source: source/build/src/hash.cpp:2019
export function _mm_storeh_pd(__dp, __a) {

  (cRecordObject(__dp).__u = (cPointerElementRef(__a, 1).value));
}

// C/C++ source: source/build/src/hash.cpp:2038
export function _mm_storel_pd(__dp, __a) {

  (cRecordObject(__dp).__u = (cPointerElementRef(__a, 0).value));
}

// C/C++ source: source/build/src/hash.cpp:2121
export function _mm_add_si64(__a, __b) {
  return u64((BigInt((cPointerElementRef(__a, 0).value)) + BigInt((cPointerElementRef(__b, 0).value))));
}

// C/C++ source: source/build/src/hash.cpp:2427
export function _mm_mullo_epi16(__a, __b) {
  return (__a * __b);
}

// C/C++ source: source/build/src/hash.cpp:2553
export function _mm_sub_si64(__a, __b) {
  return u64((BigInt((cPointerElementRef(__a, 0).value)) - BigInt((cPointerElementRef(__b, 0).value))));
}

// C/C++ source: source/build/src/hash.cpp:2674
export function _mm_and_si128(__a, __b) {
  return (__a & __b);
}

// C/C++ source: source/build/src/hash.cpp:2693
export function _mm_andnot_si128(__a, __b) {
  return ((~__a) & __b);
}

// C/C++ source: source/build/src/hash.cpp:2709
export function _mm_or_si128(__a, __b) {
  return (__a | __b);
}

// C/C++ source: source/build/src/hash.cpp:2726
export function _mm_xor_si128(__a, __b) {
  return (__a ^ __b);
}

// C/C++ source: source/build/src/hash.cpp:3087
export function _mm_cmpeq_epi8(__a, __b) {
  return cPointerCompare(__a, __b, "==");
}

// C/C++ source: source/build/src/hash.cpp:3106
export function _mm_cmpeq_epi16(__a, __b) {
  return cPointerCompare(__a, __b, "==");
}

// C/C++ source: source/build/src/hash.cpp:3125
export function _mm_cmpeq_epi32(__a, __b) {
  return cPointerCompare(__a, __b, "==");
}

// C/C++ source: source/build/src/hash.cpp:3270
export function _mm_cvtsi64_sd(__a, __b) {
  ((cPointerElementRef(__a, 0).value) = __b);
  return __a;
}

// C/C++ source: source/build/src/hash.cpp:3409
export function _mm_cvtsi128_si32(__a) {
  let __b = __a;
  return i32((cPointerElementRef(__b, 0).value));
}

// C/C++ source: source/build/src/hash.cpp:3426
export function _mm_cvtsi128_si64(__a) {
  return i64((cPointerElementRef(__a, 0).value));
}

// C/C++ source: source/build/src/hash.cpp:3441
export function _mm_load_si128(__p) {
  return (__p).value;
}

// C/C++ source: source/build/src/hash.cpp:3456
export function _mm_loadu_si128(__p) {

  return cRecordObject(cRecordPointer(__p, {"align": 1, "arrayAlign": 1, "fields": {"__v": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "size": 16, "union": false}, {})).__v;
}

// C/C++ source: source/build/src/hash.cpp:3894
export function _mm_store_si128(__p, __b) {
  ((__p).value = __b);
}

// C/C++ source: source/build/src/hash.cpp:3909
export function _mm_storeu_si128(__p, __b) {

  (cRecordObject(cRecordPointer(__p, {"align": 1, "arrayAlign": 1, "fields": {"__v": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "size": 16, "union": false}, {})).__v = __b);
}

// C/C++ source: source/build/src/hash.cpp:3929
export function _mm_storeu_si64(__p, __b) {

  (cRecordObject(cRecordPointer(__p, {"align": 8, "arrayAlign": 1, "fields": {"__v": {"native": "BigInt64Array", "offset": 0, "size": 8}}, "overlaps": false, "size": 8, "union": false}, {})).__v = i64((cPointerElementRef(__b, 0).value)));
}

// C/C++ source: source/build/src/hash.cpp:3949
export function _mm_storeu_si32(__p, __b) {

  (cRecordObject(cRecordPointer(__p, {"align": 4, "arrayAlign": 1, "fields": {"__v": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 4, "union": false}, {})).__v = i32((cPointerElementRef(__b, 0).value)));
}

// C/C++ source: source/build/src/hash.cpp:3969
export function _mm_storeu_si16(__p, __b) {

  (cRecordObject(cRecordPointer(__p, {"align": 2, "arrayAlign": 1, "fields": {"__v": {"native": "Int16Array", "offset": 0, "size": 2}}, "overlaps": false, "size": 2, "union": false}, {})).__v = ((u32((cPointerElementRef(__b, 0).value)) << 16) >> 16));
}

// C/C++ source: source/build/src/hash.cpp:4017
export function _mm_storel_epi64(__p, __a) {

  (cRecordObject(cRecordPointer(__p, {"align": 8, "arrayAlign": 1, "fields": {"__u": {"native": "BigInt64Array", "offset": 0, "size": 8}}, "overlaps": false, "size": 8, "union": false}, {})).__u = i64((cPointerElementRef(__a, 0).value)));
}

// C/C++ source: source/build/src/hash.cpp:4613
export function _mm_movepi64_pi64(__a) {
  return (cPointerElementRef(__a, 0).value);
}

// C/C++ source: source/build/src/hash.cpp:4751
export function _mm_castpd_ps(__a) {
  return __a;
}

// C/C++ source: source/build/src/hash.cpp:4767
export function _mm_castpd_si128(__a) {
  return __a;
}

// C/C++ source: source/build/src/hash.cpp:4783
export function _mm_castps_pd(__a) {
  return __a;
}

// C/C++ source: source/build/src/hash.cpp:4799
export function _mm_castps_si128(__a) {
  return __a;
}

// C/C++ source: source/build/src/hash.cpp:4815
export function _mm_castsi128_ps(__a) {
  return __a;
}

// C/C++ source: source/build/src/hash.cpp:4831
export function _mm_castsi128_pd(__a) {
  return __a;
}

// C/C++ source: source/build/src/hash.cpp:942
export function B_SWAP16_impl(value) {
  return (u32((u32(((u32((u32(value) & 65280)) >>> 8) | u32((u32((u32(value) & 255)) << 8)))) & 65535)) & 65535);
}

// C/C++ source: source/build/src/hash.cpp:948
export function B_SWAP32_impl(value) {
  return u32((u32((u32(((u32((value & 4278190080)) >>> 24) | (u32((value & 16711680)) >>> 8))) | u32((u32((value & 65280)) << 8)))) | u32((u32((value & 255)) << 24))));
}

// C/C++ source: source/build/src/hash.cpp:956
export function B_SWAP64_impl(value) {
  return u64((BigInt(u64((BigInt(u64((BigInt(u64((BigInt(u64((BigInt(u64((BigInt(u64((BigInt(u64((BigInt(u64((BigInt(u64(value)) & BigInt(18374686479671623680n)))) >> BigInt(56n)))) | BigInt(u64((BigInt(u64((BigInt(u64(value)) & BigInt(71776119061217280n)))) >> BigInt(40n))))))) | BigInt(u64((BigInt(u64((BigInt(u64(value)) & BigInt(280375465082880n)))) >> BigInt(24n))))))) | BigInt(u64((BigInt(u64((BigInt(u64(value)) & BigInt(1095216660480n)))) >> BigInt(8n))))))) | BigInt(u64((BigInt(u64((BigInt(u64(value)) & BigInt(4278190080n)))) << BigInt(8n))))))) | BigInt(u64((BigInt(u64((BigInt(u64(value)) & BigInt(16711680n)))) << BigInt(24n))))))) | BigInt(u64((BigInt(u64((BigInt(u64(value)) & BigInt(65280n)))) << BigInt(40n))))))) | BigInt(u64((BigInt(u64((BigInt(u64(value)) & BigInt(255n)))) << BigInt(56n))))));
}

// C/C++ source: source/build/src/hash.cpp:1031
export function B_BUF16(buf, x) {
  ((cDeref(cTypedPointer(buf, Uint16Array), Uint16Array).value) = (u32(x) & 65535));
}

// C/C++ source: source/build/src/hash.cpp:1032
export function B_BUF32(buf, x) {
  ((cDeref(cTypedPointer(buf, Uint32Array), Uint32Array).value) = u32(x));
}

// C/C++ source: source/build/src/hash.cpp:1033
export function B_BUF64(buf, x) {
  ((cDeref(cTypedPointer(buf, BigUint64Array), BigUint64Array).value) = u64(x));
}

// C/C++ source: source/build/src/hash.cpp:1035
export function B_UNBUF16(buf) {
  return (u32((cDeref(cTypedPointer(buf, Uint16Array), Uint16Array).value)) & 65535);
}

// C/C++ source: source/build/src/hash.cpp:1036
export function B_UNBUF32(buf) {
  return u32((cDeref(cTypedPointer(buf, Uint32Array), Uint32Array).value));
}

// C/C++ source: source/build/src/hash.cpp:1037
export function B_UNBUF64(buf) {
  return u64((cDeref(cTypedPointer(buf, BigUint64Array), BigUint64Array).value));
}

// C/C++ source: source/build/src/hash.cpp:1161
export function nextPow2(value) {
  let i = i32(1);
  while ((i < value)) {
    (i = i32((i << 1)));
  }
  return i32(i);
}

// C/C++ source: source/build/src/hash.cpp:1231
export function system_15bit_rand() {
  return (u32((u32(i32((i32((u32((u32(rand()) & 65535)) & 65535)) & 32767))) & 65535)) & 65535);
}

// C/C++ source: source/build/src/hash.cpp:1235
export function Bstrncpyz(dst, src, n) {
  if ((n > u64(0))) {
    memcpy(dst, src, (min__template_c237f4424e2bda8a(((__cxx_lvalue_0) => cRef(() => __cxx_lvalue_0, () => { throw new TypeError("const C++ reference write"); }))(u64((BigInt(strlen(src)) + BigInt(u64(1))))), ((__cxx_lvalue_1) => cRef(() => __cxx_lvalue_1, () => { throw new TypeError("const C++ reference write"); }))(u64((BigInt(n) - BigInt(u64(1))))))).value);
    ((cDeref(cPointerOffset(dst, u64((BigInt(n) - BigInt(u64(1)))), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32(0) & 255));
  }
  return dst;
}

// C/C++ source: source/build/src/hash.cpp:1249
export function append_ext_UNSAFE(outbuf, ext) {
  let p = strrchr(outbuf, i32(46));
  if ((!p)) {
    strcat(outbuf, ext);
  } else {
    strcpy(p, ext);
  }
}

// C/C++ source: source/build/src/hash.cpp:1210
export function atomic_flag_test_and_set_explicit__cxx_a39490b838d7(__a, __m) {
  return Boolean(cRecordObject(__a).test_and_set(__m));
}

// C/C++ source: source/build/src/hash.cpp:1215
export function atomic_flag_test_and_set_explicit__cxx_952567d4aa99(__a, __m) {
  return Boolean(cRecordObject(__a).test_and_set(__m));
}

// C/C++ source: source/build/src/hash.cpp:1220
export function atomic_flag_clear_explicit__cxx_ea63028b83e9(__a, __m) {
  cRecordObject(__a).clear(__m);
}

// C/C++ source: source/build/src/hash.cpp:1224
export function atomic_flag_clear_explicit__cxx_007242ccac28(__a, __m) {
  cRecordObject(__a).clear(__m);
}

// C/C++ source: source/build/src/hash.cpp:1229
export function atomic_flag_test_and_set__cxx_85534dc05179(__a) {
  return Boolean(atomic_flag_test_and_set_explicit__cxx_a39490b838d7(__a, 5));
}

// C/C++ source: source/build/src/hash.cpp:1233
export function atomic_flag_test_and_set__cxx_d645fe1f44da(__a) {
  return Boolean(atomic_flag_test_and_set_explicit__cxx_952567d4aa99(__a, 5));
}

// C/C++ source: source/build/src/hash.cpp:1237
export function atomic_flag_clear__cxx_db2efd6de9ef(__a) {
  atomic_flag_clear_explicit__cxx_ea63028b83e9(__a, 5);
}

// C/C++ source: source/build/src/hash.cpp:1241
export function atomic_flag_clear__cxx_f43bec967889(__a) {
  atomic_flag_clear_explicit__cxx_007242ccac28(__a, 5);
}

// C/C++ source: source/build/src/hash.cpp:62
export function align(__align, __size, __ptr, __space) {
  if ((__space.value < __size)) {
    return null;
  }
  let __intptr = u64(cSourceAddresses.encode(__ptr.value));
  let __aligned = u64((BigInt(u64((BigInt(u64((BigInt(__intptr) - BigInt(u64(1))))) + BigInt(__align)))) & BigInt(u64((-__align)))));
  let __diff = u64((BigInt(__aligned) - BigInt(__intptr)));
  if ((__diff > u64((BigInt(__space.value) - BigInt(__size))))) {
    return null;
  } else {
    (__space.value = u64((BigInt(__space.value) - BigInt(__diff))));
    return (__ptr.value = cSourceAddresses.decode(__aligned));
  }
}

// C/C++ source: C:\Users\andre\Documents\Codex\2026-10-13\master-execution-prompt-complete-eduke32-readable\work\toolchains\linux-sysroot\usr\include\c++\12/cwchar:214
export function wcschr(__p, __c) {
  return wcschr(__p, __c);
}

// C/C++ source: source/build/src/hash.cpp:218
export function wcspbrk(__s1, __s2) {
  return wcspbrk(__s1, __s2);
}

// C/C++ source: source/build/src/hash.cpp:222
export function wcsrchr(__p, __c) {
  return wcsrchr(__p, __c);
}

// C/C++ source: source/build/src/hash.cpp:226
export function wcsstr(__s1, __s2) {
  return wcsstr(__s1, __s2);
}

// C/C++ source: source/build/src/hash.cpp:230
export function wmemchr(__p, __c, __n) {
  return wmemchr(__p, __c, __n);
}

// C/C++ source: source/build/src/hash.cpp:300
export function __gthread_active_p() {
  return i32(1);
}

// C/C++ source: source/build/src/hash.cpp:685
export function __gthread_self() {
  return pthread_self();
}

// C/C++ source: source/build/src/hash.cpp:697
export function __gthread_once(__once, __func) {
  if (Boolean(__gthread_active_p())) {
    return i32(pthread_once(__once, __func));
  } else {
    return i32((-1));
  }
}

// C/C++ source: source/build/src/hash.cpp:706
export function __gthread_key_create(__key, __dtor) {
  return i32(pthread_key_create(__key, __dtor));
}

// C/C++ source: source/build/src/hash.cpp:712
export function __gthread_key_delete(__key) {
  return i32(pthread_key_delete(__key));
}

// C/C++ source: source/build/src/hash.cpp:718
export function __gthread_getspecific(__key) {
  return pthread_getspecific(__key);
}

// C/C++ source: source/build/src/hash.cpp:724
export function __gthread_setspecific(__key, __ptr) {
  return i32(pthread_setspecific(__key, __ptr));
}

// C/C++ source: source/build/src/hash.cpp:730
export function __gthread_mutex_init_function(__mutex) {
  if (Boolean(__gthread_active_p())) {
    pthread_mutex_init(__mutex, null);
  }
}

// C/C++ source: source/build/src/hash.cpp:737
export function __gthread_mutex_destroy(__mutex) {
  if (Boolean(__gthread_active_p())) {
    return i32(pthread_mutex_destroy(__mutex));
  } else {
    return i32(0);
  }
}

// C/C++ source: source/build/src/hash.cpp:746
export function __gthread_mutex_lock(__mutex) {
  if (Boolean(__gthread_active_p())) {
    return i32(pthread_mutex_lock(__mutex));
  } else {
    return i32(0);
  }
}

// C/C++ source: source/build/src/hash.cpp:755
export function __gthread_mutex_trylock(__mutex) {
  if (Boolean(__gthread_active_p())) {
    return i32(pthread_mutex_trylock(__mutex));
  } else {
    return i32(0);
  }
}

// C/C++ source: source/build/src/hash.cpp:776
export function __gthread_mutex_unlock(__mutex) {
  if (Boolean(__gthread_active_p())) {
    return i32(pthread_mutex_unlock(__mutex));
  } else {
    return i32(0);
  }
}

// C/C++ source: source/build/src/hash.cpp:809
export function __gthread_recursive_mutex_lock(__mutex) {
  return i32(__gthread_mutex_lock(__mutex));
}

// C/C++ source: source/build/src/hash.cpp:815
export function __gthread_recursive_mutex_trylock(__mutex) {
  return i32(__gthread_mutex_trylock(__mutex));
}

// C/C++ source: source/build/src/hash.cpp:830
export function __gthread_recursive_mutex_unlock(__mutex) {
  return i32(__gthread_mutex_unlock(__mutex));
}

// C/C++ source: source/build/src/hash.cpp:836
export function __gthread_recursive_mutex_destroy(__mutex) {
  return i32(__gthread_mutex_destroy(__mutex));
}

// C/C++ source: source/build/src/hash.cpp:82
export function __exchange_and_add_single(__mem, __val) {
  let __result = i32((cDeref(__mem, Int32Array).value));
  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = i32((Number(__cxx_lvalue_0.value) + Number(__val)))))(cDeref(__mem, Int32Array));
  return __result;
}

// C/C++ source: source/build/src/hash.cpp:91
export function __atomic_add_single(__mem, __val) {
  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = i32((Number(__cxx_lvalue_0.value) + Number(__val)))))(cDeref(__mem, Int32Array));
}

// C/C++ source: source/build/src/hash.cpp:223
export function swap__cxx_7c777213a9e6(__lhs, __rhs) {
  __lhs.swap(__rhs);
}

// C/C++ source: source/build/src/hash.cpp:151
export function __rethrow_if_nested_impl(arg0) {

}

// C/C++ source: source/build/src/hash.cpp:113
export function declare_reachable(arg0) {

}

// C/C++ source: source/build/src/hash.cpp:122
export function declare_no_pointers(arg0, arg1) {

}

// C/C++ source: source/build/src/hash.cpp:126
export function undeclare_no_pointers(arg0, arg1) {

}

// C/C++ source: source/build/src/hash.cpp:130
export function get_pointer_safety() {
  return 0;
}

// C/C++ source: source/build/src/hash.cpp:135
export function IsAligned(v, alignment) {
  let lowBits = u64((BigInt(v) & BigInt(u64((BigInt(alignment) - BigInt(u64(1)))))));
  return Boolean((lowBits == u64(0)));
}

// C/C++ source: source/build/src/hash.cpp:141
export function Align(val, alignment) {
  ;
  let r = u64((BigInt(u64((BigInt(val) + BigInt(u64((BigInt(alignment) - BigInt(u64(1)))))))) & BigInt(u64((~u64((BigInt(alignment) - BigInt(u64(1)))))))));
  ;
  return u64(r);
}

// C/C++ source: source/build/src/hash.cpp:851
export function _sm_allocator_thread_cache_destroy(allocator) {
  if (cPointerCompare(allocator, null, "==")) {
    return;
  }
  cRecordObject(allocator).DestroyThreadCache();
}

// C/C++ source: source/build/src/hash.cpp:861
export function _sm_malloc(allocator, bytesCount, alignment) {
  return cRecordObject(allocator).Alloc(bytesCount, alignment);
}

// C/C++ source: source/build/src/hash.cpp:866
export function _sm_free(allocator, p) {
  return cRecordObject(allocator).Free(p);
}

// C/C++ source: source/build/src/hash.cpp:868
export function _sm_realloc(allocator, p, bytesCount, alignment) {
  return cRecordObject(allocator).Realloc(p, bytesCount, alignment);
}

// C/C++ source: source/build/src/hash.cpp:873
export function _sm_msize(allocator, p) {
  return u64(cRecordObject(allocator).GetUsableSize(p));
}

// C/C++ source: source/build/src/hash.cpp:875
export function _sm_mbucket(allocator, p) {
  return i32(cRecordObject(allocator).GetBucketIndex(p));
}

// C/C++ source: source/build/src/hash.cpp:1361
export function engineCreateAllocator() {
  (__cxx_global_cell_11016d3c7177543e564ab46c().value = Create__cxx_static_b7202f8c9d4230a6());
}

// C/C++ source: source/build/src/hash.cpp:1367
export function engineDestroyAllocator() {
  Destroy__cxx_static_777d0ae31c789182(__cxx_global_cell_11016d3c7177543e564ab46c().value);
}

// C/C++ source: source/build/src/hash.cpp:1378
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

// C/C++ source: source/build/src/hash.cpp:1392
export function xmalloc(size) {
  let ptr = Alloc__cxx_static_e0036cfb06bcfe42(__cxx_global_cell_11016d3c7177543e564ab46c().value, size, u64(16));
  if (cPointerCompare(ptr, null, "!=")) {
    return ptr;
  }
  handle_memerr(i32(size));
  __builtin_unreachable();
}

// C/C++ source: source/build/src/hash.cpp:1400
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

// C/C++ source: source/build/src/hash.cpp:1413
export function xrealloc(ptr, size) {
  let newptr = Realloc__cxx_static_478d5da25b6b3923(__cxx_global_cell_11016d3c7177543e564ab46c().value, ptr, size, u64(16));
  if ((cPointerCompare(newptr, null, "!=") || (size == u64(0)))) {
    return newptr;
  }
  handle_memerr(i32(size));
  __builtin_unreachable();
}

// C/C++ source: source/build/src/hash.cpp:1428
export function xaligned_alloc(alignment, size) {
  let ptr = Alloc__cxx_static_e0036cfb06bcfe42(__cxx_global_cell_11016d3c7177543e564ab46c().value, size, alignment);
  if (cPointerCompare(ptr, null, "!=")) {
    return ptr;
  }
  handle_memerr(i32(size));
  __builtin_unreachable();
}

// C/C++ source: source/build/src/hash.cpp:1436
export function xaligned_calloc(alignment, count, size) {
  let blocksize = u64((BigInt(count) * BigInt(size)));
  let ptr = Alloc__cxx_static_e0036cfb06bcfe42(__cxx_global_cell_11016d3c7177543e564ab46c().value, blocksize, alignment);
  if (cPointerCompare(ptr, null, "!=")) {
    memset(ptr, 0, blocksize);
    return ptr;
  }
  handle_memerr(i32(size));
  __builtin_unreachable();
}

// C/C++ source: source/build/src/hash.cpp:1449
export function xfree(ptr) {
  Free__cxx_static_0dfd3f42f0dc2c05(__cxx_global_cell_11016d3c7177543e564ab46c().value, ptr);
}

// C/C++ source: source/build/src/hash.cpp:1450
export function xaligned_free(ptr) {
  Free__cxx_static_0dfd3f42f0dc2c05(__cxx_global_cell_11016d3c7177543e564ab46c().value, ptr);
}

// C/C++ source: source/build/src/hash.cpp:1592
export function maybe_grow_buffer(buffer, buffersize, newsize) {
  if ((newsize > (cDeref(buffersize, Int32Array).value))) {
    ((cPointerElementRef(buffer, 0).value) = cTypedPointer(xrealloc((cPointerElementRef(buffer, 0).value), u64(newsize)), Uint8Array));
    ((cDeref(buffersize, Int32Array).value) = i32(newsize));
  }
}

// C/C++ source: source/build/src/hash.cpp:308
export function libdivide_mullhi_u16(x, y) {
  let xl = u32(x);
  let yl = u32(y);
  let rl = u32(Math.imul(xl, yl));
  return (u32((u32((u32((rl >>> 16)) & 65535)) & 65535)) & 65535);
}

// C/C++ source: source/build/src/hash.cpp:314
export function libdivide_mullhi_s16(x, y) {
  let xl = i32(x);
  let yl = i32(y);
  let rl = i32(Math.imul(xl, yl));
  return ((u32(((u32(((u32(i32((rl >> 16))) << 16) >> 16)) << 16) >> 16)) << 16) >> 16);
}

// C/C++ source: source/build/src/hash.cpp:321
export function libdivide_mullhi_u32(x, y) {
  let xl = u64(x);
  let yl = u64(y);
  let rl = u64((BigInt(xl) * BigInt(yl)));
  return u32(u64((BigInt(rl) >> BigInt(32))));
}

// C/C++ source: source/build/src/hash.cpp:327
export function libdivide_mullhi_s32(x, y) {
  let xl = i64(x);
  let yl = i64(y);
  let rl = i64((BigInt(xl) * BigInt(yl)));
  return i32(i64((BigInt(rl) >> BigInt(32))));
}

// C/C++ source: source/build/src/hash.cpp:334
export function libdivide_mullhi_u64(x, y) {
  let xl = u128(u128(x));
  let yl = u128(u128(y));
  let rl = u128(u128((BigInt(xl) * BigInt(yl))));
  return u64(u128((BigInt(rl) >> BigInt(64))));
}

// C/C++ source: source/build/src/hash.cpp:360
export function libdivide_mullhi_s64(x, y) {
  let xl = i128(i128(x));
  let yl = i128(i128(y));
  let rl = i128(i128((BigInt(xl) * BigInt(yl))));
  return i64(i128((BigInt(rl) >> BigInt(64))));
}

// C/C++ source: source/build/src/hash.cpp:382
export function libdivide_count_leading_zeros16(val) {
  return ((u32(((u32(i32((__builtin_clz(u32(val)) - 16))) << 16) >> 16)) << 16) >> 16);
}

// C/C++ source: source/build/src/hash.cpp:412
export function libdivide_count_leading_zeros32(val) {
  return i32(__builtin_clz(val));
}

// C/C++ source: source/build/src/hash.cpp:441
export function libdivide_count_leading_zeros64(val) {
  return i32(__builtin_clzll(u64(val)));
}

// C/C++ source: source/build/src/hash.cpp:462
export function libdivide_32_div_16_to_16(u1, u0, v, r) {
  let n = u32((u32((u32(u1) << 16)) | u32(u0)));
  let result = (u32((u32((u32(Math.trunc(n / u32(v))) & 65535)) & 65535)) & 65535);
  ((cDeref(r, Uint16Array).value) = (u32((u32((u32((n - u32(Math.imul(u32(result), u32(v))))) & 65535)) & 65535)) & 65535));
  return (u32(result) & 65535);
}

// C/C++ source: source/build/src/hash.cpp:606
export function libdivide_128_div_128_to_64(u_hi, u_lo, v_hi, v_lo, r_hi, r_lo) {
  let ufull = u128(u128(u_hi));
  let vfull = u128(u128(v_hi));
  (ufull = u128(u128((BigInt(u128((BigInt(ufull) << BigInt(64)))) | BigInt(u128(u_lo))))));
  (vfull = u128(u128((BigInt(u128((BigInt(vfull) << BigInt(64)))) | BigInt(u128(v_lo))))));
  let res = u64(u128((BigInt(ufull) / BigInt(vfull))));
  let remainder = u128(u128((BigInt(ufull) - BigInt(u128((BigInt(vfull) * BigInt(u128(res))))))));
  ((cDeref(r_lo, BigUint64Array).value) = u64(remainder));
  ((cDeref(r_hi, BigUint64Array).value) = u64(u128((BigInt(remainder) >> BigInt(64)))));
  return u64(res);
}

// C/C++ source: source/build/src/hash.cpp:42
export function fix16_to_int(a) {
  return i32(Math.trunc(i32((a + ((a >= 0) ? fix16_half__header_global_9c99409ddc41c935 : (-fix16_half__header_global_9c99409ddc41c935)))) / fix16_one__header_global_3b4d7b2538482ff3));
}

// C/C++ source: source/build/src/hash.cpp:43
export function fix16_to_float(a) {
  return Math.fround(Math.fround((Math.fround(Math.fround(a)) * flt_f161r__header_global_305188e02ae0f5bf)));
}

// C/C++ source: source/build/src/hash.cpp:44
export function fix16_to_dbl(a) {
  return (a * flt_f161r__header_global_305188e02ae0f5bf);
}

// C/C++ source: source/build/src/hash.cpp:46
export function fix16_from_int(a) {
  return i32(Math.imul(a, fix16_one__header_global_3b4d7b2538482ff3));
}

// C/C++ source: source/build/src/hash.cpp:47
export function fix16_from_float(a) {
  return i32(Math.fround((Math.fround((a * Math.fround(fix16_one__header_global_3b4d7b2538482ff3))) + ((a >= Math.fround(0)) ? Math.fround(0.5) : (-Math.fround(0.5))))));
}

// C/C++ source: source/build/src/hash.cpp:48
export function fix16_from_dbl(a) {
  return i32(((a * fix16_one__header_global_3b4d7b2538482ff3) + ((a >= 0) ? 0.5 : (-0.5))));
}

// C/C++ source: source/build/src/hash.cpp:62
export function fix16_floor(x) {
  return i32(u64((BigInt(u64(x)) & BigInt(4294901760n))));
}

// C/C++ source: source/build/src/hash.cpp:63
export function fix16_ceil(x) {
  return i32(u64((BigInt(u64((BigInt(u64(x)) & BigInt(4294901760n)))) + BigInt(u64((Boolean(u64((BigInt(u64(x)) & BigInt(65535n)))) ? fix16_one__header_global_3b4d7b2538482ff3 : 0))))));
}

// C/C++ source: source/build/src/hash.cpp:64
export function fix16_min(x, y) {
  const __cxx_lvalue_0 = cRef(() => x, __cxx_lvalue_2 => { x = i32(__cxx_lvalue_2); });
  const __cxx_lvalue_1 = cRef(() => y, __cxx_lvalue_3 => { y = i32(__cxx_lvalue_3); });
  return i32((min__template_774131ccff66371d(__cxx_lvalue_0, __cxx_lvalue_1)).value);
}

// C/C++ source: source/build/src/hash.cpp:65
export function fix16_max(x, y) {
  const __cxx_lvalue_0 = cRef(() => x, __cxx_lvalue_2 => { x = i32(__cxx_lvalue_2); });
  const __cxx_lvalue_1 = cRef(() => y, __cxx_lvalue_3 => { y = i32(__cxx_lvalue_3); });
  return i32((max__template_b1cfaf2244c73238(__cxx_lvalue_0, __cxx_lvalue_1)).value);
}

// C/C++ source: source/build/src/hash.cpp:66
export function fix16_clamp(x, lo, hi) {
  return i32(clamp__header_3d72d3f0c963(x, lo, hi));
}

// C/C++ source: source/build/src/hash.cpp:94
export function fix16_mod(x, y) {
  return i32((x = i32((Number(x) % Number(y)))));
}

// C/C++ source: source/build/src/hash.cpp:98
export function fix16_fast_trunc_mul(x, y) {
  return i32(i64((BigInt(i64((BigInt(i64(x)) * BigInt(i64(y))))) >> BigInt(16))));
}

// C/C++ source: source/build/src/hash.cpp:102
export function fix16_fast_trunc_mul_int_by_fix16(x, y) {
  return i32(i64((BigInt(i64((BigInt(i64(x)) * BigInt(i64(y))))) >> BigInt(16))));
}

export function mulscale1(eax, edx) {
  return i32(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) >> BigInt(i32((u32((u32(1) & 255)) & 255))))));
}

export function dmulscale1(eax, edx, esi, edi) {
  return i32(i64((BigInt(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) + BigInt(i64((BigInt(i64(esi)) * BigInt(i64(edi)))))))) >> BigInt(i32((u32((u32(1) & 255)) & 255))))));
}

export function tmulscale1(eax, edx, ebx, ecx, esi, edi) {
  return i32(i64((BigInt(i64((BigInt(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) + BigInt(i64((BigInt(i64(ebx)) * BigInt(i64(ecx)))))))) + BigInt(i64((BigInt(i64(esi)) * BigInt(i64(edi)))))))) >> BigInt(i32((u32((u32(1) & 255)) & 255))))));
}

export function mulscale2(eax, edx) {
  return i32(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) >> BigInt(i32((u32((u32(2) & 255)) & 255))))));
}

export function dmulscale2(eax, edx, esi, edi) {
  return i32(i64((BigInt(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) + BigInt(i64((BigInt(i64(esi)) * BigInt(i64(edi)))))))) >> BigInt(i32((u32((u32(2) & 255)) & 255))))));
}

export function tmulscale2(eax, edx, ebx, ecx, esi, edi) {
  return i32(i64((BigInt(i64((BigInt(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) + BigInt(i64((BigInt(i64(ebx)) * BigInt(i64(ecx)))))))) + BigInt(i64((BigInt(i64(esi)) * BigInt(i64(edi)))))))) >> BigInt(i32((u32((u32(2) & 255)) & 255))))));
}

export function mulscale3(eax, edx) {
  return i32(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) >> BigInt(i32((u32((u32(3) & 255)) & 255))))));
}

export function dmulscale3(eax, edx, esi, edi) {
  return i32(i64((BigInt(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) + BigInt(i64((BigInt(i64(esi)) * BigInt(i64(edi)))))))) >> BigInt(i32((u32((u32(3) & 255)) & 255))))));
}

export function tmulscale3(eax, edx, ebx, ecx, esi, edi) {
  return i32(i64((BigInt(i64((BigInt(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) + BigInt(i64((BigInt(i64(ebx)) * BigInt(i64(ecx)))))))) + BigInt(i64((BigInt(i64(esi)) * BigInt(i64(edi)))))))) >> BigInt(i32((u32((u32(3) & 255)) & 255))))));
}

export function mulscale4(eax, edx) {
  return i32(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) >> BigInt(i32((u32((u32(4) & 255)) & 255))))));
}

export function dmulscale4(eax, edx, esi, edi) {
  return i32(i64((BigInt(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) + BigInt(i64((BigInt(i64(esi)) * BigInt(i64(edi)))))))) >> BigInt(i32((u32((u32(4) & 255)) & 255))))));
}

export function tmulscale4(eax, edx, ebx, ecx, esi, edi) {
  return i32(i64((BigInt(i64((BigInt(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) + BigInt(i64((BigInt(i64(ebx)) * BigInt(i64(ecx)))))))) + BigInt(i64((BigInt(i64(esi)) * BigInt(i64(edi)))))))) >> BigInt(i32((u32((u32(4) & 255)) & 255))))));
}

export function mulscale5(eax, edx) {
  return i32(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) >> BigInt(i32((u32((u32(5) & 255)) & 255))))));
}

export function dmulscale5(eax, edx, esi, edi) {
  return i32(i64((BigInt(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) + BigInt(i64((BigInt(i64(esi)) * BigInt(i64(edi)))))))) >> BigInt(i32((u32((u32(5) & 255)) & 255))))));
}

export function tmulscale5(eax, edx, ebx, ecx, esi, edi) {
  return i32(i64((BigInt(i64((BigInt(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) + BigInt(i64((BigInt(i64(ebx)) * BigInt(i64(ecx)))))))) + BigInt(i64((BigInt(i64(esi)) * BigInt(i64(edi)))))))) >> BigInt(i32((u32((u32(5) & 255)) & 255))))));
}

export function mulscale6(eax, edx) {
  return i32(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) >> BigInt(i32((u32((u32(6) & 255)) & 255))))));
}

export function dmulscale6(eax, edx, esi, edi) {
  return i32(i64((BigInt(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) + BigInt(i64((BigInt(i64(esi)) * BigInt(i64(edi)))))))) >> BigInt(i32((u32((u32(6) & 255)) & 255))))));
}

export function tmulscale6(eax, edx, ebx, ecx, esi, edi) {
  return i32(i64((BigInt(i64((BigInt(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) + BigInt(i64((BigInt(i64(ebx)) * BigInt(i64(ecx)))))))) + BigInt(i64((BigInt(i64(esi)) * BigInt(i64(edi)))))))) >> BigInt(i32((u32((u32(6) & 255)) & 255))))));
}

export function mulscale7(eax, edx) {
  return i32(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) >> BigInt(i32((u32((u32(7) & 255)) & 255))))));
}

export function dmulscale7(eax, edx, esi, edi) {
  return i32(i64((BigInt(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) + BigInt(i64((BigInt(i64(esi)) * BigInt(i64(edi)))))))) >> BigInt(i32((u32((u32(7) & 255)) & 255))))));
}

export function tmulscale7(eax, edx, ebx, ecx, esi, edi) {
  return i32(i64((BigInt(i64((BigInt(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) + BigInt(i64((BigInt(i64(ebx)) * BigInt(i64(ecx)))))))) + BigInt(i64((BigInt(i64(esi)) * BigInt(i64(edi)))))))) >> BigInt(i32((u32((u32(7) & 255)) & 255))))));
}

export function mulscale8(eax, edx) {
  return i32(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) >> BigInt(i32((u32((u32(8) & 255)) & 255))))));
}

export function dmulscale8(eax, edx, esi, edi) {
  return i32(i64((BigInt(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) + BigInt(i64((BigInt(i64(esi)) * BigInt(i64(edi)))))))) >> BigInt(i32((u32((u32(8) & 255)) & 255))))));
}

export function tmulscale8(eax, edx, ebx, ecx, esi, edi) {
  return i32(i64((BigInt(i64((BigInt(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) + BigInt(i64((BigInt(i64(ebx)) * BigInt(i64(ecx)))))))) + BigInt(i64((BigInt(i64(esi)) * BigInt(i64(edi)))))))) >> BigInt(i32((u32((u32(8) & 255)) & 255))))));
}

export function mulscale9(eax, edx) {
  return i32(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) >> BigInt(i32((u32((u32(9) & 255)) & 255))))));
}

export function dmulscale9(eax, edx, esi, edi) {
  return i32(i64((BigInt(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) + BigInt(i64((BigInt(i64(esi)) * BigInt(i64(edi)))))))) >> BigInt(i32((u32((u32(9) & 255)) & 255))))));
}

export function tmulscale9(eax, edx, ebx, ecx, esi, edi) {
  return i32(i64((BigInt(i64((BigInt(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) + BigInt(i64((BigInt(i64(ebx)) * BigInt(i64(ecx)))))))) + BigInt(i64((BigInt(i64(esi)) * BigInt(i64(edi)))))))) >> BigInt(i32((u32((u32(9) & 255)) & 255))))));
}

export function mulscale10(eax, edx) {
  return i32(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) >> BigInt(i32((u32((u32(10) & 255)) & 255))))));
}

export function dmulscale10(eax, edx, esi, edi) {
  return i32(i64((BigInt(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) + BigInt(i64((BigInt(i64(esi)) * BigInt(i64(edi)))))))) >> BigInt(i32((u32((u32(10) & 255)) & 255))))));
}

export function tmulscale10(eax, edx, ebx, ecx, esi, edi) {
  return i32(i64((BigInt(i64((BigInt(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) + BigInt(i64((BigInt(i64(ebx)) * BigInt(i64(ecx)))))))) + BigInt(i64((BigInt(i64(esi)) * BigInt(i64(edi)))))))) >> BigInt(i32((u32((u32(10) & 255)) & 255))))));
}

export function mulscale11(eax, edx) {
  return i32(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) >> BigInt(i32((u32((u32(11) & 255)) & 255))))));
}

export function dmulscale11(eax, edx, esi, edi) {
  return i32(i64((BigInt(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) + BigInt(i64((BigInt(i64(esi)) * BigInt(i64(edi)))))))) >> BigInt(i32((u32((u32(11) & 255)) & 255))))));
}

export function tmulscale11(eax, edx, ebx, ecx, esi, edi) {
  return i32(i64((BigInt(i64((BigInt(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) + BigInt(i64((BigInt(i64(ebx)) * BigInt(i64(ecx)))))))) + BigInt(i64((BigInt(i64(esi)) * BigInt(i64(edi)))))))) >> BigInt(i32((u32((u32(11) & 255)) & 255))))));
}

export function mulscale12(eax, edx) {
  return i32(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) >> BigInt(i32((u32((u32(12) & 255)) & 255))))));
}

export function dmulscale12(eax, edx, esi, edi) {
  return i32(i64((BigInt(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) + BigInt(i64((BigInt(i64(esi)) * BigInt(i64(edi)))))))) >> BigInt(i32((u32((u32(12) & 255)) & 255))))));
}

export function tmulscale12(eax, edx, ebx, ecx, esi, edi) {
  return i32(i64((BigInt(i64((BigInt(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) + BigInt(i64((BigInt(i64(ebx)) * BigInt(i64(ecx)))))))) + BigInt(i64((BigInt(i64(esi)) * BigInt(i64(edi)))))))) >> BigInt(i32((u32((u32(12) & 255)) & 255))))));
}

export function mulscale13(eax, edx) {
  return i32(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) >> BigInt(i32((u32((u32(13) & 255)) & 255))))));
}

export function dmulscale13(eax, edx, esi, edi) {
  return i32(i64((BigInt(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) + BigInt(i64((BigInt(i64(esi)) * BigInt(i64(edi)))))))) >> BigInt(i32((u32((u32(13) & 255)) & 255))))));
}

export function tmulscale13(eax, edx, ebx, ecx, esi, edi) {
  return i32(i64((BigInt(i64((BigInt(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) + BigInt(i64((BigInt(i64(ebx)) * BigInt(i64(ecx)))))))) + BigInt(i64((BigInt(i64(esi)) * BigInt(i64(edi)))))))) >> BigInt(i32((u32((u32(13) & 255)) & 255))))));
}

export function mulscale14(eax, edx) {
  return i32(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) >> BigInt(i32((u32((u32(14) & 255)) & 255))))));
}

export function dmulscale14(eax, edx, esi, edi) {
  return i32(i64((BigInt(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) + BigInt(i64((BigInt(i64(esi)) * BigInt(i64(edi)))))))) >> BigInt(i32((u32((u32(14) & 255)) & 255))))));
}

export function tmulscale14(eax, edx, ebx, ecx, esi, edi) {
  return i32(i64((BigInt(i64((BigInt(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) + BigInt(i64((BigInt(i64(ebx)) * BigInt(i64(ecx)))))))) + BigInt(i64((BigInt(i64(esi)) * BigInt(i64(edi)))))))) >> BigInt(i32((u32((u32(14) & 255)) & 255))))));
}

export function mulscale15(eax, edx) {
  return i32(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) >> BigInt(i32((u32((u32(15) & 255)) & 255))))));
}

export function dmulscale15(eax, edx, esi, edi) {
  return i32(i64((BigInt(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) + BigInt(i64((BigInt(i64(esi)) * BigInt(i64(edi)))))))) >> BigInt(i32((u32((u32(15) & 255)) & 255))))));
}

export function tmulscale15(eax, edx, ebx, ecx, esi, edi) {
  return i32(i64((BigInt(i64((BigInt(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) + BigInt(i64((BigInt(i64(ebx)) * BigInt(i64(ecx)))))))) + BigInt(i64((BigInt(i64(esi)) * BigInt(i64(edi)))))))) >> BigInt(i32((u32((u32(15) & 255)) & 255))))));
}

export function mulscale16(eax, edx) {
  return i32(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) >> BigInt(i32((u32((u32(16) & 255)) & 255))))));
}

export function dmulscale16(eax, edx, esi, edi) {
  return i32(i64((BigInt(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) + BigInt(i64((BigInt(i64(esi)) * BigInt(i64(edi)))))))) >> BigInt(i32((u32((u32(16) & 255)) & 255))))));
}

export function tmulscale16(eax, edx, ebx, ecx, esi, edi) {
  return i32(i64((BigInt(i64((BigInt(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) + BigInt(i64((BigInt(i64(ebx)) * BigInt(i64(ecx)))))))) + BigInt(i64((BigInt(i64(esi)) * BigInt(i64(edi)))))))) >> BigInt(i32((u32((u32(16) & 255)) & 255))))));
}

export function mulscale17(eax, edx) {
  return i32(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) >> BigInt(i32((u32((u32(17) & 255)) & 255))))));
}

export function dmulscale17(eax, edx, esi, edi) {
  return i32(i64((BigInt(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) + BigInt(i64((BigInt(i64(esi)) * BigInt(i64(edi)))))))) >> BigInt(i32((u32((u32(17) & 255)) & 255))))));
}

export function tmulscale17(eax, edx, ebx, ecx, esi, edi) {
  return i32(i64((BigInt(i64((BigInt(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) + BigInt(i64((BigInt(i64(ebx)) * BigInt(i64(ecx)))))))) + BigInt(i64((BigInt(i64(esi)) * BigInt(i64(edi)))))))) >> BigInt(i32((u32((u32(17) & 255)) & 255))))));
}

export function mulscale18(eax, edx) {
  return i32(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) >> BigInt(i32((u32((u32(18) & 255)) & 255))))));
}

export function dmulscale18(eax, edx, esi, edi) {
  return i32(i64((BigInt(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) + BigInt(i64((BigInt(i64(esi)) * BigInt(i64(edi)))))))) >> BigInt(i32((u32((u32(18) & 255)) & 255))))));
}

export function tmulscale18(eax, edx, ebx, ecx, esi, edi) {
  return i32(i64((BigInt(i64((BigInt(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) + BigInt(i64((BigInt(i64(ebx)) * BigInt(i64(ecx)))))))) + BigInt(i64((BigInt(i64(esi)) * BigInt(i64(edi)))))))) >> BigInt(i32((u32((u32(18) & 255)) & 255))))));
}

export function mulscale19(eax, edx) {
  return i32(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) >> BigInt(i32((u32((u32(19) & 255)) & 255))))));
}

export function dmulscale19(eax, edx, esi, edi) {
  return i32(i64((BigInt(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) + BigInt(i64((BigInt(i64(esi)) * BigInt(i64(edi)))))))) >> BigInt(i32((u32((u32(19) & 255)) & 255))))));
}

export function tmulscale19(eax, edx, ebx, ecx, esi, edi) {
  return i32(i64((BigInt(i64((BigInt(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) + BigInt(i64((BigInt(i64(ebx)) * BigInt(i64(ecx)))))))) + BigInt(i64((BigInt(i64(esi)) * BigInt(i64(edi)))))))) >> BigInt(i32((u32((u32(19) & 255)) & 255))))));
}

export function mulscale20(eax, edx) {
  return i32(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) >> BigInt(i32((u32((u32(20) & 255)) & 255))))));
}

export function dmulscale20(eax, edx, esi, edi) {
  return i32(i64((BigInt(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) + BigInt(i64((BigInt(i64(esi)) * BigInt(i64(edi)))))))) >> BigInt(i32((u32((u32(20) & 255)) & 255))))));
}

export function tmulscale20(eax, edx, ebx, ecx, esi, edi) {
  return i32(i64((BigInt(i64((BigInt(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) + BigInt(i64((BigInt(i64(ebx)) * BigInt(i64(ecx)))))))) + BigInt(i64((BigInt(i64(esi)) * BigInt(i64(edi)))))))) >> BigInt(i32((u32((u32(20) & 255)) & 255))))));
}

export function mulscale21(eax, edx) {
  return i32(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) >> BigInt(i32((u32((u32(21) & 255)) & 255))))));
}

export function dmulscale21(eax, edx, esi, edi) {
  return i32(i64((BigInt(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) + BigInt(i64((BigInt(i64(esi)) * BigInt(i64(edi)))))))) >> BigInt(i32((u32((u32(21) & 255)) & 255))))));
}

export function tmulscale21(eax, edx, ebx, ecx, esi, edi) {
  return i32(i64((BigInt(i64((BigInt(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) + BigInt(i64((BigInt(i64(ebx)) * BigInt(i64(ecx)))))))) + BigInt(i64((BigInt(i64(esi)) * BigInt(i64(edi)))))))) >> BigInt(i32((u32((u32(21) & 255)) & 255))))));
}

export function mulscale22(eax, edx) {
  return i32(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) >> BigInt(i32((u32((u32(22) & 255)) & 255))))));
}

export function dmulscale22(eax, edx, esi, edi) {
  return i32(i64((BigInt(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) + BigInt(i64((BigInt(i64(esi)) * BigInt(i64(edi)))))))) >> BigInt(i32((u32((u32(22) & 255)) & 255))))));
}

export function tmulscale22(eax, edx, ebx, ecx, esi, edi) {
  return i32(i64((BigInt(i64((BigInt(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) + BigInt(i64((BigInt(i64(ebx)) * BigInt(i64(ecx)))))))) + BigInt(i64((BigInt(i64(esi)) * BigInt(i64(edi)))))))) >> BigInt(i32((u32((u32(22) & 255)) & 255))))));
}

export function mulscale23(eax, edx) {
  return i32(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) >> BigInt(i32((u32((u32(23) & 255)) & 255))))));
}

export function dmulscale23(eax, edx, esi, edi) {
  return i32(i64((BigInt(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) + BigInt(i64((BigInt(i64(esi)) * BigInt(i64(edi)))))))) >> BigInt(i32((u32((u32(23) & 255)) & 255))))));
}

export function tmulscale23(eax, edx, ebx, ecx, esi, edi) {
  return i32(i64((BigInt(i64((BigInt(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) + BigInt(i64((BigInt(i64(ebx)) * BigInt(i64(ecx)))))))) + BigInt(i64((BigInt(i64(esi)) * BigInt(i64(edi)))))))) >> BigInt(i32((u32((u32(23) & 255)) & 255))))));
}

export function mulscale24(eax, edx) {
  return i32(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) >> BigInt(i32((u32((u32(24) & 255)) & 255))))));
}

export function dmulscale24(eax, edx, esi, edi) {
  return i32(i64((BigInt(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) + BigInt(i64((BigInt(i64(esi)) * BigInt(i64(edi)))))))) >> BigInt(i32((u32((u32(24) & 255)) & 255))))));
}

export function tmulscale24(eax, edx, ebx, ecx, esi, edi) {
  return i32(i64((BigInt(i64((BigInt(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) + BigInt(i64((BigInt(i64(ebx)) * BigInt(i64(ecx)))))))) + BigInt(i64((BigInt(i64(esi)) * BigInt(i64(edi)))))))) >> BigInt(i32((u32((u32(24) & 255)) & 255))))));
}

export function mulscale25(eax, edx) {
  return i32(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) >> BigInt(i32((u32((u32(25) & 255)) & 255))))));
}

export function dmulscale25(eax, edx, esi, edi) {
  return i32(i64((BigInt(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) + BigInt(i64((BigInt(i64(esi)) * BigInt(i64(edi)))))))) >> BigInt(i32((u32((u32(25) & 255)) & 255))))));
}

export function tmulscale25(eax, edx, ebx, ecx, esi, edi) {
  return i32(i64((BigInt(i64((BigInt(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) + BigInt(i64((BigInt(i64(ebx)) * BigInt(i64(ecx)))))))) + BigInt(i64((BigInt(i64(esi)) * BigInt(i64(edi)))))))) >> BigInt(i32((u32((u32(25) & 255)) & 255))))));
}

export function mulscale26(eax, edx) {
  return i32(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) >> BigInt(i32((u32((u32(26) & 255)) & 255))))));
}

export function dmulscale26(eax, edx, esi, edi) {
  return i32(i64((BigInt(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) + BigInt(i64((BigInt(i64(esi)) * BigInt(i64(edi)))))))) >> BigInt(i32((u32((u32(26) & 255)) & 255))))));
}

export function tmulscale26(eax, edx, ebx, ecx, esi, edi) {
  return i32(i64((BigInt(i64((BigInt(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) + BigInt(i64((BigInt(i64(ebx)) * BigInt(i64(ecx)))))))) + BigInt(i64((BigInt(i64(esi)) * BigInt(i64(edi)))))))) >> BigInt(i32((u32((u32(26) & 255)) & 255))))));
}

export function mulscale27(eax, edx) {
  return i32(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) >> BigInt(i32((u32((u32(27) & 255)) & 255))))));
}

export function dmulscale27(eax, edx, esi, edi) {
  return i32(i64((BigInt(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) + BigInt(i64((BigInt(i64(esi)) * BigInt(i64(edi)))))))) >> BigInt(i32((u32((u32(27) & 255)) & 255))))));
}

export function tmulscale27(eax, edx, ebx, ecx, esi, edi) {
  return i32(i64((BigInt(i64((BigInt(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) + BigInt(i64((BigInt(i64(ebx)) * BigInt(i64(ecx)))))))) + BigInt(i64((BigInt(i64(esi)) * BigInt(i64(edi)))))))) >> BigInt(i32((u32((u32(27) & 255)) & 255))))));
}

export function mulscale28(eax, edx) {
  return i32(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) >> BigInt(i32((u32((u32(28) & 255)) & 255))))));
}

export function dmulscale28(eax, edx, esi, edi) {
  return i32(i64((BigInt(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) + BigInt(i64((BigInt(i64(esi)) * BigInt(i64(edi)))))))) >> BigInt(i32((u32((u32(28) & 255)) & 255))))));
}

export function tmulscale28(eax, edx, ebx, ecx, esi, edi) {
  return i32(i64((BigInt(i64((BigInt(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) + BigInt(i64((BigInt(i64(ebx)) * BigInt(i64(ecx)))))))) + BigInt(i64((BigInt(i64(esi)) * BigInt(i64(edi)))))))) >> BigInt(i32((u32((u32(28) & 255)) & 255))))));
}

export function mulscale29(eax, edx) {
  return i32(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) >> BigInt(i32((u32((u32(29) & 255)) & 255))))));
}

export function dmulscale29(eax, edx, esi, edi) {
  return i32(i64((BigInt(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) + BigInt(i64((BigInt(i64(esi)) * BigInt(i64(edi)))))))) >> BigInt(i32((u32((u32(29) & 255)) & 255))))));
}

export function tmulscale29(eax, edx, ebx, ecx, esi, edi) {
  return i32(i64((BigInt(i64((BigInt(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) + BigInt(i64((BigInt(i64(ebx)) * BigInt(i64(ecx)))))))) + BigInt(i64((BigInt(i64(esi)) * BigInt(i64(edi)))))))) >> BigInt(i32((u32((u32(29) & 255)) & 255))))));
}

export function mulscale30(eax, edx) {
  return i32(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) >> BigInt(i32((u32((u32(30) & 255)) & 255))))));
}

export function dmulscale30(eax, edx, esi, edi) {
  return i32(i64((BigInt(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) + BigInt(i64((BigInt(i64(esi)) * BigInt(i64(edi)))))))) >> BigInt(i32((u32((u32(30) & 255)) & 255))))));
}

export function tmulscale30(eax, edx, ebx, ecx, esi, edi) {
  return i32(i64((BigInt(i64((BigInt(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) + BigInt(i64((BigInt(i64(ebx)) * BigInt(i64(ecx)))))))) + BigInt(i64((BigInt(i64(esi)) * BigInt(i64(edi)))))))) >> BigInt(i32((u32((u32(30) & 255)) & 255))))));
}

export function mulscale31(eax, edx) {
  return i32(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) >> BigInt(i32((u32((u32(31) & 255)) & 255))))));
}

export function dmulscale31(eax, edx, esi, edi) {
  return i32(i64((BigInt(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) + BigInt(i64((BigInt(i64(esi)) * BigInt(i64(edi)))))))) >> BigInt(i32((u32((u32(31) & 255)) & 255))))));
}

export function tmulscale31(eax, edx, ebx, ecx, esi, edi) {
  return i32(i64((BigInt(i64((BigInt(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) + BigInt(i64((BigInt(i64(ebx)) * BigInt(i64(ecx)))))))) + BigInt(i64((BigInt(i64(esi)) * BigInt(i64(edi)))))))) >> BigInt(i32((u32((u32(31) & 255)) & 255))))));
}

export function mulscale32(eax, edx) {
  return i32(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) >> BigInt(i32((u32((u32(32) & 255)) & 255))))));
}

export function dmulscale32(eax, edx, esi, edi) {
  return i32(i64((BigInt(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) + BigInt(i64((BigInt(i64(esi)) * BigInt(i64(edi)))))))) >> BigInt(i32((u32((u32(32) & 255)) & 255))))));
}

export function tmulscale32(eax, edx, ebx, ecx, esi, edi) {
  return i32(i64((BigInt(i64((BigInt(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) + BigInt(i64((BigInt(i64(ebx)) * BigInt(i64(ecx)))))))) + BigInt(i64((BigInt(i64(esi)) * BigInt(i64(edi)))))))) >> BigInt(i32((u32((u32(32) & 255)) & 255))))));
}

// C/C++ source: source/build/src/hash.cpp:301
export function swapchar2(a, b, s) {
  swap__header_dd21f3a7cbbc(cTypedPointer(a, Uint8Array), cTypedPointer(b, Uint8Array));
  swap__header_dd21f3a7cbbc(cPointerOffset(cTypedPointer(a, Uint8Array), 1, Uint8Array.BYTES_PER_ELEMENT), cPointerOffset(cTypedPointer(b, Uint8Array), s, Uint8Array.BYTES_PER_ELEMENT));
}

// C/C++ source: source/build/src/hash.cpp:308
export function readpixel(s) {
  return (u32((cDeref(cTypedPointer(s, Uint8Array), Uint8Array).value)) & 255);
}

// C/C++ source: source/build/src/hash.cpp:309
export function drawpixel(s, a) {
  ((cDeref(cTypedPointer(s, Uint8Array), Uint8Array).value) = (u32(a) & 255));
}

// C/C++ source: source/build/src/hash.cpp:328
export function ksgn(a) {
  return i32((i32((a > 0)) - i32((a < 0))));
}

// C/C++ source: source/build/src/hash.cpp:332
export function mulscale(eax, edx, ecx) {
  return i32(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) >> BigInt(i32((u32((u32(ecx) & 255)) & 255))))));
}

// C/C++ source: source/build/src/hash.cpp:333
export function dmulscale(eax, edx, esi, edi, ecx) {
  return i32(i64((BigInt(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) + BigInt(i64((BigInt(i64(esi)) * BigInt(i64(edi)))))))) >> BigInt(i32((u32((u32(ecx) & 255)) & 255))))));
}

// C/C++ source: source/build/src/hash.cpp:380
export function swapbufreverse(s, d, c) {
  let src = cTypedPointer(s, Uint8Array);
  let dst = cTypedPointer(d, Uint8Array);
  (c >= 4);
  do {
    swap__header_13e7be761365(dst, src);
    swap__header_13e7be761365(cPointerOffset(dst, 1, Uint8Array.BYTES_PER_ELEMENT), cPointerOffset(src, -(1), Uint8Array.BYTES_PER_ELEMENT));
    swap__header_13e7be761365(cPointerOffset(dst, 2, Uint8Array.BYTES_PER_ELEMENT), cPointerOffset(src, -(2), Uint8Array.BYTES_PER_ELEMENT));
    swap__header_13e7be761365(cPointerOffset(dst, 3, Uint8Array.BYTES_PER_ELEMENT), cPointerOffset(src, -(3), Uint8Array.BYTES_PER_ELEMENT));
    ((dst = cPointerOffset(dst, 4, Uint8Array.BYTES_PER_ELEMENT)), (src = cPointerOffset(src, -(4), Uint8Array.BYTES_PER_ELEMENT)));
  } while (((c = i32((Number(c) - Number(4)))) > 4));
  while (Boolean(((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous - 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => c, __cxx_lvalue_1 => { c = __cxx_lvalue_1; })))) {
    swap__header_13e7be761365(((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_2.value = next; return previous; })(cRef(() => dst, __cxx_lvalue_3 => { dst = __cxx_lvalue_3; })), ((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = cPointerOffset(previous, -1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_4.value = next; return previous; })(cRef(() => src, __cxx_lvalue_5 => { src = __cxx_lvalue_5; })));
  }
}

// C/C++ source: source/build/src/hash.cpp:40
export function hash_getcode(s) {
  let h = u32(5381);
  let ch;
  while ((i32((ch = (u32((u32(tolower(i32((cDeref(((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_0.value = next; return previous; })(cRef(() => s, __cxx_lvalue_1 => { s = __cxx_lvalue_1; })), Uint8Array).value)))) & 255)) & 255))) != i32(0))) {
    (h = u32((u32((u32((h << 5)) + h)) ^ u32(ch))));
  }
  return u32(h);
}

// C/C++ source: source/build/src/hash.cpp:51
export function hash_getbucket(t, s) {
  let h = u32(hash_getcode(s));
  return u32((h - u32(Math.imul(libdivide_u32_do(h, cObjectFieldRef(cRecordObject(t).__cxx_anonymous_0.prime, "d")), cRecordObject(t).__cxx_anonymous_0.prime.v))));
}

// C/C++ source: source/build/src/hash.cpp:87
export function inthash_getcode(key) {
  const __cxx_lvalue_0 = cScalarStorage(BigInt64Array, key);
  let h = u32(5381);
  for (let keybuf = cTypedPointer(__cxx_lvalue_0, Uint8Array), keybuf_end = cPointerOffset(keybuf, 8, Uint8Array.BYTES_PER_ELEMENT); cPointerCompare(keybuf, keybuf_end, "<"); ((__cxx_lvalue_1) => { const previous = __cxx_lvalue_1.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_1.value = next; return next; })(cRef(() => keybuf, __cxx_lvalue_2 => { keybuf = __cxx_lvalue_2; }))) {
    (h = u32((u32((u32((h << 5)) + h)) ^ u32((cDeref(keybuf, Uint8Array).value)))));
  }
  return u32(h);
}

// C/C++ source: source/build/src/hash.cpp:97
export function inthash_getbucket(t, key) {
  let h = u32(inthash_getcode(key));
  return u32((h - u32(Math.imul(libdivide_u32_do(h, cObjectFieldRef(cRecordObject(t).__cxx_anonymous_1.prime, "d")), cRecordObject(t).__cxx_anonymous_1.prime.v))));
}

// C/C++ source: source/build/src/hash.cpp:534
export function SDL_memset4(dst, val, dwords) {
  let _n, _p, _val;
  let __cxx_pc = 11;
  __cxx_cfg_loop: while (true) {
    switch (__cxx_pc) {
    case 0: return;
    case 1: {
      __cxx_pc = (Boolean(((__cxx_lvalue_8) => { const previous = __cxx_lvalue_8.value; const next = u64((previous - 1n)); __cxx_lvalue_8.value = next; return next; })(cRef(() => _n, __cxx_lvalue_9 => { _n = __cxx_lvalue_9; })))) ? 5 : 0; continue __cxx_cfg_loop;
    }
    case 2: {
      ((cDeref(((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = cPointerOffset(previous, 1, Uint32Array.BYTES_PER_ELEMENT); __cxx_lvalue_0.value = next; return previous; })(cRef(() => _p, __cxx_lvalue_1 => { _p = __cxx_lvalue_1; })), Uint32Array).value) = u32(_val));
      __cxx_pc = 1; continue __cxx_cfg_loop;
    }
    case 3: {
      ((cDeref(((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = cPointerOffset(previous, 1, Uint32Array.BYTES_PER_ELEMENT); __cxx_lvalue_2.value = next; return previous; })(cRef(() => _p, __cxx_lvalue_3 => { _p = __cxx_lvalue_3; })), Uint32Array).value) = u32(_val));
      __cxx_pc = 2; continue __cxx_cfg_loop;
    }
    case 4: {
      ((cDeref(((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = cPointerOffset(previous, 1, Uint32Array.BYTES_PER_ELEMENT); __cxx_lvalue_4.value = next; return previous; })(cRef(() => _p, __cxx_lvalue_5 => { _p = __cxx_lvalue_5; })), Uint32Array).value) = u32(_val));
      __cxx_pc = 3; continue __cxx_cfg_loop;
    }
    case 5: {
      ((cDeref(((__cxx_lvalue_6) => { const previous = __cxx_lvalue_6.value; const next = cPointerOffset(previous, 1, Uint32Array.BYTES_PER_ELEMENT); __cxx_lvalue_6.value = next; return previous; })(cRef(() => _p, __cxx_lvalue_7 => { _p = __cxx_lvalue_7; })), Uint32Array).value) = u32(_val));
      __cxx_pc = 4; continue __cxx_cfg_loop;
    }
    case 6: {
      switch (u64((BigInt(dwords) % BigInt(u64(4))))) {
      case u64(1): __cxx_pc = 2; break;
      case u64(2): __cxx_pc = 3; break;
      case u64(3): __cxx_pc = 4; break;
      case u64(0): __cxx_pc = 5; break;
      default: __cxx_pc = 0; break;
      }
      continue __cxx_cfg_loop;
    }
    case 7: {
      return;
    }
    case 8: {
      __cxx_pc = ((dwords == u64(0))) ? 7 : 6; continue __cxx_cfg_loop;
    }
    case 9: {
      _val = u32(val);
      __cxx_pc = 8; continue __cxx_cfg_loop;
    }
    case 10: {
      _p = cTypedPointer(dst, Uint32Array);
      __cxx_pc = 9; continue __cxx_cfg_loop;
    }
    case 11: {
      _n = u64((BigInt(u64((BigInt(dwords) + BigInt(u64(3))))) / BigInt(u64(4))));
      __cxx_pc = 10; continue __cxx_cfg_loop;
    }
    default: throw new Error("invalid C source continuation");
    }
  }
}

// C/C++ source: source/build/src/hash.cpp:786
export function SDL_size_mul_overflow(a, b, ret) {
  if (((a != u64(0)) && (b > u64((BigInt(18446744073709551615n) / BigInt(a)))))) {
    return i32((-1));
  }
  ((cDeref(ret, BigUint64Array).value) = u64((BigInt(a) * BigInt(b))));
  return i32(0);
}

// C/C++ source: source/build/src/hash.cpp:816
export function SDL_size_add_overflow(a, b, ret) {
  if ((b > u64((BigInt(18446744073709551615n) - BigInt(a))))) {
    return i32((-1));
  }
  ((cDeref(ret, BigUint64Array).value) = u64((BigInt(a) + BigInt(b))));
  return i32(0);
}

// C/C++ source: source/build/src/hash.cpp:110
export function SDL_PointInRect(p, r) {
  return (((((cRecordObject(p).x >= cRecordObject(r).x) && (cRecordObject(p).x < i32((cRecordObject(r).x + cRecordObject(r).w)))) && (cRecordObject(p).y >= cRecordObject(r).y)) && (cRecordObject(p).y < i32((cRecordObject(r).y + cRecordObject(r).h)))) ? 1 : 0);
}

// C/C++ source: source/build/src/hash.cpp:119
export function SDL_RectEmpty(r) {
  return ((((!r) || (cRecordObject(r).w <= 0)) || (cRecordObject(r).h <= 0)) ? 1 : 0);
}

// C/C++ source: source/build/src/hash.cpp:127
export function SDL_RectEquals(a, b) {
  return ((((((a && b) && (cRecordObject(a).x == cRecordObject(b).x)) && (cRecordObject(a).y == cRecordObject(b).y)) && (cRecordObject(a).w == cRecordObject(b).w)) && (cRecordObject(a).h == cRecordObject(b).h)) ? 1 : 0);
}

// C/C++ source: source/build/src/hash.cpp:233
export function SDL_PointInFRect(p, r) {
  return (((((cRecordObject(p).x >= cRecordObject(r).x) && (cRecordObject(p).x < Math.fround((cRecordObject(r).x + cRecordObject(r).w)))) && (cRecordObject(p).y >= cRecordObject(r).y)) && (cRecordObject(p).y < Math.fround((cRecordObject(r).y + cRecordObject(r).h)))) ? 1 : 0);
}

// C/C++ source: source/build/src/hash.cpp:242
export function SDL_FRectEmpty(r) {
  return ((((!r) || (cRecordObject(r).w <= Math.fround(0))) || (cRecordObject(r).h <= Math.fround(0))) ? 1 : 0);
}

// C/C++ source: source/build/src/hash.cpp:29
export function mutex_lock(mutex) {
  SDL_AtomicLock(mutex);
}

// C/C++ source: source/build/src/hash.cpp:40
export function mutex_unlock(mutex) {
  SDL_AtomicUnlock(mutex);
}

// C/C++ source: source/build/src/hash.cpp:52
export function mutex_try(mutex) {
  return Boolean(Boolean(SDL_AtomicTryLock(mutex)));
}

// C/C++ source: source/build/src/hash.cpp:105
export function buildvfs_length(fd) {
  let st = new stat();
  return i64(((fstat(fd, st) < 0) ? i64((-1)) : st.st_size));
}

// C/C++ source: source/build/src/hash.cpp:131
export function buildvfs_flength(f) {
  return i64(buildvfs_length(fileno(f)));
}

// C/C++ source: source/build/src/hash.cpp:140
export function buildvfs_exists(path) {
  let st = new stat();
  return i32((!Boolean(stat(path, st))));
}

// C/C++ source: source/build/src/hash.cpp:150
export function buildvfs_isdir(path) {
  let st = new stat();
  return i32((Boolean(stat(path, st)) ? 0 : i32((u32((st.st_mode & u32(16384))) == u32(16384)))));
}

// C/C++ source: source/build/src/hash.cpp:163
export function buildvfs_fputstrptr(fp, str) {
  if (fp) {
    fwrite(str, u64(1), strlen(str), fp);
  }
}

// C/C++ source: source/build/src/hash.cpp:169
export function buildvfs_fputs(str, fp) {
  if (fp) {
    fwrite(str, u64(1), strlen(str), fp);
  }
}

// C/C++ source: source/build/src/hash.cpp:317
export function OSD_GetErrorFmt() {
  return cRecordObject(__cxx_global_cell_5a97be12fac9e104b96ea90d().value).draw.errorfmt;
}

// C/C++ source: source/build/src/hash.cpp:318
export function OSD_GetWarningFmt() {
  return cRecordObject(__cxx_global_cell_5a97be12fac9e104b96ea90d().value).draw.warnfmt;
}

// C/C++ source: source/build/src/hash.cpp:331
export function OSD_SetHistory(idx, src) {
  ((cPointerElementRef(cRecordObject(__cxx_global_cell_5a97be12fac9e104b96ea90d().value).history.buf, idx).value) = cTypedPointer(xmalloc(u64(512)), Uint8Array));
  Bstrncpyz((cPointerElementRef(cRecordObject(__cxx_global_cell_5a97be12fac9e104b96ea90d().value).history.buf, idx).value), src, u64(512));
}

// C/C++ source: source/build/src/hash.cpp:169
export function buildprintpiece(buf, str) {
  strcat(buf, str);
  return u64(strlen(str));
}

// C/C++ source: source/build/src/hash.cpp:8
export const primes = new BigUint64Array([BigInt(u64(11n)), BigInt(u64(13n)), BigInt(u64(17n)), BigInt(u64(19n)), BigInt(u64(37n)), BigInt(u64(41n)), BigInt(u64(43n)), BigInt(u64(59n)), BigInt(u64(67n)), BigInt(u64(73n)), BigInt(u64(79n)), BigInt(u64(83n)), BigInt(u64(109n)), BigInt(u64(113n)), BigInt(u64(131n)), BigInt(u64(139n)), BigInt(u64(149n)), BigInt(u64(157n)), BigInt(u64(163n)), BigInt(u64(173n)), BigInt(u64(191n)), BigInt(u64(211n)), BigInt(u64(227n)), BigInt(u64(241n)), BigInt(u64(257n)), BigInt(u64(269n)), BigInt(u64(283n)), BigInt(u64(307n)), BigInt(u64(331n)), BigInt(u64(349n)), BigInt(u64(373n)), BigInt(u64(397n)), BigInt(u64(419n)), BigInt(u64(439n)), BigInt(u64(461n)), BigInt(u64(499n)), BigInt(u64(523n)), BigInt(u64(557n)), BigInt(u64(587n)), BigInt(u64(617n)), BigInt(u64(647n)), BigInt(u64(691n)), BigInt(u64(727n)), BigInt(u64(769n)), BigInt(u64(809n)), BigInt(u64(877n)), BigInt(u64(941n)), BigInt(u64(997n)), BigInt(u64(1049n)), BigInt(u64(1103n)), BigInt(u64(1163n)), BigInt(u64(1223n)), BigInt(u64(1283n)), BigInt(u64(1367n)), BigInt(u64(1439n)), BigInt(u64(1523n)), BigInt(u64(1609n)), BigInt(u64(1693n)), BigInt(u64(1783n)), BigInt(u64(1871n)), BigInt(u64(1987n)), BigInt(u64(2087n)), BigInt(u64(2203n)), BigInt(u64(2333n)), BigInt(u64(2459n)), BigInt(u64(2591n)), BigInt(u64(2719n)), BigInt(u64(2857n)), BigInt(u64(2999n)), BigInt(u64(3163n)), BigInt(u64(3323n)), BigInt(u64(3491n)), BigInt(u64(3671n)), BigInt(u64(3863n)), BigInt(u64(4091n)), BigInt(u64(4297n)), BigInt(u64(4513n)), BigInt(u64(4751n)), BigInt(u64(4987n)), BigInt(u64(5237n)), BigInt(u64(5501n)), BigInt(u64(5791n)), BigInt(u64(6079n)), BigInt(u64(6397n)), BigInt(u64(6733n)), BigInt(u64(7079n)), BigInt(u64(7433n)), BigInt(u64(7877n)), BigInt(u64(8269n)), BigInt(u64(8681n)), BigInt(u64(9127n)), BigInt(u64(9587n)), BigInt(u64(10067n)), BigInt(u64(10589n)), BigInt(u64(11117n)), BigInt(u64(11677n)), BigInt(u64(12263n)), BigInt(u64(12893n)), BigInt(u64(13537n)), BigInt(u64(14221n)), BigInt(u64(14947n)), BigInt(u64(15727n)), BigInt(u64(16519n)), BigInt(u64(17351n)), BigInt(u64(18217n)), BigInt(u64(19139n)), BigInt(u64(20101n)), BigInt(u64(21107n)), BigInt(u64(22189n)), BigInt(u64(23297n)), BigInt(u64(24473n)), BigInt(u64(25717n)), BigInt(u64(27011n)), BigInt(u64(28387n)), BigInt(u64(29819n)), BigInt(u64(31321n)), BigInt(u64(32887n)), BigInt(u64(34537n)), BigInt(u64(36263n)), BigInt(u64(38083n)), BigInt(u64(39989n)), BigInt(u64(41999n)), BigInt(u64(44101n)), BigInt(u64(46307n)), BigInt(u64(48623n)), BigInt(u64(51059n)), BigInt(u64(53611n)), BigInt(u64(56333n)), BigInt(u64(59149n)), BigInt(u64(62119n)), BigInt(u64(65239n)), BigInt(u64(68501n)), BigInt(u64(71933n)), BigInt(u64(75533n)), BigInt(u64(79309n)), BigInt(u64(83273n)), BigInt(u64(87481n)), BigInt(u64(91867n)), BigInt(u64(96461n)), BigInt(u64(101287n)), BigInt(u64(106357n)), BigInt(u64(111697n)), BigInt(u64(117281n)), BigInt(u64(123191n)), BigInt(u64(129379n)), BigInt(u64(135851n)), BigInt(u64(142657n)), BigInt(u64(149791n)), BigInt(u64(157279n)), BigInt(u64(165161n)), BigInt(u64(173431n)), BigInt(u64(182101n)), BigInt(u64(191227n)), BigInt(u64(200789n)), BigInt(u64(210827n)), BigInt(u64(221399n)), BigInt(u64(232499n)), BigInt(u64(244157n)), BigInt(u64(256369n)), BigInt(u64(269189n)), BigInt(u64(282661n)), BigInt(u64(296797n)), BigInt(u64(311677n)), BigInt(u64(327263n)), BigInt(u64(343627n)), BigInt(u64(360817n)), BigInt(u64(378869n)), BigInt(u64(397811n)), BigInt(u64(417719n)), BigInt(u64(438611n)), BigInt(u64(460543n)), BigInt(u64(483611n)), BigInt(u64(507803n)), BigInt(u64(533213n)), BigInt(u64(559877n)), BigInt(u64(587891n)), BigInt(u64(617311n)), BigInt(u64(648181n)), BigInt(u64(680597n)), BigInt(u64(714673n)), BigInt(u64(750413n)), BigInt(u64(787981n)), BigInt(u64(827389n)), BigInt(u64(868771n)), BigInt(u64(912211n)), BigInt(u64(957821n)), BigInt(u64(1005761n)), BigInt(u64(1056049n))]);
function __cxx_static_address_5451a0c317910f37598642c6() {
  return __cxx_static_address_5451a0c317910f37598642c6.reference || (__cxx_static_address_5451a0c317910f37598642c6.reference = {
    __cReference: true,
    get value() { return primes; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_5451a0c317910f37598642c6() { return __cxx_static_address_5451a0c317910f37598642c6(); }

// C/C++ source: source/build/src/hash.cpp:25
const __cxx_literal_edfb57362cdb1f2ef46d = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 104, 97, 115, 104, 46, 99, 112, 112, 0]);
const __cxx_literal_0b27c986e2abf5b10872 = Uint8Array.from([104, 97, 115, 104, 95, 102, 105, 110, 100, 112, 114, 105, 109, 101, 58, 32, 115, 105, 122, 101, 32, 37, 108, 117, 114, 101, 113, 117, 101, 115, 116, 101, 100, 44, 32, 99, 111, 110, 115, 105, 100, 101, 114, 32, 101, 120, 112, 97, 110, 100, 105, 110, 103, 32, 112, 114, 105, 109, 101, 32, 116, 97, 98, 108, 101, 33, 0]);
export function hash_findprime(desiredSize) {
  if ((desiredSize >= (cDeref(cPointerOffset(primes, u64((BigInt(ARRAY_SIZE__header_08fa37b88077(primes)) - BigInt(u64(1)))), BigUint64Array.BYTES_PER_ELEMENT), BigUint64Array).value))) {
    ((i32(-2) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-2), __cxx_literal_edfb57362cdb1f2ef46d, u32(29), __cxx_literal_0b27c986e2abf5b10872, desiredSize));
    return u64((cDeref(cPointerOffset(primes, u64((BigInt(ARRAY_SIZE__header_08fa37b88077(primes)) - BigInt(u64(1)))), BigUint64Array.BYTES_PER_ELEMENT), BigUint64Array).value));
  }
  let lower = u64(0);
  let upper = u64((BigInt(ARRAY_SIZE__header_08fa37b88077(primes)) - BigInt(u64(1))));
  while ((lower != upper)) {
    let middle = u64((BigInt(lower) + BigInt(u64((BigInt(u64((BigInt(upper) - BigInt(lower)))) >> BigInt(1))))));
    if (((cDeref(cPointerOffset(primes, middle, BigUint64Array.BYTES_PER_ELEMENT), BigUint64Array).value) < desiredSize)) {
      (lower = u64((BigInt(middle) + BigInt(u64(1)))));
    } else {
      if (((cDeref(cPointerOffset(primes, middle, BigUint64Array.BYTES_PER_ELEMENT), BigUint64Array).value) > desiredSize)) {
        (upper = u64(middle));
      } else {
        return u64((cDeref(cPointerOffset(primes, middle, BigUint64Array.BYTES_PER_ELEMENT), BigUint64Array).value));
      }
    }
  }
  return u64((cDeref(cPointerOffset(primes, lower, BigUint64Array.BYTES_PER_ELEMENT), BigUint64Array).value));
}

// C/C++ source: source/build/src/hash.cpp:55
export function hash_loop(t, func) {
  if (cPointerCompare(cRecordObject(t).items, null, "==")) {
    return;
  }
  for (let i = u32(0); (i < cRecordObject(t).__cxx_anonymous_0.prime.v); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = u32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; }))) {
    for (let item = (cPointerElementRef(cRecordObject(t).items, i).value); cPointerCompare(item, null, "!="); (item = cRecordObject(item).next)) {
      func(cRecordObject(item).string, cRecordObject(item).key);
    }
  }
}

// C/C++ source: source/build/src/hash.cpp:65
export function hash_free(t) {
  if (cPointerCompare(cRecordObject(t).items, null, "==")) {
    return;
  }
  let remaining = i32(u32((cRecordObject(t).__cxx_anonymous_0.prime.v - u32(1))));
  do {
    let cur = (cPointerElementRef(cRecordObject(t).items, remaining).value);
    while (cur) {
      let tmp = cur;
      (cur = cRecordObject(cur).next);
      xfree(cRecordObject(tmp).string);
      xaligned_free(tmp);
    }
  } while ((((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous - 1)); __cxx_lvalue_0.value = next; return next; })(cRef(() => remaining, __cxx_lvalue_1 => { remaining = __cxx_lvalue_1; })) >= 0));
  do {
    xaligned_free(cRecordObject(t).items);
    (cRecordObject(t).items = null);
  } while (Boolean(0));
}

// C/C++ source: source/build/src/hash.cpp:89
export function hash_add(t, s, key, replace) {
  let code = u32(hash_getbucket(t, s));
  let cur = (cPointerElementRef(cRecordObject(t).items, code).value);
  if ((!cur)) {
    (cur = cRecordPointer(xaligned_alloc(u64(16), 24), {"align": 8, "arrayAlign": 1, "fields": {"key": {"native": "BigInt64Array", "offset": 8, "size": 8}, "next": {"offset": 16, "pointer": true, "size": 8}, "string": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "size": 24, "union": false}, {}));
    (cRecordObject(cur).string = xstrdup(s));
    (cRecordObject(cur).key = i64(key));
    (cRecordObject(cur).next = null);
    ((cPointerElementRef(cRecordObject(t).items, code).value) = cur);
    return;
  }
  let prev = null;
  do {
    if ((strcmp(s, cRecordObject(cur).string) == 0)) {
      if (Boolean(replace)) {
        (cRecordObject(cur).key = i64(key));
      }
      return;
    }
    (prev = cur);
  } while ((cur = cRecordObject(cur).next));
  (cur = cRecordPointer(xaligned_alloc(u64(16), 24), {"align": 8, "arrayAlign": 1, "fields": {"key": {"native": "BigInt64Array", "offset": 8, "size": 8}, "next": {"offset": 16, "pointer": true, "size": 8}, "string": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "size": 24, "union": false}, {}));
  (cRecordObject(cur).string = xstrdup(s));
  (cRecordObject(cur).key = i64(key));
  (cRecordObject(cur).next = null);
  (cRecordObject(prev).next = cur);
}

// C/C++ source: source/build/src/hash.cpp:129
export function hash_delete(t, s) {
  let code = u32(hash_getbucket(t, s));
  let cur = (cPointerElementRef(cRecordObject(t).items, code).value);
  if ((!cur)) {
    return;
  }
  let prev = null;
  do {
    if ((strcmp(s, cRecordObject(cur).string) == 0)) {
      xfree(cRecordObject(cur).string);
      if ((!prev)) {
        ((cPointerElementRef(cRecordObject(t).items, code).value) = cRecordObject(cur).next);
      } else {
        (cRecordObject(prev).next = cRecordObject(cur).next);
      }
      xaligned_free(cur);
      break;
    }
    (prev = cur);
  } while ((cur = cRecordObject(cur).next));
}

// C/C++ source: source/build/src/hash.cpp:161
export function hash_find(t, s) {
  let cur = (cPointerElementRef(cRecordObject(t).items, hash_getbucket(t, s)).value);
  if ((!cur)) {
    return i64((-1));
  }
  do {
    if ((strcmp(s, cRecordObject(cur).string) == 0)) {
      return i64(cRecordObject(cur).key);
    }
  } while ((cur = cRecordObject(cur).next));
  return i64((-1));
}

// C/C++ source: source/build/src/hash.cpp:179
export function hash_findcase(t, s) {
  let cur = (cPointerElementRef(cRecordObject(t).items, hash_getbucket(t, s)).value);
  if ((!cur)) {
    return i64((-1));
  }
  do {
    if ((strcasecmp(s, cRecordObject(cur).string) == 0)) {
      return i64(cRecordObject(cur).key);
    }
  } while ((cur = cRecordObject(cur).next));
  return i64((-1));
}

// C/C++ source: source/build/src/hash.cpp:198
export function inthash_free(t) {
  do {
    xaligned_free(cRecordObject(t).items);
    (cRecordObject(t).items = null);
  } while (Boolean(0));
}

// C/C++ source: source/build/src/hash.cpp:208
export function inthash_loop(t, func) {
  if (cPointerCompare(cRecordObject(t).items, null, "==")) {
    return;
  }
  for (let item = cRecordObject(t).items, items_end = cPointerOffset(cRecordObject(t).items, cRecordObject(t).__cxx_anonymous_1.prime.v, 24); cPointerCompare(item, items_end, "<"); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = cPointerOffset(previous, 1, 24); __cxx_lvalue_0.value = next; return next; })(cRef(() => item, __cxx_lvalue_1 => { item = __cxx_lvalue_1; }))) {
    func(cRecordObject(item).key, cRecordObject(item).value);
  }
}

// C/C++ source: source/build/src/hash.cpp:271
export function inthash_delete(t, key) {
  let seeker = cPointerOffset(cRecordObject(t).items, inthash_getbucket(t, key), 24);
  if ((cPointerCompare(cRecordObject(seeker).collision, null, "==") || (cRecordObject(seeker).key == key))) {
    (cRecordObject(seeker).collision = null);
    return;
  }
  while (cPointerCompare(seeker, cRecordObject(seeker).collision, "!=")) {
    let prev = seeker;
    (seeker = cRecordObject(seeker).collision);
    if ((cRecordObject(seeker).key == key)) {
      (cRecordObject(prev).collision = (cPointerCompare(seeker, cRecordObject(seeker).collision, "==") ? prev : cRecordObject(seeker).collision));
      (cRecordObject(seeker).collision = null);
      return;
    }
  }
}

// C/C++ source: source/build/src/hash.cpp:298
export function inthash_find(t, key) {
  let seeker = cPointerOffset(cRecordObject(t).items, inthash_getbucket(t, key), 24);
  if (cPointerCompare(cRecordObject(seeker).collision, null, "==")) {
    return i64((-1));
  }
  if ((cRecordObject(seeker).key == key)) {
    return i64(cRecordObject(seeker).value);
  }
  while (cPointerCompare(seeker, cRecordObject(seeker).collision, "!=")) {
    (seeker = cRecordObject(seeker).collision);
    if ((cRecordObject(seeker).key == key)) {
      return i64(cRecordObject(seeker).value);
    }
  }
  return i64((-1));
}

// C/C++ source: source/build/include/compat.h:1169
export const pow2char__header_global_72c3a3566576ab8b = new Uint8Array([(u32(1) & 255), (u32(2) & 255), (u32(4) & 255), (u32(8) & 255), (u32(16) & 255), (u32(32) & 255), (u32(64) & 255), (u32(128) & 255)]);
function __cxx_static_address_d22ad2f23e822171a171690b() {
  return __cxx_static_address_d22ad2f23e822171a171690b.reference || (__cxx_static_address_d22ad2f23e822171a171690b.reference = {
    __cReference: true,
    get value() { return pow2char__header_global_72c3a3566576ab8b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_d22ad2f23e822171a171690b() { return __cxx_static_address_d22ad2f23e822171a171690b(); }

// C/C++ source: source/build/include/baselayer.h:172
export const g_defaultVideoModes__header_global_f09a70acc80c880d = cByteRecordNDArray({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, [25], {}, [cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 2560, "y": 1440}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 2560, "y": 1200}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 2560, "y": 1080}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1920, "y": 1440}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1920, "y": 1200}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1920, "y": 1080}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1680, "y": 1050}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1600, "y": 1200}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1600, "y": 900}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1366, "y": 768}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1280, "y": 1024}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1280, "y": 960}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1280, "y": 720}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1152, "y": 864}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1024, "y": 768}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1024, "y": 600}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 800, "y": 600}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 640, "y": 480}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 640, "y": 400}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 512, "y": 384}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 480, "y": 360}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 400, "y": 300}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 320, "y": 240}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 320, "y": 200}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 0, "y": 0}, null, {})]);
function __cxx_static_address_bf1f806615fb822698ebb6ce() {
  return __cxx_static_address_bf1f806615fb822698ebb6ce.reference || (__cxx_static_address_bf1f806615fb822698ebb6ce.reference = {
    __cReference: true,
    get value() { return g_defaultVideoModes__header_global_f09a70acc80c880d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:188
export const g_keyAsciiTable__header_global_1285160a08c8502e = new Uint8Array([(u32(0) & 255), (u32(0) & 255), 49, 50, 51, 52, 53, 54, 55, 56, 57, 48, 45, 61, (u32(0) & 255), (u32(0) & 255), 113, 119, 101, 114, 116, 121, 117, 105, 111, 112, 91, 93, (u32(0) & 255), (u32(0) & 255), 97, 115, 100, 102, 103, 104, 106, 107, 108, 59, (u32(39) & 255), 96, (u32(0) & 255), (u32(92) & 255), 122, 120, 99, 118, 98, 110, 109, 44, 46, 47, (u32(0) & 255), 42, (u32(0) & 255), (u32(32) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), 55, 56, 57, 45, 52, 53, 54, 43, 49, 50, 51, 48, 46, (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255)]);
function __cxx_static_address_4dc0b907c36961a47dfaaf29() {
  return __cxx_static_address_4dc0b907c36961a47dfaaf29.reference || (__cxx_static_address_4dc0b907c36961a47dfaaf29.reference = {
    __cReference: true,
    get value() { return g_keyAsciiTable__header_global_1285160a08c8502e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_4dc0b907c36961a47dfaaf29() { return __cxx_static_address_4dc0b907c36961a47dfaaf29(); }

// C/C++ source: source/build/include/baselayer.h:196
export const g_keyAsciiTableShift__header_global_f16006aede3823e3 = new Uint8Array([(u32(0) & 255), (u32(0) & 255), 33, 64, 35, 36, 37, 94, 38, 42, 40, 41, 95, 43, (u32(0) & 255), (u32(0) & 255), 81, 87, 69, 82, 84, 89, 85, 73, 79, 80, 123, 125, (u32(0) & 255), (u32(0) & 255), 65, 83, 68, 70, 71, 72, 74, 75, 76, 58, 34, 126, (u32(0) & 255), 124, 90, 88, 67, 86, 66, 78, 77, 60, 62, 63, (u32(0) & 255), 42, (u32(0) & 255), (u32(32) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), 55, 56, 57, 45, 52, 53, 54, 43, 49, 50, 51, 48, 46, (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255)]);
function __cxx_static_address_eda6dcf0f98a67f9843ea0f7() {
  return __cxx_static_address_eda6dcf0f98a67f9843ea0f7.reference || (__cxx_static_address_eda6dcf0f98a67f9843ea0f7.reference = {
    __cReference: true,
    get value() { return g_keyAsciiTableShift__header_global_f16006aede3823e3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_eda6dcf0f98a67f9843ea0f7() { return __cxx_static_address_eda6dcf0f98a67f9843ea0f7(); }

// C/C++ source: @sysroot/usr/include/c++/12/bits/stl_algobase.h:230
export function min__template_c237f4424e2bda8a(__a, __b) {
  if ((__b.value < __a.value)) {
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

// C/C++ source: @sysroot/usr/include/c++/12/bits/stl_algobase.h:254
export function max__template_b1cfaf2244c73238(__a, __b) {
  if ((__a.value < __b.value)) {
    return __b;
  }
  return __a;
}

export function clamp__header_3d72d3f0c963(__cxx_in, min, max) {
  return i32(((__cxx_in <= i32(min)) ? i32(min) : ((__cxx_in >= i32(max)) ? i32(max) : __cxx_in)));
}

export function swap__header_dd21f3a7cbbc(a, b) {
  let t = (u32((cDeref(a, Uint8Array).value)) & 255);
  ((cDeref(a, Uint8Array).value) = (u32((cDeref(b, Uint8Array).value)) & 255));
  ((cDeref(b, Uint8Array).value) = (u32(t) & 255));
}

export function swap__header_13e7be761365(a, b) {
  let t = (u32((cDeref(a, Uint8Array).value)) & 255);
  ((cDeref(a, Uint8Array).value) = (u32((cDeref(b, Uint8Array).value)) & 255));
  ((cDeref(b, Uint8Array).value) = (u32(t) & 255));
}

export function SILENCE_UNUSED__header_e1486db8f7d5(arg0, arg1) {

}

export function ARRAY_SIZE__header_08fa37b88077(arg0) {
  return u64(188n);
}

export function __cxx_operator_761c63d1e16e183f(lhs, rhs) {
  return cCopyTrivialClass(lhs.__cxx_operator_86b05ee676890126(rhs), ClockTicks(), ["wholeTicks", "ticksS32"]);
}

// Original Clang-generated fragment; imports existing owner storage.
export { hash_init, inthash_init } from "./_source_legacy_hash_cpp_c37bf9ec397e.mjs";

// Original Clang-generated fragment; imports existing owner storage.
export { engineDestroyAllocator__header_10b88093df29, inthash_add, inthash_getbucket__header_8959b4c6e48a, inthash_getcode__header_fe9b32bd5684 } from "./_source_legacy_hash_cpp_34d42385f3c2.mjs";
