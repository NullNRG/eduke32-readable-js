// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/duke3d/src/cmdline.cpp
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
export const fix16_rad_to_deg_mult__header_global_007a652e81fba92a = i32(3754936);
function __cxx_static_address_00035861a96681278ff209b3() {
  return __cxx_static_address_00035861a96681278ff209b3.reference || (__cxx_static_address_00035861a96681278ff209b3.reference = {
    __cReference: true,
    get value() { return fix16_rad_to_deg_mult__header_global_007a652e81fba92a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:114
export const fix16_deg_to_rad_mult__header_global_b8fa2a772bbf1a74 = i32(1144);
function __cxx_static_address_63c2401293fe79a471bf99fc() {
  return __cxx_static_address_63c2401293fe79a471bf99fc.reference || (__cxx_static_address_63c2401293fe79a471bf99fc.reference = {
    __cReference: true,
    get value() { return fix16_deg_to_rad_mult__header_global_b8fa2a772bbf1a74; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:43
export const KICK_HIT____header_global_9f6d8f254aaa3ecc = ((((((0) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_67a6ae04e682d6a36c5fb229() {
  return __cxx_static_address_67a6ae04e682d6a36c5fb229.reference || (__cxx_static_address_67a6ae04e682d6a36c5fb229.reference = {
    __cReference: true,
    get value() { return KICK_HIT____header_global_9f6d8f254aaa3ecc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:44
export const PISTOL_RICOCHET____header_global_a108535c9c512c03 = ((((((1) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e549f51ffb731675b1889945() {
  return __cxx_static_address_e549f51ffb731675b1889945.reference || (__cxx_static_address_e549f51ffb731675b1889945.reference = {
    __cReference: true,
    get value() { return PISTOL_RICOCHET____header_global_a108535c9c512c03; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:45
export const PISTOL_BODYHIT____header_global_61155ec8cbd6a40b = ((((((2) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e66f1eb625d713afb76be67c() {
  return __cxx_static_address_e66f1eb625d713afb76be67c.reference || (__cxx_static_address_e66f1eb625d713afb76be67c.reference = {
    __cReference: true,
    get value() { return PISTOL_BODYHIT____header_global_61155ec8cbd6a40b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:46
export const PISTOL_FIRE____header_global_8d7b1ed89194ce0c = ((((((3) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b1169fff601136edb80fcc32() {
  return __cxx_static_address_b1169fff601136edb80fcc32.reference || (__cxx_static_address_b1169fff601136edb80fcc32.reference = {
    __cReference: true,
    get value() { return PISTOL_FIRE____header_global_8d7b1ed89194ce0c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:47
export const EJECT_CLIP____header_global_1c7b9ba2c342140e = ((((((4) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_349b5097d9fe79d5610dff17() {
  return __cxx_static_address_349b5097d9fe79d5610dff17.reference || (__cxx_static_address_349b5097d9fe79d5610dff17.reference = {
    __cReference: true,
    get value() { return EJECT_CLIP____header_global_1c7b9ba2c342140e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:48
export const INSERT_CLIP____header_global_0381f31984ce3bde = ((((((5) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_daaa2b420ba3da04465c3b15() {
  return __cxx_static_address_daaa2b420ba3da04465c3b15.reference || (__cxx_static_address_daaa2b420ba3da04465c3b15.reference = {
    __cReference: true,
    get value() { return INSERT_CLIP____header_global_0381f31984ce3bde; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:49
export const CHAINGUN_FIRE____header_global_3234fe925ab41c16 = ((((((6) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a06da8d00dd49395a2e80424() {
  return __cxx_static_address_a06da8d00dd49395a2e80424.reference || (__cxx_static_address_a06da8d00dd49395a2e80424.reference = {
    __cReference: true,
    get value() { return CHAINGUN_FIRE____header_global_3234fe925ab41c16; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:50
export const RPG_SHOOT____header_global_c78c1ca3f2a93e70 = ((((((7) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_48b0c4800cc68c8feef07745() {
  return __cxx_static_address_48b0c4800cc68c8feef07745.reference || (__cxx_static_address_48b0c4800cc68c8feef07745.reference = {
    __cReference: true,
    get value() { return RPG_SHOOT____header_global_c78c1ca3f2a93e70; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:51
export const POOLBALLHIT____header_global_0272b2a0d8a048dc = ((((((8) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0a80b36ac87b998d1a20e87d() {
  return __cxx_static_address_0a80b36ac87b998d1a20e87d.reference || (__cxx_static_address_0a80b36ac87b998d1a20e87d.reference = {
    __cReference: true,
    get value() { return POOLBALLHIT____header_global_0272b2a0d8a048dc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:52
export const RPG_EXPLODE____header_global_8826cc64e732177a = ((((((9) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_165b682805f99dc79f89407b() {
  return __cxx_static_address_165b682805f99dc79f89407b.reference || (__cxx_static_address_165b682805f99dc79f89407b.reference = {
    __cReference: true,
    get value() { return RPG_EXPLODE____header_global_8826cc64e732177a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:53
export const CAT_FIRE____header_global_3f9c56e78b6f0fe6 = ((((((10) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bb442807e734f679eb00eb0c() {
  return __cxx_static_address_bb442807e734f679eb00eb0c.reference || (__cxx_static_address_bb442807e734f679eb00eb0c.reference = {
    __cReference: true,
    get value() { return CAT_FIRE____header_global_3f9c56e78b6f0fe6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:54
export const SHRINKER_FIRE____header_global_3abf55f5a0915967 = ((((((11) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c3e03450255ba69e284e2de6() {
  return __cxx_static_address_c3e03450255ba69e284e2de6.reference || (__cxx_static_address_c3e03450255ba69e284e2de6.reference = {
    __cReference: true,
    get value() { return SHRINKER_FIRE____header_global_3abf55f5a0915967; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:55
export const PIPEBOMB_BOUNCE____header_global_d5191e8da434519d = ((((((13) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_614d10ca175295894abf3df5() {
  return __cxx_static_address_614d10ca175295894abf3df5.reference || (__cxx_static_address_614d10ca175295894abf3df5.reference = {
    __cReference: true,
    get value() { return PIPEBOMB_BOUNCE____header_global_d5191e8da434519d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:56
export const PIPEBOMB_EXPLODE____header_global_387ecf65942e8c30 = ((((((14) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_41313f4e7944be08dd306012() {
  return __cxx_static_address_41313f4e7944be08dd306012.reference || (__cxx_static_address_41313f4e7944be08dd306012.reference = {
    __cReference: true,
    get value() { return PIPEBOMB_EXPLODE____header_global_387ecf65942e8c30; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:57
export const LASERTRIP_ONWALL____header_global_b4f43d816a53adce = ((((((15) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4cce1f04c69621dbc3e5b7f8() {
  return __cxx_static_address_4cce1f04c69621dbc3e5b7f8.reference || (__cxx_static_address_4cce1f04c69621dbc3e5b7f8.reference = {
    __cReference: true,
    get value() { return LASERTRIP_ONWALL____header_global_b4f43d816a53adce; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:58
export const LASERTRIP_ARMING____header_global_a7f08914863463a3 = ((((((16) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f4c8c57ced98ea582dead621() {
  return __cxx_static_address_f4c8c57ced98ea582dead621.reference || (__cxx_static_address_f4c8c57ced98ea582dead621.reference = {
    __cReference: true,
    get value() { return LASERTRIP_ARMING____header_global_a7f08914863463a3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:59
export const LASERTRIP_EXPLODE____header_global_ddb29b529d70f049 = ((((((17) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_de099044711fd23bd670ab42() {
  return __cxx_static_address_de099044711fd23bd670ab42.reference || (__cxx_static_address_de099044711fd23bd670ab42.reference = {
    __cReference: true,
    get value() { return LASERTRIP_EXPLODE____header_global_ddb29b529d70f049; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:60
export const VENT_BUST____header_global_f7d700fd2e7da599 = ((((((18) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6e28b2fcb9a3c7acdfc4e195() {
  return __cxx_static_address_6e28b2fcb9a3c7acdfc4e195.reference || (__cxx_static_address_6e28b2fcb9a3c7acdfc4e195.reference = {
    __cReference: true,
    get value() { return VENT_BUST____header_global_f7d700fd2e7da599; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:61
export const GLASS_BREAKING____header_global_18be57bf68bc6283 = ((((((19) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b5333e44087df39fbd9d2b2d() {
  return __cxx_static_address_b5333e44087df39fbd9d2b2d.reference || (__cxx_static_address_b5333e44087df39fbd9d2b2d.reference = {
    __cReference: true,
    get value() { return GLASS_BREAKING____header_global_18be57bf68bc6283; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:62
export const GLASS_HEAVYBREAK____header_global_54386a797031420d = ((((((20) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3947056f78f8d719889734da() {
  return __cxx_static_address_3947056f78f8d719889734da.reference || (__cxx_static_address_3947056f78f8d719889734da.reference = {
    __cReference: true,
    get value() { return GLASS_HEAVYBREAK____header_global_54386a797031420d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:63
export const SHORT_CIRCUIT____header_global_8592a3a0ce2c759f = ((((((21) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_84861614256bf32e39bdd6b2() {
  return __cxx_static_address_84861614256bf32e39bdd6b2.reference || (__cxx_static_address_84861614256bf32e39bdd6b2.reference = {
    __cReference: true,
    get value() { return SHORT_CIRCUIT____header_global_8592a3a0ce2c759f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:64
export const ITEM_SPLASH____header_global_e1a677c9bb2dbbd2 = ((((((22) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2476cf4d6d3276d68f06d925() {
  return __cxx_static_address_2476cf4d6d3276d68f06d925.reference || (__cxx_static_address_2476cf4d6d3276d68f06d925.reference = {
    __cReference: true,
    get value() { return ITEM_SPLASH____header_global_e1a677c9bb2dbbd2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:65
export const DUKE_GASP____header_global_c52d62c26cbe492d = ((((((25) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bef968fd7dd5ee2ae2a873c3() {
  return __cxx_static_address_bef968fd7dd5ee2ae2a873c3.reference || (__cxx_static_address_bef968fd7dd5ee2ae2a873c3.reference = {
    __cReference: true,
    get value() { return DUKE_GASP____header_global_c52d62c26cbe492d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:66
export const SLIM_RECOG____header_global_7b55f7255eaa739e = ((((((26) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_41a6eb137b06ff1539db1487() {
  return __cxx_static_address_41a6eb137b06ff1539db1487.reference || (__cxx_static_address_41a6eb137b06ff1539db1487.reference = {
    __cReference: true,
    get value() { return SLIM_RECOG____header_global_7b55f7255eaa739e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:67
export const DUKE_URINATE____header_global_a750ba8b01eecf00 = ((((((28) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7b9ba384016e080d53096ca9() {
  return __cxx_static_address_7b9ba384016e080d53096ca9.reference || (__cxx_static_address_7b9ba384016e080d53096ca9.reference = {
    __cReference: true,
    get value() { return DUKE_URINATE____header_global_a750ba8b01eecf00; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:68
export const ENDSEQVOL3SND2____header_global_31540cfaecfb7554 = ((((((29) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dcc1c79482af5507ef77dba2() {
  return __cxx_static_address_dcc1c79482af5507ef77dba2.reference || (__cxx_static_address_dcc1c79482af5507ef77dba2.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND2____header_global_31540cfaecfb7554; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:69
export const ENDSEQVOL3SND3____header_global_32c53be1a608825a = ((((((30) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_51149d7d8967bc31d0c006a2() {
  return __cxx_static_address_51149d7d8967bc31d0c006a2.reference || (__cxx_static_address_51149d7d8967bc31d0c006a2.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND3____header_global_32c53be1a608825a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:70
export const DUKE_CRACK____header_global_449b20c1e0abd047 = ((((((33) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_852f800a4bf0935fbc1d0351() {
  return __cxx_static_address_852f800a4bf0935fbc1d0351.reference || (__cxx_static_address_852f800a4bf0935fbc1d0351.reference = {
    __cReference: true,
    get value() { return DUKE_CRACK____header_global_449b20c1e0abd047; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:71
export const SLIM_ATTACK____header_global_5eba6e1e0627d3d4 = ((((((34) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7ae5f03ab00dee8d32dcc109() {
  return __cxx_static_address_7ae5f03ab00dee8d32dcc109.reference || (__cxx_static_address_7ae5f03ab00dee8d32dcc109.reference = {
    __cReference: true,
    get value() { return SLIM_ATTACK____header_global_5eba6e1e0627d3d4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:72
export const SOMETHINGHITFORCE____header_global_170811527d373982 = ((((((35) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_846b18e5a87c9a67efecce6d() {
  return __cxx_static_address_846b18e5a87c9a67efecce6d.reference || (__cxx_static_address_846b18e5a87c9a67efecce6d.reference = {
    __cReference: true,
    get value() { return SOMETHINGHITFORCE____header_global_170811527d373982; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:73
export const DUKE_DRINKING____header_global_8c466cef2cb2b333 = ((((((36) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ac894e3d590256d11137a79c() {
  return __cxx_static_address_ac894e3d590256d11137a79c.reference || (__cxx_static_address_ac894e3d590256d11137a79c.reference = {
    __cReference: true,
    get value() { return DUKE_DRINKING____header_global_8c466cef2cb2b333; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:74
export const DUKE_GRUNT____header_global_5378ffd06692cc06 = ((((((38) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e94e4afa29483a752e34efb3() {
  return __cxx_static_address_e94e4afa29483a752e34efb3.reference || (__cxx_static_address_e94e4afa29483a752e34efb3.reference = {
    __cReference: true,
    get value() { return DUKE_GRUNT____header_global_5378ffd06692cc06; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:75
export const DUKE_HARTBEAT____header_global_9bd2ca83df71cf0c = ((((((39) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1409f03bedc692bdb96b6080() {
  return __cxx_static_address_1409f03bedc692bdb96b6080.reference || (__cxx_static_address_1409f03bedc692bdb96b6080.reference = {
    __cReference: true,
    get value() { return DUKE_HARTBEAT____header_global_9bd2ca83df71cf0c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:76
export const DUKE_ONWATER____header_global_4066026bac0f80ba = ((((((40) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f1648c4045da9daaf8a3256f() {
  return __cxx_static_address_f1648c4045da9daaf8a3256f.reference || (__cxx_static_address_f1648c4045da9daaf8a3256f.reference = {
    __cReference: true,
    get value() { return DUKE_ONWATER____header_global_4066026bac0f80ba; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:77
export const DUKE_LAND____header_global_d9fcb67921d6ecd9 = ((((((42) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_32ebe5cbfe7c44ce595abab8() {
  return __cxx_static_address_32ebe5cbfe7c44ce595abab8.reference || (__cxx_static_address_32ebe5cbfe7c44ce595abab8.reference = {
    __cReference: true,
    get value() { return DUKE_LAND____header_global_d9fcb67921d6ecd9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:78
export const DUKE_WALKINDUCTS____header_global_5caff785b5494b9c = ((((((43) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_92448ac374ac8d6a34f8e74c() {
  return __cxx_static_address_92448ac374ac8d6a34f8e74c.reference || (__cxx_static_address_92448ac374ac8d6a34f8e74c.reference = {
    __cReference: true,
    get value() { return DUKE_WALKINDUCTS____header_global_5caff785b5494b9c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:79
export const DUKE_UNDERWATER____header_global_c2b82ca1b9aa0521 = ((((((48) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_85105979159d94522ea303f3() {
  return __cxx_static_address_85105979159d94522ea303f3.reference || (__cxx_static_address_85105979159d94522ea303f3.reference = {
    __cReference: true,
    get value() { return DUKE_UNDERWATER____header_global_c2b82ca1b9aa0521; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:80
export const DUKE_JETPACK_ON____header_global_6ad1d0fa667ab12d = ((((((49) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_980415bb5789d8d13da0e361() {
  return __cxx_static_address_980415bb5789d8d13da0e361.reference || (__cxx_static_address_980415bb5789d8d13da0e361.reference = {
    __cReference: true,
    get value() { return DUKE_JETPACK_ON____header_global_6ad1d0fa667ab12d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:81
export const DUKE_JETPACK_IDLE____header_global_752e65427e22b03d = ((((((50) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e25413e5cad833e2e5a5c68d() {
  return __cxx_static_address_e25413e5cad833e2e5a5c68d.reference || (__cxx_static_address_e25413e5cad833e2e5a5c68d.reference = {
    __cReference: true,
    get value() { return DUKE_JETPACK_IDLE____header_global_752e65427e22b03d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:82
export const DUKE_JETPACK_OFF____header_global_2d975614ff37045e = ((((((51) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2cf76f4a78a19ebc7750b1c6() {
  return __cxx_static_address_2cf76f4a78a19ebc7750b1c6.reference || (__cxx_static_address_2cf76f4a78a19ebc7750b1c6.reference = {
    __cReference: true,
    get value() { return DUKE_JETPACK_OFF____header_global_2d975614ff37045e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:83
export const DUKETALKTOBOSS____header_global_c8fe9db799af8055 = ((((((56) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c47ecdf33764f6cdddd9b417() {
  return __cxx_static_address_c47ecdf33764f6cdddd9b417.reference || (__cxx_static_address_c47ecdf33764f6cdddd9b417.reference = {
    __cReference: true,
    get value() { return DUKETALKTOBOSS____header_global_c8fe9db799af8055; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:84
export const SQUISHED____header_global_5e1795d55696e6dc = ((((((69) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ae38978b1d39e2e0d2855b7a() {
  return __cxx_static_address_ae38978b1d39e2e0d2855b7a.reference || (__cxx_static_address_ae38978b1d39e2e0d2855b7a.reference = {
    __cReference: true,
    get value() { return SQUISHED____header_global_5e1795d55696e6dc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:85
export const TELEPORTER____header_global_bfef21bf41bd4ea2 = ((((((70) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c66089da480f3383d8e3aea1() {
  return __cxx_static_address_c66089da480f3383d8e3aea1.reference || (__cxx_static_address_c66089da480f3383d8e3aea1.reference = {
    __cReference: true,
    get value() { return TELEPORTER____header_global_bfef21bf41bd4ea2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:86
export const ELEVATOR_ON____header_global_ac7d8afba6d65a14 = ((((((71) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f6b24283cad1ce154e973d68() {
  return __cxx_static_address_f6b24283cad1ce154e973d68.reference || (__cxx_static_address_f6b24283cad1ce154e973d68.reference = {
    __cReference: true,
    get value() { return ELEVATOR_ON____header_global_ac7d8afba6d65a14; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:87
export const ELEVATOR_OFF____header_global_cc41022931ca9f3f = ((((((73) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_79647b42184dbb9b24ff3c8c() {
  return __cxx_static_address_79647b42184dbb9b24ff3c8c.reference || (__cxx_static_address_79647b42184dbb9b24ff3c8c.reference = {
    __cReference: true,
    get value() { return ELEVATOR_OFF____header_global_cc41022931ca9f3f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:88
export const SUBWAY____header_global_f6ea4eb18db1bff0 = ((((((75) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c720e6b94660825f1c0aa18d() {
  return __cxx_static_address_c720e6b94660825f1c0aa18d.reference || (__cxx_static_address_c720e6b94660825f1c0aa18d.reference = {
    __cReference: true,
    get value() { return SUBWAY____header_global_f6ea4eb18db1bff0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:89
export const SWITCH_ON____header_global_5ac369f60e8743a7 = ((((((76) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8abf657e383568256816188c() {
  return __cxx_static_address_8abf657e383568256816188c.reference || (__cxx_static_address_8abf657e383568256816188c.reference = {
    __cReference: true,
    get value() { return SWITCH_ON____header_global_5ac369f60e8743a7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:90
export const FLUSH_TOILET____header_global_1e56e4c1a4881bcd = ((((((79) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_09d9fb7a89a8d0b31fce0127() {
  return __cxx_static_address_09d9fb7a89a8d0b31fce0127.reference || (__cxx_static_address_09d9fb7a89a8d0b31fce0127.reference = {
    __cReference: true,
    get value() { return FLUSH_TOILET____header_global_1e56e4c1a4881bcd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:91
export const EARTHQUAKE____header_global_a3816fcd421a7484 = ((((((81) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c318113785e913b8ddf30b0a() {
  return __cxx_static_address_c318113785e913b8ddf30b0a.reference || (__cxx_static_address_c318113785e913b8ddf30b0a.reference = {
    __cReference: true,
    get value() { return EARTHQUAKE____header_global_a3816fcd421a7484; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:92
export const END_OF_LEVEL_WARN____header_global_43fb6c21b565f26f = ((((((83) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3dc0181fe021affdc0bd31ef() {
  return __cxx_static_address_3dc0181fe021affdc0bd31ef.reference || (__cxx_static_address_3dc0181fe021affdc0bd31ef.reference = {
    __cReference: true,
    get value() { return END_OF_LEVEL_WARN____header_global_43fb6c21b565f26f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:93
export const WIND_AMBIENCE____header_global_5edd8b9299cd42ef = ((((((91) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_91bc5aad4fbcd3d2df285ea7() {
  return __cxx_static_address_91bc5aad4fbcd3d2df285ea7.reference || (__cxx_static_address_91bc5aad4fbcd3d2df285ea7.reference = {
    __cReference: true,
    get value() { return WIND_AMBIENCE____header_global_5edd8b9299cd42ef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:94
export const SOMETHING_DRIPPING____header_global_2a8d8df9e7614013 = ((((((92) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e88273a6af34c4d8f1dbdfb3() {
  return __cxx_static_address_e88273a6af34c4d8f1dbdfb3.reference || (__cxx_static_address_e88273a6af34c4d8f1dbdfb3.reference = {
    __cReference: true,
    get value() { return SOMETHING_DRIPPING____header_global_2a8d8df9e7614013; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:95
export const BOS1_RECOG____header_global_4e2e5f5bfd231f55 = ((((((97) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_791c7c2fe96cf953f3a97b09() {
  return __cxx_static_address_791c7c2fe96cf953f3a97b09.reference || (__cxx_static_address_791c7c2fe96cf953f3a97b09.reference = {
    __cReference: true,
    get value() { return BOS1_RECOG____header_global_4e2e5f5bfd231f55; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:96
export const BOS2_RECOG____header_global_f39fd6e5ad411008 = ((((((102) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_772a7479eb4a0a84fdd8d1ff() {
  return __cxx_static_address_772a7479eb4a0a84fdd8d1ff.reference || (__cxx_static_address_772a7479eb4a0a84fdd8d1ff.reference = {
    __cReference: true,
    get value() { return BOS2_RECOG____header_global_f39fd6e5ad411008; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:97
export const DUKE_GETWEAPON2____header_global_8638f408e321ee94 = ((((((107) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7f7600e9ed2858c727d2564b() {
  return __cxx_static_address_7f7600e9ed2858c727d2564b.reference || (__cxx_static_address_7f7600e9ed2858c727d2564b.reference = {
    __cReference: true,
    get value() { return DUKE_GETWEAPON2____header_global_8638f408e321ee94; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:98
export const SHOTGUN_FIRE____header_global_66e2388aad031ae7 = ((((((109) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b93d4b8c301303549a6b2257() {
  return __cxx_static_address_b93d4b8c301303549a6b2257.reference || (__cxx_static_address_b93d4b8c301303549a6b2257.reference = {
    __cReference: true,
    get value() { return SHOTGUN_FIRE____header_global_66e2388aad031ae7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:99
export const PRED_RECOG____header_global_ee01a3d93c8cd821 = ((((((111) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b2ae8d4ad90f7208a9caa3b1() {
  return __cxx_static_address_b2ae8d4ad90f7208a9caa3b1.reference || (__cxx_static_address_b2ae8d4ad90f7208a9caa3b1.reference = {
    __cReference: true,
    get value() { return PRED_RECOG____header_global_ee01a3d93c8cd821; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:100
export const CAPT_RECOG____header_global_6a9db05bbc18c6e0 = ((((((117) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_067ceb239f02d227cc69a52d() {
  return __cxx_static_address_067ceb239f02d227cc69a52d.reference || (__cxx_static_address_067ceb239f02d227cc69a52d.reference = {
    __cReference: true,
    get value() { return CAPT_RECOG____header_global_6a9db05bbc18c6e0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:101
export const PIG_RECOG____header_global_5b1bfebbabda9faf = ((((((121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_67698bd1e25a93b0bec9ed7a() {
  return __cxx_static_address_67698bd1e25a93b0bec9ed7a.reference || (__cxx_static_address_67698bd1e25a93b0bec9ed7a.reference = {
    __cReference: true,
    get value() { return PIG_RECOG____header_global_5b1bfebbabda9faf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:102
export const RECO_ROAM____header_global_c9f8ff16f487e7f1 = ((((((125) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3d79d193115754813b4efce5() {
  return __cxx_static_address_3d79d193115754813b4efce5.reference || (__cxx_static_address_3d79d193115754813b4efce5.reference = {
    __cReference: true,
    get value() { return RECO_ROAM____header_global_c9f8ff16f487e7f1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:103
export const RECO_RECOG____header_global_0f0d8ef5cb26c12e = ((((((126) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9a79188f805c5f077199ca1e() {
  return __cxx_static_address_9a79188f805c5f077199ca1e.reference || (__cxx_static_address_9a79188f805c5f077199ca1e.reference = {
    __cReference: true,
    get value() { return RECO_RECOG____header_global_0f0d8ef5cb26c12e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:104
export const RECO_ATTACK____header_global_39d2881cff6c5eed = ((((((127) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_37885fc645f293417f6ff7cd() {
  return __cxx_static_address_37885fc645f293417f6ff7cd.reference || (__cxx_static_address_37885fc645f293417f6ff7cd.reference = {
    __cReference: true,
    get value() { return RECO_ATTACK____header_global_39d2881cff6c5eed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:105
export const RECO_PAIN____header_global_429c7ccf3791f6f3 = ((((((128) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b647ba8f2a52310015022da8() {
  return __cxx_static_address_b647ba8f2a52310015022da8.reference || (__cxx_static_address_b647ba8f2a52310015022da8.reference = {
    __cReference: true,
    get value() { return RECO_PAIN____header_global_429c7ccf3791f6f3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:106
export const DRON_RECOG____header_global_6112148901186afe = ((((((131) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_784685f20b74b0c95de64e8b() {
  return __cxx_static_address_784685f20b74b0c95de64e8b.reference || (__cxx_static_address_784685f20b74b0c95de64e8b.reference = {
    __cReference: true,
    get value() { return DRON_RECOG____header_global_6112148901186afe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:107
export const COMM_RECOG____header_global_545dcb8c4a4bfddb = ((((((136) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6e5f713cb6aed99ab69f33e1() {
  return __cxx_static_address_6e5f713cb6aed99ab69f33e1.reference || (__cxx_static_address_6e5f713cb6aed99ab69f33e1.reference = {
    __cReference: true,
    get value() { return COMM_RECOG____header_global_545dcb8c4a4bfddb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:108
export const OCTA_RECOG____header_global_6615b518589abb88 = ((((((141) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_86990c4513d053e0fd452c9f() {
  return __cxx_static_address_86990c4513d053e0fd452c9f.reference || (__cxx_static_address_86990c4513d053e0fd452c9f.reference = {
    __cReference: true,
    get value() { return OCTA_RECOG____header_global_6615b518589abb88; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:109
export const TURR_RECOG____header_global_1df61b28dd8d05e8 = ((((((146) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f423c1d16eed1ee35cec55b4() {
  return __cxx_static_address_f423c1d16eed1ee35cec55b4.reference || (__cxx_static_address_f423c1d16eed1ee35cec55b4.reference = {
    __cReference: true,
    get value() { return TURR_RECOG____header_global_1df61b28dd8d05e8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:110
export const SLIM_DYING____header_global_c211b74256ff27dd = ((((((149) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8fcdce8f7485bc7f4f7c21d5() {
  return __cxx_static_address_8fcdce8f7485bc7f4f7c21d5.reference || (__cxx_static_address_8fcdce8f7485bc7f4f7c21d5.reference = {
    __cReference: true,
    get value() { return SLIM_DYING____header_global_c211b74256ff27dd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:111
export const BOS3_RECOG____header_global_2ac3d1088cdd27c2 = ((((((151) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ac48948c5845eaab6a110673() {
  return __cxx_static_address_ac48948c5845eaab6a110673.reference || (__cxx_static_address_ac48948c5845eaab6a110673.reference = {
    __cReference: true,
    get value() { return BOS3_RECOG____header_global_2ac3d1088cdd27c2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:112
export const BOS1_WALK____header_global_4fc30a767c45fa97 = ((((((156) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_531146875d37a1626c381ee5() {
  return __cxx_static_address_531146875d37a1626c381ee5.reference || (__cxx_static_address_531146875d37a1626c381ee5.reference = {
    __cReference: true,
    get value() { return BOS1_WALK____header_global_4fc30a767c45fa97; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:113
export const THUD____header_global_038d282642566ae5 = ((((((158) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1a7cfdf6829543bbd84fee55() {
  return __cxx_static_address_1a7cfdf6829543bbd84fee55.reference || (__cxx_static_address_1a7cfdf6829543bbd84fee55.reference = {
    __cReference: true,
    get value() { return THUD____header_global_038d282642566ae5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:114
export const WIERDSHOT_FLY____header_global_adb46644c1e3c533 = ((((((160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_510d1378a49470cb3c19b3b4() {
  return __cxx_static_address_510d1378a49470cb3c19b3b4.reference || (__cxx_static_address_510d1378a49470cb3c19b3b4.reference = {
    __cReference: true,
    get value() { return WIERDSHOT_FLY____header_global_adb46644c1e3c533; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:115
export const SLIM_ROAM____header_global_8bdb4fefb1e48da3 = ((((((163) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_97f57aba98c3e86afbe8cf16() {
  return __cxx_static_address_97f57aba98c3e86afbe8cf16.reference || (__cxx_static_address_97f57aba98c3e86afbe8cf16.reference = {
    __cReference: true,
    get value() { return SLIM_ROAM____header_global_8bdb4fefb1e48da3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:116
export const SHOTGUN_COCK____header_global_f8c94bbaa3627a42 = ((((((169) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5a5d90d84aff4c085ead6fc0() {
  return __cxx_static_address_5a5d90d84aff4c085ead6fc0.reference || (__cxx_static_address_5a5d90d84aff4c085ead6fc0.reference = {
    __cReference: true,
    get value() { return SHOTGUN_COCK____header_global_f8c94bbaa3627a42; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:117
export const GENERIC_AMBIENCE17____header_global_5639b77bf3229b3e = ((((((177) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f53209b17e3ba7c7d97dd0e7() {
  return __cxx_static_address_f53209b17e3ba7c7d97dd0e7.reference || (__cxx_static_address_f53209b17e3ba7c7d97dd0e7.reference = {
    __cReference: true,
    get value() { return GENERIC_AMBIENCE17____header_global_5639b77bf3229b3e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:118
export const BONUS_SPEECH1____header_global_8e5aa674f0eceadb = ((((((195) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_62c374a0fa3f6ee3b9f9a986() {
  return __cxx_static_address_62c374a0fa3f6ee3b9f9a986.reference || (__cxx_static_address_62c374a0fa3f6ee3b9f9a986.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH1____header_global_8e5aa674f0eceadb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:119
export const BONUS_SPEECH2____header_global_329362b5b3c08035 = ((((((196) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4b8536e261d51b70288a11eb() {
  return __cxx_static_address_4b8536e261d51b70288a11eb.reference || (__cxx_static_address_4b8536e261d51b70288a11eb.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH2____header_global_329362b5b3c08035; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:120
export const BONUS_SPEECH3____header_global_1ddd7b1021d9a145 = ((((((197) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3fc58bfa509844b524215790() {
  return __cxx_static_address_3fc58bfa509844b524215790.reference || (__cxx_static_address_3fc58bfa509844b524215790.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH3____header_global_1ddd7b1021d9a145; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:121
export const BONUS_SPEECH4____header_global_1980490da8c9d996 = ((((((199) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dd4c3cb34217e20e756c8042() {
  return __cxx_static_address_dd4c3cb34217e20e756c8042.reference || (__cxx_static_address_dd4c3cb34217e20e756c8042.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH4____header_global_1980490da8c9d996; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:122
export const DUKE_LAND_HURT____header_global_b32746b65fb881dc = ((((((200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_23eecefc4aa8d68eba03f13b() {
  return __cxx_static_address_23eecefc4aa8d68eba03f13b.reference || (__cxx_static_address_23eecefc4aa8d68eba03f13b.reference = {
    __cReference: true,
    get value() { return DUKE_LAND_HURT____header_global_b32746b65fb881dc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:123
export const DUKE_SEARCH2____header_global_111052063187a23d = ((((((207) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2e2acc6434b93f0996b89fa2() {
  return __cxx_static_address_2e2acc6434b93f0996b89fa2.reference || (__cxx_static_address_2e2acc6434b93f0996b89fa2.reference = {
    __cReference: true,
    get value() { return DUKE_SEARCH2____header_global_111052063187a23d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:124
export const DUKE_CRACK2____header_global_6bdf142aa017a61d = ((((((208) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_94e7187b56bad714486dac75() {
  return __cxx_static_address_94e7187b56bad714486dac75.reference || (__cxx_static_address_94e7187b56bad714486dac75.reference = {
    __cReference: true,
    get value() { return DUKE_CRACK2____header_global_6bdf142aa017a61d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:125
export const DUKE_SEARCH____header_global_160c7c4fe92f97c3 = ((((((209) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_857c2fe8a899300ae73de262() {
  return __cxx_static_address_857c2fe8a899300ae73de262.reference || (__cxx_static_address_857c2fe8a899300ae73de262.reference = {
    __cReference: true,
    get value() { return DUKE_SEARCH____header_global_160c7c4fe92f97c3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:126
export const DUKE_GET____header_global_a02e2fa5bb10eef4 = ((((((210) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a91dfc43f356e31b5607ea1d() {
  return __cxx_static_address_a91dfc43f356e31b5607ea1d.reference || (__cxx_static_address_a91dfc43f356e31b5607ea1d.reference = {
    __cReference: true,
    get value() { return DUKE_GET____header_global_a02e2fa5bb10eef4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:127
export const DUKE_LONGTERM_PAIN____header_global_b55e048526550b8d = ((((((211) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_543adb6c55d5d6746892a42e() {
  return __cxx_static_address_543adb6c55d5d6746892a42e.reference || (__cxx_static_address_543adb6c55d5d6746892a42e.reference = {
    __cReference: true,
    get value() { return DUKE_LONGTERM_PAIN____header_global_b55e048526550b8d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:128
export const MONITOR_ACTIVE____header_global_7c884a7a7bd1e2eb = ((((((212) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_36a81c35665a549ee93b8d8d() {
  return __cxx_static_address_36a81c35665a549ee93b8d8d.reference || (__cxx_static_address_36a81c35665a549ee93b8d8d.reference = {
    __cReference: true,
    get value() { return MONITOR_ACTIVE____header_global_7c884a7a7bd1e2eb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:129
export const NITEVISION_ONOFF____header_global_11f2ab7fee8ae376 = ((((((213) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ea5b90848d55a200ee319bf3() {
  return __cxx_static_address_ea5b90848d55a200ee319bf3.reference || (__cxx_static_address_ea5b90848d55a200ee319bf3.reference = {
    __cReference: true,
    get value() { return NITEVISION_ONOFF____header_global_11f2ab7fee8ae376; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:130
export const DUKE_CRACK_FIRST____header_global_138d3d66a8f7fec0 = ((((((215) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2a1d4d6716c81dfcab8bf6c6() {
  return __cxx_static_address_2a1d4d6716c81dfcab8bf6c6.reference || (__cxx_static_address_2a1d4d6716c81dfcab8bf6c6.reference = {
    __cReference: true,
    get value() { return DUKE_CRACK_FIRST____header_global_138d3d66a8f7fec0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:131
export const DUKE_USEMEDKIT____header_global_9e48e5e87d6bf276 = ((((((216) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5c306bdca115cec315b4b097() {
  return __cxx_static_address_5c306bdca115cec315b4b097.reference || (__cxx_static_address_5c306bdca115cec315b4b097.reference = {
    __cReference: true,
    get value() { return DUKE_USEMEDKIT____header_global_9e48e5e87d6bf276; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:132
export const DUKE_TAKEPILLS____header_global_b3d14e5bce29f625 = ((((((217) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_69b5bf1f8710582d8baba3e8() {
  return __cxx_static_address_69b5bf1f8710582d8baba3e8.reference || (__cxx_static_address_69b5bf1f8710582d8baba3e8.reference = {
    __cReference: true,
    get value() { return DUKE_TAKEPILLS____header_global_b3d14e5bce29f625; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:133
export const DUKE_PISSRELIEF____header_global_e379dd8a4e707166 = ((((((218) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_63485c26ff13e27db0c1ab3f() {
  return __cxx_static_address_63485c26ff13e27db0c1ab3f.reference || (__cxx_static_address_63485c26ff13e27db0c1ab3f.reference = {
    __cReference: true,
    get value() { return DUKE_PISSRELIEF____header_global_e379dd8a4e707166; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:134
export const SELECT_WEAPON____header_global_41c18b728d55977d = ((((((219) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b999c5735d16decf68df2ab2() {
  return __cxx_static_address_b999c5735d16decf68df2ab2.reference || (__cxx_static_address_b999c5735d16decf68df2ab2.reference = {
    __cReference: true,
    get value() { return SELECT_WEAPON____header_global_41c18b728d55977d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:135
export const JIBBED_ACTOR5____header_global_bab1a82d05f01400 = ((((((226) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_60c3e7a359a3f84638a3cb14() {
  return __cxx_static_address_60c3e7a359a3f84638a3cb14.reference || (__cxx_static_address_60c3e7a359a3f84638a3cb14.reference = {
    __cReference: true,
    get value() { return JIBBED_ACTOR5____header_global_bab1a82d05f01400; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:136
export const JIBBED_ACTOR6____header_global_526287b6b201ccfb = ((((((227) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3a3555082c5f9dfc16b39e72() {
  return __cxx_static_address_3a3555082c5f9dfc16b39e72.reference || (__cxx_static_address_3a3555082c5f9dfc16b39e72.reference = {
    __cReference: true,
    get value() { return JIBBED_ACTOR6____header_global_526287b6b201ccfb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:137
export const DUKE_GOTHEALTHATLOW____header_global_2360390d60db7c27 = ((((((229) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b20fca9b3522a1015a7cad13() {
  return __cxx_static_address_b20fca9b3522a1015a7cad13.reference || (__cxx_static_address_b20fca9b3522a1015a7cad13.reference = {
    __cReference: true,
    get value() { return DUKE_GOTHEALTHATLOW____header_global_2360390d60db7c27; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:138
export const BOSSTALKTODUKE____header_global_3033abb9189d4ee4 = ((((((230) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5ce753329750079174621fa5() {
  return __cxx_static_address_5ce753329750079174621fa5.reference || (__cxx_static_address_5ce753329750079174621fa5.reference = {
    __cReference: true,
    get value() { return BOSSTALKTODUKE____header_global_3033abb9189d4ee4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:139
export const WAR_AMBIENCE2____header_global_f8fbcb23abe02865 = ((((((232) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_910f496d0dea7a5750deabee() {
  return __cxx_static_address_910f496d0dea7a5750deabee.reference || (__cxx_static_address_910f496d0dea7a5750deabee.reference = {
    __cReference: true,
    get value() { return WAR_AMBIENCE2____header_global_f8fbcb23abe02865; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:140
export const EXITMENUSOUND____header_global_53536885ce9ca7d2 = ((((((243) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d8786e0090f0e579980b62a8() {
  return __cxx_static_address_d8786e0090f0e579980b62a8.reference || (__cxx_static_address_d8786e0090f0e579980b62a8.reference = {
    __cReference: true,
    get value() { return EXITMENUSOUND____header_global_53536885ce9ca7d2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:141
export const FLY_BY____header_global_16694df8238d42f6 = ((((((244) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7c6209002a4314f7e948ed6c() {
  return __cxx_static_address_7c6209002a4314f7e948ed6c.reference || (__cxx_static_address_7c6209002a4314f7e948ed6c.reference = {
    __cReference: true,
    get value() { return FLY_BY____header_global_16694df8238d42f6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:142
export const DUKE_SCREAM____header_global_c839461b5e902b76 = ((((((245) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c8a482dbbe9ae5fa0bf51f77() {
  return __cxx_static_address_c8a482dbbe9ae5fa0bf51f77.reference || (__cxx_static_address_c8a482dbbe9ae5fa0bf51f77.reference = {
    __cReference: true,
    get value() { return DUKE_SCREAM____header_global_c839461b5e902b76; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:143
export const SHRINKER_HIT____header_global_8efe0fc6ecda9cca = ((((((246) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2452cd9bc72f17c03b3ff9a8() {
  return __cxx_static_address_2452cd9bc72f17c03b3ff9a8.reference || (__cxx_static_address_2452cd9bc72f17c03b3ff9a8.reference = {
    __cReference: true,
    get value() { return SHRINKER_HIT____header_global_8efe0fc6ecda9cca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:144
export const RATTY____header_global_d1079ce9af34bd74 = ((((((247) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3e9713f8839ffa571fdcf86d() {
  return __cxx_static_address_3e9713f8839ffa571fdcf86d.reference || (__cxx_static_address_3e9713f8839ffa571fdcf86d.reference = {
    __cReference: true,
    get value() { return RATTY____header_global_d1079ce9af34bd74; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:145
export const BONUSMUSIC____header_global_5a71113edee1b617 = ((((((249) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_008b9669fca90d56143f2f87() {
  return __cxx_static_address_008b9669fca90d56143f2f87.reference || (__cxx_static_address_008b9669fca90d56143f2f87.reference = {
    __cReference: true,
    get value() { return BONUSMUSIC____header_global_5a71113edee1b617; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:146
export const DUKE_GETWEAPON6____header_global_ca473230a729bda9 = ((((((264) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e136bda2b2831c40f809f504() {
  return __cxx_static_address_e136bda2b2831c40f809f504.reference || (__cxx_static_address_e136bda2b2831c40f809f504.reference = {
    __cReference: true,
    get value() { return DUKE_GETWEAPON6____header_global_ca473230a729bda9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:147
export const ALIEN_SWITCH1____header_global_61431be9dd534354 = ((((((272) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b3c94b4c9c4c62f127a92200() {
  return __cxx_static_address_b3c94b4c9c4c62f127a92200.reference || (__cxx_static_address_b3c94b4c9c4c62f127a92200.reference = {
    __cReference: true,
    get value() { return ALIEN_SWITCH1____header_global_61431be9dd534354; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:148
export const RIPHEADNECK____header_global_c412048f3cec3b0b = ((((((284) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_14e4f901b044539e2fd67414() {
  return __cxx_static_address_14e4f901b044539e2fd67414.reference || (__cxx_static_address_14e4f901b044539e2fd67414.reference = {
    __cReference: true,
    get value() { return RIPHEADNECK____header_global_c412048f3cec3b0b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:149
export const ENDSEQVOL3SND4____header_global_8b34517f6b9c8997 = ((((((288) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7f532121f4f447ddc768dff6() {
  return __cxx_static_address_7f532121f4f447ddc768dff6.reference || (__cxx_static_address_7f532121f4f447ddc768dff6.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND4____header_global_8b34517f6b9c8997; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:150
export const ENDSEQVOL3SND5____header_global_58df20a6898f6c38 = ((((((289) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1d89561394f34e3bd72cb952() {
  return __cxx_static_address_1d89561394f34e3bd72cb952.reference || (__cxx_static_address_1d89561394f34e3bd72cb952.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND5____header_global_58df20a6898f6c38; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:151
export const ENDSEQVOL3SND6____header_global_63d701fd3c8f1670 = ((((((290) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b346dbb87f84d0e6e71e8eed() {
  return __cxx_static_address_b346dbb87f84d0e6e71e8eed.reference || (__cxx_static_address_b346dbb87f84d0e6e71e8eed.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND6____header_global_63d701fd3c8f1670; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:152
export const ENDSEQVOL3SND7____header_global_030eb7c5804f54a6 = ((((((291) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_300e3188ebb559aec781e801() {
  return __cxx_static_address_300e3188ebb559aec781e801.reference || (__cxx_static_address_300e3188ebb559aec781e801.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND7____header_global_030eb7c5804f54a6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:153
export const ENDSEQVOL3SND8____header_global_cc0339d98f409267 = ((((((292) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4cb6794ea46285210fdfa782() {
  return __cxx_static_address_4cb6794ea46285210fdfa782.reference || (__cxx_static_address_4cb6794ea46285210fdfa782.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND8____header_global_cc0339d98f409267; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:154
export const ENDSEQVOL3SND9____header_global_957aeacce379f386 = ((((((293) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9ca7c18e5e223a16c782f48e() {
  return __cxx_static_address_9ca7c18e5e223a16c782f48e.reference || (__cxx_static_address_9ca7c18e5e223a16c782f48e.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND9____header_global_957aeacce379f386; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:155
export const WHIPYOURASS____header_global_1ff6c70557eb6bf1 = ((((((294) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_354b6994137144ce83306131() {
  return __cxx_static_address_354b6994137144ce83306131.reference || (__cxx_static_address_354b6994137144ce83306131.reference = {
    __cReference: true,
    get value() { return WHIPYOURASS____header_global_1ff6c70557eb6bf1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:156
export const ENDSEQVOL2SND1____header_global_2c3aa3b6ccc81b91 = ((((((295) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0d8beca559dafaa8c6b66887() {
  return __cxx_static_address_0d8beca559dafaa8c6b66887.reference || (__cxx_static_address_0d8beca559dafaa8c6b66887.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND1____header_global_2c3aa3b6ccc81b91; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:157
export const ENDSEQVOL2SND2____header_global_462325f2ce556736 = ((((((296) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_103ed38fc130e9aaf409f486() {
  return __cxx_static_address_103ed38fc130e9aaf409f486.reference || (__cxx_static_address_103ed38fc130e9aaf409f486.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND2____header_global_462325f2ce556736; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:158
export const ENDSEQVOL2SND3____header_global_ab31f4edec15ff5f = ((((((297) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9660e48f966f1b6f5bf022b0() {
  return __cxx_static_address_9660e48f966f1b6f5bf022b0.reference || (__cxx_static_address_9660e48f966f1b6f5bf022b0.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND3____header_global_ab31f4edec15ff5f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:159
export const ENDSEQVOL2SND4____header_global_d47568dd8f4469f4 = ((((((298) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_91b98d1b4e3cc777a1cfec67() {
  return __cxx_static_address_91b98d1b4e3cc777a1cfec67.reference || (__cxx_static_address_91b98d1b4e3cc777a1cfec67.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND4____header_global_d47568dd8f4469f4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:160
export const ENDSEQVOL2SND5____header_global_22df78b2f8e558e1 = ((((((299) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8f7b2a87fa7e83279de338e7() {
  return __cxx_static_address_8f7b2a87fa7e83279de338e7.reference || (__cxx_static_address_8f7b2a87fa7e83279de338e7.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND5____header_global_22df78b2f8e558e1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:161
export const ENDSEQVOL2SND6____header_global_da90972af354f94d = ((((((300) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_db967e87ebfab4dd6a4be253() {
  return __cxx_static_address_db967e87ebfab4dd6a4be253.reference || (__cxx_static_address_db967e87ebfab4dd6a4be253.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND6____header_global_da90972af354f94d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:162
export const ENDSEQVOL2SND7____header_global_8d8c1f77615015a6 = ((((((301) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_24deb4eb60cf565a5d113810() {
  return __cxx_static_address_24deb4eb60cf565a5d113810.reference || (__cxx_static_address_24deb4eb60cf565a5d113810.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND7____header_global_8d8c1f77615015a6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:163
export const SOMETHINGFROZE____header_global_e47107072d4fb3b6 = ((((((303) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_66597e45e33163dc7dd5aaef() {
  return __cxx_static_address_66597e45e33163dc7dd5aaef.reference || (__cxx_static_address_66597e45e33163dc7dd5aaef.reference = {
    __cReference: true,
    get value() { return SOMETHINGFROZE____header_global_e47107072d4fb3b6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:164
export const WIND_REPEAT____header_global_c7a647f89be72e29 = ((((((308) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f17b81f93fced83295719fdd() {
  return __cxx_static_address_f17b81f93fced83295719fdd.reference || (__cxx_static_address_f17b81f93fced83295719fdd.reference = {
    __cReference: true,
    get value() { return WIND_REPEAT____header_global_c7a647f89be72e29; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:165
export const BOS4_RECOG____header_global_156a96e8f807ffc8 = ((((((342) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f14180b46d0d26269dc9599d() {
  return __cxx_static_address_f14180b46d0d26269dc9599d.reference || (__cxx_static_address_f14180b46d0d26269dc9599d.reference = {
    __cReference: true,
    get value() { return BOS4_RECOG____header_global_156a96e8f807ffc8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:166
export const LIGHTNING_SLAP____header_global_8772268882230734 = ((((((351) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_18ea799c74b8f3d1308a121b() {
  return __cxx_static_address_18ea799c74b8f3d1308a121b.reference || (__cxx_static_address_18ea799c74b8f3d1308a121b.reference = {
    __cReference: true,
    get value() { return LIGHTNING_SLAP____header_global_8772268882230734; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:167
export const THUNDER____header_global_5788903bbeffbd47 = ((((((352) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2ec972efb8dd9014f92a2773() {
  return __cxx_static_address_2ec972efb8dd9014f92a2773.reference || (__cxx_static_address_2ec972efb8dd9014f92a2773.reference = {
    __cReference: true,
    get value() { return THUNDER____header_global_5788903bbeffbd47; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:168
export const INTRO4_1____header_global_2fbb0df31d1a78e5 = ((((((363) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5a5957e2bcda4d8e624fd873() {
  return __cxx_static_address_5a5957e2bcda4d8e624fd873.reference || (__cxx_static_address_5a5957e2bcda4d8e624fd873.reference = {
    __cReference: true,
    get value() { return INTRO4_1____header_global_2fbb0df31d1a78e5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:169
export const INTRO4_2____header_global_514f94969881cc3c = ((((((364) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f6ebf3307fd39aa9faddc3dc() {
  return __cxx_static_address_f6ebf3307fd39aa9faddc3dc.reference || (__cxx_static_address_f6ebf3307fd39aa9faddc3dc.reference = {
    __cReference: true,
    get value() { return INTRO4_2____header_global_514f94969881cc3c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:170
export const INTRO4_3____header_global_5a66eebaa960dcc0 = ((((((365) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cb44f12e9ac49db77c100ad9() {
  return __cxx_static_address_cb44f12e9ac49db77c100ad9.reference || (__cxx_static_address_cb44f12e9ac49db77c100ad9.reference = {
    __cReference: true,
    get value() { return INTRO4_3____header_global_5a66eebaa960dcc0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:171
export const INTRO4_4____header_global_5db394ea7c1bf7d4 = ((((((366) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6ed08979ccbe1c8d55ee01e3() {
  return __cxx_static_address_6ed08979ccbe1c8d55ee01e3.reference || (__cxx_static_address_6ed08979ccbe1c8d55ee01e3.reference = {
    __cReference: true,
    get value() { return INTRO4_4____header_global_5db394ea7c1bf7d4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:172
export const INTRO4_5____header_global_68e449cf9f73aa20 = ((((((367) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f05325cb823c5a03eee687fb() {
  return __cxx_static_address_f05325cb823c5a03eee687fb.reference || (__cxx_static_address_f05325cb823c5a03eee687fb.reference = {
    __cReference: true,
    get value() { return INTRO4_5____header_global_68e449cf9f73aa20; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:173
export const INTRO4_6____header_global_8fb340b0ce6e2bce = ((((((368) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_59c0afebeb899dbe46ac4a1a() {
  return __cxx_static_address_59c0afebeb899dbe46ac4a1a.reference || (__cxx_static_address_59c0afebeb899dbe46ac4a1a.reference = {
    __cReference: true,
    get value() { return INTRO4_6____header_global_8fb340b0ce6e2bce; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:174
export const BOSS4_DEADSPEECH____header_global_2ff257c2bd39410e = ((((((370) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_09c044b1cec1fea7f65b52d5() {
  return __cxx_static_address_09c044b1cec1fea7f65b52d5.reference || (__cxx_static_address_09c044b1cec1fea7f65b52d5.reference = {
    __cReference: true,
    get value() { return BOSS4_DEADSPEECH____header_global_2ff257c2bd39410e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:175
export const BOSS4_FIRSTSEE____header_global_a90ef17f2bffe855 = ((((((371) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e27d9bd055363856d0f997a2() {
  return __cxx_static_address_e27d9bd055363856d0f997a2.reference || (__cxx_static_address_e27d9bd055363856d0f997a2.reference = {
    __cReference: true,
    get value() { return BOSS4_FIRSTSEE____header_global_a90ef17f2bffe855; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:176
export const VOL4ENDSND1____header_global_d57f191ca288948f = ((((((384) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e781e348a9c07f06d39430e7() {
  return __cxx_static_address_e781e348a9c07f06d39430e7.reference || (__cxx_static_address_e781e348a9c07f06d39430e7.reference = {
    __cReference: true,
    get value() { return VOL4ENDSND1____header_global_d57f191ca288948f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:177
export const VOL4ENDSND2____header_global_b61d16139fcf394f = ((((((385) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f20957cfad55fc013401c130() {
  return __cxx_static_address_f20957cfad55fc013401c130.reference || (__cxx_static_address_f20957cfad55fc013401c130.reference = {
    __cReference: true,
    get value() { return VOL4ENDSND2____header_global_b61d16139fcf394f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:178
export const EXPANDERSHOOT____header_global_6cfafc4f59cc7522 = ((((((388) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_76fdc7d66c841688225b3260() {
  return __cxx_static_address_76fdc7d66c841688225b3260.reference || (__cxx_static_address_76fdc7d66c841688225b3260.reference = {
    __cReference: true,
    get value() { return EXPANDERSHOOT____header_global_6cfafc4f59cc7522; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:179
export const INTRO4_B____header_global_721bb414b2e957b7 = ((((((392) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c214cb58e8ec9eef6aa362c7() {
  return __cxx_static_address_c214cb58e8ec9eef6aa362c7.reference || (__cxx_static_address_c214cb58e8ec9eef6aa362c7.reference = {
    __cReference: true,
    get value() { return INTRO4_B____header_global_721bb414b2e957b7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:180
export const BIGBANG____header_global_02cb1236665840ed = ((((((393) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ce4afc34c610bb2619ea7bf7() {
  return __cxx_static_address_ce4afc34c610bb2619ea7bf7.reference || (__cxx_static_address_ce4afc34c610bb2619ea7bf7.reference = {
    __cReference: true,
    get value() { return BIGBANG____header_global_02cb1236665840ed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:181
export const FLAMETHROWER_INTRO____header_global_8c663946baea118f = ((((((398) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5c6507622f7d84e419a251fe() {
  return __cxx_static_address_5c6507622f7d84e419a251fe.reference || (__cxx_static_address_5c6507622f7d84e419a251fe.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER_INTRO____header_global_8c663946baea118f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:182
export const FLAMETHROWER_LOOP____header_global_38a2bdd6478809c9 = ((((((399) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4eff84c05c8dad0d51d23333() {
  return __cxx_static_address_4eff84c05c8dad0d51d23333.reference || (__cxx_static_address_4eff84c05c8dad0d51d23333.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER_LOOP____header_global_38a2bdd6478809c9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:183
export const FLAMETHROWER_END____header_global_e2835958b5a1969f = ((((((400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_605ae2ab65c436630f1c2a0b() {
  return __cxx_static_address_605ae2ab65c436630f1c2a0b.reference || (__cxx_static_address_605ae2ab65c436630f1c2a0b.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER_END____header_global_e2835958b5a1969f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:184
export const E5L7_DUKE_QUIT_YOU____header_global_bdee1a91c26fea58 = ((((((401) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_26dcd25164d95aaccb75d3db() {
  return __cxx_static_address_26dcd25164d95aaccb75d3db.reference || (__cxx_static_address_26dcd25164d95aaccb75d3db.reference = {
    __cReference: true,
    get value() { return E5L7_DUKE_QUIT_YOU____header_global_bdee1a91c26fea58; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:187
export const SECTOREFFECTOR____header_global_1fb76e05b414531f = ((((((1) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_944e4c7836b8336b0404acc3() {
  return __cxx_static_address_944e4c7836b8336b0404acc3.reference || (__cxx_static_address_944e4c7836b8336b0404acc3.reference = {
    __cReference: true,
    get value() { return SECTOREFFECTOR____header_global_1fb76e05b414531f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:188
export const ACTIVATOR____header_global_e4f0688dc8183cab = ((((((2) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_72f4592d65a551c9be943603() {
  return __cxx_static_address_72f4592d65a551c9be943603.reference || (__cxx_static_address_72f4592d65a551c9be943603.reference = {
    __cReference: true,
    get value() { return ACTIVATOR____header_global_e4f0688dc8183cab; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:189
export const TOUCHPLATE____header_global_73d01bb24e53fab3 = ((((((3) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_03b858751eac2edf14c53220() {
  return __cxx_static_address_03b858751eac2edf14c53220.reference || (__cxx_static_address_03b858751eac2edf14c53220.reference = {
    __cReference: true,
    get value() { return TOUCHPLATE____header_global_73d01bb24e53fab3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:190
export const ACTIVATORLOCKED____header_global_878d6ec311d8927d = ((((((4) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_040401d251d7edf6ec65ee4f() {
  return __cxx_static_address_040401d251d7edf6ec65ee4f.reference || (__cxx_static_address_040401d251d7edf6ec65ee4f.reference = {
    __cReference: true,
    get value() { return ACTIVATORLOCKED____header_global_878d6ec311d8927d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:191
export const MUSICANDSFX____header_global_97f7516c1e7bbc79 = ((((((5) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bc92f2e2ff01327309203d14() {
  return __cxx_static_address_bc92f2e2ff01327309203d14.reference || (__cxx_static_address_bc92f2e2ff01327309203d14.reference = {
    __cReference: true,
    get value() { return MUSICANDSFX____header_global_97f7516c1e7bbc79; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:192
export const LOCATORS____header_global_7f778588b9f284b0 = ((((((6) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b2e72e924812b55bd7b91887() {
  return __cxx_static_address_b2e72e924812b55bd7b91887.reference || (__cxx_static_address_b2e72e924812b55bd7b91887.reference = {
    __cReference: true,
    get value() { return LOCATORS____header_global_7f778588b9f284b0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:193
export const CYCLER____header_global_0114a3f4fbac7bc7 = ((((((7) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5d6b376da30c684faf9583e1() {
  return __cxx_static_address_5d6b376da30c684faf9583e1.reference || (__cxx_static_address_5d6b376da30c684faf9583e1.reference = {
    __cReference: true,
    get value() { return CYCLER____header_global_0114a3f4fbac7bc7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:194
export const MASTERSWITCH____header_global_decb1974761e8af9 = ((((((8) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bb723479c4d7878ba914c64a() {
  return __cxx_static_address_bb723479c4d7878ba914c64a.reference || (__cxx_static_address_bb723479c4d7878ba914c64a.reference = {
    __cReference: true,
    get value() { return MASTERSWITCH____header_global_decb1974761e8af9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:195
export const RESPAWN____header_global_304a4250a35d3f22 = ((((((9) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_57a1f4ec3e83d90432fc3006() {
  return __cxx_static_address_57a1f4ec3e83d90432fc3006.reference || (__cxx_static_address_57a1f4ec3e83d90432fc3006.reference = {
    __cReference: true,
    get value() { return RESPAWN____header_global_304a4250a35d3f22; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:196
export const GPSPEED____header_global_b85302f2dfcda0df = ((((((10) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4100a3b5e7bf413ae3515230() {
  return __cxx_static_address_4100a3b5e7bf413ae3515230.reference || (__cxx_static_address_4100a3b5e7bf413ae3515230.reference = {
    __cReference: true,
    get value() { return GPSPEED____header_global_b85302f2dfcda0df; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:197
export const FOF____header_global_dd7eb5908817520d = ((((((13) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_12540e5a4566da250fc4f17d() {
  return __cxx_static_address_12540e5a4566da250fc4f17d.reference || (__cxx_static_address_12540e5a4566da250fc4f17d.reference = {
    __cReference: true,
    get value() { return FOF____header_global_dd7eb5908817520d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:198
export const ARROW____header_global_c85913b1295d8899 = ((((((20) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_688a756a7b51e420ef84e76f() {
  return __cxx_static_address_688a756a7b51e420ef84e76f.reference || (__cxx_static_address_688a756a7b51e420ef84e76f.reference = {
    __cReference: true,
    get value() { return ARROW____header_global_c85913b1295d8899; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:199
export const FIRSTGUNSPRITE____header_global_7b5a06e944d93b5a = ((((((21) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d3eb3e02da31bd9d655776c8() {
  return __cxx_static_address_d3eb3e02da31bd9d655776c8.reference || (__cxx_static_address_d3eb3e02da31bd9d655776c8.reference = {
    __cReference: true,
    get value() { return FIRSTGUNSPRITE____header_global_7b5a06e944d93b5a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:200
export const CHAINGUNSPRITE____header_global_61eafd05845d10c0 = ((((((22) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8caaa08e59a854396a5c28b5() {
  return __cxx_static_address_8caaa08e59a854396a5c28b5.reference || (__cxx_static_address_8caaa08e59a854396a5c28b5.reference = {
    __cReference: true,
    get value() { return CHAINGUNSPRITE____header_global_61eafd05845d10c0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:201
export const RPGSPRITE____header_global_b7dd6fe908658b68 = ((((((23) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c832ad6a0f5cdc58651c3772() {
  return __cxx_static_address_c832ad6a0f5cdc58651c3772.reference || (__cxx_static_address_c832ad6a0f5cdc58651c3772.reference = {
    __cReference: true,
    get value() { return RPGSPRITE____header_global_b7dd6fe908658b68; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:202
export const FREEZESPRITE____header_global_71e010c5f22b2a08 = ((((((24) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_84992d05023d1ec666afe5e0() {
  return __cxx_static_address_84992d05023d1ec666afe5e0.reference || (__cxx_static_address_84992d05023d1ec666afe5e0.reference = {
    __cReference: true,
    get value() { return FREEZESPRITE____header_global_71e010c5f22b2a08; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:203
export const SHRINKERSPRITE____header_global_dd303b7fcf744191 = ((((((25) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_34b67e13417ecd02e0b59f96() {
  return __cxx_static_address_34b67e13417ecd02e0b59f96.reference || (__cxx_static_address_34b67e13417ecd02e0b59f96.reference = {
    __cReference: true,
    get value() { return SHRINKERSPRITE____header_global_dd303b7fcf744191; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:204
export const HEAVYHBOMB____header_global_a2991fe4cd0cd443 = ((((((26) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8a718c200907de4dfdf3fe3e() {
  return __cxx_static_address_8a718c200907de4dfdf3fe3e.reference || (__cxx_static_address_8a718c200907de4dfdf3fe3e.reference = {
    __cReference: true,
    get value() { return HEAVYHBOMB____header_global_a2991fe4cd0cd443; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:205
export const TRIPBOMBSPRITE____header_global_65f688aed673c997 = ((((((27) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2052ffaae8fd0fd8e6fb070f() {
  return __cxx_static_address_2052ffaae8fd0fd8e6fb070f.reference || (__cxx_static_address_2052ffaae8fd0fd8e6fb070f.reference = {
    __cReference: true,
    get value() { return TRIPBOMBSPRITE____header_global_65f688aed673c997; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:206
export const SHOTGUNSPRITE____header_global_f278dc71188ea70d = ((((((28) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_707e7fad01ffec7c95972981() {
  return __cxx_static_address_707e7fad01ffec7c95972981.reference || (__cxx_static_address_707e7fad01ffec7c95972981.reference = {
    __cReference: true,
    get value() { return SHOTGUNSPRITE____header_global_f278dc71188ea70d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:207
export const DEVISTATORSPRITE____header_global_d227b2e6f307ee42 = ((((((29) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c378c4bdd851af012e74c239() {
  return __cxx_static_address_c378c4bdd851af012e74c239.reference || (__cxx_static_address_c378c4bdd851af012e74c239.reference = {
    __cReference: true,
    get value() { return DEVISTATORSPRITE____header_global_d227b2e6f307ee42; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:208
export const HEALTHBOX____header_global_c31cc7d0e079e09c = ((((((30) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b3be3f932e9be269ce997cfb() {
  return __cxx_static_address_b3be3f932e9be269ce997cfb.reference || (__cxx_static_address_b3be3f932e9be269ce997cfb.reference = {
    __cReference: true,
    get value() { return HEALTHBOX____header_global_c31cc7d0e079e09c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:209
export const AMMOBOX____header_global_12de45c51b2f08a7 = ((((((31) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_893b05e941496b8c57774d8e() {
  return __cxx_static_address_893b05e941496b8c57774d8e.reference || (__cxx_static_address_893b05e941496b8c57774d8e.reference = {
    __cReference: true,
    get value() { return AMMOBOX____header_global_12de45c51b2f08a7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:210
export const GROWSPRITEICON____header_global_ccf19e84578c3ce6 = ((((((32) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4402f1fcd9d1aef2e2b47984() {
  return __cxx_static_address_4402f1fcd9d1aef2e2b47984.reference || (__cxx_static_address_4402f1fcd9d1aef2e2b47984.reference = {
    __cReference: true,
    get value() { return GROWSPRITEICON____header_global_ccf19e84578c3ce6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:211
export const INVENTORYBOX____header_global_9b393fa6d8cbbe4a = ((((((33) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_73e8c106278764b268116b33() {
  return __cxx_static_address_73e8c106278764b268116b33.reference || (__cxx_static_address_73e8c106278764b268116b33.reference = {
    __cReference: true,
    get value() { return INVENTORYBOX____header_global_9b393fa6d8cbbe4a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:212
export const FREEZEAMMO____header_global_6522b76f99183d65 = ((((((37) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4a388c3448df0ed27e6c1f79() {
  return __cxx_static_address_4a388c3448df0ed27e6c1f79.reference || (__cxx_static_address_4a388c3448df0ed27e6c1f79.reference = {
    __cReference: true,
    get value() { return FREEZEAMMO____header_global_6522b76f99183d65; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:213
export const AMMO____header_global_862717ce944ce7f0 = ((((((40) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1dbd61100a33b171db6e14c7() {
  return __cxx_static_address_1dbd61100a33b171db6e14c7.reference || (__cxx_static_address_1dbd61100a33b171db6e14c7.reference = {
    __cReference: true,
    get value() { return AMMO____header_global_862717ce944ce7f0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:214
export const BATTERYAMMO____header_global_debecb63665a0146 = ((((((41) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_23c5589b8348b7e3956fd3e4() {
  return __cxx_static_address_23c5589b8348b7e3956fd3e4.reference || (__cxx_static_address_23c5589b8348b7e3956fd3e4.reference = {
    __cReference: true,
    get value() { return BATTERYAMMO____header_global_debecb63665a0146; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:215
export const DEVISTATORAMMO____header_global_ed77689d57fc9c54 = ((((((42) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3ac4fd139ba98345be8c48d5() {
  return __cxx_static_address_3ac4fd139ba98345be8c48d5.reference || (__cxx_static_address_3ac4fd139ba98345be8c48d5.reference = {
    __cReference: true,
    get value() { return DEVISTATORAMMO____header_global_ed77689d57fc9c54; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:216
export const RPGAMMO____header_global_9a9901775a6a0880 = ((((((44) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cf1ef33dd85f0b4606772db1() {
  return __cxx_static_address_cf1ef33dd85f0b4606772db1.reference || (__cxx_static_address_cf1ef33dd85f0b4606772db1.reference = {
    __cReference: true,
    get value() { return RPGAMMO____header_global_9a9901775a6a0880; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:217
export const GROWAMMO____header_global_1d921c4294a2786d = ((((((45) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_002467a7c929d830ce326bf4() {
  return __cxx_static_address_002467a7c929d830ce326bf4.reference || (__cxx_static_address_002467a7c929d830ce326bf4.reference = {
    __cReference: true,
    get value() { return GROWAMMO____header_global_1d921c4294a2786d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:218
export const CRYSTALAMMO____header_global_e017e236d4c4af75 = ((((((46) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3bdcd84ff2a9e18d8e38c747() {
  return __cxx_static_address_3bdcd84ff2a9e18d8e38c747.reference || (__cxx_static_address_3bdcd84ff2a9e18d8e38c747.reference = {
    __cReference: true,
    get value() { return CRYSTALAMMO____header_global_e017e236d4c4af75; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:219
export const HBOMBAMMO____header_global_d4a0ec531882ab5e = ((((((47) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b95a86624f57648693f67482() {
  return __cxx_static_address_b95a86624f57648693f67482.reference || (__cxx_static_address_b95a86624f57648693f67482.reference = {
    __cReference: true,
    get value() { return HBOMBAMMO____header_global_d4a0ec531882ab5e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:220
export const AMMOLOTS____header_global_e5c5302a2c39e6aa = ((((((48) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bbd10b5868a5e4256b984bfb() {
  return __cxx_static_address_bbd10b5868a5e4256b984bfb.reference || (__cxx_static_address_bbd10b5868a5e4256b984bfb.reference = {
    __cReference: true,
    get value() { return AMMOLOTS____header_global_e5c5302a2c39e6aa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:221
export const SHOTGUNAMMO____header_global_8cf275dea6133b67 = ((((((49) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_768791a191aa0e14c523f915() {
  return __cxx_static_address_768791a191aa0e14c523f915.reference || (__cxx_static_address_768791a191aa0e14c523f915.reference = {
    __cReference: true,
    get value() { return SHOTGUNAMMO____header_global_8cf275dea6133b67; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:222
export const COLA____header_global_7c3f1f1a69e2b938 = ((((((51) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8bc5aaa73e93909f651a6aa4() {
  return __cxx_static_address_8bc5aaa73e93909f651a6aa4.reference || (__cxx_static_address_8bc5aaa73e93909f651a6aa4.reference = {
    __cReference: true,
    get value() { return COLA____header_global_7c3f1f1a69e2b938; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:223
export const SIXPAK____header_global_8b381c8e9d22e050 = ((((((52) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fae5588402be2d770020068f() {
  return __cxx_static_address_fae5588402be2d770020068f.reference || (__cxx_static_address_fae5588402be2d770020068f.reference = {
    __cReference: true,
    get value() { return SIXPAK____header_global_8b381c8e9d22e050; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:224
export const FIRSTAID____header_global_03441beaab64fc48 = ((((((53) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4f6d3c2ebe5894ac2ee560a2() {
  return __cxx_static_address_4f6d3c2ebe5894ac2ee560a2.reference || (__cxx_static_address_4f6d3c2ebe5894ac2ee560a2.reference = {
    __cReference: true,
    get value() { return FIRSTAID____header_global_03441beaab64fc48; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:225
export const SHIELD____header_global_4367677aa33dee47 = ((((((54) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b26cc11037346067c346717b() {
  return __cxx_static_address_b26cc11037346067c346717b.reference || (__cxx_static_address_b26cc11037346067c346717b.reference = {
    __cReference: true,
    get value() { return SHIELD____header_global_4367677aa33dee47; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:226
export const STEROIDS____header_global_11484191deef6022 = ((((((55) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_abb2d22eadf9a7f69adad542() {
  return __cxx_static_address_abb2d22eadf9a7f69adad542.reference || (__cxx_static_address_abb2d22eadf9a7f69adad542.reference = {
    __cReference: true,
    get value() { return STEROIDS____header_global_11484191deef6022; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:227
export const AIRTANK____header_global_86aad1a2accbe959 = ((((((56) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0df389fc1d5712c77c614301() {
  return __cxx_static_address_0df389fc1d5712c77c614301.reference || (__cxx_static_address_0df389fc1d5712c77c614301.reference = {
    __cReference: true,
    get value() { return AIRTANK____header_global_86aad1a2accbe959; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:228
export const JETPACK____header_global_4a0fff32e908cec1 = ((((((57) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1b68fc3d85bd70bb4b0da4bc() {
  return __cxx_static_address_1b68fc3d85bd70bb4b0da4bc.reference || (__cxx_static_address_1b68fc3d85bd70bb4b0da4bc.reference = {
    __cReference: true,
    get value() { return JETPACK____header_global_4a0fff32e908cec1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:229
export const HEATSENSOR____header_global_999be885219f16ee = ((((((59) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_180c9ce52f7e1fc4048d69ea() {
  return __cxx_static_address_180c9ce52f7e1fc4048d69ea.reference || (__cxx_static_address_180c9ce52f7e1fc4048d69ea.reference = {
    __cReference: true,
    get value() { return HEATSENSOR____header_global_999be885219f16ee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:230
export const ACCESSCARD____header_global_44d13c85874add25 = ((((((60) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aef4c3001480280b149c3513() {
  return __cxx_static_address_aef4c3001480280b149c3513.reference || (__cxx_static_address_aef4c3001480280b149c3513.reference = {
    __cReference: true,
    get value() { return ACCESSCARD____header_global_44d13c85874add25; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:231
export const BOOTS____header_global_a7ed7980454cb31a = ((((((61) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f2c2dea500315f5a1d66f1c2() {
  return __cxx_static_address_f2c2dea500315f5a1d66f1c2.reference || (__cxx_static_address_f2c2dea500315f5a1d66f1c2.reference = {
    __cReference: true,
    get value() { return BOOTS____header_global_a7ed7980454cb31a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:232
export const MIRRORBROKE____header_global_629c74cbbc9cd9da = ((((((70) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9c69d59d21f1fc2eea338ebe() {
  return __cxx_static_address_9c69d59d21f1fc2eea338ebe.reference || (__cxx_static_address_9c69d59d21f1fc2eea338ebe.reference = {
    __cReference: true,
    get value() { return MIRRORBROKE____header_global_629c74cbbc9cd9da; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:233
export const CLOUDYOCEAN____header_global_2fe9305c64094e51 = ((((((78) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f835ca9747e5065f24f3aadf() {
  return __cxx_static_address_f835ca9747e5065f24f3aadf.reference || (__cxx_static_address_f835ca9747e5065f24f3aadf.reference = {
    __cReference: true,
    get value() { return CLOUDYOCEAN____header_global_2fe9305c64094e51; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:234
export const CLOUDYSKIES____header_global_42533546f11ac1c8 = ((((((79) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2c4cfe914d9d37c4218255ef() {
  return __cxx_static_address_2c4cfe914d9d37c4218255ef.reference || (__cxx_static_address_2c4cfe914d9d37c4218255ef.reference = {
    __cReference: true,
    get value() { return CLOUDYSKIES____header_global_42533546f11ac1c8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:235
export const MOONSKY1____header_global_45d42f6d8917eb6a = ((((((80) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_24028a00bf8db114f02c4834() {
  return __cxx_static_address_24028a00bf8db114f02c4834.reference || (__cxx_static_address_24028a00bf8db114f02c4834.reference = {
    __cReference: true,
    get value() { return MOONSKY1____header_global_45d42f6d8917eb6a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:236
export const BIGORBIT1____header_global_5dee4be77503cd36 = ((((((84) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e9b2cf05bdb5cbf0ed393921() {
  return __cxx_static_address_e9b2cf05bdb5cbf0ed393921.reference || (__cxx_static_address_e9b2cf05bdb5cbf0ed393921.reference = {
    __cReference: true,
    get value() { return BIGORBIT1____header_global_5dee4be77503cd36; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:237
export const LA____header_global_179ae83023cf8881 = ((((((89) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7a5c39162eca70887e668aa7() {
  return __cxx_static_address_7a5c39162eca70887e668aa7.reference || (__cxx_static_address_7a5c39162eca70887e668aa7.reference = {
    __cReference: true,
    get value() { return LA____header_global_179ae83023cf8881; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:238
export const ATOMICHEALTH____header_global_92a17cfb8d040971 = ((((((100) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_230a5b764aa946eefd4ae46f() {
  return __cxx_static_address_230a5b764aa946eefd4ae46f.reference || (__cxx_static_address_230a5b764aa946eefd4ae46f.reference = {
    __cReference: true,
    get value() { return ATOMICHEALTH____header_global_92a17cfb8d040971; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:239
export const TECHLIGHT2____header_global_8343706f7c8c7236 = ((((((120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cf32777b49520a15a1652dc2() {
  return __cxx_static_address_cf32777b49520a15a1652dc2.reference || (__cxx_static_address_cf32777b49520a15a1652dc2.reference = {
    __cReference: true,
    get value() { return TECHLIGHT2____header_global_8343706f7c8c7236; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:240
export const TECHLIGHTBUST2____header_global_6a657d4d20339d79 = ((((((121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_53b5ddc3ebe0ebd6365efb85() {
  return __cxx_static_address_53b5ddc3ebe0ebd6365efb85.reference || (__cxx_static_address_53b5ddc3ebe0ebd6365efb85.reference = {
    __cReference: true,
    get value() { return TECHLIGHTBUST2____header_global_6a657d4d20339d79; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:241
export const TECHLIGHT4____header_global_98797de80a30d646 = ((((((122) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_115688ded245dfbf01f000fd() {
  return __cxx_static_address_115688ded245dfbf01f000fd.reference || (__cxx_static_address_115688ded245dfbf01f000fd.reference = {
    __cReference: true,
    get value() { return TECHLIGHT4____header_global_98797de80a30d646; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:242
export const TECHLIGHTBUST4____header_global_e29e4d298a8875d7 = ((((((123) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0ef6fad3826be55c02a97a17() {
  return __cxx_static_address_0ef6fad3826be55c02a97a17.reference || (__cxx_static_address_0ef6fad3826be55c02a97a17.reference = {
    __cReference: true,
    get value() { return TECHLIGHTBUST4____header_global_e29e4d298a8875d7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:243
export const WALLLIGHT4____header_global_bb11f37c29673c69 = ((((((124) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_74186f696b3604d13e504ab9() {
  return __cxx_static_address_74186f696b3604d13e504ab9.reference || (__cxx_static_address_74186f696b3604d13e504ab9.reference = {
    __cReference: true,
    get value() { return WALLLIGHT4____header_global_bb11f37c29673c69; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:244
export const WALLLIGHTBUST4____header_global_16623b68474aa17c = ((((((125) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5dae050b84905e3cc9078d25() {
  return __cxx_static_address_5dae050b84905e3cc9078d25.reference || (__cxx_static_address_5dae050b84905e3cc9078d25.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST4____header_global_16623b68474aa17c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:245
export const ACCESSSWITCH____header_global_67445abbb84de96e = ((((((130) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5fa320e07c540415b9c7bda5() {
  return __cxx_static_address_5fa320e07c540415b9c7bda5.reference || (__cxx_static_address_5fa320e07c540415b9c7bda5.reference = {
    __cReference: true,
    get value() { return ACCESSSWITCH____header_global_67445abbb84de96e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:246
export const SLOTDOOR____header_global_2abeab31e8674399 = ((((((132) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3771aef3f2d692a2fed41dd8() {
  return __cxx_static_address_3771aef3f2d692a2fed41dd8.reference || (__cxx_static_address_3771aef3f2d692a2fed41dd8.reference = {
    __cReference: true,
    get value() { return SLOTDOOR____header_global_2abeab31e8674399; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:247
export const LIGHTSWITCH____header_global_a280e8151d026cb0 = ((((((134) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9ba7aa71550ed9caba4dd06f() {
  return __cxx_static_address_9ba7aa71550ed9caba4dd06f.reference || (__cxx_static_address_9ba7aa71550ed9caba4dd06f.reference = {
    __cReference: true,
    get value() { return LIGHTSWITCH____header_global_a280e8151d026cb0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:248
export const SPACEDOORSWITCH____header_global_efcce0da03c798c3 = ((((((136) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5d01841878fdc418b2326e62() {
  return __cxx_static_address_5d01841878fdc418b2326e62.reference || (__cxx_static_address_5d01841878fdc418b2326e62.reference = {
    __cReference: true,
    get value() { return SPACEDOORSWITCH____header_global_efcce0da03c798c3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:249
export const SPACELIGHTSWITCH____header_global_c49b21fbf35c3c52 = ((((((138) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_402d98d14e9ea7c560ff0fe1() {
  return __cxx_static_address_402d98d14e9ea7c560ff0fe1.reference || (__cxx_static_address_402d98d14e9ea7c560ff0fe1.reference = {
    __cReference: true,
    get value() { return SPACELIGHTSWITCH____header_global_c49b21fbf35c3c52; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:250
export const FRANKENSTINESWITCH____header_global_d6784eada3ba231b = ((((((140) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7725090de8f66be997490237() {
  return __cxx_static_address_7725090de8f66be997490237.reference || (__cxx_static_address_7725090de8f66be997490237.reference = {
    __cReference: true,
    get value() { return FRANKENSTINESWITCH____header_global_d6784eada3ba231b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:251
export const NUKEBUTTON____header_global_dc4f06d79bba5828 = ((((((142) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3bd265f341d716bd9cb018c6() {
  return __cxx_static_address_3bd265f341d716bd9cb018c6.reference || (__cxx_static_address_3bd265f341d716bd9cb018c6.reference = {
    __cReference: true,
    get value() { return NUKEBUTTON____header_global_dc4f06d79bba5828; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:252
export const MULTISWITCH____header_global_e67aefc157a487e4 = ((((((146) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_33a45f29c3f7403c82d0e3b8() {
  return __cxx_static_address_33a45f29c3f7403c82d0e3b8.reference || (__cxx_static_address_33a45f29c3f7403c82d0e3b8.reference = {
    __cReference: true,
    get value() { return MULTISWITCH____header_global_e67aefc157a487e4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:253
export const DOORTILE5____header_global_87502a1af012b47e = ((((((150) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f9a92822d2f80f686344dc1e() {
  return __cxx_static_address_f9a92822d2f80f686344dc1e.reference || (__cxx_static_address_f9a92822d2f80f686344dc1e.reference = {
    __cReference: true,
    get value() { return DOORTILE5____header_global_87502a1af012b47e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:254
export const DOORTILE6____header_global_4f687e4abf24d35c = ((((((151) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_984112ebf117d3d0c3a11d81() {
  return __cxx_static_address_984112ebf117d3d0c3a11d81.reference || (__cxx_static_address_984112ebf117d3d0c3a11d81.reference = {
    __cReference: true,
    get value() { return DOORTILE6____header_global_4f687e4abf24d35c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:255
export const DOORTILE1____header_global_c8e04eebf44c143d = ((((((152) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d290a8f143107d66dc874f2d() {
  return __cxx_static_address_d290a8f143107d66dc874f2d.reference || (__cxx_static_address_d290a8f143107d66dc874f2d.reference = {
    __cReference: true,
    get value() { return DOORTILE1____header_global_c8e04eebf44c143d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:256
export const DOORTILE2____header_global_6ef55bf6de7db8e9 = ((((((153) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_60cab43f47441613048fa357() {
  return __cxx_static_address_60cab43f47441613048fa357.reference || (__cxx_static_address_60cab43f47441613048fa357.reference = {
    __cReference: true,
    get value() { return DOORTILE2____header_global_6ef55bf6de7db8e9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:257
export const DOORTILE3____header_global_487b5339eef6d555 = ((((((154) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_582dd67ca6c507b779b880a8() {
  return __cxx_static_address_582dd67ca6c507b779b880a8.reference || (__cxx_static_address_582dd67ca6c507b779b880a8.reference = {
    __cReference: true,
    get value() { return DOORTILE3____header_global_487b5339eef6d555; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:258
export const DOORTILE4____header_global_ab629aa653ba9299 = ((((((155) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d57e69601f29110faf3d4882() {
  return __cxx_static_address_d57e69601f29110faf3d4882.reference || (__cxx_static_address_d57e69601f29110faf3d4882.reference = {
    __cReference: true,
    get value() { return DOORTILE4____header_global_ab629aa653ba9299; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:259
export const DOORTILE7____header_global_9fabfec646214147 = ((((((156) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4d529cb0b7545f40bd871d6c() {
  return __cxx_static_address_4d529cb0b7545f40bd871d6c.reference || (__cxx_static_address_4d529cb0b7545f40bd871d6c.reference = {
    __cReference: true,
    get value() { return DOORTILE7____header_global_9fabfec646214147; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:260
export const DOORTILE8____header_global_4b6acb4017e6f0dc = ((((((157) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b571e47f30b62b1f0b808536() {
  return __cxx_static_address_b571e47f30b62b1f0b808536.reference || (__cxx_static_address_b571e47f30b62b1f0b808536.reference = {
    __cReference: true,
    get value() { return DOORTILE8____header_global_4b6acb4017e6f0dc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:261
export const DOORTILE9____header_global_256a296786956e53 = ((((((158) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f08202fb5b9936dc83017571() {
  return __cxx_static_address_f08202fb5b9936dc83017571.reference || (__cxx_static_address_f08202fb5b9936dc83017571.reference = {
    __cReference: true,
    get value() { return DOORTILE9____header_global_256a296786956e53; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:262
export const DOORTILE10____header_global_b61beaabbfef2686 = ((((((159) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_44b114be00095b6af8eb4361() {
  return __cxx_static_address_44b114be00095b6af8eb4361.reference || (__cxx_static_address_44b114be00095b6af8eb4361.reference = {
    __cReference: true,
    get value() { return DOORTILE10____header_global_b61beaabbfef2686; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:263
export const DOORSHOCK____header_global_01e43a20a651ac33 = ((((((160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_424e1dca4aefa40dd251ffa7() {
  return __cxx_static_address_424e1dca4aefa40dd251ffa7.reference || (__cxx_static_address_424e1dca4aefa40dd251ffa7.reference = {
    __cReference: true,
    get value() { return DOORSHOCK____header_global_01e43a20a651ac33; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:264
export const DIPSWITCH____header_global_77691122668c4f08 = ((((((162) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ae2e3681fed07de5c105c7cd() {
  return __cxx_static_address_ae2e3681fed07de5c105c7cd.reference || (__cxx_static_address_ae2e3681fed07de5c105c7cd.reference = {
    __cReference: true,
    get value() { return DIPSWITCH____header_global_77691122668c4f08; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:265
export const DIPSWITCH2____header_global_acfa46a964f13f66 = ((((((164) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_281b2c556fd3a333183cd26c() {
  return __cxx_static_address_281b2c556fd3a333183cd26c.reference || (__cxx_static_address_281b2c556fd3a333183cd26c.reference = {
    __cReference: true,
    get value() { return DIPSWITCH2____header_global_acfa46a964f13f66; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:266
export const TECHSWITCH____header_global_3f948560f67d8893 = ((((((166) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7f7bd44f5517fb4c91419554() {
  return __cxx_static_address_7f7bd44f5517fb4c91419554.reference || (__cxx_static_address_7f7bd44f5517fb4c91419554.reference = {
    __cReference: true,
    get value() { return TECHSWITCH____header_global_3f948560f67d8893; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:267
export const DIPSWITCH3____header_global_044fbd876f7210f0 = ((((((168) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_27e1b7535cdd6e3879539773() {
  return __cxx_static_address_27e1b7535cdd6e3879539773.reference || (__cxx_static_address_27e1b7535cdd6e3879539773.reference = {
    __cReference: true,
    get value() { return DIPSWITCH3____header_global_044fbd876f7210f0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:268
export const ACCESSSWITCH2____header_global_17a2f1f2744a7dce = ((((((170) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d49027ad9a6040418ee2cc60() {
  return __cxx_static_address_d49027ad9a6040418ee2cc60.reference || (__cxx_static_address_d49027ad9a6040418ee2cc60.reference = {
    __cReference: true,
    get value() { return ACCESSSWITCH2____header_global_17a2f1f2744a7dce; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:269
export const FLOORSLIME____header_global_50a9ce8fa836018f = ((((((200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1f91ee35e4ebf1f2a328100a() {
  return __cxx_static_address_1f91ee35e4ebf1f2a328100a.reference || (__cxx_static_address_1f91ee35e4ebf1f2a328100a.reference = {
    __cReference: true,
    get value() { return FLOORSLIME____header_global_50a9ce8fa836018f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:270
export const BIGFORCE____header_global_05caae7ac65f2441 = ((((((230) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8c94742c3437fbffa6a9619d() {
  return __cxx_static_address_8c94742c3437fbffa6a9619d.reference || (__cxx_static_address_8c94742c3437fbffa6a9619d.reference = {
    __cReference: true,
    get value() { return BIGFORCE____header_global_05caae7ac65f2441; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:271
export const MASKWALL9____header_global_c62f5589c1270b69 = ((((((255) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0ebcdbd5013847dfe4f0d139() {
  return __cxx_static_address_0ebcdbd5013847dfe4f0d139.reference || (__cxx_static_address_0ebcdbd5013847dfe4f0d139.reference = {
    __cReference: true,
    get value() { return MASKWALL9____header_global_c62f5589c1270b69; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:272
export const SCREENBREAK1____header_global_6dc5219bdc40729f = ((((((263) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bddd9b5e1ee89c011243028a() {
  return __cxx_static_address_bddd9b5e1ee89c011243028a.reference || (__cxx_static_address_bddd9b5e1ee89c011243028a.reference = {
    __cReference: true,
    get value() { return SCREENBREAK1____header_global_6dc5219bdc40729f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:273
export const SCREENBREAK2____header_global_8142f0def7a61146 = ((((((264) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_96aafa9d08145b781823e008() {
  return __cxx_static_address_96aafa9d08145b781823e008.reference || (__cxx_static_address_96aafa9d08145b781823e008.reference = {
    __cReference: true,
    get value() { return SCREENBREAK2____header_global_8142f0def7a61146; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:274
export const SCREENBREAK3____header_global_00e2c65f7e3068b8 = ((((((265) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e4744ef4320aaaac0fc077ff() {
  return __cxx_static_address_e4744ef4320aaaac0fc077ff.reference || (__cxx_static_address_e4744ef4320aaaac0fc077ff.reference = {
    __cReference: true,
    get value() { return SCREENBREAK3____header_global_00e2c65f7e3068b8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:275
export const SCREENBREAK4____header_global_cb6fedc83f237d16 = ((((((266) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ab95a383b962c7a2b80c268c() {
  return __cxx_static_address_ab95a383b962c7a2b80c268c.reference || (__cxx_static_address_ab95a383b962c7a2b80c268c.reference = {
    __cReference: true,
    get value() { return SCREENBREAK4____header_global_cb6fedc83f237d16; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:276
export const SCREENBREAK5____header_global_9fe044938b0ec3a5 = ((((((267) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a3bddfd679a69fbaf5d3bb0a() {
  return __cxx_static_address_a3bddfd679a69fbaf5d3bb0a.reference || (__cxx_static_address_a3bddfd679a69fbaf5d3bb0a.reference = {
    __cReference: true,
    get value() { return SCREENBREAK5____header_global_9fe044938b0ec3a5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:277
export const SCREENBREAK6____header_global_aae0d580fb5dcfd9 = ((((((268) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0a819cfb6aa1499ba0926507() {
  return __cxx_static_address_0a819cfb6aa1499ba0926507.reference || (__cxx_static_address_0a819cfb6aa1499ba0926507.reference = {
    __cReference: true,
    get value() { return SCREENBREAK6____header_global_aae0d580fb5dcfd9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:278
export const SCREENBREAK7____header_global_e0519b735713b070 = ((((((269) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dc32c7431424a518b8e955c6() {
  return __cxx_static_address_dc32c7431424a518b8e955c6.reference || (__cxx_static_address_dc32c7431424a518b8e955c6.reference = {
    __cReference: true,
    get value() { return SCREENBREAK7____header_global_e0519b735713b070; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:279
export const SCREENBREAK8____header_global_6aa22660a84e3d95 = ((((((270) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_457095c1bbf5b84b73bc39ab() {
  return __cxx_static_address_457095c1bbf5b84b73bc39ab.reference || (__cxx_static_address_457095c1bbf5b84b73bc39ab.reference = {
    __cReference: true,
    get value() { return SCREENBREAK8____header_global_6aa22660a84e3d95; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:280
export const SCREENBREAK9____header_global_80cc6cd1832a0b0e = ((((((271) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a45b5321f98ab6a405bd4c17() {
  return __cxx_static_address_a45b5321f98ab6a405bd4c17.reference || (__cxx_static_address_a45b5321f98ab6a405bd4c17.reference = {
    __cReference: true,
    get value() { return SCREENBREAK9____header_global_80cc6cd1832a0b0e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:281
export const SCREENBREAK10____header_global_96e8294419e78aac = ((((((272) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_be840b78908accb8de681f82() {
  return __cxx_static_address_be840b78908accb8de681f82.reference || (__cxx_static_address_be840b78908accb8de681f82.reference = {
    __cReference: true,
    get value() { return SCREENBREAK10____header_global_96e8294419e78aac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:282
export const SCREENBREAK11____header_global_e4113b8937e6c4d4 = ((((((273) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8af2a22c5aa7770b83fc81df() {
  return __cxx_static_address_8af2a22c5aa7770b83fc81df.reference || (__cxx_static_address_8af2a22c5aa7770b83fc81df.reference = {
    __cReference: true,
    get value() { return SCREENBREAK11____header_global_e4113b8937e6c4d4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:283
export const SCREENBREAK12____header_global_e47ff39d8f61d2ca = ((((((274) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_492c26cd283455ed836ef1ca() {
  return __cxx_static_address_492c26cd283455ed836ef1ca.reference || (__cxx_static_address_492c26cd283455ed836ef1ca.reference = {
    __cReference: true,
    get value() { return SCREENBREAK12____header_global_e47ff39d8f61d2ca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:284
export const SCREENBREAK13____header_global_ef0d40ddf6531932 = ((((((275) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8993c19e001f4e1ef66f75d6() {
  return __cxx_static_address_8993c19e001f4e1ef66f75d6.reference || (__cxx_static_address_8993c19e001f4e1ef66f75d6.reference = {
    __cReference: true,
    get value() { return SCREENBREAK13____header_global_ef0d40ddf6531932; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:285
export const MASKWALL1____header_global_b86f19dc3d75828b = ((((((285) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3bb93b6c8b174ff2083807ee() {
  return __cxx_static_address_3bb93b6c8b174ff2083807ee.reference || (__cxx_static_address_3bb93b6c8b174ff2083807ee.reference = {
    __cReference: true,
    get value() { return MASKWALL1____header_global_b86f19dc3d75828b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:286
export const W_TECHWALL1____header_global_787b88c205b7190e = ((((((293) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1eea3689222b63b7df829683() {
  return __cxx_static_address_1eea3689222b63b7df829683.reference || (__cxx_static_address_1eea3689222b63b7df829683.reference = {
    __cReference: true,
    get value() { return W_TECHWALL1____header_global_787b88c205b7190e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:287
export const W_TECHWALL2____header_global_d433a8088f5ed98a = ((((((297) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1961ca04e01e8cdb1d7b42fa() {
  return __cxx_static_address_1961ca04e01e8cdb1d7b42fa.reference || (__cxx_static_address_1961ca04e01e8cdb1d7b42fa.reference = {
    __cReference: true,
    get value() { return W_TECHWALL2____header_global_d433a8088f5ed98a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:288
export const W_TECHWALL15____header_global_0c9de48dc35ea7a5 = ((((((299) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d49c909b97554a262050e4ac() {
  return __cxx_static_address_d49c909b97554a262050e4ac.reference || (__cxx_static_address_d49c909b97554a262050e4ac.reference = {
    __cReference: true,
    get value() { return W_TECHWALL15____header_global_0c9de48dc35ea7a5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:289
export const W_TECHWALL3____header_global_2b1dfba9dc0f7acd = ((((((301) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_497d24281401347a2277c4e2() {
  return __cxx_static_address_497d24281401347a2277c4e2.reference || (__cxx_static_address_497d24281401347a2277c4e2.reference = {
    __cReference: true,
    get value() { return W_TECHWALL3____header_global_2b1dfba9dc0f7acd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:290
export const W_TECHWALL4____header_global_8e45a49640d0f5bf = ((((((305) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f114d8e6c86b55a55fc53dc6() {
  return __cxx_static_address_f114d8e6c86b55a55fc53dc6.reference || (__cxx_static_address_f114d8e6c86b55a55fc53dc6.reference = {
    __cReference: true,
    get value() { return W_TECHWALL4____header_global_8e45a49640d0f5bf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:291
export const W_TECHWALL10____header_global_e92c575d0e8307df = ((((((306) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b0013898d614d0c28a68b2ce() {
  return __cxx_static_address_b0013898d614d0c28a68b2ce.reference || (__cxx_static_address_b0013898d614d0c28a68b2ce.reference = {
    __cReference: true,
    get value() { return W_TECHWALL10____header_global_e92c575d0e8307df; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:292
export const W_TECHWALL16____header_global_ceaa740cad79bbef = ((((((307) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0bd86f162ed7bab1cdbf448f() {
  return __cxx_static_address_0bd86f162ed7bab1cdbf448f.reference || (__cxx_static_address_0bd86f162ed7bab1cdbf448f.reference = {
    __cReference: true,
    get value() { return W_TECHWALL16____header_global_ceaa740cad79bbef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:293
export const WATERTILE2____header_global_56ffff493a36e898 = ((((((336) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d35a9e1fbc4d16489c994daf() {
  return __cxx_static_address_d35a9e1fbc4d16489c994daf.reference || (__cxx_static_address_d35a9e1fbc4d16489c994daf.reference = {
    __cReference: true,
    get value() { return WATERTILE2____header_global_56ffff493a36e898; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:294
export const BPANNEL1____header_global_0ebf1cdcea56888f = ((((((341) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d1d8dc46cee85fc16651ac35() {
  return __cxx_static_address_d1d8dc46cee85fc16651ac35.reference || (__cxx_static_address_d1d8dc46cee85fc16651ac35.reference = {
    __cReference: true,
    get value() { return BPANNEL1____header_global_0ebf1cdcea56888f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:295
export const PANNEL1____header_global_6297faf556abfe20 = ((((((342) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_31f9171230dd2e22e31b6353() {
  return __cxx_static_address_31f9171230dd2e22e31b6353.reference || (__cxx_static_address_31f9171230dd2e22e31b6353.reference = {
    __cReference: true,
    get value() { return PANNEL1____header_global_6297faf556abfe20; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:296
export const PANNEL2____header_global_802dba192a974406 = ((((((343) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9300d72493fd51036bdb1ce6() {
  return __cxx_static_address_9300d72493fd51036bdb1ce6.reference || (__cxx_static_address_9300d72493fd51036bdb1ce6.reference = {
    __cReference: true,
    get value() { return PANNEL2____header_global_802dba192a974406; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:297
export const STATIC____header_global_bafecc39df546907 = ((((((351) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b99bbf35d8c9a97b214a8879() {
  return __cxx_static_address_b99bbf35d8c9a97b214a8879.reference || (__cxx_static_address_b99bbf35d8c9a97b214a8879.reference = {
    __cReference: true,
    get value() { return STATIC____header_global_bafecc39df546907; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:298
export const W_SCREENBREAK____header_global_9bcd01085a7342c5 = ((((((357) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7f6745d770eac8462e6af256() {
  return __cxx_static_address_7f6745d770eac8462e6af256.reference || (__cxx_static_address_7f6745d770eac8462e6af256.reference = {
    __cReference: true,
    get value() { return W_SCREENBREAK____header_global_9bcd01085a7342c5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:299
export const W_HITTECHWALL3____header_global_c590b86a393f5091 = ((((((360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a8f44b5ebf4e6a8989b3517a() {
  return __cxx_static_address_a8f44b5ebf4e6a8989b3517a.reference || (__cxx_static_address_a8f44b5ebf4e6a8989b3517a.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL3____header_global_c590b86a393f5091; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:300
export const W_HITTECHWALL4____header_global_ebeba518ad4dc636 = ((((((361) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_919190fd0b9a7e70093ee712() {
  return __cxx_static_address_919190fd0b9a7e70093ee712.reference || (__cxx_static_address_919190fd0b9a7e70093ee712.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL4____header_global_ebeba518ad4dc636; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:301
export const W_HITTECHWALL2____header_global_3662ca55f21b6876 = ((((((362) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8a9759cea1f174e1d1214e95() {
  return __cxx_static_address_8a9759cea1f174e1d1214e95.reference || (__cxx_static_address_8a9759cea1f174e1d1214e95.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL2____header_global_3662ca55f21b6876; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:302
export const W_HITTECHWALL1____header_global_5f170f3c4d22e52c = ((((((363) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_658ee85da49e4150512cce9f() {
  return __cxx_static_address_658ee85da49e4150512cce9f.reference || (__cxx_static_address_658ee85da49e4150512cce9f.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL1____header_global_5f170f3c4d22e52c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:303
export const MASKWALL10____header_global_acbe9f0942e1e3b8 = ((((((387) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cd55370b1e467dba1caf1efd() {
  return __cxx_static_address_cd55370b1e467dba1caf1efd.reference || (__cxx_static_address_cd55370b1e467dba1caf1efd.reference = {
    __cReference: true,
    get value() { return MASKWALL10____header_global_acbe9f0942e1e3b8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:304
export const MASKWALL11____header_global_a538ca1380e7d620 = ((((((391) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_05facaac08d1307b87439a74() {
  return __cxx_static_address_05facaac08d1307b87439a74.reference || (__cxx_static_address_05facaac08d1307b87439a74.reference = {
    __cReference: true,
    get value() { return MASKWALL11____header_global_a538ca1380e7d620; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:305
export const DOORTILE22____header_global_3f91e758599ef619 = ((((((395) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f1b31d3e64a6691aacc77fe8() {
  return __cxx_static_address_f1b31d3e64a6691aacc77fe8.reference || (__cxx_static_address_f1b31d3e64a6691aacc77fe8.reference = {
    __cReference: true,
    get value() { return DOORTILE22____header_global_3f91e758599ef619; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:306
export const FANSPRITE____header_global_7f7e3865db23fead = ((((((407) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c9b4c93ddbbb23b610f98541() {
  return __cxx_static_address_c9b4c93ddbbb23b610f98541.reference || (__cxx_static_address_c9b4c93ddbbb23b610f98541.reference = {
    __cReference: true,
    get value() { return FANSPRITE____header_global_7f7e3865db23fead; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:307
export const FANSPRITEBROKE____header_global_8694e05208f15755 = ((((((411) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_45d02e95d89bb3c864628af8() {
  return __cxx_static_address_45d02e95d89bb3c864628af8.reference || (__cxx_static_address_45d02e95d89bb3c864628af8.reference = {
    __cReference: true,
    get value() { return FANSPRITEBROKE____header_global_8694e05208f15755; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:308
export const FANSHADOW____header_global_cb50fee6b2396d2f = ((((((412) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ea1bdcfb99d6f042caa470b6() {
  return __cxx_static_address_ea1bdcfb99d6f042caa470b6.reference || (__cxx_static_address_ea1bdcfb99d6f042caa470b6.reference = {
    __cReference: true,
    get value() { return FANSHADOW____header_global_cb50fee6b2396d2f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:309
export const FANSHADOWBROKE____header_global_ad3e3cd79802055d = ((((((416) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a48d70ae3bb1e750584b1558() {
  return __cxx_static_address_a48d70ae3bb1e750584b1558.reference || (__cxx_static_address_a48d70ae3bb1e750584b1558.reference = {
    __cReference: true,
    get value() { return FANSHADOWBROKE____header_global_ad3e3cd79802055d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:310
export const DOORTILE18____header_global_b92ba1f07f157bdd = ((((((447) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_be6eb270efe2c3a909564a91() {
  return __cxx_static_address_be6eb270efe2c3a909564a91.reference || (__cxx_static_address_be6eb270efe2c3a909564a91.reference = {
    __cReference: true,
    get value() { return DOORTILE18____header_global_b92ba1f07f157bdd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:311
export const DOORTILE19____header_global_6e597f72e50d88a8 = ((((((448) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_940e833b2424ba77da6d4a91() {
  return __cxx_static_address_940e833b2424ba77da6d4a91.reference || (__cxx_static_address_940e833b2424ba77da6d4a91.reference = {
    __cReference: true,
    get value() { return DOORTILE19____header_global_6e597f72e50d88a8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:312
export const DOORTILE20____header_global_519f974539c411f3 = ((((((449) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b5f970c5dcc671eda50301bd() {
  return __cxx_static_address_b5f970c5dcc671eda50301bd.reference || (__cxx_static_address_b5f970c5dcc671eda50301bd.reference = {
    __cReference: true,
    get value() { return DOORTILE20____header_global_519f974539c411f3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:313
export const VIEWSCREEN2____header_global_91a28e25ef80f207 = ((((((499) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_131690a256e968ed6b81b499() {
  return __cxx_static_address_131690a256e968ed6b81b499.reference || (__cxx_static_address_131690a256e968ed6b81b499.reference = {
    __cReference: true,
    get value() { return VIEWSCREEN2____header_global_91a28e25ef80f207; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:314
export const VIEWSCREEN____header_global_f6cd9aaac8846d36 = ((((((502) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ea27811c3ee1de53d6a2a4e9() {
  return __cxx_static_address_ea27811c3ee1de53d6a2a4e9.reference || (__cxx_static_address_ea27811c3ee1de53d6a2a4e9.reference = {
    __cReference: true,
    get value() { return VIEWSCREEN____header_global_f6cd9aaac8846d36; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:315
export const GLASS____header_global_c86cb1fa7dbf6c84 = ((((((503) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8902263c45314387f3a8d16c() {
  return __cxx_static_address_8902263c45314387f3a8d16c.reference || (__cxx_static_address_8902263c45314387f3a8d16c.reference = {
    __cReference: true,
    get value() { return GLASS____header_global_c86cb1fa7dbf6c84; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:316
export const GLASS2____header_global_8483d5a5fd84d7b3 = ((((((504) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c2f57e45cd2dc40c09f498ba() {
  return __cxx_static_address_c2f57e45cd2dc40c09f498ba.reference || (__cxx_static_address_c2f57e45cd2dc40c09f498ba.reference = {
    __cReference: true,
    get value() { return GLASS2____header_global_8483d5a5fd84d7b3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:317
export const STAINGLASS1____header_global_1763b4d9fa9330eb = ((((((510) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_28a9bd87381d1684841c9d46() {
  return __cxx_static_address_28a9bd87381d1684841c9d46.reference || (__cxx_static_address_28a9bd87381d1684841c9d46.reference = {
    __cReference: true,
    get value() { return STAINGLASS1____header_global_1763b4d9fa9330eb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:318
export const MASKWALL5____header_global_230b0f405a9c6285 = ((((((514) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_829e2c06a438dc021d8c3bf9() {
  return __cxx_static_address_829e2c06a438dc021d8c3bf9.reference || (__cxx_static_address_829e2c06a438dc021d8c3bf9.reference = {
    __cReference: true,
    get value() { return MASKWALL5____header_global_230b0f405a9c6285; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:319
export const SATELITE____header_global_898894ca3d8efefa = ((((((516) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_242f3113b30288f6706c00d1() {
  return __cxx_static_address_242f3113b30288f6706c00d1.reference || (__cxx_static_address_242f3113b30288f6706c00d1.reference = {
    __cReference: true,
    get value() { return SATELITE____header_global_898894ca3d8efefa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:320
export const FUELPOD____header_global_ae617fcde122d948 = ((((((517) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_46d9cedcb8cb3e1c2f6ca9f8() {
  return __cxx_static_address_46d9cedcb8cb3e1c2f6ca9f8.reference || (__cxx_static_address_46d9cedcb8cb3e1c2f6ca9f8.reference = {
    __cReference: true,
    get value() { return FUELPOD____header_global_ae617fcde122d948; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:321
export const CRACK1____header_global_52195ec265581f83 = ((((((546) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f13a978e5d69b30ddeb73c3f() {
  return __cxx_static_address_f13a978e5d69b30ddeb73c3f.reference || (__cxx_static_address_f13a978e5d69b30ddeb73c3f.reference = {
    __cReference: true,
    get value() { return CRACK1____header_global_52195ec265581f83; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:322
export const CRACK2____header_global_4c57b11087b825c9 = ((((((547) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_012bdd1f3bb8bf2d333d01da() {
  return __cxx_static_address_012bdd1f3bb8bf2d333d01da.reference || (__cxx_static_address_012bdd1f3bb8bf2d333d01da.reference = {
    __cReference: true,
    get value() { return CRACK2____header_global_4c57b11087b825c9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:323
export const CRACK3____header_global_2b811b359f3fb60c = ((((((548) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_182cd402542eb4e843b7094c() {
  return __cxx_static_address_182cd402542eb4e843b7094c.reference || (__cxx_static_address_182cd402542eb4e843b7094c.reference = {
    __cReference: true,
    get value() { return CRACK3____header_global_2b811b359f3fb60c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:324
export const CRACK4____header_global_b4d8249cdd7b2ea6 = ((((((549) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f511abe9a27244bc1434a11f() {
  return __cxx_static_address_f511abe9a27244bc1434a11f.reference || (__cxx_static_address_f511abe9a27244bc1434a11f.reference = {
    __cReference: true,
    get value() { return CRACK4____header_global_b4d8249cdd7b2ea6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:325
export const FOOTPRINTS____header_global_cbd86a91031b128b = ((((((550) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_64b57f7bb077d24d42e84df4() {
  return __cxx_static_address_64b57f7bb077d24d42e84df4.reference || (__cxx_static_address_64b57f7bb077d24d42e84df4.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS____header_global_cbd86a91031b128b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:326
export const DOMELITE____header_global_8cc84cf50a6da7c8 = ((((((551) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bdbcd654a5b47c403e3de84c() {
  return __cxx_static_address_bdbcd654a5b47c403e3de84c.reference || (__cxx_static_address_bdbcd654a5b47c403e3de84c.reference = {
    __cReference: true,
    get value() { return DOMELITE____header_global_8cc84cf50a6da7c8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:327
export const CAMERAPOLE____header_global_e04e0b15be183a83 = ((((((554) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5e6ace905b5cc770aef3d5bb() {
  return __cxx_static_address_5e6ace905b5cc770aef3d5bb.reference || (__cxx_static_address_5e6ace905b5cc770aef3d5bb.reference = {
    __cReference: true,
    get value() { return CAMERAPOLE____header_global_e04e0b15be183a83; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:328
export const CHAIR1____header_global_f3c6ec9bd9d0a19d = ((((((556) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9cddd3d9a577cd0c4f41046b() {
  return __cxx_static_address_9cddd3d9a577cd0c4f41046b.reference || (__cxx_static_address_9cddd3d9a577cd0c4f41046b.reference = {
    __cReference: true,
    get value() { return CHAIR1____header_global_f3c6ec9bd9d0a19d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:329
export const CHAIR2____header_global_2f8bb540497854b9 = ((((((557) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5905ef9e6eae53ec8e424ff6() {
  return __cxx_static_address_5905ef9e6eae53ec8e424ff6.reference || (__cxx_static_address_5905ef9e6eae53ec8e424ff6.reference = {
    __cReference: true,
    get value() { return CHAIR2____header_global_2f8bb540497854b9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:330
export const BROKENCHAIR____header_global_0f6bff8d9330e68f = ((((((559) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8cc07eb7acfa5b278bb898eb() {
  return __cxx_static_address_8cc07eb7acfa5b278bb898eb.reference || (__cxx_static_address_8cc07eb7acfa5b278bb898eb.reference = {
    __cReference: true,
    get value() { return BROKENCHAIR____header_global_0f6bff8d9330e68f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:331
export const MIRROR____header_global_1a9bf0f79dfbf843 = ((((((560) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_295891bdc1bbe8f89908699b() {
  return __cxx_static_address_295891bdc1bbe8f89908699b.reference || (__cxx_static_address_295891bdc1bbe8f89908699b.reference = {
    __cReference: true,
    get value() { return MIRROR____header_global_1a9bf0f79dfbf843; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:332
export const WATERFOUNTAIN____header_global_adbbbd2be400d098 = ((((((563) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2a8991b5d1d9f2d43429df78() {
  return __cxx_static_address_2a8991b5d1d9f2d43429df78.reference || (__cxx_static_address_2a8991b5d1d9f2d43429df78.reference = {
    __cReference: true,
    get value() { return WATERFOUNTAIN____header_global_adbbbd2be400d098; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:333
export const WATERFOUNTAINBROKE____header_global_81f2b0c73907b862 = ((((((567) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8da1a1b261dbd5c8eedafc4a() {
  return __cxx_static_address_8da1a1b261dbd5c8eedafc4a.reference || (__cxx_static_address_8da1a1b261dbd5c8eedafc4a.reference = {
    __cReference: true,
    get value() { return WATERFOUNTAINBROKE____header_global_81f2b0c73907b862; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:334
export const FEMMAG1____header_global_176d2e1c0d3f5c84 = ((((((568) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_962727b604e5577e0c152178() {
  return __cxx_static_address_962727b604e5577e0c152178.reference || (__cxx_static_address_962727b604e5577e0c152178.reference = {
    __cReference: true,
    get value() { return FEMMAG1____header_global_176d2e1c0d3f5c84; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:335
export const TOILET____header_global_88d3311017d51e58 = ((((((569) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f36d3de3edb8536c21d5f266() {
  return __cxx_static_address_f36d3de3edb8536c21d5f266.reference || (__cxx_static_address_f36d3de3edb8536c21d5f266.reference = {
    __cReference: true,
    get value() { return TOILET____header_global_88d3311017d51e58; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:336
export const STALL____header_global_a8ab1ceb74a36c98 = ((((((571) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_03d1b32a5a34399c38e8f957() {
  return __cxx_static_address_03d1b32a5a34399c38e8f957.reference || (__cxx_static_address_03d1b32a5a34399c38e8f957.reference = {
    __cReference: true,
    get value() { return STALL____header_global_a8ab1ceb74a36c98; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:337
export const STALLBROKE____header_global_9ae92b9bf7e57965 = ((((((573) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a35549d208689714daacb592() {
  return __cxx_static_address_a35549d208689714daacb592.reference || (__cxx_static_address_a35549d208689714daacb592.reference = {
    __cReference: true,
    get value() { return STALLBROKE____header_global_9ae92b9bf7e57965; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:338
export const FEMMAG2____header_global_4b91520e2a43c80a = ((((((577) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dc67d525a26b88cf981f1c96() {
  return __cxx_static_address_dc67d525a26b88cf981f1c96.reference || (__cxx_static_address_dc67d525a26b88cf981f1c96.reference = {
    __cReference: true,
    get value() { return FEMMAG2____header_global_4b91520e2a43c80a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:339
export const REACTOR2____header_global_6cdd515a428de9af = ((((((578) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_83883615dd6f557f09f9986b() {
  return __cxx_static_address_83883615dd6f557f09f9986b.reference || (__cxx_static_address_83883615dd6f557f09f9986b.reference = {
    __cReference: true,
    get value() { return REACTOR2____header_global_6cdd515a428de9af; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:340
export const REACTOR2BURNT____header_global_133f5d1533799b2c = ((((((579) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_53ed5a29dc29553d8ecc0696() {
  return __cxx_static_address_53ed5a29dc29553d8ecc0696.reference || (__cxx_static_address_53ed5a29dc29553d8ecc0696.reference = {
    __cReference: true,
    get value() { return REACTOR2BURNT____header_global_133f5d1533799b2c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:341
export const REACTOR2SPARK____header_global_75db899a43629f85 = ((((((580) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a9d007436b1f8fe84d3b1bc5() {
  return __cxx_static_address_a9d007436b1f8fe84d3b1bc5.reference || (__cxx_static_address_a9d007436b1f8fe84d3b1bc5.reference = {
    __cReference: true,
    get value() { return REACTOR2SPARK____header_global_75db899a43629f85; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:342
export const GRATE1____header_global_5ae578b67d2e2350 = ((((((595) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1a6ddc4a4fd7b295b58dc0f8() {
  return __cxx_static_address_1a6ddc4a4fd7b295b58dc0f8.reference || (__cxx_static_address_1a6ddc4a4fd7b295b58dc0f8.reference = {
    __cReference: true,
    get value() { return GRATE1____header_global_5ae578b67d2e2350; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:343
export const BGRATE1____header_global_d347fec077b78d5d = ((((((596) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f8f8b6fabab8027f317d9ab8() {
  return __cxx_static_address_f8f8b6fabab8027f317d9ab8.reference || (__cxx_static_address_f8f8b6fabab8027f317d9ab8.reference = {
    __cReference: true,
    get value() { return BGRATE1____header_global_d347fec077b78d5d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:344
export const SOLARPANNEL____header_global_6c75f2ad45272d1a = ((((((602) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ffef46b7b6e6f53e0f7972b7() {
  return __cxx_static_address_ffef46b7b6e6f53e0f7972b7.reference || (__cxx_static_address_ffef46b7b6e6f53e0f7972b7.reference = {
    __cReference: true,
    get value() { return SOLARPANNEL____header_global_6c75f2ad45272d1a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:345
export const NAKED1____header_global_b473e618550871e1 = ((((((603) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_39ccb57ea4a5710b0dce1044() {
  return __cxx_static_address_39ccb57ea4a5710b0dce1044.reference || (__cxx_static_address_39ccb57ea4a5710b0dce1044.reference = {
    __cReference: true,
    get value() { return NAKED1____header_global_b473e618550871e1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:346
export const ANTENNA____header_global_cb2c15f4e32941f1 = ((((((607) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4771ef627abf088d6432cb34() {
  return __cxx_static_address_4771ef627abf088d6432cb34.reference || (__cxx_static_address_4771ef627abf088d6432cb34.reference = {
    __cReference: true,
    get value() { return ANTENNA____header_global_cb2c15f4e32941f1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:347
export const MASKWALL12____header_global_b288046c327b8d77 = ((((((609) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ac29ea0998215de0bdec2f8c() {
  return __cxx_static_address_ac29ea0998215de0bdec2f8c.reference || (__cxx_static_address_ac29ea0998215de0bdec2f8c.reference = {
    __cReference: true,
    get value() { return MASKWALL12____header_global_b288046c327b8d77; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:348
export const TOILETBROKE____header_global_e77380c3f79b00df = ((((((615) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6f47f225aa227f0a73fa34dd() {
  return __cxx_static_address_6f47f225aa227f0a73fa34dd.reference || (__cxx_static_address_6f47f225aa227f0a73fa34dd.reference = {
    __cReference: true,
    get value() { return TOILETBROKE____header_global_e77380c3f79b00df; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:349
export const PIPE2____header_global_de75ecb0ca728539 = ((((((616) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a056e059c7714f834305cb5c() {
  return __cxx_static_address_a056e059c7714f834305cb5c.reference || (__cxx_static_address_a056e059c7714f834305cb5c.reference = {
    __cReference: true,
    get value() { return PIPE2____header_global_de75ecb0ca728539; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:350
export const PIPE1B____header_global_6772017ee607f9f4 = ((((((617) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_51d8211190271d0135b78dd3() {
  return __cxx_static_address_51d8211190271d0135b78dd3.reference || (__cxx_static_address_51d8211190271d0135b78dd3.reference = {
    __cReference: true,
    get value() { return PIPE1B____header_global_6772017ee607f9f4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:351
export const PIPE3____header_global_a6e59458fd12cc8b = ((((((618) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6f4709aaaa7f56152d9c1d0e() {
  return __cxx_static_address_6f4709aaaa7f56152d9c1d0e.reference || (__cxx_static_address_6f4709aaaa7f56152d9c1d0e.reference = {
    __cReference: true,
    get value() { return PIPE3____header_global_a6e59458fd12cc8b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:352
export const PIPE1____header_global_faaade81efd02752 = ((((((619) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bb2b3df2ab91eb1b74388e53() {
  return __cxx_static_address_bb2b3df2ab91eb1b74388e53.reference || (__cxx_static_address_bb2b3df2ab91eb1b74388e53.reference = {
    __cReference: true,
    get value() { return PIPE1____header_global_faaade81efd02752; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:353
export const CAMERA1____header_global_b6d8eefbe2d8389d = ((((((621) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a308432191c27ffceac382a0() {
  return __cxx_static_address_a308432191c27ffceac382a0.reference || (__cxx_static_address_a308432191c27ffceac382a0.reference = {
    __cReference: true,
    get value() { return CAMERA1____header_global_b6d8eefbe2d8389d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:354
export const PIPE2B____header_global_7f2e7d860597fb16 = ((((((633) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_de26ab0cc54cefdcf5ec2223() {
  return __cxx_static_address_de26ab0cc54cefdcf5ec2223.reference || (__cxx_static_address_de26ab0cc54cefdcf5ec2223.reference = {
    __cReference: true,
    get value() { return PIPE2B____header_global_7f2e7d860597fb16; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:355
export const BOLT1____header_global_eabf07001b439433 = ((((((634) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_abcf6479a3cdd5df61e1bf05() {
  return __cxx_static_address_abcf6479a3cdd5df61e1bf05.reference || (__cxx_static_address_abcf6479a3cdd5df61e1bf05.reference = {
    __cReference: true,
    get value() { return BOLT1____header_global_eabf07001b439433; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:356
export const W_NUMBERS____header_global_2c13ba042c1476e8 = ((((((640) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b7235a64f20cb17fad097f5e() {
  return __cxx_static_address_b7235a64f20cb17fad097f5e.reference || (__cxx_static_address_b7235a64f20cb17fad097f5e.reference = {
    __cReference: true,
    get value() { return W_NUMBERS____header_global_2c13ba042c1476e8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:357
export const WATERDRIP____header_global_0fd2373b87a22a77 = ((((((660) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_db7dcf4c55aa9cd7e4403fdd() {
  return __cxx_static_address_db7dcf4c55aa9cd7e4403fdd.reference || (__cxx_static_address_db7dcf4c55aa9cd7e4403fdd.reference = {
    __cReference: true,
    get value() { return WATERDRIP____header_global_0fd2373b87a22a77; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:358
export const WATERBUBBLE____header_global_997ff8cd029f8fa2 = ((((((661) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8ba5b47fd3bbdf2bd4408e5a() {
  return __cxx_static_address_8ba5b47fd3bbdf2bd4408e5a.reference || (__cxx_static_address_8ba5b47fd3bbdf2bd4408e5a.reference = {
    __cReference: true,
    get value() { return WATERBUBBLE____header_global_997ff8cd029f8fa2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:359
export const WATERBUBBLEMAKER____header_global_91f7af18681e05ee = ((((((662) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_935286ec01265793085778ba() {
  return __cxx_static_address_935286ec01265793085778ba.reference || (__cxx_static_address_935286ec01265793085778ba.reference = {
    __cReference: true,
    get value() { return WATERBUBBLEMAKER____header_global_91f7af18681e05ee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:360
export const W_FORCEFIELD____header_global_9d93eaf281a206ec = ((((((663) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4be1086f1d7df74eb6352d61() {
  return __cxx_static_address_4be1086f1d7df74eb6352d61.reference || (__cxx_static_address_4be1086f1d7df74eb6352d61.reference = {
    __cReference: true,
    get value() { return W_FORCEFIELD____header_global_9d93eaf281a206ec; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:361
export const VACUUM____header_global_d254ef38e975121f = ((((((669) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3ced0d0ccc5f1706d29ef708() {
  return __cxx_static_address_3ced0d0ccc5f1706d29ef708.reference || (__cxx_static_address_3ced0d0ccc5f1706d29ef708.reference = {
    __cReference: true,
    get value() { return VACUUM____header_global_d254ef38e975121f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:362
export const FOOTPRINTS2____header_global_8d4eb92edab9ff50 = ((((((672) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5628a1a9b3b19a1a63ab15d8() {
  return __cxx_static_address_5628a1a9b3b19a1a63ab15d8.reference || (__cxx_static_address_5628a1a9b3b19a1a63ab15d8.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS2____header_global_8d4eb92edab9ff50; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:363
export const FOOTPRINTS3____header_global_d39770533a2e18c9 = ((((((673) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6ea2f8c09355385b19ae1d9b() {
  return __cxx_static_address_6ea2f8c09355385b19ae1d9b.reference || (__cxx_static_address_6ea2f8c09355385b19ae1d9b.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS3____header_global_d39770533a2e18c9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:364
export const FOOTPRINTS4____header_global_fb09ed949fe58063 = ((((((674) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2dee4dd4566575e2bc119674() {
  return __cxx_static_address_2dee4dd4566575e2bc119674.reference || (__cxx_static_address_2dee4dd4566575e2bc119674.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS4____header_global_fb09ed949fe58063; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:365
export const EGG____header_global_ff8584fb9f33ed71 = ((((((675) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6eadcff443244fe6bba5530d() {
  return __cxx_static_address_6eadcff443244fe6bba5530d.reference || (__cxx_static_address_6eadcff443244fe6bba5530d.reference = {
    __cReference: true,
    get value() { return EGG____header_global_ff8584fb9f33ed71; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:366
export const SCALE____header_global_bc987a6bbf501ffe = ((((((678) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fe6e1c7ffe217bfdd5905d9c() {
  return __cxx_static_address_fe6e1c7ffe217bfdd5905d9c.reference || (__cxx_static_address_fe6e1c7ffe217bfdd5905d9c.reference = {
    __cReference: true,
    get value() { return SCALE____header_global_bc987a6bbf501ffe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:367
export const CHAIR3____header_global_894935ccc5752a4a = ((((((680) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_96da69924b5139b898dcd36a() {
  return __cxx_static_address_96da69924b5139b898dcd36a.reference || (__cxx_static_address_96da69924b5139b898dcd36a.reference = {
    __cReference: true,
    get value() { return CHAIR3____header_global_894935ccc5752a4a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:368
export const CAMERALIGHT____header_global_f7a92a432f407edb = ((((((685) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5ae3a02b5c2856758e3b2eae() {
  return __cxx_static_address_5ae3a02b5c2856758e3b2eae.reference || (__cxx_static_address_5ae3a02b5c2856758e3b2eae.reference = {
    __cReference: true,
    get value() { return CAMERALIGHT____header_global_f7a92a432f407edb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:369
export const MOVIECAMERA____header_global_321255dcc5b32a10 = ((((((686) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3c5b33afdc90eef7521f4e3a() {
  return __cxx_static_address_3c5b33afdc90eef7521f4e3a.reference || (__cxx_static_address_3c5b33afdc90eef7521f4e3a.reference = {
    __cReference: true,
    get value() { return MOVIECAMERA____header_global_321255dcc5b32a10; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:370
export const IVUNIT____header_global_f79714f5ad080313 = ((((((689) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_16cf41a9e0c30f9225f175b9() {
  return __cxx_static_address_16cf41a9e0c30f9225f175b9.reference || (__cxx_static_address_16cf41a9e0c30f9225f175b9.reference = {
    __cReference: true,
    get value() { return IVUNIT____header_global_f79714f5ad080313; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:371
export const POT1____header_global_f7ad0bd6d05b38a5 = ((((((694) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f94bda10759ec377b34abb5a() {
  return __cxx_static_address_f94bda10759ec377b34abb5a.reference || (__cxx_static_address_f94bda10759ec377b34abb5a.reference = {
    __cReference: true,
    get value() { return POT1____header_global_f7ad0bd6d05b38a5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:372
export const POT2____header_global_858e1feb712db5cf = ((((((695) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6441777787194a59254a17fb() {
  return __cxx_static_address_6441777787194a59254a17fb.reference || (__cxx_static_address_6441777787194a59254a17fb.reference = {
    __cReference: true,
    get value() { return POT2____header_global_858e1feb712db5cf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:373
export const POT3____header_global_94edce91870e5549 = ((((((697) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3926d5de928ab95c86089376() {
  return __cxx_static_address_3926d5de928ab95c86089376.reference || (__cxx_static_address_3926d5de928ab95c86089376.reference = {
    __cReference: true,
    get value() { return POT3____header_global_94edce91870e5549; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:374
export const PIPE3B____header_global_35a91cfef7638f13 = ((((((700) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_79b471f305714e25607caeb4() {
  return __cxx_static_address_79b471f305714e25607caeb4.reference || (__cxx_static_address_79b471f305714e25607caeb4.reference = {
    __cReference: true,
    get value() { return PIPE3B____header_global_35a91cfef7638f13; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:375
export const WALLLIGHT3____header_global_07a864151e9b4f0c = ((((((701) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ba42b2c9c178f157c7ce6d15() {
  return __cxx_static_address_ba42b2c9c178f157c7ce6d15.reference || (__cxx_static_address_ba42b2c9c178f157c7ce6d15.reference = {
    __cReference: true,
    get value() { return WALLLIGHT3____header_global_07a864151e9b4f0c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:376
export const WALLLIGHTBUST3____header_global_feaded76cd31851d = ((((((702) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c20eb012ec634d0553606c9d() {
  return __cxx_static_address_c20eb012ec634d0553606c9d.reference || (__cxx_static_address_c20eb012ec634d0553606c9d.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST3____header_global_feaded76cd31851d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:377
export const WALLLIGHT1____header_global_a095cf8536d6e6b7 = ((((((703) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_155072dda4849258990e2584() {
  return __cxx_static_address_155072dda4849258990e2584.reference || (__cxx_static_address_155072dda4849258990e2584.reference = {
    __cReference: true,
    get value() { return WALLLIGHT1____header_global_a095cf8536d6e6b7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:378
export const WALLLIGHTBUST1____header_global_5e36575f235bb8e2 = ((((((704) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3b2dadf58177755040f7f90e() {
  return __cxx_static_address_3b2dadf58177755040f7f90e.reference || (__cxx_static_address_3b2dadf58177755040f7f90e.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST1____header_global_5e36575f235bb8e2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:379
export const WALLLIGHT2____header_global_9ec8dfc86c459c3f = ((((((705) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aad1134a92e3d450d40ecf37() {
  return __cxx_static_address_aad1134a92e3d450d40ecf37.reference || (__cxx_static_address_aad1134a92e3d450d40ecf37.reference = {
    __cReference: true,
    get value() { return WALLLIGHT2____header_global_9ec8dfc86c459c3f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:380
export const WALLLIGHTBUST2____header_global_ae017a32778369d2 = ((((((706) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4146405f5c4bdd01a6eff973() {
  return __cxx_static_address_4146405f5c4bdd01a6eff973.reference || (__cxx_static_address_4146405f5c4bdd01a6eff973.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST2____header_global_ae017a32778369d2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:381
export const LIGHTSWITCH2____header_global_9bb7817825d5eb49 = ((((((712) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_64cbb95d07b4bb99f651576d() {
  return __cxx_static_address_64cbb95d07b4bb99f651576d.reference || (__cxx_static_address_64cbb95d07b4bb99f651576d.reference = {
    __cReference: true,
    get value() { return LIGHTSWITCH2____header_global_9bb7817825d5eb49; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:382
export const WAITTOBESEATED____header_global_7fea8e4c08cd7c28 = ((((((716) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fc8fa5f06c9d5fd92a39366d() {
  return __cxx_static_address_fc8fa5f06c9d5fd92a39366d.reference || (__cxx_static_address_fc8fa5f06c9d5fd92a39366d.reference = {
    __cReference: true,
    get value() { return WAITTOBESEATED____header_global_7fea8e4c08cd7c28; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:383
export const DOORTILE14____header_global_2a2f885cb0422e1d = ((((((717) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f18e618d5f27e9403fe3c204() {
  return __cxx_static_address_f18e618d5f27e9403fe3c204.reference || (__cxx_static_address_f18e618d5f27e9403fe3c204.reference = {
    __cReference: true,
    get value() { return DOORTILE14____header_global_2a2f885cb0422e1d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:384
export const STATUE____header_global_581e835c7104bfed = ((((((753) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fdc7f5f0cecb82dda0a67038() {
  return __cxx_static_address_fdc7f5f0cecb82dda0a67038.reference || (__cxx_static_address_fdc7f5f0cecb82dda0a67038.reference = {
    __cReference: true,
    get value() { return STATUE____header_global_581e835c7104bfed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:385
export const MIKE____header_global_f55a7c3f65e47d56 = ((((((762) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6faa1f8ef62b41d0cb348cb6() {
  return __cxx_static_address_6faa1f8ef62b41d0cb348cb6.reference || (__cxx_static_address_6faa1f8ef62b41d0cb348cb6.reference = {
    __cReference: true,
    get value() { return MIKE____header_global_f55a7c3f65e47d56; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:386
export const VASE____header_global_0e2d211359668362 = ((((((765) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_19cdc507c1ad3af309028277() {
  return __cxx_static_address_19cdc507c1ad3af309028277.reference || (__cxx_static_address_19cdc507c1ad3af309028277.reference = {
    __cReference: true,
    get value() { return VASE____header_global_0e2d211359668362; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:387
export const SUSHIPLATE1____header_global_f345a203404fd0d7 = ((((((768) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d6332361d8ff9b944cb22dde() {
  return __cxx_static_address_d6332361d8ff9b944cb22dde.reference || (__cxx_static_address_d6332361d8ff9b944cb22dde.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE1____header_global_f345a203404fd0d7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:388
export const SUSHIPLATE2____header_global_83ce3956e72c0ab6 = ((((((769) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_593c59e91d58e38bab4781e3() {
  return __cxx_static_address_593c59e91d58e38bab4781e3.reference || (__cxx_static_address_593c59e91d58e38bab4781e3.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE2____header_global_83ce3956e72c0ab6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:389
export const SUSHIPLATE3____header_global_2ddc140a128b372c = ((((((774) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5d76bb8b7b2aca7b01bea05e() {
  return __cxx_static_address_5d76bb8b7b2aca7b01bea05e.reference || (__cxx_static_address_5d76bb8b7b2aca7b01bea05e.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE3____header_global_2ddc140a128b372c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:390
export const SUSHIPLATE4____header_global_ea1419d54e518652 = ((((((779) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f27863c4c604d0947f9be3fb() {
  return __cxx_static_address_f27863c4c604d0947f9be3fb.reference || (__cxx_static_address_f27863c4c604d0947f9be3fb.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE4____header_global_ea1419d54e518652; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:391
export const DOORTILE16____header_global_2323120b244e7547 = ((((((781) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f35ae4c3f1b4013ebd5aef70() {
  return __cxx_static_address_f35ae4c3f1b4013ebd5aef70.reference || (__cxx_static_address_f35ae4c3f1b4013ebd5aef70.reference = {
    __cReference: true,
    get value() { return DOORTILE16____header_global_2323120b244e7547; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:392
export const SUSHIPLATE5____header_global_3f15e80612dd0a1c = ((((((792) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_589a4dcf7ac4d9204d53d3bd() {
  return __cxx_static_address_589a4dcf7ac4d9204d53d3bd.reference || (__cxx_static_address_589a4dcf7ac4d9204d53d3bd.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE5____header_global_3f15e80612dd0a1c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:393
export const OJ____header_global_ff184607c9bf0b2f = ((((((806) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eb17e826be08f08f3640ecf3() {
  return __cxx_static_address_eb17e826be08f08f3640ecf3.reference || (__cxx_static_address_eb17e826be08f08f3640ecf3.reference = {
    __cReference: true,
    get value() { return OJ____header_global_ff184607c9bf0b2f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:394
export const MASKWALL13____header_global_04365adef8859974 = ((((((830) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b129d4ed6af5c817cd4dea8c() {
  return __cxx_static_address_b129d4ed6af5c817cd4dea8c.reference || (__cxx_static_address_b129d4ed6af5c817cd4dea8c.reference = {
    __cReference: true,
    get value() { return MASKWALL13____header_global_04365adef8859974; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:395
export const HURTRAIL____header_global_c4528011eab5ccb9 = ((((((859) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_053d52cf155fcedef8815ca9() {
  return __cxx_static_address_053d52cf155fcedef8815ca9.reference || (__cxx_static_address_053d52cf155fcedef8815ca9.reference = {
    __cReference: true,
    get value() { return HURTRAIL____header_global_c4528011eab5ccb9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:396
export const POWERSWITCH1____header_global_ef19fb8ff2f6d163 = ((((((860) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1e3194eff4201eb8738bc2d0() {
  return __cxx_static_address_1e3194eff4201eb8738bc2d0.reference || (__cxx_static_address_1e3194eff4201eb8738bc2d0.reference = {
    __cReference: true,
    get value() { return POWERSWITCH1____header_global_ef19fb8ff2f6d163; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:397
export const LOCKSWITCH1____header_global_dc980ff41bdfbdb4 = ((((((862) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5acd3b9d3f4b72b2641012f0() {
  return __cxx_static_address_5acd3b9d3f4b72b2641012f0.reference || (__cxx_static_address_5acd3b9d3f4b72b2641012f0.reference = {
    __cReference: true,
    get value() { return LOCKSWITCH1____header_global_dc980ff41bdfbdb4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:398
export const POWERSWITCH2____header_global_aeef7eddc807c74e = ((((((864) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_97a3e4acdd4603830eaaf6d7() {
  return __cxx_static_address_97a3e4acdd4603830eaaf6d7.reference || (__cxx_static_address_97a3e4acdd4603830eaaf6d7.reference = {
    __cReference: true,
    get value() { return POWERSWITCH2____header_global_aeef7eddc807c74e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:399
export const ATM____header_global_642c91d85ebb50c0 = ((((((867) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f96f58cca68a706b092be7ac() {
  return __cxx_static_address_f96f58cca68a706b092be7ac.reference || (__cxx_static_address_f96f58cca68a706b092be7ac.reference = {
    __cReference: true,
    get value() { return ATM____header_global_642c91d85ebb50c0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:400
export const STATUEFLASH____header_global_dd62fb674d1a9c26 = ((((((869) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_674acaf914cb67fc20c49ab6() {
  return __cxx_static_address_674acaf914cb67fc20c49ab6.reference || (__cxx_static_address_674acaf914cb67fc20c49ab6.reference = {
    __cReference: true,
    get value() { return STATUEFLASH____header_global_dd62fb674d1a9c26; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:401
export const ATMBROKE____header_global_0b56bc557667e6ef = ((((((888) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a16f2b181a97c0671744b466() {
  return __cxx_static_address_a16f2b181a97c0671744b466.reference || (__cxx_static_address_a16f2b181a97c0671744b466.reference = {
    __cReference: true,
    get value() { return ATMBROKE____header_global_0b56bc557667e6ef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:402
export const STRIPEBALL____header_global_d01f0188ecd3732b = ((((((901) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_70c2d46651abc992f2e53f71() {
  return __cxx_static_address_70c2d46651abc992f2e53f71.reference || (__cxx_static_address_70c2d46651abc992f2e53f71.reference = {
    __cReference: true,
    get value() { return STRIPEBALL____header_global_d01f0188ecd3732b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:403
export const QUEBALL____header_global_a7e71784928e6450 = ((((((902) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7c023d37b4d7342859f11598() {
  return __cxx_static_address_7c023d37b4d7342859f11598.reference || (__cxx_static_address_7c023d37b4d7342859f11598.reference = {
    __cReference: true,
    get value() { return QUEBALL____header_global_a7e71784928e6450; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:404
export const POCKET____header_global_c982b60e15b174ae = ((((((903) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_df57aa67187a978ac2c0e3d8() {
  return __cxx_static_address_df57aa67187a978ac2c0e3d8.reference || (__cxx_static_address_df57aa67187a978ac2c0e3d8.reference = {
    __cReference: true,
    get value() { return POCKET____header_global_c982b60e15b174ae; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:405
export const WOODENHORSE____header_global_ae62297c6997d564 = ((((((904) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2b2c67df4da8553b341eb597() {
  return __cxx_static_address_2b2c67df4da8553b341eb597.reference || (__cxx_static_address_2b2c67df4da8553b341eb597.reference = {
    __cReference: true,
    get value() { return WOODENHORSE____header_global_ae62297c6997d564; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:406
export const TREE1____header_global_9f9e18e9d5a0ee96 = ((((((908) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7df11ebb4a6d7e17b40dbb1a() {
  return __cxx_static_address_7df11ebb4a6d7e17b40dbb1a.reference || (__cxx_static_address_7df11ebb4a6d7e17b40dbb1a.reference = {
    __cReference: true,
    get value() { return TREE1____header_global_9f9e18e9d5a0ee96; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:407
export const TREE2____header_global_9f5c16f19d4879bc = ((((((910) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3d2305ac713994e6f475dd7a() {
  return __cxx_static_address_3d2305ac713994e6f475dd7a.reference || (__cxx_static_address_3d2305ac713994e6f475dd7a.reference = {
    __cReference: true,
    get value() { return TREE2____header_global_9f5c16f19d4879bc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:408
export const CACTUS____header_global_91ec3eeeba0d320e = ((((((911) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_61fbb60e13a8becd5a3bf6c0() {
  return __cxx_static_address_61fbb60e13a8becd5a3bf6c0.reference || (__cxx_static_address_61fbb60e13a8becd5a3bf6c0.reference = {
    __cReference: true,
    get value() { return CACTUS____header_global_91ec3eeeba0d320e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:409
export const MASKWALL2____header_global_8ec66cf8f9f1b0fa = ((((((913) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b658fb32034ab6feae3bc0a2() {
  return __cxx_static_address_b658fb32034ab6feae3bc0a2.reference || (__cxx_static_address_b658fb32034ab6feae3bc0a2.reference = {
    __cReference: true,
    get value() { return MASKWALL2____header_global_8ec66cf8f9f1b0fa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:410
export const MASKWALL3____header_global_c0cf0c76734400b5 = ((((((914) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ebe732b8c6926a3729a1062a() {
  return __cxx_static_address_ebe732b8c6926a3729a1062a.reference || (__cxx_static_address_ebe732b8c6926a3729a1062a.reference = {
    __cReference: true,
    get value() { return MASKWALL3____header_global_c0cf0c76734400b5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:411
export const MASKWALL4____header_global_8ebd15a9ab4e7dd6 = ((((((915) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d943cac66e229cf785a5c9b8() {
  return __cxx_static_address_d943cac66e229cf785a5c9b8.reference || (__cxx_static_address_d943cac66e229cf785a5c9b8.reference = {
    __cReference: true,
    get value() { return MASKWALL4____header_global_8ebd15a9ab4e7dd6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:412
export const FIREEXT____header_global_dad2e55fa003113d = ((((((916) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d73549063a4bbd15cba42d97() {
  return __cxx_static_address_d73549063a4bbd15cba42d97.reference || (__cxx_static_address_d73549063a4bbd15cba42d97.reference = {
    __cReference: true,
    get value() { return FIREEXT____header_global_dad2e55fa003113d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:413
export const TOILETWATER____header_global_6295ea717b3b5bca = ((((((921) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a4792dd4c34c36213e49b0b0() {
  return __cxx_static_address_a4792dd4c34c36213e49b0b0.reference || (__cxx_static_address_a4792dd4c34c36213e49b0b0.reference = {
    __cReference: true,
    get value() { return TOILETWATER____header_global_6295ea717b3b5bca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:414
export const NEON1____header_global_cf8f3c1fd35612f9 = ((((((925) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f9df27375f71c7eb3a610e95() {
  return __cxx_static_address_f9df27375f71c7eb3a610e95.reference || (__cxx_static_address_f9df27375f71c7eb3a610e95.reference = {
    __cReference: true,
    get value() { return NEON1____header_global_cf8f3c1fd35612f9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:415
export const NEON2____header_global_4ad94820b84e6ab6 = ((((((926) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cf6eb7160d3d13718b292bb6() {
  return __cxx_static_address_cf6eb7160d3d13718b292bb6.reference || (__cxx_static_address_cf6eb7160d3d13718b292bb6.reference = {
    __cReference: true,
    get value() { return NEON2____header_global_4ad94820b84e6ab6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:416
export const CACTUSBROKE____header_global_6a180034c4936116 = ((((((939) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1bd67bd25f0e6b53f9c36c61() {
  return __cxx_static_address_1bd67bd25f0e6b53f9c36c61.reference || (__cxx_static_address_1bd67bd25f0e6b53f9c36c61.reference = {
    __cReference: true,
    get value() { return CACTUSBROKE____header_global_6a180034c4936116; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:417
export const BOUNCEMINE____header_global_758eec703a5f0f8a = ((((((940) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8675828a7d16ac88c1924b09() {
  return __cxx_static_address_8675828a7d16ac88c1924b09.reference || (__cxx_static_address_8675828a7d16ac88c1924b09.reference = {
    __cReference: true,
    get value() { return BOUNCEMINE____header_global_758eec703a5f0f8a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:418
export const BROKEFIREHYDRENT____header_global_e393e655f3bdf6cb = ((((((950) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_23c307b76b3a99232bef7d74() {
  return __cxx_static_address_23c307b76b3a99232bef7d74.reference || (__cxx_static_address_23c307b76b3a99232bef7d74.reference = {
    __cReference: true,
    get value() { return BROKEFIREHYDRENT____header_global_e393e655f3bdf6cb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:419
export const BOX____header_global_38bd1cba919b34c1 = ((((((951) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_944e32b2618cf59790ed631e() {
  return __cxx_static_address_944e32b2618cf59790ed631e.reference || (__cxx_static_address_944e32b2618cf59790ed631e.reference = {
    __cReference: true,
    get value() { return BOX____header_global_38bd1cba919b34c1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:420
export const BULLETHOLE____header_global_b4ddc037b1658bf2 = ((((((952) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_827c04b7fdecd319b1a1e86a() {
  return __cxx_static_address_827c04b7fdecd319b1a1e86a.reference || (__cxx_static_address_827c04b7fdecd319b1a1e86a.reference = {
    __cReference: true,
    get value() { return BULLETHOLE____header_global_b4ddc037b1658bf2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:421
export const BOTTLE1____header_global_629de793e9e9a819 = ((((((954) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6f034b69f5bd47baa9366d07() {
  return __cxx_static_address_6f034b69f5bd47baa9366d07.reference || (__cxx_static_address_6f034b69f5bd47baa9366d07.reference = {
    __cReference: true,
    get value() { return BOTTLE1____header_global_629de793e9e9a819; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:422
export const BOTTLE2____header_global_2fec28c04dfc4831 = ((((((955) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5986fcce32712e6f454bf784() {
  return __cxx_static_address_5986fcce32712e6f454bf784.reference || (__cxx_static_address_5986fcce32712e6f454bf784.reference = {
    __cReference: true,
    get value() { return BOTTLE2____header_global_2fec28c04dfc4831; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:423
export const BOTTLE3____header_global_90d791f7c6dbe3e1 = ((((((956) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_23081937c7ebfa225fc1c3f3() {
  return __cxx_static_address_23081937c7ebfa225fc1c3f3.reference || (__cxx_static_address_23081937c7ebfa225fc1c3f3.reference = {
    __cReference: true,
    get value() { return BOTTLE3____header_global_90d791f7c6dbe3e1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:424
export const BOTTLE4____header_global_5bd6de728597fd17 = ((((((957) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9bafa9bb67025db2dfe55086() {
  return __cxx_static_address_9bafa9bb67025db2dfe55086.reference || (__cxx_static_address_9bafa9bb67025db2dfe55086.reference = {
    __cReference: true,
    get value() { return BOTTLE4____header_global_5bd6de728597fd17; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:425
export const FEMPIC5____header_global_cf0477be4718bdf4 = ((((((963) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5d272272ba69f091c79447e6() {
  return __cxx_static_address_5d272272ba69f091c79447e6.reference || (__cxx_static_address_5d272272ba69f091c79447e6.reference = {
    __cReference: true,
    get value() { return FEMPIC5____header_global_cf0477be4718bdf4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:426
export const FEMPIC6____header_global_f6f09fdfc9ef291f = ((((((964) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ddc18033df282e406ad24087() {
  return __cxx_static_address_ddc18033df282e406ad24087.reference || (__cxx_static_address_ddc18033df282e406ad24087.reference = {
    __cReference: true,
    get value() { return FEMPIC6____header_global_f6f09fdfc9ef291f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:427
export const FEMPIC7____header_global_5b1814b1d93d1681 = ((((((965) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a6eaf11ee488b5ef0e3ab877() {
  return __cxx_static_address_a6eaf11ee488b5ef0e3ab877.reference || (__cxx_static_address_a6eaf11ee488b5ef0e3ab877.reference = {
    __cReference: true,
    get value() { return FEMPIC7____header_global_5b1814b1d93d1681; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:428
export const HYDROPLANT____header_global_1551d58cada210cd = ((((((969) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fed36204546adcd60030d22e() {
  return __cxx_static_address_fed36204546adcd60030d22e.reference || (__cxx_static_address_fed36204546adcd60030d22e.reference = {
    __cReference: true,
    get value() { return HYDROPLANT____header_global_1551d58cada210cd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:429
export const OCEANSPRITE1____header_global_049fbced30921f42 = ((((((971) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0081a3470210c10b186e4777() {
  return __cxx_static_address_0081a3470210c10b186e4777.reference || (__cxx_static_address_0081a3470210c10b186e4777.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE1____header_global_049fbced30921f42; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:430
export const OCEANSPRITE2____header_global_2f4b5b23a4189c0e = ((((((972) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ce2ebab4ea2c4e7588c913b6() {
  return __cxx_static_address_ce2ebab4ea2c4e7588c913b6.reference || (__cxx_static_address_ce2ebab4ea2c4e7588c913b6.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE2____header_global_2f4b5b23a4189c0e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:431
export const OCEANSPRITE3____header_global_4d1b08e2c5017b0c = ((((((973) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_166f8c66f3e995e5bbef498b() {
  return __cxx_static_address_166f8c66f3e995e5bbef498b.reference || (__cxx_static_address_166f8c66f3e995e5bbef498b.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE3____header_global_4d1b08e2c5017b0c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:432
export const OCEANSPRITE4____header_global_027f01776cf80513 = ((((((974) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_92895210c3ee5e0d8dd92bb1() {
  return __cxx_static_address_92895210c3ee5e0d8dd92bb1.reference || (__cxx_static_address_92895210c3ee5e0d8dd92bb1.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE4____header_global_027f01776cf80513; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:433
export const OCEANSPRITE5____header_global_681696af334fa6fe = ((((((975) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2ee43dbdd27dc9dd40fa7727() {
  return __cxx_static_address_2ee43dbdd27dc9dd40fa7727.reference || (__cxx_static_address_2ee43dbdd27dc9dd40fa7727.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE5____header_global_681696af334fa6fe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:434
export const GENERICPOLE____header_global_bf76efc8664c4912 = ((((((977) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8df4892b5f5ac0cd57e294be() {
  return __cxx_static_address_8df4892b5f5ac0cd57e294be.reference || (__cxx_static_address_8df4892b5f5ac0cd57e294be.reference = {
    __cReference: true,
    get value() { return GENERICPOLE____header_global_bf76efc8664c4912; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:435
export const CONE____header_global_3a51f4564596a73a = ((((((978) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_568b789a206b4e6985ab0e0f() {
  return __cxx_static_address_568b789a206b4e6985ab0e0f.reference || (__cxx_static_address_568b789a206b4e6985ab0e0f.reference = {
    __cReference: true,
    get value() { return CONE____header_global_3a51f4564596a73a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:436
export const HANGLIGHT____header_global_c2ed26067ba45c6a = ((((((979) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_21cee428d830fb9dfac64b24() {
  return __cxx_static_address_21cee428d830fb9dfac64b24.reference || (__cxx_static_address_21cee428d830fb9dfac64b24.reference = {
    __cReference: true,
    get value() { return HANGLIGHT____header_global_c2ed26067ba45c6a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:437
export const HYDRENT____header_global_efff2064b4190fee = ((((((981) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d67d4a2858cc159795cd2889() {
  return __cxx_static_address_d67d4a2858cc159795cd2889.reference || (__cxx_static_address_d67d4a2858cc159795cd2889.reference = {
    __cReference: true,
    get value() { return HYDRENT____header_global_efff2064b4190fee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:438
export const MASKWALL14____header_global_5b75497fafe93bcf = ((((((988) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eb0c36db46aaeb395192d0f7() {
  return __cxx_static_address_eb0c36db46aaeb395192d0f7.reference || (__cxx_static_address_eb0c36db46aaeb395192d0f7.reference = {
    __cReference: true,
    get value() { return MASKWALL14____header_global_5b75497fafe93bcf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:439
export const TIRE____header_global_98d791887be94ece = ((((((990) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ba85b3b3063ece2e708b778c() {
  return __cxx_static_address_ba85b3b3063ece2e708b778c.reference || (__cxx_static_address_ba85b3b3063ece2e708b778c.reference = {
    __cReference: true,
    get value() { return TIRE____header_global_98d791887be94ece; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:440
export const PIPE5____header_global_58cdeedf9cd2369f = ((((((994) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_22fc718b36e635b3a697a7ce() {
  return __cxx_static_address_22fc718b36e635b3a697a7ce.reference || (__cxx_static_address_22fc718b36e635b3a697a7ce.reference = {
    __cReference: true,
    get value() { return PIPE5____header_global_58cdeedf9cd2369f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:441
export const PIPE6____header_global_fd3b42816d27d1ce = ((((((995) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_96ac590b93e28ddc28859554() {
  return __cxx_static_address_96ac590b93e28ddc28859554.reference || (__cxx_static_address_96ac590b93e28ddc28859554.reference = {
    __cReference: true,
    get value() { return PIPE6____header_global_fd3b42816d27d1ce; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:442
export const PIPE4____header_global_cfb4e8025f848fd5 = ((((((996) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e2ccac09791c30bcbbb810b4() {
  return __cxx_static_address_e2ccac09791c30bcbbb810b4.reference || (__cxx_static_address_e2ccac09791c30bcbbb810b4.reference = {
    __cReference: true,
    get value() { return PIPE4____header_global_cfb4e8025f848fd5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:443
export const PIPE4B____header_global_ed40a537835ffba9 = ((((((997) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_658ef7ffe11cad9bce705b58() {
  return __cxx_static_address_658ef7ffe11cad9bce705b58.reference || (__cxx_static_address_658ef7ffe11cad9bce705b58.reference = {
    __cReference: true,
    get value() { return PIPE4B____header_global_ed40a537835ffba9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:444
export const BROKEHYDROPLANT____header_global_e29960fc725d6287 = ((((((1003) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e92a5b753d55c110c4cd6ff2() {
  return __cxx_static_address_e92a5b753d55c110c4cd6ff2.reference || (__cxx_static_address_e92a5b753d55c110c4cd6ff2.reference = {
    __cReference: true,
    get value() { return BROKEHYDROPLANT____header_global_e29960fc725d6287; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:445
export const PIPE5B____header_global_f7868cc1ac17e683 = ((((((1005) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_210270e6216ad7dbf8217630() {
  return __cxx_static_address_210270e6216ad7dbf8217630.reference || (__cxx_static_address_210270e6216ad7dbf8217630.reference = {
    __cReference: true,
    get value() { return PIPE5B____header_global_f7868cc1ac17e683; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:446
export const NEON3____header_global_879a8913944f2448 = ((((((1007) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_83b1e7fa555da364363ad381() {
  return __cxx_static_address_83b1e7fa555da364363ad381.reference || (__cxx_static_address_83b1e7fa555da364363ad381.reference = {
    __cReference: true,
    get value() { return NEON3____header_global_879a8913944f2448; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:447
export const NEON4____header_global_cdae5b37e1d9b8b7 = ((((((1008) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3de9a1c32d00b422589b1e13() {
  return __cxx_static_address_3de9a1c32d00b422589b1e13.reference || (__cxx_static_address_3de9a1c32d00b422589b1e13.reference = {
    __cReference: true,
    get value() { return NEON4____header_global_cdae5b37e1d9b8b7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:448
export const NEON5____header_global_607437e3071835de = ((((((1009) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ec3cd895a597c0719550ad7a() {
  return __cxx_static_address_ec3cd895a597c0719550ad7a.reference || (__cxx_static_address_ec3cd895a597c0719550ad7a.reference = {
    __cReference: true,
    get value() { return NEON5____header_global_607437e3071835de; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:449
export const BOTTLE5____header_global_cd2b16d7dfc2ce4a = ((((((1012) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_08b1326ea93536c249426664() {
  return __cxx_static_address_08b1326ea93536c249426664.reference || (__cxx_static_address_08b1326ea93536c249426664.reference = {
    __cReference: true,
    get value() { return BOTTLE5____header_global_cd2b16d7dfc2ce4a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:450
export const BOTTLE6____header_global_111a88ab4d334851 = ((((((1013) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a330a2986213f7da953bb388() {
  return __cxx_static_address_a330a2986213f7da953bb388.reference || (__cxx_static_address_a330a2986213f7da953bb388.reference = {
    __cReference: true,
    get value() { return BOTTLE6____header_global_111a88ab4d334851; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:451
export const BOTTLE8____header_global_bfe660bdef85cfa2 = ((((((1014) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_05135800c3e804c29dba3c61() {
  return __cxx_static_address_05135800c3e804c29dba3c61.reference || (__cxx_static_address_05135800c3e804c29dba3c61.reference = {
    __cReference: true,
    get value() { return BOTTLE8____header_global_bfe660bdef85cfa2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:452
export const SPOTLITE____header_global_7877e30ecba0294d = ((((((1020) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7b9e978cef7a09c6704a1eff() {
  return __cxx_static_address_7b9e978cef7a09c6704a1eff.reference || (__cxx_static_address_7b9e978cef7a09c6704a1eff.reference = {
    __cReference: true,
    get value() { return SPOTLITE____header_global_7877e30ecba0294d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:453
export const MASKWALL15____header_global_8fcd259d730b4fb2 = ((((((1024) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e5e65c3f3110be6b72f0d1fe() {
  return __cxx_static_address_e5e65c3f3110be6b72f0d1fe.reference || (__cxx_static_address_e5e65c3f3110be6b72f0d1fe.reference = {
    __cReference: true,
    get value() { return MASKWALL15____header_global_8fcd259d730b4fb2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:454
export const BOTTLE7____header_global_cf63cba723782579 = ((((((1025) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eb9159d1559143389c4d87be() {
  return __cxx_static_address_eb9159d1559143389c4d87be.reference || (__cxx_static_address_eb9159d1559143389c4d87be.reference = {
    __cReference: true,
    get value() { return BOTTLE7____header_global_cf63cba723782579; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:455
export const HORSEONSIDE____header_global_8ebfde79b191c060 = ((((((1026) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e36aa4faad8c59a7fbd7bbc9() {
  return __cxx_static_address_e36aa4faad8c59a7fbd7bbc9.reference || (__cxx_static_address_e36aa4faad8c59a7fbd7bbc9.reference = {
    __cReference: true,
    get value() { return HORSEONSIDE____header_global_8ebfde79b191c060; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:456
export const GLASSPIECES____header_global_7208be022a27d2f9 = ((((((1031) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4c56a8858abe6de767dfb9c5() {
  return __cxx_static_address_4c56a8858abe6de767dfb9c5.reference || (__cxx_static_address_4c56a8858abe6de767dfb9c5.reference = {
    __cReference: true,
    get value() { return GLASSPIECES____header_global_7208be022a27d2f9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:457
export const NEON6____header_global_c4869320be051da2 = ((((((1046) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c19b9516b4cee1db4076e530() {
  return __cxx_static_address_c19b9516b4cee1db4076e530.reference || (__cxx_static_address_c19b9516b4cee1db4076e530.reference = {
    __cReference: true,
    get value() { return NEON6____header_global_c4869320be051da2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:458
export const MASKWALL6____header_global_2ec169d2b38421e2 = ((((((1059) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0fb1914618e31d4e9e555846() {
  return __cxx_static_address_0fb1914618e31d4e9e555846.reference || (__cxx_static_address_0fb1914618e31d4e9e555846.reference = {
    __cReference: true,
    get value() { return MASKWALL6____header_global_2ec169d2b38421e2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:459
export const RUBBERCAN____header_global_2631cbacbe8ad993 = ((((((1062) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8ea3fcd1e364f0d13b90066f() {
  return __cxx_static_address_8ea3fcd1e364f0d13b90066f.reference || (__cxx_static_address_8ea3fcd1e364f0d13b90066f.reference = {
    __cReference: true,
    get value() { return RUBBERCAN____header_global_2631cbacbe8ad993; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:460
export const PLUG____header_global_d347ac5dcca62940 = ((((((1069) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4198a04a8e8ae30e691da6b5() {
  return __cxx_static_address_4198a04a8e8ae30e691da6b5.reference || (__cxx_static_address_4198a04a8e8ae30e691da6b5.reference = {
    __cReference: true,
    get value() { return PLUG____header_global_d347ac5dcca62940; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:461
export const OOZFILTER____header_global_621f9f7d4f501edc = ((((((1079) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_32e68b502e21da62b322564f() {
  return __cxx_static_address_32e68b502e21da62b322564f.reference || (__cxx_static_address_32e68b502e21da62b322564f.reference = {
    __cReference: true,
    get value() { return OOZFILTER____header_global_621f9f7d4f501edc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:462
export const FLOORPLASMA____header_global_34c68e1d52963ab5 = ((((((1082) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cdacd4d61e8295514adfe5e8() {
  return __cxx_static_address_cdacd4d61e8295514adfe5e8.reference || (__cxx_static_address_cdacd4d61e8295514adfe5e8.reference = {
    __cReference: true,
    get value() { return FLOORPLASMA____header_global_34c68e1d52963ab5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:463
export const REACTOR____header_global_25f5aada226fde5c = ((((((1088) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_762c849b9517decfc5d27318() {
  return __cxx_static_address_762c849b9517decfc5d27318.reference || (__cxx_static_address_762c849b9517decfc5d27318.reference = {
    __cReference: true,
    get value() { return REACTOR____header_global_25f5aada226fde5c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:464
export const REACTORSPARK____header_global_6dd4f9db345c11ed = ((((((1092) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3dab94a8916f9393f2f94c22() {
  return __cxx_static_address_3dab94a8916f9393f2f94c22.reference || (__cxx_static_address_3dab94a8916f9393f2f94c22.reference = {
    __cReference: true,
    get value() { return REACTORSPARK____header_global_6dd4f9db345c11ed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:465
export const REACTORBURNT____header_global_65ff081350edaa2f = ((((((1096) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6c97dc5dfe09836b262b04cd() {
  return __cxx_static_address_6c97dc5dfe09836b262b04cd.reference || (__cxx_static_address_6c97dc5dfe09836b262b04cd.reference = {
    __cReference: true,
    get value() { return REACTORBURNT____header_global_65ff081350edaa2f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:466
export const DOORTILE15____header_global_416b0f8ebe714ff5 = ((((((1102) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dbfc89bafcebea15e7d65c2a() {
  return __cxx_static_address_dbfc89bafcebea15e7d65c2a.reference || (__cxx_static_address_dbfc89bafcebea15e7d65c2a.reference = {
    __cReference: true,
    get value() { return DOORTILE15____header_global_416b0f8ebe714ff5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:467
export const HANDSWITCH____header_global_bc266a8d9542b599 = ((((((1111) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_da702198e7c851bd488d485e() {
  return __cxx_static_address_da702198e7c851bd488d485e.reference || (__cxx_static_address_da702198e7c851bd488d485e.reference = {
    __cReference: true,
    get value() { return HANDSWITCH____header_global_bc266a8d9542b599; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:468
export const CIRCLEPANNEL____header_global_fd3d2c8ed3303742 = ((((((1113) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2a07d3d03d21709e98bbd69d() {
  return __cxx_static_address_2a07d3d03d21709e98bbd69d.reference || (__cxx_static_address_2a07d3d03d21709e98bbd69d.reference = {
    __cReference: true,
    get value() { return CIRCLEPANNEL____header_global_fd3d2c8ed3303742; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:469
export const CIRCLEPANNELBROKE____header_global_937e2bbca2b43955 = ((((((1114) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1b61327c82afea71336abd3d() {
  return __cxx_static_address_1b61327c82afea71336abd3d.reference || (__cxx_static_address_1b61327c82afea71336abd3d.reference = {
    __cReference: true,
    get value() { return CIRCLEPANNELBROKE____header_global_937e2bbca2b43955; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:470
export const PULLSWITCH____header_global_4bbd60b40495dff7 = ((((((1122) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_741648d0973bbba2803c96cd() {
  return __cxx_static_address_741648d0973bbba2803c96cd.reference || (__cxx_static_address_741648d0973bbba2803c96cd.reference = {
    __cReference: true,
    get value() { return PULLSWITCH____header_global_4bbd60b40495dff7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:471
export const MASKWALL8____header_global_8efc21bd873e86af = ((((((1124) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_32ff863dbf236fc8e7df61b3() {
  return __cxx_static_address_32ff863dbf236fc8e7df61b3.reference || (__cxx_static_address_32ff863dbf236fc8e7df61b3.reference = {
    __cReference: true,
    get value() { return MASKWALL8____header_global_8efc21bd873e86af; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:472
export const BIGHOLE____header_global_6516c9e9a22643ec = ((((((1141) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b8b30ea1e1e3bbc41ba81255() {
  return __cxx_static_address_b8b30ea1e1e3bbc41ba81255.reference || (__cxx_static_address_b8b30ea1e1e3bbc41ba81255.reference = {
    __cReference: true,
    get value() { return BIGHOLE____header_global_6516c9e9a22643ec; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:473
export const ALIENSWITCH____header_global_67a93f9b7bcffcdd = ((((((1142) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e4c20606bd94f4767370b92e() {
  return __cxx_static_address_e4c20606bd94f4767370b92e.reference || (__cxx_static_address_e4c20606bd94f4767370b92e.reference = {
    __cReference: true,
    get value() { return ALIENSWITCH____header_global_67a93f9b7bcffcdd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:474
export const DOORTILE21____header_global_7131abfe6e9e2e85 = ((((((1144) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8ad509c5027d0dd36ac659aa() {
  return __cxx_static_address_8ad509c5027d0dd36ac659aa.reference || (__cxx_static_address_8ad509c5027d0dd36ac659aa.reference = {
    __cReference: true,
    get value() { return DOORTILE21____header_global_7131abfe6e9e2e85; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:475
export const HANDPRINTSWITCH____header_global_4f6f21f794b7aee9 = ((((((1155) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7a411f4a02711840ef903486() {
  return __cxx_static_address_7a411f4a02711840ef903486.reference || (__cxx_static_address_7a411f4a02711840ef903486.reference = {
    __cReference: true,
    get value() { return HANDPRINTSWITCH____header_global_4f6f21f794b7aee9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:476
export const BOTTLE10____header_global_64d6310be0c63df4 = ((((((1157) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_248c7a3ce0ed66e04fc3489f() {
  return __cxx_static_address_248c7a3ce0ed66e04fc3489f.reference || (__cxx_static_address_248c7a3ce0ed66e04fc3489f.reference = {
    __cReference: true,
    get value() { return BOTTLE10____header_global_64d6310be0c63df4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:477
export const BOTTLE11____header_global_b86ac2369bc7a997 = ((((((1158) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e77d30e650b3e05d336cce2b() {
  return __cxx_static_address_e77d30e650b3e05d336cce2b.reference || (__cxx_static_address_e77d30e650b3e05d336cce2b.reference = {
    __cReference: true,
    get value() { return BOTTLE11____header_global_b86ac2369bc7a997; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:478
export const BOTTLE12____header_global_db70f97593073526 = ((((((1159) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_190356c2d2734acf3f5de9c3() {
  return __cxx_static_address_190356c2d2734acf3f5de9c3.reference || (__cxx_static_address_190356c2d2734acf3f5de9c3.reference = {
    __cReference: true,
    get value() { return BOTTLE12____header_global_db70f97593073526; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:479
export const BOTTLE13____header_global_03cf2934dd80bd44 = ((((((1160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2e25c73dcf8f41ec46aa0f2b() {
  return __cxx_static_address_2e25c73dcf8f41ec46aa0f2b.reference || (__cxx_static_address_2e25c73dcf8f41ec46aa0f2b.reference = {
    __cReference: true,
    get value() { return BOTTLE13____header_global_03cf2934dd80bd44; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:480
export const BOTTLE14____header_global_a415233f4b88adad = ((((((1161) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e720202852f2e2bcf399a7ae() {
  return __cxx_static_address_e720202852f2e2bcf399a7ae.reference || (__cxx_static_address_e720202852f2e2bcf399a7ae.reference = {
    __cReference: true,
    get value() { return BOTTLE14____header_global_a415233f4b88adad; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:481
export const BOTTLE15____header_global_4852733130e6c61f = ((((((1162) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3fbb008870d61673ee9659f8() {
  return __cxx_static_address_3fbb008870d61673ee9659f8.reference || (__cxx_static_address_3fbb008870d61673ee9659f8.reference = {
    __cReference: true,
    get value() { return BOTTLE15____header_global_4852733130e6c61f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:482
export const BOTTLE16____header_global_b7a171001437a0d5 = ((((((1163) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_32234e70467fe4eec4a1aa29() {
  return __cxx_static_address_32234e70467fe4eec4a1aa29.reference || (__cxx_static_address_32234e70467fe4eec4a1aa29.reference = {
    __cReference: true,
    get value() { return BOTTLE16____header_global_b7a171001437a0d5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:483
export const BOTTLE17____header_global_98345858e25c35b5 = ((((((1164) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_18d0ecf1359ebf36ad4d2a43() {
  return __cxx_static_address_18d0ecf1359ebf36ad4d2a43.reference || (__cxx_static_address_18d0ecf1359ebf36ad4d2a43.reference = {
    __cReference: true,
    get value() { return BOTTLE17____header_global_98345858e25c35b5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:484
export const BOTTLE18____header_global_8efa54f5172a6d8c = ((((((1165) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e1651dedcdb05c535bc71be1() {
  return __cxx_static_address_e1651dedcdb05c535bc71be1.reference || (__cxx_static_address_e1651dedcdb05c535bc71be1.reference = {
    __cReference: true,
    get value() { return BOTTLE18____header_global_8efa54f5172a6d8c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:485
export const BOTTLE19____header_global_1be6b816ed6764fb = ((((((1166) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_11e0eca9b9c74bbbec18ce4b() {
  return __cxx_static_address_11e0eca9b9c74bbbec18ce4b.reference || (__cxx_static_address_11e0eca9b9c74bbbec18ce4b.reference = {
    __cReference: true,
    get value() { return BOTTLE19____header_global_1be6b816ed6764fb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:486
export const DOORTILE17____header_global_d40a3af3c9da957c = ((((((1169) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_27819c7e8447eae591c00062() {
  return __cxx_static_address_27819c7e8447eae591c00062.reference || (__cxx_static_address_27819c7e8447eae591c00062.reference = {
    __cReference: true,
    get value() { return DOORTILE17____header_global_d40a3af3c9da957c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:487
export const MASKWALL7____header_global_dab057e77551fd6c = ((((((1174) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b14617e89bac81221a687957() {
  return __cxx_static_address_b14617e89bac81221a687957.reference || (__cxx_static_address_b14617e89bac81221a687957.reference = {
    __cReference: true,
    get value() { return MASKWALL7____header_global_dab057e77551fd6c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:488
export const DOORTILE11____header_global_b1216b1e1e25937e = ((((((1178) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b1e6477621e585b427e12889() {
  return __cxx_static_address_b1e6477621e585b427e12889.reference || (__cxx_static_address_b1e6477621e585b427e12889.reference = {
    __cReference: true,
    get value() { return DOORTILE11____header_global_b1216b1e1e25937e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:489
export const DOORTILE12____header_global_cd57904d61d9d4fd = ((((((1179) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_56dad188b3ac5610c8cb145a() {
  return __cxx_static_address_56dad188b3ac5610c8cb145a.reference || (__cxx_static_address_56dad188b3ac5610c8cb145a.reference = {
    __cReference: true,
    get value() { return DOORTILE12____header_global_cd57904d61d9d4fd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:490
export const VENDMACHINE____header_global_b57e8e56dd73a42e = ((((((1212) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c8be812f98257ebd51edf57e() {
  return __cxx_static_address_c8be812f98257ebd51edf57e.reference || (__cxx_static_address_c8be812f98257ebd51edf57e.reference = {
    __cReference: true,
    get value() { return VENDMACHINE____header_global_b57e8e56dd73a42e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:491
export const COLAMACHINE____header_global_53dfef6b5b6e2dfb = ((((((1215) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1f05acfbf7ec3bd70ce4256a() {
  return __cxx_static_address_1f05acfbf7ec3bd70ce4256a.reference || (__cxx_static_address_1f05acfbf7ec3bd70ce4256a.reference = {
    __cReference: true,
    get value() { return COLAMACHINE____header_global_53dfef6b5b6e2dfb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:492
export const CRANEPOLE____header_global_8d7ebee5996a1e0f = ((((((1221) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c51ebdef5af55d559d959659() {
  return __cxx_static_address_c51ebdef5af55d559d959659.reference || (__cxx_static_address_c51ebdef5af55d559d959659.reference = {
    __cReference: true,
    get value() { return CRANEPOLE____header_global_8d7ebee5996a1e0f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:493
export const CRANE____header_global_f28e456bdee9b7e5 = ((((((1222) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7779f2fab9f6a3d9b22a4482() {
  return __cxx_static_address_7779f2fab9f6a3d9b22a4482.reference || (__cxx_static_address_7779f2fab9f6a3d9b22a4482.reference = {
    __cReference: true,
    get value() { return CRANE____header_global_f28e456bdee9b7e5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:494
export const BARBROKE____header_global_8980e067e3decfb1 = ((((((1225) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a9f540ba7cf3d8120f802fbb() {
  return __cxx_static_address_a9f540ba7cf3d8120f802fbb.reference || (__cxx_static_address_a9f540ba7cf3d8120f802fbb.reference = {
    __cReference: true,
    get value() { return BARBROKE____header_global_8980e067e3decfb1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:495
export const BLOODPOOL____header_global_a22077850a07f772 = ((((((1226) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5ffd355c8d012c91226deed9() {
  return __cxx_static_address_5ffd355c8d012c91226deed9.reference || (__cxx_static_address_5ffd355c8d012c91226deed9.reference = {
    __cReference: true,
    get value() { return BLOODPOOL____header_global_a22077850a07f772; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:496
export const NUKEBARREL____header_global_8bc1375b01e5e4e5 = ((((((1227) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_adacb87d3ab47d0ad3964a31() {
  return __cxx_static_address_adacb87d3ab47d0ad3964a31.reference || (__cxx_static_address_adacb87d3ab47d0ad3964a31.reference = {
    __cReference: true,
    get value() { return NUKEBARREL____header_global_8bc1375b01e5e4e5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:497
export const NUKEBARRELDENTED____header_global_ee68f0f2b3375bc2 = ((((((1228) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_deefa17e532638cb54e1c410() {
  return __cxx_static_address_deefa17e532638cb54e1c410.reference || (__cxx_static_address_deefa17e532638cb54e1c410.reference = {
    __cReference: true,
    get value() { return NUKEBARRELDENTED____header_global_ee68f0f2b3375bc2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:498
export const NUKEBARRELLEAKED____header_global_70b00f880a8ef391 = ((((((1229) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_74a2a080e4187510fa3e2e50() {
  return __cxx_static_address_74a2a080e4187510fa3e2e50.reference || (__cxx_static_address_74a2a080e4187510fa3e2e50.reference = {
    __cReference: true,
    get value() { return NUKEBARRELLEAKED____header_global_70b00f880a8ef391; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:499
export const CANWITHSOMETHING____header_global_c6a1ca1c8f086c22 = ((((((1232) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_736814bb534d82174e6378fd() {
  return __cxx_static_address_736814bb534d82174e6378fd.reference || (__cxx_static_address_736814bb534d82174e6378fd.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING____header_global_c6a1ca1c8f086c22; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:500
export const MONEY____header_global_ac4b7f073bbd8893 = ((((((1233) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6af74f26bd782bb3f612222f() {
  return __cxx_static_address_6af74f26bd782bb3f612222f.reference || (__cxx_static_address_6af74f26bd782bb3f612222f.reference = {
    __cReference: true,
    get value() { return MONEY____header_global_ac4b7f073bbd8893; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:501
export const BANNER____header_global_8c15045f8c56df29 = ((((((1236) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ca3770c311aa0849357a3133() {
  return __cxx_static_address_ca3770c311aa0849357a3133.reference || (__cxx_static_address_ca3770c311aa0849357a3133.reference = {
    __cReference: true,
    get value() { return BANNER____header_global_8c15045f8c56df29; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:502
export const EXPLODINGBARREL____header_global_a1c4e5ef005641f6 = ((((((1238) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9e140cbe1a0b524a437df359() {
  return __cxx_static_address_9e140cbe1a0b524a437df359.reference || (__cxx_static_address_9e140cbe1a0b524a437df359.reference = {
    __cReference: true,
    get value() { return EXPLODINGBARREL____header_global_a1c4e5ef005641f6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:503
export const EXPLODINGBARREL2____header_global_475ec58b80c48790 = ((((((1239) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f6ec048a1e3f72eb3fc6058d() {
  return __cxx_static_address_f6ec048a1e3f72eb3fc6058d.reference || (__cxx_static_address_f6ec048a1e3f72eb3fc6058d.reference = {
    __cReference: true,
    get value() { return EXPLODINGBARREL2____header_global_475ec58b80c48790; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:504
export const FIREBARREL____header_global_9886f852b96c568e = ((((((1240) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bea2f1e195123636dbf19521() {
  return __cxx_static_address_bea2f1e195123636dbf19521.reference || (__cxx_static_address_bea2f1e195123636dbf19521.reference = {
    __cReference: true,
    get value() { return FIREBARREL____header_global_9886f852b96c568e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:505
export const SEENINE____header_global_378f54981e2e989c = ((((((1247) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3e59dfbcd9349b46f8dff4b2() {
  return __cxx_static_address_3e59dfbcd9349b46f8dff4b2.reference || (__cxx_static_address_3e59dfbcd9349b46f8dff4b2.reference = {
    __cReference: true,
    get value() { return SEENINE____header_global_378f54981e2e989c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:506
export const SEENINEDEAD____header_global_fc81af2c001041c4 = ((((((1248) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8e3d8308e28725b1750c75d3() {
  return __cxx_static_address_8e3d8308e28725b1750c75d3.reference || (__cxx_static_address_8e3d8308e28725b1750c75d3.reference = {
    __cReference: true,
    get value() { return SEENINEDEAD____header_global_fc81af2c001041c4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:507
export const STEAM____header_global_7084bd77334f0293 = ((((((1250) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_76702b051c82ab6a2bec5bd5() {
  return __cxx_static_address_76702b051c82ab6a2bec5bd5.reference || (__cxx_static_address_76702b051c82ab6a2bec5bd5.reference = {
    __cReference: true,
    get value() { return STEAM____header_global_7084bd77334f0293; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:508
export const CEILINGSTEAM____header_global_1cd83bd0a8bb5cd5 = ((((((1255) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a77299ace70648313096491c() {
  return __cxx_static_address_a77299ace70648313096491c.reference || (__cxx_static_address_a77299ace70648313096491c.reference = {
    __cReference: true,
    get value() { return CEILINGSTEAM____header_global_1cd83bd0a8bb5cd5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:509
export const PIPE6B____header_global_8fbe7e6b631e54e3 = ((((((1260) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_698eb8788f1eee0a1a18e00a() {
  return __cxx_static_address_698eb8788f1eee0a1a18e00a.reference || (__cxx_static_address_698eb8788f1eee0a1a18e00a.reference = {
    __cReference: true,
    get value() { return PIPE6B____header_global_8fbe7e6b631e54e3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:510
export const TRANSPORTERBEAM____header_global_952075f9dd355b14 = ((((((1261) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e2826b28f32c21158cec4181() {
  return __cxx_static_address_e2826b28f32c21158cec4181.reference || (__cxx_static_address_e2826b28f32c21158cec4181.reference = {
    __cReference: true,
    get value() { return TRANSPORTERBEAM____header_global_952075f9dd355b14; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:511
export const RAT____header_global_74ebe0f8fbda856e = ((((((1267) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ccbe6e91365937fbe17c3d4d() {
  return __cxx_static_address_ccbe6e91365937fbe17c3d4d.reference || (__cxx_static_address_ccbe6e91365937fbe17c3d4d.reference = {
    __cReference: true,
    get value() { return RAT____header_global_74ebe0f8fbda856e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:512
export const TRASH____header_global_aa2cf7879fb60633 = ((((((1272) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a9d5ce506c0005862bb01cd8() {
  return __cxx_static_address_a9d5ce506c0005862bb01cd8.reference || (__cxx_static_address_a9d5ce506c0005862bb01cd8.reference = {
    __cReference: true,
    get value() { return TRASH____header_global_aa2cf7879fb60633; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:513
export const FEMPIC1____header_global_6a79173c3f98ae31 = ((((((1280) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_abff7c1f7009427013a22f04() {
  return __cxx_static_address_abff7c1f7009427013a22f04.reference || (__cxx_static_address_abff7c1f7009427013a22f04.reference = {
    __cReference: true,
    get value() { return FEMPIC1____header_global_6a79173c3f98ae31; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:514
export const FEMPIC2____header_global_ea66699ecb716a99 = ((((((1289) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6eaae2fde9df877425879ce6() {
  return __cxx_static_address_6eaae2fde9df877425879ce6.reference || (__cxx_static_address_6eaae2fde9df877425879ce6.reference = {
    __cReference: true,
    get value() { return FEMPIC2____header_global_ea66699ecb716a99; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:515
export const BLANKSCREEN____header_global_cd33237daa6f2fc1 = ((((((1293) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5a0e76c61aa03887119fd355() {
  return __cxx_static_address_5a0e76c61aa03887119fd355.reference || (__cxx_static_address_5a0e76c61aa03887119fd355.reference = {
    __cReference: true,
    get value() { return BLANKSCREEN____header_global_cd33237daa6f2fc1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:516
export const PODFEM1____header_global_c98432b3c846c675 = ((((((1294) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b4e41f29bf30e83e3219987e() {
  return __cxx_static_address_b4e41f29bf30e83e3219987e.reference || (__cxx_static_address_b4e41f29bf30e83e3219987e.reference = {
    __cReference: true,
    get value() { return PODFEM1____header_global_c98432b3c846c675; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:517
export const FEMPIC3____header_global_c31e39e6d20792fe = ((((((1298) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7ce1128b973d62ebe909c203() {
  return __cxx_static_address_7ce1128b973d62ebe909c203.reference || (__cxx_static_address_7ce1128b973d62ebe909c203.reference = {
    __cReference: true,
    get value() { return FEMPIC3____header_global_c31e39e6d20792fe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:518
export const FEMPIC4____header_global_f9b739167d100df7 = ((((((1306) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3fc76876edfbd729266aeaf9() {
  return __cxx_static_address_3fc76876edfbd729266aeaf9.reference || (__cxx_static_address_3fc76876edfbd729266aeaf9.reference = {
    __cReference: true,
    get value() { return FEMPIC4____header_global_f9b739167d100df7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:519
export const FEM1____header_global_461de1ea2d25da57 = ((((((1312) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c46c1773da81389e8818b2a3() {
  return __cxx_static_address_c46c1773da81389e8818b2a3.reference || (__cxx_static_address_c46c1773da81389e8818b2a3.reference = {
    __cReference: true,
    get value() { return FEM1____header_global_461de1ea2d25da57; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:520
export const FEM2____header_global_8ae2273ab6248088 = ((((((1317) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_38f94347ddcc555723de563a() {
  return __cxx_static_address_38f94347ddcc555723de563a.reference || (__cxx_static_address_38f94347ddcc555723de563a.reference = {
    __cReference: true,
    get value() { return FEM2____header_global_8ae2273ab6248088; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:521
export const FEM3____header_global_c70cb92a144189ad = ((((((1321) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5c4ce4f2ff3d74a10b1ff4e2() {
  return __cxx_static_address_5c4ce4f2ff3d74a10b1ff4e2.reference || (__cxx_static_address_5c4ce4f2ff3d74a10b1ff4e2.reference = {
    __cReference: true,
    get value() { return FEM3____header_global_c70cb92a144189ad; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:522
export const FEM5____header_global_01073a4f0910ce33 = ((((((1323) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7e7a7b48ba41acf95a88b341() {
  return __cxx_static_address_7e7a7b48ba41acf95a88b341.reference || (__cxx_static_address_7e7a7b48ba41acf95a88b341.reference = {
    __cReference: true,
    get value() { return FEM5____header_global_01073a4f0910ce33; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:523
export const BLOODYPOLE____header_global_92a4e4d3539d3a4e = ((((((1324) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_67e1daad0e9b1151fab1f21d() {
  return __cxx_static_address_67e1daad0e9b1151fab1f21d.reference || (__cxx_static_address_67e1daad0e9b1151fab1f21d.reference = {
    __cReference: true,
    get value() { return BLOODYPOLE____header_global_92a4e4d3539d3a4e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:524
export const FEM4____header_global_660a762ace1e7e97 = ((((((1325) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_95536741704e5490cc2f9a2a() {
  return __cxx_static_address_95536741704e5490cc2f9a2a.reference || (__cxx_static_address_95536741704e5490cc2f9a2a.reference = {
    __cReference: true,
    get value() { return FEM4____header_global_660a762ace1e7e97; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:525
export const FEM6____header_global_a25eba25b1a98429 = ((((((1334) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f184ce18a2f490ec909e2ccb() {
  return __cxx_static_address_f184ce18a2f490ec909e2ccb.reference || (__cxx_static_address_f184ce18a2f490ec909e2ccb.reference = {
    __cReference: true,
    get value() { return FEM6____header_global_a25eba25b1a98429; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:526
export const FEM6PAD____header_global_e9650232ae152fbd = ((((((1335) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cc7591b425c721d0973ca8b1() {
  return __cxx_static_address_cc7591b425c721d0973ca8b1.reference || (__cxx_static_address_cc7591b425c721d0973ca8b1.reference = {
    __cReference: true,
    get value() { return FEM6PAD____header_global_e9650232ae152fbd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:527
export const FEM8____header_global_5fd1d0d0a77abadf = ((((((1336) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_52147764f863afa278186c5a() {
  return __cxx_static_address_52147764f863afa278186c5a.reference || (__cxx_static_address_52147764f863afa278186c5a.reference = {
    __cReference: true,
    get value() { return FEM8____header_global_5fd1d0d0a77abadf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:528
export const HELECOPT____header_global_51ee80fe10c54d6a = ((((((1346) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_07c4ce87bca4ae8ec3957e7f() {
  return __cxx_static_address_07c4ce87bca4ae8ec3957e7f.reference || (__cxx_static_address_07c4ce87bca4ae8ec3957e7f.reference = {
    __cReference: true,
    get value() { return HELECOPT____header_global_51ee80fe10c54d6a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:529
export const FETUSJIB____header_global_543f557428bf3d2b = ((((((1347) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cfbaea1f9be1e242e44ce9c7() {
  return __cxx_static_address_cfbaea1f9be1e242e44ce9c7.reference || (__cxx_static_address_cfbaea1f9be1e242e44ce9c7.reference = {
    __cReference: true,
    get value() { return FETUSJIB____header_global_543f557428bf3d2b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:530
export const HOLODUKE____header_global_b6c949dd1d99f5a2 = ((((((1348) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b755dfccd45f02b56b4c0b20() {
  return __cxx_static_address_b755dfccd45f02b56b4c0b20.reference || (__cxx_static_address_b755dfccd45f02b56b4c0b20.reference = {
    __cReference: true,
    get value() { return HOLODUKE____header_global_b6c949dd1d99f5a2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:531
export const SPACEMARINE____header_global_9f3314adb8824ef4 = ((((((1353) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f86f25001de404795212c8fc() {
  return __cxx_static_address_f86f25001de404795212c8fc.reference || (__cxx_static_address_f86f25001de404795212c8fc.reference = {
    __cReference: true,
    get value() { return SPACEMARINE____header_global_9f3314adb8824ef4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:532
export const INDY____header_global_98acfd7d711f860b = ((((((1355) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_61fa7f0d7a736bdf2f50c968() {
  return __cxx_static_address_61fa7f0d7a736bdf2f50c968.reference || (__cxx_static_address_61fa7f0d7a736bdf2f50c968.reference = {
    __cReference: true,
    get value() { return INDY____header_global_98acfd7d711f860b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:533
export const FETUS____header_global_3eec6d2e027432b1 = ((((((1358) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c213e7defd2460e319989c9e() {
  return __cxx_static_address_c213e7defd2460e319989c9e.reference || (__cxx_static_address_c213e7defd2460e319989c9e.reference = {
    __cReference: true,
    get value() { return FETUS____header_global_3eec6d2e027432b1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:534
export const FETUSBROKE____header_global_ceebe6b81d15bd61 = ((((((1359) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_90b81ad24d8a33933564562e() {
  return __cxx_static_address_90b81ad24d8a33933564562e.reference || (__cxx_static_address_90b81ad24d8a33933564562e.reference = {
    __cReference: true,
    get value() { return FETUSBROKE____header_global_ceebe6b81d15bd61; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:535
export const MONK____header_global_0c0ff56bbeb49c5b = ((((((1352) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f9227bf0a947568802cddd79() {
  return __cxx_static_address_f9227bf0a947568802cddd79.reference || (__cxx_static_address_f9227bf0a947568802cddd79.reference = {
    __cReference: true,
    get value() { return MONK____header_global_0c0ff56bbeb49c5b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:536
export const LUKE____header_global_4de29a32485f0209 = ((((((1354) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8edd9689af07677fc112b0f5() {
  return __cxx_static_address_8edd9689af07677fc112b0f5.reference || (__cxx_static_address_8edd9689af07677fc112b0f5.reference = {
    __cReference: true,
    get value() { return LUKE____header_global_4de29a32485f0209; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:537
export const COOLEXPLOSION1____header_global_6588f65ab78eb0ad = ((((((1360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6c294c9e39bd6eea6a57e9f6() {
  return __cxx_static_address_6c294c9e39bd6eea6a57e9f6.reference || (__cxx_static_address_6c294c9e39bd6eea6a57e9f6.reference = {
    __cReference: true,
    get value() { return COOLEXPLOSION1____header_global_6588f65ab78eb0ad; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:538
export const WATERSPLASH2____header_global_6bc62f8b10471980 = ((((((1380) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_83c2d5cef9bfeb4b5bcf073c() {
  return __cxx_static_address_83c2d5cef9bfeb4b5bcf073c.reference || (__cxx_static_address_83c2d5cef9bfeb4b5bcf073c.reference = {
    __cReference: true,
    get value() { return WATERSPLASH2____header_global_6bc62f8b10471980; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:539
export const FIREVASE____header_global_2b95a584d20c4fc3 = ((((((1390) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_32941425dd6df10f0beab069() {
  return __cxx_static_address_32941425dd6df10f0beab069.reference || (__cxx_static_address_32941425dd6df10f0beab069.reference = {
    __cReference: true,
    get value() { return FIREVASE____header_global_2b95a584d20c4fc3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:540
export const FEM7____header_global_b996db4aed3a31c8 = ((((((1395) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b3a4504fb45f0abdc9c099e8() {
  return __cxx_static_address_b3a4504fb45f0abdc9c099e8.reference || (__cxx_static_address_b3a4504fb45f0abdc9c099e8.reference = {
    __cReference: true,
    get value() { return FEM7____header_global_b996db4aed3a31c8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:541
export const APLAYERTOP____header_global_52d0049374a21142 = ((((((1400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e6e93bdf7c51dc0081949b1b() {
  return __cxx_static_address_e6e93bdf7c51dc0081949b1b.reference || (__cxx_static_address_e6e93bdf7c51dc0081949b1b.reference = {
    __cReference: true,
    get value() { return APLAYERTOP____header_global_52d0049374a21142; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:542
export const APLAYER____header_global_be13927b42a0a366 = ((((((1405) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bd7b089b340dec00e66a2b1c() {
  return __cxx_static_address_bd7b089b340dec00e66a2b1c.reference || (__cxx_static_address_bd7b089b340dec00e66a2b1c.reference = {
    __cReference: true,
    get value() { return APLAYER____header_global_be13927b42a0a366; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:543
export const PLAYERONWATER____header_global_7c39f2a9100e719a = ((((((1420) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_26f6667975c03bea38ca7b64() {
  return __cxx_static_address_26f6667975c03bea38ca7b64.reference || (__cxx_static_address_26f6667975c03bea38ca7b64.reference = {
    __cReference: true,
    get value() { return PLAYERONWATER____header_global_7c39f2a9100e719a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:544
export const DUKELYINGDEAD____header_global_4c91d9a650e79240 = ((((((1518) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_37e3ddbb3a808f8842b1ca5e() {
  return __cxx_static_address_37e3ddbb3a808f8842b1ca5e.reference || (__cxx_static_address_37e3ddbb3a808f8842b1ca5e.reference = {
    __cReference: true,
    get value() { return DUKELYINGDEAD____header_global_4c91d9a650e79240; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:545
export const DUKETORSO____header_global_aac093e7ab6f8714 = ((((((1520) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_18785c71a90ed87d0deb4e6d() {
  return __cxx_static_address_18785c71a90ed87d0deb4e6d.reference || (__cxx_static_address_18785c71a90ed87d0deb4e6d.reference = {
    __cReference: true,
    get value() { return DUKETORSO____header_global_aac093e7ab6f8714; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:546
export const DUKEGUN____header_global_4e679da8da925fe2 = ((((((1528) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6efc9bbe5726c883aa4e31af() {
  return __cxx_static_address_6efc9bbe5726c883aa4e31af.reference || (__cxx_static_address_6efc9bbe5726c883aa4e31af.reference = {
    __cReference: true,
    get value() { return DUKEGUN____header_global_4e679da8da925fe2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:547
export const DUKELEG____header_global_6b908daac206eb6b = ((((((1536) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7480628343960fbd03f44c4d() {
  return __cxx_static_address_7480628343960fbd03f44c4d.reference || (__cxx_static_address_7480628343960fbd03f44c4d.reference = {
    __cReference: true,
    get value() { return DUKELEG____header_global_6b908daac206eb6b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:548
export const SHARK____header_global_d66e04ca21e51faf = ((((((1550) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_58b3a67d32498774d8ed3235() {
  return __cxx_static_address_58b3a67d32498774d8ed3235.reference || (__cxx_static_address_58b3a67d32498774d8ed3235.reference = {
    __cReference: true,
    get value() { return SHARK____header_global_d66e04ca21e51faf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:549
export const BLOOD____header_global_edbbe16466aaa394 = ((((((1620) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_66bc70f54377ae1e09e1d337() {
  return __cxx_static_address_66bc70f54377ae1e09e1d337.reference || (__cxx_static_address_66bc70f54377ae1e09e1d337.reference = {
    __cReference: true,
    get value() { return BLOOD____header_global_edbbe16466aaa394; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:550
export const FIRELASER____header_global_d88fed164a43c9e7 = ((((((1625) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1775da6db0e0d1e3555da61a() {
  return __cxx_static_address_1775da6db0e0d1e3555da61a.reference || (__cxx_static_address_1775da6db0e0d1e3555da61a.reference = {
    __cReference: true,
    get value() { return FIRELASER____header_global_d88fed164a43c9e7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:551
export const TRANSPORTERSTAR____header_global_b95adc5492b32ca1 = ((((((1630) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e60bff2975efa2053a4c5686() {
  return __cxx_static_address_e60bff2975efa2053a4c5686.reference || (__cxx_static_address_e60bff2975efa2053a4c5686.reference = {
    __cReference: true,
    get value() { return TRANSPORTERSTAR____header_global_b95adc5492b32ca1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:552
export const SPIT____header_global_c099a88f231788f2 = ((((((1636) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f7baef8979744d918c1f5a16() {
  return __cxx_static_address_f7baef8979744d918c1f5a16.reference || (__cxx_static_address_f7baef8979744d918c1f5a16.reference = {
    __cReference: true,
    get value() { return SPIT____header_global_c099a88f231788f2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:553
export const LOOGIE____header_global_de0e9b6904a8e5dd = ((((((1637) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2653320fd8fd727b1274edee() {
  return __cxx_static_address_2653320fd8fd727b1274edee.reference || (__cxx_static_address_2653320fd8fd727b1274edee.reference = {
    __cReference: true,
    get value() { return LOOGIE____header_global_de0e9b6904a8e5dd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:554
export const FIST____header_global_ffac42cc66456f61 = ((((((1640) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_32e5502e3dfe94785548c973() {
  return __cxx_static_address_32e5502e3dfe94785548c973.reference || (__cxx_static_address_32e5502e3dfe94785548c973.reference = {
    __cReference: true,
    get value() { return FIST____header_global_ffac42cc66456f61; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:555
export const FREEZEBLAST____header_global_0868b39e115d8007 = ((((((1641) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6883b10c867e0b8c7a4074e4() {
  return __cxx_static_address_6883b10c867e0b8c7a4074e4.reference || (__cxx_static_address_6883b10c867e0b8c7a4074e4.reference = {
    __cReference: true,
    get value() { return FREEZEBLAST____header_global_0868b39e115d8007; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:556
export const SHRINKSPARK____header_global_48cf2f68efe30e89 = ((((((1646) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c09e03ca75385260df774659() {
  return __cxx_static_address_c09e03ca75385260df774659.reference || (__cxx_static_address_c09e03ca75385260df774659.reference = {
    __cReference: true,
    get value() { return SHRINKSPARK____header_global_48cf2f68efe30e89; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:557
export const TONGUE____header_global_6e8885a9b1b8db6a = ((((((1647) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f0e4addc8cfb16815ffd20cd() {
  return __cxx_static_address_f0e4addc8cfb16815ffd20cd.reference || (__cxx_static_address_f0e4addc8cfb16815ffd20cd.reference = {
    __cReference: true,
    get value() { return TONGUE____header_global_6e8885a9b1b8db6a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:558
export const MORTER____header_global_bd958d3df36091a7 = ((((((1650) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_96687f9dbec0a586e7f41136() {
  return __cxx_static_address_96687f9dbec0a586e7f41136.reference || (__cxx_static_address_96687f9dbec0a586e7f41136.reference = {
    __cReference: true,
    get value() { return MORTER____header_global_bd958d3df36091a7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:559
export const SHRINKEREXPLOSION____header_global_0247ba3361f0b21b = ((((((1656) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_95c21f2b9985f17cf01efc95() {
  return __cxx_static_address_95c21f2b9985f17cf01efc95.reference || (__cxx_static_address_95c21f2b9985f17cf01efc95.reference = {
    __cReference: true,
    get value() { return SHRINKEREXPLOSION____header_global_0247ba3361f0b21b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:560
export const RADIUSEXPLOSION____header_global_f82e325c74ea69fd = ((((((1670) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_138c4161787a00b7bd42539a() {
  return __cxx_static_address_138c4161787a00b7bd42539a.reference || (__cxx_static_address_138c4161787a00b7bd42539a.reference = {
    __cReference: true,
    get value() { return RADIUSEXPLOSION____header_global_f82e325c74ea69fd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:561
export const FORCERIPPLE____header_global_88691c361c52f90d = ((((((1671) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b386fa9b2a063bf762987f99() {
  return __cxx_static_address_b386fa9b2a063bf762987f99.reference || (__cxx_static_address_b386fa9b2a063bf762987f99.reference = {
    __cReference: true,
    get value() { return FORCERIPPLE____header_global_88691c361c52f90d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:562
export const LIZTROOP____header_global_af99dc5afe725fcd = ((((((1680) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_35bbd027ed635235ef4f499a() {
  return __cxx_static_address_35bbd027ed635235ef4f499a.reference || (__cxx_static_address_35bbd027ed635235ef4f499a.reference = {
    __cReference: true,
    get value() { return LIZTROOP____header_global_af99dc5afe725fcd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:563
export const LIZTROOPRUNNING____header_global_0218abfc2c50f960 = ((((((1681) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eae3b8e46da0f25bd17b7ecc() {
  return __cxx_static_address_eae3b8e46da0f25bd17b7ecc.reference || (__cxx_static_address_eae3b8e46da0f25bd17b7ecc.reference = {
    __cReference: true,
    get value() { return LIZTROOPRUNNING____header_global_0218abfc2c50f960; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:564
export const LIZTROOPSTAYPUT____header_global_f5ec88b2a17a9e11 = ((((((1682) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e7591e70be7d890b60dd1f16() {
  return __cxx_static_address_e7591e70be7d890b60dd1f16.reference || (__cxx_static_address_e7591e70be7d890b60dd1f16.reference = {
    __cReference: true,
    get value() { return LIZTROOPSTAYPUT____header_global_f5ec88b2a17a9e11; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:565
export const LIZTROOPSHOOT____header_global_f99d87f580f54eaa = ((((((1715) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_11aada3a9cd0d7303086dbe8() {
  return __cxx_static_address_11aada3a9cd0d7303086dbe8.reference || (__cxx_static_address_11aada3a9cd0d7303086dbe8.reference = {
    __cReference: true,
    get value() { return LIZTROOPSHOOT____header_global_f99d87f580f54eaa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:566
export const LIZTROOPJETPACK____header_global_1c57fc67c89e5498 = ((((((1725) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b810cf2ad82a1e33ca9c654e() {
  return __cxx_static_address_b810cf2ad82a1e33ca9c654e.reference || (__cxx_static_address_b810cf2ad82a1e33ca9c654e.reference = {
    __cReference: true,
    get value() { return LIZTROOPJETPACK____header_global_1c57fc67c89e5498; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:567
export const LIZTROOPONTOILET____header_global_eace19be3361aa1e = ((((((1741) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_906cda302436095808c4c66f() {
  return __cxx_static_address_906cda302436095808c4c66f.reference || (__cxx_static_address_906cda302436095808c4c66f.reference = {
    __cReference: true,
    get value() { return LIZTROOPONTOILET____header_global_eace19be3361aa1e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:568
export const LIZTROOPJUSTSIT____header_global_e71e072dabc31407 = ((((((1742) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_70a792f830012f1519601f67() {
  return __cxx_static_address_70a792f830012f1519601f67.reference || (__cxx_static_address_70a792f830012f1519601f67.reference = {
    __cReference: true,
    get value() { return LIZTROOPJUSTSIT____header_global_e71e072dabc31407; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:569
export const LIZTROOPDUCKING____header_global_ee2693bc16f0d169 = ((((((1744) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d84b24215c19d820571f3f99() {
  return __cxx_static_address_d84b24215c19d820571f3f99.reference || (__cxx_static_address_d84b24215c19d820571f3f99.reference = {
    __cReference: true,
    get value() { return LIZTROOPDUCKING____header_global_ee2693bc16f0d169; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:570
export const HEADJIB1____header_global_224713651eaab255 = ((((((1768) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3b0d971ca038baf36c29e948() {
  return __cxx_static_address_3b0d971ca038baf36c29e948.reference || (__cxx_static_address_3b0d971ca038baf36c29e948.reference = {
    __cReference: true,
    get value() { return HEADJIB1____header_global_224713651eaab255; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:571
export const ARMJIB1____header_global_0380673444c38cf0 = ((((((1772) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9cc141f33f5369e42febb61f() {
  return __cxx_static_address_9cc141f33f5369e42febb61f.reference || (__cxx_static_address_9cc141f33f5369e42febb61f.reference = {
    __cReference: true,
    get value() { return ARMJIB1____header_global_0380673444c38cf0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:572
export const LEGJIB1____header_global_c3c879a1ec1b2408 = ((((((1776) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aad02ab678bfdca8ebfebb1f() {
  return __cxx_static_address_aad02ab678bfdca8ebfebb1f.reference || (__cxx_static_address_aad02ab678bfdca8ebfebb1f.reference = {
    __cReference: true,
    get value() { return LEGJIB1____header_global_c3c879a1ec1b2408; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:573
export const OCTABRAIN____header_global_0deeb6443885f51e = ((((((1820) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3b2c600f2e485d965075f490() {
  return __cxx_static_address_3b2c600f2e485d965075f490.reference || (__cxx_static_address_3b2c600f2e485d965075f490.reference = {
    __cReference: true,
    get value() { return OCTABRAIN____header_global_0deeb6443885f51e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:574
export const OCTABRAINSTAYPUT____header_global_1f5c367334df81dc = ((((((1821) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f0019328c815d72a58bd3fd4() {
  return __cxx_static_address_f0019328c815d72a58bd3fd4.reference || (__cxx_static_address_f0019328c815d72a58bd3fd4.reference = {
    __cReference: true,
    get value() { return OCTABRAINSTAYPUT____header_global_1f5c367334df81dc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:575
export const INNERJAW____header_global_5bc31f4f288a3dc3 = ((((((1860) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fdfd79ef4cc0b3674bbda8e8() {
  return __cxx_static_address_fdfd79ef4cc0b3674bbda8e8.reference || (__cxx_static_address_fdfd79ef4cc0b3674bbda8e8.reference = {
    __cReference: true,
    get value() { return INNERJAW____header_global_5bc31f4f288a3dc3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:576
export const DRONE____header_global_0893fd6518b16e9e = ((((((1880) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c5a0c0619b27c98b49ab4d1a() {
  return __cxx_static_address_c5a0c0619b27c98b49ab4d1a.reference || (__cxx_static_address_c5a0c0619b27c98b49ab4d1a.reference = {
    __cReference: true,
    get value() { return DRONE____header_global_0893fd6518b16e9e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:577
export const EXPLOSION2____header_global_b8bdd2d5a863b41a = ((((((1890) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_09e845e9b4f60c97a2eb69ff() {
  return __cxx_static_address_09e845e9b4f60c97a2eb69ff.reference || (__cxx_static_address_09e845e9b4f60c97a2eb69ff.reference = {
    __cReference: true,
    get value() { return EXPLOSION2____header_global_b8bdd2d5a863b41a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:578
export const COMMANDER____header_global_1928329b3653be30 = ((((((1920) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ef962f1c36498b774ba539f1() {
  return __cxx_static_address_ef962f1c36498b774ba539f1.reference || (__cxx_static_address_ef962f1c36498b774ba539f1.reference = {
    __cReference: true,
    get value() { return COMMANDER____header_global_1928329b3653be30; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:579
export const COMMANDERSTAYPUT____header_global_a701ca73d5e30ce5 = ((((((1921) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_df7fc92ee9fd2dac55c91f99() {
  return __cxx_static_address_df7fc92ee9fd2dac55c91f99.reference || (__cxx_static_address_df7fc92ee9fd2dac55c91f99.reference = {
    __cReference: true,
    get value() { return COMMANDERSTAYPUT____header_global_a701ca73d5e30ce5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:580
export const RECON____header_global_a4a2df0a02018662 = ((((((1960) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6a5f2013e7fdf2f5c9f79589() {
  return __cxx_static_address_6a5f2013e7fdf2f5c9f79589.reference || (__cxx_static_address_6a5f2013e7fdf2f5c9f79589.reference = {
    __cReference: true,
    get value() { return RECON____header_global_a4a2df0a02018662; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:581
export const TANK____header_global_18a64cb498aa4c27 = ((((((1975) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2e30decd5ace829c3ea8c5af() {
  return __cxx_static_address_2e30decd5ace829c3ea8c5af.reference || (__cxx_static_address_2e30decd5ace829c3ea8c5af.reference = {
    __cReference: true,
    get value() { return TANK____header_global_18a64cb498aa4c27; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:582
export const PIGCOP____header_global_46129fb3d40fd4d7 = ((((((2000) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5ca24623e6f4c50ace9bbd86() {
  return __cxx_static_address_5ca24623e6f4c50ace9bbd86.reference || (__cxx_static_address_5ca24623e6f4c50ace9bbd86.reference = {
    __cReference: true,
    get value() { return PIGCOP____header_global_46129fb3d40fd4d7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:583
export const PIGCOPSTAYPUT____header_global_f75a7a555af2ee76 = ((((((2001) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_42950538cf5b96c097ce95e2() {
  return __cxx_static_address_42950538cf5b96c097ce95e2.reference || (__cxx_static_address_42950538cf5b96c097ce95e2.reference = {
    __cReference: true,
    get value() { return PIGCOPSTAYPUT____header_global_f75a7a555af2ee76; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:584
export const PIGCOPDIVE____header_global_791f212c40192ee6 = ((((((2045) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ed181217d11b909695f21b68() {
  return __cxx_static_address_ed181217d11b909695f21b68.reference || (__cxx_static_address_ed181217d11b909695f21b68.reference = {
    __cReference: true,
    get value() { return PIGCOPDIVE____header_global_791f212c40192ee6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:585
export const LIZMAN____header_global_99cc1db3a177553c = ((((((2120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d2b507bd7db7557fbd5c779c() {
  return __cxx_static_address_d2b507bd7db7557fbd5c779c.reference || (__cxx_static_address_d2b507bd7db7557fbd5c779c.reference = {
    __cReference: true,
    get value() { return LIZMAN____header_global_99cc1db3a177553c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:586
export const LIZMANSTAYPUT____header_global_9534b246ddf558e7 = ((((((2121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0df6ecaf52b772fbdc9d0a0a() {
  return __cxx_static_address_0df6ecaf52b772fbdc9d0a0a.reference || (__cxx_static_address_0df6ecaf52b772fbdc9d0a0a.reference = {
    __cReference: true,
    get value() { return LIZMANSTAYPUT____header_global_9534b246ddf558e7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:587
export const LIZMANSPITTING____header_global_03f2f34bb863e04c = ((((((2150) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c0f400bf7d69be077f673b0c() {
  return __cxx_static_address_c0f400bf7d69be077f673b0c.reference || (__cxx_static_address_c0f400bf7d69be077f673b0c.reference = {
    __cReference: true,
    get value() { return LIZMANSPITTING____header_global_03f2f34bb863e04c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:588
export const LIZMANFEEDING____header_global_3ac94e879794c45a = ((((((2160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c7327ecaff6e8e77cd6c0b46() {
  return __cxx_static_address_c7327ecaff6e8e77cd6c0b46.reference || (__cxx_static_address_c7327ecaff6e8e77cd6c0b46.reference = {
    __cReference: true,
    get value() { return LIZMANFEEDING____header_global_3ac94e879794c45a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:589
export const LIZMANJUMP____header_global_012f1d16a4380a92 = ((((((2165) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1a7c04a3fffe2dbbec68d65d() {
  return __cxx_static_address_1a7c04a3fffe2dbbec68d65d.reference || (__cxx_static_address_1a7c04a3fffe2dbbec68d65d.reference = {
    __cReference: true,
    get value() { return LIZMANJUMP____header_global_012f1d16a4380a92; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:590
export const FECES____header_global_3dc93f9d730b3d82 = ((((((2200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_72d48ee8f119e69107749b5c() {
  return __cxx_static_address_72d48ee8f119e69107749b5c.reference || (__cxx_static_address_72d48ee8f119e69107749b5c.reference = {
    __cReference: true,
    get value() { return FECES____header_global_3dc93f9d730b3d82; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:591
export const LIZMANHEAD1____header_global_d58234061fd41d16 = ((((((2201) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_69e26c9acd96d4c71a5e0c3f() {
  return __cxx_static_address_69e26c9acd96d4c71a5e0c3f.reference || (__cxx_static_address_69e26c9acd96d4c71a5e0c3f.reference = {
    __cReference: true,
    get value() { return LIZMANHEAD1____header_global_d58234061fd41d16; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:592
export const LIZMANARM1____header_global_be96a5b274fe6cd0 = ((((((2205) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_69d2b10d0fcd7267f090f3b1() {
  return __cxx_static_address_69d2b10d0fcd7267f090f3b1.reference || (__cxx_static_address_69d2b10d0fcd7267f090f3b1.reference = {
    __cReference: true,
    get value() { return LIZMANARM1____header_global_be96a5b274fe6cd0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:593
export const LIZMANLEG1____header_global_5b4485965cbfdbdc = ((((((2209) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f3de44d91091f063440030c2() {
  return __cxx_static_address_f3de44d91091f063440030c2.reference || (__cxx_static_address_f3de44d91091f063440030c2.reference = {
    __cReference: true,
    get value() { return LIZMANLEG1____header_global_5b4485965cbfdbdc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:594
export const EXPLOSION2BOT____header_global_639912b9f4f631e8 = ((((((2219) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_21c669fa53c07ff1d5c5336f() {
  return __cxx_static_address_21c669fa53c07ff1d5c5336f.reference || (__cxx_static_address_21c669fa53c07ff1d5c5336f.reference = {
    __cReference: true,
    get value() { return EXPLOSION2BOT____header_global_639912b9f4f631e8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:595
export const JIBS1____header_global_950381444d45b76f = ((((((2245) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_66d92db24bcf934c8a75ef61() {
  return __cxx_static_address_66d92db24bcf934c8a75ef61.reference || (__cxx_static_address_66d92db24bcf934c8a75ef61.reference = {
    __cReference: true,
    get value() { return JIBS1____header_global_950381444d45b76f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:596
export const JIBS2____header_global_35d938518eb6959f = ((((((2250) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8f9bf2956a9522bb25a5a5fa() {
  return __cxx_static_address_8f9bf2956a9522bb25a5a5fa.reference || (__cxx_static_address_8f9bf2956a9522bb25a5a5fa.reference = {
    __cReference: true,
    get value() { return JIBS2____header_global_35d938518eb6959f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:597
export const JIBS3____header_global_be4b4aee1373ad63 = ((((((2255) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ed127208fb2d207e980f1993() {
  return __cxx_static_address_ed127208fb2d207e980f1993.reference || (__cxx_static_address_ed127208fb2d207e980f1993.reference = {
    __cReference: true,
    get value() { return JIBS3____header_global_be4b4aee1373ad63; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:598
export const JIBS4____header_global_4b890bc1bb25bca8 = ((((((2260) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1688a063f43bd66555fe1e9e() {
  return __cxx_static_address_1688a063f43bd66555fe1e9e.reference || (__cxx_static_address_1688a063f43bd66555fe1e9e.reference = {
    __cReference: true,
    get value() { return JIBS4____header_global_4b890bc1bb25bca8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:599
export const JIBS5____header_global_50dfd62c3c4ad3bd = ((((((2265) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0fe6594c40da6a8bdb6e61ea() {
  return __cxx_static_address_0fe6594c40da6a8bdb6e61ea.reference || (__cxx_static_address_0fe6594c40da6a8bdb6e61ea.reference = {
    __cReference: true,
    get value() { return JIBS5____header_global_50dfd62c3c4ad3bd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:600
export const BURNING____header_global_145d6fd0324424ef = ((((((2270) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_678fb578bdd5a9cce4a58d37() {
  return __cxx_static_address_678fb578bdd5a9cce4a58d37.reference || (__cxx_static_address_678fb578bdd5a9cce4a58d37.reference = {
    __cReference: true,
    get value() { return BURNING____header_global_145d6fd0324424ef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:601
export const FIRE____header_global_7cf0581776515e51 = ((((((2271) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_24f78e9a52b3f27db63484e7() {
  return __cxx_static_address_24f78e9a52b3f27db63484e7.reference || (__cxx_static_address_24f78e9a52b3f27db63484e7.reference = {
    __cReference: true,
    get value() { return FIRE____header_global_7cf0581776515e51; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:602
export const JIBS6____header_global_3a3c3439ce792b85 = ((((((2286) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3705e6bc7bb1b30cf7cfcf15() {
  return __cxx_static_address_3705e6bc7bb1b30cf7cfcf15.reference || (__cxx_static_address_3705e6bc7bb1b30cf7cfcf15.reference = {
    __cReference: true,
    get value() { return JIBS6____header_global_3a3c3439ce792b85; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:603
export const BLOODSPLAT1____header_global_93dc653abb36a9ee = ((((((2296) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_86672ff22afd1397fb7b1799() {
  return __cxx_static_address_86672ff22afd1397fb7b1799.reference || (__cxx_static_address_86672ff22afd1397fb7b1799.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT1____header_global_93dc653abb36a9ee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:604
export const BLOODSPLAT3____header_global_9b5be07b995acd65 = ((((((2297) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0802c72a51036e8ce469f4e9() {
  return __cxx_static_address_0802c72a51036e8ce469f4e9.reference || (__cxx_static_address_0802c72a51036e8ce469f4e9.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT3____header_global_9b5be07b995acd65; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:605
export const BLOODSPLAT2____header_global_930e54fca06ed280 = ((((((2298) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ebbad985688b7efe082f3b49() {
  return __cxx_static_address_ebbad985688b7efe082f3b49.reference || (__cxx_static_address_ebbad985688b7efe082f3b49.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT2____header_global_930e54fca06ed280; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:606
export const BLOODSPLAT4____header_global_a8d1aee7fc86e08f = ((((((2299) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fa855798c493c9779e753b3c() {
  return __cxx_static_address_fa855798c493c9779e753b3c.reference || (__cxx_static_address_fa855798c493c9779e753b3c.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT4____header_global_a8d1aee7fc86e08f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:607
export const OOZ____header_global_16de1bde8fe2a7e8 = ((((((2300) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9fd67868a696b6c4de376a8b() {
  return __cxx_static_address_9fd67868a696b6c4de376a8b.reference || (__cxx_static_address_9fd67868a696b6c4de376a8b.reference = {
    __cReference: true,
    get value() { return OOZ____header_global_16de1bde8fe2a7e8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:608
export const OOZ2____header_global_83da6ae67d25d1bf = ((((((2309) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e65e08f89a0fe2b298a8167f() {
  return __cxx_static_address_e65e08f89a0fe2b298a8167f.reference || (__cxx_static_address_e65e08f89a0fe2b298a8167f.reference = {
    __cReference: true,
    get value() { return OOZ2____header_global_83da6ae67d25d1bf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:609
export const WALLBLOOD1____header_global_428b07187bfae562 = ((((((2301) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a81f77fb7409a7fc6fc770dc() {
  return __cxx_static_address_a81f77fb7409a7fc6fc770dc.reference || (__cxx_static_address_a81f77fb7409a7fc6fc770dc.reference = {
    __cReference: true,
    get value() { return WALLBLOOD1____header_global_428b07187bfae562; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:610
export const WALLBLOOD2____header_global_ca36e1329780792a = ((((((2302) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_510753ed8be93b092646be5c() {
  return __cxx_static_address_510753ed8be93b092646be5c.reference || (__cxx_static_address_510753ed8be93b092646be5c.reference = {
    __cReference: true,
    get value() { return WALLBLOOD2____header_global_ca36e1329780792a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:611
export const WALLBLOOD3____header_global_263e4c096a9edc5f = ((((((2303) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e3c36bcdd781670718b0f3ac() {
  return __cxx_static_address_e3c36bcdd781670718b0f3ac.reference || (__cxx_static_address_e3c36bcdd781670718b0f3ac.reference = {
    __cReference: true,
    get value() { return WALLBLOOD3____header_global_263e4c096a9edc5f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:612
export const WALLBLOOD4____header_global_05f2ca403d125332 = ((((((2304) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1c2bc50cf79bc8b6e7e0ab86() {
  return __cxx_static_address_1c2bc50cf79bc8b6e7e0ab86.reference || (__cxx_static_address_1c2bc50cf79bc8b6e7e0ab86.reference = {
    __cReference: true,
    get value() { return WALLBLOOD4____header_global_05f2ca403d125332; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:613
export const WALLBLOOD5____header_global_e8b10329df1cf685 = ((((((2305) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5f1a00d7dc4136151f4a01e7() {
  return __cxx_static_address_5f1a00d7dc4136151f4a01e7.reference || (__cxx_static_address_5f1a00d7dc4136151f4a01e7.reference = {
    __cReference: true,
    get value() { return WALLBLOOD5____header_global_e8b10329df1cf685; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:614
export const WALLBLOOD7____header_global_b0a334a8c6b5f62d = ((((((2307) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b6486ba7edce5230260a264a() {
  return __cxx_static_address_b6486ba7edce5230260a264a.reference || (__cxx_static_address_b6486ba7edce5230260a264a.reference = {
    __cReference: true,
    get value() { return WALLBLOOD7____header_global_b0a334a8c6b5f62d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:615
export const WALLBLOOD8____header_global_8cfb54eabb9b31c9 = ((((((2308) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5920247fc648222fe9d21a46() {
  return __cxx_static_address_5920247fc648222fe9d21a46.reference || (__cxx_static_address_5920247fc648222fe9d21a46.reference = {
    __cReference: true,
    get value() { return WALLBLOOD8____header_global_8cfb54eabb9b31c9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:616
export const BURNING2____header_global_997820a913ef733e = ((((((2310) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3186d4b766018d31490d8df8() {
  return __cxx_static_address_3186d4b766018d31490d8df8.reference || (__cxx_static_address_3186d4b766018d31490d8df8.reference = {
    __cReference: true,
    get value() { return BURNING2____header_global_997820a913ef733e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:617
export const FIRE2____header_global_83dd71383d70c8ee = ((((((2311) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_070c459c3b0654aa0b3a6079() {
  return __cxx_static_address_070c459c3b0654aa0b3a6079.reference || (__cxx_static_address_070c459c3b0654aa0b3a6079.reference = {
    __cReference: true,
    get value() { return FIRE2____header_global_83dd71383d70c8ee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:618
export const CRACKKNUCKLES____header_global_aa2443ea7674f15a = ((((((2324) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6dba0eecf68a9a433f7d016f() {
  return __cxx_static_address_6dba0eecf68a9a433f7d016f.reference || (__cxx_static_address_6dba0eecf68a9a433f7d016f.reference = {
    __cReference: true,
    get value() { return CRACKKNUCKLES____header_global_aa2443ea7674f15a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:619
export const SMALLSMOKE____header_global_e47105bee22906cf = ((((((2329) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5b51d85a0290d79c46062a3d() {
  return __cxx_static_address_5b51d85a0290d79c46062a3d.reference || (__cxx_static_address_5b51d85a0290d79c46062a3d.reference = {
    __cReference: true,
    get value() { return SMALLSMOKE____header_global_e47105bee22906cf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:620
export const FLOORFLAME____header_global_b77b72e8bc875b7e = ((((((2333) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f2bcb4e11ffd2eb3bad7e9a9() {
  return __cxx_static_address_f2bcb4e11ffd2eb3bad7e9a9.reference || (__cxx_static_address_f2bcb4e11ffd2eb3bad7e9a9.reference = {
    __cReference: true,
    get value() { return FLOORFLAME____header_global_b77b72e8bc875b7e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:621
export const ROTATEGUN____header_global_15c9db7fc234b48a = ((((((2360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fe804f99070eeec5a051e04b() {
  return __cxx_static_address_fe804f99070eeec5a051e04b.reference || (__cxx_static_address_fe804f99070eeec5a051e04b.reference = {
    __cReference: true,
    get value() { return ROTATEGUN____header_global_15c9db7fc234b48a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:622
export const GREENSLIME____header_global_a245afacd9cfdac1 = ((((((2370) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_35d0993b08a8b680cf5bb949() {
  return __cxx_static_address_35d0993b08a8b680cf5bb949.reference || (__cxx_static_address_35d0993b08a8b680cf5bb949.reference = {
    __cReference: true,
    get value() { return GREENSLIME____header_global_a245afacd9cfdac1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:623
export const WATERDRIPSPLASH____header_global_19be731c7d981c48 = ((((((2380) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_683f93fc04f2ccc3660c0519() {
  return __cxx_static_address_683f93fc04f2ccc3660c0519.reference || (__cxx_static_address_683f93fc04f2ccc3660c0519.reference = {
    __cReference: true,
    get value() { return WATERDRIPSPLASH____header_global_19be731c7d981c48; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:624
export const SCRAP6____header_global_9b306be6b03aea48 = ((((((2390) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_97c0632f86f3617b01bb5c54() {
  return __cxx_static_address_97c0632f86f3617b01bb5c54.reference || (__cxx_static_address_97c0632f86f3617b01bb5c54.reference = {
    __cReference: true,
    get value() { return SCRAP6____header_global_9b306be6b03aea48; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:625
export const SCRAP1____header_global_5b4680c186fe795f = ((((((2400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8fa7ba2042e577ccc4840e2c() {
  return __cxx_static_address_8fa7ba2042e577ccc4840e2c.reference || (__cxx_static_address_8fa7ba2042e577ccc4840e2c.reference = {
    __cReference: true,
    get value() { return SCRAP1____header_global_5b4680c186fe795f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:626
export const SCRAP2____header_global_e5d2ddfce92fa9b1 = ((((((2404) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a1a43b4097ec0362ed2284af() {
  return __cxx_static_address_a1a43b4097ec0362ed2284af.reference || (__cxx_static_address_a1a43b4097ec0362ed2284af.reference = {
    __cReference: true,
    get value() { return SCRAP2____header_global_e5d2ddfce92fa9b1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:627
export const SCRAP3____header_global_72c231133ab37ee4 = ((((((2408) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_871304e9975604372a1ac71d() {
  return __cxx_static_address_871304e9975604372a1ac71d.reference || (__cxx_static_address_871304e9975604372a1ac71d.reference = {
    __cReference: true,
    get value() { return SCRAP3____header_global_72c231133ab37ee4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:628
export const SCRAP4____header_global_61a0f3162162879a = ((((((2412) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_13726ce81b9a0d5c6401b7b5() {
  return __cxx_static_address_13726ce81b9a0d5c6401b7b5.reference || (__cxx_static_address_13726ce81b9a0d5c6401b7b5.reference = {
    __cReference: true,
    get value() { return SCRAP4____header_global_61a0f3162162879a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:629
export const SCRAP5____header_global_39521c692b1aa9e9 = ((((((2416) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9c639594140b946443f614ec() {
  return __cxx_static_address_9c639594140b946443f614ec.reference || (__cxx_static_address_9c639594140b946443f614ec.reference = {
    __cReference: true,
    get value() { return SCRAP5____header_global_39521c692b1aa9e9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:630
export const ORGANTIC____header_global_08369ca14b4527ff = ((((((2420) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e48059d91dd8d775a15fe988() {
  return __cxx_static_address_e48059d91dd8d775a15fe988.reference || (__cxx_static_address_e48059d91dd8d775a15fe988.reference = {
    __cReference: true,
    get value() { return ORGANTIC____header_global_08369ca14b4527ff; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:631
export const BETAVERSION____header_global_e27c5711fc6a71fb = ((((((2440) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b1ea0c575f07cbd76ec541f1() {
  return __cxx_static_address_b1ea0c575f07cbd76ec541f1.reference || (__cxx_static_address_b1ea0c575f07cbd76ec541f1.reference = {
    __cReference: true,
    get value() { return BETAVERSION____header_global_e27c5711fc6a71fb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:632
export const SELECTDIR____header_global_01961deeec676428 = ((((((2444) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6f346e2617f835328ce68709() {
  return __cxx_static_address_6f346e2617f835328ce68709.reference || (__cxx_static_address_6f346e2617f835328ce68709.reference = {
    __cReference: true,
    get value() { return SELECTDIR____header_global_01961deeec676428; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:633
export const F1HELP____header_global_d20b6eb404778add = ((((((2445) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5559c2664fa5e61ecdf7e60d() {
  return __cxx_static_address_5559c2664fa5e61ecdf7e60d.reference || (__cxx_static_address_5559c2664fa5e61ecdf7e60d.reference = {
    __cReference: true,
    get value() { return F1HELP____header_global_d20b6eb404778add; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:634
export const GROWSPARK____header_global_27d1562da1fe4249 = ((((((2448) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d2c1e93ed10c209db546cc81() {
  return __cxx_static_address_d2c1e93ed10c209db546cc81.reference || (__cxx_static_address_d2c1e93ed10c209db546cc81.reference = {
    __cReference: true,
    get value() { return GROWSPARK____header_global_27d1562da1fe4249; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:635
export const MENUSCREEN____header_global_ae26825538043d1d = ((((((2456) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5cee78a04c20829a34877d29() {
  return __cxx_static_address_5cee78a04c20829a34877d29.reference || (__cxx_static_address_5cee78a04c20829a34877d29.reference = {
    __cReference: true,
    get value() { return MENUSCREEN____header_global_ae26825538043d1d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:636
export const MENUBAR____header_global_7c470f387e3697f5 = ((((((2457) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_10c2a171197b921f05eabb44() {
  return __cxx_static_address_10c2a171197b921f05eabb44.reference || (__cxx_static_address_10c2a171197b921f05eabb44.reference = {
    __cReference: true,
    get value() { return MENUBAR____header_global_7c470f387e3697f5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:637
export const KILLSICON____header_global_ac5a19fb0ce67b13 = ((((((2458) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d5967fbb78eb650cee078354() {
  return __cxx_static_address_d5967fbb78eb650cee078354.reference || (__cxx_static_address_d5967fbb78eb650cee078354.reference = {
    __cReference: true,
    get value() { return KILLSICON____header_global_ac5a19fb0ce67b13; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:638
export const FIRSTAID_ICON____header_global_784c1d6e3eaa1da0 = ((((((2460) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2f012ea6e9ee807d762d3bf7() {
  return __cxx_static_address_2f012ea6e9ee807d762d3bf7.reference || (__cxx_static_address_2f012ea6e9ee807d762d3bf7.reference = {
    __cReference: true,
    get value() { return FIRSTAID_ICON____header_global_784c1d6e3eaa1da0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:639
export const HEAT_ICON____header_global_7a6410ef62c89b58 = ((((((2461) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_61a12d39b0e08c87a0a023b5() {
  return __cxx_static_address_61a12d39b0e08c87a0a023b5.reference || (__cxx_static_address_61a12d39b0e08c87a0a023b5.reference = {
    __cReference: true,
    get value() { return HEAT_ICON____header_global_7a6410ef62c89b58; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:640
export const BOTTOMSTATUSBAR____header_global_fa9f712aa43e2c91 = ((((((2462) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_46a3407d2b9a8aa3b55dbc5e() {
  return __cxx_static_address_46a3407d2b9a8aa3b55dbc5e.reference || (__cxx_static_address_46a3407d2b9a8aa3b55dbc5e.reference = {
    __cReference: true,
    get value() { return BOTTOMSTATUSBAR____header_global_fa9f712aa43e2c91; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:641
export const BOOT_ICON____header_global_3c125dc6f1f4a3b8 = ((((((2463) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e2c3fb76085a256af605909c() {
  return __cxx_static_address_e2c3fb76085a256af605909c.reference || (__cxx_static_address_e2c3fb76085a256af605909c.reference = {
    __cReference: true,
    get value() { return BOOT_ICON____header_global_3c125dc6f1f4a3b8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:642
export const FRAGBAR____header_global_c076e1ef9dd09aaa = ((((((2465) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2a5877e6ea79cb57e3555cb0() {
  return __cxx_static_address_2a5877e6ea79cb57e3555cb0.reference || (__cxx_static_address_2a5877e6ea79cb57e3555cb0.reference = {
    __cReference: true,
    get value() { return FRAGBAR____header_global_c076e1ef9dd09aaa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:643
export const JETPACK_ICON____header_global_7e26be04a7e1deae = ((((((2467) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_89eeac9fbc9cb83147adfb84() {
  return __cxx_static_address_89eeac9fbc9cb83147adfb84.reference || (__cxx_static_address_89eeac9fbc9cb83147adfb84.reference = {
    __cReference: true,
    get value() { return JETPACK_ICON____header_global_7e26be04a7e1deae; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:644
export const AIRTANK_ICON____header_global_ab1eeba9ccc3a9e8 = ((((((2468) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6e23b8c9b8eaf62d23ab4633() {
  return __cxx_static_address_6e23b8c9b8eaf62d23ab4633.reference || (__cxx_static_address_6e23b8c9b8eaf62d23ab4633.reference = {
    __cReference: true,
    get value() { return AIRTANK_ICON____header_global_ab1eeba9ccc3a9e8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:645
export const STEROIDS_ICON____header_global_ac13dfe9fac731cd = ((((((2469) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6c5d08b4a2c345640f5636b9() {
  return __cxx_static_address_6c5d08b4a2c345640f5636b9.reference || (__cxx_static_address_6c5d08b4a2c345640f5636b9.reference = {
    __cReference: true,
    get value() { return STEROIDS_ICON____header_global_ac13dfe9fac731cd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:646
export const HOLODUKE_ICON____header_global_fccf8c0bdf2122a0 = ((((((2470) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8d5972862c28ff6a54d704c2() {
  return __cxx_static_address_8d5972862c28ff6a54d704c2.reference || (__cxx_static_address_8d5972862c28ff6a54d704c2.reference = {
    __cReference: true,
    get value() { return HOLODUKE_ICON____header_global_fccf8c0bdf2122a0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:647
export const ACCESS_ICON____header_global_aacbcd21781639c7 = ((((((2471) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e657757b6295f0986685ed9d() {
  return __cxx_static_address_e657757b6295f0986685ed9d.reference || (__cxx_static_address_e657757b6295f0986685ed9d.reference = {
    __cReference: true,
    get value() { return ACCESS_ICON____header_global_aacbcd21781639c7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:648
export const DIGITALNUM____header_global_b05edf707b729082 = ((((((2472) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fec1f390da83ce5cf6abbfeb() {
  return __cxx_static_address_fec1f390da83ce5cf6abbfeb.reference || (__cxx_static_address_fec1f390da83ce5cf6abbfeb.reference = {
    __cReference: true,
    get value() { return DIGITALNUM____header_global_b05edf707b729082; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:649
export const DUKECAR____header_global_9c4df0dfd69a1b03 = ((((((2491) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a73ff40e3dd305570e6ec9a1() {
  return __cxx_static_address_a73ff40e3dd305570e6ec9a1.reference || (__cxx_static_address_a73ff40e3dd305570e6ec9a1.reference = {
    __cReference: true,
    get value() { return DUKECAR____header_global_9c4df0dfd69a1b03; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:650
export const CAMCORNER____header_global_31c581192f5f187c = ((((((2482) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3dbc4d40ae264f7ee7995cb5() {
  return __cxx_static_address_3dbc4d40ae264f7ee7995cb5.reference || (__cxx_static_address_3dbc4d40ae264f7ee7995cb5.reference = {
    __cReference: true,
    get value() { return CAMCORNER____header_global_31c581192f5f187c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:651
export const CAMLIGHT____header_global_ea6460e82be88052 = ((((((2484) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4350cd6a76c100a4ea5a2364() {
  return __cxx_static_address_4350cd6a76c100a4ea5a2364.reference || (__cxx_static_address_4350cd6a76c100a4ea5a2364.reference = {
    __cReference: true,
    get value() { return CAMLIGHT____header_global_ea6460e82be88052; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:652
export const SLIDEBAR____header_global_19c7ef58f133b894 = ((((((2489) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ec9777bdaa5b18fb2d4b0620() {
  return __cxx_static_address_ec9777bdaa5b18fb2d4b0620.reference || (__cxx_static_address_ec9777bdaa5b18fb2d4b0620.reference = {
    __cReference: true,
    get value() { return SLIDEBAR____header_global_19c7ef58f133b894; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:653
export const DREALMS____header_global_301115efcac6cd54 = ((((((2492) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9fd82b4541d08a7becca2502() {
  return __cxx_static_address_9fd82b4541d08a7becca2502.reference || (__cxx_static_address_9fd82b4541d08a7becca2502.reference = {
    __cReference: true,
    get value() { return DREALMS____header_global_301115efcac6cd54; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:654
export const BETASCREEN____header_global_434ff999db0a46fe = ((((((2493) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7c70d91fbfef56b023f0496c() {
  return __cxx_static_address_7c70d91fbfef56b023f0496c.reference || (__cxx_static_address_7c70d91fbfef56b023f0496c.reference = {
    __cReference: true,
    get value() { return BETASCREEN____header_global_434ff999db0a46fe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:655
export const WINDOWBORDER1____header_global_2ba63edb9276ce1d = ((((((2494) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_318ba013965b3016ec72a97d() {
  return __cxx_static_address_318ba013965b3016ec72a97d.reference || (__cxx_static_address_318ba013965b3016ec72a97d.reference = {
    __cReference: true,
    get value() { return WINDOWBORDER1____header_global_2ba63edb9276ce1d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:656
export const TEXTBOX____header_global_1d82142358d58f47 = ((((((2495) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_123fbe464f2e4a389440079c() {
  return __cxx_static_address_123fbe464f2e4a389440079c.reference || (__cxx_static_address_123fbe464f2e4a389440079c.reference = {
    __cReference: true,
    get value() { return TEXTBOX____header_global_1d82142358d58f47; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:657
export const WINDOWBORDER2____header_global_84bfb5f5c6b53f8d = ((((((2496) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4f678c0270e9cac10f03d944() {
  return __cxx_static_address_4f678c0270e9cac10f03d944.reference || (__cxx_static_address_4f678c0270e9cac10f03d944.reference = {
    __cReference: true,
    get value() { return WINDOWBORDER2____header_global_84bfb5f5c6b53f8d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:658
export const DUKENUKEM____header_global_269c36a0cab5b51a = ((((((2497) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f5a822352fdf8f4f77df355f() {
  return __cxx_static_address_f5a822352fdf8f4f77df355f.reference || (__cxx_static_address_f5a822352fdf8f4f77df355f.reference = {
    __cReference: true,
    get value() { return DUKENUKEM____header_global_269c36a0cab5b51a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:659
export const THREEDEE____header_global_c20d57c63c57a388 = ((((((2498) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d577a4afc0de9eff97ac75bc() {
  return __cxx_static_address_d577a4afc0de9eff97ac75bc.reference || (__cxx_static_address_d577a4afc0de9eff97ac75bc.reference = {
    __cReference: true,
    get value() { return THREEDEE____header_global_c20d57c63c57a388; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:660
export const INGAMEDUKETHREEDEE____header_global_e394086f3dbce2d8 = ((((((2499) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4f1aa7e8b852a59014e2db1a() {
  return __cxx_static_address_4f1aa7e8b852a59014e2db1a.reference || (__cxx_static_address_4f1aa7e8b852a59014e2db1a.reference = {
    __cReference: true,
    get value() { return INGAMEDUKETHREEDEE____header_global_e394086f3dbce2d8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:661
export const TENSCREEN____header_global_535ca01ae8af3a45 = ((((((2500) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2ce2531512403396f9c45227() {
  return __cxx_static_address_2ce2531512403396f9c45227.reference || (__cxx_static_address_2ce2531512403396f9c45227.reference = {
    __cReference: true,
    get value() { return TENSCREEN____header_global_535ca01ae8af3a45; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:662
export const PLUTOPAKSPRITE____header_global_fe206e8c60e7e6b3 = ((((((2501) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_29d0418395c4983f149a8863() {
  return __cxx_static_address_29d0418395c4983f149a8863.reference || (__cxx_static_address_29d0418395c4983f149a8863.reference = {
    __cReference: true,
    get value() { return PLUTOPAKSPRITE____header_global_fe206e8c60e7e6b3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:663
export const DEVISTATOR____header_global_b4e19b22553648f6 = ((((((2510) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_92a19f2f27bb1e58a50b5fdb() {
  return __cxx_static_address_92a19f2f27bb1e58a50b5fdb.reference || (__cxx_static_address_92a19f2f27bb1e58a50b5fdb.reference = {
    __cReference: true,
    get value() { return DEVISTATOR____header_global_b4e19b22553648f6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:664
export const KNEE____header_global_9a904a0b3e95e3ac = ((((((2521) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_77aeab6ad90e154fd493df0c() {
  return __cxx_static_address_77aeab6ad90e154fd493df0c.reference || (__cxx_static_address_77aeab6ad90e154fd493df0c.reference = {
    __cReference: true,
    get value() { return KNEE____header_global_9a904a0b3e95e3ac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:665
export const CROSSHAIR____header_global_801de80beeb56480 = ((((((2523) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cd3b7a465c40bfc6b23ebc35() {
  return __cxx_static_address_cd3b7a465c40bfc6b23ebc35.reference || (__cxx_static_address_cd3b7a465c40bfc6b23ebc35.reference = {
    __cReference: true,
    get value() { return CROSSHAIR____header_global_801de80beeb56480; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:666
export const FIRSTGUN____header_global_5a545c66a9fd62c8 = ((((((2524) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_84ddcc2ed8ca290d599a6739() {
  return __cxx_static_address_84ddcc2ed8ca290d599a6739.reference || (__cxx_static_address_84ddcc2ed8ca290d599a6739.reference = {
    __cReference: true,
    get value() { return FIRSTGUN____header_global_5a545c66a9fd62c8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:667
export const FIRSTGUNRELOAD____header_global_ba99dba1ba83a383 = ((((((2528) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_df13990169eb0aa5b6bf7e85() {
  return __cxx_static_address_df13990169eb0aa5b6bf7e85.reference || (__cxx_static_address_df13990169eb0aa5b6bf7e85.reference = {
    __cReference: true,
    get value() { return FIRSTGUNRELOAD____header_global_ba99dba1ba83a383; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:668
export const SHELL____header_global_dfe415d0940b9688 = ((((((2533) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b0c4c66f85da7de343ef5787() {
  return __cxx_static_address_b0c4c66f85da7de343ef5787.reference || (__cxx_static_address_b0c4c66f85da7de343ef5787.reference = {
    __cReference: true,
    get value() { return SHELL____header_global_dfe415d0940b9688; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:669
export const SHOTGUNSHELL____header_global_dd3af59e6f4f2a96 = ((((((2535) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c2f19ff4e9fc706b7a9e4e44() {
  return __cxx_static_address_c2f19ff4e9fc706b7a9e4e44.reference || (__cxx_static_address_c2f19ff4e9fc706b7a9e4e44.reference = {
    __cReference: true,
    get value() { return SHOTGUNSHELL____header_global_dd3af59e6f4f2a96; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:670
export const CHAINGUN____header_global_94fde26f94323a54 = ((((((2536) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5d657adff64af4a39f9d6688() {
  return __cxx_static_address_5d657adff64af4a39f9d6688.reference || (__cxx_static_address_5d657adff64af4a39f9d6688.reference = {
    __cReference: true,
    get value() { return CHAINGUN____header_global_94fde26f94323a54; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:671
export const RPGGUN____header_global_11b7a059139650ef = ((((((2544) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7045ca3d02073353c328ddd4() {
  return __cxx_static_address_7045ca3d02073353c328ddd4.reference || (__cxx_static_address_7045ca3d02073353c328ddd4.reference = {
    __cReference: true,
    get value() { return RPGGUN____header_global_11b7a059139650ef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:672
export const FREEZE____header_global_6f6e669540c4b3d3 = ((((((2548) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cf97382063a4cd63a66205ef() {
  return __cxx_static_address_cf97382063a4cd63a66205ef.reference || (__cxx_static_address_cf97382063a4cd63a66205ef.reference = {
    __cReference: true,
    get value() { return FREEZE____header_global_6f6e669540c4b3d3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:673
export const SHRINKER____header_global_f706bbc3d5ba1dff = ((((((2556) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6d251586bb4f0f24de64d788() {
  return __cxx_static_address_6d251586bb4f0f24de64d788.reference || (__cxx_static_address_6d251586bb4f0f24de64d788.reference = {
    __cReference: true,
    get value() { return SHRINKER____header_global_f706bbc3d5ba1dff; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:674
export const HANDHOLDINGLASER____header_global_1a0fae4fbd70ac95 = ((((((2563) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e2a3e0aafde6e7cf867b3e6a() {
  return __cxx_static_address_e2a3e0aafde6e7cf867b3e6a.reference || (__cxx_static_address_e2a3e0aafde6e7cf867b3e6a.reference = {
    __cReference: true,
    get value() { return HANDHOLDINGLASER____header_global_1a0fae4fbd70ac95; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:675
export const TRIPBOMB____header_global_46f6bdd5affe3305 = ((((((2566) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e25b112edd7758ed43ca449f() {
  return __cxx_static_address_e25b112edd7758ed43ca449f.reference || (__cxx_static_address_e25b112edd7758ed43ca449f.reference = {
    __cReference: true,
    get value() { return TRIPBOMB____header_global_46f6bdd5affe3305; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:676
export const LASERLINE____header_global_c858d9da72e730d9 = ((((((2567) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ac96d74cf833ce3546c78c9a() {
  return __cxx_static_address_ac96d74cf833ce3546c78c9a.reference || (__cxx_static_address_ac96d74cf833ce3546c78c9a.reference = {
    __cReference: true,
    get value() { return LASERLINE____header_global_c858d9da72e730d9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:677
export const HANDHOLDINGACCESS____header_global_c18f4e86cda3cbaf = ((((((2568) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bf71473dbdb38845a4442375() {
  return __cxx_static_address_bf71473dbdb38845a4442375.reference || (__cxx_static_address_bf71473dbdb38845a4442375.reference = {
    __cReference: true,
    get value() { return HANDHOLDINGACCESS____header_global_c18f4e86cda3cbaf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:678
export const HANDREMOTE____header_global_78ae6a5be758e579 = ((((((2570) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_544c095b84bd8998953559b4() {
  return __cxx_static_address_544c095b84bd8998953559b4.reference || (__cxx_static_address_544c095b84bd8998953559b4.reference = {
    __cReference: true,
    get value() { return HANDREMOTE____header_global_78ae6a5be758e579; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:679
export const HANDTHROW____header_global_2702a3f198f14f92 = ((((((2573) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b8b3df60179bf136001536c2() {
  return __cxx_static_address_b8b3df60179bf136001536c2.reference || (__cxx_static_address_b8b3df60179bf136001536c2.reference = {
    __cReference: true,
    get value() { return HANDTHROW____header_global_2702a3f198f14f92; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:680
export const TIP____header_global_9fcf18ec98698d05 = ((((((2576) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_acbf82b3e30cac1531763367() {
  return __cxx_static_address_acbf82b3e30cac1531763367.reference || (__cxx_static_address_acbf82b3e30cac1531763367.reference = {
    __cReference: true,
    get value() { return TIP____header_global_9fcf18ec98698d05; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:681
export const SCUBAMASK____header_global_120410dd0d28e8e3 = ((((((2581) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_17bd2aa132764c705bf7ea16() {
  return __cxx_static_address_17bd2aa132764c705bf7ea16.reference || (__cxx_static_address_17bd2aa132764c705bf7ea16.reference = {
    __cReference: true,
    get value() { return SCUBAMASK____header_global_120410dd0d28e8e3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:682
export const FORCESPHERE____header_global_205351cafb8908ad = ((((((2590) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9aca5e3d18e312e261c130aa() {
  return __cxx_static_address_9aca5e3d18e312e261c130aa.reference || (__cxx_static_address_9aca5e3d18e312e261c130aa.reference = {
    __cReference: true,
    get value() { return FORCESPHERE____header_global_205351cafb8908ad; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:683
export const SHOTSPARK1____header_global_e990b4fb9ebe8647 = ((((((2595) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_63b9125c5f23dfbfe00e1703() {
  return __cxx_static_address_63b9125c5f23dfbfe00e1703.reference || (__cxx_static_address_63b9125c5f23dfbfe00e1703.reference = {
    __cReference: true,
    get value() { return SHOTSPARK1____header_global_e990b4fb9ebe8647; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:684
export const RPG____header_global_dd8986348a267fe7 = ((((((2605) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8fa9a0f0513830dbacf16fd5() {
  return __cxx_static_address_8fa9a0f0513830dbacf16fd5.reference || (__cxx_static_address_8fa9a0f0513830dbacf16fd5.reference = {
    __cReference: true,
    get value() { return RPG____header_global_dd8986348a267fe7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:685
export const LASERSITE____header_global_08dd10555b72ecb8 = ((((((2612) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_20a13fb81882d7ef9fe0171e() {
  return __cxx_static_address_20a13fb81882d7ef9fe0171e.reference || (__cxx_static_address_20a13fb81882d7ef9fe0171e.reference = {
    __cReference: true,
    get value() { return LASERSITE____header_global_08dd10555b72ecb8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:686
export const SHOTGUN____header_global_aeb32571cfbdfc19 = ((((((2613) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f9fd5041308dc2894f5e3d3b() {
  return __cxx_static_address_f9fd5041308dc2894f5e3d3b.reference || (__cxx_static_address_f9fd5041308dc2894f5e3d3b.reference = {
    __cReference: true,
    get value() { return SHOTGUN____header_global_aeb32571cfbdfc19; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:687
export const BOSS1____header_global_d81a469a7dd6ea91 = ((((((2630) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_23974a34b81a2c35ffbdae10() {
  return __cxx_static_address_23974a34b81a2c35ffbdae10.reference || (__cxx_static_address_23974a34b81a2c35ffbdae10.reference = {
    __cReference: true,
    get value() { return BOSS1____header_global_d81a469a7dd6ea91; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:688
export const BOSS1STAYPUT____header_global_d6530e8c3e830837 = ((((((2631) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c9fe71ec85a16b1ec15187ad() {
  return __cxx_static_address_c9fe71ec85a16b1ec15187ad.reference || (__cxx_static_address_c9fe71ec85a16b1ec15187ad.reference = {
    __cReference: true,
    get value() { return BOSS1STAYPUT____header_global_d6530e8c3e830837; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:689
export const BOSS1SHOOT____header_global_202aff81f4f66ccc = ((((((2660) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cd7bf8ce1a70246c3b463061() {
  return __cxx_static_address_cd7bf8ce1a70246c3b463061.reference || (__cxx_static_address_cd7bf8ce1a70246c3b463061.reference = {
    __cReference: true,
    get value() { return BOSS1SHOOT____header_global_202aff81f4f66ccc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:690
export const BOSS1LOB____header_global_7fcefca44f5b9ebc = ((((((2670) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_932c56e7900cc967f6eeb4e0() {
  return __cxx_static_address_932c56e7900cc967f6eeb4e0.reference || (__cxx_static_address_932c56e7900cc967f6eeb4e0.reference = {
    __cReference: true,
    get value() { return BOSS1LOB____header_global_7fcefca44f5b9ebc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:691
export const BOSSTOP____header_global_fcdab00b8359d0e4 = ((((((2696) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b24c6bfa2832b01b8e0ffb58() {
  return __cxx_static_address_b24c6bfa2832b01b8e0ffb58.reference || (__cxx_static_address_b24c6bfa2832b01b8e0ffb58.reference = {
    __cReference: true,
    get value() { return BOSSTOP____header_global_fcdab00b8359d0e4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:692
export const BOSS2____header_global_760917b1fa97d247 = ((((((2710) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0a240b984c35e63fcc840281() {
  return __cxx_static_address_0a240b984c35e63fcc840281.reference || (__cxx_static_address_0a240b984c35e63fcc840281.reference = {
    __cReference: true,
    get value() { return BOSS2____header_global_760917b1fa97d247; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:693
export const BOSS3____header_global_cd863cdfba552967 = ((((((2760) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fdcd3f819834c1fc681f0c2e() {
  return __cxx_static_address_fdcd3f819834c1fc681f0c2e.reference || (__cxx_static_address_fdcd3f819834c1fc681f0c2e.reference = {
    __cReference: true,
    get value() { return BOSS3____header_global_cd863cdfba552967; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:694
export const SPINNINGNUKEICON____header_global_56e9f1b7ba6c3b6a = ((((((2813) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_08f6e6b1b27d42e1628f2615() {
  return __cxx_static_address_08f6e6b1b27d42e1628f2615.reference || (__cxx_static_address_08f6e6b1b27d42e1628f2615.reference = {
    __cReference: true,
    get value() { return SPINNINGNUKEICON____header_global_56e9f1b7ba6c3b6a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:695
export const SMALLFNTCURSOR____header_global_bdacebac0441f5df = ((((((2821) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cc2a93afc744634b98656233() {
  return __cxx_static_address_cc2a93afc744634b98656233.reference || (__cxx_static_address_cc2a93afc744634b98656233.reference = {
    __cReference: true,
    get value() { return SMALLFNTCURSOR____header_global_bdacebac0441f5df; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:696
export const STARTALPHANUM____header_global_98284a8a96884e2d = ((((((2822) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b89b94567f9bf5ab2c9c80ec() {
  return __cxx_static_address_b89b94567f9bf5ab2c9c80ec.reference || (__cxx_static_address_b89b94567f9bf5ab2c9c80ec.reference = {
    __cReference: true,
    get value() { return STARTALPHANUM____header_global_98284a8a96884e2d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:697
export const ENDALPHANUM____header_global_7f51f2dc47e2883f = ((((((2915) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ce87ed084efd66a7ba3dae56() {
  return __cxx_static_address_ce87ed084efd66a7ba3dae56.reference || (__cxx_static_address_ce87ed084efd66a7ba3dae56.reference = {
    __cReference: true,
    get value() { return ENDALPHANUM____header_global_7f51f2dc47e2883f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:698
export const BIGALPHANUM____header_global_cd947b1e0e2b5f26 = ((((((2940) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8c26e25ab0567e6c12d1f2c7() {
  return __cxx_static_address_8c26e25ab0567e6c12d1f2c7.reference || (__cxx_static_address_8c26e25ab0567e6c12d1f2c7.reference = {
    __cReference: true,
    get value() { return BIGALPHANUM____header_global_cd947b1e0e2b5f26; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:699
export const BIGPERIOD____header_global_bb33815d43d49164 = ((((((3002) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f2e5e33b175eba43136f9d8b() {
  return __cxx_static_address_f2e5e33b175eba43136f9d8b.reference || (__cxx_static_address_f2e5e33b175eba43136f9d8b.reference = {
    __cReference: true,
    get value() { return BIGPERIOD____header_global_bb33815d43d49164; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:700
export const BIGCOMMA____header_global_544ce471e1b85c50 = ((((((3003) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_363d03be0b3c5b047f687ee9() {
  return __cxx_static_address_363d03be0b3c5b047f687ee9.reference || (__cxx_static_address_363d03be0b3c5b047f687ee9.reference = {
    __cReference: true,
    get value() { return BIGCOMMA____header_global_544ce471e1b85c50; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:701
export const BIGX____header_global_dc418d9649f463ca = ((((((3004) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8a66335fd9b64320dcd071f1() {
  return __cxx_static_address_8a66335fd9b64320dcd071f1.reference || (__cxx_static_address_8a66335fd9b64320dcd071f1.reference = {
    __cReference: true,
    get value() { return BIGX____header_global_dc418d9649f463ca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:702
export const BIGQ____header_global_b3556fde93557d4c = ((((((3005) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8d19c9b48535692a376ea224() {
  return __cxx_static_address_8d19c9b48535692a376ea224.reference || (__cxx_static_address_8d19c9b48535692a376ea224.reference = {
    __cReference: true,
    get value() { return BIGQ____header_global_b3556fde93557d4c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:703
export const BIGSEMI____header_global_9f27ce58af108518 = ((((((3006) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8db29545c721cd83ab0ec520() {
  return __cxx_static_address_8db29545c721cd83ab0ec520.reference || (__cxx_static_address_8db29545c721cd83ab0ec520.reference = {
    __cReference: true,
    get value() { return BIGSEMI____header_global_9f27ce58af108518; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:704
export const BIGCOLIN____header_global_dece69a07c525add = ((((((3007) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_922bbfd3e7467b1335e41be5() {
  return __cxx_static_address_922bbfd3e7467b1335e41be5.reference || (__cxx_static_address_922bbfd3e7467b1335e41be5.reference = {
    __cReference: true,
    get value() { return BIGCOLIN____header_global_dece69a07c525add; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:705
export const THREEBYFIVE____header_global_bb80c4bea51abfef = ((((((3010) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2d2f2850c73a4c166a44a50f() {
  return __cxx_static_address_2d2f2850c73a4c166a44a50f.reference || (__cxx_static_address_2d2f2850c73a4c166a44a50f.reference = {
    __cReference: true,
    get value() { return THREEBYFIVE____header_global_bb80c4bea51abfef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:706
export const BIGAPPOS____header_global_326cb2e6b330fc5a = ((((((3022) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_51201fc56faa50526eae94f8() {
  return __cxx_static_address_51201fc56faa50526eae94f8.reference || (__cxx_static_address_51201fc56faa50526eae94f8.reference = {
    __cReference: true,
    get value() { return BIGAPPOS____header_global_326cb2e6b330fc5a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:707
export const MINIFONT____header_global_fe9219d015d66418 = ((((((3072) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_80ee1ef32422d19797a46284() {
  return __cxx_static_address_80ee1ef32422d19797a46284.reference || (__cxx_static_address_80ee1ef32422d19797a46284.reference = {
    __cReference: true,
    get value() { return MINIFONT____header_global_fe9219d015d66418; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:708
export const RESPAWNMARKERRED____header_global_606bf199c0572039 = ((((((3190) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3c118936caedf554d3b784f9() {
  return __cxx_static_address_3c118936caedf554d3b784f9.reference || (__cxx_static_address_3c118936caedf554d3b784f9.reference = {
    __cReference: true,
    get value() { return RESPAWNMARKERRED____header_global_606bf199c0572039; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:709
export const RESPAWNMARKERYELLOW____header_global_c7401fc39882c509 = ((((((3200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3c722157f2cd9cfbf6efbe8d() {
  return __cxx_static_address_3c722157f2cd9cfbf6efbe8d.reference || (__cxx_static_address_3c722157f2cd9cfbf6efbe8d.reference = {
    __cReference: true,
    get value() { return RESPAWNMARKERYELLOW____header_global_c7401fc39882c509; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:710
export const RESPAWNMARKERGREEN____header_global_728a6b690bb5c9b3 = ((((((3210) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8cbf9227a5693b7e3a851fd3() {
  return __cxx_static_address_8cbf9227a5693b7e3a851fd3.reference || (__cxx_static_address_8cbf9227a5693b7e3a851fd3.reference = {
    __cReference: true,
    get value() { return RESPAWNMARKERGREEN____header_global_728a6b690bb5c9b3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:711
export const BONUSSCREEN____header_global_d9d73bba6652264e = ((((((3240) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2f369bb67d8402421360b2e8() {
  return __cxx_static_address_2f369bb67d8402421360b2e8.reference || (__cxx_static_address_2f369bb67d8402421360b2e8.reference = {
    __cReference: true,
    get value() { return BONUSSCREEN____header_global_d9d73bba6652264e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:712
export const VIEWBORDER____header_global_39886ec9cb3f87f3 = ((((((3250) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ada5609a37e1dce3621e00ff() {
  return __cxx_static_address_ada5609a37e1dce3621e00ff.reference || (__cxx_static_address_ada5609a37e1dce3621e00ff.reference = {
    __cReference: true,
    get value() { return VIEWBORDER____header_global_39886ec9cb3f87f3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:713
export const VICTORY1____header_global_32c92ef05d2b102a = ((((((3260) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_310af5850f4e890d5c6161b0() {
  return __cxx_static_address_310af5850f4e890d5c6161b0.reference || (__cxx_static_address_310af5850f4e890d5c6161b0.reference = {
    __cReference: true,
    get value() { return VICTORY1____header_global_32c92ef05d2b102a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:714
export const ORDERING____header_global_fdf9c4ea9b089362 = ((((((3270) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a8f37befab3c2a27f4dfb426() {
  return __cxx_static_address_a8f37befab3c2a27f4dfb426.reference || (__cxx_static_address_a8f37befab3c2a27f4dfb426.reference = {
    __cReference: true,
    get value() { return ORDERING____header_global_fdf9c4ea9b089362; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:715
export const TEXTSTORY____header_global_7687552f44a9c5d5 = ((((((3280) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_971c7e31b925bddf5b3b586a() {
  return __cxx_static_address_971c7e31b925bddf5b3b586a.reference || (__cxx_static_address_971c7e31b925bddf5b3b586a.reference = {
    __cReference: true,
    get value() { return TEXTSTORY____header_global_7687552f44a9c5d5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:716
export const LOADSCREEN____header_global_1bdac7622304e77f = ((((((3281) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ddff08064b3c69e58b59b315() {
  return __cxx_static_address_ddff08064b3c69e58b59b315.reference || (__cxx_static_address_ddff08064b3c69e58b59b315.reference = {
    __cReference: true,
    get value() { return LOADSCREEN____header_global_1bdac7622304e77f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:717
export const BORNTOBEWILDSCREEN____header_global_a1a7c9e92a2b7332 = ((((((3370) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2cbee21aa5d95f70e13c288e() {
  return __cxx_static_address_2cbee21aa5d95f70e13c288e.reference || (__cxx_static_address_2cbee21aa5d95f70e13c288e.reference = {
    __cReference: true,
    get value() { return BORNTOBEWILDSCREEN____header_global_a1a7c9e92a2b7332; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:718
export const BLIMP____header_global_1a7c7d5633bd099a = ((((((3400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bd1979770df9bc6d3b8a8c9d() {
  return __cxx_static_address_bd1979770df9bc6d3b8a8c9d.reference || (__cxx_static_address_bd1979770df9bc6d3b8a8c9d.reference = {
    __cReference: true,
    get value() { return BLIMP____header_global_1a7c7d5633bd099a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:719
export const FEM9____header_global_272f64e400886f5d = ((((((3450) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dece57e555bfc05013293d38() {
  return __cxx_static_address_dece57e555bfc05013293d38.reference || (__cxx_static_address_dece57e555bfc05013293d38.reference = {
    __cReference: true,
    get value() { return FEM9____header_global_272f64e400886f5d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:720
export const FRAMEEFFECT1_13____header_global_4f199fb7d5dcccc0 = ((((((3999) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0500e2089d3d8dc307159f73() {
  return __cxx_static_address_0500e2089d3d8dc307159f73.reference || (__cxx_static_address_0500e2089d3d8dc307159f73.reference = {
    __cReference: true,
    get value() { return FRAMEEFFECT1_13____header_global_4f199fb7d5dcccc0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:721
export const FRAMEEFFECT1____header_global_d6b45aebb1e6149b = ((((((4095) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_00547d991e0ad1310cfa2589() {
  return __cxx_static_address_00547d991e0ad1310cfa2589.reference || (__cxx_static_address_00547d991e0ad1310cfa2589.reference = {
    __cReference: true,
    get value() { return FRAMEEFFECT1____header_global_d6b45aebb1e6149b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:722
export const PANNEL3____header_global_7101f3f51f22e17e = ((((((4099) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_da82c951c69a2393ceb1fc54() {
  return __cxx_static_address_da82c951c69a2393ceb1fc54.reference || (__cxx_static_address_da82c951c69a2393ceb1fc54.reference = {
    __cReference: true,
    get value() { return PANNEL3____header_global_7101f3f51f22e17e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:723
export const SCREENBREAK14____header_global_74e7f2725229d481 = ((((((4120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4b8249222d077332fd6d3b52() {
  return __cxx_static_address_4b8249222d077332fd6d3b52.reference || (__cxx_static_address_4b8249222d077332fd6d3b52.reference = {
    __cReference: true,
    get value() { return SCREENBREAK14____header_global_74e7f2725229d481; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:724
export const SCREENBREAK15____header_global_945f96e94e2cb47e = ((((((4123) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3f1f66a02ea8052906976268() {
  return __cxx_static_address_3f1f66a02ea8052906976268.reference || (__cxx_static_address_3f1f66a02ea8052906976268.reference = {
    __cReference: true,
    get value() { return SCREENBREAK15____header_global_945f96e94e2cb47e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:725
export const SCREENBREAK19____header_global_7f07122c4fdc5206 = ((((((4125) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8b4005d4b4cce265a29608da() {
  return __cxx_static_address_8b4005d4b4cce265a29608da.reference || (__cxx_static_address_8b4005d4b4cce265a29608da.reference = {
    __cReference: true,
    get value() { return SCREENBREAK19____header_global_7f07122c4fdc5206; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:726
export const SCREENBREAK16____header_global_4b4a61434b39cd70 = ((((((4127) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2139a7d68b6534c1458f84bb() {
  return __cxx_static_address_2139a7d68b6534c1458f84bb.reference || (__cxx_static_address_2139a7d68b6534c1458f84bb.reference = {
    __cReference: true,
    get value() { return SCREENBREAK16____header_global_4b4a61434b39cd70; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:727
export const SCREENBREAK17____header_global_e4ffc4028399d636 = ((((((4128) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a62ac1425f79cb6eedf55a1d() {
  return __cxx_static_address_a62ac1425f79cb6eedf55a1d.reference || (__cxx_static_address_a62ac1425f79cb6eedf55a1d.reference = {
    __cReference: true,
    get value() { return SCREENBREAK17____header_global_e4ffc4028399d636; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:728
export const SCREENBREAK18____header_global_6311269e59011845 = ((((((4129) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3ff3e4bd69756963cb33b99e() {
  return __cxx_static_address_3ff3e4bd69756963cb33b99e.reference || (__cxx_static_address_3ff3e4bd69756963cb33b99e.reference = {
    __cReference: true,
    get value() { return SCREENBREAK18____header_global_6311269e59011845; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:729
export const W_TECHWALL11____header_global_1ca144eec125c3bc = ((((((4130) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4a6e3945c833e656f087de88() {
  return __cxx_static_address_4a6e3945c833e656f087de88.reference || (__cxx_static_address_4a6e3945c833e656f087de88.reference = {
    __cReference: true,
    get value() { return W_TECHWALL11____header_global_1ca144eec125c3bc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:730
export const W_TECHWALL12____header_global_760d22fb314c0d76 = ((((((4131) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2c924fa25eb69de6eea9bcfa() {
  return __cxx_static_address_2c924fa25eb69de6eea9bcfa.reference || (__cxx_static_address_2c924fa25eb69de6eea9bcfa.reference = {
    __cReference: true,
    get value() { return W_TECHWALL12____header_global_760d22fb314c0d76; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:731
export const W_TECHWALL13____header_global_ee4df632bd880219 = ((((((4132) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8e73690ad2b06e7da804b32f() {
  return __cxx_static_address_8e73690ad2b06e7da804b32f.reference || (__cxx_static_address_8e73690ad2b06e7da804b32f.reference = {
    __cReference: true,
    get value() { return W_TECHWALL13____header_global_ee4df632bd880219; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:732
export const W_TECHWALL14____header_global_da3a72cf2d1f4bf6 = ((((((4133) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9ed742ef02d0c2caa5d9a80c() {
  return __cxx_static_address_9ed742ef02d0c2caa5d9a80c.reference || (__cxx_static_address_9ed742ef02d0c2caa5d9a80c.reference = {
    __cReference: true,
    get value() { return W_TECHWALL14____header_global_da3a72cf2d1f4bf6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:733
export const W_TECHWALL5____header_global_b9d53883a09f63d8 = ((((((4134) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_32f64b1ef148713c7d63a3db() {
  return __cxx_static_address_32f64b1ef148713c7d63a3db.reference || (__cxx_static_address_32f64b1ef148713c7d63a3db.reference = {
    __cReference: true,
    get value() { return W_TECHWALL5____header_global_b9d53883a09f63d8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:734
export const W_TECHWALL6____header_global_4ab0477820bddb03 = ((((((4136) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6c6107792e82911551747171() {
  return __cxx_static_address_6c6107792e82911551747171.reference || (__cxx_static_address_6c6107792e82911551747171.reference = {
    __cReference: true,
    get value() { return W_TECHWALL6____header_global_4ab0477820bddb03; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:735
export const W_TECHWALL7____header_global_ecab37dc96b81116 = ((((((4138) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_247b96921100423bd61772b4() {
  return __cxx_static_address_247b96921100423bd61772b4.reference || (__cxx_static_address_247b96921100423bd61772b4.reference = {
    __cReference: true,
    get value() { return W_TECHWALL7____header_global_ecab37dc96b81116; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:736
export const W_TECHWALL8____header_global_aa1aa79a805aa5ec = ((((((4140) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a37be2bfe3aebd562f082e8c() {
  return __cxx_static_address_a37be2bfe3aebd562f082e8c.reference || (__cxx_static_address_a37be2bfe3aebd562f082e8c.reference = {
    __cReference: true,
    get value() { return W_TECHWALL8____header_global_aa1aa79a805aa5ec; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:737
export const W_TECHWALL9____header_global_33e6fe2bbccd5b8f = ((((((4142) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6e25d1dc12691fcb11c696eb() {
  return __cxx_static_address_6e25d1dc12691fcb11c696eb.reference || (__cxx_static_address_6e25d1dc12691fcb11c696eb.reference = {
    __cReference: true,
    get value() { return W_TECHWALL9____header_global_33e6fe2bbccd5b8f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:738
export const BPANNEL3____header_global_19224b717a3f1dc4 = ((((((4100) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_326a8b144a48288075e80f4e() {
  return __cxx_static_address_326a8b144a48288075e80f4e.reference || (__cxx_static_address_326a8b144a48288075e80f4e.reference = {
    __cReference: true,
    get value() { return BPANNEL3____header_global_19224b717a3f1dc4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:739
export const W_HITTECHWALL16____header_global_5f80a1d397123bf9 = ((((((4144) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_498a5abac3b66a095d329b4b() {
  return __cxx_static_address_498a5abac3b66a095d329b4b.reference || (__cxx_static_address_498a5abac3b66a095d329b4b.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL16____header_global_5f80a1d397123bf9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:740
export const W_HITTECHWALL10____header_global_ed43d96c6422c3d0 = ((((((4145) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5905bba6ef10bbee3f2b972f() {
  return __cxx_static_address_5905bba6ef10bbee3f2b972f.reference || (__cxx_static_address_5905bba6ef10bbee3f2b972f.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL10____header_global_ed43d96c6422c3d0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:741
export const W_HITTECHWALL15____header_global_786e6ff26d7a7932 = ((((((4147) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fe1463b7e0fc5421595380fe() {
  return __cxx_static_address_fe1463b7e0fc5421595380fe.reference || (__cxx_static_address_fe1463b7e0fc5421595380fe.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL15____header_global_786e6ff26d7a7932; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:742
export const W_MILKSHELF____header_global_042996b772ba05d7 = ((((((4181) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b93100b0c99daf5126c09a11() {
  return __cxx_static_address_b93100b0c99daf5126c09a11.reference || (__cxx_static_address_b93100b0c99daf5126c09a11.reference = {
    __cReference: true,
    get value() { return W_MILKSHELF____header_global_042996b772ba05d7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:743
export const W_MILKSHELFBROKE____header_global_cb69aee948258835 = ((((((4203) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_251cd4c698bb663eef07f899() {
  return __cxx_static_address_251cd4c698bb663eef07f899.reference || (__cxx_static_address_251cd4c698bb663eef07f899.reference = {
    __cReference: true,
    get value() { return W_MILKSHELFBROKE____header_global_cb69aee948258835; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:744
export const PURPLELAVA____header_global_628f435e143fb37a = ((((((4240) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9af750b243140e9e7d081faa() {
  return __cxx_static_address_9af750b243140e9e7d081faa.reference || (__cxx_static_address_9af750b243140e9e7d081faa.reference = {
    __cReference: true,
    get value() { return PURPLELAVA____header_global_628f435e143fb37a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:745
export const TARGET____header_global_cc749a541819fea5 = ((((((4359) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8b69647d1dd21598b775503b() {
  return __cxx_static_address_8b69647d1dd21598b775503b.reference || (__cxx_static_address_8b69647d1dd21598b775503b.reference = {
    __cReference: true,
    get value() { return TARGET____header_global_cc749a541819fea5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:746
export const DUCK____header_global_2e903dd6648fc131 = ((((((4361) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4a72ce061a62eb3b52884383() {
  return __cxx_static_address_4a72ce061a62eb3b52884383.reference || (__cxx_static_address_4a72ce061a62eb3b52884383.reference = {
    __cReference: true,
    get value() { return DUCK____header_global_2e903dd6648fc131; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:747
export const PUKE____header_global_8fdd747b9e7f0ecb = ((((((4389) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8d2ae121357e8db0879d134c() {
  return __cxx_static_address_8d2ae121357e8db0879d134c.reference || (__cxx_static_address_8d2ae121357e8db0879d134c.reference = {
    __cReference: true,
    get value() { return PUKE____header_global_8fdd747b9e7f0ecb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:748
export const DOORTILE23____header_global_a3a4299d1f4f97cb = ((((((4391) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9693dd551f7821e5bfe9913e() {
  return __cxx_static_address_9693dd551f7821e5bfe9913e.reference || (__cxx_static_address_9693dd551f7821e5bfe9913e.reference = {
    __cReference: true,
    get value() { return DOORTILE23____header_global_a3a4299d1f4f97cb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:749
export const SPEAKER____header_global_c7a539d9d4e94e39 = ((((((4397) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4a10ebeec4b87baa01fcdbec() {
  return __cxx_static_address_4a10ebeec4b87baa01fcdbec.reference || (__cxx_static_address_4a10ebeec4b87baa01fcdbec.reference = {
    __cReference: true,
    get value() { return SPEAKER____header_global_c7a539d9d4e94e39; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:750
export const MAIL____header_global_073d7132c0a04ba6 = ((((((4410) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6493df75d30b117384e6dd0c() {
  return __cxx_static_address_6493df75d30b117384e6dd0c.reference || (__cxx_static_address_6493df75d30b117384e6dd0c.reference = {
    __cReference: true,
    get value() { return MAIL____header_global_073d7132c0a04ba6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:751
export const HOTMEAT____header_global_e40623c42416aa50 = ((((((4427) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f91e47f96cf2301753e902b2() {
  return __cxx_static_address_f91e47f96cf2301753e902b2.reference || (__cxx_static_address_f91e47f96cf2301753e902b2.reference = {
    __cReference: true,
    get value() { return HOTMEAT____header_global_e40623c42416aa50; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:752
export const TRIPODCAMERA____header_global_ce3ed50589398342 = ((((((4444) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0952cd15e994fdc6d811b965() {
  return __cxx_static_address_0952cd15e994fdc6d811b965.reference || (__cxx_static_address_0952cd15e994fdc6d811b965.reference = {
    __cReference: true,
    get value() { return TRIPODCAMERA____header_global_ce3ed50589398342; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:753
export const PAPER____header_global_758488e305dfe8c5 = ((((((4460) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1ae9eb403b29214792174b11() {
  return __cxx_static_address_1ae9eb403b29214792174b11.reference || (__cxx_static_address_1ae9eb403b29214792174b11.reference = {
    __cReference: true,
    get value() { return PAPER____header_global_758488e305dfe8c5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:754
export const GENERICPOLE2____header_global_81aeadcbe307b308 = ((((((4465) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a282e931a5c75c1120e1cad5() {
  return __cxx_static_address_a282e931a5c75c1120e1cad5.reference || (__cxx_static_address_a282e931a5c75c1120e1cad5.reference = {
    __cReference: true,
    get value() { return GENERICPOLE2____header_global_81aeadcbe307b308; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:755
export const XXXSTACY____header_global_c8122e644deed85d = ((((((4470) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_58767007f481e9f1d602b28d() {
  return __cxx_static_address_58767007f481e9f1d602b28d.reference || (__cxx_static_address_58767007f481e9f1d602b28d.reference = {
    __cReference: true,
    get value() { return XXXSTACY____header_global_c8122e644deed85d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:756
export const LETTER____header_global_59428838039551ce = ((((((4502) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e4250ff76c6b6bfe7fefc376() {
  return __cxx_static_address_e4250ff76c6b6bfe7fefc376.reference || (__cxx_static_address_e4250ff76c6b6bfe7fefc376.reference = {
    __cReference: true,
    get value() { return LETTER____header_global_59428838039551ce; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:757
export const SIDEBOLT1____header_global_b69aa2291e30f9ce = ((((((4525) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9423b1e84b8457e97df6cd0e() {
  return __cxx_static_address_9423b1e84b8457e97df6cd0e.reference || (__cxx_static_address_9423b1e84b8457e97df6cd0e.reference = {
    __cReference: true,
    get value() { return SIDEBOLT1____header_global_b69aa2291e30f9ce; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:758
export const FOODOBJECT16____header_global_8b05a0c2db1bf91c = ((((((4545) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dcf3e70477565dcee40cdb94() {
  return __cxx_static_address_dcf3e70477565dcee40cdb94.reference || (__cxx_static_address_dcf3e70477565dcee40cdb94.reference = {
    __cReference: true,
    get value() { return FOODOBJECT16____header_global_8b05a0c2db1bf91c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:759
export const TAMPON____header_global_9924d1ae20202225 = ((((((4557) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6d6c85a7d3fd26b0ab47de93() {
  return __cxx_static_address_6d6c85a7d3fd26b0ab47de93.reference || (__cxx_static_address_6d6c85a7d3fd26b0ab47de93.reference = {
    __cReference: true,
    get value() { return TAMPON____header_global_9924d1ae20202225; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:760
export const CANWITHSOMETHING2____header_global_4e14f1c7f4083848 = ((((((4580) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c090e6d308682284c552df4e() {
  return __cxx_static_address_c090e6d308682284c552df4e.reference || (__cxx_static_address_c090e6d308682284c552df4e.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING2____header_global_4e14f1c7f4083848; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:761
export const CANWITHSOMETHING3____header_global_e72fcf49308635ec = ((((((4581) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_94d51609a573204e92403bd2() {
  return __cxx_static_address_94d51609a573204e92403bd2.reference || (__cxx_static_address_94d51609a573204e92403bd2.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING3____header_global_e72fcf49308635ec; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:762
export const CANWITHSOMETHING4____header_global_a167c7cce2b1a590 = ((((((4582) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9474148ecbc78b10058ee9ff() {
  return __cxx_static_address_9474148ecbc78b10058ee9ff.reference || (__cxx_static_address_9474148ecbc78b10058ee9ff.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING4____header_global_a167c7cce2b1a590; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:763
export const DOLPHIN1____header_global_7ef939ac0bd8862c = ((((((4591) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_960bcffd8b02460f9f928f92() {
  return __cxx_static_address_960bcffd8b02460f9f928f92.reference || (__cxx_static_address_960bcffd8b02460f9f928f92.reference = {
    __cReference: true,
    get value() { return DOLPHIN1____header_global_7ef939ac0bd8862c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:764
export const DOLPHIN2____header_global_e0ccfb8f3d683225 = ((((((4592) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_538dbe20db9c530d046e1860() {
  return __cxx_static_address_538dbe20db9c530d046e1860.reference || (__cxx_static_address_538dbe20db9c530d046e1860.reference = {
    __cReference: true,
    get value() { return DOLPHIN2____header_global_e0ccfb8f3d683225; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:765
export const NEWBEAST____header_global_785580b6845e042f = ((((((4610) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ba6877e14cfd5c99a4461ef9() {
  return __cxx_static_address_ba6877e14cfd5c99a4461ef9.reference || (__cxx_static_address_ba6877e14cfd5c99a4461ef9.reference = {
    __cReference: true,
    get value() { return NEWBEAST____header_global_785580b6845e042f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:766
export const NEWBEASTSTAYPUT____header_global_a607485d6b2e4b17 = ((((((4611) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9619c12dde82b89586e4e54e() {
  return __cxx_static_address_9619c12dde82b89586e4e54e.reference || (__cxx_static_address_9619c12dde82b89586e4e54e.reference = {
    __cReference: true,
    get value() { return NEWBEASTSTAYPUT____header_global_a607485d6b2e4b17; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:767
export const BOSS4____header_global_6f2e94223dc3c407 = ((((((4740) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f26c78d143050f2a25255bba() {
  return __cxx_static_address_f26c78d143050f2a25255bba.reference || (__cxx_static_address_f26c78d143050f2a25255bba.reference = {
    __cReference: true,
    get value() { return BOSS4____header_global_6f2e94223dc3c407; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:768
export const BOSS4STAYPUT____header_global_554bdd54093b2716 = ((((((4741) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6d3b06b29a16ca6fdc23431d() {
  return __cxx_static_address_6d3b06b29a16ca6fdc23431d.reference || (__cxx_static_address_6d3b06b29a16ca6fdc23431d.reference = {
    __cReference: true,
    get value() { return BOSS4STAYPUT____header_global_554bdd54093b2716; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:769
export const FEM10____header_global_e1eb9ede4cdf827d = ((((((4864) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b631ab2480984a37c08d0174() {
  return __cxx_static_address_b631ab2480984a37c08d0174.reference || (__cxx_static_address_b631ab2480984a37c08d0174.reference = {
    __cReference: true,
    get value() { return FEM10____header_global_e1eb9ede4cdf827d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:770
export const TOUGHGAL____header_global_80de3269f292a40c = ((((((4866) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2a088e070209146400058c11() {
  return __cxx_static_address_2a088e070209146400058c11.reference || (__cxx_static_address_2a088e070209146400058c11.reference = {
    __cReference: true,
    get value() { return TOUGHGAL____header_global_80de3269f292a40c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:771
export const MAN____header_global_739b7e9d236fa174 = ((((((4871) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9ff3a1a01ee8993839ac42ee() {
  return __cxx_static_address_9ff3a1a01ee8993839ac42ee.reference || (__cxx_static_address_9ff3a1a01ee8993839ac42ee.reference = {
    __cReference: true,
    get value() { return MAN____header_global_739b7e9d236fa174; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:772
export const MAN2____header_global_9ca6c3c16ef61efc = ((((((4872) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7ba29062602540b00916dc71() {
  return __cxx_static_address_7ba29062602540b00916dc71.reference || (__cxx_static_address_7ba29062602540b00916dc71.reference = {
    __cReference: true,
    get value() { return MAN2____header_global_9ca6c3c16ef61efc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:773
export const WOMAN____header_global_bdbc42f39247cd3c = ((((((4874) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_72e04dac8b30f0351a2d5e5e() {
  return __cxx_static_address_72e04dac8b30f0351a2d5e5e.reference || (__cxx_static_address_72e04dac8b30f0351a2d5e5e.reference = {
    __cReference: true,
    get value() { return WOMAN____header_global_bdbc42f39247cd3c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:774
export const NATURALLIGHTNING____header_global_ba5eb227912a27a6 = ((((((4890) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_12f96242ff7cb8b3604ccbb3() {
  return __cxx_static_address_12f96242ff7cb8b3604ccbb3.reference || (__cxx_static_address_12f96242ff7cb8b3604ccbb3.reference = {
    __cReference: true,
    get value() { return NATURALLIGHTNING____header_global_ba5eb227912a27a6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:775
export const WEATHERWARN____header_global_c5c84eea85017686 = ((((((4893) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3c28f6224230244b731a5a74() {
  return __cxx_static_address_3c28f6224230244b731a5a74.reference || (__cxx_static_address_3c28f6224230244b731a5a74.reference = {
    __cReference: true,
    get value() { return WEATHERWARN____header_global_c5c84eea85017686; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:776
export const DUKETAG____header_global_6d5387169a591d91 = ((((((4900) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9c73a7bad20e7fc9155c50d4() {
  return __cxx_static_address_9c73a7bad20e7fc9155c50d4.reference || (__cxx_static_address_9c73a7bad20e7fc9155c50d4.reference = {
    __cReference: true,
    get value() { return DUKETAG____header_global_6d5387169a591d91; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:777
export const SIGN1____header_global_a8fbd61b81c864c7 = ((((((4909) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5593d4fcd4b18363e90611fe() {
  return __cxx_static_address_5593d4fcd4b18363e90611fe.reference || (__cxx_static_address_5593d4fcd4b18363e90611fe.reference = {
    __cReference: true,
    get value() { return SIGN1____header_global_a8fbd61b81c864c7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:778
export const SIGN2____header_global_9d203f4adc3fb9c0 = ((((((4912) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_87ea5c7729b42136b4740974() {
  return __cxx_static_address_87ea5c7729b42136b4740974.reference || (__cxx_static_address_87ea5c7729b42136b4740974.reference = {
    __cReference: true,
    get value() { return SIGN2____header_global_9d203f4adc3fb9c0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:779
export const JURYGUY____header_global_8dfb25035974f176 = ((((((4943) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b1d3664ae00450e66e2d76b6() {
  return __cxx_static_address_b1d3664ae00450e66e2d76b6.reference || (__cxx_static_address_b1d3664ae00450e66e2d76b6.reference = {
    __cReference: true,
    get value() { return JURYGUY____header_global_8dfb25035974f176; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:780
export const WIDESCREENSTATUSBAR____header_global_e5a17be02b60cab9 = ((((((5120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a65f2ef30510cc6a729ae5aa() {
  return __cxx_static_address_a65f2ef30510cc6a729ae5aa.reference || (__cxx_static_address_a65f2ef30510cc6a729ae5aa.reference = {
    __cReference: true,
    get value() { return WIDESCREENSTATUSBAR____header_global_e5a17be02b60cab9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:781
export const RPGGUNWIDE____header_global_9d98782392dc66ac = ((((((5121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ea058044889c8e37858440d4() {
  return __cxx_static_address_ea058044889c8e37858440d4.reference || (__cxx_static_address_ea058044889c8e37858440d4.reference = {
    __cReference: true,
    get value() { return RPGGUNWIDE____header_global_9d98782392dc66ac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:782
export const FIRSTGUNRELOADWIDE____header_global_3c10f1364c37ae67 = ((((((5122) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_215d7bd55c7379cff3f06df8() {
  return __cxx_static_address_215d7bd55c7379cff3f06df8.reference || (__cxx_static_address_215d7bd55c7379cff3f06df8.reference = {
    __cReference: true,
    get value() { return FIRSTGUNRELOADWIDE____header_global_3c10f1364c37ae67; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:783
export const FREEZEWIDE____header_global_e64c48cc191c8d81 = ((((((5123) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a0f44bed8e765daa07c99132() {
  return __cxx_static_address_a0f44bed8e765daa07c99132.reference || (__cxx_static_address_a0f44bed8e765daa07c99132.reference = {
    __cReference: true,
    get value() { return FREEZEWIDE____header_global_e64c48cc191c8d81; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:784
export const FREEZEFIREWIDE____header_global_7499c1df4d9e41f2 = ((((((5124) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7b65e681b58cb5eda4ef05f1() {
  return __cxx_static_address_7b65e681b58cb5eda4ef05f1.reference || (__cxx_static_address_7b65e681b58cb5eda4ef05f1.reference = {
    __cReference: true,
    get value() { return FREEZEFIREWIDE____header_global_7499c1df4d9e41f2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:785
export const SHRINKERWIDE____header_global_f2d5ad47cf116eaf = ((((((5127) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1fec9e4c447c58664f75ecdd() {
  return __cxx_static_address_1fec9e4c447c58664f75ecdd.reference || (__cxx_static_address_1fec9e4c447c58664f75ecdd.reference = {
    __cReference: true,
    get value() { return SHRINKERWIDE____header_global_f2d5ad47cf116eaf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:786
export const CRACKKNUCKLESWIDE____header_global_8449e3670212a1a5 = ((((((5129) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4f9fb7e81b091093e3f6238b() {
  return __cxx_static_address_4f9fb7e81b091093e3f6238b.reference || (__cxx_static_address_4f9fb7e81b091093e3f6238b.reference = {
    __cReference: true,
    get value() { return CRACKKNUCKLESWIDE____header_global_8449e3670212a1a5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:787
export const FLAMETHROWERSPRITE____header_global_95b3feea4d6102c0 = ((((((5134) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_092fc3e26cc8c74fe78a5afe() {
  return __cxx_static_address_092fc3e26cc8c74fe78a5afe.reference || (__cxx_static_address_092fc3e26cc8c74fe78a5afe.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERSPRITE____header_global_95b3feea4d6102c0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:788
export const FLAMETHROWERAMMO____header_global_16fd757694baddb5 = ((((((5135) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a4e07dc32e554aa0e8224923() {
  return __cxx_static_address_a4e07dc32e554aa0e8224923.reference || (__cxx_static_address_a4e07dc32e554aa0e8224923.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERAMMO____header_global_16fd757694baddb5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:789
export const FLAMETHROWER____header_global_1aece9c7aff19b85 = ((((((5138) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c4403d23a2e2c4439d29be40() {
  return __cxx_static_address_c4403d23a2e2c4439d29be40.reference || (__cxx_static_address_c4403d23a2e2c4439d29be40.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER____header_global_1aece9c7aff19b85; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:790
export const FLAMETHROWERFIRE____header_global_e5a6c61dcfc74fd9 = ((((((5139) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_36458c00eee9fefa4d0cbac8() {
  return __cxx_static_address_36458c00eee9fefa4d0cbac8.reference || (__cxx_static_address_36458c00eee9fefa4d0cbac8.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERFIRE____header_global_e5a6c61dcfc74fd9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:791
export const FLAMETHROWERFLAME____header_global_f6c8006cf0f449b2 = ((((((1891) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4c910afe5b8f2ff2cc21b995() {
  return __cxx_static_address_4c910afe5b8f2ff2cc21b995.reference || (__cxx_static_address_4c910afe5b8f2ff2cc21b995.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERFLAME____header_global_f6c8006cf0f449b2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:792
export const FLAMETHROWERPILOT____header_global_1c4af86c9fc22866 = ((((((5174) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_955955ae61f8e5c250e17e65() {
  return __cxx_static_address_955955ae61f8e5c250e17e65.reference || (__cxx_static_address_955955ae61f8e5c250e17e65.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERPILOT____header_global_1c4af86c9fc22866; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:793
export const FIREBALL____header_global_1c1e9aa29292a37a = ((((((5163) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6570f1e59ad0551b6624da74() {
  return __cxx_static_address_6570f1e59ad0551b6624da74.reference || (__cxx_static_address_6570f1e59ad0551b6624da74.reference = {
    __cReference: true,
    get value() { return FIREBALL____header_global_1c1e9aa29292a37a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:794
export const ONFIRE____header_global_69fd150774e908e6 = ((((((5152) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_014740d5ec7675e5036c0058() {
  return __cxx_static_address_014740d5ec7675e5036c0058.reference || (__cxx_static_address_014740d5ec7675e5036c0058.reference = {
    __cReference: true,
    get value() { return ONFIRE____header_global_69fd150774e908e6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:795
export const ONFIRESMOKE____header_global_c735586711b3ff11 = ((((((5143) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_054aac43c58ea97707f57186() {
  return __cxx_static_address_054aac43c58ea97707f57186.reference || (__cxx_static_address_054aac43c58ea97707f57186.reference = {
    __cReference: true,
    get value() { return ONFIRESMOKE____header_global_c735586711b3ff11; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:796
export const BURNEDCORPSE____header_global_d5041b36aab63285 = ((((((5173) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d0ade5b2e324b5ee78f34c82() {
  return __cxx_static_address_d0ade5b2e324b5ee78f34c82.reference || (__cxx_static_address_d0ade5b2e324b5ee78f34c82.reference = {
    __cReference: true,
    get value() { return BURNEDCORPSE____header_global_d5041b36aab63285; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:797
export const WHISPYSMOKE____header_global_17c2eca58105b0fc = ((((((5268) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bedae8d8d18e4af59d4c4b3c() {
  return __cxx_static_address_bedae8d8d18e4af59d4c4b3c.reference || (__cxx_static_address_bedae8d8d18e4af59d4c4b3c.reference = {
    __cReference: true,
    get value() { return WHISPYSMOKE____header_global_17c2eca58105b0fc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:798
export const FIREFLY____header_global_30bf3ba16496db43 = ((((((5180) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a34598a58ec33bb230489b3e() {
  return __cxx_static_address_a34598a58ec33bb230489b3e.reference || (__cxx_static_address_a34598a58ec33bb230489b3e.reference = {
    __cReference: true,
    get value() { return FIREFLY____header_global_30bf3ba16496db43; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:799
export const FIREFLYSHRINKEFFECT____header_global_2c2b90ffdb068a16 = ((((((5360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5f8c8236ac02d699ebd74018() {
  return __cxx_static_address_5f8c8236ac02d699ebd74018.reference || (__cxx_static_address_5f8c8236ac02d699ebd74018.reference = {
    __cReference: true,
    get value() { return FIREFLYSHRINKEFFECT____header_global_2c2b90ffdb068a16; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:800
export const FIREFLYGROWEFFECT____header_global_4b9ae520315013d6 = ((((((5367) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_435379ceaf483bcdb4ee16bc() {
  return __cxx_static_address_435379ceaf483bcdb4ee16bc.reference || (__cxx_static_address_435379ceaf483bcdb4ee16bc.reference = {
    __cReference: true,
    get value() { return FIREFLYGROWEFFECT____header_global_4b9ae520315013d6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:801
export const FIREFLYFLYINGEFFECT____header_global_24825f438990210a = ((((((5296) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9bb0d6567a2b9477155ef3d4() {
  return __cxx_static_address_9bb0d6567a2b9477155ef3d4.reference || (__cxx_static_address_9bb0d6567a2b9477155ef3d4.reference = {
    __cReference: true,
    get value() { return FIREFLYFLYINGEFFECT____header_global_24825f438990210a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:802
export const BOSS5____header_global_f5da9733e8f1f16d = ((((((5310) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_926533eb9d5ac1f614036eda() {
  return __cxx_static_address_926533eb9d5ac1f614036eda.reference || (__cxx_static_address_926533eb9d5ac1f614036eda.reference = {
    __cReference: true,
    get value() { return BOSS5____header_global_f5da9733e8f1f16d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:803
export const BOSS5STAYPUT____header_global_cb09fd41e9ac6913 = ((((((5311) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f98daee0af3a3728bbeffde8() {
  return __cxx_static_address_f98daee0af3a3728bbeffde8.reference || (__cxx_static_address_f98daee0af3a3728bbeffde8.reference = {
    __cReference: true,
    get value() { return BOSS5STAYPUT____header_global_cb09fd41e9ac6913; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:804
export const LAVAPOOL____header_global_3022d200c6f2d84c = ((((((5304) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_073e3d200f6918476e0b1eaf() {
  return __cxx_static_address_073e3d200f6918476e0b1eaf.reference || (__cxx_static_address_073e3d200f6918476e0b1eaf.reference = {
    __cReference: true,
    get value() { return LAVAPOOL____header_global_3022d200c6f2d84c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:805
export const LAVASPLASH____header_global_cf7ad463eb8f7162 = ((((((5371) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_062e0442492be34d47a2ce69() {
  return __cxx_static_address_062e0442492be34d47a2ce69.reference || (__cxx_static_address_062e0442492be34d47a2ce69.reference = {
    __cReference: true,
    get value() { return LAVASPLASH____header_global_cf7ad463eb8f7162; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:806
export const LAVAPOOLBUBBLE____header_global_aac11c2d0053b559 = ((((((5207) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_36139c69377e356752df8741() {
  return __cxx_static_address_36139c69377e356752df8741.reference || (__cxx_static_address_36139c69377e356752df8741.reference = {
    __cReference: true,
    get value() { return LAVAPOOLBUBBLE____header_global_aac11c2d0053b559; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:807
export const BOSS2STAYPUT____header_global_d5f8f092f6ed197b = ((((((2711) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c21a442e3a06a99d56a292b3() {
  return __cxx_static_address_c21a442e3a06a99d56a292b3.reference || (__cxx_static_address_c21a442e3a06a99d56a292b3.reference = {
    __cReference: true,
    get value() { return BOSS2STAYPUT____header_global_d5f8f092f6ed197b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:808
export const BOSS3STAYPUT____header_global_366743da8c625273 = ((((((2761) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_561449f18fb8a56cdee19034() {
  return __cxx_static_address_561449f18fb8a56cdee19034.reference || (__cxx_static_address_561449f18fb8a56cdee19034.reference = {
    __cReference: true,
    get value() { return BOSS3STAYPUT____header_global_366743da8c625273; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:809
export const E32_TILE5736____header_global_8a5d43112cac7e6d = ((((((5736) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9bcc71704d5a0854fc2e9124() {
  return __cxx_static_address_9bcc71704d5a0854fc2e9124.reference || (__cxx_static_address_9bcc71704d5a0854fc2e9124.reference = {
    __cReference: true,
    get value() { return E32_TILE5736____header_global_8a5d43112cac7e6d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:810
export const E32_TILE5737____header_global_154f0e46923ade4d = ((((((5737) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_529280abd208465d8d1094d0() {
  return __cxx_static_address_529280abd208465d8d1094d0.reference || (__cxx_static_address_529280abd208465d8d1094d0.reference = {
    __cReference: true,
    get value() { return E32_TILE5737____header_global_154f0e46923ade4d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:811
export const E32_TILE5846____header_global_2262c66f71ff17b8 = ((((((5846) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_336863d8c586ec9b5e420fae() {
  return __cxx_static_address_336863d8c586ec9b5e420fae.reference || (__cxx_static_address_336863d8c586ec9b5e420fae.reference = {
    __cReference: true,
    get value() { return E32_TILE5846____header_global_2262c66f71ff17b8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/network.h:180
export const cSnapshotMemUsage__header_global_7b99f4f00c8db793 = u64((BigInt(u64(64)) * BigInt((BigInt((BigInt((BigInt(72) * BigInt(u64(16384)))) + BigInt((BigInt(96) * BigInt(u64(4096)))))) + BigInt((BigInt(296) * BigInt(u64(16384))))))));
function __cxx_static_address_2857ca4a2b8bcb38f25c9184() {
  return __cxx_static_address_2857ca4a2b8bcb38f25c9184.reference || (__cxx_static_address_2857ca4a2b8bcb38f25c9184.reference = {
    __cReference: true,
    get value() { return cSnapshotMemUsage__header_global_7b99f4f00c8db793; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/cmdline.cpp:29
export let g_commandSetup = i32(0);
export function __cxx_global_cell_b0440c970e7e8379f59d19e9() {
  return __cxx_global_cell_b0440c970e7e8379f59d19e9.reference || (__cxx_global_cell_b0440c970e7e8379f59d19e9.reference = {
    __cReference: true,
    get value() { return g_commandSetup; },
    set value(__cxx_lvalue_0) { g_commandSetup = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/cmdline.cpp:30
export let g_noSetup = i32(0);
export function __cxx_global_cell_2553af87fa9f43a7967c16e8() {
  return __cxx_global_cell_2553af87fa9f43a7967c16e8.reference || (__cxx_global_cell_2553af87fa9f43a7967c16e8.reference = {
    __cReference: true,
    get value() { return g_noSetup; },
    set value(__cxx_lvalue_0) { g_noSetup = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/cmdline.cpp:31
export let g_noAutoLoad = i32(0);
export function __cxx_global_cell_f496251f4ec050118ec259dc() {
  return __cxx_global_cell_f496251f4ec050118ec259dc.reference || (__cxx_global_cell_f496251f4ec050118ec259dc.reference = {
    __cReference: true,
    get value() { return g_noAutoLoad; },
    set value(__cxx_lvalue_0) { g_noAutoLoad = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/cmdline.cpp:32
export let g_noSound = i32(0);
export function __cxx_global_cell_6f3783697feff1b900f4941b() {
  return __cxx_global_cell_6f3783697feff1b900f4941b.reference || (__cxx_global_cell_6f3783697feff1b900f4941b.reference = {
    __cReference: true,
    get value() { return g_noSound; },
    set value(__cxx_lvalue_0) { g_noSound = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/cmdline.cpp:33
export let g_noMusic = i32(0);
export function __cxx_global_cell_53eb40c63961c8df63fc36b2() {
  return __cxx_global_cell_53eb40c63961c8df63fc36b2.reference || (__cxx_global_cell_53eb40c63961c8df63fc36b2.reference = {
    __cReference: true,
    get value() { return g_noMusic; },
    set value(__cxx_lvalue_0) { g_noMusic = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/cmdline.cpp:34
export let CommandMap = null;
export function __cxx_global_cell_e9e7cdf79aac46339de9f120() {
  return __cxx_global_cell_e9e7cdf79aac46339de9f120.reference || (__cxx_global_cell_e9e7cdf79aac46339de9f120.reference = {
    __cReference: true,
    get value() { return CommandMap; },
    set value(__cxx_lvalue_0) { CommandMap = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/duke3d/src/cmdline.cpp:35
export let CommandName = null;
export function __cxx_global_cell_ad89a438a2202d5a29d0d26d() {
  return __cxx_global_cell_ad89a438a2202d5a29d0d26d.reference || (__cxx_global_cell_ad89a438a2202d5a29d0d26d.reference = {
    __cReference: true,
    get value() { return CommandName; },
    set value(__cxx_lvalue_0) { CommandName = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/build/include/fix16.h:31
export const FIX16_MAX__header_global_fc5c6c6f9a61fad8 = i32(2147483647);
function __cxx_static_address_3bffb398109e26914eb4fae5() {
  return __cxx_static_address_3bffb398109e26914eb4fae5.reference || (__cxx_static_address_3bffb398109e26914eb4fae5.reference = {
    __cReference: true,
    get value() { return FIX16_MAX__header_global_fc5c6c6f9a61fad8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:32
export const FIX16_MIN__header_global_ee8bcee84041b634 = i32(2147483648);
function __cxx_static_address_1886193f6c00950d3ebd43cf() {
  return __cxx_static_address_1886193f6c00950d3ebd43cf.reference || (__cxx_static_address_1886193f6c00950d3ebd43cf.reference = {
    __cReference: true,
    get value() { return FIX16_MIN__header_global_ee8bcee84041b634; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:33
export const FIX16_OVERFLOW__header_global_938dae975d1ec013 = i32(2147483648);
function __cxx_static_address_e85cbaaf06fddc3a10232814() {
  return __cxx_static_address_e85cbaaf06fddc3a10232814.reference || (__cxx_static_address_e85cbaaf06fddc3a10232814.reference = {
    __cReference: true,
    get value() { return FIX16_OVERFLOW__header_global_938dae975d1ec013; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:35
export const fix16_one__header_global_670019fd9b1c3568 = i32(65536);
function __cxx_static_address_2520929e0cf4996fdd7de6ab() {
  return __cxx_static_address_2520929e0cf4996fdd7de6ab.reference || (__cxx_static_address_2520929e0cf4996fdd7de6ab.reference = {
    __cReference: true,
    get value() { return fix16_one__header_global_670019fd9b1c3568; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:36
export const fix16_half__header_global_12086a90123fc9d4 = i32(32768);
function __cxx_static_address_79e809b0bdc90961f9592b6e() {
  return __cxx_static_address_79e809b0bdc90961f9592b6e.reference || (__cxx_static_address_79e809b0bdc90961f9592b6e.reference = {
    __cReference: true,
    get value() { return fix16_half__header_global_12086a90123fc9d4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:37
export const flt_f161r__header_global_28574306c11ecc22 = Math.fround(Math.fround((Math.fround(1) / Math.fround(65536))));
function __cxx_static_address_9f6be4ec8597de2c6cdc2b14() {
  return __cxx_static_address_9f6be4ec8597de2c6cdc2b14.reference || (__cxx_static_address_9f6be4ec8597de2c6cdc2b14.reference = {
    __cReference: true,
    get value() { return flt_f161r__header_global_28574306c11ecc22; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/cmdline.cpp:36
export let g_forceWeaponChoice = i32(0);
export function __cxx_global_cell_358690684395ca8ea893b93b() {
  return __cxx_global_cell_358690684395ca8ea893b93b.reference || (__cxx_global_cell_358690684395ca8ea893b93b.reference = {
    __cReference: true,
    get value() { return g_forceWeaponChoice; },
    set value(__cxx_lvalue_0) { g_forceWeaponChoice = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/cmdline.cpp:37
export let g_fakeMultiMode = i32(0);
export function __cxx_global_cell_99af70ece63462b77bc5f6d7() {
  return __cxx_global_cell_99af70ece63462b77bc5f6d7.reference || (__cxx_global_cell_99af70ece63462b77bc5f6d7.reference = {
    __cReference: true,
    get value() { return g_fakeMultiMode; },
    set value(__cxx_lvalue_0) { g_fakeMultiMode = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/include/compat.h:1169
export const pow2char__header_global_f6e015a6ab8e0f2b = new Uint8Array([((1) & 255), ((2) & 255), ((4) & 255), ((8) & 255), ((16) & 255), ((32) & 255), ((64) & 255), ((128) & 255)]);
function __cxx_static_address_4022562833e05f18380b43b7() {
  return __cxx_static_address_4022562833e05f18380b43b7.reference || (__cxx_static_address_4022562833e05f18380b43b7.reference = {
    __cReference: true,
    get value() { return pow2char__header_global_f6e015a6ab8e0f2b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:172
export const g_defaultVideoModes__header_global_d6b14ecf75bda85f = [cMarkAggregate(({"x": 2560, "y": 1440})), cMarkAggregate(({"x": 2560, "y": 1200})), cMarkAggregate(({"x": 2560, "y": 1080})), cMarkAggregate(({"x": 1920, "y": 1440})), cMarkAggregate(({"x": 1920, "y": 1200})), cMarkAggregate(({"x": 1920, "y": 1080})), cMarkAggregate(({"x": 1680, "y": 1050})), cMarkAggregate(({"x": 1600, "y": 1200})), cMarkAggregate(({"x": 1600, "y": 900})), cMarkAggregate(({"x": 1366, "y": 768})), cMarkAggregate(({"x": 1280, "y": 1024})), cMarkAggregate(({"x": 1280, "y": 960})), cMarkAggregate(({"x": 1280, "y": 720})), cMarkAggregate(({"x": 1152, "y": 864})), cMarkAggregate(({"x": 1024, "y": 768})), cMarkAggregate(({"x": 1024, "y": 600})), cMarkAggregate(({"x": 800, "y": 600})), cMarkAggregate(({"x": 640, "y": 480})), cMarkAggregate(({"x": 640, "y": 400})), cMarkAggregate(({"x": 512, "y": 384})), cMarkAggregate(({"x": 480, "y": 360})), cMarkAggregate(({"x": 400, "y": 300})), cMarkAggregate(({"x": 320, "y": 240})), cMarkAggregate(({"x": 320, "y": 200})), cMarkAggregate(({"x": 0, "y": 0}))];
function __cxx_static_address_a4de923112c4910bc7f40ed0() {
  return __cxx_static_address_a4de923112c4910bc7f40ed0.reference || (__cxx_static_address_a4de923112c4910bc7f40ed0.reference = {
    __cReference: true,
    get value() { return g_defaultVideoModes__header_global_d6b14ecf75bda85f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:188
export const g_keyAsciiTable__header_global_0a138afd6e99021c = new Uint8Array([((0) & 255), ((0) & 255), 49, 50, 51, 52, 53, 54, 55, 56, 57, 48, 45, 61, ((0) & 255), ((0) & 255), 113, 119, 101, 114, 116, 121, 117, 105, 111, 112, 91, 93, ((0) & 255), ((0) & 255), 97, 115, 100, 102, 103, 104, 106, 107, 108, 59, ((39) & 255), 96, ((0) & 255), ((92) & 255), 122, 120, 99, 118, 98, 110, 109, 44, 46, 47, ((0) & 255), 42, ((0) & 255), ((32) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), 55, 56, 57, 45, 52, 53, 54, 43, 49, 50, 51, 48, 46, ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255)]);
function __cxx_static_address_c5df071af6c2dda806be5942() {
  return __cxx_static_address_c5df071af6c2dda806be5942.reference || (__cxx_static_address_c5df071af6c2dda806be5942.reference = {
    __cReference: true,
    get value() { return g_keyAsciiTable__header_global_0a138afd6e99021c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:196
export const g_keyAsciiTableShift__header_global_b7df55cfab7b9a02 = new Uint8Array([((0) & 255), ((0) & 255), 33, 64, 35, 36, 37, 94, 38, 42, 40, 41, 95, 43, ((0) & 255), ((0) & 255), 81, 87, 69, 82, 84, 89, 85, 73, 79, 80, 123, 125, ((0) & 255), ((0) & 255), 65, 83, 68, 70, 71, 72, 74, 75, 76, 58, 34, 126, ((0) & 255), 124, 90, 88, 67, 86, 66, 78, 77, 60, 62, 63, ((0) & 255), 42, ((0) & 255), ((32) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), 55, 56, 57, 45, 52, 53, 54, 43, 49, 50, 51, 48, 46, ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255)]);
function __cxx_static_address_c93e8805399d0d1dde6da7e4() {
  return __cxx_static_address_c93e8805399d0d1dde6da7e4.reference || (__cxx_static_address_c93e8805399d0d1dde6da7e4.reference = {
    __cReference: true,
    get value() { return g_keyAsciiTableShift__header_global_b7df55cfab7b9a02; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:895
export const pow2long__header_global_1c0bf27f1e4a273f = new Int32Array([1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144, 524288, 1048576, 2097152, 4194304, 8388608, 16777216, 33554432, 67108864, 134217728, 268435456, 536870912, 1073741824, 2147483647]);
function __cxx_static_address_87c31c8c62775ae09af109d8() {
  return __cxx_static_address_87c31c8c62775ae09af109d8.reference || (__cxx_static_address_87c31c8c62775ae09af109d8.reference = {
    __cReference: true,
    get value() { return pow2long__header_global_1c0bf27f1e4a273f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:907
export const pow2ulong__header_global_e50452abd4c17753 = new Uint32Array([u32(1), u32(2), u32(4), u32(8), u32(16), u32(32), u32(64), u32(128), u32(256), u32(512), u32(1024), u32(2048), u32(4096), u32(8192), u32(16384), u32(32768), u32(65536), u32(131072), u32(262144), u32(524288), u32(1048576), u32(2097152), u32(4194304), u32(8388608), u32(16777216), u32(33554432), u32(67108864), u32(134217728), u32(268435456), u32(536870912), u32(1073741824), u32(2147483648n)]);
function __cxx_static_address_99f93dde928effc9a10a363f() {
  return __cxx_static_address_99f93dde928effc9a10a363f.reference || (__cxx_static_address_99f93dde928effc9a10a363f.reference = {
    __cReference: true,
    get value() { return pow2ulong__header_global_e50452abd4c17753; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:919
export const pow264__header_global_4cebff7ecb3baade = new BigInt64Array([BigInt(i64(1)), BigInt(i64(2)), BigInt(i64(4)), BigInt(i64(8)), BigInt(i64(16)), BigInt(i64(32)), BigInt(i64(64)), BigInt(i64(128)), BigInt(i64(256)), BigInt(i64(512)), BigInt(i64(1024)), BigInt(i64(2048)), BigInt(i64(4096)), BigInt(i64(8192)), BigInt(i64(16384)), BigInt(i64(32768)), BigInt(i64(65536)), BigInt(i64(131072)), BigInt(i64(262144)), BigInt(i64(524288)), BigInt(i64(1048576)), BigInt(i64(2097152)), BigInt(i64(4194304)), BigInt(i64(8388608)), BigInt(i64(16777216)), BigInt(i64(33554432)), BigInt(i64(67108864)), BigInt(i64(134217728)), BigInt(i64(268435456)), BigInt(i64(536870912)), BigInt(i64(1073741824)), BigInt(2147483648n), BigInt(4294967296n), BigInt(8589934592n), BigInt(17179869184n), BigInt(34359738368n), BigInt(68719476736n), BigInt(137438953472n), BigInt(274877906944n), BigInt(549755813888n), BigInt(1099511627776n), BigInt(2199023255552n), BigInt(4398046511104n), BigInt(8796093022208n), BigInt(17592186044416n), BigInt(35184372088832n), BigInt(70368744177664n), BigInt(140737488355328n), BigInt(281474976710656n), BigInt(562949953421312n), BigInt(1125899906842624n), BigInt(2251799813685248n), BigInt(4503599627370496n), BigInt(9007199254740992n), BigInt(18014398509481984n), BigInt(36028797018963968n), BigInt(72057594037927936n), BigInt(144115188075855872n), BigInt(288230376151711744n), BigInt(576460752303423488n), BigInt(1152921504606846976n), BigInt(2305843009213693952n), BigInt(4611686018427387904n), BigInt(9223372036854775807n)]);
function __cxx_static_address_62586a368d9c432308f99eb1() {
  return __cxx_static_address_62586a368d9c432308f99eb1.reference || (__cxx_static_address_62586a368d9c432308f99eb1.reference = {
    __cReference: true,
    get value() { return pow264__header_global_4cebff7ecb3baade; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export function clamp__header_c949a3c8072f(__cxx_in, min, max) {
  return i32(((__cxx_in <= i32(min)) ? i32(min) : ((__cxx_in >= i32(max)) ? i32(max) : __cxx_in)));
}

export function ARRAY_SIZE__header_84a9c9d1a773(arg0) {
  return u64(8192n);
}

export function clamp__header_710e9819e984(__cxx_in, min, max) {
  return i32(((__cxx_in <= i32(min)) ? i32(min) : ((__cxx_in >= i32(max)) ? i32(max) : __cxx_in)));
}

// C/C++ source: source/build/include/smmalloc.h:859
export function _sm_malloc(allocator, bytesCount, alignment) {
  return cRecordObject(allocator).Alloc(bytesCount, alignment);
}

// C/C++ source: source/build/include/smmalloc.h:849
export function _sm_allocator_thread_cache_destroy(allocator) {
  if (cPointerCompare(allocator, null, "==")) {
    return;
  }
  cRecordObject(allocator).DestroyThreadCache();
}

// C/C++ source: source/build/include/smmalloc.h:864
export function _sm_free(allocator, p) {
  return cRecordObject(allocator).Free(p);
}
