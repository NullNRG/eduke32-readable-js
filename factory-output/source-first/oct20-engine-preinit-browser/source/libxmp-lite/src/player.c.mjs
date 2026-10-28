// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/libxmp-lite/src/player.c
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
const u64 = value => BigInt.asUintN(64, BigInt(value));

// C/C++ source: source/build/include/fix16.h:111
export const fix16_rad_to_deg_mult__header_global_eb9a6d67dc1bb6b2 = i32(3754936);
function __cxx_static_address_652680597e80941423e30c00() {
  return __cxx_static_address_652680597e80941423e30c00.reference || (__cxx_static_address_652680597e80941423e30c00.reference = {
    __cReference: true,
    get value() { return fix16_rad_to_deg_mult__header_global_eb9a6d67dc1bb6b2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:114
export const fix16_deg_to_rad_mult__header_global_75d1ef196719a17b = i32(1144);
function __cxx_static_address_f00b4ed7c98a112f2309c8fe() {
  return __cxx_static_address_f00b4ed7c98a112f2309c8fe.reference || (__cxx_static_address_f00b4ed7c98a112f2309c8fe.reference = {
    __cReference: true,
    get value() { return fix16_deg_to_rad_mult__header_global_75d1ef196719a17b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:31
export const FIX16_MAX__header_global_1da9092f3c2dc6a5 = i32(2147483647);
function __cxx_static_address_ce214fb073c3ce67d0d33e2d() {
  return __cxx_static_address_ce214fb073c3ce67d0d33e2d.reference || (__cxx_static_address_ce214fb073c3ce67d0d33e2d.reference = {
    __cReference: true,
    get value() { return FIX16_MAX__header_global_1da9092f3c2dc6a5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:32
export const FIX16_MIN__header_global_6a76d07bcb13f9f8 = i32(2147483648);
function __cxx_static_address_30e28d52ba55a6e9634cc7a1() {
  return __cxx_static_address_30e28d52ba55a6e9634cc7a1.reference || (__cxx_static_address_30e28d52ba55a6e9634cc7a1.reference = {
    __cReference: true,
    get value() { return FIX16_MIN__header_global_6a76d07bcb13f9f8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:33
export const FIX16_OVERFLOW__header_global_abd7d910c042185f = i32(2147483648);
function __cxx_static_address_5cd5af26093ce6e627ac416d() {
  return __cxx_static_address_5cd5af26093ce6e627ac416d.reference || (__cxx_static_address_5cd5af26093ce6e627ac416d.reference = {
    __cReference: true,
    get value() { return FIX16_OVERFLOW__header_global_abd7d910c042185f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:35
export const fix16_one__header_global_a281e3ba0dad392a = i32(65536);
function __cxx_static_address_c75cafba40b93890223f08e0() {
  return __cxx_static_address_c75cafba40b93890223f08e0.reference || (__cxx_static_address_c75cafba40b93890223f08e0.reference = {
    __cReference: true,
    get value() { return fix16_one__header_global_a281e3ba0dad392a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:36
export const fix16_half__header_global_cee51257b3a95647 = i32(32768);
function __cxx_static_address_7720d61c35a581725003379b() {
  return __cxx_static_address_7720d61c35a581725003379b.reference || (__cxx_static_address_7720d61c35a581725003379b.reference = {
    __cReference: true,
    get value() { return fix16_half__header_global_cee51257b3a95647; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:37
export const flt_f161r__header_global_b1ea0004cd54349e = Math.fround(Math.fround((Math.fround(1) / Math.fround(65536))));
function __cxx_static_address_2cfbe84070b6232b26465434() {
  return __cxx_static_address_2cfbe84070b6232b26465434.reference || (__cxx_static_address_2cfbe84070b6232b26465434.reference = {
    __cReference: true,
    get value() { return flt_f161r__header_global_b1ea0004cd54349e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/libxmp-lite/src/player.c:50
export const rval = [cMarkAggregate(({"s": 0, "m": 1, "d": 1})), cMarkAggregate(({"s": (-1), "m": 1, "d": 1})), cMarkAggregate(({"s": (-2), "m": 1, "d": 1})), cMarkAggregate(({"s": (-4), "m": 1, "d": 1})), cMarkAggregate(({"s": (-8), "m": 1, "d": 1})), cMarkAggregate(({"s": (-16), "m": 1, "d": 1})), cMarkAggregate(({"s": 0, "m": 2, "d": 3})), cMarkAggregate(({"s": 0, "m": 1, "d": 2})), cMarkAggregate(({"s": 0, "m": 1, "d": 1})), cMarkAggregate(({"s": 1, "m": 1, "d": 1})), cMarkAggregate(({"s": 2, "m": 1, "d": 1})), cMarkAggregate(({"s": 4, "m": 1, "d": 1})), cMarkAggregate(({"s": 8, "m": 1, "d": 1})), cMarkAggregate(({"s": 16, "m": 1, "d": 1})), cMarkAggregate(({"s": 0, "m": 3, "d": 2})), cMarkAggregate(({"s": 0, "m": 2, "d": 1})), cMarkAggregate(({"s": 0, "m": 0, "d": 1}))];
function __cxx_static_address_52a37a6ed50a93babfdc4624() {
  return __cxx_static_address_52a37a6ed50a93babfdc4624.reference || (__cxx_static_address_52a37a6ed50a93babfdc4624.reference = {
    __cReference: true,
    get value() { return rval; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/libxmp-lite/src/player.c:68
export function check_envelope_end(env, x) {
  let data = cRecordObject(env).data;
  let idx;
  if ((Boolean(i32(((~cRecordObject(env).flg) & i32((1 << 0))))) || (cRecordObject(env).npt <= 0))) {
    return i32(0);
  }
  (idx = i32(Math.imul(i32((cRecordObject(env).npt - 1)), 2)));
  if (((x >= i32((cDeref(cPointerOffset(data, idx, Int16Array.BYTES_PER_ELEMENT), Int16Array).value))) || (idx == 0))) {
    if (Boolean(i32(((~cRecordObject(env).flg) & i32((1 << 2)))))) {
      return i32(1);
    }
  }
  return i32(0);
}

// C/C++ source: source/libxmp-lite/src/player.c:88
export function get_envelope(env, x, def) {
  let x1;
  let x2;
  let y1;
  let y2;
  let data = cRecordObject(env).data;
  let idx;
  if ((((x < 0) || Boolean(i32(((~cRecordObject(env).flg) & i32((1 << 0)))))) || (cRecordObject(env).npt <= 0))) {
    return i32(def);
  }
  (idx = i32(Math.imul(i32((cRecordObject(env).npt - 1)), 2)));
  (x1 = i32((cDeref(cPointerOffset(data, idx, Int16Array.BYTES_PER_ELEMENT), Int16Array).value)));
  if (((x >= x1) || (idx == 0))) {
    return i32((cDeref(cPointerOffset(data, i32((idx + 1)), Int16Array.BYTES_PER_ELEMENT), Int16Array).value));
  }
  do {
    (idx = i32((Number(idx) - Number(2))));
    (x1 = i32((cDeref(cPointerOffset(data, idx, Int16Array.BYTES_PER_ELEMENT), Int16Array).value)));
  } while (((idx > 0) && (x1 > x)));
  (y1 = i32((cDeref(cPointerOffset(data, i32((idx + 1)), Int16Array.BYTES_PER_ELEMENT), Int16Array).value)));
  (x2 = i32((cDeref(cPointerOffset(data, i32((idx + 2)), Int16Array.BYTES_PER_ELEMENT), Int16Array).value)));
  (y2 = i32((cDeref(cPointerOffset(data, i32((idx + 3)), Int16Array.BYTES_PER_ELEMENT), Int16Array).value)));
  if (((x < x1) || (x2 < x1))) {
    return i32(y1);
  }
  return i32(((x2 == x1) ? y2 : i32((Math.trunc(i32(Math.imul(i32((y2 - y1)), i32((x - x1)))) / i32((x2 - x1))) + y1))));
}

// C/C++ source: source/libxmp-lite/src/player.c:120
export function update_envelope_xm(env, x, release) {
  let data = cRecordObject(env).data;
  let has_loop;
  let has_sus;
  let lpe;
  let lps;
  let sus;
  (has_loop = i32((cRecordObject(env).flg & i32((1 << 2)))));
  (has_sus = i32((cRecordObject(env).flg & i32((1 << 1)))));
  (lps = i32((cRecordObject(env).lps << 1)));
  (lpe = i32((cRecordObject(env).lpe << 1)));
  (sus = i32((cRecordObject(env).sus << 1)));
  if (((Boolean(has_loop) && Boolean(has_sus)) && (sus == lpe))) {
    if ((!Boolean(release))) {
      (has_sus = i32(0));
    }
  }
  if ((Boolean(has_loop) && (x > i32((i32((cDeref(cPointerOffset(data, lpe, Int16Array.BYTES_PER_ELEMENT), Int16Array).value)) + 1))))) {
    (release = i32(1));
  } else {
    if ((Boolean(has_sus) && (x > i32((i32((cDeref(cPointerOffset(data, sus, Int16Array.BYTES_PER_ELEMENT), Int16Array).value)) + 1))))) {
      (release = i32(1));
    }
  }
  if ((Boolean(has_sus) && (!Boolean(release)))) {
    if ((x >= i32((cDeref(cPointerOffset(data, sus, Int16Array.BYTES_PER_ELEMENT), Int16Array).value)))) {
      (x = i32((cDeref(cPointerOffset(data, sus, Int16Array.BYTES_PER_ELEMENT), Int16Array).value)));
    }
  }
  if ((Boolean(has_loop) && (x >= i32((cDeref(cPointerOffset(data, lpe, Int16Array.BYTES_PER_ELEMENT), Int16Array).value))))) {
    if ((!((Boolean(release) && Boolean(has_sus)) && (sus == lpe)))) {
      (x = i32((cDeref(cPointerOffset(data, lps, Int16Array.BYTES_PER_ELEMENT), Int16Array).value)));
    }
  }
  return i32(x);
}

// C/C++ source: source/libxmp-lite/src/player.c:173
export function update_envelope_it(env, x, release, key_off) {
  let data = cRecordObject(env).data;
  let has_loop;
  let has_sus;
  let lpe;
  let lps;
  let sus;
  let sue;
  (has_loop = i32((cRecordObject(env).flg & i32((1 << 2)))));
  (has_sus = i32((cRecordObject(env).flg & i32((1 << 1)))));
  (lps = i32((cRecordObject(env).lps << 1)));
  (lpe = i32((cRecordObject(env).lpe << 1)));
  (sus = i32((cRecordObject(env).sus << 1)));
  (sue = i32((cRecordObject(env).sue << 1)));
  if (((Boolean(has_sus) && Boolean(key_off)) && (x == i32((i32((cDeref(cPointerOffset(data, sue, Int16Array.BYTES_PER_ELEMENT), Int16Array).value)) + 1))))) {
    (x = i32((cDeref(cPointerOffset(data, sus, Int16Array.BYTES_PER_ELEMENT), Int16Array).value)));
  } else {
    if ((Boolean(has_sus) && (!Boolean(release)))) {
      if ((x == i32((i32((cDeref(cPointerOffset(data, sue, Int16Array.BYTES_PER_ELEMENT), Int16Array).value)) + 1)))) {
        (x = i32((cDeref(cPointerOffset(data, sus, Int16Array.BYTES_PER_ELEMENT), Int16Array).value)));
      }
    } else {
      if (Boolean(has_loop)) {
        if ((x > i32((cDeref(cPointerOffset(data, lpe, Int16Array.BYTES_PER_ELEMENT), Int16Array).value)))) {
          (x = i32((cDeref(cPointerOffset(data, lps, Int16Array.BYTES_PER_ELEMENT), Int16Array).value)));
        }
      }
    }
  }
  return i32(x);
}

// C/C++ source: source/libxmp-lite/src/player.c:209
export function update_envelope(env, x, release, key_off, it_env) {
  if ((x < 65535)) {
    ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => x, __cxx_lvalue_1 => { x = __cxx_lvalue_1; }));
  }
  if ((x < 0)) {
    return i32((-1));
  }
  if ((Boolean(i32(((~cRecordObject(env).flg) & i32((1 << 0))))) || (cRecordObject(env).npt <= 0))) {
    return i32(x);
  }
  return i32((Boolean(it_env) ? update_envelope_it(env, x, release, key_off) : update_envelope_xm(env, x, release)));
}

// C/C++ source: source/libxmp-lite/src/player.c:234
export function check_envelope_fade(env, x) {
  let data = cRecordObject(env).data;
  let idx;
  if (Boolean(i32(((~cRecordObject(env).flg) & i32((1 << 0)))))) {
    return i32(0);
  }
  (idx = i32(Math.imul(i32((cRecordObject(env).npt - 1)), 2)));
  if ((x > i32((cDeref(cPointerOffset(data, idx, Int16Array.BYTES_PER_ELEMENT), Int16Array).value)))) {
    if ((i32((cDeref(cPointerOffset(data, i32((idx + 1)), Int16Array.BYTES_PER_ELEMENT), Int16Array).value)) == 0)) {
      return i32((-1));
    } else {
      return i32(1);
    }
  }
  return i32(0);
}

// C/C++ source: source/libxmp-lite/src/player.c:352
export function apply_midi_macro_effect(xc, type, val) {
  switch (type) {
    case 0: {
      (cRecordObject(xc).filter.cutoff = i32((val << 1)));
    }
    break;
    case 1: {
      (cRecordObject(xc).filter.resonance = i32((val << 1)));
    }
    break;
  }
}

// C/C++ source: source/libxmp-lite/src/player.c:543
export function ft2_arpeggio(ctx, xc) {
  let p = cObjectFieldRef(cRecordObject(ctx), "p");
  let i;
  if (((i32((cDeref(cPointerOffset(cRecordObject(xc).arpeggio.val, 1, Int8Array.BYTES_PER_ELEMENT), Int8Array).value)) == 0) && (i32((cDeref(cPointerOffset(cRecordObject(xc).arpeggio.val, 2, Int8Array.BYTES_PER_ELEMENT), Int8Array).value)) == 0))) {
    return i32(0);
  }
  if ((cRecordObject(p).frame == 0)) {
    return i32(0);
  }
  (i = i32((cRecordObject(p).speed - (cRecordObject(p).frame % cRecordObject(p).speed))));
  if ((i == 16)) {
    return i32(0);
  } else {
    if ((i > 16)) {
      return i32((cDeref(cPointerOffset(cRecordObject(xc).arpeggio.val, 2, Int8Array.BYTES_PER_ELEMENT), Int8Array).value));
    }
  }
  return i32((cDeref(cPointerOffset(cRecordObject(xc).arpeggio.val, (i % 3), Int8Array.BYTES_PER_ELEMENT), Int8Array).value));
}

// C/C++ source: source/libxmp-lite/src/player.c:567
export function arpeggio(ctx, xc) {
  let m = cObjectFieldRef(cRecordObject(ctx), "m");
  let arp;
  if (Boolean(i32((cRecordObject(m).quirk & i32((1 << 26)))))) {
    (arp = i32(ft2_arpeggio(ctx, xc)));
  } else {
    (arp = i32((cDeref(cPointerOffset(cRecordObject(xc).arpeggio.val, cRecordObject(xc).arpeggio.count, Int8Array.BYTES_PER_ELEMENT), Int8Array).value)));
  }
  ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cObjectFieldRef(cRecordObject(xc).arpeggio, "count"));
  ((__cxx_lvalue_1) => (__cxx_lvalue_1.value = i32((Number(__cxx_lvalue_1.value) % Number(cRecordObject(xc).arpeggio.size)))))(cObjectFieldRef(cRecordObject(xc).arpeggio, "count"));
  return i32(arp);
}

// C/C++ source: source/libxmp-lite/src/player.c:584
export function is_first_frame(ctx) {
  let p = cObjectFieldRef(cRecordObject(ctx), "p");
  let m = cObjectFieldRef(cRecordObject(ctx), "m");
  switch (cRecordObject(m).read_event_type) {
    case 3:
    case 2: {
      return i32(((cRecordObject(p).frame % cRecordObject(p).speed) == 0));
    }
    default: {
      return i32((cRecordObject(p).frame == 0));
    }
  }
}

// C/C++ source: source/libxmp-lite/src/player.c:601
export function reset_channels(ctx) {
  let p = cObjectFieldRef(cRecordObject(ctx), "p");
  let m = cObjectFieldRef(cRecordObject(ctx), "m");
  let mod = cObjectFieldRef(cRecordObject(m), "mod");
  let smix = cObjectFieldRef(cRecordObject(ctx), "smix");
  let xc;
  let i;
  for ((i = i32(0)); (i < cRecordObject(p).virt.virt_channels); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; }))) {
    (xc = cPointerOffset(cRecordObject(p).xc_data, i, 480));
    cByteMemory.memset(xc, 0, 480);
    (cRecordObject(xc).ins = i32((-1)));
    (cRecordObject(xc).old_ins = i32(1));
    (cRecordObject(xc).key = i32((-1)));
    (cRecordObject(xc).volume = i32(cRecordObject(m).volbase));
  }
  for ((i = i32(0)); (i < cRecordObject(p).virt.num_tracks); ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i32((previous + 1)); __cxx_lvalue_2.value = next; return previous; })(cRef(() => i, __cxx_lvalue_3 => { i = __cxx_lvalue_3; }))) {
    (xc = cPointerOffset(cRecordObject(p).xc_data, i, 480));
    if (((i >= cRecordObject(mod).chn) && (i < i32((cRecordObject(mod).chn + cRecordObject(smix).chn))))) {
      (cRecordObject(xc).mastervol = i32(64));
      (cRecordObject(xc).pan.val = i32(128));
    } else {
      (cRecordObject(xc).mastervol = i32((cPointerElementRef(cRecordObject(mod).xxc, i).value).vol));
      (cRecordObject(xc).pan.val = i32((cPointerElementRef(cRecordObject(mod).xxc, i).value).pan));
    }
    (cRecordObject(xc).filter.cutoff = i32(255));
    if (Boolean(i32(((cPointerElementRef(cRecordObject(mod).xxc, i).value).flg & i32((1 << 2)))))) {
      let j;
      (cRecordObject(xc).split = ((((i32((i32((i32(((cPointerElementRef(cRecordObject(mod).xxc, i).value).flg & 48)) >> 4)) + 1))) & 255)) & 255));
      for ((j = i32(0)); (j < i); ((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = i32((previous + 1)); __cxx_lvalue_4.value = next; return previous; })(cRef(() => j, __cxx_lvalue_5 => { j = __cxx_lvalue_5; }))) {
        if (Boolean(i32(((cPointerElementRef(cRecordObject(mod).xxc, j).value).flg & i32((1 << 2)))))) {
          if ((i32((cPointerElementRef(cRecordObject(p).xc_data, j).value).split) == i32(cRecordObject(xc).split))) {
            ((cPointerElementRef(cRecordObject(p).xc_data, j).value).pair = ((((i) & 255)) & 255));
            (cRecordObject(xc).pair = ((((j) & 255)) & 255));
          }
        }
      }
    } else {
      (cRecordObject(xc).split = ((((0) & 255)) & 255));
    }
    if (Boolean(i32(((cPointerElementRef(cRecordObject(mod).xxc, i).value).flg & i32((1 << 4)))))) {
      (cRecordObject(xc).pan.surround = i32(1));
    }
  }
}

// C/C++ source: source/libxmp-lite/src/player.c:675
export function check_delay(ctx, e, chn) {
  let p, xc, m;
  __source_exit_do_delay: {
    p = cObjectFieldRef(cRecordObject(ctx), "p");
    xc = cPointerOffset(cRecordObject(p).xc_data, chn, 480);
    m = cObjectFieldRef(cRecordObject(ctx), "m");
    if ((((i32(cRecordObject(e).fxt) == 15) && (i32(cRecordObject(e).fxp) < 32)) || (i32(cRecordObject(e).fxt) == 163))) {
      if (Boolean(cRecordObject(e).fxp)) {
        (cRecordObject(p).speed = i32(cRecordObject(e).fxp));
      }
    }
    if ((((i32(cRecordObject(e).f2t) == 15) && (i32(cRecordObject(e).f2p) < 32)) || (i32(cRecordObject(e).f2t) == 163))) {
      if (Boolean(cRecordObject(e).f2p)) {
        (cRecordObject(p).speed = i32(cRecordObject(e).f2p));
      }
    }
    if ((((i32(cRecordObject(e).fxt) == 14) && (i32((i32((i32(cRecordObject(e).fxp) & 240)) >> 4)) == 13)) && Boolean(i32((i32(cRecordObject(e).fxp) & 15))))) {
      (cRecordObject(xc).delay = i32((i32((i32(cRecordObject(e).fxp) & 15)) + 1)));
      break __source_exit_do_delay;
    }
    if ((((i32(cRecordObject(e).f2t) == 14) && (i32((i32((i32(cRecordObject(e).f2p) & 240)) >> 4)) == 13)) && Boolean(i32((i32(cRecordObject(e).f2p) & 15))))) {
      (cRecordObject(xc).delay = i32((i32((i32(cRecordObject(e).f2p) & 15)) + 1)));
      break __source_exit_do_delay;
    }
    return i32(0);
  }
  cByteMemory.memcpy(cObjectFieldRef(cRecordObject(xc), "delayed_event"), e, 8);
  if (Boolean(cRecordObject(e).ins)) {
    (cRecordObject(xc).delayed_ins = i32(cRecordObject(e).ins));
  }
  if (Boolean(i32((cRecordObject(m).quirk & i32((1 << 25)))))) {
    if (((((i32(cRecordObject(e).vol) == 0) && (i32(cRecordObject(e).f2t) == 0)) && (i32(cRecordObject(e).ins) == 0)) && (i32(cRecordObject(e).note) != 129))) {
      (cRecordObject(xc).delayed_event.vol = ((((i32((cRecordObject(xc).volume + 1))) & 255)) & 255));
    }
    if ((i32(cRecordObject(e).note) == 0)) {
      (cRecordObject(xc).delayed_event.note = ((((i32((cRecordObject(xc).key + 1))) & 255)) & 255));
    }
    if ((i32(cRecordObject(e).ins) == 0)) {
      (cRecordObject(xc).delayed_event.ins = ((((cRecordObject(xc).old_ins) & 255)) & 255));
    }
  }
  return i32(1);
}

// C/C++ source: source/libxmp-lite/src/player.c:802
export function tremor_ft2(ctx, chn, finalvol) {
  let p = cObjectFieldRef(cRecordObject(ctx), "p");
  let xc = cPointerOffset(cRecordObject(p).xc_data, chn, 480);
  if (Boolean(i32((i32(cRecordObject(xc).tremor.count) & 128)))) {
    if (((!(!Boolean(i32((cRecordObject(xc).flags & i32((1 << 27))))))) && (cRecordObject(p).frame != 0))) {
      ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = (((__cxx_lvalue_0.value & (~32))) & 255)))(cObjectFieldRef(cRecordObject(xc).tremor, "count"));
      if ((i32(cRecordObject(xc).tremor.count) == 128)) {
        (cRecordObject(xc).tremor.count = ((((i32((i32(cRecordObject(xc).tremor.up) | 192))) & 255)) & 255));
      } else {
        if ((i32(cRecordObject(xc).tremor.count) == 192)) {
          (cRecordObject(xc).tremor.count = ((((i32((i32(cRecordObject(xc).tremor.down) | 128))) & 255)) & 255));
        } else {
          ((__cxx_lvalue_1) => { const previous = __cxx_lvalue_1.value; const next = (((previous - 1)) & 255); __cxx_lvalue_1.value = next; return previous; })(cObjectFieldRef(cRecordObject(xc).tremor, "count"));
        }
      }
    }
    if ((i32((i32(cRecordObject(xc).tremor.count) & 224)) == 128)) {
      (finalvol = i32(0));
    }
  }
  return i32(finalvol);
}

// C/C++ source: source/libxmp-lite/src/player.c:829
export function tremor_s3m(ctx, chn, finalvol) {
  let p = cObjectFieldRef(cRecordObject(ctx), "p");
  let xc = cPointerOffset(cRecordObject(p).xc_data, chn, 480);
  if ((!(!Boolean(i32((cRecordObject(xc).flags & i32((1 << 27)))))))) {
    if ((i32(cRecordObject(xc).tremor.count) == 0)) {
      (cRecordObject(xc).tremor.count = ((((i32((i32(cRecordObject(xc).tremor.up) | 128))) & 255)) & 255));
    } else {
      if ((i32(cRecordObject(xc).tremor.count) == 128)) {
        (cRecordObject(xc).tremor.count = ((cRecordObject(xc).tremor.down) & 255));
      }
    }
    ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = (((previous - 1)) & 255); __cxx_lvalue_0.value = next; return previous; })(cObjectFieldRef(cRecordObject(xc).tremor, "count"));
    if (Boolean(i32(((~i32(cRecordObject(xc).tremor.count)) & 128)))) {
      (finalvol = i32(0));
    }
  }
  return i32(finalvol);
}

// C/C++ source: source/libxmp-lite/src/player.c:1301
export function update_volume(ctx, chn) {
  let p = cObjectFieldRef(cRecordObject(ctx), "p");
  let m = cObjectFieldRef(cRecordObject(ctx), "m");
  let f = cObjectFieldRef(cRecordObject(p), "flow");
  let xc = cPointerOffset(cRecordObject(p).xc_data, chn, 480);
  if ((((cRecordObject(p).frame % cRecordObject(p).speed) != 0) || Boolean(i32((cRecordObject(m).quirk & i32((1 << 6))))))) {
    if ((!(!Boolean(i32((cRecordObject(xc).flags & i32((1 << 20)))))))) {
      ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = i32((Number(__cxx_lvalue_0.value) + Number(cRecordObject(xc).gvol.slide)))))(cObjectFieldRef(cRecordObject(p), "gvol"));
    }
    if (((!(!Boolean(i32((cRecordObject(xc).flags & i32((1 << 0))))))) || (!(!Boolean(i32((cRecordObject(xc).per_flags & i32((1 << 0))))))))) {
      ((__cxx_lvalue_1) => (__cxx_lvalue_1.value = i32((Number(__cxx_lvalue_1.value) + Number(cRecordObject(xc).vol.slide)))))(cObjectFieldRef(cRecordObject(xc), "volume"));
    }
    if ((!(!Boolean(i32((cRecordObject(xc).flags & i32((1 << 13)))))))) {
      ((__cxx_lvalue_2) => (__cxx_lvalue_2.value = i32((Number(__cxx_lvalue_2.value) + Number(cRecordObject(xc).vol.slide2)))))(cObjectFieldRef(cRecordObject(xc), "volume"));
    }
    if ((!(!Boolean(i32((cRecordObject(xc).flags & i32((1 << 9)))))))) {
      ((__cxx_lvalue_3) => (__cxx_lvalue_3.value = i32((Number(__cxx_lvalue_3.value) + Number(cRecordObject(xc).trackvol.slide)))))(cObjectFieldRef(cRecordObject(xc), "mastervol"));
    }
  }
  if (((cRecordObject(p).frame % cRecordObject(p).speed) == 0)) {
    if ((!(!Boolean(i32((cRecordObject(xc).flags & i32((1 << 6)))))))) {
      ((__cxx_lvalue_4) => (__cxx_lvalue_4.value = i32((Number(__cxx_lvalue_4.value) + Number(cRecordObject(xc).vol.fslide)))))(cObjectFieldRef(cRecordObject(xc), "volume"));
    }
    if ((!(!Boolean(i32((cRecordObject(xc).flags & i32((1 << 25)))))))) {
      if (((!Boolean(cRecordObject(f).rowdelay_set)) || Boolean(i32((cRecordObject(f).rowdelay_set & i32((1 << 1))))))) {
        ((__cxx_lvalue_5) => (__cxx_lvalue_5.value = i32((Number(__cxx_lvalue_5.value) + Number(cRecordObject(xc).vol.fslide2)))))(cObjectFieldRef(cRecordObject(xc), "volume"));
      }
    }
    if ((!(!Boolean(i32((cRecordObject(xc).flags & i32((1 << 10)))))))) {
      ((__cxx_lvalue_6) => (__cxx_lvalue_6.value = i32((Number(__cxx_lvalue_6.value) + Number(cRecordObject(xc).trackvol.fslide)))))(cObjectFieldRef(cRecordObject(xc), "mastervol"));
    }
    if ((!(!Boolean(i32((cRecordObject(xc).flags & i32((1 << 20)))))))) {
      ((__cxx_lvalue_7) => (__cxx_lvalue_7.value = i32((Number(__cxx_lvalue_7.value) + Number(cRecordObject(xc).gvol.fslide)))))(cObjectFieldRef(cRecordObject(p), "gvol"));
    }
  }
  do {
    if ((cRecordObject(xc).volume < 0)) {
      (cRecordObject(xc).volume = i32(0));
    } else {
      if ((cRecordObject(xc).volume > cRecordObject(m).volbase)) {
        (cRecordObject(xc).volume = i32(cRecordObject(m).volbase));
      }
    }
  } while (Boolean(0));
  do {
    if ((cRecordObject(p).gvol < 0)) {
      (cRecordObject(p).gvol = i32(0));
    } else {
      if ((cRecordObject(p).gvol > cRecordObject(m).gvolbase)) {
        (cRecordObject(p).gvol = i32(cRecordObject(m).gvolbase));
      }
    }
  } while (Boolean(0));
  do {
    if ((cRecordObject(xc).mastervol < 0)) {
      (cRecordObject(xc).mastervol = i32(0));
    } else {
      if ((cRecordObject(xc).mastervol > cRecordObject(m).volbase)) {
        (cRecordObject(xc).mastervol = i32(cRecordObject(m).volbase));
      }
    }
  } while (Boolean(0));
  if (Boolean(cRecordObject(xc).split)) {
    ((cPointerElementRef(cRecordObject(p).xc_data, cRecordObject(xc).pair).value).volume = i32(cRecordObject(xc).volume));
  }
}

// C/C++ source: source/libxmp-lite/src/player.c:1466
export function update_pan(ctx, chn) {
  let p = cObjectFieldRef(cRecordObject(ctx), "p");
  let xc = cPointerOffset(cRecordObject(p).xc_data, chn, 480);
  if ((!(!Boolean(i32((cRecordObject(xc).flags & i32((1 << 1)))))))) {
    if (Boolean(is_first_frame(ctx))) {
      ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = i32((Number(__cxx_lvalue_0.value) + Number(cRecordObject(xc).pan.fslide)))))(cObjectFieldRef(cRecordObject(xc).pan, "val"));
    } else {
      ((__cxx_lvalue_1) => (__cxx_lvalue_1.value = i32((Number(__cxx_lvalue_1.value) + Number(cRecordObject(xc).pan.slide)))))(cObjectFieldRef(cRecordObject(xc).pan, "val"));
    }
    if ((cRecordObject(xc).pan.val < 0)) {
      (cRecordObject(xc).pan.val = i32(0));
    } else {
      if ((cRecordObject(xc).pan.val > 255)) {
        (cRecordObject(xc).pan.val = i32(255));
      }
    }
  }
}

// C/C++ source: source/libxmp-lite/src/player.c:1724
export function libxmp_player_set_release(ctx, chn) {
  let p = cObjectFieldRef(cRecordObject(ctx), "p");
  let xc = cPointerOffset(cRecordObject(p).xc_data, chn, 480);
  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = i32((__cxx_lvalue_0.value | i32((i32((1 << 1)) | i32((1 << 10))))))))(cObjectFieldRef(cRecordObject(xc), "note_flags"));
}

// C/C++ source: source/libxmp-lite/src/player.c:1732
export function libxmp_player_set_fadeout(ctx, chn) {
  let p = cObjectFieldRef(cRecordObject(ctx), "p");
  let xc = cPointerOffset(cRecordObject(p).xc_data, chn, 480);
  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = i32((__cxx_lvalue_0.value | i32((1 << 0))))))(cObjectFieldRef(cRecordObject(xc), "note_flags"));
}

// C/C++ source: source/libxmp-lite/src/player.c:1742
export function update_from_ord_info(ctx) {
  let p = cObjectFieldRef(cRecordObject(ctx), "p");
  let m = cObjectFieldRef(cRecordObject(ctx), "m");
  let oinfo = cPointerOffset(cRecordObject(m).xxo_info, cRecordObject(p).ord, 20);
  if (Boolean(cRecordObject(oinfo).speed)) {
    (cRecordObject(p).speed = i32(cRecordObject(oinfo).speed));
  }
  (cRecordObject(p).bpm = i32(cRecordObject(oinfo).bpm));
  (cRecordObject(p).gvol = i32(cRecordObject(oinfo).gvl));
  (cRecordObject(p).current_time = cRecordObject(oinfo).time);
  (cRecordObject(p).frame_time = ((cRecordObject(m).time_factor * cRecordObject(m).rrate) / cRecordObject(p).bpm));
}

// C/C++ source: source/libxmp-lite/src/player.c:1760
export function libxmp_reset_flow(ctx) {
  let f = cObjectFieldRef(cRecordObject(ctx).p, "flow");
  (cRecordObject(f).jumpline = i32(0));
  (cRecordObject(f).jump = i32((-1)));
  (cRecordObject(f).pbreak = i32(0));
  (cRecordObject(f).loop_chn = i32(0));
  (cRecordObject(f).delay = i32(0));
  (cRecordObject(f).rowdelay = i32(0));
  (cRecordObject(f).rowdelay_set = i32(0));
}

// C/C++ source: source/libxmp-lite/src/player.c:1894
export function check_end_of_module(ctx) {
  let p = cObjectFieldRef(cRecordObject(ctx), "p");
  let f = cObjectFieldRef(cRecordObject(p), "flow");
  if (((cRecordObject(p).ord == (cPointerElementRef(cRecordObject(p).scan, cRecordObject(p).sequence).value).ord) && (cRecordObject(p).row == (cPointerElementRef(cRecordObject(p).scan, cRecordObject(p).sequence).value).row))) {
    if ((cRecordObject(f).end_point == 0)) {
      ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cObjectFieldRef(cRecordObject(p), "loop_count"));
      (cRecordObject(f).end_point = i32((cPointerElementRef(cRecordObject(p).scan, cRecordObject(p).sequence).value).num));
    }
    ((__cxx_lvalue_1) => { const previous = __cxx_lvalue_1.value; const next = i32((previous - 1)); __cxx_lvalue_1.value = next; return previous; })(cObjectFieldRef(cRecordObject(f), "end_point"));
  }
}

// C/C++ source: source/libxmp-lite/src/player.c:2117
export function xmp_get_module_info(opaque, info) {
  let ctx = opaque;
  let m = cObjectFieldRef(cRecordObject(ctx), "m");
  let mod = cObjectFieldRef(cRecordObject(m), "mod");
  if ((cRecordObject(ctx).state < 1)) {
    return;
  }
  cByteMemory.memcpy(cRecordObject(info).md5, cRecordObject(m).md5, u64(16));
  (cRecordObject(info).mod = mod);
  (cRecordObject(info).comment = cRecordObject(m).comment);
  (cRecordObject(info).num_sequences = i32(cRecordObject(m).num_sequences));
  (cRecordObject(info).seq_data = cRecordObject(m).seq_data);
  (cRecordObject(info).vol_base = i32(cRecordObject(m).volbase));
}

// C/C++ source: source/libxmp-lite/src/player.c:2134
export function xmp_get_frame_info(opaque, info) {
  let ctx = opaque;
  let p = cObjectFieldRef(cRecordObject(ctx), "p");
  let s = cObjectFieldRef(cRecordObject(ctx), "s");
  let m = cObjectFieldRef(cRecordObject(ctx), "m");
  let mod = cObjectFieldRef(cRecordObject(m), "mod");
  let chn;
  let i;
  if ((cRecordObject(ctx).state < 1)) {
    return;
  }
  (chn = i32(cRecordObject(mod).chn));
  if (((cRecordObject(p).pos >= 0) && (cRecordObject(p).pos < cRecordObject(mod).len))) {
    (cRecordObject(info).pos = i32(cRecordObject(p).pos));
  } else {
    (cRecordObject(info).pos = i32(0));
  }
  (cRecordObject(info).pattern = i32((cDeref(cPointerOffset(cRecordObject(mod).xxo, cRecordObject(info).pos, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)));
  if ((cRecordObject(info).pattern < cRecordObject(mod).pat)) {
    (cRecordObject(info).num_rows = i32(cRecordObject((cPointerElementRef(cRecordObject(mod).xxp, cRecordObject(info).pattern).value)).rows));
  } else {
    (cRecordObject(info).num_rows = i32(0));
  }
  (cRecordObject(info).row = i32(cRecordObject(p).row));
  (cRecordObject(info).frame = i32(cRecordObject(p).frame));
  (cRecordObject(info).speed = i32(cRecordObject(p).speed));
  (cRecordObject(info).bpm = i32(cRecordObject(p).bpm));
  (cRecordObject(info).total_time = i32((cPointerElementRef(cRecordObject(p).scan, cRecordObject(p).sequence).value).time));
  (cRecordObject(info).frame_time = i32((cRecordObject(p).frame_time * 1000)));
  (cRecordObject(info).time = i32(cRecordObject(p).current_time));
  (cRecordObject(info).buffer = cRecordObject(s).buffer);
  (cRecordObject(info).total_size = i32(Math.trunc(i32(Math.imul(i32(Math.imul(5, 49170)), 2)) / 20)));
  (cRecordObject(info).buffer_size = i32(cRecordObject(s).ticksize));
  if (Boolean(i32(((~cRecordObject(s).format) & i32((1 << 2)))))) {
    ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = i32(Math.imul(__cxx_lvalue_0.value, 2))))(cObjectFieldRef(cRecordObject(info), "buffer_size"));
  }
  if (Boolean(i32(((~cRecordObject(s).format) & i32((1 << 0)))))) {
    ((__cxx_lvalue_1) => (__cxx_lvalue_1.value = i32(Math.imul(__cxx_lvalue_1.value, 2))))(cObjectFieldRef(cRecordObject(info), "buffer_size"));
  }
  (cRecordObject(info).volume = i32(cRecordObject(p).gvol));
  (cRecordObject(info).loop_count = i32(cRecordObject(p).loop_count));
  (cRecordObject(info).virt_channels = i32(cRecordObject(p).virt.virt_channels));
  (cRecordObject(info).virt_used = i32(cRecordObject(p).virt.virt_used));
  (cRecordObject(info).sequence = i32(cRecordObject(p).sequence));
  if (cPointerCompare(cRecordObject(p).xc_data, null, "!=")) {
    for ((i = i32(0)); (i < chn); ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i32((previous + 1)); __cxx_lvalue_2.value = next; return previous; })(cRef(() => i, __cxx_lvalue_3 => { i = __cxx_lvalue_3; }))) {
      let c = cPointerOffset(cRecordObject(p).xc_data, i, 480);
      let ci = cPointerOffset(cRecordObject(info).channel_info, i, 24);
      let track;
      let event;
      let trk;
      (cRecordObject(ci).note = ((((cRecordObject(c).key) & 255)) & 255));
      (cRecordObject(ci).pitchbend = ((((((cRecordObject(c).info_pitchbend) << 16) >> 16)) << 16) >> 16));
      (cRecordObject(ci).period = u32(cRecordObject(c).info_period));
      (cRecordObject(ci).position = u32(cRecordObject(c).info_position));
      (cRecordObject(ci).instrument = ((((cRecordObject(c).ins) & 255)) & 255));
      (cRecordObject(ci).sample = ((((cRecordObject(c).smp) & 255)) & 255));
      (cRecordObject(ci).volume = ((((i32((cRecordObject(c).info_finalvol >> 4))) & 255)) & 255));
      (cRecordObject(ci).pan = ((((cRecordObject(c).info_finalpan) & 255)) & 255));
      (cRecordObject(ci).reserved = ((((0) & 255)) & 255));
      cByteMemory.memset(cObjectFieldRef(cRecordObject(ci), "event"), 0, 8);
      if (((cRecordObject(info).pattern < cRecordObject(mod).pat) && (cRecordObject(info).row < cRecordObject(info).num_rows))) {
        (trk = i32((cDeref(cPointerOffset(cRecordObject((cPointerElementRef(cRecordObject(mod).xxp, cRecordObject(info).pattern).value)).index, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
        (track = (cPointerElementRef(cRecordObject(mod).xxt, trk).value));
        if ((cRecordObject(info).row < cRecordObject(track).rows)) {
          (event = cPointerOffset(cRecordObject(track).event, cRecordObject(info).row, 8));
          cByteMemory.memcpy(cObjectFieldRef(cRecordObject(ci), "event"), event, 8);
        }
      }
    }
  }
}

// C/C++ source: source/build/include/compat.h:1169
export const pow2char__header_global_0edd2006a624fdf1 = new Uint8Array([((1) & 255), ((2) & 255), ((4) & 255), ((8) & 255), ((16) & 255), ((32) & 255), ((64) & 255), ((128) & 255)]);
function __cxx_static_address_bd6d623787a718c874e18737() {
  return __cxx_static_address_bd6d623787a718c874e18737.reference || (__cxx_static_address_bd6d623787a718c874e18737.reference = {
    __cReference: true,
    get value() { return pow2char__header_global_0edd2006a624fdf1; },
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
