// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/build/src/vfs.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
import { __cxx_global_cell_11016d3c7177543e564ab46c } from "./compat.cpp.mjs";
import { __cxx_global_cell_0c0d9a71eef382369e188fb4 } from "./kplib.cpp.mjs";

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
    if (source?.__cReference===true) return extent(source.value,amount);
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

// C/C++ source: source/build/include/fix16.h:111
export const fix16_rad_to_deg_mult__header_global_17aee3ec488220bb = i32(3754936);
function __cxx_static_address_15f2da9beb981498a97da492() {
  return __cxx_static_address_15f2da9beb981498a97da492.reference || (__cxx_static_address_15f2da9beb981498a97da492.reference = {
    __cReference: true,
    get value() { return fix16_rad_to_deg_mult__header_global_17aee3ec488220bb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:114
export const fix16_deg_to_rad_mult__header_global_342c56765d0ecf88 = i32(1144);
function __cxx_static_address_14c3a4791e52e8dde786fd35() {
  return __cxx_static_address_14c3a4791e52e8dde786fd35.reference || (__cxx_static_address_14c3a4791e52e8dde786fd35.reference = {
    __cReference: true,
    get value() { return fix16_deg_to_rad_mult__header_global_342c56765d0ecf88; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/vfs.cpp:21
export let toupperlookup = new Uint8Array([((0) & 255), ((1) & 255), ((2) & 255), ((3) & 255), ((4) & 255), ((5) & 255), ((6) & 255), ((7) & 255), ((8) & 255), ((9) & 255), ((10) & 255), ((11) & 255), ((12) & 255), ((13) & 255), ((14) & 255), ((15) & 255), ((16) & 255), ((17) & 255), ((18) & 255), ((19) & 255), ((20) & 255), ((21) & 255), ((22) & 255), ((23) & 255), ((24) & 255), ((25) & 255), ((26) & 255), ((27) & 255), ((28) & 255), ((29) & 255), ((30) & 255), ((31) & 255), ((32) & 255), ((33) & 255), ((34) & 255), ((35) & 255), ((36) & 255), ((37) & 255), ((38) & 255), ((39) & 255), ((40) & 255), ((41) & 255), ((42) & 255), ((43) & 255), ((44) & 255), ((45) & 255), ((46) & 255), ((47) & 255), ((48) & 255), ((49) & 255), ((50) & 255), ((51) & 255), ((52) & 255), ((53) & 255), ((54) & 255), ((55) & 255), ((56) & 255), ((57) & 255), ((58) & 255), ((59) & 255), ((60) & 255), ((61) & 255), ((62) & 255), ((63) & 255), ((64) & 255), ((65) & 255), ((66) & 255), ((67) & 255), ((68) & 255), ((69) & 255), ((70) & 255), ((71) & 255), ((72) & 255), ((73) & 255), ((74) & 255), ((75) & 255), ((76) & 255), ((77) & 255), ((78) & 255), ((79) & 255), ((80) & 255), ((81) & 255), ((82) & 255), ((83) & 255), ((84) & 255), ((85) & 255), ((86) & 255), ((87) & 255), ((88) & 255), ((89) & 255), ((90) & 255), ((91) & 255), ((92) & 255), ((93) & 255), ((94) & 255), ((95) & 255), ((96) & 255), ((65) & 255), ((66) & 255), ((67) & 255), ((68) & 255), ((69) & 255), ((70) & 255), ((71) & 255), ((72) & 255), ((73) & 255), ((74) & 255), ((75) & 255), ((76) & 255), ((77) & 255), ((78) & 255), ((79) & 255), ((80) & 255), ((81) & 255), ((82) & 255), ((83) & 255), ((84) & 255), ((85) & 255), ((86) & 255), ((87) & 255), ((88) & 255), ((89) & 255), ((90) & 255), ((123) & 255), ((124) & 255), ((125) & 255), ((126) & 255), ((127) & 255), ((128) & 255), ((129) & 255), ((130) & 255), ((131) & 255), ((132) & 255), ((133) & 255), ((134) & 255), ((135) & 255), ((136) & 255), ((137) & 255), ((138) & 255), ((139) & 255), ((140) & 255), ((141) & 255), ((142) & 255), ((143) & 255), ((144) & 255), ((145) & 255), ((146) & 255), ((147) & 255), ((148) & 255), ((149) & 255), ((150) & 255), ((151) & 255), ((152) & 255), ((153) & 255), ((154) & 255), ((155) & 255), ((156) & 255), ((157) & 255), ((158) & 255), ((159) & 255), ((160) & 255), ((161) & 255), ((162) & 255), ((163) & 255), ((164) & 255), ((165) & 255), ((166) & 255), ((167) & 255), ((168) & 255), ((169) & 255), ((170) & 255), ((171) & 255), ((172) & 255), ((173) & 255), ((174) & 255), ((175) & 255), ((176) & 255), ((177) & 255), ((178) & 255), ((179) & 255), ((180) & 255), ((181) & 255), ((182) & 255), ((183) & 255), ((184) & 255), ((185) & 255), ((186) & 255), ((187) & 255), ((188) & 255), ((189) & 255), ((190) & 255), ((191) & 255), ((192) & 255), ((193) & 255), ((194) & 255), ((195) & 255), ((196) & 255), ((197) & 255), ((198) & 255), ((199) & 255), ((200) & 255), ((201) & 255), ((202) & 255), ((203) & 255), ((204) & 255), ((205) & 255), ((206) & 255), ((207) & 255), ((208) & 255), ((209) & 255), ((210) & 255), ((211) & 255), ((212) & 255), ((213) & 255), ((214) & 255), ((215) & 255), ((216) & 255), ((217) & 255), ((218) & 255), ((219) & 255), ((220) & 255), ((221) & 255), ((222) & 255), ((223) & 255), ((224) & 255), ((225) & 255), ((226) & 255), ((227) & 255), ((228) & 255), ((229) & 255), ((230) & 255), ((231) & 255), ((232) & 255), ((233) & 255), ((234) & 255), ((235) & 255), ((236) & 255), ((237) & 255), ((238) & 255), ((239) & 255), ((240) & 255), ((241) & 255), ((242) & 255), ((243) & 255), ((244) & 255), ((245) & 255), ((246) & 255), ((247) & 255), ((248) & 255), ((249) & 255), ((250) & 255), ((251) & 255), ((252) & 255), ((253) & 255), ((254) & 255), ((255) & 255)]);
function __cxx_static_address_980b5e139bc2570de0a7bf90() {
  return __cxx_static_address_980b5e139bc2570de0a7bf90.reference || (__cxx_static_address_980b5e139bc2570de0a7bf90.reference = {
    __cReference: true,
    get value() { return toupperlookup; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/vfs.cpp:61
export let kpzbuf = null;
export function __cxx_global_cell_84bfc13188837cd8ad2617ac() {
  return __cxx_global_cell_84bfc13188837cd8ad2617ac.reference || (__cxx_global_cell_84bfc13188837cd8ad2617ac.reference = {
    __cReference: true,
    get value() { return kpzbuf; },
    set value(__cxx_lvalue_0) { kpzbuf = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/build/src/vfs.cpp:62
export let kpzbufsiz = 0;
export function __cxx_global_cell_82fc53700c75bce13e04b518() {
  return __cxx_global_cell_82fc53700c75bce13e04b518.reference || (__cxx_global_cell_82fc53700c75bce13e04b518.reference = {
    __cReference: true,
    get value() { return kpzbufsiz; },
    set value(__cxx_lvalue_0) { kpzbufsiz = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/include/fix16.h:31
export const FIX16_MAX__header_global_7c752513b708f6d5 = i32(2147483647);
function __cxx_static_address_e89a5237841e5e23f1b8909e() {
  return __cxx_static_address_e89a5237841e5e23f1b8909e.reference || (__cxx_static_address_e89a5237841e5e23f1b8909e.reference = {
    __cReference: true,
    get value() { return FIX16_MAX__header_global_7c752513b708f6d5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:32
export const FIX16_MIN__header_global_065b24449633456d = i32(2147483648);
function __cxx_static_address_5e034f6c5a17c71e0f5880e1() {
  return __cxx_static_address_5e034f6c5a17c71e0f5880e1.reference || (__cxx_static_address_5e034f6c5a17c71e0f5880e1.reference = {
    __cReference: true,
    get value() { return FIX16_MIN__header_global_065b24449633456d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:33
export const FIX16_OVERFLOW__header_global_32d80320de168f5c = i32(2147483648);
function __cxx_static_address_2a4fabd84d7badba022b533f() {
  return __cxx_static_address_2a4fabd84d7badba022b533f.reference || (__cxx_static_address_2a4fabd84d7badba022b533f.reference = {
    __cReference: true,
    get value() { return FIX16_OVERFLOW__header_global_32d80320de168f5c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:35
export const fix16_one__header_global_9128961a382e4351 = i32(65536);
function __cxx_static_address_55dd7d10a3258d69dff8c2d2() {
  return __cxx_static_address_55dd7d10a3258d69dff8c2d2.reference || (__cxx_static_address_55dd7d10a3258d69dff8c2d2.reference = {
    __cReference: true,
    get value() { return fix16_one__header_global_9128961a382e4351; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:36
export const fix16_half__header_global_21d6aac3559c4929 = i32(32768);
function __cxx_static_address_855a07a55d24a3b409c25421() {
  return __cxx_static_address_855a07a55d24a3b409c25421.reference || (__cxx_static_address_855a07a55d24a3b409c25421.reference = {
    __cReference: true,
    get value() { return fix16_half__header_global_21d6aac3559c4929; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:37
export const flt_f161r__header_global_e312c204844933e8 = Math.fround(Math.fround((Math.fround(1) / Math.fround(65536))));
function __cxx_static_address_b6586abaacb3f750564e704e() {
  return __cxx_static_address_b6586abaacb3f750564e704e.reference || (__cxx_static_address_b6586abaacb3f750564e704e.reference = {
    __cReference: true,
    get value() { return flt_f161r__header_global_e312c204844933e8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/vfs.cpp:129
export let searchpathhead = null;
function __cxx_static_address_8b2fddc852cc4e1abb4ae8af() {
  return __cxx_static_address_8b2fddc852cc4e1abb4ae8af.reference || (__cxx_static_address_8b2fddc852cc4e1abb4ae8af.reference = {
    __cReference: true,
    get value() { return searchpathhead; },
    set value(__cxx_lvalue_0) { searchpathhead = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/build/src/vfs.cpp:130
export let maxsearchpathlen = u64(0);
function __cxx_static_address_bd28db781fd61f721b55fb90() {
  return __cxx_static_address_bd28db781fd61f721b55fb90.reference || (__cxx_static_address_bd28db781fd61f721b55fb90.reference = {
    __cReference: true,
    get value() { return maxsearchpathlen; },
    set value(__cxx_lvalue_0) { maxsearchpathlen = u64(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/vfs.cpp:131
export let pathsearchmode = i32(0);
export function __cxx_global_cell_787e3556986da6109d0447e0() {
  return __cxx_global_cell_787e3556986da6109d0447e0.reference || (__cxx_global_cell_787e3556986da6109d0447e0.reference = {
    __cReference: true,
    get value() { return pathsearchmode; },
    set value(__cxx_lvalue_0) { pathsearchmode = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/vfs.cpp:135
let __static_listsearchpath_sp = null;
export function listsearchpath(initp) {

  if (Boolean(initp)) {
    (__static_listsearchpath_sp = searchpathhead);
  } else {
    if (cPointerCompare(__static_listsearchpath_sp, null, "!=")) {
      (__static_listsearchpath_sp = cRecordObject(__static_listsearchpath_sp).next);
    }
  }
  return (__static_listsearchpath_sp ? cRecordObject(__static_listsearchpath_sp).path : null);
}

// C/C++ source: source/build/src/vfs.cpp:247
export function removesearchpaths_withuser(usermask) {
  let next;
  for (let srch = searchpathhead; srch; (srch = next)) {
    (next = cRecordObject(srch).next);
    if (Boolean(i32((cRecordObject(srch).user & usermask)))) {
      if (cPointerCompare(srch, searchpathhead, "==")) {
        (searchpathhead = cRecordObject(srch).next);
      } else {
        let sp;
        for ((sp = searchpathhead); sp; (sp = cRecordObject(sp).next)) {
          if (cPointerCompare(cRecordObject(sp).next, srch, "==")) {
            (cRecordObject(sp).next = cRecordObject(srch).next);
            break;
          }
        }
      }
      xfree__header_13edfa973cd4(cRecordObject(srch).path);
      xfree__header_13edfa973cd4(srch);
    }
  }
}

// C/C++ source: source/build/src/vfs.cpp:453
export let numgroupfiles = i32(0);
export function __cxx_global_cell_92d90c06123336f9a13fd848() {
  return __cxx_global_cell_92d90c06123336f9a13fd848.reference || (__cxx_global_cell_92d90c06123336f9a13fd848.reference = {
    __cReference: true,
    get value() { return numgroupfiles; },
    set value(__cxx_lvalue_0) { numgroupfiles = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/vfs.cpp:454
export let gnumfiles = new Int32Array(8);
function __cxx_static_address_40e26d32b6ca71fd78ad3b32() {
  return __cxx_static_address_40e26d32b6ca71fd78ad3b32.reference || (__cxx_static_address_40e26d32b6ca71fd78ad3b32.reference = {
    __cReference: true,
    get value() { return gnumfiles; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/vfs.cpp:455
export let groupfil = new BigInt64Array([BigInt(i64((-1))), BigInt(i64((-1))), BigInt(i64((-1))), BigInt(i64((-1))), BigInt(i64((-1))), BigInt(i64((-1))), BigInt(i64((-1))), BigInt(i64((-1)))]);
function __cxx_static_address_b077455bc7a20cfc79ce2bba() {
  return __cxx_static_address_b077455bc7a20cfc79ce2bba.reference || (__cxx_static_address_b077455bc7a20cfc79ce2bba.reference = {
    __cReference: true,
    get value() { return groupfil; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/vfs.cpp:456
export let groupfilpos = new Int32Array(8);
function __cxx_static_address_d14239ea2126a8005fdc7edd() {
  return __cxx_static_address_d14239ea2126a8005fdc7edd.reference || (__cxx_static_address_d14239ea2126a8005fdc7edd.reference = {
    __cReference: true,
    get value() { return groupfilpos; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/vfs.cpp:457
export let groupfilgrp = new Uint8Array(8);
function __cxx_static_address_22ad39b5d1fff4dd8ee9cb2a() {
  return __cxx_static_address_22ad39b5d1fff4dd8ee9cb2a.reference || (__cxx_static_address_22ad39b5d1fff4dd8ee9cb2a.reference = {
    __cReference: true,
    get value() { return groupfilgrp; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/vfs.cpp:458
export let gfilelist = cPointerArray(8);
function __cxx_static_address_df5ae7aa745e71213f1e877e() {
  return __cxx_static_address_df5ae7aa745e71213f1e877e.reference || (__cxx_static_address_df5ae7aa745e71213f1e877e.reference = {
    __cReference: true,
    get value() { return gfilelist; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/vfs.cpp:459
export let groupname = cPointerArray(8);
function __cxx_static_address_01bff137228e49ab5afb7c96() {
  return __cxx_static_address_01bff137228e49ab5afb7c96.reference || (__cxx_static_address_01bff137228e49ab5afb7c96.reference = {
    __cReference: true,
    get value() { return groupname; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/vfs.cpp:460
export let gfileoffs = cPointerArray(8);
function __cxx_static_address_87f71f8c0e42cda397cbc5e6() {
  return __cxx_static_address_87f71f8c0e42cda397cbc5e6.reference || (__cxx_static_address_87f71f8c0e42cda397cbc5e6.reference = {
    __cReference: true,
    get value() { return gfileoffs; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/vfs.cpp:462
export let filegrp = new Uint8Array(64);
function __cxx_static_address_3a9ab4328ffa236764eb60c3() {
  return __cxx_static_address_3a9ab4328ffa236764eb60c3.reference || (__cxx_static_address_3a9ab4328ffa236764eb60c3.reference = {
    __cReference: true,
    get value() { return filegrp; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/vfs.cpp:463
export let filepos = new Int32Array(64);
function __cxx_static_address_0e6a8863bdc69dd261cf550b() {
  return __cxx_static_address_0e6a8863bdc69dd261cf550b.reference || (__cxx_static_address_0e6a8863bdc69dd261cf550b.reference = {
    __cReference: true,
    get value() { return filepos; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/vfs.cpp:464
export let filehan = new BigInt64Array([BigInt(i64((-1))), BigInt(i64((-1))), BigInt(i64((-1))), BigInt(i64((-1))), BigInt(i64((-1))), BigInt(i64((-1))), BigInt(i64((-1))), BigInt(i64((-1))), BigInt(i64((-1))), BigInt(i64((-1))), BigInt(i64((-1))), BigInt(i64((-1))), BigInt(i64((-1))), BigInt(i64((-1))), BigInt(i64((-1))), BigInt(i64((-1))), BigInt(i64((-1))), BigInt(i64((-1))), BigInt(i64((-1))), BigInt(i64((-1))), BigInt(i64((-1))), BigInt(i64((-1))), BigInt(i64((-1))), BigInt(i64((-1))), BigInt(i64((-1))), BigInt(i64((-1))), BigInt(i64((-1))), BigInt(i64((-1))), BigInt(i64((-1))), BigInt(i64((-1))), BigInt(i64((-1))), BigInt(i64((-1))), BigInt(i64((-1))), BigInt(i64((-1))), BigInt(i64((-1))), BigInt(i64((-1))), BigInt(i64((-1))), BigInt(i64((-1))), BigInt(i64((-1))), BigInt(i64((-1))), BigInt(i64((-1))), BigInt(i64((-1))), BigInt(i64((-1))), BigInt(i64((-1))), BigInt(i64((-1))), BigInt(i64((-1))), BigInt(i64((-1))), BigInt(i64((-1))), BigInt(i64((-1))), BigInt(i64((-1))), BigInt(i64((-1))), BigInt(i64((-1))), BigInt(i64((-1))), BigInt(i64((-1))), BigInt(i64((-1))), BigInt(i64((-1))), BigInt(i64((-1))), BigInt(i64((-1))), BigInt(i64((-1))), BigInt(i64((-1))), BigInt(i64((-1))), BigInt(i64((-1))), BigInt(i64((-1))), BigInt(i64((-1)))]);
function __cxx_static_address_e58f38ca23a4c7031f169daa() {
  return __cxx_static_address_e58f38ca23a4c7031f169daa.reference || (__cxx_static_address_e58f38ca23a4c7031f169daa.reference = {
    __cReference: true,
    get value() { return filehan; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/vfs.cpp:473
export let filenamsav = Array.from({ length: 64 }, () => new Uint8Array(260));
function __cxx_static_address_e0923db928126267627d131f() {
  return __cxx_static_address_e0923db928126267627d131f.reference || (__cxx_static_address_e0923db928126267627d131f.reference = {
    __cReference: true,
    get value() { return filenamsav; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/vfs.cpp:474
export let kzcurhand = i32((-1));
function __cxx_static_address_c51318c3fc474f17943c1125() {
  return __cxx_static_address_c51318c3fc474f17943c1125.reference || (__cxx_static_address_c51318c3fc474f17943c1125.reference = {
    __cReference: true,
    get value() { return kzcurhand; },
    set value(__cxx_lvalue_0) { kzcurhand = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/vfs.cpp:476
export function cache1d_file_fromzip(fil) {
  return i32((i32((cDeref(cPointerOffset(filegrp, fil, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == i32(254)));
}

// C/C++ source: source/build/src/vfs.cpp:830
export function krename(crcval, filenum, newname) {
  cByteMemory.strncpy(cTypedPointer(cPointerOffset((cPointerElementRef(gfilelist, crcval).value), i32((filenum << 4)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array), newname, u64(12));
}

// C/C++ source: source/build/src/vfs.cpp:835
export function kfileparent(handle) {
  let groupnum = i32((cDeref(cPointerOffset(filegrp, handle, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value));
  if (((u32(groupnum) >= u32(8)) || ((cDeref(cPointerOffset(groupfil, groupnum, BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array).value) == i64((-1))))) {
    return null;
  }
  return (cPointerElementRef(groupname, groupnum).value);
}

// C/C++ source: source/build/src/vfs.cpp:871
export let g_modDir = (() => { const bytes = new Uint8Array(256); bytes.set([47]); return bytes; })();
function __cxx_static_address_3970ab616009ab587f7af2ad() {
  return __cxx_static_address_3970ab616009ab587f7af2ad.reference || (__cxx_static_address_3970ab616009ab587f7af2ad.reference = {
    __cReference: true,
    get value() { return g_modDir; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/vfs.cpp:1150
export function klistfree(rec) {
  let n;
  while (rec) {
    (n = cRecordObject(rec).next);
    xfree__header_13edfa973cd4(rec);
    (rec = n);
  }
}

// C/C++ source: source/build/src/vfs.cpp:1445
export let compressedDataStackBuf = new Uint8Array(131072);
function __cxx_static_address_614b4dff60c54bf98cd5634e() {
  return __cxx_static_address_614b4dff60c54bf98cd5634e.reference || (__cxx_static_address_614b4dff60c54bf98cd5634e.reference = {
    __cReference: true,
    get value() { return compressedDataStackBuf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/vfs.cpp:1446
export let lz4CompressionLevel = i32(5);
export function __cxx_global_cell_2e953df8db08c3fc6f0c3e07() {
  return __cxx_global_cell_2e953df8db08c3fc6f0c3e07.reference || (__cxx_global_cell_2e953df8db08c3fc6f0c3e07.reference = {
    __cReference: true,
    get value() { return lz4CompressionLevel; },
    set value(__cxx_lvalue_0) { lz4CompressionLevel = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/include/compat.h:1169
export const pow2char__header_global_d21761740b3acbcf = new Uint8Array([((1) & 255), ((2) & 255), ((4) & 255), ((8) & 255), ((16) & 255), ((32) & 255), ((64) & 255), ((128) & 255)]);
function __cxx_static_address_dc53f9bcff27df30109dbd73() {
  return __cxx_static_address_dc53f9bcff27df30109dbd73.reference || (__cxx_static_address_dc53f9bcff27df30109dbd73.reference = {
    __cReference: true,
    get value() { return pow2char__header_global_d21761740b3acbcf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:172
export const g_defaultVideoModes__header_global_503fe97fcec2796b = [cMarkAggregate(({"x": 2560, "y": 1440})), cMarkAggregate(({"x": 2560, "y": 1200})), cMarkAggregate(({"x": 2560, "y": 1080})), cMarkAggregate(({"x": 1920, "y": 1440})), cMarkAggregate(({"x": 1920, "y": 1200})), cMarkAggregate(({"x": 1920, "y": 1080})), cMarkAggregate(({"x": 1680, "y": 1050})), cMarkAggregate(({"x": 1600, "y": 1200})), cMarkAggregate(({"x": 1600, "y": 900})), cMarkAggregate(({"x": 1366, "y": 768})), cMarkAggregate(({"x": 1280, "y": 1024})), cMarkAggregate(({"x": 1280, "y": 960})), cMarkAggregate(({"x": 1280, "y": 720})), cMarkAggregate(({"x": 1152, "y": 864})), cMarkAggregate(({"x": 1024, "y": 768})), cMarkAggregate(({"x": 1024, "y": 600})), cMarkAggregate(({"x": 800, "y": 600})), cMarkAggregate(({"x": 640, "y": 480})), cMarkAggregate(({"x": 640, "y": 400})), cMarkAggregate(({"x": 512, "y": 384})), cMarkAggregate(({"x": 480, "y": 360})), cMarkAggregate(({"x": 400, "y": 300})), cMarkAggregate(({"x": 320, "y": 240})), cMarkAggregate(({"x": 320, "y": 200})), cMarkAggregate(({"x": 0, "y": 0}))];
function __cxx_static_address_763d789dde6aba672f86f591() {
  return __cxx_static_address_763d789dde6aba672f86f591.reference || (__cxx_static_address_763d789dde6aba672f86f591.reference = {
    __cReference: true,
    get value() { return g_defaultVideoModes__header_global_503fe97fcec2796b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:188
export const g_keyAsciiTable__header_global_0f29854c4685af07 = new Uint8Array([((0) & 255), ((0) & 255), 49, 50, 51, 52, 53, 54, 55, 56, 57, 48, 45, 61, ((0) & 255), ((0) & 255), 113, 119, 101, 114, 116, 121, 117, 105, 111, 112, 91, 93, ((0) & 255), ((0) & 255), 97, 115, 100, 102, 103, 104, 106, 107, 108, 59, ((39) & 255), 96, ((0) & 255), ((92) & 255), 122, 120, 99, 118, 98, 110, 109, 44, 46, 47, ((0) & 255), 42, ((0) & 255), ((32) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), 55, 56, 57, 45, 52, 53, 54, 43, 49, 50, 51, 48, 46, ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255)]);
function __cxx_static_address_8f38dc2b9a75ed072e08b1d1() {
  return __cxx_static_address_8f38dc2b9a75ed072e08b1d1.reference || (__cxx_static_address_8f38dc2b9a75ed072e08b1d1.reference = {
    __cReference: true,
    get value() { return g_keyAsciiTable__header_global_0f29854c4685af07; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:196
export const g_keyAsciiTableShift__header_global_3bbf46f3f71d0c44 = new Uint8Array([((0) & 255), ((0) & 255), 33, 64, 35, 36, 37, 94, 38, 42, 40, 41, 95, 43, ((0) & 255), ((0) & 255), 81, 87, 69, 82, 84, 89, 85, 73, 79, 80, 123, 125, ((0) & 255), ((0) & 255), 65, 83, 68, 70, 71, 72, 74, 75, 76, 58, 34, 126, ((0) & 255), 124, 90, 88, 67, 86, 66, 78, 77, 60, 62, 63, ((0) & 255), 42, ((0) & 255), ((32) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), 55, 56, 57, 45, 52, 53, 54, 43, 49, 50, 51, 48, 46, ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255)]);
function __cxx_static_address_7a7002f9793a4698ec4cc572() {
  return __cxx_static_address_7a7002f9793a4698ec4cc572.reference || (__cxx_static_address_7a7002f9793a4698ec4cc572.reference = {
    __cReference: true,
    get value() { return g_keyAsciiTableShift__header_global_3bbf46f3f71d0c44; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/vfs.cpp:1450
export function xfree__header_13edfa973cd4(ptr) {
  _sm_free(__cxx_global_cell_11016d3c7177543e564ab46c().value, ptr);
}

export function SILENCE_UNUSED__header_5119f34568fc(arg0, arg1) {

}

export function B_PASS32__header_416cc10abcf4(x) {
  return i32(x);
}

// C/C++ source: source/build/src/vfs.cpp:44
export function kztell__header_df1c549f3c13() {
  return i32((__cxx_global_cell_0c0d9a71eef382369e188fb4().value.fil ? __cxx_global_cell_0c0d9a71eef382369e188fb4().value.pos : (-1)));
}

// C/C++ source: source/build/src/vfs.cpp:46
export function kzfilelength__header_fa0b046b8508() {
  return i32((__cxx_global_cell_0c0d9a71eef382369e188fb4().value.fil ? __cxx_global_cell_0c0d9a71eef382369e188fb4().value.leng : 0));
}

export function ARRAY_SIZE__header_d8336ed114b0(arg0) {
  return u64(131072n);
}

// C/C++ source: source/build/src/vfs.cpp:1451
export function xaligned_free__header_de7cc18f4b2c(ptr) {
  _sm_free(__cxx_global_cell_11016d3c7177543e564ab46c().value, ptr);
}

// C/C++ source: source/build/include/smmalloc.h:866
export function _sm_realloc(allocator, p, bytesCount, alignment) {
  return cRecordObject(allocator).Realloc(p, bytesCount, alignment);
}

// C/C++ source: source/build/include/smmalloc.h:859
export function _sm_malloc(allocator, bytesCount, alignment) {
  return cRecordObject(allocator).Alloc(bytesCount, alignment);
}

// C/C++ source: source/build/include/smmalloc.h:864
export function _sm_free(allocator, p) {
  return cRecordObject(allocator).Free(p);
}

// C/C++ source: source/build/include/smmalloc.h:849
export function _sm_allocator_thread_cache_destroy(allocator) {
  if (cPointerCompare(allocator, null, "==")) {
    return;
  }
  cRecordObject(allocator).DestroyThreadCache();
}
