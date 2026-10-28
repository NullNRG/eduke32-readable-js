// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/build/src/lz4.c
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
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


const clz64 = value => {let v=BigInt.asUintN(64,BigInt(value));if(v===0n)return 64;let n=0;while((v&(1n<<63n))===0n){v<<=1n;n++;}return n;};
const ctz64 = (value,width) => {let v=BigInt.asUintN(width,BigInt(value));if(v===0n)return width;let n=0;while((v&1n)===0n){v>>=1n;n++;}return n;};
const popcnt = value => {let v=value,n=0;while(v){v&=v-1n;n++;}return n;};

const __builtin_clz = x => Math.clz32(Number(x) >>> 0);
const __builtin_clzll = x => clz64(x);
const __builtin_ctz = x => ctz64(BigInt.asUintN(32,BigInt(x)),32);
const __builtin_ctzll = x => ctz64(x,64);
// C/C++ source: source/build/src/lz4.c:249
export const LZ4_minLength = i32((12 + 1));
function __cxx_static_address_bee375b0e5ce052ae6c14518() {
  return __cxx_static_address_bee375b0e5ce052ae6c14518.reference || (__cxx_static_address_bee375b0e5ce052ae6c14518.reference = {
    __cReference: true,
    get value() { return LZ4_minLength; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/lz4.c:292
export function LZ4_isAligned(ptr, alignment) {
  return i32(((BigInt(u64(ptr)) & BigInt((BigInt(alignment) - BigInt(u64(1))))) == u64(0)));
}

// C/C++ source: source/build/src/lz4.c:363
export function LZ4_isLittleEndian() {

  let one = cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"c": {"length": 4, "native": "Uint8Array", "offset": 0, "size": 4}, "u": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": true, "size": 4, "union": true}, {"u": u32(1)}, null, {});
  return u32((cDeref(cPointerOffset(one.c, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value));
}

// C/C++ source: source/build/src/lz4.c:393
export function LZ4_read16(ptr) {
  return (ptr).value.u16;
}

// C/C++ source: source/build/src/lz4.c:394
export function LZ4_read32(ptr) {
  return (ptr).value.u32;
}

// C/C++ source: source/build/src/lz4.c:395
export function LZ4_read_ARCH(ptr) {
  return (ptr).value.uArch;
}

// C/C++ source: source/build/src/lz4.c:397
export function LZ4_write16(memPtr, value) {
  ((memPtr).value.u16 = ((value) & 65535));
}

// C/C++ source: source/build/src/lz4.c:398
export function LZ4_write32(memPtr, value) {
  ((memPtr).value.u32 = u32(value));
}

// C/C++ source: source/build/src/lz4.c:430
export function LZ4_readLE16(memPtr) {
  if (Boolean(LZ4_isLittleEndian())) {
    return LZ4_read16(memPtr);
  } else {
    let p = cTypedPointer(memPtr, Uint8Array);
    return ((((i32((i32((((((cDeref(cPointerOffset(p, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 65535)) & 65535)) | i32((i32((cDeref(cPointerOffset(p, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) << 8))))) & 65535)) & 65535);
  }
}

// C/C++ source: source/build/src/lz4.c:452
export function LZ4_writeLE16(memPtr, value) {
  if (Boolean(LZ4_isLittleEndian())) {
    LZ4_write16(memPtr, value);
  } else {
    let p = cTypedPointer(memPtr, Uint8Array);
    ((cDeref(cPointerOffset(p, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = ((((((value) & 255)) & 255)) & 255));
    ((cDeref(cPointerOffset(p, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = ((((((i32((i32(value) >> 8))) & 255)) & 255)) & 255));
  }
}

// C/C++ source: source/build/src/lz4.c:465
export function LZ4_wildCopy8(dstPtr, srcPtr, dstEnd) {
  let d = cTypedPointer(dstPtr, Uint8Array);
  let s = cTypedPointer(srcPtr, Uint8Array);
  let e = cTypedPointer(dstEnd, Uint8Array);
  do {
    cByteMemory.memcpy(d, s, u64(8));
    (d = cPointerOffset(d, 8, Uint8Array.BYTES_PER_ELEMENT));
    (s = cPointerOffset(s, 8, Uint8Array.BYTES_PER_ELEMENT));
  } while (cPointerCompare(d, e, "<"));
}

// C/C++ source: source/build/src/lz4.c:474
export const inc32table = new Uint32Array([u32(0), u32(1), u32(2), u32(1), u32(0), u32(4), u32(4), u32(4)]);
function __cxx_static_address_f78572ce39d8f17ed1236330() {
  return __cxx_static_address_f78572ce39d8f17ed1236330.reference || (__cxx_static_address_f78572ce39d8f17ed1236330.reference = {
    __cReference: true,
    get value() { return inc32table; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/lz4.c:475
export const dec64table = new Int32Array([0, 0, 0, (-1), (-4), 1, 2, 3]);
function __cxx_static_address_8c16797373e68664dfc186f3() {
  return __cxx_static_address_8c16797373e68664dfc186f3.reference || (__cxx_static_address_8c16797373e68664dfc186f3.reference = {
    __cReference: true,
    get value() { return dec64table; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/lz4.c:496
export function LZ4_memcpy_using_offset_base(dstPtr, srcPtr, dstEnd, offset) {
  0;
  if ((offset < u64(8))) {
    LZ4_write32(dstPtr, u32(0));
    ((cDeref(cPointerOffset(dstPtr, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (((cDeref(cPointerOffset(srcPtr, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
    ((cDeref(cPointerOffset(dstPtr, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (((cDeref(cPointerOffset(srcPtr, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
    ((cDeref(cPointerOffset(dstPtr, 2, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (((cDeref(cPointerOffset(srcPtr, 2, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
    ((cDeref(cPointerOffset(dstPtr, 3, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (((cDeref(cPointerOffset(srcPtr, 3, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
    (srcPtr = cPointerOffset(srcPtr, (cDeref(cPointerOffset(inc32table, offset, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value), Uint8Array.BYTES_PER_ELEMENT));
    cByteMemory.memcpy(cPointerOffset(dstPtr, 4, Uint8Array.BYTES_PER_ELEMENT), srcPtr, u64(4));
    (srcPtr = cPointerOffset(srcPtr, -((cDeref(cPointerOffset(dec64table, offset, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)), Uint8Array.BYTES_PER_ELEMENT));
    (dstPtr = cPointerOffset(dstPtr, 8, Uint8Array.BYTES_PER_ELEMENT));
  } else {
    cByteMemory.memcpy(dstPtr, srcPtr, u64(8));
    (dstPtr = cPointerOffset(dstPtr, 8, Uint8Array.BYTES_PER_ELEMENT));
    (srcPtr = cPointerOffset(srcPtr, 8, Uint8Array.BYTES_PER_ELEMENT));
  }
  LZ4_wildCopy8(dstPtr, srcPtr, dstEnd);
}

// C/C++ source: source/build/src/lz4.c:522
export function LZ4_wildCopy32(dstPtr, srcPtr, dstEnd) {
  let d = cTypedPointer(dstPtr, Uint8Array);
  let s = cTypedPointer(srcPtr, Uint8Array);
  let e = cTypedPointer(dstEnd, Uint8Array);
  do {
    cByteMemory.memcpy(d, s, u64(16));
    cByteMemory.memcpy(cPointerOffset(d, 16, Uint8Array.BYTES_PER_ELEMENT), cPointerOffset(s, 16, Uint8Array.BYTES_PER_ELEMENT), u64(16));
    (d = cPointerOffset(d, 32, Uint8Array.BYTES_PER_ELEMENT));
    (s = cPointerOffset(s, 32, Uint8Array.BYTES_PER_ELEMENT));
  } while (cPointerCompare(d, e, "<"));
}

// C/C++ source: source/build/src/lz4.c:535
export function LZ4_memcpy_using_offset(dstPtr, srcPtr, dstEnd, offset) {
  let v = cZeroAggregate({"array": "Uint8Array", "dims": [8]});
  0;
  switch (offset) {
    case u64(1): {
      cByteMemory.memset(v, i32((cDeref(srcPtr, Uint8Array).value)), u64(8));
    }
    break;
    case u64(2): {
      cByteMemory.memcpy(v, srcPtr, u64(2));
    }
    cByteMemory.memcpy(cPointerOffset(v, 2, Uint8Array.BYTES_PER_ELEMENT), srcPtr, u64(2));
    cByteMemory.memcpy(cPointerOffset(v, 4, Uint8Array.BYTES_PER_ELEMENT), v, u64(4));
    break;
    case u64(4): {
      cByteMemory.memcpy(v, srcPtr, u64(4));
    }
    cByteMemory.memcpy(cPointerOffset(v, 4, Uint8Array.BYTES_PER_ELEMENT), srcPtr, u64(4));
    break;
    default: {
      LZ4_memcpy_using_offset_base(dstPtr, srcPtr, dstEnd, offset);
    }
    return;
  }
  cByteMemory.memcpy(dstPtr, v, u64(8));
  (dstPtr = cPointerOffset(dstPtr, 8, Uint8Array.BYTES_PER_ELEMENT));
  while (cPointerCompare(dstPtr, dstEnd, "<")) {
    cByteMemory.memcpy(dstPtr, v, u64(8));
    (dstPtr = cPointerOffset(dstPtr, 8, Uint8Array.BYTES_PER_ELEMENT));
  }
}

// C/C++ source: source/build/src/lz4.c:579
export function LZ4_NbCommonBytes(val) {
  0;
  if (Boolean(LZ4_isLittleEndian())) {
    if ((8 == u64(8))) {
      return u32((u32(__builtin_ctzll(u64(val))) >>> 3));
    } else {
      return u32((u32(__builtin_ctz(u32(val))) >>> 3));
    }
  } else {
    if ((8 == u64(8))) {
      return u32((u32(__builtin_clzll(u64(val))) >>> 3));
    } else {
      return u32((u32(__builtin_clz(u32(val))) >>> 3));
    }
  }
}

// C/C++ source: source/build/src/lz4.c:680
export function LZ4_count(pIn, pMatch, pInLimit) {
  let pStart = pIn;
  if (Boolean(i64((i32(cPointerCompare(pIn, cPointerOffset(pInLimit, -((BigInt(8) - BigInt(u64(1)))), Uint8Array.BYTES_PER_ELEMENT), "<")) != 0)))) {
    let diff = u64((BigInt(LZ4_read_ARCH(pMatch)) ^ BigInt(LZ4_read_ARCH(pIn))));
    if ((!Boolean(diff))) {
      (pIn = cPointerOffset(pIn, 8, Uint8Array.BYTES_PER_ELEMENT));
      (pMatch = cPointerOffset(pMatch, 8, Uint8Array.BYTES_PER_ELEMENT));
    } else {
      return u32(LZ4_NbCommonBytes(diff));
    }
  }
  while (Boolean(i64((i32(cPointerCompare(pIn, cPointerOffset(pInLimit, -((BigInt(8) - BigInt(u64(1)))), Uint8Array.BYTES_PER_ELEMENT), "<")) != 0)))) {
    let diff = u64((BigInt(LZ4_read_ARCH(pMatch)) ^ BigInt(LZ4_read_ARCH(pIn))));
    if ((!Boolean(diff))) {
      (pIn = cPointerOffset(pIn, 8, Uint8Array.BYTES_PER_ELEMENT));
      (pMatch = cPointerOffset(pMatch, 8, Uint8Array.BYTES_PER_ELEMENT));
      continue;
    }
    (pIn = cPointerOffset(pIn, LZ4_NbCommonBytes(diff), Uint8Array.BYTES_PER_ELEMENT));
    return u32(cPointerDiff(pIn, pStart, Uint8Array.BYTES_PER_ELEMENT));
  }
  if ((((8 == u64(8)) && cPointerCompare(pIn, cPointerOffset(pInLimit, -(3), Uint8Array.BYTES_PER_ELEMENT), "<")) && (LZ4_read32(pMatch) == LZ4_read32(pIn)))) {
    (pIn = cPointerOffset(pIn, 4, Uint8Array.BYTES_PER_ELEMENT));
    (pMatch = cPointerOffset(pMatch, 4, Uint8Array.BYTES_PER_ELEMENT));
  }
  if ((cPointerCompare(pIn, cPointerOffset(pInLimit, -(1), Uint8Array.BYTES_PER_ELEMENT), "<") && (i32(LZ4_read16(pMatch)) == i32(LZ4_read16(pIn))))) {
    (pIn = cPointerOffset(pIn, 2, Uint8Array.BYTES_PER_ELEMENT));
    (pMatch = cPointerOffset(pMatch, 2, Uint8Array.BYTES_PER_ELEMENT));
  }
  if ((cPointerCompare(pIn, pInLimit, "<") && (i32((cDeref(pMatch, Uint8Array).value)) == i32((cDeref(pIn, Uint8Array).value))))) {
    ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_0.value = next; return previous; })(cRef(() => pIn, __cxx_lvalue_1 => { pIn = __cxx_lvalue_1; }));
  }
  return u32(cPointerDiff(pIn, pStart, Uint8Array.BYTES_PER_ELEMENT));
}

// C/C++ source: source/build/src/lz4.c:710
export const LZ4_64Klimit = i32((i32(Math.imul(64, i32((1 << 10)))) + i32((12 - 1))));
function __cxx_static_address_6265b60f6ff3e7ae4c63dfd0() {
  return __cxx_static_address_6265b60f6ff3e7ae4c63dfd0.reference || (__cxx_static_address_6265b60f6ff3e7ae4c63dfd0.reference = {
    __cReference: true,
    get value() { return LZ4_64Klimit; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/lz4.c:711
export const LZ4_skipTrigger = u32(6);
function __cxx_static_address_2f0ce3b3a5b7700280faa244() {
  return __cxx_static_address_2f0ce3b3a5b7700280faa244.reference || (__cxx_static_address_2f0ce3b3a5b7700280faa244.reference = {
    __cReference: true,
    get value() { return LZ4_skipTrigger; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/lz4.c:749
export function LZ4_versionNumber() {
  return i32((i32((i32(Math.imul(i32(Math.imul(1, 100)), 100)) + i32(Math.imul(9, 100)))) + 5));
}

// C/C++ source: source/build/src/lz4.c:750
const __cxx_literal_e54bfa5cdf2ebf82424d = Uint8Array.from([49, 46, 57, 46, 53, 0]);
export function LZ4_versionString() {
  return __cxx_literal_e54bfa5cdf2ebf82424d;
}

// C/C++ source: source/build/src/lz4.c:751
export function LZ4_compressBound(isize) {
  return i32(((u32(isize) > u32(2113929216)) ? 0 : i32((i32((isize + Math.trunc(isize / 255))) + 16))));
}

// C/C++ source: source/build/src/lz4.c:752
export function LZ4_sizeofState() {
  return i32(16416);
}

// C/C++ source: source/build/src/lz4.c:777
export function LZ4_hash4(sequence, tableType) {
  if ((i32(tableType) == i32(3))) {
    return (u32(Math.imul(sequence, 2654435761)) >>> i32((i32(Math.imul(4, 8)) - i32((i32((14 - 2)) + 1)))));
  } else {
    return (u32(Math.imul(sequence, 2654435761)) >>> i32((i32(Math.imul(4, 8)) - i32((14 - 2)))));
  }
}

// C/C++ source: source/build/src/lz4.c:785
export function LZ4_hash5(sequence, tableType) {
  let hashLog = u32(((i32(tableType) == i32(3)) ? i32((i32((14 - 2)) + 1)) : i32((14 - 2))));
  if (Boolean(LZ4_isLittleEndian())) {
    let prime5bytes = u64(889523592379n);
    return u32((BigInt((BigInt((BigInt(sequence) << BigInt(24))) * BigInt(prime5bytes))) >> BigInt(u32((u32(64) - hashLog)))));
  } else {
    let prime8bytes = u64(11400714785074694791n);
    return u32((BigInt((BigInt((BigInt(sequence) >> BigInt(24))) * BigInt(prime8bytes))) >> BigInt(u32((u32(64) - hashLog)))));
  }
}

// C/C++ source: source/build/src/lz4.c:797
export function LZ4_hashPosition(p, tableType) {
  if (((8 == u64(8)) && (i32(tableType) != i32(3)))) {
    return LZ4_hash5(LZ4_read_ARCH(p), tableType);
  }
  return LZ4_hash4(LZ4_read32(p), tableType);
}

// C/C++ source: source/build/src/lz4.c:808
export function LZ4_clearHash(h, tableBase, tableType) {
  switch (i32(tableType)) {
    default:
    case i32(0): {
      0;
      return;
    }
    case i32(1): {
      let hashTable = tableBase;
      ((cPointerElementRef(hashTable, h).value) = null);
      return;
    }
    case i32(2): {
      let hashTable = cTypedPointer(tableBase, Uint32Array);
      ((cDeref(cPointerOffset(hashTable, h, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value) = u32(0));
      return;
    }
    case i32(3): {
      let hashTable = cTypedPointer(tableBase, Uint16Array);
      ((cDeref(cPointerOffset(hashTable, h, Uint16Array.BYTES_PER_ELEMENT), Uint16Array).value) = ((((0) & 65535)) & 65535));
      return;
    }
  }
}

// C/C++ source: source/build/src/lz4.c:820
export function LZ4_putIndexOnHash(idx, h, tableBase, tableType) {
  switch (i32(tableType)) {
    default:
    case i32(0):
    case i32(1): {
      0;
      return;
    }
    case i32(2): {
      let hashTable = cTypedPointer(tableBase, Uint32Array);
      ((cDeref(cPointerOffset(hashTable, h, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value) = u32(idx));
      return;
    }
    case i32(3): {
      let hashTable = cTypedPointer(tableBase, Uint16Array);
      0;
      ((cDeref(cPointerOffset(hashTable, h, Uint16Array.BYTES_PER_ELEMENT), Uint16Array).value) = ((((((idx) & 65535)) & 65535)) & 65535));
      return;
    }
  }
}

// C/C++ source: source/build/src/lz4.c:833
export function LZ4_putPositionOnHash(p, h, tableBase, tableType) {
  let hashTable = tableBase;
  0;
  tableType;
  ((cPointerElementRef(hashTable, h).value) = p);
}

// C/C++ source: source/build/src/lz4.c:841
export function LZ4_putPosition(p, tableBase, tableType) {
  let h = u32(LZ4_hashPosition(p, tableType));
  LZ4_putPositionOnHash(p, h, tableBase, tableType);
}

// C/C++ source: source/build/src/lz4.c:853
export function LZ4_getIndexOnHash(h, tableBase, tableType) {
  {

  }
  ;
  if ((i32(tableType) == i32(2))) {
    let hashTable = cTypedPointer(tableBase, Uint32Array);
    0;
    return (cDeref(cPointerOffset(hashTable, h, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value);
  }
  if ((i32(tableType) == i32(3))) {
    let hashTable = cTypedPointer(tableBase, Uint16Array);
    0;
    return u32((cDeref(cPointerOffset(hashTable, h, Uint16Array.BYTES_PER_ELEMENT), Uint16Array).value));
  }
  0;
  return u32(0);
}

// C/C++ source: source/build/src/lz4.c:869
export function LZ4_getPositionOnHash(h, tableBase, tableType) {
  0;
  tableType;
  {
    let hashTable = tableBase;
    return (cPointerElementRef(hashTable, h).value);
  }
}

// C/C++ source: source/build/src/lz4.c:876
export function LZ4_getPosition(p, tableBase, tableType) {
  let h = u32(LZ4_hashPosition(p, tableType));
  return LZ4_getPositionOnHash(h, tableBase, tableType);
}

// C/C++ source: source/build/src/lz4.c:884
export function LZ4_prepareTable(cctx, inputSize, tableType) {
  if ((i32(cRecordObject(cctx).tableType) != i32(0))) {
    0;
    if ((((((i32(cRecordObject(cctx).tableType) != i32(tableType)) || ((i32(tableType) == i32(3)) && (u32((cRecordObject(cctx).currentOffset + u32(inputSize))) >= 65535))) || ((i32(tableType) == i32(2)) && (cRecordObject(cctx).currentOffset > u32(Math.imul(u32(1), u32((1 << 30))))))) || (i32(tableType) == i32(1))) || (inputSize >= i32(Math.imul(4, i32((1 << 10))))))) {
      {

      }
      ;
      cByteMemory.memset(cRecordObject(cctx).hashTable, 0, u64(i32((1 << 14))));
      (cRecordObject(cctx).currentOffset = u32(0));
      (cRecordObject(cctx).tableType = u32(0));
    } else {
      {

      }
      ;
    }
  }
  if (((cRecordObject(cctx).currentOffset != u32(0)) && (i32(tableType) == i32(2)))) {
    {

    }
    ;
    ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = u32((Number(__cxx_lvalue_0.value) + Number(u32(i32(Math.imul(64, i32((1 << 10))))))))))(cObjectFieldRef(cRecordObject(cctx), "currentOffset"));
  }
  (cRecordObject(cctx).dictCtx = null);
  (cRecordObject(cctx).dictionary = null);
  (cRecordObject(cctx).dictSize = u32(0));
}

// C/C++ source: source/build/src/lz4.c:1542
export function LZ4_stream_t_alignment() {


  return u64((BigInt(16424) - BigInt(16416)));
}

// C/C++ source: source/build/src/lz4.c:1552
export function LZ4_initStream(buffer, size) {
  {

  }
  ;
  if (cPointerCompare(buffer, null, "==")) {
    return null;
  }
  if ((size < 16416)) {
    return null;
  }
  if ((!Boolean(LZ4_isAligned(buffer, LZ4_stream_t_alignment())))) {
    return null;
  }
  cByteMemory.memset(buffer, 0, 16416);
  return buffer;
}

// C/C++ source: source/build/src/lz4.c:1564
export function LZ4_resetStream(LZ4_stream) {
  {

  }
  ;
  cByteMemory.memset(LZ4_stream, 0, 16416);
}

// C/C++ source: source/build/src/lz4.c:1570
export function LZ4_resetStream_fast(ctx) {
  LZ4_prepareTable(cObjectFieldRef(cRecordObject(ctx), "internal_donotuse"), 0, 2);
}

// C/C++ source: source/build/src/lz4.c:1587
export function LZ4_loadDict_internal(LZ4_dict, dictionary, dictSize, _ld) {
  let dict = cObjectFieldRef(cRecordObject(LZ4_dict), "internal_donotuse");
  let tableType = 2;
  let p = cTypedPointer(dictionary, Uint8Array);
  let dictEnd = cPointerOffset(p, dictSize, Uint8Array.BYTES_PER_ELEMENT);
  let idx32;
  {

  }
  ;
  LZ4_resetStream(LZ4_dict);
  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = u32((Number(__cxx_lvalue_0.value) + Number(u32(i32(Math.imul(64, i32((1 << 10))))))))))(cObjectFieldRef(cRecordObject(dict), "currentOffset"));
  if ((dictSize < i32(8))) {
    return i32(0);
  }
  if ((cPointerDiff(dictEnd, p, Uint8Array.BYTES_PER_ELEMENT) > i64(i32(Math.imul(64, i32((1 << 10))))))) {
    (p = cPointerOffset(dictEnd, -(i32(Math.imul(64, i32((1 << 10))))), Uint8Array.BYTES_PER_ELEMENT));
  }
  (cRecordObject(dict).dictionary = p);
  (cRecordObject(dict).dictSize = u32(cPointerDiff(dictEnd, p, Uint8Array.BYTES_PER_ELEMENT)));
  (cRecordObject(dict).tableType = u32(tableType));
  (idx32 = u32((cRecordObject(dict).currentOffset - cRecordObject(dict).dictSize)));
  while (cPointerCompare(p, cPointerOffset(dictEnd, -(8), Uint8Array.BYTES_PER_ELEMENT), "<=")) {
    let h = u32(LZ4_hashPosition(p, tableType));
    LZ4_putIndexOnHash(idx32, h, cRecordObject(dict).hashTable, tableType);
    (p = cPointerOffset(p, 3, Uint8Array.BYTES_PER_ELEMENT));
    (idx32 = u32((Number(idx32) + Number(u32(3)))));
  }
  if ((i32(_ld) == i32(1))) {
    (p = cRecordObject(dict).dictionary);
    (idx32 = u32((cRecordObject(dict).currentOffset - cRecordObject(dict).dictSize)));
    while (cPointerCompare(p, cPointerOffset(dictEnd, -(8), Uint8Array.BYTES_PER_ELEMENT), "<=")) {
      let h = u32(LZ4_hashPosition(p, tableType));
      let limit = u32((cRecordObject(dict).currentOffset - u32(i32(Math.imul(64, i32((1 << 10)))))));
      if ((LZ4_getIndexOnHash(h, cRecordObject(dict).hashTable, tableType) <= limit)) {
        LZ4_putIndexOnHash(idx32, h, cRecordObject(dict).hashTable, tableType);
      }
      ((__cxx_lvalue_1) => { const previous = __cxx_lvalue_1.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_1.value = next; return previous; })(cRef(() => p, __cxx_lvalue_2 => { p = __cxx_lvalue_2; }));
      ((__cxx_lvalue_3) => { const previous = __cxx_lvalue_3.value; const next = u32((previous + 1)); __cxx_lvalue_3.value = next; return previous; })(cRef(() => idx32, __cxx_lvalue_4 => { idx32 = __cxx_lvalue_4; }));
    }
  }
  return i32(cRecordObject(dict).dictSize);
}

// C/C++ source: source/build/src/lz4.c:1648
export function LZ4_loadDict(LZ4_dict, dictionary, dictSize) {
  return i32(LZ4_loadDict_internal(LZ4_dict, dictionary, dictSize, 0));
}

// C/C++ source: source/build/src/lz4.c:1653
export function LZ4_loadDictSlow(LZ4_dict, dictionary, dictSize) {
  return i32(LZ4_loadDict_internal(LZ4_dict, dictionary, dictSize, 1));
}

// C/C++ source: source/build/src/lz4.c:1658
export function LZ4_attach_dictionary(workingStream, dictionaryStream) {
  let dictCtx = (cPointerCompare(dictionaryStream, null, "==") ? null : cObjectFieldRef(cRecordObject(dictionaryStream), "internal_donotuse"));
  {

  }
  ;
  if (cPointerCompare(dictCtx, null, "!=")) {
    if ((cRecordObject(workingStream).internal_donotuse.currentOffset == u32(0))) {
      (cRecordObject(workingStream).internal_donotuse.currentOffset = u32(i32(Math.imul(64, i32((1 << 10))))));
    }
    if ((cRecordObject(dictCtx).dictSize == u32(0))) {
      (dictCtx = null);
    }
  }
  (cRecordObject(workingStream).internal_donotuse.dictCtx = dictCtx);
}

// C/C++ source: source/build/src/lz4.c:1687
export function LZ4_renormDictT(LZ4_dict, nextSize) {
  0;
  if ((u32((cRecordObject(LZ4_dict).currentOffset + u32(nextSize))) > 2147483648)) {
    let delta = u32((cRecordObject(LZ4_dict).currentOffset - u32(i32(Math.imul(64, i32((1 << 10)))))));
    let dictEnd = cPointerOffset(cRecordObject(LZ4_dict).dictionary, cRecordObject(LZ4_dict).dictSize, Uint8Array.BYTES_PER_ELEMENT);
    let i;
    {

    }
    ;
    for ((i = i32(0)); (i < i32((1 << i32((14 - 2))))); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; }))) {
      if (((cDeref(cPointerOffset(cRecordObject(LZ4_dict).hashTable, i, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value) < delta)) {
        ((cDeref(cPointerOffset(cRecordObject(LZ4_dict).hashTable, i, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value) = u32(0));
      } else {
        ((__cxx_lvalue_2) => (__cxx_lvalue_2.value = u32((Number(__cxx_lvalue_2.value) - Number(delta)))))(cDeref(cPointerOffset(cRecordObject(LZ4_dict).hashTable, i, Uint32Array.BYTES_PER_ELEMENT), Uint32Array));
      }
    }
    (cRecordObject(LZ4_dict).currentOffset = u32(i32(Math.imul(64, i32((1 << 10))))));
    if ((cRecordObject(LZ4_dict).dictSize > u32(i32(Math.imul(64, i32((1 << 10))))))) {
      (cRecordObject(LZ4_dict).dictSize = u32(i32(Math.imul(64, i32((1 << 10))))));
    }
    (cRecordObject(LZ4_dict).dictionary = cPointerOffset(dictEnd, -(cRecordObject(LZ4_dict).dictSize), Uint8Array.BYTES_PER_ELEMENT));
  }
}

// C/C++ source: source/build/src/lz4.c:1814
export function LZ4_saveDict(LZ4_dict, safeBuffer, dictSize) {
  let dict = cObjectFieldRef(cRecordObject(LZ4_dict), "internal_donotuse");
  {

  }
  ;
  if ((u32(dictSize) > u32(i32(Math.imul(64, i32((1 << 10))))))) {
    (dictSize = i32(Math.imul(64, i32((1 << 10)))));
  }
  if ((u32(dictSize) > cRecordObject(dict).dictSize)) {
    (dictSize = i32(cRecordObject(dict).dictSize));
  }
  if (cPointerCompare(safeBuffer, null, "==")) {
    0;
  }
  if ((dictSize > 0)) {
    let previousDictEnd = cPointerOffset(cRecordObject(dict).dictionary, cRecordObject(dict).dictSize, Uint8Array.BYTES_PER_ELEMENT);
    0;
    cByteMemory.memmove(safeBuffer, cPointerOffset(previousDictEnd, -(dictSize), Uint8Array.BYTES_PER_ELEMENT), u64(dictSize));
  }
  (cRecordObject(dict).dictionary = cTypedPointer(safeBuffer, Uint8Array));
  (cRecordObject(dict).dictSize = u32(dictSize));
  return i32(dictSize);
}

// C/C++ source: source/build/src/lz4.c:1852
export function read_long_length_no_check(pp) {
  let b;
  let l = u64(0);
  do {
    (b = u64((cDeref((pp).value, Uint8Array).value)));
    ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_0.value = next; return previous; })(pp);
    (l = u64((BigInt(l) + BigInt(b))));
  } while ((b == u64(255)));
  {

  }
  return u64(l);
}

// C/C++ source: source/build/src/lz4.c:1870
export function LZ4_decompress_unsafe_generic(istart, ostart, decompressedSize, prefixSize, dictStart, dictSize) {
  let ip = istart;
  let op = cTypedPointer(ostart, Uint8Array);
  let oend = cPointerOffset(ostart, decompressedSize, Uint8Array.BYTES_PER_ELEMENT);
  let prefixStart = cPointerOffset(ostart, -(prefixSize), Uint8Array.BYTES_PER_ELEMENT);
  {

  }
  ;
  if (cPointerCompare(dictStart, null, "==")) {
    0;
  }
  while (Boolean(1)) {
    let token = u32((cDeref(((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_0.value = next; return previous; })(cRef(() => ip, __cxx_lvalue_1 => { ip = __cxx_lvalue_1; })), Uint8Array).value));
    {
      let ll = u64((token >>> 4));
      if ((ll == u64(15))) {
        (ll = u64((BigInt(ll) + BigInt(read_long_length_no_check(cRef(() => ip, __cxx_lvalue_2 => { ip = __cxx_lvalue_2; }))))));
      }
      if ((u64(cPointerDiff(oend, op, Uint8Array.BYTES_PER_ELEMENT)) < ll)) {
        return i32((-1));
      }
      cByteMemory.memmove(op, ip, ll);
      (op = cPointerOffset(op, ll, Uint8Array.BYTES_PER_ELEMENT));
      (ip = cPointerOffset(ip, ll, Uint8Array.BYTES_PER_ELEMENT));
      if ((u64(cPointerDiff(oend, op, Uint8Array.BYTES_PER_ELEMENT)) < u64(12))) {
        if (cPointerCompare(op, oend, "==")) {
          break;
        }
        {

        }
        ;
        return i32((-1));
      }
    }
    {
      let ml = u64(u32((token & u32(15))));
      let offset = u64(LZ4_readLE16(ip));
      (ip = cPointerOffset(ip, 2, Uint8Array.BYTES_PER_ELEMENT));
      if ((ml == u64(15))) {
        (ml = u64((BigInt(ml) + BigInt(read_long_length_no_check(cRef(() => ip, __cxx_lvalue_3 => { ip = __cxx_lvalue_3; }))))));
      }
      (ml = u64((BigInt(ml) + BigInt(u64(4)))));
      if ((u64(cPointerDiff(oend, op, Uint8Array.BYTES_PER_ELEMENT)) < ml)) {
        return i32((-1));
      }
      {
        let match = cPointerOffset(op, -(offset), Uint8Array.BYTES_PER_ELEMENT);
        if ((offset > (BigInt(u64(cPointerDiff(op, prefixStart, Uint8Array.BYTES_PER_ELEMENT))) + BigInt(dictSize)))) {
          {

          }
          ;
          return i32((-1));
        }
        if ((offset > u64(cPointerDiff(op, prefixStart, Uint8Array.BYTES_PER_ELEMENT)))) {
          let dictEnd = cPointerOffset(dictStart, dictSize, Uint8Array.BYTES_PER_ELEMENT);
          let extMatch = cPointerOffset(dictEnd, -((BigInt(offset) - BigInt(u64(cPointerDiff(op, prefixStart, Uint8Array.BYTES_PER_ELEMENT))))), Uint8Array.BYTES_PER_ELEMENT);
          let extml = u64(cPointerDiff(dictEnd, extMatch, Uint8Array.BYTES_PER_ELEMENT));
          if ((extml > ml)) {
            cByteMemory.memmove(op, extMatch, ml);
            (op = cPointerOffset(op, ml, Uint8Array.BYTES_PER_ELEMENT));
            (ml = u64(0));
          } else {
            cByteMemory.memmove(op, extMatch, extml);
            (op = cPointerOffset(op, extml, Uint8Array.BYTES_PER_ELEMENT));
            (ml = u64((BigInt(ml) - BigInt(extml))));
          }
          (match = prefixStart);
        }
        {
          let u;
          for ((u = u64(0)); (u < ml); ((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = u64((previous + 1n)); __cxx_lvalue_4.value = next; return previous; })(cRef(() => u, __cxx_lvalue_5 => { u = __cxx_lvalue_5; }))) {
            ((cDeref(cPointerOffset(op, u, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (((cDeref(cPointerOffset(match, u, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
          }
        }
      }
      (op = cPointerOffset(op, ml, Uint8Array.BYTES_PER_ELEMENT));
      if ((u64(cPointerDiff(oend, op, Uint8Array.BYTES_PER_ELEMENT)) < u64(5))) {
        {

        }
        ;
        return i32((-1));
      }
    }
  }
  return i32(cPointerDiff(ip, istart, Uint8Array.BYTES_PER_ELEMENT));
}

// C/C++ source: source/build/src/lz4.c:1977
export const rvl_error = u64((-1));
function __cxx_static_address_84124cb440a56a255d2d81a7() {
  return __cxx_static_address_84124cb440a56a255d2d81a7.reference || (__cxx_static_address_84124cb440a56a255d2d81a7.reference = {
    __cReference: true,
    get value() { return rvl_error; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/lz4.c:1979
export function read_variable_length(ip, ilimit, initial_check) {
  let s;
  let length = u64(0);
  0;
  0;
  0;
  if ((Boolean(initial_check) && Boolean(i64((i32(cPointerCompare((ip).value, ilimit, ">=")) != 0))))) {
    return rvl_error;
  }
  (s = u64((cDeref((ip).value, Uint8Array).value)));
  ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_0.value = next; return previous; })(ip);
  (length = u64((BigInt(length) + BigInt(s))));
  if (Boolean(i64((i32(cPointerCompare((ip).value, ilimit, ">")) != 0)))) {
    return rvl_error;
  }
  if (((8 < u64(8)) && Boolean(i64((i32((length > (BigInt(u64((-1))) / BigInt(u64(2))))) != 0))))) {
    return rvl_error;
  }
  if (Boolean(i64((i32((s != u64(255))) != 0)))) {
    return length;
  }
  do {
    (s = u64((cDeref((ip).value, Uint8Array).value)));
    ((__cxx_lvalue_1) => { const previous = __cxx_lvalue_1.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_1.value = next; return previous; })(ip);
    (length = u64((BigInt(length) + BigInt(s))));
    if (Boolean(i64((i32(cPointerCompare((ip).value, ilimit, ">")) != 0)))) {
      return rvl_error;
    }
    if (((8 < u64(8)) && Boolean(i64((i32((length > (BigInt(u64((-1))) / BigInt(u64(2))))) != 0))))) {
      return rvl_error;
    }
  } while ((s == u64(255)));
  return length;
}

// C/C++ source: source/build/src/lz4.c:2468
export function LZ4_decompress_fast(source, dest, originalSize) {
  {

  }
  ;
  return i32(LZ4_decompress_unsafe_generic(cTypedPointer(source, Uint8Array), cTypedPointer(dest, Uint8Array), originalSize, u64(0), null, u64(0)));
}

// C/C++ source: source/build/src/lz4.c:2496
export function LZ4_decompress_fast_withPrefix64k(source, dest, originalSize) {
  return i32(LZ4_decompress_unsafe_generic(cTypedPointer(source, Uint8Array), cTypedPointer(dest, Uint8Array), originalSize, u64(i32(Math.imul(64, i32((1 << 10))))), null, u64(0)));
}

// C/C++ source: source/build/src/lz4.c:2545
export function LZ4_decompress_fast_extDict(source, dest, originalSize, dictStart, dictSize) {
  return i32(LZ4_decompress_unsafe_generic(cTypedPointer(source, Uint8Array), cTypedPointer(dest, Uint8Array), originalSize, u64(0), cTypedPointer(dictStart, Uint8Array), dictSize));
}

// C/C++ source: source/build/src/lz4.c:2589
export function LZ4_setStreamDecode(LZ4_streamDecode, dictionary, dictSize) {
  let lz4sd = cObjectFieldRef(cRecordObject(LZ4_streamDecode), "internal_donotuse");
  (cRecordObject(lz4sd).prefixSize = u64(dictSize));
  if (Boolean(dictSize)) {
    0;
    (cRecordObject(lz4sd).prefixEnd = cPointerOffset(cTypedPointer(dictionary, Uint8Array), dictSize, Uint8Array.BYTES_PER_ELEMENT));
  } else {
    (cRecordObject(lz4sd).prefixEnd = cTypedPointer(dictionary, Uint8Array));
  }
  (cRecordObject(lz4sd).externalDict = null);
  (cRecordObject(lz4sd).extDictSize = u64(0));
  return i32(1);
}

// C/C++ source: source/build/src/lz4.c:2615
export function LZ4_decoderRingBufferSize(maxBlockSize) {
  if ((maxBlockSize < 0)) {
    return i32(0);
  }
  if ((maxBlockSize > 2113929216)) {
    return i32(0);
  }
  if ((maxBlockSize < 16)) {
    (maxBlockSize = i32(16));
  }
  return i32((i32((65536 + 14)) + maxBlockSize));
}

// C/C++ source: source/build/src/lz4.c:2671
export function LZ4_decompress_fast_continue(LZ4_streamDecode, source, dest, originalSize) {
  let lz4sd = (0, cObjectFieldRef(cRecordObject(LZ4_streamDecode), "internal_donotuse"));
  let result;
  {

  }
  ;
  0;
  if ((cRecordObject(lz4sd).prefixSize == u64(0))) {
    {

    }
    ;
    0;
    (result = i32(LZ4_decompress_fast(source, dest, originalSize)));
    if ((result <= 0)) {
      return i32(result);
    }
    (cRecordObject(lz4sd).prefixSize = u64(originalSize));
    (cRecordObject(lz4sd).prefixEnd = cPointerOffset(cTypedPointer(dest, Uint8Array), originalSize, Uint8Array.BYTES_PER_ELEMENT));
  } else {
    if (cPointerCompare(cRecordObject(lz4sd).prefixEnd, cTypedPointer(dest, Uint8Array), "==")) {
      {

      }
      ;
      (result = i32(LZ4_decompress_unsafe_generic(cTypedPointer(source, Uint8Array), cTypedPointer(dest, Uint8Array), originalSize, cRecordObject(lz4sd).prefixSize, cRecordObject(lz4sd).externalDict, cRecordObject(lz4sd).extDictSize)));
      if ((result <= 0)) {
        return i32(result);
      }
      ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = u64((BigInt(__cxx_lvalue_0.value) + BigInt(u64(originalSize))))))(cObjectFieldRef(cRecordObject(lz4sd), "prefixSize"));
      ((__cxx_lvalue_1) => (__cxx_lvalue_1.value = cPointerOffset(__cxx_lvalue_1.value, originalSize, Uint8Array.BYTES_PER_ELEMENT)))(cObjectFieldRef(cRecordObject(lz4sd), "prefixEnd"));
    } else {
      {

      }
      ;
      (cRecordObject(lz4sd).extDictSize = u64(cRecordObject(lz4sd).prefixSize));
      (cRecordObject(lz4sd).externalDict = cPointerOffset(cRecordObject(lz4sd).prefixEnd, -(cRecordObject(lz4sd).extDictSize), Uint8Array.BYTES_PER_ELEMENT));
      (result = i32(LZ4_decompress_fast_extDict(source, dest, originalSize, cRecordObject(lz4sd).externalDict, cRecordObject(lz4sd).extDictSize)));
      if ((result <= 0)) {
        return i32(result);
      }
      (cRecordObject(lz4sd).prefixSize = u64(originalSize));
      (cRecordObject(lz4sd).prefixEnd = cPointerOffset(cTypedPointer(dest, Uint8Array), originalSize, Uint8Array.BYTES_PER_ELEMENT));
    }
  }
  return i32(result);
}

// C/C++ source: source/build/src/lz4.c:2749
export function LZ4_decompress_fast_usingDict(source, dest, originalSize, dictStart, dictSize) {
  if (((dictSize == 0) || cPointerCompare(cPointerOffset(dictStart, dictSize, Uint8Array.BYTES_PER_ELEMENT), dest, "=="))) {
    return i32(LZ4_decompress_unsafe_generic(cTypedPointer(source, Uint8Array), cTypedPointer(dest, Uint8Array), originalSize, u64(dictSize), null, u64(0)));
  }
  0;
  return i32(LZ4_decompress_fast_extDict(source, dest, originalSize, dictStart, u64(dictSize)));
}

// C/C++ source: source/build/src/lz4.c:2795
export function LZ4_uncompress(source, dest, outputSize) {
  return i32(LZ4_decompress_fast(source, dest, outputSize));
}

// C/C++ source: source/build/src/lz4.c:2806
export function LZ4_sizeofStreamState() {
  return i32(16416);
}

// C/C++ source: source/build/src/lz4.c:2808
export function LZ4_resetStreamState(state, inputBuffer) {
  inputBuffer;
  LZ4_resetStream(state);
  return i32(0);
}

// C/C++ source: source/build/src/lz4.c:2823
export function LZ4_slideInputBuffer(state) {
  return cTypedPointer(u64(cRecordObject(state).internal_donotuse.dictionary), Uint8Array);
}
