// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/build/include/xxhash.h
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
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

// Native JavaScript implementation of verified C byte-memory operations.
// This is not CPU emulation. All accesses remain inside the original storage.
// A C source pointer represented by an opaque JS array of nonbyte values is
// rejected: its object representation has not been proven or materialized.
const cByteMemory = (() => {
  const extent = (source, amount) => {
    const n = Number(amount);
    if ((typeof amount !== 'number' && typeof amount !== 'bigint') ||
        !Number.isSafeInteger(n) || n < 0) throw new RangeError('invalid C byte count');
    let buffer, start, lower, upper;
    if (source?.__cDeferredPointer===true || source?.__cDeferredReference===true)
      return extent(source.resolve(),amount);
    if (source?.__cReference===true&&source.__cPointer!==true) return extent(source.value,amount);
    if (source && source.__cPointer === true) {
      const records=source.array && source.buffer?.[Symbol.for('source-first.clang-byte-record-array/1')];
      if (records instanceof Uint8Array) {
        buffer=records.buffer;start=records.byteOffset+source.offset;
        lower=records.byteOffset+source.lower;upper=records.byteOffset+source.upper;
        if (source.upper>records.byteLength) throw new RangeError('C record pointer bounds exceed original allocation');
      } else if (source.array || !(source.buffer instanceof ArrayBuffer))
        throw new TypeError('C byte operation needs actual contiguous byte storage');
      else {({buffer,lower,upper}=source); start=source.offset;}
    } else if (ArrayBuffer.isView(source) && !(source instanceof DataView)) {
      ({buffer}=source); start=source.byteOffset;
      lower=start; upper=start+source.byteLength;
    } else {
      const bytes=source?.[Symbol.for('source-first.clang-byte-record-array/1')] ||
                  source?.[Symbol.for('source-first.original-byte-record-storage/1')]?.bytes;
      if (!(bytes instanceof Uint8Array))
        throw new TypeError('C byte operation requires bounded native TypedArray or C pointer');
      ({buffer}=bytes);start=bytes.byteOffset;lower=start;upper=start+bytes.byteLength;
    }
    if (!Number.isSafeInteger(start) || start<lower || start>upper ||
        !Number.isSafeInteger(upper) || n>upper-start)
      throw new RangeError('C byte operation exceeds original allocation');
    globalThis[Symbol.for('source-lp64-addresses/2')]?.assert(buffer,start,n);
    return {buffer,start,n,view:new Uint8Array(buffer,start,n)};
  };
  const cstring = source => {
    // C's char* addresses have bounded storage, not JavaScript UTF-16 strings.
    // Accept the same owned byte views as memcpy and stop only at a NUL byte.
    if (source && source.__cPointer === true) {
      if (source.array || !(source.buffer instanceof ArrayBuffer) ||
          !Number.isSafeInteger(source.offset) || source.offset<source.lower ||
          source.offset>source.upper)
        throw new TypeError('unproven C char pointer storage');
      globalThis[Symbol.for('source-lp64-addresses/2')]?.assert(source.buffer,source.offset,source.upper-source.offset);
      return new Uint8Array(source.buffer,source.offset,source.upper-source.offset);
    }
    if (ArrayBuffer.isView(source) && !(source instanceof DataView))
      return new Uint8Array(source.buffer,source.byteOffset,source.byteLength);
    throw new TypeError('C string needs bounded native byte storage');
  };
  const terminator = value => {
    const view=cstring(value), idx=view.indexOf(0);
    if (idx<0) throw new RangeError('unterminated C string exceeds its allocation');
    return {view,idx};
  };
  const pair = (dest,src,count,overlapAllowed) => {
    const d=extent(dest,count),s=extent(src,count);
    const overlaps=d.buffer===s.buffer && d.start<s.start+d.n && s.start<d.start+d.n;
    if (overlaps && !overlapAllowed) throw new RangeError('overlapping C memcpy has undefined behavior');
    return {d,s};
  };
  // ISO C printf-compatible byte formatting for *verified* sprintf/snprintf
  // declarations. Only byte-representable scalar conversions are supported;
  // unsupported ABI conversions fail closed instead of silently corrupting
  // source game data or overflowing a C allocation.
  const asCBytes = value => {
    if (typeof value === 'string') {
      const bytes = new Uint8Array(value.length + 1);
      for (let i=0;i<value.length;i++) {
        const n=value.charCodeAt(i);
        if (n>255) throw new TypeError('C literal contains nonbyte Unicode');
        bytes[i]=n;
      }
      return bytes;
    }
    return cstring(value);
  };
  const toText = bytes => {
    let s=''; for (let i=0;i<bytes.length;i++) s+=String.fromCharCode(bytes[i]);
    return s;
  };
  const asInteger = value => {
    if (typeof value === 'bigint') return value;
    if (typeof value !== 'number' || !Number.isSafeInteger(value))
      throw new TypeError('C printf integer requires proven integral scalar');
    return BigInt(value);
  };
  const formatC = (format,args) => {
    const raw=asCBytes(format),nul=raw.indexOf(0);
    if(nul<0)throw new RangeError('unterminated printf format');
    const fmt=toText(raw.subarray(0,nul));
    let output='',at=0;
    const next=()=>{if(at>=args.length)throw new TypeError('missing C vararg');return args[at++];};
    for(let i=0;i<fmt.length;) {
      if(fmt[i]!=='%') {output+=fmt[i++];continue;}
      i++;
      if(fmt[i]==='%'){output+='%';i++;continue;}
      let flags='';while(i<fmt.length && '-+ #0'.includes(fmt[i]))flags+=fmt[i++];
      let width=null;
      if(fmt[i]==='*') {width=Number(asInteger(next()));i++;}
      else {const start=i;while(/[0-9]/.test(fmt[i]??''))i++;
        if(i>start)width=Number(fmt.slice(start,i));}
      if(width!==null && width<0) {flags+='-';width=-width;}
      let precision=null;
      if(fmt[i]==='.') {
        i++;if(fmt[i]==='*'){precision=Number(asInteger(next()));i++;if(precision<0)precision=null;}
        else {const start=i;while(/[0-9]/.test(fmt[i]??''))i++;
          precision=Number(fmt.slice(start,i)||'0');}
      }
      let length='';
      if('hljztL'.includes(fmt[i]??'') && i<fmt.length){length=fmt[i++];
        if((length==='h'||length==='l')&&fmt[i]===length)length+=fmt[i++];}
      const spec=fmt[i++];
      if(!spec || !'diuoxXcspfFeEgG'.includes(spec))
        throw new TypeError('unsupported C printf conversion: '+spec);
      if(width!==null && (!Number.isSafeInteger(width)||width>1_000_000) ||
        precision!==null && (!Number.isSafeInteger(precision)||precision>1_000_000))
        throw new RangeError('C printf width or precision outside safe bound');
      let result='',sign='',prefix='';
      if('diuoxX'.includes(spec)) {
        if(!['','h','hh','l','ll','j','z','t'].includes(length))
          throw new TypeError('unproven integer printf length');
        const bits=length==='hh'?8:length==='h'?16:['l','ll','j','z','t'].includes(length)?64:32;
        const signed=spec==='d'||spec==='i';
        let n=asInteger(next()); n=signed?BigInt.asIntN(bits,n):BigInt.asUintN(bits,n);
        if(n<0n){sign='-';n=-n;}
        else if(signed){sign=flags.includes('+')?'+':flags.includes(' ')?' ':'';}
        const base='xX'.includes(spec)?16:spec==='o'?8:10;
        result=n.toString(base);
        if(spec==='X')result=result.toUpperCase();
        if(precision===0 && n===0n)result='';
        if(precision!==null)result=result.padStart(precision,'0');
        if(flags.includes('#')) {
          if('xX'.includes(spec) && n!==0n) prefix=spec==='X'?'0X':'0x';
          if(spec==='o' && !result.startsWith('0')) prefix='0';
        }
      } else if(spec==='s') {
        if(length)throw new TypeError('wide printf string unsupported');
        const bytes=asCBytes(next());const zero=bytes.indexOf(0);
        if(precision===null && zero<0)throw new RangeError('unterminated C printf string');
        const end=precision===null?zero:Math.min(precision,zero<0?bytes.length:zero);
        if(end>bytes.length)throw new RangeError('C string formatting overreads source');
        result=toText(bytes.subarray(0,end));
      } else if(spec==='c') {
        if(length)throw new TypeError('wide printf character unsupported');
        result=String.fromCharCode(Number(BigInt.asUintN(8,asInteger(next()))));
      } else if('fFeEgG'.includes(spec)) {
        if(length && length!=='l')throw new TypeError('unproven floating printf length');
        const n=Number(next());if(Number.isNaN(n)){result='nan';}
        else if(!Number.isFinite(n)){result='inf';sign=n<0?'-':flags.includes('+')?'+':'';}
        else {
          if(n<0 || Object.is(n,-0))sign='-';
          else sign=flags.includes('+')?'+':flags.includes(' ')?' ':'';
          const v=Math.abs(n),p=precision===null?6:precision;
          if(p>100)throw new RangeError('C float precision exceeds proven implementation');
          if(spec==='f'||spec==='F')result=v.toFixed(p);
          else if(spec==='e'||spec==='E') {
            result=v.toExponential(p).replace(/e([+-])(\d)$/, 'e$10$2');
          } else {
            result=v.toPrecision(Math.max(1,p)).replace(/(\.\d*?)0+(e|$)/,'$1$2').replace(/\.(e|$)/,'$1');
          }
          if(flags.includes('#')&&!result.includes('.'))result=result.replace(/(e|$)/,'.'+'$1');
        }
        if(/[FEG]/.test(spec))result=result.toUpperCase();
      } else throw new TypeError('unsupported printf conversion');
      const left=flags.includes('-'),fill=flags.includes('0')&&!left&&precision===null?'0':' ';
      const n=sign.length+prefix.length+result.length;
      if(width!==null&&n<width) {
        const pad=fill.repeat(width-n);
        output+=left?sign+prefix+result+pad:fill==='0'?sign+prefix+pad+result:pad+sign+prefix+result;
      } else output+=sign+prefix+result;
      if(output.length>16_777_216)throw new RangeError('C printf output excessive');
    }
    return output;
  };
  const writeFormatted = (dest,limit,format,args,truncates) => {
    const rendered=formatC(format,args);
    const available=Number(limit);
    if(!Number.isSafeInteger(available)||available<0)throw new RangeError('invalid C printf destination extent');
    // snprintf with n=0 must never dereference dest (C permits null).
    if(!available && truncates)return rendered.length;
    const bytes=extent(dest,truncates?available:rendered.length+1);
    if(!truncates && rendered.length+1>bytes.n)throw new RangeError('sprintf overflow');
    const actual=Math.min(rendered.length,bytes.n-1);
    for(let i=0;i<actual;i++)bytes.view[i]=rendered.charCodeAt(i);
    bytes.view[actual]=0;
    return rendered.length;
  };
  return Object.freeze({
    sprintf(dest,format,...args) {
      // The destination is a known bounded source-level C allocation.
      const d=extent(dest,0);const cap=dest&&dest.__cPointer===true?dest.upper-d.start:dest.byteLength;return writeFormatted(dest,cap,format,args,false);
    },
    snprintf(dest,limit,format,...args) {return writeFormatted(dest,limit,format,args,true);},
    memcpy(dest,src,count) {
      const {d,s}=pair(dest,src,count,false);d.view.set(s.view);return dest;
    },
    memmove(dest,src,count) {
      const {d,s}=pair(dest,src,count,true);d.view.set(s.view.slice());return dest;
    },
    memset(dest,byte,count) {
      const d=extent(dest,count);
      if (typeof byte!=='number' || !Number.isFinite(byte)) throw new TypeError('C memset requires integer scalar');
      d.view.fill(Math.trunc(byte)&255);return dest;
    },
    memcmp(a,b,count) {
      const x=extent(a,count).view,y=extent(b,count).view;
      for (let i=0;i<x.length;i++) if (x[i]!==y[i]) return x[i]-y[i];
      return 0;
    },
    strlen(value) { return terminator(value).idx; },
    strcmp(a,b) {
      const x=terminator(a).view,y=terminator(b).view;
      for (let i=0;;i++) {
        const d=x[i]-y[i];
        if (d || x[i]===0) return d;
      }
    },
    strncmp(a,b,n) {
      const count=Number(n);
      if (!Number.isSafeInteger(count) || count<0) throw new RangeError('invalid C string bound');
      if (count===0) return 0;
      const x=cstring(a),y=cstring(b);
      for (let i=0;i<count;i++) {
        if (i>=x.length || i>=y.length) throw new RangeError('C string read exceeds allocation');
        const d=x[i]-y[i];
        if (d || x[i]===0) return d;
      }
      return 0;
    },
    strcasecmp(a,b) {
      const x=terminator(a).view,y=terminator(b).view;
      const fold=v=>v>=65&&v<=90?v+32:v;
      for(let i=0;;i++){
        const d=fold(x[i])-fold(y[i]);
        if(d||x[i]===0)return d;
      }
    },
    strncasecmp(a,b,n) {
      const count=Number(n);
      if(!Number.isSafeInteger(count)||count<0)throw new RangeError('invalid bounded C case compare');
      if(count===0)return 0;
      const x=cstring(a),y=cstring(b),fold=v=>v>=65&&v<=90?v+32:v;
      for(let i=0;i<count;i++){
        if(i>=x.length||i>=y.length)throw new RangeError('C case compare reads beyond allocation');
        const d=fold(x[i])-fold(y[i]);
        if(d||x[i]===0)return d;
      }
      return 0;
    },
    strcpy(dest,src) {
      const {idx}=terminator(src);
      const {d,s}=pair(dest,src,idx+1,false);
      d.view.set(s.view);return dest;
    },
    strncpy(dest,src,n) {
      const count=Number(n);
      if (!Number.isSafeInteger(count) || count<0) throw new RangeError('invalid C string copy bound');
      const d=extent(dest,count);
      if (!count)return dest;
      const s=cstring(src);
      let copied=0;
      while (copied<count && copied<s.length && s[copied]!==0)copied++;
      if (copied===s.length && copied<count)throw new RangeError('C string read exceeds allocation');
      // strncpy includes the NUL if encountered, then pads with NULs.
      const readBytes=Math.min(count,copied+(copied<s.length && s[copied]===0?1:0));
      const srcExtent=extent(src,readBytes);
      if (d.buffer===srcExtent.buffer && d.start<srcExtent.start+readBytes &&
          srcExtent.start<d.start+count)
        throw new RangeError('overlapping C strncpy has undefined behavior');
      d.view.fill(0);
      if (copied)d.view.set(srcExtent.view.subarray(0,copied));
      return dest;
    }
  });
})();

