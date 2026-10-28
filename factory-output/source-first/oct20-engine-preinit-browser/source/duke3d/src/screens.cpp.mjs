// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/duke3d/src/screens.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.

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
export const fix16_rad_to_deg_mult__header_global_dbe78fdb21437cd4 = i32(3754936);
function __cxx_static_address_93e9a78385116444ae07d5b7() {
  return __cxx_static_address_93e9a78385116444ae07d5b7.reference || (__cxx_static_address_93e9a78385116444ae07d5b7.reference = {
    __cReference: true,
    get value() { return fix16_rad_to_deg_mult__header_global_dbe78fdb21437cd4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:114
export const fix16_deg_to_rad_mult__header_global_e3cdc9b228581ae6 = i32(1144);
function __cxx_static_address_fc520d7f31ad828fb9776718() {
  return __cxx_static_address_fc520d7f31ad828fb9776718.reference || (__cxx_static_address_fc520d7f31ad828fb9776718.reference = {
    __cReference: true,
    get value() { return fix16_deg_to_rad_mult__header_global_e3cdc9b228581ae6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:43
export const KICK_HIT____header_global_fdec1063106085d4 = ((((((0) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_45d4506bd867db5354f7e2c2() {
  return __cxx_static_address_45d4506bd867db5354f7e2c2.reference || (__cxx_static_address_45d4506bd867db5354f7e2c2.reference = {
    __cReference: true,
    get value() { return KICK_HIT____header_global_fdec1063106085d4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:44
export const PISTOL_RICOCHET____header_global_14505959956262c6 = ((((((1) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5374f719ee29095df00c5119() {
  return __cxx_static_address_5374f719ee29095df00c5119.reference || (__cxx_static_address_5374f719ee29095df00c5119.reference = {
    __cReference: true,
    get value() { return PISTOL_RICOCHET____header_global_14505959956262c6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:45
export const PISTOL_BODYHIT____header_global_642dce4950f57f8e = ((((((2) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1864fb4bc977c41862ffd842() {
  return __cxx_static_address_1864fb4bc977c41862ffd842.reference || (__cxx_static_address_1864fb4bc977c41862ffd842.reference = {
    __cReference: true,
    get value() { return PISTOL_BODYHIT____header_global_642dce4950f57f8e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:46
export const PISTOL_FIRE____header_global_b39622840fd9fb52 = ((((((3) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a8cd902bfcc4a0bee601f267() {
  return __cxx_static_address_a8cd902bfcc4a0bee601f267.reference || (__cxx_static_address_a8cd902bfcc4a0bee601f267.reference = {
    __cReference: true,
    get value() { return PISTOL_FIRE____header_global_b39622840fd9fb52; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:47
export const EJECT_CLIP____header_global_844d7141714e804c = ((((((4) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_deab435a5e284f4f6ff34081() {
  return __cxx_static_address_deab435a5e284f4f6ff34081.reference || (__cxx_static_address_deab435a5e284f4f6ff34081.reference = {
    __cReference: true,
    get value() { return EJECT_CLIP____header_global_844d7141714e804c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:48
export const INSERT_CLIP____header_global_e85ed9ca709affea = ((((((5) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e26664c2521c27e528404219() {
  return __cxx_static_address_e26664c2521c27e528404219.reference || (__cxx_static_address_e26664c2521c27e528404219.reference = {
    __cReference: true,
    get value() { return INSERT_CLIP____header_global_e85ed9ca709affea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:49
export const CHAINGUN_FIRE____header_global_5f43a66a670a90b4 = ((((((6) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a340f37ed20a0809301cfb3a() {
  return __cxx_static_address_a340f37ed20a0809301cfb3a.reference || (__cxx_static_address_a340f37ed20a0809301cfb3a.reference = {
    __cReference: true,
    get value() { return CHAINGUN_FIRE____header_global_5f43a66a670a90b4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:50
export const RPG_SHOOT____header_global_5d44a127e663a340 = ((((((7) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bb6012af7b8acfc2f9abe4be() {
  return __cxx_static_address_bb6012af7b8acfc2f9abe4be.reference || (__cxx_static_address_bb6012af7b8acfc2f9abe4be.reference = {
    __cReference: true,
    get value() { return RPG_SHOOT____header_global_5d44a127e663a340; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:51
export const POOLBALLHIT____header_global_aebae49c1a2f8d56 = ((((((8) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1b992bca808bbb35c2caa826() {
  return __cxx_static_address_1b992bca808bbb35c2caa826.reference || (__cxx_static_address_1b992bca808bbb35c2caa826.reference = {
    __cReference: true,
    get value() { return POOLBALLHIT____header_global_aebae49c1a2f8d56; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:52
export const RPG_EXPLODE____header_global_ebd85ffc033ace7e = ((((((9) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b4ab924b1e2d40b25efa56a1() {
  return __cxx_static_address_b4ab924b1e2d40b25efa56a1.reference || (__cxx_static_address_b4ab924b1e2d40b25efa56a1.reference = {
    __cReference: true,
    get value() { return RPG_EXPLODE____header_global_ebd85ffc033ace7e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:53
export const CAT_FIRE____header_global_4dda75f8ff1706ba = ((((((10) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2aa2cf9392fff7772f6acfd8() {
  return __cxx_static_address_2aa2cf9392fff7772f6acfd8.reference || (__cxx_static_address_2aa2cf9392fff7772f6acfd8.reference = {
    __cReference: true,
    get value() { return CAT_FIRE____header_global_4dda75f8ff1706ba; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:54
export const SHRINKER_FIRE____header_global_ea98449b6669c4a7 = ((((((11) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6e3b3abb4ec1799ce9150acb() {
  return __cxx_static_address_6e3b3abb4ec1799ce9150acb.reference || (__cxx_static_address_6e3b3abb4ec1799ce9150acb.reference = {
    __cReference: true,
    get value() { return SHRINKER_FIRE____header_global_ea98449b6669c4a7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:55
export const PIPEBOMB_BOUNCE____header_global_e80adaeea28c9e62 = ((((((13) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_41b071f83cc8021d571bb490() {
  return __cxx_static_address_41b071f83cc8021d571bb490.reference || (__cxx_static_address_41b071f83cc8021d571bb490.reference = {
    __cReference: true,
    get value() { return PIPEBOMB_BOUNCE____header_global_e80adaeea28c9e62; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:56
export const PIPEBOMB_EXPLODE____header_global_cf545076b25309c2 = ((((((14) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_728ed609201cc5109377fe9d() {
  return __cxx_static_address_728ed609201cc5109377fe9d.reference || (__cxx_static_address_728ed609201cc5109377fe9d.reference = {
    __cReference: true,
    get value() { return PIPEBOMB_EXPLODE____header_global_cf545076b25309c2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:57
export const LASERTRIP_ONWALL____header_global_1fcd44e9fbfff15e = ((((((15) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_353c67f913ec71736b437a07() {
  return __cxx_static_address_353c67f913ec71736b437a07.reference || (__cxx_static_address_353c67f913ec71736b437a07.reference = {
    __cReference: true,
    get value() { return LASERTRIP_ONWALL____header_global_1fcd44e9fbfff15e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:58
export const LASERTRIP_ARMING____header_global_c75b6a5e0ff206e5 = ((((((16) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5351f62d725d2af3f4270545() {
  return __cxx_static_address_5351f62d725d2af3f4270545.reference || (__cxx_static_address_5351f62d725d2af3f4270545.reference = {
    __cReference: true,
    get value() { return LASERTRIP_ARMING____header_global_c75b6a5e0ff206e5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:59
export const LASERTRIP_EXPLODE____header_global_cf1db2ce49f6125b = ((((((17) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0408438365ceb1bfb140c1bb() {
  return __cxx_static_address_0408438365ceb1bfb140c1bb.reference || (__cxx_static_address_0408438365ceb1bfb140c1bb.reference = {
    __cReference: true,
    get value() { return LASERTRIP_EXPLODE____header_global_cf1db2ce49f6125b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:60
export const VENT_BUST____header_global_cda0d34f5d30ac8d = ((((((18) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fc32c9346f27b33641f0ee26() {
  return __cxx_static_address_fc32c9346f27b33641f0ee26.reference || (__cxx_static_address_fc32c9346f27b33641f0ee26.reference = {
    __cReference: true,
    get value() { return VENT_BUST____header_global_cda0d34f5d30ac8d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:61
export const GLASS_BREAKING____header_global_f3893d50d0afc9c1 = ((((((19) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ed800b422323056aa52ba935() {
  return __cxx_static_address_ed800b422323056aa52ba935.reference || (__cxx_static_address_ed800b422323056aa52ba935.reference = {
    __cReference: true,
    get value() { return GLASS_BREAKING____header_global_f3893d50d0afc9c1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:62
export const GLASS_HEAVYBREAK____header_global_b2bc1ff89de75bf9 = ((((((20) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a12b82b83143310d6782a25f() {
  return __cxx_static_address_a12b82b83143310d6782a25f.reference || (__cxx_static_address_a12b82b83143310d6782a25f.reference = {
    __cReference: true,
    get value() { return GLASS_HEAVYBREAK____header_global_b2bc1ff89de75bf9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:63
export const SHORT_CIRCUIT____header_global_385cd5c71bbbb825 = ((((((21) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ff984317f8ece4476dfd2bfc() {
  return __cxx_static_address_ff984317f8ece4476dfd2bfc.reference || (__cxx_static_address_ff984317f8ece4476dfd2bfc.reference = {
    __cReference: true,
    get value() { return SHORT_CIRCUIT____header_global_385cd5c71bbbb825; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:64
export const ITEM_SPLASH____header_global_a022499d286382e1 = ((((((22) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_84d6cd937a63e4bd991f3ac8() {
  return __cxx_static_address_84d6cd937a63e4bd991f3ac8.reference || (__cxx_static_address_84d6cd937a63e4bd991f3ac8.reference = {
    __cReference: true,
    get value() { return ITEM_SPLASH____header_global_a022499d286382e1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:65
export const DUKE_GASP____header_global_f3f72461491fc39d = ((((((25) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_479a2fa30f2ea1beb3d1883c() {
  return __cxx_static_address_479a2fa30f2ea1beb3d1883c.reference || (__cxx_static_address_479a2fa30f2ea1beb3d1883c.reference = {
    __cReference: true,
    get value() { return DUKE_GASP____header_global_f3f72461491fc39d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:66
export const SLIM_RECOG____header_global_c7fc861b34106034 = ((((((26) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8c4dbc68fc0da29d08f1be73() {
  return __cxx_static_address_8c4dbc68fc0da29d08f1be73.reference || (__cxx_static_address_8c4dbc68fc0da29d08f1be73.reference = {
    __cReference: true,
    get value() { return SLIM_RECOG____header_global_c7fc861b34106034; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:67
export const DUKE_URINATE____header_global_3317cb96fe843f25 = ((((((28) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8af1d64a4e03f3cc7578be4e() {
  return __cxx_static_address_8af1d64a4e03f3cc7578be4e.reference || (__cxx_static_address_8af1d64a4e03f3cc7578be4e.reference = {
    __cReference: true,
    get value() { return DUKE_URINATE____header_global_3317cb96fe843f25; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:68
export const ENDSEQVOL3SND2____header_global_56ce2d30290fd780 = ((((((29) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c57fb6d60ee72c7fef85f68d() {
  return __cxx_static_address_c57fb6d60ee72c7fef85f68d.reference || (__cxx_static_address_c57fb6d60ee72c7fef85f68d.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND2____header_global_56ce2d30290fd780; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:69
export const ENDSEQVOL3SND3____header_global_5e6e35c3869ac48e = ((((((30) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3f42e8e55066798ac4e47463() {
  return __cxx_static_address_3f42e8e55066798ac4e47463.reference || (__cxx_static_address_3f42e8e55066798ac4e47463.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND3____header_global_5e6e35c3869ac48e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:70
export const DUKE_CRACK____header_global_29b08acc0c67a93f = ((((((33) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a7463f73be9c50c40e2c84c5() {
  return __cxx_static_address_a7463f73be9c50c40e2c84c5.reference || (__cxx_static_address_a7463f73be9c50c40e2c84c5.reference = {
    __cReference: true,
    get value() { return DUKE_CRACK____header_global_29b08acc0c67a93f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:71
export const SLIM_ATTACK____header_global_5c048c44efd74e7f = ((((((34) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_02690c85778a63d9202927c8() {
  return __cxx_static_address_02690c85778a63d9202927c8.reference || (__cxx_static_address_02690c85778a63d9202927c8.reference = {
    __cReference: true,
    get value() { return SLIM_ATTACK____header_global_5c048c44efd74e7f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:72
export const SOMETHINGHITFORCE____header_global_7642d42323319118 = ((((((35) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d02e383192443c4cc9f29d20() {
  return __cxx_static_address_d02e383192443c4cc9f29d20.reference || (__cxx_static_address_d02e383192443c4cc9f29d20.reference = {
    __cReference: true,
    get value() { return SOMETHINGHITFORCE____header_global_7642d42323319118; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:73
export const DUKE_DRINKING____header_global_55c1f54bf8d8ffd3 = ((((((36) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_49b21ce48f81044d799d2561() {
  return __cxx_static_address_49b21ce48f81044d799d2561.reference || (__cxx_static_address_49b21ce48f81044d799d2561.reference = {
    __cReference: true,
    get value() { return DUKE_DRINKING____header_global_55c1f54bf8d8ffd3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:74
export const DUKE_GRUNT____header_global_cf5f3b8baf6d0595 = ((((((38) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cfbcfa10d77b518a2df53a5d() {
  return __cxx_static_address_cfbcfa10d77b518a2df53a5d.reference || (__cxx_static_address_cfbcfa10d77b518a2df53a5d.reference = {
    __cReference: true,
    get value() { return DUKE_GRUNT____header_global_cf5f3b8baf6d0595; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:75
export const DUKE_HARTBEAT____header_global_3e532e89aac86007 = ((((((39) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e154c912616d83abc9b3b4c2() {
  return __cxx_static_address_e154c912616d83abc9b3b4c2.reference || (__cxx_static_address_e154c912616d83abc9b3b4c2.reference = {
    __cReference: true,
    get value() { return DUKE_HARTBEAT____header_global_3e532e89aac86007; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:76
export const DUKE_ONWATER____header_global_a9755006d7cb3203 = ((((((40) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fd6884de9efdba60ab9313de() {
  return __cxx_static_address_fd6884de9efdba60ab9313de.reference || (__cxx_static_address_fd6884de9efdba60ab9313de.reference = {
    __cReference: true,
    get value() { return DUKE_ONWATER____header_global_a9755006d7cb3203; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:77
export const DUKE_LAND____header_global_585d3eb82376ea3e = ((((((42) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d9790423f8429f52f1d41757() {
  return __cxx_static_address_d9790423f8429f52f1d41757.reference || (__cxx_static_address_d9790423f8429f52f1d41757.reference = {
    __cReference: true,
    get value() { return DUKE_LAND____header_global_585d3eb82376ea3e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:78
export const DUKE_WALKINDUCTS____header_global_39f632718c582976 = ((((((43) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f49b68d8cd802033e1869d08() {
  return __cxx_static_address_f49b68d8cd802033e1869d08.reference || (__cxx_static_address_f49b68d8cd802033e1869d08.reference = {
    __cReference: true,
    get value() { return DUKE_WALKINDUCTS____header_global_39f632718c582976; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:79
export const DUKE_UNDERWATER____header_global_91227ee0fb1a5a34 = ((((((48) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2ff8e8e35d89f7901bb05478() {
  return __cxx_static_address_2ff8e8e35d89f7901bb05478.reference || (__cxx_static_address_2ff8e8e35d89f7901bb05478.reference = {
    __cReference: true,
    get value() { return DUKE_UNDERWATER____header_global_91227ee0fb1a5a34; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:80
export const DUKE_JETPACK_ON____header_global_1b689c6e02e1e1d0 = ((((((49) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b4b0e76e56825d344560ccd6() {
  return __cxx_static_address_b4b0e76e56825d344560ccd6.reference || (__cxx_static_address_b4b0e76e56825d344560ccd6.reference = {
    __cReference: true,
    get value() { return DUKE_JETPACK_ON____header_global_1b689c6e02e1e1d0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:81
export const DUKE_JETPACK_IDLE____header_global_ec2bf0410936ee1a = ((((((50) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f64302fdeda3492d67020fe9() {
  return __cxx_static_address_f64302fdeda3492d67020fe9.reference || (__cxx_static_address_f64302fdeda3492d67020fe9.reference = {
    __cReference: true,
    get value() { return DUKE_JETPACK_IDLE____header_global_ec2bf0410936ee1a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:82
export const DUKE_JETPACK_OFF____header_global_5f73badbc7490c1f = ((((((51) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d75fd48a11a9c6ddc0e3e78f() {
  return __cxx_static_address_d75fd48a11a9c6ddc0e3e78f.reference || (__cxx_static_address_d75fd48a11a9c6ddc0e3e78f.reference = {
    __cReference: true,
    get value() { return DUKE_JETPACK_OFF____header_global_5f73badbc7490c1f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:83
export const DUKETALKTOBOSS____header_global_dfbf2d6e01d1d13b = ((((((56) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7c850489839fcd18757b8fa1() {
  return __cxx_static_address_7c850489839fcd18757b8fa1.reference || (__cxx_static_address_7c850489839fcd18757b8fa1.reference = {
    __cReference: true,
    get value() { return DUKETALKTOBOSS____header_global_dfbf2d6e01d1d13b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:84
export const SQUISHED____header_global_55ecc479c1201f13 = ((((((69) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c2a844d480131866073de06e() {
  return __cxx_static_address_c2a844d480131866073de06e.reference || (__cxx_static_address_c2a844d480131866073de06e.reference = {
    __cReference: true,
    get value() { return SQUISHED____header_global_55ecc479c1201f13; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:85
export const TELEPORTER____header_global_5c457881135d87df = ((((((70) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4f632003063f92ecbdbcf425() {
  return __cxx_static_address_4f632003063f92ecbdbcf425.reference || (__cxx_static_address_4f632003063f92ecbdbcf425.reference = {
    __cReference: true,
    get value() { return TELEPORTER____header_global_5c457881135d87df; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:86
export const ELEVATOR_ON____header_global_0f9401de40908a19 = ((((((71) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_92dc528b83287d1afd6f586a() {
  return __cxx_static_address_92dc528b83287d1afd6f586a.reference || (__cxx_static_address_92dc528b83287d1afd6f586a.reference = {
    __cReference: true,
    get value() { return ELEVATOR_ON____header_global_0f9401de40908a19; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:87
export const ELEVATOR_OFF____header_global_d88e75b3cf1e26ef = ((((((73) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_912534f566e8e6d2b072b29b() {
  return __cxx_static_address_912534f566e8e6d2b072b29b.reference || (__cxx_static_address_912534f566e8e6d2b072b29b.reference = {
    __cReference: true,
    get value() { return ELEVATOR_OFF____header_global_d88e75b3cf1e26ef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:88
export const SUBWAY____header_global_228c9d9369d7d574 = ((((((75) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9898dd2e11cc2431f48b8d7b() {
  return __cxx_static_address_9898dd2e11cc2431f48b8d7b.reference || (__cxx_static_address_9898dd2e11cc2431f48b8d7b.reference = {
    __cReference: true,
    get value() { return SUBWAY____header_global_228c9d9369d7d574; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:89
export const SWITCH_ON____header_global_97c67b008a6d1ae5 = ((((((76) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c71178d975a99a137b82b0a2() {
  return __cxx_static_address_c71178d975a99a137b82b0a2.reference || (__cxx_static_address_c71178d975a99a137b82b0a2.reference = {
    __cReference: true,
    get value() { return SWITCH_ON____header_global_97c67b008a6d1ae5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:90
export const FLUSH_TOILET____header_global_43c540a136440fe3 = ((((((79) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_04cad52d86e35d823ada12cc() {
  return __cxx_static_address_04cad52d86e35d823ada12cc.reference || (__cxx_static_address_04cad52d86e35d823ada12cc.reference = {
    __cReference: true,
    get value() { return FLUSH_TOILET____header_global_43c540a136440fe3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:91
export const EARTHQUAKE____header_global_9665e20b759738be = ((((((81) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_61f9ad8e901d89b0b1d23aee() {
  return __cxx_static_address_61f9ad8e901d89b0b1d23aee.reference || (__cxx_static_address_61f9ad8e901d89b0b1d23aee.reference = {
    __cReference: true,
    get value() { return EARTHQUAKE____header_global_9665e20b759738be; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:92
export const END_OF_LEVEL_WARN____header_global_533d7b3e2bbb575a = ((((((83) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1df77893e0ba756f02d1a484() {
  return __cxx_static_address_1df77893e0ba756f02d1a484.reference || (__cxx_static_address_1df77893e0ba756f02d1a484.reference = {
    __cReference: true,
    get value() { return END_OF_LEVEL_WARN____header_global_533d7b3e2bbb575a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:93
export const WIND_AMBIENCE____header_global_3a43a876994624f9 = ((((((91) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_58c719ff3eeb232e3a22f1bf() {
  return __cxx_static_address_58c719ff3eeb232e3a22f1bf.reference || (__cxx_static_address_58c719ff3eeb232e3a22f1bf.reference = {
    __cReference: true,
    get value() { return WIND_AMBIENCE____header_global_3a43a876994624f9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:94
export const SOMETHING_DRIPPING____header_global_1a53ba5a9d0b387b = ((((((92) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a0a8e2b3ff2988e1c2b58f64() {
  return __cxx_static_address_a0a8e2b3ff2988e1c2b58f64.reference || (__cxx_static_address_a0a8e2b3ff2988e1c2b58f64.reference = {
    __cReference: true,
    get value() { return SOMETHING_DRIPPING____header_global_1a53ba5a9d0b387b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:95
export const BOS1_RECOG____header_global_5abce58051b3771a = ((((((97) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_23b06cb52248ed731613303f() {
  return __cxx_static_address_23b06cb52248ed731613303f.reference || (__cxx_static_address_23b06cb52248ed731613303f.reference = {
    __cReference: true,
    get value() { return BOS1_RECOG____header_global_5abce58051b3771a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:96
export const BOS2_RECOG____header_global_2c25b8c305bfd82a = ((((((102) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d45154e0937a046f850e79e5() {
  return __cxx_static_address_d45154e0937a046f850e79e5.reference || (__cxx_static_address_d45154e0937a046f850e79e5.reference = {
    __cReference: true,
    get value() { return BOS2_RECOG____header_global_2c25b8c305bfd82a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:97
export const DUKE_GETWEAPON2____header_global_2965e59b3f238b89 = ((((((107) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2b6cf4062f1fdb5b33336a3b() {
  return __cxx_static_address_2b6cf4062f1fdb5b33336a3b.reference || (__cxx_static_address_2b6cf4062f1fdb5b33336a3b.reference = {
    __cReference: true,
    get value() { return DUKE_GETWEAPON2____header_global_2965e59b3f238b89; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:98
export const SHOTGUN_FIRE____header_global_a9e8a14abb3c860d = ((((((109) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7606c86ca2e41d9e81fa3ab8() {
  return __cxx_static_address_7606c86ca2e41d9e81fa3ab8.reference || (__cxx_static_address_7606c86ca2e41d9e81fa3ab8.reference = {
    __cReference: true,
    get value() { return SHOTGUN_FIRE____header_global_a9e8a14abb3c860d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:99
export const PRED_RECOG____header_global_43e1bc5e2a0a4839 = ((((((111) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a8935625b1808a610d95e207() {
  return __cxx_static_address_a8935625b1808a610d95e207.reference || (__cxx_static_address_a8935625b1808a610d95e207.reference = {
    __cReference: true,
    get value() { return PRED_RECOG____header_global_43e1bc5e2a0a4839; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:100
export const CAPT_RECOG____header_global_e23812e15d759046 = ((((((117) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bfe71dac2d92cc86e9fbc80b() {
  return __cxx_static_address_bfe71dac2d92cc86e9fbc80b.reference || (__cxx_static_address_bfe71dac2d92cc86e9fbc80b.reference = {
    __cReference: true,
    get value() { return CAPT_RECOG____header_global_e23812e15d759046; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:101
export const PIG_RECOG____header_global_ab0ca90a87db43d4 = ((((((121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_87d0d9c313c0708bf09f2375() {
  return __cxx_static_address_87d0d9c313c0708bf09f2375.reference || (__cxx_static_address_87d0d9c313c0708bf09f2375.reference = {
    __cReference: true,
    get value() { return PIG_RECOG____header_global_ab0ca90a87db43d4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:102
export const RECO_ROAM____header_global_97454146d1011ef7 = ((((((125) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_153c92b9edf9ddeeb1fd5ad1() {
  return __cxx_static_address_153c92b9edf9ddeeb1fd5ad1.reference || (__cxx_static_address_153c92b9edf9ddeeb1fd5ad1.reference = {
    __cReference: true,
    get value() { return RECO_ROAM____header_global_97454146d1011ef7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:103
export const RECO_RECOG____header_global_9edd0699fef00a85 = ((((((126) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0deaa8731fe22b79d1eee4b2() {
  return __cxx_static_address_0deaa8731fe22b79d1eee4b2.reference || (__cxx_static_address_0deaa8731fe22b79d1eee4b2.reference = {
    __cReference: true,
    get value() { return RECO_RECOG____header_global_9edd0699fef00a85; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:104
export const RECO_ATTACK____header_global_9998c449cc851ab4 = ((((((127) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a21c37106f274e24379efc33() {
  return __cxx_static_address_a21c37106f274e24379efc33.reference || (__cxx_static_address_a21c37106f274e24379efc33.reference = {
    __cReference: true,
    get value() { return RECO_ATTACK____header_global_9998c449cc851ab4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:105
export const RECO_PAIN____header_global_cdef330aebb1f85a = ((((((128) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9a7a9e64c42f97514ca0e87f() {
  return __cxx_static_address_9a7a9e64c42f97514ca0e87f.reference || (__cxx_static_address_9a7a9e64c42f97514ca0e87f.reference = {
    __cReference: true,
    get value() { return RECO_PAIN____header_global_cdef330aebb1f85a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:106
export const DRON_RECOG____header_global_2507b99f0e321361 = ((((((131) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_af690c61e74e5c2e78e69d16() {
  return __cxx_static_address_af690c61e74e5c2e78e69d16.reference || (__cxx_static_address_af690c61e74e5c2e78e69d16.reference = {
    __cReference: true,
    get value() { return DRON_RECOG____header_global_2507b99f0e321361; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:107
export const COMM_RECOG____header_global_128cab7e216a2174 = ((((((136) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c375c6f3fb7b620d7268e82c() {
  return __cxx_static_address_c375c6f3fb7b620d7268e82c.reference || (__cxx_static_address_c375c6f3fb7b620d7268e82c.reference = {
    __cReference: true,
    get value() { return COMM_RECOG____header_global_128cab7e216a2174; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:108
export const OCTA_RECOG____header_global_e744e4e0e035d3d7 = ((((((141) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a97e9f65b845a9427dfb32ae() {
  return __cxx_static_address_a97e9f65b845a9427dfb32ae.reference || (__cxx_static_address_a97e9f65b845a9427dfb32ae.reference = {
    __cReference: true,
    get value() { return OCTA_RECOG____header_global_e744e4e0e035d3d7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:109
export const TURR_RECOG____header_global_65acc8cf8f481f70 = ((((((146) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_27a75736370d90d271a26beb() {
  return __cxx_static_address_27a75736370d90d271a26beb.reference || (__cxx_static_address_27a75736370d90d271a26beb.reference = {
    __cReference: true,
    get value() { return TURR_RECOG____header_global_65acc8cf8f481f70; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:110
export const SLIM_DYING____header_global_bcff1d289824945b = ((((((149) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_adc69839d021118f17714941() {
  return __cxx_static_address_adc69839d021118f17714941.reference || (__cxx_static_address_adc69839d021118f17714941.reference = {
    __cReference: true,
    get value() { return SLIM_DYING____header_global_bcff1d289824945b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:111
export const BOS3_RECOG____header_global_75d547d1876b21f3 = ((((((151) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d69220f2587116c7bf3ec5ea() {
  return __cxx_static_address_d69220f2587116c7bf3ec5ea.reference || (__cxx_static_address_d69220f2587116c7bf3ec5ea.reference = {
    __cReference: true,
    get value() { return BOS3_RECOG____header_global_75d547d1876b21f3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:112
export const BOS1_WALK____header_global_7fad9213aa6e7ea4 = ((((((156) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_17cc73f4b83fe38c67467bd0() {
  return __cxx_static_address_17cc73f4b83fe38c67467bd0.reference || (__cxx_static_address_17cc73f4b83fe38c67467bd0.reference = {
    __cReference: true,
    get value() { return BOS1_WALK____header_global_7fad9213aa6e7ea4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:113
export const THUD____header_global_a1c4c1288dcc72bd = ((((((158) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_422cc9abc3acce02b1f89d96() {
  return __cxx_static_address_422cc9abc3acce02b1f89d96.reference || (__cxx_static_address_422cc9abc3acce02b1f89d96.reference = {
    __cReference: true,
    get value() { return THUD____header_global_a1c4c1288dcc72bd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:114
export const WIERDSHOT_FLY____header_global_b7b7f2bc1b96082e = ((((((160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_af404c96d41ea1848883d9b2() {
  return __cxx_static_address_af404c96d41ea1848883d9b2.reference || (__cxx_static_address_af404c96d41ea1848883d9b2.reference = {
    __cReference: true,
    get value() { return WIERDSHOT_FLY____header_global_b7b7f2bc1b96082e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:115
export const SLIM_ROAM____header_global_df33e609dc5126b7 = ((((((163) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_61daa6f9d4e9b0565143f942() {
  return __cxx_static_address_61daa6f9d4e9b0565143f942.reference || (__cxx_static_address_61daa6f9d4e9b0565143f942.reference = {
    __cReference: true,
    get value() { return SLIM_ROAM____header_global_df33e609dc5126b7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:116
export const SHOTGUN_COCK____header_global_7d021a464c50f00e = ((((((169) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4ab7595638fc02e20903eb0d() {
  return __cxx_static_address_4ab7595638fc02e20903eb0d.reference || (__cxx_static_address_4ab7595638fc02e20903eb0d.reference = {
    __cReference: true,
    get value() { return SHOTGUN_COCK____header_global_7d021a464c50f00e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:117
export const GENERIC_AMBIENCE17____header_global_5b622a72a05551d4 = ((((((177) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8470503086d2cfcab46a6643() {
  return __cxx_static_address_8470503086d2cfcab46a6643.reference || (__cxx_static_address_8470503086d2cfcab46a6643.reference = {
    __cReference: true,
    get value() { return GENERIC_AMBIENCE17____header_global_5b622a72a05551d4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:118
export const BONUS_SPEECH1____header_global_eea7f51270de80ed = ((((((195) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_99408982ddf2e555113f421a() {
  return __cxx_static_address_99408982ddf2e555113f421a.reference || (__cxx_static_address_99408982ddf2e555113f421a.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH1____header_global_eea7f51270de80ed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:119
export const BONUS_SPEECH2____header_global_a407022fb13dedd4 = ((((((196) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_33000ba2fe46fdfd792bf4f4() {
  return __cxx_static_address_33000ba2fe46fdfd792bf4f4.reference || (__cxx_static_address_33000ba2fe46fdfd792bf4f4.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH2____header_global_a407022fb13dedd4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:120
export const BONUS_SPEECH3____header_global_e2dbb82afb45559e = ((((((197) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_046b9e8e54535497677fd30b() {
  return __cxx_static_address_046b9e8e54535497677fd30b.reference || (__cxx_static_address_046b9e8e54535497677fd30b.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH3____header_global_e2dbb82afb45559e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:121
export const BONUS_SPEECH4____header_global_07a31bc27fbc9bbc = ((((((199) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b602bc1dcc6ec4d308219ba3() {
  return __cxx_static_address_b602bc1dcc6ec4d308219ba3.reference || (__cxx_static_address_b602bc1dcc6ec4d308219ba3.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH4____header_global_07a31bc27fbc9bbc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:122
export const DUKE_LAND_HURT____header_global_a412a8de3475c71b = ((((((200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_192b7ed09fc72bf52bd92acc() {
  return __cxx_static_address_192b7ed09fc72bf52bd92acc.reference || (__cxx_static_address_192b7ed09fc72bf52bd92acc.reference = {
    __cReference: true,
    get value() { return DUKE_LAND_HURT____header_global_a412a8de3475c71b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:123
export const DUKE_SEARCH2____header_global_2ca6bb6fc7480862 = ((((((207) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ee4af469cbf660c6dd8ec2de() {
  return __cxx_static_address_ee4af469cbf660c6dd8ec2de.reference || (__cxx_static_address_ee4af469cbf660c6dd8ec2de.reference = {
    __cReference: true,
    get value() { return DUKE_SEARCH2____header_global_2ca6bb6fc7480862; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:124
export const DUKE_CRACK2____header_global_8dbf6466be636506 = ((((((208) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1d431980559206dea9e50c9f() {
  return __cxx_static_address_1d431980559206dea9e50c9f.reference || (__cxx_static_address_1d431980559206dea9e50c9f.reference = {
    __cReference: true,
    get value() { return DUKE_CRACK2____header_global_8dbf6466be636506; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:125
export const DUKE_SEARCH____header_global_d7cd125f85d1b037 = ((((((209) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3dbc02442c3f420a6c2d7c8d() {
  return __cxx_static_address_3dbc02442c3f420a6c2d7c8d.reference || (__cxx_static_address_3dbc02442c3f420a6c2d7c8d.reference = {
    __cReference: true,
    get value() { return DUKE_SEARCH____header_global_d7cd125f85d1b037; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:126
export const DUKE_GET____header_global_8f8593dc61fb8841 = ((((((210) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5d82a200507b16e848976786() {
  return __cxx_static_address_5d82a200507b16e848976786.reference || (__cxx_static_address_5d82a200507b16e848976786.reference = {
    __cReference: true,
    get value() { return DUKE_GET____header_global_8f8593dc61fb8841; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:127
export const DUKE_LONGTERM_PAIN____header_global_8ff2252ad299bde9 = ((((((211) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_240de1e59cf7647c149279f4() {
  return __cxx_static_address_240de1e59cf7647c149279f4.reference || (__cxx_static_address_240de1e59cf7647c149279f4.reference = {
    __cReference: true,
    get value() { return DUKE_LONGTERM_PAIN____header_global_8ff2252ad299bde9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:128
export const MONITOR_ACTIVE____header_global_3867383dcff3fa20 = ((((((212) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_74d8bebd53505c14d8e2de33() {
  return __cxx_static_address_74d8bebd53505c14d8e2de33.reference || (__cxx_static_address_74d8bebd53505c14d8e2de33.reference = {
    __cReference: true,
    get value() { return MONITOR_ACTIVE____header_global_3867383dcff3fa20; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:129
export const NITEVISION_ONOFF____header_global_11f1839b054982a4 = ((((((213) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9e583f0ea0072f73190a55c9() {
  return __cxx_static_address_9e583f0ea0072f73190a55c9.reference || (__cxx_static_address_9e583f0ea0072f73190a55c9.reference = {
    __cReference: true,
    get value() { return NITEVISION_ONOFF____header_global_11f1839b054982a4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:130
export const DUKE_CRACK_FIRST____header_global_8ed9f7a17616b496 = ((((((215) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7094f1ff1b9e951b633a3b34() {
  return __cxx_static_address_7094f1ff1b9e951b633a3b34.reference || (__cxx_static_address_7094f1ff1b9e951b633a3b34.reference = {
    __cReference: true,
    get value() { return DUKE_CRACK_FIRST____header_global_8ed9f7a17616b496; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:131
export const DUKE_USEMEDKIT____header_global_40c876384bdf3f2b = ((((((216) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_426536212f9e41e860dba8e0() {
  return __cxx_static_address_426536212f9e41e860dba8e0.reference || (__cxx_static_address_426536212f9e41e860dba8e0.reference = {
    __cReference: true,
    get value() { return DUKE_USEMEDKIT____header_global_40c876384bdf3f2b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:132
export const DUKE_TAKEPILLS____header_global_4c30ff416cf1605c = ((((((217) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1a5ee763e948378638b0b5c0() {
  return __cxx_static_address_1a5ee763e948378638b0b5c0.reference || (__cxx_static_address_1a5ee763e948378638b0b5c0.reference = {
    __cReference: true,
    get value() { return DUKE_TAKEPILLS____header_global_4c30ff416cf1605c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:133
export const DUKE_PISSRELIEF____header_global_5015a77ad9535b9e = ((((((218) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_046ebed6b0bb34f842531f2b() {
  return __cxx_static_address_046ebed6b0bb34f842531f2b.reference || (__cxx_static_address_046ebed6b0bb34f842531f2b.reference = {
    __cReference: true,
    get value() { return DUKE_PISSRELIEF____header_global_5015a77ad9535b9e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:134
export const SELECT_WEAPON____header_global_af2c8e3bc63b1983 = ((((((219) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f9dfab8777fe39352a6b2955() {
  return __cxx_static_address_f9dfab8777fe39352a6b2955.reference || (__cxx_static_address_f9dfab8777fe39352a6b2955.reference = {
    __cReference: true,
    get value() { return SELECT_WEAPON____header_global_af2c8e3bc63b1983; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:135
export const JIBBED_ACTOR5____header_global_88aceb5c44d7378f = ((((((226) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fcac60c3aa33ab1c3937da53() {
  return __cxx_static_address_fcac60c3aa33ab1c3937da53.reference || (__cxx_static_address_fcac60c3aa33ab1c3937da53.reference = {
    __cReference: true,
    get value() { return JIBBED_ACTOR5____header_global_88aceb5c44d7378f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:136
export const JIBBED_ACTOR6____header_global_3091943f1b78557b = ((((((227) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e856f08878edb1faef5fbf6d() {
  return __cxx_static_address_e856f08878edb1faef5fbf6d.reference || (__cxx_static_address_e856f08878edb1faef5fbf6d.reference = {
    __cReference: true,
    get value() { return JIBBED_ACTOR6____header_global_3091943f1b78557b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:137
export const DUKE_GOTHEALTHATLOW____header_global_6f2643295dc06e09 = ((((((229) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4fd09caf7ee32071a55da00c() {
  return __cxx_static_address_4fd09caf7ee32071a55da00c.reference || (__cxx_static_address_4fd09caf7ee32071a55da00c.reference = {
    __cReference: true,
    get value() { return DUKE_GOTHEALTHATLOW____header_global_6f2643295dc06e09; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:138
export const BOSSTALKTODUKE____header_global_262121a0f51e1a45 = ((((((230) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fc12a953fbfc0c2562fb192c() {
  return __cxx_static_address_fc12a953fbfc0c2562fb192c.reference || (__cxx_static_address_fc12a953fbfc0c2562fb192c.reference = {
    __cReference: true,
    get value() { return BOSSTALKTODUKE____header_global_262121a0f51e1a45; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:139
export const WAR_AMBIENCE2____header_global_d21f4e069c6991b7 = ((((((232) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6bc89b0c7aee6faa20796e2a() {
  return __cxx_static_address_6bc89b0c7aee6faa20796e2a.reference || (__cxx_static_address_6bc89b0c7aee6faa20796e2a.reference = {
    __cReference: true,
    get value() { return WAR_AMBIENCE2____header_global_d21f4e069c6991b7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:140
export const EXITMENUSOUND____header_global_3a430cc483e7c1ca = ((((((243) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_be76ed89c43df334cb349eed() {
  return __cxx_static_address_be76ed89c43df334cb349eed.reference || (__cxx_static_address_be76ed89c43df334cb349eed.reference = {
    __cReference: true,
    get value() { return EXITMENUSOUND____header_global_3a430cc483e7c1ca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:141
export const FLY_BY____header_global_095c2d7b9ff403b4 = ((((((244) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_91eb923f337e3933288a9e83() {
  return __cxx_static_address_91eb923f337e3933288a9e83.reference || (__cxx_static_address_91eb923f337e3933288a9e83.reference = {
    __cReference: true,
    get value() { return FLY_BY____header_global_095c2d7b9ff403b4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:142
export const DUKE_SCREAM____header_global_a9e8bcc9e4006b0e = ((((((245) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bab7b5dfe0d3be5203d97fd9() {
  return __cxx_static_address_bab7b5dfe0d3be5203d97fd9.reference || (__cxx_static_address_bab7b5dfe0d3be5203d97fd9.reference = {
    __cReference: true,
    get value() { return DUKE_SCREAM____header_global_a9e8bcc9e4006b0e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:143
export const SHRINKER_HIT____header_global_e59a3db9fa46a489 = ((((((246) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_46d9f152b2c087ccf586a85e() {
  return __cxx_static_address_46d9f152b2c087ccf586a85e.reference || (__cxx_static_address_46d9f152b2c087ccf586a85e.reference = {
    __cReference: true,
    get value() { return SHRINKER_HIT____header_global_e59a3db9fa46a489; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:144
export const RATTY____header_global_16bc9c2631769cfa = ((((((247) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c45b7fcde4f6c4efd542c46f() {
  return __cxx_static_address_c45b7fcde4f6c4efd542c46f.reference || (__cxx_static_address_c45b7fcde4f6c4efd542c46f.reference = {
    __cReference: true,
    get value() { return RATTY____header_global_16bc9c2631769cfa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:145
export const BONUSMUSIC____header_global_45bce09d3e4776ac = ((((((249) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1f7eddcfb9faa4b7d5948717() {
  return __cxx_static_address_1f7eddcfb9faa4b7d5948717.reference || (__cxx_static_address_1f7eddcfb9faa4b7d5948717.reference = {
    __cReference: true,
    get value() { return BONUSMUSIC____header_global_45bce09d3e4776ac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:146
export const DUKE_GETWEAPON6____header_global_8177d12ca1ca69e8 = ((((((264) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3036984a5ff9cdb603ded14a() {
  return __cxx_static_address_3036984a5ff9cdb603ded14a.reference || (__cxx_static_address_3036984a5ff9cdb603ded14a.reference = {
    __cReference: true,
    get value() { return DUKE_GETWEAPON6____header_global_8177d12ca1ca69e8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:147
export const ALIEN_SWITCH1____header_global_2bf00fb7ac7af599 = ((((((272) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1a0751391e1eaddc825438ef() {
  return __cxx_static_address_1a0751391e1eaddc825438ef.reference || (__cxx_static_address_1a0751391e1eaddc825438ef.reference = {
    __cReference: true,
    get value() { return ALIEN_SWITCH1____header_global_2bf00fb7ac7af599; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:148
export const RIPHEADNECK____header_global_d4aa9425eb9fe115 = ((((((284) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_358bdab55dbc3a6c530f4d57() {
  return __cxx_static_address_358bdab55dbc3a6c530f4d57.reference || (__cxx_static_address_358bdab55dbc3a6c530f4d57.reference = {
    __cReference: true,
    get value() { return RIPHEADNECK____header_global_d4aa9425eb9fe115; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:149
export const ENDSEQVOL3SND4____header_global_5705bfb3706b45cb = ((((((288) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8c6a3aeb0f289af33a73dd18() {
  return __cxx_static_address_8c6a3aeb0f289af33a73dd18.reference || (__cxx_static_address_8c6a3aeb0f289af33a73dd18.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND4____header_global_5705bfb3706b45cb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:150
export const ENDSEQVOL3SND5____header_global_3a29ccd3ee0bfa9f = ((((((289) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c6d509db792ae434788aad85() {
  return __cxx_static_address_c6d509db792ae434788aad85.reference || (__cxx_static_address_c6d509db792ae434788aad85.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND5____header_global_3a29ccd3ee0bfa9f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:151
export const ENDSEQVOL3SND6____header_global_b07f69becf7ea002 = ((((((290) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_70a39eeec388cfe3a63a05d6() {
  return __cxx_static_address_70a39eeec388cfe3a63a05d6.reference || (__cxx_static_address_70a39eeec388cfe3a63a05d6.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND6____header_global_b07f69becf7ea002; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:152
export const ENDSEQVOL3SND7____header_global_8718388a477d00fa = ((((((291) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e791f5b5deabbdc17f3464c0() {
  return __cxx_static_address_e791f5b5deabbdc17f3464c0.reference || (__cxx_static_address_e791f5b5deabbdc17f3464c0.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND7____header_global_8718388a477d00fa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:153
export const ENDSEQVOL3SND8____header_global_edde31dbbd510140 = ((((((292) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2135c0b38d3fa1d9add5e20b() {
  return __cxx_static_address_2135c0b38d3fa1d9add5e20b.reference || (__cxx_static_address_2135c0b38d3fa1d9add5e20b.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND8____header_global_edde31dbbd510140; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:154
export const ENDSEQVOL3SND9____header_global_740d030b8e3bd4f6 = ((((((293) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_50b1038b6862ff8c83161c42() {
  return __cxx_static_address_50b1038b6862ff8c83161c42.reference || (__cxx_static_address_50b1038b6862ff8c83161c42.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND9____header_global_740d030b8e3bd4f6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:155
export const WHIPYOURASS____header_global_a3d3882ff165951d = ((((((294) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e86f8a042ae5cde9db7be319() {
  return __cxx_static_address_e86f8a042ae5cde9db7be319.reference || (__cxx_static_address_e86f8a042ae5cde9db7be319.reference = {
    __cReference: true,
    get value() { return WHIPYOURASS____header_global_a3d3882ff165951d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:156
export const ENDSEQVOL2SND1____header_global_1337d0d2e9031d76 = ((((((295) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a2cd492b31ec1b3633e7cdc1() {
  return __cxx_static_address_a2cd492b31ec1b3633e7cdc1.reference || (__cxx_static_address_a2cd492b31ec1b3633e7cdc1.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND1____header_global_1337d0d2e9031d76; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:157
export const ENDSEQVOL2SND2____header_global_1422c1136873b135 = ((((((296) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_efeda462133c07adcc4b1bef() {
  return __cxx_static_address_efeda462133c07adcc4b1bef.reference || (__cxx_static_address_efeda462133c07adcc4b1bef.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND2____header_global_1422c1136873b135; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:158
export const ENDSEQVOL2SND3____header_global_1b2073b032eab314 = ((((((297) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7ad6c5bbb0b30c47c496020b() {
  return __cxx_static_address_7ad6c5bbb0b30c47c496020b.reference || (__cxx_static_address_7ad6c5bbb0b30c47c496020b.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND3____header_global_1b2073b032eab314; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:159
export const ENDSEQVOL2SND4____header_global_bd3b81006771a426 = ((((((298) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eae44281be7c6de055cbea6e() {
  return __cxx_static_address_eae44281be7c6de055cbea6e.reference || (__cxx_static_address_eae44281be7c6de055cbea6e.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND4____header_global_bd3b81006771a426; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:160
export const ENDSEQVOL2SND5____header_global_6fd34edf8047ddee = ((((((299) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ee6adf441d79d0edf1b8bff4() {
  return __cxx_static_address_ee6adf441d79d0edf1b8bff4.reference || (__cxx_static_address_ee6adf441d79d0edf1b8bff4.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND5____header_global_6fd34edf8047ddee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:161
export const ENDSEQVOL2SND6____header_global_462e98c2350da4bc = ((((((300) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_644f76f29e22a856d625a88d() {
  return __cxx_static_address_644f76f29e22a856d625a88d.reference || (__cxx_static_address_644f76f29e22a856d625a88d.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND6____header_global_462e98c2350da4bc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:162
export const ENDSEQVOL2SND7____header_global_1b6fb86f3a7ecc67 = ((((((301) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_72d55b41b06852fada6232ba() {
  return __cxx_static_address_72d55b41b06852fada6232ba.reference || (__cxx_static_address_72d55b41b06852fada6232ba.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND7____header_global_1b6fb86f3a7ecc67; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:163
export const SOMETHINGFROZE____header_global_be1e702d31b853d8 = ((((((303) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_140f8592458047f1876c300b() {
  return __cxx_static_address_140f8592458047f1876c300b.reference || (__cxx_static_address_140f8592458047f1876c300b.reference = {
    __cReference: true,
    get value() { return SOMETHINGFROZE____header_global_be1e702d31b853d8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:164
export const WIND_REPEAT____header_global_9b13ede1823aa0b7 = ((((((308) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e2552899a358fd38a4c04ced() {
  return __cxx_static_address_e2552899a358fd38a4c04ced.reference || (__cxx_static_address_e2552899a358fd38a4c04ced.reference = {
    __cReference: true,
    get value() { return WIND_REPEAT____header_global_9b13ede1823aa0b7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:165
export const BOS4_RECOG____header_global_401adb756213b040 = ((((((342) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_529ef046a3041708e2be1a52() {
  return __cxx_static_address_529ef046a3041708e2be1a52.reference || (__cxx_static_address_529ef046a3041708e2be1a52.reference = {
    __cReference: true,
    get value() { return BOS4_RECOG____header_global_401adb756213b040; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:166
export const LIGHTNING_SLAP____header_global_0d8d4fb4316028a0 = ((((((351) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2ef57ae90570a36cae850f0b() {
  return __cxx_static_address_2ef57ae90570a36cae850f0b.reference || (__cxx_static_address_2ef57ae90570a36cae850f0b.reference = {
    __cReference: true,
    get value() { return LIGHTNING_SLAP____header_global_0d8d4fb4316028a0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:167
export const THUNDER____header_global_63eec141fe3d16e8 = ((((((352) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d4d2dfa81ba167f6e6f9e2d6() {
  return __cxx_static_address_d4d2dfa81ba167f6e6f9e2d6.reference || (__cxx_static_address_d4d2dfa81ba167f6e6f9e2d6.reference = {
    __cReference: true,
    get value() { return THUNDER____header_global_63eec141fe3d16e8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:168
export const INTRO4_1____header_global_db354c61e430e360 = ((((((363) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ac1390501b741f9bcc845395() {
  return __cxx_static_address_ac1390501b741f9bcc845395.reference || (__cxx_static_address_ac1390501b741f9bcc845395.reference = {
    __cReference: true,
    get value() { return INTRO4_1____header_global_db354c61e430e360; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:169
export const INTRO4_2____header_global_5414aa42489b3b9b = ((((((364) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8ae6aa97f630bf237d0f4478() {
  return __cxx_static_address_8ae6aa97f630bf237d0f4478.reference || (__cxx_static_address_8ae6aa97f630bf237d0f4478.reference = {
    __cReference: true,
    get value() { return INTRO4_2____header_global_5414aa42489b3b9b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:170
export const INTRO4_3____header_global_9ec392d0ac92c51e = ((((((365) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7b451f51832326dd11e2f5a2() {
  return __cxx_static_address_7b451f51832326dd11e2f5a2.reference || (__cxx_static_address_7b451f51832326dd11e2f5a2.reference = {
    __cReference: true,
    get value() { return INTRO4_3____header_global_9ec392d0ac92c51e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:171
export const INTRO4_4____header_global_90ce2b409c9d643c = ((((((366) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ed2702371d2f28b99e94ab0b() {
  return __cxx_static_address_ed2702371d2f28b99e94ab0b.reference || (__cxx_static_address_ed2702371d2f28b99e94ab0b.reference = {
    __cReference: true,
    get value() { return INTRO4_4____header_global_90ce2b409c9d643c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:172
export const INTRO4_5____header_global_49ec23241b3dcbdc = ((((((367) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6d8e8edb52213c2061cb30a9() {
  return __cxx_static_address_6d8e8edb52213c2061cb30a9.reference || (__cxx_static_address_6d8e8edb52213c2061cb30a9.reference = {
    __cReference: true,
    get value() { return INTRO4_5____header_global_49ec23241b3dcbdc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:173
export const INTRO4_6____header_global_9f725cd33f18c3f2 = ((((((368) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b767efb2d81546aeea3a402c() {
  return __cxx_static_address_b767efb2d81546aeea3a402c.reference || (__cxx_static_address_b767efb2d81546aeea3a402c.reference = {
    __cReference: true,
    get value() { return INTRO4_6____header_global_9f725cd33f18c3f2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:174
export const BOSS4_DEADSPEECH____header_global_97236c24c406f45a = ((((((370) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_633a6786f7f575c355e3ac87() {
  return __cxx_static_address_633a6786f7f575c355e3ac87.reference || (__cxx_static_address_633a6786f7f575c355e3ac87.reference = {
    __cReference: true,
    get value() { return BOSS4_DEADSPEECH____header_global_97236c24c406f45a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:175
export const BOSS4_FIRSTSEE____header_global_cd26650d3a07facd = ((((((371) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d192d29de462c488396a6000() {
  return __cxx_static_address_d192d29de462c488396a6000.reference || (__cxx_static_address_d192d29de462c488396a6000.reference = {
    __cReference: true,
    get value() { return BOSS4_FIRSTSEE____header_global_cd26650d3a07facd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:176
export const VOL4ENDSND1____header_global_af80b901a9554ce3 = ((((((384) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9c9879942aacacadc87dbf5f() {
  return __cxx_static_address_9c9879942aacacadc87dbf5f.reference || (__cxx_static_address_9c9879942aacacadc87dbf5f.reference = {
    __cReference: true,
    get value() { return VOL4ENDSND1____header_global_af80b901a9554ce3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:177
export const VOL4ENDSND2____header_global_687ff78b827d7bdc = ((((((385) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0b72886bd94f9f0b20a10b92() {
  return __cxx_static_address_0b72886bd94f9f0b20a10b92.reference || (__cxx_static_address_0b72886bd94f9f0b20a10b92.reference = {
    __cReference: true,
    get value() { return VOL4ENDSND2____header_global_687ff78b827d7bdc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:178
export const EXPANDERSHOOT____header_global_409d042608b3eb77 = ((((((388) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6d11df9e445fc45b61581be8() {
  return __cxx_static_address_6d11df9e445fc45b61581be8.reference || (__cxx_static_address_6d11df9e445fc45b61581be8.reference = {
    __cReference: true,
    get value() { return EXPANDERSHOOT____header_global_409d042608b3eb77; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:179
export const INTRO4_B____header_global_46e7962f79ad5014 = ((((((392) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f42c51ffac224518fd2bf962() {
  return __cxx_static_address_f42c51ffac224518fd2bf962.reference || (__cxx_static_address_f42c51ffac224518fd2bf962.reference = {
    __cReference: true,
    get value() { return INTRO4_B____header_global_46e7962f79ad5014; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:180
export const BIGBANG____header_global_2898b62137e05fe7 = ((((((393) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_485fb9ed980449a49e1cb20d() {
  return __cxx_static_address_485fb9ed980449a49e1cb20d.reference || (__cxx_static_address_485fb9ed980449a49e1cb20d.reference = {
    __cReference: true,
    get value() { return BIGBANG____header_global_2898b62137e05fe7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:181
export const FLAMETHROWER_INTRO____header_global_804c64f2e7ec6bb9 = ((((((398) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ce81deab448c07785e32bbba() {
  return __cxx_static_address_ce81deab448c07785e32bbba.reference || (__cxx_static_address_ce81deab448c07785e32bbba.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER_INTRO____header_global_804c64f2e7ec6bb9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:182
export const FLAMETHROWER_LOOP____header_global_3a0ea8ad49b421e9 = ((((((399) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8ce1cbb298251e4f679f87da() {
  return __cxx_static_address_8ce1cbb298251e4f679f87da.reference || (__cxx_static_address_8ce1cbb298251e4f679f87da.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER_LOOP____header_global_3a0ea8ad49b421e9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:183
export const FLAMETHROWER_END____header_global_531554d36009f0cc = ((((((400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_76f7313e29a207570f0b8018() {
  return __cxx_static_address_76f7313e29a207570f0b8018.reference || (__cxx_static_address_76f7313e29a207570f0b8018.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER_END____header_global_531554d36009f0cc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:184
export const E5L7_DUKE_QUIT_YOU____header_global_1a7e997c734e6efc = ((((((401) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7c88343892da1d621dcdc402() {
  return __cxx_static_address_7c88343892da1d621dcdc402.reference || (__cxx_static_address_7c88343892da1d621dcdc402.reference = {
    __cReference: true,
    get value() { return E5L7_DUKE_QUIT_YOU____header_global_1a7e997c734e6efc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:187
export const SECTOREFFECTOR____header_global_7b55c8f8fdd6b9f2 = ((((((1) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1987278eea1415acb2f15cfa() {
  return __cxx_static_address_1987278eea1415acb2f15cfa.reference || (__cxx_static_address_1987278eea1415acb2f15cfa.reference = {
    __cReference: true,
    get value() { return SECTOREFFECTOR____header_global_7b55c8f8fdd6b9f2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:188
export const ACTIVATOR____header_global_a2ad03138f0691bd = ((((((2) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c0c0292ef14ba218f90af0fb() {
  return __cxx_static_address_c0c0292ef14ba218f90af0fb.reference || (__cxx_static_address_c0c0292ef14ba218f90af0fb.reference = {
    __cReference: true,
    get value() { return ACTIVATOR____header_global_a2ad03138f0691bd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:189
export const TOUCHPLATE____header_global_994b18b1af28ccc7 = ((((((3) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9fd4ac21e84bcd7a3dc3409f() {
  return __cxx_static_address_9fd4ac21e84bcd7a3dc3409f.reference || (__cxx_static_address_9fd4ac21e84bcd7a3dc3409f.reference = {
    __cReference: true,
    get value() { return TOUCHPLATE____header_global_994b18b1af28ccc7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:190
export const ACTIVATORLOCKED____header_global_a2570f451aafff95 = ((((((4) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a3427e3b0e2a4abc1331cf33() {
  return __cxx_static_address_a3427e3b0e2a4abc1331cf33.reference || (__cxx_static_address_a3427e3b0e2a4abc1331cf33.reference = {
    __cReference: true,
    get value() { return ACTIVATORLOCKED____header_global_a2570f451aafff95; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:191
export const MUSICANDSFX____header_global_808cfbfd51bac0a8 = ((((((5) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_645376ba61783e4fb8b6ee6b() {
  return __cxx_static_address_645376ba61783e4fb8b6ee6b.reference || (__cxx_static_address_645376ba61783e4fb8b6ee6b.reference = {
    __cReference: true,
    get value() { return MUSICANDSFX____header_global_808cfbfd51bac0a8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:192
export const LOCATORS____header_global_d0d7bd12ac2973a1 = ((((((6) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_22b5d7ff86f3e8e453b5c5d2() {
  return __cxx_static_address_22b5d7ff86f3e8e453b5c5d2.reference || (__cxx_static_address_22b5d7ff86f3e8e453b5c5d2.reference = {
    __cReference: true,
    get value() { return LOCATORS____header_global_d0d7bd12ac2973a1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:193
export const CYCLER____header_global_28c7a4dda61988cd = ((((((7) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0ca2811560edafc7236f6eb7() {
  return __cxx_static_address_0ca2811560edafc7236f6eb7.reference || (__cxx_static_address_0ca2811560edafc7236f6eb7.reference = {
    __cReference: true,
    get value() { return CYCLER____header_global_28c7a4dda61988cd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:194
export const MASTERSWITCH____header_global_e1ae4d5aa3d70f42 = ((((((8) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_60481179341e47fe428744c9() {
  return __cxx_static_address_60481179341e47fe428744c9.reference || (__cxx_static_address_60481179341e47fe428744c9.reference = {
    __cReference: true,
    get value() { return MASTERSWITCH____header_global_e1ae4d5aa3d70f42; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:195
export const RESPAWN____header_global_455c860422446672 = ((((((9) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8f53b0c9d60e79f13d6a8982() {
  return __cxx_static_address_8f53b0c9d60e79f13d6a8982.reference || (__cxx_static_address_8f53b0c9d60e79f13d6a8982.reference = {
    __cReference: true,
    get value() { return RESPAWN____header_global_455c860422446672; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:196
export const GPSPEED____header_global_49e78871978ea546 = ((((((10) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d4c648f80cfa7b7c38777218() {
  return __cxx_static_address_d4c648f80cfa7b7c38777218.reference || (__cxx_static_address_d4c648f80cfa7b7c38777218.reference = {
    __cReference: true,
    get value() { return GPSPEED____header_global_49e78871978ea546; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:197
export const FOF____header_global_d5316eae0837e737 = ((((((13) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5a1f7d83c06e3a885462914c() {
  return __cxx_static_address_5a1f7d83c06e3a885462914c.reference || (__cxx_static_address_5a1f7d83c06e3a885462914c.reference = {
    __cReference: true,
    get value() { return FOF____header_global_d5316eae0837e737; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:198
export const ARROW____header_global_c009abee58c22636 = ((((((20) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_83475fccec155440b79f97a6() {
  return __cxx_static_address_83475fccec155440b79f97a6.reference || (__cxx_static_address_83475fccec155440b79f97a6.reference = {
    __cReference: true,
    get value() { return ARROW____header_global_c009abee58c22636; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:199
export const FIRSTGUNSPRITE____header_global_965900c91c8678f5 = ((((((21) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0760a4810e0dfb3de8271428() {
  return __cxx_static_address_0760a4810e0dfb3de8271428.reference || (__cxx_static_address_0760a4810e0dfb3de8271428.reference = {
    __cReference: true,
    get value() { return FIRSTGUNSPRITE____header_global_965900c91c8678f5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:200
export const CHAINGUNSPRITE____header_global_1f471b6a69a6bd23 = ((((((22) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b2422d34de3dbf0b54cb3d12() {
  return __cxx_static_address_b2422d34de3dbf0b54cb3d12.reference || (__cxx_static_address_b2422d34de3dbf0b54cb3d12.reference = {
    __cReference: true,
    get value() { return CHAINGUNSPRITE____header_global_1f471b6a69a6bd23; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:201
export const RPGSPRITE____header_global_9b73179224677801 = ((((((23) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9d3e4381c5520e8528193b66() {
  return __cxx_static_address_9d3e4381c5520e8528193b66.reference || (__cxx_static_address_9d3e4381c5520e8528193b66.reference = {
    __cReference: true,
    get value() { return RPGSPRITE____header_global_9b73179224677801; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:202
export const FREEZESPRITE____header_global_e249054ab4295d81 = ((((((24) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b2259a8eb217c0e5509b6cbb() {
  return __cxx_static_address_b2259a8eb217c0e5509b6cbb.reference || (__cxx_static_address_b2259a8eb217c0e5509b6cbb.reference = {
    __cReference: true,
    get value() { return FREEZESPRITE____header_global_e249054ab4295d81; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:203
export const SHRINKERSPRITE____header_global_b7f30ca03149f373 = ((((((25) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9bfe24d8e61d70252d27dee5() {
  return __cxx_static_address_9bfe24d8e61d70252d27dee5.reference || (__cxx_static_address_9bfe24d8e61d70252d27dee5.reference = {
    __cReference: true,
    get value() { return SHRINKERSPRITE____header_global_b7f30ca03149f373; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:204
export const HEAVYHBOMB____header_global_60be98e4ce96c6b9 = ((((((26) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b01dae8516748f50572ec78d() {
  return __cxx_static_address_b01dae8516748f50572ec78d.reference || (__cxx_static_address_b01dae8516748f50572ec78d.reference = {
    __cReference: true,
    get value() { return HEAVYHBOMB____header_global_60be98e4ce96c6b9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:205
export const TRIPBOMBSPRITE____header_global_d97482f84ed65060 = ((((((27) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a4d747c57cf075b7558a0c6a() {
  return __cxx_static_address_a4d747c57cf075b7558a0c6a.reference || (__cxx_static_address_a4d747c57cf075b7558a0c6a.reference = {
    __cReference: true,
    get value() { return TRIPBOMBSPRITE____header_global_d97482f84ed65060; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:206
export const SHOTGUNSPRITE____header_global_8d696e181e012a3a = ((((((28) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7b265d8b96996fc30a48fe2d() {
  return __cxx_static_address_7b265d8b96996fc30a48fe2d.reference || (__cxx_static_address_7b265d8b96996fc30a48fe2d.reference = {
    __cReference: true,
    get value() { return SHOTGUNSPRITE____header_global_8d696e181e012a3a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:207
export const DEVISTATORSPRITE____header_global_a83c7aa3b9e3b3e5 = ((((((29) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6bfe0beca09f65072f0a95a5() {
  return __cxx_static_address_6bfe0beca09f65072f0a95a5.reference || (__cxx_static_address_6bfe0beca09f65072f0a95a5.reference = {
    __cReference: true,
    get value() { return DEVISTATORSPRITE____header_global_a83c7aa3b9e3b3e5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:208
export const HEALTHBOX____header_global_2fdd33b44ab27417 = ((((((30) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_78b3dd2372b279dfad844d89() {
  return __cxx_static_address_78b3dd2372b279dfad844d89.reference || (__cxx_static_address_78b3dd2372b279dfad844d89.reference = {
    __cReference: true,
    get value() { return HEALTHBOX____header_global_2fdd33b44ab27417; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:209
export const AMMOBOX____header_global_4b22e7da14739a70 = ((((((31) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_92c718c49124961da845c120() {
  return __cxx_static_address_92c718c49124961da845c120.reference || (__cxx_static_address_92c718c49124961da845c120.reference = {
    __cReference: true,
    get value() { return AMMOBOX____header_global_4b22e7da14739a70; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:210
export const GROWSPRITEICON____header_global_3088861e4865fb06 = ((((((32) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7b65f256b8d28d71b14d52df() {
  return __cxx_static_address_7b65f256b8d28d71b14d52df.reference || (__cxx_static_address_7b65f256b8d28d71b14d52df.reference = {
    __cReference: true,
    get value() { return GROWSPRITEICON____header_global_3088861e4865fb06; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:211
export const INVENTORYBOX____header_global_ba2dca18e404016f = ((((((33) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_40615ed826140773ef8c7224() {
  return __cxx_static_address_40615ed826140773ef8c7224.reference || (__cxx_static_address_40615ed826140773ef8c7224.reference = {
    __cReference: true,
    get value() { return INVENTORYBOX____header_global_ba2dca18e404016f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:212
export const FREEZEAMMO____header_global_a529bd52a6c717ad = ((((((37) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f219d8e0359ff86125e63c08() {
  return __cxx_static_address_f219d8e0359ff86125e63c08.reference || (__cxx_static_address_f219d8e0359ff86125e63c08.reference = {
    __cReference: true,
    get value() { return FREEZEAMMO____header_global_a529bd52a6c717ad; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:213
export const AMMO____header_global_915ec9cb5a4a2417 = ((((((40) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6c9b0355704a5b173186cfd2() {
  return __cxx_static_address_6c9b0355704a5b173186cfd2.reference || (__cxx_static_address_6c9b0355704a5b173186cfd2.reference = {
    __cReference: true,
    get value() { return AMMO____header_global_915ec9cb5a4a2417; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:214
export const BATTERYAMMO____header_global_55815475f0cf18df = ((((((41) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7b77b53b55840f3e3f992788() {
  return __cxx_static_address_7b77b53b55840f3e3f992788.reference || (__cxx_static_address_7b77b53b55840f3e3f992788.reference = {
    __cReference: true,
    get value() { return BATTERYAMMO____header_global_55815475f0cf18df; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:215
export const DEVISTATORAMMO____header_global_c3e0227aaf07ed57 = ((((((42) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_66bd82b75553b900dbb56303() {
  return __cxx_static_address_66bd82b75553b900dbb56303.reference || (__cxx_static_address_66bd82b75553b900dbb56303.reference = {
    __cReference: true,
    get value() { return DEVISTATORAMMO____header_global_c3e0227aaf07ed57; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:216
export const RPGAMMO____header_global_a18fbde7b6b773a3 = ((((((44) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bbf41a63609854a4ceae0d02() {
  return __cxx_static_address_bbf41a63609854a4ceae0d02.reference || (__cxx_static_address_bbf41a63609854a4ceae0d02.reference = {
    __cReference: true,
    get value() { return RPGAMMO____header_global_a18fbde7b6b773a3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:217
export const GROWAMMO____header_global_25f7e5bbc67b6c61 = ((((((45) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_70574b28c6f8b805b6e59226() {
  return __cxx_static_address_70574b28c6f8b805b6e59226.reference || (__cxx_static_address_70574b28c6f8b805b6e59226.reference = {
    __cReference: true,
    get value() { return GROWAMMO____header_global_25f7e5bbc67b6c61; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:218
export const CRYSTALAMMO____header_global_4a58e8fe13fc523e = ((((((46) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_55a92cfd1eb2f5bf36d7d693() {
  return __cxx_static_address_55a92cfd1eb2f5bf36d7d693.reference || (__cxx_static_address_55a92cfd1eb2f5bf36d7d693.reference = {
    __cReference: true,
    get value() { return CRYSTALAMMO____header_global_4a58e8fe13fc523e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:219
export const HBOMBAMMO____header_global_f9aec90d9ccb573a = ((((((47) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ef8026a5361d3729c6070b33() {
  return __cxx_static_address_ef8026a5361d3729c6070b33.reference || (__cxx_static_address_ef8026a5361d3729c6070b33.reference = {
    __cReference: true,
    get value() { return HBOMBAMMO____header_global_f9aec90d9ccb573a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:220
export const AMMOLOTS____header_global_8c7488d6801d3570 = ((((((48) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d509f96de71e6696556f915f() {
  return __cxx_static_address_d509f96de71e6696556f915f.reference || (__cxx_static_address_d509f96de71e6696556f915f.reference = {
    __cReference: true,
    get value() { return AMMOLOTS____header_global_8c7488d6801d3570; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:221
export const SHOTGUNAMMO____header_global_2a5f5cdf1beffe46 = ((((((49) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1b34927e846da4c2d527cfdc() {
  return __cxx_static_address_1b34927e846da4c2d527cfdc.reference || (__cxx_static_address_1b34927e846da4c2d527cfdc.reference = {
    __cReference: true,
    get value() { return SHOTGUNAMMO____header_global_2a5f5cdf1beffe46; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:222
export const COLA____header_global_9ca0868094ccbe37 = ((((((51) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5c3c8488351cda295266153e() {
  return __cxx_static_address_5c3c8488351cda295266153e.reference || (__cxx_static_address_5c3c8488351cda295266153e.reference = {
    __cReference: true,
    get value() { return COLA____header_global_9ca0868094ccbe37; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:223
export const SIXPAK____header_global_ab5d83a04508ad5c = ((((((52) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_74b25c23183f7afa9090e6ec() {
  return __cxx_static_address_74b25c23183f7afa9090e6ec.reference || (__cxx_static_address_74b25c23183f7afa9090e6ec.reference = {
    __cReference: true,
    get value() { return SIXPAK____header_global_ab5d83a04508ad5c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:224
export const FIRSTAID____header_global_8f1df47ee10cdb99 = ((((((53) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0b51fca96fb11c4c7307480d() {
  return __cxx_static_address_0b51fca96fb11c4c7307480d.reference || (__cxx_static_address_0b51fca96fb11c4c7307480d.reference = {
    __cReference: true,
    get value() { return FIRSTAID____header_global_8f1df47ee10cdb99; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:225
export const SHIELD____header_global_2dc5e07f93f9be1e = ((((((54) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_42cc142b61cf0bf72f389d9a() {
  return __cxx_static_address_42cc142b61cf0bf72f389d9a.reference || (__cxx_static_address_42cc142b61cf0bf72f389d9a.reference = {
    __cReference: true,
    get value() { return SHIELD____header_global_2dc5e07f93f9be1e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:226
export const STEROIDS____header_global_f9374792ab6d5759 = ((((((55) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_94605c025bfc31aed176c48d() {
  return __cxx_static_address_94605c025bfc31aed176c48d.reference || (__cxx_static_address_94605c025bfc31aed176c48d.reference = {
    __cReference: true,
    get value() { return STEROIDS____header_global_f9374792ab6d5759; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:227
export const AIRTANK____header_global_311b233d17f87834 = ((((((56) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3b8dd324c4ddbb5e2c2c60c1() {
  return __cxx_static_address_3b8dd324c4ddbb5e2c2c60c1.reference || (__cxx_static_address_3b8dd324c4ddbb5e2c2c60c1.reference = {
    __cReference: true,
    get value() { return AIRTANK____header_global_311b233d17f87834; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:228
export const JETPACK____header_global_859ad45e212a473f = ((((((57) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5c63c1c4c6499e60c95644de() {
  return __cxx_static_address_5c63c1c4c6499e60c95644de.reference || (__cxx_static_address_5c63c1c4c6499e60c95644de.reference = {
    __cReference: true,
    get value() { return JETPACK____header_global_859ad45e212a473f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:229
export const HEATSENSOR____header_global_f289fa8af08d2ea8 = ((((((59) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6719602bced5fc2b0089a300() {
  return __cxx_static_address_6719602bced5fc2b0089a300.reference || (__cxx_static_address_6719602bced5fc2b0089a300.reference = {
    __cReference: true,
    get value() { return HEATSENSOR____header_global_f289fa8af08d2ea8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:230
export const ACCESSCARD____header_global_38bfb9fba94d4ee9 = ((((((60) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9f12893ea13f78f196d138a9() {
  return __cxx_static_address_9f12893ea13f78f196d138a9.reference || (__cxx_static_address_9f12893ea13f78f196d138a9.reference = {
    __cReference: true,
    get value() { return ACCESSCARD____header_global_38bfb9fba94d4ee9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:231
export const BOOTS____header_global_e10f45223f5180df = ((((((61) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0e9e9d027d979ee6c42ec1b6() {
  return __cxx_static_address_0e9e9d027d979ee6c42ec1b6.reference || (__cxx_static_address_0e9e9d027d979ee6c42ec1b6.reference = {
    __cReference: true,
    get value() { return BOOTS____header_global_e10f45223f5180df; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:232
export const MIRRORBROKE____header_global_046225d9d807c1bf = ((((((70) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cd4ae53b3a5ab207052aaf9f() {
  return __cxx_static_address_cd4ae53b3a5ab207052aaf9f.reference || (__cxx_static_address_cd4ae53b3a5ab207052aaf9f.reference = {
    __cReference: true,
    get value() { return MIRRORBROKE____header_global_046225d9d807c1bf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:233
export const CLOUDYOCEAN____header_global_a1e511ce1aa9897f = ((((((78) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f650ef9ff8ce9adb6a67a8de() {
  return __cxx_static_address_f650ef9ff8ce9adb6a67a8de.reference || (__cxx_static_address_f650ef9ff8ce9adb6a67a8de.reference = {
    __cReference: true,
    get value() { return CLOUDYOCEAN____header_global_a1e511ce1aa9897f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:234
export const CLOUDYSKIES____header_global_1d41e6ae874df7b8 = ((((((79) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_68ddb430346dc34c3f5a6b43() {
  return __cxx_static_address_68ddb430346dc34c3f5a6b43.reference || (__cxx_static_address_68ddb430346dc34c3f5a6b43.reference = {
    __cReference: true,
    get value() { return CLOUDYSKIES____header_global_1d41e6ae874df7b8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:235
export const MOONSKY1____header_global_1117dbfe06ec5ca4 = ((((((80) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_448cacc408d86ca834ec273e() {
  return __cxx_static_address_448cacc408d86ca834ec273e.reference || (__cxx_static_address_448cacc408d86ca834ec273e.reference = {
    __cReference: true,
    get value() { return MOONSKY1____header_global_1117dbfe06ec5ca4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:236
export const BIGORBIT1____header_global_e136649b327babbe = ((((((84) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_088c30e43f9d48bb8ae394f9() {
  return __cxx_static_address_088c30e43f9d48bb8ae394f9.reference || (__cxx_static_address_088c30e43f9d48bb8ae394f9.reference = {
    __cReference: true,
    get value() { return BIGORBIT1____header_global_e136649b327babbe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:237
export const LA____header_global_ef491da5a78d7de5 = ((((((89) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_14496a771171355a6f71397c() {
  return __cxx_static_address_14496a771171355a6f71397c.reference || (__cxx_static_address_14496a771171355a6f71397c.reference = {
    __cReference: true,
    get value() { return LA____header_global_ef491da5a78d7de5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:238
export const ATOMICHEALTH____header_global_6cf7543e3bdd25ee = ((((((100) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cf738d074fe312b5562d24ef() {
  return __cxx_static_address_cf738d074fe312b5562d24ef.reference || (__cxx_static_address_cf738d074fe312b5562d24ef.reference = {
    __cReference: true,
    get value() { return ATOMICHEALTH____header_global_6cf7543e3bdd25ee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:239
export const TECHLIGHT2____header_global_816f4ae2ab5e045d = ((((((120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3c1c8dc3db3cb0a47ffa9389() {
  return __cxx_static_address_3c1c8dc3db3cb0a47ffa9389.reference || (__cxx_static_address_3c1c8dc3db3cb0a47ffa9389.reference = {
    __cReference: true,
    get value() { return TECHLIGHT2____header_global_816f4ae2ab5e045d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:240
export const TECHLIGHTBUST2____header_global_d4043f3ee846cefb = ((((((121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_807a92073e9929a7d1a0922d() {
  return __cxx_static_address_807a92073e9929a7d1a0922d.reference || (__cxx_static_address_807a92073e9929a7d1a0922d.reference = {
    __cReference: true,
    get value() { return TECHLIGHTBUST2____header_global_d4043f3ee846cefb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:241
export const TECHLIGHT4____header_global_1b85ed3cbd05a7d0 = ((((((122) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a44986cfdaf46b2a58d00197() {
  return __cxx_static_address_a44986cfdaf46b2a58d00197.reference || (__cxx_static_address_a44986cfdaf46b2a58d00197.reference = {
    __cReference: true,
    get value() { return TECHLIGHT4____header_global_1b85ed3cbd05a7d0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:242
export const TECHLIGHTBUST4____header_global_a6ef7a8cf95fec02 = ((((((123) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_525bf931c2d2e54bf513bae2() {
  return __cxx_static_address_525bf931c2d2e54bf513bae2.reference || (__cxx_static_address_525bf931c2d2e54bf513bae2.reference = {
    __cReference: true,
    get value() { return TECHLIGHTBUST4____header_global_a6ef7a8cf95fec02; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:243
export const WALLLIGHT4____header_global_61397dc230fd0b04 = ((((((124) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7d8dcedf6853adf7f50db0b7() {
  return __cxx_static_address_7d8dcedf6853adf7f50db0b7.reference || (__cxx_static_address_7d8dcedf6853adf7f50db0b7.reference = {
    __cReference: true,
    get value() { return WALLLIGHT4____header_global_61397dc230fd0b04; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:244
export const WALLLIGHTBUST4____header_global_f0591226b9612415 = ((((((125) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_79e1a2861482d8d3493d6259() {
  return __cxx_static_address_79e1a2861482d8d3493d6259.reference || (__cxx_static_address_79e1a2861482d8d3493d6259.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST4____header_global_f0591226b9612415; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:245
export const ACCESSSWITCH____header_global_d908e3f13232ab22 = ((((((130) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_11f5de70205000a72a2f3f4b() {
  return __cxx_static_address_11f5de70205000a72a2f3f4b.reference || (__cxx_static_address_11f5de70205000a72a2f3f4b.reference = {
    __cReference: true,
    get value() { return ACCESSSWITCH____header_global_d908e3f13232ab22; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:246
export const SLOTDOOR____header_global_c372cee9bc0b39c8 = ((((((132) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2aff2c7de70b8643c1d87159() {
  return __cxx_static_address_2aff2c7de70b8643c1d87159.reference || (__cxx_static_address_2aff2c7de70b8643c1d87159.reference = {
    __cReference: true,
    get value() { return SLOTDOOR____header_global_c372cee9bc0b39c8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:247
export const LIGHTSWITCH____header_global_c567ef5a2ae948e6 = ((((((134) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e55088f0fbb0eb5fd63bfd2f() {
  return __cxx_static_address_e55088f0fbb0eb5fd63bfd2f.reference || (__cxx_static_address_e55088f0fbb0eb5fd63bfd2f.reference = {
    __cReference: true,
    get value() { return LIGHTSWITCH____header_global_c567ef5a2ae948e6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:248
export const SPACEDOORSWITCH____header_global_d9f9a938fd893884 = ((((((136) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4137ce28bcb5bcb07407c885() {
  return __cxx_static_address_4137ce28bcb5bcb07407c885.reference || (__cxx_static_address_4137ce28bcb5bcb07407c885.reference = {
    __cReference: true,
    get value() { return SPACEDOORSWITCH____header_global_d9f9a938fd893884; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:249
export const SPACELIGHTSWITCH____header_global_6d43971528b3d55c = ((((((138) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_474284217f21d14abc3033d2() {
  return __cxx_static_address_474284217f21d14abc3033d2.reference || (__cxx_static_address_474284217f21d14abc3033d2.reference = {
    __cReference: true,
    get value() { return SPACELIGHTSWITCH____header_global_6d43971528b3d55c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:250
export const FRANKENSTINESWITCH____header_global_e48f2b7ecd4cf7be = ((((((140) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_20365f80aee50d18ef83d29f() {
  return __cxx_static_address_20365f80aee50d18ef83d29f.reference || (__cxx_static_address_20365f80aee50d18ef83d29f.reference = {
    __cReference: true,
    get value() { return FRANKENSTINESWITCH____header_global_e48f2b7ecd4cf7be; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:251
export const NUKEBUTTON____header_global_295e94a69aedbd48 = ((((((142) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b8c628a7081568dfaaf623ee() {
  return __cxx_static_address_b8c628a7081568dfaaf623ee.reference || (__cxx_static_address_b8c628a7081568dfaaf623ee.reference = {
    __cReference: true,
    get value() { return NUKEBUTTON____header_global_295e94a69aedbd48; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:252
export const MULTISWITCH____header_global_25fce526e7b44276 = ((((((146) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e9c2f764cbe9c4976761b69c() {
  return __cxx_static_address_e9c2f764cbe9c4976761b69c.reference || (__cxx_static_address_e9c2f764cbe9c4976761b69c.reference = {
    __cReference: true,
    get value() { return MULTISWITCH____header_global_25fce526e7b44276; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:253
export const DOORTILE5____header_global_eac3b3e54a0c55fa = ((((((150) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_348b673d1f866f566f265220() {
  return __cxx_static_address_348b673d1f866f566f265220.reference || (__cxx_static_address_348b673d1f866f566f265220.reference = {
    __cReference: true,
    get value() { return DOORTILE5____header_global_eac3b3e54a0c55fa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:254
export const DOORTILE6____header_global_99eeb2c900f8bee7 = ((((((151) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_afe021844f8ca35d0cbfceb4() {
  return __cxx_static_address_afe021844f8ca35d0cbfceb4.reference || (__cxx_static_address_afe021844f8ca35d0cbfceb4.reference = {
    __cReference: true,
    get value() { return DOORTILE6____header_global_99eeb2c900f8bee7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:255
export const DOORTILE1____header_global_e5ec3f82488d261f = ((((((152) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d024205de3cb5943dc2aab8f() {
  return __cxx_static_address_d024205de3cb5943dc2aab8f.reference || (__cxx_static_address_d024205de3cb5943dc2aab8f.reference = {
    __cReference: true,
    get value() { return DOORTILE1____header_global_e5ec3f82488d261f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:256
export const DOORTILE2____header_global_ab34d2b3735fe198 = ((((((153) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f541f0ca3e3d91cb9e2bb8c9() {
  return __cxx_static_address_f541f0ca3e3d91cb9e2bb8c9.reference || (__cxx_static_address_f541f0ca3e3d91cb9e2bb8c9.reference = {
    __cReference: true,
    get value() { return DOORTILE2____header_global_ab34d2b3735fe198; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:257
export const DOORTILE3____header_global_046101fb7d333b5f = ((((((154) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ccf69a1b6312a7a0f6a61c65() {
  return __cxx_static_address_ccf69a1b6312a7a0f6a61c65.reference || (__cxx_static_address_ccf69a1b6312a7a0f6a61c65.reference = {
    __cReference: true,
    get value() { return DOORTILE3____header_global_046101fb7d333b5f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:258
export const DOORTILE4____header_global_dd712b33170b3e69 = ((((((155) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_38982be1bedc85571d838377() {
  return __cxx_static_address_38982be1bedc85571d838377.reference || (__cxx_static_address_38982be1bedc85571d838377.reference = {
    __cReference: true,
    get value() { return DOORTILE4____header_global_dd712b33170b3e69; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:259
export const DOORTILE7____header_global_fbd11804defa9496 = ((((((156) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_07c444b376778ecc808f4bdc() {
  return __cxx_static_address_07c444b376778ecc808f4bdc.reference || (__cxx_static_address_07c444b376778ecc808f4bdc.reference = {
    __cReference: true,
    get value() { return DOORTILE7____header_global_fbd11804defa9496; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:260
export const DOORTILE8____header_global_ac287b363da4d561 = ((((((157) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a3cb0a2bb2b24179de35b68b() {
  return __cxx_static_address_a3cb0a2bb2b24179de35b68b.reference || (__cxx_static_address_a3cb0a2bb2b24179de35b68b.reference = {
    __cReference: true,
    get value() { return DOORTILE8____header_global_ac287b363da4d561; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:261
export const DOORTILE9____header_global_3b20e51e46380a64 = ((((((158) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ce32a7d0da5362cd3d10478c() {
  return __cxx_static_address_ce32a7d0da5362cd3d10478c.reference || (__cxx_static_address_ce32a7d0da5362cd3d10478c.reference = {
    __cReference: true,
    get value() { return DOORTILE9____header_global_3b20e51e46380a64; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:262
export const DOORTILE10____header_global_f868ec9eb895d28d = ((((((159) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a529217df00b235bdf914c3c() {
  return __cxx_static_address_a529217df00b235bdf914c3c.reference || (__cxx_static_address_a529217df00b235bdf914c3c.reference = {
    __cReference: true,
    get value() { return DOORTILE10____header_global_f868ec9eb895d28d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:263
export const DOORSHOCK____header_global_e4e22b6fb5211856 = ((((((160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_609d59801a1a5ed544f1011b() {
  return __cxx_static_address_609d59801a1a5ed544f1011b.reference || (__cxx_static_address_609d59801a1a5ed544f1011b.reference = {
    __cReference: true,
    get value() { return DOORSHOCK____header_global_e4e22b6fb5211856; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:264
export const DIPSWITCH____header_global_ba25bb056c3c9ef9 = ((((((162) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e1b8f0a298266cdc66b5c773() {
  return __cxx_static_address_e1b8f0a298266cdc66b5c773.reference || (__cxx_static_address_e1b8f0a298266cdc66b5c773.reference = {
    __cReference: true,
    get value() { return DIPSWITCH____header_global_ba25bb056c3c9ef9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:265
export const DIPSWITCH2____header_global_e186be2477f041d2 = ((((((164) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2a9ff3921315f58da6107ae9() {
  return __cxx_static_address_2a9ff3921315f58da6107ae9.reference || (__cxx_static_address_2a9ff3921315f58da6107ae9.reference = {
    __cReference: true,
    get value() { return DIPSWITCH2____header_global_e186be2477f041d2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:266
export const TECHSWITCH____header_global_bd251d43692a2947 = ((((((166) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9b815c74a3a3a1329283c8bd() {
  return __cxx_static_address_9b815c74a3a3a1329283c8bd.reference || (__cxx_static_address_9b815c74a3a3a1329283c8bd.reference = {
    __cReference: true,
    get value() { return TECHSWITCH____header_global_bd251d43692a2947; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:267
export const DIPSWITCH3____header_global_7a3f63e7cb35b922 = ((((((168) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b2bc2cc00d6c380ed423e3f1() {
  return __cxx_static_address_b2bc2cc00d6c380ed423e3f1.reference || (__cxx_static_address_b2bc2cc00d6c380ed423e3f1.reference = {
    __cReference: true,
    get value() { return DIPSWITCH3____header_global_7a3f63e7cb35b922; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:268
export const ACCESSSWITCH2____header_global_ad0f5c9402bd1348 = ((((((170) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_58c702075b41c968d9864fd8() {
  return __cxx_static_address_58c702075b41c968d9864fd8.reference || (__cxx_static_address_58c702075b41c968d9864fd8.reference = {
    __cReference: true,
    get value() { return ACCESSSWITCH2____header_global_ad0f5c9402bd1348; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:269
export const FLOORSLIME____header_global_9c54e93d37ef8dd5 = ((((((200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5baa1b75e1e27acf611e7c43() {
  return __cxx_static_address_5baa1b75e1e27acf611e7c43.reference || (__cxx_static_address_5baa1b75e1e27acf611e7c43.reference = {
    __cReference: true,
    get value() { return FLOORSLIME____header_global_9c54e93d37ef8dd5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:270
export const BIGFORCE____header_global_5c5e83ddc9c43c02 = ((((((230) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c9d1ce71d02867baa1edc7f5() {
  return __cxx_static_address_c9d1ce71d02867baa1edc7f5.reference || (__cxx_static_address_c9d1ce71d02867baa1edc7f5.reference = {
    __cReference: true,
    get value() { return BIGFORCE____header_global_5c5e83ddc9c43c02; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:271
export const MASKWALL9____header_global_df3ad530e6255394 = ((((((255) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2a2d3ea69850a99d4e05f2d7() {
  return __cxx_static_address_2a2d3ea69850a99d4e05f2d7.reference || (__cxx_static_address_2a2d3ea69850a99d4e05f2d7.reference = {
    __cReference: true,
    get value() { return MASKWALL9____header_global_df3ad530e6255394; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:272
export const SCREENBREAK1____header_global_4a0d51b47ae4d84f = ((((((263) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7a6d34b71cd102dc103276b9() {
  return __cxx_static_address_7a6d34b71cd102dc103276b9.reference || (__cxx_static_address_7a6d34b71cd102dc103276b9.reference = {
    __cReference: true,
    get value() { return SCREENBREAK1____header_global_4a0d51b47ae4d84f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:273
export const SCREENBREAK2____header_global_ca02a160d4b454b2 = ((((((264) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ac187288936a7e49306d013c() {
  return __cxx_static_address_ac187288936a7e49306d013c.reference || (__cxx_static_address_ac187288936a7e49306d013c.reference = {
    __cReference: true,
    get value() { return SCREENBREAK2____header_global_ca02a160d4b454b2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:274
export const SCREENBREAK3____header_global_fc46199cbc22aa80 = ((((((265) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7ed1589be8aca462a76953f5() {
  return __cxx_static_address_7ed1589be8aca462a76953f5.reference || (__cxx_static_address_7ed1589be8aca462a76953f5.reference = {
    __cReference: true,
    get value() { return SCREENBREAK3____header_global_fc46199cbc22aa80; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:275
export const SCREENBREAK4____header_global_c3b4a83070a65db3 = ((((((266) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4169d18abbccf8d648d9f9c9() {
  return __cxx_static_address_4169d18abbccf8d648d9f9c9.reference || (__cxx_static_address_4169d18abbccf8d648d9f9c9.reference = {
    __cReference: true,
    get value() { return SCREENBREAK4____header_global_c3b4a83070a65db3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:276
export const SCREENBREAK5____header_global_a6adcd3af4f1ca39 = ((((((267) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1338aa579d20d5b44d0437c8() {
  return __cxx_static_address_1338aa579d20d5b44d0437c8.reference || (__cxx_static_address_1338aa579d20d5b44d0437c8.reference = {
    __cReference: true,
    get value() { return SCREENBREAK5____header_global_a6adcd3af4f1ca39; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:277
export const SCREENBREAK6____header_global_77f807d7c0c1e56a = ((((((268) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3b58aeaa3655e49601e2c560() {
  return __cxx_static_address_3b58aeaa3655e49601e2c560.reference || (__cxx_static_address_3b58aeaa3655e49601e2c560.reference = {
    __cReference: true,
    get value() { return SCREENBREAK6____header_global_77f807d7c0c1e56a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:278
export const SCREENBREAK7____header_global_fcc6b47a21419a4c = ((((((269) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b248a919225cd642cfa31e38() {
  return __cxx_static_address_b248a919225cd642cfa31e38.reference || (__cxx_static_address_b248a919225cd642cfa31e38.reference = {
    __cReference: true,
    get value() { return SCREENBREAK7____header_global_fcc6b47a21419a4c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:279
export const SCREENBREAK8____header_global_4306dcda642cc8da = ((((((270) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_06e4a6e106b6ca15011c8394() {
  return __cxx_static_address_06e4a6e106b6ca15011c8394.reference || (__cxx_static_address_06e4a6e106b6ca15011c8394.reference = {
    __cReference: true,
    get value() { return SCREENBREAK8____header_global_4306dcda642cc8da; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:280
export const SCREENBREAK9____header_global_d44514e06fd517e3 = ((((((271) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_35fb7105af121bb0f503501b() {
  return __cxx_static_address_35fb7105af121bb0f503501b.reference || (__cxx_static_address_35fb7105af121bb0f503501b.reference = {
    __cReference: true,
    get value() { return SCREENBREAK9____header_global_d44514e06fd517e3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:281
export const SCREENBREAK10____header_global_ec1077bfc395176d = ((((((272) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_879d67caf24377c55608e1b2() {
  return __cxx_static_address_879d67caf24377c55608e1b2.reference || (__cxx_static_address_879d67caf24377c55608e1b2.reference = {
    __cReference: true,
    get value() { return SCREENBREAK10____header_global_ec1077bfc395176d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:282
export const SCREENBREAK11____header_global_680a7eeefcc8ba62 = ((((((273) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_670b6a681c8ba2e1d1d17429() {
  return __cxx_static_address_670b6a681c8ba2e1d1d17429.reference || (__cxx_static_address_670b6a681c8ba2e1d1d17429.reference = {
    __cReference: true,
    get value() { return SCREENBREAK11____header_global_680a7eeefcc8ba62; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:283
export const SCREENBREAK12____header_global_7038d0b805b38df1 = ((((((274) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2be0a08c93c58469fd830424() {
  return __cxx_static_address_2be0a08c93c58469fd830424.reference || (__cxx_static_address_2be0a08c93c58469fd830424.reference = {
    __cReference: true,
    get value() { return SCREENBREAK12____header_global_7038d0b805b38df1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:284
export const SCREENBREAK13____header_global_d202131a284119b1 = ((((((275) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_87c1be7466906702ddabc1bb() {
  return __cxx_static_address_87c1be7466906702ddabc1bb.reference || (__cxx_static_address_87c1be7466906702ddabc1bb.reference = {
    __cReference: true,
    get value() { return SCREENBREAK13____header_global_d202131a284119b1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:285
export const MASKWALL1____header_global_f3d2c87f2339c2f3 = ((((((285) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_360a5e57ec283e9fffbf8496() {
  return __cxx_static_address_360a5e57ec283e9fffbf8496.reference || (__cxx_static_address_360a5e57ec283e9fffbf8496.reference = {
    __cReference: true,
    get value() { return MASKWALL1____header_global_f3d2c87f2339c2f3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:286
export const W_TECHWALL1____header_global_fbdf0c4c23f4c890 = ((((((293) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fca2d0e03b23c69ffb926ae7() {
  return __cxx_static_address_fca2d0e03b23c69ffb926ae7.reference || (__cxx_static_address_fca2d0e03b23c69ffb926ae7.reference = {
    __cReference: true,
    get value() { return W_TECHWALL1____header_global_fbdf0c4c23f4c890; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:287
export const W_TECHWALL2____header_global_b374c42d5f0c5c23 = ((((((297) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2a7b9341960dd0dc0aa5a034() {
  return __cxx_static_address_2a7b9341960dd0dc0aa5a034.reference || (__cxx_static_address_2a7b9341960dd0dc0aa5a034.reference = {
    __cReference: true,
    get value() { return W_TECHWALL2____header_global_b374c42d5f0c5c23; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:288
export const W_TECHWALL15____header_global_56443ce466c11053 = ((((((299) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_93490203eb5f884f78adf208() {
  return __cxx_static_address_93490203eb5f884f78adf208.reference || (__cxx_static_address_93490203eb5f884f78adf208.reference = {
    __cReference: true,
    get value() { return W_TECHWALL15____header_global_56443ce466c11053; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:289
export const W_TECHWALL3____header_global_2f21d787dc34dd3f = ((((((301) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cf71ee1a5094f80dd3bff053() {
  return __cxx_static_address_cf71ee1a5094f80dd3bff053.reference || (__cxx_static_address_cf71ee1a5094f80dd3bff053.reference = {
    __cReference: true,
    get value() { return W_TECHWALL3____header_global_2f21d787dc34dd3f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:290
export const W_TECHWALL4____header_global_958ccf1c85bd07ca = ((((((305) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4f9cf0f44516a53b19ebf353() {
  return __cxx_static_address_4f9cf0f44516a53b19ebf353.reference || (__cxx_static_address_4f9cf0f44516a53b19ebf353.reference = {
    __cReference: true,
    get value() { return W_TECHWALL4____header_global_958ccf1c85bd07ca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:291
export const W_TECHWALL10____header_global_824bc5944efa5e92 = ((((((306) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8349e586469cf297b14926db() {
  return __cxx_static_address_8349e586469cf297b14926db.reference || (__cxx_static_address_8349e586469cf297b14926db.reference = {
    __cReference: true,
    get value() { return W_TECHWALL10____header_global_824bc5944efa5e92; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:292
export const W_TECHWALL16____header_global_3074ddbc92e30aaf = ((((((307) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a95b4b782084306d80e270f6() {
  return __cxx_static_address_a95b4b782084306d80e270f6.reference || (__cxx_static_address_a95b4b782084306d80e270f6.reference = {
    __cReference: true,
    get value() { return W_TECHWALL16____header_global_3074ddbc92e30aaf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:293
export const WATERTILE2____header_global_0f3cec5fce9b47c0 = ((((((336) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_50d7a83291bf5d5890acc532() {
  return __cxx_static_address_50d7a83291bf5d5890acc532.reference || (__cxx_static_address_50d7a83291bf5d5890acc532.reference = {
    __cReference: true,
    get value() { return WATERTILE2____header_global_0f3cec5fce9b47c0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:294
export const BPANNEL1____header_global_222f26cefabe6448 = ((((((341) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_db7ad576e3d9356378dd60f4() {
  return __cxx_static_address_db7ad576e3d9356378dd60f4.reference || (__cxx_static_address_db7ad576e3d9356378dd60f4.reference = {
    __cReference: true,
    get value() { return BPANNEL1____header_global_222f26cefabe6448; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:295
export const PANNEL1____header_global_5c2952c7919ac390 = ((((((342) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_23c0d6a44624b42bbca452d2() {
  return __cxx_static_address_23c0d6a44624b42bbca452d2.reference || (__cxx_static_address_23c0d6a44624b42bbca452d2.reference = {
    __cReference: true,
    get value() { return PANNEL1____header_global_5c2952c7919ac390; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:296
export const PANNEL2____header_global_632cf9bf3e845d8e = ((((((343) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b1d1f1914f47296970fae367() {
  return __cxx_static_address_b1d1f1914f47296970fae367.reference || (__cxx_static_address_b1d1f1914f47296970fae367.reference = {
    __cReference: true,
    get value() { return PANNEL2____header_global_632cf9bf3e845d8e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:297
export const STATIC____header_global_5695dc34dda3736c = ((((((351) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8c3a1725a89d02874bbd023f() {
  return __cxx_static_address_8c3a1725a89d02874bbd023f.reference || (__cxx_static_address_8c3a1725a89d02874bbd023f.reference = {
    __cReference: true,
    get value() { return STATIC____header_global_5695dc34dda3736c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:298
export const W_SCREENBREAK____header_global_cc79d98e73b8a059 = ((((((357) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_28c1fd7bf7f5898f5c0ed693() {
  return __cxx_static_address_28c1fd7bf7f5898f5c0ed693.reference || (__cxx_static_address_28c1fd7bf7f5898f5c0ed693.reference = {
    __cReference: true,
    get value() { return W_SCREENBREAK____header_global_cc79d98e73b8a059; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:299
export const W_HITTECHWALL3____header_global_3a8606c53dd66e49 = ((((((360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_35d85795b9bea82eb5f4fd11() {
  return __cxx_static_address_35d85795b9bea82eb5f4fd11.reference || (__cxx_static_address_35d85795b9bea82eb5f4fd11.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL3____header_global_3a8606c53dd66e49; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:300
export const W_HITTECHWALL4____header_global_1b0a9b38241413cd = ((((((361) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_90a1c3b09b44e088fd916e79() {
  return __cxx_static_address_90a1c3b09b44e088fd916e79.reference || (__cxx_static_address_90a1c3b09b44e088fd916e79.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL4____header_global_1b0a9b38241413cd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:301
export const W_HITTECHWALL2____header_global_1f2c66d3e2116430 = ((((((362) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6bd2ae11ff4a12bc49f0dde6() {
  return __cxx_static_address_6bd2ae11ff4a12bc49f0dde6.reference || (__cxx_static_address_6bd2ae11ff4a12bc49f0dde6.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL2____header_global_1f2c66d3e2116430; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:302
export const W_HITTECHWALL1____header_global_e47d29b3f381e35b = ((((((363) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2fe1536f8b1f08b8de3abace() {
  return __cxx_static_address_2fe1536f8b1f08b8de3abace.reference || (__cxx_static_address_2fe1536f8b1f08b8de3abace.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL1____header_global_e47d29b3f381e35b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:303
export const MASKWALL10____header_global_8b077aacb042fe25 = ((((((387) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1a3a22e94103f7fc69cc23f7() {
  return __cxx_static_address_1a3a22e94103f7fc69cc23f7.reference || (__cxx_static_address_1a3a22e94103f7fc69cc23f7.reference = {
    __cReference: true,
    get value() { return MASKWALL10____header_global_8b077aacb042fe25; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:304
export const MASKWALL11____header_global_c82cad05036a60dc = ((((((391) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e288b5095ac5ea4d3f3bd71c() {
  return __cxx_static_address_e288b5095ac5ea4d3f3bd71c.reference || (__cxx_static_address_e288b5095ac5ea4d3f3bd71c.reference = {
    __cReference: true,
    get value() { return MASKWALL11____header_global_c82cad05036a60dc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:305
export const DOORTILE22____header_global_c41dbe0dc0a37a89 = ((((((395) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f50fce6c3b341223f36e6acb() {
  return __cxx_static_address_f50fce6c3b341223f36e6acb.reference || (__cxx_static_address_f50fce6c3b341223f36e6acb.reference = {
    __cReference: true,
    get value() { return DOORTILE22____header_global_c41dbe0dc0a37a89; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:306
export const FANSPRITE____header_global_212c6980460113e4 = ((((((407) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0b51c31aed4c614f3b4a4014() {
  return __cxx_static_address_0b51c31aed4c614f3b4a4014.reference || (__cxx_static_address_0b51c31aed4c614f3b4a4014.reference = {
    __cReference: true,
    get value() { return FANSPRITE____header_global_212c6980460113e4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:307
export const FANSPRITEBROKE____header_global_dc6f658ce70fce61 = ((((((411) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4f0f1feeb8feef7e35b0d808() {
  return __cxx_static_address_4f0f1feeb8feef7e35b0d808.reference || (__cxx_static_address_4f0f1feeb8feef7e35b0d808.reference = {
    __cReference: true,
    get value() { return FANSPRITEBROKE____header_global_dc6f658ce70fce61; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:308
export const FANSHADOW____header_global_67abb7f6a65f5dcb = ((((((412) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a4a78e91443460b8672f140c() {
  return __cxx_static_address_a4a78e91443460b8672f140c.reference || (__cxx_static_address_a4a78e91443460b8672f140c.reference = {
    __cReference: true,
    get value() { return FANSHADOW____header_global_67abb7f6a65f5dcb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:309
export const FANSHADOWBROKE____header_global_dc58bc8f13dc5f40 = ((((((416) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d40adbac9c8c83c884146d12() {
  return __cxx_static_address_d40adbac9c8c83c884146d12.reference || (__cxx_static_address_d40adbac9c8c83c884146d12.reference = {
    __cReference: true,
    get value() { return FANSHADOWBROKE____header_global_dc58bc8f13dc5f40; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:310
export const DOORTILE18____header_global_8770726d41750dcd = ((((((447) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6cf7391aedeffa4aa700efc1() {
  return __cxx_static_address_6cf7391aedeffa4aa700efc1.reference || (__cxx_static_address_6cf7391aedeffa4aa700efc1.reference = {
    __cReference: true,
    get value() { return DOORTILE18____header_global_8770726d41750dcd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:311
export const DOORTILE19____header_global_ea312a1d4fa43f91 = ((((((448) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b4cced68e5142bd6a7bfc718() {
  return __cxx_static_address_b4cced68e5142bd6a7bfc718.reference || (__cxx_static_address_b4cced68e5142bd6a7bfc718.reference = {
    __cReference: true,
    get value() { return DOORTILE19____header_global_ea312a1d4fa43f91; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:312
export const DOORTILE20____header_global_5f7fb2eaf12a5831 = ((((((449) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5bd1efc6a7c011dbe2af3f6d() {
  return __cxx_static_address_5bd1efc6a7c011dbe2af3f6d.reference || (__cxx_static_address_5bd1efc6a7c011dbe2af3f6d.reference = {
    __cReference: true,
    get value() { return DOORTILE20____header_global_5f7fb2eaf12a5831; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:313
export const VIEWSCREEN2____header_global_60a11cf66611b8a5 = ((((((499) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1dd1d7bfb32d43fe58ea96f1() {
  return __cxx_static_address_1dd1d7bfb32d43fe58ea96f1.reference || (__cxx_static_address_1dd1d7bfb32d43fe58ea96f1.reference = {
    __cReference: true,
    get value() { return VIEWSCREEN2____header_global_60a11cf66611b8a5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:314
export const VIEWSCREEN____header_global_1788636fe0d88964 = ((((((502) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_49925d0b90b3e90ae6d8a810() {
  return __cxx_static_address_49925d0b90b3e90ae6d8a810.reference || (__cxx_static_address_49925d0b90b3e90ae6d8a810.reference = {
    __cReference: true,
    get value() { return VIEWSCREEN____header_global_1788636fe0d88964; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:315
export const GLASS____header_global_e9bcf39f5c46daee = ((((((503) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d6319fdf1caf10060bfdd56d() {
  return __cxx_static_address_d6319fdf1caf10060bfdd56d.reference || (__cxx_static_address_d6319fdf1caf10060bfdd56d.reference = {
    __cReference: true,
    get value() { return GLASS____header_global_e9bcf39f5c46daee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:316
export const GLASS2____header_global_f547fe698ae88df9 = ((((((504) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_285d05e66e1e8029040a5634() {
  return __cxx_static_address_285d05e66e1e8029040a5634.reference || (__cxx_static_address_285d05e66e1e8029040a5634.reference = {
    __cReference: true,
    get value() { return GLASS2____header_global_f547fe698ae88df9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:317
export const STAINGLASS1____header_global_d22e4bda8b241003 = ((((((510) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6c8e29f180958b22993728d7() {
  return __cxx_static_address_6c8e29f180958b22993728d7.reference || (__cxx_static_address_6c8e29f180958b22993728d7.reference = {
    __cReference: true,
    get value() { return STAINGLASS1____header_global_d22e4bda8b241003; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:318
export const MASKWALL5____header_global_1670fcdb4fc857e5 = ((((((514) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_23507edc85c92cd1a28d1a81() {
  return __cxx_static_address_23507edc85c92cd1a28d1a81.reference || (__cxx_static_address_23507edc85c92cd1a28d1a81.reference = {
    __cReference: true,
    get value() { return MASKWALL5____header_global_1670fcdb4fc857e5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:319
export const SATELITE____header_global_07e382c49ee0f559 = ((((((516) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_89bcb1267251e5617db2b074() {
  return __cxx_static_address_89bcb1267251e5617db2b074.reference || (__cxx_static_address_89bcb1267251e5617db2b074.reference = {
    __cReference: true,
    get value() { return SATELITE____header_global_07e382c49ee0f559; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:320
export const FUELPOD____header_global_33cf0c693f182af8 = ((((((517) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f0cb7e380da46ac42e71638f() {
  return __cxx_static_address_f0cb7e380da46ac42e71638f.reference || (__cxx_static_address_f0cb7e380da46ac42e71638f.reference = {
    __cReference: true,
    get value() { return FUELPOD____header_global_33cf0c693f182af8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:321
export const CRACK1____header_global_7f4da6f0112433b0 = ((((((546) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f4fa3f72190bde4fcfc53340() {
  return __cxx_static_address_f4fa3f72190bde4fcfc53340.reference || (__cxx_static_address_f4fa3f72190bde4fcfc53340.reference = {
    __cReference: true,
    get value() { return CRACK1____header_global_7f4da6f0112433b0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:322
export const CRACK2____header_global_204c46aca475fbab = ((((((547) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9e9088ed5d51727009b85e56() {
  return __cxx_static_address_9e9088ed5d51727009b85e56.reference || (__cxx_static_address_9e9088ed5d51727009b85e56.reference = {
    __cReference: true,
    get value() { return CRACK2____header_global_204c46aca475fbab; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:323
export const CRACK3____header_global_566dcf31770c3be3 = ((((((548) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6bab8b65c05d1989a809820d() {
  return __cxx_static_address_6bab8b65c05d1989a809820d.reference || (__cxx_static_address_6bab8b65c05d1989a809820d.reference = {
    __cReference: true,
    get value() { return CRACK3____header_global_566dcf31770c3be3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:324
export const CRACK4____header_global_bce1eec6675f63b5 = ((((((549) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ff66f5aa9bcb3531044d802a() {
  return __cxx_static_address_ff66f5aa9bcb3531044d802a.reference || (__cxx_static_address_ff66f5aa9bcb3531044d802a.reference = {
    __cReference: true,
    get value() { return CRACK4____header_global_bce1eec6675f63b5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:325
export const FOOTPRINTS____header_global_4414a7cafb258d69 = ((((((550) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_91f8f64437c35096a4a2267b() {
  return __cxx_static_address_91f8f64437c35096a4a2267b.reference || (__cxx_static_address_91f8f64437c35096a4a2267b.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS____header_global_4414a7cafb258d69; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:326
export const DOMELITE____header_global_373752e4e874b1bb = ((((((551) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7e2a0f7313637a815aec35ee() {
  return __cxx_static_address_7e2a0f7313637a815aec35ee.reference || (__cxx_static_address_7e2a0f7313637a815aec35ee.reference = {
    __cReference: true,
    get value() { return DOMELITE____header_global_373752e4e874b1bb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:327
export const CAMERAPOLE____header_global_e668747868fb8402 = ((((((554) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4c34fd899afb7d24e8ba6cc3() {
  return __cxx_static_address_4c34fd899afb7d24e8ba6cc3.reference || (__cxx_static_address_4c34fd899afb7d24e8ba6cc3.reference = {
    __cReference: true,
    get value() { return CAMERAPOLE____header_global_e668747868fb8402; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:328
export const CHAIR1____header_global_371b4511fc14b1dd = ((((((556) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fe5a9df856b93688b1c72780() {
  return __cxx_static_address_fe5a9df856b93688b1c72780.reference || (__cxx_static_address_fe5a9df856b93688b1c72780.reference = {
    __cReference: true,
    get value() { return CHAIR1____header_global_371b4511fc14b1dd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:329
export const CHAIR2____header_global_a8e32f08f4e62b3b = ((((((557) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_74adaa802352f00222c6588d() {
  return __cxx_static_address_74adaa802352f00222c6588d.reference || (__cxx_static_address_74adaa802352f00222c6588d.reference = {
    __cReference: true,
    get value() { return CHAIR2____header_global_a8e32f08f4e62b3b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:330
export const BROKENCHAIR____header_global_7e0d15363c3de87d = ((((((559) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_857846cbff567c557c71a34d() {
  return __cxx_static_address_857846cbff567c557c71a34d.reference || (__cxx_static_address_857846cbff567c557c71a34d.reference = {
    __cReference: true,
    get value() { return BROKENCHAIR____header_global_7e0d15363c3de87d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:331
export const MIRROR____header_global_77bb2986a83aeb56 = ((((((560) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4f616d366de67258210941b9() {
  return __cxx_static_address_4f616d366de67258210941b9.reference || (__cxx_static_address_4f616d366de67258210941b9.reference = {
    __cReference: true,
    get value() { return MIRROR____header_global_77bb2986a83aeb56; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:332
export const WATERFOUNTAIN____header_global_0a7a1dd01c1c8f09 = ((((((563) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ff84ed0b412366c544609291() {
  return __cxx_static_address_ff84ed0b412366c544609291.reference || (__cxx_static_address_ff84ed0b412366c544609291.reference = {
    __cReference: true,
    get value() { return WATERFOUNTAIN____header_global_0a7a1dd01c1c8f09; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:333
export const WATERFOUNTAINBROKE____header_global_774e9adee707c4be = ((((((567) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_15d704488ff1a48decaf835f() {
  return __cxx_static_address_15d704488ff1a48decaf835f.reference || (__cxx_static_address_15d704488ff1a48decaf835f.reference = {
    __cReference: true,
    get value() { return WATERFOUNTAINBROKE____header_global_774e9adee707c4be; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:334
export const FEMMAG1____header_global_f37f263871d3b4d2 = ((((((568) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d9841e60b8274949218f7e34() {
  return __cxx_static_address_d9841e60b8274949218f7e34.reference || (__cxx_static_address_d9841e60b8274949218f7e34.reference = {
    __cReference: true,
    get value() { return FEMMAG1____header_global_f37f263871d3b4d2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:335
export const TOILET____header_global_5594928466420d6a = ((((((569) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_18a0aabb6c1b491dfcef15e5() {
  return __cxx_static_address_18a0aabb6c1b491dfcef15e5.reference || (__cxx_static_address_18a0aabb6c1b491dfcef15e5.reference = {
    __cReference: true,
    get value() { return TOILET____header_global_5594928466420d6a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:336
export const STALL____header_global_7f03fc443bfb7728 = ((((((571) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dd24d36a87dc05f8c3b7ac78() {
  return __cxx_static_address_dd24d36a87dc05f8c3b7ac78.reference || (__cxx_static_address_dd24d36a87dc05f8c3b7ac78.reference = {
    __cReference: true,
    get value() { return STALL____header_global_7f03fc443bfb7728; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:337
export const STALLBROKE____header_global_1589f2dac9863013 = ((((((573) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_15ed95d6707349b593d4c5be() {
  return __cxx_static_address_15ed95d6707349b593d4c5be.reference || (__cxx_static_address_15ed95d6707349b593d4c5be.reference = {
    __cReference: true,
    get value() { return STALLBROKE____header_global_1589f2dac9863013; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:338
export const FEMMAG2____header_global_37a4b6244d54ebc7 = ((((((577) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_67b755bf32fb18775a398ad1() {
  return __cxx_static_address_67b755bf32fb18775a398ad1.reference || (__cxx_static_address_67b755bf32fb18775a398ad1.reference = {
    __cReference: true,
    get value() { return FEMMAG2____header_global_37a4b6244d54ebc7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:339
export const REACTOR2____header_global_12411ac4ea640919 = ((((((578) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b27453a2ee74aca1c5883666() {
  return __cxx_static_address_b27453a2ee74aca1c5883666.reference || (__cxx_static_address_b27453a2ee74aca1c5883666.reference = {
    __cReference: true,
    get value() { return REACTOR2____header_global_12411ac4ea640919; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:340
export const REACTOR2BURNT____header_global_7ef68603735c4a9e = ((((((579) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9e8634787d8563251a9aad4f() {
  return __cxx_static_address_9e8634787d8563251a9aad4f.reference || (__cxx_static_address_9e8634787d8563251a9aad4f.reference = {
    __cReference: true,
    get value() { return REACTOR2BURNT____header_global_7ef68603735c4a9e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:341
export const REACTOR2SPARK____header_global_c091bfbc39f7881f = ((((((580) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e4148cd264038cc26d41e600() {
  return __cxx_static_address_e4148cd264038cc26d41e600.reference || (__cxx_static_address_e4148cd264038cc26d41e600.reference = {
    __cReference: true,
    get value() { return REACTOR2SPARK____header_global_c091bfbc39f7881f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:342
export const GRATE1____header_global_4ac647cbb0d06e26 = ((((((595) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8f92c16bc478118425bb7d3f() {
  return __cxx_static_address_8f92c16bc478118425bb7d3f.reference || (__cxx_static_address_8f92c16bc478118425bb7d3f.reference = {
    __cReference: true,
    get value() { return GRATE1____header_global_4ac647cbb0d06e26; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:343
export const BGRATE1____header_global_6fe469bac68a3805 = ((((((596) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b06e3f066e0b802ab9bbcee2() {
  return __cxx_static_address_b06e3f066e0b802ab9bbcee2.reference || (__cxx_static_address_b06e3f066e0b802ab9bbcee2.reference = {
    __cReference: true,
    get value() { return BGRATE1____header_global_6fe469bac68a3805; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:344
export const SOLARPANNEL____header_global_5c6ac909d4d96137 = ((((((602) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_553f8ae4fd26f96d27bf2006() {
  return __cxx_static_address_553f8ae4fd26f96d27bf2006.reference || (__cxx_static_address_553f8ae4fd26f96d27bf2006.reference = {
    __cReference: true,
    get value() { return SOLARPANNEL____header_global_5c6ac909d4d96137; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:345
export const NAKED1____header_global_38ccb192dcf1c036 = ((((((603) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_122833357b0b327a10a68e31() {
  return __cxx_static_address_122833357b0b327a10a68e31.reference || (__cxx_static_address_122833357b0b327a10a68e31.reference = {
    __cReference: true,
    get value() { return NAKED1____header_global_38ccb192dcf1c036; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:346
export const ANTENNA____header_global_99efe2ae512d261c = ((((((607) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2ead8eb02fd3d8f6bab70080() {
  return __cxx_static_address_2ead8eb02fd3d8f6bab70080.reference || (__cxx_static_address_2ead8eb02fd3d8f6bab70080.reference = {
    __cReference: true,
    get value() { return ANTENNA____header_global_99efe2ae512d261c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:347
export const MASKWALL12____header_global_4314e5552e608637 = ((((((609) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_66530fe94f56c5d97afff0d8() {
  return __cxx_static_address_66530fe94f56c5d97afff0d8.reference || (__cxx_static_address_66530fe94f56c5d97afff0d8.reference = {
    __cReference: true,
    get value() { return MASKWALL12____header_global_4314e5552e608637; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:348
export const TOILETBROKE____header_global_2dd0f50ddbde2a3b = ((((((615) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_905c8107ec070bcc72912f8c() {
  return __cxx_static_address_905c8107ec070bcc72912f8c.reference || (__cxx_static_address_905c8107ec070bcc72912f8c.reference = {
    __cReference: true,
    get value() { return TOILETBROKE____header_global_2dd0f50ddbde2a3b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:349
export const PIPE2____header_global_1367fbe6cd093790 = ((((((616) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c4ea1e9eac0ac28030ebc569() {
  return __cxx_static_address_c4ea1e9eac0ac28030ebc569.reference || (__cxx_static_address_c4ea1e9eac0ac28030ebc569.reference = {
    __cReference: true,
    get value() { return PIPE2____header_global_1367fbe6cd093790; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:350
export const PIPE1B____header_global_f81929c7bec76623 = ((((((617) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e3f477c888ed3167b2083dc6() {
  return __cxx_static_address_e3f477c888ed3167b2083dc6.reference || (__cxx_static_address_e3f477c888ed3167b2083dc6.reference = {
    __cReference: true,
    get value() { return PIPE1B____header_global_f81929c7bec76623; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:351
export const PIPE3____header_global_4fdd6fd601758d50 = ((((((618) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2082569a7dc06f1af5a4baea() {
  return __cxx_static_address_2082569a7dc06f1af5a4baea.reference || (__cxx_static_address_2082569a7dc06f1af5a4baea.reference = {
    __cReference: true,
    get value() { return PIPE3____header_global_4fdd6fd601758d50; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:352
export const PIPE1____header_global_b2e774c0238dd4e2 = ((((((619) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_acec235bfdea63f49c1b3204() {
  return __cxx_static_address_acec235bfdea63f49c1b3204.reference || (__cxx_static_address_acec235bfdea63f49c1b3204.reference = {
    __cReference: true,
    get value() { return PIPE1____header_global_b2e774c0238dd4e2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:353
export const CAMERA1____header_global_b3abc0fe7bfe202e = ((((((621) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_17b4335f7e98e86e0cab18ab() {
  return __cxx_static_address_17b4335f7e98e86e0cab18ab.reference || (__cxx_static_address_17b4335f7e98e86e0cab18ab.reference = {
    __cReference: true,
    get value() { return CAMERA1____header_global_b3abc0fe7bfe202e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:354
export const PIPE2B____header_global_cd6ed5ae21777048 = ((((((633) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d9b9ca0167efd11d5633e93c() {
  return __cxx_static_address_d9b9ca0167efd11d5633e93c.reference || (__cxx_static_address_d9b9ca0167efd11d5633e93c.reference = {
    __cReference: true,
    get value() { return PIPE2B____header_global_cd6ed5ae21777048; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:355
export const BOLT1____header_global_dfabc9aa70a8c415 = ((((((634) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_670dc28f2df7c8ebd5cc4d50() {
  return __cxx_static_address_670dc28f2df7c8ebd5cc4d50.reference || (__cxx_static_address_670dc28f2df7c8ebd5cc4d50.reference = {
    __cReference: true,
    get value() { return BOLT1____header_global_dfabc9aa70a8c415; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:356
export const W_NUMBERS____header_global_c36122defc7438fb = ((((((640) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_95a92eb2ca76b03c749b44f1() {
  return __cxx_static_address_95a92eb2ca76b03c749b44f1.reference || (__cxx_static_address_95a92eb2ca76b03c749b44f1.reference = {
    __cReference: true,
    get value() { return W_NUMBERS____header_global_c36122defc7438fb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:357
export const WATERDRIP____header_global_72e6d0ce8bf5b025 = ((((((660) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5538c58bfd081222e6cff41b() {
  return __cxx_static_address_5538c58bfd081222e6cff41b.reference || (__cxx_static_address_5538c58bfd081222e6cff41b.reference = {
    __cReference: true,
    get value() { return WATERDRIP____header_global_72e6d0ce8bf5b025; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:358
export const WATERBUBBLE____header_global_73cf81fcf6b774b4 = ((((((661) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a05edaac7ad28a1736df3667() {
  return __cxx_static_address_a05edaac7ad28a1736df3667.reference || (__cxx_static_address_a05edaac7ad28a1736df3667.reference = {
    __cReference: true,
    get value() { return WATERBUBBLE____header_global_73cf81fcf6b774b4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:359
export const WATERBUBBLEMAKER____header_global_c8fcecfbbc218036 = ((((((662) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_baddc2845e938fc4495ee1b0() {
  return __cxx_static_address_baddc2845e938fc4495ee1b0.reference || (__cxx_static_address_baddc2845e938fc4495ee1b0.reference = {
    __cReference: true,
    get value() { return WATERBUBBLEMAKER____header_global_c8fcecfbbc218036; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:360
export const W_FORCEFIELD____header_global_e5383edbaebca3b9 = ((((((663) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8db80477cf1cef51cb154713() {
  return __cxx_static_address_8db80477cf1cef51cb154713.reference || (__cxx_static_address_8db80477cf1cef51cb154713.reference = {
    __cReference: true,
    get value() { return W_FORCEFIELD____header_global_e5383edbaebca3b9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:361
export const VACUUM____header_global_3b399df4f44b22a8 = ((((((669) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e5ef2d287d01c5e2e1d8ce2f() {
  return __cxx_static_address_e5ef2d287d01c5e2e1d8ce2f.reference || (__cxx_static_address_e5ef2d287d01c5e2e1d8ce2f.reference = {
    __cReference: true,
    get value() { return VACUUM____header_global_3b399df4f44b22a8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:362
export const FOOTPRINTS2____header_global_cfa5de401d1d6221 = ((((((672) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_581b12012c5ccddab3aacfd7() {
  return __cxx_static_address_581b12012c5ccddab3aacfd7.reference || (__cxx_static_address_581b12012c5ccddab3aacfd7.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS2____header_global_cfa5de401d1d6221; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:363
export const FOOTPRINTS3____header_global_fc63db4826498a87 = ((((((673) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_91f555e67d9eea240cb863cb() {
  return __cxx_static_address_91f555e67d9eea240cb863cb.reference || (__cxx_static_address_91f555e67d9eea240cb863cb.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS3____header_global_fc63db4826498a87; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:364
export const FOOTPRINTS4____header_global_9cd3bc00fc6e8b0b = ((((((674) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_def9e1903fad9c3eeb856460() {
  return __cxx_static_address_def9e1903fad9c3eeb856460.reference || (__cxx_static_address_def9e1903fad9c3eeb856460.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS4____header_global_9cd3bc00fc6e8b0b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:365
export const EGG____header_global_520a0f090a3440bb = ((((((675) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_12bdd7bd1e026d6b2dc9ef41() {
  return __cxx_static_address_12bdd7bd1e026d6b2dc9ef41.reference || (__cxx_static_address_12bdd7bd1e026d6b2dc9ef41.reference = {
    __cReference: true,
    get value() { return EGG____header_global_520a0f090a3440bb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:366
export const SCALE____header_global_347e940ccc0f836d = ((((((678) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_92c31502a6919be6954e652b() {
  return __cxx_static_address_92c31502a6919be6954e652b.reference || (__cxx_static_address_92c31502a6919be6954e652b.reference = {
    __cReference: true,
    get value() { return SCALE____header_global_347e940ccc0f836d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:367
export const CHAIR3____header_global_34dcb37af8a7a4ec = ((((((680) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b3886b0b46e03f991344f523() {
  return __cxx_static_address_b3886b0b46e03f991344f523.reference || (__cxx_static_address_b3886b0b46e03f991344f523.reference = {
    __cReference: true,
    get value() { return CHAIR3____header_global_34dcb37af8a7a4ec; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:368
export const CAMERALIGHT____header_global_b0c6915f30c2e10e = ((((((685) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a99de47c2bf92c10b3b0e7f7() {
  return __cxx_static_address_a99de47c2bf92c10b3b0e7f7.reference || (__cxx_static_address_a99de47c2bf92c10b3b0e7f7.reference = {
    __cReference: true,
    get value() { return CAMERALIGHT____header_global_b0c6915f30c2e10e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:369
export const MOVIECAMERA____header_global_8c7e6efe9c53140a = ((((((686) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_73d69282ffb0eac58283a850() {
  return __cxx_static_address_73d69282ffb0eac58283a850.reference || (__cxx_static_address_73d69282ffb0eac58283a850.reference = {
    __cReference: true,
    get value() { return MOVIECAMERA____header_global_8c7e6efe9c53140a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:370
export const IVUNIT____header_global_4da05d1da1ba3996 = ((((((689) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_528ff058574fecd377ed29a7() {
  return __cxx_static_address_528ff058574fecd377ed29a7.reference || (__cxx_static_address_528ff058574fecd377ed29a7.reference = {
    __cReference: true,
    get value() { return IVUNIT____header_global_4da05d1da1ba3996; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:371
export const POT1____header_global_5227e7e7e5cd6f83 = ((((((694) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f75c3d58dec0195352ea60d4() {
  return __cxx_static_address_f75c3d58dec0195352ea60d4.reference || (__cxx_static_address_f75c3d58dec0195352ea60d4.reference = {
    __cReference: true,
    get value() { return POT1____header_global_5227e7e7e5cd6f83; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:372
export const POT2____header_global_b7d2ff7d4fb838c9 = ((((((695) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f27cc73e99c54765818120ed() {
  return __cxx_static_address_f27cc73e99c54765818120ed.reference || (__cxx_static_address_f27cc73e99c54765818120ed.reference = {
    __cReference: true,
    get value() { return POT2____header_global_b7d2ff7d4fb838c9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:373
export const POT3____header_global_0944dc7ce9342945 = ((((((697) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_20e4963396422526b0ea4b8f() {
  return __cxx_static_address_20e4963396422526b0ea4b8f.reference || (__cxx_static_address_20e4963396422526b0ea4b8f.reference = {
    __cReference: true,
    get value() { return POT3____header_global_0944dc7ce9342945; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:374
export const PIPE3B____header_global_d2eebe9bb2d44d29 = ((((((700) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_70dcaaff2c557c6b5904e36e() {
  return __cxx_static_address_70dcaaff2c557c6b5904e36e.reference || (__cxx_static_address_70dcaaff2c557c6b5904e36e.reference = {
    __cReference: true,
    get value() { return PIPE3B____header_global_d2eebe9bb2d44d29; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:375
export const WALLLIGHT3____header_global_29f02656372e07b1 = ((((((701) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_25ca262267b2d19288a80695() {
  return __cxx_static_address_25ca262267b2d19288a80695.reference || (__cxx_static_address_25ca262267b2d19288a80695.reference = {
    __cReference: true,
    get value() { return WALLLIGHT3____header_global_29f02656372e07b1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:376
export const WALLLIGHTBUST3____header_global_5b84bb4311ea61bc = ((((((702) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_733a63d7e1eb992e4e2f933f() {
  return __cxx_static_address_733a63d7e1eb992e4e2f933f.reference || (__cxx_static_address_733a63d7e1eb992e4e2f933f.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST3____header_global_5b84bb4311ea61bc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:377
export const WALLLIGHT1____header_global_387bb503b4c51248 = ((((((703) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_746a3572fc62d79861dbaf76() {
  return __cxx_static_address_746a3572fc62d79861dbaf76.reference || (__cxx_static_address_746a3572fc62d79861dbaf76.reference = {
    __cReference: true,
    get value() { return WALLLIGHT1____header_global_387bb503b4c51248; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:378
export const WALLLIGHTBUST1____header_global_18a1a6f064c783f2 = ((((((704) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2f700a5bd22809c954a17458() {
  return __cxx_static_address_2f700a5bd22809c954a17458.reference || (__cxx_static_address_2f700a5bd22809c954a17458.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST1____header_global_18a1a6f064c783f2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:379
export const WALLLIGHT2____header_global_61f17223db7ed984 = ((((((705) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9b8c63ab7cf047ff7c91d8f8() {
  return __cxx_static_address_9b8c63ab7cf047ff7c91d8f8.reference || (__cxx_static_address_9b8c63ab7cf047ff7c91d8f8.reference = {
    __cReference: true,
    get value() { return WALLLIGHT2____header_global_61f17223db7ed984; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:380
export const WALLLIGHTBUST2____header_global_965c84e8fad10136 = ((((((706) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7042b56feb11b96866e5e670() {
  return __cxx_static_address_7042b56feb11b96866e5e670.reference || (__cxx_static_address_7042b56feb11b96866e5e670.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST2____header_global_965c84e8fad10136; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:381
export const LIGHTSWITCH2____header_global_04f35d17cfb9f8a2 = ((((((712) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_82a7155378a097b08e680ab6() {
  return __cxx_static_address_82a7155378a097b08e680ab6.reference || (__cxx_static_address_82a7155378a097b08e680ab6.reference = {
    __cReference: true,
    get value() { return LIGHTSWITCH2____header_global_04f35d17cfb9f8a2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:382
export const WAITTOBESEATED____header_global_7d855c6ac259753e = ((((((716) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1ec7c1f12188d0998a34e223() {
  return __cxx_static_address_1ec7c1f12188d0998a34e223.reference || (__cxx_static_address_1ec7c1f12188d0998a34e223.reference = {
    __cReference: true,
    get value() { return WAITTOBESEATED____header_global_7d855c6ac259753e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:383
export const DOORTILE14____header_global_6bc5453f9a3657a3 = ((((((717) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_50d6a74de17c8e0a4325ba10() {
  return __cxx_static_address_50d6a74de17c8e0a4325ba10.reference || (__cxx_static_address_50d6a74de17c8e0a4325ba10.reference = {
    __cReference: true,
    get value() { return DOORTILE14____header_global_6bc5453f9a3657a3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:384
export const STATUE____header_global_4b63b388fb2917e4 = ((((((753) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e39d4bf8365235bb8cd306be() {
  return __cxx_static_address_e39d4bf8365235bb8cd306be.reference || (__cxx_static_address_e39d4bf8365235bb8cd306be.reference = {
    __cReference: true,
    get value() { return STATUE____header_global_4b63b388fb2917e4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:385
export const MIKE____header_global_8dcebd157c7185d2 = ((((((762) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2affef7094ecf633eef9f820() {
  return __cxx_static_address_2affef7094ecf633eef9f820.reference || (__cxx_static_address_2affef7094ecf633eef9f820.reference = {
    __cReference: true,
    get value() { return MIKE____header_global_8dcebd157c7185d2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:386
export const VASE____header_global_777b39c83779e839 = ((((((765) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eb8a244a9eedf634317c68c0() {
  return __cxx_static_address_eb8a244a9eedf634317c68c0.reference || (__cxx_static_address_eb8a244a9eedf634317c68c0.reference = {
    __cReference: true,
    get value() { return VASE____header_global_777b39c83779e839; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:387
export const SUSHIPLATE1____header_global_77a2f05173b12cee = ((((((768) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5f00d6a3e20767c437bbd02d() {
  return __cxx_static_address_5f00d6a3e20767c437bbd02d.reference || (__cxx_static_address_5f00d6a3e20767c437bbd02d.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE1____header_global_77a2f05173b12cee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:388
export const SUSHIPLATE2____header_global_b6c47fca6d05bd43 = ((((((769) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cee88727499c661955fc53fc() {
  return __cxx_static_address_cee88727499c661955fc53fc.reference || (__cxx_static_address_cee88727499c661955fc53fc.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE2____header_global_b6c47fca6d05bd43; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:389
export const SUSHIPLATE3____header_global_abe66d24314f73e9 = ((((((774) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5d51e61efe74d3f1012001ca() {
  return __cxx_static_address_5d51e61efe74d3f1012001ca.reference || (__cxx_static_address_5d51e61efe74d3f1012001ca.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE3____header_global_abe66d24314f73e9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:390
export const SUSHIPLATE4____header_global_ea3ae46296cf63cd = ((((((779) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_68af2edef16dfd2ecdf8c9ef() {
  return __cxx_static_address_68af2edef16dfd2ecdf8c9ef.reference || (__cxx_static_address_68af2edef16dfd2ecdf8c9ef.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE4____header_global_ea3ae46296cf63cd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:391
export const DOORTILE16____header_global_df9da158ab077c11 = ((((((781) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c62605e413004bf2c33c85a8() {
  return __cxx_static_address_c62605e413004bf2c33c85a8.reference || (__cxx_static_address_c62605e413004bf2c33c85a8.reference = {
    __cReference: true,
    get value() { return DOORTILE16____header_global_df9da158ab077c11; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:392
export const SUSHIPLATE5____header_global_2db9a11d38caef47 = ((((((792) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_35a31e05f469ae3eba70c7a2() {
  return __cxx_static_address_35a31e05f469ae3eba70c7a2.reference || (__cxx_static_address_35a31e05f469ae3eba70c7a2.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE5____header_global_2db9a11d38caef47; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:393
export const OJ____header_global_d6e2f47dd4d37cb3 = ((((((806) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5ba03250a777fc16537b4d14() {
  return __cxx_static_address_5ba03250a777fc16537b4d14.reference || (__cxx_static_address_5ba03250a777fc16537b4d14.reference = {
    __cReference: true,
    get value() { return OJ____header_global_d6e2f47dd4d37cb3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:394
export const MASKWALL13____header_global_01bfc31d2b38ab9a = ((((((830) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_363de107b66b858a83f93702() {
  return __cxx_static_address_363de107b66b858a83f93702.reference || (__cxx_static_address_363de107b66b858a83f93702.reference = {
    __cReference: true,
    get value() { return MASKWALL13____header_global_01bfc31d2b38ab9a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:395
export const HURTRAIL____header_global_60b6fa6b15140d16 = ((((((859) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_053616ad38c286c98919f9ba() {
  return __cxx_static_address_053616ad38c286c98919f9ba.reference || (__cxx_static_address_053616ad38c286c98919f9ba.reference = {
    __cReference: true,
    get value() { return HURTRAIL____header_global_60b6fa6b15140d16; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:396
export const POWERSWITCH1____header_global_5c79ac9939d4d107 = ((((((860) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c3a14923015b3f2c2e664cba() {
  return __cxx_static_address_c3a14923015b3f2c2e664cba.reference || (__cxx_static_address_c3a14923015b3f2c2e664cba.reference = {
    __cReference: true,
    get value() { return POWERSWITCH1____header_global_5c79ac9939d4d107; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:397
export const LOCKSWITCH1____header_global_3fb6fb1aea261c68 = ((((((862) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0a2ac8c3b16f1ce3bac7c954() {
  return __cxx_static_address_0a2ac8c3b16f1ce3bac7c954.reference || (__cxx_static_address_0a2ac8c3b16f1ce3bac7c954.reference = {
    __cReference: true,
    get value() { return LOCKSWITCH1____header_global_3fb6fb1aea261c68; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:398
export const POWERSWITCH2____header_global_bb20b23c4055e904 = ((((((864) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ccfdd2cd206f74f3f0971a56() {
  return __cxx_static_address_ccfdd2cd206f74f3f0971a56.reference || (__cxx_static_address_ccfdd2cd206f74f3f0971a56.reference = {
    __cReference: true,
    get value() { return POWERSWITCH2____header_global_bb20b23c4055e904; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:399
export const ATM____header_global_701ec26a1c388ad9 = ((((((867) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0162ba8aa58ea97a6a1b7b41() {
  return __cxx_static_address_0162ba8aa58ea97a6a1b7b41.reference || (__cxx_static_address_0162ba8aa58ea97a6a1b7b41.reference = {
    __cReference: true,
    get value() { return ATM____header_global_701ec26a1c388ad9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:400
export const STATUEFLASH____header_global_aa6fd250c71cb534 = ((((((869) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e71426b327d44128b8961cc8() {
  return __cxx_static_address_e71426b327d44128b8961cc8.reference || (__cxx_static_address_e71426b327d44128b8961cc8.reference = {
    __cReference: true,
    get value() { return STATUEFLASH____header_global_aa6fd250c71cb534; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:401
export const ATMBROKE____header_global_a99e3a790168610e = ((((((888) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8944e58ba5f382b46621cee2() {
  return __cxx_static_address_8944e58ba5f382b46621cee2.reference || (__cxx_static_address_8944e58ba5f382b46621cee2.reference = {
    __cReference: true,
    get value() { return ATMBROKE____header_global_a99e3a790168610e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:402
export const STRIPEBALL____header_global_e01e16079167a426 = ((((((901) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4a10b0a261d2e3be1c4a141d() {
  return __cxx_static_address_4a10b0a261d2e3be1c4a141d.reference || (__cxx_static_address_4a10b0a261d2e3be1c4a141d.reference = {
    __cReference: true,
    get value() { return STRIPEBALL____header_global_e01e16079167a426; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:403
export const QUEBALL____header_global_46752d1f6316f4a2 = ((((((902) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4649b790c73ab843627671de() {
  return __cxx_static_address_4649b790c73ab843627671de.reference || (__cxx_static_address_4649b790c73ab843627671de.reference = {
    __cReference: true,
    get value() { return QUEBALL____header_global_46752d1f6316f4a2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:404
export const POCKET____header_global_b8d4a935c370368d = ((((((903) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5ec070882f3fea692b7f449f() {
  return __cxx_static_address_5ec070882f3fea692b7f449f.reference || (__cxx_static_address_5ec070882f3fea692b7f449f.reference = {
    __cReference: true,
    get value() { return POCKET____header_global_b8d4a935c370368d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:405
export const WOODENHORSE____header_global_2d9ff2ea25b5a66f = ((((((904) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2d88445b622ca2737fa646e3() {
  return __cxx_static_address_2d88445b622ca2737fa646e3.reference || (__cxx_static_address_2d88445b622ca2737fa646e3.reference = {
    __cReference: true,
    get value() { return WOODENHORSE____header_global_2d9ff2ea25b5a66f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:406
export const TREE1____header_global_59fbc100ec1e12be = ((((((908) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_01c8bce75744bbd5d2ce8a6b() {
  return __cxx_static_address_01c8bce75744bbd5d2ce8a6b.reference || (__cxx_static_address_01c8bce75744bbd5d2ce8a6b.reference = {
    __cReference: true,
    get value() { return TREE1____header_global_59fbc100ec1e12be; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:407
export const TREE2____header_global_159694b6788bd142 = ((((((910) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1f3f4aefc3f22bd0c6ae6dfa() {
  return __cxx_static_address_1f3f4aefc3f22bd0c6ae6dfa.reference || (__cxx_static_address_1f3f4aefc3f22bd0c6ae6dfa.reference = {
    __cReference: true,
    get value() { return TREE2____header_global_159694b6788bd142; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:408
export const CACTUS____header_global_a4a5294379b47e47 = ((((((911) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ee5d9ab6d419904e43cff99e() {
  return __cxx_static_address_ee5d9ab6d419904e43cff99e.reference || (__cxx_static_address_ee5d9ab6d419904e43cff99e.reference = {
    __cReference: true,
    get value() { return CACTUS____header_global_a4a5294379b47e47; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:409
export const MASKWALL2____header_global_d277060d5ee6c2b2 = ((((((913) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c06fb2ad1a61b657c003d06d() {
  return __cxx_static_address_c06fb2ad1a61b657c003d06d.reference || (__cxx_static_address_c06fb2ad1a61b657c003d06d.reference = {
    __cReference: true,
    get value() { return MASKWALL2____header_global_d277060d5ee6c2b2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:410
export const MASKWALL3____header_global_84d1f9cf356bd113 = ((((((914) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d063eb33867ef11f1d24cfe1() {
  return __cxx_static_address_d063eb33867ef11f1d24cfe1.reference || (__cxx_static_address_d063eb33867ef11f1d24cfe1.reference = {
    __cReference: true,
    get value() { return MASKWALL3____header_global_84d1f9cf356bd113; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:411
export const MASKWALL4____header_global_4e581c8f4112e21b = ((((((915) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9c0e5661d9b395c29bea1ca0() {
  return __cxx_static_address_9c0e5661d9b395c29bea1ca0.reference || (__cxx_static_address_9c0e5661d9b395c29bea1ca0.reference = {
    __cReference: true,
    get value() { return MASKWALL4____header_global_4e581c8f4112e21b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:412
export const FIREEXT____header_global_33c9415cfe09bcf7 = ((((((916) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eb301232327662ae4a7210a9() {
  return __cxx_static_address_eb301232327662ae4a7210a9.reference || (__cxx_static_address_eb301232327662ae4a7210a9.reference = {
    __cReference: true,
    get value() { return FIREEXT____header_global_33c9415cfe09bcf7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:413
export const TOILETWATER____header_global_7192f30125545147 = ((((((921) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f62973c688d59aee962a6c18() {
  return __cxx_static_address_f62973c688d59aee962a6c18.reference || (__cxx_static_address_f62973c688d59aee962a6c18.reference = {
    __cReference: true,
    get value() { return TOILETWATER____header_global_7192f30125545147; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:414
export const NEON1____header_global_3e1c3584819aa818 = ((((((925) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3d7a96bd98d7141bf5d91996() {
  return __cxx_static_address_3d7a96bd98d7141bf5d91996.reference || (__cxx_static_address_3d7a96bd98d7141bf5d91996.reference = {
    __cReference: true,
    get value() { return NEON1____header_global_3e1c3584819aa818; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:415
export const NEON2____header_global_673512c1a8f7bf0c = ((((((926) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_122ddc8a69334c3e6e62a3ee() {
  return __cxx_static_address_122ddc8a69334c3e6e62a3ee.reference || (__cxx_static_address_122ddc8a69334c3e6e62a3ee.reference = {
    __cReference: true,
    get value() { return NEON2____header_global_673512c1a8f7bf0c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:416
export const CACTUSBROKE____header_global_5549877cb269f29b = ((((((939) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8c70a622195ca02fcfce573f() {
  return __cxx_static_address_8c70a622195ca02fcfce573f.reference || (__cxx_static_address_8c70a622195ca02fcfce573f.reference = {
    __cReference: true,
    get value() { return CACTUSBROKE____header_global_5549877cb269f29b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:417
export const BOUNCEMINE____header_global_54836f3cfe6f7357 = ((((((940) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_55a26b742dc70cfdfc9f1393() {
  return __cxx_static_address_55a26b742dc70cfdfc9f1393.reference || (__cxx_static_address_55a26b742dc70cfdfc9f1393.reference = {
    __cReference: true,
    get value() { return BOUNCEMINE____header_global_54836f3cfe6f7357; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:418
export const BROKEFIREHYDRENT____header_global_d4a543a1e0fafb3a = ((((((950) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_355d740d7c1986170356af05() {
  return __cxx_static_address_355d740d7c1986170356af05.reference || (__cxx_static_address_355d740d7c1986170356af05.reference = {
    __cReference: true,
    get value() { return BROKEFIREHYDRENT____header_global_d4a543a1e0fafb3a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:419
export const BOX____header_global_680432beee567323 = ((((((951) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_83b31211d08fe2de7cf82129() {
  return __cxx_static_address_83b31211d08fe2de7cf82129.reference || (__cxx_static_address_83b31211d08fe2de7cf82129.reference = {
    __cReference: true,
    get value() { return BOX____header_global_680432beee567323; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:420
export const BULLETHOLE____header_global_63ac4221c53d87de = ((((((952) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ce7b49cbb130c5d8a735574a() {
  return __cxx_static_address_ce7b49cbb130c5d8a735574a.reference || (__cxx_static_address_ce7b49cbb130c5d8a735574a.reference = {
    __cReference: true,
    get value() { return BULLETHOLE____header_global_63ac4221c53d87de; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:421
export const BOTTLE1____header_global_470d36af8ff27b7b = ((((((954) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_758bcecef3a5c83ebd625d70() {
  return __cxx_static_address_758bcecef3a5c83ebd625d70.reference || (__cxx_static_address_758bcecef3a5c83ebd625d70.reference = {
    __cReference: true,
    get value() { return BOTTLE1____header_global_470d36af8ff27b7b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:422
export const BOTTLE2____header_global_b4aaf95cfa64650b = ((((((955) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3954feb0f6d442b95818aa57() {
  return __cxx_static_address_3954feb0f6d442b95818aa57.reference || (__cxx_static_address_3954feb0f6d442b95818aa57.reference = {
    __cReference: true,
    get value() { return BOTTLE2____header_global_b4aaf95cfa64650b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:423
export const BOTTLE3____header_global_303ae82b1a761a82 = ((((((956) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d1711d70c6a5d303cfafe51d() {
  return __cxx_static_address_d1711d70c6a5d303cfafe51d.reference || (__cxx_static_address_d1711d70c6a5d303cfafe51d.reference = {
    __cReference: true,
    get value() { return BOTTLE3____header_global_303ae82b1a761a82; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:424
export const BOTTLE4____header_global_77c1e4529a0f8bbb = ((((((957) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_04312d57cab306236ea4f435() {
  return __cxx_static_address_04312d57cab306236ea4f435.reference || (__cxx_static_address_04312d57cab306236ea4f435.reference = {
    __cReference: true,
    get value() { return BOTTLE4____header_global_77c1e4529a0f8bbb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:425
export const FEMPIC5____header_global_288346cb56a1e3ed = ((((((963) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c329a5917632c92555724599() {
  return __cxx_static_address_c329a5917632c92555724599.reference || (__cxx_static_address_c329a5917632c92555724599.reference = {
    __cReference: true,
    get value() { return FEMPIC5____header_global_288346cb56a1e3ed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:426
export const FEMPIC6____header_global_fdcef468c33b99dd = ((((((964) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f4fcbb5519cc0bb03546bc83() {
  return __cxx_static_address_f4fcbb5519cc0bb03546bc83.reference || (__cxx_static_address_f4fcbb5519cc0bb03546bc83.reference = {
    __cReference: true,
    get value() { return FEMPIC6____header_global_fdcef468c33b99dd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:427
export const FEMPIC7____header_global_b958e9bec94b8345 = ((((((965) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5d04d2486e2432bf8f2317e0() {
  return __cxx_static_address_5d04d2486e2432bf8f2317e0.reference || (__cxx_static_address_5d04d2486e2432bf8f2317e0.reference = {
    __cReference: true,
    get value() { return FEMPIC7____header_global_b958e9bec94b8345; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:428
export const HYDROPLANT____header_global_90aa64a649cd97d7 = ((((((969) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e13ec69bff151c4544497f78() {
  return __cxx_static_address_e13ec69bff151c4544497f78.reference || (__cxx_static_address_e13ec69bff151c4544497f78.reference = {
    __cReference: true,
    get value() { return HYDROPLANT____header_global_90aa64a649cd97d7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:429
export const OCEANSPRITE1____header_global_eaf6dbe7ce956eab = ((((((971) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c523351213b7bf4c88279ce3() {
  return __cxx_static_address_c523351213b7bf4c88279ce3.reference || (__cxx_static_address_c523351213b7bf4c88279ce3.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE1____header_global_eaf6dbe7ce956eab; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:430
export const OCEANSPRITE2____header_global_91f4e359f7d2d0ef = ((((((972) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_790fdd0853a2e32f46d07459() {
  return __cxx_static_address_790fdd0853a2e32f46d07459.reference || (__cxx_static_address_790fdd0853a2e32f46d07459.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE2____header_global_91f4e359f7d2d0ef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:431
export const OCEANSPRITE3____header_global_639bb1d97b3db6d6 = ((((((973) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dc81f9f2901ad71973ceee61() {
  return __cxx_static_address_dc81f9f2901ad71973ceee61.reference || (__cxx_static_address_dc81f9f2901ad71973ceee61.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE3____header_global_639bb1d97b3db6d6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:432
export const OCEANSPRITE4____header_global_9bdf777a6f89a011 = ((((((974) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c7a7a826ae26ef67509421c1() {
  return __cxx_static_address_c7a7a826ae26ef67509421c1.reference || (__cxx_static_address_c7a7a826ae26ef67509421c1.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE4____header_global_9bdf777a6f89a011; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:433
export const OCEANSPRITE5____header_global_c3cb8c9120e41f8e = ((((((975) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3113eac2ea51cda855146592() {
  return __cxx_static_address_3113eac2ea51cda855146592.reference || (__cxx_static_address_3113eac2ea51cda855146592.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE5____header_global_c3cb8c9120e41f8e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:434
export const GENERICPOLE____header_global_a02f91e5cfbe6d15 = ((((((977) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1bd9042d975bb27876c86476() {
  return __cxx_static_address_1bd9042d975bb27876c86476.reference || (__cxx_static_address_1bd9042d975bb27876c86476.reference = {
    __cReference: true,
    get value() { return GENERICPOLE____header_global_a02f91e5cfbe6d15; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:435
export const CONE____header_global_447f8b0261f1e160 = ((((((978) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4f92750a3c1c11902c7e810d() {
  return __cxx_static_address_4f92750a3c1c11902c7e810d.reference || (__cxx_static_address_4f92750a3c1c11902c7e810d.reference = {
    __cReference: true,
    get value() { return CONE____header_global_447f8b0261f1e160; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:436
export const HANGLIGHT____header_global_57ba6cf105466d49 = ((((((979) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_681eb53be226c3622722595a() {
  return __cxx_static_address_681eb53be226c3622722595a.reference || (__cxx_static_address_681eb53be226c3622722595a.reference = {
    __cReference: true,
    get value() { return HANGLIGHT____header_global_57ba6cf105466d49; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:437
export const HYDRENT____header_global_122ea89a0549116f = ((((((981) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_734dafd5d5da71b4197b1ced() {
  return __cxx_static_address_734dafd5d5da71b4197b1ced.reference || (__cxx_static_address_734dafd5d5da71b4197b1ced.reference = {
    __cReference: true,
    get value() { return HYDRENT____header_global_122ea89a0549116f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:438
export const MASKWALL14____header_global_ebd9fa408cdcbc23 = ((((((988) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1ad57be24f2262e5ed6b1453() {
  return __cxx_static_address_1ad57be24f2262e5ed6b1453.reference || (__cxx_static_address_1ad57be24f2262e5ed6b1453.reference = {
    __cReference: true,
    get value() { return MASKWALL14____header_global_ebd9fa408cdcbc23; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:439
export const TIRE____header_global_f1569a48e5b96d14 = ((((((990) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b4c5209c0fb0e8b84b664d73() {
  return __cxx_static_address_b4c5209c0fb0e8b84b664d73.reference || (__cxx_static_address_b4c5209c0fb0e8b84b664d73.reference = {
    __cReference: true,
    get value() { return TIRE____header_global_f1569a48e5b96d14; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:440
export const PIPE5____header_global_58641124bca97cc0 = ((((((994) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cec84d3a29016bab5d612671() {
  return __cxx_static_address_cec84d3a29016bab5d612671.reference || (__cxx_static_address_cec84d3a29016bab5d612671.reference = {
    __cReference: true,
    get value() { return PIPE5____header_global_58641124bca97cc0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:441
export const PIPE6____header_global_be85781fbc0a53cc = ((((((995) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d42a848154fe0fb082c132e2() {
  return __cxx_static_address_d42a848154fe0fb082c132e2.reference || (__cxx_static_address_d42a848154fe0fb082c132e2.reference = {
    __cReference: true,
    get value() { return PIPE6____header_global_be85781fbc0a53cc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:442
export const PIPE4____header_global_bffd72c4b97d9835 = ((((((996) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eba17d078ef8ca25df8b116e() {
  return __cxx_static_address_eba17d078ef8ca25df8b116e.reference || (__cxx_static_address_eba17d078ef8ca25df8b116e.reference = {
    __cReference: true,
    get value() { return PIPE4____header_global_bffd72c4b97d9835; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:443
export const PIPE4B____header_global_bc068f53e2eceb84 = ((((((997) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_38b9d40e12bc5f97d48f3351() {
  return __cxx_static_address_38b9d40e12bc5f97d48f3351.reference || (__cxx_static_address_38b9d40e12bc5f97d48f3351.reference = {
    __cReference: true,
    get value() { return PIPE4B____header_global_bc068f53e2eceb84; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:444
export const BROKEHYDROPLANT____header_global_4d96d0ea7dc9b2d6 = ((((((1003) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_30fb5debb69fc0bd51ae62f5() {
  return __cxx_static_address_30fb5debb69fc0bd51ae62f5.reference || (__cxx_static_address_30fb5debb69fc0bd51ae62f5.reference = {
    __cReference: true,
    get value() { return BROKEHYDROPLANT____header_global_4d96d0ea7dc9b2d6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:445
export const PIPE5B____header_global_54edf69480ed163e = ((((((1005) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_95084c81504844340eafdb83() {
  return __cxx_static_address_95084c81504844340eafdb83.reference || (__cxx_static_address_95084c81504844340eafdb83.reference = {
    __cReference: true,
    get value() { return PIPE5B____header_global_54edf69480ed163e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:446
export const NEON3____header_global_8f87910923ea277d = ((((((1007) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e098d84f9fceffa2ff3edcb2() {
  return __cxx_static_address_e098d84f9fceffa2ff3edcb2.reference || (__cxx_static_address_e098d84f9fceffa2ff3edcb2.reference = {
    __cReference: true,
    get value() { return NEON3____header_global_8f87910923ea277d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:447
export const NEON4____header_global_7b284d90d27c84f6 = ((((((1008) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f433cbf679785da96767e096() {
  return __cxx_static_address_f433cbf679785da96767e096.reference || (__cxx_static_address_f433cbf679785da96767e096.reference = {
    __cReference: true,
    get value() { return NEON4____header_global_7b284d90d27c84f6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:448
export const NEON5____header_global_f30137f51b1d830b = ((((((1009) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9ebd6dbefc045837740208d8() {
  return __cxx_static_address_9ebd6dbefc045837740208d8.reference || (__cxx_static_address_9ebd6dbefc045837740208d8.reference = {
    __cReference: true,
    get value() { return NEON5____header_global_f30137f51b1d830b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:449
export const BOTTLE5____header_global_8d44b3df3a40ca33 = ((((((1012) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fe6334510f26b64340da8c1b() {
  return __cxx_static_address_fe6334510f26b64340da8c1b.reference || (__cxx_static_address_fe6334510f26b64340da8c1b.reference = {
    __cReference: true,
    get value() { return BOTTLE5____header_global_8d44b3df3a40ca33; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:450
export const BOTTLE6____header_global_121752d9a29e4ce4 = ((((((1013) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4059c727d9bd1507b5e40af6() {
  return __cxx_static_address_4059c727d9bd1507b5e40af6.reference || (__cxx_static_address_4059c727d9bd1507b5e40af6.reference = {
    __cReference: true,
    get value() { return BOTTLE6____header_global_121752d9a29e4ce4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:451
export const BOTTLE8____header_global_e90984730c4b9a90 = ((((((1014) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3af5a8bbfb09c967dedea0d6() {
  return __cxx_static_address_3af5a8bbfb09c967dedea0d6.reference || (__cxx_static_address_3af5a8bbfb09c967dedea0d6.reference = {
    __cReference: true,
    get value() { return BOTTLE8____header_global_e90984730c4b9a90; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:452
export const SPOTLITE____header_global_511d56a09ca62ce7 = ((((((1020) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b80202a5ca143467c5776cd9() {
  return __cxx_static_address_b80202a5ca143467c5776cd9.reference || (__cxx_static_address_b80202a5ca143467c5776cd9.reference = {
    __cReference: true,
    get value() { return SPOTLITE____header_global_511d56a09ca62ce7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:453
export const MASKWALL15____header_global_b45690d18356fc9b = ((((((1024) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b8630a833ac9989fe31209d9() {
  return __cxx_static_address_b8630a833ac9989fe31209d9.reference || (__cxx_static_address_b8630a833ac9989fe31209d9.reference = {
    __cReference: true,
    get value() { return MASKWALL15____header_global_b45690d18356fc9b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:454
export const BOTTLE7____header_global_910498cff20b6a81 = ((((((1025) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ab93f98ed5020746baa11f5c() {
  return __cxx_static_address_ab93f98ed5020746baa11f5c.reference || (__cxx_static_address_ab93f98ed5020746baa11f5c.reference = {
    __cReference: true,
    get value() { return BOTTLE7____header_global_910498cff20b6a81; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:455
export const HORSEONSIDE____header_global_99d0a0efe62d349d = ((((((1026) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5473679aa7ec5a65461e2872() {
  return __cxx_static_address_5473679aa7ec5a65461e2872.reference || (__cxx_static_address_5473679aa7ec5a65461e2872.reference = {
    __cReference: true,
    get value() { return HORSEONSIDE____header_global_99d0a0efe62d349d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:456
export const GLASSPIECES____header_global_dc2d5a72dc46c174 = ((((((1031) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f96ef3ff110f3af720ff32a5() {
  return __cxx_static_address_f96ef3ff110f3af720ff32a5.reference || (__cxx_static_address_f96ef3ff110f3af720ff32a5.reference = {
    __cReference: true,
    get value() { return GLASSPIECES____header_global_dc2d5a72dc46c174; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:457
export const NEON6____header_global_f5a4dd16a56d64ce = ((((((1046) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_90ca262112ed127a1312c74d() {
  return __cxx_static_address_90ca262112ed127a1312c74d.reference || (__cxx_static_address_90ca262112ed127a1312c74d.reference = {
    __cReference: true,
    get value() { return NEON6____header_global_f5a4dd16a56d64ce; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:458
export const MASKWALL6____header_global_a08e5320fc2659b9 = ((((((1059) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4550c2a7569da5a5bca748c6() {
  return __cxx_static_address_4550c2a7569da5a5bca748c6.reference || (__cxx_static_address_4550c2a7569da5a5bca748c6.reference = {
    __cReference: true,
    get value() { return MASKWALL6____header_global_a08e5320fc2659b9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:459
export const RUBBERCAN____header_global_6eef852a4f1bd198 = ((((((1062) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c60bc04b0b480e3edd11a7f6() {
  return __cxx_static_address_c60bc04b0b480e3edd11a7f6.reference || (__cxx_static_address_c60bc04b0b480e3edd11a7f6.reference = {
    __cReference: true,
    get value() { return RUBBERCAN____header_global_6eef852a4f1bd198; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:460
export const PLUG____header_global_8f717d90cebe3e95 = ((((((1069) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e3f5b99228ed1a6e64aed571() {
  return __cxx_static_address_e3f5b99228ed1a6e64aed571.reference || (__cxx_static_address_e3f5b99228ed1a6e64aed571.reference = {
    __cReference: true,
    get value() { return PLUG____header_global_8f717d90cebe3e95; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:461
export const OOZFILTER____header_global_e39c7f5debd2fc6d = ((((((1079) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_98b7eb2137bf5f6696f69566() {
  return __cxx_static_address_98b7eb2137bf5f6696f69566.reference || (__cxx_static_address_98b7eb2137bf5f6696f69566.reference = {
    __cReference: true,
    get value() { return OOZFILTER____header_global_e39c7f5debd2fc6d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:462
export const FLOORPLASMA____header_global_45b02283482cf9b2 = ((((((1082) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_33dbb54e5d95913315720a32() {
  return __cxx_static_address_33dbb54e5d95913315720a32.reference || (__cxx_static_address_33dbb54e5d95913315720a32.reference = {
    __cReference: true,
    get value() { return FLOORPLASMA____header_global_45b02283482cf9b2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:463
export const REACTOR____header_global_6cecf1ca81317844 = ((((((1088) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dc699488ab92f66c6c164a39() {
  return __cxx_static_address_dc699488ab92f66c6c164a39.reference || (__cxx_static_address_dc699488ab92f66c6c164a39.reference = {
    __cReference: true,
    get value() { return REACTOR____header_global_6cecf1ca81317844; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:464
export const REACTORSPARK____header_global_5260b036bcc6d40d = ((((((1092) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d96476caf106dd266159ffaa() {
  return __cxx_static_address_d96476caf106dd266159ffaa.reference || (__cxx_static_address_d96476caf106dd266159ffaa.reference = {
    __cReference: true,
    get value() { return REACTORSPARK____header_global_5260b036bcc6d40d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:465
export const REACTORBURNT____header_global_5320ebf01a2fe154 = ((((((1096) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_19967071fa1b51b90d544e3e() {
  return __cxx_static_address_19967071fa1b51b90d544e3e.reference || (__cxx_static_address_19967071fa1b51b90d544e3e.reference = {
    __cReference: true,
    get value() { return REACTORBURNT____header_global_5320ebf01a2fe154; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:466
export const DOORTILE15____header_global_a6a2df67ca6db8d0 = ((((((1102) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5e779eb9fca22a790f009bcc() {
  return __cxx_static_address_5e779eb9fca22a790f009bcc.reference || (__cxx_static_address_5e779eb9fca22a790f009bcc.reference = {
    __cReference: true,
    get value() { return DOORTILE15____header_global_a6a2df67ca6db8d0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:467
export const HANDSWITCH____header_global_7afd4e27b9967445 = ((((((1111) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5b9b0bb96c6d4817ce5bb4b7() {
  return __cxx_static_address_5b9b0bb96c6d4817ce5bb4b7.reference || (__cxx_static_address_5b9b0bb96c6d4817ce5bb4b7.reference = {
    __cReference: true,
    get value() { return HANDSWITCH____header_global_7afd4e27b9967445; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:468
export const CIRCLEPANNEL____header_global_d1bcd4ab293e8067 = ((((((1113) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_916a829e55bbe3c882892d05() {
  return __cxx_static_address_916a829e55bbe3c882892d05.reference || (__cxx_static_address_916a829e55bbe3c882892d05.reference = {
    __cReference: true,
    get value() { return CIRCLEPANNEL____header_global_d1bcd4ab293e8067; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:469
export const CIRCLEPANNELBROKE____header_global_c0c0a9a0bd76a950 = ((((((1114) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d07d74c9a541d93c1943bd49() {
  return __cxx_static_address_d07d74c9a541d93c1943bd49.reference || (__cxx_static_address_d07d74c9a541d93c1943bd49.reference = {
    __cReference: true,
    get value() { return CIRCLEPANNELBROKE____header_global_c0c0a9a0bd76a950; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:470
export const PULLSWITCH____header_global_4779d6b5f719c9db = ((((((1122) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4a3d5bc2f0a297d0ca285b1a() {
  return __cxx_static_address_4a3d5bc2f0a297d0ca285b1a.reference || (__cxx_static_address_4a3d5bc2f0a297d0ca285b1a.reference = {
    __cReference: true,
    get value() { return PULLSWITCH____header_global_4779d6b5f719c9db; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:471
export const MASKWALL8____header_global_28da79d9b189f854 = ((((((1124) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9cd1189c00198096111721ba() {
  return __cxx_static_address_9cd1189c00198096111721ba.reference || (__cxx_static_address_9cd1189c00198096111721ba.reference = {
    __cReference: true,
    get value() { return MASKWALL8____header_global_28da79d9b189f854; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:472
export const BIGHOLE____header_global_4e8d476e1b6a9868 = ((((((1141) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_30ba7b3d3aead66d131c175a() {
  return __cxx_static_address_30ba7b3d3aead66d131c175a.reference || (__cxx_static_address_30ba7b3d3aead66d131c175a.reference = {
    __cReference: true,
    get value() { return BIGHOLE____header_global_4e8d476e1b6a9868; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:473
export const ALIENSWITCH____header_global_be34491ed28f34bc = ((((((1142) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a8d55a224f9424098c97395d() {
  return __cxx_static_address_a8d55a224f9424098c97395d.reference || (__cxx_static_address_a8d55a224f9424098c97395d.reference = {
    __cReference: true,
    get value() { return ALIENSWITCH____header_global_be34491ed28f34bc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:474
export const DOORTILE21____header_global_e5297c3ff5585f11 = ((((((1144) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d3863639430a1108d7a938b4() {
  return __cxx_static_address_d3863639430a1108d7a938b4.reference || (__cxx_static_address_d3863639430a1108d7a938b4.reference = {
    __cReference: true,
    get value() { return DOORTILE21____header_global_e5297c3ff5585f11; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:475
export const HANDPRINTSWITCH____header_global_6b2a0f4909d7d6c2 = ((((((1155) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_82e55289c72dccdaa240a28c() {
  return __cxx_static_address_82e55289c72dccdaa240a28c.reference || (__cxx_static_address_82e55289c72dccdaa240a28c.reference = {
    __cReference: true,
    get value() { return HANDPRINTSWITCH____header_global_6b2a0f4909d7d6c2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:476
export const BOTTLE10____header_global_14c6752b97ba362a = ((((((1157) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2a34b7984655eeaa08cc2457() {
  return __cxx_static_address_2a34b7984655eeaa08cc2457.reference || (__cxx_static_address_2a34b7984655eeaa08cc2457.reference = {
    __cReference: true,
    get value() { return BOTTLE10____header_global_14c6752b97ba362a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:477
export const BOTTLE11____header_global_5441c668d0a8ef42 = ((((((1158) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_895772a4664813de905e420f() {
  return __cxx_static_address_895772a4664813de905e420f.reference || (__cxx_static_address_895772a4664813de905e420f.reference = {
    __cReference: true,
    get value() { return BOTTLE11____header_global_5441c668d0a8ef42; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:478
export const BOTTLE12____header_global_061ed1886120a898 = ((((((1159) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_04578d6f857006b5e220ee85() {
  return __cxx_static_address_04578d6f857006b5e220ee85.reference || (__cxx_static_address_04578d6f857006b5e220ee85.reference = {
    __cReference: true,
    get value() { return BOTTLE12____header_global_061ed1886120a898; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:479
export const BOTTLE13____header_global_00e85e4c8b070737 = ((((((1160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8250f2ea5b58cc57ba1f99ca() {
  return __cxx_static_address_8250f2ea5b58cc57ba1f99ca.reference || (__cxx_static_address_8250f2ea5b58cc57ba1f99ca.reference = {
    __cReference: true,
    get value() { return BOTTLE13____header_global_00e85e4c8b070737; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:480
export const BOTTLE14____header_global_d97f50caf8b2754d = ((((((1161) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d0ee3d9918a8f404333908fd() {
  return __cxx_static_address_d0ee3d9918a8f404333908fd.reference || (__cxx_static_address_d0ee3d9918a8f404333908fd.reference = {
    __cReference: true,
    get value() { return BOTTLE14____header_global_d97f50caf8b2754d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:481
export const BOTTLE15____header_global_9611599658fae8cf = ((((((1162) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5415a420cd7a25639a184938() {
  return __cxx_static_address_5415a420cd7a25639a184938.reference || (__cxx_static_address_5415a420cd7a25639a184938.reference = {
    __cReference: true,
    get value() { return BOTTLE15____header_global_9611599658fae8cf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:482
export const BOTTLE16____header_global_82ede6324c9ad7f9 = ((((((1163) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bf499f716bfd421623affd9d() {
  return __cxx_static_address_bf499f716bfd421623affd9d.reference || (__cxx_static_address_bf499f716bfd421623affd9d.reference = {
    __cReference: true,
    get value() { return BOTTLE16____header_global_82ede6324c9ad7f9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:483
export const BOTTLE17____header_global_1bc8a7ffce0bccc0 = ((((((1164) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_17539b220266b07a56944b34() {
  return __cxx_static_address_17539b220266b07a56944b34.reference || (__cxx_static_address_17539b220266b07a56944b34.reference = {
    __cReference: true,
    get value() { return BOTTLE17____header_global_1bc8a7ffce0bccc0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:484
export const BOTTLE18____header_global_e7afeb16e5c0e3b3 = ((((((1165) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a25a67a9b1f840d2ea8afa7b() {
  return __cxx_static_address_a25a67a9b1f840d2ea8afa7b.reference || (__cxx_static_address_a25a67a9b1f840d2ea8afa7b.reference = {
    __cReference: true,
    get value() { return BOTTLE18____header_global_e7afeb16e5c0e3b3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:485
export const BOTTLE19____header_global_b526989c3f10b89b = ((((((1166) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_583869197b9d87be67d9ffe3() {
  return __cxx_static_address_583869197b9d87be67d9ffe3.reference || (__cxx_static_address_583869197b9d87be67d9ffe3.reference = {
    __cReference: true,
    get value() { return BOTTLE19____header_global_b526989c3f10b89b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:486
export const DOORTILE17____header_global_8924860c2e2c9eb2 = ((((((1169) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_221ce0616a468e442efe6517() {
  return __cxx_static_address_221ce0616a468e442efe6517.reference || (__cxx_static_address_221ce0616a468e442efe6517.reference = {
    __cReference: true,
    get value() { return DOORTILE17____header_global_8924860c2e2c9eb2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:487
export const MASKWALL7____header_global_35710a6c711cdc07 = ((((((1174) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a72ff3a57d72c4452cfff922() {
  return __cxx_static_address_a72ff3a57d72c4452cfff922.reference || (__cxx_static_address_a72ff3a57d72c4452cfff922.reference = {
    __cReference: true,
    get value() { return MASKWALL7____header_global_35710a6c711cdc07; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:488
export const DOORTILE11____header_global_20b03acb9fa9ab52 = ((((((1178) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2c5bf0730259d7a9d41cb88d() {
  return __cxx_static_address_2c5bf0730259d7a9d41cb88d.reference || (__cxx_static_address_2c5bf0730259d7a9d41cb88d.reference = {
    __cReference: true,
    get value() { return DOORTILE11____header_global_20b03acb9fa9ab52; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:489
export const DOORTILE12____header_global_8040f7836126e2b1 = ((((((1179) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_38f6a6db8c7a61cec06ba99f() {
  return __cxx_static_address_38f6a6db8c7a61cec06ba99f.reference || (__cxx_static_address_38f6a6db8c7a61cec06ba99f.reference = {
    __cReference: true,
    get value() { return DOORTILE12____header_global_8040f7836126e2b1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:490
export const VENDMACHINE____header_global_20b14b3ad20132c6 = ((((((1212) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c7df8d504a6c9052cf5d1ade() {
  return __cxx_static_address_c7df8d504a6c9052cf5d1ade.reference || (__cxx_static_address_c7df8d504a6c9052cf5d1ade.reference = {
    __cReference: true,
    get value() { return VENDMACHINE____header_global_20b14b3ad20132c6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:491
export const COLAMACHINE____header_global_a45f95e6fc71ef90 = ((((((1215) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2df97dc4dea47d922e2b85e0() {
  return __cxx_static_address_2df97dc4dea47d922e2b85e0.reference || (__cxx_static_address_2df97dc4dea47d922e2b85e0.reference = {
    __cReference: true,
    get value() { return COLAMACHINE____header_global_a45f95e6fc71ef90; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:492
export const CRANEPOLE____header_global_261d72beac610559 = ((((((1221) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1a2493b648ada950c9d7c5d7() {
  return __cxx_static_address_1a2493b648ada950c9d7c5d7.reference || (__cxx_static_address_1a2493b648ada950c9d7c5d7.reference = {
    __cReference: true,
    get value() { return CRANEPOLE____header_global_261d72beac610559; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:493
export const CRANE____header_global_f1822e8cc3937b0b = ((((((1222) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fa4af19d731d100ac53efcda() {
  return __cxx_static_address_fa4af19d731d100ac53efcda.reference || (__cxx_static_address_fa4af19d731d100ac53efcda.reference = {
    __cReference: true,
    get value() { return CRANE____header_global_f1822e8cc3937b0b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:494
export const BARBROKE____header_global_3d7941f2ce3474cb = ((((((1225) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ad154c900dad2218be2291fe() {
  return __cxx_static_address_ad154c900dad2218be2291fe.reference || (__cxx_static_address_ad154c900dad2218be2291fe.reference = {
    __cReference: true,
    get value() { return BARBROKE____header_global_3d7941f2ce3474cb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:495
export const BLOODPOOL____header_global_f78bdfd173732b2f = ((((((1226) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_44214ada7b5351d15285e3ab() {
  return __cxx_static_address_44214ada7b5351d15285e3ab.reference || (__cxx_static_address_44214ada7b5351d15285e3ab.reference = {
    __cReference: true,
    get value() { return BLOODPOOL____header_global_f78bdfd173732b2f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:496
export const NUKEBARREL____header_global_a3cc884f3e47ba03 = ((((((1227) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3103d7b887a03f94b45ee130() {
  return __cxx_static_address_3103d7b887a03f94b45ee130.reference || (__cxx_static_address_3103d7b887a03f94b45ee130.reference = {
    __cReference: true,
    get value() { return NUKEBARREL____header_global_a3cc884f3e47ba03; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:497
export const NUKEBARRELDENTED____header_global_fc607337c7f97bc4 = ((((((1228) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8a0997cfbb95c01964807510() {
  return __cxx_static_address_8a0997cfbb95c01964807510.reference || (__cxx_static_address_8a0997cfbb95c01964807510.reference = {
    __cReference: true,
    get value() { return NUKEBARRELDENTED____header_global_fc607337c7f97bc4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:498
export const NUKEBARRELLEAKED____header_global_84cb786d7dfc32ab = ((((((1229) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d96d6397d54d35c684fceb5b() {
  return __cxx_static_address_d96d6397d54d35c684fceb5b.reference || (__cxx_static_address_d96d6397d54d35c684fceb5b.reference = {
    __cReference: true,
    get value() { return NUKEBARRELLEAKED____header_global_84cb786d7dfc32ab; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:499
export const CANWITHSOMETHING____header_global_8bb5377f96c3810a = ((((((1232) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4ebec13fb6f66a1da006df06() {
  return __cxx_static_address_4ebec13fb6f66a1da006df06.reference || (__cxx_static_address_4ebec13fb6f66a1da006df06.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING____header_global_8bb5377f96c3810a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:500
export const MONEY____header_global_5d2d2221860efc86 = ((((((1233) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3e2438c29b22aaaa44b0d327() {
  return __cxx_static_address_3e2438c29b22aaaa44b0d327.reference || (__cxx_static_address_3e2438c29b22aaaa44b0d327.reference = {
    __cReference: true,
    get value() { return MONEY____header_global_5d2d2221860efc86; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:501
export const BANNER____header_global_1f004cad0e2fb63b = ((((((1236) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_60d8bd73a9cd46be841623bb() {
  return __cxx_static_address_60d8bd73a9cd46be841623bb.reference || (__cxx_static_address_60d8bd73a9cd46be841623bb.reference = {
    __cReference: true,
    get value() { return BANNER____header_global_1f004cad0e2fb63b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:502
export const EXPLODINGBARREL____header_global_cb219f17d95e8009 = ((((((1238) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d034ffab9771a45fc2ea4223() {
  return __cxx_static_address_d034ffab9771a45fc2ea4223.reference || (__cxx_static_address_d034ffab9771a45fc2ea4223.reference = {
    __cReference: true,
    get value() { return EXPLODINGBARREL____header_global_cb219f17d95e8009; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:503
export const EXPLODINGBARREL2____header_global_d3a11b3a4961df43 = ((((((1239) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_18a19d1b60bed4cef7d24dec() {
  return __cxx_static_address_18a19d1b60bed4cef7d24dec.reference || (__cxx_static_address_18a19d1b60bed4cef7d24dec.reference = {
    __cReference: true,
    get value() { return EXPLODINGBARREL2____header_global_d3a11b3a4961df43; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:504
export const FIREBARREL____header_global_d6b576919e444952 = ((((((1240) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4826f230bfedb63851b53ee7() {
  return __cxx_static_address_4826f230bfedb63851b53ee7.reference || (__cxx_static_address_4826f230bfedb63851b53ee7.reference = {
    __cReference: true,
    get value() { return FIREBARREL____header_global_d6b576919e444952; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:505
export const SEENINE____header_global_4d9922076d9c094e = ((((((1247) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a4a2f9e759b0373f3ea09366() {
  return __cxx_static_address_a4a2f9e759b0373f3ea09366.reference || (__cxx_static_address_a4a2f9e759b0373f3ea09366.reference = {
    __cReference: true,
    get value() { return SEENINE____header_global_4d9922076d9c094e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:506
export const SEENINEDEAD____header_global_25ec0c47011c47de = ((((((1248) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_14b2119db8e7d95970874185() {
  return __cxx_static_address_14b2119db8e7d95970874185.reference || (__cxx_static_address_14b2119db8e7d95970874185.reference = {
    __cReference: true,
    get value() { return SEENINEDEAD____header_global_25ec0c47011c47de; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:507
export const STEAM____header_global_5e7293ab54d2529c = ((((((1250) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_869a3534afe31fe645440e16() {
  return __cxx_static_address_869a3534afe31fe645440e16.reference || (__cxx_static_address_869a3534afe31fe645440e16.reference = {
    __cReference: true,
    get value() { return STEAM____header_global_5e7293ab54d2529c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:508
export const CEILINGSTEAM____header_global_1674317d78de5781 = ((((((1255) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fa121cb2df1b0559dcd28518() {
  return __cxx_static_address_fa121cb2df1b0559dcd28518.reference || (__cxx_static_address_fa121cb2df1b0559dcd28518.reference = {
    __cReference: true,
    get value() { return CEILINGSTEAM____header_global_1674317d78de5781; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:509
export const PIPE6B____header_global_b62ffc7d95473b0e = ((((((1260) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f82b934722980b12ec5e929a() {
  return __cxx_static_address_f82b934722980b12ec5e929a.reference || (__cxx_static_address_f82b934722980b12ec5e929a.reference = {
    __cReference: true,
    get value() { return PIPE6B____header_global_b62ffc7d95473b0e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:510
export const TRANSPORTERBEAM____header_global_e7f5a4c9c73ca0a1 = ((((((1261) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_64917c2c1a7ddbb7c1303e5d() {
  return __cxx_static_address_64917c2c1a7ddbb7c1303e5d.reference || (__cxx_static_address_64917c2c1a7ddbb7c1303e5d.reference = {
    __cReference: true,
    get value() { return TRANSPORTERBEAM____header_global_e7f5a4c9c73ca0a1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:511
export const RAT____header_global_309e7bad8f8eacdf = ((((((1267) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f90549734987d4dfd782d534() {
  return __cxx_static_address_f90549734987d4dfd782d534.reference || (__cxx_static_address_f90549734987d4dfd782d534.reference = {
    __cReference: true,
    get value() { return RAT____header_global_309e7bad8f8eacdf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:512
export const TRASH____header_global_865894518ea2b479 = ((((((1272) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eb760c970ad97c26637bd6d9() {
  return __cxx_static_address_eb760c970ad97c26637bd6d9.reference || (__cxx_static_address_eb760c970ad97c26637bd6d9.reference = {
    __cReference: true,
    get value() { return TRASH____header_global_865894518ea2b479; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:513
export const FEMPIC1____header_global_ab3cfb800e9455fd = ((((((1280) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3b834f931a15239ddf3b0392() {
  return __cxx_static_address_3b834f931a15239ddf3b0392.reference || (__cxx_static_address_3b834f931a15239ddf3b0392.reference = {
    __cReference: true,
    get value() { return FEMPIC1____header_global_ab3cfb800e9455fd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:514
export const FEMPIC2____header_global_0ea78c7d69616001 = ((((((1289) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_23aa6aebd9f9849deeb599b3() {
  return __cxx_static_address_23aa6aebd9f9849deeb599b3.reference || (__cxx_static_address_23aa6aebd9f9849deeb599b3.reference = {
    __cReference: true,
    get value() { return FEMPIC2____header_global_0ea78c7d69616001; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:515
export const BLANKSCREEN____header_global_57a427fc07a822df = ((((((1293) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1dfd71032712c41ed1599e9e() {
  return __cxx_static_address_1dfd71032712c41ed1599e9e.reference || (__cxx_static_address_1dfd71032712c41ed1599e9e.reference = {
    __cReference: true,
    get value() { return BLANKSCREEN____header_global_57a427fc07a822df; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:516
export const PODFEM1____header_global_5c98fe43b6b7bba7 = ((((((1294) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8c34593ab45048453c65ed44() {
  return __cxx_static_address_8c34593ab45048453c65ed44.reference || (__cxx_static_address_8c34593ab45048453c65ed44.reference = {
    __cReference: true,
    get value() { return PODFEM1____header_global_5c98fe43b6b7bba7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:517
export const FEMPIC3____header_global_67767355c290c01e = ((((((1298) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_826487f1472c269450c73fb8() {
  return __cxx_static_address_826487f1472c269450c73fb8.reference || (__cxx_static_address_826487f1472c269450c73fb8.reference = {
    __cReference: true,
    get value() { return FEMPIC3____header_global_67767355c290c01e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:518
export const FEMPIC4____header_global_d17b3bf9f18c489d = ((((((1306) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8ca1b4dc2fd094f417d4dc63() {
  return __cxx_static_address_8ca1b4dc2fd094f417d4dc63.reference || (__cxx_static_address_8ca1b4dc2fd094f417d4dc63.reference = {
    __cReference: true,
    get value() { return FEMPIC4____header_global_d17b3bf9f18c489d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:519
export const FEM1____header_global_fcf2f3cb59527e87 = ((((((1312) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_06b6c4f17aed98989eb66a2a() {
  return __cxx_static_address_06b6c4f17aed98989eb66a2a.reference || (__cxx_static_address_06b6c4f17aed98989eb66a2a.reference = {
    __cReference: true,
    get value() { return FEM1____header_global_fcf2f3cb59527e87; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:520
export const FEM2____header_global_ebc80ca21195b36f = ((((((1317) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d75fd5c8f3f219d4d7e3e736() {
  return __cxx_static_address_d75fd5c8f3f219d4d7e3e736.reference || (__cxx_static_address_d75fd5c8f3f219d4d7e3e736.reference = {
    __cReference: true,
    get value() { return FEM2____header_global_ebc80ca21195b36f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:521
export const FEM3____header_global_dd954099ca269da5 = ((((((1321) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_38e7ba329b637dfed1049317() {
  return __cxx_static_address_38e7ba329b637dfed1049317.reference || (__cxx_static_address_38e7ba329b637dfed1049317.reference = {
    __cReference: true,
    get value() { return FEM3____header_global_dd954099ca269da5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:522
export const FEM5____header_global_9b9f58cf834a97c2 = ((((((1323) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6055f9110730a4415b0e90df() {
  return __cxx_static_address_6055f9110730a4415b0e90df.reference || (__cxx_static_address_6055f9110730a4415b0e90df.reference = {
    __cReference: true,
    get value() { return FEM5____header_global_9b9f58cf834a97c2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:523
export const BLOODYPOLE____header_global_ee9426bee07b7445 = ((((((1324) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b3b79cd1bc628d6f683ae38e() {
  return __cxx_static_address_b3b79cd1bc628d6f683ae38e.reference || (__cxx_static_address_b3b79cd1bc628d6f683ae38e.reference = {
    __cReference: true,
    get value() { return BLOODYPOLE____header_global_ee9426bee07b7445; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:524
export const FEM4____header_global_da1b0e0cf670731d = ((((((1325) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8f7a64568d407f0b53f6f53f() {
  return __cxx_static_address_8f7a64568d407f0b53f6f53f.reference || (__cxx_static_address_8f7a64568d407f0b53f6f53f.reference = {
    __cReference: true,
    get value() { return FEM4____header_global_da1b0e0cf670731d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:525
export const FEM6____header_global_98f802ddf8171ec8 = ((((((1334) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0f7263298bf024f9a997e5c5() {
  return __cxx_static_address_0f7263298bf024f9a997e5c5.reference || (__cxx_static_address_0f7263298bf024f9a997e5c5.reference = {
    __cReference: true,
    get value() { return FEM6____header_global_98f802ddf8171ec8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:526
export const FEM6PAD____header_global_41ebd735b18131a3 = ((((((1335) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e82e39aa572f62f00430cc93() {
  return __cxx_static_address_e82e39aa572f62f00430cc93.reference || (__cxx_static_address_e82e39aa572f62f00430cc93.reference = {
    __cReference: true,
    get value() { return FEM6PAD____header_global_41ebd735b18131a3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:527
export const FEM8____header_global_d21fef42d81108b9 = ((((((1336) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1c73ce5ebfa0344204239887() {
  return __cxx_static_address_1c73ce5ebfa0344204239887.reference || (__cxx_static_address_1c73ce5ebfa0344204239887.reference = {
    __cReference: true,
    get value() { return FEM8____header_global_d21fef42d81108b9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:528
export const HELECOPT____header_global_3618cb070d429f70 = ((((((1346) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5f9ae961c394d976527a383e() {
  return __cxx_static_address_5f9ae961c394d976527a383e.reference || (__cxx_static_address_5f9ae961c394d976527a383e.reference = {
    __cReference: true,
    get value() { return HELECOPT____header_global_3618cb070d429f70; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:529
export const FETUSJIB____header_global_d2534cebc0395298 = ((((((1347) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5d2bba8e7efa38721c06619a() {
  return __cxx_static_address_5d2bba8e7efa38721c06619a.reference || (__cxx_static_address_5d2bba8e7efa38721c06619a.reference = {
    __cReference: true,
    get value() { return FETUSJIB____header_global_d2534cebc0395298; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:530
export const HOLODUKE____header_global_ba3612c3556f033d = ((((((1348) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_28c318d47b5f157b348aa67b() {
  return __cxx_static_address_28c318d47b5f157b348aa67b.reference || (__cxx_static_address_28c318d47b5f157b348aa67b.reference = {
    __cReference: true,
    get value() { return HOLODUKE____header_global_ba3612c3556f033d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:531
export const SPACEMARINE____header_global_3f64d17ee5d54185 = ((((((1353) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2a67637da06afb86c2c08e88() {
  return __cxx_static_address_2a67637da06afb86c2c08e88.reference || (__cxx_static_address_2a67637da06afb86c2c08e88.reference = {
    __cReference: true,
    get value() { return SPACEMARINE____header_global_3f64d17ee5d54185; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:532
export const INDY____header_global_d459aaf1ffc39ae8 = ((((((1355) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_db513968b7d1448972a152fa() {
  return __cxx_static_address_db513968b7d1448972a152fa.reference || (__cxx_static_address_db513968b7d1448972a152fa.reference = {
    __cReference: true,
    get value() { return INDY____header_global_d459aaf1ffc39ae8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:533
export const FETUS____header_global_463490adc34dd8c6 = ((((((1358) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a70a21de2f572d00805dba1a() {
  return __cxx_static_address_a70a21de2f572d00805dba1a.reference || (__cxx_static_address_a70a21de2f572d00805dba1a.reference = {
    __cReference: true,
    get value() { return FETUS____header_global_463490adc34dd8c6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:534
export const FETUSBROKE____header_global_ef0b8a72934d4ebd = ((((((1359) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a07b33bf64564cf8f80c6421() {
  return __cxx_static_address_a07b33bf64564cf8f80c6421.reference || (__cxx_static_address_a07b33bf64564cf8f80c6421.reference = {
    __cReference: true,
    get value() { return FETUSBROKE____header_global_ef0b8a72934d4ebd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:535
export const MONK____header_global_d70e6d6638b42e6f = ((((((1352) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6991f928f83a92b1f0f38a12() {
  return __cxx_static_address_6991f928f83a92b1f0f38a12.reference || (__cxx_static_address_6991f928f83a92b1f0f38a12.reference = {
    __cReference: true,
    get value() { return MONK____header_global_d70e6d6638b42e6f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:536
export const LUKE____header_global_0ddd0776c33f62fd = ((((((1354) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9e1c8eed696610040d39b89a() {
  return __cxx_static_address_9e1c8eed696610040d39b89a.reference || (__cxx_static_address_9e1c8eed696610040d39b89a.reference = {
    __cReference: true,
    get value() { return LUKE____header_global_0ddd0776c33f62fd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:537
export const COOLEXPLOSION1____header_global_cdf95f57679c13bd = ((((((1360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f3e2a51ab952c8339c044394() {
  return __cxx_static_address_f3e2a51ab952c8339c044394.reference || (__cxx_static_address_f3e2a51ab952c8339c044394.reference = {
    __cReference: true,
    get value() { return COOLEXPLOSION1____header_global_cdf95f57679c13bd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:538
export const WATERSPLASH2____header_global_8592bca00517c7db = ((((((1380) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ca086361d21ca475cd4ca07c() {
  return __cxx_static_address_ca086361d21ca475cd4ca07c.reference || (__cxx_static_address_ca086361d21ca475cd4ca07c.reference = {
    __cReference: true,
    get value() { return WATERSPLASH2____header_global_8592bca00517c7db; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:539
export const FIREVASE____header_global_dea585241affac77 = ((((((1390) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5b83faaaf9f3cde6dce63edc() {
  return __cxx_static_address_5b83faaaf9f3cde6dce63edc.reference || (__cxx_static_address_5b83faaaf9f3cde6dce63edc.reference = {
    __cReference: true,
    get value() { return FIREVASE____header_global_dea585241affac77; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:540
export const FEM7____header_global_8d7961343498b27a = ((((((1395) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e03342f74f818ced1f6a92fe() {
  return __cxx_static_address_e03342f74f818ced1f6a92fe.reference || (__cxx_static_address_e03342f74f818ced1f6a92fe.reference = {
    __cReference: true,
    get value() { return FEM7____header_global_8d7961343498b27a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:541
export const APLAYERTOP____header_global_f2b48d2290c4e71a = ((((((1400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9170a0eab5c3504b6e6db001() {
  return __cxx_static_address_9170a0eab5c3504b6e6db001.reference || (__cxx_static_address_9170a0eab5c3504b6e6db001.reference = {
    __cReference: true,
    get value() { return APLAYERTOP____header_global_f2b48d2290c4e71a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:542
export const APLAYER____header_global_9ce23d50219181a8 = ((((((1405) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_647a6de78ab523f05974b5b0() {
  return __cxx_static_address_647a6de78ab523f05974b5b0.reference || (__cxx_static_address_647a6de78ab523f05974b5b0.reference = {
    __cReference: true,
    get value() { return APLAYER____header_global_9ce23d50219181a8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:543
export const PLAYERONWATER____header_global_0e0a21d58a1aafac = ((((((1420) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f00253b6325ffe96cbcea261() {
  return __cxx_static_address_f00253b6325ffe96cbcea261.reference || (__cxx_static_address_f00253b6325ffe96cbcea261.reference = {
    __cReference: true,
    get value() { return PLAYERONWATER____header_global_0e0a21d58a1aafac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:544
export const DUKELYINGDEAD____header_global_8a3b5cad76a2c051 = ((((((1518) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a9aeb2edef41db0bc94c3fe1() {
  return __cxx_static_address_a9aeb2edef41db0bc94c3fe1.reference || (__cxx_static_address_a9aeb2edef41db0bc94c3fe1.reference = {
    __cReference: true,
    get value() { return DUKELYINGDEAD____header_global_8a3b5cad76a2c051; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:545
export const DUKETORSO____header_global_d5067a5a716e4120 = ((((((1520) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_836d1478d295a3be1170bd0b() {
  return __cxx_static_address_836d1478d295a3be1170bd0b.reference || (__cxx_static_address_836d1478d295a3be1170bd0b.reference = {
    __cReference: true,
    get value() { return DUKETORSO____header_global_d5067a5a716e4120; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:546
export const DUKEGUN____header_global_e83af038e52c0e26 = ((((((1528) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a5b21deacded78fa16dd91c7() {
  return __cxx_static_address_a5b21deacded78fa16dd91c7.reference || (__cxx_static_address_a5b21deacded78fa16dd91c7.reference = {
    __cReference: true,
    get value() { return DUKEGUN____header_global_e83af038e52c0e26; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:547
export const DUKELEG____header_global_683fd5c432e900c9 = ((((((1536) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f1ad51fb97c2bcf96bf2b2aa() {
  return __cxx_static_address_f1ad51fb97c2bcf96bf2b2aa.reference || (__cxx_static_address_f1ad51fb97c2bcf96bf2b2aa.reference = {
    __cReference: true,
    get value() { return DUKELEG____header_global_683fd5c432e900c9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:548
export const SHARK____header_global_ef5e76d0d251c76e = ((((((1550) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_97080cef90d25af787e56b01() {
  return __cxx_static_address_97080cef90d25af787e56b01.reference || (__cxx_static_address_97080cef90d25af787e56b01.reference = {
    __cReference: true,
    get value() { return SHARK____header_global_ef5e76d0d251c76e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:549
export const BLOOD____header_global_c781f46b49d2eee1 = ((((((1620) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_399aa0b9f476fda52e956a57() {
  return __cxx_static_address_399aa0b9f476fda52e956a57.reference || (__cxx_static_address_399aa0b9f476fda52e956a57.reference = {
    __cReference: true,
    get value() { return BLOOD____header_global_c781f46b49d2eee1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:550
export const FIRELASER____header_global_7971bc91c0b2959d = ((((((1625) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_048926bc002372fe5134555d() {
  return __cxx_static_address_048926bc002372fe5134555d.reference || (__cxx_static_address_048926bc002372fe5134555d.reference = {
    __cReference: true,
    get value() { return FIRELASER____header_global_7971bc91c0b2959d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:551
export const TRANSPORTERSTAR____header_global_760c133a1c2f6292 = ((((((1630) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_772b7333e6af80c5abcb1b5b() {
  return __cxx_static_address_772b7333e6af80c5abcb1b5b.reference || (__cxx_static_address_772b7333e6af80c5abcb1b5b.reference = {
    __cReference: true,
    get value() { return TRANSPORTERSTAR____header_global_760c133a1c2f6292; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:552
export const SPIT____header_global_042a47a372cc42ab = ((((((1636) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b2fc2fdedb482d79d92a7ee5() {
  return __cxx_static_address_b2fc2fdedb482d79d92a7ee5.reference || (__cxx_static_address_b2fc2fdedb482d79d92a7ee5.reference = {
    __cReference: true,
    get value() { return SPIT____header_global_042a47a372cc42ab; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:553
export const LOOGIE____header_global_84878d155f829dbc = ((((((1637) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e6cfc0e34548b498a25f155e() {
  return __cxx_static_address_e6cfc0e34548b498a25f155e.reference || (__cxx_static_address_e6cfc0e34548b498a25f155e.reference = {
    __cReference: true,
    get value() { return LOOGIE____header_global_84878d155f829dbc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:554
export const FIST____header_global_4a67fe07027fde62 = ((((((1640) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1ffccec0a3eb3b9b3ce68ec2() {
  return __cxx_static_address_1ffccec0a3eb3b9b3ce68ec2.reference || (__cxx_static_address_1ffccec0a3eb3b9b3ce68ec2.reference = {
    __cReference: true,
    get value() { return FIST____header_global_4a67fe07027fde62; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:555
export const FREEZEBLAST____header_global_3006fe6d5f572815 = ((((((1641) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cd0cbc54cd293715f415e855() {
  return __cxx_static_address_cd0cbc54cd293715f415e855.reference || (__cxx_static_address_cd0cbc54cd293715f415e855.reference = {
    __cReference: true,
    get value() { return FREEZEBLAST____header_global_3006fe6d5f572815; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:556
export const SHRINKSPARK____header_global_aef58520d100d8d6 = ((((((1646) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bc9c5680410ae3ff23f617dc() {
  return __cxx_static_address_bc9c5680410ae3ff23f617dc.reference || (__cxx_static_address_bc9c5680410ae3ff23f617dc.reference = {
    __cReference: true,
    get value() { return SHRINKSPARK____header_global_aef58520d100d8d6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:557
export const TONGUE____header_global_9a1912aea7524e6e = ((((((1647) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ac409b7ab1d2a804ee1d87b7() {
  return __cxx_static_address_ac409b7ab1d2a804ee1d87b7.reference || (__cxx_static_address_ac409b7ab1d2a804ee1d87b7.reference = {
    __cReference: true,
    get value() { return TONGUE____header_global_9a1912aea7524e6e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:558
export const MORTER____header_global_d44dbeeef5c3f027 = ((((((1650) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5e3724c400c4be22957bb3ed() {
  return __cxx_static_address_5e3724c400c4be22957bb3ed.reference || (__cxx_static_address_5e3724c400c4be22957bb3ed.reference = {
    __cReference: true,
    get value() { return MORTER____header_global_d44dbeeef5c3f027; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:559
export const SHRINKEREXPLOSION____header_global_98c9e5f7665065a4 = ((((((1656) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a7894151d7ebd0f06220c452() {
  return __cxx_static_address_a7894151d7ebd0f06220c452.reference || (__cxx_static_address_a7894151d7ebd0f06220c452.reference = {
    __cReference: true,
    get value() { return SHRINKEREXPLOSION____header_global_98c9e5f7665065a4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:560
export const RADIUSEXPLOSION____header_global_b7cc65d319b70975 = ((((((1670) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_667f39742705f6cefb5a9ee7() {
  return __cxx_static_address_667f39742705f6cefb5a9ee7.reference || (__cxx_static_address_667f39742705f6cefb5a9ee7.reference = {
    __cReference: true,
    get value() { return RADIUSEXPLOSION____header_global_b7cc65d319b70975; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:561
export const FORCERIPPLE____header_global_5bb949ed9f2ffdda = ((((((1671) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cc7cdb6bc1e9b29fb41789a1() {
  return __cxx_static_address_cc7cdb6bc1e9b29fb41789a1.reference || (__cxx_static_address_cc7cdb6bc1e9b29fb41789a1.reference = {
    __cReference: true,
    get value() { return FORCERIPPLE____header_global_5bb949ed9f2ffdda; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:562
export const LIZTROOP____header_global_0e03a88004c76334 = ((((((1680) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f2a18a670a2cc91298fdb8ba() {
  return __cxx_static_address_f2a18a670a2cc91298fdb8ba.reference || (__cxx_static_address_f2a18a670a2cc91298fdb8ba.reference = {
    __cReference: true,
    get value() { return LIZTROOP____header_global_0e03a88004c76334; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:563
export const LIZTROOPRUNNING____header_global_98519de2418f2dcf = ((((((1681) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c43c406d7759223be9df478c() {
  return __cxx_static_address_c43c406d7759223be9df478c.reference || (__cxx_static_address_c43c406d7759223be9df478c.reference = {
    __cReference: true,
    get value() { return LIZTROOPRUNNING____header_global_98519de2418f2dcf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:564
export const LIZTROOPSTAYPUT____header_global_a80e2e5c5f73e46d = ((((((1682) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3aeb28b1d48195b4b0bdcfe4() {
  return __cxx_static_address_3aeb28b1d48195b4b0bdcfe4.reference || (__cxx_static_address_3aeb28b1d48195b4b0bdcfe4.reference = {
    __cReference: true,
    get value() { return LIZTROOPSTAYPUT____header_global_a80e2e5c5f73e46d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:565
export const LIZTROOPSHOOT____header_global_2fa5635adf89137c = ((((((1715) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8509f82ad972018718059e95() {
  return __cxx_static_address_8509f82ad972018718059e95.reference || (__cxx_static_address_8509f82ad972018718059e95.reference = {
    __cReference: true,
    get value() { return LIZTROOPSHOOT____header_global_2fa5635adf89137c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:566
export const LIZTROOPJETPACK____header_global_a9d65559f9cdd4f1 = ((((((1725) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cc3a482750010ea94c45a2b9() {
  return __cxx_static_address_cc3a482750010ea94c45a2b9.reference || (__cxx_static_address_cc3a482750010ea94c45a2b9.reference = {
    __cReference: true,
    get value() { return LIZTROOPJETPACK____header_global_a9d65559f9cdd4f1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:567
export const LIZTROOPONTOILET____header_global_e7cb796f92c6c0f0 = ((((((1741) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_901860b7963e0ba96d2002cf() {
  return __cxx_static_address_901860b7963e0ba96d2002cf.reference || (__cxx_static_address_901860b7963e0ba96d2002cf.reference = {
    __cReference: true,
    get value() { return LIZTROOPONTOILET____header_global_e7cb796f92c6c0f0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:568
export const LIZTROOPJUSTSIT____header_global_5689e2cf2cc12dc0 = ((((((1742) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5236b7e5f5012fe75a7cf3b1() {
  return __cxx_static_address_5236b7e5f5012fe75a7cf3b1.reference || (__cxx_static_address_5236b7e5f5012fe75a7cf3b1.reference = {
    __cReference: true,
    get value() { return LIZTROOPJUSTSIT____header_global_5689e2cf2cc12dc0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:569
export const LIZTROOPDUCKING____header_global_f5326ae2a9f35de9 = ((((((1744) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5a9dac0034947204f39f8aa5() {
  return __cxx_static_address_5a9dac0034947204f39f8aa5.reference || (__cxx_static_address_5a9dac0034947204f39f8aa5.reference = {
    __cReference: true,
    get value() { return LIZTROOPDUCKING____header_global_f5326ae2a9f35de9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:570
export const HEADJIB1____header_global_4bf44a6107f86489 = ((((((1768) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7ea6acb2ec2df35a6c15c3eb() {
  return __cxx_static_address_7ea6acb2ec2df35a6c15c3eb.reference || (__cxx_static_address_7ea6acb2ec2df35a6c15c3eb.reference = {
    __cReference: true,
    get value() { return HEADJIB1____header_global_4bf44a6107f86489; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:571
export const ARMJIB1____header_global_ae8a46800ee05a19 = ((((((1772) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2da98e19510688d2d7d85a36() {
  return __cxx_static_address_2da98e19510688d2d7d85a36.reference || (__cxx_static_address_2da98e19510688d2d7d85a36.reference = {
    __cReference: true,
    get value() { return ARMJIB1____header_global_ae8a46800ee05a19; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:572
export const LEGJIB1____header_global_142e586496627838 = ((((((1776) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3f1810348ada6e65e4020394() {
  return __cxx_static_address_3f1810348ada6e65e4020394.reference || (__cxx_static_address_3f1810348ada6e65e4020394.reference = {
    __cReference: true,
    get value() { return LEGJIB1____header_global_142e586496627838; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:573
export const OCTABRAIN____header_global_534b71fc92841a11 = ((((((1820) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8532b429d77c7b02850b9d88() {
  return __cxx_static_address_8532b429d77c7b02850b9d88.reference || (__cxx_static_address_8532b429d77c7b02850b9d88.reference = {
    __cReference: true,
    get value() { return OCTABRAIN____header_global_534b71fc92841a11; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:574
export const OCTABRAINSTAYPUT____header_global_8458668305166c22 = ((((((1821) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a46afb7bbf718fc8037f31e2() {
  return __cxx_static_address_a46afb7bbf718fc8037f31e2.reference || (__cxx_static_address_a46afb7bbf718fc8037f31e2.reference = {
    __cReference: true,
    get value() { return OCTABRAINSTAYPUT____header_global_8458668305166c22; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:575
export const INNERJAW____header_global_2efbab8982bb9257 = ((((((1860) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_85c65cb86a334d4d42371194() {
  return __cxx_static_address_85c65cb86a334d4d42371194.reference || (__cxx_static_address_85c65cb86a334d4d42371194.reference = {
    __cReference: true,
    get value() { return INNERJAW____header_global_2efbab8982bb9257; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:576
export const DRONE____header_global_c7fc0f19447ba883 = ((((((1880) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0f7220a3782e7382b2411900() {
  return __cxx_static_address_0f7220a3782e7382b2411900.reference || (__cxx_static_address_0f7220a3782e7382b2411900.reference = {
    __cReference: true,
    get value() { return DRONE____header_global_c7fc0f19447ba883; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:577
export const EXPLOSION2____header_global_fc009841527d46b6 = ((((((1890) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a5416c8219eee1aa59265464() {
  return __cxx_static_address_a5416c8219eee1aa59265464.reference || (__cxx_static_address_a5416c8219eee1aa59265464.reference = {
    __cReference: true,
    get value() { return EXPLOSION2____header_global_fc009841527d46b6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:578
export const COMMANDER____header_global_5900ac2d32708617 = ((((((1920) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_38cb8ac09e3c02c510ba5948() {
  return __cxx_static_address_38cb8ac09e3c02c510ba5948.reference || (__cxx_static_address_38cb8ac09e3c02c510ba5948.reference = {
    __cReference: true,
    get value() { return COMMANDER____header_global_5900ac2d32708617; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:579
export const COMMANDERSTAYPUT____header_global_55542adf270ea955 = ((((((1921) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_91b07f8b55bf8344b9844ba9() {
  return __cxx_static_address_91b07f8b55bf8344b9844ba9.reference || (__cxx_static_address_91b07f8b55bf8344b9844ba9.reference = {
    __cReference: true,
    get value() { return COMMANDERSTAYPUT____header_global_55542adf270ea955; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:580
export const RECON____header_global_36d7d1a13e5a36e1 = ((((((1960) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ad0de75516a6e0f65acb61a8() {
  return __cxx_static_address_ad0de75516a6e0f65acb61a8.reference || (__cxx_static_address_ad0de75516a6e0f65acb61a8.reference = {
    __cReference: true,
    get value() { return RECON____header_global_36d7d1a13e5a36e1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:581
export const TANK____header_global_b5e7a56c2adc3666 = ((((((1975) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_16b7e654391d45d6e0dcf4db() {
  return __cxx_static_address_16b7e654391d45d6e0dcf4db.reference || (__cxx_static_address_16b7e654391d45d6e0dcf4db.reference = {
    __cReference: true,
    get value() { return TANK____header_global_b5e7a56c2adc3666; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:582
export const PIGCOP____header_global_c3460ca8a4da6897 = ((((((2000) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_02307181bda10b79dca0ccc4() {
  return __cxx_static_address_02307181bda10b79dca0ccc4.reference || (__cxx_static_address_02307181bda10b79dca0ccc4.reference = {
    __cReference: true,
    get value() { return PIGCOP____header_global_c3460ca8a4da6897; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:583
export const PIGCOPSTAYPUT____header_global_909fdcbe5b81ba43 = ((((((2001) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ebcb0e5e20278f0fc79fe157() {
  return __cxx_static_address_ebcb0e5e20278f0fc79fe157.reference || (__cxx_static_address_ebcb0e5e20278f0fc79fe157.reference = {
    __cReference: true,
    get value() { return PIGCOPSTAYPUT____header_global_909fdcbe5b81ba43; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:584
export const PIGCOPDIVE____header_global_0e428226654e3fec = ((((((2045) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1a69e1c773f9196f70694732() {
  return __cxx_static_address_1a69e1c773f9196f70694732.reference || (__cxx_static_address_1a69e1c773f9196f70694732.reference = {
    __cReference: true,
    get value() { return PIGCOPDIVE____header_global_0e428226654e3fec; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:585
export const LIZMAN____header_global_d4e6e45fc79ce4a1 = ((((((2120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_96b16c6173cb5c4fb982b1bb() {
  return __cxx_static_address_96b16c6173cb5c4fb982b1bb.reference || (__cxx_static_address_96b16c6173cb5c4fb982b1bb.reference = {
    __cReference: true,
    get value() { return LIZMAN____header_global_d4e6e45fc79ce4a1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:586
export const LIZMANSTAYPUT____header_global_00ed3df24ca45f4a = ((((((2121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bec03918ff3de8dabe71b23e() {
  return __cxx_static_address_bec03918ff3de8dabe71b23e.reference || (__cxx_static_address_bec03918ff3de8dabe71b23e.reference = {
    __cReference: true,
    get value() { return LIZMANSTAYPUT____header_global_00ed3df24ca45f4a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:587
export const LIZMANSPITTING____header_global_434075afa6b164bf = ((((((2150) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_306be4146db221acec118b5d() {
  return __cxx_static_address_306be4146db221acec118b5d.reference || (__cxx_static_address_306be4146db221acec118b5d.reference = {
    __cReference: true,
    get value() { return LIZMANSPITTING____header_global_434075afa6b164bf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:588
export const LIZMANFEEDING____header_global_ff436c141de91f0a = ((((((2160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_364366c3f51391c7f04be0f2() {
  return __cxx_static_address_364366c3f51391c7f04be0f2.reference || (__cxx_static_address_364366c3f51391c7f04be0f2.reference = {
    __cReference: true,
    get value() { return LIZMANFEEDING____header_global_ff436c141de91f0a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:589
export const LIZMANJUMP____header_global_af1d5999cb807ab3 = ((((((2165) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_29fdffe50436bcf59b2a0e40() {
  return __cxx_static_address_29fdffe50436bcf59b2a0e40.reference || (__cxx_static_address_29fdffe50436bcf59b2a0e40.reference = {
    __cReference: true,
    get value() { return LIZMANJUMP____header_global_af1d5999cb807ab3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:590
export const FECES____header_global_02071ce11ec0c1b2 = ((((((2200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5658b52656ace9c54495db50() {
  return __cxx_static_address_5658b52656ace9c54495db50.reference || (__cxx_static_address_5658b52656ace9c54495db50.reference = {
    __cReference: true,
    get value() { return FECES____header_global_02071ce11ec0c1b2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:591
export const LIZMANHEAD1____header_global_1e23abaf6837ff98 = ((((((2201) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_08147afa1c5e79e59a35b0a6() {
  return __cxx_static_address_08147afa1c5e79e59a35b0a6.reference || (__cxx_static_address_08147afa1c5e79e59a35b0a6.reference = {
    __cReference: true,
    get value() { return LIZMANHEAD1____header_global_1e23abaf6837ff98; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:592
export const LIZMANARM1____header_global_e9df07188d67f86f = ((((((2205) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8c89fb46536ad752c842ccdd() {
  return __cxx_static_address_8c89fb46536ad752c842ccdd.reference || (__cxx_static_address_8c89fb46536ad752c842ccdd.reference = {
    __cReference: true,
    get value() { return LIZMANARM1____header_global_e9df07188d67f86f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:593
export const LIZMANLEG1____header_global_7f30e2981cb26110 = ((((((2209) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d4c56db0f1ab166f11dd2897() {
  return __cxx_static_address_d4c56db0f1ab166f11dd2897.reference || (__cxx_static_address_d4c56db0f1ab166f11dd2897.reference = {
    __cReference: true,
    get value() { return LIZMANLEG1____header_global_7f30e2981cb26110; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:594
export const EXPLOSION2BOT____header_global_75faa8a3199a9134 = ((((((2219) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_438dbc9989a928a2ecd3a0fe() {
  return __cxx_static_address_438dbc9989a928a2ecd3a0fe.reference || (__cxx_static_address_438dbc9989a928a2ecd3a0fe.reference = {
    __cReference: true,
    get value() { return EXPLOSION2BOT____header_global_75faa8a3199a9134; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:595
export const JIBS1____header_global_56ff53fe158134ae = ((((((2245) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_508c0fa1ca95673120c1a563() {
  return __cxx_static_address_508c0fa1ca95673120c1a563.reference || (__cxx_static_address_508c0fa1ca95673120c1a563.reference = {
    __cReference: true,
    get value() { return JIBS1____header_global_56ff53fe158134ae; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:596
export const JIBS2____header_global_d1b2be67ae5fc880 = ((((((2250) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_faf63e6c38702fc6fd66f370() {
  return __cxx_static_address_faf63e6c38702fc6fd66f370.reference || (__cxx_static_address_faf63e6c38702fc6fd66f370.reference = {
    __cReference: true,
    get value() { return JIBS2____header_global_d1b2be67ae5fc880; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:597
export const JIBS3____header_global_173a302b6b34d343 = ((((((2255) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_64bc28c35a2304c930490919() {
  return __cxx_static_address_64bc28c35a2304c930490919.reference || (__cxx_static_address_64bc28c35a2304c930490919.reference = {
    __cReference: true,
    get value() { return JIBS3____header_global_173a302b6b34d343; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:598
export const JIBS4____header_global_1e090ba834cfdccc = ((((((2260) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_09800435b45677098ba8cc3a() {
  return __cxx_static_address_09800435b45677098ba8cc3a.reference || (__cxx_static_address_09800435b45677098ba8cc3a.reference = {
    __cReference: true,
    get value() { return JIBS4____header_global_1e090ba834cfdccc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:599
export const JIBS5____header_global_cc1bf809af2191a5 = ((((((2265) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2763ace44cc841e245f1b954() {
  return __cxx_static_address_2763ace44cc841e245f1b954.reference || (__cxx_static_address_2763ace44cc841e245f1b954.reference = {
    __cReference: true,
    get value() { return JIBS5____header_global_cc1bf809af2191a5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:600
export const BURNING____header_global_ebc2812e076ce4dd = ((((((2270) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7cd22b21b37a23dfa8f3c55f() {
  return __cxx_static_address_7cd22b21b37a23dfa8f3c55f.reference || (__cxx_static_address_7cd22b21b37a23dfa8f3c55f.reference = {
    __cReference: true,
    get value() { return BURNING____header_global_ebc2812e076ce4dd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:601
export const FIRE____header_global_a6e6e17b845dda59 = ((((((2271) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a52fe627238f8f988aafa7e0() {
  return __cxx_static_address_a52fe627238f8f988aafa7e0.reference || (__cxx_static_address_a52fe627238f8f988aafa7e0.reference = {
    __cReference: true,
    get value() { return FIRE____header_global_a6e6e17b845dda59; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:602
export const JIBS6____header_global_8da5a3c7bbb68ba5 = ((((((2286) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d1b2e43b298ed02081a40904() {
  return __cxx_static_address_d1b2e43b298ed02081a40904.reference || (__cxx_static_address_d1b2e43b298ed02081a40904.reference = {
    __cReference: true,
    get value() { return JIBS6____header_global_8da5a3c7bbb68ba5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:603
export const BLOODSPLAT1____header_global_e467ae1e7ae86d72 = ((((((2296) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_52cf4f0eeb0eff5d8751455e() {
  return __cxx_static_address_52cf4f0eeb0eff5d8751455e.reference || (__cxx_static_address_52cf4f0eeb0eff5d8751455e.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT1____header_global_e467ae1e7ae86d72; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:604
export const BLOODSPLAT3____header_global_deeaa057406a6b54 = ((((((2297) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c934f4b8656132b6cfea276a() {
  return __cxx_static_address_c934f4b8656132b6cfea276a.reference || (__cxx_static_address_c934f4b8656132b6cfea276a.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT3____header_global_deeaa057406a6b54; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:605
export const BLOODSPLAT2____header_global_2abb2341bdbe5991 = ((((((2298) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_36c2187b4cf4f40feaf0519c() {
  return __cxx_static_address_36c2187b4cf4f40feaf0519c.reference || (__cxx_static_address_36c2187b4cf4f40feaf0519c.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT2____header_global_2abb2341bdbe5991; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:606
export const BLOODSPLAT4____header_global_11e0fadf8bc215b8 = ((((((2299) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_31ae425b5d5b678cef74f29f() {
  return __cxx_static_address_31ae425b5d5b678cef74f29f.reference || (__cxx_static_address_31ae425b5d5b678cef74f29f.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT4____header_global_11e0fadf8bc215b8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:607
export const OOZ____header_global_04d2fb223af6627b = ((((((2300) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_edbebfed5400930012cc1c69() {
  return __cxx_static_address_edbebfed5400930012cc1c69.reference || (__cxx_static_address_edbebfed5400930012cc1c69.reference = {
    __cReference: true,
    get value() { return OOZ____header_global_04d2fb223af6627b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:608
export const OOZ2____header_global_a254b713b7af03e4 = ((((((2309) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7da46d47ecdf446b75be8159() {
  return __cxx_static_address_7da46d47ecdf446b75be8159.reference || (__cxx_static_address_7da46d47ecdf446b75be8159.reference = {
    __cReference: true,
    get value() { return OOZ2____header_global_a254b713b7af03e4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:609
export const WALLBLOOD1____header_global_496937b473bc145d = ((((((2301) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_146ab264ebbff708aaa2ad6a() {
  return __cxx_static_address_146ab264ebbff708aaa2ad6a.reference || (__cxx_static_address_146ab264ebbff708aaa2ad6a.reference = {
    __cReference: true,
    get value() { return WALLBLOOD1____header_global_496937b473bc145d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:610
export const WALLBLOOD2____header_global_9a9b6288cc3d5d9e = ((((((2302) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_19aa662c0cf83c74a8f1c6d7() {
  return __cxx_static_address_19aa662c0cf83c74a8f1c6d7.reference || (__cxx_static_address_19aa662c0cf83c74a8f1c6d7.reference = {
    __cReference: true,
    get value() { return WALLBLOOD2____header_global_9a9b6288cc3d5d9e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:611
export const WALLBLOOD3____header_global_63a99f16d727a034 = ((((((2303) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8d054d11225fb8a839fdce2f() {
  return __cxx_static_address_8d054d11225fb8a839fdce2f.reference || (__cxx_static_address_8d054d11225fb8a839fdce2f.reference = {
    __cReference: true,
    get value() { return WALLBLOOD3____header_global_63a99f16d727a034; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:612
export const WALLBLOOD4____header_global_ab7f686c0ed91960 = ((((((2304) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d0058d448a5fd6b14b8231e5() {
  return __cxx_static_address_d0058d448a5fd6b14b8231e5.reference || (__cxx_static_address_d0058d448a5fd6b14b8231e5.reference = {
    __cReference: true,
    get value() { return WALLBLOOD4____header_global_ab7f686c0ed91960; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:613
export const WALLBLOOD5____header_global_5b290cfa7b3eb670 = ((((((2305) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4018ecedf0e4ba5642b25cd9() {
  return __cxx_static_address_4018ecedf0e4ba5642b25cd9.reference || (__cxx_static_address_4018ecedf0e4ba5642b25cd9.reference = {
    __cReference: true,
    get value() { return WALLBLOOD5____header_global_5b290cfa7b3eb670; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:614
export const WALLBLOOD7____header_global_dd5127f7f9974fda = ((((((2307) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f66785d159c4142948b87608() {
  return __cxx_static_address_f66785d159c4142948b87608.reference || (__cxx_static_address_f66785d159c4142948b87608.reference = {
    __cReference: true,
    get value() { return WALLBLOOD7____header_global_dd5127f7f9974fda; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:615
export const WALLBLOOD8____header_global_911a5ed55c6ef992 = ((((((2308) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9085b9955e7a4dd8928b85ef() {
  return __cxx_static_address_9085b9955e7a4dd8928b85ef.reference || (__cxx_static_address_9085b9955e7a4dd8928b85ef.reference = {
    __cReference: true,
    get value() { return WALLBLOOD8____header_global_911a5ed55c6ef992; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:616
export const BURNING2____header_global_0c659e504a68deda = ((((((2310) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4596aa8a1a8d5006ad0602af() {
  return __cxx_static_address_4596aa8a1a8d5006ad0602af.reference || (__cxx_static_address_4596aa8a1a8d5006ad0602af.reference = {
    __cReference: true,
    get value() { return BURNING2____header_global_0c659e504a68deda; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:617
export const FIRE2____header_global_2a83b77e1c142b07 = ((((((2311) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_688cdbbd422f11104a19c241() {
  return __cxx_static_address_688cdbbd422f11104a19c241.reference || (__cxx_static_address_688cdbbd422f11104a19c241.reference = {
    __cReference: true,
    get value() { return FIRE2____header_global_2a83b77e1c142b07; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:618
export const CRACKKNUCKLES____header_global_4b655117459d763c = ((((((2324) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f9b1e071885b8c49af1ad0cc() {
  return __cxx_static_address_f9b1e071885b8c49af1ad0cc.reference || (__cxx_static_address_f9b1e071885b8c49af1ad0cc.reference = {
    __cReference: true,
    get value() { return CRACKKNUCKLES____header_global_4b655117459d763c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:619
export const SMALLSMOKE____header_global_bf4ac952b48e7bb9 = ((((((2329) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d99e70cb52c13a97c7db6578() {
  return __cxx_static_address_d99e70cb52c13a97c7db6578.reference || (__cxx_static_address_d99e70cb52c13a97c7db6578.reference = {
    __cReference: true,
    get value() { return SMALLSMOKE____header_global_bf4ac952b48e7bb9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:620
export const FLOORFLAME____header_global_be4397b1d3755ca4 = ((((((2333) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ea1b42b70f81ce9bf6a5cb86() {
  return __cxx_static_address_ea1b42b70f81ce9bf6a5cb86.reference || (__cxx_static_address_ea1b42b70f81ce9bf6a5cb86.reference = {
    __cReference: true,
    get value() { return FLOORFLAME____header_global_be4397b1d3755ca4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:621
export const ROTATEGUN____header_global_cf752d67b80da8a2 = ((((((2360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dbeb60bff7a1879d4c3e8a4d() {
  return __cxx_static_address_dbeb60bff7a1879d4c3e8a4d.reference || (__cxx_static_address_dbeb60bff7a1879d4c3e8a4d.reference = {
    __cReference: true,
    get value() { return ROTATEGUN____header_global_cf752d67b80da8a2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:622
export const GREENSLIME____header_global_e16c7a0573117198 = ((((((2370) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0a57af95a13457f392111886() {
  return __cxx_static_address_0a57af95a13457f392111886.reference || (__cxx_static_address_0a57af95a13457f392111886.reference = {
    __cReference: true,
    get value() { return GREENSLIME____header_global_e16c7a0573117198; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:623
export const WATERDRIPSPLASH____header_global_1bea7538817514c2 = ((((((2380) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eb0d355a4368a4efdc51674a() {
  return __cxx_static_address_eb0d355a4368a4efdc51674a.reference || (__cxx_static_address_eb0d355a4368a4efdc51674a.reference = {
    __cReference: true,
    get value() { return WATERDRIPSPLASH____header_global_1bea7538817514c2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:624
export const SCRAP6____header_global_d381131a8ad5bdd5 = ((((((2390) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_99479f48b930ab41cf21a194() {
  return __cxx_static_address_99479f48b930ab41cf21a194.reference || (__cxx_static_address_99479f48b930ab41cf21a194.reference = {
    __cReference: true,
    get value() { return SCRAP6____header_global_d381131a8ad5bdd5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:625
export const SCRAP1____header_global_67686425fb62483f = ((((((2400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e3c6acc68c8f078be593126e() {
  return __cxx_static_address_e3c6acc68c8f078be593126e.reference || (__cxx_static_address_e3c6acc68c8f078be593126e.reference = {
    __cReference: true,
    get value() { return SCRAP1____header_global_67686425fb62483f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:626
export const SCRAP2____header_global_6bfcd26fc0051b06 = ((((((2404) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fae9f0eba3e840ed6592aed1() {
  return __cxx_static_address_fae9f0eba3e840ed6592aed1.reference || (__cxx_static_address_fae9f0eba3e840ed6592aed1.reference = {
    __cReference: true,
    get value() { return SCRAP2____header_global_6bfcd26fc0051b06; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:627
export const SCRAP3____header_global_3ae9fe9c9c688314 = ((((((2408) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_67b680a9989014e9e700e79b() {
  return __cxx_static_address_67b680a9989014e9e700e79b.reference || (__cxx_static_address_67b680a9989014e9e700e79b.reference = {
    __cReference: true,
    get value() { return SCRAP3____header_global_3ae9fe9c9c688314; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:628
export const SCRAP4____header_global_04c281248151adf8 = ((((((2412) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_47cdbecd1a06ae001986403c() {
  return __cxx_static_address_47cdbecd1a06ae001986403c.reference || (__cxx_static_address_47cdbecd1a06ae001986403c.reference = {
    __cReference: true,
    get value() { return SCRAP4____header_global_04c281248151adf8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:629
export const SCRAP5____header_global_30e5b5cd0c490501 = ((((((2416) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_34892cf866a7eb0933d36e8b() {
  return __cxx_static_address_34892cf866a7eb0933d36e8b.reference || (__cxx_static_address_34892cf866a7eb0933d36e8b.reference = {
    __cReference: true,
    get value() { return SCRAP5____header_global_30e5b5cd0c490501; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:630
export const ORGANTIC____header_global_33b88e014d85df8d = ((((((2420) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2578feaf29735a43bfa2231f() {
  return __cxx_static_address_2578feaf29735a43bfa2231f.reference || (__cxx_static_address_2578feaf29735a43bfa2231f.reference = {
    __cReference: true,
    get value() { return ORGANTIC____header_global_33b88e014d85df8d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:631
export const BETAVERSION____header_global_311e641a3b38bd04 = ((((((2440) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_43eeeef197242f5e191941bf() {
  return __cxx_static_address_43eeeef197242f5e191941bf.reference || (__cxx_static_address_43eeeef197242f5e191941bf.reference = {
    __cReference: true,
    get value() { return BETAVERSION____header_global_311e641a3b38bd04; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:632
export const SELECTDIR____header_global_5da1f03e1be4d6f7 = ((((((2444) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e234b9407a2a935134e94ba3() {
  return __cxx_static_address_e234b9407a2a935134e94ba3.reference || (__cxx_static_address_e234b9407a2a935134e94ba3.reference = {
    __cReference: true,
    get value() { return SELECTDIR____header_global_5da1f03e1be4d6f7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:633
export const F1HELP____header_global_37b95510d8efe45d = ((((((2445) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d79fd8dd053cd75e81a15c26() {
  return __cxx_static_address_d79fd8dd053cd75e81a15c26.reference || (__cxx_static_address_d79fd8dd053cd75e81a15c26.reference = {
    __cReference: true,
    get value() { return F1HELP____header_global_37b95510d8efe45d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:634
export const GROWSPARK____header_global_3039c9fdf2551f71 = ((((((2448) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a243e0c623319452a85d4b9d() {
  return __cxx_static_address_a243e0c623319452a85d4b9d.reference || (__cxx_static_address_a243e0c623319452a85d4b9d.reference = {
    __cReference: true,
    get value() { return GROWSPARK____header_global_3039c9fdf2551f71; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:635
export const MENUSCREEN____header_global_d6839ae658ed48ef = ((((((2456) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a52a2595594056a15c05e7a6() {
  return __cxx_static_address_a52a2595594056a15c05e7a6.reference || (__cxx_static_address_a52a2595594056a15c05e7a6.reference = {
    __cReference: true,
    get value() { return MENUSCREEN____header_global_d6839ae658ed48ef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:636
export const MENUBAR____header_global_ed58cdf590ab3103 = ((((((2457) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0ad4bded8d615468756fbedb() {
  return __cxx_static_address_0ad4bded8d615468756fbedb.reference || (__cxx_static_address_0ad4bded8d615468756fbedb.reference = {
    __cReference: true,
    get value() { return MENUBAR____header_global_ed58cdf590ab3103; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:637
export const KILLSICON____header_global_4bdb7d8f6242423b = ((((((2458) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0d5cb5e48cbd98f9e94cb1da() {
  return __cxx_static_address_0d5cb5e48cbd98f9e94cb1da.reference || (__cxx_static_address_0d5cb5e48cbd98f9e94cb1da.reference = {
    __cReference: true,
    get value() { return KILLSICON____header_global_4bdb7d8f6242423b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:638
export const FIRSTAID_ICON____header_global_4914b2154d389fdb = ((((((2460) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aed0f839305b751f62488295() {
  return __cxx_static_address_aed0f839305b751f62488295.reference || (__cxx_static_address_aed0f839305b751f62488295.reference = {
    __cReference: true,
    get value() { return FIRSTAID_ICON____header_global_4914b2154d389fdb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:639
export const HEAT_ICON____header_global_76da15072555ccc0 = ((((((2461) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_93ffd31005dfe92363e976cb() {
  return __cxx_static_address_93ffd31005dfe92363e976cb.reference || (__cxx_static_address_93ffd31005dfe92363e976cb.reference = {
    __cReference: true,
    get value() { return HEAT_ICON____header_global_76da15072555ccc0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:640
export const BOTTOMSTATUSBAR____header_global_fdc77050a9264a6f = ((((((2462) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3ef2b623b46cc14e9e2fe801() {
  return __cxx_static_address_3ef2b623b46cc14e9e2fe801.reference || (__cxx_static_address_3ef2b623b46cc14e9e2fe801.reference = {
    __cReference: true,
    get value() { return BOTTOMSTATUSBAR____header_global_fdc77050a9264a6f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:641
export const BOOT_ICON____header_global_11cbea76debe2bbb = ((((((2463) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_62a1f6f9082771653cc055fc() {
  return __cxx_static_address_62a1f6f9082771653cc055fc.reference || (__cxx_static_address_62a1f6f9082771653cc055fc.reference = {
    __cReference: true,
    get value() { return BOOT_ICON____header_global_11cbea76debe2bbb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:642
export const FRAGBAR____header_global_78148eaca287506e = ((((((2465) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_02f02146367c9f7159846b8b() {
  return __cxx_static_address_02f02146367c9f7159846b8b.reference || (__cxx_static_address_02f02146367c9f7159846b8b.reference = {
    __cReference: true,
    get value() { return FRAGBAR____header_global_78148eaca287506e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:643
export const JETPACK_ICON____header_global_1ee575e5641177f9 = ((((((2467) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_df3a957d24548e627b248390() {
  return __cxx_static_address_df3a957d24548e627b248390.reference || (__cxx_static_address_df3a957d24548e627b248390.reference = {
    __cReference: true,
    get value() { return JETPACK_ICON____header_global_1ee575e5641177f9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:644
export const AIRTANK_ICON____header_global_6436b0b53bc3f686 = ((((((2468) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e6e2b1b772a73b24ecd39ce6() {
  return __cxx_static_address_e6e2b1b772a73b24ecd39ce6.reference || (__cxx_static_address_e6e2b1b772a73b24ecd39ce6.reference = {
    __cReference: true,
    get value() { return AIRTANK_ICON____header_global_6436b0b53bc3f686; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:645
export const STEROIDS_ICON____header_global_9255264e7f3b65ee = ((((((2469) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6a28195945d19ef514fd7f66() {
  return __cxx_static_address_6a28195945d19ef514fd7f66.reference || (__cxx_static_address_6a28195945d19ef514fd7f66.reference = {
    __cReference: true,
    get value() { return STEROIDS_ICON____header_global_9255264e7f3b65ee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:646
export const HOLODUKE_ICON____header_global_1dc8655d289d72eb = ((((((2470) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_971a1cad220686d6e93c1f47() {
  return __cxx_static_address_971a1cad220686d6e93c1f47.reference || (__cxx_static_address_971a1cad220686d6e93c1f47.reference = {
    __cReference: true,
    get value() { return HOLODUKE_ICON____header_global_1dc8655d289d72eb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:647
export const ACCESS_ICON____header_global_26cf00034f9d7235 = ((((((2471) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bd280a83c131e237560863ae() {
  return __cxx_static_address_bd280a83c131e237560863ae.reference || (__cxx_static_address_bd280a83c131e237560863ae.reference = {
    __cReference: true,
    get value() { return ACCESS_ICON____header_global_26cf00034f9d7235; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:648
export const DIGITALNUM____header_global_699c76c668378499 = ((((((2472) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6f473eeaadf27657f8a39792() {
  return __cxx_static_address_6f473eeaadf27657f8a39792.reference || (__cxx_static_address_6f473eeaadf27657f8a39792.reference = {
    __cReference: true,
    get value() { return DIGITALNUM____header_global_699c76c668378499; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:649
export const DUKECAR____header_global_c58cc2c9cc2a05f3 = ((((((2491) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_84812d18f9e91255bd32e536() {
  return __cxx_static_address_84812d18f9e91255bd32e536.reference || (__cxx_static_address_84812d18f9e91255bd32e536.reference = {
    __cReference: true,
    get value() { return DUKECAR____header_global_c58cc2c9cc2a05f3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:650
export const CAMCORNER____header_global_565ab97dd933ad5a = ((((((2482) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4dc996423c9b75cf701b85e3() {
  return __cxx_static_address_4dc996423c9b75cf701b85e3.reference || (__cxx_static_address_4dc996423c9b75cf701b85e3.reference = {
    __cReference: true,
    get value() { return CAMCORNER____header_global_565ab97dd933ad5a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:651
export const CAMLIGHT____header_global_750c196127b3f62a = ((((((2484) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3ec01b3b25191beee181a303() {
  return __cxx_static_address_3ec01b3b25191beee181a303.reference || (__cxx_static_address_3ec01b3b25191beee181a303.reference = {
    __cReference: true,
    get value() { return CAMLIGHT____header_global_750c196127b3f62a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:652
export const SLIDEBAR____header_global_cb3d3f8f493aeb72 = ((((((2489) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_19cbb0f5772c9fbe598ed031() {
  return __cxx_static_address_19cbb0f5772c9fbe598ed031.reference || (__cxx_static_address_19cbb0f5772c9fbe598ed031.reference = {
    __cReference: true,
    get value() { return SLIDEBAR____header_global_cb3d3f8f493aeb72; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:653
export const DREALMS____header_global_54a0be1abe3de208 = ((((((2492) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5665eb4bbe3e0aeeb0ae9575() {
  return __cxx_static_address_5665eb4bbe3e0aeeb0ae9575.reference || (__cxx_static_address_5665eb4bbe3e0aeeb0ae9575.reference = {
    __cReference: true,
    get value() { return DREALMS____header_global_54a0be1abe3de208; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:654
export const BETASCREEN____header_global_cdd82c08280a70a3 = ((((((2493) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_86a71ea5134166a4ecbb49ba() {
  return __cxx_static_address_86a71ea5134166a4ecbb49ba.reference || (__cxx_static_address_86a71ea5134166a4ecbb49ba.reference = {
    __cReference: true,
    get value() { return BETASCREEN____header_global_cdd82c08280a70a3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:655
export const WINDOWBORDER1____header_global_0754182657f95d37 = ((((((2494) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2444cbdcda97104d41150953() {
  return __cxx_static_address_2444cbdcda97104d41150953.reference || (__cxx_static_address_2444cbdcda97104d41150953.reference = {
    __cReference: true,
    get value() { return WINDOWBORDER1____header_global_0754182657f95d37; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:656
export const TEXTBOX____header_global_096ea6993ecd3303 = ((((((2495) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7df1d7b3fe65ede943302eef() {
  return __cxx_static_address_7df1d7b3fe65ede943302eef.reference || (__cxx_static_address_7df1d7b3fe65ede943302eef.reference = {
    __cReference: true,
    get value() { return TEXTBOX____header_global_096ea6993ecd3303; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:657
export const WINDOWBORDER2____header_global_aab81f5081837f4a = ((((((2496) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7cca1115ecdf72f9c5c5a72e() {
  return __cxx_static_address_7cca1115ecdf72f9c5c5a72e.reference || (__cxx_static_address_7cca1115ecdf72f9c5c5a72e.reference = {
    __cReference: true,
    get value() { return WINDOWBORDER2____header_global_aab81f5081837f4a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:658
export const DUKENUKEM____header_global_2eae16c50ae0a61d = ((((((2497) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2ca2b4c94452bbb37c2f800f() {
  return __cxx_static_address_2ca2b4c94452bbb37c2f800f.reference || (__cxx_static_address_2ca2b4c94452bbb37c2f800f.reference = {
    __cReference: true,
    get value() { return DUKENUKEM____header_global_2eae16c50ae0a61d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:659
export const THREEDEE____header_global_efb8a3de1acb8a96 = ((((((2498) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_65ccf8de6a3e65a82d1fc55c() {
  return __cxx_static_address_65ccf8de6a3e65a82d1fc55c.reference || (__cxx_static_address_65ccf8de6a3e65a82d1fc55c.reference = {
    __cReference: true,
    get value() { return THREEDEE____header_global_efb8a3de1acb8a96; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:660
export const INGAMEDUKETHREEDEE____header_global_55b453a214a6c647 = ((((((2499) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_af4a6c0347075a291553089c() {
  return __cxx_static_address_af4a6c0347075a291553089c.reference || (__cxx_static_address_af4a6c0347075a291553089c.reference = {
    __cReference: true,
    get value() { return INGAMEDUKETHREEDEE____header_global_55b453a214a6c647; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:661
export const TENSCREEN____header_global_b9d7353223fe1918 = ((((((2500) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d8a133a80c4064d87ac52341() {
  return __cxx_static_address_d8a133a80c4064d87ac52341.reference || (__cxx_static_address_d8a133a80c4064d87ac52341.reference = {
    __cReference: true,
    get value() { return TENSCREEN____header_global_b9d7353223fe1918; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:662
export const PLUTOPAKSPRITE____header_global_bf5d070c00d24fc1 = ((((((2501) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d8dffa6565a2cce66e6d113d() {
  return __cxx_static_address_d8dffa6565a2cce66e6d113d.reference || (__cxx_static_address_d8dffa6565a2cce66e6d113d.reference = {
    __cReference: true,
    get value() { return PLUTOPAKSPRITE____header_global_bf5d070c00d24fc1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:663
export const DEVISTATOR____header_global_064fe039c8e48c21 = ((((((2510) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8cea5b2c36630de94a313d52() {
  return __cxx_static_address_8cea5b2c36630de94a313d52.reference || (__cxx_static_address_8cea5b2c36630de94a313d52.reference = {
    __cReference: true,
    get value() { return DEVISTATOR____header_global_064fe039c8e48c21; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:664
export const KNEE____header_global_e6746019e878eafb = ((((((2521) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_292843a9edf76b204acc6947() {
  return __cxx_static_address_292843a9edf76b204acc6947.reference || (__cxx_static_address_292843a9edf76b204acc6947.reference = {
    __cReference: true,
    get value() { return KNEE____header_global_e6746019e878eafb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:665
export const CROSSHAIR____header_global_3414f200299b9151 = ((((((2523) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6a9606eb17c4d5040c2847d7() {
  return __cxx_static_address_6a9606eb17c4d5040c2847d7.reference || (__cxx_static_address_6a9606eb17c4d5040c2847d7.reference = {
    __cReference: true,
    get value() { return CROSSHAIR____header_global_3414f200299b9151; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:666
export const FIRSTGUN____header_global_dc22e993d110e728 = ((((((2524) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_81f63df8a843cf13ccd30bb2() {
  return __cxx_static_address_81f63df8a843cf13ccd30bb2.reference || (__cxx_static_address_81f63df8a843cf13ccd30bb2.reference = {
    __cReference: true,
    get value() { return FIRSTGUN____header_global_dc22e993d110e728; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:667
export const FIRSTGUNRELOAD____header_global_bb6cf553e9d15376 = ((((((2528) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_051cafae91753054827661fa() {
  return __cxx_static_address_051cafae91753054827661fa.reference || (__cxx_static_address_051cafae91753054827661fa.reference = {
    __cReference: true,
    get value() { return FIRSTGUNRELOAD____header_global_bb6cf553e9d15376; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:668
export const SHELL____header_global_535af7c1ebbb6298 = ((((((2533) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e1b7cab8d5b158932aa8cc39() {
  return __cxx_static_address_e1b7cab8d5b158932aa8cc39.reference || (__cxx_static_address_e1b7cab8d5b158932aa8cc39.reference = {
    __cReference: true,
    get value() { return SHELL____header_global_535af7c1ebbb6298; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:669
export const SHOTGUNSHELL____header_global_99686585dffc4333 = ((((((2535) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6fb6e9d90b237a80e861e5c4() {
  return __cxx_static_address_6fb6e9d90b237a80e861e5c4.reference || (__cxx_static_address_6fb6e9d90b237a80e861e5c4.reference = {
    __cReference: true,
    get value() { return SHOTGUNSHELL____header_global_99686585dffc4333; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:670
export const CHAINGUN____header_global_78e809284e5f83fa = ((((((2536) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b27861485850126788b3b089() {
  return __cxx_static_address_b27861485850126788b3b089.reference || (__cxx_static_address_b27861485850126788b3b089.reference = {
    __cReference: true,
    get value() { return CHAINGUN____header_global_78e809284e5f83fa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:671
export const RPGGUN____header_global_8b47c1419246f3d3 = ((((((2544) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_95cd5143c6af3eacd26f7aa0() {
  return __cxx_static_address_95cd5143c6af3eacd26f7aa0.reference || (__cxx_static_address_95cd5143c6af3eacd26f7aa0.reference = {
    __cReference: true,
    get value() { return RPGGUN____header_global_8b47c1419246f3d3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:672
export const FREEZE____header_global_dcd8dc0680dc5767 = ((((((2548) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b62a448a047451ab9664a748() {
  return __cxx_static_address_b62a448a047451ab9664a748.reference || (__cxx_static_address_b62a448a047451ab9664a748.reference = {
    __cReference: true,
    get value() { return FREEZE____header_global_dcd8dc0680dc5767; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:673
export const SHRINKER____header_global_0a6ef3585990720f = ((((((2556) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f09f24a31343bc6a11ba4a5f() {
  return __cxx_static_address_f09f24a31343bc6a11ba4a5f.reference || (__cxx_static_address_f09f24a31343bc6a11ba4a5f.reference = {
    __cReference: true,
    get value() { return SHRINKER____header_global_0a6ef3585990720f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:674
export const HANDHOLDINGLASER____header_global_ded2d4ed7a762fd2 = ((((((2563) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2290ed6a8eae0c214984866e() {
  return __cxx_static_address_2290ed6a8eae0c214984866e.reference || (__cxx_static_address_2290ed6a8eae0c214984866e.reference = {
    __cReference: true,
    get value() { return HANDHOLDINGLASER____header_global_ded2d4ed7a762fd2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:675
export const TRIPBOMB____header_global_3378966e06690fd9 = ((((((2566) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0c9d03db513ac5536e22bbc6() {
  return __cxx_static_address_0c9d03db513ac5536e22bbc6.reference || (__cxx_static_address_0c9d03db513ac5536e22bbc6.reference = {
    __cReference: true,
    get value() { return TRIPBOMB____header_global_3378966e06690fd9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:676
export const LASERLINE____header_global_fc8a274cfaedd796 = ((((((2567) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7ebaa1508e87eebe8f080626() {
  return __cxx_static_address_7ebaa1508e87eebe8f080626.reference || (__cxx_static_address_7ebaa1508e87eebe8f080626.reference = {
    __cReference: true,
    get value() { return LASERLINE____header_global_fc8a274cfaedd796; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:677
export const HANDHOLDINGACCESS____header_global_7d17747aa5ab1769 = ((((((2568) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7bca2e09003e68b37070d791() {
  return __cxx_static_address_7bca2e09003e68b37070d791.reference || (__cxx_static_address_7bca2e09003e68b37070d791.reference = {
    __cReference: true,
    get value() { return HANDHOLDINGACCESS____header_global_7d17747aa5ab1769; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:678
export const HANDREMOTE____header_global_224312e2aae011a1 = ((((((2570) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9ccd787542dea15a993bc573() {
  return __cxx_static_address_9ccd787542dea15a993bc573.reference || (__cxx_static_address_9ccd787542dea15a993bc573.reference = {
    __cReference: true,
    get value() { return HANDREMOTE____header_global_224312e2aae011a1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:679
export const HANDTHROW____header_global_76649e1f55fd77a7 = ((((((2573) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a1dc108163e6c39eb6f363e0() {
  return __cxx_static_address_a1dc108163e6c39eb6f363e0.reference || (__cxx_static_address_a1dc108163e6c39eb6f363e0.reference = {
    __cReference: true,
    get value() { return HANDTHROW____header_global_76649e1f55fd77a7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:680
export const TIP____header_global_883e311f1f0dbf44 = ((((((2576) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_95986276b196bfc4ff1ea994() {
  return __cxx_static_address_95986276b196bfc4ff1ea994.reference || (__cxx_static_address_95986276b196bfc4ff1ea994.reference = {
    __cReference: true,
    get value() { return TIP____header_global_883e311f1f0dbf44; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:681
export const SCUBAMASK____header_global_52ae9e0235bdbfbf = ((((((2581) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_afe39227b46d62476ee75abc() {
  return __cxx_static_address_afe39227b46d62476ee75abc.reference || (__cxx_static_address_afe39227b46d62476ee75abc.reference = {
    __cReference: true,
    get value() { return SCUBAMASK____header_global_52ae9e0235bdbfbf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:682
export const FORCESPHERE____header_global_292e87bbf7014630 = ((((((2590) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d4c9deec7f84a7346810180b() {
  return __cxx_static_address_d4c9deec7f84a7346810180b.reference || (__cxx_static_address_d4c9deec7f84a7346810180b.reference = {
    __cReference: true,
    get value() { return FORCESPHERE____header_global_292e87bbf7014630; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:683
export const SHOTSPARK1____header_global_2b9dabf5e9c9e671 = ((((((2595) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d272460ef430602ea0d8d6a2() {
  return __cxx_static_address_d272460ef430602ea0d8d6a2.reference || (__cxx_static_address_d272460ef430602ea0d8d6a2.reference = {
    __cReference: true,
    get value() { return SHOTSPARK1____header_global_2b9dabf5e9c9e671; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:684
export const RPG____header_global_7f0d0e01f12f5074 = ((((((2605) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6eb98b489c6ad8de9422afad() {
  return __cxx_static_address_6eb98b489c6ad8de9422afad.reference || (__cxx_static_address_6eb98b489c6ad8de9422afad.reference = {
    __cReference: true,
    get value() { return RPG____header_global_7f0d0e01f12f5074; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:685
export const LASERSITE____header_global_e6c3f0d84d3e1249 = ((((((2612) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4b01c49b689897fa73d01f67() {
  return __cxx_static_address_4b01c49b689897fa73d01f67.reference || (__cxx_static_address_4b01c49b689897fa73d01f67.reference = {
    __cReference: true,
    get value() { return LASERSITE____header_global_e6c3f0d84d3e1249; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:686
export const SHOTGUN____header_global_010c5ab5aebde514 = ((((((2613) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f568c10ef9a0c63d9a64eaea() {
  return __cxx_static_address_f568c10ef9a0c63d9a64eaea.reference || (__cxx_static_address_f568c10ef9a0c63d9a64eaea.reference = {
    __cReference: true,
    get value() { return SHOTGUN____header_global_010c5ab5aebde514; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:687
export const BOSS1____header_global_eda7c2a285e8e6d7 = ((((((2630) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d27de077f0f1fd826df7225d() {
  return __cxx_static_address_d27de077f0f1fd826df7225d.reference || (__cxx_static_address_d27de077f0f1fd826df7225d.reference = {
    __cReference: true,
    get value() { return BOSS1____header_global_eda7c2a285e8e6d7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:688
export const BOSS1STAYPUT____header_global_6ef12492d8c4e7e7 = ((((((2631) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4b1af72d0c065f916fc0e8ba() {
  return __cxx_static_address_4b1af72d0c065f916fc0e8ba.reference || (__cxx_static_address_4b1af72d0c065f916fc0e8ba.reference = {
    __cReference: true,
    get value() { return BOSS1STAYPUT____header_global_6ef12492d8c4e7e7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:689
export const BOSS1SHOOT____header_global_94f7e65ac5616c79 = ((((((2660) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_85b07962985e984b6a638240() {
  return __cxx_static_address_85b07962985e984b6a638240.reference || (__cxx_static_address_85b07962985e984b6a638240.reference = {
    __cReference: true,
    get value() { return BOSS1SHOOT____header_global_94f7e65ac5616c79; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:690
export const BOSS1LOB____header_global_f23870c528b38f90 = ((((((2670) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_077e82018df17cff111dae21() {
  return __cxx_static_address_077e82018df17cff111dae21.reference || (__cxx_static_address_077e82018df17cff111dae21.reference = {
    __cReference: true,
    get value() { return BOSS1LOB____header_global_f23870c528b38f90; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:691
export const BOSSTOP____header_global_4861c051b0a87351 = ((((((2696) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a9f34cfa134604434b3c2bd7() {
  return __cxx_static_address_a9f34cfa134604434b3c2bd7.reference || (__cxx_static_address_a9f34cfa134604434b3c2bd7.reference = {
    __cReference: true,
    get value() { return BOSSTOP____header_global_4861c051b0a87351; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:692
export const BOSS2____header_global_16194638891ed632 = ((((((2710) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d822c2b02d42dba90fcd71d5() {
  return __cxx_static_address_d822c2b02d42dba90fcd71d5.reference || (__cxx_static_address_d822c2b02d42dba90fcd71d5.reference = {
    __cReference: true,
    get value() { return BOSS2____header_global_16194638891ed632; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:693
export const BOSS3____header_global_0d115980054685ad = ((((((2760) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_29cee71fc62298db42fdd104() {
  return __cxx_static_address_29cee71fc62298db42fdd104.reference || (__cxx_static_address_29cee71fc62298db42fdd104.reference = {
    __cReference: true,
    get value() { return BOSS3____header_global_0d115980054685ad; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:694
export const SPINNINGNUKEICON____header_global_399d39177cb19a6f = ((((((2813) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_98ff74e2014a78e08811d387() {
  return __cxx_static_address_98ff74e2014a78e08811d387.reference || (__cxx_static_address_98ff74e2014a78e08811d387.reference = {
    __cReference: true,
    get value() { return SPINNINGNUKEICON____header_global_399d39177cb19a6f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:695
export const SMALLFNTCURSOR____header_global_38dc1cb19d00e8da = ((((((2821) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a0e8a47e29e92c1c4a67c793() {
  return __cxx_static_address_a0e8a47e29e92c1c4a67c793.reference || (__cxx_static_address_a0e8a47e29e92c1c4a67c793.reference = {
    __cReference: true,
    get value() { return SMALLFNTCURSOR____header_global_38dc1cb19d00e8da; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:696
export const STARTALPHANUM____header_global_9eb8a6d4535a6a39 = ((((((2822) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1bee3c449b95870c8b3ee30f() {
  return __cxx_static_address_1bee3c449b95870c8b3ee30f.reference || (__cxx_static_address_1bee3c449b95870c8b3ee30f.reference = {
    __cReference: true,
    get value() { return STARTALPHANUM____header_global_9eb8a6d4535a6a39; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:697
export const ENDALPHANUM____header_global_518ad0e184d24acb = ((((((2915) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6e90f4aaf6f62e0de99ee467() {
  return __cxx_static_address_6e90f4aaf6f62e0de99ee467.reference || (__cxx_static_address_6e90f4aaf6f62e0de99ee467.reference = {
    __cReference: true,
    get value() { return ENDALPHANUM____header_global_518ad0e184d24acb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:698
export const BIGALPHANUM____header_global_12db2e04b112be70 = ((((((2940) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e0cb015967983f357155c992() {
  return __cxx_static_address_e0cb015967983f357155c992.reference || (__cxx_static_address_e0cb015967983f357155c992.reference = {
    __cReference: true,
    get value() { return BIGALPHANUM____header_global_12db2e04b112be70; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:699
export const BIGPERIOD____header_global_5194b9ae52c20c7e = ((((((3002) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fd18a02a09cdf9bcea0dec67() {
  return __cxx_static_address_fd18a02a09cdf9bcea0dec67.reference || (__cxx_static_address_fd18a02a09cdf9bcea0dec67.reference = {
    __cReference: true,
    get value() { return BIGPERIOD____header_global_5194b9ae52c20c7e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:700
export const BIGCOMMA____header_global_d9ee89a3a20d5b9d = ((((((3003) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ba4ded0c79703dede4cf3dbd() {
  return __cxx_static_address_ba4ded0c79703dede4cf3dbd.reference || (__cxx_static_address_ba4ded0c79703dede4cf3dbd.reference = {
    __cReference: true,
    get value() { return BIGCOMMA____header_global_d9ee89a3a20d5b9d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:701
export const BIGX____header_global_4ccd3f893c8c2b20 = ((((((3004) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5a4723ab1af685b3751a3744() {
  return __cxx_static_address_5a4723ab1af685b3751a3744.reference || (__cxx_static_address_5a4723ab1af685b3751a3744.reference = {
    __cReference: true,
    get value() { return BIGX____header_global_4ccd3f893c8c2b20; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:702
export const BIGQ____header_global_68e629097750dd35 = ((((((3005) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_89451020bc99158806a2e1b8() {
  return __cxx_static_address_89451020bc99158806a2e1b8.reference || (__cxx_static_address_89451020bc99158806a2e1b8.reference = {
    __cReference: true,
    get value() { return BIGQ____header_global_68e629097750dd35; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:703
export const BIGSEMI____header_global_6e9e8e61c3e3164c = ((((((3006) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cbb4326941f4ff336165b71e() {
  return __cxx_static_address_cbb4326941f4ff336165b71e.reference || (__cxx_static_address_cbb4326941f4ff336165b71e.reference = {
    __cReference: true,
    get value() { return BIGSEMI____header_global_6e9e8e61c3e3164c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:704
export const BIGCOLIN____header_global_29d442b4bce07412 = ((((((3007) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_542c3250c8da21c194c93280() {
  return __cxx_static_address_542c3250c8da21c194c93280.reference || (__cxx_static_address_542c3250c8da21c194c93280.reference = {
    __cReference: true,
    get value() { return BIGCOLIN____header_global_29d442b4bce07412; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:705
export const THREEBYFIVE____header_global_f933d7bfffd20514 = ((((((3010) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_42e022d46e113b0ae384c1e2() {
  return __cxx_static_address_42e022d46e113b0ae384c1e2.reference || (__cxx_static_address_42e022d46e113b0ae384c1e2.reference = {
    __cReference: true,
    get value() { return THREEBYFIVE____header_global_f933d7bfffd20514; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:706
export const BIGAPPOS____header_global_5709181797bfeb12 = ((((((3022) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_058b1edf59f13c2b09abd485() {
  return __cxx_static_address_058b1edf59f13c2b09abd485.reference || (__cxx_static_address_058b1edf59f13c2b09abd485.reference = {
    __cReference: true,
    get value() { return BIGAPPOS____header_global_5709181797bfeb12; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:707
export const MINIFONT____header_global_44e4d1680cd296d5 = ((((((3072) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3acd45faed4996155a4698f0() {
  return __cxx_static_address_3acd45faed4996155a4698f0.reference || (__cxx_static_address_3acd45faed4996155a4698f0.reference = {
    __cReference: true,
    get value() { return MINIFONT____header_global_44e4d1680cd296d5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:708
export const RESPAWNMARKERRED____header_global_2d65c1c6412289a1 = ((((((3190) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9154bfd50810fca9af1fae5a() {
  return __cxx_static_address_9154bfd50810fca9af1fae5a.reference || (__cxx_static_address_9154bfd50810fca9af1fae5a.reference = {
    __cReference: true,
    get value() { return RESPAWNMARKERRED____header_global_2d65c1c6412289a1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:709
export const RESPAWNMARKERYELLOW____header_global_659638ea1705abdd = ((((((3200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8c6829c3280b1ad01ba77796() {
  return __cxx_static_address_8c6829c3280b1ad01ba77796.reference || (__cxx_static_address_8c6829c3280b1ad01ba77796.reference = {
    __cReference: true,
    get value() { return RESPAWNMARKERYELLOW____header_global_659638ea1705abdd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:710
export const RESPAWNMARKERGREEN____header_global_24c434ba9e56d898 = ((((((3210) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5677dddc1353fb6c4635b589() {
  return __cxx_static_address_5677dddc1353fb6c4635b589.reference || (__cxx_static_address_5677dddc1353fb6c4635b589.reference = {
    __cReference: true,
    get value() { return RESPAWNMARKERGREEN____header_global_24c434ba9e56d898; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:711
export const BONUSSCREEN____header_global_2caf0dcbfcdea4df = ((((((3240) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3aa99ac9a532f91a35bf1578() {
  return __cxx_static_address_3aa99ac9a532f91a35bf1578.reference || (__cxx_static_address_3aa99ac9a532f91a35bf1578.reference = {
    __cReference: true,
    get value() { return BONUSSCREEN____header_global_2caf0dcbfcdea4df; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:712
export const VIEWBORDER____header_global_028eb171039eca97 = ((((((3250) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a41cfd463c51d5aae7cf4e25() {
  return __cxx_static_address_a41cfd463c51d5aae7cf4e25.reference || (__cxx_static_address_a41cfd463c51d5aae7cf4e25.reference = {
    __cReference: true,
    get value() { return VIEWBORDER____header_global_028eb171039eca97; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:713
export const VICTORY1____header_global_e9ee12d80662b223 = ((((((3260) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ff3b916fd40f88977ac0f9b2() {
  return __cxx_static_address_ff3b916fd40f88977ac0f9b2.reference || (__cxx_static_address_ff3b916fd40f88977ac0f9b2.reference = {
    __cReference: true,
    get value() { return VICTORY1____header_global_e9ee12d80662b223; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:714
export const ORDERING____header_global_96749e425b97061d = ((((((3270) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f3ee49c4388a745c33c90451() {
  return __cxx_static_address_f3ee49c4388a745c33c90451.reference || (__cxx_static_address_f3ee49c4388a745c33c90451.reference = {
    __cReference: true,
    get value() { return ORDERING____header_global_96749e425b97061d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:715
export const TEXTSTORY____header_global_0fcf3d7b85c2eba3 = ((((((3280) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b755a7a505050de88f222ddc() {
  return __cxx_static_address_b755a7a505050de88f222ddc.reference || (__cxx_static_address_b755a7a505050de88f222ddc.reference = {
    __cReference: true,
    get value() { return TEXTSTORY____header_global_0fcf3d7b85c2eba3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:716
export const LOADSCREEN____header_global_7c523e5b61cdca56 = ((((((3281) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7a55e53563d67c8c8cd85b77() {
  return __cxx_static_address_7a55e53563d67c8c8cd85b77.reference || (__cxx_static_address_7a55e53563d67c8c8cd85b77.reference = {
    __cReference: true,
    get value() { return LOADSCREEN____header_global_7c523e5b61cdca56; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:717
export const BORNTOBEWILDSCREEN____header_global_a2117562ce0a8a95 = ((((((3370) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e03479d73aa1cd6e7515c9df() {
  return __cxx_static_address_e03479d73aa1cd6e7515c9df.reference || (__cxx_static_address_e03479d73aa1cd6e7515c9df.reference = {
    __cReference: true,
    get value() { return BORNTOBEWILDSCREEN____header_global_a2117562ce0a8a95; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:718
export const BLIMP____header_global_44b3c841865a9eaa = ((((((3400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bf6c12d876fdeeb3ab78c528() {
  return __cxx_static_address_bf6c12d876fdeeb3ab78c528.reference || (__cxx_static_address_bf6c12d876fdeeb3ab78c528.reference = {
    __cReference: true,
    get value() { return BLIMP____header_global_44b3c841865a9eaa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:719
export const FEM9____header_global_4c2d5742d20671ee = ((((((3450) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e74bd7dee6ddbf173a206d12() {
  return __cxx_static_address_e74bd7dee6ddbf173a206d12.reference || (__cxx_static_address_e74bd7dee6ddbf173a206d12.reference = {
    __cReference: true,
    get value() { return FEM9____header_global_4c2d5742d20671ee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:720
export const FRAMEEFFECT1_13____header_global_2d7c5c0f37f1c690 = ((((((3999) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cf26fb34644fb6adb4939e57() {
  return __cxx_static_address_cf26fb34644fb6adb4939e57.reference || (__cxx_static_address_cf26fb34644fb6adb4939e57.reference = {
    __cReference: true,
    get value() { return FRAMEEFFECT1_13____header_global_2d7c5c0f37f1c690; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:721
export const FRAMEEFFECT1____header_global_5f26707e7d4cea84 = ((((((4095) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7cb3c12546cb2d02a4fe0a19() {
  return __cxx_static_address_7cb3c12546cb2d02a4fe0a19.reference || (__cxx_static_address_7cb3c12546cb2d02a4fe0a19.reference = {
    __cReference: true,
    get value() { return FRAMEEFFECT1____header_global_5f26707e7d4cea84; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:722
export const PANNEL3____header_global_fb72a8c05da20772 = ((((((4099) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4862921dc016ecb3d52bb111() {
  return __cxx_static_address_4862921dc016ecb3d52bb111.reference || (__cxx_static_address_4862921dc016ecb3d52bb111.reference = {
    __cReference: true,
    get value() { return PANNEL3____header_global_fb72a8c05da20772; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:723
export const SCREENBREAK14____header_global_7638e1d630d230b8 = ((((((4120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2f89dc0e1a8013ce9bec0961() {
  return __cxx_static_address_2f89dc0e1a8013ce9bec0961.reference || (__cxx_static_address_2f89dc0e1a8013ce9bec0961.reference = {
    __cReference: true,
    get value() { return SCREENBREAK14____header_global_7638e1d630d230b8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:724
export const SCREENBREAK15____header_global_42d5ea1d07434ec4 = ((((((4123) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ffab732ade766d3553e47000() {
  return __cxx_static_address_ffab732ade766d3553e47000.reference || (__cxx_static_address_ffab732ade766d3553e47000.reference = {
    __cReference: true,
    get value() { return SCREENBREAK15____header_global_42d5ea1d07434ec4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:725
export const SCREENBREAK19____header_global_47d9287bcb21e622 = ((((((4125) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4d0e4dfa9f4a314af5b5306a() {
  return __cxx_static_address_4d0e4dfa9f4a314af5b5306a.reference || (__cxx_static_address_4d0e4dfa9f4a314af5b5306a.reference = {
    __cReference: true,
    get value() { return SCREENBREAK19____header_global_47d9287bcb21e622; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:726
export const SCREENBREAK16____header_global_45e556596b5c28ad = ((((((4127) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3348d7e4a168fe6d70cdc231() {
  return __cxx_static_address_3348d7e4a168fe6d70cdc231.reference || (__cxx_static_address_3348d7e4a168fe6d70cdc231.reference = {
    __cReference: true,
    get value() { return SCREENBREAK16____header_global_45e556596b5c28ad; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:727
export const SCREENBREAK17____header_global_4de6fba95afe0a83 = ((((((4128) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_18481b19e7ce1aa645975983() {
  return __cxx_static_address_18481b19e7ce1aa645975983.reference || (__cxx_static_address_18481b19e7ce1aa645975983.reference = {
    __cReference: true,
    get value() { return SCREENBREAK17____header_global_4de6fba95afe0a83; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:728
export const SCREENBREAK18____header_global_fbc8e8b5cdb6053f = ((((((4129) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5bbbd81a0e46d17e3818e0ba() {
  return __cxx_static_address_5bbbd81a0e46d17e3818e0ba.reference || (__cxx_static_address_5bbbd81a0e46d17e3818e0ba.reference = {
    __cReference: true,
    get value() { return SCREENBREAK18____header_global_fbc8e8b5cdb6053f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:729
export const W_TECHWALL11____header_global_babeac4b901de492 = ((((((4130) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_036503bf5eda58e80867f29b() {
  return __cxx_static_address_036503bf5eda58e80867f29b.reference || (__cxx_static_address_036503bf5eda58e80867f29b.reference = {
    __cReference: true,
    get value() { return W_TECHWALL11____header_global_babeac4b901de492; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:730
export const W_TECHWALL12____header_global_fa7e16292381f298 = ((((((4131) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_50afbed57c36993e6e4b9f58() {
  return __cxx_static_address_50afbed57c36993e6e4b9f58.reference || (__cxx_static_address_50afbed57c36993e6e4b9f58.reference = {
    __cReference: true,
    get value() { return W_TECHWALL12____header_global_fa7e16292381f298; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:731
export const W_TECHWALL13____header_global_b13903ab241ca031 = ((((((4132) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ce1f456cba7cdefb54365535() {
  return __cxx_static_address_ce1f456cba7cdefb54365535.reference || (__cxx_static_address_ce1f456cba7cdefb54365535.reference = {
    __cReference: true,
    get value() { return W_TECHWALL13____header_global_b13903ab241ca031; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:732
export const W_TECHWALL14____header_global_054712ffb0d4954e = ((((((4133) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fa5db08eb758ac1365a3aad8() {
  return __cxx_static_address_fa5db08eb758ac1365a3aad8.reference || (__cxx_static_address_fa5db08eb758ac1365a3aad8.reference = {
    __cReference: true,
    get value() { return W_TECHWALL14____header_global_054712ffb0d4954e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:733
export const W_TECHWALL5____header_global_05537bfcbe5d17d7 = ((((((4134) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dc3138829859f9ed7614e87f() {
  return __cxx_static_address_dc3138829859f9ed7614e87f.reference || (__cxx_static_address_dc3138829859f9ed7614e87f.reference = {
    __cReference: true,
    get value() { return W_TECHWALL5____header_global_05537bfcbe5d17d7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:734
export const W_TECHWALL6____header_global_5efb9c861af9e021 = ((((((4136) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_41b05a233eee787daa574b7e() {
  return __cxx_static_address_41b05a233eee787daa574b7e.reference || (__cxx_static_address_41b05a233eee787daa574b7e.reference = {
    __cReference: true,
    get value() { return W_TECHWALL6____header_global_5efb9c861af9e021; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:735
export const W_TECHWALL7____header_global_fe71c476d75e9f2a = ((((((4138) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_af476c4f6e757b7a48546b18() {
  return __cxx_static_address_af476c4f6e757b7a48546b18.reference || (__cxx_static_address_af476c4f6e757b7a48546b18.reference = {
    __cReference: true,
    get value() { return W_TECHWALL7____header_global_fe71c476d75e9f2a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:736
export const W_TECHWALL8____header_global_8d5985d07cf44469 = ((((((4140) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f939bfd4b1812ba2db3e0839() {
  return __cxx_static_address_f939bfd4b1812ba2db3e0839.reference || (__cxx_static_address_f939bfd4b1812ba2db3e0839.reference = {
    __cReference: true,
    get value() { return W_TECHWALL8____header_global_8d5985d07cf44469; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:737
export const W_TECHWALL9____header_global_06ba0fd83e1da339 = ((((((4142) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cf200d1193ae918c9fc6658d() {
  return __cxx_static_address_cf200d1193ae918c9fc6658d.reference || (__cxx_static_address_cf200d1193ae918c9fc6658d.reference = {
    __cReference: true,
    get value() { return W_TECHWALL9____header_global_06ba0fd83e1da339; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:738
export const BPANNEL3____header_global_9ec2ba5b349790ba = ((((((4100) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4412e612842245cf34799a5d() {
  return __cxx_static_address_4412e612842245cf34799a5d.reference || (__cxx_static_address_4412e612842245cf34799a5d.reference = {
    __cReference: true,
    get value() { return BPANNEL3____header_global_9ec2ba5b349790ba; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:739
export const W_HITTECHWALL16____header_global_8a13cb1918d07703 = ((((((4144) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3cb1e543e5c8740477a1f84c() {
  return __cxx_static_address_3cb1e543e5c8740477a1f84c.reference || (__cxx_static_address_3cb1e543e5c8740477a1f84c.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL16____header_global_8a13cb1918d07703; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:740
export const W_HITTECHWALL10____header_global_053aed271ff83b4c = ((((((4145) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_165f63d500a90eb7ce1ed096() {
  return __cxx_static_address_165f63d500a90eb7ce1ed096.reference || (__cxx_static_address_165f63d500a90eb7ce1ed096.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL10____header_global_053aed271ff83b4c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:741
export const W_HITTECHWALL15____header_global_a6451b18039b31b3 = ((((((4147) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0c3939619cadcb99f6558727() {
  return __cxx_static_address_0c3939619cadcb99f6558727.reference || (__cxx_static_address_0c3939619cadcb99f6558727.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL15____header_global_a6451b18039b31b3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:742
export const W_MILKSHELF____header_global_1374533689fe6a0c = ((((((4181) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7059348bbda552eeb68a8b33() {
  return __cxx_static_address_7059348bbda552eeb68a8b33.reference || (__cxx_static_address_7059348bbda552eeb68a8b33.reference = {
    __cReference: true,
    get value() { return W_MILKSHELF____header_global_1374533689fe6a0c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:743
export const W_MILKSHELFBROKE____header_global_06c4ed65e1c29977 = ((((((4203) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a7dd970a147637fc6d045de3() {
  return __cxx_static_address_a7dd970a147637fc6d045de3.reference || (__cxx_static_address_a7dd970a147637fc6d045de3.reference = {
    __cReference: true,
    get value() { return W_MILKSHELFBROKE____header_global_06c4ed65e1c29977; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:744
export const PURPLELAVA____header_global_d3e3219c6fb3cd58 = ((((((4240) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bb2d0e6ce0d8f0dc5c62a426() {
  return __cxx_static_address_bb2d0e6ce0d8f0dc5c62a426.reference || (__cxx_static_address_bb2d0e6ce0d8f0dc5c62a426.reference = {
    __cReference: true,
    get value() { return PURPLELAVA____header_global_d3e3219c6fb3cd58; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:745
export const TARGET____header_global_b3ac3daf52a133ea = ((((((4359) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dae4be2d455fa22a621df02f() {
  return __cxx_static_address_dae4be2d455fa22a621df02f.reference || (__cxx_static_address_dae4be2d455fa22a621df02f.reference = {
    __cReference: true,
    get value() { return TARGET____header_global_b3ac3daf52a133ea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:746
export const DUCK____header_global_7960ac3ea62a9e5b = ((((((4361) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7aef5483e8da0704ce41cd31() {
  return __cxx_static_address_7aef5483e8da0704ce41cd31.reference || (__cxx_static_address_7aef5483e8da0704ce41cd31.reference = {
    __cReference: true,
    get value() { return DUCK____header_global_7960ac3ea62a9e5b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:747
export const PUKE____header_global_ba47668d017c56ae = ((((((4389) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8a3835e887b71ac149675392() {
  return __cxx_static_address_8a3835e887b71ac149675392.reference || (__cxx_static_address_8a3835e887b71ac149675392.reference = {
    __cReference: true,
    get value() { return PUKE____header_global_ba47668d017c56ae; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:748
export const DOORTILE23____header_global_ecf542b0d40cfe2c = ((((((4391) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_691867e2e5514670ebcc77c9() {
  return __cxx_static_address_691867e2e5514670ebcc77c9.reference || (__cxx_static_address_691867e2e5514670ebcc77c9.reference = {
    __cReference: true,
    get value() { return DOORTILE23____header_global_ecf542b0d40cfe2c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:749
export const SPEAKER____header_global_415accd6c9956591 = ((((((4397) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7c9547e2830572e96bed31ce() {
  return __cxx_static_address_7c9547e2830572e96bed31ce.reference || (__cxx_static_address_7c9547e2830572e96bed31ce.reference = {
    __cReference: true,
    get value() { return SPEAKER____header_global_415accd6c9956591; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:750
export const MAIL____header_global_9284db168c5fd9c0 = ((((((4410) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dc55a328c6ca660addd58b3d() {
  return __cxx_static_address_dc55a328c6ca660addd58b3d.reference || (__cxx_static_address_dc55a328c6ca660addd58b3d.reference = {
    __cReference: true,
    get value() { return MAIL____header_global_9284db168c5fd9c0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:751
export const HOTMEAT____header_global_25132de824c74f16 = ((((((4427) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5411c7d7c3fc085bc6d54acc() {
  return __cxx_static_address_5411c7d7c3fc085bc6d54acc.reference || (__cxx_static_address_5411c7d7c3fc085bc6d54acc.reference = {
    __cReference: true,
    get value() { return HOTMEAT____header_global_25132de824c74f16; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:752
export const TRIPODCAMERA____header_global_32bd90c6f8c520b3 = ((((((4444) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_88fe4bc318fa3060e72cdbbd() {
  return __cxx_static_address_88fe4bc318fa3060e72cdbbd.reference || (__cxx_static_address_88fe4bc318fa3060e72cdbbd.reference = {
    __cReference: true,
    get value() { return TRIPODCAMERA____header_global_32bd90c6f8c520b3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:753
export const PAPER____header_global_2ff29f512218a4d6 = ((((((4460) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_733bcfe79a98fe2ab374c0da() {
  return __cxx_static_address_733bcfe79a98fe2ab374c0da.reference || (__cxx_static_address_733bcfe79a98fe2ab374c0da.reference = {
    __cReference: true,
    get value() { return PAPER____header_global_2ff29f512218a4d6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:754
export const GENERICPOLE2____header_global_533bf6da4a006285 = ((((((4465) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1437f61e952076eb1c288f8a() {
  return __cxx_static_address_1437f61e952076eb1c288f8a.reference || (__cxx_static_address_1437f61e952076eb1c288f8a.reference = {
    __cReference: true,
    get value() { return GENERICPOLE2____header_global_533bf6da4a006285; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:755
export const XXXSTACY____header_global_4ca5599ddaf4b0f0 = ((((((4470) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_65343dbc079aa6be0d7b0a9b() {
  return __cxx_static_address_65343dbc079aa6be0d7b0a9b.reference || (__cxx_static_address_65343dbc079aa6be0d7b0a9b.reference = {
    __cReference: true,
    get value() { return XXXSTACY____header_global_4ca5599ddaf4b0f0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:756
export const LETTER____header_global_11a83518c061d29d = ((((((4502) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4953575189f77f3994bd6fb4() {
  return __cxx_static_address_4953575189f77f3994bd6fb4.reference || (__cxx_static_address_4953575189f77f3994bd6fb4.reference = {
    __cReference: true,
    get value() { return LETTER____header_global_11a83518c061d29d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:757
export const SIDEBOLT1____header_global_123c9dfb4ac5399a = ((((((4525) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_462d512eb95cad4535c19daf() {
  return __cxx_static_address_462d512eb95cad4535c19daf.reference || (__cxx_static_address_462d512eb95cad4535c19daf.reference = {
    __cReference: true,
    get value() { return SIDEBOLT1____header_global_123c9dfb4ac5399a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:758
export const FOODOBJECT16____header_global_3765f2592efa07c9 = ((((((4545) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_145410b09917fdbe1809b416() {
  return __cxx_static_address_145410b09917fdbe1809b416.reference || (__cxx_static_address_145410b09917fdbe1809b416.reference = {
    __cReference: true,
    get value() { return FOODOBJECT16____header_global_3765f2592efa07c9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:759
export const TAMPON____header_global_1497dc9c255ec8d1 = ((((((4557) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cf6c5546fd8f55727eff63f6() {
  return __cxx_static_address_cf6c5546fd8f55727eff63f6.reference || (__cxx_static_address_cf6c5546fd8f55727eff63f6.reference = {
    __cReference: true,
    get value() { return TAMPON____header_global_1497dc9c255ec8d1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:760
export const CANWITHSOMETHING2____header_global_9ab4110f6be1ce76 = ((((((4580) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_62ae2ef1f04246013c775d47() {
  return __cxx_static_address_62ae2ef1f04246013c775d47.reference || (__cxx_static_address_62ae2ef1f04246013c775d47.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING2____header_global_9ab4110f6be1ce76; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:761
export const CANWITHSOMETHING3____header_global_c66d6902236a54c7 = ((((((4581) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_26193b8986a1d03c048866c2() {
  return __cxx_static_address_26193b8986a1d03c048866c2.reference || (__cxx_static_address_26193b8986a1d03c048866c2.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING3____header_global_c66d6902236a54c7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:762
export const CANWITHSOMETHING4____header_global_1048438d34c418ec = ((((((4582) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_26e77cee4644818a442d5359() {
  return __cxx_static_address_26e77cee4644818a442d5359.reference || (__cxx_static_address_26e77cee4644818a442d5359.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING4____header_global_1048438d34c418ec; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:763
export const DOLPHIN1____header_global_31286b74dc141335 = ((((((4591) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bc5cc0346d5468b90d074f94() {
  return __cxx_static_address_bc5cc0346d5468b90d074f94.reference || (__cxx_static_address_bc5cc0346d5468b90d074f94.reference = {
    __cReference: true,
    get value() { return DOLPHIN1____header_global_31286b74dc141335; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:764
export const DOLPHIN2____header_global_acb18043b75de808 = ((((((4592) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f18c03a9fd5ebaae62076528() {
  return __cxx_static_address_f18c03a9fd5ebaae62076528.reference || (__cxx_static_address_f18c03a9fd5ebaae62076528.reference = {
    __cReference: true,
    get value() { return DOLPHIN2____header_global_acb18043b75de808; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:765
export const NEWBEAST____header_global_b8a0d800d660e8a8 = ((((((4610) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d482ba9e4ec7b0807f83f09a() {
  return __cxx_static_address_d482ba9e4ec7b0807f83f09a.reference || (__cxx_static_address_d482ba9e4ec7b0807f83f09a.reference = {
    __cReference: true,
    get value() { return NEWBEAST____header_global_b8a0d800d660e8a8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:766
export const NEWBEASTSTAYPUT____header_global_07eef6319186badb = ((((((4611) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a1c914d8bde98e52d0e2d106() {
  return __cxx_static_address_a1c914d8bde98e52d0e2d106.reference || (__cxx_static_address_a1c914d8bde98e52d0e2d106.reference = {
    __cReference: true,
    get value() { return NEWBEASTSTAYPUT____header_global_07eef6319186badb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:767
export const BOSS4____header_global_3dd404becf8a0511 = ((((((4740) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_790bd671ecab7c37631c2a15() {
  return __cxx_static_address_790bd671ecab7c37631c2a15.reference || (__cxx_static_address_790bd671ecab7c37631c2a15.reference = {
    __cReference: true,
    get value() { return BOSS4____header_global_3dd404becf8a0511; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:768
export const BOSS4STAYPUT____header_global_c6351905c585ca2a = ((((((4741) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_288ba5e9803ee7cee6ca1db1() {
  return __cxx_static_address_288ba5e9803ee7cee6ca1db1.reference || (__cxx_static_address_288ba5e9803ee7cee6ca1db1.reference = {
    __cReference: true,
    get value() { return BOSS4STAYPUT____header_global_c6351905c585ca2a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:769
export const FEM10____header_global_793caca632914a80 = ((((((4864) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3d4f67302b2437dd2c43b13a() {
  return __cxx_static_address_3d4f67302b2437dd2c43b13a.reference || (__cxx_static_address_3d4f67302b2437dd2c43b13a.reference = {
    __cReference: true,
    get value() { return FEM10____header_global_793caca632914a80; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:770
export const TOUGHGAL____header_global_5ea2f30dd1c3562d = ((((((4866) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_036dde77d037af3143052ceb() {
  return __cxx_static_address_036dde77d037af3143052ceb.reference || (__cxx_static_address_036dde77d037af3143052ceb.reference = {
    __cReference: true,
    get value() { return TOUGHGAL____header_global_5ea2f30dd1c3562d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:771
export const MAN____header_global_7b7aaabfd3f70709 = ((((((4871) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_143f60811c233400c595d0a3() {
  return __cxx_static_address_143f60811c233400c595d0a3.reference || (__cxx_static_address_143f60811c233400c595d0a3.reference = {
    __cReference: true,
    get value() { return MAN____header_global_7b7aaabfd3f70709; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:772
export const MAN2____header_global_9fac5a462166f81f = ((((((4872) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_25325dc8298414ce64f1f20d() {
  return __cxx_static_address_25325dc8298414ce64f1f20d.reference || (__cxx_static_address_25325dc8298414ce64f1f20d.reference = {
    __cReference: true,
    get value() { return MAN2____header_global_9fac5a462166f81f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:773
export const WOMAN____header_global_59be3af68dabce7f = ((((((4874) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d75c55016af4262094e6a1eb() {
  return __cxx_static_address_d75c55016af4262094e6a1eb.reference || (__cxx_static_address_d75c55016af4262094e6a1eb.reference = {
    __cReference: true,
    get value() { return WOMAN____header_global_59be3af68dabce7f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:774
export const NATURALLIGHTNING____header_global_f7216539ab28ecab = ((((((4890) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_07f6961e05343a103d2809fc() {
  return __cxx_static_address_07f6961e05343a103d2809fc.reference || (__cxx_static_address_07f6961e05343a103d2809fc.reference = {
    __cReference: true,
    get value() { return NATURALLIGHTNING____header_global_f7216539ab28ecab; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:775
export const WEATHERWARN____header_global_31b0885bfd67a813 = ((((((4893) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9cf89381f1e70a0001c5d20f() {
  return __cxx_static_address_9cf89381f1e70a0001c5d20f.reference || (__cxx_static_address_9cf89381f1e70a0001c5d20f.reference = {
    __cReference: true,
    get value() { return WEATHERWARN____header_global_31b0885bfd67a813; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:776
export const DUKETAG____header_global_3a67d93efc202c52 = ((((((4900) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9599559b6152578cbc92b366() {
  return __cxx_static_address_9599559b6152578cbc92b366.reference || (__cxx_static_address_9599559b6152578cbc92b366.reference = {
    __cReference: true,
    get value() { return DUKETAG____header_global_3a67d93efc202c52; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:777
export const SIGN1____header_global_a4e9d4059b0a4cbd = ((((((4909) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4c8bb30742dcfb4b9b5904d1() {
  return __cxx_static_address_4c8bb30742dcfb4b9b5904d1.reference || (__cxx_static_address_4c8bb30742dcfb4b9b5904d1.reference = {
    __cReference: true,
    get value() { return SIGN1____header_global_a4e9d4059b0a4cbd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:778
export const SIGN2____header_global_9a7296a609dafbe5 = ((((((4912) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a22de2f9a3ad6f13d22056d4() {
  return __cxx_static_address_a22de2f9a3ad6f13d22056d4.reference || (__cxx_static_address_a22de2f9a3ad6f13d22056d4.reference = {
    __cReference: true,
    get value() { return SIGN2____header_global_9a7296a609dafbe5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:779
export const JURYGUY____header_global_5493ffa4b045b827 = ((((((4943) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8f6a3289efc7cd83dc38bb63() {
  return __cxx_static_address_8f6a3289efc7cd83dc38bb63.reference || (__cxx_static_address_8f6a3289efc7cd83dc38bb63.reference = {
    __cReference: true,
    get value() { return JURYGUY____header_global_5493ffa4b045b827; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:780
export const WIDESCREENSTATUSBAR____header_global_5f89aabf8896671c = ((((((5120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6090f6660293bc5acd344e2c() {
  return __cxx_static_address_6090f6660293bc5acd344e2c.reference || (__cxx_static_address_6090f6660293bc5acd344e2c.reference = {
    __cReference: true,
    get value() { return WIDESCREENSTATUSBAR____header_global_5f89aabf8896671c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:781
export const RPGGUNWIDE____header_global_36a3f4f8f1072828 = ((((((5121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d3297beedcd463a2492764e7() {
  return __cxx_static_address_d3297beedcd463a2492764e7.reference || (__cxx_static_address_d3297beedcd463a2492764e7.reference = {
    __cReference: true,
    get value() { return RPGGUNWIDE____header_global_36a3f4f8f1072828; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:782
export const FIRSTGUNRELOADWIDE____header_global_3e6255d47352ed71 = ((((((5122) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cd3f4bf0bdc009600766db66() {
  return __cxx_static_address_cd3f4bf0bdc009600766db66.reference || (__cxx_static_address_cd3f4bf0bdc009600766db66.reference = {
    __cReference: true,
    get value() { return FIRSTGUNRELOADWIDE____header_global_3e6255d47352ed71; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:783
export const FREEZEWIDE____header_global_aa789e01a7e1164c = ((((((5123) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e0a24a8dc8064ca94b99db9f() {
  return __cxx_static_address_e0a24a8dc8064ca94b99db9f.reference || (__cxx_static_address_e0a24a8dc8064ca94b99db9f.reference = {
    __cReference: true,
    get value() { return FREEZEWIDE____header_global_aa789e01a7e1164c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:784
export const FREEZEFIREWIDE____header_global_8259b62c31ee5d4d = ((((((5124) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2361d0633c93a7c2d2e0cd6c() {
  return __cxx_static_address_2361d0633c93a7c2d2e0cd6c.reference || (__cxx_static_address_2361d0633c93a7c2d2e0cd6c.reference = {
    __cReference: true,
    get value() { return FREEZEFIREWIDE____header_global_8259b62c31ee5d4d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:785
export const SHRINKERWIDE____header_global_fa96f6d2dea178e2 = ((((((5127) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b9b51451a456359580e37ee0() {
  return __cxx_static_address_b9b51451a456359580e37ee0.reference || (__cxx_static_address_b9b51451a456359580e37ee0.reference = {
    __cReference: true,
    get value() { return SHRINKERWIDE____header_global_fa96f6d2dea178e2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:786
export const CRACKKNUCKLESWIDE____header_global_295740ae35e865d5 = ((((((5129) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f3c8ca461f039f99c0b22856() {
  return __cxx_static_address_f3c8ca461f039f99c0b22856.reference || (__cxx_static_address_f3c8ca461f039f99c0b22856.reference = {
    __cReference: true,
    get value() { return CRACKKNUCKLESWIDE____header_global_295740ae35e865d5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:787
export const FLAMETHROWERSPRITE____header_global_39c144660d01f6ff = ((((((5134) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d687fc06452ce6b79bda6cab() {
  return __cxx_static_address_d687fc06452ce6b79bda6cab.reference || (__cxx_static_address_d687fc06452ce6b79bda6cab.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERSPRITE____header_global_39c144660d01f6ff; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:788
export const FLAMETHROWERAMMO____header_global_28422d81d43882c7 = ((((((5135) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2e8a938548416af527c39fc4() {
  return __cxx_static_address_2e8a938548416af527c39fc4.reference || (__cxx_static_address_2e8a938548416af527c39fc4.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERAMMO____header_global_28422d81d43882c7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:789
export const FLAMETHROWER____header_global_819b29c38989a97d = ((((((5138) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4f902bf144d2879a2f706bc9() {
  return __cxx_static_address_4f902bf144d2879a2f706bc9.reference || (__cxx_static_address_4f902bf144d2879a2f706bc9.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER____header_global_819b29c38989a97d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:790
export const FLAMETHROWERFIRE____header_global_5751944e934d4c72 = ((((((5139) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_42beb0d996c92e782c44a378() {
  return __cxx_static_address_42beb0d996c92e782c44a378.reference || (__cxx_static_address_42beb0d996c92e782c44a378.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERFIRE____header_global_5751944e934d4c72; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:791
export const FLAMETHROWERFLAME____header_global_e850cb61ca64a0e2 = ((((((1891) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f34fad2cdf0f98881b5fd3e3() {
  return __cxx_static_address_f34fad2cdf0f98881b5fd3e3.reference || (__cxx_static_address_f34fad2cdf0f98881b5fd3e3.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERFLAME____header_global_e850cb61ca64a0e2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:792
export const FLAMETHROWERPILOT____header_global_bc6b4dfed434c6d8 = ((((((5174) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e464701c84a7b2e71c142134() {
  return __cxx_static_address_e464701c84a7b2e71c142134.reference || (__cxx_static_address_e464701c84a7b2e71c142134.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERPILOT____header_global_bc6b4dfed434c6d8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:793
export const FIREBALL____header_global_034484076263bd00 = ((((((5163) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bceed6d655ec9f45f5524c9d() {
  return __cxx_static_address_bceed6d655ec9f45f5524c9d.reference || (__cxx_static_address_bceed6d655ec9f45f5524c9d.reference = {
    __cReference: true,
    get value() { return FIREBALL____header_global_034484076263bd00; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:794
export const ONFIRE____header_global_1a11a30551ce6572 = ((((((5152) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1056e4efc693ec0503529f3d() {
  return __cxx_static_address_1056e4efc693ec0503529f3d.reference || (__cxx_static_address_1056e4efc693ec0503529f3d.reference = {
    __cReference: true,
    get value() { return ONFIRE____header_global_1a11a30551ce6572; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:795
export const ONFIRESMOKE____header_global_f8bc83ea3c49a73d = ((((((5143) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8a434bf2a5eeafd457a8992d() {
  return __cxx_static_address_8a434bf2a5eeafd457a8992d.reference || (__cxx_static_address_8a434bf2a5eeafd457a8992d.reference = {
    __cReference: true,
    get value() { return ONFIRESMOKE____header_global_f8bc83ea3c49a73d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:796
export const BURNEDCORPSE____header_global_b7ae92b3c3b07a34 = ((((((5173) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_290c87b4dc89110055373f1b() {
  return __cxx_static_address_290c87b4dc89110055373f1b.reference || (__cxx_static_address_290c87b4dc89110055373f1b.reference = {
    __cReference: true,
    get value() { return BURNEDCORPSE____header_global_b7ae92b3c3b07a34; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:797
export const WHISPYSMOKE____header_global_d59ef1bb6fed1d70 = ((((((5268) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_93bf1d80f4ff4d6d2611ad15() {
  return __cxx_static_address_93bf1d80f4ff4d6d2611ad15.reference || (__cxx_static_address_93bf1d80f4ff4d6d2611ad15.reference = {
    __cReference: true,
    get value() { return WHISPYSMOKE____header_global_d59ef1bb6fed1d70; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:798
export const FIREFLY____header_global_d1446e63ea56dbae = ((((((5180) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b46092bd874f516292822319() {
  return __cxx_static_address_b46092bd874f516292822319.reference || (__cxx_static_address_b46092bd874f516292822319.reference = {
    __cReference: true,
    get value() { return FIREFLY____header_global_d1446e63ea56dbae; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:799
export const FIREFLYSHRINKEFFECT____header_global_2118d8c3e2a7ec44 = ((((((5360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_701895983d3c0abb0e6f44e4() {
  return __cxx_static_address_701895983d3c0abb0e6f44e4.reference || (__cxx_static_address_701895983d3c0abb0e6f44e4.reference = {
    __cReference: true,
    get value() { return FIREFLYSHRINKEFFECT____header_global_2118d8c3e2a7ec44; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:800
export const FIREFLYGROWEFFECT____header_global_45b99cfcb787ec5c = ((((((5367) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_71705350558bb7f237b8e5b6() {
  return __cxx_static_address_71705350558bb7f237b8e5b6.reference || (__cxx_static_address_71705350558bb7f237b8e5b6.reference = {
    __cReference: true,
    get value() { return FIREFLYGROWEFFECT____header_global_45b99cfcb787ec5c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:801
export const FIREFLYFLYINGEFFECT____header_global_136f8d1e8e0f64a8 = ((((((5296) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b56b34026819414f7e67c950() {
  return __cxx_static_address_b56b34026819414f7e67c950.reference || (__cxx_static_address_b56b34026819414f7e67c950.reference = {
    __cReference: true,
    get value() { return FIREFLYFLYINGEFFECT____header_global_136f8d1e8e0f64a8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:802
export const BOSS5____header_global_85cdd052d66a11bf = ((((((5310) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d56fe6645270ba716918cd3c() {
  return __cxx_static_address_d56fe6645270ba716918cd3c.reference || (__cxx_static_address_d56fe6645270ba716918cd3c.reference = {
    __cReference: true,
    get value() { return BOSS5____header_global_85cdd052d66a11bf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:803
export const BOSS5STAYPUT____header_global_a60d483a69c746f7 = ((((((5311) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2804f49481294cf04a20059c() {
  return __cxx_static_address_2804f49481294cf04a20059c.reference || (__cxx_static_address_2804f49481294cf04a20059c.reference = {
    __cReference: true,
    get value() { return BOSS5STAYPUT____header_global_a60d483a69c746f7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:804
export const LAVAPOOL____header_global_5d817c5086fe2d54 = ((((((5304) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c0fbfb1c55414c77451ab0fd() {
  return __cxx_static_address_c0fbfb1c55414c77451ab0fd.reference || (__cxx_static_address_c0fbfb1c55414c77451ab0fd.reference = {
    __cReference: true,
    get value() { return LAVAPOOL____header_global_5d817c5086fe2d54; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:805
export const LAVASPLASH____header_global_95fc815c0aa7bcc4 = ((((((5371) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1c35d2288d0c7d350c1a63c7() {
  return __cxx_static_address_1c35d2288d0c7d350c1a63c7.reference || (__cxx_static_address_1c35d2288d0c7d350c1a63c7.reference = {
    __cReference: true,
    get value() { return LAVASPLASH____header_global_95fc815c0aa7bcc4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:806
export const LAVAPOOLBUBBLE____header_global_15f17cbdeb9b343d = ((((((5207) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6d4870c002812d475ce4c2b8() {
  return __cxx_static_address_6d4870c002812d475ce4c2b8.reference || (__cxx_static_address_6d4870c002812d475ce4c2b8.reference = {
    __cReference: true,
    get value() { return LAVAPOOLBUBBLE____header_global_15f17cbdeb9b343d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:807
export const BOSS2STAYPUT____header_global_dfeefa16e529cf7d = ((((((2711) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4baffb7b8b98328a64ccca7f() {
  return __cxx_static_address_4baffb7b8b98328a64ccca7f.reference || (__cxx_static_address_4baffb7b8b98328a64ccca7f.reference = {
    __cReference: true,
    get value() { return BOSS2STAYPUT____header_global_dfeefa16e529cf7d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:808
export const BOSS3STAYPUT____header_global_385f1a9142c98343 = ((((((2761) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ab46019e60bd628b78244cc5() {
  return __cxx_static_address_ab46019e60bd628b78244cc5.reference || (__cxx_static_address_ab46019e60bd628b78244cc5.reference = {
    __cReference: true,
    get value() { return BOSS3STAYPUT____header_global_385f1a9142c98343; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:809
export const E32_TILE5736____header_global_9537c6f34888e951 = ((((((5736) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8585261c55991719c0e0e6e8() {
  return __cxx_static_address_8585261c55991719c0e0e6e8.reference || (__cxx_static_address_8585261c55991719c0e0e6e8.reference = {
    __cReference: true,
    get value() { return E32_TILE5736____header_global_9537c6f34888e951; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:810
export const E32_TILE5737____header_global_2e76e58ac624fe9d = ((((((5737) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7e0705f335515b3ee20bf9b6() {
  return __cxx_static_address_7e0705f335515b3ee20bf9b6.reference || (__cxx_static_address_7e0705f335515b3ee20bf9b6.reference = {
    __cReference: true,
    get value() { return E32_TILE5737____header_global_2e76e58ac624fe9d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:811
export const E32_TILE5846____header_global_9458bcb3a89e97b4 = ((((((5846) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_203c75ea6e4e5260d0a16a58() {
  return __cxx_static_address_203c75ea6e4e5260d0a16a58.reference || (__cxx_static_address_203c75ea6e4e5260d0a16a58.reference = {
    __cReference: true,
    get value() { return E32_TILE5846____header_global_9458bcb3a89e97b4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/network.h:180
export const cSnapshotMemUsage__header_global_a1a8616714761da7 = u64((BigInt(u64(64)) * BigInt((BigInt((BigInt((BigInt(72) * BigInt(u64(16384)))) + BigInt((BigInt(96) * BigInt(u64(4096)))))) + BigInt((BigInt(296) * BigInt(u64(16384))))))));
function __cxx_static_address_1a296eab0b5ac6863c7b6e3c() {
  return __cxx_static_address_1a296eab0b5ac6863c7b6e3c.reference || (__cxx_static_address_1a296eab0b5ac6863c7b6e3c.reference = {
    __cReference: true,
    get value() { return cSnapshotMemUsage__header_global_a1a8616714761da7; },
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
        this.set(ticks, ((fraction) & 65535));
  }
  static __cxx_construct_24afc02e52dafee1(ticks, fraction) {
    const value=Object.create(ClockTicks__implementation.prototype);
    value.__cxx_construct_24afc02e52dafee1(ticks, fraction);
    return value;
  }
  getFraction() {
    return i64((BigInt((BigInt((BigInt(u64(this.ticksS32)) & BigInt(ClockTicks__implementation.FRACTION_MASK))) >> BigInt(16))) | BigInt(((this.ticksS32 < i64(0)) ? ClockTicks__implementation.VALUE_MASK : u64(0)))));
  }
  setFraction(fraction) {
    return i64((this.ticksS32 = i64((BigInt((BigInt(u64(this.ticksS32)) & BigInt(ClockTicks__implementation.WHOLE_MASK))) | BigInt((BigInt(((this.ticksS32 < i64(0)) ? (BigInt(u64((BigInt(i64(0)) - BigInt(i64(fraction))))) & BigInt(ClockTicks__implementation.FRACTION_16_MASK)) : u64(fraction))) << BigInt(16)))))));
  }
  set(ticks, fraction) {
    (this.ticksS32 = i64((BigInt((BigInt(u64(ticks)) << BigInt(32))) | BigInt((BigInt(((ticks < 0) ? (BigInt(u64((BigInt(i64(0)) - BigInt(i64(fraction))))) & BigInt(ClockTicks__implementation.FRACTION_16_MASK)) : u64(fraction))) << BigInt(16))))));
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
    (this.ticksS32 = i64((BigInt((BigInt((BigInt(this.ticksS32) >> BigInt(16))) * BigInt((BigInt(rhs.ticksS32) >> BigInt(16))))) >> BigInt(16))));
    this.update();
    return this;
  }
  __cxx_operator_8ed849f2ef870086(rhs) {
    (this.ticksS32 = i64((BigInt((BigInt(this.ticksS32) / BigInt(rhs.ticksS32))) << BigInt(32))));
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
    (this.wholeTicks = i32((BigInt(this.ticksS32) >> BigInt(32))));
    ((__cxx_lvalue_3) => (__cxx_lvalue_3.value = i64((BigInt(__cxx_lvalue_3.value) & BigInt(ClockTicks__implementation.VALUE_MASK)))))(cObjectFieldRef(this, "ticksS32"));
  }
});
}

// C/C++ source: source/build/include/screentext.h:143
export function TileFontPtr_t() {
  return TileFontPtr_t.type || (TileFontPtr_t.type = class TileFontPtr_t__implementation {
  constructor() {
    this.opaque = undefined;
  }
});
}

// C/C++ source: source/duke3d/src/screens.cpp:43
export let CrosshairColors = cMarkAggregate(({"r": ((255) & 255), "g": ((255) & 255), "b": ((255) & 255), "f": ((0) & 255)}));
export function __cxx_global_cell_d16777dd8cd77fdf0c735c4c() {
  return __cxx_global_cell_d16777dd8cd77fdf0c735c4c.reference || (__cxx_global_cell_d16777dd8cd77fdf0c735c4c.reference = {
    __cReference: true,
    get value() { return CrosshairColors; },
    set value(__cxx_lvalue_0) { throw new TypeError("record address cannot replace original object storage"); }
  });
}

// C/C++ source: source/duke3d/src/screens.cpp:44
export let DefaultCrosshairColors = cMarkAggregate(({"r": ((0) & 255), "g": ((0) & 255), "b": ((0) & 255), "f": ((0) & 255)}));
export function __cxx_global_cell_c7221fd6ffce6a41cc43a6f8() {
  return __cxx_global_cell_c7221fd6ffce6a41cc43a6f8.reference || (__cxx_global_cell_c7221fd6ffce6a41cc43a6f8.reference = {
    __cReference: true,
    get value() { return DefaultCrosshairColors; },
    set value(__cxx_lvalue_0) { throw new TypeError("record address cannot replace original object storage"); }
  });
}

// C/C++ source: source/duke3d/src/screens.cpp:45
export let g_crosshairSum = i32((-1));
export function __cxx_global_cell_b9224c19fd76cc2e0a63ab16() {
  return __cxx_global_cell_b9224c19fd76cc2e0a63ab16.reference || (__cxx_global_cell_b9224c19fd76cc2e0a63ab16.reference = {
    __cReference: true,
    get value() { return g_crosshairSum; },
    set value(__cxx_lvalue_0) { g_crosshairSum = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/screens.cpp:47
export let dr_yxaspect = 0;
export function __cxx_global_cell_774f6138099ef3f0e30c0e78() {
  return __cxx_global_cell_774f6138099ef3f0e30c0e78.reference || (__cxx_global_cell_774f6138099ef3f0e30c0e78.reference = {
    __cReference: true,
    get value() { return dr_yxaspect; },
    set value(__cxx_lvalue_0) { dr_yxaspect = i32(__cxx_lvalue_0); }
  });
}

export let dr_viewingrange = 0;
export function __cxx_global_cell_ce4831dc0b81ce7dbe358337() {
  return __cxx_global_cell_ce4831dc0b81ce7dbe358337.reference || (__cxx_global_cell_ce4831dc0b81ce7dbe358337.reference = {
    __cReference: true,
    get value() { return dr_viewingrange; },
    set value(__cxx_lvalue_0) { dr_viewingrange = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/screens.cpp:48
export let g_moveActorsTime = 0;
export function __cxx_global_cell_c3b16c9872ebe357ce2498e2() {
  return __cxx_global_cell_c3b16c9872ebe357ce2498e2.reference || (__cxx_global_cell_c3b16c9872ebe357ce2498e2.reference = {
    __cReference: true,
    get value() { return g_moveActorsTime; },
    set value(__cxx_lvalue_0) { g_moveActorsTime = __cxx_lvalue_0; }
  });
}

export let g_moveWorldTime = 0;
export function __cxx_global_cell_aa6c29b3c839ee027d586754() {
  return __cxx_global_cell_aa6c29b3c839ee027d586754.reference || (__cxx_global_cell_aa6c29b3c839ee027d586754.reference = {
    __cReference: true,
    get value() { return g_moveWorldTime; },
    set value(__cxx_lvalue_0) { g_moveWorldTime = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/build/include/fix16.h:31
export const FIX16_MAX__header_global_5e642cb1d9131bcb = i32(2147483647);
function __cxx_static_address_ab521444d78631e4e1ec5281() {
  return __cxx_static_address_ab521444d78631e4e1ec5281.reference || (__cxx_static_address_ab521444d78631e4e1ec5281.reference = {
    __cReference: true,
    get value() { return FIX16_MAX__header_global_5e642cb1d9131bcb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:32
export const FIX16_MIN__header_global_2d951cbcae1e7c13 = i32(2147483648);
function __cxx_static_address_c56e03f417de74e065f8c187() {
  return __cxx_static_address_c56e03f417de74e065f8c187.reference || (__cxx_static_address_c56e03f417de74e065f8c187.reference = {
    __cReference: true,
    get value() { return FIX16_MIN__header_global_2d951cbcae1e7c13; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:33
export const FIX16_OVERFLOW__header_global_e6b03e3963e0c73c = i32(2147483648);
function __cxx_static_address_74e43cd5554533c10aae5659() {
  return __cxx_static_address_74e43cd5554533c10aae5659.reference || (__cxx_static_address_74e43cd5554533c10aae5659.reference = {
    __cReference: true,
    get value() { return FIX16_OVERFLOW__header_global_e6b03e3963e0c73c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:35
export const fix16_one__header_global_7c933adea594f27c = i32(65536);
function __cxx_static_address_adfc7655d8a0b69ccd92d446() {
  return __cxx_static_address_adfc7655d8a0b69ccd92d446.reference || (__cxx_static_address_adfc7655d8a0b69ccd92d446.reference = {
    __cReference: true,
    get value() { return fix16_one__header_global_7c933adea594f27c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:36
export const fix16_half__header_global_d1b95ae64fd6728c = i32(32768);
function __cxx_static_address_b8be7a23e0be0aa6c9abcd37() {
  return __cxx_static_address_b8be7a23e0be0aa6c9abcd37.reference || (__cxx_static_address_b8be7a23e0be0aa6c9abcd37.reference = {
    __cReference: true,
    get value() { return fix16_half__header_global_d1b95ae64fd6728c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:37
export const flt_f161r__header_global_fb6835713db69b1d = Math.fround(Math.fround((Math.fround(1) / Math.fround(65536))));
function __cxx_static_address_4e04d8eef8fe19e9abcecd32() {
  return __cxx_static_address_4e04d8eef8fe19e9abcecd32.reference || (__cxx_static_address_4e04d8eef8fe19e9abcecd32.reference = {
    __cReference: true,
    get value() { return flt_f161r__header_global_fb6835713db69b1d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/screens.cpp:49
export let g_noLogoAnim = i32(0);
export function __cxx_global_cell_7aa233c4f71dccc72d0d0a82() {
  return __cxx_global_cell_7aa233c4f71dccc72d0d0a82.reference || (__cxx_global_cell_7aa233c4f71dccc72d0d0a82.reference = {
    __cReference: true,
    get value() { return g_noLogoAnim; },
    set value(__cxx_lvalue_0) { g_noLogoAnim = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/screens.cpp:50
export let g_noLogo = i32(0);
export function __cxx_global_cell_d47d33660ab59c48cbbd560e() {
  return __cxx_global_cell_d47d33660ab59c48cbbd560e.reference || (__cxx_global_cell_d47d33660ab59c48cbbd560e.reference = {
    __cReference: true,
    get value() { return g_noLogo; },
    set value(__cxx_lvalue_0) { g_noLogo = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/screens.cpp:632
export let g_spriteStat = cZeroAggregate({"record": {"lastgtic": {"scalar": "unsigned int"}, "lastnumins": {"scalar": "unsigned int"}, "numins": {"scalar": "unsigned int"}, "numonscreen": {"scalar": "int"}}});
export function __cxx_global_cell_1ff8f8e247e693994dd3e6ef() {
  return __cxx_global_cell_1ff8f8e247e693994dd3e6ef.reference || (__cxx_global_cell_1ff8f8e247e693994dd3e6ef.reference = {
    __cReference: true,
    get value() { return g_spriteStat; },
    set value(__cxx_lvalue_0) { throw new TypeError("record address cannot replace original object storage"); }
  });
}

// C/C++ source: source/build/include/compat.h:1169
export const pow2char__header_global_42c9ca1ec1ac2c93 = new Uint8Array([((1) & 255), ((2) & 255), ((4) & 255), ((8) & 255), ((16) & 255), ((32) & 255), ((64) & 255), ((128) & 255)]);
function __cxx_static_address_dc9e97aeea20bffeba762e4f() {
  return __cxx_static_address_dc9e97aeea20bffeba762e4f.reference || (__cxx_static_address_dc9e97aeea20bffeba762e4f.reference = {
    __cReference: true,
    get value() { return pow2char__header_global_42c9ca1ec1ac2c93; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:172
export const g_defaultVideoModes__header_global_feee3104e085d93c = [cMarkAggregate(({"x": 2560, "y": 1440})), cMarkAggregate(({"x": 2560, "y": 1200})), cMarkAggregate(({"x": 2560, "y": 1080})), cMarkAggregate(({"x": 1920, "y": 1440})), cMarkAggregate(({"x": 1920, "y": 1200})), cMarkAggregate(({"x": 1920, "y": 1080})), cMarkAggregate(({"x": 1680, "y": 1050})), cMarkAggregate(({"x": 1600, "y": 1200})), cMarkAggregate(({"x": 1600, "y": 900})), cMarkAggregate(({"x": 1366, "y": 768})), cMarkAggregate(({"x": 1280, "y": 1024})), cMarkAggregate(({"x": 1280, "y": 960})), cMarkAggregate(({"x": 1280, "y": 720})), cMarkAggregate(({"x": 1152, "y": 864})), cMarkAggregate(({"x": 1024, "y": 768})), cMarkAggregate(({"x": 1024, "y": 600})), cMarkAggregate(({"x": 800, "y": 600})), cMarkAggregate(({"x": 640, "y": 480})), cMarkAggregate(({"x": 640, "y": 400})), cMarkAggregate(({"x": 512, "y": 384})), cMarkAggregate(({"x": 480, "y": 360})), cMarkAggregate(({"x": 400, "y": 300})), cMarkAggregate(({"x": 320, "y": 240})), cMarkAggregate(({"x": 320, "y": 200})), cMarkAggregate(({"x": 0, "y": 0}))];
function __cxx_static_address_9a324ca8feba691d23a2b71e() {
  return __cxx_static_address_9a324ca8feba691d23a2b71e.reference || (__cxx_static_address_9a324ca8feba691d23a2b71e.reference = {
    __cReference: true,
    get value() { return g_defaultVideoModes__header_global_feee3104e085d93c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:188
export const g_keyAsciiTable__header_global_4899c1ce25dd0723 = new Uint8Array([((0) & 255), ((0) & 255), 49, 50, 51, 52, 53, 54, 55, 56, 57, 48, 45, 61, ((0) & 255), ((0) & 255), 113, 119, 101, 114, 116, 121, 117, 105, 111, 112, 91, 93, ((0) & 255), ((0) & 255), 97, 115, 100, 102, 103, 104, 106, 107, 108, 59, ((39) & 255), 96, ((0) & 255), ((92) & 255), 122, 120, 99, 118, 98, 110, 109, 44, 46, 47, ((0) & 255), 42, ((0) & 255), ((32) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), 55, 56, 57, 45, 52, 53, 54, 43, 49, 50, 51, 48, 46, ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255)]);
function __cxx_static_address_e2a4f358c951d1c09166cae5() {
  return __cxx_static_address_e2a4f358c951d1c09166cae5.reference || (__cxx_static_address_e2a4f358c951d1c09166cae5.reference = {
    __cReference: true,
    get value() { return g_keyAsciiTable__header_global_4899c1ce25dd0723; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:196
export const g_keyAsciiTableShift__header_global_a1acfb5e233cb2db = new Uint8Array([((0) & 255), ((0) & 255), 33, 64, 35, 36, 37, 94, 38, 42, 40, 41, 95, 43, ((0) & 255), ((0) & 255), 81, 87, 69, 82, 84, 89, 85, 73, 79, 80, 123, 125, ((0) & 255), ((0) & 255), 65, 83, 68, 70, 71, 72, 74, 75, 76, 58, 34, 126, ((0) & 255), 124, 90, 88, 67, 86, 66, 78, 77, 60, 62, 63, ((0) & 255), 42, ((0) & 255), ((32) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), 55, 56, 57, 45, 52, 53, 54, 43, 49, 50, 51, 48, 46, ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255)]);
function __cxx_static_address_f01d4ca58c9afc0b505a80be() {
  return __cxx_static_address_f01d4ca58c9afc0b505a80be.reference || (__cxx_static_address_f01d4ca58c9afc0b505a80be.reference = {
    __cReference: true,
    get value() { return g_keyAsciiTableShift__header_global_a1acfb5e233cb2db; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:895
export const pow2long__header_global_1f0ee2a67966a228 = new Int32Array([1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144, 524288, 1048576, 2097152, 4194304, 8388608, 16777216, 33554432, 67108864, 134217728, 268435456, 536870912, 1073741824, 2147483647]);
function __cxx_static_address_82fe404d0a0c043b5d1d9407() {
  return __cxx_static_address_82fe404d0a0c043b5d1d9407.reference || (__cxx_static_address_82fe404d0a0c043b5d1d9407.reference = {
    __cReference: true,
    get value() { return pow2long__header_global_1f0ee2a67966a228; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:907
export const pow2ulong__header_global_699c063a765d87e7 = new Uint32Array([u32(1), u32(2), u32(4), u32(8), u32(16), u32(32), u32(64), u32(128), u32(256), u32(512), u32(1024), u32(2048), u32(4096), u32(8192), u32(16384), u32(32768), u32(65536), u32(131072), u32(262144), u32(524288), u32(1048576), u32(2097152), u32(4194304), u32(8388608), u32(16777216), u32(33554432), u32(67108864), u32(134217728), u32(268435456), u32(536870912), u32(1073741824), u32(2147483648n)]);
function __cxx_static_address_6948a668177fffc1794b1873() {
  return __cxx_static_address_6948a668177fffc1794b1873.reference || (__cxx_static_address_6948a668177fffc1794b1873.reference = {
    __cReference: true,
    get value() { return pow2ulong__header_global_699c063a765d87e7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:919
export const pow264__header_global_f04d888ceacaa37f = new BigInt64Array([BigInt(i64(1)), BigInt(i64(2)), BigInt(i64(4)), BigInt(i64(8)), BigInt(i64(16)), BigInt(i64(32)), BigInt(i64(64)), BigInt(i64(128)), BigInt(i64(256)), BigInt(i64(512)), BigInt(i64(1024)), BigInt(i64(2048)), BigInt(i64(4096)), BigInt(i64(8192)), BigInt(i64(16384)), BigInt(i64(32768)), BigInt(i64(65536)), BigInt(i64(131072)), BigInt(i64(262144)), BigInt(i64(524288)), BigInt(i64(1048576)), BigInt(i64(2097152)), BigInt(i64(4194304)), BigInt(i64(8388608)), BigInt(i64(16777216)), BigInt(i64(33554432)), BigInt(i64(67108864)), BigInt(i64(134217728)), BigInt(i64(268435456)), BigInt(i64(536870912)), BigInt(i64(1073741824)), BigInt(2147483648n), BigInt(4294967296n), BigInt(8589934592n), BigInt(17179869184n), BigInt(34359738368n), BigInt(68719476736n), BigInt(137438953472n), BigInt(274877906944n), BigInt(549755813888n), BigInt(1099511627776n), BigInt(2199023255552n), BigInt(4398046511104n), BigInt(8796093022208n), BigInt(17592186044416n), BigInt(35184372088832n), BigInt(70368744177664n), BigInt(140737488355328n), BigInt(281474976710656n), BigInt(562949953421312n), BigInt(1125899906842624n), BigInt(2251799813685248n), BigInt(4503599627370496n), BigInt(9007199254740992n), BigInt(18014398509481984n), BigInt(36028797018963968n), BigInt(72057594037927936n), BigInt(144115188075855872n), BigInt(288230376151711744n), BigInt(576460752303423488n), BigInt(1152921504606846976n), BigInt(2305843009213693952n), BigInt(4611686018427387904n), BigInt(9223372036854775807n)]);
function __cxx_static_address_e1871e5c854e1be41430fcee() {
  return __cxx_static_address_e1871e5c854e1be41430fcee.reference || (__cxx_static_address_e1871e5c854e1be41430fcee.reference = {
    __cReference: true,
    get value() { return pow264__header_global_f04d888ceacaa37f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/screens.cpp:1079
export function videoGetRenderMode__header_0d776a793682() {
  return i32(0);
}

export function clamp__header_1ed923c91a30(__cxx_in, min, max) {
  return i32(((__cxx_in <= i32(min)) ? i32(min) : ((__cxx_in >= i32(max)) ? i32(max) : __cxx_in)));
}

export function clamp__header_36ccfd714bcb(__cxx_in, min, max) {
  return ((((i32(__cxx_in) <= i32(((((min) & 255)) & 255))) ? ((((min) & 255)) & 255) : ((i32(__cxx_in) >= i32(((((max) & 255)) & 255))) ? ((((max) & 255)) & 255) : __cxx_in))) & 255);
}

// C/C++ source: source/duke3d/src/screens.cpp:328
export function ksgn__header_08b3870a8b53(a) {
  return i32((i32((a > 0)) - i32((a < 0))));
}

// C/C++ source: source/duke3d/src/screens.cpp:42
export function fix16_to_int__header_896d36d84088(a) {
  return i32(Math.trunc(i32((a + ((a >= 0) ? fix16_half__header_global_d1b95ae64fd6728c : (-fix16_half__header_global_d1b95ae64fd6728c)))) / fix16_one__header_global_7c933adea594f27c));
}

// C/C++ source: source/duke3d/src/screens.cpp:1683
export function renderDisableFog__header_128271eadafa() {

}

export function bitmap_test__header_e7a5c842a067(ptr, n) {

  return Boolean((i32((i32((cDeref(cPointerOffset(ptr, i32((n >> 3)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & i32((cDeref(cPointerOffset(pow2char__header_global_42c9ca1ec1ac2c93, i32((n & 7)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))) == i32((cDeref(cPointerOffset(pow2char__header_global_42c9ca1ec1ac2c93, i32((n & 7)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value))));
}

// C/C++ source: source/duke3d/src/screens.cpp:1693
export function renderEnableFog__header_f24c3bc9c7c0() {

}

export function bitmap_set__header_236f942968a8(ptr, n) {

  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = (((__cxx_lvalue_0.value | i32((cDeref(cPointerOffset(pow2char__header_global_42c9ca1ec1ac2c93, i32((n & 7)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))) & 255)))(cDeref(cPointerOffset(ptr, i32((n >> 3)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array));
}

export function SILENCE_UNUSED__header_63469fd6c852(arg0, arg1) {

}

// C/C++ source: source/build/include/smmalloc.h:864
export function _sm_free(allocator, p) {
  return cRecordObject(allocator).Free(p);
}

// C/C++ source: source/build/include/smmalloc.h:859
export function _sm_malloc(allocator, bytesCount, alignment) {
  return cRecordObject(allocator).Alloc(bytesCount, alignment);
}

export function __cxx_operator_e3598b0077b4da36(lhs, rhs) {
  return cCopyTrivialClass(lhs.__cxx_operator_c4f1fab776aa8f78(rhs), ClockTicks(), ["wholeTicks", "ticksS32"]);
}

export function __cxx_operator_761c63d1e16e183f(lhs, rhs) {
  return cCopyTrivialClass(lhs.__cxx_operator_86b05ee676890126(rhs), ClockTicks(), ["wholeTicks", "ticksS32"]);
}

export function __cxx_operator_565aa0a1c7b59878(lhs, rhs) {
  return cCopyTrivialClass(lhs.__cxx_operator_1260acd8fbd617cf(rhs), ClockTicks(), ["wholeTicks", "ticksS32"]);
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

export function __cxx_operator_2bd212496e3ec90a(lhs, rhs) {
  return Boolean((!__cxx_operator_9d5bfff63c86ec9c(lhs, rhs)));
}

export function __cxx_operator_6d2a22ee5048dd1a(lhs, rhs) {
  return Boolean((!__cxx_operator_11a696315e969ab4(lhs, rhs)));
}
