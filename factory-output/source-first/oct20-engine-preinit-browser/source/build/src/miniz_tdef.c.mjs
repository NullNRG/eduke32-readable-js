// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/build/src/miniz_tdef.c
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
const u64 = value => BigInt.asUintN(64, BigInt(value));

// C/C++ source: source/build/include/fix16.h:111
export const fix16_rad_to_deg_mult__header_global_4b61c1a85cf1d7a0 = i32(3754936);
function __cxx_static_address_3d0142c3ce02d5d93d17afd2() {
  return __cxx_static_address_3d0142c3ce02d5d93d17afd2.reference || (__cxx_static_address_3d0142c3ce02d5d93d17afd2.reference = {
    __cReference: true,
    get value() { return fix16_rad_to_deg_mult__header_global_4b61c1a85cf1d7a0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:114
export const fix16_deg_to_rad_mult__header_global_57679a82782508fa = i32(1144);
function __cxx_static_address_6837e7c1fdfaf3c40498a5ec() {
  return __cxx_static_address_6837e7c1fdfaf3c40498a5ec.reference || (__cxx_static_address_6837e7c1fdfaf3c40498a5ec.reference = {
    __cReference: true,
    get value() { return fix16_deg_to_rad_mult__header_global_57679a82782508fa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:31
export const FIX16_MAX__header_global_945977cf2144d019 = i32(2147483647);
function __cxx_static_address_0c1f45ce8333769e4984c403() {
  return __cxx_static_address_0c1f45ce8333769e4984c403.reference || (__cxx_static_address_0c1f45ce8333769e4984c403.reference = {
    __cReference: true,
    get value() { return FIX16_MAX__header_global_945977cf2144d019; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:32
export const FIX16_MIN__header_global_3af72b63ba173ad1 = i32(2147483648);
function __cxx_static_address_d8a73dcbef383abbf2a17a06() {
  return __cxx_static_address_d8a73dcbef383abbf2a17a06.reference || (__cxx_static_address_d8a73dcbef383abbf2a17a06.reference = {
    __cReference: true,
    get value() { return FIX16_MIN__header_global_3af72b63ba173ad1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:33
export const FIX16_OVERFLOW__header_global_17af71326c22f373 = i32(2147483648);
function __cxx_static_address_914b12672f21ad087588685c() {
  return __cxx_static_address_914b12672f21ad087588685c.reference || (__cxx_static_address_914b12672f21ad087588685c.reference = {
    __cReference: true,
    get value() { return FIX16_OVERFLOW__header_global_17af71326c22f373; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:35
export const fix16_one__header_global_ade40f29639f5d14 = i32(65536);
function __cxx_static_address_992bcb45948ddae7e8b594e9() {
  return __cxx_static_address_992bcb45948ddae7e8b594e9.reference || (__cxx_static_address_992bcb45948ddae7e8b594e9.reference = {
    __cReference: true,
    get value() { return fix16_one__header_global_ade40f29639f5d14; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:36
export const fix16_half__header_global_ccfc258fc6b4115d = i32(32768);
function __cxx_static_address_d8cdfc0d0dcb5db4777cf44e() {
  return __cxx_static_address_d8cdfc0d0dcb5db4777cf44e.reference || (__cxx_static_address_d8cdfc0d0dcb5db4777cf44e.reference = {
    __cReference: true,
    get value() { return fix16_half__header_global_ccfc258fc6b4115d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:37
export const flt_f161r__header_global_7c5c6c2e4a551981 = Math.fround(Math.fround((Math.fround(1) / Math.fround(65536))));
function __cxx_static_address_7d942f8287fc681867bbdfb6() {
  return __cxx_static_address_7d942f8287fc681867bbdfb6.reference || (__cxx_static_address_7d942f8287fc681867bbdfb6.reference = {
    __cReference: true,
    get value() { return flt_f161r__header_global_7c5c6c2e4a551981; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/miniz_tdef.c:39
export const s_tdefl_len_sym = new Uint16Array([((257) & 65535), ((258) & 65535), ((259) & 65535), ((260) & 65535), ((261) & 65535), ((262) & 65535), ((263) & 65535), ((264) & 65535), ((265) & 65535), ((265) & 65535), ((266) & 65535), ((266) & 65535), ((267) & 65535), ((267) & 65535), ((268) & 65535), ((268) & 65535), ((269) & 65535), ((269) & 65535), ((269) & 65535), ((269) & 65535), ((270) & 65535), ((270) & 65535), ((270) & 65535), ((270) & 65535), ((271) & 65535), ((271) & 65535), ((271) & 65535), ((271) & 65535), ((272) & 65535), ((272) & 65535), ((272) & 65535), ((272) & 65535), ((273) & 65535), ((273) & 65535), ((273) & 65535), ((273) & 65535), ((273) & 65535), ((273) & 65535), ((273) & 65535), ((273) & 65535), ((274) & 65535), ((274) & 65535), ((274) & 65535), ((274) & 65535), ((274) & 65535), ((274) & 65535), ((274) & 65535), ((274) & 65535), ((275) & 65535), ((275) & 65535), ((275) & 65535), ((275) & 65535), ((275) & 65535), ((275) & 65535), ((275) & 65535), ((275) & 65535), ((276) & 65535), ((276) & 65535), ((276) & 65535), ((276) & 65535), ((276) & 65535), ((276) & 65535), ((276) & 65535), ((276) & 65535), ((277) & 65535), ((277) & 65535), ((277) & 65535), ((277) & 65535), ((277) & 65535), ((277) & 65535), ((277) & 65535), ((277) & 65535), ((277) & 65535), ((277) & 65535), ((277) & 65535), ((277) & 65535), ((277) & 65535), ((277) & 65535), ((277) & 65535), ((277) & 65535), ((278) & 65535), ((278) & 65535), ((278) & 65535), ((278) & 65535), ((278) & 65535), ((278) & 65535), ((278) & 65535), ((278) & 65535), ((278) & 65535), ((278) & 65535), ((278) & 65535), ((278) & 65535), ((278) & 65535), ((278) & 65535), ((278) & 65535), ((278) & 65535), ((279) & 65535), ((279) & 65535), ((279) & 65535), ((279) & 65535), ((279) & 65535), ((279) & 65535), ((279) & 65535), ((279) & 65535), ((279) & 65535), ((279) & 65535), ((279) & 65535), ((279) & 65535), ((279) & 65535), ((279) & 65535), ((279) & 65535), ((279) & 65535), ((280) & 65535), ((280) & 65535), ((280) & 65535), ((280) & 65535), ((280) & 65535), ((280) & 65535), ((280) & 65535), ((280) & 65535), ((280) & 65535), ((280) & 65535), ((280) & 65535), ((280) & 65535), ((280) & 65535), ((280) & 65535), ((280) & 65535), ((280) & 65535), ((281) & 65535), ((281) & 65535), ((281) & 65535), ((281) & 65535), ((281) & 65535), ((281) & 65535), ((281) & 65535), ((281) & 65535), ((281) & 65535), ((281) & 65535), ((281) & 65535), ((281) & 65535), ((281) & 65535), ((281) & 65535), ((281) & 65535), ((281) & 65535), ((281) & 65535), ((281) & 65535), ((281) & 65535), ((281) & 65535), ((281) & 65535), ((281) & 65535), ((281) & 65535), ((281) & 65535), ((281) & 65535), ((281) & 65535), ((281) & 65535), ((281) & 65535), ((281) & 65535), ((281) & 65535), ((281) & 65535), ((281) & 65535), ((282) & 65535), ((282) & 65535), ((282) & 65535), ((282) & 65535), ((282) & 65535), ((282) & 65535), ((282) & 65535), ((282) & 65535), ((282) & 65535), ((282) & 65535), ((282) & 65535), ((282) & 65535), ((282) & 65535), ((282) & 65535), ((282) & 65535), ((282) & 65535), ((282) & 65535), ((282) & 65535), ((282) & 65535), ((282) & 65535), ((282) & 65535), ((282) & 65535), ((282) & 65535), ((282) & 65535), ((282) & 65535), ((282) & 65535), ((282) & 65535), ((282) & 65535), ((282) & 65535), ((282) & 65535), ((282) & 65535), ((282) & 65535), ((283) & 65535), ((283) & 65535), ((283) & 65535), ((283) & 65535), ((283) & 65535), ((283) & 65535), ((283) & 65535), ((283) & 65535), ((283) & 65535), ((283) & 65535), ((283) & 65535), ((283) & 65535), ((283) & 65535), ((283) & 65535), ((283) & 65535), ((283) & 65535), ((283) & 65535), ((283) & 65535), ((283) & 65535), ((283) & 65535), ((283) & 65535), ((283) & 65535), ((283) & 65535), ((283) & 65535), ((283) & 65535), ((283) & 65535), ((283) & 65535), ((283) & 65535), ((283) & 65535), ((283) & 65535), ((283) & 65535), ((283) & 65535), ((284) & 65535), ((284) & 65535), ((284) & 65535), ((284) & 65535), ((284) & 65535), ((284) & 65535), ((284) & 65535), ((284) & 65535), ((284) & 65535), ((284) & 65535), ((284) & 65535), ((284) & 65535), ((284) & 65535), ((284) & 65535), ((284) & 65535), ((284) & 65535), ((284) & 65535), ((284) & 65535), ((284) & 65535), ((284) & 65535), ((284) & 65535), ((284) & 65535), ((284) & 65535), ((284) & 65535), ((284) & 65535), ((284) & 65535), ((284) & 65535), ((284) & 65535), ((284) & 65535), ((284) & 65535), ((284) & 65535), ((285) & 65535)]);
function __cxx_static_address_c38cf1b2dc9a5fa37c491b8c() {
  return __cxx_static_address_c38cf1b2dc9a5fa37c491b8c.reference || (__cxx_static_address_c38cf1b2dc9a5fa37c491b8c.reference = {
    __cReference: true,
    get value() { return s_tdefl_len_sym; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/miniz_tdef.c:50
export const s_tdefl_len_extra = new Uint8Array([((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((1) & 255), ((1) & 255), ((1) & 255), ((1) & 255), ((1) & 255), ((1) & 255), ((1) & 255), ((1) & 255), ((2) & 255), ((2) & 255), ((2) & 255), ((2) & 255), ((2) & 255), ((2) & 255), ((2) & 255), ((2) & 255), ((2) & 255), ((2) & 255), ((2) & 255), ((2) & 255), ((2) & 255), ((2) & 255), ((2) & 255), ((2) & 255), ((3) & 255), ((3) & 255), ((3) & 255), ((3) & 255), ((3) & 255), ((3) & 255), ((3) & 255), ((3) & 255), ((3) & 255), ((3) & 255), ((3) & 255), ((3) & 255), ((3) & 255), ((3) & 255), ((3) & 255), ((3) & 255), ((3) & 255), ((3) & 255), ((3) & 255), ((3) & 255), ((3) & 255), ((3) & 255), ((3) & 255), ((3) & 255), ((3) & 255), ((3) & 255), ((3) & 255), ((3) & 255), ((3) & 255), ((3) & 255), ((3) & 255), ((3) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((0) & 255)]);
function __cxx_static_address_ed12fa46ad1355a578626d46() {
  return __cxx_static_address_ed12fa46ad1355a578626d46.reference || (__cxx_static_address_ed12fa46ad1355a578626d46.reference = {
    __cReference: true,
    get value() { return s_tdefl_len_extra; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/miniz_tdef.c:57
export const s_tdefl_small_dist_sym = new Uint8Array([((0) & 255), ((1) & 255), ((2) & 255), ((3) & 255), ((4) & 255), ((4) & 255), ((5) & 255), ((5) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((8) & 255), ((8) & 255), ((8) & 255), ((8) & 255), ((8) & 255), ((8) & 255), ((8) & 255), ((8) & 255), ((9) & 255), ((9) & 255), ((9) & 255), ((9) & 255), ((9) & 255), ((9) & 255), ((9) & 255), ((9) & 255), ((10) & 255), ((10) & 255), ((10) & 255), ((10) & 255), ((10) & 255), ((10) & 255), ((10) & 255), ((10) & 255), ((10) & 255), ((10) & 255), ((10) & 255), ((10) & 255), ((10) & 255), ((10) & 255), ((10) & 255), ((10) & 255), ((11) & 255), ((11) & 255), ((11) & 255), ((11) & 255), ((11) & 255), ((11) & 255), ((11) & 255), ((11) & 255), ((11) & 255), ((11) & 255), ((11) & 255), ((11) & 255), ((11) & 255), ((11) & 255), ((11) & 255), ((11) & 255), ((12) & 255), ((12) & 255), ((12) & 255), ((12) & 255), ((12) & 255), ((12) & 255), ((12) & 255), ((12) & 255), ((12) & 255), ((12) & 255), ((12) & 255), ((12) & 255), ((12) & 255), ((12) & 255), ((12) & 255), ((12) & 255), ((12) & 255), ((12) & 255), ((12) & 255), ((12) & 255), ((12) & 255), ((12) & 255), ((12) & 255), ((12) & 255), ((12) & 255), ((12) & 255), ((12) & 255), ((12) & 255), ((12) & 255), ((12) & 255), ((12) & 255), ((12) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((14) & 255), ((14) & 255), ((14) & 255), ((14) & 255), ((14) & 255), ((14) & 255), ((14) & 255), ((14) & 255), ((14) & 255), ((14) & 255), ((14) & 255), ((14) & 255), ((14) & 255), ((14) & 255), ((14) & 255), ((14) & 255), ((14) & 255), ((14) & 255), ((14) & 255), ((14) & 255), ((14) & 255), ((14) & 255), ((14) & 255), ((14) & 255), ((14) & 255), ((14) & 255), ((14) & 255), ((14) & 255), ((14) & 255), ((14) & 255), ((14) & 255), ((14) & 255), ((14) & 255), ((14) & 255), ((14) & 255), ((14) & 255), ((14) & 255), ((14) & 255), ((14) & 255), ((14) & 255), ((14) & 255), ((14) & 255), ((14) & 255), ((14) & 255), ((14) & 255), ((14) & 255), ((14) & 255), ((14) & 255), ((14) & 255), ((14) & 255), ((14) & 255), ((14) & 255), ((14) & 255), ((14) & 255), ((14) & 255), ((14) & 255), ((14) & 255), ((14) & 255), ((14) & 255), ((14) & 255), ((14) & 255), ((14) & 255), ((14) & 255), ((14) & 255), ((15) & 255), ((15) & 255), ((15) & 255), ((15) & 255), ((15) & 255), ((15) & 255), ((15) & 255), ((15) & 255), ((15) & 255), ((15) & 255), ((15) & 255), ((15) & 255), ((15) & 255), ((15) & 255), ((15) & 255), ((15) & 255), ((15) & 255), ((15) & 255), ((15) & 255), ((15) & 255), ((15) & 255), ((15) & 255), ((15) & 255), ((15) & 255), ((15) & 255), ((15) & 255), ((15) & 255), ((15) & 255), ((15) & 255), ((15) & 255), ((15) & 255), ((15) & 255), ((15) & 255), ((15) & 255), ((15) & 255), ((15) & 255), ((15) & 255), ((15) & 255), ((15) & 255), ((15) & 255), ((15) & 255), ((15) & 255), ((15) & 255), ((15) & 255), ((15) & 255), ((15) & 255), ((15) & 255), ((15) & 255), ((15) & 255), ((15) & 255), ((15) & 255), ((15) & 255), ((15) & 255), ((15) & 255), ((15) & 255), ((15) & 255), ((15) & 255), ((15) & 255), ((15) & 255), ((15) & 255), ((15) & 255), ((15) & 255), ((15) & 255), ((15) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((16) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255), ((17) & 255)]);
function __cxx_static_address_259e55e8c3ea3f4f345d6ae8() {
  return __cxx_static_address_259e55e8c3ea3f4f345d6ae8.reference || (__cxx_static_address_259e55e8c3ea3f4f345d6ae8.reference = {
    __cReference: true,
    get value() { return s_tdefl_small_dist_sym; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/miniz_tdef.c:72
export const s_tdefl_small_dist_extra = new Uint8Array([((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((1) & 255), ((1) & 255), ((1) & 255), ((1) & 255), ((2) & 255), ((2) & 255), ((2) & 255), ((2) & 255), ((2) & 255), ((2) & 255), ((2) & 255), ((2) & 255), ((3) & 255), ((3) & 255), ((3) & 255), ((3) & 255), ((3) & 255), ((3) & 255), ((3) & 255), ((3) & 255), ((3) & 255), ((3) & 255), ((3) & 255), ((3) & 255), ((3) & 255), ((3) & 255), ((3) & 255), ((3) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((6) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255), ((7) & 255)]);
function __cxx_static_address_9574530d7166bd17eeec000f() {
  return __cxx_static_address_9574530d7166bd17eeec000f.reference || (__cxx_static_address_9574530d7166bd17eeec000f.reference = {
    __cReference: true,
    get value() { return s_tdefl_small_dist_extra; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/miniz_tdef.c:83
export const s_tdefl_large_dist_sym = new Uint8Array([((0) & 255), ((0) & 255), ((18) & 255), ((19) & 255), ((20) & 255), ((20) & 255), ((21) & 255), ((21) & 255), ((22) & 255), ((22) & 255), ((22) & 255), ((22) & 255), ((23) & 255), ((23) & 255), ((23) & 255), ((23) & 255), ((24) & 255), ((24) & 255), ((24) & 255), ((24) & 255), ((24) & 255), ((24) & 255), ((24) & 255), ((24) & 255), ((25) & 255), ((25) & 255), ((25) & 255), ((25) & 255), ((25) & 255), ((25) & 255), ((25) & 255), ((25) & 255), ((26) & 255), ((26) & 255), ((26) & 255), ((26) & 255), ((26) & 255), ((26) & 255), ((26) & 255), ((26) & 255), ((26) & 255), ((26) & 255), ((26) & 255), ((26) & 255), ((26) & 255), ((26) & 255), ((26) & 255), ((26) & 255), ((27) & 255), ((27) & 255), ((27) & 255), ((27) & 255), ((27) & 255), ((27) & 255), ((27) & 255), ((27) & 255), ((27) & 255), ((27) & 255), ((27) & 255), ((27) & 255), ((27) & 255), ((27) & 255), ((27) & 255), ((27) & 255), ((28) & 255), ((28) & 255), ((28) & 255), ((28) & 255), ((28) & 255), ((28) & 255), ((28) & 255), ((28) & 255), ((28) & 255), ((28) & 255), ((28) & 255), ((28) & 255), ((28) & 255), ((28) & 255), ((28) & 255), ((28) & 255), ((28) & 255), ((28) & 255), ((28) & 255), ((28) & 255), ((28) & 255), ((28) & 255), ((28) & 255), ((28) & 255), ((28) & 255), ((28) & 255), ((28) & 255), ((28) & 255), ((28) & 255), ((28) & 255), ((28) & 255), ((28) & 255), ((29) & 255), ((29) & 255), ((29) & 255), ((29) & 255), ((29) & 255), ((29) & 255), ((29) & 255), ((29) & 255), ((29) & 255), ((29) & 255), ((29) & 255), ((29) & 255), ((29) & 255), ((29) & 255), ((29) & 255), ((29) & 255), ((29) & 255), ((29) & 255), ((29) & 255), ((29) & 255), ((29) & 255), ((29) & 255), ((29) & 255), ((29) & 255), ((29) & 255), ((29) & 255), ((29) & 255), ((29) & 255), ((29) & 255), ((29) & 255), ((29) & 255), ((29) & 255)]);
function __cxx_static_address_d8447292b360f09e53301d85() {
  return __cxx_static_address_d8447292b360f09e53301d85.reference || (__cxx_static_address_d8447292b360f09e53301d85.reference = {
    __cReference: true,
    get value() { return s_tdefl_large_dist_sym; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/miniz_tdef.c:89
export const s_tdefl_large_dist_extra = new Uint8Array([((0) & 255), ((0) & 255), ((8) & 255), ((8) & 255), ((9) & 255), ((9) & 255), ((9) & 255), ((9) & 255), ((10) & 255), ((10) & 255), ((10) & 255), ((10) & 255), ((10) & 255), ((10) & 255), ((10) & 255), ((10) & 255), ((11) & 255), ((11) & 255), ((11) & 255), ((11) & 255), ((11) & 255), ((11) & 255), ((11) & 255), ((11) & 255), ((11) & 255), ((11) & 255), ((11) & 255), ((11) & 255), ((11) & 255), ((11) & 255), ((11) & 255), ((11) & 255), ((12) & 255), ((12) & 255), ((12) & 255), ((12) & 255), ((12) & 255), ((12) & 255), ((12) & 255), ((12) & 255), ((12) & 255), ((12) & 255), ((12) & 255), ((12) & 255), ((12) & 255), ((12) & 255), ((12) & 255), ((12) & 255), ((12) & 255), ((12) & 255), ((12) & 255), ((12) & 255), ((12) & 255), ((12) & 255), ((12) & 255), ((12) & 255), ((12) & 255), ((12) & 255), ((12) & 255), ((12) & 255), ((12) & 255), ((12) & 255), ((12) & 255), ((12) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255), ((13) & 255)]);
function __cxx_static_address_4e31d735243f4d111eebaf7a() {
  return __cxx_static_address_4e31d735243f4d111eebaf7a.reference || (__cxx_static_address_4e31d735243f4d111eebaf7a.reference = {
    __cReference: true,
    get value() { return s_tdefl_large_dist_extra; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/miniz_tdef.c:100
export function tdefl_radix_sort_syms(num_syms, pSyms0, pSyms1) {
  let total_passes = u32(2);
  let pass_shift;
  let pass;
  let i;
  let hist = cZeroAggregate({"array": "Uint32Array", "dims": [512]});
  let pCur_syms = pSyms0;
  let pNew_syms = pSyms1;
  cByteMemory.memset(hist, 0, 2048);
  for ((i = u32(0)); (i < num_syms); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = u32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; }))) {
    let freq = u32((cPointerElementRef(pSyms0, i).value).m_key);
    ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = u32((previous + 1)); __cxx_lvalue_2.value = next; return previous; })(cDeref(cPointerOffset(hist, u32((freq & u32(255))), Uint32Array.BYTES_PER_ELEMENT), Uint32Array));
    ((__cxx_lvalue_3) => { const previous = __cxx_lvalue_3.value; const next = u32((previous + 1)); __cxx_lvalue_3.value = next; return previous; })(cDeref(cPointerOffset(hist, u32((u32(256) + u32(((freq >>> 8) & u32(255))))), Uint32Array.BYTES_PER_ELEMENT), Uint32Array));
  }
  while (((total_passes > u32(1)) && (num_syms == (cDeref(cPointerOffset(hist, u32(Math.imul(u32((total_passes - u32(1))), u32(256))), Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value)))) {
    ((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = u32((previous - 1)); __cxx_lvalue_4.value = next; return previous; })(cRef(() => total_passes, __cxx_lvalue_5 => { total_passes = __cxx_lvalue_5; }));
  }
  for (((pass_shift = u32(0)), (pass = u32(0))); (pass < total_passes); (((__cxx_lvalue_6) => { const previous = __cxx_lvalue_6.value; const next = u32((previous + 1)); __cxx_lvalue_6.value = next; return previous; })(cRef(() => pass, __cxx_lvalue_7 => { pass = __cxx_lvalue_7; })), (pass_shift = u32((Number(pass_shift) + Number(u32(8))))))) {
    let pHist = cPointerOffset(hist, u32((pass << 8)), Uint32Array.BYTES_PER_ELEMENT);
    let offsets = cZeroAggregate({"array": "Uint32Array", "dims": [256]});
    let cur_ofs = u32(0);
    for ((i = u32(0)); (i < u32(256)); ((__cxx_lvalue_8) => { const previous = __cxx_lvalue_8.value; const next = u32((previous + 1)); __cxx_lvalue_8.value = next; return previous; })(cRef(() => i, __cxx_lvalue_9 => { i = __cxx_lvalue_9; }))) {
      ((cDeref(cPointerOffset(offsets, i, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value) = u32(cur_ofs));
      (cur_ofs = u32((Number(cur_ofs) + Number((cDeref(cPointerOffset(pHist, i, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value)))));
    }
    for ((i = u32(0)); (i < num_syms); ((__cxx_lvalue_10) => { const previous = __cxx_lvalue_10.value; const next = u32((previous + 1)); __cxx_lvalue_10.value = next; return previous; })(cRef(() => i, __cxx_lvalue_11 => { i = __cxx_lvalue_11; }))) {
      cAssignAggregate((cPointerElementRef(pNew_syms, ((__cxx_lvalue_12) => { const previous = __cxx_lvalue_12.value; const next = u32((previous + 1)); __cxx_lvalue_12.value = next; return previous; })(cDeref(cPointerOffset(offsets, i32((i32((i32((cPointerElementRef(pCur_syms, i).value).m_key) >> pass_shift)) & 255)), Uint32Array.BYTES_PER_ELEMENT), Uint32Array))).value), (cPointerElementRef(pCur_syms, i).value), {"record": {"m_key": {"scalar": "unsigned short"}, "m_sym_index": {"scalar": "unsigned short"}}});
    }
    {
      let t = pCur_syms;
      (pCur_syms = pNew_syms);
      (pNew_syms = t);
    }
  }
  return pCur_syms;
}

// C/C++ source: source/build/src/miniz_tdef.c:134
export function tdefl_calculate_minimum_redundancy(A, n) {
  let root;
  let leaf;
  let next;
  let avbl;
  let used;
  let dpth;
  if ((n == 0)) {
    return;
  } else {
    if ((n == 1)) {
      ((cPointerElementRef(A, 0).value).m_key = ((((1) & 65535)) & 65535));
      return;
    }
  }
  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = (((__cxx_lvalue_0.value + i32((cPointerElementRef(A, 1).value).m_key))) & 65535)))(cObjectFieldRef((cPointerElementRef(A, 0).value), "m_key"));
  (root = i32(0));
  (leaf = i32(2));
  for ((next = i32(1)); (next < i32((n - 1))); ((__cxx_lvalue_1) => { const previous = __cxx_lvalue_1.value; const next = i32((previous + 1)); __cxx_lvalue_1.value = next; return previous; })(cRef(() => next, __cxx_lvalue_2 => { next = __cxx_lvalue_2; }))) {
    if (((leaf >= n) || (i32((cPointerElementRef(A, root).value).m_key) < i32((cPointerElementRef(A, leaf).value).m_key)))) {
      ((cPointerElementRef(A, next).value).m_key = (((cPointerElementRef(A, root).value).m_key) & 65535));
      ((cPointerElementRef(A, ((__cxx_lvalue_3) => { const previous = __cxx_lvalue_3.value; const next = i32((previous + 1)); __cxx_lvalue_3.value = next; return previous; })(cRef(() => root, __cxx_lvalue_4 => { root = __cxx_lvalue_4; }))).value).m_key = ((((((next) & 65535)) & 65535)) & 65535));
    } else {
      ((cPointerElementRef(A, next).value).m_key = (((cPointerElementRef(A, ((__cxx_lvalue_5) => { const previous = __cxx_lvalue_5.value; const next = i32((previous + 1)); __cxx_lvalue_5.value = next; return previous; })(cRef(() => leaf, __cxx_lvalue_6 => { leaf = __cxx_lvalue_6; }))).value).m_key) & 65535));
    }
    if (((leaf >= n) || ((root < next) && (i32((cPointerElementRef(A, root).value).m_key) < i32((cPointerElementRef(A, leaf).value).m_key))))) {
      ((cPointerElementRef(A, next).value).m_key = ((((((i32((i32((cPointerElementRef(A, next).value).m_key) + i32((cPointerElementRef(A, root).value).m_key)))) & 65535)) & 65535)) & 65535));
      ((cPointerElementRef(A, ((__cxx_lvalue_7) => { const previous = __cxx_lvalue_7.value; const next = i32((previous + 1)); __cxx_lvalue_7.value = next; return previous; })(cRef(() => root, __cxx_lvalue_8 => { root = __cxx_lvalue_8; }))).value).m_key = ((((((next) & 65535)) & 65535)) & 65535));
    } else {
      ((cPointerElementRef(A, next).value).m_key = ((((((i32((i32((cPointerElementRef(A, next).value).m_key) + i32((cPointerElementRef(A, ((__cxx_lvalue_9) => { const previous = __cxx_lvalue_9.value; const next = i32((previous + 1)); __cxx_lvalue_9.value = next; return previous; })(cRef(() => leaf, __cxx_lvalue_10 => { leaf = __cxx_lvalue_10; }))).value).m_key)))) & 65535)) & 65535)) & 65535));
    }
  }
  ((cPointerElementRef(A, i32((n - 2))).value).m_key = ((((0) & 65535)) & 65535));
  for ((next = i32((n - 3))); (next >= 0); ((__cxx_lvalue_11) => { const previous = __cxx_lvalue_11.value; const next = i32((previous - 1)); __cxx_lvalue_11.value = next; return previous; })(cRef(() => next, __cxx_lvalue_12 => { next = __cxx_lvalue_12; }))) {
    ((cPointerElementRef(A, next).value).m_key = ((((i32((i32((cPointerElementRef(A, (cPointerElementRef(A, next).value).m_key).value).m_key) + 1))) & 65535)) & 65535));
  }
  (avbl = i32(1));
  (used = i32((dpth = i32(0))));
  (root = i32((n - 2)));
  (next = i32((n - 1)));
  while ((avbl > 0)) {
    while (((root >= 0) && (i32((cPointerElementRef(A, root).value).m_key) == dpth))) {
      ((__cxx_lvalue_13) => { const previous = __cxx_lvalue_13.value; const next = i32((previous + 1)); __cxx_lvalue_13.value = next; return previous; })(cRef(() => used, __cxx_lvalue_14 => { used = __cxx_lvalue_14; }));
      ((__cxx_lvalue_15) => { const previous = __cxx_lvalue_15.value; const next = i32((previous - 1)); __cxx_lvalue_15.value = next; return previous; })(cRef(() => root, __cxx_lvalue_16 => { root = __cxx_lvalue_16; }));
    }
    while ((avbl > used)) {
      ((cPointerElementRef(A, ((__cxx_lvalue_17) => { const previous = __cxx_lvalue_17.value; const next = i32((previous - 1)); __cxx_lvalue_17.value = next; return previous; })(cRef(() => next, __cxx_lvalue_18 => { next = __cxx_lvalue_18; }))).value).m_key = ((((((dpth) & 65535)) & 65535)) & 65535));
      ((__cxx_lvalue_19) => { const previous = __cxx_lvalue_19.value; const next = i32((previous - 1)); __cxx_lvalue_19.value = next; return previous; })(cRef(() => avbl, __cxx_lvalue_20 => { avbl = __cxx_lvalue_20; }));
    }
    (avbl = i32(Math.imul(2, used)));
    ((__cxx_lvalue_21) => { const previous = __cxx_lvalue_21.value; const next = i32((previous + 1)); __cxx_lvalue_21.value = next; return previous; })(cRef(() => dpth, __cxx_lvalue_22 => { dpth = __cxx_lvalue_22; }));
    (used = i32(0));
  }
}

// C/C++ source: source/build/src/miniz_tdef.c:194
export function tdefl_huffman_enforce_max_code_size(pNum_codes, code_list_len, max_code_size) {
  let i;
  let total = u32(0);
  if ((code_list_len <= 1)) {
    return;
  }
  for ((i = i32((max_code_size + 1))); (i <= i32(32)); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; }))) {
    ((__cxx_lvalue_2) => (__cxx_lvalue_2.value = i32((Number(__cxx_lvalue_2.value) + Number((cDeref(cPointerOffset(pNum_codes, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))))))(cDeref(cPointerOffset(pNum_codes, max_code_size, Int32Array.BYTES_PER_ELEMENT), Int32Array));
  }
  for ((i = i32(max_code_size)); (i > 0); ((__cxx_lvalue_3) => { const previous = __cxx_lvalue_3.value; const next = i32((previous - 1)); __cxx_lvalue_3.value = next; return previous; })(cRef(() => i, __cxx_lvalue_4 => { i = __cxx_lvalue_4; }))) {
    (total = u32((Number(total) + Number(u32((u32((cDeref(cPointerOffset(pNum_codes, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)) << i32((max_code_size - i))))))));
  }
  while ((u64(total) != (BigInt(1n) << BigInt(max_code_size)))) {
    ((__cxx_lvalue_5) => { const previous = __cxx_lvalue_5.value; const next = i32((previous - 1)); __cxx_lvalue_5.value = next; return previous; })(cDeref(cPointerOffset(pNum_codes, max_code_size, Int32Array.BYTES_PER_ELEMENT), Int32Array));
    for ((i = i32((max_code_size - 1))); (i > 0); ((__cxx_lvalue_6) => { const previous = __cxx_lvalue_6.value; const next = i32((previous - 1)); __cxx_lvalue_6.value = next; return previous; })(cRef(() => i, __cxx_lvalue_7 => { i = __cxx_lvalue_7; }))) {
      if (Boolean((cDeref(cPointerOffset(pNum_codes, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))) {
        ((__cxx_lvalue_8) => { const previous = __cxx_lvalue_8.value; const next = i32((previous - 1)); __cxx_lvalue_8.value = next; return previous; })(cDeref(cPointerOffset(pNum_codes, i, Int32Array.BYTES_PER_ELEMENT), Int32Array));
        ((__cxx_lvalue_9) => (__cxx_lvalue_9.value = i32((Number(__cxx_lvalue_9.value) + Number(2)))))(cDeref(cPointerOffset(pNum_codes, i32((i + 1)), Int32Array.BYTES_PER_ELEMENT), Int32Array));
        break;
      }
    }
    ((__cxx_lvalue_10) => { const previous = __cxx_lvalue_10.value; const next = u32((previous - 1)); __cxx_lvalue_10.value = next; return previous; })(cRef(() => total, __cxx_lvalue_11 => { total = __cxx_lvalue_11; }));
  }
}

// C/C++ source: source/build/src/miniz_tdef.c:335
export const s_tdefl_packed_code_size_syms_swizzle = new Uint8Array([((16) & 255), ((17) & 255), ((18) & 255), ((0) & 255), ((8) & 255), ((7) & 255), ((9) & 255), ((6) & 255), ((10) & 255), ((5) & 255), ((11) & 255), ((4) & 255), ((12) & 255), ((3) & 255), ((13) & 255), ((2) & 255), ((14) & 255), ((1) & 255), ((15) & 255)]);
function __cxx_static_address_5af6c05b40a900fb508d0a2c() {
  return __cxx_static_address_5af6c05b40a900fb508d0a2c.reference || (__cxx_static_address_5af6c05b40a900fb508d0a2c.reference = {
    __cReference: true,
    get value() { return s_tdefl_packed_code_size_syms_swizzle; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/miniz_tdef.c:446
export const mz_bitmasks = new Uint32Array([u32(0), u32(1), u32(3), u32(7), u32(15), u32(31), u32(63), u32(127), u32(255), u32(511), u32(1023), u32(2047), u32(4095), u32(8191), u32(16383), u32(32767), u32(65535)]);
function __cxx_static_address_87aa0b7b4716ecf221c44d1f() {
  return __cxx_static_address_87aa0b7b4716ecf221c44d1f.reference || (__cxx_static_address_87aa0b7b4716ecf221c44d1f.reference = {
    __cReference: true,
    get value() { return mz_bitmasks; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/miniz_tdef.c:544
export function tdefl_compress_lz_codes(d) {
  let flags;
  let pLZ_codes;
  (flags = u32(1));
  for ((pLZ_codes = (d).value.m_lz_code_buf); cPointerCompare(pLZ_codes, (d).value.m_pLZ_code_buf, "<"); (flags = u32((flags >> 1)))) {
    if ((flags == u32(1))) {
      (flags = u32(i32((i32((cDeref(((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_0.value = next; return previous; })(cRef(() => pLZ_codes, __cxx_lvalue_1 => { pLZ_codes = __cxx_lvalue_1; })), Uint8Array).value)) | 256))));
    }
    if (Boolean(u32((flags & u32(1))))) {
      let sym;
      let num_extra_bits;
      let match_len = u32((cDeref(cPointerOffset(pLZ_codes, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value));
      let match_dist = u32(i32((i32((cDeref(cPointerOffset(pLZ_codes, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) | i32((i32((cDeref(cPointerOffset(pLZ_codes, 2, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) << 8)))));
      (pLZ_codes = cPointerOffset(pLZ_codes, 3, Uint8Array.BYTES_PER_ELEMENT));
      0;
      do {
        let bits = u32((cPointerElementRef((d).value.m_huff_codes, 0).value)[(cDeref(cPointerOffset(s_tdefl_len_sym, match_len, Uint16Array.BYTES_PER_ELEMENT), Uint16Array).value)]);
        let len = u32((cPointerElementRef((d).value.m_huff_code_sizes, 0).value)[(cDeref(cPointerOffset(s_tdefl_len_sym, match_len, Uint16Array.BYTES_PER_ELEMENT), Uint16Array).value)]);
        0;
        ((__cxx_lvalue_2) => (__cxx_lvalue_2.value = u32((__cxx_lvalue_2.value | u32((bits << (d).value.m_bits_in))))))(cObjectFieldRef((d).value, "m_bit_buffer"));
        ((__cxx_lvalue_3) => (__cxx_lvalue_3.value = u32((Number(__cxx_lvalue_3.value) + Number(len)))))(cObjectFieldRef((d).value, "m_bits_in"));
        while (((d).value.m_bits_in >= u32(8))) {
          if (cPointerCompare((d).value.m_pOutput_buf, (d).value.m_pOutput_buf_end, "<")) {
            ((cDeref(((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_4.value = next; return previous; })(cObjectFieldRef((d).value, "m_pOutput_buf")), Uint8Array).value) = (((((((d).value.m_bit_buffer) & 255)) & 255)) & 255));
          }
          ((__cxx_lvalue_5) => (__cxx_lvalue_5.value = u32((__cxx_lvalue_5.value >> 8))))(cObjectFieldRef((d).value, "m_bit_buffer"));
          ((__cxx_lvalue_6) => (__cxx_lvalue_6.value = u32((Number(__cxx_lvalue_6.value) - Number(u32(8))))))(cObjectFieldRef((d).value, "m_bits_in"));
        }
      } while (Boolean(0));
      do {
        let bits = u32((match_len & (cDeref(cPointerOffset(mz_bitmasks, (cDeref(cPointerOffset(s_tdefl_len_extra, match_len, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value), Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value)));
        let len = u32((cDeref(cPointerOffset(s_tdefl_len_extra, match_len, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value));
        0;
        ((__cxx_lvalue_7) => (__cxx_lvalue_7.value = u32((__cxx_lvalue_7.value | u32((bits << (d).value.m_bits_in))))))(cObjectFieldRef((d).value, "m_bit_buffer"));
        ((__cxx_lvalue_8) => (__cxx_lvalue_8.value = u32((Number(__cxx_lvalue_8.value) + Number(len)))))(cObjectFieldRef((d).value, "m_bits_in"));
        while (((d).value.m_bits_in >= u32(8))) {
          if (cPointerCompare((d).value.m_pOutput_buf, (d).value.m_pOutput_buf_end, "<")) {
            ((cDeref(((__cxx_lvalue_9) => { const previous = __cxx_lvalue_9.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_9.value = next; return previous; })(cObjectFieldRef((d).value, "m_pOutput_buf")), Uint8Array).value) = (((((((d).value.m_bit_buffer) & 255)) & 255)) & 255));
          }
          ((__cxx_lvalue_10) => (__cxx_lvalue_10.value = u32((__cxx_lvalue_10.value >> 8))))(cObjectFieldRef((d).value, "m_bit_buffer"));
          ((__cxx_lvalue_11) => (__cxx_lvalue_11.value = u32((Number(__cxx_lvalue_11.value) - Number(u32(8))))))(cObjectFieldRef((d).value, "m_bits_in"));
        }
      } while (Boolean(0));
      if ((match_dist < u32(512))) {
        (sym = u32((cDeref(cPointerOffset(s_tdefl_small_dist_sym, match_dist, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)));
        (num_extra_bits = u32((cDeref(cPointerOffset(s_tdefl_small_dist_extra, match_dist, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)));
      } else {
        (sym = u32((cDeref(cPointerOffset(s_tdefl_large_dist_sym, (match_dist >>> 8), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)));
        (num_extra_bits = u32((cDeref(cPointerOffset(s_tdefl_large_dist_extra, (match_dist >>> 8), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)));
      }
      0;
      do {
        let bits = u32((cPointerElementRef((d).value.m_huff_codes, 1).value)[sym]);
        let len = u32((cPointerElementRef((d).value.m_huff_code_sizes, 1).value)[sym]);
        0;
        ((__cxx_lvalue_12) => (__cxx_lvalue_12.value = u32((__cxx_lvalue_12.value | u32((bits << (d).value.m_bits_in))))))(cObjectFieldRef((d).value, "m_bit_buffer"));
        ((__cxx_lvalue_13) => (__cxx_lvalue_13.value = u32((Number(__cxx_lvalue_13.value) + Number(len)))))(cObjectFieldRef((d).value, "m_bits_in"));
        while (((d).value.m_bits_in >= u32(8))) {
          if (cPointerCompare((d).value.m_pOutput_buf, (d).value.m_pOutput_buf_end, "<")) {
            ((cDeref(((__cxx_lvalue_14) => { const previous = __cxx_lvalue_14.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_14.value = next; return previous; })(cObjectFieldRef((d).value, "m_pOutput_buf")), Uint8Array).value) = (((((((d).value.m_bit_buffer) & 255)) & 255)) & 255));
          }
          ((__cxx_lvalue_15) => (__cxx_lvalue_15.value = u32((__cxx_lvalue_15.value >> 8))))(cObjectFieldRef((d).value, "m_bit_buffer"));
          ((__cxx_lvalue_16) => (__cxx_lvalue_16.value = u32((Number(__cxx_lvalue_16.value) - Number(u32(8))))))(cObjectFieldRef((d).value, "m_bits_in"));
        }
      } while (Boolean(0));
      do {
        let bits = u32((match_dist & (cDeref(cPointerOffset(mz_bitmasks, num_extra_bits, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value)));
        let len = u32(num_extra_bits);
        0;
        ((__cxx_lvalue_17) => (__cxx_lvalue_17.value = u32((__cxx_lvalue_17.value | u32((bits << (d).value.m_bits_in))))))(cObjectFieldRef((d).value, "m_bit_buffer"));
        ((__cxx_lvalue_18) => (__cxx_lvalue_18.value = u32((Number(__cxx_lvalue_18.value) + Number(len)))))(cObjectFieldRef((d).value, "m_bits_in"));
        while (((d).value.m_bits_in >= u32(8))) {
          if (cPointerCompare((d).value.m_pOutput_buf, (d).value.m_pOutput_buf_end, "<")) {
            ((cDeref(((__cxx_lvalue_19) => { const previous = __cxx_lvalue_19.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_19.value = next; return previous; })(cObjectFieldRef((d).value, "m_pOutput_buf")), Uint8Array).value) = (((((((d).value.m_bit_buffer) & 255)) & 255)) & 255));
          }
          ((__cxx_lvalue_20) => (__cxx_lvalue_20.value = u32((__cxx_lvalue_20.value >> 8))))(cObjectFieldRef((d).value, "m_bit_buffer"));
          ((__cxx_lvalue_21) => (__cxx_lvalue_21.value = u32((Number(__cxx_lvalue_21.value) - Number(u32(8))))))(cObjectFieldRef((d).value, "m_bits_in"));
        }
      } while (Boolean(0));
    } else {
      let lit = u32((cDeref(((__cxx_lvalue_22) => { const previous = __cxx_lvalue_22.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_22.value = next; return previous; })(cRef(() => pLZ_codes, __cxx_lvalue_23 => { pLZ_codes = __cxx_lvalue_23; })), Uint8Array).value));
      0;
      do {
        let bits = u32((cPointerElementRef((d).value.m_huff_codes, 0).value)[lit]);
        let len = u32((cPointerElementRef((d).value.m_huff_code_sizes, 0).value)[lit]);
        0;
        ((__cxx_lvalue_24) => (__cxx_lvalue_24.value = u32((__cxx_lvalue_24.value | u32((bits << (d).value.m_bits_in))))))(cObjectFieldRef((d).value, "m_bit_buffer"));
        ((__cxx_lvalue_25) => (__cxx_lvalue_25.value = u32((Number(__cxx_lvalue_25.value) + Number(len)))))(cObjectFieldRef((d).value, "m_bits_in"));
        while (((d).value.m_bits_in >= u32(8))) {
          if (cPointerCompare((d).value.m_pOutput_buf, (d).value.m_pOutput_buf_end, "<")) {
            ((cDeref(((__cxx_lvalue_26) => { const previous = __cxx_lvalue_26.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_26.value = next; return previous; })(cObjectFieldRef((d).value, "m_pOutput_buf")), Uint8Array).value) = (((((((d).value.m_bit_buffer) & 255)) & 255)) & 255));
          }
          ((__cxx_lvalue_27) => (__cxx_lvalue_27.value = u32((__cxx_lvalue_27.value >> 8))))(cObjectFieldRef((d).value, "m_bit_buffer"));
          ((__cxx_lvalue_28) => (__cxx_lvalue_28.value = u32((Number(__cxx_lvalue_28.value) - Number(u32(8))))))(cObjectFieldRef((d).value, "m_bits_in"));
        }
      } while (Boolean(0));
    }
  }
  do {
    let bits = u32((cPointerElementRef((d).value.m_huff_codes, 0).value)[256]);
    let len = u32((cPointerElementRef((d).value.m_huff_code_sizes, 0).value)[256]);
    0;
    ((__cxx_lvalue_29) => (__cxx_lvalue_29.value = u32((__cxx_lvalue_29.value | u32((bits << (d).value.m_bits_in))))))(cObjectFieldRef((d).value, "m_bit_buffer"));
    ((__cxx_lvalue_30) => (__cxx_lvalue_30.value = u32((Number(__cxx_lvalue_30.value) + Number(len)))))(cObjectFieldRef((d).value, "m_bits_in"));
    while (((d).value.m_bits_in >= u32(8))) {
      if (cPointerCompare((d).value.m_pOutput_buf, (d).value.m_pOutput_buf_end, "<")) {
        ((cDeref(((__cxx_lvalue_31) => { const previous = __cxx_lvalue_31.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_31.value = next; return previous; })(cObjectFieldRef((d).value, "m_pOutput_buf")), Uint8Array).value) = (((((((d).value.m_bit_buffer) & 255)) & 255)) & 255));
      }
      ((__cxx_lvalue_32) => (__cxx_lvalue_32.value = u32((__cxx_lvalue_32.value >> 8))))(cObjectFieldRef((d).value, "m_bit_buffer"));
      ((__cxx_lvalue_33) => (__cxx_lvalue_33.value = u32((Number(__cxx_lvalue_33.value) - Number(u32(8))))))(cObjectFieldRef((d).value, "m_bits_in"));
    }
  } while (Boolean(0));
  return i32(cPointerCompare((d).value.m_pOutput_buf, (d).value.m_pOutput_buf_end, "<"));
}

// C/C++ source: source/build/src/miniz_tdef.c:601
export const s_tdefl_num_probes = new Uint32Array([u32(0), u32(1), u32(6), u32(32), u32(16), u32(32), u32(128), u32(256), u32(512), u32(768), u32(1500)]);
function __cxx_static_address_c9d5210617359eac68475b22() {
  return __cxx_static_address_c9d5210617359eac68475b22.reference || (__cxx_static_address_c9d5210617359eac68475b22.reference = {
    __cReference: true,
    get value() { return s_tdefl_num_probes; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/miniz_tdef.c:829
export function tdefl_find_match(d, lookahead_pos, max_dist, max_match_len, pMatch_dist, pMatch_len) {
  let dist;
  let pos = u32((lookahead_pos & u32(32767)));
  let match_len = u32((cDeref(pMatch_len, Uint32Array).value));
  let probe_pos = u32(pos);
  let next_probe_pos;
  let probe_len;
  let num_probes_left = u32((cDeref(cPointerOffset((d).value.m_max_probes, (match_len >= u32(32)), Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value));
  let s = cPointerOffset((d).value.m_dict, pos, Uint8Array.BYTES_PER_ELEMENT);
  let p;
  let q;
  let c0 = (((cDeref(cPointerOffset((d).value.m_dict, u32((pos + match_len)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255);
  let c1 = (((cDeref(cPointerOffset((d).value.m_dict, u32((u32((pos + match_len)) - u32(1))), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255);
  0;
  if ((max_match_len <= match_len)) {
    return;
  }
  for (; ; ) {
    for (; ; ) {
      if ((((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = u32((previous - 1)); __cxx_lvalue_0.value = next; return next; })(cRef(() => num_probes_left, __cxx_lvalue_1 => { num_probes_left = __cxx_lvalue_1; })) == u32(0))) {
        return;
      }
      (next_probe_pos = u32((cDeref(cPointerOffset((d).value.m_next, probe_pos, Uint16Array.BYTES_PER_ELEMENT), Uint16Array).value)));
      if (((!Boolean(next_probe_pos)) || ((dist = u32(((((u32((lookahead_pos - next_probe_pos))) & 65535)) & 65535))) > max_dist))) {
        return;
      }
      (probe_pos = u32((next_probe_pos & u32(32767))));
      if (((i32((cDeref(cPointerOffset((d).value.m_dict, u32((probe_pos + match_len)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == i32(c0)) && (i32((cDeref(cPointerOffset((d).value.m_dict, u32((u32((probe_pos + match_len)) - u32(1))), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == i32(c1)))) {
        break;
      }
      ;
      (next_probe_pos = u32((cDeref(cPointerOffset((d).value.m_next, probe_pos, Uint16Array.BYTES_PER_ELEMENT), Uint16Array).value)));
      if (((!Boolean(next_probe_pos)) || ((dist = u32(((((u32((lookahead_pos - next_probe_pos))) & 65535)) & 65535))) > max_dist))) {
        return;
      }
      (probe_pos = u32((next_probe_pos & u32(32767))));
      if (((i32((cDeref(cPointerOffset((d).value.m_dict, u32((probe_pos + match_len)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == i32(c0)) && (i32((cDeref(cPointerOffset((d).value.m_dict, u32((u32((probe_pos + match_len)) - u32(1))), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == i32(c1)))) {
        break;
      }
      ;
      (next_probe_pos = u32((cDeref(cPointerOffset((d).value.m_next, probe_pos, Uint16Array.BYTES_PER_ELEMENT), Uint16Array).value)));
      if (((!Boolean(next_probe_pos)) || ((dist = u32(((((u32((lookahead_pos - next_probe_pos))) & 65535)) & 65535))) > max_dist))) {
        return;
      }
      (probe_pos = u32((next_probe_pos & u32(32767))));
      if (((i32((cDeref(cPointerOffset((d).value.m_dict, u32((probe_pos + match_len)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == i32(c0)) && (i32((cDeref(cPointerOffset((d).value.m_dict, u32((u32((probe_pos + match_len)) - u32(1))), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == i32(c1)))) {
        break;
      }
      ;
    }
    if ((!Boolean(dist))) {
      break;
    }
    (p = s);
    (q = cPointerOffset((d).value.m_dict, probe_pos, Uint8Array.BYTES_PER_ELEMENT));
    for ((probe_len = u32(0)); (probe_len < max_match_len); ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = u32((previous + 1)); __cxx_lvalue_2.value = next; return previous; })(cRef(() => probe_len, __cxx_lvalue_3 => { probe_len = __cxx_lvalue_3; }))) {
      if ((i32((cDeref(((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_4.value = next; return previous; })(cRef(() => p, __cxx_lvalue_5 => { p = __cxx_lvalue_5; })), Uint8Array).value)) != i32((cDeref(((__cxx_lvalue_6) => { const previous = __cxx_lvalue_6.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_6.value = next; return previous; })(cRef(() => q, __cxx_lvalue_7 => { q = __cxx_lvalue_7; })), Uint8Array).value)))) {
        break;
      }
    }
    if ((probe_len > match_len)) {
      ((cDeref(pMatch_dist, Uint32Array).value) = u32(dist));
      if ((((cDeref(pMatch_len, Uint32Array).value) = u32((match_len = u32(probe_len)))) == max_match_len)) {
        return;
      }
      (c0 = (((cDeref(cPointerOffset((d).value.m_dict, u32((pos + match_len)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
      (c1 = (((cDeref(cPointerOffset((d).value.m_dict, u32((u32((pos + match_len)) - u32(1))), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
    }
  }
}

// C/C++ source: source/build/src/miniz_tdef.c:1059
export function tdefl_record_literal(d, lit) {
  ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = u32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cObjectFieldRef((d).value, "m_total_lz_bytes"));
  ((cDeref(((__cxx_lvalue_1) => { const previous = __cxx_lvalue_1.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_1.value = next; return previous; })(cObjectFieldRef((d).value, "m_pLZ_code_buf")), Uint8Array).value) = ((lit) & 255));
  ((cDeref((d).value.m_pLZ_flags, Uint8Array).value) = ((((((i32((i32((cDeref((d).value.m_pLZ_flags, Uint8Array).value)) >> 1))) & 255)) & 255)) & 255));
  if ((((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = u32((previous - 1)); __cxx_lvalue_2.value = next; return next; })(cObjectFieldRef((d).value, "m_num_flags_left")) == u32(0))) {
    ((d).value.m_num_flags_left = u32(8));
    ((d).value.m_pLZ_flags = ((__cxx_lvalue_3) => { const previous = __cxx_lvalue_3.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_3.value = next; return previous; })(cObjectFieldRef((d).value, "m_pLZ_code_buf")));
  }
  ((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = (((previous + 1)) & 65535); __cxx_lvalue_4.value = next; return previous; })(cArrayRef((cPointerElementRef((d).value.m_huff_count, 0).value), lit));
}

// C/C++ source: source/build/src/miniz_tdef.c:1072
export function tdefl_record_match(d, match_len, match_dist) {
  let s0;
  let s1;
  0;
  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = u32((Number(__cxx_lvalue_0.value) + Number(match_len)))))(cObjectFieldRef((d).value, "m_total_lz_bytes"));
  ((cDeref(cPointerOffset((d).value.m_pLZ_code_buf, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = ((((((u32((match_len - u32(3)))) & 255)) & 255)) & 255));
  (match_dist = u32((Number(match_dist) - Number(u32(1)))));
  ((cDeref(cPointerOffset((d).value.m_pLZ_code_buf, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = ((((((u32((match_dist & u32(255)))) & 255)) & 255)) & 255));
  ((cDeref(cPointerOffset((d).value.m_pLZ_code_buf, 2, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (((((((match_dist >>> 8)) & 255)) & 255)) & 255));
  ((__cxx_lvalue_1) => (__cxx_lvalue_1.value = cPointerOffset(__cxx_lvalue_1.value, 3, Uint8Array.BYTES_PER_ELEMENT)))(cObjectFieldRef((d).value, "m_pLZ_code_buf"));
  ((cDeref((d).value.m_pLZ_flags, Uint8Array).value) = ((((((i32((i32((i32((cDeref((d).value.m_pLZ_flags, Uint8Array).value)) >> 1)) | 128))) & 255)) & 255)) & 255));
  if ((((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = u32((previous - 1)); __cxx_lvalue_2.value = next; return next; })(cObjectFieldRef((d).value, "m_num_flags_left")) == u32(0))) {
    ((d).value.m_num_flags_left = u32(8));
    ((d).value.m_pLZ_flags = ((__cxx_lvalue_3) => { const previous = __cxx_lvalue_3.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_3.value = next; return previous; })(cObjectFieldRef((d).value, "m_pLZ_code_buf")));
  }
  (s0 = u32((cDeref(cPointerOffset(s_tdefl_small_dist_sym, u32((match_dist & u32(511))), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)));
  (s1 = u32((cDeref(cPointerOffset(s_tdefl_large_dist_sym, u32(((match_dist >>> 8) & u32(127))), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)));
  ((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = (((previous + 1)) & 65535); __cxx_lvalue_4.value = next; return previous; })(cArrayRef((cPointerElementRef((d).value.m_huff_count, 1).value), ((match_dist < u32(512)) ? s0 : s1)));
  ((__cxx_lvalue_5) => { const previous = __cxx_lvalue_5.value; const next = (((previous + 1)) & 65535); __cxx_lvalue_5.value = next; return previous; })(cArrayRef((cPointerElementRef((d).value.m_huff_count, 0).value), (cDeref(cPointerOffset(s_tdefl_len_sym, u32((match_len - u32(3))), Uint16Array.BYTES_PER_ELEMENT), Uint16Array).value)));
}

// C/C++ source: source/build/src/miniz_tdef.c:1245
export function tdefl_flush_output_buffer(d) {
  if ((d).value.m_pIn_buf_size) {
    ((cDeref((d).value.m_pIn_buf_size, BigUint64Array).value) = u64(cPointerDiff((d).value.m_pSrc, cTypedPointer((d).value.m_pIn_buf, Uint8Array), Uint8Array.BYTES_PER_ELEMENT)));
  }
  if ((d).value.m_pOut_buf_size) {
    let n = u64((((BigInt((cDeref((d).value.m_pOut_buf_size, BigUint64Array).value)) - BigInt((d).value.m_out_buf_ofs)) < u64((d).value.m_output_flush_remaining)) ? (BigInt((cDeref((d).value.m_pOut_buf_size, BigUint64Array).value)) - BigInt((d).value.m_out_buf_ofs)) : u64((d).value.m_output_flush_remaining)));
    cByteMemory.memcpy(cPointerOffset(cTypedPointer((d).value.m_pOut_buf, Uint8Array), (d).value.m_out_buf_ofs, Uint8Array.BYTES_PER_ELEMENT), cPointerOffset((d).value.m_output_buf, (d).value.m_output_flush_ofs, Uint8Array.BYTES_PER_ELEMENT), n);
    ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = u32((Number(__cxx_lvalue_0.value) + Number(u32(n))))))(cObjectFieldRef((d).value, "m_output_flush_ofs"));
    ((__cxx_lvalue_1) => (__cxx_lvalue_1.value = u32((Number(__cxx_lvalue_1.value) - Number(u32(n))))))(cObjectFieldRef((d).value, "m_output_flush_remaining"));
    ((__cxx_lvalue_2) => (__cxx_lvalue_2.value = u64((BigInt(__cxx_lvalue_2.value) + BigInt(n)))))(cObjectFieldRef((d).value, "m_out_buf_ofs"));
    ((cDeref((d).value.m_pOut_buf_size, BigUint64Array).value) = u64((d).value.m_out_buf_ofs));
  }
  return ((Boolean((d).value.m_finished) && (!Boolean((d).value.m_output_flush_remaining))) ? 1 : 0);
}

// C/C++ source: source/build/src/miniz_tdef.c:1340
export function tdefl_init(d, pPut_buf_func, pPut_buf_user, flags) {
  ((d).value.m_pPut_buf_func = pPut_buf_func);
  ((d).value.m_pPut_buf_user = pPut_buf_user);
  ((d).value.m_flags = u32(flags));
  ((cDeref(cPointerOffset((d).value.m_max_probes, 0, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value) = u32(i32((1 + Math.trunc(i32((i32((flags & 4095)) + 2)) / 3)))));
  ((d).value.m_greedy_parsing = i32((i32((flags & i32(16384))) != 0)));
  ((cDeref(cPointerOffset((d).value.m_max_probes, 1, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value) = u32(i32((1 + Math.trunc(i32((i32((i32((flags & 4095)) >> 2)) + 2)) / 3)))));
  if ((!Boolean(i32((flags & i32(32768)))))) {
    cByteMemory.memset((d).value.m_hash, 0, 65536);
  }
  ((d).value.m_lookahead_pos = u32(((d).value.m_lookahead_size = u32(((d).value.m_dict_size = u32(((d).value.m_total_lz_bytes = u32(((d).value.m_lz_code_buf_dict_pos = u32(((d).value.m_bits_in = u32(0))))))))))));
  ((d).value.m_output_flush_ofs = u32(((d).value.m_output_flush_remaining = u32(((d).value.m_finished = u32(((d).value.m_block_index = u32(((d).value.m_bit_buffer = u32(((d).value.m_wants_to_finish = u32(0))))))))))));
  ((d).value.m_pLZ_code_buf = cPointerOffset((d).value.m_lz_code_buf, 1, Uint8Array.BYTES_PER_ELEMENT));
  ((d).value.m_pLZ_flags = (d).value.m_lz_code_buf);
  ((cDeref((d).value.m_pLZ_flags, Uint8Array).value) = ((((0) & 255)) & 255));
  ((d).value.m_num_flags_left = u32(8));
  ((d).value.m_pOutput_buf = (d).value.m_output_buf);
  ((d).value.m_pOutput_buf_end = (d).value.m_output_buf);
  ((d).value.m_prev_return_status = 0);
  ((d).value.m_saved_match_dist = u32(((d).value.m_saved_match_len = u32(((d).value.m_saved_lit = u32(0))))));
  ((d).value.m_adler32 = u32(1));
  ((d).value.m_pIn_buf = null);
  ((d).value.m_pOut_buf = null);
  ((d).value.m_pIn_buf_size = null);
  ((d).value.m_pOut_buf_size = null);
  ((d).value.m_flush = 0);
  ((d).value.m_pSrc = null);
  ((d).value.m_src_buf_left = u64(0));
  ((d).value.m_out_buf_ofs = u64(0));
  if ((!Boolean(i32((flags & i32(32768)))))) {
    cByteMemory.memset((d).value.m_dict, 0, 33025);
  }
  cByteMemory.memset(cPointerOffset((cPointerElementRef((d).value.m_huff_count, 0).value), 0, Uint16Array.BYTES_PER_ELEMENT), 0, (BigInt(2) * BigInt(u64(288))));
  cByteMemory.memset(cPointerOffset((cPointerElementRef((d).value.m_huff_count, 1).value), 0, Uint16Array.BYTES_PER_ELEMENT), 0, (BigInt(2) * BigInt(u64(32))));
  return 0;
}

// C/C++ source: source/build/src/miniz_tdef.c:1376
export function tdefl_get_prev_return_status(d) {
  return (d).value.m_prev_return_status;
}

// C/C++ source: source/build/src/miniz_tdef.c:1381
export function tdefl_get_adler32(d) {
  return (d).value.m_adler32;
}

// C/C++ source: source/build/src/miniz_tdef.c:1462
export function tdefl_create_comp_flags_from_zip_params(level, window_bits, strategy) {
  let comp_flags = u32(((cDeref(cPointerOffset(s_tdefl_num_probes, ((level >= 0) ? ((10 < level) ? 10 : level) : i32(6)), Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value) | u32(((level <= 3) ? i32(16384) : 0))));
  if ((window_bits > 0)) {
    (comp_flags = u32((comp_flags | u32(4096))));
  }
  if ((!Boolean(level))) {
    (comp_flags = u32((comp_flags | u32(524288))));
  } else {
    if ((strategy == i32(1))) {
      (comp_flags = u32((comp_flags | u32(131072))));
    } else {
      if ((strategy == i32(2))) {
        (comp_flags = u32((comp_flags & u32((~i32(4095))))));
      } else {
        if ((strategy == i32(4))) {
          (comp_flags = u32((comp_flags | u32(262144))));
        } else {
          if ((strategy == i32(3))) {
            (comp_flags = u32((comp_flags | u32(65536))));
          }
        }
      }
    }
  }
  return comp_flags;
}

// C/C++ source: source/build/include/compat.h:1169
export const pow2char__header_global_d393ecb508ea69b4 = new Uint8Array([((1) & 255), ((2) & 255), ((4) & 255), ((8) & 255), ((16) & 255), ((32) & 255), ((64) & 255), ((128) & 255)]);
function __cxx_static_address_e3eee2a041744eccc40151a6() {
  return __cxx_static_address_e3eee2a041744eccc40151a6.reference || (__cxx_static_address_e3eee2a041744eccc40151a6.reference = {
    __cReference: true,
    get value() { return pow2char__header_global_d393ecb508ea69b4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/smmalloc.h:859
export function _sm_malloc(allocator, bytesCount, alignment) {
  return cRecordObject(allocator).Alloc(bytesCount, alignment);
}

// C/C++ source: source/build/include/smmalloc.h:864
export function _sm_free(allocator, p) {
  return cRecordObject(allocator).Free(p);
}

// C/C++ source: source/build/include/smmalloc.h:866
export function _sm_realloc(allocator, p, bytesCount, alignment) {
  return cRecordObject(allocator).Realloc(p, bytesCount, alignment);
}
