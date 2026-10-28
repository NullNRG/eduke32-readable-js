// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/duke3d/src/common.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
import { FindGroup } from "./grpscan.cpp.mjs";
import { __cxx_global_cell_c55d5c171c5137818b672aba } from "../../build/src/engine.cpp.mjs";
import { __cxx_global_cell_11016d3c7177543e564ab46c } from "../../build/src/compat.cpp.mjs";
import { __cxx_global_cell_dad5bc86f245af7b0202a36f } from "../../build/src/engine.cpp.mjs";
import { __cxx_global_cell_0d84c36af55f8d659082f1bb } from "../../build/src/engine.cpp.mjs";
import { __cxx_global_cell_657da161243aac44db0e415b } from "../../build/src/engine.cpp.mjs";
import { removesearchpaths_withuser } from "../../build/src/vfs.cpp.mjs";
import { __cxx_global_cell_9d5d7fcf3aa35a4809f92551 } from "../../build/src/engine.cpp.mjs";

// Bounded source-language pointer aliases over native JS typed buffers/arrays.
// Embedded in generated ES modules; never a CPU, ISA or opcode interpreter.
const cPointer = source => {
  if (source?.__cDeferredPointer === true) return cPointer(source.resolve());
  if (source && source.__cPointer === true) return source;
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
    if (index!==0) throw new RangeError('C single-object pointer escapes original storage');
    return source;
  }
  const pointer=cPointer(source);
  if (!pointer.array) {
    const allocation=globalThis[Symbol.for('source-first.pointer-array-allocations/1')]?.get(pointer.buffer);
    const offset=pointer.offset+index*8;
    if(!allocation)throw new TypeError('C aggregate/pointer slot requires a proven source array');
    if(!Number.isSafeInteger(offset)||offset%8||offset<pointer.lower||offset+8>pointer.upper||
        offset<allocation.lower||offset+8>allocation.upper)throw new RangeError('Pointer slot escapes original LP64 allocation');
    return {get value(){return allocation.read(offset);},set value(value){allocation.write(offset,value);}};
  }
  const stride=pointer.stride || 1;
  const offset=pointer.offset+index*stride;
  if (!Number.isSafeInteger(offset) || offset<pointer.lower || offset>=pointer.upper || offset%stride)
    throw new RangeError('C aggregate/pointer array index escapes original bounds');
  const slot=offset/stride;
  return {get value(){return pointer.buffer[slot];},set value(next){pointer.buffer[slot]=next;}};
};
const cTypedPointer = (source, Type) => {
  if (!Type || !Number.isSafeInteger(Type.BYTES_PER_ELEMENT)) throw new TypeError('Unsupported pointer element type');
  if (source===null) return null;
  const pointerBytes=source?.[Symbol.for('source-first.clang-byte-record-array/1')];
  if(pointerBytes)return cPointer(pointerBytes);
  if (Array.isArray(source)) return { ...cPointer(source), upper:source.length*Type.BYTES_PER_ELEMENT, stride:Type.BYTES_PER_ELEMENT };
  return cPointer(source);
};
const cPointerOffset = (source, delta, stride=1) => {
  const initial=cPointer(source);
  const p=Array.isArray(source) ? {...initial, upper:source.length*stride, stride} : initial;
  if (p.array && p.stride!==stride) throw new TypeError('Cannot reinterpret JS numeric-array element widths');
  const change=Number(delta)*stride, next=p.offset+change;
  if (!Number.isSafeInteger(change) || !Number.isSafeInteger(next) || next<p.lower || next>p.upper)
    throw new RangeError('C pointer escapes original array bounds');
  return { ...p, offset:next };
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
  if (left?.__cReference===true || right?.__cReference===true) {
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
  const a=Array.isArray(left) ? {...cPointer(left),upper:left.length*stride,stride} : cPointer(left);
  const b=Array.isArray(right) ? {...cPointer(right),upper:right.length*stride,stride} : cPointer(right);
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
  if (source?.__cPointer === true) {
    if (!source.array) throw new TypeError("C record pointer requires source-backed object slots");
    return cPointerElementRef(source,0).value;
  }
  return source;
};
const cStaticReference = resolve => ({ __cReference:true, __cDeferredReference:true, resolve, get value() { return resolve().value; }, set value(value) { resolve().value=value; } });
const cObjectFieldRef = (owner, field) => { const key=Symbol.for("source-object-field-references/1"); if (!Object.hasOwn(owner,key)) Object.defineProperty(owner,key,{value:new Map()}); const refs=owner[key]; if (!refs.has(field)) refs.set(field,{__cReference:true,get value(){return owner[field];},set value(value){owner[field]=value;}}); return refs.get(field); };
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
    if (value?.__cReference===true) {
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
const cPointerArray = (count, values=[]) => {
  if(!Number.isSafeInteger(count)||count<0||count>1000000||!Array.isArray(values)||values.length>count)
    throw new RangeError('Invalid original pointer-array extent');
  const bytes=new Uint8Array(count*8),view=new DataView(bytes.buffer),slots=new Array(count).fill(null);
  const allocationKey=Symbol.for('source-first.pointer-array-allocations/1');
  const allocations=globalThis[allocationKey]||(globalThis[allocationKey]=new WeakMap());
  allocations.set(bytes.buffer,{lower:0,upper:bytes.length,
    read:offset=>cByteRecordPointers.decode(view.getBigUint64(offset,true)),
    write:(offset,value)=>view.setBigUint64(offset,cByteRecordPointers.encode(value),true)});
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
    if (field.pointer) {
      if (field.pointer!==true || field.size!==8 || field.offset+8>bytes.length)
        throw new TypeError('Pointer field differs from verified LP64 ABI');
      Object.defineProperty(result,name,{enumerable:true,
        get:()=>cByteRecordPointers.decode(view.getBigUint64(field.offset,true)),
        set:value=>view.setBigUint64(field.offset,cByteRecordPointers.encode(value),true)});
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
    if (field.byteRecord) {
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
const cByteRecordArray = (schema, count, prototypes={}) => {
  if (!Number.isSafeInteger(count) || count < 1 || count > 1000000 ||
      !Number.isSafeInteger(schema?.size) || schema.size < 1 ||
      schema.size > 1048576 || count * schema.size > 268435456)
    throw new RangeError('C record array exceeds proven bounded storage');
  const bytes = new Uint8Array(count * schema.size);
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
  return new Proxy(records, {
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
};

// Readable JS representation of Clang-proven pointer-free C/C++ POD copies.
// Fail closed if external storage has not been materialized in the agreed type.
const cCopyAggregate = (value, schema) => {
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

const i32 = value => Number(value) | 0;
const u32 = value => Number(value) >>> 0;
const i64 = value => BigInt.asIntN(64, BigInt(value));
const u64 = value => BigInt.asUintN(64, BigInt(value));

// C/C++ source: source/build/include/fix16.h:111
export const fix16_rad_to_deg_mult__header_global_c392030c5eee2ffd = i32(3754936);
function __cxx_static_address_d524c6f22dbc9ce103a2538b() {
  return __cxx_static_address_d524c6f22dbc9ce103a2538b.reference || (__cxx_static_address_d524c6f22dbc9ce103a2538b.reference = {
    __cReference: true,
    get value() { return fix16_rad_to_deg_mult__header_global_c392030c5eee2ffd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:114
export const fix16_deg_to_rad_mult__header_global_7afb8ffba83f69b5 = i32(1144);
function __cxx_static_address_9e25d2ee3adaebec7f5c4afe() {
  return __cxx_static_address_9e25d2ee3adaebec7f5c4afe.reference || (__cxx_static_address_9e25d2ee3adaebec7f5c4afe.reference = {
    __cReference: true,
    get value() { return fix16_deg_to_rad_mult__header_global_7afb8ffba83f69b5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/mio.hpp:133
export const invalid_handle__header_global_15b8ed457b1d4b60 = i32((-1));
function __cxx_static_address_36ce449cba379b6c86616779() {
  return __cxx_static_address_36ce449cba379b6c86616779.reference || (__cxx_static_address_36ce449cba379b6c86616779.reference = {
    __cReference: true,
    get value() { return invalid_handle__header_global_15b8ed457b1d4b60; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/common.cpp:23
export let g_selectedGrp = null;
export function __cxx_global_cell_ec0dcd0ae3bfe5db091cb9c1() {
  return __cxx_global_cell_ec0dcd0ae3bfe5db091cb9c1.reference || (__cxx_global_cell_ec0dcd0ae3bfe5db091cb9c1.reference = {
    __cReference: true,
    get value() { return g_selectedGrp; },
    set value(__cxx_lvalue_0) { g_selectedGrp = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/duke3d/src/common.cpp:25
export let g_gameType = i32(1);
export function __cxx_global_cell_c0e288040dbf9a805036c27d() {
  return __cxx_global_cell_c0e288040dbf9a805036c27d.reference || (__cxx_global_cell_c0e288040dbf9a805036c27d.reference = {
    __cReference: true,
    get value() { return g_gameType; },
    set value(__cxx_lvalue_0) { g_gameType = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/common.cpp:26
export let g_addonNum = i32(0);
export function __cxx_global_cell_e52bb48b6936f3f6004987dc() {
  return __cxx_global_cell_e52bb48b6936f3f6004987dc.reference || (__cxx_global_cell_e52bb48b6936f3f6004987dc.reference = {
    __cReference: true,
    get value() { return g_addonNum; },
    set value(__cxx_lvalue_0) { g_addonNum = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/common.cpp:30
export let g_gameNamePtr = null;
export function __cxx_global_cell_89ad8e829e72a552238d5b24() {
  return __cxx_global_cell_89ad8e829e72a552238d5b24.reference || (__cxx_global_cell_89ad8e829e72a552238d5b24.reference = {
    __cReference: true,
    get value() { return g_gameNamePtr; },
    set value(__cxx_lvalue_0) { g_gameNamePtr = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/duke3d/src/common.cpp:34
export let defaultconfilename = Uint8Array.from([71, 65, 77, 69, 46, 67, 79, 78, 0]);
function __cxx_static_address_e24292b1a478e46d067a49db() {
  return __cxx_static_address_e24292b1a478e46d067a49db.reference || (__cxx_static_address_e24292b1a478e46d067a49db.reference = {
    __cReference: true,
    get value() { return defaultconfilename; },
    set value(__cxx_lvalue_0) { defaultconfilename = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/duke3d/src/common.cpp:36
export const defaultgamegrp = cPointerArray(4, [Uint8Array.from([68, 85, 75, 69, 51, 68, 46, 71, 82, 80, 0]), Uint8Array.from([78, 65, 77, 46, 71, 82, 80, 0]), Uint8Array.from([78, 65, 80, 65, 76, 77, 46, 71, 82, 80, 0]), Uint8Array.from([87, 87, 50, 71, 73, 46, 71, 82, 80, 0])]);
function __cxx_static_address_772672747e1971414d8a0a79() {
  return __cxx_static_address_772672747e1971414d8a0a79.reference || (__cxx_static_address_772672747e1971414d8a0a79.reference = {
    __cReference: true,
    get value() { return defaultgamegrp; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:31
export const FIX16_MAX__header_global_a231de8f988765a4 = i32(2147483647);
function __cxx_static_address_f06f9468a34714a6e1c3f498() {
  return __cxx_static_address_f06f9468a34714a6e1c3f498.reference || (__cxx_static_address_f06f9468a34714a6e1c3f498.reference = {
    __cReference: true,
    get value() { return FIX16_MAX__header_global_a231de8f988765a4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:32
export const FIX16_MIN__header_global_c35f81e18d939b1f = i32(2147483648);
function __cxx_static_address_95c097df9f88fff285839e95() {
  return __cxx_static_address_95c097df9f88fff285839e95.reference || (__cxx_static_address_95c097df9f88fff285839e95.reference = {
    __cReference: true,
    get value() { return FIX16_MIN__header_global_c35f81e18d939b1f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:33
export const FIX16_OVERFLOW__header_global_e68ef0139d1dae8f = i32(2147483648);
function __cxx_static_address_ddf1b54bcfbd500eb4cba365() {
  return __cxx_static_address_ddf1b54bcfbd500eb4cba365.reference || (__cxx_static_address_ddf1b54bcfbd500eb4cba365.reference = {
    __cReference: true,
    get value() { return FIX16_OVERFLOW__header_global_e68ef0139d1dae8f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:35
export const fix16_one__header_global_5f16df421d5dc24f = i32(65536);
function __cxx_static_address_b445a2ab30d49142ea0b9890() {
  return __cxx_static_address_b445a2ab30d49142ea0b9890.reference || (__cxx_static_address_b445a2ab30d49142ea0b9890.reference = {
    __cReference: true,
    get value() { return fix16_one__header_global_5f16df421d5dc24f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:36
export const fix16_half__header_global_d03f346236694e01 = i32(32768);
function __cxx_static_address_99c4c95c51e57dc77ae9a8a1() {
  return __cxx_static_address_99c4c95c51e57dc77ae9a8a1.reference || (__cxx_static_address_99c4c95c51e57dc77ae9a8a1.reference = {
    __cReference: true,
    get value() { return fix16_half__header_global_d03f346236694e01; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:37
export const flt_f161r__header_global_329b1e52f5b901d2 = Math.fround(Math.fround((Math.fround(1) / Math.fround(65536))));
function __cxx_static_address_977e17a27e9621b0b40d7b0e() {
  return __cxx_static_address_977e17a27e9621b0b40d7b0e.reference || (__cxx_static_address_977e17a27e9621b0b40d7b0e.reference = {
    __cReference: true,
    get value() { return flt_f161r__header_global_329b1e52f5b901d2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/common.cpp:37
export const defaultdeffilename = cPointerArray(4, [Uint8Array.from([100, 117, 107, 101, 51, 100, 46, 100, 101, 102, 0]), Uint8Array.from([110, 97, 109, 46, 100, 101, 102, 0]), Uint8Array.from([110, 97, 112, 97, 108, 109, 46, 100, 101, 102, 0]), Uint8Array.from([119, 119, 50, 103, 105, 46, 100, 101, 102, 0])]);
function __cxx_static_address_7b856b48bd523e74ded592bd() {
  return __cxx_static_address_7b856b48bd523e74ded592bd.reference || (__cxx_static_address_7b856b48bd523e74ded592bd.reference = {
    __cReference: true,
    get value() { return defaultdeffilename; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/common.cpp:38
export const defaultgameconfilename = cPointerArray(4, [Uint8Array.from([69, 68, 85, 75, 69, 46, 67, 79, 78, 0]), Uint8Array.from([78, 65, 77, 46, 67, 79, 78, 0]), Uint8Array.from([78, 65, 80, 65, 76, 77, 46, 67, 79, 78, 0]), Uint8Array.from([87, 87, 50, 71, 73, 46, 67, 79, 78, 0])]);
function __cxx_static_address_f772a6562169a1734bb618a5() {
  return __cxx_static_address_f772a6562169a1734bb618a5.reference || (__cxx_static_address_f772a6562169a1734bb618a5.reference = {
    __cReference: true,
    get value() { return defaultgameconfilename; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/common.cpp:42
export let g_grpNamePtr = null;
export function __cxx_global_cell_27587671eaba76ec3d4a0ad1() {
  return __cxx_global_cell_27587671eaba76ec3d4a0ad1.reference || (__cxx_global_cell_27587671eaba76ec3d4a0ad1.reference = {
    __cReference: true,
    get value() { return g_grpNamePtr; },
    set value(__cxx_lvalue_0) { g_grpNamePtr = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/duke3d/src/common.cpp:44
export let g_scriptNamePtr = null;
export function __cxx_global_cell_fdd997c846b5c711252a3504() {
  return __cxx_global_cell_fdd997c846b5c711252a3504.reference || (__cxx_global_cell_fdd997c846b5c711252a3504.reference = {
    __cReference: true,
    get value() { return g_scriptNamePtr; },
    set value(__cxx_lvalue_0) { g_scriptNamePtr = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/duke3d/src/common.cpp:46
export let g_rtsNamePtr = null;
export function __cxx_global_cell_41b93597aa1b675c52f24290() {
  return __cxx_global_cell_41b93597aa1b675c52f24290.reference || (__cxx_global_cell_41b93597aa1b675c52f24290.reference = {
    __cReference: true,
    get value() { return g_rtsNamePtr; },
    set value(__cxx_lvalue_0) { g_rtsNamePtr = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/duke3d/src/common.cpp:48
export function clearGrpNamePtr() {
  xfree__header_058c77bd99f9(g_grpNamePtr);
}

// C/C++ source: source/duke3d/src/common.cpp:54
export function clearScriptNamePtr() {
  xfree__header_058c77bd99f9(g_scriptNamePtr);
}

// C/C++ source: source/duke3d/src/common.cpp:60
export function G_DefaultGrpFile() {
  if (Boolean(i32((g_gameType & 1)))) {
    return (cPointerElementRef(defaultgamegrp, 0).value);
  } else {
    if (Boolean(i32((g_gameType & 4)))) {
      return (cPointerElementRef(defaultgamegrp, 2).value);
    } else {
      if (Boolean(i32((g_gameType & 8)))) {
        return (cPointerElementRef(defaultgamegrp, 3).value);
      } else {
        if (Boolean(i32((g_gameType & 2)))) {
          return (cPointerElementRef(defaultgamegrp, 1).value);
        }
      }
    }
  }
  return (cPointerElementRef(defaultgamegrp, 0).value);
}

// C/C++ source: source/duke3d/src/common.cpp:135
export function G_GrpFile() {
  return (cPointerCompare(g_grpNamePtr, null, "==") ? G_DefaultGrpFile() : g_grpNamePtr);
}

// C/C++ source: source/duke3d/src/common.cpp:212
export function G_SetupGlobalPsky() {
  let skyIdx = i32(0);
  for (let i = i32((i32(__cxx_global_cell_0d84c36af55f8d659082f1bb().value) - 1)); (i >= 0); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous - 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; }))) {
    if (Boolean(i32((i32((cPointerElementRef(__cxx_global_cell_9d5d7fcf3aa35a4809f92551().value, i).value).ceilingstat) & 1)))) {
      (skyIdx = i32(getpskyidx__header_641aad24f354(i32((cPointerElementRef(__cxx_global_cell_9d5d7fcf3aa35a4809f92551().value, i).value).ceilingpicnum))));
      if ((skyIdx > 0)) {
        break;
      }
    }
  }
  (__cxx_global_cell_c55d5c171c5137818b672aba().value = i32(skyIdx));
}

// C/C++ source: source/duke3d/src/common.cpp:233
export let g_rootDir = new Uint8Array(256);
function __cxx_static_address_1d2fbfc34f7eaae881c439a7() {
  return __cxx_static_address_1d2fbfc34f7eaae881c439a7.reference || (__cxx_static_address_1d2fbfc34f7eaae881c439a7.reference = {
    __cReference: true,
    get value() { return g_rootDir; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/common.cpp:235
export let g_useCwd = 0;
export function __cxx_global_cell_6c47f72ba9178ee1cea25b07() {
  return __cxx_global_cell_6c47f72ba9178ee1cea25b07.reference || (__cxx_global_cell_6c47f72ba9178ee1cea25b07.reference = {
    __cReference: true,
    get value() { return g_useCwd; },
    set value(__cxx_lvalue_0) { g_useCwd = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/common.cpp:237
export let g_groupFileHandle = 0;
export function __cxx_global_cell_5dddef0e308e41e8cdc8c196() {
  return __cxx_global_cell_5dddef0e308e41e8cdc8c196.reference || (__cxx_global_cell_5dddef0e308e41e8cdc8c196.reference = {
    __cReference: true,
    get value() { return g_groupFileHandle; },
    set value(__cxx_lvalue_0) { g_groupFileHandle = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/common.cpp:239
export let CommandPaths = null;
function __cxx_static_address_493892d6b4db7dd7b875ed07() {
  return __cxx_static_address_493892d6b4db7dd7b875ed07.reference || (__cxx_static_address_493892d6b4db7dd7b875ed07.reference = {
    __cReference: true,
    get value() { return CommandPaths; },
    set value(__cxx_lvalue_0) { CommandPaths = __cxx_lvalue_0; }
  });
}

export let CommandGrps = null;
function __cxx_static_address_302eefb9e1aff28fad06f33f() {
  return __cxx_static_address_302eefb9e1aff28fad06f33f.reference || (__cxx_static_address_302eefb9e1aff28fad06f33f.reference = {
    __cReference: true,
    get value() { return CommandGrps; },
    set value(__cxx_lvalue_0) { CommandGrps = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/duke3d/src/common.cpp:504
export function G_LoadAddon() {
  let crc;
  switch (g_addonNum) {
    case i32(1): {
      (crc = u32(i32(2832171226)));
    }
    break;
    case i32(2): {
      (crc = u32(i32(4056606948)));
    }
    break;
    case i32(3): {
      (crc = u32(i32(418389083)));
    }
    break;
    default: {
      return;
    }
  }
  let grp = FindGroup(i32(crc));
  if (grp) {
    (g_selectedGrp = grp);
  }
}

// C/C++ source: source/duke3d/src/common.cpp:840
export function G_CleanupSearchPaths() {
  removesearchpaths_withuser(i32(1));
  if ((!Boolean(i32((g_gameType & 2))))) {
    removesearchpaths_withuser(i32(2));
  }
  if ((!Boolean(i32((g_gameType & 8))))) {
    removesearchpaths_withuser(i32(4));
  }
  if ((!Boolean(i32((g_gameType & 128))))) {
    removesearchpaths_withuser(i32(8));
  }
}

// C/C++ source: source/duke3d/src/common.cpp:985
export let g_maybeUpgradeSoundFormats = i32(1);
export function __cxx_global_cell_5df695efec168e9b5e56ad93() {
  return __cxx_global_cell_5df695efec168e9b5e56ad93.reference || (__cxx_global_cell_5df695efec168e9b5e56ad93.reference = {
    __cReference: true,
    get value() { return g_maybeUpgradeSoundFormats; },
    set value(__cxx_lvalue_0) { g_maybeUpgradeSoundFormats = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/common.cpp:986
export let g_maybeUpgradeMusic = i32(1);
export function __cxx_global_cell_7dcadfaabb82a4ba2057fcd2() {
  return __cxx_global_cell_7dcadfaabb82a4ba2057fcd2.reference || (__cxx_global_cell_7dcadfaabb82a4ba2057fcd2.reference = {
    __cReference: true,
    get value() { return g_maybeUpgradeMusic; },
    set value(__cxx_lvalue_0) { g_maybeUpgradeMusic = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/common.cpp:1102
export function Duke_CommonCleanup() {
  do {
    xfree__header_058c77bd99f9(g_grpNamePtr);
    (g_grpNamePtr = null);
  } while (Boolean(0));
  do {
    xfree__header_058c77bd99f9(g_scriptNamePtr);
    (g_scriptNamePtr = null);
  } while (Boolean(0));
  do {
    xfree__header_058c77bd99f9(g_rtsNamePtr);
    (g_rtsNamePtr = null);
  } while (Boolean(0));
}

// C/C++ source: source/build/include/compat.h:1169
export const pow2char__header_global_f9572a74948e3c4d = new Uint8Array([((1) & 255), ((2) & 255), ((4) & 255), ((8) & 255), ((16) & 255), ((32) & 255), ((64) & 255), ((128) & 255)]);
function __cxx_static_address_d475dde0314670695f67986f() {
  return __cxx_static_address_d475dde0314670695f67986f.reference || (__cxx_static_address_d475dde0314670695f67986f.reference = {
    __cReference: true,
    get value() { return pow2char__header_global_f9572a74948e3c4d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:172
export const g_defaultVideoModes__header_global_b2b1db020d704d8a = [cMarkAggregate(({"x": 2560, "y": 1440})), cMarkAggregate(({"x": 2560, "y": 1200})), cMarkAggregate(({"x": 2560, "y": 1080})), cMarkAggregate(({"x": 1920, "y": 1440})), cMarkAggregate(({"x": 1920, "y": 1200})), cMarkAggregate(({"x": 1920, "y": 1080})), cMarkAggregate(({"x": 1680, "y": 1050})), cMarkAggregate(({"x": 1600, "y": 1200})), cMarkAggregate(({"x": 1600, "y": 900})), cMarkAggregate(({"x": 1366, "y": 768})), cMarkAggregate(({"x": 1280, "y": 1024})), cMarkAggregate(({"x": 1280, "y": 960})), cMarkAggregate(({"x": 1280, "y": 720})), cMarkAggregate(({"x": 1152, "y": 864})), cMarkAggregate(({"x": 1024, "y": 768})), cMarkAggregate(({"x": 1024, "y": 600})), cMarkAggregate(({"x": 800, "y": 600})), cMarkAggregate(({"x": 640, "y": 480})), cMarkAggregate(({"x": 640, "y": 400})), cMarkAggregate(({"x": 512, "y": 384})), cMarkAggregate(({"x": 480, "y": 360})), cMarkAggregate(({"x": 400, "y": 300})), cMarkAggregate(({"x": 320, "y": 240})), cMarkAggregate(({"x": 320, "y": 200})), cMarkAggregate(({"x": 0, "y": 0}))];
function __cxx_static_address_bbf8e83c6f8e4e97f3e5816c() {
  return __cxx_static_address_bbf8e83c6f8e4e97f3e5816c.reference || (__cxx_static_address_bbf8e83c6f8e4e97f3e5816c.reference = {
    __cReference: true,
    get value() { return g_defaultVideoModes__header_global_b2b1db020d704d8a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:188
export const g_keyAsciiTable__header_global_4c203947dc3f9f06 = new Uint8Array([((0) & 255), ((0) & 255), 49, 50, 51, 52, 53, 54, 55, 56, 57, 48, 45, 61, ((0) & 255), ((0) & 255), 113, 119, 101, 114, 116, 121, 117, 105, 111, 112, 91, 93, ((0) & 255), ((0) & 255), 97, 115, 100, 102, 103, 104, 106, 107, 108, 59, ((39) & 255), 96, ((0) & 255), ((92) & 255), 122, 120, 99, 118, 98, 110, 109, 44, 46, 47, ((0) & 255), 42, ((0) & 255), ((32) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), 55, 56, 57, 45, 52, 53, 54, 43, 49, 50, 51, 48, 46, ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255)]);
function __cxx_static_address_c6df0c9a6fcb379993e5904d() {
  return __cxx_static_address_c6df0c9a6fcb379993e5904d.reference || (__cxx_static_address_c6df0c9a6fcb379993e5904d.reference = {
    __cReference: true,
    get value() { return g_keyAsciiTable__header_global_4c203947dc3f9f06; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:196
export const g_keyAsciiTableShift__header_global_20dc4e6bf357bbc0 = new Uint8Array([((0) & 255), ((0) & 255), 33, 64, 35, 36, 37, 94, 38, 42, 40, 41, 95, 43, ((0) & 255), ((0) & 255), 81, 87, 69, 82, 84, 89, 85, 73, 79, 80, 123, 125, ((0) & 255), ((0) & 255), 65, 83, 68, 70, 71, 72, 74, 75, 76, 58, 34, 126, ((0) & 255), 124, 90, 88, 67, 86, 66, 78, 77, 60, 62, 63, ((0) & 255), 42, ((0) & 255), ((32) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), 55, 56, 57, 45, 52, 53, 54, 43, 49, 50, 51, 48, 46, ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255)]);
function __cxx_static_address_f9d89c7d5b710d64efe6f875() {
  return __cxx_static_address_f9d89c7d5b710d64efe6f875.reference || (__cxx_static_address_f9d89c7d5b710d64efe6f875.reference = {
    __cReference: true,
    get value() { return g_keyAsciiTableShift__header_global_20dc4e6bf357bbc0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:895
export const pow2long__header_global_9cf3d1fb02d53250 = new Int32Array([1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144, 524288, 1048576, 2097152, 4194304, 8388608, 16777216, 33554432, 67108864, 134217728, 268435456, 536870912, 1073741824, 2147483647]);
function __cxx_static_address_d996d5259b75cc05ab6f7ef6() {
  return __cxx_static_address_d996d5259b75cc05ab6f7ef6.reference || (__cxx_static_address_d996d5259b75cc05ab6f7ef6.reference = {
    __cReference: true,
    get value() { return pow2long__header_global_9cf3d1fb02d53250; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:907
export const pow2ulong__header_global_69801dcb660fd5c9 = new Uint32Array([u32(1), u32(2), u32(4), u32(8), u32(16), u32(32), u32(64), u32(128), u32(256), u32(512), u32(1024), u32(2048), u32(4096), u32(8192), u32(16384), u32(32768), u32(65536), u32(131072), u32(262144), u32(524288), u32(1048576), u32(2097152), u32(4194304), u32(8388608), u32(16777216), u32(33554432), u32(67108864), u32(134217728), u32(268435456), u32(536870912), u32(1073741824), u32(2147483648n)]);
function __cxx_static_address_dd270066bb6347939454c87b() {
  return __cxx_static_address_dd270066bb6347939454c87b.reference || (__cxx_static_address_dd270066bb6347939454c87b.reference = {
    __cReference: true,
    get value() { return pow2ulong__header_global_69801dcb660fd5c9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:919
export const pow264__header_global_d7ac76122864fd30 = new BigInt64Array([BigInt(i64(1)), BigInt(i64(2)), BigInt(i64(4)), BigInt(i64(8)), BigInt(i64(16)), BigInt(i64(32)), BigInt(i64(64)), BigInt(i64(128)), BigInt(i64(256)), BigInt(i64(512)), BigInt(i64(1024)), BigInt(i64(2048)), BigInt(i64(4096)), BigInt(i64(8192)), BigInt(i64(16384)), BigInt(i64(32768)), BigInt(i64(65536)), BigInt(i64(131072)), BigInt(i64(262144)), BigInt(i64(524288)), BigInt(i64(1048576)), BigInt(i64(2097152)), BigInt(i64(4194304)), BigInt(i64(8388608)), BigInt(i64(16777216)), BigInt(i64(33554432)), BigInt(i64(67108864)), BigInt(i64(134217728)), BigInt(i64(268435456)), BigInt(i64(536870912)), BigInt(i64(1073741824)), BigInt(2147483648n), BigInt(4294967296n), BigInt(8589934592n), BigInt(17179869184n), BigInt(34359738368n), BigInt(68719476736n), BigInt(137438953472n), BigInt(274877906944n), BigInt(549755813888n), BigInt(1099511627776n), BigInt(2199023255552n), BigInt(4398046511104n), BigInt(8796093022208n), BigInt(17592186044416n), BigInt(35184372088832n), BigInt(70368744177664n), BigInt(140737488355328n), BigInt(281474976710656n), BigInt(562949953421312n), BigInt(1125899906842624n), BigInt(2251799813685248n), BigInt(4503599627370496n), BigInt(9007199254740992n), BigInt(18014398509481984n), BigInt(36028797018963968n), BigInt(72057594037927936n), BigInt(144115188075855872n), BigInt(288230376151711744n), BigInt(576460752303423488n), BigInt(1152921504606846976n), BigInt(2305843009213693952n), BigInt(4611686018427387904n), BigInt(9223372036854775807n)]);
function __cxx_static_address_a720b8784cc6263a450a2428() {
  return __cxx_static_address_a720b8784cc6263a450a2428.reference || (__cxx_static_address_a720b8784cc6263a450a2428.reference = {
    __cReference: true,
    get value() { return pow264__header_global_d7ac76122864fd30; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/common.cpp:1450
export function xfree__header_058c77bd99f9(ptr) {
  _sm_free(__cxx_global_cell_11016d3c7177543e564ab46c().value, ptr);
}

// C/C++ source: source/duke3d/src/common.cpp:863
export function getpskyidx__header_641aad24f354(picnum) {
  let j;
  for ((j = i32((__cxx_global_cell_657da161243aac44db0e415b().value - 1))); (j > 0); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous - 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => j, __cxx_lvalue_1 => { j = __cxx_lvalue_1; }))) {
    if ((picnum == (cDeref(cPointerOffset(__cxx_global_cell_dad5bc86f245af7b0202a36f().value, j, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))) {
      break;
    }
  }
  return i32(j);
}

export function ARRAY_SIZE__header_ab148c12d384(arg0) {
  return u64(256n);
}

// C/C++ source: source/build/include/smmalloc.h:864
export function _sm_free(allocator, p) {
  return cRecordObject(allocator).Free(p);
}

// C/C++ source: source/build/include/smmalloc.h:859
export function _sm_malloc(allocator, bytesCount, alignment) {
  return cRecordObject(allocator).Alloc(bytesCount, alignment);
}
