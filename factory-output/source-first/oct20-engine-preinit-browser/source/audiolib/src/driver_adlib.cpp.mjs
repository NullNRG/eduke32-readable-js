// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/audiolib/src/driver_adlib.cpp
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
const u64 = value => BigInt.asUintN(64, BigInt(value));

// C/C++ source: source/build/include/fix16.h:111
export const fix16_rad_to_deg_mult__header_global_fc3b6793f99746a0 = i32(3754936);
function __cxx_static_address_2a46ff90d9afec1681a23d7e() {
  return __cxx_static_address_2a46ff90d9afec1681a23d7e.reference || (__cxx_static_address_2a46ff90d9afec1681a23d7e.reference = {
    __cReference: true,
    get value() { return fix16_rad_to_deg_mult__header_global_fc3b6793f99746a0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:114
export const fix16_deg_to_rad_mult__header_global_3501decf6981e5e2 = i32(1144);
function __cxx_static_address_4cd7bf5396329d5d26470e0f() {
  return __cxx_static_address_4cd7bf5396329d5d26470e0f.reference || (__cxx_static_address_4cd7bf5396329d5d26470e0f.reference = {
    __cReference: true,
    get value() { return fix16_deg_to_rad_mult__header_global_3501decf6981e5e2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/audiolib/src/driver_adlib.cpp:50
export let AL_Volume = i32(255);
function __cxx_static_address_0219b2d54563e5b3ea6de01e() {
  return __cxx_static_address_0219b2d54563e5b3ea6de01e.reference || (__cxx_static_address_0219b2d54563e5b3ea6de01e.reference = {
    __cReference: true,
    get value() { return AL_Volume; },
    set value(__cxx_lvalue_0) { AL_Volume = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/audiolib/src/driver_adlib.cpp:54
export let ErrorCode = 0;
function __cxx_static_address_b01023e4230dde22fac43eaf() {
  return __cxx_static_address_b01023e4230dde22fac43eaf.reference || (__cxx_static_address_b01023e4230dde22fac43eaf.reference = {
    __cReference: true,
    get value() { return ErrorCode; },
    set value(__cxx_lvalue_0) { ErrorCode = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/audiolib/src/driver_adlib.cpp:56
export function AdLibDrv_GetError() {
  return i32(ErrorCode);
}

// C/C++ source: source/audiolib/src/driver_adlib.cpp:58
const __cxx_literal_8250abc2fd9dca494db1 = Uint8Array.from([65, 100, 76, 105, 98, 32, 111, 107, 46, 0]);
const __cxx_literal_ab942c28f6f74d7a67af = Uint8Array.from([85, 110, 107, 110, 111, 119, 110, 32, 65, 100, 76, 105, 98, 32, 101, 114, 114, 111, 114, 46, 0]);
export function AdLibDrv_ErrorString(ErrorNumber) {
  switch (ErrorNumber) {
    case i32(-1): {
      return AdLibDrv_ErrorString(ErrorCode);
    }
    case i32(0): {
      return __cxx_literal_8250abc2fd9dca494db1;
    }
    default: {
      return __cxx_literal_ab942c28f6f74d7a67af;
    }
  }
}

// C/C++ source: source/build/include/fix16.h:31
export const FIX16_MAX__header_global_5e65cc64c4a31401 = i32(2147483647);
function __cxx_static_address_7732fa90c512d7611080dfd7() {
  return __cxx_static_address_7732fa90c512d7611080dfd7.reference || (__cxx_static_address_7732fa90c512d7611080dfd7.reference = {
    __cReference: true,
    get value() { return FIX16_MAX__header_global_5e65cc64c4a31401; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:32
export const FIX16_MIN__header_global_3b0d68b124318043 = i32(2147483648);
function __cxx_static_address_855513b228f73149289bc23e() {
  return __cxx_static_address_855513b228f73149289bc23e.reference || (__cxx_static_address_855513b228f73149289bc23e.reference = {
    __cReference: true,
    get value() { return FIX16_MIN__header_global_3b0d68b124318043; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:33
export const FIX16_OVERFLOW__header_global_b105236903848a4e = i32(2147483648);
function __cxx_static_address_76cd4a0e6ba6694f194751a9() {
  return __cxx_static_address_76cd4a0e6ba6694f194751a9.reference || (__cxx_static_address_76cd4a0e6ba6694f194751a9.reference = {
    __cReference: true,
    get value() { return FIX16_OVERFLOW__header_global_b105236903848a4e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:35
export const fix16_one__header_global_36fd4e70a129ebd9 = i32(65536);
function __cxx_static_address_1dd49e8e2c9c585fcbe7cf90() {
  return __cxx_static_address_1dd49e8e2c9c585fcbe7cf90.reference || (__cxx_static_address_1dd49e8e2c9c585fcbe7cf90.reference = {
    __cReference: true,
    get value() { return fix16_one__header_global_36fd4e70a129ebd9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:36
export const fix16_half__header_global_fc0137d2659fc287 = i32(32768);
function __cxx_static_address_26b1a246200bce04c8b1bc11() {
  return __cxx_static_address_26b1a246200bce04c8b1bc11.reference || (__cxx_static_address_26b1a246200bce04c8b1bc11.reference = {
    __cReference: true,
    get value() { return fix16_half__header_global_fc0137d2659fc287; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:37
export const flt_f161r__header_global_4c78b295ba0e9612 = Math.fround(Math.fround((Math.fround(1) / Math.fround(65536))));
function __cxx_static_address_a38edec130d1f05b5cc807c7() {
  return __cxx_static_address_a38edec130d1f05b5cc807c7.reference || (__cxx_static_address_a38edec130d1f05b5cc807c7.reference = {
    __cReference: true,
    get value() { return flt_f161r__header_global_4c78b295ba0e9612; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/audiolib/src/driver_adlib.cpp:139
export const OctavePitch = new Uint32Array([u32(0), u32(1024), u32(2048), u32(3072), u32(4096), u32(5120), u32(6144), u32(7168)]);
function __cxx_static_address_a901ac60fb0952179330ccba() {
  return __cxx_static_address_a901ac60fb0952179330ccba.reference || (__cxx_static_address_a901ac60fb0952179330ccba.reference = {
    __cReference: true,
    get value() { return OctavePitch; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/audiolib/src/driver_adlib.cpp:143
export let NoteMod12 = new Uint32Array(96);
function __cxx_static_address_ff3410acc5bedaf9c49c1e8f() {
  return __cxx_static_address_ff3410acc5bedaf9c49c1e8f.reference || (__cxx_static_address_ff3410acc5bedaf9c49c1e8f.reference = {
    __cReference: true,
    get value() { return NoteMod12; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/audiolib/src/driver_adlib.cpp:144
export let NoteDiv12 = new Uint32Array(96);
function __cxx_static_address_cda56364d77b8d747b687227() {
  return __cxx_static_address_cda56364d77b8d747b687227.reference || (__cxx_static_address_cda56364d77b8d747b687227.reference = {
    __cReference: true,
    get value() { return NoteDiv12; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/audiolib/src/driver_adlib.cpp:153
export const NotePitch = [new Uint32Array([u32(343), u32(363), u32(385), u32(408), u32(432), u32(458), u32(485), u32(514), u32(544), u32(577), u32(611), u32(647)]), new Uint32Array([u32(343), u32(363), u32(385), u32(408), u32(432), u32(458), u32(485), u32(514), u32(544), u32(578), u32(612), u32(648)]), new Uint32Array([u32(344), u32(364), u32(386), u32(409), u32(433), u32(459), u32(486), u32(515), u32(545), u32(579), u32(613), u32(649)]), new Uint32Array([u32(344), u32(364), u32(387), u32(410), u32(434), u32(460), u32(487), u32(516), u32(546), u32(580), u32(614), u32(650)]), new Uint32Array([u32(345), u32(365), u32(387), u32(410), u32(435), u32(461), u32(488), u32(517), u32(547), u32(581), u32(615), u32(651)]), new Uint32Array([u32(346), u32(366), u32(388), u32(411), u32(435), u32(462), u32(489), u32(518), u32(548), u32(582), u32(616), u32(652)]), new Uint32Array([u32(346), u32(366), u32(389), u32(412), u32(436), u32(462), u32(490), u32(519), u32(549), u32(583), u32(617), u32(654)]), new Uint32Array([u32(347), u32(367), u32(389), u32(413), u32(437), u32(463), u32(491), u32(520), u32(550), u32(584), u32(618), u32(655)]), new Uint32Array([u32(347), u32(368), u32(390), u32(413), u32(438), u32(464), u32(492), u32(521), u32(551), u32(585), u32(619), u32(656)]), new Uint32Array([u32(348), u32(368), u32(391), u32(414), u32(439), u32(465), u32(492), u32(522), u32(552), u32(586), u32(621), u32(657)]), new Uint32Array([u32(349), u32(369), u32(392), u32(415), u32(439), u32(466), u32(493), u32(523), u32(553), u32(587), u32(622), u32(658)]), new Uint32Array([u32(349), u32(370), u32(392), u32(416), u32(440), u32(467), u32(494), u32(524), u32(554), u32(588), u32(623), u32(659)]), new Uint32Array([u32(350), u32(370), u32(393), u32(416), u32(441), u32(468), u32(495), u32(525), u32(555), u32(589), u32(624), u32(661)]), new Uint32Array([u32(351), u32(371), u32(394), u32(417), u32(442), u32(468), u32(496), u32(526), u32(556), u32(590), u32(625), u32(662)]), new Uint32Array([u32(351), u32(372), u32(394), u32(418), u32(443), u32(469), u32(497), u32(527), u32(557), u32(591), u32(626), u32(663)]), new Uint32Array([u32(352), u32(372), u32(395), u32(419), u32(443), u32(470), u32(498), u32(528), u32(558), u32(592), u32(627), u32(664)]), new Uint32Array([u32(353), u32(373), u32(396), u32(419), u32(444), u32(471), u32(499), u32(529), u32(559), u32(593), u32(628), u32(665)]), new Uint32Array([u32(353), u32(374), u32(396), u32(420), u32(445), u32(472), u32(500), u32(530), u32(560), u32(594), u32(630), u32(667)]), new Uint32Array([u32(354), u32(374), u32(397), u32(421), u32(446), u32(473), u32(501), u32(530), u32(561), u32(596), u32(631), u32(668)]), new Uint32Array([u32(354), u32(375), u32(398), u32(422), u32(447), u32(473), u32(501), u32(531), u32(562), u32(597), u32(632), u32(669)]), new Uint32Array([u32(355), u32(376), u32(399), u32(422), u32(447), u32(474), u32(502), u32(532), u32(563), u32(598), u32(633), u32(670)]), new Uint32Array([u32(356), u32(377), u32(399), u32(423), u32(448), u32(475), u32(503), u32(533), u32(565), u32(599), u32(634), u32(671)]), new Uint32Array([u32(356), u32(377), u32(400), u32(424), u32(449), u32(476), u32(504), u32(534), u32(566), u32(600), u32(635), u32(673)]), new Uint32Array([u32(357), u32(378), u32(401), u32(425), u32(450), u32(477), u32(505), u32(535), u32(567), u32(601), u32(636), u32(674)]), new Uint32Array([u32(358), u32(379), u32(402), u32(426), u32(451), u32(478), u32(506), u32(536), u32(568), u32(602), u32(638), u32(675)]), new Uint32Array([u32(358), u32(379), u32(402), u32(426), u32(451), u32(479), u32(507), u32(537), u32(569), u32(603), u32(639), u32(676)]), new Uint32Array([u32(359), u32(380), u32(403), u32(427), u32(452), u32(480), u32(508), u32(538), u32(570), u32(604), u32(640), u32(678)]), new Uint32Array([u32(360), u32(381), u32(404), u32(428), u32(453), u32(480), u32(509), u32(539), u32(571), u32(605), u32(641), u32(679)]), new Uint32Array([u32(360), u32(381), u32(404), u32(429), u32(454), u32(481), u32(510), u32(540), u32(572), u32(606), u32(642), u32(680)]), new Uint32Array([u32(361), u32(382), u32(405), u32(429), u32(455), u32(482), u32(511), u32(541), u32(573), u32(608), u32(643), u32(681)]), new Uint32Array([u32(362), u32(383), u32(406), u32(430), u32(456), u32(483), u32(511), u32(542), u32(574), u32(609), u32(644), u32(683)]), new Uint32Array([u32(362), u32(383), u32(407), u32(431), u32(456), u32(484), u32(512), u32(543), u32(575), u32(610), u32(646), u32(684)])];
function __cxx_static_address_8800f5acd15207a6e7994941() {
  return __cxx_static_address_8800f5acd15207a6e7994941.reference || (__cxx_static_address_8800f5acd15207a6e7994941.reference = {
    __cReference: true,
    get value() { return NotePitch; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/audiolib/src/driver_adlib.cpp:191
export const slotVoice = [new Int32Array([0, 3]), new Int32Array([1, 4]), new Int32Array([2, 5]), new Int32Array([6, 9]), new Int32Array([7, 10]), new Int32Array([8, 11]), new Int32Array([12, 15]), new Int32Array([13, 16]), new Int32Array([14, 17])];
function __cxx_static_address_363df8b415e36d268e84c183() {
  return __cxx_static_address_363df8b415e36d268e84c183.reference || (__cxx_static_address_363df8b415e36d268e84c183.reference = {
    __cReference: true,
    get value() { return slotVoice; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/audiolib/src/driver_adlib.cpp:203
export let VoiceLevel = Array.from({ length: 18 }, () => new Int32Array(2));
function __cxx_static_address_02f16399d940075c6f1847da() {
  return __cxx_static_address_02f16399d940075c6f1847da.reference || (__cxx_static_address_02f16399d940075c6f1847da.reference = {
    __cReference: true,
    get value() { return VoiceLevel; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/audiolib/src/driver_adlib.cpp:204
export let VoiceKsl = Array.from({ length: 18 }, () => new Int32Array(2));
function __cxx_static_address_c02742881332ec900df1284a() {
  return __cxx_static_address_c02742881332ec900df1284a.reference || (__cxx_static_address_c02742881332ec900df1284a.reference = {
    __cReference: true,
    get value() { return VoiceKsl; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/audiolib/src/driver_adlib.cpp:209
export const offsetSlot = new Int8Array([(((0) << 24) >> 24), (((1) << 24) >> 24), (((2) << 24) >> 24), (((3) << 24) >> 24), (((4) << 24) >> 24), (((5) << 24) >> 24), (((8) << 24) >> 24), (((9) << 24) >> 24), (((10) << 24) >> 24), (((11) << 24) >> 24), (((12) << 24) >> 24), (((13) << 24) >> 24), (((16) << 24) >> 24), (((17) << 24) >> 24), (((18) << 24) >> 24), (((19) << 24) >> 24), (((20) << 24) >> 24), (((21) << 24) >> 24)]);
function __cxx_static_address_ddbe16b9b1a36f342c506904() {
  return __cxx_static_address_ddbe16b9b1a36f342c506904.reference || (__cxx_static_address_ddbe16b9b1a36f342c506904.reference = {
    __cReference: true,
    get value() { return offsetSlot; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/audiolib/src/driver_adlib.cpp:211
export let VoiceReserved = new Int32Array(18);
function __cxx_static_address_e96bd618c80aa215ddfff4d5() {
  return __cxx_static_address_e96bd618c80aa215ddfff4d5.reference || (__cxx_static_address_e96bd618c80aa215ddfff4d5.reference = {
    __cReference: true,
    get value() { return VoiceReserved; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/audiolib/src/driver_adlib.cpp:213
export let Voice = Array.from({length:18}, () => cZeroAggregate({"record": {"channel": {"scalar": "unsigned int"}, "key": {"scalar": "unsigned int"}, "next": {"pointer": true}, "num": {"scalar": "unsigned int"}, "pitchleft": {"scalar": "unsigned int"}, "pitchright": {"scalar": "unsigned int"}, "port": {"scalar": "int"}, "prev": {"pointer": true}, "status": {"scalar": "unsigned int"}, "timbre": {"scalar": "int"}, "velocity": {"scalar": "unsigned int"}}}));
function __cxx_static_address_2aff166631c1b0ef4492d13c() {
  return __cxx_static_address_2aff166631c1b0ef4492d13c.reference || (__cxx_static_address_2aff166631c1b0ef4492d13c.reference = {
    __cReference: true,
    get value() { return Voice; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/audiolib/src/driver_adlib.cpp:214
export let Voice_Pool = cZeroAggregate({"record": {"end": {"pointer": true}, "start": {"pointer": true}}});
function __cxx_static_address_21a2c784fcf4a6c930ee35fb() {
  return __cxx_static_address_21a2c784fcf4a6c930ee35fb.reference || (__cxx_static_address_21a2c784fcf4a6c930ee35fb.reference = {
    __cReference: true,
    get value() { return Voice_Pool; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/audiolib/src/driver_adlib.cpp:216
export let Channel = Array.from({length:16}, () => cZeroAggregate({"record": {"Detune": {"scalar": "int"}, "EffectiveVolume": {"scalar": "unsigned int"}, "KeyDetune": {"scalar": "unsigned int"}, "KeyOffset": {"scalar": "int"}, "Pan": {"scalar": "int"}, "PitchBendHundreds": {"scalar": "short"}, "PitchBendRange": {"scalar": "short"}, "PitchBendSemiTones": {"scalar": "short"}, "Pitchbend": {"scalar": "int"}, "RPN": {"scalar": "unsigned int"}, "Timbre": {"scalar": "int"}, "Voices": {"record": {"end": {"pointer": true}, "start": {"pointer": true}}}, "Volume": {"scalar": "unsigned int"}}}));
function __cxx_static_address_0ff64f16a43c70b570b5160c() {
  return __cxx_static_address_0ff64f16a43c70b570b5160c.reference || (__cxx_static_address_0ff64f16a43c70b570b5160c.reference = {
    __cReference: true,
    get value() { return Channel; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/audiolib/src/driver_adlib.cpp:218
export const AL_LeftPort = i32(904);
function __cxx_static_address_b3c36f85e8fcdeb8dea43b21() {
  return __cxx_static_address_b3c36f85e8fcdeb8dea43b21.reference || (__cxx_static_address_b3c36f85e8fcdeb8dea43b21.reference = {
    __cReference: true,
    get value() { return AL_LeftPort; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/audiolib/src/driver_adlib.cpp:219
export const AL_RightPort = i32((904 + 2));
function __cxx_static_address_1e1a1f2c9c82db2308bfbe84() {
  return __cxx_static_address_1e1a1f2c9c82db2308bfbe84.reference || (__cxx_static_address_1e1a1f2c9c82db2308bfbe84.reference = {
    __cReference: true,
    get value() { return AL_RightPort; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/audiolib/src/driver_adlib.cpp:221
export const AL_MaxMidiChannel = i32(ARRAY_SIZE__header_5e8a052e5cad(Channel));
function __cxx_static_address_0e2fe0283a04ca13930663f8() {
  return __cxx_static_address_0e2fe0283a04ca13930663f8.reference || (__cxx_static_address_0e2fe0283a04ca13930663f8.reference = {
    __cReference: true,
    get value() { return AL_MaxMidiChannel; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/audiolib/src/driver_adlib.cpp:223
export let AL_Stereo = i32(1);
export function __cxx_global_cell_25b4c362c4cf6d8dc3a2fc77() {
  return __cxx_global_cell_25b4c362c4cf6d8dc3a2fc77.reference || (__cxx_global_cell_25b4c362c4cf6d8dc3a2fc77.reference = {
    __cReference: true,
    get value() { return AL_Stereo; },
    set value(__cxx_lvalue_0) { AL_Stereo = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/audiolib/src/driver_adlib.cpp:224
export let AL_AdditiveMode = 0;
export function __cxx_global_cell_105cb40b827387b1c500c7f2() {
  return __cxx_global_cell_105cb40b827387b1c500c7f2.reference || (__cxx_global_cell_105cb40b827387b1c500c7f2.reference = {
    __cReference: true,
    get value() { return AL_AdditiveMode; },
    set value(__cxx_lvalue_0) { AL_AdditiveMode = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/audiolib/src/driver_adlib.cpp:226
export let AL_PostAmp = Math.fround(Math.fround(3));
export function __cxx_global_cell_3efe13c096809501623ea758() {
  return __cxx_global_cell_3efe13c096809501623ea758.reference || (__cxx_global_cell_3efe13c096809501623ea758.reference = {
    __cReference: true,
    get value() { return AL_PostAmp; },
    set value(__cxx_lvalue_0) { AL_PostAmp = Math.fround(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/audiolib/src/driver_adlib.cpp:239
export function LL_RemoveNode(item, head, tail, next, prev) {
  if (cPointerCompare((cPointerOffset(item, prev, Uint8Array.BYTES_PER_ELEMENT)).value, null, "==")) {
    ((head).value = (cPointerOffset(item, next, Uint8Array.BYTES_PER_ELEMENT)).value);
  } else {
    ((cPointerOffset((cPointerOffset(item, prev, Uint8Array.BYTES_PER_ELEMENT)).value, next, Uint8Array.BYTES_PER_ELEMENT)).value = (cPointerOffset(item, next, Uint8Array.BYTES_PER_ELEMENT)).value);
  }
  if (cPointerCompare((cPointerOffset(item, next, Uint8Array.BYTES_PER_ELEMENT)).value, null, "==")) {
    ((tail).value = (cPointerOffset(item, prev, Uint8Array.BYTES_PER_ELEMENT)).value);
  } else {
    ((cPointerOffset((cPointerOffset(item, next, Uint8Array.BYTES_PER_ELEMENT)).value, prev, Uint8Array.BYTES_PER_ELEMENT)).value = (cPointerOffset(item, prev, Uint8Array.BYTES_PER_ELEMENT)).value);
  }
  ((cPointerOffset(item, next, Uint8Array.BYTES_PER_ELEMENT)).value = null);
  ((cPointerOffset(item, prev, Uint8Array.BYTES_PER_ELEMENT)).value = null);
}

// C/C++ source: source/audiolib/src/driver_adlib.cpp:255
export function LL_AddNode(item, head, tail, next, prev) {
  ((cPointerOffset(item, prev, Uint8Array.BYTES_PER_ELEMENT)).value = null);
  ((cPointerOffset(item, next, Uint8Array.BYTES_PER_ELEMENT)).value = (head).value);
  if ((head).value) {
    ((cPointerOffset((head).value, prev, Uint8Array.BYTES_PER_ELEMENT)).value = item);
  } else {
    ((tail).value = item);
  }
  ((head).value = item);
}

// C/C++ source: source/audiolib/src/driver_adlib.cpp:385
export function AL_GetVoice(channel, key) {
  let voice = (cPointerElementRef(Channel, channel).value).Voices.start;
  while (cPointerCompare(voice, null, "!=")) {
    if ((cRecordObject(voice).key == u32(key))) {
      return i32(cRecordObject(voice).num);
    }
    (voice = cRecordObject(voice).next);
  }
  return i32((-1));
}

// C/C++ source: source/audiolib/src/driver_adlib.cpp:477
export function AL_SetChannelDetune(channel, detune) {
  ((cPointerElementRef(Channel, channel).value).Detune = i32(detune));
}

// C/C++ source: source/audiolib/src/driver_adlib.cpp:514
export function AL_CalcPitchInfo() {
  for (let note = i32(0); (note <= i32((i32(Math.imul(7, 12)) + 11))); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => note, __cxx_lvalue_1 => { note = __cxx_lvalue_1; }))) {
    ((cDeref(cPointerOffset(NoteMod12, note, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value) = u32((note % 12)));
    ((cDeref(cPointerOffset(NoteDiv12, note, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value) = u32(Math.trunc(note / 12)));
  }
}

// C/C++ source: source/audiolib/src/driver_adlib.cpp:713
export function AL_ProgramChange(channel, patch) {
  if ((channel >= AL_MaxMidiChannel)) {
    return;
  }
  ((cPointerElementRef(Channel, channel).value).Timbre = i32(patch));
}

// C/C++ source: source/audiolib/src/driver_adlib.cpp:747
export function AL_SetVolume(volume) {
  (AL_Volume = i32(clamp__header_e544dd17e2e0(volume, 0, 255)));
}

// C/C++ source: source/build/include/compat.h:1169
export const pow2char__header_global_f2f29e8a9418d43f = new Uint8Array([((1) & 255), ((2) & 255), ((4) & 255), ((8) & 255), ((16) & 255), ((32) & 255), ((64) & 255), ((128) & 255)]);
function __cxx_static_address_33d85cb5a79e579f2e8d3da2() {
  return __cxx_static_address_33d85cb5a79e579f2e8d3da2.reference || (__cxx_static_address_33d85cb5a79e579f2e8d3da2.reference = {
    __cReference: true,
    get value() { return pow2char__header_global_f2f29e8a9418d43f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export function clamp__header_2f26f744f633(__cxx_in, min, max) {
  return Math.fround(((__cxx_in <= Math.fround(Math.fround(min))) ? Math.fround(Math.fround(min)) : ((__cxx_in >= Math.fround(Math.fround(max))) ? Math.fround(Math.fround(max)) : __cxx_in)));
}

export function ARRAY_SIZE__header_5e8a052e5cad(arg0) {
  return u64(16n);
}

export function clamp__header_e544dd17e2e0(__cxx_in, min, max) {
  return i32(((__cxx_in <= i32(min)) ? i32(min) : ((__cxx_in >= i32(max)) ? i32(max) : __cxx_in)));
}
