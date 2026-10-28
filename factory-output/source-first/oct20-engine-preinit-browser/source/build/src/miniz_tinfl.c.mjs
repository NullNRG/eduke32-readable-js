// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/build/src/miniz_tinfl.c
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
export const fix16_rad_to_deg_mult__header_global_4f5e6b00b7d8a3a1 = i32(3754936);
function __cxx_static_address_9fc10a899172c4d757c4b964() {
  return __cxx_static_address_9fc10a899172c4d757c4b964.reference || (__cxx_static_address_9fc10a899172c4d757c4b964.reference = {
    __cReference: true,
    get value() { return fix16_rad_to_deg_mult__header_global_4f5e6b00b7d8a3a1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:114
export const fix16_deg_to_rad_mult__header_global_f65983197f967abf = i32(1144);
function __cxx_static_address_4f69a223dc2a1d60e56a21fe() {
  return __cxx_static_address_4f69a223dc2a1d60e56a21fe.reference || (__cxx_static_address_4f69a223dc2a1d60e56a21fe.reference = {
    __cReference: true,
    get value() { return fix16_deg_to_rad_mult__header_global_f65983197f967abf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:31
export const FIX16_MAX__header_global_e3dd8d23fde2a1a4 = i32(2147483647);
function __cxx_static_address_5d34bf07437cd24baa32b942() {
  return __cxx_static_address_5d34bf07437cd24baa32b942.reference || (__cxx_static_address_5d34bf07437cd24baa32b942.reference = {
    __cReference: true,
    get value() { return FIX16_MAX__header_global_e3dd8d23fde2a1a4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:32
export const FIX16_MIN__header_global_2e03162394f8b3a7 = i32(2147483648);
function __cxx_static_address_ac4babf856bbf9e47ae792bd() {
  return __cxx_static_address_ac4babf856bbf9e47ae792bd.reference || (__cxx_static_address_ac4babf856bbf9e47ae792bd.reference = {
    __cReference: true,
    get value() { return FIX16_MIN__header_global_2e03162394f8b3a7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:33
export const FIX16_OVERFLOW__header_global_0809349fd0454028 = i32(2147483648);
function __cxx_static_address_397fb531f7f5420e2d8be727() {
  return __cxx_static_address_397fb531f7f5420e2d8be727.reference || (__cxx_static_address_397fb531f7f5420e2d8be727.reference = {
    __cReference: true,
    get value() { return FIX16_OVERFLOW__header_global_0809349fd0454028; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:35
export const fix16_one__header_global_82e9065eb7e28244 = i32(65536);
function __cxx_static_address_f4b73a97feb764e52ab7230c() {
  return __cxx_static_address_f4b73a97feb764e52ab7230c.reference || (__cxx_static_address_f4b73a97feb764e52ab7230c.reference = {
    __cReference: true,
    get value() { return fix16_one__header_global_82e9065eb7e28244; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:36
export const fix16_half__header_global_1eb31ba92daf6da5 = i32(32768);
function __cxx_static_address_6e807f028a36136b804dd109() {
  return __cxx_static_address_6e807f028a36136b804dd109.reference || (__cxx_static_address_6e807f028a36136b804dd109.reference = {
    __cReference: true,
    get value() { return fix16_half__header_global_1eb31ba92daf6da5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:37
export const flt_f161r__header_global_eb80848078dedf13 = Math.fround(Math.fround((Math.fround(1) / Math.fround(65536))));
function __cxx_static_address_e6524cff338b1c5fb869a7d1() {
  return __cxx_static_address_e6524cff338b1c5fb869a7d1.reference || (__cxx_static_address_e6524cff338b1c5fb869a7d1.reference = {
    __cReference: true,
    get value() { return flt_f161r__header_global_eb80848078dedf13; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/miniz_tinfl.c:177
export function tinfl_clear_tree(r) {
  if ((cRecordObject(r).m_type == u32(0))) {
    cByteMemory.memset(cRecordObject(r).m_tree_0, 0, 1152);
  } else {
    if ((cRecordObject(r).m_type == u32(1))) {
      cByteMemory.memset(cRecordObject(r).m_tree_1, 0, 128);
    } else {
      cByteMemory.memset(cRecordObject(r).m_tree_2, 0, 76);
    }
  }
}

// C/C++ source: source/build/src/miniz_tinfl.c:187
const __cxx_literal_6139dfcb116987cb1da2 = Uint8Array.from([3, 3, 11, 0]);
const __cxx_literal_1d26741add071fc6c539 = Uint8Array.from([2, 3, 7, 0]);
const __cxx_literal_14e4260e0bdd68b56044 = Uint8Array.from([5, 5, 4, 0]);
const __cxx_literal_9a8fa1356e446d049dac = Uint8Array.from([5, 5, 4, 0]);
const __cxx_literal_fb1c673f9167b4ec36a9 = Uint8Array.from([5, 5, 4, 0]);
const __cxx_literal_ed9bfc60e5e1cc6cb69a = Uint8Array.from([5, 5, 4, 0]);
const __cxx_literal_9ea666c646e551c85a92 = Uint8Array.from([5, 5, 4, 0]);
let __static_tinfl_decompress_s_min_table_sizes = new Uint16Array([((257) & 65535), ((1) & 65535), ((4) & 65535)]);
let __static_tinfl_decompress_s_length_dezigzag = new Uint8Array([((16) & 255), ((17) & 255), ((18) & 255), ((0) & 255), ((8) & 255), ((7) & 255), ((9) & 255), ((6) & 255), ((10) & 255), ((5) & 255), ((11) & 255), ((4) & 255), ((12) & 255), ((3) & 255), ((13) & 255), ((2) & 255), ((14) & 255), ((1) & 255), ((15) & 255)]);
let __static_tinfl_decompress_s_dist_extra = (() => { const items = new Uint8Array(32); items.set([((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((1) & 255), ((1) & 255), ((2) & 255), ((2) & 255), ((3) & 255), ((3) & 255), ((4) & 255), ((4) & 255), ((5) & 255), ((5) & 255), ((6) & 255), ((6) & 255), ((7) & 255), ((7) & 255), ((8) & 255), ((8) & 255), ((9) & 255), ((9) & 255), ((10) & 255), ((10) & 255), ((11) & 255), ((11) & 255), ((12) & 255), ((12) & 255), ((13) & 255), ((13) & 255)]); return items; })();
let __static_tinfl_decompress_s_dist_base = new Uint16Array([((1) & 65535), ((2) & 65535), ((3) & 65535), ((4) & 65535), ((5) & 65535), ((7) & 65535), ((9) & 65535), ((13) & 65535), ((17) & 65535), ((25) & 65535), ((33) & 65535), ((49) & 65535), ((65) & 65535), ((97) & 65535), ((129) & 65535), ((193) & 65535), ((257) & 65535), ((385) & 65535), ((513) & 65535), ((769) & 65535), ((1025) & 65535), ((1537) & 65535), ((2049) & 65535), ((3073) & 65535), ((4097) & 65535), ((6145) & 65535), ((8193) & 65535), ((12289) & 65535), ((16385) & 65535), ((24577) & 65535), ((0) & 65535), ((0) & 65535)]);
let __static_tinfl_decompress_s_length_extra = new Uint8Array([((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((1) & 255), ((1) & 255), ((1) & 255), ((1) & 255), ((2) & 255), ((2) & 255), ((2) & 255), ((2) & 255), ((3) & 255), ((3) & 255), ((3) & 255), ((3) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((4) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((5) & 255), ((0) & 255), ((0) & 255), ((0) & 255)]);
let __static_tinfl_decompress_s_length_base = new Uint16Array([((3) & 65535), ((4) & 65535), ((5) & 65535), ((6) & 65535), ((7) & 65535), ((8) & 65535), ((9) & 65535), ((10) & 65535), ((11) & 65535), ((13) & 65535), ((15) & 65535), ((17) & 65535), ((19) & 65535), ((23) & 65535), ((27) & 65535), ((31) & 65535), ((35) & 65535), ((43) & 65535), ((51) & 65535), ((59) & 65535), ((67) & 65535), ((83) & 65535), ((99) & 65535), ((115) & 65535), ((131) & 65535), ((163) & 65535), ((195) & 65535), ((227) & 65535), ((258) & 65535), ((0) & 65535), ((0) & 65535)]);
export function tinfl_decompress(r, pIn_buf_next, pIn_buf_size, pOut_buf_start, pOut_buf_next, pOut_buf_size, decomp_flags) {
  let pTrees, pCode_sizes, status, num_bits, dist, counter, num_extra, bit_buf, pIn_buf_cur, pIn_buf_end, pOut_buf_cur, pOut_buf_end, out_buf_size_mask, dist_from_out_buf_start, c, __cxx_cfg_local_15_c, __cxx_cfg_local_16_c, __cxx_cfg_local_17_c, n, p, i, __cxx_cfg_local_21_c, s, __cxx_cfg_local_23_c, tree_next, tree_cur, pLookUp, pTree, pCode_size, __cxx_cfg_local_29_i, j, used_syms, total, sym_index, next_code, total_syms, rev_code, l, cur_code, code_size, k, __cxx_cfg_local_41_s, temp, code_len, __cxx_cfg_local_44_c, __cxx_cfg_local_45_c, pSrc, __cxx_cfg_local_47_temp, __cxx_cfg_local_48_code_len, __cxx_cfg_local_49_c, sym2, __cxx_cfg_local_51_code_len, extra_bits, __cxx_cfg_local_53_c, __cxx_cfg_local_54_temp, __cxx_cfg_local_55_code_len, __cxx_cfg_local_56_c, __cxx_cfg_local_57_extra_bits, __cxx_cfg_local_58_c, __cxx_cfg_local_59_c, __cxx_cfg_local_60_s, __cxx_cfg_local_61_c, ptr, buf_len, __cxx_cfg_local_64_i, s1, s2, block_len;
  let __cxx_pc = 696;
  __cxx_cfg_loop: while (true) {
    switch (__cxx_pc) {
    case 0: return;
    case 1: {
      return status;
    }
    case 2: {
      (status = -2);
      __cxx_pc = 1; continue __cxx_cfg_loop;
    }
    case 3: {
      __cxx_pc = ((((i32(status) == i32(0)) && Boolean(u32((decomp_flags & u32(1))))) && (cRecordObject(r).m_check_adler32 != cRecordObject(r).m_z_adler32))) ? 2 : 1; continue __cxx_cfg_loop;
    }
    case 4: {
      (cRecordObject(r).m_check_adler32 = u32((u32((s2 << 16)) + s1)));
      __cxx_pc = 3; continue __cxx_cfg_loop;
    }
    case 5: {
      __cxx_pc = (Boolean(buf_len)) ? 22 : 4; continue __cxx_cfg_loop;
    }
    case 6: {
      (block_len = u64(5552));
      __cxx_pc = 5; continue __cxx_cfg_loop;
    }
    case 7: {
      (buf_len = u64((BigInt(buf_len) - BigInt(block_len))));
      __cxx_pc = 6; continue __cxx_cfg_loop;
    }
    case 8: {
      ((s1 = u32((Number(s1) % Number(65521)))), (s2 = u32((Number(s2) % Number(65521)))));
      __cxx_pc = 7; continue __cxx_cfg_loop;
    }
    case 9: {
      __cxx_pc = ((u64(__cxx_cfg_local_64_i) < block_len)) ? 11 : 8; continue __cxx_cfg_loop;
    }
    case 10: {
      ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = u32((previous + 1)); __cxx_lvalue_0.value = next; return next; })(cRef(() => __cxx_cfg_local_64_i, __cxx_lvalue_1 => { __cxx_cfg_local_64_i = __cxx_lvalue_1; }));
      __cxx_pc = 9; continue __cxx_cfg_loop;
    }
    case 11: {
      ((s1 = u32((Number(s1) + Number(u32((cDeref(((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_2.value = next; return previous; })(cRef(() => ptr, __cxx_lvalue_3 => { ptr = __cxx_lvalue_3; })), Uint8Array).value)))))), (s2 = u32((Number(s2) + Number(s1)))));
      __cxx_pc = 10; continue __cxx_cfg_loop;
    }
    case 12: {
      __cxx_pc = ((u64(u32((__cxx_cfg_local_64_i + u32(7)))) < block_len)) ? 21 : 9; continue __cxx_cfg_loop;
    }
    case 13: {
      ((__cxx_cfg_local_64_i = u32((Number(__cxx_cfg_local_64_i) + Number(u32(8))))), (ptr = cPointerOffset(ptr, 8, Uint8Array.BYTES_PER_ELEMENT)));
      __cxx_pc = 12; continue __cxx_cfg_loop;
    }
    case 14: {
      ((s1 = u32((Number(s1) + Number(u32((cDeref(cPointerOffset(ptr, 7, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))))), (s2 = u32((Number(s2) + Number(s1)))));
      __cxx_pc = 13; continue __cxx_cfg_loop;
    }
    case 15: {
      ((s1 = u32((Number(s1) + Number(u32((cDeref(cPointerOffset(ptr, 6, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))))), (s2 = u32((Number(s2) + Number(s1)))));
      __cxx_pc = 14; continue __cxx_cfg_loop;
    }
    case 16: {
      ((s1 = u32((Number(s1) + Number(u32((cDeref(cPointerOffset(ptr, 5, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))))), (s2 = u32((Number(s2) + Number(s1)))));
      __cxx_pc = 15; continue __cxx_cfg_loop;
    }
    case 17: {
      ((s1 = u32((Number(s1) + Number(u32((cDeref(cPointerOffset(ptr, 4, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))))), (s2 = u32((Number(s2) + Number(s1)))));
      __cxx_pc = 16; continue __cxx_cfg_loop;
    }
    case 18: {
      ((s1 = u32((Number(s1) + Number(u32((cDeref(cPointerOffset(ptr, 3, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))))), (s2 = u32((Number(s2) + Number(s1)))));
      __cxx_pc = 17; continue __cxx_cfg_loop;
    }
    case 19: {
      ((s1 = u32((Number(s1) + Number(u32((cDeref(cPointerOffset(ptr, 2, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))))), (s2 = u32((Number(s2) + Number(s1)))));
      __cxx_pc = 18; continue __cxx_cfg_loop;
    }
    case 20: {
      ((s1 = u32((Number(s1) + Number(u32((cDeref(cPointerOffset(ptr, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))))), (s2 = u32((Number(s2) + Number(s1)))));
      __cxx_pc = 19; continue __cxx_cfg_loop;
    }
    case 21: {
      ((s1 = u32((Number(s1) + Number(u32((cDeref(cPointerOffset(ptr, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))))), (s2 = u32((Number(s2) + Number(s1)))));
      __cxx_pc = 20; continue __cxx_cfg_loop;
    }
    case 22: {
      (__cxx_cfg_local_64_i = u32(0));
      __cxx_pc = 12; continue __cxx_cfg_loop;
    }
    case 23: {
      block_len = u64((BigInt(buf_len) % BigInt(u64(5552))));
      __cxx_pc = 5; continue __cxx_cfg_loop;
    }
    case 24: {
      s2 = u32((cRecordObject(r).m_check_adler32 >>> 16));
      __cxx_pc = 23; continue __cxx_cfg_loop;
    }
    case 25: {
      s1 = u32((cRecordObject(r).m_check_adler32 & u32(65535)));
      __cxx_pc = 24; continue __cxx_cfg_loop;
    }
    case 26: {
      __cxx_pc = 25; continue __cxx_cfg_loop;
    }
    case 27: {
      buf_len = u64((cDeref(pOut_buf_size, BigUint64Array).value));
      __cxx_pc = 26; continue __cxx_cfg_loop;
    }
    case 28: {
      ptr = pOut_buf_next;
      __cxx_pc = 27; continue __cxx_cfg_loop;
    }
    case 29: {
      __cxx_pc = ((Boolean(u32((decomp_flags & u32(i32((i32(1) | i32(8))))))) && (i32(status) >= 0))) ? 28 : 1; continue __cxx_cfg_loop;
    }
    case 30: {
      ((cDeref(pOut_buf_size, BigUint64Array).value) = u64(cPointerDiff(pOut_buf_cur, pOut_buf_next, Uint8Array.BYTES_PER_ELEMENT)));
      __cxx_pc = 29; continue __cxx_cfg_loop;
    }
    case 31: {
      ((cDeref(pIn_buf_size, BigUint64Array).value) = u64(cPointerDiff(pIn_buf_cur, pIn_buf_next, Uint8Array.BYTES_PER_ELEMENT)));
      __cxx_pc = 30; continue __cxx_cfg_loop;
    }
    case 32: {
      (cRecordObject(r).m_dist_from_out_buf_start = u64(dist_from_out_buf_start));
      __cxx_pc = 31; continue __cxx_cfg_loop;
    }
    case 33: {
      (cRecordObject(r).m_num_extra = u32(num_extra));
      __cxx_pc = 32; continue __cxx_cfg_loop;
    }
    case 34: {
      (cRecordObject(r).m_counter = u32(counter));
      __cxx_pc = 33; continue __cxx_cfg_loop;
    }
    case 35: {
      (cRecordObject(r).m_dist = u32(dist));
      __cxx_pc = 34; continue __cxx_cfg_loop;
    }
    case 36: {
      (cRecordObject(r).m_bit_buf = u64((BigInt(bit_buf) & BigInt((~(BigInt((~u64(0))) << BigInt(num_bits)))))));
      __cxx_pc = 35; continue __cxx_cfg_loop;
    }
    case 37: {
      (cRecordObject(r).m_num_bits = u32(num_bits));
      __cxx_pc = 36; continue __cxx_cfg_loop;
    }
    case 38: {
      __cxx_pc = ((cPointerCompare(pIn_buf_cur, pIn_buf_next, ">") && (num_bits >= u32(8)))) ? 40 : 37; continue __cxx_cfg_loop;
    }
    case 39: {
      (num_bits = u32((Number(num_bits) - Number(u32(8)))));
      __cxx_pc = 38; continue __cxx_cfg_loop;
    }
    case 40: {
      ((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = cPointerOffset(previous, -1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_4.value = next; return next; })(cRef(() => pIn_buf_cur, __cxx_lvalue_5 => { pIn_buf_cur = __cxx_lvalue_5; }));
      __cxx_pc = 39; continue __cxx_cfg_loop;
    }
    case 41: {
      __cxx_pc = (((i32(status) != i32(1)) && (i32(status) != i32(-4)))) ? 38 : 37; continue __cxx_cfg_loop;
    }
    case 42: {
      __cxx_pc = (Boolean(0)) ? 43 : 41; continue __cxx_cfg_loop;
    }
    case 43: {
      __cxx_pc = 48; continue __cxx_cfg_loop;
    }
    case 44: {
      __cxx_pc = 43; continue __cxx_cfg_loop;
    }
    case 45: {
      __cxx_pc = (Boolean(0)) ? 48 : 44; continue __cxx_cfg_loop;
    }
    case 46: {
      __cxx_pc = 41; continue __cxx_cfg_loop;
    }
    case 47: {
      (cRecordObject(r).m_state = u32(34));
      __cxx_pc = 46; continue __cxx_cfg_loop;
    }
    case 48: {
      (status = 0);
      __cxx_pc = 47; continue __cxx_cfg_loop;
    }
    case 49: {
      __cxx_pc = ((counter < u32(4))) ? 76 : 43; continue __cxx_cfg_loop;
    }
    case 50: {
      ((__cxx_lvalue_6) => { const previous = __cxx_lvalue_6.value; const next = u32((previous + 1)); __cxx_lvalue_6.value = next; return next; })(cRef(() => counter, __cxx_lvalue_7 => { counter = __cxx_lvalue_7; }));
      __cxx_pc = 49; continue __cxx_cfg_loop;
    }
    case 51: {
      (cRecordObject(r).m_z_adler32 = u32((u32((cRecordObject(r).m_z_adler32 << 8)) | __cxx_cfg_local_60_s)));
      __cxx_pc = 50; continue __cxx_cfg_loop;
    }
    case 52: {
      __cxx_pc = (Boolean(0)) ? 67 : 51; continue __cxx_cfg_loop;
    }
    case 53: {
      (num_bits = u32((Number(num_bits) - Number(u32(8)))));
      __cxx_pc = 52; continue __cxx_cfg_loop;
    }
    case 54: {
      (bit_buf = u64((BigInt(bit_buf) >> BigInt(8))));
      __cxx_pc = 53; continue __cxx_cfg_loop;
    }
    case 55: {
      (__cxx_cfg_local_60_s = u32((BigInt(bit_buf) & BigInt(u64(i32((i32((1 << 8)) - 1)))))));
      __cxx_pc = 54; continue __cxx_cfg_loop;
    }
    case 56: {
      __cxx_pc = ((num_bits < u32(8))) ? 66 : 55; continue __cxx_cfg_loop;
    }
    case 57: {
      (num_bits = u32((Number(num_bits) + Number(u32(8)))));
      __cxx_pc = 56; continue __cxx_cfg_loop;
    }
    case 58: {
      (bit_buf = u64((BigInt(bit_buf) | BigInt((BigInt(u64(__cxx_cfg_local_61_c)) << BigInt(num_bits))))));
      __cxx_pc = 57; continue __cxx_cfg_loop;
    }
    case 59: {
      __cxx_pc = (Boolean(0)) ? 61 : 58; continue __cxx_cfg_loop;
    }
    case 60: {
      (__cxx_cfg_local_61_c = u32((cDeref(((__cxx_lvalue_8) => { const previous = __cxx_lvalue_8.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_8.value = next; return previous; })(cRef(() => pIn_buf_cur, __cxx_lvalue_9 => { pIn_buf_cur = __cxx_lvalue_9; })), Uint8Array).value)));
      __cxx_pc = 59; continue __cxx_cfg_loop;
    }
    case 61: {
      __cxx_pc = (cPointerCompare(pIn_buf_cur, pIn_buf_end, ">=")) ? 65 : 60; continue __cxx_cfg_loop;
    }
    case 62: {
      __cxx_pc = (Boolean(0)) ? 65 : 61; continue __cxx_cfg_loop;
    }
    case 63: {
      __cxx_pc = 41; continue __cxx_cfg_loop;
    }
    case 64: {
      (cRecordObject(r).m_state = u32(41));
      __cxx_pc = 63; continue __cxx_cfg_loop;
    }
    case 65: {
      (status = (Boolean(u32((decomp_flags & u32(2)))) ? 1 : -4));
      __cxx_pc = 64; continue __cxx_cfg_loop;
    }
    case 66: {
      __cxx_pc = 61; continue __cxx_cfg_loop;
    }
    case 67: {
      __cxx_pc = ((num_bits < u32(8))) ? 66 : 55; continue __cxx_cfg_loop;
    }
    case 68: {
      __cxx_pc = (Boolean(0)) ? 70 : 51; continue __cxx_cfg_loop;
    }
    case 69: {
      (__cxx_cfg_local_60_s = u32((cDeref(((__cxx_lvalue_10) => { const previous = __cxx_lvalue_10.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_10.value = next; return previous; })(cRef(() => pIn_buf_cur, __cxx_lvalue_11 => { pIn_buf_cur = __cxx_lvalue_11; })), Uint8Array).value)));
      __cxx_pc = 68; continue __cxx_cfg_loop;
    }
    case 70: {
      __cxx_pc = (cPointerCompare(pIn_buf_cur, pIn_buf_end, ">=")) ? 74 : 69; continue __cxx_cfg_loop;
    }
    case 71: {
      __cxx_pc = (Boolean(0)) ? 74 : 70; continue __cxx_cfg_loop;
    }
    case 72: {
      __cxx_pc = 41; continue __cxx_cfg_loop;
    }
    case 73: {
      (cRecordObject(r).m_state = u32(42));
      __cxx_pc = 72; continue __cxx_cfg_loop;
    }
    case 74: {
      (status = (Boolean(u32((decomp_flags & u32(2)))) ? 1 : -4));
      __cxx_pc = 73; continue __cxx_cfg_loop;
    }
    case 75: {
      __cxx_pc = (Boolean(num_bits)) ? 67 : 70; continue __cxx_cfg_loop;
    }
    case 76: {
      __cxx_pc = 75; continue __cxx_cfg_loop;
    }
    case 77: {
      (counter = u32(0));
      __cxx_pc = 49; continue __cxx_cfg_loop;
    }
    case 78: {
      __cxx_pc = (Boolean(u32((decomp_flags & u32(1))))) ? 77 : 43; continue __cxx_cfg_loop;
    }
    case 79: {
      0;
      __cxx_pc = 78; continue __cxx_cfg_loop;
    }
    case 80: {
      (bit_buf = u64((BigInt(bit_buf) & BigInt((~(BigInt((~u64(0))) << BigInt(num_bits)))))));
      __cxx_pc = 79; continue __cxx_cfg_loop;
    }
    case 81: {
      __cxx_pc = ((cPointerCompare(pIn_buf_cur, pIn_buf_next, ">") && (num_bits >= u32(8)))) ? 83 : 80; continue __cxx_cfg_loop;
    }
    case 82: {
      (num_bits = u32((Number(num_bits) - Number(u32(8)))));
      __cxx_pc = 81; continue __cxx_cfg_loop;
    }
    case 83: {
      ((__cxx_lvalue_12) => { const previous = __cxx_lvalue_12.value; const next = cPointerOffset(previous, -1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_12.value = next; return next; })(cRef(() => pIn_buf_cur, __cxx_lvalue_13 => { pIn_buf_cur = __cxx_lvalue_13; }));
      __cxx_pc = 82; continue __cxx_cfg_loop;
    }
    case 84: {
      __cxx_pc = (Boolean(0)) ? 98 : 81; continue __cxx_cfg_loop;
    }
    case 85: {
      (num_bits = u32((Number(num_bits) - Number(u32((num_bits & u32(7)))))));
      __cxx_pc = 84; continue __cxx_cfg_loop;
    }
    case 86: {
      (bit_buf = u64((BigInt(bit_buf) >> BigInt(u32((num_bits & u32(7)))))));
      __cxx_pc = 85; continue __cxx_cfg_loop;
    }
    case 87: {
      __cxx_pc = ((num_bits < u32((num_bits & u32(7))))) ? 97 : 86; continue __cxx_cfg_loop;
    }
    case 88: {
      (num_bits = u32((Number(num_bits) + Number(u32(8)))));
      __cxx_pc = 87; continue __cxx_cfg_loop;
    }
    case 89: {
      (bit_buf = u64((BigInt(bit_buf) | BigInt((BigInt(u64(__cxx_cfg_local_59_c)) << BigInt(num_bits))))));
      __cxx_pc = 88; continue __cxx_cfg_loop;
    }
    case 90: {
      __cxx_pc = (Boolean(0)) ? 92 : 89; continue __cxx_cfg_loop;
    }
    case 91: {
      (__cxx_cfg_local_59_c = u32((cDeref(((__cxx_lvalue_14) => { const previous = __cxx_lvalue_14.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_14.value = next; return previous; })(cRef(() => pIn_buf_cur, __cxx_lvalue_15 => { pIn_buf_cur = __cxx_lvalue_15; })), Uint8Array).value)));
      __cxx_pc = 90; continue __cxx_cfg_loop;
    }
    case 92: {
      __cxx_pc = (cPointerCompare(pIn_buf_cur, pIn_buf_end, ">=")) ? 96 : 91; continue __cxx_cfg_loop;
    }
    case 93: {
      __cxx_pc = (Boolean(0)) ? 96 : 92; continue __cxx_cfg_loop;
    }
    case 94: {
      __cxx_pc = 41; continue __cxx_cfg_loop;
    }
    case 95: {
      (cRecordObject(r).m_state = u32(32));
      __cxx_pc = 94; continue __cxx_cfg_loop;
    }
    case 96: {
      (status = (Boolean(u32((decomp_flags & u32(2)))) ? 1 : -4));
      __cxx_pc = 95; continue __cxx_cfg_loop;
    }
    case 97: {
      __cxx_pc = 92; continue __cxx_cfg_loop;
    }
    case 98: {
      __cxx_pc = ((num_bits < u32((num_bits & u32(7))))) ? 97 : 86; continue __cxx_cfg_loop;
    }
    case 99: {
      __cxx_pc = ((!Boolean(u32((cRecordObject(r).m_final & u32(1)))))) ? 632 : 98; continue __cxx_cfg_loop;
    }
    case 100: {
      __cxx_pc = (Boolean(counter)) ? 116 : 99; continue __cxx_cfg_loop;
    }
    case 101: {
      (counter = u32((Number(counter) - Number(u32(n)))));
      __cxx_pc = 100; continue __cxx_cfg_loop;
    }
    case 102: {
      (pOut_buf_cur = cPointerOffset(pOut_buf_cur, n, Uint8Array.BYTES_PER_ELEMENT));
      __cxx_pc = 101; continue __cxx_cfg_loop;
    }
    case 103: {
      (pIn_buf_cur = cPointerOffset(pIn_buf_cur, n, Uint8Array.BYTES_PER_ELEMENT));
      __cxx_pc = 102; continue __cxx_cfg_loop;
    }
    case 104: {
      cByteMemory.memcpy(pOut_buf_cur, pIn_buf_cur, n);
      __cxx_pc = 103; continue __cxx_cfg_loop;
    }
    case 105: {
      (n = u64(((((u64(cPointerDiff(pOut_buf_end, pOut_buf_cur, Uint8Array.BYTES_PER_ELEMENT)) < u64(cPointerDiff(pIn_buf_end, pIn_buf_cur, Uint8Array.BYTES_PER_ELEMENT))) ? u64(cPointerDiff(pOut_buf_end, pOut_buf_cur, Uint8Array.BYTES_PER_ELEMENT)) : u64(cPointerDiff(pIn_buf_end, pIn_buf_cur, Uint8Array.BYTES_PER_ELEMENT))) < u64(counter)) ? ((u64(cPointerDiff(pOut_buf_end, pOut_buf_cur, Uint8Array.BYTES_PER_ELEMENT)) < u64(cPointerDiff(pIn_buf_end, pIn_buf_cur, Uint8Array.BYTES_PER_ELEMENT))) ? u64(cPointerDiff(pOut_buf_end, pOut_buf_cur, Uint8Array.BYTES_PER_ELEMENT)) : u64(cPointerDiff(pIn_buf_end, pIn_buf_cur, Uint8Array.BYTES_PER_ELEMENT))) : u64(counter))));
      __cxx_pc = 104; continue __cxx_cfg_loop;
    }
    case 106: {
      __cxx_pc = (cPointerCompare(pIn_buf_cur, pIn_buf_end, ">=")) ? 110 : 105; continue __cxx_cfg_loop;
    }
    case 107: {
      __cxx_pc = (Boolean(0)) ? 110 : 106; continue __cxx_cfg_loop;
    }
    case 108: {
      __cxx_pc = 41; continue __cxx_cfg_loop;
    }
    case 109: {
      (cRecordObject(r).m_state = u32(38));
      __cxx_pc = 108; continue __cxx_cfg_loop;
    }
    case 110: {
      (status = (Boolean(u32((decomp_flags & u32(2)))) ? 1 : -4));
      __cxx_pc = 109; continue __cxx_cfg_loop;
    }
    case 111: {
      __cxx_pc = (cPointerCompare(pOut_buf_cur, pOut_buf_end, ">=")) ? 115 : 106; continue __cxx_cfg_loop;
    }
    case 112: {
      __cxx_pc = (Boolean(0)) ? 115 : 111; continue __cxx_cfg_loop;
    }
    case 113: {
      __cxx_pc = 41; continue __cxx_cfg_loop;
    }
    case 114: {
      (cRecordObject(r).m_state = u32(9));
      __cxx_pc = 113; continue __cxx_cfg_loop;
    }
    case 115: {
      (status = 2);
      __cxx_pc = 114; continue __cxx_cfg_loop;
    }
    case 116: {
      __cxx_pc = 111; continue __cxx_cfg_loop;
    }
    case 117: {
      __cxx_pc = ((Boolean(counter) && Boolean(num_bits))) ? 140 : 100; continue __cxx_cfg_loop;
    }
    case 118: {
      ((__cxx_lvalue_16) => { const previous = __cxx_lvalue_16.value; const next = u32((previous - 1)); __cxx_lvalue_16.value = next; return previous; })(cRef(() => counter, __cxx_lvalue_17 => { counter = __cxx_lvalue_17; }));
      __cxx_pc = 117; continue __cxx_cfg_loop;
    }
    case 119: {
      ((cDeref(((__cxx_lvalue_18) => { const previous = __cxx_lvalue_18.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_18.value = next; return previous; })(cRef(() => pOut_buf_cur, __cxx_lvalue_19 => { pOut_buf_cur = __cxx_lvalue_19; })), Uint8Array).value) = ((((((dist) & 255)) & 255)) & 255));
      __cxx_pc = 118; continue __cxx_cfg_loop;
    }
    case 120: {
      __cxx_pc = (cPointerCompare(pOut_buf_cur, pOut_buf_end, ">=")) ? 124 : 119; continue __cxx_cfg_loop;
    }
    case 121: {
      __cxx_pc = (Boolean(0)) ? 124 : 120; continue __cxx_cfg_loop;
    }
    case 122: {
      __cxx_pc = 41; continue __cxx_cfg_loop;
    }
    case 123: {
      (cRecordObject(r).m_state = u32(52));
      __cxx_pc = 122; continue __cxx_cfg_loop;
    }
    case 124: {
      (status = 2);
      __cxx_pc = 123; continue __cxx_cfg_loop;
    }
    case 125: {
      __cxx_pc = (Boolean(0)) ? 140 : 120; continue __cxx_cfg_loop;
    }
    case 126: {
      (num_bits = u32((Number(num_bits) - Number(u32(8)))));
      __cxx_pc = 125; continue __cxx_cfg_loop;
    }
    case 127: {
      (bit_buf = u64((BigInt(bit_buf) >> BigInt(8))));
      __cxx_pc = 126; continue __cxx_cfg_loop;
    }
    case 128: {
      (dist = u32((BigInt(bit_buf) & BigInt(u64(i32((i32((1 << 8)) - 1)))))));
      __cxx_pc = 127; continue __cxx_cfg_loop;
    }
    case 129: {
      __cxx_pc = ((num_bits < u32(8))) ? 139 : 128; continue __cxx_cfg_loop;
    }
    case 130: {
      (num_bits = u32((Number(num_bits) + Number(u32(8)))));
      __cxx_pc = 129; continue __cxx_cfg_loop;
    }
    case 131: {
      (bit_buf = u64((BigInt(bit_buf) | BigInt((BigInt(u64(__cxx_cfg_local_17_c)) << BigInt(num_bits))))));
      __cxx_pc = 130; continue __cxx_cfg_loop;
    }
    case 132: {
      __cxx_pc = (Boolean(0)) ? 134 : 131; continue __cxx_cfg_loop;
    }
    case 133: {
      (__cxx_cfg_local_17_c = u32((cDeref(((__cxx_lvalue_20) => { const previous = __cxx_lvalue_20.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_20.value = next; return previous; })(cRef(() => pIn_buf_cur, __cxx_lvalue_21 => { pIn_buf_cur = __cxx_lvalue_21; })), Uint8Array).value)));
      __cxx_pc = 132; continue __cxx_cfg_loop;
    }
    case 134: {
      __cxx_pc = (cPointerCompare(pIn_buf_cur, pIn_buf_end, ">=")) ? 138 : 133; continue __cxx_cfg_loop;
    }
    case 135: {
      __cxx_pc = (Boolean(0)) ? 138 : 134; continue __cxx_cfg_loop;
    }
    case 136: {
      __cxx_pc = 41; continue __cxx_cfg_loop;
    }
    case 137: {
      (cRecordObject(r).m_state = u32(51));
      __cxx_pc = 136; continue __cxx_cfg_loop;
    }
    case 138: {
      (status = (Boolean(u32((decomp_flags & u32(2)))) ? 1 : -4));
      __cxx_pc = 137; continue __cxx_cfg_loop;
    }
    case 139: {
      __cxx_pc = 134; continue __cxx_cfg_loop;
    }
    case 140: {
      __cxx_pc = ((num_bits < u32(8))) ? 139 : 128; continue __cxx_cfg_loop;
    }
    case 141: {
      __cxx_pc = (Boolean(0)) ? 142 : 117; continue __cxx_cfg_loop;
    }
    case 142: {
      __cxx_pc = 147; continue __cxx_cfg_loop;
    }
    case 143: {
      __cxx_pc = 142; continue __cxx_cfg_loop;
    }
    case 144: {
      __cxx_pc = (Boolean(0)) ? 147 : 143; continue __cxx_cfg_loop;
    }
    case 145: {
      __cxx_pc = 41; continue __cxx_cfg_loop;
    }
    case 146: {
      (cRecordObject(r).m_state = u32(39));
      __cxx_pc = 145; continue __cxx_cfg_loop;
    }
    case 147: {
      (status = -1);
      __cxx_pc = 146; continue __cxx_cfg_loop;
    }
    case 148: {
      __cxx_pc = (((counter = u32(i32((i32((cDeref(cPointerOffset(cRecordObject(r).m_raw_header, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) | i32((i32((cDeref(cPointerOffset(cRecordObject(r).m_raw_header, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) << 8)))))) != u32(i32((65535 ^ i32((i32((cDeref(cPointerOffset(cRecordObject(r).m_raw_header, 2, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) | i32((i32((cDeref(cPointerOffset(cRecordObject(r).m_raw_header, 3, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) << 8))))))))) ? 142 : 117; continue __cxx_cfg_loop;
    }
    case 149: {
      __cxx_pc = ((counter < u32(4))) ? 174 : 148; continue __cxx_cfg_loop;
    }
    case 150: {
      ((__cxx_lvalue_22) => { const previous = __cxx_lvalue_22.value; const next = u32((previous + 1)); __cxx_lvalue_22.value = next; return next; })(cRef(() => counter, __cxx_lvalue_23 => { counter = __cxx_lvalue_23; }));
      __cxx_pc = 149; continue __cxx_cfg_loop;
    }
    case 151: {
      __cxx_pc = (Boolean(0)) ? 166 : 150; continue __cxx_cfg_loop;
    }
    case 152: {
      (num_bits = u32((Number(num_bits) - Number(u32(8)))));
      __cxx_pc = 151; continue __cxx_cfg_loop;
    }
    case 153: {
      (bit_buf = u64((BigInt(bit_buf) >> BigInt(8))));
      __cxx_pc = 152; continue __cxx_cfg_loop;
    }
    case 154: {
      ((cDeref(cPointerOffset(cRecordObject(r).m_raw_header, counter, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (((((BigInt(bit_buf) & BigInt(u64(i32((i32((1 << 8)) - 1)))))) & 255)) & 255));
      __cxx_pc = 153; continue __cxx_cfg_loop;
    }
    case 155: {
      __cxx_pc = ((num_bits < u32(8))) ? 165 : 154; continue __cxx_cfg_loop;
    }
    case 156: {
      (num_bits = u32((Number(num_bits) + Number(u32(8)))));
      __cxx_pc = 155; continue __cxx_cfg_loop;
    }
    case 157: {
      (bit_buf = u64((BigInt(bit_buf) | BigInt((BigInt(u64(__cxx_cfg_local_16_c)) << BigInt(num_bits))))));
      __cxx_pc = 156; continue __cxx_cfg_loop;
    }
    case 158: {
      __cxx_pc = (Boolean(0)) ? 160 : 157; continue __cxx_cfg_loop;
    }
    case 159: {
      (__cxx_cfg_local_16_c = u32((cDeref(((__cxx_lvalue_24) => { const previous = __cxx_lvalue_24.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_24.value = next; return previous; })(cRef(() => pIn_buf_cur, __cxx_lvalue_25 => { pIn_buf_cur = __cxx_lvalue_25; })), Uint8Array).value)));
      __cxx_pc = 158; continue __cxx_cfg_loop;
    }
    case 160: {
      __cxx_pc = (cPointerCompare(pIn_buf_cur, pIn_buf_end, ">=")) ? 164 : 159; continue __cxx_cfg_loop;
    }
    case 161: {
      __cxx_pc = (Boolean(0)) ? 164 : 160; continue __cxx_cfg_loop;
    }
    case 162: {
      __cxx_pc = 41; continue __cxx_cfg_loop;
    }
    case 163: {
      (cRecordObject(r).m_state = u32(6));
      __cxx_pc = 162; continue __cxx_cfg_loop;
    }
    case 164: {
      (status = (Boolean(u32((decomp_flags & u32(2)))) ? 1 : -4));
      __cxx_pc = 163; continue __cxx_cfg_loop;
    }
    case 165: {
      __cxx_pc = 160; continue __cxx_cfg_loop;
    }
    case 166: {
      __cxx_pc = ((num_bits < u32(8))) ? 165 : 154; continue __cxx_cfg_loop;
    }
    case 167: {
      __cxx_pc = (Boolean(0)) ? 169 : 150; continue __cxx_cfg_loop;
    }
    case 168: {
      ((cDeref(cPointerOffset(cRecordObject(r).m_raw_header, counter, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (((cDeref(((__cxx_lvalue_26) => { const previous = __cxx_lvalue_26.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_26.value = next; return previous; })(cRef(() => pIn_buf_cur, __cxx_lvalue_27 => { pIn_buf_cur = __cxx_lvalue_27; })), Uint8Array).value)) & 255));
      __cxx_pc = 167; continue __cxx_cfg_loop;
    }
    case 169: {
      __cxx_pc = (cPointerCompare(pIn_buf_cur, pIn_buf_end, ">=")) ? 173 : 168; continue __cxx_cfg_loop;
    }
    case 170: {
      __cxx_pc = (Boolean(0)) ? 173 : 169; continue __cxx_cfg_loop;
    }
    case 171: {
      __cxx_pc = 41; continue __cxx_cfg_loop;
    }
    case 172: {
      (cRecordObject(r).m_state = u32(7));
      __cxx_pc = 171; continue __cxx_cfg_loop;
    }
    case 173: {
      (status = (Boolean(u32((decomp_flags & u32(2)))) ? 1 : -4));
      __cxx_pc = 172; continue __cxx_cfg_loop;
    }
    case 174: {
      __cxx_pc = (Boolean(num_bits)) ? 166 : 169; continue __cxx_cfg_loop;
    }
    case 175: {
      (counter = u32(0));
      __cxx_pc = 149; continue __cxx_cfg_loop;
    }
    case 176: {
      __cxx_pc = (Boolean(0)) ? 190 : 175; continue __cxx_cfg_loop;
    }
    case 177: {
      (num_bits = u32((Number(num_bits) - Number(u32((num_bits & u32(7)))))));
      __cxx_pc = 176; continue __cxx_cfg_loop;
    }
    case 178: {
      (bit_buf = u64((BigInt(bit_buf) >> BigInt(u32((num_bits & u32(7)))))));
      __cxx_pc = 177; continue __cxx_cfg_loop;
    }
    case 179: {
      __cxx_pc = ((num_bits < u32((num_bits & u32(7))))) ? 189 : 178; continue __cxx_cfg_loop;
    }
    case 180: {
      (num_bits = u32((Number(num_bits) + Number(u32(8)))));
      __cxx_pc = 179; continue __cxx_cfg_loop;
    }
    case 181: {
      (bit_buf = u64((BigInt(bit_buf) | BigInt((BigInt(u64(__cxx_cfg_local_15_c)) << BigInt(num_bits))))));
      __cxx_pc = 180; continue __cxx_cfg_loop;
    }
    case 182: {
      __cxx_pc = (Boolean(0)) ? 184 : 181; continue __cxx_cfg_loop;
    }
    case 183: {
      (__cxx_cfg_local_15_c = u32((cDeref(((__cxx_lvalue_28) => { const previous = __cxx_lvalue_28.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_28.value = next; return previous; })(cRef(() => pIn_buf_cur, __cxx_lvalue_29 => { pIn_buf_cur = __cxx_lvalue_29; })), Uint8Array).value)));
      __cxx_pc = 182; continue __cxx_cfg_loop;
    }
    case 184: {
      __cxx_pc = (cPointerCompare(pIn_buf_cur, pIn_buf_end, ">=")) ? 188 : 183; continue __cxx_cfg_loop;
    }
    case 185: {
      __cxx_pc = (Boolean(0)) ? 188 : 184; continue __cxx_cfg_loop;
    }
    case 186: {
      __cxx_pc = 41; continue __cxx_cfg_loop;
    }
    case 187: {
      (cRecordObject(r).m_state = u32(5));
      __cxx_pc = 186; continue __cxx_cfg_loop;
    }
    case 188: {
      (status = (Boolean(u32((decomp_flags & u32(2)))) ? 1 : -4));
      __cxx_pc = 187; continue __cxx_cfg_loop;
    }
    case 189: {
      __cxx_pc = 184; continue __cxx_cfg_loop;
    }
    case 190: {
      __cxx_pc = ((num_bits < u32((num_bits & u32(7))))) ? 189 : 178; continue __cxx_cfg_loop;
    }
    case 191: {
      __cxx_pc = (Boolean(0)) ? 192 : 99; continue __cxx_cfg_loop;
    }
    case 192: {
      __cxx_pc = 197; continue __cxx_cfg_loop;
    }
    case 193: {
      __cxx_pc = 192; continue __cxx_cfg_loop;
    }
    case 194: {
      __cxx_pc = (Boolean(0)) ? 197 : 193; continue __cxx_cfg_loop;
    }
    case 195: {
      __cxx_pc = 41; continue __cxx_cfg_loop;
    }
    case 196: {
      (cRecordObject(r).m_state = u32(10));
      __cxx_pc = 195; continue __cxx_cfg_loop;
    }
    case 197: {
      (status = -1);
      __cxx_pc = 196; continue __cxx_cfg_loop;
    }
    case 198: {
      __cxx_pc = 392; continue __cxx_cfg_loop;
    }
    case 199: {
      __cxx_pc = 198; continue __cxx_cfg_loop;
    }
    case 200: {
      (pOut_buf_cur = cPointerOffset(pOut_buf_cur, counter, Uint8Array.BYTES_PER_ELEMENT));
      __cxx_pc = 199; continue __cxx_cfg_loop;
    }
    case 201: {
      ((cDeref(cPointerOffset(pOut_buf_cur, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (((cDeref(cPointerOffset(pSrc, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
      __cxx_pc = 200; continue __cxx_cfg_loop;
    }
    case 202: {
      __cxx_pc = ((counter > u32(1))) ? 201 : 200; continue __cxx_cfg_loop;
    }
    case 203: {
      ((cDeref(cPointerOffset(pOut_buf_cur, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (((cDeref(cPointerOffset(pSrc, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
      __cxx_pc = 202; continue __cxx_cfg_loop;
    }
    case 204: {
      __cxx_pc = ((counter > u32(0))) ? 203 : 199; continue __cxx_cfg_loop;
    }
    case 205: {
      __cxx_pc = ((counter > u32(2))) ? 211 : 204; continue __cxx_cfg_loop;
    }
    case 206: {
      (counter = u32((Number(counter) - Number(u32(3)))));
      __cxx_pc = 205; continue __cxx_cfg_loop;
    }
    case 207: {
      (pSrc = cPointerOffset(pSrc, 3, Uint8Array.BYTES_PER_ELEMENT));
      __cxx_pc = 206; continue __cxx_cfg_loop;
    }
    case 208: {
      (pOut_buf_cur = cPointerOffset(pOut_buf_cur, 3, Uint8Array.BYTES_PER_ELEMENT));
      __cxx_pc = 207; continue __cxx_cfg_loop;
    }
    case 209: {
      ((cDeref(cPointerOffset(pOut_buf_cur, 2, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (((cDeref(cPointerOffset(pSrc, 2, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
      __cxx_pc = 208; continue __cxx_cfg_loop;
    }
    case 210: {
      ((cDeref(cPointerOffset(pOut_buf_cur, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (((cDeref(cPointerOffset(pSrc, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
      __cxx_pc = 209; continue __cxx_cfg_loop;
    }
    case 211: {
      ((cDeref(cPointerOffset(pOut_buf_cur, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (((cDeref(cPointerOffset(pSrc, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
      __cxx_pc = 210; continue __cxx_cfg_loop;
    }
    case 212: {
      __cxx_pc = 199; continue __cxx_cfg_loop;
    }
    case 213: {
      __cxx_pc = (Boolean(((__cxx_lvalue_34) => { const previous = __cxx_lvalue_34.value; const next = u32((previous - 1)); __cxx_lvalue_34.value = next; return previous; })(cRef(() => counter, __cxx_lvalue_35 => { counter = __cxx_lvalue_35; })))) ? 215 : 212; continue __cxx_cfg_loop;
    }
    case 214: {
      ((cDeref(((__cxx_lvalue_30) => { const previous = __cxx_lvalue_30.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_30.value = next; return previous; })(cRef(() => pOut_buf_cur, __cxx_lvalue_31 => { pOut_buf_cur = __cxx_lvalue_31; })), Uint8Array).value) = (((cDeref(cPointerOffset(pOut_buf_start, (BigInt((BigInt(((__cxx_lvalue_32) => { const previous = __cxx_lvalue_32.value; const next = u64((previous + 1n)); __cxx_lvalue_32.value = next; return previous; })(cRef(() => dist_from_out_buf_start, __cxx_lvalue_33 => { dist_from_out_buf_start = __cxx_lvalue_33; }))) - BigInt(u64(dist)))) & BigInt(out_buf_size_mask)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
      __cxx_pc = 213; continue __cxx_cfg_loop;
    }
    case 215: {
      __cxx_pc = (cPointerCompare(pOut_buf_cur, pOut_buf_end, ">=")) ? 219 : 214; continue __cxx_cfg_loop;
    }
    case 216: {
      __cxx_pc = (Boolean(0)) ? 219 : 215; continue __cxx_cfg_loop;
    }
    case 217: {
      __cxx_pc = 41; continue __cxx_cfg_loop;
    }
    case 218: {
      (cRecordObject(r).m_state = u32(53));
      __cxx_pc = 217; continue __cxx_cfg_loop;
    }
    case 219: {
      (status = 2);
      __cxx_pc = 218; continue __cxx_cfg_loop;
    }
    case 220: {
      __cxx_pc = (cPointerCompare(cPointerOffset((cPointerCompare(pOut_buf_cur, pSrc, ">") ? pOut_buf_cur : pSrc), counter, Uint8Array.BYTES_PER_ELEMENT), pOut_buf_end, ">")) ? 213 : 205; continue __cxx_cfg_loop;
    }
    case 221: {
      (pSrc = cPointerOffset(pOut_buf_start, (BigInt((BigInt(dist_from_out_buf_start) - BigInt(u64(dist)))) & BigInt(out_buf_size_mask)), Uint8Array.BYTES_PER_ELEMENT));
      __cxx_pc = 220; continue __cxx_cfg_loop;
    }
    case 222: {
      __cxx_pc = (Boolean(0)) ? 223 : 221; continue __cxx_cfg_loop;
    }
    case 223: {
      __cxx_pc = 228; continue __cxx_cfg_loop;
    }
    case 224: {
      __cxx_pc = 223; continue __cxx_cfg_loop;
    }
    case 225: {
      __cxx_pc = (Boolean(0)) ? 228 : 224; continue __cxx_cfg_loop;
    }
    case 226: {
      __cxx_pc = 41; continue __cxx_cfg_loop;
    }
    case 227: {
      (cRecordObject(r).m_state = u32(37));
      __cxx_pc = 226; continue __cxx_cfg_loop;
    }
    case 228: {
      (status = -1);
      __cxx_pc = 227; continue __cxx_cfg_loop;
    }
    case 229: {
      __cxx_pc = (((((dist == u32(0)) || (u64(dist) > dist_from_out_buf_start)) || (dist_from_out_buf_start == u64(0))) && Boolean(u32((decomp_flags & u32(4)))))) ? 223 : 221; continue __cxx_cfg_loop;
    }
    case 230: {
      (dist_from_out_buf_start = u64(cPointerDiff(pOut_buf_cur, pOut_buf_start, Uint8Array.BYTES_PER_ELEMENT)));
      __cxx_pc = 229; continue __cxx_cfg_loop;
    }
    case 231: {
      (dist = u32((Number(dist) + Number(__cxx_cfg_local_57_extra_bits))));
      __cxx_pc = 230; continue __cxx_cfg_loop;
    }
    case 232: {
      __cxx_pc = (Boolean(0)) ? 247 : 231; continue __cxx_cfg_loop;
    }
    case 233: {
      (num_bits = u32((Number(num_bits) - Number(num_extra))));
      __cxx_pc = 232; continue __cxx_cfg_loop;
    }
    case 234: {
      (bit_buf = u64((BigInt(bit_buf) >> BigInt(num_extra))));
      __cxx_pc = 233; continue __cxx_cfg_loop;
    }
    case 235: {
      (__cxx_cfg_local_57_extra_bits = u32((BigInt(bit_buf) & BigInt(u64(i32((i32((1 << num_extra)) - 1)))))));
      __cxx_pc = 234; continue __cxx_cfg_loop;
    }
    case 236: {
      __cxx_pc = ((num_bits < u32(num_extra))) ? 246 : 235; continue __cxx_cfg_loop;
    }
    case 237: {
      (num_bits = u32((Number(num_bits) + Number(u32(8)))));
      __cxx_pc = 236; continue __cxx_cfg_loop;
    }
    case 238: {
      (bit_buf = u64((BigInt(bit_buf) | BigInt((BigInt(u64(__cxx_cfg_local_58_c)) << BigInt(num_bits))))));
      __cxx_pc = 237; continue __cxx_cfg_loop;
    }
    case 239: {
      __cxx_pc = (Boolean(0)) ? 241 : 238; continue __cxx_cfg_loop;
    }
    case 240: {
      (__cxx_cfg_local_58_c = u32((cDeref(((__cxx_lvalue_36) => { const previous = __cxx_lvalue_36.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_36.value = next; return previous; })(cRef(() => pIn_buf_cur, __cxx_lvalue_37 => { pIn_buf_cur = __cxx_lvalue_37; })), Uint8Array).value)));
      __cxx_pc = 239; continue __cxx_cfg_loop;
    }
    case 241: {
      __cxx_pc = (cPointerCompare(pIn_buf_cur, pIn_buf_end, ">=")) ? 245 : 240; continue __cxx_cfg_loop;
    }
    case 242: {
      __cxx_pc = (Boolean(0)) ? 245 : 241; continue __cxx_cfg_loop;
    }
    case 243: {
      __cxx_pc = 41; continue __cxx_cfg_loop;
    }
    case 244: {
      (cRecordObject(r).m_state = u32(27));
      __cxx_pc = 243; continue __cxx_cfg_loop;
    }
    case 245: {
      (status = (Boolean(u32((decomp_flags & u32(2)))) ? 1 : -4));
      __cxx_pc = 244; continue __cxx_cfg_loop;
    }
    case 246: {
      __cxx_pc = 241; continue __cxx_cfg_loop;
    }
    case 247: {
      __cxx_pc = ((num_bits < u32(num_extra))) ? 246 : 235; continue __cxx_cfg_loop;
    }
    case 248: {
      __cxx_pc = 247; continue __cxx_cfg_loop;
    }
    case 249: {
      __cxx_pc = (Boolean(num_extra)) ? 248 : 230; continue __cxx_cfg_loop;
    }
    case 250: {
      (dist = u32((cDeref(cPointerOffset(__static_tinfl_decompress_s_dist_base, dist, Uint16Array.BYTES_PER_ELEMENT), Uint16Array).value)));
      __cxx_pc = 249; continue __cxx_cfg_loop;
    }
    case 251: {
      (num_extra = u32((cDeref(cPointerOffset(__static_tinfl_decompress_s_dist_extra, dist, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)));
      __cxx_pc = 250; continue __cxx_cfg_loop;
    }
    case 252: {
      __cxx_pc = (Boolean(0)) ? 289 : 251; continue __cxx_cfg_loop;
    }
    case 253: {
      (num_bits = u32((Number(num_bits) - Number(__cxx_cfg_local_55_code_len))));
      __cxx_pc = 252; continue __cxx_cfg_loop;
    }
    case 254: {
      (bit_buf = u64((BigInt(bit_buf) >> BigInt(__cxx_cfg_local_55_code_len))));
      __cxx_pc = 253; continue __cxx_cfg_loop;
    }
    case 255: {
      (dist = u32(__cxx_cfg_local_54_temp));
      __cxx_pc = 254; continue __cxx_cfg_loop;
    }
    case 256: {
      ((__cxx_cfg_local_55_code_len = u32(i32((__cxx_cfg_local_54_temp >> 9)))), (__cxx_cfg_local_54_temp = i32((__cxx_cfg_local_54_temp & 511))));
      __cxx_pc = 255; continue __cxx_cfg_loop;
    }
    case 257: {
      __cxx_pc = ((__cxx_cfg_local_54_temp < 0)) ? 258 : 255; continue __cxx_cfg_loop;
    }
    case 258: {
      (__cxx_cfg_local_54_temp = i32((cDeref(cPointerOffset(cRecordObject(r).m_tree_1, (BigInt(u64((~__cxx_cfg_local_54_temp))) + BigInt((BigInt((BigInt(bit_buf) >> BigInt(((__cxx_lvalue_38) => { const previous = __cxx_lvalue_38.value; const next = u32((previous + 1)); __cxx_lvalue_38.value = next; return previous; })(cRef(() => __cxx_cfg_local_55_code_len, __cxx_lvalue_39 => { __cxx_cfg_local_55_code_len = __cxx_lvalue_39; }))))) & BigInt(u64(1))))), Int16Array.BYTES_PER_ELEMENT), Int16Array).value)));
      __cxx_pc = 257; continue __cxx_cfg_loop;
    }
    case 259: {
      (__cxx_cfg_local_55_code_len = u32(10));
      __cxx_pc = 258; continue __cxx_cfg_loop;
    }
    case 260: {
      __cxx_pc = (((__cxx_cfg_local_54_temp = i32((cPointerElementRef(cRecordObject(r).m_look_up, 1).value)[(BigInt(bit_buf) & BigInt(u64(i32((i32(1024) - 1)))))])) >= 0)) ? 256 : 259; continue __cxx_cfg_loop;
    }
    case 261: {
      __cxx_pc = ((num_bits < u32(15))) ? 281 : 260; continue __cxx_cfg_loop;
    }
    case 262: {
      (num_bits = u32((Number(num_bits) + Number(u32(8)))));
      __cxx_pc = 261; continue __cxx_cfg_loop;
    }
    case 263: {
      (bit_buf = u64((BigInt(bit_buf) | BigInt((BigInt(u64(__cxx_cfg_local_56_c)) << BigInt(num_bits))))));
      __cxx_pc = 262; continue __cxx_cfg_loop;
    }
    case 264: {
      __cxx_pc = (Boolean(0)) ? 266 : 263; continue __cxx_cfg_loop;
    }
    case 265: {
      (__cxx_cfg_local_56_c = u32((cDeref(((__cxx_lvalue_40) => { const previous = __cxx_lvalue_40.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_40.value = next; return previous; })(cRef(() => pIn_buf_cur, __cxx_lvalue_41 => { pIn_buf_cur = __cxx_lvalue_41; })), Uint8Array).value)));
      __cxx_pc = 264; continue __cxx_cfg_loop;
    }
    case 266: {
      __cxx_pc = (cPointerCompare(pIn_buf_cur, pIn_buf_end, ">=")) ? 270 : 265; continue __cxx_cfg_loop;
    }
    case 267: {
      __cxx_pc = (Boolean(0)) ? 270 : 266; continue __cxx_cfg_loop;
    }
    case 268: {
      __cxx_pc = 41; continue __cxx_cfg_loop;
    }
    case 269: {
      (cRecordObject(r).m_state = u32(26));
      __cxx_pc = 268; continue __cxx_cfg_loop;
    }
    case 270: {
      (status = (Boolean(u32((decomp_flags & u32(2)))) ? 1 : -4));
      __cxx_pc = 269; continue __cxx_cfg_loop;
    }
    case 271: {
      __cxx_pc = 260; continue __cxx_cfg_loop;
    }
    case 272: {
      __cxx_pc = ((Boolean(__cxx_cfg_local_55_code_len) && (num_bits >= __cxx_cfg_local_55_code_len))) ? 271 : 266; continue __cxx_cfg_loop;
    }
    case 273: {
      (__cxx_cfg_local_55_code_len = u32(i32((__cxx_cfg_local_54_temp >> 9))));
      __cxx_pc = 272; continue __cxx_cfg_loop;
    }
    case 274: {
      __cxx_pc = 260; continue __cxx_cfg_loop;
    }
    case 275: {
      __cxx_pc = ((__cxx_cfg_local_54_temp >= 0)) ? 274 : 266; continue __cxx_cfg_loop;
    }
    case 276: {
      __cxx_pc = (((__cxx_cfg_local_54_temp < 0) && (num_bits >= u32((__cxx_cfg_local_55_code_len + u32(1)))))) ? 277 : 275; continue __cxx_cfg_loop;
    }
    case 277: {
      (__cxx_cfg_local_54_temp = i32((cDeref(cPointerOffset(cRecordObject(r).m_tree_1, (BigInt(u64((~__cxx_cfg_local_54_temp))) + BigInt((BigInt((BigInt(bit_buf) >> BigInt(((__cxx_lvalue_42) => { const previous = __cxx_lvalue_42.value; const next = u32((previous + 1)); __cxx_lvalue_42.value = next; return previous; })(cRef(() => __cxx_cfg_local_55_code_len, __cxx_lvalue_43 => { __cxx_cfg_local_55_code_len = __cxx_lvalue_43; }))))) & BigInt(u64(1))))), Int16Array.BYTES_PER_ELEMENT), Int16Array).value)));
      __cxx_pc = 276; continue __cxx_cfg_loop;
    }
    case 278: {
      (__cxx_cfg_local_55_code_len = u32(10));
      __cxx_pc = 277; continue __cxx_cfg_loop;
    }
    case 279: {
      __cxx_pc = ((num_bits > u32(10))) ? 278 : 266; continue __cxx_cfg_loop;
    }
    case 280: {
      __cxx_pc = ((__cxx_cfg_local_54_temp >= 0)) ? 273 : 279; continue __cxx_cfg_loop;
    }
    case 281: {
      (__cxx_cfg_local_54_temp = i32((cPointerElementRef(cRecordObject(r).m_look_up, 1).value)[(BigInt(bit_buf) & BigInt(u64(i32((i32(1024) - 1)))))]));
      __cxx_pc = 280; continue __cxx_cfg_loop;
    }
    case 282: {
      (num_bits = u32((Number(num_bits) + Number(u32(16)))));
      __cxx_pc = 260; continue __cxx_cfg_loop;
    }
    case 283: {
      (pIn_buf_cur = cPointerOffset(pIn_buf_cur, 2, Uint8Array.BYTES_PER_ELEMENT));
      __cxx_pc = 282; continue __cxx_cfg_loop;
    }
    case 284: {
      (bit_buf = u64((BigInt(bit_buf) | BigInt((BigInt((BigInt(u64((cDeref(cPointerOffset(pIn_buf_cur, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value))) << BigInt(num_bits))) | BigInt((BigInt(u64((cDeref(cPointerOffset(pIn_buf_cur, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value))) << BigInt(u32((num_bits + u32(8)))))))))));
      __cxx_pc = 283; continue __cxx_cfg_loop;
    }
    case 285: {
      __cxx_pc = ((cPointerDiff(pIn_buf_end, pIn_buf_cur, Uint8Array.BYTES_PER_ELEMENT) < i64(2))) ? 281 : 284; continue __cxx_cfg_loop;
    }
    case 286: {
      __cxx_pc = ((num_bits < u32(15))) ? 285 : 260; continue __cxx_cfg_loop;
    }
    case 287: {
      __cxx_pc = 286; continue __cxx_cfg_loop;
    }
    case 288: {
      __cxx_pc = 287; continue __cxx_cfg_loop;
    }
    case 289: {
      __cxx_pc = 288; continue __cxx_cfg_loop;
    }
    case 290: {
      (counter = u32((Number(counter) + Number(extra_bits))));
      __cxx_pc = 289; continue __cxx_cfg_loop;
    }
    case 291: {
      __cxx_pc = (Boolean(0)) ? 306 : 290; continue __cxx_cfg_loop;
    }
    case 292: {
      (num_bits = u32((Number(num_bits) - Number(num_extra))));
      __cxx_pc = 291; continue __cxx_cfg_loop;
    }
    case 293: {
      (bit_buf = u64((BigInt(bit_buf) >> BigInt(num_extra))));
      __cxx_pc = 292; continue __cxx_cfg_loop;
    }
    case 294: {
      (extra_bits = u32((BigInt(bit_buf) & BigInt(u64(i32((i32((1 << num_extra)) - 1)))))));
      __cxx_pc = 293; continue __cxx_cfg_loop;
    }
    case 295: {
      __cxx_pc = ((num_bits < u32(num_extra))) ? 305 : 294; continue __cxx_cfg_loop;
    }
    case 296: {
      (num_bits = u32((Number(num_bits) + Number(u32(8)))));
      __cxx_pc = 295; continue __cxx_cfg_loop;
    }
    case 297: {
      (bit_buf = u64((BigInt(bit_buf) | BigInt((BigInt(u64(__cxx_cfg_local_53_c)) << BigInt(num_bits))))));
      __cxx_pc = 296; continue __cxx_cfg_loop;
    }
    case 298: {
      __cxx_pc = (Boolean(0)) ? 300 : 297; continue __cxx_cfg_loop;
    }
    case 299: {
      (__cxx_cfg_local_53_c = u32((cDeref(((__cxx_lvalue_44) => { const previous = __cxx_lvalue_44.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_44.value = next; return previous; })(cRef(() => pIn_buf_cur, __cxx_lvalue_45 => { pIn_buf_cur = __cxx_lvalue_45; })), Uint8Array).value)));
      __cxx_pc = 298; continue __cxx_cfg_loop;
    }
    case 300: {
      __cxx_pc = (cPointerCompare(pIn_buf_cur, pIn_buf_end, ">=")) ? 304 : 299; continue __cxx_cfg_loop;
    }
    case 301: {
      __cxx_pc = (Boolean(0)) ? 304 : 300; continue __cxx_cfg_loop;
    }
    case 302: {
      __cxx_pc = 41; continue __cxx_cfg_loop;
    }
    case 303: {
      (cRecordObject(r).m_state = u32(25));
      __cxx_pc = 302; continue __cxx_cfg_loop;
    }
    case 304: {
      (status = (Boolean(u32((decomp_flags & u32(2)))) ? 1 : -4));
      __cxx_pc = 303; continue __cxx_cfg_loop;
    }
    case 305: {
      __cxx_pc = 300; continue __cxx_cfg_loop;
    }
    case 306: {
      __cxx_pc = ((num_bits < u32(num_extra))) ? 305 : 294; continue __cxx_cfg_loop;
    }
    case 307: {
      __cxx_pc = 306; continue __cxx_cfg_loop;
    }
    case 308: {
      __cxx_pc = (Boolean(num_extra)) ? 307 : 289; continue __cxx_cfg_loop;
    }
    case 309: {
      (counter = u32((cDeref(cPointerOffset(__static_tinfl_decompress_s_length_base, u32((counter - u32(257))), Uint16Array.BYTES_PER_ELEMENT), Uint16Array).value)));
      __cxx_pc = 308; continue __cxx_cfg_loop;
    }
    case 310: {
      (num_extra = u32((cDeref(cPointerOffset(__static_tinfl_decompress_s_length_extra, u32((counter - u32(257))), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)));
      __cxx_pc = 309; continue __cxx_cfg_loop;
    }
    case 311: {
      __cxx_pc = 99; continue __cxx_cfg_loop;
    }
    case 312: {
      __cxx_pc = (((counter = u32((counter & u32(511)))) == u32(256))) ? 311 : 310; continue __cxx_cfg_loop;
    }
    case 313: {
      __cxx_pc = 391; continue __cxx_cfg_loop;
    }
    case 314: {
      __cxx_pc = 313; continue __cxx_cfg_loop;
    }
    case 315: {
      ((cDeref(((__cxx_lvalue_46) => { const previous = __cxx_lvalue_46.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_46.value = next; return previous; })(cRef(() => pOut_buf_cur, __cxx_lvalue_47 => { pOut_buf_cur = __cxx_lvalue_47; })), Uint8Array).value) = ((((((counter) & 255)) & 255)) & 255));
      __cxx_pc = 314; continue __cxx_cfg_loop;
    }
    case 316: {
      __cxx_pc = (cPointerCompare(pOut_buf_cur, pOut_buf_end, ">=")) ? 320 : 315; continue __cxx_cfg_loop;
    }
    case 317: {
      __cxx_pc = (Boolean(0)) ? 320 : 316; continue __cxx_cfg_loop;
    }
    case 318: {
      __cxx_pc = 41; continue __cxx_cfg_loop;
    }
    case 319: {
      (cRecordObject(r).m_state = u32(24));
      __cxx_pc = 318; continue __cxx_cfg_loop;
    }
    case 320: {
      (status = 2);
      __cxx_pc = 319; continue __cxx_cfg_loop;
    }
    case 321: {
      __cxx_pc = 312; continue __cxx_cfg_loop;
    }
    case 322: {
      __cxx_pc = ((counter >= u32(256))) ? 321 : 316; continue __cxx_cfg_loop;
    }
    case 323: {
      __cxx_pc = (Boolean(0)) ? 360 : 322; continue __cxx_cfg_loop;
    }
    case 324: {
      (num_bits = u32((Number(num_bits) - Number(__cxx_cfg_local_48_code_len))));
      __cxx_pc = 323; continue __cxx_cfg_loop;
    }
    case 325: {
      (bit_buf = u64((BigInt(bit_buf) >> BigInt(__cxx_cfg_local_48_code_len))));
      __cxx_pc = 324; continue __cxx_cfg_loop;
    }
    case 326: {
      (counter = u32(__cxx_cfg_local_47_temp));
      __cxx_pc = 325; continue __cxx_cfg_loop;
    }
    case 327: {
      ((__cxx_cfg_local_48_code_len = u32(i32((__cxx_cfg_local_47_temp >> 9)))), (__cxx_cfg_local_47_temp = i32((__cxx_cfg_local_47_temp & 511))));
      __cxx_pc = 326; continue __cxx_cfg_loop;
    }
    case 328: {
      __cxx_pc = ((__cxx_cfg_local_47_temp < 0)) ? 329 : 326; continue __cxx_cfg_loop;
    }
    case 329: {
      (__cxx_cfg_local_47_temp = i32((cDeref(cPointerOffset(cRecordObject(r).m_tree_0, (BigInt(u64((~__cxx_cfg_local_47_temp))) + BigInt((BigInt((BigInt(bit_buf) >> BigInt(((__cxx_lvalue_48) => { const previous = __cxx_lvalue_48.value; const next = u32((previous + 1)); __cxx_lvalue_48.value = next; return previous; })(cRef(() => __cxx_cfg_local_48_code_len, __cxx_lvalue_49 => { __cxx_cfg_local_48_code_len = __cxx_lvalue_49; }))))) & BigInt(u64(1))))), Int16Array.BYTES_PER_ELEMENT), Int16Array).value)));
      __cxx_pc = 328; continue __cxx_cfg_loop;
    }
    case 330: {
      (__cxx_cfg_local_48_code_len = u32(10));
      __cxx_pc = 329; continue __cxx_cfg_loop;
    }
    case 331: {
      __cxx_pc = (((__cxx_cfg_local_47_temp = i32((cPointerElementRef(cRecordObject(r).m_look_up, 0).value)[(BigInt(bit_buf) & BigInt(u64(i32((i32(1024) - 1)))))])) >= 0)) ? 327 : 330; continue __cxx_cfg_loop;
    }
    case 332: {
      __cxx_pc = ((num_bits < u32(15))) ? 352 : 331; continue __cxx_cfg_loop;
    }
    case 333: {
      (num_bits = u32((Number(num_bits) + Number(u32(8)))));
      __cxx_pc = 332; continue __cxx_cfg_loop;
    }
    case 334: {
      (bit_buf = u64((BigInt(bit_buf) | BigInt((BigInt(u64(__cxx_cfg_local_49_c)) << BigInt(num_bits))))));
      __cxx_pc = 333; continue __cxx_cfg_loop;
    }
    case 335: {
      __cxx_pc = (Boolean(0)) ? 337 : 334; continue __cxx_cfg_loop;
    }
    case 336: {
      (__cxx_cfg_local_49_c = u32((cDeref(((__cxx_lvalue_50) => { const previous = __cxx_lvalue_50.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_50.value = next; return previous; })(cRef(() => pIn_buf_cur, __cxx_lvalue_51 => { pIn_buf_cur = __cxx_lvalue_51; })), Uint8Array).value)));
      __cxx_pc = 335; continue __cxx_cfg_loop;
    }
    case 337: {
      __cxx_pc = (cPointerCompare(pIn_buf_cur, pIn_buf_end, ">=")) ? 341 : 336; continue __cxx_cfg_loop;
    }
    case 338: {
      __cxx_pc = (Boolean(0)) ? 341 : 337; continue __cxx_cfg_loop;
    }
    case 339: {
      __cxx_pc = 41; continue __cxx_cfg_loop;
    }
    case 340: {
      (cRecordObject(r).m_state = u32(23));
      __cxx_pc = 339; continue __cxx_cfg_loop;
    }
    case 341: {
      (status = (Boolean(u32((decomp_flags & u32(2)))) ? 1 : -4));
      __cxx_pc = 340; continue __cxx_cfg_loop;
    }
    case 342: {
      __cxx_pc = 331; continue __cxx_cfg_loop;
    }
    case 343: {
      __cxx_pc = ((Boolean(__cxx_cfg_local_48_code_len) && (num_bits >= __cxx_cfg_local_48_code_len))) ? 342 : 337; continue __cxx_cfg_loop;
    }
    case 344: {
      (__cxx_cfg_local_48_code_len = u32(i32((__cxx_cfg_local_47_temp >> 9))));
      __cxx_pc = 343; continue __cxx_cfg_loop;
    }
    case 345: {
      __cxx_pc = 331; continue __cxx_cfg_loop;
    }
    case 346: {
      __cxx_pc = ((__cxx_cfg_local_47_temp >= 0)) ? 345 : 337; continue __cxx_cfg_loop;
    }
    case 347: {
      __cxx_pc = (((__cxx_cfg_local_47_temp < 0) && (num_bits >= u32((__cxx_cfg_local_48_code_len + u32(1)))))) ? 348 : 346; continue __cxx_cfg_loop;
    }
    case 348: {
      (__cxx_cfg_local_47_temp = i32((cDeref(cPointerOffset(cRecordObject(r).m_tree_0, (BigInt(u64((~__cxx_cfg_local_47_temp))) + BigInt((BigInt((BigInt(bit_buf) >> BigInt(((__cxx_lvalue_52) => { const previous = __cxx_lvalue_52.value; const next = u32((previous + 1)); __cxx_lvalue_52.value = next; return previous; })(cRef(() => __cxx_cfg_local_48_code_len, __cxx_lvalue_53 => { __cxx_cfg_local_48_code_len = __cxx_lvalue_53; }))))) & BigInt(u64(1))))), Int16Array.BYTES_PER_ELEMENT), Int16Array).value)));
      __cxx_pc = 347; continue __cxx_cfg_loop;
    }
    case 349: {
      (__cxx_cfg_local_48_code_len = u32(10));
      __cxx_pc = 348; continue __cxx_cfg_loop;
    }
    case 350: {
      __cxx_pc = ((num_bits > u32(10))) ? 349 : 337; continue __cxx_cfg_loop;
    }
    case 351: {
      __cxx_pc = ((__cxx_cfg_local_47_temp >= 0)) ? 344 : 350; continue __cxx_cfg_loop;
    }
    case 352: {
      (__cxx_cfg_local_47_temp = i32((cPointerElementRef(cRecordObject(r).m_look_up, 0).value)[(BigInt(bit_buf) & BigInt(u64(i32((i32(1024) - 1)))))]));
      __cxx_pc = 351; continue __cxx_cfg_loop;
    }
    case 353: {
      (num_bits = u32((Number(num_bits) + Number(u32(16)))));
      __cxx_pc = 331; continue __cxx_cfg_loop;
    }
    case 354: {
      (pIn_buf_cur = cPointerOffset(pIn_buf_cur, 2, Uint8Array.BYTES_PER_ELEMENT));
      __cxx_pc = 353; continue __cxx_cfg_loop;
    }
    case 355: {
      (bit_buf = u64((BigInt(bit_buf) | BigInt((BigInt((BigInt(u64((cDeref(cPointerOffset(pIn_buf_cur, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value))) << BigInt(num_bits))) | BigInt((BigInt(u64((cDeref(cPointerOffset(pIn_buf_cur, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value))) << BigInt(u32((num_bits + u32(8)))))))))));
      __cxx_pc = 354; continue __cxx_cfg_loop;
    }
    case 356: {
      __cxx_pc = ((cPointerDiff(pIn_buf_end, pIn_buf_cur, Uint8Array.BYTES_PER_ELEMENT) < i64(2))) ? 352 : 355; continue __cxx_cfg_loop;
    }
    case 357: {
      __cxx_pc = ((num_bits < u32(15))) ? 356 : 331; continue __cxx_cfg_loop;
    }
    case 358: {
      __cxx_pc = 357; continue __cxx_cfg_loop;
    }
    case 359: {
      __cxx_pc = 358; continue __cxx_cfg_loop;
    }
    case 360: {
      __cxx_pc = 359; continue __cxx_cfg_loop;
    }
    case 361: {
      (pOut_buf_cur = cPointerOffset(pOut_buf_cur, 2, Uint8Array.BYTES_PER_ELEMENT));
      __cxx_pc = 314; continue __cxx_cfg_loop;
    }
    case 362: {
      ((cDeref(cPointerOffset(pOut_buf_cur, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = ((((((sym2) & 255)) & 255)) & 255));
      __cxx_pc = 361; continue __cxx_cfg_loop;
    }
    case 363: {
      __cxx_pc = 312; continue __cxx_cfg_loop;
    }
    case 364: {
      (counter = u32(sym2));
      __cxx_pc = 363; continue __cxx_cfg_loop;
    }
    case 365: {
      ((__cxx_lvalue_54) => { const previous = __cxx_lvalue_54.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_54.value = next; return previous; })(cRef(() => pOut_buf_cur, __cxx_lvalue_55 => { pOut_buf_cur = __cxx_lvalue_55; }));
      __cxx_pc = 364; continue __cxx_cfg_loop;
    }
    case 366: {
      __cxx_pc = (Boolean(i32((sym2 & 256)))) ? 365 : 362; continue __cxx_cfg_loop;
    }
    case 367: {
      ((cDeref(cPointerOffset(pOut_buf_cur, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = ((((((counter) & 255)) & 255)) & 255));
      __cxx_pc = 366; continue __cxx_cfg_loop;
    }
    case 368: {
      (num_bits = u32((Number(num_bits) - Number(__cxx_cfg_local_51_code_len))));
      __cxx_pc = 367; continue __cxx_cfg_loop;
    }
    case 369: {
      (bit_buf = u64((BigInt(bit_buf) >> BigInt(__cxx_cfg_local_51_code_len))));
      __cxx_pc = 368; continue __cxx_cfg_loop;
    }
    case 370: {
      (__cxx_cfg_local_51_code_len = u32(i32((sym2 >> 9))));
      __cxx_pc = 369; continue __cxx_cfg_loop;
    }
    case 371: {
      __cxx_pc = ((sym2 < 0)) ? 372 : 369; continue __cxx_cfg_loop;
    }
    case 372: {
      (sym2 = i32((cDeref(cPointerOffset(cRecordObject(r).m_tree_0, (BigInt(u64((~sym2))) + BigInt((BigInt((BigInt(bit_buf) >> BigInt(((__cxx_lvalue_56) => { const previous = __cxx_lvalue_56.value; const next = u32((previous + 1)); __cxx_lvalue_56.value = next; return previous; })(cRef(() => __cxx_cfg_local_51_code_len, __cxx_lvalue_57 => { __cxx_cfg_local_51_code_len = __cxx_lvalue_57; }))))) & BigInt(u64(1))))), Int16Array.BYTES_PER_ELEMENT), Int16Array).value)));
      __cxx_pc = 371; continue __cxx_cfg_loop;
    }
    case 373: {
      (__cxx_cfg_local_51_code_len = u32(10));
      __cxx_pc = 372; continue __cxx_cfg_loop;
    }
    case 374: {
      __cxx_pc = (((sym2 = i32((cPointerElementRef(cRecordObject(r).m_look_up, 0).value)[(BigInt(bit_buf) & BigInt(u64(i32((i32(1024) - 1)))))])) >= 0)) ? 370 : 373; continue __cxx_cfg_loop;
    }
    case 375: {
      __cxx_pc = 312; continue __cxx_cfg_loop;
    }
    case 376: {
      __cxx_pc = (Boolean(u32((counter & u32(256))))) ? 375 : 374; continue __cxx_cfg_loop;
    }
    case 377: {
      (num_bits = u32((Number(num_bits) - Number(__cxx_cfg_local_51_code_len))));
      __cxx_pc = 376; continue __cxx_cfg_loop;
    }
    case 378: {
      (bit_buf = u64((BigInt(bit_buf) >> BigInt(__cxx_cfg_local_51_code_len))));
      __cxx_pc = 377; continue __cxx_cfg_loop;
    }
    case 379: {
      (counter = u32(sym2));
      __cxx_pc = 378; continue __cxx_cfg_loop;
    }
    case 380: {
      (__cxx_cfg_local_51_code_len = u32(i32((sym2 >> 9))));
      __cxx_pc = 379; continue __cxx_cfg_loop;
    }
    case 381: {
      __cxx_pc = ((sym2 < 0)) ? 382 : 379; continue __cxx_cfg_loop;
    }
    case 382: {
      (sym2 = i32((cDeref(cPointerOffset(cRecordObject(r).m_tree_0, (BigInt(u64((~sym2))) + BigInt((BigInt((BigInt(bit_buf) >> BigInt(((__cxx_lvalue_58) => { const previous = __cxx_lvalue_58.value; const next = u32((previous + 1)); __cxx_lvalue_58.value = next; return previous; })(cRef(() => __cxx_cfg_local_51_code_len, __cxx_lvalue_59 => { __cxx_cfg_local_51_code_len = __cxx_lvalue_59; }))))) & BigInt(u64(1))))), Int16Array.BYTES_PER_ELEMENT), Int16Array).value)));
      __cxx_pc = 381; continue __cxx_cfg_loop;
    }
    case 383: {
      (__cxx_cfg_local_51_code_len = u32(10));
      __cxx_pc = 382; continue __cxx_cfg_loop;
    }
    case 384: {
      __cxx_pc = (((sym2 = i32((cPointerElementRef(cRecordObject(r).m_look_up, 0).value)[(BigInt(bit_buf) & BigInt(u64(i32((i32(1024) - 1)))))])) >= 0)) ? 380 : 383; continue __cxx_cfg_loop;
    }
    case 385: {
      (num_bits = u32((Number(num_bits) + Number(u32(32)))));
      __cxx_pc = 384; continue __cxx_cfg_loop;
    }
    case 386: {
      (pIn_buf_cur = cPointerOffset(pIn_buf_cur, 4, Uint8Array.BYTES_PER_ELEMENT));
      __cxx_pc = 385; continue __cxx_cfg_loop;
    }
    case 387: {
      (bit_buf = u64((BigInt(bit_buf) | BigInt((BigInt(u64(u32((u32((u32((u32((cDeref(cPointerOffset(cTypedPointer(pIn_buf_cur, Uint8Array), 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) | u32((u32((cDeref(cPointerOffset(cTypedPointer(pIn_buf_cur, Uint8Array), 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) << 8)))) | u32((u32((cDeref(cPointerOffset(cTypedPointer(pIn_buf_cur, Uint8Array), 2, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) << 16)))) | u32((u32((cDeref(cPointerOffset(cTypedPointer(pIn_buf_cur, Uint8Array), 3, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) << 24)))))) << BigInt(num_bits))))));
      __cxx_pc = 386; continue __cxx_cfg_loop;
    }
    case 388: {
      __cxx_pc = ((num_bits < u32(30))) ? 387 : 384; continue __cxx_cfg_loop;
    }
    case 389: {
      __cxx_pc = 388; continue __cxx_cfg_loop;
    }
    case 390: {
      __cxx_pc = 389; continue __cxx_cfg_loop;
    }
    case 391: {
      __cxx_pc = (((cPointerDiff(pIn_buf_end, pIn_buf_cur, Uint8Array.BYTES_PER_ELEMENT) < i64(4)) || (cPointerDiff(pOut_buf_end, pOut_buf_cur, Uint8Array.BYTES_PER_ELEMENT) < i64(2)))) ? 360 : 390; continue __cxx_cfg_loop;
    }
    case 392: {
      __cxx_pc = 313; continue __cxx_cfg_loop;
    }
    case 393: {
      __cxx_pc = ((i32(cRecordObject(r).m_type) >= 0)) ? 551 : 198; continue __cxx_cfg_loop;
    }
    case 394: {
      ((__cxx_lvalue_60) => { const previous = __cxx_lvalue_60.value; const next = u32((previous - 1)); __cxx_lvalue_60.value = next; return previous; })(cObjectFieldRef(cRecordObject(r), "m_type"));
      __cxx_pc = 393; continue __cxx_cfg_loop;
    }
    case 395: {
      cByteMemory.memcpy(cRecordObject(r).m_code_size_1, cPointerOffset(cRecordObject(r).m_len_codes, (cDeref(cPointerOffset(cRecordObject(r).m_table_sizes, 0, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value), Uint8Array.BYTES_PER_ELEMENT), u64((cDeref(cPointerOffset(cRecordObject(r).m_table_sizes, 1, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value)));
      __cxx_pc = 394; continue __cxx_cfg_loop;
    }
    case 396: {
      cByteMemory.memcpy(cRecordObject(r).m_code_size_0, cRecordObject(r).m_len_codes, u64((cDeref(cPointerOffset(cRecordObject(r).m_table_sizes, 0, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value)));
      __cxx_pc = 395; continue __cxx_cfg_loop;
    }
    case 397: {
      __cxx_pc = (Boolean(0)) ? 398 : 396; continue __cxx_cfg_loop;
    }
    case 398: {
      __cxx_pc = 403; continue __cxx_cfg_loop;
    }
    case 399: {
      __cxx_pc = 398; continue __cxx_cfg_loop;
    }
    case 400: {
      __cxx_pc = (Boolean(0)) ? 403 : 399; continue __cxx_cfg_loop;
    }
    case 401: {
      __cxx_pc = 41; continue __cxx_cfg_loop;
    }
    case 402: {
      (cRecordObject(r).m_state = u32(21));
      __cxx_pc = 401; continue __cxx_cfg_loop;
    }
    case 403: {
      (status = -1);
      __cxx_pc = 402; continue __cxx_cfg_loop;
    }
    case 404: {
      __cxx_pc = ((u32(((cDeref(cPointerOffset(cRecordObject(r).m_table_sizes, 0, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value) + (cDeref(cPointerOffset(cRecordObject(r).m_table_sizes, 1, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value))) != counter)) ? 398 : 396; continue __cxx_cfg_loop;
    }
    case 405: {
      __cxx_pc = ((counter < u32(((cDeref(cPointerOffset(cRecordObject(r).m_table_sizes, 0, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value) + (cDeref(cPointerOffset(cRecordObject(r).m_table_sizes, 1, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value))))) ? 476 : 404; continue __cxx_cfg_loop;
    }
    case 406: {
      __cxx_pc = 405; continue __cxx_cfg_loop;
    }
    case 407: {
      (counter = u32((Number(counter) + Number(__cxx_cfg_local_41_s))));
      __cxx_pc = 406; continue __cxx_cfg_loop;
    }
    case 408: {
      cByteMemory.memset(cPointerOffset(cRecordObject(r).m_len_codes, counter, Uint8Array.BYTES_PER_ELEMENT), ((dist == u32(16)) ? i32((cDeref(cPointerOffset(cRecordObject(r).m_len_codes, u32((counter - u32(1))), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) : 0), u64(__cxx_cfg_local_41_s));
      __cxx_pc = 407; continue __cxx_cfg_loop;
    }
    case 409: {
      (__cxx_cfg_local_41_s = u32((Number(__cxx_cfg_local_41_s) + Number(u32((cDeref(cPointerOffset(__cxx_literal_6139dfcb116987cb1da2, u32((dist - u32(16))), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value))))));
      __cxx_pc = 408; continue __cxx_cfg_loop;
    }
    case 410: {
      __cxx_pc = (Boolean(0)) ? 425 : 409; continue __cxx_cfg_loop;
    }
    case 411: {
      (num_bits = u32((Number(num_bits) - Number(num_extra))));
      __cxx_pc = 410; continue __cxx_cfg_loop;
    }
    case 412: {
      (bit_buf = u64((BigInt(bit_buf) >> BigInt(num_extra))));
      __cxx_pc = 411; continue __cxx_cfg_loop;
    }
    case 413: {
      (__cxx_cfg_local_41_s = u32((BigInt(bit_buf) & BigInt(u64(i32((i32((1 << num_extra)) - 1)))))));
      __cxx_pc = 412; continue __cxx_cfg_loop;
    }
    case 414: {
      __cxx_pc = ((num_bits < u32(num_extra))) ? 424 : 413; continue __cxx_cfg_loop;
    }
    case 415: {
      (num_bits = u32((Number(num_bits) + Number(u32(8)))));
      __cxx_pc = 414; continue __cxx_cfg_loop;
    }
    case 416: {
      (bit_buf = u64((BigInt(bit_buf) | BigInt((BigInt(u64(__cxx_cfg_local_45_c)) << BigInt(num_bits))))));
      __cxx_pc = 415; continue __cxx_cfg_loop;
    }
    case 417: {
      __cxx_pc = (Boolean(0)) ? 419 : 416; continue __cxx_cfg_loop;
    }
    case 418: {
      (__cxx_cfg_local_45_c = u32((cDeref(((__cxx_lvalue_61) => { const previous = __cxx_lvalue_61.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_61.value = next; return previous; })(cRef(() => pIn_buf_cur, __cxx_lvalue_62 => { pIn_buf_cur = __cxx_lvalue_62; })), Uint8Array).value)));
      __cxx_pc = 417; continue __cxx_cfg_loop;
    }
    case 419: {
      __cxx_pc = (cPointerCompare(pIn_buf_cur, pIn_buf_end, ">=")) ? 423 : 418; continue __cxx_cfg_loop;
    }
    case 420: {
      __cxx_pc = (Boolean(0)) ? 423 : 419; continue __cxx_cfg_loop;
    }
    case 421: {
      __cxx_pc = 41; continue __cxx_cfg_loop;
    }
    case 422: {
      (cRecordObject(r).m_state = u32(18));
      __cxx_pc = 421; continue __cxx_cfg_loop;
    }
    case 423: {
      (status = (Boolean(u32((decomp_flags & u32(2)))) ? 1 : -4));
      __cxx_pc = 422; continue __cxx_cfg_loop;
    }
    case 424: {
      __cxx_pc = 419; continue __cxx_cfg_loop;
    }
    case 425: {
      __cxx_pc = ((num_bits < u32(num_extra))) ? 424 : 413; continue __cxx_cfg_loop;
    }
    case 426: {
      (num_extra = u32((cDeref(cPointerOffset(__cxx_literal_1d26741add071fc6c539, u32((dist - u32(16))), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)));
      __cxx_pc = 425; continue __cxx_cfg_loop;
    }
    case 427: {
      __cxx_pc = (Boolean(0)) ? 428 : 426; continue __cxx_cfg_loop;
    }
    case 428: {
      __cxx_pc = 433; continue __cxx_cfg_loop;
    }
    case 429: {
      __cxx_pc = 428; continue __cxx_cfg_loop;
    }
    case 430: {
      __cxx_pc = (Boolean(0)) ? 433 : 429; continue __cxx_cfg_loop;
    }
    case 431: {
      __cxx_pc = 41; continue __cxx_cfg_loop;
    }
    case 432: {
      (cRecordObject(r).m_state = u32(17));
      __cxx_pc = 431; continue __cxx_cfg_loop;
    }
    case 433: {
      (status = -1);
      __cxx_pc = 432; continue __cxx_cfg_loop;
    }
    case 434: {
      __cxx_pc = (((dist == u32(16)) && (!Boolean(counter)))) ? 428 : 426; continue __cxx_cfg_loop;
    }
    case 435: {
      __cxx_pc = 406; continue __cxx_cfg_loop;
    }
    case 436: {
      ((cDeref(cPointerOffset(cRecordObject(r).m_len_codes, ((__cxx_lvalue_63) => { const previous = __cxx_lvalue_63.value; const next = u32((previous + 1)); __cxx_lvalue_63.value = next; return previous; })(cRef(() => counter, __cxx_lvalue_64 => { counter = __cxx_lvalue_64; })), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = ((((((dist) & 255)) & 255)) & 255));
      __cxx_pc = 435; continue __cxx_cfg_loop;
    }
    case 437: {
      __cxx_pc = ((dist < u32(16))) ? 436 : 434; continue __cxx_cfg_loop;
    }
    case 438: {
      __cxx_pc = (Boolean(0)) ? 475 : 437; continue __cxx_cfg_loop;
    }
    case 439: {
      (num_bits = u32((Number(num_bits) - Number(code_len))));
      __cxx_pc = 438; continue __cxx_cfg_loop;
    }
    case 440: {
      (bit_buf = u64((BigInt(bit_buf) >> BigInt(code_len))));
      __cxx_pc = 439; continue __cxx_cfg_loop;
    }
    case 441: {
      (dist = u32(temp));
      __cxx_pc = 440; continue __cxx_cfg_loop;
    }
    case 442: {
      ((code_len = u32(i32((temp >> 9)))), (temp = i32((temp & 511))));
      __cxx_pc = 441; continue __cxx_cfg_loop;
    }
    case 443: {
      __cxx_pc = ((temp < 0)) ? 444 : 441; continue __cxx_cfg_loop;
    }
    case 444: {
      (temp = i32((cDeref(cPointerOffset(cRecordObject(r).m_tree_2, (BigInt(u64((~temp))) + BigInt((BigInt((BigInt(bit_buf) >> BigInt(((__cxx_lvalue_65) => { const previous = __cxx_lvalue_65.value; const next = u32((previous + 1)); __cxx_lvalue_65.value = next; return previous; })(cRef(() => code_len, __cxx_lvalue_66 => { code_len = __cxx_lvalue_66; }))))) & BigInt(u64(1))))), Int16Array.BYTES_PER_ELEMENT), Int16Array).value)));
      __cxx_pc = 443; continue __cxx_cfg_loop;
    }
    case 445: {
      (code_len = u32(10));
      __cxx_pc = 444; continue __cxx_cfg_loop;
    }
    case 446: {
      __cxx_pc = (((temp = i32((cPointerElementRef(cRecordObject(r).m_look_up, 2).value)[(BigInt(bit_buf) & BigInt(u64(i32((i32(1024) - 1)))))])) >= 0)) ? 442 : 445; continue __cxx_cfg_loop;
    }
    case 447: {
      __cxx_pc = ((num_bits < u32(15))) ? 467 : 446; continue __cxx_cfg_loop;
    }
    case 448: {
      (num_bits = u32((Number(num_bits) + Number(u32(8)))));
      __cxx_pc = 447; continue __cxx_cfg_loop;
    }
    case 449: {
      (bit_buf = u64((BigInt(bit_buf) | BigInt((BigInt(u64(__cxx_cfg_local_44_c)) << BigInt(num_bits))))));
      __cxx_pc = 448; continue __cxx_cfg_loop;
    }
    case 450: {
      __cxx_pc = (Boolean(0)) ? 452 : 449; continue __cxx_cfg_loop;
    }
    case 451: {
      (__cxx_cfg_local_44_c = u32((cDeref(((__cxx_lvalue_67) => { const previous = __cxx_lvalue_67.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_67.value = next; return previous; })(cRef(() => pIn_buf_cur, __cxx_lvalue_68 => { pIn_buf_cur = __cxx_lvalue_68; })), Uint8Array).value)));
      __cxx_pc = 450; continue __cxx_cfg_loop;
    }
    case 452: {
      __cxx_pc = (cPointerCompare(pIn_buf_cur, pIn_buf_end, ">=")) ? 456 : 451; continue __cxx_cfg_loop;
    }
    case 453: {
      __cxx_pc = (Boolean(0)) ? 456 : 452; continue __cxx_cfg_loop;
    }
    case 454: {
      __cxx_pc = 41; continue __cxx_cfg_loop;
    }
    case 455: {
      (cRecordObject(r).m_state = u32(16));
      __cxx_pc = 454; continue __cxx_cfg_loop;
    }
    case 456: {
      (status = (Boolean(u32((decomp_flags & u32(2)))) ? 1 : -4));
      __cxx_pc = 455; continue __cxx_cfg_loop;
    }
    case 457: {
      __cxx_pc = 446; continue __cxx_cfg_loop;
    }
    case 458: {
      __cxx_pc = ((Boolean(code_len) && (num_bits >= code_len))) ? 457 : 452; continue __cxx_cfg_loop;
    }
    case 459: {
      (code_len = u32(i32((temp >> 9))));
      __cxx_pc = 458; continue __cxx_cfg_loop;
    }
    case 460: {
      __cxx_pc = 446; continue __cxx_cfg_loop;
    }
    case 461: {
      __cxx_pc = ((temp >= 0)) ? 460 : 452; continue __cxx_cfg_loop;
    }
    case 462: {
      __cxx_pc = (((temp < 0) && (num_bits >= u32((code_len + u32(1)))))) ? 463 : 461; continue __cxx_cfg_loop;
    }
    case 463: {
      (temp = i32((cDeref(cPointerOffset(cRecordObject(r).m_tree_2, (BigInt(u64((~temp))) + BigInt((BigInt((BigInt(bit_buf) >> BigInt(((__cxx_lvalue_69) => { const previous = __cxx_lvalue_69.value; const next = u32((previous + 1)); __cxx_lvalue_69.value = next; return previous; })(cRef(() => code_len, __cxx_lvalue_70 => { code_len = __cxx_lvalue_70; }))))) & BigInt(u64(1))))), Int16Array.BYTES_PER_ELEMENT), Int16Array).value)));
      __cxx_pc = 462; continue __cxx_cfg_loop;
    }
    case 464: {
      (code_len = u32(10));
      __cxx_pc = 463; continue __cxx_cfg_loop;
    }
    case 465: {
      __cxx_pc = ((num_bits > u32(10))) ? 464 : 452; continue __cxx_cfg_loop;
    }
    case 466: {
      __cxx_pc = ((temp >= 0)) ? 459 : 465; continue __cxx_cfg_loop;
    }
    case 467: {
      (temp = i32((cPointerElementRef(cRecordObject(r).m_look_up, 2).value)[(BigInt(bit_buf) & BigInt(u64(i32((i32(1024) - 1)))))]));
      __cxx_pc = 466; continue __cxx_cfg_loop;
    }
    case 468: {
      (num_bits = u32((Number(num_bits) + Number(u32(16)))));
      __cxx_pc = 446; continue __cxx_cfg_loop;
    }
    case 469: {
      (pIn_buf_cur = cPointerOffset(pIn_buf_cur, 2, Uint8Array.BYTES_PER_ELEMENT));
      __cxx_pc = 468; continue __cxx_cfg_loop;
    }
    case 470: {
      (bit_buf = u64((BigInt(bit_buf) | BigInt((BigInt((BigInt(u64((cDeref(cPointerOffset(pIn_buf_cur, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value))) << BigInt(num_bits))) | BigInt((BigInt(u64((cDeref(cPointerOffset(pIn_buf_cur, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value))) << BigInt(u32((num_bits + u32(8)))))))))));
      __cxx_pc = 469; continue __cxx_cfg_loop;
    }
    case 471: {
      __cxx_pc = ((cPointerDiff(pIn_buf_end, pIn_buf_cur, Uint8Array.BYTES_PER_ELEMENT) < i64(2))) ? 467 : 470; continue __cxx_cfg_loop;
    }
    case 472: {
      __cxx_pc = ((num_bits < u32(15))) ? 471 : 446; continue __cxx_cfg_loop;
    }
    case 473: {
      __cxx_pc = 472; continue __cxx_cfg_loop;
    }
    case 474: {
      __cxx_pc = 473; continue __cxx_cfg_loop;
    }
    case 475: {
      __cxx_pc = 474; continue __cxx_cfg_loop;
    }
    case 476: {
      __cxx_pc = 475; continue __cxx_cfg_loop;
    }
    case 477: {
      (counter = u32(0));
      __cxx_pc = 405; continue __cxx_cfg_loop;
    }
    case 478: {
      __cxx_pc = ((cRecordObject(r).m_type == u32(2))) ? 477 : 394; continue __cxx_cfg_loop;
    }
    case 479: {
      __cxx_pc = ((sym_index < (cDeref(cPointerOffset(cRecordObject(r).m_table_sizes, cRecordObject(r).m_type, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value))) ? 513 : 478; continue __cxx_cfg_loop;
    }
    case 480: {
      ((__cxx_lvalue_71) => { const previous = __cxx_lvalue_71.value; const next = u32((previous + 1)); __cxx_lvalue_71.value = next; return next; })(cRef(() => sym_index, __cxx_lvalue_72 => { sym_index = __cxx_lvalue_72; }));
      __cxx_pc = 479; continue __cxx_cfg_loop;
    }
    case 481: {
      ((cDeref(cPointerOffset(pTree, i32(((-tree_cur) - 1)), Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = (((((((((sym_index) << 16) >> 16)) << 16) >> 16)) << 16) >> 16));
      __cxx_pc = 480; continue __cxx_cfg_loop;
    }
    case 482: {
      (tree_cur = i32((Number(tree_cur) - Number(u32(((rev_code = u32((rev_code >> 1))) & u32(1)))))));
      __cxx_pc = 481; continue __cxx_cfg_loop;
    }
    case 483: {
      __cxx_pc = ((j > u32(i32((i32(10) + 1))))) ? 490 : 482; continue __cxx_cfg_loop;
    }
    case 484: {
      ((__cxx_lvalue_73) => { const previous = __cxx_lvalue_73.value; const next = u32((previous - 1)); __cxx_lvalue_73.value = next; return previous; })(cRef(() => j, __cxx_lvalue_74 => { j = __cxx_lvalue_74; }));
      __cxx_pc = 483; continue __cxx_cfg_loop;
    }
    case 485: {
      (tree_next = i32((Number(tree_next) - Number(2))));
      __cxx_pc = 484; continue __cxx_cfg_loop;
    }
    case 486: {
      (tree_cur = i32(tree_next));
      __cxx_pc = 485; continue __cxx_cfg_loop;
    }
    case 487: {
      ((cDeref(cPointerOffset(pTree, i32(((-tree_cur) - 1)), Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = (((((((((tree_next) << 16) >> 16)) << 16) >> 16)) << 16) >> 16));
      __cxx_pc = 486; continue __cxx_cfg_loop;
    }
    case 488: {
      (tree_cur = i32((cDeref(cPointerOffset(pTree, i32(((-tree_cur) - 1)), Int16Array.BYTES_PER_ELEMENT), Int16Array).value)));
      __cxx_pc = 484; continue __cxx_cfg_loop;
    }
    case 489: {
      __cxx_pc = ((!Boolean((cDeref(cPointerOffset(pTree, i32(((-tree_cur) - 1)), Int16Array.BYTES_PER_ELEMENT), Int16Array).value)))) ? 487 : 488; continue __cxx_cfg_loop;
    }
    case 490: {
      (tree_cur = i32((Number(tree_cur) - Number(u32(((rev_code = u32((rev_code >> 1))) & u32(1)))))));
      __cxx_pc = 489; continue __cxx_cfg_loop;
    }
    case 491: {
      (j = u32(code_size));
      __cxx_pc = 483; continue __cxx_cfg_loop;
    }
    case 492: {
      (rev_code = u32((rev_code >> i32((i32(10) - 1)))));
      __cxx_pc = 491; continue __cxx_cfg_loop;
    }
    case 493: {
      (tree_next = i32((Number(tree_next) - Number(2))));
      __cxx_pc = 492; continue __cxx_cfg_loop;
    }
    case 494: {
      (tree_cur = i32(tree_next));
      __cxx_pc = 493; continue __cxx_cfg_loop;
    }
    case 495: {
      ((cDeref(cPointerOffset(pLookUp, u32((rev_code & u32(i32((i32(1024) - 1))))), Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = (((((((((tree_next) << 16) >> 16)) << 16) >> 16)) << 16) >> 16));
      __cxx_pc = 494; continue __cxx_cfg_loop;
    }
    case 496: {
      __cxx_pc = ((0 == (tree_cur = i32((cDeref(cPointerOffset(pLookUp, u32((rev_code & u32(i32((i32(1024) - 1))))), Int16Array.BYTES_PER_ELEMENT), Int16Array).value))))) ? 495 : 492; continue __cxx_cfg_loop;
    }
    case 497: {
      __cxx_pc = 480; continue __cxx_cfg_loop;
    }
    case 498: {
      __cxx_pc = ((rev_code < u32(1024))) ? 500 : 497; continue __cxx_cfg_loop;
    }
    case 499: {
      (rev_code = u32((Number(rev_code) + Number(u32(i32((1 << code_size)))))));
      __cxx_pc = 498; continue __cxx_cfg_loop;
    }
    case 500: {
      ((cDeref(cPointerOffset(pLookUp, rev_code, Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = (((k) << 16) >> 16));
      __cxx_pc = 499; continue __cxx_cfg_loop;
    }
    case 501: {
      k = (((((((((u32((u32((code_size << 9)) | sym_index))) << 16) >> 16)) << 16) >> 16)) << 16) >> 16);
      __cxx_pc = 498; continue __cxx_cfg_loop;
    }
    case 502: {
      __cxx_pc = ((code_size <= u32(10))) ? 501 : 496; continue __cxx_cfg_loop;
    }
    case 503: {
      __cxx_pc = ((l > u32(0))) ? 505 : 502; continue __cxx_cfg_loop;
    }
    case 504: {
      (((__cxx_lvalue_75) => { const previous = __cxx_lvalue_75.value; const next = u32((previous - 1)); __cxx_lvalue_75.value = next; return previous; })(cRef(() => l, __cxx_lvalue_76 => { l = __cxx_lvalue_76; })), (cur_code = u32((cur_code >> 1))));
      __cxx_pc = 503; continue __cxx_cfg_loop;
    }
    case 505: {
      (rev_code = u32((u32((rev_code << 1)) | u32((cur_code & u32(1))))));
      __cxx_pc = 504; continue __cxx_cfg_loop;
    }
    case 506: {
      (l = u32(code_size));
      __cxx_pc = 503; continue __cxx_cfg_loop;
    }
    case 507: {
      (cur_code = u32(((__cxx_lvalue_77) => { const previous = __cxx_lvalue_77.value; const next = u32((previous + 1)); __cxx_lvalue_77.value = next; return previous; })(cDeref(cPointerOffset(next_code, code_size, Uint32Array.BYTES_PER_ELEMENT), Uint32Array))));
      __cxx_pc = 506; continue __cxx_cfg_loop;
    }
    case 508: {
      __cxx_pc = 480; continue __cxx_cfg_loop;
    }
    case 509: {
      __cxx_pc = ((!Boolean(code_size))) ? 508 : 507; continue __cxx_cfg_loop;
    }
    case 510: {
      code_size = u32((cDeref(cPointerOffset(pCode_size, sym_index, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value));
      __cxx_pc = 509; continue __cxx_cfg_loop;
    }
    case 511: {
      __cxx_pc = 510; continue __cxx_cfg_loop;
    }
    case 512: {
      __cxx_pc = 511; continue __cxx_cfg_loop;
    }
    case 513: {
      rev_code = u32(0);
      __cxx_pc = 512; continue __cxx_cfg_loop;
    }
    case 514: {
      ((tree_next = i32((-1))), (sym_index = u32(0)));
      __cxx_pc = 479; continue __cxx_cfg_loop;
    }
    case 515: {
      __cxx_pc = (Boolean(0)) ? 516 : 514; continue __cxx_cfg_loop;
    }
    case 516: {
      __cxx_pc = 521; continue __cxx_cfg_loop;
    }
    case 517: {
      __cxx_pc = 516; continue __cxx_cfg_loop;
    }
    case 518: {
      __cxx_pc = (Boolean(0)) ? 521 : 517; continue __cxx_cfg_loop;
    }
    case 519: {
      __cxx_pc = 41; continue __cxx_cfg_loop;
    }
    case 520: {
      (cRecordObject(r).m_state = u32(35));
      __cxx_pc = 519; continue __cxx_cfg_loop;
    }
    case 521: {
      (status = -1);
      __cxx_pc = 520; continue __cxx_cfg_loop;
    }
    case 522: {
      __cxx_pc = (((u32(65536) != total) && (used_syms > u32(1)))) ? 516 : 514; continue __cxx_cfg_loop;
    }
    case 523: {
      __cxx_pc = ((__cxx_cfg_local_29_i <= u32(15))) ? 526 : 522; continue __cxx_cfg_loop;
    }
    case 524: {
      ((__cxx_lvalue_78) => { const previous = __cxx_lvalue_78.value; const next = u32((previous + 1)); __cxx_lvalue_78.value = next; return next; })(cRef(() => __cxx_cfg_local_29_i, __cxx_lvalue_79 => { __cxx_cfg_local_29_i = __cxx_lvalue_79; }));
      __cxx_pc = 523; continue __cxx_cfg_loop;
    }
    case 525: {
      ((cDeref(cPointerOffset(next_code, u32((__cxx_cfg_local_29_i + u32(1))), Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value) = u32((total = u32((u32((total + (cDeref(cPointerOffset(total_syms, __cxx_cfg_local_29_i, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value))) << 1)))));
      __cxx_pc = 524; continue __cxx_cfg_loop;
    }
    case 526: {
      (used_syms = u32((Number(used_syms) + Number((cDeref(cPointerOffset(total_syms, __cxx_cfg_local_29_i, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value)))));
      __cxx_pc = 525; continue __cxx_cfg_loop;
    }
    case 527: {
      (__cxx_cfg_local_29_i = u32(1));
      __cxx_pc = 523; continue __cxx_cfg_loop;
    }
    case 528: {
      ((cDeref(cPointerOffset(next_code, 0, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value) = u32(((cDeref(cPointerOffset(next_code, 1, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value) = u32(0))));
      __cxx_pc = 527; continue __cxx_cfg_loop;
    }
    case 529: {
      ((used_syms = u32(0)), (total = u32(0)));
      __cxx_pc = 528; continue __cxx_cfg_loop;
    }
    case 530: {
      __cxx_pc = ((__cxx_cfg_local_29_i < (cDeref(cPointerOffset(cRecordObject(r).m_table_sizes, cRecordObject(r).m_type, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value))) ? 532 : 529; continue __cxx_cfg_loop;
    }
    case 531: {
      ((__cxx_lvalue_80) => { const previous = __cxx_lvalue_80.value; const next = u32((previous + 1)); __cxx_lvalue_80.value = next; return next; })(cRef(() => __cxx_cfg_local_29_i, __cxx_lvalue_81 => { __cxx_cfg_local_29_i = __cxx_lvalue_81; }));
      __cxx_pc = 530; continue __cxx_cfg_loop;
    }
    case 532: {
      ((__cxx_lvalue_82) => { const previous = __cxx_lvalue_82.value; const next = u32((previous + 1)); __cxx_lvalue_82.value = next; return previous; })(cDeref(cPointerOffset(total_syms, (cDeref(cPointerOffset(pCode_size, __cxx_cfg_local_29_i, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value), Uint32Array.BYTES_PER_ELEMENT), Uint32Array));
      __cxx_pc = 531; continue __cxx_cfg_loop;
    }
    case 533: {
      (__cxx_cfg_local_29_i = u32(0));
      __cxx_pc = 530; continue __cxx_cfg_loop;
    }
    case 534: {
      tinfl_clear_tree(r);
      __cxx_pc = 533; continue __cxx_cfg_loop;
    }
    case 535: {
      cByteMemory.memset(pLookUp, 0, 2048);
      __cxx_pc = 534; continue __cxx_cfg_loop;
    }
    case 536: {
      cByteMemory.memset(total_syms, 0, 64);
      __cxx_pc = 535; continue __cxx_cfg_loop;
    }
    case 537: {
      (pCode_size = (cPointerElementRef(pCode_sizes, cRecordObject(r).m_type).value));
      __cxx_pc = 536; continue __cxx_cfg_loop;
    }
    case 538: {
      (pTree = (cPointerElementRef(pTrees, cRecordObject(r).m_type).value));
      __cxx_pc = 537; continue __cxx_cfg_loop;
    }
    case 539: {
      (pLookUp = (cPointerElementRef(cRecordObject(r).m_look_up, cRecordObject(r).m_type).value));
      __cxx_pc = 538; continue __cxx_cfg_loop;
    }
    case 540: {
      total_syms = cZeroAggregate({"array": "Uint32Array", "dims": [16]});
      __cxx_pc = 539; continue __cxx_cfg_loop;
    }
    case 541: {
      next_code = cZeroAggregate({"array": "Uint32Array", "dims": [17]});
      __cxx_pc = 540; continue __cxx_cfg_loop;
    }
    case 542: {
      __cxx_pc = 541; continue __cxx_cfg_loop;
    }
    case 543: {
      __cxx_pc = 542; continue __cxx_cfg_loop;
    }
    case 544: {
      __cxx_pc = 543; continue __cxx_cfg_loop;
    }
    case 545: {
      __cxx_pc = 544; continue __cxx_cfg_loop;
    }
    case 546: {
      __cxx_pc = 545; continue __cxx_cfg_loop;
    }
    case 547: {
      __cxx_pc = 546; continue __cxx_cfg_loop;
    }
    case 548: {
      __cxx_pc = 547; continue __cxx_cfg_loop;
    }
    case 549: {
      __cxx_pc = 548; continue __cxx_cfg_loop;
    }
    case 550: {
      __cxx_pc = 549; continue __cxx_cfg_loop;
    }
    case 551: {
      __cxx_pc = 550; continue __cxx_cfg_loop;
    }
    case 552: {
      __cxx_pc = ((i <= u32(287))) ? 554 : 393; continue __cxx_cfg_loop;
    }
    case 553: {
      ((__cxx_lvalue_83) => { const previous = __cxx_lvalue_83.value; const next = u32((previous + 1)); __cxx_lvalue_83.value = next; return next; })(cRef(() => i, __cxx_lvalue_84 => { i = __cxx_lvalue_84; }));
      __cxx_pc = 552; continue __cxx_cfg_loop;
    }
    case 554: {
      ((cDeref(((__cxx_lvalue_85) => { const previous = __cxx_lvalue_85.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_85.value = next; return previous; })(cRef(() => p, __cxx_lvalue_86 => { p = __cxx_lvalue_86; })), Uint8Array).value) = ((((8) & 255)) & 255));
      __cxx_pc = 553; continue __cxx_cfg_loop;
    }
    case 555: {
      __cxx_pc = ((i <= u32(279))) ? 557 : 552; continue __cxx_cfg_loop;
    }
    case 556: {
      ((__cxx_lvalue_87) => { const previous = __cxx_lvalue_87.value; const next = u32((previous + 1)); __cxx_lvalue_87.value = next; return next; })(cRef(() => i, __cxx_lvalue_88 => { i = __cxx_lvalue_88; }));
      __cxx_pc = 555; continue __cxx_cfg_loop;
    }
    case 557: {
      ((cDeref(((__cxx_lvalue_89) => { const previous = __cxx_lvalue_89.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_89.value = next; return previous; })(cRef(() => p, __cxx_lvalue_90 => { p = __cxx_lvalue_90; })), Uint8Array).value) = ((((7) & 255)) & 255));
      __cxx_pc = 556; continue __cxx_cfg_loop;
    }
    case 558: {
      __cxx_pc = ((i <= u32(255))) ? 560 : 555; continue __cxx_cfg_loop;
    }
    case 559: {
      ((__cxx_lvalue_91) => { const previous = __cxx_lvalue_91.value; const next = u32((previous + 1)); __cxx_lvalue_91.value = next; return next; })(cRef(() => i, __cxx_lvalue_92 => { i = __cxx_lvalue_92; }));
      __cxx_pc = 558; continue __cxx_cfg_loop;
    }
    case 560: {
      ((cDeref(((__cxx_lvalue_93) => { const previous = __cxx_lvalue_93.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_93.value = next; return previous; })(cRef(() => p, __cxx_lvalue_94 => { p = __cxx_lvalue_94; })), Uint8Array).value) = ((((9) & 255)) & 255));
      __cxx_pc = 559; continue __cxx_cfg_loop;
    }
    case 561: {
      __cxx_pc = ((i <= u32(143))) ? 563 : 558; continue __cxx_cfg_loop;
    }
    case 562: {
      ((__cxx_lvalue_95) => { const previous = __cxx_lvalue_95.value; const next = u32((previous + 1)); __cxx_lvalue_95.value = next; return next; })(cRef(() => i, __cxx_lvalue_96 => { i = __cxx_lvalue_96; }));
      __cxx_pc = 561; continue __cxx_cfg_loop;
    }
    case 563: {
      ((cDeref(((__cxx_lvalue_97) => { const previous = __cxx_lvalue_97.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_97.value = next; return previous; })(cRef(() => p, __cxx_lvalue_98 => { p = __cxx_lvalue_98; })), Uint8Array).value) = ((((8) & 255)) & 255));
      __cxx_pc = 562; continue __cxx_cfg_loop;
    }
    case 564: {
      (i = u32(0));
      __cxx_pc = 561; continue __cxx_cfg_loop;
    }
    case 565: {
      cByteMemory.memset(cRecordObject(r).m_code_size_1, 5, u64(32));
      __cxx_pc = 564; continue __cxx_cfg_loop;
    }
    case 566: {
      ((cDeref(cPointerOffset(cRecordObject(r).m_table_sizes, 1, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value) = u32(32));
      __cxx_pc = 565; continue __cxx_cfg_loop;
    }
    case 567: {
      ((cDeref(cPointerOffset(cRecordObject(r).m_table_sizes, 0, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value) = u32(288));
      __cxx_pc = 566; continue __cxx_cfg_loop;
    }
    case 568: {
      __cxx_pc = 567; continue __cxx_cfg_loop;
    }
    case 569: {
      p = cRecordObject(r).m_code_size_0;
      __cxx_pc = 568; continue __cxx_cfg_loop;
    }
    case 570: {
      ((cDeref(cPointerOffset(cRecordObject(r).m_table_sizes, 2, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value) = u32(19));
      __cxx_pc = 393; continue __cxx_cfg_loop;
    }
    case 571: {
      __cxx_pc = ((counter < (cDeref(cPointerOffset(cRecordObject(r).m_table_sizes, 2, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value))) ? 590 : 570; continue __cxx_cfg_loop;
    }
    case 572: {
      ((__cxx_lvalue_99) => { const previous = __cxx_lvalue_99.value; const next = u32((previous + 1)); __cxx_lvalue_99.value = next; return previous; })(cRef(() => counter, __cxx_lvalue_100 => { counter = __cxx_lvalue_100; }));
      __cxx_pc = 571; continue __cxx_cfg_loop;
    }
    case 573: {
      ((cDeref(cPointerOffset(cRecordObject(r).m_code_size_2, (cDeref(cPointerOffset(__static_tinfl_decompress_s_length_dezigzag, counter, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = ((((((s) & 255)) & 255)) & 255));
      __cxx_pc = 572; continue __cxx_cfg_loop;
    }
    case 574: {
      __cxx_pc = (Boolean(0)) ? 589 : 573; continue __cxx_cfg_loop;
    }
    case 575: {
      (num_bits = u32((Number(num_bits) - Number(u32(3)))));
      __cxx_pc = 574; continue __cxx_cfg_loop;
    }
    case 576: {
      (bit_buf = u64((BigInt(bit_buf) >> BigInt(3))));
      __cxx_pc = 575; continue __cxx_cfg_loop;
    }
    case 577: {
      (s = u32((BigInt(bit_buf) & BigInt(u64(i32((i32((1 << 3)) - 1)))))));
      __cxx_pc = 576; continue __cxx_cfg_loop;
    }
    case 578: {
      __cxx_pc = ((num_bits < u32(3))) ? 588 : 577; continue __cxx_cfg_loop;
    }
    case 579: {
      (num_bits = u32((Number(num_bits) + Number(u32(8)))));
      __cxx_pc = 578; continue __cxx_cfg_loop;
    }
    case 580: {
      (bit_buf = u64((BigInt(bit_buf) | BigInt((BigInt(u64(__cxx_cfg_local_23_c)) << BigInt(num_bits))))));
      __cxx_pc = 579; continue __cxx_cfg_loop;
    }
    case 581: {
      __cxx_pc = (Boolean(0)) ? 583 : 580; continue __cxx_cfg_loop;
    }
    case 582: {
      (__cxx_cfg_local_23_c = u32((cDeref(((__cxx_lvalue_101) => { const previous = __cxx_lvalue_101.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_101.value = next; return previous; })(cRef(() => pIn_buf_cur, __cxx_lvalue_102 => { pIn_buf_cur = __cxx_lvalue_102; })), Uint8Array).value)));
      __cxx_pc = 581; continue __cxx_cfg_loop;
    }
    case 583: {
      __cxx_pc = (cPointerCompare(pIn_buf_cur, pIn_buf_end, ">=")) ? 587 : 582; continue __cxx_cfg_loop;
    }
    case 584: {
      __cxx_pc = (Boolean(0)) ? 587 : 583; continue __cxx_cfg_loop;
    }
    case 585: {
      __cxx_pc = 41; continue __cxx_cfg_loop;
    }
    case 586: {
      (cRecordObject(r).m_state = u32(14));
      __cxx_pc = 585; continue __cxx_cfg_loop;
    }
    case 587: {
      (status = (Boolean(u32((decomp_flags & u32(2)))) ? 1 : -4));
      __cxx_pc = 586; continue __cxx_cfg_loop;
    }
    case 588: {
      __cxx_pc = 583; continue __cxx_cfg_loop;
    }
    case 589: {
      __cxx_pc = ((num_bits < u32(3))) ? 588 : 577; continue __cxx_cfg_loop;
    }
    case 590: {
      __cxx_pc = 589; continue __cxx_cfg_loop;
    }
    case 591: {
      (counter = u32(0));
      __cxx_pc = 571; continue __cxx_cfg_loop;
    }
    case 592: {
      cByteMemory.memset(cRecordObject(r).m_code_size_2, 0, 19);
      __cxx_pc = 591; continue __cxx_cfg_loop;
    }
    case 593: {
      __cxx_pc = ((counter < u32(3))) ? 611 : 592; continue __cxx_cfg_loop;
    }
    case 594: {
      ((__cxx_lvalue_103) => { const previous = __cxx_lvalue_103.value; const next = u32((previous + 1)); __cxx_lvalue_103.value = next; return previous; })(cRef(() => counter, __cxx_lvalue_104 => { counter = __cxx_lvalue_104; }));
      __cxx_pc = 593; continue __cxx_cfg_loop;
    }
    case 595: {
      ((__cxx_lvalue_105) => (__cxx_lvalue_105.value = u32((Number(__cxx_lvalue_105.value) + Number(u32((cDeref(cPointerOffset(__static_tinfl_decompress_s_min_table_sizes, counter, Uint16Array.BYTES_PER_ELEMENT), Uint16Array).value)))))))(cDeref(cPointerOffset(cRecordObject(r).m_table_sizes, counter, Uint32Array.BYTES_PER_ELEMENT), Uint32Array));
      __cxx_pc = 594; continue __cxx_cfg_loop;
    }
    case 596: {
      __cxx_pc = (Boolean(0)) ? 611 : 595; continue __cxx_cfg_loop;
    }
    case 597: {
      (num_bits = u32((Number(num_bits) - Number(u32((cDeref(cPointerOffset(__cxx_literal_14e4260e0bdd68b56044, counter, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value))))));
      __cxx_pc = 596; continue __cxx_cfg_loop;
    }
    case 598: {
      (bit_buf = u64((BigInt(bit_buf) >> BigInt(i32((cDeref(cPointerOffset(__cxx_literal_9a8fa1356e446d049dac, counter, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value))))));
      __cxx_pc = 597; continue __cxx_cfg_loop;
    }
    case 599: {
      ((cDeref(cPointerOffset(cRecordObject(r).m_table_sizes, counter, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value) = u32((BigInt(bit_buf) & BigInt(u64(i32((i32((1 << i32((cDeref(cPointerOffset(__cxx_literal_fb1c673f9167b4ec36a9, counter, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))) - 1)))))));
      __cxx_pc = 598; continue __cxx_cfg_loop;
    }
    case 600: {
      __cxx_pc = ((num_bits < u32((cDeref(cPointerOffset(__cxx_literal_ed9bfc60e5e1cc6cb69a, counter, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))) ? 610 : 599; continue __cxx_cfg_loop;
    }
    case 601: {
      (num_bits = u32((Number(num_bits) + Number(u32(8)))));
      __cxx_pc = 600; continue __cxx_cfg_loop;
    }
    case 602: {
      (bit_buf = u64((BigInt(bit_buf) | BigInt((BigInt(u64(__cxx_cfg_local_21_c)) << BigInt(num_bits))))));
      __cxx_pc = 601; continue __cxx_cfg_loop;
    }
    case 603: {
      __cxx_pc = (Boolean(0)) ? 605 : 602; continue __cxx_cfg_loop;
    }
    case 604: {
      (__cxx_cfg_local_21_c = u32((cDeref(((__cxx_lvalue_106) => { const previous = __cxx_lvalue_106.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_106.value = next; return previous; })(cRef(() => pIn_buf_cur, __cxx_lvalue_107 => { pIn_buf_cur = __cxx_lvalue_107; })), Uint8Array).value)));
      __cxx_pc = 603; continue __cxx_cfg_loop;
    }
    case 605: {
      __cxx_pc = (cPointerCompare(pIn_buf_cur, pIn_buf_end, ">=")) ? 609 : 604; continue __cxx_cfg_loop;
    }
    case 606: {
      __cxx_pc = (Boolean(0)) ? 609 : 605; continue __cxx_cfg_loop;
    }
    case 607: {
      __cxx_pc = 41; continue __cxx_cfg_loop;
    }
    case 608: {
      (cRecordObject(r).m_state = u32(11));
      __cxx_pc = 607; continue __cxx_cfg_loop;
    }
    case 609: {
      (status = (Boolean(u32((decomp_flags & u32(2)))) ? 1 : -4));
      __cxx_pc = 608; continue __cxx_cfg_loop;
    }
    case 610: {
      __cxx_pc = 605; continue __cxx_cfg_loop;
    }
    case 611: {
      __cxx_pc = ((num_bits < u32((cDeref(cPointerOffset(__cxx_literal_9ea666c646e551c85a92, counter, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))) ? 610 : 599; continue __cxx_cfg_loop;
    }
    case 612: {
      (counter = u32(0));
      __cxx_pc = 593; continue __cxx_cfg_loop;
    }
    case 613: {
      __cxx_pc = ((cRecordObject(r).m_type == u32(1))) ? 569 : 612; continue __cxx_cfg_loop;
    }
    case 614: {
      __cxx_pc = ((cRecordObject(r).m_type == u32(3))) ? 192 : 613; continue __cxx_cfg_loop;
    }
    case 615: {
      __cxx_pc = ((cRecordObject(r).m_type == u32(0))) ? 190 : 614; continue __cxx_cfg_loop;
    }
    case 616: {
      (cRecordObject(r).m_type = u32((cRecordObject(r).m_final >>> 1)));
      __cxx_pc = 615; continue __cxx_cfg_loop;
    }
    case 617: {
      __cxx_pc = (Boolean(0)) ? 632 : 616; continue __cxx_cfg_loop;
    }
    case 618: {
      (num_bits = u32((Number(num_bits) - Number(u32(3)))));
      __cxx_pc = 617; continue __cxx_cfg_loop;
    }
    case 619: {
      (bit_buf = u64((BigInt(bit_buf) >> BigInt(3))));
      __cxx_pc = 618; continue __cxx_cfg_loop;
    }
    case 620: {
      (cRecordObject(r).m_final = u32((BigInt(bit_buf) & BigInt(u64(i32((i32((1 << 3)) - 1)))))));
      __cxx_pc = 619; continue __cxx_cfg_loop;
    }
    case 621: {
      __cxx_pc = ((num_bits < u32(3))) ? 631 : 620; continue __cxx_cfg_loop;
    }
    case 622: {
      (num_bits = u32((Number(num_bits) + Number(u32(8)))));
      __cxx_pc = 621; continue __cxx_cfg_loop;
    }
    case 623: {
      (bit_buf = u64((BigInt(bit_buf) | BigInt((BigInt(u64(c)) << BigInt(num_bits))))));
      __cxx_pc = 622; continue __cxx_cfg_loop;
    }
    case 624: {
      __cxx_pc = (Boolean(0)) ? 626 : 623; continue __cxx_cfg_loop;
    }
    case 625: {
      (c = u32((cDeref(((__cxx_lvalue_108) => { const previous = __cxx_lvalue_108.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_108.value = next; return previous; })(cRef(() => pIn_buf_cur, __cxx_lvalue_109 => { pIn_buf_cur = __cxx_lvalue_109; })), Uint8Array).value)));
      __cxx_pc = 624; continue __cxx_cfg_loop;
    }
    case 626: {
      __cxx_pc = (cPointerCompare(pIn_buf_cur, pIn_buf_end, ">=")) ? 630 : 625; continue __cxx_cfg_loop;
    }
    case 627: {
      __cxx_pc = (Boolean(0)) ? 630 : 626; continue __cxx_cfg_loop;
    }
    case 628: {
      __cxx_pc = 41; continue __cxx_cfg_loop;
    }
    case 629: {
      (cRecordObject(r).m_state = u32(3));
      __cxx_pc = 628; continue __cxx_cfg_loop;
    }
    case 630: {
      (status = (Boolean(u32((decomp_flags & u32(2)))) ? 1 : -4));
      __cxx_pc = 629; continue __cxx_cfg_loop;
    }
    case 631: {
      __cxx_pc = 626; continue __cxx_cfg_loop;
    }
    case 632: {
      __cxx_pc = ((num_bits < u32(3))) ? 631 : 620; continue __cxx_cfg_loop;
    }
    case 633: {
      __cxx_pc = (Boolean(0)) ? 634 : 632; continue __cxx_cfg_loop;
    }
    case 634: {
      __cxx_pc = 639; continue __cxx_cfg_loop;
    }
    case 635: {
      __cxx_pc = 634; continue __cxx_cfg_loop;
    }
    case 636: {
      __cxx_pc = (Boolean(0)) ? 639 : 635; continue __cxx_cfg_loop;
    }
    case 637: {
      __cxx_pc = 41; continue __cxx_cfg_loop;
    }
    case 638: {
      (cRecordObject(r).m_state = u32(36));
      __cxx_pc = 637; continue __cxx_cfg_loop;
    }
    case 639: {
      (status = -1);
      __cxx_pc = 638; continue __cxx_cfg_loop;
    }
    case 640: {
      __cxx_pc = (Boolean(counter)) ? 634 : 632; continue __cxx_cfg_loop;
    }
    case 641: {
      (counter = u32((counter | u32(((u32((1 << u32((8 + (cRecordObject(r).m_zhdr0 >>> 4))))) > 32768) || ((BigInt(out_buf_size_mask) + BigInt(u64(1))) < u64((BigInt(u64(1)) << BigInt(u32((8 + (cRecordObject(r).m_zhdr0 >>> 4))))))))))));
      __cxx_pc = 640; continue __cxx_cfg_loop;
    }
    case 642: {
      __cxx_pc = ((!Boolean(u32((decomp_flags & u32(4)))))) ? 641 : 640; continue __cxx_cfg_loop;
    }
    case 643: {
      (counter = u32(((((u32((u32(Math.imul(cRecordObject(r).m_zhdr0, u32(256))) + cRecordObject(r).m_zhdr1)) % u32(31)) != u32(0)) || Boolean(u32((cRecordObject(r).m_zhdr1 & u32(32))))) || (u32((cRecordObject(r).m_zhdr0 & u32(15))) != u32(8)))));
      __cxx_pc = 642; continue __cxx_cfg_loop;
    }
    case 644: {
      __cxx_pc = (Boolean(0)) ? 646 : 643; continue __cxx_cfg_loop;
    }
    case 645: {
      (cRecordObject(r).m_zhdr1 = u32((cDeref(((__cxx_lvalue_110) => { const previous = __cxx_lvalue_110.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_110.value = next; return previous; })(cRef(() => pIn_buf_cur, __cxx_lvalue_111 => { pIn_buf_cur = __cxx_lvalue_111; })), Uint8Array).value)));
      __cxx_pc = 644; continue __cxx_cfg_loop;
    }
    case 646: {
      __cxx_pc = (cPointerCompare(pIn_buf_cur, pIn_buf_end, ">=")) ? 650 : 645; continue __cxx_cfg_loop;
    }
    case 647: {
      __cxx_pc = (Boolean(0)) ? 650 : 646; continue __cxx_cfg_loop;
    }
    case 648: {
      __cxx_pc = 41; continue __cxx_cfg_loop;
    }
    case 649: {
      (cRecordObject(r).m_state = u32(2));
      __cxx_pc = 648; continue __cxx_cfg_loop;
    }
    case 650: {
      (status = (Boolean(u32((decomp_flags & u32(2)))) ? 1 : -4));
      __cxx_pc = 649; continue __cxx_cfg_loop;
    }
    case 651: {
      __cxx_pc = (Boolean(0)) ? 653 : 646; continue __cxx_cfg_loop;
    }
    case 652: {
      (cRecordObject(r).m_zhdr0 = u32((cDeref(((__cxx_lvalue_112) => { const previous = __cxx_lvalue_112.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_112.value = next; return previous; })(cRef(() => pIn_buf_cur, __cxx_lvalue_113 => { pIn_buf_cur = __cxx_lvalue_113; })), Uint8Array).value)));
      __cxx_pc = 651; continue __cxx_cfg_loop;
    }
    case 653: {
      __cxx_pc = (cPointerCompare(pIn_buf_cur, pIn_buf_end, ">=")) ? 657 : 652; continue __cxx_cfg_loop;
    }
    case 654: {
      __cxx_pc = (Boolean(0)) ? 657 : 653; continue __cxx_cfg_loop;
    }
    case 655: {
      __cxx_pc = 41; continue __cxx_cfg_loop;
    }
    case 656: {
      (cRecordObject(r).m_state = u32(1));
      __cxx_pc = 655; continue __cxx_cfg_loop;
    }
    case 657: {
      (status = (Boolean(u32((decomp_flags & u32(2)))) ? 1 : -4));
      __cxx_pc = 656; continue __cxx_cfg_loop;
    }
    case 658: {
      __cxx_pc = (Boolean(u32((decomp_flags & u32(1))))) ? 653 : 632; continue __cxx_cfg_loop;
    }
    case 659: {
      (cRecordObject(r).m_z_adler32 = u32((cRecordObject(r).m_check_adler32 = u32(1))));
      __cxx_pc = 658; continue __cxx_cfg_loop;
    }
    case 660: {
      (bit_buf = u64((num_bits = u32((dist = u32((counter = u32((num_extra = u32((cRecordObject(r).m_zhdr0 = u32((cRecordObject(r).m_zhdr1 = u32(0))))))))))))));
      __cxx_pc = 659; continue __cxx_cfg_loop;
    }
    case 661: {
      switch (cRecordObject(r).m_state) {
      case u32(34): __cxx_pc = 45; break;
      case u32(41): __cxx_pc = 62; break;
      case u32(42): __cxx_pc = 71; break;
      case u32(32): __cxx_pc = 93; break;
      case u32(38): __cxx_pc = 107; break;
      case u32(9): __cxx_pc = 112; break;
      case u32(52): __cxx_pc = 121; break;
      case u32(51): __cxx_pc = 135; break;
      case u32(39): __cxx_pc = 144; break;
      case u32(6): __cxx_pc = 161; break;
      case u32(7): __cxx_pc = 170; break;
      case u32(5): __cxx_pc = 185; break;
      case u32(10): __cxx_pc = 194; break;
      case u32(53): __cxx_pc = 216; break;
      case u32(37): __cxx_pc = 225; break;
      case u32(27): __cxx_pc = 242; break;
      case u32(26): __cxx_pc = 267; break;
      case u32(25): __cxx_pc = 301; break;
      case u32(24): __cxx_pc = 317; break;
      case u32(23): __cxx_pc = 338; break;
      case u32(21): __cxx_pc = 400; break;
      case u32(18): __cxx_pc = 420; break;
      case u32(17): __cxx_pc = 430; break;
      case u32(16): __cxx_pc = 453; break;
      case u32(35): __cxx_pc = 518; break;
      case u32(14): __cxx_pc = 584; break;
      case u32(11): __cxx_pc = 606; break;
      case u32(3): __cxx_pc = 627; break;
      case u32(36): __cxx_pc = 636; break;
      case u32(2): __cxx_pc = 647; break;
      case u32(1): __cxx_pc = 654; break;
      case u32(0): __cxx_pc = 660; break;
      default: __cxx_pc = 41; break;
      }
      continue __cxx_cfg_loop;
    }
    case 662: {
      (dist_from_out_buf_start = u64(cRecordObject(r).m_dist_from_out_buf_start));
      __cxx_pc = 661; continue __cxx_cfg_loop;
    }
    case 663: {
      (num_extra = u32(cRecordObject(r).m_num_extra));
      __cxx_pc = 662; continue __cxx_cfg_loop;
    }
    case 664: {
      (counter = u32(cRecordObject(r).m_counter));
      __cxx_pc = 663; continue __cxx_cfg_loop;
    }
    case 665: {
      (dist = u32(cRecordObject(r).m_dist));
      __cxx_pc = 664; continue __cxx_cfg_loop;
    }
    case 666: {
      (bit_buf = u64(cRecordObject(r).m_bit_buf));
      __cxx_pc = 665; continue __cxx_cfg_loop;
    }
    case 667: {
      (num_bits = u32(cRecordObject(r).m_num_bits));
      __cxx_pc = 666; continue __cxx_cfg_loop;
    }
    case 668: {
      ((cPointerElementRef(pCode_sizes, 2).value) = cRecordObject(r).m_code_size_2);
      __cxx_pc = 667; continue __cxx_cfg_loop;
    }
    case 669: {
      ((cPointerElementRef(pCode_sizes, 1).value) = cRecordObject(r).m_code_size_1);
      __cxx_pc = 668; continue __cxx_cfg_loop;
    }
    case 670: {
      ((cPointerElementRef(pCode_sizes, 0).value) = cRecordObject(r).m_code_size_0);
      __cxx_pc = 669; continue __cxx_cfg_loop;
    }
    case 671: {
      ((cPointerElementRef(pTrees, 2).value) = cRecordObject(r).m_tree_2);
      __cxx_pc = 670; continue __cxx_cfg_loop;
    }
    case 672: {
      ((cPointerElementRef(pTrees, 1).value) = cRecordObject(r).m_tree_1);
      __cxx_pc = 671; continue __cxx_cfg_loop;
    }
    case 673: {
      ((cPointerElementRef(pTrees, 0).value) = cRecordObject(r).m_tree_0);
      __cxx_pc = 672; continue __cxx_cfg_loop;
    }
    case 674: {
      return -3;
    }
    case 675: {
      ((cDeref(pIn_buf_size, BigUint64Array).value) = u64(((cDeref(pOut_buf_size, BigUint64Array).value) = u64(0))));
      __cxx_pc = 674; continue __cxx_cfg_loop;
    }
    case 676: {
      __cxx_pc = ((Boolean((BigInt((BigInt(out_buf_size_mask) + BigInt(u64(1)))) & BigInt(out_buf_size_mask))) || cPointerCompare(pOut_buf_next, pOut_buf_start, "<"))) ? 675 : 673; continue __cxx_cfg_loop;
    }
    case 677: {
      __cxx_pc = 676; continue __cxx_cfg_loop;
    }
    case 678: {
      out_buf_size_mask = u64((Boolean(u32((decomp_flags & u32(4)))) ? u64((-1)) : (BigInt((BigInt(u64(cPointerDiff(pOut_buf_next, pOut_buf_start, Uint8Array.BYTES_PER_ELEMENT))) + BigInt((cDeref(pOut_buf_size, BigUint64Array).value)))) - BigInt(u64(1)))));
      __cxx_pc = 677; continue __cxx_cfg_loop;
    }
    case 679: {
      pOut_buf_end = (pOut_buf_next ? cPointerOffset(pOut_buf_next, (cDeref(pOut_buf_size, BigUint64Array).value), Uint8Array.BYTES_PER_ELEMENT) : null);
      __cxx_pc = 678; continue __cxx_cfg_loop;
    }
    case 680: {
      pOut_buf_cur = pOut_buf_next;
      __cxx_pc = 679; continue __cxx_cfg_loop;
    }
    case 681: {
      pIn_buf_end = cPointerOffset(pIn_buf_next, (cDeref(pIn_buf_size, BigUint64Array).value), Uint8Array.BYTES_PER_ELEMENT);
      __cxx_pc = 680; continue __cxx_cfg_loop;
    }
    case 682: {
      pIn_buf_cur = pIn_buf_next;
      __cxx_pc = 681; continue __cxx_cfg_loop;
    }
    case 683: {
      __cxx_pc = 682; continue __cxx_cfg_loop;
    }
    case 684: {
      __cxx_pc = 683; continue __cxx_cfg_loop;
    }
    case 685: {
      __cxx_pc = 684; continue __cxx_cfg_loop;
    }
    case 686: {
      __cxx_pc = 685; continue __cxx_cfg_loop;
    }
    case 687: {
      __cxx_pc = 686; continue __cxx_cfg_loop;
    }
    case 688: {
      status = -1;
      __cxx_pc = 687; continue __cxx_cfg_loop;
    }
    case 689: {
      pCode_sizes = cZeroAggregate({"pointerArray": 3, "stride": 8});
      __cxx_pc = 688; continue __cxx_cfg_loop;
    }
    case 690: {
      pTrees = cZeroAggregate({"pointerArray": 3, "stride": 8});
      __cxx_pc = 689; continue __cxx_cfg_loop;
    }
    case 691: {
      __cxx_pc = 690; continue __cxx_cfg_loop;
    }
    case 692: {
      __cxx_pc = 691; continue __cxx_cfg_loop;
    }
    case 693: {
      __cxx_pc = 692; continue __cxx_cfg_loop;
    }
    case 694: {
      __cxx_pc = 693; continue __cxx_cfg_loop;
    }
    case 695: {
      __cxx_pc = 694; continue __cxx_cfg_loop;
    }
    case 696: {
      __cxx_pc = 695; continue __cxx_cfg_loop;
    }
    default: throw new Error("invalid C source continuation");
    }
  }
}

// C/C++ source: source/build/include/compat.h:1169
export const pow2char__header_global_e0dd95cc2a4a4428 = new Uint8Array([((1) & 255), ((2) & 255), ((4) & 255), ((8) & 255), ((16) & 255), ((32) & 255), ((64) & 255), ((128) & 255)]);
function __cxx_static_address_52877f1d612c6666c969d1ec() {
  return __cxx_static_address_52877f1d612c6666c969d1ec.reference || (__cxx_static_address_52877f1d612c6666c969d1ec.reference = {
    __cReference: true,
    get value() { return pow2char__header_global_e0dd95cc2a4a4428; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/smmalloc.h:864
export function _sm_free(allocator, p) {
  return cRecordObject(allocator).Free(p);
}

// C/C++ source: source/build/include/smmalloc.h:866
export function _sm_realloc(allocator, p, bytesCount, alignment) {
  return cRecordObject(allocator).Realloc(p, bytesCount, alignment);
}

// C/C++ source: source/build/include/smmalloc.h:859
export function _sm_malloc(allocator, bytesCount, alignment) {
  return cRecordObject(allocator).Alloc(bytesCount, alignment);
}
