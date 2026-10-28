// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/duke3d/src/rts.cpp
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
export const fix16_rad_to_deg_mult__header_global_d6a628e355b2f663 = i32(3754936);
function __cxx_static_address_ed5df438da09452496de8abc() {
  return __cxx_static_address_ed5df438da09452496de8abc.reference || (__cxx_static_address_ed5df438da09452496de8abc.reference = {
    __cReference: true,
    get value() { return fix16_rad_to_deg_mult__header_global_d6a628e355b2f663; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:114
export const fix16_deg_to_rad_mult__header_global_cff30350ffda28f2 = i32(1144);
function __cxx_static_address_c4abafa4ff395c05a3ee3d82() {
  return __cxx_static_address_c4abafa4ff395c05a3ee3d82.reference || (__cxx_static_address_c4abafa4ff395c05a3ee3d82.reference = {
    __cReference: true,
    get value() { return fix16_deg_to_rad_mult__header_global_cff30350ffda28f2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:43
export const KICK_HIT____header_global_a1a057b5ca78699e = ((((((0) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_812d11609828dfce673c1472() {
  return __cxx_static_address_812d11609828dfce673c1472.reference || (__cxx_static_address_812d11609828dfce673c1472.reference = {
    __cReference: true,
    get value() { return KICK_HIT____header_global_a1a057b5ca78699e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:44
export const PISTOL_RICOCHET____header_global_d149d55435a7f5f2 = ((((((1) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b66e07665f47c2a1ab219675() {
  return __cxx_static_address_b66e07665f47c2a1ab219675.reference || (__cxx_static_address_b66e07665f47c2a1ab219675.reference = {
    __cReference: true,
    get value() { return PISTOL_RICOCHET____header_global_d149d55435a7f5f2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:45
export const PISTOL_BODYHIT____header_global_80bec5223cbf5b91 = ((((((2) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d9bebe0ee9332e9af86fe475() {
  return __cxx_static_address_d9bebe0ee9332e9af86fe475.reference || (__cxx_static_address_d9bebe0ee9332e9af86fe475.reference = {
    __cReference: true,
    get value() { return PISTOL_BODYHIT____header_global_80bec5223cbf5b91; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:46
export const PISTOL_FIRE____header_global_5d8a46f2731754a7 = ((((((3) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_caeedbd45e71c783b815210c() {
  return __cxx_static_address_caeedbd45e71c783b815210c.reference || (__cxx_static_address_caeedbd45e71c783b815210c.reference = {
    __cReference: true,
    get value() { return PISTOL_FIRE____header_global_5d8a46f2731754a7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:47
export const EJECT_CLIP____header_global_0c9ffaeebf0ab2c9 = ((((((4) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6e2ed87324eea557807c46aa() {
  return __cxx_static_address_6e2ed87324eea557807c46aa.reference || (__cxx_static_address_6e2ed87324eea557807c46aa.reference = {
    __cReference: true,
    get value() { return EJECT_CLIP____header_global_0c9ffaeebf0ab2c9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:48
export const INSERT_CLIP____header_global_f83ab73bddacd412 = ((((((5) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_62db897ac2515ef11bee70fb() {
  return __cxx_static_address_62db897ac2515ef11bee70fb.reference || (__cxx_static_address_62db897ac2515ef11bee70fb.reference = {
    __cReference: true,
    get value() { return INSERT_CLIP____header_global_f83ab73bddacd412; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:49
export const CHAINGUN_FIRE____header_global_325cecb695d4b9b3 = ((((((6) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_085144d87ff3603acbf173dd() {
  return __cxx_static_address_085144d87ff3603acbf173dd.reference || (__cxx_static_address_085144d87ff3603acbf173dd.reference = {
    __cReference: true,
    get value() { return CHAINGUN_FIRE____header_global_325cecb695d4b9b3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:50
export const RPG_SHOOT____header_global_c67e4a9c51919b53 = ((((((7) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_83ac5af6d81c31627a82167e() {
  return __cxx_static_address_83ac5af6d81c31627a82167e.reference || (__cxx_static_address_83ac5af6d81c31627a82167e.reference = {
    __cReference: true,
    get value() { return RPG_SHOOT____header_global_c67e4a9c51919b53; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:51
export const POOLBALLHIT____header_global_6dcd81cbb3d9c9cb = ((((((8) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8341df0b9fd2e55218b35a86() {
  return __cxx_static_address_8341df0b9fd2e55218b35a86.reference || (__cxx_static_address_8341df0b9fd2e55218b35a86.reference = {
    __cReference: true,
    get value() { return POOLBALLHIT____header_global_6dcd81cbb3d9c9cb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:52
export const RPG_EXPLODE____header_global_aef5af5c0b92f962 = ((((((9) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_865184d6d477bb05bb7e74d6() {
  return __cxx_static_address_865184d6d477bb05bb7e74d6.reference || (__cxx_static_address_865184d6d477bb05bb7e74d6.reference = {
    __cReference: true,
    get value() { return RPG_EXPLODE____header_global_aef5af5c0b92f962; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:53
export const CAT_FIRE____header_global_0803dc6aa0101fe2 = ((((((10) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c0222f53de35f0e5d69595dd() {
  return __cxx_static_address_c0222f53de35f0e5d69595dd.reference || (__cxx_static_address_c0222f53de35f0e5d69595dd.reference = {
    __cReference: true,
    get value() { return CAT_FIRE____header_global_0803dc6aa0101fe2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:54
export const SHRINKER_FIRE____header_global_e070832cf6a1df65 = ((((((11) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bc9a5f2163fbc921c83dbfb5() {
  return __cxx_static_address_bc9a5f2163fbc921c83dbfb5.reference || (__cxx_static_address_bc9a5f2163fbc921c83dbfb5.reference = {
    __cReference: true,
    get value() { return SHRINKER_FIRE____header_global_e070832cf6a1df65; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:55
export const PIPEBOMB_BOUNCE____header_global_403312829503240b = ((((((13) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7513dbd2539bb037c786a506() {
  return __cxx_static_address_7513dbd2539bb037c786a506.reference || (__cxx_static_address_7513dbd2539bb037c786a506.reference = {
    __cReference: true,
    get value() { return PIPEBOMB_BOUNCE____header_global_403312829503240b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:56
export const PIPEBOMB_EXPLODE____header_global_38932debc7ecd160 = ((((((14) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a3483e8549e1edc500f361c2() {
  return __cxx_static_address_a3483e8549e1edc500f361c2.reference || (__cxx_static_address_a3483e8549e1edc500f361c2.reference = {
    __cReference: true,
    get value() { return PIPEBOMB_EXPLODE____header_global_38932debc7ecd160; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:57
export const LASERTRIP_ONWALL____header_global_fda57e594e923ba1 = ((((((15) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_236ec6040d83b2ad4167a293() {
  return __cxx_static_address_236ec6040d83b2ad4167a293.reference || (__cxx_static_address_236ec6040d83b2ad4167a293.reference = {
    __cReference: true,
    get value() { return LASERTRIP_ONWALL____header_global_fda57e594e923ba1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:58
export const LASERTRIP_ARMING____header_global_27a8b814dc28fc76 = ((((((16) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6f9b746daf7b8c964b80a66e() {
  return __cxx_static_address_6f9b746daf7b8c964b80a66e.reference || (__cxx_static_address_6f9b746daf7b8c964b80a66e.reference = {
    __cReference: true,
    get value() { return LASERTRIP_ARMING____header_global_27a8b814dc28fc76; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:59
export const LASERTRIP_EXPLODE____header_global_c88bffdf5a268872 = ((((((17) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2d3f2e35e5807b0d98f8bf79() {
  return __cxx_static_address_2d3f2e35e5807b0d98f8bf79.reference || (__cxx_static_address_2d3f2e35e5807b0d98f8bf79.reference = {
    __cReference: true,
    get value() { return LASERTRIP_EXPLODE____header_global_c88bffdf5a268872; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:60
export const VENT_BUST____header_global_9811a552b082e50c = ((((((18) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_afb9be65216b94304ac0a97f() {
  return __cxx_static_address_afb9be65216b94304ac0a97f.reference || (__cxx_static_address_afb9be65216b94304ac0a97f.reference = {
    __cReference: true,
    get value() { return VENT_BUST____header_global_9811a552b082e50c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:61
export const GLASS_BREAKING____header_global_d3231cc2fd8506cf = ((((((19) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ea2f62271e182728a0e6f7f0() {
  return __cxx_static_address_ea2f62271e182728a0e6f7f0.reference || (__cxx_static_address_ea2f62271e182728a0e6f7f0.reference = {
    __cReference: true,
    get value() { return GLASS_BREAKING____header_global_d3231cc2fd8506cf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:62
export const GLASS_HEAVYBREAK____header_global_6643dcb4d6b21bba = ((((((20) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_66c50b2334b05b629e8d01aa() {
  return __cxx_static_address_66c50b2334b05b629e8d01aa.reference || (__cxx_static_address_66c50b2334b05b629e8d01aa.reference = {
    __cReference: true,
    get value() { return GLASS_HEAVYBREAK____header_global_6643dcb4d6b21bba; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:63
export const SHORT_CIRCUIT____header_global_c4e044284d30354a = ((((((21) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3a5ab9d93a07ecd7832319ce() {
  return __cxx_static_address_3a5ab9d93a07ecd7832319ce.reference || (__cxx_static_address_3a5ab9d93a07ecd7832319ce.reference = {
    __cReference: true,
    get value() { return SHORT_CIRCUIT____header_global_c4e044284d30354a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:64
export const ITEM_SPLASH____header_global_4c3944252fbe50cc = ((((((22) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eed1d94f31916d634c5beed7() {
  return __cxx_static_address_eed1d94f31916d634c5beed7.reference || (__cxx_static_address_eed1d94f31916d634c5beed7.reference = {
    __cReference: true,
    get value() { return ITEM_SPLASH____header_global_4c3944252fbe50cc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:65
export const DUKE_GASP____header_global_e3ed148bcb13ad28 = ((((((25) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8a4a1a22d18325ddf4434730() {
  return __cxx_static_address_8a4a1a22d18325ddf4434730.reference || (__cxx_static_address_8a4a1a22d18325ddf4434730.reference = {
    __cReference: true,
    get value() { return DUKE_GASP____header_global_e3ed148bcb13ad28; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:66
export const SLIM_RECOG____header_global_98ffd31e67175b70 = ((((((26) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7df82cb930cd9ae3f88da729() {
  return __cxx_static_address_7df82cb930cd9ae3f88da729.reference || (__cxx_static_address_7df82cb930cd9ae3f88da729.reference = {
    __cReference: true,
    get value() { return SLIM_RECOG____header_global_98ffd31e67175b70; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:67
export const DUKE_URINATE____header_global_f67f3ee597f96fb2 = ((((((28) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1c5bad271425d00b59baf9b4() {
  return __cxx_static_address_1c5bad271425d00b59baf9b4.reference || (__cxx_static_address_1c5bad271425d00b59baf9b4.reference = {
    __cReference: true,
    get value() { return DUKE_URINATE____header_global_f67f3ee597f96fb2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:68
export const ENDSEQVOL3SND2____header_global_67c793a2e31531b6 = ((((((29) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9d98367973989a99da091510() {
  return __cxx_static_address_9d98367973989a99da091510.reference || (__cxx_static_address_9d98367973989a99da091510.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND2____header_global_67c793a2e31531b6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:69
export const ENDSEQVOL3SND3____header_global_05bb99ccacaee8af = ((((((30) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1ef5d4eb24d231d4083dd0eb() {
  return __cxx_static_address_1ef5d4eb24d231d4083dd0eb.reference || (__cxx_static_address_1ef5d4eb24d231d4083dd0eb.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND3____header_global_05bb99ccacaee8af; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:70
export const DUKE_CRACK____header_global_bff619e07c824779 = ((((((33) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_784f73ebdcc955bed543ad88() {
  return __cxx_static_address_784f73ebdcc955bed543ad88.reference || (__cxx_static_address_784f73ebdcc955bed543ad88.reference = {
    __cReference: true,
    get value() { return DUKE_CRACK____header_global_bff619e07c824779; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:71
export const SLIM_ATTACK____header_global_fa4294d289f75557 = ((((((34) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9a53f55887f8468f78f1eda4() {
  return __cxx_static_address_9a53f55887f8468f78f1eda4.reference || (__cxx_static_address_9a53f55887f8468f78f1eda4.reference = {
    __cReference: true,
    get value() { return SLIM_ATTACK____header_global_fa4294d289f75557; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:72
export const SOMETHINGHITFORCE____header_global_df5f1366b109444c = ((((((35) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a15cef9b5c89f4ddcd14ec91() {
  return __cxx_static_address_a15cef9b5c89f4ddcd14ec91.reference || (__cxx_static_address_a15cef9b5c89f4ddcd14ec91.reference = {
    __cReference: true,
    get value() { return SOMETHINGHITFORCE____header_global_df5f1366b109444c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:73
export const DUKE_DRINKING____header_global_f4189501741a079c = ((((((36) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_45ce29f154029d2554e58974() {
  return __cxx_static_address_45ce29f154029d2554e58974.reference || (__cxx_static_address_45ce29f154029d2554e58974.reference = {
    __cReference: true,
    get value() { return DUKE_DRINKING____header_global_f4189501741a079c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:74
export const DUKE_GRUNT____header_global_fc790c54140b9d09 = ((((((38) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_279d64008bf868d12cd9415c() {
  return __cxx_static_address_279d64008bf868d12cd9415c.reference || (__cxx_static_address_279d64008bf868d12cd9415c.reference = {
    __cReference: true,
    get value() { return DUKE_GRUNT____header_global_fc790c54140b9d09; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:75
export const DUKE_HARTBEAT____header_global_570061db5c67d187 = ((((((39) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_65d891b092eaeb7dcf9501fc() {
  return __cxx_static_address_65d891b092eaeb7dcf9501fc.reference || (__cxx_static_address_65d891b092eaeb7dcf9501fc.reference = {
    __cReference: true,
    get value() { return DUKE_HARTBEAT____header_global_570061db5c67d187; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:76
export const DUKE_ONWATER____header_global_e7c917426e8cc379 = ((((((40) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6c96de262f6e447f61e420b9() {
  return __cxx_static_address_6c96de262f6e447f61e420b9.reference || (__cxx_static_address_6c96de262f6e447f61e420b9.reference = {
    __cReference: true,
    get value() { return DUKE_ONWATER____header_global_e7c917426e8cc379; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:77
export const DUKE_LAND____header_global_acf2053865ccf720 = ((((((42) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_19353e585e454291b7eab409() {
  return __cxx_static_address_19353e585e454291b7eab409.reference || (__cxx_static_address_19353e585e454291b7eab409.reference = {
    __cReference: true,
    get value() { return DUKE_LAND____header_global_acf2053865ccf720; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:78
export const DUKE_WALKINDUCTS____header_global_844a3a75aafde7c2 = ((((((43) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e646eb9f5f918d2aa5a1d554() {
  return __cxx_static_address_e646eb9f5f918d2aa5a1d554.reference || (__cxx_static_address_e646eb9f5f918d2aa5a1d554.reference = {
    __cReference: true,
    get value() { return DUKE_WALKINDUCTS____header_global_844a3a75aafde7c2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:79
export const DUKE_UNDERWATER____header_global_3e4b333da13b3a91 = ((((((48) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5a075fd10130eeb74f2bf92c() {
  return __cxx_static_address_5a075fd10130eeb74f2bf92c.reference || (__cxx_static_address_5a075fd10130eeb74f2bf92c.reference = {
    __cReference: true,
    get value() { return DUKE_UNDERWATER____header_global_3e4b333da13b3a91; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:80
export const DUKE_JETPACK_ON____header_global_62de39f97c964037 = ((((((49) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b304f6244d2b68b8b9f7d625() {
  return __cxx_static_address_b304f6244d2b68b8b9f7d625.reference || (__cxx_static_address_b304f6244d2b68b8b9f7d625.reference = {
    __cReference: true,
    get value() { return DUKE_JETPACK_ON____header_global_62de39f97c964037; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:81
export const DUKE_JETPACK_IDLE____header_global_0d53f74163395877 = ((((((50) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_281a4a666ecc41fb7448f002() {
  return __cxx_static_address_281a4a666ecc41fb7448f002.reference || (__cxx_static_address_281a4a666ecc41fb7448f002.reference = {
    __cReference: true,
    get value() { return DUKE_JETPACK_IDLE____header_global_0d53f74163395877; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:82
export const DUKE_JETPACK_OFF____header_global_cf121302dcc46326 = ((((((51) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bc3c90d0071ddf1e33480436() {
  return __cxx_static_address_bc3c90d0071ddf1e33480436.reference || (__cxx_static_address_bc3c90d0071ddf1e33480436.reference = {
    __cReference: true,
    get value() { return DUKE_JETPACK_OFF____header_global_cf121302dcc46326; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:83
export const DUKETALKTOBOSS____header_global_2ed886bca4bd5eca = ((((((56) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7056927aea3e277dead3b12a() {
  return __cxx_static_address_7056927aea3e277dead3b12a.reference || (__cxx_static_address_7056927aea3e277dead3b12a.reference = {
    __cReference: true,
    get value() { return DUKETALKTOBOSS____header_global_2ed886bca4bd5eca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:84
export const SQUISHED____header_global_52caf981aad933c3 = ((((((69) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7e9a1a21abf5d4af1367f8ce() {
  return __cxx_static_address_7e9a1a21abf5d4af1367f8ce.reference || (__cxx_static_address_7e9a1a21abf5d4af1367f8ce.reference = {
    __cReference: true,
    get value() { return SQUISHED____header_global_52caf981aad933c3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:85
export const TELEPORTER____header_global_8787ec38b06cb5b7 = ((((((70) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_56c03f56bf336b126092c8c5() {
  return __cxx_static_address_56c03f56bf336b126092c8c5.reference || (__cxx_static_address_56c03f56bf336b126092c8c5.reference = {
    __cReference: true,
    get value() { return TELEPORTER____header_global_8787ec38b06cb5b7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:86
export const ELEVATOR_ON____header_global_a4c472352b35364a = ((((((71) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f4125cf3057c01510809a937() {
  return __cxx_static_address_f4125cf3057c01510809a937.reference || (__cxx_static_address_f4125cf3057c01510809a937.reference = {
    __cReference: true,
    get value() { return ELEVATOR_ON____header_global_a4c472352b35364a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:87
export const ELEVATOR_OFF____header_global_1fd4ead77b556c31 = ((((((73) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b90a2a6b8fea97f6b16a77df() {
  return __cxx_static_address_b90a2a6b8fea97f6b16a77df.reference || (__cxx_static_address_b90a2a6b8fea97f6b16a77df.reference = {
    __cReference: true,
    get value() { return ELEVATOR_OFF____header_global_1fd4ead77b556c31; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:88
export const SUBWAY____header_global_77d4a2dfb713c091 = ((((((75) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4daf7a8dafbba399863057f3() {
  return __cxx_static_address_4daf7a8dafbba399863057f3.reference || (__cxx_static_address_4daf7a8dafbba399863057f3.reference = {
    __cReference: true,
    get value() { return SUBWAY____header_global_77d4a2dfb713c091; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:89
export const SWITCH_ON____header_global_20b95fcc9c59df08 = ((((((76) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_91d0d7ab3dd790ff31b44748() {
  return __cxx_static_address_91d0d7ab3dd790ff31b44748.reference || (__cxx_static_address_91d0d7ab3dd790ff31b44748.reference = {
    __cReference: true,
    get value() { return SWITCH_ON____header_global_20b95fcc9c59df08; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:90
export const FLUSH_TOILET____header_global_9e0f08adb13a3485 = ((((((79) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_797e298d434e5f1906e5eb96() {
  return __cxx_static_address_797e298d434e5f1906e5eb96.reference || (__cxx_static_address_797e298d434e5f1906e5eb96.reference = {
    __cReference: true,
    get value() { return FLUSH_TOILET____header_global_9e0f08adb13a3485; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:91
export const EARTHQUAKE____header_global_fe1b75ddc7a98ced = ((((((81) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_741aa6fb87a69a3561b43c9e() {
  return __cxx_static_address_741aa6fb87a69a3561b43c9e.reference || (__cxx_static_address_741aa6fb87a69a3561b43c9e.reference = {
    __cReference: true,
    get value() { return EARTHQUAKE____header_global_fe1b75ddc7a98ced; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:92
export const END_OF_LEVEL_WARN____header_global_cc2acc4e20d803a1 = ((((((83) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_127f8d87b45388796453c5f5() {
  return __cxx_static_address_127f8d87b45388796453c5f5.reference || (__cxx_static_address_127f8d87b45388796453c5f5.reference = {
    __cReference: true,
    get value() { return END_OF_LEVEL_WARN____header_global_cc2acc4e20d803a1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:93
export const WIND_AMBIENCE____header_global_ed30ee48e49723dd = ((((((91) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c6cf260c210ed5732a6b2e03() {
  return __cxx_static_address_c6cf260c210ed5732a6b2e03.reference || (__cxx_static_address_c6cf260c210ed5732a6b2e03.reference = {
    __cReference: true,
    get value() { return WIND_AMBIENCE____header_global_ed30ee48e49723dd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:94
export const SOMETHING_DRIPPING____header_global_3a605839ecc49480 = ((((((92) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2ee175a6a79c9992a4fb9176() {
  return __cxx_static_address_2ee175a6a79c9992a4fb9176.reference || (__cxx_static_address_2ee175a6a79c9992a4fb9176.reference = {
    __cReference: true,
    get value() { return SOMETHING_DRIPPING____header_global_3a605839ecc49480; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:95
export const BOS1_RECOG____header_global_96706e89995783fc = ((((((97) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1b586b410ced248e6d9a3026() {
  return __cxx_static_address_1b586b410ced248e6d9a3026.reference || (__cxx_static_address_1b586b410ced248e6d9a3026.reference = {
    __cReference: true,
    get value() { return BOS1_RECOG____header_global_96706e89995783fc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:96
export const BOS2_RECOG____header_global_be41cb827bc04329 = ((((((102) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d0eba2e880b9e8f87a01a382() {
  return __cxx_static_address_d0eba2e880b9e8f87a01a382.reference || (__cxx_static_address_d0eba2e880b9e8f87a01a382.reference = {
    __cReference: true,
    get value() { return BOS2_RECOG____header_global_be41cb827bc04329; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:97
export const DUKE_GETWEAPON2____header_global_6afc83eed5ff6fb5 = ((((((107) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2e23a0b5413302cf1ee46d73() {
  return __cxx_static_address_2e23a0b5413302cf1ee46d73.reference || (__cxx_static_address_2e23a0b5413302cf1ee46d73.reference = {
    __cReference: true,
    get value() { return DUKE_GETWEAPON2____header_global_6afc83eed5ff6fb5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:98
export const SHOTGUN_FIRE____header_global_fc88f0b962dd90c6 = ((((((109) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_502646e5955a937d85017c9f() {
  return __cxx_static_address_502646e5955a937d85017c9f.reference || (__cxx_static_address_502646e5955a937d85017c9f.reference = {
    __cReference: true,
    get value() { return SHOTGUN_FIRE____header_global_fc88f0b962dd90c6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:99
export const PRED_RECOG____header_global_240754ad6aff8bd7 = ((((((111) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9a691a473fc2a24b13941938() {
  return __cxx_static_address_9a691a473fc2a24b13941938.reference || (__cxx_static_address_9a691a473fc2a24b13941938.reference = {
    __cReference: true,
    get value() { return PRED_RECOG____header_global_240754ad6aff8bd7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:100
export const CAPT_RECOG____header_global_67f4836c727f4ecd = ((((((117) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bcbf6c8d33efd3d7056bd251() {
  return __cxx_static_address_bcbf6c8d33efd3d7056bd251.reference || (__cxx_static_address_bcbf6c8d33efd3d7056bd251.reference = {
    __cReference: true,
    get value() { return CAPT_RECOG____header_global_67f4836c727f4ecd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:101
export const PIG_RECOG____header_global_93caf8821a8771cc = ((((((121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_549c0a1ffc4b9d45b18d69f7() {
  return __cxx_static_address_549c0a1ffc4b9d45b18d69f7.reference || (__cxx_static_address_549c0a1ffc4b9d45b18d69f7.reference = {
    __cReference: true,
    get value() { return PIG_RECOG____header_global_93caf8821a8771cc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:102
export const RECO_ROAM____header_global_66f362fa7702e935 = ((((((125) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_61f04af92eb8b3ab96b100c6() {
  return __cxx_static_address_61f04af92eb8b3ab96b100c6.reference || (__cxx_static_address_61f04af92eb8b3ab96b100c6.reference = {
    __cReference: true,
    get value() { return RECO_ROAM____header_global_66f362fa7702e935; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:103
export const RECO_RECOG____header_global_11802a533358901b = ((((((126) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6c9d12e79e13a930f1274fe4() {
  return __cxx_static_address_6c9d12e79e13a930f1274fe4.reference || (__cxx_static_address_6c9d12e79e13a930f1274fe4.reference = {
    __cReference: true,
    get value() { return RECO_RECOG____header_global_11802a533358901b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:104
export const RECO_ATTACK____header_global_5fe1184f109d4892 = ((((((127) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e4c8bfc19d031c36e7888f27() {
  return __cxx_static_address_e4c8bfc19d031c36e7888f27.reference || (__cxx_static_address_e4c8bfc19d031c36e7888f27.reference = {
    __cReference: true,
    get value() { return RECO_ATTACK____header_global_5fe1184f109d4892; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:105
export const RECO_PAIN____header_global_6ec4a4b261837d7c = ((((((128) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ec1f86f11387acf9ed12f935() {
  return __cxx_static_address_ec1f86f11387acf9ed12f935.reference || (__cxx_static_address_ec1f86f11387acf9ed12f935.reference = {
    __cReference: true,
    get value() { return RECO_PAIN____header_global_6ec4a4b261837d7c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:106
export const DRON_RECOG____header_global_350818be5bb5150b = ((((((131) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_52db0cfd80594238ce2cb55f() {
  return __cxx_static_address_52db0cfd80594238ce2cb55f.reference || (__cxx_static_address_52db0cfd80594238ce2cb55f.reference = {
    __cReference: true,
    get value() { return DRON_RECOG____header_global_350818be5bb5150b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:107
export const COMM_RECOG____header_global_ce3c39176e09489a = ((((((136) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bcf95f837d19d4324a525fd9() {
  return __cxx_static_address_bcf95f837d19d4324a525fd9.reference || (__cxx_static_address_bcf95f837d19d4324a525fd9.reference = {
    __cReference: true,
    get value() { return COMM_RECOG____header_global_ce3c39176e09489a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:108
export const OCTA_RECOG____header_global_855c09c9a4dab606 = ((((((141) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_38306c35524978c4523610ef() {
  return __cxx_static_address_38306c35524978c4523610ef.reference || (__cxx_static_address_38306c35524978c4523610ef.reference = {
    __cReference: true,
    get value() { return OCTA_RECOG____header_global_855c09c9a4dab606; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:109
export const TURR_RECOG____header_global_ef5d9053e6a8c9e4 = ((((((146) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_096b3917b20c8232fb3cc9ea() {
  return __cxx_static_address_096b3917b20c8232fb3cc9ea.reference || (__cxx_static_address_096b3917b20c8232fb3cc9ea.reference = {
    __cReference: true,
    get value() { return TURR_RECOG____header_global_ef5d9053e6a8c9e4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:110
export const SLIM_DYING____header_global_3b2ef3f225b22431 = ((((((149) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5fc11604977befdcf5a6a95a() {
  return __cxx_static_address_5fc11604977befdcf5a6a95a.reference || (__cxx_static_address_5fc11604977befdcf5a6a95a.reference = {
    __cReference: true,
    get value() { return SLIM_DYING____header_global_3b2ef3f225b22431; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:111
export const BOS3_RECOG____header_global_703746cfe1bc2141 = ((((((151) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e0af15fea170cadf5f6aaac6() {
  return __cxx_static_address_e0af15fea170cadf5f6aaac6.reference || (__cxx_static_address_e0af15fea170cadf5f6aaac6.reference = {
    __cReference: true,
    get value() { return BOS3_RECOG____header_global_703746cfe1bc2141; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:112
export const BOS1_WALK____header_global_2293762a32efa0ef = ((((((156) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9a425308dcc0cd357074dc08() {
  return __cxx_static_address_9a425308dcc0cd357074dc08.reference || (__cxx_static_address_9a425308dcc0cd357074dc08.reference = {
    __cReference: true,
    get value() { return BOS1_WALK____header_global_2293762a32efa0ef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:113
export const THUD____header_global_d1cca40e9cb126b9 = ((((((158) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cd1fcecf2544e06bdd30a998() {
  return __cxx_static_address_cd1fcecf2544e06bdd30a998.reference || (__cxx_static_address_cd1fcecf2544e06bdd30a998.reference = {
    __cReference: true,
    get value() { return THUD____header_global_d1cca40e9cb126b9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:114
export const WIERDSHOT_FLY____header_global_a0dd147a5489a556 = ((((((160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3a4be0aaca45b9f4d2c44115() {
  return __cxx_static_address_3a4be0aaca45b9f4d2c44115.reference || (__cxx_static_address_3a4be0aaca45b9f4d2c44115.reference = {
    __cReference: true,
    get value() { return WIERDSHOT_FLY____header_global_a0dd147a5489a556; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:115
export const SLIM_ROAM____header_global_04e53634889cb7be = ((((((163) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f00f88192e19a97f1c1a699f() {
  return __cxx_static_address_f00f88192e19a97f1c1a699f.reference || (__cxx_static_address_f00f88192e19a97f1c1a699f.reference = {
    __cReference: true,
    get value() { return SLIM_ROAM____header_global_04e53634889cb7be; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:116
export const SHOTGUN_COCK____header_global_4c5498fabf1c2d79 = ((((((169) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dee3e4790a4468735d333534() {
  return __cxx_static_address_dee3e4790a4468735d333534.reference || (__cxx_static_address_dee3e4790a4468735d333534.reference = {
    __cReference: true,
    get value() { return SHOTGUN_COCK____header_global_4c5498fabf1c2d79; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:117
export const GENERIC_AMBIENCE17____header_global_f098fe738481c6f2 = ((((((177) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4c7f1e0970adf938609ba177() {
  return __cxx_static_address_4c7f1e0970adf938609ba177.reference || (__cxx_static_address_4c7f1e0970adf938609ba177.reference = {
    __cReference: true,
    get value() { return GENERIC_AMBIENCE17____header_global_f098fe738481c6f2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:118
export const BONUS_SPEECH1____header_global_73f4181086744986 = ((((((195) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6b2a4af8c97a6952fdaa7fa2() {
  return __cxx_static_address_6b2a4af8c97a6952fdaa7fa2.reference || (__cxx_static_address_6b2a4af8c97a6952fdaa7fa2.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH1____header_global_73f4181086744986; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:119
export const BONUS_SPEECH2____header_global_0a74fc4aefd75394 = ((((((196) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b3a6001e88b2af5642ec1e29() {
  return __cxx_static_address_b3a6001e88b2af5642ec1e29.reference || (__cxx_static_address_b3a6001e88b2af5642ec1e29.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH2____header_global_0a74fc4aefd75394; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:120
export const BONUS_SPEECH3____header_global_e414edffd397d0e0 = ((((((197) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_02f2b2bc015c868fa3835562() {
  return __cxx_static_address_02f2b2bc015c868fa3835562.reference || (__cxx_static_address_02f2b2bc015c868fa3835562.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH3____header_global_e414edffd397d0e0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:121
export const BONUS_SPEECH4____header_global_972f4788dd6d33f0 = ((((((199) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ef49ee5538e474150137a91f() {
  return __cxx_static_address_ef49ee5538e474150137a91f.reference || (__cxx_static_address_ef49ee5538e474150137a91f.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH4____header_global_972f4788dd6d33f0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:122
export const DUKE_LAND_HURT____header_global_cce3f9d20568fe4e = ((((((200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4cdb6d68ec4de59554edef91() {
  return __cxx_static_address_4cdb6d68ec4de59554edef91.reference || (__cxx_static_address_4cdb6d68ec4de59554edef91.reference = {
    __cReference: true,
    get value() { return DUKE_LAND_HURT____header_global_cce3f9d20568fe4e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:123
export const DUKE_SEARCH2____header_global_24ec9610b3d8f52a = ((((((207) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cd7467d993605c280825f177() {
  return __cxx_static_address_cd7467d993605c280825f177.reference || (__cxx_static_address_cd7467d993605c280825f177.reference = {
    __cReference: true,
    get value() { return DUKE_SEARCH2____header_global_24ec9610b3d8f52a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:124
export const DUKE_CRACK2____header_global_b74d0bc0e1f28566 = ((((((208) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c976beee0216af9b383edc1c() {
  return __cxx_static_address_c976beee0216af9b383edc1c.reference || (__cxx_static_address_c976beee0216af9b383edc1c.reference = {
    __cReference: true,
    get value() { return DUKE_CRACK2____header_global_b74d0bc0e1f28566; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:125
export const DUKE_SEARCH____header_global_3b149de909468175 = ((((((209) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_43a55bf001c98551abe639de() {
  return __cxx_static_address_43a55bf001c98551abe639de.reference || (__cxx_static_address_43a55bf001c98551abe639de.reference = {
    __cReference: true,
    get value() { return DUKE_SEARCH____header_global_3b149de909468175; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:126
export const DUKE_GET____header_global_0eb7f09e93bc9986 = ((((((210) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_af974fc1bb2ba87bac449eed() {
  return __cxx_static_address_af974fc1bb2ba87bac449eed.reference || (__cxx_static_address_af974fc1bb2ba87bac449eed.reference = {
    __cReference: true,
    get value() { return DUKE_GET____header_global_0eb7f09e93bc9986; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:127
export const DUKE_LONGTERM_PAIN____header_global_0269b95c4a0df1cb = ((((((211) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2638dfc3c57e4f26683be4af() {
  return __cxx_static_address_2638dfc3c57e4f26683be4af.reference || (__cxx_static_address_2638dfc3c57e4f26683be4af.reference = {
    __cReference: true,
    get value() { return DUKE_LONGTERM_PAIN____header_global_0269b95c4a0df1cb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:128
export const MONITOR_ACTIVE____header_global_8a5bd12207d85668 = ((((((212) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_772b177051fb53578c46177c() {
  return __cxx_static_address_772b177051fb53578c46177c.reference || (__cxx_static_address_772b177051fb53578c46177c.reference = {
    __cReference: true,
    get value() { return MONITOR_ACTIVE____header_global_8a5bd12207d85668; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:129
export const NITEVISION_ONOFF____header_global_b9cb9503bd13464b = ((((((213) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_31bab2bff999fafeeae569aa() {
  return __cxx_static_address_31bab2bff999fafeeae569aa.reference || (__cxx_static_address_31bab2bff999fafeeae569aa.reference = {
    __cReference: true,
    get value() { return NITEVISION_ONOFF____header_global_b9cb9503bd13464b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:130
export const DUKE_CRACK_FIRST____header_global_7e16fa1ebe048e6e = ((((((215) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_99ef8cbdc60da8a1f4987c69() {
  return __cxx_static_address_99ef8cbdc60da8a1f4987c69.reference || (__cxx_static_address_99ef8cbdc60da8a1f4987c69.reference = {
    __cReference: true,
    get value() { return DUKE_CRACK_FIRST____header_global_7e16fa1ebe048e6e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:131
export const DUKE_USEMEDKIT____header_global_66fd282dd6b77235 = ((((((216) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_69254fad2a14c1cef60dc803() {
  return __cxx_static_address_69254fad2a14c1cef60dc803.reference || (__cxx_static_address_69254fad2a14c1cef60dc803.reference = {
    __cReference: true,
    get value() { return DUKE_USEMEDKIT____header_global_66fd282dd6b77235; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:132
export const DUKE_TAKEPILLS____header_global_8db2fdd0b216d2cc = ((((((217) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b30bce0e8ee08397f48d85f7() {
  return __cxx_static_address_b30bce0e8ee08397f48d85f7.reference || (__cxx_static_address_b30bce0e8ee08397f48d85f7.reference = {
    __cReference: true,
    get value() { return DUKE_TAKEPILLS____header_global_8db2fdd0b216d2cc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:133
export const DUKE_PISSRELIEF____header_global_cbaf975bdb949e8f = ((((((218) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e8acf5fa1aa36edf11349222() {
  return __cxx_static_address_e8acf5fa1aa36edf11349222.reference || (__cxx_static_address_e8acf5fa1aa36edf11349222.reference = {
    __cReference: true,
    get value() { return DUKE_PISSRELIEF____header_global_cbaf975bdb949e8f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:134
export const SELECT_WEAPON____header_global_d3af6fe22386c96a = ((((((219) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b9348ddc353e8f42d1e0ecd3() {
  return __cxx_static_address_b9348ddc353e8f42d1e0ecd3.reference || (__cxx_static_address_b9348ddc353e8f42d1e0ecd3.reference = {
    __cReference: true,
    get value() { return SELECT_WEAPON____header_global_d3af6fe22386c96a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:135
export const JIBBED_ACTOR5____header_global_904fcc386e5c858b = ((((((226) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1075f2b9b85d9af539886fab() {
  return __cxx_static_address_1075f2b9b85d9af539886fab.reference || (__cxx_static_address_1075f2b9b85d9af539886fab.reference = {
    __cReference: true,
    get value() { return JIBBED_ACTOR5____header_global_904fcc386e5c858b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:136
export const JIBBED_ACTOR6____header_global_2fa6098106e390c7 = ((((((227) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_541648b7c65b5a39b99ef7ad() {
  return __cxx_static_address_541648b7c65b5a39b99ef7ad.reference || (__cxx_static_address_541648b7c65b5a39b99ef7ad.reference = {
    __cReference: true,
    get value() { return JIBBED_ACTOR6____header_global_2fa6098106e390c7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:137
export const DUKE_GOTHEALTHATLOW____header_global_5d48ea7bdebfa7c1 = ((((((229) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d385f2f7f70c550c4f010d27() {
  return __cxx_static_address_d385f2f7f70c550c4f010d27.reference || (__cxx_static_address_d385f2f7f70c550c4f010d27.reference = {
    __cReference: true,
    get value() { return DUKE_GOTHEALTHATLOW____header_global_5d48ea7bdebfa7c1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:138
export const BOSSTALKTODUKE____header_global_11510c36b2dd202e = ((((((230) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1acc6ec0d83a1ff4b8d82c4c() {
  return __cxx_static_address_1acc6ec0d83a1ff4b8d82c4c.reference || (__cxx_static_address_1acc6ec0d83a1ff4b8d82c4c.reference = {
    __cReference: true,
    get value() { return BOSSTALKTODUKE____header_global_11510c36b2dd202e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:139
export const WAR_AMBIENCE2____header_global_93260db4147376da = ((((((232) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_76e976d59b210b9a78b5b837() {
  return __cxx_static_address_76e976d59b210b9a78b5b837.reference || (__cxx_static_address_76e976d59b210b9a78b5b837.reference = {
    __cReference: true,
    get value() { return WAR_AMBIENCE2____header_global_93260db4147376da; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:140
export const EXITMENUSOUND____header_global_24802d28a903ed20 = ((((((243) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2633a56656f4d42cd699570e() {
  return __cxx_static_address_2633a56656f4d42cd699570e.reference || (__cxx_static_address_2633a56656f4d42cd699570e.reference = {
    __cReference: true,
    get value() { return EXITMENUSOUND____header_global_24802d28a903ed20; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:141
export const FLY_BY____header_global_844022d9d7e7737c = ((((((244) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b89295fc999d616a9eac0f19() {
  return __cxx_static_address_b89295fc999d616a9eac0f19.reference || (__cxx_static_address_b89295fc999d616a9eac0f19.reference = {
    __cReference: true,
    get value() { return FLY_BY____header_global_844022d9d7e7737c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:142
export const DUKE_SCREAM____header_global_98c868ffe22522bf = ((((((245) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c2a70d11593f4f588a53003b() {
  return __cxx_static_address_c2a70d11593f4f588a53003b.reference || (__cxx_static_address_c2a70d11593f4f588a53003b.reference = {
    __cReference: true,
    get value() { return DUKE_SCREAM____header_global_98c868ffe22522bf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:143
export const SHRINKER_HIT____header_global_fa95d502efacc647 = ((((((246) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_faa04e671d73e5643dda4d11() {
  return __cxx_static_address_faa04e671d73e5643dda4d11.reference || (__cxx_static_address_faa04e671d73e5643dda4d11.reference = {
    __cReference: true,
    get value() { return SHRINKER_HIT____header_global_fa95d502efacc647; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:144
export const RATTY____header_global_0ff576810d816121 = ((((((247) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_18a1290a752ff1a609637eb9() {
  return __cxx_static_address_18a1290a752ff1a609637eb9.reference || (__cxx_static_address_18a1290a752ff1a609637eb9.reference = {
    __cReference: true,
    get value() { return RATTY____header_global_0ff576810d816121; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:145
export const BONUSMUSIC____header_global_a7113a477a8ae971 = ((((((249) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aa93d8d57306b942a7f48dea() {
  return __cxx_static_address_aa93d8d57306b942a7f48dea.reference || (__cxx_static_address_aa93d8d57306b942a7f48dea.reference = {
    __cReference: true,
    get value() { return BONUSMUSIC____header_global_a7113a477a8ae971; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:146
export const DUKE_GETWEAPON6____header_global_3e8893c7cb244237 = ((((((264) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_88fa1b253ef25c230a226fa3() {
  return __cxx_static_address_88fa1b253ef25c230a226fa3.reference || (__cxx_static_address_88fa1b253ef25c230a226fa3.reference = {
    __cReference: true,
    get value() { return DUKE_GETWEAPON6____header_global_3e8893c7cb244237; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:147
export const ALIEN_SWITCH1____header_global_9b4fce5554996e34 = ((((((272) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_702801c809cc01d3a1634685() {
  return __cxx_static_address_702801c809cc01d3a1634685.reference || (__cxx_static_address_702801c809cc01d3a1634685.reference = {
    __cReference: true,
    get value() { return ALIEN_SWITCH1____header_global_9b4fce5554996e34; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:148
export const RIPHEADNECK____header_global_97e2566673bb33e4 = ((((((284) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5b04d351b2f9ae8045d94da1() {
  return __cxx_static_address_5b04d351b2f9ae8045d94da1.reference || (__cxx_static_address_5b04d351b2f9ae8045d94da1.reference = {
    __cReference: true,
    get value() { return RIPHEADNECK____header_global_97e2566673bb33e4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:149
export const ENDSEQVOL3SND4____header_global_f17be899b881c0ea = ((((((288) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_79d18a3c73904d7a5879e5b8() {
  return __cxx_static_address_79d18a3c73904d7a5879e5b8.reference || (__cxx_static_address_79d18a3c73904d7a5879e5b8.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND4____header_global_f17be899b881c0ea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:150
export const ENDSEQVOL3SND5____header_global_de8223c6a1e7b04b = ((((((289) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c1ea36f3d66386c408f5100a() {
  return __cxx_static_address_c1ea36f3d66386c408f5100a.reference || (__cxx_static_address_c1ea36f3d66386c408f5100a.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND5____header_global_de8223c6a1e7b04b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:151
export const ENDSEQVOL3SND6____header_global_161e359d18db5f5a = ((((((290) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_09a79e739633938f61cd9509() {
  return __cxx_static_address_09a79e739633938f61cd9509.reference || (__cxx_static_address_09a79e739633938f61cd9509.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND6____header_global_161e359d18db5f5a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:152
export const ENDSEQVOL3SND7____header_global_0e06a00476ab0a0f = ((((((291) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_14569f662966419873b62d3c() {
  return __cxx_static_address_14569f662966419873b62d3c.reference || (__cxx_static_address_14569f662966419873b62d3c.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND7____header_global_0e06a00476ab0a0f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:153
export const ENDSEQVOL3SND8____header_global_5dfccf33d8130a02 = ((((((292) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_31a2686aecf5b9c44fed29ef() {
  return __cxx_static_address_31a2686aecf5b9c44fed29ef.reference || (__cxx_static_address_31a2686aecf5b9c44fed29ef.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND8____header_global_5dfccf33d8130a02; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:154
export const ENDSEQVOL3SND9____header_global_aae4e2ad9f6a374d = ((((((293) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_97d3e532dc07908e00f14a3a() {
  return __cxx_static_address_97d3e532dc07908e00f14a3a.reference || (__cxx_static_address_97d3e532dc07908e00f14a3a.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND9____header_global_aae4e2ad9f6a374d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:155
export const WHIPYOURASS____header_global_041dcadad8bccd3a = ((((((294) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ac0a5651f145e05cd7723905() {
  return __cxx_static_address_ac0a5651f145e05cd7723905.reference || (__cxx_static_address_ac0a5651f145e05cd7723905.reference = {
    __cReference: true,
    get value() { return WHIPYOURASS____header_global_041dcadad8bccd3a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:156
export const ENDSEQVOL2SND1____header_global_2cb7439885e198da = ((((((295) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e0e06702671bbb90d2f81a9a() {
  return __cxx_static_address_e0e06702671bbb90d2f81a9a.reference || (__cxx_static_address_e0e06702671bbb90d2f81a9a.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND1____header_global_2cb7439885e198da; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:157
export const ENDSEQVOL2SND2____header_global_de2bbf70e9cf1b3b = ((((((296) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b740a52d2aa5220693952f3c() {
  return __cxx_static_address_b740a52d2aa5220693952f3c.reference || (__cxx_static_address_b740a52d2aa5220693952f3c.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND2____header_global_de2bbf70e9cf1b3b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:158
export const ENDSEQVOL2SND3____header_global_852e033dfa28399f = ((((((297) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2dc4b167eabd0b7cdf7c143f() {
  return __cxx_static_address_2dc4b167eabd0b7cdf7c143f.reference || (__cxx_static_address_2dc4b167eabd0b7cdf7c143f.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND3____header_global_852e033dfa28399f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:159
export const ENDSEQVOL2SND4____header_global_ce1ae1e1d1ae6c23 = ((((((298) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_df2e80b383b1d9812de2b845() {
  return __cxx_static_address_df2e80b383b1d9812de2b845.reference || (__cxx_static_address_df2e80b383b1d9812de2b845.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND4____header_global_ce1ae1e1d1ae6c23; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:160
export const ENDSEQVOL2SND5____header_global_1451393bf3707efe = ((((((299) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8f58d2829e8e5f8544b5409a() {
  return __cxx_static_address_8f58d2829e8e5f8544b5409a.reference || (__cxx_static_address_8f58d2829e8e5f8544b5409a.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND5____header_global_1451393bf3707efe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:161
export const ENDSEQVOL2SND6____header_global_db29907f35713ec9 = ((((((300) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_31cf92470e21adaa8c5ad278() {
  return __cxx_static_address_31cf92470e21adaa8c5ad278.reference || (__cxx_static_address_31cf92470e21adaa8c5ad278.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND6____header_global_db29907f35713ec9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:162
export const ENDSEQVOL2SND7____header_global_a66d2c535fe60c63 = ((((((301) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f8804586ac0f1af14cb2306b() {
  return __cxx_static_address_f8804586ac0f1af14cb2306b.reference || (__cxx_static_address_f8804586ac0f1af14cb2306b.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND7____header_global_a66d2c535fe60c63; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:163
export const SOMETHINGFROZE____header_global_6efbaae85a6cccd3 = ((((((303) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2739c199177a5f2578716128() {
  return __cxx_static_address_2739c199177a5f2578716128.reference || (__cxx_static_address_2739c199177a5f2578716128.reference = {
    __cReference: true,
    get value() { return SOMETHINGFROZE____header_global_6efbaae85a6cccd3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:164
export const WIND_REPEAT____header_global_316f2ed01b3d9e8d = ((((((308) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0868c6c102de85bc45efda15() {
  return __cxx_static_address_0868c6c102de85bc45efda15.reference || (__cxx_static_address_0868c6c102de85bc45efda15.reference = {
    __cReference: true,
    get value() { return WIND_REPEAT____header_global_316f2ed01b3d9e8d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:165
export const BOS4_RECOG____header_global_cddcea8990e42a94 = ((((((342) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a53f3b1702526fb8efdb9269() {
  return __cxx_static_address_a53f3b1702526fb8efdb9269.reference || (__cxx_static_address_a53f3b1702526fb8efdb9269.reference = {
    __cReference: true,
    get value() { return BOS4_RECOG____header_global_cddcea8990e42a94; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:166
export const LIGHTNING_SLAP____header_global_d704833493fdaebf = ((((((351) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ccfc8a3bad47d898347721f9() {
  return __cxx_static_address_ccfc8a3bad47d898347721f9.reference || (__cxx_static_address_ccfc8a3bad47d898347721f9.reference = {
    __cReference: true,
    get value() { return LIGHTNING_SLAP____header_global_d704833493fdaebf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:167
export const THUNDER____header_global_f087f346459b8ae4 = ((((((352) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_67fc024b06256a539571e77b() {
  return __cxx_static_address_67fc024b06256a539571e77b.reference || (__cxx_static_address_67fc024b06256a539571e77b.reference = {
    __cReference: true,
    get value() { return THUNDER____header_global_f087f346459b8ae4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:168
export const INTRO4_1____header_global_aa5937eaf8dbb225 = ((((((363) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_47f2ca6c1fa26b8804ef9508() {
  return __cxx_static_address_47f2ca6c1fa26b8804ef9508.reference || (__cxx_static_address_47f2ca6c1fa26b8804ef9508.reference = {
    __cReference: true,
    get value() { return INTRO4_1____header_global_aa5937eaf8dbb225; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:169
export const INTRO4_2____header_global_9795964ce355edb1 = ((((((364) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fcb15151863a6c5a57cc8bf5() {
  return __cxx_static_address_fcb15151863a6c5a57cc8bf5.reference || (__cxx_static_address_fcb15151863a6c5a57cc8bf5.reference = {
    __cReference: true,
    get value() { return INTRO4_2____header_global_9795964ce355edb1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:170
export const INTRO4_3____header_global_a205e828d66eb685 = ((((((365) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f5ef548d574160d9dae75697() {
  return __cxx_static_address_f5ef548d574160d9dae75697.reference || (__cxx_static_address_f5ef548d574160d9dae75697.reference = {
    __cReference: true,
    get value() { return INTRO4_3____header_global_a205e828d66eb685; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:171
export const INTRO4_4____header_global_82bbad42442992df = ((((((366) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a3a527b5e9bbe28aedd12640() {
  return __cxx_static_address_a3a527b5e9bbe28aedd12640.reference || (__cxx_static_address_a3a527b5e9bbe28aedd12640.reference = {
    __cReference: true,
    get value() { return INTRO4_4____header_global_82bbad42442992df; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:172
export const INTRO4_5____header_global_6b4e87df8d2522a0 = ((((((367) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_88febf02a6814b3df70fe03f() {
  return __cxx_static_address_88febf02a6814b3df70fe03f.reference || (__cxx_static_address_88febf02a6814b3df70fe03f.reference = {
    __cReference: true,
    get value() { return INTRO4_5____header_global_6b4e87df8d2522a0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:173
export const INTRO4_6____header_global_422a77b9282f5e8d = ((((((368) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_df7bab4c97d74cb3f9a4f469() {
  return __cxx_static_address_df7bab4c97d74cb3f9a4f469.reference || (__cxx_static_address_df7bab4c97d74cb3f9a4f469.reference = {
    __cReference: true,
    get value() { return INTRO4_6____header_global_422a77b9282f5e8d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:174
export const BOSS4_DEADSPEECH____header_global_a7fe6de38a4a4a0a = ((((((370) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4c3e9294d3f88fd091e62f97() {
  return __cxx_static_address_4c3e9294d3f88fd091e62f97.reference || (__cxx_static_address_4c3e9294d3f88fd091e62f97.reference = {
    __cReference: true,
    get value() { return BOSS4_DEADSPEECH____header_global_a7fe6de38a4a4a0a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:175
export const BOSS4_FIRSTSEE____header_global_51711128ac0c32ee = ((((((371) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_227ced997f417a810736f99c() {
  return __cxx_static_address_227ced997f417a810736f99c.reference || (__cxx_static_address_227ced997f417a810736f99c.reference = {
    __cReference: true,
    get value() { return BOSS4_FIRSTSEE____header_global_51711128ac0c32ee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:176
export const VOL4ENDSND1____header_global_8c23da92434bd5f6 = ((((((384) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_418bb2e36d0c52fbee486cb0() {
  return __cxx_static_address_418bb2e36d0c52fbee486cb0.reference || (__cxx_static_address_418bb2e36d0c52fbee486cb0.reference = {
    __cReference: true,
    get value() { return VOL4ENDSND1____header_global_8c23da92434bd5f6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:177
export const VOL4ENDSND2____header_global_b672cecb03391b9e = ((((((385) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7250254d11fe779779e2b78b() {
  return __cxx_static_address_7250254d11fe779779e2b78b.reference || (__cxx_static_address_7250254d11fe779779e2b78b.reference = {
    __cReference: true,
    get value() { return VOL4ENDSND2____header_global_b672cecb03391b9e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:178
export const EXPANDERSHOOT____header_global_c62e5363a9f46e92 = ((((((388) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e4bc34a2542b3bebd1037786() {
  return __cxx_static_address_e4bc34a2542b3bebd1037786.reference || (__cxx_static_address_e4bc34a2542b3bebd1037786.reference = {
    __cReference: true,
    get value() { return EXPANDERSHOOT____header_global_c62e5363a9f46e92; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:179
export const INTRO4_B____header_global_965556a1727e68ee = ((((((392) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_82d9d483bc458e65a43b787a() {
  return __cxx_static_address_82d9d483bc458e65a43b787a.reference || (__cxx_static_address_82d9d483bc458e65a43b787a.reference = {
    __cReference: true,
    get value() { return INTRO4_B____header_global_965556a1727e68ee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:180
export const BIGBANG____header_global_068dd100cd516114 = ((((((393) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_27004d7a9fe4dd1e036141cc() {
  return __cxx_static_address_27004d7a9fe4dd1e036141cc.reference || (__cxx_static_address_27004d7a9fe4dd1e036141cc.reference = {
    __cReference: true,
    get value() { return BIGBANG____header_global_068dd100cd516114; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:181
export const FLAMETHROWER_INTRO____header_global_e37dc6cf6773462c = ((((((398) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d55eaf07f28ca27dc625d9c3() {
  return __cxx_static_address_d55eaf07f28ca27dc625d9c3.reference || (__cxx_static_address_d55eaf07f28ca27dc625d9c3.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER_INTRO____header_global_e37dc6cf6773462c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:182
export const FLAMETHROWER_LOOP____header_global_53c5bb5221fe4d54 = ((((((399) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e8e42d0e81e52cf79f7f702a() {
  return __cxx_static_address_e8e42d0e81e52cf79f7f702a.reference || (__cxx_static_address_e8e42d0e81e52cf79f7f702a.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER_LOOP____header_global_53c5bb5221fe4d54; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:183
export const FLAMETHROWER_END____header_global_2410c06f5f179c0e = ((((((400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c598915a8a8f6ca73b126828() {
  return __cxx_static_address_c598915a8a8f6ca73b126828.reference || (__cxx_static_address_c598915a8a8f6ca73b126828.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER_END____header_global_2410c06f5f179c0e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:184
export const E5L7_DUKE_QUIT_YOU____header_global_89c13fad7dcd84ae = ((((((401) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c504c5441948415772e12515() {
  return __cxx_static_address_c504c5441948415772e12515.reference || (__cxx_static_address_c504c5441948415772e12515.reference = {
    __cReference: true,
    get value() { return E5L7_DUKE_QUIT_YOU____header_global_89c13fad7dcd84ae; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:187
export const SECTOREFFECTOR____header_global_0463eff046e728eb = ((((((1) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_282a62212df0030aca4efb81() {
  return __cxx_static_address_282a62212df0030aca4efb81.reference || (__cxx_static_address_282a62212df0030aca4efb81.reference = {
    __cReference: true,
    get value() { return SECTOREFFECTOR____header_global_0463eff046e728eb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:188
export const ACTIVATOR____header_global_c1b2d5c6d55c7a5c = ((((((2) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_552e8b13e73ef4d6bc96620e() {
  return __cxx_static_address_552e8b13e73ef4d6bc96620e.reference || (__cxx_static_address_552e8b13e73ef4d6bc96620e.reference = {
    __cReference: true,
    get value() { return ACTIVATOR____header_global_c1b2d5c6d55c7a5c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:189
export const TOUCHPLATE____header_global_a2371d1f82a4d3ba = ((((((3) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a8f1b8ef462b2dfdb8d9c9c7() {
  return __cxx_static_address_a8f1b8ef462b2dfdb8d9c9c7.reference || (__cxx_static_address_a8f1b8ef462b2dfdb8d9c9c7.reference = {
    __cReference: true,
    get value() { return TOUCHPLATE____header_global_a2371d1f82a4d3ba; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:190
export const ACTIVATORLOCKED____header_global_bde515a5eace7e1e = ((((((4) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7bf89a4044a7239fa7588939() {
  return __cxx_static_address_7bf89a4044a7239fa7588939.reference || (__cxx_static_address_7bf89a4044a7239fa7588939.reference = {
    __cReference: true,
    get value() { return ACTIVATORLOCKED____header_global_bde515a5eace7e1e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:191
export const MUSICANDSFX____header_global_8027c67d2d053b11 = ((((((5) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_54a9a3ffa44fefda88dc33dc() {
  return __cxx_static_address_54a9a3ffa44fefda88dc33dc.reference || (__cxx_static_address_54a9a3ffa44fefda88dc33dc.reference = {
    __cReference: true,
    get value() { return MUSICANDSFX____header_global_8027c67d2d053b11; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:192
export const LOCATORS____header_global_8a41bf05ec2e64e6 = ((((((6) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_75e9ca644e547c13994ba295() {
  return __cxx_static_address_75e9ca644e547c13994ba295.reference || (__cxx_static_address_75e9ca644e547c13994ba295.reference = {
    __cReference: true,
    get value() { return LOCATORS____header_global_8a41bf05ec2e64e6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:193
export const CYCLER____header_global_0e843a399bfc6093 = ((((((7) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_75674970422d0298953c7e29() {
  return __cxx_static_address_75674970422d0298953c7e29.reference || (__cxx_static_address_75674970422d0298953c7e29.reference = {
    __cReference: true,
    get value() { return CYCLER____header_global_0e843a399bfc6093; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:194
export const MASTERSWITCH____header_global_9332316bc42f0b48 = ((((((8) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_92fe203a8bdae82c99d58706() {
  return __cxx_static_address_92fe203a8bdae82c99d58706.reference || (__cxx_static_address_92fe203a8bdae82c99d58706.reference = {
    __cReference: true,
    get value() { return MASTERSWITCH____header_global_9332316bc42f0b48; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:195
export const RESPAWN____header_global_31dd7ec671c0d8f1 = ((((((9) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_673504fbec620eb6a0a6352e() {
  return __cxx_static_address_673504fbec620eb6a0a6352e.reference || (__cxx_static_address_673504fbec620eb6a0a6352e.reference = {
    __cReference: true,
    get value() { return RESPAWN____header_global_31dd7ec671c0d8f1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:196
export const GPSPEED____header_global_0b8968d95782ca76 = ((((((10) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ae1565e98e4ae6cb7d43122d() {
  return __cxx_static_address_ae1565e98e4ae6cb7d43122d.reference || (__cxx_static_address_ae1565e98e4ae6cb7d43122d.reference = {
    __cReference: true,
    get value() { return GPSPEED____header_global_0b8968d95782ca76; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:197
export const FOF____header_global_2f484760bf7cc952 = ((((((13) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d608fe56f61214f93e62599c() {
  return __cxx_static_address_d608fe56f61214f93e62599c.reference || (__cxx_static_address_d608fe56f61214f93e62599c.reference = {
    __cReference: true,
    get value() { return FOF____header_global_2f484760bf7cc952; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:198
export const ARROW____header_global_0bc62ad3fe54b0f5 = ((((((20) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6967f50ad8801c63323b3c41() {
  return __cxx_static_address_6967f50ad8801c63323b3c41.reference || (__cxx_static_address_6967f50ad8801c63323b3c41.reference = {
    __cReference: true,
    get value() { return ARROW____header_global_0bc62ad3fe54b0f5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:199
export const FIRSTGUNSPRITE____header_global_3eaaa6d84ac64d58 = ((((((21) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aca7c0c7777cd1113461b23c() {
  return __cxx_static_address_aca7c0c7777cd1113461b23c.reference || (__cxx_static_address_aca7c0c7777cd1113461b23c.reference = {
    __cReference: true,
    get value() { return FIRSTGUNSPRITE____header_global_3eaaa6d84ac64d58; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:200
export const CHAINGUNSPRITE____header_global_6b843a3097581ae2 = ((((((22) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_92b8e03828751de796a1d98f() {
  return __cxx_static_address_92b8e03828751de796a1d98f.reference || (__cxx_static_address_92b8e03828751de796a1d98f.reference = {
    __cReference: true,
    get value() { return CHAINGUNSPRITE____header_global_6b843a3097581ae2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:201
export const RPGSPRITE____header_global_a5cb36970e317402 = ((((((23) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7313f6e8dd88c6de9b058aa9() {
  return __cxx_static_address_7313f6e8dd88c6de9b058aa9.reference || (__cxx_static_address_7313f6e8dd88c6de9b058aa9.reference = {
    __cReference: true,
    get value() { return RPGSPRITE____header_global_a5cb36970e317402; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:202
export const FREEZESPRITE____header_global_ae09b270b34987dc = ((((((24) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_518633bf98dd80a506c77588() {
  return __cxx_static_address_518633bf98dd80a506c77588.reference || (__cxx_static_address_518633bf98dd80a506c77588.reference = {
    __cReference: true,
    get value() { return FREEZESPRITE____header_global_ae09b270b34987dc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:203
export const SHRINKERSPRITE____header_global_7e17eb9e388ccfe3 = ((((((25) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7debca64a6b2282583eabf9e() {
  return __cxx_static_address_7debca64a6b2282583eabf9e.reference || (__cxx_static_address_7debca64a6b2282583eabf9e.reference = {
    __cReference: true,
    get value() { return SHRINKERSPRITE____header_global_7e17eb9e388ccfe3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:204
export const HEAVYHBOMB____header_global_dd50fbd0906e0939 = ((((((26) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_47e11bfc63b4f6e422ffbb2f() {
  return __cxx_static_address_47e11bfc63b4f6e422ffbb2f.reference || (__cxx_static_address_47e11bfc63b4f6e422ffbb2f.reference = {
    __cReference: true,
    get value() { return HEAVYHBOMB____header_global_dd50fbd0906e0939; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:205
export const TRIPBOMBSPRITE____header_global_fd5da93e8dd9a463 = ((((((27) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d3983737789458197722e2c9() {
  return __cxx_static_address_d3983737789458197722e2c9.reference || (__cxx_static_address_d3983737789458197722e2c9.reference = {
    __cReference: true,
    get value() { return TRIPBOMBSPRITE____header_global_fd5da93e8dd9a463; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:206
export const SHOTGUNSPRITE____header_global_c2895abae9514d2f = ((((((28) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_849e0d08a16c58a62794e8fe() {
  return __cxx_static_address_849e0d08a16c58a62794e8fe.reference || (__cxx_static_address_849e0d08a16c58a62794e8fe.reference = {
    __cReference: true,
    get value() { return SHOTGUNSPRITE____header_global_c2895abae9514d2f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:207
export const DEVISTATORSPRITE____header_global_500081e4c3f475b5 = ((((((29) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1d1cae07a730f07a84862932() {
  return __cxx_static_address_1d1cae07a730f07a84862932.reference || (__cxx_static_address_1d1cae07a730f07a84862932.reference = {
    __cReference: true,
    get value() { return DEVISTATORSPRITE____header_global_500081e4c3f475b5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:208
export const HEALTHBOX____header_global_7567130862101bba = ((((((30) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_010df47a38125295ce09d722() {
  return __cxx_static_address_010df47a38125295ce09d722.reference || (__cxx_static_address_010df47a38125295ce09d722.reference = {
    __cReference: true,
    get value() { return HEALTHBOX____header_global_7567130862101bba; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:209
export const AMMOBOX____header_global_469e98bfb2fbf7cb = ((((((31) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8f84bad09b142b57e1c1e564() {
  return __cxx_static_address_8f84bad09b142b57e1c1e564.reference || (__cxx_static_address_8f84bad09b142b57e1c1e564.reference = {
    __cReference: true,
    get value() { return AMMOBOX____header_global_469e98bfb2fbf7cb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:210
export const GROWSPRITEICON____header_global_79f6e60f9b0897a8 = ((((((32) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1190addda910a55875546a9b() {
  return __cxx_static_address_1190addda910a55875546a9b.reference || (__cxx_static_address_1190addda910a55875546a9b.reference = {
    __cReference: true,
    get value() { return GROWSPRITEICON____header_global_79f6e60f9b0897a8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:211
export const INVENTORYBOX____header_global_6c498423abd3f50f = ((((((33) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_930caa6e0ebcdccfadd95184() {
  return __cxx_static_address_930caa6e0ebcdccfadd95184.reference || (__cxx_static_address_930caa6e0ebcdccfadd95184.reference = {
    __cReference: true,
    get value() { return INVENTORYBOX____header_global_6c498423abd3f50f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:212
export const FREEZEAMMO____header_global_762f03b3dc98592e = ((((((37) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_11ae7cabc6b488b6d0bce2a8() {
  return __cxx_static_address_11ae7cabc6b488b6d0bce2a8.reference || (__cxx_static_address_11ae7cabc6b488b6d0bce2a8.reference = {
    __cReference: true,
    get value() { return FREEZEAMMO____header_global_762f03b3dc98592e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:213
export const AMMO____header_global_10cecf5a39712b26 = ((((((40) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_702357915746608ec23fbff0() {
  return __cxx_static_address_702357915746608ec23fbff0.reference || (__cxx_static_address_702357915746608ec23fbff0.reference = {
    __cReference: true,
    get value() { return AMMO____header_global_10cecf5a39712b26; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:214
export const BATTERYAMMO____header_global_1290384557cf86bd = ((((((41) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9cbd3916367790ae94ae8e5f() {
  return __cxx_static_address_9cbd3916367790ae94ae8e5f.reference || (__cxx_static_address_9cbd3916367790ae94ae8e5f.reference = {
    __cReference: true,
    get value() { return BATTERYAMMO____header_global_1290384557cf86bd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:215
export const DEVISTATORAMMO____header_global_b7cb062486ce7c44 = ((((((42) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7243d362b9092a1900df46ec() {
  return __cxx_static_address_7243d362b9092a1900df46ec.reference || (__cxx_static_address_7243d362b9092a1900df46ec.reference = {
    __cReference: true,
    get value() { return DEVISTATORAMMO____header_global_b7cb062486ce7c44; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:216
export const RPGAMMO____header_global_efcf5d5448c83cff = ((((((44) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bf7b9b3f6f8fbb89cd4c2cb4() {
  return __cxx_static_address_bf7b9b3f6f8fbb89cd4c2cb4.reference || (__cxx_static_address_bf7b9b3f6f8fbb89cd4c2cb4.reference = {
    __cReference: true,
    get value() { return RPGAMMO____header_global_efcf5d5448c83cff; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:217
export const GROWAMMO____header_global_4b4827a34c8819a2 = ((((((45) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_90d50e7b7e380308d98355b6() {
  return __cxx_static_address_90d50e7b7e380308d98355b6.reference || (__cxx_static_address_90d50e7b7e380308d98355b6.reference = {
    __cReference: true,
    get value() { return GROWAMMO____header_global_4b4827a34c8819a2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:218
export const CRYSTALAMMO____header_global_c1b34ca7ff9399b6 = ((((((46) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c9dd2fb6d17399a6b21a1313() {
  return __cxx_static_address_c9dd2fb6d17399a6b21a1313.reference || (__cxx_static_address_c9dd2fb6d17399a6b21a1313.reference = {
    __cReference: true,
    get value() { return CRYSTALAMMO____header_global_c1b34ca7ff9399b6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:219
export const HBOMBAMMO____header_global_f9f4322185b9e4d3 = ((((((47) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_30e81851a08355fc0adf2644() {
  return __cxx_static_address_30e81851a08355fc0adf2644.reference || (__cxx_static_address_30e81851a08355fc0adf2644.reference = {
    __cReference: true,
    get value() { return HBOMBAMMO____header_global_f9f4322185b9e4d3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:220
export const AMMOLOTS____header_global_fbb030d9e5b40808 = ((((((48) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_db9cac0179f3c836d16a6027() {
  return __cxx_static_address_db9cac0179f3c836d16a6027.reference || (__cxx_static_address_db9cac0179f3c836d16a6027.reference = {
    __cReference: true,
    get value() { return AMMOLOTS____header_global_fbb030d9e5b40808; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:221
export const SHOTGUNAMMO____header_global_af017bc87542c892 = ((((((49) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4f72d6ad9bc77ea245b8d18c() {
  return __cxx_static_address_4f72d6ad9bc77ea245b8d18c.reference || (__cxx_static_address_4f72d6ad9bc77ea245b8d18c.reference = {
    __cReference: true,
    get value() { return SHOTGUNAMMO____header_global_af017bc87542c892; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:222
export const COLA____header_global_bbf3680b88288bb0 = ((((((51) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_98fc71017f7e64b320c5a212() {
  return __cxx_static_address_98fc71017f7e64b320c5a212.reference || (__cxx_static_address_98fc71017f7e64b320c5a212.reference = {
    __cReference: true,
    get value() { return COLA____header_global_bbf3680b88288bb0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:223
export const SIXPAK____header_global_c3add3d0770d0b6c = ((((((52) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_420415db02e04e2d68bf990e() {
  return __cxx_static_address_420415db02e04e2d68bf990e.reference || (__cxx_static_address_420415db02e04e2d68bf990e.reference = {
    __cReference: true,
    get value() { return SIXPAK____header_global_c3add3d0770d0b6c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:224
export const FIRSTAID____header_global_faef0b50d4299056 = ((((((53) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d6bbe2ab914172d992b567ac() {
  return __cxx_static_address_d6bbe2ab914172d992b567ac.reference || (__cxx_static_address_d6bbe2ab914172d992b567ac.reference = {
    __cReference: true,
    get value() { return FIRSTAID____header_global_faef0b50d4299056; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:225
export const SHIELD____header_global_ef927da9ac861535 = ((((((54) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f0b8dbb8ffa60dbe7399908f() {
  return __cxx_static_address_f0b8dbb8ffa60dbe7399908f.reference || (__cxx_static_address_f0b8dbb8ffa60dbe7399908f.reference = {
    __cReference: true,
    get value() { return SHIELD____header_global_ef927da9ac861535; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:226
export const STEROIDS____header_global_bbd19303a8bed7d1 = ((((((55) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e8b8881b2f8b717f6f7a5ae8() {
  return __cxx_static_address_e8b8881b2f8b717f6f7a5ae8.reference || (__cxx_static_address_e8b8881b2f8b717f6f7a5ae8.reference = {
    __cReference: true,
    get value() { return STEROIDS____header_global_bbd19303a8bed7d1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:227
export const AIRTANK____header_global_dfa0511bb1267dde = ((((((56) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cfc60e62e4f3c052f84de38b() {
  return __cxx_static_address_cfc60e62e4f3c052f84de38b.reference || (__cxx_static_address_cfc60e62e4f3c052f84de38b.reference = {
    __cReference: true,
    get value() { return AIRTANK____header_global_dfa0511bb1267dde; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:228
export const JETPACK____header_global_a1b945d42830a4a3 = ((((((57) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d98c22e811a4834af4a8cdb4() {
  return __cxx_static_address_d98c22e811a4834af4a8cdb4.reference || (__cxx_static_address_d98c22e811a4834af4a8cdb4.reference = {
    __cReference: true,
    get value() { return JETPACK____header_global_a1b945d42830a4a3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:229
export const HEATSENSOR____header_global_196693e519096fbb = ((((((59) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ecbcee8ec84288f1bbca3ab1() {
  return __cxx_static_address_ecbcee8ec84288f1bbca3ab1.reference || (__cxx_static_address_ecbcee8ec84288f1bbca3ab1.reference = {
    __cReference: true,
    get value() { return HEATSENSOR____header_global_196693e519096fbb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:230
export const ACCESSCARD____header_global_b33b6e2fcaa4c0b4 = ((((((60) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a7723dbfd7ce2c0266bbf760() {
  return __cxx_static_address_a7723dbfd7ce2c0266bbf760.reference || (__cxx_static_address_a7723dbfd7ce2c0266bbf760.reference = {
    __cReference: true,
    get value() { return ACCESSCARD____header_global_b33b6e2fcaa4c0b4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:231
export const BOOTS____header_global_314fab8e66adb385 = ((((((61) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f589733768b164bedd03d167() {
  return __cxx_static_address_f589733768b164bedd03d167.reference || (__cxx_static_address_f589733768b164bedd03d167.reference = {
    __cReference: true,
    get value() { return BOOTS____header_global_314fab8e66adb385; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:232
export const MIRRORBROKE____header_global_1f40b4b87cdfe835 = ((((((70) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7fe2d1271e56d49322f70a57() {
  return __cxx_static_address_7fe2d1271e56d49322f70a57.reference || (__cxx_static_address_7fe2d1271e56d49322f70a57.reference = {
    __cReference: true,
    get value() { return MIRRORBROKE____header_global_1f40b4b87cdfe835; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:233
export const CLOUDYOCEAN____header_global_a5fb876ad3dfbb73 = ((((((78) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0a42f3b248002e277326fc0e() {
  return __cxx_static_address_0a42f3b248002e277326fc0e.reference || (__cxx_static_address_0a42f3b248002e277326fc0e.reference = {
    __cReference: true,
    get value() { return CLOUDYOCEAN____header_global_a5fb876ad3dfbb73; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:234
export const CLOUDYSKIES____header_global_33ea4ffcd08fc56e = ((((((79) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f2d38a951897cd50ba33c8ee() {
  return __cxx_static_address_f2d38a951897cd50ba33c8ee.reference || (__cxx_static_address_f2d38a951897cd50ba33c8ee.reference = {
    __cReference: true,
    get value() { return CLOUDYSKIES____header_global_33ea4ffcd08fc56e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:235
export const MOONSKY1____header_global_8bf68584097a2921 = ((((((80) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_508837e9484fe56a1c0a0d13() {
  return __cxx_static_address_508837e9484fe56a1c0a0d13.reference || (__cxx_static_address_508837e9484fe56a1c0a0d13.reference = {
    __cReference: true,
    get value() { return MOONSKY1____header_global_8bf68584097a2921; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:236
export const BIGORBIT1____header_global_1d044b93b4da8ce4 = ((((((84) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_db496ec6b52e70c2aa89b6c7() {
  return __cxx_static_address_db496ec6b52e70c2aa89b6c7.reference || (__cxx_static_address_db496ec6b52e70c2aa89b6c7.reference = {
    __cReference: true,
    get value() { return BIGORBIT1____header_global_1d044b93b4da8ce4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:237
export const LA____header_global_a6183fa43decb6ea = ((((((89) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2d6f541577fab3f90cf58df4() {
  return __cxx_static_address_2d6f541577fab3f90cf58df4.reference || (__cxx_static_address_2d6f541577fab3f90cf58df4.reference = {
    __cReference: true,
    get value() { return LA____header_global_a6183fa43decb6ea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:238
export const ATOMICHEALTH____header_global_1ecdb84165009329 = ((((((100) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5f58de801dc94feab9bce5c7() {
  return __cxx_static_address_5f58de801dc94feab9bce5c7.reference || (__cxx_static_address_5f58de801dc94feab9bce5c7.reference = {
    __cReference: true,
    get value() { return ATOMICHEALTH____header_global_1ecdb84165009329; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:239
export const TECHLIGHT2____header_global_df933ada43fff18d = ((((((120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3b7f0c803b8041e10e86a174() {
  return __cxx_static_address_3b7f0c803b8041e10e86a174.reference || (__cxx_static_address_3b7f0c803b8041e10e86a174.reference = {
    __cReference: true,
    get value() { return TECHLIGHT2____header_global_df933ada43fff18d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:240
export const TECHLIGHTBUST2____header_global_121c03baca5fc04b = ((((((121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_55120b47afc582613033be2b() {
  return __cxx_static_address_55120b47afc582613033be2b.reference || (__cxx_static_address_55120b47afc582613033be2b.reference = {
    __cReference: true,
    get value() { return TECHLIGHTBUST2____header_global_121c03baca5fc04b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:241
export const TECHLIGHT4____header_global_b38fb935818b6db9 = ((((((122) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0d1d6e21c41f83417c1fb306() {
  return __cxx_static_address_0d1d6e21c41f83417c1fb306.reference || (__cxx_static_address_0d1d6e21c41f83417c1fb306.reference = {
    __cReference: true,
    get value() { return TECHLIGHT4____header_global_b38fb935818b6db9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:242
export const TECHLIGHTBUST4____header_global_42ded6de1ee7cd2c = ((((((123) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1d4e35a83fdc517a09afcd78() {
  return __cxx_static_address_1d4e35a83fdc517a09afcd78.reference || (__cxx_static_address_1d4e35a83fdc517a09afcd78.reference = {
    __cReference: true,
    get value() { return TECHLIGHTBUST4____header_global_42ded6de1ee7cd2c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:243
export const WALLLIGHT4____header_global_3f39d88ed9be35cd = ((((((124) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5696759f3f8fb081ff85731a() {
  return __cxx_static_address_5696759f3f8fb081ff85731a.reference || (__cxx_static_address_5696759f3f8fb081ff85731a.reference = {
    __cReference: true,
    get value() { return WALLLIGHT4____header_global_3f39d88ed9be35cd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:244
export const WALLLIGHTBUST4____header_global_8bd95e0adc86c4fe = ((((((125) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5fa05e38d3b1c7b12582fa18() {
  return __cxx_static_address_5fa05e38d3b1c7b12582fa18.reference || (__cxx_static_address_5fa05e38d3b1c7b12582fa18.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST4____header_global_8bd95e0adc86c4fe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:245
export const ACCESSSWITCH____header_global_9eeac571a6f899cd = ((((((130) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fb60ce30953f357bab9aace0() {
  return __cxx_static_address_fb60ce30953f357bab9aace0.reference || (__cxx_static_address_fb60ce30953f357bab9aace0.reference = {
    __cReference: true,
    get value() { return ACCESSSWITCH____header_global_9eeac571a6f899cd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:246
export const SLOTDOOR____header_global_d40696baab552ee2 = ((((((132) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7cf0324a97417e5f25185905() {
  return __cxx_static_address_7cf0324a97417e5f25185905.reference || (__cxx_static_address_7cf0324a97417e5f25185905.reference = {
    __cReference: true,
    get value() { return SLOTDOOR____header_global_d40696baab552ee2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:247
export const LIGHTSWITCH____header_global_fb280200a1d14dd5 = ((((((134) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1239986f61b77dd9d9aca8a7() {
  return __cxx_static_address_1239986f61b77dd9d9aca8a7.reference || (__cxx_static_address_1239986f61b77dd9d9aca8a7.reference = {
    __cReference: true,
    get value() { return LIGHTSWITCH____header_global_fb280200a1d14dd5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:248
export const SPACEDOORSWITCH____header_global_ed7d65b7efccc720 = ((((((136) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3c824cc824cf3e82e2ff462b() {
  return __cxx_static_address_3c824cc824cf3e82e2ff462b.reference || (__cxx_static_address_3c824cc824cf3e82e2ff462b.reference = {
    __cReference: true,
    get value() { return SPACEDOORSWITCH____header_global_ed7d65b7efccc720; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:249
export const SPACELIGHTSWITCH____header_global_260041e4580cd3da = ((((((138) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fe65d9f3a0b76d3b6f121df6() {
  return __cxx_static_address_fe65d9f3a0b76d3b6f121df6.reference || (__cxx_static_address_fe65d9f3a0b76d3b6f121df6.reference = {
    __cReference: true,
    get value() { return SPACELIGHTSWITCH____header_global_260041e4580cd3da; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:250
export const FRANKENSTINESWITCH____header_global_676e99475711d07a = ((((((140) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_35108083fe9cd70a7c33b456() {
  return __cxx_static_address_35108083fe9cd70a7c33b456.reference || (__cxx_static_address_35108083fe9cd70a7c33b456.reference = {
    __cReference: true,
    get value() { return FRANKENSTINESWITCH____header_global_676e99475711d07a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:251
export const NUKEBUTTON____header_global_eed33caa7b7eb342 = ((((((142) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0249c091e17420b0e27b8e25() {
  return __cxx_static_address_0249c091e17420b0e27b8e25.reference || (__cxx_static_address_0249c091e17420b0e27b8e25.reference = {
    __cReference: true,
    get value() { return NUKEBUTTON____header_global_eed33caa7b7eb342; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:252
export const MULTISWITCH____header_global_cdfeb11f135a4129 = ((((((146) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3d31e7f5c386151a2482b232() {
  return __cxx_static_address_3d31e7f5c386151a2482b232.reference || (__cxx_static_address_3d31e7f5c386151a2482b232.reference = {
    __cReference: true,
    get value() { return MULTISWITCH____header_global_cdfeb11f135a4129; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:253
export const DOORTILE5____header_global_047e67ce2397053d = ((((((150) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_627b1f793768591e9e2e1233() {
  return __cxx_static_address_627b1f793768591e9e2e1233.reference || (__cxx_static_address_627b1f793768591e9e2e1233.reference = {
    __cReference: true,
    get value() { return DOORTILE5____header_global_047e67ce2397053d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:254
export const DOORTILE6____header_global_538617175a2bece0 = ((((((151) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c054b5df78d147caedeb79af() {
  return __cxx_static_address_c054b5df78d147caedeb79af.reference || (__cxx_static_address_c054b5df78d147caedeb79af.reference = {
    __cReference: true,
    get value() { return DOORTILE6____header_global_538617175a2bece0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:255
export const DOORTILE1____header_global_a88a02dac4e947e9 = ((((((152) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2c678a57370679d174282c2d() {
  return __cxx_static_address_2c678a57370679d174282c2d.reference || (__cxx_static_address_2c678a57370679d174282c2d.reference = {
    __cReference: true,
    get value() { return DOORTILE1____header_global_a88a02dac4e947e9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:256
export const DOORTILE2____header_global_373db4a69aae5dcd = ((((((153) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0a1891ea9d5ebadf5f818a8a() {
  return __cxx_static_address_0a1891ea9d5ebadf5f818a8a.reference || (__cxx_static_address_0a1891ea9d5ebadf5f818a8a.reference = {
    __cReference: true,
    get value() { return DOORTILE2____header_global_373db4a69aae5dcd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:257
export const DOORTILE3____header_global_7a280e26f8d6f6c3 = ((((((154) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7d67bd473786fa3af7f16b8c() {
  return __cxx_static_address_7d67bd473786fa3af7f16b8c.reference || (__cxx_static_address_7d67bd473786fa3af7f16b8c.reference = {
    __cReference: true,
    get value() { return DOORTILE3____header_global_7a280e26f8d6f6c3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:258
export const DOORTILE4____header_global_19254c70251006b0 = ((((((155) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_317185ed01c6a7ac6abcaa3c() {
  return __cxx_static_address_317185ed01c6a7ac6abcaa3c.reference || (__cxx_static_address_317185ed01c6a7ac6abcaa3c.reference = {
    __cReference: true,
    get value() { return DOORTILE4____header_global_19254c70251006b0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:259
export const DOORTILE7____header_global_35c59098f08e6be6 = ((((((156) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_07fa36dbbf14d427c4fa4ea0() {
  return __cxx_static_address_07fa36dbbf14d427c4fa4ea0.reference || (__cxx_static_address_07fa36dbbf14d427c4fa4ea0.reference = {
    __cReference: true,
    get value() { return DOORTILE7____header_global_35c59098f08e6be6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:260
export const DOORTILE8____header_global_ddaf92f00e0351f4 = ((((((157) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_da46f408b9c3f254c50bb79c() {
  return __cxx_static_address_da46f408b9c3f254c50bb79c.reference || (__cxx_static_address_da46f408b9c3f254c50bb79c.reference = {
    __cReference: true,
    get value() { return DOORTILE8____header_global_ddaf92f00e0351f4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:261
export const DOORTILE9____header_global_c288b084c467cd91 = ((((((158) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9332390c6f3b0f6c1fec84ef() {
  return __cxx_static_address_9332390c6f3b0f6c1fec84ef.reference || (__cxx_static_address_9332390c6f3b0f6c1fec84ef.reference = {
    __cReference: true,
    get value() { return DOORTILE9____header_global_c288b084c467cd91; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:262
export const DOORTILE10____header_global_73f9fd5da6a4f2fb = ((((((159) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5f555797f2df186e7e5a351d() {
  return __cxx_static_address_5f555797f2df186e7e5a351d.reference || (__cxx_static_address_5f555797f2df186e7e5a351d.reference = {
    __cReference: true,
    get value() { return DOORTILE10____header_global_73f9fd5da6a4f2fb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:263
export const DOORSHOCK____header_global_19401a7ce68fdf79 = ((((((160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_57e86141368c3904aa0ad67d() {
  return __cxx_static_address_57e86141368c3904aa0ad67d.reference || (__cxx_static_address_57e86141368c3904aa0ad67d.reference = {
    __cReference: true,
    get value() { return DOORSHOCK____header_global_19401a7ce68fdf79; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:264
export const DIPSWITCH____header_global_81cdc80d92c4fe11 = ((((((162) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1a56186f30eef957c9e2bd6d() {
  return __cxx_static_address_1a56186f30eef957c9e2bd6d.reference || (__cxx_static_address_1a56186f30eef957c9e2bd6d.reference = {
    __cReference: true,
    get value() { return DIPSWITCH____header_global_81cdc80d92c4fe11; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:265
export const DIPSWITCH2____header_global_7d8185ef8042285f = ((((((164) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1b4b6b89629fb2723678e817() {
  return __cxx_static_address_1b4b6b89629fb2723678e817.reference || (__cxx_static_address_1b4b6b89629fb2723678e817.reference = {
    __cReference: true,
    get value() { return DIPSWITCH2____header_global_7d8185ef8042285f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:266
export const TECHSWITCH____header_global_abafed55bda37c47 = ((((((166) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f0bcdf189bf07c45ebb94491() {
  return __cxx_static_address_f0bcdf189bf07c45ebb94491.reference || (__cxx_static_address_f0bcdf189bf07c45ebb94491.reference = {
    __cReference: true,
    get value() { return TECHSWITCH____header_global_abafed55bda37c47; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:267
export const DIPSWITCH3____header_global_35047356151545a3 = ((((((168) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_55d9e5ed899eaec3c1117300() {
  return __cxx_static_address_55d9e5ed899eaec3c1117300.reference || (__cxx_static_address_55d9e5ed899eaec3c1117300.reference = {
    __cReference: true,
    get value() { return DIPSWITCH3____header_global_35047356151545a3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:268
export const ACCESSSWITCH2____header_global_9e53db608553a2ac = ((((((170) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ff5317e7b8064a383eaa896b() {
  return __cxx_static_address_ff5317e7b8064a383eaa896b.reference || (__cxx_static_address_ff5317e7b8064a383eaa896b.reference = {
    __cReference: true,
    get value() { return ACCESSSWITCH2____header_global_9e53db608553a2ac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:269
export const FLOORSLIME____header_global_7b9d29a8aa5195a5 = ((((((200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8cf2ac973f30200bc3d75957() {
  return __cxx_static_address_8cf2ac973f30200bc3d75957.reference || (__cxx_static_address_8cf2ac973f30200bc3d75957.reference = {
    __cReference: true,
    get value() { return FLOORSLIME____header_global_7b9d29a8aa5195a5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:270
export const BIGFORCE____header_global_34dde71a741bbc8d = ((((((230) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dc49f72a13eb77dd2f2683a5() {
  return __cxx_static_address_dc49f72a13eb77dd2f2683a5.reference || (__cxx_static_address_dc49f72a13eb77dd2f2683a5.reference = {
    __cReference: true,
    get value() { return BIGFORCE____header_global_34dde71a741bbc8d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:271
export const MASKWALL9____header_global_60b9e83b22361c3d = ((((((255) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_95fb60c2eafb0d2448da5676() {
  return __cxx_static_address_95fb60c2eafb0d2448da5676.reference || (__cxx_static_address_95fb60c2eafb0d2448da5676.reference = {
    __cReference: true,
    get value() { return MASKWALL9____header_global_60b9e83b22361c3d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:272
export const SCREENBREAK1____header_global_4bec348582dfb506 = ((((((263) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_585eace26a4e372fe57b3b5e() {
  return __cxx_static_address_585eace26a4e372fe57b3b5e.reference || (__cxx_static_address_585eace26a4e372fe57b3b5e.reference = {
    __cReference: true,
    get value() { return SCREENBREAK1____header_global_4bec348582dfb506; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:273
export const SCREENBREAK2____header_global_7f110285a55953e8 = ((((((264) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6e854cb0317b8ce8f8b771e3() {
  return __cxx_static_address_6e854cb0317b8ce8f8b771e3.reference || (__cxx_static_address_6e854cb0317b8ce8f8b771e3.reference = {
    __cReference: true,
    get value() { return SCREENBREAK2____header_global_7f110285a55953e8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:274
export const SCREENBREAK3____header_global_5c4abf27ae594380 = ((((((265) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bbf7f144653629bb26352dc8() {
  return __cxx_static_address_bbf7f144653629bb26352dc8.reference || (__cxx_static_address_bbf7f144653629bb26352dc8.reference = {
    __cReference: true,
    get value() { return SCREENBREAK3____header_global_5c4abf27ae594380; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:275
export const SCREENBREAK4____header_global_426585a9c83eb377 = ((((((266) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c871aa9e5fd7ffff244bf553() {
  return __cxx_static_address_c871aa9e5fd7ffff244bf553.reference || (__cxx_static_address_c871aa9e5fd7ffff244bf553.reference = {
    __cReference: true,
    get value() { return SCREENBREAK4____header_global_426585a9c83eb377; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:276
export const SCREENBREAK5____header_global_3ca5066ca4499737 = ((((((267) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a38e470fee49f56d3b849ca9() {
  return __cxx_static_address_a38e470fee49f56d3b849ca9.reference || (__cxx_static_address_a38e470fee49f56d3b849ca9.reference = {
    __cReference: true,
    get value() { return SCREENBREAK5____header_global_3ca5066ca4499737; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:277
export const SCREENBREAK6____header_global_7a96de112c429c6b = ((((((268) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fa53fef2db02a8b6997aedd2() {
  return __cxx_static_address_fa53fef2db02a8b6997aedd2.reference || (__cxx_static_address_fa53fef2db02a8b6997aedd2.reference = {
    __cReference: true,
    get value() { return SCREENBREAK6____header_global_7a96de112c429c6b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:278
export const SCREENBREAK7____header_global_3f27af7a5cfd515e = ((((((269) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bef685fb62f8d0a6c0d460b5() {
  return __cxx_static_address_bef685fb62f8d0a6c0d460b5.reference || (__cxx_static_address_bef685fb62f8d0a6c0d460b5.reference = {
    __cReference: true,
    get value() { return SCREENBREAK7____header_global_3f27af7a5cfd515e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:279
export const SCREENBREAK8____header_global_efcae67ffe1f5a15 = ((((((270) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7403fe6d2998561e09625676() {
  return __cxx_static_address_7403fe6d2998561e09625676.reference || (__cxx_static_address_7403fe6d2998561e09625676.reference = {
    __cReference: true,
    get value() { return SCREENBREAK8____header_global_efcae67ffe1f5a15; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:280
export const SCREENBREAK9____header_global_29827879dd94d3e5 = ((((((271) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cdd781ad630d9916e3c63673() {
  return __cxx_static_address_cdd781ad630d9916e3c63673.reference || (__cxx_static_address_cdd781ad630d9916e3c63673.reference = {
    __cReference: true,
    get value() { return SCREENBREAK9____header_global_29827879dd94d3e5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:281
export const SCREENBREAK10____header_global_23a70b3020343c2d = ((((((272) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a14f7bbd782e7d98f824706b() {
  return __cxx_static_address_a14f7bbd782e7d98f824706b.reference || (__cxx_static_address_a14f7bbd782e7d98f824706b.reference = {
    __cReference: true,
    get value() { return SCREENBREAK10____header_global_23a70b3020343c2d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:282
export const SCREENBREAK11____header_global_498b19bb0520f9f9 = ((((((273) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_db538c662bccdf895e92fd19() {
  return __cxx_static_address_db538c662bccdf895e92fd19.reference || (__cxx_static_address_db538c662bccdf895e92fd19.reference = {
    __cReference: true,
    get value() { return SCREENBREAK11____header_global_498b19bb0520f9f9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:283
export const SCREENBREAK12____header_global_6c4e7375b98f42c6 = ((((((274) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9cfc47741e0ee94a535c0339() {
  return __cxx_static_address_9cfc47741e0ee94a535c0339.reference || (__cxx_static_address_9cfc47741e0ee94a535c0339.reference = {
    __cReference: true,
    get value() { return SCREENBREAK12____header_global_6c4e7375b98f42c6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:284
export const SCREENBREAK13____header_global_da0cde30992ef8b7 = ((((((275) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8c4c1a286b9df33149f441e5() {
  return __cxx_static_address_8c4c1a286b9df33149f441e5.reference || (__cxx_static_address_8c4c1a286b9df33149f441e5.reference = {
    __cReference: true,
    get value() { return SCREENBREAK13____header_global_da0cde30992ef8b7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:285
export const MASKWALL1____header_global_9991a3499b47712f = ((((((285) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d9bd02c87845c48c5c84cdbc() {
  return __cxx_static_address_d9bd02c87845c48c5c84cdbc.reference || (__cxx_static_address_d9bd02c87845c48c5c84cdbc.reference = {
    __cReference: true,
    get value() { return MASKWALL1____header_global_9991a3499b47712f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:286
export const W_TECHWALL1____header_global_8ef8bc630af6f668 = ((((((293) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_94f48ca1b147ae8755a7e9fd() {
  return __cxx_static_address_94f48ca1b147ae8755a7e9fd.reference || (__cxx_static_address_94f48ca1b147ae8755a7e9fd.reference = {
    __cReference: true,
    get value() { return W_TECHWALL1____header_global_8ef8bc630af6f668; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:287
export const W_TECHWALL2____header_global_10144ab504a397cc = ((((((297) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_58f17ac58525bbf2e5dbc96e() {
  return __cxx_static_address_58f17ac58525bbf2e5dbc96e.reference || (__cxx_static_address_58f17ac58525bbf2e5dbc96e.reference = {
    __cReference: true,
    get value() { return W_TECHWALL2____header_global_10144ab504a397cc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:288
export const W_TECHWALL15____header_global_4400c079b7a864fa = ((((((299) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2c435c0b7595fd3d7176e3fb() {
  return __cxx_static_address_2c435c0b7595fd3d7176e3fb.reference || (__cxx_static_address_2c435c0b7595fd3d7176e3fb.reference = {
    __cReference: true,
    get value() { return W_TECHWALL15____header_global_4400c079b7a864fa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:289
export const W_TECHWALL3____header_global_e85dbd32e29e56b6 = ((((((301) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_175e84186ee6d83a085e6aaa() {
  return __cxx_static_address_175e84186ee6d83a085e6aaa.reference || (__cxx_static_address_175e84186ee6d83a085e6aaa.reference = {
    __cReference: true,
    get value() { return W_TECHWALL3____header_global_e85dbd32e29e56b6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:290
export const W_TECHWALL4____header_global_f1fd4bf86228b034 = ((((((305) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_daab36f044b17644588cfc74() {
  return __cxx_static_address_daab36f044b17644588cfc74.reference || (__cxx_static_address_daab36f044b17644588cfc74.reference = {
    __cReference: true,
    get value() { return W_TECHWALL4____header_global_f1fd4bf86228b034; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:291
export const W_TECHWALL10____header_global_8f89191188cb4e00 = ((((((306) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f1ca94f1b30debbb1b706dde() {
  return __cxx_static_address_f1ca94f1b30debbb1b706dde.reference || (__cxx_static_address_f1ca94f1b30debbb1b706dde.reference = {
    __cReference: true,
    get value() { return W_TECHWALL10____header_global_8f89191188cb4e00; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:292
export const W_TECHWALL16____header_global_e29895a61a66efc4 = ((((((307) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cc0045d72ea66bac118954cc() {
  return __cxx_static_address_cc0045d72ea66bac118954cc.reference || (__cxx_static_address_cc0045d72ea66bac118954cc.reference = {
    __cReference: true,
    get value() { return W_TECHWALL16____header_global_e29895a61a66efc4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:293
export const WATERTILE2____header_global_dbb291fff0d3a0fd = ((((((336) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bb11c8decd8c5607b8f17f74() {
  return __cxx_static_address_bb11c8decd8c5607b8f17f74.reference || (__cxx_static_address_bb11c8decd8c5607b8f17f74.reference = {
    __cReference: true,
    get value() { return WATERTILE2____header_global_dbb291fff0d3a0fd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:294
export const BPANNEL1____header_global_077db02d5f4d67a1 = ((((((341) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c0d99618c7d4d88388324ae5() {
  return __cxx_static_address_c0d99618c7d4d88388324ae5.reference || (__cxx_static_address_c0d99618c7d4d88388324ae5.reference = {
    __cReference: true,
    get value() { return BPANNEL1____header_global_077db02d5f4d67a1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:295
export const PANNEL1____header_global_6f3def970b46c44e = ((((((342) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e88a3edd50783de85b2732df() {
  return __cxx_static_address_e88a3edd50783de85b2732df.reference || (__cxx_static_address_e88a3edd50783de85b2732df.reference = {
    __cReference: true,
    get value() { return PANNEL1____header_global_6f3def970b46c44e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:296
export const PANNEL2____header_global_2d007a8c792d69d8 = ((((((343) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_806c3fc5605c65a46de16edc() {
  return __cxx_static_address_806c3fc5605c65a46de16edc.reference || (__cxx_static_address_806c3fc5605c65a46de16edc.reference = {
    __cReference: true,
    get value() { return PANNEL2____header_global_2d007a8c792d69d8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:297
export const STATIC____header_global_a8e0c57cdd3b81d9 = ((((((351) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d40969c8e233798c441a4d08() {
  return __cxx_static_address_d40969c8e233798c441a4d08.reference || (__cxx_static_address_d40969c8e233798c441a4d08.reference = {
    __cReference: true,
    get value() { return STATIC____header_global_a8e0c57cdd3b81d9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:298
export const W_SCREENBREAK____header_global_b9dc54674c7333d1 = ((((((357) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5b2c47182a73deda4c6e48b2() {
  return __cxx_static_address_5b2c47182a73deda4c6e48b2.reference || (__cxx_static_address_5b2c47182a73deda4c6e48b2.reference = {
    __cReference: true,
    get value() { return W_SCREENBREAK____header_global_b9dc54674c7333d1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:299
export const W_HITTECHWALL3____header_global_31fd83b3ac01aed7 = ((((((360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_71f81efe1825ac411421d1c8() {
  return __cxx_static_address_71f81efe1825ac411421d1c8.reference || (__cxx_static_address_71f81efe1825ac411421d1c8.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL3____header_global_31fd83b3ac01aed7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:300
export const W_HITTECHWALL4____header_global_5390360f41982a5f = ((((((361) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9dc2a9dbb25f59e4c779c1b0() {
  return __cxx_static_address_9dc2a9dbb25f59e4c779c1b0.reference || (__cxx_static_address_9dc2a9dbb25f59e4c779c1b0.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL4____header_global_5390360f41982a5f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:301
export const W_HITTECHWALL2____header_global_77c1555955bf426e = ((((((362) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7adf96a56430a5fba9a8227f() {
  return __cxx_static_address_7adf96a56430a5fba9a8227f.reference || (__cxx_static_address_7adf96a56430a5fba9a8227f.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL2____header_global_77c1555955bf426e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:302
export const W_HITTECHWALL1____header_global_1037460a0991f7eb = ((((((363) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5d084f6d8a7dd3b2fdf3fe9d() {
  return __cxx_static_address_5d084f6d8a7dd3b2fdf3fe9d.reference || (__cxx_static_address_5d084f6d8a7dd3b2fdf3fe9d.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL1____header_global_1037460a0991f7eb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:303
export const MASKWALL10____header_global_9de99b43c3aece8e = ((((((387) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cb7fe204bd77d9270bff788b() {
  return __cxx_static_address_cb7fe204bd77d9270bff788b.reference || (__cxx_static_address_cb7fe204bd77d9270bff788b.reference = {
    __cReference: true,
    get value() { return MASKWALL10____header_global_9de99b43c3aece8e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:304
export const MASKWALL11____header_global_741796c321ec5c45 = ((((((391) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_893594cf0701e2adc33fb638() {
  return __cxx_static_address_893594cf0701e2adc33fb638.reference || (__cxx_static_address_893594cf0701e2adc33fb638.reference = {
    __cReference: true,
    get value() { return MASKWALL11____header_global_741796c321ec5c45; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:305
export const DOORTILE22____header_global_b4e03dd32649afa0 = ((((((395) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_74419ff3e54d8b1a8813bdc2() {
  return __cxx_static_address_74419ff3e54d8b1a8813bdc2.reference || (__cxx_static_address_74419ff3e54d8b1a8813bdc2.reference = {
    __cReference: true,
    get value() { return DOORTILE22____header_global_b4e03dd32649afa0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:306
export const FANSPRITE____header_global_5842549b8981f491 = ((((((407) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_01d492b016ec572e2415edb1() {
  return __cxx_static_address_01d492b016ec572e2415edb1.reference || (__cxx_static_address_01d492b016ec572e2415edb1.reference = {
    __cReference: true,
    get value() { return FANSPRITE____header_global_5842549b8981f491; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:307
export const FANSPRITEBROKE____header_global_80a84906c59faadf = ((((((411) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a327601e0e78fa38ba995525() {
  return __cxx_static_address_a327601e0e78fa38ba995525.reference || (__cxx_static_address_a327601e0e78fa38ba995525.reference = {
    __cReference: true,
    get value() { return FANSPRITEBROKE____header_global_80a84906c59faadf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:308
export const FANSHADOW____header_global_496e24e646c9a211 = ((((((412) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2143681c2b18bbf0d6ee95f8() {
  return __cxx_static_address_2143681c2b18bbf0d6ee95f8.reference || (__cxx_static_address_2143681c2b18bbf0d6ee95f8.reference = {
    __cReference: true,
    get value() { return FANSHADOW____header_global_496e24e646c9a211; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:309
export const FANSHADOWBROKE____header_global_6f92fb8d0f70e881 = ((((((416) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_caae5744d2559a61cbba04ef() {
  return __cxx_static_address_caae5744d2559a61cbba04ef.reference || (__cxx_static_address_caae5744d2559a61cbba04ef.reference = {
    __cReference: true,
    get value() { return FANSHADOWBROKE____header_global_6f92fb8d0f70e881; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:310
export const DOORTILE18____header_global_f6d732939d3bf571 = ((((((447) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_55ae77eb3a172fb3772dd3c3() {
  return __cxx_static_address_55ae77eb3a172fb3772dd3c3.reference || (__cxx_static_address_55ae77eb3a172fb3772dd3c3.reference = {
    __cReference: true,
    get value() { return DOORTILE18____header_global_f6d732939d3bf571; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:311
export const DOORTILE19____header_global_556e9918e4c12a95 = ((((((448) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d322b27e2ba5b188b0db66d4() {
  return __cxx_static_address_d322b27e2ba5b188b0db66d4.reference || (__cxx_static_address_d322b27e2ba5b188b0db66d4.reference = {
    __cReference: true,
    get value() { return DOORTILE19____header_global_556e9918e4c12a95; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:312
export const DOORTILE20____header_global_f631add8c4ceee22 = ((((((449) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d0fc3eb2249732967174b4da() {
  return __cxx_static_address_d0fc3eb2249732967174b4da.reference || (__cxx_static_address_d0fc3eb2249732967174b4da.reference = {
    __cReference: true,
    get value() { return DOORTILE20____header_global_f631add8c4ceee22; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:313
export const VIEWSCREEN2____header_global_143cbc109a548ee4 = ((((((499) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c0b052e2df276af15282b6c6() {
  return __cxx_static_address_c0b052e2df276af15282b6c6.reference || (__cxx_static_address_c0b052e2df276af15282b6c6.reference = {
    __cReference: true,
    get value() { return VIEWSCREEN2____header_global_143cbc109a548ee4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:314
export const VIEWSCREEN____header_global_d5ff2f30a2e133b1 = ((((((502) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e7ca2aafe49836bfbfad6eb5() {
  return __cxx_static_address_e7ca2aafe49836bfbfad6eb5.reference || (__cxx_static_address_e7ca2aafe49836bfbfad6eb5.reference = {
    __cReference: true,
    get value() { return VIEWSCREEN____header_global_d5ff2f30a2e133b1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:315
export const GLASS____header_global_332c93e82cdc0d5b = ((((((503) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a92508913f85bd77167f8e5a() {
  return __cxx_static_address_a92508913f85bd77167f8e5a.reference || (__cxx_static_address_a92508913f85bd77167f8e5a.reference = {
    __cReference: true,
    get value() { return GLASS____header_global_332c93e82cdc0d5b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:316
export const GLASS2____header_global_ad461620fc09bfc4 = ((((((504) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fa408f4bf576c9d68ca7c0a9() {
  return __cxx_static_address_fa408f4bf576c9d68ca7c0a9.reference || (__cxx_static_address_fa408f4bf576c9d68ca7c0a9.reference = {
    __cReference: true,
    get value() { return GLASS2____header_global_ad461620fc09bfc4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:317
export const STAINGLASS1____header_global_7c258e66553cacb5 = ((((((510) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_229b6d03bd82cf832010aeaf() {
  return __cxx_static_address_229b6d03bd82cf832010aeaf.reference || (__cxx_static_address_229b6d03bd82cf832010aeaf.reference = {
    __cReference: true,
    get value() { return STAINGLASS1____header_global_7c258e66553cacb5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:318
export const MASKWALL5____header_global_748daa95fd5d0a51 = ((((((514) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_75b734f082ec4a8d3c2311d8() {
  return __cxx_static_address_75b734f082ec4a8d3c2311d8.reference || (__cxx_static_address_75b734f082ec4a8d3c2311d8.reference = {
    __cReference: true,
    get value() { return MASKWALL5____header_global_748daa95fd5d0a51; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:319
export const SATELITE____header_global_a64df77a286dd79a = ((((((516) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_46a4044bb1aa073ad892d3a0() {
  return __cxx_static_address_46a4044bb1aa073ad892d3a0.reference || (__cxx_static_address_46a4044bb1aa073ad892d3a0.reference = {
    __cReference: true,
    get value() { return SATELITE____header_global_a64df77a286dd79a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:320
export const FUELPOD____header_global_3bbeb250886dc6de = ((((((517) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_246bd5dee46b6d604126e1d6() {
  return __cxx_static_address_246bd5dee46b6d604126e1d6.reference || (__cxx_static_address_246bd5dee46b6d604126e1d6.reference = {
    __cReference: true,
    get value() { return FUELPOD____header_global_3bbeb250886dc6de; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:321
export const CRACK1____header_global_8044e90dcf588ad3 = ((((((546) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_66388d59577c7604f3d99c60() {
  return __cxx_static_address_66388d59577c7604f3d99c60.reference || (__cxx_static_address_66388d59577c7604f3d99c60.reference = {
    __cReference: true,
    get value() { return CRACK1____header_global_8044e90dcf588ad3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:322
export const CRACK2____header_global_e5528d5eec03aa6e = ((((((547) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6ab5543024bf8e5a4eef7af6() {
  return __cxx_static_address_6ab5543024bf8e5a4eef7af6.reference || (__cxx_static_address_6ab5543024bf8e5a4eef7af6.reference = {
    __cReference: true,
    get value() { return CRACK2____header_global_e5528d5eec03aa6e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:323
export const CRACK3____header_global_814cc7d62c1e23df = ((((((548) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_28064db65e0a6d46b60bf8a5() {
  return __cxx_static_address_28064db65e0a6d46b60bf8a5.reference || (__cxx_static_address_28064db65e0a6d46b60bf8a5.reference = {
    __cReference: true,
    get value() { return CRACK3____header_global_814cc7d62c1e23df; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:324
export const CRACK4____header_global_0ed2643826eb5415 = ((((((549) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4a3fcb7eb75b1bd5c6dfc2f6() {
  return __cxx_static_address_4a3fcb7eb75b1bd5c6dfc2f6.reference || (__cxx_static_address_4a3fcb7eb75b1bd5c6dfc2f6.reference = {
    __cReference: true,
    get value() { return CRACK4____header_global_0ed2643826eb5415; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:325
export const FOOTPRINTS____header_global_c65d9b903376418f = ((((((550) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bd4025c477be859e7cfa763e() {
  return __cxx_static_address_bd4025c477be859e7cfa763e.reference || (__cxx_static_address_bd4025c477be859e7cfa763e.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS____header_global_c65d9b903376418f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:326
export const DOMELITE____header_global_591e8ba46f594c0d = ((((((551) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3eaec82629e3fb998167d4b5() {
  return __cxx_static_address_3eaec82629e3fb998167d4b5.reference || (__cxx_static_address_3eaec82629e3fb998167d4b5.reference = {
    __cReference: true,
    get value() { return DOMELITE____header_global_591e8ba46f594c0d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:327
export const CAMERAPOLE____header_global_fdaae86a6f30ff20 = ((((((554) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_afe01115f0aa013d2937871d() {
  return __cxx_static_address_afe01115f0aa013d2937871d.reference || (__cxx_static_address_afe01115f0aa013d2937871d.reference = {
    __cReference: true,
    get value() { return CAMERAPOLE____header_global_fdaae86a6f30ff20; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:328
export const CHAIR1____header_global_0c098513197dbb74 = ((((((556) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3d4644bde0fc3bbd56caca8f() {
  return __cxx_static_address_3d4644bde0fc3bbd56caca8f.reference || (__cxx_static_address_3d4644bde0fc3bbd56caca8f.reference = {
    __cReference: true,
    get value() { return CHAIR1____header_global_0c098513197dbb74; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:329
export const CHAIR2____header_global_24c47341adc68284 = ((((((557) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_11282b4421f9dd404db5a13f() {
  return __cxx_static_address_11282b4421f9dd404db5a13f.reference || (__cxx_static_address_11282b4421f9dd404db5a13f.reference = {
    __cReference: true,
    get value() { return CHAIR2____header_global_24c47341adc68284; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:330
export const BROKENCHAIR____header_global_7d1d768d3deee7a1 = ((((((559) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4bbfb7d850fdab6417a6d560() {
  return __cxx_static_address_4bbfb7d850fdab6417a6d560.reference || (__cxx_static_address_4bbfb7d850fdab6417a6d560.reference = {
    __cReference: true,
    get value() { return BROKENCHAIR____header_global_7d1d768d3deee7a1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:331
export const MIRROR____header_global_81d62bee01c50b86 = ((((((560) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1c690f0479b11d16b0a392d3() {
  return __cxx_static_address_1c690f0479b11d16b0a392d3.reference || (__cxx_static_address_1c690f0479b11d16b0a392d3.reference = {
    __cReference: true,
    get value() { return MIRROR____header_global_81d62bee01c50b86; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:332
export const WATERFOUNTAIN____header_global_6a1da64b8eecda26 = ((((((563) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b359370298f305d955eb61b4() {
  return __cxx_static_address_b359370298f305d955eb61b4.reference || (__cxx_static_address_b359370298f305d955eb61b4.reference = {
    __cReference: true,
    get value() { return WATERFOUNTAIN____header_global_6a1da64b8eecda26; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:333
export const WATERFOUNTAINBROKE____header_global_8a4f477ddbfee2a4 = ((((((567) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_62e87864ff252cd58358d014() {
  return __cxx_static_address_62e87864ff252cd58358d014.reference || (__cxx_static_address_62e87864ff252cd58358d014.reference = {
    __cReference: true,
    get value() { return WATERFOUNTAINBROKE____header_global_8a4f477ddbfee2a4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:334
export const FEMMAG1____header_global_741e801cc2c2eaf3 = ((((((568) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e24821ee0f1ef9f8c625dfbc() {
  return __cxx_static_address_e24821ee0f1ef9f8c625dfbc.reference || (__cxx_static_address_e24821ee0f1ef9f8c625dfbc.reference = {
    __cReference: true,
    get value() { return FEMMAG1____header_global_741e801cc2c2eaf3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:335
export const TOILET____header_global_9037877c85cf2e24 = ((((((569) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9e69dd115ffef63dde257fe6() {
  return __cxx_static_address_9e69dd115ffef63dde257fe6.reference || (__cxx_static_address_9e69dd115ffef63dde257fe6.reference = {
    __cReference: true,
    get value() { return TOILET____header_global_9037877c85cf2e24; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:336
export const STALL____header_global_6ec68ab0c138d49c = ((((((571) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_85dd5777124f7e95f4932373() {
  return __cxx_static_address_85dd5777124f7e95f4932373.reference || (__cxx_static_address_85dd5777124f7e95f4932373.reference = {
    __cReference: true,
    get value() { return STALL____header_global_6ec68ab0c138d49c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:337
export const STALLBROKE____header_global_d15f9eb7e6ff3a04 = ((((((573) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_20299b44ae8001d9282102c0() {
  return __cxx_static_address_20299b44ae8001d9282102c0.reference || (__cxx_static_address_20299b44ae8001d9282102c0.reference = {
    __cReference: true,
    get value() { return STALLBROKE____header_global_d15f9eb7e6ff3a04; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:338
export const FEMMAG2____header_global_d7b3c9d92c5f7a75 = ((((((577) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_93926382d86f0c2b00069d1c() {
  return __cxx_static_address_93926382d86f0c2b00069d1c.reference || (__cxx_static_address_93926382d86f0c2b00069d1c.reference = {
    __cReference: true,
    get value() { return FEMMAG2____header_global_d7b3c9d92c5f7a75; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:339
export const REACTOR2____header_global_08ee0e32e7c01ef7 = ((((((578) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9ef79530f82e96f7bfd27d00() {
  return __cxx_static_address_9ef79530f82e96f7bfd27d00.reference || (__cxx_static_address_9ef79530f82e96f7bfd27d00.reference = {
    __cReference: true,
    get value() { return REACTOR2____header_global_08ee0e32e7c01ef7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:340
export const REACTOR2BURNT____header_global_0bd61c5ec3d4bc7b = ((((((579) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c6067be41b59941a61990461() {
  return __cxx_static_address_c6067be41b59941a61990461.reference || (__cxx_static_address_c6067be41b59941a61990461.reference = {
    __cReference: true,
    get value() { return REACTOR2BURNT____header_global_0bd61c5ec3d4bc7b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:341
export const REACTOR2SPARK____header_global_501845d7d885e1a3 = ((((((580) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b104820bccebdbe04974f2a1() {
  return __cxx_static_address_b104820bccebdbe04974f2a1.reference || (__cxx_static_address_b104820bccebdbe04974f2a1.reference = {
    __cReference: true,
    get value() { return REACTOR2SPARK____header_global_501845d7d885e1a3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:342
export const GRATE1____header_global_ba0d765fbdd5edc7 = ((((((595) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d560c59e5aa0162e28530bd1() {
  return __cxx_static_address_d560c59e5aa0162e28530bd1.reference || (__cxx_static_address_d560c59e5aa0162e28530bd1.reference = {
    __cReference: true,
    get value() { return GRATE1____header_global_ba0d765fbdd5edc7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:343
export const BGRATE1____header_global_6e886813472a8277 = ((((((596) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0606a395ac4939b0cbed367e() {
  return __cxx_static_address_0606a395ac4939b0cbed367e.reference || (__cxx_static_address_0606a395ac4939b0cbed367e.reference = {
    __cReference: true,
    get value() { return BGRATE1____header_global_6e886813472a8277; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:344
export const SOLARPANNEL____header_global_1a848fc57f31e3a7 = ((((((602) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6542a8fa5f211f62b444338d() {
  return __cxx_static_address_6542a8fa5f211f62b444338d.reference || (__cxx_static_address_6542a8fa5f211f62b444338d.reference = {
    __cReference: true,
    get value() { return SOLARPANNEL____header_global_1a848fc57f31e3a7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:345
export const NAKED1____header_global_206d17adf281f6bf = ((((((603) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8d88e1af81d369816716de0b() {
  return __cxx_static_address_8d88e1af81d369816716de0b.reference || (__cxx_static_address_8d88e1af81d369816716de0b.reference = {
    __cReference: true,
    get value() { return NAKED1____header_global_206d17adf281f6bf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:346
export const ANTENNA____header_global_4ca7458ed0d54cde = ((((((607) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b592d601f8ee56c68d4bb7d0() {
  return __cxx_static_address_b592d601f8ee56c68d4bb7d0.reference || (__cxx_static_address_b592d601f8ee56c68d4bb7d0.reference = {
    __cReference: true,
    get value() { return ANTENNA____header_global_4ca7458ed0d54cde; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:347
export const MASKWALL12____header_global_caf2111ae5d23ae4 = ((((((609) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_efd15098615179e54204cbb0() {
  return __cxx_static_address_efd15098615179e54204cbb0.reference || (__cxx_static_address_efd15098615179e54204cbb0.reference = {
    __cReference: true,
    get value() { return MASKWALL12____header_global_caf2111ae5d23ae4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:348
export const TOILETBROKE____header_global_12cf9fd22d9a96b6 = ((((((615) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b831727030daeb0581d79fc2() {
  return __cxx_static_address_b831727030daeb0581d79fc2.reference || (__cxx_static_address_b831727030daeb0581d79fc2.reference = {
    __cReference: true,
    get value() { return TOILETBROKE____header_global_12cf9fd22d9a96b6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:349
export const PIPE2____header_global_085205993bffbdc0 = ((((((616) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_63f853ec2cee7f5b5ec5d2ce() {
  return __cxx_static_address_63f853ec2cee7f5b5ec5d2ce.reference || (__cxx_static_address_63f853ec2cee7f5b5ec5d2ce.reference = {
    __cReference: true,
    get value() { return PIPE2____header_global_085205993bffbdc0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:350
export const PIPE1B____header_global_3a3ef1fcb30fafee = ((((((617) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e96593133b92aaadedc11ecc() {
  return __cxx_static_address_e96593133b92aaadedc11ecc.reference || (__cxx_static_address_e96593133b92aaadedc11ecc.reference = {
    __cReference: true,
    get value() { return PIPE1B____header_global_3a3ef1fcb30fafee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:351
export const PIPE3____header_global_bc84b5d137f3e10e = ((((((618) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_55ab65735286cbce50a1f613() {
  return __cxx_static_address_55ab65735286cbce50a1f613.reference || (__cxx_static_address_55ab65735286cbce50a1f613.reference = {
    __cReference: true,
    get value() { return PIPE3____header_global_bc84b5d137f3e10e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:352
export const PIPE1____header_global_d2d9370eecc1b532 = ((((((619) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b808825a1a352fb3d45c066d() {
  return __cxx_static_address_b808825a1a352fb3d45c066d.reference || (__cxx_static_address_b808825a1a352fb3d45c066d.reference = {
    __cReference: true,
    get value() { return PIPE1____header_global_d2d9370eecc1b532; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:353
export const CAMERA1____header_global_5d260f674ba94624 = ((((((621) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_effc7b7a7b72aa02d853d298() {
  return __cxx_static_address_effc7b7a7b72aa02d853d298.reference || (__cxx_static_address_effc7b7a7b72aa02d853d298.reference = {
    __cReference: true,
    get value() { return CAMERA1____header_global_5d260f674ba94624; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:354
export const PIPE2B____header_global_9401c316b72ef221 = ((((((633) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_03d22951659cc0c0372096c5() {
  return __cxx_static_address_03d22951659cc0c0372096c5.reference || (__cxx_static_address_03d22951659cc0c0372096c5.reference = {
    __cReference: true,
    get value() { return PIPE2B____header_global_9401c316b72ef221; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:355
export const BOLT1____header_global_05d9704815baf360 = ((((((634) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f78d982a62e15f7ce86a1e38() {
  return __cxx_static_address_f78d982a62e15f7ce86a1e38.reference || (__cxx_static_address_f78d982a62e15f7ce86a1e38.reference = {
    __cReference: true,
    get value() { return BOLT1____header_global_05d9704815baf360; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:356
export const W_NUMBERS____header_global_e69a9de01d6e381b = ((((((640) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dbbc89bfc364622a4b5799df() {
  return __cxx_static_address_dbbc89bfc364622a4b5799df.reference || (__cxx_static_address_dbbc89bfc364622a4b5799df.reference = {
    __cReference: true,
    get value() { return W_NUMBERS____header_global_e69a9de01d6e381b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:357
export const WATERDRIP____header_global_a8d4a283b68583ee = ((((((660) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_59540f2258fc7df1a7c0755e() {
  return __cxx_static_address_59540f2258fc7df1a7c0755e.reference || (__cxx_static_address_59540f2258fc7df1a7c0755e.reference = {
    __cReference: true,
    get value() { return WATERDRIP____header_global_a8d4a283b68583ee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:358
export const WATERBUBBLE____header_global_697b549bdcc3cb5e = ((((((661) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6e5d779374239fa747e2ec2f() {
  return __cxx_static_address_6e5d779374239fa747e2ec2f.reference || (__cxx_static_address_6e5d779374239fa747e2ec2f.reference = {
    __cReference: true,
    get value() { return WATERBUBBLE____header_global_697b549bdcc3cb5e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:359
export const WATERBUBBLEMAKER____header_global_3c50328d31e9927a = ((((((662) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_67821d8ab951e800d53cb513() {
  return __cxx_static_address_67821d8ab951e800d53cb513.reference || (__cxx_static_address_67821d8ab951e800d53cb513.reference = {
    __cReference: true,
    get value() { return WATERBUBBLEMAKER____header_global_3c50328d31e9927a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:360
export const W_FORCEFIELD____header_global_664633b53ad5a288 = ((((((663) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4f783edf4d5c366877eaba7a() {
  return __cxx_static_address_4f783edf4d5c366877eaba7a.reference || (__cxx_static_address_4f783edf4d5c366877eaba7a.reference = {
    __cReference: true,
    get value() { return W_FORCEFIELD____header_global_664633b53ad5a288; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:361
export const VACUUM____header_global_9e2fcb39a9bd3f3c = ((((((669) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9e1a839b9072c3e87ee0ae36() {
  return __cxx_static_address_9e1a839b9072c3e87ee0ae36.reference || (__cxx_static_address_9e1a839b9072c3e87ee0ae36.reference = {
    __cReference: true,
    get value() { return VACUUM____header_global_9e2fcb39a9bd3f3c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:362
export const FOOTPRINTS2____header_global_43fdb44993ba2028 = ((((((672) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f2bf793d6fc751df565cbc06() {
  return __cxx_static_address_f2bf793d6fc751df565cbc06.reference || (__cxx_static_address_f2bf793d6fc751df565cbc06.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS2____header_global_43fdb44993ba2028; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:363
export const FOOTPRINTS3____header_global_8c93b5b5c122a9b4 = ((((((673) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d961c1280c014783593ffc76() {
  return __cxx_static_address_d961c1280c014783593ffc76.reference || (__cxx_static_address_d961c1280c014783593ffc76.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS3____header_global_8c93b5b5c122a9b4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:364
export const FOOTPRINTS4____header_global_a95ff546cc4f48d1 = ((((((674) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_74590190728d33873576bd29() {
  return __cxx_static_address_74590190728d33873576bd29.reference || (__cxx_static_address_74590190728d33873576bd29.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS4____header_global_a95ff546cc4f48d1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:365
export const EGG____header_global_5ff4573d12d1b151 = ((((((675) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_955b4240d39072154b560a4e() {
  return __cxx_static_address_955b4240d39072154b560a4e.reference || (__cxx_static_address_955b4240d39072154b560a4e.reference = {
    __cReference: true,
    get value() { return EGG____header_global_5ff4573d12d1b151; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:366
export const SCALE____header_global_ab0b5e5674b48bc3 = ((((((678) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8a491f9f88157e53fefdc920() {
  return __cxx_static_address_8a491f9f88157e53fefdc920.reference || (__cxx_static_address_8a491f9f88157e53fefdc920.reference = {
    __cReference: true,
    get value() { return SCALE____header_global_ab0b5e5674b48bc3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:367
export const CHAIR3____header_global_517ba5f44c8eee67 = ((((((680) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b02f116b0bc93aef61a5b9b3() {
  return __cxx_static_address_b02f116b0bc93aef61a5b9b3.reference || (__cxx_static_address_b02f116b0bc93aef61a5b9b3.reference = {
    __cReference: true,
    get value() { return CHAIR3____header_global_517ba5f44c8eee67; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:368
export const CAMERALIGHT____header_global_4099e20a421bc273 = ((((((685) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_33181edfb0d35018631741b6() {
  return __cxx_static_address_33181edfb0d35018631741b6.reference || (__cxx_static_address_33181edfb0d35018631741b6.reference = {
    __cReference: true,
    get value() { return CAMERALIGHT____header_global_4099e20a421bc273; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:369
export const MOVIECAMERA____header_global_0b4a1de15740a318 = ((((((686) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bc9b01fec3269339a9784580() {
  return __cxx_static_address_bc9b01fec3269339a9784580.reference || (__cxx_static_address_bc9b01fec3269339a9784580.reference = {
    __cReference: true,
    get value() { return MOVIECAMERA____header_global_0b4a1de15740a318; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:370
export const IVUNIT____header_global_bc121af9ec608d1b = ((((((689) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a5cffc5b8a445aa7586ea8a5() {
  return __cxx_static_address_a5cffc5b8a445aa7586ea8a5.reference || (__cxx_static_address_a5cffc5b8a445aa7586ea8a5.reference = {
    __cReference: true,
    get value() { return IVUNIT____header_global_bc121af9ec608d1b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:371
export const POT1____header_global_b1da27e8ee161841 = ((((((694) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_392bc16170530fc51707f903() {
  return __cxx_static_address_392bc16170530fc51707f903.reference || (__cxx_static_address_392bc16170530fc51707f903.reference = {
    __cReference: true,
    get value() { return POT1____header_global_b1da27e8ee161841; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:372
export const POT2____header_global_d5bf0ccddcfbe168 = ((((((695) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_535824a31629de1cc3db6a9d() {
  return __cxx_static_address_535824a31629de1cc3db6a9d.reference || (__cxx_static_address_535824a31629de1cc3db6a9d.reference = {
    __cReference: true,
    get value() { return POT2____header_global_d5bf0ccddcfbe168; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:373
export const POT3____header_global_f1a1a181388846ac = ((((((697) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_344dc1ad61d120114d628417() {
  return __cxx_static_address_344dc1ad61d120114d628417.reference || (__cxx_static_address_344dc1ad61d120114d628417.reference = {
    __cReference: true,
    get value() { return POT3____header_global_f1a1a181388846ac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:374
export const PIPE3B____header_global_6fee9ad64c3a0eb7 = ((((((700) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_90fbcc24ba5d6235cb578b82() {
  return __cxx_static_address_90fbcc24ba5d6235cb578b82.reference || (__cxx_static_address_90fbcc24ba5d6235cb578b82.reference = {
    __cReference: true,
    get value() { return PIPE3B____header_global_6fee9ad64c3a0eb7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:375
export const WALLLIGHT3____header_global_0b0b23f0e1d6a81f = ((((((701) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_25d988e10078130f4c86476b() {
  return __cxx_static_address_25d988e10078130f4c86476b.reference || (__cxx_static_address_25d988e10078130f4c86476b.reference = {
    __cReference: true,
    get value() { return WALLLIGHT3____header_global_0b0b23f0e1d6a81f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:376
export const WALLLIGHTBUST3____header_global_4b67399cd4115a79 = ((((((702) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c951c1b8ea493205743d1518() {
  return __cxx_static_address_c951c1b8ea493205743d1518.reference || (__cxx_static_address_c951c1b8ea493205743d1518.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST3____header_global_4b67399cd4115a79; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:377
export const WALLLIGHT1____header_global_d98e7d2d756a9cbb = ((((((703) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aba9c9bf375d29e32f6f8c76() {
  return __cxx_static_address_aba9c9bf375d29e32f6f8c76.reference || (__cxx_static_address_aba9c9bf375d29e32f6f8c76.reference = {
    __cReference: true,
    get value() { return WALLLIGHT1____header_global_d98e7d2d756a9cbb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:378
export const WALLLIGHTBUST1____header_global_34e0fec5104862c9 = ((((((704) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dda3b6708bdf11a9a243ab49() {
  return __cxx_static_address_dda3b6708bdf11a9a243ab49.reference || (__cxx_static_address_dda3b6708bdf11a9a243ab49.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST1____header_global_34e0fec5104862c9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:379
export const WALLLIGHT2____header_global_ba1663d8d616bc5b = ((((((705) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f93aed311845b565fc07bf4e() {
  return __cxx_static_address_f93aed311845b565fc07bf4e.reference || (__cxx_static_address_f93aed311845b565fc07bf4e.reference = {
    __cReference: true,
    get value() { return WALLLIGHT2____header_global_ba1663d8d616bc5b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:380
export const WALLLIGHTBUST2____header_global_b038d7323d7e55c6 = ((((((706) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d393ea913dca2756279d9362() {
  return __cxx_static_address_d393ea913dca2756279d9362.reference || (__cxx_static_address_d393ea913dca2756279d9362.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST2____header_global_b038d7323d7e55c6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:381
export const LIGHTSWITCH2____header_global_d818222a031ac783 = ((((((712) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e6fe18a7a4f0c9269c7ab79c() {
  return __cxx_static_address_e6fe18a7a4f0c9269c7ab79c.reference || (__cxx_static_address_e6fe18a7a4f0c9269c7ab79c.reference = {
    __cReference: true,
    get value() { return LIGHTSWITCH2____header_global_d818222a031ac783; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:382
export const WAITTOBESEATED____header_global_b5ec35a51291c254 = ((((((716) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3656aef827c261b40e178b99() {
  return __cxx_static_address_3656aef827c261b40e178b99.reference || (__cxx_static_address_3656aef827c261b40e178b99.reference = {
    __cReference: true,
    get value() { return WAITTOBESEATED____header_global_b5ec35a51291c254; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:383
export const DOORTILE14____header_global_f369a72f1a46c958 = ((((((717) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e310602285b96eceeab49330() {
  return __cxx_static_address_e310602285b96eceeab49330.reference || (__cxx_static_address_e310602285b96eceeab49330.reference = {
    __cReference: true,
    get value() { return DOORTILE14____header_global_f369a72f1a46c958; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:384
export const STATUE____header_global_8f84943c6e2d9b6e = ((((((753) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c8d5b0a47c4f6232fcb73799() {
  return __cxx_static_address_c8d5b0a47c4f6232fcb73799.reference || (__cxx_static_address_c8d5b0a47c4f6232fcb73799.reference = {
    __cReference: true,
    get value() { return STATUE____header_global_8f84943c6e2d9b6e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:385
export const MIKE____header_global_0b0bce63169f1664 = ((((((762) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dfb67128ed03368d8c06f33a() {
  return __cxx_static_address_dfb67128ed03368d8c06f33a.reference || (__cxx_static_address_dfb67128ed03368d8c06f33a.reference = {
    __cReference: true,
    get value() { return MIKE____header_global_0b0bce63169f1664; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:386
export const VASE____header_global_a7623c0e9599f0f5 = ((((((765) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_033050708cfa2ca4e378500e() {
  return __cxx_static_address_033050708cfa2ca4e378500e.reference || (__cxx_static_address_033050708cfa2ca4e378500e.reference = {
    __cReference: true,
    get value() { return VASE____header_global_a7623c0e9599f0f5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:387
export const SUSHIPLATE1____header_global_498df1e0345564ba = ((((((768) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c3130b536ac23729c918215a() {
  return __cxx_static_address_c3130b536ac23729c918215a.reference || (__cxx_static_address_c3130b536ac23729c918215a.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE1____header_global_498df1e0345564ba; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:388
export const SUSHIPLATE2____header_global_2bf949804e4a3221 = ((((((769) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_762a34d3f8b1c33dea3c5025() {
  return __cxx_static_address_762a34d3f8b1c33dea3c5025.reference || (__cxx_static_address_762a34d3f8b1c33dea3c5025.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE2____header_global_2bf949804e4a3221; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:389
export const SUSHIPLATE3____header_global_4a77d85bfb496383 = ((((((774) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c4ae0f779b670952c3968d10() {
  return __cxx_static_address_c4ae0f779b670952c3968d10.reference || (__cxx_static_address_c4ae0f779b670952c3968d10.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE3____header_global_4a77d85bfb496383; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:390
export const SUSHIPLATE4____header_global_c4bec702c2432ea0 = ((((((779) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b80de8b3b007a06339911930() {
  return __cxx_static_address_b80de8b3b007a06339911930.reference || (__cxx_static_address_b80de8b3b007a06339911930.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE4____header_global_c4bec702c2432ea0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:391
export const DOORTILE16____header_global_8c99df32fd8e80f8 = ((((((781) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8f7b62275b59d18ad77bb400() {
  return __cxx_static_address_8f7b62275b59d18ad77bb400.reference || (__cxx_static_address_8f7b62275b59d18ad77bb400.reference = {
    __cReference: true,
    get value() { return DOORTILE16____header_global_8c99df32fd8e80f8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:392
export const SUSHIPLATE5____header_global_ad7c931d786604f0 = ((((((792) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9b58bcbe1713020fe0532473() {
  return __cxx_static_address_9b58bcbe1713020fe0532473.reference || (__cxx_static_address_9b58bcbe1713020fe0532473.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE5____header_global_ad7c931d786604f0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:393
export const OJ____header_global_a7222269d55a4b5b = ((((((806) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b6e49e7b6850101ea6985458() {
  return __cxx_static_address_b6e49e7b6850101ea6985458.reference || (__cxx_static_address_b6e49e7b6850101ea6985458.reference = {
    __cReference: true,
    get value() { return OJ____header_global_a7222269d55a4b5b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:394
export const MASKWALL13____header_global_b96f07f0e588d63f = ((((((830) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0f8b9bdea0123bdeb8d387cc() {
  return __cxx_static_address_0f8b9bdea0123bdeb8d387cc.reference || (__cxx_static_address_0f8b9bdea0123bdeb8d387cc.reference = {
    __cReference: true,
    get value() { return MASKWALL13____header_global_b96f07f0e588d63f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:395
export const HURTRAIL____header_global_707e91826841c90f = ((((((859) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0ebb262359d262177953b314() {
  return __cxx_static_address_0ebb262359d262177953b314.reference || (__cxx_static_address_0ebb262359d262177953b314.reference = {
    __cReference: true,
    get value() { return HURTRAIL____header_global_707e91826841c90f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:396
export const POWERSWITCH1____header_global_dcecfb873760eebe = ((((((860) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2861aaef211ab4da98dca2ee() {
  return __cxx_static_address_2861aaef211ab4da98dca2ee.reference || (__cxx_static_address_2861aaef211ab4da98dca2ee.reference = {
    __cReference: true,
    get value() { return POWERSWITCH1____header_global_dcecfb873760eebe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:397
export const LOCKSWITCH1____header_global_74e8e6083f00c54f = ((((((862) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_24284af441a2638a0e0332c7() {
  return __cxx_static_address_24284af441a2638a0e0332c7.reference || (__cxx_static_address_24284af441a2638a0e0332c7.reference = {
    __cReference: true,
    get value() { return LOCKSWITCH1____header_global_74e8e6083f00c54f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:398
export const POWERSWITCH2____header_global_76d848fd040fed82 = ((((((864) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_61413acc3b3928141da7e32a() {
  return __cxx_static_address_61413acc3b3928141da7e32a.reference || (__cxx_static_address_61413acc3b3928141da7e32a.reference = {
    __cReference: true,
    get value() { return POWERSWITCH2____header_global_76d848fd040fed82; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:399
export const ATM____header_global_57f5d1b7a2e93e4b = ((((((867) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f61964db5234078dde427470() {
  return __cxx_static_address_f61964db5234078dde427470.reference || (__cxx_static_address_f61964db5234078dde427470.reference = {
    __cReference: true,
    get value() { return ATM____header_global_57f5d1b7a2e93e4b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:400
export const STATUEFLASH____header_global_546e758fc373e981 = ((((((869) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7b8fda7e486c21fd563470a4() {
  return __cxx_static_address_7b8fda7e486c21fd563470a4.reference || (__cxx_static_address_7b8fda7e486c21fd563470a4.reference = {
    __cReference: true,
    get value() { return STATUEFLASH____header_global_546e758fc373e981; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:401
export const ATMBROKE____header_global_f804ce2692e232b5 = ((((((888) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b9f257c812884d421023641e() {
  return __cxx_static_address_b9f257c812884d421023641e.reference || (__cxx_static_address_b9f257c812884d421023641e.reference = {
    __cReference: true,
    get value() { return ATMBROKE____header_global_f804ce2692e232b5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:402
export const STRIPEBALL____header_global_501e1b9b74ffbc6b = ((((((901) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9dad981671355430ff1201ec() {
  return __cxx_static_address_9dad981671355430ff1201ec.reference || (__cxx_static_address_9dad981671355430ff1201ec.reference = {
    __cReference: true,
    get value() { return STRIPEBALL____header_global_501e1b9b74ffbc6b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:403
export const QUEBALL____header_global_6603fc49d9c0ae70 = ((((((902) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_acabca78d35fdecde8bb5ebd() {
  return __cxx_static_address_acabca78d35fdecde8bb5ebd.reference || (__cxx_static_address_acabca78d35fdecde8bb5ebd.reference = {
    __cReference: true,
    get value() { return QUEBALL____header_global_6603fc49d9c0ae70; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:404
export const POCKET____header_global_763de0e3956ae087 = ((((((903) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_29f29f6209631228c6a2abc4() {
  return __cxx_static_address_29f29f6209631228c6a2abc4.reference || (__cxx_static_address_29f29f6209631228c6a2abc4.reference = {
    __cReference: true,
    get value() { return POCKET____header_global_763de0e3956ae087; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:405
export const WOODENHORSE____header_global_da8bcab7ad91c57e = ((((((904) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8ce09dc879a42b6ccb681997() {
  return __cxx_static_address_8ce09dc879a42b6ccb681997.reference || (__cxx_static_address_8ce09dc879a42b6ccb681997.reference = {
    __cReference: true,
    get value() { return WOODENHORSE____header_global_da8bcab7ad91c57e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:406
export const TREE1____header_global_80adf3c358b73404 = ((((((908) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e1082d80165a8860b3f09fff() {
  return __cxx_static_address_e1082d80165a8860b3f09fff.reference || (__cxx_static_address_e1082d80165a8860b3f09fff.reference = {
    __cReference: true,
    get value() { return TREE1____header_global_80adf3c358b73404; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:407
export const TREE2____header_global_f243f0a4facf7db4 = ((((((910) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7e680dcc00f1f7fd64c036fb() {
  return __cxx_static_address_7e680dcc00f1f7fd64c036fb.reference || (__cxx_static_address_7e680dcc00f1f7fd64c036fb.reference = {
    __cReference: true,
    get value() { return TREE2____header_global_f243f0a4facf7db4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:408
export const CACTUS____header_global_3b840c4ad4bed114 = ((((((911) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e5bba4c30f25f7bce5175e35() {
  return __cxx_static_address_e5bba4c30f25f7bce5175e35.reference || (__cxx_static_address_e5bba4c30f25f7bce5175e35.reference = {
    __cReference: true,
    get value() { return CACTUS____header_global_3b840c4ad4bed114; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:409
export const MASKWALL2____header_global_d63019cc06581c80 = ((((((913) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dbaf86dd9f9ff418236cfeef() {
  return __cxx_static_address_dbaf86dd9f9ff418236cfeef.reference || (__cxx_static_address_dbaf86dd9f9ff418236cfeef.reference = {
    __cReference: true,
    get value() { return MASKWALL2____header_global_d63019cc06581c80; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:410
export const MASKWALL3____header_global_a43f99405db637ca = ((((((914) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a8910cd02ebf50e448b75a4a() {
  return __cxx_static_address_a8910cd02ebf50e448b75a4a.reference || (__cxx_static_address_a8910cd02ebf50e448b75a4a.reference = {
    __cReference: true,
    get value() { return MASKWALL3____header_global_a43f99405db637ca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:411
export const MASKWALL4____header_global_2433f2c9b965a606 = ((((((915) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_81b5e4858fe6f6bb5843142e() {
  return __cxx_static_address_81b5e4858fe6f6bb5843142e.reference || (__cxx_static_address_81b5e4858fe6f6bb5843142e.reference = {
    __cReference: true,
    get value() { return MASKWALL4____header_global_2433f2c9b965a606; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:412
export const FIREEXT____header_global_c8d6ee7ad289fd7d = ((((((916) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e36e7ea6566032ab400a3a1c() {
  return __cxx_static_address_e36e7ea6566032ab400a3a1c.reference || (__cxx_static_address_e36e7ea6566032ab400a3a1c.reference = {
    __cReference: true,
    get value() { return FIREEXT____header_global_c8d6ee7ad289fd7d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:413
export const TOILETWATER____header_global_b1f654be13266aae = ((((((921) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a394e904a61ee6c931c093bc() {
  return __cxx_static_address_a394e904a61ee6c931c093bc.reference || (__cxx_static_address_a394e904a61ee6c931c093bc.reference = {
    __cReference: true,
    get value() { return TOILETWATER____header_global_b1f654be13266aae; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:414
export const NEON1____header_global_7cf11daaceeec99f = ((((((925) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8e2224cd84ff8bdf719fbc95() {
  return __cxx_static_address_8e2224cd84ff8bdf719fbc95.reference || (__cxx_static_address_8e2224cd84ff8bdf719fbc95.reference = {
    __cReference: true,
    get value() { return NEON1____header_global_7cf11daaceeec99f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:415
export const NEON2____header_global_9e82c6296cc84c4c = ((((((926) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d608333cb356fee43964ff3b() {
  return __cxx_static_address_d608333cb356fee43964ff3b.reference || (__cxx_static_address_d608333cb356fee43964ff3b.reference = {
    __cReference: true,
    get value() { return NEON2____header_global_9e82c6296cc84c4c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:416
export const CACTUSBROKE____header_global_d33894ad0b7e67ff = ((((((939) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_07102aeeb2d599c1ae3e5360() {
  return __cxx_static_address_07102aeeb2d599c1ae3e5360.reference || (__cxx_static_address_07102aeeb2d599c1ae3e5360.reference = {
    __cReference: true,
    get value() { return CACTUSBROKE____header_global_d33894ad0b7e67ff; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:417
export const BOUNCEMINE____header_global_4eef92acf80c44bd = ((((((940) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9020100eef0d8cbb747aa3f9() {
  return __cxx_static_address_9020100eef0d8cbb747aa3f9.reference || (__cxx_static_address_9020100eef0d8cbb747aa3f9.reference = {
    __cReference: true,
    get value() { return BOUNCEMINE____header_global_4eef92acf80c44bd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:418
export const BROKEFIREHYDRENT____header_global_109e2c8fb4ed643e = ((((((950) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d8d9a20d5455f029dfbe95ea() {
  return __cxx_static_address_d8d9a20d5455f029dfbe95ea.reference || (__cxx_static_address_d8d9a20d5455f029dfbe95ea.reference = {
    __cReference: true,
    get value() { return BROKEFIREHYDRENT____header_global_109e2c8fb4ed643e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:419
export const BOX____header_global_af052dafaf879e22 = ((((((951) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_04ef89a448ecdd70ab7b4d53() {
  return __cxx_static_address_04ef89a448ecdd70ab7b4d53.reference || (__cxx_static_address_04ef89a448ecdd70ab7b4d53.reference = {
    __cReference: true,
    get value() { return BOX____header_global_af052dafaf879e22; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:420
export const BULLETHOLE____header_global_c03909fd2bcdaacb = ((((((952) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_48c2004bbcc8ebc85edb7521() {
  return __cxx_static_address_48c2004bbcc8ebc85edb7521.reference || (__cxx_static_address_48c2004bbcc8ebc85edb7521.reference = {
    __cReference: true,
    get value() { return BULLETHOLE____header_global_c03909fd2bcdaacb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:421
export const BOTTLE1____header_global_8739107977452170 = ((((((954) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6b9d489a10f5a9ab27846ced() {
  return __cxx_static_address_6b9d489a10f5a9ab27846ced.reference || (__cxx_static_address_6b9d489a10f5a9ab27846ced.reference = {
    __cReference: true,
    get value() { return BOTTLE1____header_global_8739107977452170; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:422
export const BOTTLE2____header_global_a3d9e40c95712c18 = ((((((955) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4dcf7c1974e78079e9917f23() {
  return __cxx_static_address_4dcf7c1974e78079e9917f23.reference || (__cxx_static_address_4dcf7c1974e78079e9917f23.reference = {
    __cReference: true,
    get value() { return BOTTLE2____header_global_a3d9e40c95712c18; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:423
export const BOTTLE3____header_global_1e98d1dd3c6b17df = ((((((956) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a18192647c09897988093266() {
  return __cxx_static_address_a18192647c09897988093266.reference || (__cxx_static_address_a18192647c09897988093266.reference = {
    __cReference: true,
    get value() { return BOTTLE3____header_global_1e98d1dd3c6b17df; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:424
export const BOTTLE4____header_global_8244bf916da630ab = ((((((957) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ef1df6189215f808939c4a8a() {
  return __cxx_static_address_ef1df6189215f808939c4a8a.reference || (__cxx_static_address_ef1df6189215f808939c4a8a.reference = {
    __cReference: true,
    get value() { return BOTTLE4____header_global_8244bf916da630ab; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:425
export const FEMPIC5____header_global_3c7e5053e05af4c1 = ((((((963) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_85fbda623eb61c9dddca5aab() {
  return __cxx_static_address_85fbda623eb61c9dddca5aab.reference || (__cxx_static_address_85fbda623eb61c9dddca5aab.reference = {
    __cReference: true,
    get value() { return FEMPIC5____header_global_3c7e5053e05af4c1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:426
export const FEMPIC6____header_global_febdb796ce202aa7 = ((((((964) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ba363b308a8b4b3a298a6882() {
  return __cxx_static_address_ba363b308a8b4b3a298a6882.reference || (__cxx_static_address_ba363b308a8b4b3a298a6882.reference = {
    __cReference: true,
    get value() { return FEMPIC6____header_global_febdb796ce202aa7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:427
export const FEMPIC7____header_global_c82f89245e41b313 = ((((((965) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4a1e52d42a145038531d6c2a() {
  return __cxx_static_address_4a1e52d42a145038531d6c2a.reference || (__cxx_static_address_4a1e52d42a145038531d6c2a.reference = {
    __cReference: true,
    get value() { return FEMPIC7____header_global_c82f89245e41b313; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:428
export const HYDROPLANT____header_global_fb5045eff6576991 = ((((((969) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2863078d0cc7f253c115dce8() {
  return __cxx_static_address_2863078d0cc7f253c115dce8.reference || (__cxx_static_address_2863078d0cc7f253c115dce8.reference = {
    __cReference: true,
    get value() { return HYDROPLANT____header_global_fb5045eff6576991; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:429
export const OCEANSPRITE1____header_global_f1037176123fe3ce = ((((((971) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4d8feb95727dd3a5e324787a() {
  return __cxx_static_address_4d8feb95727dd3a5e324787a.reference || (__cxx_static_address_4d8feb95727dd3a5e324787a.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE1____header_global_f1037176123fe3ce; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:430
export const OCEANSPRITE2____header_global_ab4141215aba24d3 = ((((((972) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1266485ed6164d999ff11621() {
  return __cxx_static_address_1266485ed6164d999ff11621.reference || (__cxx_static_address_1266485ed6164d999ff11621.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE2____header_global_ab4141215aba24d3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:431
export const OCEANSPRITE3____header_global_040563a6c2132608 = ((((((973) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b1b9727580515bbdfe6b0e7f() {
  return __cxx_static_address_b1b9727580515bbdfe6b0e7f.reference || (__cxx_static_address_b1b9727580515bbdfe6b0e7f.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE3____header_global_040563a6c2132608; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:432
export const OCEANSPRITE4____header_global_7e7f1619d1485035 = ((((((974) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_781718184656dc23b179bd28() {
  return __cxx_static_address_781718184656dc23b179bd28.reference || (__cxx_static_address_781718184656dc23b179bd28.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE4____header_global_7e7f1619d1485035; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:433
export const OCEANSPRITE5____header_global_c470c6bb379944e6 = ((((((975) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fa17d6131a3e3a884870af9c() {
  return __cxx_static_address_fa17d6131a3e3a884870af9c.reference || (__cxx_static_address_fa17d6131a3e3a884870af9c.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE5____header_global_c470c6bb379944e6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:434
export const GENERICPOLE____header_global_96076f527bb60e0d = ((((((977) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_67c1360900e85b1410ac554e() {
  return __cxx_static_address_67c1360900e85b1410ac554e.reference || (__cxx_static_address_67c1360900e85b1410ac554e.reference = {
    __cReference: true,
    get value() { return GENERICPOLE____header_global_96076f527bb60e0d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:435
export const CONE____header_global_0fda4133ac297611 = ((((((978) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c3766d94d8a8226ef685f4bc() {
  return __cxx_static_address_c3766d94d8a8226ef685f4bc.reference || (__cxx_static_address_c3766d94d8a8226ef685f4bc.reference = {
    __cReference: true,
    get value() { return CONE____header_global_0fda4133ac297611; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:436
export const HANGLIGHT____header_global_d35e74acc9aa99fe = ((((((979) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_78ba0ede5393a32bb442c97f() {
  return __cxx_static_address_78ba0ede5393a32bb442c97f.reference || (__cxx_static_address_78ba0ede5393a32bb442c97f.reference = {
    __cReference: true,
    get value() { return HANGLIGHT____header_global_d35e74acc9aa99fe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:437
export const HYDRENT____header_global_1dbe55696f4b549e = ((((((981) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_df5cf176fc60dfdaaa950a22() {
  return __cxx_static_address_df5cf176fc60dfdaaa950a22.reference || (__cxx_static_address_df5cf176fc60dfdaaa950a22.reference = {
    __cReference: true,
    get value() { return HYDRENT____header_global_1dbe55696f4b549e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:438
export const MASKWALL14____header_global_73866f2676865366 = ((((((988) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c49c51d1bf5747d172b2fdec() {
  return __cxx_static_address_c49c51d1bf5747d172b2fdec.reference || (__cxx_static_address_c49c51d1bf5747d172b2fdec.reference = {
    __cReference: true,
    get value() { return MASKWALL14____header_global_73866f2676865366; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:439
export const TIRE____header_global_0e85ac03e5b42397 = ((((((990) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e60165498d6ac17a1b4e6f8f() {
  return __cxx_static_address_e60165498d6ac17a1b4e6f8f.reference || (__cxx_static_address_e60165498d6ac17a1b4e6f8f.reference = {
    __cReference: true,
    get value() { return TIRE____header_global_0e85ac03e5b42397; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:440
export const PIPE5____header_global_b884fefee7965591 = ((((((994) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_abc701a617164faac23a2cdf() {
  return __cxx_static_address_abc701a617164faac23a2cdf.reference || (__cxx_static_address_abc701a617164faac23a2cdf.reference = {
    __cReference: true,
    get value() { return PIPE5____header_global_b884fefee7965591; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:441
export const PIPE6____header_global_abb2716fd4f67cb9 = ((((((995) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c77b2407f2f3c3e5118596e7() {
  return __cxx_static_address_c77b2407f2f3c3e5118596e7.reference || (__cxx_static_address_c77b2407f2f3c3e5118596e7.reference = {
    __cReference: true,
    get value() { return PIPE6____header_global_abb2716fd4f67cb9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:442
export const PIPE4____header_global_8961e27578302614 = ((((((996) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7bae7e8b398a8a5058a5ecaf() {
  return __cxx_static_address_7bae7e8b398a8a5058a5ecaf.reference || (__cxx_static_address_7bae7e8b398a8a5058a5ecaf.reference = {
    __cReference: true,
    get value() { return PIPE4____header_global_8961e27578302614; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:443
export const PIPE4B____header_global_a09c70ef7525307f = ((((((997) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_459c4c81b7c9669dbb279b67() {
  return __cxx_static_address_459c4c81b7c9669dbb279b67.reference || (__cxx_static_address_459c4c81b7c9669dbb279b67.reference = {
    __cReference: true,
    get value() { return PIPE4B____header_global_a09c70ef7525307f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:444
export const BROKEHYDROPLANT____header_global_ec15847eea520cee = ((((((1003) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1e5d1f412e29c9326c86f5fb() {
  return __cxx_static_address_1e5d1f412e29c9326c86f5fb.reference || (__cxx_static_address_1e5d1f412e29c9326c86f5fb.reference = {
    __cReference: true,
    get value() { return BROKEHYDROPLANT____header_global_ec15847eea520cee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:445
export const PIPE5B____header_global_2cd1f2a57c05718f = ((((((1005) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9c451f8fe3f7993676c8e595() {
  return __cxx_static_address_9c451f8fe3f7993676c8e595.reference || (__cxx_static_address_9c451f8fe3f7993676c8e595.reference = {
    __cReference: true,
    get value() { return PIPE5B____header_global_2cd1f2a57c05718f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:446
export const NEON3____header_global_8dd10c0ead2e5e0a = ((((((1007) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ed2e9c9876333f0b157433f4() {
  return __cxx_static_address_ed2e9c9876333f0b157433f4.reference || (__cxx_static_address_ed2e9c9876333f0b157433f4.reference = {
    __cReference: true,
    get value() { return NEON3____header_global_8dd10c0ead2e5e0a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:447
export const NEON4____header_global_74da9401811cb495 = ((((((1008) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8f68186a080caade2b236bea() {
  return __cxx_static_address_8f68186a080caade2b236bea.reference || (__cxx_static_address_8f68186a080caade2b236bea.reference = {
    __cReference: true,
    get value() { return NEON4____header_global_74da9401811cb495; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:448
export const NEON5____header_global_d90f38b59bd076bd = ((((((1009) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fa01beb8f22d2cc8c150deb0() {
  return __cxx_static_address_fa01beb8f22d2cc8c150deb0.reference || (__cxx_static_address_fa01beb8f22d2cc8c150deb0.reference = {
    __cReference: true,
    get value() { return NEON5____header_global_d90f38b59bd076bd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:449
export const BOTTLE5____header_global_f482eb4748c30017 = ((((((1012) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_93de28d0e388fb2fd9c60115() {
  return __cxx_static_address_93de28d0e388fb2fd9c60115.reference || (__cxx_static_address_93de28d0e388fb2fd9c60115.reference = {
    __cReference: true,
    get value() { return BOTTLE5____header_global_f482eb4748c30017; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:450
export const BOTTLE6____header_global_12e2f094752c789a = ((((((1013) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b935006cebd60a0c58eaf777() {
  return __cxx_static_address_b935006cebd60a0c58eaf777.reference || (__cxx_static_address_b935006cebd60a0c58eaf777.reference = {
    __cReference: true,
    get value() { return BOTTLE6____header_global_12e2f094752c789a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:451
export const BOTTLE8____header_global_ab0b51a9a9d30a07 = ((((((1014) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cf58b72f50e59ccff19fa28b() {
  return __cxx_static_address_cf58b72f50e59ccff19fa28b.reference || (__cxx_static_address_cf58b72f50e59ccff19fa28b.reference = {
    __cReference: true,
    get value() { return BOTTLE8____header_global_ab0b51a9a9d30a07; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:452
export const SPOTLITE____header_global_de91f0bc2082f1dd = ((((((1020) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1b25806b1a18ea83fcd2843f() {
  return __cxx_static_address_1b25806b1a18ea83fcd2843f.reference || (__cxx_static_address_1b25806b1a18ea83fcd2843f.reference = {
    __cReference: true,
    get value() { return SPOTLITE____header_global_de91f0bc2082f1dd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:453
export const MASKWALL15____header_global_d53dbd471dc5220b = ((((((1024) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1fe20017dae64a25b471b4be() {
  return __cxx_static_address_1fe20017dae64a25b471b4be.reference || (__cxx_static_address_1fe20017dae64a25b471b4be.reference = {
    __cReference: true,
    get value() { return MASKWALL15____header_global_d53dbd471dc5220b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:454
export const BOTTLE7____header_global_eeb34db9c23bee25 = ((((((1025) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6b8569a7b091395dca1e0572() {
  return __cxx_static_address_6b8569a7b091395dca1e0572.reference || (__cxx_static_address_6b8569a7b091395dca1e0572.reference = {
    __cReference: true,
    get value() { return BOTTLE7____header_global_eeb34db9c23bee25; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:455
export const HORSEONSIDE____header_global_0842a12bce036608 = ((((((1026) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cb3d64925d427ec00f987e8d() {
  return __cxx_static_address_cb3d64925d427ec00f987e8d.reference || (__cxx_static_address_cb3d64925d427ec00f987e8d.reference = {
    __cReference: true,
    get value() { return HORSEONSIDE____header_global_0842a12bce036608; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:456
export const GLASSPIECES____header_global_b4460a738bef43e3 = ((((((1031) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5c3559eed9c0a7b59d055a42() {
  return __cxx_static_address_5c3559eed9c0a7b59d055a42.reference || (__cxx_static_address_5c3559eed9c0a7b59d055a42.reference = {
    __cReference: true,
    get value() { return GLASSPIECES____header_global_b4460a738bef43e3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:457
export const NEON6____header_global_224573b7909d8ebf = ((((((1046) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d5a394b0039868cde1bdd4e8() {
  return __cxx_static_address_d5a394b0039868cde1bdd4e8.reference || (__cxx_static_address_d5a394b0039868cde1bdd4e8.reference = {
    __cReference: true,
    get value() { return NEON6____header_global_224573b7909d8ebf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:458
export const MASKWALL6____header_global_4ebe4ccc8be4cf55 = ((((((1059) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2935e0780df83abd434c5ced() {
  return __cxx_static_address_2935e0780df83abd434c5ced.reference || (__cxx_static_address_2935e0780df83abd434c5ced.reference = {
    __cReference: true,
    get value() { return MASKWALL6____header_global_4ebe4ccc8be4cf55; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:459
export const RUBBERCAN____header_global_b760e95d730fa97c = ((((((1062) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_47048f77acf9fd373179092a() {
  return __cxx_static_address_47048f77acf9fd373179092a.reference || (__cxx_static_address_47048f77acf9fd373179092a.reference = {
    __cReference: true,
    get value() { return RUBBERCAN____header_global_b760e95d730fa97c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:460
export const PLUG____header_global_27d933eb89f49550 = ((((((1069) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_277abdde8fe8abd9224e5c3a() {
  return __cxx_static_address_277abdde8fe8abd9224e5c3a.reference || (__cxx_static_address_277abdde8fe8abd9224e5c3a.reference = {
    __cReference: true,
    get value() { return PLUG____header_global_27d933eb89f49550; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:461
export const OOZFILTER____header_global_ecd2bc9e03dd6326 = ((((((1079) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_04a06a26daaf3e7ac7bc065e() {
  return __cxx_static_address_04a06a26daaf3e7ac7bc065e.reference || (__cxx_static_address_04a06a26daaf3e7ac7bc065e.reference = {
    __cReference: true,
    get value() { return OOZFILTER____header_global_ecd2bc9e03dd6326; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:462
export const FLOORPLASMA____header_global_eae2e4088bfb19bc = ((((((1082) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b1ce788143c4e95df2d8f98d() {
  return __cxx_static_address_b1ce788143c4e95df2d8f98d.reference || (__cxx_static_address_b1ce788143c4e95df2d8f98d.reference = {
    __cReference: true,
    get value() { return FLOORPLASMA____header_global_eae2e4088bfb19bc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:463
export const REACTOR____header_global_4942f4be546bf4bd = ((((((1088) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0c864574ee0cd86613d24d1a() {
  return __cxx_static_address_0c864574ee0cd86613d24d1a.reference || (__cxx_static_address_0c864574ee0cd86613d24d1a.reference = {
    __cReference: true,
    get value() { return REACTOR____header_global_4942f4be546bf4bd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:464
export const REACTORSPARK____header_global_05f237c3d566b027 = ((((((1092) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5db426b57181880657ad1c03() {
  return __cxx_static_address_5db426b57181880657ad1c03.reference || (__cxx_static_address_5db426b57181880657ad1c03.reference = {
    __cReference: true,
    get value() { return REACTORSPARK____header_global_05f237c3d566b027; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:465
export const REACTORBURNT____header_global_fd7a47d8bf15902e = ((((((1096) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_06585666ee95c301a04a3712() {
  return __cxx_static_address_06585666ee95c301a04a3712.reference || (__cxx_static_address_06585666ee95c301a04a3712.reference = {
    __cReference: true,
    get value() { return REACTORBURNT____header_global_fd7a47d8bf15902e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:466
export const DOORTILE15____header_global_97a417225a8e11ea = ((((((1102) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e16d6df350427fc0245365ae() {
  return __cxx_static_address_e16d6df350427fc0245365ae.reference || (__cxx_static_address_e16d6df350427fc0245365ae.reference = {
    __cReference: true,
    get value() { return DOORTILE15____header_global_97a417225a8e11ea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:467
export const HANDSWITCH____header_global_f93b9900c9966f71 = ((((((1111) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0718103254d952d3c8c53ad1() {
  return __cxx_static_address_0718103254d952d3c8c53ad1.reference || (__cxx_static_address_0718103254d952d3c8c53ad1.reference = {
    __cReference: true,
    get value() { return HANDSWITCH____header_global_f93b9900c9966f71; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:468
export const CIRCLEPANNEL____header_global_37f876d73e19cd73 = ((((((1113) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_63808c54bbdd910e8b732eee() {
  return __cxx_static_address_63808c54bbdd910e8b732eee.reference || (__cxx_static_address_63808c54bbdd910e8b732eee.reference = {
    __cReference: true,
    get value() { return CIRCLEPANNEL____header_global_37f876d73e19cd73; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:469
export const CIRCLEPANNELBROKE____header_global_a1a85620d204f05a = ((((((1114) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_762d14f9e1e764879fbc329a() {
  return __cxx_static_address_762d14f9e1e764879fbc329a.reference || (__cxx_static_address_762d14f9e1e764879fbc329a.reference = {
    __cReference: true,
    get value() { return CIRCLEPANNELBROKE____header_global_a1a85620d204f05a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:470
export const PULLSWITCH____header_global_f79d32ab38f977cb = ((((((1122) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0a944ac1c76d224e31edd2c4() {
  return __cxx_static_address_0a944ac1c76d224e31edd2c4.reference || (__cxx_static_address_0a944ac1c76d224e31edd2c4.reference = {
    __cReference: true,
    get value() { return PULLSWITCH____header_global_f79d32ab38f977cb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:471
export const MASKWALL8____header_global_b5dee8106c6802eb = ((((((1124) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0f9ff35c4b7d8e3ab1574964() {
  return __cxx_static_address_0f9ff35c4b7d8e3ab1574964.reference || (__cxx_static_address_0f9ff35c4b7d8e3ab1574964.reference = {
    __cReference: true,
    get value() { return MASKWALL8____header_global_b5dee8106c6802eb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:472
export const BIGHOLE____header_global_b0d18127f6136697 = ((((((1141) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2e91aaf4d10959dc52377294() {
  return __cxx_static_address_2e91aaf4d10959dc52377294.reference || (__cxx_static_address_2e91aaf4d10959dc52377294.reference = {
    __cReference: true,
    get value() { return BIGHOLE____header_global_b0d18127f6136697; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:473
export const ALIENSWITCH____header_global_79d57d0bcdbb12c7 = ((((((1142) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_90e484c711a77d3c6dfffa22() {
  return __cxx_static_address_90e484c711a77d3c6dfffa22.reference || (__cxx_static_address_90e484c711a77d3c6dfffa22.reference = {
    __cReference: true,
    get value() { return ALIENSWITCH____header_global_79d57d0bcdbb12c7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:474
export const DOORTILE21____header_global_c3b9238cad871a85 = ((((((1144) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_84b932c610d7a4dd4f2e5a32() {
  return __cxx_static_address_84b932c610d7a4dd4f2e5a32.reference || (__cxx_static_address_84b932c610d7a4dd4f2e5a32.reference = {
    __cReference: true,
    get value() { return DOORTILE21____header_global_c3b9238cad871a85; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:475
export const HANDPRINTSWITCH____header_global_138d81b1e531a579 = ((((((1155) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6da5aed122bd94ca10a165a4() {
  return __cxx_static_address_6da5aed122bd94ca10a165a4.reference || (__cxx_static_address_6da5aed122bd94ca10a165a4.reference = {
    __cReference: true,
    get value() { return HANDPRINTSWITCH____header_global_138d81b1e531a579; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:476
export const BOTTLE10____header_global_a7fc0e1d5e8a744f = ((((((1157) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9644d5c3d7942e5ae6675273() {
  return __cxx_static_address_9644d5c3d7942e5ae6675273.reference || (__cxx_static_address_9644d5c3d7942e5ae6675273.reference = {
    __cReference: true,
    get value() { return BOTTLE10____header_global_a7fc0e1d5e8a744f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:477
export const BOTTLE11____header_global_1bddbbc5b0783bbc = ((((((1158) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fbcc2491124854e666782e53() {
  return __cxx_static_address_fbcc2491124854e666782e53.reference || (__cxx_static_address_fbcc2491124854e666782e53.reference = {
    __cReference: true,
    get value() { return BOTTLE11____header_global_1bddbbc5b0783bbc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:478
export const BOTTLE12____header_global_3addbab75df9e6c5 = ((((((1159) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9fc393ca844ccbc520322b5d() {
  return __cxx_static_address_9fc393ca844ccbc520322b5d.reference || (__cxx_static_address_9fc393ca844ccbc520322b5d.reference = {
    __cReference: true,
    get value() { return BOTTLE12____header_global_3addbab75df9e6c5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:479
export const BOTTLE13____header_global_2c7748f43dcd6f25 = ((((((1160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c2d2f5fa55ceb0a9625e315b() {
  return __cxx_static_address_c2d2f5fa55ceb0a9625e315b.reference || (__cxx_static_address_c2d2f5fa55ceb0a9625e315b.reference = {
    __cReference: true,
    get value() { return BOTTLE13____header_global_2c7748f43dcd6f25; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:480
export const BOTTLE14____header_global_272c739f645b2d66 = ((((((1161) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_10cbafb2cd270a25c15579ec() {
  return __cxx_static_address_10cbafb2cd270a25c15579ec.reference || (__cxx_static_address_10cbafb2cd270a25c15579ec.reference = {
    __cReference: true,
    get value() { return BOTTLE14____header_global_272c739f645b2d66; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:481
export const BOTTLE15____header_global_44e9afa01a1686f2 = ((((((1162) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b2b3bcd51a56da84f893fd0a() {
  return __cxx_static_address_b2b3bcd51a56da84f893fd0a.reference || (__cxx_static_address_b2b3bcd51a56da84f893fd0a.reference = {
    __cReference: true,
    get value() { return BOTTLE15____header_global_44e9afa01a1686f2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:482
export const BOTTLE16____header_global_c02dad5e93204aa9 = ((((((1163) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a38feb4bb631bd2efa60c1ae() {
  return __cxx_static_address_a38feb4bb631bd2efa60c1ae.reference || (__cxx_static_address_a38feb4bb631bd2efa60c1ae.reference = {
    __cReference: true,
    get value() { return BOTTLE16____header_global_c02dad5e93204aa9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:483
export const BOTTLE17____header_global_333b461a5eacee28 = ((((((1164) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f5c86ce9bc0f7df268528a62() {
  return __cxx_static_address_f5c86ce9bc0f7df268528a62.reference || (__cxx_static_address_f5c86ce9bc0f7df268528a62.reference = {
    __cReference: true,
    get value() { return BOTTLE17____header_global_333b461a5eacee28; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:484
export const BOTTLE18____header_global_01cb067e3edc1ed1 = ((((((1165) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8f75671c3f837925e93ad105() {
  return __cxx_static_address_8f75671c3f837925e93ad105.reference || (__cxx_static_address_8f75671c3f837925e93ad105.reference = {
    __cReference: true,
    get value() { return BOTTLE18____header_global_01cb067e3edc1ed1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:485
export const BOTTLE19____header_global_4dea4ec3a9286718 = ((((((1166) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d9913c9d2e95ed394fc130e3() {
  return __cxx_static_address_d9913c9d2e95ed394fc130e3.reference || (__cxx_static_address_d9913c9d2e95ed394fc130e3.reference = {
    __cReference: true,
    get value() { return BOTTLE19____header_global_4dea4ec3a9286718; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:486
export const DOORTILE17____header_global_f9586ca934057483 = ((((((1169) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a0a5b28bea8e9c963938c61a() {
  return __cxx_static_address_a0a5b28bea8e9c963938c61a.reference || (__cxx_static_address_a0a5b28bea8e9c963938c61a.reference = {
    __cReference: true,
    get value() { return DOORTILE17____header_global_f9586ca934057483; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:487
export const MASKWALL7____header_global_e2495d4a2e8d2bbc = ((((((1174) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_72987f1af47196138dd90daf() {
  return __cxx_static_address_72987f1af47196138dd90daf.reference || (__cxx_static_address_72987f1af47196138dd90daf.reference = {
    __cReference: true,
    get value() { return MASKWALL7____header_global_e2495d4a2e8d2bbc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:488
export const DOORTILE11____header_global_771457a8abb5cb4f = ((((((1178) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_67f88211e16be8b9e7699ced() {
  return __cxx_static_address_67f88211e16be8b9e7699ced.reference || (__cxx_static_address_67f88211e16be8b9e7699ced.reference = {
    __cReference: true,
    get value() { return DOORTILE11____header_global_771457a8abb5cb4f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:489
export const DOORTILE12____header_global_2a4d817c886d2f41 = ((((((1179) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1b4c37d384dbfcad891517f7() {
  return __cxx_static_address_1b4c37d384dbfcad891517f7.reference || (__cxx_static_address_1b4c37d384dbfcad891517f7.reference = {
    __cReference: true,
    get value() { return DOORTILE12____header_global_2a4d817c886d2f41; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:490
export const VENDMACHINE____header_global_b6fe29dfbd124df0 = ((((((1212) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9f88f46344de1c85363e3767() {
  return __cxx_static_address_9f88f46344de1c85363e3767.reference || (__cxx_static_address_9f88f46344de1c85363e3767.reference = {
    __cReference: true,
    get value() { return VENDMACHINE____header_global_b6fe29dfbd124df0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:491
export const COLAMACHINE____header_global_e39222e89dfee237 = ((((((1215) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dccd77ece63fef9dd47b3597() {
  return __cxx_static_address_dccd77ece63fef9dd47b3597.reference || (__cxx_static_address_dccd77ece63fef9dd47b3597.reference = {
    __cReference: true,
    get value() { return COLAMACHINE____header_global_e39222e89dfee237; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:492
export const CRANEPOLE____header_global_29eaeeb68150a762 = ((((((1221) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7aaac2d9342fad62cc3612fa() {
  return __cxx_static_address_7aaac2d9342fad62cc3612fa.reference || (__cxx_static_address_7aaac2d9342fad62cc3612fa.reference = {
    __cReference: true,
    get value() { return CRANEPOLE____header_global_29eaeeb68150a762; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:493
export const CRANE____header_global_bd3b6e264f58fb7f = ((((((1222) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c1c156d5e5f68d2c6d5d6ed1() {
  return __cxx_static_address_c1c156d5e5f68d2c6d5d6ed1.reference || (__cxx_static_address_c1c156d5e5f68d2c6d5d6ed1.reference = {
    __cReference: true,
    get value() { return CRANE____header_global_bd3b6e264f58fb7f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:494
export const BARBROKE____header_global_e7f6a04c95d3fb08 = ((((((1225) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d38ea8b3cb566ae334b922b8() {
  return __cxx_static_address_d38ea8b3cb566ae334b922b8.reference || (__cxx_static_address_d38ea8b3cb566ae334b922b8.reference = {
    __cReference: true,
    get value() { return BARBROKE____header_global_e7f6a04c95d3fb08; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:495
export const BLOODPOOL____header_global_47c5251e64076c9e = ((((((1226) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6237b0ab0dcc3c4239874f3e() {
  return __cxx_static_address_6237b0ab0dcc3c4239874f3e.reference || (__cxx_static_address_6237b0ab0dcc3c4239874f3e.reference = {
    __cReference: true,
    get value() { return BLOODPOOL____header_global_47c5251e64076c9e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:496
export const NUKEBARREL____header_global_10c56a879cda523b = ((((((1227) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d89916aec1d99115b8b7aea4() {
  return __cxx_static_address_d89916aec1d99115b8b7aea4.reference || (__cxx_static_address_d89916aec1d99115b8b7aea4.reference = {
    __cReference: true,
    get value() { return NUKEBARREL____header_global_10c56a879cda523b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:497
export const NUKEBARRELDENTED____header_global_d6db3ae6c442458c = ((((((1228) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b7bcf19f9110d2703f56fa96() {
  return __cxx_static_address_b7bcf19f9110d2703f56fa96.reference || (__cxx_static_address_b7bcf19f9110d2703f56fa96.reference = {
    __cReference: true,
    get value() { return NUKEBARRELDENTED____header_global_d6db3ae6c442458c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:498
export const NUKEBARRELLEAKED____header_global_4147502ae464773a = ((((((1229) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_466dd2dfbd883704199a75d9() {
  return __cxx_static_address_466dd2dfbd883704199a75d9.reference || (__cxx_static_address_466dd2dfbd883704199a75d9.reference = {
    __cReference: true,
    get value() { return NUKEBARRELLEAKED____header_global_4147502ae464773a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:499
export const CANWITHSOMETHING____header_global_f6a1431138f94b05 = ((((((1232) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_074d91cb5b26c61591b57559() {
  return __cxx_static_address_074d91cb5b26c61591b57559.reference || (__cxx_static_address_074d91cb5b26c61591b57559.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING____header_global_f6a1431138f94b05; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:500
export const MONEY____header_global_df6eef207f92882c = ((((((1233) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e8bad6b13f2cf104e2125947() {
  return __cxx_static_address_e8bad6b13f2cf104e2125947.reference || (__cxx_static_address_e8bad6b13f2cf104e2125947.reference = {
    __cReference: true,
    get value() { return MONEY____header_global_df6eef207f92882c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:501
export const BANNER____header_global_4c86a67edb703e9b = ((((((1236) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ec71a6e1ad6ec595414569b5() {
  return __cxx_static_address_ec71a6e1ad6ec595414569b5.reference || (__cxx_static_address_ec71a6e1ad6ec595414569b5.reference = {
    __cReference: true,
    get value() { return BANNER____header_global_4c86a67edb703e9b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:502
export const EXPLODINGBARREL____header_global_2a4c96f44df52280 = ((((((1238) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bdafe54fbe4d4832d5fa7923() {
  return __cxx_static_address_bdafe54fbe4d4832d5fa7923.reference || (__cxx_static_address_bdafe54fbe4d4832d5fa7923.reference = {
    __cReference: true,
    get value() { return EXPLODINGBARREL____header_global_2a4c96f44df52280; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:503
export const EXPLODINGBARREL2____header_global_2f5b797e433daf32 = ((((((1239) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_38ffab72206483e10e411e5f() {
  return __cxx_static_address_38ffab72206483e10e411e5f.reference || (__cxx_static_address_38ffab72206483e10e411e5f.reference = {
    __cReference: true,
    get value() { return EXPLODINGBARREL2____header_global_2f5b797e433daf32; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:504
export const FIREBARREL____header_global_fc54cbbca74817d7 = ((((((1240) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7520d3c4c8db0e8174653056() {
  return __cxx_static_address_7520d3c4c8db0e8174653056.reference || (__cxx_static_address_7520d3c4c8db0e8174653056.reference = {
    __cReference: true,
    get value() { return FIREBARREL____header_global_fc54cbbca74817d7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:505
export const SEENINE____header_global_9b505b0fa27f033f = ((((((1247) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4842ca3ea3a338c93a9bbcf2() {
  return __cxx_static_address_4842ca3ea3a338c93a9bbcf2.reference || (__cxx_static_address_4842ca3ea3a338c93a9bbcf2.reference = {
    __cReference: true,
    get value() { return SEENINE____header_global_9b505b0fa27f033f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:506
export const SEENINEDEAD____header_global_f637b282642012ad = ((((((1248) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ada5a34b94d6116416702cc2() {
  return __cxx_static_address_ada5a34b94d6116416702cc2.reference || (__cxx_static_address_ada5a34b94d6116416702cc2.reference = {
    __cReference: true,
    get value() { return SEENINEDEAD____header_global_f637b282642012ad; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:507
export const STEAM____header_global_9e5cf3bde62bc480 = ((((((1250) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8c2e0a5c1bd19aabc3c51bc2() {
  return __cxx_static_address_8c2e0a5c1bd19aabc3c51bc2.reference || (__cxx_static_address_8c2e0a5c1bd19aabc3c51bc2.reference = {
    __cReference: true,
    get value() { return STEAM____header_global_9e5cf3bde62bc480; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:508
export const CEILINGSTEAM____header_global_224523e7876982ae = ((((((1255) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5eef1b70932aae6fdc897185() {
  return __cxx_static_address_5eef1b70932aae6fdc897185.reference || (__cxx_static_address_5eef1b70932aae6fdc897185.reference = {
    __cReference: true,
    get value() { return CEILINGSTEAM____header_global_224523e7876982ae; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:509
export const PIPE6B____header_global_742e553f35c586c8 = ((((((1260) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5cf813f2f9c40e9bd8b62f0c() {
  return __cxx_static_address_5cf813f2f9c40e9bd8b62f0c.reference || (__cxx_static_address_5cf813f2f9c40e9bd8b62f0c.reference = {
    __cReference: true,
    get value() { return PIPE6B____header_global_742e553f35c586c8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:510
export const TRANSPORTERBEAM____header_global_09882895fec756f7 = ((((((1261) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ec0c8b662aa1b0ce8404792c() {
  return __cxx_static_address_ec0c8b662aa1b0ce8404792c.reference || (__cxx_static_address_ec0c8b662aa1b0ce8404792c.reference = {
    __cReference: true,
    get value() { return TRANSPORTERBEAM____header_global_09882895fec756f7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:511
export const RAT____header_global_285fa14286c81cbe = ((((((1267) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9b06c48417092ff1e2e41004() {
  return __cxx_static_address_9b06c48417092ff1e2e41004.reference || (__cxx_static_address_9b06c48417092ff1e2e41004.reference = {
    __cReference: true,
    get value() { return RAT____header_global_285fa14286c81cbe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:512
export const TRASH____header_global_1cb76e6e350c47fd = ((((((1272) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_db73a7a4051f49bf59957036() {
  return __cxx_static_address_db73a7a4051f49bf59957036.reference || (__cxx_static_address_db73a7a4051f49bf59957036.reference = {
    __cReference: true,
    get value() { return TRASH____header_global_1cb76e6e350c47fd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:513
export const FEMPIC1____header_global_a4dff1f28b38f161 = ((((((1280) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a96957e66fc764ff17f4ed6c() {
  return __cxx_static_address_a96957e66fc764ff17f4ed6c.reference || (__cxx_static_address_a96957e66fc764ff17f4ed6c.reference = {
    __cReference: true,
    get value() { return FEMPIC1____header_global_a4dff1f28b38f161; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:514
export const FEMPIC2____header_global_c8736b71641e4d73 = ((((((1289) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2af23f74ede84f5e40b0b623() {
  return __cxx_static_address_2af23f74ede84f5e40b0b623.reference || (__cxx_static_address_2af23f74ede84f5e40b0b623.reference = {
    __cReference: true,
    get value() { return FEMPIC2____header_global_c8736b71641e4d73; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:515
export const BLANKSCREEN____header_global_91ea37bace90bcc5 = ((((((1293) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_274db6cb9df595a1b7e632eb() {
  return __cxx_static_address_274db6cb9df595a1b7e632eb.reference || (__cxx_static_address_274db6cb9df595a1b7e632eb.reference = {
    __cReference: true,
    get value() { return BLANKSCREEN____header_global_91ea37bace90bcc5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:516
export const PODFEM1____header_global_a0269215ea7fb6cd = ((((((1294) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0e320caa70351d3339909e08() {
  return __cxx_static_address_0e320caa70351d3339909e08.reference || (__cxx_static_address_0e320caa70351d3339909e08.reference = {
    __cReference: true,
    get value() { return PODFEM1____header_global_a0269215ea7fb6cd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:517
export const FEMPIC3____header_global_5230423ef1736531 = ((((((1298) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c98025d56023c83156278bb5() {
  return __cxx_static_address_c98025d56023c83156278bb5.reference || (__cxx_static_address_c98025d56023c83156278bb5.reference = {
    __cReference: true,
    get value() { return FEMPIC3____header_global_5230423ef1736531; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:518
export const FEMPIC4____header_global_70721018c6a3832d = ((((((1306) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4fffb9babc9e06688af31a9a() {
  return __cxx_static_address_4fffb9babc9e06688af31a9a.reference || (__cxx_static_address_4fffb9babc9e06688af31a9a.reference = {
    __cReference: true,
    get value() { return FEMPIC4____header_global_70721018c6a3832d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:519
export const FEM1____header_global_97369ad2e17f4e2b = ((((((1312) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_32d0a6b781ff40a1d39d80fc() {
  return __cxx_static_address_32d0a6b781ff40a1d39d80fc.reference || (__cxx_static_address_32d0a6b781ff40a1d39d80fc.reference = {
    __cReference: true,
    get value() { return FEM1____header_global_97369ad2e17f4e2b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:520
export const FEM2____header_global_2fc0b2252d244a2a = ((((((1317) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b67f10c83890d5774b70fcd8() {
  return __cxx_static_address_b67f10c83890d5774b70fcd8.reference || (__cxx_static_address_b67f10c83890d5774b70fcd8.reference = {
    __cReference: true,
    get value() { return FEM2____header_global_2fc0b2252d244a2a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:521
export const FEM3____header_global_8df3df0eac9a5552 = ((((((1321) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a6f33e90562e24025d4384c2() {
  return __cxx_static_address_a6f33e90562e24025d4384c2.reference || (__cxx_static_address_a6f33e90562e24025d4384c2.reference = {
    __cReference: true,
    get value() { return FEM3____header_global_8df3df0eac9a5552; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:522
export const FEM5____header_global_e0a376ed51389184 = ((((((1323) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5b00daeb3405e57d235f049f() {
  return __cxx_static_address_5b00daeb3405e57d235f049f.reference || (__cxx_static_address_5b00daeb3405e57d235f049f.reference = {
    __cReference: true,
    get value() { return FEM5____header_global_e0a376ed51389184; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:523
export const BLOODYPOLE____header_global_0d791a8bffaa2a62 = ((((((1324) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f262a11bd333a135d2ea4cfb() {
  return __cxx_static_address_f262a11bd333a135d2ea4cfb.reference || (__cxx_static_address_f262a11bd333a135d2ea4cfb.reference = {
    __cReference: true,
    get value() { return BLOODYPOLE____header_global_0d791a8bffaa2a62; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:524
export const FEM4____header_global_09b8a2159164d34a = ((((((1325) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_508860883707778fd73fe6e0() {
  return __cxx_static_address_508860883707778fd73fe6e0.reference || (__cxx_static_address_508860883707778fd73fe6e0.reference = {
    __cReference: true,
    get value() { return FEM4____header_global_09b8a2159164d34a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:525
export const FEM6____header_global_fb53c756e3719ef3 = ((((((1334) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3f392bd295a8ec089df0b77c() {
  return __cxx_static_address_3f392bd295a8ec089df0b77c.reference || (__cxx_static_address_3f392bd295a8ec089df0b77c.reference = {
    __cReference: true,
    get value() { return FEM6____header_global_fb53c756e3719ef3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:526
export const FEM6PAD____header_global_ff91fe82c698cad4 = ((((((1335) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bb9cf06db2505ec20c0f1214() {
  return __cxx_static_address_bb9cf06db2505ec20c0f1214.reference || (__cxx_static_address_bb9cf06db2505ec20c0f1214.reference = {
    __cReference: true,
    get value() { return FEM6PAD____header_global_ff91fe82c698cad4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:527
export const FEM8____header_global_47c8d0ad8da3d293 = ((((((1336) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4c5e9aa2b4da7bef61d00b10() {
  return __cxx_static_address_4c5e9aa2b4da7bef61d00b10.reference || (__cxx_static_address_4c5e9aa2b4da7bef61d00b10.reference = {
    __cReference: true,
    get value() { return FEM8____header_global_47c8d0ad8da3d293; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:528
export const HELECOPT____header_global_60085bb7fe425b4a = ((((((1346) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5249bddbb5a5fe2712370ff5() {
  return __cxx_static_address_5249bddbb5a5fe2712370ff5.reference || (__cxx_static_address_5249bddbb5a5fe2712370ff5.reference = {
    __cReference: true,
    get value() { return HELECOPT____header_global_60085bb7fe425b4a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:529
export const FETUSJIB____header_global_80ed1831f7f0f151 = ((((((1347) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6b979f2766e1864d002e977f() {
  return __cxx_static_address_6b979f2766e1864d002e977f.reference || (__cxx_static_address_6b979f2766e1864d002e977f.reference = {
    __cReference: true,
    get value() { return FETUSJIB____header_global_80ed1831f7f0f151; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:530
export const HOLODUKE____header_global_b8276d86dd781935 = ((((((1348) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_026bbe82298d8d14e0407cec() {
  return __cxx_static_address_026bbe82298d8d14e0407cec.reference || (__cxx_static_address_026bbe82298d8d14e0407cec.reference = {
    __cReference: true,
    get value() { return HOLODUKE____header_global_b8276d86dd781935; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:531
export const SPACEMARINE____header_global_8097ee6ab0839a67 = ((((((1353) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e5de61c6bf0b02fd327ffe9a() {
  return __cxx_static_address_e5de61c6bf0b02fd327ffe9a.reference || (__cxx_static_address_e5de61c6bf0b02fd327ffe9a.reference = {
    __cReference: true,
    get value() { return SPACEMARINE____header_global_8097ee6ab0839a67; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:532
export const INDY____header_global_5df1d3b650f91f2d = ((((((1355) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f9c37739773a8166342de1f1() {
  return __cxx_static_address_f9c37739773a8166342de1f1.reference || (__cxx_static_address_f9c37739773a8166342de1f1.reference = {
    __cReference: true,
    get value() { return INDY____header_global_5df1d3b650f91f2d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:533
export const FETUS____header_global_35ae0fdd90457b75 = ((((((1358) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_74d5134582e89e9008ef6221() {
  return __cxx_static_address_74d5134582e89e9008ef6221.reference || (__cxx_static_address_74d5134582e89e9008ef6221.reference = {
    __cReference: true,
    get value() { return FETUS____header_global_35ae0fdd90457b75; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:534
export const FETUSBROKE____header_global_9cd3896ec74c4f4f = ((((((1359) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8ed15c117d1a27f1d8b75667() {
  return __cxx_static_address_8ed15c117d1a27f1d8b75667.reference || (__cxx_static_address_8ed15c117d1a27f1d8b75667.reference = {
    __cReference: true,
    get value() { return FETUSBROKE____header_global_9cd3896ec74c4f4f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:535
export const MONK____header_global_1e372b8613361c12 = ((((((1352) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d735f16bd91ee5d693f19ce2() {
  return __cxx_static_address_d735f16bd91ee5d693f19ce2.reference || (__cxx_static_address_d735f16bd91ee5d693f19ce2.reference = {
    __cReference: true,
    get value() { return MONK____header_global_1e372b8613361c12; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:536
export const LUKE____header_global_ba43ec8981b78563 = ((((((1354) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cda820326fa5dc33c5e93d02() {
  return __cxx_static_address_cda820326fa5dc33c5e93d02.reference || (__cxx_static_address_cda820326fa5dc33c5e93d02.reference = {
    __cReference: true,
    get value() { return LUKE____header_global_ba43ec8981b78563; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:537
export const COOLEXPLOSION1____header_global_cbb3fcc0dff04067 = ((((((1360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0b6981eab55a359094c35adc() {
  return __cxx_static_address_0b6981eab55a359094c35adc.reference || (__cxx_static_address_0b6981eab55a359094c35adc.reference = {
    __cReference: true,
    get value() { return COOLEXPLOSION1____header_global_cbb3fcc0dff04067; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:538
export const WATERSPLASH2____header_global_3d931ec831da3885 = ((((((1380) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_faf939f6d7dbd4e3abc428f9() {
  return __cxx_static_address_faf939f6d7dbd4e3abc428f9.reference || (__cxx_static_address_faf939f6d7dbd4e3abc428f9.reference = {
    __cReference: true,
    get value() { return WATERSPLASH2____header_global_3d931ec831da3885; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:539
export const FIREVASE____header_global_ea3737592fd46f9a = ((((((1390) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cefa003b381c5132da4195c0() {
  return __cxx_static_address_cefa003b381c5132da4195c0.reference || (__cxx_static_address_cefa003b381c5132da4195c0.reference = {
    __cReference: true,
    get value() { return FIREVASE____header_global_ea3737592fd46f9a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:540
export const FEM7____header_global_36c74964d26acdbc = ((((((1395) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f292087d5e0c50b6a2f7806a() {
  return __cxx_static_address_f292087d5e0c50b6a2f7806a.reference || (__cxx_static_address_f292087d5e0c50b6a2f7806a.reference = {
    __cReference: true,
    get value() { return FEM7____header_global_36c74964d26acdbc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:541
export const APLAYERTOP____header_global_58e14b37dee3bb58 = ((((((1400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_786c818a24f28e5c6d4058cb() {
  return __cxx_static_address_786c818a24f28e5c6d4058cb.reference || (__cxx_static_address_786c818a24f28e5c6d4058cb.reference = {
    __cReference: true,
    get value() { return APLAYERTOP____header_global_58e14b37dee3bb58; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:542
export const APLAYER____header_global_257d196a2221cf7d = ((((((1405) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_22ee813dca64e7af4545fe6b() {
  return __cxx_static_address_22ee813dca64e7af4545fe6b.reference || (__cxx_static_address_22ee813dca64e7af4545fe6b.reference = {
    __cReference: true,
    get value() { return APLAYER____header_global_257d196a2221cf7d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:543
export const PLAYERONWATER____header_global_7be2e11c3f746d94 = ((((((1420) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5c9903fe65b6d9f18cbe3321() {
  return __cxx_static_address_5c9903fe65b6d9f18cbe3321.reference || (__cxx_static_address_5c9903fe65b6d9f18cbe3321.reference = {
    __cReference: true,
    get value() { return PLAYERONWATER____header_global_7be2e11c3f746d94; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:544
export const DUKELYINGDEAD____header_global_2398cb532b5418ea = ((((((1518) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b0bbc0e1e840c2ccd37e5515() {
  return __cxx_static_address_b0bbc0e1e840c2ccd37e5515.reference || (__cxx_static_address_b0bbc0e1e840c2ccd37e5515.reference = {
    __cReference: true,
    get value() { return DUKELYINGDEAD____header_global_2398cb532b5418ea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:545
export const DUKETORSO____header_global_5804b3820d00a1ea = ((((((1520) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8902bea06ebe9d79da986e0e() {
  return __cxx_static_address_8902bea06ebe9d79da986e0e.reference || (__cxx_static_address_8902bea06ebe9d79da986e0e.reference = {
    __cReference: true,
    get value() { return DUKETORSO____header_global_5804b3820d00a1ea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:546
export const DUKEGUN____header_global_2479baefcf65e9fd = ((((((1528) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6dea9f0ab670f552bb36bab1() {
  return __cxx_static_address_6dea9f0ab670f552bb36bab1.reference || (__cxx_static_address_6dea9f0ab670f552bb36bab1.reference = {
    __cReference: true,
    get value() { return DUKEGUN____header_global_2479baefcf65e9fd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:547
export const DUKELEG____header_global_eb353d3c5525b5ff = ((((((1536) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4b8048c608a3541f9cb6d9b0() {
  return __cxx_static_address_4b8048c608a3541f9cb6d9b0.reference || (__cxx_static_address_4b8048c608a3541f9cb6d9b0.reference = {
    __cReference: true,
    get value() { return DUKELEG____header_global_eb353d3c5525b5ff; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:548
export const SHARK____header_global_e0a70e9d3812cb2d = ((((((1550) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8d019085e8d725eb7e689bfa() {
  return __cxx_static_address_8d019085e8d725eb7e689bfa.reference || (__cxx_static_address_8d019085e8d725eb7e689bfa.reference = {
    __cReference: true,
    get value() { return SHARK____header_global_e0a70e9d3812cb2d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:549
export const BLOOD____header_global_88c2a9063ebfbafd = ((((((1620) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9412f7948e5ee139b5f524e2() {
  return __cxx_static_address_9412f7948e5ee139b5f524e2.reference || (__cxx_static_address_9412f7948e5ee139b5f524e2.reference = {
    __cReference: true,
    get value() { return BLOOD____header_global_88c2a9063ebfbafd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:550
export const FIRELASER____header_global_bcaf72455539a5f4 = ((((((1625) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_895532c9a4d93869c7639cdc() {
  return __cxx_static_address_895532c9a4d93869c7639cdc.reference || (__cxx_static_address_895532c9a4d93869c7639cdc.reference = {
    __cReference: true,
    get value() { return FIRELASER____header_global_bcaf72455539a5f4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:551
export const TRANSPORTERSTAR____header_global_24bef8ec9e86369d = ((((((1630) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1e385d45d2bcbd7608e7080a() {
  return __cxx_static_address_1e385d45d2bcbd7608e7080a.reference || (__cxx_static_address_1e385d45d2bcbd7608e7080a.reference = {
    __cReference: true,
    get value() { return TRANSPORTERSTAR____header_global_24bef8ec9e86369d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:552
export const SPIT____header_global_6d9a9a12c9211bed = ((((((1636) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d13b2f46f9e288014efb52d1() {
  return __cxx_static_address_d13b2f46f9e288014efb52d1.reference || (__cxx_static_address_d13b2f46f9e288014efb52d1.reference = {
    __cReference: true,
    get value() { return SPIT____header_global_6d9a9a12c9211bed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:553
export const LOOGIE____header_global_b17c2f759d5c1809 = ((((((1637) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a606eb12955680a13a8c194d() {
  return __cxx_static_address_a606eb12955680a13a8c194d.reference || (__cxx_static_address_a606eb12955680a13a8c194d.reference = {
    __cReference: true,
    get value() { return LOOGIE____header_global_b17c2f759d5c1809; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:554
export const FIST____header_global_d04d756a4699c891 = ((((((1640) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_36ec78820ee45769af1a7eed() {
  return __cxx_static_address_36ec78820ee45769af1a7eed.reference || (__cxx_static_address_36ec78820ee45769af1a7eed.reference = {
    __cReference: true,
    get value() { return FIST____header_global_d04d756a4699c891; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:555
export const FREEZEBLAST____header_global_24d40d3983721f47 = ((((((1641) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_02adcba033d5481e9161a84a() {
  return __cxx_static_address_02adcba033d5481e9161a84a.reference || (__cxx_static_address_02adcba033d5481e9161a84a.reference = {
    __cReference: true,
    get value() { return FREEZEBLAST____header_global_24d40d3983721f47; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:556
export const SHRINKSPARK____header_global_bb0707c1e8f58a13 = ((((((1646) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_39c537f904be999d367e4730() {
  return __cxx_static_address_39c537f904be999d367e4730.reference || (__cxx_static_address_39c537f904be999d367e4730.reference = {
    __cReference: true,
    get value() { return SHRINKSPARK____header_global_bb0707c1e8f58a13; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:557
export const TONGUE____header_global_7967b93c608cbe9a = ((((((1647) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fcb0e41f592afe7a7876e02e() {
  return __cxx_static_address_fcb0e41f592afe7a7876e02e.reference || (__cxx_static_address_fcb0e41f592afe7a7876e02e.reference = {
    __cReference: true,
    get value() { return TONGUE____header_global_7967b93c608cbe9a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:558
export const MORTER____header_global_9fcd749c9928108d = ((((((1650) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_da7c0ae65ccd7c31018af33e() {
  return __cxx_static_address_da7c0ae65ccd7c31018af33e.reference || (__cxx_static_address_da7c0ae65ccd7c31018af33e.reference = {
    __cReference: true,
    get value() { return MORTER____header_global_9fcd749c9928108d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:559
export const SHRINKEREXPLOSION____header_global_bdaa2603072fe77a = ((((((1656) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1169f98840dd6e4c9cb5dc47() {
  return __cxx_static_address_1169f98840dd6e4c9cb5dc47.reference || (__cxx_static_address_1169f98840dd6e4c9cb5dc47.reference = {
    __cReference: true,
    get value() { return SHRINKEREXPLOSION____header_global_bdaa2603072fe77a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:560
export const RADIUSEXPLOSION____header_global_f73e91cb7065f5f4 = ((((((1670) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_28064e4319980e8a7f953db5() {
  return __cxx_static_address_28064e4319980e8a7f953db5.reference || (__cxx_static_address_28064e4319980e8a7f953db5.reference = {
    __cReference: true,
    get value() { return RADIUSEXPLOSION____header_global_f73e91cb7065f5f4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:561
export const FORCERIPPLE____header_global_cff270c57198de80 = ((((((1671) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_db9857e380a041c2e0cd59d5() {
  return __cxx_static_address_db9857e380a041c2e0cd59d5.reference || (__cxx_static_address_db9857e380a041c2e0cd59d5.reference = {
    __cReference: true,
    get value() { return FORCERIPPLE____header_global_cff270c57198de80; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:562
export const LIZTROOP____header_global_884acd6a8be25f22 = ((((((1680) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3b80faba388d33654ca2c254() {
  return __cxx_static_address_3b80faba388d33654ca2c254.reference || (__cxx_static_address_3b80faba388d33654ca2c254.reference = {
    __cReference: true,
    get value() { return LIZTROOP____header_global_884acd6a8be25f22; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:563
export const LIZTROOPRUNNING____header_global_5c9e9bf08b20d43d = ((((((1681) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_895d3721b1ab571eda3f2f6d() {
  return __cxx_static_address_895d3721b1ab571eda3f2f6d.reference || (__cxx_static_address_895d3721b1ab571eda3f2f6d.reference = {
    __cReference: true,
    get value() { return LIZTROOPRUNNING____header_global_5c9e9bf08b20d43d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:564
export const LIZTROOPSTAYPUT____header_global_4dffe4ce5b6814dd = ((((((1682) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_edc7f367546dd128a5615d6f() {
  return __cxx_static_address_edc7f367546dd128a5615d6f.reference || (__cxx_static_address_edc7f367546dd128a5615d6f.reference = {
    __cReference: true,
    get value() { return LIZTROOPSTAYPUT____header_global_4dffe4ce5b6814dd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:565
export const LIZTROOPSHOOT____header_global_749a3ead572f282d = ((((((1715) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9e168132b000e1bf6a60a22e() {
  return __cxx_static_address_9e168132b000e1bf6a60a22e.reference || (__cxx_static_address_9e168132b000e1bf6a60a22e.reference = {
    __cReference: true,
    get value() { return LIZTROOPSHOOT____header_global_749a3ead572f282d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:566
export const LIZTROOPJETPACK____header_global_4f8d520190b1dbac = ((((((1725) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6d71b58d6e49e9732160b19e() {
  return __cxx_static_address_6d71b58d6e49e9732160b19e.reference || (__cxx_static_address_6d71b58d6e49e9732160b19e.reference = {
    __cReference: true,
    get value() { return LIZTROOPJETPACK____header_global_4f8d520190b1dbac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:567
export const LIZTROOPONTOILET____header_global_9c4f6348e829de1f = ((((((1741) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ed2ab0309eca6fd03f38c585() {
  return __cxx_static_address_ed2ab0309eca6fd03f38c585.reference || (__cxx_static_address_ed2ab0309eca6fd03f38c585.reference = {
    __cReference: true,
    get value() { return LIZTROOPONTOILET____header_global_9c4f6348e829de1f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:568
export const LIZTROOPJUSTSIT____header_global_b72872da2edbdcf8 = ((((((1742) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1b683a659869242b97fee3f0() {
  return __cxx_static_address_1b683a659869242b97fee3f0.reference || (__cxx_static_address_1b683a659869242b97fee3f0.reference = {
    __cReference: true,
    get value() { return LIZTROOPJUSTSIT____header_global_b72872da2edbdcf8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:569
export const LIZTROOPDUCKING____header_global_22b65a18aafdcbe3 = ((((((1744) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_def568706f361e8e6e9e9182() {
  return __cxx_static_address_def568706f361e8e6e9e9182.reference || (__cxx_static_address_def568706f361e8e6e9e9182.reference = {
    __cReference: true,
    get value() { return LIZTROOPDUCKING____header_global_22b65a18aafdcbe3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:570
export const HEADJIB1____header_global_a8f0e54aff7a8a5b = ((((((1768) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1eca5ad3373ba1e70d88c254() {
  return __cxx_static_address_1eca5ad3373ba1e70d88c254.reference || (__cxx_static_address_1eca5ad3373ba1e70d88c254.reference = {
    __cReference: true,
    get value() { return HEADJIB1____header_global_a8f0e54aff7a8a5b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:571
export const ARMJIB1____header_global_2cf567597f02d701 = ((((((1772) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_feb5b113a299d869881016ed() {
  return __cxx_static_address_feb5b113a299d869881016ed.reference || (__cxx_static_address_feb5b113a299d869881016ed.reference = {
    __cReference: true,
    get value() { return ARMJIB1____header_global_2cf567597f02d701; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:572
export const LEGJIB1____header_global_572956f3e2c65e07 = ((((((1776) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dba87d199ccb579c72db6118() {
  return __cxx_static_address_dba87d199ccb579c72db6118.reference || (__cxx_static_address_dba87d199ccb579c72db6118.reference = {
    __cReference: true,
    get value() { return LEGJIB1____header_global_572956f3e2c65e07; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:573
export const OCTABRAIN____header_global_19784e48bccef1e6 = ((((((1820) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0339d289349e742fe000f7bb() {
  return __cxx_static_address_0339d289349e742fe000f7bb.reference || (__cxx_static_address_0339d289349e742fe000f7bb.reference = {
    __cReference: true,
    get value() { return OCTABRAIN____header_global_19784e48bccef1e6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:574
export const OCTABRAINSTAYPUT____header_global_fc59240a99448c5c = ((((((1821) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_29559a197c550f533f3484d4() {
  return __cxx_static_address_29559a197c550f533f3484d4.reference || (__cxx_static_address_29559a197c550f533f3484d4.reference = {
    __cReference: true,
    get value() { return OCTABRAINSTAYPUT____header_global_fc59240a99448c5c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:575
export const INNERJAW____header_global_f8258a6f5a5b913b = ((((((1860) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b8d75bc772ddd00ed0c35e7a() {
  return __cxx_static_address_b8d75bc772ddd00ed0c35e7a.reference || (__cxx_static_address_b8d75bc772ddd00ed0c35e7a.reference = {
    __cReference: true,
    get value() { return INNERJAW____header_global_f8258a6f5a5b913b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:576
export const DRONE____header_global_c3a753700133ee33 = ((((((1880) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e94f592a0eb2dda45670d99f() {
  return __cxx_static_address_e94f592a0eb2dda45670d99f.reference || (__cxx_static_address_e94f592a0eb2dda45670d99f.reference = {
    __cReference: true,
    get value() { return DRONE____header_global_c3a753700133ee33; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:577
export const EXPLOSION2____header_global_8ce67637eb521b1b = ((((((1890) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a8a9d9e99c2de09368ef9c00() {
  return __cxx_static_address_a8a9d9e99c2de09368ef9c00.reference || (__cxx_static_address_a8a9d9e99c2de09368ef9c00.reference = {
    __cReference: true,
    get value() { return EXPLOSION2____header_global_8ce67637eb521b1b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:578
export const COMMANDER____header_global_52390a09c0d79a6f = ((((((1920) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8b287ae416012adbe8c62a24() {
  return __cxx_static_address_8b287ae416012adbe8c62a24.reference || (__cxx_static_address_8b287ae416012adbe8c62a24.reference = {
    __cReference: true,
    get value() { return COMMANDER____header_global_52390a09c0d79a6f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:579
export const COMMANDERSTAYPUT____header_global_b85852adbff45380 = ((((((1921) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_500760b66dfb6757421177d4() {
  return __cxx_static_address_500760b66dfb6757421177d4.reference || (__cxx_static_address_500760b66dfb6757421177d4.reference = {
    __cReference: true,
    get value() { return COMMANDERSTAYPUT____header_global_b85852adbff45380; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:580
export const RECON____header_global_9b7520f96b993c08 = ((((((1960) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a9b7b44d436155db9f6e1b12() {
  return __cxx_static_address_a9b7b44d436155db9f6e1b12.reference || (__cxx_static_address_a9b7b44d436155db9f6e1b12.reference = {
    __cReference: true,
    get value() { return RECON____header_global_9b7520f96b993c08; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:581
export const TANK____header_global_913207e4e423083b = ((((((1975) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_84390a680d39293eae7f8aec() {
  return __cxx_static_address_84390a680d39293eae7f8aec.reference || (__cxx_static_address_84390a680d39293eae7f8aec.reference = {
    __cReference: true,
    get value() { return TANK____header_global_913207e4e423083b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:582
export const PIGCOP____header_global_35adf403958c1f12 = ((((((2000) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4659192d115ea46799c6b158() {
  return __cxx_static_address_4659192d115ea46799c6b158.reference || (__cxx_static_address_4659192d115ea46799c6b158.reference = {
    __cReference: true,
    get value() { return PIGCOP____header_global_35adf403958c1f12; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:583
export const PIGCOPSTAYPUT____header_global_8ffe446775cfcf13 = ((((((2001) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9ce53f2d18b05aba20dfba04() {
  return __cxx_static_address_9ce53f2d18b05aba20dfba04.reference || (__cxx_static_address_9ce53f2d18b05aba20dfba04.reference = {
    __cReference: true,
    get value() { return PIGCOPSTAYPUT____header_global_8ffe446775cfcf13; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:584
export const PIGCOPDIVE____header_global_fcf71bbe1ea8f229 = ((((((2045) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_94a31d5dc1ac071c726a5328() {
  return __cxx_static_address_94a31d5dc1ac071c726a5328.reference || (__cxx_static_address_94a31d5dc1ac071c726a5328.reference = {
    __cReference: true,
    get value() { return PIGCOPDIVE____header_global_fcf71bbe1ea8f229; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:585
export const LIZMAN____header_global_284280c67661a9af = ((((((2120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_efd2f344984124ee1dc54619() {
  return __cxx_static_address_efd2f344984124ee1dc54619.reference || (__cxx_static_address_efd2f344984124ee1dc54619.reference = {
    __cReference: true,
    get value() { return LIZMAN____header_global_284280c67661a9af; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:586
export const LIZMANSTAYPUT____header_global_b83e3046685198e0 = ((((((2121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f128ba8ef8c57e80992df02c() {
  return __cxx_static_address_f128ba8ef8c57e80992df02c.reference || (__cxx_static_address_f128ba8ef8c57e80992df02c.reference = {
    __cReference: true,
    get value() { return LIZMANSTAYPUT____header_global_b83e3046685198e0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:587
export const LIZMANSPITTING____header_global_d8a61dedd7fb905c = ((((((2150) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_208c319e712a81c8ce3226d3() {
  return __cxx_static_address_208c319e712a81c8ce3226d3.reference || (__cxx_static_address_208c319e712a81c8ce3226d3.reference = {
    __cReference: true,
    get value() { return LIZMANSPITTING____header_global_d8a61dedd7fb905c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:588
export const LIZMANFEEDING____header_global_e4a6df4ff8b9c96a = ((((((2160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c995670894535bfc0585e15c() {
  return __cxx_static_address_c995670894535bfc0585e15c.reference || (__cxx_static_address_c995670894535bfc0585e15c.reference = {
    __cReference: true,
    get value() { return LIZMANFEEDING____header_global_e4a6df4ff8b9c96a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:589
export const LIZMANJUMP____header_global_24a0f94a69d22dfe = ((((((2165) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6d9d871a879f09c88a06897d() {
  return __cxx_static_address_6d9d871a879f09c88a06897d.reference || (__cxx_static_address_6d9d871a879f09c88a06897d.reference = {
    __cReference: true,
    get value() { return LIZMANJUMP____header_global_24a0f94a69d22dfe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:590
export const FECES____header_global_7c8c6fe25c4e9f8d = ((((((2200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_16e3c585dec8a6900622acbc() {
  return __cxx_static_address_16e3c585dec8a6900622acbc.reference || (__cxx_static_address_16e3c585dec8a6900622acbc.reference = {
    __cReference: true,
    get value() { return FECES____header_global_7c8c6fe25c4e9f8d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:591
export const LIZMANHEAD1____header_global_3e6292afdc2ae2b2 = ((((((2201) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_935d0c85878a20f6a375fd1a() {
  return __cxx_static_address_935d0c85878a20f6a375fd1a.reference || (__cxx_static_address_935d0c85878a20f6a375fd1a.reference = {
    __cReference: true,
    get value() { return LIZMANHEAD1____header_global_3e6292afdc2ae2b2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:592
export const LIZMANARM1____header_global_9df0da64f0a1fe41 = ((((((2205) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e9c9433a70de218cb2ca7dff() {
  return __cxx_static_address_e9c9433a70de218cb2ca7dff.reference || (__cxx_static_address_e9c9433a70de218cb2ca7dff.reference = {
    __cReference: true,
    get value() { return LIZMANARM1____header_global_9df0da64f0a1fe41; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:593
export const LIZMANLEG1____header_global_c61e0b5d67f64850 = ((((((2209) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_38214d11ca0356bb00727b6f() {
  return __cxx_static_address_38214d11ca0356bb00727b6f.reference || (__cxx_static_address_38214d11ca0356bb00727b6f.reference = {
    __cReference: true,
    get value() { return LIZMANLEG1____header_global_c61e0b5d67f64850; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:594
export const EXPLOSION2BOT____header_global_57b2eb2e307fffc3 = ((((((2219) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a7987c3952170d6b422c1fe6() {
  return __cxx_static_address_a7987c3952170d6b422c1fe6.reference || (__cxx_static_address_a7987c3952170d6b422c1fe6.reference = {
    __cReference: true,
    get value() { return EXPLOSION2BOT____header_global_57b2eb2e307fffc3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:595
export const JIBS1____header_global_4652e4321836f395 = ((((((2245) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_34c491093f24f53823c81081() {
  return __cxx_static_address_34c491093f24f53823c81081.reference || (__cxx_static_address_34c491093f24f53823c81081.reference = {
    __cReference: true,
    get value() { return JIBS1____header_global_4652e4321836f395; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:596
export const JIBS2____header_global_fe45cfce55038b2b = ((((((2250) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7b8285b736461070c81bd9fe() {
  return __cxx_static_address_7b8285b736461070c81bd9fe.reference || (__cxx_static_address_7b8285b736461070c81bd9fe.reference = {
    __cReference: true,
    get value() { return JIBS2____header_global_fe45cfce55038b2b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:597
export const JIBS3____header_global_ef822e9e517f14cc = ((((((2255) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cd08d41432330eea2f26014d() {
  return __cxx_static_address_cd08d41432330eea2f26014d.reference || (__cxx_static_address_cd08d41432330eea2f26014d.reference = {
    __cReference: true,
    get value() { return JIBS3____header_global_ef822e9e517f14cc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:598
export const JIBS4____header_global_d91aea71bafa00ca = ((((((2260) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0506138749b3499eeb50bc93() {
  return __cxx_static_address_0506138749b3499eeb50bc93.reference || (__cxx_static_address_0506138749b3499eeb50bc93.reference = {
    __cReference: true,
    get value() { return JIBS4____header_global_d91aea71bafa00ca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:599
export const JIBS5____header_global_00b953457afd49b2 = ((((((2265) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b089a3b631e2e78975a22fc7() {
  return __cxx_static_address_b089a3b631e2e78975a22fc7.reference || (__cxx_static_address_b089a3b631e2e78975a22fc7.reference = {
    __cReference: true,
    get value() { return JIBS5____header_global_00b953457afd49b2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:600
export const BURNING____header_global_7f497a2d722dca66 = ((((((2270) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8f93d0ab0c37b2869e9a6686() {
  return __cxx_static_address_8f93d0ab0c37b2869e9a6686.reference || (__cxx_static_address_8f93d0ab0c37b2869e9a6686.reference = {
    __cReference: true,
    get value() { return BURNING____header_global_7f497a2d722dca66; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:601
export const FIRE____header_global_70bf10920ed6dd34 = ((((((2271) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c6c5b038de27be86555c3bb6() {
  return __cxx_static_address_c6c5b038de27be86555c3bb6.reference || (__cxx_static_address_c6c5b038de27be86555c3bb6.reference = {
    __cReference: true,
    get value() { return FIRE____header_global_70bf10920ed6dd34; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:602
export const JIBS6____header_global_7b66fb018b976e64 = ((((((2286) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_67ef543e151ce7f30831fc99() {
  return __cxx_static_address_67ef543e151ce7f30831fc99.reference || (__cxx_static_address_67ef543e151ce7f30831fc99.reference = {
    __cReference: true,
    get value() { return JIBS6____header_global_7b66fb018b976e64; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:603
export const BLOODSPLAT1____header_global_373ccab9f98a5524 = ((((((2296) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5718accc0f34f0cfe6dfdf77() {
  return __cxx_static_address_5718accc0f34f0cfe6dfdf77.reference || (__cxx_static_address_5718accc0f34f0cfe6dfdf77.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT1____header_global_373ccab9f98a5524; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:604
export const BLOODSPLAT3____header_global_41905925b508bcf4 = ((((((2297) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_82fa0bb15cdb3640bd08a51e() {
  return __cxx_static_address_82fa0bb15cdb3640bd08a51e.reference || (__cxx_static_address_82fa0bb15cdb3640bd08a51e.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT3____header_global_41905925b508bcf4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:605
export const BLOODSPLAT2____header_global_8adc02f178f2828c = ((((((2298) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6b1adc8a64f327326c67ca7b() {
  return __cxx_static_address_6b1adc8a64f327326c67ca7b.reference || (__cxx_static_address_6b1adc8a64f327326c67ca7b.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT2____header_global_8adc02f178f2828c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:606
export const BLOODSPLAT4____header_global_cdc6ca5e4ce4e49c = ((((((2299) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5b0b710061510c479d1932d9() {
  return __cxx_static_address_5b0b710061510c479d1932d9.reference || (__cxx_static_address_5b0b710061510c479d1932d9.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT4____header_global_cdc6ca5e4ce4e49c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:607
export const OOZ____header_global_62a22a10892b8a8b = ((((((2300) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_49faef9f79d7acd951c466a2() {
  return __cxx_static_address_49faef9f79d7acd951c466a2.reference || (__cxx_static_address_49faef9f79d7acd951c466a2.reference = {
    __cReference: true,
    get value() { return OOZ____header_global_62a22a10892b8a8b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:608
export const OOZ2____header_global_d22213b67d5ace45 = ((((((2309) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_73dd3735e39115024956d393() {
  return __cxx_static_address_73dd3735e39115024956d393.reference || (__cxx_static_address_73dd3735e39115024956d393.reference = {
    __cReference: true,
    get value() { return OOZ2____header_global_d22213b67d5ace45; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:609
export const WALLBLOOD1____header_global_df48127e9cb9ba9b = ((((((2301) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e9c7ac24139691057e9e792e() {
  return __cxx_static_address_e9c7ac24139691057e9e792e.reference || (__cxx_static_address_e9c7ac24139691057e9e792e.reference = {
    __cReference: true,
    get value() { return WALLBLOOD1____header_global_df48127e9cb9ba9b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:610
export const WALLBLOOD2____header_global_09ed34fb8ee17285 = ((((((2302) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c2cb3b053284c8d2f59aa796() {
  return __cxx_static_address_c2cb3b053284c8d2f59aa796.reference || (__cxx_static_address_c2cb3b053284c8d2f59aa796.reference = {
    __cReference: true,
    get value() { return WALLBLOOD2____header_global_09ed34fb8ee17285; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:611
export const WALLBLOOD3____header_global_8f0ced13bda1e447 = ((((((2303) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_01ea98d62aaeae22218a4838() {
  return __cxx_static_address_01ea98d62aaeae22218a4838.reference || (__cxx_static_address_01ea98d62aaeae22218a4838.reference = {
    __cReference: true,
    get value() { return WALLBLOOD3____header_global_8f0ced13bda1e447; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:612
export const WALLBLOOD4____header_global_89ab9b4d78dbd1c3 = ((((((2304) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_62b41cf0c0e9e6474081b1f8() {
  return __cxx_static_address_62b41cf0c0e9e6474081b1f8.reference || (__cxx_static_address_62b41cf0c0e9e6474081b1f8.reference = {
    __cReference: true,
    get value() { return WALLBLOOD4____header_global_89ab9b4d78dbd1c3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:613
export const WALLBLOOD5____header_global_c0e397ab139eb2ce = ((((((2305) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f407d17c8b0f2cccb1e9ed71() {
  return __cxx_static_address_f407d17c8b0f2cccb1e9ed71.reference || (__cxx_static_address_f407d17c8b0f2cccb1e9ed71.reference = {
    __cReference: true,
    get value() { return WALLBLOOD5____header_global_c0e397ab139eb2ce; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:614
export const WALLBLOOD7____header_global_87e87697d8c77621 = ((((((2307) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d11d08b728deb6c8a54f2267() {
  return __cxx_static_address_d11d08b728deb6c8a54f2267.reference || (__cxx_static_address_d11d08b728deb6c8a54f2267.reference = {
    __cReference: true,
    get value() { return WALLBLOOD7____header_global_87e87697d8c77621; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:615
export const WALLBLOOD8____header_global_b4664f6a0cc33e0b = ((((((2308) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d7285ce104d4b1aa00c26d38() {
  return __cxx_static_address_d7285ce104d4b1aa00c26d38.reference || (__cxx_static_address_d7285ce104d4b1aa00c26d38.reference = {
    __cReference: true,
    get value() { return WALLBLOOD8____header_global_b4664f6a0cc33e0b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:616
export const BURNING2____header_global_0f5dca6fb3d6e1ee = ((((((2310) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_97d647a9d49362d6542fe5dc() {
  return __cxx_static_address_97d647a9d49362d6542fe5dc.reference || (__cxx_static_address_97d647a9d49362d6542fe5dc.reference = {
    __cReference: true,
    get value() { return BURNING2____header_global_0f5dca6fb3d6e1ee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:617
export const FIRE2____header_global_a5371f1e0efec13a = ((((((2311) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1398123efb8313023484bd89() {
  return __cxx_static_address_1398123efb8313023484bd89.reference || (__cxx_static_address_1398123efb8313023484bd89.reference = {
    __cReference: true,
    get value() { return FIRE2____header_global_a5371f1e0efec13a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:618
export const CRACKKNUCKLES____header_global_a7d2878a78488274 = ((((((2324) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9db0b0a0a311a1fd8fae9d65() {
  return __cxx_static_address_9db0b0a0a311a1fd8fae9d65.reference || (__cxx_static_address_9db0b0a0a311a1fd8fae9d65.reference = {
    __cReference: true,
    get value() { return CRACKKNUCKLES____header_global_a7d2878a78488274; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:619
export const SMALLSMOKE____header_global_4f6eb78ae2370948 = ((((((2329) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1057bf9e62842802f6388f02() {
  return __cxx_static_address_1057bf9e62842802f6388f02.reference || (__cxx_static_address_1057bf9e62842802f6388f02.reference = {
    __cReference: true,
    get value() { return SMALLSMOKE____header_global_4f6eb78ae2370948; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:620
export const FLOORFLAME____header_global_df954e96a215d52b = ((((((2333) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_22655edff73be7e05d0e53b1() {
  return __cxx_static_address_22655edff73be7e05d0e53b1.reference || (__cxx_static_address_22655edff73be7e05d0e53b1.reference = {
    __cReference: true,
    get value() { return FLOORFLAME____header_global_df954e96a215d52b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:621
export const ROTATEGUN____header_global_fcae4413bf76bb85 = ((((((2360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ae069db18d822bd005034c13() {
  return __cxx_static_address_ae069db18d822bd005034c13.reference || (__cxx_static_address_ae069db18d822bd005034c13.reference = {
    __cReference: true,
    get value() { return ROTATEGUN____header_global_fcae4413bf76bb85; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:622
export const GREENSLIME____header_global_b79bd016fd94fd33 = ((((((2370) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_89b05a29156895c51618918b() {
  return __cxx_static_address_89b05a29156895c51618918b.reference || (__cxx_static_address_89b05a29156895c51618918b.reference = {
    __cReference: true,
    get value() { return GREENSLIME____header_global_b79bd016fd94fd33; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:623
export const WATERDRIPSPLASH____header_global_f4e8259c35be4f86 = ((((((2380) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f67e020b95fbdb595a0944f1() {
  return __cxx_static_address_f67e020b95fbdb595a0944f1.reference || (__cxx_static_address_f67e020b95fbdb595a0944f1.reference = {
    __cReference: true,
    get value() { return WATERDRIPSPLASH____header_global_f4e8259c35be4f86; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:624
export const SCRAP6____header_global_cd0022dcac7cdd1e = ((((((2390) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6e81fb49b9c365f90025d455() {
  return __cxx_static_address_6e81fb49b9c365f90025d455.reference || (__cxx_static_address_6e81fb49b9c365f90025d455.reference = {
    __cReference: true,
    get value() { return SCRAP6____header_global_cd0022dcac7cdd1e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:625
export const SCRAP1____header_global_1001c8477ce05188 = ((((((2400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_54bffa7cdf0c163b33ef110a() {
  return __cxx_static_address_54bffa7cdf0c163b33ef110a.reference || (__cxx_static_address_54bffa7cdf0c163b33ef110a.reference = {
    __cReference: true,
    get value() { return SCRAP1____header_global_1001c8477ce05188; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:626
export const SCRAP2____header_global_3b8452a459b59115 = ((((((2404) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e7be53a29c8e2612d6048861() {
  return __cxx_static_address_e7be53a29c8e2612d6048861.reference || (__cxx_static_address_e7be53a29c8e2612d6048861.reference = {
    __cReference: true,
    get value() { return SCRAP2____header_global_3b8452a459b59115; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:627
export const SCRAP3____header_global_ab6c04e3911d85b0 = ((((((2408) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1a2138f38c0c966237200d25() {
  return __cxx_static_address_1a2138f38c0c966237200d25.reference || (__cxx_static_address_1a2138f38c0c966237200d25.reference = {
    __cReference: true,
    get value() { return SCRAP3____header_global_ab6c04e3911d85b0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:628
export const SCRAP4____header_global_959ec199a68cdf85 = ((((((2412) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d348e6c0df21285b2d74ba37() {
  return __cxx_static_address_d348e6c0df21285b2d74ba37.reference || (__cxx_static_address_d348e6c0df21285b2d74ba37.reference = {
    __cReference: true,
    get value() { return SCRAP4____header_global_959ec199a68cdf85; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:629
export const SCRAP5____header_global_43d185ab68e38074 = ((((((2416) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_61e0caedac1b2d8dcb0e639c() {
  return __cxx_static_address_61e0caedac1b2d8dcb0e639c.reference || (__cxx_static_address_61e0caedac1b2d8dcb0e639c.reference = {
    __cReference: true,
    get value() { return SCRAP5____header_global_43d185ab68e38074; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:630
export const ORGANTIC____header_global_0d4d18a8dad1c92d = ((((((2420) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_043346773288c58896979a50() {
  return __cxx_static_address_043346773288c58896979a50.reference || (__cxx_static_address_043346773288c58896979a50.reference = {
    __cReference: true,
    get value() { return ORGANTIC____header_global_0d4d18a8dad1c92d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:631
export const BETAVERSION____header_global_08321d1103aaaac1 = ((((((2440) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_45772b0bfd4b8e4093bf9ae2() {
  return __cxx_static_address_45772b0bfd4b8e4093bf9ae2.reference || (__cxx_static_address_45772b0bfd4b8e4093bf9ae2.reference = {
    __cReference: true,
    get value() { return BETAVERSION____header_global_08321d1103aaaac1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:632
export const SELECTDIR____header_global_8b34064251a3e5f4 = ((((((2444) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_daa98ec3c644d15fdf0551fa() {
  return __cxx_static_address_daa98ec3c644d15fdf0551fa.reference || (__cxx_static_address_daa98ec3c644d15fdf0551fa.reference = {
    __cReference: true,
    get value() { return SELECTDIR____header_global_8b34064251a3e5f4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:633
export const F1HELP____header_global_e9ddc6ebf5cdba2e = ((((((2445) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_efa877a149e7299f05e5c064() {
  return __cxx_static_address_efa877a149e7299f05e5c064.reference || (__cxx_static_address_efa877a149e7299f05e5c064.reference = {
    __cReference: true,
    get value() { return F1HELP____header_global_e9ddc6ebf5cdba2e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:634
export const GROWSPARK____header_global_1f03d6c56a017f92 = ((((((2448) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a1de5520e2474428187962d5() {
  return __cxx_static_address_a1de5520e2474428187962d5.reference || (__cxx_static_address_a1de5520e2474428187962d5.reference = {
    __cReference: true,
    get value() { return GROWSPARK____header_global_1f03d6c56a017f92; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:635
export const MENUSCREEN____header_global_93347e725b796c5d = ((((((2456) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a4cd325ad5fabe69ec2034c0() {
  return __cxx_static_address_a4cd325ad5fabe69ec2034c0.reference || (__cxx_static_address_a4cd325ad5fabe69ec2034c0.reference = {
    __cReference: true,
    get value() { return MENUSCREEN____header_global_93347e725b796c5d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:636
export const MENUBAR____header_global_b53ac1e223fed1dc = ((((((2457) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c7fc5a3e6c6b6e617d4a5508() {
  return __cxx_static_address_c7fc5a3e6c6b6e617d4a5508.reference || (__cxx_static_address_c7fc5a3e6c6b6e617d4a5508.reference = {
    __cReference: true,
    get value() { return MENUBAR____header_global_b53ac1e223fed1dc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:637
export const KILLSICON____header_global_566e47f5b49263e0 = ((((((2458) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0b7824761b56b89fb9f5cf94() {
  return __cxx_static_address_0b7824761b56b89fb9f5cf94.reference || (__cxx_static_address_0b7824761b56b89fb9f5cf94.reference = {
    __cReference: true,
    get value() { return KILLSICON____header_global_566e47f5b49263e0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:638
export const FIRSTAID_ICON____header_global_5eb1487a19d21d3e = ((((((2460) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f07b52567c1ea5ffc082561f() {
  return __cxx_static_address_f07b52567c1ea5ffc082561f.reference || (__cxx_static_address_f07b52567c1ea5ffc082561f.reference = {
    __cReference: true,
    get value() { return FIRSTAID_ICON____header_global_5eb1487a19d21d3e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:639
export const HEAT_ICON____header_global_c5b8e2c96938b4ac = ((((((2461) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2eedbf759073f5abaab72c99() {
  return __cxx_static_address_2eedbf759073f5abaab72c99.reference || (__cxx_static_address_2eedbf759073f5abaab72c99.reference = {
    __cReference: true,
    get value() { return HEAT_ICON____header_global_c5b8e2c96938b4ac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:640
export const BOTTOMSTATUSBAR____header_global_7012057886449243 = ((((((2462) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_94ee4bdaec88611210f5ae51() {
  return __cxx_static_address_94ee4bdaec88611210f5ae51.reference || (__cxx_static_address_94ee4bdaec88611210f5ae51.reference = {
    __cReference: true,
    get value() { return BOTTOMSTATUSBAR____header_global_7012057886449243; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:641
export const BOOT_ICON____header_global_97d71245b330021a = ((((((2463) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_09f6fe688fcdc8e037db4aaf() {
  return __cxx_static_address_09f6fe688fcdc8e037db4aaf.reference || (__cxx_static_address_09f6fe688fcdc8e037db4aaf.reference = {
    __cReference: true,
    get value() { return BOOT_ICON____header_global_97d71245b330021a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:642
export const FRAGBAR____header_global_bec29bd7bd8a75a1 = ((((((2465) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3b9e283eeec5c2d98a6e4d95() {
  return __cxx_static_address_3b9e283eeec5c2d98a6e4d95.reference || (__cxx_static_address_3b9e283eeec5c2d98a6e4d95.reference = {
    __cReference: true,
    get value() { return FRAGBAR____header_global_bec29bd7bd8a75a1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:643
export const JETPACK_ICON____header_global_18a5e59be7bff17a = ((((((2467) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_544ebe26c35fc6dcb327956a() {
  return __cxx_static_address_544ebe26c35fc6dcb327956a.reference || (__cxx_static_address_544ebe26c35fc6dcb327956a.reference = {
    __cReference: true,
    get value() { return JETPACK_ICON____header_global_18a5e59be7bff17a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:644
export const AIRTANK_ICON____header_global_c3252d0746563906 = ((((((2468) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_474cd96ef1fadceedee7c28c() {
  return __cxx_static_address_474cd96ef1fadceedee7c28c.reference || (__cxx_static_address_474cd96ef1fadceedee7c28c.reference = {
    __cReference: true,
    get value() { return AIRTANK_ICON____header_global_c3252d0746563906; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:645
export const STEROIDS_ICON____header_global_345e350337aeb8d4 = ((((((2469) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_88eb192706e80445b4845cb8() {
  return __cxx_static_address_88eb192706e80445b4845cb8.reference || (__cxx_static_address_88eb192706e80445b4845cb8.reference = {
    __cReference: true,
    get value() { return STEROIDS_ICON____header_global_345e350337aeb8d4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:646
export const HOLODUKE_ICON____header_global_7d34278e1d54d26a = ((((((2470) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3fdac3a163c53e9368db282e() {
  return __cxx_static_address_3fdac3a163c53e9368db282e.reference || (__cxx_static_address_3fdac3a163c53e9368db282e.reference = {
    __cReference: true,
    get value() { return HOLODUKE_ICON____header_global_7d34278e1d54d26a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:647
export const ACCESS_ICON____header_global_e75bbb0cb681e2ed = ((((((2471) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_718b5eb47de04870ea89132d() {
  return __cxx_static_address_718b5eb47de04870ea89132d.reference || (__cxx_static_address_718b5eb47de04870ea89132d.reference = {
    __cReference: true,
    get value() { return ACCESS_ICON____header_global_e75bbb0cb681e2ed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:648
export const DIGITALNUM____header_global_badf6d213e9b6105 = ((((((2472) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_17739d815f152d7c37a60a47() {
  return __cxx_static_address_17739d815f152d7c37a60a47.reference || (__cxx_static_address_17739d815f152d7c37a60a47.reference = {
    __cReference: true,
    get value() { return DIGITALNUM____header_global_badf6d213e9b6105; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:649
export const DUKECAR____header_global_8f670c9b1df883c7 = ((((((2491) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f6b70a950076523d23dea333() {
  return __cxx_static_address_f6b70a950076523d23dea333.reference || (__cxx_static_address_f6b70a950076523d23dea333.reference = {
    __cReference: true,
    get value() { return DUKECAR____header_global_8f670c9b1df883c7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:650
export const CAMCORNER____header_global_ed1c3a96d67c1db5 = ((((((2482) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_09738f4bfbfdee4b13bf2946() {
  return __cxx_static_address_09738f4bfbfdee4b13bf2946.reference || (__cxx_static_address_09738f4bfbfdee4b13bf2946.reference = {
    __cReference: true,
    get value() { return CAMCORNER____header_global_ed1c3a96d67c1db5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:651
export const CAMLIGHT____header_global_db9070141829fadb = ((((((2484) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1322d5c0ab13a3bb013d9cbd() {
  return __cxx_static_address_1322d5c0ab13a3bb013d9cbd.reference || (__cxx_static_address_1322d5c0ab13a3bb013d9cbd.reference = {
    __cReference: true,
    get value() { return CAMLIGHT____header_global_db9070141829fadb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:652
export const SLIDEBAR____header_global_27eb2af3687b045e = ((((((2489) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1f4080dbdb9b42c224ac3475() {
  return __cxx_static_address_1f4080dbdb9b42c224ac3475.reference || (__cxx_static_address_1f4080dbdb9b42c224ac3475.reference = {
    __cReference: true,
    get value() { return SLIDEBAR____header_global_27eb2af3687b045e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:653
export const DREALMS____header_global_481819ac04f1134b = ((((((2492) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6a5e553ed754a5571811f0a2() {
  return __cxx_static_address_6a5e553ed754a5571811f0a2.reference || (__cxx_static_address_6a5e553ed754a5571811f0a2.reference = {
    __cReference: true,
    get value() { return DREALMS____header_global_481819ac04f1134b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:654
export const BETASCREEN____header_global_8c25058205b1db4d = ((((((2493) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_374e4c56451965312a517f17() {
  return __cxx_static_address_374e4c56451965312a517f17.reference || (__cxx_static_address_374e4c56451965312a517f17.reference = {
    __cReference: true,
    get value() { return BETASCREEN____header_global_8c25058205b1db4d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:655
export const WINDOWBORDER1____header_global_b01c4980b09888b1 = ((((((2494) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9a235fadbd0d92f098f3410d() {
  return __cxx_static_address_9a235fadbd0d92f098f3410d.reference || (__cxx_static_address_9a235fadbd0d92f098f3410d.reference = {
    __cReference: true,
    get value() { return WINDOWBORDER1____header_global_b01c4980b09888b1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:656
export const TEXTBOX____header_global_95b99d5f0d01eb50 = ((((((2495) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_84f8bd6754343a5577ba6eb5() {
  return __cxx_static_address_84f8bd6754343a5577ba6eb5.reference || (__cxx_static_address_84f8bd6754343a5577ba6eb5.reference = {
    __cReference: true,
    get value() { return TEXTBOX____header_global_95b99d5f0d01eb50; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:657
export const WINDOWBORDER2____header_global_ade7846b6493fbd4 = ((((((2496) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f17e46e9dfda62cd1b98d3d0() {
  return __cxx_static_address_f17e46e9dfda62cd1b98d3d0.reference || (__cxx_static_address_f17e46e9dfda62cd1b98d3d0.reference = {
    __cReference: true,
    get value() { return WINDOWBORDER2____header_global_ade7846b6493fbd4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:658
export const DUKENUKEM____header_global_afc8e2913921fa05 = ((((((2497) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6b60f26b42c11abca30e027b() {
  return __cxx_static_address_6b60f26b42c11abca30e027b.reference || (__cxx_static_address_6b60f26b42c11abca30e027b.reference = {
    __cReference: true,
    get value() { return DUKENUKEM____header_global_afc8e2913921fa05; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:659
export const THREEDEE____header_global_32757be8206c94e1 = ((((((2498) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7826ac619a5ecc5357930742() {
  return __cxx_static_address_7826ac619a5ecc5357930742.reference || (__cxx_static_address_7826ac619a5ecc5357930742.reference = {
    __cReference: true,
    get value() { return THREEDEE____header_global_32757be8206c94e1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:660
export const INGAMEDUKETHREEDEE____header_global_5118385634f1aa27 = ((((((2499) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_373cf625cc7b5dc5e257cad0() {
  return __cxx_static_address_373cf625cc7b5dc5e257cad0.reference || (__cxx_static_address_373cf625cc7b5dc5e257cad0.reference = {
    __cReference: true,
    get value() { return INGAMEDUKETHREEDEE____header_global_5118385634f1aa27; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:661
export const TENSCREEN____header_global_cd4b33231810e8b7 = ((((((2500) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_06056842defdc597bb97d4ef() {
  return __cxx_static_address_06056842defdc597bb97d4ef.reference || (__cxx_static_address_06056842defdc597bb97d4ef.reference = {
    __cReference: true,
    get value() { return TENSCREEN____header_global_cd4b33231810e8b7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:662
export const PLUTOPAKSPRITE____header_global_f1a374d1a9b5c48b = ((((((2501) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1a0fe1523fb9b3f78deb0b39() {
  return __cxx_static_address_1a0fe1523fb9b3f78deb0b39.reference || (__cxx_static_address_1a0fe1523fb9b3f78deb0b39.reference = {
    __cReference: true,
    get value() { return PLUTOPAKSPRITE____header_global_f1a374d1a9b5c48b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:663
export const DEVISTATOR____header_global_0f045409cb85d2e4 = ((((((2510) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b5cf9b26a8205003206ad9a2() {
  return __cxx_static_address_b5cf9b26a8205003206ad9a2.reference || (__cxx_static_address_b5cf9b26a8205003206ad9a2.reference = {
    __cReference: true,
    get value() { return DEVISTATOR____header_global_0f045409cb85d2e4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:664
export const KNEE____header_global_77aafc605105b349 = ((((((2521) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_77d14692948151da908006cd() {
  return __cxx_static_address_77d14692948151da908006cd.reference || (__cxx_static_address_77d14692948151da908006cd.reference = {
    __cReference: true,
    get value() { return KNEE____header_global_77aafc605105b349; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:665
export const CROSSHAIR____header_global_b539b831943069a4 = ((((((2523) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3e82623a7f9ccb92f1ba3ef1() {
  return __cxx_static_address_3e82623a7f9ccb92f1ba3ef1.reference || (__cxx_static_address_3e82623a7f9ccb92f1ba3ef1.reference = {
    __cReference: true,
    get value() { return CROSSHAIR____header_global_b539b831943069a4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:666
export const FIRSTGUN____header_global_34f68cb635c032b9 = ((((((2524) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1a562fbfbdfbdb41818d7a39() {
  return __cxx_static_address_1a562fbfbdfbdb41818d7a39.reference || (__cxx_static_address_1a562fbfbdfbdb41818d7a39.reference = {
    __cReference: true,
    get value() { return FIRSTGUN____header_global_34f68cb635c032b9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:667
export const FIRSTGUNRELOAD____header_global_8b7d7acabe946bd3 = ((((((2528) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_098b04b53733f3f107c80242() {
  return __cxx_static_address_098b04b53733f3f107c80242.reference || (__cxx_static_address_098b04b53733f3f107c80242.reference = {
    __cReference: true,
    get value() { return FIRSTGUNRELOAD____header_global_8b7d7acabe946bd3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:668
export const SHELL____header_global_544500a1bf55c2e4 = ((((((2533) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_84c40de90ed2ee45c31d750c() {
  return __cxx_static_address_84c40de90ed2ee45c31d750c.reference || (__cxx_static_address_84c40de90ed2ee45c31d750c.reference = {
    __cReference: true,
    get value() { return SHELL____header_global_544500a1bf55c2e4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:669
export const SHOTGUNSHELL____header_global_74a24403bc2b5d49 = ((((((2535) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_23f7a1f62c52ccf2b5362a4d() {
  return __cxx_static_address_23f7a1f62c52ccf2b5362a4d.reference || (__cxx_static_address_23f7a1f62c52ccf2b5362a4d.reference = {
    __cReference: true,
    get value() { return SHOTGUNSHELL____header_global_74a24403bc2b5d49; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:670
export const CHAINGUN____header_global_0972313f5a261a0f = ((((((2536) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fec2ef535f22f2f7cf4b37c0() {
  return __cxx_static_address_fec2ef535f22f2f7cf4b37c0.reference || (__cxx_static_address_fec2ef535f22f2f7cf4b37c0.reference = {
    __cReference: true,
    get value() { return CHAINGUN____header_global_0972313f5a261a0f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:671
export const RPGGUN____header_global_0f5e8388b84417c5 = ((((((2544) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cb5e7e586df860579c43a79e() {
  return __cxx_static_address_cb5e7e586df860579c43a79e.reference || (__cxx_static_address_cb5e7e586df860579c43a79e.reference = {
    __cReference: true,
    get value() { return RPGGUN____header_global_0f5e8388b84417c5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:672
export const FREEZE____header_global_db6cb27d4049fda8 = ((((((2548) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7f6d0b4a16579a122ccf4ad1() {
  return __cxx_static_address_7f6d0b4a16579a122ccf4ad1.reference || (__cxx_static_address_7f6d0b4a16579a122ccf4ad1.reference = {
    __cReference: true,
    get value() { return FREEZE____header_global_db6cb27d4049fda8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:673
export const SHRINKER____header_global_87561711a1693d34 = ((((((2556) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c8919909199111f1368b409b() {
  return __cxx_static_address_c8919909199111f1368b409b.reference || (__cxx_static_address_c8919909199111f1368b409b.reference = {
    __cReference: true,
    get value() { return SHRINKER____header_global_87561711a1693d34; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:674
export const HANDHOLDINGLASER____header_global_363152424a01b8fb = ((((((2563) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_981d4bfd2fdc8df4b3d828e2() {
  return __cxx_static_address_981d4bfd2fdc8df4b3d828e2.reference || (__cxx_static_address_981d4bfd2fdc8df4b3d828e2.reference = {
    __cReference: true,
    get value() { return HANDHOLDINGLASER____header_global_363152424a01b8fb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:675
export const TRIPBOMB____header_global_0cf3b90889013143 = ((((((2566) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9e2836e8b27746424ea8c046() {
  return __cxx_static_address_9e2836e8b27746424ea8c046.reference || (__cxx_static_address_9e2836e8b27746424ea8c046.reference = {
    __cReference: true,
    get value() { return TRIPBOMB____header_global_0cf3b90889013143; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:676
export const LASERLINE____header_global_543c098dd5e38c80 = ((((((2567) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b48268a396ac11ee9888184e() {
  return __cxx_static_address_b48268a396ac11ee9888184e.reference || (__cxx_static_address_b48268a396ac11ee9888184e.reference = {
    __cReference: true,
    get value() { return LASERLINE____header_global_543c098dd5e38c80; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:677
export const HANDHOLDINGACCESS____header_global_ada85112aef1a276 = ((((((2568) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4a855c1c27ae21ba363057ae() {
  return __cxx_static_address_4a855c1c27ae21ba363057ae.reference || (__cxx_static_address_4a855c1c27ae21ba363057ae.reference = {
    __cReference: true,
    get value() { return HANDHOLDINGACCESS____header_global_ada85112aef1a276; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:678
export const HANDREMOTE____header_global_55fe9054e792492b = ((((((2570) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_19e1a7076cefb452c6bbbf2b() {
  return __cxx_static_address_19e1a7076cefb452c6bbbf2b.reference || (__cxx_static_address_19e1a7076cefb452c6bbbf2b.reference = {
    __cReference: true,
    get value() { return HANDREMOTE____header_global_55fe9054e792492b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:679
export const HANDTHROW____header_global_02e2d48762a31db6 = ((((((2573) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1b99efd3cdce43c80480fab1() {
  return __cxx_static_address_1b99efd3cdce43c80480fab1.reference || (__cxx_static_address_1b99efd3cdce43c80480fab1.reference = {
    __cReference: true,
    get value() { return HANDTHROW____header_global_02e2d48762a31db6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:680
export const TIP____header_global_386cc041c984c006 = ((((((2576) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b50960cee03de1f81da08df8() {
  return __cxx_static_address_b50960cee03de1f81da08df8.reference || (__cxx_static_address_b50960cee03de1f81da08df8.reference = {
    __cReference: true,
    get value() { return TIP____header_global_386cc041c984c006; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:681
export const SCUBAMASK____header_global_53e605b27dc5086f = ((((((2581) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d921dda5a526b018245c1d7f() {
  return __cxx_static_address_d921dda5a526b018245c1d7f.reference || (__cxx_static_address_d921dda5a526b018245c1d7f.reference = {
    __cReference: true,
    get value() { return SCUBAMASK____header_global_53e605b27dc5086f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:682
export const FORCESPHERE____header_global_c8da9e2493292dbd = ((((((2590) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aa2f14d4e068ca6579a0b9db() {
  return __cxx_static_address_aa2f14d4e068ca6579a0b9db.reference || (__cxx_static_address_aa2f14d4e068ca6579a0b9db.reference = {
    __cReference: true,
    get value() { return FORCESPHERE____header_global_c8da9e2493292dbd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:683
export const SHOTSPARK1____header_global_1ddec4e6eee98dfe = ((((((2595) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5963302cf33152ace594c931() {
  return __cxx_static_address_5963302cf33152ace594c931.reference || (__cxx_static_address_5963302cf33152ace594c931.reference = {
    __cReference: true,
    get value() { return SHOTSPARK1____header_global_1ddec4e6eee98dfe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:684
export const RPG____header_global_e45d57ce868d29b7 = ((((((2605) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2d2c4e0562658e83868d1414() {
  return __cxx_static_address_2d2c4e0562658e83868d1414.reference || (__cxx_static_address_2d2c4e0562658e83868d1414.reference = {
    __cReference: true,
    get value() { return RPG____header_global_e45d57ce868d29b7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:685
export const LASERSITE____header_global_c31b62e8e6e01fce = ((((((2612) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_208493664254a556972f0b78() {
  return __cxx_static_address_208493664254a556972f0b78.reference || (__cxx_static_address_208493664254a556972f0b78.reference = {
    __cReference: true,
    get value() { return LASERSITE____header_global_c31b62e8e6e01fce; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:686
export const SHOTGUN____header_global_64190e7a3c961b62 = ((((((2613) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aadead1917659a13c9179745() {
  return __cxx_static_address_aadead1917659a13c9179745.reference || (__cxx_static_address_aadead1917659a13c9179745.reference = {
    __cReference: true,
    get value() { return SHOTGUN____header_global_64190e7a3c961b62; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:687
export const BOSS1____header_global_37e2658da9ea078a = ((((((2630) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ceca5dddf410b938052566cf() {
  return __cxx_static_address_ceca5dddf410b938052566cf.reference || (__cxx_static_address_ceca5dddf410b938052566cf.reference = {
    __cReference: true,
    get value() { return BOSS1____header_global_37e2658da9ea078a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:688
export const BOSS1STAYPUT____header_global_f2338c5800810d45 = ((((((2631) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_684d184308abeddf6f325558() {
  return __cxx_static_address_684d184308abeddf6f325558.reference || (__cxx_static_address_684d184308abeddf6f325558.reference = {
    __cReference: true,
    get value() { return BOSS1STAYPUT____header_global_f2338c5800810d45; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:689
export const BOSS1SHOOT____header_global_ef38fc3cdd127132 = ((((((2660) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_69eb604dcfb12e8cac951517() {
  return __cxx_static_address_69eb604dcfb12e8cac951517.reference || (__cxx_static_address_69eb604dcfb12e8cac951517.reference = {
    __cReference: true,
    get value() { return BOSS1SHOOT____header_global_ef38fc3cdd127132; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:690
export const BOSS1LOB____header_global_c6f63b53debb02fb = ((((((2670) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e413fe8c0d1ccc3832381590() {
  return __cxx_static_address_e413fe8c0d1ccc3832381590.reference || (__cxx_static_address_e413fe8c0d1ccc3832381590.reference = {
    __cReference: true,
    get value() { return BOSS1LOB____header_global_c6f63b53debb02fb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:691
export const BOSSTOP____header_global_d9041bd4666f2c62 = ((((((2696) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_98fb4401422030ccc14c7122() {
  return __cxx_static_address_98fb4401422030ccc14c7122.reference || (__cxx_static_address_98fb4401422030ccc14c7122.reference = {
    __cReference: true,
    get value() { return BOSSTOP____header_global_d9041bd4666f2c62; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:692
export const BOSS2____header_global_4dc911be24331f12 = ((((((2710) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e9182ac119872a0a065a41dc() {
  return __cxx_static_address_e9182ac119872a0a065a41dc.reference || (__cxx_static_address_e9182ac119872a0a065a41dc.reference = {
    __cReference: true,
    get value() { return BOSS2____header_global_4dc911be24331f12; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:693
export const BOSS3____header_global_152d0b10664dc0ec = ((((((2760) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0b68fce5ae24af3e046df5e0() {
  return __cxx_static_address_0b68fce5ae24af3e046df5e0.reference || (__cxx_static_address_0b68fce5ae24af3e046df5e0.reference = {
    __cReference: true,
    get value() { return BOSS3____header_global_152d0b10664dc0ec; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:694
export const SPINNINGNUKEICON____header_global_63dd8d6e86f1ec6a = ((((((2813) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2cb1a552e0ae009691b6877a() {
  return __cxx_static_address_2cb1a552e0ae009691b6877a.reference || (__cxx_static_address_2cb1a552e0ae009691b6877a.reference = {
    __cReference: true,
    get value() { return SPINNINGNUKEICON____header_global_63dd8d6e86f1ec6a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:695
export const SMALLFNTCURSOR____header_global_cffd24c4994fd8bf = ((((((2821) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c35358437bc25b03a6f93a6f() {
  return __cxx_static_address_c35358437bc25b03a6f93a6f.reference || (__cxx_static_address_c35358437bc25b03a6f93a6f.reference = {
    __cReference: true,
    get value() { return SMALLFNTCURSOR____header_global_cffd24c4994fd8bf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:696
export const STARTALPHANUM____header_global_c81ab185d085ed4e = ((((((2822) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_63f6964980e06fc859f9dc56() {
  return __cxx_static_address_63f6964980e06fc859f9dc56.reference || (__cxx_static_address_63f6964980e06fc859f9dc56.reference = {
    __cReference: true,
    get value() { return STARTALPHANUM____header_global_c81ab185d085ed4e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:697
export const ENDALPHANUM____header_global_2df7b12c60ad8775 = ((((((2915) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_837d1eece9b32de889400e0f() {
  return __cxx_static_address_837d1eece9b32de889400e0f.reference || (__cxx_static_address_837d1eece9b32de889400e0f.reference = {
    __cReference: true,
    get value() { return ENDALPHANUM____header_global_2df7b12c60ad8775; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:698
export const BIGALPHANUM____header_global_c63e5fb52035d68c = ((((((2940) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d4766085b2ffb11a946760d8() {
  return __cxx_static_address_d4766085b2ffb11a946760d8.reference || (__cxx_static_address_d4766085b2ffb11a946760d8.reference = {
    __cReference: true,
    get value() { return BIGALPHANUM____header_global_c63e5fb52035d68c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:699
export const BIGPERIOD____header_global_135dfdcae92c9898 = ((((((3002) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_39f7492e715208b8456739c6() {
  return __cxx_static_address_39f7492e715208b8456739c6.reference || (__cxx_static_address_39f7492e715208b8456739c6.reference = {
    __cReference: true,
    get value() { return BIGPERIOD____header_global_135dfdcae92c9898; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:700
export const BIGCOMMA____header_global_44bd538b0cb38b36 = ((((((3003) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0ba5c224eb6cd585dece2199() {
  return __cxx_static_address_0ba5c224eb6cd585dece2199.reference || (__cxx_static_address_0ba5c224eb6cd585dece2199.reference = {
    __cReference: true,
    get value() { return BIGCOMMA____header_global_44bd538b0cb38b36; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:701
export const BIGX____header_global_e95a5a0e626ee330 = ((((((3004) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c8b38569e596483e45abd8a9() {
  return __cxx_static_address_c8b38569e596483e45abd8a9.reference || (__cxx_static_address_c8b38569e596483e45abd8a9.reference = {
    __cReference: true,
    get value() { return BIGX____header_global_e95a5a0e626ee330; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:702
export const BIGQ____header_global_997843940aa5cccb = ((((((3005) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b7dc0e56279434baf3e295c9() {
  return __cxx_static_address_b7dc0e56279434baf3e295c9.reference || (__cxx_static_address_b7dc0e56279434baf3e295c9.reference = {
    __cReference: true,
    get value() { return BIGQ____header_global_997843940aa5cccb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:703
export const BIGSEMI____header_global_369078ea1a426e67 = ((((((3006) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cdcca8999194107338435ca6() {
  return __cxx_static_address_cdcca8999194107338435ca6.reference || (__cxx_static_address_cdcca8999194107338435ca6.reference = {
    __cReference: true,
    get value() { return BIGSEMI____header_global_369078ea1a426e67; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:704
export const BIGCOLIN____header_global_4353dbd5c5e0c2fa = ((((((3007) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_431d8842ad62f871e7ef2dbf() {
  return __cxx_static_address_431d8842ad62f871e7ef2dbf.reference || (__cxx_static_address_431d8842ad62f871e7ef2dbf.reference = {
    __cReference: true,
    get value() { return BIGCOLIN____header_global_4353dbd5c5e0c2fa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:705
export const THREEBYFIVE____header_global_0934609508e5f84c = ((((((3010) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2f1d46d52278cda974ec9b2d() {
  return __cxx_static_address_2f1d46d52278cda974ec9b2d.reference || (__cxx_static_address_2f1d46d52278cda974ec9b2d.reference = {
    __cReference: true,
    get value() { return THREEBYFIVE____header_global_0934609508e5f84c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:706
export const BIGAPPOS____header_global_32e89a682a849363 = ((((((3022) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_173ad722fc847d8607098b81() {
  return __cxx_static_address_173ad722fc847d8607098b81.reference || (__cxx_static_address_173ad722fc847d8607098b81.reference = {
    __cReference: true,
    get value() { return BIGAPPOS____header_global_32e89a682a849363; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:707
export const MINIFONT____header_global_f0332751e274f7a7 = ((((((3072) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f87fa9f90e23c9bbbbc6a7ac() {
  return __cxx_static_address_f87fa9f90e23c9bbbbc6a7ac.reference || (__cxx_static_address_f87fa9f90e23c9bbbbc6a7ac.reference = {
    __cReference: true,
    get value() { return MINIFONT____header_global_f0332751e274f7a7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:708
export const RESPAWNMARKERRED____header_global_46fab79f5f4aaf62 = ((((((3190) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_588eed7a435b55a1cde5d12d() {
  return __cxx_static_address_588eed7a435b55a1cde5d12d.reference || (__cxx_static_address_588eed7a435b55a1cde5d12d.reference = {
    __cReference: true,
    get value() { return RESPAWNMARKERRED____header_global_46fab79f5f4aaf62; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:709
export const RESPAWNMARKERYELLOW____header_global_79c0f60a6d81dc79 = ((((((3200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6d976738df40f8f556c2fe95() {
  return __cxx_static_address_6d976738df40f8f556c2fe95.reference || (__cxx_static_address_6d976738df40f8f556c2fe95.reference = {
    __cReference: true,
    get value() { return RESPAWNMARKERYELLOW____header_global_79c0f60a6d81dc79; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:710
export const RESPAWNMARKERGREEN____header_global_4e0bd45148c45255 = ((((((3210) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9ceb8bd1ae8c639bfd5dd2b0() {
  return __cxx_static_address_9ceb8bd1ae8c639bfd5dd2b0.reference || (__cxx_static_address_9ceb8bd1ae8c639bfd5dd2b0.reference = {
    __cReference: true,
    get value() { return RESPAWNMARKERGREEN____header_global_4e0bd45148c45255; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:711
export const BONUSSCREEN____header_global_faf66ce0d772c067 = ((((((3240) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b78a59e502af4397a47c1d50() {
  return __cxx_static_address_b78a59e502af4397a47c1d50.reference || (__cxx_static_address_b78a59e502af4397a47c1d50.reference = {
    __cReference: true,
    get value() { return BONUSSCREEN____header_global_faf66ce0d772c067; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:712
export const VIEWBORDER____header_global_34506ec8eda41484 = ((((((3250) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a1c70b4f971855812b4d7977() {
  return __cxx_static_address_a1c70b4f971855812b4d7977.reference || (__cxx_static_address_a1c70b4f971855812b4d7977.reference = {
    __cReference: true,
    get value() { return VIEWBORDER____header_global_34506ec8eda41484; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:713
export const VICTORY1____header_global_b66a7aa5efefeebc = ((((((3260) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ad158b5bce9fb44864bea088() {
  return __cxx_static_address_ad158b5bce9fb44864bea088.reference || (__cxx_static_address_ad158b5bce9fb44864bea088.reference = {
    __cReference: true,
    get value() { return VICTORY1____header_global_b66a7aa5efefeebc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:714
export const ORDERING____header_global_4dbf3fba80bbe546 = ((((((3270) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ac8e328e31edcd1334497f01() {
  return __cxx_static_address_ac8e328e31edcd1334497f01.reference || (__cxx_static_address_ac8e328e31edcd1334497f01.reference = {
    __cReference: true,
    get value() { return ORDERING____header_global_4dbf3fba80bbe546; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:715
export const TEXTSTORY____header_global_385e3e043ee148ca = ((((((3280) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2a2cd7a90095dc56c82f62ca() {
  return __cxx_static_address_2a2cd7a90095dc56c82f62ca.reference || (__cxx_static_address_2a2cd7a90095dc56c82f62ca.reference = {
    __cReference: true,
    get value() { return TEXTSTORY____header_global_385e3e043ee148ca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:716
export const LOADSCREEN____header_global_176dc770a1ca9cec = ((((((3281) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c95f3e3acfc5c402e7d8c629() {
  return __cxx_static_address_c95f3e3acfc5c402e7d8c629.reference || (__cxx_static_address_c95f3e3acfc5c402e7d8c629.reference = {
    __cReference: true,
    get value() { return LOADSCREEN____header_global_176dc770a1ca9cec; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:717
export const BORNTOBEWILDSCREEN____header_global_7e04fa0d41413507 = ((((((3370) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_08cc37364f9b7e8a75f0c197() {
  return __cxx_static_address_08cc37364f9b7e8a75f0c197.reference || (__cxx_static_address_08cc37364f9b7e8a75f0c197.reference = {
    __cReference: true,
    get value() { return BORNTOBEWILDSCREEN____header_global_7e04fa0d41413507; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:718
export const BLIMP____header_global_774e44988ff1bfef = ((((((3400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_987f2162cc43e64fb2e3fd56() {
  return __cxx_static_address_987f2162cc43e64fb2e3fd56.reference || (__cxx_static_address_987f2162cc43e64fb2e3fd56.reference = {
    __cReference: true,
    get value() { return BLIMP____header_global_774e44988ff1bfef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:719
export const FEM9____header_global_5b7b6f449b5f41e8 = ((((((3450) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c3904789dfa4131733f6d19d() {
  return __cxx_static_address_c3904789dfa4131733f6d19d.reference || (__cxx_static_address_c3904789dfa4131733f6d19d.reference = {
    __cReference: true,
    get value() { return FEM9____header_global_5b7b6f449b5f41e8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:720
export const FRAMEEFFECT1_13____header_global_d95ead0817023f96 = ((((((3999) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1a1f5e04e9094d7f63b6923a() {
  return __cxx_static_address_1a1f5e04e9094d7f63b6923a.reference || (__cxx_static_address_1a1f5e04e9094d7f63b6923a.reference = {
    __cReference: true,
    get value() { return FRAMEEFFECT1_13____header_global_d95ead0817023f96; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:721
export const FRAMEEFFECT1____header_global_095fab75407a2cfd = ((((((4095) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e18d1526148d74e4e3848261() {
  return __cxx_static_address_e18d1526148d74e4e3848261.reference || (__cxx_static_address_e18d1526148d74e4e3848261.reference = {
    __cReference: true,
    get value() { return FRAMEEFFECT1____header_global_095fab75407a2cfd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:722
export const PANNEL3____header_global_eca5442a831bace4 = ((((((4099) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1500eb6f6c52420e9ae30037() {
  return __cxx_static_address_1500eb6f6c52420e9ae30037.reference || (__cxx_static_address_1500eb6f6c52420e9ae30037.reference = {
    __cReference: true,
    get value() { return PANNEL3____header_global_eca5442a831bace4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:723
export const SCREENBREAK14____header_global_74dc06c420f330fe = ((((((4120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7f41807ae8f4097e4f7a04e8() {
  return __cxx_static_address_7f41807ae8f4097e4f7a04e8.reference || (__cxx_static_address_7f41807ae8f4097e4f7a04e8.reference = {
    __cReference: true,
    get value() { return SCREENBREAK14____header_global_74dc06c420f330fe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:724
export const SCREENBREAK15____header_global_1d9a39a6f5e00945 = ((((((4123) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_360d6ae4502133bf70b9d779() {
  return __cxx_static_address_360d6ae4502133bf70b9d779.reference || (__cxx_static_address_360d6ae4502133bf70b9d779.reference = {
    __cReference: true,
    get value() { return SCREENBREAK15____header_global_1d9a39a6f5e00945; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:725
export const SCREENBREAK19____header_global_f7f1b177371dc197 = ((((((4125) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d4a26b998a0e0adb750d14ec() {
  return __cxx_static_address_d4a26b998a0e0adb750d14ec.reference || (__cxx_static_address_d4a26b998a0e0adb750d14ec.reference = {
    __cReference: true,
    get value() { return SCREENBREAK19____header_global_f7f1b177371dc197; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:726
export const SCREENBREAK16____header_global_b48d3b4bc91a0012 = ((((((4127) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6745b23f9c24b76fb6a27f7a() {
  return __cxx_static_address_6745b23f9c24b76fb6a27f7a.reference || (__cxx_static_address_6745b23f9c24b76fb6a27f7a.reference = {
    __cReference: true,
    get value() { return SCREENBREAK16____header_global_b48d3b4bc91a0012; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:727
export const SCREENBREAK17____header_global_f027170e8c7a0b7d = ((((((4128) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3de24c4e94c8af8334721803() {
  return __cxx_static_address_3de24c4e94c8af8334721803.reference || (__cxx_static_address_3de24c4e94c8af8334721803.reference = {
    __cReference: true,
    get value() { return SCREENBREAK17____header_global_f027170e8c7a0b7d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:728
export const SCREENBREAK18____header_global_4a58481dbb912cc2 = ((((((4129) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4c45732f7652a32403b265bd() {
  return __cxx_static_address_4c45732f7652a32403b265bd.reference || (__cxx_static_address_4c45732f7652a32403b265bd.reference = {
    __cReference: true,
    get value() { return SCREENBREAK18____header_global_4a58481dbb912cc2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:729
export const W_TECHWALL11____header_global_7d930bd915295dc1 = ((((((4130) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2d080f035bceca328743b0e2() {
  return __cxx_static_address_2d080f035bceca328743b0e2.reference || (__cxx_static_address_2d080f035bceca328743b0e2.reference = {
    __cReference: true,
    get value() { return W_TECHWALL11____header_global_7d930bd915295dc1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:730
export const W_TECHWALL12____header_global_c1c5f2c6e48f01d5 = ((((((4131) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0f47fa21a31167c7af4cec69() {
  return __cxx_static_address_0f47fa21a31167c7af4cec69.reference || (__cxx_static_address_0f47fa21a31167c7af4cec69.reference = {
    __cReference: true,
    get value() { return W_TECHWALL12____header_global_c1c5f2c6e48f01d5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:731
export const W_TECHWALL13____header_global_e4550d6648eb359e = ((((((4132) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b968c3ad611ed22eb3d1ba51() {
  return __cxx_static_address_b968c3ad611ed22eb3d1ba51.reference || (__cxx_static_address_b968c3ad611ed22eb3d1ba51.reference = {
    __cReference: true,
    get value() { return W_TECHWALL13____header_global_e4550d6648eb359e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:732
export const W_TECHWALL14____header_global_a437ec9056182620 = ((((((4133) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a28e193665f3d0e68817006f() {
  return __cxx_static_address_a28e193665f3d0e68817006f.reference || (__cxx_static_address_a28e193665f3d0e68817006f.reference = {
    __cReference: true,
    get value() { return W_TECHWALL14____header_global_a437ec9056182620; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:733
export const W_TECHWALL5____header_global_295d4b84360eb2d2 = ((((((4134) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_311486d952a2f3e007436478() {
  return __cxx_static_address_311486d952a2f3e007436478.reference || (__cxx_static_address_311486d952a2f3e007436478.reference = {
    __cReference: true,
    get value() { return W_TECHWALL5____header_global_295d4b84360eb2d2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:734
export const W_TECHWALL6____header_global_8a76ee61fbc1e2d6 = ((((((4136) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3a2809b43e89d1b64f23d627() {
  return __cxx_static_address_3a2809b43e89d1b64f23d627.reference || (__cxx_static_address_3a2809b43e89d1b64f23d627.reference = {
    __cReference: true,
    get value() { return W_TECHWALL6____header_global_8a76ee61fbc1e2d6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:735
export const W_TECHWALL7____header_global_e200ad8db5ece789 = ((((((4138) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_803147cd6cb81b0cb8534930() {
  return __cxx_static_address_803147cd6cb81b0cb8534930.reference || (__cxx_static_address_803147cd6cb81b0cb8534930.reference = {
    __cReference: true,
    get value() { return W_TECHWALL7____header_global_e200ad8db5ece789; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:736
export const W_TECHWALL8____header_global_3c942dbeb26eed87 = ((((((4140) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9f2e1e4382cf3a6b4bc881bf() {
  return __cxx_static_address_9f2e1e4382cf3a6b4bc881bf.reference || (__cxx_static_address_9f2e1e4382cf3a6b4bc881bf.reference = {
    __cReference: true,
    get value() { return W_TECHWALL8____header_global_3c942dbeb26eed87; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:737
export const W_TECHWALL9____header_global_9652e5c1de1395c6 = ((((((4142) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4236d6fc799fead6747121bb() {
  return __cxx_static_address_4236d6fc799fead6747121bb.reference || (__cxx_static_address_4236d6fc799fead6747121bb.reference = {
    __cReference: true,
    get value() { return W_TECHWALL9____header_global_9652e5c1de1395c6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:738
export const BPANNEL3____header_global_70106feea0b760bc = ((((((4100) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_216fd78fa1424d876a8c5b35() {
  return __cxx_static_address_216fd78fa1424d876a8c5b35.reference || (__cxx_static_address_216fd78fa1424d876a8c5b35.reference = {
    __cReference: true,
    get value() { return BPANNEL3____header_global_70106feea0b760bc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:739
export const W_HITTECHWALL16____header_global_7014dc0cb0e34dac = ((((((4144) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2195e8a4f330d44934296691() {
  return __cxx_static_address_2195e8a4f330d44934296691.reference || (__cxx_static_address_2195e8a4f330d44934296691.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL16____header_global_7014dc0cb0e34dac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:740
export const W_HITTECHWALL10____header_global_a85df7b4ba1ddca7 = ((((((4145) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f0ad99d4d01d0441fe255a5b() {
  return __cxx_static_address_f0ad99d4d01d0441fe255a5b.reference || (__cxx_static_address_f0ad99d4d01d0441fe255a5b.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL10____header_global_a85df7b4ba1ddca7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:741
export const W_HITTECHWALL15____header_global_0d5e173d08fea41d = ((((((4147) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6f61b1227b5239e582280dab() {
  return __cxx_static_address_6f61b1227b5239e582280dab.reference || (__cxx_static_address_6f61b1227b5239e582280dab.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL15____header_global_0d5e173d08fea41d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:742
export const W_MILKSHELF____header_global_d64f9b4c73124aa6 = ((((((4181) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_85b48691f83b5dc373b722a7() {
  return __cxx_static_address_85b48691f83b5dc373b722a7.reference || (__cxx_static_address_85b48691f83b5dc373b722a7.reference = {
    __cReference: true,
    get value() { return W_MILKSHELF____header_global_d64f9b4c73124aa6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:743
export const W_MILKSHELFBROKE____header_global_39f2b005b6be8ddb = ((((((4203) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b633dcda5904d3be868166b2() {
  return __cxx_static_address_b633dcda5904d3be868166b2.reference || (__cxx_static_address_b633dcda5904d3be868166b2.reference = {
    __cReference: true,
    get value() { return W_MILKSHELFBROKE____header_global_39f2b005b6be8ddb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:744
export const PURPLELAVA____header_global_6336020dd0540101 = ((((((4240) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_01d32bb2a85d2305614f3017() {
  return __cxx_static_address_01d32bb2a85d2305614f3017.reference || (__cxx_static_address_01d32bb2a85d2305614f3017.reference = {
    __cReference: true,
    get value() { return PURPLELAVA____header_global_6336020dd0540101; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:745
export const TARGET____header_global_889d5b173ae04c14 = ((((((4359) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bd20634f2f393afbfe5ea5e1() {
  return __cxx_static_address_bd20634f2f393afbfe5ea5e1.reference || (__cxx_static_address_bd20634f2f393afbfe5ea5e1.reference = {
    __cReference: true,
    get value() { return TARGET____header_global_889d5b173ae04c14; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:746
export const DUCK____header_global_807df0bd4bec93dd = ((((((4361) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b2f288534add44c1f1f6949c() {
  return __cxx_static_address_b2f288534add44c1f1f6949c.reference || (__cxx_static_address_b2f288534add44c1f1f6949c.reference = {
    __cReference: true,
    get value() { return DUCK____header_global_807df0bd4bec93dd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:747
export const PUKE____header_global_43789b85711123c3 = ((((((4389) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d2392daf1715b88d32059fdd() {
  return __cxx_static_address_d2392daf1715b88d32059fdd.reference || (__cxx_static_address_d2392daf1715b88d32059fdd.reference = {
    __cReference: true,
    get value() { return PUKE____header_global_43789b85711123c3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:748
export const DOORTILE23____header_global_9359631371b95059 = ((((((4391) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f2a64f2865b5bb9c211fed6a() {
  return __cxx_static_address_f2a64f2865b5bb9c211fed6a.reference || (__cxx_static_address_f2a64f2865b5bb9c211fed6a.reference = {
    __cReference: true,
    get value() { return DOORTILE23____header_global_9359631371b95059; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:749
export const SPEAKER____header_global_9bc3efd802df974e = ((((((4397) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b6f2b0e6def0ba883db0c897() {
  return __cxx_static_address_b6f2b0e6def0ba883db0c897.reference || (__cxx_static_address_b6f2b0e6def0ba883db0c897.reference = {
    __cReference: true,
    get value() { return SPEAKER____header_global_9bc3efd802df974e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:750
export const MAIL____header_global_431f72d7fac0784c = ((((((4410) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_45e8a0d56b0dae20d3d15f02() {
  return __cxx_static_address_45e8a0d56b0dae20d3d15f02.reference || (__cxx_static_address_45e8a0d56b0dae20d3d15f02.reference = {
    __cReference: true,
    get value() { return MAIL____header_global_431f72d7fac0784c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:751
export const HOTMEAT____header_global_5d730bbf5352da03 = ((((((4427) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_524bb17bba7d7f92e7e4fcda() {
  return __cxx_static_address_524bb17bba7d7f92e7e4fcda.reference || (__cxx_static_address_524bb17bba7d7f92e7e4fcda.reference = {
    __cReference: true,
    get value() { return HOTMEAT____header_global_5d730bbf5352da03; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:752
export const TRIPODCAMERA____header_global_c24642249137374a = ((((((4444) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4e24332d52bdb225f17e6bda() {
  return __cxx_static_address_4e24332d52bdb225f17e6bda.reference || (__cxx_static_address_4e24332d52bdb225f17e6bda.reference = {
    __cReference: true,
    get value() { return TRIPODCAMERA____header_global_c24642249137374a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:753
export const PAPER____header_global_1652125714d9e976 = ((((((4460) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7f75d12f417ec32212f8df71() {
  return __cxx_static_address_7f75d12f417ec32212f8df71.reference || (__cxx_static_address_7f75d12f417ec32212f8df71.reference = {
    __cReference: true,
    get value() { return PAPER____header_global_1652125714d9e976; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:754
export const GENERICPOLE2____header_global_208278d528a3f344 = ((((((4465) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8db7860d27fec3818fa74dca() {
  return __cxx_static_address_8db7860d27fec3818fa74dca.reference || (__cxx_static_address_8db7860d27fec3818fa74dca.reference = {
    __cReference: true,
    get value() { return GENERICPOLE2____header_global_208278d528a3f344; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:755
export const XXXSTACY____header_global_085eb62106659498 = ((((((4470) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4d82e93f9d73eaff4b0ff880() {
  return __cxx_static_address_4d82e93f9d73eaff4b0ff880.reference || (__cxx_static_address_4d82e93f9d73eaff4b0ff880.reference = {
    __cReference: true,
    get value() { return XXXSTACY____header_global_085eb62106659498; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:756
export const LETTER____header_global_497a774c36b8e9ec = ((((((4502) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8cba844530f7f3d5bf424b1e() {
  return __cxx_static_address_8cba844530f7f3d5bf424b1e.reference || (__cxx_static_address_8cba844530f7f3d5bf424b1e.reference = {
    __cReference: true,
    get value() { return LETTER____header_global_497a774c36b8e9ec; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:757
export const SIDEBOLT1____header_global_a66d0de397978fb1 = ((((((4525) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5186d9d94597f64ce574fdec() {
  return __cxx_static_address_5186d9d94597f64ce574fdec.reference || (__cxx_static_address_5186d9d94597f64ce574fdec.reference = {
    __cReference: true,
    get value() { return SIDEBOLT1____header_global_a66d0de397978fb1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:758
export const FOODOBJECT16____header_global_f47cb721377c9eb5 = ((((((4545) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b3941df3d94601d5dadbef3f() {
  return __cxx_static_address_b3941df3d94601d5dadbef3f.reference || (__cxx_static_address_b3941df3d94601d5dadbef3f.reference = {
    __cReference: true,
    get value() { return FOODOBJECT16____header_global_f47cb721377c9eb5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:759
export const TAMPON____header_global_3b9ffed922ab3d9c = ((((((4557) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2bd838270f817498be8f0e36() {
  return __cxx_static_address_2bd838270f817498be8f0e36.reference || (__cxx_static_address_2bd838270f817498be8f0e36.reference = {
    __cReference: true,
    get value() { return TAMPON____header_global_3b9ffed922ab3d9c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:760
export const CANWITHSOMETHING2____header_global_8c90081ea013ee29 = ((((((4580) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_14c0a0ff0d083b5d7512f6a1() {
  return __cxx_static_address_14c0a0ff0d083b5d7512f6a1.reference || (__cxx_static_address_14c0a0ff0d083b5d7512f6a1.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING2____header_global_8c90081ea013ee29; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:761
export const CANWITHSOMETHING3____header_global_76ad02c7488e85d7 = ((((((4581) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ad601cef3b110487d4a7b4bc() {
  return __cxx_static_address_ad601cef3b110487d4a7b4bc.reference || (__cxx_static_address_ad601cef3b110487d4a7b4bc.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING3____header_global_76ad02c7488e85d7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:762
export const CANWITHSOMETHING4____header_global_a0bdd147c742ed32 = ((((((4582) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_243ad3e7d8331dd68f8a755a() {
  return __cxx_static_address_243ad3e7d8331dd68f8a755a.reference || (__cxx_static_address_243ad3e7d8331dd68f8a755a.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING4____header_global_a0bdd147c742ed32; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:763
export const DOLPHIN1____header_global_66cf4a16b1216d8e = ((((((4591) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_565555001cc5967036891b53() {
  return __cxx_static_address_565555001cc5967036891b53.reference || (__cxx_static_address_565555001cc5967036891b53.reference = {
    __cReference: true,
    get value() { return DOLPHIN1____header_global_66cf4a16b1216d8e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:764
export const DOLPHIN2____header_global_892b1a3f102c4638 = ((((((4592) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_93daa974beae4c120258fbf5() {
  return __cxx_static_address_93daa974beae4c120258fbf5.reference || (__cxx_static_address_93daa974beae4c120258fbf5.reference = {
    __cReference: true,
    get value() { return DOLPHIN2____header_global_892b1a3f102c4638; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:765
export const NEWBEAST____header_global_db1d5c5742a601c4 = ((((((4610) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_334bbc97e4fd26ddb65a3edf() {
  return __cxx_static_address_334bbc97e4fd26ddb65a3edf.reference || (__cxx_static_address_334bbc97e4fd26ddb65a3edf.reference = {
    __cReference: true,
    get value() { return NEWBEAST____header_global_db1d5c5742a601c4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:766
export const NEWBEASTSTAYPUT____header_global_27c9a0f59d225346 = ((((((4611) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f488688a5db06141d577cc56() {
  return __cxx_static_address_f488688a5db06141d577cc56.reference || (__cxx_static_address_f488688a5db06141d577cc56.reference = {
    __cReference: true,
    get value() { return NEWBEASTSTAYPUT____header_global_27c9a0f59d225346; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:767
export const BOSS4____header_global_096b8358d88dbe3e = ((((((4740) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7802a0c0bcd98bab2e68bc47() {
  return __cxx_static_address_7802a0c0bcd98bab2e68bc47.reference || (__cxx_static_address_7802a0c0bcd98bab2e68bc47.reference = {
    __cReference: true,
    get value() { return BOSS4____header_global_096b8358d88dbe3e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:768
export const BOSS4STAYPUT____header_global_f38e16e5ec514cac = ((((((4741) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5bacecbc98d3cd8221f95fe4() {
  return __cxx_static_address_5bacecbc98d3cd8221f95fe4.reference || (__cxx_static_address_5bacecbc98d3cd8221f95fe4.reference = {
    __cReference: true,
    get value() { return BOSS4STAYPUT____header_global_f38e16e5ec514cac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:769
export const FEM10____header_global_5528b7b0d0154614 = ((((((4864) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2950195cc5b6fc560224ef9d() {
  return __cxx_static_address_2950195cc5b6fc560224ef9d.reference || (__cxx_static_address_2950195cc5b6fc560224ef9d.reference = {
    __cReference: true,
    get value() { return FEM10____header_global_5528b7b0d0154614; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:770
export const TOUGHGAL____header_global_c5d9b137e8b731ee = ((((((4866) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8cfa449be7ef1dd18bbddb3d() {
  return __cxx_static_address_8cfa449be7ef1dd18bbddb3d.reference || (__cxx_static_address_8cfa449be7ef1dd18bbddb3d.reference = {
    __cReference: true,
    get value() { return TOUGHGAL____header_global_c5d9b137e8b731ee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:771
export const MAN____header_global_71db20409baef5c2 = ((((((4871) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f86878594ebb050ed5c60cb9() {
  return __cxx_static_address_f86878594ebb050ed5c60cb9.reference || (__cxx_static_address_f86878594ebb050ed5c60cb9.reference = {
    __cReference: true,
    get value() { return MAN____header_global_71db20409baef5c2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:772
export const MAN2____header_global_efd6f6b7e96ad73d = ((((((4872) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f0e6f39f7e744ad962aaaaa0() {
  return __cxx_static_address_f0e6f39f7e744ad962aaaaa0.reference || (__cxx_static_address_f0e6f39f7e744ad962aaaaa0.reference = {
    __cReference: true,
    get value() { return MAN2____header_global_efd6f6b7e96ad73d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:773
export const WOMAN____header_global_68d1ea1b6e3b69f0 = ((((((4874) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_83c6c3fe9ea4f419f5355b34() {
  return __cxx_static_address_83c6c3fe9ea4f419f5355b34.reference || (__cxx_static_address_83c6c3fe9ea4f419f5355b34.reference = {
    __cReference: true,
    get value() { return WOMAN____header_global_68d1ea1b6e3b69f0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:774
export const NATURALLIGHTNING____header_global_026ed1dc1dcaa269 = ((((((4890) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_115c6d96e07d056e959485e6() {
  return __cxx_static_address_115c6d96e07d056e959485e6.reference || (__cxx_static_address_115c6d96e07d056e959485e6.reference = {
    __cReference: true,
    get value() { return NATURALLIGHTNING____header_global_026ed1dc1dcaa269; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:775
export const WEATHERWARN____header_global_131bd512834ac3d3 = ((((((4893) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d7667119fae5c25755e634c2() {
  return __cxx_static_address_d7667119fae5c25755e634c2.reference || (__cxx_static_address_d7667119fae5c25755e634c2.reference = {
    __cReference: true,
    get value() { return WEATHERWARN____header_global_131bd512834ac3d3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:776
export const DUKETAG____header_global_82448cf11f8287be = ((((((4900) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8437e15b66b4b81c0d9e36cd() {
  return __cxx_static_address_8437e15b66b4b81c0d9e36cd.reference || (__cxx_static_address_8437e15b66b4b81c0d9e36cd.reference = {
    __cReference: true,
    get value() { return DUKETAG____header_global_82448cf11f8287be; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:777
export const SIGN1____header_global_1129d060f1d56cb2 = ((((((4909) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6e47af5caab5c9580699d754() {
  return __cxx_static_address_6e47af5caab5c9580699d754.reference || (__cxx_static_address_6e47af5caab5c9580699d754.reference = {
    __cReference: true,
    get value() { return SIGN1____header_global_1129d060f1d56cb2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:778
export const SIGN2____header_global_7b8159c5d27b06c1 = ((((((4912) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bd83ea0e23a4c85cd75528bf() {
  return __cxx_static_address_bd83ea0e23a4c85cd75528bf.reference || (__cxx_static_address_bd83ea0e23a4c85cd75528bf.reference = {
    __cReference: true,
    get value() { return SIGN2____header_global_7b8159c5d27b06c1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:779
export const JURYGUY____header_global_3962219e8edd7f52 = ((((((4943) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2f46f959d8f48915ce788c91() {
  return __cxx_static_address_2f46f959d8f48915ce788c91.reference || (__cxx_static_address_2f46f959d8f48915ce788c91.reference = {
    __cReference: true,
    get value() { return JURYGUY____header_global_3962219e8edd7f52; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:780
export const WIDESCREENSTATUSBAR____header_global_9eff9074249881fb = ((((((5120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1fdffa62d32a9fea6011cbfe() {
  return __cxx_static_address_1fdffa62d32a9fea6011cbfe.reference || (__cxx_static_address_1fdffa62d32a9fea6011cbfe.reference = {
    __cReference: true,
    get value() { return WIDESCREENSTATUSBAR____header_global_9eff9074249881fb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:781
export const RPGGUNWIDE____header_global_4237ed7f4e466a98 = ((((((5121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7b72c56be8c640ed77a07446() {
  return __cxx_static_address_7b72c56be8c640ed77a07446.reference || (__cxx_static_address_7b72c56be8c640ed77a07446.reference = {
    __cReference: true,
    get value() { return RPGGUNWIDE____header_global_4237ed7f4e466a98; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:782
export const FIRSTGUNRELOADWIDE____header_global_a4c62e00a829fd93 = ((((((5122) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_97819550847e5106893bd616() {
  return __cxx_static_address_97819550847e5106893bd616.reference || (__cxx_static_address_97819550847e5106893bd616.reference = {
    __cReference: true,
    get value() { return FIRSTGUNRELOADWIDE____header_global_a4c62e00a829fd93; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:783
export const FREEZEWIDE____header_global_ce497d2f90ecb63c = ((((((5123) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_010f426092fb71c000e062d3() {
  return __cxx_static_address_010f426092fb71c000e062d3.reference || (__cxx_static_address_010f426092fb71c000e062d3.reference = {
    __cReference: true,
    get value() { return FREEZEWIDE____header_global_ce497d2f90ecb63c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:784
export const FREEZEFIREWIDE____header_global_2886de3fff1b13d0 = ((((((5124) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d1335b912b172e1b2a18d0fb() {
  return __cxx_static_address_d1335b912b172e1b2a18d0fb.reference || (__cxx_static_address_d1335b912b172e1b2a18d0fb.reference = {
    __cReference: true,
    get value() { return FREEZEFIREWIDE____header_global_2886de3fff1b13d0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:785
export const SHRINKERWIDE____header_global_3145f8aac451b285 = ((((((5127) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fc51e36983153786b7460d45() {
  return __cxx_static_address_fc51e36983153786b7460d45.reference || (__cxx_static_address_fc51e36983153786b7460d45.reference = {
    __cReference: true,
    get value() { return SHRINKERWIDE____header_global_3145f8aac451b285; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:786
export const CRACKKNUCKLESWIDE____header_global_2e70e55b1ec6ba3e = ((((((5129) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_79f21bb9af2804ae2501a270() {
  return __cxx_static_address_79f21bb9af2804ae2501a270.reference || (__cxx_static_address_79f21bb9af2804ae2501a270.reference = {
    __cReference: true,
    get value() { return CRACKKNUCKLESWIDE____header_global_2e70e55b1ec6ba3e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:787
export const FLAMETHROWERSPRITE____header_global_3a5d439dd6d346a6 = ((((((5134) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f3a440db4d556870f0b233eb() {
  return __cxx_static_address_f3a440db4d556870f0b233eb.reference || (__cxx_static_address_f3a440db4d556870f0b233eb.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERSPRITE____header_global_3a5d439dd6d346a6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:788
export const FLAMETHROWERAMMO____header_global_c74a8460e05bc441 = ((((((5135) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a7e8e428a135bfebdd6ffd42() {
  return __cxx_static_address_a7e8e428a135bfebdd6ffd42.reference || (__cxx_static_address_a7e8e428a135bfebdd6ffd42.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERAMMO____header_global_c74a8460e05bc441; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:789
export const FLAMETHROWER____header_global_ff69096cd68b23ba = ((((((5138) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_65eabf16ae5b495298f01082() {
  return __cxx_static_address_65eabf16ae5b495298f01082.reference || (__cxx_static_address_65eabf16ae5b495298f01082.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER____header_global_ff69096cd68b23ba; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:790
export const FLAMETHROWERFIRE____header_global_4022a12df3d83565 = ((((((5139) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a1c3a0166a8b5fbac0754c10() {
  return __cxx_static_address_a1c3a0166a8b5fbac0754c10.reference || (__cxx_static_address_a1c3a0166a8b5fbac0754c10.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERFIRE____header_global_4022a12df3d83565; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:791
export const FLAMETHROWERFLAME____header_global_9352c5a81505783b = ((((((1891) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e5d68e40a4987df939ae503a() {
  return __cxx_static_address_e5d68e40a4987df939ae503a.reference || (__cxx_static_address_e5d68e40a4987df939ae503a.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERFLAME____header_global_9352c5a81505783b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:792
export const FLAMETHROWERPILOT____header_global_0616199a1ffd89d1 = ((((((5174) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5b4f90b3a9e7ee9186516daa() {
  return __cxx_static_address_5b4f90b3a9e7ee9186516daa.reference || (__cxx_static_address_5b4f90b3a9e7ee9186516daa.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERPILOT____header_global_0616199a1ffd89d1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:793
export const FIREBALL____header_global_8ac1070750130fed = ((((((5163) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_18b6a61c8adcb1b0aec77199() {
  return __cxx_static_address_18b6a61c8adcb1b0aec77199.reference || (__cxx_static_address_18b6a61c8adcb1b0aec77199.reference = {
    __cReference: true,
    get value() { return FIREBALL____header_global_8ac1070750130fed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:794
export const ONFIRE____header_global_4c1060f6c372380b = ((((((5152) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4ae0645cf40bdfd8eb6ec2a3() {
  return __cxx_static_address_4ae0645cf40bdfd8eb6ec2a3.reference || (__cxx_static_address_4ae0645cf40bdfd8eb6ec2a3.reference = {
    __cReference: true,
    get value() { return ONFIRE____header_global_4c1060f6c372380b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:795
export const ONFIRESMOKE____header_global_52163965f54cfc85 = ((((((5143) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_debdea49e059f890e7368e08() {
  return __cxx_static_address_debdea49e059f890e7368e08.reference || (__cxx_static_address_debdea49e059f890e7368e08.reference = {
    __cReference: true,
    get value() { return ONFIRESMOKE____header_global_52163965f54cfc85; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:796
export const BURNEDCORPSE____header_global_ac8c51fb43688c82 = ((((((5173) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_118684867b1454b343fbe1c4() {
  return __cxx_static_address_118684867b1454b343fbe1c4.reference || (__cxx_static_address_118684867b1454b343fbe1c4.reference = {
    __cReference: true,
    get value() { return BURNEDCORPSE____header_global_ac8c51fb43688c82; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:797
export const WHISPYSMOKE____header_global_d920e12498d47b08 = ((((((5268) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9f44040b2ca7d0daaf34531c() {
  return __cxx_static_address_9f44040b2ca7d0daaf34531c.reference || (__cxx_static_address_9f44040b2ca7d0daaf34531c.reference = {
    __cReference: true,
    get value() { return WHISPYSMOKE____header_global_d920e12498d47b08; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:798
export const FIREFLY____header_global_8783d26fe3b198c3 = ((((((5180) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_08f5aadf245b33dbfe97e186() {
  return __cxx_static_address_08f5aadf245b33dbfe97e186.reference || (__cxx_static_address_08f5aadf245b33dbfe97e186.reference = {
    __cReference: true,
    get value() { return FIREFLY____header_global_8783d26fe3b198c3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:799
export const FIREFLYSHRINKEFFECT____header_global_e7afbb42308f9311 = ((((((5360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_650409b8b711b20d30cae32f() {
  return __cxx_static_address_650409b8b711b20d30cae32f.reference || (__cxx_static_address_650409b8b711b20d30cae32f.reference = {
    __cReference: true,
    get value() { return FIREFLYSHRINKEFFECT____header_global_e7afbb42308f9311; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:800
export const FIREFLYGROWEFFECT____header_global_9df7f6add6fac6d0 = ((((((5367) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_516715624960a54e37e64993() {
  return __cxx_static_address_516715624960a54e37e64993.reference || (__cxx_static_address_516715624960a54e37e64993.reference = {
    __cReference: true,
    get value() { return FIREFLYGROWEFFECT____header_global_9df7f6add6fac6d0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:801
export const FIREFLYFLYINGEFFECT____header_global_c847c32a91f240db = ((((((5296) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f444caea7d02b534d5b1303c() {
  return __cxx_static_address_f444caea7d02b534d5b1303c.reference || (__cxx_static_address_f444caea7d02b534d5b1303c.reference = {
    __cReference: true,
    get value() { return FIREFLYFLYINGEFFECT____header_global_c847c32a91f240db; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:802
export const BOSS5____header_global_2c8d94dd8e508759 = ((((((5310) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_29aca2fccb95c25266975e71() {
  return __cxx_static_address_29aca2fccb95c25266975e71.reference || (__cxx_static_address_29aca2fccb95c25266975e71.reference = {
    __cReference: true,
    get value() { return BOSS5____header_global_2c8d94dd8e508759; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:803
export const BOSS5STAYPUT____header_global_d44a737a68d6275d = ((((((5311) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7973a1736a97ee75586d5dec() {
  return __cxx_static_address_7973a1736a97ee75586d5dec.reference || (__cxx_static_address_7973a1736a97ee75586d5dec.reference = {
    __cReference: true,
    get value() { return BOSS5STAYPUT____header_global_d44a737a68d6275d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:804
export const LAVAPOOL____header_global_c1b8d899c666be1f = ((((((5304) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5b5b5de235e368430bd8c083() {
  return __cxx_static_address_5b5b5de235e368430bd8c083.reference || (__cxx_static_address_5b5b5de235e368430bd8c083.reference = {
    __cReference: true,
    get value() { return LAVAPOOL____header_global_c1b8d899c666be1f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:805
export const LAVASPLASH____header_global_78660eac096502b8 = ((((((5371) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_095eaa3980715533691cf323() {
  return __cxx_static_address_095eaa3980715533691cf323.reference || (__cxx_static_address_095eaa3980715533691cf323.reference = {
    __cReference: true,
    get value() { return LAVASPLASH____header_global_78660eac096502b8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:806
export const LAVAPOOLBUBBLE____header_global_f3edf866c9d13b3b = ((((((5207) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0f3ac3a05142d649b793b851() {
  return __cxx_static_address_0f3ac3a05142d649b793b851.reference || (__cxx_static_address_0f3ac3a05142d649b793b851.reference = {
    __cReference: true,
    get value() { return LAVAPOOLBUBBLE____header_global_f3edf866c9d13b3b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:807
export const BOSS2STAYPUT____header_global_5b5ef70d800c9044 = ((((((2711) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6e192316c9e17d5fe713ebaa() {
  return __cxx_static_address_6e192316c9e17d5fe713ebaa.reference || (__cxx_static_address_6e192316c9e17d5fe713ebaa.reference = {
    __cReference: true,
    get value() { return BOSS2STAYPUT____header_global_5b5ef70d800c9044; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:808
export const BOSS3STAYPUT____header_global_6f7f2b542a79f60a = ((((((2761) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cd50ae96ad608bdc3038ca3a() {
  return __cxx_static_address_cd50ae96ad608bdc3038ca3a.reference || (__cxx_static_address_cd50ae96ad608bdc3038ca3a.reference = {
    __cReference: true,
    get value() { return BOSS3STAYPUT____header_global_6f7f2b542a79f60a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:809
export const E32_TILE5736____header_global_b6bc63833deb136d = ((((((5736) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0972e267eccf6a0b2bccbc13() {
  return __cxx_static_address_0972e267eccf6a0b2bccbc13.reference || (__cxx_static_address_0972e267eccf6a0b2bccbc13.reference = {
    __cReference: true,
    get value() { return E32_TILE5736____header_global_b6bc63833deb136d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:810
export const E32_TILE5737____header_global_0827f02c586c8d5e = ((((((5737) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_65e057a8e243d264a2f28cd5() {
  return __cxx_static_address_65e057a8e243d264a2f28cd5.reference || (__cxx_static_address_65e057a8e243d264a2f28cd5.reference = {
    __cReference: true,
    get value() { return E32_TILE5737____header_global_0827f02c586c8d5e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:811
export const E32_TILE5846____header_global_f99d755e247739db = ((((((5846) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_373f3972611f195b677bf27a() {
  return __cxx_static_address_373f3972611f195b677bf27a.reference || (__cxx_static_address_373f3972611f195b677bf27a.reference = {
    __cReference: true,
    get value() { return E32_TILE5846____header_global_f99d755e247739db; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/network.h:180
export const cSnapshotMemUsage__header_global_9e8a24f56fa6a861 = u64((BigInt(u64(64)) * BigInt((BigInt((BigInt((BigInt(72) * BigInt(u64(16384)))) + BigInt((BigInt(96) * BigInt(u64(4096)))))) + BigInt((BigInt(296) * BigInt(u64(16384))))))));
function __cxx_static_address_5a857bba0e02973c5bd10d8f() {
  return __cxx_static_address_5a857bba0e02973c5bd10d8f.reference || (__cxx_static_address_5a857bba0e02973c5bd10d8f.reference = {
    __cReference: true,
    get value() { return cSnapshotMemUsage__header_global_9e8a24f56fa6a861; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/rts.cpp:28
export let rts_numlumps = 0;
function __cxx_static_address_11fa3b9044ed659b2513426c() {
  return __cxx_static_address_11fa3b9044ed659b2513426c.reference || (__cxx_static_address_11fa3b9044ed659b2513426c.reference = {
    __cReference: true,
    get value() { return rts_numlumps; },
    set value(__cxx_lvalue_0) { rts_numlumps = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/rts.cpp:29
export let rts_lumpcache = null;
function __cxx_static_address_bc2c8aacfa27089fc2baccd6() {
  return __cxx_static_address_bc2c8aacfa27089fc2baccd6.reference || (__cxx_static_address_bc2c8aacfa27089fc2baccd6.reference = {
    __cReference: true,
    get value() { return rts_lumpcache; },
    set value(__cxx_lvalue_0) { rts_lumpcache = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/build/include/fix16.h:31
export const FIX16_MAX__header_global_8ae4535a67beff95 = i32(2147483647);
function __cxx_static_address_fb84586eda580d9fe64f9a52() {
  return __cxx_static_address_fb84586eda580d9fe64f9a52.reference || (__cxx_static_address_fb84586eda580d9fe64f9a52.reference = {
    __cReference: true,
    get value() { return FIX16_MAX__header_global_8ae4535a67beff95; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:32
export const FIX16_MIN__header_global_f8e3681be06768ed = i32(2147483648);
function __cxx_static_address_c3eb7ed5d9ffa182b1843859() {
  return __cxx_static_address_c3eb7ed5d9ffa182b1843859.reference || (__cxx_static_address_c3eb7ed5d9ffa182b1843859.reference = {
    __cReference: true,
    get value() { return FIX16_MIN__header_global_f8e3681be06768ed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:33
export const FIX16_OVERFLOW__header_global_caa4fa20fa8ab303 = i32(2147483648);
function __cxx_static_address_4bf587f7767b137a00ccc9d4() {
  return __cxx_static_address_4bf587f7767b137a00ccc9d4.reference || (__cxx_static_address_4bf587f7767b137a00ccc9d4.reference = {
    __cReference: true,
    get value() { return FIX16_OVERFLOW__header_global_caa4fa20fa8ab303; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:35
export const fix16_one__header_global_8be56454d687190f = i32(65536);
function __cxx_static_address_7cdb0c8604b9bc99c65b9d00() {
  return __cxx_static_address_7cdb0c8604b9bc99c65b9d00.reference || (__cxx_static_address_7cdb0c8604b9bc99c65b9d00.reference = {
    __cReference: true,
    get value() { return fix16_one__header_global_8be56454d687190f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:36
export const fix16_half__header_global_5e4d3946efbf8985 = i32(32768);
function __cxx_static_address_e831d394308cc9579af04398() {
  return __cxx_static_address_e831d394308cc9579af04398.reference || (__cxx_static_address_e831d394308cc9579af04398.reference = {
    __cReference: true,
    get value() { return fix16_half__header_global_5e4d3946efbf8985; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:37
export const flt_f161r__header_global_c252796a9ea6ddbe = Math.fround(Math.fround((Math.fround(1) / Math.fround(65536))));
function __cxx_static_address_eae592b7f8d0fa96e77bb118() {
  return __cxx_static_address_eae592b7f8d0fa96e77bb118.reference || (__cxx_static_address_eae592b7f8d0fa96e77bb118.reference = {
    __cReference: true,
    get value() { return flt_f161r__header_global_c252796a9ea6ddbe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/rts.cpp:30
export let rts_lumpinfo = null;
function __cxx_static_address_9c750c9a1d9ca608db0a479a() {
  return __cxx_static_address_9c750c9a1d9ca608db0a479a.reference || (__cxx_static_address_9c750c9a1d9ca608db0a479a.reference = {
    __cReference: true,
    get value() { return rts_lumpinfo; },
    set value(__cxx_lvalue_0) { rts_lumpinfo = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/duke3d/src/rts.cpp:31
export let RTS_Started = i32(0);
function __cxx_static_address_270875d538e47146afe3a15b() {
  return __cxx_static_address_270875d538e47146afe3a15b.reference || (__cxx_static_address_270875d538e47146afe3a15b.reference = {
    __cReference: true,
    get value() { return RTS_Started; },
    set value(__cxx_lvalue_0) { RTS_Started = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/rts.cpp:33
export let rts_lumplockbyte = new Uint8Array(11);
function __cxx_static_address_57f1e99666179d7a5dc9abed() {
  return __cxx_static_address_57f1e99666179d7a5dc9abed.reference || (__cxx_static_address_57f1e99666179d7a5dc9abed.reference = {
    __cReference: true,
    get value() { return rts_lumplockbyte; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/rts.cpp:124
export function RTS_IsInitialized() {
  return i32((rts_numlumps > 0));
}

// C/C++ source: source/duke3d/src/rts.cpp:132
export function RTS_SoundLength(lump) {
  ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => lump, __cxx_lvalue_1 => { lump = __cxx_lvalue_1; }));
  return i32(((u32(lump) >= u32(rts_numlumps)) ? 0 : (cPointerElementRef(rts_lumpinfo, lump).value).size));
}

// C/C++ source: source/build/include/compat.h:1169
export const pow2char__header_global_88a326f561a9d22b = new Uint8Array([((1) & 255), ((2) & 255), ((4) & 255), ((8) & 255), ((16) & 255), ((32) & 255), ((64) & 255), ((128) & 255)]);
function __cxx_static_address_2e1377eb4c3fd5a3c07297cb() {
  return __cxx_static_address_2e1377eb4c3fd5a3c07297cb.reference || (__cxx_static_address_2e1377eb4c3fd5a3c07297cb.reference = {
    __cReference: true,
    get value() { return pow2char__header_global_88a326f561a9d22b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:172
export const g_defaultVideoModes__header_global_e19522efc998557e = [cMarkAggregate(({"x": 2560, "y": 1440})), cMarkAggregate(({"x": 2560, "y": 1200})), cMarkAggregate(({"x": 2560, "y": 1080})), cMarkAggregate(({"x": 1920, "y": 1440})), cMarkAggregate(({"x": 1920, "y": 1200})), cMarkAggregate(({"x": 1920, "y": 1080})), cMarkAggregate(({"x": 1680, "y": 1050})), cMarkAggregate(({"x": 1600, "y": 1200})), cMarkAggregate(({"x": 1600, "y": 900})), cMarkAggregate(({"x": 1366, "y": 768})), cMarkAggregate(({"x": 1280, "y": 1024})), cMarkAggregate(({"x": 1280, "y": 960})), cMarkAggregate(({"x": 1280, "y": 720})), cMarkAggregate(({"x": 1152, "y": 864})), cMarkAggregate(({"x": 1024, "y": 768})), cMarkAggregate(({"x": 1024, "y": 600})), cMarkAggregate(({"x": 800, "y": 600})), cMarkAggregate(({"x": 640, "y": 480})), cMarkAggregate(({"x": 640, "y": 400})), cMarkAggregate(({"x": 512, "y": 384})), cMarkAggregate(({"x": 480, "y": 360})), cMarkAggregate(({"x": 400, "y": 300})), cMarkAggregate(({"x": 320, "y": 240})), cMarkAggregate(({"x": 320, "y": 200})), cMarkAggregate(({"x": 0, "y": 0}))];
function __cxx_static_address_436617bfbd8a8f6bf165cf44() {
  return __cxx_static_address_436617bfbd8a8f6bf165cf44.reference || (__cxx_static_address_436617bfbd8a8f6bf165cf44.reference = {
    __cReference: true,
    get value() { return g_defaultVideoModes__header_global_e19522efc998557e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:188
export const g_keyAsciiTable__header_global_747c4c03c98e0268 = new Uint8Array([((0) & 255), ((0) & 255), 49, 50, 51, 52, 53, 54, 55, 56, 57, 48, 45, 61, ((0) & 255), ((0) & 255), 113, 119, 101, 114, 116, 121, 117, 105, 111, 112, 91, 93, ((0) & 255), ((0) & 255), 97, 115, 100, 102, 103, 104, 106, 107, 108, 59, ((39) & 255), 96, ((0) & 255), ((92) & 255), 122, 120, 99, 118, 98, 110, 109, 44, 46, 47, ((0) & 255), 42, ((0) & 255), ((32) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), 55, 56, 57, 45, 52, 53, 54, 43, 49, 50, 51, 48, 46, ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255)]);
function __cxx_static_address_0cbd22e4c7d49a3997f6a8e3() {
  return __cxx_static_address_0cbd22e4c7d49a3997f6a8e3.reference || (__cxx_static_address_0cbd22e4c7d49a3997f6a8e3.reference = {
    __cReference: true,
    get value() { return g_keyAsciiTable__header_global_747c4c03c98e0268; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:196
export const g_keyAsciiTableShift__header_global_fa1943e6745336eb = new Uint8Array([((0) & 255), ((0) & 255), 33, 64, 35, 36, 37, 94, 38, 42, 40, 41, 95, 43, ((0) & 255), ((0) & 255), 81, 87, 69, 82, 84, 89, 85, 73, 79, 80, 123, 125, ((0) & 255), ((0) & 255), 65, 83, 68, 70, 71, 72, 74, 75, 76, 58, 34, 126, ((0) & 255), 124, 90, 88, 67, 86, 66, 78, 77, 60, 62, 63, ((0) & 255), 42, ((0) & 255), ((32) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), 55, 56, 57, 45, 52, 53, 54, 43, 49, 50, 51, 48, 46, ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255)]);
function __cxx_static_address_106759783446760804c33e8b() {
  return __cxx_static_address_106759783446760804c33e8b.reference || (__cxx_static_address_106759783446760804c33e8b.reference = {
    __cReference: true,
    get value() { return g_keyAsciiTableShift__header_global_fa1943e6745336eb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:895
export const pow2long__header_global_28bd702157356131 = new Int32Array([1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144, 524288, 1048576, 2097152, 4194304, 8388608, 16777216, 33554432, 67108864, 134217728, 268435456, 536870912, 1073741824, 2147483647]);
function __cxx_static_address_13e61f2d31656791f5ec254e() {
  return __cxx_static_address_13e61f2d31656791f5ec254e.reference || (__cxx_static_address_13e61f2d31656791f5ec254e.reference = {
    __cReference: true,
    get value() { return pow2long__header_global_28bd702157356131; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:907
export const pow2ulong__header_global_ddd4e7a7da38f4eb = new Uint32Array([u32(1), u32(2), u32(4), u32(8), u32(16), u32(32), u32(64), u32(128), u32(256), u32(512), u32(1024), u32(2048), u32(4096), u32(8192), u32(16384), u32(32768), u32(65536), u32(131072), u32(262144), u32(524288), u32(1048576), u32(2097152), u32(4194304), u32(8388608), u32(16777216), u32(33554432), u32(67108864), u32(134217728), u32(268435456), u32(536870912), u32(1073741824), u32(2147483648n)]);
function __cxx_static_address_0c727f5e3e0d28eadd57ce4a() {
  return __cxx_static_address_0c727f5e3e0d28eadd57ce4a.reference || (__cxx_static_address_0c727f5e3e0d28eadd57ce4a.reference = {
    __cReference: true,
    get value() { return pow2ulong__header_global_ddd4e7a7da38f4eb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:919
export const pow264__header_global_b4862d9d4084b1a7 = new BigInt64Array([BigInt(i64(1)), BigInt(i64(2)), BigInt(i64(4)), BigInt(i64(8)), BigInt(i64(16)), BigInt(i64(32)), BigInt(i64(64)), BigInt(i64(128)), BigInt(i64(256)), BigInt(i64(512)), BigInt(i64(1024)), BigInt(i64(2048)), BigInt(i64(4096)), BigInt(i64(8192)), BigInt(i64(16384)), BigInt(i64(32768)), BigInt(i64(65536)), BigInt(i64(131072)), BigInt(i64(262144)), BigInt(i64(524288)), BigInt(i64(1048576)), BigInt(i64(2097152)), BigInt(i64(4194304)), BigInt(i64(8388608)), BigInt(i64(16777216)), BigInt(i64(33554432)), BigInt(i64(67108864)), BigInt(i64(134217728)), BigInt(i64(268435456)), BigInt(i64(536870912)), BigInt(i64(1073741824)), BigInt(2147483648n), BigInt(4294967296n), BigInt(8589934592n), BigInt(17179869184n), BigInt(34359738368n), BigInt(68719476736n), BigInt(137438953472n), BigInt(274877906944n), BigInt(549755813888n), BigInt(1099511627776n), BigInt(2199023255552n), BigInt(4398046511104n), BigInt(8796093022208n), BigInt(17592186044416n), BigInt(35184372088832n), BigInt(70368744177664n), BigInt(140737488355328n), BigInt(281474976710656n), BigInt(562949953421312n), BigInt(1125899906842624n), BigInt(2251799813685248n), BigInt(4503599627370496n), BigInt(9007199254740992n), BigInt(18014398509481984n), BigInt(36028797018963968n), BigInt(72057594037927936n), BigInt(144115188075855872n), BigInt(288230376151711744n), BigInt(576460752303423488n), BigInt(1152921504606846976n), BigInt(2305843009213693952n), BigInt(4611686018427387904n), BigInt(9223372036854775807n)]);
function __cxx_static_address_cd88dd9a36981de1760b0d96() {
  return __cxx_static_address_cd88dd9a36981de1760b0d96.reference || (__cxx_static_address_cd88dd9a36981de1760b0d96.reference = {
    __cReference: true,
    get value() { return pow264__header_global_b4862d9d4084b1a7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export function B_PASS32__header_f1721c415b1f(x) {
  return i32(x);
}

// C/C++ source: source/build/include/smmalloc.h:859
export function _sm_malloc(allocator, bytesCount, alignment) {
  return cRecordObject(allocator).Alloc(bytesCount, alignment);
}

// C/C++ source: source/build/include/smmalloc.h:866
export function _sm_realloc(allocator, p, bytesCount, alignment) {
  return cRecordObject(allocator).Realloc(p, bytesCount, alignment);
}

// C/C++ source: source/build/include/smmalloc.h:864
export function _sm_free(allocator, p) {
  return cRecordObject(allocator).Free(p);
}
