// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/imgui/src/imgui.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
import { ImFontAtlasAddDrawListSharedData } from "./imgui_draw.cpp.mjs";
import { ImFontAtlasRemoveDrawListSharedData } from "./imgui_draw.cpp.mjs";


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
  if (source && source.__cPointer === true) return source;
  if(source?.__cReference===true&&source.value?.[Symbol.for('source-first.original-byte-record-storage/1')])
    return cPointer(source.value);
  const record=source?.[Symbol.for('source-first.original-byte-record-storage/1')];
  if(record)return cPointer(record.bytes);
  const allocation=source&&globalThis[Symbol.for('source-first.cpp-heap/1')]?.objects.get(source);
  if (allocation) return {__cPointer:true,buffer:allocation.slots,lower:0,
    upper:allocation.extent,offset:0,array:true,stride:allocation.extent};
  if (Array.isArray(source)) {
    const bytes=source[Symbol.for('source-first.clang-byte-record-array/1')];
    return { __cPointer:true, buffer:source, lower:0, upper:bytes?bytes.length:source.length,
      offset:0,array:true,stride:bytes&&source.length?bytes.length/source.length:1 };
  }
  if (!ArrayBuffer.isView(source) || source instanceof DataView)
    throw new TypeError('C pointer requires bounded array storage');
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
    const allocation=globalThis[Symbol.for('source-first.pointer-array-allocations/1')]?.get(pointer.buffer);
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
// Source-language C++ pointer-span iteration, NOT a duck-typed JS iterable.
// The emitter has verified native begin() == data and end() == data + size
// from the class's original Clang AST. Runtime checks enforce bounds/stride.
const cxxPointerSpan = (owner, dataName, sizeName, stride) => {
  if (!owner || typeof owner !== 'object' ||
      !Object.prototype.hasOwnProperty.call(owner, dataName) ||
      !Object.prototype.hasOwnProperty.call(owner, sizeName))
    throw new TypeError('C++ pointer span requires declared instance storage');
  if (!Number.isSafeInteger(stride) || stride <= 0)
    throw new TypeError('Invalid native pointer element width');
  const count = owner[sizeName];
  if (typeof count !== 'number' && typeof count !== 'bigint')
    throw new TypeError('C++ span length must be an integer');
  const length = Number(count);
  if (!Number.isSafeInteger(length) || length < 0 || BigInt(length) !== BigInt(count))
    throw new RangeError('Invalid C++ span size');
  const storage = owner[dataName];
  if (length === 0 && storage == null) return {length:0, get(){throw new RangeError('Empty C++ span');}};
  let array, start, capacity;
  if (Array.isArray(storage)) {
    array = storage; start = 0; capacity = array.length;
  } else if (ArrayBuffer.isView(storage) && !(storage instanceof DataView) &&
             storage.BYTES_PER_ELEMENT === stride) {
    array = storage; start = 0; capacity = array.length;
  } else if (storage && storage.__cPointer === true && storage.array === true &&
             Array.isArray(storage.buffer)) {
    if (!Number.isSafeInteger(storage.stride) || storage.stride !== stride ||
        !Number.isSafeInteger(storage.lower) || !Number.isSafeInteger(storage.upper) ||
        !Number.isSafeInteger(storage.offset) || storage.offset < storage.lower ||
        storage.upper > storage.buffer.length * stride ||
        storage.offset % stride !== 0 || storage.lower % stride !== 0 ||
        storage.upper % stride !== 0 || storage.offset > storage.upper)
      throw new TypeError('C++ span pointer stride/bounds do not match source type');
    array = storage.buffer;
    start = storage.offset / stride;
    capacity = (storage.upper - storage.offset) / stride;
  } else {
    // A raw ArrayBuffer cannot be interpreted as a C++ pointer-to-pointer:
    // it lacks valid JS pointee identity / relocation information.
    throw new TypeError('C++ span requires proven bounded pointer-slot storage');
  }
  if (length > capacity || start + length > array.length)
    throw new RangeError('C++ span end escapes backing storage');
  return { length, get(index) {
    if (!Number.isSafeInteger(index) || index < 0 || index >= length)
      throw new RangeError('C++ span element out of bounds');
    return array[start + index];
  }};
};

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
// Byte-backed pointer fields preserve borrowed pointer identity across copies,
// unions, and separately generated modules in the same realm. These tokens
// are only an object representation, not integer-address arithmetic. Unknown
// bit patterns fail closed rather than inventing an object or an allocation.
const cByteRecordPointers = (() => {
  const key=Symbol.for('source-first.byte-record-pointer-identities/1');
  const state=globalThis[key] || Object.defineProperty(globalThis,key,{value:
    {next:1n,byOwner:new WeakMap(),byBits:new Map()}})[key];
  const canonical = value => {
    if (value?.__cDeferredPointer===true || value?.__cDeferredReference===true)
      return canonical(value.resolve());
    const managed=value&&globalThis[Symbol.for('source-first.cpp-heap/1')]?.objects.get(value);
    if (managed) return {owner:managed.slots,offset:0,value};
    if (value?.__cReference===true&&value.__cPointer!==true) {
      const target=value.value;
      if (target?.[cByteRecordStorageTag]) return canonical(target);
      return {owner:value,offset:0,value};
    }
    if (value?.__cPointer===true) {
      const bytes=value.array && value.buffer?.[Symbol.for('source-first.clang-byte-record-array/1')];
      if (bytes) return {owner:bytes.buffer,offset:bytes.byteOffset+value.offset,value};
      return {owner:value.buffer,offset:value.offset,value};
    }
    const bytes=value?.[cByteRecordStorageTag]?.bytes ||
                value?.[Symbol.for('source-first.clang-byte-record-array/1')];
    if (bytes) return {owner:bytes.buffer,offset:bytes.byteOffset,value};
    if (ArrayBuffer.isView(value)) return {owner:value.buffer,offset:value.byteOffset,value};
    if (typeof value==='function' || Array.isArray(value)) return {owner:value,offset:0,value};
    throw new TypeError('C pointer field requires original owned storage or callable');
  };
  return {
    encode(value) {
      if (value===null) return 0n;
      const item=canonical(value);
      let offsets=state.byOwner.get(item.owner);
      if (!offsets) {offsets=new Map();state.byOwner.set(item.owner,offsets);}
      if (!offsets.has(item.offset)) {
        const bits=state.next++;
        if (bits>0xffffffffffffffffn) throw new RangeError('C pointer identity storage exhausted');
        offsets.set(item.offset,bits);state.byBits.set(bits,item.value);
      }
      return offsets.get(item.offset);
    },
    decode(bits) {
      if (bits===0n) return null;
      if (!state.byBits.has(bits)) throw new TypeError('Unknown C pointer object representation');
      return state.byBits.get(bits);
    }
  };
})();
// Contiguous LP64 slots preserve pointer identity and native byte copies.
const cPointerArray = (count, values=[], storage=null) => {
  if(!Number.isSafeInteger(count)||count<0||count>1000000||!Array.isArray(values)||values.length>count)
    throw new RangeError('Invalid original pointer-array extent');
  const bytes=storage||new Uint8Array(count*8);
  if(!(bytes instanceof Uint8Array)||bytes.length!==count*8||bytes.byteOffset%8)
    throw new TypeError('Pointer array backing store differs from original LP64 extent');
  const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.length),slots=new Array(count).fill(null);
  const allocationView=new DataView(bytes.buffer);
  const allocationKey=Symbol.for('source-first.pointer-array-allocations/1');
  const allocations=globalThis[allocationKey]||(globalThis[allocationKey]=new WeakMap());
  allocations.set(bytes.buffer,{lower:0,upper:bytes.buffer.byteLength,
    read:offset=>cByteRecordPointers.decode(allocationView.getBigUint64(offset,true)),
    write:(offset,value)=>allocationView.setBigUint64(offset,cByteRecordPointers.encode(value),true)});
  Object.defineProperty(slots,Symbol.for('source-first.clang-byte-record-array/1'),{value:bytes});
  Object.defineProperty(slots,Symbol.for('source-first.clang-pointer-array/1'),{value:true});
  const indexOf=key=>typeof key==='string'&&/^(0|[1-9][0-9]*)$/.test(key)?Number(key):-1;
  const result=new Proxy(slots,{
    get(target,key,receiver){const i=indexOf(key);if(i>=0){if(i>=count)throw new RangeError('C pointer-array read exceeds extent');return cByteRecordPointers.decode(view.getBigUint64(i*8,true));}return Reflect.get(target,key,receiver);},
    set(target,key,value,receiver){const i=indexOf(key);if(i>=0){if(i>=count)throw new RangeError('C pointer-array write exceeds extent');view.setBigUint64(i*8,cByteRecordPointers.encode(value),true);return true;}if(key==='length')throw new TypeError('Cannot resize original C pointer array');return Reflect.set(target,key,value,receiver);}
  });
  for(let i=0;i<values.length;i++)result[i]=values[i];
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

const i32 = value => Number(value) | 0;
const u32 = value => Number(value) >>> 0;
const i64 = value => BigInt.asIntN(64, BigInt(value));
const u64 = value => BigInt.asUintN(64, BigInt(value));
const fabsf = a => Math.fround(Math.abs(Math.fround(a)));
const ceilf = a => Math.fround(Math.ceil(Math.fround(a)));

// C/C++ source: source/imgui/include/imgui_internal.h:1771
export function ImGuiFocusScopeData() {
  return ImGuiFocusScopeData.type || (ImGuiFocusScopeData.type = class ImGuiFocusScopeData__implementation {
  constructor() {
    return Object.setPrototypeOf(cZeroAggregate({"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"ID": {"native": "Uint32Array", "offset": 0, "size": 4}, "WindowID": {"native": "Uint32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}}, {}), new.target.prototype);
  }
});
}

// C/C++ source: source/imgui/include/imgui_internal.h:1571
export function ImGuiKeyRoutingData() {
  return ImGuiKeyRoutingData.type || (ImGuiKeyRoutingData.type = class ImGuiKeyRoutingData__implementation {
  constructor() {
    (this.NextEntryIndex = (((((((-1)) << 16) >> 16)) << 16) >> 16));
    (this.Mods = ((((0) & 65535)) & 65535));
    (this.RoutingCurrScore = (((this.RoutingNextScore = ((((0) & 65535)) & 65535))) & 65535));
    (this.RoutingCurr = u32((this.RoutingNext = u32((-1)))));
  }
});
}

// C/C++ source: source/imgui/include/imgui_internal.h:1654
export function ImGuiListClipperRange() {
  return ImGuiListClipperRange.type || (ImGuiListClipperRange.type = class ImGuiListClipperRange__implementation {
  constructor() {
    this.Min = undefined;
    this.Max = undefined;
    this.PosToIndexConvert = undefined;
    this.PosToIndexOffsetMin = undefined;
    this.PosToIndexOffsetMax = undefined;
  }
  static FromIndices(min, max) {
    let r = cMarkAggregate(Object.assign(Object.create(ImGuiListClipperRange().prototype), cMarkAggregate(({"Min": min, "Max": max, "PosToIndexConvert": false, "PosToIndexOffsetMin": (((0) << 24) >> 24), "PosToIndexOffsetMax": (((0) << 24) >> 24)}))));
    return cCopyTrivialClass(r, ImGuiListClipperRange(), ["Min", "Max", "PosToIndexConvert", "PosToIndexOffsetMin", "PosToIndexOffsetMax"]);
  }
  static FromPositions(y1, y2, off_min, off_max) {
    let r = cMarkAggregate(Object.assign(Object.create(ImGuiListClipperRange().prototype), cMarkAggregate(({"Min": i32(y1), "Max": i32(y2), "PosToIndexConvert": true, "PosToIndexOffsetMin": ((((((off_min) << 24) >> 24)) << 24) >> 24), "PosToIndexOffsetMax": ((((((off_max) << 24) >> 24)) << 24) >> 24)}))));
    return cCopyTrivialClass(r, ImGuiListClipperRange(), ["Min", "Max", "PosToIndexConvert", "PosToIndexOffsetMin", "PosToIndexOffsetMax"]);
  }
});
}

// C/C++ source: source/imgui/include/imgui_internal.h:2132
export function ImGuiStackLevelInfo() {
  return ImGuiStackLevelInfo.type || (ImGuiStackLevelInfo.type = class ImGuiStackLevelInfo__implementation {
  constructor() {
    cByteMemory.memset(this, 0, 12);
    (this.DataType = (((((((-1)) << 24) >> 24)) << 24) >> 24));
    (this.DescOffset = i32((-1)));
  }
});
}

// C/C++ source: source/imgui/include/imgui.h:295
export function ImVec2() {
  return ImVec2.type || (ImVec2.type = class ImVec2__implementation {
  constructor() { throw new TypeError("Clang-selected constructor factory required"); }
  __cxx_construct_3fdb0b4b21c3726c() {
    this.x = Math.fround(0);
    this.y = Math.fround(0);
    
  }
  static __cxx_construct_3fdb0b4b21c3726c() {
    const value=Object.create(ImVec2__implementation.prototype);
    value.__cxx_construct_3fdb0b4b21c3726c();
    return value;
  }
  __cxx_construct_edecdff36a89174e(_x, _y) {
    this.x = _x;
    this.y = _y;
    
  }
  static __cxx_construct_edecdff36a89174e(_x, _y) {
    const value=Object.create(ImVec2__implementation.prototype);
    value.__cxx_construct_edecdff36a89174e(_x, _y);
    return value;
  }
  __cxx_operator_6a20d07852a9c373(idx) {
    0;
    return (cDeref(cPointerOffset(cTypedPointer(cTypedPointer(this, Uint8Array), Float32Array), idx, Float32Array.BYTES_PER_ELEMENT), Float32Array).value);
  }
  __cxx_operator_4b2512a953823607(idx) {
    0;
    return Math.fround((cDeref(cPointerOffset(cTypedPointer(cTypedPointer(this, Uint8Array), Float32Array), idx, Float32Array.BYTES_PER_ELEMENT), Float32Array).value));
  }
});
}

// C/C++ source: source/imgui/include/imgui_internal.h:571
export function ImVec2ih() {
  return ImVec2ih.type || (ImVec2ih.type = class ImVec2ih__implementation {
  constructor() { throw new TypeError("Clang-selected constructor factory required"); }
  __cxx_construct_3fdb0b4b21c3726c() {
    this.x = (((0) << 16) >> 16);
    this.y = (((0) << 16) >> 16);
    
  }
  static __cxx_construct_3fdb0b4b21c3726c() {
    const value=Object.create(ImVec2ih__implementation.prototype);
    value.__cxx_construct_3fdb0b4b21c3726c();
    return value;
  }
  __cxx_construct_c61a921b8b4eaaef(_x, _y) {
    this.x = _x;
    this.y = _y;
    
  }
  static __cxx_construct_c61a921b8b4eaaef(_x, _y) {
    const value=Object.create(ImVec2ih__implementation.prototype);
    value.__cxx_construct_c61a921b8b4eaaef(_x, _y);
    return value;
  }
  __cxx_construct_57cc962e4e8f298a(rhs) {
    this.x = ((((((rhs.x) << 16) >> 16)) << 16) >> 16);
    this.y = ((((((rhs.y) << 16) >> 16)) << 16) >> 16);
    
  }
  static __cxx_construct_57cc962e4e8f298a(rhs) {
    const value=Object.create(ImVec2ih__implementation.prototype);
    value.__cxx_construct_57cc962e4e8f298a(rhs);
    return value;
  }
});
}

// C/C++ source: source/imgui/include/imgui.h:308
export function ImVec4() {
  return ImVec4.type || (ImVec4.type = class ImVec4__implementation {
  constructor() { throw new TypeError("Clang-selected constructor factory required"); }
  __cxx_construct_3fdb0b4b21c3726c() {
    this.x = Math.fround(0);
    this.y = Math.fround(0);
    this.z = Math.fround(0);
    this.w = Math.fround(0);
    
  }
  static __cxx_construct_3fdb0b4b21c3726c() {
    const value=Object.create(ImVec4__implementation.prototype);
    value.__cxx_construct_3fdb0b4b21c3726c();
    return value;
  }
  __cxx_construct_33e919b602ff0017(_x, _y, _z, _w) {
    this.x = _x;
    this.y = _y;
    this.z = _z;
    this.w = _w;
    
  }
  static __cxx_construct_33e919b602ff0017(_x, _y, _z, _w) {
    const value=Object.create(ImVec4__implementation.prototype);
    value.__cxx_construct_33e919b602ff0017(_x, _y, _z, _w);
    return value;
  }
});
}

// C/C++ source: source/imgui/src/imgui.cpp:6776
export class ImGuiResizeGripDef {
  constructor() {
    this.CornerPosN = undefined;
    this.InnerDir = undefined;
    this.AngleMin12 = undefined;
    this.AngleMax12 = undefined;
  }
}

// C/C++ source: source/imgui/src/imgui.cpp:6791
export class ImGuiResizeBorderDef {
  constructor() {
    this.InnerDir = undefined;
    this.SegmentN1 = undefined;
    this.SegmentN2 = undefined;
    this.OuterAngle = undefined;
  }
}