const i32 = value => typeof value === "bigint" ? Number(BigInt.asIntN(32,value)) : Number(value) | 0;
const u32 = value => typeof value === "bigint" ? Number(BigInt.asUintN(32,value)) : Number(value) >>> 0;
const i64 = value => BigInt.asIntN(64, BigInt(value));
const u64 = value => BigInt.asUintN(64, BigInt(value));
const u128 = value => BigInt.asUintN(128, BigInt(value));


const clz64 = value => {let v=BigInt.asUintN(64,BigInt(value));if(v===0n)return 64;let n=0;while((v&(1n<<63n))===0n){v<<=1n;n++;}return n;};
const ctz64 = (value,width) => {let v=BigInt.asUintN(width,BigInt(value));if(v===0n)return width;let n=0;while((v&1n)===0n){v>>=1n;n++;}return n;};
const popcnt = value => {let v=value,n=0;while(v){v&=v-1n;n++;}return n;};

const __builtin_rotateleft64 = (value,count) => { const width=64n; const n=BigInt.asUintN(64,BigInt(value)), shift=BigInt(count)&(width-1n); const result=BigInt.asUintN(64,(n << shift) | (n >> (width-shift))); return result; };
// C/C++ source: source/build/include/xxhash.h:2384
export function XXH_memcpy(dest, src, size) {
  return cByteMemory.memcpy(dest, src, size);
}

