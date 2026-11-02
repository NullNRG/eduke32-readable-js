// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/build/src/osd.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
import { Alloc__cxx_static_e0036cfb06bcfe42 } from "./smmalloc_generic.cpp.mjs";
import { Create__cxx_static_b7202f8c9d4230a6 } from "./smmalloc_generic.cpp.mjs";
import { Destroy__cxx_static_777d0ae31c789182 } from "./smmalloc_generic.cpp.mjs";
import { Free__cxx_static_0dfd3f42f0dc2c05 } from "./smmalloc_generic.cpp.mjs";
import { Realloc__cxx_static_478d5da25b6b3923 } from "./smmalloc_generic.cpp.mjs";
import { SDL_AtomicLock } from "../../../browser-abi/sdl_provider.mjs";
import { SDL_AtomicTryLock } from "../../../browser-abi/sdl_provider.mjs";
import { SDL_AtomicUnlock } from "../../../browser-abi/sdl_provider.mjs";
import { calloc } from "../../../browser-abi/libc_provider.mjs";
import { crctab16 } from "./engine.cpp.mjs";
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
import { memmove } from "../../../browser-abi/libc_provider.mjs";
import { memset } from "../../../browser-abi/libc_provider.mjs";
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
import { snprintf } from "../../../browser-abi/libc_provider.mjs";
import { __cxx_global_cell_4a046e33ecf7aced9bfd0007 } from "./engine.cpp.mjs";
import { stat } from "../../../browser-abi/libc_provider.mjs";
import { strcasecmp } from "../../../browser-abi/libc_provider.mjs";
import { strcat } from "../../../browser-abi/libc_provider.mjs";
import { strcpy } from "../../../browser-abi/libc_provider.mjs";
import { strlen } from "../../../browser-abi/libc_provider.mjs";
import { strncasecmp } from "../../../browser-abi/libc_provider.mjs";
import { strncmp } from "../../../browser-abi/libc_provider.mjs";
import { strrchr } from "../../../browser-abi/libc_provider.mjs";
import { strtol } from "../../../browser-abi/libc_provider.mjs";
import { tolower } from "../../../browser-abi/libc_provider.mjs";
import { __cxx_global_cell_4d8aaa64f68587b18e27604c } from "./engine.cpp.mjs";

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
export const fix16_rad_to_deg_mult__header_global_1f20827e10fe1139 = i32(3754936);
function __cxx_static_address_d4221399b31f3211a18d5ea4() {
  return __cxx_static_address_d4221399b31f3211a18d5ea4.reference || (__cxx_static_address_d4221399b31f3211a18d5ea4.reference = {
    __cReference: true,
    get value() { return fix16_rad_to_deg_mult__header_global_1f20827e10fe1139; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:114
export const fix16_deg_to_rad_mult__header_global_3759c702c357b9ef = i32(1144);
function __cxx_static_address_9fd55bfdcbf5a4bd435f7ee1() {
  return __cxx_static_address_9fd55bfdcbf5a4bd435f7ee1.reference || (__cxx_static_address_9fd55bfdcbf5a4bd435f7ee1.reference = {
    __cReference: true,
    get value() { return fix16_deg_to_rad_mult__header_global_3759c702c357b9ef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/clockticks.hpp:20
export function ClockTicks() {
  return ClockTicks.type || (ClockTicks.type = class ClockTicks__implementation {
  static VALUE_MASK = u64(18446744073709486080n);
  static WHOLE_MASK = u64(18446744069414584320n);
  static FRACTION_MASK = u64(4294901760n);
  static FRACTION_16_MASK = u64(65535n);
  constructor() { throw new TypeError("Clang-selected constructor factory required"); }
  __cxx_construct_3fdb0b4b21c3726c() {
    this.__cxx_construct_24afc02e52dafee1(0, u32(0));
    
  }
  static __cxx_construct_3fdb0b4b21c3726c() {
    const value=Object.create(ClockTicks__implementation.prototype);
    value.__cxx_construct_3fdb0b4b21c3726c();
    return value;
  }
  __cxx_construct_8716ed38f1dfa06d(ticks) {
    this.__cxx_construct_24afc02e52dafee1(ticks, u32(0));
    
  }
  static __cxx_construct_8716ed38f1dfa06d(ticks) {
    const value=Object.create(ClockTicks__implementation.prototype);
    value.__cxx_construct_8716ed38f1dfa06d(ticks);
    return value;
  }
  __cxx_construct_24afc02e52dafee1(ticks, fraction) {
        this.set(ticks, (u32(fraction) & 65535));
  }
  static __cxx_construct_24afc02e52dafee1(ticks, fraction) {
    const value=Object.create(ClockTicks__implementation.prototype);
    value.__cxx_construct_24afc02e52dafee1(ticks, fraction);
    return value;
  }
  getFraction() {
    return i64(u64((BigInt(u64((BigInt(u64((BigInt(u64(this.ticksS32)) & BigInt(u64(4294901760n))))) >> BigInt(16)))) | BigInt(((this.ticksS32 < i64(0)) ? u64(18446744073709486080n) : u64(0))))));
  }
  setFraction(fraction) {
    return i64((this.ticksS32 = i64(u64((BigInt(u64((BigInt(u64(this.ticksS32)) & BigInt(u64(18446744069414584320n))))) | BigInt(u64((BigInt(((this.ticksS32 < i64(0)) ? u64((BigInt(u64(i64((BigInt(i64(0)) - BigInt(i64(fraction)))))) & BigInt(u64(65535n)))) : u64(fraction))) << BigInt(16)))))))));
  }
  set(ticks, fraction) {
    (this.ticksS32 = i64(u64((BigInt(u64((BigInt(u64(ticks)) << BigInt(32)))) | BigInt(u64((BigInt(((ticks < 0) ? u64((BigInt(u64(i64((BigInt(i64(0)) - BigInt(i64(fraction)))))) & BigInt(u64(65535n)))) : u64(fraction))) << BigInt(16))))))));
    this.update();
    return i64(this.ticksS32);
  }
  toScale16() {
    return i64((BigInt(this.ticksS32) >> BigInt(16)));
  }
  setFromScale16(ticksScale16) {
    (this.ticksS32 = i64((BigInt(ticksScale16) << BigInt(16))));
    this.update();
    return this;
  }
  static fromScale16(ticksScale16) {
    let ct = (ClockTicks()).__cxx_construct_3fdb0b4b21c3726c();
    ct.setFromScale16(ticksScale16);
    return cCopyTrivialClass(ct, ClockTicks(), ["wholeTicks", "ticksS32"]);
  }
  static compareHighPrecision(a, b) {
    let delta = cCopyTrivialClass(__cxx_operator_761c63d1e16e183f(cCopyTrivialClass(a, ClockTicks(), ["wholeTicks", "ticksS32"]), b), ClockTicks(), ["wholeTicks", "ticksS32"]);
    return i64(delta.toScale16());
  }
  __cxx_operator_d644da4c0f0f209b(rhs) {
    (this.ticksS32 = i64(rhs.ticksS32));
    this.update();
    return this;
  }
  __cxx_operator_c4f1fab776aa8f78(rhs) {
    ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = i64((BigInt(__cxx_lvalue_0.value) + BigInt(rhs.ticksS32)))))(cObjectFieldRef(this, "ticksS32"));
    this.update();
    return this;
  }
  __cxx_operator_86b05ee676890126(rhs) {
    ((__cxx_lvalue_1) => (__cxx_lvalue_1.value = i64((BigInt(__cxx_lvalue_1.value) - BigInt(rhs.ticksS32)))))(cObjectFieldRef(this, "ticksS32"));
    this.update();
    return this;
  }
  __cxx_operator_8bf84e02da7f2596(rhs) {
    (this.ticksS32 = i64((BigInt(i64((BigInt(i64((BigInt(this.ticksS32) >> BigInt(16)))) * BigInt(i64((BigInt(rhs.ticksS32) >> BigInt(16))))))) >> BigInt(16))));
    this.update();
    return this;
  }
  __cxx_operator_8ed849f2ef870086(rhs) {
    (this.ticksS32 = i64((BigInt(i64((BigInt(this.ticksS32) / BigInt(rhs.ticksS32)))) << BigInt(32))));
    this.update();
    return this;
  }
  __cxx_operator_1260acd8fbd617cf(rhs) {
    ((__cxx_lvalue_2) => (__cxx_lvalue_2.value = i64((BigInt(__cxx_lvalue_2.value) % BigInt(rhs.ticksS32)))))(cObjectFieldRef(this, "ticksS32"));
    this.update();
    return this;
  }
  __cxx_operator_2418cc007f602d0f(rhs) {
    (this.ticksS32 = i64((BigInt(this.ticksS32) << BigInt(rhs))));
    this.update();
    return this;
  }
  __cxx_operator_000dfeca36713f18(rhs) {
    (this.ticksS32 = i64((BigInt(this.ticksS32) >> BigInt(rhs))));
    this.update();
    return this;
  }
  __cxx_conversion_e40fd0a4454cd7ec() {
    return u32(this.wholeTicks);
  }
  __cxx_conversion_d67101e1f7110e32() {
    return i32(this.wholeTicks);
  }
  update() {
    (this.wholeTicks = i32(i64((BigInt(this.ticksS32) >> BigInt(32)))));
    ((__cxx_lvalue_3) => (__cxx_lvalue_3.value = i64((BigInt(__cxx_lvalue_3.value) & BigInt(u64(18446744073709486080n))))))(cObjectFieldRef(this, "ticksS32"));
  }
});
}

// C/C++ source: source/build/include/libdivide.h:172
export function libdivide_u32_branchfree_t() {
  return libdivide_u32_branchfree_t.type || (libdivide_u32_branchfree_t.type = class libdivide_u32_branchfree_t__implementation {
  constructor() {
    return Object.setPrototypeOf(cZeroAggregate({"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"magic": {"native": "Uint32Array", "offset": 0, "size": 4}, "more": {"native": "Uint8Array", "offset": 4, "size": 1}}, "overlaps": false, "size": 5, "union": false}}, {}), new.target.prototype);
  }
});
}

// C/C++ source: source/build/include/libdivide.h:142
export function libdivide_u32_t() {
  return libdivide_u32_t.type || (libdivide_u32_t.type = class libdivide_u32_t__implementation {
  constructor() {
    return Object.setPrototypeOf(cZeroAggregate({"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"magic": {"native": "Uint32Array", "offset": 0, "size": 4}, "more": {"native": "Uint8Array", "offset": 4, "size": 1}}, "overlaps": false, "size": 5, "union": false}}, {}), new.target.prototype);
  }
});
}

// C/C++ source: source/build/include/libdivide.h:182
export function libdivide_u64_branchfree_t() {
  return libdivide_u64_branchfree_t.type || (libdivide_u64_branchfree_t.type = class libdivide_u64_branchfree_t__implementation {
  constructor() {
    return Object.setPrototypeOf(cZeroAggregate({"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"magic": {"native": "BigUint64Array", "offset": 0, "size": 8}, "more": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 9, "union": false}}, {}), new.target.prototype);
  }
});
}

// C/C++ source: source/build/include/libdivide.h:152
export function libdivide_u64_t() {
  return libdivide_u64_t.type || (libdivide_u64_t.type = class libdivide_u64_t__implementation {
  constructor() {
    return Object.setPrototypeOf(cZeroAggregate({"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"magic": {"native": "BigUint64Array", "offset": 0, "size": 8}, "more": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 9, "union": false}}, {}), new.target.prototype);
  }
});
}

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

// C/C++ source: source/build/src/osd.cpp:33
export let osd = null;
export function __cxx_global_cell_5a97be12fac9e104b96ea90d() {
  return __cxx_global_cell_5a97be12fac9e104b96ea90d.reference || (__cxx_global_cell_5a97be12fac9e104b96ea90d.reference = {
    __cReference: true,
    get value() { return osd; },
    set value(__cxx_lvalue_0) { osd = __cxx_lvalue_0; }
  });
}

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

// C/C++ source: source/build/src/osd.cpp:39
export let osdlogfn = null;
export function __cxx_global_cell_e90cd4f2377fd5d285556e73() {
  return __cxx_global_cell_e90cd4f2377fd5d285556e73.reference || (__cxx_global_cell_e90cd4f2377fd5d285556e73.reference = {
    __cReference: true,
    get value() { return osdlogfn; },
    set value(__cxx_lvalue_0) { osdlogfn = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/build/src/osd.cpp:41
export let osdkeytime = u32(0);
function __cxx_static_address_11b9de72122e863ace28b30e() {
  return __cxx_static_address_11b9de72122e863ace28b30e.reference || (__cxx_static_address_11b9de72122e863ace28b30e.reference = {
    __cReference: true,
    get value() { return osdkeytime; },
    set value(__cxx_lvalue_0) { osdkeytime = u32(__cxx_lvalue_0); }
  });
}
export function __cxx_private_cell_11b9de72122e863ace28b30e() { return __cxx_static_address_11b9de72122e863ace28b30e(); }

// C/C++ source: source/build/include/fix16.h:31
export const FIX16_MAX__header_global_b35467730dc04c6a = i32(2147483647);
function __cxx_static_address_996fd02201eec11e78d56071() {
  return __cxx_static_address_996fd02201eec11e78d56071.reference || (__cxx_static_address_996fd02201eec11e78d56071.reference = {
    __cReference: true,
    get value() { return FIX16_MAX__header_global_b35467730dc04c6a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:32
export const FIX16_MIN__header_global_3353344dc33d6e39 = i32(2147483648);
function __cxx_static_address_0857463e92baa30e3a6349bd() {
  return __cxx_static_address_0857463e92baa30e3a6349bd.reference || (__cxx_static_address_0857463e92baa30e3a6349bd.reference = {
    __cReference: true,
    get value() { return FIX16_MIN__header_global_3353344dc33d6e39; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:33
export const FIX16_OVERFLOW__header_global_2a07a2526a32bd0f = i32(2147483648);
function __cxx_static_address_f5d44fb831040da3cb2c467a() {
  return __cxx_static_address_f5d44fb831040da3cb2c467a.reference || (__cxx_static_address_f5d44fb831040da3cb2c467a.reference = {
    __cReference: true,
    get value() { return FIX16_OVERFLOW__header_global_2a07a2526a32bd0f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:35
export const fix16_one__header_global_7b9a68c01681fb34 = i32(65536);
function __cxx_static_address_d81385ec5880b6563be09c3e() {
  return __cxx_static_address_d81385ec5880b6563be09c3e.reference || (__cxx_static_address_d81385ec5880b6563be09c3e.reference = {
    __cReference: true,
    get value() { return fix16_one__header_global_7b9a68c01681fb34; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:36
export const fix16_half__header_global_75d6a502adeb2e09 = i32(32768);
function __cxx_static_address_dc35297fafaf04962bb6584e() {
  return __cxx_static_address_dc35297fafaf04962bb6584e.reference || (__cxx_static_address_dc35297fafaf04962bb6584e.reference = {
    __cReference: true,
    get value() { return fix16_half__header_global_75d6a502adeb2e09; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:37
export const flt_f161r__header_global_924f794035c2c765 = Math.fround(Math.fround((Math.fround(1) / Math.fround(65536))));
function __cxx_static_address_ee374c19b812ebeac3f7e478() {
  return __cxx_static_address_ee374c19b812ebeac3f7e478.reference || (__cxx_static_address_ee374c19b812ebeac3f7e478.reference = {
    __cReference: true,
    get value() { return flt_f161r__header_global_924f794035c2c765; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: C:\Users\andre\Documents\Codex\2026-10-13\master-execution-prompt-complete-eduke32-readable\work\toolchains\linux-sysroot\usr\include\x86_64-linux-gnu/bits/byteswap.h:34
export function __bswap_16(__bsx) {
  return (u32((u32(i32((i32((i32((i32(__bsx) >> 8)) & 255)) | i32((i32((i32(__bsx) & 255)) << 8))))) & 65535)) & 65535);
}

// C/C++ source: source/build/src/osd.cpp:49
export function __bswap_32(__bsx) {
  return u32((u32((u32(((u32((__bsx & 4278190080)) >>> 24) | (u32((__bsx & 16711680)) >>> 8))) | u32((u32((__bsx & 65280)) << 8)))) | u32((u32((__bsx & 255)) << 24))));
}

// C/C++ source: source/build/src/osd.cpp:70
export function __bswap_64(__bsx) {
  return u64((BigInt(u64((BigInt(u64((BigInt(u64((BigInt(u64((BigInt(u64((BigInt(u64((BigInt(u64((BigInt(u64((BigInt(u64(__bsx)) & BigInt(18374686479671623680n)))) >> BigInt(56)))) | BigInt(u64((BigInt(u64((BigInt(u64(__bsx)) & BigInt(71776119061217280n)))) >> BigInt(40))))))) | BigInt(u64((BigInt(u64((BigInt(u64(__bsx)) & BigInt(280375465082880n)))) >> BigInt(24))))))) | BigInt(u64((BigInt(u64((BigInt(u64(__bsx)) & BigInt(1095216660480n)))) >> BigInt(8))))))) | BigInt(u64((BigInt(u64((BigInt(u64(__bsx)) & BigInt(4278190080n)))) << BigInt(8))))))) | BigInt(u64((BigInt(u64((BigInt(u64(__bsx)) & BigInt(16711680n)))) << BigInt(24))))))) | BigInt(u64((BigInt(u64((BigInt(u64(__bsx)) & BigInt(65280n)))) << BigInt(40))))))) | BigInt(u64((BigInt(u64((BigInt(u64(__bsx)) & BigInt(255n)))) << BigInt(56))))));
}

// C/C++ source: C:\Users\andre\Documents\Codex\2026-10-13\master-execution-prompt-complete-eduke32-readable\work\toolchains\linux-sysroot\usr\include\x86_64-linux-gnu/bits/uintn-identity.h:33
export function __uint16_identity(__x) {
  return __x;
}

// C/C++ source: source/build/src/osd.cpp:39
export function __uint32_identity(__x) {
  return __x;
}

// C/C++ source: source/build/src/osd.cpp:45
export function __uint64_identity(__x) {
  return __x;
}

// C/C++ source: source/build/src/osd.cpp:47
export function iscanonical__cxx_a3dce400c4f1(__val) {
  return i32((void 0, 1));
}

// C/C++ source: source/build/src/osd.cpp:48
export function iscanonical__cxx_262aebf77d93(__val) {
  return i32((void 0, 1));
}

// C/C++ source: source/build/src/osd.cpp:1003
export function __size_to_integer__cxx_e3394d618576(__n) {
  return i32(__n);
}

// C/C++ source: source/build/src/osd.cpp:1005
export function __size_to_integer__cxx_543ad98a7693(__n) {
  return u32(__n);
}

// C/C++ source: source/build/src/osd.cpp:1007
export function __size_to_integer__cxx_725e18ad9d9e(__n) {
  return i64(__n);
}

// C/C++ source: source/build/src/osd.cpp:1009
export function __size_to_integer__cxx_0a44b83009ba(__n) {
  return u64(__n);
}

// C/C++ source: source/build/src/osd.cpp:1011
export function __size_to_integer__cxx_6ac9c70ccc53(__n) {
  return i64(__n);
}

// C/C++ source: source/build/src/osd.cpp:1013
export function __size_to_integer__cxx_e5265ced1fd8(__n) {
  return u64(__n);
}

// C/C++ source: source/build/src/osd.cpp:1041
export function __size_to_integer__cxx_9725a00dea2c(__n) {
  return i64(__n);
}

// C/C++ source: source/build/src/osd.cpp:1043
export function __size_to_integer__cxx_1f836a5706ff(__n) {
  return i64(__n);
}

// C/C++ source: source/build/src/osd.cpp:1045
export function __size_to_integer__cxx_3bf6d42a3086(__n) {
  return i64(__n);
}

// C/C++ source: source/build/src/osd.cpp:1505
export function __lg__cxx_5d561eceadad(__n) {
  return i32((i32((i32(Math.imul(i32(4), 8)) - 1)) - __builtin_clz(u32(__n))));
}

// C/C++ source: source/build/src/osd.cpp:1509
export function __lg__cxx_bff60accdd0c(__n) {
  return u32(i32((i32((i32(Math.imul(i32(4), 8)) - 1)) - __builtin_clz(__n))));
}

// C/C++ source: source/build/src/osd.cpp:1513
export function __lg__cxx_cfcbf570c404(__n) {
  return i64(i32((i32((i32(Math.imul(i32(8), 8)) - 1)) - __builtin_clzl(u64(__n)))));
}

// C/C++ source: source/build/src/osd.cpp:1517
export function __lg__cxx_a6d660286b2d(__n) {
  return u64(i32((i32((i32(Math.imul(i32(8), 8)) - 1)) - __builtin_clzl(__n))));
}

// C/C++ source: source/build/src/osd.cpp:1521
export function __lg__cxx_2827038c92bd(__n) {
  return i64(i32((i32((i32(Math.imul(i32(8), 8)) - 1)) - __builtin_clzll(u64(__n)))));
}

// C/C++ source: source/build/src/osd.cpp:1525
export function __lg__cxx_42192ce3e0c3(__n) {
  return u64(i32((i32((i32(Math.imul(i32(8), 8)) - 1)) - __builtin_clzll(__n))));
}

// C/C++ source: source/build/src/osd.cpp:174
export function operator_new___ZnwmPv(arg0, __p) {
  return __p;
}

// C/C++ source: source/build/src/osd.cpp:176
export function operator_new_array___ZnamPv(arg0, __p) {
  return __p;
}

// C/C++ source: source/build/src/osd.cpp:180
export function operator_delete___ZdlPvS_(arg0, arg1) {

}

// C/C++ source: source/build/src/osd.cpp:181
export function operator_delete_array___ZdaPvS_(arg0, arg1) {

}

// C/C++ source: source/build/src/osd.cpp:698
export function atoi_safe(str) {
  return i32(strtol(str, null, 10));
}

// C/C++ source: source/build/src/osd.cpp:97
export function _mm_cvtsi64_si32(__m) {
  return i32((cPointerElementRef(__m, 0).value));
}

// C/C++ source: source/build/src/osd.cpp:125
export function _mm_cvtm64_si64(__m) {
  return i64((cPointerElementRef(__m, 0).value));
}

// C/C++ source: source/build/src/osd.cpp:707
export function _mm_mullo_pi16(__m1, __m2) {
  return (__m1 * __m2);
}

// C/C++ source: source/build/src/osd.cpp:1079
export function _mm_and_si64(__m1, __m2) {
  return (__m1 & __m2);
}

// C/C++ source: source/build/src/osd.cpp:1099
export function _mm_andnot_si64(__m1, __m2) {
  return ((~__m1) & __m2);
}

// C/C++ source: source/build/src/osd.cpp:1116
export function _mm_or_si64(__m1, __m2) {
  return (__m1 | __m2);
}

// C/C++ source: source/build/src/osd.cpp:1133
export function _mm_xor_si64(__m1, __m2) {
  return (__m1 ^ __m2);
}

// C/C++ source: source/build/src/osd.cpp:1154
export function _mm_cmpeq_pi8(__m1, __m2) {
  return cPointerCompare(__m1, __m2, "==");
}

// C/C++ source: source/build/src/osd.cpp:1175
export function _mm_cmpeq_pi16(__m1, __m2) {
  return cPointerCompare(__m1, __m2, "==");
}

// C/C++ source: source/build/src/osd.cpp:1196
export function _mm_cmpeq_pi32(__m1, __m2) {
  return cPointerCompare(__m1, __m2, "==");
}

// C/C++ source: source/build/src/osd.cpp:55
export function _mm_free(__p) {
  free(__p);
}

// C/C++ source: C:/Users/andre/Documents/Codex/2026-10-13/master-execution-prompt-complete-eduke32-readable/work/toolchains/llvm-mingw-20261006-ucrt-x86_64/lib/clang/23/include/xmmintrin.h:79
export function _mm_add_ss(__a, __b) {
  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = Math.fround((__cxx_lvalue_0.value + (cPointerElementRef(__b, 0).value)))))(cPointerElementRef(__a, 0));
  return __a;
}

// C/C++ source: source/build/src/osd.cpp:119
export function _mm_sub_ss(__a, __b) {
  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = Math.fround((__cxx_lvalue_0.value - (cPointerElementRef(__b, 0).value)))))(cPointerElementRef(__a, 0));
  return __a;
}

// C/C++ source: source/build/src/osd.cpp:160
export function _mm_mul_ss(__a, __b) {
  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = Math.fround((__cxx_lvalue_0.value * (cPointerElementRef(__b, 0).value)))))(cPointerElementRef(__a, 0));
  return __a;
}

// C/C++ source: source/build/src/osd.cpp:179
export function _mm_mul_ps(__a, __b) {
  return Math.fround((__a * __b));
}

// C/C++ source: source/build/src/osd.cpp:200
export function _mm_div_ss(__a, __b) {
  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = Math.fround((__cxx_lvalue_0.value / (cPointerElementRef(__b, 0).value)))))(cPointerElementRef(__a, 0));
  return __a;
}

// C/C++ source: source/build/src/osd.cpp:218
export function _mm_div_ps(__a, __b) {
  return Math.fround((__a / __b));
}

// C/C++ source: source/build/src/osd.cpp:426
export function _mm_and_ps(__a, __b) {
  return (__a & __b);
}

// C/C++ source: source/build/src/osd.cpp:447
export function _mm_andnot_ps(__a, __b) {
  return ((~__a) & __b);
}

// C/C++ source: source/build/src/osd.cpp:464
export function _mm_or_ps(__a, __b) {
  return (__a | __b);
}

// C/C++ source: source/build/src/osd.cpp:482
export function _mm_xor_ps(__a, __b) {
  return (__a ^ __b);
}

// C/C++ source: source/build/src/osd.cpp:1606
export function _mm_cvtsi32_ss(__a, __b) {
  ((cPointerElementRef(__a, 0).value) = Math.fround(Math.fround(__b)));
  return __a;
}

// C/C++ source: source/build/src/osd.cpp:1628
export function _mm_cvt_si2ss(__a, __b) {
  return _mm_cvtsi32_ss(__a, __b);
}

// C/C++ source: source/build/src/osd.cpp:1652
export function _mm_cvtsi64_ss(__a, __b) {
  ((cPointerElementRef(__a, 0).value) = Math.fround(Math.fround(__b)));
  return __a;
}

// C/C++ source: source/build/src/osd.cpp:1720
export function _mm_cvtss_f32(__a) {
  return Math.fround((cPointerElementRef(__a, 0).value));
}

// C/C++ source: source/build/src/osd.cpp:1839
export function _mm_load_ps(__p) {
  return (__p).value;
}

// C/C++ source: source/build/src/osd.cpp:1856
export function _mm_loadu_ps(__p) {

  return cRecordObject(cRecordPointer(__p, {"align": 1, "arrayAlign": 1, "fields": {"__v": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "size": 16, "union": false}, {})).__v;
}

// C/C++ source: source/build/src/osd.cpp:2072
export function _mm_store_ss(__p, __a) {

  (cRecordObject(cRecordPointer(__p, {"align": 4, "arrayAlign": 1, "fields": {"__u": {"native": "Float32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 4, "union": false}, {})).__u = Math.fround((cPointerElementRef(__a, 0).value)));
}

// C/C++ source: source/build/src/osd.cpp:2093
export function _mm_storeu_ps(__p, __a) {

  (cRecordObject(cRecordPointer(__p, {"align": 1, "arrayAlign": 1, "fields": {"__v": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "size": 16, "union": false}, {})).__v = __a);
}

// C/C++ source: source/build/src/osd.cpp:2114
export function _mm_store_ps(__p, __a) {
  ((__p).value = __a);
}

// C/C++ source: source/build/src/osd.cpp:2796
export function _mm_move_ss(__a, __b) {
  ((cPointerElementRef(__a, 0).value) = Math.fround((cPointerElementRef(__b, 0).value)));
  return __a;
}

// C/C++ source: source/build/src/osd.cpp:80
export function _mm_add_sd(__a, __b) {
  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = (__cxx_lvalue_0.value + (cPointerElementRef(__b, 0).value))))(cPointerElementRef(__a, 0));
  return __a;
}

// C/C++ source: source/build/src/osd.cpp:120
export function _mm_sub_sd(__a, __b) {
  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = (__cxx_lvalue_0.value - (cPointerElementRef(__b, 0).value))))(cPointerElementRef(__a, 0));
  return __a;
}

// C/C++ source: source/build/src/osd.cpp:159
export function _mm_mul_sd(__a, __b) {
  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = (__cxx_lvalue_0.value * (cPointerElementRef(__b, 0).value))))(cPointerElementRef(__a, 0));
  return __a;
}

// C/C++ source: source/build/src/osd.cpp:177
export function _mm_mul_pd(__a, __b) {
  return (__a * __b);
}

// C/C++ source: source/build/src/osd.cpp:199
export function _mm_div_sd(__a, __b) {
  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = (__cxx_lvalue_0.value / (cPointerElementRef(__b, 0).value))))(cPointerElementRef(__a, 0));
  return __a;
}

// C/C++ source: source/build/src/osd.cpp:218
export function _mm_div_pd(__a, __b) {
  return (__a / __b);
}

// C/C++ source: source/build/src/osd.cpp:366
export function _mm_and_pd(__a, __b) {
  return (__a & __b);
}

// C/C++ source: source/build/src/osd.cpp:387
export function _mm_andnot_pd(__a, __b) {
  return ((~__a) & __b);
}

// C/C++ source: source/build/src/osd.cpp:403
export function _mm_or_pd(__a, __b) {
  return (__a | __b);
}

// C/C++ source: source/build/src/osd.cpp:420
export function _mm_xor_pd(__a, __b) {
  return (__a ^ __b);
}

// C/C++ source: source/build/src/osd.cpp:1410
export function _mm_cvtsi32_sd(__a, __b) {
  ((cPointerElementRef(__a, 0).value) = __b);
  return __a;
}

// C/C++ source: source/build/src/osd.cpp:1435
export function _mm_cvtss_sd(__a, __b) {
  ((cPointerElementRef(__a, 0).value) = (cPointerElementRef(__b, 0).value));
  return __a;
}

// C/C++ source: source/build/src/osd.cpp:1548
export function _mm_cvtsd_f64(__a) {
  return (cPointerElementRef(__a, 0).value);
}

// C/C++ source: source/build/src/osd.cpp:1563
export function _mm_load_pd(__dp) {
  return (__dp).value;
}

// C/C++ source: source/build/src/osd.cpp:1619
export function _mm_loadu_pd(__dp) {

  return cRecordObject(cRecordPointer(__dp, {"align": 1, "arrayAlign": 1, "fields": {"__v": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "size": 16, "union": false}, {})).__v;
}

// C/C++ source: source/build/src/osd.cpp:1887
export function _mm_move_sd(__a, __b) {
  ((cPointerElementRef(__a, 0).value) = (cPointerElementRef(__b, 0).value));
  return __a;
}

// C/C++ source: source/build/src/osd.cpp:1903
export function _mm_store_sd(__dp, __a) {

  (cRecordObject(cRecordPointer(__dp, {"align": 8, "arrayAlign": 1, "fields": {"__u": {"native": "Float64Array", "offset": 0, "size": 8}}, "overlaps": false, "size": 8, "union": false}, {})).__u = (cPointerElementRef(__a, 0).value));
}

// C/C++ source: source/build/src/osd.cpp:1924
export function _mm_store_pd(__dp, __a) {
  ((__dp).value = __a);
}

// C/C++ source: source/build/src/osd.cpp:1980
export function _mm_storeu_pd(__dp, __a) {

  (cRecordObject(cRecordPointer(__dp, {"align": 1, "arrayAlign": 1, "fields": {"__v": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "size": 16, "union": false}, {})).__v = __a);
}

// C/C++ source: source/build/src/osd.cpp:2019
export function _mm_storeh_pd(__dp, __a) {

  (cRecordObject(__dp).__u = (cPointerElementRef(__a, 1).value));
}

// C/C++ source: source/build/src/osd.cpp:2038
export function _mm_storel_pd(__dp, __a) {

  (cRecordObject(__dp).__u = (cPointerElementRef(__a, 0).value));
}

// C/C++ source: source/build/src/osd.cpp:2121
export function _mm_add_si64(__a, __b) {
  return u64((BigInt((cPointerElementRef(__a, 0).value)) + BigInt((cPointerElementRef(__b, 0).value))));
}

// C/C++ source: source/build/src/osd.cpp:2427
export function _mm_mullo_epi16(__a, __b) {
  return (__a * __b);
}

// C/C++ source: source/build/src/osd.cpp:2553
export function _mm_sub_si64(__a, __b) {
  return u64((BigInt((cPointerElementRef(__a, 0).value)) - BigInt((cPointerElementRef(__b, 0).value))));
}

// C/C++ source: source/build/src/osd.cpp:2674
export function _mm_and_si128(__a, __b) {
  return (__a & __b);
}

// C/C++ source: source/build/src/osd.cpp:2693
export function _mm_andnot_si128(__a, __b) {
  return ((~__a) & __b);
}

// C/C++ source: source/build/src/osd.cpp:2709
export function _mm_or_si128(__a, __b) {
  return (__a | __b);
}

// C/C++ source: source/build/src/osd.cpp:2726
export function _mm_xor_si128(__a, __b) {
  return (__a ^ __b);
}

// C/C++ source: source/build/src/osd.cpp:3087
export function _mm_cmpeq_epi8(__a, __b) {
  return cPointerCompare(__a, __b, "==");
}

// C/C++ source: source/build/src/osd.cpp:3106
export function _mm_cmpeq_epi16(__a, __b) {
  return cPointerCompare(__a, __b, "==");
}

// C/C++ source: source/build/src/osd.cpp:3125
export function _mm_cmpeq_epi32(__a, __b) {
  return cPointerCompare(__a, __b, "==");
}

// C/C++ source: source/build/src/osd.cpp:3270
export function _mm_cvtsi64_sd(__a, __b) {
  ((cPointerElementRef(__a, 0).value) = __b);
  return __a;
}

// C/C++ source: source/build/src/osd.cpp:3409
export function _mm_cvtsi128_si32(__a) {
  let __b = __a;
  return i32((cPointerElementRef(__b, 0).value));
}

// C/C++ source: source/build/src/osd.cpp:3426
export function _mm_cvtsi128_si64(__a) {
  return i64((cPointerElementRef(__a, 0).value));
}

// C/C++ source: source/build/src/osd.cpp:3441
export function _mm_load_si128(__p) {
  return (__p).value;
}

// C/C++ source: source/build/src/osd.cpp:3456
export function _mm_loadu_si128(__p) {

  return cRecordObject(cRecordPointer(__p, {"align": 1, "arrayAlign": 1, "fields": {"__v": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "size": 16, "union": false}, {})).__v;
}

// C/C++ source: source/build/src/osd.cpp:3894
export function _mm_store_si128(__p, __b) {
  ((__p).value = __b);
}

// C/C++ source: source/build/src/osd.cpp:3909
export function _mm_storeu_si128(__p, __b) {

  (cRecordObject(cRecordPointer(__p, {"align": 1, "arrayAlign": 1, "fields": {"__v": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "size": 16, "union": false}, {})).__v = __b);
}

// C/C++ source: source/build/src/osd.cpp:3929
export function _mm_storeu_si64(__p, __b) {

  (cRecordObject(cRecordPointer(__p, {"align": 8, "arrayAlign": 1, "fields": {"__v": {"native": "BigInt64Array", "offset": 0, "size": 8}}, "overlaps": false, "size": 8, "union": false}, {})).__v = i64((cPointerElementRef(__b, 0).value)));
}

// C/C++ source: source/build/src/osd.cpp:3949
export function _mm_storeu_si32(__p, __b) {

  (cRecordObject(cRecordPointer(__p, {"align": 4, "arrayAlign": 1, "fields": {"__v": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 4, "union": false}, {})).__v = i32((cPointerElementRef(__b, 0).value)));
}

// C/C++ source: source/build/src/osd.cpp:3969
export function _mm_storeu_si16(__p, __b) {

  (cRecordObject(cRecordPointer(__p, {"align": 2, "arrayAlign": 1, "fields": {"__v": {"native": "Int16Array", "offset": 0, "size": 2}}, "overlaps": false, "size": 2, "union": false}, {})).__v = ((u32((cPointerElementRef(__b, 0).value)) << 16) >> 16));
}

// C/C++ source: source/build/src/osd.cpp:4017
export function _mm_storel_epi64(__p, __a) {

  (cRecordObject(cRecordPointer(__p, {"align": 8, "arrayAlign": 1, "fields": {"__u": {"native": "BigInt64Array", "offset": 0, "size": 8}}, "overlaps": false, "size": 8, "union": false}, {})).__u = i64((cPointerElementRef(__a, 0).value)));
}

// C/C++ source: source/build/src/osd.cpp:4613
export function _mm_movepi64_pi64(__a) {
  return (cPointerElementRef(__a, 0).value);
}

// C/C++ source: source/build/src/osd.cpp:4751
export function _mm_castpd_ps(__a) {
  return __a;
}

// C/C++ source: source/build/src/osd.cpp:4767
export function _mm_castpd_si128(__a) {
  return __a;
}

// C/C++ source: source/build/src/osd.cpp:4783
export function _mm_castps_pd(__a) {
  return __a;
}

// C/C++ source: source/build/src/osd.cpp:4799
export function _mm_castps_si128(__a) {
  return __a;
}

// C/C++ source: source/build/src/osd.cpp:4815
export function _mm_castsi128_ps(__a) {
  return __a;
}

// C/C++ source: source/build/src/osd.cpp:4831
export function _mm_castsi128_pd(__a) {
  return __a;
}

// C/C++ source: source/build/src/osd.cpp:942
export function B_SWAP16_impl(value) {
  return (u32((u32(((u32((u32(value) & 65280)) >>> 8) | u32((u32((u32(value) & 255)) << 8)))) & 65535)) & 65535);
}

// C/C++ source: source/build/src/osd.cpp:948
export function B_SWAP32_impl(value) {
  return u32((u32((u32(((u32((value & 4278190080)) >>> 24) | (u32((value & 16711680)) >>> 8))) | u32((u32((value & 65280)) << 8)))) | u32((u32((value & 255)) << 24))));
}

// C/C++ source: source/build/src/osd.cpp:956
export function B_SWAP64_impl(value) {
  return u64((BigInt(u64((BigInt(u64((BigInt(u64((BigInt(u64((BigInt(u64((BigInt(u64((BigInt(u64((BigInt(u64((BigInt(u64(value)) & BigInt(18374686479671623680n)))) >> BigInt(56n)))) | BigInt(u64((BigInt(u64((BigInt(u64(value)) & BigInt(71776119061217280n)))) >> BigInt(40n))))))) | BigInt(u64((BigInt(u64((BigInt(u64(value)) & BigInt(280375465082880n)))) >> BigInt(24n))))))) | BigInt(u64((BigInt(u64((BigInt(u64(value)) & BigInt(1095216660480n)))) >> BigInt(8n))))))) | BigInt(u64((BigInt(u64((BigInt(u64(value)) & BigInt(4278190080n)))) << BigInt(8n))))))) | BigInt(u64((BigInt(u64((BigInt(u64(value)) & BigInt(16711680n)))) << BigInt(24n))))))) | BigInt(u64((BigInt(u64((BigInt(u64(value)) & BigInt(65280n)))) << BigInt(40n))))))) | BigInt(u64((BigInt(u64((BigInt(u64(value)) & BigInt(255n)))) << BigInt(56n))))));
}

// C/C++ source: source/build/src/osd.cpp:1031
export function B_BUF16(buf, x) {
  ((cDeref(cTypedPointer(buf, Uint16Array), Uint16Array).value) = (u32(x) & 65535));
}

// C/C++ source: source/build/src/osd.cpp:1032
export function B_BUF32(buf, x) {
  ((cDeref(cTypedPointer(buf, Uint32Array), Uint32Array).value) = u32(x));
}

// C/C++ source: source/build/src/osd.cpp:1033
export function B_BUF64(buf, x) {
  ((cDeref(cTypedPointer(buf, BigUint64Array), BigUint64Array).value) = u64(x));
}

// C/C++ source: source/build/src/osd.cpp:1035
export function B_UNBUF16(buf) {
  return (u32((cDeref(cTypedPointer(buf, Uint16Array), Uint16Array).value)) & 65535);
}

// C/C++ source: source/build/src/osd.cpp:1036
export function B_UNBUF32(buf) {
  return u32((cDeref(cTypedPointer(buf, Uint32Array), Uint32Array).value));
}

// C/C++ source: source/build/src/osd.cpp:1037
export function B_UNBUF64(buf) {
  return u64((cDeref(cTypedPointer(buf, BigUint64Array), BigUint64Array).value));
}

// C/C++ source: source/build/src/osd.cpp:1161
export function nextPow2(value) {
  let i = i32(1);
  while ((i < value)) {
    (i = i32((i << 1)));
  }
  return i32(i);
}

// C/C++ source: source/build/src/osd.cpp:1231
export function system_15bit_rand() {
  return (u32((u32(i32((i32((u32((u32(rand()) & 65535)) & 65535)) & 32767))) & 65535)) & 65535);
}

// C/C++ source: source/build/src/osd.cpp:1235
export function Bstrncpyz(dst, src, n) {
  if ((n > u64(0))) {
    memcpy(dst, src, (min__template_c237f4424e2bda8a(((__cxx_lvalue_0) => cRef(() => __cxx_lvalue_0, () => { throw new TypeError("const C++ reference write"); }))(u64((BigInt(strlen(src)) + BigInt(u64(1))))), ((__cxx_lvalue_1) => cRef(() => __cxx_lvalue_1, () => { throw new TypeError("const C++ reference write"); }))(u64((BigInt(n) - BigInt(u64(1))))))).value);
    ((cDeref(cPointerOffset(dst, u64((BigInt(n) - BigInt(u64(1)))), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32(0) & 255));
  }
  return dst;
}

// C/C++ source: source/build/src/osd.cpp:1249
export function append_ext_UNSAFE(outbuf, ext) {
  let p = strrchr(outbuf, i32(46));
  if ((!p)) {
    strcat(outbuf, ext);
  } else {
    strcpy(p, ext);
  }
}

// C/C++ source: source/build/src/osd.cpp:1210
export function atomic_flag_test_and_set_explicit__cxx_a39490b838d7(__a, __m) {
  return Boolean(cRecordObject(__a).test_and_set(__m));
}

// C/C++ source: source/build/src/osd.cpp:1215
export function atomic_flag_test_and_set_explicit__cxx_952567d4aa99(__a, __m) {
  return Boolean(cRecordObject(__a).test_and_set(__m));
}

// C/C++ source: source/build/src/osd.cpp:1220
export function atomic_flag_clear_explicit__cxx_ea63028b83e9(__a, __m) {
  cRecordObject(__a).clear(__m);
}

// C/C++ source: source/build/src/osd.cpp:1224
export function atomic_flag_clear_explicit__cxx_007242ccac28(__a, __m) {
  cRecordObject(__a).clear(__m);
}

// C/C++ source: source/build/src/osd.cpp:1229
export function atomic_flag_test_and_set__cxx_85534dc05179(__a) {
  return Boolean(atomic_flag_test_and_set_explicit__cxx_a39490b838d7(__a, 5));
}

// C/C++ source: source/build/src/osd.cpp:1233
export function atomic_flag_test_and_set__cxx_d645fe1f44da(__a) {
  return Boolean(atomic_flag_test_and_set_explicit__cxx_952567d4aa99(__a, 5));
}

// C/C++ source: source/build/src/osd.cpp:1237
export function atomic_flag_clear__cxx_db2efd6de9ef(__a) {
  atomic_flag_clear_explicit__cxx_ea63028b83e9(__a, 5);
}

// C/C++ source: source/build/src/osd.cpp:1241
export function atomic_flag_clear__cxx_f43bec967889(__a) {
  atomic_flag_clear_explicit__cxx_007242ccac28(__a, 5);
}

// C/C++ source: source/build/src/osd.cpp:62
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

// C/C++ source: source/build/src/osd.cpp:218
export function wcspbrk(__s1, __s2) {
  return wcspbrk(__s1, __s2);
}

// C/C++ source: source/build/src/osd.cpp:222
export function wcsrchr(__p, __c) {
  return wcsrchr(__p, __c);
}

// C/C++ source: source/build/src/osd.cpp:226
export function wcsstr(__s1, __s2) {
  return wcsstr(__s1, __s2);
}

// C/C++ source: source/build/src/osd.cpp:230
export function wmemchr(__p, __c, __n) {
  return wmemchr(__p, __c, __n);
}

// C/C++ source: source/build/src/osd.cpp:300
export function __gthread_active_p() {
  return i32(1);
}

// C/C++ source: source/build/src/osd.cpp:685
export function __gthread_self() {
  return pthread_self();
}

// C/C++ source: source/build/src/osd.cpp:697
export function __gthread_once(__once, __func) {
  if (Boolean(__gthread_active_p())) {
    return i32(pthread_once(__once, __func));
  } else {
    return i32((-1));
  }
}

// C/C++ source: source/build/src/osd.cpp:706
export function __gthread_key_create(__key, __dtor) {
  return i32(pthread_key_create(__key, __dtor));
}

// C/C++ source: source/build/src/osd.cpp:712
export function __gthread_key_delete(__key) {
  return i32(pthread_key_delete(__key));
}

// C/C++ source: source/build/src/osd.cpp:718
export function __gthread_getspecific(__key) {
  return pthread_getspecific(__key);
}

// C/C++ source: source/build/src/osd.cpp:724
export function __gthread_setspecific(__key, __ptr) {
  return i32(pthread_setspecific(__key, __ptr));
}

// C/C++ source: source/build/src/osd.cpp:730
export function __gthread_mutex_init_function(__mutex) {
  if (Boolean(__gthread_active_p())) {
    pthread_mutex_init(__mutex, null);
  }
}

// C/C++ source: source/build/src/osd.cpp:737
export function __gthread_mutex_destroy(__mutex) {
  if (Boolean(__gthread_active_p())) {
    return i32(pthread_mutex_destroy(__mutex));
  } else {
    return i32(0);
  }
}

// C/C++ source: source/build/src/osd.cpp:746
export function __gthread_mutex_lock(__mutex) {
  if (Boolean(__gthread_active_p())) {
    return i32(pthread_mutex_lock(__mutex));
  } else {
    return i32(0);
  }
}

// C/C++ source: source/build/src/osd.cpp:755
export function __gthread_mutex_trylock(__mutex) {
  if (Boolean(__gthread_active_p())) {
    return i32(pthread_mutex_trylock(__mutex));
  } else {
    return i32(0);
  }
}

// C/C++ source: source/build/src/osd.cpp:776
export function __gthread_mutex_unlock(__mutex) {
  if (Boolean(__gthread_active_p())) {
    return i32(pthread_mutex_unlock(__mutex));
  } else {
    return i32(0);
  }
}

// C/C++ source: source/build/src/osd.cpp:809
export function __gthread_recursive_mutex_lock(__mutex) {
  return i32(__gthread_mutex_lock(__mutex));
}

// C/C++ source: source/build/src/osd.cpp:815
export function __gthread_recursive_mutex_trylock(__mutex) {
  return i32(__gthread_mutex_trylock(__mutex));
}

// C/C++ source: source/build/src/osd.cpp:830
export function __gthread_recursive_mutex_unlock(__mutex) {
  return i32(__gthread_mutex_unlock(__mutex));
}

// C/C++ source: source/build/src/osd.cpp:836
export function __gthread_recursive_mutex_destroy(__mutex) {
  return i32(__gthread_mutex_destroy(__mutex));
}

// C/C++ source: source/build/src/osd.cpp:82
export function __exchange_and_add_single(__mem, __val) {
  let __result = i32((cDeref(__mem, Int32Array).value));
  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = i32((Number(__cxx_lvalue_0.value) + Number(__val)))))(cDeref(__mem, Int32Array));
  return __result;
}

// C/C++ source: source/build/src/osd.cpp:91
export function __atomic_add_single(__mem, __val) {
  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = i32((Number(__cxx_lvalue_0.value) + Number(__val)))))(cDeref(__mem, Int32Array));
}

// C/C++ source: source/build/src/osd.cpp:223
export function swap__cxx_7c777213a9e6(__lhs, __rhs) {
  __lhs.swap(__rhs);
}

// C/C++ source: source/build/src/osd.cpp:151
export function __rethrow_if_nested_impl(arg0) {

}

// C/C++ source: source/build/src/osd.cpp:113
export function declare_reachable(arg0) {

}

// C/C++ source: source/build/src/osd.cpp:122
export function declare_no_pointers(arg0, arg1) {

}

// C/C++ source: source/build/src/osd.cpp:126
export function undeclare_no_pointers(arg0, arg1) {

}

// C/C++ source: source/build/src/osd.cpp:130
export function get_pointer_safety() {
  return 0;
}

// C/C++ source: source/build/src/osd.cpp:135
export function IsAligned(v, alignment) {
  let lowBits = u64((BigInt(v) & BigInt(u64((BigInt(alignment) - BigInt(u64(1)))))));
  return Boolean((lowBits == u64(0)));
}

// C/C++ source: source/build/src/osd.cpp:141
export function Align(val, alignment) {
  ;
  let r = u64((BigInt(u64((BigInt(val) + BigInt(u64((BigInt(alignment) - BigInt(u64(1)))))))) & BigInt(u64((~u64((BigInt(alignment) - BigInt(u64(1)))))))));
  ;
  return u64(r);
}

// C/C++ source: source/build/src/osd.cpp:851
export function _sm_allocator_thread_cache_destroy(allocator) {
  if (cPointerCompare(allocator, null, "==")) {
    return;
  }
  cRecordObject(allocator).DestroyThreadCache();
}

// C/C++ source: source/build/src/osd.cpp:861
export function _sm_malloc(allocator, bytesCount, alignment) {
  return cRecordObject(allocator).Alloc(bytesCount, alignment);
}

// C/C++ source: source/build/src/osd.cpp:866
export function _sm_free(allocator, p) {
  return cRecordObject(allocator).Free(p);
}

// C/C++ source: source/build/src/osd.cpp:868
export function _sm_realloc(allocator, p, bytesCount, alignment) {
  return cRecordObject(allocator).Realloc(p, bytesCount, alignment);
}

// C/C++ source: source/build/src/osd.cpp:873
export function _sm_msize(allocator, p) {
  return u64(cRecordObject(allocator).GetUsableSize(p));
}

// C/C++ source: source/build/src/osd.cpp:875
export function _sm_mbucket(allocator, p) {
  return i32(cRecordObject(allocator).GetBucketIndex(p));
}

// C/C++ source: source/build/src/osd.cpp:1361
export function engineCreateAllocator() {
  (__cxx_global_cell_11016d3c7177543e564ab46c().value = Create__cxx_static_b7202f8c9d4230a6());
}

// C/C++ source: source/build/src/osd.cpp:1367
export function engineDestroyAllocator() {
  Destroy__cxx_static_777d0ae31c789182(__cxx_global_cell_11016d3c7177543e564ab46c().value);
}

// C/C++ source: source/build/src/osd.cpp:1378
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

// C/C++ source: source/build/src/osd.cpp:1392
export function xmalloc(size) {
  let ptr = Alloc__cxx_static_e0036cfb06bcfe42(__cxx_global_cell_11016d3c7177543e564ab46c().value, size, u64(16));
  if (cPointerCompare(ptr, null, "!=")) {
    return ptr;
  }
  handle_memerr(i32(size));
  __builtin_unreachable();
}

// C/C++ source: source/build/src/osd.cpp:1400
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

// C/C++ source: source/build/src/osd.cpp:1413
export function xrealloc(ptr, size) {
  let newptr = Realloc__cxx_static_478d5da25b6b3923(__cxx_global_cell_11016d3c7177543e564ab46c().value, ptr, size, u64(16));
  if ((cPointerCompare(newptr, null, "!=") || (size == u64(0)))) {
    return newptr;
  }
  handle_memerr(i32(size));
  __builtin_unreachable();
}

// C/C++ source: source/build/src/osd.cpp:1428
export function xaligned_alloc(alignment, size) {
  let ptr = Alloc__cxx_static_e0036cfb06bcfe42(__cxx_global_cell_11016d3c7177543e564ab46c().value, size, alignment);
  if (cPointerCompare(ptr, null, "!=")) {
    return ptr;
  }
  handle_memerr(i32(size));
  __builtin_unreachable();
}

// C/C++ source: source/build/src/osd.cpp:1436
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

// C/C++ source: source/build/src/osd.cpp:1449
export function xfree(ptr) {
  Free__cxx_static_0dfd3f42f0dc2c05(__cxx_global_cell_11016d3c7177543e564ab46c().value, ptr);
}

// C/C++ source: source/build/src/osd.cpp:1450
export function xaligned_free(ptr) {
  Free__cxx_static_0dfd3f42f0dc2c05(__cxx_global_cell_11016d3c7177543e564ab46c().value, ptr);
}

// C/C++ source: source/build/src/osd.cpp:1592
export function maybe_grow_buffer(buffer, buffersize, newsize) {
  if ((newsize > (cDeref(buffersize, Int32Array).value))) {
    ((cPointerElementRef(buffer, 0).value) = cTypedPointer(xrealloc((cPointerElementRef(buffer, 0).value), u64(newsize)), Uint8Array));
    ((cDeref(buffersize, Int32Array).value) = i32(newsize));
  }
}

// C/C++ source: source/build/src/osd.cpp:308
export function libdivide_mullhi_u16(x, y) {
  let xl = u32(x);
  let yl = u32(y);
  let rl = u32(Math.imul(xl, yl));
  return (u32((u32((u32((rl >>> 16)) & 65535)) & 65535)) & 65535);
}

// C/C++ source: source/build/src/osd.cpp:314
export function libdivide_mullhi_s16(x, y) {
  let xl = i32(x);
  let yl = i32(y);
  let rl = i32(Math.imul(xl, yl));
  return ((u32(((u32(((u32(i32((rl >> 16))) << 16) >> 16)) << 16) >> 16)) << 16) >> 16);
}

// C/C++ source: source/build/src/osd.cpp:321
export function libdivide_mullhi_u32(x, y) {
  let xl = u64(x);
  let yl = u64(y);
  let rl = u64((BigInt(xl) * BigInt(yl)));
  return u32(u64((BigInt(rl) >> BigInt(32))));
}

// C/C++ source: source/build/src/osd.cpp:327
export function libdivide_mullhi_s32(x, y) {
  let xl = i64(x);
  let yl = i64(y);
  let rl = i64((BigInt(xl) * BigInt(yl)));
  return i32(i64((BigInt(rl) >> BigInt(32))));
}

// C/C++ source: source/build/src/osd.cpp:334
export function libdivide_mullhi_u64(x, y) {
  let xl = u128(u128(x));
  let yl = u128(u128(y));
  let rl = u128(u128((BigInt(xl) * BigInt(yl))));
  return u64(u128((BigInt(rl) >> BigInt(64))));
}

// C/C++ source: source/build/src/osd.cpp:360
export function libdivide_mullhi_s64(x, y) {
  let xl = i128(i128(x));
  let yl = i128(i128(y));
  let rl = i128(i128((BigInt(xl) * BigInt(yl))));
  return i64(i128((BigInt(rl) >> BigInt(64))));
}

// C/C++ source: source/build/src/osd.cpp:382
export function libdivide_count_leading_zeros16(val) {
  return ((u32(((u32(i32((__builtin_clz(u32(val)) - 16))) << 16) >> 16)) << 16) >> 16);
}

// C/C++ source: source/build/src/osd.cpp:412
export function libdivide_count_leading_zeros32(val) {
  return i32(__builtin_clz(val));
}

// C/C++ source: source/build/src/osd.cpp:441
export function libdivide_count_leading_zeros64(val) {
  return i32(__builtin_clzll(u64(val)));
}

// C/C++ source: source/build/src/osd.cpp:462
export function libdivide_32_div_16_to_16(u1, u0, v, r) {
  let n = u32((u32((u32(u1) << 16)) | u32(u0)));
  let result = (u32((u32((u32(Math.trunc(n / u32(v))) & 65535)) & 65535)) & 65535);
  ((cDeref(r, Uint16Array).value) = (u32((u32((u32((n - u32(Math.imul(u32(result), u32(v))))) & 65535)) & 65535)) & 65535));
  return (u32(result) & 65535);
}

// C/C++ source: source/build/src/osd.cpp:606
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

// C/C++ source: source/build/src/osd.cpp:42
export function fix16_to_int(a) {
  return i32(Math.trunc(i32((a + ((a >= 0) ? fix16_half__header_global_75d6a502adeb2e09 : (-fix16_half__header_global_75d6a502adeb2e09)))) / fix16_one__header_global_7b9a68c01681fb34));
}

// C/C++ source: source/build/src/osd.cpp:43
export function fix16_to_float(a) {
  return Math.fround(Math.fround((Math.fround(Math.fround(a)) * flt_f161r__header_global_924f794035c2c765)));
}

// C/C++ source: source/build/src/osd.cpp:44
export function fix16_to_dbl(a) {
  return (a * flt_f161r__header_global_924f794035c2c765);
}

// C/C++ source: source/build/src/osd.cpp:46
export function fix16_from_int(a) {
  return i32(Math.imul(a, fix16_one__header_global_7b9a68c01681fb34));
}

// C/C++ source: source/build/src/osd.cpp:47
export function fix16_from_float(a) {
  return i32(Math.fround((Math.fround((a * Math.fround(fix16_one__header_global_7b9a68c01681fb34))) + ((a >= Math.fround(0)) ? Math.fround(0.5) : (-Math.fround(0.5))))));
}

// C/C++ source: source/build/src/osd.cpp:48
export function fix16_from_dbl(a) {
  return i32(((a * fix16_one__header_global_7b9a68c01681fb34) + ((a >= 0) ? 0.5 : (-0.5))));
}

// C/C++ source: source/build/src/osd.cpp:62
export function fix16_floor(x) {
  return i32(u64((BigInt(u64(x)) & BigInt(4294901760n))));
}

// C/C++ source: source/build/src/osd.cpp:63
export function fix16_ceil(x) {
  return i32(u64((BigInt(u64((BigInt(u64(x)) & BigInt(4294901760n)))) + BigInt(u64((Boolean(u64((BigInt(u64(x)) & BigInt(65535n)))) ? fix16_one__header_global_7b9a68c01681fb34 : 0))))));
}

// C/C++ source: source/build/src/osd.cpp:64
export function fix16_min(x, y) {
  const __cxx_lvalue_0 = cRef(() => x, __cxx_lvalue_2 => { x = i32(__cxx_lvalue_2); });
  const __cxx_lvalue_1 = cRef(() => y, __cxx_lvalue_3 => { y = i32(__cxx_lvalue_3); });
  return i32((min__template_774131ccff66371d(__cxx_lvalue_0, __cxx_lvalue_1)).value);
}

// C/C++ source: source/build/src/osd.cpp:65
export function fix16_max(x, y) {
  const __cxx_lvalue_0 = cRef(() => x, __cxx_lvalue_2 => { x = i32(__cxx_lvalue_2); });
  const __cxx_lvalue_1 = cRef(() => y, __cxx_lvalue_3 => { y = i32(__cxx_lvalue_3); });
  return i32((max__template_b1cfaf2244c73238(__cxx_lvalue_0, __cxx_lvalue_1)).value);
}

// C/C++ source: source/build/src/osd.cpp:66
export function fix16_clamp(x, lo, hi) {
  return i32(clamp__header_b0c3fa1a2e69(x, lo, hi));
}

// C/C++ source: source/build/src/osd.cpp:94
export function fix16_mod(x, y) {
  return i32((x = i32((Number(x) % Number(y)))));
}

// C/C++ source: source/build/src/osd.cpp:98
export function fix16_fast_trunc_mul(x, y) {
  return i32(i64((BigInt(i64((BigInt(i64(x)) * BigInt(i64(y))))) >> BigInt(16))));
}

// C/C++ source: source/build/src/osd.cpp:102
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

// C/C++ source: source/build/src/osd.cpp:301
export function swapchar2(a, b, s) {
  swap__header_a0a35c41caf9(cTypedPointer(a, Uint8Array), cTypedPointer(b, Uint8Array));
  swap__header_a0a35c41caf9(cPointerOffset(cTypedPointer(a, Uint8Array), 1, Uint8Array.BYTES_PER_ELEMENT), cPointerOffset(cTypedPointer(b, Uint8Array), s, Uint8Array.BYTES_PER_ELEMENT));
}

// C/C++ source: source/build/src/osd.cpp:308
export function readpixel(s) {
  return (u32((cDeref(cTypedPointer(s, Uint8Array), Uint8Array).value)) & 255);
}

// C/C++ source: source/build/src/osd.cpp:309
export function drawpixel(s, a) {
  ((cDeref(cTypedPointer(s, Uint8Array), Uint8Array).value) = (u32(a) & 255));
}

// C/C++ source: source/build/src/osd.cpp:328
export function ksgn(a) {
  return i32((i32((a > 0)) - i32((a < 0))));
}

// C/C++ source: source/build/src/osd.cpp:332
export function mulscale(eax, edx, ecx) {
  return i32(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) >> BigInt(i32((u32((u32(ecx) & 255)) & 255))))));
}

// C/C++ source: source/build/src/osd.cpp:333
export function dmulscale(eax, edx, esi, edi, ecx) {
  return i32(i64((BigInt(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) + BigInt(i64((BigInt(i64(esi)) * BigInt(i64(edi)))))))) >> BigInt(i32((u32((u32(ecx) & 255)) & 255))))));
}

// C/C++ source: source/build/src/osd.cpp:380
export function swapbufreverse(s, d, c) {
  let src = cTypedPointer(s, Uint8Array);
  let dst = cTypedPointer(d, Uint8Array);
  (c >= 4);
  do {
    swap__header_77b8dba6d6c9(dst, src);
    swap__header_77b8dba6d6c9(cPointerOffset(dst, 1, Uint8Array.BYTES_PER_ELEMENT), cPointerOffset(src, -(1), Uint8Array.BYTES_PER_ELEMENT));
    swap__header_77b8dba6d6c9(cPointerOffset(dst, 2, Uint8Array.BYTES_PER_ELEMENT), cPointerOffset(src, -(2), Uint8Array.BYTES_PER_ELEMENT));
    swap__header_77b8dba6d6c9(cPointerOffset(dst, 3, Uint8Array.BYTES_PER_ELEMENT), cPointerOffset(src, -(3), Uint8Array.BYTES_PER_ELEMENT));
    ((dst = cPointerOffset(dst, 4, Uint8Array.BYTES_PER_ELEMENT)), (src = cPointerOffset(src, -(4), Uint8Array.BYTES_PER_ELEMENT)));
  } while (((c = i32((Number(c) - Number(4)))) > 4));
  while (Boolean(((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous - 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => c, __cxx_lvalue_1 => { c = __cxx_lvalue_1; })))) {
    swap__header_77b8dba6d6c9(((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_2.value = next; return previous; })(cRef(() => dst, __cxx_lvalue_3 => { dst = __cxx_lvalue_3; })), ((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = cPointerOffset(previous, -1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_4.value = next; return previous; })(cRef(() => src, __cxx_lvalue_5 => { src = __cxx_lvalue_5; })));
  }
}

// C/C++ source: source/build/src/osd.cpp:534
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

// C/C++ source: source/build/src/osd.cpp:786
export function SDL_size_mul_overflow(a, b, ret) {
  if (((a != u64(0)) && (b > u64((BigInt(18446744073709551615n) / BigInt(a)))))) {
    return i32((-1));
  }
  ((cDeref(ret, BigUint64Array).value) = u64((BigInt(a) * BigInt(b))));
  return i32(0);
}

// C/C++ source: source/build/src/osd.cpp:816
export function SDL_size_add_overflow(a, b, ret) {
  if ((b > u64((BigInt(18446744073709551615n) - BigInt(a))))) {
    return i32((-1));
  }
  ((cDeref(ret, BigUint64Array).value) = u64((BigInt(a) + BigInt(b))));
  return i32(0);
}

// C/C++ source: source/build/src/osd.cpp:110
export function SDL_PointInRect(p, r) {
  return (((((cRecordObject(p).x >= cRecordObject(r).x) && (cRecordObject(p).x < i32((cRecordObject(r).x + cRecordObject(r).w)))) && (cRecordObject(p).y >= cRecordObject(r).y)) && (cRecordObject(p).y < i32((cRecordObject(r).y + cRecordObject(r).h)))) ? 1 : 0);
}

// C/C++ source: source/build/src/osd.cpp:119
export function SDL_RectEmpty(r) {
  return ((((!r) || (cRecordObject(r).w <= 0)) || (cRecordObject(r).h <= 0)) ? 1 : 0);
}

// C/C++ source: source/build/src/osd.cpp:127
export function SDL_RectEquals(a, b) {
  return ((((((a && b) && (cRecordObject(a).x == cRecordObject(b).x)) && (cRecordObject(a).y == cRecordObject(b).y)) && (cRecordObject(a).w == cRecordObject(b).w)) && (cRecordObject(a).h == cRecordObject(b).h)) ? 1 : 0);
}

// C/C++ source: source/build/src/osd.cpp:233
export function SDL_PointInFRect(p, r) {
  return (((((cRecordObject(p).x >= cRecordObject(r).x) && (cRecordObject(p).x < Math.fround((cRecordObject(r).x + cRecordObject(r).w)))) && (cRecordObject(p).y >= cRecordObject(r).y)) && (cRecordObject(p).y < Math.fround((cRecordObject(r).y + cRecordObject(r).h)))) ? 1 : 0);
}

// C/C++ source: source/build/src/osd.cpp:242
export function SDL_FRectEmpty(r) {
  return ((((!r) || (cRecordObject(r).w <= Math.fround(0))) || (cRecordObject(r).h <= Math.fround(0))) ? 1 : 0);
}

// C/C++ source: source/build/src/osd.cpp:29
export function mutex_lock(mutex) {
  SDL_AtomicLock(mutex);
}

// C/C++ source: source/build/src/osd.cpp:40
export function mutex_unlock(mutex) {
  SDL_AtomicUnlock(mutex);
}

// C/C++ source: source/build/src/osd.cpp:52
export function mutex_try(mutex) {
  return Boolean(Boolean(SDL_AtomicTryLock(mutex)));
}

// C/C++ source: source/build/src/osd.cpp:105
export function buildvfs_length(fd) {
  let st = new stat();
  return i64(((fstat(fd, st) < 0) ? i64((-1)) : st.st_size));
}

// C/C++ source: source/build/src/osd.cpp:131
export function buildvfs_flength(f) {
  return i64(buildvfs_length(fileno(f)));
}

// C/C++ source: source/build/src/osd.cpp:140
export function buildvfs_exists(path) {
  let st = new stat();
  return i32((!Boolean(stat(path, st))));
}

// C/C++ source: source/build/src/osd.cpp:150
export function buildvfs_isdir(path) {
  let st = new stat();
  return i32((Boolean(stat(path, st)) ? 0 : i32((u32((st.st_mode & u32(16384))) == u32(16384)))));
}

// C/C++ source: source/build/src/osd.cpp:163
export function buildvfs_fputstrptr(fp, str) {
  if (fp) {
    fwrite(str, u64(1), strlen(str), fp);
  }
}

// C/C++ source: source/build/src/osd.cpp:169
export function buildvfs_fputs(str, fp) {
  if (fp) {
    fwrite(str, u64(1), strlen(str), fp);
  }
}

// C/C++ source: source/build/src/osd.cpp:317
export function OSD_GetErrorFmt() {
  return cRecordObject(osd).draw.errorfmt;
}

// C/C++ source: source/build/src/osd.cpp:318
export function OSD_GetWarningFmt() {
  return cRecordObject(osd).draw.warnfmt;
}

// C/C++ source: source/build/src/osd.cpp:331
export function OSD_SetHistory(idx, src) {
  ((cPointerElementRef(cRecordObject(osd).history.buf, idx).value) = cTypedPointer(xmalloc(u64(512)), Uint8Array));
  Bstrncpyz((cPointerElementRef(cRecordObject(osd).history.buf, idx).value), src, u64(512));
}

// C/C++ source: source/build/src/osd.cpp:169
export function buildprintpiece(buf, str) {
  strcat(buf, str);
  return u64(strlen(str));
}

// C/C++ source: source/build/src/osd.cpp:40
export function hash_getcode(s) {
  let h = u32(5381);
  let ch;
  while ((i32((ch = (u32((u32(tolower(i32((cDeref(((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_0.value = next; return previous; })(cRef(() => s, __cxx_lvalue_1 => { s = __cxx_lvalue_1; })), Uint8Array).value)))) & 255)) & 255))) != i32(0))) {
    (h = u32((u32((u32((h << 5)) + h)) ^ u32(ch))));
  }
  return u32(h);
}

// C/C++ source: source/build/src/osd.cpp:51
export function hash_getbucket(t, s) {
  let h = u32(hash_getcode(s));
  return u32((h - u32(Math.imul(libdivide_u32_do(h, cObjectFieldRef(cRecordObject(t).__cxx_anonymous_0.prime, "d")), cRecordObject(t).__cxx_anonymous_0.prime.v))));
}

// C/C++ source: source/build/src/osd.cpp:87
export function inthash_getcode(key) {
  const __cxx_lvalue_0 = cScalarStorage(BigInt64Array, key);
  let h = u32(5381);
  for (let keybuf = cTypedPointer(__cxx_lvalue_0, Uint8Array), keybuf_end = cPointerOffset(keybuf, 8, Uint8Array.BYTES_PER_ELEMENT); cPointerCompare(keybuf, keybuf_end, "<"); ((__cxx_lvalue_1) => { const previous = __cxx_lvalue_1.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_1.value = next; return next; })(cRef(() => keybuf, __cxx_lvalue_2 => { keybuf = __cxx_lvalue_2; }))) {
    (h = u32((u32((u32((h << 5)) + h)) ^ u32((cDeref(keybuf, Uint8Array).value)))));
  }
  return u32(h);
}

// C/C++ source: source/build/src/osd.cpp:97
export function inthash_getbucket(t, key) {
  let h = u32(inthash_getcode(key));
  return u32((h - u32(Math.imul(libdivide_u32_do(h, cObjectFieldRef(cRecordObject(t).__cxx_anonymous_1.prime, "d")), cRecordObject(t).__cxx_anonymous_1.prime.v))));
}

// C/C++ source: source/build/src/osd.cpp:36
export function seed_krand(seed) {
  ((cDeref(seed, Int32Array).value) = i32(u64((BigInt(u64((BigInt(u64((cDeref(seed, Int32Array).value))) * BigInt(1664525n)))) + BigInt(221297n)))));
  return i32((u32((cDeref(seed, Int32Array).value)) >>> 16));
}

// C/C++ source: source/build/src/osd.cpp:207
export function yax_waltosecmask(walclipmask) {
  return i32((i32((i32((walclipmask & 1)) << 9)) | i32((i32((walclipmask & 64)) << 5))));
}

// C/C++ source: source/build/src/osd.cpp:700
export function renderMakeTSpriteFromSprite(tspr, spritenum) {
  let spr = cRecordPointer(cPointerOffset(__cxx_global_cell_4a046e33ecf7aced9bfd0007().value, spritenum, 44), {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xyz": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "__cxx_anonymous_15": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"xvel": {"native": "Int16Array", "offset": 0, "size": 2}, "yvel": {"native": "Int16Array", "offset": 2, "size": 2}, "zvel": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "vel": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}, "z": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"d": {"native": "Int16Array", "offset": 0, "size": 2}, "u": {"native": "Int16Array", "offset": 2, "size": 2}, "v": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 0}}, "overlaps": true, "size": 6, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 32}, "ang": {"native": "Int16Array", "offset": 28, "size": 2}, "blend": {"native": "Uint8Array", "offset": 19, "size": 1}, "clipdist": {"native": "Uint8Array", "offset": 18, "size": 1}, "cstat": {"native": "Uint16Array", "offset": 12, "size": 2}, "extra": {"native": "Int16Array", "offset": 42, "size": 2}, "hitag": {"native": "Int16Array", "offset": 40, "size": 2}, "lotag": {"native": "Int16Array", "offset": 38, "size": 2}, "owner": {"native": "Int16Array", "offset": 30, "size": 2}, "pal": {"native": "Uint8Array", "offset": 17, "size": 1}, "picnum": {"native": "Int16Array", "offset": 14, "size": 2}, "sectnum": {"native": "Int16Array", "offset": 24, "size": 2}, "shade": {"native": "Int8Array", "offset": 16, "size": 1}, "statnum": {"native": "Int16Array", "offset": 26, "size": 2}, "xoffset": {"native": "Int8Array", "offset": 22, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 20, "size": 1}, "yoffset": {"native": "Int8Array", "offset": 23, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 21, "size": 1}}, "overlaps": true, "size": 44, "union": false}, {});
  cAssignAggregate(cRecordObject(tspr).__cxx_anonymous_0.xyz, cRecordObject(spr).__cxx_anonymous_0.xyz, {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}});
  (cRecordObject(tspr).cstat = (u32(cRecordObject(spr).cstat) & 65535));
  (cRecordObject(tspr).picnum = ((u32(cRecordObject(spr).picnum) << 16) >> 16));
  (cRecordObject(tspr).shade = ((u32(cRecordObject(spr).shade) << 24) >> 24));
  (cRecordObject(tspr).pal = (u32(cRecordObject(spr).pal) & 255));
  (cRecordObject(tspr).blend = (u32(cRecordObject(spr).blend) & 255));
  (cRecordObject(tspr).xrepeat = (u32(cRecordObject(spr).xrepeat) & 255));
  (cRecordObject(tspr).yrepeat = (u32(cRecordObject(spr).yrepeat) & 255));
  (cRecordObject(tspr).xoffset = ((u32(cRecordObject(spr).xoffset) << 24) >> 24));
  (cRecordObject(tspr).yoffset = ((u32(cRecordObject(spr).yoffset) << 24) >> 24));
  (cRecordObject(tspr).sectnum = ((u32(cRecordObject(spr).sectnum) << 16) >> 16));
  (cRecordObject(tspr).statnum = ((u32(cRecordObject(spr).statnum) << 16) >> 16));
  (cRecordObject(tspr).ang = ((u32(cRecordObject(spr).ang) << 16) >> 16));
  cAssignAggregate(cRecordObject(tspr).__cxx_anonymous_15.vel, cRecordObject(spr).__cxx_anonymous_15.vel, {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}, "z": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"d": {"native": "Int16Array", "offset": 0, "size": 2}, "u": {"native": "Int16Array", "offset": 2, "size": 2}, "v": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 0}}, "overlaps": true, "size": 6, "union": false}});
  (cRecordObject(tspr).lotag = ((u32(cRecordObject(spr).lotag) << 16) >> 16));
  (cRecordObject(tspr).hitag = ((u32(cRecordObject(spr).hitag) << 16) >> 16));
  (cRecordObject(tspr).extra = ((u32(cRecordObject(spr).extra) << 16) >> 16));
  (cRecordObject(tspr).clipdist = (u32((u32(0) & 255)) & 255));
  (cRecordObject(tspr).owner = ((u32(((u32(spritenum) << 16) >> 16)) << 16) >> 16));
  return tspr;
}

// C/C++ source: source/build/src/osd.cpp:733
export function spriteSetSlope(spritenum, heinum) {
  let spr = cPointerOffset(__cxx_global_cell_4a046e33ecf7aced9bfd0007().value, spritenum, 44);
  let cstat = (u32(cRecordObject(spr).cstat) & 65535);
  if ((!Boolean(i32((i32(cstat) & i32(32)))))) {
    return;
  }
  (cRecordObject(spr).xoffset = ((u32(((u32(i32((i32(heinum) & 255))) << 24) >> 24)) << 24) >> 24));
  (cRecordObject(spr).yoffset = ((u32(((u32(i32((i32((i32(heinum) >> 8)) & 255))) << 24) >> 24)) << 24) >> 24));
  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = (u32((__cxx_lvalue_0.value & (~i32(48)))) & 65535)))(cObjectFieldRef(cRecordObject(spr), "cstat"));
  ((__cxx_lvalue_1) => (__cxx_lvalue_1.value = (u32((__cxx_lvalue_1.value | i32(((i32(heinum) != 0) ? 48 : 32)))) & 65535)))(cObjectFieldRef(cRecordObject(spr), "cstat"));
}

// C/C++ source: source/build/src/osd.cpp:746
export function spriteGetSlope(spritenum) {
  let spr = cRecordPointer(cPointerOffset(__cxx_global_cell_4a046e33ecf7aced9bfd0007().value, spritenum, 44), {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xyz": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "__cxx_anonymous_15": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"xvel": {"native": "Int16Array", "offset": 0, "size": 2}, "yvel": {"native": "Int16Array", "offset": 2, "size": 2}, "zvel": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "vel": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}, "z": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"d": {"native": "Int16Array", "offset": 0, "size": 2}, "u": {"native": "Int16Array", "offset": 2, "size": 2}, "v": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 0}}, "overlaps": true, "size": 6, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 32}, "ang": {"native": "Int16Array", "offset": 28, "size": 2}, "blend": {"native": "Uint8Array", "offset": 19, "size": 1}, "clipdist": {"native": "Uint8Array", "offset": 18, "size": 1}, "cstat": {"native": "Uint16Array", "offset": 12, "size": 2}, "extra": {"native": "Int16Array", "offset": 42, "size": 2}, "hitag": {"native": "Int16Array", "offset": 40, "size": 2}, "lotag": {"native": "Int16Array", "offset": 38, "size": 2}, "owner": {"native": "Int16Array", "offset": 30, "size": 2}, "pal": {"native": "Uint8Array", "offset": 17, "size": 1}, "picnum": {"native": "Int16Array", "offset": 14, "size": 2}, "sectnum": {"native": "Int16Array", "offset": 24, "size": 2}, "shade": {"native": "Int8Array", "offset": 16, "size": 1}, "statnum": {"native": "Int16Array", "offset": 26, "size": 2}, "xoffset": {"native": "Int8Array", "offset": 22, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 20, "size": 1}, "yoffset": {"native": "Int8Array", "offset": 23, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 21, "size": 1}}, "overlaps": true, "size": 44, "union": false}, {});
  let cstat = (u32((u32(i32((i32(cRecordObject(spr).cstat) & i32(48)))) & 65535)) & 65535);
  if ((i32(cstat) != i32(48))) {
    return ((u32(((u32(0) << 16) >> 16)) << 16) >> 16);
  }
  return ((u32(((u32(i32((i32((u32((u32(cRecordObject(spr).xoffset) & 255)) & 255)) + i32((i32((u32((u32(cRecordObject(spr).yoffset) & 255)) & 255)) << 8))))) << 16) >> 16)) << 16) >> 16);
}

// C/C++ source: source/build/src/osd.cpp:1079
export function videoGetRenderMode() {
  return i32(0);
}

// C/C++ source: source/build/src/osd.cpp:1300
export function getcrc16(buffer, bufleng, crc) {
  for (let i = i32(0); (i < bufleng); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; }))) {
    (crc = i32((i32((i32((crc << 8)) & 65535)) ^ (cDeref(cPointerOffset(crctab16, i32((i32((i32((i32((u32((u32(crc) & 65535)) & 65535)) >> 8)) & 65535)) ^ i32((cDeref(cPointerOffset(cTypedPointer(buffer, Uint8Array), i, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))), Int32Array.BYTES_PER_ELEMENT), Int32Array).value))));
  }
  return (u32((u32((u32(i32((crc & 65535))) & 65535)) & 65535)) & 65535);
}

// C/C++ source: source/build/src/osd.cpp:1391
export function uhypsq(dx, dy) {
  return u32((u32(Math.imul(u32(dx), u32(dx))) + u32(Math.imul(u32(dy), u32(dy)))));
}

// C/C++ source: source/build/src/osd.cpp:1396
export function logapproach(val, targetval) {
  let dif = i32((targetval - val));
  return i32((Boolean(i32((dif >> 1))) ? i32((val + i32((dif >> 1)))) : targetval));
}

// C/C++ source: source/build/src/osd.cpp:1462
export function redwallp(wal) {
  return i32(((i32(cRecordObject(wal).nextwall) >= 0) && (i32(cRecordObject(wal).nextsector) >= 0)));
}

// C/C++ source: source/build/src/osd.cpp:1467
export function E_SpriteIsValid(i) {
  return i32(((u32(i) < u32(16384)) && (i32((cPointerElementRef(__cxx_global_cell_4a046e33ecf7aced9bfd0007().value, i).value).statnum) != 1024)));
}

// C/C++ source: source/build/src/osd.cpp:1683
export function renderDisableFog() {

}

// C/C++ source: source/build/src/osd.cpp:1693
export function renderEnableFog() {

}

// C/C++ source: source/build/src/osd.cpp:1797
export function tspriteGetSlope(tspr) {
  if ((i32((i32(cRecordObject(tspr).cstat) & i32(48))) != i32(48))) {
    return ((u32(((u32(0) << 16) >> 16)) << 16) >> 16);
  }
  return ((u32(((u32(i32((i32((u32((u32(cRecordObject(tspr).xoffset) & 255)) & 255)) + i32((i32((u32((u32(cRecordObject(tspr).yoffset) & 255)) & 255)) << 8))))) << 16) >> 16)) << 16) >> 16);
}

// C/C++ source: source/build/src/osd.cpp:269
export function get_nextloopstart(loopstart) {
  let i = i32(loopstart);
  while (Boolean(((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return next; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; })))) {
    if ((i32((cPointerElementRef(__cxx_global_cell_4d8aaa64f68587b18e27604c().value, i).value).point2) == loopstart)) {
      return i32((i + 1));
    }
  }
  return i32(16384);
}

// C/C++ source: source/build/src/osd.cpp:482
export function inpclamp(x, mi, ma) {
  if (((cDeref(x, Int32Array).value) > ma)) {
    ((cDeref(x, Int32Array).value) = i32(ma));
  }
  if (((cDeref(x, Int32Array).value) < mi)) {
    ((cDeref(x, Int32Array).value) = i32(mi));
  }
}

// C/C++ source: source/build/src/osd.cpp:42
export let osdscrtime = u32(0);
function __cxx_static_address_d5f99da07cc6d39f2823349f() {
  return __cxx_static_address_d5f99da07cc6d39f2823349f.reference || (__cxx_static_address_d5f99da07cc6d39f2823349f.reference = {
    __cReference: true,
    get value() { return osdscrtime; },
    set value(__cxx_lvalue_0) { osdscrtime = u32(__cxx_lvalue_0); }
  });
}
export function __cxx_private_cell_d5f99da07cc6d39f2823349f() { return __cxx_static_address_d5f99da07cc6d39f2823349f(); }

// C/C++ source: source/build/src/osd.cpp:47
export let h_osd = cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"prime": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"magic": {"native": "Uint32Array", "offset": 0, "size": 4}, "more": {"native": "Uint8Array", "offset": 4, "size": 1}}, "overlaps": false, "size": 5, "union": false}, "offset": 4}, "v": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "size": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "items": {"offset": 16, "pointer": true, "size": 8}}, "overlaps": true, "size": 24, "union": false}, {"__cxx_anonymous_0": cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"prime": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"magic": {"native": "Uint32Array", "offset": 0, "size": 4}, "more": {"native": "Uint8Array", "offset": 4, "size": 1}}, "overlaps": false, "size": 5, "union": false}, "offset": 4}, "v": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "size": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": true, "size": 12, "union": true}, {"size": u32(i32((512 >> 1)))}, null, {}), "items": null}, null, {});
function __cxx_static_address_e29f56370946f18c1c4ce6f4() {
  return __cxx_static_address_e29f56370946f18c1c4ce6f4.reference || (__cxx_static_address_e29f56370946f18c1c4ce6f4.reference = {
    __cReference: true,
    get value() { return h_osd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_e29f56370946f18c1c4ce6f4() { return __cxx_static_address_e29f56370946f18c1c4ce6f4(); }

// C/C++ source: source/build/src/osd.cpp:49
export let user_callbacks = cZeroAggregate({"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"clear": {"offset": 40, "pointer": true, "size": 8}, "drawchar": {"offset": 0, "pointer": true, "size": 8}, "drawcursor": {"offset": 16, "pointer": true, "size": 8}, "drawstr": {"offset": 8, "pointer": true, "size": 8}, "getcolumnwidth": {"offset": 24, "pointer": true, "size": 8}, "getrowheight": {"offset": 32, "pointer": true, "size": 8}, "gettime": {"offset": 48, "pointer": true, "size": 8}, "onshowosd": {"offset": 56, "pointer": true, "size": 8}}, "overlaps": false, "size": 64, "union": false}}, {});
function __cxx_static_address_7778adcfb4c257c312e315fa() {
  return __cxx_static_address_7778adcfb4c257c312e315fa.reference || (__cxx_static_address_7778adcfb4c257c312e315fa.reference = {
    __cReference: true,
    get value() { return user_callbacks; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_7778adcfb4c257c312e315fa() { return __cxx_static_address_7778adcfb4c257c312e315fa(); }

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
export let h_cvars = cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"prime": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"magic": {"native": "Uint32Array", "offset": 0, "size": 4}, "more": {"native": "Uint8Array", "offset": 4, "size": 1}}, "overlaps": false, "size": 5, "union": false}, "offset": 4}, "v": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "size": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "items": {"offset": 16, "pointer": true, "size": 8}}, "overlaps": true, "size": 24, "union": false}, {"__cxx_anonymous_0": cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"prime": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"magic": {"native": "Uint32Array", "offset": 0, "size": 4}, "more": {"native": "Uint8Array", "offset": 4, "size": 1}}, "overlaps": false, "size": 5, "union": false}, "offset": 4}, "v": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "size": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": true, "size": 12, "union": true}, {"size": u32(i32((512 >> 1)))}, null, {}), "items": null}, null, {});
function __cxx_static_address_a920b40f756adfb47f87522c() {
  return __cxx_static_address_a920b40f756adfb47f87522c.reference || (__cxx_static_address_a920b40f756adfb47f87522c.reference = {
    __cReference: true,
    get value() { return h_cvars; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_a920b40f756adfb47f87522c() { return __cxx_static_address_a920b40f756adfb47f87522c(); }

// C/C++ source: source/build/src/osd.cpp:53
export let m32_osd_tryscript = Boolean(false);
export function __cxx_global_cell_50934f4ac2e9701b845e3757() {
  return __cxx_global_cell_50934f4ac2e9701b845e3757.reference || (__cxx_global_cell_50934f4ac2e9701b845e3757.reference = {
    __cReference: true,
    get value() { return m32_osd_tryscript; },
    set value(__cxx_lvalue_0) { m32_osd_tryscript = Boolean(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/osd.cpp:91
export function OSD_CvarModified(pCvar) {
  if (((!osd) || (!cRecordObject(cRecordObject(pCvar).pData).__cxx_anonymous_2.ptr))) {
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

// C/C++ source: source/build/src/osd.cpp:223
export function OSD_ParsingScript() {
  return i32(cRecordObject(osd).execdepth);
}

// C/C++ source: source/build/src/osd.cpp:224
export function OSD_OSDKey() {
  return i32(cRecordObject(osd).keycode);
}

// C/C++ source: source/build/src/osd.cpp:225
export function OSD_GetCols() {
  return i32(cRecordObject(osd).draw.cols);
}

// C/C++ source: source/build/src/osd.cpp:226
export function OSD_IsMoving() {
  return i32(((osdrowscur != (-1)) && (osdrowscur != cRecordObject(osd).draw.rows)));
}

// C/C++ source: source/build/src/osd.cpp:227
export function OSD_GetRowsCur() {
  return i32(osdrowscur);
}

// C/C++ source: source/build/src/osd.cpp:228
export function OSD_GetTextMode() {
  return i32(cRecordObject(osd).draw.mode);
}

// C/C++ source: source/build/src/osd.cpp:230
export function OSD_GetShadePal(ch, shd, pal) {
  let t = cRecordObject(osd).text;
  if ((cPointerCompare(ch, t.buf, "<") || cPointerCompare(ch, cPointerOffset(t.buf, 32768, Uint8Array.BYTES_PER_ELEMENT), ">="))) {
    return;
  }
  ((cDeref(shd, Int32Array).value) = i32((i32((i32((cDeref(cPointerOffset(t.fmt, cPointerDiff(ch, t.buf, Uint8Array.BYTES_PER_ELEMENT), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & (~31))) >> 4)));
  ((cDeref(pal, Int32Array).value) = i32((i32((cDeref(cPointerOffset(t.fmt, cPointerDiff(ch, t.buf, Uint8Array.BYTES_PER_ELEMENT), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & (~224))));
}

// C/C++ source: source/build/src/osd.cpp:247
export function swaposdptrs() {
  (cRecordObject(osd).cb = (cPointerCompare(cRecordObject(osd).cb, __cxx_static_address_89f1619e624af57267ee6473(), "==") ? __cxx_static_address_7778adcfb4c257c312e315fa() : __cxx_static_address_89f1619e624af57267ee6473()));
}

// C/C++ source: source/build/src/osd.cpp:272
const __cxx_literal_b2106a9975121511a93a = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 111, 115, 100, 46, 99, 112, 112, 0]);
const __cxx_literal_e8b2e29e0606f0e0f3b4 = Uint8Array.from([37, 115, 0]);
export function osdfunc_echo(parm) {
  ((i32(0) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(0), __cxx_literal_b2106a9975121511a93a, u32(274), __cxx_literal_e8b2e29e0606f0e0f3b4, cPointerOffset(cRecordObject(parm).raw, 5, Uint8Array.BYTES_PER_ELEMENT)));
  return i32(0);
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

// C/C++ source: source/build/src/osd.cpp:415
export function _internal_onshowosd(a) {
  (a = i32(a));
}

// C/C++ source: source/build/src/osd.cpp:420
export function osd_clear(clearstrings) {
  memset(cRecordObject(osd).text.buf, 32, u64(32768));
  memset(cRecordObject(osd).text.fmt, i32((cRecordObject(osd).draw.textpal + i32((cRecordObject(osd).draw.textshade << 5)))), u64(32768));
  (cRecordObject(osd).text.lines = i32(1));
  mutex_lock(cObjectFieldRef(cRecordObject(osd).log, "mutex"));
  (cRecordObject(osd).log.m_lineidx = u32(0));
  if (Boolean(clearstrings)) {
    cRecordObject(cRecordObject(osd).log.m_lines).clear();
  }
  mutex_unlock(cObjectFieldRef(cRecordObject(osd).log, "mutex"));
}

// C/C++ source: source/build/src/osd.cpp:493
const __cxx_literal_308f6a8f89ffc52250bd = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 111, 115, 100, 46, 99, 112, 112, 0]);
const __cxx_literal_06be58d37b30d22b9aec = Uint8Array.from([82, 101, 109, 111, 118, 101, 100, 32, 97, 108, 105, 97, 115, 32, 37, 115, 32, 40, 39, 37, 115, 39, 41, 0]);
const __cxx_literal_6e0cd31ca9dfec14c3a3 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 111, 115, 100, 46, 99, 112, 112, 0]);
const __cxx_literal_4bab1c0ed18d8b64a3b2 = Uint8Array.from([37, 115, 32, 105, 115, 32, 110, 111, 116, 32, 97, 110, 32, 97, 108, 105, 97, 115, 46, 46, 46, 0]);
const __cxx_literal_e0268562c96673461ed8 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 111, 115, 100, 46, 99, 112, 112, 0]);
const __cxx_literal_fb4209e9e63f24432bc4 = Uint8Array.from([37, 115, 32, 105, 115, 32, 110, 111, 116, 32, 97, 110, 32, 97, 108, 105, 97, 115, 46, 46, 46, 0]);
export function osdfunc_unalias(parm) {
  if ((cRecordObject(parm).numparms < 1)) {
    return i32(1);
  }
  for (let symb = cRecordObject(osd).symbols; cPointerCompare(symb, null, "!="); (symb = cRecordObject(symb).next)) {
    if ((!Boolean(strcasecmp((cPointerElementRef(cRecordObject(parm).parms, 0).value), cRecordObject(symb).name)))) {
      if ((cRecordObject(parm).numparms < 2)) {
        if (cPointerCompare(cRecordObject(symb).func, cSourceAddresses.decode(4919), "==")) {
          ((i32(0) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(0), __cxx_literal_308f6a8f89ffc52250bd, u32(506), __cxx_literal_06be58d37b30d22b9aec, cRecordObject(symb).name, cRecordObject(symb).help));
          (cRecordObject(symb).func = cSourceAddresses.decode(57005));
        } else {
          ((i32(0) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(0), __cxx_literal_6e0cd31ca9dfec14c3a3, u32(510), __cxx_literal_4bab1c0ed18d8b64a3b2, cRecordObject(symb).name));
        }
        return i32(0);
      }
    }
  }
  ((i32(0) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(0), __cxx_literal_e0268562c96673461ed8, u32(517), __cxx_literal_fb4209e9e63f24432bc4, (cPointerElementRef(cRecordObject(parm).parms, 0).value)));
  return i32(0);
}

// C/C++ source: source/build/src/osd.cpp:606
export function osdfunc_clear(UNUSED_parm) {
  ;
  osd_clear(i32(true));
  return i32(0);
}

// C/C++ source: source/build/src/osd.cpp:769
const __cxx_literal_5bbd79dec8f5e363eb73 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 111, 115, 100, 46, 99, 112, 112, 0]);
const __cxx_literal_2dcb0cf84883a83e4415 = Uint8Array.from([37, 46, 42, 115, 0]);
export function mi_log(msg, arg) {
  if (((!msg) || (i32((cDeref(cPointerOffset(msg, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == i32(10)))) {
    return;
  }
  (arg = arg);
  let len = i32(strlen(msg));
  while (((len > 0) && (i32((cDeref(cPointerOffset(msg, i32((len - 1)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == i32(10)))) {
    ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous - 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => len, __cxx_lvalue_1 => { len = __cxx_lvalue_1; }));
  }
  ((i32(8) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(8), __cxx_literal_5bbd79dec8f5e363eb73, u32(780), __cxx_literal_2dcb0cf84883a83e4415, len, msg));
}

// C/C++ source: source/build/src/osd.cpp:925
export function OSD_SetParameters(promptShade, promptPal, editShade, editPal, textShade, textPal, errorStr, warnStr, highlight, flags) {
  let draw = cRecordObject(osd).draw;
  (draw.promptshade = i32(promptShade));
  (draw.promptpal = i32(promptPal));
  (draw.editshade = i32(editShade));
  (draw.editpal = i32(editPal));
  (draw.textshade = i32(textShade));
  (draw.textpal = i32(textPal));
  (draw.errorfmt = errorStr);
  (draw.errfmtlen = i32((errorStr ? strlen(errorStr) : u64(0))));
  (draw.warnfmt = warnStr);
  (draw.warnfmtlen = i32((warnStr ? strlen(warnStr) : u64(0))));
  (draw.highlight = highlight);
  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = u32((__cxx_lvalue_0.value | flags))))(cObjectFieldRef(cRecordObject(osd), "flags"));
}

// C/C++ source: source/build/src/osd.cpp:949
export function OSD_CaptureKey(scanCode) {
  (cRecordObject(osd).keycode = i32(scanCode));
}

// C/C++ source: source/build/src/osd.cpp:957
export function OSD_FindDiffPoint(str1, str2) {
  let i;
  for ((i = i32(0)); (tolower(i32((cDeref(cPointerOffset(str1, i, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value))) == tolower(i32((cDeref(cPointerOffset(str2, i, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; }))) {
    if (((i32((cDeref(cPointerOffset(str1, i, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == 0) || (i32((cDeref(cPointerOffset(str2, i, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == 0))) {
      break;
    }
  }
  return i32(i);
}

// C/C++ source: source/build/src/osd.cpp:968
export function OSD_AdjustEditorPosition(e) {
  (e.pos = ((u32(((u32(0) << 16) >> 16)) << 16) >> 16));
  while (Boolean((cDeref(cPointerOffset(e.buf, e.pos, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value))) {
    ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = ((u32((previous + 1)) << 16) >> 16); __cxx_lvalue_0.value = next; return previous; })(cObjectFieldRef(e, "pos"));
  }
  (e.len = ((u32(e.pos) << 16) >> 16));
  if ((i32(e.pos) < i32(e.start))) {
    (e.end = ((u32(e.pos) << 16) >> 16));
    (e.start = ((u32(((u32(i32((i32(e.end) - i32((i32((cRecordObject(osd).draw.cols - 1)) - 3))))) << 16) >> 16)) << 16) >> 16));
    if ((i32(e.start) < 0)) {
      ((__cxx_lvalue_1) => (__cxx_lvalue_1.value = ((u32((__cxx_lvalue_1.value - i32(e.start))) << 16) >> 16)))(cObjectFieldRef(e, "end"));
      (e.start = ((u32(((u32(0) << 16) >> 16)) << 16) >> 16));
    }
  } else {
    if ((i32(e.pos) >= i32(e.end))) {
      ((__cxx_lvalue_2) => (__cxx_lvalue_2.value = ((u32((__cxx_lvalue_2.value + i32((i32(e.pos) - i32(e.end))))) << 16) >> 16)))(cObjectFieldRef(e, "start"));
      ((__cxx_lvalue_3) => (__cxx_lvalue_3.value = ((u32((__cxx_lvalue_3.value + i32((i32(e.pos) - i32(e.end))))) << 16) >> 16)))(cObjectFieldRef(e, "end"));
    }
  }
}

// C/C++ source: source/build/src/osd.cpp:993
export function OSD_HistoryPrev() {
  let h = cRecordObject(osd).history;
  if ((h.pos >= i32((h.lines - 1)))) {
    return;
  }
  let e = cRecordObject(osd).editor;
  memcpy(e.buf, (cPointerElementRef(h.buf, ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return next; })(cObjectFieldRef(h, "pos"))).value), u64(512));
  OSD_AdjustEditorPosition(e);
}

// C/C++ source: source/build/src/osd.cpp:1007
export function OSD_HistoryNext() {
  let h = cRecordObject(osd).history;
  if ((h.pos < 0)) {
    return;
  }
  let e = cRecordObject(osd).editor;
  if ((h.pos == 0)) {
    (e.len = ((u32(((u32(0) << 16) >> 16)) << 16) >> 16));
    (e.pos = ((u32(((u32(0) << 16) >> 16)) << 16) >> 16));
    (e.start = ((u32(((u32(0) << 16) >> 16)) << 16) >> 16));
    (e.end = ((u32(((u32(i32((i32((cRecordObject(osd).draw.cols - 1)) - 3))) << 16) >> 16)) << 16) >> 16));
    (h.pos = i32((-1)));
    return;
  }
  memcpy(e.buf, (cPointerElementRef(h.buf, ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous - 1)); __cxx_lvalue_0.value = next; return next; })(cObjectFieldRef(h, "pos"))).value), u64(512));
  OSD_AdjustEditorPosition(e);
}

// C/C++ source: source/build/src/osd.cpp:1742
export function OSD_LineFeed() {
  let t = cRecordObject(osd).text;
  let d = cRecordObject(osd).draw;
  memmove(cPointerOffset(t.buf, d.cols, Uint8Array.BYTES_PER_ELEMENT), t.buf, u64(i32((32768 - d.cols))));
  memset(t.buf, 32, u64(d.cols));
  memmove(cPointerOffset(t.fmt, d.cols, Uint8Array.BYTES_PER_ELEMENT), t.fmt, u64(i32((32768 - d.cols))));
  memset(t.fmt, d.textpal, u64(d.cols));
  if ((t.lines < t.maxlines)) {
    ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cObjectFieldRef(t, "lines"));
  }
}

// C/C++ source: source/build/src/osd.cpp:1758
let __static_OSD_FilterConsoleMsg_errorCnt = 0;
const __cxx_literal_002a4150c1a1896a7547 = Uint8Array.from([10, 69, 114, 114, 111, 114, 32, 99, 111, 117, 110, 116, 32, 101, 120, 99, 101, 101, 100, 101, 100, 32, 34, 111, 115, 100, 108, 111, 103, 99, 117, 116, 111, 102, 102, 34, 33, 32, 76, 111, 103, 103, 105, 110, 103, 32, 115, 116, 111, 112, 112, 101, 100, 46, 10, 0]);
export function OSD_FilterConsoleMsg(putstr) {

  let errorfmt = cRecordObject(osd).draw.errorfmt;
  let isError = i32((errorfmt && (!Boolean(strncmp((cPointerElementRef(putstr, 0).value), errorfmt, u64(cRecordObject(osd).draw.errfmtlen))))));
  if ((Boolean(isError) && (u32(((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return next; })(cRef(() => __static_OSD_FilterConsoleMsg_errorCnt, __cxx_lvalue_1 => { __static_OSD_FilterConsoleMsg_errorCnt = __cxx_lvalue_1; }))) > u32(cRecordObject(osd).log.maxerrors)))) {
    if ((__static_OSD_FilterConsoleMsg_errorCnt >= i32((cRecordObject(osd).log.maxerrors + 2)))) {
      (__static_OSD_FilterConsoleMsg_errorCnt = i32((cRecordObject(osd).log.maxerrors + 2)));
      return i32(2);
    }
    ((cPointerElementRef(putstr, 0).value) = xstrdup(__cxx_literal_002a4150c1a1896a7547));
    return i32(1);
  }
  return i32(0);
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

// C/C++ source: source/build/src/osd.cpp:2122
export function OSD_SetVersion(pszVersion, osdShade, osdPal) {
  do {
    xfree(cRecordObject(osd).version.buf);
    (cRecordObject(osd).version.buf = null);
  } while (Boolean(0));
  (cRecordObject(osd).version.buf = xstrdup(pszVersion));
  (cRecordObject(osd).version.len = (u32((u32(strlen(pszVersion)) & 255)) & 255));
  (cRecordObject(osd).version.shade = (u32((u32(osdShade) & 255)) & 255));
  (cRecordObject(osd).version.pal = (u32((u32(osdPal) & 255)) & 255));
}

// C/C++ source: source/build/src/osd.cpp:2187
export function osd_findsymbol(pszName, pSymbol) {
  if (cPointerCompare(cRecordObject(osd).symbols, null, "==")) {
    return null;
  }
  if ((!pSymbol)) {
    (pSymbol = cRecordObject(osd).symbols);
  }
  let nameLen = i32(strlen(pszName));
  for (; pSymbol; (pSymbol = cRecordObject(pSymbol).next)) {
    if (((cPointerCompare(cRecordObject(pSymbol).func, cSourceAddresses.decode(57005), "!=") && cPointerCompare(cRecordObject(pSymbol).help, null, "!=")) && (!Boolean(strncasecmp(pszName, cRecordObject(pSymbol).name, u64(nameLen)))))) {
      return pSymbol;
    }
  }
  return null;
}

// C/C++ source: source/build/src/osd.cpp:2226
const __cxx_literal_f50a92127900424dee15 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 111, 115, 100, 46, 99, 112, 112, 0]);
const __cxx_literal_c229a736e0762e8dee29 = Uint8Array.from([39, 37, 115, 39, 32, 105, 115, 32, 39, 37, 102, 39, 0]);
const __cxx_literal_ec917c299d6667d08cf1 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 111, 115, 100, 46, 99, 112, 112, 0]);
const __cxx_literal_03943fb64cb0fd509fef = Uint8Array.from([37, 115, 32, 91, 37, 100, 45, 37, 100, 93, 58, 32, 37, 115, 0]);
const __cxx_literal_c7aa9b188b1e6c891ce7 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 111, 115, 100, 46, 99, 112, 112, 0]);
const __cxx_literal_f0fbdc53c2d85e1c2dc8 = Uint8Array.from([39, 37, 115, 39, 32, 105, 115, 32, 39, 37, 102, 39, 0]);
const __cxx_literal_cd92467a84a7a82cc822 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 111, 115, 100, 46, 99, 112, 112, 0]);
const __cxx_literal_d0746469447599df5664 = Uint8Array.from([37, 115, 32, 91, 37, 100, 45, 37, 100, 93, 58, 32, 37, 115, 0]);
const __cxx_literal_c7885a59ebf9fbc81d57 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 111, 115, 100, 46, 99, 112, 112, 0]);
const __cxx_literal_b1fae0143caa652eb7cc = Uint8Array.from([39, 37, 115, 39, 32, 105, 115, 32, 39, 37, 100, 39, 0]);
const __cxx_literal_1d30d3740eea9e49be39 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 111, 115, 100, 46, 99, 112, 112, 0]);
const __cxx_literal_ca85905efeedeeae8980 = Uint8Array.from([37, 115, 32, 91, 37, 100, 37, 99, 37, 100, 93, 58, 32, 37, 115, 0]);
const __cxx_literal_52ade7a0ac0897f235f8 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 111, 115, 100, 46, 99, 112, 112, 0]);
const __cxx_literal_c504d2038b08c3893e3d = Uint8Array.from([39, 37, 115, 39, 32, 105, 115, 32, 39, 37, 100, 39, 0]);
const __cxx_literal_5fd87be3d974e84b0619 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 111, 115, 100, 46, 99, 112, 112, 0]);
const __cxx_literal_0dd90eeac5a75162cae9 = Uint8Array.from([37, 115, 32, 91, 37, 100, 45, 37, 100, 93, 58, 32, 37, 115, 0]);
const __cxx_literal_f162f054206e17b496f7 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 111, 115, 100, 46, 99, 112, 112, 0]);
const __cxx_literal_0c09ca909e0a32a88668 = Uint8Array.from([39, 37, 115, 39, 32, 105, 115, 32, 39, 37, 115, 39, 0]);
const __cxx_literal_e7adb016014e174e4651 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 111, 115, 100, 46, 99, 112, 112, 0]);
const __cxx_literal_9997b581e57d7499ffe8 = Uint8Array.from([37, 115, 58, 32, 37, 115, 0]);
export function osdfunc_printvar(cvaridx) {
  let pData = cRecordObject((cPointerElementRef(cRecordObject(osd).cvars, cvaridx).value).pData);
  switch (u32((pData.flags & u32(63)))) {
    case u32(1): {
      ((i32(0) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(0), __cxx_literal_f50a92127900424dee15, u32(2233), __cxx_literal_c229a736e0762e8dee29, pData.name, (cDeref(pData.__cxx_anonymous_2.f, Float32Array).value)));
    }
    ((i32(0) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(0), __cxx_literal_ec917c299d6667d08cf1, u32(2234), __cxx_literal_03943fb64cb0fd509fef, pData.name, pData.min, pData.max, pData.desc));
    return i32(0);
    case u32(32): {
      ((i32(0) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(0), __cxx_literal_c7aa9b188b1e6c891ce7, u32(2237), __cxx_literal_f0fbdc53c2d85e1c2dc8, pData.name, (cDeref(pData.__cxx_anonymous_2.d, Float64Array).value)));
    }
    ((i32(0) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(0), __cxx_literal_cd92467a84a7a82cc822, u32(2238), __cxx_literal_d0746469447599df5664, pData.name, pData.min, pData.max, pData.desc));
    return i32(0);
    case u32(2):
    case u32(8): {
      ((i32(0) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(0), __cxx_literal_c7885a59ebf9fbc81d57, u32(2242), __cxx_literal_b1fae0143caa652eb7cc, pData.name, (cDeref(pData.__cxx_anonymous_2.i32, Int32Array).value)));
    }
    ((i32(0) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(0), __cxx_literal_1d30d3740eea9e49be39, u32(2243), __cxx_literal_ca85905efeedeeae8980, pData.name, pData.min, i32((Boolean(u32((pData.flags & u32(8)))) ? 47 : 45)), pData.max, pData.desc));
    return i32(0);
    case u32(4): {
      ((i32(0) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(0), __cxx_literal_52ade7a0ac0897f235f8, u32(2246), __cxx_literal_c504d2038b08c3893e3d, pData.name, (cDeref(pData.__cxx_anonymous_2.u32, Uint32Array).value)));
    }
    ((i32(0) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(0), __cxx_literal_5fd87be3d974e84b0619, u32(2247), __cxx_literal_0dd90eeac5a75162cae9, pData.name, pData.min, pData.max, pData.desc));
    return i32(0);
    case u32(16): {
      ((i32(0) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(0), __cxx_literal_f162f054206e17b496f7, u32(2250), __cxx_literal_0c09ca909e0a32a88668, pData.name, pData.__cxx_anonymous_2.string));
    }
    ((i32(0) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(0), __cxx_literal_e7adb016014e174e4651, u32(2251), __cxx_literal_9997b581e57d7499ffe8, pData.name, pData.desc));
    return i32(0);
    default: {
      __builtin_unreachable();
    }
  }
}

// C/C++ source: source/build/src/osd.cpp:2368
export function OSD_WriteAliases(fp) {
  {
    const __cxx_range_array_0 = cRecordObject(osd).symbptrs;
    if (__cxx_range_array_0.length !== 512) throw new RangeError("C array extent mismatch");
    if (!__cxx_range_array_0[Symbol.for("source-first.clang-pointer-array/1")]) throw new TypeError("C pointer array storage ABI missing");
    for (let __cxx_range_index_0 = 0; __cxx_range_index_0 < 512; ++__cxx_range_index_0) {
      if (cPointerCompare(__cxx_range_array_0[__cxx_range_index_0], null, "==")) {
        break;
      } else {
        if (cPointerCompare(cRecordObject(__cxx_range_array_0[__cxx_range_index_0]).func, cSourceAddresses.decode(4919), "==")) {
          buildvfs_fputstr__header_163fcf6be917(fp, "alias \"");
          buildvfs_fputstrptr(fp, cRecordObject(__cxx_range_array_0[__cxx_range_index_0]).name);
          buildvfs_fputstr__header_0dfa66d80e1e(fp, "\" \"");
          buildvfs_fputstrptr(fp, cRecordObject(__cxx_range_array_0[__cxx_range_index_0]).help);
          buildvfs_fputstr__header_8914c35a14a1(fp, "\"\n");
        }
      }
    }
  }
}

// C/C++ source: source/build/src/osd.cpp:2385
const __cxx_literal_6a4765cfd04720efcf20 = Uint8Array.from([32, 34, 37, 102, 34, 10, 0]);
const __cxx_literal_08f6598c4e40488f195a = Uint8Array.from([32, 34, 37, 102, 34, 10, 0]);
const __cxx_literal_1ae67f37edbd87fdb739 = Uint8Array.from([32, 34, 37, 100, 34, 10, 0]);
const __cxx_literal_3cdb0ef543b1b01496e3 = Uint8Array.from([32, 34, 37, 117, 34, 10, 0]);
export function OSD_WriteCvars(fp) {
  void 0;
  let buf = cZeroAggregate({"array": "Uint8Array", "dims": [64]});
  for (let i = i32(0); (i < cRecordObject(osd).numcvars); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; }))) {
    let pData = cRecordObject((cPointerElementRef(cRecordObject(osd).cvars, i).value).pData);
    if (((!Boolean(u32((pData.flags & u32(256))))) && Boolean(OSD_CvarModified(cPointerOffset(cRecordObject(osd).cvars, i, 16))))) {
      switch (u32((pData.flags & u32(63)))) {
        case u32(1): {
          buildvfs_fputstrptr(fp, pData.name);
        }
        snprintf(buf, 64, __cxx_literal_6a4765cfd04720efcf20, (cDeref(pData.__cxx_anonymous_2.f, Float32Array).value));
        buildvfs_fputstrptr(fp, buf);
        break;
        case u32(32): {
          buildvfs_fputstrptr(fp, pData.name);
        }
        snprintf(buf, 64, __cxx_literal_08f6598c4e40488f195a, (cDeref(pData.__cxx_anonymous_2.d, Float64Array).value));
        buildvfs_fputstrptr(fp, buf);
        break;
        case u32(2):
        case u32(8): {
          buildvfs_fputstrptr(fp, pData.name);
        }
        snprintf(buf, 64, __cxx_literal_1ae67f37edbd87fdb739, (cDeref(pData.__cxx_anonymous_2.i32, Int32Array).value));
        buildvfs_fputstrptr(fp, buf);
        break;
        case u32(4): {
          buildvfs_fputstrptr(fp, pData.name);
        }
        snprintf(buf, 64, __cxx_literal_3cdb0ef543b1b01496e3, (cDeref(pData.__cxx_anonymous_2.u32, Uint32Array).value));
        buildvfs_fputstrptr(fp, buf);
        break;
        case u32(16): {
          if ((pData.__cxx_anonymous_2.string && Boolean((cDeref(cPointerOffset(pData.__cxx_anonymous_2.string, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))) {
            buildvfs_fputstrptr(fp, pData.name);
            buildvfs_fputstr__header_8914c35a14a1(fp, " \"");
            buildvfs_fputstrptr(fp, pData.__cxx_anonymous_2.string);
            buildvfs_fputstr__header_8914c35a14a1(fp, "\"\n");
          }
        }
        break;
        default: {
          __builtin_unreachable();
        }
      }
    }
  }
}

// C/C++ source: source/build/include/compat.h:1169
export const pow2char__header_global_66413628a3df7c67 = new Uint8Array([(u32(1) & 255), (u32(2) & 255), (u32(4) & 255), (u32(8) & 255), (u32(16) & 255), (u32(32) & 255), (u32(64) & 255), (u32(128) & 255)]);
function __cxx_static_address_59d0f2cd7d0701af2f2a0d2c() {
  return __cxx_static_address_59d0f2cd7d0701af2f2a0d2c.reference || (__cxx_static_address_59d0f2cd7d0701af2f2a0d2c.reference = {
    __cReference: true,
    get value() { return pow2char__header_global_66413628a3df7c67; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_59d0f2cd7d0701af2f2a0d2c() { return __cxx_static_address_59d0f2cd7d0701af2f2a0d2c(); }

// C/C++ source: source/build/include/baselayer.h:172
export const g_defaultVideoModes__header_global_35adac1381ac169d = cByteRecordNDArray({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, [25], {}, [cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 2560, "y": 1440}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 2560, "y": 1200}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 2560, "y": 1080}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1920, "y": 1440}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1920, "y": 1200}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1920, "y": 1080}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1680, "y": 1050}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1600, "y": 1200}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1600, "y": 900}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1366, "y": 768}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1280, "y": 1024}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1280, "y": 960}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1280, "y": 720}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1152, "y": 864}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1024, "y": 768}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1024, "y": 600}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 800, "y": 600}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 640, "y": 480}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 640, "y": 400}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 512, "y": 384}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 480, "y": 360}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 400, "y": 300}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 320, "y": 240}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 320, "y": 200}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 0, "y": 0}, null, {})]);
function __cxx_static_address_ead188cca5b48162fb155481() {
  return __cxx_static_address_ead188cca5b48162fb155481.reference || (__cxx_static_address_ead188cca5b48162fb155481.reference = {
    __cReference: true,
    get value() { return g_defaultVideoModes__header_global_35adac1381ac169d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:188
export const g_keyAsciiTable__header_global_be2e77f43026110c = new Uint8Array([(u32(0) & 255), (u32(0) & 255), 49, 50, 51, 52, 53, 54, 55, 56, 57, 48, 45, 61, (u32(0) & 255), (u32(0) & 255), 113, 119, 101, 114, 116, 121, 117, 105, 111, 112, 91, 93, (u32(0) & 255), (u32(0) & 255), 97, 115, 100, 102, 103, 104, 106, 107, 108, 59, (u32(39) & 255), 96, (u32(0) & 255), (u32(92) & 255), 122, 120, 99, 118, 98, 110, 109, 44, 46, 47, (u32(0) & 255), 42, (u32(0) & 255), (u32(32) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), 55, 56, 57, 45, 52, 53, 54, 43, 49, 50, 51, 48, 46, (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255)]);
function __cxx_static_address_86505b5977f7034d9621aa75() {
  return __cxx_static_address_86505b5977f7034d9621aa75.reference || (__cxx_static_address_86505b5977f7034d9621aa75.reference = {
    __cReference: true,
    get value() { return g_keyAsciiTable__header_global_be2e77f43026110c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_86505b5977f7034d9621aa75() { return __cxx_static_address_86505b5977f7034d9621aa75(); }

// C/C++ source: source/build/include/baselayer.h:196
export const g_keyAsciiTableShift__header_global_e1159f15f687f49c = new Uint8Array([(u32(0) & 255), (u32(0) & 255), 33, 64, 35, 36, 37, 94, 38, 42, 40, 41, 95, 43, (u32(0) & 255), (u32(0) & 255), 81, 87, 69, 82, 84, 89, 85, 73, 79, 80, 123, 125, (u32(0) & 255), (u32(0) & 255), 65, 83, 68, 70, 71, 72, 74, 75, 76, 58, 34, 126, (u32(0) & 255), 124, 90, 88, 67, 86, 66, 78, 77, 60, 62, 63, (u32(0) & 255), 42, (u32(0) & 255), (u32(32) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), 55, 56, 57, 45, 52, 53, 54, 43, 49, 50, 51, 48, 46, (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255)]);
function __cxx_static_address_e8ea18019e203770ecebe0af() {
  return __cxx_static_address_e8ea18019e203770ecebe0af.reference || (__cxx_static_address_e8ea18019e203770ecebe0af.reference = {
    __cReference: true,
    get value() { return g_keyAsciiTableShift__header_global_e1159f15f687f49c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_e8ea18019e203770ecebe0af() { return __cxx_static_address_e8ea18019e203770ecebe0af(); }

// C/C++ source: source/build/include/build.h:895
export const pow2long__header_global_98b4672d8978dd4b = new Int32Array([1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144, 524288, 1048576, 2097152, 4194304, 8388608, 16777216, 33554432, 67108864, 134217728, 268435456, 536870912, 1073741824, 2147483647]);
function __cxx_static_address_06b87c7d33aab458b15f7e05() {
  return __cxx_static_address_06b87c7d33aab458b15f7e05.reference || (__cxx_static_address_06b87c7d33aab458b15f7e05.reference = {
    __cReference: true,
    get value() { return pow2long__header_global_98b4672d8978dd4b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_06b87c7d33aab458b15f7e05() { return __cxx_static_address_06b87c7d33aab458b15f7e05(); }

// C/C++ source: source/build/include/build.h:907
export const pow2ulong__header_global_967d023c09448336 = new Uint32Array([u32(1), u32(2), u32(4), u32(8), u32(16), u32(32), u32(64), u32(128), u32(256), u32(512), u32(1024), u32(2048), u32(4096), u32(8192), u32(16384), u32(32768), u32(65536), u32(131072), u32(262144), u32(524288), u32(1048576), u32(2097152), u32(4194304), u32(8388608), u32(16777216), u32(33554432), u32(67108864), u32(134217728), u32(268435456), u32(536870912), u32(1073741824), u32(2147483648n)]);
function __cxx_static_address_fe72bc8a561b4f7ed843826c() {
  return __cxx_static_address_fe72bc8a561b4f7ed843826c.reference || (__cxx_static_address_fe72bc8a561b4f7ed843826c.reference = {
    __cReference: true,
    get value() { return pow2ulong__header_global_967d023c09448336; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_fe72bc8a561b4f7ed843826c() { return __cxx_static_address_fe72bc8a561b4f7ed843826c(); }

// C/C++ source: source/build/include/build.h:919
export const pow264__header_global_74a44b65f4270ffa = new BigInt64Array([BigInt(i64(1)), BigInt(i64(2)), BigInt(i64(4)), BigInt(i64(8)), BigInt(i64(16)), BigInt(i64(32)), BigInt(i64(64)), BigInt(i64(128)), BigInt(i64(256)), BigInt(i64(512)), BigInt(i64(1024)), BigInt(i64(2048)), BigInt(i64(4096)), BigInt(i64(8192)), BigInt(i64(16384)), BigInt(i64(32768)), BigInt(i64(65536)), BigInt(i64(131072)), BigInt(i64(262144)), BigInt(i64(524288)), BigInt(i64(1048576)), BigInt(i64(2097152)), BigInt(i64(4194304)), BigInt(i64(8388608)), BigInt(i64(16777216)), BigInt(i64(33554432)), BigInt(i64(67108864)), BigInt(i64(134217728)), BigInt(i64(268435456)), BigInt(i64(536870912)), BigInt(i64(1073741824)), BigInt(2147483648n), BigInt(4294967296n), BigInt(8589934592n), BigInt(17179869184n), BigInt(34359738368n), BigInt(68719476736n), BigInt(137438953472n), BigInt(274877906944n), BigInt(549755813888n), BigInt(1099511627776n), BigInt(2199023255552n), BigInt(4398046511104n), BigInt(8796093022208n), BigInt(17592186044416n), BigInt(35184372088832n), BigInt(70368744177664n), BigInt(140737488355328n), BigInt(281474976710656n), BigInt(562949953421312n), BigInt(1125899906842624n), BigInt(2251799813685248n), BigInt(4503599627370496n), BigInt(9007199254740992n), BigInt(18014398509481984n), BigInt(36028797018963968n), BigInt(72057594037927936n), BigInt(144115188075855872n), BigInt(288230376151711744n), BigInt(576460752303423488n), BigInt(1152921504606846976n), BigInt(2305843009213693952n), BigInt(4611686018427387904n), BigInt(9223372036854775807n)]);
function __cxx_static_address_7e925fd9618f8e5ba98325dd() {
  return __cxx_static_address_7e925fd9618f8e5ba98325dd.reference || (__cxx_static_address_7e925fd9618f8e5ba98325dd.reference = {
    __cReference: true,
    get value() { return pow264__header_global_74a44b65f4270ffa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_7e925fd9618f8e5ba98325dd() { return __cxx_static_address_7e925fd9618f8e5ba98325dd(); }

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

export function clamp__header_b0c3fa1a2e69(__cxx_in, min, max) {
  return i32(((__cxx_in <= i32(min)) ? i32(min) : ((__cxx_in >= i32(max)) ? i32(max) : __cxx_in)));
}

export function swap__header_a0a35c41caf9(a, b) {
  let t = (u32((cDeref(a, Uint8Array).value)) & 255);
  ((cDeref(a, Uint8Array).value) = (u32((cDeref(b, Uint8Array).value)) & 255));
  ((cDeref(b, Uint8Array).value) = (u32(t) & 255));
}

export function swap__header_77b8dba6d6c9(a, b) {
  let t = (u32((cDeref(a, Uint8Array).value)) & 255);
  ((cDeref(a, Uint8Array).value) = (u32((cDeref(b, Uint8Array).value)) & 255));
  ((cDeref(b, Uint8Array).value) = (u32(t) & 255));
}

export function SILENCE_UNUSED__header_6bbb1911a9af(arg0, arg1) {

}

export function bitmap_test__header_2bb4557834f3(ptr, n) {

  return Boolean((i32((i32((cDeref(cPointerOffset(ptr, i32((n >> 3)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & i32((cDeref(cPointerOffset(pow2char__header_global_66413628a3df7c67, i32((n & 7)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))) == i32((cDeref(cPointerOffset(pow2char__header_global_66413628a3df7c67, i32((n & 7)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value))));
}

export function ARRAY_SIZE__header_72600e724364(arg0) {
  return u64(10n);
}

export function clamp__header_8a7517c11404(__cxx_in, min, max) {
  return Math.fround(((__cxx_in <= Math.fround(Math.fround(min))) ? Math.fround(Math.fround(min)) : ((__cxx_in >= Math.fround(Math.fround(max))) ? Math.fround(Math.fround(max)) : __cxx_in)));
}

export function clamp__header_d02f8e4f541f(__cxx_in, min, max) {
  return ((__cxx_in <= min) ? min : ((__cxx_in >= max) ? max : __cxx_in));
}

export function clamp__header_a39de2443867(__cxx_in, min, max) {
  return u64(((__cxx_in <= u64(min)) ? u64(min) : ((__cxx_in >= u64(max)) ? u64(max) : __cxx_in)));
}

export function buildvfs_fputstr__header_163fcf6be917(fp, str) {
  if (fp) {
    fwrite(cRef(() => str, __cxx_lvalue_0 => { str = __cxx_lvalue_0; }), u64(1), u64((BigInt(u64(8n)) - BigInt(u64(1)))), fp);
  }
}

export function buildvfs_fputstr__header_0dfa66d80e1e(fp, str) {
  if (fp) {
    fwrite(cRef(() => str, __cxx_lvalue_0 => { str = __cxx_lvalue_0; }), u64(1), u64((BigInt(u64(4n)) - BigInt(u64(1)))), fp);
  }
}

export function buildvfs_fputstr__header_8914c35a14a1(fp, str) {
  if (fp) {
    fwrite(cRef(() => str, __cxx_lvalue_0 => { str = __cxx_lvalue_0; }), u64(1), u64((BigInt(u64(3n)) - BigInt(u64(1)))), fp);
  }
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

export function __cxx_operator_761c63d1e16e183f(lhs, rhs) {
  return cCopyTrivialClass(lhs.__cxx_operator_86b05ee676890126(rhs), ClockTicks(), ["wholeTicks", "ticksS32"]);
}

export function __cxx_operator_35d41574d9c68141(lhs, rhs) {
  return Boolean((lhs.wholeTicks == rhs.wholeTicks));
}

export function __cxx_operator_11a696315e969ab4(lhs, rhs) {
  return Boolean((lhs.wholeTicks < rhs.wholeTicks));
}

export function __cxx_operator_9d5bfff63c86ec9c(lhs, rhs) {
  return Boolean(__cxx_operator_11a696315e969ab4(rhs, lhs));
}

// Original Clang-generated fragment; imports existing owner storage.
export { osd_addsymbol, osd_findexactsymbol } from "./_source_legacy_osd_cpp_ea55377351f3.mjs";

// Original Clang-generated fragment; imports existing owner storage.
export { osdcmd_cvar_set, osdfunc_toggle } from "./_source_legacy_osd_cpp_af7584467b87.mjs";

// Original Clang-generated fragment; imports existing owner storage.
export { OSD_ResizeDisplay, OSD_SetTextMode, OSD_StripColors, OSD_UpdateDrawBuffer, abs__cxx_46e283b93b66, abs__cxx_585d5f3fa303, abs__cxx_cb7f54cbd79f, abs__cxx_ec0831d17d6b, osdcmd_cvar_set_osd } from "./_source_legacy_osd_cpp_3c8185980f0a.mjs";

// Original Clang-generated fragment; imports existing owner storage.
export { _internal_drawosdchar, _internal_drawosdcursor, _internal_drawosdstr, klabs } from "./_source_legacy_osd_cpp_2255541e0308.mjs";

// Original Clang-generated fragment; imports existing owner storage.
export { __atomic_add, __cxx_operator_e73606c6bb71dfa0, __exchange_and_add, __is_constant_evaluated, __is_valid_cmpexch_failure_order, __source_byte_method_compare_exchange_weak_1c47e055455677a6758c, __source_byte_method_compare_exchange_weak_1f155a1ebc79bfd153c6, __source_byte_method_load_8c900e6fe18ffce51024, __source_byte_method_load_d45fe9c1d1662fe18dae, __source_byte_method_push_380753adf605bd3c3414, min, tabledivide32 } from "./_source_legacy_osd_cpp_96454e4990d4.mjs";