// C/C++ source: source/imgui/src/imgui.cpp:1290
export const FONT_DEFAULT_SIZE_BASE = Math.fround(Math.fround(20));
function __cxx_static_address_edd2996645b5d534fab2001f() {
  return __cxx_static_address_edd2996645b5d534fab2001f.reference || (__cxx_static_address_edd2996645b5d534fab2001f.reference = {
    __cReference: true,
    get value() { return FONT_DEFAULT_SIZE_BASE; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/imgui/src/imgui.cpp:1293
export const NAV_WINDOWING_HIGHLIGHT_DELAY = Math.fround(Math.fround(0.200000003));
function __cxx_static_address_d271f00c20bc5b3b18db17d9() {
  return __cxx_static_address_d271f00c20bc5b3b18db17d9.reference || (__cxx_static_address_d271f00c20bc5b3b18db17d9.reference = {
    __cReference: true,
    get value() { return NAV_WINDOWING_HIGHLIGHT_DELAY; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/imgui/src/imgui.cpp:1294
export const NAV_WINDOWING_LIST_APPEAR_DELAY = Math.fround(Math.fround(0.150000006));
function __cxx_static_address_9ffe56e304c48aa10a627337() {
  return __cxx_static_address_9ffe56e304c48aa10a627337.reference || (__cxx_static_address_9ffe56e304c48aa10a627337.reference = {
    __cReference: true,
    get value() { return NAV_WINDOWING_LIST_APPEAR_DELAY; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/imgui/src/imgui.cpp:1295
export const NAV_ACTIVATE_HIGHLIGHT_TIMER = Math.fround(Math.fround(0.100000001));
function __cxx_static_address_0e304dda9f90f0a7d70f9014() {
  return __cxx_static_address_0e304dda9f90f0a7d70f9014.reference || (__cxx_static_address_0e304dda9f90f0a7d70f9014.reference = {
    __cReference: true,
    get value() { return NAV_ACTIVATE_HIGHLIGHT_TIMER; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/imgui/src/imgui.cpp:1296
export const WINDOWS_RESIZE_FROM_EDGES_FEEDBACK_TIMER = Math.fround(Math.fround(0.0399999991));
function __cxx_static_address_2851b6e90559f9074e1c1e50() {
  return __cxx_static_address_2851b6e90559f9074e1c1e50.reference || (__cxx_static_address_2851b6e90559f9074e1c1e50.reference = {
    __cReference: true,
    get value() { return WINDOWS_RESIZE_FROM_EDGES_FEEDBACK_TIMER; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/imgui/src/imgui.cpp:1297
export const WINDOWS_MOUSE_WHEEL_SCROLL_LOCK_TIMER = Math.fround(Math.fround(0.699999988));
function __cxx_static_address_db98a5b60824e77e903be855() {
  return __cxx_static_address_db98a5b60824e77e903be855.reference || (__cxx_static_address_db98a5b60824e77e903be855.reference = {
    __cReference: true,
    get value() { return WINDOWS_MOUSE_WHEEL_SCROLL_LOCK_TIMER; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/imgui/src/imgui.cpp:1300
export const TOOLTIP_DEFAULT_OFFSET_MOUSE = cCopyTrivialClass((ImVec2()).__cxx_construct_edecdff36a89174e(Math.fround(16), Math.fround(10)), ImVec2(), ["x", "y"]);
function __cxx_static_address_0c6254f51c6fb4c4ed0a2a0c() {
  return __cxx_static_address_0c6254f51c6fb4c4ed0a2a0c.reference || (__cxx_static_address_0c6254f51c6fb4c4ed0a2a0c.reference = {
    __cReference: true,
    get value() { return TOOLTIP_DEFAULT_OFFSET_MOUSE; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/imgui/src/imgui.cpp:1301
export const TOOLTIP_DEFAULT_OFFSET_TOUCH = cCopyTrivialClass((ImVec2()).__cxx_construct_edecdff36a89174e(Math.fround(0), Math.fround((-20))), ImVec2(), ["x", "y"]);
function __cxx_static_address_383ca3b7823ef14e6c8d895a() {
  return __cxx_static_address_383ca3b7823ef14e6c8d895a.reference || (__cxx_static_address_383ca3b7823ef14e6c8d895a.reference = {
    __cReference: true,
    get value() { return TOOLTIP_DEFAULT_OFFSET_TOUCH; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/imgui/src/imgui.cpp:1302
export const TOOLTIP_DEFAULT_PIVOT_TOUCH = cCopyTrivialClass((ImVec2()).__cxx_construct_edecdff36a89174e(Math.fround(0.5), Math.fround(1)), ImVec2(), ["x", "y"]);
function __cxx_static_address_3adf0c70624a889254a06d16() {
  return __cxx_static_address_3adf0c70624a889254a06d16.reference || (__cxx_static_address_3adf0c70624a889254a06d16.reference = {
    __cReference: true,
    get value() { return TOOLTIP_DEFAULT_PIVOT_TOUCH; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/imgui/src/imgui.cpp:1389
export const IMGUI_VIEWPORT_DEFAULT_ID = u32(286331153);
function __cxx_static_address_7d03923c744b23d745617eca() {
  return __cxx_static_address_7d03923c744b23d745617eca.reference || (__cxx_static_address_7d03923c744b23d745617eca.reference = {
    __cReference: true,
    get value() { return IMGUI_VIEWPORT_DEFAULT_ID; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/imgui/src/imgui.cpp:1419
export let GImGui = null;
export function __cxx_global_cell_e5b755bd7a51ddfa2112aa98() {
  return __cxx_global_cell_e5b755bd7a51ddfa2112aa98.reference || (__cxx_global_cell_e5b755bd7a51ddfa2112aa98.reference = {
    __cReference: true,
    get value() { return GImGui; },
    set value(__cxx_lvalue_0) { GImGui = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/imgui/src/imgui.cpp:1434
export let GImAllocatorUserData = null;
function __cxx_static_address_87e189206b17155988cf7e61() {
  return __cxx_static_address_87e189206b17155988cf7e61.reference || (__cxx_static_address_87e189206b17155988cf7e61.reference = {
    __cReference: true,
    get value() { return GImAllocatorUserData; },
    set value(__cxx_lvalue_0) { GImAllocatorUserData = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/imgui/src/imgui.cpp:2053
export function ImLineClosestPoint(a, b, p) {
  let ap = cCopyTrivialClass(__cxx_operator_71e4282592b4c08b(p, a), ImVec2(), ["x", "y"]);
  let ab_dir = cCopyTrivialClass(__cxx_operator_71e4282592b4c08b(b, a), ImVec2(), ["x", "y"]);
  let dot = Math.fround(Math.fround((Math.fround((ap.x * ab_dir.x)) + Math.fround((ap.y * ab_dir.y)))));
  if ((dot < Math.fround(0))) {
    return cCopyTrivialClass(a, ImVec2(), ["x", "y"]);
  }
  let ab_len_sqr = Math.fround(Math.fround((Math.fround((ab_dir.x * ab_dir.x)) + Math.fround((ab_dir.y * ab_dir.y)))));
  if ((dot > ab_len_sqr)) {
    return cCopyTrivialClass(b, ImVec2(), ["x", "y"]);
  }
  return cCopyTrivialClass(__cxx_operator_e11e480209a9c93d(a, __cxx_operator_372b2b6ad9d13c9e(__cxx_operator_5cbbdd7bd8f48e39(ab_dir, dot), ab_len_sqr)), ImVec2(), ["x", "y"]);
}

// C/C++ source: source/imgui/src/imgui.cpp:2066
export function ImTriangleContainsPoint(a, b, c, p) {
  let b1 = Boolean((Math.fround((Math.fround((Math.fround((p.x - b.x)) * Math.fround((a.y - b.y)))) - Math.fround((Math.fround((p.y - b.y)) * Math.fround((a.x - b.x)))))) < Math.fround(0)));
  let b2 = Boolean((Math.fround((Math.fround((Math.fround((p.x - c.x)) * Math.fround((b.y - c.y)))) - Math.fround((Math.fround((p.y - c.y)) * Math.fround((b.x - c.x)))))) < Math.fround(0)));
  let b3 = Boolean((Math.fround((Math.fround((Math.fround((p.x - a.x)) * Math.fround((c.y - a.y)))) - Math.fround((Math.fround((p.y - a.y)) * Math.fround((c.x - a.x)))))) < Math.fround(0)));
  return Boolean(((i32(b1) == i32(b2)) && (i32(b2) == i32(b3))));
}

// C/C++ source: source/imgui/src/imgui.cpp:2074
export function ImTriangleBarycentricCoords(a, b, c, p, out_u, out_v, out_w) {
  let v0 = cCopyTrivialClass(__cxx_operator_71e4282592b4c08b(b, a), ImVec2(), ["x", "y"]);
  let v1 = cCopyTrivialClass(__cxx_operator_71e4282592b4c08b(c, a), ImVec2(), ["x", "y"]);
  let v2 = cCopyTrivialClass(__cxx_operator_71e4282592b4c08b(p, a), ImVec2(), ["x", "y"]);
  let denom = Math.fround(Math.fround((Math.fround((v0.x * v1.y)) - Math.fround((v1.x * v0.y)))));
  (out_v = Math.fround((Math.fround((Math.fround((v2.x * v1.y)) - Math.fround((v1.x * v2.y)))) / denom)));
  (out_w = Math.fround((Math.fround((Math.fround((v0.x * v2.y)) - Math.fround((v2.x * v0.y)))) / denom)));
  (out_u = Math.fround((Math.fround((Math.fround(1) - out_v)) - out_w)));
}

// C/C++ source: source/imgui/src/imgui.cpp:2085
export function ImTriangleClosestPoint(a, b, c, p) {
  let proj_ab = cCopyTrivialClass(ImLineClosestPoint(a, b, p), ImVec2(), ["x", "y"]);
  let proj_bc = cCopyTrivialClass(ImLineClosestPoint(b, c, p), ImVec2(), ["x", "y"]);
  let proj_ca = cCopyTrivialClass(ImLineClosestPoint(c, a, p), ImVec2(), ["x", "y"]);
  let dist2_ab = Math.fround(ImLengthSqr(__cxx_operator_71e4282592b4c08b(p, proj_ab)));
  let dist2_bc = Math.fround(ImLengthSqr(__cxx_operator_71e4282592b4c08b(p, proj_bc)));
  let dist2_ca = Math.fround(ImLengthSqr(__cxx_operator_71e4282592b4c08b(p, proj_ca)));
  let m = Math.fround(ImMin(dist2_ab, ImMin(dist2_bc, dist2_ca)));
  if ((m == dist2_ab)) {
    return cCopyTrivialClass(proj_ab, ImVec2(), ["x", "y"]);
  }
  if ((m == dist2_bc)) {
    return cCopyTrivialClass(proj_bc, ImVec2(), ["x", "y"]);
  }
  return cCopyTrivialClass(proj_ca, ImVec2(), ["x", "y"]);
}

// C/C++ source: source/imgui/src/imgui.cpp:2106
export function ImStricmp(str1, str2) {
  let d;
  while ((((d = i32((i32(ImToUpper((cDeref(str2, Uint8Array).value))) - i32(ImToUpper((cDeref(str1, Uint8Array).value)))))) == 0) && Boolean((cDeref(str1, Uint8Array).value)))) {
    ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_0.value = next; return previous; })(cRef(() => str1, __cxx_lvalue_1 => { str1 = __cxx_lvalue_1; }));
    ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_2.value = next; return previous; })(cRef(() => str2, __cxx_lvalue_3 => { str2 = __cxx_lvalue_3; }));
  }
  return i32(d);
}

// C/C++ source: source/imgui/src/imgui.cpp:2113
export function ImStrnicmp(str1, str2, count) {
  let d = i32(0);
  while ((((count > u64(0)) && ((d = i32((i32(ImToUpper((cDeref(str2, Uint8Array).value))) - i32(ImToUpper((cDeref(str1, Uint8Array).value)))))) == 0)) && Boolean((cDeref(str1, Uint8Array).value)))) {
    ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_0.value = next; return previous; })(cRef(() => str1, __cxx_lvalue_1 => { str1 = __cxx_lvalue_1; }));
    ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_2.value = next; return previous; })(cRef(() => str2, __cxx_lvalue_3 => { str2 = __cxx_lvalue_3; }));
    ((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = u64((previous - 1n)); __cxx_lvalue_4.value = next; return previous; })(cRef(() => count, __cxx_lvalue_5 => { count = __cxx_lvalue_5; }));
  }
  return i32(d);
}

// C/C++ source: source/imgui/src/imgui.cpp:2120
export function ImStrncpy(dst, src, count) {
  if ((count < u64(1))) {
    return;
  }
  if ((count > u64(1))) {
    cByteMemory.strncpy(dst, src, (BigInt(count) - BigInt(u64(1))));
  }
  ((cDeref(cPointerOffset(dst, (BigInt(count) - BigInt(u64(1))), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = ((((0) & 255)) & 255));
}

// C/C++ source: source/imgui/src/imgui.cpp:2162
export function ImStrlenW(str) {
  let n = i32(0);
  while (Boolean((cDeref(((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = cPointerOffset(previous, 1, Uint16Array.BYTES_PER_ELEMENT); __cxx_lvalue_0.value = next; return previous; })(cRef(() => str, __cxx_lvalue_1 => { str = __cxx_lvalue_1; })), Uint16Array).value))) {
    ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i32((previous + 1)); __cxx_lvalue_2.value = next; return previous; })(cRef(() => n, __cxx_lvalue_3 => { n = __cxx_lvalue_3; }));
  }
  return i32(n);
}

// C/C++ source: source/imgui/src/imgui.cpp:2177
export function ImStrbol(buf_mid_line, buf_begin) {
  ;
  while ((cPointerCompare(buf_mid_line, buf_begin, ">") && (i32((cDeref(cPointerOffset(buf_mid_line, (-1), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) != i32(10)))) {
    ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = cPointerOffset(previous, -1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_0.value = next; return previous; })(cRef(() => buf_mid_line, __cxx_lvalue_1 => { buf_mid_line = __cxx_lvalue_1; }));
  }
  return buf_mid_line;
}

// C/C++ source: source/imgui/src/imgui.cpp:2185
export function ImStristr(haystack, haystack_end, needle, needle_end) {
  if ((!needle_end)) {
    (needle_end = cPointerOffset(needle, cByteMemory.strlen(needle), Uint8Array.BYTES_PER_ELEMENT));
  }
  let un0 = ((((ImToUpper((cDeref(needle, Uint8Array).value))) & 255)) & 255);
  while ((((!haystack_end) && Boolean((cDeref(haystack, Uint8Array).value))) || (haystack_end && cPointerCompare(haystack, haystack_end, "<")))) {
    if ((i32(ImToUpper((cDeref(haystack, Uint8Array).value))) == i32(un0))) {
      let b = cPointerOffset(needle, 1, Uint8Array.BYTES_PER_ELEMENT);
      for (let a = cPointerOffset(haystack, 1, Uint8Array.BYTES_PER_ELEMENT); cPointerCompare(b, needle_end, "<"); (((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_0.value = next; return previous; })(cRef(() => a, __cxx_lvalue_1 => { a = __cxx_lvalue_1; })), ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_2.value = next; return previous; })(cRef(() => b, __cxx_lvalue_3 => { b = __cxx_lvalue_3; })))) {
        if ((i32(ImToUpper((cDeref(a, Uint8Array).value))) != i32(ImToUpper((cDeref(b, Uint8Array).value))))) {
          break;
        }
      }
      if (cPointerCompare(b, needle_end, "==")) {
        return haystack;
      }
    }
    ((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_4.value = next; return previous; })(cRef(() => haystack, __cxx_lvalue_5 => { haystack = __cxx_lvalue_5; }));
  }
  return null;
}

// C/C++ source: source/imgui/src/imgui.cpp:2208
export function ImStrTrimBlanks(buf) {
  let p = buf;
  while (((i32((cDeref(cPointerOffset(p, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == i32(32)) || (i32((cDeref(cPointerOffset(p, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == i32(9)))) {
    ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_0.value = next; return previous; })(cRef(() => p, __cxx_lvalue_1 => { p = __cxx_lvalue_1; }));
  }
  let p_start = p;
  while ((i32((cDeref(p, Uint8Array).value)) != 0)) {
    ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_2.value = next; return previous; })(cRef(() => p, __cxx_lvalue_3 => { p = __cxx_lvalue_3; }));
  }
  while ((cPointerCompare(p, p_start, ">") && ((i32((cDeref(cPointerOffset(p, (-1), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == i32(32)) || (i32((cDeref(cPointerOffset(p, (-1), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == i32(9))))) {
    ((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = cPointerOffset(previous, -1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_4.value = next; return previous; })(cRef(() => p, __cxx_lvalue_5 => { p = __cxx_lvalue_5; }));
  }
  if (cPointerCompare(p_start, buf, "!=")) {
    cByteMemory.memmove(buf, p_start, u64(cPointerDiff(p, p_start, Uint8Array.BYTES_PER_ELEMENT)));
  }
  ((cDeref(cPointerOffset(buf, cPointerDiff(p, p_start, Uint8Array.BYTES_PER_ELEMENT), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = ((((0) & 255)) & 255));
}

// C/C++ source: source/imgui/src/imgui.cpp:2223
export function ImStrSkipBlank(str) {
  while (((i32((cDeref(cPointerOffset(str, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == i32(32)) || (i32((cDeref(cPointerOffset(str, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == i32(9)))) {
    ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_0.value = next; return previous; })(cRef(() => str, __cxx_lvalue_1 => { str = __cxx_lvalue_1; }));
  }
  return str;
}

// C/C++ source: source/imgui/src/imgui.cpp:2335
export const GCrc32LookupTable = new Uint32Array([u32(0), 4067132163, 3778769143, u32(324072436), 3348797215, u32(904991772), u32(648144872), 3570033899, 2329499855, u32(2024987596), u32(1809983544), 2575936315, u32(1296289744), 3207089363, 2893594407, u32(1578318884), u32(274646895), 3795141740, 4049975192, u32(51262619), 3619967088, u32(632279923), u32(922689671), 3298075524, 2592579488, u32(1760304291), u32(2075979607), 2312596564, u32(1562183871), 2943781820, 3156637768, u32(1313733451), u32(549293790), 3537243613, 3246849577, u32(871202090), 3878099393, u32(357341890), u32(102525238), 4101499445, 2858735121, u32(1477399826), u32(1264559846), 3107202533, u32(1845379342), 2677391885, 2361733625, u32(2125378298), u32(820201905), 3263744690, 3520608582, u32(598981189), 4151959214, u32(85089709), u32(373468761), 3827903834, 3124367742, u32(1213305469), u32(1526817161), 2842354314, u32(2107672161), 2412447074, 2627466902, u32(1861252501), u32(1098587580), 3004210879, 2688576843, u32(1378610760), 2262928035, u32(1955203488), u32(1742404180), 2511436119, 3416409459, u32(969524848), u32(714683780), 3639785095, u32(205050476), 4266873199, 3976438427, u32(526918040), u32(1361435347), 2739821008, 2954799652, u32(1114974503), 2529119692, u32(1691668175), u32(2005155131), 2247081528, 3690758684, u32(697762079), u32(986182379), 3366744552, u32(476452099), 3993867776, 4250756596, u32(255256311), u32(1640403810), 2477592673, 2164122517, u32(1922457750), 2791048317, u32(1412925310), u32(1197962378), 3037525897, 3944729517, u32(427051182), u32(170179418), 4165941337, u32(746937522), 3740196785, 3451792453, u32(1070968646), u32(1905808397), 2213795598, 2426610938, u32(1657317369), 3053634322, u32(1147748369), u32(1463399397), 2773627110, 4215344322, u32(153784257), u32(444234805), 3893493558, u32(1021025245), 3467647198, 3722505002, u32(797665321), 2197175160, u32(1889384571), u32(1674398607), 2443626636, u32(1164749927), 3070701412, 2757221520, u32(1446797203), u32(137323447), 4198817972, 3910406976, u32(461344835), 3484808360, u32(1037989803), u32(781091935), 3705997148, 2460548119, u32(1623424788), u32(1939049696), 2180517859, u32(1429367560), 2807687179, 3020495871, u32(1180866812), u32(410100952), 3927582683, 4182430767, u32(186734380), 3756733383, u32(763408580), u32(1053836080), 3434856499, 2722870694, u32(1344288421), u32(1131464017), 2971354706, u32(1708204729), 2545590714, 2229949006, u32(1988219213), u32(680717673), 3673779818, 3383336350, u32(1002577565), 4010310262, u32(493091189), u32(238226049), 4233660802, 2987750089, u32(1082061258), u32(1395524158), 2705686845, u32(1972364758), 2279892693, 2494862625, u32(1725896226), u32(952904198), 3399985413, 3656866545, u32(731699698), 4283874585, u32(222117402), u32(510512622), 3959836397, 3280807620, u32(837199303), u32(582374963), 3504198960, u32(68661723), 4135334616, 3844915500, u32(390545967), u32(1230274059), 3141532936, 2825850620, u32(1510247935), 2395924756, u32(2091215383), u32(1878366691), 2644384480, 3553878443, u32(565732008), u32(854102364), 3229815391, u32(340358836), 3861050807, 4117890627, u32(119113024), u32(1493875044), 2875275879, 3090270611, u32(1247431312), 2660249211, u32(1828433272), u32(2141937292), 2378227087, 3811616794, u32(291187481), u32(34330861), 4032846830, u32(615137029), 3603020806, 3314634738, u32(939183345), u32(1776939221), 2609017814, 2295496738, u32(2058945313), 2926798794, u32(1545135305), u32(1330124605), 3173225534, 4084100981, u32(17165430), u32(307568514), 3762199681, u32(888469610), 3332340585, 3587147933, u32(665062302), u32(2042050490), 2346497209, 2559330125, u32(1793573966), 3190661285, u32(1279665062), u32(1595330642), 2910671697]);
function __cxx_static_address_590a452b2e5cbf314a2ceb72() {
  return __cxx_static_address_590a452b2e5cbf314a2ceb72.reference || (__cxx_static_address_590a452b2e5cbf314a2ceb72.reference = {
    __cReference: true,
    get value() { return GCrc32LookupTable; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/imgui/src/imgui.cpp:2380
export function ImHashData(data_p, data_size, seed) {
  let crc = u32((~seed));
  let data = cTypedPointer(data_p, Uint8Array);
  let data_end = cPointerOffset(cTypedPointer(data_p, Uint8Array), data_size, Uint8Array.BYTES_PER_ELEMENT);
  let crc32_lut = GCrc32LookupTable;
  while (cPointerCompare(data, data_end, "<")) {
    (crc = u32(((crc >>> 8) ^ (cDeref(cPointerOffset(crc32_lut, u32((u32((crc & u32(255))) ^ u32((cDeref(((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_0.value = next; return previous; })(cRef(() => data, __cxx_lvalue_1 => { data = __cxx_lvalue_1; })), Uint8Array).value)))), Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value))));
  }
  return (~crc);
}

// C/C++ source: source/imgui/src/imgui.cpp:2552
let __static_ImTextCharFromUtf8_lengths = new Uint8Array([((1) & 255), ((1) & 255), ((1) & 255), ((1) & 255), ((1) & 255), ((1) & 255), ((1) & 255), ((1) & 255), ((1) & 255), ((1) & 255), ((1) & 255), ((1) & 255), ((1) & 255), ((1) & 255), ((1) & 255), ((1) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((2) & 255), ((2) & 255), ((2) & 255), ((2) & 255), ((3) & 255), ((3) & 255), ((4) & 255), ((0) & 255)]);
let __static_ImTextCharFromUtf8_masks = new Int32Array([0, 127, 31, 15, 7]);
let __static_ImTextCharFromUtf8_mins = new Uint32Array([u32(4194304), u32(0), u32(128), u32(2048), u32(65536)]);
let __static_ImTextCharFromUtf8_shiftc = new Int32Array([0, 18, 12, 6, 0]);
let __static_ImTextCharFromUtf8_shifte = new Int32Array([0, 6, 4, 2, 0]);
export function ImTextCharFromUtf8(out_char, in_text, in_text_end) {





  let len = i32((cDeref(cPointerOffset(__static_ImTextCharFromUtf8_lengths, i32((i32((cDeref(cTypedPointer(in_text, Uint8Array), Uint8Array).value)) >> 3)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value));
  let wanted = i32((len + (Boolean(len) ? 0 : 1)));
  if (cPointerCompare(in_text_end, null, "==")) {
    (in_text_end = cPointerOffset(in_text, wanted, Uint8Array.BYTES_PER_ELEMENT));
  }
  let s = cZeroAggregate({"array": "Uint8Array", "dims": [4]});
  ((cDeref(cPointerOffset(s, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (((((cPointerCompare(cPointerOffset(in_text, 0, Uint8Array.BYTES_PER_ELEMENT), in_text_end, "<") ? i32((cDeref(cPointerOffset(in_text, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) : 0)) & 255)) & 255));
  ((cDeref(cPointerOffset(s, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (((((cPointerCompare(cPointerOffset(in_text, 1, Uint8Array.BYTES_PER_ELEMENT), in_text_end, "<") ? i32((cDeref(cPointerOffset(in_text, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) : 0)) & 255)) & 255));
  ((cDeref(cPointerOffset(s, 2, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (((((cPointerCompare(cPointerOffset(in_text, 2, Uint8Array.BYTES_PER_ELEMENT), in_text_end, "<") ? i32((cDeref(cPointerOffset(in_text, 2, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) : 0)) & 255)) & 255));
  ((cDeref(cPointerOffset(s, 3, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (((((cPointerCompare(cPointerOffset(in_text, 3, Uint8Array.BYTES_PER_ELEMENT), in_text_end, "<") ? i32((cDeref(cPointerOffset(in_text, 3, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) : 0)) & 255)) & 255));
  ((cDeref(out_char, Uint32Array).value) = u32((u32(i32((i32((cDeref(cPointerOffset(s, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & (cDeref(cPointerOffset(__static_ImTextCharFromUtf8_masks, len, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)))) << 18)));
  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = u32((__cxx_lvalue_0.value | u32((u32(i32((i32((cDeref(cPointerOffset(s, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 63))) << 12))))))(cDeref(out_char, Uint32Array));
  ((__cxx_lvalue_1) => (__cxx_lvalue_1.value = u32((__cxx_lvalue_1.value | u32((u32(i32((i32((cDeref(cPointerOffset(s, 2, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 63))) << 6))))))(cDeref(out_char, Uint32Array));
  ((__cxx_lvalue_2) => (__cxx_lvalue_2.value = u32((__cxx_lvalue_2.value | u32((u32(i32((i32((cDeref(cPointerOffset(s, 3, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 63))) << 0))))))(cDeref(out_char, Uint32Array));
  ((__cxx_lvalue_3) => (__cxx_lvalue_3.value = u32((__cxx_lvalue_3.value >> (cDeref(cPointerOffset(__static_ImTextCharFromUtf8_shiftc, len, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)))))(cDeref(out_char, Uint32Array));
  let e = i32(0);
  (e = i32((i32(((cDeref(out_char, Uint32Array).value) < (cDeref(cPointerOffset(__static_ImTextCharFromUtf8_mins, len, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value))) << 6)));
  (e = i32((e | i32((i32((((cDeref(out_char, Uint32Array).value) >>> 11) == u32(27))) << 7)))));
  (e = i32((e | i32((i32(((cDeref(out_char, Uint32Array).value) > u32(65535))) << 8)))));
  (e = i32((e | i32((i32((i32((cDeref(cPointerOffset(s, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 192)) >> 2)))));
  (e = i32((e | i32((i32((i32((cDeref(cPointerOffset(s, 2, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 192)) >> 4)))));
  (e = i32((e | i32((i32((cDeref(cPointerOffset(s, 3, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) >> 6)))));
  (e = i32((e ^ 42)));
  (e = i32((e >> (cDeref(cPointerOffset(__static_ImTextCharFromUtf8_shifte, len, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))));
  if (Boolean(e)) {
    (wanted = i32(ImMin(wanted, i32((i32((i32((i32((!(!Boolean((cDeref(cPointerOffset(s, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value))))) + i32((!(!Boolean((cDeref(cPointerOffset(s, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value))))))) + i32((!(!Boolean((cDeref(cPointerOffset(s, 2, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value))))))) + i32((!(!Boolean((cDeref(cPointerOffset(s, 3, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value))))))))));
    ((cDeref(out_char, Uint32Array).value) = u32(65533));
  }
  return i32(wanted);
}

// C/C++ source: source/imgui/src/imgui.cpp:2605
export function ImTextStrFromUtf8(buf, buf_size, in_text, in_text_end, in_text_remaining) {
  let buf_out = buf;
  let buf_end = cPointerOffset(buf, buf_size, Uint16Array.BYTES_PER_ELEMENT);
  while (((cPointerCompare(buf_out, cPointerOffset(buf_end, -(1), Uint16Array.BYTES_PER_ELEMENT), "<") && ((!in_text_end) || cPointerCompare(in_text, in_text_end, "<"))) && Boolean((cDeref(in_text, Uint8Array).value)))) {
    let c;
    (in_text = cPointerOffset(in_text, ImTextCharFromUtf8(cRef(() => c, __cxx_lvalue_0 => { c = __cxx_lvalue_0; }), in_text, in_text_end), Uint8Array.BYTES_PER_ELEMENT));
    ((cDeref(((__cxx_lvalue_1) => { const previous = __cxx_lvalue_1.value; const next = cPointerOffset(previous, 1, Uint16Array.BYTES_PER_ELEMENT); __cxx_lvalue_1.value = next; return previous; })(cRef(() => buf_out, __cxx_lvalue_2 => { buf_out = __cxx_lvalue_2; })), Uint16Array).value) = ((((((c) & 65535)) & 65535)) & 65535));
  }
  ((cDeref(buf_out, Uint16Array).value) = ((((0) & 65535)) & 65535));
  if (in_text_remaining) {
    ((cPointerElementRef(in_text_remaining, 0).value) = in_text);
  }
  return i32(cPointerDiff(buf_out, buf, Uint16Array.BYTES_PER_ELEMENT));
}

// C/C++ source: source/imgui/src/imgui.cpp:2621
export function ImTextCountCharsFromUtf8(in_text, in_text_end) {
  let char_count = i32(0);
  while ((((!in_text_end) || cPointerCompare(in_text, in_text_end, "<")) && Boolean((cDeref(in_text, Uint8Array).value)))) {
    let c;
    (in_text = cPointerOffset(in_text, ImTextCharFromUtf8(cRef(() => c, __cxx_lvalue_0 => { c = __cxx_lvalue_0; }), in_text, in_text_end), Uint8Array.BYTES_PER_ELEMENT));
    ((__cxx_lvalue_1) => { const previous = __cxx_lvalue_1.value; const next = i32((previous + 1)); __cxx_lvalue_1.value = next; return previous; })(cRef(() => char_count, __cxx_lvalue_2 => { char_count = __cxx_lvalue_2; }));
  }
  return i32(char_count);
}

// C/C++ source: source/imgui/src/imgui.cpp:2634
export function ImTextCharToUtf8_inline(buf, buf_size, c) {
  if ((c < u32(128))) {
    ((cDeref(cPointerOffset(buf, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = ((((((c) & 255)) & 255)) & 255));
    return i32(1);
  }
  if ((c < u32(2048))) {
    if ((buf_size < 2)) {
      return i32(0);
    }
    ((cDeref(cPointerOffset(buf, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = ((((((u32((u32(192) + (c >>> 6)))) & 255)) & 255)) & 255));
    ((cDeref(cPointerOffset(buf, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = ((((((u32((u32(128) + u32((c & u32(63)))))) & 255)) & 255)) & 255));
    return i32(2);
  }
  if ((c < u32(65536))) {
    if ((buf_size < 3)) {
      return i32(0);
    }
    ((cDeref(cPointerOffset(buf, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = ((((((u32((u32(224) + (c >>> 12)))) & 255)) & 255)) & 255));
    ((cDeref(cPointerOffset(buf, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = ((((((u32((u32(128) + u32(((c >>> 6) & u32(63)))))) & 255)) & 255)) & 255));
    ((cDeref(cPointerOffset(buf, 2, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = ((((((u32((u32(128) + u32((c & u32(63)))))) & 255)) & 255)) & 255));
    return i32(3);
  }
  if ((c <= u32(1114111))) {
    if ((buf_size < 4)) {
      return i32(0);
    }
    ((cDeref(cPointerOffset(buf, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = ((((((u32((u32(240) + (c >>> 18)))) & 255)) & 255)) & 255));
    ((cDeref(cPointerOffset(buf, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = ((((((u32((u32(128) + u32(((c >>> 12) & u32(63)))))) & 255)) & 255)) & 255));
    ((cDeref(cPointerOffset(buf, 2, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = ((((((u32((u32(128) + u32(((c >>> 6) & u32(63)))))) & 255)) & 255)) & 255));
    ((cDeref(cPointerOffset(buf, 3, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = ((((((u32((u32(128) + u32((c & u32(63)))))) & 255)) & 255)) & 255));
    return i32(4);
  }
  return i32(0);
}

// C/C++ source: source/imgui/src/imgui.cpp:2669
export function ImTextCharToUtf8(out_buf, c) {
  let count = i32(ImTextCharToUtf8_inline(out_buf, 5, c));
  ((cDeref(cPointerOffset(out_buf, count, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = ((((0) & 255)) & 255));
  return i32(count);
}

// C/C++ source: source/imgui/src/imgui.cpp:2677
export function ImTextCountUtf8BytesFromChar__cxx_07e2af7dfb7c(in_text, in_text_end) {
  let unused = u32(0);
  return i32(ImTextCharFromUtf8(cRef(() => unused, __cxx_lvalue_0 => { unused = __cxx_lvalue_0; }), in_text, in_text_end));
}

// C/C++ source: source/imgui/src/imgui.cpp:2683
export function ImTextCountUtf8BytesFromChar__cxx_6016eefb84ea(c) {
  if ((c < u32(128))) {
    return i32(1);
  }
  if ((c < u32(2048))) {
    return i32(2);
  }
  if ((c < u32(65536))) {
    return i32(3);
  }
  if ((c <= u32(1114111))) {
    return i32(4);
  }
  return i32(3);
}

// C/C++ source: source/imgui/src/imgui.cpp:2692
export function ImTextStrToUtf8(out_buf, out_buf_size, in_text, in_text_end) {
  let buf_p = out_buf;
  let buf_end = cPointerOffset(out_buf, out_buf_size, Uint8Array.BYTES_PER_ELEMENT);
  while (((cPointerCompare(buf_p, cPointerOffset(buf_end, -(1), Uint8Array.BYTES_PER_ELEMENT), "<") && ((!in_text_end) || cPointerCompare(in_text, in_text_end, "<"))) && Boolean((cDeref(in_text, Uint16Array).value)))) {
    let c = u32((cDeref(((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = cPointerOffset(previous, 1, Uint16Array.BYTES_PER_ELEMENT); __cxx_lvalue_0.value = next; return previous; })(cRef(() => in_text, __cxx_lvalue_1 => { in_text = __cxx_lvalue_1; })), Uint16Array).value));
    if ((c < u32(128))) {
      ((cDeref(((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_2.value = next; return previous; })(cRef(() => buf_p, __cxx_lvalue_3 => { buf_p = __cxx_lvalue_3; })), Uint8Array).value) = ((((((c) & 255)) & 255)) & 255));
    } else {
      (buf_p = cPointerOffset(buf_p, ImTextCharToUtf8_inline(buf_p, i32((BigInt(cPointerDiff(buf_end, buf_p, Uint8Array.BYTES_PER_ELEMENT)) - BigInt(i64(1)))), c), Uint8Array.BYTES_PER_ELEMENT));
    }
  }
  ((cDeref(buf_p, Uint8Array).value) = ((((0) & 255)) & 255));
  return i32(cPointerDiff(buf_p, out_buf, Uint8Array.BYTES_PER_ELEMENT));
}

// C/C++ source: source/imgui/src/imgui.cpp:2708
export function ImTextCountUtf8BytesFromStr(in_text, in_text_end) {
  let bytes_count = i32(0);
  while ((((!in_text_end) || cPointerCompare(in_text, in_text_end, "<")) && Boolean((cDeref(in_text, Uint16Array).value)))) {
    let c = u32((cDeref(((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = cPointerOffset(previous, 1, Uint16Array.BYTES_PER_ELEMENT); __cxx_lvalue_0.value = next; return previous; })(cRef(() => in_text, __cxx_lvalue_1 => { in_text = __cxx_lvalue_1; })), Uint16Array).value));
    if ((c < u32(128))) {
      ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i32((previous + 1)); __cxx_lvalue_2.value = next; return previous; })(cRef(() => bytes_count, __cxx_lvalue_3 => { bytes_count = __cxx_lvalue_3; }));
    } else {
      (bytes_count = i32((Number(bytes_count) + Number(ImTextCountUtf8BytesFromChar__cxx_6016eefb84ea(c)))));
    }
  }
  return i32(bytes_count);
}

// C/C++ source: source/imgui/src/imgui.cpp:2722
export function ImTextFindPreviousUtf8Codepoint(in_text_start, in_p) {
  while (cPointerCompare(in_p, in_text_start, ">")) {
    ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = cPointerOffset(previous, -1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_0.value = next; return previous; })(cRef(() => in_p, __cxx_lvalue_1 => { in_p = __cxx_lvalue_1; }));
    if ((i32((i32((cDeref(in_p, Uint8Array).value)) & 192)) != 128)) {
      return in_p;
    }
  }
  return in_text_start;
}

// C/C++ source: source/imgui/src/imgui.cpp:2733
export function ImTextFindValidUtf8CodepointEnd(in_text_start, in_text_end, in_p) {
  if (cPointerCompare(in_text_start, in_p, "==")) {
    return in_text_start;
  }
  let prev = ImTextFindPreviousUtf8Codepoint(in_text_start, in_p);
  let prev_c;
  let prev_c_len = i32(ImTextCharFromUtf8(cRef(() => prev_c, __cxx_lvalue_0 => { prev_c = __cxx_lvalue_0; }), prev, in_text_end));
  if (((prev_c != u32(65533)) && (prev_c_len <= i32(cPointerDiff(in_p, prev, Uint8Array.BYTES_PER_ELEMENT))))) {
    return in_p;
  }
  return prev;
}

// C/C++ source: source/imgui/src/imgui.cpp:2775
export function ColorConvertU32ToFloat4(__cxx_in) {
  let s = Math.fround(Math.fround((Math.fround(1) / Math.fround(255))));
  return cCopyTrivialClass((ImVec4()).__cxx_construct_33e919b602ff0017(Math.fround((Math.fround(u32(((__cxx_in >>> 0) & u32(255)))) * s)), Math.fround((Math.fround(u32(((__cxx_in >>> 8) & u32(255)))) * s)), Math.fround((Math.fround(u32(((__cxx_in >>> 16) & u32(255)))) * s)), Math.fround((Math.fround(u32(((__cxx_in >>> 24) & u32(255)))) * s))), ImVec4(), ["x", "y", "z", "w"]);
}

// C/C++ source: source/imgui/src/imgui.cpp:2785
export function ColorConvertFloat4ToU32(__cxx_in) {
  let out;
  (out = u32((u32(i32(Math.fround((Math.fround((ImSaturate(__cxx_in.x) * Math.fround(255))) + Math.fround(0.5))))) << 0)));
  (out = u32((out | u32((u32(i32(Math.fround((Math.fround((ImSaturate(__cxx_in.y) * Math.fround(255))) + Math.fround(0.5))))) << 8)))));
  (out = u32((out | u32((u32(i32(Math.fround((Math.fround((ImSaturate(__cxx_in.z) * Math.fround(255))) + Math.fround(0.5))))) << 16)))));
  (out = u32((out | u32((u32(i32(Math.fround((Math.fround((ImSaturate(__cxx_in.w) * Math.fround(255))) + Math.fround(0.5))))) << 24)))));
  return out;
}

// C/C++ source: source/imgui/src/imgui.cpp:2852
export function ImLowerBound(in_begin, in_end, key) {
  let in_p = in_begin;
  for (let count = u64(cPointerDiff(in_end, in_p, 16)); (count > u64(0)); ) {
    let count2 = u64((BigInt(count) >> BigInt(1)));
    let mid = cPointerOffset(in_p, count2, 16);
    if ((cRecordObject(mid).key < key)) {
      (in_p = ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = cPointerOffset(previous, 1, 16); __cxx_lvalue_0.value = next; return next; })(cRef(() => mid, __cxx_lvalue_1 => { mid = __cxx_lvalue_1; })));
      (count = u64((BigInt(count) - BigInt((BigInt(count2) + BigInt(u64(1)))))));
    } else {
      (count = u64(count2));
    }
  }
  return in_p;
}

// C/C++ source: source/imgui/src/imgui.cpp:2873
export function PairComparerByID(lhs, rhs) {
  let lhs_v = u32(cRecordObject(lhs).key);
  let rhs_v = u32(cRecordObject(rhs).key);
  return i32(((lhs_v > rhs_v) ? (+1) : ((lhs_v < rhs_v) ? (-1) : 0)));
}

// C/C++ source: source/imgui/src/imgui.cpp:3097
export let EmptyString = new Uint8Array([((0) & 255)]);
function __cxx_static_address_1b7c80730f2c32599c35927e() {
  return __cxx_static_address_1b7c80730f2c32599c35927e.reference || (__cxx_static_address_1b7c80730f2c32599c35927e.reference = {
    __cReference: true,
    get value() { return EmptyString; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/imgui/src/imgui.cpp:3174
export function GetSkipItemForListClipping() {
  let g = cRecordObject(GImGui);
  return Boolean((g.CurrentTable ? cRecordObject(g.CurrentTable).HostSkipItems : cRecordObject(g.CurrentWindow).SkipItems));
}

// C/C++ source: source/imgui/src/imgui.cpp:3496
export function CalcClipRectVisibleItemsY(clip_rect, pos, items_height, out_visible_start, out_visible_end) {
  ((cDeref(out_visible_start, Int32Array).value) = i32(ImMax(i32(Math.fround((Math.fround((clip_rect.Min.y - pos.y)) / items_height))), 0)));
  ((cDeref(out_visible_end, Int32Array).value) = i32(ImMax(i32(ceilf(Math.fround((Math.fround((clip_rect.Max.y - pos.y)) / items_height)))), (cDeref(out_visible_start, Int32Array).value))));
}

// C/C++ source: source/imgui/src/imgui.cpp:3506
export function GetStyle() {
  0;
  return cRecordObject(GImGui).Style;
}

// C/C++ source: source/imgui/src/imgui.cpp:3512
export function GetColorU32__cxx_b10e13290aef(idx, alpha_mul) {
  let style = cRecordObject(GImGui).Style;
  let c = cCopyTrivialClass((cPointerElementRef(style.Colors, idx).value), ImVec4(), ["x", "y", "z", "w"]);
  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = Math.fround((__cxx_lvalue_0.value * Math.fround((style.Alpha * alpha_mul))))))(cObjectFieldRef(c, "w"));
  return ColorConvertFloat4ToU32(c);
}

// C/C++ source: source/imgui/src/imgui.cpp:3520
export function GetColorU32__cxx_4793352a9325(col) {
  let style = cRecordObject(GImGui).Style;
  let c = cCopyTrivialClass(col, ImVec4(), ["x", "y", "z", "w"]);
  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = Math.fround((__cxx_lvalue_0.value * style.Alpha))))(cObjectFieldRef(c, "w"));
  return ColorConvertFloat4ToU32(c);
}

// C/C++ source: source/imgui/src/imgui.cpp:3528
export function GetStyleColorVec4(idx) {
  let style = cRecordObject(GImGui).Style;
  return (cPointerElementRef(style.Colors, idx).value);
}

// C/C++ source: source/imgui/src/imgui.cpp:3534
export function GetColorU32__cxx_d58dac9205a7(col, alpha_mul) {
  let style = cRecordObject(GImGui).Style;
  (alpha_mul = Math.fround((alpha_mul * style.Alpha)));
  if ((alpha_mul >= Math.fround(1))) {
    return col;
  }
  let a = u32((u32((col & 4278190080)) >>> 24));
  (a = u32(Math.fround((Math.fround(a) * alpha_mul))));
  return u32((u32((col & (~4278190080))) | u32((a << 24))));
}

// C/C++ source: source/imgui/src/imgui.cpp:3697
const __cxx_literal_6b7e48d258cf77571cd7 = Uint8Array.from([84, 101, 120, 116, 0]);
const __cxx_literal_cbf95d9a4a503e807df9 = Uint8Array.from([84, 101, 120, 116, 68, 105, 115, 97, 98, 108, 101, 100, 0]);
const __cxx_literal_5f9f09cbc4ee172938e6 = Uint8Array.from([87, 105, 110, 100, 111, 119, 66, 103, 0]);
const __cxx_literal_90392ec643456bce3f2c = Uint8Array.from([67, 104, 105, 108, 100, 66, 103, 0]);
const __cxx_literal_d31c7a9b5c731ace0e27 = Uint8Array.from([80, 111, 112, 117, 112, 66, 103, 0]);
const __cxx_literal_dad56063d3466256cc61 = Uint8Array.from([66, 111, 114, 100, 101, 114, 0]);
const __cxx_literal_82577b6ea67e01d7de0e = Uint8Array.from([66, 111, 114, 100, 101, 114, 83, 104, 97, 100, 111, 119, 0]);
const __cxx_literal_4ae9d58e024f3fd84fd4 = Uint8Array.from([70, 114, 97, 109, 101, 66, 103, 0]);
const __cxx_literal_78f43ce741245b2fb209 = Uint8Array.from([70, 114, 97, 109, 101, 66, 103, 72, 111, 118, 101, 114, 101, 100, 0]);
const __cxx_literal_f32be11e2a8567c7dd3f = Uint8Array.from([70, 114, 97, 109, 101, 66, 103, 65, 99, 116, 105, 118, 101, 0]);
const __cxx_literal_8e6af8c006418314ad68 = Uint8Array.from([84, 105, 116, 108, 101, 66, 103, 0]);
const __cxx_literal_ca6c758de8878860d891 = Uint8Array.from([84, 105, 116, 108, 101, 66, 103, 65, 99, 116, 105, 118, 101, 0]);
const __cxx_literal_ef80260c5e4c34f698d2 = Uint8Array.from([84, 105, 116, 108, 101, 66, 103, 67, 111, 108, 108, 97, 112, 115, 101, 100, 0]);
const __cxx_literal_73928279188405f7eded = Uint8Array.from([77, 101, 110, 117, 66, 97, 114, 66, 103, 0]);
const __cxx_literal_85e895591d0f0c719507 = Uint8Array.from([83, 99, 114, 111, 108, 108, 98, 97, 114, 66, 103, 0]);
const __cxx_literal_36e673907cac77bbe686 = Uint8Array.from([83, 99, 114, 111, 108, 108, 98, 97, 114, 71, 114, 97, 98, 0]);
const __cxx_literal_e044550f9a4e253f4308 = Uint8Array.from([83, 99, 114, 111, 108, 108, 98, 97, 114, 71, 114, 97, 98, 72, 111, 118, 101, 114, 101, 100, 0]);
const __cxx_literal_29523430e0bed59459a6 = Uint8Array.from([83, 99, 114, 111, 108, 108, 98, 97, 114, 71, 114, 97, 98, 65, 99, 116, 105, 118, 101, 0]);
const __cxx_literal_93bea6aa022867bd418f = Uint8Array.from([67, 104, 101, 99, 107, 77, 97, 114, 107, 0]);
const __cxx_literal_187032583498c49f28b6 = Uint8Array.from([83, 108, 105, 100, 101, 114, 71, 114, 97, 98, 0]);
const __cxx_literal_24218a800b9352285ada = Uint8Array.from([83, 108, 105, 100, 101, 114, 71, 114, 97, 98, 65, 99, 116, 105, 118, 101, 0]);
const __cxx_literal_9337fbc9b20375ef3acf = Uint8Array.from([66, 117, 116, 116, 111, 110, 0]);
const __cxx_literal_dc66cc5675503be8828e = Uint8Array.from([66, 117, 116, 116, 111, 110, 72, 111, 118, 101, 114, 101, 100, 0]);
const __cxx_literal_da25820608527642ef05 = Uint8Array.from([66, 117, 116, 116, 111, 110, 65, 99, 116, 105, 118, 101, 0]);
const __cxx_literal_77d92b15ff31f2e49ea2 = Uint8Array.from([72, 101, 97, 100, 101, 114, 0]);
const __cxx_literal_4bc774d3a3cd8dce2ee0 = Uint8Array.from([72, 101, 97, 100, 101, 114, 72, 111, 118, 101, 114, 101, 100, 0]);
const __cxx_literal_d0822a0df66c5802fa09 = Uint8Array.from([72, 101, 97, 100, 101, 114, 65, 99, 116, 105, 118, 101, 0]);
const __cxx_literal_d87f01f5795c33d903fc = Uint8Array.from([83, 101, 112, 97, 114, 97, 116, 111, 114, 0]);
const __cxx_literal_6c94fba9008971daa712 = Uint8Array.from([83, 101, 112, 97, 114, 97, 116, 111, 114, 72, 111, 118, 101, 114, 101, 100, 0]);
const __cxx_literal_3399aeed94e02b24b9be = Uint8Array.from([83, 101, 112, 97, 114, 97, 116, 111, 114, 65, 99, 116, 105, 118, 101, 0]);
const __cxx_literal_8e57d3cc31c2f7bc3ab4 = Uint8Array.from([82, 101, 115, 105, 122, 101, 71, 114, 105, 112, 0]);
const __cxx_literal_07d0ca71db77daf57a92 = Uint8Array.from([82, 101, 115, 105, 122, 101, 71, 114, 105, 112, 72, 111, 118, 101, 114, 101, 100, 0]);
const __cxx_literal_69e525aa34be6d4c5eab = Uint8Array.from([82, 101, 115, 105, 122, 101, 71, 114, 105, 112, 65, 99, 116, 105, 118, 101, 0]);
const __cxx_literal_55443fd2e6c50773e703 = Uint8Array.from([73, 110, 112, 117, 116, 84, 101, 120, 116, 67, 117, 114, 115, 111, 114, 0]);
const __cxx_literal_03b232eca85828458d30 = Uint8Array.from([84, 97, 98, 72, 111, 118, 101, 114, 101, 100, 0]);
const __cxx_literal_bac20b9176a88b09acf2 = Uint8Array.from([84, 97, 98, 0]);
const __cxx_literal_a2d499403894e1902b08 = Uint8Array.from([84, 97, 98, 83, 101, 108, 101, 99, 116, 101, 100, 0]);
const __cxx_literal_6d302dc1cb6dc262c9d0 = Uint8Array.from([84, 97, 98, 83, 101, 108, 101, 99, 116, 101, 100, 79, 118, 101, 114, 108, 105, 110, 101, 0]);
const __cxx_literal_8a72a2dcbce4613d815d = Uint8Array.from([84, 97, 98, 68, 105, 109, 109, 101, 100, 0]);
const __cxx_literal_8f7d70197c7680c9f643 = Uint8Array.from([84, 97, 98, 68, 105, 109, 109, 101, 100, 83, 101, 108, 101, 99, 116, 101, 100, 0]);
const __cxx_literal_11b94d120bde02951b50 = Uint8Array.from([84, 97, 98, 68, 105, 109, 109, 101, 100, 83, 101, 108, 101, 99, 116, 101, 100, 79, 118, 101, 114, 108, 105, 110, 101, 0]);
const __cxx_literal_f4c76a909ad5a82f1fb7 = Uint8Array.from([80, 108, 111, 116, 76, 105, 110, 101, 115, 0]);
const __cxx_literal_699f250e7c5338d708e3 = Uint8Array.from([80, 108, 111, 116, 76, 105, 110, 101, 115, 72, 111, 118, 101, 114, 101, 100, 0]);
const __cxx_literal_af69386a16267bf595b3 = Uint8Array.from([80, 108, 111, 116, 72, 105, 115, 116, 111, 103, 114, 97, 109, 0]);
const __cxx_literal_a20566c19b5b55b95b3e = Uint8Array.from([80, 108, 111, 116, 72, 105, 115, 116, 111, 103, 114, 97, 109, 72, 111, 118, 101, 114, 101, 100, 0]);
const __cxx_literal_80e879991e9864ef5c44 = Uint8Array.from([84, 97, 98, 108, 101, 72, 101, 97, 100, 101, 114, 66, 103, 0]);
const __cxx_literal_98626521e6d93362e4f2 = Uint8Array.from([84, 97, 98, 108, 101, 66, 111, 114, 100, 101, 114, 83, 116, 114, 111, 110, 103, 0]);
const __cxx_literal_f1506b7abe5ca6064f0b = Uint8Array.from([84, 97, 98, 108, 101, 66, 111, 114, 100, 101, 114, 76, 105, 103, 104, 116, 0]);
const __cxx_literal_1cc71aa60a108c6b1e5b = Uint8Array.from([84, 97, 98, 108, 101, 82, 111, 119, 66, 103, 0]);
const __cxx_literal_75d7d7a4e30e115c7f22 = Uint8Array.from([84, 97, 98, 108, 101, 82, 111, 119, 66, 103, 65, 108, 116, 0]);
const __cxx_literal_754d96a8ddaf4e7c0b9c = Uint8Array.from([84, 101, 120, 116, 76, 105, 110, 107, 0]);
const __cxx_literal_2a239b9e0165c6bb87f4 = Uint8Array.from([84, 101, 120, 116, 83, 101, 108, 101, 99, 116, 101, 100, 66, 103, 0]);
const __cxx_literal_c71455fd893764fd795d = Uint8Array.from([84, 114, 101, 101, 76, 105, 110, 101, 115, 0]);
const __cxx_literal_383af4a614964c97f436 = Uint8Array.from([68, 114, 97, 103, 68, 114, 111, 112, 84, 97, 114, 103, 101, 116, 0]);
const __cxx_literal_ca9ac1639e0c9bca5a93 = Uint8Array.from([68, 114, 97, 103, 68, 114, 111, 112, 84, 97, 114, 103, 101, 116, 66, 103, 0]);
const __cxx_literal_5b502954a4433b10f2ae = Uint8Array.from([85, 110, 115, 97, 118, 101, 100, 77, 97, 114, 107, 101, 114, 0]);
const __cxx_literal_6e686f78d20b4aa5026c = Uint8Array.from([78, 97, 118, 67, 117, 114, 115, 111, 114, 0]);
const __cxx_literal_2613e73d3fb657d920a2 = Uint8Array.from([78, 97, 118, 87, 105, 110, 100, 111, 119, 105, 110, 103, 72, 105, 103, 104, 108, 105, 103, 104, 116, 0]);
const __cxx_literal_edf1cd417d34d5f7109c = Uint8Array.from([78, 97, 118, 87, 105, 110, 100, 111, 119, 105, 110, 103, 68, 105, 109, 66, 103, 0]);
const __cxx_literal_4eac05c53db20ed7e804 = Uint8Array.from([77, 111, 100, 97, 108, 87, 105, 110, 100, 111, 119, 68, 105, 109, 66, 103, 0]);
const __cxx_literal_0828c78f409b7c934751 = Uint8Array.from([85, 110, 107, 110, 111, 119, 110, 0]);
export function GetStyleColorName(idx) {
  switch (idx) {
    case i32(0): {
      return __cxx_literal_6b7e48d258cf77571cd7;
    }
    case i32(1): {
      return __cxx_literal_cbf95d9a4a503e807df9;
    }
    case i32(2): {
      return __cxx_literal_5f9f09cbc4ee172938e6;
    }
    case i32(3): {
      return __cxx_literal_90392ec643456bce3f2c;
    }
    case i32(4): {
      return __cxx_literal_d31c7a9b5c731ace0e27;
    }
    case i32(5): {
      return __cxx_literal_dad56063d3466256cc61;
    }
    case i32(6): {
      return __cxx_literal_82577b6ea67e01d7de0e;
    }
    case i32(7): {
      return __cxx_literal_4ae9d58e024f3fd84fd4;
    }
    case i32(8): {
      return __cxx_literal_78f43ce741245b2fb209;
    }
    case i32(9): {
      return __cxx_literal_f32be11e2a8567c7dd3f;
    }
    case i32(10): {
      return __cxx_literal_8e6af8c006418314ad68;
    }
    case i32(11): {
      return __cxx_literal_ca6c758de8878860d891;
    }
    case i32(12): {
      return __cxx_literal_ef80260c5e4c34f698d2;
    }
    case i32(13): {
      return __cxx_literal_73928279188405f7eded;
    }
    case i32(14): {
      return __cxx_literal_85e895591d0f0c719507;
    }
    case i32(15): {
      return __cxx_literal_36e673907cac77bbe686;
    }
    case i32(16): {
      return __cxx_literal_e044550f9a4e253f4308;
    }
    case i32(17): {
      return __cxx_literal_29523430e0bed59459a6;
    }
    case i32(18): {
      return __cxx_literal_93bea6aa022867bd418f;
    }
    case i32(19): {
      return __cxx_literal_187032583498c49f28b6;
    }
    case i32(20): {
      return __cxx_literal_24218a800b9352285ada;
    }
    case i32(21): {
      return __cxx_literal_9337fbc9b20375ef3acf;
    }
    case i32(22): {
      return __cxx_literal_dc66cc5675503be8828e;
    }
    case i32(23): {
      return __cxx_literal_da25820608527642ef05;
    }
    case i32(24): {
      return __cxx_literal_77d92b15ff31f2e49ea2;
    }
    case i32(25): {
      return __cxx_literal_4bc774d3a3cd8dce2ee0;
    }
    case i32(26): {
      return __cxx_literal_d0822a0df66c5802fa09;
    }
    case i32(27): {
      return __cxx_literal_d87f01f5795c33d903fc;
    }
    case i32(28): {
      return __cxx_literal_6c94fba9008971daa712;
    }
    case i32(29): {
      return __cxx_literal_3399aeed94e02b24b9be;
    }
    case i32(30): {
      return __cxx_literal_8e57d3cc31c2f7bc3ab4;
    }
    case i32(31): {
      return __cxx_literal_07d0ca71db77daf57a92;
    }
    case i32(32): {
      return __cxx_literal_69e525aa34be6d4c5eab;
    }
    case i32(33): {
      return __cxx_literal_55443fd2e6c50773e703;
    }
    case i32(34): {
      return __cxx_literal_03b232eca85828458d30;
    }
    case i32(35): {
      return __cxx_literal_bac20b9176a88b09acf2;
    }
    case i32(36): {
      return __cxx_literal_a2d499403894e1902b08;
    }
    case i32(37): {
      return __cxx_literal_6d302dc1cb6dc262c9d0;
    }
    case i32(38): {
      return __cxx_literal_8a72a2dcbce4613d815d;
    }
    case i32(39): {
      return __cxx_literal_8f7d70197c7680c9f643;
    }
    case i32(40): {
      return __cxx_literal_11b94d120bde02951b50;
    }
    case i32(41): {
      return __cxx_literal_f4c76a909ad5a82f1fb7;
    }
    case i32(42): {
      return __cxx_literal_699f250e7c5338d708e3;
    }
    case i32(43): {
      return __cxx_literal_af69386a16267bf595b3;
    }
    case i32(44): {
      return __cxx_literal_a20566c19b5b55b95b3e;
    }
    case i32(45): {
      return __cxx_literal_80e879991e9864ef5c44;
    }
    case i32(46): {
      return __cxx_literal_98626521e6d93362e4f2;
    }
    case i32(47): {
      return __cxx_literal_f1506b7abe5ca6064f0b;
    }
    case i32(48): {
      return __cxx_literal_1cc71aa60a108c6b1e5b;
    }
    case i32(49): {
      return __cxx_literal_75d7d7a4e30e115c7f22;
    }
    case i32(50): {
      return __cxx_literal_754d96a8ddaf4e7c0b9c;
    }
    case i32(51): {
      return __cxx_literal_2a239b9e0165c6bb87f4;
    }
    case i32(52): {
      return __cxx_literal_c71455fd893764fd795d;
    }
    case i32(53): {
      return __cxx_literal_383af4a614964c97f436;
    }
    case i32(54): {
      return __cxx_literal_ca9ac1639e0c9bca5a93;
    }
    case i32(55): {
      return __cxx_literal_5b502954a4433b10f2ae;
    }
    case i32(56): {
      return __cxx_literal_6e686f78d20b4aa5026c;
    }
    case i32(57): {
      return __cxx_literal_2613e73d3fb657d920a2;
    }
    case i32(58): {
      return __cxx_literal_edf1cd417d34d5f7109c;
    }
    case i32(59): {
      return __cxx_literal_4eac05c53db20ed7e804;
    }
  }
  0;
  return __cxx_literal_0828c78f409b7c934751;
}

// C/C++ source: source/imgui/src/imgui.cpp:3774
export function FindRenderedTextEnd(text, text_end) {
  let text_display_end = text;
  if ((!text_end)) {
    (text_end = cTypedPointer((-1), Uint8Array));
  }
  while (((cPointerCompare(text_display_end, text_end, "<") && (i32((cDeref(text_display_end, Uint8Array).value)) != i32(0))) && ((i32((cDeref(cPointerOffset(text_display_end, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) != i32(35)) || (i32((cDeref(cPointerOffset(text_display_end, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) != i32(35))))) {
    ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_0.value = next; return previous; })(cRef(() => text_display_end, __cxx_lvalue_1 => { text_display_end = __cxx_lvalue_1; }));
  }
  return text_display_end;
}

// C/C++ source: source/imgui/src/imgui.cpp:3834
export function RenderTextClippedEx(draw_list, pos_min, pos_max, text, text_display_end, text_size_if_known, align, clip_rect) {
  let pos = cCopyTrivialClass(pos_min, ImVec2(), ["x", "y"]);
  let text_size = cCopyTrivialClass((text_size_if_known ? cCopyTrivialClass(cRecordObject(text_size_if_known), ImVec2(), ["x", "y"]) : cCopyTrivialClass(cCopyTrivialClass(CalcTextSize(text, text_display_end, false, Math.fround(0)), ImVec2(), ["x", "y"]), ImVec2(), ["x", "y"])), ImVec2(), ["x", "y"]);
  let clip_min = (clip_rect ? cObjectFieldRef(cRecordObject(clip_rect), "Min") : cRef(() => pos_min, __cxx_lvalue_0 => { pos_min = __cxx_lvalue_0; }));
  let clip_max = (clip_rect ? cObjectFieldRef(cRecordObject(clip_rect), "Max") : cRef(() => pos_max, __cxx_lvalue_1 => { pos_max = __cxx_lvalue_1; }));
  let need_clipping = Boolean(((Math.fround((pos.x + text_size.x)) >= cRecordObject(clip_max).x) || (Math.fround((pos.y + text_size.y)) >= cRecordObject(clip_max).y)));
  if (clip_rect) {
    (need_clipping = Boolean((need_clipping | i32(((pos.x < cRecordObject(clip_min).x) || (pos.y < cRecordObject(clip_min).y))))));
  }
  if ((align.x > Math.fround(0))) {
    (pos.x = Math.fround(ImMax(pos.x, Math.fround((pos.x + Math.fround((Math.fround((Math.fround((pos_max.x - pos.x)) - text_size.x)) * align.x)))))));
  }
  if ((align.y > Math.fround(0))) {
    (pos.y = Math.fround(ImMax(pos.y, Math.fround((pos.y + Math.fround((Math.fround((Math.fround((pos_max.y - pos.y)) - text_size.y)) * align.y)))))));
  }
  if (need_clipping) {
    let fine_clip_rect = (ImVec4()).__cxx_construct_33e919b602ff0017(cRecordObject(clip_min).x, cRecordObject(clip_min).y, cRecordObject(clip_max).x, cRecordObject(clip_max).y);
    cRecordObject(draw_list).AddText(null, Math.fround(0), pos, GetColorU32__cxx_b10e13290aef(i32(0), Math.fround(1)), text, text_display_end, Math.fround(0), cRef(() => fine_clip_rect, __cxx_lvalue_2 => { fine_clip_rect = __cxx_lvalue_2; }));
  } else {
    cRecordObject(draw_list).AddText(null, Math.fround(0), pos, GetColorU32__cxx_b10e13290aef(i32(0), Math.fround(1)), text, text_display_end, Math.fround(0), null);
  }
}

// C/C++ source: source/imgui/src/imgui.cpp:4040
export function GetCurrentContext() {
  return GImGui;
}

// C/C++ source: source/imgui/src/imgui.cpp:4045
export function SetCurrentContext(ctx) {
  (GImGui = ctx);
}

// C/C++ source: source/imgui/src/imgui.cpp:4092
export const GLocalizationEntriesEnUS = cByteRecordNDArray({"align": 8, "arrayAlign": 1, "fields": {"Key": {"native": "Int32Array", "offset": 0, "size": 4}, "Text": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 16, "union": false}, [10], {}, [cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"Key": {"native": "Int32Array", "offset": 0, "size": 4}, "Text": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 16, "union": false}, {"Key": 0, "Text": Uint8Array.from([68, 101, 97, 114, 32, 73, 109, 71, 117, 105, 32, 49, 46, 57, 50, 46, 54, 32, 87, 73, 80, 32, 40, 49, 57, 50, 53, 57, 41, 0])}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"Key": {"native": "Int32Array", "offset": 0, "size": 4}, "Text": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 16, "union": false}, {"Key": 1, "Text": Uint8Array.from([83, 105, 122, 101, 32, 99, 111, 108, 117, 109, 110, 32, 116, 111, 32, 102, 105, 116, 35, 35, 35, 83, 105, 122, 101, 79, 110, 101, 0])}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"Key": {"native": "Int32Array", "offset": 0, "size": 4}, "Text": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 16, "union": false}, {"Key": 2, "Text": Uint8Array.from([83, 105, 122, 101, 32, 97, 108, 108, 32, 99, 111, 108, 117, 109, 110, 115, 32, 116, 111, 32, 102, 105, 116, 35, 35, 35, 83, 105, 122, 101, 65, 108, 108, 0])}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"Key": {"native": "Int32Array", "offset": 0, "size": 4}, "Text": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 16, "union": false}, {"Key": 3, "Text": Uint8Array.from([83, 105, 122, 101, 32, 97, 108, 108, 32, 99, 111, 108, 117, 109, 110, 115, 32, 116, 111, 32, 100, 101, 102, 97, 117, 108, 116, 35, 35, 35, 83, 105, 122, 101, 65, 108, 108, 0])}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"Key": {"native": "Int32Array", "offset": 0, "size": 4}, "Text": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 16, "union": false}, {"Key": 4, "Text": Uint8Array.from([82, 101, 115, 101, 116, 32, 111, 114, 100, 101, 114, 35, 35, 35, 82, 101, 115, 101, 116, 79, 114, 100, 101, 114, 0])}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"Key": {"native": "Int32Array", "offset": 0, "size": 4}, "Text": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 16, "union": false}, {"Key": 5, "Text": Uint8Array.from([40, 77, 97, 105, 110, 32, 109, 101, 110, 117, 32, 98, 97, 114, 41, 0])}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"Key": {"native": "Int32Array", "offset": 0, "size": 4}, "Text": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 16, "union": false}, {"Key": 6, "Text": Uint8Array.from([40, 80, 111, 112, 117, 112, 41, 0])}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"Key": {"native": "Int32Array", "offset": 0, "size": 4}, "Text": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 16, "union": false}, {"Key": 7, "Text": Uint8Array.from([40, 85, 110, 116, 105, 116, 108, 101, 100, 41, 0])}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"Key": {"native": "Int32Array", "offset": 0, "size": 4}, "Text": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 16, "union": false}, {"Key": 8, "Text": Uint8Array.from([79, 112, 101, 110, 32, 39, 37, 115, 39, 0])}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"Key": {"native": "Int32Array", "offset": 0, "size": 4}, "Text": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 16, "union": false}, {"Key": 9, "Text": Uint8Array.from([67, 111, 112, 121, 32, 76, 105, 110, 107, 35, 35, 35, 67, 111, 112, 121, 76, 105, 110, 107, 0])}, null, {})]);
function __cxx_static_address_f4e0c88c4034cbc3f41f68cb() {
  return __cxx_static_address_f4e0c88c4034cbc3f41f68cb.reference || (__cxx_static_address_f4e0c88c4034cbc3f41f68cb.reference = {
    __cReference: true,
    get value() { return GLocalizationEntriesEnUS; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/imgui/src/imgui.cpp:4488
export function SetContextName(ctx, name) {
  ImStrncpy(cRecordObject(ctx).ContextName, name, u64(i32((BigInt(16) / BigInt(1)))));
}

// C/C++ source: source/imgui/src/imgui.cpp:4494
export function AddContextHook(ctx, hook) {
  let g = cRecordObject(ctx);
  0;
  g.Hooks.push_back(cRecordObject(hook));
  (g.Hooks.back().HookId = u32(((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = u32((previous + 1)); __cxx_lvalue_0.value = next; return next; })(cObjectFieldRef(g, "HookIdNext"))));
  return g.HookIdNext;
}

// C/C++ source: source/imgui/src/imgui.cpp:4600
export function GcCompactTransientWindowBuffers(window) {
  (cRecordObject(window).MemoryCompacted = Boolean(true));
  (cRecordObject(window).MemoryDrawListIdxCapacity = i32(cRecordObject(cRecordObject(window).DrawList).IdxBuffer.Capacity));
  (cRecordObject(window).MemoryDrawListVtxCapacity = i32(cRecordObject(cRecordObject(window).DrawList).VtxBuffer.Capacity));
  cRecordObject(window).IDStack.clear();
  cRecordObject(cRecordObject(window).DrawList)._ClearFreeMemory();
  cRecordObject(window).DC.ChildWindows.clear();
  cRecordObject(window).DC.ItemWidthStack.clear();
  cRecordObject(window).DC.TextWrapPosStack.clear();
}

// C/C++ source: source/imgui/src/imgui.cpp:4612
export function GcAwakeTransientWindowBuffers(window) {
  (cRecordObject(window).MemoryCompacted = Boolean(false));
  cRecordObject(cRecordObject(window).DrawList).IdxBuffer.reserve(cRecordObject(window).MemoryDrawListIdxCapacity);
  cRecordObject(cRecordObject(window).DrawList).VtxBuffer.reserve(cRecordObject(window).MemoryDrawListVtxCapacity);
  (cRecordObject(window).MemoryDrawListIdxCapacity = i32((cRecordObject(window).MemoryDrawListVtxCapacity = i32(0))));
}

// C/C++ source: source/imgui/src/imgui.cpp:4692
export function SetHoveredID(id) {
  let g = cRecordObject(GImGui);
  (g.HoveredId = u32(id));
  (g.HoveredIdAllowOverlap = Boolean(false));
  if (((id != u32(0)) && (g.HoveredIdPreviousFrame != id))) {
    (g.HoveredIdTimer = Math.fround((g.HoveredIdNotActiveTimer = Math.fround(Math.fround(0)))));
  }
}

// C/C++ source: source/imgui/src/imgui.cpp:4701
export function GetHoveredID() {
  let g = cRecordObject(GImGui);
  return (Boolean(g.HoveredId) ? g.HoveredId : g.HoveredIdPreviousFrame);
}

// C/C++ source: source/imgui/src/imgui.cpp:4707
export function MarkItemEdited(id) {
  let g = cRecordObject(GImGui);
  if (Boolean(i32((g.LastItemData.ItemFlags & i32(65536))))) {
    return;
  }
  if (((g.ActiveId == id) || (g.ActiveId == u32(0)))) {
    (g.ActiveIdHasBeenEditedThisFrame = Boolean(true));
    (g.ActiveIdHasBeenEditedBefore = Boolean(true));
    if ((g.DeactivatedItemData.ID == id)) {
      (g.DeactivatedItemData.HasBeenEditedBefore = Boolean(true));
    }
  }
  0;
  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = i32((__cxx_lvalue_0.value | i32(4)))))(cObjectFieldRef(g.LastItemData, "StatusFlags"));
}

// C/C++ source: source/imgui/src/imgui.cpp:4757
export function CalcDelayFromHoveredFlags(flags) {
  let g = cRecordObject(GImGui);
  if (Boolean(i32((flags & i32(65536))))) {
    return Math.fround(g.Style.HoverDelayNormal);
  }
  if (Boolean(i32((flags & i32(32768))))) {
    return Math.fround(g.Style.HoverDelayShort);
  }
  return Math.fround(Math.fround(0));
}

// C/C++ source: source/imgui/src/imgui.cpp:4767
export function ApplyHoverFlagsForTooltip(user_flags, shared_flags) {
  if (Boolean(i32((user_flags & i32((i32((i32(16384) | i32(32768))) | i32(65536))))))) {
    (shared_flags = i32((shared_flags & (~i32((i32((i32(16384) | i32(32768))) | i32(65536)))))));
  }
  return i32((user_flags | shared_flags));
}

// C/C++ source: source/imgui/src/imgui.cpp:4974
export function IsClippedEx(bb, id) {
  let g = cRecordObject(GImGui);
  let window = g.CurrentWindow;
  if ((!bb.Overlaps(cRecordObject(window).ClipRect))) {
    if (((id == u32(0)) || ((((id != g.ActiveId) && (id != g.ActiveIdPreviousFrame)) && (id != g.NavId)) && (id != g.NavActivateId)))) {
      if ((!g.ItemUnclipByLog)) {
        return Boolean(true);
      }
    }
  }
  return Boolean(false);
}

// C/C++ source: source/imgui/src/imgui.cpp:5008
export function CalcWrapWidthForPos(pos, wrap_pos_x) {
  if ((wrap_pos_x < Math.fround(0))) {
    return Math.fround(Math.fround(0));
  }
  let g = cRecordObject(GImGui);
  let window = g.CurrentWindow;
  if ((wrap_pos_x == Math.fround(0))) {
    (wrap_pos_x = Math.fround(cRecordObject(window).WorkRect.Max.x));
  } else {
    if ((wrap_pos_x > Math.fround(0))) {
      (wrap_pos_x = Math.fround((wrap_pos_x + Math.fround((cRecordObject(window).Pos.x - cRecordObject(window).Scroll.x)))));
    }
  }
  return Math.fround(ImMax(Math.fround((wrap_pos_x - pos.x)), Math.fround(1)));
}

// C/C++ source: source/imgui/src/imgui.cpp:5055
export function DebugAllocHook(info, frame_count, ptr, size) {
  let entry = cPointerOffset(cRecordObject(info).LastEntriesBuf, cRecordObject(info).LastEntriesIdx, 8);
  ptr;
  if ((cRecordObject(entry).FrameCount != frame_count)) {
    (cRecordObject(info).LastEntriesIdx = (((((((i32((i32(cRecordObject(info).LastEntriesIdx) + 1)) % i32((BigInt(48) / BigInt(8))))) << 16) >> 16)) << 16) >> 16));
    (entry = cPointerOffset(cRecordObject(info).LastEntriesBuf, cRecordObject(info).LastEntriesIdx, 8));
    (cRecordObject(entry).FrameCount = i32(frame_count));
    (cRecordObject(entry).AllocCount = ((((cRecordObject(entry).FreeCount = ((((((0) << 16) >> 16)) << 16) >> 16))) << 16) >> 16));
  }
  if ((size != u64((-1)))) {
    ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = ((((previous + 1)) << 16) >> 16); __cxx_lvalue_0.value = next; return previous; })(cObjectFieldRef(cRecordObject(entry), "AllocCount"));
    ((__cxx_lvalue_1) => { const previous = __cxx_lvalue_1.value; const next = i32((previous + 1)); __cxx_lvalue_1.value = next; return previous; })(cObjectFieldRef(cRecordObject(info), "TotalAllocCount"));
  } else {
    ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = ((((previous + 1)) << 16) >> 16); __cxx_lvalue_2.value = next; return previous; })(cObjectFieldRef(cRecordObject(entry), "FreeCount"));
    ((__cxx_lvalue_3) => { const previous = __cxx_lvalue_3.value; const next = i32((previous + 1)); __cxx_lvalue_3.value = next; return previous; })(cObjectFieldRef(cRecordObject(info), "TotalFreeCount"));
  }
}

// C/C++ source: source/imgui/src/imgui.cpp:5081
export function GetClipboardText() {
  let g = cRecordObject(GImGui);
  return (g.PlatformIO.Platform_GetClipboardTextFn ? g.PlatformIO.Platform_GetClipboardTextFn(cRef(() => g, __cxx_lvalue_0 => { g = __cxx_lvalue_0; })) : null);
}

// C/C++ source: source/imgui/src/imgui.cpp:5087
export function SetClipboardText(text) {
  let g = cRecordObject(GImGui);
  if (cPointerCompare(g.PlatformIO.Platform_SetClipboardTextFn, null, "!=")) {
    g.PlatformIO.Platform_SetClipboardTextFn(cRef(() => g, __cxx_lvalue_0 => { g = __cxx_lvalue_0; }), text);
  }
}

// C/C++ source: source/imgui/src/imgui.cpp:5094
const __cxx_literal_e12cb642cb0e2efa6f5c = Uint8Array.from([49, 46, 57, 50, 46, 54, 32, 87, 73, 80, 0]);
export function GetVersion() {
  return __cxx_literal_e12cb642cb0e2efa6f5c;
}

// C/C++ source: source/imgui/src/imgui.cpp:5099
export function GetIO__cxx_b070bdf58279() {
  0;
  return cRecordObject(GImGui).IO;
}

// C/C++ source: source/imgui/src/imgui.cpp:5106
export function GetIO__cxx_470c9fea8f51(ctx) {
  0;
  return cRecordObject(ctx).IO;
}

// C/C++ source: source/imgui/src/imgui.cpp:5112
export function GetPlatformIO__cxx_c6e442472715() {
  0;
  return cRecordObject(GImGui).PlatformIO;
}

// C/C++ source: source/imgui/src/imgui.cpp:5119
export function GetPlatformIO__cxx_b03203d68282(ctx) {
  0;
  return cRecordObject(ctx).PlatformIO;
}

// C/C++ source: source/imgui/src/imgui.cpp:5133
export function GetTime() {
  return cRecordObject(GImGui).Time;
}

// C/C++ source: source/imgui/src/imgui.cpp:5138
export function GetFrameCount() {
  return i32(cRecordObject(GImGui).FrameCount);
}

// C/C++ source: source/imgui/src/imgui.cpp:5189
export function GetDrawListSharedData() {
  return cObjectFieldRef(cRecordObject(GImGui), "DrawListSharedData");
}

// C/C++ source: source/imgui/src/imgui.cpp:5219
export function StopMouseMovingWindow() {
  let g = cRecordObject(GImGui);
  (g.MovingWindow = null);
}

// C/C++ source: source/imgui/src/imgui.cpp:5332
export function IsWindowActiveAndVisible(window) {
  return Boolean((cRecordObject(window).Active && (!cRecordObject(window).Hidden)));
}

// C/C++ source: source/imgui/src/imgui.cpp:5768
export function GetWindowDisplayLayer(window) {
  return i32((Boolean(i32((cRecordObject(window).Flags & i32(33554432)))) ? 1 : 0));
}

// C/C++ source: source/imgui/src/imgui.cpp:5779
export function FlattenDrawDataIntoSingleLayer(builder) {
  let n = i32(((cPointerElementRef(cRecordObject(builder).Layers, 0).value)).value.Size);
  let full_size = i32(n);
  for (let i = i32(1); (i < i32((BigInt(16) / BigInt(8)))); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; }))) {
    (full_size = i32((Number(full_size) + Number(((cPointerElementRef(cRecordObject(builder).Layers, i).value)).value.Size))));
  }
  ((cPointerElementRef(cRecordObject(builder).Layers, 0).value)).value.resize(full_size);
  for (let layer_n = i32(1); (layer_n < i32((BigInt(16) / BigInt(8)))); ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i32((previous + 1)); __cxx_lvalue_2.value = next; return previous; })(cRef(() => layer_n, __cxx_lvalue_3 => { layer_n = __cxx_lvalue_3; }))) {
    let layer = (cPointerElementRef(cRecordObject(builder).Layers, layer_n).value);
    if ((layer).value.empty()) {
      continue;
    }
    cByteMemory.memcpy(cPointerOffset(((cPointerElementRef(cRecordObject(builder).Layers, 0).value)).value.Data, n, 8), (layer).value.Data, (BigInt(u64((layer).value.Size)) * BigInt(8)));
    (n = i32((Number(n) + Number((layer).value.Size))));
    (layer).value.resize(0);
  }
}

// C/C++ source: source/imgui/src/imgui.cpp:6097
export function CalcTextSize(text, text_end, hide_text_after_double_hash, wrap_width) {
  let g = cRecordObject(GImGui);
  let text_display_end;
  if (hide_text_after_double_hash) {
    (text_display_end = FindRenderedTextEnd(text, text_end));
  } else {
    (text_display_end = text_end);
  }
  let font = g.Font;
  let font_size = Math.fround(g.FontSize);
  if (cPointerCompare(text, text_display_end, "==")) {
    return cCopyTrivialClass((ImVec2()).__cxx_construct_edecdff36a89174e(Math.fround(0), font_size), ImVec2(), ["x", "y"]);
  }
  let text_size = cCopyTrivialClass(cRecordObject(font).CalcTextSizeA(font_size, Math.fround(3.40282347E+38), wrap_width, text, text_display_end, null), ImVec2(), ["x", "y"]);
  (text_size.x = Math.fround(Math.fround(Math.fround(i32(Math.fround((text_size.x + Math.fround(0.999989986))))))));
  return cCopyTrivialClass(text_size, ImVec2(), ["x", "y"]);
}

// C/C++ source: source/imgui/src/imgui.cpp:6186
export function IsItemActive() {
  let g = cRecordObject(GImGui);
  if (Boolean(g.ActiveId)) {
    return Boolean((g.ActiveId == g.LastItemData.ID));
  }
  return Boolean(false);
}

// C/C++ source: source/imgui/src/imgui.cpp:6194
export function IsItemActivated() {
  let g = cRecordObject(GImGui);
  if (Boolean(g.ActiveId)) {
    if (((g.ActiveId == g.LastItemData.ID) && (g.ActiveIdPreviousFrame != g.LastItemData.ID))) {
      return Boolean(true);
    }
  }
  return Boolean(false);
}

// C/C++ source: source/imgui/src/imgui.cpp:6203
export function IsItemDeactivated() {
  let g = cRecordObject(GImGui);
  if (Boolean(i32((g.LastItemData.StatusFlags & i32(32))))) {
    return Boolean((i32((g.LastItemData.StatusFlags & i32(64))) != 0));
  }
  return Boolean((((g.DeactivatedItemData.ID == g.LastItemData.ID) && (g.LastItemData.ID != u32(0))) && (g.DeactivatedItemData.ElapseFrame >= g.FrameCount)));
}

// C/C++ source: source/imgui/src/imgui.cpp:6211
export function IsItemDeactivatedAfterEdit() {
  let g = cRecordObject(GImGui);
  return Boolean((IsItemDeactivated() && g.DeactivatedItemData.HasBeenEditedBefore));
}

// C/C++ source: source/imgui/src/imgui.cpp:6218
export function IsItemFocused() {
  let g = cRecordObject(GImGui);
  return Boolean(((g.NavId == g.LastItemData.ID) && (g.NavId != u32(0))));
}

// C/C++ source: source/imgui/src/imgui.cpp:6231
export function IsItemToggledOpen() {
  let g = cRecordObject(GImGui);
  return Boolean((Boolean(i32((g.LastItemData.StatusFlags & i32(16)))) ? true : false));
}

// C/C++ source: source/imgui/src/imgui.cpp:6242
export function IsItemToggledSelection() {
  let g = cRecordObject(GImGui);
  0;
  return Boolean((Boolean(i32((g.LastItemData.StatusFlags & i32(8)))) ? true : false));
}

// C/C++ source: source/imgui/src/imgui.cpp:6252
export function IsAnyItemHovered() {
  let g = cRecordObject(GImGui);
  return Boolean(((g.HoveredId != u32(0)) || (g.HoveredIdPreviousFrame != u32(0))));
}

// C/C++ source: source/imgui/src/imgui.cpp:6258
export function IsAnyItemActive() {
  let g = cRecordObject(GImGui);
  return Boolean((g.ActiveId != u32(0)));
}

// C/C++ source: source/imgui/src/imgui.cpp:6264
export function IsAnyItemFocused() {
  let g = cRecordObject(GImGui);
  return Boolean(((g.NavId != u32(0)) && g.NavCursorVisible));
}

// C/C++ source: source/imgui/src/imgui.cpp:6270
export function IsItemVisible() {
  let g = cRecordObject(GImGui);
  return Boolean((i32((g.LastItemData.StatusFlags & i32(256))) != 0));
}

// C/C++ source: source/imgui/src/imgui.cpp:6276
export function IsItemEdited() {
  let g = cRecordObject(GImGui);
  return Boolean((i32((g.LastItemData.StatusFlags & i32(4))) != 0));
}

// C/C++ source: source/imgui/src/imgui.cpp:6285
export function SetNextItemAllowOverlap() {
  let g = cRecordObject(GImGui);
  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = i32((__cxx_lvalue_0.value | i32(16384)))))(cObjectFieldRef(g.NextItemData, "ItemFlags"));
}

// C/C++ source: source/imgui/src/imgui.cpp:6307
export function SetActiveIdUsingAllKeyboardKeys() {
  let g = cRecordObject(GImGui);
  0;
  (g.ActiveIdUsingNavDirMask = u32(i32((i32((1 << i32(4))) - 1))));
  (g.ActiveIdUsingAllKeyboardKeys = Boolean(true));
  NavMoveRequestCancel();
}

// C/C++ source: source/imgui/src/imgui.cpp:6316
export function GetItemID() {
  let g = cRecordObject(GImGui);
  return g.LastItemData.ID;
}

// C/C++ source: source/imgui/src/imgui.cpp:6322
export function GetItemRectMin() {
  let g = cRecordObject(GImGui);
  return cCopyTrivialClass(g.LastItemData.Rect.Min, ImVec2(), ["x", "y"]);
}

// C/C++ source: source/imgui/src/imgui.cpp:6328
export function GetItemRectMax() {
  let g = cRecordObject(GImGui);
  return cCopyTrivialClass(g.LastItemData.Rect.Max, ImVec2(), ["x", "y"]);
}

// C/C++ source: source/imgui/src/imgui.cpp:6334
export function GetItemRectSize() {
  let g = cRecordObject(GImGui);
  return cCopyTrivialClass(g.LastItemData.Rect.GetSize(), ImVec2(), ["x", "y"]);
}

// C/C++ source: source/imgui/src/imgui.cpp:6340
export function GetItemFlags() {
  let g = cRecordObject(GImGui);
  return g.LastItemData.ItemFlags;
}

// C/C++ source: source/imgui/src/imgui.cpp:6537
export function SetWindowConditionAllowFlags(window, flags, enabled) {
  (cRecordObject(window).SetWindowPosAllowFlags = i32((enabled ? i32((cRecordObject(window).SetWindowPosAllowFlags | flags)) : i32((cRecordObject(window).SetWindowPosAllowFlags & (~flags))))));
  (cRecordObject(window).SetWindowSizeAllowFlags = i32((enabled ? i32((cRecordObject(window).SetWindowSizeAllowFlags | flags)) : i32((cRecordObject(window).SetWindowSizeAllowFlags & (~flags))))));
  (cRecordObject(window).SetWindowCollapsedAllowFlags = i32((enabled ? i32((cRecordObject(window).SetWindowCollapsedAllowFlags | flags)) : i32((cRecordObject(window).SetWindowCollapsedAllowFlags & (~flags))))));
}

// C/C++ source: source/imgui/src/imgui.cpp:6544
export function FindWindowByID(id) {
  let g = cRecordObject(GImGui);
  return g.WindowsById.GetVoidPtr(id);
}

// C/C++ source: source/imgui/src/imgui.cpp:6619
export function CalcWindowMinSize(window) {
  let g = cRecordObject(GImGui);
  let size_min = (ImVec2()).__cxx_construct_3fdb0b4b21c3726c();
  if ((Boolean(i32((cRecordObject(window).Flags & i32(16777216)))) && (!Boolean(i32((cRecordObject(window).Flags & i32(67108864))))))) {
    (size_min.x = Math.fround((Boolean(i32((cRecordObject(window).ChildFlags & i32(4)))) ? g.Style.WindowMinSize.x : Math.fround(4))));
    (size_min.y = Math.fround((Boolean(i32((cRecordObject(window).ChildFlags & i32(8)))) ? g.Style.WindowMinSize.y : Math.fround(4))));
  } else {
    (size_min.x = Math.fround(((i32((cRecordObject(window).Flags & i32(64))) == 0) ? g.Style.WindowMinSize.x : Math.fround(4))));
    (size_min.y = Math.fround(((i32((cRecordObject(window).Flags & i32(64))) == 0) ? g.Style.WindowMinSize.y : Math.fround(4))));
  }
  let window_for_height = window;
  (size_min.y = Math.fround(ImMax(size_min.y, Math.fround((Math.fround((cRecordObject(window_for_height).TitleBarHeight + cRecordObject(window_for_height).MenuBarHeight)) + ImMax(Math.fround(0), Math.fround((g.Style.WindowRounding - Math.fround(1)))))))));
  return cCopyTrivialClass(size_min, ImVec2(), ["x", "y"]);
}

// C/C++ source: source/imgui/src/imgui.cpp:6740
export function GetWindowBgColorIdx(window) {
  if (Boolean(i32((cRecordObject(window).Flags & i32((i32(33554432) | i32(67108864))))))) {
    return i32(4);
  }
  if (Boolean(i32((cRecordObject(window).Flags & i32(16777216))))) {
    return i32(3);
  }
  return i32(2);
}

// C/C++ source: source/imgui/src/imgui.cpp:7284
export function UpdateWindowParentAndRootLinks(window, flags, parent_window) {
  (cRecordObject(window).ParentWindow = parent_window);
  (cRecordObject(window).RootWindow = (cRecordObject(window).RootWindowPopupTree = (cRecordObject(window).RootWindowForTitleBarHighlight = (cRecordObject(window).RootWindowForNav = window))));
  if (((parent_window && Boolean(i32((flags & i32(16777216))))) && (!Boolean(i32((flags & i32(33554432))))))) {
    (cRecordObject(window).RootWindow = cRecordObject(parent_window).RootWindow);
  }
  if ((parent_window && Boolean(i32((flags & i32(67108864)))))) {
    (cRecordObject(window).RootWindowPopupTree = cRecordObject(parent_window).RootWindowPopupTree);
  }
  if (((parent_window && (!Boolean(i32((flags & i32(134217728)))))) && Boolean(i32((flags & i32((i32((i32(16777216) | i32(67108864))) | i32(33554432)))))))) {
    (cRecordObject(window).RootWindowForTitleBarHighlight = cRecordObject(parent_window).RootWindowForTitleBarHighlight);
  }
  while (Boolean(i32((cRecordObject(cRecordObject(window).RootWindowForNav).ChildFlags & i32(256))))) {
    0;
    (cRecordObject(window).RootWindowForNav = cRecordObject(cRecordObject(window).RootWindowForNav).ParentWindow);
  }
}

// C/C++ source: source/imgui/src/imgui.cpp:7303
export function UpdateWindowSkipRefresh(window) {
  let g = cRecordObject(GImGui);
  (cRecordObject(window).SkipRefresh = Boolean(false));
  if ((i32((g.NextWindowData.HasFlags & i32(1024))) == 0)) {
    return;
  }
  if (Boolean(i32((g.NextWindowData.RefreshFlagsVal & i32(1))))) {
    if (cRecordObject(window).Appearing) {
      return;
    }
    if (cRecordObject(window).Hidden) {
      return;
    }
    if ((Boolean(i32((g.NextWindowData.RefreshFlagsVal & i32(2)))) && g.HoveredWindow)) {
      if ((cPointerCompare(cRecordObject(window).RootWindow, cRecordObject(g.HoveredWindow).RootWindow, "==") || IsWindowWithinBeginStackOf(cRecordObject(g.HoveredWindow).RootWindow, window))) {
        return;
      }
    }
    if ((Boolean(i32((g.NextWindowData.RefreshFlagsVal & i32(4)))) && g.NavWindow)) {
      if ((cPointerCompare(cRecordObject(window).RootWindow, cRecordObject(g.NavWindow).RootWindow, "==") || IsWindowWithinBeginStackOf(cRecordObject(g.NavWindow).RootWindow, window))) {
        return;
      }
    }
    (cRecordObject(window).DrawList = null);
    (cRecordObject(window).SkipRefresh = Boolean(true));
  }
}

// C/C++ source: source/imgui/src/imgui.cpp:7327
export function SetWindowActiveForSkipRefresh(window) {
  (cRecordObject(window).Active = Boolean(true));
  {
    const __cxx_span_0 = cxxPointerSpan(cRecordObject(window).DC.ChildWindows, "Data", "Size", 8);
    for (let __cxx_span_i_0 = 0; __cxx_span_i_0 < __cxx_span_0.length; ++__cxx_span_i_0) {
      if ((!cRecordObject(__cxx_span_0.get(__cxx_span_i_0)).Hidden)) {
        (cRecordObject(__cxx_span_0.get(__cxx_span_i_0)).Active = Boolean((cRecordObject(__cxx_span_0.get(__cxx_span_i_0)).SkipRefresh = Boolean(true))));
        SetWindowActiveForSkipRefresh(__cxx_span_0.get(__cxx_span_i_0));
      }
    }
  }
}

// C/C++ source: source/imgui/src/imgui.cpp:8197
export function PushItemFlag(option, enabled) {
  let g = cRecordObject(GImGui);
  let item_flags = i32(g.CurrentItemFlags);
  0;
  if (enabled) {
    (item_flags = i32((item_flags | option)));
  } else {
    (item_flags = i32((item_flags & (~option))));
  }
  (g.CurrentItemFlags = i32(item_flags));
  g.ItemFlagsStack.push_back(item_flags);
}

// C/C++ source: source/imgui/src/imgui.cpp:8225
export function BeginDisabled(disabled) {
  let g = cRecordObject(GImGui);
  let was_disabled = Boolean((i32((g.CurrentItemFlags & i32(64))) != 0));
  if (((!was_disabled) && disabled)) {
    (g.DisabledAlphaBackup = Math.fround(g.Style.Alpha));
    ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = Math.fround((__cxx_lvalue_0.value * g.Style.DisabledAlpha))))(cObjectFieldRef(g.Style, "Alpha"));
  }
  if ((was_disabled || disabled)) {
    ((__cxx_lvalue_1) => (__cxx_lvalue_1.value = i32((__cxx_lvalue_1.value | i32(64)))))(cObjectFieldRef(g, "CurrentItemFlags"));
  }
  g.ItemFlagsStack.push_back(g.CurrentItemFlags);
  ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = ((((previous + 1)) << 16) >> 16); __cxx_lvalue_2.value = next; return previous; })(cObjectFieldRef(g, "DisabledStackSize"));
}

// C/C++ source: source/imgui/src/imgui.cpp:8256
export function BeginDisabledOverrideReenable() {
  let g = cRecordObject(GImGui);
  0;
  (g.CurrentWindowStack.back().DisabledOverrideReenableAlphaBackup = Math.fround(g.Style.Alpha));
  (g.Style.Alpha = Math.fround(g.DisabledAlphaBackup));
  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = i32((__cxx_lvalue_0.value & (~i32(64))))))(cObjectFieldRef(g, "CurrentItemFlags"));
  g.ItemFlagsStack.push_back(g.CurrentItemFlags);
  ((__cxx_lvalue_1) => { const previous = __cxx_lvalue_1.value; const next = ((((previous + 1)) << 16) >> 16); __cxx_lvalue_1.value = next; return previous; })(cObjectFieldRef(g, "DisabledStackSize"));
}

// C/C++ source: source/imgui/src/imgui.cpp:8267
export function EndDisabledOverrideReenable() {
  let g = cRecordObject(GImGui);
  0;
  ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = ((((previous - 1)) << 16) >> 16); __cxx_lvalue_0.value = next; return previous; })(cObjectFieldRef(g, "DisabledStackSize"));
  g.ItemFlagsStack.pop_back();
  (g.CurrentItemFlags = i32(g.ItemFlagsStack.back()));
  (g.Style.Alpha = Math.fround(g.CurrentWindowStack.back().DisabledOverrideReenableAlphaBackup));
}

// C/C++ source: source/imgui/src/imgui.cpp:8278
export function PushTextWrapPos(wrap_local_pos_x) {
  let g = cRecordObject(GImGui);
  let window = g.CurrentWindow;
  cRecordObject(window).DC.TextWrapPosStack.push_back(cRecordObject(window).DC.TextWrapPos);
  (cRecordObject(window).DC.TextWrapPos = Math.fround(wrap_local_pos_x));
}

// C/C++ source: source/imgui/src/imgui.cpp:8295
export function GetCombinedRootWindow(window, popup_hierarchy) {
  let last_window = null;
  while (cPointerCompare(last_window, window, "!=")) {
    (last_window = window);
    (window = cRecordObject(window).RootWindow);
    if (popup_hierarchy) {
      (window = cRecordObject(window).RootWindowPopupTree);
    }
  }
  return window;
}

// C/C++ source: source/imgui/src/imgui.cpp:8308
export function IsWindowChildOf(window, potential_parent, popup_hierarchy) {
  let window_root = GetCombinedRootWindow(window, popup_hierarchy);
  if (cPointerCompare(window_root, potential_parent, "==")) {
    return Boolean(true);
  }
  while (cPointerCompare(window, null, "!=")) {
    if (cPointerCompare(window, potential_parent, "==")) {
      return Boolean(true);
    }
    if (cPointerCompare(window, window_root, "==")) {
      return Boolean(false);
    }
    (window = cRecordObject(window).ParentWindow);
  }
  return Boolean(false);
}

// C/C++ source: source/imgui/src/imgui.cpp:8333
export function IsWindowWithinBeginStackOf(window, potential_parent) {
  if (cPointerCompare(cRecordObject(window).RootWindow, potential_parent, "==")) {
    return Boolean(true);
  }
  while (cPointerCompare(window, null, "!=")) {
    if (cPointerCompare(window, potential_parent, "==")) {
      return Boolean(true);
    }
    (window = cRecordObject(window).ParentWindowInBeginStack);
  }
  return Boolean(false);
}

// C/C++ source: source/imgui/src/imgui.cpp:8415
export function GetWindowWidth() {
  let window = cRecordObject(GImGui).CurrentWindow;
  return Math.fround(cRecordObject(window).Size.x);
}

// C/C++ source: source/imgui/src/imgui.cpp:8421
export function GetWindowHeight() {
  let window = cRecordObject(GImGui).CurrentWindow;
  return Math.fround(cRecordObject(window).Size.y);
}

// C/C++ source: source/imgui/src/imgui.cpp:8427
export function GetWindowPos() {
  let g = cRecordObject(GImGui);
  let window = g.CurrentWindow;
  return cCopyTrivialClass(cRecordObject(window).Pos, ImVec2(), ["x", "y"]);
}

// C/C++ source: source/imgui/src/imgui.cpp:8469
export function GetWindowSize() {
  let window = GetCurrentWindowRead();
  return cCopyTrivialClass(cRecordObject(window).Size, ImVec2(), ["x", "y"]);
}

// C/C++ source: source/imgui/src/imgui.cpp:8475
export function SetWindowSize__cxx_e5590c714db5(window, size, cond) {
  if ((Boolean(cond) && (i32((cRecordObject(window).SetWindowSizeAllowFlags & cond)) == 0))) {
    return;
  }
  0;
  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = i32((__cxx_lvalue_0.value & (~i32((i32((i32(2) | i32(4))) | i32(8))))))))(cObjectFieldRef(cRecordObject(window), "SetWindowSizeAllowFlags"));
  if ((((i32((cRecordObject(window).Flags & i32(16777216))) == 0) || cRecordObject(window).Appearing) || (i32((cRecordObject(window).ChildFlags & i32(64))) != 0))) {
    (cRecordObject(window).AutoFitFramesX = ((((((((size.x <= Math.fround(0)) ? 2 : 0)) << 24) >> 24)) << 24) >> 24));
  }
  if ((((i32((cRecordObject(window).Flags & i32(16777216))) == 0) || cRecordObject(window).Appearing) || (i32((cRecordObject(window).ChildFlags & i32(64))) != 0))) {
    (cRecordObject(window).AutoFitFramesY = ((((((((size.y <= Math.fround(0)) ? 2 : 0)) << 24) >> 24)) << 24) >> 24));
  }
  let old_size = cCopyTrivialClass(cRecordObject(window).SizeFull, ImVec2(), ["x", "y"]);
  if ((size.x <= Math.fround(0))) {
    (cRecordObject(window).AutoFitOnlyGrows = Boolean(false));
  } else {
    (cRecordObject(window).SizeFull.x = Math.fround(Math.fround(Math.fround(i32(size.x)))));
  }
  if ((size.y <= Math.fround(0))) {
    (cRecordObject(window).AutoFitOnlyGrows = Boolean(false));
  } else {
    (cRecordObject(window).SizeFull.y = Math.fround(Math.fround(Math.fround(i32(size.y)))));
  }
  if (((old_size.x != cRecordObject(window).SizeFull.x) || (old_size.y != cRecordObject(window).SizeFull.y))) {
    MarkIniSettingsDirty__cxx_d4c2d33d4080(window);
  }
}

// C/C++ source: source/imgui/src/imgui.cpp:8504
export function SetWindowSize__cxx_1a96d4ed9fbf(size, cond) {
  SetWindowSize__cxx_e5590c714db5(cRecordObject(GImGui).CurrentWindow, size, cond);
}

// C/C++ source: source/imgui/src/imgui.cpp:8515
export function SetWindowCollapsed__cxx_537bdf572264(window, collapsed, cond) {
  if ((Boolean(cond) && (i32((cRecordObject(window).SetWindowCollapsedAllowFlags & cond)) == 0))) {
    return;
  }
  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = i32((__cxx_lvalue_0.value & (~i32((i32((i32(2) | i32(4))) | i32(8))))))))(cObjectFieldRef(cRecordObject(window), "SetWindowCollapsedAllowFlags"));
  if (cRecordObject(window).WantCollapseToggle) {
    ((__cxx_lvalue_1) => (__cxx_lvalue_1.value = Boolean((__cxx_lvalue_1.value ^ 1))))(cObjectFieldRef(cRecordObject(window), "Collapsed"));
  }
  (cRecordObject(window).WantCollapseToggle = Boolean((i32(cRecordObject(window).Collapsed) != i32(collapsed))));
}

// C/C++ source: source/imgui/src/imgui.cpp:8535
export function SetWindowHiddenAndSkipItemsForCurrentFrame(window) {
  (cRecordObject(window).Hidden = Boolean((cRecordObject(window).SkipItems = Boolean(true))));
  (cRecordObject(window).HiddenFramesCanSkipItems = ((((((1) << 24) >> 24)) << 24) >> 24));
}

// C/C++ source: source/imgui/src/imgui.cpp:8541
export function SetWindowCollapsed__cxx_8fccb2ea6dbd(collapsed, cond) {
  SetWindowCollapsed__cxx_537bdf572264(cRecordObject(GImGui).CurrentWindow, collapsed, cond);
}

// C/C++ source: source/imgui/src/imgui.cpp:8546
export function IsWindowCollapsed() {
  let window = GetCurrentWindowRead();
  return Boolean(cRecordObject(window).Collapsed);
}

// C/C++ source: source/imgui/src/imgui.cpp:8552
export function IsWindowAppearing() {
  let window = GetCurrentWindowRead();
  return Boolean(cRecordObject(window).Appearing);
}

// C/C++ source: source/imgui/src/imgui.cpp:8612
export function SetNextWindowCollapsed(collapsed, cond) {
  let g = cRecordObject(GImGui);
  0;
  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = i32((__cxx_lvalue_0.value | i32(8)))))(cObjectFieldRef(g.NextWindowData, "HasFlags"));
  (g.NextWindowData.CollapsedVal = Boolean(collapsed));
  (g.NextWindowData.CollapsedCond = i32((Boolean(cond) ? cond : i32(1))));
}

// C/C++ source: source/imgui/src/imgui.cpp:8621
export function SetNextWindowBgAlpha(alpha) {
  let g = cRecordObject(GImGui);
  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = i32((__cxx_lvalue_0.value | i32(64)))))(cObjectFieldRef(g.NextWindowData, "HasFlags"));
  (g.NextWindowData.BgAlphaVal = Math.fround(alpha));
}

// C/C++ source: source/imgui/src/imgui.cpp:8629
export function SetNextWindowRefreshPolicy(flags) {
  let g = cRecordObject(GImGui);
  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = i32((__cxx_lvalue_0.value | i32(1024)))))(cObjectFieldRef(g.NextWindowData, "HasFlags"));
  (g.NextWindowData.RefreshFlagsVal = i32(flags));
}

// C/C++ source: source/imgui/src/imgui.cpp:8636
export function GetWindowDrawList() {
  let window = GetCurrentWindow();
  return cRecordObject(window).DrawList;
}

// C/C++ source: source/imgui/src/imgui.cpp:8642
export function GetFont() {
  return cRecordObject(GImGui).Font;
}

// C/C++ source: source/imgui/src/imgui.cpp:8647
export function GetFontBaked() {
  return cRecordObject(GImGui).FontBaked;
}

// C/C++ source: source/imgui/src/imgui.cpp:8655
export function GetFontSize() {
  return Math.fround(cRecordObject(GImGui).FontSize);
}

// C/C++ source: source/imgui/src/imgui.cpp:8660
export function GetFontTexUvWhitePixel() {
  return cCopyTrivialClass(cRecordObject(GImGui).DrawListSharedData.TexUvWhitePixel, ImVec2(), ["x", "y"]);
}

// C/C++ source: source/imgui/src/imgui.cpp:8676
export function PushFocusScope(id) {
  let g = cRecordObject(GImGui);
  let data = new (ImGuiFocusScopeData())();
  (data.ID = u32(id));
  (data.WindowID = u32(cRecordObject(g.CurrentWindow).ID));
  g.FocusScopeStack.push_back(data);
  (g.CurrentFocusScopeId = u32(id));
}

// C/C++ source: source/imgui/src/imgui.cpp:8694
export function SetNavFocusScope(focus_scope_id) {
  let g = cRecordObject(GImGui);
  (g.NavFocusScopeId = u32(focus_scope_id));
  g.NavFocusRoute.resize(0);
  if ((focus_scope_id == u32(0))) {
    return;
  }
  0;
  if ((focus_scope_id == g.CurrentFocusScopeId)) {
    for (let n = i32((g.FocusScopeStack.Size - 1)); ((n >= 0) && ((cPointerElementRef(g.FocusScopeStack.Data, n).value).WindowID == cRecordObject(g.CurrentWindow).ID)); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous - 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => n, __cxx_lvalue_1 => { n = __cxx_lvalue_1; }))) {
      g.NavFocusRoute.push_back((cPointerElementRef(g.FocusScopeStack.Data, n).value));
    }
  } else {
    if ((focus_scope_id == cRecordObject(g.NavWindow).NavRootFocusScopeId)) {
      g.NavFocusRoute.push_back(cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"ID": {"native": "Uint32Array", "offset": 0, "size": 4}, "WindowID": {"native": "Uint32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"ID": focus_scope_id, "WindowID": cRecordObject(g.NavWindow).ID}, null, {}));
    } else {
      return;
    }
  }
  for (let window = cRecordObject(g.NavWindow).ParentWindowForFocusRoute; cPointerCompare(window, null, "!="); (window = cRecordObject(window).ParentWindowForFocusRoute)) {
    g.NavFocusRoute.push_back(cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"ID": {"native": "Uint32Array", "offset": 0, "size": 4}, "WindowID": {"native": "Uint32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"ID": cRecordObject(window).NavRootFocusScopeId, "WindowID": cRecordObject(window).ID}, null, {}));
  }
  0;
}

// C/C++ source: source/imgui/src/imgui.cpp:8740
export function ActivateItemByID(id) {
  let g = cRecordObject(GImGui);
  (g.NavNextActivateId = u32(id));
  (g.NavNextActivateFlags = i32(0));
}

// C/C++ source: source/imgui/src/imgui.cpp:8800
export function SetStateStorage(tree) {
  let window = cRecordObject(GImGui).CurrentWindow;
  (cRecordObject(window).DC.StateStorage = (tree ? tree : cObjectFieldRef(cRecordObject(window), "StateStorage")));
}

// C/C++ source: source/imgui/src/imgui.cpp:8806
export function GetStateStorage() {
  let window = cRecordObject(GImGui).CurrentWindow;
  return cRecordObject(window).DC.StateStorage;
}

// C/C++ source: source/imgui/src/imgui.cpp:8870
export function UpdateTexturesEndFrame() {
  let g = cRecordObject(GImGui);
  g.PlatformIO.Textures.resize(0);
  {
    const __cxx_span_0 = cxxPointerSpan(g.FontAtlases, "Data", "Size", 8);
    for (let __cxx_span_i_0 = 0; __cxx_span_i_0 < __cxx_span_0.length; ++__cxx_span_i_0) {
      {
        const __cxx_span_1 = cxxPointerSpan(cRecordObject(__cxx_span_0.get(__cxx_span_i_0)).TexList, "Data", "Size", 8);
        for (let __cxx_span_i_1 = 0; __cxx_span_i_1 < __cxx_span_1.length; ++__cxx_span_i_1) {
          (cRecordObject(__cxx_span_1.get(__cxx_span_i_1)).RefCount = ((((((cRecordObject(__cxx_span_0.get(__cxx_span_i_0)).RefCount) & 65535)) & 65535)) & 65535));
          g.PlatformIO.Textures.push_back(__cxx_span_1.get(__cxx_span_i_1));
        }
      }
    }
  }
  {
    const __cxx_span_2 = cxxPointerSpan(g.UserTextures, "Data", "Size", 8);
    for (let __cxx_span_i_2 = 0; __cxx_span_i_2 < __cxx_span_2.length; ++__cxx_span_i_2) {
      g.PlatformIO.Textures.push_back(__cxx_span_2.get(__cxx_span_i_2));
    }
  }
}

// C/C++ source: source/imgui/src/imgui.cpp:8929
export function RegisterUserTexture(tex) {
  let g = cRecordObject(GImGui);
  ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = (((previous + 1)) & 65535); __cxx_lvalue_0.value = next; return previous; })(cObjectFieldRef(cRecordObject(tex), "RefCount"));
  g.UserTextures.push_back(tex);
}

// C/C++ source: source/imgui/src/imgui.cpp:8936
export function UnregisterUserTexture(tex) {
  let g = cRecordObject(GImGui);
  0;
  ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = (((previous - 1)) & 65535); __cxx_lvalue_0.value = next; return previous; })(cObjectFieldRef(cRecordObject(tex), "RefCount"));
  g.UserTextures.find_erase(tex);
}

// C/C++ source: source/imgui/src/imgui.cpp:8944
export function RegisterFontAtlas(atlas) {
  let g = cRecordObject(GImGui);
  if ((g.FontAtlases.Size == 0)) {
    0;
  }
  ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cObjectFieldRef(cRecordObject(atlas), "RefCount"));
  g.FontAtlases.push_back(atlas);
  ImFontAtlasAddDrawListSharedData(atlas, cObjectFieldRef(g, "DrawListSharedData"));
  {
    const __cxx_span_0 = cxxPointerSpan(cRecordObject(atlas).TexList, "Data", "Size", 8);
    for (let __cxx_span_i_0 = 0; __cxx_span_i_0 < __cxx_span_0.length; ++__cxx_span_i_0) {
      (cRecordObject(__cxx_span_0.get(__cxx_span_i_0)).RefCount = ((((((cRecordObject(atlas).RefCount) & 65535)) & 65535)) & 65535));
    }
  }
}

// C/C++ source: source/imgui/src/imgui.cpp:8956
export function UnregisterFontAtlas(atlas) {
  let g = cRecordObject(GImGui);
  0;
  ImFontAtlasRemoveDrawListSharedData(atlas, cObjectFieldRef(g, "DrawListSharedData"));
  g.FontAtlases.find_erase(atlas);
  ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous - 1)); __cxx_lvalue_0.value = next; return previous; })(cObjectFieldRef(cRecordObject(atlas), "RefCount"));
  {
    const __cxx_span_0 = cxxPointerSpan(cRecordObject(atlas).TexList, "Data", "Size", 8);
    for (let __cxx_span_i_0 = 0; __cxx_span_i_0 < __cxx_span_0.length; ++__cxx_span_i_0) {
      (cRecordObject(__cxx_span_0.get(__cxx_span_i_0)).RefCount = ((((((cRecordObject(atlas).RefCount) & 65535)) & 65535)) & 65535));
    }
  }
}

// C/C++ source: source/imgui/src/imgui.cpp:9152
export function PushID__cxx_e2b67df3d971(str_id) {
  let g = cRecordObject(GImGui);
  let window = g.CurrentWindow;
  let id = u32(cRecordObject(window).GetID(str_id, null));
  cRecordObject(window).IDStack.push_back(id);
}

// C/C++ source: source/imgui/src/imgui.cpp:9160
export function PushID__cxx_fa2992270ce7(str_id_begin, str_id_end) {
  let g = cRecordObject(GImGui);
  let window = g.CurrentWindow;
  let id = u32(cRecordObject(window).GetID(str_id_begin, str_id_end));
  cRecordObject(window).IDStack.push_back(id);
}

// C/C++ source: source/imgui/src/imgui.cpp:9168
export function PushID__cxx_32596e41dc4e(ptr_id) {
  let g = cRecordObject(GImGui);
  let window = g.CurrentWindow;
  let id = u32(cRecordObject(window).GetID(ptr_id));
  cRecordObject(window).IDStack.push_back(id);
}

// C/C++ source: source/imgui/src/imgui.cpp:9176
export function PushID__cxx_42152bcf61c8(int_id) {
  let g = cRecordObject(GImGui);
  let window = g.CurrentWindow;
  let id = u32(cRecordObject(window).GetID(int_id));
  cRecordObject(window).IDStack.push_back(id);
}

// C/C++ source: source/imgui/src/imgui.cpp:9228
export function GetID__cxx_6e9a9942a205(str_id) {
  let window = cRecordObject(GImGui).CurrentWindow;
  return cRecordObject(window).GetID(str_id, null);
}

// C/C++ source: source/imgui/src/imgui.cpp:9234
export function GetID__cxx_e05b28a10f1b(str_id_begin, str_id_end) {
  let window = cRecordObject(GImGui).CurrentWindow;
  return cRecordObject(window).GetID(str_id_begin, str_id_end);
}

// C/C++ source: source/imgui/src/imgui.cpp:9240
export function GetID__cxx_383a98ead8fd(ptr_id) {
  let window = cRecordObject(GImGui).CurrentWindow;
  return cRecordObject(window).GetID(ptr_id);
}

// C/C++ source: source/imgui/src/imgui.cpp:9246
export function GetID__cxx_1400b83d064d(int_id) {
  let window = cRecordObject(GImGui).CurrentWindow;
  return cRecordObject(window).GetID(int_id);
}

// C/C++ source: source/imgui/src/imgui.cpp:9319
export function GetModForLRModKey(key) {
  if (((i32(key) == i32(527)) || (i32(key) == i32(531)))) {
    return i32(4096);
  }
  if (((i32(key) == i32(528)) || (i32(key) == i32(532)))) {
    return i32(8192);
  }
  if (((i32(key) == i32(529)) || (i32(key) == i32(533)))) {
    return i32(16384);
  }
  if (((i32(key) == i32(530)) || (i32(key) == i32(534)))) {
    return i32(32768);
  }
  return i32(0);
}

// C/C++ source: source/imgui/src/imgui.cpp:9332
export function FixupKeyChord(key_chord) {
  let key = i32((key_chord & (~i32(61440))));
  if (IsLRModKey(key)) {
    (key_chord = i32((key_chord | GetModForLRModKey(key))));
  }
  return key_chord;
}

// C/C++ source: source/imgui/src/imgui.cpp:9341
export function GetKeyData__cxx_50185bb07026(ctx, key) {
  let g = cRecordObject(ctx);
  if (Boolean(i32((i32(key) & i32(61440))))) {
    (key = ConvertSingleModFlagToKey(key));
  }
  0;
  return cPointerOffset(g.IO.KeysData, i32((i32(key) - i32(512))), 16);
}

// C/C++ source: source/imgui/src/imgui.cpp:9354
export const GKeyNames = cPointerArray(155, [Uint8Array.from([84, 97, 98, 0]), Uint8Array.from([76, 101, 102, 116, 65, 114, 114, 111, 119, 0]), Uint8Array.from([82, 105, 103, 104, 116, 65, 114, 114, 111, 119, 0]), Uint8Array.from([85, 112, 65, 114, 114, 111, 119, 0]), Uint8Array.from([68, 111, 119, 110, 65, 114, 114, 111, 119, 0]), Uint8Array.from([80, 97, 103, 101, 85, 112, 0]), Uint8Array.from([80, 97, 103, 101, 68, 111, 119, 110, 0]), Uint8Array.from([72, 111, 109, 101, 0]), Uint8Array.from([69, 110, 100, 0]), Uint8Array.from([73, 110, 115, 101, 114, 116, 0]), Uint8Array.from([68, 101, 108, 101, 116, 101, 0]), Uint8Array.from([66, 97, 99, 107, 115, 112, 97, 99, 101, 0]), Uint8Array.from([83, 112, 97, 99, 101, 0]), Uint8Array.from([69, 110, 116, 101, 114, 0]), Uint8Array.from([69, 115, 99, 97, 112, 101, 0]), Uint8Array.from([76, 101, 102, 116, 67, 116, 114, 108, 0]), Uint8Array.from([76, 101, 102, 116, 83, 104, 105, 102, 116, 0]), Uint8Array.from([76, 101, 102, 116, 65, 108, 116, 0]), Uint8Array.from([76, 101, 102, 116, 83, 117, 112, 101, 114, 0]), Uint8Array.from([82, 105, 103, 104, 116, 67, 116, 114, 108, 0]), Uint8Array.from([82, 105, 103, 104, 116, 83, 104, 105, 102, 116, 0]), Uint8Array.from([82, 105, 103, 104, 116, 65, 108, 116, 0]), Uint8Array.from([82, 105, 103, 104, 116, 83, 117, 112, 101, 114, 0]), Uint8Array.from([77, 101, 110, 117, 0]), Uint8Array.from([48, 0]), Uint8Array.from([49, 0]), Uint8Array.from([50, 0]), Uint8Array.from([51, 0]), Uint8Array.from([52, 0]), Uint8Array.from([53, 0]), Uint8Array.from([54, 0]), Uint8Array.from([55, 0]), Uint8Array.from([56, 0]), Uint8Array.from([57, 0]), Uint8Array.from([65, 0]), Uint8Array.from([66, 0]), Uint8Array.from([67, 0]), Uint8Array.from([68, 0]), Uint8Array.from([69, 0]), Uint8Array.from([70, 0]), Uint8Array.from([71, 0]), Uint8Array.from([72, 0]), Uint8Array.from([73, 0]), Uint8Array.from([74, 0]), Uint8Array.from([75, 0]), Uint8Array.from([76, 0]), Uint8Array.from([77, 0]), Uint8Array.from([78, 0]), Uint8Array.from([79, 0]), Uint8Array.from([80, 0]), Uint8Array.from([81, 0]), Uint8Array.from([82, 0]), Uint8Array.from([83, 0]), Uint8Array.from([84, 0]), Uint8Array.from([85, 0]), Uint8Array.from([86, 0]), Uint8Array.from([87, 0]), Uint8Array.from([88, 0]), Uint8Array.from([89, 0]), Uint8Array.from([90, 0]), Uint8Array.from([70, 49, 0]), Uint8Array.from([70, 50, 0]), Uint8Array.from([70, 51, 0]), Uint8Array.from([70, 52, 0]), Uint8Array.from([70, 53, 0]), Uint8Array.from([70, 54, 0]), Uint8Array.from([70, 55, 0]), Uint8Array.from([70, 56, 0]), Uint8Array.from([70, 57, 0]), Uint8Array.from([70, 49, 48, 0]), Uint8Array.from([70, 49, 49, 0]), Uint8Array.from([70, 49, 50, 0]), Uint8Array.from([70, 49, 51, 0]), Uint8Array.from([70, 49, 52, 0]), Uint8Array.from([70, 49, 53, 0]), Uint8Array.from([70, 49, 54, 0]), Uint8Array.from([70, 49, 55, 0]), Uint8Array.from([70, 49, 56, 0]), Uint8Array.from([70, 49, 57, 0]), Uint8Array.from([70, 50, 48, 0]), Uint8Array.from([70, 50, 49, 0]), Uint8Array.from([70, 50, 50, 0]), Uint8Array.from([70, 50, 51, 0]), Uint8Array.from([70, 50, 52, 0]), Uint8Array.from([65, 112, 111, 115, 116, 114, 111, 112, 104, 101, 0]), Uint8Array.from([67, 111, 109, 109, 97, 0]), Uint8Array.from([77, 105, 110, 117, 115, 0]), Uint8Array.from([80, 101, 114, 105, 111, 100, 0]), Uint8Array.from([83, 108, 97, 115, 104, 0]), Uint8Array.from([83, 101, 109, 105, 99, 111, 108, 111, 110, 0]), Uint8Array.from([69, 113, 117, 97, 108, 0]), Uint8Array.from([76, 101, 102, 116, 66, 114, 97, 99, 107, 101, 116, 0]), Uint8Array.from([66, 97, 99, 107, 115, 108, 97, 115, 104, 0]), Uint8Array.from([82, 105, 103, 104, 116, 66, 114, 97, 99, 107, 101, 116, 0]), Uint8Array.from([71, 114, 97, 118, 101, 65, 99, 99, 101, 110, 116, 0]), Uint8Array.from([67, 97, 112, 115, 76, 111, 99, 107, 0]), Uint8Array.from([83, 99, 114, 111, 108, 108, 76, 111, 99, 107, 0]), Uint8Array.from([78, 117, 109, 76, 111, 99, 107, 0]), Uint8Array.from([80, 114, 105, 110, 116, 83, 99, 114, 101, 101, 110, 0]), Uint8Array.from([80, 97, 117, 115, 101, 0]), Uint8Array.from([75, 101, 121, 112, 97, 100, 48, 0]), Uint8Array.from([75, 101, 121, 112, 97, 100, 49, 0]), Uint8Array.from([75, 101, 121, 112, 97, 100, 50, 0]), Uint8Array.from([75, 101, 121, 112, 97, 100, 51, 0]), Uint8Array.from([75, 101, 121, 112, 97, 100, 52, 0]), Uint8Array.from([75, 101, 121, 112, 97, 100, 53, 0]), Uint8Array.from([75, 101, 121, 112, 97, 100, 54, 0]), Uint8Array.from([75, 101, 121, 112, 97, 100, 55, 0]), Uint8Array.from([75, 101, 121, 112, 97, 100, 56, 0]), Uint8Array.from([75, 101, 121, 112, 97, 100, 57, 0]), Uint8Array.from([75, 101, 121, 112, 97, 100, 68, 101, 99, 105, 109, 97, 108, 0]), Uint8Array.from([75, 101, 121, 112, 97, 100, 68, 105, 118, 105, 100, 101, 0]), Uint8Array.from([75, 101, 121, 112, 97, 100, 77, 117, 108, 116, 105, 112, 108, 121, 0]), Uint8Array.from([75, 101, 121, 112, 97, 100, 83, 117, 98, 116, 114, 97, 99, 116, 0]), Uint8Array.from([75, 101, 121, 112, 97, 100, 65, 100, 100, 0]), Uint8Array.from([75, 101, 121, 112, 97, 100, 69, 110, 116, 101, 114, 0]), Uint8Array.from([75, 101, 121, 112, 97, 100, 69, 113, 117, 97, 108, 0]), Uint8Array.from([65, 112, 112, 66, 97, 99, 107, 0]), Uint8Array.from([65, 112, 112, 70, 111, 114, 119, 97, 114, 100, 0]), Uint8Array.from([79, 101, 109, 49, 48, 50, 0]), Uint8Array.from([71, 97, 109, 101, 112, 97, 100, 83, 116, 97, 114, 116, 0]), Uint8Array.from([71, 97, 109, 101, 112, 97, 100, 66, 97, 99, 107, 0]), Uint8Array.from([71, 97, 109, 101, 112, 97, 100, 70, 97, 99, 101, 76, 101, 102, 116, 0]), Uint8Array.from([71, 97, 109, 101, 112, 97, 100, 70, 97, 99, 101, 82, 105, 103, 104, 116, 0]), Uint8Array.from([71, 97, 109, 101, 112, 97, 100, 70, 97, 99, 101, 85, 112, 0]), Uint8Array.from([71, 97, 109, 101, 112, 97, 100, 70, 97, 99, 101, 68, 111, 119, 110, 0]), Uint8Array.from([71, 97, 109, 101, 112, 97, 100, 68, 112, 97, 100, 76, 101, 102, 116, 0]), Uint8Array.from([71, 97, 109, 101, 112, 97, 100, 68, 112, 97, 100, 82, 105, 103, 104, 116, 0]), Uint8Array.from([71, 97, 109, 101, 112, 97, 100, 68, 112, 97, 100, 85, 112, 0]), Uint8Array.from([71, 97, 109, 101, 112, 97, 100, 68, 112, 97, 100, 68, 111, 119, 110, 0]), Uint8Array.from([71, 97, 109, 101, 112, 97, 100, 76, 49, 0]), Uint8Array.from([71, 97, 109, 101, 112, 97, 100, 82, 49, 0]), Uint8Array.from([71, 97, 109, 101, 112, 97, 100, 76, 50, 0]), Uint8Array.from([71, 97, 109, 101, 112, 97, 100, 82, 50, 0]), Uint8Array.from([71, 97, 109, 101, 112, 97, 100, 76, 51, 0]), Uint8Array.from([71, 97, 109, 101, 112, 97, 100, 82, 51, 0]), Uint8Array.from([71, 97, 109, 101, 112, 97, 100, 76, 83, 116, 105, 99, 107, 76, 101, 102, 116, 0]), Uint8Array.from([71, 97, 109, 101, 112, 97, 100, 76, 83, 116, 105, 99, 107, 82, 105, 103, 104, 116, 0]), Uint8Array.from([71, 97, 109, 101, 112, 97, 100, 76, 83, 116, 105, 99, 107, 85, 112, 0]), Uint8Array.from([71, 97, 109, 101, 112, 97, 100, 76, 83, 116, 105, 99, 107, 68, 111, 119, 110, 0]), Uint8Array.from([71, 97, 109, 101, 112, 97, 100, 82, 83, 116, 105, 99, 107, 76, 101, 102, 116, 0]), Uint8Array.from([71, 97, 109, 101, 112, 97, 100, 82, 83, 116, 105, 99, 107, 82, 105, 103, 104, 116, 0]), Uint8Array.from([71, 97, 109, 101, 112, 97, 100, 82, 83, 116, 105, 99, 107, 85, 112, 0]), Uint8Array.from([71, 97, 109, 101, 112, 97, 100, 82, 83, 116, 105, 99, 107, 68, 111, 119, 110, 0]), Uint8Array.from([77, 111, 117, 115, 101, 76, 101, 102, 116, 0]), Uint8Array.from([77, 111, 117, 115, 101, 82, 105, 103, 104, 116, 0]), Uint8Array.from([77, 111, 117, 115, 101, 77, 105, 100, 100, 108, 101, 0]), Uint8Array.from([77, 111, 117, 115, 101, 88, 49, 0]), Uint8Array.from([77, 111, 117, 115, 101, 88, 50, 0]), Uint8Array.from([77, 111, 117, 115, 101, 87, 104, 101, 101, 108, 88, 0]), Uint8Array.from([77, 111, 117, 115, 101, 87, 104, 101, 101, 108, 89, 0]), Uint8Array.from([77, 111, 100, 67, 116, 114, 108, 0]), Uint8Array.from([77, 111, 100, 83, 104, 105, 102, 116, 0]), Uint8Array.from([77, 111, 100, 65, 108, 116, 0]), Uint8Array.from([77, 111, 100, 83, 117, 112, 101, 114, 0])]);
function __cxx_static_address_e76e7b25cf50b5aa73885ddb() {
  return __cxx_static_address_e76e7b25cf50b5aa73885ddb.reference || (__cxx_static_address_e76e7b25cf50b5aa73885ddb.reference = {
    __cReference: true,
    get value() { return GKeyNames; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/imgui/src/imgui.cpp:9380
const __cxx_literal_fa006d8601c0b003cf7d = Uint8Array.from([78, 111, 110, 101, 0]);
const __cxx_literal_bfdc1c3bd7210fb33123 = Uint8Array.from([85, 110, 107, 110, 111, 119, 110, 0]);
export function GetKeyName(key) {
  if ((i32(key) == i32(0))) {
    return __cxx_literal_fa006d8601c0b003cf7d;
  }
  0;
  if (Boolean(i32((i32(key) & i32(61440))))) {
    (key = ConvertSingleModFlagToKey(key));
  }
  if ((!IsNamedKey(key))) {
    return __cxx_literal_bfdc1c3bd7210fb33123;
  }
  return (cPointerElementRef(GKeyNames, i32((i32(key) - i32(512)))).value);
}

// C/C++ source: source/imgui/src/imgui.cpp:9419
export function CalcTypematicRepeatAmount(t0, t1, repeat_delay, repeat_rate) {
  if ((t1 == Math.fround(0))) {
    return i32(1);
  }
  if ((t0 >= t1)) {
    return i32(0);
  }
  if ((repeat_rate <= Math.fround(0))) {
    return i32(((t0 < repeat_delay) && (t1 >= repeat_delay)));
  }
  let count_t0 = i32(((t0 < repeat_delay) ? (-1) : i32(Math.fround((Math.fround((t0 - repeat_delay)) / repeat_rate)))));
  let count_t1 = i32(((t1 < repeat_delay) ? (-1) : i32(Math.fround((Math.fround((t1 - repeat_delay)) / repeat_rate)))));
  let count = i32((count_t1 - count_t0));
  return i32(count);
}

// C/C++ source: source/imgui/src/imgui.cpp:9433
export function GetTypematicRepeatRate(flags, repeat_delay, repeat_rate) {
  let g = cRecordObject(GImGui);
  switch (i32((flags & i32(14)))) {
    case i32(4): {
      ((cDeref(repeat_delay, Float32Array).value) = Math.fround(Math.fround((g.IO.KeyRepeatDelay * Math.fround(0.720000029)))));
    }
    ((cDeref(repeat_rate, Float32Array).value) = Math.fround(Math.fround((g.IO.KeyRepeatRate * Math.fround(0.800000011)))));
    return;
    case i32(8): {
      ((cDeref(repeat_delay, Float32Array).value) = Math.fround(Math.fround((g.IO.KeyRepeatDelay * Math.fround(0.720000029)))));
    }
    ((cDeref(repeat_rate, Float32Array).value) = Math.fround(Math.fround((g.IO.KeyRepeatRate * Math.fround(0.300000012)))));
    return;
    case i32(2):
    default: {
      ((cDeref(repeat_delay, Float32Array).value) = Math.fround(Math.fround((g.IO.KeyRepeatDelay * Math.fround(1)))));
    }
    ((cDeref(repeat_rate, Float32Array).value) = Math.fround(Math.fround((g.IO.KeyRepeatRate * Math.fround(1)))));
    return;
  }
}

// C/C++ source: source/imgui/src/imgui.cpp:9446
export function GetKeyPressedAmount(key, repeat_delay, repeat_rate) {
  let g = cRecordObject(GImGui);
  let key_data = GetKeyData__cxx_c4423be9e248(key);
  if ((!cRecordObject(key_data).Down)) {
    return i32(0);
  }
  let t = Math.fround(cRecordObject(key_data).DownDuration);
  return i32(CalcTypematicRepeatAmount(Math.fround((t - g.IO.DeltaTime)), t, repeat_delay, repeat_rate));
}

// C/C++ source: source/imgui/src/imgui.cpp:9457
export function GetKeyMagnitude2d(key_left, key_right, key_up, key_down) {
  return cCopyTrivialClass((ImVec2()).__cxx_construct_edecdff36a89174e(Math.fround((cRecordObject(GetKeyData__cxx_c4423be9e248(key_right)).AnalogValue - cRecordObject(GetKeyData__cxx_c4423be9e248(key_left)).AnalogValue)), Math.fround((cRecordObject(GetKeyData__cxx_c4423be9e248(key_down)).AnalogValue - cRecordObject(GetKeyData__cxx_c4423be9e248(key_up)).AnalogValue))), ImVec2(), ["x", "y"]);
}

// C/C++ source: source/imgui/src/imgui.cpp:9509
export function GetRoutingIdFromOwnerId(owner_id) {
  let g = cRecordObject(GImGui);
  return (((owner_id != u32((-1))) && (owner_id != u32(0))) ? owner_id : g.CurrentFocusScopeId);
}

// C/C++ source: source/imgui/src/imgui.cpp:9560
export function CalcRoutingScore(focus_scope_id, owner_id, flags) {
  let g = cRecordObject(GImGui);
  if (Boolean(i32((flags & i32(2048))))) {
    if (((owner_id != u32(0)) && (g.ActiveId == owner_id))) {
      return i32(300);
    }
    if ((focus_scope_id == u32(0))) {
      return i32(0);
    }
    for (let index_in_focus_path = i32(0); (index_in_focus_path < g.NavFocusRoute.Size); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => index_in_focus_path, __cxx_lvalue_1 => { index_in_focus_path = __cxx_lvalue_1; }))) {
      if (((cPointerElementRef(g.NavFocusRoute.Data, index_in_focus_path).value).ID == focus_scope_id)) {
        if (Boolean(i32((flags & i32(32768))))) {
          return i32((599 - index_in_focus_path));
        } else {
          return i32((199 - index_in_focus_path));
        }
      }
    }
    return i32(0);
  } else {
    if (Boolean(i32((flags & i32(1024))))) {
      if (((owner_id != u32(0)) && (g.ActiveId == owner_id))) {
        return i32(300);
      }
      return i32(0);
    } else {
      if (Boolean(i32((flags & i32(4096))))) {
        if (Boolean(i32((flags & i32(32768))))) {
          return i32(400);
        }
        if (((owner_id != u32(0)) && (g.ActiveId == owner_id))) {
          return i32(300);
        }
        if (Boolean(i32((flags & i32(16384))))) {
          return i32(200);
        }
        return i32(1);
      }
    }
  }
  0;
  return i32(0);
}

// C/C++ source: source/imgui/src/imgui.cpp:9612
export function IsKeyChordPotentiallyCharInput(key_chord) {
  let g = cRecordObject(GImGui);
  let mods = i32((key_chord & i32(61440)));
  let ignore_char_inputs = Boolean(((Boolean(i32((i32(mods) & i32(4096)))) && (!Boolean(i32((i32(mods) & i32(16384)))))) || (g.IO.ConfigMacOSXBehaviors && Boolean(i32((i32(mods) & i32(4096)))))));
  if (ignore_char_inputs) {
    return Boolean(false);
  }
  let key = i32((key_chord & (~i32(61440))));
  if ((i32(key) == i32(0))) {
    return Boolean(false);
  }
  return Boolean(g.KeysMayBeCharInput.TestBit(i32(key)));
}

// C/C++ source: source/imgui/src/imgui.cpp:9732
export function IsKeyDown__cxx_c3e417cdcfae(key) {
  return Boolean(IsKeyDown__cxx_78c66622fe8a(key, u32(0)));
}

// C/C++ source: source/imgui/src/imgui.cpp:9737
export function IsKeyDown__cxx_78c66622fe8a(key, owner_id) {
  let key_data = GetKeyData__cxx_c4423be9e248(key);
  if ((!cRecordObject(key_data).Down)) {
    return Boolean(false);
  }
  if ((!TestKeyOwner(key, owner_id))) {
    return Boolean(false);
  }
  return Boolean(true);
}

// C/C++ source: source/imgui/src/imgui.cpp:9747
export function IsKeyPressed__cxx_fb74b804921d(key, repeat) {
  return Boolean(IsKeyPressed__cxx_c61e6e0d2e05(key, i32((repeat ? 1 : 0)), u32(0)));
}

// C/C++ source: source/imgui/src/imgui.cpp:9753
export function IsKeyPressed__cxx_c61e6e0d2e05(key, flags, owner_id) {
  let key_data = GetKeyData__cxx_c4423be9e248(key);
  if ((!cRecordObject(key_data).Down)) {
    return Boolean(false);
  }
  let t = Math.fround(cRecordObject(key_data).DownDuration);
  if ((t < Math.fround(0))) {
    return Boolean(false);
  }
  0;
  if (Boolean(i32((flags & i32((i32(14) | i32(240))))))) {
    (flags = i32((flags | i32(1))));
  }
  let pressed = Boolean((t == Math.fround(0)));
  if (((!pressed) && (i32((flags & i32(1))) != 0))) {
    let repeat_delay;
    let repeat_rate;
    GetTypematicRepeatRate(flags, cRef(() => repeat_delay, __cxx_lvalue_0 => { repeat_delay = __cxx_lvalue_0; }), cRef(() => repeat_rate, __cxx_lvalue_1 => { repeat_rate = __cxx_lvalue_1; }));
    (pressed = Boolean(((t > repeat_delay) && (GetKeyPressedAmount(key, repeat_delay, repeat_rate) > 0))));
    if ((pressed && Boolean(i32((flags & i32(240)))))) {
      let g = cRecordObject(GImGui);
      let key_pressed_time = ((g.Time - t) + Math.fround(9.99999974E-6));
      if ((Boolean(i32((flags & i32(32)))) && (g.LastKeyModsChangeTime > key_pressed_time))) {
        (pressed = Boolean(false));
      }
      if ((Boolean(i32((flags & i32(64)))) && (g.LastKeyModsChangeFromNoneTime > key_pressed_time))) {
        (pressed = Boolean(false));
      }
      if ((Boolean(i32((flags & i32(128)))) && (g.LastKeyboardKeyPressTime > key_pressed_time))) {
        (pressed = Boolean(false));
      }
    }
  }
  if ((!pressed)) {
    return Boolean(false);
  }
  if ((!TestKeyOwner(key, owner_id))) {
    return Boolean(false);
  }
  return Boolean(true);
}

// C/C++ source: source/imgui/src/imgui.cpp:9792
export function IsKeyReleased__cxx_d92b679d8751(key) {
  return Boolean(IsKeyReleased__cxx_df7b7eab48c8(key, u32(0)));
}

// C/C++ source: source/imgui/src/imgui.cpp:9797
export function IsKeyReleased__cxx_df7b7eab48c8(key, owner_id) {
  let key_data = GetKeyData__cxx_c4423be9e248(key);
  if (((cRecordObject(key_data).DownDurationPrev < Math.fround(0)) || cRecordObject(key_data).Down)) {
    return Boolean(false);
  }
  if ((!TestKeyOwner(key, owner_id))) {
    return Boolean(false);
  }
  return Boolean(true);
}

// C/C++ source: source/imgui/src/imgui.cpp:9807
export function IsMouseDown__cxx_6b75db0755ea(button) {
  let g = cRecordObject(GImGui);
  0;
  return Boolean(((cDeref(cPointerOffset(g.IO.MouseDown, button, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) && TestKeyOwner(MouseButtonToKey(button), u32(0))));
}

// C/C++ source: source/imgui/src/imgui.cpp:9814
export function IsMouseDown__cxx_1f9036c7d6ff(button, owner_id) {
  let g = cRecordObject(GImGui);
  0;
  return Boolean(((cDeref(cPointerOffset(g.IO.MouseDown, button, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) && TestKeyOwner(MouseButtonToKey(button), owner_id)));
}

// C/C++ source: source/imgui/src/imgui.cpp:9821
export function IsMouseClicked__cxx_644003f8abb5(button, repeat) {
  return Boolean(IsMouseClicked__cxx_9610785b82bd(button, i32((repeat ? 1 : 0)), u32(0)));
}

// C/C++ source: source/imgui/src/imgui.cpp:9826
export function IsMouseClicked__cxx_9610785b82bd(button, flags, owner_id) {
  let g = cRecordObject(GImGui);
  0;
  if ((!(cDeref(cPointerOffset(g.IO.MouseDown, button, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value))) {
    return Boolean(false);
  }
  let t = Math.fround((cDeref(cPointerOffset(g.IO.MouseDownDuration, button, Float32Array.BYTES_PER_ELEMENT), Float32Array).value));
  if ((t < Math.fround(0))) {
    return Boolean(false);
  }
  0;
  let repeat = Boolean((i32((flags & i32(1))) != 0));
  let pressed = Boolean(((t == Math.fround(0)) || ((repeat && (t > g.IO.KeyRepeatDelay)) && (CalcTypematicRepeatAmount(Math.fround((t - g.IO.DeltaTime)), t, g.IO.KeyRepeatDelay, g.IO.KeyRepeatRate) > 0))));
  if ((!pressed)) {
    return Boolean(false);
  }
  if ((!TestKeyOwner(MouseButtonToKey(button), owner_id))) {
    return Boolean(false);
  }
  return Boolean(true);
}

// C/C++ source: source/imgui/src/imgui.cpp:9848
export function IsMouseReleased__cxx_8a09cb2ab351(button) {
  let g = cRecordObject(GImGui);
  0;
  return Boolean(((cDeref(cPointerOffset(g.IO.MouseReleased, button, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) && TestKeyOwner(MouseButtonToKey(button), u32(0))));
}

// C/C++ source: source/imgui/src/imgui.cpp:9855
export function IsMouseReleased__cxx_3f1a8e949cb3(button, owner_id) {
  let g = cRecordObject(GImGui);
  0;
  return Boolean(((cDeref(cPointerOffset(g.IO.MouseReleased, button, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) && TestKeyOwner(MouseButtonToKey(button), owner_id)));
}

// C/C++ source: source/imgui/src/imgui.cpp:9865
export function IsMouseReleasedWithDelay(button, delay) {
  let g = cRecordObject(GImGui);
  0;
  let time_since_release = Math.fround(Math.fround((g.Time - (cDeref(cPointerOffset(g.IO.MouseReleasedTime, button, Float64Array.BYTES_PER_ELEMENT), Float64Array).value))));
  return Boolean((((!IsMouseDown__cxx_6b75db0755ea(button)) && (Math.fround((time_since_release - g.IO.DeltaTime)) < delay)) && (time_since_release >= delay)));
}

// C/C++ source: source/imgui/src/imgui.cpp:9873
export function IsMouseDoubleClicked__cxx_fd1cb7372656(button) {
  let g = cRecordObject(GImGui);
  0;
  return Boolean(((i32((cDeref(cPointerOffset(g.IO.MouseClickedCount, button, Uint16Array.BYTES_PER_ELEMENT), Uint16Array).value)) == 2) && TestKeyOwner(MouseButtonToKey(button), u32(0))));
}

// C/C++ source: source/imgui/src/imgui.cpp:9880
export function IsMouseDoubleClicked__cxx_702d595a0aa1(button, owner_id) {
  let g = cRecordObject(GImGui);
  0;
  return Boolean(((i32((cDeref(cPointerOffset(g.IO.MouseClickedCount, button, Uint16Array.BYTES_PER_ELEMENT), Uint16Array).value)) == 2) && TestKeyOwner(MouseButtonToKey(button), owner_id)));
}

// C/C++ source: source/imgui/src/imgui.cpp:9887
export function GetMouseClickedCount(button) {
  let g = cRecordObject(GImGui);
  0;
  return i32((cDeref(cPointerOffset(g.IO.MouseClickedCount, button, Uint16Array.BYTES_PER_ELEMENT), Uint16Array).value));
}

// C/C++ source: source/imgui/src/imgui.cpp:9914
export function IsMouseDragPastThreshold(button, lock_threshold) {
  let g = cRecordObject(GImGui);
  0;
  if ((lock_threshold < Math.fround(0))) {
    (lock_threshold = Math.fround(g.IO.MouseDragThreshold));
  }
  return Boolean(((cDeref(cPointerOffset(g.IO.MouseDragMaxDistanceSqr, button, Float32Array.BYTES_PER_ELEMENT), Float32Array).value) >= Math.fround((lock_threshold * lock_threshold))));
}

// C/C++ source: source/imgui/src/imgui.cpp:9923
export function IsMouseDragging(button, lock_threshold) {
  let g = cRecordObject(GImGui);
  0;
  if ((!(cDeref(cPointerOffset(g.IO.MouseDown, button, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value))) {
    return Boolean(false);
  }
  return Boolean(IsMouseDragPastThreshold(button, lock_threshold));
}

// C/C++ source: source/imgui/src/imgui.cpp:9932
export function GetMousePos() {
  let g = cRecordObject(GImGui);
  return cCopyTrivialClass(g.IO.MousePos, ImVec2(), ["x", "y"]);
}

// C/C++ source: source/imgui/src/imgui.cpp:9959
export function IsMousePosValid(mouse_pos) {
  0;
  let MOUSE_INVALID = Math.fround((-Math.fround(256000)));
  let p = cCopyTrivialClass((mouse_pos ? cRecordObject(mouse_pos) : cRecordObject(GImGui).IO.MousePos), ImVec2(), ["x", "y"]);
  return Boolean(((p.x >= MOUSE_INVALID) && (p.y >= MOUSE_INVALID)));
}

// C/C++ source: source/imgui/src/imgui.cpp:9970
export function IsAnyMouseDown() {
  let g = cRecordObject(GImGui);
  for (let n = i32(0); (n < i32((BigInt(5) / BigInt(1)))); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => n, __cxx_lvalue_1 => { n = __cxx_lvalue_1; }))) {
    if ((cDeref(cPointerOffset(g.IO.MouseDown, n, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) {
      return Boolean(true);
    }
  }
  return Boolean(false);
}

// C/C++ source: source/imgui/src/imgui.cpp:9982
export function GetMouseDragDelta(button, lock_threshold) {
  let g = cRecordObject(GImGui);
  0;
  if ((lock_threshold < Math.fround(0))) {
    (lock_threshold = Math.fround(g.IO.MouseDragThreshold));
  }
  if (((cDeref(cPointerOffset(g.IO.MouseDown, button, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) || (cDeref(cPointerOffset(g.IO.MouseReleased, button, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value))) {
    if (((cDeref(cPointerOffset(g.IO.MouseDragMaxDistanceSqr, button, Float32Array.BYTES_PER_ELEMENT), Float32Array).value) >= Math.fround((lock_threshold * lock_threshold)))) {
      if ((IsMousePosValid(cObjectFieldRef(g.IO, "MousePos")) && IsMousePosValid(cPointerOffset(g.IO.MouseClickedPos, button, 8)))) {
        return cCopyTrivialClass(__cxx_operator_71e4282592b4c08b(g.IO.MousePos, (cPointerElementRef(g.IO.MouseClickedPos, button).value)), ImVec2(), ["x", "y"]);
      }
    }
  }
  return cCopyTrivialClass((ImVec2()).__cxx_construct_edecdff36a89174e(Math.fround(0), Math.fround(0)), ImVec2(), ["x", "y"]);
}

// C/C++ source: source/imgui/src/imgui.cpp:10007
export function GetMouseCursor() {
  let g = cRecordObject(GImGui);
  return g.MouseCursor;
}

// C/C++ source: source/imgui/src/imgui.cpp:10016
export function SetMouseCursor(cursor_type) {
  let g = cRecordObject(GImGui);
  (g.MouseCursor = i32(cursor_type));
}

// C/C++ source: source/imgui/src/imgui.cpp:10022
export function UpdateAliasKey(key, v, analog_value) {
  0;
  let key_data = GetKeyData__cxx_c4423be9e248(key);
  (cRecordObject(key_data).Down = Boolean(v));
  (cRecordObject(key_data).AnalogValue = Math.fround(analog_value));
}

// C/C++ source: source/imgui/src/imgui.cpp:10031
export function GetMergedModsFromKeys() {
  let mods = i32(0);
  if (IsKeyDown__cxx_c3e417cdcfae(4096)) {
    (mods = i32((mods | i32(4096))));
  }
  if (IsKeyDown__cxx_c3e417cdcfae(8192)) {
    (mods = i32((mods | i32(8192))));
  }
  if (IsKeyDown__cxx_c3e417cdcfae(16384)) {
    (mods = i32((mods | i32(16384))));
  }
  if (IsKeyDown__cxx_c3e417cdcfae(32768)) {
    (mods = i32((mods | i32(32768))));
  }
  return mods;
}

// C/C++ source: source/imgui/src/imgui.cpp:10332
export function SetNextFrameWantCaptureKeyboard(want_capture_keyboard) {
  let g = cRecordObject(GImGui);
  (g.WantCaptureKeyboardNextFrame = i32((want_capture_keyboard ? 1 : 0)));
}

// C/C++ source: source/imgui/src/imgui.cpp:10338
export function SetNextFrameWantCaptureMouse(want_capture_mouse) {
  let g = cRecordObject(GImGui);
  (g.WantCaptureMouseNextFrame = i32((want_capture_mouse ? 1 : 0)));
}

// C/C++ source: source/imgui/src/imgui.cpp:10345
const __cxx_literal_cfbc661557ae88618b08 = Uint8Array.from([78, 111, 110, 101, 0]);
const __cxx_literal_7bfff47d2b7ec21c0289 = Uint8Array.from([77, 111, 117, 115, 101, 0]);
const __cxx_literal_e2d99fee04a855f63c84 = Uint8Array.from([75, 101, 121, 98, 111, 97, 114, 100, 0]);
const __cxx_literal_acaec37c7d30b5eedafd = Uint8Array.from([71, 97, 109, 101, 112, 97, 100, 0]);
const __cxx_literal_2ced1c53ab8039b75671 = Uint8Array.from([85, 110, 107, 110, 111, 119, 110, 0]);
export function GetInputSourceName(source) {
  let input_source_names = cPointerArray(4, [__cxx_literal_cfbc661557ae88618b08, __cxx_literal_7bfff47d2b7ec21c0289, __cxx_literal_e2d99fee04a855f63c84, __cxx_literal_acaec37c7d30b5eedafd]);
  0;
  if (((i32(source) < 0) || (i32(source) >= i32(4)))) {
    return __cxx_literal_2ced1c53ab8039b75671;
  }
  return (cPointerElementRef(input_source_names, source).value);
}

// C/C++ source: source/imgui/src/imgui.cpp:10353
const __cxx_literal_7d843ad7250bb1d33979 = Uint8Array.from([77, 111, 117, 115, 101, 0]);
const __cxx_literal_6db80e5b3f81c3de3aa0 = Uint8Array.from([84, 111, 117, 99, 104, 83, 99, 114, 101, 101, 110, 0]);
const __cxx_literal_491a2fd285248b0ef078 = Uint8Array.from([80, 101, 110, 0]);
const __cxx_literal_e9b8f5b8ad8cf7b517e9 = Uint8Array.from([85, 110, 107, 110, 111, 119, 110, 0]);
export function GetMouseSourceName(source) {
  let mouse_source_names = cPointerArray(3, [__cxx_literal_7d843ad7250bb1d33979, __cxx_literal_6db80e5b3f81c3de3aa0, __cxx_literal_491a2fd285248b0ef078]);
  0;
  if (((i32(source) < 0) || (i32(source) >= i32(3)))) {
    return __cxx_literal_e9b8f5b8ad8cf7b517e9;
  }
  return (cPointerElementRef(mouse_source_names, source).value);
}

// C/C++ source: source/imgui/src/imgui.cpp:10516
export function GetKeyOwner(key) {
  if ((!IsNamedKeyOrMod(key))) {
    return u32((-1));
  }
  let g = cRecordObject(GImGui);
  let owner_data = GetKeyOwnerData(cRef(() => g, __cxx_lvalue_0 => { g = __cxx_lvalue_0; }), key);
  let owner_id = u32(cRecordObject(owner_data).OwnerCurr);
  if (((g.ActiveIdUsingAllKeyboardKeys && (owner_id != g.ActiveId)) && (owner_id != u32(0)))) {
    if (((i32(key) >= i32(512)) && (i32(key) < i32(632)))) {
      return u32((-1));
    }
  }
  return owner_id;
}

// C/C++ source: source/imgui/src/imgui.cpp:10536
export function TestKeyOwner(key, owner_id) {
  if ((!IsNamedKeyOrMod(key))) {
    return Boolean(true);
  }
  let g = cRecordObject(GImGui);
  if (((g.ActiveIdUsingAllKeyboardKeys && (owner_id != g.ActiveId)) && (owner_id != u32(0)))) {
    if (((i32(key) >= i32(512)) && (i32(key) < i32(632)))) {
      return Boolean(false);
    }
  }
  let owner_data = GetKeyOwnerData(cRef(() => g, __cxx_lvalue_0 => { g = __cxx_lvalue_0; }), key);
  if ((owner_id == u32(0))) {
    return Boolean((i32(cRecordObject(owner_data).LockThisFrame) == i32(false)));
  }
  if ((cRecordObject(owner_data).OwnerCurr != owner_id)) {
    if (cRecordObject(owner_data).LockThisFrame) {
      return Boolean(false);
    }
    if ((cRecordObject(owner_data).OwnerCurr != u32((-1)))) {
      return Boolean(false);
    }
  }
  return Boolean(true);
}

// C/C++ source: source/imgui/src/imgui.cpp:10569
export function SetKeyOwner(key, owner_id, flags) {
  let g = cRecordObject(GImGui);
  0;
  0;
  let owner_data = GetKeyOwnerData(cRef(() => g, __cxx_lvalue_0 => { g = __cxx_lvalue_0; }), key);
  (cRecordObject(owner_data).OwnerCurr = u32((cRecordObject(owner_data).OwnerNext = u32(owner_id))));
  (cRecordObject(owner_data).LockUntilRelease = Boolean((i32((flags & i32(2097152))) != 0)));
  (cRecordObject(owner_data).LockThisFrame = Boolean(((i32((flags & i32(1048576))) != 0) || cRecordObject(owner_data).LockUntilRelease)));
}

// C/C++ source: source/imgui/src/imgui.cpp:10586
export function SetKeyOwnersForKeyChord(key_chord, owner_id, flags) {
  if (Boolean(i32((key_chord & i32(4096))))) {
    SetKeyOwner(4096, owner_id, flags);
  }
  if (Boolean(i32((key_chord & i32(8192))))) {
    SetKeyOwner(8192, owner_id, flags);
  }
  if (Boolean(i32((key_chord & i32(16384))))) {
    SetKeyOwner(16384, owner_id, flags);
  }
  if (Boolean(i32((key_chord & i32(32768))))) {
    SetKeyOwner(32768, owner_id, flags);
  }
  if (Boolean(i32((key_chord & (~i32(61440)))))) {
    SetKeyOwner(i32((key_chord & (~i32(61440)))), owner_id, flags);
  }
}

// C/C++ source: source/imgui/src/imgui.cpp:10601
export function SetItemKeyOwner__cxx_f8f05588fa96(key, flags) {
  let g = cRecordObject(GImGui);
  let id = u32(g.LastItemData.ID);
  if (((id == u32(0)) || ((g.HoveredId != id) && (g.ActiveId != id)))) {
    return;
  }
  if ((i32((flags & i32(12582912))) == 0)) {
    (flags = i32((flags | i32(12582912))));
  }
  if ((((g.HoveredId == id) && Boolean(i32((flags & i32(4194304))))) || ((g.ActiveId == id) && Boolean(i32((flags & i32(8388608))))))) {
    0;
    SetKeyOwner(key, id, i32((flags & (~i32(12582912)))));
  }
}

// C/C++ source: source/imgui/src/imgui.cpp:10616
export function SetItemKeyOwner__cxx_b94702fd04f9(key) {
  SetItemKeyOwner__cxx_f8f05588fa96(key, i32(0));
}

// C/C++ source: source/imgui/src/imgui.cpp:10622
export function IsKeyChordPressed__cxx_63841515a329(key_chord) {
  return Boolean(IsKeyChordPressed__cxx_28b8fc312a3a(key_chord, i32(0), u32(0)));
}

// C/C++ source: source/imgui/src/imgui.cpp:10628
export function IsKeyChordPressed__cxx_28b8fc312a3a(key_chord, flags, owner_id) {
  let g = cRecordObject(GImGui);
  (key_chord = i32(FixupKeyChord(key_chord)));
  let mods = i32((key_chord & i32(61440)));
  if ((g.IO.KeyMods != i32(mods))) {
    return Boolean(false);
  }
  let key = i32((key_chord & (~i32(61440))));
  if ((i32(key) == i32(0))) {
    (key = ConvertSingleModFlagToKey(mods));
  }
  if ((!IsKeyPressed__cxx_c61e6e0d2e05(key, i32((flags & i32(255))), owner_id))) {
    return Boolean(false);
  }
  return Boolean(true);
}

// C/C++ source: source/imgui/src/imgui.cpp:10645
export function SetNextItemShortcut(key_chord, flags) {
  let g = cRecordObject(GImGui);
  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = i32((__cxx_lvalue_0.value | i32(4)))))(cObjectFieldRef(g.NextItemData, "HasFlags"));
  (g.NextItemData.Shortcut = i32(key_chord));
  (g.NextItemData.ShortcutFlags = i32(flags));
}

// C/C++ source: source/imgui/src/imgui.cpp:10742
const __cxx_literal_b0ab3c69b2742cb89a8d = Uint8Array.from([49, 46, 57, 50, 46, 54, 32, 87, 73, 80, 0]);
export function DebugCheckVersionAndDataLayout(version, sz_io, sz_style, sz_vec2, sz_vec4, sz_vert, sz_idx) {
  let error = Boolean(false);
  if ((cByteMemory.strcmp(version, __cxx_literal_b0ab3c69b2742cb89a8d) != 0)) {
    (error = Boolean(true));
    0;
  }
  if ((sz_io != 3032)) {
    (error = Boolean(true));
    0;
  }
  if ((sz_style != 1296)) {
    (error = Boolean(true));
    0;
  }
  if ((sz_vec2 != 8)) {
    (error = Boolean(true));
    0;
  }
  if ((sz_vec4 != 16)) {
    (error = Boolean(true));
    0;
  }
  if ((sz_vert != 20)) {
    (error = Boolean(true));
    0;
  }
  if ((sz_idx != 2)) {
    (error = Boolean(true));
    0;
  }
  return Boolean((!error));
}

// C/C++ source: source/imgui/src/imgui.cpp:10857
export function ErrorCheckEndFrameSanityChecks() {
  let g = cRecordObject(GImGui);
  let key_mods = i32(GetMergedModsFromKeys());
  g;
  key_mods;
  0;
  key_mods;
  0;
  0;
}

// C/C++ source: source/imgui/src/imgui.cpp:10877
export function ErrorRecoveryStoreState(state_out) {
  let g = cRecordObject(GImGui);
  (cRecordObject(state_out).SizeOfWindowStack = (((((((((g.CurrentWindowStack.Size) << 16) >> 16)) << 16) >> 16)) << 16) >> 16));
  (cRecordObject(state_out).SizeOfIDStack = (((((((((cRecordObject(g.CurrentWindow).IDStack.Size) << 16) >> 16)) << 16) >> 16)) << 16) >> 16));
  (cRecordObject(state_out).SizeOfTreeStack = (((((((((cRecordObject(g.CurrentWindow).DC.TreeDepth) << 16) >> 16)) << 16) >> 16)) << 16) >> 16));
  (cRecordObject(state_out).SizeOfColorStack = (((((((((g.ColorStack.Size) << 16) >> 16)) << 16) >> 16)) << 16) >> 16));
  (cRecordObject(state_out).SizeOfStyleVarStack = (((((((((g.StyleVarStack.Size) << 16) >> 16)) << 16) >> 16)) << 16) >> 16));
  (cRecordObject(state_out).SizeOfFontStack = (((((((((g.FontStack.Size) << 16) >> 16)) << 16) >> 16)) << 16) >> 16));
  (cRecordObject(state_out).SizeOfFocusScopeStack = (((((((((g.FocusScopeStack.Size) << 16) >> 16)) << 16) >> 16)) << 16) >> 16));
  (cRecordObject(state_out).SizeOfGroupStack = (((((((((g.GroupStack.Size) << 16) >> 16)) << 16) >> 16)) << 16) >> 16));
  (cRecordObject(state_out).SizeOfItemFlagsStack = (((((((((g.ItemFlagsStack.Size) << 16) >> 16)) << 16) >> 16)) << 16) >> 16));
  (cRecordObject(state_out).SizeOfBeginPopupStack = (((((((((g.BeginPopupStack.Size) << 16) >> 16)) << 16) >> 16)) << 16) >> 16));
  (cRecordObject(state_out).SizeOfDisabledStack = ((((((g.DisabledStackSize) << 16) >> 16)) << 16) >> 16));
}

// C/C++ source: source/imgui/src/imgui.cpp:11152
export function KeepAliveID(id) {
  let g = cRecordObject(GImGui);
  if ((g.ActiveId == id)) {
    (g.ActiveIdIsAlive = u32(id));
  }
  if ((g.DeactivatedItemData.ID == id)) {
    (g.DeactivatedItemData.IsAlive = Boolean(true));
  }
}

// C/C++ source: source/imgui/src/imgui.cpp:11372
export function GetCursorScreenPos() {
  let window = GetCurrentWindowRead();
  return cCopyTrivialClass(cRecordObject(window).DC.CursorPos, ImVec2(), ["x", "y"]);
}

// C/C++ source: source/imgui/src/imgui.cpp:11388
export function GetCursorPos() {
  let window = GetCurrentWindowRead();
  return cCopyTrivialClass(__cxx_operator_e11e480209a9c93d(__cxx_operator_71e4282592b4c08b(cRecordObject(window).DC.CursorPos, cRecordObject(window).Pos), cRecordObject(window).Scroll), ImVec2(), ["x", "y"]);
}

// C/C++ source: source/imgui/src/imgui.cpp:11394
export function GetCursorPosX() {
  let window = GetCurrentWindowRead();
  return Math.fround(Math.fround((Math.fround((cRecordObject(window).DC.CursorPos.x - cRecordObject(window).Pos.x)) + cRecordObject(window).Scroll.x)));
}

// C/C++ source: source/imgui/src/imgui.cpp:11400
export function GetCursorPosY() {
  let window = GetCurrentWindowRead();
  return Math.fround(Math.fround((Math.fround((cRecordObject(window).DC.CursorPos.y - cRecordObject(window).Pos.y)) + cRecordObject(window).Scroll.y)));
}

// C/C++ source: source/imgui/src/imgui.cpp:11414
export function SetCursorPosX(x) {
  let window = GetCurrentWindow();
  (cRecordObject(window).DC.CursorPos.x = Math.fround(Math.fround((Math.fround((cRecordObject(window).Pos.x - cRecordObject(window).Scroll.x)) + x))));
  (cRecordObject(window).DC.IsSetPos = Boolean(true));
}

// C/C++ source: source/imgui/src/imgui.cpp:11422
export function SetCursorPosY(y) {
  let window = GetCurrentWindow();
  (cRecordObject(window).DC.CursorPos.y = Math.fround(Math.fround((Math.fround((cRecordObject(window).Pos.y - cRecordObject(window).Scroll.y)) + y))));
  (cRecordObject(window).DC.IsSetPos = Boolean(true));
}

// C/C++ source: source/imgui/src/imgui.cpp:11430
export function GetCursorStartPos() {
  let window = GetCurrentWindowRead();
  return cCopyTrivialClass(__cxx_operator_71e4282592b4c08b(cRecordObject(window).DC.CursorStartPos, cRecordObject(window).Pos), ImVec2(), ["x", "y"]);
}

// C/C++ source: source/imgui/src/imgui.cpp:11436
export function Indent(indent_w) {
  let g = cRecordObject(GImGui);
  let window = GetCurrentWindow();
  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = Math.fround((__cxx_lvalue_0.value + ((indent_w != Math.fround(0)) ? indent_w : g.Style.IndentSpacing)))))(cObjectFieldRef(cRecordObject(window).DC.Indent, "x"));
  (cRecordObject(window).DC.CursorPos.x = Math.fround(Math.fround((Math.fround((cRecordObject(window).Pos.x + cRecordObject(window).DC.Indent.x)) + cRecordObject(window).DC.ColumnsOffset.x))));
}

// C/C++ source: source/imgui/src/imgui.cpp:11444
export function Unindent(indent_w) {
  let g = cRecordObject(GImGui);
  let window = GetCurrentWindow();
  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = Math.fround((__cxx_lvalue_0.value - ((indent_w != Math.fround(0)) ? indent_w : g.Style.IndentSpacing)))))(cObjectFieldRef(cRecordObject(window).DC.Indent, "x"));
  (cRecordObject(window).DC.CursorPos.x = Math.fround(Math.fround((Math.fround((cRecordObject(window).Pos.x + cRecordObject(window).DC.Indent.x)) + cRecordObject(window).DC.ColumnsOffset.x))));
}

// C/C++ source: source/imgui/src/imgui.cpp:11453
export function SetNextItemWidth(item_width) {
  let g = cRecordObject(GImGui);
  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = i32((__cxx_lvalue_0.value | i32(1)))))(cObjectFieldRef(g.NextItemData, "HasFlags"));
  (g.NextItemData.Width = Math.fround(item_width));
}

// C/C++ source: source/imgui/src/imgui.cpp:11461
export function PushItemWidth(item_width) {
  let g = cRecordObject(GImGui);
  let window = g.CurrentWindow;
  cRecordObject(window).DC.ItemWidthStack.push_back(cRecordObject(window).DC.ItemWidth);
  (cRecordObject(window).DC.ItemWidth = Math.fround(((item_width == Math.fround(0)) ? cRecordObject(window).DC.ItemWidthDefault : item_width)));
  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = i32((__cxx_lvalue_0.value & (~i32(1))))))(cObjectFieldRef(g.NextItemData, "HasFlags"));
}

// C/C++ source: source/imgui/src/imgui.cpp:11470
export function PushMultiItemsWidths(components, w_full) {
  let g = cRecordObject(GImGui);
  let window = g.CurrentWindow;
  0;
  let style = g.Style;
  cRecordObject(window).DC.ItemWidthStack.push_back(cRecordObject(window).DC.ItemWidth);
  let w_items = Math.fround(Math.fround((w_full - Math.fround((style.ItemInnerSpacing.x * Math.fround(i32((components - 1))))))));
  let prev_split = Math.fround(w_items);
  for (let i = i32((components - 1)); (i > 0); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous - 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; }))) {
    let next_split = Math.fround(Math.fround(Math.fround(i32(Math.fround((Math.fround((w_items * Math.fround(i))) / Math.fround(components)))))));
    cRecordObject(window).DC.ItemWidthStack.push_back(ImMax(Math.fround((prev_split - next_split)), Math.fround(1)));
    (prev_split = Math.fround(next_split));
  }
  (cRecordObject(window).DC.ItemWidth = Math.fround(ImMax(prev_split, Math.fround(1))));
  ((__cxx_lvalue_2) => (__cxx_lvalue_2.value = i32((__cxx_lvalue_2.value & (~i32(1))))))(cObjectFieldRef(g.NextItemData, "HasFlags"));
}

// C/C++ source: source/imgui/src/imgui.cpp:11504
export function CalcItemWidth() {
  let g = cRecordObject(GImGui);
  let window = g.CurrentWindow;
  let w;
  if (Boolean(i32((g.NextItemData.HasFlags & i32(1))))) {
    (w = Math.fround(g.NextItemData.Width));
  } else {
    (w = Math.fround(cRecordObject(window).DC.ItemWidth));
  }
  if ((w < Math.fround(0))) {
    let region_avail_x = Math.fround(GetContentRegionAvail().x);
    (w = Math.fround(ImMax(Math.fround(1), Math.fround((region_avail_x + w)))));
  }
  (w = Math.fround(Math.fround(Math.fround(i32(w)))));
  return Math.fround(w);
}

// C/C++ source: source/imgui/src/imgui.cpp:11545
export function GetTextLineHeight() {
  let g = cRecordObject(GImGui);
  return Math.fround(g.FontSize);
}

// C/C++ source: source/imgui/src/imgui.cpp:11551
export function GetTextLineHeightWithSpacing() {
  let g = cRecordObject(GImGui);
  return Math.fround(Math.fround((g.FontSize + g.Style.ItemSpacing.y)));
}

// C/C++ source: source/imgui/src/imgui.cpp:11557
export function GetFrameHeight() {
  let g = cRecordObject(GImGui);
  return Math.fround(Math.fround((g.FontSize + Math.fround((g.Style.FramePadding.y * Math.fround(2))))));
}

// C/C++ source: source/imgui/src/imgui.cpp:11563
export function GetFrameHeightWithSpacing() {
  let g = cRecordObject(GImGui);
  return Math.fround(Math.fround((Math.fround((g.FontSize + Math.fround((g.Style.FramePadding.y * Math.fround(2))))) + g.Style.ItemSpacing.y)));
}

// C/C++ source: source/imgui/src/imgui.cpp:11569
export function GetContentRegionAvail() {
  let g = cRecordObject(GImGui);
  let window = g.CurrentWindow;
  let mx = cCopyTrivialClass(((cRecordObject(window).DC.CurrentColumns || g.CurrentTable) ? cRecordObject(window).WorkRect.Max : cRecordObject(window).ContentRegionRect.Max), ImVec2(), ["x", "y"]);
  return cCopyTrivialClass(__cxx_operator_71e4282592b4c08b(mx, cRecordObject(window).DC.CursorPos), ImVec2(), ["x", "y"]);
}

// C/C++ source: source/imgui/src/imgui.cpp:11581
export function GetContentRegionMax() {
  return cCopyTrivialClass(__cxx_operator_71e4282592b4c08b(__cxx_operator_e11e480209a9c93d(GetContentRegionAvail(), GetCursorScreenPos()), GetWindowPos()), ImVec2(), ["x", "y"]);
}

// C/C++ source: source/imgui/src/imgui.cpp:11586
export function GetWindowContentRegionMin() {
  let window = cRecordObject(GImGui).CurrentWindow;
  return cCopyTrivialClass(__cxx_operator_71e4282592b4c08b(cRecordObject(window).ContentRegionRect.Min, cRecordObject(window).Pos), ImVec2(), ["x", "y"]);
}

// C/C++ source: source/imgui/src/imgui.cpp:11592
export function GetWindowContentRegionMax() {
  let window = cRecordObject(GImGui).CurrentWindow;
  return cCopyTrivialClass(__cxx_operator_71e4282592b4c08b(cRecordObject(window).ContentRegionRect.Max, cRecordObject(window).Pos), ImVec2(), ["x", "y"]);
}

// C/C++ source: source/imgui/src/imgui.cpp:11826
export function GetScrollX() {
  let window = cRecordObject(GImGui).CurrentWindow;
  return Math.fround(cRecordObject(window).Scroll.x);
}

// C/C++ source: source/imgui/src/imgui.cpp:11832
export function GetScrollY() {
  let window = cRecordObject(GImGui).CurrentWindow;
  return Math.fround(cRecordObject(window).Scroll.y);
}

// C/C++ source: source/imgui/src/imgui.cpp:11838
export function GetScrollMaxX() {
  let window = cRecordObject(GImGui).CurrentWindow;
  return Math.fround(cRecordObject(window).ScrollMax.x);
}

// C/C++ source: source/imgui/src/imgui.cpp:11844
export function GetScrollMaxY() {
  let window = cRecordObject(GImGui).CurrentWindow;
  return Math.fround(cRecordObject(window).ScrollMax.y);
}

// C/C++ source: source/imgui/src/imgui.cpp:11850
export function SetScrollX__cxx_08fcb0cc4f9f(window, scroll_x) {
  (cRecordObject(window).ScrollTarget.x = Math.fround(scroll_x));
  (cRecordObject(window).ScrollTargetCenterRatio.x = Math.fround(Math.fround(0)));
  (cRecordObject(window).ScrollTargetEdgeSnapDist.x = Math.fround(Math.fround(0)));
}

// C/C++ source: source/imgui/src/imgui.cpp:11857
export function SetScrollY__cxx_5a94cefd0760(window, scroll_y) {
  (cRecordObject(window).ScrollTarget.y = Math.fround(scroll_y));
  (cRecordObject(window).ScrollTargetCenterRatio.y = Math.fround(Math.fround(0)));
  (cRecordObject(window).ScrollTargetEdgeSnapDist.y = Math.fround(Math.fround(0)));
}

// C/C++ source: source/imgui/src/imgui.cpp:11864
export function SetScrollX__cxx_8fa9700f3037(scroll_x) {
  let g = cRecordObject(GImGui);
  SetScrollX__cxx_08fcb0cc4f9f(g.CurrentWindow, scroll_x);
}

// C/C++ source: source/imgui/src/imgui.cpp:11870
export function SetScrollY__cxx_3ca621ef852e(scroll_y) {
  let g = cRecordObject(GImGui);
  SetScrollY__cxx_5a94cefd0760(g.CurrentWindow, scroll_y);
}

// C/C++ source: source/imgui/src/imgui.cpp:11886
export function SetScrollFromPosX__cxx_51fc5bf09094(window, local_x, center_x_ratio) {
  0;
  (cRecordObject(window).ScrollTarget.x = Math.fround(Math.fround(Math.fround(i32(Math.fround((Math.fround((Math.fround((local_x - cRecordObject(window).DecoOuterSizeX1)) - cRecordObject(window).DecoInnerSizeX1)) + cRecordObject(window).Scroll.x)))))));
  (cRecordObject(window).ScrollTargetCenterRatio.x = Math.fround(center_x_ratio));
  (cRecordObject(window).ScrollTargetEdgeSnapDist.x = Math.fround(Math.fround(0)));
}

// C/C++ source: source/imgui/src/imgui.cpp:11894
export function SetScrollFromPosY__cxx_311e6094e93f(window, local_y, center_y_ratio) {
  0;
  (cRecordObject(window).ScrollTarget.y = Math.fround(Math.fround(Math.fround(i32(Math.fround((Math.fround((Math.fround((local_y - cRecordObject(window).DecoOuterSizeY1)) - cRecordObject(window).DecoInnerSizeY1)) + cRecordObject(window).Scroll.y)))))));
  (cRecordObject(window).ScrollTargetCenterRatio.y = Math.fround(center_y_ratio));
  (cRecordObject(window).ScrollTargetEdgeSnapDist.y = Math.fround(Math.fround(0)));
}

// C/C++ source: source/imgui/src/imgui.cpp:11902
export function SetScrollFromPosX__cxx_356c063a768b(local_x, center_x_ratio) {
  let g = cRecordObject(GImGui);
  SetScrollFromPosX__cxx_51fc5bf09094(g.CurrentWindow, local_x, center_x_ratio);
}

// C/C++ source: source/imgui/src/imgui.cpp:11908
export function SetScrollFromPosY__cxx_f34ef1363b61(local_y, center_y_ratio) {
  let g = cRecordObject(GImGui);
  SetScrollFromPosY__cxx_311e6094e93f(g.CurrentWindow, local_y, center_y_ratio);
}

// C/C++ source: source/imgui/src/imgui.cpp:12124
export function FindBlockingModal(window) {
  let g = cRecordObject(GImGui);
  if ((g.OpenPopupStack.Size <= 0)) {
    return null;
  }
  {
    const __cxx_span_0 = cxxPointerSpan(g.OpenPopupStack, "Data", "Size", 56);
    for (let __cxx_span_i_0 = 0; __cxx_span_i_0 < __cxx_span_0.length; ++__cxx_span_i_0) {
      let popup_window = __cxx_span_0.get(__cxx_span_i_0).Window;
      if ((cPointerCompare(popup_window, null, "==") || (!Boolean(i32((cRecordObject(popup_window).Flags & i32(134217728))))))) {
        continue;
      }
      if (((!cRecordObject(popup_window).Active) && (!cRecordObject(popup_window).WasActive))) {
        continue;
      }
      if (cPointerCompare(window, null, "==")) {
        return popup_window;
      }
      if (IsWindowWithinBeginStackOf(window, popup_window)) {
        continue;
      }
      return popup_window;
    }
  }
  return null;
}

// C/C++ source: source/imgui/src/imgui.cpp:12445
export function GetMouseButtonFromPopupFlags(flags) {
  if ((i32((flags & i32(3))) != 0)) {
    return i32((flags & i32(3)));
  }
  if (Boolean(i32((flags & i32(12))))) {
    return i32((i32((i32((flags & i32(12))) >> i32(2))) - 1));
  }
  return i32(1);
}

// C/C++ source: source/imgui/src/imgui.cpp:12711
export function SetNextWindowFocus() {
  let g = cRecordObject(GImGui);
  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = i32((__cxx_lvalue_0.value | i32(32)))))(cObjectFieldRef(g.NextWindowData, "HasFlags"));
}

// C/C++ source: source/imgui/src/imgui.cpp:12718
export function IsWindowFocused(flags) {
  let g = cRecordObject(GImGui);
  let ref_window = g.NavWindow;
  let cur_window = g.CurrentWindow;
  if (cPointerCompare(ref_window, null, "==")) {
    return Boolean(false);
  }
  if (Boolean(i32((flags & i32(4))))) {
    return Boolean(true);
  }
  0;
  let popup_hierarchy = Boolean((i32((flags & i32(8))) == 0));
  if (Boolean(i32((flags & i32(2))))) {
    (cur_window = GetCombinedRootWindow(cur_window, popup_hierarchy));
  }
  if (Boolean(i32((flags & i32(1))))) {
    return Boolean(IsWindowChildOf(ref_window, cur_window, popup_hierarchy));
  } else {
    return Boolean(cPointerCompare(ref_window, cur_window, "=="));
  }
}

// C/C++ source: source/imgui/src/imgui.cpp:12740
export function FindWindowFocusIndex(window) {
  let g = cRecordObject(GImGui);
  g;
  let order = i32(cRecordObject(window).FocusOrder);
  0;
  0;
  return i32(order);
}

// C/C++ source: source/imgui/src/imgui.cpp:12847
export function FindWindowDisplayIndex(window) {
  let g = cRecordObject(GImGui);
  return i32(g.Windows.index_from_ptr(g.Windows.find(window)));
}

// C/C++ source: source/imgui/src/imgui.cpp:12953
export function SetNavCursorVisible(visible) {
  let g = cRecordObject(GImGui);
  if (g.IO.ConfigNavCursorVisibleAlways) {
    (visible = Boolean(true));
  }
  (g.NavCursorVisible = Boolean(visible));
}

// C/C++ source: source/imgui/src/imgui.cpp:12962
export function SetNavCursorVisibleAfterMove() {
  let g = cRecordObject(GImGui);
  if (g.IO.ConfigNavCursorVisibleAuto) {
    (g.NavCursorVisible = Boolean(true));
  }
  (g.NavHighlightItemUnderNav = Boolean((g.NavMousePosDirty = Boolean(true))));
}

// C/C++ source: source/imgui/src/imgui.cpp:12983
export function NavHighlightActivated(id) {
  let g = cRecordObject(GImGui);
  (g.NavHighlightActivatedId = u32(id));
  (g.NavHighlightActivatedTimer = Math.fround(NAV_ACTIVATE_HIGHLIGHT_TIMER));
}

// C/C++ source: source/imgui/src/imgui.cpp:13042
export function ImGetDirQuadrantFromDelta(dx, dy) {
  if ((fabsf(dx) > fabsf(dy))) {
    return ((dx > Math.fround(0)) ? 1 : 0);
  }
  return ((dy > Math.fround(0)) ? 3 : 2);
}

// C/C++ source: source/imgui/src/imgui.cpp:13049
export function NavScoreItemDistInterval(cand_min, cand_max, curr_min, curr_max) {
  if ((cand_max < curr_min)) {
    return Math.fround(Math.fround((cand_max - curr_min)));
  }
  if ((curr_max < cand_min)) {
    return Math.fround(Math.fround((cand_min - curr_max)));
  }
  return Math.fround(Math.fround(0));
}

// C/C++ source: source/imgui/src/imgui.cpp:13218
export function NavUpdateCurrentWindowIsScrollPushableX() {
  let g = cRecordObject(GImGui);
  let window = g.CurrentWindow;
  (cRecordObject(window).DC.NavIsScrollPushableX = Boolean((cPointerCompare(g.CurrentTable, null, "==") && cPointerCompare(cRecordObject(window).DC.CurrentColumns, null, "=="))));
}

// C/C++ source: source/imgui/src/imgui.cpp:13373
export function NavMoveRequestButNoResultYet() {
  let g = cRecordObject(GImGui);
  return Boolean(((g.NavMoveScoringItems && (g.NavMoveResultLocal.ID == u32(0))) && (g.NavMoveResultOther.ID == u32(0))));
}

// C/C++ source: source/imgui/src/imgui.cpp:13380
export function NavMoveRequestSubmit(move_dir, clip_dir, move_flags, scroll_flags) {
  let g = cRecordObject(GImGui);
  0;
  if (Boolean(i32((move_flags & i32(1024))))) {
    (move_flags = i32((move_flags | i32(16))));
  }
  (g.NavMoveSubmitted = Boolean((g.NavMoveScoringItems = Boolean(true))));
  (g.NavMoveDir = move_dir);
  (g.NavMoveDirForDebug = move_dir);
  (g.NavMoveClipDir = clip_dir);
  (g.NavMoveFlags = i32(move_flags));
  (g.NavMoveScrollFlags = i32(scroll_flags));
  (g.NavMoveForwardToNextFrame = Boolean(false));
  (g.NavMoveKeyMods = i32((Boolean(i32((move_flags & i32(512)))) ? 0 : g.IO.KeyMods)));
  g.NavMoveResultLocal.Clear();
  g.NavMoveResultLocalVisible.Clear();
  g.NavMoveResultOther.Clear();
  (g.NavTabbingCounter = i32(0));
  g.NavTabbingResultFirst.Clear();
  NavUpdateAnyRequestFlag();
}

// C/C++ source: source/imgui/src/imgui.cpp:13426
export function NavMoveRequestCancel() {
  let g = cRecordObject(GImGui);
  (g.NavMoveSubmitted = Boolean((g.NavMoveScoringItems = Boolean(false))));
  NavUpdateAnyRequestFlag();
}

// C/C++ source: source/imgui/src/imgui.cpp:13434
export function NavMoveRequestForward(move_dir, clip_dir, move_flags, scroll_flags) {
  let g = cRecordObject(GImGui);
  0;
  NavMoveRequestCancel();
  (g.NavMoveForwardToNextFrame = Boolean(true));
  (g.NavMoveDir = move_dir);
  (g.NavMoveClipDir = clip_dir);
  (g.NavMoveFlags = i32((move_flags | i32(128))));
  (g.NavMoveScrollFlags = i32(scroll_flags));
}

// C/C++ source: source/imgui/src/imgui.cpp:13448
export function NavMoveRequestTryWrapping(window, wrap_flags) {
  let g = cRecordObject(GImGui);
  0;
  if (((cPointerCompare(g.NavWindow, window, "==") && g.NavMoveScoringItems) && (i32(g.NavLayer) == i32(cRecordObject(window).DC.NavLayerCurrent)))) {
    (g.NavMoveFlags = i32((i32((g.NavMoveFlags & (~i32(15)))) | wrap_flags)));
  }
}

// C/C++ source: source/imgui/src/imgui.cpp:13461
export function NavSaveLastChildNavWindowIntoParent(nav_window) {
  let parent = nav_window;
  while (((parent && cPointerCompare(cRecordObject(parent).RootWindow, parent, "!=")) && (i32((cRecordObject(parent).Flags & i32((i32(67108864) | i32(268435456))))) == 0))) {
    (parent = cRecordObject(parent).ParentWindow);
  }
  if ((parent && cPointerCompare(parent, nav_window, "!="))) {
    (cRecordObject(parent).NavLastChildNavWindow = nav_window);
  }
}

// C/C++ source: source/imgui/src/imgui.cpp:13472
export function NavRestoreLastChildNavWindow(window) {
  if ((cRecordObject(window).NavLastChildNavWindow && cRecordObject(cRecordObject(window).NavLastChildNavWindow).WasActive)) {
    return cRecordObject(window).NavLastChildNavWindow;
  }
  return window;
}

// C/C++ source: source/imgui/src/imgui.cpp:13502
export function NavUpdateAnyRequestFlag() {
  let g = cRecordObject(GImGui);
  (g.NavAnyRequest = Boolean(((g.NavMoveScoringItems || g.NavInitRequest) || (Boolean(0) && cPointerCompare(g.NavWindow, null, "!=")))));
  if (g.NavAnyRequest) {
    0;
  }
}

// C/C++ source: source/imgui/src/imgui.cpp:13544
export function NavCalcPreferredRefPosSource(window_type) {
  let g = cRecordObject(GImGui);
  let window = g.NavWindow;
  let activated_shortcut = Boolean((((g.ActiveId != u32(0)) && g.ActiveIdFromShortcut) && (g.ActiveId == g.LastItemData.ID)));
  if ((Boolean(i32((window_type & i32(67108864)))) && activated_shortcut)) {
    return 2;
  }
  if ((((!g.NavCursorVisible) || (!g.NavHighlightItemUnderNav)) || (!window))) {
    return 1;
  } else {
    return 2;
  }
}

// C/C++ source: source/imgui/src/imgui.cpp:13595
export function GetNavTweakPressedAmount(axis) {
  let g = cRecordObject(GImGui);
  let repeat_delay;
  let repeat_rate;
  GetTypematicRepeatRate(i32(8), cRef(() => repeat_delay, __cxx_lvalue_0 => { repeat_delay = __cxx_lvalue_0; }), cRef(() => repeat_rate, __cxx_lvalue_1 => { repeat_rate = __cxx_lvalue_1; }));
  let key_less;
  let key_more;
  if ((i32(g.NavInputSource) == i32(3))) {
    (key_less = ((i32(axis) == i32(0)) ? 638 : 640));
    (key_more = ((i32(axis) == i32(0)) ? 639 : 641));
  } else {
    (key_less = ((i32(axis) == i32(0)) ? 513 : 515));
    (key_more = ((i32(axis) == i32(0)) ? 514 : 516));
  }
  let amount = Math.fround(Math.fround((Math.fround(Math.fround(GetKeyPressedAmount(key_more, repeat_delay, repeat_rate))) - Math.fround(Math.fround(GetKeyPressedAmount(key_less, repeat_delay, repeat_rate))))));
  if ((((amount != Math.fround(0)) && IsKeyDown__cxx_c3e417cdcfae(key_less)) && IsKeyDown__cxx_c3e417cdcfae(key_more))) {
    (amount = Math.fround(Math.fround(0)));
  }
  return Math.fround(amount);
}

// C/C++ source: source/imgui/src/imgui.cpp:13821
export function NavBiasScoringRect(r, preferred_pos_rel, move_dir, move_flags) {
  let g = cRecordObject(GImGui);
  let rel_to_abs_offset = cCopyTrivialClass(cRecordObject(g.NavWindow).DC.CursorStartPos, ImVec2(), ["x", "y"]);
  if ((i32((move_flags & i32(128))) == 0)) {
    if ((preferred_pos_rel.x == Math.fround(3.40282347E+38))) {
      (preferred_pos_rel.x = Math.fround(Math.fround((ImMin(Math.fround((r.Min.x + Math.fround(1))), r.Max.x) - rel_to_abs_offset.x))));
    }
    if ((preferred_pos_rel.y == Math.fround(3.40282347E+38))) {
      (preferred_pos_rel.y = Math.fround(Math.fround((r.GetCenter().y - rel_to_abs_offset.y))));
    }
  }
  if ((((i32(move_dir) == i32(2)) || (i32(move_dir) == i32(3))) && (preferred_pos_rel.x != Math.fround(3.40282347E+38)))) {
    (r.Min.x = Math.fround((r.Max.x = Math.fround(Math.fround((preferred_pos_rel.x + rel_to_abs_offset.x))))));
  } else {
    if ((((i32(move_dir) == i32(0)) || (i32(move_dir) == i32(1))) && (preferred_pos_rel.y != Math.fround(3.40282347E+38)))) {
      (r.Min.y = Math.fround((r.Max.y = Math.fround(Math.fround((preferred_pos_rel.y + rel_to_abs_offset.y))))));
    }
  }
}

// C/C++ source: source/imgui/src/imgui.cpp:13969
export function NavUpdateCreateTabbingRequest() {
  let g = cRecordObject(GImGui);
  let window = g.NavWindow;
  0;
  if (((cPointerCompare(window, null, "==") || cPointerCompare(g.NavWindowingTarget, null, "!=")) || Boolean(i32((cRecordObject(window).Flags & i32(65536)))))) {
    return;
  }
  let tab_pressed = Boolean(((IsKeyPressed__cxx_c61e6e0d2e05(512, i32(1), u32((-1))) && (!g.IO.KeyCtrl)) && (!g.IO.KeyAlt)));
  if ((!tab_pressed)) {
    return;
  }
  let nav_keyboard_active = Boolean((i32((g.IO.ConfigFlags & i32(1))) != 0));
  if (nav_keyboard_active) {
    (g.NavTabbingDir = i32((g.IO.KeyShift ? (-1) : (((i32(g.NavCursorVisible) == i32(false)) && (g.ActiveId == u32(0))) ? 0 : (+1)))));
  } else {
    (g.NavTabbingDir = i32((g.IO.KeyShift ? (-1) : ((g.ActiveId == u32(0)) ? 0 : (+1)))));
  }
  let move_flags = i32((i32(1024) | i32(4096)));
  let scroll_flags = i32((cRecordObject(window).Appearing ? i32((i32(1) | i32(32))) : i32((i32(1) | i32(2)))));
  let clip_dir = ((g.NavTabbingDir < 0) ? 2 : 3);
  NavMoveRequestSubmit(-1, clip_dir, move_flags, scroll_flags);
  (g.NavTabbingCounter = i32((-1)));
}

// C/C++ source: source/imgui/src/imgui.cpp:14325
export function IsWindowNavFocusable(window) {
  return Boolean(((cRecordObject(window).WasActive && cPointerCompare(window, cRecordObject(window).RootWindow, "==")) && (!Boolean(i32((cRecordObject(window).Flags & i32(131072)))))));
}

// C/C++ source: source/imgui/src/imgui.cpp:14586
const __cxx_literal_e1b6c63bd81d4b413478 = Uint8Array.from([35, 35, 77, 97, 105, 110, 77, 101, 110, 117, 66, 97, 114, 0]);
export function GetFallbackWindowNameForWindowingList(window) {
  if (Boolean(i32((cRecordObject(window).Flags & i32(67108864))))) {
    return LocalizeGetMsg(6);
  }
  if ((Boolean(i32((cRecordObject(window).Flags & i32(1024)))) && (cByteMemory.strcmp(cRecordObject(window).Name, __cxx_literal_e1b6c63bd81d4b413478) == 0))) {
    return LocalizeGetMsg(5);
  }
  return LocalizeGetMsg(7);
}

// C/C++ source: source/imgui/src/imgui.cpp:14631
export function IsDragDropActive() {
  let g = cRecordObject(GImGui);
  return Boolean(g.DragDropActive);
}

// C/C++ source: source/imgui/src/imgui.cpp:14803
export function SetDragDropPayload(type, data, data_size, cond) {
  let g = cRecordObject(GImGui);
  let payload = g.DragDropPayload;
  if ((cond == 0)) {
    (cond = i32(1));
  }
  0;
  0;
  0;
  0;
  0;
  if (((cond == i32(1)) || (payload.DataFrameCount == (-1)))) {
    ImStrncpy(payload.DataType, type, u64(i32((BigInt(33) / BigInt(1)))));
    g.DragDropPayloadBufHeap.resize(0);
    if ((data_size > 16)) {
      g.DragDropPayloadBufHeap.resize(i32(data_size));
      (payload.Data = g.DragDropPayloadBufHeap.Data);
      cByteMemory.memcpy(payload.Data, data, data_size);
    } else {
      if ((data_size > u64(0))) {
        cByteMemory.memset(cObjectFieldRef(g, "DragDropPayloadBufLocal"), 0, 16);
        (payload.Data = g.DragDropPayloadBufLocal);
        cByteMemory.memcpy(payload.Data, data, data_size);
      } else {
        (payload.Data = null);
      }
    }
    (payload.DataSize = i32(data_size));
  }
  (payload.DataFrameCount = i32(g.FrameCount));
  return Boolean(((g.DragDropAcceptFrameCount == g.FrameCount) || (g.DragDropAcceptFrameCount == i32((g.FrameCount - 1)))));
}

// C/C++ source: source/imgui/src/imgui.cpp:14931
export function IsDragDropPayloadBeingAccepted() {
  let g = cRecordObject(GImGui);
  return Boolean((g.DragDropActive && (g.DragDropAcceptIdPrev != u32(0))));
}

// C/C++ source: source/imgui/src/imgui.cpp:15003
export function RenderDragDropTargetRectEx(draw_list, bb) {
  let g = cRecordObject(GImGui);
  cRecordObject(draw_list).AddRectFilled(bb.Min, bb.Max, GetColorU32__cxx_b10e13290aef(i32(54), Math.fround(1)), g.Style.DragDropTargetRounding, 0);
  cRecordObject(draw_list).AddRect(bb.Min, bb.Max, GetColorU32__cxx_b10e13290aef(i32(53), Math.fround(1)), g.Style.DragDropTargetRounding, 0, g.Style.DragDropTargetBorderSize);
}

// C/C++ source: source/imgui/src/imgui.cpp:15010
export function GetDragDropPayload() {
  let g = cRecordObject(GImGui);
  return ((g.DragDropActive && (g.DragDropPayload.DataFrameCount != (-1))) ? cObjectFieldRef(g, "DragDropPayload") : null);
}

// C/C++ source: source/imgui/src/imgui.cpp:15133
export function LogBegin(flags, auto_open_depth) {
  let g = cRecordObject(GImGui);
  let window = g.CurrentWindow;
  0;
  0;
  0;
  (g.LogEnabled = Boolean((g.ItemUnclipByLog = Boolean(true))));
  (g.LogFlags = i32(flags));
  (g.LogWindow = window);
  (g.LogNextPrefix = (g.LogNextSuffix = null));
  (g.LogDepthRef = i32(cRecordObject(window).DC.TreeDepth));
  (g.LogDepthToExpand = i32(((auto_open_depth >= 0) ? auto_open_depth : g.LogDepthToExpandDefault)));
  (g.LogLinePosY = Math.fround(Math.fround(3.40282347E+38)));
  (g.LogLineFirstItem = Boolean(true));
}

// C/C++ source: source/imgui/src/imgui.cpp:15152
export function LogSetNextTextDecoration(prefix, suffix) {
  let g = cRecordObject(GImGui);
  (g.LogNextPrefix = prefix);
  (g.LogNextSuffix = suffix);
}

// C/C++ source: source/imgui/src/imgui.cpp:15197
export function LogToClipboard(auto_open_depth) {
  let g = cRecordObject(GImGui);
  if (g.LogEnabled) {
    return;
  }
  LogBegin(i32(8), auto_open_depth);
}

// C/C++ source: source/imgui/src/imgui.cpp:15205
export function LogToBuffer(auto_open_depth) {
  let g = cRecordObject(GImGui);
  if (g.LogEnabled) {
    return;
  }
  LogBegin(i32(4), auto_open_depth);
}

// C/C++ source: source/imgui/src/imgui.cpp:15323
export function MarkIniSettingsDirty__cxx_dd9b6e45b1cd() {
  let g = cRecordObject(GImGui);
  if ((g.SettingsDirtyTimer <= Math.fround(0))) {
    (g.SettingsDirtyTimer = Math.fround(g.IO.IniSavingRate));
  }
}

// C/C++ source: source/imgui/src/imgui.cpp:15330
export function MarkIniSettingsDirty__cxx_d4c2d33d4080(window) {
  let g = cRecordObject(GImGui);
  if ((!Boolean(i32((cRecordObject(window).Flags & i32(256)))))) {
    if ((g.SettingsDirtyTimer <= Math.fround(0))) {
      (g.SettingsDirtyTimer = Math.fround(g.IO.IniSavingRate));
    }
  }
}

// C/C++ source: source/imgui/src/imgui.cpp:15338
export function AddSettingsHandler(handler) {
  let g = cRecordObject(GImGui);
  0;
  g.SettingsHandlers.push_back(cRecordObject(handler));
}

// C/C++ source: source/imgui/src/imgui.cpp:15506
export function FindWindowSettingsByID(id) {
  let g = cRecordObject(GImGui);
  for (let settings = g.SettingsWindows.begin(); cPointerCompare(settings, null, "!="); (settings = g.SettingsWindows.next_chunk(settings))) {
    if (((cRecordObject(settings).ID == id) && (!cRecordObject(settings).WantDelete))) {
      return settings;
    }
  }
  return null;
}

// C/C++ source: source/imgui/src/imgui.cpp:15516
export function FindWindowSettingsByWindow(window) {
  let g = cRecordObject(GImGui);
  if ((cRecordObject(window).SettingsOffset != (-1))) {
    return g.SettingsWindows.ptr_from_offset(cRecordObject(window).SettingsOffset);
  }
  return FindWindowSettingsByID(cRecordObject(window).ID);
}

// C/C++ source: source/imgui/src/imgui.cpp:15538
export function WindowSettingsHandler_ClearAll(ctx, arg1) {
  let g = cRecordObject(ctx);
  {
    const __cxx_span_0 = cxxPointerSpan(g.Windows, "Data", "Size", 8);
    for (let __cxx_span_i_0 = 0; __cxx_span_i_0 < __cxx_span_0.length; ++__cxx_span_i_0) {
      (cRecordObject(__cxx_span_0.get(__cxx_span_i_0)).SettingsOffset = i32((-1)));
    }
  }
  g.SettingsWindows.clear();
}

// C/C++ source: source/imgui/src/imgui.cpp:15635
export function LocalizeRegisterEntries(entries, count) {
  let g = cRecordObject(GImGui);
  for (let n = i32(0); (n < count); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => n, __cxx_lvalue_1 => { n = __cxx_lvalue_1; }))) {
    ((cPointerElementRef(g.LocalizationTable, (cPointerElementRef(entries, n).value).Key).value) = (cPointerElementRef(entries, n).value).Text);
  }
}

// C/C++ source: source/imgui/src/imgui.cpp:15675
export function SetWindowViewport(window, viewport) {
  (cRecordObject(window).Viewport = viewport);
}

// C/C++ source: source/imgui/src/imgui.cpp:15847
export function Platform_GetClipboardTextFn_DefaultImpl(ctx) {
  let g = cRecordObject(ctx);
  return (g.ClipboardHandlerData.empty() ? null : g.ClipboardHandlerData.begin());
}

// C/C++ source: source/imgui/src/imgui.cpp:15959
export function Platform_SetImeDataFn_DefaultImpl(arg0, arg1, arg2) {

}

// C/C++ source: source/imgui/src/imgui.cpp:16177
export function DebugTextureIDToU64(tex_id) {
  let v = u64(0);
  cByteMemory.memcpy(cRef(() => v, __cxx_lvalue_0 => { v = __cxx_lvalue_0; }), cRef(() => tex_id, __cxx_lvalue_1 => { tex_id = __cxx_lvalue_1; }), ImMin(8, 8));
  return v;
}

// C/C++ source: source/imgui/src/imgui.cpp:16974
export function DebugBreakClearData() {
  let g = cRecordObject(GImGui);
  (g.DebugBreakInWindow = u32(0));
  (g.DebugBreakInTable = u32(0));
  (g.DebugBreakInShortcutRouting = i32(0));
}

// C/C++ source: source/imgui/src/imgui.cpp:17795
export const DEBUG_LOCATE_ITEM_COLOR = u32((u32((u32((u32((u32(255) << 24)) | u32((u32(0) << 16)))) | u32((u32(255) << 8)))) | u32((u32(0) << 0))));
function __cxx_static_address_a7657de8d2930fde5c68fbd9() {
  return __cxx_static_address_a7657de8d2930fde5c68fbd9.reference || (__cxx_static_address_a7657de8d2930fde5c68fbd9.reference = {
    __cReference: true,
    get value() { return DEBUG_LOCATE_ITEM_COLOR; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/imgui/src/imgui.cpp:17797
export function DebugLocateItem(target_id) {
  let g = cRecordObject(GImGui);
  (g.DebugLocateId = u32(target_id));
  (g.DebugLocateFrames = ((((2) & 255)) & 255));
  (g.DebugBreakInLocateId = Boolean(false));
}

// C/C++ source: source/imgui/src/imgui.cpp:17842
export function DebugStartItemPicker() {
  let g = cRecordObject(GImGui);
  (g.DebugItemPickerActive = Boolean(true));
}

// C/C++ source: source/imgui/include/imgui_internal.h:521
export function ImLengthSqr(lhs) {
  return Math.fround(Math.fround((Math.fround((lhs.x * lhs.x)) + Math.fround((lhs.y * lhs.y)))));
}

// C/C++ source: source/imgui/include/imgui.h:2900
export function __cxx_operator_71e4282592b4c08b(lhs, rhs) {
  return cCopyTrivialClass((ImVec2()).__cxx_construct_edecdff36a89174e(Math.fround((lhs.x - rhs.x)), Math.fround((lhs.y - rhs.y))), ImVec2(), ["x", "y"]);
}

// C/C++ source: source/imgui/include/imgui.h:2899
export function __cxx_operator_e11e480209a9c93d(lhs, rhs) {
  return cCopyTrivialClass((ImVec2()).__cxx_construct_edecdff36a89174e(Math.fround((lhs.x + rhs.x)), Math.fround((lhs.y + rhs.y))), ImVec2(), ["x", "y"]);
}

// C/C++ source: source/imgui/include/imgui.h:2898
export function __cxx_operator_372b2b6ad9d13c9e(lhs, rhs) {
  return cCopyTrivialClass((ImVec2()).__cxx_construct_edecdff36a89174e(Math.fround((lhs.x / rhs)), Math.fround((lhs.y / rhs))), ImVec2(), ["x", "y"]);
}

// C/C++ source: source/imgui/include/imgui.h:2897
export function __cxx_operator_5cbbdd7bd8f48e39(lhs, rhs) {
  return cCopyTrivialClass((ImVec2()).__cxx_construct_edecdff36a89174e(Math.fround((lhs.x * rhs)), Math.fround((lhs.y * rhs))), ImVec2(), ["x", "y"]);
}

// C/C++ source: source/imgui/include/imgui_internal.h:401
export function ImToUpper(c) {
  return (((((i32(c) >= i32(97)) && (i32(c) <= i32(122))) ? (c = (((c & (~32))) & 255)) : c)) & 255);
}

// C/C++ source: source/imgui/include/imgui_internal.h:520
export function ImSaturate(f) {
  return Math.fround(((f < Math.fround(0)) ? Math.fround(0) : ((f > Math.fround(1)) ? Math.fround(1) : f)));
}

// C/C++ source: source/imgui/include/imgui_internal.h:536
export function ImIsFloatAboveGuaranteedIntegerPrecision(f) {
  return Boolean(((f <= Math.fround((-16777216))) || (f >= Math.fround(16777216))));
}

// C/C++ source: source/imgui/include/imgui_internal.h:402
export function ImCharIsBlankA(c) {
  return Boolean(((i32(c) == i32(32)) || (i32(c) == i32(9))));
}

// C/C++ source: source/imgui/include/imgui_internal.h:525
export function ImTrunc__cxx_60cf3ae97be4(v) {
  return cCopyTrivialClass((ImVec2()).__cxx_construct_edecdff36a89174e(Math.fround(Math.fround(i32(v.x))), Math.fround(Math.fround(i32(v.y)))), ImVec2(), ["x", "y"]);
}

// C/C++ source: source/imgui/include/imgui_internal.h:3156
export function GetCurrentWindow() {
  let g = cRecordObject(GImGui);
  (cRecordObject(g.CurrentWindow).WriteAccessed = Boolean(true));
  return g.CurrentWindow;
}

// C/C++ source: source/imgui/include/imgui_internal.h:515
export function ImMax(lhs, rhs) {
  return cCopyTrivialClass((ImVec2()).__cxx_construct_edecdff36a89174e(((lhs.x >= rhs.x) ? lhs.x : rhs.x), ((lhs.y >= rhs.y) ? lhs.y : rhs.y)), ImVec2(), ["x", "y"]);
}

// C/C++ source: source/imgui/include/imgui_internal.h:528
export function ImTrunc64(f) {
  return Math.fround(Math.fround(Math.fround(i64(f))));
}

// C/C++ source: source/imgui/include/imgui_internal.h:514
export function ImMin(lhs, rhs) {
  return cCopyTrivialClass((ImVec2()).__cxx_construct_edecdff36a89174e(((lhs.x < rhs.x) ? lhs.x : rhs.x), ((lhs.y < rhs.y) ? lhs.y : rhs.y)), ImVec2(), ["x", "y"]);
}

// C/C++ source: source/imgui/include/imgui_internal.h:516
export function ImClamp(v, mn, mx) {
  return cCopyTrivialClass((ImVec2()).__cxx_construct_edecdff36a89174e(((v.x < mn.x) ? mn.x : ((v.x > mx.x) ? mx.x : v.x)), ((v.y < mn.y) ? mn.y : ((v.y > mx.y) ? mx.y : v.y))), ImVec2(), ["x", "y"]);
}

// C/C++ source: source/imgui/include/imgui_internal.h:518
export function ImLerp__cxx_d40d5a63fc9a(a, b, t) {
  return cCopyTrivialClass((ImVec2()).__cxx_construct_edecdff36a89174e(Math.fround((a.x + Math.fround((Math.fround((b.x - a.x)) * t.x)))), Math.fround((a.y + Math.fround((Math.fround((b.y - a.y)) * t.y))))), ImVec2(), ["x", "y"]);
}

// C/C++ source: source/imgui/include/imgui.h:2907
export function __cxx_operator_995b9ee94a909dc6(lhs, rhs) {
  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = Math.fround((__cxx_lvalue_0.value - rhs.x))))(cObjectFieldRef(lhs, "x"));
  ((__cxx_lvalue_1) => (__cxx_lvalue_1.value = Math.fround((__cxx_lvalue_1.value - rhs.y))))(cObjectFieldRef(lhs, "y"));
  return lhs;
}

// C/C++ source: source/imgui/include/imgui.h:2901
export function __cxx_operator_3aa49dcb444e7888(lhs, rhs) {
  return cCopyTrivialClass((ImVec2()).__cxx_construct_edecdff36a89174e(Math.fround((lhs.x * rhs.x)), Math.fround((lhs.y * rhs.y))), ImVec2(), ["x", "y"]);
}

// C/C++ source: source/imgui/include/imgui_internal.h:3154
export function GetScale() {
  let g = cRecordObject(GImGui);
  return Math.fround(g.Style._MainScale);
}

// C/C++ source: source/imgui/include/imgui.h:2906
export function __cxx_operator_a3e4877983633319(lhs, rhs) {
  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = Math.fround((__cxx_lvalue_0.value + rhs.x))))(cObjectFieldRef(lhs, "x"));
  ((__cxx_lvalue_1) => (__cxx_lvalue_1.value = Math.fround((__cxx_lvalue_1.value + rhs.y))))(cObjectFieldRef(lhs, "y"));
  return lhs;
}

// C/C++ source: source/imgui/include/imgui_internal.h:524
export function ImTrunc__cxx_6fee328fee59(f) {
  return Math.fround(Math.fround(Math.fround(i32(f))));
}

// C/C++ source: source/imgui/include/imgui_internal.h:382
export function ImCountSetBits(v) {
  let count = u32(0);
  while ((v > u32(0))) {
    (v = u32((v & u32((v - u32(1))))));
    ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = u32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => count, __cxx_lvalue_1 => { count = __cxx_lvalue_1; }));
  }
  return u32(count);
}

// C/C++ source: source/imgui/include/imgui_internal.h:526
export function ImFloor__cxx_3285f1b0429c(f) {
  return Math.fround(Math.fround(Math.fround((((f >= Math.fround(0)) || (Math.fround(Math.fround(i32(f))) == f)) ? i32(f) : i32((i32(f) - 1))))));
}

// C/C++ source: source/imgui/include/imgui_internal.h:3155
export function GetCurrentWindowRead() {
  let g = cRecordObject(GImGui);
  return g.CurrentWindow;
}

// C/C++ source: source/imgui/include/imgui_internal.h:3200
export function GetRoundedFontSize(size) {
  return Math.fround(Math.fround(Math.fround(i32(Math.fround((size + Math.fround(0.5)))))));
}

// C/C++ source: source/imgui/include/imgui_internal.h:3372
export function IsLRModKey(key) {
  return Boolean(((i32(key) >= i32(527)) && (i32(key) <= i32(534))));
}

// C/C++ source: source/imgui/include/imgui_internal.h:3374
export function ConvertSingleModFlagToKey(key) {
  if ((i32(key) == i32(4096))) {
    return 663;
  }
  if ((i32(key) == i32(8192))) {
    return 664;
  }
  if ((i32(key) == i32(16384))) {
    return 665;
  }
  if ((i32(key) == i32(32768))) {
    return 666;
  }
  return key;
}

// C/C++ source: source/imgui/include/imgui_internal.h:3365
export function IsNamedKey(key) {
  return Boolean(((i32(key) >= i32(512)) && (i32(key) < i32(667))));
}

// C/C++ source: source/imgui/include/imgui_internal.h:3384
export function GetKeyData__cxx_c4423be9e248(key) {
  let g = cRecordObject(GImGui);
  return GetKeyData__cxx_50185bb07026(cRef(() => g, __cxx_lvalue_0 => { g = __cxx_lvalue_0; }), key);
}

// C/C++ source: source/imgui/include/imgui_internal.h:3412
export function GetKeyOwnerData(ctx, key) {
  if (Boolean(i32((i32(key) & i32(61440))))) {
    (key = ConvertSingleModFlagToKey(key));
  }
  0;
  return cPointerOffset(cRecordObject(ctx).KeysOwnerData, i32((i32(key) - i32(512))), 12);
}

// C/C++ source: source/imgui/include/imgui_internal.h:3386
export function MouseButtonToKey(button) {
  0;
  return i32((i32(656) + button));
}

// C/C++ source: source/imgui/include/imgui_internal.h:3368
export function IsKeyboardKey(key) {
  return Boolean(((i32(key) >= i32(512)) && (i32(key) < i32(632))));
}

// C/C++ source: source/imgui/include/imgui_internal.h:527
export function ImFloor__cxx_ad07f024365b(v) {
  return cCopyTrivialClass((ImVec2()).__cxx_construct_edecdff36a89174e(ImFloor__cxx_3285f1b0429c(v.x), ImFloor__cxx_3285f1b0429c(v.y)), ImVec2(), ["x", "y"]);
}

// C/C++ source: source/imgui/include/imgui_internal.h:493
export function ImAbs(x) {
  return Math.fround(fabsf(x));
}

// C/C++ source: source/imgui/include/imgui.h:2902
export function __cxx_operator_7a54e7b7f8c4fe13(lhs, rhs) {
  return cCopyTrivialClass((ImVec2()).__cxx_construct_edecdff36a89174e(Math.fround((lhs.x / rhs.x)), Math.fround((lhs.y / rhs.y))), ImVec2(), ["x", "y"]);
}

// C/C++ source: source/imgui/include/imgui_internal.h:537
export function ImExponentialMovingAverage(avg, sample, n) {
  (avg = Math.fround((avg - Math.fround((avg / Math.fround(n))))));
  (avg = Math.fround((avg + Math.fround((sample / Math.fround(n))))));
  return Math.fround(avg);
}

// C/C++ source: source/imgui/include/imgui_internal.h:3366
export function IsNamedKeyOrMod(key) {
  return Boolean(((((((i32(key) >= i32(512)) && (i32(key) < i32(667))) || (i32(key) == i32(4096))) || (i32(key) == i32(8192))) || (i32(key) == i32(16384))) || (i32(key) == i32(32768))));
}

// C/C++ source: source/imgui/include/imgui_internal.h:519
export function ImLerp__cxx_869b70193519(a, b, t) {
  return cCopyTrivialClass((ImVec4()).__cxx_construct_33e919b602ff0017(Math.fround((a.x + Math.fround((Math.fround((b.x - a.x)) * t)))), Math.fround((a.y + Math.fround((Math.fround((b.y - a.y)) * t)))), Math.fround((a.z + Math.fround((Math.fround((b.z - a.z)) * t)))), Math.fround((a.w + Math.fround((Math.fround((b.w - a.w)) * t))))), ImVec4(), ["x", "y", "z", "w"]);
}

// C/C++ source: source/imgui/include/imgui_internal.h:529
export function ImRound64(f) {
  return Math.fround(Math.fround(Math.fround(i64(Math.fround((f + Math.fround(0.5)))))));
}

// C/C++ source: source/imgui/include/imgui_internal.h:3394
export function IsActiveIdUsingNavDir(dir) {
  let g = cRecordObject(GImGui);
  return Boolean((u32((g.ActiveIdUsingNavDirMask & u32(i32((1 << i32(dir)))))) != u32(0)));
}

// C/C++ source: source/imgui/include/imgui_internal.h:3249
const __cxx_literal_2a437ddecd02200c434f = Uint8Array.from([42, 77, 105, 115, 115, 105, 110, 103, 32, 84, 101, 120, 116, 42, 0]);
export function LocalizeGetMsg(key) {
  let g = cRecordObject(GImGui);
  let msg = (cPointerElementRef(g.LocalizationTable, key).value);
  return (msg ? msg : __cxx_literal_2a437ddecd02200c434f);
}

// C/C++ source: source/imgui/include/imgui_internal.h:3814
export function ImFontAtlasRectId_Make(index_idx, gen_idx) {
  0;
  return i32((index_idx | i32((gen_idx << 20))));
}

// C/C++ source: source/imgui/include/imgui_internal.h:549
export function ImTriangleArea(a, b, c) {
  return Math.fround(Math.fround((fabsf(Math.fround((Math.fround((Math.fround((a.x * Math.fround((b.y - c.y)))) + Math.fround((b.x * Math.fround((c.y - a.y)))))) + Math.fround((c.x * Math.fround((a.y - b.y))))))) * Math.fround(0.5))));
}

// C/C++ source: source/imgui/include/imgui_internal.h:404
export function ImCharIsXdigitA(c) {
  return Boolean(((((i32(c) >= i32(48)) && (i32(c) <= i32(57))) || ((i32(c) >= i32(65)) && (i32(c) <= i32(70)))) || ((i32(c) >= i32(97)) && (i32(c) <= i32(102)))));
}