// C/C++ source: source/build/include/xxhash.h:2608
export function XXH_read32(ptr) {

  return (cDeref(cTypedPointer(ptr, Uint32Array), Uint32Array).value);
}

// C/C++ source: source/build/include/xxhash.h:2781
export function XXH_swap32(x) {
  return u32((u32((u32((u32((u32((x << 24)) & 4278190080)) | u32((u32((x << 8)) & u32(16711680))))) | u32(((x >>> 8) & u32(65280))))) | u32(((x >>> 24) & u32(255)))));
}

// C/C++ source: source/build/include/xxhash.h:2830
export function XXH_readLE32(ptr) {
  return (Boolean(1) ? XXH_read32(ptr) : XXH_swap32(XXH_read32(ptr)));
}

// C/C++ source: source/build/include/xxhash.h:3290
export function XXH_read64(ptr) {

  return (cDeref(cTypedPointer(ptr, BigUint64Array), BigUint64Array).value);
}

// C/C++ source: source/build/include/xxhash.h:3316
export function XXH_swap64(x) {
  return u64((BigInt(u64((BigInt(u64((BigInt(u64((BigInt(u64((BigInt(u64((BigInt(u64((BigInt(u64((BigInt(u64((BigInt(x) << BigInt(56)))) & BigInt(18374686479671623680n)))) | BigInt(u64((BigInt(u64((BigInt(x) << BigInt(40)))) & BigInt(71776119061217280n))))))) | BigInt(u64((BigInt(u64((BigInt(x) << BigInt(24)))) & BigInt(280375465082880n))))))) | BigInt(u64((BigInt(u64((BigInt(x) << BigInt(8)))) & BigInt(1095216660480n))))))) | BigInt(u64((BigInt(u64((BigInt(x) >> BigInt(8)))) & BigInt(4278190080n))))))) | BigInt(u64((BigInt(u64((BigInt(x) >> BigInt(24)))) & BigInt(16711680n))))))) | BigInt(u64((BigInt(u64((BigInt(x) >> BigInt(40)))) & BigInt(65280n))))))) | BigInt(u64((BigInt(u64((BigInt(x) >> BigInt(56)))) & BigInt(255n))))));
}

// C/C++ source: source/build/include/xxhash.h:3360
export function XXH_readLE64(ptr) {
  return (Boolean(1) ? XXH_read64(ptr) : XXH_swap64(XXH_read64(ptr)));
}

// C/C++ source: source/build/include/xxhash.h:3440
export function XXH64_avalanche(hash) {
  (hash = u64((BigInt(hash) ^ BigInt(u64((BigInt(hash) >> BigInt(33)))))));
  (hash = u64((BigInt(hash) * BigInt(14029467366897019727n))));
  (hash = u64((BigInt(hash) ^ BigInt(u64((BigInt(hash) >> BigInt(29)))))));
  (hash = u64((BigInt(hash) * BigInt(1609587929392839161n))));
  (hash = u64((BigInt(hash) ^ BigInt(u64((BigInt(hash) >> BigInt(32)))))));
  return hash;
}

