// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/audiolib/src/opl3.cpp
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
export const fix16_rad_to_deg_mult__header_global_5dbb50892b788f27 = i32(3754936);
function __cxx_static_address_766684f455c26b3179853e20() {
  return __cxx_static_address_766684f455c26b3179853e20.reference || (__cxx_static_address_766684f455c26b3179853e20.reference = {
    __cReference: true,
    get value() { return fix16_rad_to_deg_mult__header_global_5dbb50892b788f27; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:114
export const fix16_deg_to_rad_mult__header_global_f524a54673b90af3 = i32(1144);
function __cxx_static_address_bd030b0b6e4bf067e8ad2e34() {
  return __cxx_static_address_bd030b0b6e4bf067e8ad2e34.reference || (__cxx_static_address_bd030b0b6e4bf067e8ad2e34.reference = {
    __cReference: true,
    get value() { return fix16_deg_to_rad_mult__header_global_f524a54673b90af3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/audiolib/src/opl3.cpp:79
export const logsinrom = new Uint16Array([((2137) & 65535), ((1731) & 65535), ((1543) & 65535), ((1419) & 65535), ((1326) & 65535), ((1252) & 65535), ((1190) & 65535), ((1137) & 65535), ((1091) & 65535), ((1050) & 65535), ((1013) & 65535), ((979) & 65535), ((949) & 65535), ((920) & 65535), ((894) & 65535), ((869) & 65535), ((846) & 65535), ((825) & 65535), ((804) & 65535), ((785) & 65535), ((767) & 65535), ((749) & 65535), ((732) & 65535), ((717) & 65535), ((701) & 65535), ((687) & 65535), ((672) & 65535), ((659) & 65535), ((646) & 65535), ((633) & 65535), ((621) & 65535), ((609) & 65535), ((598) & 65535), ((587) & 65535), ((576) & 65535), ((566) & 65535), ((556) & 65535), ((546) & 65535), ((536) & 65535), ((527) & 65535), ((518) & 65535), ((509) & 65535), ((501) & 65535), ((492) & 65535), ((484) & 65535), ((476) & 65535), ((468) & 65535), ((461) & 65535), ((453) & 65535), ((446) & 65535), ((439) & 65535), ((432) & 65535), ((425) & 65535), ((418) & 65535), ((411) & 65535), ((405) & 65535), ((399) & 65535), ((392) & 65535), ((386) & 65535), ((380) & 65535), ((375) & 65535), ((369) & 65535), ((363) & 65535), ((358) & 65535), ((352) & 65535), ((347) & 65535), ((341) & 65535), ((336) & 65535), ((331) & 65535), ((326) & 65535), ((321) & 65535), ((316) & 65535), ((311) & 65535), ((307) & 65535), ((302) & 65535), ((297) & 65535), ((293) & 65535), ((289) & 65535), ((284) & 65535), ((280) & 65535), ((276) & 65535), ((271) & 65535), ((267) & 65535), ((263) & 65535), ((259) & 65535), ((255) & 65535), ((251) & 65535), ((248) & 65535), ((244) & 65535), ((240) & 65535), ((236) & 65535), ((233) & 65535), ((229) & 65535), ((226) & 65535), ((222) & 65535), ((219) & 65535), ((215) & 65535), ((212) & 65535), ((209) & 65535), ((205) & 65535), ((202) & 65535), ((199) & 65535), ((196) & 65535), ((193) & 65535), ((190) & 65535), ((187) & 65535), ((184) & 65535), ((181) & 65535), ((178) & 65535), ((175) & 65535), ((172) & 65535), ((169) & 65535), ((167) & 65535), ((164) & 65535), ((161) & 65535), ((159) & 65535), ((156) & 65535), ((153) & 65535), ((151) & 65535), ((148) & 65535), ((146) & 65535), ((143) & 65535), ((141) & 65535), ((138) & 65535), ((136) & 65535), ((134) & 65535), ((131) & 65535), ((129) & 65535), ((127) & 65535), ((125) & 65535), ((122) & 65535), ((120) & 65535), ((118) & 65535), ((116) & 65535), ((114) & 65535), ((112) & 65535), ((110) & 65535), ((108) & 65535), ((106) & 65535), ((104) & 65535), ((102) & 65535), ((100) & 65535), ((98) & 65535), ((96) & 65535), ((94) & 65535), ((92) & 65535), ((91) & 65535), ((89) & 65535), ((87) & 65535), ((85) & 65535), ((83) & 65535), ((82) & 65535), ((80) & 65535), ((78) & 65535), ((77) & 65535), ((75) & 65535), ((74) & 65535), ((72) & 65535), ((70) & 65535), ((69) & 65535), ((67) & 65535), ((66) & 65535), ((64) & 65535), ((63) & 65535), ((62) & 65535), ((60) & 65535), ((59) & 65535), ((57) & 65535), ((56) & 65535), ((55) & 65535), ((53) & 65535), ((52) & 65535), ((51) & 65535), ((49) & 65535), ((48) & 65535), ((47) & 65535), ((46) & 65535), ((45) & 65535), ((43) & 65535), ((42) & 65535), ((41) & 65535), ((40) & 65535), ((39) & 65535), ((38) & 65535), ((37) & 65535), ((36) & 65535), ((35) & 65535), ((34) & 65535), ((33) & 65535), ((32) & 65535), ((31) & 65535), ((30) & 65535), ((29) & 65535), ((28) & 65535), ((27) & 65535), ((26) & 65535), ((25) & 65535), ((24) & 65535), ((23) & 65535), ((23) & 65535), ((22) & 65535), ((21) & 65535), ((20) & 65535), ((20) & 65535), ((19) & 65535), ((18) & 65535), ((17) & 65535), ((17) & 65535), ((16) & 65535), ((15) & 65535), ((15) & 65535), ((14) & 65535), ((13) & 65535), ((13) & 65535), ((12) & 65535), ((12) & 65535), ((11) & 65535), ((10) & 65535), ((10) & 65535), ((9) & 65535), ((9) & 65535), ((8) & 65535), ((8) & 65535), ((7) & 65535), ((7) & 65535), ((7) & 65535), ((6) & 65535), ((6) & 65535), ((5) & 65535), ((5) & 65535), ((5) & 65535), ((4) & 65535), ((4) & 65535), ((4) & 65535), ((3) & 65535), ((3) & 65535), ((3) & 65535), ((2) & 65535), ((2) & 65535), ((2) & 65535), ((2) & 65535), ((1) & 65535), ((1) & 65535), ((1) & 65535), ((1) & 65535), ((1) & 65535), ((1) & 65535), ((1) & 65535), ((0) & 65535), ((0) & 65535), ((0) & 65535), ((0) & 65535), ((0) & 65535), ((0) & 65535), ((0) & 65535), ((0) & 65535)]);
function __cxx_static_address_fd0c2a007a4228e1255f3eeb() {
  return __cxx_static_address_fd0c2a007a4228e1255f3eeb.reference || (__cxx_static_address_fd0c2a007a4228e1255f3eeb.reference = {
    __cReference: true,
    get value() { return logsinrom; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:31
export const FIX16_MAX__header_global_473d38577cc86599 = i32(2147483647);
function __cxx_static_address_b62be424cdc89bc114e36def() {
  return __cxx_static_address_b62be424cdc89bc114e36def.reference || (__cxx_static_address_b62be424cdc89bc114e36def.reference = {
    __cReference: true,
    get value() { return FIX16_MAX__header_global_473d38577cc86599; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:32
export const FIX16_MIN__header_global_51b8d61838dc2e4e = i32(2147483648);
function __cxx_static_address_c8dc54d900af6e4304dfc872() {
  return __cxx_static_address_c8dc54d900af6e4304dfc872.reference || (__cxx_static_address_c8dc54d900af6e4304dfc872.reference = {
    __cReference: true,
    get value() { return FIX16_MIN__header_global_51b8d61838dc2e4e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:33
export const FIX16_OVERFLOW__header_global_b4cae14121f40f03 = i32(2147483648);
function __cxx_static_address_8be613550ab561e3f5dca78d() {
  return __cxx_static_address_8be613550ab561e3f5dca78d.reference || (__cxx_static_address_8be613550ab561e3f5dca78d.reference = {
    __cReference: true,
    get value() { return FIX16_OVERFLOW__header_global_b4cae14121f40f03; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:35
export const fix16_one__header_global_14c3a3be1e87bbfa = i32(65536);
function __cxx_static_address_1824f9b8d9f06588351296fa() {
  return __cxx_static_address_1824f9b8d9f06588351296fa.reference || (__cxx_static_address_1824f9b8d9f06588351296fa.reference = {
    __cReference: true,
    get value() { return fix16_one__header_global_14c3a3be1e87bbfa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:36
export const fix16_half__header_global_7ca5c8773bb2809b = i32(32768);
function __cxx_static_address_d49b5d173aae484516280ac5() {
  return __cxx_static_address_d49b5d173aae484516280ac5.reference || (__cxx_static_address_d49b5d173aae484516280ac5.reference = {
    __cReference: true,
    get value() { return fix16_half__header_global_7ca5c8773bb2809b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:37
export const flt_f161r__header_global_634d03bfc5d917d8 = Math.fround(Math.fround((Math.fround(1) / Math.fround(65536))));
function __cxx_static_address_f69f6d77008e46aaf94dfd7b() {
  return __cxx_static_address_f69f6d77008e46aaf94dfd7b.reference || (__cxx_static_address_f69f6d77008e46aaf94dfd7b.reference = {
    __cReference: true,
    get value() { return flt_f161r__header_global_634d03bfc5d917d8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/audiolib/src/opl3.cpp:118
export const exprom = new Uint16Array([((2042) & 65535), ((2037) & 65535), ((2031) & 65535), ((2026) & 65535), ((2020) & 65535), ((2015) & 65535), ((2010) & 65535), ((2004) & 65535), ((1999) & 65535), ((1993) & 65535), ((1988) & 65535), ((1983) & 65535), ((1977) & 65535), ((1972) & 65535), ((1966) & 65535), ((1961) & 65535), ((1956) & 65535), ((1951) & 65535), ((1945) & 65535), ((1940) & 65535), ((1935) & 65535), ((1930) & 65535), ((1924) & 65535), ((1919) & 65535), ((1914) & 65535), ((1909) & 65535), ((1904) & 65535), ((1898) & 65535), ((1893) & 65535), ((1888) & 65535), ((1883) & 65535), ((1878) & 65535), ((1873) & 65535), ((1868) & 65535), ((1863) & 65535), ((1858) & 65535), ((1853) & 65535), ((1848) & 65535), ((1843) & 65535), ((1838) & 65535), ((1833) & 65535), ((1828) & 65535), ((1823) & 65535), ((1818) & 65535), ((1813) & 65535), ((1808) & 65535), ((1803) & 65535), ((1798) & 65535), ((1794) & 65535), ((1789) & 65535), ((1784) & 65535), ((1779) & 65535), ((1774) & 65535), ((1769) & 65535), ((1765) & 65535), ((1760) & 65535), ((1755) & 65535), ((1750) & 65535), ((1746) & 65535), ((1741) & 65535), ((1736) & 65535), ((1732) & 65535), ((1727) & 65535), ((1722) & 65535), ((1717) & 65535), ((1713) & 65535), ((1708) & 65535), ((1704) & 65535), ((1699) & 65535), ((1694) & 65535), ((1690) & 65535), ((1685) & 65535), ((1681) & 65535), ((1676) & 65535), ((1672) & 65535), ((1667) & 65535), ((1663) & 65535), ((1658) & 65535), ((1654) & 65535), ((1649) & 65535), ((1645) & 65535), ((1640) & 65535), ((1636) & 65535), ((1631) & 65535), ((1627) & 65535), ((1623) & 65535), ((1618) & 65535), ((1614) & 65535), ((1609) & 65535), ((1605) & 65535), ((1601) & 65535), ((1596) & 65535), ((1592) & 65535), ((1588) & 65535), ((1584) & 65535), ((1579) & 65535), ((1575) & 65535), ((1571) & 65535), ((1566) & 65535), ((1562) & 65535), ((1558) & 65535), ((1554) & 65535), ((1550) & 65535), ((1545) & 65535), ((1541) & 65535), ((1537) & 65535), ((1533) & 65535), ((1529) & 65535), ((1525) & 65535), ((1520) & 65535), ((1516) & 65535), ((1512) & 65535), ((1508) & 65535), ((1504) & 65535), ((1500) & 65535), ((1496) & 65535), ((1492) & 65535), ((1488) & 65535), ((1484) & 65535), ((1480) & 65535), ((1476) & 65535), ((1472) & 65535), ((1468) & 65535), ((1464) & 65535), ((1460) & 65535), ((1456) & 65535), ((1452) & 65535), ((1448) & 65535), ((1444) & 65535), ((1440) & 65535), ((1436) & 65535), ((1433) & 65535), ((1429) & 65535), ((1425) & 65535), ((1421) & 65535), ((1417) & 65535), ((1413) & 65535), ((1409) & 65535), ((1406) & 65535), ((1402) & 65535), ((1398) & 65535), ((1394) & 65535), ((1391) & 65535), ((1387) & 65535), ((1383) & 65535), ((1379) & 65535), ((1376) & 65535), ((1372) & 65535), ((1368) & 65535), ((1364) & 65535), ((1361) & 65535), ((1357) & 65535), ((1353) & 65535), ((1350) & 65535), ((1346) & 65535), ((1342) & 65535), ((1339) & 65535), ((1335) & 65535), ((1332) & 65535), ((1328) & 65535), ((1324) & 65535), ((1321) & 65535), ((1317) & 65535), ((1314) & 65535), ((1310) & 65535), ((1307) & 65535), ((1303) & 65535), ((1300) & 65535), ((1296) & 65535), ((1292) & 65535), ((1289) & 65535), ((1286) & 65535), ((1282) & 65535), ((1279) & 65535), ((1275) & 65535), ((1272) & 65535), ((1268) & 65535), ((1265) & 65535), ((1261) & 65535), ((1258) & 65535), ((1255) & 65535), ((1251) & 65535), ((1248) & 65535), ((1244) & 65535), ((1241) & 65535), ((1238) & 65535), ((1234) & 65535), ((1231) & 65535), ((1228) & 65535), ((1224) & 65535), ((1221) & 65535), ((1218) & 65535), ((1214) & 65535), ((1211) & 65535), ((1208) & 65535), ((1205) & 65535), ((1201) & 65535), ((1198) & 65535), ((1195) & 65535), ((1192) & 65535), ((1188) & 65535), ((1185) & 65535), ((1182) & 65535), ((1179) & 65535), ((1176) & 65535), ((1172) & 65535), ((1169) & 65535), ((1166) & 65535), ((1163) & 65535), ((1160) & 65535), ((1157) & 65535), ((1154) & 65535), ((1150) & 65535), ((1147) & 65535), ((1144) & 65535), ((1141) & 65535), ((1138) & 65535), ((1135) & 65535), ((1132) & 65535), ((1129) & 65535), ((1126) & 65535), ((1123) & 65535), ((1120) & 65535), ((1117) & 65535), ((1114) & 65535), ((1111) & 65535), ((1108) & 65535), ((1105) & 65535), ((1102) & 65535), ((1099) & 65535), ((1096) & 65535), ((1093) & 65535), ((1090) & 65535), ((1087) & 65535), ((1084) & 65535), ((1081) & 65535), ((1078) & 65535), ((1075) & 65535), ((1072) & 65535), ((1069) & 65535), ((1066) & 65535), ((1064) & 65535), ((1061) & 65535), ((1058) & 65535), ((1055) & 65535), ((1052) & 65535), ((1049) & 65535), ((1046) & 65535), ((1044) & 65535), ((1041) & 65535), ((1038) & 65535), ((1035) & 65535), ((1032) & 65535), ((1030) & 65535), ((1027) & 65535), ((1024) & 65535)]);
function __cxx_static_address_a0ea971d3025717ac838039a() {
  return __cxx_static_address_a0ea971d3025717ac838039a.reference || (__cxx_static_address_a0ea971d3025717ac838039a.reference = {
    __cReference: true,
    get value() { return exprom; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/audiolib/src/opl3.cpp:159
export const mt = new Uint8Array([((1) & 255), ((2) & 255), ((4) & 255), ((6) & 255), ((8) & 255), ((10) & 255), ((12) & 255), ((14) & 255), ((16) & 255), ((18) & 255), ((20) & 255), ((20) & 255), ((24) & 255), ((24) & 255), ((30) & 255), ((30) & 255)]);
function __cxx_static_address_230baee2b01db8aeea3171c9() {
  return __cxx_static_address_230baee2b01db8aeea3171c9.reference || (__cxx_static_address_230baee2b01db8aeea3171c9.reference = {
    __cReference: true,
    get value() { return mt; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/audiolib/src/opl3.cpp:167
export const kslrom = new Uint8Array([((0) & 255), ((32) & 255), ((40) & 255), ((45) & 255), ((48) & 255), ((51) & 255), ((53) & 255), ((55) & 255), ((56) & 255), ((58) & 255), ((59) & 255), ((60) & 255), ((61) & 255), ((62) & 255), ((63) & 255), ((64) & 255)]);
function __cxx_static_address_6e9695e959933c4ab53a5567() {
  return __cxx_static_address_6e9695e959933c4ab53a5567.reference || (__cxx_static_address_6e9695e959933c4ab53a5567.reference = {
    __cReference: true,
    get value() { return kslrom; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/audiolib/src/opl3.cpp:171
export const kslshift = new Uint8Array([((8) & 255), ((1) & 255), ((2) & 255), ((0) & 255)]);
function __cxx_static_address_91ac099fb2729948a70b7c26() {
  return __cxx_static_address_91ac099fb2729948a70b7c26.reference || (__cxx_static_address_91ac099fb2729948a70b7c26.reference = {
    __cReference: true,
    get value() { return kslshift; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/audiolib/src/opl3.cpp:179
export const eg_incstep = [new Uint8Array([((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255)]), new Uint8Array([((1) & 255), ((0) & 255), ((0) & 255), ((0) & 255)]), new Uint8Array([((1) & 255), ((0) & 255), ((1) & 255), ((0) & 255)]), new Uint8Array([((1) & 255), ((1) & 255), ((1) & 255), ((0) & 255)])];
function __cxx_static_address_d246a928fc8acfbd4b9aae31() {
  return __cxx_static_address_d246a928fc8acfbd4b9aae31.reference || (__cxx_static_address_d246a928fc8acfbd4b9aae31.reference = {
    __cReference: true,
    get value() { return eg_incstep; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/audiolib/src/opl3.cpp:190
export const ad_slot = new Int8Array([(((0) << 24) >> 24), (((1) << 24) >> 24), (((2) << 24) >> 24), (((3) << 24) >> 24), (((4) << 24) >> 24), (((5) << 24) >> 24), ((((-1)) << 24) >> 24), ((((-1)) << 24) >> 24), (((6) << 24) >> 24), (((7) << 24) >> 24), (((8) << 24) >> 24), (((9) << 24) >> 24), (((10) << 24) >> 24), (((11) << 24) >> 24), ((((-1)) << 24) >> 24), ((((-1)) << 24) >> 24), (((12) << 24) >> 24), (((13) << 24) >> 24), (((14) << 24) >> 24), (((15) << 24) >> 24), (((16) << 24) >> 24), (((17) << 24) >> 24), ((((-1)) << 24) >> 24), ((((-1)) << 24) >> 24), ((((-1)) << 24) >> 24), ((((-1)) << 24) >> 24), ((((-1)) << 24) >> 24), ((((-1)) << 24) >> 24), ((((-1)) << 24) >> 24), ((((-1)) << 24) >> 24), ((((-1)) << 24) >> 24), ((((-1)) << 24) >> 24)]);
function __cxx_static_address_2e2053015168909bc79e2035() {
  return __cxx_static_address_2e2053015168909bc79e2035.reference || (__cxx_static_address_2e2053015168909bc79e2035.reference = {
    __cReference: true,
    get value() { return ad_slot; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/audiolib/src/opl3.cpp:195
export const ch_slot = new Uint8Array([((0) & 255), ((1) & 255), ((2) & 255), ((6) & 255), ((7) & 255), ((8) & 255), ((12) & 255), ((13) & 255), ((14) & 255), ((18) & 255), ((19) & 255), ((20) & 255), ((24) & 255), ((25) & 255), ((26) & 255), ((30) & 255), ((31) & 255), ((32) & 255)]);
function __cxx_static_address_7daefb98ce5f50faf094589c() {
  return __cxx_static_address_7daefb98ce5f50faf094589c.reference || (__cxx_static_address_7daefb98ce5f50faf094589c.reference = {
    __cReference: true,
    get value() { return ch_slot; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/audiolib/src/opl3.cpp:204
export let panpot_lut = new Int32Array(256);
function __cxx_static_address_6dbaef78d47ba090bb7fd6c4() {
  return __cxx_static_address_6dbaef78d47ba090bb7fd6c4.reference || (__cxx_static_address_6dbaef78d47ba090bb7fd6c4.reference = {
    __cReference: true,
    get value() { return panpot_lut; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/audiolib/src/opl3.cpp:205
export let panpot_lut_build = ((((0) & 255)) & 255);
function __cxx_static_address_7c36bb08b4f8cd88aaa1995f() {
  return __cxx_static_address_7c36bb08b4f8cd88aaa1995f.reference || (__cxx_static_address_7c36bb08b4f8cd88aaa1995f.reference = {
    __cReference: true,
    get value() { return panpot_lut_build; },
    set value(__cxx_lvalue_0) { panpot_lut_build = ((__cxx_lvalue_0) & 255); }
  });
}

// C/C++ source: source/audiolib/src/opl3.cpp:215
export function OPL3_EnvelopeCalcExp(level) {
  if ((level > u32(8191))) {
    (level = u32(8191));
  }
  return ((((((i32((i32((i32((cDeref(cPointerOffset(exprom, u32((level & 255)), Uint16Array.BYTES_PER_ELEMENT), Uint16Array).value)) << 1)) >> (level >>> 8)))) << 16) >> 16)) << 16) >> 16);
}

// C/C++ source: source/audiolib/src/opl3.cpp:224
export function OPL3_EnvelopeCalcSin0(phase, envelope) {
  let out = ((((0) & 65535)) & 65535);
  let neg = ((((0) & 65535)) & 65535);
  (phase = (((phase & 1023)) & 65535));
  if (Boolean(i32((i32(phase) & 512)))) {
    (neg = ((((65535) & 65535)) & 65535));
  }
  if (Boolean(i32((i32(phase) & 256)))) {
    (out = (((cDeref(cPointerOffset(logsinrom, u32((u32((u32(phase) & 255)) ^ 255)), Uint16Array.BYTES_PER_ELEMENT), Uint16Array).value)) & 65535));
  } else {
    (out = (((cDeref(cPointerOffset(logsinrom, u32((u32(phase) & 255)), Uint16Array.BYTES_PER_ELEMENT), Uint16Array).value)) & 65535));
  }
  return ((((((i32((i32(OPL3_EnvelopeCalcExp(u32(i32((i32(out) + i32((i32(envelope) << 3))))))) ^ i32(neg)))) << 16) >> 16)) << 16) >> 16);
}

// C/C++ source: source/audiolib/src/opl3.cpp:244
export function OPL3_EnvelopeCalcSin1(phase, envelope) {
  let out = ((((0) & 65535)) & 65535);
  (phase = (((phase & 1023)) & 65535));
  if (Boolean(i32((i32(phase) & 512)))) {
    (out = ((((4096) & 65535)) & 65535));
  } else {
    if (Boolean(i32((i32(phase) & 256)))) {
      (out = (((cDeref(cPointerOffset(logsinrom, u32((u32((u32(phase) & 255)) ^ 255)), Uint16Array.BYTES_PER_ELEMENT), Uint16Array).value)) & 65535));
    } else {
      (out = (((cDeref(cPointerOffset(logsinrom, u32((u32(phase) & 255)), Uint16Array.BYTES_PER_ELEMENT), Uint16Array).value)) & 65535));
    }
  }
  return (((OPL3_EnvelopeCalcExp(u32(i32((i32(out) + i32((i32(envelope) << 3))))))) << 16) >> 16);
}

// C/C++ source: source/audiolib/src/opl3.cpp:263
export function OPL3_EnvelopeCalcSin2(phase, envelope) {
  let out = ((((0) & 65535)) & 65535);
  (phase = (((phase & 1023)) & 65535));
  if (Boolean(i32((i32(phase) & 256)))) {
    (out = (((cDeref(cPointerOffset(logsinrom, u32((u32((u32(phase) & 255)) ^ 255)), Uint16Array.BYTES_PER_ELEMENT), Uint16Array).value)) & 65535));
  } else {
    (out = (((cDeref(cPointerOffset(logsinrom, u32((u32(phase) & 255)), Uint16Array.BYTES_PER_ELEMENT), Uint16Array).value)) & 65535));
  }
  return (((OPL3_EnvelopeCalcExp(u32(i32((i32(out) + i32((i32(envelope) << 3))))))) << 16) >> 16);
}

// C/C++ source: source/audiolib/src/opl3.cpp:278
export function OPL3_EnvelopeCalcSin3(phase, envelope) {
  let out = ((((0) & 65535)) & 65535);
  (phase = (((phase & 1023)) & 65535));
  if (Boolean(i32((i32(phase) & 256)))) {
    (out = ((((4096) & 65535)) & 65535));
  } else {
    (out = (((cDeref(cPointerOffset(logsinrom, u32((u32(phase) & 255)), Uint16Array.BYTES_PER_ELEMENT), Uint16Array).value)) & 65535));
  }
  return (((OPL3_EnvelopeCalcExp(u32(i32((i32(out) + i32((i32(envelope) << 3))))))) << 16) >> 16);
}

// C/C++ source: source/audiolib/src/opl3.cpp:293
export function OPL3_EnvelopeCalcSin4(phase, envelope) {
  let out = ((((0) & 65535)) & 65535);
  let neg = ((((0) & 65535)) & 65535);
  (phase = (((phase & 1023)) & 65535));
  if ((i32((i32(phase) & 768)) == 256)) {
    (neg = ((((65535) & 65535)) & 65535));
  }
  if (Boolean(i32((i32(phase) & 512)))) {
    (out = ((((4096) & 65535)) & 65535));
  } else {
    if (Boolean(i32((i32(phase) & 128)))) {
      (out = (((cDeref(cPointerOffset(logsinrom, u32((u32((u32((u32(phase) ^ 255)) << 1)) & 255)), Uint16Array.BYTES_PER_ELEMENT), Uint16Array).value)) & 65535));
    } else {
      (out = (((cDeref(cPointerOffset(logsinrom, u32((u32(i32((i32(phase) << 1))) & 255)), Uint16Array.BYTES_PER_ELEMENT), Uint16Array).value)) & 65535));
    }
  }
  return ((((((i32((i32(OPL3_EnvelopeCalcExp(u32(i32((i32(out) + i32((i32(envelope) << 3))))))) ^ i32(neg)))) << 16) >> 16)) << 16) >> 16);
}

// C/C++ source: source/audiolib/src/opl3.cpp:317
export function OPL3_EnvelopeCalcSin5(phase, envelope) {
  let out = ((((0) & 65535)) & 65535);
  (phase = (((phase & 1023)) & 65535));
  if (Boolean(i32((i32(phase) & 512)))) {
    (out = ((((4096) & 65535)) & 65535));
  } else {
    if (Boolean(i32((i32(phase) & 128)))) {
      (out = (((cDeref(cPointerOffset(logsinrom, u32((u32((u32((u32(phase) ^ 255)) << 1)) & 255)), Uint16Array.BYTES_PER_ELEMENT), Uint16Array).value)) & 65535));
    } else {
      (out = (((cDeref(cPointerOffset(logsinrom, u32((u32(i32((i32(phase) << 1))) & 255)), Uint16Array.BYTES_PER_ELEMENT), Uint16Array).value)) & 65535));
    }
  }
  return (((OPL3_EnvelopeCalcExp(u32(i32((i32(out) + i32((i32(envelope) << 3))))))) << 16) >> 16);
}

// C/C++ source: source/audiolib/src/opl3.cpp:336
export function OPL3_EnvelopeCalcSin6(phase, envelope) {
  let neg = ((((0) & 65535)) & 65535);
  (phase = (((phase & 1023)) & 65535));
  if (Boolean(i32((i32(phase) & 512)))) {
    (neg = ((((65535) & 65535)) & 65535));
  }
  return ((((((i32((i32(OPL3_EnvelopeCalcExp(u32(i32((i32(envelope) << 3))))) ^ i32(neg)))) << 16) >> 16)) << 16) >> 16);
}

// C/C++ source: source/audiolib/src/opl3.cpp:347
export function OPL3_EnvelopeCalcSin7(phase, envelope) {
  let out = ((((0) & 65535)) & 65535);
  let neg = ((((0) & 65535)) & 65535);
  (phase = (((phase & 1023)) & 65535));
  if (Boolean(i32((i32(phase) & 512)))) {
    (neg = ((((65535) & 65535)) & 65535));
    (phase = ((((i32((i32((i32(phase) & 511)) ^ 511))) & 65535)) & 65535));
  }
  (out = ((((i32((i32(phase) << 3))) & 65535)) & 65535));
  return ((((((i32((i32(OPL3_EnvelopeCalcExp(u32(i32((i32(out) + i32((i32(envelope) << 3))))))) ^ i32(neg)))) << 16) >> 16)) << 16) >> 16);
}

// C/C++ source: source/audiolib/src/opl3.cpp:361
export const envelope_sin = cPointerArray(8, [OPL3_EnvelopeCalcSin0, OPL3_EnvelopeCalcSin1, OPL3_EnvelopeCalcSin2, OPL3_EnvelopeCalcSin3, OPL3_EnvelopeCalcSin4, OPL3_EnvelopeCalcSin5, OPL3_EnvelopeCalcSin6, OPL3_EnvelopeCalcSin7]);
function __cxx_static_address_782f2db182892127f71e22f2() {
  return __cxx_static_address_782f2db182892127f71e22f2.reference || (__cxx_static_address_782f2db182892127f71e22f2.reference = {
    __cReference: true,
    get value() { return envelope_sin; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/audiolib/src/opl3.cpp:380
export function OPL3_EnvelopeUpdateKSL(slot) {
  let ksl = ((((((i32((i32((i32((cDeref(cPointerOffset(kslrom, i32((i32(cRecordObject(cRecordObject(slot).channel).f_num) >> 6)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) << 2)) - i32((i32((8 - i32(cRecordObject(cRecordObject(slot).channel).block))) << 5))))) << 16) >> 16)) << 16) >> 16);
  if ((i32(ksl) < 0)) {
    (ksl = ((((((0) << 16) >> 16)) << 16) >> 16));
  }
  (cRecordObject(slot).eg_ksl = ((((((ksl) & 255)) & 255)) & 255));
}

// C/C++ source: source/audiolib/src/opl3.cpp:391
export function OPL3_EnvelopeCalc(slot) {
  let nonzero;
  let rate;
  let rate_hi;
  let rate_lo;
  let reg_rate = ((((0) & 255)) & 255);
  let ks;
  let eg_shift;
  let shift;
  let eg_rout;
  let eg_inc;
  let eg_off;
  let reset = ((((0) & 255)) & 255);
  (cRecordObject(slot).eg_out = ((((i32((i32((i32((i32(cRecordObject(slot).eg_rout) + i32((i32(cRecordObject(slot).reg_tl) << 2)))) + i32((i32(cRecordObject(slot).eg_ksl) >> i32((cDeref(cPointerOffset(kslshift, cRecordObject(slot).reg_ksl, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))))) + i32((cDeref(cRecordObject(slot).trem, Uint8Array).value))))) & 65535)) & 65535));
  if ((Boolean(cRecordObject(slot).key) && (i32(cRecordObject(slot).eg_gen) == i32(3)))) {
    (reset = ((((1) & 255)) & 255));
    (reg_rate = ((cRecordObject(slot).reg_ar) & 255));
  } else {
    switch (i32(cRecordObject(slot).eg_gen)) {
      case i32(0): {
        (reg_rate = ((cRecordObject(slot).reg_ar) & 255));
      }
      break;
      case i32(1): {
        (reg_rate = ((cRecordObject(slot).reg_dr) & 255));
      }
      break;
      case i32(2): {
        if ((!Boolean(cRecordObject(slot).reg_type))) {
          (reg_rate = ((cRecordObject(slot).reg_rr) & 255));
        }
      }
      break;
      case i32(3): {
        (reg_rate = ((cRecordObject(slot).reg_rr) & 255));
      }
      break;
    }
  }
  (cRecordObject(slot).pg_reset = u32(reset));
  (ks = ((((i32((i32(cRecordObject(cRecordObject(slot).channel).ksv) >> i32((i32((i32(cRecordObject(slot).reg_ksr) ^ 1)) << 1))))) & 255)) & 255));
  (nonzero = (((((i32(reg_rate) != 0)) & 255)) & 255));
  (rate = ((((i32((i32(ks) + i32((i32(reg_rate) << 2))))) & 255)) & 255));
  (rate_hi = ((((i32((i32(rate) >> 2))) & 255)) & 255));
  (rate_lo = ((((i32((i32(rate) & 3))) & 255)) & 255));
  if (Boolean(i32((i32(rate_hi) & 16)))) {
    (rate_hi = ((((15) & 255)) & 255));
  }
  (eg_shift = ((((i32((i32(rate_hi) + i32(cRecordObject(cRecordObject(slot).chip).eg_add)))) & 255)) & 255));
  (shift = ((((0) & 255)) & 255));
  if (Boolean(nonzero)) {
    if ((i32(rate_hi) < 12)) {
      if (Boolean(cRecordObject(cRecordObject(slot).chip).eg_state)) {
        switch (i32(eg_shift)) {
          case 12: {
            (shift = ((((1) & 255)) & 255));
          }
          break;
          case 13: {
            (shift = ((((i32((i32((i32(rate_lo) >> 1)) & 1))) & 255)) & 255));
          }
          break;
          case 14: {
            (shift = ((((i32((i32(rate_lo) & 1))) & 255)) & 255));
          }
          break;
          default: {
            break;
          }
        }
      }
    } else {
      (shift = ((((i32((i32((i32(rate_hi) & 3)) + i32((cPointerElementRef(eg_incstep, rate_lo).value)[u32((u32(cRecordObject(cRecordObject(slot).chip).timer) & 3))])))) & 255)) & 255));
      if (Boolean(i32((i32(shift) & 4)))) {
        (shift = ((((3) & 255)) & 255));
      }
      if ((!Boolean(shift))) {
        (shift = ((cRecordObject(cRecordObject(slot).chip).eg_state) & 255));
      }
    }
  }
  (eg_rout = ((cRecordObject(slot).eg_rout) & 65535));
  (eg_inc = ((((((0) << 16) >> 16)) << 16) >> 16));
  (eg_off = ((((0) & 255)) & 255));
  if ((Boolean(reset) && (i32(rate_hi) == 15))) {
    (eg_rout = ((((0) & 65535)) & 65535));
  }
  if ((i32((i32(cRecordObject(slot).eg_rout) & 504)) == 504)) {
    (eg_off = ((((1) & 255)) & 255));
  }
  if ((((i32(cRecordObject(slot).eg_gen) != i32(0)) && (!Boolean(reset))) && Boolean(eg_off))) {
    (eg_rout = ((((511) & 65535)) & 65535));
  }
  switch (i32(cRecordObject(slot).eg_gen)) {
    case i32(0): {
      if ((!Boolean(cRecordObject(slot).eg_rout))) {
        (cRecordObject(slot).eg_gen = ((((1) & 255)) & 255));
      } else {
        if (((Boolean(cRecordObject(slot).key) && (i32(shift) > 0)) && (i32(rate_hi) != 15))) {
          (eg_inc = ((((((i32(((~i32(cRecordObject(slot).eg_rout)) >> i32((4 - i32(shift)))))) << 16) >> 16)) << 16) >> 16));
        }
      }
    }
    break;
    case i32(1): {
      if ((i32((i32(cRecordObject(slot).eg_rout) >> 4)) == i32(cRecordObject(slot).reg_sl))) {
        (cRecordObject(slot).eg_gen = ((((2) & 255)) & 255));
      } else {
        if ((((!Boolean(eg_off)) && (!Boolean(reset))) && (i32(shift) > 0))) {
          (eg_inc = ((((((i32((1 << i32((i32(shift) - 1))))) << 16) >> 16)) << 16) >> 16));
        }
      }
    }
    break;
    case i32(2):
    case i32(3): {
      if ((((!Boolean(eg_off)) && (!Boolean(reset))) && (i32(shift) > 0))) {
        (eg_inc = ((((((i32((1 << i32((i32(shift) - 1))))) << 16) >> 16)) << 16) >> 16));
      }
    }
    break;
  }
  (cRecordObject(slot).eg_rout = ((((i32((i32((i32(eg_rout) + i32(eg_inc))) & 511))) & 65535)) & 65535));
  if (Boolean(reset)) {
    (cRecordObject(slot).eg_gen = ((((0) & 255)) & 255));
  }
  if ((!Boolean(cRecordObject(slot).key))) {
    (cRecordObject(slot).eg_gen = ((((3) & 255)) & 255));
  }
}

// C/C++ source: source/audiolib/src/opl3.cpp:538
export function OPL3_EnvelopeKeyOn(slot, type) {
  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = (((__cxx_lvalue_0.value | i32(type))) & 255)))(cObjectFieldRef(cRecordObject(slot), "key"));
}

// C/C++ source: source/audiolib/src/opl3.cpp:543
export function OPL3_EnvelopeKeyOff(slot, type) {
  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = (((__cxx_lvalue_0.value & (~i32(type)))) & 255)))(cObjectFieldRef(cRecordObject(slot), "key"));
}

// C/C++ source: source/audiolib/src/opl3.cpp:552
export function OPL3_PhaseGenerate(slot) {
  let chip;
  let f_num;
  let basefreq;
  let rm_xor;
  let n_bit;
  let noise;
  let phase;
  (chip = cRecordObject(slot).chip);
  (f_num = ((cRecordObject(cRecordObject(slot).channel).f_num) & 65535));
  if (Boolean(cRecordObject(slot).reg_vib)) {
    let range;
    let vibpos;
    (range = ((((((i32((i32((i32(f_num) >> 7)) & 7))) << 24) >> 24)) << 24) >> 24));
    (vibpos = ((cRecordObject(cRecordObject(slot).chip).vibpos) & 255));
    if ((!Boolean(i32((i32(vibpos) & 3))))) {
      (range = ((((((0) << 24) >> 24)) << 24) >> 24));
    } else {
      if (Boolean(i32((i32(vibpos) & 1)))) {
        (range = ((((range >> 1)) << 24) >> 24));
      }
    }
    (range = ((((range >> i32(cRecordObject(cRecordObject(slot).chip).vibshift))) << 24) >> 24));
    if (Boolean(i32((i32(vibpos) & 4)))) {
      (range = (((((((-i32(range))) << 24) >> 24)) << 24) >> 24));
    }
    (f_num = (((f_num + i32(range))) & 65535));
  }
  (basefreq = u32(i32((i32((i32(f_num) << i32(cRecordObject(cRecordObject(slot).channel).block))) >> 1))));
  (phase = (((((((cRecordObject(slot).pg_phase >>> 9)) & 65535)) & 65535)) & 65535));
  if (Boolean(cRecordObject(slot).pg_reset)) {
    (cRecordObject(slot).pg_phase = u32(0));
  }
  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = u32((Number(__cxx_lvalue_0.value) + Number((u32(Math.imul(basefreq, u32((cDeref(cPointerOffset(mt, cRecordObject(slot).reg_mult, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))) >>> 1))))))(cObjectFieldRef(cRecordObject(slot), "pg_phase"));
  (noise = u32(cRecordObject(chip).noise));
  (cRecordObject(slot).pg_phase_out = ((phase) & 65535));
  if ((i32(cRecordObject(slot).slot_num) == 13)) {
    (cRecordObject(chip).rm_hh_bit2 = ((((i32((i32((i32(phase) >> 2)) & 1))) & 255)) & 255));
    (cRecordObject(chip).rm_hh_bit3 = ((((i32((i32((i32(phase) >> 3)) & 1))) & 255)) & 255));
    (cRecordObject(chip).rm_hh_bit7 = ((((i32((i32((i32(phase) >> 7)) & 1))) & 255)) & 255));
    (cRecordObject(chip).rm_hh_bit8 = ((((i32((i32((i32(phase) >> 8)) & 1))) & 255)) & 255));
  }
  if (((i32(cRecordObject(slot).slot_num) == 17) && Boolean(i32((i32(cRecordObject(chip).rhy) & 32))))) {
    (cRecordObject(chip).rm_tc_bit3 = ((((i32((i32((i32(phase) >> 3)) & 1))) & 255)) & 255));
    (cRecordObject(chip).rm_tc_bit5 = ((((i32((i32((i32(phase) >> 5)) & 1))) & 255)) & 255));
  }
  if (Boolean(i32((i32(cRecordObject(chip).rhy) & 32)))) {
    (rm_xor = ((((i32((i32((i32((i32(cRecordObject(chip).rm_hh_bit2) ^ i32(cRecordObject(chip).rm_hh_bit7))) | i32((i32(cRecordObject(chip).rm_hh_bit3) ^ i32(cRecordObject(chip).rm_tc_bit5))))) | i32((i32(cRecordObject(chip).rm_tc_bit3) ^ i32(cRecordObject(chip).rm_tc_bit5)))))) & 255)) & 255));
    switch (i32(cRecordObject(slot).slot_num)) {
      case 13: {
        (cRecordObject(slot).pg_phase_out = ((((i32((i32(rm_xor) << 9))) & 65535)) & 65535));
      }
      if (Boolean(u32((u32(rm_xor) ^ u32((noise & u32(1))))))) {
        ((__cxx_lvalue_1) => (__cxx_lvalue_1.value = (((__cxx_lvalue_1.value | 208)) & 65535)))(cObjectFieldRef(cRecordObject(slot), "pg_phase_out"));
      } else {
        ((__cxx_lvalue_2) => (__cxx_lvalue_2.value = (((__cxx_lvalue_2.value | 52)) & 65535)))(cObjectFieldRef(cRecordObject(slot), "pg_phase_out"));
      }
      break;
      case 16: {
        (cRecordObject(slot).pg_phase_out = ((((u32((u32(i32((i32(cRecordObject(chip).rm_hh_bit8) << 9))) | u32((u32((u32(cRecordObject(chip).rm_hh_bit8) ^ u32((noise & u32(1))))) << 8))))) & 65535)) & 65535));
      }
      break;
      case 17: {
        (cRecordObject(slot).pg_phase_out = ((((i32((i32((i32(rm_xor) << 9)) | 128))) & 65535)) & 65535));
      }
      break;
      default: {
        break;
      }
    }
  }
  (n_bit = ((((u32((u32(((noise >>> 14) ^ noise)) & u32(1)))) & 255)) & 255));
  (cRecordObject(chip).noise = u32(((noise >>> 1) | u32(i32((i32(n_bit) << 22))))));
}

// C/C++ source: source/audiolib/src/opl3.cpp:646
export function OPL3_SlotWrite20(slot, data) {
  if (Boolean(i32((i32((i32(data) >> 7)) & 1)))) {
    (cRecordObject(slot).trem = cObjectFieldRef(cRecordObject(cRecordObject(slot).chip), "tremolo"));
  } else {
    (cRecordObject(slot).trem = cTypedPointer(cObjectFieldRef(cRecordObject(cRecordObject(slot).chip), "zeromod"), Uint8Array));
  }
  (cRecordObject(slot).reg_vib = ((((i32((i32((i32(data) >> 6)) & 1))) & 255)) & 255));
  (cRecordObject(slot).reg_type = ((((i32((i32((i32(data) >> 5)) & 1))) & 255)) & 255));
  (cRecordObject(slot).reg_ksr = ((((i32((i32((i32(data) >> 4)) & 1))) & 255)) & 255));
  (cRecordObject(slot).reg_mult = ((((i32((i32(data) & 15))) & 255)) & 255));
}

// C/C++ source: source/audiolib/src/opl3.cpp:662
export function OPL3_SlotWrite40(slot, data) {
  (cRecordObject(slot).reg_ksl = ((((i32((i32((i32(data) >> 6)) & 3))) & 255)) & 255));
  (cRecordObject(slot).reg_tl = ((((i32((i32(data) & 63))) & 255)) & 255));
  OPL3_EnvelopeUpdateKSL(slot);
}

// C/C++ source: source/audiolib/src/opl3.cpp:669
export function OPL3_SlotWrite60(slot, data) {
  (cRecordObject(slot).reg_ar = ((((i32((i32((i32(data) >> 4)) & 15))) & 255)) & 255));
  (cRecordObject(slot).reg_dr = ((((i32((i32(data) & 15))) & 255)) & 255));
}

// C/C++ source: source/audiolib/src/opl3.cpp:675
export function OPL3_SlotWrite80(slot, data) {
  (cRecordObject(slot).reg_sl = ((((i32((i32((i32(data) >> 4)) & 15))) & 255)) & 255));
  if ((i32(cRecordObject(slot).reg_sl) == 15)) {
    (cRecordObject(slot).reg_sl = ((((31) & 255)) & 255));
  }
  (cRecordObject(slot).reg_rr = ((((i32((i32(data) & 15))) & 255)) & 255));
}

// C/C++ source: source/audiolib/src/opl3.cpp:685
export function OPL3_SlotWriteE0(slot, data) {
  (cRecordObject(slot).reg_wf = ((((i32((i32(data) & 7))) & 255)) & 255));
  if ((i32(cRecordObject(cRecordObject(slot).chip).newm) == 0)) {
    ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = (((__cxx_lvalue_0.value & 3)) & 255)))(cObjectFieldRef(cRecordObject(slot), "reg_wf"));
  }
}

// C/C++ source: source/audiolib/src/opl3.cpp:694
export function OPL3_SlotGenerate(slot) {
  (cRecordObject(slot).out = ((((cPointerElementRef(envelope_sin, cRecordObject(slot).reg_wf).value)(((i32((i32(cRecordObject(slot).pg_phase_out) + i32((cDeref(cRecordObject(slot).mod, Int16Array).value))))) & 65535), cRecordObject(slot).eg_out)) << 16) >> 16));
}

// C/C++ source: source/audiolib/src/opl3.cpp:699
export function OPL3_SlotCalcFB(slot) {
  if ((i32(cRecordObject(cRecordObject(slot).channel).fb) != 0)) {
    (cRecordObject(slot).fbmod = ((((((i32((i32((i32(cRecordObject(slot).prout) + i32(cRecordObject(slot).out))) >> i32((9 - i32(cRecordObject(cRecordObject(slot).channel).fb)))))) << 16) >> 16)) << 16) >> 16));
  } else {
    (cRecordObject(slot).fbmod = ((((((0) << 16) >> 16)) << 16) >> 16));
  }
  (cRecordObject(slot).prout = (((cRecordObject(slot).out) << 16) >> 16));
}

// C/C++ source: source/audiolib/src/opl3.cpp:718
export function OPL3_ChannelUpdateRhythm(chip, data) {
  let channel6;
  let channel7;
  let channel8;
  let chnum;
  (cRecordObject(chip).rhy = ((((i32((i32(data) & 63))) & 255)) & 255));
  if (Boolean(i32((i32(cRecordObject(chip).rhy) & 32)))) {
    (channel6 = cPointerOffset(cRecordObject(chip).channel, 6, 88));
    (channel7 = cPointerOffset(cRecordObject(chip).channel, 7, 88));
    (channel8 = cPointerOffset(cRecordObject(chip).channel, 8, 88));
    ((cPointerElementRef(cRecordObject(channel6).out, 0).value) = cObjectFieldRef(cRecordObject((cPointerElementRef(cRecordObject(channel6).slots, 1).value)), "out"));
    ((cPointerElementRef(cRecordObject(channel6).out, 1).value) = cObjectFieldRef(cRecordObject((cPointerElementRef(cRecordObject(channel6).slots, 1).value)), "out"));
    ((cPointerElementRef(cRecordObject(channel6).out, 2).value) = cObjectFieldRef(cRecordObject(chip), "zeromod"));
    ((cPointerElementRef(cRecordObject(channel6).out, 3).value) = cObjectFieldRef(cRecordObject(chip), "zeromod"));
    ((cPointerElementRef(cRecordObject(channel7).out, 0).value) = cObjectFieldRef(cRecordObject((cPointerElementRef(cRecordObject(channel7).slots, 0).value)), "out"));
    ((cPointerElementRef(cRecordObject(channel7).out, 1).value) = cObjectFieldRef(cRecordObject((cPointerElementRef(cRecordObject(channel7).slots, 0).value)), "out"));
    ((cPointerElementRef(cRecordObject(channel7).out, 2).value) = cObjectFieldRef(cRecordObject((cPointerElementRef(cRecordObject(channel7).slots, 1).value)), "out"));
    ((cPointerElementRef(cRecordObject(channel7).out, 3).value) = cObjectFieldRef(cRecordObject((cPointerElementRef(cRecordObject(channel7).slots, 1).value)), "out"));
    ((cPointerElementRef(cRecordObject(channel8).out, 0).value) = cObjectFieldRef(cRecordObject((cPointerElementRef(cRecordObject(channel8).slots, 0).value)), "out"));
    ((cPointerElementRef(cRecordObject(channel8).out, 1).value) = cObjectFieldRef(cRecordObject((cPointerElementRef(cRecordObject(channel8).slots, 0).value)), "out"));
    ((cPointerElementRef(cRecordObject(channel8).out, 2).value) = cObjectFieldRef(cRecordObject((cPointerElementRef(cRecordObject(channel8).slots, 1).value)), "out"));
    ((cPointerElementRef(cRecordObject(channel8).out, 3).value) = cObjectFieldRef(cRecordObject((cPointerElementRef(cRecordObject(channel8).slots, 1).value)), "out"));
    for ((chnum = ((((6) & 255)) & 255)); (i32(chnum) < 9); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = (((previous + 1)) & 255); __cxx_lvalue_0.value = next; return previous; })(cRef(() => chnum, __cxx_lvalue_1 => { chnum = __cxx_lvalue_1; }))) {
      ((cPointerElementRef(cRecordObject(chip).channel, chnum).value).chtype = ((((3) & 255)) & 255));
    }
    OPL3_ChannelSetupAlg(channel6);
    OPL3_ChannelSetupAlg(channel7);
    OPL3_ChannelSetupAlg(channel8);
    if (Boolean(i32((i32(cRecordObject(chip).rhy) & 1)))) {
      OPL3_EnvelopeKeyOn((cPointerElementRef(cRecordObject(channel7).slots, 0).value), ((2) & 255));
    } else {
      OPL3_EnvelopeKeyOff((cPointerElementRef(cRecordObject(channel7).slots, 0).value), ((2) & 255));
    }
    if (Boolean(i32((i32(cRecordObject(chip).rhy) & 2)))) {
      OPL3_EnvelopeKeyOn((cPointerElementRef(cRecordObject(channel8).slots, 1).value), ((2) & 255));
    } else {
      OPL3_EnvelopeKeyOff((cPointerElementRef(cRecordObject(channel8).slots, 1).value), ((2) & 255));
    }
    if (Boolean(i32((i32(cRecordObject(chip).rhy) & 4)))) {
      OPL3_EnvelopeKeyOn((cPointerElementRef(cRecordObject(channel8).slots, 0).value), ((2) & 255));
    } else {
      OPL3_EnvelopeKeyOff((cPointerElementRef(cRecordObject(channel8).slots, 0).value), ((2) & 255));
    }
    if (Boolean(i32((i32(cRecordObject(chip).rhy) & 8)))) {
      OPL3_EnvelopeKeyOn((cPointerElementRef(cRecordObject(channel7).slots, 1).value), ((2) & 255));
    } else {
      OPL3_EnvelopeKeyOff((cPointerElementRef(cRecordObject(channel7).slots, 1).value), ((2) & 255));
    }
    if (Boolean(i32((i32(cRecordObject(chip).rhy) & 16)))) {
      OPL3_EnvelopeKeyOn((cPointerElementRef(cRecordObject(channel6).slots, 0).value), ((2) & 255));
      OPL3_EnvelopeKeyOn((cPointerElementRef(cRecordObject(channel6).slots, 1).value), ((2) & 255));
    } else {
      OPL3_EnvelopeKeyOff((cPointerElementRef(cRecordObject(channel6).slots, 0).value), ((2) & 255));
      OPL3_EnvelopeKeyOff((cPointerElementRef(cRecordObject(channel6).slots, 1).value), ((2) & 255));
    }
  } else {
    for ((chnum = ((((6) & 255)) & 255)); (i32(chnum) < 9); ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = (((previous + 1)) & 255); __cxx_lvalue_2.value = next; return previous; })(cRef(() => chnum, __cxx_lvalue_3 => { chnum = __cxx_lvalue_3; }))) {
      ((cPointerElementRef(cRecordObject(chip).channel, chnum).value).chtype = ((((0) & 255)) & 255));
      OPL3_ChannelSetupAlg(cPointerOffset(cRecordObject(chip).channel, chnum, 88));
      OPL3_EnvelopeKeyOff((cPointerElementRef((cPointerElementRef(cRecordObject(chip).channel, chnum).value).slots, 0).value), ((2) & 255));
      OPL3_EnvelopeKeyOff((cPointerElementRef((cPointerElementRef(cRecordObject(chip).channel, chnum).value).slots, 1).value), ((2) & 255));
    }
  }
}

// C/C++ source: source/audiolib/src/opl3.cpp:810
export function OPL3_ChannelWriteA0(channel, data) {
  if ((Boolean(cRecordObject(cRecordObject(channel).chip).newm) && (i32(cRecordObject(channel).chtype) == i32(2)))) {
    return;
  }
  (cRecordObject(channel).f_num = ((((i32((i32((i32(cRecordObject(channel).f_num) & 768)) | i32(data)))) & 65535)) & 65535));
  (cRecordObject(channel).ksv = ((((i32((i32((i32(cRecordObject(channel).block) << 1)) | i32((i32((i32(cRecordObject(channel).f_num) >> i32((9 - i32(cRecordObject(cRecordObject(channel).chip).nts))))) & 1))))) & 255)) & 255));
  OPL3_EnvelopeUpdateKSL((cPointerElementRef(cRecordObject(channel).slots, 0).value));
  OPL3_EnvelopeUpdateKSL((cPointerElementRef(cRecordObject(channel).slots, 1).value));
  if ((Boolean(cRecordObject(cRecordObject(channel).chip).newm) && (i32(cRecordObject(channel).chtype) == i32(1)))) {
    (cRecordObject(cRecordObject(channel).pair).f_num = ((cRecordObject(channel).f_num) & 65535));
    (cRecordObject(cRecordObject(channel).pair).ksv = ((cRecordObject(channel).ksv) & 255));
    OPL3_EnvelopeUpdateKSL((cPointerElementRef(cRecordObject(cRecordObject(channel).pair).slots, 0).value));
    OPL3_EnvelopeUpdateKSL((cPointerElementRef(cRecordObject(cRecordObject(channel).pair).slots, 1).value));
  }
}

// C/C++ source: source/audiolib/src/opl3.cpp:830
export function OPL3_ChannelWriteB0(channel, data) {
  if ((Boolean(cRecordObject(cRecordObject(channel).chip).newm) && (i32(cRecordObject(channel).chtype) == i32(2)))) {
    return;
  }
  (cRecordObject(channel).f_num = ((((i32((i32((i32(cRecordObject(channel).f_num) & 255)) | i32((i32((i32(data) & 3)) << 8))))) & 65535)) & 65535));
  (cRecordObject(channel).block = ((((i32((i32((i32(data) >> 2)) & 7))) & 255)) & 255));
  (cRecordObject(channel).ksv = ((((i32((i32((i32(cRecordObject(channel).block) << 1)) | i32((i32((i32(cRecordObject(channel).f_num) >> i32((9 - i32(cRecordObject(cRecordObject(channel).chip).nts))))) & 1))))) & 255)) & 255));
  OPL3_EnvelopeUpdateKSL((cPointerElementRef(cRecordObject(channel).slots, 0).value));
  OPL3_EnvelopeUpdateKSL((cPointerElementRef(cRecordObject(channel).slots, 1).value));
  if ((Boolean(cRecordObject(cRecordObject(channel).chip).newm) && (i32(cRecordObject(channel).chtype) == i32(1)))) {
    (cRecordObject(cRecordObject(channel).pair).f_num = ((cRecordObject(channel).f_num) & 65535));
    (cRecordObject(cRecordObject(channel).pair).block = ((cRecordObject(channel).block) & 255));
    (cRecordObject(cRecordObject(channel).pair).ksv = ((cRecordObject(channel).ksv) & 255));
    OPL3_EnvelopeUpdateKSL((cPointerElementRef(cRecordObject(cRecordObject(channel).pair).slots, 0).value));
    OPL3_EnvelopeUpdateKSL((cPointerElementRef(cRecordObject(cRecordObject(channel).pair).slots, 1).value));
  }
}

// C/C++ source: source/audiolib/src/opl3.cpp:852
export function OPL3_ChannelSetupAlg(channel) {
  if ((i32(cRecordObject(channel).chtype) == i32(3))) {
    if (((i32(cRecordObject(channel).ch_num) == 7) || (i32(cRecordObject(channel).ch_num) == 8))) {
      (cRecordObject((cPointerElementRef(cRecordObject(channel).slots, 0).value)).mod = cObjectFieldRef(cRecordObject(cRecordObject(channel).chip), "zeromod"));
      (cRecordObject((cPointerElementRef(cRecordObject(channel).slots, 1).value)).mod = cObjectFieldRef(cRecordObject(cRecordObject(channel).chip), "zeromod"));
      return;
    }
    switch (i32((i32(cRecordObject(channel).alg) & 1))) {
      case 0: {
        (cRecordObject((cPointerElementRef(cRecordObject(channel).slots, 0).value)).mod = cObjectFieldRef(cRecordObject((cPointerElementRef(cRecordObject(channel).slots, 0).value)), "fbmod"));
      }
      (cRecordObject((cPointerElementRef(cRecordObject(channel).slots, 1).value)).mod = cObjectFieldRef(cRecordObject((cPointerElementRef(cRecordObject(channel).slots, 0).value)), "out"));
      break;
      case 1: {
        (cRecordObject((cPointerElementRef(cRecordObject(channel).slots, 0).value)).mod = cObjectFieldRef(cRecordObject((cPointerElementRef(cRecordObject(channel).slots, 0).value)), "fbmod"));
      }
      (cRecordObject((cPointerElementRef(cRecordObject(channel).slots, 1).value)).mod = cObjectFieldRef(cRecordObject(cRecordObject(channel).chip), "zeromod"));
      break;
    }
    return;
  }
  if (Boolean(i32((i32(cRecordObject(channel).alg) & 8)))) {
    return;
  }
  if (Boolean(i32((i32(cRecordObject(channel).alg) & 4)))) {
    ((cPointerElementRef(cRecordObject(cRecordObject(channel).pair).out, 0).value) = cObjectFieldRef(cRecordObject(cRecordObject(channel).chip), "zeromod"));
    ((cPointerElementRef(cRecordObject(cRecordObject(channel).pair).out, 1).value) = cObjectFieldRef(cRecordObject(cRecordObject(channel).chip), "zeromod"));
    ((cPointerElementRef(cRecordObject(cRecordObject(channel).pair).out, 2).value) = cObjectFieldRef(cRecordObject(cRecordObject(channel).chip), "zeromod"));
    ((cPointerElementRef(cRecordObject(cRecordObject(channel).pair).out, 3).value) = cObjectFieldRef(cRecordObject(cRecordObject(channel).chip), "zeromod"));
    switch (i32((i32(cRecordObject(channel).alg) & 3))) {
      case 0: {
        (cRecordObject((cPointerElementRef(cRecordObject(cRecordObject(channel).pair).slots, 0).value)).mod = cObjectFieldRef(cRecordObject((cPointerElementRef(cRecordObject(cRecordObject(channel).pair).slots, 0).value)), "fbmod"));
      }
      (cRecordObject((cPointerElementRef(cRecordObject(cRecordObject(channel).pair).slots, 1).value)).mod = cObjectFieldRef(cRecordObject((cPointerElementRef(cRecordObject(cRecordObject(channel).pair).slots, 0).value)), "out"));
      (cRecordObject((cPointerElementRef(cRecordObject(channel).slots, 0).value)).mod = cObjectFieldRef(cRecordObject((cPointerElementRef(cRecordObject(cRecordObject(channel).pair).slots, 1).value)), "out"));
      (cRecordObject((cPointerElementRef(cRecordObject(channel).slots, 1).value)).mod = cObjectFieldRef(cRecordObject((cPointerElementRef(cRecordObject(channel).slots, 0).value)), "out"));
      ((cPointerElementRef(cRecordObject(channel).out, 0).value) = cObjectFieldRef(cRecordObject((cPointerElementRef(cRecordObject(channel).slots, 1).value)), "out"));
      ((cPointerElementRef(cRecordObject(channel).out, 1).value) = cObjectFieldRef(cRecordObject(cRecordObject(channel).chip), "zeromod"));
      ((cPointerElementRef(cRecordObject(channel).out, 2).value) = cObjectFieldRef(cRecordObject(cRecordObject(channel).chip), "zeromod"));
      ((cPointerElementRef(cRecordObject(channel).out, 3).value) = cObjectFieldRef(cRecordObject(cRecordObject(channel).chip), "zeromod"));
      break;
      case 1: {
        (cRecordObject((cPointerElementRef(cRecordObject(cRecordObject(channel).pair).slots, 0).value)).mod = cObjectFieldRef(cRecordObject((cPointerElementRef(cRecordObject(cRecordObject(channel).pair).slots, 0).value)), "fbmod"));
      }
      (cRecordObject((cPointerElementRef(cRecordObject(cRecordObject(channel).pair).slots, 1).value)).mod = cObjectFieldRef(cRecordObject((cPointerElementRef(cRecordObject(cRecordObject(channel).pair).slots, 0).value)), "out"));
      (cRecordObject((cPointerElementRef(cRecordObject(channel).slots, 0).value)).mod = cObjectFieldRef(cRecordObject(cRecordObject(channel).chip), "zeromod"));
      (cRecordObject((cPointerElementRef(cRecordObject(channel).slots, 1).value)).mod = cObjectFieldRef(cRecordObject((cPointerElementRef(cRecordObject(channel).slots, 0).value)), "out"));
      ((cPointerElementRef(cRecordObject(channel).out, 0).value) = cObjectFieldRef(cRecordObject((cPointerElementRef(cRecordObject(cRecordObject(channel).pair).slots, 1).value)), "out"));
      ((cPointerElementRef(cRecordObject(channel).out, 1).value) = cObjectFieldRef(cRecordObject((cPointerElementRef(cRecordObject(channel).slots, 1).value)), "out"));
      ((cPointerElementRef(cRecordObject(channel).out, 2).value) = cObjectFieldRef(cRecordObject(cRecordObject(channel).chip), "zeromod"));
      ((cPointerElementRef(cRecordObject(channel).out, 3).value) = cObjectFieldRef(cRecordObject(cRecordObject(channel).chip), "zeromod"));
      break;
      case 2: {
        (cRecordObject((cPointerElementRef(cRecordObject(cRecordObject(channel).pair).slots, 0).value)).mod = cObjectFieldRef(cRecordObject((cPointerElementRef(cRecordObject(cRecordObject(channel).pair).slots, 0).value)), "fbmod"));
      }
      (cRecordObject((cPointerElementRef(cRecordObject(cRecordObject(channel).pair).slots, 1).value)).mod = cObjectFieldRef(cRecordObject(cRecordObject(channel).chip), "zeromod"));
      (cRecordObject((cPointerElementRef(cRecordObject(channel).slots, 0).value)).mod = cObjectFieldRef(cRecordObject((cPointerElementRef(cRecordObject(cRecordObject(channel).pair).slots, 1).value)), "out"));
      (cRecordObject((cPointerElementRef(cRecordObject(channel).slots, 1).value)).mod = cObjectFieldRef(cRecordObject((cPointerElementRef(cRecordObject(channel).slots, 0).value)), "out"));
      ((cPointerElementRef(cRecordObject(channel).out, 0).value) = cObjectFieldRef(cRecordObject((cPointerElementRef(cRecordObject(cRecordObject(channel).pair).slots, 0).value)), "out"));
      ((cPointerElementRef(cRecordObject(channel).out, 1).value) = cObjectFieldRef(cRecordObject((cPointerElementRef(cRecordObject(channel).slots, 1).value)), "out"));
      ((cPointerElementRef(cRecordObject(channel).out, 2).value) = cObjectFieldRef(cRecordObject(cRecordObject(channel).chip), "zeromod"));
      ((cPointerElementRef(cRecordObject(channel).out, 3).value) = cObjectFieldRef(cRecordObject(cRecordObject(channel).chip), "zeromod"));
      break;
      case 3: {
        (cRecordObject((cPointerElementRef(cRecordObject(cRecordObject(channel).pair).slots, 0).value)).mod = cObjectFieldRef(cRecordObject((cPointerElementRef(cRecordObject(cRecordObject(channel).pair).slots, 0).value)), "fbmod"));
      }
      (cRecordObject((cPointerElementRef(cRecordObject(cRecordObject(channel).pair).slots, 1).value)).mod = cObjectFieldRef(cRecordObject(cRecordObject(channel).chip), "zeromod"));
      (cRecordObject((cPointerElementRef(cRecordObject(channel).slots, 0).value)).mod = cObjectFieldRef(cRecordObject((cPointerElementRef(cRecordObject(cRecordObject(channel).pair).slots, 1).value)), "out"));
      (cRecordObject((cPointerElementRef(cRecordObject(channel).slots, 1).value)).mod = cObjectFieldRef(cRecordObject(cRecordObject(channel).chip), "zeromod"));
      ((cPointerElementRef(cRecordObject(channel).out, 0).value) = cObjectFieldRef(cRecordObject((cPointerElementRef(cRecordObject(cRecordObject(channel).pair).slots, 0).value)), "out"));
      ((cPointerElementRef(cRecordObject(channel).out, 1).value) = cObjectFieldRef(cRecordObject((cPointerElementRef(cRecordObject(channel).slots, 0).value)), "out"));
      ((cPointerElementRef(cRecordObject(channel).out, 2).value) = cObjectFieldRef(cRecordObject((cPointerElementRef(cRecordObject(channel).slots, 1).value)), "out"));
      ((cPointerElementRef(cRecordObject(channel).out, 3).value) = cObjectFieldRef(cRecordObject(cRecordObject(channel).chip), "zeromod"));
      break;
    }
  } else {
    switch (i32((i32(cRecordObject(channel).alg) & 1))) {
      case 0: {
        (cRecordObject((cPointerElementRef(cRecordObject(channel).slots, 0).value)).mod = cObjectFieldRef(cRecordObject((cPointerElementRef(cRecordObject(channel).slots, 0).value)), "fbmod"));
      }
      (cRecordObject((cPointerElementRef(cRecordObject(channel).slots, 1).value)).mod = cObjectFieldRef(cRecordObject((cPointerElementRef(cRecordObject(channel).slots, 0).value)), "out"));
      ((cPointerElementRef(cRecordObject(channel).out, 0).value) = cObjectFieldRef(cRecordObject((cPointerElementRef(cRecordObject(channel).slots, 1).value)), "out"));
      ((cPointerElementRef(cRecordObject(channel).out, 1).value) = cObjectFieldRef(cRecordObject(cRecordObject(channel).chip), "zeromod"));
      ((cPointerElementRef(cRecordObject(channel).out, 2).value) = cObjectFieldRef(cRecordObject(cRecordObject(channel).chip), "zeromod"));
      ((cPointerElementRef(cRecordObject(channel).out, 3).value) = cObjectFieldRef(cRecordObject(cRecordObject(channel).chip), "zeromod"));
      break;
      case 1: {
        (cRecordObject((cPointerElementRef(cRecordObject(channel).slots, 0).value)).mod = cObjectFieldRef(cRecordObject((cPointerElementRef(cRecordObject(channel).slots, 0).value)), "fbmod"));
      }
      (cRecordObject((cPointerElementRef(cRecordObject(channel).slots, 1).value)).mod = cObjectFieldRef(cRecordObject(cRecordObject(channel).chip), "zeromod"));
      ((cPointerElementRef(cRecordObject(channel).out, 0).value) = cObjectFieldRef(cRecordObject((cPointerElementRef(cRecordObject(channel).slots, 0).value)), "out"));
      ((cPointerElementRef(cRecordObject(channel).out, 1).value) = cObjectFieldRef(cRecordObject((cPointerElementRef(cRecordObject(channel).slots, 1).value)), "out"));
      ((cPointerElementRef(cRecordObject(channel).out, 2).value) = cObjectFieldRef(cRecordObject(cRecordObject(channel).chip), "zeromod"));
      ((cPointerElementRef(cRecordObject(channel).out, 3).value) = cObjectFieldRef(cRecordObject(cRecordObject(channel).chip), "zeromod"));
      break;
    }
  }
}

// C/C++ source: source/audiolib/src/opl3.cpp:953
export function OPL3_ChannelWriteC0(channel, data) {
  (cRecordObject(channel).fb = ((((i32((i32((i32(data) & 14)) >> 1))) & 255)) & 255));
  (cRecordObject(channel).con = ((((i32((i32(data) & 1))) & 255)) & 255));
  (cRecordObject(channel).alg = ((cRecordObject(channel).con) & 255));
  if (Boolean(cRecordObject(cRecordObject(channel).chip).newm)) {
    if ((i32(cRecordObject(channel).chtype) == i32(1))) {
      (cRecordObject(cRecordObject(channel).pair).alg = ((((i32((i32((4 | i32((i32(cRecordObject(channel).con) << 1)))) | i32(cRecordObject(cRecordObject(channel).pair).con)))) & 255)) & 255));
      (cRecordObject(channel).alg = ((((8) & 255)) & 255));
      OPL3_ChannelSetupAlg(cRecordObject(channel).pair);
    } else {
      if ((i32(cRecordObject(channel).chtype) == i32(2))) {
        (cRecordObject(channel).alg = ((((i32((i32((4 | i32((i32(cRecordObject(cRecordObject(channel).pair).con) << 1)))) | i32(cRecordObject(channel).con)))) & 255)) & 255));
        (cRecordObject(cRecordObject(channel).pair).alg = ((((8) & 255)) & 255));
        OPL3_ChannelSetupAlg(channel);
      } else {
        OPL3_ChannelSetupAlg(channel);
      }
    }
  } else {
    OPL3_ChannelSetupAlg(channel);
  }
  if (Boolean(cRecordObject(cRecordObject(channel).chip).newm)) {
    (cRecordObject(channel).cha = (((((Boolean(i32((i32((i32(data) >> 4)) & 1))) ? (~0) : 0)) & 65535)) & 65535));
    (cRecordObject(channel).chb = (((((Boolean(i32((i32((i32(data) >> 5)) & 1))) ? (~0) : 0)) & 65535)) & 65535));
  } else {
    (cRecordObject(channel).cha = (((cRecordObject(channel).chb = (((((((~0)) & 65535)) & 65535)) & 65535))) & 65535));
  }
  if ((!Boolean(cRecordObject(cRecordObject(channel).chip).stereoext))) {
    (cRecordObject(channel).leftpan = i32((i32(cRecordObject(channel).cha) << 16)));
    (cRecordObject(channel).rightpan = i32((i32(cRecordObject(channel).chb) << 16)));
  }
}

// C/C++ source: source/audiolib/src/opl3.cpp:1000
export function OPL3_ChannelWriteD0(channel, data) {
  if (Boolean(cRecordObject(cRecordObject(channel).chip).stereoext)) {
    (cRecordObject(channel).leftpan = i32((cDeref(cPointerOffset(panpot_lut, u32((u32(data) ^ 255)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
    (cRecordObject(channel).rightpan = i32((cDeref(cPointerOffset(panpot_lut, data, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
  }
}

// C/C++ source: source/audiolib/src/opl3.cpp:1010
export function OPL3_ChannelKeyOn(channel) {
  if (Boolean(cRecordObject(cRecordObject(channel).chip).newm)) {
    if ((i32(cRecordObject(channel).chtype) == i32(1))) {
      OPL3_EnvelopeKeyOn((cPointerElementRef(cRecordObject(channel).slots, 0).value), ((1) & 255));
      OPL3_EnvelopeKeyOn((cPointerElementRef(cRecordObject(channel).slots, 1).value), ((1) & 255));
      OPL3_EnvelopeKeyOn((cPointerElementRef(cRecordObject(cRecordObject(channel).pair).slots, 0).value), ((1) & 255));
      OPL3_EnvelopeKeyOn((cPointerElementRef(cRecordObject(cRecordObject(channel).pair).slots, 1).value), ((1) & 255));
    } else {
      if (((i32(cRecordObject(channel).chtype) == i32(0)) || (i32(cRecordObject(channel).chtype) == i32(3)))) {
        OPL3_EnvelopeKeyOn((cPointerElementRef(cRecordObject(channel).slots, 0).value), ((1) & 255));
        OPL3_EnvelopeKeyOn((cPointerElementRef(cRecordObject(channel).slots, 1).value), ((1) & 255));
      }
    }
  } else {
    OPL3_EnvelopeKeyOn((cPointerElementRef(cRecordObject(channel).slots, 0).value), ((1) & 255));
    OPL3_EnvelopeKeyOn((cPointerElementRef(cRecordObject(channel).slots, 1).value), ((1) & 255));
  }
}

// C/C++ source: source/audiolib/src/opl3.cpp:1034
export function OPL3_ChannelKeyOff(channel) {
  if (Boolean(cRecordObject(cRecordObject(channel).chip).newm)) {
    if ((i32(cRecordObject(channel).chtype) == i32(1))) {
      OPL3_EnvelopeKeyOff((cPointerElementRef(cRecordObject(channel).slots, 0).value), ((1) & 255));
      OPL3_EnvelopeKeyOff((cPointerElementRef(cRecordObject(channel).slots, 1).value), ((1) & 255));
      OPL3_EnvelopeKeyOff((cPointerElementRef(cRecordObject(cRecordObject(channel).pair).slots, 0).value), ((1) & 255));
      OPL3_EnvelopeKeyOff((cPointerElementRef(cRecordObject(cRecordObject(channel).pair).slots, 1).value), ((1) & 255));
    } else {
      if (((i32(cRecordObject(channel).chtype) == i32(0)) || (i32(cRecordObject(channel).chtype) == i32(3)))) {
        OPL3_EnvelopeKeyOff((cPointerElementRef(cRecordObject(channel).slots, 0).value), ((1) & 255));
        OPL3_EnvelopeKeyOff((cPointerElementRef(cRecordObject(channel).slots, 1).value), ((1) & 255));
      }
    }
  } else {
    OPL3_EnvelopeKeyOff((cPointerElementRef(cRecordObject(channel).slots, 0).value), ((1) & 255));
    OPL3_EnvelopeKeyOff((cPointerElementRef(cRecordObject(channel).slots, 1).value), ((1) & 255));
  }
}

// C/C++ source: source/audiolib/src/opl3.cpp:1058
export function OPL3_ChannelSet4Op(chip, data) {
  let bit;
  let chnum;
  for ((bit = ((((0) & 255)) & 255)); (i32(bit) < 6); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = (((previous + 1)) & 255); __cxx_lvalue_0.value = next; return previous; })(cRef(() => bit, __cxx_lvalue_1 => { bit = __cxx_lvalue_1; }))) {
    (chnum = ((bit) & 255));
    if ((i32(bit) >= 3)) {
      (chnum = (((chnum + i32((9 - 3)))) & 255));
    }
    if (Boolean(i32((i32((i32(data) >> i32(bit))) & 1)))) {
      ((cPointerElementRef(cRecordObject(chip).channel, chnum).value).chtype = ((((1) & 255)) & 255));
      ((cPointerElementRef(cRecordObject(chip).channel, u32((u32(chnum) + 3))).value).chtype = ((((2) & 255)) & 255));
    } else {
      ((cPointerElementRef(cRecordObject(chip).channel, chnum).value).chtype = ((((0) & 255)) & 255));
      ((cPointerElementRef(cRecordObject(chip).channel, u32((u32(chnum) + 3))).value).chtype = ((((0) & 255)) & 255));
    }
  }
}

// C/C++ source: source/audiolib/src/opl3.cpp:1082
export function OPL3_ClipSample(sample) {
  if ((sample > 32767)) {
    (sample = i32(32767));
  } else {
    if ((sample < (-32768))) {
      (sample = i32((-32768)));
    }
  }
  return (((((((((sample) << 16) >> 16)) << 16) >> 16)) << 16) >> 16);
}

// C/C++ source: source/audiolib/src/opl3.cpp:1095
export function OPL3_ProcessSlot(slot) {
  OPL3_SlotCalcFB(slot);
  OPL3_EnvelopeCalc(slot);
  OPL3_PhaseGenerate(slot);
  OPL3_SlotGenerate(slot);
}

// C/C++ source: source/audiolib/src/opl3.cpp:1103
export function OPL3_Generate(chip, buf) {
  let channel;
  let writebuf;
  let out;
  let mix;
  let ii;
  let accm;
  let shift = ((((0) & 255)) & 255);
  ((cDeref(cPointerOffset(buf, 1, Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = (((OPL3_ClipSample((cDeref(cPointerOffset(cRecordObject(chip).mixbuff, 1, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))) << 16) >> 16));
  for ((ii = ((((0) & 255)) & 255)); (i32(ii) < 36); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = (((previous + 1)) & 255); __cxx_lvalue_0.value = next; return previous; })(cRef(() => ii, __cxx_lvalue_1 => { ii = __cxx_lvalue_1; }))) {
    OPL3_ProcessSlot(cPointerOffset(cRecordObject(chip).slot, ii, 72));
  }
  (mix = i32(0));
  for ((ii = ((((0) & 255)) & 255)); (i32(ii) < 18); ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = (((previous + 1)) & 255); __cxx_lvalue_2.value = next; return previous; })(cRef(() => ii, __cxx_lvalue_3 => { ii = __cxx_lvalue_3; }))) {
    (channel = cPointerOffset(cRecordObject(chip).channel, ii, 88));
    (out = cRecordObject(channel).out);
    (accm = ((((((i32((i32((i32((i32((cDeref((cPointerElementRef(out, 0).value), Int16Array).value)) + i32((cDeref((cPointerElementRef(out, 1).value), Int16Array).value)))) + i32((cDeref((cPointerElementRef(out, 2).value), Int16Array).value)))) + i32((cDeref((cPointerElementRef(out, 3).value), Int16Array).value))))) << 16) >> 16)) << 16) >> 16));
    (mix = i32((Number(mix) + Number(i32(((((((i32((i32(Math.imul(i32(accm), cRecordObject(channel).leftpan)) >> 16))) << 16) >> 16)) << 16) >> 16))))));
  }
  ((cDeref(cPointerOffset(cRecordObject(chip).mixbuff, 0, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(mix));
  ((cDeref(cPointerOffset(buf, 0, Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = (((OPL3_ClipSample((cDeref(cPointerOffset(cRecordObject(chip).mixbuff, 0, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))) << 16) >> 16));
  (mix = i32(0));
  for ((ii = ((((0) & 255)) & 255)); (i32(ii) < 18); ((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = (((previous + 1)) & 255); __cxx_lvalue_4.value = next; return previous; })(cRef(() => ii, __cxx_lvalue_5 => { ii = __cxx_lvalue_5; }))) {
    (channel = cPointerOffset(cRecordObject(chip).channel, ii, 88));
    (out = cRecordObject(channel).out);
    (accm = ((((((i32((i32((i32((i32((cDeref((cPointerElementRef(out, 0).value), Int16Array).value)) + i32((cDeref((cPointerElementRef(out, 1).value), Int16Array).value)))) + i32((cDeref((cPointerElementRef(out, 2).value), Int16Array).value)))) + i32((cDeref((cPointerElementRef(out, 3).value), Int16Array).value))))) << 16) >> 16)) << 16) >> 16));
    (mix = i32((Number(mix) + Number(i32(((((((i32((i32(Math.imul(i32(accm), cRecordObject(channel).rightpan)) >> 16))) << 16) >> 16)) << 16) >> 16))))));
  }
  ((cDeref(cPointerOffset(cRecordObject(chip).mixbuff, 1, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(mix));
  if ((i32((i32(cRecordObject(chip).timer) & 63)) == 63)) {
    (cRecordObject(chip).tremolopos = (((((i32((i32(cRecordObject(chip).tremolopos) + 1)) % 210)) & 255)) & 255));
  }
  if ((i32(cRecordObject(chip).tremolopos) < 105)) {
    (cRecordObject(chip).tremolo = ((((i32((i32(cRecordObject(chip).tremolopos) >> i32(cRecordObject(chip).tremoloshift)))) & 255)) & 255));
  } else {
    (cRecordObject(chip).tremolo = ((((i32((i32((210 - i32(cRecordObject(chip).tremolopos))) >> i32(cRecordObject(chip).tremoloshift)))) & 255)) & 255));
  }
  if ((i32((i32(cRecordObject(chip).timer) & 1023)) == 1023)) {
    (cRecordObject(chip).vibpos = ((((i32((i32((i32(cRecordObject(chip).vibpos) + 1)) & 7))) & 255)) & 255));
  }
  ((__cxx_lvalue_6) => { const previous = __cxx_lvalue_6.value; const next = (((previous + 1)) & 65535); __cxx_lvalue_6.value = next; return previous; })(cObjectFieldRef(cRecordObject(chip), "timer"));
  (cRecordObject(chip).eg_add = ((((0) & 255)) & 255));
  if (Boolean(cRecordObject(chip).eg_timer)) {
    while (((i32(shift) < 36) && ((BigInt((BigInt(cRecordObject(chip).eg_timer) >> BigInt(i32(shift)))) & BigInt(u64(1))) == u64(0)))) {
      ((__cxx_lvalue_7) => { const previous = __cxx_lvalue_7.value; const next = (((previous + 1)) & 255); __cxx_lvalue_7.value = next; return previous; })(cRef(() => shift, __cxx_lvalue_8 => { shift = __cxx_lvalue_8; }));
    }
    if ((i32(shift) > 12)) {
      (cRecordObject(chip).eg_add = ((((0) & 255)) & 255));
    } else {
      (cRecordObject(chip).eg_add = ((((i32((i32(shift) + 1))) & 255)) & 255));
    }
  }
  if ((Boolean(cRecordObject(chip).eg_timerrem) || Boolean(cRecordObject(chip).eg_state))) {
    if ((cRecordObject(chip).eg_timer == u64(68719476735n))) {
      (cRecordObject(chip).eg_timer = u64(0));
      (cRecordObject(chip).eg_timerrem = ((((1) & 255)) & 255));
    } else {
      ((__cxx_lvalue_9) => { const previous = __cxx_lvalue_9.value; const next = u64((previous + 1n)); __cxx_lvalue_9.value = next; return previous; })(cObjectFieldRef(cRecordObject(chip), "eg_timer"));
      (cRecordObject(chip).eg_timerrem = ((((0) & 255)) & 255));
    }
  }
  ((__cxx_lvalue_10) => (__cxx_lvalue_10.value = (((__cxx_lvalue_10.value ^ 1)) & 255)))(cObjectFieldRef(cRecordObject(chip), "eg_state"));
  while (((writebuf = cPointerOffset(cRecordObject(chip).writebuf, cRecordObject(chip).writebuf_cur, 16)), (cRecordObject(writebuf).time <= cRecordObject(chip).writebuf_samplecnt))) {
    if ((!Boolean(i32((i32(cRecordObject(writebuf).reg) & 512))))) {
      break;
    }
    ((__cxx_lvalue_11) => (__cxx_lvalue_11.value = (((__cxx_lvalue_11.value & 511)) & 65535)))(cObjectFieldRef(cRecordObject(writebuf), "reg"));
    OPL3_WriteReg(chip, cRecordObject(writebuf).reg, cRecordObject(writebuf).data);
    (cRecordObject(chip).writebuf_cur = u32((u32((cRecordObject(chip).writebuf_cur + u32(1))) & u32(i32((1024 - 1))))));
  }
  ((__cxx_lvalue_12) => { const previous = __cxx_lvalue_12.value; const next = u64((previous + 1n)); __cxx_lvalue_12.value = next; return previous; })(cObjectFieldRef(cRecordObject(chip), "writebuf_samplecnt"));
}

// C/C++ source: source/audiolib/src/opl3.cpp:1241
export function OPL3_GenerateResampled(chip, buf) {
  while ((cRecordObject(chip).samplecnt >= cRecordObject(chip).rateratio)) {
    ((cDeref(cPointerOffset(cRecordObject(chip).oldsamples, 0, Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = ((((cDeref(cPointerOffset(cRecordObject(chip).samples, 0, Int16Array.BYTES_PER_ELEMENT), Int16Array).value)) << 16) >> 16));
    ((cDeref(cPointerOffset(cRecordObject(chip).oldsamples, 1, Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = ((((cDeref(cPointerOffset(cRecordObject(chip).samples, 1, Int16Array.BYTES_PER_ELEMENT), Int16Array).value)) << 16) >> 16));
    OPL3_Generate(chip, cRecordObject(chip).samples);
    ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = i32((Number(__cxx_lvalue_0.value) - Number(cRecordObject(chip).rateratio)))))(cObjectFieldRef(cRecordObject(chip), "samplecnt"));
  }
  ((cDeref(cPointerOffset(buf, 0, Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = (((((((((Math.trunc(i32((i32(Math.imul(i32((cDeref(cPointerOffset(cRecordObject(chip).oldsamples, 0, Int16Array.BYTES_PER_ELEMENT), Int16Array).value)), i32((cRecordObject(chip).rateratio - cRecordObject(chip).samplecnt)))) + i32(Math.imul(i32((cDeref(cPointerOffset(cRecordObject(chip).samples, 0, Int16Array.BYTES_PER_ELEMENT), Int16Array).value)), cRecordObject(chip).samplecnt)))) / cRecordObject(chip).rateratio)) << 16) >> 16)) << 16) >> 16)) << 16) >> 16));
  ((cDeref(cPointerOffset(buf, 1, Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = (((((((((Math.trunc(i32((i32(Math.imul(i32((cDeref(cPointerOffset(cRecordObject(chip).oldsamples, 1, Int16Array.BYTES_PER_ELEMENT), Int16Array).value)), i32((cRecordObject(chip).rateratio - cRecordObject(chip).samplecnt)))) + i32(Math.imul(i32((cDeref(cPointerOffset(cRecordObject(chip).samples, 1, Int16Array.BYTES_PER_ELEMENT), Int16Array).value)), cRecordObject(chip).samplecnt)))) / cRecordObject(chip).rateratio)) << 16) >> 16)) << 16) >> 16)) << 16) >> 16));
  ((__cxx_lvalue_1) => (__cxx_lvalue_1.value = i32((Number(__cxx_lvalue_1.value) + Number(i32((1 << 10)))))))(cObjectFieldRef(cRecordObject(chip), "samplecnt"));
}

// C/C++ source: source/audiolib/src/opl3.cpp:1326
export function OPL3_WriteReg(chip, reg, v) {
  let high = ((((i32((i32((i32(reg) >> 8)) & 1))) & 255)) & 255);
  let regm = ((((i32((i32(reg) & 255))) & 255)) & 255);
  switch (i32((i32(regm) & 240))) {
    case 0: {
      if (Boolean(high)) {
        switch (i32((i32(regm) & 15))) {
          case 4: {
            OPL3_ChannelSet4Op(chip, v);
          }
          break;
          case 5: {
            (cRecordObject(chip).newm = ((((i32((i32(v) & 1))) & 255)) & 255));
          }
          (cRecordObject(chip).stereoext = ((((i32((i32((i32(v) >> 1)) & 1))) & 255)) & 255));
          break;
        }
      } else {
        switch (i32((i32(regm) & 15))) {
          case 8: {
            (cRecordObject(chip).nts = ((((i32((i32((i32(v) >> 6)) & 1))) & 255)) & 255));
          }
          break;
        }
      }
    }
    break;
    case 32:
    case 48: {
      if ((i32((cDeref(cPointerOffset(ad_slot, u32((u32(regm) & 31)), Int8Array.BYTES_PER_ELEMENT), Int8Array).value)) >= 0)) {
        OPL3_SlotWrite20(cPointerOffset(cRecordObject(chip).slot, u32((u32(Math.imul(18, u32(high))) + u32((cDeref(cPointerOffset(ad_slot, u32((u32(regm) & 31)), Int8Array.BYTES_PER_ELEMENT), Int8Array).value)))), 72), v);
      }
    }
    break;
    case 64:
    case 80: {
      if ((i32((cDeref(cPointerOffset(ad_slot, u32((u32(regm) & 31)), Int8Array.BYTES_PER_ELEMENT), Int8Array).value)) >= 0)) {
        OPL3_SlotWrite40(cPointerOffset(cRecordObject(chip).slot, u32((u32(Math.imul(18, u32(high))) + u32((cDeref(cPointerOffset(ad_slot, u32((u32(regm) & 31)), Int8Array.BYTES_PER_ELEMENT), Int8Array).value)))), 72), v);
      }
    }
    break;
    case 96:
    case 112: {
      if ((i32((cDeref(cPointerOffset(ad_slot, u32((u32(regm) & 31)), Int8Array.BYTES_PER_ELEMENT), Int8Array).value)) >= 0)) {
        OPL3_SlotWrite60(cPointerOffset(cRecordObject(chip).slot, u32((u32(Math.imul(18, u32(high))) + u32((cDeref(cPointerOffset(ad_slot, u32((u32(regm) & 31)), Int8Array.BYTES_PER_ELEMENT), Int8Array).value)))), 72), v);
      }
    }
    break;
    case 128:
    case 144: {
      if ((i32((cDeref(cPointerOffset(ad_slot, u32((u32(regm) & 31)), Int8Array.BYTES_PER_ELEMENT), Int8Array).value)) >= 0)) {
        OPL3_SlotWrite80(cPointerOffset(cRecordObject(chip).slot, u32((u32(Math.imul(18, u32(high))) + u32((cDeref(cPointerOffset(ad_slot, u32((u32(regm) & 31)), Int8Array.BYTES_PER_ELEMENT), Int8Array).value)))), 72), v);
      }
    }
    break;
    case 224:
    case 240: {
      if ((i32((cDeref(cPointerOffset(ad_slot, u32((u32(regm) & 31)), Int8Array.BYTES_PER_ELEMENT), Int8Array).value)) >= 0)) {
        OPL3_SlotWriteE0(cPointerOffset(cRecordObject(chip).slot, u32((u32(Math.imul(18, u32(high))) + u32((cDeref(cPointerOffset(ad_slot, u32((u32(regm) & 31)), Int8Array.BYTES_PER_ELEMENT), Int8Array).value)))), 72), v);
      }
    }
    break;
    case 160: {
      if ((i32((i32(regm) & 15)) < 9)) {
        OPL3_ChannelWriteA0(cPointerOffset(cRecordObject(chip).channel, u32((u32(Math.imul(9, u32(high))) + u32((u32(regm) & 15)))), 88), v);
      }
    }
    break;
    case 176: {
      if (((i32(regm) == 189) && (!Boolean(high)))) {
        (cRecordObject(chip).tremoloshift = ((((i32((i32((i32((i32((i32(v) >> 7)) ^ 1)) << 1)) + 2))) & 255)) & 255));
        (cRecordObject(chip).vibshift = ((((i32((i32((i32((i32(v) >> 6)) & 1)) ^ 1))) & 255)) & 255));
        OPL3_ChannelUpdateRhythm(chip, v);
      } else {
        if ((i32((i32(regm) & 15)) < 9)) {
          OPL3_ChannelWriteB0(cPointerOffset(cRecordObject(chip).channel, u32((u32(Math.imul(9, u32(high))) + u32((u32(regm) & 15)))), 88), v);
          if (Boolean(i32((i32(v) & 32)))) {
            OPL3_ChannelKeyOn(cPointerOffset(cRecordObject(chip).channel, u32((u32(Math.imul(9, u32(high))) + u32((u32(regm) & 15)))), 88));
          } else {
            OPL3_ChannelKeyOff(cPointerOffset(cRecordObject(chip).channel, u32((u32(Math.imul(9, u32(high))) + u32((u32(regm) & 15)))), 88));
          }
        }
      }
    }
    break;
    case 192: {
      if ((i32((i32(regm) & 15)) < 9)) {
        OPL3_ChannelWriteC0(cPointerOffset(cRecordObject(chip).channel, u32((u32(Math.imul(9, u32(high))) + u32((u32(regm) & 15)))), 88), v);
      }
    }
    break;
    case 208: {
      if ((i32((i32(regm) & 15)) < 9)) {
        OPL3_ChannelWriteD0(cPointerOffset(cRecordObject(chip).channel, u32((u32(Math.imul(9, u32(high))) + u32((u32(regm) & 15)))), 88), v);
      }
    }
    break;
  }
}

// C/C++ source: source/audiolib/src/opl3.cpp:1436
export function OPL3_WriteRegBuffered(chip, reg, v) {
  let time1;
  let time2;
  let writebuf;
  let writebuf_last;
  (writebuf_last = u32(cRecordObject(chip).writebuf_last));
  (writebuf = cPointerOffset(cRecordObject(chip).writebuf, writebuf_last, 16));
  if (Boolean(i32((i32(cRecordObject(writebuf).reg) & 512)))) {
    OPL3_WriteReg(chip, ((i32((i32(cRecordObject(writebuf).reg) & 511))) & 65535), cRecordObject(writebuf).data);
    (cRecordObject(chip).writebuf_cur = u32((u32((writebuf_last + u32(1))) & u32(i32((1024 - 1))))));
    (cRecordObject(chip).writebuf_samplecnt = u64(cRecordObject(writebuf).time));
  }
  (cRecordObject(writebuf).reg = ((((i32((i32(reg) | 512))) & 65535)) & 65535));
  (cRecordObject(writebuf).data = ((v) & 255));
  (time1 = u64((BigInt(cRecordObject(chip).writebuf_lasttime) + BigInt(u64(2)))));
  (time2 = u64(cRecordObject(chip).writebuf_samplecnt));
  if ((time1 < time2)) {
    (time1 = u64(time2));
  }
  (cRecordObject(writebuf).time = u64(time1));
  (cRecordObject(chip).writebuf_lasttime = u64(time1));
  (cRecordObject(chip).writebuf_last = u32((u32((writebuf_last + u32(1))) & u32(i32((1024 - 1))))));
}

// C/C++ source: source/audiolib/src/opl3.cpp:1468
export function OPL3_GenerateStream(chip, sndptr, numsamples) {
  let i;
  for ((i = u32(0)); (i < numsamples); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = u32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; }))) {
    OPL3_GenerateResampled(chip, sndptr);
    (sndptr = cPointerOffset(sndptr, 2, Int16Array.BYTES_PER_ELEMENT));
  }
}

// C/C++ source: source/build/include/compat.h:1169
export const pow2char__header_global_c62817cbe1b57b75 = new Uint8Array([((1) & 255), ((2) & 255), ((4) & 255), ((8) & 255), ((16) & 255), ((32) & 255), ((64) & 255), ((128) & 255)]);
function __cxx_static_address_1f83ac53cc95037494843b46() {
  return __cxx_static_address_1f83ac53cc95037494843b46.reference || (__cxx_static_address_1f83ac53cc95037494843b46.reference = {
    __cReference: true,
    get value() { return pow2char__header_global_c62817cbe1b57b75; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
