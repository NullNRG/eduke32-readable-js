// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/build/src/engine.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
import { Destroy__cxx_static_777d0ae31c789182 } from "./smmalloc_generic.cpp.mjs";
import { __cxx_record_vec2_2150e186aab2ebda } from "./clip.cpp.mjs";
import { __cxx_global_cell_11016d3c7177543e564ab46c } from "./compat.cpp.mjs";

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

export function __cxx_record_vec2_8ca824f0ac397ec5() {
  return __cxx_record_vec2_8ca824f0ac397ec5.type || (__cxx_record_vec2_8ca824f0ac397ec5.type = class __cxx_record_vec2_8ca824f0ac397ec5__implementation {
  constructor() {
    return Object.setPrototypeOf(cZeroAggregate({"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "prototype": "__cxx_record_vec2_8ca824f0ac397ec5", "size": 4, "union": false}}, {"__cxx_record_vec2_8ca824f0ac397ec5": () => __cxx_record_vec2_8ca824f0ac397ec5().prototype}), new.target.prototype);
  }
  __cxx_operator_1f4b549e7f7975f3(c) {
    return Boolean(Boolean(i32((i32((i32(this.x) != i32(c.x))) | i32((i32(this.y) != i32(c.y)))))));
  }
});
}

// C/C++ source: source/build/include/build.h:761
export let upscalefactor = 0;
export function __cxx_global_cell_46fbe924187022a575efe0a8() {
  return __cxx_global_cell_46fbe924187022a575efe0a8.reference || (__cxx_global_cell_46fbe924187022a575efe0a8.reference = {
    __cReference: true,
    get value() { return upscalefactor; },
    set value(__cxx_lvalue_0) { upscalefactor = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/include/build.h:774
export let validmodecnt = 0;
export function __cxx_global_cell_959ecb0f89b58217d69a30a7() {
  return __cxx_global_cell_959ecb0f89b58217d69a30a7.reference || (__cxx_global_cell_959ecb0f89b58217d69a30a7.reference = {
    __cReference: true,
    get value() { return validmodecnt; },
    set value(__cxx_lvalue_0) { validmodecnt = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:286
export function initcrc16() {
  let i;
  let j;
  let k;
  let a;
  for ((j = i32(0)); (j < 256); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => j, __cxx_lvalue_1 => { j = __cxx_lvalue_1; }))) {
    for ((((i = i32(7)), (k = i32((j << 8)))), (a = i32(0))); (i >= 0); (((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i32((previous - 1)); __cxx_lvalue_2.value = next; return previous; })(cRef(() => i, __cxx_lvalue_3 => { i = __cxx_lvalue_3; })), (k = i32((i32((k << 1)) & 65535))))) {
      if (Boolean(i32((i32((k ^ a)) & 32768)))) {
        (a = i32((i32((i32((a << 1)) & 65535)) ^ 4129)));
      } else {
        (a = i32((i32((a << 1)) & 65535)));
      }
    }
    ((cDeref(cPointerOffset(crctab16, j, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((a & 65535)));
  }
}

// C/C++ source: source/build/include/compat.h:1367
export function engineDestroyAllocator() {
  Destroy__cxx_static_777d0ae31c789182(__cxx_global_cell_11016d3c7177543e564ab46c().value);
}

// C/C++ source: source/build/src/engine.cpp:9149
export let preinitcalled = i32(0);
function __cxx_static_address_5127bf7d54074c32ac833da9() {
  return __cxx_static_address_5127bf7d54074c32ac833da9.reference || (__cxx_static_address_5127bf7d54074c32ac833da9.reference = {
    __cReference: true,
    get value() { return preinitcalled; },
    set value(__cxx_lvalue_0) { preinitcalled = i32(__cxx_lvalue_0); }
  });
}
export function __cxx_private_cell_5127bf7d54074c32ac833da9() { return __cxx_static_address_5127bf7d54074c32ac833da9(); }

// C/C++ source: source/build/src/engine.cpp:9152
export let spriteext_s = cByteRecordNDArray({"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"tspr": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "size": 8, "union": true}, "offset": 0}, "alpha": {"native": "Float32Array", "offset": 8, "size": 4}, "filler": {"length": 12, "native": "Uint8Array", "offset": 52, "size": 12}, "flags": {"native": "Uint16Array", "offset": 12, "size": 2}, "mdangoff": {"native": "Int16Array", "offset": 20, "size": 2}, "mdanimcur": {"native": "Int16Array", "offset": 14, "size": 2}, "mdanimtims": {"native": "Uint32Array", "offset": 16, "size": 4}, "mdpitch": {"native": "Int16Array", "offset": 24, "size": 2}, "mdpivot_offset": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 28}, "mdposition_offset": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 40}, "mdroll": {"native": "Int16Array", "offset": 26, "size": 2}, "xpanning": {"native": "Uint8Array", "offset": 22, "size": 1}, "ypanning": {"native": "Uint8Array", "offset": 23, "size": 1}}, "overlaps": true, "size": 64, "union": false}, [16640], {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}, []);
function __cxx_static_address_3c22db54197c50244e570b3b() {
  return __cxx_static_address_3c22db54197c50244e570b3b.reference || (__cxx_static_address_3c22db54197c50244e570b3b.reference = {
    __cReference: true,
    get value() { return spriteext_s; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/engine.cpp:9153
export let spritesmooth_s = cByteRecordNDArray({"align": 1, "arrayAlign": 1, "fields": {"mdcurframe": {"native": "Int16Array", "offset": 4, "size": 2}, "mdoldframe": {"native": "Int16Array", "offset": 6, "size": 2}, "mdsmooth": {"native": "Int16Array", "offset": 8, "size": 2}, "smoothduration": {"native": "Float32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 10, "union": false}, [16640], {}, []);
function __cxx_static_address_9ff199cc86599d9f1f9e95e3() {
  return __cxx_static_address_9ff199cc86599d9f1f9e95e3.reference || (__cxx_static_address_9ff199cc86599d9f1f9e95e3.reference = {
    __cReference: true,
    get value() { return spritesmooth_s; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/engine.cpp:9154
export let sector_s = cByteRecordNDArray({"align": 4, "arrayAlign": 1, "fields": {"ceilingheinum": {"native": "Int16Array", "offset": 18, "size": 2}, "ceilingpal": {"native": "Uint8Array", "offset": 21, "size": 1}, "ceilingpicnum": {"native": "Int16Array", "offset": 16, "size": 2}, "ceilingshade": {"native": "Int8Array", "offset": 20, "size": 1}, "ceilingstat": {"native": "Uint16Array", "offset": 12, "size": 2}, "ceilingxpanning": {"native": "Uint8Array", "offset": 22, "size": 1}, "ceilingypanning": {"native": "Uint8Array", "offset": 23, "size": 1}, "ceilingz": {"native": "Int32Array", "offset": 4, "size": 4}, "extra": {"native": "Int16Array", "offset": 38, "size": 2}, "floorheinum": {"native": "Int16Array", "offset": 26, "size": 2}, "floorpal": {"native": "Uint8Array", "offset": 29, "size": 1}, "floorpicnum": {"native": "Int16Array", "offset": 24, "size": 2}, "floorshade": {"native": "Int8Array", "offset": 28, "size": 1}, "floorstat": {"native": "Uint16Array", "offset": 14, "size": 2}, "floorxpanning": {"native": "Uint8Array", "offset": 30, "size": 1}, "floorypanning": {"native": "Uint8Array", "offset": 31, "size": 1}, "floorz": {"native": "Int32Array", "offset": 8, "size": 4}, "fogpal": {"native": "Uint8Array", "offset": 33, "size": 1}, "hitag": {"native": "Int16Array", "offset": 36, "size": 2}, "lotag": {"native": "Int16Array", "offset": 34, "size": 2}, "visibility": {"native": "Uint8Array", "offset": 32, "size": 1}, "wallnum": {"native": "Int16Array", "offset": 2, "size": 2}, "wallptr": {"native": "Int16Array", "offset": 0, "size": 2}}, "overlaps": false, "size": 40, "union": false}, [4098], {}, []);
function __cxx_static_address_57a7edf2c0691b02e77503ed() {
  return __cxx_static_address_57a7edf2c0691b02e77503ed.reference || (__cxx_static_address_57a7edf2c0691b02e77503ed.reference = {
    __cReference: true,
    get value() { return sector_s; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/engine.cpp:9155
export let wall_s = cByteRecordNDArray({"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 8, "union": true}, "offset": 0}, "cstat": {"native": "Uint16Array", "offset": 14, "size": 2}, "extra": {"native": "Int16Array", "offset": 30, "size": 2}, "hitag": {"native": "Int16Array", "offset": 28, "size": 2}, "lotag": {"native": "Int16Array", "offset": 26, "size": 2}, "nextsector": {"native": "Int16Array", "offset": 12, "size": 2}, "nextwall": {"native": "Int16Array", "offset": 10, "size": 2}, "overpicnum": {"native": "Int16Array", "offset": 18, "size": 2}, "pal": {"native": "Uint8Array", "offset": 21, "size": 1}, "picnum": {"native": "Int16Array", "offset": 16, "size": 2}, "point2": {"native": "Int16Array", "offset": 8, "size": 2}, "shade": {"native": "Int8Array", "offset": 20, "size": 1}, "xpanning": {"native": "Uint8Array", "offset": 24, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 22, "size": 1}, "ypanning": {"native": "Uint8Array", "offset": 25, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 23, "size": 1}}, "overlaps": true, "size": 32, "union": false}, [16896], {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}, []);
function __cxx_static_address_def18c5f2ddd780b4e9aae03() {
  return __cxx_static_address_def18c5f2ddd780b4e9aae03.reference || (__cxx_static_address_def18c5f2ddd780b4e9aae03.reference = {
    __cReference: true,
    get value() { return wall_s; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/engine.cpp:9157
export let wallext_s = cByteRecordNDArray({"align": 1, "arrayAlign": 1, "fields": {"blend": {"native": "Uint8Array", "offset": 0, "size": 1}}, "overlaps": false, "size": 1, "union": false}, [16384], {}, []);
function __cxx_static_address_8a7d8d4292bcc0ae39450c8f() {
  return __cxx_static_address_8a7d8d4292bcc0ae39450c8f.reference || (__cxx_static_address_8a7d8d4292bcc0ae39450c8f.reference = {
    __cReference: true,
    get value() { return wallext_s; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/engine.cpp:9159
export let sprite_s = cByteRecordNDArray({"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, "offset": 0}, "xyz": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "__cxx_anonymous_15": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"xvel": {"native": "Int16Array", "offset": 0, "size": 2}, "yvel": {"native": "Int16Array", "offset": 2, "size": 2}, "zvel": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "vel": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}, "z": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"d": {"native": "Int16Array", "offset": 0, "size": 2}, "u": {"native": "Int16Array", "offset": 2, "size": 2}, "v": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "prototype": "__cxx_record_vec2_8ca824f0ac397ec5", "size": 4, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 0}}, "overlaps": true, "size": 6, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 32}, "ang": {"native": "Int16Array", "offset": 28, "size": 2}, "blend": {"native": "Uint8Array", "offset": 19, "size": 1}, "clipdist": {"native": "Uint8Array", "offset": 18, "size": 1}, "cstat": {"native": "Uint16Array", "offset": 12, "size": 2}, "extra": {"native": "Int16Array", "offset": 42, "size": 2}, "hitag": {"native": "Int16Array", "offset": 40, "size": 2}, "lotag": {"native": "Int16Array", "offset": 38, "size": 2}, "owner": {"native": "Int16Array", "offset": 30, "size": 2}, "pal": {"native": "Uint8Array", "offset": 17, "size": 1}, "picnum": {"native": "Int16Array", "offset": 14, "size": 2}, "sectnum": {"native": "Int16Array", "offset": 24, "size": 2}, "shade": {"native": "Int8Array", "offset": 16, "size": 1}, "statnum": {"native": "Int16Array", "offset": 26, "size": 2}, "xoffset": {"native": "Int8Array", "offset": 22, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 20, "size": 1}, "yoffset": {"native": "Int8Array", "offset": 23, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 21, "size": 1}}, "overlaps": true, "size": 44, "union": false}, [16384], {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype, "__cxx_record_vec2_8ca824f0ac397ec5": () => __cxx_record_vec2_8ca824f0ac397ec5().prototype}, []);
function __cxx_static_address_16c293837f97979c8bb0839d() {
  return __cxx_static_address_16c293837f97979c8bb0839d.reference || (__cxx_static_address_16c293837f97979c8bb0839d.reference = {
    __cReference: true,
    get value() { return sprite_s; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/engine.cpp:9160
export let tsprite_s = cByteRecordNDArray({"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, "offset": 0}, "xyz": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "__cxx_anonymous_15": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"xvel": {"native": "Int16Array", "offset": 0, "size": 2}, "yvel": {"native": "Int16Array", "offset": 2, "size": 2}, "zvel": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "vel": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}, "z": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"d": {"native": "Int16Array", "offset": 0, "size": 2}, "u": {"native": "Int16Array", "offset": 2, "size": 2}, "v": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "prototype": "__cxx_record_vec2_8ca824f0ac397ec5", "size": 4, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 0}}, "overlaps": true, "size": 6, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 32}, "ang": {"native": "Int16Array", "offset": 28, "size": 2}, "blend": {"native": "Uint8Array", "offset": 19, "size": 1}, "clipdist": {"native": "Uint8Array", "offset": 18, "size": 1}, "cstat": {"native": "Uint16Array", "offset": 12, "size": 2}, "extra": {"native": "Int16Array", "offset": 42, "size": 2}, "hitag": {"native": "Int16Array", "offset": 40, "size": 2}, "lotag": {"native": "Int16Array", "offset": 38, "size": 2}, "owner": {"native": "Int16Array", "offset": 30, "size": 2}, "pal": {"native": "Uint8Array", "offset": 17, "size": 1}, "picnum": {"native": "Int16Array", "offset": 14, "size": 2}, "sectnum": {"native": "Int16Array", "offset": 24, "size": 2}, "shade": {"native": "Int8Array", "offset": 16, "size": 1}, "statnum": {"native": "Int16Array", "offset": 26, "size": 2}, "xoffset": {"native": "Int8Array", "offset": 22, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 20, "size": 1}, "yoffset": {"native": "Int8Array", "offset": 23, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 21, "size": 1}}, "overlaps": true, "size": 44, "union": false}, [4096], {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype, "__cxx_record_vec2_8ca824f0ac397ec5": () => __cxx_record_vec2_8ca824f0ac397ec5().prototype}, []);
function __cxx_static_address_6ab8e02ef92e8b99e5120115() {
  return __cxx_static_address_6ab8e02ef92e8b99e5120115.reference || (__cxx_static_address_6ab8e02ef92e8b99e5120115.reference = {
    __cReference: true,
    get value() { return tsprite_s; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:619
export let sector = null;
export function __cxx_global_cell_9d5d7fcf3aa35a4809f92551() {
  return __cxx_global_cell_9d5d7fcf3aa35a4809f92551.reference || (__cxx_global_cell_9d5d7fcf3aa35a4809f92551.reference = {
    __cReference: true,
    get value() { return sector; },
    set value(__cxx_lvalue_0) { sector = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/build/include/build.h:621
export let sprite = null;
export function __cxx_global_cell_4a046e33ecf7aced9bfd0007() {
  return __cxx_global_cell_4a046e33ecf7aced9bfd0007.reference || (__cxx_global_cell_4a046e33ecf7aced9bfd0007.reference = {
    __cReference: true,
    get value() { return sprite; },
    set value(__cxx_lvalue_0) { sprite = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/build/include/build.h:613
export let spriteext = null;
export function __cxx_global_cell_e6d5c05c99c236717ba2a685() {
  return __cxx_global_cell_e6d5c05c99c236717ba2a685.reference || (__cxx_global_cell_e6d5c05c99c236717ba2a685.reference = {
    __cReference: true,
    get value() { return spriteext; },
    set value(__cxx_lvalue_0) { spriteext = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/build/include/build.h:1102
export let crctab16 = new Int32Array(256);
function __cxx_static_address_681d91e9d37d37453c2dd947() {
  return __cxx_static_address_681d91e9d37d37453c2dd947.reference || (__cxx_static_address_681d91e9d37d37453c2dd947.reference = {
    __cReference: true,
    get value() { return crctab16; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:614
export let spritesmooth = null;
export function __cxx_global_cell_2487f0a2e0979a5d48ff1cd7() {
  return __cxx_global_cell_2487f0a2e0979a5d48ff1cd7.reference || (__cxx_global_cell_2487f0a2e0979a5d48ff1cd7.reference = {
    __cReference: true,
    get value() { return spritesmooth; },
    set value(__cxx_lvalue_0) { spritesmooth = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/build/include/build.h:622
export let tsprite = null;
export function __cxx_global_cell_4f8c0a98fe113810db905f6a() {
  return __cxx_global_cell_4f8c0a98fe113810db905f6a.reference || (__cxx_global_cell_4f8c0a98fe113810db905f6a.reference = {
    __cReference: true,
    get value() { return tsprite; },
    set value(__cxx_lvalue_0) { tsprite = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/build/include/build.h:620
export let wall = null;
export function __cxx_global_cell_4d8aaa64f68587b18e27604c() {
  return __cxx_global_cell_4d8aaa64f68587b18e27604c.reference || (__cxx_global_cell_4d8aaa64f68587b18e27604c.reference = {
    __cReference: true,
    get value() { return wall; },
    set value(__cxx_lvalue_0) { wall = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/build/include/build.h:616
export let wallext = null;
export function __cxx_global_cell_64b1dd24a985c284baf44a16() {
  return __cxx_global_cell_64b1dd24a985c284baf44a16.reference || (__cxx_global_cell_64b1dd24a985c284baf44a16.reference = {
    __cReference: true,
    get value() { return wallext; },
    set value(__cxx_lvalue_0) { wallext = __cxx_lvalue_0; }
  });
}

// Original Clang-generated fragment; imports existing owner storage.
export { apptitle, numsectors, numwalls, r_displayindex, validmode, __cxx_global_cell_0d84c36af55f8d659082f1bb, __cxx_global_cell_9fbed4c78bef6ce8bf955682, __cxx_global_cell_a69b3d47547d48eac82bcf95 } from "./_source_legacy_engine_cpp_86be2c79c4c0.mjs";

// Original Clang-generated fragment; imports existing owner storage.
export { pow2char__header_global_712730224f5e2862, qsetmode, xdim, ydim, ylookup, __cxx_private_cell_3dbbd23dc4df226e70c52d7b, __cxx_global_cell_6fba320e7d23de23519fe332, __cxx_global_cell_22f848239c12c0d9f2b6f9e3, __cxx_global_cell_ce636929c03d679219ea2982, __cxx_global_cell_6ef139bca6611fb821515c5d } from "./_source_legacy_engine_cpp_b109dbbe1c92.mjs";

// Original Clang-generated fragment; imports existing owner storage.
export { inpreparemirror, mirrorBuffer, palookup, __cxx_global_cell_9541123d8c6d2c52896ac26a, __cxx_global_cell_96cc27380f17556df4ccc300 } from "./_source_legacy_engine_cpp_bb4ab6fdc107.mjs";

// Original Clang-generated fragment; imports existing owner storage.
export { printext256 } from "./_source_legacy_engine_cpp_c106aed1475b.mjs";

// Original Clang-generated fragment; imports existing owner storage.
export { __atomic_add, __atomic_add_single, __cxx_operator_11a696315e969ab4, __cxx_operator_35d41574d9c68141, __cxx_operator_9d5bfff63c86ec9c, __exchange_and_add, __exchange_and_add_single, __gthread_active_p, __gthread_mutex_lock, __gthread_mutex_unlock, __gthread_recursive_mutex_lock, __gthread_recursive_mutex_unlock, __is_constant_evaluated, _mm_and_si128, _mm_or_si128, _mm_xor_si128, fix16_from_dbl, fix16_from_float, fix16_from_int, fix16_half__header_global_32abdaf38138b574, fix16_mod, fix16_one__header_global_1ff90da45b33318d, fix16_to_dbl, fix16_to_float, fix16_to_int, flt_f161r__header_global_08ad66003e737fed, libdivide_128_div_128_to_64, libdivide_32_div_16_to_16, libdivide_count_leading_zeros16, libdivide_count_leading_zeros32, libdivide_count_leading_zeros64, libdivide_mullhi_s16, libdivide_mullhi_s32, libdivide_mullhi_s64, libdivide_mullhi_u16, libdivide_mullhi_u32, libdivide_mullhi_u64, min, operator_delete___ZdlPvS_, operator_delete_array___ZdaPvS_, tabledivide32 } from "./_source_legacy_engine_cpp_8b5d59287bf2.mjs";

// Original Clang-generated fragment; imports existing owner storage.
export { g_videoContrast, g_videoGamma, g_videoSaturation, maxspritesonscreen, novoxmips, r_borderless, r_fpgrouscan, r_rotatespriteinterp, r_screenxy, __cxx_global_cell_eb7ec64efb5dec6e758a65c7, __cxx_global_cell_92f6ec0c3a993b574f308abb, __cxx_global_cell_a6f1e8c839618189cf2ebd7a, __cxx_global_cell_4723a60d88a1aa0814b17967, __cxx_global_cell_7e42dba8ea8f9a8bc3318fdc, __cxx_global_cell_67da6fc124c3ab1d5da4a606, __cxx_global_cell_d33e7d272649317fa29cc706, __cxx_global_cell_839b6dd579d4126718a101c3, __cxx_global_cell_585083e70b316eace630e342 } from "./_source_legacy_engine_cpp_9ec4db31e891.mjs";

// Original Clang-generated fragment; imports existing owner storage.
export { britable, palette } from "./_source_legacy_engine_cpp_a7183815435c.mjs";

// Original Clang-generated fragment; imports existing owner storage.
export { ARRAY_SIZE__header_3fb05a303daa, bakdmost, bakumost, divscale, divscale16, divscale32, dmost, dotp1, dotp2, dplc, dwall, fxdimen, halfxdimen, horizlookup, horizlookup2, horizycent, kensmessage, lastx, lookups, lplc, lwall, max__template_b1cfaf2244c73238, min__cxx_d283c7086cbc, min__template_774131ccff66371d, newaspect_enable, nodesperline, oviewingrange, oxdimen, oxyaspect, r_usenewaspect, radarang2, renderSetAspect, scale, searchx, searchy, setaspect_new_use_dimen, smost, startdmost, startumost, swall, swallf, swplc, tabledivide64, umost, uplc, uwall, videoGetRenderMode, viewingrange, viewingrangerecip, wx1, wx2, wy1, wy2, xdimen, xdimenrecip, xdimenscale, xdimscale, xrealloc, xyaspect, ydimen, ysavecnt, yxaspect, __cxx_private_cell_d3e9e18f891884c6c96f52fe, __cxx_private_cell_23bb7f67ca630bc65b4c93bd, __cxx_private_cell_8eaacff0c38c7a01c1b3d98a, __cxx_private_cell_c45848d776e78e3ad15aa19e, __cxx_private_cell_f680dc34f3f16b7605bd2076, __cxx_private_cell_030dea20292b8ccfb253f2f2, __cxx_private_cell_06af83b949965f384726a5d5, __cxx_global_cell_c332faf0c44a2245574f00c2, __cxx_global_cell_7f82f1ce39a55e3695e486ff, __cxx_private_cell_6ef572a4d918a9b697b4e317, __cxx_private_cell_ef565da95f0d7e5345f8f6f7, __cxx_private_cell_e991bfcab826047ea36d44dc, __cxx_private_cell_a0cf17e5040f768fecaa0eed, __cxx_private_cell_ada883e80594d1c803381375, __cxx_private_cell_faaa894d8f96459328af7d1c, __cxx_private_cell_01c16f662f9d8ebf17e1b4d9, __cxx_private_cell_60e94246258c1e5f501cf23e, __cxx_global_cell_86f16538d5c8fb71ab0764a7, __cxx_private_cell_504ad5559007d6f33ec65ccc, __cxx_private_cell_2b8c40034bcea70c222db70e, __cxx_private_cell_e173003857febd280b59233f, __cxx_global_cell_1b985dff60433db520d1c28e, __cxx_global_cell_1719e7bd91d790092d913225, __cxx_private_cell_79c096bc46ac26f0340ef029, __cxx_global_cell_853c2f0031b3fbadbddd90e9, __cxx_global_cell_66460e3d31d56a66ad1ade0c, __cxx_global_cell_9fb8f07246a7e914e0b9d5d8, __cxx_private_cell_17ebf087dc87d0c7c2704242, __cxx_global_cell_3be09651661a7974b1bb1434, __cxx_global_cell_26d4b87c2e0d474be07ce565, __cxx_private_cell_096acb25228b09dae41dc959, __cxx_private_cell_efae0614594f44eeb6e58297, __cxx_private_cell_14183efcf620ecfb8850097d, __cxx_private_cell_cda2119587abc71704501e74, __cxx_private_cell_80245ff0670b238fddf41674, __cxx_private_cell_8fac817ec1046bcc9af9d807, __cxx_global_cell_c84014786923d3572b20a599, __cxx_private_cell_ad1b18ed8e716c2860429776, __cxx_global_cell_5d3f7e3c255e1e4d3dba7fa2, __cxx_global_cell_73872b378ae600f82ef1585d, __cxx_global_cell_94e67cd1b6471a084977e82f, __cxx_global_cell_8513acc4c7b23588d79953c0, __cxx_global_cell_1bb1070901d1e89087ee9441, __cxx_global_cell_dee358e91a1a7f2a6d37a5a5, __cxx_global_cell_c52bd54e6d33290c61ff7d56, __cxx_global_cell_8237672c9966884eda00f429, __cxx_global_cell_04e37a4474feb35e339a7e25, __cxx_global_cell_6314158c901ae0222f46040e, __cxx_private_cell_1489693e4d227075879c91f9, __cxx_global_cell_9de9945f48c8bc47d005b6f8 } from "./_source_legacy_engine_cpp_85380f0701c0.mjs";

// Original Clang-generated fragment; imports existing owner storage.
export { r_tror_nomaskpass, usevoxels, __cxx_global_cell_8afc3f1714c50fd848123c08, __cxx_global_cell_77d5c24237b7b046074e378d } from "./_source_legacy_engine_cpp_53b6aef9c124.mjs";

// Original Clang-generated fragment; imports existing owner storage.
export { engineDestroyAllocator__header_0328fac25cb3, enginePreInit } from "./_source_legacy_engine_cpp_1a801ee25ce2.mjs";

// Original Clang-generated fragment; imports existing owner storage.
export { ARRAY_SIZE__header_0ca2c0fefe7c, ARRAY_SIZE__header_eb1dc12ec43c, B_PASS16__header_b0a656a2f158, B_PASS16__header_cd4096824faf, B_PASS32__header_62f2ccfacebc, B_UNBUF16__header_7bb30a873fc5, DrawDebugSpriteMarkers, FIX16_MAX__header_global_32235a946cc19e2b, FIX16_MIN__header_global_a04c37a358353344, FIX16_OVERFLOW__header_global_dbf3fe7dac04ab33, GetCenterPoint, GetCornerPoints, NEGATE_ON_CONDITION__header_2f9aae09d992, Numsprites, PolymostDrawMasks, PolymostPrepareMasks, SILENCE_UNUSED__header_5a02d0661e03, SILENCE_UNUSED__header_8685d1f62898, __cxx_operator_6d2a22ee5048dd1a, __cxx_operator_761c63d1e16e183f, __cxx_record_vec2_ccdfb33065300c8e, __cxx_record_vec3_82cfac1168cb3a1b, __cxx_record_vec4_6f720c065427e7b3, abs, addscaleclamp, alignceilslope, alignflorslope, animateoffs, append_ext_UNSAFE__header_c8357a666341, asm1, asm2, asm3, asm4, autogray, automapping, bad_tspr__header_1d627620a587, bakframeplace, baktile, bakwindowxy1, bakwindowxy2, bakxsiz, bakysiz, beforedrawrooms, benchmarkScreenshot, bitmap_clear__header_4ac52a79d043, bitmap_set__header_029e06cde64d, bitmap_set__header_3ddae889b678, bitmap_test__header_955f0b2ebc45, bitmap_test__header_a5cdcb94d80d, blackcol, blendtable, bufplce, bunchdist, bunches, bunchfirst, bunchfront, bunchlast, bunchp2, bunchsec, calc_bufplc, calc_globalshifts, calc_vplcinc, calc_vplcinc_sprite, calc_vplcinc_wall, calcbritable, changespritesect, changespritestat, checksectorpointer, chsecptr_onextwall, circlewall, clamp__header_8da804c99317, clamp__header_972e781d1069, clamp__header_d0f16d9fb1b6, classicScanSector, classicht, clippoly, clippoly4, comparetsprites, convertv5sectv6__header_a5905cc8a6e5, convertv5sprv6__header_7ffd8234a739, convertv5wallv6__header_035b580f4f9f, convertv6sectv7__header_b5deb5fa14b3, convertv6sprv7__header_0875eb7128dd, convertv6wallv7__header_74aaf7309edb, cosglobalang, cosviewingrangeglobalang, deletesprite, display_mirror, distrecip, distrecipagecnt, distrecipcache, divscale12__header_36c6ecc2bbd6, divscale13__header_a7c80861075b, divscale16__header_bf3fe3f68516, divscale18__header_0602a1bcaeea, divscale19__header_4779467fc113, divscale20__header_f2d890945610, divscale21__header_2cd13b2c0681, divscale24__header_0d6157cc62c1, divscale28__header_7cfae1b8c204, divscale30__header_359493770c51, divscale32__header_d249c6950b93, divscale64__header_6f5b83e52daa, divscale6__header_057cee1fc9ab, divscale__header_df55107a75ba, dmulscale10__header_7f2947fb0277, dmulscale14__header_de5cc9315a24, dmulscale16__header_3b05ae8142b5, dmulscale17__header_9bcb39a8638a, dmulscale18__header_12af30603bc7, dmulscale1__header_6595639393de, dmulscale20__header_24eaa227d6cb, dmulscale24z, dmulscale25__header_a6fd0cf72991, dmulscale28__header_1e2e1572434b, dmulscale2__header_4687fd622afb, dmulscale32__header_a06d61cce60b, dmulscale3__header_aa88439571c0, dmulscale4__header_98cfd5b283cb, dmulscale6__header_3ffb9a5d0a39, dmulscale8__header_30990f859ae7, dmulscale9__header_09a25d91be44, do_deletespritesect, do_deletespritestat, do_insertsprite_at_headofsect, do_insertsprite_at_headofstat, dorotspr_handle_bit2, dosetaspect, dragpoint, drawing_sprite, ebpbak, editorcolors, editorcolorsdef, editorzrange, editstatus, editwall, engineFatalError, enginePrepareLoadBoard, enginecompatibilitymode, engineerrstr, equation, espbak, faketile, faketiledata, faketilesize, fglobalposx, fglobalposy, fglobalposz, findUnusedTile, fix16_deg_to_rad_mult__header_global_610322778390b388, fix16_from_float__header_9014b8844600, fix16_from_int__header_080657abf896, fix16_rad_to_deg_mult__header_global_28f55fc8c17e2993, fix16_to_float__header_dc75c8949808, fix16_to_int__header_d5d1e3ae7024, floorsprite_dims, fpuasm, frameoffset, g_defaultVideoModes__header_global_888d589830207b0c, g_haveVoxels, g_keyAsciiTableShift__header_global_d5c97c353cbd7658, g_keyAsciiTable__header_global_7ad58865f6844c02, g_loadedMapVersion, g_nodraw, g_pskyidx, g_rotatespriteNoWidescreen, g_visibility, g_windowPos, g_windowPosValid, getVoxelColorMap, get_alwaysshowgray, get_floorspr_center__header_7edd9651e893, get_floorspr_dims__header_cf267038c604, get_floorspr_points__header_831650d20b51, get_mapversion, get_rel_coords, get_screen_coords, get_skipgraysectors, get_wallspr_center__header_a959641b90ef, get_wallspr_dims__header_c0e6ee5eca43, get_wallspr_points__header_fe63d0e57f1b, getangle, getceilzofslope__header_3b8c3d220a1d, getceilzofslopeptr, getclipmask__header_25a26495e020, getclosestpointonline, getclosestpointonwall_internal, getcorrectceilzofslope__header_f262719a07f5, getcorrectflorzofslope__header_04653e92f3bb, getcrc16__header_6717f56e8526, getflorzofslope__header_72278bf6a72d, getflorzofslopeptr, gethiq16angle, getpalookup__header_9e0e2706a9a3, getpalookupsh__header_1bc310a9a306, getpsky__header_97569e722ad5, getpskyidx__header_e608a775435f, getreachabilitybitmap, getreachabilitybitmapsegmentsize, getreachabilitybitmapsize, getscore, getsectordist, getwalldist__cxx_01db5a1f8ca7, getwalldist__cxx_7a1ab48e409e, getzsofslope__header_6908eff42e16, getzsofslopeptr, ggbuf, gglogx, gglogy, ggpal, ggpinc, ggxinc, ggyinc, global100horiz, globalang, globalb, globalbufplc, globalcisibility, globalclipdist, globalcursectnum, globaldclip, globalflags, globalg, globalhisibility, globalhoriz, globalht, globalispow2, globalnoeffect, globalorientation, globalpal, globalpalwritten, globalpicnum, globalpisibility, globalpolytype, globalposx, globalposy, globalposz, globalr, globalshade, globalshiftval, globaltilesizy, globaluclip, globalvisibility, globalx1, globalx2, globalx3, globalxpanning, globalxshift, globalxspan, globaly1, globaly2, globaly3, globalypanning, globalyscale, globalyshift, globalyspan, globalzd, globvis, gotpic, gotsector, graysectbitmap, graywallbitmap, guniqhudid, h_xoffs, h_xsize, h_yoffs, h_ysize, halfxdim16, have_maptext, haveymost, headsectbunch, headspritesect, headspritestat, highlightcnt, initksqrt, initspritelists, insertsprite, insertspritestat, inside, inside_19950829, inside_compat, inside_exclude_p__header_0eb2a5f7bb44, inside_exclude_z_p__header_3de2b9ff700b, inside_p__header_6c2c67bc1240, inside_z_p__header_28f513c35767, klabs__header_eea20f2d4b3b, ksgn__header_6f4a2c55100d, ksqrt, ksqrtasm_old, lastwall, linehighlight, lintersect, loopnumofsector, lowrecip, mapversion, maskwall, maskwallcnt, max__template_cabf12978d41a12c, max__template_f609c7b01b7889e2, maxvoxcol, midydim16, min__template_16d592da45d1e47f, min__template_5f5393344013bb3a, mirrorsx1, mirrorsx2, mirrorsy1, mirrorsy2, mslopevlin, msqrtasm, mulscale10__header_45d6136c31a4, mulscale11__header_67f3f756c259, mulscale12__header_4015a101abee, mulscale14__header_b233ab7c2031, mulscale15__header_dc9d6d1d3568, mulscale16__header_2ad7f18331e0, mulscale16z, mulscale18__header_2e5aab2cbe66, mulscale19__header_ac0120e047ad, mulscale1__header_46cf257f6a73, mulscale20__header_c4282e210e65, mulscale20z, mulscale21__header_1eccb132e47c, mulscale22__header_42530064526a, mulscale24__header_b2d0fd89216d, mulscale27__header_a07635317506, mulscale28__header_75ea132a7023, mulscale2__header_140bec1d36ae, mulscale30__header_5f7e383a1e2c, mulscale31__header_a8faf60e26f6, mulscale32__header_7f4f7cd9fc70, mulscale4__header_d996771b657e, mulscale5__header_a9c8933cfeb1, mulscale6__header_5635a24338fa, mulscale7__header_28d9d5a5d03b, mulscale8__header_34d78e8ed7b8, mulscale__header_25763d8f4ac3, mulscale_triple30, multipsky, multipskytile, nextsectbunch, nextsectorneighborz, nextspritesect, nextspritestat, nextvoxid, no_radarang2, nonpow2_mhline, nrx1, nrx2, nry1, nry2, nsqrtasm__header_2324c22cfe44, numalphatabs, numbunches, numframes, numgraysects, numhits, numpages, numscans, numshades, numyaxbunches, nytooclose, nytoofar, oldnonpow2, paletteloaded, palookupoffse, parallaxtype, parallaxvisibility, parallaxyoffs_override, parallaxyscale_override, permfifo, permhead, permtail, picanm, picsiz, pointhighlight, pow264__header_global_75549ea18b6b413d, pow2char_, pow2invfloat, pow2long__header_global_b6a453f05dcc1c29, pow2ulong__header_global_c101361bfcafcb7a, prepwall, prevspritesect, prevspritestat, printext16, printext_checkypos, pskybits_override, pskynummultis, qglobalang, qglobalhoriz, qradarang, r_windowpositioning, radarang, randomseed, reachablesectors, reciptable, redcol, remove_sprite, renderAddTSpriteFromSprite__header_d17fe8582af7, renderAddTsprite, renderFlushPerms, renderMakeTSpriteFromSprite__header_34b2a77e58ce, renderPrepareMirror, rintersect_old, rotatepoint, rotatesprite_y_offset, rotatesprite_yxaspect, rotatespritesmoothratio, rottile, rx1, rx2, rxi, rxi2, ry1, ry2, ryi, ryi2, rzi, rzi2, s_equation, sameside, scale__header_4e3ca6271a0c, scansector_collectsprites, scansector_retfast, searchbottomwall, searchisbottom, searchit, searchsector, searchstat, searchwall, sectorborder, sectorhighlight, sectorofwall, sectorofwall_internal, sectorofwall_noquick, sectorofwallv5__header_a79e4b70ad66, sectortypev5, sectortypev6, set_globalang, set_globalpos__header_2dabc92af8b0, setfirstwall, setgotpic__header_28317d6431de, setslope, setup_globals_sprite1, setup_globals_wall2, setviewcnt, shlookup, should_clip_cwall, should_clip_fwall, show2dsector, show2dsprite, show2dwall, showfirstwall, showgraysectors, showheightindicators, showinnergray, showinvisibility, singlobalang, sintable, sinviewingrangeglobalang, slopalookup, sloptable, smostcnt, smoststart, smostwall, smostwallcnt, smostwalltype, sortsprites, spriteGetSlope__header_76c1a567cae3, spritecol2d, spriteheightofs__header_8e49a2bc7855, spriteheightofsptr, spritesortcnt, spritesxyz, spritetypev5, spritetypev6, spritewallfront, sqrtable, sqrtable_old, squarerotatetile, swap__header_2a28141e0e7c, swap__header_34fe25370a47, swap__header_b3d07767a73a, swap__header_d9629fc219ee, swapchar2__header_fd0bf6906f7c, tabledivide32__header_91ded9eb26d6, tabledivide64__header_6297e4c5d4e3, tailspritefree, tempbuf, thesector, thewall, tileInvalidate, tileSetupSky, tileUpdatePicnum__header_73f463eb462e, tilecols, tilefilenum, tilesiz, tiletovox, totalclock, totalclocklock, tslopevlin, tspriteGetSlope__header_68db8d154bd9, tspriteGetZOfSlope__header_0ebea63573a3, tspriteptr, tweak_tsizes, uhypsq__header_5727bece84fb, updatesector_compat, updatesector_tryremaining, updatesectorexclude, updatesectorneighborlist, updatesectorneighbormap, updatesectorz_compat, updatesectorz_tryremaining, vgapal16, videoClearScreen, videoClearViewableArea, videoGetRenderMode__header_54b2a5f525a6, videoSetRenderMode, vince, vox_clearid, vox_undefine, voxflags, voxlock, voxoff, voxpal, voxscale, vplce, wallength, wallfront, wallmost_getz, wallsect, wallsprite_dims, walltypev5, walltypev6, wallvisible, walock, waloff, whitecol, windowxy1, windowxy2, wrandomseed, xaligned_alloc__header_49915531efa6, xaligned_free__header_3c2bcb0a9ae6, xb1, xb2, xcalloc__header_63bbae275ae4, xfree__header_196f14a5f8eb, xmalloc__header_9dbf0d1f74e7, xrealloc__header_0e172b9ae74c, xsi, yax_bunchnum, yax_cansee_fixsector, yax_cmpbunches, yax_copytsprites, yax_getbunch, yax_getbunches__header_dab3f1f07637, yax_getceilzofslope, yax_getflorzofslope, yax_getneighborsect, yax_getnextwall, yax_globalbunch, yax_globalcf, yax_globallev, yax_gotsector, yax_isislandwall__header_0ed122867acc, yax_islockededge, yax_layershift, yax_nextwall, yax_nomaskdidit, yax_nomaskpass, yax_polymostclearzbuffer, yax_preparedrawrooms, yax_scanbunches, yax_setbunch, yax_setbunches, yax_setnextwall, yax_spritesortcnt, yax_tsprfrombunch, yax_tsprite, yax_tweakpicnums, yax_update, yax_updategrays, yax_updown, yax_vnextsec, yax_walldist, yb1, yb2, ydim16, ydmost, ymostallocsize, ysi, yumost, __cxx_global_cell_4e6f24ae9c3dade74700992b, __cxx_global_cell_82092c85dd1ef591b7bfad4d, __cxx_global_cell_895032355ce4415fcae21c5a, __cxx_global_cell_18730c9a0e44ac303abc65ca, __cxx_global_cell_0344b4b1b7e3fa404649dc96, __cxx_global_cell_79ae1e2577864c4c74a4536f, __cxx_global_cell_c1c0a03508c5080698c5ec5d, __cxx_private_cell_bc0710a7f482cec1fa7adb40, __cxx_private_cell_72f8763c3cf6b1d2b6ec8cca, __cxx_private_cell_a9914059c8eef8e8ca55539e, __cxx_private_cell_9b71414557c59aee76d026e5, __cxx_private_cell_d145d20dfddd2f283e2b1349, __cxx_global_cell_38f0f26c8a0f77e2834be49e, __cxx_global_cell_e493776e01f353d2a6806578, __cxx_private_cell_da28bd9cbd572226c258c92f, __cxx_private_cell_d9e273b556c7a8d984653b8e, __cxx_private_cell_f777bb45771eb3d4fe5a7c2b, __cxx_global_cell_28f960d82b466c468df65b74, __cxx_global_cell_dbd314a0c8319a7b84603c9b, __cxx_global_cell_c783b9980ebf92aa7eec38a8, __cxx_global_cell_8f2b0f863536eea3001e26a8, __cxx_global_cell_27361f8c1fd7174d309e19f2, __cxx_private_cell_771ef78915fc71c7a152d1a5, __cxx_private_cell_85eb43bf48d03040f4b54b36, __cxx_private_cell_8ef7c98c27354f6f1ce8191f, __cxx_global_cell_25026ffa5b07a8851193a64a, __cxx_global_cell_3361b43cd89bac1a415bdcb9, __cxx_global_cell_bb20f7f3674f33a33d515ebc, __cxx_global_cell_e51112961ed1d98dff606e68, __cxx_global_cell_3ec01ada27550b8525913d32, __cxx_global_cell_5dca29e734234c42c8a19a5d, __cxx_global_cell_1a8fcfa99f53245406636ec4, __cxx_global_cell_2c59d83c7865966be0051eb9, __cxx_global_cell_b9787af6aae3563f7d4f5bd3, __cxx_global_cell_f986176c2358743bd466872f, __cxx_global_cell_01a46c84a0b94a486211f0c8, __cxx_private_cell_460eb2df901ea15c1593e21a, __cxx_private_cell_fde2415709d1c0fee5bc85db, __cxx_global_cell_55f4cd3ce9872cde496d8dad, __cxx_global_cell_bca995f44e11705f1e25a500, __cxx_global_cell_c55d5c171c5137818b672aba, __cxx_global_cell_7dc6e906fd58688c90792303, __cxx_global_cell_e22c3a838bd598f964b2aab0, __cxx_global_cell_b9268bcd54dec167c4a7cf60, __cxx_global_cell_e262794d9997adc8dcfb5b2d, __cxx_private_cell_c0676dc261c4b4bcfb09e277, __cxx_private_cell_90cff107ec86bc9e027227e3, __cxx_private_cell_81fa3bf4abda47a1a60bfafd, __cxx_private_cell_8875afa67461fab657e882ab, __cxx_private_cell_a4e3b612802a2fb9b41ac028, __cxx_private_cell_1a60aa0089bdaa82abc35bed, __cxx_private_cell_e44b4895e186af1c5923dc7c, __cxx_private_cell_8089555d741cac8580da0a1e, __cxx_global_cell_11389f8841553d21f8fe902e, __cxx_global_cell_81af557897af1f573210de4b, __cxx_private_cell_0cf6e9bb12665e66ac7150db, __cxx_global_cell_1fc5736efed0ee886cdb6ab1, __cxx_global_cell_72a3e5978bae92f510bbc380, __cxx_global_cell_4b2cfd21f94290e7fd5d4039, __cxx_private_cell_b7fff70fb07beccc2312e8cc, __cxx_global_cell_687ad03e56ad49d91da7ede0, __cxx_global_cell_23f70e7a799326383b6cae79, __cxx_global_cell_ef33eb533071cecccbae278f, __cxx_global_cell_5f80e6bd487cb5ba980fe5b1, __cxx_private_cell_3cd677b99cb94a25f3d9ed02, __cxx_private_cell_0b13edc0bffc01cd59b43a07, __cxx_global_cell_2a6cfa64fa913b83240764d5, __cxx_global_cell_ea54eab8067004e04507e160, __cxx_global_cell_d3e2cd8ae72fbf8d494238da, __cxx_global_cell_094ba97ebf4fa8da86d8ce6f, __cxx_global_cell_5b9f2cfa1814cbe47a8a5958, __cxx_global_cell_79cf4e6ca1e92593fb1fc9be, __cxx_private_cell_b440f0668e6471433fea5140, __cxx_global_cell_e2e7e2e78c13d070a54f6acf, __cxx_global_cell_d8d658bfa3384159b7740692, __cxx_global_cell_88f83be237d62d6a2ea45595, __cxx_global_cell_a248700a49a9585168c4d6fc, __cxx_global_cell_f14ae80b266ffc07f1d273f0, __cxx_private_cell_38582e647526ec6d09e0ef21, __cxx_global_cell_0dfc66b4b4d22501236ea95d, __cxx_private_cell_7baa579a03792f1f476c1022, __cxx_global_cell_51e80e31d85b4fcc19a38e9d, __cxx_global_cell_b77149ba49860aa16abd90a9, __cxx_private_cell_2e3bafd8d861dd53117316e5, __cxx_global_cell_17e326d906bfd20495e4467e, __cxx_private_cell_46290cd4da2a2c088d3036e0, __cxx_private_cell_d4e58eacc400ef5a62c6ac04, __cxx_private_cell_416e9fc55b99267b9a2f168b, __cxx_private_cell_2f438a259b3cd48139522696, __cxx_global_cell_b5d36e09cbdb238b45ee0604, __cxx_global_cell_b7e0057dd4e0a0e8decb5847, __cxx_private_cell_8b13efd5797e3d6d05ae2368, __cxx_private_cell_47c32b851c625392bd2e81b5, __cxx_private_cell_2b3b1cb0a6563f9d3d2b7e01, __cxx_private_cell_9da1ffa0025fc4af6f670f7d, __cxx_private_cell_9a862ac1fb19b2104af89911, __cxx_global_cell_513c3e0e39a75ced4b6afb73, __cxx_global_cell_c7f67e27827c40ee873f6392, __cxx_global_cell_1f251a6d70a45c654081cf38, __cxx_global_cell_2d245383a6df30f5c99d1939, __cxx_global_cell_422f2fbf66cdfa734fd66a68, __cxx_private_cell_a97991e96b9c73923af30bf9, __cxx_global_cell_cb2e0a258fc01cfd6ce86a21, __cxx_global_cell_ef67f04433f41be3caf2391d, __cxx_global_cell_ba80300438aabbb362bcb96a, __cxx_global_cell_5eb12bcb5dada82061cfcbd7, __cxx_private_cell_cd328c22c3d578eee0f9b68d, __cxx_private_cell_868462cfdb733aea09ebd7ed, __cxx_private_cell_7942d4824cd70176426002a4, __cxx_private_cell_07eb31fe62a97eaa361e2bed, __cxx_global_cell_9a1da9581bb10e12e9507dd9, __cxx_global_cell_dad5bc86f245af7b0202a36f, __cxx_global_cell_a729c98a85231190f038ffde, __cxx_private_cell_1d913d82db9b7837e1cf9241, __cxx_private_cell_1a44dd855d748a769c54b4ca, __cxx_private_cell_05b543f6f295efb4339475f0, __cxx_private_cell_24fe196549dea24f2ab5b180, __cxx_private_cell_2ed8ccc57174f9413796b22f, __cxx_global_cell_98d4df84d94f4e1b0e9e0c4b, __cxx_global_cell_8fca8d596f33dd54caae1045, __cxx_global_cell_40ab01100c3cafbb5bf1052e, __cxx_global_cell_ff2772a0123ef46ba7fdaf5b, __cxx_private_cell_f8cd5c27ed55874dfd97cf99, __cxx_global_cell_e7587e075f0e1bcf83dd9001, __cxx_global_cell_06d6a31cd434f505d6050036, __cxx_global_cell_14c13a42eb4ff2885eee0cc2, __cxx_global_cell_65a1b3b3dadd66a019af6c35, __cxx_private_cell_dbad1a3d343407d618b0e9e7, __cxx_global_cell_2ecdb66f06cb14d421e278fc, __cxx_global_cell_a55dffbc5cd0f1b3f7bccd1e, __cxx_global_cell_35e882b8c9a8046f9e92164d, __cxx_global_cell_3c62113020c8788be6f213d9, __cxx_global_cell_f4f0304cc5aba4a89983581e, __cxx_private_cell_69e961035c9e18cb70ebe65d, __cxx_private_cell_0a00e930e9d0eddd619065a1, __cxx_global_cell_0972c2ab00fc82a0e5bce288, __cxx_private_cell_9954c89d202d38322327deeb, __cxx_private_cell_868592f603b3b55596974c04, __cxx_private_cell_ed697d33e67d0fca05900cf2, __cxx_private_cell_139fef308da9f7d9172eeae1, __cxx_global_cell_5581ff39ab20a6ef0f2dd3e2, __cxx_global_cell_657da161243aac44db0e415b, __cxx_global_cell_64649f97ae3084a695c7ad0e, __cxx_global_cell_e1c66c2b2a33b1b7ec4cd0fd, __cxx_private_cell_a9ceb7efa2316dcfdf6d9a99, __cxx_global_cell_186a56702bd0331093afe212, __cxx_private_cell_e88929426cec0931cc919f9b, __cxx_global_cell_cff3db0365d00ccd4662087c, __cxx_private_cell_896db579dcea810a995205f6, __cxx_global_cell_3cf6aa8792595191f9ca195d, __cxx_global_cell_f6c55103bb34c1bae0a56530, __cxx_global_cell_1eb1cfb64d199abe24ad949b, __cxx_global_cell_08ed94ef856e4813ce5fe775, __cxx_private_cell_068adba1b736e12efe7afe91, __cxx_private_cell_1415ea54e5c6f940788b90e6, __cxx_private_cell_b2919153503f62f1786d1698, __cxx_private_cell_049caae2838f96aad7b07473, __cxx_private_cell_58a85746d70aa4e5707bab2e, __cxx_private_cell_f148b3f9de71d63a6143576d, __cxx_global_cell_97f50e0ecee5a63408160028, __cxx_global_cell_99da9ae092f975be5c931076, __cxx_global_cell_88812decd85addca772bef18, __cxx_global_cell_f61d3e4e57e19b57ad740e14, __cxx_global_cell_13fe4c65d8939cebedb650dd, __cxx_global_cell_eb7f66098f65c0ae5a9b5a5a, __cxx_global_cell_ae84628ac59743286e72f468, __cxx_global_cell_3b04054f5b5c111d2e7c3124, __cxx_global_cell_b4ff498842e2196a4975d35e, __cxx_private_cell_81959cfc27b74166013f3949, __cxx_global_cell_1c9437d4fabcfa69169d72c3, __cxx_global_cell_c150b54ee1b7c3eac4b7f1ab, __cxx_global_cell_3be22aa3dcdac8b3e93cd3d9, __cxx_global_cell_513040affb50dad26a7507e7, __cxx_global_cell_897ba5cfd83783a7343a70d6, __cxx_global_cell_08064e67275a42c22a5bb4ad, __cxx_global_cell_d2e028be33820ccc16211022, __cxx_private_cell_d1743bdc820efd27b6986917, __cxx_private_cell_83633d59cfaed491e970ff60, __cxx_private_cell_ca852d2155586e819921bf0e, __cxx_private_cell_e7a5dadddee3611ff8989412, __cxx_private_cell_ad12f2e61fed2248b6963840, __cxx_private_cell_785665e0d8217a62addbe810, __cxx_global_cell_138b3585b71dcf40bb04bbf8, __cxx_global_cell_a53297299ceed099141e8628, __cxx_private_cell_ed12f328f5ec16a2a0117bdd, __cxx_global_cell_37d96f0d18da4d1ab96cf9c5, __cxx_global_cell_64c52629d0a5e3511310f13a, __cxx_private_cell_c6733b0abac829a1062464dd, __cxx_global_cell_741c460e893f5c54c47c5ab5, __cxx_global_cell_221fd34161be9be2eedf7faf, __cxx_global_cell_46c79554e27038ae817b7d39, __cxx_global_cell_c51fcdf4111f2095a57e764d, __cxx_private_cell_201027d9659e1e7a6d85c028, __cxx_private_cell_df740e53b07a57e6ded21d47, __cxx_global_cell_3cf81ba309123d77364eacb4, __cxx_global_cell_8c24f6cd9de093fd196d5dd7, __cxx_global_cell_037058065a0bd0356792c8e6, __cxx_private_cell_1724ffcaa6916c44078b8f65, __cxx_global_cell_0b65540d4ae56d317d478f3e, __cxx_global_cell_b967223302fe3c34e2a71860, __cxx_global_cell_db65dbb9c23304a26e8153c7, __cxx_private_cell_869e607d726731e928787277, __cxx_private_cell_6470f9c98b209c001ff345a3, __cxx_private_cell_1fdde1859899a75bdce05d96, __cxx_private_cell_dc155f0a32dda1658282becf, __cxx_private_cell_a83ad9c0013256eb32a910f9, __cxx_private_cell_e0194add7de57bbb76f68ab6, __cxx_global_cell_0ba1704deb2d0c84177d6fd9, __cxx_private_cell_e005868bfa744aadf515ec8d, __cxx_private_cell_eb60f20ba7afbcf39b95243f, __cxx_private_cell_dfd6c16c042094bdf175dc19, __cxx_private_cell_2148fd6834343ed3c93bd0f1 } from "./_source_legacy_engine_cpp_7317576b8d08.mjs";

// Original Clang-generated fragment; imports existing owner storage.
export { ClockTicks, engineInit, engineLoadTables, fix16_one, krecipasm__header_09db86f177a5 } from "./_source_legacy_engine_cpp_f313c6453b01.mjs";

// Original Clang-generated fragment; imports existing owner storage.
export { enginePostInit } from "./_source_legacy_engine_cpp_413986d623dd.mjs";

// Original Clang-generated fragment; imports existing owner storage.
export { applyVoxelColorMap, ceilspritehline, ceilspritescan, hline, nonpow2_thline, owallmost, paletteGetClosestColorUpToIndex__header_eceea0878d26, rayintersect, renderFillPolygon, renderRestoreTarget, renderSetTarget, rintersect, setupslopevlin_alsotrans, slowhline, transmaskvline, transmaskvline2, videoAllocateBuffers, videoSet2dMode, videoSetCorrectedAspect, videoSetGameMode, videoSetViewableArea, wallmost, wallmosts_finish } from "./_source_legacy_engine_cpp_fac278f79cb6.mjs";

// Original Clang-generated fragment; imports existing owner storage.
export { pow2char, __cxx_private_cell_06afb7607c36925d71b82247 } from "./_source_legacy_engine_cpp_9db8937f37d9.mjs";

// Original Clang-generated fragment; imports existing owner storage.
export { bfirst_search_init__template_bac72b9f4bd83b32, bfirst_search_try__template_422b1d52b4ee4d34, calc_sector_reachability, engineFinishLoadBoard, updatesector, updatesectorneighbor } from "./_source_legacy_engine_cpp_ab395e6bd4e1.mjs";

// Original Clang-generated fragment; imports existing owner storage.
export { check_sprite } from "./_source_legacy_engine_cpp_fc91a4910d27.mjs";

// Original Clang-generated fragment; imports existing owner storage.
export { engineLoadBoard } from "./_source_legacy_engine_cpp_97e60b5ff8a7.mjs";

// Original Clang-generated fragment; imports existing owner storage.
export { engineUnInit } from "./_source_legacy_engine_cpp_be9a97ad2eaf.mjs";

// Original Clang-generated fragment; imports existing owner storage.
export { fix16_half } from "./_source_legacy_engine_cpp_188401a550aa.mjs";

// Original Clang-generated fragment; imports existing owner storage.
export { ceilscan, findwallbetweensectors, florscan, maskwallscan, parascan, qloadkvx, renderDrawMapView, renderDrawMaskedWall, sectorsareconnected, setsprite, setspritez, setup_globals_cf1, setup_globals_wall1, tileLoadHigh, tileLoadScaled, transmaskwallscan, updatesectorneighborz, updatesectorz, wallscan } from "./_source_legacy_engine_cpp_af0ec10e2fe7.mjs";

// Original Clang-generated fragment; imports existing owner storage.
export { Blrintf__header_0b8e7f162fef, classicDrawBunches, falpha_to_blend, fgrouscan, grouscan, renderDrawRoomsQ16 } from "./_source_legacy_engine_cpp_edc8d0b413d0.mjs";