// C/C++ source: source/build/include/xxhash.h:4302
export const XXH3_kSecret__header_global_d82a1bdec4b0ec6a = cAlignedStorage(new Uint8Array([(u32(184) & 255), (u32(254) & 255), (u32(108) & 255), (u32(57) & 255), (u32(35) & 255), (u32(164) & 255), (u32(75) & 255), (u32(190) & 255), (u32(124) & 255), (u32(1) & 255), (u32(129) & 255), (u32(44) & 255), (u32(247) & 255), (u32(33) & 255), (u32(173) & 255), (u32(28) & 255), (u32(222) & 255), (u32(212) & 255), (u32(109) & 255), (u32(233) & 255), (u32(131) & 255), (u32(144) & 255), (u32(151) & 255), (u32(219) & 255), (u32(114) & 255), (u32(64) & 255), (u32(164) & 255), (u32(164) & 255), (u32(183) & 255), (u32(179) & 255), (u32(103) & 255), (u32(31) & 255), (u32(203) & 255), (u32(121) & 255), (u32(230) & 255), (u32(78) & 255), (u32(204) & 255), (u32(192) & 255), (u32(229) & 255), (u32(120) & 255), (u32(130) & 255), (u32(90) & 255), (u32(208) & 255), (u32(125) & 255), (u32(204) & 255), (u32(255) & 255), (u32(114) & 255), (u32(33) & 255), (u32(184) & 255), (u32(8) & 255), (u32(70) & 255), (u32(116) & 255), (u32(247) & 255), (u32(67) & 255), (u32(36) & 255), (u32(142) & 255), (u32(224) & 255), (u32(53) & 255), (u32(144) & 255), (u32(230) & 255), (u32(129) & 255), (u32(58) & 255), (u32(38) & 255), (u32(76) & 255), (u32(60) & 255), (u32(40) & 255), (u32(82) & 255), (u32(187) & 255), (u32(145) & 255), (u32(195) & 255), (u32(0) & 255), (u32(203) & 255), (u32(136) & 255), (u32(208) & 255), (u32(101) & 255), (u32(139) & 255), (u32(27) & 255), (u32(83) & 255), (u32(46) & 255), (u32(163) & 255), (u32(113) & 255), (u32(100) & 255), (u32(72) & 255), (u32(151) & 255), (u32(162) & 255), (u32(13) & 255), (u32(249) & 255), (u32(78) & 255), (u32(56) & 255), (u32(25) & 255), (u32(239) & 255), (u32(70) & 255), (u32(169) & 255), (u32(222) & 255), (u32(172) & 255), (u32(216) & 255), (u32(168) & 255), (u32(250) & 255), (u32(118) & 255), (u32(63) & 255), (u32(227) & 255), (u32(156) & 255), (u32(52) & 255), (u32(63) & 255), (u32(249) & 255), (u32(220) & 255), (u32(187) & 255), (u32(199) & 255), (u32(199) & 255), (u32(11) & 255), (u32(79) & 255), (u32(29) & 255), (u32(138) & 255), (u32(81) & 255), (u32(224) & 255), (u32(75) & 255), (u32(205) & 255), (u32(180) & 255), (u32(89) & 255), (u32(49) & 255), (u32(200) & 255), (u32(159) & 255), (u32(126) & 255), (u32(201) & 255), (u32(217) & 255), (u32(120) & 255), (u32(115) & 255), (u32(100) & 255), (u32(234) & 255), (u32(197) & 255), (u32(172) & 255), (u32(131) & 255), (u32(52) & 255), (u32(211) & 255), (u32(235) & 255), (u32(195) & 255), (u32(197) & 255), (u32(129) & 255), (u32(160) & 255), (u32(255) & 255), (u32(250) & 255), (u32(19) & 255), (u32(99) & 255), (u32(235) & 255), (u32(23) & 255), (u32(13) & 255), (u32(221) & 255), (u32(81) & 255), (u32(183) & 255), (u32(240) & 255), (u32(218) & 255), (u32(73) & 255), (u32(211) & 255), (u32(22) & 255), (u32(85) & 255), (u32(38) & 255), (u32(41) & 255), (u32(212) & 255), (u32(104) & 255), (u32(158) & 255), (u32(43) & 255), (u32(22) & 255), (u32(190) & 255), (u32(88) & 255), (u32(125) & 255), (u32(71) & 255), (u32(161) & 255), (u32(252) & 255), (u32(143) & 255), (u32(248) & 255), (u32(184) & 255), (u32(209) & 255), (u32(122) & 255), (u32(208) & 255), (u32(49) & 255), (u32(206) & 255), (u32(69) & 255), (u32(203) & 255), (u32(58) & 255), (u32(143) & 255), (u32(149) & 255), (u32(22) & 255), (u32(4) & 255), (u32(40) & 255), (u32(175) & 255), (u32(215) & 255), (u32(251) & 255), (u32(202) & 255), (u32(187) & 255), (u32(75) & 255), (u32(64) & 255), (u32(126) & 255)]), 64);
function __cxx_static_address_7368e9c7cc5267f58d8fb712() {
  return __cxx_static_address_7368e9c7cc5267f58d8fb712.reference || (__cxx_static_address_7368e9c7cc5267f58d8fb712.reference = {
    __cReference: true,
    get value() { return XXH3_kSecret__header_global_d82a1bdec4b0ec6a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_7368e9c7cc5267f58d8fb712() { return __cxx_static_address_7368e9c7cc5267f58d8fb712(); }

// C/C++ source: source/build/include/xxhash.h:4317
export const PRIME_MX1__header_global_8b8aaf66187d6010 = u64(1609587791953885689n);
function __cxx_static_address_75575d7bebf3570d5f597b43() {
  return __cxx_static_address_75575d7bebf3570d5f597b43.reference || (__cxx_static_address_75575d7bebf3570d5f597b43.reference = {
    __cReference: true,
    get value() { return PRIME_MX1__header_global_8b8aaf66187d6010; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/xxhash.h:4318
export const PRIME_MX2__header_global_5e986da71df7f3b2 = u64(11507291218515648293n);
function __cxx_static_address_b43c76b2215bd6e9ff656620() {
  return __cxx_static_address_b43c76b2215bd6e9ff656620.reference || (__cxx_static_address_b43c76b2215bd6e9ff656620.reference = {
    __cReference: true,
    get value() { return PRIME_MX2__header_global_5e986da71df7f3b2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/xxhash.h:4369
export function XXH_mult64to128(lhs, rhs) {
  let product = u128(u128((BigInt(u128(u128(lhs))) * BigInt(u128(u128(rhs))))));
  let r128 = cZeroAggregate({"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"high64": {"native": "BigUint64Array", "offset": 8, "size": 8}, "low64": {"native": "BigUint64Array", "offset": 0, "size": 8}}, "overlaps": false, "size": 16, "union": false}}, {});
  (r128.low64 = u64(product));
  (r128.high64 = u64(u128((BigInt(product) >> BigInt(64)))));
  return cCopyAggregate(r128, {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"high64": {"native": "BigUint64Array", "offset": 8, "size": 8}, "low64": {"native": "BigUint64Array", "offset": 0, "size": 8}}, "overlaps": false, "size": 16, "union": false}});
}

// C/C++ source: source/build/include/xxhash.h:4503
export function XXH3_mul128_fold64(lhs, rhs) {
  let product = cCopyAggregate(XXH_mult64to128(lhs, rhs), {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"high64": {"native": "BigUint64Array", "offset": 8, "size": 8}, "low64": {"native": "BigUint64Array", "offset": 0, "size": 8}}, "overlaps": false, "size": 16, "union": false}});
  return u64((BigInt(product.low64) ^ BigInt(product.high64)));
}

// C/C++ source: source/build/include/xxhash.h:4510
export function XXH_xorshift64(v64, shift) {
  void 0;
  return u64((BigInt(v64) ^ BigInt(u64((BigInt(v64) >> BigInt(shift))))));
}

// C/C++ source: source/build/include/xxhash.h:4520
export function XXH3_avalanche(h64) {
  (h64 = u64(XXH_xorshift64(h64, 37)));
  (h64 = u64((BigInt(h64) * BigInt(PRIME_MX1__header_global_8b8aaf66187d6010))));
  (h64 = u64(XXH_xorshift64(h64, 32)));
  return h64;
}

// C/C++ source: source/build/include/xxhash.h:4533
export function XXH3_rrmxmx(h64, len) {
  (h64 = u64((BigInt(h64) ^ BigInt(u64((BigInt(__builtin_rotateleft64(h64, u64(49))) ^ BigInt(__builtin_rotateleft64(h64, u64(24)))))))));
  (h64 = u64((BigInt(h64) * BigInt(PRIME_MX2__header_global_5e986da71df7f3b2))));
  (h64 = u64((BigInt(h64) ^ BigInt(u64((BigInt(u64((BigInt(h64) >> BigInt(35)))) + BigInt(len)))))));
  (h64 = u64((BigInt(h64) * BigInt(PRIME_MX2__header_global_5e986da71df7f3b2))));
  return XXH_xorshift64(h64, 28);
}

// C/C++ source: source/build/include/xxhash.h:4578
export function XXH3_len_1to3_64b(input, len, secret, seed) {
  void 0;
  void 0;
  void 0;
  {
    let c1 = (u32((cDeref(cPointerOffset(input, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255);
    let c2 = (u32((cDeref(cPointerOffset(input, u64((BigInt(len) >> BigInt(1))), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255);
    let c3 = (u32((cDeref(cPointerOffset(input, u64((BigInt(len) - BigInt(u64(1)))), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255);
    let combined = u32((u32((u32((u32((u32(c1) << 16)) | u32((u32(c2) << 24)))) | u32((u32(c3) << 0)))) | u32((u32(len) << 8))));
    let bitflip = u64((BigInt(u64(u32((XXH_readLE32(secret) ^ XXH_readLE32(cPointerOffset(secret, 4, Uint8Array.BYTES_PER_ELEMENT)))))) + BigInt(seed)));
    let keyed = u64((BigInt(u64(combined)) ^ BigInt(bitflip)));
    return XXH64_avalanche(keyed);
  }
}

// C/C++ source: source/build/include/xxhash.h:4600
export function XXH3_len_4to8_64b(input, len, secret, seed) {
  void 0;
  void 0;
  void 0;
  (seed = u64((BigInt(seed) ^ BigInt(u64((BigInt(u64(XXH_swap32(u32(seed)))) << BigInt(32)))))));
  {
    let input1 = u32(XXH_readLE32(input));
    let input2 = u32(XXH_readLE32(cPointerOffset(cPointerOffset(input, len, Uint8Array.BYTES_PER_ELEMENT), -(4), Uint8Array.BYTES_PER_ELEMENT)));
    let bitflip = u64((BigInt(u64((BigInt(XXH_readLE64(cPointerOffset(secret, 8, Uint8Array.BYTES_PER_ELEMENT))) ^ BigInt(XXH_readLE64(cPointerOffset(secret, 16, Uint8Array.BYTES_PER_ELEMENT)))))) - BigInt(seed)));
    let input64 = u64((BigInt(u64(input2)) + BigInt(u64((BigInt(u64(input1)) << BigInt(32))))));
    let keyed = u64((BigInt(input64) ^ BigInt(bitflip)));
    return XXH3_rrmxmx(keyed, len);
  }
}

// C/C++ source: source/build/include/xxhash.h:4616
export function XXH3_len_9to16_64b(input, len, secret, seed) {
  void 0;
  void 0;
  void 0;
  {
    let bitflip1 = u64((BigInt(u64((BigInt(XXH_readLE64(cPointerOffset(secret, 24, Uint8Array.BYTES_PER_ELEMENT))) ^ BigInt(XXH_readLE64(cPointerOffset(secret, 32, Uint8Array.BYTES_PER_ELEMENT)))))) + BigInt(seed)));
    let bitflip2 = u64((BigInt(u64((BigInt(XXH_readLE64(cPointerOffset(secret, 40, Uint8Array.BYTES_PER_ELEMENT))) ^ BigInt(XXH_readLE64(cPointerOffset(secret, 48, Uint8Array.BYTES_PER_ELEMENT)))))) - BigInt(seed)));
    let input_lo = u64((BigInt(XXH_readLE64(input)) ^ BigInt(bitflip1)));
    let input_hi = u64((BigInt(XXH_readLE64(cPointerOffset(cPointerOffset(input, len, Uint8Array.BYTES_PER_ELEMENT), -(8), Uint8Array.BYTES_PER_ELEMENT))) ^ BigInt(bitflip2)));
    let acc = u64((BigInt(u64((BigInt(u64((BigInt(len) + BigInt(XXH_swap64(input_lo))))) + BigInt(input_hi)))) + BigInt(XXH3_mul128_fold64(input_lo, input_hi))));
    return XXH3_avalanche(acc);
  }
}

// C/C++ source: source/build/include/xxhash.h:4633
export function XXH3_len_0to16_64b(input, len, secret, seed) {
  void 0;
  {
    if (Boolean(i64((len > u64(8))))) {
      return XXH3_len_9to16_64b(input, len, secret, seed);
    }
    if (Boolean(i64((len >= u64(4))))) {
      return XXH3_len_4to8_64b(input, len, secret, seed);
    }
    if (Boolean(len)) {
      return XXH3_len_1to3_64b(input, len, secret, seed);
    }
    return XXH64_avalanche(u64((BigInt(seed) ^ BigInt(u64((BigInt(XXH_readLE64(cPointerOffset(secret, 56, Uint8Array.BYTES_PER_ELEMENT))) ^ BigInt(XXH_readLE64(cPointerOffset(secret, 64, Uint8Array.BYTES_PER_ELEMENT)))))))));
  }
}

// C/C++ source: source/build/include/xxhash.h:4669
export function XXH3_mix16B(input, secret, seed64) {
  {
    let input_lo = u64(XXH_readLE64(input));
    let input_hi = u64(XXH_readLE64(cPointerOffset(input, 8, Uint8Array.BYTES_PER_ELEMENT)));
    return XXH3_mul128_fold64(u64((BigInt(input_lo) ^ BigInt(u64((BigInt(XXH_readLE64(secret)) + BigInt(seed64)))))), u64((BigInt(input_hi) ^ BigInt(u64((BigInt(XXH_readLE64(cPointerOffset(secret, 8, Uint8Array.BYTES_PER_ELEMENT))) - BigInt(seed64)))))));
  }
}

// C/C++ source: source/build/include/xxhash.h:4703
export function XXH3_len_17to128_64b(input, len, secret, secretSize, seed) {
  void 0;
  void 0;
  void 0;
  {
    let acc = u64((BigInt(u64(len)) * BigInt(11400714785074694791n)));
    if ((len > u64(32))) {
      if ((len > u64(64))) {
        if ((len > u64(96))) {
          (acc = u64((BigInt(acc) + BigInt(XXH3_mix16B(cPointerOffset(input, 48, Uint8Array.BYTES_PER_ELEMENT), cPointerOffset(secret, 96, Uint8Array.BYTES_PER_ELEMENT), seed)))));
          (acc = u64((BigInt(acc) + BigInt(XXH3_mix16B(cPointerOffset(cPointerOffset(input, len, Uint8Array.BYTES_PER_ELEMENT), -(64), Uint8Array.BYTES_PER_ELEMENT), cPointerOffset(secret, 112, Uint8Array.BYTES_PER_ELEMENT), seed)))));
        }
        (acc = u64((BigInt(acc) + BigInt(XXH3_mix16B(cPointerOffset(input, 32, Uint8Array.BYTES_PER_ELEMENT), cPointerOffset(secret, 64, Uint8Array.BYTES_PER_ELEMENT), seed)))));
        (acc = u64((BigInt(acc) + BigInt(XXH3_mix16B(cPointerOffset(cPointerOffset(input, len, Uint8Array.BYTES_PER_ELEMENT), -(48), Uint8Array.BYTES_PER_ELEMENT), cPointerOffset(secret, 80, Uint8Array.BYTES_PER_ELEMENT), seed)))));
      }
      (acc = u64((BigInt(acc) + BigInt(XXH3_mix16B(cPointerOffset(input, 16, Uint8Array.BYTES_PER_ELEMENT), cPointerOffset(secret, 32, Uint8Array.BYTES_PER_ELEMENT), seed)))));
      (acc = u64((BigInt(acc) + BigInt(XXH3_mix16B(cPointerOffset(cPointerOffset(input, len, Uint8Array.BYTES_PER_ELEMENT), -(32), Uint8Array.BYTES_PER_ELEMENT), cPointerOffset(secret, 48, Uint8Array.BYTES_PER_ELEMENT), seed)))));
    }
    (acc = u64((BigInt(acc) + BigInt(XXH3_mix16B(cPointerOffset(input, 0, Uint8Array.BYTES_PER_ELEMENT), cPointerOffset(secret, 0, Uint8Array.BYTES_PER_ELEMENT), seed)))));
    (acc = u64((BigInt(acc) + BigInt(XXH3_mix16B(cPointerOffset(cPointerOffset(input, len, Uint8Array.BYTES_PER_ELEMENT), -(16), Uint8Array.BYTES_PER_ELEMENT), cPointerOffset(secret, 16, Uint8Array.BYTES_PER_ELEMENT), seed)))));
    return XXH3_avalanche(acc);
  }
}

// C/C++ source: source/build/include/xxhash.h:4739
export function XXH3_len_129to240_64b(input, len, secret, secretSize, seed) {
  void 0;
  void 0;
  void 0;
  {
    let acc = u64((BigInt(u64(len)) * BigInt(11400714785074694791n)));
    let acc_end;
    let nbRounds = u32(Math.trunc(u32(len) / u32(16)));
    let i;
    void 0;
    for ((i = u32(0)); (i < u32(8)); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = u32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; }))) {
      (acc = u64((BigInt(acc) + BigInt(XXH3_mix16B(cPointerOffset(input, u32(Math.imul(u32(16), i)), Uint8Array.BYTES_PER_ELEMENT), cPointerOffset(secret, u32(Math.imul(u32(16), i)), Uint8Array.BYTES_PER_ELEMENT), seed)))));
    }
    (acc_end = u64(XXH3_mix16B(cPointerOffset(cPointerOffset(input, len, Uint8Array.BYTES_PER_ELEMENT), -(16), Uint8Array.BYTES_PER_ELEMENT), cPointerOffset(cPointerOffset(secret, 136, Uint8Array.BYTES_PER_ELEMENT), -(17), Uint8Array.BYTES_PER_ELEMENT), seed)));
    void 0;
    (acc = u64(XXH3_avalanche(acc)));
    for ((i = u32(8)); (i < nbRounds); ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = u32((previous + 1)); __cxx_lvalue_2.value = next; return previous; })(cRef(() => i, __cxx_lvalue_3 => { i = __cxx_lvalue_3; }))) {
      ; // Original empty read/write-register compiler barrier.
      (acc_end = u64((BigInt(acc_end) + BigInt(XXH3_mix16B(cPointerOffset(input, u32(Math.imul(u32(16), i)), Uint8Array.BYTES_PER_ELEMENT), cPointerOffset(cPointerOffset(secret, u32(Math.imul(u32(16), u32((i - u32(8))))), Uint8Array.BYTES_PER_ELEMENT), 3, Uint8Array.BYTES_PER_ELEMENT), seed)))));
    }
    return XXH3_avalanche(u64((BigInt(acc) + BigInt(acc_end))));
  }
}

// C/C++ source: source/build/include/xxhash.h:4850
export function XXH_writeLE64(dst, v64) {
  const __cxx_lvalue_0 = cScalarStorage(BigUint64Array, v64);
  if ((!Boolean(1))) {
    (__cxx_lvalue_0.value = u64(XXH_swap64(__cxx_lvalue_0.value)));
  }
  XXH_memcpy(dst, __cxx_lvalue_0, 8);
}

// C/C++ source: source/build/include/xxhash.h:5701
export function XXH_mult32to64_add64(lhs, rhs, acc) {
  return u64((BigInt(u64((BigInt(u64(u32(lhs))) * BigInt(u64(u32(rhs)))))) + BigInt(acc)));
}

// C/C++ source: source/build/include/xxhash.h:5715
export function XXH3_scalarRound(acc, input, secret, lane) {
  let xacc = cTypedPointer(acc, BigUint64Array);
  let xinput = cTypedPointer(input, Uint8Array);
  let xsecret = cTypedPointer(secret, Uint8Array);
  void 0;
  void 0;
  {
    let data_val = u64(XXH_readLE64(cPointerOffset(xinput, u64((BigInt(lane) * BigInt(u64(8)))), Uint8Array.BYTES_PER_ELEMENT)));
    let data_key = u64((BigInt(data_val) ^ BigInt(XXH_readLE64(cPointerOffset(xsecret, u64((BigInt(lane) * BigInt(u64(8)))), Uint8Array.BYTES_PER_ELEMENT)))));
    ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = u64((BigInt(__cxx_lvalue_0.value) + BigInt(data_val)))))(cDeref(cPointerOffset(xacc, u64((BigInt(lane) ^ BigInt(u64(1)))), BigUint64Array.BYTES_PER_ELEMENT), BigUint64Array));
    ((cDeref(cPointerOffset(xacc, lane, BigUint64Array.BYTES_PER_ELEMENT), BigUint64Array).value) = u64(XXH_mult32to64_add64(data_key, u64((BigInt(data_key) >> BigInt(32))), (cDeref(cPointerOffset(xacc, lane, BigUint64Array.BYTES_PER_ELEMENT), BigUint64Array).value))));
  }
}

// C/C++ source: source/build/include/xxhash.h:5738
export function XXH3_accumulate_512_scalar(acc, input, secret) {
  let i;
  for ((i = u64(0)); (i < u64((BigInt(u64(64)) / BigInt(8)))); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = u64((previous + 1n)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; }))) {
    XXH3_scalarRound(acc, input, secret, i);
  }
}

// C/C++ source: source/build/include/xxhash.h:5764
export function XXH3_scalarScrambleRound(acc, secret, lane) {
  let xacc = cTypedPointer(acc, BigUint64Array);
  let xsecret = cTypedPointer(secret, Uint8Array);
  void 0;
  void 0;
  {
    let key64 = u64(XXH_readLE64(cPointerOffset(xsecret, u64((BigInt(lane) * BigInt(u64(8)))), Uint8Array.BYTES_PER_ELEMENT)));
    let acc64 = u64((cDeref(cPointerOffset(xacc, lane, BigUint64Array.BYTES_PER_ELEMENT), BigUint64Array).value));
    (acc64 = u64(XXH_xorshift64(acc64, 47)));
    (acc64 = u64((BigInt(acc64) ^ BigInt(key64))));
    (acc64 = u64((BigInt(acc64) * BigInt(u64(2654435761)))));
    ((cDeref(cPointerOffset(xacc, lane, BigUint64Array.BYTES_PER_ELEMENT), BigUint64Array).value) = u64(acc64));
  }
}

// C/C++ source: source/build/include/xxhash.h:5787
export function XXH3_scrambleAcc_scalar(acc, secret) {
  let i;
  for ((i = u64(0)); (i < u64((BigInt(u64(64)) / BigInt(8)))); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = u64((previous + 1n)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; }))) {
    XXH3_scalarScrambleRound(acc, secret, i);
  }
}

// C/C++ source: source/build/include/xxhash.h:5796
export function XXH3_initCustomSecret_scalar(customSecret, seed64) {
  let kSecretPtr = XXH3_kSecret__header_global_d82a1bdec4b0ec6a;
  do {

  } while (Boolean(0));
  {
    let nbRounds = i32(Math.trunc(192 / 16));
    let i;
    for ((i = i32(0)); (i < nbRounds); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; }))) {
      let lo = u64((BigInt(XXH_readLE64(cPointerOffset(kSecretPtr, i32(Math.imul(16, i)), Uint8Array.BYTES_PER_ELEMENT))) + BigInt(seed64)));
      let hi = u64((BigInt(XXH_readLE64(cPointerOffset(cPointerOffset(kSecretPtr, i32(Math.imul(16, i)), Uint8Array.BYTES_PER_ELEMENT), 8, Uint8Array.BYTES_PER_ELEMENT))) - BigInt(seed64)));
      XXH_writeLE64(cPointerOffset(cTypedPointer(customSecret, Uint8Array), i32(Math.imul(16, i)), Uint8Array.BYTES_PER_ELEMENT), lo);
      XXH_writeLE64(cPointerOffset(cPointerOffset(cTypedPointer(customSecret, Uint8Array), i32(Math.imul(16, i)), Uint8Array.BYTES_PER_ELEMENT), 8, Uint8Array.BYTES_PER_ELEMENT), hi);
    }
  }
}

// C/C++ source: source/build/include/xxhash.h:5925
export function XXH3_hashLong_internal_loop(acc, input, len, secret, secretSize, f_acc, f_scramble) {
  let nbStripesPerBlock = u64((BigInt(u64((BigInt(secretSize) - BigInt(u64(64))))) / BigInt(u64(8))));
  let block_len = u64((BigInt(u64(64)) * BigInt(nbStripesPerBlock)));
  let nb_blocks = u64((BigInt(u64((BigInt(len) - BigInt(u64(1))))) / BigInt(block_len)));
  let n;
  void 0;
  for ((n = u64(0)); (n < nb_blocks); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = u64((previous + 1n)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => n, __cxx_lvalue_1 => { n = __cxx_lvalue_1; }))) {
    f_acc(acc, cPointerOffset(input, u64((BigInt(n) * BigInt(block_len))), Uint8Array.BYTES_PER_ELEMENT), secret, nbStripesPerBlock);
    f_scramble(acc, cPointerOffset(cPointerOffset(secret, secretSize, Uint8Array.BYTES_PER_ELEMENT), -(64), Uint8Array.BYTES_PER_ELEMENT));
  }
  void 0;
  {
    let nbStripes = u64((BigInt(u64((BigInt(u64((BigInt(len) - BigInt(u64(1))))) - BigInt(u64((BigInt(block_len) * BigInt(nb_blocks))))))) / BigInt(u64(64))));
    void 0;
    f_acc(acc, cPointerOffset(input, u64((BigInt(nb_blocks) * BigInt(block_len))), Uint8Array.BYTES_PER_ELEMENT), secret, nbStripes);
    {
      let p = cPointerOffset(cPointerOffset(input, len, Uint8Array.BYTES_PER_ELEMENT), -(64), Uint8Array.BYTES_PER_ELEMENT);
      XXH3_accumulate_512_scalar(acc, p, cPointerOffset(cPointerOffset(cPointerOffset(secret, secretSize, Uint8Array.BYTES_PER_ELEMENT), -(64), Uint8Array.BYTES_PER_ELEMENT), -(7), Uint8Array.BYTES_PER_ELEMENT));
    }
  }
}

// C/C++ source: source/build/include/xxhash.h:5958
export function XXH3_mix2Accs(acc, secret) {
  return XXH3_mul128_fold64(u64((BigInt((cDeref(cPointerOffset(acc, 0, BigUint64Array.BYTES_PER_ELEMENT), BigUint64Array).value)) ^ BigInt(XXH_readLE64(secret)))), u64((BigInt((cDeref(cPointerOffset(acc, 1, BigUint64Array.BYTES_PER_ELEMENT), BigUint64Array).value)) ^ BigInt(XXH_readLE64(cPointerOffset(secret, 8, Uint8Array.BYTES_PER_ELEMENT))))));
}

// C/C++ source: source/build/include/xxhash.h:5966
export function XXH3_mergeAccs(acc, secret, start) {
  let result64 = u64(start);
  let i = u64(0);
  for ((i = u64(0)); (i < u64(4)); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = u64((previous + 1n)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; }))) {
    (result64 = u64((BigInt(result64) + BigInt(XXH3_mix2Accs(cPointerOffset(acc, u64((BigInt(u64(2)) * BigInt(i))), BigUint64Array.BYTES_PER_ELEMENT), cPointerOffset(secret, u64((BigInt(u64(16)) * BigInt(i))), Uint8Array.BYTES_PER_ELEMENT))))));
  }
  return XXH3_avalanche(result64);
}

// C/C++ source: source/build/include/xxhash.h:5996
export function XXH3_hashLong_64b_internal(input, len, secret, secretSize, f_acc, f_scramble) {
  let acc = cAlignedStorage(new BigUint64Array([u64(3266489917), u64(11400714785074694791n), u64(14029467366897019727n), u64(1609587929392839161n), u64(9650029242287828579n), u64(2246822519), u64(2870177450012600261n), u64(2654435761)]), 8);
  XXH3_hashLong_internal_loop(acc, cTypedPointer(input, Uint8Array), len, cTypedPointer(secret, Uint8Array), secretSize, f_acc, f_scramble);
  do {

  } while (Boolean(0));
  void 0;
  return XXH3_mergeAccs(acc, cPointerOffset(cTypedPointer(secret, Uint8Array), 11, Uint8Array.BYTES_PER_ELEMENT), u64((BigInt(u64(len)) * BigInt(11400714785074694791n))));
}

// C/C++ source: source/build/include/xxhash.h:6021
export function XXH3_hashLong_64b_withSecret(input, len, seed64, secret, secretLen) {
  void 0;
  return XXH3_hashLong_64b_internal(input, len, secret, secretLen, XXH3_accumulate_scalar__header_c95e53707021, XXH3_scrambleAcc_scalar);
}

// C/C++ source: source/build/include/xxhash.h:6035
export function XXH3_hashLong_64b_default(input, len, seed64, secret, secretLen) {
  void 0;
  void 0;
  void 0;
  return XXH3_hashLong_64b_internal(input, len, XXH3_kSecret__header_global_d82a1bdec4b0ec6a, 192, XXH3_accumulate_scalar__header_c95e53707021, XXH3_scrambleAcc_scalar);
}

// C/C++ source: source/build/include/xxhash.h:6054
export function XXH3_hashLong_64b_withSeed_internal(input, len, seed, f_acc, f_scramble, f_initSec) {
  if ((seed == u64(0))) {
    return XXH3_hashLong_64b_internal(input, len, XXH3_kSecret__header_global_d82a1bdec4b0ec6a, 192, f_acc, f_scramble);
  }
  {
    let secret = cAlignedStorage(cZeroAggregate({"array": "Uint8Array", "dims": [192]}), 8);
    f_initSec(secret, seed);
    return XXH3_hashLong_64b_internal(input, len, secret, 192, f_acc, f_scramble);
  }
}

// C/C++ source: source/build/include/xxhash.h:6077
export function XXH3_hashLong_64b_withSeed(input, len, seed, secret, secretLen) {
  void 0;
  void 0;
  return XXH3_hashLong_64b_withSeed_internal(input, len, seed, XXH3_accumulate_scalar__header_c95e53707021, XXH3_scrambleAcc_scalar, XXH3_initCustomSecret_scalar);
}

// C/C++ source: source/build/include/xxhash.h:6090
export function XXH3_64bits_internal(input, len, seed64, secret, secretLen, f_hashLong) {
  void 0;
  if ((len <= u64(16))) {
    return XXH3_len_0to16_64b(cTypedPointer(input, Uint8Array), len, cTypedPointer(secret, Uint8Array), seed64);
  }
  if ((len <= u64(128))) {
    return XXH3_len_17to128_64b(cTypedPointer(input, Uint8Array), len, cTypedPointer(secret, Uint8Array), secretLen, seed64);
  }
  if ((len <= u64(240))) {
    return XXH3_len_129to240_64b(cTypedPointer(input, Uint8Array), len, cTypedPointer(secret, Uint8Array), secretLen, seed64);
  }
  return f_hashLong(input, len, seed64, cTypedPointer(secret, Uint8Array), secretLen);
}

// C/C++ source: source/build/include/xxhash.h:6115
export function XXH3_64bits(input, length) {
  return XXH3_64bits_internal(input, length, u64(0), XXH3_kSecret__header_global_d82a1bdec4b0ec6a, 192, XXH3_hashLong_64b_default);
}

// C/C++ source: source/build/include/xxhash.h:6122
export function XXH3_64bits_withSecret(input, length, secret, secretSize) {
  return XXH3_64bits_internal(input, length, u64(0), secret, secretSize, XXH3_hashLong_64b_withSecret);
}

// C/C++ source: source/build/include/xxhash.h:6129
export function XXH3_64bits_withSeed(input, length, seed) {
  return XXH3_64bits_internal(input, length, seed, XXH3_kSecret__header_global_d82a1bdec4b0ec6a, 192, XXH3_hashLong_64b_withSeed);
}

// C/C++ source: source/build/include/xxhash.h:6135
export function XXH3_64bits_withSecretandSeed(input, length, secret, secretSize, seed) {
  if ((length <= u64(240))) {
    return XXH3_64bits_internal(input, length, seed, XXH3_kSecret__header_global_d82a1bdec4b0ec6a, 192, null);
  }
  return XXH3_hashLong_64b_withSecret(input, length, seed, cTypedPointer(secret, Uint8Array), secretSize);
}

export function XXH3_accumulate_scalar__header_c95e53707021(acc, input, secret, nbStripes) {
  let n;
  for ((n = u64(0)); (n < nbStripes); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = u64((previous + 1n)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => n, __cxx_lvalue_1 => { n = __cxx_lvalue_1; }))) {
    let __cxx_in = cPointerOffset(input, u64((BigInt(n) * BigInt(u64(64)))), Uint8Array.BYTES_PER_ELEMENT);
    void 0;
    XXH3_accumulate_512_scalar(acc, __cxx_in, cPointerOffset(secret, u64((BigInt(n) * BigInt(u64(8)))), Uint8Array.BYTES_PER_ELEMENT));
  }
}
