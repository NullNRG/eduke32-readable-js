// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/build/src/kplib.cpp
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

// C/C++ source: source/build/include/fix16.h:111
export const fix16_rad_to_deg_mult__header_global_dd589d651dd16aed = i32(3754936);
function __cxx_static_address_df0de278a3c59b499550a215() {
  return __cxx_static_address_df0de278a3c59b499550a215.reference || (__cxx_static_address_df0de278a3c59b499550a215.reference = {
    __cReference: true,
    get value() { return fix16_rad_to_deg_mult__header_global_dd589d651dd16aed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:114
export const fix16_deg_to_rad_mult__header_global_49f0d20c2dca6292 = i32(1144);
function __cxx_static_address_365acf57861655745196cddc() {
  return __cxx_static_address_365acf57861655745196cddc.reference || (__cxx_static_address_365acf57861655745196cddc.reference = {
    __cReference: true,
    get value() { return fix16_deg_to_rad_mult__header_global_49f0d20c2dca6292; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/kplib.cpp:40
export function klrotl(i, sh) {
  return i32((i32((i >> (-sh))) | i32((i << sh))));
}

// C/C++ source: source/build/src/kplib.cpp:57
export let kp_frameplace = 0n;
function __cxx_static_address_aa9058e19fbcb0f313bf966e() {
  return __cxx_static_address_aa9058e19fbcb0f313bf966e.reference || (__cxx_static_address_aa9058e19fbcb0f313bf966e.reference = {
    __cReference: true,
    get value() { return kp_frameplace; },
    set value(__cxx_lvalue_0) { kp_frameplace = i64(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/kplib.cpp:58
export let kp_bytesperline = 0;
function __cxx_static_address_2cc7af37d8316f277973d69d() {
  return __cxx_static_address_2cc7af37d8316f277973d69d.reference || (__cxx_static_address_2cc7af37d8316f277973d69d.reference = {
    __cReference: true,
    get value() { return kp_bytesperline; },
    set value(__cxx_lvalue_0) { kp_bytesperline = i32(__cxx_lvalue_0); }
  });
}

export let kp_xres = 0;
function __cxx_static_address_4a3aa4f1e59b84a6f47a8d3f() {
  return __cxx_static_address_4a3aa4f1e59b84a6f47a8d3f.reference || (__cxx_static_address_4a3aa4f1e59b84a6f47a8d3f.reference = {
    __cReference: true,
    get value() { return kp_xres; },
    set value(__cxx_lvalue_0) { kp_xres = i32(__cxx_lvalue_0); }
  });
}

export let kp_yres = 0;
function __cxx_static_address_9beff426ee0521384f277d04() {
  return __cxx_static_address_9beff426ee0521384f277d04.reference || (__cxx_static_address_9beff426ee0521384f277d04.reference = {
    __cReference: true,
    get value() { return kp_yres; },
    set value(__cxx_lvalue_0) { kp_yres = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/kplib.cpp:60
export const pow2mask = new Int32Array([0, 1, 3, 7, 15, 31, 63, 127, 255, 511, 1023, 2047, 4095, 8191, 16383, 32767, 65535, 131071, 262143, 524287, 1048575, 2097151, 4194303, 8388607, 16777215, 33554431, 67108863, 134217727, 268435455, 536870911, 1073741823, 2147483647]);
function __cxx_static_address_db77747fd97e714584d2217b() {
  return __cxx_static_address_db77747fd97e714584d2217b.reference || (__cxx_static_address_db77747fd97e714584d2217b.reference = {
    __cReference: true,
    get value() { return pow2mask; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/kplib.cpp:71
export const pow2long = new Int32Array([1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144, 524288, 1048576, 2097152, 4194304, 8388608, 16777216, 33554432, 67108864, 134217728, 268435456, 536870912, 1073741824, i32(2147483648)]);
function __cxx_static_address_89ede466f067784cc19f00d2() {
  return __cxx_static_address_89ede466f067784cc19f00d2.reference || (__cxx_static_address_89ede466f067784cc19f00d2.reference = {
    __cReference: true,
    get value() { return pow2long; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/kplib.cpp:86
export let zipfilmode = 0;
function __cxx_static_address_84b58697e1377ebb6589640f() {
  return __cxx_static_address_84b58697e1377ebb6589640f.reference || (__cxx_static_address_84b58697e1377ebb6589640f.reference = {
    __cReference: true,
    get value() { return zipfilmode; },
    set value(__cxx_lvalue_0) { zipfilmode = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/kplib.cpp:87
export let kzfs = cZeroAggregate({"record": {"bfinal": {"scalar": "int"}, "compleng": {"scalar": "int"}, "comptell": {"scalar": "int"}, "comptyp": {"scalar": "int"}, "endpos": {"scalar": "int"}, "fil": {"pointer": true}, "i": {"scalar": "int"}, "jmpplc": {"scalar": "int"}, "leng": {"scalar": "int"}, "pos": {"scalar": "int"}, "seek0": {"scalar": "int"}}});
export function __cxx_global_cell_0c0d9a71eef382369e188fb4() {
  return __cxx_global_cell_0c0d9a71eef382369e188fb4.reference || (__cxx_global_cell_0c0d9a71eef382369e188fb4.reference = {
    __cReference: true,
    get value() { return kzfs; },
    set value(__cxx_lvalue_0) { throw new TypeError("record address cannot replace original object storage"); }
  });
}

// C/C++ source: source/build/src/kplib.cpp:108
export let palcol = new Int32Array(256);
function __cxx_static_address_abb9d4c9f889cbe37f43f79a() {
  return __cxx_static_address_abb9d4c9f889cbe37f43f79a.reference || (__cxx_static_address_abb9d4c9f889cbe37f43f79a.reference = {
    __cReference: true,
    get value() { return palcol; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/kplib.cpp:109
export let paleng = 0;
function __cxx_static_address_7474954c0b4cbc7822f97ecb() {
  return __cxx_static_address_7474954c0b4cbc7822f97ecb.reference || (__cxx_static_address_7474954c0b4cbc7822f97ecb.reference = {
    __cReference: true,
    get value() { return paleng; },
    set value(__cxx_lvalue_0) { paleng = i32(__cxx_lvalue_0); }
  });
}

export let bakcol = 0;
function __cxx_static_address_42b0e83725da16d589c74876() {
  return __cxx_static_address_42b0e83725da16d589c74876.reference || (__cxx_static_address_42b0e83725da16d589c74876.reference = {
    __cReference: true,
    get value() { return bakcol; },
    set value(__cxx_lvalue_0) { bakcol = i32(__cxx_lvalue_0); }
  });
}

export let numhufblocks = 0;
function __cxx_static_address_0680712895ed2a96bfc9eea6() {
  return __cxx_static_address_0680712895ed2a96bfc9eea6.reference || (__cxx_static_address_0680712895ed2a96bfc9eea6.reference = {
    __cReference: true,
    get value() { return numhufblocks; },
    set value(__cxx_lvalue_0) { numhufblocks = i32(__cxx_lvalue_0); }
  });
}

export let zlibcompflags = 0;
function __cxx_static_address_b06566e62c00f716167daaea() {
  return __cxx_static_address_b06566e62c00f716167daaea.reference || (__cxx_static_address_b06566e62c00f716167daaea.reference = {
    __cReference: true,
    get value() { return zlibcompflags; },
    set value(__cxx_lvalue_0) { zlibcompflags = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/kplib.cpp:110
export let kcoltype = 0;
function __cxx_static_address_8eb99a37935b399f54f5ade9() {
  return __cxx_static_address_8eb99a37935b399f54f5ade9.reference || (__cxx_static_address_8eb99a37935b399f54f5ade9.reference = {
    __cReference: true,
    get value() { return kcoltype; },
    set value(__cxx_lvalue_0) { kcoltype = (((__cxx_lvalue_0) << 24) >> 24); }
  });
}

export let filtype = 0;
function __cxx_static_address_7335388bc40819ffb70d8c50() {
  return __cxx_static_address_7335388bc40819ffb70d8c50.reference || (__cxx_static_address_7335388bc40819ffb70d8c50.reference = {
    __cReference: true,
    get value() { return filtype; },
    set value(__cxx_lvalue_0) { filtype = (((__cxx_lvalue_0) << 24) >> 24); }
  });
}

export let bitdepth = 0;
function __cxx_static_address_dc0c53b0b0987a1252c52e39() {
  return __cxx_static_address_dc0c53b0b0987a1252c52e39.reference || (__cxx_static_address_dc0c53b0b0987a1252c52e39.reference = {
    __cReference: true,
    get value() { return bitdepth; },
    set value(__cxx_lvalue_0) { bitdepth = (((__cxx_lvalue_0) << 24) >> 24); }
  });
}

// C/C++ source: source/build/src/kplib.cpp:123
export let bakr = i32(128);
function __cxx_static_address_a03aea8a2e93335a33286665() {
  return __cxx_static_address_a03aea8a2e93335a33286665.reference || (__cxx_static_address_a03aea8a2e93335a33286665.reference = {
    __cReference: true,
    get value() { return bakr; },
    set value(__cxx_lvalue_0) { bakr = i32(__cxx_lvalue_0); }
  });
}

export let bakg = i32(128);
function __cxx_static_address_912432260f9f60491d6aaf54() {
  return __cxx_static_address_912432260f9f60491d6aaf54.reference || (__cxx_static_address_912432260f9f60491d6aaf54.reference = {
    __cReference: true,
    get value() { return bakg; },
    set value(__cxx_lvalue_0) { bakg = i32(__cxx_lvalue_0); }
  });
}

export let bakb = i32(128);
function __cxx_static_address_d65fc33cba52df605eefdcf9() {
  return __cxx_static_address_d65fc33cba52df605eefdcf9.reference || (__cxx_static_address_d65fc33cba52df605eefdcf9.reference = {
    __cReference: true,
    get value() { return bakb; },
    set value(__cxx_lvalue_0) { bakb = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/kplib.cpp:124
export let gslidew = i32(0);
function __cxx_static_address_19fba13327f490e0c98ebd37() {
  return __cxx_static_address_19fba13327f490e0c98ebd37.reference || (__cxx_static_address_19fba13327f490e0c98ebd37.reference = {
    __cReference: true,
    get value() { return gslidew; },
    set value(__cxx_lvalue_0) { gslidew = i32(__cxx_lvalue_0); }
  });
}

export let gslider = i32(0);
function __cxx_static_address_57a5d28f57b8e3415c7b14e5() {
  return __cxx_static_address_57a5d28f57b8e3415c7b14e5.reference || (__cxx_static_address_57a5d28f57b8e3415c7b14e5.reference = {
    __cReference: true,
    get value() { return gslider; },
    set value(__cxx_lvalue_0) { gslider = i32(__cxx_lvalue_0); }
  });
}

export let xm = 0;
function __cxx_static_address_a4a36844d745091ca3c2714a() {
  return __cxx_static_address_a4a36844d745091ca3c2714a.reference || (__cxx_static_address_a4a36844d745091ca3c2714a.reference = {
    __cReference: true,
    get value() { return xm; },
    set value(__cxx_lvalue_0) { xm = i32(__cxx_lvalue_0); }
  });
}

export let xmn = new Int32Array(4);
function __cxx_static_address_bbb012d26ca6a35449bd8f01() {
  return __cxx_static_address_bbb012d26ca6a35449bd8f01.reference || (__cxx_static_address_bbb012d26ca6a35449bd8f01.reference = {
    __cReference: true,
    get value() { return xmn; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export let xr0 = 0;
function __cxx_static_address_eb788de64cb93c7f56597b86() {
  return __cxx_static_address_eb788de64cb93c7f56597b86.reference || (__cxx_static_address_eb788de64cb93c7f56597b86.reference = {
    __cReference: true,
    get value() { return xr0; },
    set value(__cxx_lvalue_0) { xr0 = i32(__cxx_lvalue_0); }
  });
}

export let xr1 = 0;
function __cxx_static_address_46cb85d5a04766d0635ecfc3() {
  return __cxx_static_address_46cb85d5a04766d0635ecfc3.reference || (__cxx_static_address_46cb85d5a04766d0635ecfc3.reference = {
    __cReference: true,
    get value() { return xr1; },
    set value(__cxx_lvalue_0) { xr1 = i32(__cxx_lvalue_0); }
  });
}

export let xplc = 0;
function __cxx_static_address_58655bc654cd90bf184d8756() {
  return __cxx_static_address_58655bc654cd90bf184d8756.reference || (__cxx_static_address_58655bc654cd90bf184d8756.reference = {
    __cReference: true,
    get value() { return xplc; },
    set value(__cxx_lvalue_0) { xplc = i32(__cxx_lvalue_0); }
  });
}

export let yplc = 0;
function __cxx_static_address_acafa6719cf860e283a235ed() {
  return __cxx_static_address_acafa6719cf860e283a235ed.reference || (__cxx_static_address_acafa6719cf860e283a235ed.reference = {
    __cReference: true,
    get value() { return yplc; },
    set value(__cxx_lvalue_0) { yplc = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/kplib.cpp:125
export let nfplace = 0n;
function __cxx_static_address_0eb7df977bc7da9c1e4ac613() {
  return __cxx_static_address_0eb7df977bc7da9c1e4ac613.reference || (__cxx_static_address_0eb7df977bc7da9c1e4ac613.reference = {
    __cReference: true,
    get value() { return nfplace; },
    set value(__cxx_lvalue_0) { nfplace = i64(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/kplib.cpp:126
export let clen = new Int32Array(320);
function __cxx_static_address_439d0ebacabacbc4bb46f782() {
  return __cxx_static_address_439d0ebacabacbc4bb46f782.reference || (__cxx_static_address_439d0ebacabacbc4bb46f782.reference = {
    __cReference: true,
    get value() { return clen; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export let cclen = new Int32Array(19);
function __cxx_static_address_73f971a45117b405bae691bf() {
  return __cxx_static_address_73f971a45117b405bae691bf.reference || (__cxx_static_address_73f971a45117b405bae691bf.reference = {
    __cReference: true,
    get value() { return cclen; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export let bitpos = 0;
function __cxx_static_address_b26e6394b97f66d1fd62bd8c() {
  return __cxx_static_address_b26e6394b97f66d1fd62bd8c.reference || (__cxx_static_address_b26e6394b97f66d1fd62bd8c.reference = {
    __cReference: true,
    get value() { return bitpos; },
    set value(__cxx_lvalue_0) { bitpos = i32(__cxx_lvalue_0); }
  });
}

export let filt = 0;
function __cxx_static_address_c335b0edd5f95393c742a026() {
  return __cxx_static_address_c335b0edd5f95393c742a026.reference || (__cxx_static_address_c335b0edd5f95393c742a026.reference = {
    __cReference: true,
    get value() { return filt; },
    set value(__cxx_lvalue_0) { filt = i32(__cxx_lvalue_0); }
  });
}

export let xsiz = 0;
function __cxx_static_address_cd33825ec36b5b3a2a2a3517() {
  return __cxx_static_address_cd33825ec36b5b3a2a2a3517.reference || (__cxx_static_address_cd33825ec36b5b3a2a2a3517.reference = {
    __cReference: true,
    get value() { return xsiz; },
    set value(__cxx_lvalue_0) { xsiz = i32(__cxx_lvalue_0); }
  });
}

export let ysiz = 0;
function __cxx_static_address_4fa7bed9e2d7aaef3d1713c1() {
  return __cxx_static_address_4fa7bed9e2d7aaef3d1713c1.reference || (__cxx_static_address_4fa7bed9e2d7aaef3d1713c1.reference = {
    __cReference: true,
    get value() { return ysiz; },
    set value(__cxx_lvalue_0) { ysiz = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/kplib.cpp:127
export let xsizbpl = 0;
export function __cxx_global_cell_a229cb194672fefc7d370552() {
  return __cxx_global_cell_a229cb194672fefc7d370552.reference || (__cxx_global_cell_a229cb194672fefc7d370552.reference = {
    __cReference: true,
    get value() { return xsizbpl; },
    set value(__cxx_lvalue_0) { xsizbpl = i32(__cxx_lvalue_0); }
  });
}

export let ixsiz = 0;
export function __cxx_global_cell_3ebbc8ed534bff5f19d52bab() {
  return __cxx_global_cell_3ebbc8ed534bff5f19d52bab.reference || (__cxx_global_cell_3ebbc8ed534bff5f19d52bab.reference = {
    __cReference: true,
    get value() { return ixsiz; },
    set value(__cxx_lvalue_0) { ixsiz = i32(__cxx_lvalue_0); }
  });
}

export let ixoff = 0;
export function __cxx_global_cell_64b6397cf8750fb99cc9a086() {
  return __cxx_global_cell_64b6397cf8750fb99cc9a086.reference || (__cxx_global_cell_64b6397cf8750fb99cc9a086.reference = {
    __cReference: true,
    get value() { return ixoff; },
    set value(__cxx_lvalue_0) { ixoff = i32(__cxx_lvalue_0); }
  });
}

export let iyoff = 0;
export function __cxx_global_cell_1241fd28b9c332f87290381c() {
  return __cxx_global_cell_1241fd28b9c332f87290381c.reference || (__cxx_global_cell_1241fd28b9c332f87290381c.reference = {
    __cReference: true,
    get value() { return iyoff; },
    set value(__cxx_lvalue_0) { iyoff = i32(__cxx_lvalue_0); }
  });
}

export let ixstp = 0;
export function __cxx_global_cell_8f65c64e61176127370a62c6() {
  return __cxx_global_cell_8f65c64e61176127370a62c6.reference || (__cxx_global_cell_8f65c64e61176127370a62c6.reference = {
    __cReference: true,
    get value() { return ixstp; },
    set value(__cxx_lvalue_0) { ixstp = i32(__cxx_lvalue_0); }
  });
}

export let iystp = 0;
export function __cxx_global_cell_f3c1ad3fdef391eb83499b8c() {
  return __cxx_global_cell_f3c1ad3fdef391eb83499b8c.reference || (__cxx_global_cell_f3c1ad3fdef391eb83499b8c.reference = {
    __cReference: true,
    get value() { return iystp; },
    set value(__cxx_lvalue_0) { iystp = i32(__cxx_lvalue_0); }
  });
}

export let intlac = 0;
export function __cxx_global_cell_7935786d12910cda8910768f() {
  return __cxx_global_cell_7935786d12910cda8910768f.reference || (__cxx_global_cell_7935786d12910cda8910768f.reference = {
    __cReference: true,
    get value() { return intlac; },
    set value(__cxx_lvalue_0) { intlac = i32(__cxx_lvalue_0); }
  });
}

export let nbpl = 0;
export function __cxx_global_cell_d5e30f187c99e9da61258a1a() {
  return __cxx_global_cell_d5e30f187c99e9da61258a1a.reference || (__cxx_global_cell_d5e30f187c99e9da61258a1a.reference = {
    __cReference: true,
    get value() { return nbpl; },
    set value(__cxx_lvalue_0) { nbpl = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/kplib.cpp:129
export let ccind = new Int32Array([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
function __cxx_static_address_258736156e619bfc312178fd() {
  return __cxx_static_address_258736156e619bfc312178fd.reference || (__cxx_static_address_258736156e619bfc312178fd.reference = {
    __cReference: true,
    get value() { return ccind; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/kplib.cpp:130
export let hxbit = Array.from({ length: 59 }, () => new Int32Array(2));
function __cxx_static_address_44e9d131024042d9f1569617() {
  return __cxx_static_address_44e9d131024042d9f1569617.reference || (__cxx_static_address_44e9d131024042d9f1569617.reference = {
    __cReference: true,
    get value() { return hxbit; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export let ibuf0 = new Int32Array(288);
function __cxx_static_address_5156c579fa7a8389c264632c() {
  return __cxx_static_address_5156c579fa7a8389c264632c.reference || (__cxx_static_address_5156c579fa7a8389c264632c.reference = {
    __cReference: true,
    get value() { return ibuf0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export let nbuf0 = new Int32Array(32);
function __cxx_static_address_2a654032177c315b4aec897b() {
  return __cxx_static_address_2a654032177c315b4aec897b.reference || (__cxx_static_address_2a654032177c315b4aec897b.reference = {
    __cReference: true,
    get value() { return nbuf0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export let ibuf1 = new Int32Array(32);
function __cxx_static_address_3927a84e1afc8dfb325bad43() {
  return __cxx_static_address_3927a84e1afc8dfb325bad43.reference || (__cxx_static_address_3927a84e1afc8dfb325bad43.reference = {
    __cReference: true,
    get value() { return ibuf1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export let nbuf1 = new Int32Array(32);
function __cxx_static_address_00edfc6e9ac95cacc45ca40e() {
  return __cxx_static_address_00edfc6e9ac95cacc45ca40e.reference || (__cxx_static_address_00edfc6e9ac95cacc45ca40e.reference = {
    __cReference: true,
    get value() { return nbuf1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/kplib.cpp:131
export let filptr = null;
function __cxx_static_address_3dab0cd39cd715da7cf79ad8() {
  return __cxx_static_address_3dab0cd39cd715da7cf79ad8.reference || (__cxx_static_address_3dab0cd39cd715da7cf79ad8.reference = {
    __cReference: true,
    get value() { return filptr; },
    set value(__cxx_lvalue_0) { filptr = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/build/src/kplib.cpp:132
export let slidebuf = new Uint8Array(32768);
function __cxx_static_address_fd8146c0023b762cfb4928be() {
  return __cxx_static_address_fd8146c0023b762cfb4928be.reference || (__cxx_static_address_fd8146c0023b762cfb4928be.reference = {
    __cReference: true,
    get value() { return slidebuf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export let opixbuf0 = new Uint8Array(4);
function __cxx_static_address_30c3020854ebf0677052a095() {
  return __cxx_static_address_30c3020854ebf0677052a095.reference || (__cxx_static_address_30c3020854ebf0677052a095.reference = {
    __cReference: true,
    get value() { return opixbuf0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export let opixbuf1 = new Uint8Array(4);
function __cxx_static_address_c0d14c7a36260d8c9e084978() {
  return __cxx_static_address_c0d14c7a36260d8c9e084978.reference || (__cxx_static_address_c0d14c7a36260d8c9e084978.reference = {
    __cReference: true,
    get value() { return opixbuf1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/kplib.cpp:133
export let pnginited = ((((0) & 255)) & 255);
function __cxx_static_address_515ab30648dd91d600d1cf94() {
  return __cxx_static_address_515ab30648dd91d600d1cf94.reference || (__cxx_static_address_515ab30648dd91d600d1cf94.reference = {
    __cReference: true,
    get value() { return pnginited; },
    set value(__cxx_lvalue_0) { pnginited = ((__cxx_lvalue_0) & 255); }
  });
}

// C/C++ source: source/build/src/kplib.cpp:134
export let olinbuf = new Uint8Array(131072);
function __cxx_static_address_cb0af6faa2121464215cdde3() {
  return __cxx_static_address_cb0af6faa2121464215cdde3.reference || (__cxx_static_address_cb0af6faa2121464215cdde3.reference = {
    __cReference: true,
    get value() { return olinbuf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:31
export const FIX16_MAX__header_global_9e4ae9fe1fbe18f7 = i32(2147483647);
function __cxx_static_address_9355e88b90a0545d6f537583() {
  return __cxx_static_address_9355e88b90a0545d6f537583.reference || (__cxx_static_address_9355e88b90a0545d6f537583.reference = {
    __cReference: true,
    get value() { return FIX16_MAX__header_global_9e4ae9fe1fbe18f7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:32
export const FIX16_MIN__header_global_cbd114d175704fe4 = i32(2147483648);
function __cxx_static_address_105dc1da94b6a370ee7f751b() {
  return __cxx_static_address_105dc1da94b6a370ee7f751b.reference || (__cxx_static_address_105dc1da94b6a370ee7f751b.reference = {
    __cReference: true,
    get value() { return FIX16_MIN__header_global_cbd114d175704fe4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:33
export const FIX16_OVERFLOW__header_global_d03d8d49df115f88 = i32(2147483648);
function __cxx_static_address_8bc858501464b531988df99a() {
  return __cxx_static_address_8bc858501464b531988df99a.reference || (__cxx_static_address_8bc858501464b531988df99a.reference = {
    __cReference: true,
    get value() { return FIX16_OVERFLOW__header_global_d03d8d49df115f88; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:35
export const fix16_one__header_global_3baf29cace4caa4b = i32(65536);
function __cxx_static_address_551685a455c92a649a9a8fef() {
  return __cxx_static_address_551685a455c92a649a9a8fef.reference || (__cxx_static_address_551685a455c92a649a9a8fef.reference = {
    __cReference: true,
    get value() { return fix16_one__header_global_3baf29cace4caa4b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:36
export const fix16_half__header_global_3255a961c9d37148 = i32(32768);
function __cxx_static_address_e1712c4b79aaa1fb1280f555() {
  return __cxx_static_address_e1712c4b79aaa1fb1280f555.reference || (__cxx_static_address_e1712c4b79aaa1fb1280f555.reference = {
    __cReference: true,
    get value() { return fix16_half__header_global_3255a961c9d37148; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:37
export const flt_f161r__header_global_d9c7d7f2518316ce = Math.fround(Math.fround((Math.fround(1) / Math.fround(65536))));
function __cxx_static_address_7279ff2227745f9e8d60ca4b() {
  return __cxx_static_address_7279ff2227745f9e8d60ca4b.reference || (__cxx_static_address_7279ff2227745f9e8d60ca4b.reference = {
    __cReference: true,
    get value() { return flt_f161r__header_global_d9c7d7f2518316ce; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/kplib.cpp:135
export let abstab10 = new Int32Array(1024);
function __cxx_static_address_733ac70fd95c3367b90983c8() {
  return __cxx_static_address_733ac70fd95c3367b90983c8.reference || (__cxx_static_address_733ac70fd95c3367b90983c8.reference = {
    __cReference: true,
    get value() { return abstab10; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/kplib.cpp:140
export let qhufval0 = new Int32Array(512);
function __cxx_static_address_23f9e1083f5f338d4e2b34d7() {
  return __cxx_static_address_23f9e1083f5f338d4e2b34d7.reference || (__cxx_static_address_23f9e1083f5f338d4e2b34d7.reference = {
    __cReference: true,
    get value() { return qhufval0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export let qhufval1 = new Int32Array(64);
function __cxx_static_address_a53b89e0c4766998f8de8a84() {
  return __cxx_static_address_a53b89e0c4766998f8de8a84.reference || (__cxx_static_address_a53b89e0c4766998f8de8a84.reference = {
    __cReference: true,
    get value() { return qhufval1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/kplib.cpp:141
export let qhufbit0 = new Uint8Array(512);
function __cxx_static_address_efafaac33827fb77a02fa134() {
  return __cxx_static_address_efafaac33827fb77a02fa134.reference || (__cxx_static_address_efafaac33827fb77a02fa134.reference = {
    __cReference: true,
    get value() { return qhufbit0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export let qhufbit1 = new Uint8Array(64);
function __cxx_static_address_f4b438f749a364d46c61198d() {
  return __cxx_static_address_f4b438f749a364d46c61198d.reference || (__cxx_static_address_f4b438f749a364d46c61198d.reference = {
    __cReference: true,
    get value() { return qhufbit1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/kplib.cpp:172
export function bitrev(b, c) {
  let i;
  let j;
  for ((((i = i32(1)), (j = i32(0))), (c = i32((1 << c)))); (i < c); (i = i32((Number(i) + Number(i))))) {
    (j = i32((Number(j) + Number(j))));
    if (Boolean(i32((b & i)))) {
      ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => j, __cxx_lvalue_1 => { j = __cxx_lvalue_1; }));
    }
  }
  return i32(j);
}

// C/C++ source: source/build/src/kplib.cpp:181
export let fakebuf = new Uint8Array(8);
function __cxx_static_address_e0bf579ec89757a16ed9f5aa() {
  return __cxx_static_address_e0bf579ec89757a16ed9f5aa.reference || (__cxx_static_address_e0bf579ec89757a16ed9f5aa.reference = {
    __cReference: true,
    get value() { return fakebuf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/kplib.cpp:182
export let nfilptr = null;
function __cxx_static_address_c0d33cac26996e1d4a46f3d9() {
  return __cxx_static_address_c0d33cac26996e1d4a46f3d9.reference || (__cxx_static_address_c0d33cac26996e1d4a46f3d9.reference = {
    __cReference: true,
    get value() { return nfilptr; },
    set value(__cxx_lvalue_0) { nfilptr = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/build/src/kplib.cpp:183
export let nbitpos = 0;
function __cxx_static_address_f5e103d64e5ebff54019b0d0() {
  return __cxx_static_address_f5e103d64e5ebff54019b0d0.reference || (__cxx_static_address_f5e103d64e5ebff54019b0d0.reference = {
    __cReference: true,
    get value() { return nbitpos; },
    set value(__cxx_lvalue_0) { nbitpos = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/kplib.cpp:217
export function peekbits(n) {
  return i32(u32(((B_PASS32__header_8a7178a88765(B_UNBUF32__header_c1468ac058f1(cPointerOffset(filptr, i32((bitpos >> 3)), Uint8Array.BYTES_PER_ELEMENT))) >>> i32((bitpos & 7))) & u32((cDeref(cPointerOffset(pow2mask, n, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)))));
}

// C/C++ source: source/build/src/kplib.cpp:241
export function qhufgencode(hitab, hbmax, qhval, qhbit, numbits) {
  let i;
  let j;
  let k;
  let n;
  let r;
  (i = i32((r = i32(0))));
  for ((n = i32(1)); (n <= numbits); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => n, __cxx_lvalue_1 => { n = __cxx_lvalue_1; }))) {
    for ((k = i32((cDeref(cPointerOffset(hbmax, i32((n - 1)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value))); (k < (cDeref(cPointerOffset(hbmax, n, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)); ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i32((previous + 1)); __cxx_lvalue_2.value = next; return previous; })(cRef(() => k, __cxx_lvalue_3 => { k = __cxx_lvalue_3; }))) {
      for ((j = i32((i + (cDeref(cPointerOffset(pow2mask, i32((numbits - n)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value)))); (i <= j); ((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = i32((previous + 1)); __cxx_lvalue_4.value = next; return previous; })(cRef(() => i, __cxx_lvalue_5 => { i = __cxx_lvalue_5; }))) {
        (r = i32(bitrev(i, numbits)));
        ((cDeref(cPointerOffset(qhval, r, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((cDeref(cPointerOffset(hitab, k, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
        ((cDeref(cPointerOffset(qhbit, r, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = ((((((n) & 255)) & 255)) & 255));
      }
    }
  }
  for ((j = i32((cDeref(cPointerOffset(pow2mask, numbits, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))); (i <= j); ((__cxx_lvalue_6) => { const previous = __cxx_lvalue_6.value; const next = i32((previous + 1)); __cxx_lvalue_6.value = next; return previous; })(cRef(() => i, __cxx_lvalue_7 => { i = __cxx_lvalue_7; }))) {
    (r = i32(bitrev(i, numbits)));
    ((cDeref(cPointerOffset(qhbit, r, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = ((((0) & 255)) & 255));
  }
}

// C/C++ source: source/build/src/kplib.cpp:289
export function hufgencode(inbuf, inum, hitab, hbmax) {
  let i;
  let tbuf = cZeroAggregate({"array": "Int32Array", "dims": [31]});
  let tbufptr;
  let hbmaxptr;
  cByteMemory.memset(tbuf, 0, 124);
  for ((i = i32((inum - 1))); (i >= 0); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous - 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; }))) {
    ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i32((previous + 1)); __cxx_lvalue_2.value = next; return previous; })(cDeref(cPointerOffset(tbuf, (cDeref(cPointerOffset(inbuf, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value), Int32Array.BYTES_PER_ELEMENT), Int32Array));
  }
  ((cDeref(cPointerOffset(tbuf, 0, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(((cDeref(cPointerOffset(hbmax, 0, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(0))));
  for ((i = i32(0)); (i < 28); (i = i32((Number(i) + Number(4))))) {
    (tbufptr = cPointerOffset(tbuf, i, Int32Array.BYTES_PER_ELEMENT));
    (hbmaxptr = cPointerOffset(hbmax, i, Int32Array.BYTES_PER_ELEMENT));
    ((cDeref(cPointerOffset(hbmaxptr, 1, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(((cDeref(hbmaxptr, Int32Array).value) + (cDeref(tbufptr, Int32Array).value))));
    ((cDeref(cPointerOffset(hbmaxptr, 2, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(((cDeref(cPointerOffset(hbmaxptr, 1, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) + (cDeref(cPointerOffset(tbufptr, 1, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))));
    ((cDeref(cPointerOffset(hbmaxptr, 3, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(((cDeref(cPointerOffset(hbmaxptr, 2, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) + (cDeref(cPointerOffset(tbufptr, 2, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))));
    ((cDeref(cPointerOffset(hbmaxptr, 4, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(((cDeref(cPointerOffset(hbmaxptr, 3, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) + (cDeref(cPointerOffset(tbufptr, 3, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))));
  }
  (tbufptr = cPointerOffset(tbuf, i, Int32Array.BYTES_PER_ELEMENT));
  (hbmaxptr = cPointerOffset(hbmax, i, Int32Array.BYTES_PER_ELEMENT));
  ((cDeref(cPointerOffset(hbmaxptr, 1, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(((cDeref(hbmaxptr, Int32Array).value) + (cDeref(tbufptr, Int32Array).value))));
  ((cDeref(cPointerOffset(hbmaxptr, 2, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(((cDeref(cPointerOffset(hbmaxptr, 1, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) + (cDeref(cPointerOffset(tbufptr, 1, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))));
  ((cDeref(cPointerOffset(hbmaxptr, 3, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(((cDeref(cPointerOffset(hbmaxptr, 2, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) + (cDeref(cPointerOffset(tbufptr, 2, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))));
  for ((i = i32(0)); (i < inum); ((__cxx_lvalue_3) => { const previous = __cxx_lvalue_3.value; const next = i32((previous + 1)); __cxx_lvalue_3.value = next; return previous; })(cRef(() => i, __cxx_lvalue_4 => { i = __cxx_lvalue_4; }))) {
    if (Boolean((cDeref(cPointerOffset(inbuf, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))) {
      ((cDeref(cPointerOffset(hitab, ((__cxx_lvalue_5) => { const previous = __cxx_lvalue_5.value; const next = i32((previous + 1)); __cxx_lvalue_5.value = next; return previous; })(cDeref(cPointerOffset(hbmax, (cDeref(cPointerOffset(inbuf, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value), Int32Array.BYTES_PER_ELEMENT), Int32Array)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(i));
    }
  }
}

// C/C++ source: source/build/src/kplib.cpp:550
export function Paeth686(a, b, c) {
  let ptr = cPointerOffset(abstab10, i32((i32((c - a)) - i32((b - 512)))), Int32Array.BYTES_PER_ELEMENT);
  let esi = i32((cDeref(cPointerOffset(ptr, b, Int32Array.BYTES_PER_ELEMENT), Int32Array).value));
  let edi = i32((cDeref(cPointerOffset(ptr, c, Int32Array.BYTES_PER_ELEMENT), Int32Array).value));
  if ((edi >= esi)) {
    ((edi = i32(esi)), (c = i32(b)));
  }
  return i32(((edi < (cDeref(cPointerOffset(ptr, a, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)) ? c : a));
}

// C/C++ source: source/build/src/kplib.cpp:574
export function pal8hlineasm(x, xr1, p, ixstp) {
  for (; (x > xr1); ((p = i64((BigInt(p) + BigInt(i64(ixstp))))), ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous - 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => x, __cxx_lvalue_1 => { x = __cxx_lvalue_1; })))) {
    B_BUF32__header_5d2f345cbe77(p, u32((cDeref(cPointerOffset(palcol, (cDeref(cPointerOffset(olinbuf, x, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value), Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
  }
}

// C/C++ source: source/build/src/kplib.cpp:589
export let filter1st = 0;
function __cxx_static_address_716f7d463636ea4ee81dc233() {
  return __cxx_static_address_716f7d463636ea4ee81dc233.reference || (__cxx_static_address_716f7d463636ea4ee81dc233.reference = {
    __cReference: true,
    get value() { return filter1st; },
    set value(__cxx_lvalue_0) { filter1st = i32(__cxx_lvalue_0); }
  });
}

export let filterest = 0;
function __cxx_static_address_1d51987224f96ddbd0fc7996() {
  return __cxx_static_address_1d51987224f96ddbd0fc7996.reference || (__cxx_static_address_1d51987224f96ddbd0fc7996.reference = {
    __cReference: true,
    get value() { return filterest; },
    set value(__cxx_lvalue_0) { filterest = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/kplib.cpp:688
export function initpngtables() {
  let i;
  let j;
  let k;
  (j = i32(1));
  (k = i32(0));
  for ((i = i32(0)); (i < 30); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; }))) {
    ((cPointerElementRef(hxbit, i).value)[1] = i32(j));
    (j = i32((Number(j) + Number(i32((1 << k))))));
    ((cPointerElementRef(hxbit, i).value)[0] = i32(k));
    (k = i32((Number(k) + Number(i32((Boolean(i32((i & 1))) && (i >= 2)))))));
  }
  (j = i32(3));
  (k = i32(0));
  for ((i = i32(257)); (i < 285); ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i32((previous + 1)); __cxx_lvalue_2.value = next; return previous; })(cRef(() => i, __cxx_lvalue_3 => { i = __cxx_lvalue_3; }))) {
    ((cPointerElementRef(hxbit, i32((i32((i + 30)) - 257))).value)[1] = i32(j));
    (j = i32((Number(j) + Number(i32((1 << k))))));
    ((cPointerElementRef(hxbit, i32((i32((i + 30)) - 257))).value)[0] = i32(k));
    (k = i32((Number(k) + Number(i32(((!Boolean(i32((i & 3)))) && (i >= 264)))))));
  }
  ((cPointerElementRef(hxbit, i32((i32((285 + 30)) - 257))).value)[1] = i32(258));
  ((cPointerElementRef(hxbit, i32((i32((285 + 30)) - 257))).value)[0] = i32(0));
  for ((i = i32(0)); (i < 512); ((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = i32((previous + 1)); __cxx_lvalue_4.value = next; return previous; })(cRef(() => i, __cxx_lvalue_5 => { i = __cxx_lvalue_5; }))) {
    ((cDeref(cPointerOffset(abstab10, i32((512 + i)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(((cDeref(cPointerOffset(abstab10, i32((512 - i)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(i))));
  }
}

// C/C++ source: source/build/src/kplib.cpp:968
export let kpeginited = i32(0);
function __cxx_static_address_7d868b482eb5810f00372b0d() {
  return __cxx_static_address_7d868b482eb5810f00372b0d.reference || (__cxx_static_address_7d868b482eb5810f00372b0d.reference = {
    __cReference: true,
    get value() { return kpeginited; },
    set value(__cxx_lvalue_0) { kpeginited = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/kplib.cpp:969
export let clipxdim = 0;
function __cxx_static_address_a3dc6c1c21374777b45fcc5c() {
  return __cxx_static_address_a3dc6c1c21374777b45fcc5c.reference || (__cxx_static_address_a3dc6c1c21374777b45fcc5c.reference = {
    __cReference: true,
    get value() { return clipxdim; },
    set value(__cxx_lvalue_0) { clipxdim = i32(__cxx_lvalue_0); }
  });
}

export let clipydim = 0;
function __cxx_static_address_1c04f082b2329ae41fa28dbe() {
  return __cxx_static_address_1c04f082b2329ae41fa28dbe.reference || (__cxx_static_address_1c04f082b2329ae41fa28dbe.reference = {
    __cReference: true,
    get value() { return clipydim; },
    set value(__cxx_lvalue_0) { clipydim = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/kplib.cpp:971
export let hufmaxatbit = Array.from({ length: 8 }, () => new Int32Array(20));
function __cxx_static_address_41fcb4f438c2044fc294cd5b() {
  return __cxx_static_address_41fcb4f438c2044fc294cd5b.reference || (__cxx_static_address_41fcb4f438c2044fc294cd5b.reference = {
    __cReference: true,
    get value() { return hufmaxatbit; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export let hufvalatbit = Array.from({ length: 8 }, () => new Int32Array(20));
function __cxx_static_address_0420b5466f11b0b9a0aa7df8() {
  return __cxx_static_address_0420b5466f11b0b9a0aa7df8.reference || (__cxx_static_address_0420b5466f11b0b9a0aa7df8.reference = {
    __cReference: true,
    get value() { return hufvalatbit; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export let hufcnt = new Int32Array(8);
function __cxx_static_address_b7850715537bab8893907581() {
  return __cxx_static_address_b7850715537bab8893907581.reference || (__cxx_static_address_b7850715537bab8893907581.reference = {
    __cReference: true,
    get value() { return hufcnt; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/kplib.cpp:972
export let hufnumatbit = Array.from({ length: 8 }, () => new Uint8Array(20));
function __cxx_static_address_eeab23a119c748c6fbd652ad() {
  return __cxx_static_address_eeab23a119c748c6fbd652ad.reference || (__cxx_static_address_eeab23a119c748c6fbd652ad.reference = {
    __cReference: true,
    get value() { return hufnumatbit; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export let huftable = Array.from({ length: 8 }, () => new Uint8Array(256));
function __cxx_static_address_63dad10dda3f828a9fea2b00() {
  return __cxx_static_address_63dad10dda3f828a9fea2b00.reference || (__cxx_static_address_63dad10dda3f828a9fea2b00.reference = {
    __cReference: true,
    get value() { return huftable; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/kplib.cpp:973
export let hufquickval = Array.from({ length: 8 }, () => new Int32Array(1024));
function __cxx_static_address_e879e947574e9c7c3989ff42() {
  return __cxx_static_address_e879e947574e9c7c3989ff42.reference || (__cxx_static_address_e879e947574e9c7c3989ff42.reference = {
    __cReference: true,
    get value() { return hufquickval; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export let hufquickbits = Array.from({ length: 8 }, () => new Int32Array(1024));
function __cxx_static_address_15dfae2b1bea130c98975532() {
  return __cxx_static_address_15dfae2b1bea130c98975532.reference || (__cxx_static_address_15dfae2b1bea130c98975532.reference = {
    __cReference: true,
    get value() { return hufquickbits; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export let hufquickcnt = new Int32Array(8);
function __cxx_static_address_e2fc648bd897c4cce13f2aec() {
  return __cxx_static_address_e2fc648bd897c4cce13f2aec.reference || (__cxx_static_address_e2fc648bd897c4cce13f2aec.reference = {
    __cReference: true,
    get value() { return hufquickcnt; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/kplib.cpp:974
export let quantab = Array.from({ length: 4 }, () => new Int32Array(64));
function __cxx_static_address_d1c37acef3cf6af279ae655a() {
  return __cxx_static_address_d1c37acef3cf6af279ae655a.reference || (__cxx_static_address_d1c37acef3cf6af279ae655a.reference = {
    __cReference: true,
    get value() { return quantab; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export let dct = Array.from({ length: 12 }, () => new Int32Array(64));
function __cxx_static_address_19534326900cefdba550d3f3() {
  return __cxx_static_address_19534326900cefdba550d3f3.reference || (__cxx_static_address_19534326900cefdba550d3f3.reference = {
    __cReference: true,
    get value() { return dct; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export let lastdc = new Int32Array(4);
function __cxx_static_address_f42989924089f2a657d36855() {
  return __cxx_static_address_f42989924089f2a657d36855.reference || (__cxx_static_address_f42989924089f2a657d36855.reference = {
    __cReference: true,
    get value() { return lastdc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export let unzig = new Int32Array(64);
function __cxx_static_address_80f29d816baa224f8a52651f() {
  return __cxx_static_address_80f29d816baa224f8a52651f.reference || (__cxx_static_address_80f29d816baa224f8a52651f.reference = {
    __cReference: true,
    get value() { return unzig; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export let zigit = new Int32Array(64);
function __cxx_static_address_9e8d54a8d1a2d78d10e25b18() {
  return __cxx_static_address_9e8d54a8d1a2d78d10e25b18.reference || (__cxx_static_address_9e8d54a8d1a2d78d10e25b18.reference = {
    __cReference: true,
    get value() { return zigit; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/kplib.cpp:975
export let gnumcomponents = 0;
function __cxx_static_address_75d78c8649b786e365f68c19() {
  return __cxx_static_address_75d78c8649b786e365f68c19.reference || (__cxx_static_address_75d78c8649b786e365f68c19.reference = {
    __cReference: true,
    get value() { return gnumcomponents; },
    set value(__cxx_lvalue_0) { gnumcomponents = ((__cxx_lvalue_0) & 255); }
  });
}

export let dcflagor = new Uint8Array(64);
function __cxx_static_address_d4df59d379ae9d06bd106fea() {
  return __cxx_static_address_d4df59d379ae9d06bd106fea.reference || (__cxx_static_address_d4df59d379ae9d06bd106fea.reference = {
    __cReference: true,
    get value() { return dcflagor; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/kplib.cpp:976
export let gcompid = new Int32Array(4);
function __cxx_static_address_62a354041c44e3a59a5bb6e5() {
  return __cxx_static_address_62a354041c44e3a59a5bb6e5.reference || (__cxx_static_address_62a354041c44e3a59a5bb6e5.reference = {
    __cReference: true,
    get value() { return gcompid; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export let gcomphsamp = new Int32Array(4);
function __cxx_static_address_7227327f0b56c1a24fecf82d() {
  return __cxx_static_address_7227327f0b56c1a24fecf82d.reference || (__cxx_static_address_7227327f0b56c1a24fecf82d.reference = {
    __cReference: true,
    get value() { return gcomphsamp; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export let gcompvsamp = new Int32Array(4);
function __cxx_static_address_10384be384c9cf5d1b6af2a7() {
  return __cxx_static_address_10384be384c9cf5d1b6af2a7.reference || (__cxx_static_address_10384be384c9cf5d1b6af2a7.reference = {
    __cReference: true,
    get value() { return gcompvsamp; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export let gcompquantab = new Int32Array(4);
function __cxx_static_address_f4d3a84eedaad36cd50bed43() {
  return __cxx_static_address_f4d3a84eedaad36cd50bed43.reference || (__cxx_static_address_f4d3a84eedaad36cd50bed43.reference = {
    __cReference: true,
    get value() { return gcompquantab; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export let gcomphsampshift = new Int32Array(4);
function __cxx_static_address_55c218e97391e5caa76bc580() {
  return __cxx_static_address_55c218e97391e5caa76bc580.reference || (__cxx_static_address_55c218e97391e5caa76bc580.reference = {
    __cReference: true,
    get value() { return gcomphsampshift; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export let gcompvsampshift = new Int32Array(4);
function __cxx_static_address_f9127a62ff28682f4f5b37e6() {
  return __cxx_static_address_f9127a62ff28682f4f5b37e6.reference || (__cxx_static_address_f9127a62ff28682f4f5b37e6.reference = {
    __cReference: true,
    get value() { return gcompvsampshift; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/kplib.cpp:977
export let lnumcomponents = 0;
function __cxx_static_address_3509fb0eb490ee128ca9f127() {
  return __cxx_static_address_3509fb0eb490ee128ca9f127.reference || (__cxx_static_address_3509fb0eb490ee128ca9f127.reference = {
    __cReference: true,
    get value() { return lnumcomponents; },
    set value(__cxx_lvalue_0) { lnumcomponents = i32(__cxx_lvalue_0); }
  });
}

export let lcompid = new Int32Array(4);
function __cxx_static_address_780a71cbdc8f628e0d94911e() {
  return __cxx_static_address_780a71cbdc8f628e0d94911e.reference || (__cxx_static_address_780a71cbdc8f628e0d94911e.reference = {
    __cReference: true,
    get value() { return lcompid; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export let lcompdc = new Int32Array(4);
function __cxx_static_address_8f32512841b5e7b1c7b7ee09() {
  return __cxx_static_address_8f32512841b5e7b1c7b7ee09.reference || (__cxx_static_address_8f32512841b5e7b1c7b7ee09.reference = {
    __cReference: true,
    get value() { return lcompdc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export let lcompac = new Int32Array(4);
function __cxx_static_address_0c0dbb7b0f5c15485797c65b() {
  return __cxx_static_address_0c0dbb7b0f5c15485797c65b.reference || (__cxx_static_address_0c0dbb7b0f5c15485797c65b.reference = {
    __cReference: true,
    get value() { return lcompac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export let lcomphsamp = new Int32Array(4);
function __cxx_static_address_ad70b0bbb072d1abc9cc220e() {
  return __cxx_static_address_ad70b0bbb072d1abc9cc220e.reference || (__cxx_static_address_ad70b0bbb072d1abc9cc220e.reference = {
    __cReference: true,
    get value() { return lcomphsamp; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export let lcompvsamp = new Int32Array(4);
function __cxx_static_address_a93825664212712b246323ca() {
  return __cxx_static_address_a93825664212712b246323ca.reference || (__cxx_static_address_a93825664212712b246323ca.reference = {
    __cReference: true,
    get value() { return lcompvsamp; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export let lcompquantab = new Int32Array(4);
function __cxx_static_address_c83421310512dbb3c439a08e() {
  return __cxx_static_address_c83421310512dbb3c439a08e.reference || (__cxx_static_address_c83421310512dbb3c439a08e.reference = {
    __cReference: true,
    get value() { return lcompquantab; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/kplib.cpp:978
export let lcomphvsamp0 = 0;
function __cxx_static_address_5b41e208efb540392a35c934() {
  return __cxx_static_address_5b41e208efb540392a35c934.reference || (__cxx_static_address_5b41e208efb540392a35c934.reference = {
    __cReference: true,
    get value() { return lcomphvsamp0; },
    set value(__cxx_lvalue_0) { lcomphvsamp0 = i32(__cxx_lvalue_0); }
  });
}

export let lcomphsampshift0 = 0;
function __cxx_static_address_f6191a42e236b7d145b8bb7c() {
  return __cxx_static_address_f6191a42e236b7d145b8bb7c.reference || (__cxx_static_address_f6191a42e236b7d145b8bb7c.reference = {
    __cReference: true,
    get value() { return lcomphsampshift0; },
    set value(__cxx_lvalue_0) { lcomphsampshift0 = i32(__cxx_lvalue_0); }
  });
}

export let lcompvsampshift0 = 0;
function __cxx_static_address_07fbbf67d5756cc331ba3662() {
  return __cxx_static_address_07fbbf67d5756cc331ba3662.reference || (__cxx_static_address_07fbbf67d5756cc331ba3662.reference = {
    __cReference: true,
    get value() { return lcompvsampshift0; },
    set value(__cxx_lvalue_0) { lcompvsampshift0 = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/kplib.cpp:979
export let colclip = new Int32Array(1024);
function __cxx_static_address_01337dfaea8095be9fc9e8c0() {
  return __cxx_static_address_01337dfaea8095be9fc9e8c0.reference || (__cxx_static_address_01337dfaea8095be9fc9e8c0.reference = {
    __cReference: true,
    get value() { return colclip; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export let colclipup8 = new Int32Array(1024);
function __cxx_static_address_18b9cb201742c8b2f5dc9da4() {
  return __cxx_static_address_18b9cb201742c8b2f5dc9da4.reference || (__cxx_static_address_18b9cb201742c8b2f5dc9da4.reference = {
    __cReference: true,
    get value() { return colclipup8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export let colclipup16 = new Int32Array(1024);
function __cxx_static_address_15f8ff9c4d3432a740dcfe9f() {
  return __cxx_static_address_15f8ff9c4d3432a740dcfe9f.reference || (__cxx_static_address_15f8ff9c4d3432a740dcfe9f.reference = {
    __cReference: true,
    get value() { return colclipup16; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/kplib.cpp:1020
export function mulshr24(a, b) {
  return i32((BigInt((BigInt(i64(a)) * BigInt(i64(b)))) >> BigInt(24)));
}

// C/C++ source: source/build/src/kplib.cpp:1025
export function mulshr32(a, b) {
  return i32((BigInt((BigInt(i64(a)) * BigInt(i64(b)))) >> BigInt(32)));
}

// C/C++ source: source/build/src/kplib.cpp:1032
export let cosqr16 = new Int32Array([23726566, 23270667, 21920489, 19727919, 16777216, 13181774, 9079764, 4628823]);
function __cxx_static_address_6b0a1eea6980b95702f7d476() {
  return __cxx_static_address_6b0a1eea6980b95702f7d476.reference || (__cxx_static_address_6b0a1eea6980b95702f7d476.reference = {
    __cReference: true,
    get value() { return cosqr16; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/kplib.cpp:1034
export let crmul = new Int32Array(4096);
function __cxx_static_address_38ea85f8209c940eddcd58e9() {
  return __cxx_static_address_38ea85f8209c940eddcd58e9.reference || (__cxx_static_address_38ea85f8209c940eddcd58e9.reference = {
    __cReference: true,
    get value() { return crmul; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export let cbmul = new Int32Array(4096);
function __cxx_static_address_bcff3e961faff31cb085446b() {
  return __cxx_static_address_bcff3e961faff31cb085446b.reference || (__cxx_static_address_bcff3e961faff31cb085446b.reference = {
    __cReference: true,
    get value() { return cbmul; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/kplib.cpp:1036
export function initkpeg() {
  let i;
  let j;
  let y;
  let x = i32(0);
  for ((i = i32(0)); (i < 16); (i = i32((Number(i) + Number(2))))) {
    for ((y = i32((8 - 1))); (y >= 0); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous - 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => y, __cxx_lvalue_1 => { y = __cxx_lvalue_1; }))) {
      if ((u32(i32((i - y))) < u32(8))) {
        ((cDeref(cPointerOffset(unzig, ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i32((previous + 1)); __cxx_lvalue_2.value = next; return previous; })(cRef(() => x, __cxx_lvalue_3 => { x = __cxx_lvalue_3; })), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((i32((i32((y << 3)) + i)) - y)));
      }
    }
    for ((y = i32(0)); (y < 8); ((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = i32((previous + 1)); __cxx_lvalue_4.value = next; return previous; })(cRef(() => y, __cxx_lvalue_5 => { y = __cxx_lvalue_5; }))) {
      if ((u32(i32((i32((i + 1)) - y))) < u32(8))) {
        ((cDeref(cPointerOffset(unzig, ((__cxx_lvalue_6) => { const previous = __cxx_lvalue_6.value; const next = i32((previous + 1)); __cxx_lvalue_6.value = next; return previous; })(cRef(() => x, __cxx_lvalue_7 => { x = __cxx_lvalue_7; })), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((i32((i32((i32((y << 3)) + i)) + 1)) - y)));
      }
    }
  }
  for ((i = i32((64 - 1))); (i >= 0); ((__cxx_lvalue_8) => { const previous = __cxx_lvalue_8.value; const next = i32((previous - 1)); __cxx_lvalue_8.value = next; return previous; })(cRef(() => i, __cxx_lvalue_9 => { i = __cxx_lvalue_9; }))) {
    ((cDeref(cPointerOffset(zigit, (cDeref(cPointerOffset(unzig, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(i));
  }
  for ((i = i32((64 - 1))); (i >= 0); ((__cxx_lvalue_10) => { const previous = __cxx_lvalue_10.value; const next = i32((previous - 1)); __cxx_lvalue_10.value = next; return previous; })(cRef(() => i, __cxx_lvalue_11 => { i = __cxx_lvalue_11; }))) {
    ((cDeref(cPointerOffset(dcflagor, i, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = ((((((i32((1 << i32(((cDeref(cPointerOffset(unzig, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) >> 3))))) & 255)) & 255)) & 255));
  }
  for ((i = i32(0)); (i < 128); ((__cxx_lvalue_12) => { const previous = __cxx_lvalue_12.value; const next = i32((previous + 1)); __cxx_lvalue_12.value = next; return previous; })(cRef(() => i, __cxx_lvalue_13 => { i = __cxx_lvalue_13; }))) {
    ((cDeref(cPointerOffset(colclip, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((i + 128)));
  }
  for ((i = i32(128)); (i < 512); ((__cxx_lvalue_14) => { const previous = __cxx_lvalue_14.value; const next = i32((previous + 1)); __cxx_lvalue_14.value = next; return previous; })(cRef(() => i, __cxx_lvalue_15 => { i = __cxx_lvalue_15; }))) {
    ((cDeref(cPointerOffset(colclip, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(255));
  }
  for ((i = i32(512)); (i < 896); ((__cxx_lvalue_16) => { const previous = __cxx_lvalue_16.value; const next = i32((previous + 1)); __cxx_lvalue_16.value = next; return previous; })(cRef(() => i, __cxx_lvalue_17 => { i = __cxx_lvalue_17; }))) {
    ((cDeref(cPointerOffset(colclip, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(0));
  }
  for ((i = i32(896)); (i < 1024); ((__cxx_lvalue_18) => { const previous = __cxx_lvalue_18.value; const next = i32((previous + 1)); __cxx_lvalue_18.value = next; return previous; })(cRef(() => i, __cxx_lvalue_19 => { i = __cxx_lvalue_19; }))) {
    ((cDeref(cPointerOffset(colclip, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((i - 896)));
  }
  for ((i = i32(0)); (i < 1024); ((__cxx_lvalue_20) => { const previous = __cxx_lvalue_20.value; const next = i32((previous + 1)); __cxx_lvalue_20.value = next; return previous; })(cRef(() => i, __cxx_lvalue_21 => { i = __cxx_lvalue_21; }))) {
    ((cDeref(cPointerOffset(colclipup8, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(((cDeref(cPointerOffset(colclip, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) << 8)));
    ((cDeref(cPointerOffset(colclipup16, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(u32((u32(i32(((cDeref(cPointerOffset(colclip, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) << 16))) + 4278190080))));
  }
  for ((i = i32(0)); (i < 2048); ((__cxx_lvalue_22) => { const previous = __cxx_lvalue_22.value; const next = i32((previous + 1)); __cxx_lvalue_22.value = next; return previous; })(cRef(() => i, __cxx_lvalue_23 => { i = __cxx_lvalue_23; }))) {
    (j = i32((i - 1024)));
    ((cDeref(cPointerOffset(crmul, i32((i32((i << 1)) + 0)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(Math.imul(j, 1470104)));
    ((cDeref(cPointerOffset(crmul, i32((i32((i << 1)) + 1)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(Math.imul(j, (-748830))));
    ((cDeref(cPointerOffset(cbmul, i32((i32((i << 1)) + 0)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(Math.imul(j, (-360857))));
    ((cDeref(cPointerOffset(cbmul, i32((i32((i << 1)) + 1)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(Math.imul(j, 1858077)));
  }
  cByteMemory.memset(cPointerOffset((cPointerElementRef(dct, 10).value), 0, Int32Array.BYTES_PER_ELEMENT), 0, (BigInt(u64(i32(Math.imul(64, 2)))) * BigInt(4)));
}

// C/C++ source: source/build/src/kplib.cpp:1081
export function huffgetval(index, curbits, num, daval, dabits) {
  let b;
  let v;
  let pow2;
  let hmax;
  (hmax = cPointerOffset((cPointerElementRef(hufmaxatbit, index).value), 0, Int32Array.BYTES_PER_ELEMENT));
  (pow2 = i32((cDeref(cPointerOffset(pow2long, i32((curbits - 1)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
  if (Boolean(i32((num & pow2)))) {
    (v = i32(1));
  } else {
    (v = i32(0));
  }
  for ((b = i32(1)); (b <= 16); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => b, __cxx_lvalue_1 => { b = __cxx_lvalue_1; }))) {
    if ((v < (cDeref(cPointerOffset(hmax, b, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))) {
      ((cDeref(dabits, Int32Array).value) = i32(b));
      ((cDeref(daval, Int32Array).value) = i32((cPointerElementRef(huftable, index).value)[i32(((cPointerElementRef(hufvalatbit, index).value)[b] + v))]));
      return;
    }
    (pow2 = i32((pow2 >> 1)));
    (v = i32((v << 1)));
    if (Boolean(i32((num & pow2)))) {
      ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i32((previous + 1)); __cxx_lvalue_2.value = next; return previous; })(cRef(() => v, __cxx_lvalue_3 => { v = __cxx_lvalue_3; }));
    }
  }
  ((cDeref(dabits, Int32Array).value) = i32(16));
  ((cDeref(daval, Int32Array).value) = i32(0));
}

// C/C++ source: source/build/src/kplib.cpp:1102
export function invdct8x8(dc, dcflag) {
  let edc;
  let t0;
  let t1;
  let t2;
  let t3;
  let t4;
  let t5;
  let t6;
  let t7;
  (edc = cPointerOffset(dc, 64, Int32Array.BYTES_PER_ELEMENT));
  do {
    if (Boolean(i32((i32(dcflag) & 1)))) {
      (t3 = i32(((cDeref(cPointerOffset(dc, 2, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) + (cDeref(cPointerOffset(dc, 6, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))));
      (t2 = i32((i32((mulshr32(i32(((cDeref(cPointerOffset(dc, 2, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) - (cDeref(cPointerOffset(dc, 6, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))), i32((23726566 << 6))) << 2)) - t3)));
      (t4 = i32(((cDeref(cPointerOffset(dc, 0, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) + (cDeref(cPointerOffset(dc, 4, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))));
      (t5 = i32(((cDeref(cPointerOffset(dc, 0, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) - (cDeref(cPointerOffset(dc, 4, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))));
      (t0 = i32((t4 + t3)));
      (t3 = i32((t4 - t3)));
      (t1 = i32((t5 + t2)));
      (t2 = i32((t5 - t2)));
      (t4 = i32((mulshr32(i32((i32((i32(((cDeref(cPointerOffset(dc, 5, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) - (cDeref(cPointerOffset(dc, 3, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))) + (cDeref(cPointerOffset(dc, 1, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))) - (cDeref(cPointerOffset(dc, 7, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))), i32((31000253 << 6))) << 2)));
      (t7 = i32((i32((i32(((cDeref(cPointerOffset(dc, 1, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) + (cDeref(cPointerOffset(dc, 7, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))) + (cDeref(cPointerOffset(dc, 5, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))) + (cDeref(cPointerOffset(dc, 3, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))));
      (t6 = i32((i32((i32((mulshr32(i32(((cDeref(cPointerOffset(dc, 3, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) - (cDeref(cPointerOffset(dc, 5, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))), i32((43840978 << 5))) << 3)) + t4)) - t7)));
      (t5 = i32((i32((mulshr32(i32((i32((i32(((cDeref(cPointerOffset(dc, 1, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) + (cDeref(cPointerOffset(dc, 7, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))) - (cDeref(cPointerOffset(dc, 5, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))) - (cDeref(cPointerOffset(dc, 3, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))), i32((23726566 << 6))) << 2)) - t6)));
      (t4 = i32((i32((i32((mulshr32(i32(((cDeref(cPointerOffset(dc, 1, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) - (cDeref(cPointerOffset(dc, 7, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))), i32((18159528 << 6))) << 2)) - t4)) + t5)));
      ((cDeref(cPointerOffset(dc, 0, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((t0 + t7)));
      ((cDeref(cPointerOffset(dc, 7, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((t0 - t7)));
      ((cDeref(cPointerOffset(dc, 1, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((t1 + t6)));
      ((cDeref(cPointerOffset(dc, 6, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((t1 - t6)));
      ((cDeref(cPointerOffset(dc, 2, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((t2 + t5)));
      ((cDeref(cPointerOffset(dc, 5, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((t2 - t5)));
      ((cDeref(cPointerOffset(dc, 4, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((t3 + t4)));
      ((cDeref(cPointerOffset(dc, 3, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((t3 - t4)));
    }
    (dc = cPointerOffset(dc, 8, Int32Array.BYTES_PER_ELEMENT));
    (dcflag = (((dcflag >> 1)) & 255));
  } while (cPointerCompare(dc, edc, "<"));
  (dc = cPointerOffset(dc, -(32), Int32Array.BYTES_PER_ELEMENT));
  (edc = cPointerOffset(edc, -(24), Int32Array.BYTES_PER_ELEMENT));
  do {
    (t3 = i32(((cDeref(cPointerOffset(dc, i32((i32(Math.imul(2, 8)) - 32)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) + (cDeref(cPointerOffset(dc, i32((i32(Math.imul(6, 8)) - 32)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value))));
    (t2 = i32((i32((mulshr32(i32(((cDeref(cPointerOffset(dc, i32((i32(Math.imul(2, 8)) - 32)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) - (cDeref(cPointerOffset(dc, i32((i32(Math.imul(6, 8)) - 32)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value))), i32((23726566 << 6))) << 2)) - t3)));
    (t4 = i32(((cDeref(cPointerOffset(dc, i32((i32(Math.imul(0, 8)) - 32)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) + (cDeref(cPointerOffset(dc, i32((i32(Math.imul(4, 8)) - 32)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value))));
    (t5 = i32(((cDeref(cPointerOffset(dc, i32((i32(Math.imul(0, 8)) - 32)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) - (cDeref(cPointerOffset(dc, i32((i32(Math.imul(4, 8)) - 32)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value))));
    (t0 = i32((t4 + t3)));
    (t3 = i32((t4 - t3)));
    (t1 = i32((t5 + t2)));
    (t2 = i32((t5 - t2)));
    (t4 = i32((mulshr32(i32((i32((i32(((cDeref(cPointerOffset(dc, i32((i32(Math.imul(5, 8)) - 32)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) - (cDeref(cPointerOffset(dc, i32((i32(Math.imul(3, 8)) - 32)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value))) + (cDeref(cPointerOffset(dc, i32((i32(Math.imul(1, 8)) - 32)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value))) - (cDeref(cPointerOffset(dc, i32((i32(Math.imul(7, 8)) - 32)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value))), i32((31000253 << 6))) << 2)));
    (t7 = i32((i32((i32(((cDeref(cPointerOffset(dc, i32((i32(Math.imul(1, 8)) - 32)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) + (cDeref(cPointerOffset(dc, i32((i32(Math.imul(7, 8)) - 32)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value))) + (cDeref(cPointerOffset(dc, i32((i32(Math.imul(5, 8)) - 32)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value))) + (cDeref(cPointerOffset(dc, i32((i32(Math.imul(3, 8)) - 32)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value))));
    (t6 = i32((i32((i32((mulshr32(i32(((cDeref(cPointerOffset(dc, i32((i32(Math.imul(3, 8)) - 32)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) - (cDeref(cPointerOffset(dc, i32((i32(Math.imul(5, 8)) - 32)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value))), i32((43840978 << 5))) << 3)) + t4)) - t7)));
    (t5 = i32((i32((mulshr32(i32((i32((i32(((cDeref(cPointerOffset(dc, i32((i32(Math.imul(1, 8)) - 32)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) + (cDeref(cPointerOffset(dc, i32((i32(Math.imul(7, 8)) - 32)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value))) - (cDeref(cPointerOffset(dc, i32((i32(Math.imul(5, 8)) - 32)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value))) - (cDeref(cPointerOffset(dc, i32((i32(Math.imul(3, 8)) - 32)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value))), i32((23726566 << 6))) << 2)) - t6)));
    (t4 = i32((i32((i32((mulshr32(i32(((cDeref(cPointerOffset(dc, i32((i32(Math.imul(1, 8)) - 32)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) - (cDeref(cPointerOffset(dc, i32((i32(Math.imul(7, 8)) - 32)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value))), i32((18159528 << 6))) << 2)) - t4)) + t5)));
    ((cDeref(cPointerOffset(dc, i32((i32(Math.imul(0, 8)) - 32)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((t0 + t7)));
    ((cDeref(cPointerOffset(dc, i32((i32(Math.imul(7, 8)) - 32)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((t0 - t7)));
    ((cDeref(cPointerOffset(dc, i32((i32(Math.imul(1, 8)) - 32)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((t1 + t6)));
    ((cDeref(cPointerOffset(dc, i32((i32(Math.imul(6, 8)) - 32)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((t1 - t6)));
    ((cDeref(cPointerOffset(dc, i32((i32(Math.imul(2, 8)) - 32)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((t2 + t5)));
    ((cDeref(cPointerOffset(dc, i32((i32(Math.imul(5, 8)) - 32)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((t2 - t5)));
    ((cDeref(cPointerOffset(dc, i32((i32(Math.imul(4, 8)) - 32)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((t3 + t4)));
    ((cDeref(cPointerOffset(dc, i32((i32(Math.imul(3, 8)) - 32)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((t3 - t4)));
    ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = cPointerOffset(previous, 1, Int32Array.BYTES_PER_ELEMENT); __cxx_lvalue_0.value = next; return previous; })(cRef(() => dc, __cxx_lvalue_1 => { dc = __cxx_lvalue_1; }));
  } while (cPointerCompare(dc, edc, "<"));
}

// C/C++ source: source/build/src/kplib.cpp:1616
export let suffix = new Uint8Array(4100);
function __cxx_static_address_5bb6bf4bbc8a6745b513c303() {
  return __cxx_static_address_5bb6bf4bbc8a6745b513c303.reference || (__cxx_static_address_5bb6bf4bbc8a6745b513c303.reference = {
    __cReference: true,
    get value() { return suffix; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export let filbuffer = new Uint8Array(768);
function __cxx_static_address_8f56da9eaab99d5c387644a3() {
  return __cxx_static_address_8f56da9eaab99d5c387644a3.reference || (__cxx_static_address_8f56da9eaab99d5c387644a3.reference = {
    __cReference: true,
    get value() { return filbuffer; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export let tempstack = new Uint8Array(4096);
function __cxx_static_address_7b9818068a7d8c5283404107() {
  return __cxx_static_address_7b9818068a7d8c5283404107.reference || (__cxx_static_address_7b9818068a7d8c5283404107.reference = {
    __cReference: true,
    get value() { return tempstack; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/kplib.cpp:1617
export let prefix = new Int32Array(4100);
function __cxx_static_address_9160c75e0ea21ef79a69d2b9() {
  return __cxx_static_address_9160c75e0ea21ef79a69d2b9.reference || (__cxx_static_address_9160c75e0ea21ef79a69d2b9.reference = {
    __cReference: true,
    get value() { return prefix; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/kplib.cpp:1619
export function kgifrend(kfilebuf, kfilelength, dakpframeplace, dakpbytesperline, daxres, dayres) {
  let i;
  let x;
  let y;
  let xsiz;
  let ysiz;
  let yinc;
  let xend;
  let xspan;
  let yspan;
  let currstr;
  let numbitgoal;
  let lzcols;
  let dat;
  let blocklen;
  let bitcnt;
  let xoff;
  let transcol;
  let yoff;
  let numbits;
  let startnumbits;
  let chunkind;
  let ilacefirst;
  let ptr;
  let cptr = null;
  let daglobxoffs = i32(0);
  let daglobyoffs = i32(0);
  (kfilelength = i32(kfilelength));
  (kcoltype = ((((((3) << 24) >> 24)) << 24) >> 24));
  (bitdepth = ((((((8) << 24) >> 24)) << 24) >> 24));
  if ((((i32((cDeref(cPointerOffset(kfilebuf, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) != i32(71)) || (i32((cDeref(cPointerOffset(kfilebuf, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) != i32(73))) || (i32((cDeref(cPointerOffset(kfilebuf, 2, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) != i32(70)))) {
    return i32((-1));
  }
  (paleng = i32((1 << i32((i32((i32((cDeref(cPointerOffset(kfilebuf, 10, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 7)) + 1)))));
  (ptr = cTypedPointer(cPointerOffset(kfilebuf, 13, Uint8Array.BYTES_PER_ELEMENT), Uint8Array));
  if (Boolean(i32((i32((cDeref(cPointerOffset(kfilebuf, 10, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 128)))) {
    (cptr = ptr);
    (ptr = cPointerOffset(ptr, i32(Math.imul(paleng, 3)), Uint8Array.BYTES_PER_ELEMENT));
  }
  (transcol = i32((-1)));
  while ((i32((chunkind = (((((cDeref(((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_0.value = next; return previous; })(cRef(() => ptr, __cxx_lvalue_1 => { ptr = __cxx_lvalue_1; })), Uint8Array).value)) & 255)) & 255))) == i32(33))) {
    if ((i32((cDeref(cPointerOffset(ptr, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == 249)) {
      if (Boolean(i32((i32((cDeref(cPointerOffset(ptr, 2, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 1)))) {
        (transcol = i32((((cDeref(cPointerOffset(ptr, 5, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255)));
      }
    }
    ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_2.value = next; return previous; })(cRef(() => ptr, __cxx_lvalue_3 => { ptr = __cxx_lvalue_3; }));
    do {
      (i = i32((cDeref(((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_4.value = next; return previous; })(cRef(() => ptr, __cxx_lvalue_5 => { ptr = __cxx_lvalue_5; })), Uint8Array).value)));
      (ptr = cPointerOffset(ptr, i, Uint8Array.BYTES_PER_ELEMENT));
    } while (Boolean(i));
  }
  if ((i32(chunkind) != i32(44))) {
    return i32((-1));
  }
  (xoff = i32(B_PASS16__header_15ea0d7111ad(B_UNBUF16__header_48ae80884dfc(cPointerOffset(ptr, 0, Uint8Array.BYTES_PER_ELEMENT)))));
  (yoff = i64(B_PASS16__header_15ea0d7111ad(B_UNBUF16__header_48ae80884dfc(cPointerOffset(ptr, 2, Uint8Array.BYTES_PER_ELEMENT)))));
  (xspan = i32(B_PASS16__header_15ea0d7111ad(B_UNBUF16__header_48ae80884dfc(cPointerOffset(ptr, 4, Uint8Array.BYTES_PER_ELEMENT)))));
  (yspan = i32(B_PASS16__header_15ea0d7111ad(B_UNBUF16__header_48ae80884dfc(cPointerOffset(ptr, 6, Uint8Array.BYTES_PER_ELEMENT)))));
  (ptr = cPointerOffset(ptr, 9, Uint8Array.BYTES_PER_ELEMENT));
  if (Boolean(i32((i32((cDeref(cPointerOffset(ptr, (-1), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 64)))) {
    (yinc = i32(8));
    (ilacefirst = ((((1) & 255)) & 255));
  } else {
    (yinc = i32(1));
    (ilacefirst = ((((0) & 255)) & 255));
  }
  if (Boolean(i32((i32((cDeref(cPointerOffset(ptr, (-1), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 128)))) {
    (paleng = i32((1 << i32((i32((i32((cDeref(cPointerOffset(ptr, (-1), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 7)) + 1)))));
    (cptr = ptr);
    (ptr = cPointerOffset(ptr, i32(Math.imul(paleng, 3)), Uint8Array.BYTES_PER_ELEMENT));
  }
  for ((i = i32(0)); (i < paleng); ((__cxx_lvalue_6) => { const previous = __cxx_lvalue_6.value; const next = i32((previous + 1)); __cxx_lvalue_6.value = next; return previous; })(cRef(() => i, __cxx_lvalue_7 => { i = __cxx_lvalue_7; }))) {
    ((cDeref(cPointerOffset(palcol, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(B_PASS32__header_8a7178a88765(u32((u32(i32((i32((i32((i32((cDeref(cPointerOffset(cptr, i32(Math.imul(i, 3)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) << 16)) + i32((i32((cDeref(cPointerOffset(cptr, i32((i32(Math.imul(i, 3)) + 1)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) << 8)))) + i32((cDeref(cPointerOffset(cptr, i32((i32(Math.imul(i, 3)) + 2)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value))))) + 4278190080)))));
  }
  for (; (i < 256); ((__cxx_lvalue_8) => { const previous = __cxx_lvalue_8.value; const next = i32((previous + 1)); __cxx_lvalue_8.value = next; return previous; })(cRef(() => i, __cxx_lvalue_9 => { i = __cxx_lvalue_9; }))) {
    ((cDeref(cPointerOffset(palcol, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(B_PASS32__header_8a7178a88765(4278190080)));
  }
  if ((transcol >= 0)) {
    ((__cxx_lvalue_10) => (__cxx_lvalue_10.value = i32((__cxx_lvalue_10.value & B_PASS32__header_8a7178a88765((~4278190080))))))(cDeref(cPointerOffset(palcol, transcol, Int32Array.BYTES_PER_ELEMENT), Int32Array));
  }
  (xsiz = i32(B_PASS16__header_15ea0d7111ad(B_UNBUF16__header_48ae80884dfc(cPointerOffset(kfilebuf, 6, Uint8Array.BYTES_PER_ELEMENT)))));
  (ysiz = i32(B_PASS16__header_15ea0d7111ad(B_UNBUF16__header_48ae80884dfc(cPointerOffset(kfilebuf, 8, Uint8Array.BYTES_PER_ELEMENT)))));
  if (((((xoff != 0) || (yoff != i64(0))) || (xsiz != xspan)) || (ysiz != yspan))) {
    (daglobxoffs = i32((Number(daglobxoffs) + Number(xoff))));
    (daglobyoffs = i32((Number(daglobyoffs) + Number(yoff))));
  }
  (xspan = i32((Number(xspan) + Number(daglobxoffs))));
  (yspan = i32((Number(yspan) + Number(daglobyoffs))));
  (y = i32(daglobyoffs));
  if ((u32(y) < u32(dayres))) {
    (yoff = i64((BigInt(i64(i32(Math.imul(y, dakpbytesperline)))) + BigInt(dakpframeplace))));
    (x = i32(daglobxoffs));
    (xend = i32(xspan));
  } else {
    (x = i32(u32((u32(daglobxoffs) + 2147483648))));
    (xend = i32(u32((u32(xspan) + 2147483648))));
  }
  (lzcols = i32((1 << i32((cDeref(ptr, Uint8Array).value)))));
  (startnumbits = ((((((((i32((i32((cDeref(ptr, Uint8Array).value)) + 1))) & 255)) & 255)) & 255)) & 255));
  ((__cxx_lvalue_11) => { const previous = __cxx_lvalue_11.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_11.value = next; return previous; })(cRef(() => ptr, __cxx_lvalue_12 => { ptr = __cxx_lvalue_12; }));
  for ((i = i32((lzcols - 1))); (i >= 0); ((__cxx_lvalue_13) => { const previous = __cxx_lvalue_13.value; const next = i32((previous - 1)); __cxx_lvalue_13.value = next; return previous; })(cRef(() => i, __cxx_lvalue_14 => { i = __cxx_lvalue_14; }))) {
    ((cDeref(cPointerOffset(suffix, i, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = ((((((((cDeref(cPointerOffset(prefix, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(i))) & 255)) & 255)) & 255));
  }
  (currstr = i32((lzcols + 2)));
  (numbits = ((startnumbits) & 255));
  (numbitgoal = i32((lzcols << 1)));
  (blocklen = i32((cDeref(((__cxx_lvalue_15) => { const previous = __cxx_lvalue_15.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_15.value = next; return previous; })(cRef(() => ptr, __cxx_lvalue_16 => { ptr = __cxx_lvalue_16; })), Uint8Array).value)));
  cByteMemory.memcpy(filbuffer, ptr, u64(blocklen));
  (ptr = cPointerOffset(ptr, blocklen, Uint8Array.BYTES_PER_ELEMENT));
  (bitcnt = i32(0));
  while (Boolean(1)) {
    (dat = i32(u32(((B_PASS32__header_8a7178a88765(B_UNBUF32__header_c1468ac058f1(cPointerOffset(filbuffer, i32((bitcnt >> 3)), Uint8Array.BYTES_PER_ELEMENT))) >>> i32((bitcnt & 7))) & u32(i32((numbitgoal - 1)))))));
    (bitcnt = i32((Number(bitcnt) + Number(i32(numbits)))));
    if ((i32((bitcnt >> 3)) > i32((blocklen - 3)))) {
      B_BUF16__header_3391c2afcc82(filbuffer, B_UNBUF16__header_48ae80884dfc(cPointerOffset(filbuffer, i32((bitcnt >> 3)), Uint8Array.BYTES_PER_ELEMENT)));
      (i = i32((blocklen - i32((bitcnt >> 3)))));
      (blocklen = i32((cDeref(((__cxx_lvalue_17) => { const previous = __cxx_lvalue_17.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_17.value = next; return previous; })(cRef(() => ptr, __cxx_lvalue_18 => { ptr = __cxx_lvalue_18; })), Uint8Array).value)));
      cByteMemory.memcpy(cPointerOffset(filbuffer, i, Uint8Array.BYTES_PER_ELEMENT), ptr, u64(blocklen));
      (ptr = cPointerOffset(ptr, blocklen, Uint8Array.BYTES_PER_ELEMENT));
      (bitcnt = i32((bitcnt & 7)));
      (blocklen = i32((Number(blocklen) + Number(i))));
    }
    if ((dat == lzcols)) {
      (currstr = i32((lzcols + 2)));
      (numbits = ((startnumbits) & 255));
      (numbitgoal = i32((lzcols << 1)));
      continue;
    }
    if (((currstr == numbitgoal) && (i32(numbits) < 12))) {
      ((__cxx_lvalue_19) => { const previous = __cxx_lvalue_19.value; const next = (((previous + 1)) & 255); __cxx_lvalue_19.value = next; return previous; })(cRef(() => numbits, __cxx_lvalue_20 => { numbits = __cxx_lvalue_20; }));
      (numbitgoal = i32((numbitgoal << 1)));
    }
    ((cDeref(cPointerOffset(prefix, currstr, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(dat));
    for ((i = i32(0)); (dat >= lzcols); (dat = i32((cDeref(cPointerOffset(prefix, dat, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)))) {
      ((cDeref(cPointerOffset(tempstack, ((__cxx_lvalue_21) => { const previous = __cxx_lvalue_21.value; const next = i32((previous + 1)); __cxx_lvalue_21.value = next; return previous; })(cRef(() => i, __cxx_lvalue_22 => { i = __cxx_lvalue_22; })), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (((cDeref(cPointerOffset(suffix, dat, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
    }
    ((cDeref(cPointerOffset(tempstack, i, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (((((((cDeref(cPointerOffset(prefix, dat, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)) & 255)) & 255)) & 255));
    ((cDeref(cPointerOffset(suffix, i32((currstr - 1)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = ((((cDeref(cPointerOffset(suffix, currstr, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = ((((((dat) & 255)) & 255)) & 255))) & 255));
    for (; (i >= 0); ((__cxx_lvalue_23) => { const previous = __cxx_lvalue_23.value; const next = i32((previous - 1)); __cxx_lvalue_23.value = next; return previous; })(cRef(() => i, __cxx_lvalue_24 => { i = __cxx_lvalue_24; }))) {
      if ((u32(x) < u32(daxres))) {
        B_BUF32__header_5d2f345cbe77((BigInt(yoff) + BigInt(i64(i32((x << 2))))), u32((cDeref(cPointerOffset(palcol, i32((cDeref(cPointerOffset(tempstack, i, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
      }
      ((__cxx_lvalue_25) => { const previous = __cxx_lvalue_25.value; const next = i32((previous + 1)); __cxx_lvalue_25.value = next; return previous; })(cRef(() => x, __cxx_lvalue_26 => { x = __cxx_lvalue_26; }));
      if ((x == xend)) {
        (y = i32((Number(y) + Number(yinc))));
        if ((y >= yspan)) {
          switch (yinc) {
            case 8: {
              if ((!Boolean(ilacefirst))) {
                (y = i32((daglobyoffs + 2)));
                (yinc = i32(4));
                break;
              }
            }
            (ilacefirst = ((((0) & 255)) & 255));
            (y = i32((daglobyoffs + 4)));
            (yinc = i32(8));
            break;
            case 4: {
              (y = i32((daglobyoffs + 1)));
            }
            (yinc = i32(2));
            break;
            case 2:
            case 1: {
              return i32(0);
            }
          }
        }
        if ((u32(y) < u32(dayres))) {
          (yoff = i64((BigInt(i64(i32(Math.imul(y, dakpbytesperline)))) + BigInt(dakpframeplace))));
          (x = i32(daglobxoffs));
          (xend = i32(xspan));
        } else {
          (x = i32(u32((u32(daglobxoffs) + 2147483648))));
          (xend = i32(u32((u32(xspan) + 2147483648))));
        }
      }
    }
    ((__cxx_lvalue_27) => { const previous = __cxx_lvalue_27.value; const next = i32((previous + 1)); __cxx_lvalue_27.value = next; return previous; })(cRef(() => currstr, __cxx_lvalue_28 => { currstr = __cxx_lvalue_28; }));
  }
}

// C/C++ source: source/build/src/kplib.cpp:1785
export function ktgarend(header, fleng, dakpframeplace, dakpbytesperline, daxres, dayres) {
  let i = i32(0);
  let x;
  let y;
  let pi;
  let xi;
  let yi;
  let x0;
  let x1;
  let y0;
  let y1;
  let xsiz;
  let ysiz;
  let rlestat;
  let colbyte;
  let pixbyte;
  let p;
  let fptr;
  let cptr = null;
  let nptr;
  if (((fleng < 19) || Boolean(i32((i32((cDeref(cPointerOffset(header, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 254))))) {
    return i32((-1));
  }
  if (((i32((cDeref(cPointerOffset(header, 2, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) >= 12) || (!Boolean(i32((i32((1 << i32((cDeref(cPointerOffset(header, 2, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))) & 3598)))))) {
    return i32((-1));
  }
  if (((Boolean(i32((i32((cDeref(cPointerOffset(header, 16, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 7))) || (i32((cDeref(cPointerOffset(header, 16, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == 0)) || (i32((cDeref(cPointerOffset(header, 16, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) > 32))) {
    return i32((-1));
  }
  if (Boolean(i32((i32((cDeref(cPointerOffset(header, 17, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 192)))) {
    return i32((-1));
  }
  (fptr = cTypedPointer(cPointerOffset(header, i32((i32((cDeref(cPointerOffset(header, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) + 18)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array));
  (xsiz = i32(B_PASS16__header_15ea0d7111ad(B_UNBUF16__header_48ae80884dfc(cPointerOffset(header, 12, Uint8Array.BYTES_PER_ELEMENT)))));
  if ((xsiz <= 0)) {
    return i32((-1));
  }
  (ysiz = i32(B_PASS16__header_15ea0d7111ad(B_UNBUF16__header_48ae80884dfc(cPointerOffset(header, 14, Uint8Array.BYTES_PER_ELEMENT)))));
  if ((ysiz <= 0)) {
    return i32((-1));
  }
  (colbyte = i32((i32((i32((cDeref(cPointerOffset(header, 16, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) + 7)) >> 3)));
  if ((i32((cDeref(cPointerOffset(header, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == 1)) {
    (pixbyte = i32((i32((i32((cDeref(cPointerOffset(header, 7, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) + 7)) >> 3)));
    (cptr = cPointerOffset(fptr, i32(Math.imul((-i32(B_PASS16__header_15ea0d7111ad(B_UNBUF16__header_48ae80884dfc(cPointerOffset(header, 3, Uint8Array.BYTES_PER_ELEMENT))))), pixbyte)), Uint8Array.BYTES_PER_ELEMENT));
    (fptr = cPointerOffset(fptr, i32(Math.imul(i32(B_PASS16__header_15ea0d7111ad(B_UNBUF16__header_48ae80884dfc(cPointerOffset(header, 5, Uint8Array.BYTES_PER_ELEMENT)))), pixbyte)), Uint8Array.BYTES_PER_ELEMENT));
  } else {
    (pixbyte = i32(colbyte));
  }
  switch (pixbyte) {
    case 1: {
      (kcoltype = ((((((0) << 24) >> 24)) << 24) >> 24));
    }
    (bitdepth = ((((((8) << 24) >> 24)) << 24) >> 24));
    ((cDeref(cPointerOffset(palcol, 0, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(B_PASS32__header_8a7178a88765(4278190080)));
    for ((i = i32(1)); (i < 256); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; }))) {
      ((cDeref(cPointerOffset(palcol, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(((cDeref(cPointerOffset(palcol, i32((i - 1)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) + B_PASS32__header_08503142e865(65793))));
    }
    break;
    case 2:
    case 3: {
      (kcoltype = ((((((2) << 24) >> 24)) << 24) >> 24));
    }
    break;
    case 4: {
      (kcoltype = ((((((6) << 24) >> 24)) << 24) >> 24));
    }
    break;
  }
  if ((!Boolean(i32((i32((cDeref(cPointerOffset(header, 17, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 16))))) {
    (x0 = i32(0));
    (x1 = i32(xsiz));
    (xi = i32(1));
  } else {
    (x0 = i32((xsiz - 1)));
    (x1 = i32((-1)));
    (xi = i32((-1)));
  }
  if (Boolean(i32((i32((cDeref(cPointerOffset(header, 17, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 32)))) {
    (y0 = i32(0));
    (y1 = i32(ysiz));
    (yi = i32(1));
    (pi = i32(dakpbytesperline));
  } else {
    (y0 = i32((ysiz - 1)));
    (y1 = i32((-1)));
    (yi = i32((-1)));
    (pi = i32((-dakpbytesperline)));
  }
  if ((i32((cDeref(cPointerOffset(header, 2, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) < 8)) {
    (rlestat = i32((-2)));
  } else {
    (rlestat = i32((-1)));
  }
  (p = i64((BigInt(i64(i32(Math.imul(y0, dakpbytesperline)))) + BigInt(dakpframeplace))));
  for ((y = i32(y0)); (y != y1); ((y = i32((Number(y) + Number(yi)))), (p = i64((BigInt(p) + BigInt(i64(pi))))))) {
    for ((x = i32(x0)); (x != x1); (x = i32((Number(x) + Number(xi))))) {
      if ((rlestat < 128)) {
        if ((i32((rlestat & 127)) == 127)) {
          (rlestat = i32((cDeref(cPointerOffset(fptr, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)));
          ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_2.value = next; return previous; })(cRef(() => fptr, __cxx_lvalue_3 => { fptr = __cxx_lvalue_3; }));
        }
        if ((i32((cDeref(cPointerOffset(header, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == 1)) {
          if ((colbyte == 1)) {
            (i = i32((cDeref(cPointerOffset(fptr, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)));
          } else {
            (i = i32(B_PASS16__header_15ea0d7111ad(B_UNBUF16__header_48ae80884dfc(cPointerOffset(fptr, 0, Uint8Array.BYTES_PER_ELEMENT)))));
          }
          (nptr = cPointerOffset(cptr, i32(Math.imul(i, pixbyte)), Uint8Array.BYTES_PER_ELEMENT));
        } else {
          (nptr = fptr);
        }
        switch (pixbyte) {
          case 1: {
            (i = i32((cDeref(cPointerOffset(palcol, i32((cDeref(cPointerOffset(nptr, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
          }
          break;
          case 2: {
            (i = i32(B_PASS16__header_15ea0d7111ad(B_UNBUF16__header_48ae80884dfc(cPointerOffset(nptr, 0, Uint8Array.BYTES_PER_ELEMENT)))));
          }
          (i = i32(B_PASS32__header_8a7178a88765(u32((u32(i32((i32((i32((i32((i & 31744)) << 9)) + i32((i32((i & 992)) << 6)))) + i32((i32((i & 31)) << 3))))) + 4278190080)))));
          break;
          case 3: {
            (i = i32(u32((B_UNBUF32__header_c1468ac058f1(cPointerOffset(nptr, 0, Uint8Array.BYTES_PER_ELEMENT)) | B_PASS32__header_8a7178a88765(4278190080)))));
          }
          break;
          case 4: {
            (i = i32(B_UNBUF32__header_c1468ac058f1(cPointerOffset(nptr, 0, Uint8Array.BYTES_PER_ELEMENT))));
          }
          break;
        }
        (fptr = cPointerOffset(fptr, colbyte, Uint8Array.BYTES_PER_ELEMENT));
      }
      if ((rlestat >= 0)) {
        ((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = i32((previous - 1)); __cxx_lvalue_4.value = next; return previous; })(cRef(() => rlestat, __cxx_lvalue_5 => { rlestat = __cxx_lvalue_5; }));
      }
      if (((u32(x) < u32(daxres)) && (u32(y) < u32(dayres)))) {
        B_BUF32__header_5d2f345cbe77((BigInt(i64(i32(Math.imul(x, 4)))) + BigInt(p)), u32(i));
      }
    }
  }
  return i32(0);
}

// C/C++ source: source/build/src/kplib.cpp:1885
export function kbmprend(buf, fleng, dakpframeplace, dakpbytesperline, daxres, dayres) {
  let i;
  let j;
  let x;
  let y;
  let x0;
  let x1;
  let y0;
  let y1;
  let rastoff;
  let headsiz;
  let xsiz;
  let ysiz;
  let cdim;
  let comp;
  let cptrinc;
  let lptr;
  let cptr;
  (fleng = i32(fleng));
  (headsiz = i32(B_UNBUF32__header_c1468ac058f1(cPointerOffset(buf, 14, Uint8Array.BYTES_PER_ELEMENT))));
  if ((headsiz == B_PASS32__header_08503142e865(12))) {
    if ((i32(B_UNBUF16__header_48ae80884dfc(cPointerOffset(buf, 22, Uint8Array.BYTES_PER_ELEMENT))) != i32(B_PASS16__header_c2d8d3cb4508(1)))) {
      return i32((-1));
    }
    (xsiz = i32(B_PASS16__header_15ea0d7111ad(B_UNBUF16__header_48ae80884dfc(cPointerOffset(buf, 18, Uint8Array.BYTES_PER_ELEMENT)))));
    (ysiz = i32(B_PASS16__header_15ea0d7111ad(B_UNBUF16__header_48ae80884dfc(cPointerOffset(buf, 20, Uint8Array.BYTES_PER_ELEMENT)))));
    (cdim = i32(B_PASS16__header_15ea0d7111ad(B_UNBUF16__header_48ae80884dfc(cPointerOffset(buf, 24, Uint8Array.BYTES_PER_ELEMENT)))));
    (comp = i32(0));
  } else {
    if ((i32(B_UNBUF16__header_48ae80884dfc(cPointerOffset(buf, 26, Uint8Array.BYTES_PER_ELEMENT))) != i32(B_PASS16__header_c2d8d3cb4508(1)))) {
      return i32((-1));
    }
    (xsiz = i32(B_PASS32__header_8a7178a88765(B_UNBUF32__header_c1468ac058f1(cPointerOffset(buf, 18, Uint8Array.BYTES_PER_ELEMENT)))));
    (ysiz = i32(B_PASS32__header_8a7178a88765(B_UNBUF32__header_c1468ac058f1(cPointerOffset(buf, 22, Uint8Array.BYTES_PER_ELEMENT)))));
    (cdim = i32(B_PASS16__header_15ea0d7111ad(B_UNBUF16__header_48ae80884dfc(cPointerOffset(buf, 28, Uint8Array.BYTES_PER_ELEMENT)))));
    (comp = i32(B_PASS32__header_8a7178a88765(B_UNBUF32__header_c1468ac058f1(cPointerOffset(buf, 30, Uint8Array.BYTES_PER_ELEMENT)))));
  }
  if (((xsiz <= 0) || (!Boolean(ysiz)))) {
    return i32((-1));
  }
  if (((u32(i32((cdim - 1))) >= u32(32)) || (!Boolean(i32((i32((1 << cdim)) & 16843027)))))) {
    return i32((-1));
  }
  if (((comp != 0) && (comp != 3))) {
    return i32((-1));
  }
  (rastoff = i32(B_PASS32__header_8a7178a88765(B_UNBUF32__header_c1468ac058f1(cPointerOffset(buf, 10, Uint8Array.BYTES_PER_ELEMENT)))));
  if ((cdim < 16)) {
    if ((cdim == 2)) {
      ((cDeref(cPointerOffset(palcol, 0, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(4294967295));
      ((cDeref(cPointerOffset(palcol, 1, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(B_PASS32__header_8a7178a88765(4278190080)));
    }
    if ((headsiz == B_PASS32__header_08503142e865(12))) {
      (j = i32(3));
    } else {
      (j = i32(4));
    }
    for (((i = i32(0)), (cptr = cPointerOffset(buf, i32((headsiz + 14)), Uint8Array.BYTES_PER_ELEMENT))); cPointerCompare(cptr, cPointerOffset(buf, rastoff, Uint8Array.BYTES_PER_ELEMENT), "<"); (((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; })), (cptr = cPointerOffset(cptr, j, Uint8Array.BYTES_PER_ELEMENT)))) {
      ((cDeref(cPointerOffset(palcol, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(u32((B_UNBUF32__header_c1468ac058f1(cPointerOffset(cptr, 0, Uint8Array.BYTES_PER_ELEMENT)) | B_PASS32__header_8a7178a88765(4278190080)))));
    }
    (kcoltype = ((((((3) << 24) >> 24)) << 24) >> 24));
    (bitdepth = (((((((((cdim) << 24) >> 24)) << 24) >> 24)) << 24) >> 24));
    (paleng = i32(i));
  } else {
    if ((!Boolean(i32((cdim & 15))))) {
      (kcoltype = ((((((2) << 24) >> 24)) << 24) >> 24));
      switch (cdim) {
        case 16: {
          ((cDeref(cPointerOffset(palcol, 0, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(10));
        }
        ((cDeref(cPointerOffset(palcol, 1, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(5));
        ((cDeref(cPointerOffset(palcol, 2, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(0));
        ((cDeref(cPointerOffset(palcol, 3, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(5));
        ((cDeref(cPointerOffset(palcol, 4, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(5));
        ((cDeref(cPointerOffset(palcol, 5, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(5));
        break;
        case 32: {
          ((cDeref(cPointerOffset(palcol, 0, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(16));
        }
        ((cDeref(cPointerOffset(palcol, 1, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(8));
        ((cDeref(cPointerOffset(palcol, 2, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(0));
        ((cDeref(cPointerOffset(palcol, 3, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(8));
        ((cDeref(cPointerOffset(palcol, 4, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(8));
        ((cDeref(cPointerOffset(palcol, 5, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(8));
        break;
      }
      if ((comp == 3)) {
        for ((i = i32(0)); (i < 3); ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i32((previous + 1)); __cxx_lvalue_2.value = next; return previous; })(cRef(() => i, __cxx_lvalue_3 => { i = __cxx_lvalue_3; }))) {
          (j = i32(B_UNBUF32__header_c1468ac058f1(cPointerOffset(buf, i32((i32((headsiz + i32((i << 2)))) + 14)), Uint8Array.BYTES_PER_ELEMENT))));
          for (((cDeref(cPointerOffset(palcol, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(0)); ((cDeref(cPointerOffset(palcol, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) < 32); ((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = i32((previous + 1)); __cxx_lvalue_4.value = next; return previous; })(cDeref(cPointerOffset(palcol, i, Int32Array.BYTES_PER_ELEMENT), Int32Array))) {
            if (Boolean(i32((j & 1)))) {
              break;
            }
            (j = i32((u32(j) >>> 1)));
          }
          for (((cDeref(cPointerOffset(palcol, i32((i + 3)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(0)); ((cDeref(cPointerOffset(palcol, i32((i + 3)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) < 32); ((__cxx_lvalue_5) => { const previous = __cxx_lvalue_5.value; const next = i32((previous + 1)); __cxx_lvalue_5.value = next; return previous; })(cDeref(cPointerOffset(palcol, i32((i + 3)), Int32Array.BYTES_PER_ELEMENT), Int32Array))) {
            if ((!Boolean(i32((j & 1))))) {
              break;
            }
            (j = i32((u32(j) >>> 1)));
          }
        }
      }
      ((cDeref(cPointerOffset(palcol, 0, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((24 - i32(((cDeref(cPointerOffset(palcol, 0, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) + (cDeref(cPointerOffset(palcol, 3, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))))));
      ((cDeref(cPointerOffset(palcol, 1, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((16 - i32(((cDeref(cPointerOffset(palcol, 1, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) + (cDeref(cPointerOffset(palcol, 4, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))))));
      ((cDeref(cPointerOffset(palcol, 2, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((8 - i32(((cDeref(cPointerOffset(palcol, 2, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) + (cDeref(cPointerOffset(palcol, 5, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))))));
      ((cDeref(cPointerOffset(palcol, 3, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(((-i32((1 << i32((24 - (cDeref(cPointerOffset(palcol, 3, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)))))) & 16711680)));
      ((cDeref(cPointerOffset(palcol, 4, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(((-i32((1 << i32((16 - (cDeref(cPointerOffset(palcol, 4, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)))))) & 65280)));
      ((cDeref(cPointerOffset(palcol, 5, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(((-i32((1 << i32((8 - (cDeref(cPointerOffset(palcol, 5, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)))))) & 255)));
    }
  }
  (cptrinc = i32((i32((i32((i32(Math.imul(xsiz, cdim)) + 31)) >> 3)) & (~3))));
  (cptr = cPointerOffset(buf, rastoff, Uint8Array.BYTES_PER_ELEMENT));
  if ((ysiz < 0)) {
    (ysiz = i32((-ysiz)));
  } else {
    (cptr = cPointerOffset(cptr, i32(Math.imul(i32((ysiz - 1)), cptrinc)), Uint8Array.BYTES_PER_ELEMENT));
    (cptrinc = i32((-cptrinc)));
  }
  (x0 = i32(0));
  (x1 = i32(xsiz));
  (y0 = i32(0));
  (y1 = i32(ysiz));
  if ((x1 > daxres)) {
    (x1 = i32(daxres));
  }
  for ((y = i32(y0)); (y < y1); (((__cxx_lvalue_6) => { const previous = __cxx_lvalue_6.value; const next = i32((previous + 1)); __cxx_lvalue_6.value = next; return previous; })(cRef(() => y, __cxx_lvalue_7 => { y = __cxx_lvalue_7; })), (cptr = cPointerOffset(cptr, cptrinc, Uint8Array.BYTES_PER_ELEMENT)))) {
    if ((u32(y) >= u32(dayres))) {
      continue;
    }
    (lptr = cTypedPointer((BigInt(i64(i32(Math.imul(y, dakpbytesperline)))) + BigInt(dakpframeplace)), Int32Array));
    switch (cdim) {
      case 1: {
        for ((x = i32(x0)); (x < x1); ((__cxx_lvalue_8) => { const previous = __cxx_lvalue_8.value; const next = i32((previous + 1)); __cxx_lvalue_8.value = next; return previous; })(cRef(() => x, __cxx_lvalue_9 => { x = __cxx_lvalue_9; }))) {
          ((cDeref(cPointerOffset(lptr, x, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((cDeref(cPointerOffset(palcol, i32((i32((i32((cDeref(cPointerOffset(cptr, i32((x >> 3)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) >> i32((i32((x & 7)) ^ 7)))) & 1)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
        }
      }
      break;
      case 4: {
        for ((x = i32(x0)); (x < x1); ((__cxx_lvalue_10) => { const previous = __cxx_lvalue_10.value; const next = i32((previous + 1)); __cxx_lvalue_10.value = next; return previous; })(cRef(() => x, __cxx_lvalue_11 => { x = __cxx_lvalue_11; }))) {
          ((cDeref(cPointerOffset(lptr, x, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((cDeref(cPointerOffset(palcol, i32((i32((i32((cDeref(cPointerOffset(cptr, i32((x >> 1)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) >> i32((i32((i32((x & 1)) ^ 1)) << 2)))) & 15)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
        }
      }
      break;
      case 8: {
        for ((x = i32(x0)); (x < x1); ((__cxx_lvalue_12) => { const previous = __cxx_lvalue_12.value; const next = i32((previous + 1)); __cxx_lvalue_12.value = next; return previous; })(cRef(() => x, __cxx_lvalue_13 => { x = __cxx_lvalue_13; }))) {
          ((cDeref(cPointerOffset(lptr, x, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((cDeref(cPointerOffset(palcol, i32((cDeref(cPointerOffset(cptr, x, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
        }
      }
      break;
      case 16: {
        for ((x = i32(x0)); (x < x1); ((__cxx_lvalue_14) => { const previous = __cxx_lvalue_14.value; const next = i32((previous + 1)); __cxx_lvalue_14.value = next; return previous; })(cRef(() => x, __cxx_lvalue_15 => { x = __cxx_lvalue_15; }))) {
          (i = i32(B_UNBUF16__header_48ae80884dfc(cPointerOffset(cptr, i32((x << 1)), Uint8Array.BYTES_PER_ELEMENT))));
          ((cDeref(cPointerOffset(lptr, x, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(u32((u32(i32((i32((i32((klrotl(i, (cDeref(cPointerOffset(palcol, 0, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)) & (cDeref(cPointerOffset(palcol, 3, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))) + i32((klrotl(i, (cDeref(cPointerOffset(palcol, 1, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)) & (cDeref(cPointerOffset(palcol, 4, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))))) + i32((klrotl(i, (cDeref(cPointerOffset(palcol, 2, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)) & (cDeref(cPointerOffset(palcol, 5, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)))))) + B_PASS32__header_8a7178a88765(4278190080)))));
        }
      }
      break;
      case 24: {
        for ((x = i32(x0)); (x < x1); ((__cxx_lvalue_16) => { const previous = __cxx_lvalue_16.value; const next = i32((previous + 1)); __cxx_lvalue_16.value = next; return previous; })(cRef(() => x, __cxx_lvalue_17 => { x = __cxx_lvalue_17; }))) {
          ((cDeref(cPointerOffset(lptr, x, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(u32((B_UNBUF32__header_c1468ac058f1(cPointerOffset(cptr, i32(Math.imul(x, 3)), Uint8Array.BYTES_PER_ELEMENT)) | B_PASS32__header_8a7178a88765(4278190080)))));
        }
      }
      break;
      case 32: {
        for ((x = i32(x0)); (x < x1); ((__cxx_lvalue_18) => { const previous = __cxx_lvalue_18.value; const next = i32((previous + 1)); __cxx_lvalue_18.value = next; return previous; })(cRef(() => x, __cxx_lvalue_19 => { x = __cxx_lvalue_19; }))) {
          (i = i32(B_UNBUF32__header_c1468ac058f1(cPointerOffset(cptr, i32((x << 2)), Uint8Array.BYTES_PER_ELEMENT))));
          ((cDeref(cPointerOffset(lptr, x, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(u32((u32(i32((i32((i32((klrotl(i, (cDeref(cPointerOffset(palcol, 0, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)) & (cDeref(cPointerOffset(palcol, 3, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))) + i32((klrotl(i, (cDeref(cPointerOffset(palcol, 1, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)) & (cDeref(cPointerOffset(palcol, 4, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))))) + i32((klrotl(i, (cDeref(cPointerOffset(palcol, 2, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)) & (cDeref(cPointerOffset(palcol, 5, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)))))) + B_PASS32__header_8a7178a88765(4278190080)))));
        }
      }
      break;
    }
  }
  return i32(0);
}

// C/C++ source: source/build/src/kplib.cpp:2205
export function istarga(buf, leng) {
  return i32(((((((((leng >= 19) && (!Boolean(i32((i32((cDeref(cPointerOffset(buf, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 254))))) && (i32((cDeref(cPointerOffset(buf, 2, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) < 12)) && Boolean(i32((i32((1 << i32((cDeref(cPointerOffset(buf, 2, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))) & 3598)))) && (!Boolean(i32((i32((cDeref(cPointerOffset(buf, 16, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 7))))) && (i32((cDeref(cPointerOffset(buf, 16, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) != 0)) && (i32((cDeref(cPointerOffset(buf, 16, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) <= 32)) && (!Boolean(i32((i32((cDeref(cPointerOffset(buf, 17, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 192))))));
}

// C/C++ source: source/build/src/kplib.cpp:2212
export function kpgetdim(buf, leng, xsiz, ysiz) {
  let lptr;
  let cptr;
  let ubuf = cTypedPointer(buf, Uint8Array);
  ((cDeref(xsiz, Int32Array).value) = i32(((cDeref(ysiz, Int32Array).value) = i32(0))));
  if ((leng < 16)) {
    return;
  }
  if ((i32(B_UNBUF16__header_48ae80884dfc(cPointerOffset(ubuf, 0, Uint8Array.BYTES_PER_ELEMENT))) == i32(B_PASS16__header_c2d8d3cb4508(20617)))) {
    (lptr = cTypedPointer(buf, Int32Array));
    if ((((cDeref(cPointerOffset(lptr, 0, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) != B_PASS32__header_08503142e865(1196314761)) || ((cDeref(cPointerOffset(lptr, 1, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) != B_PASS32__header_08503142e865(169478669)))) {
      return;
    }
    (lptr = cPointerOffset(lptr, 2, Int32Array.BYTES_PER_ELEMENT));
    while (((BigInt(u64(lptr)) - BigInt(u64(buf))) < u64(i32((leng - 16))))) {
      if (((cDeref(cPointerOffset(lptr, 1, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) == B_PASS32__header_08503142e865(1380206665))) {
        ((cDeref(xsiz, Int32Array).value) = i32(B_SWAP32__header_c7537f5ee250((cDeref(cPointerOffset(lptr, 2, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))));
        ((cDeref(ysiz, Int32Array).value) = i32(B_SWAP32__header_c7537f5ee250((cDeref(cPointerOffset(lptr, 3, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))));
        break;
      }
      (lptr = cTypedPointer((BigInt((BigInt(i64(lptr)) + BigInt(i64(B_SWAP32__header_c7537f5ee250((cDeref(cPointerOffset(lptr, 0, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)))))) + BigInt(i64(12))), Int32Array));
    }
  } else {
    if ((i32(B_UNBUF16__header_48ae80884dfc(cPointerOffset(ubuf, 0, Uint8Array.BYTES_PER_ELEMENT))) == i32(B_PASS16__header_7269365a3bec(55551)))) {
      (cptr = cTypedPointer(cPointerOffset(buf, 2, Uint8Array.BYTES_PER_ELEMENT), Uint8Array));
      while (((BigInt(u64(cptr)) - BigInt(u64(buf))) < u64(i32((leng - 8))))) {
        if (((i32((cDeref(cPointerOffset(cptr, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) != 255) || (i32((cDeref(cPointerOffset(cptr, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == 255))) {
          ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_0.value = next; return previous; })(cRef(() => cptr, __cxx_lvalue_1 => { cptr = __cxx_lvalue_1; }));
          continue;
        }
        if ((u32(i32((i32((cDeref(cPointerOffset(cptr, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) - 192))) < u32(3))) {
          ((cDeref(ysiz, Int32Array).value) = i32(B_SWAP16__header_b45431f7a004(B_UNBUF16__header_48ae80884dfc(cPointerOffset(cptr, 5, Uint8Array.BYTES_PER_ELEMENT)))));
          ((cDeref(xsiz, Int32Array).value) = i32(B_SWAP16__header_b45431f7a004(B_UNBUF16__header_48ae80884dfc(cPointerOffset(cptr, 7, Uint8Array.BYTES_PER_ELEMENT)))));
          break;
        }
        (cptr = cPointerOffset(cptr, i32((i32(B_SWAP16__header_b45431f7a004(B_UNBUF16__header_48ae80884dfc(cPointerOffset(cptr, 2, Uint8Array.BYTES_PER_ELEMENT)))) + 2)), Uint8Array.BYTES_PER_ELEMENT));
      }
    } else {
      if ((((i32((cDeref(cPointerOffset(ubuf, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == i32(71)) && (i32((cDeref(cPointerOffset(ubuf, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == i32(73))) && (i32((cDeref(cPointerOffset(ubuf, 2, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == i32(70)))) {
        ((cDeref(xsiz, Int32Array).value) = i32(B_PASS16__header_15ea0d7111ad(B_UNBUF16__header_48ae80884dfc(cPointerOffset(buf, 6, Uint8Array.BYTES_PER_ELEMENT)))));
        ((cDeref(ysiz, Int32Array).value) = i32(B_PASS16__header_15ea0d7111ad(B_UNBUF16__header_48ae80884dfc(cPointerOffset(buf, 8, Uint8Array.BYTES_PER_ELEMENT)))));
      } else {
        if (((i32((cDeref(cPointerOffset(ubuf, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == i32(66)) && (i32((cDeref(cPointerOffset(ubuf, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == i32(77)))) {
          if ((B_UNBUF32__header_c1468ac058f1(cPointerOffset(buf, 14, Uint8Array.BYTES_PER_ELEMENT)) == B_PASS32__header_8a7178a88765(12))) {
            if ((i32(B_UNBUF16__header_48ae80884dfc(cPointerOffset(buf, 22, Uint8Array.BYTES_PER_ELEMENT))) != i32(B_PASS16__header_c2d8d3cb4508(1)))) {
              return;
            }
            ((cDeref(xsiz, Int32Array).value) = i32(B_PASS16__header_15ea0d7111ad(B_UNBUF16__header_48ae80884dfc(cPointerOffset(buf, 18, Uint8Array.BYTES_PER_ELEMENT)))));
            ((cDeref(ysiz, Int32Array).value) = i32(B_PASS16__header_15ea0d7111ad(B_UNBUF16__header_48ae80884dfc(cPointerOffset(buf, 20, Uint8Array.BYTES_PER_ELEMENT)))));
          } else {
            if ((i32(B_UNBUF16__header_48ae80884dfc(cPointerOffset(buf, 26, Uint8Array.BYTES_PER_ELEMENT))) != i32(B_PASS16__header_c2d8d3cb4508(1)))) {
              return;
            }
            ((cDeref(xsiz, Int32Array).value) = i32(B_PASS32__header_8a7178a88765(B_UNBUF32__header_c1468ac058f1(cPointerOffset(buf, 18, Uint8Array.BYTES_PER_ELEMENT)))));
            ((cDeref(ysiz, Int32Array).value) = i32(B_PASS32__header_8a7178a88765(B_UNBUF32__header_c1468ac058f1(cPointerOffset(buf, 22, Uint8Array.BYTES_PER_ELEMENT)))));
          }
        } else {
          if ((B_UNBUF32__header_c1468ac058f1(ubuf) == B_PASS32__header_8a7178a88765(134284554))) {
            ((cDeref(xsiz, Int32Array).value) = i32((i32((i32(B_PASS16__header_15ea0d7111ad(B_UNBUF16__header_48ae80884dfc(cPointerOffset(buf, 8, Uint8Array.BYTES_PER_ELEMENT)))) - i32(B_PASS16__header_15ea0d7111ad(B_UNBUF16__header_48ae80884dfc(cPointerOffset(buf, 4, Uint8Array.BYTES_PER_ELEMENT)))))) + 1)));
            ((cDeref(ysiz, Int32Array).value) = i32((i32((i32(B_PASS16__header_15ea0d7111ad(B_UNBUF16__header_48ae80884dfc(cPointerOffset(buf, 10, Uint8Array.BYTES_PER_ELEMENT)))) - i32(B_PASS16__header_15ea0d7111ad(B_UNBUF16__header_48ae80884dfc(cPointerOffset(buf, 6, Uint8Array.BYTES_PER_ELEMENT)))))) + 1)));
          } else {
            if (Boolean(istarga(ubuf, leng))) {
              ((cDeref(xsiz, Int32Array).value) = i32(B_PASS16__header_15ea0d7111ad(B_UNBUF16__header_48ae80884dfc(cPointerOffset(buf, 12, Uint8Array.BYTES_PER_ELEMENT)))));
              ((cDeref(ysiz, Int32Array).value) = i32(B_PASS16__header_15ea0d7111ad(B_UNBUF16__header_48ae80884dfc(cPointerOffset(buf, 14, Uint8Array.BYTES_PER_ELEMENT)))));
            }
          }
        }
      }
    }
  }
}

// C/C++ source: source/build/src/kplib.cpp:2388
export let kzhashbuf = 0;
function __cxx_static_address_b157606d4f95106080f2a466() {
  return __cxx_static_address_b157606d4f95106080f2a466.reference || (__cxx_static_address_b157606d4f95106080f2a466.reference = {
    __cReference: true,
    get value() { return kzhashbuf; },
    set value(__cxx_lvalue_0) { kzhashbuf = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/build/src/kplib.cpp:2389
export let kzhashead = new Int32Array(256);
function __cxx_static_address_2360a9b21e071c889545420f() {
  return __cxx_static_address_2360a9b21e071c889545420f.reference || (__cxx_static_address_2360a9b21e071c889545420f.reference = {
    __cReference: true,
    get value() { return kzhashead; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export let kzhashpos = 0;
function __cxx_static_address_b818bdd96ac5a54d23ef8d71() {
  return __cxx_static_address_b818bdd96ac5a54d23ef8d71.reference || (__cxx_static_address_b818bdd96ac5a54d23ef8d71.reference = {
    __cReference: true,
    get value() { return kzhashpos; },
    set value(__cxx_lvalue_0) { kzhashpos = i32(__cxx_lvalue_0); }
  });
}

export let kzlastfnam = i32((-1));
function __cxx_static_address_68d23d870c89fbf375ec9ee7() {
  return __cxx_static_address_68d23d870c89fbf375ec9ee7.reference || (__cxx_static_address_68d23d870c89fbf375ec9ee7.reference = {
    __cReference: true,
    get value() { return kzlastfnam; },
    set value(__cxx_lvalue_0) { kzlastfnam = i32(__cxx_lvalue_0); }
  });
}

export let kzhashsiz = 0;
function __cxx_static_address_18a15d7d0a28f837f71b69ed() {
  return __cxx_static_address_18a15d7d0a28f837f71b69ed.reference || (__cxx_static_address_18a15d7d0a28f837f71b69ed.reference = {
    __cReference: true,
    get value() { return kzhashsiz; },
    set value(__cxx_lvalue_0) { kzhashsiz = i32(__cxx_lvalue_0); }
  });
}

export let kzdirnamhead = i32((-1));
function __cxx_static_address_3061051e41549ca97da073af() {
  return __cxx_static_address_3061051e41549ca97da073af.reference || (__cxx_static_address_3061051e41549ca97da073af.reference = {
    __cReference: true,
    get value() { return kzdirnamhead; },
    set value(__cxx_lvalue_0) { kzdirnamhead = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/kplib.cpp:2662
export let hfind = null;
function __cxx_static_address_10a264abfd37072da9013188() {
  return __cxx_static_address_10a264abfd37072da9013188.reference || (__cxx_static_address_10a264abfd37072da9013188.reference = {
    __cReference: true,
    get value() { return hfind; },
    set value(__cxx_lvalue_0) { hfind = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/build/src/kplib.cpp:2663
export let findata = null;
function __cxx_static_address_2fae99cde3dce247c9a2190e() {
  return __cxx_static_address_2fae99cde3dce247c9a2190e.reference || (__cxx_static_address_2fae99cde3dce247c9a2190e.reference = {
    __cReference: true,
    get value() { return findata; },
    set value(__cxx_lvalue_0) { findata = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/build/src/kplib.cpp:2673
export let srchstat = i32((-1));
function __cxx_static_address_823831e89d2903e406a4dfc7() {
  return __cxx_static_address_823831e89d2903e406a4dfc7.reference || (__cxx_static_address_823831e89d2903e406a4dfc7.reference = {
    __cReference: true,
    get value() { return srchstat; },
    set value(__cxx_lvalue_0) { srchstat = i32(__cxx_lvalue_0); }
  });
}

export let srchzoff = i32(0);
function __cxx_static_address_187a378358fa46f2f5c85783() {
  return __cxx_static_address_187a378358fa46f2f5c85783.reference || (__cxx_static_address_187a378358fa46f2f5c85783.reference = {
    __cReference: true,
    get value() { return srchzoff; },
    set value(__cxx_lvalue_0) { srchzoff = i32(__cxx_lvalue_0); }
  });
}

export let srchdoff = i32((-1));
function __cxx_static_address_0d0a678fe45f8fad2300da36() {
  return __cxx_static_address_0d0a678fe45f8fad2300da36.reference || (__cxx_static_address_0d0a678fe45f8fad2300da36.reference = {
    __cReference: true,
    get value() { return srchdoff; },
    set value(__cxx_lvalue_0) { srchdoff = i32(__cxx_lvalue_0); }
  });
}

export let wildstpathleng = 0;
function __cxx_static_address_cdbd1b981997730a505f4a19() {
  return __cxx_static_address_cdbd1b981997730a505f4a19.reference || (__cxx_static_address_cdbd1b981997730a505f4a19.reference = {
    __cReference: true,
    get value() { return wildstpathleng; },
    set value(__cxx_lvalue_0) { wildstpathleng = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/kplib.cpp:2674
export let wildst = (() => { const bytes = new Uint8Array(260); bytes.set([]); return bytes; })();
function __cxx_static_address_5b78b4a1c647c7f560583a85() {
  return __cxx_static_address_5b78b4a1c647c7f560583a85.reference || (__cxx_static_address_5b78b4a1c647c7f560583a85.reference = {
    __cReference: true,
    get value() { return wildst; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export let newildst = (() => { const bytes = new Uint8Array(260); bytes.set([]); return bytes; })();
function __cxx_static_address_ab545bd2240c7bb3972e6488() {
  return __cxx_static_address_ab545bd2240c7bb3972e6488.reference || (__cxx_static_address_ab545bd2240c7bb3972e6488.reference = {
    __cReference: true,
    get value() { return newildst; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/kplib.cpp:2809
export let gzbufptr = null;
function __cxx_static_address_bb1f28aaaf1422ad38efa78a() {
  return __cxx_static_address_bb1f28aaaf1422ad38efa78a.reference || (__cxx_static_address_bb1f28aaaf1422ad38efa78a.reference = {
    __cReference: true,
    get value() { return gzbufptr; },
    set value(__cxx_lvalue_0) { gzbufptr = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/build/src/kplib.cpp:3023
export function kzseek(offset, whence) {
  if ((!kzfs.fil)) {
    return i32((-1));
  }
  switch (whence) {
    case 1: {
      ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = i32((Number(__cxx_lvalue_0.value) + Number(offset)))))(cObjectFieldRef(kzfs, "pos"));
    }
    break;
    case 2: {
      (kzfs.pos = i32((kzfs.leng + offset)));
    }
    break;
    case 0:
    default: {
      (kzfs.pos = i32(offset));
    }
  }
  if ((kzfs.pos < 0)) {
    (kzfs.pos = i32(0));
  }
  if ((kzfs.pos > kzfs.leng)) {
    (kzfs.pos = i32(kzfs.leng));
  }
  return i32(kzfs.pos);
}

// C/C++ source: source/build/include/compat.h:1169
export const pow2char__header_global_021abad301e15d3d = new Uint8Array([((1) & 255), ((2) & 255), ((4) & 255), ((8) & 255), ((16) & 255), ((32) & 255), ((64) & 255), ((128) & 255)]);
function __cxx_static_address_392ede9e6a1b24fbaec3a0a9() {
  return __cxx_static_address_392ede9e6a1b24fbaec3a0a9.reference || (__cxx_static_address_392ede9e6a1b24fbaec3a0a9.reference = {
    __cReference: true,
    get value() { return pow2char__header_global_021abad301e15d3d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:172
export const g_defaultVideoModes__header_global_d83845986d05a170 = [cMarkAggregate(({"x": 2560, "y": 1440})), cMarkAggregate(({"x": 2560, "y": 1200})), cMarkAggregate(({"x": 2560, "y": 1080})), cMarkAggregate(({"x": 1920, "y": 1440})), cMarkAggregate(({"x": 1920, "y": 1200})), cMarkAggregate(({"x": 1920, "y": 1080})), cMarkAggregate(({"x": 1680, "y": 1050})), cMarkAggregate(({"x": 1600, "y": 1200})), cMarkAggregate(({"x": 1600, "y": 900})), cMarkAggregate(({"x": 1366, "y": 768})), cMarkAggregate(({"x": 1280, "y": 1024})), cMarkAggregate(({"x": 1280, "y": 960})), cMarkAggregate(({"x": 1280, "y": 720})), cMarkAggregate(({"x": 1152, "y": 864})), cMarkAggregate(({"x": 1024, "y": 768})), cMarkAggregate(({"x": 1024, "y": 600})), cMarkAggregate(({"x": 800, "y": 600})), cMarkAggregate(({"x": 640, "y": 480})), cMarkAggregate(({"x": 640, "y": 400})), cMarkAggregate(({"x": 512, "y": 384})), cMarkAggregate(({"x": 480, "y": 360})), cMarkAggregate(({"x": 400, "y": 300})), cMarkAggregate(({"x": 320, "y": 240})), cMarkAggregate(({"x": 320, "y": 200})), cMarkAggregate(({"x": 0, "y": 0}))];
function __cxx_static_address_ecf42c81fb28d66b3df8d0b2() {
  return __cxx_static_address_ecf42c81fb28d66b3df8d0b2.reference || (__cxx_static_address_ecf42c81fb28d66b3df8d0b2.reference = {
    __cReference: true,
    get value() { return g_defaultVideoModes__header_global_d83845986d05a170; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:188
export const g_keyAsciiTable__header_global_c95e5842fd0d2550 = new Uint8Array([((0) & 255), ((0) & 255), 49, 50, 51, 52, 53, 54, 55, 56, 57, 48, 45, 61, ((0) & 255), ((0) & 255), 113, 119, 101, 114, 116, 121, 117, 105, 111, 112, 91, 93, ((0) & 255), ((0) & 255), 97, 115, 100, 102, 103, 104, 106, 107, 108, 59, ((39) & 255), 96, ((0) & 255), ((92) & 255), 122, 120, 99, 118, 98, 110, 109, 44, 46, 47, ((0) & 255), 42, ((0) & 255), ((32) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), 55, 56, 57, 45, 52, 53, 54, 43, 49, 50, 51, 48, 46, ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255)]);
function __cxx_static_address_b8e0c56e48bee3e7640acce2() {
  return __cxx_static_address_b8e0c56e48bee3e7640acce2.reference || (__cxx_static_address_b8e0c56e48bee3e7640acce2.reference = {
    __cReference: true,
    get value() { return g_keyAsciiTable__header_global_c95e5842fd0d2550; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:196
export const g_keyAsciiTableShift__header_global_19855f14872cb82b = new Uint8Array([((0) & 255), ((0) & 255), 33, 64, 35, 36, 37, 94, 38, 42, 40, 41, 95, 43, ((0) & 255), ((0) & 255), 81, 87, 69, 82, 84, 89, 85, 73, 79, 80, 123, 125, ((0) & 255), ((0) & 255), 65, 83, 68, 70, 71, 72, 74, 75, 76, 58, 34, 126, ((0) & 255), 124, 90, 88, 67, 86, 66, 78, 77, 60, 62, 63, ((0) & 255), 42, ((0) & 255), ((32) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), 55, 56, 57, 45, 52, 53, 54, 43, 49, 50, 51, 48, 46, ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255)]);
function __cxx_static_address_1732bdf654b8967d8379974f() {
  return __cxx_static_address_1732bdf654b8967d8379974f.reference || (__cxx_static_address_1732bdf654b8967d8379974f.reference = {
    __cReference: true,
    get value() { return g_keyAsciiTableShift__header_global_19855f14872cb82b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/kplib.cpp:1032
export function B_BUF32__header_5d2f345cbe77(buf, x) {
  ((cDeref(cTypedPointer(buf, Uint32Array), Uint32Array).value) = u32(x));
}

// C/C++ source: source/build/src/kplib.cpp:1036
export function B_UNBUF32__header_c1468ac058f1(buf) {
  return u32((cDeref(cTypedPointer(buf, Uint32Array), Uint32Array).value));
}

export function B_SWAP32__header_86d0d39cb98e(x) {
  return u32(B_SWAP32_impl__header_92ffc23b353f(u32(x)));
}

export function B_PASS32__header_8a7178a88765(x) {
  return u32(x);
}

export function B_PASS32__header_08503142e865(x) {
  return i32(x);
}

export function B_SWAP32__header_c7537f5ee250(x) {
  return i32(B_SWAP32_impl__header_92ffc23b353f(u32(x)));
}

// C/C++ source: source/build/src/kplib.cpp:1035
export function B_UNBUF16__header_48ae80884dfc(buf) {
  return (((cDeref(cTypedPointer(buf, Uint16Array), Uint16Array).value)) & 65535);
}

export function B_PASS16__header_7269365a3bec(x) {
  return ((((x) & 65535)) & 65535);
}

export function B_SWAP16__header_b45431f7a004(x) {
  return ((B_SWAP16_impl__header_370a30133afa(((x) & 65535))) & 65535);
}

export function B_PASS16__header_15ea0d7111ad(x) {
  return ((x) & 65535);
}

// C/C++ source: source/build/src/kplib.cpp:1031
export function B_BUF16__header_3391c2afcc82(buf, x) {
  ((cDeref(cTypedPointer(buf, Uint16Array), Uint16Array).value) = ((x) & 65535));
}

export function B_PASS16__header_c2d8d3cb4508(x) {
  return ((((((x) << 16) >> 16)) << 16) >> 16);
}

export function ARRAY_SIZE__header_5684d083f66c(arg0) {
  return u64(256n);
}

// C/C++ source: source/build/src/kplib.cpp:948
export function B_SWAP32_impl__header_92ffc23b353f(value) {
  return u32((u32((u32(((u32((value & 4278190080)) >>> 24) | (u32((value & 16711680)) >>> 8))) | u32((u32((value & 65280)) << 8)))) | u32((u32((value & 255)) << 24))));
}

// C/C++ source: source/build/src/kplib.cpp:942
export function B_SWAP16_impl__header_370a30133afa(value) {
  return ((((u32(((u32((u32(value) & 65280)) >>> 8) | u32((u32((u32(value) & 255)) << 8))))) & 65535)) & 65535);
}

// C/C++ source: source/build/include/smmalloc.h:864
export function _sm_free(allocator, p) {
  return (allocator).value.Free(p);
}

// C/C++ source: source/build/include/smmalloc.h:859
export function _sm_malloc(allocator, bytesCount, alignment) {
  return (allocator).value.Alloc(bytesCount, alignment);
}

// C/C++ source: source/build/include/smmalloc.h:866
export function _sm_realloc(allocator, p, bytesCount, alignment) {
  return (allocator).value.Realloc(p, bytesCount, alignment);
}
