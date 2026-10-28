// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/audiolib/src/multivoc.cpp
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

// C/C++ source: source/build/include/fix16.h:111
export const fix16_rad_to_deg_mult__header_global_5f14566919e51ca3 = i32(3754936);
function __cxx_static_address_de7af7089e6c0efcde3ca5aa() {
  return __cxx_static_address_de7af7089e6c0efcde3ca5aa.reference || (__cxx_static_address_de7af7089e6c0efcde3ca5aa.reference = {
    __cReference: true,
    get value() { return fix16_rad_to_deg_mult__header_global_5f14566919e51ca3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:114
export const fix16_deg_to_rad_mult__header_global_ca96090559e514d4 = i32(1144);
function __cxx_static_address_8d3e2fb7ea94f01b41f81bb0() {
  return __cxx_static_address_8d3e2fb7ea94f01b41f81bb0.reference || (__cxx_static_address_8d3e2fb7ea94f01b41f81bb0.reference = {
    __cReference: true,
    get value() { return fix16_deg_to_rad_mult__header_global_ca96090559e514d4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/audiolib/include/multivoc.h:149
export function MV_MusicRoutineBuffer() {
  return MV_MusicRoutineBuffer.type || (MV_MusicRoutineBuffer.type = class MV_MusicRoutineBuffer__implementation {
  constructor() {
    this.buffer = undefined;
    this.size = undefined;
  }
});
}

// C/C++ source: source/build/include/libdivide.h:152
export function libdivide_u64_t() {
  return libdivide_u64_t.type || (libdivide_u64_t.type = class libdivide_u64_t__implementation {
  constructor() {
    this.magic = undefined;
    this.more = undefined;
  }
});
}

// C/C++ source: source/audiolib/src/multivoc.cpp:51
export let MV_XMPInterpolation = i32(0);
export function __cxx_global_cell_562308fe432c31e60333b8cb() {
  return __cxx_global_cell_562308fe432c31e60333b8cb.reference || (__cxx_global_cell_562308fe432c31e60333b8cb.reference = {
    __cReference: true,
    get value() { return MV_XMPInterpolation; },
    set value(__cxx_lvalue_0) { MV_XMPInterpolation = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/audiolib/src/multivoc.cpp:60
export let MV_ReverbLevel = 0;
function __cxx_static_address_8ab29b01937a37b6b93b5306() {
  return __cxx_static_address_8ab29b01937a37b6b93b5306.reference || (__cxx_static_address_8ab29b01937a37b6b93b5306.reference = {
    __cReference: true,
    get value() { return MV_ReverbLevel; },
    set value(__cxx_lvalue_0) { MV_ReverbLevel = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/audiolib/src/multivoc.cpp:61
export let MV_ReverbDelay = 0;
function __cxx_static_address_04bb4c1afe72ffab04a12fb4() {
  return __cxx_static_address_04bb4c1afe72ffab04a12fb4.reference || (__cxx_static_address_04bb4c1afe72ffab04a12fb4.reference = {
    __cReference: true,
    get value() { return MV_ReverbDelay; },
    set value(__cxx_lvalue_0) { MV_ReverbDelay = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/audiolib/src/multivoc.cpp:62
export let MV_ReverbVolume = 0;
function __cxx_static_address_116153779212623c7a04003f() {
  return __cxx_static_address_116153779212623c7a04003f.reference || (__cxx_static_address_116153779212623c7a04003f.reference = {
    __cReference: true,
    get value() { return MV_ReverbVolume; },
    set value(__cxx_lvalue_0) { MV_ReverbVolume = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/audiolib/src/multivoc.cpp:64
export let MV_PanTable = Array.from({length:128}, () => Array.from({length:128}, () => cZeroAggregate({"record": {"left": {"scalar": "unsigned char"}, "right": {"scalar": "unsigned char"}}})));
function __cxx_static_address_a187ce19e9b40c298627eff3() {
  return __cxx_static_address_a187ce19e9b40c298627eff3.reference || (__cxx_static_address_a187ce19e9b40c298627eff3.reference = {
    __cReference: true,
    get value() { return MV_PanTable; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/audiolib/src/multivoc.cpp:66
export let MV_Installed = 0;
export function __cxx_global_cell_6ba894e05caa47d1bfdd0a0c() {
  return __cxx_global_cell_6ba894e05caa47d1bfdd0a0c.reference || (__cxx_global_cell_6ba894e05caa47d1bfdd0a0c.reference = {
    __cReference: true,
    get value() { return MV_Installed; },
    set value(__cxx_lvalue_0) { MV_Installed = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/audiolib/src/multivoc.cpp:68
export let MV_BufferSize = i32(256);
export function __cxx_global_cell_52b7fc592cc0ae06f2ba575b() {
  return __cxx_global_cell_52b7fc592cc0ae06f2ba575b.reference || (__cxx_global_cell_52b7fc592cc0ae06f2ba575b.reference = {
    __cReference: true,
    get value() { return MV_BufferSize; },
    set value(__cxx_lvalue_0) { MV_BufferSize = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/audiolib/src/multivoc.cpp:69
export let MV_BufferLength = 0;
function __cxx_static_address_de9a3150e6a23bec9b056b81() {
  return __cxx_static_address_de9a3150e6a23bec9b056b81.reference || (__cxx_static_address_de9a3150e6a23bec9b056b81.reference = {
    __cReference: true,
    get value() { return MV_BufferLength; },
    set value(__cxx_lvalue_0) { MV_BufferLength = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/audiolib/src/multivoc.cpp:71
export let MV_NumberOfBuffers = i32(32);
function __cxx_static_address_55acafd99436af2011d7d486() {
  return __cxx_static_address_55acafd99436af2011d7d486.reference || (__cxx_static_address_55acafd99436af2011d7d486.reference = {
    __cReference: true,
    get value() { return MV_NumberOfBuffers; },
    set value(__cxx_lvalue_0) { MV_NumberOfBuffers = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/audiolib/src/multivoc.cpp:73
export let MV_MaxVoices = i32(1);
export function __cxx_global_cell_671d938a8da950fac64efbdb() {
  return __cxx_global_cell_671d938a8da950fac64efbdb.reference || (__cxx_global_cell_671d938a8da950fac64efbdb.reference = {
    __cReference: true,
    get value() { return MV_MaxVoices; },
    set value(__cxx_lvalue_0) { MV_MaxVoices = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/audiolib/src/multivoc.cpp:74
export let MV_Channels = i32(1);
export function __cxx_global_cell_9eef96950efe01b75b43b902() {
  return __cxx_global_cell_9eef96950efe01b75b43b902.reference || (__cxx_global_cell_9eef96950efe01b75b43b902.reference = {
    __cReference: true,
    get value() { return MV_Channels; },
    set value(__cxx_lvalue_0) { MV_Channels = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/audiolib/src/multivoc.cpp:75
export let MV_MixRate = 0;
export function __cxx_global_cell_60c5e8a990104b93db1b82e7() {
  return __cxx_global_cell_60c5e8a990104b93db1b82e7.reference || (__cxx_global_cell_60c5e8a990104b93db1b82e7.reference = {
    __cReference: true,
    get value() { return MV_MixRate; },
    set value(__cxx_lvalue_0) { MV_MixRate = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/audiolib/src/multivoc.cpp:76
export let MV_InitDataPtr = null;
export function __cxx_global_cell_df3169c392bf05de38bfe108() {
  return __cxx_global_cell_df3169c392bf05de38bfe108.reference || (__cxx_global_cell_df3169c392bf05de38bfe108.reference = {
    __cReference: true,
    get value() { return MV_InitDataPtr; },
    set value(__cxx_lvalue_0) { MV_InitDataPtr = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/audiolib/src/multivoc.cpp:78
export let MV_LazyAlloc = i32(true);
export function __cxx_global_cell_a041cfaa612703140e111290() {
  return __cxx_global_cell_a041cfaa612703140e111290.reference || (__cxx_global_cell_a041cfaa612703140e111290.reference = {
    __cReference: true,
    get value() { return MV_LazyAlloc; },
    set value(__cxx_lvalue_0) { MV_LazyAlloc = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/audiolib/src/multivoc.cpp:84
export let MV_BufferEmpty = new Int32Array(32);
function __cxx_static_address_58611e27a1da29a5e2cf73ae() {
  return __cxx_static_address_58611e27a1da29a5e2cf73ae.reference || (__cxx_static_address_58611e27a1da29a5e2cf73ae.reference = {
    __cReference: true,
    get value() { return MV_BufferEmpty; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/audiolib/src/multivoc.cpp:85
export let MV_MixBuffer = cPointerArray(65);
function __cxx_static_address_e4e10d857355e6d688b20fac() {
  return __cxx_static_address_e4e10d857355e6d688b20fac.reference || (__cxx_static_address_e4e10d857355e6d688b20fac.reference = {
    __cReference: true,
    get value() { return MV_MixBuffer; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/audiolib/src/multivoc.cpp:87
export let MV_Voices = null;
export function __cxx_global_cell_c913bc40c747f8379816a88e() {
  return __cxx_global_cell_c913bc40c747f8379816a88e.reference || (__cxx_global_cell_c913bc40c747f8379816a88e.reference = {
    __cReference: true,
    get value() { return MV_Voices; },
    set value(__cxx_lvalue_0) { MV_Voices = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/build/include/fix16.h:31
export const FIX16_MAX__header_global_d6a7f09a7fbf5ab2 = i32(2147483647);
function __cxx_static_address_0ef0a0e32da49ada59ee1734() {
  return __cxx_static_address_0ef0a0e32da49ada59ee1734.reference || (__cxx_static_address_0ef0a0e32da49ada59ee1734.reference = {
    __cReference: true,
    get value() { return FIX16_MAX__header_global_d6a7f09a7fbf5ab2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:32
export const FIX16_MIN__header_global_2dab9d3c1b46b3d6 = i32(2147483648);
function __cxx_static_address_aaa80cb1d9bc2c219db46955() {
  return __cxx_static_address_aaa80cb1d9bc2c219db46955.reference || (__cxx_static_address_aaa80cb1d9bc2c219db46955.reference = {
    __cReference: true,
    get value() { return FIX16_MIN__header_global_2dab9d3c1b46b3d6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:33
export const FIX16_OVERFLOW__header_global_c8e9504c5fdd6057 = i32(2147483648);
function __cxx_static_address_6531ee937f0004ee9305e85a() {
  return __cxx_static_address_6531ee937f0004ee9305e85a.reference || (__cxx_static_address_6531ee937f0004ee9305e85a.reference = {
    __cReference: true,
    get value() { return FIX16_OVERFLOW__header_global_c8e9504c5fdd6057; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:35
export const fix16_one__header_global_4893317b55fdd91c = i32(65536);
function __cxx_static_address_e28eaf10de1e1605ef80a958() {
  return __cxx_static_address_e28eaf10de1e1605ef80a958.reference || (__cxx_static_address_e28eaf10de1e1605ef80a958.reference = {
    __cReference: true,
    get value() { return fix16_one__header_global_4893317b55fdd91c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:36
export const fix16_half__header_global_56990b17be0360a2 = i32(32768);
function __cxx_static_address_41ab4f9cd50d845806bbad11() {
  return __cxx_static_address_41ab4f9cd50d845806bbad11.reference || (__cxx_static_address_41ab4f9cd50d845806bbad11.reference = {
    __cReference: true,
    get value() { return fix16_half__header_global_56990b17be0360a2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:37
export const flt_f161r__header_global_3a1df6c21418345f = Math.fround(Math.fround((Math.fround(1) / Math.fround(65536))));
function __cxx_static_address_4122146f83801b3bd31a648d() {
  return __cxx_static_address_4122146f83801b3bd31a648d.reference || (__cxx_static_address_4122146f83801b3bd31a648d.reference = {
    __cReference: true,
    get value() { return flt_f161r__header_global_3a1df6c21418345f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/audiolib/src/multivoc.cpp:91
export let MV_MixPage = 0;
function __cxx_static_address_8733c2c3c2373c35c3f26ae4() {
  return __cxx_static_address_8733c2c3c2373c35c3f26ae4.reference || (__cxx_static_address_8733c2c3c2373c35c3f26ae4.reference = {
    __cReference: true,
    get value() { return MV_MixPage; },
    set value(__cxx_lvalue_0) { MV_MixPage = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/audiolib/src/multivoc.cpp:93
export let MV_CallBackFunc = null;
function __cxx_static_address_2e18f8fee903270951f3aeaf() {
  return __cxx_static_address_2e18f8fee903270951f3aeaf.reference || (__cxx_static_address_2e18f8fee903270951f3aeaf.reference = {
    __cReference: true,
    get value() { return MV_CallBackFunc; },
    set value(__cxx_lvalue_0) { MV_CallBackFunc = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/audiolib/src/multivoc.cpp:95
export let MV_MixDestination = null;
export function __cxx_global_cell_1e2fc3d4b9ce0dbbe47b0ceb() {
  return __cxx_global_cell_1e2fc3d4b9ce0dbbe47b0ceb.reference || (__cxx_global_cell_1e2fc3d4b9ce0dbbe47b0ceb.reference = {
    __cReference: true,
    get value() { return MV_MixDestination; },
    set value(__cxx_lvalue_0) { MV_MixDestination = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/audiolib/src/multivoc.cpp:96
export let MV_SampleSize = i32(1);
export function __cxx_global_cell_f26f74aea0df8d9a78820661() {
  return __cxx_global_cell_f26f74aea0df8d9a78820661.reference || (__cxx_global_cell_f26f74aea0df8d9a78820661.reference = {
    __cReference: true,
    get value() { return MV_SampleSize; },
    set value(__cxx_lvalue_0) { MV_SampleSize = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/audiolib/src/multivoc.cpp:97
export let MV_RightChannelOffset = 0;
export function __cxx_global_cell_ca9f4f046a4443694bc8a5a4() {
  return __cxx_global_cell_ca9f4f046a4443694bc8a5a4.reference || (__cxx_global_cell_ca9f4f046a4443694bc8a5a4.reference = {
    __cReference: true,
    get value() { return MV_RightChannelOffset; },
    set value(__cxx_lvalue_0) { MV_RightChannelOffset = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/audiolib/src/multivoc.cpp:99
export let MV_ErrorCode = i32(1);
export function __cxx_global_cell_8a37c6e6dc891d5eba65e067() {
  return __cxx_global_cell_8a37c6e6dc891d5eba65e067.reference || (__cxx_global_cell_8a37c6e6dc891d5eba65e067.reference = {
    __cReference: true,
    get value() { return MV_ErrorCode; },
    set value(__cxx_lvalue_0) { MV_ErrorCode = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/audiolib/src/multivoc.cpp:101
export let MV_GlobalVolume = i32(fix16_one__header_global_4893317b55fdd91c);
export function __cxx_global_cell_f6503dd2f9475abde00d5b1a() {
  return __cxx_global_cell_f6503dd2f9475abde00d5b1a.reference || (__cxx_global_cell_f6503dd2f9475abde00d5b1a.reference = {
    __cReference: true,
    get value() { return MV_GlobalVolume; },
    set value(__cxx_lvalue_0) { MV_GlobalVolume = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/audiolib/src/multivoc.cpp:102
export let MV_VolumeSmoothFactor = i32(fix16_one__header_global_4893317b55fdd91c);
export function __cxx_global_cell_d948bcfdda67a38fb8a65e07() {
  return __cxx_global_cell_d948bcfdda67a38fb8a65e07.reference || (__cxx_global_cell_d948bcfdda67a38fb8a65e07.reference = {
    __cReference: true,
    get value() { return MV_VolumeSmoothFactor; },
    set value(__cxx_lvalue_0) { MV_VolumeSmoothFactor = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/audiolib/src/multivoc.cpp:104
export let MV_Locked = 0;
export function __cxx_global_cell_863e87c70fe831130f94a0ec() {
  return __cxx_global_cell_863e87c70fe831130f94a0ec.reference || (__cxx_global_cell_863e87c70fe831130f94a0ec.reference = {
    __cReference: true,
    get value() { return MV_Locked; },
    set value(__cxx_lvalue_0) { MV_Locked = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/audiolib/src/multivoc.cpp:105
export let MV_MusicBuffer = null;
export function __cxx_global_cell_4031867f2af48f5f8b7065db() {
  return __cxx_global_cell_4031867f2af48f5f8b7065db.reference || (__cxx_global_cell_4031867f2af48f5f8b7065db.reference = {
    __cReference: true,
    get value() { return MV_MusicBuffer; },
    set value(__cxx_lvalue_0) { MV_MusicBuffer = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/audiolib/src/multivoc.cpp:106
export let MV_MusicCallback = null;
function __cxx_static_address_366786f45d5ff50d78e1793b() {
  return __cxx_static_address_366786f45d5ff50d78e1793b.reference || (__cxx_static_address_366786f45d5ff50d78e1793b.reference = {
    __cReference: true,
    get value() { return MV_MusicCallback; },
    set value(__cxx_lvalue_0) { MV_MusicCallback = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/audiolib/src/multivoc.cpp:108
export let MV_Handles = null;
function __cxx_static_address_911f7673d7a76103f5901064() {
  return __cxx_static_address_911f7673d7a76103f5901064.reference || (__cxx_static_address_911f7673d7a76103f5901064.reference = {
    __cReference: true,
    get value() { return MV_Handles; },
    set value(__cxx_lvalue_0) { MV_Handles = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/audiolib/src/multivoc.cpp:376
export function MV_VoicePlaying(handle) {
  (handle <= MV_MaxVoices);
  let voice = (cPointerElementRef(MV_Handles, i32((handle - 1))).value);
  return i32(((Boolean(MV_Installed) && cPointerCompare(voice, null, "!=")) && (!Boolean(cRecordObject(voice).Paused.load(0)))));
}

// C/C++ source: source/audiolib/src/multivoc.cpp:749
export function MV_GetMaxReverbDelay() {
  return i32(Math.imul(256, MV_NumberOfBuffers));
}

// C/C++ source: source/audiolib/src/multivoc.cpp:807
export function MV_CalcPanTable() {
  let HalfAngle = i32(Math.trunc(i32((127 + 1)) / 2));
  let QuarterAngle = i32(Math.trunc(HalfAngle / 2));
  for (let distance = i32(0); (distance <= 127); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => distance, __cxx_lvalue_1 => { distance = __cxx_lvalue_1; }))) {
    let level = i32(Math.trunc(i32(Math.imul(255, i32((127 - distance)))) / 127));
    for (let angle = i32(0); (angle <= QuarterAngle); ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i32((previous + 1)); __cxx_lvalue_2.value = next; return previous; })(cRef(() => angle, __cxx_lvalue_3 => { angle = __cxx_lvalue_3; }))) {
      let ramp = i32((level - Math.trunc(i32(Math.imul(level, angle)) / QuarterAngle)));
      ((cPointerElementRef(MV_PanTable, angle).value)[distance].left = ((((ramp) & 255)) & 255));
      ((cPointerElementRef(MV_PanTable, angle).value)[distance].right = ((((level) & 255)) & 255));
      ((cPointerElementRef(MV_PanTable, i32((HalfAngle - angle))).value)[distance].left = ((((ramp) & 255)) & 255));
      ((cPointerElementRef(MV_PanTable, i32((HalfAngle - angle))).value)[distance].right = ((((level) & 255)) & 255));
      ((cPointerElementRef(MV_PanTable, i32((HalfAngle + angle))).value)[distance].left = ((((level) & 255)) & 255));
      ((cPointerElementRef(MV_PanTable, i32((HalfAngle + angle))).value)[distance].right = ((((ramp) & 255)) & 255));
      ((cPointerElementRef(MV_PanTable, i32((127 - angle))).value)[distance].left = ((((level) & 255)) & 255));
      ((cPointerElementRef(MV_PanTable, i32((127 - angle))).value)[distance].right = ((((ramp) & 255)) & 255));
    }
  }
}

// C/C++ source: source/audiolib/src/multivoc.cpp:839
export function MV_SetCallBack(__cxx_function) {
  (MV_CallBackFunc = __cxx_function);
}

// C/C++ source: source/audiolib/src/multivoc.cpp:984
export const loopStartTags = cPointerArray(3, [Uint8Array.from([76, 79, 79, 80, 95, 83, 84, 65, 82, 84, 0]), Uint8Array.from([76, 79, 79, 80, 83, 84, 65, 82, 84, 0]), Uint8Array.from([76, 79, 79, 80, 0])]);
function __cxx_static_address_466807229ebfb926479b6f8c() {
  return __cxx_static_address_466807229ebfb926479b6f8c.reference || (__cxx_static_address_466807229ebfb926479b6f8c.reference = {
    __cReference: true,
    get value() { return loopStartTags; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/audiolib/src/multivoc.cpp:985
export const loopEndTags = cPointerArray(2, [Uint8Array.from([76, 79, 79, 80, 95, 69, 78, 68, 0]), Uint8Array.from([76, 79, 79, 80, 69, 78, 68, 0])]);
function __cxx_static_address_e3c88f2290e83973dece66b3() {
  return __cxx_static_address_e3c88f2290e83973dece66b3.reference || (__cxx_static_address_e3c88f2290e83973dece66b3.reference = {
    __cReference: true,
    get value() { return loopEndTags; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/audiolib/src/multivoc.cpp:986
export const loopLengthTags = cPointerArray(2, [Uint8Array.from([76, 79, 79, 80, 95, 76, 69, 78, 71, 84, 72, 0]), Uint8Array.from([76, 79, 79, 80, 76, 69, 78, 71, 84, 72, 0])]);
function __cxx_static_address_d2cdf47c4d313c2930524e0f() {
  return __cxx_static_address_d2cdf47c4d313c2930524e0f.reference || (__cxx_static_address_d2cdf47c4d313c2930524e0f.reference = {
    __cReference: true,
    get value() { return loopLengthTags; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/compat.h:1169
export const pow2char__header_global_8b3bff012745dc91 = new Uint8Array([((1) & 255), ((2) & 255), ((4) & 255), ((8) & 255), ((16) & 255), ((32) & 255), ((64) & 255), ((128) & 255)]);
function __cxx_static_address_d10b72d37635b704af22c0dd() {
  return __cxx_static_address_d10b72d37635b704af22c0dd.reference || (__cxx_static_address_d10b72d37635b704af22c0dd.reference = {
    __cReference: true,
    get value() { return pow2char__header_global_8b3bff012745dc91; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:172
export const g_defaultVideoModes__header_global_b94e26943c736430 = [cMarkAggregate(({"x": 2560, "y": 1440})), cMarkAggregate(({"x": 2560, "y": 1200})), cMarkAggregate(({"x": 2560, "y": 1080})), cMarkAggregate(({"x": 1920, "y": 1440})), cMarkAggregate(({"x": 1920, "y": 1200})), cMarkAggregate(({"x": 1920, "y": 1080})), cMarkAggregate(({"x": 1680, "y": 1050})), cMarkAggregate(({"x": 1600, "y": 1200})), cMarkAggregate(({"x": 1600, "y": 900})), cMarkAggregate(({"x": 1366, "y": 768})), cMarkAggregate(({"x": 1280, "y": 1024})), cMarkAggregate(({"x": 1280, "y": 960})), cMarkAggregate(({"x": 1280, "y": 720})), cMarkAggregate(({"x": 1152, "y": 864})), cMarkAggregate(({"x": 1024, "y": 768})), cMarkAggregate(({"x": 1024, "y": 600})), cMarkAggregate(({"x": 800, "y": 600})), cMarkAggregate(({"x": 640, "y": 480})), cMarkAggregate(({"x": 640, "y": 400})), cMarkAggregate(({"x": 512, "y": 384})), cMarkAggregate(({"x": 480, "y": 360})), cMarkAggregate(({"x": 400, "y": 300})), cMarkAggregate(({"x": 320, "y": 240})), cMarkAggregate(({"x": 320, "y": 200})), cMarkAggregate(({"x": 0, "y": 0}))];
function __cxx_static_address_e5a83337cb19309d8841b7ca() {
  return __cxx_static_address_e5a83337cb19309d8841b7ca.reference || (__cxx_static_address_e5a83337cb19309d8841b7ca.reference = {
    __cReference: true,
    get value() { return g_defaultVideoModes__header_global_b94e26943c736430; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:188
export const g_keyAsciiTable__header_global_afb0599256b5558e = new Uint8Array([((0) & 255), ((0) & 255), 49, 50, 51, 52, 53, 54, 55, 56, 57, 48, 45, 61, ((0) & 255), ((0) & 255), 113, 119, 101, 114, 116, 121, 117, 105, 111, 112, 91, 93, ((0) & 255), ((0) & 255), 97, 115, 100, 102, 103, 104, 106, 107, 108, 59, ((39) & 255), 96, ((0) & 255), ((92) & 255), 122, 120, 99, 118, 98, 110, 109, 44, 46, 47, ((0) & 255), 42, ((0) & 255), ((32) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), 55, 56, 57, 45, 52, 53, 54, 43, 49, 50, 51, 48, 46, ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255)]);
function __cxx_static_address_350ef9eb8ff01b19a4397e5e() {
  return __cxx_static_address_350ef9eb8ff01b19a4397e5e.reference || (__cxx_static_address_350ef9eb8ff01b19a4397e5e.reference = {
    __cReference: true,
    get value() { return g_keyAsciiTable__header_global_afb0599256b5558e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:196
export const g_keyAsciiTableShift__header_global_2d1dc85e34ff422c = new Uint8Array([((0) & 255), ((0) & 255), 33, 64, 35, 36, 37, 94, 38, 42, 40, 41, 95, 43, ((0) & 255), ((0) & 255), 81, 87, 69, 82, 84, 89, 85, 73, 79, 80, 123, 125, ((0) & 255), ((0) & 255), 65, 83, 68, 70, 71, 72, 74, 75, 76, 58, 34, 126, ((0) & 255), 124, 90, 88, 67, 86, 66, 78, 77, 60, 62, 63, ((0) & 255), 42, ((0) & 255), ((32) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), 55, 56, 57, 45, 52, 53, 54, 43, 49, 50, 51, 48, 46, ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255)]);
function __cxx_static_address_081cebaa696727f43eb6317c() {
  return __cxx_static_address_081cebaa696727f43eb6317c.reference || (__cxx_static_address_081cebaa696727f43eb6317c.reference = {
    __cReference: true,
    get value() { return g_keyAsciiTableShift__header_global_2d1dc85e34ff422c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export function Move__template_45f4f2db05c479ff(node, root) {
  Unlink__template_843de158a7ee4205(node);
  Insert__template_a833a461de94f09a(root, node);
}

export function clamp__header_acff00012631(__cxx_in, min, max) {
  return i32(((__cxx_in <= i32(min)) ? i32(min) : ((__cxx_in >= i32(max)) ? i32(max) : __cxx_in)));
}

// C/C++ source: source/audiolib/src/multivoc.cpp:231
export function MV_SetErrorCode__header_fa0e5b8ad773(status) {
  (MV_ErrorCode = i32(status));
  return i32(-1);
}

export function Empty__template_d798a222b9bae8c7(root) {
  return Boolean((cPointerCompare(cRecordObject(root).next, root, "==") && cPointerCompare(cRecordObject(root).prev, root, "==")));
}

// C/C++ source: source/audiolib/src/multivoc.cpp:136
export function FX_SoundValidAndActive__header_e795b03dc27c(handle) {
  return i32(((handle > 0) && Boolean(MV_VoicePlaying(handle))));
}

export function Remove__template_5d7072c0f1174e54(node) {
  Unlink__template_843de158a7ee4205(node);
  Reset__template_1e74985547608292(node);
}

// C/C++ source: source/audiolib/src/multivoc.cpp:46
export function fix16_from_int__header_f52908b5a6ca(a) {
  return i32(Math.imul(a, fix16_one__header_global_4893317b55fdd91c));
}

// C/C++ source: source/audiolib/src/multivoc.cpp:43
export function fix16_to_float__header_f653a1768490(a) {
  return Math.fround(Math.fround((Math.fround(Math.fround(a)) * flt_f161r__header_global_3a1df6c21418345f)));
}

export function Reset__template_1e74985547608292(node) {
  (cRecordObject(node).next = (cRecordObject(node).prev = node));
}

export function Insert__template_a833a461de94f09a(root, node) {
  (cRecordObject(node).next = root);
  (cRecordObject(node).prev = cRecordObject(root).prev);
  (cRecordObject(cRecordObject(root).prev).next = node);
  (cRecordObject(root).prev = node);
}

// C/C++ source: source/audiolib/src/multivoc.cpp:47
export function fix16_from_float__header_cc2ec3367744(a) {
  return i32(Math.fround((Math.fround((a * Math.fround(fix16_one__header_global_4893317b55fdd91c))) + ((a >= Math.fround(0)) ? Math.fround(0.5) : (-Math.fround(0.5))))));
}

export function Unlink__template_843de158a7ee4205(node) {
  (cRecordObject(cRecordObject(node).prev).next = cRecordObject(node).next);
  (cRecordObject(cRecordObject(node).next).prev = cRecordObject(node).prev);
}

// C/C++ source: source/build/include/smmalloc.h:864
export function _sm_free(allocator, p) {
  return cRecordObject(allocator).Free(p);
}

// C/C++ source: source/build/include/smmalloc.h:859
export function _sm_malloc(allocator, bytesCount, alignment) {
  return cRecordObject(allocator).Alloc(bytesCount, alignment);
}
