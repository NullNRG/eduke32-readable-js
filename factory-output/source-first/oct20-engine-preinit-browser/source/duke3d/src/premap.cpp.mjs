// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/duke3d/src/premap.cpp
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

const i32 = value => Number(value) | 0;
const u32 = value => Number(value) >>> 0;
const i64 = value => BigInt.asIntN(64, BigInt(value));
const u64 = value => BigInt.asUintN(64, BigInt(value));

// C/C++ source: source/build/include/fix16.h:111
export const fix16_rad_to_deg_mult__header_global_dfc156bd568bcf3a = i32(3754936);
function __cxx_static_address_239b1036f7f1a4d055590850() {
  return __cxx_static_address_239b1036f7f1a4d055590850.reference || (__cxx_static_address_239b1036f7f1a4d055590850.reference = {
    __cReference: true,
    get value() { return fix16_rad_to_deg_mult__header_global_dfc156bd568bcf3a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:114
export const fix16_deg_to_rad_mult__header_global_447e21be18358bee = i32(1144);
function __cxx_static_address_de91aafe381bc991d3b22d03() {
  return __cxx_static_address_de91aafe381bc991d3b22d03.reference || (__cxx_static_address_de91aafe381bc991d3b22d03.reference = {
    __cReference: true,
    get value() { return fix16_deg_to_rad_mult__header_global_447e21be18358bee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:43
export const KICK_HIT____header_global_f1886938265ed52a = ((((((0) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7a1447e8106b32d1841e5acb() {
  return __cxx_static_address_7a1447e8106b32d1841e5acb.reference || (__cxx_static_address_7a1447e8106b32d1841e5acb.reference = {
    __cReference: true,
    get value() { return KICK_HIT____header_global_f1886938265ed52a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:44
export const PISTOL_RICOCHET____header_global_94da6ae15e88d16b = ((((((1) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c6afddc8522217fa70111b61() {
  return __cxx_static_address_c6afddc8522217fa70111b61.reference || (__cxx_static_address_c6afddc8522217fa70111b61.reference = {
    __cReference: true,
    get value() { return PISTOL_RICOCHET____header_global_94da6ae15e88d16b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:45
export const PISTOL_BODYHIT____header_global_71cbfccd74ee7cfc = ((((((2) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7def0838ea95c3109ff1b698() {
  return __cxx_static_address_7def0838ea95c3109ff1b698.reference || (__cxx_static_address_7def0838ea95c3109ff1b698.reference = {
    __cReference: true,
    get value() { return PISTOL_BODYHIT____header_global_71cbfccd74ee7cfc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:46
export const PISTOL_FIRE____header_global_71e7b1f2104c3ed0 = ((((((3) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fc9d3d1a2ca15e778997c2fa() {
  return __cxx_static_address_fc9d3d1a2ca15e778997c2fa.reference || (__cxx_static_address_fc9d3d1a2ca15e778997c2fa.reference = {
    __cReference: true,
    get value() { return PISTOL_FIRE____header_global_71e7b1f2104c3ed0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:47
export const EJECT_CLIP____header_global_5e76c303f89bc7b2 = ((((((4) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f4495ac62a22dd007cacb1f0() {
  return __cxx_static_address_f4495ac62a22dd007cacb1f0.reference || (__cxx_static_address_f4495ac62a22dd007cacb1f0.reference = {
    __cReference: true,
    get value() { return EJECT_CLIP____header_global_5e76c303f89bc7b2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:48
export const INSERT_CLIP____header_global_29018ee295617277 = ((((((5) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d87a1668955011ec870d253a() {
  return __cxx_static_address_d87a1668955011ec870d253a.reference || (__cxx_static_address_d87a1668955011ec870d253a.reference = {
    __cReference: true,
    get value() { return INSERT_CLIP____header_global_29018ee295617277; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:49
export const CHAINGUN_FIRE____header_global_5726a0325a0d15c7 = ((((((6) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0e724c3c4aa506b75c59b8cb() {
  return __cxx_static_address_0e724c3c4aa506b75c59b8cb.reference || (__cxx_static_address_0e724c3c4aa506b75c59b8cb.reference = {
    __cReference: true,
    get value() { return CHAINGUN_FIRE____header_global_5726a0325a0d15c7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:50
export const RPG_SHOOT____header_global_15c5d2da0ab83355 = ((((((7) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_082201649da6f2819a4c3e28() {
  return __cxx_static_address_082201649da6f2819a4c3e28.reference || (__cxx_static_address_082201649da6f2819a4c3e28.reference = {
    __cReference: true,
    get value() { return RPG_SHOOT____header_global_15c5d2da0ab83355; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:51
export const POOLBALLHIT____header_global_0c782bb34abb349f = ((((((8) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f991de4f40fdc8f762de8529() {
  return __cxx_static_address_f991de4f40fdc8f762de8529.reference || (__cxx_static_address_f991de4f40fdc8f762de8529.reference = {
    __cReference: true,
    get value() { return POOLBALLHIT____header_global_0c782bb34abb349f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:52
export const RPG_EXPLODE____header_global_6dc84850631c11ac = ((((((9) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ff113ae8f1a86d30e256fd3a() {
  return __cxx_static_address_ff113ae8f1a86d30e256fd3a.reference || (__cxx_static_address_ff113ae8f1a86d30e256fd3a.reference = {
    __cReference: true,
    get value() { return RPG_EXPLODE____header_global_6dc84850631c11ac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:53
export const CAT_FIRE____header_global_d0b7e9bc8c1f954a = ((((((10) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0c330a500fc30bc605a35f57() {
  return __cxx_static_address_0c330a500fc30bc605a35f57.reference || (__cxx_static_address_0c330a500fc30bc605a35f57.reference = {
    __cReference: true,
    get value() { return CAT_FIRE____header_global_d0b7e9bc8c1f954a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:54
export const SHRINKER_FIRE____header_global_4a7b7802b3641995 = ((((((11) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cd6e2d899f73f1dd1f2b2935() {
  return __cxx_static_address_cd6e2d899f73f1dd1f2b2935.reference || (__cxx_static_address_cd6e2d899f73f1dd1f2b2935.reference = {
    __cReference: true,
    get value() { return SHRINKER_FIRE____header_global_4a7b7802b3641995; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:55
export const PIPEBOMB_BOUNCE____header_global_69edee59278b1e11 = ((((((13) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_db2c7b6190e83896911ff7de() {
  return __cxx_static_address_db2c7b6190e83896911ff7de.reference || (__cxx_static_address_db2c7b6190e83896911ff7de.reference = {
    __cReference: true,
    get value() { return PIPEBOMB_BOUNCE____header_global_69edee59278b1e11; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:56
export const PIPEBOMB_EXPLODE____header_global_57370f2349b668cd = ((((((14) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b69bde52fc36a9a0ee6a81a2() {
  return __cxx_static_address_b69bde52fc36a9a0ee6a81a2.reference || (__cxx_static_address_b69bde52fc36a9a0ee6a81a2.reference = {
    __cReference: true,
    get value() { return PIPEBOMB_EXPLODE____header_global_57370f2349b668cd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:57
export const LASERTRIP_ONWALL____header_global_6642e2fb7344f8b0 = ((((((15) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d1f838a47be6092a5eed680a() {
  return __cxx_static_address_d1f838a47be6092a5eed680a.reference || (__cxx_static_address_d1f838a47be6092a5eed680a.reference = {
    __cReference: true,
    get value() { return LASERTRIP_ONWALL____header_global_6642e2fb7344f8b0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:58
export const LASERTRIP_ARMING____header_global_cd0a585ce0315f4d = ((((((16) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c72b8c09c5d4f12b478a4734() {
  return __cxx_static_address_c72b8c09c5d4f12b478a4734.reference || (__cxx_static_address_c72b8c09c5d4f12b478a4734.reference = {
    __cReference: true,
    get value() { return LASERTRIP_ARMING____header_global_cd0a585ce0315f4d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:59
export const LASERTRIP_EXPLODE____header_global_38f0709cd4de0da1 = ((((((17) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_42a0e9af96c0bd33c323584c() {
  return __cxx_static_address_42a0e9af96c0bd33c323584c.reference || (__cxx_static_address_42a0e9af96c0bd33c323584c.reference = {
    __cReference: true,
    get value() { return LASERTRIP_EXPLODE____header_global_38f0709cd4de0da1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:60
export const VENT_BUST____header_global_2f1e2e98743fd2fd = ((((((18) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_caba3d88e04ef9a1e21a98f8() {
  return __cxx_static_address_caba3d88e04ef9a1e21a98f8.reference || (__cxx_static_address_caba3d88e04ef9a1e21a98f8.reference = {
    __cReference: true,
    get value() { return VENT_BUST____header_global_2f1e2e98743fd2fd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:61
export const GLASS_BREAKING____header_global_88894ca37f1c40fc = ((((((19) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b98a8cd3b6f35b1934b55562() {
  return __cxx_static_address_b98a8cd3b6f35b1934b55562.reference || (__cxx_static_address_b98a8cd3b6f35b1934b55562.reference = {
    __cReference: true,
    get value() { return GLASS_BREAKING____header_global_88894ca37f1c40fc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:62
export const GLASS_HEAVYBREAK____header_global_e1cc7ac17e066c75 = ((((((20) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_000a17ae0d9c95d6a7220153() {
  return __cxx_static_address_000a17ae0d9c95d6a7220153.reference || (__cxx_static_address_000a17ae0d9c95d6a7220153.reference = {
    __cReference: true,
    get value() { return GLASS_HEAVYBREAK____header_global_e1cc7ac17e066c75; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:63
export const SHORT_CIRCUIT____header_global_818df68f2b3ae19e = ((((((21) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6108567881ae69daf18dd818() {
  return __cxx_static_address_6108567881ae69daf18dd818.reference || (__cxx_static_address_6108567881ae69daf18dd818.reference = {
    __cReference: true,
    get value() { return SHORT_CIRCUIT____header_global_818df68f2b3ae19e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:64
export const ITEM_SPLASH____header_global_d477a74290e4b2c9 = ((((((22) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c81fb91fe3cdd1d68872e1b8() {
  return __cxx_static_address_c81fb91fe3cdd1d68872e1b8.reference || (__cxx_static_address_c81fb91fe3cdd1d68872e1b8.reference = {
    __cReference: true,
    get value() { return ITEM_SPLASH____header_global_d477a74290e4b2c9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:65
export const DUKE_GASP____header_global_1d6d96cca55f269c = ((((((25) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_341bb0af1f5a831fa1d23d40() {
  return __cxx_static_address_341bb0af1f5a831fa1d23d40.reference || (__cxx_static_address_341bb0af1f5a831fa1d23d40.reference = {
    __cReference: true,
    get value() { return DUKE_GASP____header_global_1d6d96cca55f269c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:66
export const SLIM_RECOG____header_global_ec8b125808a63238 = ((((((26) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1c0ef0df762fbc5a73d14c16() {
  return __cxx_static_address_1c0ef0df762fbc5a73d14c16.reference || (__cxx_static_address_1c0ef0df762fbc5a73d14c16.reference = {
    __cReference: true,
    get value() { return SLIM_RECOG____header_global_ec8b125808a63238; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:67
export const DUKE_URINATE____header_global_8ae104ca605fe8e7 = ((((((28) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a0a07823d95e3d339300a09e() {
  return __cxx_static_address_a0a07823d95e3d339300a09e.reference || (__cxx_static_address_a0a07823d95e3d339300a09e.reference = {
    __cReference: true,
    get value() { return DUKE_URINATE____header_global_8ae104ca605fe8e7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:68
export const ENDSEQVOL3SND2____header_global_84957eb03201c615 = ((((((29) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a70b079fd4bf4c651cac9eb6() {
  return __cxx_static_address_a70b079fd4bf4c651cac9eb6.reference || (__cxx_static_address_a70b079fd4bf4c651cac9eb6.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND2____header_global_84957eb03201c615; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:69
export const ENDSEQVOL3SND3____header_global_d772ef4bf65c4b61 = ((((((30) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ada0f4f87153c872208cfc4d() {
  return __cxx_static_address_ada0f4f87153c872208cfc4d.reference || (__cxx_static_address_ada0f4f87153c872208cfc4d.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND3____header_global_d772ef4bf65c4b61; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:70
export const DUKE_CRACK____header_global_7e48f962b789e949 = ((((((33) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e9540e01121e01134c314b2b() {
  return __cxx_static_address_e9540e01121e01134c314b2b.reference || (__cxx_static_address_e9540e01121e01134c314b2b.reference = {
    __cReference: true,
    get value() { return DUKE_CRACK____header_global_7e48f962b789e949; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:71
export const SLIM_ATTACK____header_global_7e2770a17dd0458a = ((((((34) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8477a080b5b580147b37b5af() {
  return __cxx_static_address_8477a080b5b580147b37b5af.reference || (__cxx_static_address_8477a080b5b580147b37b5af.reference = {
    __cReference: true,
    get value() { return SLIM_ATTACK____header_global_7e2770a17dd0458a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:72
export const SOMETHINGHITFORCE____header_global_2a1e5976ed9c1b44 = ((((((35) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_11aa0c7d78141f43cfa377ca() {
  return __cxx_static_address_11aa0c7d78141f43cfa377ca.reference || (__cxx_static_address_11aa0c7d78141f43cfa377ca.reference = {
    __cReference: true,
    get value() { return SOMETHINGHITFORCE____header_global_2a1e5976ed9c1b44; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:73
export const DUKE_DRINKING____header_global_55d34000133c1ef6 = ((((((36) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6d0a53d2ac12ce1fe44455f4() {
  return __cxx_static_address_6d0a53d2ac12ce1fe44455f4.reference || (__cxx_static_address_6d0a53d2ac12ce1fe44455f4.reference = {
    __cReference: true,
    get value() { return DUKE_DRINKING____header_global_55d34000133c1ef6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:74
export const DUKE_GRUNT____header_global_36bfc9fc839d55a5 = ((((((38) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5c4bd0c0d305bf14ad09b357() {
  return __cxx_static_address_5c4bd0c0d305bf14ad09b357.reference || (__cxx_static_address_5c4bd0c0d305bf14ad09b357.reference = {
    __cReference: true,
    get value() { return DUKE_GRUNT____header_global_36bfc9fc839d55a5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:75
export const DUKE_HARTBEAT____header_global_b7531de9ee05add0 = ((((((39) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8339dba8d6c382b1b07a276b() {
  return __cxx_static_address_8339dba8d6c382b1b07a276b.reference || (__cxx_static_address_8339dba8d6c382b1b07a276b.reference = {
    __cReference: true,
    get value() { return DUKE_HARTBEAT____header_global_b7531de9ee05add0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:76
export const DUKE_ONWATER____header_global_2f0f1218930e68cb = ((((((40) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c7d487014a92498285dc5130() {
  return __cxx_static_address_c7d487014a92498285dc5130.reference || (__cxx_static_address_c7d487014a92498285dc5130.reference = {
    __cReference: true,
    get value() { return DUKE_ONWATER____header_global_2f0f1218930e68cb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:77
export const DUKE_LAND____header_global_b28b6c4e86300d83 = ((((((42) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c6dc2f5a6f59d5fa29159a89() {
  return __cxx_static_address_c6dc2f5a6f59d5fa29159a89.reference || (__cxx_static_address_c6dc2f5a6f59d5fa29159a89.reference = {
    __cReference: true,
    get value() { return DUKE_LAND____header_global_b28b6c4e86300d83; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:78
export const DUKE_WALKINDUCTS____header_global_c723ee2a5c01d289 = ((((((43) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ef114d35d931f76d15ab2d72() {
  return __cxx_static_address_ef114d35d931f76d15ab2d72.reference || (__cxx_static_address_ef114d35d931f76d15ab2d72.reference = {
    __cReference: true,
    get value() { return DUKE_WALKINDUCTS____header_global_c723ee2a5c01d289; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:79
export const DUKE_UNDERWATER____header_global_87d080ca8780cdb5 = ((((((48) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_de98fea73747928b5637ac2a() {
  return __cxx_static_address_de98fea73747928b5637ac2a.reference || (__cxx_static_address_de98fea73747928b5637ac2a.reference = {
    __cReference: true,
    get value() { return DUKE_UNDERWATER____header_global_87d080ca8780cdb5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:80
export const DUKE_JETPACK_ON____header_global_a4849c0e481f038d = ((((((49) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0d2f0f34e059844b64624a57() {
  return __cxx_static_address_0d2f0f34e059844b64624a57.reference || (__cxx_static_address_0d2f0f34e059844b64624a57.reference = {
    __cReference: true,
    get value() { return DUKE_JETPACK_ON____header_global_a4849c0e481f038d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:81
export const DUKE_JETPACK_IDLE____header_global_06047831ded88986 = ((((((50) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f32194694ab04b28125c4418() {
  return __cxx_static_address_f32194694ab04b28125c4418.reference || (__cxx_static_address_f32194694ab04b28125c4418.reference = {
    __cReference: true,
    get value() { return DUKE_JETPACK_IDLE____header_global_06047831ded88986; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:82
export const DUKE_JETPACK_OFF____header_global_7e3ce7dd3a63a739 = ((((((51) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_254fc7759a83f84cee83b00b() {
  return __cxx_static_address_254fc7759a83f84cee83b00b.reference || (__cxx_static_address_254fc7759a83f84cee83b00b.reference = {
    __cReference: true,
    get value() { return DUKE_JETPACK_OFF____header_global_7e3ce7dd3a63a739; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:83
export const DUKETALKTOBOSS____header_global_6c807735093f815d = ((((((56) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c7d1bd87eb12d671c064b585() {
  return __cxx_static_address_c7d1bd87eb12d671c064b585.reference || (__cxx_static_address_c7d1bd87eb12d671c064b585.reference = {
    __cReference: true,
    get value() { return DUKETALKTOBOSS____header_global_6c807735093f815d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:84
export const SQUISHED____header_global_e8e1e41623c98cdc = ((((((69) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8d855f7e6e43d429e6531fc0() {
  return __cxx_static_address_8d855f7e6e43d429e6531fc0.reference || (__cxx_static_address_8d855f7e6e43d429e6531fc0.reference = {
    __cReference: true,
    get value() { return SQUISHED____header_global_e8e1e41623c98cdc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:85
export const TELEPORTER____header_global_563a7a5ae7c53c5c = ((((((70) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6cf79ab0baed37ce4d952d28() {
  return __cxx_static_address_6cf79ab0baed37ce4d952d28.reference || (__cxx_static_address_6cf79ab0baed37ce4d952d28.reference = {
    __cReference: true,
    get value() { return TELEPORTER____header_global_563a7a5ae7c53c5c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:86
export const ELEVATOR_ON____header_global_a68b45c3ea41377e = ((((((71) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eca8fba06e3f731469cb61b7() {
  return __cxx_static_address_eca8fba06e3f731469cb61b7.reference || (__cxx_static_address_eca8fba06e3f731469cb61b7.reference = {
    __cReference: true,
    get value() { return ELEVATOR_ON____header_global_a68b45c3ea41377e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:87
export const ELEVATOR_OFF____header_global_f05277acfcc8cbf3 = ((((((73) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f572d36bbf21813f4966736c() {
  return __cxx_static_address_f572d36bbf21813f4966736c.reference || (__cxx_static_address_f572d36bbf21813f4966736c.reference = {
    __cReference: true,
    get value() { return ELEVATOR_OFF____header_global_f05277acfcc8cbf3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:88
export const SUBWAY____header_global_3920de5cd190349a = ((((((75) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4992f8f68e556c85e3116351() {
  return __cxx_static_address_4992f8f68e556c85e3116351.reference || (__cxx_static_address_4992f8f68e556c85e3116351.reference = {
    __cReference: true,
    get value() { return SUBWAY____header_global_3920de5cd190349a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:89
export const SWITCH_ON____header_global_9071455f2f662246 = ((((((76) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a3301b445f756cdc2a1e91b7() {
  return __cxx_static_address_a3301b445f756cdc2a1e91b7.reference || (__cxx_static_address_a3301b445f756cdc2a1e91b7.reference = {
    __cReference: true,
    get value() { return SWITCH_ON____header_global_9071455f2f662246; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:90
export const FLUSH_TOILET____header_global_169ec96ffa63e34d = ((((((79) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b7c114eecce9fa8286b7efb0() {
  return __cxx_static_address_b7c114eecce9fa8286b7efb0.reference || (__cxx_static_address_b7c114eecce9fa8286b7efb0.reference = {
    __cReference: true,
    get value() { return FLUSH_TOILET____header_global_169ec96ffa63e34d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:91
export const EARTHQUAKE____header_global_a12f1ef852ec7f64 = ((((((81) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6f6e20a3a30f5b7b1d63286d() {
  return __cxx_static_address_6f6e20a3a30f5b7b1d63286d.reference || (__cxx_static_address_6f6e20a3a30f5b7b1d63286d.reference = {
    __cReference: true,
    get value() { return EARTHQUAKE____header_global_a12f1ef852ec7f64; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:92
export const END_OF_LEVEL_WARN____header_global_b955ed5ce5370b76 = ((((((83) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_65e819ad321750540160b98c() {
  return __cxx_static_address_65e819ad321750540160b98c.reference || (__cxx_static_address_65e819ad321750540160b98c.reference = {
    __cReference: true,
    get value() { return END_OF_LEVEL_WARN____header_global_b955ed5ce5370b76; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:93
export const WIND_AMBIENCE____header_global_acb4005e4b0c805e = ((((((91) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_87cee92e57716bd8c06a2e66() {
  return __cxx_static_address_87cee92e57716bd8c06a2e66.reference || (__cxx_static_address_87cee92e57716bd8c06a2e66.reference = {
    __cReference: true,
    get value() { return WIND_AMBIENCE____header_global_acb4005e4b0c805e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:94
export const SOMETHING_DRIPPING____header_global_1d4b680759d2d36b = ((((((92) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a1f75963949f334685d7833f() {
  return __cxx_static_address_a1f75963949f334685d7833f.reference || (__cxx_static_address_a1f75963949f334685d7833f.reference = {
    __cReference: true,
    get value() { return SOMETHING_DRIPPING____header_global_1d4b680759d2d36b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:95
export const BOS1_RECOG____header_global_e4ad1e21ce4a5f8d = ((((((97) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7082f7bc414a935d79bf67e3() {
  return __cxx_static_address_7082f7bc414a935d79bf67e3.reference || (__cxx_static_address_7082f7bc414a935d79bf67e3.reference = {
    __cReference: true,
    get value() { return BOS1_RECOG____header_global_e4ad1e21ce4a5f8d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:96
export const BOS2_RECOG____header_global_0efae632a4ea2821 = ((((((102) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9ef835154e7ba18fc1e58a2c() {
  return __cxx_static_address_9ef835154e7ba18fc1e58a2c.reference || (__cxx_static_address_9ef835154e7ba18fc1e58a2c.reference = {
    __cReference: true,
    get value() { return BOS2_RECOG____header_global_0efae632a4ea2821; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:97
export const DUKE_GETWEAPON2____header_global_b721ce83920a930e = ((((((107) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1d4c2cdb335c25c3b87fe019() {
  return __cxx_static_address_1d4c2cdb335c25c3b87fe019.reference || (__cxx_static_address_1d4c2cdb335c25c3b87fe019.reference = {
    __cReference: true,
    get value() { return DUKE_GETWEAPON2____header_global_b721ce83920a930e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:98
export const SHOTGUN_FIRE____header_global_5bf1ee263d1e9236 = ((((((109) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b377defd1ab514fd07afa870() {
  return __cxx_static_address_b377defd1ab514fd07afa870.reference || (__cxx_static_address_b377defd1ab514fd07afa870.reference = {
    __cReference: true,
    get value() { return SHOTGUN_FIRE____header_global_5bf1ee263d1e9236; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:99
export const PRED_RECOG____header_global_a552818e7765f1ad = ((((((111) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_33a6e19ddd07de0e86b92085() {
  return __cxx_static_address_33a6e19ddd07de0e86b92085.reference || (__cxx_static_address_33a6e19ddd07de0e86b92085.reference = {
    __cReference: true,
    get value() { return PRED_RECOG____header_global_a552818e7765f1ad; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:100
export const CAPT_RECOG____header_global_6178a476c0290c8b = ((((((117) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f4439c2df013234997ffa591() {
  return __cxx_static_address_f4439c2df013234997ffa591.reference || (__cxx_static_address_f4439c2df013234997ffa591.reference = {
    __cReference: true,
    get value() { return CAPT_RECOG____header_global_6178a476c0290c8b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:101
export const PIG_RECOG____header_global_7f85ea156e18ce86 = ((((((121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_96d02e7945a317b3000c3f4c() {
  return __cxx_static_address_96d02e7945a317b3000c3f4c.reference || (__cxx_static_address_96d02e7945a317b3000c3f4c.reference = {
    __cReference: true,
    get value() { return PIG_RECOG____header_global_7f85ea156e18ce86; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:102
export const RECO_ROAM____header_global_39c9ca85872d1460 = ((((((125) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_74b07a2c5aceabb662acd946() {
  return __cxx_static_address_74b07a2c5aceabb662acd946.reference || (__cxx_static_address_74b07a2c5aceabb662acd946.reference = {
    __cReference: true,
    get value() { return RECO_ROAM____header_global_39c9ca85872d1460; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:103
export const RECO_RECOG____header_global_af0895904511f49c = ((((((126) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_086b3115b7eb5e18f22c990e() {
  return __cxx_static_address_086b3115b7eb5e18f22c990e.reference || (__cxx_static_address_086b3115b7eb5e18f22c990e.reference = {
    __cReference: true,
    get value() { return RECO_RECOG____header_global_af0895904511f49c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:104
export const RECO_ATTACK____header_global_bb13bdf94f43829c = ((((((127) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2e8a3fd78cbe2a1ff112b54d() {
  return __cxx_static_address_2e8a3fd78cbe2a1ff112b54d.reference || (__cxx_static_address_2e8a3fd78cbe2a1ff112b54d.reference = {
    __cReference: true,
    get value() { return RECO_ATTACK____header_global_bb13bdf94f43829c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:105
export const RECO_PAIN____header_global_5fae54e07ec7fe1f = ((((((128) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c1e93db2b0cda159d83d1dbc() {
  return __cxx_static_address_c1e93db2b0cda159d83d1dbc.reference || (__cxx_static_address_c1e93db2b0cda159d83d1dbc.reference = {
    __cReference: true,
    get value() { return RECO_PAIN____header_global_5fae54e07ec7fe1f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:106
export const DRON_RECOG____header_global_d06b461c180b8157 = ((((((131) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e8c225637af4f642a37f7b5b() {
  return __cxx_static_address_e8c225637af4f642a37f7b5b.reference || (__cxx_static_address_e8c225637af4f642a37f7b5b.reference = {
    __cReference: true,
    get value() { return DRON_RECOG____header_global_d06b461c180b8157; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:107
export const COMM_RECOG____header_global_a84ab2000cebdd9e = ((((((136) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d8155eea34996860cb158543() {
  return __cxx_static_address_d8155eea34996860cb158543.reference || (__cxx_static_address_d8155eea34996860cb158543.reference = {
    __cReference: true,
    get value() { return COMM_RECOG____header_global_a84ab2000cebdd9e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:108
export const OCTA_RECOG____header_global_3f406810f620d597 = ((((((141) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a58754aff70254884ad17765() {
  return __cxx_static_address_a58754aff70254884ad17765.reference || (__cxx_static_address_a58754aff70254884ad17765.reference = {
    __cReference: true,
    get value() { return OCTA_RECOG____header_global_3f406810f620d597; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:109
export const TURR_RECOG____header_global_8ba4155cfa365807 = ((((((146) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3d9468f6037a1d6cc429d1d7() {
  return __cxx_static_address_3d9468f6037a1d6cc429d1d7.reference || (__cxx_static_address_3d9468f6037a1d6cc429d1d7.reference = {
    __cReference: true,
    get value() { return TURR_RECOG____header_global_8ba4155cfa365807; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:110
export const SLIM_DYING____header_global_44e714a27acb5314 = ((((((149) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_be54664af8bb47355f0ec6df() {
  return __cxx_static_address_be54664af8bb47355f0ec6df.reference || (__cxx_static_address_be54664af8bb47355f0ec6df.reference = {
    __cReference: true,
    get value() { return SLIM_DYING____header_global_44e714a27acb5314; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:111
export const BOS3_RECOG____header_global_a86a0259ff2f5e7f = ((((((151) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7194730c8291637e9131403d() {
  return __cxx_static_address_7194730c8291637e9131403d.reference || (__cxx_static_address_7194730c8291637e9131403d.reference = {
    __cReference: true,
    get value() { return BOS3_RECOG____header_global_a86a0259ff2f5e7f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:112
export const BOS1_WALK____header_global_bf48a6ea7573459d = ((((((156) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_38250b328a002426d0aec323() {
  return __cxx_static_address_38250b328a002426d0aec323.reference || (__cxx_static_address_38250b328a002426d0aec323.reference = {
    __cReference: true,
    get value() { return BOS1_WALK____header_global_bf48a6ea7573459d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:113
export const THUD____header_global_bc7073e70a9fdecb = ((((((158) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cc20c6b56de414898014f441() {
  return __cxx_static_address_cc20c6b56de414898014f441.reference || (__cxx_static_address_cc20c6b56de414898014f441.reference = {
    __cReference: true,
    get value() { return THUD____header_global_bc7073e70a9fdecb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:114
export const WIERDSHOT_FLY____header_global_e3dfe0801990bebc = ((((((160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_501d351143ed9d3134aa0840() {
  return __cxx_static_address_501d351143ed9d3134aa0840.reference || (__cxx_static_address_501d351143ed9d3134aa0840.reference = {
    __cReference: true,
    get value() { return WIERDSHOT_FLY____header_global_e3dfe0801990bebc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:115
export const SLIM_ROAM____header_global_a90f6c745fb2f3be = ((((((163) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2c9c8cd6157e056c5fb46474() {
  return __cxx_static_address_2c9c8cd6157e056c5fb46474.reference || (__cxx_static_address_2c9c8cd6157e056c5fb46474.reference = {
    __cReference: true,
    get value() { return SLIM_ROAM____header_global_a90f6c745fb2f3be; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:116
export const SHOTGUN_COCK____header_global_8df9b45f91583aba = ((((((169) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cdb402e42503a219f063842d() {
  return __cxx_static_address_cdb402e42503a219f063842d.reference || (__cxx_static_address_cdb402e42503a219f063842d.reference = {
    __cReference: true,
    get value() { return SHOTGUN_COCK____header_global_8df9b45f91583aba; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:117
export const GENERIC_AMBIENCE17____header_global_2d2569fd2567a637 = ((((((177) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ae6b0b8b169788647d800b1f() {
  return __cxx_static_address_ae6b0b8b169788647d800b1f.reference || (__cxx_static_address_ae6b0b8b169788647d800b1f.reference = {
    __cReference: true,
    get value() { return GENERIC_AMBIENCE17____header_global_2d2569fd2567a637; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:118
export const BONUS_SPEECH1____header_global_3bf285adbd91a967 = ((((((195) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_69c5bbb2a5fce4a4503bce5f() {
  return __cxx_static_address_69c5bbb2a5fce4a4503bce5f.reference || (__cxx_static_address_69c5bbb2a5fce4a4503bce5f.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH1____header_global_3bf285adbd91a967; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:119
export const BONUS_SPEECH2____header_global_7f3c0e7c570f2c88 = ((((((196) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b04a459fea4c326caf471e8a() {
  return __cxx_static_address_b04a459fea4c326caf471e8a.reference || (__cxx_static_address_b04a459fea4c326caf471e8a.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH2____header_global_7f3c0e7c570f2c88; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:120
export const BONUS_SPEECH3____header_global_e9edd7a807c1e883 = ((((((197) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_53f7d51a5d4742d2c108a3df() {
  return __cxx_static_address_53f7d51a5d4742d2c108a3df.reference || (__cxx_static_address_53f7d51a5d4742d2c108a3df.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH3____header_global_e9edd7a807c1e883; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:121
export const BONUS_SPEECH4____header_global_6cac53ee20a14228 = ((((((199) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f7c4b87b456a0fde79938e68() {
  return __cxx_static_address_f7c4b87b456a0fde79938e68.reference || (__cxx_static_address_f7c4b87b456a0fde79938e68.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH4____header_global_6cac53ee20a14228; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:122
export const DUKE_LAND_HURT____header_global_f86b0b47bf9c4fad = ((((((200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_274285fc33970d8451d9b42b() {
  return __cxx_static_address_274285fc33970d8451d9b42b.reference || (__cxx_static_address_274285fc33970d8451d9b42b.reference = {
    __cReference: true,
    get value() { return DUKE_LAND_HURT____header_global_f86b0b47bf9c4fad; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:123
export const DUKE_SEARCH2____header_global_0da75e6cb8650915 = ((((((207) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_987181775841d5a433d9e8c5() {
  return __cxx_static_address_987181775841d5a433d9e8c5.reference || (__cxx_static_address_987181775841d5a433d9e8c5.reference = {
    __cReference: true,
    get value() { return DUKE_SEARCH2____header_global_0da75e6cb8650915; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:124
export const DUKE_CRACK2____header_global_ca62e2f231276498 = ((((((208) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6ba6ed15f223ca5ddad8cd2f() {
  return __cxx_static_address_6ba6ed15f223ca5ddad8cd2f.reference || (__cxx_static_address_6ba6ed15f223ca5ddad8cd2f.reference = {
    __cReference: true,
    get value() { return DUKE_CRACK2____header_global_ca62e2f231276498; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:125
export const DUKE_SEARCH____header_global_bedffc9f70e95f8f = ((((((209) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6aacbd79cd16705a21ab8e5e() {
  return __cxx_static_address_6aacbd79cd16705a21ab8e5e.reference || (__cxx_static_address_6aacbd79cd16705a21ab8e5e.reference = {
    __cReference: true,
    get value() { return DUKE_SEARCH____header_global_bedffc9f70e95f8f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:126
export const DUKE_GET____header_global_df45e725ede79f38 = ((((((210) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c85041554686a870ae36735a() {
  return __cxx_static_address_c85041554686a870ae36735a.reference || (__cxx_static_address_c85041554686a870ae36735a.reference = {
    __cReference: true,
    get value() { return DUKE_GET____header_global_df45e725ede79f38; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:127
export const DUKE_LONGTERM_PAIN____header_global_36091a6e5c1d1a12 = ((((((211) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e84b320c6ba73c91ee44f4b7() {
  return __cxx_static_address_e84b320c6ba73c91ee44f4b7.reference || (__cxx_static_address_e84b320c6ba73c91ee44f4b7.reference = {
    __cReference: true,
    get value() { return DUKE_LONGTERM_PAIN____header_global_36091a6e5c1d1a12; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:128
export const MONITOR_ACTIVE____header_global_a3fa52fe19674b18 = ((((((212) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d720c0e41714aaaa5f72f3e9() {
  return __cxx_static_address_d720c0e41714aaaa5f72f3e9.reference || (__cxx_static_address_d720c0e41714aaaa5f72f3e9.reference = {
    __cReference: true,
    get value() { return MONITOR_ACTIVE____header_global_a3fa52fe19674b18; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:129
export const NITEVISION_ONOFF____header_global_f9cb120a9a2bb017 = ((((((213) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8a6a1f7f27d986e8b266c8f7() {
  return __cxx_static_address_8a6a1f7f27d986e8b266c8f7.reference || (__cxx_static_address_8a6a1f7f27d986e8b266c8f7.reference = {
    __cReference: true,
    get value() { return NITEVISION_ONOFF____header_global_f9cb120a9a2bb017; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:130
export const DUKE_CRACK_FIRST____header_global_94e0d7fed27f1445 = ((((((215) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_214b32852b4deea72ace93cc() {
  return __cxx_static_address_214b32852b4deea72ace93cc.reference || (__cxx_static_address_214b32852b4deea72ace93cc.reference = {
    __cReference: true,
    get value() { return DUKE_CRACK_FIRST____header_global_94e0d7fed27f1445; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:131
export const DUKE_USEMEDKIT____header_global_20b4acd1c93c305b = ((((((216) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b6f9b40fc5d71ab16ff95c0a() {
  return __cxx_static_address_b6f9b40fc5d71ab16ff95c0a.reference || (__cxx_static_address_b6f9b40fc5d71ab16ff95c0a.reference = {
    __cReference: true,
    get value() { return DUKE_USEMEDKIT____header_global_20b4acd1c93c305b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:132
export const DUKE_TAKEPILLS____header_global_99da3caa724eb272 = ((((((217) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6926706d3cf9c957df40a0b9() {
  return __cxx_static_address_6926706d3cf9c957df40a0b9.reference || (__cxx_static_address_6926706d3cf9c957df40a0b9.reference = {
    __cReference: true,
    get value() { return DUKE_TAKEPILLS____header_global_99da3caa724eb272; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:133
export const DUKE_PISSRELIEF____header_global_4294595b5edfc1f7 = ((((((218) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dc038b46e00e7b47c678b471() {
  return __cxx_static_address_dc038b46e00e7b47c678b471.reference || (__cxx_static_address_dc038b46e00e7b47c678b471.reference = {
    __cReference: true,
    get value() { return DUKE_PISSRELIEF____header_global_4294595b5edfc1f7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:134
export const SELECT_WEAPON____header_global_173896b2f5f08b3c = ((((((219) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_685fa722ef98e69b167edcb8() {
  return __cxx_static_address_685fa722ef98e69b167edcb8.reference || (__cxx_static_address_685fa722ef98e69b167edcb8.reference = {
    __cReference: true,
    get value() { return SELECT_WEAPON____header_global_173896b2f5f08b3c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:135
export const JIBBED_ACTOR5____header_global_a61a5a2dbda76004 = ((((((226) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f92813369d3e1b2b2e37ab88() {
  return __cxx_static_address_f92813369d3e1b2b2e37ab88.reference || (__cxx_static_address_f92813369d3e1b2b2e37ab88.reference = {
    __cReference: true,
    get value() { return JIBBED_ACTOR5____header_global_a61a5a2dbda76004; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:136
export const JIBBED_ACTOR6____header_global_5abc59ff770ab384 = ((((((227) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8b75a4012283b91ffb8a7d8b() {
  return __cxx_static_address_8b75a4012283b91ffb8a7d8b.reference || (__cxx_static_address_8b75a4012283b91ffb8a7d8b.reference = {
    __cReference: true,
    get value() { return JIBBED_ACTOR6____header_global_5abc59ff770ab384; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:137
export const DUKE_GOTHEALTHATLOW____header_global_aecf235a0fb1bc15 = ((((((229) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_977a2b66bcfd5f07b1a93ca6() {
  return __cxx_static_address_977a2b66bcfd5f07b1a93ca6.reference || (__cxx_static_address_977a2b66bcfd5f07b1a93ca6.reference = {
    __cReference: true,
    get value() { return DUKE_GOTHEALTHATLOW____header_global_aecf235a0fb1bc15; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:138
export const BOSSTALKTODUKE____header_global_b93d95162a42a3ba = ((((((230) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9c3cda0fbf6b868e7e7360b7() {
  return __cxx_static_address_9c3cda0fbf6b868e7e7360b7.reference || (__cxx_static_address_9c3cda0fbf6b868e7e7360b7.reference = {
    __cReference: true,
    get value() { return BOSSTALKTODUKE____header_global_b93d95162a42a3ba; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:139
export const WAR_AMBIENCE2____header_global_0406cade4fc51862 = ((((((232) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_25230a1eb4b6f36c077f9770() {
  return __cxx_static_address_25230a1eb4b6f36c077f9770.reference || (__cxx_static_address_25230a1eb4b6f36c077f9770.reference = {
    __cReference: true,
    get value() { return WAR_AMBIENCE2____header_global_0406cade4fc51862; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:140
export const EXITMENUSOUND____header_global_404b84028e888bbd = ((((((243) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_82336efb28521c1695050243() {
  return __cxx_static_address_82336efb28521c1695050243.reference || (__cxx_static_address_82336efb28521c1695050243.reference = {
    __cReference: true,
    get value() { return EXITMENUSOUND____header_global_404b84028e888bbd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:141
export const FLY_BY____header_global_879c9f6ecf8ad41f = ((((((244) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7179301f83970d656ac5f3a0() {
  return __cxx_static_address_7179301f83970d656ac5f3a0.reference || (__cxx_static_address_7179301f83970d656ac5f3a0.reference = {
    __cReference: true,
    get value() { return FLY_BY____header_global_879c9f6ecf8ad41f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:142
export const DUKE_SCREAM____header_global_df8c3028263e28af = ((((((245) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1f954915374bbb9805faba65() {
  return __cxx_static_address_1f954915374bbb9805faba65.reference || (__cxx_static_address_1f954915374bbb9805faba65.reference = {
    __cReference: true,
    get value() { return DUKE_SCREAM____header_global_df8c3028263e28af; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:143
export const SHRINKER_HIT____header_global_de461022b1999aa9 = ((((((246) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7ff9f90119bd972705e73778() {
  return __cxx_static_address_7ff9f90119bd972705e73778.reference || (__cxx_static_address_7ff9f90119bd972705e73778.reference = {
    __cReference: true,
    get value() { return SHRINKER_HIT____header_global_de461022b1999aa9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:144
export const RATTY____header_global_55a01d6c4ae44abd = ((((((247) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_337e4061d6145f3ed68f94d5() {
  return __cxx_static_address_337e4061d6145f3ed68f94d5.reference || (__cxx_static_address_337e4061d6145f3ed68f94d5.reference = {
    __cReference: true,
    get value() { return RATTY____header_global_55a01d6c4ae44abd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:145
export const BONUSMUSIC____header_global_c8646153bfff83a2 = ((((((249) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_960181197feb1d165765a46f() {
  return __cxx_static_address_960181197feb1d165765a46f.reference || (__cxx_static_address_960181197feb1d165765a46f.reference = {
    __cReference: true,
    get value() { return BONUSMUSIC____header_global_c8646153bfff83a2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:146
export const DUKE_GETWEAPON6____header_global_d2384ba8468fb5bf = ((((((264) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0e54bc419704b45b3972cd9e() {
  return __cxx_static_address_0e54bc419704b45b3972cd9e.reference || (__cxx_static_address_0e54bc419704b45b3972cd9e.reference = {
    __cReference: true,
    get value() { return DUKE_GETWEAPON6____header_global_d2384ba8468fb5bf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:147
export const ALIEN_SWITCH1____header_global_74b2293b9884d6fe = ((((((272) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9eb085306e10d7362b170e0a() {
  return __cxx_static_address_9eb085306e10d7362b170e0a.reference || (__cxx_static_address_9eb085306e10d7362b170e0a.reference = {
    __cReference: true,
    get value() { return ALIEN_SWITCH1____header_global_74b2293b9884d6fe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:148
export const RIPHEADNECK____header_global_3cb5667b57c594fb = ((((((284) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5a653bb9f420131f408dfa19() {
  return __cxx_static_address_5a653bb9f420131f408dfa19.reference || (__cxx_static_address_5a653bb9f420131f408dfa19.reference = {
    __cReference: true,
    get value() { return RIPHEADNECK____header_global_3cb5667b57c594fb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:149
export const ENDSEQVOL3SND4____header_global_ce5276f7a88b609b = ((((((288) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7b4e861d0057c14db05dbed6() {
  return __cxx_static_address_7b4e861d0057c14db05dbed6.reference || (__cxx_static_address_7b4e861d0057c14db05dbed6.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND4____header_global_ce5276f7a88b609b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:150
export const ENDSEQVOL3SND5____header_global_6887f09db406c567 = ((((((289) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_05fc784e4cb1d52caaa9865b() {
  return __cxx_static_address_05fc784e4cb1d52caaa9865b.reference || (__cxx_static_address_05fc784e4cb1d52caaa9865b.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND5____header_global_6887f09db406c567; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:151
export const ENDSEQVOL3SND6____header_global_999a766e355d79ef = ((((((290) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b29c511d8d9cc4fc33ed36c5() {
  return __cxx_static_address_b29c511d8d9cc4fc33ed36c5.reference || (__cxx_static_address_b29c511d8d9cc4fc33ed36c5.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND6____header_global_999a766e355d79ef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:152
export const ENDSEQVOL3SND7____header_global_c402f7f5ceaf2bb3 = ((((((291) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f938a4ef75ece5b23c4f9713() {
  return __cxx_static_address_f938a4ef75ece5b23c4f9713.reference || (__cxx_static_address_f938a4ef75ece5b23c4f9713.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND7____header_global_c402f7f5ceaf2bb3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:153
export const ENDSEQVOL3SND8____header_global_7535208233a3b5b5 = ((((((292) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a6eafa4d82f212eed357c84e() {
  return __cxx_static_address_a6eafa4d82f212eed357c84e.reference || (__cxx_static_address_a6eafa4d82f212eed357c84e.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND8____header_global_7535208233a3b5b5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:154
export const ENDSEQVOL3SND9____header_global_6b0dc0fd94774297 = ((((((293) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8672c4c7b699e8620e47219b() {
  return __cxx_static_address_8672c4c7b699e8620e47219b.reference || (__cxx_static_address_8672c4c7b699e8620e47219b.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND9____header_global_6b0dc0fd94774297; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:155
export const WHIPYOURASS____header_global_a128b848d4b9491c = ((((((294) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fdaa035282f5fce038ae6dab() {
  return __cxx_static_address_fdaa035282f5fce038ae6dab.reference || (__cxx_static_address_fdaa035282f5fce038ae6dab.reference = {
    __cReference: true,
    get value() { return WHIPYOURASS____header_global_a128b848d4b9491c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:156
export const ENDSEQVOL2SND1____header_global_784c8c070926b2a8 = ((((((295) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7a30993594f32d9b76abc02d() {
  return __cxx_static_address_7a30993594f32d9b76abc02d.reference || (__cxx_static_address_7a30993594f32d9b76abc02d.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND1____header_global_784c8c070926b2a8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:157
export const ENDSEQVOL2SND2____header_global_0d432e0eca2b6df9 = ((((((296) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cd249bf99361c7b2aa5876fb() {
  return __cxx_static_address_cd249bf99361c7b2aa5876fb.reference || (__cxx_static_address_cd249bf99361c7b2aa5876fb.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND2____header_global_0d432e0eca2b6df9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:158
export const ENDSEQVOL2SND3____header_global_18aa4e4fbcd65417 = ((((((297) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2969b5ebe2e0d24425600699() {
  return __cxx_static_address_2969b5ebe2e0d24425600699.reference || (__cxx_static_address_2969b5ebe2e0d24425600699.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND3____header_global_18aa4e4fbcd65417; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:159
export const ENDSEQVOL2SND4____header_global_43b94f4172dea888 = ((((((298) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3695cbb2976aaf6829fd2129() {
  return __cxx_static_address_3695cbb2976aaf6829fd2129.reference || (__cxx_static_address_3695cbb2976aaf6829fd2129.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND4____header_global_43b94f4172dea888; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:160
export const ENDSEQVOL2SND5____header_global_6367886dc7461fe3 = ((((((299) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3f7b983a9c3e7bd827dc1fcc() {
  return __cxx_static_address_3f7b983a9c3e7bd827dc1fcc.reference || (__cxx_static_address_3f7b983a9c3e7bd827dc1fcc.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND5____header_global_6367886dc7461fe3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:161
export const ENDSEQVOL2SND6____header_global_f6fe6e8eb2b6269f = ((((((300) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7648a76d8a18277e9e38e77c() {
  return __cxx_static_address_7648a76d8a18277e9e38e77c.reference || (__cxx_static_address_7648a76d8a18277e9e38e77c.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND6____header_global_f6fe6e8eb2b6269f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:162
export const ENDSEQVOL2SND7____header_global_09874cf13b023ded = ((((((301) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d84507aadf765147536b4cc4() {
  return __cxx_static_address_d84507aadf765147536b4cc4.reference || (__cxx_static_address_d84507aadf765147536b4cc4.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND7____header_global_09874cf13b023ded; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:163
export const SOMETHINGFROZE____header_global_b4fc586c38b3496f = ((((((303) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_56ad91b6d532bdb6bb0d50c2() {
  return __cxx_static_address_56ad91b6d532bdb6bb0d50c2.reference || (__cxx_static_address_56ad91b6d532bdb6bb0d50c2.reference = {
    __cReference: true,
    get value() { return SOMETHINGFROZE____header_global_b4fc586c38b3496f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:164
export const WIND_REPEAT____header_global_88e3c043a81fd4dc = ((((((308) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dd88fcc419dddff3f39133a4() {
  return __cxx_static_address_dd88fcc419dddff3f39133a4.reference || (__cxx_static_address_dd88fcc419dddff3f39133a4.reference = {
    __cReference: true,
    get value() { return WIND_REPEAT____header_global_88e3c043a81fd4dc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:165
export const BOS4_RECOG____header_global_1a53e9b05b20d598 = ((((((342) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b7180024b34473c9f603bafd() {
  return __cxx_static_address_b7180024b34473c9f603bafd.reference || (__cxx_static_address_b7180024b34473c9f603bafd.reference = {
    __cReference: true,
    get value() { return BOS4_RECOG____header_global_1a53e9b05b20d598; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:166
export const LIGHTNING_SLAP____header_global_b5f21a41b2dd2ccf = ((((((351) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8398df9649d809bbea8b324e() {
  return __cxx_static_address_8398df9649d809bbea8b324e.reference || (__cxx_static_address_8398df9649d809bbea8b324e.reference = {
    __cReference: true,
    get value() { return LIGHTNING_SLAP____header_global_b5f21a41b2dd2ccf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:167
export const THUNDER____header_global_9e9f58c64fd3bdb3 = ((((((352) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a83bd3f586c226c8af0ee5e3() {
  return __cxx_static_address_a83bd3f586c226c8af0ee5e3.reference || (__cxx_static_address_a83bd3f586c226c8af0ee5e3.reference = {
    __cReference: true,
    get value() { return THUNDER____header_global_9e9f58c64fd3bdb3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:168
export const INTRO4_1____header_global_0389d0542778ba1d = ((((((363) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5a4d9f66c5ffcea21ae81945() {
  return __cxx_static_address_5a4d9f66c5ffcea21ae81945.reference || (__cxx_static_address_5a4d9f66c5ffcea21ae81945.reference = {
    __cReference: true,
    get value() { return INTRO4_1____header_global_0389d0542778ba1d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:169
export const INTRO4_2____header_global_46b285a229163364 = ((((((364) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1d69dad3e163962c3e6371ec() {
  return __cxx_static_address_1d69dad3e163962c3e6371ec.reference || (__cxx_static_address_1d69dad3e163962c3e6371ec.reference = {
    __cReference: true,
    get value() { return INTRO4_2____header_global_46b285a229163364; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:170
export const INTRO4_3____header_global_9c97c2e4fcea6edd = ((((((365) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_90c7d5b1e0b06c8bd61d0637() {
  return __cxx_static_address_90c7d5b1e0b06c8bd61d0637.reference || (__cxx_static_address_90c7d5b1e0b06c8bd61d0637.reference = {
    __cReference: true,
    get value() { return INTRO4_3____header_global_9c97c2e4fcea6edd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:171
export const INTRO4_4____header_global_665d3947d3617679 = ((((((366) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e6e4c7c3eea8eee64cd084e6() {
  return __cxx_static_address_e6e4c7c3eea8eee64cd084e6.reference || (__cxx_static_address_e6e4c7c3eea8eee64cd084e6.reference = {
    __cReference: true,
    get value() { return INTRO4_4____header_global_665d3947d3617679; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:172
export const INTRO4_5____header_global_c41c807b891e5c9f = ((((((367) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0bea5e78a127e8c9c7a03eff() {
  return __cxx_static_address_0bea5e78a127e8c9c7a03eff.reference || (__cxx_static_address_0bea5e78a127e8c9c7a03eff.reference = {
    __cReference: true,
    get value() { return INTRO4_5____header_global_c41c807b891e5c9f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:173
export const INTRO4_6____header_global_3da43baf7fdc5111 = ((((((368) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_02b36924ef9a56647e7d4595() {
  return __cxx_static_address_02b36924ef9a56647e7d4595.reference || (__cxx_static_address_02b36924ef9a56647e7d4595.reference = {
    __cReference: true,
    get value() { return INTRO4_6____header_global_3da43baf7fdc5111; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:174
export const BOSS4_DEADSPEECH____header_global_e4fa351c025fa4b0 = ((((((370) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c422cd863cfd6b56856cc60f() {
  return __cxx_static_address_c422cd863cfd6b56856cc60f.reference || (__cxx_static_address_c422cd863cfd6b56856cc60f.reference = {
    __cReference: true,
    get value() { return BOSS4_DEADSPEECH____header_global_e4fa351c025fa4b0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:175
export const BOSS4_FIRSTSEE____header_global_9bf1de6b2b881274 = ((((((371) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9e49190b172bb497d23a3228() {
  return __cxx_static_address_9e49190b172bb497d23a3228.reference || (__cxx_static_address_9e49190b172bb497d23a3228.reference = {
    __cReference: true,
    get value() { return BOSS4_FIRSTSEE____header_global_9bf1de6b2b881274; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:176
export const VOL4ENDSND1____header_global_7697644fd8af8195 = ((((((384) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f95f27b6848ff4f640c5cf37() {
  return __cxx_static_address_f95f27b6848ff4f640c5cf37.reference || (__cxx_static_address_f95f27b6848ff4f640c5cf37.reference = {
    __cReference: true,
    get value() { return VOL4ENDSND1____header_global_7697644fd8af8195; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:177
export const VOL4ENDSND2____header_global_645f4317ba88824e = ((((((385) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_340347b7c13b9e70d0685611() {
  return __cxx_static_address_340347b7c13b9e70d0685611.reference || (__cxx_static_address_340347b7c13b9e70d0685611.reference = {
    __cReference: true,
    get value() { return VOL4ENDSND2____header_global_645f4317ba88824e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:178
export const EXPANDERSHOOT____header_global_4e633a79bbce3262 = ((((((388) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_df3378e1329c4c66dc0c28e9() {
  return __cxx_static_address_df3378e1329c4c66dc0c28e9.reference || (__cxx_static_address_df3378e1329c4c66dc0c28e9.reference = {
    __cReference: true,
    get value() { return EXPANDERSHOOT____header_global_4e633a79bbce3262; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:179
export const INTRO4_B____header_global_977bab816236e551 = ((((((392) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_43dc46fb2ffab058a10dfbd5() {
  return __cxx_static_address_43dc46fb2ffab058a10dfbd5.reference || (__cxx_static_address_43dc46fb2ffab058a10dfbd5.reference = {
    __cReference: true,
    get value() { return INTRO4_B____header_global_977bab816236e551; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:180
export const BIGBANG____header_global_39296e7c2e816f9f = ((((((393) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_512e2641d44b37fb3d7c92a1() {
  return __cxx_static_address_512e2641d44b37fb3d7c92a1.reference || (__cxx_static_address_512e2641d44b37fb3d7c92a1.reference = {
    __cReference: true,
    get value() { return BIGBANG____header_global_39296e7c2e816f9f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:181
export const FLAMETHROWER_INTRO____header_global_288ab5400cd99b77 = ((((((398) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8d25d37684cf66906ce880ba() {
  return __cxx_static_address_8d25d37684cf66906ce880ba.reference || (__cxx_static_address_8d25d37684cf66906ce880ba.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER_INTRO____header_global_288ab5400cd99b77; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:182
export const FLAMETHROWER_LOOP____header_global_23097fcb857e2939 = ((((((399) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7dbcbd4dbadc1eb12a1dcfbe() {
  return __cxx_static_address_7dbcbd4dbadc1eb12a1dcfbe.reference || (__cxx_static_address_7dbcbd4dbadc1eb12a1dcfbe.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER_LOOP____header_global_23097fcb857e2939; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:183
export const FLAMETHROWER_END____header_global_1d64400c790f2ae7 = ((((((400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5be8148c87b95c65cab6669c() {
  return __cxx_static_address_5be8148c87b95c65cab6669c.reference || (__cxx_static_address_5be8148c87b95c65cab6669c.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER_END____header_global_1d64400c790f2ae7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:184
export const E5L7_DUKE_QUIT_YOU____header_global_8dbacb46d512a7b2 = ((((((401) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d8df5a5d60758048a6c9560f() {
  return __cxx_static_address_d8df5a5d60758048a6c9560f.reference || (__cxx_static_address_d8df5a5d60758048a6c9560f.reference = {
    __cReference: true,
    get value() { return E5L7_DUKE_QUIT_YOU____header_global_8dbacb46d512a7b2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:187
export const SECTOREFFECTOR____header_global_03a16c280a8abab3 = ((((((1) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e74f836916bf310cdbceba9d() {
  return __cxx_static_address_e74f836916bf310cdbceba9d.reference || (__cxx_static_address_e74f836916bf310cdbceba9d.reference = {
    __cReference: true,
    get value() { return SECTOREFFECTOR____header_global_03a16c280a8abab3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:188
export const ACTIVATOR____header_global_8c677d1684601898 = ((((((2) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a4f5c8c1cebb6c59118afc75() {
  return __cxx_static_address_a4f5c8c1cebb6c59118afc75.reference || (__cxx_static_address_a4f5c8c1cebb6c59118afc75.reference = {
    __cReference: true,
    get value() { return ACTIVATOR____header_global_8c677d1684601898; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:189
export const TOUCHPLATE____header_global_78a08cc8400decdd = ((((((3) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6b4ad754db5f2c77ad43407a() {
  return __cxx_static_address_6b4ad754db5f2c77ad43407a.reference || (__cxx_static_address_6b4ad754db5f2c77ad43407a.reference = {
    __cReference: true,
    get value() { return TOUCHPLATE____header_global_78a08cc8400decdd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:190
export const ACTIVATORLOCKED____header_global_13bf5080abf00242 = ((((((4) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5f028922bc697ef898101530() {
  return __cxx_static_address_5f028922bc697ef898101530.reference || (__cxx_static_address_5f028922bc697ef898101530.reference = {
    __cReference: true,
    get value() { return ACTIVATORLOCKED____header_global_13bf5080abf00242; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:191
export const MUSICANDSFX____header_global_af7f8e97e84e780f = ((((((5) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f3dbe7816d68856a5aeffc7c() {
  return __cxx_static_address_f3dbe7816d68856a5aeffc7c.reference || (__cxx_static_address_f3dbe7816d68856a5aeffc7c.reference = {
    __cReference: true,
    get value() { return MUSICANDSFX____header_global_af7f8e97e84e780f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:192
export const LOCATORS____header_global_c8de75f7f52f61ed = ((((((6) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_04b482be14746b9326cd299a() {
  return __cxx_static_address_04b482be14746b9326cd299a.reference || (__cxx_static_address_04b482be14746b9326cd299a.reference = {
    __cReference: true,
    get value() { return LOCATORS____header_global_c8de75f7f52f61ed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:193
export const CYCLER____header_global_9e361d248ba9b860 = ((((((7) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b74b7ee1f6f7a54f396ccebe() {
  return __cxx_static_address_b74b7ee1f6f7a54f396ccebe.reference || (__cxx_static_address_b74b7ee1f6f7a54f396ccebe.reference = {
    __cReference: true,
    get value() { return CYCLER____header_global_9e361d248ba9b860; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:194
export const MASTERSWITCH____header_global_b44963355e440b23 = ((((((8) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a9a4215f7e7c545eee53f97d() {
  return __cxx_static_address_a9a4215f7e7c545eee53f97d.reference || (__cxx_static_address_a9a4215f7e7c545eee53f97d.reference = {
    __cReference: true,
    get value() { return MASTERSWITCH____header_global_b44963355e440b23; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:195
export const RESPAWN____header_global_3adeb6ffd63fe5c7 = ((((((9) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4cb56cfc7ea3e1d6e4b4b4db() {
  return __cxx_static_address_4cb56cfc7ea3e1d6e4b4b4db.reference || (__cxx_static_address_4cb56cfc7ea3e1d6e4b4b4db.reference = {
    __cReference: true,
    get value() { return RESPAWN____header_global_3adeb6ffd63fe5c7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:196
export const GPSPEED____header_global_2ff6c403e77365ae = ((((((10) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3f14d52232eafa341eb881bb() {
  return __cxx_static_address_3f14d52232eafa341eb881bb.reference || (__cxx_static_address_3f14d52232eafa341eb881bb.reference = {
    __cReference: true,
    get value() { return GPSPEED____header_global_2ff6c403e77365ae; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:197
export const FOF____header_global_70846ba31e5c1afb = ((((((13) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ddc103afec303cdc557550f7() {
  return __cxx_static_address_ddc103afec303cdc557550f7.reference || (__cxx_static_address_ddc103afec303cdc557550f7.reference = {
    __cReference: true,
    get value() { return FOF____header_global_70846ba31e5c1afb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:198
export const ARROW____header_global_0cd46d8667b1c601 = ((((((20) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1c0e81c03a69649f0efb2be1() {
  return __cxx_static_address_1c0e81c03a69649f0efb2be1.reference || (__cxx_static_address_1c0e81c03a69649f0efb2be1.reference = {
    __cReference: true,
    get value() { return ARROW____header_global_0cd46d8667b1c601; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:199
export const FIRSTGUNSPRITE____header_global_e51f2923b85ddc3a = ((((((21) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c90f059fec40329635f98ac9() {
  return __cxx_static_address_c90f059fec40329635f98ac9.reference || (__cxx_static_address_c90f059fec40329635f98ac9.reference = {
    __cReference: true,
    get value() { return FIRSTGUNSPRITE____header_global_e51f2923b85ddc3a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:200
export const CHAINGUNSPRITE____header_global_d37d7e13f48d5ef2 = ((((((22) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_45d1f9587c450879bf7a5485() {
  return __cxx_static_address_45d1f9587c450879bf7a5485.reference || (__cxx_static_address_45d1f9587c450879bf7a5485.reference = {
    __cReference: true,
    get value() { return CHAINGUNSPRITE____header_global_d37d7e13f48d5ef2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:201
export const RPGSPRITE____header_global_066c410c336420e5 = ((((((23) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_12b50c03b1a61473e5cd7b38() {
  return __cxx_static_address_12b50c03b1a61473e5cd7b38.reference || (__cxx_static_address_12b50c03b1a61473e5cd7b38.reference = {
    __cReference: true,
    get value() { return RPGSPRITE____header_global_066c410c336420e5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:202
export const FREEZESPRITE____header_global_2f0e764f6e25069d = ((((((24) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cdcc1eda418b536b1b11d545() {
  return __cxx_static_address_cdcc1eda418b536b1b11d545.reference || (__cxx_static_address_cdcc1eda418b536b1b11d545.reference = {
    __cReference: true,
    get value() { return FREEZESPRITE____header_global_2f0e764f6e25069d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:203
export const SHRINKERSPRITE____header_global_7c2ecee5231e301a = ((((((25) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aa19c4ec1fc1dc9a9dff908f() {
  return __cxx_static_address_aa19c4ec1fc1dc9a9dff908f.reference || (__cxx_static_address_aa19c4ec1fc1dc9a9dff908f.reference = {
    __cReference: true,
    get value() { return SHRINKERSPRITE____header_global_7c2ecee5231e301a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:204
export const HEAVYHBOMB____header_global_5a4ab7f1f5ff0277 = ((((((26) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2f187dd63535a4efcdb39fb3() {
  return __cxx_static_address_2f187dd63535a4efcdb39fb3.reference || (__cxx_static_address_2f187dd63535a4efcdb39fb3.reference = {
    __cReference: true,
    get value() { return HEAVYHBOMB____header_global_5a4ab7f1f5ff0277; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:205
export const TRIPBOMBSPRITE____header_global_3f9abf3ea7ea5ea3 = ((((((27) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3ca08c87d2ec1b6fcb38f9a0() {
  return __cxx_static_address_3ca08c87d2ec1b6fcb38f9a0.reference || (__cxx_static_address_3ca08c87d2ec1b6fcb38f9a0.reference = {
    __cReference: true,
    get value() { return TRIPBOMBSPRITE____header_global_3f9abf3ea7ea5ea3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:206
export const SHOTGUNSPRITE____header_global_4f34f54c276001ef = ((((((28) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e2202627d39ef8b9443e9f99() {
  return __cxx_static_address_e2202627d39ef8b9443e9f99.reference || (__cxx_static_address_e2202627d39ef8b9443e9f99.reference = {
    __cReference: true,
    get value() { return SHOTGUNSPRITE____header_global_4f34f54c276001ef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:207
export const DEVISTATORSPRITE____header_global_cbde8299850b9be3 = ((((((29) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_26501caa97665495acd2ceb4() {
  return __cxx_static_address_26501caa97665495acd2ceb4.reference || (__cxx_static_address_26501caa97665495acd2ceb4.reference = {
    __cReference: true,
    get value() { return DEVISTATORSPRITE____header_global_cbde8299850b9be3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:208
export const HEALTHBOX____header_global_68796fe0a659d471 = ((((((30) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_764875020d338f1723492503() {
  return __cxx_static_address_764875020d338f1723492503.reference || (__cxx_static_address_764875020d338f1723492503.reference = {
    __cReference: true,
    get value() { return HEALTHBOX____header_global_68796fe0a659d471; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:209
export const AMMOBOX____header_global_8373c58d09e5e6d0 = ((((((31) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9be8bd88c6a59df48a4abb2c() {
  return __cxx_static_address_9be8bd88c6a59df48a4abb2c.reference || (__cxx_static_address_9be8bd88c6a59df48a4abb2c.reference = {
    __cReference: true,
    get value() { return AMMOBOX____header_global_8373c58d09e5e6d0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:210
export const GROWSPRITEICON____header_global_144a59e7a3892d50 = ((((((32) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d7a37ac8e2e816109e13457f() {
  return __cxx_static_address_d7a37ac8e2e816109e13457f.reference || (__cxx_static_address_d7a37ac8e2e816109e13457f.reference = {
    __cReference: true,
    get value() { return GROWSPRITEICON____header_global_144a59e7a3892d50; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:211
export const INVENTORYBOX____header_global_1a52cf04e87c5f2c = ((((((33) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2a536aaf361974c46620798c() {
  return __cxx_static_address_2a536aaf361974c46620798c.reference || (__cxx_static_address_2a536aaf361974c46620798c.reference = {
    __cReference: true,
    get value() { return INVENTORYBOX____header_global_1a52cf04e87c5f2c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:212
export const FREEZEAMMO____header_global_8d8b13335cd81c5d = ((((((37) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_14f1f447d1b44ad4bc2f3c2e() {
  return __cxx_static_address_14f1f447d1b44ad4bc2f3c2e.reference || (__cxx_static_address_14f1f447d1b44ad4bc2f3c2e.reference = {
    __cReference: true,
    get value() { return FREEZEAMMO____header_global_8d8b13335cd81c5d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:213
export const AMMO____header_global_123319fe0c66f4dd = ((((((40) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1c049866edbff5c96c9d7da4() {
  return __cxx_static_address_1c049866edbff5c96c9d7da4.reference || (__cxx_static_address_1c049866edbff5c96c9d7da4.reference = {
    __cReference: true,
    get value() { return AMMO____header_global_123319fe0c66f4dd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:214
export const BATTERYAMMO____header_global_a5e1254966b254bd = ((((((41) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b462dd3603f3b48be5387842() {
  return __cxx_static_address_b462dd3603f3b48be5387842.reference || (__cxx_static_address_b462dd3603f3b48be5387842.reference = {
    __cReference: true,
    get value() { return BATTERYAMMO____header_global_a5e1254966b254bd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:215
export const DEVISTATORAMMO____header_global_81ef140e4af8dcb5 = ((((((42) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_88fc9a1a85e4114c2c3e2598() {
  return __cxx_static_address_88fc9a1a85e4114c2c3e2598.reference || (__cxx_static_address_88fc9a1a85e4114c2c3e2598.reference = {
    __cReference: true,
    get value() { return DEVISTATORAMMO____header_global_81ef140e4af8dcb5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:216
export const RPGAMMO____header_global_d80e5b211c5a7eff = ((((((44) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d9b6ce4becd7fc4265642d26() {
  return __cxx_static_address_d9b6ce4becd7fc4265642d26.reference || (__cxx_static_address_d9b6ce4becd7fc4265642d26.reference = {
    __cReference: true,
    get value() { return RPGAMMO____header_global_d80e5b211c5a7eff; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:217
export const GROWAMMO____header_global_0a7f74c66d692fb5 = ((((((45) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_db17b49f5ed99a1ec4496c91() {
  return __cxx_static_address_db17b49f5ed99a1ec4496c91.reference || (__cxx_static_address_db17b49f5ed99a1ec4496c91.reference = {
    __cReference: true,
    get value() { return GROWAMMO____header_global_0a7f74c66d692fb5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:218
export const CRYSTALAMMO____header_global_257320a410e99d1f = ((((((46) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_49c15be616db1fe8fbb55924() {
  return __cxx_static_address_49c15be616db1fe8fbb55924.reference || (__cxx_static_address_49c15be616db1fe8fbb55924.reference = {
    __cReference: true,
    get value() { return CRYSTALAMMO____header_global_257320a410e99d1f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:219
export const HBOMBAMMO____header_global_43ae0f9da947926d = ((((((47) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d835a8fddd97081a347c44ad() {
  return __cxx_static_address_d835a8fddd97081a347c44ad.reference || (__cxx_static_address_d835a8fddd97081a347c44ad.reference = {
    __cReference: true,
    get value() { return HBOMBAMMO____header_global_43ae0f9da947926d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:220
export const AMMOLOTS____header_global_577e630e0c29ff1f = ((((((48) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_23eefba01caea5dda882bc1e() {
  return __cxx_static_address_23eefba01caea5dda882bc1e.reference || (__cxx_static_address_23eefba01caea5dda882bc1e.reference = {
    __cReference: true,
    get value() { return AMMOLOTS____header_global_577e630e0c29ff1f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:221
export const SHOTGUNAMMO____header_global_fbcfc634d34d33fa = ((((((49) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eebc1d53aaa61d6c428f6aee() {
  return __cxx_static_address_eebc1d53aaa61d6c428f6aee.reference || (__cxx_static_address_eebc1d53aaa61d6c428f6aee.reference = {
    __cReference: true,
    get value() { return SHOTGUNAMMO____header_global_fbcfc634d34d33fa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:222
export const COLA____header_global_c53ea1e00130ca1a = ((((((51) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9bb625003acc27420c72663e() {
  return __cxx_static_address_9bb625003acc27420c72663e.reference || (__cxx_static_address_9bb625003acc27420c72663e.reference = {
    __cReference: true,
    get value() { return COLA____header_global_c53ea1e00130ca1a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:223
export const SIXPAK____header_global_515427fb1ff17693 = ((((((52) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cb52ed2827330c7491cdb741() {
  return __cxx_static_address_cb52ed2827330c7491cdb741.reference || (__cxx_static_address_cb52ed2827330c7491cdb741.reference = {
    __cReference: true,
    get value() { return SIXPAK____header_global_515427fb1ff17693; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:224
export const FIRSTAID____header_global_05ad39f57e9c05a7 = ((((((53) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a07e9a33bae29641e9bd7fff() {
  return __cxx_static_address_a07e9a33bae29641e9bd7fff.reference || (__cxx_static_address_a07e9a33bae29641e9bd7fff.reference = {
    __cReference: true,
    get value() { return FIRSTAID____header_global_05ad39f57e9c05a7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:225
export const SHIELD____header_global_b4865114d7520acd = ((((((54) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_efca9e2ba580c363ec562552() {
  return __cxx_static_address_efca9e2ba580c363ec562552.reference || (__cxx_static_address_efca9e2ba580c363ec562552.reference = {
    __cReference: true,
    get value() { return SHIELD____header_global_b4865114d7520acd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:226
export const STEROIDS____header_global_7bfc10f66c37fd77 = ((((((55) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4c87f9b9180e650b58947097() {
  return __cxx_static_address_4c87f9b9180e650b58947097.reference || (__cxx_static_address_4c87f9b9180e650b58947097.reference = {
    __cReference: true,
    get value() { return STEROIDS____header_global_7bfc10f66c37fd77; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:227
export const AIRTANK____header_global_75c1762d815a3895 = ((((((56) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ed6b10ef6223e1c85ebd2919() {
  return __cxx_static_address_ed6b10ef6223e1c85ebd2919.reference || (__cxx_static_address_ed6b10ef6223e1c85ebd2919.reference = {
    __cReference: true,
    get value() { return AIRTANK____header_global_75c1762d815a3895; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:228
export const JETPACK____header_global_a3d89485081cdab4 = ((((((57) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_90fec72bdb79771c0f7a42ec() {
  return __cxx_static_address_90fec72bdb79771c0f7a42ec.reference || (__cxx_static_address_90fec72bdb79771c0f7a42ec.reference = {
    __cReference: true,
    get value() { return JETPACK____header_global_a3d89485081cdab4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:229
export const HEATSENSOR____header_global_edcfeae3dc2d4eed = ((((((59) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5f373fc2447b3e4a2989db31() {
  return __cxx_static_address_5f373fc2447b3e4a2989db31.reference || (__cxx_static_address_5f373fc2447b3e4a2989db31.reference = {
    __cReference: true,
    get value() { return HEATSENSOR____header_global_edcfeae3dc2d4eed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:230
export const ACCESSCARD____header_global_32ad913a678022b0 = ((((((60) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_39eeeef284846b264d0912e2() {
  return __cxx_static_address_39eeeef284846b264d0912e2.reference || (__cxx_static_address_39eeeef284846b264d0912e2.reference = {
    __cReference: true,
    get value() { return ACCESSCARD____header_global_32ad913a678022b0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:231
export const BOOTS____header_global_edadf120042c3a47 = ((((((61) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_80d3ca895853eab74bbe5021() {
  return __cxx_static_address_80d3ca895853eab74bbe5021.reference || (__cxx_static_address_80d3ca895853eab74bbe5021.reference = {
    __cReference: true,
    get value() { return BOOTS____header_global_edadf120042c3a47; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:232
export const MIRRORBROKE____header_global_670763f98b48c665 = ((((((70) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_de96d2a402d03d9a86db7e7f() {
  return __cxx_static_address_de96d2a402d03d9a86db7e7f.reference || (__cxx_static_address_de96d2a402d03d9a86db7e7f.reference = {
    __cReference: true,
    get value() { return MIRRORBROKE____header_global_670763f98b48c665; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:233
export const CLOUDYOCEAN____header_global_c9c3d56873d8a79e = ((((((78) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9f2c4116cd35d726b1cdca56() {
  return __cxx_static_address_9f2c4116cd35d726b1cdca56.reference || (__cxx_static_address_9f2c4116cd35d726b1cdca56.reference = {
    __cReference: true,
    get value() { return CLOUDYOCEAN____header_global_c9c3d56873d8a79e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:234
export const CLOUDYSKIES____header_global_afa8aa78c421fa04 = ((((((79) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_42d514f5c33fd708f498b14a() {
  return __cxx_static_address_42d514f5c33fd708f498b14a.reference || (__cxx_static_address_42d514f5c33fd708f498b14a.reference = {
    __cReference: true,
    get value() { return CLOUDYSKIES____header_global_afa8aa78c421fa04; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:235
export const MOONSKY1____header_global_7d5ae73cce02af0a = ((((((80) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_df00c51351f24587667474f3() {
  return __cxx_static_address_df00c51351f24587667474f3.reference || (__cxx_static_address_df00c51351f24587667474f3.reference = {
    __cReference: true,
    get value() { return MOONSKY1____header_global_7d5ae73cce02af0a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:236
export const BIGORBIT1____header_global_7f7581232b2f8766 = ((((((84) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ae8e2bb236f5cf3e27e7276d() {
  return __cxx_static_address_ae8e2bb236f5cf3e27e7276d.reference || (__cxx_static_address_ae8e2bb236f5cf3e27e7276d.reference = {
    __cReference: true,
    get value() { return BIGORBIT1____header_global_7f7581232b2f8766; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:237
export const LA____header_global_e584b85de1185526 = ((((((89) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c41222a29754c5ac7d4b4f88() {
  return __cxx_static_address_c41222a29754c5ac7d4b4f88.reference || (__cxx_static_address_c41222a29754c5ac7d4b4f88.reference = {
    __cReference: true,
    get value() { return LA____header_global_e584b85de1185526; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:238
export const ATOMICHEALTH____header_global_6e9160ba0c4e7461 = ((((((100) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ca9ad8d21b5cf65d864052d6() {
  return __cxx_static_address_ca9ad8d21b5cf65d864052d6.reference || (__cxx_static_address_ca9ad8d21b5cf65d864052d6.reference = {
    __cReference: true,
    get value() { return ATOMICHEALTH____header_global_6e9160ba0c4e7461; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:239
export const TECHLIGHT2____header_global_b1a313113592ed6a = ((((((120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_72e42d4a571683a4fa58a445() {
  return __cxx_static_address_72e42d4a571683a4fa58a445.reference || (__cxx_static_address_72e42d4a571683a4fa58a445.reference = {
    __cReference: true,
    get value() { return TECHLIGHT2____header_global_b1a313113592ed6a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:240
export const TECHLIGHTBUST2____header_global_b786d3f5960e7542 = ((((((121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d77e7a43f4a4bbe6b850217e() {
  return __cxx_static_address_d77e7a43f4a4bbe6b850217e.reference || (__cxx_static_address_d77e7a43f4a4bbe6b850217e.reference = {
    __cReference: true,
    get value() { return TECHLIGHTBUST2____header_global_b786d3f5960e7542; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:241
export const TECHLIGHT4____header_global_2e7d1982cb557305 = ((((((122) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_65e49e65acd9b2999b973b4f() {
  return __cxx_static_address_65e49e65acd9b2999b973b4f.reference || (__cxx_static_address_65e49e65acd9b2999b973b4f.reference = {
    __cReference: true,
    get value() { return TECHLIGHT4____header_global_2e7d1982cb557305; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:242
export const TECHLIGHTBUST4____header_global_7d30e9d79592cfcd = ((((((123) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b5062dd3561aab54dc5e8124() {
  return __cxx_static_address_b5062dd3561aab54dc5e8124.reference || (__cxx_static_address_b5062dd3561aab54dc5e8124.reference = {
    __cReference: true,
    get value() { return TECHLIGHTBUST4____header_global_7d30e9d79592cfcd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:243
export const WALLLIGHT4____header_global_10a57b16321e3b7a = ((((((124) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_efb14156983e87c1484e3214() {
  return __cxx_static_address_efb14156983e87c1484e3214.reference || (__cxx_static_address_efb14156983e87c1484e3214.reference = {
    __cReference: true,
    get value() { return WALLLIGHT4____header_global_10a57b16321e3b7a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:244
export const WALLLIGHTBUST4____header_global_f05b1536309796a6 = ((((((125) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a4e8d2234a90ef9e787f51e6() {
  return __cxx_static_address_a4e8d2234a90ef9e787f51e6.reference || (__cxx_static_address_a4e8d2234a90ef9e787f51e6.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST4____header_global_f05b1536309796a6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:245
export const ACCESSSWITCH____header_global_43edccbb18c748af = ((((((130) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3914319279d51b2f4854dfbe() {
  return __cxx_static_address_3914319279d51b2f4854dfbe.reference || (__cxx_static_address_3914319279d51b2f4854dfbe.reference = {
    __cReference: true,
    get value() { return ACCESSSWITCH____header_global_43edccbb18c748af; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:246
export const SLOTDOOR____header_global_b745b3d622f2a5ce = ((((((132) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_23f459d1ee0107cfc8f16b38() {
  return __cxx_static_address_23f459d1ee0107cfc8f16b38.reference || (__cxx_static_address_23f459d1ee0107cfc8f16b38.reference = {
    __cReference: true,
    get value() { return SLOTDOOR____header_global_b745b3d622f2a5ce; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:247
export const LIGHTSWITCH____header_global_b34f103a26dab3a8 = ((((((134) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_76a117053eb067f228bc4963() {
  return __cxx_static_address_76a117053eb067f228bc4963.reference || (__cxx_static_address_76a117053eb067f228bc4963.reference = {
    __cReference: true,
    get value() { return LIGHTSWITCH____header_global_b34f103a26dab3a8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:248
export const SPACEDOORSWITCH____header_global_440262ccfa772baa = ((((((136) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8963a081e9f5552855465fcf() {
  return __cxx_static_address_8963a081e9f5552855465fcf.reference || (__cxx_static_address_8963a081e9f5552855465fcf.reference = {
    __cReference: true,
    get value() { return SPACEDOORSWITCH____header_global_440262ccfa772baa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:249
export const SPACELIGHTSWITCH____header_global_dfa3c006108f04a8 = ((((((138) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6e9f1877a53c32d36b061a71() {
  return __cxx_static_address_6e9f1877a53c32d36b061a71.reference || (__cxx_static_address_6e9f1877a53c32d36b061a71.reference = {
    __cReference: true,
    get value() { return SPACELIGHTSWITCH____header_global_dfa3c006108f04a8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:250
export const FRANKENSTINESWITCH____header_global_863412e5298f5446 = ((((((140) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_056c1ba8251e19f8cef32943() {
  return __cxx_static_address_056c1ba8251e19f8cef32943.reference || (__cxx_static_address_056c1ba8251e19f8cef32943.reference = {
    __cReference: true,
    get value() { return FRANKENSTINESWITCH____header_global_863412e5298f5446; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:251
export const NUKEBUTTON____header_global_675aed1838ee589b = ((((((142) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a5f2afa3750ab62847a4afec() {
  return __cxx_static_address_a5f2afa3750ab62847a4afec.reference || (__cxx_static_address_a5f2afa3750ab62847a4afec.reference = {
    __cReference: true,
    get value() { return NUKEBUTTON____header_global_675aed1838ee589b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:252
export const MULTISWITCH____header_global_620d0f91b2899dfa = ((((((146) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0afcdf5a44b1d367f1c9bce1() {
  return __cxx_static_address_0afcdf5a44b1d367f1c9bce1.reference || (__cxx_static_address_0afcdf5a44b1d367f1c9bce1.reference = {
    __cReference: true,
    get value() { return MULTISWITCH____header_global_620d0f91b2899dfa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:253
export const DOORTILE5____header_global_1570b2e1ac79f415 = ((((((150) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0517090731b37ed639fb9760() {
  return __cxx_static_address_0517090731b37ed639fb9760.reference || (__cxx_static_address_0517090731b37ed639fb9760.reference = {
    __cReference: true,
    get value() { return DOORTILE5____header_global_1570b2e1ac79f415; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:254
export const DOORTILE6____header_global_d8774e6904553603 = ((((((151) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a6ef13f4f46c21e31be1e62d() {
  return __cxx_static_address_a6ef13f4f46c21e31be1e62d.reference || (__cxx_static_address_a6ef13f4f46c21e31be1e62d.reference = {
    __cReference: true,
    get value() { return DOORTILE6____header_global_d8774e6904553603; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:255
export const DOORTILE1____header_global_69dfc78ce44f4ec1 = ((((((152) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0bb8ff4973c10cf1f6e1824b() {
  return __cxx_static_address_0bb8ff4973c10cf1f6e1824b.reference || (__cxx_static_address_0bb8ff4973c10cf1f6e1824b.reference = {
    __cReference: true,
    get value() { return DOORTILE1____header_global_69dfc78ce44f4ec1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:256
export const DOORTILE2____header_global_ad701c80a2b99f1a = ((((((153) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3161e865d13c97e6a3ee6aec() {
  return __cxx_static_address_3161e865d13c97e6a3ee6aec.reference || (__cxx_static_address_3161e865d13c97e6a3ee6aec.reference = {
    __cReference: true,
    get value() { return DOORTILE2____header_global_ad701c80a2b99f1a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:257
export const DOORTILE3____header_global_560f7d08b4e67729 = ((((((154) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a8b48c2195951a26614f5628() {
  return __cxx_static_address_a8b48c2195951a26614f5628.reference || (__cxx_static_address_a8b48c2195951a26614f5628.reference = {
    __cReference: true,
    get value() { return DOORTILE3____header_global_560f7d08b4e67729; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:258
export const DOORTILE4____header_global_578fa0c5764419d5 = ((((((155) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d9575269ca44a6645b40ee67() {
  return __cxx_static_address_d9575269ca44a6645b40ee67.reference || (__cxx_static_address_d9575269ca44a6645b40ee67.reference = {
    __cReference: true,
    get value() { return DOORTILE4____header_global_578fa0c5764419d5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:259
export const DOORTILE7____header_global_84a79a1f836a02bb = ((((((156) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d2bf08e1f34c3d3a216c2641() {
  return __cxx_static_address_d2bf08e1f34c3d3a216c2641.reference || (__cxx_static_address_d2bf08e1f34c3d3a216c2641.reference = {
    __cReference: true,
    get value() { return DOORTILE7____header_global_84a79a1f836a02bb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:260
export const DOORTILE8____header_global_3bd03360e9e49c2a = ((((((157) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cbdccfbbf84f8092d0f58ad6() {
  return __cxx_static_address_cbdccfbbf84f8092d0f58ad6.reference || (__cxx_static_address_cbdccfbbf84f8092d0f58ad6.reference = {
    __cReference: true,
    get value() { return DOORTILE8____header_global_3bd03360e9e49c2a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:261
export const DOORTILE9____header_global_a34f0fd4560e4eba = ((((((158) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1a5a879db1729b2381dc498e() {
  return __cxx_static_address_1a5a879db1729b2381dc498e.reference || (__cxx_static_address_1a5a879db1729b2381dc498e.reference = {
    __cReference: true,
    get value() { return DOORTILE9____header_global_a34f0fd4560e4eba; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:262
export const DOORTILE10____header_global_28e4a352d267a663 = ((((((159) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8b51a5f4472d4f452238e5a9() {
  return __cxx_static_address_8b51a5f4472d4f452238e5a9.reference || (__cxx_static_address_8b51a5f4472d4f452238e5a9.reference = {
    __cReference: true,
    get value() { return DOORTILE10____header_global_28e4a352d267a663; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:263
export const DOORSHOCK____header_global_56f16927a40d017d = ((((((160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_36e312551ab7df600fe73b0e() {
  return __cxx_static_address_36e312551ab7df600fe73b0e.reference || (__cxx_static_address_36e312551ab7df600fe73b0e.reference = {
    __cReference: true,
    get value() { return DOORSHOCK____header_global_56f16927a40d017d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:264
export const DIPSWITCH____header_global_86be21ba5e8f6b87 = ((((((162) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_67eba83ba6f104c31550f772() {
  return __cxx_static_address_67eba83ba6f104c31550f772.reference || (__cxx_static_address_67eba83ba6f104c31550f772.reference = {
    __cReference: true,
    get value() { return DIPSWITCH____header_global_86be21ba5e8f6b87; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:265
export const DIPSWITCH2____header_global_85ac53055c73eb30 = ((((((164) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7ab1af5a492cde4058f4a15f() {
  return __cxx_static_address_7ab1af5a492cde4058f4a15f.reference || (__cxx_static_address_7ab1af5a492cde4058f4a15f.reference = {
    __cReference: true,
    get value() { return DIPSWITCH2____header_global_85ac53055c73eb30; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:266
export const TECHSWITCH____header_global_3f3b584abebc257f = ((((((166) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_936f8b746a345752ac091d61() {
  return __cxx_static_address_936f8b746a345752ac091d61.reference || (__cxx_static_address_936f8b746a345752ac091d61.reference = {
    __cReference: true,
    get value() { return TECHSWITCH____header_global_3f3b584abebc257f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:267
export const DIPSWITCH3____header_global_89bc9633e0468613 = ((((((168) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7fcd11ee56418582fbdbacfa() {
  return __cxx_static_address_7fcd11ee56418582fbdbacfa.reference || (__cxx_static_address_7fcd11ee56418582fbdbacfa.reference = {
    __cReference: true,
    get value() { return DIPSWITCH3____header_global_89bc9633e0468613; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:268
export const ACCESSSWITCH2____header_global_d475416ffa748c8b = ((((((170) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8c7bcec95b2e67237b6284dd() {
  return __cxx_static_address_8c7bcec95b2e67237b6284dd.reference || (__cxx_static_address_8c7bcec95b2e67237b6284dd.reference = {
    __cReference: true,
    get value() { return ACCESSSWITCH2____header_global_d475416ffa748c8b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:269
export const FLOORSLIME____header_global_a309847d1c60ddca = ((((((200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6aa047ad7e8c38a5ae7597f2() {
  return __cxx_static_address_6aa047ad7e8c38a5ae7597f2.reference || (__cxx_static_address_6aa047ad7e8c38a5ae7597f2.reference = {
    __cReference: true,
    get value() { return FLOORSLIME____header_global_a309847d1c60ddca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:270
export const BIGFORCE____header_global_8906387737cb101a = ((((((230) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1423c87b8835bb752e83f18c() {
  return __cxx_static_address_1423c87b8835bb752e83f18c.reference || (__cxx_static_address_1423c87b8835bb752e83f18c.reference = {
    __cReference: true,
    get value() { return BIGFORCE____header_global_8906387737cb101a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:271
export const MASKWALL9____header_global_9564a1a266ae462a = ((((((255) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a69a6a833b8b24914b40d824() {
  return __cxx_static_address_a69a6a833b8b24914b40d824.reference || (__cxx_static_address_a69a6a833b8b24914b40d824.reference = {
    __cReference: true,
    get value() { return MASKWALL9____header_global_9564a1a266ae462a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:272
export const SCREENBREAK1____header_global_a1a1007b07c8c0cb = ((((((263) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e31368577e67f5af8c8912bb() {
  return __cxx_static_address_e31368577e67f5af8c8912bb.reference || (__cxx_static_address_e31368577e67f5af8c8912bb.reference = {
    __cReference: true,
    get value() { return SCREENBREAK1____header_global_a1a1007b07c8c0cb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:273
export const SCREENBREAK2____header_global_4b4d8c1ff67cfc0d = ((((((264) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_32f0965424865078def2fd20() {
  return __cxx_static_address_32f0965424865078def2fd20.reference || (__cxx_static_address_32f0965424865078def2fd20.reference = {
    __cReference: true,
    get value() { return SCREENBREAK2____header_global_4b4d8c1ff67cfc0d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:274
export const SCREENBREAK3____header_global_eab638b9b025a86b = ((((((265) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_53d5b19f478be54d1af00af1() {
  return __cxx_static_address_53d5b19f478be54d1af00af1.reference || (__cxx_static_address_53d5b19f478be54d1af00af1.reference = {
    __cReference: true,
    get value() { return SCREENBREAK3____header_global_eab638b9b025a86b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:275
export const SCREENBREAK4____header_global_240bbb72fdde7018 = ((((((266) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_165c03a806d1d89bf6d65437() {
  return __cxx_static_address_165c03a806d1d89bf6d65437.reference || (__cxx_static_address_165c03a806d1d89bf6d65437.reference = {
    __cReference: true,
    get value() { return SCREENBREAK4____header_global_240bbb72fdde7018; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:276
export const SCREENBREAK5____header_global_77a6488db7c1ad47 = ((((((267) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a7d0d4585e7cd268b89db2d3() {
  return __cxx_static_address_a7d0d4585e7cd268b89db2d3.reference || (__cxx_static_address_a7d0d4585e7cd268b89db2d3.reference = {
    __cReference: true,
    get value() { return SCREENBREAK5____header_global_77a6488db7c1ad47; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:277
export const SCREENBREAK6____header_global_3480b05af46c2c21 = ((((((268) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_89caa1d5bf9b0598a8ede9b3() {
  return __cxx_static_address_89caa1d5bf9b0598a8ede9b3.reference || (__cxx_static_address_89caa1d5bf9b0598a8ede9b3.reference = {
    __cReference: true,
    get value() { return SCREENBREAK6____header_global_3480b05af46c2c21; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:278
export const SCREENBREAK7____header_global_35f54a2cee8ffa47 = ((((((269) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7c7230f78163454366ddd88a() {
  return __cxx_static_address_7c7230f78163454366ddd88a.reference || (__cxx_static_address_7c7230f78163454366ddd88a.reference = {
    __cReference: true,
    get value() { return SCREENBREAK7____header_global_35f54a2cee8ffa47; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:279
export const SCREENBREAK8____header_global_dd7593fe9610dbf7 = ((((((270) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_011ccba216b6911b2e70d10d() {
  return __cxx_static_address_011ccba216b6911b2e70d10d.reference || (__cxx_static_address_011ccba216b6911b2e70d10d.reference = {
    __cReference: true,
    get value() { return SCREENBREAK8____header_global_dd7593fe9610dbf7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:280
export const SCREENBREAK9____header_global_c7da1c7be4447b1d = ((((((271) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a3db11b485c57645e7732ba2() {
  return __cxx_static_address_a3db11b485c57645e7732ba2.reference || (__cxx_static_address_a3db11b485c57645e7732ba2.reference = {
    __cReference: true,
    get value() { return SCREENBREAK9____header_global_c7da1c7be4447b1d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:281
export const SCREENBREAK10____header_global_158fcaf4a77fa2d8 = ((((((272) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a89487126ca909b4ddc18a20() {
  return __cxx_static_address_a89487126ca909b4ddc18a20.reference || (__cxx_static_address_a89487126ca909b4ddc18a20.reference = {
    __cReference: true,
    get value() { return SCREENBREAK10____header_global_158fcaf4a77fa2d8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:282
export const SCREENBREAK11____header_global_ca1652402b37b66a = ((((((273) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5d2eec10ace14a49cc1bbfcd() {
  return __cxx_static_address_5d2eec10ace14a49cc1bbfcd.reference || (__cxx_static_address_5d2eec10ace14a49cc1bbfcd.reference = {
    __cReference: true,
    get value() { return SCREENBREAK11____header_global_ca1652402b37b66a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:283
export const SCREENBREAK12____header_global_9a76f5bfddd76f9f = ((((((274) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c6059e849b9b702b8c1448cd() {
  return __cxx_static_address_c6059e849b9b702b8c1448cd.reference || (__cxx_static_address_c6059e849b9b702b8c1448cd.reference = {
    __cReference: true,
    get value() { return SCREENBREAK12____header_global_9a76f5bfddd76f9f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:284
export const SCREENBREAK13____header_global_754d1e504465ce36 = ((((((275) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d4b98c291312ad3512221b7c() {
  return __cxx_static_address_d4b98c291312ad3512221b7c.reference || (__cxx_static_address_d4b98c291312ad3512221b7c.reference = {
    __cReference: true,
    get value() { return SCREENBREAK13____header_global_754d1e504465ce36; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:285
export const MASKWALL1____header_global_e0f3aff4e1f313a8 = ((((((285) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cfec5d2edb484f3a1df7c662() {
  return __cxx_static_address_cfec5d2edb484f3a1df7c662.reference || (__cxx_static_address_cfec5d2edb484f3a1df7c662.reference = {
    __cReference: true,
    get value() { return MASKWALL1____header_global_e0f3aff4e1f313a8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:286
export const W_TECHWALL1____header_global_d1021465709c78b0 = ((((((293) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4c5dd396e4e2a33b959072db() {
  return __cxx_static_address_4c5dd396e4e2a33b959072db.reference || (__cxx_static_address_4c5dd396e4e2a33b959072db.reference = {
    __cReference: true,
    get value() { return W_TECHWALL1____header_global_d1021465709c78b0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:287
export const W_TECHWALL2____header_global_abc5861e404ca69f = ((((((297) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7fe52a7dceba1152a6b64cb0() {
  return __cxx_static_address_7fe52a7dceba1152a6b64cb0.reference || (__cxx_static_address_7fe52a7dceba1152a6b64cb0.reference = {
    __cReference: true,
    get value() { return W_TECHWALL2____header_global_abc5861e404ca69f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:288
export const W_TECHWALL15____header_global_6d0b92abaf81058f = ((((((299) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d51aee725746ef740cbaaa87() {
  return __cxx_static_address_d51aee725746ef740cbaaa87.reference || (__cxx_static_address_d51aee725746ef740cbaaa87.reference = {
    __cReference: true,
    get value() { return W_TECHWALL15____header_global_6d0b92abaf81058f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:289
export const W_TECHWALL3____header_global_984b458a1353e8c9 = ((((((301) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_93714e2beeb8f0c5aa0c888e() {
  return __cxx_static_address_93714e2beeb8f0c5aa0c888e.reference || (__cxx_static_address_93714e2beeb8f0c5aa0c888e.reference = {
    __cReference: true,
    get value() { return W_TECHWALL3____header_global_984b458a1353e8c9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:290
export const W_TECHWALL4____header_global_7c66a8fc3ad9cb71 = ((((((305) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d70ec795f40e0f5d6092c6e1() {
  return __cxx_static_address_d70ec795f40e0f5d6092c6e1.reference || (__cxx_static_address_d70ec795f40e0f5d6092c6e1.reference = {
    __cReference: true,
    get value() { return W_TECHWALL4____header_global_7c66a8fc3ad9cb71; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:291
export const W_TECHWALL10____header_global_084a38454c865dfe = ((((((306) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7302f943d2bbbf91d702c009() {
  return __cxx_static_address_7302f943d2bbbf91d702c009.reference || (__cxx_static_address_7302f943d2bbbf91d702c009.reference = {
    __cReference: true,
    get value() { return W_TECHWALL10____header_global_084a38454c865dfe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:292
export const W_TECHWALL16____header_global_bf19baf917875064 = ((((((307) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4be29b0c90bc6b2d659b712c() {
  return __cxx_static_address_4be29b0c90bc6b2d659b712c.reference || (__cxx_static_address_4be29b0c90bc6b2d659b712c.reference = {
    __cReference: true,
    get value() { return W_TECHWALL16____header_global_bf19baf917875064; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:293
export const WATERTILE2____header_global_ad673590fefbce84 = ((((((336) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8a4844281d221bf8156980d7() {
  return __cxx_static_address_8a4844281d221bf8156980d7.reference || (__cxx_static_address_8a4844281d221bf8156980d7.reference = {
    __cReference: true,
    get value() { return WATERTILE2____header_global_ad673590fefbce84; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:294
export const BPANNEL1____header_global_62815f10b113d058 = ((((((341) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_732d30174800774b9fa8524c() {
  return __cxx_static_address_732d30174800774b9fa8524c.reference || (__cxx_static_address_732d30174800774b9fa8524c.reference = {
    __cReference: true,
    get value() { return BPANNEL1____header_global_62815f10b113d058; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:295
export const PANNEL1____header_global_5725df7aff024992 = ((((((342) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_051154031e2b74c6ac1c5c93() {
  return __cxx_static_address_051154031e2b74c6ac1c5c93.reference || (__cxx_static_address_051154031e2b74c6ac1c5c93.reference = {
    __cReference: true,
    get value() { return PANNEL1____header_global_5725df7aff024992; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:296
export const PANNEL2____header_global_04cf0289d51bccb2 = ((((((343) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fff9ba18c1760833fd2ce47b() {
  return __cxx_static_address_fff9ba18c1760833fd2ce47b.reference || (__cxx_static_address_fff9ba18c1760833fd2ce47b.reference = {
    __cReference: true,
    get value() { return PANNEL2____header_global_04cf0289d51bccb2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:297
export const STATIC____header_global_508c1cf74a37a47c = ((((((351) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6947847c092157da89d65b09() {
  return __cxx_static_address_6947847c092157da89d65b09.reference || (__cxx_static_address_6947847c092157da89d65b09.reference = {
    __cReference: true,
    get value() { return STATIC____header_global_508c1cf74a37a47c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:298
export const W_SCREENBREAK____header_global_60dc12dbdd061658 = ((((((357) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8bac541da50f189c5ff0f377() {
  return __cxx_static_address_8bac541da50f189c5ff0f377.reference || (__cxx_static_address_8bac541da50f189c5ff0f377.reference = {
    __cReference: true,
    get value() { return W_SCREENBREAK____header_global_60dc12dbdd061658; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:299
export const W_HITTECHWALL3____header_global_1c5c1bbb7de2f169 = ((((((360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7e38c06319deeda64fac5186() {
  return __cxx_static_address_7e38c06319deeda64fac5186.reference || (__cxx_static_address_7e38c06319deeda64fac5186.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL3____header_global_1c5c1bbb7de2f169; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:300
export const W_HITTECHWALL4____header_global_013984bed6c0475b = ((((((361) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a56469fd4dbebd9dc69ce790() {
  return __cxx_static_address_a56469fd4dbebd9dc69ce790.reference || (__cxx_static_address_a56469fd4dbebd9dc69ce790.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL4____header_global_013984bed6c0475b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:301
export const W_HITTECHWALL2____header_global_eec6474293e9a11d = ((((((362) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a039c8dd80b6b1d0c1d3c29c() {
  return __cxx_static_address_a039c8dd80b6b1d0c1d3c29c.reference || (__cxx_static_address_a039c8dd80b6b1d0c1d3c29c.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL2____header_global_eec6474293e9a11d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:302
export const W_HITTECHWALL1____header_global_55bfa1904b40e5a4 = ((((((363) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f1b90ed7ce9b42726cc7fb67() {
  return __cxx_static_address_f1b90ed7ce9b42726cc7fb67.reference || (__cxx_static_address_f1b90ed7ce9b42726cc7fb67.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL1____header_global_55bfa1904b40e5a4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:303
export const MASKWALL10____header_global_376f1304dcc2dee8 = ((((((387) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1ae2a1b39116583be17c71d7() {
  return __cxx_static_address_1ae2a1b39116583be17c71d7.reference || (__cxx_static_address_1ae2a1b39116583be17c71d7.reference = {
    __cReference: true,
    get value() { return MASKWALL10____header_global_376f1304dcc2dee8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:304
export const MASKWALL11____header_global_606d62987ccbca0a = ((((((391) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f0e184dff1f48e66c7d66963() {
  return __cxx_static_address_f0e184dff1f48e66c7d66963.reference || (__cxx_static_address_f0e184dff1f48e66c7d66963.reference = {
    __cReference: true,
    get value() { return MASKWALL11____header_global_606d62987ccbca0a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:305
export const DOORTILE22____header_global_21fc8e03bb3910d1 = ((((((395) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d07dfe79cfb7c47e1bc54f58() {
  return __cxx_static_address_d07dfe79cfb7c47e1bc54f58.reference || (__cxx_static_address_d07dfe79cfb7c47e1bc54f58.reference = {
    __cReference: true,
    get value() { return DOORTILE22____header_global_21fc8e03bb3910d1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:306
export const FANSPRITE____header_global_80248fbc64cca364 = ((((((407) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_578ec9687c96b97e49cbd2f4() {
  return __cxx_static_address_578ec9687c96b97e49cbd2f4.reference || (__cxx_static_address_578ec9687c96b97e49cbd2f4.reference = {
    __cReference: true,
    get value() { return FANSPRITE____header_global_80248fbc64cca364; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:307
export const FANSPRITEBROKE____header_global_b729fae8ad384bd6 = ((((((411) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f955c555344dc5311c9665b3() {
  return __cxx_static_address_f955c555344dc5311c9665b3.reference || (__cxx_static_address_f955c555344dc5311c9665b3.reference = {
    __cReference: true,
    get value() { return FANSPRITEBROKE____header_global_b729fae8ad384bd6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:308
export const FANSHADOW____header_global_3738b5c43a960ca8 = ((((((412) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_929f7522e9d8b89dd32416ce() {
  return __cxx_static_address_929f7522e9d8b89dd32416ce.reference || (__cxx_static_address_929f7522e9d8b89dd32416ce.reference = {
    __cReference: true,
    get value() { return FANSHADOW____header_global_3738b5c43a960ca8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:309
export const FANSHADOWBROKE____header_global_046439a30dc8d6c4 = ((((((416) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4a6c4426ee74e36158f65f2f() {
  return __cxx_static_address_4a6c4426ee74e36158f65f2f.reference || (__cxx_static_address_4a6c4426ee74e36158f65f2f.reference = {
    __cReference: true,
    get value() { return FANSHADOWBROKE____header_global_046439a30dc8d6c4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:310
export const DOORTILE18____header_global_3be790a47d0cb185 = ((((((447) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_28858d9d980a7bd9b7658eba() {
  return __cxx_static_address_28858d9d980a7bd9b7658eba.reference || (__cxx_static_address_28858d9d980a7bd9b7658eba.reference = {
    __cReference: true,
    get value() { return DOORTILE18____header_global_3be790a47d0cb185; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:311
export const DOORTILE19____header_global_d6a27ab9c2f6d740 = ((((((448) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5c64454065cb6f3b8860f055() {
  return __cxx_static_address_5c64454065cb6f3b8860f055.reference || (__cxx_static_address_5c64454065cb6f3b8860f055.reference = {
    __cReference: true,
    get value() { return DOORTILE19____header_global_d6a27ab9c2f6d740; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:312
export const DOORTILE20____header_global_c615c7249551ba24 = ((((((449) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2507c6da4edeacfa24c460ba() {
  return __cxx_static_address_2507c6da4edeacfa24c460ba.reference || (__cxx_static_address_2507c6da4edeacfa24c460ba.reference = {
    __cReference: true,
    get value() { return DOORTILE20____header_global_c615c7249551ba24; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:313
export const VIEWSCREEN2____header_global_bb8eed027c0bff12 = ((((((499) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c8bbe1c8ff977b93e4cbd774() {
  return __cxx_static_address_c8bbe1c8ff977b93e4cbd774.reference || (__cxx_static_address_c8bbe1c8ff977b93e4cbd774.reference = {
    __cReference: true,
    get value() { return VIEWSCREEN2____header_global_bb8eed027c0bff12; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:314
export const VIEWSCREEN____header_global_102ccbec89c3fe0a = ((((((502) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1e2ca97964813f1d5079e891() {
  return __cxx_static_address_1e2ca97964813f1d5079e891.reference || (__cxx_static_address_1e2ca97964813f1d5079e891.reference = {
    __cReference: true,
    get value() { return VIEWSCREEN____header_global_102ccbec89c3fe0a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:315
export const GLASS____header_global_b7eccedc886ffb2b = ((((((503) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5e393fe9cb7522aba164a282() {
  return __cxx_static_address_5e393fe9cb7522aba164a282.reference || (__cxx_static_address_5e393fe9cb7522aba164a282.reference = {
    __cReference: true,
    get value() { return GLASS____header_global_b7eccedc886ffb2b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:316
export const GLASS2____header_global_ccaf4610953e8abc = ((((((504) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_94fcea1086bbc0a022749e49() {
  return __cxx_static_address_94fcea1086bbc0a022749e49.reference || (__cxx_static_address_94fcea1086bbc0a022749e49.reference = {
    __cReference: true,
    get value() { return GLASS2____header_global_ccaf4610953e8abc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:317
export const STAINGLASS1____header_global_3611614fa85da7b9 = ((((((510) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c38b81c7014f15a616aab406() {
  return __cxx_static_address_c38b81c7014f15a616aab406.reference || (__cxx_static_address_c38b81c7014f15a616aab406.reference = {
    __cReference: true,
    get value() { return STAINGLASS1____header_global_3611614fa85da7b9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:318
export const MASKWALL5____header_global_0254bea1eff03e19 = ((((((514) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_278a187754733f6afc12e6f8() {
  return __cxx_static_address_278a187754733f6afc12e6f8.reference || (__cxx_static_address_278a187754733f6afc12e6f8.reference = {
    __cReference: true,
    get value() { return MASKWALL5____header_global_0254bea1eff03e19; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:319
export const SATELITE____header_global_fe7fb8260aabd95e = ((((((516) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8a243689e2acf68ec120f216() {
  return __cxx_static_address_8a243689e2acf68ec120f216.reference || (__cxx_static_address_8a243689e2acf68ec120f216.reference = {
    __cReference: true,
    get value() { return SATELITE____header_global_fe7fb8260aabd95e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:320
export const FUELPOD____header_global_4065deaeac60aef1 = ((((((517) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7fb12f29c6a2fca523ee301b() {
  return __cxx_static_address_7fb12f29c6a2fca523ee301b.reference || (__cxx_static_address_7fb12f29c6a2fca523ee301b.reference = {
    __cReference: true,
    get value() { return FUELPOD____header_global_4065deaeac60aef1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:321
export const CRACK1____header_global_53e1b9e3bf5b5ab7 = ((((((546) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_60c29869694304cce6f67ccf() {
  return __cxx_static_address_60c29869694304cce6f67ccf.reference || (__cxx_static_address_60c29869694304cce6f67ccf.reference = {
    __cReference: true,
    get value() { return CRACK1____header_global_53e1b9e3bf5b5ab7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:322
export const CRACK2____header_global_e9bf540467034014 = ((((((547) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a01bfdc09be09daa42416123() {
  return __cxx_static_address_a01bfdc09be09daa42416123.reference || (__cxx_static_address_a01bfdc09be09daa42416123.reference = {
    __cReference: true,
    get value() { return CRACK2____header_global_e9bf540467034014; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:323
export const CRACK3____header_global_63a6b7631317a003 = ((((((548) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1acb508987f12f846603f8cc() {
  return __cxx_static_address_1acb508987f12f846603f8cc.reference || (__cxx_static_address_1acb508987f12f846603f8cc.reference = {
    __cReference: true,
    get value() { return CRACK3____header_global_63a6b7631317a003; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:324
export const CRACK4____header_global_d508f999e2a75e3c = ((((((549) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7c9b571977820d1c5f6e63d3() {
  return __cxx_static_address_7c9b571977820d1c5f6e63d3.reference || (__cxx_static_address_7c9b571977820d1c5f6e63d3.reference = {
    __cReference: true,
    get value() { return CRACK4____header_global_d508f999e2a75e3c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:325
export const FOOTPRINTS____header_global_41ffef8968b66e65 = ((((((550) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cf670371de1186773d9f7ecd() {
  return __cxx_static_address_cf670371de1186773d9f7ecd.reference || (__cxx_static_address_cf670371de1186773d9f7ecd.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS____header_global_41ffef8968b66e65; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:326
export const DOMELITE____header_global_c9e6e0d3c18e3d1d = ((((((551) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ddfc551e2667a3c37326c965() {
  return __cxx_static_address_ddfc551e2667a3c37326c965.reference || (__cxx_static_address_ddfc551e2667a3c37326c965.reference = {
    __cReference: true,
    get value() { return DOMELITE____header_global_c9e6e0d3c18e3d1d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:327
export const CAMERAPOLE____header_global_33a9e53e4c753a61 = ((((((554) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4891a818bde70e7a3204baf9() {
  return __cxx_static_address_4891a818bde70e7a3204baf9.reference || (__cxx_static_address_4891a818bde70e7a3204baf9.reference = {
    __cReference: true,
    get value() { return CAMERAPOLE____header_global_33a9e53e4c753a61; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:328
export const CHAIR1____header_global_9194caa668d48f48 = ((((((556) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_129692c80fb92e757a75e888() {
  return __cxx_static_address_129692c80fb92e757a75e888.reference || (__cxx_static_address_129692c80fb92e757a75e888.reference = {
    __cReference: true,
    get value() { return CHAIR1____header_global_9194caa668d48f48; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:329
export const CHAIR2____header_global_730a7ffdaa03f7c3 = ((((((557) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5cd003a3107a347a54fbeae4() {
  return __cxx_static_address_5cd003a3107a347a54fbeae4.reference || (__cxx_static_address_5cd003a3107a347a54fbeae4.reference = {
    __cReference: true,
    get value() { return CHAIR2____header_global_730a7ffdaa03f7c3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:330
export const BROKENCHAIR____header_global_60abeafdb0d8dc07 = ((((((559) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8d9e444b4c265d153278fe25() {
  return __cxx_static_address_8d9e444b4c265d153278fe25.reference || (__cxx_static_address_8d9e444b4c265d153278fe25.reference = {
    __cReference: true,
    get value() { return BROKENCHAIR____header_global_60abeafdb0d8dc07; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:331
export const MIRROR____header_global_63964daea0c492e0 = ((((((560) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fdebed844e5a8bfe1dc8ebfd() {
  return __cxx_static_address_fdebed844e5a8bfe1dc8ebfd.reference || (__cxx_static_address_fdebed844e5a8bfe1dc8ebfd.reference = {
    __cReference: true,
    get value() { return MIRROR____header_global_63964daea0c492e0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:332
export const WATERFOUNTAIN____header_global_517b67936c3a89db = ((((((563) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3b062afd697e4b0a09ef5b55() {
  return __cxx_static_address_3b062afd697e4b0a09ef5b55.reference || (__cxx_static_address_3b062afd697e4b0a09ef5b55.reference = {
    __cReference: true,
    get value() { return WATERFOUNTAIN____header_global_517b67936c3a89db; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:333
export const WATERFOUNTAINBROKE____header_global_982a6f3fa11a2f2c = ((((((567) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_93b88a78403a287f6882ccf3() {
  return __cxx_static_address_93b88a78403a287f6882ccf3.reference || (__cxx_static_address_93b88a78403a287f6882ccf3.reference = {
    __cReference: true,
    get value() { return WATERFOUNTAINBROKE____header_global_982a6f3fa11a2f2c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:334
export const FEMMAG1____header_global_b2b211ef796a7814 = ((((((568) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_16bb6c6f0422ff075e4a65ca() {
  return __cxx_static_address_16bb6c6f0422ff075e4a65ca.reference || (__cxx_static_address_16bb6c6f0422ff075e4a65ca.reference = {
    __cReference: true,
    get value() { return FEMMAG1____header_global_b2b211ef796a7814; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:335
export const TOILET____header_global_26d4be4f96b56aa6 = ((((((569) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0ef6805fe0b0fe5bbd89bc2d() {
  return __cxx_static_address_0ef6805fe0b0fe5bbd89bc2d.reference || (__cxx_static_address_0ef6805fe0b0fe5bbd89bc2d.reference = {
    __cReference: true,
    get value() { return TOILET____header_global_26d4be4f96b56aa6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:336
export const STALL____header_global_2a45e2fb451315d5 = ((((((571) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9794ee23130dbe9393da130f() {
  return __cxx_static_address_9794ee23130dbe9393da130f.reference || (__cxx_static_address_9794ee23130dbe9393da130f.reference = {
    __cReference: true,
    get value() { return STALL____header_global_2a45e2fb451315d5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:337
export const STALLBROKE____header_global_43d62576696ada28 = ((((((573) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_215211f8118a04a87004d814() {
  return __cxx_static_address_215211f8118a04a87004d814.reference || (__cxx_static_address_215211f8118a04a87004d814.reference = {
    __cReference: true,
    get value() { return STALLBROKE____header_global_43d62576696ada28; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:338
export const FEMMAG2____header_global_4df23b33570559fd = ((((((577) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_50d31c0f1f2b66dded892361() {
  return __cxx_static_address_50d31c0f1f2b66dded892361.reference || (__cxx_static_address_50d31c0f1f2b66dded892361.reference = {
    __cReference: true,
    get value() { return FEMMAG2____header_global_4df23b33570559fd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:339
export const REACTOR2____header_global_f99f1a2338ad2652 = ((((((578) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_39723b789008b42a0a33a558() {
  return __cxx_static_address_39723b789008b42a0a33a558.reference || (__cxx_static_address_39723b789008b42a0a33a558.reference = {
    __cReference: true,
    get value() { return REACTOR2____header_global_f99f1a2338ad2652; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:340
export const REACTOR2BURNT____header_global_5788a635bd0d0e43 = ((((((579) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3bf28e4755bc93d1e1a0003f() {
  return __cxx_static_address_3bf28e4755bc93d1e1a0003f.reference || (__cxx_static_address_3bf28e4755bc93d1e1a0003f.reference = {
    __cReference: true,
    get value() { return REACTOR2BURNT____header_global_5788a635bd0d0e43; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:341
export const REACTOR2SPARK____header_global_1e827e5ac2bd569e = ((((((580) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_11b60d1aa6058d6235174fe6() {
  return __cxx_static_address_11b60d1aa6058d6235174fe6.reference || (__cxx_static_address_11b60d1aa6058d6235174fe6.reference = {
    __cReference: true,
    get value() { return REACTOR2SPARK____header_global_1e827e5ac2bd569e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:342
export const GRATE1____header_global_3f91c38d8bdfc905 = ((((((595) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_efebb22961290cd1d8d3cc4d() {
  return __cxx_static_address_efebb22961290cd1d8d3cc4d.reference || (__cxx_static_address_efebb22961290cd1d8d3cc4d.reference = {
    __cReference: true,
    get value() { return GRATE1____header_global_3f91c38d8bdfc905; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:343
export const BGRATE1____header_global_a24018e56a796bc3 = ((((((596) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b1030a73cd6466a1153e48c1() {
  return __cxx_static_address_b1030a73cd6466a1153e48c1.reference || (__cxx_static_address_b1030a73cd6466a1153e48c1.reference = {
    __cReference: true,
    get value() { return BGRATE1____header_global_a24018e56a796bc3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:344
export const SOLARPANNEL____header_global_b4bef1817caac5ab = ((((((602) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2c3473beda50f57f5d572b56() {
  return __cxx_static_address_2c3473beda50f57f5d572b56.reference || (__cxx_static_address_2c3473beda50f57f5d572b56.reference = {
    __cReference: true,
    get value() { return SOLARPANNEL____header_global_b4bef1817caac5ab; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:345
export const NAKED1____header_global_b823eabf77b1e82d = ((((((603) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_42ffdbf824c1e9b70057278c() {
  return __cxx_static_address_42ffdbf824c1e9b70057278c.reference || (__cxx_static_address_42ffdbf824c1e9b70057278c.reference = {
    __cReference: true,
    get value() { return NAKED1____header_global_b823eabf77b1e82d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:346
export const ANTENNA____header_global_85caca7ac05457e7 = ((((((607) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ddc369e14be31911e053700c() {
  return __cxx_static_address_ddc369e14be31911e053700c.reference || (__cxx_static_address_ddc369e14be31911e053700c.reference = {
    __cReference: true,
    get value() { return ANTENNA____header_global_85caca7ac05457e7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:347
export const MASKWALL12____header_global_5471beb7d2c4b3dc = ((((((609) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_efe4eab77fdb64c6eaf87e16() {
  return __cxx_static_address_efe4eab77fdb64c6eaf87e16.reference || (__cxx_static_address_efe4eab77fdb64c6eaf87e16.reference = {
    __cReference: true,
    get value() { return MASKWALL12____header_global_5471beb7d2c4b3dc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:348
export const TOILETBROKE____header_global_5c05dcf2eb7db05f = ((((((615) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7c23c89f01bcd3e3e050a097() {
  return __cxx_static_address_7c23c89f01bcd3e3e050a097.reference || (__cxx_static_address_7c23c89f01bcd3e3e050a097.reference = {
    __cReference: true,
    get value() { return TOILETBROKE____header_global_5c05dcf2eb7db05f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:349
export const PIPE2____header_global_2c4c97ebcf106c63 = ((((((616) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aa35d230ee925618621e4f7b() {
  return __cxx_static_address_aa35d230ee925618621e4f7b.reference || (__cxx_static_address_aa35d230ee925618621e4f7b.reference = {
    __cReference: true,
    get value() { return PIPE2____header_global_2c4c97ebcf106c63; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:350
export const PIPE1B____header_global_ec7384ebfbd11dd6 = ((((((617) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_03615cb953d0a09124cb21f9() {
  return __cxx_static_address_03615cb953d0a09124cb21f9.reference || (__cxx_static_address_03615cb953d0a09124cb21f9.reference = {
    __cReference: true,
    get value() { return PIPE1B____header_global_ec7384ebfbd11dd6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:351
export const PIPE3____header_global_760ecc18891d1410 = ((((((618) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2974c59c2b6413c01655e6a3() {
  return __cxx_static_address_2974c59c2b6413c01655e6a3.reference || (__cxx_static_address_2974c59c2b6413c01655e6a3.reference = {
    __cReference: true,
    get value() { return PIPE3____header_global_760ecc18891d1410; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:352
export const PIPE1____header_global_2ec14cc4dd5a7b6c = ((((((619) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a2671441b898c98ba495cd64() {
  return __cxx_static_address_a2671441b898c98ba495cd64.reference || (__cxx_static_address_a2671441b898c98ba495cd64.reference = {
    __cReference: true,
    get value() { return PIPE1____header_global_2ec14cc4dd5a7b6c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:353
export const CAMERA1____header_global_7aa08ecd9c9a2aca = ((((((621) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d94ab377f823288caa9d4cdd() {
  return __cxx_static_address_d94ab377f823288caa9d4cdd.reference || (__cxx_static_address_d94ab377f823288caa9d4cdd.reference = {
    __cReference: true,
    get value() { return CAMERA1____header_global_7aa08ecd9c9a2aca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:354
export const PIPE2B____header_global_bb09e895f7992f47 = ((((((633) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8208460d858266bd40701667() {
  return __cxx_static_address_8208460d858266bd40701667.reference || (__cxx_static_address_8208460d858266bd40701667.reference = {
    __cReference: true,
    get value() { return PIPE2B____header_global_bb09e895f7992f47; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:355
export const BOLT1____header_global_8af016bd41ef810e = ((((((634) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d48e1bd8e9126fff669d44be() {
  return __cxx_static_address_d48e1bd8e9126fff669d44be.reference || (__cxx_static_address_d48e1bd8e9126fff669d44be.reference = {
    __cReference: true,
    get value() { return BOLT1____header_global_8af016bd41ef810e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:356
export const W_NUMBERS____header_global_299c860ab6827aa1 = ((((((640) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5f052dd40a32193380be6ce5() {
  return __cxx_static_address_5f052dd40a32193380be6ce5.reference || (__cxx_static_address_5f052dd40a32193380be6ce5.reference = {
    __cReference: true,
    get value() { return W_NUMBERS____header_global_299c860ab6827aa1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:357
export const WATERDRIP____header_global_65d757a07f9447cf = ((((((660) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cc31b86d31184120c2d3c062() {
  return __cxx_static_address_cc31b86d31184120c2d3c062.reference || (__cxx_static_address_cc31b86d31184120c2d3c062.reference = {
    __cReference: true,
    get value() { return WATERDRIP____header_global_65d757a07f9447cf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:358
export const WATERBUBBLE____header_global_3da1f0d4023f6084 = ((((((661) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f6f53eb83a2fd939792110aa() {
  return __cxx_static_address_f6f53eb83a2fd939792110aa.reference || (__cxx_static_address_f6f53eb83a2fd939792110aa.reference = {
    __cReference: true,
    get value() { return WATERBUBBLE____header_global_3da1f0d4023f6084; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:359
export const WATERBUBBLEMAKER____header_global_fd456fa135b94192 = ((((((662) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f9039039376874fa0e3c8223() {
  return __cxx_static_address_f9039039376874fa0e3c8223.reference || (__cxx_static_address_f9039039376874fa0e3c8223.reference = {
    __cReference: true,
    get value() { return WATERBUBBLEMAKER____header_global_fd456fa135b94192; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:360
export const W_FORCEFIELD____header_global_4a223166ae1b8358 = ((((((663) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ad18cd42cdf2a01fcfec559f() {
  return __cxx_static_address_ad18cd42cdf2a01fcfec559f.reference || (__cxx_static_address_ad18cd42cdf2a01fcfec559f.reference = {
    __cReference: true,
    get value() { return W_FORCEFIELD____header_global_4a223166ae1b8358; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:361
export const VACUUM____header_global_3903578dbcae3140 = ((((((669) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0081899347f4ebc41d8b31d3() {
  return __cxx_static_address_0081899347f4ebc41d8b31d3.reference || (__cxx_static_address_0081899347f4ebc41d8b31d3.reference = {
    __cReference: true,
    get value() { return VACUUM____header_global_3903578dbcae3140; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:362
export const FOOTPRINTS2____header_global_ddb35be6cdbf6602 = ((((((672) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_973cbbd394d2fccdc073007d() {
  return __cxx_static_address_973cbbd394d2fccdc073007d.reference || (__cxx_static_address_973cbbd394d2fccdc073007d.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS2____header_global_ddb35be6cdbf6602; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:363
export const FOOTPRINTS3____header_global_0cd057ce81e5c5a4 = ((((((673) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e4e27b9cd0303b19fa0ca5bf() {
  return __cxx_static_address_e4e27b9cd0303b19fa0ca5bf.reference || (__cxx_static_address_e4e27b9cd0303b19fa0ca5bf.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS3____header_global_0cd057ce81e5c5a4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:364
export const FOOTPRINTS4____header_global_87d8e8268db17a78 = ((((((674) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8d629f36a6f2a1442b5b9f45() {
  return __cxx_static_address_8d629f36a6f2a1442b5b9f45.reference || (__cxx_static_address_8d629f36a6f2a1442b5b9f45.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS4____header_global_87d8e8268db17a78; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:365
export const EGG____header_global_c1eea801dbd8dbfd = ((((((675) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a5a90e19039be70e5595f85a() {
  return __cxx_static_address_a5a90e19039be70e5595f85a.reference || (__cxx_static_address_a5a90e19039be70e5595f85a.reference = {
    __cReference: true,
    get value() { return EGG____header_global_c1eea801dbd8dbfd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:366
export const SCALE____header_global_8d232557646395c8 = ((((((678) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ec1aac8fca2f03e07a2e44c4() {
  return __cxx_static_address_ec1aac8fca2f03e07a2e44c4.reference || (__cxx_static_address_ec1aac8fca2f03e07a2e44c4.reference = {
    __cReference: true,
    get value() { return SCALE____header_global_8d232557646395c8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:367
export const CHAIR3____header_global_066b4c75b9056bd0 = ((((((680) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_25cb067a44122e93b20ff55c() {
  return __cxx_static_address_25cb067a44122e93b20ff55c.reference || (__cxx_static_address_25cb067a44122e93b20ff55c.reference = {
    __cReference: true,
    get value() { return CHAIR3____header_global_066b4c75b9056bd0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:368
export const CAMERALIGHT____header_global_841a1e6758f3eaab = ((((((685) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e5cd3a63b39ed8e3d5b2ab91() {
  return __cxx_static_address_e5cd3a63b39ed8e3d5b2ab91.reference || (__cxx_static_address_e5cd3a63b39ed8e3d5b2ab91.reference = {
    __cReference: true,
    get value() { return CAMERALIGHT____header_global_841a1e6758f3eaab; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:369
export const MOVIECAMERA____header_global_24a0f7ca9b50cd3c = ((((((686) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c0cb3f09d6a3099b9b9fa0d8() {
  return __cxx_static_address_c0cb3f09d6a3099b9b9fa0d8.reference || (__cxx_static_address_c0cb3f09d6a3099b9b9fa0d8.reference = {
    __cReference: true,
    get value() { return MOVIECAMERA____header_global_24a0f7ca9b50cd3c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:370
export const IVUNIT____header_global_4b1c67b0130b533f = ((((((689) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_afb7d7ff7f4446cc0ca99028() {
  return __cxx_static_address_afb7d7ff7f4446cc0ca99028.reference || (__cxx_static_address_afb7d7ff7f4446cc0ca99028.reference = {
    __cReference: true,
    get value() { return IVUNIT____header_global_4b1c67b0130b533f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:371
export const POT1____header_global_adbcc40ba8889a2f = ((((((694) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4579cabaf31d81988f403467() {
  return __cxx_static_address_4579cabaf31d81988f403467.reference || (__cxx_static_address_4579cabaf31d81988f403467.reference = {
    __cReference: true,
    get value() { return POT1____header_global_adbcc40ba8889a2f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:372
export const POT2____header_global_0f99cf3fff73f41f = ((((((695) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_82a8608b946fb585d20433e1() {
  return __cxx_static_address_82a8608b946fb585d20433e1.reference || (__cxx_static_address_82a8608b946fb585d20433e1.reference = {
    __cReference: true,
    get value() { return POT2____header_global_0f99cf3fff73f41f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:373
export const POT3____header_global_369acfbfb7f0b64b = ((((((697) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_180564224e79f4592db4c142() {
  return __cxx_static_address_180564224e79f4592db4c142.reference || (__cxx_static_address_180564224e79f4592db4c142.reference = {
    __cReference: true,
    get value() { return POT3____header_global_369acfbfb7f0b64b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:374
export const PIPE3B____header_global_883d4250797f56ce = ((((((700) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2a18f9a3149c661b418e0e00() {
  return __cxx_static_address_2a18f9a3149c661b418e0e00.reference || (__cxx_static_address_2a18f9a3149c661b418e0e00.reference = {
    __cReference: true,
    get value() { return PIPE3B____header_global_883d4250797f56ce; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:375
export const WALLLIGHT3____header_global_671c3a296c644e8b = ((((((701) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_28d092a87158ad2fdd09993b() {
  return __cxx_static_address_28d092a87158ad2fdd09993b.reference || (__cxx_static_address_28d092a87158ad2fdd09993b.reference = {
    __cReference: true,
    get value() { return WALLLIGHT3____header_global_671c3a296c644e8b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:376
export const WALLLIGHTBUST3____header_global_e04536a91c30d2a2 = ((((((702) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7b75741ec08bf29db2cf29a8() {
  return __cxx_static_address_7b75741ec08bf29db2cf29a8.reference || (__cxx_static_address_7b75741ec08bf29db2cf29a8.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST3____header_global_e04536a91c30d2a2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:377
export const WALLLIGHT1____header_global_529444676d3c3a0e = ((((((703) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0c09462842d3a6ef5410eb5b() {
  return __cxx_static_address_0c09462842d3a6ef5410eb5b.reference || (__cxx_static_address_0c09462842d3a6ef5410eb5b.reference = {
    __cReference: true,
    get value() { return WALLLIGHT1____header_global_529444676d3c3a0e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:378
export const WALLLIGHTBUST1____header_global_dab0aa5e05b3ecef = ((((((704) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e1a3564a3a85fd9303f5b9cc() {
  return __cxx_static_address_e1a3564a3a85fd9303f5b9cc.reference || (__cxx_static_address_e1a3564a3a85fd9303f5b9cc.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST1____header_global_dab0aa5e05b3ecef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:379
export const WALLLIGHT2____header_global_c9bff19872f606ae = ((((((705) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7d07c0d0a78e524bdc894b8d() {
  return __cxx_static_address_7d07c0d0a78e524bdc894b8d.reference || (__cxx_static_address_7d07c0d0a78e524bdc894b8d.reference = {
    __cReference: true,
    get value() { return WALLLIGHT2____header_global_c9bff19872f606ae; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:380
export const WALLLIGHTBUST2____header_global_5b05dafe90090f73 = ((((((706) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b1fb8e3775efa10d095322a9() {
  return __cxx_static_address_b1fb8e3775efa10d095322a9.reference || (__cxx_static_address_b1fb8e3775efa10d095322a9.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST2____header_global_5b05dafe90090f73; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:381
export const LIGHTSWITCH2____header_global_6357212fa205b625 = ((((((712) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_965d3132f727f0ab557c5b46() {
  return __cxx_static_address_965d3132f727f0ab557c5b46.reference || (__cxx_static_address_965d3132f727f0ab557c5b46.reference = {
    __cReference: true,
    get value() { return LIGHTSWITCH2____header_global_6357212fa205b625; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:382
export const WAITTOBESEATED____header_global_baa19f228c5b5703 = ((((((716) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bea8cdc82e577158d2197179() {
  return __cxx_static_address_bea8cdc82e577158d2197179.reference || (__cxx_static_address_bea8cdc82e577158d2197179.reference = {
    __cReference: true,
    get value() { return WAITTOBESEATED____header_global_baa19f228c5b5703; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:383
export const DOORTILE14____header_global_c182f7d371b004ed = ((((((717) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_61d7d4b4118cfb99362ce996() {
  return __cxx_static_address_61d7d4b4118cfb99362ce996.reference || (__cxx_static_address_61d7d4b4118cfb99362ce996.reference = {
    __cReference: true,
    get value() { return DOORTILE14____header_global_c182f7d371b004ed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:384
export const STATUE____header_global_758131df71b033a5 = ((((((753) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d468476678580ffb986b8169() {
  return __cxx_static_address_d468476678580ffb986b8169.reference || (__cxx_static_address_d468476678580ffb986b8169.reference = {
    __cReference: true,
    get value() { return STATUE____header_global_758131df71b033a5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:385
export const MIKE____header_global_b14c50f05464fc71 = ((((((762) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_88e3d53c66bb4307ed5f511f() {
  return __cxx_static_address_88e3d53c66bb4307ed5f511f.reference || (__cxx_static_address_88e3d53c66bb4307ed5f511f.reference = {
    __cReference: true,
    get value() { return MIKE____header_global_b14c50f05464fc71; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:386
export const VASE____header_global_46468af195ca635f = ((((((765) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_67ffc22c760c2915fe76b05a() {
  return __cxx_static_address_67ffc22c760c2915fe76b05a.reference || (__cxx_static_address_67ffc22c760c2915fe76b05a.reference = {
    __cReference: true,
    get value() { return VASE____header_global_46468af195ca635f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:387
export const SUSHIPLATE1____header_global_f3770638ba91047b = ((((((768) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3ca949d94f0460236252737b() {
  return __cxx_static_address_3ca949d94f0460236252737b.reference || (__cxx_static_address_3ca949d94f0460236252737b.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE1____header_global_f3770638ba91047b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:388
export const SUSHIPLATE2____header_global_b2389f265dec6f93 = ((((((769) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_67bae5ff98249a71d41d3b67() {
  return __cxx_static_address_67bae5ff98249a71d41d3b67.reference || (__cxx_static_address_67bae5ff98249a71d41d3b67.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE2____header_global_b2389f265dec6f93; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:389
export const SUSHIPLATE3____header_global_8578bf674b6c8117 = ((((((774) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_18d92847f93055a63454bb5e() {
  return __cxx_static_address_18d92847f93055a63454bb5e.reference || (__cxx_static_address_18d92847f93055a63454bb5e.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE3____header_global_8578bf674b6c8117; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:390
export const SUSHIPLATE4____header_global_15818c4be4dd06be = ((((((779) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bd8a0c2768fffe79a5a80c19() {
  return __cxx_static_address_bd8a0c2768fffe79a5a80c19.reference || (__cxx_static_address_bd8a0c2768fffe79a5a80c19.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE4____header_global_15818c4be4dd06be; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:391
export const DOORTILE16____header_global_f90fc7e5e510dc0f = ((((((781) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_22ffe5b864266053c3b54ac0() {
  return __cxx_static_address_22ffe5b864266053c3b54ac0.reference || (__cxx_static_address_22ffe5b864266053c3b54ac0.reference = {
    __cReference: true,
    get value() { return DOORTILE16____header_global_f90fc7e5e510dc0f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:392
export const SUSHIPLATE5____header_global_0dc2f53017a82eb3 = ((((((792) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7f09d2d855647817af5707a9() {
  return __cxx_static_address_7f09d2d855647817af5707a9.reference || (__cxx_static_address_7f09d2d855647817af5707a9.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE5____header_global_0dc2f53017a82eb3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:393
export const OJ____header_global_f71383e25fae66c2 = ((((((806) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1e7345d1c577680e54c94abd() {
  return __cxx_static_address_1e7345d1c577680e54c94abd.reference || (__cxx_static_address_1e7345d1c577680e54c94abd.reference = {
    __cReference: true,
    get value() { return OJ____header_global_f71383e25fae66c2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:394
export const MASKWALL13____header_global_bdfdfc1284e67a3f = ((((((830) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_983fcb25692892d516250425() {
  return __cxx_static_address_983fcb25692892d516250425.reference || (__cxx_static_address_983fcb25692892d516250425.reference = {
    __cReference: true,
    get value() { return MASKWALL13____header_global_bdfdfc1284e67a3f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:395
export const HURTRAIL____header_global_40a3776d76fbc2dc = ((((((859) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5429db43953881a46f839f6f() {
  return __cxx_static_address_5429db43953881a46f839f6f.reference || (__cxx_static_address_5429db43953881a46f839f6f.reference = {
    __cReference: true,
    get value() { return HURTRAIL____header_global_40a3776d76fbc2dc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:396
export const POWERSWITCH1____header_global_374323185635c763 = ((((((860) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b27b989295309289c6c68352() {
  return __cxx_static_address_b27b989295309289c6c68352.reference || (__cxx_static_address_b27b989295309289c6c68352.reference = {
    __cReference: true,
    get value() { return POWERSWITCH1____header_global_374323185635c763; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:397
export const LOCKSWITCH1____header_global_3ea45d29d0398635 = ((((((862) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aa75fc6675692f752edd06c0() {
  return __cxx_static_address_aa75fc6675692f752edd06c0.reference || (__cxx_static_address_aa75fc6675692f752edd06c0.reference = {
    __cReference: true,
    get value() { return LOCKSWITCH1____header_global_3ea45d29d0398635; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:398
export const POWERSWITCH2____header_global_119fafb52517645b = ((((((864) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0e4b56cc7609dccc5c442cb4() {
  return __cxx_static_address_0e4b56cc7609dccc5c442cb4.reference || (__cxx_static_address_0e4b56cc7609dccc5c442cb4.reference = {
    __cReference: true,
    get value() { return POWERSWITCH2____header_global_119fafb52517645b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:399
export const ATM____header_global_8415e9457e4725c1 = ((((((867) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4f9a24c2ae250c87c8db3e26() {
  return __cxx_static_address_4f9a24c2ae250c87c8db3e26.reference || (__cxx_static_address_4f9a24c2ae250c87c8db3e26.reference = {
    __cReference: true,
    get value() { return ATM____header_global_8415e9457e4725c1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:400
export const STATUEFLASH____header_global_85a59840fe9adaf0 = ((((((869) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2f3098ab92491c221a968d49() {
  return __cxx_static_address_2f3098ab92491c221a968d49.reference || (__cxx_static_address_2f3098ab92491c221a968d49.reference = {
    __cReference: true,
    get value() { return STATUEFLASH____header_global_85a59840fe9adaf0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:401
export const ATMBROKE____header_global_8953442fc26cc7fc = ((((((888) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_43f858fc97f4007241d707bc() {
  return __cxx_static_address_43f858fc97f4007241d707bc.reference || (__cxx_static_address_43f858fc97f4007241d707bc.reference = {
    __cReference: true,
    get value() { return ATMBROKE____header_global_8953442fc26cc7fc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:402
export const STRIPEBALL____header_global_8a27693729d9eb6e = ((((((901) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_521a28465f65e281ca8d3ea0() {
  return __cxx_static_address_521a28465f65e281ca8d3ea0.reference || (__cxx_static_address_521a28465f65e281ca8d3ea0.reference = {
    __cReference: true,
    get value() { return STRIPEBALL____header_global_8a27693729d9eb6e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:403
export const QUEBALL____header_global_39316bcfbfdf8aeb = ((((((902) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_beaf79af12ebac9d577f7f01() {
  return __cxx_static_address_beaf79af12ebac9d577f7f01.reference || (__cxx_static_address_beaf79af12ebac9d577f7f01.reference = {
    __cReference: true,
    get value() { return QUEBALL____header_global_39316bcfbfdf8aeb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:404
export const POCKET____header_global_225d2e7163af52a9 = ((((((903) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_17ff5c9c81b208cb96398918() {
  return __cxx_static_address_17ff5c9c81b208cb96398918.reference || (__cxx_static_address_17ff5c9c81b208cb96398918.reference = {
    __cReference: true,
    get value() { return POCKET____header_global_225d2e7163af52a9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:405
export const WOODENHORSE____header_global_b1d26eabc3959639 = ((((((904) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b55e495540652f1bdd60210a() {
  return __cxx_static_address_b55e495540652f1bdd60210a.reference || (__cxx_static_address_b55e495540652f1bdd60210a.reference = {
    __cReference: true,
    get value() { return WOODENHORSE____header_global_b1d26eabc3959639; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:406
export const TREE1____header_global_2e5f0605903a66b5 = ((((((908) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6947b72701b4f6a478ca1f3f() {
  return __cxx_static_address_6947b72701b4f6a478ca1f3f.reference || (__cxx_static_address_6947b72701b4f6a478ca1f3f.reference = {
    __cReference: true,
    get value() { return TREE1____header_global_2e5f0605903a66b5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:407
export const TREE2____header_global_a857244bb1a0b364 = ((((((910) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bab22dd63686baf53f626c0a() {
  return __cxx_static_address_bab22dd63686baf53f626c0a.reference || (__cxx_static_address_bab22dd63686baf53f626c0a.reference = {
    __cReference: true,
    get value() { return TREE2____header_global_a857244bb1a0b364; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:408
export const CACTUS____header_global_3dca58903b5966a4 = ((((((911) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b2311dc2b76d6eda74424093() {
  return __cxx_static_address_b2311dc2b76d6eda74424093.reference || (__cxx_static_address_b2311dc2b76d6eda74424093.reference = {
    __cReference: true,
    get value() { return CACTUS____header_global_3dca58903b5966a4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:409
export const MASKWALL2____header_global_9d775ca25c878b84 = ((((((913) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6028d3589778a07c4d4d8643() {
  return __cxx_static_address_6028d3589778a07c4d4d8643.reference || (__cxx_static_address_6028d3589778a07c4d4d8643.reference = {
    __cReference: true,
    get value() { return MASKWALL2____header_global_9d775ca25c878b84; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:410
export const MASKWALL3____header_global_5da6054989cbea90 = ((((((914) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1ca7c563dae2b6bfcf9d989c() {
  return __cxx_static_address_1ca7c563dae2b6bfcf9d989c.reference || (__cxx_static_address_1ca7c563dae2b6bfcf9d989c.reference = {
    __cReference: true,
    get value() { return MASKWALL3____header_global_5da6054989cbea90; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:411
export const MASKWALL4____header_global_c54356181a16c0f8 = ((((((915) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_00fe1a9a48690eb17909f958() {
  return __cxx_static_address_00fe1a9a48690eb17909f958.reference || (__cxx_static_address_00fe1a9a48690eb17909f958.reference = {
    __cReference: true,
    get value() { return MASKWALL4____header_global_c54356181a16c0f8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:412
export const FIREEXT____header_global_34cf93da82529edb = ((((((916) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_55730e3010def641b40668ce() {
  return __cxx_static_address_55730e3010def641b40668ce.reference || (__cxx_static_address_55730e3010def641b40668ce.reference = {
    __cReference: true,
    get value() { return FIREEXT____header_global_34cf93da82529edb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:413
export const TOILETWATER____header_global_24add7a840d056a8 = ((((((921) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f2b96e651d590e38e9a09071() {
  return __cxx_static_address_f2b96e651d590e38e9a09071.reference || (__cxx_static_address_f2b96e651d590e38e9a09071.reference = {
    __cReference: true,
    get value() { return TOILETWATER____header_global_24add7a840d056a8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:414
export const NEON1____header_global_bc324eff11ae6d00 = ((((((925) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_75b43f600e4e443e4605a00d() {
  return __cxx_static_address_75b43f600e4e443e4605a00d.reference || (__cxx_static_address_75b43f600e4e443e4605a00d.reference = {
    __cReference: true,
    get value() { return NEON1____header_global_bc324eff11ae6d00; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:415
export const NEON2____header_global_de6d105ec71ae53d = ((((((926) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a40b65df48b82beabfaa8ce7() {
  return __cxx_static_address_a40b65df48b82beabfaa8ce7.reference || (__cxx_static_address_a40b65df48b82beabfaa8ce7.reference = {
    __cReference: true,
    get value() { return NEON2____header_global_de6d105ec71ae53d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:416
export const CACTUSBROKE____header_global_d99a3ecade01f7f4 = ((((((939) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5b374a629c72604aab94f80b() {
  return __cxx_static_address_5b374a629c72604aab94f80b.reference || (__cxx_static_address_5b374a629c72604aab94f80b.reference = {
    __cReference: true,
    get value() { return CACTUSBROKE____header_global_d99a3ecade01f7f4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:417
export const BOUNCEMINE____header_global_4518638ef7da5b3d = ((((((940) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fb4432cf29827b373fd09928() {
  return __cxx_static_address_fb4432cf29827b373fd09928.reference || (__cxx_static_address_fb4432cf29827b373fd09928.reference = {
    __cReference: true,
    get value() { return BOUNCEMINE____header_global_4518638ef7da5b3d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:418
export const BROKEFIREHYDRENT____header_global_376a21062977f99c = ((((((950) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_03930d418708d5a7a519b0c3() {
  return __cxx_static_address_03930d418708d5a7a519b0c3.reference || (__cxx_static_address_03930d418708d5a7a519b0c3.reference = {
    __cReference: true,
    get value() { return BROKEFIREHYDRENT____header_global_376a21062977f99c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:419
export const BOX____header_global_71c7a2b61c93cfb1 = ((((((951) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fa43bbdfb621d300ed6db9ad() {
  return __cxx_static_address_fa43bbdfb621d300ed6db9ad.reference || (__cxx_static_address_fa43bbdfb621d300ed6db9ad.reference = {
    __cReference: true,
    get value() { return BOX____header_global_71c7a2b61c93cfb1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:420
export const BULLETHOLE____header_global_b463b68b841a5f8c = ((((((952) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0bd6bfa25eb63179f1d9c92c() {
  return __cxx_static_address_0bd6bfa25eb63179f1d9c92c.reference || (__cxx_static_address_0bd6bfa25eb63179f1d9c92c.reference = {
    __cReference: true,
    get value() { return BULLETHOLE____header_global_b463b68b841a5f8c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:421
export const BOTTLE1____header_global_e78eed5c23b7ee9f = ((((((954) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0d81053b03db324946ff3352() {
  return __cxx_static_address_0d81053b03db324946ff3352.reference || (__cxx_static_address_0d81053b03db324946ff3352.reference = {
    __cReference: true,
    get value() { return BOTTLE1____header_global_e78eed5c23b7ee9f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:422
export const BOTTLE2____header_global_9f3f073f4e9aa83f = ((((((955) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_37c68776329651b9c276802f() {
  return __cxx_static_address_37c68776329651b9c276802f.reference || (__cxx_static_address_37c68776329651b9c276802f.reference = {
    __cReference: true,
    get value() { return BOTTLE2____header_global_9f3f073f4e9aa83f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:423
export const BOTTLE3____header_global_118e07e2fdad3ac9 = ((((((956) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9813edfcb9b366ccd549311c() {
  return __cxx_static_address_9813edfcb9b366ccd549311c.reference || (__cxx_static_address_9813edfcb9b366ccd549311c.reference = {
    __cReference: true,
    get value() { return BOTTLE3____header_global_118e07e2fdad3ac9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:424
export const BOTTLE4____header_global_b8d679eb5f97b844 = ((((((957) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dc3ebfa598e88d491c56c659() {
  return __cxx_static_address_dc3ebfa598e88d491c56c659.reference || (__cxx_static_address_dc3ebfa598e88d491c56c659.reference = {
    __cReference: true,
    get value() { return BOTTLE4____header_global_b8d679eb5f97b844; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:425
export const FEMPIC5____header_global_77194115204c0bc6 = ((((((963) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_086e9a9282cb1f2ff5734488() {
  return __cxx_static_address_086e9a9282cb1f2ff5734488.reference || (__cxx_static_address_086e9a9282cb1f2ff5734488.reference = {
    __cReference: true,
    get value() { return FEMPIC5____header_global_77194115204c0bc6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:426
export const FEMPIC6____header_global_3eb5dddd5e44c6a0 = ((((((964) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_75c3698b884b9aa5850e91f4() {
  return __cxx_static_address_75c3698b884b9aa5850e91f4.reference || (__cxx_static_address_75c3698b884b9aa5850e91f4.reference = {
    __cReference: true,
    get value() { return FEMPIC6____header_global_3eb5dddd5e44c6a0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:427
export const FEMPIC7____header_global_440351f573486a25 = ((((((965) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1f543571306d50e17fbba63a() {
  return __cxx_static_address_1f543571306d50e17fbba63a.reference || (__cxx_static_address_1f543571306d50e17fbba63a.reference = {
    __cReference: true,
    get value() { return FEMPIC7____header_global_440351f573486a25; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:428
export const HYDROPLANT____header_global_023136066e2eb0f0 = ((((((969) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c530387c62e81006d8628c19() {
  return __cxx_static_address_c530387c62e81006d8628c19.reference || (__cxx_static_address_c530387c62e81006d8628c19.reference = {
    __cReference: true,
    get value() { return HYDROPLANT____header_global_023136066e2eb0f0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:429
export const OCEANSPRITE1____header_global_62d26a24cec2cdd8 = ((((((971) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0c6ccfde36001d3946dc231b() {
  return __cxx_static_address_0c6ccfde36001d3946dc231b.reference || (__cxx_static_address_0c6ccfde36001d3946dc231b.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE1____header_global_62d26a24cec2cdd8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:430
export const OCEANSPRITE2____header_global_d3af2d7b11af24d6 = ((((((972) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_83bcba0e61854b4315ddc1d7() {
  return __cxx_static_address_83bcba0e61854b4315ddc1d7.reference || (__cxx_static_address_83bcba0e61854b4315ddc1d7.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE2____header_global_d3af2d7b11af24d6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:431
export const OCEANSPRITE3____header_global_0a7126e2685198e9 = ((((((973) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_add342b1f71596c23695bfba() {
  return __cxx_static_address_add342b1f71596c23695bfba.reference || (__cxx_static_address_add342b1f71596c23695bfba.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE3____header_global_0a7126e2685198e9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:432
export const OCEANSPRITE4____header_global_8e4372eb23d90c96 = ((((((974) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_313b74c9684cad8f85595377() {
  return __cxx_static_address_313b74c9684cad8f85595377.reference || (__cxx_static_address_313b74c9684cad8f85595377.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE4____header_global_8e4372eb23d90c96; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:433
export const OCEANSPRITE5____header_global_1e8f86f80bfe264c = ((((((975) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_17e64ddf9d0ce8d0f37e5ba6() {
  return __cxx_static_address_17e64ddf9d0ce8d0f37e5ba6.reference || (__cxx_static_address_17e64ddf9d0ce8d0f37e5ba6.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE5____header_global_1e8f86f80bfe264c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:434
export const GENERICPOLE____header_global_f3061bedf4df049c = ((((((977) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_60529ea2092155a84d1d254a() {
  return __cxx_static_address_60529ea2092155a84d1d254a.reference || (__cxx_static_address_60529ea2092155a84d1d254a.reference = {
    __cReference: true,
    get value() { return GENERICPOLE____header_global_f3061bedf4df049c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:435
export const CONE____header_global_f3e5324116decde8 = ((((((978) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_775e941985b366edece35bbe() {
  return __cxx_static_address_775e941985b366edece35bbe.reference || (__cxx_static_address_775e941985b366edece35bbe.reference = {
    __cReference: true,
    get value() { return CONE____header_global_f3e5324116decde8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:436
export const HANGLIGHT____header_global_6c2252129dfae2e8 = ((((((979) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3c2cc73ff4e802baec0644d4() {
  return __cxx_static_address_3c2cc73ff4e802baec0644d4.reference || (__cxx_static_address_3c2cc73ff4e802baec0644d4.reference = {
    __cReference: true,
    get value() { return HANGLIGHT____header_global_6c2252129dfae2e8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:437
export const HYDRENT____header_global_87ed7cd6d909085d = ((((((981) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6243bb70fbdb4644176888d4() {
  return __cxx_static_address_6243bb70fbdb4644176888d4.reference || (__cxx_static_address_6243bb70fbdb4644176888d4.reference = {
    __cReference: true,
    get value() { return HYDRENT____header_global_87ed7cd6d909085d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:438
export const MASKWALL14____header_global_b8184d175f575191 = ((((((988) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_54ee475526d1306acd069a54() {
  return __cxx_static_address_54ee475526d1306acd069a54.reference || (__cxx_static_address_54ee475526d1306acd069a54.reference = {
    __cReference: true,
    get value() { return MASKWALL14____header_global_b8184d175f575191; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:439
export const TIRE____header_global_0ab870bfcb2c3261 = ((((((990) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_630e5df7381cac85a4603103() {
  return __cxx_static_address_630e5df7381cac85a4603103.reference || (__cxx_static_address_630e5df7381cac85a4603103.reference = {
    __cReference: true,
    get value() { return TIRE____header_global_0ab870bfcb2c3261; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:440
export const PIPE5____header_global_33cd35287a0d60b0 = ((((((994) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7c214c465616c008c6d81236() {
  return __cxx_static_address_7c214c465616c008c6d81236.reference || (__cxx_static_address_7c214c465616c008c6d81236.reference = {
    __cReference: true,
    get value() { return PIPE5____header_global_33cd35287a0d60b0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:441
export const PIPE6____header_global_9c66107f76c6b331 = ((((((995) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a241aee1f0bb477fcd33f35a() {
  return __cxx_static_address_a241aee1f0bb477fcd33f35a.reference || (__cxx_static_address_a241aee1f0bb477fcd33f35a.reference = {
    __cReference: true,
    get value() { return PIPE6____header_global_9c66107f76c6b331; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:442
export const PIPE4____header_global_9f38335e63410438 = ((((((996) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6377b4fd40261f3bb26d99b3() {
  return __cxx_static_address_6377b4fd40261f3bb26d99b3.reference || (__cxx_static_address_6377b4fd40261f3bb26d99b3.reference = {
    __cReference: true,
    get value() { return PIPE4____header_global_9f38335e63410438; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:443
export const PIPE4B____header_global_7b645029cb7242d9 = ((((((997) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b2e263954fbb5f0b9210da86() {
  return __cxx_static_address_b2e263954fbb5f0b9210da86.reference || (__cxx_static_address_b2e263954fbb5f0b9210da86.reference = {
    __cReference: true,
    get value() { return PIPE4B____header_global_7b645029cb7242d9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:444
export const BROKEHYDROPLANT____header_global_b5a6f8ddaaf7449c = ((((((1003) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_262533a99c0d211e93ab95a3() {
  return __cxx_static_address_262533a99c0d211e93ab95a3.reference || (__cxx_static_address_262533a99c0d211e93ab95a3.reference = {
    __cReference: true,
    get value() { return BROKEHYDROPLANT____header_global_b5a6f8ddaaf7449c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:445
export const PIPE5B____header_global_c8b95b7eb8e85278 = ((((((1005) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_15b9971a7ee77fd3c88e2063() {
  return __cxx_static_address_15b9971a7ee77fd3c88e2063.reference || (__cxx_static_address_15b9971a7ee77fd3c88e2063.reference = {
    __cReference: true,
    get value() { return PIPE5B____header_global_c8b95b7eb8e85278; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:446
export const NEON3____header_global_2fee7bc0fa846a13 = ((((((1007) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c79cd69d6527eb835d336255() {
  return __cxx_static_address_c79cd69d6527eb835d336255.reference || (__cxx_static_address_c79cd69d6527eb835d336255.reference = {
    __cReference: true,
    get value() { return NEON3____header_global_2fee7bc0fa846a13; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:447
export const NEON4____header_global_7b7bba098e63ee7c = ((((((1008) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_27ada06f427ef0609b54f474() {
  return __cxx_static_address_27ada06f427ef0609b54f474.reference || (__cxx_static_address_27ada06f427ef0609b54f474.reference = {
    __cReference: true,
    get value() { return NEON4____header_global_7b7bba098e63ee7c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:448
export const NEON5____header_global_0184cd5055f56acb = ((((((1009) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d95427735f081b34a98f7bd0() {
  return __cxx_static_address_d95427735f081b34a98f7bd0.reference || (__cxx_static_address_d95427735f081b34a98f7bd0.reference = {
    __cReference: true,
    get value() { return NEON5____header_global_0184cd5055f56acb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:449
export const BOTTLE5____header_global_8ae15c684162ecd8 = ((((((1012) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_609fb402537e3a4da227cae9() {
  return __cxx_static_address_609fb402537e3a4da227cae9.reference || (__cxx_static_address_609fb402537e3a4da227cae9.reference = {
    __cReference: true,
    get value() { return BOTTLE5____header_global_8ae15c684162ecd8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:450
export const BOTTLE6____header_global_47d2a3de5b75ef1b = ((((((1013) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5166b079b8aef0e42eff7a41() {
  return __cxx_static_address_5166b079b8aef0e42eff7a41.reference || (__cxx_static_address_5166b079b8aef0e42eff7a41.reference = {
    __cReference: true,
    get value() { return BOTTLE6____header_global_47d2a3de5b75ef1b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:451
export const BOTTLE8____header_global_34cce48972dce05f = ((((((1014) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f0e703ab3267df8c3518b283() {
  return __cxx_static_address_f0e703ab3267df8c3518b283.reference || (__cxx_static_address_f0e703ab3267df8c3518b283.reference = {
    __cReference: true,
    get value() { return BOTTLE8____header_global_34cce48972dce05f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:452
export const SPOTLITE____header_global_492c3155524ca15b = ((((((1020) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c37ff33eef102b26e1a1d458() {
  return __cxx_static_address_c37ff33eef102b26e1a1d458.reference || (__cxx_static_address_c37ff33eef102b26e1a1d458.reference = {
    __cReference: true,
    get value() { return SPOTLITE____header_global_492c3155524ca15b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:453
export const MASKWALL15____header_global_a6cde170f1d1a626 = ((((((1024) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_671facfd953c5aa12fb3e747() {
  return __cxx_static_address_671facfd953c5aa12fb3e747.reference || (__cxx_static_address_671facfd953c5aa12fb3e747.reference = {
    __cReference: true,
    get value() { return MASKWALL15____header_global_a6cde170f1d1a626; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:454
export const BOTTLE7____header_global_289d995b5533aab1 = ((((((1025) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c4b5a27905672e911cbeb082() {
  return __cxx_static_address_c4b5a27905672e911cbeb082.reference || (__cxx_static_address_c4b5a27905672e911cbeb082.reference = {
    __cReference: true,
    get value() { return BOTTLE7____header_global_289d995b5533aab1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:455
export const HORSEONSIDE____header_global_480be3c931a49b81 = ((((((1026) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_199026d666b58f4d01be290d() {
  return __cxx_static_address_199026d666b58f4d01be290d.reference || (__cxx_static_address_199026d666b58f4d01be290d.reference = {
    __cReference: true,
    get value() { return HORSEONSIDE____header_global_480be3c931a49b81; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:456
export const GLASSPIECES____header_global_49c1ba8978b86f16 = ((((((1031) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3dbaf3277e551759683dfb24() {
  return __cxx_static_address_3dbaf3277e551759683dfb24.reference || (__cxx_static_address_3dbaf3277e551759683dfb24.reference = {
    __cReference: true,
    get value() { return GLASSPIECES____header_global_49c1ba8978b86f16; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:457
export const NEON6____header_global_0755c08ecfd3f0b6 = ((((((1046) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a14a6fed4dd38df975e7bf4e() {
  return __cxx_static_address_a14a6fed4dd38df975e7bf4e.reference || (__cxx_static_address_a14a6fed4dd38df975e7bf4e.reference = {
    __cReference: true,
    get value() { return NEON6____header_global_0755c08ecfd3f0b6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:458
export const MASKWALL6____header_global_f6ddbcd06c8db9ef = ((((((1059) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_664f5d21af51ccafef4cb2d7() {
  return __cxx_static_address_664f5d21af51ccafef4cb2d7.reference || (__cxx_static_address_664f5d21af51ccafef4cb2d7.reference = {
    __cReference: true,
    get value() { return MASKWALL6____header_global_f6ddbcd06c8db9ef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:459
export const RUBBERCAN____header_global_7de9e9c10066e4e8 = ((((((1062) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1b259594667b7593365e3c16() {
  return __cxx_static_address_1b259594667b7593365e3c16.reference || (__cxx_static_address_1b259594667b7593365e3c16.reference = {
    __cReference: true,
    get value() { return RUBBERCAN____header_global_7de9e9c10066e4e8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:460
export const PLUG____header_global_9806d187de08239b = ((((((1069) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_141984638da8b2dfa618f3e0() {
  return __cxx_static_address_141984638da8b2dfa618f3e0.reference || (__cxx_static_address_141984638da8b2dfa618f3e0.reference = {
    __cReference: true,
    get value() { return PLUG____header_global_9806d187de08239b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:461
export const OOZFILTER____header_global_36aab99e7d1ad4de = ((((((1079) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ee3d55ab18728b6d3e8678ca() {
  return __cxx_static_address_ee3d55ab18728b6d3e8678ca.reference || (__cxx_static_address_ee3d55ab18728b6d3e8678ca.reference = {
    __cReference: true,
    get value() { return OOZFILTER____header_global_36aab99e7d1ad4de; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:462
export const FLOORPLASMA____header_global_fc68a609b7905d3b = ((((((1082) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_38d863833ef8f60999850271() {
  return __cxx_static_address_38d863833ef8f60999850271.reference || (__cxx_static_address_38d863833ef8f60999850271.reference = {
    __cReference: true,
    get value() { return FLOORPLASMA____header_global_fc68a609b7905d3b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:463
export const REACTOR____header_global_7fd6eab1d3a3554f = ((((((1088) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b150bfe20691e60f240dd720() {
  return __cxx_static_address_b150bfe20691e60f240dd720.reference || (__cxx_static_address_b150bfe20691e60f240dd720.reference = {
    __cReference: true,
    get value() { return REACTOR____header_global_7fd6eab1d3a3554f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:464
export const REACTORSPARK____header_global_cadad14591534e2e = ((((((1092) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4b2e48f2f6971cae32bbfcae() {
  return __cxx_static_address_4b2e48f2f6971cae32bbfcae.reference || (__cxx_static_address_4b2e48f2f6971cae32bbfcae.reference = {
    __cReference: true,
    get value() { return REACTORSPARK____header_global_cadad14591534e2e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:465
export const REACTORBURNT____header_global_6b82422bed7d4286 = ((((((1096) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_23642a551a5568140e5cfb79() {
  return __cxx_static_address_23642a551a5568140e5cfb79.reference || (__cxx_static_address_23642a551a5568140e5cfb79.reference = {
    __cReference: true,
    get value() { return REACTORBURNT____header_global_6b82422bed7d4286; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:466
export const DOORTILE15____header_global_a147e4caafd2e0f8 = ((((((1102) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ea865d4ddd10a75265dbfe21() {
  return __cxx_static_address_ea865d4ddd10a75265dbfe21.reference || (__cxx_static_address_ea865d4ddd10a75265dbfe21.reference = {
    __cReference: true,
    get value() { return DOORTILE15____header_global_a147e4caafd2e0f8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:467
export const HANDSWITCH____header_global_f93d1ab618ea3ee8 = ((((((1111) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f0a74f76641fe8791f4c0976() {
  return __cxx_static_address_f0a74f76641fe8791f4c0976.reference || (__cxx_static_address_f0a74f76641fe8791f4c0976.reference = {
    __cReference: true,
    get value() { return HANDSWITCH____header_global_f93d1ab618ea3ee8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:468
export const CIRCLEPANNEL____header_global_4b62081841b77767 = ((((((1113) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_233953c5a1457f6f5067a895() {
  return __cxx_static_address_233953c5a1457f6f5067a895.reference || (__cxx_static_address_233953c5a1457f6f5067a895.reference = {
    __cReference: true,
    get value() { return CIRCLEPANNEL____header_global_4b62081841b77767; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:469
export const CIRCLEPANNELBROKE____header_global_b525afb9eb7925d8 = ((((((1114) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c23a7d8fd6aec0b5eb07ca75() {
  return __cxx_static_address_c23a7d8fd6aec0b5eb07ca75.reference || (__cxx_static_address_c23a7d8fd6aec0b5eb07ca75.reference = {
    __cReference: true,
    get value() { return CIRCLEPANNELBROKE____header_global_b525afb9eb7925d8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:470
export const PULLSWITCH____header_global_5bd00b6fec1c4e96 = ((((((1122) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_147ab25245a6797208744791() {
  return __cxx_static_address_147ab25245a6797208744791.reference || (__cxx_static_address_147ab25245a6797208744791.reference = {
    __cReference: true,
    get value() { return PULLSWITCH____header_global_5bd00b6fec1c4e96; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:471
export const MASKWALL8____header_global_a9daf8b3e8308da9 = ((((((1124) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_61fb040cbeb75a183bde398c() {
  return __cxx_static_address_61fb040cbeb75a183bde398c.reference || (__cxx_static_address_61fb040cbeb75a183bde398c.reference = {
    __cReference: true,
    get value() { return MASKWALL8____header_global_a9daf8b3e8308da9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:472
export const BIGHOLE____header_global_df5b0633d0600c92 = ((((((1141) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e8c633d3f56a0543144e23dc() {
  return __cxx_static_address_e8c633d3f56a0543144e23dc.reference || (__cxx_static_address_e8c633d3f56a0543144e23dc.reference = {
    __cReference: true,
    get value() { return BIGHOLE____header_global_df5b0633d0600c92; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:473
export const ALIENSWITCH____header_global_2f6d19ee998b30fd = ((((((1142) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2d65540a089dd57f92974fff() {
  return __cxx_static_address_2d65540a089dd57f92974fff.reference || (__cxx_static_address_2d65540a089dd57f92974fff.reference = {
    __cReference: true,
    get value() { return ALIENSWITCH____header_global_2f6d19ee998b30fd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:474
export const DOORTILE21____header_global_24b53044a8b93cf1 = ((((((1144) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fcd7eb82a978b53ed4721cc3() {
  return __cxx_static_address_fcd7eb82a978b53ed4721cc3.reference || (__cxx_static_address_fcd7eb82a978b53ed4721cc3.reference = {
    __cReference: true,
    get value() { return DOORTILE21____header_global_24b53044a8b93cf1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:475
export const HANDPRINTSWITCH____header_global_e158d131483cce36 = ((((((1155) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_923e70a090c3f8d9a46ba80c() {
  return __cxx_static_address_923e70a090c3f8d9a46ba80c.reference || (__cxx_static_address_923e70a090c3f8d9a46ba80c.reference = {
    __cReference: true,
    get value() { return HANDPRINTSWITCH____header_global_e158d131483cce36; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:476
export const BOTTLE10____header_global_0ec1a7055df93b10 = ((((((1157) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_336a0a3fff9b6ad211bdfd07() {
  return __cxx_static_address_336a0a3fff9b6ad211bdfd07.reference || (__cxx_static_address_336a0a3fff9b6ad211bdfd07.reference = {
    __cReference: true,
    get value() { return BOTTLE10____header_global_0ec1a7055df93b10; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:477
export const BOTTLE11____header_global_7b7717aa3cc61766 = ((((((1158) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e2b49cda994c65411df5a8e9() {
  return __cxx_static_address_e2b49cda994c65411df5a8e9.reference || (__cxx_static_address_e2b49cda994c65411df5a8e9.reference = {
    __cReference: true,
    get value() { return BOTTLE11____header_global_7b7717aa3cc61766; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:478
export const BOTTLE12____header_global_7ab276f14c92a1e2 = ((((((1159) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ce28a227ba6c8e8647998f15() {
  return __cxx_static_address_ce28a227ba6c8e8647998f15.reference || (__cxx_static_address_ce28a227ba6c8e8647998f15.reference = {
    __cReference: true,
    get value() { return BOTTLE12____header_global_7ab276f14c92a1e2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:479
export const BOTTLE13____header_global_70d3bbbd545c4304 = ((((((1160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0f2e7b7757cc530bbd9444b3() {
  return __cxx_static_address_0f2e7b7757cc530bbd9444b3.reference || (__cxx_static_address_0f2e7b7757cc530bbd9444b3.reference = {
    __cReference: true,
    get value() { return BOTTLE13____header_global_70d3bbbd545c4304; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:480
export const BOTTLE14____header_global_a0700534fc28373f = ((((((1161) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d79e18c091b6b63231c108a3() {
  return __cxx_static_address_d79e18c091b6b63231c108a3.reference || (__cxx_static_address_d79e18c091b6b63231c108a3.reference = {
    __cReference: true,
    get value() { return BOTTLE14____header_global_a0700534fc28373f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:481
export const BOTTLE15____header_global_bf6b98f0a40ba6b6 = ((((((1162) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3226011c39f6f31c3424c659() {
  return __cxx_static_address_3226011c39f6f31c3424c659.reference || (__cxx_static_address_3226011c39f6f31c3424c659.reference = {
    __cReference: true,
    get value() { return BOTTLE15____header_global_bf6b98f0a40ba6b6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:482
export const BOTTLE16____header_global_fbdc68a8dd6849b6 = ((((((1163) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2bd1d6dc63490701b80f2dc2() {
  return __cxx_static_address_2bd1d6dc63490701b80f2dc2.reference || (__cxx_static_address_2bd1d6dc63490701b80f2dc2.reference = {
    __cReference: true,
    get value() { return BOTTLE16____header_global_fbdc68a8dd6849b6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:483
export const BOTTLE17____header_global_d5e3d0301b3d41b3 = ((((((1164) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0eb955875470eff6fe733a08() {
  return __cxx_static_address_0eb955875470eff6fe733a08.reference || (__cxx_static_address_0eb955875470eff6fe733a08.reference = {
    __cReference: true,
    get value() { return BOTTLE17____header_global_d5e3d0301b3d41b3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:484
export const BOTTLE18____header_global_e60d70839915dfb8 = ((((((1165) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2fd701ecab53572a6188ac0d() {
  return __cxx_static_address_2fd701ecab53572a6188ac0d.reference || (__cxx_static_address_2fd701ecab53572a6188ac0d.reference = {
    __cReference: true,
    get value() { return BOTTLE18____header_global_e60d70839915dfb8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:485
export const BOTTLE19____header_global_57c1c8d2026a8832 = ((((((1166) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9d2896aef9ede89804830fa1() {
  return __cxx_static_address_9d2896aef9ede89804830fa1.reference || (__cxx_static_address_9d2896aef9ede89804830fa1.reference = {
    __cReference: true,
    get value() { return BOTTLE19____header_global_57c1c8d2026a8832; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:486
export const DOORTILE17____header_global_69490e98ba5cd5c0 = ((((((1169) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fc8024c1f226e4c269194f43() {
  return __cxx_static_address_fc8024c1f226e4c269194f43.reference || (__cxx_static_address_fc8024c1f226e4c269194f43.reference = {
    __cReference: true,
    get value() { return DOORTILE17____header_global_69490e98ba5cd5c0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:487
export const MASKWALL7____header_global_0902cef41124eaa7 = ((((((1174) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_43c06f80777b05ac63070f29() {
  return __cxx_static_address_43c06f80777b05ac63070f29.reference || (__cxx_static_address_43c06f80777b05ac63070f29.reference = {
    __cReference: true,
    get value() { return MASKWALL7____header_global_0902cef41124eaa7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:488
export const DOORTILE11____header_global_23d69044e905d010 = ((((((1178) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_886fe28198f0f5404451c6a7() {
  return __cxx_static_address_886fe28198f0f5404451c6a7.reference || (__cxx_static_address_886fe28198f0f5404451c6a7.reference = {
    __cReference: true,
    get value() { return DOORTILE11____header_global_23d69044e905d010; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:489
export const DOORTILE12____header_global_b46fc8c9b7bef436 = ((((((1179) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_64c9d30845ebc201c6a37829() {
  return __cxx_static_address_64c9d30845ebc201c6a37829.reference || (__cxx_static_address_64c9d30845ebc201c6a37829.reference = {
    __cReference: true,
    get value() { return DOORTILE12____header_global_b46fc8c9b7bef436; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:490
export const VENDMACHINE____header_global_a234ee852d637fce = ((((((1212) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_270694c290b2a269c04327b0() {
  return __cxx_static_address_270694c290b2a269c04327b0.reference || (__cxx_static_address_270694c290b2a269c04327b0.reference = {
    __cReference: true,
    get value() { return VENDMACHINE____header_global_a234ee852d637fce; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:491
export const COLAMACHINE____header_global_229044c382bf1aa0 = ((((((1215) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1e4ef19b0d88bdf2fe04d73e() {
  return __cxx_static_address_1e4ef19b0d88bdf2fe04d73e.reference || (__cxx_static_address_1e4ef19b0d88bdf2fe04d73e.reference = {
    __cReference: true,
    get value() { return COLAMACHINE____header_global_229044c382bf1aa0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:492
export const CRANEPOLE____header_global_11921e1a75b82d20 = ((((((1221) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_74596a1beb592ffe7e41cbf9() {
  return __cxx_static_address_74596a1beb592ffe7e41cbf9.reference || (__cxx_static_address_74596a1beb592ffe7e41cbf9.reference = {
    __cReference: true,
    get value() { return CRANEPOLE____header_global_11921e1a75b82d20; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:493
export const CRANE____header_global_c59f4b3f5e091a3e = ((((((1222) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_28491fcfa94a69ac70f0d6db() {
  return __cxx_static_address_28491fcfa94a69ac70f0d6db.reference || (__cxx_static_address_28491fcfa94a69ac70f0d6db.reference = {
    __cReference: true,
    get value() { return CRANE____header_global_c59f4b3f5e091a3e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:494
export const BARBROKE____header_global_a12ab50a9b096d36 = ((((((1225) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_184242a47b70673063d6652d() {
  return __cxx_static_address_184242a47b70673063d6652d.reference || (__cxx_static_address_184242a47b70673063d6652d.reference = {
    __cReference: true,
    get value() { return BARBROKE____header_global_a12ab50a9b096d36; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:495
export const BLOODPOOL____header_global_b6d7cd7ca73f3639 = ((((((1226) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_939e4a7ae7e30acc67a51ca0() {
  return __cxx_static_address_939e4a7ae7e30acc67a51ca0.reference || (__cxx_static_address_939e4a7ae7e30acc67a51ca0.reference = {
    __cReference: true,
    get value() { return BLOODPOOL____header_global_b6d7cd7ca73f3639; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:496
export const NUKEBARREL____header_global_8b36a449c9ce0ec1 = ((((((1227) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_67a62eeea5bec8fbc4b44f0a() {
  return __cxx_static_address_67a62eeea5bec8fbc4b44f0a.reference || (__cxx_static_address_67a62eeea5bec8fbc4b44f0a.reference = {
    __cReference: true,
    get value() { return NUKEBARREL____header_global_8b36a449c9ce0ec1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:497
export const NUKEBARRELDENTED____header_global_12eac8448bb2b128 = ((((((1228) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5da489258b1a9596d80c412b() {
  return __cxx_static_address_5da489258b1a9596d80c412b.reference || (__cxx_static_address_5da489258b1a9596d80c412b.reference = {
    __cReference: true,
    get value() { return NUKEBARRELDENTED____header_global_12eac8448bb2b128; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:498
export const NUKEBARRELLEAKED____header_global_4a4b432d0500fce3 = ((((((1229) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2d3347ad6d04ecfb2626adc6() {
  return __cxx_static_address_2d3347ad6d04ecfb2626adc6.reference || (__cxx_static_address_2d3347ad6d04ecfb2626adc6.reference = {
    __cReference: true,
    get value() { return NUKEBARRELLEAKED____header_global_4a4b432d0500fce3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:499
export const CANWITHSOMETHING____header_global_fda7b66ac896a4a5 = ((((((1232) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_96651fafbfdc293f3e268ea7() {
  return __cxx_static_address_96651fafbfdc293f3e268ea7.reference || (__cxx_static_address_96651fafbfdc293f3e268ea7.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING____header_global_fda7b66ac896a4a5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:500
export const MONEY____header_global_7a240e1b01ded0f7 = ((((((1233) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_59a427d62ef544e24f3cfb4f() {
  return __cxx_static_address_59a427d62ef544e24f3cfb4f.reference || (__cxx_static_address_59a427d62ef544e24f3cfb4f.reference = {
    __cReference: true,
    get value() { return MONEY____header_global_7a240e1b01ded0f7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:501
export const BANNER____header_global_e99a4db58a77190d = ((((((1236) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2da9f8b5761185537bda0d2a() {
  return __cxx_static_address_2da9f8b5761185537bda0d2a.reference || (__cxx_static_address_2da9f8b5761185537bda0d2a.reference = {
    __cReference: true,
    get value() { return BANNER____header_global_e99a4db58a77190d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:502
export const EXPLODINGBARREL____header_global_f1074f07da432250 = ((((((1238) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ec1acda4d1c41fe4810bfc35() {
  return __cxx_static_address_ec1acda4d1c41fe4810bfc35.reference || (__cxx_static_address_ec1acda4d1c41fe4810bfc35.reference = {
    __cReference: true,
    get value() { return EXPLODINGBARREL____header_global_f1074f07da432250; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:503
export const EXPLODINGBARREL2____header_global_2257598e3d9bc2ac = ((((((1239) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eb4cb16444364dc3cd474c73() {
  return __cxx_static_address_eb4cb16444364dc3cd474c73.reference || (__cxx_static_address_eb4cb16444364dc3cd474c73.reference = {
    __cReference: true,
    get value() { return EXPLODINGBARREL2____header_global_2257598e3d9bc2ac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:504
export const FIREBARREL____header_global_c4d333f731cce9d8 = ((((((1240) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1b29c2ebd31cac758a370e59() {
  return __cxx_static_address_1b29c2ebd31cac758a370e59.reference || (__cxx_static_address_1b29c2ebd31cac758a370e59.reference = {
    __cReference: true,
    get value() { return FIREBARREL____header_global_c4d333f731cce9d8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:505
export const SEENINE____header_global_055b5db8cd1774b4 = ((((((1247) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8e67b1a53cc4373317ce33a4() {
  return __cxx_static_address_8e67b1a53cc4373317ce33a4.reference || (__cxx_static_address_8e67b1a53cc4373317ce33a4.reference = {
    __cReference: true,
    get value() { return SEENINE____header_global_055b5db8cd1774b4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:506
export const SEENINEDEAD____header_global_fda1fd00cbe1fa23 = ((((((1248) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ad04d35501b2c0212ac3638f() {
  return __cxx_static_address_ad04d35501b2c0212ac3638f.reference || (__cxx_static_address_ad04d35501b2c0212ac3638f.reference = {
    __cReference: true,
    get value() { return SEENINEDEAD____header_global_fda1fd00cbe1fa23; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:507
export const STEAM____header_global_02b746abdb2aadfc = ((((((1250) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f03d02fd9971310decbe454f() {
  return __cxx_static_address_f03d02fd9971310decbe454f.reference || (__cxx_static_address_f03d02fd9971310decbe454f.reference = {
    __cReference: true,
    get value() { return STEAM____header_global_02b746abdb2aadfc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:508
export const CEILINGSTEAM____header_global_36e297e1efbe8a41 = ((((((1255) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1ce6754f4ba269deae6ef924() {
  return __cxx_static_address_1ce6754f4ba269deae6ef924.reference || (__cxx_static_address_1ce6754f4ba269deae6ef924.reference = {
    __cReference: true,
    get value() { return CEILINGSTEAM____header_global_36e297e1efbe8a41; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:509
export const PIPE6B____header_global_74b237681cbc7bbe = ((((((1260) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e3b400b2db7601fded95cdcf() {
  return __cxx_static_address_e3b400b2db7601fded95cdcf.reference || (__cxx_static_address_e3b400b2db7601fded95cdcf.reference = {
    __cReference: true,
    get value() { return PIPE6B____header_global_74b237681cbc7bbe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:510
export const TRANSPORTERBEAM____header_global_d24bd5e8444f1958 = ((((((1261) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e3cf09257cfd7a0520ca5c4c() {
  return __cxx_static_address_e3cf09257cfd7a0520ca5c4c.reference || (__cxx_static_address_e3cf09257cfd7a0520ca5c4c.reference = {
    __cReference: true,
    get value() { return TRANSPORTERBEAM____header_global_d24bd5e8444f1958; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:511
export const RAT____header_global_08a6874cd8b9adc2 = ((((((1267) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5b2194bd5eca5f950a83a931() {
  return __cxx_static_address_5b2194bd5eca5f950a83a931.reference || (__cxx_static_address_5b2194bd5eca5f950a83a931.reference = {
    __cReference: true,
    get value() { return RAT____header_global_08a6874cd8b9adc2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:512
export const TRASH____header_global_75a084830112022d = ((((((1272) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_10ee5c1dc521e03fe69c4d9a() {
  return __cxx_static_address_10ee5c1dc521e03fe69c4d9a.reference || (__cxx_static_address_10ee5c1dc521e03fe69c4d9a.reference = {
    __cReference: true,
    get value() { return TRASH____header_global_75a084830112022d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:513
export const FEMPIC1____header_global_5b3b0c117f251ad6 = ((((((1280) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6c6d79bfe4c9803b614f58ff() {
  return __cxx_static_address_6c6d79bfe4c9803b614f58ff.reference || (__cxx_static_address_6c6d79bfe4c9803b614f58ff.reference = {
    __cReference: true,
    get value() { return FEMPIC1____header_global_5b3b0c117f251ad6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:514
export const FEMPIC2____header_global_77a3a2eb981bd43a = ((((((1289) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9ec02f45d64708991d531999() {
  return __cxx_static_address_9ec02f45d64708991d531999.reference || (__cxx_static_address_9ec02f45d64708991d531999.reference = {
    __cReference: true,
    get value() { return FEMPIC2____header_global_77a3a2eb981bd43a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:515
export const BLANKSCREEN____header_global_956d85d264f06ed2 = ((((((1293) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a52eb14274783695f098d603() {
  return __cxx_static_address_a52eb14274783695f098d603.reference || (__cxx_static_address_a52eb14274783695f098d603.reference = {
    __cReference: true,
    get value() { return BLANKSCREEN____header_global_956d85d264f06ed2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:516
export const PODFEM1____header_global_218188ff8d8520e7 = ((((((1294) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c29b04b2a1130b77307b5e9d() {
  return __cxx_static_address_c29b04b2a1130b77307b5e9d.reference || (__cxx_static_address_c29b04b2a1130b77307b5e9d.reference = {
    __cReference: true,
    get value() { return PODFEM1____header_global_218188ff8d8520e7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:517
export const FEMPIC3____header_global_f25b3c2b571e7a2d = ((((((1298) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9f1c7dde8a384327d93442d4() {
  return __cxx_static_address_9f1c7dde8a384327d93442d4.reference || (__cxx_static_address_9f1c7dde8a384327d93442d4.reference = {
    __cReference: true,
    get value() { return FEMPIC3____header_global_f25b3c2b571e7a2d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:518
export const FEMPIC4____header_global_895e8809e4a0901c = ((((((1306) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c55683da2715212225ff16be() {
  return __cxx_static_address_c55683da2715212225ff16be.reference || (__cxx_static_address_c55683da2715212225ff16be.reference = {
    __cReference: true,
    get value() { return FEMPIC4____header_global_895e8809e4a0901c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:519
export const FEM1____header_global_586a15e46f491678 = ((((((1312) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f21d3267d5f07c951ecc1e56() {
  return __cxx_static_address_f21d3267d5f07c951ecc1e56.reference || (__cxx_static_address_f21d3267d5f07c951ecc1e56.reference = {
    __cReference: true,
    get value() { return FEM1____header_global_586a15e46f491678; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:520
export const FEM2____header_global_f96a3d0810a064ee = ((((((1317) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6a6eaf25b8a365836048d37e() {
  return __cxx_static_address_6a6eaf25b8a365836048d37e.reference || (__cxx_static_address_6a6eaf25b8a365836048d37e.reference = {
    __cReference: true,
    get value() { return FEM2____header_global_f96a3d0810a064ee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:521
export const FEM3____header_global_95cd62835f108731 = ((((((1321) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_689510a0a39c1444c9f53844() {
  return __cxx_static_address_689510a0a39c1444c9f53844.reference || (__cxx_static_address_689510a0a39c1444c9f53844.reference = {
    __cReference: true,
    get value() { return FEM3____header_global_95cd62835f108731; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:522
export const FEM5____header_global_1db0a413cf3d7b1e = ((((((1323) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a754fef900bc85df1a9a419c() {
  return __cxx_static_address_a754fef900bc85df1a9a419c.reference || (__cxx_static_address_a754fef900bc85df1a9a419c.reference = {
    __cReference: true,
    get value() { return FEM5____header_global_1db0a413cf3d7b1e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:523
export const BLOODYPOLE____header_global_01747dd95e7f13be = ((((((1324) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c7713a2a0790a197f7bca59c() {
  return __cxx_static_address_c7713a2a0790a197f7bca59c.reference || (__cxx_static_address_c7713a2a0790a197f7bca59c.reference = {
    __cReference: true,
    get value() { return BLOODYPOLE____header_global_01747dd95e7f13be; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:524
export const FEM4____header_global_535de928a6dd4694 = ((((((1325) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_95ce43f474ef9f193afb9f77() {
  return __cxx_static_address_95ce43f474ef9f193afb9f77.reference || (__cxx_static_address_95ce43f474ef9f193afb9f77.reference = {
    __cReference: true,
    get value() { return FEM4____header_global_535de928a6dd4694; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:525
export const FEM6____header_global_2560cf88cec57c6f = ((((((1334) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5685409f74f2e79970e0c4e7() {
  return __cxx_static_address_5685409f74f2e79970e0c4e7.reference || (__cxx_static_address_5685409f74f2e79970e0c4e7.reference = {
    __cReference: true,
    get value() { return FEM6____header_global_2560cf88cec57c6f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:526
export const FEM6PAD____header_global_e2ceb7b0fddf2827 = ((((((1335) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_976746f554491905a9f95c6f() {
  return __cxx_static_address_976746f554491905a9f95c6f.reference || (__cxx_static_address_976746f554491905a9f95c6f.reference = {
    __cReference: true,
    get value() { return FEM6PAD____header_global_e2ceb7b0fddf2827; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:527
export const FEM8____header_global_be498bc4e87382bc = ((((((1336) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e7b4d98f945747874204ad7f() {
  return __cxx_static_address_e7b4d98f945747874204ad7f.reference || (__cxx_static_address_e7b4d98f945747874204ad7f.reference = {
    __cReference: true,
    get value() { return FEM8____header_global_be498bc4e87382bc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:528
export const HELECOPT____header_global_2dae6a8b168e7a95 = ((((((1346) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6807ac67341e92a9b8296889() {
  return __cxx_static_address_6807ac67341e92a9b8296889.reference || (__cxx_static_address_6807ac67341e92a9b8296889.reference = {
    __cReference: true,
    get value() { return HELECOPT____header_global_2dae6a8b168e7a95; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:529
export const FETUSJIB____header_global_1d31c8bc79dc9d78 = ((((((1347) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d4470e128f71eabb36623e9c() {
  return __cxx_static_address_d4470e128f71eabb36623e9c.reference || (__cxx_static_address_d4470e128f71eabb36623e9c.reference = {
    __cReference: true,
    get value() { return FETUSJIB____header_global_1d31c8bc79dc9d78; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:530
export const HOLODUKE____header_global_c85fc2035b6d7f18 = ((((((1348) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_27c2bc2157ab99b3ab3c3805() {
  return __cxx_static_address_27c2bc2157ab99b3ab3c3805.reference || (__cxx_static_address_27c2bc2157ab99b3ab3c3805.reference = {
    __cReference: true,
    get value() { return HOLODUKE____header_global_c85fc2035b6d7f18; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:531
export const SPACEMARINE____header_global_a399096608e1bd93 = ((((((1353) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_03ff3e46f2e983cb97742183() {
  return __cxx_static_address_03ff3e46f2e983cb97742183.reference || (__cxx_static_address_03ff3e46f2e983cb97742183.reference = {
    __cReference: true,
    get value() { return SPACEMARINE____header_global_a399096608e1bd93; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:532
export const INDY____header_global_4c07dd11d06767f7 = ((((((1355) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a634cbd69580193ae97264bb() {
  return __cxx_static_address_a634cbd69580193ae97264bb.reference || (__cxx_static_address_a634cbd69580193ae97264bb.reference = {
    __cReference: true,
    get value() { return INDY____header_global_4c07dd11d06767f7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:533
export const FETUS____header_global_9469ce8314e01b8e = ((((((1358) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_90fac16914480cc136c1cd10() {
  return __cxx_static_address_90fac16914480cc136c1cd10.reference || (__cxx_static_address_90fac16914480cc136c1cd10.reference = {
    __cReference: true,
    get value() { return FETUS____header_global_9469ce8314e01b8e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:534
export const FETUSBROKE____header_global_df5886e616e21ebf = ((((((1359) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0bcee3ba00901fe4264fe29e() {
  return __cxx_static_address_0bcee3ba00901fe4264fe29e.reference || (__cxx_static_address_0bcee3ba00901fe4264fe29e.reference = {
    __cReference: true,
    get value() { return FETUSBROKE____header_global_df5886e616e21ebf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:535
export const MONK____header_global_3cde3f6c38992f60 = ((((((1352) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e86553b09b882f25428c5463() {
  return __cxx_static_address_e86553b09b882f25428c5463.reference || (__cxx_static_address_e86553b09b882f25428c5463.reference = {
    __cReference: true,
    get value() { return MONK____header_global_3cde3f6c38992f60; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:536
export const LUKE____header_global_49c3ef88905952a4 = ((((((1354) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ee26574da07457cd48c6fea1() {
  return __cxx_static_address_ee26574da07457cd48c6fea1.reference || (__cxx_static_address_ee26574da07457cd48c6fea1.reference = {
    __cReference: true,
    get value() { return LUKE____header_global_49c3ef88905952a4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:537
export const COOLEXPLOSION1____header_global_3e0f6a82d3d97682 = ((((((1360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4ada7a30bbd921cc34277f1e() {
  return __cxx_static_address_4ada7a30bbd921cc34277f1e.reference || (__cxx_static_address_4ada7a30bbd921cc34277f1e.reference = {
    __cReference: true,
    get value() { return COOLEXPLOSION1____header_global_3e0f6a82d3d97682; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:538
export const WATERSPLASH2____header_global_51d2190a321d7f4f = ((((((1380) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a4a458a66db667053f4363f3() {
  return __cxx_static_address_a4a458a66db667053f4363f3.reference || (__cxx_static_address_a4a458a66db667053f4363f3.reference = {
    __cReference: true,
    get value() { return WATERSPLASH2____header_global_51d2190a321d7f4f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:539
export const FIREVASE____header_global_1a1441459ee86842 = ((((((1390) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cd83e039d28129a525d36a5a() {
  return __cxx_static_address_cd83e039d28129a525d36a5a.reference || (__cxx_static_address_cd83e039d28129a525d36a5a.reference = {
    __cReference: true,
    get value() { return FIREVASE____header_global_1a1441459ee86842; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:540
export const FEM7____header_global_20c77ce663ca5dd6 = ((((((1395) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8e24d66343b0c4f358eaddd7() {
  return __cxx_static_address_8e24d66343b0c4f358eaddd7.reference || (__cxx_static_address_8e24d66343b0c4f358eaddd7.reference = {
    __cReference: true,
    get value() { return FEM7____header_global_20c77ce663ca5dd6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:541
export const APLAYERTOP____header_global_6048c21a889ca3a1 = ((((((1400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_658e2ff8897e3f23bdacd238() {
  return __cxx_static_address_658e2ff8897e3f23bdacd238.reference || (__cxx_static_address_658e2ff8897e3f23bdacd238.reference = {
    __cReference: true,
    get value() { return APLAYERTOP____header_global_6048c21a889ca3a1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:542
export const APLAYER____header_global_04ff51bc5bef4a15 = ((((((1405) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_df2dd932287a1eaea5881921() {
  return __cxx_static_address_df2dd932287a1eaea5881921.reference || (__cxx_static_address_df2dd932287a1eaea5881921.reference = {
    __cReference: true,
    get value() { return APLAYER____header_global_04ff51bc5bef4a15; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:543
export const PLAYERONWATER____header_global_5827aa4380361cfb = ((((((1420) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fcf384fa339379e593409a69() {
  return __cxx_static_address_fcf384fa339379e593409a69.reference || (__cxx_static_address_fcf384fa339379e593409a69.reference = {
    __cReference: true,
    get value() { return PLAYERONWATER____header_global_5827aa4380361cfb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:544
export const DUKELYINGDEAD____header_global_5838974ed2db99fa = ((((((1518) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_200dc89d17e23bcab1184f15() {
  return __cxx_static_address_200dc89d17e23bcab1184f15.reference || (__cxx_static_address_200dc89d17e23bcab1184f15.reference = {
    __cReference: true,
    get value() { return DUKELYINGDEAD____header_global_5838974ed2db99fa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:545
export const DUKETORSO____header_global_f67c7ba46191192f = ((((((1520) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_03d24e14111190081cecf271() {
  return __cxx_static_address_03d24e14111190081cecf271.reference || (__cxx_static_address_03d24e14111190081cecf271.reference = {
    __cReference: true,
    get value() { return DUKETORSO____header_global_f67c7ba46191192f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:546
export const DUKEGUN____header_global_43750f6a52e947a2 = ((((((1528) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c661e91fad0ce7f6e34b1ed9() {
  return __cxx_static_address_c661e91fad0ce7f6e34b1ed9.reference || (__cxx_static_address_c661e91fad0ce7f6e34b1ed9.reference = {
    __cReference: true,
    get value() { return DUKEGUN____header_global_43750f6a52e947a2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:547
export const DUKELEG____header_global_c1d99ca87830014a = ((((((1536) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_80d67974be69425823d7ef17() {
  return __cxx_static_address_80d67974be69425823d7ef17.reference || (__cxx_static_address_80d67974be69425823d7ef17.reference = {
    __cReference: true,
    get value() { return DUKELEG____header_global_c1d99ca87830014a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:548
export const SHARK____header_global_e17aa52659119941 = ((((((1550) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_efdc9d07ebec0b7a03f07ed4() {
  return __cxx_static_address_efdc9d07ebec0b7a03f07ed4.reference || (__cxx_static_address_efdc9d07ebec0b7a03f07ed4.reference = {
    __cReference: true,
    get value() { return SHARK____header_global_e17aa52659119941; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:549
export const BLOOD____header_global_6eea5c30c868d7fa = ((((((1620) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_070a4a8080c7af6b8c93f180() {
  return __cxx_static_address_070a4a8080c7af6b8c93f180.reference || (__cxx_static_address_070a4a8080c7af6b8c93f180.reference = {
    __cReference: true,
    get value() { return BLOOD____header_global_6eea5c30c868d7fa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:550
export const FIRELASER____header_global_769da0785325a957 = ((((((1625) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_98f04d462e51ed142d0b79e1() {
  return __cxx_static_address_98f04d462e51ed142d0b79e1.reference || (__cxx_static_address_98f04d462e51ed142d0b79e1.reference = {
    __cReference: true,
    get value() { return FIRELASER____header_global_769da0785325a957; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:551
export const TRANSPORTERSTAR____header_global_905125acefc41254 = ((((((1630) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_39344d704767a84e4894410d() {
  return __cxx_static_address_39344d704767a84e4894410d.reference || (__cxx_static_address_39344d704767a84e4894410d.reference = {
    __cReference: true,
    get value() { return TRANSPORTERSTAR____header_global_905125acefc41254; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:552
export const SPIT____header_global_d4be24365a8ba4be = ((((((1636) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_af69ec8a8ca0a68eae97f79b() {
  return __cxx_static_address_af69ec8a8ca0a68eae97f79b.reference || (__cxx_static_address_af69ec8a8ca0a68eae97f79b.reference = {
    __cReference: true,
    get value() { return SPIT____header_global_d4be24365a8ba4be; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:553
export const LOOGIE____header_global_e56d5111c1ad7917 = ((((((1637) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_464c7201a821197fada23ae9() {
  return __cxx_static_address_464c7201a821197fada23ae9.reference || (__cxx_static_address_464c7201a821197fada23ae9.reference = {
    __cReference: true,
    get value() { return LOOGIE____header_global_e56d5111c1ad7917; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:554
export const FIST____header_global_e02b3953fa07402b = ((((((1640) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1bf8000e0ca87123215dbee3() {
  return __cxx_static_address_1bf8000e0ca87123215dbee3.reference || (__cxx_static_address_1bf8000e0ca87123215dbee3.reference = {
    __cReference: true,
    get value() { return FIST____header_global_e02b3953fa07402b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:555
export const FREEZEBLAST____header_global_e684f7b00cacc8bf = ((((((1641) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3cc043f08c564920dc304206() {
  return __cxx_static_address_3cc043f08c564920dc304206.reference || (__cxx_static_address_3cc043f08c564920dc304206.reference = {
    __cReference: true,
    get value() { return FREEZEBLAST____header_global_e684f7b00cacc8bf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:556
export const SHRINKSPARK____header_global_7d09eeb31f12c806 = ((((((1646) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7bb912fe0b38336ddf9bae74() {
  return __cxx_static_address_7bb912fe0b38336ddf9bae74.reference || (__cxx_static_address_7bb912fe0b38336ddf9bae74.reference = {
    __cReference: true,
    get value() { return SHRINKSPARK____header_global_7d09eeb31f12c806; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:557
export const TONGUE____header_global_094ff9065edd4758 = ((((((1647) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_99d774758ed069d96e824917() {
  return __cxx_static_address_99d774758ed069d96e824917.reference || (__cxx_static_address_99d774758ed069d96e824917.reference = {
    __cReference: true,
    get value() { return TONGUE____header_global_094ff9065edd4758; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:558
export const MORTER____header_global_765be2d0d86a3132 = ((((((1650) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_af045e1199db849e83ff197b() {
  return __cxx_static_address_af045e1199db849e83ff197b.reference || (__cxx_static_address_af045e1199db849e83ff197b.reference = {
    __cReference: true,
    get value() { return MORTER____header_global_765be2d0d86a3132; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:559
export const SHRINKEREXPLOSION____header_global_2238d10c38c862ec = ((((((1656) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fe43078712bf60ce87c1c068() {
  return __cxx_static_address_fe43078712bf60ce87c1c068.reference || (__cxx_static_address_fe43078712bf60ce87c1c068.reference = {
    __cReference: true,
    get value() { return SHRINKEREXPLOSION____header_global_2238d10c38c862ec; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:560
export const RADIUSEXPLOSION____header_global_d430b4023deabfe3 = ((((((1670) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0dae25eb7cdd2ed27e46ce87() {
  return __cxx_static_address_0dae25eb7cdd2ed27e46ce87.reference || (__cxx_static_address_0dae25eb7cdd2ed27e46ce87.reference = {
    __cReference: true,
    get value() { return RADIUSEXPLOSION____header_global_d430b4023deabfe3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:561
export const FORCERIPPLE____header_global_d771e6ca0be55baf = ((((((1671) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3df2051be5d6a93258dd2f5d() {
  return __cxx_static_address_3df2051be5d6a93258dd2f5d.reference || (__cxx_static_address_3df2051be5d6a93258dd2f5d.reference = {
    __cReference: true,
    get value() { return FORCERIPPLE____header_global_d771e6ca0be55baf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:562
export const LIZTROOP____header_global_c52cabf2d5613557 = ((((((1680) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1f0dc8ab2e97ae12c8c782bb() {
  return __cxx_static_address_1f0dc8ab2e97ae12c8c782bb.reference || (__cxx_static_address_1f0dc8ab2e97ae12c8c782bb.reference = {
    __cReference: true,
    get value() { return LIZTROOP____header_global_c52cabf2d5613557; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:563
export const LIZTROOPRUNNING____header_global_443d2605f7f7962d = ((((((1681) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3a61150b7c4fddb73597a4af() {
  return __cxx_static_address_3a61150b7c4fddb73597a4af.reference || (__cxx_static_address_3a61150b7c4fddb73597a4af.reference = {
    __cReference: true,
    get value() { return LIZTROOPRUNNING____header_global_443d2605f7f7962d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:564
export const LIZTROOPSTAYPUT____header_global_304d096bfb35b6e1 = ((((((1682) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d00b47d0761ce6b46f87fc08() {
  return __cxx_static_address_d00b47d0761ce6b46f87fc08.reference || (__cxx_static_address_d00b47d0761ce6b46f87fc08.reference = {
    __cReference: true,
    get value() { return LIZTROOPSTAYPUT____header_global_304d096bfb35b6e1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:565
export const LIZTROOPSHOOT____header_global_b1822b18afcd84ce = ((((((1715) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e7dd195b45c250f2cff41cb0() {
  return __cxx_static_address_e7dd195b45c250f2cff41cb0.reference || (__cxx_static_address_e7dd195b45c250f2cff41cb0.reference = {
    __cReference: true,
    get value() { return LIZTROOPSHOOT____header_global_b1822b18afcd84ce; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:566
export const LIZTROOPJETPACK____header_global_8897a488b9064db6 = ((((((1725) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6dce5178b0413717ce32af5f() {
  return __cxx_static_address_6dce5178b0413717ce32af5f.reference || (__cxx_static_address_6dce5178b0413717ce32af5f.reference = {
    __cReference: true,
    get value() { return LIZTROOPJETPACK____header_global_8897a488b9064db6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:567
export const LIZTROOPONTOILET____header_global_ec9b832cf632d40c = ((((((1741) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_12d3ebeca17185955aa77142() {
  return __cxx_static_address_12d3ebeca17185955aa77142.reference || (__cxx_static_address_12d3ebeca17185955aa77142.reference = {
    __cReference: true,
    get value() { return LIZTROOPONTOILET____header_global_ec9b832cf632d40c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:568
export const LIZTROOPJUSTSIT____header_global_8c749b8b6225bbb2 = ((((((1742) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5c63450fcd0cf29bb6a66bc9() {
  return __cxx_static_address_5c63450fcd0cf29bb6a66bc9.reference || (__cxx_static_address_5c63450fcd0cf29bb6a66bc9.reference = {
    __cReference: true,
    get value() { return LIZTROOPJUSTSIT____header_global_8c749b8b6225bbb2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:569
export const LIZTROOPDUCKING____header_global_a9e4f18ef6038dfc = ((((((1744) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1c0a181d26757e4830c220c9() {
  return __cxx_static_address_1c0a181d26757e4830c220c9.reference || (__cxx_static_address_1c0a181d26757e4830c220c9.reference = {
    __cReference: true,
    get value() { return LIZTROOPDUCKING____header_global_a9e4f18ef6038dfc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:570
export const HEADJIB1____header_global_3feebb1caecd4588 = ((((((1768) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_daee304ef0afc921765f3c9e() {
  return __cxx_static_address_daee304ef0afc921765f3c9e.reference || (__cxx_static_address_daee304ef0afc921765f3c9e.reference = {
    __cReference: true,
    get value() { return HEADJIB1____header_global_3feebb1caecd4588; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:571
export const ARMJIB1____header_global_c7945ec83adc2984 = ((((((1772) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e6eee29cea586372484f4eb6() {
  return __cxx_static_address_e6eee29cea586372484f4eb6.reference || (__cxx_static_address_e6eee29cea586372484f4eb6.reference = {
    __cReference: true,
    get value() { return ARMJIB1____header_global_c7945ec83adc2984; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:572
export const LEGJIB1____header_global_8d4fef0d4ca7f329 = ((((((1776) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8ccf4e31a64bb75aecf6c2bf() {
  return __cxx_static_address_8ccf4e31a64bb75aecf6c2bf.reference || (__cxx_static_address_8ccf4e31a64bb75aecf6c2bf.reference = {
    __cReference: true,
    get value() { return LEGJIB1____header_global_8d4fef0d4ca7f329; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:573
export const OCTABRAIN____header_global_689a6a1af7ed45f8 = ((((((1820) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e6c25d2b790cfad07bbd4544() {
  return __cxx_static_address_e6c25d2b790cfad07bbd4544.reference || (__cxx_static_address_e6c25d2b790cfad07bbd4544.reference = {
    __cReference: true,
    get value() { return OCTABRAIN____header_global_689a6a1af7ed45f8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:574
export const OCTABRAINSTAYPUT____header_global_cf1da6608760a647 = ((((((1821) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3c44a086f4f9a668f7d77842() {
  return __cxx_static_address_3c44a086f4f9a668f7d77842.reference || (__cxx_static_address_3c44a086f4f9a668f7d77842.reference = {
    __cReference: true,
    get value() { return OCTABRAINSTAYPUT____header_global_cf1da6608760a647; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:575
export const INNERJAW____header_global_3aff4404ad8c8c60 = ((((((1860) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_78662bccf1759e0ee743ab0c() {
  return __cxx_static_address_78662bccf1759e0ee743ab0c.reference || (__cxx_static_address_78662bccf1759e0ee743ab0c.reference = {
    __cReference: true,
    get value() { return INNERJAW____header_global_3aff4404ad8c8c60; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:576
export const DRONE____header_global_bd4a3b1587008412 = ((((((1880) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5aa0e9ede27410576e3f2b9d() {
  return __cxx_static_address_5aa0e9ede27410576e3f2b9d.reference || (__cxx_static_address_5aa0e9ede27410576e3f2b9d.reference = {
    __cReference: true,
    get value() { return DRONE____header_global_bd4a3b1587008412; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:577
export const EXPLOSION2____header_global_9e5f3eafdb6db719 = ((((((1890) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5cf4b706172d53215aa353f6() {
  return __cxx_static_address_5cf4b706172d53215aa353f6.reference || (__cxx_static_address_5cf4b706172d53215aa353f6.reference = {
    __cReference: true,
    get value() { return EXPLOSION2____header_global_9e5f3eafdb6db719; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:578
export const COMMANDER____header_global_715d840b8ddaf0ac = ((((((1920) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4cb2bb32bed164133fd8629c() {
  return __cxx_static_address_4cb2bb32bed164133fd8629c.reference || (__cxx_static_address_4cb2bb32bed164133fd8629c.reference = {
    __cReference: true,
    get value() { return COMMANDER____header_global_715d840b8ddaf0ac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:579
export const COMMANDERSTAYPUT____header_global_ad5a092bb2b9715b = ((((((1921) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a8841dbeb24eaf1aa8f41374() {
  return __cxx_static_address_a8841dbeb24eaf1aa8f41374.reference || (__cxx_static_address_a8841dbeb24eaf1aa8f41374.reference = {
    __cReference: true,
    get value() { return COMMANDERSTAYPUT____header_global_ad5a092bb2b9715b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:580
export const RECON____header_global_0377532aa2bc1deb = ((((((1960) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a799fe9f7fbcbb81498c058e() {
  return __cxx_static_address_a799fe9f7fbcbb81498c058e.reference || (__cxx_static_address_a799fe9f7fbcbb81498c058e.reference = {
    __cReference: true,
    get value() { return RECON____header_global_0377532aa2bc1deb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:581
export const TANK____header_global_72787e91467c7250 = ((((((1975) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aa669de7aa3ebd1bb5e67d1e() {
  return __cxx_static_address_aa669de7aa3ebd1bb5e67d1e.reference || (__cxx_static_address_aa669de7aa3ebd1bb5e67d1e.reference = {
    __cReference: true,
    get value() { return TANK____header_global_72787e91467c7250; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:582
export const PIGCOP____header_global_45f55c8a84570a94 = ((((((2000) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c3a09b9ad069abf58c69ed27() {
  return __cxx_static_address_c3a09b9ad069abf58c69ed27.reference || (__cxx_static_address_c3a09b9ad069abf58c69ed27.reference = {
    __cReference: true,
    get value() { return PIGCOP____header_global_45f55c8a84570a94; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:583
export const PIGCOPSTAYPUT____header_global_82c7081954693eaf = ((((((2001) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0cd0d98e7ed64578ca5b3e31() {
  return __cxx_static_address_0cd0d98e7ed64578ca5b3e31.reference || (__cxx_static_address_0cd0d98e7ed64578ca5b3e31.reference = {
    __cReference: true,
    get value() { return PIGCOPSTAYPUT____header_global_82c7081954693eaf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:584
export const PIGCOPDIVE____header_global_cba7285a0b061c90 = ((((((2045) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_61e73acb79233fb6d846f8d8() {
  return __cxx_static_address_61e73acb79233fb6d846f8d8.reference || (__cxx_static_address_61e73acb79233fb6d846f8d8.reference = {
    __cReference: true,
    get value() { return PIGCOPDIVE____header_global_cba7285a0b061c90; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:585
export const LIZMAN____header_global_ca39696268727119 = ((((((2120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_485070d54aa9c31a3599281e() {
  return __cxx_static_address_485070d54aa9c31a3599281e.reference || (__cxx_static_address_485070d54aa9c31a3599281e.reference = {
    __cReference: true,
    get value() { return LIZMAN____header_global_ca39696268727119; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:586
export const LIZMANSTAYPUT____header_global_521cbf730e301b5f = ((((((2121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7e4898f2f09973e376bf669a() {
  return __cxx_static_address_7e4898f2f09973e376bf669a.reference || (__cxx_static_address_7e4898f2f09973e376bf669a.reference = {
    __cReference: true,
    get value() { return LIZMANSTAYPUT____header_global_521cbf730e301b5f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:587
export const LIZMANSPITTING____header_global_03715fca07d27cb2 = ((((((2150) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5337720258b2d94535a7adfb() {
  return __cxx_static_address_5337720258b2d94535a7adfb.reference || (__cxx_static_address_5337720258b2d94535a7adfb.reference = {
    __cReference: true,
    get value() { return LIZMANSPITTING____header_global_03715fca07d27cb2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:588
export const LIZMANFEEDING____header_global_8ecc99d8ce56e1c3 = ((((((2160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_241e103d3fbbd60d6d6fbb30() {
  return __cxx_static_address_241e103d3fbbd60d6d6fbb30.reference || (__cxx_static_address_241e103d3fbbd60d6d6fbb30.reference = {
    __cReference: true,
    get value() { return LIZMANFEEDING____header_global_8ecc99d8ce56e1c3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:589
export const LIZMANJUMP____header_global_4cdb62beca173dfe = ((((((2165) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_96bd44bafc21bd17112844ef() {
  return __cxx_static_address_96bd44bafc21bd17112844ef.reference || (__cxx_static_address_96bd44bafc21bd17112844ef.reference = {
    __cReference: true,
    get value() { return LIZMANJUMP____header_global_4cdb62beca173dfe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:590
export const FECES____header_global_d993a05aaf6d2d4a = ((((((2200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ecba9a8374572a9542385ee1() {
  return __cxx_static_address_ecba9a8374572a9542385ee1.reference || (__cxx_static_address_ecba9a8374572a9542385ee1.reference = {
    __cReference: true,
    get value() { return FECES____header_global_d993a05aaf6d2d4a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:591
export const LIZMANHEAD1____header_global_5e26ba1d7ea0d2a2 = ((((((2201) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ef74cb39e8ed237e95ac9ac6() {
  return __cxx_static_address_ef74cb39e8ed237e95ac9ac6.reference || (__cxx_static_address_ef74cb39e8ed237e95ac9ac6.reference = {
    __cReference: true,
    get value() { return LIZMANHEAD1____header_global_5e26ba1d7ea0d2a2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:592
export const LIZMANARM1____header_global_ba57fd10b065db8f = ((((((2205) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_97a0282b991acba4b48b5586() {
  return __cxx_static_address_97a0282b991acba4b48b5586.reference || (__cxx_static_address_97a0282b991acba4b48b5586.reference = {
    __cReference: true,
    get value() { return LIZMANARM1____header_global_ba57fd10b065db8f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:593
export const LIZMANLEG1____header_global_e29879071479d8b4 = ((((((2209) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_46b0d29d23551f77ddba0c88() {
  return __cxx_static_address_46b0d29d23551f77ddba0c88.reference || (__cxx_static_address_46b0d29d23551f77ddba0c88.reference = {
    __cReference: true,
    get value() { return LIZMANLEG1____header_global_e29879071479d8b4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:594
export const EXPLOSION2BOT____header_global_de9de4cdd8017c9c = ((((((2219) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5591ebc46136cc9020bb5921() {
  return __cxx_static_address_5591ebc46136cc9020bb5921.reference || (__cxx_static_address_5591ebc46136cc9020bb5921.reference = {
    __cReference: true,
    get value() { return EXPLOSION2BOT____header_global_de9de4cdd8017c9c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:595
export const JIBS1____header_global_40b1ae3c9f919725 = ((((((2245) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_730ea7fc27f70e865051d789() {
  return __cxx_static_address_730ea7fc27f70e865051d789.reference || (__cxx_static_address_730ea7fc27f70e865051d789.reference = {
    __cReference: true,
    get value() { return JIBS1____header_global_40b1ae3c9f919725; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:596
export const JIBS2____header_global_942268356aad5d12 = ((((((2250) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c5bce2633872967250f58ad4() {
  return __cxx_static_address_c5bce2633872967250f58ad4.reference || (__cxx_static_address_c5bce2633872967250f58ad4.reference = {
    __cReference: true,
    get value() { return JIBS2____header_global_942268356aad5d12; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:597
export const JIBS3____header_global_68479ca777f8ee40 = ((((((2255) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_77e715a31655c1c0d8b1a79e() {
  return __cxx_static_address_77e715a31655c1c0d8b1a79e.reference || (__cxx_static_address_77e715a31655c1c0d8b1a79e.reference = {
    __cReference: true,
    get value() { return JIBS3____header_global_68479ca777f8ee40; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:598
export const JIBS4____header_global_1bf739927f7f8d5c = ((((((2260) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_569645e5d12b43d1074cd7f8() {
  return __cxx_static_address_569645e5d12b43d1074cd7f8.reference || (__cxx_static_address_569645e5d12b43d1074cd7f8.reference = {
    __cReference: true,
    get value() { return JIBS4____header_global_1bf739927f7f8d5c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:599
export const JIBS5____header_global_6a55d0aa3273c271 = ((((((2265) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2164d484ec4d3e97bc2b9744() {
  return __cxx_static_address_2164d484ec4d3e97bc2b9744.reference || (__cxx_static_address_2164d484ec4d3e97bc2b9744.reference = {
    __cReference: true,
    get value() { return JIBS5____header_global_6a55d0aa3273c271; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:600
export const BURNING____header_global_277f089079c6075b = ((((((2270) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f453b5a0bf97f3c3984cc21f() {
  return __cxx_static_address_f453b5a0bf97f3c3984cc21f.reference || (__cxx_static_address_f453b5a0bf97f3c3984cc21f.reference = {
    __cReference: true,
    get value() { return BURNING____header_global_277f089079c6075b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:601
export const FIRE____header_global_498a7d902706eb22 = ((((((2271) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8d0c0302f144aff5b9c34d35() {
  return __cxx_static_address_8d0c0302f144aff5b9c34d35.reference || (__cxx_static_address_8d0c0302f144aff5b9c34d35.reference = {
    __cReference: true,
    get value() { return FIRE____header_global_498a7d902706eb22; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:602
export const JIBS6____header_global_a2570fc7a53602cf = ((((((2286) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_53694befe2757790665ca6fd() {
  return __cxx_static_address_53694befe2757790665ca6fd.reference || (__cxx_static_address_53694befe2757790665ca6fd.reference = {
    __cReference: true,
    get value() { return JIBS6____header_global_a2570fc7a53602cf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:603
export const BLOODSPLAT1____header_global_3dfb6b25f3e45dbf = ((((((2296) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6918fdf57ccb0b02208818d7() {
  return __cxx_static_address_6918fdf57ccb0b02208818d7.reference || (__cxx_static_address_6918fdf57ccb0b02208818d7.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT1____header_global_3dfb6b25f3e45dbf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:604
export const BLOODSPLAT3____header_global_6572176795b957d0 = ((((((2297) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1de5be11dc450e187ec95e81() {
  return __cxx_static_address_1de5be11dc450e187ec95e81.reference || (__cxx_static_address_1de5be11dc450e187ec95e81.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT3____header_global_6572176795b957d0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:605
export const BLOODSPLAT2____header_global_2713490e1425d870 = ((((((2298) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2c50736051f952b5429c42d8() {
  return __cxx_static_address_2c50736051f952b5429c42d8.reference || (__cxx_static_address_2c50736051f952b5429c42d8.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT2____header_global_2713490e1425d870; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:606
export const BLOODSPLAT4____header_global_8bf87003a4e5b792 = ((((((2299) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3a5de96b780c3b97ceb288cf() {
  return __cxx_static_address_3a5de96b780c3b97ceb288cf.reference || (__cxx_static_address_3a5de96b780c3b97ceb288cf.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT4____header_global_8bf87003a4e5b792; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:607
export const OOZ____header_global_b33bf0b8e2290087 = ((((((2300) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c32ce197bf6a50b316cc8553() {
  return __cxx_static_address_c32ce197bf6a50b316cc8553.reference || (__cxx_static_address_c32ce197bf6a50b316cc8553.reference = {
    __cReference: true,
    get value() { return OOZ____header_global_b33bf0b8e2290087; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:608
export const OOZ2____header_global_46a23a03b4d617cc = ((((((2309) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_06eb4a0ae9e88261cbfe887b() {
  return __cxx_static_address_06eb4a0ae9e88261cbfe887b.reference || (__cxx_static_address_06eb4a0ae9e88261cbfe887b.reference = {
    __cReference: true,
    get value() { return OOZ2____header_global_46a23a03b4d617cc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:609
export const WALLBLOOD1____header_global_bffaba3981fca488 = ((((((2301) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0f2ded35acb7344ac9f45899() {
  return __cxx_static_address_0f2ded35acb7344ac9f45899.reference || (__cxx_static_address_0f2ded35acb7344ac9f45899.reference = {
    __cReference: true,
    get value() { return WALLBLOOD1____header_global_bffaba3981fca488; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:610
export const WALLBLOOD2____header_global_57249b9c24aa1dad = ((((((2302) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_07cdf1c76e621afa5a90328c() {
  return __cxx_static_address_07cdf1c76e621afa5a90328c.reference || (__cxx_static_address_07cdf1c76e621afa5a90328c.reference = {
    __cReference: true,
    get value() { return WALLBLOOD2____header_global_57249b9c24aa1dad; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:611
export const WALLBLOOD3____header_global_a22cf469a033dae0 = ((((((2303) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_01cb969a4240063181d01ba8() {
  return __cxx_static_address_01cb969a4240063181d01ba8.reference || (__cxx_static_address_01cb969a4240063181d01ba8.reference = {
    __cReference: true,
    get value() { return WALLBLOOD3____header_global_a22cf469a033dae0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:612
export const WALLBLOOD4____header_global_f3ad8f0479e7f59e = ((((((2304) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1d0e75acc1ac6004c0cee0e9() {
  return __cxx_static_address_1d0e75acc1ac6004c0cee0e9.reference || (__cxx_static_address_1d0e75acc1ac6004c0cee0e9.reference = {
    __cReference: true,
    get value() { return WALLBLOOD4____header_global_f3ad8f0479e7f59e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:613
export const WALLBLOOD5____header_global_69c9206e3fcfe55f = ((((((2305) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_73698349b6c70f5ee8bc9eaf() {
  return __cxx_static_address_73698349b6c70f5ee8bc9eaf.reference || (__cxx_static_address_73698349b6c70f5ee8bc9eaf.reference = {
    __cReference: true,
    get value() { return WALLBLOOD5____header_global_69c9206e3fcfe55f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:614
export const WALLBLOOD7____header_global_25eb78e700b4a895 = ((((((2307) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f5e5a6d074d9e8749b0c5453() {
  return __cxx_static_address_f5e5a6d074d9e8749b0c5453.reference || (__cxx_static_address_f5e5a6d074d9e8749b0c5453.reference = {
    __cReference: true,
    get value() { return WALLBLOOD7____header_global_25eb78e700b4a895; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:615
export const WALLBLOOD8____header_global_f3d990ceb83e5a6d = ((((((2308) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7256dbd93639f4476d4148df() {
  return __cxx_static_address_7256dbd93639f4476d4148df.reference || (__cxx_static_address_7256dbd93639f4476d4148df.reference = {
    __cReference: true,
    get value() { return WALLBLOOD8____header_global_f3d990ceb83e5a6d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:616
export const BURNING2____header_global_0f7064ac99eca95e = ((((((2310) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_435883d3e982e96c44e4f390() {
  return __cxx_static_address_435883d3e982e96c44e4f390.reference || (__cxx_static_address_435883d3e982e96c44e4f390.reference = {
    __cReference: true,
    get value() { return BURNING2____header_global_0f7064ac99eca95e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:617
export const FIRE2____header_global_4b1c864bb3b94f34 = ((((((2311) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_71b17b1fc63e10b4aaabeec9() {
  return __cxx_static_address_71b17b1fc63e10b4aaabeec9.reference || (__cxx_static_address_71b17b1fc63e10b4aaabeec9.reference = {
    __cReference: true,
    get value() { return FIRE2____header_global_4b1c864bb3b94f34; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:618
export const CRACKKNUCKLES____header_global_59575dd80e9167fe = ((((((2324) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3215a0db9a383fb98d8b2663() {
  return __cxx_static_address_3215a0db9a383fb98d8b2663.reference || (__cxx_static_address_3215a0db9a383fb98d8b2663.reference = {
    __cReference: true,
    get value() { return CRACKKNUCKLES____header_global_59575dd80e9167fe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:619
export const SMALLSMOKE____header_global_4cba86cbcb5872ed = ((((((2329) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_00b95749b16f445a49dd58f6() {
  return __cxx_static_address_00b95749b16f445a49dd58f6.reference || (__cxx_static_address_00b95749b16f445a49dd58f6.reference = {
    __cReference: true,
    get value() { return SMALLSMOKE____header_global_4cba86cbcb5872ed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:620
export const FLOORFLAME____header_global_16ea566219ae3e82 = ((((((2333) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_30280e5333aa7c4d092708a2() {
  return __cxx_static_address_30280e5333aa7c4d092708a2.reference || (__cxx_static_address_30280e5333aa7c4d092708a2.reference = {
    __cReference: true,
    get value() { return FLOORFLAME____header_global_16ea566219ae3e82; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:621
export const ROTATEGUN____header_global_cb19d98916acab4c = ((((((2360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0ef27a951fe85ee239a91bde() {
  return __cxx_static_address_0ef27a951fe85ee239a91bde.reference || (__cxx_static_address_0ef27a951fe85ee239a91bde.reference = {
    __cReference: true,
    get value() { return ROTATEGUN____header_global_cb19d98916acab4c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:622
export const GREENSLIME____header_global_150b465a251a133a = ((((((2370) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9fb7e42a572dab7183d3cb3d() {
  return __cxx_static_address_9fb7e42a572dab7183d3cb3d.reference || (__cxx_static_address_9fb7e42a572dab7183d3cb3d.reference = {
    __cReference: true,
    get value() { return GREENSLIME____header_global_150b465a251a133a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:623
export const WATERDRIPSPLASH____header_global_79bca6e49277858b = ((((((2380) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d1f1502784002ef5b905317f() {
  return __cxx_static_address_d1f1502784002ef5b905317f.reference || (__cxx_static_address_d1f1502784002ef5b905317f.reference = {
    __cReference: true,
    get value() { return WATERDRIPSPLASH____header_global_79bca6e49277858b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:624
export const SCRAP6____header_global_5bca600054d3f3eb = ((((((2390) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a90ab3a08599006fdcbac6f5() {
  return __cxx_static_address_a90ab3a08599006fdcbac6f5.reference || (__cxx_static_address_a90ab3a08599006fdcbac6f5.reference = {
    __cReference: true,
    get value() { return SCRAP6____header_global_5bca600054d3f3eb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:625
export const SCRAP1____header_global_5a8b6df4b3932ce0 = ((((((2400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_437cf517d460d1c51e4741db() {
  return __cxx_static_address_437cf517d460d1c51e4741db.reference || (__cxx_static_address_437cf517d460d1c51e4741db.reference = {
    __cReference: true,
    get value() { return SCRAP1____header_global_5a8b6df4b3932ce0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:626
export const SCRAP2____header_global_038e92f21290b7b2 = ((((((2404) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c899ea3cfbd8b993232a9d01() {
  return __cxx_static_address_c899ea3cfbd8b993232a9d01.reference || (__cxx_static_address_c899ea3cfbd8b993232a9d01.reference = {
    __cReference: true,
    get value() { return SCRAP2____header_global_038e92f21290b7b2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:627
export const SCRAP3____header_global_663b23b51bbc3495 = ((((((2408) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_97e693225c9028505607adec() {
  return __cxx_static_address_97e693225c9028505607adec.reference || (__cxx_static_address_97e693225c9028505607adec.reference = {
    __cReference: true,
    get value() { return SCRAP3____header_global_663b23b51bbc3495; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:628
export const SCRAP4____header_global_9b46f32b2b68af5f = ((((((2412) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_de7453e287f9a143e097b664() {
  return __cxx_static_address_de7453e287f9a143e097b664.reference || (__cxx_static_address_de7453e287f9a143e097b664.reference = {
    __cReference: true,
    get value() { return SCRAP4____header_global_9b46f32b2b68af5f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:629
export const SCRAP5____header_global_cc2859e1250f1e6b = ((((((2416) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_28a9a676cb469e78ad4c27a5() {
  return __cxx_static_address_28a9a676cb469e78ad4c27a5.reference || (__cxx_static_address_28a9a676cb469e78ad4c27a5.reference = {
    __cReference: true,
    get value() { return SCRAP5____header_global_cc2859e1250f1e6b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:630
export const ORGANTIC____header_global_db2ae67a6c9e1454 = ((((((2420) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cb86c7de8fec9d66e3fad4ba() {
  return __cxx_static_address_cb86c7de8fec9d66e3fad4ba.reference || (__cxx_static_address_cb86c7de8fec9d66e3fad4ba.reference = {
    __cReference: true,
    get value() { return ORGANTIC____header_global_db2ae67a6c9e1454; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:631
export const BETAVERSION____header_global_1b74d16ca255f100 = ((((((2440) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a73e7ac3dd4499a84161a835() {
  return __cxx_static_address_a73e7ac3dd4499a84161a835.reference || (__cxx_static_address_a73e7ac3dd4499a84161a835.reference = {
    __cReference: true,
    get value() { return BETAVERSION____header_global_1b74d16ca255f100; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:632
export const SELECTDIR____header_global_869ceac4b372667b = ((((((2444) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d9e1b6cc6fe25195d200cd75() {
  return __cxx_static_address_d9e1b6cc6fe25195d200cd75.reference || (__cxx_static_address_d9e1b6cc6fe25195d200cd75.reference = {
    __cReference: true,
    get value() { return SELECTDIR____header_global_869ceac4b372667b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:633
export const F1HELP____header_global_2f6f1f2c7f85d273 = ((((((2445) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2ec557774981057e08297529() {
  return __cxx_static_address_2ec557774981057e08297529.reference || (__cxx_static_address_2ec557774981057e08297529.reference = {
    __cReference: true,
    get value() { return F1HELP____header_global_2f6f1f2c7f85d273; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:634
export const GROWSPARK____header_global_b9915a8d2a055f36 = ((((((2448) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c60a279d79ee9cca77a92c07() {
  return __cxx_static_address_c60a279d79ee9cca77a92c07.reference || (__cxx_static_address_c60a279d79ee9cca77a92c07.reference = {
    __cReference: true,
    get value() { return GROWSPARK____header_global_b9915a8d2a055f36; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:635
export const MENUSCREEN____header_global_416802853c803415 = ((((((2456) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_41f246a2c355f5683ce9138b() {
  return __cxx_static_address_41f246a2c355f5683ce9138b.reference || (__cxx_static_address_41f246a2c355f5683ce9138b.reference = {
    __cReference: true,
    get value() { return MENUSCREEN____header_global_416802853c803415; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:636
export const MENUBAR____header_global_f1da73396f0d4357 = ((((((2457) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0510257d364c7efd77ec4e2f() {
  return __cxx_static_address_0510257d364c7efd77ec4e2f.reference || (__cxx_static_address_0510257d364c7efd77ec4e2f.reference = {
    __cReference: true,
    get value() { return MENUBAR____header_global_f1da73396f0d4357; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:637
export const KILLSICON____header_global_41d64b31c4bf3245 = ((((((2458) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e7082ba8af75c2c4a0c75785() {
  return __cxx_static_address_e7082ba8af75c2c4a0c75785.reference || (__cxx_static_address_e7082ba8af75c2c4a0c75785.reference = {
    __cReference: true,
    get value() { return KILLSICON____header_global_41d64b31c4bf3245; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:638
export const FIRSTAID_ICON____header_global_cbda914490d90081 = ((((((2460) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_29314ec3ce2add89e0212a21() {
  return __cxx_static_address_29314ec3ce2add89e0212a21.reference || (__cxx_static_address_29314ec3ce2add89e0212a21.reference = {
    __cReference: true,
    get value() { return FIRSTAID_ICON____header_global_cbda914490d90081; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:639
export const HEAT_ICON____header_global_f8d8c3cd4ccae9df = ((((((2461) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_afc8bd7d6ad398d615282012() {
  return __cxx_static_address_afc8bd7d6ad398d615282012.reference || (__cxx_static_address_afc8bd7d6ad398d615282012.reference = {
    __cReference: true,
    get value() { return HEAT_ICON____header_global_f8d8c3cd4ccae9df; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:640
export const BOTTOMSTATUSBAR____header_global_a3d9d1ef88380270 = ((((((2462) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_39652396806fcfdcd5c0816f() {
  return __cxx_static_address_39652396806fcfdcd5c0816f.reference || (__cxx_static_address_39652396806fcfdcd5c0816f.reference = {
    __cReference: true,
    get value() { return BOTTOMSTATUSBAR____header_global_a3d9d1ef88380270; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:641
export const BOOT_ICON____header_global_4c4e087aa7769299 = ((((((2463) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9968717dd223de2e7ad26479() {
  return __cxx_static_address_9968717dd223de2e7ad26479.reference || (__cxx_static_address_9968717dd223de2e7ad26479.reference = {
    __cReference: true,
    get value() { return BOOT_ICON____header_global_4c4e087aa7769299; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:642
export const FRAGBAR____header_global_1d6834ca72e9203e = ((((((2465) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_282aee40eb485ad450b52c23() {
  return __cxx_static_address_282aee40eb485ad450b52c23.reference || (__cxx_static_address_282aee40eb485ad450b52c23.reference = {
    __cReference: true,
    get value() { return FRAGBAR____header_global_1d6834ca72e9203e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:643
export const JETPACK_ICON____header_global_3428dca677282a1c = ((((((2467) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8bbb5b028cd2cddc6870fee0() {
  return __cxx_static_address_8bbb5b028cd2cddc6870fee0.reference || (__cxx_static_address_8bbb5b028cd2cddc6870fee0.reference = {
    __cReference: true,
    get value() { return JETPACK_ICON____header_global_3428dca677282a1c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:644
export const AIRTANK_ICON____header_global_ff745d0d3165d0f1 = ((((((2468) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a28040d271bc62a98cf9bf0c() {
  return __cxx_static_address_a28040d271bc62a98cf9bf0c.reference || (__cxx_static_address_a28040d271bc62a98cf9bf0c.reference = {
    __cReference: true,
    get value() { return AIRTANK_ICON____header_global_ff745d0d3165d0f1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:645
export const STEROIDS_ICON____header_global_2ebec0519a5a8428 = ((((((2469) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9c465972e2b21245680172a1() {
  return __cxx_static_address_9c465972e2b21245680172a1.reference || (__cxx_static_address_9c465972e2b21245680172a1.reference = {
    __cReference: true,
    get value() { return STEROIDS_ICON____header_global_2ebec0519a5a8428; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:646
export const HOLODUKE_ICON____header_global_fc24e34862ad0cdd = ((((((2470) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7d0810f283c90ec204272341() {
  return __cxx_static_address_7d0810f283c90ec204272341.reference || (__cxx_static_address_7d0810f283c90ec204272341.reference = {
    __cReference: true,
    get value() { return HOLODUKE_ICON____header_global_fc24e34862ad0cdd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:647
export const ACCESS_ICON____header_global_57cfd74c8761966b = ((((((2471) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_61234cbc28e02d7d734ea6c4() {
  return __cxx_static_address_61234cbc28e02d7d734ea6c4.reference || (__cxx_static_address_61234cbc28e02d7d734ea6c4.reference = {
    __cReference: true,
    get value() { return ACCESS_ICON____header_global_57cfd74c8761966b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:648
export const DIGITALNUM____header_global_19e2611d2da686ac = ((((((2472) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7281652cd12a1f379f3aca58() {
  return __cxx_static_address_7281652cd12a1f379f3aca58.reference || (__cxx_static_address_7281652cd12a1f379f3aca58.reference = {
    __cReference: true,
    get value() { return DIGITALNUM____header_global_19e2611d2da686ac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:649
export const DUKECAR____header_global_e8cd82b7bad64aaf = ((((((2491) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_162beb42b2c15f6e992cff03() {
  return __cxx_static_address_162beb42b2c15f6e992cff03.reference || (__cxx_static_address_162beb42b2c15f6e992cff03.reference = {
    __cReference: true,
    get value() { return DUKECAR____header_global_e8cd82b7bad64aaf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:650
export const CAMCORNER____header_global_f2c3032bee2cb6df = ((((((2482) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f089744df64cb6bd7fbd9720() {
  return __cxx_static_address_f089744df64cb6bd7fbd9720.reference || (__cxx_static_address_f089744df64cb6bd7fbd9720.reference = {
    __cReference: true,
    get value() { return CAMCORNER____header_global_f2c3032bee2cb6df; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:651
export const CAMLIGHT____header_global_4e94e5ae4d91044f = ((((((2484) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_87faa7ed0e590a83f6736df2() {
  return __cxx_static_address_87faa7ed0e590a83f6736df2.reference || (__cxx_static_address_87faa7ed0e590a83f6736df2.reference = {
    __cReference: true,
    get value() { return CAMLIGHT____header_global_4e94e5ae4d91044f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:652
export const SLIDEBAR____header_global_56370bb551235dda = ((((((2489) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e533a8df5c27874768919dec() {
  return __cxx_static_address_e533a8df5c27874768919dec.reference || (__cxx_static_address_e533a8df5c27874768919dec.reference = {
    __cReference: true,
    get value() { return SLIDEBAR____header_global_56370bb551235dda; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:653
export const DREALMS____header_global_d7079d4e2c50b9e0 = ((((((2492) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4b52267e8c2c28aa7a2ad84c() {
  return __cxx_static_address_4b52267e8c2c28aa7a2ad84c.reference || (__cxx_static_address_4b52267e8c2c28aa7a2ad84c.reference = {
    __cReference: true,
    get value() { return DREALMS____header_global_d7079d4e2c50b9e0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:654
export const BETASCREEN____header_global_1d5bbc3b2f9e859a = ((((((2493) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_add26e14c61dd549320c570a() {
  return __cxx_static_address_add26e14c61dd549320c570a.reference || (__cxx_static_address_add26e14c61dd549320c570a.reference = {
    __cReference: true,
    get value() { return BETASCREEN____header_global_1d5bbc3b2f9e859a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:655
export const WINDOWBORDER1____header_global_6c72a17f60fd35d2 = ((((((2494) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ce9baebeeeb1e6a018b8b893() {
  return __cxx_static_address_ce9baebeeeb1e6a018b8b893.reference || (__cxx_static_address_ce9baebeeeb1e6a018b8b893.reference = {
    __cReference: true,
    get value() { return WINDOWBORDER1____header_global_6c72a17f60fd35d2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:656
export const TEXTBOX____header_global_4cfc0db8cd82ee2d = ((((((2495) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f9e36db6f5b244ed1e568a05() {
  return __cxx_static_address_f9e36db6f5b244ed1e568a05.reference || (__cxx_static_address_f9e36db6f5b244ed1e568a05.reference = {
    __cReference: true,
    get value() { return TEXTBOX____header_global_4cfc0db8cd82ee2d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:657
export const WINDOWBORDER2____header_global_196339e1d6a46fd2 = ((((((2496) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2d6a6af611be536584d1d0b2() {
  return __cxx_static_address_2d6a6af611be536584d1d0b2.reference || (__cxx_static_address_2d6a6af611be536584d1d0b2.reference = {
    __cReference: true,
    get value() { return WINDOWBORDER2____header_global_196339e1d6a46fd2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:658
export const DUKENUKEM____header_global_b4e20a17005ddaf6 = ((((((2497) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2a8c1ae6377bf7162d1cc103() {
  return __cxx_static_address_2a8c1ae6377bf7162d1cc103.reference || (__cxx_static_address_2a8c1ae6377bf7162d1cc103.reference = {
    __cReference: true,
    get value() { return DUKENUKEM____header_global_b4e20a17005ddaf6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:659
export const THREEDEE____header_global_8712d2ac3e41868d = ((((((2498) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f33620ebc4c3559d08b1d1e3() {
  return __cxx_static_address_f33620ebc4c3559d08b1d1e3.reference || (__cxx_static_address_f33620ebc4c3559d08b1d1e3.reference = {
    __cReference: true,
    get value() { return THREEDEE____header_global_8712d2ac3e41868d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:660
export const INGAMEDUKETHREEDEE____header_global_6b2f508621b7498c = ((((((2499) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8c2970690bd6688f7a3a2c0b() {
  return __cxx_static_address_8c2970690bd6688f7a3a2c0b.reference || (__cxx_static_address_8c2970690bd6688f7a3a2c0b.reference = {
    __cReference: true,
    get value() { return INGAMEDUKETHREEDEE____header_global_6b2f508621b7498c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:661
export const TENSCREEN____header_global_12b11fe79e855d19 = ((((((2500) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a0b1b82144f74758be3204d1() {
  return __cxx_static_address_a0b1b82144f74758be3204d1.reference || (__cxx_static_address_a0b1b82144f74758be3204d1.reference = {
    __cReference: true,
    get value() { return TENSCREEN____header_global_12b11fe79e855d19; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:662
export const PLUTOPAKSPRITE____header_global_a9273f4f09881107 = ((((((2501) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_232684b10803bde3310a041c() {
  return __cxx_static_address_232684b10803bde3310a041c.reference || (__cxx_static_address_232684b10803bde3310a041c.reference = {
    __cReference: true,
    get value() { return PLUTOPAKSPRITE____header_global_a9273f4f09881107; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:663
export const DEVISTATOR____header_global_e90270c1afb3d019 = ((((((2510) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0783f6bb49fb3ec5d6f72e08() {
  return __cxx_static_address_0783f6bb49fb3ec5d6f72e08.reference || (__cxx_static_address_0783f6bb49fb3ec5d6f72e08.reference = {
    __cReference: true,
    get value() { return DEVISTATOR____header_global_e90270c1afb3d019; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:664
export const KNEE____header_global_e07e0e7793f27033 = ((((((2521) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_73e4f7fe8f8d436ec9672c47() {
  return __cxx_static_address_73e4f7fe8f8d436ec9672c47.reference || (__cxx_static_address_73e4f7fe8f8d436ec9672c47.reference = {
    __cReference: true,
    get value() { return KNEE____header_global_e07e0e7793f27033; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:665
export const CROSSHAIR____header_global_f0bade7ea5c4725b = ((((((2523) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_168b7d508d1d8b066f7ae227() {
  return __cxx_static_address_168b7d508d1d8b066f7ae227.reference || (__cxx_static_address_168b7d508d1d8b066f7ae227.reference = {
    __cReference: true,
    get value() { return CROSSHAIR____header_global_f0bade7ea5c4725b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:666
export const FIRSTGUN____header_global_378a5ac6e1bf6c35 = ((((((2524) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_764b85274fb72646cdda706f() {
  return __cxx_static_address_764b85274fb72646cdda706f.reference || (__cxx_static_address_764b85274fb72646cdda706f.reference = {
    __cReference: true,
    get value() { return FIRSTGUN____header_global_378a5ac6e1bf6c35; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:667
export const FIRSTGUNRELOAD____header_global_570ef580fa0b340f = ((((((2528) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a4ad6f010038d93d7f764af4() {
  return __cxx_static_address_a4ad6f010038d93d7f764af4.reference || (__cxx_static_address_a4ad6f010038d93d7f764af4.reference = {
    __cReference: true,
    get value() { return FIRSTGUNRELOAD____header_global_570ef580fa0b340f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:668
export const SHELL____header_global_163fedabb21d83ff = ((((((2533) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0496c4b4741bf7f121d0052a() {
  return __cxx_static_address_0496c4b4741bf7f121d0052a.reference || (__cxx_static_address_0496c4b4741bf7f121d0052a.reference = {
    __cReference: true,
    get value() { return SHELL____header_global_163fedabb21d83ff; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:669
export const SHOTGUNSHELL____header_global_54b356f45c9e129c = ((((((2535) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8fe2604789769856f1a7f0f9() {
  return __cxx_static_address_8fe2604789769856f1a7f0f9.reference || (__cxx_static_address_8fe2604789769856f1a7f0f9.reference = {
    __cReference: true,
    get value() { return SHOTGUNSHELL____header_global_54b356f45c9e129c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:670
export const CHAINGUN____header_global_43ae3084b9f508bd = ((((((2536) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_260f17da5c692a3d9678063b() {
  return __cxx_static_address_260f17da5c692a3d9678063b.reference || (__cxx_static_address_260f17da5c692a3d9678063b.reference = {
    __cReference: true,
    get value() { return CHAINGUN____header_global_43ae3084b9f508bd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:671
export const RPGGUN____header_global_6b68179d4c3686cc = ((((((2544) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b3dba4796da5de3dc0eca426() {
  return __cxx_static_address_b3dba4796da5de3dc0eca426.reference || (__cxx_static_address_b3dba4796da5de3dc0eca426.reference = {
    __cReference: true,
    get value() { return RPGGUN____header_global_6b68179d4c3686cc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:672
export const FREEZE____header_global_e9f1a0da5347071f = ((((((2548) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_19c2de1c6ea1ae8f6b25b7da() {
  return __cxx_static_address_19c2de1c6ea1ae8f6b25b7da.reference || (__cxx_static_address_19c2de1c6ea1ae8f6b25b7da.reference = {
    __cReference: true,
    get value() { return FREEZE____header_global_e9f1a0da5347071f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:673
export const SHRINKER____header_global_767d453e6bd50378 = ((((((2556) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_db358f12715fe1878c359e71() {
  return __cxx_static_address_db358f12715fe1878c359e71.reference || (__cxx_static_address_db358f12715fe1878c359e71.reference = {
    __cReference: true,
    get value() { return SHRINKER____header_global_767d453e6bd50378; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:674
export const HANDHOLDINGLASER____header_global_9794c9d8846304c1 = ((((((2563) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c927a1247fbca4595b64c1b9() {
  return __cxx_static_address_c927a1247fbca4595b64c1b9.reference || (__cxx_static_address_c927a1247fbca4595b64c1b9.reference = {
    __cReference: true,
    get value() { return HANDHOLDINGLASER____header_global_9794c9d8846304c1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:675
export const TRIPBOMB____header_global_09f4dbd690e68543 = ((((((2566) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e0af0856ebb10969864cd63c() {
  return __cxx_static_address_e0af0856ebb10969864cd63c.reference || (__cxx_static_address_e0af0856ebb10969864cd63c.reference = {
    __cReference: true,
    get value() { return TRIPBOMB____header_global_09f4dbd690e68543; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:676
export const LASERLINE____header_global_bf75fb4729a80255 = ((((((2567) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2e81c7f23f46cac186f369e9() {
  return __cxx_static_address_2e81c7f23f46cac186f369e9.reference || (__cxx_static_address_2e81c7f23f46cac186f369e9.reference = {
    __cReference: true,
    get value() { return LASERLINE____header_global_bf75fb4729a80255; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:677
export const HANDHOLDINGACCESS____header_global_e4469ef7ab6bcaa4 = ((((((2568) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_da9a973b2d915d27831aa8a5() {
  return __cxx_static_address_da9a973b2d915d27831aa8a5.reference || (__cxx_static_address_da9a973b2d915d27831aa8a5.reference = {
    __cReference: true,
    get value() { return HANDHOLDINGACCESS____header_global_e4469ef7ab6bcaa4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:678
export const HANDREMOTE____header_global_78ddb217127a679d = ((((((2570) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c1892286be92787b99988195() {
  return __cxx_static_address_c1892286be92787b99988195.reference || (__cxx_static_address_c1892286be92787b99988195.reference = {
    __cReference: true,
    get value() { return HANDREMOTE____header_global_78ddb217127a679d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:679
export const HANDTHROW____header_global_196a5e113828ba30 = ((((((2573) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_76638db66374de419d973d58() {
  return __cxx_static_address_76638db66374de419d973d58.reference || (__cxx_static_address_76638db66374de419d973d58.reference = {
    __cReference: true,
    get value() { return HANDTHROW____header_global_196a5e113828ba30; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:680
export const TIP____header_global_1045db46b315e187 = ((((((2576) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_64b545a6fea33cb1da46074a() {
  return __cxx_static_address_64b545a6fea33cb1da46074a.reference || (__cxx_static_address_64b545a6fea33cb1da46074a.reference = {
    __cReference: true,
    get value() { return TIP____header_global_1045db46b315e187; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:681
export const SCUBAMASK____header_global_8b2c9a671e7b3546 = ((((((2581) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3cbd20e6e29ef6dae482638d() {
  return __cxx_static_address_3cbd20e6e29ef6dae482638d.reference || (__cxx_static_address_3cbd20e6e29ef6dae482638d.reference = {
    __cReference: true,
    get value() { return SCUBAMASK____header_global_8b2c9a671e7b3546; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:682
export const FORCESPHERE____header_global_06bb176b2a8d880c = ((((((2590) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_44d9f19852aff2ca9a8adbb5() {
  return __cxx_static_address_44d9f19852aff2ca9a8adbb5.reference || (__cxx_static_address_44d9f19852aff2ca9a8adbb5.reference = {
    __cReference: true,
    get value() { return FORCESPHERE____header_global_06bb176b2a8d880c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:683
export const SHOTSPARK1____header_global_b7baae06d23bcada = ((((((2595) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d6a9a21e5938120b53b5f425() {
  return __cxx_static_address_d6a9a21e5938120b53b5f425.reference || (__cxx_static_address_d6a9a21e5938120b53b5f425.reference = {
    __cReference: true,
    get value() { return SHOTSPARK1____header_global_b7baae06d23bcada; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:684
export const RPG____header_global_e6ae97f0975c9752 = ((((((2605) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8c418f8155e82ae73ef2a1c5() {
  return __cxx_static_address_8c418f8155e82ae73ef2a1c5.reference || (__cxx_static_address_8c418f8155e82ae73ef2a1c5.reference = {
    __cReference: true,
    get value() { return RPG____header_global_e6ae97f0975c9752; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:685
export const LASERSITE____header_global_ba1591b14add024c = ((((((2612) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a9bec18f8e4d3032f9568d28() {
  return __cxx_static_address_a9bec18f8e4d3032f9568d28.reference || (__cxx_static_address_a9bec18f8e4d3032f9568d28.reference = {
    __cReference: true,
    get value() { return LASERSITE____header_global_ba1591b14add024c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:686
export const SHOTGUN____header_global_f2ec2c88e43f9962 = ((((((2613) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_01df1b94f85722f201166ca0() {
  return __cxx_static_address_01df1b94f85722f201166ca0.reference || (__cxx_static_address_01df1b94f85722f201166ca0.reference = {
    __cReference: true,
    get value() { return SHOTGUN____header_global_f2ec2c88e43f9962; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:687
export const BOSS1____header_global_1c970140290a24dc = ((((((2630) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3f1ddc2266d2a4a0dfbff814() {
  return __cxx_static_address_3f1ddc2266d2a4a0dfbff814.reference || (__cxx_static_address_3f1ddc2266d2a4a0dfbff814.reference = {
    __cReference: true,
    get value() { return BOSS1____header_global_1c970140290a24dc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:688
export const BOSS1STAYPUT____header_global_382dbbd0b3d1ec1d = ((((((2631) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a3ef0baff0969f88b4e5202b() {
  return __cxx_static_address_a3ef0baff0969f88b4e5202b.reference || (__cxx_static_address_a3ef0baff0969f88b4e5202b.reference = {
    __cReference: true,
    get value() { return BOSS1STAYPUT____header_global_382dbbd0b3d1ec1d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:689
export const BOSS1SHOOT____header_global_dcd61ee179d05f71 = ((((((2660) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_42ae18e769713234afbdafc3() {
  return __cxx_static_address_42ae18e769713234afbdafc3.reference || (__cxx_static_address_42ae18e769713234afbdafc3.reference = {
    __cReference: true,
    get value() { return BOSS1SHOOT____header_global_dcd61ee179d05f71; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:690
export const BOSS1LOB____header_global_6fd9a9ff8c62ec7b = ((((((2670) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_026f4fb2d8ca8f4a02bcf4ef() {
  return __cxx_static_address_026f4fb2d8ca8f4a02bcf4ef.reference || (__cxx_static_address_026f4fb2d8ca8f4a02bcf4ef.reference = {
    __cReference: true,
    get value() { return BOSS1LOB____header_global_6fd9a9ff8c62ec7b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:691
export const BOSSTOP____header_global_6c558c3d32b4b10a = ((((((2696) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7bf4b6ae807b5babdb7932c2() {
  return __cxx_static_address_7bf4b6ae807b5babdb7932c2.reference || (__cxx_static_address_7bf4b6ae807b5babdb7932c2.reference = {
    __cReference: true,
    get value() { return BOSSTOP____header_global_6c558c3d32b4b10a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:692
export const BOSS2____header_global_218b3b5c9b5e738d = ((((((2710) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9c2ac6e909cd887c4590cabc() {
  return __cxx_static_address_9c2ac6e909cd887c4590cabc.reference || (__cxx_static_address_9c2ac6e909cd887c4590cabc.reference = {
    __cReference: true,
    get value() { return BOSS2____header_global_218b3b5c9b5e738d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:693
export const BOSS3____header_global_d32ab7486a36eef7 = ((((((2760) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b3b99038d188b785475a9c91() {
  return __cxx_static_address_b3b99038d188b785475a9c91.reference || (__cxx_static_address_b3b99038d188b785475a9c91.reference = {
    __cReference: true,
    get value() { return BOSS3____header_global_d32ab7486a36eef7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:694
export const SPINNINGNUKEICON____header_global_4d9df4dca7093b2c = ((((((2813) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4e4b2b50946556f59481f6dd() {
  return __cxx_static_address_4e4b2b50946556f59481f6dd.reference || (__cxx_static_address_4e4b2b50946556f59481f6dd.reference = {
    __cReference: true,
    get value() { return SPINNINGNUKEICON____header_global_4d9df4dca7093b2c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:695
export const SMALLFNTCURSOR____header_global_446b7a8233daad05 = ((((((2821) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c4ca22d1a7d191a76cf65ff0() {
  return __cxx_static_address_c4ca22d1a7d191a76cf65ff0.reference || (__cxx_static_address_c4ca22d1a7d191a76cf65ff0.reference = {
    __cReference: true,
    get value() { return SMALLFNTCURSOR____header_global_446b7a8233daad05; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:696
export const STARTALPHANUM____header_global_1adbd20003238135 = ((((((2822) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_73cb346fbbb8d7735ef10490() {
  return __cxx_static_address_73cb346fbbb8d7735ef10490.reference || (__cxx_static_address_73cb346fbbb8d7735ef10490.reference = {
    __cReference: true,
    get value() { return STARTALPHANUM____header_global_1adbd20003238135; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:697
export const ENDALPHANUM____header_global_901983f5590b5978 = ((((((2915) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_308ab4bbf05fbe868cde2fcf() {
  return __cxx_static_address_308ab4bbf05fbe868cde2fcf.reference || (__cxx_static_address_308ab4bbf05fbe868cde2fcf.reference = {
    __cReference: true,
    get value() { return ENDALPHANUM____header_global_901983f5590b5978; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:698
export const BIGALPHANUM____header_global_ccb729c50905409f = ((((((2940) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1e86e8677cb7e451bb805a15() {
  return __cxx_static_address_1e86e8677cb7e451bb805a15.reference || (__cxx_static_address_1e86e8677cb7e451bb805a15.reference = {
    __cReference: true,
    get value() { return BIGALPHANUM____header_global_ccb729c50905409f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:699
export const BIGPERIOD____header_global_296e433f42b1f548 = ((((((3002) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f5e5cb1d37a7781e39d686c7() {
  return __cxx_static_address_f5e5cb1d37a7781e39d686c7.reference || (__cxx_static_address_f5e5cb1d37a7781e39d686c7.reference = {
    __cReference: true,
    get value() { return BIGPERIOD____header_global_296e433f42b1f548; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:700
export const BIGCOMMA____header_global_12b12d041418a0d1 = ((((((3003) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c311fe8dc4c8e6a1196ae15b() {
  return __cxx_static_address_c311fe8dc4c8e6a1196ae15b.reference || (__cxx_static_address_c311fe8dc4c8e6a1196ae15b.reference = {
    __cReference: true,
    get value() { return BIGCOMMA____header_global_12b12d041418a0d1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:701
export const BIGX____header_global_0a5f7448a7c1b03f = ((((((3004) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bc176b2584f56edfe11ad34d() {
  return __cxx_static_address_bc176b2584f56edfe11ad34d.reference || (__cxx_static_address_bc176b2584f56edfe11ad34d.reference = {
    __cReference: true,
    get value() { return BIGX____header_global_0a5f7448a7c1b03f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:702
export const BIGQ____header_global_ddfcf27704effdee = ((((((3005) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e233ab8da9ba4cccd8047d16() {
  return __cxx_static_address_e233ab8da9ba4cccd8047d16.reference || (__cxx_static_address_e233ab8da9ba4cccd8047d16.reference = {
    __cReference: true,
    get value() { return BIGQ____header_global_ddfcf27704effdee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:703
export const BIGSEMI____header_global_0d50bf2c149b4afe = ((((((3006) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d91f94517f46468c1db5fdeb() {
  return __cxx_static_address_d91f94517f46468c1db5fdeb.reference || (__cxx_static_address_d91f94517f46468c1db5fdeb.reference = {
    __cReference: true,
    get value() { return BIGSEMI____header_global_0d50bf2c149b4afe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:704
export const BIGCOLIN____header_global_0d43ec565fdd42da = ((((((3007) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d1da3f182551fe93cf33cd59() {
  return __cxx_static_address_d1da3f182551fe93cf33cd59.reference || (__cxx_static_address_d1da3f182551fe93cf33cd59.reference = {
    __cReference: true,
    get value() { return BIGCOLIN____header_global_0d43ec565fdd42da; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:705
export const THREEBYFIVE____header_global_9d4e207d37af692a = ((((((3010) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b6825980bae9f875410c1b90() {
  return __cxx_static_address_b6825980bae9f875410c1b90.reference || (__cxx_static_address_b6825980bae9f875410c1b90.reference = {
    __cReference: true,
    get value() { return THREEBYFIVE____header_global_9d4e207d37af692a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:706
export const BIGAPPOS____header_global_8f7ee8f368070daa = ((((((3022) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_142b4c5fdaf2a34e7ea52e6c() {
  return __cxx_static_address_142b4c5fdaf2a34e7ea52e6c.reference || (__cxx_static_address_142b4c5fdaf2a34e7ea52e6c.reference = {
    __cReference: true,
    get value() { return BIGAPPOS____header_global_8f7ee8f368070daa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:707
export const MINIFONT____header_global_7f749e266116a6ba = ((((((3072) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9a9de61016eaea59cd181fcd() {
  return __cxx_static_address_9a9de61016eaea59cd181fcd.reference || (__cxx_static_address_9a9de61016eaea59cd181fcd.reference = {
    __cReference: true,
    get value() { return MINIFONT____header_global_7f749e266116a6ba; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:708
export const RESPAWNMARKERRED____header_global_8d2aedc0e10e359a = ((((((3190) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aa06eb2b6496f57b92d2a856() {
  return __cxx_static_address_aa06eb2b6496f57b92d2a856.reference || (__cxx_static_address_aa06eb2b6496f57b92d2a856.reference = {
    __cReference: true,
    get value() { return RESPAWNMARKERRED____header_global_8d2aedc0e10e359a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:709
export const RESPAWNMARKERYELLOW____header_global_187d9fafdc008a5d = ((((((3200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f810716cec296dcc71e0dcbc() {
  return __cxx_static_address_f810716cec296dcc71e0dcbc.reference || (__cxx_static_address_f810716cec296dcc71e0dcbc.reference = {
    __cReference: true,
    get value() { return RESPAWNMARKERYELLOW____header_global_187d9fafdc008a5d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:710
export const RESPAWNMARKERGREEN____header_global_234d8b27aa97cdfc = ((((((3210) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0b7ae9caa88c426d59dae05c() {
  return __cxx_static_address_0b7ae9caa88c426d59dae05c.reference || (__cxx_static_address_0b7ae9caa88c426d59dae05c.reference = {
    __cReference: true,
    get value() { return RESPAWNMARKERGREEN____header_global_234d8b27aa97cdfc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:711
export const BONUSSCREEN____header_global_099dbb9bc5a0f417 = ((((((3240) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cd83757c9f4cff98aa5b9330() {
  return __cxx_static_address_cd83757c9f4cff98aa5b9330.reference || (__cxx_static_address_cd83757c9f4cff98aa5b9330.reference = {
    __cReference: true,
    get value() { return BONUSSCREEN____header_global_099dbb9bc5a0f417; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:712
export const VIEWBORDER____header_global_f4e2d547a88f7fe3 = ((((((3250) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7686f787de69fa08e4601136() {
  return __cxx_static_address_7686f787de69fa08e4601136.reference || (__cxx_static_address_7686f787de69fa08e4601136.reference = {
    __cReference: true,
    get value() { return VIEWBORDER____header_global_f4e2d547a88f7fe3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:713
export const VICTORY1____header_global_d288ee5d3324ff07 = ((((((3260) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e1b1d9f2934d06337677f4da() {
  return __cxx_static_address_e1b1d9f2934d06337677f4da.reference || (__cxx_static_address_e1b1d9f2934d06337677f4da.reference = {
    __cReference: true,
    get value() { return VICTORY1____header_global_d288ee5d3324ff07; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:714
export const ORDERING____header_global_aa6c473fbcce3ff4 = ((((((3270) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1d68c4e336460c714c844157() {
  return __cxx_static_address_1d68c4e336460c714c844157.reference || (__cxx_static_address_1d68c4e336460c714c844157.reference = {
    __cReference: true,
    get value() { return ORDERING____header_global_aa6c473fbcce3ff4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:715
export const TEXTSTORY____header_global_57cd23ae8a187ec8 = ((((((3280) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_34007e20ae1fb7f4ad062038() {
  return __cxx_static_address_34007e20ae1fb7f4ad062038.reference || (__cxx_static_address_34007e20ae1fb7f4ad062038.reference = {
    __cReference: true,
    get value() { return TEXTSTORY____header_global_57cd23ae8a187ec8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:716
export const LOADSCREEN____header_global_77ec193d05c03e5b = ((((((3281) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cc70f98196d1de9df004fc37() {
  return __cxx_static_address_cc70f98196d1de9df004fc37.reference || (__cxx_static_address_cc70f98196d1de9df004fc37.reference = {
    __cReference: true,
    get value() { return LOADSCREEN____header_global_77ec193d05c03e5b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:717
export const BORNTOBEWILDSCREEN____header_global_900abe0d0c3c1fa7 = ((((((3370) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e132c43c4d63973a592927fa() {
  return __cxx_static_address_e132c43c4d63973a592927fa.reference || (__cxx_static_address_e132c43c4d63973a592927fa.reference = {
    __cReference: true,
    get value() { return BORNTOBEWILDSCREEN____header_global_900abe0d0c3c1fa7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:718
export const BLIMP____header_global_f0015fba719185a9 = ((((((3400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ad10f181139e8f1808073c78() {
  return __cxx_static_address_ad10f181139e8f1808073c78.reference || (__cxx_static_address_ad10f181139e8f1808073c78.reference = {
    __cReference: true,
    get value() { return BLIMP____header_global_f0015fba719185a9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:719
export const FEM9____header_global_f6d028594ce4c36f = ((((((3450) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8be61b4218c040c2e92807eb() {
  return __cxx_static_address_8be61b4218c040c2e92807eb.reference || (__cxx_static_address_8be61b4218c040c2e92807eb.reference = {
    __cReference: true,
    get value() { return FEM9____header_global_f6d028594ce4c36f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:720
export const FRAMEEFFECT1_13____header_global_a3d4993dabef7c3f = ((((((3999) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1e7e822ea7e84ffb605a058f() {
  return __cxx_static_address_1e7e822ea7e84ffb605a058f.reference || (__cxx_static_address_1e7e822ea7e84ffb605a058f.reference = {
    __cReference: true,
    get value() { return FRAMEEFFECT1_13____header_global_a3d4993dabef7c3f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:721
export const FRAMEEFFECT1____header_global_c59402ea152282fa = ((((((4095) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e483e5b260b2dae078c810f1() {
  return __cxx_static_address_e483e5b260b2dae078c810f1.reference || (__cxx_static_address_e483e5b260b2dae078c810f1.reference = {
    __cReference: true,
    get value() { return FRAMEEFFECT1____header_global_c59402ea152282fa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:722
export const PANNEL3____header_global_d7a63d406ad430f2 = ((((((4099) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_191726e081d0f9ee88ba29a1() {
  return __cxx_static_address_191726e081d0f9ee88ba29a1.reference || (__cxx_static_address_191726e081d0f9ee88ba29a1.reference = {
    __cReference: true,
    get value() { return PANNEL3____header_global_d7a63d406ad430f2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:723
export const SCREENBREAK14____header_global_41f425dabab44175 = ((((((4120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a533da4c8f8739b43e6faa48() {
  return __cxx_static_address_a533da4c8f8739b43e6faa48.reference || (__cxx_static_address_a533da4c8f8739b43e6faa48.reference = {
    __cReference: true,
    get value() { return SCREENBREAK14____header_global_41f425dabab44175; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:724
export const SCREENBREAK15____header_global_50239001a9598efc = ((((((4123) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9c343f62d909b3eb434829ec() {
  return __cxx_static_address_9c343f62d909b3eb434829ec.reference || (__cxx_static_address_9c343f62d909b3eb434829ec.reference = {
    __cReference: true,
    get value() { return SCREENBREAK15____header_global_50239001a9598efc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:725
export const SCREENBREAK19____header_global_6bc53dcd9dade5d4 = ((((((4125) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7f3e442b45797ca1580f3025() {
  return __cxx_static_address_7f3e442b45797ca1580f3025.reference || (__cxx_static_address_7f3e442b45797ca1580f3025.reference = {
    __cReference: true,
    get value() { return SCREENBREAK19____header_global_6bc53dcd9dade5d4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:726
export const SCREENBREAK16____header_global_e3343998ff5badc6 = ((((((4127) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6d00c0c23e1e2b0ed5cb9b29() {
  return __cxx_static_address_6d00c0c23e1e2b0ed5cb9b29.reference || (__cxx_static_address_6d00c0c23e1e2b0ed5cb9b29.reference = {
    __cReference: true,
    get value() { return SCREENBREAK16____header_global_e3343998ff5badc6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:727
export const SCREENBREAK17____header_global_d464183b1aecbe65 = ((((((4128) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c989e8c098fecbd45180866d() {
  return __cxx_static_address_c989e8c098fecbd45180866d.reference || (__cxx_static_address_c989e8c098fecbd45180866d.reference = {
    __cReference: true,
    get value() { return SCREENBREAK17____header_global_d464183b1aecbe65; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:728
export const SCREENBREAK18____header_global_bc5559f4d3f753bf = ((((((4129) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2979cd021c91faaf3d6ec064() {
  return __cxx_static_address_2979cd021c91faaf3d6ec064.reference || (__cxx_static_address_2979cd021c91faaf3d6ec064.reference = {
    __cReference: true,
    get value() { return SCREENBREAK18____header_global_bc5559f4d3f753bf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:729
export const W_TECHWALL11____header_global_9b3013a8d4b5a438 = ((((((4130) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dfe2b46d7904d44430aa0d9e() {
  return __cxx_static_address_dfe2b46d7904d44430aa0d9e.reference || (__cxx_static_address_dfe2b46d7904d44430aa0d9e.reference = {
    __cReference: true,
    get value() { return W_TECHWALL11____header_global_9b3013a8d4b5a438; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:730
export const W_TECHWALL12____header_global_589cd56062032b01 = ((((((4131) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_17bfa55eeef453ecdf0d23d4() {
  return __cxx_static_address_17bfa55eeef453ecdf0d23d4.reference || (__cxx_static_address_17bfa55eeef453ecdf0d23d4.reference = {
    __cReference: true,
    get value() { return W_TECHWALL12____header_global_589cd56062032b01; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:731
export const W_TECHWALL13____header_global_2804087acae63dbc = ((((((4132) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cb99dca32ce0f4029c5a71fb() {
  return __cxx_static_address_cb99dca32ce0f4029c5a71fb.reference || (__cxx_static_address_cb99dca32ce0f4029c5a71fb.reference = {
    __cReference: true,
    get value() { return W_TECHWALL13____header_global_2804087acae63dbc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:732
export const W_TECHWALL14____header_global_336346e5b767fde7 = ((((((4133) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_576b2b29100e8967e8ea1f4d() {
  return __cxx_static_address_576b2b29100e8967e8ea1f4d.reference || (__cxx_static_address_576b2b29100e8967e8ea1f4d.reference = {
    __cReference: true,
    get value() { return W_TECHWALL14____header_global_336346e5b767fde7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:733
export const W_TECHWALL5____header_global_ba08470ffdde1095 = ((((((4134) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c00c29369b9e3256d2994633() {
  return __cxx_static_address_c00c29369b9e3256d2994633.reference || (__cxx_static_address_c00c29369b9e3256d2994633.reference = {
    __cReference: true,
    get value() { return W_TECHWALL5____header_global_ba08470ffdde1095; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:734
export const W_TECHWALL6____header_global_92d13634e8c78e0a = ((((((4136) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b5bbaced3b9bfe16d888825a() {
  return __cxx_static_address_b5bbaced3b9bfe16d888825a.reference || (__cxx_static_address_b5bbaced3b9bfe16d888825a.reference = {
    __cReference: true,
    get value() { return W_TECHWALL6____header_global_92d13634e8c78e0a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:735
export const W_TECHWALL7____header_global_180c22cd540442dc = ((((((4138) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_839f1df708caecb142120f4b() {
  return __cxx_static_address_839f1df708caecb142120f4b.reference || (__cxx_static_address_839f1df708caecb142120f4b.reference = {
    __cReference: true,
    get value() { return W_TECHWALL7____header_global_180c22cd540442dc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:736
export const W_TECHWALL8____header_global_c1dccd07637f5d00 = ((((((4140) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_726f77c1a67c91e0ba848632() {
  return __cxx_static_address_726f77c1a67c91e0ba848632.reference || (__cxx_static_address_726f77c1a67c91e0ba848632.reference = {
    __cReference: true,
    get value() { return W_TECHWALL8____header_global_c1dccd07637f5d00; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:737
export const W_TECHWALL9____header_global_018e85bb05554a46 = ((((((4142) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4bcbbac5b2c63307c07c5057() {
  return __cxx_static_address_4bcbbac5b2c63307c07c5057.reference || (__cxx_static_address_4bcbbac5b2c63307c07c5057.reference = {
    __cReference: true,
    get value() { return W_TECHWALL9____header_global_018e85bb05554a46; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:738
export const BPANNEL3____header_global_bc216c92b5fb9697 = ((((((4100) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f2a01a77749b5c586b743e68() {
  return __cxx_static_address_f2a01a77749b5c586b743e68.reference || (__cxx_static_address_f2a01a77749b5c586b743e68.reference = {
    __cReference: true,
    get value() { return BPANNEL3____header_global_bc216c92b5fb9697; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:739
export const W_HITTECHWALL16____header_global_ed8ea37297a0eae3 = ((((((4144) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1e8b95845cc7045cd91895cb() {
  return __cxx_static_address_1e8b95845cc7045cd91895cb.reference || (__cxx_static_address_1e8b95845cc7045cd91895cb.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL16____header_global_ed8ea37297a0eae3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:740
export const W_HITTECHWALL10____header_global_4e18c6c2b6ca5ab6 = ((((((4145) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8f147b6fe2e95a8a1502ae37() {
  return __cxx_static_address_8f147b6fe2e95a8a1502ae37.reference || (__cxx_static_address_8f147b6fe2e95a8a1502ae37.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL10____header_global_4e18c6c2b6ca5ab6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:741
export const W_HITTECHWALL15____header_global_e62e28a1ed91e33f = ((((((4147) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_604017a831ac4523fe36ffe7() {
  return __cxx_static_address_604017a831ac4523fe36ffe7.reference || (__cxx_static_address_604017a831ac4523fe36ffe7.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL15____header_global_e62e28a1ed91e33f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:742
export const W_MILKSHELF____header_global_c33fd562e7bf6cc4 = ((((((4181) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_696bf935d29c469fa7fd327a() {
  return __cxx_static_address_696bf935d29c469fa7fd327a.reference || (__cxx_static_address_696bf935d29c469fa7fd327a.reference = {
    __cReference: true,
    get value() { return W_MILKSHELF____header_global_c33fd562e7bf6cc4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:743
export const W_MILKSHELFBROKE____header_global_da3327308aabc0b3 = ((((((4203) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3c8c37aca7aa2f1541dbb5a3() {
  return __cxx_static_address_3c8c37aca7aa2f1541dbb5a3.reference || (__cxx_static_address_3c8c37aca7aa2f1541dbb5a3.reference = {
    __cReference: true,
    get value() { return W_MILKSHELFBROKE____header_global_da3327308aabc0b3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:744
export const PURPLELAVA____header_global_4b1b01f5876fbf62 = ((((((4240) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_29c0f3ddc9768d519ccaffe0() {
  return __cxx_static_address_29c0f3ddc9768d519ccaffe0.reference || (__cxx_static_address_29c0f3ddc9768d519ccaffe0.reference = {
    __cReference: true,
    get value() { return PURPLELAVA____header_global_4b1b01f5876fbf62; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:745
export const TARGET____header_global_5f7e041852cdc9e8 = ((((((4359) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e8ebb2a10e60b5c6fb270381() {
  return __cxx_static_address_e8ebb2a10e60b5c6fb270381.reference || (__cxx_static_address_e8ebb2a10e60b5c6fb270381.reference = {
    __cReference: true,
    get value() { return TARGET____header_global_5f7e041852cdc9e8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:746
export const DUCK____header_global_ea1ceaf8f1e8feaf = ((((((4361) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8ada680b5dcef2cea92ca926() {
  return __cxx_static_address_8ada680b5dcef2cea92ca926.reference || (__cxx_static_address_8ada680b5dcef2cea92ca926.reference = {
    __cReference: true,
    get value() { return DUCK____header_global_ea1ceaf8f1e8feaf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:747
export const PUKE____header_global_4689847db6372a81 = ((((((4389) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_52d9882a16ed858188d80139() {
  return __cxx_static_address_52d9882a16ed858188d80139.reference || (__cxx_static_address_52d9882a16ed858188d80139.reference = {
    __cReference: true,
    get value() { return PUKE____header_global_4689847db6372a81; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:748
export const DOORTILE23____header_global_ae361eff9ebc10e0 = ((((((4391) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7c01b1f3799163e4ec34cde3() {
  return __cxx_static_address_7c01b1f3799163e4ec34cde3.reference || (__cxx_static_address_7c01b1f3799163e4ec34cde3.reference = {
    __cReference: true,
    get value() { return DOORTILE23____header_global_ae361eff9ebc10e0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:749
export const SPEAKER____header_global_749be4727573e998 = ((((((4397) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3850f7eab78bcb90630ae083() {
  return __cxx_static_address_3850f7eab78bcb90630ae083.reference || (__cxx_static_address_3850f7eab78bcb90630ae083.reference = {
    __cReference: true,
    get value() { return SPEAKER____header_global_749be4727573e998; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:750
export const MAIL____header_global_153a7df21304f27f = ((((((4410) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5f21db215e2b9fb1d02870ab() {
  return __cxx_static_address_5f21db215e2b9fb1d02870ab.reference || (__cxx_static_address_5f21db215e2b9fb1d02870ab.reference = {
    __cReference: true,
    get value() { return MAIL____header_global_153a7df21304f27f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:751
export const HOTMEAT____header_global_be20182ec1bd32d2 = ((((((4427) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_182b84d654aaa86e94c6cf11() {
  return __cxx_static_address_182b84d654aaa86e94c6cf11.reference || (__cxx_static_address_182b84d654aaa86e94c6cf11.reference = {
    __cReference: true,
    get value() { return HOTMEAT____header_global_be20182ec1bd32d2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:752
export const TRIPODCAMERA____header_global_494a194411ade905 = ((((((4444) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5142925d60e04ff3b1c97a61() {
  return __cxx_static_address_5142925d60e04ff3b1c97a61.reference || (__cxx_static_address_5142925d60e04ff3b1c97a61.reference = {
    __cReference: true,
    get value() { return TRIPODCAMERA____header_global_494a194411ade905; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:753
export const PAPER____header_global_4297e7880f3f8932 = ((((((4460) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c2e4f3327b36f23a81fb4414() {
  return __cxx_static_address_c2e4f3327b36f23a81fb4414.reference || (__cxx_static_address_c2e4f3327b36f23a81fb4414.reference = {
    __cReference: true,
    get value() { return PAPER____header_global_4297e7880f3f8932; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:754
export const GENERICPOLE2____header_global_bbfcaa019e9b8f40 = ((((((4465) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_400c5adb94a039c7732d7154() {
  return __cxx_static_address_400c5adb94a039c7732d7154.reference || (__cxx_static_address_400c5adb94a039c7732d7154.reference = {
    __cReference: true,
    get value() { return GENERICPOLE2____header_global_bbfcaa019e9b8f40; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:755
export const XXXSTACY____header_global_dc4667cd3c00d5a4 = ((((((4470) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4aa5bd1c9882c5c1115b78ef() {
  return __cxx_static_address_4aa5bd1c9882c5c1115b78ef.reference || (__cxx_static_address_4aa5bd1c9882c5c1115b78ef.reference = {
    __cReference: true,
    get value() { return XXXSTACY____header_global_dc4667cd3c00d5a4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:756
export const LETTER____header_global_70562eb6449bea95 = ((((((4502) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b47e66a8b9acc1162ca78f02() {
  return __cxx_static_address_b47e66a8b9acc1162ca78f02.reference || (__cxx_static_address_b47e66a8b9acc1162ca78f02.reference = {
    __cReference: true,
    get value() { return LETTER____header_global_70562eb6449bea95; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:757
export const SIDEBOLT1____header_global_f1593b196c32cc3b = ((((((4525) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5d941f5b52a75a1e763b3b6d() {
  return __cxx_static_address_5d941f5b52a75a1e763b3b6d.reference || (__cxx_static_address_5d941f5b52a75a1e763b3b6d.reference = {
    __cReference: true,
    get value() { return SIDEBOLT1____header_global_f1593b196c32cc3b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:758
export const FOODOBJECT16____header_global_d1b4e0c6cfcf7253 = ((((((4545) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e81c3203bf177df3ef8f6238() {
  return __cxx_static_address_e81c3203bf177df3ef8f6238.reference || (__cxx_static_address_e81c3203bf177df3ef8f6238.reference = {
    __cReference: true,
    get value() { return FOODOBJECT16____header_global_d1b4e0c6cfcf7253; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:759
export const TAMPON____header_global_3fe015aabe24f1d9 = ((((((4557) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_adcab9daf7715680c3efd6b8() {
  return __cxx_static_address_adcab9daf7715680c3efd6b8.reference || (__cxx_static_address_adcab9daf7715680c3efd6b8.reference = {
    __cReference: true,
    get value() { return TAMPON____header_global_3fe015aabe24f1d9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:760
export const CANWITHSOMETHING2____header_global_871c6f9490ce5beb = ((((((4580) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_02c6b0c6609b7f59b2d30fb1() {
  return __cxx_static_address_02c6b0c6609b7f59b2d30fb1.reference || (__cxx_static_address_02c6b0c6609b7f59b2d30fb1.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING2____header_global_871c6f9490ce5beb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:761
export const CANWITHSOMETHING3____header_global_ecc1cd4b5cfa6963 = ((((((4581) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e9d278db498a2f506c040445() {
  return __cxx_static_address_e9d278db498a2f506c040445.reference || (__cxx_static_address_e9d278db498a2f506c040445.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING3____header_global_ecc1cd4b5cfa6963; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:762
export const CANWITHSOMETHING4____header_global_2a5cc9706c2c134f = ((((((4582) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5f668b1190f571d0ec9f1135() {
  return __cxx_static_address_5f668b1190f571d0ec9f1135.reference || (__cxx_static_address_5f668b1190f571d0ec9f1135.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING4____header_global_2a5cc9706c2c134f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:763
export const DOLPHIN1____header_global_708a8f1a16af835d = ((((((4591) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a7cc9497a87b189737febec2() {
  return __cxx_static_address_a7cc9497a87b189737febec2.reference || (__cxx_static_address_a7cc9497a87b189737febec2.reference = {
    __cReference: true,
    get value() { return DOLPHIN1____header_global_708a8f1a16af835d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:764
export const DOLPHIN2____header_global_e383f21c759e7228 = ((((((4592) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a4587813406d3b46b9a0b4b7() {
  return __cxx_static_address_a4587813406d3b46b9a0b4b7.reference || (__cxx_static_address_a4587813406d3b46b9a0b4b7.reference = {
    __cReference: true,
    get value() { return DOLPHIN2____header_global_e383f21c759e7228; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:765
export const NEWBEAST____header_global_4c03c5adc55c4068 = ((((((4610) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d897d1222de4fa02d912af7f() {
  return __cxx_static_address_d897d1222de4fa02d912af7f.reference || (__cxx_static_address_d897d1222de4fa02d912af7f.reference = {
    __cReference: true,
    get value() { return NEWBEAST____header_global_4c03c5adc55c4068; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:766
export const NEWBEASTSTAYPUT____header_global_49a750f112860e4a = ((((((4611) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c5f058f42abecadd01f6f727() {
  return __cxx_static_address_c5f058f42abecadd01f6f727.reference || (__cxx_static_address_c5f058f42abecadd01f6f727.reference = {
    __cReference: true,
    get value() { return NEWBEASTSTAYPUT____header_global_49a750f112860e4a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:767
export const BOSS4____header_global_16d6b9400293aeb5 = ((((((4740) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_90a5eb7664a3fa9d8f4d35fe() {
  return __cxx_static_address_90a5eb7664a3fa9d8f4d35fe.reference || (__cxx_static_address_90a5eb7664a3fa9d8f4d35fe.reference = {
    __cReference: true,
    get value() { return BOSS4____header_global_16d6b9400293aeb5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:768
export const BOSS4STAYPUT____header_global_1a8a5b348ee9fa64 = ((((((4741) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2815d417bb4de532ba9a81fe() {
  return __cxx_static_address_2815d417bb4de532ba9a81fe.reference || (__cxx_static_address_2815d417bb4de532ba9a81fe.reference = {
    __cReference: true,
    get value() { return BOSS4STAYPUT____header_global_1a8a5b348ee9fa64; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:769
export const FEM10____header_global_5f8055602e656dcd = ((((((4864) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8d42b3318222b14d768528f4() {
  return __cxx_static_address_8d42b3318222b14d768528f4.reference || (__cxx_static_address_8d42b3318222b14d768528f4.reference = {
    __cReference: true,
    get value() { return FEM10____header_global_5f8055602e656dcd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:770
export const TOUGHGAL____header_global_bb1c42daffcfb6df = ((((((4866) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_758fabc63ca5d44fb37bb4eb() {
  return __cxx_static_address_758fabc63ca5d44fb37bb4eb.reference || (__cxx_static_address_758fabc63ca5d44fb37bb4eb.reference = {
    __cReference: true,
    get value() { return TOUGHGAL____header_global_bb1c42daffcfb6df; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:771
export const MAN____header_global_6bb1015bf95e05da = ((((((4871) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9daa83b0aa21a1642aa34dcf() {
  return __cxx_static_address_9daa83b0aa21a1642aa34dcf.reference || (__cxx_static_address_9daa83b0aa21a1642aa34dcf.reference = {
    __cReference: true,
    get value() { return MAN____header_global_6bb1015bf95e05da; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:772
export const MAN2____header_global_42c179f01954f82e = ((((((4872) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dd95579a4e565c8ee630b398() {
  return __cxx_static_address_dd95579a4e565c8ee630b398.reference || (__cxx_static_address_dd95579a4e565c8ee630b398.reference = {
    __cReference: true,
    get value() { return MAN2____header_global_42c179f01954f82e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:773
export const WOMAN____header_global_635b66364413ace8 = ((((((4874) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_00ec92435c798d31fe8c74fe() {
  return __cxx_static_address_00ec92435c798d31fe8c74fe.reference || (__cxx_static_address_00ec92435c798d31fe8c74fe.reference = {
    __cReference: true,
    get value() { return WOMAN____header_global_635b66364413ace8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:774
export const NATURALLIGHTNING____header_global_faf6d879f2f8b992 = ((((((4890) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7248865a145582575a016ecb() {
  return __cxx_static_address_7248865a145582575a016ecb.reference || (__cxx_static_address_7248865a145582575a016ecb.reference = {
    __cReference: true,
    get value() { return NATURALLIGHTNING____header_global_faf6d879f2f8b992; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:775
export const WEATHERWARN____header_global_6ab56803451b944e = ((((((4893) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6fee87a616cf73ef3d3d8a22() {
  return __cxx_static_address_6fee87a616cf73ef3d3d8a22.reference || (__cxx_static_address_6fee87a616cf73ef3d3d8a22.reference = {
    __cReference: true,
    get value() { return WEATHERWARN____header_global_6ab56803451b944e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:776
export const DUKETAG____header_global_f1867f4be2f0f0a5 = ((((((4900) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fc075492c4dddff4659cf959() {
  return __cxx_static_address_fc075492c4dddff4659cf959.reference || (__cxx_static_address_fc075492c4dddff4659cf959.reference = {
    __cReference: true,
    get value() { return DUKETAG____header_global_f1867f4be2f0f0a5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:777
export const SIGN1____header_global_a0094d53367a7104 = ((((((4909) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f27422720af47734d1fdc452() {
  return __cxx_static_address_f27422720af47734d1fdc452.reference || (__cxx_static_address_f27422720af47734d1fdc452.reference = {
    __cReference: true,
    get value() { return SIGN1____header_global_a0094d53367a7104; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:778
export const SIGN2____header_global_17906b1329b50d16 = ((((((4912) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6635da104a1b797ace44cb71() {
  return __cxx_static_address_6635da104a1b797ace44cb71.reference || (__cxx_static_address_6635da104a1b797ace44cb71.reference = {
    __cReference: true,
    get value() { return SIGN2____header_global_17906b1329b50d16; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:779
export const JURYGUY____header_global_f7fc66036904e040 = ((((((4943) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_815413fa0b73d2337c1b6018() {
  return __cxx_static_address_815413fa0b73d2337c1b6018.reference || (__cxx_static_address_815413fa0b73d2337c1b6018.reference = {
    __cReference: true,
    get value() { return JURYGUY____header_global_f7fc66036904e040; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:780
export const WIDESCREENSTATUSBAR____header_global_11ab4aa6855278bc = ((((((5120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_75e51d9ff35dce157a345311() {
  return __cxx_static_address_75e51d9ff35dce157a345311.reference || (__cxx_static_address_75e51d9ff35dce157a345311.reference = {
    __cReference: true,
    get value() { return WIDESCREENSTATUSBAR____header_global_11ab4aa6855278bc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:781
export const RPGGUNWIDE____header_global_1542c2901aa8628f = ((((((5121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2db839e59f9087b7a6f1292b() {
  return __cxx_static_address_2db839e59f9087b7a6f1292b.reference || (__cxx_static_address_2db839e59f9087b7a6f1292b.reference = {
    __cReference: true,
    get value() { return RPGGUNWIDE____header_global_1542c2901aa8628f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:782
export const FIRSTGUNRELOADWIDE____header_global_b669d62abd9837b5 = ((((((5122) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8ab75e9bb81ac411289b08d1() {
  return __cxx_static_address_8ab75e9bb81ac411289b08d1.reference || (__cxx_static_address_8ab75e9bb81ac411289b08d1.reference = {
    __cReference: true,
    get value() { return FIRSTGUNRELOADWIDE____header_global_b669d62abd9837b5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:783
export const FREEZEWIDE____header_global_900e1da3eb82b1c0 = ((((((5123) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5a2ebdd23622419baf54455e() {
  return __cxx_static_address_5a2ebdd23622419baf54455e.reference || (__cxx_static_address_5a2ebdd23622419baf54455e.reference = {
    __cReference: true,
    get value() { return FREEZEWIDE____header_global_900e1da3eb82b1c0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:784
export const FREEZEFIREWIDE____header_global_5923e9dad7985dc0 = ((((((5124) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_27f1e8eca53c515ae2b25153() {
  return __cxx_static_address_27f1e8eca53c515ae2b25153.reference || (__cxx_static_address_27f1e8eca53c515ae2b25153.reference = {
    __cReference: true,
    get value() { return FREEZEFIREWIDE____header_global_5923e9dad7985dc0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:785
export const SHRINKERWIDE____header_global_2e342725f3b1e9bb = ((((((5127) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c89bc237327b2acffb0a7ab7() {
  return __cxx_static_address_c89bc237327b2acffb0a7ab7.reference || (__cxx_static_address_c89bc237327b2acffb0a7ab7.reference = {
    __cReference: true,
    get value() { return SHRINKERWIDE____header_global_2e342725f3b1e9bb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:786
export const CRACKKNUCKLESWIDE____header_global_e5343e15a4868ddd = ((((((5129) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_12d4c43d7b512c70bf1392d3() {
  return __cxx_static_address_12d4c43d7b512c70bf1392d3.reference || (__cxx_static_address_12d4c43d7b512c70bf1392d3.reference = {
    __cReference: true,
    get value() { return CRACKKNUCKLESWIDE____header_global_e5343e15a4868ddd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:787
export const FLAMETHROWERSPRITE____header_global_b6a3c6e39282cade = ((((((5134) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9178e680a2a380a0ca464bce() {
  return __cxx_static_address_9178e680a2a380a0ca464bce.reference || (__cxx_static_address_9178e680a2a380a0ca464bce.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERSPRITE____header_global_b6a3c6e39282cade; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:788
export const FLAMETHROWERAMMO____header_global_76fe6f43a5399d72 = ((((((5135) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c07e74f7df96f14caac42001() {
  return __cxx_static_address_c07e74f7df96f14caac42001.reference || (__cxx_static_address_c07e74f7df96f14caac42001.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERAMMO____header_global_76fe6f43a5399d72; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:789
export const FLAMETHROWER____header_global_b1c9244016dd1f55 = ((((((5138) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0de3d2671c709661aa21b3fd() {
  return __cxx_static_address_0de3d2671c709661aa21b3fd.reference || (__cxx_static_address_0de3d2671c709661aa21b3fd.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER____header_global_b1c9244016dd1f55; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:790
export const FLAMETHROWERFIRE____header_global_a59bddfc5fcc3ee3 = ((((((5139) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e127eba79003d6f50442ec51() {
  return __cxx_static_address_e127eba79003d6f50442ec51.reference || (__cxx_static_address_e127eba79003d6f50442ec51.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERFIRE____header_global_a59bddfc5fcc3ee3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:791
export const FLAMETHROWERFLAME____header_global_9a4d381597d08f81 = ((((((1891) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_db60a6027eb27b8f02e5eb14() {
  return __cxx_static_address_db60a6027eb27b8f02e5eb14.reference || (__cxx_static_address_db60a6027eb27b8f02e5eb14.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERFLAME____header_global_9a4d381597d08f81; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:792
export const FLAMETHROWERPILOT____header_global_0041b673c91b6c47 = ((((((5174) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_24410515ea36ede32177bf2c() {
  return __cxx_static_address_24410515ea36ede32177bf2c.reference || (__cxx_static_address_24410515ea36ede32177bf2c.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERPILOT____header_global_0041b673c91b6c47; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:793
export const FIREBALL____header_global_527647fc7f1c216d = ((((((5163) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_43c50866c727283dd4489095() {
  return __cxx_static_address_43c50866c727283dd4489095.reference || (__cxx_static_address_43c50866c727283dd4489095.reference = {
    __cReference: true,
    get value() { return FIREBALL____header_global_527647fc7f1c216d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:794
export const ONFIRE____header_global_87e9e190fef5d308 = ((((((5152) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_73f0fb3cec39bc0c53b08421() {
  return __cxx_static_address_73f0fb3cec39bc0c53b08421.reference || (__cxx_static_address_73f0fb3cec39bc0c53b08421.reference = {
    __cReference: true,
    get value() { return ONFIRE____header_global_87e9e190fef5d308; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:795
export const ONFIRESMOKE____header_global_03d01c16197756d0 = ((((((5143) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5739543af9f8dbf218c69c43() {
  return __cxx_static_address_5739543af9f8dbf218c69c43.reference || (__cxx_static_address_5739543af9f8dbf218c69c43.reference = {
    __cReference: true,
    get value() { return ONFIRESMOKE____header_global_03d01c16197756d0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:796
export const BURNEDCORPSE____header_global_57817c73754d7866 = ((((((5173) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1458133fdc4128606d45e53c() {
  return __cxx_static_address_1458133fdc4128606d45e53c.reference || (__cxx_static_address_1458133fdc4128606d45e53c.reference = {
    __cReference: true,
    get value() { return BURNEDCORPSE____header_global_57817c73754d7866; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:797
export const WHISPYSMOKE____header_global_d79cd83f0c54cb9a = ((((((5268) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_77c656441da87f8c069edf44() {
  return __cxx_static_address_77c656441da87f8c069edf44.reference || (__cxx_static_address_77c656441da87f8c069edf44.reference = {
    __cReference: true,
    get value() { return WHISPYSMOKE____header_global_d79cd83f0c54cb9a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:798
export const FIREFLY____header_global_cc80b811f95aa4ad = ((((((5180) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2cb0ca2af9c7e0349d158d7a() {
  return __cxx_static_address_2cb0ca2af9c7e0349d158d7a.reference || (__cxx_static_address_2cb0ca2af9c7e0349d158d7a.reference = {
    __cReference: true,
    get value() { return FIREFLY____header_global_cc80b811f95aa4ad; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:799
export const FIREFLYSHRINKEFFECT____header_global_597327f9ebbd6e25 = ((((((5360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4c74b55a3d1fb31f4df397c4() {
  return __cxx_static_address_4c74b55a3d1fb31f4df397c4.reference || (__cxx_static_address_4c74b55a3d1fb31f4df397c4.reference = {
    __cReference: true,
    get value() { return FIREFLYSHRINKEFFECT____header_global_597327f9ebbd6e25; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:800
export const FIREFLYGROWEFFECT____header_global_7d37af6bdbbbfe8b = ((((((5367) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c62a38f53d8d8633fd539e78() {
  return __cxx_static_address_c62a38f53d8d8633fd539e78.reference || (__cxx_static_address_c62a38f53d8d8633fd539e78.reference = {
    __cReference: true,
    get value() { return FIREFLYGROWEFFECT____header_global_7d37af6bdbbbfe8b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:801
export const FIREFLYFLYINGEFFECT____header_global_529a084f58e0aa5d = ((((((5296) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_28618017b606f35221a798a3() {
  return __cxx_static_address_28618017b606f35221a798a3.reference || (__cxx_static_address_28618017b606f35221a798a3.reference = {
    __cReference: true,
    get value() { return FIREFLYFLYINGEFFECT____header_global_529a084f58e0aa5d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:802
export const BOSS5____header_global_b7d47e10f317f2d3 = ((((((5310) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5d90cc11fcd0faf2a5d48851() {
  return __cxx_static_address_5d90cc11fcd0faf2a5d48851.reference || (__cxx_static_address_5d90cc11fcd0faf2a5d48851.reference = {
    __cReference: true,
    get value() { return BOSS5____header_global_b7d47e10f317f2d3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:803
export const BOSS5STAYPUT____header_global_98749c50b383f114 = ((((((5311) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4d335750a928bf6878792206() {
  return __cxx_static_address_4d335750a928bf6878792206.reference || (__cxx_static_address_4d335750a928bf6878792206.reference = {
    __cReference: true,
    get value() { return BOSS5STAYPUT____header_global_98749c50b383f114; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:804
export const LAVAPOOL____header_global_d6daec9085ecca41 = ((((((5304) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_735f5f91dff0dcce520ba46c() {
  return __cxx_static_address_735f5f91dff0dcce520ba46c.reference || (__cxx_static_address_735f5f91dff0dcce520ba46c.reference = {
    __cReference: true,
    get value() { return LAVAPOOL____header_global_d6daec9085ecca41; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:805
export const LAVASPLASH____header_global_ac17cb1c32b74e7e = ((((((5371) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fe11c6c3d50ae83bf3139637() {
  return __cxx_static_address_fe11c6c3d50ae83bf3139637.reference || (__cxx_static_address_fe11c6c3d50ae83bf3139637.reference = {
    __cReference: true,
    get value() { return LAVASPLASH____header_global_ac17cb1c32b74e7e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:806
export const LAVAPOOLBUBBLE____header_global_63573b7f55a304b7 = ((((((5207) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1c2a9cbc9a23446805ba2576() {
  return __cxx_static_address_1c2a9cbc9a23446805ba2576.reference || (__cxx_static_address_1c2a9cbc9a23446805ba2576.reference = {
    __cReference: true,
    get value() { return LAVAPOOLBUBBLE____header_global_63573b7f55a304b7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:807
export const BOSS2STAYPUT____header_global_eaec9ad87db8aad1 = ((((((2711) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f6d536563e702fd4199d5b6f() {
  return __cxx_static_address_f6d536563e702fd4199d5b6f.reference || (__cxx_static_address_f6d536563e702fd4199d5b6f.reference = {
    __cReference: true,
    get value() { return BOSS2STAYPUT____header_global_eaec9ad87db8aad1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:808
export const BOSS3STAYPUT____header_global_010c8ccf4a4a69a9 = ((((((2761) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c74b017b7d2d84ead7dc8108() {
  return __cxx_static_address_c74b017b7d2d84ead7dc8108.reference || (__cxx_static_address_c74b017b7d2d84ead7dc8108.reference = {
    __cReference: true,
    get value() { return BOSS3STAYPUT____header_global_010c8ccf4a4a69a9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:809
export const E32_TILE5736____header_global_118075c724a78a6a = ((((((5736) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f18f791159f98e6c77189bae() {
  return __cxx_static_address_f18f791159f98e6c77189bae.reference || (__cxx_static_address_f18f791159f98e6c77189bae.reference = {
    __cReference: true,
    get value() { return E32_TILE5736____header_global_118075c724a78a6a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:810
export const E32_TILE5737____header_global_4c0bd51c530fdd00 = ((((((5737) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_54dd45ed2014c00c4f143c2a() {
  return __cxx_static_address_54dd45ed2014c00c4f143c2a.reference || (__cxx_static_address_54dd45ed2014c00c4f143c2a.reference = {
    __cReference: true,
    get value() { return E32_TILE5737____header_global_4c0bd51c530fdd00; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:811
export const E32_TILE5846____header_global_a9e00e8644a60291 = ((((((5846) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c2c283f96127e2a4de8f64f0() {
  return __cxx_static_address_c2c283f96127e2a4de8f64f0.reference || (__cxx_static_address_c2c283f96127e2a4de8f64f0.reference = {
    __cReference: true,
    get value() { return E32_TILE5846____header_global_a9e00e8644a60291; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/network.h:180
export const cSnapshotMemUsage__header_global_481b141b134ce1a1 = u64((BigInt(u64(64)) * BigInt((BigInt((BigInt((BigInt(72) * BigInt(u64(16384)))) + BigInt((BigInt(96) * BigInt(u64(4096)))))) + BigInt((BigInt(296) * BigInt(u64(16384))))))));
function __cxx_static_address_af467e88944586b545c4b69f() {
  return __cxx_static_address_af467e88944586b545c4b69f.reference || (__cxx_static_address_af467e88944586b545c4b69f.reference = {
    __cReference: true,
    get value() { return cSnapshotMemUsage__header_global_481b141b134ce1a1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/premap.cpp:33
export let precachehightile = Array.from({ length: 2 }, () => new Uint8Array(3840));
function __cxx_static_address_150c1e3000f614335e147fdf() {
  return __cxx_static_address_150c1e3000f614335e147fdf.reference || (__cxx_static_address_150c1e3000f614335e147fdf.reference = {
    __cReference: true,
    get value() { return precachehightile; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/premap.cpp:34
export let g_precacheCount = 0;
function __cxx_static_address_205a0089da357ef0b8c198c5() {
  return __cxx_static_address_205a0089da357ef0b8c198c5.reference || (__cxx_static_address_205a0089da357ef0b8c198c5.reference = {
    __cReference: true,
    get value() { return g_precacheCount; },
    set value(__cxx_lvalue_0) { g_precacheCount = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/include/fix16.h:31
export const FIX16_MAX__header_global_31929c19e6d238b0 = i32(2147483647);
function __cxx_static_address_4648473d3502be1f87402c22() {
  return __cxx_static_address_4648473d3502be1f87402c22.reference || (__cxx_static_address_4648473d3502be1f87402c22.reference = {
    __cReference: true,
    get value() { return FIX16_MAX__header_global_31929c19e6d238b0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:32
export const FIX16_MIN__header_global_35a35e0afdcf1a40 = i32(2147483648);
function __cxx_static_address_6b19cc28f27c702613c6037a() {
  return __cxx_static_address_6b19cc28f27c702613c6037a.reference || (__cxx_static_address_6b19cc28f27c702613c6037a.reference = {
    __cReference: true,
    get value() { return FIX16_MIN__header_global_35a35e0afdcf1a40; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:33
export const FIX16_OVERFLOW__header_global_24603dcd93ba1a22 = i32(2147483648);
function __cxx_static_address_a84ed66bb75a62930bdb4873() {
  return __cxx_static_address_a84ed66bb75a62930bdb4873.reference || (__cxx_static_address_a84ed66bb75a62930bdb4873.reference = {
    __cReference: true,
    get value() { return FIX16_OVERFLOW__header_global_24603dcd93ba1a22; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:35
export const fix16_one__header_global_6881ab7737c3bc6a = i32(65536);
function __cxx_static_address_b167b9296e9508768e897b0d() {
  return __cxx_static_address_b167b9296e9508768e897b0d.reference || (__cxx_static_address_b167b9296e9508768e897b0d.reference = {
    __cReference: true,
    get value() { return fix16_one__header_global_6881ab7737c3bc6a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:36
export const fix16_half__header_global_a38bd6397241b43f = i32(32768);
function __cxx_static_address_aa9ef8825b89ee9de433efdf() {
  return __cxx_static_address_aa9ef8825b89ee9de433efdf.reference || (__cxx_static_address_aa9ef8825b89ee9de433efdf.reference = {
    __cReference: true,
    get value() { return fix16_half__header_global_a38bd6397241b43f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:37
export const flt_f161r__header_global_44ac221e6c369feb = Math.fround(Math.fround((Math.fround(1) / Math.fround(65536))));
function __cxx_static_address_cebe661053872d838ac21778() {
  return __cxx_static_address_cebe661053872d838ac21778.reference || (__cxx_static_address_cebe661053872d838ac21778.reference = {
    __cReference: true,
    get value() { return flt_f161r__header_global_44ac221e6c369feb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/premap.cpp:37
export let NET_75_CHECK = i32(0);
function __cxx_static_address_fd3490ebfdb15ddb9272b81e() {
  return __cxx_static_address_fd3490ebfdb15ddb9272b81e.reference || (__cxx_static_address_fd3490ebfdb15ddb9272b81e.reference = {
    __cReference: true,
    get value() { return NET_75_CHECK; },
    set value(__cxx_lvalue_0) { NET_75_CHECK = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/premap.cpp:421
export function cacheExtraTextureMaps(tileNum, type) {
  (tileNum = i32(tileNum));
  (type = i32(type));
}

// C/C++ source: source/duke3d/src/premap.cpp:650
export function P_ResetTintFade(pPlayer) {
  ((pPlayer).value.pals.f = ((((0) & 255)) & 255));
}

// C/C++ source: source/build/include/compat.h:1169
export const pow2char__header_global_33bfb448c11fbddb = new Uint8Array([((1) & 255), ((2) & 255), ((4) & 255), ((8) & 255), ((16) & 255), ((32) & 255), ((64) & 255), ((128) & 255)]);
function __cxx_static_address_3873c20dee556162a4b4f1ae() {
  return __cxx_static_address_3873c20dee556162a4b4f1ae.reference || (__cxx_static_address_3873c20dee556162a4b4f1ae.reference = {
    __cReference: true,
    get value() { return pow2char__header_global_33bfb448c11fbddb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:172
export const g_defaultVideoModes__header_global_9ac09c1796286d70 = [cMarkAggregate(({"x": 2560, "y": 1440})), cMarkAggregate(({"x": 2560, "y": 1200})), cMarkAggregate(({"x": 2560, "y": 1080})), cMarkAggregate(({"x": 1920, "y": 1440})), cMarkAggregate(({"x": 1920, "y": 1200})), cMarkAggregate(({"x": 1920, "y": 1080})), cMarkAggregate(({"x": 1680, "y": 1050})), cMarkAggregate(({"x": 1600, "y": 1200})), cMarkAggregate(({"x": 1600, "y": 900})), cMarkAggregate(({"x": 1366, "y": 768})), cMarkAggregate(({"x": 1280, "y": 1024})), cMarkAggregate(({"x": 1280, "y": 960})), cMarkAggregate(({"x": 1280, "y": 720})), cMarkAggregate(({"x": 1152, "y": 864})), cMarkAggregate(({"x": 1024, "y": 768})), cMarkAggregate(({"x": 1024, "y": 600})), cMarkAggregate(({"x": 800, "y": 600})), cMarkAggregate(({"x": 640, "y": 480})), cMarkAggregate(({"x": 640, "y": 400})), cMarkAggregate(({"x": 512, "y": 384})), cMarkAggregate(({"x": 480, "y": 360})), cMarkAggregate(({"x": 400, "y": 300})), cMarkAggregate(({"x": 320, "y": 240})), cMarkAggregate(({"x": 320, "y": 200})), cMarkAggregate(({"x": 0, "y": 0}))];
function __cxx_static_address_fb8f0f64a4b7421715109a91() {
  return __cxx_static_address_fb8f0f64a4b7421715109a91.reference || (__cxx_static_address_fb8f0f64a4b7421715109a91.reference = {
    __cReference: true,
    get value() { return g_defaultVideoModes__header_global_9ac09c1796286d70; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:188
export const g_keyAsciiTable__header_global_b7db3754a17b897a = new Uint8Array([((0) & 255), ((0) & 255), 49, 50, 51, 52, 53, 54, 55, 56, 57, 48, 45, 61, ((0) & 255), ((0) & 255), 113, 119, 101, 114, 116, 121, 117, 105, 111, 112, 91, 93, ((0) & 255), ((0) & 255), 97, 115, 100, 102, 103, 104, 106, 107, 108, 59, ((39) & 255), 96, ((0) & 255), ((92) & 255), 122, 120, 99, 118, 98, 110, 109, 44, 46, 47, ((0) & 255), 42, ((0) & 255), ((32) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), 55, 56, 57, 45, 52, 53, 54, 43, 49, 50, 51, 48, 46, ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255)]);
function __cxx_static_address_42a32d7d2de35b25af9c5c25() {
  return __cxx_static_address_42a32d7d2de35b25af9c5c25.reference || (__cxx_static_address_42a32d7d2de35b25af9c5c25.reference = {
    __cReference: true,
    get value() { return g_keyAsciiTable__header_global_b7db3754a17b897a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:196
export const g_keyAsciiTableShift__header_global_17034bc69589494f = new Uint8Array([((0) & 255), ((0) & 255), 33, 64, 35, 36, 37, 94, 38, 42, 40, 41, 95, 43, ((0) & 255), ((0) & 255), 81, 87, 69, 82, 84, 89, 85, 73, 79, 80, 123, 125, ((0) & 255), ((0) & 255), 65, 83, 68, 70, 71, 72, 74, 75, 76, 58, 34, 126, ((0) & 255), 124, 90, 88, 67, 86, 66, 78, 77, 60, 62, 63, ((0) & 255), 42, ((0) & 255), ((32) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), 55, 56, 57, 45, 52, 53, 54, 43, 49, 50, 51, 48, 46, ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255)]);
function __cxx_static_address_f19e32d1babf4958017490b9() {
  return __cxx_static_address_f19e32d1babf4958017490b9.reference || (__cxx_static_address_f19e32d1babf4958017490b9.reference = {
    __cReference: true,
    get value() { return g_keyAsciiTableShift__header_global_17034bc69589494f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:895
export const pow2long__header_global_4da2c6d34107c4c6 = new Int32Array([1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144, 524288, 1048576, 2097152, 4194304, 8388608, 16777216, 33554432, 67108864, 134217728, 268435456, 536870912, 1073741824, 2147483647]);
function __cxx_static_address_4ccff4382bb46745bcb28369() {
  return __cxx_static_address_4ccff4382bb46745bcb28369.reference || (__cxx_static_address_4ccff4382bb46745bcb28369.reference = {
    __cReference: true,
    get value() { return pow2long__header_global_4da2c6d34107c4c6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:907
export const pow2ulong__header_global_49de829ce10699b5 = new Uint32Array([u32(1), u32(2), u32(4), u32(8), u32(16), u32(32), u32(64), u32(128), u32(256), u32(512), u32(1024), u32(2048), u32(4096), u32(8192), u32(16384), u32(32768), u32(65536), u32(131072), u32(262144), u32(524288), u32(1048576), u32(2097152), u32(4194304), u32(8388608), u32(16777216), u32(33554432), u32(67108864), u32(134217728), u32(268435456), u32(536870912), u32(1073741824), u32(2147483648n)]);
function __cxx_static_address_6f0e2ace9b8b727be0926b34() {
  return __cxx_static_address_6f0e2ace9b8b727be0926b34.reference || (__cxx_static_address_6f0e2ace9b8b727be0926b34.reference = {
    __cReference: true,
    get value() { return pow2ulong__header_global_49de829ce10699b5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:919
export const pow264__header_global_159c8a13266a86f4 = new BigInt64Array([BigInt(i64(1)), BigInt(i64(2)), BigInt(i64(4)), BigInt(i64(8)), BigInt(i64(16)), BigInt(i64(32)), BigInt(i64(64)), BigInt(i64(128)), BigInt(i64(256)), BigInt(i64(512)), BigInt(i64(1024)), BigInt(i64(2048)), BigInt(i64(4096)), BigInt(i64(8192)), BigInt(i64(16384)), BigInt(i64(32768)), BigInt(i64(65536)), BigInt(i64(131072)), BigInt(i64(262144)), BigInt(i64(524288)), BigInt(i64(1048576)), BigInt(i64(2097152)), BigInt(i64(4194304)), BigInt(i64(8388608)), BigInt(i64(16777216)), BigInt(i64(33554432)), BigInt(i64(67108864)), BigInt(i64(134217728)), BigInt(i64(268435456)), BigInt(i64(536870912)), BigInt(i64(1073741824)), BigInt(2147483648n), BigInt(4294967296n), BigInt(8589934592n), BigInt(17179869184n), BigInt(34359738368n), BigInt(68719476736n), BigInt(137438953472n), BigInt(274877906944n), BigInt(549755813888n), BigInt(1099511627776n), BigInt(2199023255552n), BigInt(4398046511104n), BigInt(8796093022208n), BigInt(17592186044416n), BigInt(35184372088832n), BigInt(70368744177664n), BigInt(140737488355328n), BigInt(281474976710656n), BigInt(562949953421312n), BigInt(1125899906842624n), BigInt(2251799813685248n), BigInt(4503599627370496n), BigInt(9007199254740992n), BigInt(18014398509481984n), BigInt(36028797018963968n), BigInt(72057594037927936n), BigInt(144115188075855872n), BigInt(288230376151711744n), BigInt(576460752303423488n), BigInt(1152921504606846976n), BigInt(2305843009213693952n), BigInt(4611686018427387904n), BigInt(9223372036854775807n)]);
function __cxx_static_address_d89f614e9e02baf78c1d2801() {
  return __cxx_static_address_d89f614e9e02baf78c1d2801.reference || (__cxx_static_address_d89f614e9e02baf78c1d2801.reference = {
    __cReference: true,
    get value() { return pow264__header_global_159c8a13266a86f4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export function bitmap_test__header_d869bd17728c(ptr, n) {

  return Boolean((i32((i32((cDeref(cPointerOffset(ptr, i32((n >> 3)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & i32((cDeref(cPointerOffset(pow2char__header_global_33bfb448c11fbddb, i32((n & 7)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))) == i32((cDeref(cPointerOffset(pow2char__header_global_33bfb448c11fbddb, i32((n & 7)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value))));
}

export function bitmap_set__header_79aaebae34ed(ptr, n) {

  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = (((__cxx_lvalue_0.value | i32((cDeref(cPointerOffset(pow2char__header_global_33bfb448c11fbddb, i32((n & 7)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))) & 255)))(cDeref(cPointerOffset(ptr, i32((n >> 3)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array));
}

export function bitmap_set__header_a48cebb6e453(ptr, n) {

  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = (((__cxx_lvalue_0.value | i32((cDeref(cPointerOffset(pow2char__header_global_33bfb448c11fbddb, i32((n & 7)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))) & 255)))(cDeref(cPointerOffset(ptr, i32((n >> 3)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array));
}

export function bitmap_test__header_45b8709cd7a8(ptr, n) {

  return Boolean((i32((i32((cDeref(cPointerOffset(ptr, i32((n >> 3)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & i32((cDeref(cPointerOffset(pow2char__header_global_33bfb448c11fbddb, i32((n & 7)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))) == i32((cDeref(cPointerOffset(pow2char__header_global_33bfb448c11fbddb, i32((n & 7)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value))));
}

// C/C++ source: source/duke3d/src/premap.cpp:1079
export function videoGetRenderMode__header_6000bd412bd0() {
  return i32(0);
}

// C/C++ source: source/duke3d/src/premap.cpp:1396
export function logapproach__header_8521df926f00(val, targetval) {
  let dif = i32((targetval - val));
  return i32((Boolean(i32((dif >> 1))) ? i32((val + i32((dif >> 1)))) : targetval));
}

export function clamp__header_1f67e8bf1acd(__cxx_in, min, max) {
  return i32(((__cxx_in <= i32(min)) ? i32(min) : ((__cxx_in >= i32(max)) ? i32(max) : __cxx_in)));
}

// C/C++ source: source/duke3d/src/premap.cpp:46
export function fix16_from_int__header_e77ac09a7002(a) {
  return i32(Math.imul(a, fix16_one__header_global_6881ab7737c3bc6a));
}

export function ARRAY_SIZE__header_4392c52062c0(arg0) {
  return u64(256n);
}

// C/C++ source: source/duke3d/src/premap.cpp:431
let __static_G_GetTeamPalette__header_9032b7745b64_pal = new Int8Array([(((3) << 24) >> 24), (((10) << 24) >> 24), (((11) << 24) >> 24), (((12) << 24) >> 24)]);
export function G_GetTeamPalette__header_9032b7745b64(team) {

  if ((u64(u32(team)) >= ARRAY_SIZE__header_0a2637d8cf91(__static_G_GetTeamPalette__header_9032b7745b64_pal))) {
    return i32(0);
  }
  return i32((cDeref(cPointerOffset(__static_G_GetTeamPalette__header_9032b7745b64_pal, team, Int8Array.BYTES_PER_ELEMENT), Int8Array).value));
}

// C/C++ source: source/duke3d/src/premap.cpp:42
export function fix16_to_int__header_071167bba591(a) {
  return i32(Math.trunc(i32((a + ((a >= 0) ? fix16_half__header_global_a38bd6397241b43f : (-fix16_half__header_global_a38bd6397241b43f)))) / fix16_one__header_global_6881ab7737c3bc6a));
}

export function ARRAY_SIZE__header_dc2fb562868b(arg0) {
  return u64(512n);
}

// C/C++ source: source/build/include/smmalloc.h:859
export function _sm_malloc(allocator, bytesCount, alignment) {
  return cRecordObject(allocator).Alloc(bytesCount, alignment);
}

// C/C++ source: source/build/include/smmalloc.h:864
export function _sm_free(allocator, p) {
  return cRecordObject(allocator).Free(p);
}

export function ARRAY_SIZE__header_0a2637d8cf91(arg0) {
  return u64(4n);
}

// C/C++ source: source/build/include/smmalloc.h:866
export function _sm_realloc(allocator, p, bytesCount, alignment) {
  return cRecordObject(allocator).Realloc(p, bytesCount, alignment);
}
