// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/duke3d/src/sbar.cpp
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
export const fix16_rad_to_deg_mult__header_global_eefa5b589c2adf57 = i32(3754936);
function __cxx_static_address_3894075ad5b5195029d56189() {
  return __cxx_static_address_3894075ad5b5195029d56189.reference || (__cxx_static_address_3894075ad5b5195029d56189.reference = {
    __cReference: true,
    get value() { return fix16_rad_to_deg_mult__header_global_eefa5b589c2adf57; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:114
export const fix16_deg_to_rad_mult__header_global_c373448ece879fee = i32(1144);
function __cxx_static_address_45ec5a18ae964a3618e8f29f() {
  return __cxx_static_address_45ec5a18ae964a3618e8f29f.reference || (__cxx_static_address_45ec5a18ae964a3618e8f29f.reference = {
    __cReference: true,
    get value() { return fix16_deg_to_rad_mult__header_global_c373448ece879fee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:43
export const KICK_HIT____header_global_3285ecb41c43a454 = ((((((0) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_36fe2962ce0e7c0ebbadc202() {
  return __cxx_static_address_36fe2962ce0e7c0ebbadc202.reference || (__cxx_static_address_36fe2962ce0e7c0ebbadc202.reference = {
    __cReference: true,
    get value() { return KICK_HIT____header_global_3285ecb41c43a454; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:44
export const PISTOL_RICOCHET____header_global_96d364902256b2ea = ((((((1) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_069b8bfe9aa615d6c6925739() {
  return __cxx_static_address_069b8bfe9aa615d6c6925739.reference || (__cxx_static_address_069b8bfe9aa615d6c6925739.reference = {
    __cReference: true,
    get value() { return PISTOL_RICOCHET____header_global_96d364902256b2ea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:45
export const PISTOL_BODYHIT____header_global_486265d2b2e2e925 = ((((((2) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1f9610726586321ae659f9cb() {
  return __cxx_static_address_1f9610726586321ae659f9cb.reference || (__cxx_static_address_1f9610726586321ae659f9cb.reference = {
    __cReference: true,
    get value() { return PISTOL_BODYHIT____header_global_486265d2b2e2e925; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:46
export const PISTOL_FIRE____header_global_9ae5f64d57896c13 = ((((((3) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7541c77aa1d647320a90749e() {
  return __cxx_static_address_7541c77aa1d647320a90749e.reference || (__cxx_static_address_7541c77aa1d647320a90749e.reference = {
    __cReference: true,
    get value() { return PISTOL_FIRE____header_global_9ae5f64d57896c13; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:47
export const EJECT_CLIP____header_global_5c8e4e38252f98a6 = ((((((4) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aaa6cb86105cbc318214a687() {
  return __cxx_static_address_aaa6cb86105cbc318214a687.reference || (__cxx_static_address_aaa6cb86105cbc318214a687.reference = {
    __cReference: true,
    get value() { return EJECT_CLIP____header_global_5c8e4e38252f98a6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:48
export const INSERT_CLIP____header_global_1dc0aecb13663c31 = ((((((5) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fd5983b429266f9cb545b894() {
  return __cxx_static_address_fd5983b429266f9cb545b894.reference || (__cxx_static_address_fd5983b429266f9cb545b894.reference = {
    __cReference: true,
    get value() { return INSERT_CLIP____header_global_1dc0aecb13663c31; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:49
export const CHAINGUN_FIRE____header_global_d895b096d6b24e06 = ((((((6) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6e11cebcb5a61e5979b9b1b5() {
  return __cxx_static_address_6e11cebcb5a61e5979b9b1b5.reference || (__cxx_static_address_6e11cebcb5a61e5979b9b1b5.reference = {
    __cReference: true,
    get value() { return CHAINGUN_FIRE____header_global_d895b096d6b24e06; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:50
export const RPG_SHOOT____header_global_c1f86ff270ce2bea = ((((((7) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4b2de985f10bf11ec5bdb929() {
  return __cxx_static_address_4b2de985f10bf11ec5bdb929.reference || (__cxx_static_address_4b2de985f10bf11ec5bdb929.reference = {
    __cReference: true,
    get value() { return RPG_SHOOT____header_global_c1f86ff270ce2bea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:51
export const POOLBALLHIT____header_global_9e41c7c70de4f48f = ((((((8) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d92af1d8e3588a355a506d9d() {
  return __cxx_static_address_d92af1d8e3588a355a506d9d.reference || (__cxx_static_address_d92af1d8e3588a355a506d9d.reference = {
    __cReference: true,
    get value() { return POOLBALLHIT____header_global_9e41c7c70de4f48f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:52
export const RPG_EXPLODE____header_global_8e2d31f9494cb961 = ((((((9) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a908135d11146b297e227586() {
  return __cxx_static_address_a908135d11146b297e227586.reference || (__cxx_static_address_a908135d11146b297e227586.reference = {
    __cReference: true,
    get value() { return RPG_EXPLODE____header_global_8e2d31f9494cb961; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:53
export const CAT_FIRE____header_global_e58b1e31f7e4cf77 = ((((((10) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_df3aaa7faef7ddbbde0754ea() {
  return __cxx_static_address_df3aaa7faef7ddbbde0754ea.reference || (__cxx_static_address_df3aaa7faef7ddbbde0754ea.reference = {
    __cReference: true,
    get value() { return CAT_FIRE____header_global_e58b1e31f7e4cf77; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:54
export const SHRINKER_FIRE____header_global_672e6237f709d9b3 = ((((((11) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b888d9cf9b88e602c9d8297a() {
  return __cxx_static_address_b888d9cf9b88e602c9d8297a.reference || (__cxx_static_address_b888d9cf9b88e602c9d8297a.reference = {
    __cReference: true,
    get value() { return SHRINKER_FIRE____header_global_672e6237f709d9b3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:55
export const PIPEBOMB_BOUNCE____header_global_8811ce2f77e8c857 = ((((((13) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_53a006014da0e108390ac2f5() {
  return __cxx_static_address_53a006014da0e108390ac2f5.reference || (__cxx_static_address_53a006014da0e108390ac2f5.reference = {
    __cReference: true,
    get value() { return PIPEBOMB_BOUNCE____header_global_8811ce2f77e8c857; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:56
export const PIPEBOMB_EXPLODE____header_global_48efab1ffe5f08a2 = ((((((14) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f4631c37512f3b4289b0d63a() {
  return __cxx_static_address_f4631c37512f3b4289b0d63a.reference || (__cxx_static_address_f4631c37512f3b4289b0d63a.reference = {
    __cReference: true,
    get value() { return PIPEBOMB_EXPLODE____header_global_48efab1ffe5f08a2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:57
export const LASERTRIP_ONWALL____header_global_047100f73684fbce = ((((((15) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cacf7010217b6610ac8e9257() {
  return __cxx_static_address_cacf7010217b6610ac8e9257.reference || (__cxx_static_address_cacf7010217b6610ac8e9257.reference = {
    __cReference: true,
    get value() { return LASERTRIP_ONWALL____header_global_047100f73684fbce; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:58
export const LASERTRIP_ARMING____header_global_f61ec0ebaeb682eb = ((((((16) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_549d728831eb0e1e2063b97c() {
  return __cxx_static_address_549d728831eb0e1e2063b97c.reference || (__cxx_static_address_549d728831eb0e1e2063b97c.reference = {
    __cReference: true,
    get value() { return LASERTRIP_ARMING____header_global_f61ec0ebaeb682eb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:59
export const LASERTRIP_EXPLODE____header_global_b5987270405a70ec = ((((((17) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c4bd3027e297a67640d3b55a() {
  return __cxx_static_address_c4bd3027e297a67640d3b55a.reference || (__cxx_static_address_c4bd3027e297a67640d3b55a.reference = {
    __cReference: true,
    get value() { return LASERTRIP_EXPLODE____header_global_b5987270405a70ec; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:60
export const VENT_BUST____header_global_7bfdc3c10ee543ee = ((((((18) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b320edb75f4b1815c992115b() {
  return __cxx_static_address_b320edb75f4b1815c992115b.reference || (__cxx_static_address_b320edb75f4b1815c992115b.reference = {
    __cReference: true,
    get value() { return VENT_BUST____header_global_7bfdc3c10ee543ee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:61
export const GLASS_BREAKING____header_global_ae35e12c10efb211 = ((((((19) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a7cb7ec4e990e7e5ce9af3f3() {
  return __cxx_static_address_a7cb7ec4e990e7e5ce9af3f3.reference || (__cxx_static_address_a7cb7ec4e990e7e5ce9af3f3.reference = {
    __cReference: true,
    get value() { return GLASS_BREAKING____header_global_ae35e12c10efb211; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:62
export const GLASS_HEAVYBREAK____header_global_45a43be7f0d1c8fd = ((((((20) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5c7fa5948e434e3db5bb84be() {
  return __cxx_static_address_5c7fa5948e434e3db5bb84be.reference || (__cxx_static_address_5c7fa5948e434e3db5bb84be.reference = {
    __cReference: true,
    get value() { return GLASS_HEAVYBREAK____header_global_45a43be7f0d1c8fd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:63
export const SHORT_CIRCUIT____header_global_e27e486293f48942 = ((((((21) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4eb6c914caf762a7f91c88ac() {
  return __cxx_static_address_4eb6c914caf762a7f91c88ac.reference || (__cxx_static_address_4eb6c914caf762a7f91c88ac.reference = {
    __cReference: true,
    get value() { return SHORT_CIRCUIT____header_global_e27e486293f48942; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:64
export const ITEM_SPLASH____header_global_678f9edc635c3280 = ((((((22) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6e321f353eac2825a5e471a6() {
  return __cxx_static_address_6e321f353eac2825a5e471a6.reference || (__cxx_static_address_6e321f353eac2825a5e471a6.reference = {
    __cReference: true,
    get value() { return ITEM_SPLASH____header_global_678f9edc635c3280; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:65
export const DUKE_GASP____header_global_023e30749bf24270 = ((((((25) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2ebbf4b3e5a3dfd11c0ec906() {
  return __cxx_static_address_2ebbf4b3e5a3dfd11c0ec906.reference || (__cxx_static_address_2ebbf4b3e5a3dfd11c0ec906.reference = {
    __cReference: true,
    get value() { return DUKE_GASP____header_global_023e30749bf24270; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:66
export const SLIM_RECOG____header_global_0bff12e8366b055c = ((((((26) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fee0d41607408fc04f999094() {
  return __cxx_static_address_fee0d41607408fc04f999094.reference || (__cxx_static_address_fee0d41607408fc04f999094.reference = {
    __cReference: true,
    get value() { return SLIM_RECOG____header_global_0bff12e8366b055c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:67
export const DUKE_URINATE____header_global_7d474e4ed221fef2 = ((((((28) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ee528282b358d1ba6ff819b1() {
  return __cxx_static_address_ee528282b358d1ba6ff819b1.reference || (__cxx_static_address_ee528282b358d1ba6ff819b1.reference = {
    __cReference: true,
    get value() { return DUKE_URINATE____header_global_7d474e4ed221fef2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:68
export const ENDSEQVOL3SND2____header_global_c09e1d592dd1a721 = ((((((29) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bf43dcca8f51334d9ba8f07d() {
  return __cxx_static_address_bf43dcca8f51334d9ba8f07d.reference || (__cxx_static_address_bf43dcca8f51334d9ba8f07d.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND2____header_global_c09e1d592dd1a721; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:69
export const ENDSEQVOL3SND3____header_global_8835e99ed81592f7 = ((((((30) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0ad171311c6184e4de954c4c() {
  return __cxx_static_address_0ad171311c6184e4de954c4c.reference || (__cxx_static_address_0ad171311c6184e4de954c4c.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND3____header_global_8835e99ed81592f7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:70
export const DUKE_CRACK____header_global_35b0e1cfa5c8410d = ((((((33) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_400c3c9ee439f1f9559a166b() {
  return __cxx_static_address_400c3c9ee439f1f9559a166b.reference || (__cxx_static_address_400c3c9ee439f1f9559a166b.reference = {
    __cReference: true,
    get value() { return DUKE_CRACK____header_global_35b0e1cfa5c8410d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:71
export const SLIM_ATTACK____header_global_66775150b214178d = ((((((34) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9906df1d69072b79bcc4f516() {
  return __cxx_static_address_9906df1d69072b79bcc4f516.reference || (__cxx_static_address_9906df1d69072b79bcc4f516.reference = {
    __cReference: true,
    get value() { return SLIM_ATTACK____header_global_66775150b214178d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:72
export const SOMETHINGHITFORCE____header_global_4730b3a738c9d496 = ((((((35) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f973fb2076a6f9212bbe944d() {
  return __cxx_static_address_f973fb2076a6f9212bbe944d.reference || (__cxx_static_address_f973fb2076a6f9212bbe944d.reference = {
    __cReference: true,
    get value() { return SOMETHINGHITFORCE____header_global_4730b3a738c9d496; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:73
export const DUKE_DRINKING____header_global_f87720f3d0f12335 = ((((((36) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f265a058dbb78ef1e7961742() {
  return __cxx_static_address_f265a058dbb78ef1e7961742.reference || (__cxx_static_address_f265a058dbb78ef1e7961742.reference = {
    __cReference: true,
    get value() { return DUKE_DRINKING____header_global_f87720f3d0f12335; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:74
export const DUKE_GRUNT____header_global_f8aba94add3347e7 = ((((((38) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4a3540103247a1c4fc1c68cc() {
  return __cxx_static_address_4a3540103247a1c4fc1c68cc.reference || (__cxx_static_address_4a3540103247a1c4fc1c68cc.reference = {
    __cReference: true,
    get value() { return DUKE_GRUNT____header_global_f8aba94add3347e7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:75
export const DUKE_HARTBEAT____header_global_3aac9d97cb8fffe5 = ((((((39) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d2c827c401f38ca91121d75c() {
  return __cxx_static_address_d2c827c401f38ca91121d75c.reference || (__cxx_static_address_d2c827c401f38ca91121d75c.reference = {
    __cReference: true,
    get value() { return DUKE_HARTBEAT____header_global_3aac9d97cb8fffe5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:76
export const DUKE_ONWATER____header_global_90cf959e335d7dda = ((((((40) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7bcaa5e6c13d8b6b63baf993() {
  return __cxx_static_address_7bcaa5e6c13d8b6b63baf993.reference || (__cxx_static_address_7bcaa5e6c13d8b6b63baf993.reference = {
    __cReference: true,
    get value() { return DUKE_ONWATER____header_global_90cf959e335d7dda; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:77
export const DUKE_LAND____header_global_ce82753eedbf110e = ((((((42) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6476543c0dd7631ffc71b249() {
  return __cxx_static_address_6476543c0dd7631ffc71b249.reference || (__cxx_static_address_6476543c0dd7631ffc71b249.reference = {
    __cReference: true,
    get value() { return DUKE_LAND____header_global_ce82753eedbf110e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:78
export const DUKE_WALKINDUCTS____header_global_fd35ae52640451d9 = ((((((43) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0195244ecdfe1dc8970c869a() {
  return __cxx_static_address_0195244ecdfe1dc8970c869a.reference || (__cxx_static_address_0195244ecdfe1dc8970c869a.reference = {
    __cReference: true,
    get value() { return DUKE_WALKINDUCTS____header_global_fd35ae52640451d9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:79
export const DUKE_UNDERWATER____header_global_d0da327461846055 = ((((((48) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dd9d13e51a3259caa9e9e7ca() {
  return __cxx_static_address_dd9d13e51a3259caa9e9e7ca.reference || (__cxx_static_address_dd9d13e51a3259caa9e9e7ca.reference = {
    __cReference: true,
    get value() { return DUKE_UNDERWATER____header_global_d0da327461846055; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:80
export const DUKE_JETPACK_ON____header_global_3938909d450be049 = ((((((49) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3c6c61150640f70a64784dc0() {
  return __cxx_static_address_3c6c61150640f70a64784dc0.reference || (__cxx_static_address_3c6c61150640f70a64784dc0.reference = {
    __cReference: true,
    get value() { return DUKE_JETPACK_ON____header_global_3938909d450be049; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:81
export const DUKE_JETPACK_IDLE____header_global_e04bdd67af973c1b = ((((((50) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e1f9b7acf3929faa1ea46a3e() {
  return __cxx_static_address_e1f9b7acf3929faa1ea46a3e.reference || (__cxx_static_address_e1f9b7acf3929faa1ea46a3e.reference = {
    __cReference: true,
    get value() { return DUKE_JETPACK_IDLE____header_global_e04bdd67af973c1b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:82
export const DUKE_JETPACK_OFF____header_global_2251d9d3609c8efc = ((((((51) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5185a64373fc2b8617a15802() {
  return __cxx_static_address_5185a64373fc2b8617a15802.reference || (__cxx_static_address_5185a64373fc2b8617a15802.reference = {
    __cReference: true,
    get value() { return DUKE_JETPACK_OFF____header_global_2251d9d3609c8efc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:83
export const DUKETALKTOBOSS____header_global_dd4bda7f35face1b = ((((((56) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_13fc737c684ee896859b1a4f() {
  return __cxx_static_address_13fc737c684ee896859b1a4f.reference || (__cxx_static_address_13fc737c684ee896859b1a4f.reference = {
    __cReference: true,
    get value() { return DUKETALKTOBOSS____header_global_dd4bda7f35face1b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:84
export const SQUISHED____header_global_56bf39dbcfc5ad15 = ((((((69) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5758a1609d1359f8129ee1ad() {
  return __cxx_static_address_5758a1609d1359f8129ee1ad.reference || (__cxx_static_address_5758a1609d1359f8129ee1ad.reference = {
    __cReference: true,
    get value() { return SQUISHED____header_global_56bf39dbcfc5ad15; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:85
export const TELEPORTER____header_global_ab9523316d3c6b46 = ((((((70) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1178622f8bfcf8250d5d16e0() {
  return __cxx_static_address_1178622f8bfcf8250d5d16e0.reference || (__cxx_static_address_1178622f8bfcf8250d5d16e0.reference = {
    __cReference: true,
    get value() { return TELEPORTER____header_global_ab9523316d3c6b46; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:86
export const ELEVATOR_ON____header_global_951c4ec0eebfd0dc = ((((((71) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5b7a0c3059b702ea3859b545() {
  return __cxx_static_address_5b7a0c3059b702ea3859b545.reference || (__cxx_static_address_5b7a0c3059b702ea3859b545.reference = {
    __cReference: true,
    get value() { return ELEVATOR_ON____header_global_951c4ec0eebfd0dc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:87
export const ELEVATOR_OFF____header_global_72e086a146607510 = ((((((73) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8dd83d641c0a390f7c0c315b() {
  return __cxx_static_address_8dd83d641c0a390f7c0c315b.reference || (__cxx_static_address_8dd83d641c0a390f7c0c315b.reference = {
    __cReference: true,
    get value() { return ELEVATOR_OFF____header_global_72e086a146607510; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:88
export const SUBWAY____header_global_6247b3d008fe5a52 = ((((((75) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4f4ecaf6439618546c40fc02() {
  return __cxx_static_address_4f4ecaf6439618546c40fc02.reference || (__cxx_static_address_4f4ecaf6439618546c40fc02.reference = {
    __cReference: true,
    get value() { return SUBWAY____header_global_6247b3d008fe5a52; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:89
export const SWITCH_ON____header_global_dc69f71ff9798c4b = ((((((76) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aed56821ca51b1919e2b07de() {
  return __cxx_static_address_aed56821ca51b1919e2b07de.reference || (__cxx_static_address_aed56821ca51b1919e2b07de.reference = {
    __cReference: true,
    get value() { return SWITCH_ON____header_global_dc69f71ff9798c4b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:90
export const FLUSH_TOILET____header_global_d2a96cdcc11cb50a = ((((((79) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_752019df7fa26f98a8d20291() {
  return __cxx_static_address_752019df7fa26f98a8d20291.reference || (__cxx_static_address_752019df7fa26f98a8d20291.reference = {
    __cReference: true,
    get value() { return FLUSH_TOILET____header_global_d2a96cdcc11cb50a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:91
export const EARTHQUAKE____header_global_ec987cdd88639c31 = ((((((81) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e4dda2942d33ea240ff47500() {
  return __cxx_static_address_e4dda2942d33ea240ff47500.reference || (__cxx_static_address_e4dda2942d33ea240ff47500.reference = {
    __cReference: true,
    get value() { return EARTHQUAKE____header_global_ec987cdd88639c31; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:92
export const END_OF_LEVEL_WARN____header_global_b3222fec58ad1ca7 = ((((((83) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_04e01ac2ae05125ff66bb60f() {
  return __cxx_static_address_04e01ac2ae05125ff66bb60f.reference || (__cxx_static_address_04e01ac2ae05125ff66bb60f.reference = {
    __cReference: true,
    get value() { return END_OF_LEVEL_WARN____header_global_b3222fec58ad1ca7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:93
export const WIND_AMBIENCE____header_global_af5c094272c7ac9a = ((((((91) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_36c417723794153f713744f4() {
  return __cxx_static_address_36c417723794153f713744f4.reference || (__cxx_static_address_36c417723794153f713744f4.reference = {
    __cReference: true,
    get value() { return WIND_AMBIENCE____header_global_af5c094272c7ac9a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:94
export const SOMETHING_DRIPPING____header_global_dff7fe7cda6b0d75 = ((((((92) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_648f05f1f94e341ac71b0e2d() {
  return __cxx_static_address_648f05f1f94e341ac71b0e2d.reference || (__cxx_static_address_648f05f1f94e341ac71b0e2d.reference = {
    __cReference: true,
    get value() { return SOMETHING_DRIPPING____header_global_dff7fe7cda6b0d75; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:95
export const BOS1_RECOG____header_global_0b0ea47ce07e055c = ((((((97) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_94dd5f77e34b13979f627a73() {
  return __cxx_static_address_94dd5f77e34b13979f627a73.reference || (__cxx_static_address_94dd5f77e34b13979f627a73.reference = {
    __cReference: true,
    get value() { return BOS1_RECOG____header_global_0b0ea47ce07e055c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:96
export const BOS2_RECOG____header_global_cc16712a7db37af3 = ((((((102) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_306557d9b7b5de54cec2bf7f() {
  return __cxx_static_address_306557d9b7b5de54cec2bf7f.reference || (__cxx_static_address_306557d9b7b5de54cec2bf7f.reference = {
    __cReference: true,
    get value() { return BOS2_RECOG____header_global_cc16712a7db37af3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:97
export const DUKE_GETWEAPON2____header_global_dacbfeacd993a9b8 = ((((((107) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_93bfec39ff1df74e5f9423fc() {
  return __cxx_static_address_93bfec39ff1df74e5f9423fc.reference || (__cxx_static_address_93bfec39ff1df74e5f9423fc.reference = {
    __cReference: true,
    get value() { return DUKE_GETWEAPON2____header_global_dacbfeacd993a9b8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:98
export const SHOTGUN_FIRE____header_global_2f2b81705e191b0e = ((((((109) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_585051ddd37877cd15f1a98f() {
  return __cxx_static_address_585051ddd37877cd15f1a98f.reference || (__cxx_static_address_585051ddd37877cd15f1a98f.reference = {
    __cReference: true,
    get value() { return SHOTGUN_FIRE____header_global_2f2b81705e191b0e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:99
export const PRED_RECOG____header_global_04d50f1c3f9954ae = ((((((111) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2f266fa9b23e893f601c2952() {
  return __cxx_static_address_2f266fa9b23e893f601c2952.reference || (__cxx_static_address_2f266fa9b23e893f601c2952.reference = {
    __cReference: true,
    get value() { return PRED_RECOG____header_global_04d50f1c3f9954ae; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:100
export const CAPT_RECOG____header_global_c5da13582d223e51 = ((((((117) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cf41425e7b4ca3d03b51f9af() {
  return __cxx_static_address_cf41425e7b4ca3d03b51f9af.reference || (__cxx_static_address_cf41425e7b4ca3d03b51f9af.reference = {
    __cReference: true,
    get value() { return CAPT_RECOG____header_global_c5da13582d223e51; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:101
export const PIG_RECOG____header_global_976658b84edf0b78 = ((((((121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_94c0522368f5f08793344f9f() {
  return __cxx_static_address_94c0522368f5f08793344f9f.reference || (__cxx_static_address_94c0522368f5f08793344f9f.reference = {
    __cReference: true,
    get value() { return PIG_RECOG____header_global_976658b84edf0b78; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:102
export const RECO_ROAM____header_global_34e0cc298c0a793b = ((((((125) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6c32b6c4aa9adf84ff9fcd4d() {
  return __cxx_static_address_6c32b6c4aa9adf84ff9fcd4d.reference || (__cxx_static_address_6c32b6c4aa9adf84ff9fcd4d.reference = {
    __cReference: true,
    get value() { return RECO_ROAM____header_global_34e0cc298c0a793b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:103
export const RECO_RECOG____header_global_6b8ea725764016fd = ((((((126) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_31c43818d0c0e695a74a96b2() {
  return __cxx_static_address_31c43818d0c0e695a74a96b2.reference || (__cxx_static_address_31c43818d0c0e695a74a96b2.reference = {
    __cReference: true,
    get value() { return RECO_RECOG____header_global_6b8ea725764016fd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:104
export const RECO_ATTACK____header_global_fd92df25a486a206 = ((((((127) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_add4287097ffe2dac32bd0a7() {
  return __cxx_static_address_add4287097ffe2dac32bd0a7.reference || (__cxx_static_address_add4287097ffe2dac32bd0a7.reference = {
    __cReference: true,
    get value() { return RECO_ATTACK____header_global_fd92df25a486a206; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:105
export const RECO_PAIN____header_global_07d30b85d838db10 = ((((((128) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e7f64b87053a5c2bb9239eb3() {
  return __cxx_static_address_e7f64b87053a5c2bb9239eb3.reference || (__cxx_static_address_e7f64b87053a5c2bb9239eb3.reference = {
    __cReference: true,
    get value() { return RECO_PAIN____header_global_07d30b85d838db10; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:106
export const DRON_RECOG____header_global_16017e8f698aa931 = ((((((131) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7839e13f63598ff31d39b23d() {
  return __cxx_static_address_7839e13f63598ff31d39b23d.reference || (__cxx_static_address_7839e13f63598ff31d39b23d.reference = {
    __cReference: true,
    get value() { return DRON_RECOG____header_global_16017e8f698aa931; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:107
export const COMM_RECOG____header_global_a62460a21249a34a = ((((((136) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e3d8bc2fb5471010b54d9e4b() {
  return __cxx_static_address_e3d8bc2fb5471010b54d9e4b.reference || (__cxx_static_address_e3d8bc2fb5471010b54d9e4b.reference = {
    __cReference: true,
    get value() { return COMM_RECOG____header_global_a62460a21249a34a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:108
export const OCTA_RECOG____header_global_f5af40004388067c = ((((((141) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_17ec3ab7df15989506a97410() {
  return __cxx_static_address_17ec3ab7df15989506a97410.reference || (__cxx_static_address_17ec3ab7df15989506a97410.reference = {
    __cReference: true,
    get value() { return OCTA_RECOG____header_global_f5af40004388067c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:109
export const TURR_RECOG____header_global_b4c0a48b4a82ce7a = ((((((146) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_46b21268f52bee6e84875f47() {
  return __cxx_static_address_46b21268f52bee6e84875f47.reference || (__cxx_static_address_46b21268f52bee6e84875f47.reference = {
    __cReference: true,
    get value() { return TURR_RECOG____header_global_b4c0a48b4a82ce7a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:110
export const SLIM_DYING____header_global_4039532013929a80 = ((((((149) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_414c5d88a98f5f4f782ad4d0() {
  return __cxx_static_address_414c5d88a98f5f4f782ad4d0.reference || (__cxx_static_address_414c5d88a98f5f4f782ad4d0.reference = {
    __cReference: true,
    get value() { return SLIM_DYING____header_global_4039532013929a80; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:111
export const BOS3_RECOG____header_global_e374ca549b24afeb = ((((((151) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c602c669e7bc4804ad1349a5() {
  return __cxx_static_address_c602c669e7bc4804ad1349a5.reference || (__cxx_static_address_c602c669e7bc4804ad1349a5.reference = {
    __cReference: true,
    get value() { return BOS3_RECOG____header_global_e374ca549b24afeb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:112
export const BOS1_WALK____header_global_65ea62aa615456d5 = ((((((156) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a3f257b2a0ea2116e30ce8c8() {
  return __cxx_static_address_a3f257b2a0ea2116e30ce8c8.reference || (__cxx_static_address_a3f257b2a0ea2116e30ce8c8.reference = {
    __cReference: true,
    get value() { return BOS1_WALK____header_global_65ea62aa615456d5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:113
export const THUD____header_global_6087b798c574aca7 = ((((((158) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_342a55b5c9923f3b1a99992e() {
  return __cxx_static_address_342a55b5c9923f3b1a99992e.reference || (__cxx_static_address_342a55b5c9923f3b1a99992e.reference = {
    __cReference: true,
    get value() { return THUD____header_global_6087b798c574aca7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:114
export const WIERDSHOT_FLY____header_global_652b99473e99251f = ((((((160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9b697256ffb69fa9f604e745() {
  return __cxx_static_address_9b697256ffb69fa9f604e745.reference || (__cxx_static_address_9b697256ffb69fa9f604e745.reference = {
    __cReference: true,
    get value() { return WIERDSHOT_FLY____header_global_652b99473e99251f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:115
export const SLIM_ROAM____header_global_52f0cd05bc78a4bf = ((((((163) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dff8b507a4f9cd90d3d9a478() {
  return __cxx_static_address_dff8b507a4f9cd90d3d9a478.reference || (__cxx_static_address_dff8b507a4f9cd90d3d9a478.reference = {
    __cReference: true,
    get value() { return SLIM_ROAM____header_global_52f0cd05bc78a4bf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:116
export const SHOTGUN_COCK____header_global_5038d143b25f1973 = ((((((169) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_92b387349f1a4230eb26ac02() {
  return __cxx_static_address_92b387349f1a4230eb26ac02.reference || (__cxx_static_address_92b387349f1a4230eb26ac02.reference = {
    __cReference: true,
    get value() { return SHOTGUN_COCK____header_global_5038d143b25f1973; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:117
export const GENERIC_AMBIENCE17____header_global_bd2cb5ea6bcf4644 = ((((((177) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_605a5ca8b252558456d92470() {
  return __cxx_static_address_605a5ca8b252558456d92470.reference || (__cxx_static_address_605a5ca8b252558456d92470.reference = {
    __cReference: true,
    get value() { return GENERIC_AMBIENCE17____header_global_bd2cb5ea6bcf4644; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:118
export const BONUS_SPEECH1____header_global_4fd1b3deb985f024 = ((((((195) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a156afb918019375e026af52() {
  return __cxx_static_address_a156afb918019375e026af52.reference || (__cxx_static_address_a156afb918019375e026af52.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH1____header_global_4fd1b3deb985f024; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:119
export const BONUS_SPEECH2____header_global_9bec497ab064f2ab = ((((((196) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4cbbfd3e64b63ee7f2fc4c9c() {
  return __cxx_static_address_4cbbfd3e64b63ee7f2fc4c9c.reference || (__cxx_static_address_4cbbfd3e64b63ee7f2fc4c9c.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH2____header_global_9bec497ab064f2ab; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:120
export const BONUS_SPEECH3____header_global_47778c827156dabe = ((((((197) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b12957498d9c9f7cc3ed4105() {
  return __cxx_static_address_b12957498d9c9f7cc3ed4105.reference || (__cxx_static_address_b12957498d9c9f7cc3ed4105.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH3____header_global_47778c827156dabe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:121
export const BONUS_SPEECH4____header_global_48bdf210ae06f842 = ((((((199) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a821edaeb2db4f79ad2a6cee() {
  return __cxx_static_address_a821edaeb2db4f79ad2a6cee.reference || (__cxx_static_address_a821edaeb2db4f79ad2a6cee.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH4____header_global_48bdf210ae06f842; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:122
export const DUKE_LAND_HURT____header_global_9a77acba7f08b1dc = ((((((200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d42510d8c697de836bb88b5e() {
  return __cxx_static_address_d42510d8c697de836bb88b5e.reference || (__cxx_static_address_d42510d8c697de836bb88b5e.reference = {
    __cReference: true,
    get value() { return DUKE_LAND_HURT____header_global_9a77acba7f08b1dc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:123
export const DUKE_SEARCH2____header_global_f7c021af7b5bbcf5 = ((((((207) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9c7fa3f84df7142af15f9b17() {
  return __cxx_static_address_9c7fa3f84df7142af15f9b17.reference || (__cxx_static_address_9c7fa3f84df7142af15f9b17.reference = {
    __cReference: true,
    get value() { return DUKE_SEARCH2____header_global_f7c021af7b5bbcf5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:124
export const DUKE_CRACK2____header_global_86683a104aca5bd0 = ((((((208) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_253ec9f80182fd80684508e6() {
  return __cxx_static_address_253ec9f80182fd80684508e6.reference || (__cxx_static_address_253ec9f80182fd80684508e6.reference = {
    __cReference: true,
    get value() { return DUKE_CRACK2____header_global_86683a104aca5bd0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:125
export const DUKE_SEARCH____header_global_6b944e949250cd59 = ((((((209) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8609f552aeb0dbe907a79480() {
  return __cxx_static_address_8609f552aeb0dbe907a79480.reference || (__cxx_static_address_8609f552aeb0dbe907a79480.reference = {
    __cReference: true,
    get value() { return DUKE_SEARCH____header_global_6b944e949250cd59; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:126
export const DUKE_GET____header_global_0cf449487d8c03ca = ((((((210) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d3a10efc5555014d969088d7() {
  return __cxx_static_address_d3a10efc5555014d969088d7.reference || (__cxx_static_address_d3a10efc5555014d969088d7.reference = {
    __cReference: true,
    get value() { return DUKE_GET____header_global_0cf449487d8c03ca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:127
export const DUKE_LONGTERM_PAIN____header_global_b01fe358bf890be1 = ((((((211) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7a90cb55643f263dab1e7148() {
  return __cxx_static_address_7a90cb55643f263dab1e7148.reference || (__cxx_static_address_7a90cb55643f263dab1e7148.reference = {
    __cReference: true,
    get value() { return DUKE_LONGTERM_PAIN____header_global_b01fe358bf890be1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:128
export const MONITOR_ACTIVE____header_global_4852c3a7cd772659 = ((((((212) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6e6f773069735b85889be20e() {
  return __cxx_static_address_6e6f773069735b85889be20e.reference || (__cxx_static_address_6e6f773069735b85889be20e.reference = {
    __cReference: true,
    get value() { return MONITOR_ACTIVE____header_global_4852c3a7cd772659; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:129
export const NITEVISION_ONOFF____header_global_8cbecdb8baa2d4ae = ((((((213) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_129a26e1ef41ff109fb2750f() {
  return __cxx_static_address_129a26e1ef41ff109fb2750f.reference || (__cxx_static_address_129a26e1ef41ff109fb2750f.reference = {
    __cReference: true,
    get value() { return NITEVISION_ONOFF____header_global_8cbecdb8baa2d4ae; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:130
export const DUKE_CRACK_FIRST____header_global_c4ed62fc76706f56 = ((((((215) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1f409b3eb40c57928066a339() {
  return __cxx_static_address_1f409b3eb40c57928066a339.reference || (__cxx_static_address_1f409b3eb40c57928066a339.reference = {
    __cReference: true,
    get value() { return DUKE_CRACK_FIRST____header_global_c4ed62fc76706f56; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:131
export const DUKE_USEMEDKIT____header_global_c8eae62bd117334e = ((((((216) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_89f87703d65379925c9b047c() {
  return __cxx_static_address_89f87703d65379925c9b047c.reference || (__cxx_static_address_89f87703d65379925c9b047c.reference = {
    __cReference: true,
    get value() { return DUKE_USEMEDKIT____header_global_c8eae62bd117334e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:132
export const DUKE_TAKEPILLS____header_global_805b70cd5cc601c8 = ((((((217) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e69a83157d8779fe1908eded() {
  return __cxx_static_address_e69a83157d8779fe1908eded.reference || (__cxx_static_address_e69a83157d8779fe1908eded.reference = {
    __cReference: true,
    get value() { return DUKE_TAKEPILLS____header_global_805b70cd5cc601c8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:133
export const DUKE_PISSRELIEF____header_global_57f4a1dc7acad3d9 = ((((((218) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a10acbf015c68aa917701317() {
  return __cxx_static_address_a10acbf015c68aa917701317.reference || (__cxx_static_address_a10acbf015c68aa917701317.reference = {
    __cReference: true,
    get value() { return DUKE_PISSRELIEF____header_global_57f4a1dc7acad3d9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:134
export const SELECT_WEAPON____header_global_6c56258e7a147dbe = ((((((219) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3f00aa6d6cd8a6137dad4620() {
  return __cxx_static_address_3f00aa6d6cd8a6137dad4620.reference || (__cxx_static_address_3f00aa6d6cd8a6137dad4620.reference = {
    __cReference: true,
    get value() { return SELECT_WEAPON____header_global_6c56258e7a147dbe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:135
export const JIBBED_ACTOR5____header_global_cc8053d6703d29d7 = ((((((226) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8838f3f9b504e8f40fdb29b5() {
  return __cxx_static_address_8838f3f9b504e8f40fdb29b5.reference || (__cxx_static_address_8838f3f9b504e8f40fdb29b5.reference = {
    __cReference: true,
    get value() { return JIBBED_ACTOR5____header_global_cc8053d6703d29d7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:136
export const JIBBED_ACTOR6____header_global_972f581a03997085 = ((((((227) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5fdfca3038c7071836307b79() {
  return __cxx_static_address_5fdfca3038c7071836307b79.reference || (__cxx_static_address_5fdfca3038c7071836307b79.reference = {
    __cReference: true,
    get value() { return JIBBED_ACTOR6____header_global_972f581a03997085; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:137
export const DUKE_GOTHEALTHATLOW____header_global_7211425ef335e22e = ((((((229) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1ed2705012754a8ec2b1c048() {
  return __cxx_static_address_1ed2705012754a8ec2b1c048.reference || (__cxx_static_address_1ed2705012754a8ec2b1c048.reference = {
    __cReference: true,
    get value() { return DUKE_GOTHEALTHATLOW____header_global_7211425ef335e22e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:138
export const BOSSTALKTODUKE____header_global_61094619b637e0bb = ((((((230) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c7aa5dab8888b255b85502db() {
  return __cxx_static_address_c7aa5dab8888b255b85502db.reference || (__cxx_static_address_c7aa5dab8888b255b85502db.reference = {
    __cReference: true,
    get value() { return BOSSTALKTODUKE____header_global_61094619b637e0bb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:139
export const WAR_AMBIENCE2____header_global_a27585f4ea24e798 = ((((((232) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7af15ce60e3472f05c497fec() {
  return __cxx_static_address_7af15ce60e3472f05c497fec.reference || (__cxx_static_address_7af15ce60e3472f05c497fec.reference = {
    __cReference: true,
    get value() { return WAR_AMBIENCE2____header_global_a27585f4ea24e798; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:140
export const EXITMENUSOUND____header_global_38072ff95acdc9f5 = ((((((243) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b325a831edc34ac0eb6dd689() {
  return __cxx_static_address_b325a831edc34ac0eb6dd689.reference || (__cxx_static_address_b325a831edc34ac0eb6dd689.reference = {
    __cReference: true,
    get value() { return EXITMENUSOUND____header_global_38072ff95acdc9f5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:141
export const FLY_BY____header_global_8699dc98b0fa0b4b = ((((((244) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b9f1d4464f834dd73414c193() {
  return __cxx_static_address_b9f1d4464f834dd73414c193.reference || (__cxx_static_address_b9f1d4464f834dd73414c193.reference = {
    __cReference: true,
    get value() { return FLY_BY____header_global_8699dc98b0fa0b4b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:142
export const DUKE_SCREAM____header_global_83d2ea8b80596e2e = ((((((245) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1c85e18cfb8dcac54e97a279() {
  return __cxx_static_address_1c85e18cfb8dcac54e97a279.reference || (__cxx_static_address_1c85e18cfb8dcac54e97a279.reference = {
    __cReference: true,
    get value() { return DUKE_SCREAM____header_global_83d2ea8b80596e2e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:143
export const SHRINKER_HIT____header_global_fa6e683a556e7831 = ((((((246) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f43a037aead7617e32769ab5() {
  return __cxx_static_address_f43a037aead7617e32769ab5.reference || (__cxx_static_address_f43a037aead7617e32769ab5.reference = {
    __cReference: true,
    get value() { return SHRINKER_HIT____header_global_fa6e683a556e7831; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:144
export const RATTY____header_global_dc3eba1ede86c5ae = ((((((247) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5da400c2a4db143f7fe4574b() {
  return __cxx_static_address_5da400c2a4db143f7fe4574b.reference || (__cxx_static_address_5da400c2a4db143f7fe4574b.reference = {
    __cReference: true,
    get value() { return RATTY____header_global_dc3eba1ede86c5ae; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:145
export const BONUSMUSIC____header_global_3e8ada10a7ae7229 = ((((((249) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_05756b0f155af23d2113785f() {
  return __cxx_static_address_05756b0f155af23d2113785f.reference || (__cxx_static_address_05756b0f155af23d2113785f.reference = {
    __cReference: true,
    get value() { return BONUSMUSIC____header_global_3e8ada10a7ae7229; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:146
export const DUKE_GETWEAPON6____header_global_1d7019a9f1c6a2d8 = ((((((264) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b627b80babd1ff6b3dcf753f() {
  return __cxx_static_address_b627b80babd1ff6b3dcf753f.reference || (__cxx_static_address_b627b80babd1ff6b3dcf753f.reference = {
    __cReference: true,
    get value() { return DUKE_GETWEAPON6____header_global_1d7019a9f1c6a2d8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:147
export const ALIEN_SWITCH1____header_global_e1a39ed2db768a70 = ((((((272) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3ca56869753ab52fa1943b66() {
  return __cxx_static_address_3ca56869753ab52fa1943b66.reference || (__cxx_static_address_3ca56869753ab52fa1943b66.reference = {
    __cReference: true,
    get value() { return ALIEN_SWITCH1____header_global_e1a39ed2db768a70; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:148
export const RIPHEADNECK____header_global_0aba8648a499ca03 = ((((((284) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8c352095454cfec683aba9bf() {
  return __cxx_static_address_8c352095454cfec683aba9bf.reference || (__cxx_static_address_8c352095454cfec683aba9bf.reference = {
    __cReference: true,
    get value() { return RIPHEADNECK____header_global_0aba8648a499ca03; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:149
export const ENDSEQVOL3SND4____header_global_37d8226ac69ac012 = ((((((288) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bd81e252ed7c02b8553696ad() {
  return __cxx_static_address_bd81e252ed7c02b8553696ad.reference || (__cxx_static_address_bd81e252ed7c02b8553696ad.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND4____header_global_37d8226ac69ac012; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:150
export const ENDSEQVOL3SND5____header_global_c28668f9586ec7cd = ((((((289) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_62670a6eeea26a4f0af70e40() {
  return __cxx_static_address_62670a6eeea26a4f0af70e40.reference || (__cxx_static_address_62670a6eeea26a4f0af70e40.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND5____header_global_c28668f9586ec7cd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:151
export const ENDSEQVOL3SND6____header_global_7073d5d6cdbf7ee5 = ((((((290) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3d2438f3b8398738de3f77ff() {
  return __cxx_static_address_3d2438f3b8398738de3f77ff.reference || (__cxx_static_address_3d2438f3b8398738de3f77ff.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND6____header_global_7073d5d6cdbf7ee5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:152
export const ENDSEQVOL3SND7____header_global_b3dee13ccc2d86bf = ((((((291) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bb25c7ef4a1151f51b5ba742() {
  return __cxx_static_address_bb25c7ef4a1151f51b5ba742.reference || (__cxx_static_address_bb25c7ef4a1151f51b5ba742.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND7____header_global_b3dee13ccc2d86bf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:153
export const ENDSEQVOL3SND8____header_global_e8f906f652bb0e33 = ((((((292) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2b75975d661e28e7ff3d930a() {
  return __cxx_static_address_2b75975d661e28e7ff3d930a.reference || (__cxx_static_address_2b75975d661e28e7ff3d930a.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND8____header_global_e8f906f652bb0e33; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:154
export const ENDSEQVOL3SND9____header_global_235a5cf6851d1fa6 = ((((((293) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_012865c04b6d258e5e3aa4c5() {
  return __cxx_static_address_012865c04b6d258e5e3aa4c5.reference || (__cxx_static_address_012865c04b6d258e5e3aa4c5.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND9____header_global_235a5cf6851d1fa6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:155
export const WHIPYOURASS____header_global_745dc6bc8b84d887 = ((((((294) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fbb95c3239eec037cf562511() {
  return __cxx_static_address_fbb95c3239eec037cf562511.reference || (__cxx_static_address_fbb95c3239eec037cf562511.reference = {
    __cReference: true,
    get value() { return WHIPYOURASS____header_global_745dc6bc8b84d887; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:156
export const ENDSEQVOL2SND1____header_global_0407c96450733fca = ((((((295) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d3717e375b8cc741fdec9c99() {
  return __cxx_static_address_d3717e375b8cc741fdec9c99.reference || (__cxx_static_address_d3717e375b8cc741fdec9c99.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND1____header_global_0407c96450733fca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:157
export const ENDSEQVOL2SND2____header_global_89e2b25c094fcdc2 = ((((((296) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_44807c2306e14b422d24fd46() {
  return __cxx_static_address_44807c2306e14b422d24fd46.reference || (__cxx_static_address_44807c2306e14b422d24fd46.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND2____header_global_89e2b25c094fcdc2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:158
export const ENDSEQVOL2SND3____header_global_82e7284070c90d51 = ((((((297) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_04b3ee7a85d0afeb60e8ec1b() {
  return __cxx_static_address_04b3ee7a85d0afeb60e8ec1b.reference || (__cxx_static_address_04b3ee7a85d0afeb60e8ec1b.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND3____header_global_82e7284070c90d51; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:159
export const ENDSEQVOL2SND4____header_global_b62ce065240b2a86 = ((((((298) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cf90569c2a34c8f4e7bfc4fb() {
  return __cxx_static_address_cf90569c2a34c8f4e7bfc4fb.reference || (__cxx_static_address_cf90569c2a34c8f4e7bfc4fb.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND4____header_global_b62ce065240b2a86; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:160
export const ENDSEQVOL2SND5____header_global_a965ed8e330c3ba3 = ((((((299) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_91e2f9cf38aee5355abab20f() {
  return __cxx_static_address_91e2f9cf38aee5355abab20f.reference || (__cxx_static_address_91e2f9cf38aee5355abab20f.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND5____header_global_a965ed8e330c3ba3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:161
export const ENDSEQVOL2SND6____header_global_63580d38415b1889 = ((((((300) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_86d5238477e8acb6eebcbc36() {
  return __cxx_static_address_86d5238477e8acb6eebcbc36.reference || (__cxx_static_address_86d5238477e8acb6eebcbc36.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND6____header_global_63580d38415b1889; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:162
export const ENDSEQVOL2SND7____header_global_aa6bb54329322fe9 = ((((((301) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f8e1fcb8e77d61937a18468d() {
  return __cxx_static_address_f8e1fcb8e77d61937a18468d.reference || (__cxx_static_address_f8e1fcb8e77d61937a18468d.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND7____header_global_aa6bb54329322fe9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:163
export const SOMETHINGFROZE____header_global_0e731367773b5bd0 = ((((((303) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_646219a24bf00e5b09ae86dc() {
  return __cxx_static_address_646219a24bf00e5b09ae86dc.reference || (__cxx_static_address_646219a24bf00e5b09ae86dc.reference = {
    __cReference: true,
    get value() { return SOMETHINGFROZE____header_global_0e731367773b5bd0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:164
export const WIND_REPEAT____header_global_a2d4506be14aa63b = ((((((308) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_02eefec1e0dac0f1e4ab56fe() {
  return __cxx_static_address_02eefec1e0dac0f1e4ab56fe.reference || (__cxx_static_address_02eefec1e0dac0f1e4ab56fe.reference = {
    __cReference: true,
    get value() { return WIND_REPEAT____header_global_a2d4506be14aa63b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:165
export const BOS4_RECOG____header_global_626fcb7cb78c04e9 = ((((((342) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f7ff363452731d0def4542a3() {
  return __cxx_static_address_f7ff363452731d0def4542a3.reference || (__cxx_static_address_f7ff363452731d0def4542a3.reference = {
    __cReference: true,
    get value() { return BOS4_RECOG____header_global_626fcb7cb78c04e9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:166
export const LIGHTNING_SLAP____header_global_e185edb0df589b12 = ((((((351) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_21954bb400a4a00ab9a14068() {
  return __cxx_static_address_21954bb400a4a00ab9a14068.reference || (__cxx_static_address_21954bb400a4a00ab9a14068.reference = {
    __cReference: true,
    get value() { return LIGHTNING_SLAP____header_global_e185edb0df589b12; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:167
export const THUNDER____header_global_cf4f90e7b677c2d8 = ((((((352) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1607e787ee29f0bf4580853c() {
  return __cxx_static_address_1607e787ee29f0bf4580853c.reference || (__cxx_static_address_1607e787ee29f0bf4580853c.reference = {
    __cReference: true,
    get value() { return THUNDER____header_global_cf4f90e7b677c2d8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:168
export const INTRO4_1____header_global_29c17b6fc81bcb14 = ((((((363) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_10093e04b7faea5efeb844c9() {
  return __cxx_static_address_10093e04b7faea5efeb844c9.reference || (__cxx_static_address_10093e04b7faea5efeb844c9.reference = {
    __cReference: true,
    get value() { return INTRO4_1____header_global_29c17b6fc81bcb14; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:169
export const INTRO4_2____header_global_885956742f4c6c52 = ((((((364) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_62fc727756c5b257d98f9ec6() {
  return __cxx_static_address_62fc727756c5b257d98f9ec6.reference || (__cxx_static_address_62fc727756c5b257d98f9ec6.reference = {
    __cReference: true,
    get value() { return INTRO4_2____header_global_885956742f4c6c52; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:170
export const INTRO4_3____header_global_ebe9f377925b39ea = ((((((365) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d80ff395eb536c26929c2870() {
  return __cxx_static_address_d80ff395eb536c26929c2870.reference || (__cxx_static_address_d80ff395eb536c26929c2870.reference = {
    __cReference: true,
    get value() { return INTRO4_3____header_global_ebe9f377925b39ea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:171
export const INTRO4_4____header_global_1a4664a2687b2621 = ((((((366) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_58ed211f3722a959b259aa4b() {
  return __cxx_static_address_58ed211f3722a959b259aa4b.reference || (__cxx_static_address_58ed211f3722a959b259aa4b.reference = {
    __cReference: true,
    get value() { return INTRO4_4____header_global_1a4664a2687b2621; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:172
export const INTRO4_5____header_global_4681b38161f41c6c = ((((((367) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b126eeb750d76dab7eddea2f() {
  return __cxx_static_address_b126eeb750d76dab7eddea2f.reference || (__cxx_static_address_b126eeb750d76dab7eddea2f.reference = {
    __cReference: true,
    get value() { return INTRO4_5____header_global_4681b38161f41c6c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:173
export const INTRO4_6____header_global_58b18a3ceeb7665d = ((((((368) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3342f1600d0393c080434c1c() {
  return __cxx_static_address_3342f1600d0393c080434c1c.reference || (__cxx_static_address_3342f1600d0393c080434c1c.reference = {
    __cReference: true,
    get value() { return INTRO4_6____header_global_58b18a3ceeb7665d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:174
export const BOSS4_DEADSPEECH____header_global_e0a749f98a82b69f = ((((((370) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2ef660c3895f950cd579b204() {
  return __cxx_static_address_2ef660c3895f950cd579b204.reference || (__cxx_static_address_2ef660c3895f950cd579b204.reference = {
    __cReference: true,
    get value() { return BOSS4_DEADSPEECH____header_global_e0a749f98a82b69f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:175
export const BOSS4_FIRSTSEE____header_global_dbe799fb214b69fa = ((((((371) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ec5ee27fc2661b1e0c773253() {
  return __cxx_static_address_ec5ee27fc2661b1e0c773253.reference || (__cxx_static_address_ec5ee27fc2661b1e0c773253.reference = {
    __cReference: true,
    get value() { return BOSS4_FIRSTSEE____header_global_dbe799fb214b69fa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:176
export const VOL4ENDSND1____header_global_528a83686f744cc6 = ((((((384) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_86c278e83c44c0a0b5cf6734() {
  return __cxx_static_address_86c278e83c44c0a0b5cf6734.reference || (__cxx_static_address_86c278e83c44c0a0b5cf6734.reference = {
    __cReference: true,
    get value() { return VOL4ENDSND1____header_global_528a83686f744cc6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:177
export const VOL4ENDSND2____header_global_e9c66b28e7a5eeb4 = ((((((385) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0d942f39cd5efed530990f3b() {
  return __cxx_static_address_0d942f39cd5efed530990f3b.reference || (__cxx_static_address_0d942f39cd5efed530990f3b.reference = {
    __cReference: true,
    get value() { return VOL4ENDSND2____header_global_e9c66b28e7a5eeb4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:178
export const EXPANDERSHOOT____header_global_b711c75252123df3 = ((((((388) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6c295f3d545f73435c53b9d8() {
  return __cxx_static_address_6c295f3d545f73435c53b9d8.reference || (__cxx_static_address_6c295f3d545f73435c53b9d8.reference = {
    __cReference: true,
    get value() { return EXPANDERSHOOT____header_global_b711c75252123df3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:179
export const INTRO4_B____header_global_da733acc514c680f = ((((((392) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ae2d2ad27de0f83e2442141f() {
  return __cxx_static_address_ae2d2ad27de0f83e2442141f.reference || (__cxx_static_address_ae2d2ad27de0f83e2442141f.reference = {
    __cReference: true,
    get value() { return INTRO4_B____header_global_da733acc514c680f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:180
export const BIGBANG____header_global_89b36a4801c017e5 = ((((((393) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d405b13c2d4d2d0f8ca551df() {
  return __cxx_static_address_d405b13c2d4d2d0f8ca551df.reference || (__cxx_static_address_d405b13c2d4d2d0f8ca551df.reference = {
    __cReference: true,
    get value() { return BIGBANG____header_global_89b36a4801c017e5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:181
export const FLAMETHROWER_INTRO____header_global_18fb95012bf0eaf7 = ((((((398) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9b04b3b11fe790b6c08cbfc7() {
  return __cxx_static_address_9b04b3b11fe790b6c08cbfc7.reference || (__cxx_static_address_9b04b3b11fe790b6c08cbfc7.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER_INTRO____header_global_18fb95012bf0eaf7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:182
export const FLAMETHROWER_LOOP____header_global_6593dfdd42b16ad7 = ((((((399) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_837e13500392ee7287fda751() {
  return __cxx_static_address_837e13500392ee7287fda751.reference || (__cxx_static_address_837e13500392ee7287fda751.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER_LOOP____header_global_6593dfdd42b16ad7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:183
export const FLAMETHROWER_END____header_global_a3c9a39465603b73 = ((((((400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5f6a454ef20564d5a372a3db() {
  return __cxx_static_address_5f6a454ef20564d5a372a3db.reference || (__cxx_static_address_5f6a454ef20564d5a372a3db.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER_END____header_global_a3c9a39465603b73; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:184
export const E5L7_DUKE_QUIT_YOU____header_global_613042b61e19c8b4 = ((((((401) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f6543ff0b9853f91d8e2f4e0() {
  return __cxx_static_address_f6543ff0b9853f91d8e2f4e0.reference || (__cxx_static_address_f6543ff0b9853f91d8e2f4e0.reference = {
    __cReference: true,
    get value() { return E5L7_DUKE_QUIT_YOU____header_global_613042b61e19c8b4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:187
export const SECTOREFFECTOR____header_global_d543f6f873e19723 = ((((((1) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9f03473fe2535d679b09c5d6() {
  return __cxx_static_address_9f03473fe2535d679b09c5d6.reference || (__cxx_static_address_9f03473fe2535d679b09c5d6.reference = {
    __cReference: true,
    get value() { return SECTOREFFECTOR____header_global_d543f6f873e19723; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:188
export const ACTIVATOR____header_global_3b23bede0d65e74c = ((((((2) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3429ea4e519ea59b1326c4dd() {
  return __cxx_static_address_3429ea4e519ea59b1326c4dd.reference || (__cxx_static_address_3429ea4e519ea59b1326c4dd.reference = {
    __cReference: true,
    get value() { return ACTIVATOR____header_global_3b23bede0d65e74c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:189
export const TOUCHPLATE____header_global_1279fafc51df1fc3 = ((((((3) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f77bbbb1aceb4020e00df031() {
  return __cxx_static_address_f77bbbb1aceb4020e00df031.reference || (__cxx_static_address_f77bbbb1aceb4020e00df031.reference = {
    __cReference: true,
    get value() { return TOUCHPLATE____header_global_1279fafc51df1fc3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:190
export const ACTIVATORLOCKED____header_global_11c172ed7b281226 = ((((((4) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7585261a287d1580f86371ac() {
  return __cxx_static_address_7585261a287d1580f86371ac.reference || (__cxx_static_address_7585261a287d1580f86371ac.reference = {
    __cReference: true,
    get value() { return ACTIVATORLOCKED____header_global_11c172ed7b281226; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:191
export const MUSICANDSFX____header_global_b69ffcce1952ab1e = ((((((5) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_11f013a91bc7bde73501c45f() {
  return __cxx_static_address_11f013a91bc7bde73501c45f.reference || (__cxx_static_address_11f013a91bc7bde73501c45f.reference = {
    __cReference: true,
    get value() { return MUSICANDSFX____header_global_b69ffcce1952ab1e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:192
export const LOCATORS____header_global_a832d3c8cc8f47ea = ((((((6) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6debb1d9b3f14a1d33c21836() {
  return __cxx_static_address_6debb1d9b3f14a1d33c21836.reference || (__cxx_static_address_6debb1d9b3f14a1d33c21836.reference = {
    __cReference: true,
    get value() { return LOCATORS____header_global_a832d3c8cc8f47ea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:193
export const CYCLER____header_global_ff9eb7d8bbb7cdf0 = ((((((7) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1931fde7eeb1c6530893bb71() {
  return __cxx_static_address_1931fde7eeb1c6530893bb71.reference || (__cxx_static_address_1931fde7eeb1c6530893bb71.reference = {
    __cReference: true,
    get value() { return CYCLER____header_global_ff9eb7d8bbb7cdf0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:194
export const MASTERSWITCH____header_global_390518ea40e8b381 = ((((((8) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_555d7b0dd16c3bfb594dfcb7() {
  return __cxx_static_address_555d7b0dd16c3bfb594dfcb7.reference || (__cxx_static_address_555d7b0dd16c3bfb594dfcb7.reference = {
    __cReference: true,
    get value() { return MASTERSWITCH____header_global_390518ea40e8b381; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:195
export const RESPAWN____header_global_3838fbbad0a83b9e = ((((((9) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_44337b33dba58131087d6781() {
  return __cxx_static_address_44337b33dba58131087d6781.reference || (__cxx_static_address_44337b33dba58131087d6781.reference = {
    __cReference: true,
    get value() { return RESPAWN____header_global_3838fbbad0a83b9e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:196
export const GPSPEED____header_global_d4bb77e99de7fc98 = ((((((10) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c41f83ad392443fee2dfa1ca() {
  return __cxx_static_address_c41f83ad392443fee2dfa1ca.reference || (__cxx_static_address_c41f83ad392443fee2dfa1ca.reference = {
    __cReference: true,
    get value() { return GPSPEED____header_global_d4bb77e99de7fc98; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:197
export const FOF____header_global_84d5d299f81c95ef = ((((((13) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a75abbe35844463fcf969eb6() {
  return __cxx_static_address_a75abbe35844463fcf969eb6.reference || (__cxx_static_address_a75abbe35844463fcf969eb6.reference = {
    __cReference: true,
    get value() { return FOF____header_global_84d5d299f81c95ef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:198
export const ARROW____header_global_ba9cd314a8f5fcbb = ((((((20) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0b0a6b94381b610b2f578e40() {
  return __cxx_static_address_0b0a6b94381b610b2f578e40.reference || (__cxx_static_address_0b0a6b94381b610b2f578e40.reference = {
    __cReference: true,
    get value() { return ARROW____header_global_ba9cd314a8f5fcbb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:199
export const FIRSTGUNSPRITE____header_global_1878865817f56861 = ((((((21) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cfd9fea780afb12ae7d0c0e6() {
  return __cxx_static_address_cfd9fea780afb12ae7d0c0e6.reference || (__cxx_static_address_cfd9fea780afb12ae7d0c0e6.reference = {
    __cReference: true,
    get value() { return FIRSTGUNSPRITE____header_global_1878865817f56861; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:200
export const CHAINGUNSPRITE____header_global_bb69ce9056fb2814 = ((((((22) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9ae011d1eafec9d010cc0f9a() {
  return __cxx_static_address_9ae011d1eafec9d010cc0f9a.reference || (__cxx_static_address_9ae011d1eafec9d010cc0f9a.reference = {
    __cReference: true,
    get value() { return CHAINGUNSPRITE____header_global_bb69ce9056fb2814; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:201
export const RPGSPRITE____header_global_5628869928ff1a49 = ((((((23) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7628fd54a8b9c2d735172615() {
  return __cxx_static_address_7628fd54a8b9c2d735172615.reference || (__cxx_static_address_7628fd54a8b9c2d735172615.reference = {
    __cReference: true,
    get value() { return RPGSPRITE____header_global_5628869928ff1a49; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:202
export const FREEZESPRITE____header_global_93a617349ddc87c0 = ((((((24) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_04473fee7ed2eb444451234e() {
  return __cxx_static_address_04473fee7ed2eb444451234e.reference || (__cxx_static_address_04473fee7ed2eb444451234e.reference = {
    __cReference: true,
    get value() { return FREEZESPRITE____header_global_93a617349ddc87c0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:203
export const SHRINKERSPRITE____header_global_e80ee586c5d56908 = ((((((25) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_feda050374a158c7b707da6b() {
  return __cxx_static_address_feda050374a158c7b707da6b.reference || (__cxx_static_address_feda050374a158c7b707da6b.reference = {
    __cReference: true,
    get value() { return SHRINKERSPRITE____header_global_e80ee586c5d56908; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:204
export const HEAVYHBOMB____header_global_1f873c51d387177d = ((((((26) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b74c89139b999500a0f264eb() {
  return __cxx_static_address_b74c89139b999500a0f264eb.reference || (__cxx_static_address_b74c89139b999500a0f264eb.reference = {
    __cReference: true,
    get value() { return HEAVYHBOMB____header_global_1f873c51d387177d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:205
export const TRIPBOMBSPRITE____header_global_6f4081d2b6124f26 = ((((((27) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_49408f21351468e8d889f869() {
  return __cxx_static_address_49408f21351468e8d889f869.reference || (__cxx_static_address_49408f21351468e8d889f869.reference = {
    __cReference: true,
    get value() { return TRIPBOMBSPRITE____header_global_6f4081d2b6124f26; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:206
export const SHOTGUNSPRITE____header_global_cc363fc90ffb60f7 = ((((((28) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a47c5789c4245aba7bc59754() {
  return __cxx_static_address_a47c5789c4245aba7bc59754.reference || (__cxx_static_address_a47c5789c4245aba7bc59754.reference = {
    __cReference: true,
    get value() { return SHOTGUNSPRITE____header_global_cc363fc90ffb60f7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:207
export const DEVISTATORSPRITE____header_global_c34e39bed4ae92d4 = ((((((29) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9c1e39fd7b145a33ac278ed7() {
  return __cxx_static_address_9c1e39fd7b145a33ac278ed7.reference || (__cxx_static_address_9c1e39fd7b145a33ac278ed7.reference = {
    __cReference: true,
    get value() { return DEVISTATORSPRITE____header_global_c34e39bed4ae92d4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:208
export const HEALTHBOX____header_global_788694a741385474 = ((((((30) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9a881fd91281a8b0f6a15892() {
  return __cxx_static_address_9a881fd91281a8b0f6a15892.reference || (__cxx_static_address_9a881fd91281a8b0f6a15892.reference = {
    __cReference: true,
    get value() { return HEALTHBOX____header_global_788694a741385474; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:209
export const AMMOBOX____header_global_3775a45dd4b9e2e8 = ((((((31) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_95333aab8ee980226664ea58() {
  return __cxx_static_address_95333aab8ee980226664ea58.reference || (__cxx_static_address_95333aab8ee980226664ea58.reference = {
    __cReference: true,
    get value() { return AMMOBOX____header_global_3775a45dd4b9e2e8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:210
export const GROWSPRITEICON____header_global_552599abfe6138bc = ((((((32) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a471f70fa52962f11ab1bf32() {
  return __cxx_static_address_a471f70fa52962f11ab1bf32.reference || (__cxx_static_address_a471f70fa52962f11ab1bf32.reference = {
    __cReference: true,
    get value() { return GROWSPRITEICON____header_global_552599abfe6138bc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:211
export const INVENTORYBOX____header_global_f97b97979c6beed5 = ((((((33) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_36055d7b99e2e2680169c66a() {
  return __cxx_static_address_36055d7b99e2e2680169c66a.reference || (__cxx_static_address_36055d7b99e2e2680169c66a.reference = {
    __cReference: true,
    get value() { return INVENTORYBOX____header_global_f97b97979c6beed5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:212
export const FREEZEAMMO____header_global_ea69f8f0cc5a955f = ((((((37) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6e610512184b755cdd3b295b() {
  return __cxx_static_address_6e610512184b755cdd3b295b.reference || (__cxx_static_address_6e610512184b755cdd3b295b.reference = {
    __cReference: true,
    get value() { return FREEZEAMMO____header_global_ea69f8f0cc5a955f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:213
export const AMMO____header_global_a1b869b0921d5632 = ((((((40) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_55eca922625cea7cc2e7c436() {
  return __cxx_static_address_55eca922625cea7cc2e7c436.reference || (__cxx_static_address_55eca922625cea7cc2e7c436.reference = {
    __cReference: true,
    get value() { return AMMO____header_global_a1b869b0921d5632; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:214
export const BATTERYAMMO____header_global_775ac50a414ad08d = ((((((41) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b2e8de7a204632217dad26d6() {
  return __cxx_static_address_b2e8de7a204632217dad26d6.reference || (__cxx_static_address_b2e8de7a204632217dad26d6.reference = {
    __cReference: true,
    get value() { return BATTERYAMMO____header_global_775ac50a414ad08d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:215
export const DEVISTATORAMMO____header_global_f2c7a254e69a4a58 = ((((((42) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_99362d99f827c799a7b7ad3e() {
  return __cxx_static_address_99362d99f827c799a7b7ad3e.reference || (__cxx_static_address_99362d99f827c799a7b7ad3e.reference = {
    __cReference: true,
    get value() { return DEVISTATORAMMO____header_global_f2c7a254e69a4a58; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:216
export const RPGAMMO____header_global_b0c3b3ba89a92fc7 = ((((((44) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5297bfc4b0947b52002497b6() {
  return __cxx_static_address_5297bfc4b0947b52002497b6.reference || (__cxx_static_address_5297bfc4b0947b52002497b6.reference = {
    __cReference: true,
    get value() { return RPGAMMO____header_global_b0c3b3ba89a92fc7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:217
export const GROWAMMO____header_global_34702fb287ed7540 = ((((((45) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6c382db9935741a355b14347() {
  return __cxx_static_address_6c382db9935741a355b14347.reference || (__cxx_static_address_6c382db9935741a355b14347.reference = {
    __cReference: true,
    get value() { return GROWAMMO____header_global_34702fb287ed7540; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:218
export const CRYSTALAMMO____header_global_87d6c08959dec93e = ((((((46) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2972123884fc699e812273a6() {
  return __cxx_static_address_2972123884fc699e812273a6.reference || (__cxx_static_address_2972123884fc699e812273a6.reference = {
    __cReference: true,
    get value() { return CRYSTALAMMO____header_global_87d6c08959dec93e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:219
export const HBOMBAMMO____header_global_70353939954d4ab0 = ((((((47) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1f0d3769f9388fe979a0bf42() {
  return __cxx_static_address_1f0d3769f9388fe979a0bf42.reference || (__cxx_static_address_1f0d3769f9388fe979a0bf42.reference = {
    __cReference: true,
    get value() { return HBOMBAMMO____header_global_70353939954d4ab0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:220
export const AMMOLOTS____header_global_39384ee2de63f926 = ((((((48) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b4c14e1f97471663ce0b0271() {
  return __cxx_static_address_b4c14e1f97471663ce0b0271.reference || (__cxx_static_address_b4c14e1f97471663ce0b0271.reference = {
    __cReference: true,
    get value() { return AMMOLOTS____header_global_39384ee2de63f926; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:221
export const SHOTGUNAMMO____header_global_79fa36b501f968d5 = ((((((49) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_963734e86de2d75af70c228b() {
  return __cxx_static_address_963734e86de2d75af70c228b.reference || (__cxx_static_address_963734e86de2d75af70c228b.reference = {
    __cReference: true,
    get value() { return SHOTGUNAMMO____header_global_79fa36b501f968d5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:222
export const COLA____header_global_cd5e71e90c3b72ae = ((((((51) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ad34b6c595ed13a8bec77ebe() {
  return __cxx_static_address_ad34b6c595ed13a8bec77ebe.reference || (__cxx_static_address_ad34b6c595ed13a8bec77ebe.reference = {
    __cReference: true,
    get value() { return COLA____header_global_cd5e71e90c3b72ae; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:223
export const SIXPAK____header_global_ef44700a06eeec5c = ((((((52) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5055404545364702ec15bf4c() {
  return __cxx_static_address_5055404545364702ec15bf4c.reference || (__cxx_static_address_5055404545364702ec15bf4c.reference = {
    __cReference: true,
    get value() { return SIXPAK____header_global_ef44700a06eeec5c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:224
export const FIRSTAID____header_global_33fc5cb1a62e43e4 = ((((((53) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d32458fadcaa4ff674a3085e() {
  return __cxx_static_address_d32458fadcaa4ff674a3085e.reference || (__cxx_static_address_d32458fadcaa4ff674a3085e.reference = {
    __cReference: true,
    get value() { return FIRSTAID____header_global_33fc5cb1a62e43e4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:225
export const SHIELD____header_global_055dd33f4563e3e6 = ((((((54) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_285cf32a6a42ba2a87768dc5() {
  return __cxx_static_address_285cf32a6a42ba2a87768dc5.reference || (__cxx_static_address_285cf32a6a42ba2a87768dc5.reference = {
    __cReference: true,
    get value() { return SHIELD____header_global_055dd33f4563e3e6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:226
export const STEROIDS____header_global_133674b792cdbde9 = ((((((55) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aef9794af3fbc5d343514d2d() {
  return __cxx_static_address_aef9794af3fbc5d343514d2d.reference || (__cxx_static_address_aef9794af3fbc5d343514d2d.reference = {
    __cReference: true,
    get value() { return STEROIDS____header_global_133674b792cdbde9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:227
export const AIRTANK____header_global_9151efd3e9a513cc = ((((((56) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_620cc944d61643ed8a9ed6a9() {
  return __cxx_static_address_620cc944d61643ed8a9ed6a9.reference || (__cxx_static_address_620cc944d61643ed8a9ed6a9.reference = {
    __cReference: true,
    get value() { return AIRTANK____header_global_9151efd3e9a513cc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:228
export const JETPACK____header_global_1588d2cab92359bd = ((((((57) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_453ab3f48b7368d29788a79d() {
  return __cxx_static_address_453ab3f48b7368d29788a79d.reference || (__cxx_static_address_453ab3f48b7368d29788a79d.reference = {
    __cReference: true,
    get value() { return JETPACK____header_global_1588d2cab92359bd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:229
export const HEATSENSOR____header_global_07eecd23d0e74ede = ((((((59) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ea6e1299fb7e71aa3d415870() {
  return __cxx_static_address_ea6e1299fb7e71aa3d415870.reference || (__cxx_static_address_ea6e1299fb7e71aa3d415870.reference = {
    __cReference: true,
    get value() { return HEATSENSOR____header_global_07eecd23d0e74ede; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:230
export const ACCESSCARD____header_global_09a8bd845dd1de4c = ((((((60) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1bd04ab8bd86a18b281bea5f() {
  return __cxx_static_address_1bd04ab8bd86a18b281bea5f.reference || (__cxx_static_address_1bd04ab8bd86a18b281bea5f.reference = {
    __cReference: true,
    get value() { return ACCESSCARD____header_global_09a8bd845dd1de4c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:231
export const BOOTS____header_global_447fc0959a27d436 = ((((((61) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2950e6e30a0a99e6fcf0133b() {
  return __cxx_static_address_2950e6e30a0a99e6fcf0133b.reference || (__cxx_static_address_2950e6e30a0a99e6fcf0133b.reference = {
    __cReference: true,
    get value() { return BOOTS____header_global_447fc0959a27d436; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:232
export const MIRRORBROKE____header_global_a0ea34a5e3442355 = ((((((70) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0bcefb72d66a99cfa4c313b7() {
  return __cxx_static_address_0bcefb72d66a99cfa4c313b7.reference || (__cxx_static_address_0bcefb72d66a99cfa4c313b7.reference = {
    __cReference: true,
    get value() { return MIRRORBROKE____header_global_a0ea34a5e3442355; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:233
export const CLOUDYOCEAN____header_global_21a7f4a44def9cb7 = ((((((78) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_714c508e7063b5239478ae24() {
  return __cxx_static_address_714c508e7063b5239478ae24.reference || (__cxx_static_address_714c508e7063b5239478ae24.reference = {
    __cReference: true,
    get value() { return CLOUDYOCEAN____header_global_21a7f4a44def9cb7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:234
export const CLOUDYSKIES____header_global_e87b5e27ea7fd651 = ((((((79) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9c541cad32c7e4ebce7ac0cf() {
  return __cxx_static_address_9c541cad32c7e4ebce7ac0cf.reference || (__cxx_static_address_9c541cad32c7e4ebce7ac0cf.reference = {
    __cReference: true,
    get value() { return CLOUDYSKIES____header_global_e87b5e27ea7fd651; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:235
export const MOONSKY1____header_global_d482158a02aa53ea = ((((((80) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ee56aba4de9a4999e31bd15b() {
  return __cxx_static_address_ee56aba4de9a4999e31bd15b.reference || (__cxx_static_address_ee56aba4de9a4999e31bd15b.reference = {
    __cReference: true,
    get value() { return MOONSKY1____header_global_d482158a02aa53ea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:236
export const BIGORBIT1____header_global_a9cf5f7251f7c5b0 = ((((((84) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e3e4b140dd2981f1c97af481() {
  return __cxx_static_address_e3e4b140dd2981f1c97af481.reference || (__cxx_static_address_e3e4b140dd2981f1c97af481.reference = {
    __cReference: true,
    get value() { return BIGORBIT1____header_global_a9cf5f7251f7c5b0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:237
export const LA____header_global_51ba4d6ea6fc50c4 = ((((((89) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c1f996a012402f61f2c26e4c() {
  return __cxx_static_address_c1f996a012402f61f2c26e4c.reference || (__cxx_static_address_c1f996a012402f61f2c26e4c.reference = {
    __cReference: true,
    get value() { return LA____header_global_51ba4d6ea6fc50c4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:238
export const ATOMICHEALTH____header_global_b246cdc24aec40b6 = ((((((100) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a5cc437126de587e84b06d6f() {
  return __cxx_static_address_a5cc437126de587e84b06d6f.reference || (__cxx_static_address_a5cc437126de587e84b06d6f.reference = {
    __cReference: true,
    get value() { return ATOMICHEALTH____header_global_b246cdc24aec40b6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:239
export const TECHLIGHT2____header_global_77529e0d97496be1 = ((((((120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_81d262aee166ad018bfb0d5b() {
  return __cxx_static_address_81d262aee166ad018bfb0d5b.reference || (__cxx_static_address_81d262aee166ad018bfb0d5b.reference = {
    __cReference: true,
    get value() { return TECHLIGHT2____header_global_77529e0d97496be1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:240
export const TECHLIGHTBUST2____header_global_29b2f0a882199e1c = ((((((121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2b40ebd46dc462e1f0716060() {
  return __cxx_static_address_2b40ebd46dc462e1f0716060.reference || (__cxx_static_address_2b40ebd46dc462e1f0716060.reference = {
    __cReference: true,
    get value() { return TECHLIGHTBUST2____header_global_29b2f0a882199e1c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:241
export const TECHLIGHT4____header_global_ddf85582fea79b18 = ((((((122) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b36057602c861e51e621707a() {
  return __cxx_static_address_b36057602c861e51e621707a.reference || (__cxx_static_address_b36057602c861e51e621707a.reference = {
    __cReference: true,
    get value() { return TECHLIGHT4____header_global_ddf85582fea79b18; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:242
export const TECHLIGHTBUST4____header_global_7c5f35cb3c10d48c = ((((((123) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1b8b83f13aa6641ebbb09ec8() {
  return __cxx_static_address_1b8b83f13aa6641ebbb09ec8.reference || (__cxx_static_address_1b8b83f13aa6641ebbb09ec8.reference = {
    __cReference: true,
    get value() { return TECHLIGHTBUST4____header_global_7c5f35cb3c10d48c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:243
export const WALLLIGHT4____header_global_3a945c60b26a6295 = ((((((124) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_38738ad973afd7cf57bc52b3() {
  return __cxx_static_address_38738ad973afd7cf57bc52b3.reference || (__cxx_static_address_38738ad973afd7cf57bc52b3.reference = {
    __cReference: true,
    get value() { return WALLLIGHT4____header_global_3a945c60b26a6295; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:244
export const WALLLIGHTBUST4____header_global_c9fbd323aed5d68b = ((((((125) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b8ea2e837a5dde1d7f2ce6bd() {
  return __cxx_static_address_b8ea2e837a5dde1d7f2ce6bd.reference || (__cxx_static_address_b8ea2e837a5dde1d7f2ce6bd.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST4____header_global_c9fbd323aed5d68b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:245
export const ACCESSSWITCH____header_global_1803e672a520e676 = ((((((130) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_595edf7b7866fae520472585() {
  return __cxx_static_address_595edf7b7866fae520472585.reference || (__cxx_static_address_595edf7b7866fae520472585.reference = {
    __cReference: true,
    get value() { return ACCESSSWITCH____header_global_1803e672a520e676; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:246
export const SLOTDOOR____header_global_86f6b3b4a6831ddb = ((((((132) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5ccb1adbd90c0e3641b9e6d7() {
  return __cxx_static_address_5ccb1adbd90c0e3641b9e6d7.reference || (__cxx_static_address_5ccb1adbd90c0e3641b9e6d7.reference = {
    __cReference: true,
    get value() { return SLOTDOOR____header_global_86f6b3b4a6831ddb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:247
export const LIGHTSWITCH____header_global_b13b4da2400eec4c = ((((((134) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1c13083d276bf0a4535b6bfd() {
  return __cxx_static_address_1c13083d276bf0a4535b6bfd.reference || (__cxx_static_address_1c13083d276bf0a4535b6bfd.reference = {
    __cReference: true,
    get value() { return LIGHTSWITCH____header_global_b13b4da2400eec4c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:248
export const SPACEDOORSWITCH____header_global_3bfa1c35253ef31a = ((((((136) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_296dc3392ad9d6a106f0d97a() {
  return __cxx_static_address_296dc3392ad9d6a106f0d97a.reference || (__cxx_static_address_296dc3392ad9d6a106f0d97a.reference = {
    __cReference: true,
    get value() { return SPACEDOORSWITCH____header_global_3bfa1c35253ef31a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:249
export const SPACELIGHTSWITCH____header_global_e56356eb599c217b = ((((((138) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fb414586e42ac995a34496da() {
  return __cxx_static_address_fb414586e42ac995a34496da.reference || (__cxx_static_address_fb414586e42ac995a34496da.reference = {
    __cReference: true,
    get value() { return SPACELIGHTSWITCH____header_global_e56356eb599c217b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:250
export const FRANKENSTINESWITCH____header_global_99e1d7dd78611c4c = ((((((140) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7f518bb213afc5e68e590167() {
  return __cxx_static_address_7f518bb213afc5e68e590167.reference || (__cxx_static_address_7f518bb213afc5e68e590167.reference = {
    __cReference: true,
    get value() { return FRANKENSTINESWITCH____header_global_99e1d7dd78611c4c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:251
export const NUKEBUTTON____header_global_75db238e3648b9ac = ((((((142) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_05f7058745d90d6c3e3bb7e8() {
  return __cxx_static_address_05f7058745d90d6c3e3bb7e8.reference || (__cxx_static_address_05f7058745d90d6c3e3bb7e8.reference = {
    __cReference: true,
    get value() { return NUKEBUTTON____header_global_75db238e3648b9ac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:252
export const MULTISWITCH____header_global_b8d720a3674a0764 = ((((((146) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_77e5453db63d9f1d6c74e713() {
  return __cxx_static_address_77e5453db63d9f1d6c74e713.reference || (__cxx_static_address_77e5453db63d9f1d6c74e713.reference = {
    __cReference: true,
    get value() { return MULTISWITCH____header_global_b8d720a3674a0764; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:253
export const DOORTILE5____header_global_eaf7038b7ee20490 = ((((((150) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3090b01917e1a1dfac03f944() {
  return __cxx_static_address_3090b01917e1a1dfac03f944.reference || (__cxx_static_address_3090b01917e1a1dfac03f944.reference = {
    __cReference: true,
    get value() { return DOORTILE5____header_global_eaf7038b7ee20490; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:254
export const DOORTILE6____header_global_c08ce1372051c2ee = ((((((151) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4dd279b9ccdb122c202d9373() {
  return __cxx_static_address_4dd279b9ccdb122c202d9373.reference || (__cxx_static_address_4dd279b9ccdb122c202d9373.reference = {
    __cReference: true,
    get value() { return DOORTILE6____header_global_c08ce1372051c2ee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:255
export const DOORTILE1____header_global_f77bf9ab34f3d2e0 = ((((((152) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dc00c8f7f780c2627b3db4d4() {
  return __cxx_static_address_dc00c8f7f780c2627b3db4d4.reference || (__cxx_static_address_dc00c8f7f780c2627b3db4d4.reference = {
    __cReference: true,
    get value() { return DOORTILE1____header_global_f77bf9ab34f3d2e0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:256
export const DOORTILE2____header_global_7d413da13d827c52 = ((((((153) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ee9374ab563413acc36b6779() {
  return __cxx_static_address_ee9374ab563413acc36b6779.reference || (__cxx_static_address_ee9374ab563413acc36b6779.reference = {
    __cReference: true,
    get value() { return DOORTILE2____header_global_7d413da13d827c52; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:257
export const DOORTILE3____header_global_262297649a1bb284 = ((((((154) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f7804cc495dc693b12002c4a() {
  return __cxx_static_address_f7804cc495dc693b12002c4a.reference || (__cxx_static_address_f7804cc495dc693b12002c4a.reference = {
    __cReference: true,
    get value() { return DOORTILE3____header_global_262297649a1bb284; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:258
export const DOORTILE4____header_global_b19d486d87f2bc9f = ((((((155) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_82ac475a623d5929853973c4() {
  return __cxx_static_address_82ac475a623d5929853973c4.reference || (__cxx_static_address_82ac475a623d5929853973c4.reference = {
    __cReference: true,
    get value() { return DOORTILE4____header_global_b19d486d87f2bc9f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:259
export const DOORTILE7____header_global_00efa6a38817d3b0 = ((((((156) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_823158f14c04bf8b6eac6379() {
  return __cxx_static_address_823158f14c04bf8b6eac6379.reference || (__cxx_static_address_823158f14c04bf8b6eac6379.reference = {
    __cReference: true,
    get value() { return DOORTILE7____header_global_00efa6a38817d3b0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:260
export const DOORTILE8____header_global_82303186efc6855e = ((((((157) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3dd62402a44157b7e26613a3() {
  return __cxx_static_address_3dd62402a44157b7e26613a3.reference || (__cxx_static_address_3dd62402a44157b7e26613a3.reference = {
    __cReference: true,
    get value() { return DOORTILE8____header_global_82303186efc6855e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:261
export const DOORTILE9____header_global_f938ee5ae2cc4355 = ((((((158) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_76a5069261eddf7156867386() {
  return __cxx_static_address_76a5069261eddf7156867386.reference || (__cxx_static_address_76a5069261eddf7156867386.reference = {
    __cReference: true,
    get value() { return DOORTILE9____header_global_f938ee5ae2cc4355; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:262
export const DOORTILE10____header_global_639fcf0a6ff74850 = ((((((159) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7e4e4a7d0e5a7da9104cadb1() {
  return __cxx_static_address_7e4e4a7d0e5a7da9104cadb1.reference || (__cxx_static_address_7e4e4a7d0e5a7da9104cadb1.reference = {
    __cReference: true,
    get value() { return DOORTILE10____header_global_639fcf0a6ff74850; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:263
export const DOORSHOCK____header_global_120f5091b9d8da59 = ((((((160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b14471e9e1f3dec46b1a07a5() {
  return __cxx_static_address_b14471e9e1f3dec46b1a07a5.reference || (__cxx_static_address_b14471e9e1f3dec46b1a07a5.reference = {
    __cReference: true,
    get value() { return DOORSHOCK____header_global_120f5091b9d8da59; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:264
export const DIPSWITCH____header_global_c113de149c73faf3 = ((((((162) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3b7da16a7f77b2b725286b13() {
  return __cxx_static_address_3b7da16a7f77b2b725286b13.reference || (__cxx_static_address_3b7da16a7f77b2b725286b13.reference = {
    __cReference: true,
    get value() { return DIPSWITCH____header_global_c113de149c73faf3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:265
export const DIPSWITCH2____header_global_37f0025fde7e83a0 = ((((((164) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_649a81483df524569cc53c4f() {
  return __cxx_static_address_649a81483df524569cc53c4f.reference || (__cxx_static_address_649a81483df524569cc53c4f.reference = {
    __cReference: true,
    get value() { return DIPSWITCH2____header_global_37f0025fde7e83a0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:266
export const TECHSWITCH____header_global_dd721276ae326a49 = ((((((166) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a4752f0f68fd38732ad31227() {
  return __cxx_static_address_a4752f0f68fd38732ad31227.reference || (__cxx_static_address_a4752f0f68fd38732ad31227.reference = {
    __cReference: true,
    get value() { return TECHSWITCH____header_global_dd721276ae326a49; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:267
export const DIPSWITCH3____header_global_7e843c8d2a53b230 = ((((((168) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_434f9cc4364a4d864ac4cc75() {
  return __cxx_static_address_434f9cc4364a4d864ac4cc75.reference || (__cxx_static_address_434f9cc4364a4d864ac4cc75.reference = {
    __cReference: true,
    get value() { return DIPSWITCH3____header_global_7e843c8d2a53b230; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:268
export const ACCESSSWITCH2____header_global_e547d46bc635e43c = ((((((170) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e3536531c8c70c27169b6710() {
  return __cxx_static_address_e3536531c8c70c27169b6710.reference || (__cxx_static_address_e3536531c8c70c27169b6710.reference = {
    __cReference: true,
    get value() { return ACCESSSWITCH2____header_global_e547d46bc635e43c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:269
export const FLOORSLIME____header_global_fa1ff3515d32ebe4 = ((((((200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_657ad555bb6e085d0922fe2f() {
  return __cxx_static_address_657ad555bb6e085d0922fe2f.reference || (__cxx_static_address_657ad555bb6e085d0922fe2f.reference = {
    __cReference: true,
    get value() { return FLOORSLIME____header_global_fa1ff3515d32ebe4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:270
export const BIGFORCE____header_global_b9f9070d32fc4668 = ((((((230) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_969e6e63d19ac6bf77fbbeea() {
  return __cxx_static_address_969e6e63d19ac6bf77fbbeea.reference || (__cxx_static_address_969e6e63d19ac6bf77fbbeea.reference = {
    __cReference: true,
    get value() { return BIGFORCE____header_global_b9f9070d32fc4668; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:271
export const MASKWALL9____header_global_b2b5bef9b520ee68 = ((((((255) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a669d828787b1c94545f8695() {
  return __cxx_static_address_a669d828787b1c94545f8695.reference || (__cxx_static_address_a669d828787b1c94545f8695.reference = {
    __cReference: true,
    get value() { return MASKWALL9____header_global_b2b5bef9b520ee68; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:272
export const SCREENBREAK1____header_global_0bfd9a4929fa7ca9 = ((((((263) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1e3f7b98aec4852d24505b3e() {
  return __cxx_static_address_1e3f7b98aec4852d24505b3e.reference || (__cxx_static_address_1e3f7b98aec4852d24505b3e.reference = {
    __cReference: true,
    get value() { return SCREENBREAK1____header_global_0bfd9a4929fa7ca9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:273
export const SCREENBREAK2____header_global_590ace973b916de8 = ((((((264) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b1ac3d58fd48aa15d3f1ffd5() {
  return __cxx_static_address_b1ac3d58fd48aa15d3f1ffd5.reference || (__cxx_static_address_b1ac3d58fd48aa15d3f1ffd5.reference = {
    __cReference: true,
    get value() { return SCREENBREAK2____header_global_590ace973b916de8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:274
export const SCREENBREAK3____header_global_4223a5a347870a35 = ((((((265) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3f99f27923c559bad291941e() {
  return __cxx_static_address_3f99f27923c559bad291941e.reference || (__cxx_static_address_3f99f27923c559bad291941e.reference = {
    __cReference: true,
    get value() { return SCREENBREAK3____header_global_4223a5a347870a35; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:275
export const SCREENBREAK4____header_global_46658969e53c6c7f = ((((((266) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e3893e3fa70b3ca74ecce555() {
  return __cxx_static_address_e3893e3fa70b3ca74ecce555.reference || (__cxx_static_address_e3893e3fa70b3ca74ecce555.reference = {
    __cReference: true,
    get value() { return SCREENBREAK4____header_global_46658969e53c6c7f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:276
export const SCREENBREAK5____header_global_0379db18750bbcc1 = ((((((267) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dfdce1fd9b221ed2216fd7a7() {
  return __cxx_static_address_dfdce1fd9b221ed2216fd7a7.reference || (__cxx_static_address_dfdce1fd9b221ed2216fd7a7.reference = {
    __cReference: true,
    get value() { return SCREENBREAK5____header_global_0379db18750bbcc1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:277
export const SCREENBREAK6____header_global_82fa85840f02aa7f = ((((((268) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1e5698c6d4ebb4205e5904f5() {
  return __cxx_static_address_1e5698c6d4ebb4205e5904f5.reference || (__cxx_static_address_1e5698c6d4ebb4205e5904f5.reference = {
    __cReference: true,
    get value() { return SCREENBREAK6____header_global_82fa85840f02aa7f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:278
export const SCREENBREAK7____header_global_ed8d238abfcadb65 = ((((((269) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_581df66f9475c725faf97f5d() {
  return __cxx_static_address_581df66f9475c725faf97f5d.reference || (__cxx_static_address_581df66f9475c725faf97f5d.reference = {
    __cReference: true,
    get value() { return SCREENBREAK7____header_global_ed8d238abfcadb65; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:279
export const SCREENBREAK8____header_global_e5d92eda23acd27a = ((((((270) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_710cce5e7279ebbb3fad8767() {
  return __cxx_static_address_710cce5e7279ebbb3fad8767.reference || (__cxx_static_address_710cce5e7279ebbb3fad8767.reference = {
    __cReference: true,
    get value() { return SCREENBREAK8____header_global_e5d92eda23acd27a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:280
export const SCREENBREAK9____header_global_d5ce9202ed34bcde = ((((((271) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_704902f5a0290c0695db5ebe() {
  return __cxx_static_address_704902f5a0290c0695db5ebe.reference || (__cxx_static_address_704902f5a0290c0695db5ebe.reference = {
    __cReference: true,
    get value() { return SCREENBREAK9____header_global_d5ce9202ed34bcde; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:281
export const SCREENBREAK10____header_global_c530e1a381cac89a = ((((((272) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c096d2648ffc944d8dca1268() {
  return __cxx_static_address_c096d2648ffc944d8dca1268.reference || (__cxx_static_address_c096d2648ffc944d8dca1268.reference = {
    __cReference: true,
    get value() { return SCREENBREAK10____header_global_c530e1a381cac89a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:282
export const SCREENBREAK11____header_global_4d69217d96b8c8ee = ((((((273) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_99a00a88b322dc208eaf848d() {
  return __cxx_static_address_99a00a88b322dc208eaf848d.reference || (__cxx_static_address_99a00a88b322dc208eaf848d.reference = {
    __cReference: true,
    get value() { return SCREENBREAK11____header_global_4d69217d96b8c8ee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:283
export const SCREENBREAK12____header_global_2d75d43beff8a999 = ((((((274) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dca6f09f65fbd8f8e24477b4() {
  return __cxx_static_address_dca6f09f65fbd8f8e24477b4.reference || (__cxx_static_address_dca6f09f65fbd8f8e24477b4.reference = {
    __cReference: true,
    get value() { return SCREENBREAK12____header_global_2d75d43beff8a999; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:284
export const SCREENBREAK13____header_global_5b783221166a375e = ((((((275) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d8f95988610fd95b26c30199() {
  return __cxx_static_address_d8f95988610fd95b26c30199.reference || (__cxx_static_address_d8f95988610fd95b26c30199.reference = {
    __cReference: true,
    get value() { return SCREENBREAK13____header_global_5b783221166a375e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:285
export const MASKWALL1____header_global_b77fa0bd1b5008e2 = ((((((285) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5e5f7bb18b43eb0b3b480e64() {
  return __cxx_static_address_5e5f7bb18b43eb0b3b480e64.reference || (__cxx_static_address_5e5f7bb18b43eb0b3b480e64.reference = {
    __cReference: true,
    get value() { return MASKWALL1____header_global_b77fa0bd1b5008e2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:286
export const W_TECHWALL1____header_global_e6f4a23c69c17881 = ((((((293) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dc5bd91dd83dff73b1deea43() {
  return __cxx_static_address_dc5bd91dd83dff73b1deea43.reference || (__cxx_static_address_dc5bd91dd83dff73b1deea43.reference = {
    __cReference: true,
    get value() { return W_TECHWALL1____header_global_e6f4a23c69c17881; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:287
export const W_TECHWALL2____header_global_1e8add04d8a7e424 = ((((((297) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3971a3945042d5cfbddee628() {
  return __cxx_static_address_3971a3945042d5cfbddee628.reference || (__cxx_static_address_3971a3945042d5cfbddee628.reference = {
    __cReference: true,
    get value() { return W_TECHWALL2____header_global_1e8add04d8a7e424; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:288
export const W_TECHWALL15____header_global_99b072da7ec17b8a = ((((((299) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ff45d30cd416d0513f0891b1() {
  return __cxx_static_address_ff45d30cd416d0513f0891b1.reference || (__cxx_static_address_ff45d30cd416d0513f0891b1.reference = {
    __cReference: true,
    get value() { return W_TECHWALL15____header_global_99b072da7ec17b8a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:289
export const W_TECHWALL3____header_global_f999bdf73f8b3ad5 = ((((((301) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a513dae5a9d6790d8dc2b174() {
  return __cxx_static_address_a513dae5a9d6790d8dc2b174.reference || (__cxx_static_address_a513dae5a9d6790d8dc2b174.reference = {
    __cReference: true,
    get value() { return W_TECHWALL3____header_global_f999bdf73f8b3ad5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:290
export const W_TECHWALL4____header_global_a25b3b2a909869c5 = ((((((305) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0aea8e2dd6072b4013c90158() {
  return __cxx_static_address_0aea8e2dd6072b4013c90158.reference || (__cxx_static_address_0aea8e2dd6072b4013c90158.reference = {
    __cReference: true,
    get value() { return W_TECHWALL4____header_global_a25b3b2a909869c5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:291
export const W_TECHWALL10____header_global_269dfda01b969cc2 = ((((((306) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7d805987430e7bfe8753b8f0() {
  return __cxx_static_address_7d805987430e7bfe8753b8f0.reference || (__cxx_static_address_7d805987430e7bfe8753b8f0.reference = {
    __cReference: true,
    get value() { return W_TECHWALL10____header_global_269dfda01b969cc2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:292
export const W_TECHWALL16____header_global_0aa72ce19444083e = ((((((307) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d13e124ee3fdc1cbb3990a33() {
  return __cxx_static_address_d13e124ee3fdc1cbb3990a33.reference || (__cxx_static_address_d13e124ee3fdc1cbb3990a33.reference = {
    __cReference: true,
    get value() { return W_TECHWALL16____header_global_0aa72ce19444083e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:293
export const WATERTILE2____header_global_e7622f64948ddeea = ((((((336) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dd55a015a8085de03ff1a195() {
  return __cxx_static_address_dd55a015a8085de03ff1a195.reference || (__cxx_static_address_dd55a015a8085de03ff1a195.reference = {
    __cReference: true,
    get value() { return WATERTILE2____header_global_e7622f64948ddeea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:294
export const BPANNEL1____header_global_d3953c7c292c51a0 = ((((((341) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5b0a78a885ef45412d48f722() {
  return __cxx_static_address_5b0a78a885ef45412d48f722.reference || (__cxx_static_address_5b0a78a885ef45412d48f722.reference = {
    __cReference: true,
    get value() { return BPANNEL1____header_global_d3953c7c292c51a0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:295
export const PANNEL1____header_global_678b2b96bdbec3ca = ((((((342) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9916c06dfaccd0e536e6efc1() {
  return __cxx_static_address_9916c06dfaccd0e536e6efc1.reference || (__cxx_static_address_9916c06dfaccd0e536e6efc1.reference = {
    __cReference: true,
    get value() { return PANNEL1____header_global_678b2b96bdbec3ca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:296
export const PANNEL2____header_global_3db95b6a046ed59f = ((((((343) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3316a546873651497e7b7ec8() {
  return __cxx_static_address_3316a546873651497e7b7ec8.reference || (__cxx_static_address_3316a546873651497e7b7ec8.reference = {
    __cReference: true,
    get value() { return PANNEL2____header_global_3db95b6a046ed59f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:297
export const STATIC____header_global_422d18ec73ed280c = ((((((351) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d53091d4551cb34b50e1db95() {
  return __cxx_static_address_d53091d4551cb34b50e1db95.reference || (__cxx_static_address_d53091d4551cb34b50e1db95.reference = {
    __cReference: true,
    get value() { return STATIC____header_global_422d18ec73ed280c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:298
export const W_SCREENBREAK____header_global_dd8cfd9bc3427924 = ((((((357) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ff3da9fc0599bb4cb50dd62a() {
  return __cxx_static_address_ff3da9fc0599bb4cb50dd62a.reference || (__cxx_static_address_ff3da9fc0599bb4cb50dd62a.reference = {
    __cReference: true,
    get value() { return W_SCREENBREAK____header_global_dd8cfd9bc3427924; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:299
export const W_HITTECHWALL3____header_global_fba14bf9769fcc11 = ((((((360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1d8d9d98146fc0d5e7eae91c() {
  return __cxx_static_address_1d8d9d98146fc0d5e7eae91c.reference || (__cxx_static_address_1d8d9d98146fc0d5e7eae91c.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL3____header_global_fba14bf9769fcc11; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:300
export const W_HITTECHWALL4____header_global_9dc229500296ac72 = ((((((361) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e6afdaad1ba32a6e5671bf1c() {
  return __cxx_static_address_e6afdaad1ba32a6e5671bf1c.reference || (__cxx_static_address_e6afdaad1ba32a6e5671bf1c.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL4____header_global_9dc229500296ac72; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:301
export const W_HITTECHWALL2____header_global_d870dc0670bfc46a = ((((((362) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_921b7ffde92b2e11cd754e6d() {
  return __cxx_static_address_921b7ffde92b2e11cd754e6d.reference || (__cxx_static_address_921b7ffde92b2e11cd754e6d.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL2____header_global_d870dc0670bfc46a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:302
export const W_HITTECHWALL1____header_global_4184728edcc7649d = ((((((363) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6ac2808df2589a7e07c15798() {
  return __cxx_static_address_6ac2808df2589a7e07c15798.reference || (__cxx_static_address_6ac2808df2589a7e07c15798.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL1____header_global_4184728edcc7649d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:303
export const MASKWALL10____header_global_1f9fae0872d1c694 = ((((((387) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f668c668f148de3f3a3608bd() {
  return __cxx_static_address_f668c668f148de3f3a3608bd.reference || (__cxx_static_address_f668c668f148de3f3a3608bd.reference = {
    __cReference: true,
    get value() { return MASKWALL10____header_global_1f9fae0872d1c694; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:304
export const MASKWALL11____header_global_70400a8dc00f0d6d = ((((((391) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_532fd252f77bebaa16a1e44f() {
  return __cxx_static_address_532fd252f77bebaa16a1e44f.reference || (__cxx_static_address_532fd252f77bebaa16a1e44f.reference = {
    __cReference: true,
    get value() { return MASKWALL11____header_global_70400a8dc00f0d6d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:305
export const DOORTILE22____header_global_a7d6a84f373919eb = ((((((395) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c65f8f45588ef553293a570b() {
  return __cxx_static_address_c65f8f45588ef553293a570b.reference || (__cxx_static_address_c65f8f45588ef553293a570b.reference = {
    __cReference: true,
    get value() { return DOORTILE22____header_global_a7d6a84f373919eb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:306
export const FANSPRITE____header_global_25bcef2188f34fc9 = ((((((407) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_164ff87f160ac0c47e5c9101() {
  return __cxx_static_address_164ff87f160ac0c47e5c9101.reference || (__cxx_static_address_164ff87f160ac0c47e5c9101.reference = {
    __cReference: true,
    get value() { return FANSPRITE____header_global_25bcef2188f34fc9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:307
export const FANSPRITEBROKE____header_global_50b9b5ad55dac0e6 = ((((((411) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_88ef8e56bbff83b705997651() {
  return __cxx_static_address_88ef8e56bbff83b705997651.reference || (__cxx_static_address_88ef8e56bbff83b705997651.reference = {
    __cReference: true,
    get value() { return FANSPRITEBROKE____header_global_50b9b5ad55dac0e6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:308
export const FANSHADOW____header_global_ee7b6976ac334f93 = ((((((412) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_91fc943f3089832e66ecd46f() {
  return __cxx_static_address_91fc943f3089832e66ecd46f.reference || (__cxx_static_address_91fc943f3089832e66ecd46f.reference = {
    __cReference: true,
    get value() { return FANSHADOW____header_global_ee7b6976ac334f93; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:309
export const FANSHADOWBROKE____header_global_dca5c774c48ecc29 = ((((((416) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_427d4389b3907a702cca603f() {
  return __cxx_static_address_427d4389b3907a702cca603f.reference || (__cxx_static_address_427d4389b3907a702cca603f.reference = {
    __cReference: true,
    get value() { return FANSHADOWBROKE____header_global_dca5c774c48ecc29; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:310
export const DOORTILE18____header_global_e0909a318412fa4d = ((((((447) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5899e81d7fd4625cb1a1d016() {
  return __cxx_static_address_5899e81d7fd4625cb1a1d016.reference || (__cxx_static_address_5899e81d7fd4625cb1a1d016.reference = {
    __cReference: true,
    get value() { return DOORTILE18____header_global_e0909a318412fa4d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:311
export const DOORTILE19____header_global_2196e25f98c529ee = ((((((448) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f260f16bcb0aef52a29dad85() {
  return __cxx_static_address_f260f16bcb0aef52a29dad85.reference || (__cxx_static_address_f260f16bcb0aef52a29dad85.reference = {
    __cReference: true,
    get value() { return DOORTILE19____header_global_2196e25f98c529ee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:312
export const DOORTILE20____header_global_dda88d1f195e766a = ((((((449) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4013ce331682d1c554b1d289() {
  return __cxx_static_address_4013ce331682d1c554b1d289.reference || (__cxx_static_address_4013ce331682d1c554b1d289.reference = {
    __cReference: true,
    get value() { return DOORTILE20____header_global_dda88d1f195e766a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:313
export const VIEWSCREEN2____header_global_ad91db6b8db75d8f = ((((((499) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c83396cc41b79107cd717566() {
  return __cxx_static_address_c83396cc41b79107cd717566.reference || (__cxx_static_address_c83396cc41b79107cd717566.reference = {
    __cReference: true,
    get value() { return VIEWSCREEN2____header_global_ad91db6b8db75d8f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:314
export const VIEWSCREEN____header_global_1e2864d52f9f48c9 = ((((((502) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c5a2e20ea5b8a30926771576() {
  return __cxx_static_address_c5a2e20ea5b8a30926771576.reference || (__cxx_static_address_c5a2e20ea5b8a30926771576.reference = {
    __cReference: true,
    get value() { return VIEWSCREEN____header_global_1e2864d52f9f48c9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:315
export const GLASS____header_global_5379c52de16b91a6 = ((((((503) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_18554fcff52c392095fb866f() {
  return __cxx_static_address_18554fcff52c392095fb866f.reference || (__cxx_static_address_18554fcff52c392095fb866f.reference = {
    __cReference: true,
    get value() { return GLASS____header_global_5379c52de16b91a6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:316
export const GLASS2____header_global_40fd9482b5a67f0b = ((((((504) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b60bff882f15d26bd7ff2844() {
  return __cxx_static_address_b60bff882f15d26bd7ff2844.reference || (__cxx_static_address_b60bff882f15d26bd7ff2844.reference = {
    __cReference: true,
    get value() { return GLASS2____header_global_40fd9482b5a67f0b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:317
export const STAINGLASS1____header_global_8df6c14728d729a2 = ((((((510) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dfb57568b092e5f69ec09b97() {
  return __cxx_static_address_dfb57568b092e5f69ec09b97.reference || (__cxx_static_address_dfb57568b092e5f69ec09b97.reference = {
    __cReference: true,
    get value() { return STAINGLASS1____header_global_8df6c14728d729a2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:318
export const MASKWALL5____header_global_2e156ac7e06493ac = ((((((514) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b7951ff20bdc40de17c53b5e() {
  return __cxx_static_address_b7951ff20bdc40de17c53b5e.reference || (__cxx_static_address_b7951ff20bdc40de17c53b5e.reference = {
    __cReference: true,
    get value() { return MASKWALL5____header_global_2e156ac7e06493ac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:319
export const SATELITE____header_global_0870d9345718b0ee = ((((((516) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2e2d13e4da3c371b275476aa() {
  return __cxx_static_address_2e2d13e4da3c371b275476aa.reference || (__cxx_static_address_2e2d13e4da3c371b275476aa.reference = {
    __cReference: true,
    get value() { return SATELITE____header_global_0870d9345718b0ee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:320
export const FUELPOD____header_global_d5682da571685f84 = ((((((517) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0bc70e1641e420b8931c2177() {
  return __cxx_static_address_0bc70e1641e420b8931c2177.reference || (__cxx_static_address_0bc70e1641e420b8931c2177.reference = {
    __cReference: true,
    get value() { return FUELPOD____header_global_d5682da571685f84; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:321
export const CRACK1____header_global_bc61d7fe694936be = ((((((546) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0467c9c8fd1e9be50e5c637b() {
  return __cxx_static_address_0467c9c8fd1e9be50e5c637b.reference || (__cxx_static_address_0467c9c8fd1e9be50e5c637b.reference = {
    __cReference: true,
    get value() { return CRACK1____header_global_bc61d7fe694936be; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:322
export const CRACK2____header_global_5e4e79f84ff2c468 = ((((((547) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_68b9e5fc8830447afcd921b7() {
  return __cxx_static_address_68b9e5fc8830447afcd921b7.reference || (__cxx_static_address_68b9e5fc8830447afcd921b7.reference = {
    __cReference: true,
    get value() { return CRACK2____header_global_5e4e79f84ff2c468; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:323
export const CRACK3____header_global_7c044cc5fd6aa641 = ((((((548) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0de7279cdeafead00e8262b4() {
  return __cxx_static_address_0de7279cdeafead00e8262b4.reference || (__cxx_static_address_0de7279cdeafead00e8262b4.reference = {
    __cReference: true,
    get value() { return CRACK3____header_global_7c044cc5fd6aa641; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:324
export const CRACK4____header_global_c40146ed6570e1ac = ((((((549) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_254f456ed360b21470d148d6() {
  return __cxx_static_address_254f456ed360b21470d148d6.reference || (__cxx_static_address_254f456ed360b21470d148d6.reference = {
    __cReference: true,
    get value() { return CRACK4____header_global_c40146ed6570e1ac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:325
export const FOOTPRINTS____header_global_719cdf4810679162 = ((((((550) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fb2050cb157ba6cc4798a298() {
  return __cxx_static_address_fb2050cb157ba6cc4798a298.reference || (__cxx_static_address_fb2050cb157ba6cc4798a298.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS____header_global_719cdf4810679162; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:326
export const DOMELITE____header_global_94e5531f77f813e8 = ((((((551) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bfe5a170a89882754b34912a() {
  return __cxx_static_address_bfe5a170a89882754b34912a.reference || (__cxx_static_address_bfe5a170a89882754b34912a.reference = {
    __cReference: true,
    get value() { return DOMELITE____header_global_94e5531f77f813e8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:327
export const CAMERAPOLE____header_global_39c5f6bce1dbdbd4 = ((((((554) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4f3c4a3a8ae26ad1c22e38e4() {
  return __cxx_static_address_4f3c4a3a8ae26ad1c22e38e4.reference || (__cxx_static_address_4f3c4a3a8ae26ad1c22e38e4.reference = {
    __cReference: true,
    get value() { return CAMERAPOLE____header_global_39c5f6bce1dbdbd4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:328
export const CHAIR1____header_global_0b1d9c58396fd19d = ((((((556) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b7b0c45a1659ac367cc53117() {
  return __cxx_static_address_b7b0c45a1659ac367cc53117.reference || (__cxx_static_address_b7b0c45a1659ac367cc53117.reference = {
    __cReference: true,
    get value() { return CHAIR1____header_global_0b1d9c58396fd19d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:329
export const CHAIR2____header_global_b96237ff1ed9b9b0 = ((((((557) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c32dd21e8dd91fd0c566d6cf() {
  return __cxx_static_address_c32dd21e8dd91fd0c566d6cf.reference || (__cxx_static_address_c32dd21e8dd91fd0c566d6cf.reference = {
    __cReference: true,
    get value() { return CHAIR2____header_global_b96237ff1ed9b9b0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:330
export const BROKENCHAIR____header_global_822579016aac1788 = ((((((559) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f4ef6ec2c4f2dc3fe298cab9() {
  return __cxx_static_address_f4ef6ec2c4f2dc3fe298cab9.reference || (__cxx_static_address_f4ef6ec2c4f2dc3fe298cab9.reference = {
    __cReference: true,
    get value() { return BROKENCHAIR____header_global_822579016aac1788; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:331
export const MIRROR____header_global_8e5919482ce726cc = ((((((560) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0acba438685202cffa5c57e7() {
  return __cxx_static_address_0acba438685202cffa5c57e7.reference || (__cxx_static_address_0acba438685202cffa5c57e7.reference = {
    __cReference: true,
    get value() { return MIRROR____header_global_8e5919482ce726cc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:332
export const WATERFOUNTAIN____header_global_04967d33cafdb5e4 = ((((((563) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_35a7166c6d053cd8473db438() {
  return __cxx_static_address_35a7166c6d053cd8473db438.reference || (__cxx_static_address_35a7166c6d053cd8473db438.reference = {
    __cReference: true,
    get value() { return WATERFOUNTAIN____header_global_04967d33cafdb5e4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:333
export const WATERFOUNTAINBROKE____header_global_4a9b24b0bd04d8c6 = ((((((567) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d9856d4c97270174c9e1f72e() {
  return __cxx_static_address_d9856d4c97270174c9e1f72e.reference || (__cxx_static_address_d9856d4c97270174c9e1f72e.reference = {
    __cReference: true,
    get value() { return WATERFOUNTAINBROKE____header_global_4a9b24b0bd04d8c6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:334
export const FEMMAG1____header_global_d638d558fb58e833 = ((((((568) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7cc38bb6470f6fc4dff4298a() {
  return __cxx_static_address_7cc38bb6470f6fc4dff4298a.reference || (__cxx_static_address_7cc38bb6470f6fc4dff4298a.reference = {
    __cReference: true,
    get value() { return FEMMAG1____header_global_d638d558fb58e833; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:335
export const TOILET____header_global_154193fce911b0f1 = ((((((569) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b5eef52c5e9344844c6e020c() {
  return __cxx_static_address_b5eef52c5e9344844c6e020c.reference || (__cxx_static_address_b5eef52c5e9344844c6e020c.reference = {
    __cReference: true,
    get value() { return TOILET____header_global_154193fce911b0f1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:336
export const STALL____header_global_91b3ea6947fe0be8 = ((((((571) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fd6bca44bb416d4ad5d16acf() {
  return __cxx_static_address_fd6bca44bb416d4ad5d16acf.reference || (__cxx_static_address_fd6bca44bb416d4ad5d16acf.reference = {
    __cReference: true,
    get value() { return STALL____header_global_91b3ea6947fe0be8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:337
export const STALLBROKE____header_global_5e7940b0eaf37bbe = ((((((573) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0172019d648e273d013673e2() {
  return __cxx_static_address_0172019d648e273d013673e2.reference || (__cxx_static_address_0172019d648e273d013673e2.reference = {
    __cReference: true,
    get value() { return STALLBROKE____header_global_5e7940b0eaf37bbe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:338
export const FEMMAG2____header_global_922b8ac5be91cc2a = ((((((577) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e2135f9122c553ef15666a93() {
  return __cxx_static_address_e2135f9122c553ef15666a93.reference || (__cxx_static_address_e2135f9122c553ef15666a93.reference = {
    __cReference: true,
    get value() { return FEMMAG2____header_global_922b8ac5be91cc2a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:339
export const REACTOR2____header_global_84e0c99b1f649f36 = ((((((578) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_50555dc2b9ea2fec98a1e20d() {
  return __cxx_static_address_50555dc2b9ea2fec98a1e20d.reference || (__cxx_static_address_50555dc2b9ea2fec98a1e20d.reference = {
    __cReference: true,
    get value() { return REACTOR2____header_global_84e0c99b1f649f36; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:340
export const REACTOR2BURNT____header_global_a75ac16636536d9e = ((((((579) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_52d45cf903f2cc2fc4c36836() {
  return __cxx_static_address_52d45cf903f2cc2fc4c36836.reference || (__cxx_static_address_52d45cf903f2cc2fc4c36836.reference = {
    __cReference: true,
    get value() { return REACTOR2BURNT____header_global_a75ac16636536d9e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:341
export const REACTOR2SPARK____header_global_694a206e957d65b4 = ((((((580) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eda2ec5710b6ded5fff2c6a1() {
  return __cxx_static_address_eda2ec5710b6ded5fff2c6a1.reference || (__cxx_static_address_eda2ec5710b6ded5fff2c6a1.reference = {
    __cReference: true,
    get value() { return REACTOR2SPARK____header_global_694a206e957d65b4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:342
export const GRATE1____header_global_a83447ddc6b83700 = ((((((595) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fb6e99c1d76f8681a18dc0f4() {
  return __cxx_static_address_fb6e99c1d76f8681a18dc0f4.reference || (__cxx_static_address_fb6e99c1d76f8681a18dc0f4.reference = {
    __cReference: true,
    get value() { return GRATE1____header_global_a83447ddc6b83700; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:343
export const BGRATE1____header_global_ad2d3acb2c387bb8 = ((((((596) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e2f47e5dc38360d871c1597e() {
  return __cxx_static_address_e2f47e5dc38360d871c1597e.reference || (__cxx_static_address_e2f47e5dc38360d871c1597e.reference = {
    __cReference: true,
    get value() { return BGRATE1____header_global_ad2d3acb2c387bb8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:344
export const SOLARPANNEL____header_global_57c2c1d68fc80fe1 = ((((((602) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c7306edae6e71478cbaedb94() {
  return __cxx_static_address_c7306edae6e71478cbaedb94.reference || (__cxx_static_address_c7306edae6e71478cbaedb94.reference = {
    __cReference: true,
    get value() { return SOLARPANNEL____header_global_57c2c1d68fc80fe1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:345
export const NAKED1____header_global_5616fc67d3331383 = ((((((603) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0f741d4f1e50faaecd2edb8e() {
  return __cxx_static_address_0f741d4f1e50faaecd2edb8e.reference || (__cxx_static_address_0f741d4f1e50faaecd2edb8e.reference = {
    __cReference: true,
    get value() { return NAKED1____header_global_5616fc67d3331383; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:346
export const ANTENNA____header_global_bc9a924c6ffa6670 = ((((((607) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a7f92655bc7522781abd181d() {
  return __cxx_static_address_a7f92655bc7522781abd181d.reference || (__cxx_static_address_a7f92655bc7522781abd181d.reference = {
    __cReference: true,
    get value() { return ANTENNA____header_global_bc9a924c6ffa6670; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:347
export const MASKWALL12____header_global_83803c08266942e2 = ((((((609) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3113e2bc768e3be596497f01() {
  return __cxx_static_address_3113e2bc768e3be596497f01.reference || (__cxx_static_address_3113e2bc768e3be596497f01.reference = {
    __cReference: true,
    get value() { return MASKWALL12____header_global_83803c08266942e2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:348
export const TOILETBROKE____header_global_1f33d793b40f2453 = ((((((615) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e1ac2ee6e1bee2f564dda972() {
  return __cxx_static_address_e1ac2ee6e1bee2f564dda972.reference || (__cxx_static_address_e1ac2ee6e1bee2f564dda972.reference = {
    __cReference: true,
    get value() { return TOILETBROKE____header_global_1f33d793b40f2453; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:349
export const PIPE2____header_global_29e74039502e9898 = ((((((616) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_df102c4be03b440bfa4e3b49() {
  return __cxx_static_address_df102c4be03b440bfa4e3b49.reference || (__cxx_static_address_df102c4be03b440bfa4e3b49.reference = {
    __cReference: true,
    get value() { return PIPE2____header_global_29e74039502e9898; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:350
export const PIPE1B____header_global_f4bbd1ee18df0529 = ((((((617) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7072ee6afc7f54a5fb1f569e() {
  return __cxx_static_address_7072ee6afc7f54a5fb1f569e.reference || (__cxx_static_address_7072ee6afc7f54a5fb1f569e.reference = {
    __cReference: true,
    get value() { return PIPE1B____header_global_f4bbd1ee18df0529; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:351
export const PIPE3____header_global_2838bb3f41824dbb = ((((((618) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ccb559dcd8efb4dd6c485cc2() {
  return __cxx_static_address_ccb559dcd8efb4dd6c485cc2.reference || (__cxx_static_address_ccb559dcd8efb4dd6c485cc2.reference = {
    __cReference: true,
    get value() { return PIPE3____header_global_2838bb3f41824dbb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:352
export const PIPE1____header_global_23140f9297798a1d = ((((((619) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_09063322fca3340852e7bcc0() {
  return __cxx_static_address_09063322fca3340852e7bcc0.reference || (__cxx_static_address_09063322fca3340852e7bcc0.reference = {
    __cReference: true,
    get value() { return PIPE1____header_global_23140f9297798a1d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:353
export const CAMERA1____header_global_b1cba5aeed40ac5a = ((((((621) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e047671de9a4afe406cae816() {
  return __cxx_static_address_e047671de9a4afe406cae816.reference || (__cxx_static_address_e047671de9a4afe406cae816.reference = {
    __cReference: true,
    get value() { return CAMERA1____header_global_b1cba5aeed40ac5a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:354
export const PIPE2B____header_global_d44a019d25d884b5 = ((((((633) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_26ddfb997ac095399d8b832a() {
  return __cxx_static_address_26ddfb997ac095399d8b832a.reference || (__cxx_static_address_26ddfb997ac095399d8b832a.reference = {
    __cReference: true,
    get value() { return PIPE2B____header_global_d44a019d25d884b5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:355
export const BOLT1____header_global_aefcb8eb2e433fe1 = ((((((634) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_82a31097fc68645e058bc9e1() {
  return __cxx_static_address_82a31097fc68645e058bc9e1.reference || (__cxx_static_address_82a31097fc68645e058bc9e1.reference = {
    __cReference: true,
    get value() { return BOLT1____header_global_aefcb8eb2e433fe1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:356
export const W_NUMBERS____header_global_6df63b0000106b82 = ((((((640) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_33a8734f2be1062d2c1db6cc() {
  return __cxx_static_address_33a8734f2be1062d2c1db6cc.reference || (__cxx_static_address_33a8734f2be1062d2c1db6cc.reference = {
    __cReference: true,
    get value() { return W_NUMBERS____header_global_6df63b0000106b82; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:357
export const WATERDRIP____header_global_23f1c69ddbe39cca = ((((((660) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cb4727278702e6a73f4b7231() {
  return __cxx_static_address_cb4727278702e6a73f4b7231.reference || (__cxx_static_address_cb4727278702e6a73f4b7231.reference = {
    __cReference: true,
    get value() { return WATERDRIP____header_global_23f1c69ddbe39cca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:358
export const WATERBUBBLE____header_global_b10e5c67fcb6ea76 = ((((((661) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d9ba8914930ea3164b00070a() {
  return __cxx_static_address_d9ba8914930ea3164b00070a.reference || (__cxx_static_address_d9ba8914930ea3164b00070a.reference = {
    __cReference: true,
    get value() { return WATERBUBBLE____header_global_b10e5c67fcb6ea76; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:359
export const WATERBUBBLEMAKER____header_global_f2320c4615b9b0b9 = ((((((662) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f8f9fa6737c9c58c87ea3b5e() {
  return __cxx_static_address_f8f9fa6737c9c58c87ea3b5e.reference || (__cxx_static_address_f8f9fa6737c9c58c87ea3b5e.reference = {
    __cReference: true,
    get value() { return WATERBUBBLEMAKER____header_global_f2320c4615b9b0b9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:360
export const W_FORCEFIELD____header_global_ab9785ba6b17b110 = ((((((663) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4d253310e6ef7c621c006f9e() {
  return __cxx_static_address_4d253310e6ef7c621c006f9e.reference || (__cxx_static_address_4d253310e6ef7c621c006f9e.reference = {
    __cReference: true,
    get value() { return W_FORCEFIELD____header_global_ab9785ba6b17b110; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:361
export const VACUUM____header_global_5812e75bc687b027 = ((((((669) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e6ed9384e953c41322f2e973() {
  return __cxx_static_address_e6ed9384e953c41322f2e973.reference || (__cxx_static_address_e6ed9384e953c41322f2e973.reference = {
    __cReference: true,
    get value() { return VACUUM____header_global_5812e75bc687b027; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:362
export const FOOTPRINTS2____header_global_2f309e2e36640e40 = ((((((672) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_42aacfa9603dcd1fef9f15ee() {
  return __cxx_static_address_42aacfa9603dcd1fef9f15ee.reference || (__cxx_static_address_42aacfa9603dcd1fef9f15ee.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS2____header_global_2f309e2e36640e40; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:363
export const FOOTPRINTS3____header_global_857d09dc31f0dd64 = ((((((673) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_be7a2b62925ab0738f0c019e() {
  return __cxx_static_address_be7a2b62925ab0738f0c019e.reference || (__cxx_static_address_be7a2b62925ab0738f0c019e.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS3____header_global_857d09dc31f0dd64; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:364
export const FOOTPRINTS4____header_global_16e0c2f3da8fa24a = ((((((674) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2ced49bfd3295ad4274fef6d() {
  return __cxx_static_address_2ced49bfd3295ad4274fef6d.reference || (__cxx_static_address_2ced49bfd3295ad4274fef6d.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS4____header_global_16e0c2f3da8fa24a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:365
export const EGG____header_global_7b45772297c01962 = ((((((675) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5f6b5b8f7e09980506af6487() {
  return __cxx_static_address_5f6b5b8f7e09980506af6487.reference || (__cxx_static_address_5f6b5b8f7e09980506af6487.reference = {
    __cReference: true,
    get value() { return EGG____header_global_7b45772297c01962; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:366
export const SCALE____header_global_d3b0f223929c1e86 = ((((((678) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ee526d9435597422722e5228() {
  return __cxx_static_address_ee526d9435597422722e5228.reference || (__cxx_static_address_ee526d9435597422722e5228.reference = {
    __cReference: true,
    get value() { return SCALE____header_global_d3b0f223929c1e86; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:367
export const CHAIR3____header_global_8b04fdcef189850f = ((((((680) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8e9d3c76175dc62ee0aeb0a2() {
  return __cxx_static_address_8e9d3c76175dc62ee0aeb0a2.reference || (__cxx_static_address_8e9d3c76175dc62ee0aeb0a2.reference = {
    __cReference: true,
    get value() { return CHAIR3____header_global_8b04fdcef189850f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:368
export const CAMERALIGHT____header_global_ff6efd1171441e2f = ((((((685) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c1bccce622d3d9a83f502b73() {
  return __cxx_static_address_c1bccce622d3d9a83f502b73.reference || (__cxx_static_address_c1bccce622d3d9a83f502b73.reference = {
    __cReference: true,
    get value() { return CAMERALIGHT____header_global_ff6efd1171441e2f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:369
export const MOVIECAMERA____header_global_904188abec259f14 = ((((((686) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d9e7d7c95eae785b88f97da6() {
  return __cxx_static_address_d9e7d7c95eae785b88f97da6.reference || (__cxx_static_address_d9e7d7c95eae785b88f97da6.reference = {
    __cReference: true,
    get value() { return MOVIECAMERA____header_global_904188abec259f14; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:370
export const IVUNIT____header_global_e0c51c359359a46b = ((((((689) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_37cf0347f533ed2ced8600a5() {
  return __cxx_static_address_37cf0347f533ed2ced8600a5.reference || (__cxx_static_address_37cf0347f533ed2ced8600a5.reference = {
    __cReference: true,
    get value() { return IVUNIT____header_global_e0c51c359359a46b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:371
export const POT1____header_global_3485da482d6e4759 = ((((((694) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_542f6f6bec7b11297761448f() {
  return __cxx_static_address_542f6f6bec7b11297761448f.reference || (__cxx_static_address_542f6f6bec7b11297761448f.reference = {
    __cReference: true,
    get value() { return POT1____header_global_3485da482d6e4759; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:372
export const POT2____header_global_4729e8a217ff4e1c = ((((((695) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e2c62825429421be1d8e6ebf() {
  return __cxx_static_address_e2c62825429421be1d8e6ebf.reference || (__cxx_static_address_e2c62825429421be1d8e6ebf.reference = {
    __cReference: true,
    get value() { return POT2____header_global_4729e8a217ff4e1c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:373
export const POT3____header_global_af07e600c2883352 = ((((((697) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7456f3ea019d5feb1e80f7c1() {
  return __cxx_static_address_7456f3ea019d5feb1e80f7c1.reference || (__cxx_static_address_7456f3ea019d5feb1e80f7c1.reference = {
    __cReference: true,
    get value() { return POT3____header_global_af07e600c2883352; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:374
export const PIPE3B____header_global_5d7518bb69ecaa3f = ((((((700) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cd6d71fccec8b3578ed9c951() {
  return __cxx_static_address_cd6d71fccec8b3578ed9c951.reference || (__cxx_static_address_cd6d71fccec8b3578ed9c951.reference = {
    __cReference: true,
    get value() { return PIPE3B____header_global_5d7518bb69ecaa3f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:375
export const WALLLIGHT3____header_global_7d5f19bd982ef60d = ((((((701) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5b8ceb5c2c12e8fc7ad83905() {
  return __cxx_static_address_5b8ceb5c2c12e8fc7ad83905.reference || (__cxx_static_address_5b8ceb5c2c12e8fc7ad83905.reference = {
    __cReference: true,
    get value() { return WALLLIGHT3____header_global_7d5f19bd982ef60d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:376
export const WALLLIGHTBUST3____header_global_bf096a45b7dcc125 = ((((((702) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ebf723da3e6ca3496794cb19() {
  return __cxx_static_address_ebf723da3e6ca3496794cb19.reference || (__cxx_static_address_ebf723da3e6ca3496794cb19.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST3____header_global_bf096a45b7dcc125; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:377
export const WALLLIGHT1____header_global_199d5217f8fb978f = ((((((703) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f70735f1af23e685f3c866d2() {
  return __cxx_static_address_f70735f1af23e685f3c866d2.reference || (__cxx_static_address_f70735f1af23e685f3c866d2.reference = {
    __cReference: true,
    get value() { return WALLLIGHT1____header_global_199d5217f8fb978f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:378
export const WALLLIGHTBUST1____header_global_a16ab2053ac5b6df = ((((((704) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f0eea5fffd9378e8cee1a1cd() {
  return __cxx_static_address_f0eea5fffd9378e8cee1a1cd.reference || (__cxx_static_address_f0eea5fffd9378e8cee1a1cd.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST1____header_global_a16ab2053ac5b6df; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:379
export const WALLLIGHT2____header_global_7d1edf0947973d54 = ((((((705) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_695de75ef3965380bba0334f() {
  return __cxx_static_address_695de75ef3965380bba0334f.reference || (__cxx_static_address_695de75ef3965380bba0334f.reference = {
    __cReference: true,
    get value() { return WALLLIGHT2____header_global_7d1edf0947973d54; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:380
export const WALLLIGHTBUST2____header_global_e31223bd5263c52c = ((((((706) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_73a7d08f14bf6f0c6ada5583() {
  return __cxx_static_address_73a7d08f14bf6f0c6ada5583.reference || (__cxx_static_address_73a7d08f14bf6f0c6ada5583.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST2____header_global_e31223bd5263c52c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:381
export const LIGHTSWITCH2____header_global_563fac6939ce24f6 = ((((((712) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cf6198a8713a5f0fa8442260() {
  return __cxx_static_address_cf6198a8713a5f0fa8442260.reference || (__cxx_static_address_cf6198a8713a5f0fa8442260.reference = {
    __cReference: true,
    get value() { return LIGHTSWITCH2____header_global_563fac6939ce24f6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:382
export const WAITTOBESEATED____header_global_621aede978c38be3 = ((((((716) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_270ecdb98e388db1f2ec1cb5() {
  return __cxx_static_address_270ecdb98e388db1f2ec1cb5.reference || (__cxx_static_address_270ecdb98e388db1f2ec1cb5.reference = {
    __cReference: true,
    get value() { return WAITTOBESEATED____header_global_621aede978c38be3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:383
export const DOORTILE14____header_global_a94061fe9eb111e5 = ((((((717) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_433336959c9c8a99e8f7a911() {
  return __cxx_static_address_433336959c9c8a99e8f7a911.reference || (__cxx_static_address_433336959c9c8a99e8f7a911.reference = {
    __cReference: true,
    get value() { return DOORTILE14____header_global_a94061fe9eb111e5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:384
export const STATUE____header_global_a5755122b524074c = ((((((753) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_764952a615b126ed729f69d6() {
  return __cxx_static_address_764952a615b126ed729f69d6.reference || (__cxx_static_address_764952a615b126ed729f69d6.reference = {
    __cReference: true,
    get value() { return STATUE____header_global_a5755122b524074c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:385
export const MIKE____header_global_c5095eb610f981e1 = ((((((762) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_26243872daff6efcc71bde2e() {
  return __cxx_static_address_26243872daff6efcc71bde2e.reference || (__cxx_static_address_26243872daff6efcc71bde2e.reference = {
    __cReference: true,
    get value() { return MIKE____header_global_c5095eb610f981e1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:386
export const VASE____header_global_7e356ca3ee86a2fd = ((((((765) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eefc35b28a1299c1d2da95bf() {
  return __cxx_static_address_eefc35b28a1299c1d2da95bf.reference || (__cxx_static_address_eefc35b28a1299c1d2da95bf.reference = {
    __cReference: true,
    get value() { return VASE____header_global_7e356ca3ee86a2fd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:387
export const SUSHIPLATE1____header_global_b444b2610d31b06e = ((((((768) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_df45a0abfd73cf7a5e642d98() {
  return __cxx_static_address_df45a0abfd73cf7a5e642d98.reference || (__cxx_static_address_df45a0abfd73cf7a5e642d98.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE1____header_global_b444b2610d31b06e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:388
export const SUSHIPLATE2____header_global_04e2687a1c37376d = ((((((769) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f519b73f76774b230542f1f0() {
  return __cxx_static_address_f519b73f76774b230542f1f0.reference || (__cxx_static_address_f519b73f76774b230542f1f0.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE2____header_global_04e2687a1c37376d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:389
export const SUSHIPLATE3____header_global_684a1009ae2d7601 = ((((((774) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5e50acf94288a7ad8c20175c() {
  return __cxx_static_address_5e50acf94288a7ad8c20175c.reference || (__cxx_static_address_5e50acf94288a7ad8c20175c.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE3____header_global_684a1009ae2d7601; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:390
export const SUSHIPLATE4____header_global_281b5892e6164946 = ((((((779) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b3f5f3f8ac230100a918cd35() {
  return __cxx_static_address_b3f5f3f8ac230100a918cd35.reference || (__cxx_static_address_b3f5f3f8ac230100a918cd35.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE4____header_global_281b5892e6164946; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:391
export const DOORTILE16____header_global_515b5567b654ef62 = ((((((781) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f9b2e479e13059f33cb55bbc() {
  return __cxx_static_address_f9b2e479e13059f33cb55bbc.reference || (__cxx_static_address_f9b2e479e13059f33cb55bbc.reference = {
    __cReference: true,
    get value() { return DOORTILE16____header_global_515b5567b654ef62; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:392
export const SUSHIPLATE5____header_global_3e93e643132d485e = ((((((792) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8ea5057fb3e4f201bf22a3bd() {
  return __cxx_static_address_8ea5057fb3e4f201bf22a3bd.reference || (__cxx_static_address_8ea5057fb3e4f201bf22a3bd.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE5____header_global_3e93e643132d485e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:393
export const OJ____header_global_53d2fe6af0eb1c1e = ((((((806) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_59930f16b9e9877ad7d76525() {
  return __cxx_static_address_59930f16b9e9877ad7d76525.reference || (__cxx_static_address_59930f16b9e9877ad7d76525.reference = {
    __cReference: true,
    get value() { return OJ____header_global_53d2fe6af0eb1c1e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:394
export const MASKWALL13____header_global_f34fb7df2aeba634 = ((((((830) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_66307152b44b2ba43a7c71fa() {
  return __cxx_static_address_66307152b44b2ba43a7c71fa.reference || (__cxx_static_address_66307152b44b2ba43a7c71fa.reference = {
    __cReference: true,
    get value() { return MASKWALL13____header_global_f34fb7df2aeba634; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:395
export const HURTRAIL____header_global_a0e2bbd66ac8280d = ((((((859) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a676f52f065fc50d84835e45() {
  return __cxx_static_address_a676f52f065fc50d84835e45.reference || (__cxx_static_address_a676f52f065fc50d84835e45.reference = {
    __cReference: true,
    get value() { return HURTRAIL____header_global_a0e2bbd66ac8280d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:396
export const POWERSWITCH1____header_global_3c283535a9870de6 = ((((((860) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b4cf6c3d25ef59e0cbb3ab94() {
  return __cxx_static_address_b4cf6c3d25ef59e0cbb3ab94.reference || (__cxx_static_address_b4cf6c3d25ef59e0cbb3ab94.reference = {
    __cReference: true,
    get value() { return POWERSWITCH1____header_global_3c283535a9870de6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:397
export const LOCKSWITCH1____header_global_4b9c2c6520e3a01f = ((((((862) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2fbfeab0a48b082d6ac606bd() {
  return __cxx_static_address_2fbfeab0a48b082d6ac606bd.reference || (__cxx_static_address_2fbfeab0a48b082d6ac606bd.reference = {
    __cReference: true,
    get value() { return LOCKSWITCH1____header_global_4b9c2c6520e3a01f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:398
export const POWERSWITCH2____header_global_6cb4d697b68d4833 = ((((((864) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0abc69a482d2aae4ba7de498() {
  return __cxx_static_address_0abc69a482d2aae4ba7de498.reference || (__cxx_static_address_0abc69a482d2aae4ba7de498.reference = {
    __cReference: true,
    get value() { return POWERSWITCH2____header_global_6cb4d697b68d4833; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:399
export const ATM____header_global_de059846ffaa1b8e = ((((((867) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eee9807d0bcd18943d7cb026() {
  return __cxx_static_address_eee9807d0bcd18943d7cb026.reference || (__cxx_static_address_eee9807d0bcd18943d7cb026.reference = {
    __cReference: true,
    get value() { return ATM____header_global_de059846ffaa1b8e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:400
export const STATUEFLASH____header_global_1c15fdf2b644c0c5 = ((((((869) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_17ef895589080d659a8eb4af() {
  return __cxx_static_address_17ef895589080d659a8eb4af.reference || (__cxx_static_address_17ef895589080d659a8eb4af.reference = {
    __cReference: true,
    get value() { return STATUEFLASH____header_global_1c15fdf2b644c0c5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:401
export const ATMBROKE____header_global_031d02bcf03092f1 = ((((((888) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6d4720bf8800ae385280adce() {
  return __cxx_static_address_6d4720bf8800ae385280adce.reference || (__cxx_static_address_6d4720bf8800ae385280adce.reference = {
    __cReference: true,
    get value() { return ATMBROKE____header_global_031d02bcf03092f1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:402
export const STRIPEBALL____header_global_7b24da838c2b5cc0 = ((((((901) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eea65c6a810514c7e443dda1() {
  return __cxx_static_address_eea65c6a810514c7e443dda1.reference || (__cxx_static_address_eea65c6a810514c7e443dda1.reference = {
    __cReference: true,
    get value() { return STRIPEBALL____header_global_7b24da838c2b5cc0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:403
export const QUEBALL____header_global_6b3f62de7869f46f = ((((((902) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_96726ea69b82fdef889e3193() {
  return __cxx_static_address_96726ea69b82fdef889e3193.reference || (__cxx_static_address_96726ea69b82fdef889e3193.reference = {
    __cReference: true,
    get value() { return QUEBALL____header_global_6b3f62de7869f46f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:404
export const POCKET____header_global_c918ed60b2a7aa93 = ((((((903) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_37cd0f24926d2983bc7689b1() {
  return __cxx_static_address_37cd0f24926d2983bc7689b1.reference || (__cxx_static_address_37cd0f24926d2983bc7689b1.reference = {
    __cReference: true,
    get value() { return POCKET____header_global_c918ed60b2a7aa93; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:405
export const WOODENHORSE____header_global_ba1c497fb35c6735 = ((((((904) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ed9d63e30658ec6779a016b7() {
  return __cxx_static_address_ed9d63e30658ec6779a016b7.reference || (__cxx_static_address_ed9d63e30658ec6779a016b7.reference = {
    __cReference: true,
    get value() { return WOODENHORSE____header_global_ba1c497fb35c6735; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:406
export const TREE1____header_global_2ae78fbb9f1cbc91 = ((((((908) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_47aa90daa618fac1243c5275() {
  return __cxx_static_address_47aa90daa618fac1243c5275.reference || (__cxx_static_address_47aa90daa618fac1243c5275.reference = {
    __cReference: true,
    get value() { return TREE1____header_global_2ae78fbb9f1cbc91; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:407
export const TREE2____header_global_1bd44b8b3709d36a = ((((((910) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fc28450f8f098d6cd510869a() {
  return __cxx_static_address_fc28450f8f098d6cd510869a.reference || (__cxx_static_address_fc28450f8f098d6cd510869a.reference = {
    __cReference: true,
    get value() { return TREE2____header_global_1bd44b8b3709d36a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:408
export const CACTUS____header_global_f5f3e951d034e749 = ((((((911) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eb13789f895d3e7e3cddfe74() {
  return __cxx_static_address_eb13789f895d3e7e3cddfe74.reference || (__cxx_static_address_eb13789f895d3e7e3cddfe74.reference = {
    __cReference: true,
    get value() { return CACTUS____header_global_f5f3e951d034e749; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:409
export const MASKWALL2____header_global_0c5e4f33235595e0 = ((((((913) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4cea33150e3642fbbe910cf3() {
  return __cxx_static_address_4cea33150e3642fbbe910cf3.reference || (__cxx_static_address_4cea33150e3642fbbe910cf3.reference = {
    __cReference: true,
    get value() { return MASKWALL2____header_global_0c5e4f33235595e0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:410
export const MASKWALL3____header_global_3fbc1a897e4c0025 = ((((((914) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_922bf6a9ecf344bb00cb70a8() {
  return __cxx_static_address_922bf6a9ecf344bb00cb70a8.reference || (__cxx_static_address_922bf6a9ecf344bb00cb70a8.reference = {
    __cReference: true,
    get value() { return MASKWALL3____header_global_3fbc1a897e4c0025; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:411
export const MASKWALL4____header_global_44e8ab51246e7c72 = ((((((915) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e4feb9509e6cff768369c08e() {
  return __cxx_static_address_e4feb9509e6cff768369c08e.reference || (__cxx_static_address_e4feb9509e6cff768369c08e.reference = {
    __cReference: true,
    get value() { return MASKWALL4____header_global_44e8ab51246e7c72; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:412
export const FIREEXT____header_global_0c85f8f8d492f012 = ((((((916) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b6f0b7ce5d9e35c1fb899e0d() {
  return __cxx_static_address_b6f0b7ce5d9e35c1fb899e0d.reference || (__cxx_static_address_b6f0b7ce5d9e35c1fb899e0d.reference = {
    __cReference: true,
    get value() { return FIREEXT____header_global_0c85f8f8d492f012; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:413
export const TOILETWATER____header_global_f84934c0ce6a28a0 = ((((((921) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_037d449d880e15e24386caca() {
  return __cxx_static_address_037d449d880e15e24386caca.reference || (__cxx_static_address_037d449d880e15e24386caca.reference = {
    __cReference: true,
    get value() { return TOILETWATER____header_global_f84934c0ce6a28a0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:414
export const NEON1____header_global_1426bf779752aff8 = ((((((925) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_214adc7242bef9f73e5c04eb() {
  return __cxx_static_address_214adc7242bef9f73e5c04eb.reference || (__cxx_static_address_214adc7242bef9f73e5c04eb.reference = {
    __cReference: true,
    get value() { return NEON1____header_global_1426bf779752aff8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:415
export const NEON2____header_global_5cad6e941b589a56 = ((((((926) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d9de59382fd6424cdf19a6cc() {
  return __cxx_static_address_d9de59382fd6424cdf19a6cc.reference || (__cxx_static_address_d9de59382fd6424cdf19a6cc.reference = {
    __cReference: true,
    get value() { return NEON2____header_global_5cad6e941b589a56; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:416
export const CACTUSBROKE____header_global_d31860311015c082 = ((((((939) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8b249e463604519368382645() {
  return __cxx_static_address_8b249e463604519368382645.reference || (__cxx_static_address_8b249e463604519368382645.reference = {
    __cReference: true,
    get value() { return CACTUSBROKE____header_global_d31860311015c082; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:417
export const BOUNCEMINE____header_global_55185d0357932a28 = ((((((940) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d8f4981d318e3d22496c8946() {
  return __cxx_static_address_d8f4981d318e3d22496c8946.reference || (__cxx_static_address_d8f4981d318e3d22496c8946.reference = {
    __cReference: true,
    get value() { return BOUNCEMINE____header_global_55185d0357932a28; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:418
export const BROKEFIREHYDRENT____header_global_6fc4676aa060eaa6 = ((((((950) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_21adcdfa54aed775af677d9a() {
  return __cxx_static_address_21adcdfa54aed775af677d9a.reference || (__cxx_static_address_21adcdfa54aed775af677d9a.reference = {
    __cReference: true,
    get value() { return BROKEFIREHYDRENT____header_global_6fc4676aa060eaa6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:419
export const BOX____header_global_07a1ebeea828192c = ((((((951) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9cec251540a7dbb24605d6fe() {
  return __cxx_static_address_9cec251540a7dbb24605d6fe.reference || (__cxx_static_address_9cec251540a7dbb24605d6fe.reference = {
    __cReference: true,
    get value() { return BOX____header_global_07a1ebeea828192c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:420
export const BULLETHOLE____header_global_21ba01050ca08414 = ((((((952) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2539b49d1877a9697c2716d1() {
  return __cxx_static_address_2539b49d1877a9697c2716d1.reference || (__cxx_static_address_2539b49d1877a9697c2716d1.reference = {
    __cReference: true,
    get value() { return BULLETHOLE____header_global_21ba01050ca08414; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:421
export const BOTTLE1____header_global_b62bab909b8e1b1e = ((((((954) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5d8f8c38ca7a970895f701de() {
  return __cxx_static_address_5d8f8c38ca7a970895f701de.reference || (__cxx_static_address_5d8f8c38ca7a970895f701de.reference = {
    __cReference: true,
    get value() { return BOTTLE1____header_global_b62bab909b8e1b1e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:422
export const BOTTLE2____header_global_b646a3377a1eaf94 = ((((((955) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_49d331fc507b92b03c381ebf() {
  return __cxx_static_address_49d331fc507b92b03c381ebf.reference || (__cxx_static_address_49d331fc507b92b03c381ebf.reference = {
    __cReference: true,
    get value() { return BOTTLE2____header_global_b646a3377a1eaf94; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:423
export const BOTTLE3____header_global_2ac86848d0765eaf = ((((((956) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3bbc5f528d5d428dab00da1d() {
  return __cxx_static_address_3bbc5f528d5d428dab00da1d.reference || (__cxx_static_address_3bbc5f528d5d428dab00da1d.reference = {
    __cReference: true,
    get value() { return BOTTLE3____header_global_2ac86848d0765eaf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:424
export const BOTTLE4____header_global_13bd9d9d988f9790 = ((((((957) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4954d0ab486c9dad38cb7d11() {
  return __cxx_static_address_4954d0ab486c9dad38cb7d11.reference || (__cxx_static_address_4954d0ab486c9dad38cb7d11.reference = {
    __cReference: true,
    get value() { return BOTTLE4____header_global_13bd9d9d988f9790; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:425
export const FEMPIC5____header_global_a11bb8629b22acb0 = ((((((963) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dad2dbd9fbe7a359ec9f9aba() {
  return __cxx_static_address_dad2dbd9fbe7a359ec9f9aba.reference || (__cxx_static_address_dad2dbd9fbe7a359ec9f9aba.reference = {
    __cReference: true,
    get value() { return FEMPIC5____header_global_a11bb8629b22acb0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:426
export const FEMPIC6____header_global_9c6ef66e932a0dc8 = ((((((964) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_84fa4320e8a2b62137eba288() {
  return __cxx_static_address_84fa4320e8a2b62137eba288.reference || (__cxx_static_address_84fa4320e8a2b62137eba288.reference = {
    __cReference: true,
    get value() { return FEMPIC6____header_global_9c6ef66e932a0dc8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:427
export const FEMPIC7____header_global_861a0266f0a1f0a0 = ((((((965) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e2aeb2d769bd20eb2ff72d43() {
  return __cxx_static_address_e2aeb2d769bd20eb2ff72d43.reference || (__cxx_static_address_e2aeb2d769bd20eb2ff72d43.reference = {
    __cReference: true,
    get value() { return FEMPIC7____header_global_861a0266f0a1f0a0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:428
export const HYDROPLANT____header_global_57326e8eadf3c8e6 = ((((((969) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_662973d6566c0e2b084ac52b() {
  return __cxx_static_address_662973d6566c0e2b084ac52b.reference || (__cxx_static_address_662973d6566c0e2b084ac52b.reference = {
    __cReference: true,
    get value() { return HYDROPLANT____header_global_57326e8eadf3c8e6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:429
export const OCEANSPRITE1____header_global_27538deff0796e5d = ((((((971) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_607a9bc54a88cb2799fd47f1() {
  return __cxx_static_address_607a9bc54a88cb2799fd47f1.reference || (__cxx_static_address_607a9bc54a88cb2799fd47f1.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE1____header_global_27538deff0796e5d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:430
export const OCEANSPRITE2____header_global_849c27e273669dfd = ((((((972) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_83dac8489b64f0603c2c818b() {
  return __cxx_static_address_83dac8489b64f0603c2c818b.reference || (__cxx_static_address_83dac8489b64f0603c2c818b.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE2____header_global_849c27e273669dfd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:431
export const OCEANSPRITE3____header_global_edacb74274415a07 = ((((((973) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_457793140a3f5e25ff1118ac() {
  return __cxx_static_address_457793140a3f5e25ff1118ac.reference || (__cxx_static_address_457793140a3f5e25ff1118ac.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE3____header_global_edacb74274415a07; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:432
export const OCEANSPRITE4____header_global_3800df1dcbfdad4b = ((((((974) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_06565459e77e9bf9d843f8cd() {
  return __cxx_static_address_06565459e77e9bf9d843f8cd.reference || (__cxx_static_address_06565459e77e9bf9d843f8cd.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE4____header_global_3800df1dcbfdad4b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:433
export const OCEANSPRITE5____header_global_8f075aa88650aa55 = ((((((975) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d84fa96476507456dcc6166a() {
  return __cxx_static_address_d84fa96476507456dcc6166a.reference || (__cxx_static_address_d84fa96476507456dcc6166a.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE5____header_global_8f075aa88650aa55; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:434
export const GENERICPOLE____header_global_ae01e4222bf25e10 = ((((((977) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0926de0f78bc4a41ea483422() {
  return __cxx_static_address_0926de0f78bc4a41ea483422.reference || (__cxx_static_address_0926de0f78bc4a41ea483422.reference = {
    __cReference: true,
    get value() { return GENERICPOLE____header_global_ae01e4222bf25e10; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:435
export const CONE____header_global_403ab6bdfd66b98b = ((((((978) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4078861630d543907e83e2ec() {
  return __cxx_static_address_4078861630d543907e83e2ec.reference || (__cxx_static_address_4078861630d543907e83e2ec.reference = {
    __cReference: true,
    get value() { return CONE____header_global_403ab6bdfd66b98b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:436
export const HANGLIGHT____header_global_2d8e4d5a32d6a679 = ((((((979) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ed3799c4f6bd56665dceea3b() {
  return __cxx_static_address_ed3799c4f6bd56665dceea3b.reference || (__cxx_static_address_ed3799c4f6bd56665dceea3b.reference = {
    __cReference: true,
    get value() { return HANGLIGHT____header_global_2d8e4d5a32d6a679; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:437
export const HYDRENT____header_global_b257ac0c0bc6991e = ((((((981) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_36d6e57b73dc1cb5763e3e02() {
  return __cxx_static_address_36d6e57b73dc1cb5763e3e02.reference || (__cxx_static_address_36d6e57b73dc1cb5763e3e02.reference = {
    __cReference: true,
    get value() { return HYDRENT____header_global_b257ac0c0bc6991e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:438
export const MASKWALL14____header_global_4883b29576cfc481 = ((((((988) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f8d0cf1a6cace20196b48602() {
  return __cxx_static_address_f8d0cf1a6cace20196b48602.reference || (__cxx_static_address_f8d0cf1a6cace20196b48602.reference = {
    __cReference: true,
    get value() { return MASKWALL14____header_global_4883b29576cfc481; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:439
export const TIRE____header_global_3ad95af3069e609c = ((((((990) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7dfd2140c330482520fb527d() {
  return __cxx_static_address_7dfd2140c330482520fb527d.reference || (__cxx_static_address_7dfd2140c330482520fb527d.reference = {
    __cReference: true,
    get value() { return TIRE____header_global_3ad95af3069e609c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:440
export const PIPE5____header_global_7c9da464e9669547 = ((((((994) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4d506be93bd31279b277b1a8() {
  return __cxx_static_address_4d506be93bd31279b277b1a8.reference || (__cxx_static_address_4d506be93bd31279b277b1a8.reference = {
    __cReference: true,
    get value() { return PIPE5____header_global_7c9da464e9669547; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:441
export const PIPE6____header_global_71907f9074768649 = ((((((995) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fa382bf5ff04abafe7b747ce() {
  return __cxx_static_address_fa382bf5ff04abafe7b747ce.reference || (__cxx_static_address_fa382bf5ff04abafe7b747ce.reference = {
    __cReference: true,
    get value() { return PIPE6____header_global_71907f9074768649; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:442
export const PIPE4____header_global_c0dc2652470245e8 = ((((((996) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e03c4a247cfab2edb67a6ce7() {
  return __cxx_static_address_e03c4a247cfab2edb67a6ce7.reference || (__cxx_static_address_e03c4a247cfab2edb67a6ce7.reference = {
    __cReference: true,
    get value() { return PIPE4____header_global_c0dc2652470245e8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:443
export const PIPE4B____header_global_21d52e17d87cf032 = ((((((997) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_83ebd9080d0c495f5b06fb3e() {
  return __cxx_static_address_83ebd9080d0c495f5b06fb3e.reference || (__cxx_static_address_83ebd9080d0c495f5b06fb3e.reference = {
    __cReference: true,
    get value() { return PIPE4B____header_global_21d52e17d87cf032; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:444
export const BROKEHYDROPLANT____header_global_88b23f628471c809 = ((((((1003) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_96e75bec38dd658385e23335() {
  return __cxx_static_address_96e75bec38dd658385e23335.reference || (__cxx_static_address_96e75bec38dd658385e23335.reference = {
    __cReference: true,
    get value() { return BROKEHYDROPLANT____header_global_88b23f628471c809; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:445
export const PIPE5B____header_global_2b2da471a489a56d = ((((((1005) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2ab9955c632b2fe410e06196() {
  return __cxx_static_address_2ab9955c632b2fe410e06196.reference || (__cxx_static_address_2ab9955c632b2fe410e06196.reference = {
    __cReference: true,
    get value() { return PIPE5B____header_global_2b2da471a489a56d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:446
export const NEON3____header_global_7e40caf497c38e1a = ((((((1007) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ce431f542d2e6cddf4451624() {
  return __cxx_static_address_ce431f542d2e6cddf4451624.reference || (__cxx_static_address_ce431f542d2e6cddf4451624.reference = {
    __cReference: true,
    get value() { return NEON3____header_global_7e40caf497c38e1a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:447
export const NEON4____header_global_45fa82bc89769f45 = ((((((1008) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0f7e98bf822ac1b11ffc0bfe() {
  return __cxx_static_address_0f7e98bf822ac1b11ffc0bfe.reference || (__cxx_static_address_0f7e98bf822ac1b11ffc0bfe.reference = {
    __cReference: true,
    get value() { return NEON4____header_global_45fa82bc89769f45; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:448
export const NEON5____header_global_a8867e6f6b698fdc = ((((((1009) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7bb9a82df2eb6981eadfca72() {
  return __cxx_static_address_7bb9a82df2eb6981eadfca72.reference || (__cxx_static_address_7bb9a82df2eb6981eadfca72.reference = {
    __cReference: true,
    get value() { return NEON5____header_global_a8867e6f6b698fdc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:449
export const BOTTLE5____header_global_47ee48a0fc01d80e = ((((((1012) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_76ee046d68244de73cdbb65a() {
  return __cxx_static_address_76ee046d68244de73cdbb65a.reference || (__cxx_static_address_76ee046d68244de73cdbb65a.reference = {
    __cReference: true,
    get value() { return BOTTLE5____header_global_47ee48a0fc01d80e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:450
export const BOTTLE6____header_global_edce6bc424ea8eff = ((((((1013) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e924556f710bbfd1a9868236() {
  return __cxx_static_address_e924556f710bbfd1a9868236.reference || (__cxx_static_address_e924556f710bbfd1a9868236.reference = {
    __cReference: true,
    get value() { return BOTTLE6____header_global_edce6bc424ea8eff; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:451
export const BOTTLE8____header_global_e74542281f462377 = ((((((1014) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_175590853e0025699fb6abad() {
  return __cxx_static_address_175590853e0025699fb6abad.reference || (__cxx_static_address_175590853e0025699fb6abad.reference = {
    __cReference: true,
    get value() { return BOTTLE8____header_global_e74542281f462377; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:452
export const SPOTLITE____header_global_93de0f3c39ccf43a = ((((((1020) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ffab4e0d3bba00c973881553() {
  return __cxx_static_address_ffab4e0d3bba00c973881553.reference || (__cxx_static_address_ffab4e0d3bba00c973881553.reference = {
    __cReference: true,
    get value() { return SPOTLITE____header_global_93de0f3c39ccf43a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:453
export const MASKWALL15____header_global_3e8c4e9195ea8e49 = ((((((1024) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_805bcd737cd841077e87b6b1() {
  return __cxx_static_address_805bcd737cd841077e87b6b1.reference || (__cxx_static_address_805bcd737cd841077e87b6b1.reference = {
    __cReference: true,
    get value() { return MASKWALL15____header_global_3e8c4e9195ea8e49; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:454
export const BOTTLE7____header_global_18cac003215a0db1 = ((((((1025) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3d262d04ac306aba02c0ca53() {
  return __cxx_static_address_3d262d04ac306aba02c0ca53.reference || (__cxx_static_address_3d262d04ac306aba02c0ca53.reference = {
    __cReference: true,
    get value() { return BOTTLE7____header_global_18cac003215a0db1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:455
export const HORSEONSIDE____header_global_740e2081395ac1a3 = ((((((1026) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_04957046e0e686aab3db602f() {
  return __cxx_static_address_04957046e0e686aab3db602f.reference || (__cxx_static_address_04957046e0e686aab3db602f.reference = {
    __cReference: true,
    get value() { return HORSEONSIDE____header_global_740e2081395ac1a3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:456
export const GLASSPIECES____header_global_bb42abb2c14f750a = ((((((1031) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e40ffeeb8d0571c32a9fc2bc() {
  return __cxx_static_address_e40ffeeb8d0571c32a9fc2bc.reference || (__cxx_static_address_e40ffeeb8d0571c32a9fc2bc.reference = {
    __cReference: true,
    get value() { return GLASSPIECES____header_global_bb42abb2c14f750a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:457
export const NEON6____header_global_312ed5da94a5b349 = ((((((1046) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c5909bdf51aec67cc2a1508b() {
  return __cxx_static_address_c5909bdf51aec67cc2a1508b.reference || (__cxx_static_address_c5909bdf51aec67cc2a1508b.reference = {
    __cReference: true,
    get value() { return NEON6____header_global_312ed5da94a5b349; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:458
export const MASKWALL6____header_global_745c6dbc1e1c0ddd = ((((((1059) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f64143f7ab4eb86d9ea8848a() {
  return __cxx_static_address_f64143f7ab4eb86d9ea8848a.reference || (__cxx_static_address_f64143f7ab4eb86d9ea8848a.reference = {
    __cReference: true,
    get value() { return MASKWALL6____header_global_745c6dbc1e1c0ddd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:459
export const RUBBERCAN____header_global_aca7a3103cdc02ba = ((((((1062) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9d0c218d0e15c5db30016d45() {
  return __cxx_static_address_9d0c218d0e15c5db30016d45.reference || (__cxx_static_address_9d0c218d0e15c5db30016d45.reference = {
    __cReference: true,
    get value() { return RUBBERCAN____header_global_aca7a3103cdc02ba; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:460
export const PLUG____header_global_895be46a1fad3509 = ((((((1069) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4fd6d4e7d22c589de82890bd() {
  return __cxx_static_address_4fd6d4e7d22c589de82890bd.reference || (__cxx_static_address_4fd6d4e7d22c589de82890bd.reference = {
    __cReference: true,
    get value() { return PLUG____header_global_895be46a1fad3509; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:461
export const OOZFILTER____header_global_9209a7be1d083dbf = ((((((1079) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_02d61d3aa62f2341d5d3ae89() {
  return __cxx_static_address_02d61d3aa62f2341d5d3ae89.reference || (__cxx_static_address_02d61d3aa62f2341d5d3ae89.reference = {
    __cReference: true,
    get value() { return OOZFILTER____header_global_9209a7be1d083dbf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:462
export const FLOORPLASMA____header_global_9c1c4488ba96a28d = ((((((1082) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e7a95675fcd580fb4bf9086a() {
  return __cxx_static_address_e7a95675fcd580fb4bf9086a.reference || (__cxx_static_address_e7a95675fcd580fb4bf9086a.reference = {
    __cReference: true,
    get value() { return FLOORPLASMA____header_global_9c1c4488ba96a28d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:463
export const REACTOR____header_global_a219ad3736861b13 = ((((((1088) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8aa2a519269888c5843bd791() {
  return __cxx_static_address_8aa2a519269888c5843bd791.reference || (__cxx_static_address_8aa2a519269888c5843bd791.reference = {
    __cReference: true,
    get value() { return REACTOR____header_global_a219ad3736861b13; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:464
export const REACTORSPARK____header_global_6093d1335abd7353 = ((((((1092) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0a4236b20cc6b3a838265caa() {
  return __cxx_static_address_0a4236b20cc6b3a838265caa.reference || (__cxx_static_address_0a4236b20cc6b3a838265caa.reference = {
    __cReference: true,
    get value() { return REACTORSPARK____header_global_6093d1335abd7353; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:465
export const REACTORBURNT____header_global_52ffb37144a258be = ((((((1096) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ca9739f11c17e1ec19364d2c() {
  return __cxx_static_address_ca9739f11c17e1ec19364d2c.reference || (__cxx_static_address_ca9739f11c17e1ec19364d2c.reference = {
    __cReference: true,
    get value() { return REACTORBURNT____header_global_52ffb37144a258be; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:466
export const DOORTILE15____header_global_04250aa61b564e82 = ((((((1102) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9e084c1d3ee8cdb02d86bfbe() {
  return __cxx_static_address_9e084c1d3ee8cdb02d86bfbe.reference || (__cxx_static_address_9e084c1d3ee8cdb02d86bfbe.reference = {
    __cReference: true,
    get value() { return DOORTILE15____header_global_04250aa61b564e82; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:467
export const HANDSWITCH____header_global_e4801c70c2c1039e = ((((((1111) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_236ad4777d7fd5eaf89f9d45() {
  return __cxx_static_address_236ad4777d7fd5eaf89f9d45.reference || (__cxx_static_address_236ad4777d7fd5eaf89f9d45.reference = {
    __cReference: true,
    get value() { return HANDSWITCH____header_global_e4801c70c2c1039e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:468
export const CIRCLEPANNEL____header_global_9a1fb4612a245ca0 = ((((((1113) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0b5e8e914508fed46e823f84() {
  return __cxx_static_address_0b5e8e914508fed46e823f84.reference || (__cxx_static_address_0b5e8e914508fed46e823f84.reference = {
    __cReference: true,
    get value() { return CIRCLEPANNEL____header_global_9a1fb4612a245ca0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:469
export const CIRCLEPANNELBROKE____header_global_7faea09aff44ff97 = ((((((1114) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_567fa3c24e5f84553186fce9() {
  return __cxx_static_address_567fa3c24e5f84553186fce9.reference || (__cxx_static_address_567fa3c24e5f84553186fce9.reference = {
    __cReference: true,
    get value() { return CIRCLEPANNELBROKE____header_global_7faea09aff44ff97; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:470
export const PULLSWITCH____header_global_2eda5621809e3bcc = ((((((1122) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_219040886e81da51832ae05e() {
  return __cxx_static_address_219040886e81da51832ae05e.reference || (__cxx_static_address_219040886e81da51832ae05e.reference = {
    __cReference: true,
    get value() { return PULLSWITCH____header_global_2eda5621809e3bcc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:471
export const MASKWALL8____header_global_37525dc1f48317e8 = ((((((1124) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a9321fe8a6f0b3843085902d() {
  return __cxx_static_address_a9321fe8a6f0b3843085902d.reference || (__cxx_static_address_a9321fe8a6f0b3843085902d.reference = {
    __cReference: true,
    get value() { return MASKWALL8____header_global_37525dc1f48317e8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:472
export const BIGHOLE____header_global_3defb6ae88b43bf9 = ((((((1141) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3647441eb8e3bffb1d8f8047() {
  return __cxx_static_address_3647441eb8e3bffb1d8f8047.reference || (__cxx_static_address_3647441eb8e3bffb1d8f8047.reference = {
    __cReference: true,
    get value() { return BIGHOLE____header_global_3defb6ae88b43bf9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:473
export const ALIENSWITCH____header_global_0b5181bf7fb9d168 = ((((((1142) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_76bf6d59204f6c9f37f59d77() {
  return __cxx_static_address_76bf6d59204f6c9f37f59d77.reference || (__cxx_static_address_76bf6d59204f6c9f37f59d77.reference = {
    __cReference: true,
    get value() { return ALIENSWITCH____header_global_0b5181bf7fb9d168; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:474
export const DOORTILE21____header_global_dd7677209881ec9e = ((((((1144) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_16ed07ca8c6066dc9982f1ac() {
  return __cxx_static_address_16ed07ca8c6066dc9982f1ac.reference || (__cxx_static_address_16ed07ca8c6066dc9982f1ac.reference = {
    __cReference: true,
    get value() { return DOORTILE21____header_global_dd7677209881ec9e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:475
export const HANDPRINTSWITCH____header_global_e7a34ee8cb42bf01 = ((((((1155) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d791ff90f06f3a8aa621da3d() {
  return __cxx_static_address_d791ff90f06f3a8aa621da3d.reference || (__cxx_static_address_d791ff90f06f3a8aa621da3d.reference = {
    __cReference: true,
    get value() { return HANDPRINTSWITCH____header_global_e7a34ee8cb42bf01; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:476
export const BOTTLE10____header_global_80c0270ed3cf2c58 = ((((((1157) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e3a120094c1d6b7b39896602() {
  return __cxx_static_address_e3a120094c1d6b7b39896602.reference || (__cxx_static_address_e3a120094c1d6b7b39896602.reference = {
    __cReference: true,
    get value() { return BOTTLE10____header_global_80c0270ed3cf2c58; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:477
export const BOTTLE11____header_global_3d8a792a46f92bf8 = ((((((1158) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4e0b7073e5b8f801b13dcaf0() {
  return __cxx_static_address_4e0b7073e5b8f801b13dcaf0.reference || (__cxx_static_address_4e0b7073e5b8f801b13dcaf0.reference = {
    __cReference: true,
    get value() { return BOTTLE11____header_global_3d8a792a46f92bf8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:478
export const BOTTLE12____header_global_fd7e431cf44c8b95 = ((((((1159) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_979c323806743955288a7ece() {
  return __cxx_static_address_979c323806743955288a7ece.reference || (__cxx_static_address_979c323806743955288a7ece.reference = {
    __cReference: true,
    get value() { return BOTTLE12____header_global_fd7e431cf44c8b95; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:479
export const BOTTLE13____header_global_033c311cd6d297a1 = ((((((1160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a23bb6bff0fff4b975802fce() {
  return __cxx_static_address_a23bb6bff0fff4b975802fce.reference || (__cxx_static_address_a23bb6bff0fff4b975802fce.reference = {
    __cReference: true,
    get value() { return BOTTLE13____header_global_033c311cd6d297a1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:480
export const BOTTLE14____header_global_fa7e96ba7716e3b6 = ((((((1161) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_80763e26787616f7c2593e71() {
  return __cxx_static_address_80763e26787616f7c2593e71.reference || (__cxx_static_address_80763e26787616f7c2593e71.reference = {
    __cReference: true,
    get value() { return BOTTLE14____header_global_fa7e96ba7716e3b6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:481
export const BOTTLE15____header_global_b179d24f543e3d3d = ((((((1162) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e5f61a4efd71ed55b3c51573() {
  return __cxx_static_address_e5f61a4efd71ed55b3c51573.reference || (__cxx_static_address_e5f61a4efd71ed55b3c51573.reference = {
    __cReference: true,
    get value() { return BOTTLE15____header_global_b179d24f543e3d3d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:482
export const BOTTLE16____header_global_c3b4a97d9bcd952d = ((((((1163) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fcdf2557a59039d03c21c813() {
  return __cxx_static_address_fcdf2557a59039d03c21c813.reference || (__cxx_static_address_fcdf2557a59039d03c21c813.reference = {
    __cReference: true,
    get value() { return BOTTLE16____header_global_c3b4a97d9bcd952d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:483
export const BOTTLE17____header_global_0eb505bc0a80cf05 = ((((((1164) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1ae7f084c4fc9998f49a8992() {
  return __cxx_static_address_1ae7f084c4fc9998f49a8992.reference || (__cxx_static_address_1ae7f084c4fc9998f49a8992.reference = {
    __cReference: true,
    get value() { return BOTTLE17____header_global_0eb505bc0a80cf05; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:484
export const BOTTLE18____header_global_968c37a573d22f82 = ((((((1165) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6d2facc01e6713e13677560c() {
  return __cxx_static_address_6d2facc01e6713e13677560c.reference || (__cxx_static_address_6d2facc01e6713e13677560c.reference = {
    __cReference: true,
    get value() { return BOTTLE18____header_global_968c37a573d22f82; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:485
export const BOTTLE19____header_global_c493c0267280941a = ((((((1166) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_409e08756a820ad0338250be() {
  return __cxx_static_address_409e08756a820ad0338250be.reference || (__cxx_static_address_409e08756a820ad0338250be.reference = {
    __cReference: true,
    get value() { return BOTTLE19____header_global_c493c0267280941a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:486
export const DOORTILE17____header_global_4c3ae399977db8a3 = ((((((1169) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1c513cda7bc9781165d93dd5() {
  return __cxx_static_address_1c513cda7bc9781165d93dd5.reference || (__cxx_static_address_1c513cda7bc9781165d93dd5.reference = {
    __cReference: true,
    get value() { return DOORTILE17____header_global_4c3ae399977db8a3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:487
export const MASKWALL7____header_global_3c68d5d5e37bc592 = ((((((1174) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e7199e8dac8bbc8890db7b82() {
  return __cxx_static_address_e7199e8dac8bbc8890db7b82.reference || (__cxx_static_address_e7199e8dac8bbc8890db7b82.reference = {
    __cReference: true,
    get value() { return MASKWALL7____header_global_3c68d5d5e37bc592; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:488
export const DOORTILE11____header_global_e972269b55b41c5a = ((((((1178) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_92a361f8fb488823009d996a() {
  return __cxx_static_address_92a361f8fb488823009d996a.reference || (__cxx_static_address_92a361f8fb488823009d996a.reference = {
    __cReference: true,
    get value() { return DOORTILE11____header_global_e972269b55b41c5a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:489
export const DOORTILE12____header_global_0a2d64c1b89dd230 = ((((((1179) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6fa4978b1ee82b21d2cc3682() {
  return __cxx_static_address_6fa4978b1ee82b21d2cc3682.reference || (__cxx_static_address_6fa4978b1ee82b21d2cc3682.reference = {
    __cReference: true,
    get value() { return DOORTILE12____header_global_0a2d64c1b89dd230; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:490
export const VENDMACHINE____header_global_95ba4ac650378ac9 = ((((((1212) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_88bf4e0aa8f6939e91cc734e() {
  return __cxx_static_address_88bf4e0aa8f6939e91cc734e.reference || (__cxx_static_address_88bf4e0aa8f6939e91cc734e.reference = {
    __cReference: true,
    get value() { return VENDMACHINE____header_global_95ba4ac650378ac9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:491
export const COLAMACHINE____header_global_3eacef39ef18ab3d = ((((((1215) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6097441fea7d165cb7148be5() {
  return __cxx_static_address_6097441fea7d165cb7148be5.reference || (__cxx_static_address_6097441fea7d165cb7148be5.reference = {
    __cReference: true,
    get value() { return COLAMACHINE____header_global_3eacef39ef18ab3d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:492
export const CRANEPOLE____header_global_68120c4d92888f9f = ((((((1221) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eb2423194dc6570eeba07260() {
  return __cxx_static_address_eb2423194dc6570eeba07260.reference || (__cxx_static_address_eb2423194dc6570eeba07260.reference = {
    __cReference: true,
    get value() { return CRANEPOLE____header_global_68120c4d92888f9f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:493
export const CRANE____header_global_c8f6f2a80925cecb = ((((((1222) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0fa76774b3f6849604e30cad() {
  return __cxx_static_address_0fa76774b3f6849604e30cad.reference || (__cxx_static_address_0fa76774b3f6849604e30cad.reference = {
    __cReference: true,
    get value() { return CRANE____header_global_c8f6f2a80925cecb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:494
export const BARBROKE____header_global_df51520987be8593 = ((((((1225) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_34d2b7b78b21a2f493f81d2b() {
  return __cxx_static_address_34d2b7b78b21a2f493f81d2b.reference || (__cxx_static_address_34d2b7b78b21a2f493f81d2b.reference = {
    __cReference: true,
    get value() { return BARBROKE____header_global_df51520987be8593; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:495
export const BLOODPOOL____header_global_be1ab07b58284dbd = ((((((1226) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_af47346535e803500a1b7261() {
  return __cxx_static_address_af47346535e803500a1b7261.reference || (__cxx_static_address_af47346535e803500a1b7261.reference = {
    __cReference: true,
    get value() { return BLOODPOOL____header_global_be1ab07b58284dbd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:496
export const NUKEBARREL____header_global_0d4b45c7b8a032c4 = ((((((1227) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_576173e5ab6980943390fb6d() {
  return __cxx_static_address_576173e5ab6980943390fb6d.reference || (__cxx_static_address_576173e5ab6980943390fb6d.reference = {
    __cReference: true,
    get value() { return NUKEBARREL____header_global_0d4b45c7b8a032c4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:497
export const NUKEBARRELDENTED____header_global_4f928f3c6f33cd3f = ((((((1228) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5f403f08c5e59b1ac285a0f9() {
  return __cxx_static_address_5f403f08c5e59b1ac285a0f9.reference || (__cxx_static_address_5f403f08c5e59b1ac285a0f9.reference = {
    __cReference: true,
    get value() { return NUKEBARRELDENTED____header_global_4f928f3c6f33cd3f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:498
export const NUKEBARRELLEAKED____header_global_69d964b881ae736c = ((((((1229) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7bde56c32110f3782cd7302e() {
  return __cxx_static_address_7bde56c32110f3782cd7302e.reference || (__cxx_static_address_7bde56c32110f3782cd7302e.reference = {
    __cReference: true,
    get value() { return NUKEBARRELLEAKED____header_global_69d964b881ae736c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:499
export const CANWITHSOMETHING____header_global_106cab8f97ff69f8 = ((((((1232) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_70e4c4b1b18e494b2b573b7e() {
  return __cxx_static_address_70e4c4b1b18e494b2b573b7e.reference || (__cxx_static_address_70e4c4b1b18e494b2b573b7e.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING____header_global_106cab8f97ff69f8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:500
export const MONEY____header_global_22b9d18a09c58205 = ((((((1233) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ef3b0a5fc9177e99c503c8ea() {
  return __cxx_static_address_ef3b0a5fc9177e99c503c8ea.reference || (__cxx_static_address_ef3b0a5fc9177e99c503c8ea.reference = {
    __cReference: true,
    get value() { return MONEY____header_global_22b9d18a09c58205; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:501
export const BANNER____header_global_286acc62c1e1420b = ((((((1236) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e3abea3616e2f4fe6773c4ce() {
  return __cxx_static_address_e3abea3616e2f4fe6773c4ce.reference || (__cxx_static_address_e3abea3616e2f4fe6773c4ce.reference = {
    __cReference: true,
    get value() { return BANNER____header_global_286acc62c1e1420b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:502
export const EXPLODINGBARREL____header_global_f69308bd4559145b = ((((((1238) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dc57d20a625cbcb7c6d3c3c9() {
  return __cxx_static_address_dc57d20a625cbcb7c6d3c3c9.reference || (__cxx_static_address_dc57d20a625cbcb7c6d3c3c9.reference = {
    __cReference: true,
    get value() { return EXPLODINGBARREL____header_global_f69308bd4559145b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:503
export const EXPLODINGBARREL2____header_global_9bcbb116c54c8c04 = ((((((1239) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c380c488bf873e5f9fe2251c() {
  return __cxx_static_address_c380c488bf873e5f9fe2251c.reference || (__cxx_static_address_c380c488bf873e5f9fe2251c.reference = {
    __cReference: true,
    get value() { return EXPLODINGBARREL2____header_global_9bcbb116c54c8c04; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:504
export const FIREBARREL____header_global_fe99abd96b719eb4 = ((((((1240) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_78557632413469fd6efabef2() {
  return __cxx_static_address_78557632413469fd6efabef2.reference || (__cxx_static_address_78557632413469fd6efabef2.reference = {
    __cReference: true,
    get value() { return FIREBARREL____header_global_fe99abd96b719eb4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:505
export const SEENINE____header_global_e32154a9aee3440b = ((((((1247) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_836bd3dca4a9f2adfbe5eb08() {
  return __cxx_static_address_836bd3dca4a9f2adfbe5eb08.reference || (__cxx_static_address_836bd3dca4a9f2adfbe5eb08.reference = {
    __cReference: true,
    get value() { return SEENINE____header_global_e32154a9aee3440b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:506
export const SEENINEDEAD____header_global_9635784b17975344 = ((((((1248) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c7758df34460f46b33da14d6() {
  return __cxx_static_address_c7758df34460f46b33da14d6.reference || (__cxx_static_address_c7758df34460f46b33da14d6.reference = {
    __cReference: true,
    get value() { return SEENINEDEAD____header_global_9635784b17975344; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:507
export const STEAM____header_global_01bb4b70c9de6a5e = ((((((1250) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5677ffe2540b59811dad1ef2() {
  return __cxx_static_address_5677ffe2540b59811dad1ef2.reference || (__cxx_static_address_5677ffe2540b59811dad1ef2.reference = {
    __cReference: true,
    get value() { return STEAM____header_global_01bb4b70c9de6a5e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:508
export const CEILINGSTEAM____header_global_b5f39108e7758b26 = ((((((1255) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3e7d5daee5540f57c6f1688e() {
  return __cxx_static_address_3e7d5daee5540f57c6f1688e.reference || (__cxx_static_address_3e7d5daee5540f57c6f1688e.reference = {
    __cReference: true,
    get value() { return CEILINGSTEAM____header_global_b5f39108e7758b26; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:509
export const PIPE6B____header_global_b2791a874ed75e6f = ((((((1260) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4ab6b1b96bc6e9178ab91e75() {
  return __cxx_static_address_4ab6b1b96bc6e9178ab91e75.reference || (__cxx_static_address_4ab6b1b96bc6e9178ab91e75.reference = {
    __cReference: true,
    get value() { return PIPE6B____header_global_b2791a874ed75e6f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:510
export const TRANSPORTERBEAM____header_global_0cd75d7751961f88 = ((((((1261) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_349d515b34a97344aefddfae() {
  return __cxx_static_address_349d515b34a97344aefddfae.reference || (__cxx_static_address_349d515b34a97344aefddfae.reference = {
    __cReference: true,
    get value() { return TRANSPORTERBEAM____header_global_0cd75d7751961f88; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:511
export const RAT____header_global_c21df4e8db1662d7 = ((((((1267) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ec307c8abaccab1aec81ae97() {
  return __cxx_static_address_ec307c8abaccab1aec81ae97.reference || (__cxx_static_address_ec307c8abaccab1aec81ae97.reference = {
    __cReference: true,
    get value() { return RAT____header_global_c21df4e8db1662d7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:512
export const TRASH____header_global_253fe3a46d8fc8f1 = ((((((1272) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0e92c2e1406936e090db9bf3() {
  return __cxx_static_address_0e92c2e1406936e090db9bf3.reference || (__cxx_static_address_0e92c2e1406936e090db9bf3.reference = {
    __cReference: true,
    get value() { return TRASH____header_global_253fe3a46d8fc8f1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:513
export const FEMPIC1____header_global_8abadaf0960bd29f = ((((((1280) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b1808a2958404aa48cd31383() {
  return __cxx_static_address_b1808a2958404aa48cd31383.reference || (__cxx_static_address_b1808a2958404aa48cd31383.reference = {
    __cReference: true,
    get value() { return FEMPIC1____header_global_8abadaf0960bd29f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:514
export const FEMPIC2____header_global_2b042aab25a75f52 = ((((((1289) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d9d806b875af748cb07dce2b() {
  return __cxx_static_address_d9d806b875af748cb07dce2b.reference || (__cxx_static_address_d9d806b875af748cb07dce2b.reference = {
    __cReference: true,
    get value() { return FEMPIC2____header_global_2b042aab25a75f52; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:515
export const BLANKSCREEN____header_global_c4452d87585de303 = ((((((1293) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6aab80014ab772971b0b8cd7() {
  return __cxx_static_address_6aab80014ab772971b0b8cd7.reference || (__cxx_static_address_6aab80014ab772971b0b8cd7.reference = {
    __cReference: true,
    get value() { return BLANKSCREEN____header_global_c4452d87585de303; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:516
export const PODFEM1____header_global_be3943a33f390580 = ((((((1294) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3f44f5de47fa3fdf593ebef1() {
  return __cxx_static_address_3f44f5de47fa3fdf593ebef1.reference || (__cxx_static_address_3f44f5de47fa3fdf593ebef1.reference = {
    __cReference: true,
    get value() { return PODFEM1____header_global_be3943a33f390580; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:517
export const FEMPIC3____header_global_40110b42f232cbbe = ((((((1298) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_56d4c2ea343d9ae234c67ca3() {
  return __cxx_static_address_56d4c2ea343d9ae234c67ca3.reference || (__cxx_static_address_56d4c2ea343d9ae234c67ca3.reference = {
    __cReference: true,
    get value() { return FEMPIC3____header_global_40110b42f232cbbe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:518
export const FEMPIC4____header_global_3e1a41c31df313d3 = ((((((1306) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_79b471aa981e9312d460ca32() {
  return __cxx_static_address_79b471aa981e9312d460ca32.reference || (__cxx_static_address_79b471aa981e9312d460ca32.reference = {
    __cReference: true,
    get value() { return FEMPIC4____header_global_3e1a41c31df313d3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:519
export const FEM1____header_global_180b7467c004ee8e = ((((((1312) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4f5f85b67628c59ed705e1e3() {
  return __cxx_static_address_4f5f85b67628c59ed705e1e3.reference || (__cxx_static_address_4f5f85b67628c59ed705e1e3.reference = {
    __cReference: true,
    get value() { return FEM1____header_global_180b7467c004ee8e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:520
export const FEM2____header_global_f2643927c36545c9 = ((((((1317) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3f96a9b6a1278c9b7f1b11d8() {
  return __cxx_static_address_3f96a9b6a1278c9b7f1b11d8.reference || (__cxx_static_address_3f96a9b6a1278c9b7f1b11d8.reference = {
    __cReference: true,
    get value() { return FEM2____header_global_f2643927c36545c9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:521
export const FEM3____header_global_9ba4784e700559e1 = ((((((1321) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a3291bbae7bda956a920826b() {
  return __cxx_static_address_a3291bbae7bda956a920826b.reference || (__cxx_static_address_a3291bbae7bda956a920826b.reference = {
    __cReference: true,
    get value() { return FEM3____header_global_9ba4784e700559e1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:522
export const FEM5____header_global_29b9b80eec2c6f01 = ((((((1323) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b0b50d1f713587645bcd2e58() {
  return __cxx_static_address_b0b50d1f713587645bcd2e58.reference || (__cxx_static_address_b0b50d1f713587645bcd2e58.reference = {
    __cReference: true,
    get value() { return FEM5____header_global_29b9b80eec2c6f01; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:523
export const BLOODYPOLE____header_global_078237c409a5f751 = ((((((1324) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9211712c9f14d095008a30f6() {
  return __cxx_static_address_9211712c9f14d095008a30f6.reference || (__cxx_static_address_9211712c9f14d095008a30f6.reference = {
    __cReference: true,
    get value() { return BLOODYPOLE____header_global_078237c409a5f751; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:524
export const FEM4____header_global_579d06cf21d12fc2 = ((((((1325) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d64793f851512f7e3b81bdbd() {
  return __cxx_static_address_d64793f851512f7e3b81bdbd.reference || (__cxx_static_address_d64793f851512f7e3b81bdbd.reference = {
    __cReference: true,
    get value() { return FEM4____header_global_579d06cf21d12fc2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:525
export const FEM6____header_global_a9b4228e91abfb5d = ((((((1334) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bf75467fe08bb1ec4cb43105() {
  return __cxx_static_address_bf75467fe08bb1ec4cb43105.reference || (__cxx_static_address_bf75467fe08bb1ec4cb43105.reference = {
    __cReference: true,
    get value() { return FEM6____header_global_a9b4228e91abfb5d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:526
export const FEM6PAD____header_global_33d4142592572e42 = ((((((1335) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9b78a9d310df79db21c2731a() {
  return __cxx_static_address_9b78a9d310df79db21c2731a.reference || (__cxx_static_address_9b78a9d310df79db21c2731a.reference = {
    __cReference: true,
    get value() { return FEM6PAD____header_global_33d4142592572e42; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:527
export const FEM8____header_global_a8a3a452bf46424d = ((((((1336) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cd14b058661181bf0a1df137() {
  return __cxx_static_address_cd14b058661181bf0a1df137.reference || (__cxx_static_address_cd14b058661181bf0a1df137.reference = {
    __cReference: true,
    get value() { return FEM8____header_global_a8a3a452bf46424d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:528
export const HELECOPT____header_global_c7250c0caac8a685 = ((((((1346) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f431c09826555ab8238ecb53() {
  return __cxx_static_address_f431c09826555ab8238ecb53.reference || (__cxx_static_address_f431c09826555ab8238ecb53.reference = {
    __cReference: true,
    get value() { return HELECOPT____header_global_c7250c0caac8a685; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:529
export const FETUSJIB____header_global_bb9669f555188fa1 = ((((((1347) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b30cc0b2b2d3c1c28cde9a67() {
  return __cxx_static_address_b30cc0b2b2d3c1c28cde9a67.reference || (__cxx_static_address_b30cc0b2b2d3c1c28cde9a67.reference = {
    __cReference: true,
    get value() { return FETUSJIB____header_global_bb9669f555188fa1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:530
export const HOLODUKE____header_global_c51902574c621c36 = ((((((1348) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_90c347c2bfd4ef76c3f4f519() {
  return __cxx_static_address_90c347c2bfd4ef76c3f4f519.reference || (__cxx_static_address_90c347c2bfd4ef76c3f4f519.reference = {
    __cReference: true,
    get value() { return HOLODUKE____header_global_c51902574c621c36; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:531
export const SPACEMARINE____header_global_4f6174d041af8005 = ((((((1353) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d8f434d0a857eb72866ec9bd() {
  return __cxx_static_address_d8f434d0a857eb72866ec9bd.reference || (__cxx_static_address_d8f434d0a857eb72866ec9bd.reference = {
    __cReference: true,
    get value() { return SPACEMARINE____header_global_4f6174d041af8005; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:532
export const INDY____header_global_3bbba92586b40ddd = ((((((1355) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_96b641d24f1e36909e6cadaa() {
  return __cxx_static_address_96b641d24f1e36909e6cadaa.reference || (__cxx_static_address_96b641d24f1e36909e6cadaa.reference = {
    __cReference: true,
    get value() { return INDY____header_global_3bbba92586b40ddd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:533
export const FETUS____header_global_93b8cb7920fb08b0 = ((((((1358) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1896fba2f57b935aa1a8f442() {
  return __cxx_static_address_1896fba2f57b935aa1a8f442.reference || (__cxx_static_address_1896fba2f57b935aa1a8f442.reference = {
    __cReference: true,
    get value() { return FETUS____header_global_93b8cb7920fb08b0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:534
export const FETUSBROKE____header_global_2b702dcb235f8418 = ((((((1359) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_123a5be2beaa7f4738eb844e() {
  return __cxx_static_address_123a5be2beaa7f4738eb844e.reference || (__cxx_static_address_123a5be2beaa7f4738eb844e.reference = {
    __cReference: true,
    get value() { return FETUSBROKE____header_global_2b702dcb235f8418; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:535
export const MONK____header_global_e29bfdff3e317818 = ((((((1352) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_19d7fec40f71348748afe1bf() {
  return __cxx_static_address_19d7fec40f71348748afe1bf.reference || (__cxx_static_address_19d7fec40f71348748afe1bf.reference = {
    __cReference: true,
    get value() { return MONK____header_global_e29bfdff3e317818; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:536
export const LUKE____header_global_1e7ba28abea3d6b9 = ((((((1354) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3bbbcf44c55adff15cf37c6b() {
  return __cxx_static_address_3bbbcf44c55adff15cf37c6b.reference || (__cxx_static_address_3bbbcf44c55adff15cf37c6b.reference = {
    __cReference: true,
    get value() { return LUKE____header_global_1e7ba28abea3d6b9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:537
export const COOLEXPLOSION1____header_global_06145b844a783af5 = ((((((1360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_88fd74e61ed81aa0a7768d97() {
  return __cxx_static_address_88fd74e61ed81aa0a7768d97.reference || (__cxx_static_address_88fd74e61ed81aa0a7768d97.reference = {
    __cReference: true,
    get value() { return COOLEXPLOSION1____header_global_06145b844a783af5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:538
export const WATERSPLASH2____header_global_3c2536cce9d5c508 = ((((((1380) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8ab36a5549f864994d720bcb() {
  return __cxx_static_address_8ab36a5549f864994d720bcb.reference || (__cxx_static_address_8ab36a5549f864994d720bcb.reference = {
    __cReference: true,
    get value() { return WATERSPLASH2____header_global_3c2536cce9d5c508; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:539
export const FIREVASE____header_global_f333cdfd834853df = ((((((1390) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cebc2b775714b3d12f489a92() {
  return __cxx_static_address_cebc2b775714b3d12f489a92.reference || (__cxx_static_address_cebc2b775714b3d12f489a92.reference = {
    __cReference: true,
    get value() { return FIREVASE____header_global_f333cdfd834853df; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:540
export const FEM7____header_global_c2cdd99854e41675 = ((((((1395) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_59458fdddfe1742cc185d65c() {
  return __cxx_static_address_59458fdddfe1742cc185d65c.reference || (__cxx_static_address_59458fdddfe1742cc185d65c.reference = {
    __cReference: true,
    get value() { return FEM7____header_global_c2cdd99854e41675; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:541
export const APLAYERTOP____header_global_67b30de439dc7e15 = ((((((1400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_23aee3cc79ee6e57a16129f2() {
  return __cxx_static_address_23aee3cc79ee6e57a16129f2.reference || (__cxx_static_address_23aee3cc79ee6e57a16129f2.reference = {
    __cReference: true,
    get value() { return APLAYERTOP____header_global_67b30de439dc7e15; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:542
export const APLAYER____header_global_19a7cc57c263ec3c = ((((((1405) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e9c87c998925be23d0f6788f() {
  return __cxx_static_address_e9c87c998925be23d0f6788f.reference || (__cxx_static_address_e9c87c998925be23d0f6788f.reference = {
    __cReference: true,
    get value() { return APLAYER____header_global_19a7cc57c263ec3c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:543
export const PLAYERONWATER____header_global_adb3182223fccc66 = ((((((1420) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b097a2ce9790503025b8cfce() {
  return __cxx_static_address_b097a2ce9790503025b8cfce.reference || (__cxx_static_address_b097a2ce9790503025b8cfce.reference = {
    __cReference: true,
    get value() { return PLAYERONWATER____header_global_adb3182223fccc66; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:544
export const DUKELYINGDEAD____header_global_5ffcfc973d69671f = ((((((1518) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_89686199ddae2578d49cb0b4() {
  return __cxx_static_address_89686199ddae2578d49cb0b4.reference || (__cxx_static_address_89686199ddae2578d49cb0b4.reference = {
    __cReference: true,
    get value() { return DUKELYINGDEAD____header_global_5ffcfc973d69671f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:545
export const DUKETORSO____header_global_b4fa5d32411741d3 = ((((((1520) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1b49cc1c98f83100a16c8a07() {
  return __cxx_static_address_1b49cc1c98f83100a16c8a07.reference || (__cxx_static_address_1b49cc1c98f83100a16c8a07.reference = {
    __cReference: true,
    get value() { return DUKETORSO____header_global_b4fa5d32411741d3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:546
export const DUKEGUN____header_global_493bba1094e965ac = ((((((1528) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d1101fac78c776ba54abcb3e() {
  return __cxx_static_address_d1101fac78c776ba54abcb3e.reference || (__cxx_static_address_d1101fac78c776ba54abcb3e.reference = {
    __cReference: true,
    get value() { return DUKEGUN____header_global_493bba1094e965ac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:547
export const DUKELEG____header_global_a206e9916d9ba5ae = ((((((1536) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_50156782e374141301c8fa57() {
  return __cxx_static_address_50156782e374141301c8fa57.reference || (__cxx_static_address_50156782e374141301c8fa57.reference = {
    __cReference: true,
    get value() { return DUKELEG____header_global_a206e9916d9ba5ae; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:548
export const SHARK____header_global_3f01017308067840 = ((((((1550) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3fed8206aeed046dde34ba92() {
  return __cxx_static_address_3fed8206aeed046dde34ba92.reference || (__cxx_static_address_3fed8206aeed046dde34ba92.reference = {
    __cReference: true,
    get value() { return SHARK____header_global_3f01017308067840; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:549
export const BLOOD____header_global_30c81b0e1a6f3698 = ((((((1620) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b93dbbce866b4ac8281316f8() {
  return __cxx_static_address_b93dbbce866b4ac8281316f8.reference || (__cxx_static_address_b93dbbce866b4ac8281316f8.reference = {
    __cReference: true,
    get value() { return BLOOD____header_global_30c81b0e1a6f3698; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:550
export const FIRELASER____header_global_46506cbffb9df3ef = ((((((1625) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4eea98215dee9b82bba232dd() {
  return __cxx_static_address_4eea98215dee9b82bba232dd.reference || (__cxx_static_address_4eea98215dee9b82bba232dd.reference = {
    __cReference: true,
    get value() { return FIRELASER____header_global_46506cbffb9df3ef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:551
export const TRANSPORTERSTAR____header_global_d4944bdda8df1cf7 = ((((((1630) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1d12d7b856e0358aba33a1c2() {
  return __cxx_static_address_1d12d7b856e0358aba33a1c2.reference || (__cxx_static_address_1d12d7b856e0358aba33a1c2.reference = {
    __cReference: true,
    get value() { return TRANSPORTERSTAR____header_global_d4944bdda8df1cf7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:552
export const SPIT____header_global_83b0d64ff9742c6a = ((((((1636) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e1ccdb7971b751dd16504a81() {
  return __cxx_static_address_e1ccdb7971b751dd16504a81.reference || (__cxx_static_address_e1ccdb7971b751dd16504a81.reference = {
    __cReference: true,
    get value() { return SPIT____header_global_83b0d64ff9742c6a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:553
export const LOOGIE____header_global_759d6b60752ff6a0 = ((((((1637) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dd3a7acd5f73dbbf342f64c5() {
  return __cxx_static_address_dd3a7acd5f73dbbf342f64c5.reference || (__cxx_static_address_dd3a7acd5f73dbbf342f64c5.reference = {
    __cReference: true,
    get value() { return LOOGIE____header_global_759d6b60752ff6a0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:554
export const FIST____header_global_75688dc47adb2fea = ((((((1640) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2e74aede055bb62abadab371() {
  return __cxx_static_address_2e74aede055bb62abadab371.reference || (__cxx_static_address_2e74aede055bb62abadab371.reference = {
    __cReference: true,
    get value() { return FIST____header_global_75688dc47adb2fea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:555
export const FREEZEBLAST____header_global_52576a50925632f9 = ((((((1641) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2bec840f7e4f97ddf7e18b87() {
  return __cxx_static_address_2bec840f7e4f97ddf7e18b87.reference || (__cxx_static_address_2bec840f7e4f97ddf7e18b87.reference = {
    __cReference: true,
    get value() { return FREEZEBLAST____header_global_52576a50925632f9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:556
export const SHRINKSPARK____header_global_bcb6788e2da4c803 = ((((((1646) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c2c13edcee69d2da623a2996() {
  return __cxx_static_address_c2c13edcee69d2da623a2996.reference || (__cxx_static_address_c2c13edcee69d2da623a2996.reference = {
    __cReference: true,
    get value() { return SHRINKSPARK____header_global_bcb6788e2da4c803; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:557
export const TONGUE____header_global_2c9c511f1d922232 = ((((((1647) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_19ef4aa13552db1150fd3b1b() {
  return __cxx_static_address_19ef4aa13552db1150fd3b1b.reference || (__cxx_static_address_19ef4aa13552db1150fd3b1b.reference = {
    __cReference: true,
    get value() { return TONGUE____header_global_2c9c511f1d922232; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:558
export const MORTER____header_global_3cdb2e762f6fad75 = ((((((1650) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fab78c32448d7a4c668cf85a() {
  return __cxx_static_address_fab78c32448d7a4c668cf85a.reference || (__cxx_static_address_fab78c32448d7a4c668cf85a.reference = {
    __cReference: true,
    get value() { return MORTER____header_global_3cdb2e762f6fad75; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:559
export const SHRINKEREXPLOSION____header_global_95c2ec5e8bf31229 = ((((((1656) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cc3c2ea6ada55ce511ebfb5b() {
  return __cxx_static_address_cc3c2ea6ada55ce511ebfb5b.reference || (__cxx_static_address_cc3c2ea6ada55ce511ebfb5b.reference = {
    __cReference: true,
    get value() { return SHRINKEREXPLOSION____header_global_95c2ec5e8bf31229; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:560
export const RADIUSEXPLOSION____header_global_2e2c6e0a709028be = ((((((1670) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_079e3683d9d1f479c48a7026() {
  return __cxx_static_address_079e3683d9d1f479c48a7026.reference || (__cxx_static_address_079e3683d9d1f479c48a7026.reference = {
    __cReference: true,
    get value() { return RADIUSEXPLOSION____header_global_2e2c6e0a709028be; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:561
export const FORCERIPPLE____header_global_52bba75b3fa59b10 = ((((((1671) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8e3b9ac90c8dbc6f120c5507() {
  return __cxx_static_address_8e3b9ac90c8dbc6f120c5507.reference || (__cxx_static_address_8e3b9ac90c8dbc6f120c5507.reference = {
    __cReference: true,
    get value() { return FORCERIPPLE____header_global_52bba75b3fa59b10; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:562
export const LIZTROOP____header_global_a25532ff55f533da = ((((((1680) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_96ce32c314b72a57810411a1() {
  return __cxx_static_address_96ce32c314b72a57810411a1.reference || (__cxx_static_address_96ce32c314b72a57810411a1.reference = {
    __cReference: true,
    get value() { return LIZTROOP____header_global_a25532ff55f533da; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:563
export const LIZTROOPRUNNING____header_global_194f64a273505b61 = ((((((1681) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e63a5bb89f8c8c7bdb33367c() {
  return __cxx_static_address_e63a5bb89f8c8c7bdb33367c.reference || (__cxx_static_address_e63a5bb89f8c8c7bdb33367c.reference = {
    __cReference: true,
    get value() { return LIZTROOPRUNNING____header_global_194f64a273505b61; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:564
export const LIZTROOPSTAYPUT____header_global_aebf9e904fea3c86 = ((((((1682) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_597732b5277d9d52ea5ac626() {
  return __cxx_static_address_597732b5277d9d52ea5ac626.reference || (__cxx_static_address_597732b5277d9d52ea5ac626.reference = {
    __cReference: true,
    get value() { return LIZTROOPSTAYPUT____header_global_aebf9e904fea3c86; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:565
export const LIZTROOPSHOOT____header_global_03812d3620e20bc2 = ((((((1715) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_03d3cfddd8eb587cef0fc412() {
  return __cxx_static_address_03d3cfddd8eb587cef0fc412.reference || (__cxx_static_address_03d3cfddd8eb587cef0fc412.reference = {
    __cReference: true,
    get value() { return LIZTROOPSHOOT____header_global_03812d3620e20bc2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:566
export const LIZTROOPJETPACK____header_global_1eee2ac2f0cd6213 = ((((((1725) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_34766e6876b16e535ce2300a() {
  return __cxx_static_address_34766e6876b16e535ce2300a.reference || (__cxx_static_address_34766e6876b16e535ce2300a.reference = {
    __cReference: true,
    get value() { return LIZTROOPJETPACK____header_global_1eee2ac2f0cd6213; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:567
export const LIZTROOPONTOILET____header_global_fc657a3290ba5dd2 = ((((((1741) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b1dc8434d782a158554e07eb() {
  return __cxx_static_address_b1dc8434d782a158554e07eb.reference || (__cxx_static_address_b1dc8434d782a158554e07eb.reference = {
    __cReference: true,
    get value() { return LIZTROOPONTOILET____header_global_fc657a3290ba5dd2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:568
export const LIZTROOPJUSTSIT____header_global_c567839d216dcd87 = ((((((1742) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_90c6e2eb51e93845c6b3a868() {
  return __cxx_static_address_90c6e2eb51e93845c6b3a868.reference || (__cxx_static_address_90c6e2eb51e93845c6b3a868.reference = {
    __cReference: true,
    get value() { return LIZTROOPJUSTSIT____header_global_c567839d216dcd87; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:569
export const LIZTROOPDUCKING____header_global_928905ea07efeddf = ((((((1744) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6d0f45c8247abb796cb712c3() {
  return __cxx_static_address_6d0f45c8247abb796cb712c3.reference || (__cxx_static_address_6d0f45c8247abb796cb712c3.reference = {
    __cReference: true,
    get value() { return LIZTROOPDUCKING____header_global_928905ea07efeddf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:570
export const HEADJIB1____header_global_d8a757c83feda758 = ((((((1768) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_967ab83019db22f8fd3b7756() {
  return __cxx_static_address_967ab83019db22f8fd3b7756.reference || (__cxx_static_address_967ab83019db22f8fd3b7756.reference = {
    __cReference: true,
    get value() { return HEADJIB1____header_global_d8a757c83feda758; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:571
export const ARMJIB1____header_global_68902da5a8449fa1 = ((((((1772) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0106f4bd16fb1cae87c8d951() {
  return __cxx_static_address_0106f4bd16fb1cae87c8d951.reference || (__cxx_static_address_0106f4bd16fb1cae87c8d951.reference = {
    __cReference: true,
    get value() { return ARMJIB1____header_global_68902da5a8449fa1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:572
export const LEGJIB1____header_global_b4f3dfef8c7e8212 = ((((((1776) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ab1d540b8fa6b43e25f45c2b() {
  return __cxx_static_address_ab1d540b8fa6b43e25f45c2b.reference || (__cxx_static_address_ab1d540b8fa6b43e25f45c2b.reference = {
    __cReference: true,
    get value() { return LEGJIB1____header_global_b4f3dfef8c7e8212; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:573
export const OCTABRAIN____header_global_f426b15a5b4b37d5 = ((((((1820) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_05b0550c5630d53343677fa0() {
  return __cxx_static_address_05b0550c5630d53343677fa0.reference || (__cxx_static_address_05b0550c5630d53343677fa0.reference = {
    __cReference: true,
    get value() { return OCTABRAIN____header_global_f426b15a5b4b37d5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:574
export const OCTABRAINSTAYPUT____header_global_b72fd42f1853f28b = ((((((1821) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_654dc95158547199e8fc7ba0() {
  return __cxx_static_address_654dc95158547199e8fc7ba0.reference || (__cxx_static_address_654dc95158547199e8fc7ba0.reference = {
    __cReference: true,
    get value() { return OCTABRAINSTAYPUT____header_global_b72fd42f1853f28b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:575
export const INNERJAW____header_global_8fde2f77b6399f38 = ((((((1860) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4f9b82a87b71a1daf97cce1b() {
  return __cxx_static_address_4f9b82a87b71a1daf97cce1b.reference || (__cxx_static_address_4f9b82a87b71a1daf97cce1b.reference = {
    __cReference: true,
    get value() { return INNERJAW____header_global_8fde2f77b6399f38; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:576
export const DRONE____header_global_cdae2d839f967d48 = ((((((1880) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ed256f8abfb9b182e4022b6b() {
  return __cxx_static_address_ed256f8abfb9b182e4022b6b.reference || (__cxx_static_address_ed256f8abfb9b182e4022b6b.reference = {
    __cReference: true,
    get value() { return DRONE____header_global_cdae2d839f967d48; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:577
export const EXPLOSION2____header_global_156c5f9ca11a49ed = ((((((1890) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_20a96564e3816d09c18a5886() {
  return __cxx_static_address_20a96564e3816d09c18a5886.reference || (__cxx_static_address_20a96564e3816d09c18a5886.reference = {
    __cReference: true,
    get value() { return EXPLOSION2____header_global_156c5f9ca11a49ed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:578
export const COMMANDER____header_global_74ba21afb5be96c3 = ((((((1920) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_96c85e9af87c5c3564ef6fe4() {
  return __cxx_static_address_96c85e9af87c5c3564ef6fe4.reference || (__cxx_static_address_96c85e9af87c5c3564ef6fe4.reference = {
    __cReference: true,
    get value() { return COMMANDER____header_global_74ba21afb5be96c3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:579
export const COMMANDERSTAYPUT____header_global_02749a2cc1d35668 = ((((((1921) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_189a8dbf794ffde8578747a4() {
  return __cxx_static_address_189a8dbf794ffde8578747a4.reference || (__cxx_static_address_189a8dbf794ffde8578747a4.reference = {
    __cReference: true,
    get value() { return COMMANDERSTAYPUT____header_global_02749a2cc1d35668; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:580
export const RECON____header_global_b272642da7291567 = ((((((1960) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_26b69cc745d76a86c1fc5e3a() {
  return __cxx_static_address_26b69cc745d76a86c1fc5e3a.reference || (__cxx_static_address_26b69cc745d76a86c1fc5e3a.reference = {
    __cReference: true,
    get value() { return RECON____header_global_b272642da7291567; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:581
export const TANK____header_global_69ca69daea03bd57 = ((((((1975) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_49fb3af92b503a097a526670() {
  return __cxx_static_address_49fb3af92b503a097a526670.reference || (__cxx_static_address_49fb3af92b503a097a526670.reference = {
    __cReference: true,
    get value() { return TANK____header_global_69ca69daea03bd57; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:582
export const PIGCOP____header_global_771d44d8c29b7244 = ((((((2000) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b43a4b73f9d597ea9560d2f0() {
  return __cxx_static_address_b43a4b73f9d597ea9560d2f0.reference || (__cxx_static_address_b43a4b73f9d597ea9560d2f0.reference = {
    __cReference: true,
    get value() { return PIGCOP____header_global_771d44d8c29b7244; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:583
export const PIGCOPSTAYPUT____header_global_fcdf417c3dff4bec = ((((((2001) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b4c8eb836f3359527cba9153() {
  return __cxx_static_address_b4c8eb836f3359527cba9153.reference || (__cxx_static_address_b4c8eb836f3359527cba9153.reference = {
    __cReference: true,
    get value() { return PIGCOPSTAYPUT____header_global_fcdf417c3dff4bec; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:584
export const PIGCOPDIVE____header_global_d23631073213eb82 = ((((((2045) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_00496ca0aa68d3243ca31270() {
  return __cxx_static_address_00496ca0aa68d3243ca31270.reference || (__cxx_static_address_00496ca0aa68d3243ca31270.reference = {
    __cReference: true,
    get value() { return PIGCOPDIVE____header_global_d23631073213eb82; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:585
export const LIZMAN____header_global_9d1a7b91f02345a8 = ((((((2120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7ebe3bf14cf992eda93b4f85() {
  return __cxx_static_address_7ebe3bf14cf992eda93b4f85.reference || (__cxx_static_address_7ebe3bf14cf992eda93b4f85.reference = {
    __cReference: true,
    get value() { return LIZMAN____header_global_9d1a7b91f02345a8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:586
export const LIZMANSTAYPUT____header_global_0bfe7393a015d6aa = ((((((2121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_17b726ecf8199be201b1d549() {
  return __cxx_static_address_17b726ecf8199be201b1d549.reference || (__cxx_static_address_17b726ecf8199be201b1d549.reference = {
    __cReference: true,
    get value() { return LIZMANSTAYPUT____header_global_0bfe7393a015d6aa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:587
export const LIZMANSPITTING____header_global_e6fceebf2c666483 = ((((((2150) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cb4aca84fbee3b2b088cde94() {
  return __cxx_static_address_cb4aca84fbee3b2b088cde94.reference || (__cxx_static_address_cb4aca84fbee3b2b088cde94.reference = {
    __cReference: true,
    get value() { return LIZMANSPITTING____header_global_e6fceebf2c666483; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:588
export const LIZMANFEEDING____header_global_fb107c2484fd3ede = ((((((2160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_380cfc5a31ac9f5ddbca243a() {
  return __cxx_static_address_380cfc5a31ac9f5ddbca243a.reference || (__cxx_static_address_380cfc5a31ac9f5ddbca243a.reference = {
    __cReference: true,
    get value() { return LIZMANFEEDING____header_global_fb107c2484fd3ede; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:589
export const LIZMANJUMP____header_global_5e465d63cf8e544a = ((((((2165) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e0d79fac9eff8d55e8001449() {
  return __cxx_static_address_e0d79fac9eff8d55e8001449.reference || (__cxx_static_address_e0d79fac9eff8d55e8001449.reference = {
    __cReference: true,
    get value() { return LIZMANJUMP____header_global_5e465d63cf8e544a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:590
export const FECES____header_global_8ef90ccb1c88978f = ((((((2200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cdae98ae4d740c4d2b56def9() {
  return __cxx_static_address_cdae98ae4d740c4d2b56def9.reference || (__cxx_static_address_cdae98ae4d740c4d2b56def9.reference = {
    __cReference: true,
    get value() { return FECES____header_global_8ef90ccb1c88978f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:591
export const LIZMANHEAD1____header_global_d545ca159ac9b928 = ((((((2201) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c0192d25cbf56dee5913f3be() {
  return __cxx_static_address_c0192d25cbf56dee5913f3be.reference || (__cxx_static_address_c0192d25cbf56dee5913f3be.reference = {
    __cReference: true,
    get value() { return LIZMANHEAD1____header_global_d545ca159ac9b928; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:592
export const LIZMANARM1____header_global_6b7bcd20c3803992 = ((((((2205) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5dc2f1856c527c879b059ca9() {
  return __cxx_static_address_5dc2f1856c527c879b059ca9.reference || (__cxx_static_address_5dc2f1856c527c879b059ca9.reference = {
    __cReference: true,
    get value() { return LIZMANARM1____header_global_6b7bcd20c3803992; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:593
export const LIZMANLEG1____header_global_4c7063feae8d8275 = ((((((2209) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_47c80f6f0907651f5be5165e() {
  return __cxx_static_address_47c80f6f0907651f5be5165e.reference || (__cxx_static_address_47c80f6f0907651f5be5165e.reference = {
    __cReference: true,
    get value() { return LIZMANLEG1____header_global_4c7063feae8d8275; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:594
export const EXPLOSION2BOT____header_global_d9518e9dbe3cf532 = ((((((2219) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3d19ea418a1bb7596fda002b() {
  return __cxx_static_address_3d19ea418a1bb7596fda002b.reference || (__cxx_static_address_3d19ea418a1bb7596fda002b.reference = {
    __cReference: true,
    get value() { return EXPLOSION2BOT____header_global_d9518e9dbe3cf532; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:595
export const JIBS1____header_global_75fd70fdca67c176 = ((((((2245) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a4ab09ec2accced09afe1b65() {
  return __cxx_static_address_a4ab09ec2accced09afe1b65.reference || (__cxx_static_address_a4ab09ec2accced09afe1b65.reference = {
    __cReference: true,
    get value() { return JIBS1____header_global_75fd70fdca67c176; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:596
export const JIBS2____header_global_791536591a0c11c0 = ((((((2250) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f54e9056cbfdb900c551a6d6() {
  return __cxx_static_address_f54e9056cbfdb900c551a6d6.reference || (__cxx_static_address_f54e9056cbfdb900c551a6d6.reference = {
    __cReference: true,
    get value() { return JIBS2____header_global_791536591a0c11c0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:597
export const JIBS3____header_global_d83e96de527fa343 = ((((((2255) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_beeaa576700abb6cf44f19e8() {
  return __cxx_static_address_beeaa576700abb6cf44f19e8.reference || (__cxx_static_address_beeaa576700abb6cf44f19e8.reference = {
    __cReference: true,
    get value() { return JIBS3____header_global_d83e96de527fa343; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:598
export const JIBS4____header_global_627edde71fa2132f = ((((((2260) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_900f2f53d7402df4d232fc81() {
  return __cxx_static_address_900f2f53d7402df4d232fc81.reference || (__cxx_static_address_900f2f53d7402df4d232fc81.reference = {
    __cReference: true,
    get value() { return JIBS4____header_global_627edde71fa2132f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:599
export const JIBS5____header_global_062fce32a69a7f55 = ((((((2265) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_68a26111d11680862e3bd1f0() {
  return __cxx_static_address_68a26111d11680862e3bd1f0.reference || (__cxx_static_address_68a26111d11680862e3bd1f0.reference = {
    __cReference: true,
    get value() { return JIBS5____header_global_062fce32a69a7f55; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:600
export const BURNING____header_global_8dce725f3318c955 = ((((((2270) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4475fd677f43480f2171c564() {
  return __cxx_static_address_4475fd677f43480f2171c564.reference || (__cxx_static_address_4475fd677f43480f2171c564.reference = {
    __cReference: true,
    get value() { return BURNING____header_global_8dce725f3318c955; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:601
export const FIRE____header_global_b9016e1fcd067a6b = ((((((2271) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_659a4e311545a0977274d485() {
  return __cxx_static_address_659a4e311545a0977274d485.reference || (__cxx_static_address_659a4e311545a0977274d485.reference = {
    __cReference: true,
    get value() { return FIRE____header_global_b9016e1fcd067a6b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:602
export const JIBS6____header_global_f88e20a928f58da0 = ((((((2286) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_75bd5c95e8ddd3351256bb82() {
  return __cxx_static_address_75bd5c95e8ddd3351256bb82.reference || (__cxx_static_address_75bd5c95e8ddd3351256bb82.reference = {
    __cReference: true,
    get value() { return JIBS6____header_global_f88e20a928f58da0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:603
export const BLOODSPLAT1____header_global_25a1da2e9f580d12 = ((((((2296) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e53289d843f37eea151dea4f() {
  return __cxx_static_address_e53289d843f37eea151dea4f.reference || (__cxx_static_address_e53289d843f37eea151dea4f.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT1____header_global_25a1da2e9f580d12; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:604
export const BLOODSPLAT3____header_global_b6bf5ee58e2216e9 = ((((((2297) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_31ba343c8908ac55c492cc35() {
  return __cxx_static_address_31ba343c8908ac55c492cc35.reference || (__cxx_static_address_31ba343c8908ac55c492cc35.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT3____header_global_b6bf5ee58e2216e9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:605
export const BLOODSPLAT2____header_global_72fd212565728cb7 = ((((((2298) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_750c89d76443c503575b4449() {
  return __cxx_static_address_750c89d76443c503575b4449.reference || (__cxx_static_address_750c89d76443c503575b4449.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT2____header_global_72fd212565728cb7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:606
export const BLOODSPLAT4____header_global_64b461642bbc629c = ((((((2299) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bee4e5ae324f66a7321c8e46() {
  return __cxx_static_address_bee4e5ae324f66a7321c8e46.reference || (__cxx_static_address_bee4e5ae324f66a7321c8e46.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT4____header_global_64b461642bbc629c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:607
export const OOZ____header_global_7b328f3af4b04b09 = ((((((2300) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ea62ce0b287420874fb70852() {
  return __cxx_static_address_ea62ce0b287420874fb70852.reference || (__cxx_static_address_ea62ce0b287420874fb70852.reference = {
    __cReference: true,
    get value() { return OOZ____header_global_7b328f3af4b04b09; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:608
export const OOZ2____header_global_1de7fa6cf5f50ad3 = ((((((2309) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_98263ddcf310fcb08c365ed9() {
  return __cxx_static_address_98263ddcf310fcb08c365ed9.reference || (__cxx_static_address_98263ddcf310fcb08c365ed9.reference = {
    __cReference: true,
    get value() { return OOZ2____header_global_1de7fa6cf5f50ad3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:609
export const WALLBLOOD1____header_global_e56f98907209f565 = ((((((2301) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e6ee0807dc43d97ad43116b7() {
  return __cxx_static_address_e6ee0807dc43d97ad43116b7.reference || (__cxx_static_address_e6ee0807dc43d97ad43116b7.reference = {
    __cReference: true,
    get value() { return WALLBLOOD1____header_global_e56f98907209f565; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:610
export const WALLBLOOD2____header_global_c17879b6e5aa79b2 = ((((((2302) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2cffa5d7547538d0f9457915() {
  return __cxx_static_address_2cffa5d7547538d0f9457915.reference || (__cxx_static_address_2cffa5d7547538d0f9457915.reference = {
    __cReference: true,
    get value() { return WALLBLOOD2____header_global_c17879b6e5aa79b2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:611
export const WALLBLOOD3____header_global_b9787f92e5a86b3f = ((((((2303) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bce4f861bd036cd29f1611f0() {
  return __cxx_static_address_bce4f861bd036cd29f1611f0.reference || (__cxx_static_address_bce4f861bd036cd29f1611f0.reference = {
    __cReference: true,
    get value() { return WALLBLOOD3____header_global_b9787f92e5a86b3f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:612
export const WALLBLOOD4____header_global_0f467c76d3e5f871 = ((((((2304) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4a177846ad04f651035d77fd() {
  return __cxx_static_address_4a177846ad04f651035d77fd.reference || (__cxx_static_address_4a177846ad04f651035d77fd.reference = {
    __cReference: true,
    get value() { return WALLBLOOD4____header_global_0f467c76d3e5f871; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:613
export const WALLBLOOD5____header_global_609f51cc72e97608 = ((((((2305) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_38fd2952ba0044fb2aee55d3() {
  return __cxx_static_address_38fd2952ba0044fb2aee55d3.reference || (__cxx_static_address_38fd2952ba0044fb2aee55d3.reference = {
    __cReference: true,
    get value() { return WALLBLOOD5____header_global_609f51cc72e97608; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:614
export const WALLBLOOD7____header_global_a7faed7e6578d834 = ((((((2307) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9227027fba5f918d786a5a18() {
  return __cxx_static_address_9227027fba5f918d786a5a18.reference || (__cxx_static_address_9227027fba5f918d786a5a18.reference = {
    __cReference: true,
    get value() { return WALLBLOOD7____header_global_a7faed7e6578d834; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:615
export const WALLBLOOD8____header_global_288efc7607d8576d = ((((((2308) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_19e4ff543e911eb0b230ca21() {
  return __cxx_static_address_19e4ff543e911eb0b230ca21.reference || (__cxx_static_address_19e4ff543e911eb0b230ca21.reference = {
    __cReference: true,
    get value() { return WALLBLOOD8____header_global_288efc7607d8576d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:616
export const BURNING2____header_global_307c06761f5bc01d = ((((((2310) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c8409ff6be4293e761a922d2() {
  return __cxx_static_address_c8409ff6be4293e761a922d2.reference || (__cxx_static_address_c8409ff6be4293e761a922d2.reference = {
    __cReference: true,
    get value() { return BURNING2____header_global_307c06761f5bc01d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:617
export const FIRE2____header_global_e9d71a56f4005802 = ((((((2311) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eef13d1a25aa39420f8ecef2() {
  return __cxx_static_address_eef13d1a25aa39420f8ecef2.reference || (__cxx_static_address_eef13d1a25aa39420f8ecef2.reference = {
    __cReference: true,
    get value() { return FIRE2____header_global_e9d71a56f4005802; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:618
export const CRACKKNUCKLES____header_global_b01dd0b596b10a8a = ((((((2324) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cdcfb355fda12b255cd5307a() {
  return __cxx_static_address_cdcfb355fda12b255cd5307a.reference || (__cxx_static_address_cdcfb355fda12b255cd5307a.reference = {
    __cReference: true,
    get value() { return CRACKKNUCKLES____header_global_b01dd0b596b10a8a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:619
export const SMALLSMOKE____header_global_053a2e3e6cd1d2e1 = ((((((2329) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2cb06e113c28a55caf753a83() {
  return __cxx_static_address_2cb06e113c28a55caf753a83.reference || (__cxx_static_address_2cb06e113c28a55caf753a83.reference = {
    __cReference: true,
    get value() { return SMALLSMOKE____header_global_053a2e3e6cd1d2e1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:620
export const FLOORFLAME____header_global_cc431e44f6d4d7ef = ((((((2333) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_25cd81bc00ecb441909e7511() {
  return __cxx_static_address_25cd81bc00ecb441909e7511.reference || (__cxx_static_address_25cd81bc00ecb441909e7511.reference = {
    __cReference: true,
    get value() { return FLOORFLAME____header_global_cc431e44f6d4d7ef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:621
export const ROTATEGUN____header_global_89f3f6c3ec50c2c9 = ((((((2360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_78156ce6be146e5cfd129d2d() {
  return __cxx_static_address_78156ce6be146e5cfd129d2d.reference || (__cxx_static_address_78156ce6be146e5cfd129d2d.reference = {
    __cReference: true,
    get value() { return ROTATEGUN____header_global_89f3f6c3ec50c2c9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:622
export const GREENSLIME____header_global_130e5d3f62eaa293 = ((((((2370) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3662e6e3a613ff2400c7c9c8() {
  return __cxx_static_address_3662e6e3a613ff2400c7c9c8.reference || (__cxx_static_address_3662e6e3a613ff2400c7c9c8.reference = {
    __cReference: true,
    get value() { return GREENSLIME____header_global_130e5d3f62eaa293; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:623
export const WATERDRIPSPLASH____header_global_34b1fcf4bda288cf = ((((((2380) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4814ca38e6c1fe6b0ed4c3e5() {
  return __cxx_static_address_4814ca38e6c1fe6b0ed4c3e5.reference || (__cxx_static_address_4814ca38e6c1fe6b0ed4c3e5.reference = {
    __cReference: true,
    get value() { return WATERDRIPSPLASH____header_global_34b1fcf4bda288cf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:624
export const SCRAP6____header_global_0d2e7f4e97124c40 = ((((((2390) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_265c83448bf1ceb4ba59069b() {
  return __cxx_static_address_265c83448bf1ceb4ba59069b.reference || (__cxx_static_address_265c83448bf1ceb4ba59069b.reference = {
    __cReference: true,
    get value() { return SCRAP6____header_global_0d2e7f4e97124c40; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:625
export const SCRAP1____header_global_b49eac1a1cd40e3c = ((((((2400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7d853700ed8da45289a58c24() {
  return __cxx_static_address_7d853700ed8da45289a58c24.reference || (__cxx_static_address_7d853700ed8da45289a58c24.reference = {
    __cReference: true,
    get value() { return SCRAP1____header_global_b49eac1a1cd40e3c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:626
export const SCRAP2____header_global_5c596b24721ed8ff = ((((((2404) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fb93ae4e1903f8218c789591() {
  return __cxx_static_address_fb93ae4e1903f8218c789591.reference || (__cxx_static_address_fb93ae4e1903f8218c789591.reference = {
    __cReference: true,
    get value() { return SCRAP2____header_global_5c596b24721ed8ff; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:627
export const SCRAP3____header_global_778236ceaf9d9acf = ((((((2408) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7a70f74751dfeb6a61393a6f() {
  return __cxx_static_address_7a70f74751dfeb6a61393a6f.reference || (__cxx_static_address_7a70f74751dfeb6a61393a6f.reference = {
    __cReference: true,
    get value() { return SCRAP3____header_global_778236ceaf9d9acf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:628
export const SCRAP4____header_global_1b2434ee4c8ba6e1 = ((((((2412) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bbfb7a7b49ea3e6e2e24e88c() {
  return __cxx_static_address_bbfb7a7b49ea3e6e2e24e88c.reference || (__cxx_static_address_bbfb7a7b49ea3e6e2e24e88c.reference = {
    __cReference: true,
    get value() { return SCRAP4____header_global_1b2434ee4c8ba6e1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:629
export const SCRAP5____header_global_f70b5633c7aff707 = ((((((2416) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3c2120754edaa6b345071a62() {
  return __cxx_static_address_3c2120754edaa6b345071a62.reference || (__cxx_static_address_3c2120754edaa6b345071a62.reference = {
    __cReference: true,
    get value() { return SCRAP5____header_global_f70b5633c7aff707; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:630
export const ORGANTIC____header_global_067cf6dfe7fb2bb9 = ((((((2420) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_46c0f33897dd066d62b2c373() {
  return __cxx_static_address_46c0f33897dd066d62b2c373.reference || (__cxx_static_address_46c0f33897dd066d62b2c373.reference = {
    __cReference: true,
    get value() { return ORGANTIC____header_global_067cf6dfe7fb2bb9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:631
export const BETAVERSION____header_global_55addb7c7343b98b = ((((((2440) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7b62c93a6b3821d6cbb489dc() {
  return __cxx_static_address_7b62c93a6b3821d6cbb489dc.reference || (__cxx_static_address_7b62c93a6b3821d6cbb489dc.reference = {
    __cReference: true,
    get value() { return BETAVERSION____header_global_55addb7c7343b98b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:632
export const SELECTDIR____header_global_96309b9be11bfd4f = ((((((2444) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aaa52ccceff8753ad29e48ff() {
  return __cxx_static_address_aaa52ccceff8753ad29e48ff.reference || (__cxx_static_address_aaa52ccceff8753ad29e48ff.reference = {
    __cReference: true,
    get value() { return SELECTDIR____header_global_96309b9be11bfd4f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:633
export const F1HELP____header_global_fb944759cd251282 = ((((((2445) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_59fe86a5d06bc94664529cb6() {
  return __cxx_static_address_59fe86a5d06bc94664529cb6.reference || (__cxx_static_address_59fe86a5d06bc94664529cb6.reference = {
    __cReference: true,
    get value() { return F1HELP____header_global_fb944759cd251282; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:634
export const GROWSPARK____header_global_e0a40782d0ef195b = ((((((2448) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_edc9cee0a39ae35bc27cc6dd() {
  return __cxx_static_address_edc9cee0a39ae35bc27cc6dd.reference || (__cxx_static_address_edc9cee0a39ae35bc27cc6dd.reference = {
    __cReference: true,
    get value() { return GROWSPARK____header_global_e0a40782d0ef195b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:635
export const MENUSCREEN____header_global_33202b2c819ab834 = ((((((2456) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5faaf39daacce197b6d71ce6() {
  return __cxx_static_address_5faaf39daacce197b6d71ce6.reference || (__cxx_static_address_5faaf39daacce197b6d71ce6.reference = {
    __cReference: true,
    get value() { return MENUSCREEN____header_global_33202b2c819ab834; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:636
export const MENUBAR____header_global_65cf795d99e91b2c = ((((((2457) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_950072b612beff3876da012a() {
  return __cxx_static_address_950072b612beff3876da012a.reference || (__cxx_static_address_950072b612beff3876da012a.reference = {
    __cReference: true,
    get value() { return MENUBAR____header_global_65cf795d99e91b2c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:637
export const KILLSICON____header_global_79176e9d02dc25af = ((((((2458) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c9d84b0d738cb676a18aef8d() {
  return __cxx_static_address_c9d84b0d738cb676a18aef8d.reference || (__cxx_static_address_c9d84b0d738cb676a18aef8d.reference = {
    __cReference: true,
    get value() { return KILLSICON____header_global_79176e9d02dc25af; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:638
export const FIRSTAID_ICON____header_global_c80bbb75664308be = ((((((2460) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d4723ab0af7cfe095103b4b2() {
  return __cxx_static_address_d4723ab0af7cfe095103b4b2.reference || (__cxx_static_address_d4723ab0af7cfe095103b4b2.reference = {
    __cReference: true,
    get value() { return FIRSTAID_ICON____header_global_c80bbb75664308be; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:639
export const HEAT_ICON____header_global_1693a29722cdee8a = ((((((2461) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bafdb81848e4ca4e665f9fda() {
  return __cxx_static_address_bafdb81848e4ca4e665f9fda.reference || (__cxx_static_address_bafdb81848e4ca4e665f9fda.reference = {
    __cReference: true,
    get value() { return HEAT_ICON____header_global_1693a29722cdee8a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:640
export const BOTTOMSTATUSBAR____header_global_de712f3f8578b190 = ((((((2462) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_646b543bcddbd0931d64cc42() {
  return __cxx_static_address_646b543bcddbd0931d64cc42.reference || (__cxx_static_address_646b543bcddbd0931d64cc42.reference = {
    __cReference: true,
    get value() { return BOTTOMSTATUSBAR____header_global_de712f3f8578b190; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:641
export const BOOT_ICON____header_global_48238dce71c309cc = ((((((2463) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d5f491c41936f50e5ef72f6a() {
  return __cxx_static_address_d5f491c41936f50e5ef72f6a.reference || (__cxx_static_address_d5f491c41936f50e5ef72f6a.reference = {
    __cReference: true,
    get value() { return BOOT_ICON____header_global_48238dce71c309cc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:642
export const FRAGBAR____header_global_5f9f3f8aa873d69c = ((((((2465) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e9ff52b46667e4a27f812cbd() {
  return __cxx_static_address_e9ff52b46667e4a27f812cbd.reference || (__cxx_static_address_e9ff52b46667e4a27f812cbd.reference = {
    __cReference: true,
    get value() { return FRAGBAR____header_global_5f9f3f8aa873d69c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:643
export const JETPACK_ICON____header_global_398ebd6462553a75 = ((((((2467) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2d04805be8801e072a72b269() {
  return __cxx_static_address_2d04805be8801e072a72b269.reference || (__cxx_static_address_2d04805be8801e072a72b269.reference = {
    __cReference: true,
    get value() { return JETPACK_ICON____header_global_398ebd6462553a75; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:644
export const AIRTANK_ICON____header_global_2ee5ce56ce591ad9 = ((((((2468) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_240d905d3f4947e3b3a2e3b4() {
  return __cxx_static_address_240d905d3f4947e3b3a2e3b4.reference || (__cxx_static_address_240d905d3f4947e3b3a2e3b4.reference = {
    __cReference: true,
    get value() { return AIRTANK_ICON____header_global_2ee5ce56ce591ad9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:645
export const STEROIDS_ICON____header_global_01a4b3ed57ac20b8 = ((((((2469) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bfe35152240742af8fa443d7() {
  return __cxx_static_address_bfe35152240742af8fa443d7.reference || (__cxx_static_address_bfe35152240742af8fa443d7.reference = {
    __cReference: true,
    get value() { return STEROIDS_ICON____header_global_01a4b3ed57ac20b8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:646
export const HOLODUKE_ICON____header_global_38855bb4e1aa75a8 = ((((((2470) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_44087ed7730ddabf19d538d9() {
  return __cxx_static_address_44087ed7730ddabf19d538d9.reference || (__cxx_static_address_44087ed7730ddabf19d538d9.reference = {
    __cReference: true,
    get value() { return HOLODUKE_ICON____header_global_38855bb4e1aa75a8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:647
export const ACCESS_ICON____header_global_10e645e7c5f10e9c = ((((((2471) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cda2a40e289f7b9b4892d455() {
  return __cxx_static_address_cda2a40e289f7b9b4892d455.reference || (__cxx_static_address_cda2a40e289f7b9b4892d455.reference = {
    __cReference: true,
    get value() { return ACCESS_ICON____header_global_10e645e7c5f10e9c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:648
export const DIGITALNUM____header_global_d694905fcf03f868 = ((((((2472) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4e685b13ee5ca0b1b5c46c5e() {
  return __cxx_static_address_4e685b13ee5ca0b1b5c46c5e.reference || (__cxx_static_address_4e685b13ee5ca0b1b5c46c5e.reference = {
    __cReference: true,
    get value() { return DIGITALNUM____header_global_d694905fcf03f868; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:649
export const DUKECAR____header_global_fd3115d5057e9c9c = ((((((2491) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b764be643d62c4809ac27c37() {
  return __cxx_static_address_b764be643d62c4809ac27c37.reference || (__cxx_static_address_b764be643d62c4809ac27c37.reference = {
    __cReference: true,
    get value() { return DUKECAR____header_global_fd3115d5057e9c9c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:650
export const CAMCORNER____header_global_b9028c1dc9018f6c = ((((((2482) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e319c98b629941a9b61b7e5e() {
  return __cxx_static_address_e319c98b629941a9b61b7e5e.reference || (__cxx_static_address_e319c98b629941a9b61b7e5e.reference = {
    __cReference: true,
    get value() { return CAMCORNER____header_global_b9028c1dc9018f6c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:651
export const CAMLIGHT____header_global_532c5c43be8d0b9c = ((((((2484) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ebe03437bc6400a2f2d25964() {
  return __cxx_static_address_ebe03437bc6400a2f2d25964.reference || (__cxx_static_address_ebe03437bc6400a2f2d25964.reference = {
    __cReference: true,
    get value() { return CAMLIGHT____header_global_532c5c43be8d0b9c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:652
export const SLIDEBAR____header_global_bd2274ff626abc48 = ((((((2489) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f7fbc1579e7240b377e59f50() {
  return __cxx_static_address_f7fbc1579e7240b377e59f50.reference || (__cxx_static_address_f7fbc1579e7240b377e59f50.reference = {
    __cReference: true,
    get value() { return SLIDEBAR____header_global_bd2274ff626abc48; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:653
export const DREALMS____header_global_2fc252b11c3245c5 = ((((((2492) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0683747409efa23b89d4a945() {
  return __cxx_static_address_0683747409efa23b89d4a945.reference || (__cxx_static_address_0683747409efa23b89d4a945.reference = {
    __cReference: true,
    get value() { return DREALMS____header_global_2fc252b11c3245c5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:654
export const BETASCREEN____header_global_4cc155b3ecf6294b = ((((((2493) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_71628662d57fef4e262fe71e() {
  return __cxx_static_address_71628662d57fef4e262fe71e.reference || (__cxx_static_address_71628662d57fef4e262fe71e.reference = {
    __cReference: true,
    get value() { return BETASCREEN____header_global_4cc155b3ecf6294b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:655
export const WINDOWBORDER1____header_global_1635cfde61722475 = ((((((2494) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_271635c1ae100322efc90c81() {
  return __cxx_static_address_271635c1ae100322efc90c81.reference || (__cxx_static_address_271635c1ae100322efc90c81.reference = {
    __cReference: true,
    get value() { return WINDOWBORDER1____header_global_1635cfde61722475; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:656
export const TEXTBOX____header_global_5d91831365fef647 = ((((((2495) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e378418454193e485db1d2a0() {
  return __cxx_static_address_e378418454193e485db1d2a0.reference || (__cxx_static_address_e378418454193e485db1d2a0.reference = {
    __cReference: true,
    get value() { return TEXTBOX____header_global_5d91831365fef647; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:657
export const WINDOWBORDER2____header_global_e4639c90007f4004 = ((((((2496) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a6e14daf3b4ea66878e464cd() {
  return __cxx_static_address_a6e14daf3b4ea66878e464cd.reference || (__cxx_static_address_a6e14daf3b4ea66878e464cd.reference = {
    __cReference: true,
    get value() { return WINDOWBORDER2____header_global_e4639c90007f4004; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:658
export const DUKENUKEM____header_global_abe205c4318b0aa2 = ((((((2497) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fb06c4e04ef6c8a6569564a5() {
  return __cxx_static_address_fb06c4e04ef6c8a6569564a5.reference || (__cxx_static_address_fb06c4e04ef6c8a6569564a5.reference = {
    __cReference: true,
    get value() { return DUKENUKEM____header_global_abe205c4318b0aa2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:659
export const THREEDEE____header_global_23a4bb9fd097bf8f = ((((((2498) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_af3e25c465525f8cc81485d9() {
  return __cxx_static_address_af3e25c465525f8cc81485d9.reference || (__cxx_static_address_af3e25c465525f8cc81485d9.reference = {
    __cReference: true,
    get value() { return THREEDEE____header_global_23a4bb9fd097bf8f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:660
export const INGAMEDUKETHREEDEE____header_global_ab1a24dd6ede009e = ((((((2499) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_23fba09278e4a939077b1819() {
  return __cxx_static_address_23fba09278e4a939077b1819.reference || (__cxx_static_address_23fba09278e4a939077b1819.reference = {
    __cReference: true,
    get value() { return INGAMEDUKETHREEDEE____header_global_ab1a24dd6ede009e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:661
export const TENSCREEN____header_global_b74dab4ca1ea5dac = ((((((2500) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_76f61924e54b5437b5b83a32() {
  return __cxx_static_address_76f61924e54b5437b5b83a32.reference || (__cxx_static_address_76f61924e54b5437b5b83a32.reference = {
    __cReference: true,
    get value() { return TENSCREEN____header_global_b74dab4ca1ea5dac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:662
export const PLUTOPAKSPRITE____header_global_95b0bb7cdc2d337d = ((((((2501) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_51aa90f5ca5cb13575a8abd5() {
  return __cxx_static_address_51aa90f5ca5cb13575a8abd5.reference || (__cxx_static_address_51aa90f5ca5cb13575a8abd5.reference = {
    __cReference: true,
    get value() { return PLUTOPAKSPRITE____header_global_95b0bb7cdc2d337d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:663
export const DEVISTATOR____header_global_cf006d4ef743dad2 = ((((((2510) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d72330786c98aff318e59722() {
  return __cxx_static_address_d72330786c98aff318e59722.reference || (__cxx_static_address_d72330786c98aff318e59722.reference = {
    __cReference: true,
    get value() { return DEVISTATOR____header_global_cf006d4ef743dad2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:664
export const KNEE____header_global_8db03be097091e60 = ((((((2521) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ae21e254478ef3b16998ab0b() {
  return __cxx_static_address_ae21e254478ef3b16998ab0b.reference || (__cxx_static_address_ae21e254478ef3b16998ab0b.reference = {
    __cReference: true,
    get value() { return KNEE____header_global_8db03be097091e60; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:665
export const CROSSHAIR____header_global_50b434110d17bac0 = ((((((2523) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_38cd3d762bd0052ac1f50c02() {
  return __cxx_static_address_38cd3d762bd0052ac1f50c02.reference || (__cxx_static_address_38cd3d762bd0052ac1f50c02.reference = {
    __cReference: true,
    get value() { return CROSSHAIR____header_global_50b434110d17bac0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:666
export const FIRSTGUN____header_global_4e9143d992133326 = ((((((2524) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_63433c9fabbf5f025abf77eb() {
  return __cxx_static_address_63433c9fabbf5f025abf77eb.reference || (__cxx_static_address_63433c9fabbf5f025abf77eb.reference = {
    __cReference: true,
    get value() { return FIRSTGUN____header_global_4e9143d992133326; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:667
export const FIRSTGUNRELOAD____header_global_7e3ed57aea752ec8 = ((((((2528) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5baf2d8ab38063f70b3aa82a() {
  return __cxx_static_address_5baf2d8ab38063f70b3aa82a.reference || (__cxx_static_address_5baf2d8ab38063f70b3aa82a.reference = {
    __cReference: true,
    get value() { return FIRSTGUNRELOAD____header_global_7e3ed57aea752ec8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:668
export const SHELL____header_global_1420dc2584c42db5 = ((((((2533) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4a024dd0d51e8875ec7ff2f6() {
  return __cxx_static_address_4a024dd0d51e8875ec7ff2f6.reference || (__cxx_static_address_4a024dd0d51e8875ec7ff2f6.reference = {
    __cReference: true,
    get value() { return SHELL____header_global_1420dc2584c42db5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:669
export const SHOTGUNSHELL____header_global_e9cbccee1675b4de = ((((((2535) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cfa4c5399fd24f0a313c8f24() {
  return __cxx_static_address_cfa4c5399fd24f0a313c8f24.reference || (__cxx_static_address_cfa4c5399fd24f0a313c8f24.reference = {
    __cReference: true,
    get value() { return SHOTGUNSHELL____header_global_e9cbccee1675b4de; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:670
export const CHAINGUN____header_global_8890ee8618138f69 = ((((((2536) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_be1a8530d7f0c975536a3df1() {
  return __cxx_static_address_be1a8530d7f0c975536a3df1.reference || (__cxx_static_address_be1a8530d7f0c975536a3df1.reference = {
    __cReference: true,
    get value() { return CHAINGUN____header_global_8890ee8618138f69; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:671
export const RPGGUN____header_global_6a25f33fc85d3c78 = ((((((2544) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0b20a67137837aa3df35feec() {
  return __cxx_static_address_0b20a67137837aa3df35feec.reference || (__cxx_static_address_0b20a67137837aa3df35feec.reference = {
    __cReference: true,
    get value() { return RPGGUN____header_global_6a25f33fc85d3c78; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:672
export const FREEZE____header_global_38a3438d07f57cfb = ((((((2548) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_77b7a20c7e982ed5a028c581() {
  return __cxx_static_address_77b7a20c7e982ed5a028c581.reference || (__cxx_static_address_77b7a20c7e982ed5a028c581.reference = {
    __cReference: true,
    get value() { return FREEZE____header_global_38a3438d07f57cfb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:673
export const SHRINKER____header_global_84b96cba47bcbf12 = ((((((2556) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e97010770ff5a4428c388a74() {
  return __cxx_static_address_e97010770ff5a4428c388a74.reference || (__cxx_static_address_e97010770ff5a4428c388a74.reference = {
    __cReference: true,
    get value() { return SHRINKER____header_global_84b96cba47bcbf12; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:674
export const HANDHOLDINGLASER____header_global_4fb83b9984a550bb = ((((((2563) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e91c5c04418e011b32a00758() {
  return __cxx_static_address_e91c5c04418e011b32a00758.reference || (__cxx_static_address_e91c5c04418e011b32a00758.reference = {
    __cReference: true,
    get value() { return HANDHOLDINGLASER____header_global_4fb83b9984a550bb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:675
export const TRIPBOMB____header_global_91cab4c291756838 = ((((((2566) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_641531656dacb55b7909fac5() {
  return __cxx_static_address_641531656dacb55b7909fac5.reference || (__cxx_static_address_641531656dacb55b7909fac5.reference = {
    __cReference: true,
    get value() { return TRIPBOMB____header_global_91cab4c291756838; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:676
export const LASERLINE____header_global_a2aadef027dab69d = ((((((2567) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4dc7ff6b2572e6423891c535() {
  return __cxx_static_address_4dc7ff6b2572e6423891c535.reference || (__cxx_static_address_4dc7ff6b2572e6423891c535.reference = {
    __cReference: true,
    get value() { return LASERLINE____header_global_a2aadef027dab69d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:677
export const HANDHOLDINGACCESS____header_global_2ec02a6a928f1852 = ((((((2568) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8c9aaa6d18d8a43e5490dcdd() {
  return __cxx_static_address_8c9aaa6d18d8a43e5490dcdd.reference || (__cxx_static_address_8c9aaa6d18d8a43e5490dcdd.reference = {
    __cReference: true,
    get value() { return HANDHOLDINGACCESS____header_global_2ec02a6a928f1852; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:678
export const HANDREMOTE____header_global_e27cfb650102c66b = ((((((2570) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_99962df02c714423012ce7a4() {
  return __cxx_static_address_99962df02c714423012ce7a4.reference || (__cxx_static_address_99962df02c714423012ce7a4.reference = {
    __cReference: true,
    get value() { return HANDREMOTE____header_global_e27cfb650102c66b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:679
export const HANDTHROW____header_global_65c286c7f2490765 = ((((((2573) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b1874330dd1f19d82bb886dc() {
  return __cxx_static_address_b1874330dd1f19d82bb886dc.reference || (__cxx_static_address_b1874330dd1f19d82bb886dc.reference = {
    __cReference: true,
    get value() { return HANDTHROW____header_global_65c286c7f2490765; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:680
export const TIP____header_global_21898de1f94de013 = ((((((2576) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_34fa393c87bcbe766549a406() {
  return __cxx_static_address_34fa393c87bcbe766549a406.reference || (__cxx_static_address_34fa393c87bcbe766549a406.reference = {
    __cReference: true,
    get value() { return TIP____header_global_21898de1f94de013; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:681
export const SCUBAMASK____header_global_fcfaa7d84dd3dbdf = ((((((2581) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_850aa6e083136ae50ed589cb() {
  return __cxx_static_address_850aa6e083136ae50ed589cb.reference || (__cxx_static_address_850aa6e083136ae50ed589cb.reference = {
    __cReference: true,
    get value() { return SCUBAMASK____header_global_fcfaa7d84dd3dbdf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:682
export const FORCESPHERE____header_global_9f8d7604e95aa370 = ((((((2590) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3ec9fbc9390da5d8a5448fa6() {
  return __cxx_static_address_3ec9fbc9390da5d8a5448fa6.reference || (__cxx_static_address_3ec9fbc9390da5d8a5448fa6.reference = {
    __cReference: true,
    get value() { return FORCESPHERE____header_global_9f8d7604e95aa370; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:683
export const SHOTSPARK1____header_global_f94d8860336830ca = ((((((2595) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_77902bb6c02af89a7920697b() {
  return __cxx_static_address_77902bb6c02af89a7920697b.reference || (__cxx_static_address_77902bb6c02af89a7920697b.reference = {
    __cReference: true,
    get value() { return SHOTSPARK1____header_global_f94d8860336830ca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:684
export const RPG____header_global_c33fe0a6e7184cd9 = ((((((2605) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6be223979b06c1ab9dd8fed5() {
  return __cxx_static_address_6be223979b06c1ab9dd8fed5.reference || (__cxx_static_address_6be223979b06c1ab9dd8fed5.reference = {
    __cReference: true,
    get value() { return RPG____header_global_c33fe0a6e7184cd9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:685
export const LASERSITE____header_global_254a1dcb40eaaab3 = ((((((2612) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_009a2d64287221e960d539c0() {
  return __cxx_static_address_009a2d64287221e960d539c0.reference || (__cxx_static_address_009a2d64287221e960d539c0.reference = {
    __cReference: true,
    get value() { return LASERSITE____header_global_254a1dcb40eaaab3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:686
export const SHOTGUN____header_global_dc39aa634e2a81a6 = ((((((2613) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9a5c0b025d66fe57c43e3874() {
  return __cxx_static_address_9a5c0b025d66fe57c43e3874.reference || (__cxx_static_address_9a5c0b025d66fe57c43e3874.reference = {
    __cReference: true,
    get value() { return SHOTGUN____header_global_dc39aa634e2a81a6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:687
export const BOSS1____header_global_d47392fb9f8db27e = ((((((2630) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f44e77ad962b0e3422a6447b() {
  return __cxx_static_address_f44e77ad962b0e3422a6447b.reference || (__cxx_static_address_f44e77ad962b0e3422a6447b.reference = {
    __cReference: true,
    get value() { return BOSS1____header_global_d47392fb9f8db27e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:688
export const BOSS1STAYPUT____header_global_4a4d5974497f6095 = ((((((2631) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_89b78f3aebe1510c1a17ccf7() {
  return __cxx_static_address_89b78f3aebe1510c1a17ccf7.reference || (__cxx_static_address_89b78f3aebe1510c1a17ccf7.reference = {
    __cReference: true,
    get value() { return BOSS1STAYPUT____header_global_4a4d5974497f6095; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:689
export const BOSS1SHOOT____header_global_65b64c273c187683 = ((((((2660) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_10110e23193c3ade04da50e8() {
  return __cxx_static_address_10110e23193c3ade04da50e8.reference || (__cxx_static_address_10110e23193c3ade04da50e8.reference = {
    __cReference: true,
    get value() { return BOSS1SHOOT____header_global_65b64c273c187683; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:690
export const BOSS1LOB____header_global_91b1c16092530681 = ((((((2670) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0a4721c72c60287a2f324506() {
  return __cxx_static_address_0a4721c72c60287a2f324506.reference || (__cxx_static_address_0a4721c72c60287a2f324506.reference = {
    __cReference: true,
    get value() { return BOSS1LOB____header_global_91b1c16092530681; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:691
export const BOSSTOP____header_global_06dfdddaaf590ce0 = ((((((2696) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e46714f8f645c77a1fd8488a() {
  return __cxx_static_address_e46714f8f645c77a1fd8488a.reference || (__cxx_static_address_e46714f8f645c77a1fd8488a.reference = {
    __cReference: true,
    get value() { return BOSSTOP____header_global_06dfdddaaf590ce0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:692
export const BOSS2____header_global_943f7541d09ec842 = ((((((2710) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_09eec49bcdabe69cb2b321a6() {
  return __cxx_static_address_09eec49bcdabe69cb2b321a6.reference || (__cxx_static_address_09eec49bcdabe69cb2b321a6.reference = {
    __cReference: true,
    get value() { return BOSS2____header_global_943f7541d09ec842; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:693
export const BOSS3____header_global_dcce4a7a9623032c = ((((((2760) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dc3a2fc8ec6283d5765f3a94() {
  return __cxx_static_address_dc3a2fc8ec6283d5765f3a94.reference || (__cxx_static_address_dc3a2fc8ec6283d5765f3a94.reference = {
    __cReference: true,
    get value() { return BOSS3____header_global_dcce4a7a9623032c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:694
export const SPINNINGNUKEICON____header_global_452b4d75e34be605 = ((((((2813) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9ce265a4feaecbfdd9671d0c() {
  return __cxx_static_address_9ce265a4feaecbfdd9671d0c.reference || (__cxx_static_address_9ce265a4feaecbfdd9671d0c.reference = {
    __cReference: true,
    get value() { return SPINNINGNUKEICON____header_global_452b4d75e34be605; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:695
export const SMALLFNTCURSOR____header_global_1ace80a81f8e22c8 = ((((((2821) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_867aacb7cd91816eecdf69d3() {
  return __cxx_static_address_867aacb7cd91816eecdf69d3.reference || (__cxx_static_address_867aacb7cd91816eecdf69d3.reference = {
    __cReference: true,
    get value() { return SMALLFNTCURSOR____header_global_1ace80a81f8e22c8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:696
export const STARTALPHANUM____header_global_63869b154552d18e = ((((((2822) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6ab9e63ce947d5ee8e8c9087() {
  return __cxx_static_address_6ab9e63ce947d5ee8e8c9087.reference || (__cxx_static_address_6ab9e63ce947d5ee8e8c9087.reference = {
    __cReference: true,
    get value() { return STARTALPHANUM____header_global_63869b154552d18e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:697
export const ENDALPHANUM____header_global_646ae1cd06bb5f3a = ((((((2915) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8a4201d8775d69427477be7c() {
  return __cxx_static_address_8a4201d8775d69427477be7c.reference || (__cxx_static_address_8a4201d8775d69427477be7c.reference = {
    __cReference: true,
    get value() { return ENDALPHANUM____header_global_646ae1cd06bb5f3a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:698
export const BIGALPHANUM____header_global_a862736fa34b856a = ((((((2940) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4800f25b56c5da0b5401c98d() {
  return __cxx_static_address_4800f25b56c5da0b5401c98d.reference || (__cxx_static_address_4800f25b56c5da0b5401c98d.reference = {
    __cReference: true,
    get value() { return BIGALPHANUM____header_global_a862736fa34b856a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:699
export const BIGPERIOD____header_global_7541fd8e5853f078 = ((((((3002) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_547b59d8ee326e5d9dbfebef() {
  return __cxx_static_address_547b59d8ee326e5d9dbfebef.reference || (__cxx_static_address_547b59d8ee326e5d9dbfebef.reference = {
    __cReference: true,
    get value() { return BIGPERIOD____header_global_7541fd8e5853f078; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:700
export const BIGCOMMA____header_global_9be1d253e5b66e8f = ((((((3003) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c3bddbdc08599348a1c78f57() {
  return __cxx_static_address_c3bddbdc08599348a1c78f57.reference || (__cxx_static_address_c3bddbdc08599348a1c78f57.reference = {
    __cReference: true,
    get value() { return BIGCOMMA____header_global_9be1d253e5b66e8f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:701
export const BIGX____header_global_7b8ea986c63528cb = ((((((3004) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9eb1426dbbac93c275f8ca47() {
  return __cxx_static_address_9eb1426dbbac93c275f8ca47.reference || (__cxx_static_address_9eb1426dbbac93c275f8ca47.reference = {
    __cReference: true,
    get value() { return BIGX____header_global_7b8ea986c63528cb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:702
export const BIGQ____header_global_82a42aa685370453 = ((((((3005) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a80747f2b957069094af58ec() {
  return __cxx_static_address_a80747f2b957069094af58ec.reference || (__cxx_static_address_a80747f2b957069094af58ec.reference = {
    __cReference: true,
    get value() { return BIGQ____header_global_82a42aa685370453; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:703
export const BIGSEMI____header_global_2e705f9e7d4a7b84 = ((((((3006) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0f0810488fd96936a2626cb0() {
  return __cxx_static_address_0f0810488fd96936a2626cb0.reference || (__cxx_static_address_0f0810488fd96936a2626cb0.reference = {
    __cReference: true,
    get value() { return BIGSEMI____header_global_2e705f9e7d4a7b84; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:704
export const BIGCOLIN____header_global_e859d1108bd50a15 = ((((((3007) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c87dc83c0d64842c73d5ece9() {
  return __cxx_static_address_c87dc83c0d64842c73d5ece9.reference || (__cxx_static_address_c87dc83c0d64842c73d5ece9.reference = {
    __cReference: true,
    get value() { return BIGCOLIN____header_global_e859d1108bd50a15; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:705
export const THREEBYFIVE____header_global_457e5d9aea495050 = ((((((3010) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7e75ebeb4ead1b28400deda2() {
  return __cxx_static_address_7e75ebeb4ead1b28400deda2.reference || (__cxx_static_address_7e75ebeb4ead1b28400deda2.reference = {
    __cReference: true,
    get value() { return THREEBYFIVE____header_global_457e5d9aea495050; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:706
export const BIGAPPOS____header_global_a86a2104c4fc2575 = ((((((3022) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ccf935dfcbd1e0a44ebc9bf0() {
  return __cxx_static_address_ccf935dfcbd1e0a44ebc9bf0.reference || (__cxx_static_address_ccf935dfcbd1e0a44ebc9bf0.reference = {
    __cReference: true,
    get value() { return BIGAPPOS____header_global_a86a2104c4fc2575; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:707
export const MINIFONT____header_global_9510cd9cff5df387 = ((((((3072) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d36f6dc1c199493c257183cd() {
  return __cxx_static_address_d36f6dc1c199493c257183cd.reference || (__cxx_static_address_d36f6dc1c199493c257183cd.reference = {
    __cReference: true,
    get value() { return MINIFONT____header_global_9510cd9cff5df387; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:708
export const RESPAWNMARKERRED____header_global_a0b52a8d4511b066 = ((((((3190) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c3e13fb288662e45a133bf08() {
  return __cxx_static_address_c3e13fb288662e45a133bf08.reference || (__cxx_static_address_c3e13fb288662e45a133bf08.reference = {
    __cReference: true,
    get value() { return RESPAWNMARKERRED____header_global_a0b52a8d4511b066; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:709
export const RESPAWNMARKERYELLOW____header_global_41d4d4271bcfd74a = ((((((3200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6541a682008884b3ff785565() {
  return __cxx_static_address_6541a682008884b3ff785565.reference || (__cxx_static_address_6541a682008884b3ff785565.reference = {
    __cReference: true,
    get value() { return RESPAWNMARKERYELLOW____header_global_41d4d4271bcfd74a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:710
export const RESPAWNMARKERGREEN____header_global_e2303af253d87d56 = ((((((3210) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aaa8cb82b484139a55c7ccda() {
  return __cxx_static_address_aaa8cb82b484139a55c7ccda.reference || (__cxx_static_address_aaa8cb82b484139a55c7ccda.reference = {
    __cReference: true,
    get value() { return RESPAWNMARKERGREEN____header_global_e2303af253d87d56; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:711
export const BONUSSCREEN____header_global_6674640c59aa7578 = ((((((3240) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cd1b2352085db3b4a8ce86e0() {
  return __cxx_static_address_cd1b2352085db3b4a8ce86e0.reference || (__cxx_static_address_cd1b2352085db3b4a8ce86e0.reference = {
    __cReference: true,
    get value() { return BONUSSCREEN____header_global_6674640c59aa7578; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:712
export const VIEWBORDER____header_global_68fcb0d5bc915eda = ((((((3250) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b6fa0c6662116649bcd07fce() {
  return __cxx_static_address_b6fa0c6662116649bcd07fce.reference || (__cxx_static_address_b6fa0c6662116649bcd07fce.reference = {
    __cReference: true,
    get value() { return VIEWBORDER____header_global_68fcb0d5bc915eda; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:713
export const VICTORY1____header_global_ca3156c59d468453 = ((((((3260) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_455fde6538c2ed393837d40d() {
  return __cxx_static_address_455fde6538c2ed393837d40d.reference || (__cxx_static_address_455fde6538c2ed393837d40d.reference = {
    __cReference: true,
    get value() { return VICTORY1____header_global_ca3156c59d468453; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:714
export const ORDERING____header_global_4db281adbd0b02e8 = ((((((3270) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4f4aeb38ff17565775a23845() {
  return __cxx_static_address_4f4aeb38ff17565775a23845.reference || (__cxx_static_address_4f4aeb38ff17565775a23845.reference = {
    __cReference: true,
    get value() { return ORDERING____header_global_4db281adbd0b02e8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:715
export const TEXTSTORY____header_global_b96c7840f195a569 = ((((((3280) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_43d1d673ac0344fb44030784() {
  return __cxx_static_address_43d1d673ac0344fb44030784.reference || (__cxx_static_address_43d1d673ac0344fb44030784.reference = {
    __cReference: true,
    get value() { return TEXTSTORY____header_global_b96c7840f195a569; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:716
export const LOADSCREEN____header_global_1c54eccdd5584aed = ((((((3281) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a5bebe0910aa5da3891cd984() {
  return __cxx_static_address_a5bebe0910aa5da3891cd984.reference || (__cxx_static_address_a5bebe0910aa5da3891cd984.reference = {
    __cReference: true,
    get value() { return LOADSCREEN____header_global_1c54eccdd5584aed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:717
export const BORNTOBEWILDSCREEN____header_global_39267c81f0b30b08 = ((((((3370) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e8dab65db26f035e52ae5d15() {
  return __cxx_static_address_e8dab65db26f035e52ae5d15.reference || (__cxx_static_address_e8dab65db26f035e52ae5d15.reference = {
    __cReference: true,
    get value() { return BORNTOBEWILDSCREEN____header_global_39267c81f0b30b08; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:718
export const BLIMP____header_global_a7ae4e2cd41e521a = ((((((3400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ae4248f70937322285dbb7a1() {
  return __cxx_static_address_ae4248f70937322285dbb7a1.reference || (__cxx_static_address_ae4248f70937322285dbb7a1.reference = {
    __cReference: true,
    get value() { return BLIMP____header_global_a7ae4e2cd41e521a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:719
export const FEM9____header_global_ebbee6dbe159cad9 = ((((((3450) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_69eaadf310b66a803f983794() {
  return __cxx_static_address_69eaadf310b66a803f983794.reference || (__cxx_static_address_69eaadf310b66a803f983794.reference = {
    __cReference: true,
    get value() { return FEM9____header_global_ebbee6dbe159cad9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:720
export const FRAMEEFFECT1_13____header_global_edc86a52f04643b9 = ((((((3999) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5b9226645d77ef008bc38c99() {
  return __cxx_static_address_5b9226645d77ef008bc38c99.reference || (__cxx_static_address_5b9226645d77ef008bc38c99.reference = {
    __cReference: true,
    get value() { return FRAMEEFFECT1_13____header_global_edc86a52f04643b9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:721
export const FRAMEEFFECT1____header_global_10241ada276aef48 = ((((((4095) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a24b3b7a300d5c36d27304d7() {
  return __cxx_static_address_a24b3b7a300d5c36d27304d7.reference || (__cxx_static_address_a24b3b7a300d5c36d27304d7.reference = {
    __cReference: true,
    get value() { return FRAMEEFFECT1____header_global_10241ada276aef48; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:722
export const PANNEL3____header_global_f256d2711bffcb72 = ((((((4099) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ea840ba27a4f1e2177c4725b() {
  return __cxx_static_address_ea840ba27a4f1e2177c4725b.reference || (__cxx_static_address_ea840ba27a4f1e2177c4725b.reference = {
    __cReference: true,
    get value() { return PANNEL3____header_global_f256d2711bffcb72; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:723
export const SCREENBREAK14____header_global_6feb0cb503fa571f = ((((((4120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7f773ea4763a8502df36231b() {
  return __cxx_static_address_7f773ea4763a8502df36231b.reference || (__cxx_static_address_7f773ea4763a8502df36231b.reference = {
    __cReference: true,
    get value() { return SCREENBREAK14____header_global_6feb0cb503fa571f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:724
export const SCREENBREAK15____header_global_b5da653e1dd32d1e = ((((((4123) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_929e01489c9e7b7fa9c27c1c() {
  return __cxx_static_address_929e01489c9e7b7fa9c27c1c.reference || (__cxx_static_address_929e01489c9e7b7fa9c27c1c.reference = {
    __cReference: true,
    get value() { return SCREENBREAK15____header_global_b5da653e1dd32d1e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:725
export const SCREENBREAK19____header_global_0bc96a4eeec71985 = ((((((4125) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fb06c13cd67550031b8b2a04() {
  return __cxx_static_address_fb06c13cd67550031b8b2a04.reference || (__cxx_static_address_fb06c13cd67550031b8b2a04.reference = {
    __cReference: true,
    get value() { return SCREENBREAK19____header_global_0bc96a4eeec71985; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:726
export const SCREENBREAK16____header_global_803713c41512e32a = ((((((4127) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c3f28f6d2fd33488bac7b4a1() {
  return __cxx_static_address_c3f28f6d2fd33488bac7b4a1.reference || (__cxx_static_address_c3f28f6d2fd33488bac7b4a1.reference = {
    __cReference: true,
    get value() { return SCREENBREAK16____header_global_803713c41512e32a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:727
export const SCREENBREAK17____header_global_222ac55011f1262a = ((((((4128) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a769a70bffaa8a5bf52b4f1a() {
  return __cxx_static_address_a769a70bffaa8a5bf52b4f1a.reference || (__cxx_static_address_a769a70bffaa8a5bf52b4f1a.reference = {
    __cReference: true,
    get value() { return SCREENBREAK17____header_global_222ac55011f1262a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:728
export const SCREENBREAK18____header_global_e28d17967150c427 = ((((((4129) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7794caf28a3cc08e7c5f4dd3() {
  return __cxx_static_address_7794caf28a3cc08e7c5f4dd3.reference || (__cxx_static_address_7794caf28a3cc08e7c5f4dd3.reference = {
    __cReference: true,
    get value() { return SCREENBREAK18____header_global_e28d17967150c427; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:729
export const W_TECHWALL11____header_global_a8f24186724ee098 = ((((((4130) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_83ade6713d59a7f9922db8da() {
  return __cxx_static_address_83ade6713d59a7f9922db8da.reference || (__cxx_static_address_83ade6713d59a7f9922db8da.reference = {
    __cReference: true,
    get value() { return W_TECHWALL11____header_global_a8f24186724ee098; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:730
export const W_TECHWALL12____header_global_a772991304cd8742 = ((((((4131) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_55ac3347c8c3bb060148d9d5() {
  return __cxx_static_address_55ac3347c8c3bb060148d9d5.reference || (__cxx_static_address_55ac3347c8c3bb060148d9d5.reference = {
    __cReference: true,
    get value() { return W_TECHWALL12____header_global_a772991304cd8742; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:731
export const W_TECHWALL13____header_global_f120c610cebbaf4f = ((((((4132) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e9e7d68241e7444efafe0e12() {
  return __cxx_static_address_e9e7d68241e7444efafe0e12.reference || (__cxx_static_address_e9e7d68241e7444efafe0e12.reference = {
    __cReference: true,
    get value() { return W_TECHWALL13____header_global_f120c610cebbaf4f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:732
export const W_TECHWALL14____header_global_4f8cb4c56a7a3d65 = ((((((4133) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5ce0a858ba8014825efd1687() {
  return __cxx_static_address_5ce0a858ba8014825efd1687.reference || (__cxx_static_address_5ce0a858ba8014825efd1687.reference = {
    __cReference: true,
    get value() { return W_TECHWALL14____header_global_4f8cb4c56a7a3d65; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:733
export const W_TECHWALL5____header_global_bc051dc1ad47430c = ((((((4134) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ce2a59e2e7453fc925531800() {
  return __cxx_static_address_ce2a59e2e7453fc925531800.reference || (__cxx_static_address_ce2a59e2e7453fc925531800.reference = {
    __cReference: true,
    get value() { return W_TECHWALL5____header_global_bc051dc1ad47430c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:734
export const W_TECHWALL6____header_global_3f5798d77aabb205 = ((((((4136) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_150f6cfe6f225b0133b87078() {
  return __cxx_static_address_150f6cfe6f225b0133b87078.reference || (__cxx_static_address_150f6cfe6f225b0133b87078.reference = {
    __cReference: true,
    get value() { return W_TECHWALL6____header_global_3f5798d77aabb205; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:735
export const W_TECHWALL7____header_global_7fc00058d302c4eb = ((((((4138) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2df37883132fe87038a76cdf() {
  return __cxx_static_address_2df37883132fe87038a76cdf.reference || (__cxx_static_address_2df37883132fe87038a76cdf.reference = {
    __cReference: true,
    get value() { return W_TECHWALL7____header_global_7fc00058d302c4eb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:736
export const W_TECHWALL8____header_global_c1fe028ce66a74d7 = ((((((4140) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ad31ee82cc289c5e10b77e1c() {
  return __cxx_static_address_ad31ee82cc289c5e10b77e1c.reference || (__cxx_static_address_ad31ee82cc289c5e10b77e1c.reference = {
    __cReference: true,
    get value() { return W_TECHWALL8____header_global_c1fe028ce66a74d7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:737
export const W_TECHWALL9____header_global_43ca8e9b5067d677 = ((((((4142) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ef2d2661cfb6589da4b59a58() {
  return __cxx_static_address_ef2d2661cfb6589da4b59a58.reference || (__cxx_static_address_ef2d2661cfb6589da4b59a58.reference = {
    __cReference: true,
    get value() { return W_TECHWALL9____header_global_43ca8e9b5067d677; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:738
export const BPANNEL3____header_global_67ecac1b4f443f22 = ((((((4100) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_39cfbd0f6e4d0fcbfd2415a0() {
  return __cxx_static_address_39cfbd0f6e4d0fcbfd2415a0.reference || (__cxx_static_address_39cfbd0f6e4d0fcbfd2415a0.reference = {
    __cReference: true,
    get value() { return BPANNEL3____header_global_67ecac1b4f443f22; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:739
export const W_HITTECHWALL16____header_global_dd48b1748a867ef7 = ((((((4144) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a6480981686cd54228646134() {
  return __cxx_static_address_a6480981686cd54228646134.reference || (__cxx_static_address_a6480981686cd54228646134.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL16____header_global_dd48b1748a867ef7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:740
export const W_HITTECHWALL10____header_global_7457c95634a830a4 = ((((((4145) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_564bfb0b91ce0aad83a0c898() {
  return __cxx_static_address_564bfb0b91ce0aad83a0c898.reference || (__cxx_static_address_564bfb0b91ce0aad83a0c898.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL10____header_global_7457c95634a830a4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:741
export const W_HITTECHWALL15____header_global_0b11d186bbce1d7b = ((((((4147) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e7a65570fb69ea0657d73bb1() {
  return __cxx_static_address_e7a65570fb69ea0657d73bb1.reference || (__cxx_static_address_e7a65570fb69ea0657d73bb1.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL15____header_global_0b11d186bbce1d7b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:742
export const W_MILKSHELF____header_global_b69f579ee906d5e2 = ((((((4181) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e0ef3f76bb8504e38e91ffaa() {
  return __cxx_static_address_e0ef3f76bb8504e38e91ffaa.reference || (__cxx_static_address_e0ef3f76bb8504e38e91ffaa.reference = {
    __cReference: true,
    get value() { return W_MILKSHELF____header_global_b69f579ee906d5e2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:743
export const W_MILKSHELFBROKE____header_global_3c04fa1f520171bf = ((((((4203) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_12f6be65245d576c246b9d1c() {
  return __cxx_static_address_12f6be65245d576c246b9d1c.reference || (__cxx_static_address_12f6be65245d576c246b9d1c.reference = {
    __cReference: true,
    get value() { return W_MILKSHELFBROKE____header_global_3c04fa1f520171bf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:744
export const PURPLELAVA____header_global_9d35da23675beeb1 = ((((((4240) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b68255e5fbb8545cbb0bb068() {
  return __cxx_static_address_b68255e5fbb8545cbb0bb068.reference || (__cxx_static_address_b68255e5fbb8545cbb0bb068.reference = {
    __cReference: true,
    get value() { return PURPLELAVA____header_global_9d35da23675beeb1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:745
export const TARGET____header_global_a4377290e77a890d = ((((((4359) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_66f7cbec1bbcf81ed69aa16f() {
  return __cxx_static_address_66f7cbec1bbcf81ed69aa16f.reference || (__cxx_static_address_66f7cbec1bbcf81ed69aa16f.reference = {
    __cReference: true,
    get value() { return TARGET____header_global_a4377290e77a890d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:746
export const DUCK____header_global_ff4ddd3064c19947 = ((((((4361) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c12d850a5f3a9ac33d986676() {
  return __cxx_static_address_c12d850a5f3a9ac33d986676.reference || (__cxx_static_address_c12d850a5f3a9ac33d986676.reference = {
    __cReference: true,
    get value() { return DUCK____header_global_ff4ddd3064c19947; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:747
export const PUKE____header_global_9f6da71af21eb943 = ((((((4389) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1b50d074bf6817f9be138bf2() {
  return __cxx_static_address_1b50d074bf6817f9be138bf2.reference || (__cxx_static_address_1b50d074bf6817f9be138bf2.reference = {
    __cReference: true,
    get value() { return PUKE____header_global_9f6da71af21eb943; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:748
export const DOORTILE23____header_global_0cef491e44021490 = ((((((4391) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f090deece3ea6c3ce009cce4() {
  return __cxx_static_address_f090deece3ea6c3ce009cce4.reference || (__cxx_static_address_f090deece3ea6c3ce009cce4.reference = {
    __cReference: true,
    get value() { return DOORTILE23____header_global_0cef491e44021490; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:749
export const SPEAKER____header_global_b4548918b678bb6d = ((((((4397) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_85eb965c9824e289164ad53d() {
  return __cxx_static_address_85eb965c9824e289164ad53d.reference || (__cxx_static_address_85eb965c9824e289164ad53d.reference = {
    __cReference: true,
    get value() { return SPEAKER____header_global_b4548918b678bb6d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:750
export const MAIL____header_global_3ae7b1aeecbad1a3 = ((((((4410) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_87abbaa7425c9c69bc2fdf6d() {
  return __cxx_static_address_87abbaa7425c9c69bc2fdf6d.reference || (__cxx_static_address_87abbaa7425c9c69bc2fdf6d.reference = {
    __cReference: true,
    get value() { return MAIL____header_global_3ae7b1aeecbad1a3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:751
export const HOTMEAT____header_global_48b8a1c3a3e5c4a4 = ((((((4427) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_65b562fabd75c5db939d4332() {
  return __cxx_static_address_65b562fabd75c5db939d4332.reference || (__cxx_static_address_65b562fabd75c5db939d4332.reference = {
    __cReference: true,
    get value() { return HOTMEAT____header_global_48b8a1c3a3e5c4a4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:752
export const TRIPODCAMERA____header_global_070b1c52f7da95aa = ((((((4444) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_70b9d8928d68fad7308a8d6b() {
  return __cxx_static_address_70b9d8928d68fad7308a8d6b.reference || (__cxx_static_address_70b9d8928d68fad7308a8d6b.reference = {
    __cReference: true,
    get value() { return TRIPODCAMERA____header_global_070b1c52f7da95aa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:753
export const PAPER____header_global_aebf39685a739941 = ((((((4460) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1f0ef970865fdb171919226a() {
  return __cxx_static_address_1f0ef970865fdb171919226a.reference || (__cxx_static_address_1f0ef970865fdb171919226a.reference = {
    __cReference: true,
    get value() { return PAPER____header_global_aebf39685a739941; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:754
export const GENERICPOLE2____header_global_f04fe093b5139c12 = ((((((4465) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_29e159d5c97eb514e48e991e() {
  return __cxx_static_address_29e159d5c97eb514e48e991e.reference || (__cxx_static_address_29e159d5c97eb514e48e991e.reference = {
    __cReference: true,
    get value() { return GENERICPOLE2____header_global_f04fe093b5139c12; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:755
export const XXXSTACY____header_global_e221405f9221b0a0 = ((((((4470) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_299306b55f609989bac82eae() {
  return __cxx_static_address_299306b55f609989bac82eae.reference || (__cxx_static_address_299306b55f609989bac82eae.reference = {
    __cReference: true,
    get value() { return XXXSTACY____header_global_e221405f9221b0a0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:756
export const LETTER____header_global_d0ebfadbf6a5007a = ((((((4502) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fed8c7591c6319ab47d35163() {
  return __cxx_static_address_fed8c7591c6319ab47d35163.reference || (__cxx_static_address_fed8c7591c6319ab47d35163.reference = {
    __cReference: true,
    get value() { return LETTER____header_global_d0ebfadbf6a5007a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:757
export const SIDEBOLT1____header_global_98e03e243e63ea81 = ((((((4525) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aa287bf1b883e288d319aa4a() {
  return __cxx_static_address_aa287bf1b883e288d319aa4a.reference || (__cxx_static_address_aa287bf1b883e288d319aa4a.reference = {
    __cReference: true,
    get value() { return SIDEBOLT1____header_global_98e03e243e63ea81; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:758
export const FOODOBJECT16____header_global_08a8da308b1c452d = ((((((4545) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9bfd1997abb2d9fe185ba6d4() {
  return __cxx_static_address_9bfd1997abb2d9fe185ba6d4.reference || (__cxx_static_address_9bfd1997abb2d9fe185ba6d4.reference = {
    __cReference: true,
    get value() { return FOODOBJECT16____header_global_08a8da308b1c452d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:759
export const TAMPON____header_global_479795d0b1713f79 = ((((((4557) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6ecec62ea07d73ed9c40a9e5() {
  return __cxx_static_address_6ecec62ea07d73ed9c40a9e5.reference || (__cxx_static_address_6ecec62ea07d73ed9c40a9e5.reference = {
    __cReference: true,
    get value() { return TAMPON____header_global_479795d0b1713f79; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:760
export const CANWITHSOMETHING2____header_global_e3ad9e335ba679b9 = ((((((4580) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_44ac9e7b82a79393937c4910() {
  return __cxx_static_address_44ac9e7b82a79393937c4910.reference || (__cxx_static_address_44ac9e7b82a79393937c4910.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING2____header_global_e3ad9e335ba679b9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:761
export const CANWITHSOMETHING3____header_global_d57cb0a19b43dee8 = ((((((4581) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a28ef3de4cc470297ea068be() {
  return __cxx_static_address_a28ef3de4cc470297ea068be.reference || (__cxx_static_address_a28ef3de4cc470297ea068be.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING3____header_global_d57cb0a19b43dee8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:762
export const CANWITHSOMETHING4____header_global_fff4fcae8bcd8250 = ((((((4582) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_67ac0973e57c908400afd6c6() {
  return __cxx_static_address_67ac0973e57c908400afd6c6.reference || (__cxx_static_address_67ac0973e57c908400afd6c6.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING4____header_global_fff4fcae8bcd8250; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:763
export const DOLPHIN1____header_global_9db53a72aa5184b7 = ((((((4591) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1c4f74155cc78edf251b1339() {
  return __cxx_static_address_1c4f74155cc78edf251b1339.reference || (__cxx_static_address_1c4f74155cc78edf251b1339.reference = {
    __cReference: true,
    get value() { return DOLPHIN1____header_global_9db53a72aa5184b7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:764
export const DOLPHIN2____header_global_cec2d4ab5ce8cf48 = ((((((4592) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9a54df220970216be2a5006d() {
  return __cxx_static_address_9a54df220970216be2a5006d.reference || (__cxx_static_address_9a54df220970216be2a5006d.reference = {
    __cReference: true,
    get value() { return DOLPHIN2____header_global_cec2d4ab5ce8cf48; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:765
export const NEWBEAST____header_global_fd0adedefe7faa48 = ((((((4610) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2e0846a4e224c14ea0985aa7() {
  return __cxx_static_address_2e0846a4e224c14ea0985aa7.reference || (__cxx_static_address_2e0846a4e224c14ea0985aa7.reference = {
    __cReference: true,
    get value() { return NEWBEAST____header_global_fd0adedefe7faa48; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:766
export const NEWBEASTSTAYPUT____header_global_3c528b4eea0e5fdf = ((((((4611) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ea642baaa2d1460c84e7ee59() {
  return __cxx_static_address_ea642baaa2d1460c84e7ee59.reference || (__cxx_static_address_ea642baaa2d1460c84e7ee59.reference = {
    __cReference: true,
    get value() { return NEWBEASTSTAYPUT____header_global_3c528b4eea0e5fdf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:767
export const BOSS4____header_global_28024c1dc5bec099 = ((((((4740) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_43688b1c5f9911a6c75a0aa1() {
  return __cxx_static_address_43688b1c5f9911a6c75a0aa1.reference || (__cxx_static_address_43688b1c5f9911a6c75a0aa1.reference = {
    __cReference: true,
    get value() { return BOSS4____header_global_28024c1dc5bec099; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:768
export const BOSS4STAYPUT____header_global_5c4eaded61b47b44 = ((((((4741) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8c73c8fba5d5232c4094e087() {
  return __cxx_static_address_8c73c8fba5d5232c4094e087.reference || (__cxx_static_address_8c73c8fba5d5232c4094e087.reference = {
    __cReference: true,
    get value() { return BOSS4STAYPUT____header_global_5c4eaded61b47b44; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:769
export const FEM10____header_global_4440bee211cee8bd = ((((((4864) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7e8eb39ed32b5bc5b9a3902f() {
  return __cxx_static_address_7e8eb39ed32b5bc5b9a3902f.reference || (__cxx_static_address_7e8eb39ed32b5bc5b9a3902f.reference = {
    __cReference: true,
    get value() { return FEM10____header_global_4440bee211cee8bd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:770
export const TOUGHGAL____header_global_b067e715d4b9445f = ((((((4866) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_059e3cf242b2d9b95df73f2a() {
  return __cxx_static_address_059e3cf242b2d9b95df73f2a.reference || (__cxx_static_address_059e3cf242b2d9b95df73f2a.reference = {
    __cReference: true,
    get value() { return TOUGHGAL____header_global_b067e715d4b9445f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:771
export const MAN____header_global_ae37042e933ad1cb = ((((((4871) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8f9860a568e4b8996ee152bb() {
  return __cxx_static_address_8f9860a568e4b8996ee152bb.reference || (__cxx_static_address_8f9860a568e4b8996ee152bb.reference = {
    __cReference: true,
    get value() { return MAN____header_global_ae37042e933ad1cb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:772
export const MAN2____header_global_9016926f30fad5e5 = ((((((4872) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bfd030c7283bc6dcc64c411a() {
  return __cxx_static_address_bfd030c7283bc6dcc64c411a.reference || (__cxx_static_address_bfd030c7283bc6dcc64c411a.reference = {
    __cReference: true,
    get value() { return MAN2____header_global_9016926f30fad5e5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:773
export const WOMAN____header_global_4a123c834c175976 = ((((((4874) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1ab288aac23ae1419f4c7993() {
  return __cxx_static_address_1ab288aac23ae1419f4c7993.reference || (__cxx_static_address_1ab288aac23ae1419f4c7993.reference = {
    __cReference: true,
    get value() { return WOMAN____header_global_4a123c834c175976; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:774
export const NATURALLIGHTNING____header_global_7e47123f54c9d4a4 = ((((((4890) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2035175ad2b60a483d55685d() {
  return __cxx_static_address_2035175ad2b60a483d55685d.reference || (__cxx_static_address_2035175ad2b60a483d55685d.reference = {
    __cReference: true,
    get value() { return NATURALLIGHTNING____header_global_7e47123f54c9d4a4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:775
export const WEATHERWARN____header_global_915790e8ccceee81 = ((((((4893) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_733306086fb1dea21ec67ca9() {
  return __cxx_static_address_733306086fb1dea21ec67ca9.reference || (__cxx_static_address_733306086fb1dea21ec67ca9.reference = {
    __cReference: true,
    get value() { return WEATHERWARN____header_global_915790e8ccceee81; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:776
export const DUKETAG____header_global_e11acd2f8bf62119 = ((((((4900) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eae4fb61455b621f0f36928a() {
  return __cxx_static_address_eae4fb61455b621f0f36928a.reference || (__cxx_static_address_eae4fb61455b621f0f36928a.reference = {
    __cReference: true,
    get value() { return DUKETAG____header_global_e11acd2f8bf62119; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:777
export const SIGN1____header_global_ac634e0d16354c2d = ((((((4909) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0e423f772cace1dca168eb53() {
  return __cxx_static_address_0e423f772cace1dca168eb53.reference || (__cxx_static_address_0e423f772cace1dca168eb53.reference = {
    __cReference: true,
    get value() { return SIGN1____header_global_ac634e0d16354c2d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:778
export const SIGN2____header_global_03d9c12504c35756 = ((((((4912) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d8294d0d16537647320ee59d() {
  return __cxx_static_address_d8294d0d16537647320ee59d.reference || (__cxx_static_address_d8294d0d16537647320ee59d.reference = {
    __cReference: true,
    get value() { return SIGN2____header_global_03d9c12504c35756; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:779
export const JURYGUY____header_global_855290d4083a856e = ((((((4943) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fa4227a5e69c40a093db3160() {
  return __cxx_static_address_fa4227a5e69c40a093db3160.reference || (__cxx_static_address_fa4227a5e69c40a093db3160.reference = {
    __cReference: true,
    get value() { return JURYGUY____header_global_855290d4083a856e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:780
export const WIDESCREENSTATUSBAR____header_global_004c93f64426681e = ((((((5120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c9773b50a76b35bba125350e() {
  return __cxx_static_address_c9773b50a76b35bba125350e.reference || (__cxx_static_address_c9773b50a76b35bba125350e.reference = {
    __cReference: true,
    get value() { return WIDESCREENSTATUSBAR____header_global_004c93f64426681e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:781
export const RPGGUNWIDE____header_global_f7fd12050803e07e = ((((((5121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7d35fad899bb4e3d46a5340a() {
  return __cxx_static_address_7d35fad899bb4e3d46a5340a.reference || (__cxx_static_address_7d35fad899bb4e3d46a5340a.reference = {
    __cReference: true,
    get value() { return RPGGUNWIDE____header_global_f7fd12050803e07e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:782
export const FIRSTGUNRELOADWIDE____header_global_79be90aaf6d5a4d4 = ((((((5122) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6be10d252b2d06af118d62fc() {
  return __cxx_static_address_6be10d252b2d06af118d62fc.reference || (__cxx_static_address_6be10d252b2d06af118d62fc.reference = {
    __cReference: true,
    get value() { return FIRSTGUNRELOADWIDE____header_global_79be90aaf6d5a4d4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:783
export const FREEZEWIDE____header_global_23a345f6b4abbda9 = ((((((5123) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_28f9f2929259a610e32cdcf3() {
  return __cxx_static_address_28f9f2929259a610e32cdcf3.reference || (__cxx_static_address_28f9f2929259a610e32cdcf3.reference = {
    __cReference: true,
    get value() { return FREEZEWIDE____header_global_23a345f6b4abbda9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:784
export const FREEZEFIREWIDE____header_global_a7c9622a60405137 = ((((((5124) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_351a0a0649c18b3f0d879838() {
  return __cxx_static_address_351a0a0649c18b3f0d879838.reference || (__cxx_static_address_351a0a0649c18b3f0d879838.reference = {
    __cReference: true,
    get value() { return FREEZEFIREWIDE____header_global_a7c9622a60405137; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:785
export const SHRINKERWIDE____header_global_068be22a6cc0a2ff = ((((((5127) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_27be3c74f816771a22447589() {
  return __cxx_static_address_27be3c74f816771a22447589.reference || (__cxx_static_address_27be3c74f816771a22447589.reference = {
    __cReference: true,
    get value() { return SHRINKERWIDE____header_global_068be22a6cc0a2ff; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:786
export const CRACKKNUCKLESWIDE____header_global_a23ff40f0c1c34fc = ((((((5129) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_151ac1d99a8c2c123247c16c() {
  return __cxx_static_address_151ac1d99a8c2c123247c16c.reference || (__cxx_static_address_151ac1d99a8c2c123247c16c.reference = {
    __cReference: true,
    get value() { return CRACKKNUCKLESWIDE____header_global_a23ff40f0c1c34fc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:787
export const FLAMETHROWERSPRITE____header_global_f9ef4ee0292f6228 = ((((((5134) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4e49cc23b91162ce1a137db2() {
  return __cxx_static_address_4e49cc23b91162ce1a137db2.reference || (__cxx_static_address_4e49cc23b91162ce1a137db2.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERSPRITE____header_global_f9ef4ee0292f6228; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:788
export const FLAMETHROWERAMMO____header_global_da13120e5a3bab14 = ((((((5135) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e6a4bc12f665d6f176bfb3f2() {
  return __cxx_static_address_e6a4bc12f665d6f176bfb3f2.reference || (__cxx_static_address_e6a4bc12f665d6f176bfb3f2.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERAMMO____header_global_da13120e5a3bab14; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:789
export const FLAMETHROWER____header_global_385e218f4d0613d0 = ((((((5138) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2ca6b7a9b453b26163a1263c() {
  return __cxx_static_address_2ca6b7a9b453b26163a1263c.reference || (__cxx_static_address_2ca6b7a9b453b26163a1263c.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER____header_global_385e218f4d0613d0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:790
export const FLAMETHROWERFIRE____header_global_677f6cdde058bd9e = ((((((5139) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5287244a4765494f9c73b71e() {
  return __cxx_static_address_5287244a4765494f9c73b71e.reference || (__cxx_static_address_5287244a4765494f9c73b71e.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERFIRE____header_global_677f6cdde058bd9e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:791
export const FLAMETHROWERFLAME____header_global_9a2f31a1c544c398 = ((((((1891) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_05b2c47f1ab7bbbc74d6650b() {
  return __cxx_static_address_05b2c47f1ab7bbbc74d6650b.reference || (__cxx_static_address_05b2c47f1ab7bbbc74d6650b.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERFLAME____header_global_9a2f31a1c544c398; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:792
export const FLAMETHROWERPILOT____header_global_3c0c2b1f216136ce = ((((((5174) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4e8a19b92a97fdb917967c70() {
  return __cxx_static_address_4e8a19b92a97fdb917967c70.reference || (__cxx_static_address_4e8a19b92a97fdb917967c70.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERPILOT____header_global_3c0c2b1f216136ce; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:793
export const FIREBALL____header_global_e988dca9e839951e = ((((((5163) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fb5d8970386fcf40cbe44a60() {
  return __cxx_static_address_fb5d8970386fcf40cbe44a60.reference || (__cxx_static_address_fb5d8970386fcf40cbe44a60.reference = {
    __cReference: true,
    get value() { return FIREBALL____header_global_e988dca9e839951e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:794
export const ONFIRE____header_global_d2118daac525ec60 = ((((((5152) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2c05ae462ec88bf419c8ed38() {
  return __cxx_static_address_2c05ae462ec88bf419c8ed38.reference || (__cxx_static_address_2c05ae462ec88bf419c8ed38.reference = {
    __cReference: true,
    get value() { return ONFIRE____header_global_d2118daac525ec60; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:795
export const ONFIRESMOKE____header_global_9bf0e05c95c0930f = ((((((5143) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9aa46a5bfae2e4fb5118f152() {
  return __cxx_static_address_9aa46a5bfae2e4fb5118f152.reference || (__cxx_static_address_9aa46a5bfae2e4fb5118f152.reference = {
    __cReference: true,
    get value() { return ONFIRESMOKE____header_global_9bf0e05c95c0930f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:796
export const BURNEDCORPSE____header_global_665e96ef4753951a = ((((((5173) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9e0ed1b8d0c83e03c536a591() {
  return __cxx_static_address_9e0ed1b8d0c83e03c536a591.reference || (__cxx_static_address_9e0ed1b8d0c83e03c536a591.reference = {
    __cReference: true,
    get value() { return BURNEDCORPSE____header_global_665e96ef4753951a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:797
export const WHISPYSMOKE____header_global_30d35a08345a01df = ((((((5268) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2a4dd728518bf0f0911b7321() {
  return __cxx_static_address_2a4dd728518bf0f0911b7321.reference || (__cxx_static_address_2a4dd728518bf0f0911b7321.reference = {
    __cReference: true,
    get value() { return WHISPYSMOKE____header_global_30d35a08345a01df; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:798
export const FIREFLY____header_global_b0cb456b2ea8fa4b = ((((((5180) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b9aa64e725fad570dd7d85a0() {
  return __cxx_static_address_b9aa64e725fad570dd7d85a0.reference || (__cxx_static_address_b9aa64e725fad570dd7d85a0.reference = {
    __cReference: true,
    get value() { return FIREFLY____header_global_b0cb456b2ea8fa4b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:799
export const FIREFLYSHRINKEFFECT____header_global_037a99d92b34794a = ((((((5360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a2c7d29ef3fa7666697888fa() {
  return __cxx_static_address_a2c7d29ef3fa7666697888fa.reference || (__cxx_static_address_a2c7d29ef3fa7666697888fa.reference = {
    __cReference: true,
    get value() { return FIREFLYSHRINKEFFECT____header_global_037a99d92b34794a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:800
export const FIREFLYGROWEFFECT____header_global_0d7e675a332191cc = ((((((5367) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6a43a27386a48ab290c8cc98() {
  return __cxx_static_address_6a43a27386a48ab290c8cc98.reference || (__cxx_static_address_6a43a27386a48ab290c8cc98.reference = {
    __cReference: true,
    get value() { return FIREFLYGROWEFFECT____header_global_0d7e675a332191cc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:801
export const FIREFLYFLYINGEFFECT____header_global_5cc4b41e29bed990 = ((((((5296) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_218578e40abf9b70b24a11e9() {
  return __cxx_static_address_218578e40abf9b70b24a11e9.reference || (__cxx_static_address_218578e40abf9b70b24a11e9.reference = {
    __cReference: true,
    get value() { return FIREFLYFLYINGEFFECT____header_global_5cc4b41e29bed990; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:802
export const BOSS5____header_global_3473678e1822ac88 = ((((((5310) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_be5f94d217ce95a97e80e1d0() {
  return __cxx_static_address_be5f94d217ce95a97e80e1d0.reference || (__cxx_static_address_be5f94d217ce95a97e80e1d0.reference = {
    __cReference: true,
    get value() { return BOSS5____header_global_3473678e1822ac88; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:803
export const BOSS5STAYPUT____header_global_1fa89a963adec384 = ((((((5311) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fce4b2124fdb081e2093bce5() {
  return __cxx_static_address_fce4b2124fdb081e2093bce5.reference || (__cxx_static_address_fce4b2124fdb081e2093bce5.reference = {
    __cReference: true,
    get value() { return BOSS5STAYPUT____header_global_1fa89a963adec384; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:804
export const LAVAPOOL____header_global_f3830413e1ccc8cd = ((((((5304) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cfe4c7eb7490f32ebe35236f() {
  return __cxx_static_address_cfe4c7eb7490f32ebe35236f.reference || (__cxx_static_address_cfe4c7eb7490f32ebe35236f.reference = {
    __cReference: true,
    get value() { return LAVAPOOL____header_global_f3830413e1ccc8cd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:805
export const LAVASPLASH____header_global_d72bdcec24e8ee1a = ((((((5371) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5ec97b353476024d2c6d7413() {
  return __cxx_static_address_5ec97b353476024d2c6d7413.reference || (__cxx_static_address_5ec97b353476024d2c6d7413.reference = {
    __cReference: true,
    get value() { return LAVASPLASH____header_global_d72bdcec24e8ee1a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:806
export const LAVAPOOLBUBBLE____header_global_e5027d093982b828 = ((((((5207) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_758e6246acd8745799d9ac19() {
  return __cxx_static_address_758e6246acd8745799d9ac19.reference || (__cxx_static_address_758e6246acd8745799d9ac19.reference = {
    __cReference: true,
    get value() { return LAVAPOOLBUBBLE____header_global_e5027d093982b828; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:807
export const BOSS2STAYPUT____header_global_6be877ad36d40736 = ((((((2711) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_648b517d1b54b63e72e29188() {
  return __cxx_static_address_648b517d1b54b63e72e29188.reference || (__cxx_static_address_648b517d1b54b63e72e29188.reference = {
    __cReference: true,
    get value() { return BOSS2STAYPUT____header_global_6be877ad36d40736; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:808
export const BOSS3STAYPUT____header_global_a1b960178ab74482 = ((((((2761) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_89b50e01c187ed11b7ffe3e8() {
  return __cxx_static_address_89b50e01c187ed11b7ffe3e8.reference || (__cxx_static_address_89b50e01c187ed11b7ffe3e8.reference = {
    __cReference: true,
    get value() { return BOSS3STAYPUT____header_global_a1b960178ab74482; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:809
export const E32_TILE5736____header_global_e9a19cda26eb327e = ((((((5736) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ba82cb5b05b9ae79b1185c5b() {
  return __cxx_static_address_ba82cb5b05b9ae79b1185c5b.reference || (__cxx_static_address_ba82cb5b05b9ae79b1185c5b.reference = {
    __cReference: true,
    get value() { return E32_TILE5736____header_global_e9a19cda26eb327e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:810
export const E32_TILE5737____header_global_e7c51df05e600443 = ((((((5737) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_18d582248cf690475a736cb3() {
  return __cxx_static_address_18d582248cf690475a736cb3.reference || (__cxx_static_address_18d582248cf690475a736cb3.reference = {
    __cReference: true,
    get value() { return E32_TILE5737____header_global_e7c51df05e600443; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:811
export const E32_TILE5846____header_global_8b51f1b502211f15 = ((((((5846) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9e52677611bd6cd272cc5265() {
  return __cxx_static_address_9e52677611bd6cd272cc5265.reference || (__cxx_static_address_9e52677611bd6cd272cc5265.reference = {
    __cReference: true,
    get value() { return E32_TILE5846____header_global_8b51f1b502211f15; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/network.h:180
export const cSnapshotMemUsage__header_global_359dea36989cc4d5 = u64((BigInt(u64(64)) * BigInt((BigInt((BigInt((BigInt(72) * BigInt(u64(16384)))) + BigInt((BigInt(96) * BigInt(u64(4096)))))) + BigInt((BigInt(296) * BigInt(u64(16384))))))));
function __cxx_static_address_f3452cc4c993984dd5a87c34() {
  return __cxx_static_address_f3452cc4c993984dd5a87c34.reference || (__cxx_static_address_f3452cc4c993984dd5a87c34.reference = {
    __cReference: true,
    get value() { return cSnapshotMemUsage__header_global_359dea36989cc4d5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
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

// C/C++ source: source/duke3d/src/sbar.cpp:27
export let althud_flashing = i32(1);
export function __cxx_global_cell_ff2575bcc3976eb7e2a1ffa3() {
  return __cxx_global_cell_ff2575bcc3976eb7e2a1ffa3.reference || (__cxx_global_cell_ff2575bcc3976eb7e2a1ffa3.reference = {
    __cReference: true,
    get value() { return althud_flashing; },
    set value(__cxx_lvalue_0) { althud_flashing = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/sbar.cpp:28
export let althud_numbertile = i32(2930);
export function __cxx_global_cell_9a80e973e807bcb445a7b517() {
  return __cxx_global_cell_9a80e973e807bcb445a7b517.reference || (__cxx_global_cell_9a80e973e807bcb445a7b517.reference = {
    __cReference: true,
    get value() { return althud_numbertile; },
    set value(__cxx_lvalue_0) { althud_numbertile = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/sbar.cpp:29
export let althud_numberpal = i32(0);
export function __cxx_global_cell_a32595c9de8cd1b1b91a9683() {
  return __cxx_global_cell_a32595c9de8cd1b1b91a9683.reference || (__cxx_global_cell_a32595c9de8cd1b1b91a9683.reference = {
    __cReference: true,
    get value() { return althud_numberpal; },
    set value(__cxx_lvalue_0) { althud_numberpal = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/sbar.cpp:34
export let althud_shadows = i32(1);
export function __cxx_global_cell_1486ab6cb51e1f95d5795a47() {
  return __cxx_global_cell_1486ab6cb51e1f95d5795a47.reference || (__cxx_global_cell_1486ab6cb51e1f95d5795a47.reference = {
    __cReference: true,
    get value() { return althud_shadows; },
    set value(__cxx_lvalue_0) { althud_shadows = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/include/fix16.h:31
export const FIX16_MAX__header_global_fedc1f0723b15ba3 = i32(2147483647);
function __cxx_static_address_15f8c86ca3634bdee2cac8fc() {
  return __cxx_static_address_15f8c86ca3634bdee2cac8fc.reference || (__cxx_static_address_15f8c86ca3634bdee2cac8fc.reference = {
    __cReference: true,
    get value() { return FIX16_MAX__header_global_fedc1f0723b15ba3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:32
export const FIX16_MIN__header_global_3a201e45deeb685e = i32(2147483648);
function __cxx_static_address_9a8bebab5116570c831cecbd() {
  return __cxx_static_address_9a8bebab5116570c831cecbd.reference || (__cxx_static_address_9a8bebab5116570c831cecbd.reference = {
    __cReference: true,
    get value() { return FIX16_MIN__header_global_3a201e45deeb685e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:33
export const FIX16_OVERFLOW__header_global_c93bcfd8e33a61c7 = i32(2147483648);
function __cxx_static_address_3951054e2752a91b74ce6de5() {
  return __cxx_static_address_3951054e2752a91b74ce6de5.reference || (__cxx_static_address_3951054e2752a91b74ce6de5.reference = {
    __cReference: true,
    get value() { return FIX16_OVERFLOW__header_global_c93bcfd8e33a61c7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:35
export const fix16_one__header_global_b967d66c965f2951 = i32(65536);
function __cxx_static_address_09bb3ce757f851a2e8b11e99() {
  return __cxx_static_address_09bb3ce757f851a2e8b11e99.reference || (__cxx_static_address_09bb3ce757f851a2e8b11e99.reference = {
    __cReference: true,
    get value() { return fix16_one__header_global_b967d66c965f2951; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:36
export const fix16_half__header_global_a85ef4b1dcf6ae48 = i32(32768);
function __cxx_static_address_2b5505e096c12801c6318552() {
  return __cxx_static_address_2b5505e096c12801c6318552.reference || (__cxx_static_address_2b5505e096c12801c6318552.reference = {
    __cReference: true,
    get value() { return fix16_half__header_global_a85ef4b1dcf6ae48; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:37
export const flt_f161r__header_global_5f9ef3ae369de2ee = Math.fround(Math.fround((Math.fround(1) / Math.fround(65536))));
function __cxx_static_address_450146be9882c9b6ae0b1d48() {
  return __cxx_static_address_450146be9882c9b6ae0b1d48.reference || (__cxx_static_address_450146be9882c9b6ae0b1d48.reference = {
    __cReference: true,
    get value() { return flt_f161r__header_global_5f9ef3ae369de2ee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/sbar.cpp:499
export function G_GetInvAmount(p) {
  switch (i32((p).value.inven_icon)) {
    case i32(1): {
      return i32((cDeref(cPointerOffset((p).value.inv_amount, 9, Int16Array.BYTES_PER_ELEMENT), Int16Array).value));
    }
    case i32(2): {
      return i32((i32((i32((cDeref(cPointerOffset((p).value.inv_amount, 0, Int16Array.BYTES_PER_ELEMENT), Int16Array).value)) + 3)) >> 2));
    }
    case i32(3): {
      return i32(Math.trunc(i32((i32((cDeref(cPointerOffset((p).value.inv_amount, 3, Int16Array.BYTES_PER_ELEMENT), Int16Array).value)) + 15)) / 24));
    }
    case i32(4): {
      return i32((i32((i32((cDeref(cPointerOffset((p).value.inv_amount, 4, Int16Array.BYTES_PER_ELEMENT), Int16Array).value)) + 15)) >> 4));
    }
    case i32(5): {
      return i32(Math.trunc(i32((cDeref(cPointerOffset((p).value.inv_amount, 7, Int16Array.BYTES_PER_ELEMENT), Int16Array).value)) / 12));
    }
    case i32(6): {
      return i32((i32((i32((cDeref(cPointerOffset((p).value.inv_amount, 2, Int16Array.BYTES_PER_ELEMENT), Int16Array).value)) + 63)) >> 6));
    }
    case i32(7): {
      return i32((i32((cDeref(cPointerOffset((p).value.inv_amount, 10, Int16Array.BYTES_PER_ELEMENT), Int16Array).value)) >> 1));
    }
  }
  return i32((-1));
}

// C/C++ source: source/duke3d/src/sbar.cpp:522
export function G_GetInvOn(p) {
  switch (i32((p).value.inven_icon)) {
    case i32(3): {
      return i32((p).value.holoduke_on);
    }
    case i32(4): {
      return i32((p).value.jetpack_on);
    }
    case i32(5): {
      return i32((p).value.heat_on);
    }
  }
  return i32(2147483648);
}

// C/C++ source: source/build/include/compat.h:1169
export const pow2char__header_global_3a82812d72f9b938 = new Uint8Array([((1) & 255), ((2) & 255), ((4) & 255), ((8) & 255), ((16) & 255), ((32) & 255), ((64) & 255), ((128) & 255)]);
function __cxx_static_address_c7a0567f3924f747e9e49dd2() {
  return __cxx_static_address_c7a0567f3924f747e9e49dd2.reference || (__cxx_static_address_c7a0567f3924f747e9e49dd2.reference = {
    __cReference: true,
    get value() { return pow2char__header_global_3a82812d72f9b938; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:172
export const g_defaultVideoModes__header_global_835e6a88c3bb0db5 = [cMarkAggregate(({"x": 2560, "y": 1440})), cMarkAggregate(({"x": 2560, "y": 1200})), cMarkAggregate(({"x": 2560, "y": 1080})), cMarkAggregate(({"x": 1920, "y": 1440})), cMarkAggregate(({"x": 1920, "y": 1200})), cMarkAggregate(({"x": 1920, "y": 1080})), cMarkAggregate(({"x": 1680, "y": 1050})), cMarkAggregate(({"x": 1600, "y": 1200})), cMarkAggregate(({"x": 1600, "y": 900})), cMarkAggregate(({"x": 1366, "y": 768})), cMarkAggregate(({"x": 1280, "y": 1024})), cMarkAggregate(({"x": 1280, "y": 960})), cMarkAggregate(({"x": 1280, "y": 720})), cMarkAggregate(({"x": 1152, "y": 864})), cMarkAggregate(({"x": 1024, "y": 768})), cMarkAggregate(({"x": 1024, "y": 600})), cMarkAggregate(({"x": 800, "y": 600})), cMarkAggregate(({"x": 640, "y": 480})), cMarkAggregate(({"x": 640, "y": 400})), cMarkAggregate(({"x": 512, "y": 384})), cMarkAggregate(({"x": 480, "y": 360})), cMarkAggregate(({"x": 400, "y": 300})), cMarkAggregate(({"x": 320, "y": 240})), cMarkAggregate(({"x": 320, "y": 200})), cMarkAggregate(({"x": 0, "y": 0}))];
function __cxx_static_address_f7971d4e32a5c64cb47e0c99() {
  return __cxx_static_address_f7971d4e32a5c64cb47e0c99.reference || (__cxx_static_address_f7971d4e32a5c64cb47e0c99.reference = {
    __cReference: true,
    get value() { return g_defaultVideoModes__header_global_835e6a88c3bb0db5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:188
export const g_keyAsciiTable__header_global_6da27e36cb3fe0f6 = new Uint8Array([((0) & 255), ((0) & 255), 49, 50, 51, 52, 53, 54, 55, 56, 57, 48, 45, 61, ((0) & 255), ((0) & 255), 113, 119, 101, 114, 116, 121, 117, 105, 111, 112, 91, 93, ((0) & 255), ((0) & 255), 97, 115, 100, 102, 103, 104, 106, 107, 108, 59, ((39) & 255), 96, ((0) & 255), ((92) & 255), 122, 120, 99, 118, 98, 110, 109, 44, 46, 47, ((0) & 255), 42, ((0) & 255), ((32) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), 55, 56, 57, 45, 52, 53, 54, 43, 49, 50, 51, 48, 46, ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255)]);
function __cxx_static_address_d02be21396e34451d44ffc2e() {
  return __cxx_static_address_d02be21396e34451d44ffc2e.reference || (__cxx_static_address_d02be21396e34451d44ffc2e.reference = {
    __cReference: true,
    get value() { return g_keyAsciiTable__header_global_6da27e36cb3fe0f6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:196
export const g_keyAsciiTableShift__header_global_fe64a88f277cde50 = new Uint8Array([((0) & 255), ((0) & 255), 33, 64, 35, 36, 37, 94, 38, 42, 40, 41, 95, 43, ((0) & 255), ((0) & 255), 81, 87, 69, 82, 84, 89, 85, 73, 79, 80, 123, 125, ((0) & 255), ((0) & 255), 65, 83, 68, 70, 71, 72, 74, 75, 76, 58, 34, 126, ((0) & 255), 124, 90, 88, 67, 86, 66, 78, 77, 60, 62, 63, ((0) & 255), 42, ((0) & 255), ((32) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), 55, 56, 57, 45, 52, 53, 54, 43, 49, 50, 51, 48, 46, ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255)]);
function __cxx_static_address_6292253c72a070f47bfedb8e() {
  return __cxx_static_address_6292253c72a070f47bfedb8e.reference || (__cxx_static_address_6292253c72a070f47bfedb8e.reference = {
    __cReference: true,
    get value() { return g_keyAsciiTableShift__header_global_fe64a88f277cde50; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:895
export const pow2long__header_global_83c3e29a55e8d5ec = new Int32Array([1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144, 524288, 1048576, 2097152, 4194304, 8388608, 16777216, 33554432, 67108864, 134217728, 268435456, 536870912, 1073741824, 2147483647]);
function __cxx_static_address_a3a7fd00246b282c3dcdc37e() {
  return __cxx_static_address_a3a7fd00246b282c3dcdc37e.reference || (__cxx_static_address_a3a7fd00246b282c3dcdc37e.reference = {
    __cReference: true,
    get value() { return pow2long__header_global_83c3e29a55e8d5ec; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:907
export const pow2ulong__header_global_b8465059ce843aa4 = new Uint32Array([u32(1), u32(2), u32(4), u32(8), u32(16), u32(32), u32(64), u32(128), u32(256), u32(512), u32(1024), u32(2048), u32(4096), u32(8192), u32(16384), u32(32768), u32(65536), u32(131072), u32(262144), u32(524288), u32(1048576), u32(2097152), u32(4194304), u32(8388608), u32(16777216), u32(33554432), u32(67108864), u32(134217728), u32(268435456), u32(536870912), u32(1073741824), u32(2147483648n)]);
function __cxx_static_address_465b2cc2313d8a7757964392() {
  return __cxx_static_address_465b2cc2313d8a7757964392.reference || (__cxx_static_address_465b2cc2313d8a7757964392.reference = {
    __cReference: true,
    get value() { return pow2ulong__header_global_b8465059ce843aa4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:919
export const pow264__header_global_c57d1799d211c6db = new BigInt64Array([BigInt(i64(1)), BigInt(i64(2)), BigInt(i64(4)), BigInt(i64(8)), BigInt(i64(16)), BigInt(i64(32)), BigInt(i64(64)), BigInt(i64(128)), BigInt(i64(256)), BigInt(i64(512)), BigInt(i64(1024)), BigInt(i64(2048)), BigInt(i64(4096)), BigInt(i64(8192)), BigInt(i64(16384)), BigInt(i64(32768)), BigInt(i64(65536)), BigInt(i64(131072)), BigInt(i64(262144)), BigInt(i64(524288)), BigInt(i64(1048576)), BigInt(i64(2097152)), BigInt(i64(4194304)), BigInt(i64(8388608)), BigInt(i64(16777216)), BigInt(i64(33554432)), BigInt(i64(67108864)), BigInt(i64(134217728)), BigInt(i64(268435456)), BigInt(i64(536870912)), BigInt(i64(1073741824)), BigInt(2147483648n), BigInt(4294967296n), BigInt(8589934592n), BigInt(17179869184n), BigInt(34359738368n), BigInt(68719476736n), BigInt(137438953472n), BigInt(274877906944n), BigInt(549755813888n), BigInt(1099511627776n), BigInt(2199023255552n), BigInt(4398046511104n), BigInt(8796093022208n), BigInt(17592186044416n), BigInt(35184372088832n), BigInt(70368744177664n), BigInt(140737488355328n), BigInt(281474976710656n), BigInt(562949953421312n), BigInt(1125899906842624n), BigInt(2251799813685248n), BigInt(4503599627370496n), BigInt(9007199254740992n), BigInt(18014398509481984n), BigInt(36028797018963968n), BigInt(72057594037927936n), BigInt(144115188075855872n), BigInt(288230376151711744n), BigInt(576460752303423488n), BigInt(1152921504606846976n), BigInt(2305843009213693952n), BigInt(4611686018427387904n), BigInt(9223372036854775807n)]);
function __cxx_static_address_455f38092d0d3b3b41f73f09() {
  return __cxx_static_address_455f38092d0d3b3b41f73f09.reference || (__cxx_static_address_455f38092d0d3b3b41f73f09.reference = {
    __cReference: true,
    get value() { return pow264__header_global_c57d1799d211c6db; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/sbar.cpp:1079
export function videoGetRenderMode__header_631a91fb6a6f() {
  return i32(0);
}

// C/C++ source: source/build/include/smmalloc.h:864
export function _sm_free(allocator, p) {
  return cRecordObject(allocator).Free(p);
}

// C/C++ source: source/build/include/smmalloc.h:859
export function _sm_malloc(allocator, bytesCount, alignment) {
  return cRecordObject(allocator).Alloc(bytesCount, alignment);
}
